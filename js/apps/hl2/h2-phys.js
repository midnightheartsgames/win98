(function (H) {
  'use strict';

  const G = () => H.GRAVITY;

  function propBox(p) {
    return { x1: p.pos.x - p.half.x, y1: p.pos.y, z1: p.pos.z - p.half.z, x2: p.pos.x + p.half.x, y2: p.pos.y + p.half.y * 2, z2: p.pos.z + p.half.z, ref: p };
  }

  function makeProp(game, type, x, y, z, o = {}) {
    const def = H.PROPS[type];
    if (!def) throw new Error('hl2: unknown prop ' + type);
    const yaw = o.yaw || 0;
    const quarter = Math.abs(Math.round(yaw / (Math.PI / 2))) % 2 === 1;
    const hx = quarter ? def.size[2] : def.size[0], hz = quarter ? def.size[0] : def.size[2];
    const p = {
      id: o.id || ('p' + (game.nextId++)), kind: 'prop', type, def, tag: o.tag || null,
      pos: { x, y, z }, vel: { x: 0, y: 0, z: 0 }, half: { x: hx, y: def.size[1], z: hz },
      mass: def.mass, yaw, rot: { p: 0, r: 0 }, spin: { p: 0, r: 0, y: 0 },
      hp: def.hp || 0, sleeping: !!o.sleep, sleepT: 0, onGround: false, inWater: false, held: null, frozen: !!o.frozen,
      contains: o.contains || null, lastHitT: -9, thrownBy: null, thrownT: -9, burning: 0, ignite: 0, dead: false, supportT: 0
    };
    game.props.push(p);
    return p;
  }

  function density(p) {
    return p.def.density !== undefined ? p.def.density : 2.5;
  }

  function stepProps(game, dt) {
    const world = game.world;
    const props = game.props;
    const obstacles = [];
    for (const q of props) if (!q.dead && !q.held) obstacles.push(propBox(q));
    for (const d of game.doors) if (d.solid) obstacles.push(d.box);
    for (const s of game.surfaces) for (const b of s.boxes) obstacles.push(b);
    for (const v of game.vehicles) obstacles.push(v.box());
    for (const p of props) {
      if (p.dead) continue;
      if (p.ignite > 0) {
        p.ignite -= dt;
        if (p.ignite <= 0) breakProp(game, p, null);
        continue;
      }
      if (p.frozen && !p.held) continue;
      if (p.held) { stepHeld(game, p, dt, obstacles); continue; }
      if (p.sleeping) {
        p.supportT -= dt;
        if (p.supportT <= 0) {
          p.supportT = 0.3 + Math.random() * 0.1;
          const extra = obstacles.filter(o => o.ref !== p);
          const probe = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
          const r = world.moveBox(probe, p.half.x, p.half.y * 2, { x: 0, y: -0.03, z: 0 }, { hz: p.half.z, extra });
          if (!r.onGround && probe.y < p.pos.y - 0.01) wake(p);
        }
        if (p.sleeping) continue;
      }
      const wl = world.waterAt(p.pos.x, p.pos.z);
      const hh = p.half.y * 2;
      const sub = wl > p.pos.y ? H.clamp((wl - p.pos.y) / hh, 0, 1) : 0;
      p.inWater = sub > 0;
      if (p.def.float) {
        const flying = p.thrownT > game.time - 4;
        const k = flying ? 1 : Math.max(0, 1 - 3 * dt);
        p.vel.x *= k; p.vel.y *= k; p.vel.z *= k;
        if (!flying && Math.abs(p.vel.y) < 0.3) p.vel.y = Math.sin(game.time * 2 + p.pos.x) * 0.15;
      } else p.vel.y -= G() * dt;
      if (sub > 0) {
        p.vel.y += G() * sub / density(p) * dt;
        const drag = Math.max(0, 1 - 2.2 * dt * sub);
        p.vel.x *= drag; p.vel.z *= drag; p.vel.y *= Math.max(0, 1 - 3 * dt * sub);
      }
      const speed0 = Math.hypot(p.vel.x, p.vel.y, p.vel.z);
      const extra = [];
      for (const o of obstacles) if (o.ref !== p) extra.push(o);
      const before = { x: p.vel.x, y: p.vel.y, z: p.vel.z };
      const p0 = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
      const r = world.moveBox(p.pos, p.half.x, hh, { x: p.vel.x * dt, y: p.vel.y * dt, z: p.vel.z * dt }, { hz: p.half.z, extra, step: 0 });
      const realSpeed = Math.hypot(p.pos.x - p0.x, p.pos.y - p0.y, p.pos.z - p0.z) / dt;
      const bounce = p.def.bounce !== undefined ? p.def.bounce : 0.18;
      const wasGround = p.onGround;
      p.onGround = r.onGround;
      let impact = 0;
      if (r.hitX) { impact = Math.max(impact, Math.abs(before.x)); collide(game, p, r.hitX, 'x', before.x, bounce); }
      if (r.hitZ) { impact = Math.max(impact, Math.abs(before.z)); collide(game, p, r.hitZ, 'z', before.z, bounce); }
      if (r.hitY) {
        impact = Math.max(impact, Math.abs(before.y));
        if (before.y < -2.5) p.vel.y = -before.y * bounce;
        else p.vel.y = 0;
        if (r.hitY.ref && r.hitY.ref.kind === 'prop' && before.y < -6) hitProp(game, r.hitY.ref, p, Math.abs(before.y));
      }
      if (impact > 3.2 && game.time - p.lastHitT > 0.12) {
        p.lastHitT = game.time;
        game.emit({ type: 'sound', name: 'impact_' + (p.def.mat || 'metal'), pos: p.pos, vol: Math.min(1, impact / 12) });
        if (p.def.hp && impact > 9) damageProp(game, p, (impact - 8) * (p.mass > 20 ? 2 : 1), { type: 'crush' });
        if (p.def.explode && impact > 9 && p.thrownT > game.time - 4) damageProp(game, p, 99, { type: 'crush' });
      }
      if (p.onGround) {
        const fr = sub > 0 ? 3 : 7;
        const k = Math.max(0, 1 - fr * dt);
        p.vel.x *= k; p.vel.z *= k;
        p.rot.p = H.approach(p.rot.p, Math.round(p.rot.p / (Math.PI / 2)) * (Math.PI / 2), dt * 5);
        p.rot.r = H.approach(p.rot.r, Math.round(p.rot.r / (Math.PI / 2)) * (Math.PI / 2), dt * 5);
        p.spin.p *= 0.8; p.spin.r *= 0.8; p.spin.y *= 0.85;
        if (!wasGround && speed0 > 2) p.spin.y += (Math.random() - 0.5) * speed0 * 0.3;
      } else {
        p.rot.p += p.spin.p * dt;
        p.rot.r += p.spin.r * dt;
      }
      p.yaw += p.spin.y * dt;
      const sp = Math.hypot(p.vel.x, p.vel.y, p.vel.z);
      if (p.def.float) { if (sp > 4.5 && realSpeed > 4.5) propHitsCreatures(game, p, sp); continue; }
      if (sp < 0.08 && (p.onGround || sub > 0.05)) {
        if (sub > 0.05 && Math.abs(p.vel.y) > 0.05) { p.sleepT = 0; continue; }
        p.sleepT += dt;
        if (p.sleepT > 0.6 && sub < 0.05) { p.sleeping = true; p.vel.x = p.vel.y = p.vel.z = 0; p.supportT = 0.3; }
      } else p.sleepT = 0;
      if (sp > 4.5 && realSpeed > 4.5) propHitsCreatures(game, p, Math.min(sp, realSpeed + 2));
      if (p.pos.y < -80) p.dead = true;
    }
    for (let i = props.length - 1; i >= 0; i--) if (props[i].dead) props.splice(i, 1);
  }

  function collide(game, p, hit, axis, v, bounce) {
    const other = hit.ref;
    if (other && other.kind === 'prop' && !other.frozen) {
      const m1 = p.mass, m2 = other.mass;
      const e = 0.2;
      const u2 = other.vel[axis];
      const v1 = (m1 * v + m2 * u2 - m2 * e * (v - u2)) / (m1 + m2);
      const v2 = (m1 * v + m2 * u2 + m1 * e * (v - u2)) / (m1 + m2);
      p.vel[axis] = v1;
      other.vel[axis] = v2;
      wake(other);
      if (Math.abs(v) > 7) hitProp(game, other, p, Math.abs(v));
    } else if (other && other.ref && other.ref.kind === 'vehicle') {
      p.vel[axis] = -v * bounce;
    } else {
      p.vel[axis] = -v * bounce;
      if (Math.abs(v) > 2) { p.spin.p += (Math.random() - 0.5) * 6; p.spin.r += (Math.random() - 0.5) * 6; }
    }
  }

  function hitProp(game, target, by, speed) {
    if (target.def.hp && speed > 6) damageProp(game, target, (speed - 6) * Math.min(2, by.mass / 15), { type: 'crush' });
  }

  function wake(p) {
    if (!p.sleeping) return;
    p.sleeping = false;
    p.sleepT = 0;
  }

  function stepHeld(game, p, dt, obstacles) {
    const h = p.held;
    const target = h.target;
    const dx = target.x - p.pos.x, dy = target.y - p.pos.y, dz = target.z - p.pos.z;
    const d = Math.hypot(dx, dy, dz);
    const maxV = 22;
    const k = Math.min(1, 14 * dt);
    let vx = dx * k / dt, vy = dy * k / dt, vz = dz * k / dt;
    const vl = Math.hypot(vx, vy, vz);
    if (vl > maxV) { vx *= maxV / vl; vy *= maxV / vl; vz *= maxV / vl; }
    const extra = [];
    for (const o of obstacles) if (o.ref !== p && !(o.ref && o.ref === game.player)) extra.push(o);
    for (const n of game.npcs) if (n.alive && !n.def.flying && n !== h.npcHeld) extra.push(game.npcBox(n));
    const before = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
    game.world.moveBox(p.pos, p.half.x, p.half.y * 2, { x: vx * dt, y: vy * dt, z: vz * dt }, { hz: p.half.z, extra });
    p.vel.x = (p.pos.x - before.x) / dt;
    p.vel.y = (p.pos.y - before.y) / dt;
    p.vel.z = (p.pos.z - before.z) / dt;
    p.yaw = H.turnTo(p.yaw, h.yaw, dt * 6);
    p.rot.p = H.approach(p.rot.p, 0, dt * 4);
    p.rot.r = H.approach(p.rot.r, 0, dt * 4);
    h.stuck = d > 2.2 ? (h.stuck || 0) + dt : 0;
    p.sleeping = false;
    p.onGround = false;
  }

  function propHitsCreatures(game, p, speed) {
    if (p.mass < 2 && !p.def.sharp) return;
    const b = propBox(p);
    const thrownByPlayer = p.thrownBy === 'player' && game.time - p.thrownT < 3;
    for (const n of game.npcs) {
      if (!n.alive || n.def.invulnerable) continue;
      if (p.lastVictim === n && game.time - p.lastVictimT < 0.5) continue;
      const nb = game.npcBox(n);
      if (nb.x2 < b.x1 || nb.x1 > b.x2 || nb.y2 < b.y1 || nb.y1 > b.y2 || nb.z2 < b.z1 || nb.z1 > b.z2) continue;
      let dmg = p.def.sharp ? 120 : Math.min(250, p.mass * (speed - 4) * 0.55);
      if (p.def.model === 'energyball') dmg = 500;
      if (dmg < 3) continue;
      p.lastVictim = n; p.lastVictimT = game.time;
      game.damageNpc(n, dmg, { type: p.def.sharp ? 'slash' : 'crush', attacker: thrownByPlayer ? game.player : null, dir: H.vnorm(p.vel), pos: H.vcopy(n.pos) });
      if (!p.def.sharp) { p.vel.x *= 0.5; p.vel.z *= 0.5; }
    }
    if (p.thrownBy !== 'player' && p.thrownT > game.time - 3 && !game.player.dead) {
      const pl = game.player;
      const pb = game.playerBox();
      if (!(pb.x2 < b.x1 || pb.x1 > b.x2 || pb.y2 < b.y1 || pb.y1 > b.y2 || pb.z2 < b.z1 || pb.z1 > b.z2) && game.time - (p.lastPlayerHitT || -9) > 0.6) {
        p.lastPlayerHitT = game.time;
        game.damagePlayer(Math.min(40, p.mass * (speed - 4) * 0.35), { type: 'crush', dir: H.vnorm(p.vel) });
        pl.vel.x += p.vel.x * 0.3; pl.vel.z += p.vel.z * 0.3;
      }
    }
  }

  function damageProp(game, p, amount, info = {}) {
    if (p.dead) return;
    if (info.impulse) {
      wake(p);
      const k = info.impulse / Math.max(1, p.mass);
      p.vel.x += info.dir.x * k; p.vel.y += info.dir.y * k + (info.lift || 0); p.vel.z += info.dir.z * k;
      p.spin.p += (Math.random() - 0.5) * 4; p.spin.r += (Math.random() - 0.5) * 4;
    }
    if (!p.def.hp) return;
    p.hp -= amount;
    if (p.def.explode && p.hp <= 0 && p.ignite <= 0) {
      if (info.type === 'blast') { p.ignite = 0.15 + Math.random() * 0.25; p.hp = 0; return; }
      breakProp(game, p, info);
      return;
    }
    if (p.def.explode && p.hp > 0 && (info.type === 'bullet' || info.type === 'fire') && p.hp < p.def.hp * 0.6) p.burning = Math.max(p.burning, 1);
    if (p.hp <= 0) breakProp(game, p, info);
  }

  function breakProp(game, p, info) {
    if (p.dead) return;
    p.dead = true;
    if (p.held) game.dropHeld(false);
    const c = { x: p.pos.x, y: p.pos.y + p.half.y, z: p.pos.z };
    if (p.def.explode) {
      explode(game, c, p.def.explode.dmg, p.def.explode.radius, p.thrownBy === 'player' ? game.player : null);
    } else {
      game.emit({ type: 'sound', name: 'break_' + (p.def.gibs || 'wood'), pos: c, vol: 1 });
      game.fx.gibs(c, p.def.gibs || 'wood', p.half);
    }
    if (p.contains) {
      const list = Array.isArray(p.contains) ? p.contains : [p.contains];
      list.forEach((it, k) => game.spawnItem(it, c.x + (k - (list.length - 1) / 2) * 0.3, c.z, { y: p.pos.y + 0.05 }));
    }
  }

  function explode(game, c, dmg, radius, attacker, o = {}) {
    game.emit({ type: 'explosion', pos: H.vcopy(c), radius });
    game.emit({ type: 'sound', name: 'explode', pos: c, vol: 1 });
    game.fx.explosion(c, radius);
    game.world.lightCache && game.addDynLight(c, [1.6, 1.0, 0.45], radius * 2.2, 0.35);
    const pl = game.player;
    const eye = { x: pl.pos.x, y: pl.pos.y + 1.0, z: pl.pos.z };
    const dPl = H.dist(eye, c);
    if (dPl < radius && !pl.dead && game.world.lineClear(c, eye)) {
      const k = 1 - dPl / radius;
      game.damagePlayer(dmg * k * (o.playerScale || 1), { type: 'blast', dir: H.vnorm(H.vsub(eye, c)), attacker });
      const push = H.vnorm(H.vsub(eye, c));
      pl.vel.x += push.x * 8 * k; pl.vel.y += 3 * k; pl.vel.z += push.z * 8 * k;
    }
    if (dPl < radius * 3) game.emit({ type: 'shake', amount: 1 - dPl / (radius * 3), dur: 0.6 });
    for (const n of game.npcs) {
      if (!n.alive) continue;
      const nc = { x: n.pos.x, y: n.pos.y + Math.min(1, n.def.height / 2), z: n.pos.z };
      const d = H.dist(nc, c) - (n.def.radius || 0.4);
      if (d >= radius) continue;
      if (!game.world.lineClear(c, nc) && d > 1) continue;
      const k = 1 - Math.max(0, d) / radius;
      game.damageNpc(n, dmg * k, { type: 'blast', attacker, dir: H.vnorm(H.vsub(nc, c)), pos: nc, force: 10 * k });
    }
    for (const p of game.props) {
      if (p.dead) continue;
      const pc = { x: p.pos.x, y: p.pos.y + p.half.y, z: p.pos.z };
      const d = H.dist(pc, c);
      if (d >= radius * 1.4) continue;
      const k = 1 - d / (radius * 1.4);
      const dir = H.vnorm(H.vsub(pc, c));
      damageProp(game, p, dmg * k, { type: 'blast', impulse: 900 * k, dir, lift: 3 * k });
    }
    for (const v of game.vehicles) {
      const d = H.dist(v.pos, c);
      if (d < radius) { v.vel.y += 4 * (1 - d / radius); }
    }
  }

  function stepSurfaces(game, dt) {
    for (const s of game.surfaces) {
      if (s.kind === 'seesaw') stepSeesaw(game, s, dt);
      else if (s.kind === 'floatramp') stepFloatRamp(game, s, dt);
    }
  }

  function surfaceY(s, x, z) {
    const along = s.axis === 'x' ? x - s.x : z - s.z;
    if (s.kind === 'seesaw') return s.yPivot + 0.1 + Math.tan(s.angle) * along;
    const t = H.clamp((along + s.len / 2) / s.len, 0, 1);
    return s.yEnd + (s.yTop - s.yEnd) * (s.highEnd > 0 ? t : 1 - t);
  }

  function rebuildSurface(game, s) {
    const segs = s.boxes;
    const n = segs.length;
    for (let k = 0; k < n; k++) {
      const a = -s.len / 2 + (k + 0.5) * (s.len / n);
      const px = s.axis === 'x' ? s.x + a : s.x, pz = s.axis === 'x' ? s.z : s.z + a;
      const y = surfaceY(s, px, pz);
      const b = segs[k];
      const hl = s.len / n / 2, hw = s.width / 2;
      b.x1 = px - (s.axis === 'x' ? hl : hw); b.x2 = px + (s.axis === 'x' ? hl : hw);
      b.z1 = pz - (s.axis === 'x' ? hw : hl); b.z2 = pz + (s.axis === 'x' ? hw : hl);
      b.y2 = y; b.y1 = y - 0.18;
    }
  }

  function makeSurface(game, sp) {
    const n = 10;
    const s = {
      kind: sp.kind, id: sp.id, x: sp.x, z: sp.z, axis: sp.axis || 'x', len: sp.len || (sp.rect ? (sp.axis === 'z' ? Math.abs(sp.rect[3] - sp.rect[1]) : Math.abs(sp.rect[2] - sp.rect[0])) : 6),
      width: sp.width || (sp.rect ? (sp.axis === 'z' ? Math.abs(sp.rect[2] - sp.rect[0]) : Math.abs(sp.rect[3] - sp.rect[1])) : 1.4),
      yPivot: sp.yPivot || 0, angle: sp.angle0 || 0, maxAngle: sp.maxAngle || 0.42, bias: sp.bias || 0, avel: 0,
      yLow: sp.yLow, yHigh: sp.yHigh, yEnd: sp.yLow, yTop: sp.yTop !== undefined ? sp.yTop : sp.yHigh, highEnd: sp.highEnd || 1, need: sp.need || 3, count: 0,
      boxes: [], tex: sp.tex || 'planks', cages: sp.cages || null
    };
    for (let k = 0; k < n; k++) s.boxes.push({ x1: 0, y1: 0, z1: 0, x2: 0, y2: 0, z2: 0, surface: s, tex: s.tex });
    rebuildSurface(game, s);
    game.surfaces.push(s);
    return s;
  }

  function onSurface(s, pos, r) {
    const lo = -s.len / 2 - r, hi = s.len / 2 + r;
    const along = s.axis === 'x' ? pos.x - s.x : pos.z - s.z;
    const side = s.axis === 'x' ? pos.z - s.z : pos.x - s.x;
    if (along < lo || along > hi || Math.abs(side) > s.width / 2 + r) return null;
    const y = surfaceY(s, s.axis === 'x' ? pos.x : s.x, s.axis === 'x' ? s.z : pos.z);
    if (Math.abs(pos.y - y) > 0.35) return null;
    return along;
  }

  function stepSeesaw(game, s, dt) {
    let torque = s.bias;
    const pl = game.player;
    if (!pl.dead && !pl.vehicle) {
      const a = onSurface(s, pl.pos, 0.3);
      if (a !== null) torque -= 85 * a;
    }
    for (const p of game.props) {
      if (p.dead || p.held) continue;
      const a = onSurface(s, p.pos, p.half.x);
      if (a !== null) torque -= p.mass * a;
    }
    for (const n of game.npcs) {
      if (!n.alive || n.def.flying) continue;
      const a = onSurface(s, n.pos, 0.3);
      if (a !== null) torque -= 80 * a;
    }
    s.avel += (torque * 0.03 - s.avel * 3) * dt;
    const prev = s.angle;
    s.angle = H.clamp(s.angle + s.avel * dt, -s.maxAngle, s.maxAngle);
    if (s.angle === s.maxAngle || s.angle === -s.maxAngle) s.avel = 0;
    if (Math.abs(s.angle - prev) > 1e-5) {
      rebuildSurface(game, s);
      liftOnto(game, s);
    }
  }

  function stepFloatRamp(game, s, dt) {
    let count = 0;
    const r = s.axis === 'x' ? { x1: s.x - s.len / 2, x2: s.x + s.len / 2, z1: s.z - s.width / 2, z2: s.z + s.width / 2 } : { x1: s.x - s.width / 2, x2: s.x + s.width / 2, z1: s.z - s.len / 2, z2: s.z + s.len / 2 };
    for (const p of game.props) {
      if (p.dead || p.held || p.type !== 'barrel_float') continue;
      if (s.cages) {
        if (p.tethered || s.cages.some(c => p.pos.x >= c[0] && p.pos.x <= c[2] && p.pos.z >= c[1] && p.pos.z <= c[3])) {
          count++;
          if (!p.tethered) { p.tethered = true; p.frozen = true; p.vel = { x: 0, y: 0, z: 0 }; game.emit({ type: 'sound', name: 'impact_metal', pos: p.pos, vol: 0.6 }); }
        }
        continue;
      }
      if (p.pos.x < r.x1 || p.pos.x > r.x2 || p.pos.z < r.z1 || p.pos.z > r.z2) continue;
      const y = surfaceY(s, p.pos.x, p.pos.z);
      if (p.pos.y + p.half.y * 2 <= y + 0.05) count++;
    }
    s.count = count;
    const target = s.yLow + (s.yHigh - s.yLow) * Math.min(1, count / s.need);
    const prev = s.yEnd;
    s.yEnd = H.approach(s.yEnd, target, dt * 0.8);
    if (Math.abs(prev - s.yEnd) > 1e-5) {
      rebuildSurface(game, s);
      liftOnto(game, s);
    }
  }

  function liftOnto(game, s) {
    const lift = (pos, r) => {
      const lo = -s.len / 2 - r, hi = s.len / 2 + r;
      const along = s.axis === 'x' ? pos.x - s.x : pos.z - s.z;
      const side = s.axis === 'x' ? pos.z - s.z : pos.x - s.x;
      if (along < lo || along > hi || Math.abs(side) > s.width / 2 + r) return false;
      const y = surfaceY(s, s.axis === 'x' ? H.clamp(pos.x, s.x - s.len / 2, s.x + s.len / 2) : s.x, s.axis === 'x' ? s.z : H.clamp(pos.z, s.z - s.len / 2, s.z + s.len / 2));
      if (pos.y < y && pos.y > y - 0.45) { pos.y = y; return true; }
      return false;
    };
    lift(game.player.pos, 0.3);
    for (const p of game.props) if (!p.dead && !p.held && lift(p.pos, 0)) wake(p);
    for (const n of game.npcs) if (n.alive && !n.def.flying) lift(n.pos, 0.2);
    for (const v of game.vehicles) lift(v.pos, 0.5);
  }

  H.Phys = { makeProp, stepProps, damageProp, breakProp, explode, propBox, wake, makeSurface, stepSurfaces, surfaceY };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
