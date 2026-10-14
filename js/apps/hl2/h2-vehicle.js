(function (H) {
  'use strict';

  const SPEC = {
    airboat: { half: 1.25, height: 1.0, eye: 1.5, accel: 15, max: 19, landMax: 8, rev: 5, turn: 1.7, water: true },
    buggy: { half: 1.3, height: 1.3, eye: 1.45, accel: 12, max: 21, landMax: 21, rev: 6, turn: 1.9, water: false }
  };

  function make(game, type, x, z, yaw, o = {}) {
    const sp = SPEC[type];
    const g = game.world.spawnY(x, z, o.from, sp.half * 0.7);
    const wl = game.world.waterAt(x, z);
    const y = o.y !== undefined && o.y !== null ? o.y : Math.max(g, sp.water && wl > g ? wl - 0.15 : g);
    const v = {
      id: o.id || type, kind: 'vehicle', type, spec: sp, pos: { x, y, z }, yaw, vel: { x: 0, y: 0, z: 0 }, driver: null,
      gun: !!o.gun, heat: 0, overheat: false, fireCd: 0, locked: !!o.locked, noExit: !!o.noExit, onGround: true, groundVy: 0, prevY: y,
      bob: 0, pitch: 0, roll: 0, enterT: -9, engine: 0, stalled: false, tauCharge: 0,
      box() { const h = sp.half; return { x1: this.pos.x - h, y1: this.pos.y, z1: this.pos.z - h, x2: this.pos.x + h, y2: this.pos.y + sp.height, z2: this.pos.z + h, ref: this }; },
      eye() { const f = H.forward(this.yaw); return { x: this.pos.x - f.x * 0.3, y: this.pos.y + sp.eye + this.bob, z: this.pos.z - f.z * 0.3 }; }
    };
    game.vehicles.push(v);
    return v;
  }

  function step(game, v, inp, dt) {
    const w = game.world, sp = v.spec;
    const f = H.forward(v.yaw), r = H.rightOf(v.yaw);
    const g = w.surfaceAt(v.pos.x, v.pos.z, v.pos.y + 0.6, sp.half * 0.6);
    const wl = w.waterAt(v.pos.x, v.pos.z);
    const deep = wl > g + 0.25;
    const onWater = sp.water && deep && v.pos.y <= wl + 0.35;
    let throttle = inp ? H.clamp(inp.fwd || 0, -1, 1) : 0;
    const steer = inp ? H.clamp(inp.side || 0, -1, 1) : 0;
    if (!sp.water && wl > v.pos.y + 0.7) { v.stalled = true; throttle = 0; }
    else v.stalled = false;
    let fs = v.vel.x * f.x + v.vel.z * f.z;
    let ls = v.vel.x * r.x + v.vel.z * r.z;
    const maxF = onWater || !sp.water ? sp.max : sp.landMax;
    const grounded = v.onGround || onWater;
    if (grounded) {
      if (throttle > 0) fs = Math.min(maxF, fs + sp.accel * throttle * dt * (fs < 0 ? 2 : 1));
      else if (throttle < 0) fs = Math.max(-sp.rev, fs + sp.accel * throttle * dt * (fs > 0 ? 1.8 : 0.8));
      else fs *= Math.max(0, 1 - (onWater ? 0.45 : 1.6) * dt);
      if (fs > maxF) fs = H.approach(fs, maxF, 10 * dt);
      const handbrake = inp && inp.jump && !sp.water;
      const latK = onWater ? 1.3 : handbrake ? 1.2 : 9;
      ls *= Math.max(0, 1 - latK * dt);
      if (handbrake) fs *= Math.max(0, 1 - 0.8 * dt);
      const turnScale = sp.water ? Math.min(1, Math.abs(fs) / 4 + 0.35) : H.clamp(Math.abs(fs) / 5, 0, 1) * Math.sign(fs || 1);
      const dyaw = -steer * sp.turn * turnScale * dt * (handbrake ? 1.5 : 1);
      v.yaw = H.wrapAngle(v.yaw + dyaw);
      if (v.driver) v.driver.yaw += dyaw;
      const nf = H.forward(v.yaw), nr = H.rightOf(v.yaw);
      v.vel.x = nf.x * fs + nr.x * ls;
      v.vel.z = nf.z * fs + nr.z * ls;
    }
    if (onWater) {
      const target = wl - 0.12;
      v.vel.y += ((target - v.pos.y) * 30 - v.vel.y * 6) * dt;
      v.bob = Math.sin(game.time * 3) * 0.03 + Math.min(0.08, Math.abs(fs) * 0.004);
    } else {
      v.vel.y -= H.GRAVITY * dt;
      v.bob = H.approach(v.bob, 0, dt);
    }
    const extra = game.obstaclesFor(v, { skipVehicle: v });
    const before = H.vcopy(v.vel);
    const res = w.moveBox(v.pos, sp.half, sp.height, { x: v.vel.x * dt, y: v.vel.y * dt, z: v.vel.z * dt }, { step: 0.85, grounded: grounded, extra, maxSlope: 0.8 });
    const hitSpeed = Math.max(res.hitX ? Math.abs(before.x) : 0, res.hitZ ? Math.abs(before.z) : 0);
    for (const hit of [res.hitX, res.hitZ]) {
      if (hit && hit.ref && hit.ref.kind === 'prop' && hit.ref.mass < 400) {
        const q = hit.ref;
        H.Phys.wake(q);
        q.vel.x = v.vel.x * 1.1 + (game.rng() - 0.5) * 2; q.vel.z = v.vel.z * 1.1 + (game.rng() - 0.5) * 2; q.vel.y = 2 + Math.abs(fs) * 0.2;
        q.thrownBy = 'player'; q.thrownT = game.time;
      }
    }
    if (res.hitX) v.vel.x *= -0.2;
    if (res.hitZ) v.vel.z *= -0.2;
    if (hitSpeed > 6) {
      game.emit({ type: 'sound', name: 'vehicle_crash', pos: v.pos, vol: Math.min(1, hitSpeed / 15) });
      game.emit({ type: 'shake', amount: Math.min(0.7, hitSpeed / 25), dur: 0.3 });
    }
    const wasGround = v.onGround;
    v.onGround = res.onGround;
    if (res.hitY && v.vel.y < 0) {
      if (before.y < -8 && v.driver) game.emit({ type: 'sound', name: 'vehicle_land', pos: v.pos });
      v.vel.y = 0;
    }
    if (v.onGround || onWater) v.groundVy = H.lerp(v.groundVy, (v.pos.y - v.prevY) / dt, 0.5);
    if (wasGround && !v.onGround && !onWater && v.groundVy > 0.8) v.vel.y = Math.max(v.vel.y, v.groundVy * 0.95);
    if (!v.onGround && !onWater && wasGround && v.vel.y <= 0) {
      const probe = H.vcopy(v.pos);
      const r2 = w.moveBox(probe, sp.half, sp.height, { x: 0, y: -0.5, z: 0 }, { extra });
      if (r2.onGround) { v.pos.y = probe.y; v.onGround = true; v.vel.y = 0; }
    }
    v.prevY = v.pos.y;
    const speed = Math.hypot(v.vel.x, v.vel.z);
    v.engine = H.lerp(v.engine, Math.abs(throttle) * 0.6 + speed / 25, dt * 3);
    v.pitch = H.lerp(v.pitch, v.onGround || onWater ? -H.clamp(v.groundVy / Math.max(3, speed), -0.4, 0.4) : H.clamp(-v.vel.y * 0.03, -0.3, 0.3), dt * 5);
    v.roll = H.lerp(v.roll, -steer * Math.min(1, speed / 10) * 0.12, dt * 4);
    if (speed > 4 && v.driver) runOver(game, v, speed);
    if (v.driver && game.rng() < dt * speed * 0.8 && onWater) game.fx.splash({ x: v.pos.x - f.x * 1.6, y: wl, z: v.pos.z - f.z * 1.6 }, 0.5);
    if (v.pos.y < -60) { v.pos.y = 5; }
  }

  function runOver(game, v, speed) {
    const b = v.box();
    for (const n of game.npcs) {
      if (!n.alive || n.def.flying || n.def.height > 3) continue;
      if (n.pos.x < b.x1 - 0.4 || n.pos.x > b.x2 + 0.4 || n.pos.z < b.z1 - 0.4 || n.pos.z > b.z2 + 0.4 || n.pos.y > b.y2 || n.pos.y + n.def.height < b.y1) continue;
      if (game.time - (n.runOverT || -9) < 0.6) continue;
      n.runOverT = game.time;
      const dir = H.vnorm(v.vel);
      if (n.team === 'rebel' || n.essential) { n.vel.x += dir.x * 4; n.vel.z += dir.z * 4; n.knockT = 0.3; continue; }
      game.damageNpc(n, speed * 9, { type: 'crush', attacker: v, dir, pos: H.vcopy(n.pos), force: 6 });
      game.emit({ type: 'sound', name: 'vehicle_hit', pos: n.pos });
    }
  }

  function fire(game, v, inp, pr, dt) {
    v.fireCd -= dt;
    v.heat = Math.max(0, v.heat - dt * (v.overheat ? 0.45 : 0.3));
    if (v.overheat && v.heat <= 0.05) v.overheat = false;
    if (!v.gun || !inp.fire1 || v.fireCd > 0 || v.overheat) return;
    const eye = game.eye(), d = game.aimDir();
    const f = H.forward(v.yaw);
    const mount = { x: v.pos.x + f.x * 1.1, y: v.pos.y + 1.25, z: v.pos.z + f.z * 1.1 };
    if (v.type === 'airboat') {
      v.fireCd = 0.05;
      v.heat += 0.022;
      if (v.heat >= 1) { v.overheat = true; game.emit({ type: 'sound', name: 'overheat' }); }
      game.emit({ type: 'sound', name: 'airboat_gun', vol: 0.7 });
      game.fireBullet(eye, d, 0.02, 3, game.player, 'airboatgun', mount, 160);
      game.fx.muzzle(mount, [0.5, 0.8, 1], 0.3);
      game.noise(v.pos, 40, game.player);
    } else {
      v.fireCd = 0.22;
      game.emit({ type: 'sound', name: 'tau' });
      const h = game.traceLine(eye, d, 120, { ignore: game.player, ignoreVehicle: v });
      const end = h ? h.point : H.vadd(eye, d, 120);
      game.fx.beam(mount, end, [1, 0.8, 0.4], 0.05, 0.1);
      if (h) game.applyHit(h, 16, { type: 'bullet', attacker: game.player, dir: d, weapon: 'tau', impulse: 400 });
      game.noise(v.pos, 40, game.player);
    }
  }

  H.Vehicle = { make, step, fire, SPEC };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
