(function (Z) {
  'use strict';

  const G = Z.Game.prototype;
  const SOLDIER = ['pm', 'akm', 'sks', 'f1', 'rgd'];
  const COSSACK = ['sabre', 'sabreAtaman', 'nagan', 'mosin', 'mosinScope', 'tnt'];

  Z.PARTS_HUMAN = [
    { id: 'head', name: 'Голова', y0: 0.86, y1: 1.0, mult: 2, vats: 0.55 },
    { id: 'torso', name: 'Торс', y0: 0.52, y1: 0.86, mult: 1, vats: 1 },
    { id: 'rarm', name: 'Правая рука', y0: 0.45, y1: 0.85, side: 1, mult: 0.8, vats: 0.7 },
    { id: 'larm', name: 'Левая рука', y0: 0.45, y1: 0.85, side: -1, mult: 0.8, vats: 0.7 },
    { id: 'rleg', name: 'Правая нога', y0: 0, y1: 0.52, side: 1, mult: 0.8, vats: 0.75 },
    { id: 'lleg', name: 'Левая нога', y0: 0, y1: 0.52, side: -1, mult: 0.8, vats: 0.75 }
  ];

  G.partsOf = a => (a.parts || Z.PARTS_HUMAN);

  G.partAt = function (a, hx, hy, hz) {
    const parts = this.partsOf(a);
    const h = a.height || 1.8, fy = (hy - a.y) / h;
    const rx = Math.cos(a.yaw), rz = Math.sin(a.yaw);
    const lat = (hx - a.x) * rx + (hz - a.z) * rz;
    let best = parts[0];
    for (const p of parts) {
      if (fy < p.y0 || fy > p.y1) continue;
      if (p.side && Math.sign(lat) !== p.side) continue;
      if (p.side && (p.id === 'rarm' || p.id === 'larm') && Math.abs(lat) < (a.radius || 0.35) * 0.45) continue;
      best = p;
      break;
    }
    if (!best || (fy < best.y0 || fy > best.y1)) best = parts.find(p => fy >= p.y0 && fy <= p.y1) || parts.find(p => p.id === 'torso') || parts[0];
    return best;
  };

  G.actorRay = function (ox, oy, oz, dx, dy, dz, maxT, skip) {
    let best = null;
    for (const a of this.cell.actors) {
      if (a === skip || a.dead || a.hidden || a.noHit) continue;
      const r = (a.radius || 0.35) * (a.hitScale || 1), h = a.height || 1.8;
      const fx = ox - a.x, fz = oz - a.z;
      const A = dx * dx + dz * dz, B = 2 * (fx * dx + fz * dz), C = fx * fx + fz * fz - r * r;
      let t0, t1;
      if (A < 1e-9) { if (C > 0) continue; t0 = 0; t1 = maxT; }
      else {
        const D = B * B - 4 * A * C;
        if (D < 0) continue;
        const sq = Math.sqrt(D);
        t0 = (-B - sq) / (2 * A); t1 = (-B + sq) / (2 * A);
      }
      if (t1 < 0 || t0 > maxT) continue;
      const tt = Math.max(0, t0);
      const yIn = oy + dy * tt, yOut = oy + dy * t1;
      const ylo = a.y + (a.downed ? -0.2 : 0.02), yhi = a.y + (a.downed || (a.anim && a.anim.state === 'dead') ? 0.5 : h);
      let t = tt;
      if (yIn < ylo || yIn > yhi) {
        if (Math.abs(dy) < 1e-6) continue;
        const ty = ((yIn > yhi ? yhi : ylo) - oy) / dy;
        if (ty < tt || ty > t1) continue;
        t = ty;
      }
      if (best && t >= best.t) continue;
      if (Math.min(yIn, yOut) > yhi || Math.max(yIn, yOut) < ylo) continue;
      const hx = ox + dx * t, hy = oy + dy * t, hz = oz + dz * t;
      best = { a, t, x: hx, y: hy, z: hz, part: this.partAt(a, hx, hy, hz) };
    }
    return best;
  };

  G.spreadFor = function (a, wd, opts = {}) {
    if (!wd || !wd.spread) return 0;
    const skill = a.sheet.skill(wd.skill || 'guns');
    let s = wd.spread * (1.8 - 1.2 * skill / 100);
    if (opts.aim) s *= wd.scope ? 0.3 : 0.55;
    const sp = Math.hypot(a.vx, a.vz);
    const runngun = a.sheet.has('runngun') && !wd.twoHand;
    s *= 1 + Z.clamp(sp / 4.4, 0, 1.3) * (runngun ? 0.35 : 0.8);
    if (a.sneak) s *= 0.85;
    s *= 1 + (a.crippled.rarm ? 0.5 : 0) + (a.crippled.larm ? 0.5 : 0);
    const we = a.equip.weapon;
    if (we && we.cond !== undefined) s *= 1 + (1 - we.cond) * 0.6;
    const str = a.sheet.stat('str');
    if (wd.str && str < wd.str) s *= 1 + (wd.str - str) * 0.15;
    if (a.sheet.traits.includes('fastshot')) s *= 1.2;
    if (a.sheet.traits.includes('pedant')) s *= 0.8;
    if (a.kind !== 'player') s *= a.aiAccuracy || 1.35;
    return s;
  };

  G.damageFor = function (a, wd, target, part, crit) {
    let dmg = wd.dmg;
    const skill = a.sheet.skill(wd.skill || 'guns');
    dmg *= 0.5 + 0.5 * skill / 100;
    const melee = wd.wtype === 'melee' || wd.wtype === 'unarmed';
    if (melee) {
      dmg += a.sheet.stat('str') * (wd.wtype === 'unarmed' ? 0.5 : 0.5);
      if (a.sheet.traits.includes('heavyhand')) dmg *= 1.2;
    }
    const we = a.equip.weapon;
    if (we && we.cond !== undefined && wd.durab) dmg *= 0.55 + 0.45 * we.cond;
    if (a.sheet.has('soldier') && SOLDIER.includes(wd.id)) dmg *= 1.25;
    if (a.sheet.has('cossack') && COSSACK.includes(wd.id)) dmg *= 1.25;
    if (a.sheet.has('bloodymess')) dmg *= 1.05;
    if (wd.skill === 'explosives') dmg *= 1 + 0.2 * a.sheet.rank('sapper') + 0.5 * (a.sheet.skill('explosives') / 100);
    if (target && target.robot && a.sheet.has('elektronik')) dmg *= 1.25;
    if (target && target.human && a.sheet.has('anatomy')) dmg *= 1.05;
    dmg *= 1 + a.sheet.modSum('dmg') / 100;
    if (part) dmg *= part.mult || 1;
    if (crit) {
      let cm = 2 * (wd.critMult || 1);
      if (a.sheet.has('calc')) cm *= 1.5;
      if (melee && a.sheet.traits.includes('heavyhand')) cm *= 0.5;
      if (target && target.beast && a.sheet.has('hunter')) cm *= 1.75;
      dmg *= cm;
    }
    if (a.kind !== 'player') dmg *= a.dmgMult || 0.8;
    return dmg;
  };

  G.critRoll = function (a, wd, target, opts = {}) {
    if (opts.sneak) return true;
    const ch = (a.sheet.crit() + (wd.crit || 0) + (opts.vats ? 5 : 0)) / 100;
    return this.rng() < ch;
  };

  G.aimDir = function (a) {
    const cp = Math.cos(a.pitch || 0);
    return [Math.sin(a.yaw) * cp, Math.sin(a.pitch || 0), -Math.cos(a.yaw) * cp];
  };

  G.eyeOf = function (a) { return [a.x, a.y + (a.eyeH || (a.sneak ? 1.05 : 1.62)) * ((a.look && a.look.height) || 1), a.z]; };

  G.canAttack = function (a) { return !a.dead && !(a.cool > 0) && !(a.reloading > 0) && !a.downed; };

  G.attack = function (a, opts = {}) {
    if (!this.canAttack(a)) return false;
    const wd = a.weapon();
    const we = a.equip.weapon;
    if (wd.thrown || wd.mine) return this.throwItem(a, wd, opts);
    if (wd.wtype === 'melee' || wd.wtype === 'unarmed') return this.swing(a, wd, opts);
    if (wd.mag && we) {
      if ((we.loaded || 0) <= 0) {
        if (a.count(wd.ammo) > 0) { this.reload(a); return false; }
        if (!a.clickT || this.realT - a.clickT > 0.4) { a.clickT = this.realT; this.ev.emit('dryfire', { a }); if (a.kind === 'player') this.msg('Нет патронов.', 'warn'); }
        a.cool = 0.3;
        return false;
      }
      if (we.cond < 0.5 && this.rng() < (0.5 - we.cond) * 0.25) {
        this.ev.emit('jam', { a });
        if (a.kind === 'player') this.msg('Оружие заклинило!', 'warn');
        a.reloading = wd.reload;
        a.anim.reload = 1;
        a.reloadJam = true;
        return false;
      }
      we.loaded--;
      if (wd.durab) we.cond = Math.max(0, we.cond - (1 / wd.durab) * (a.sheet.traits.includes('breaker') ? 1.15 : 1));
    }
    let rof = wd.rof;
    if (a.sheet.traits.includes('fastshot')) rof *= 1.2;
    if (a.sheet.traits.includes('pedant')) rof *= 0.8;
    a.cool = 1 / rof;
    a.anim.fire = 1;
    const eye = opts.origin || this.eyeOf(a);
    const dir = opts.dir || this.aimDir(a);
    const spread = (opts.spread !== undefined ? opts.spread : this.spreadFor(a, wd, { aim: opts.aim || a.aiming })) * Math.PI / 180;
    const shots = [];
    const pellets = wd.pellets || 1;
    for (let k = 0; k < pellets; k++) {
      const d = this.spreadDir(dir, spread);
      const res = this.traceShot(a, wd, eye, d, opts);
      shots.push(res);
    }
    this.noise(a.x, a.z, wd.sound === 'arc' || wd.sound === 'beam' ? 45 : 85, a);
    this.ev.emit('fire', { a, wd, shots, muzzle: opts.muzzle || null });
    return true;
  };

  G.spreadDir = function (dir, spread) {
    if (spread <= 0) return dir;
    const up = Math.abs(dir[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    let ux = up[1] * dir[2] - up[2] * dir[1], uy = up[2] * dir[0] - up[0] * dir[2], uz = up[0] * dir[1] - up[1] * dir[0];
    const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
    const vx = dir[1] * uz - dir[2] * uy, vy = dir[2] * ux - dir[0] * uz, vz = dir[0] * uy - dir[1] * ux;
    const r = Math.sqrt(this.rng()) * Math.tan(spread), th = this.rng() * Math.PI * 2;
    const a = Math.cos(th) * r, b = Math.sin(th) * r;
    const d = [dir[0] + ux * a + vx * b, dir[1] + uy * a + vy * b, dir[2] + uz * a + vz * b];
    const L = Math.hypot(d[0], d[1], d[2]);
    return [d[0] / L, d[1] / L, d[2] / L];
  };

  G.traceShot = function (a, wd, o, d, opts = {}) {
    const range = (wd.range || 40) * 2.6;
    const world = this.cell.cw.raycast(o[0], o[1], o[2], d[0], d[1], d[2], range);
    const maxT = world ? world.t : range;
    const hit = opts.forceTarget ? opts.forceHit : this.actorRay(o[0], o[1], o[2], d[0], d[1], d[2], maxT, a);
    if (hit && hit.a) {
      const falloff = hit.t > wd.range ? Z.clamp(1 - (hit.t - wd.range) / (wd.range * 1.6), 0.25, 1) : 1;
      const sneak = this.unaware ? this.unaware(hit.a, a) : false;
      const crit = this.critRoll(a, wd, hit.a, { sneak: sneak && a.kind === 'player', vats: opts.vats });
      let dmg = this.damageFor(a, wd, hit.a, hit.part, crit) * falloff;
      if (opts.vats && hit.a.kind === 'player') dmg *= 0.1;
      this.hitActor(hit.a, dmg, { src: a, wd, part: hit.part.id, crit, sneak, pierce: (wd.wtype === 'shotgun' && a.sheet.has('buckshot')) ? 10 : 0, burn: wd.burn, x: hit.x, y: hit.y, z: hit.z, dir: d });
      if (wd.chain) this.chainArc(a, wd, hit.a, dmg * 0.6);
      return { x: hit.x, y: hit.y, z: hit.z, actor: hit.a, part: hit.part.id, crit };
    }
    if (world) {
      this.ev.emit('impact', { x: world.x, y: world.y, z: world.z, n: world.n, surf: world.terrain ? 'dirt' : world.floor ? 'concrete' : (world.s && world.s.tag && world.s.tag.tree ? 'wood' : 'concrete'), wd });
      return { x: world.x, y: world.y, z: world.z, n: world.n };
    }
    return { x: o[0] + d[0] * range, y: o[1] + d[1] * range, z: o[2] + d[2] * range, miss: true };
  };

  G.chainArc = function (a, wd, from, dmg) {
    let best = null, bd = 7;
    for (const t of this.cell.actors) {
      if (t === from || t === a || t.dead || t.hidden) continue;
      if (!this.hostileTo || !this.hostileTo(a, t)) continue;
      const d = Math.hypot(t.x - from.x, t.z - from.z);
      if (d < bd) { bd = d; best = t; }
    }
    if (!best) return;
    this.hitActor(best, dmg, { src: a, wd, part: 'torso' });
    this.ev.emit('arc', { a: from, b: best });
  };

  G.hitActor = function (t, dmg, info) {
    if (t.dead) return null;
    if (t.kind === 'player' && this.godMode) dmg = 0;
    const res = t.applyDamage(dmg, info);
    if (info.burn && !t.dead) t.burning = Math.max(t.burning || 0, 2.5), t.burnDmg = info.burn;
    if (info.knock && !t.dead && this.rng() < info.knock && !t.big) { t.knocked = 1.6; this.ev.emit('knock', { a: t }); }
    this.ev.emit('hit', { a: t, dmg: res.dmg, src: info.src, part: info.part, crit: info.crit, crippled: res.crippled, x: info.x, y: info.y, z: info.z, dir: info.dir });
    if (info.crit && info.src && info.src.kind === 'player') this.msg(info.sneak ? 'Скрытая атака! Критическое попадание.' : 'Критическое попадание!', 'info');
    if (res.crippled && t.kind === 'player') this.msg('Покалечено: ' + Z.LIMB_NAMES[res.crippled] + '.', 'warn');
    if (t.kind === 'player') this.ev.emit('hurt', { a: t, dmg: res.dmg });
    if (this.onHit) this.onHit(t, info, res);
    if (t.dead && this.onDeath) this.onDeath(t, info);
    return res;
  };

  G.swing = function (a, wd, opts = {}) {
    let rof = wd.rof;
    if (a.sheet.traits.includes('fastshot')) rof *= 1.1;
    a.cool = 1 / rof;
    a.anim.swing = 1;
    a.punchSide = !a.punchSide;
    const delay = wd.wtype === 'unarmed' ? 0.12 : 0.22;
    this.later(delay, () => {
      if (a.dead) return;
      const eye = this.eyeOf(a), dir = opts.dir || this.aimDir(a);
      const range = (wd.range || 1.8) + (a.radius || 0.35);
      let best = null;
      if (opts.target) best = { a: opts.target, d: 1 };
      else for (const t of this.cell.actors) {
        if (t === a || t.dead || t.hidden) continue;
        const dx = t.x - a.x, dz = t.z - a.z, d = Math.hypot(dx, dz) - (t.radius || 0.35);
        if (d > range) continue;
        const dy = (t.y + (t.height || 1.8) * 0.6) - eye[1];
        if (Math.abs(dy) > 1.8 + (t.height || 1.8) * 0.3) continue;
        const dot = (dx * dir[0] + dz * dir[2]) / (Math.hypot(dx, dz) || 1);
        if (dot < 0.55) continue;
        if (!best || d < best.d) best = { a: t, d };
      }
      if (best) {
        const t = best.a;
        if (a.kind === 'player' && !this.cell.cw.los(eye[0], eye[1], eye[2], t.x, t.y + 1, t.z)) return;
        const sneak = this.unaware ? this.unaware(t, a) : false;
        const crit = this.critRoll(a, wd, t, { sneak: sneak && a.kind === 'player' });
        const part = opts.part ? this.partsOf(t).find(p => p.id === opts.part) || this.partsOf(t)[1] : this.partsOf(t).find(p => p.id === 'torso') || this.partsOf(t)[0];
        let dmg = this.damageFor(a, wd, t, part, crit);
        if (sneak && a.kind === 'player') dmg *= 1.5;
        const we = a.equip.weapon;
        if (we && wd.durab) we.cond = Math.max(0, we.cond - 1 / wd.durab);
        const knock = (wd.knock || 0) + (a.sheet.has('hammer') ? 0.15 : 0);
        this.hitActor(t, dmg, { src: a, wd, part: part.id, crit, sneak, knock, pierce: a.sheet.has('piercing') ? 15 : 0, x: t.x, y: t.y + 1.2, z: t.z, dir });
        this.ev.emit('meleeHit', { a, tgt: t, wd });
        this.noise(a.x, a.z, 12, a);
      } else this.ev.emit('swingMiss', { a, wd });
    });
    this.ev.emit('swing', { a, wd });
    return true;
  };

  G.reload = function (a) {
    const wd = a.weapon(), we = a.equip.weapon;
    if (!wd.mag || !we || a.reloading > 0) return false;
    if ((we.loaded || 0) >= wd.mag) return false;
    if (a.count(wd.ammo) <= 0) return false;
    let t = wd.reload;
    if (a.sheet.has('reload')) t *= 0.75;
    if (wd.perRound) t = Math.max(0.6, t * Math.min(wd.mag - (we.loaded || 0), a.count(wd.ammo)) / wd.mag + 0.4);
    a.reloading = t;
    a.reloadTotal = t;
    a.anim.reload = 1;
    this.ev.emit('reload', { a, wd });
    return true;
  };

  G.finishReload = function (a) {
    const wd = a.weapon(), we = a.equip.weapon;
    a.reloading = 0;
    if (a.reloadJam) { a.reloadJam = false; return; }
    if (!wd.mag || !we) return;
    const need = wd.mag - (we.loaded || 0);
    const got = a.kind === 'player' || a.ammoLimited ? a.take(wd.ammo, Math.min(need, a.count(wd.ammo))) : need;
    we.loaded = (we.loaded || 0) + got;
  };

  G.throwItem = function (a, wd, opts = {}) {
    const we = a.equip.weapon;
    if (!we || a.count(we.id) <= 0) return false;
    a.cool = 1.1;
    a.anim.throwT = 1;
    this.later(0.35, () => {
      if (a.dead || a.count(we.id) <= 0) return;
      a.take(we.id, 1);
      if (!a.find(we.id)) a.equip.weapon = null;
      if (wd.mine) {
        const fx = Math.sin(a.yaw), fz = -Math.cos(a.yaw);
        this.placeMine(a.x + fx * 1.2, a.z + fz * 1.2, wd, a);
        return;
      }
      const eye = this.eyeOf(a), dir = opts.dir || this.aimDir(a);
      const thrower = a.sheet.traits.includes('thrower');
      const speed = (opts.speed || 15) * (thrower ? 1.3 : 1) * (thrower ? 0.75 : 1) * (0.7 + 0.3 * a.sheet.skill('explosives') / 100 + 0.2);
      this.projs = this.projs || [];
      this.projs.push({ x: eye[0] + dir[0] * 0.4, y: eye[1] + dir[1] * 0.4 - 0.1, z: eye[2] + dir[2] * 0.4, vx: dir[0] * speed, vy: dir[1] * speed + 3, vz: dir[2] * speed, fuse: wd.fuse || 3, wd, owner: a, bounces: 0, spin: 0 });
      this.ev.emit('throw', { a, wd });
    });
    return true;
  };

  G.placeMine = function (x, z, wd, owner) {
    this.mines = this.mines || [];
    const y = this.cell.cw.groundAt(x, z, 100);
    this.mines.push({ x, y, z, wd, owner, armed: 1.5 });
    this.ev.emit('mine', { x, y, z });
  };

  G.stepProjectiles = function (dt) {
    const cw = this.cell.cw;
    for (const p of this.projs || []) {
      p.vy -= Z.G * dt;
      const L = Math.hypot(p.vx, p.vy, p.vz) * dt;
      if (L > 1e-6) {
        const dx = p.vx * dt / L, dy = p.vy * dt / L, dz = p.vz * dt / L;
        const h = cw.raycast(p.x, p.y, p.z, dx, dy, dz, L + 0.05);
        const ha = this.actorRay(p.x, p.y, p.z, dx, dy, dz, L + 0.05, p.owner);
        if ((h || ha) && p.wd.impact) { p.fuse = 0; if (h) { p.x = h.x; p.y = h.y + 0.05; p.z = h.z; } }
        else if (h) {
          const n = h.n || [0, 1, 0];
          const vn = p.vx * n[0] + p.vy * n[1] + p.vz * n[2];
          p.vx = (p.vx - 2 * vn * n[0]) * 0.45; p.vy = (p.vy - 2 * vn * n[1]) * 0.35; p.vz = (p.vz - 2 * vn * n[2]) * 0.45;
          p.x = h.x + n[0] * 0.06; p.y = h.y + n[1] * 0.06; p.z = h.z + n[2] * 0.06;
          if (p.bounces++ < 6) this.ev.emit('bounce', { x: p.x, y: p.y, z: p.z });
        } else { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
        if (this.cell.exterior && p.y < Z.WATER_Y && this.map.groundH(p.x, p.z) < Z.WATER_Y - 0.3) { p.vx *= 0.9; p.vz *= 0.9; p.vy = Math.max(p.vy, -2); if (!p.wet) { p.wet = true; this.ev.emit('splash', { x: p.x, y: Z.WATER_Y, z: p.z, small: true }); } }
      }
      p.fuse -= dt;
      p.spin += dt * 10;
      if (p.fuse <= 0) {
        p.dead = true;
        if (p.wet && p.wd.fire) { this.ev.emit('fizzle', { x: p.x, y: p.y, z: p.z }); continue; }
        this.explode(p.x, p.y, p.z, p.wd.radius || 5, p.wd.dmg, p.owner, p.wd);
        if (p.wd.fire) this.addFire(p.x, p.y, p.z, p.wd.radius || 3.5, p.wd.fire, p.owner);
      }
    }
    if (this.projs) this.projs = this.projs.filter(p => !p.dead);
    for (const m of this.mines || []) {
      m.armed -= dt;
      if (m.armed > 0 || m.dead) continue;
      for (const a of this.cell.actors) {
        if (a.dead || a.flying) continue;
        if (a.kind === 'player' && a.sheet.has('lightstep')) continue;
        if (Math.hypot(a.x - m.x, a.z - m.z) < 0.9 && Math.abs(a.y - m.y) < 1) { m.dead = true; this.ev.emit('beep', { x: m.x, y: m.y, z: m.z }); this.later(0.25, () => this.explode(m.x, m.y + 0.1, m.z, m.wd.radius, m.wd.dmg, m.owner, m.wd)); break; }
      }
    }
    if (this.mines) this.mines = this.mines.filter(m => !m.dead);
    for (const f of this.fires || []) {
      f.t -= dt;
      for (const a of this.cell.actors) {
        if (a.dead) continue;
        if (Math.hypot(a.x - f.x, a.z - f.z) < f.r && Math.abs(a.y - f.y) < 1.5) { a.burning = Math.max(a.burning || 0, 2); a.burnDmg = Math.max(a.burnDmg || 0, f.dps * 0.5); a.burnSrc = f.owner; }
      }
    }
    if (this.fires) this.fires = this.fires.filter(f => f.t > 0);
  };

  G.addFire = function (x, y, z, r, dur, owner) {
    this.fires = this.fires || [];
    this.fires.push({ x, y, z, r, t: dur, dps: 8, owner });
    this.ev.emit('fire_pool', { x, y, z, r });
  };

  G.explode = function (x, y, z, r, dmg, owner, wd) {
    this.ev.emit('explosion', { x, y, z, r, wd });
    this.noise(x, z, 120, owner);
    for (const a of this.cell.actors) {
      if (a.dead) continue;
      const cy = a.y + (a.height || 1.8) * 0.5;
      const d = Math.hypot(a.x - x, cy - y, a.z - z);
      if (d > r) continue;
      if (!this.cell.cw.los(x, y + 0.3, z, a.x, cy, a.z)) continue;
      const k = 1 - d / r;
      let dd = (wd && owner ? this.damageFor(owner, wd, a, null, false) : dmg) * (0.25 + 0.75 * k);
      if (owner && owner.kind !== 'player' && wd) dd = dmg * (0.25 + 0.75 * k) * (owner.dmgMult || 0.8);
      const part = Z.LIMBS[Math.floor(this.rng() * 6)];
      this.hitActor(a, dd, { src: owner, wd, part, explosion: true, hitDeck: a.sheet.has('hitdeck'), x: a.x, y: cy, z: a.z, knock: k > 0.4 ? 0.8 : 0 });
      if (!a.dead && !a.big) { const L = d || 1; a.vx += (a.x - x) / L * 6 * k; a.vz += (a.z - z) / L * 6 * k; a.vy = Math.max(a.vy, 3 * k); a.onGround = false; }
    }
    if (this.onExplosion) this.onExplosion(x, y, z, r);
  };

  G.later = function (t, fn) {
    this.timers = this.timers || [];
    this.timers.push({ t, fn });
  };

  G.stepTimers = function (dt) {
    if (!this.timers || !this.timers.length) return;
    const due = [];
    for (const tm of this.timers) { tm.t -= dt; if (tm.t <= 0) due.push(tm); }
    if (due.length) { this.timers = this.timers.filter(tm => tm.t > 0); for (const tm of due) tm.fn(); }
  };

  G.noise = function (x, z, radius, src) {
    this.noises = this.noises || [];
    this.noises.push({ x, z, r: radius, src, t: 0.3 });
  };

  G.stepCombat = function (dt) {
    this.realT = (this.realT || 0) + dt;
    this.stepTimers(dt);
    this.stepProjectiles(dt);
    for (const a of this.cell.actors) {
      if (a.cool > 0) a.cool -= dt;
      if (a.reloading > 0) { a.reloading -= dt; if (a.reloading <= 0) this.finishReload(a); }
      if (a.knocked > 0) a.knocked -= dt;
      if (a.downed > 0) { a.downed -= dt; if (a.downed <= 0) a.downed = 0; }
      if (a.burning > 0 && !a.dead) {
        a.burning -= dt;
        a.burnT = (a.burnT || 0) + dt;
        if (a.burnT > 0.5) { a.burnT = 0; this.hitActor(a, (a.burnDmg || 5) * 0.5 * (a.burnSrc && a.burnSrc.sheet && a.burnSrc.sheet.has('arsonist') ? 1.5 : 1), { src: a.burnSrc || null, part: 'torso', fire: true }); }
      }
    }
    if (this.noises) { for (const n of this.noises) n.t -= dt; this.noises = this.noises.filter(n => n.t > 0); }
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
