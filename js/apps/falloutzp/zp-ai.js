(function (Z) {
  'use strict';

  const G = Z.Game.prototype;
  const NAV = Z.NAV;

  Z.BARKS = {
    shpana: { spot: ['Опа, а кто это тут такой?', 'Э, слышь, иди сюда!', 'Гля, курьер живой!'], hurt: ['Ах ты ж…', 'Больно же!'], kill: ['Готов, лошара.'], flee: ['Пацаны, валим!'] },
    raiders: { spot: ['Мясо пришло!', 'Стой где стоишь!'], hurt: ['Зараза!'], kill: ['Минус один.'], flee: ['Ну его нафиг!'] },
    komendatura: { spot: ['Стой! Стрелять буду!', 'Нарушитель на позиции!'], hurt: ['Я ранен!', 'Санитара!'], kill: ['Цель поражена.'], flee: ['Отходим!'] },
    sich: { spot: ['А ну, стой, бисова душа!', 'Хлопцы, до бою!'], hurt: ['Ой, лышенько!'], kill: ['Царство небесное.'], flee: ['Тикаем, братцы!'] },
    coop: { spot: ['Опа, клиент пришёл.', 'Председатель велел не церемониться.'], hurt: ['Кожанку испортил!'], kill: ['Сделка закрыта.'], flee: ['Я в доле не был!'] },
    vozn: { spot: ['Спаси и сохрани…', 'Помогите!'], hurt: ['Ой!'], kill: [], flee: ['Убивают!'] },
    udarnik: { spot: ['ПЛАН! ПЛАН!', 'Пятилетку — в три дня!', 'Норма выработки — закон!'], hurt: ['Брак! Брак!'], kill: ['Сто двадцать процентов!'], flee: [] },
    robots: { spot: ['Гражданин, предъявите документы.', 'Нарушение общественного порядка. Оставайтесь на месте.'], hurt: ['Повреждение корпуса.'], kill: ['Нарушитель обезврежен.'], flee: [] },
    hobot: { spot: ['Хххххх…', 'Ффффильтррр…'], hurt: ['Хрррх!'], kill: [], flee: [] }
  };

  G.factionWar = function (fa, fb) {
    if (fa === fb) return false;
    const wild = f => f === 'beasts' || f === 'shpana' || f === 'raiders';
    if (fa === 'beasts' || fb === 'beasts') return true;
    if (fa === 'shpana' || fa === 'raiders' || fb === 'shpana' || fb === 'raiders') return !(wild(fa) && wild(fb) && fa !== 'beasts' && fb !== 'beasts');
    if (fa === 'robots' || fb === 'robots') return false;
    if ((fa === 'komendatura' && fb === 'sich') || (fa === 'sich' && fb === 'komendatura')) return !!this.flags.bridgeWar;
    return false;
  };

  G.hostileToPlayer = function (a) {
    if (a.kind === 'player' || a.dead || a.companion) return false;
    if (a.hostile) return true;
    if (a.cdef) {
      if (a.cdef.neutral && !a.provoked) return false;
      if (a.beast && this.player && this.player.sheet.has('trainer') && !a.provoked && !a.big) return false;
      if (a.robot && (this.flags.plannerPass || this.repLevel('planner').v >= 1) && !a.provoked) return false;
      return true;
    }
    if (a.faction && this.rep[a.faction]) {
      const r = this.repLevel(a.faction);
      if (r.v <= -2) return true;
    }
    return false;
  };

  G.hostileTo = function (a, b) {
    if (!a || !b || a === b || a.dead || b.dead) return false;
    if (b.kind === 'player') return this.hostileToPlayer(a);
    if (a.kind === 'player') return this.hostileToPlayer(b);
    if (a.companion) return b.companion ? false : this.hostileToPlayer(b);
    if (b.companion) return this.hostileToPlayer(a);
    if (a.ai && a.ai.grudge === b.id) return true;
    return this.factionWar(a.faction, b.faction);
  };

  G.repLevel = function (f) { const r = this.rep[f] || { fame: 0, inf: 0 }; return Z.repLevel(r.fame, r.inf); };

  G.unaware = function (t, attacker) {
    if (!t.ai || attacker.kind !== 'player') return false;
    return t.ai.state !== 'combat' && (t.ai.aware || 0) < 1 && !t.ai.alerted;
  };

  G.bark = function (a, kind) {
    const fac = a.cdef ? (a.def && a.def.startsWith('udarnik') ? 'udarnik' : a.def && a.def.startsWith('hobot') ? 'hobot' : a.robot ? 'robots' : null) : a.faction;
    const set = Z.BARKS[fac];
    if (!set || !set[kind] || !set[kind].length) return;
    if (a.barkT && this.realT - a.barkT < 6) return;
    a.barkT = this.realT;
    const text = set[kind][Math.floor(this.rng() * set[kind].length)];
    this.ev.emit('bark', { a, text });
  };

  G.navMaskFor = function (a) {
    if (a.cdef && a.cdef.aquatic) return NAV.fish;
    if (a.beast) return NAV.beast;
    return NAV.walk;
  };

  G.navFor = function () { return this.cell.nav || null; };

  G.goTo = function (a, tx, tz, speed, dt) {
    const ai = a.ai;
    const nav = this.navFor();
    const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz);
    if (d < 0.4) { a.vx = Z.approach(a.vx, 0, 12 * dt); a.vz = Z.approach(a.vz, 0, 12 * dt); return true; }
    let wx = tx, wz = tz;
    if (nav) {
      const mask = this.navMaskFor(a);
      const direct = d < 3 || nav.lineOK(nav.nearestOK(a.x, a.z, mask, 2), nav.nearestOK(tx, tz, mask, 2), mask);
      if (!direct) {
        const stale = !ai.path || !ai.pathTo || Math.hypot(ai.pathTo[0] - tx, ai.pathTo[1] - tz) > 4 || ai.pathAge > 6;
        if (stale && (this.pathBudget || 0) > 0) {
          this.pathBudget--;
          ai.path = nav.find(a.x, a.z, tx, tz, mask, 7000);
          ai.pathTo = [tx, tz];
          ai.pathAge = 0;
          ai.pathFail = !ai.path;
        }
        if (ai.path && ai.path.length) {
          while (ai.path.length > 1 && Math.hypot(ai.path[0][0] - a.x, ai.path[0][1] - a.z) < 1.2) ai.path.shift();
          wx = ai.path[0][0]; wz = ai.path[0][1];
        }
      } else ai.path = null;
      ai.pathAge = (ai.pathAge || 0) + dt;
    }
    const ex = wx - a.x, ez = wz - a.z, L = Math.hypot(ex, ez) || 1;
    let vx = ex / L * speed, vz = ez / L * speed;
    for (const o of this.cell.actors) {
      if (o === a || o.dead || o.flying) continue;
      const ox = a.x - o.x, oz = a.z - o.z, od = Math.hypot(ox, oz), min = (a.radius || 0.35) + (o.radius || 0.35) + 0.3;
      if (od < min && od > 0.01) { vx += ox / od * speed * 0.8 * (1 - od / min); vz += oz / od * speed * 0.8 * (1 - od / min); }
    }
    a.vx = Z.approach(a.vx, vx, 14 * dt);
    a.vz = Z.approach(a.vz, vz, 14 * dt);
    a.yaw = Z.turnTo(a.yaw, Z.yawOf(vx, vz), 8 * dt);
    if (a.blocked) { ai.stuck = (ai.stuck || 0) + dt; if (ai.stuck > 1.2) { ai.path = null; ai.pathAge = 99; ai.stuck = 0; ai.sidestep = (Math.random() < 0.5 ? -1 : 1); } } else ai.stuck = 0;
    if (ai.sidestep) { a.vx += Math.cos(a.yaw) * ai.sidestep * speed * 0.6; a.vz += Math.sin(a.yaw) * ai.sidestep * speed * 0.6; ai.sideT = (ai.sideT || 0) + dt; if (ai.sideT > 0.6) { ai.sidestep = 0; ai.sideT = 0; } }
    return false;
  };

  G.stopMove = function (a, dt) { a.vx = Z.approach(a.vx, 0, 14 * dt); a.vz = Z.approach(a.vz, 0, 14 * dt); };

  G.faceTo = function (a, x, z, dt, rate = 7) { a.yaw = Z.turnTo(a.yaw, Z.yawOf(x - a.x, z - a.z), rate * dt); };

  G.sightRange = function (a) {
    const base = (a.cdef && a.cdef.sight) || 34;
    const night = this.envNight || 0;
    return base * (1 - night * 0.45);
  };

  G.perceivePlayer = function (a, dt) {
    const p = this.player, ai = a.ai;
    if (!p || p.dead || p.hidden) { ai.aware = Math.max(0, (ai.aware || 0) - dt); return; }
    const dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz);
    const sneak = p.sneak;
    const skill = p.sheet.skill('sneak');
    let range = this.sightRange(a);
    if (sneak) range *= 0.42 * (1 - skill / 160);
    if (p.lightOn) range = Math.max(range, (a.cdef && a.cdef.sight) || 34);
    let seen = false;
    if (d < range) {
      const fwd = [Math.sin(a.yaw), -Math.cos(a.yaw)];
      const cos = (dx * fwd[0] + dz * fwd[1]) / (d || 1);
      const fovCos = ai.state === 'combat' || ai.state === 'search' ? -1 : 0.25;
      if (cos > fovCos || d < 2.5) {
        ai.losT = (ai.losT || 0) - dt;
        if (ai.losT <= 0) {
          ai.losT = 0.25 + Math.random() * 0.15;
          const e = [a.x, a.y + (a.height || 1.8) * 0.9, a.z];
          ai.los = this.cell.cw.los(e[0], e[1], e[2], p.x, p.y + (sneak ? 0.9 : 1.4), p.z);
        }
        seen = !!ai.los;
      }
    }
    const hear = (a.cdef && a.cdef.hear) || 26;
    let heard = 0;
    if (p.moving) {
      const steps = p.running && !p.sheet.has('silentrun') ? 1 : sneak ? 0.12 : 0.4;
      if (d < hear * steps) heard = 0.6 * (1 - d / (hear * steps + 0.01));
    }
    if (seen) ai.aware = Math.min(1.5, (ai.aware || 0) + dt * (0.6 + 3.2 * (1 - d / range)) * (sneak ? 0.55 : 1.4));
    else if (heard) ai.aware = Math.min(1.2, (ai.aware || 0) + dt * heard * (sneak ? 0.5 : 1.2));
    else ai.aware = Math.max(0, (ai.aware || 0) - dt * 0.12);
    ai.seesPlayer = seen;
    if (seen) ai.lastSeen = [p.x, p.z, this.realT];
  };

  G.stepAI = function (dt) {
    const p = this.player;
    this.pathBudget = 3;
    const env = this.lastEnv;
    this.envNight = env ? env.night : 0;
    for (const n of this.noises || []) {
      for (const a of this.cell.actors) {
        if (!a.ai || a.dead || a === n.src || a.kind === 'player') continue;
        const d = Math.hypot(a.x - n.x, a.z - n.z);
        if (d > n.r) continue;
        if (n.src && this.hostileTo(a, n.src)) {
          a.ai.alerted = true;
          a.ai.lastSeen = [n.src.x, n.src.z, this.realT];
          if (n.src.kind === 'player') a.ai.aware = Math.max(a.ai.aware || 0, 0.8);
          if (a.ai.state === 'idle') a.ai.state = 'search';
        } else if (a.ai.state === 'idle' && d < n.r * 0.6) { a.ai.lastSeen = [n.x, n.z, this.realT]; a.ai.state = 'search'; }
      }
    }
    for (const a of this.cell.actors) {
      if (!a.ai || a.kind === 'player') continue;
      if (a.dead) { a.vx = a.vz = 0; continue; }
      const dp = p ? Math.hypot(a.x - p.x, a.z - p.z) : 0;
      if (dp > 180 && !a.companion && !a.ai.always) { a.vx = a.vz = 0; continue; }
      if (a.knocked > 0 || a.downed > 0) { this.stopMove(a, dt); this.physActor(a, dt); continue; }
      if (a.ai.script) { a.ai.script(a, dt, this); this.physActor(a, dt); continue; }
      if (!a.cdef || !a.cdef.static) this.perceivePlayer(a, dt);
      if (a.ai.goal && !a.companion && a.ai.state !== 'combat' && a.ai.state !== 'flee') {
        const t = this.pickTarget(a);
        if (t) this.enterCombat(a, t);
        else if (Math.hypot(a.ai.goal[0] - a.x, a.ai.goal[1] - a.z) < 3) { a.ai.home = a.ai.goal.slice(); a.ai.goal = null; }
        else { this.goTo(a, a.ai.goal[0], a.ai.goal[1], a.cdef ? Math.min(4.2, a.cdef.speed || 3) : 4, dt); this.physActor(a, dt); continue; }
      }
      const beh = a.companion ? 'companion' : (a.cdef ? a.cdef.behavior : 'human');
      const fn = this['ai_' + beh] || this.ai_human;
      fn.call(this, a, dt);
      if (!(a.cdef && (a.cdef.static || a.cdef.flying)) && !a.underground) this.physActor(a, dt);
    }
  };

  G.physActor = function (a, dt) {
    if (a.cdef && a.cdef.aquatic && a.inWater) { a.x += a.vx * dt; a.z += a.vz * dt; a.y = Math.max(this.map.groundH(a.x, a.z), Math.min(Z.WATER_Y - 0.55, a.y)); return; }
    Z.moveActor(this.cell.cw, a, dt, { water: x => this.waterSwim(x) });
  };

  G.pickTarget = function (a) {
    const ai = a.ai;
    let best = null, bd = Infinity;
    const p = this.player;
    if (p && !p.dead && this.hostileTo(a, p) && ((ai.aware || 0) >= 1 || ai.alerted || ai.state === 'combat')) {
      const d = Math.hypot(p.x - a.x, p.z - a.z);
      best = p; bd = d * 0.9;
    }
    const range = this.sightRange(a);
    for (const o of this.cell.actors) {
      if (o === a || o.dead || o.kind === 'player' || o.hidden) continue;
      if (!this.hostileTo(a, o)) continue;
      const d = Math.hypot(o.x - a.x, o.z - a.z);
      if (d > range || d >= bd) continue;
      best = o; bd = d;
    }
    return best;
  };

  G.enterCombat = function (a, t) {
    const ai = a.ai;
    if (ai.state !== 'combat') { ai.state = 'combat'; ai.combatT = 0; this.bark(a, 'spot'); this.ev.emit('combatStart', { a, tgt: t }); }
    ai.target = t;
    if (!a.combat && !a.drawn && a.equip && a.equip.weapon) a.cool = Math.max(a.cool || 0, Z.DRAW_COOL || 0.4);
    a.combat = true;
  };

  G.ai_human = function (a, dt) {
    const ai = a.ai;
    ai.t = (ai.t || 0) - dt;
    if (ai.state !== 'combat' && ai.state !== 'flee') {
      const t = this.pickTarget(a);
      if (t && (t.kind !== 'player' || (ai.aware || 0) >= 1 || ai.alerted)) this.enterCombat(a, t);
    }
    if (ai.state === 'combat') return this.ai_combatHuman(a, dt);
    if (ai.state === 'flee') return this.ai_flee(a, dt);
    a.combat = false;
    a.aiming = false;
    if (ai.state === 'search' && ai.lastSeen) {
      if (this.goTo(a, ai.lastSeen[0], ai.lastSeen[1], 2.6, dt) || this.realT - ai.lastSeen[2] > 14) { ai.state = 'idle'; ai.alerted = false; }
      return;
    }
    if (ai.follow) {
      const f = ai.follow;
      const d = Math.hypot(f.x - a.x, f.z - a.z);
      if (d > 3) this.goTo(a, f.x, f.z, d > 8 ? 4.4 : 2.2, dt); else this.stopMove(a, dt);
      return;
    }
    if (ai.patrol && ai.patrol.length) {
      const wp = ai.patrol[ai.pi || 0];
      if (this.goTo(a, wp[0], wp[1], 1.6, dt)) { ai.wait = (ai.wait || 0) + dt; if (ai.wait > 3) { ai.wait = 0; ai.pi = ((ai.pi || 0) + 1) % ai.patrol.length; } }
      return;
    }
    this.ai_sandbox(a, dt);
  };

  G.ai_sandbox = function (a, dt) {
    const ai = a.ai;
    if (ai.talking) { this.stopMove(a, dt); if (this.player) this.faceTo(a, this.player.x, this.player.z, dt, 4); return; }
    if (!ai.wander) { this.stopMove(a, dt); if (ai.homeYaw !== undefined) a.yaw = Z.turnTo(a.yaw, ai.homeYaw, 3 * dt); const h = ai.home; if (h && Math.hypot(h[0] - a.x, h[1] - a.z) > 0.8) this.goTo(a, h[0], h[1], 1.6, dt); return; }
    if (!ai.dest || ai.t <= 0) {
      if (ai.dest && Math.hypot(ai.dest[0] - a.x, ai.dest[1] - a.z) > 0.6 && ai.t > -8) { this.goTo(a, ai.dest[0], ai.dest[1], 1.4, dt); return; }
      const R = this.rng;
      const h = ai.home || [a.x, a.z];
      const ang = R() * Math.PI * 2, r = R() * ai.wander;
      ai.dest = [h[0] + Math.cos(ang) * r, h[1] + Math.sin(ang) * r];
      const nav = this.navFor();
      if (nav) { const k = nav.nearestOK(ai.dest[0], ai.dest[1], this.navMaskFor(a), 3); if (k < 0) ai.dest = h.slice(); }
      ai.t = 4 + R() * 8;
      ai.idle = R() < 0.5;
    }
    if (ai.idle) { this.stopMove(a, dt); return; }
    if (this.goTo(a, ai.dest[0], ai.dest[1], 1.4, dt)) ai.idle = true;
  };

  G.weaponRange = function (a) {
    const wd = a.weapon();
    if (wd.wtype === 'melee' || wd.wtype === 'unarmed') return (wd.range || 1.6) + (a.radius || 0.35) * 0.5;
    return wd.range || 30;
  };

  G.ai_combatHuman = function (a, dt) {
    const ai = a.ai;
    let t = ai.target;
    ai.combatT = (ai.combatT || 0) + dt;
    if (!t || t.dead || !this.hostileTo(a, t) || (t.kind === 'player' && Math.hypot(t.x - a.x, t.z - a.z) > 120)) {
      const nt = this.pickTarget(a);
      if (nt) { ai.target = t = nt; } else { ai.state = 'search'; ai.target = null; a.combat = false; a.aiming = false; this.bark(a, 'kill'); return; }
    }
    if (a.hp < a.hpMax * 0.22 && !a.cdef && !ai.noFlee && this.rng() < 0.012) { ai.state = 'flee'; this.bark(a, 'flee'); return; }
    const wd = a.weapon();
    const d = Math.hypot(t.x - a.x, t.z - a.z);
    const melee = wd.wtype === 'melee' || wd.wtype === 'unarmed';
    const rng = this.weaponRange(a);
    const eye = this.eyeOf(a);
    const tc = [t.x, t.y + (t.height || 1.8) * 0.65, t.z];
    ai.losT2 = (ai.losT2 || 0) - dt;
    if (ai.losT2 <= 0) { ai.losT2 = 0.3; ai.clear = this.cell.cw.los(eye[0], eye[1], eye[2], tc[0], tc[1], tc[2]); if (ai.clear) ai.lastSeen = [t.x, t.z, this.realT]; }
    a.aimPitch = Math.atan2(tc[1] - eye[1], d);
    a.pitch = a.aimPitch;
    if (melee) {
      a.aiming = false;
      if (d > rng * 0.9) this.goTo(a, t.x, t.z, (a.cdef ? a.cdef.speed : 4.6) * (d > 6 ? 1 : 0.8), dt);
      else { this.stopMove(a, dt); this.faceTo(a, t.x, t.z, dt, 10); }
      if (d <= rng + 0.2 && this.canAttack(a)) { a.cool = 0; this.attack(a, { target: t }); a.cool = Math.max(a.cool, 1 / ((a.cdef && a.cdef.rof) || wd.rof || 1)); }
      return;
    }
    const want = Math.min(rng * 0.65, 22);
    a.aiming = ai.clear && d < rng * 1.6;
    if (!ai.clear) {
      const ls = ai.lastSeen || [t.x, t.z];
      this.goTo(a, ls[0], ls[1], 3.8, dt);
    } else if (d > want + 6) this.goTo(a, t.x, t.z, 3.6, dt);
    else if (d < Math.min(want * 0.5, 5)) { const L = d || 1; this.goTo(a, a.x - (t.x - a.x) / L * 4, a.z - (t.z - a.z) / L * 4, 2.6, dt); this.faceTo(a, t.x, t.z, dt, 10); }
    else {
      ai.strafeT = (ai.strafeT || 0) - dt;
      if (ai.strafeT <= 0) { ai.strafeT = 1.5 + this.rng() * 2.5; ai.strafe = this.rng() < 0.4 ? 0 : (this.rng() < 0.5 ? -1 : 1); }
      const sx = Math.cos(a.yaw) * ai.strafe * 1.8, sz = Math.sin(a.yaw) * ai.strafe * 1.8;
      a.vx = Z.approach(a.vx, sx, 10 * dt); a.vz = Z.approach(a.vz, sz, 10 * dt);
      this.faceTo(a, t.x, t.z, dt, 10);
    }
    if (ai.clear) this.faceTo(a, t.x, t.z, dt, 9);
    const we = a.equip.weapon;
    if (we && wd.mag && (we.loaded || 0) <= 0 && !(a.reloading > 0)) { if (a.count(wd.ammo) <= 0) a.give(wd.ammo, wd.mag); this.reload(a); return; }
    const grenade = a.inv.find(e => e.id === 'f1' || e.id === 'rgd' || e.id === 'molotov');
    if (grenade && ai.clear && d > 8 && d < 22 && ai.combatT > 4 && this.rng() < dt * 0.15 && this.canAttack(a)) {
      const keep = a.equip.weapon;
      a.equip.weapon = grenade;
      const dir = this.lobDir(eye, tc, 15);
      this.throwItem(a, Z.item(grenade.id), { dir, speed: 15 });
      this.later(0.4, () => { if (!a.dead) a.equip.weapon = keep && a.inv.includes(keep) ? keep : a.inv.find(e => Z.item(e.id).cat === 'weapon' && !Z.item(e.id).thrown) || null; });
      return;
    }
    ai.react = (ai.react === undefined ? 0.5 + this.rng() * 0.6 : ai.react) - dt;
    if (ai.clear && ai.react <= 0 && d < rng * 2.2 && this.canAttack(a)) {
      const dir = [tc[0] - eye[0], tc[1] - eye[1], tc[2] - eye[2]];
      const L = Math.hypot(dir[0], dir[1], dir[2]);
      this.attack(a, { dir: [dir[0] / L, dir[1] / L, dir[2] / L], aim: true });
      if (wd.auto) { ai.burst = (ai.burst || 0) + 1; if (ai.burst > 4 + this.rng() * 4) { ai.burst = 0; a.cool = 0.6 + this.rng() * 0.6; } }
      else a.cool = Math.max(a.cool, 1 / wd.rof + 0.15 + this.rng() * 0.35);
    }
  };

  G.lobDir = function (o, t, v) {
    const dx = t[0] - o[0], dz = t[2] - o[2], dy = t[1] - o[1], d = Math.hypot(dx, dz);
    const g = Z.G, v2 = v * v;
    const disc = v2 * v2 - g * (g * d * d + 2 * dy * v2);
    let ang = disc > 0 ? Math.atan((v2 - Math.sqrt(disc)) / (g * d)) : Math.PI / 4;
    ang -= 0.05;
    const c = Math.cos(ang);
    return [dx / d * c, Math.sin(ang) - 0.2, dz / d * c];
  };

  G.ai_companion = function (a, dt) {
    const ai = a.ai, p = this.player;
    if (!p) return;
    let t = ai.target && !ai.target.dead && this.hostileTo(a, ai.target) ? ai.target : null;
    if (!t && ai.mode !== 'passive') {
      let bd = 35;
      for (const o of this.cell.actors) {
        if (o.dead || o === a || o.kind === 'player' || o.companion) continue;
        if (!this.hostileToPlayer(o)) continue;
        if (!(o.ai && o.ai.state === 'combat') && !o.attackedPlayer) continue;
        const d = Math.hypot(o.x - a.x, o.z - a.z);
        if (d < bd) { bd = d; t = o; }
      }
    }
    if (t) { ai.target = t; ai.state = 'combat'; a.combat = true; return this.ai_combatHuman(a, dt); }
    ai.state = 'idle';
    a.combat = false; a.aiming = false;
    if (ai.wait) { this.stopMove(a, dt); return; }
    const d = Math.hypot(p.x - a.x, p.z - a.z);
    if (d > 60 && this.cell.exterior) { const yaw = p.yaw + Math.PI; a.x = p.x + Math.sin(yaw) * 3; a.z = p.z - Math.cos(yaw) * 3; a.y = this.cell.cw.groundAt(a.x, a.z, p.y + 2); return; }
    if (d > 4.5) this.goTo(a, p.x - Math.sin(p.yaw) * 2.5, p.z + Math.cos(p.yaw) * 2.5, d > 10 ? 4.6 : 2.4, dt);
    else { this.stopMove(a, dt); this.faceTo(a, p.x, p.z, dt, 2); }
  };

  G.creatureCombatTarget = function (a, dt) {
    const ai = a.ai;
    if (ai.state !== 'combat') {
      const t = this.pickTarget(a);
      if (t) this.enterCombat(a, t);
    }
    if (ai.state === 'combat') {
      let t = ai.target;
      if (!t || t.dead || !this.hostileTo(a, t) || Math.hypot(t.x - a.x, t.z - a.z) > 90) { t = this.pickTarget(a); ai.target = t; if (!t) { ai.state = 'idle'; a.combat = false; } }
      return ai.target;
    }
    return null;
  };

  G.creatureBite = function (a, t, dt, opts = {}) {
    const d = Math.hypot(t.x - a.x, t.z - a.z);
    const reach = (a.cdef.range || 1.4) + (t.radius || 0.35);
    this.faceTo(a, t.x, t.z, dt, 10);
    if (d <= reach && this.canAttack(a) && Math.abs((t.y) - (a.y)) < 2.5) {
      a.cool = 1 / (a.cdef.rof || 1);
      a.anim.swing = 1;
      let dmg = a.cdef.dmg * (0.85 + this.rng() * 0.3);
      const part = Z.LIMBS[Math.floor(this.rng() * 6)];
      this.later(0.18, () => {
        if (a.dead || t.dead) return;
        if (Math.hypot(t.x - a.x, t.z - a.z) > reach + 0.6) return;
        if (t.kind === 'player' && this.vatsActive) dmg *= 0.1;
        this.hitActor(t, dmg, { src: a, part: opts.part || part, knock: a.cdef.knock || 0 });
        this.ev.emit('bite', { a, tgt: t });
      });
      return true;
    }
    return false;
  };

  G.ai_swarm = function (a, dt) {
    const t = this.creatureCombatTarget(a, dt);
    if (!t) return this.ai_sandbox(a, dt);
    const d = Math.hypot(t.x - a.x, t.z - a.z);
    if (d > (a.cdef.range || 1.4) * 0.9 + (t.radius || 0.35)) {
      a.ai.jit = (a.ai.jit || 0) + dt * 3;
      const j = Math.sin(a.ai.jit + a.seed) * 1.6;
      this.goTo(a, t.x + Math.cos(a.yaw) * j, t.z + Math.sin(a.yaw) * j, a.cdef.speed, dt);
    } else this.stopMove(a, dt);
    this.creatureBite(a, t, dt);
  };

  G.ai_pack = function (a, dt) {
    const t = this.creatureCombatTarget(a, dt);
    if (!t) return this.ai_sandbox(a, dt);
    const ai = a.ai;
    const d = Math.hypot(t.x - a.x, t.z - a.z);
    ai.packT = (ai.packT || 0) - dt;
    if (ai.packT <= 0) { ai.packT = 1.2 + this.rng() * 1.8; ai.dash = this.rng() < 0.55; ai.ang = this.rng() * Math.PI * 2; }
    if (ai.dash || d < 2) { this.goTo(a, t.x, t.z, a.cdef.speed, dt); this.creatureBite(a, t, dt); }
    else { ai.ang += dt * 0.9; this.goTo(a, t.x + Math.cos(ai.ang) * 4.5, t.z + Math.sin(ai.ang) * 4.5, a.cdef.speed * 0.8, dt); }
  };

  G.ai_grazer = function (a, dt) {
    if (a.provoked) return this.ai_swarm(a, dt);
    this.ai_sandbox(a, dt);
  };

  G.ai_melee = function (a, dt) { return this.ai_swarm(a, dt); };

  G.ai_brute = function (a, dt) {
    const t = this.creatureCombatTarget(a, dt);
    if (!t) return this.ai_sandbox(a, dt);
    const ai = a.ai, d = Math.hypot(t.x - a.x, t.z - a.z);
    ai.chargeCd = (ai.chargeCd || 0) - dt;
    if (ai.charge > 0) {
      ai.charge -= dt;
      const L = d || 1;
      a.vx = (t.x - a.x) / L * a.cdef.speed * 1.9; a.vz = (t.z - a.z) / L * a.cdef.speed * 1.9;
      a.yaw = Z.yawOf(a.vx, a.vz);
      if (d < 2.4) { ai.charge = 0; this.creatureBite(a, t, dt, { part: 'torso' }); }
      return;
    }
    if (d > 5 && d < 14 && ai.chargeCd <= 0 && ai.clear !== false) { ai.charge = 1.4; ai.chargeCd = 6; this.bark(a, 'spot'); this.ev.emit('charge', { a }); return; }
    if (d > 2) this.goTo(a, t.x, t.z, a.cdef.speed, dt); else this.stopMove(a, dt);
    this.creatureBite(a, t, dt, { part: 'torso' });
  };

  G.ai_ranged = function (a, dt) {
    const t = this.creatureCombatTarget(a, dt);
    if (!t) return this.ai_sandbox(a, dt);
    return this.ai_combatHuman(a, dt);
  };

  G.ai_robot = function (a, dt) {
    const ai = a.ai, p = this.player;
    if (!this.hostileToPlayer(a)) { ai.warned = 0; return this.ai_sandbox(a, dt); }
    if (ai.state !== 'combat' && p && (ai.aware || 0) >= 1) {
      if (!ai.warned) { ai.warned = 6; this.bark(a, 'spot'); this.ev.emit('robotWarn', { a }); }
      ai.warned -= dt;
      this.faceTo(a, p.x, p.z, dt, 4);
      this.stopMove(a, dt);
      if (ai.warned > 0.01 && Math.hypot(p.x - a.x, p.z - a.z) > 30) { ai.warned = 0; ai.aware = 0; return; }
      if (ai.warned <= 0.01) this.enterCombat(a, p);
      return;
    }
    if (ai.state === 'combat') return this.ai_combatHuman(a, dt);
    this.ai_sandbox(a, dt);
  };

  G.ai_tank = function (a, dt) {
    const t = this.creatureCombatTarget(a, dt);
    if (!t) return this.ai_sandbox(a, dt);
    const ai = a.ai, d = Math.hypot(t.x - a.x, t.z - a.z);
    if (d > 28) this.goTo(a, t.x, t.z, a.cdef.speed, dt); else this.stopMove(a, dt);
    this.faceTo(a, t.x, t.z, dt, 1.2);
    const eye = [a.x, a.y + 1.5, a.z], tc = [t.x, t.y + 1.0, t.z];
    ai.losT2 = (ai.losT2 || 0) - dt;
    if (ai.losT2 <= 0) { ai.losT2 = 0.4; ai.clear = this.cell.cw.los(eye[0], eye[1], eye[2], tc[0], tc[1], tc[2]); }
    if (!ai.clear) return;
    ai.mgT = (ai.mgT || 0) - dt;
    ai.rocketT = (ai.rocketT === undefined ? 3 : ai.rocketT) - dt;
    if (ai.mgT <= 0) {
      ai.mgN = (ai.mgN || 0) + 1;
      const dir = [tc[0] - eye[0], tc[1] - eye[1], tc[2] - eye[2]], L = Math.hypot(...dir);
      const d2 = this.spreadDir([dir[0] / L, dir[1] / L, dir[2] / L], 3.5 * Math.PI / 180);
      const res = this.traceShotRaw(a, eye, d2, a.cdef.dmg);
      this.ev.emit('fire', { a, wd: { sound: 'auto', id: 'mg' }, shots: [res], muzzle: eye });
      ai.mgT = ai.mgN % 8 === 0 ? 1.4 : 0.11;
    }
    if (ai.rocketT <= 0 && a.cdef.rockets && d > 8) {
      ai.rocketT = 6 + this.rng() * 3;
      const dir = this.lobDir([a.x, a.y + 1.8, a.z], tc, 22);
      this.projs = this.projs || [];
      this.projs.push({ x: a.x, y: a.y + 1.9, z: a.z, vx: dir[0] * 22, vy: dir[1] * 22 + 2, vz: dir[2] * 22, fuse: 4, wd: { dmg: 70, radius: 5, impact: true, rocket: true }, owner: a, bounces: 0, spin: 0, rocket: true });
      this.ev.emit('rocket', { a });
    }
  };

  G.traceShotRaw = function (a, o, d, dmg) {
    const world = this.cell.cw.raycast(o[0], o[1], o[2], d[0], d[1], d[2], 140);
    const hit = this.actorRay(o[0], o[1], o[2], d[0], d[1], d[2], world ? world.t : 140, a);
    if (hit) { this.hitActor(hit.a, dmg * (hit.a.kind === 'player' && this.vatsActive ? 0.1 : 1), { src: a, part: hit.part.id, x: hit.x, y: hit.y, z: hit.z, dir: d }); return { x: hit.x, y: hit.y, z: hit.z, actor: hit.a }; }
    if (world) { this.ev.emit('impact', { x: world.x, y: world.y, z: world.z, n: world.n, surf: 'concrete' }); return { x: world.x, y: world.y, z: world.z }; }
    return { x: o[0] + d[0] * 140, y: o[1] + d[1] * 140, z: o[2] + d[2] * 140, miss: true };
  };

  G.ai_turret = function (a, dt) {
    const ai = a.ai, p = this.player;
    let t = null;
    const night = this.envNight || 0;
    for (const o of [p].concat(this.cell.actors.filter(x => x.companion))) {
      if (!o || o.dead) continue;
      const d = Math.hypot(o.x - a.x, o.z - a.z);
      if (d > a.cdef.range) continue;
      if (night > 0.6 && !o.lightOn) continue;
      if (o.sneak && d > 12 && this.rng() < 0.5) continue;
      t = o; break;
    }
    ai.headYaw = ai.headYaw === undefined ? a.yaw : ai.headYaw;
    if (!t) { ai.headYaw = Z.turnTo(ai.headYaw, (this.lastEnv ? Math.atan2(this.lastEnv.sunDir[0], -this.lastEnv.sunDir[2]) : 0), dt * 0.3); a.combat = false; return; }
    a.combat = true;
    const want = Z.yawOf(t.x - a.x, t.z - a.z);
    ai.headYaw = Z.turnTo(ai.headYaw, want, dt * 1.6);
    a.yaw = ai.headYaw;
    const head = [a.x, a.y + 2.9, a.z];
    const tc = [t.x, t.y + 1.2, t.z];
    ai.burstCd = (ai.burstCd || 0) - dt;
    if (Math.abs(Z.angDiff(ai.headYaw, want)) < 0.25 && ai.burstCd <= 0) {
      ai.losT2 = (ai.losT2 || 0) - dt;
      if (ai.losT2 <= 0) { ai.losT2 = 0.5; ai.clear = this.cell.cw.los(head[0], head[1], head[2], tc[0], tc[1], tc[2]); }
      if (ai.clear) {
        ai.shotT = (ai.shotT || 0) - dt;
        if (ai.shotT <= 0) {
          ai.shotT = 1 / a.cdef.rof;
          ai.burstN = (ai.burstN || 0) + 1;
          const dir = [tc[0] - head[0], tc[1] - head[1], tc[2] - head[2]], L = Math.hypot(...dir);
          const d2 = this.spreadDir([dir[0] / L, dir[1] / L, dir[2] / L], 4 * Math.PI / 180);
          const res = this.traceShotRaw(a, head, d2, a.cdef.dmg);
          this.ev.emit('husk', { a, from: head, to: [res.x, res.y, res.z] });
          if (ai.burstN >= (a.cdef.burst || 6)) { ai.burstN = 0; ai.burstCd = 2.2; }
        }
      }
    }
  };

  G.ai_dive = function (a, dt) {
    const ai = a.ai;
    const t = this.creatureCombatTarget(a, dt);
    const h = ai.home || [a.x, a.z];
    ai.ang = (ai.ang || this.rng() * 6) + dt * (t ? 0.9 : 0.5);
    if (!t) {
      const tx = h[0] + Math.cos(ai.ang) * 18, tz = h[1] + Math.sin(ai.ang) * 18;
      const ty = this.map.groundH(h[0], h[1]) + 16;
      this.flyTo(a, tx, ty, tz, 7, dt);
      return;
    }
    ai.diveT = (ai.diveT === undefined ? 3 + this.rng() * 3 : ai.diveT) - dt;
    if (ai.diving) {
      this.flyTo(a, t.x, t.y + 1.3, t.z, a.cdef.speed * 1.6, dt);
      const d = Math.hypot(t.x - a.x, t.z - a.z, t.y + 1.3 - a.y);
      if (d < 2) { this.creatureBite(a, t, dt); ai.diving = false; ai.diveT = 3 + this.rng() * 3; }
      if (ai.diveT < -4) { ai.diving = false; ai.diveT = 3; }
      return;
    }
    if (ai.diveT <= 0) { ai.diving = true; this.ev.emit('screech', { a }); return; }
    const tx = t.x + Math.cos(ai.ang) * 12, tz = t.z + Math.sin(ai.ang) * 12;
    this.flyTo(a, tx, Math.max(t.y, this.map.groundH(tx, tz)) + 10, tz, a.cdef.speed, dt);
  };

  G.flyTo = function (a, x, y, z, speed, dt) {
    const dx = x - a.x, dy = y - a.y, dz = z - a.z, L = Math.hypot(dx, dy, dz) || 1;
    a.vx = Z.approach(a.vx, dx / L * speed, dt * 10); a.vz = Z.approach(a.vz, dz / L * speed, dt * 10);
    a.vy = Z.approach(a.vy || 0, dy / L * speed, dt * 10);
    a.x += a.vx * dt; a.y += a.vy * dt; a.z += a.vz * dt;
    const g = this.cell.cw.groundAt(a.x, a.z, a.y + 1);
    if (a.y < g + 0.8) a.y = g + 0.8;
    a.yaw = Z.turnTo(a.yaw, Z.yawOf(a.vx, a.vz), dt * 5);
    a.flying = true;
  };

  G.ai_burrow = function (a, dt) {
    const ai = a.ai, p = this.player;
    if (ai.state !== 'combat' && p && this.hostileToPlayer(a)) {
      const d = Math.hypot(p.x - a.x, p.z - a.z);
      const vib = p.running ? 32 : p.sneak ? 5 : p.moving ? 14 : 3;
      if (d < vib || (ai.aware || 0) >= 1) { this.enterCombat(a, p); ai.phase = 'under'; a.underground = true; a.hidden = true; }
    }
    if (ai.state !== 'combat') { a.underground = false; a.hidden = false; return this.ai_sandbox(a, dt); }
    const t = ai.target && !ai.target.dead ? ai.target : p;
    if (!t || t.dead) { ai.state = 'idle'; a.underground = false; a.hidden = false; return; }
    ai.pt = (ai.pt || 0) + dt;
    if (ai.phase === 'under') {
      a.hidden = true; a.underground = true;
      const dx = t.x - a.x, dz = t.z - a.z, d = Math.hypot(dx, dz) || 1;
      a.x += dx / d * Math.min(d, a.cdef.speed * 1.4 * dt); a.z += dz / d * Math.min(d, a.cdef.speed * 1.4 * dt);
      a.y = this.cell.cw.groundAt(a.x, a.z, 100);
      ai.trailT = (ai.trailT || 0) - dt;
      if (ai.trailT <= 0) { ai.trailT = 0.12; this.ev.emit('dirt', { x: a.x, y: a.y, z: a.z }); }
      if (d < 2.2) { ai.phase = 'up'; ai.pt = 0; a.hidden = false; a.underground = false; this.ev.emit('emerge', { a }); a.cool = 0.6; }
      return;
    }
    if (ai.phase === 'up') {
      this.creatureBite(a, t, dt);
      const d = Math.hypot(t.x - a.x, t.z - a.z);
      if (d > 2.5) this.goTo(a, t.x, t.z, a.cdef.speed * 0.6, dt); else this.stopMove(a, dt);
      if (ai.pt > 4.5) { ai.phase = 'dig'; ai.pt = 0; this.ev.emit('dig', { a }); }
      return;
    }
    if (ai.phase === 'dig') {
      this.stopMove(a, dt);
      if (ai.pt > 1.0) {
        ai.phase = 'under'; ai.pt = 0;
        const ang = this.rng() * Math.PI * 2;
        a.x += Math.cos(ang) * 6; a.z += Math.sin(ang) * 6;
      }
    }
  };

  G.ai_lurk = function (a, dt) {
    const ai = a.ai, p = this.player;
    const depth = Z.WATER_Y - this.map.groundH(a.x, a.z);
    a.inWater = depth > 0.4;
    const h = ai.home || [a.x, a.z];
    if (ai.state !== 'combat') {
      if (p && this.hostileToPlayer(a)) {
        const d = Math.hypot(p.x - h[0], p.z - h[1]);
        const pDepth = Z.WATER_Y - this.map.groundH(p.x, p.z);
        if ((d < 9 && pDepth > -1.5) || (ai.aware || 0) >= 1.2) { this.enterCombat(a, p); ai.phase = 'lunge'; this.ev.emit('lunge', { a }); }
      }
      a.hidden = false;
      a.lurking = true;
      this.stopMove(a, dt);
      if (Math.hypot(h[0] - a.x, h[1] - a.z) > 1.5) this.goTo(a, h[0], h[1], 1.5, dt);
      return;
    }
    a.lurking = false;
    const t = ai.target && !ai.target.dead ? ai.target : p;
    if (!t || t.dead) { ai.state = 'idle'; return; }
    const d = Math.hypot(t.x - a.x, t.z - a.z);
    const tDepth = Z.WATER_Y - this.map.groundH(t.x, t.z);
    if (tDepth < -2.5 && d > 6) {
      ai.away = (ai.away || 0) + dt;
      if (ai.away > 3) { ai.state = 'idle'; ai.away = 0; return; }
      this.goTo(a, h[0], h[1], a.cdef.speed, dt);
      return;
    }
    ai.away = 0;
    const sp = a.inWater ? a.cdef.swimSpeed : a.cdef.speed;
    if (d > (a.cdef.range || 2) * 0.9) this.goTo(a, t.x, t.z, sp, dt); else this.stopMove(a, dt);
    if (this.creatureBite(a, t, dt) && tDepth > 0.3 && t.kind === 'player' && !t.big) {
      const L = Math.hypot(h[0] - t.x, h[1] - t.z) || 1;
      t.vx += (h[0] - t.x) / L * 3; t.vz += (h[1] - t.z) / L * 3;
      this.msg('Сом тянет вас в воду!', 'warn');
    }
  };

  G.ai_queen = function (a, dt) {
    const ai = a.ai;
    const t = this.creatureCombatTarget(a, dt);
    ai.spawnT = (ai.spawnT === undefined ? 4 : ai.spawnT) - dt;
    if (t && ai.spawnT <= 0) {
      ai.spawnT = 11;
      const kids = this.cell.actors.filter(k => k.def === 'kolorad' && !k.dead && k.mother === a).length;
      if (kids < 4) {
        const ang = this.rng() * Math.PI * 2;
        const k = this.spawnCreature('kolorad', a.x + Math.cos(ang) * 2.5, a.z + Math.sin(ang) * 2.5, { hpMult: 0.6 });
        k.mother = a;
        k.look = Object.assign({}, k.look, { scale: 0.7 });
        this.enterCombat(k, t);
        this.ev.emit('spawnBrood', { a, k });
      }
    }
    if (!t) return this.stopMove(a, dt);
    const d = Math.hypot(t.x - a.x, t.z - a.z);
    if (d > 3 && d < 20) this.goTo(a, t.x, t.z, a.cdef.speed, dt); else this.stopMove(a, dt);
    this.creatureBite(a, t, dt);
  };

  G.ai_flee_creature = function (a, dt) {
    const ai = a.ai, p = this.player;
    if (p && !p.dead) {
      const d = Math.hypot(p.x - a.x, p.z - a.z);
      if (d < 16 && (ai.aware || 0) > 0.3) {
        if (!ai.whistled) { ai.whistled = true; this.ev.emit('whistle', { a }); for (const o of this.cell.actors) if (o !== a && o.ai && !o.dead && o.cdef && Math.hypot(o.x - a.x, o.z - a.z) < 40) o.ai.aware = Math.max(o.ai.aware || 0, 1); }
        const L = d || 1;
        this.goTo(a, a.x + (a.x - p.x) / L * 8, a.z + (a.z - p.z) / L * 8, a.cdef.speed, dt);
        return;
      }
    }
    if (a.provoked && p && Math.hypot(p.x - a.x, p.z - a.z) < 3) return this.creatureBite(a, p, dt);
    this.ai_sandbox(a, dt);
  };
  G.ai_flee = function (a, dt) {
    if (a.cdef && a.cdef.behavior === 'flee') return this.ai_flee_creature(a, dt);
    const ai = a.ai, t = ai.target || this.player;
    if (!t) { ai.state = 'idle'; return; }
    const dx = a.x - t.x, dz = a.z - t.z, d = Math.hypot(dx, dz) || 1;
    if (d > 45) { ai.state = 'idle'; ai.home = [a.x, a.z]; return; }
    this.goTo(a, a.x + dx / d * 10, a.z + dz / d * 10, (a.cdef ? a.cdef.speed : 4.6), dt);
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
