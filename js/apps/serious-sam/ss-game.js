(function (S) {
  'use strict';
  const { clamp, wrapAng, RNG, World } = S;
  const { AMMO, WEAPONS, WEAPON_ORDER, PROJ, ENEMIES, ITEMS, SKILLS } = S.DATA;
  const DT = 1 / 60, EYE = 1.62, PR = 0.4, PH = 1.8, RUN = 10, WALK = 5, JUMP = 7.2, FLY = 16;

  const newInventory = () => ({ hp: 100, armor: 0, weapons: ['knife', 'colt'], ammo: { shells: 0, bullets: 0, rockets: 0, grenades: 0, cells: 0, balls: 0 }, cur: 'colt', dual: false, score: 0, seen: [] });

  function rayCyl(ox, oy, oz, dx, dy, dz, cx, cz, r, y0, y1) {
    const fx = ox - cx, fz = oz - cz, a = dx * dx + dz * dz;
    let t = -1;
    if (a > 1e-9) {
      const b = 2 * (fx * dx + fz * dz), c = fx * fx + fz * fz - r * r, disc = b * b - 4 * a * c;
      if (disc >= 0) {
        const sq = Math.sqrt(disc), t0 = (-b - sq) / (2 * a), t1 = (-b + sq) / (2 * a);
        for (const tt of [t0, t1]) { if (tt < 0) continue; const y = oy + dy * tt; if (y >= y0 && y <= y1) { t = tt; break; } }
      }
    }
    if (Math.abs(dy) > 1e-9) for (const py of [y1, y0]) {
      const tt = (py - oy) / dy; if (tt < 0 || (t >= 0 && tt >= t)) continue;
      const x = ox + dx * tt - cx, z = oz + dz * tt - cz; if (x * x + z * z <= r * r) t = tt;
    }
    return t;
  }

  class Game {
    constructor(o = {}) {
      this.levelIndex = o.level || 0;
      this.skill = SKILLS[o.skill == null ? 2 : o.skill]; this.skillIndex = o.skill == null ? 2 : o.skill;
      this.def = S.LEVELS[this.levelIndex]();
      this.W = new World(this.def);
      this.rng = RNG(o.seed || 1234 + this.levelIndex * 77);
      this.time = 0; this.events = []; this.state = 'play'; this.nextId = 1;
      this.enemies = []; this.projs = []; this.items = []; this.msgs = [];
      const inv = Object.assign(newInventory(), o.inv ? JSON.parse(JSON.stringify(o.inv)) : {});
      if (this.def.weapons) for (const w of this.def.weapons) if (!inv.weapons.includes(w)) inv.weapons.push(w);
      inv.hp = Math.max(inv.hp, 50);
      this.startInv = JSON.parse(JSON.stringify(inv));
      const st = this.def.start;
      this.player = {
        x: st.x, y: 0, z: st.z, vx: 0, vy: 0, vz: 0, r: PR, h: PH, ground: false, yaw: st.yaw || 0, pitch: 0,
        hp: inv.hp, armor: inv.armor, weapons: new Set(inv.weapons), ammo: Object.assign({}, inv.ammo), cur: inv.cur, dual: inv.dual,
        next: null, switchT: 0, fireT: 0, clip: 6, reloadT: 0, spin: 0, spinA: 0, charge: 0, charging: false, hand: 0, lastFire: -9, barrel: 0, barrelFire: [-9, -9, -9, -9],
        power: 0, god: false, noclip: false, infAmmo: false, runMul: 1, jumpMul: 1, dead: false, bob: 0, hurtT: 0, prevW: 'knife', kick: 0
      };
      if (!this.player.weapons.has(this.player.cur)) this.player.cur = 'colt';
      this.player.clip = this.player.dual ? 12 : 6;
      this.player.y = this.W.groundAt(st.x, st.z);
      this.seen = new Set(inv.seen || []);
      this.stats = { kills: 0, total: 0, secrets: 0, secretsTotal: this.def.secrets, score: inv.score || 0, time: 0, startScore: inv.score || 0 };

      this.gates = {};
      for (const id in this.def.gates) { const g = this.def.gates[id]; this.gates[id] = { id, t: g.t, target: g.t, speed: g.speed }; this.W.setGate(id, g.t); }
      this.triggers = this.def.triggers.map(t => Object.assign({}, t, { fired: false }));
      this.waves = {};
      for (const id in this.def.waves) {
        const w = this.def.waves[id];
        this.waves[id] = { id, def: w, started: false, done: false, alive: 0, groups: w.groups.map(g => ({ g, t: g.delay || 0, left: this.groupCount(g) })) };
        for (const g of this.waves[id].groups) this.stats.total += g.left;
      }
      for (const it of this.def.items) this.addItem(it.type, it.x, it.z, it.y);
      for (const e of this.def.enemies) { this.spawnEnemy(e.t, e.x, e.z, null, { idle: true, yaw: e.rot }); this.stats.total++; }
      this.flowT = 0; this.cellHash = new Map();
      this.pendingWave = [];
    }

    groupCount(g) { return g.fixed ? g.n : Math.max(1, Math.round(g.n * this.skill.count)); }
    emit(ev) { this.events.push(ev); }
    sound(s, x, y, z, vol) { this.events.push({ t: 'sound', s, x, y, z, vol }); }
    message(text, kind = 'msg') { this.msgs.push({ text, time: this.time, kind }); if (this.msgs.length > 30) this.msgs.shift(); this.emit({ t: 'msg', text, kind }); }
    get eye() { return this.player.y + EYE; }
    forward() { const p = this.player, c = Math.cos(p.pitch); return [Math.sin(p.yaw) * c, Math.sin(p.pitch), Math.cos(p.yaw) * c]; }
    waveDone(id) { return !id || (this.waves[id] && this.waves[id].done); }
    inventory() {
      const p = this.player;
      return { hp: Math.max(1, Math.round(p.hp)), armor: Math.round(p.armor), weapons: [...p.weapons], ammo: Object.assign({}, p.ammo), cur: p.cur, dual: p.dual, score: this.stats.score, seen: [...this.seen] };
    }

    addItem(type, x, z, y) {
      const def = ITEMS[type]; if (!def) return null;
      const fy = y != null ? y : this.W.groundAt(x, z);
      const it = { id: this.nextId++, type, def, x, y: fy, z, taken: false, ph: (x * 0.37 + z * 0.61) % 6.28 };
      this.items.push(it); return it;
    }
    tryPickup(it) {
      const p = this.player, d = it.def;
      let msg = null;
      if (d.kind === 'health') { if (p.hp >= d.max) return false; p.hp = Math.min(d.max, p.hp + d.amount); msg = { ru: `+${d.amount} ЗДОРОВЬЕ`, en: `+${d.amount} HEALTH` }; }
      else if (d.kind === 'armor') { if (p.armor >= d.max) return false; p.armor = Math.min(d.max, p.armor + d.amount); msg = { ru: `+${d.amount} БРОНЯ`, en: `+${d.amount} ARMOR` }; }
      else if (d.kind === 'ammo') {
        const a = d.ammo; if (p.ammo[a] >= AMMO[a].max) return false;
        const n = Math.round(d.amount * this.skill.ammo); p.ammo[a] = Math.min(AMMO[a].max, p.ammo[a] + n); msg = { ru: `+${n} ${AMMO[a].name.ru.toUpperCase()}`, en: `+${n} ${AMMO[a].name.en.toUpperCase()}` };
      } else if (d.kind === 'weapon') {
        const w = WEAPONS[d.weapon], has = p.weapons.has(d.weapon);
        if (d.weapon === 'colt') { if (p.dual) return false; p.dual = true; p.clip = 12; msg = { ru: 'ДВА РЕВОЛЬВЕРА!', en: 'DUAL SCHOFIELDS!' }; }
        else {
          if (has && (!w.ammo || p.ammo[w.ammo] >= AMMO[w.ammo].max)) return false;
          p.weapons.add(d.weapon); if (w.ammo) p.ammo[w.ammo] = Math.min(AMMO[w.ammo].max, p.ammo[w.ammo] + Math.round(w.give * this.skill.ammo));
          msg = w.name; if (!has) this.selectWeapon(d.weapon, true);
        }
      } else if (d.kind === 'power') { p.power = d.time; msg = { ru: 'СЕРЬЁЗНЫЙ УРОН!', en: 'SERIOUS DAMAGE!' }; }
      it.taken = true;
      this.emit({ t: 'pickup', item: it.type, kind: d.kind, text: msg });
      return true;
    }

    spawnEnemy(type, x, z, wave, o = {}) {
      const def = ENEMIES[type]; if (!def) throw new Error('enemy ' + type);
      const fl = this.W.groundAt(x, z, 0.2);
      const e = {
        id: this.nextId++, type, def, x, y: fl + (o.y || 0), z, vx: 0, vy: 0, vz: 0, r: def.r, h: def.h, yaw: o.yaw != null ? o.yaw : Math.atan2(this.player.x - x, this.player.z - z),
        hp: def.hp * (def.boss ? 1 : 1), maxHp: def.hp, state: o.idle ? 'idle' : 'spawn', t: 0, spawnT: o.idle ? 0 : 0.6, cool: 1 + this.rng() * 1.5, rcool: 2 + this.rng() * 2, los: false, losT: this.rng() * 0.3,
        wave, fly: def.ai === 'flyer', ground: false, flash: 0, anim: { walk: this.rng() * 6, move: 0, attack: 0, charge: 0, air: 0, aim: 0, stomp: 0, t: 0 }, atkT: 0, atkDone: true, mode: 'walk', modeT: 0, dead: false, deadT: 0,
        orbit: this.rng() * Math.PI * 2, screamT: this.rng() * 2, burst: 0, burstT: 0, hitP: false, stuck: 0, lostT: 0
      };
      if (e.fly) e.y = fl + (o.y || def.fly || 7);
      this.enemies.push(e);
      if (!o.idle) { this.emit({ t: 'spawn', x: e.x, y: e.y, z: e.z, r: e.r, h: e.h }); if (def.sounds && def.sounds.alert) this.sound(def.sounds.alert, e.x, e.y + e.h * 0.7, e.z); }
      return e;
    }
    canStand(x, z, r, refY) {
      const W = this.W, c = W.cellOf(x, z);
      if (c < 0 || !W.navOK[c]) return false;
      const y = W.groundAt(x, z, 0.2);
      if (Math.abs(W.navH[c] - y) > 0.7 || (refY != null && Math.abs(y - refY) > 1.2)) return false;
      let blocked = false;
      W.near(x - r, z - r, x + r, z + r, b => {
        if (b.y1 <= y + 0.7 || b.y0 >= y + 2) return;
        const cx = clamp(x, b.x0, b.x1), cz = clamp(z, b.z0, b.z1);
        if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) { blocked = true; return false; }
      });
      return !blocked;
    }
    findStandSpot(x0, z0, spread, r) {
      const refY = this.W.groundAt(x0, z0, 0.2);
      for (let k = 0; k < 24; k++) {
        const a = this.rng() * Math.PI * 2, d = spread * Math.sqrt(this.rng());
        const x = x0 + Math.cos(a) * d, z = z0 + Math.sin(a) * d;
        if (this.canStand(x, z, r, refY)) return [x, z];
      }
      for (let ring = 1; ring < 40; ring++) for (let k = 0; k < ring * 8; k++) {
        const a = (k / (ring * 8)) * Math.PI * 2, x = x0 + Math.cos(a) * ring, z = z0 + Math.sin(a) * ring;
        if (this.canStand(x, z, r, refY)) return [x, z];
      }
      return [x0, z0];
    }
    spawnFromGroup(w, g) {
      const def = ENEMIES[g.t], spread = g.r == null ? 3 : g.r;
      const [x, z] = def.ai === 'flyer' ? [g.x + (this.rng() - 0.5) * spread, g.z + (this.rng() - 0.5) * spread] : this.findStandSpot(g.x, g.z, spread, Math.min(def.r, 1.5));
      const e = this.spawnEnemy(g.t, x, z, w.id, { y: g.y });
      w.alive++;
      return e;
    }
    hurtEnemy(e, dmg, kind, sx, sy, sz) {
      if (e.dead || e.spawnT > 0) return;
      if (this.player.power > 0 && kind !== 'env') dmg *= 4;
      e.hp -= dmg; e.flash = 0.12;
      if (e.state === 'idle') e.state = 'chase';
      if (kind !== 'blast') this.emit({ t: 'blood', x: sx, y: sy, z: sz, n: Math.min(12, 2 + dmg / 8), big: e.def.hp > 200 });
      if (e.hp <= 0) this.killEnemy(e, kind, dmg);
      else if (dmg > 15 && this.rng() < 0.3) this.sound('pain', e.x, e.y + e.h * 0.7, e.z, 0.6);
    }
    killEnemy(e, kind, dmg) {
      e.dead = true; e.state = 'dead'; e.deadT = 0; e.vx *= 0.3; e.vz *= 0.3;
      this.stats.kills++; this.stats.score += e.def.score;
      const gib = e.type === 'kamikaze' || kind === 'ball' || (kind === 'blast' && (dmg > 25 || e.def.hp <= 40)) || (kind !== 'melee' && -e.hp > e.maxHp * 0.6 && e.def.hp <= 120);
      e.gibbed = gib;
      this.emit({ t: gib ? 'gib' : 'die', e: { type: e.type, x: e.x, y: e.y, z: e.z, yaw: e.yaw, anim: Object.assign({}, e.anim), h: e.h, r: e.r }, big: e.def.hp > 200 });
      this.sound(e.def.boss ? 'bossdie' : gib ? 'gibs' : 'die_' + (e.def.ai === 'kleer' ? 'kleer' : e.def.hp > 200 ? 'big' : 'small'), e.x, e.y + e.h * 0.5, e.z);
      if (e.wave && this.waves[e.wave]) this.waves[e.wave].alive--;
      if (e.type === 'kamikaze') this.explode(e.x, e.y + 1, e.z, e.def.dmg, e.def.blast, 'k');
    }

    hurtPlayer(dmg, sx, sz, kind) {
      const p = this.player; if (p.dead || this.state !== 'play') return;
      dmg *= this.skill.dmg; if (p.god) dmg = 0;
      if (dmg <= 0) return;
      const ab = Math.min(p.armor, dmg * 0.66); p.armor -= ab; p.hp -= dmg - ab; p.hurtT = 0.3;
      const dir = sx == null ? null : Math.atan2(sx - p.x, sz - p.z);
      this.emit({ t: 'hurt', dmg, dir, kind });
      if (p.hp <= 0) { p.hp = 0; p.dead = true; this.state = 'dead'; this.emit({ t: 'pdie' }); this.sound('pdie', p.x, p.y + 1, p.z); }
      else if (dmg >= 4) this.sound('phurt', p.x, p.y + 1, p.z, 0.8);
    }
    knock(o, kx, ky, kz) { o.vx += kx; o.vy += ky; o.vz += kz; if (ky > 0) o.ground = false; }

    explode(x, y, z, dmg, radius, owner) {
      this.emit({ t: 'explosion', x, y, z, r: radius, big: dmg >= 100 });
      this.sound(dmg >= 100 ? 'bigboom' : 'boom', x, y, z);
      for (const e of this.enemies) {
        if (e.dead) continue;
        const cx = e.x - x, cy = (e.y + e.h * 0.5) - y, cz = e.z - z, d = Math.max(0, Math.hypot(cx, cy, cz) - e.r);
        if (d >= radius) continue;
        const f = 1 - d / radius, k = f * 12 / Math.max(1, e.def.hp / 60);
        if (!e.def.boss) { const l = Math.hypot(cx, cz) || 1; this.knock(e, (cx / l) * k, e.fly ? 0 : k * 0.5, (cz / l) * k); }
        this.hurtEnemy(e, dmg * f, 'blast', e.x, e.y + e.h * 0.5, e.z);
      }
      const p = this.player;
      if (!p.dead) {
        const cx = p.x - x, cy = (p.y + 0.9) - y, cz = p.z - z, d = Math.max(0, Math.hypot(cx, cy, cz) - PR);
        if (d < radius) {
          const f = 1 - d / radius, l = Math.hypot(cx, cy, cz) || 1, k = f * (owner === 'p' ? 14 : 10);
          this.knock(p, (cx / l) * k, Math.max(0.3, cy / l) * k * 0.9, (cz / l) * k);
          this.hurtPlayer(dmg * f * (owner === 'p' ? 0.45 : 1), x, z, 'blast');
        }
      }
    }

    hasAmmo(w) { const d = WEAPONS[w]; return !d.ammo || this.player.infAmmo || this.player.ammo[d.ammo] >= (d.use || 1); }
    selectWeapon(w, force) {
      const p = this.player;
      if (!p.weapons.has(w) || (!force && !this.hasAmmo(w))) return false;
      if (w === p.cur && !p.next) return false;
      if (p.cur !== w) p.prevW = p.cur;
      p.next = w; p.switchT = 0.4; p.charging = false; p.charge = 0;
      this.emit({ t: 'switch', w });
      return true;
    }
    cycleWeapon(dir) {
      const p = this.player, cur = p.next || p.cur; let i = WEAPON_ORDER.indexOf(cur);
      for (let k = 0; k < WEAPON_ORDER.length; k++) { i = (i + dir + WEAPON_ORDER.length) % WEAPON_ORDER.length; const w = WEAPON_ORDER[i]; if (p.weapons.has(w) && this.hasAmmo(w)) { this.selectWeapon(w); return; } }
    }
    bestWeapon() {
      const p = this.player, pref = ['cannon', 'rocket', 'minigun', 'dshotgun', 'laser', 'tommy', 'shotgun', 'grenade', 'colt'];
      for (const w of pref) if (p.weapons.has(w) && this.hasAmmo(w) && w !== 'cannon') return w;
      return 'colt';
    }

    trace(ox, oy, oz, dx, dy, dz, range) {
      const wh = this.W.ray(ox, oy, oz, dx, dy, dz, range, true);
      let best = wh ? wh.t : range, target = null;
      for (const e of this.enemies) {
        if (e.dead || e.spawnT > 0) continue;
        const ex = e.x - ox, ez = e.z - oz; if (ex * ex + ez * ez > (best + e.r + 2) ** 2) continue;
        const t = rayCyl(ox, oy, oz, dx, dy, dz, e.x, e.z, e.r * 1.1, e.y - 0.1, e.y + e.h + 0.25);
        if (t >= 0 && t < best) { best = t; target = e; }
      }
      return { t: best, e: target, wall: !target && wh ? wh : null };
    }
    fireHitscan(dmg, spread, pellets, range, tracer) {
      const p = this.player, f = this.forward(), ox = p.x, oy = this.eye, oz = p.z;
      const rx = -Math.cos(p.yaw), rz = Math.sin(p.yaw);
      const ux = -Math.sin(p.pitch) * Math.sin(p.yaw), uy = Math.cos(p.pitch), uz = -Math.sin(p.pitch) * Math.cos(p.yaw);
      const hits = new Map();
      for (let i = 0; i < pellets; i++) {
        const a = this.rng() * Math.PI * 2, s = spread * Math.sqrt(this.rng());
        const ca = Math.cos(a) * s, sa = Math.sin(a) * s;
        let dx = f[0] + rx * ca + ux * sa, dy = f[1] + uy * sa, dz = f[2] + rz * ca + uz * sa; const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
        const h = this.trace(ox, oy, oz, dx, dy, dz, range);
        const hx = ox + dx * h.t, hy = oy + dy * h.t, hz = oz + dz * h.t;
        if (h.e) hits.set(h.e, (hits.get(h.e) || 0) + dmg), h.e.lastHit = [hx, hy, hz];
        else if (h.wall) this.emit({ t: 'impact', x: hx, y: hy, z: hz, n: h.wall.n, terrain: !!h.wall.terrain });
        if (tracer && (i === 0 || this.rng() < 0.3)) this.emit({ t: 'tracer', x0: ox + rx * 0.2, y0: oy - 0.2, z0: oz + rz * 0.2, x1: hx, y1: hy, z1: hz });
      }
      for (const [e, d] of hits) this.hurtEnemy(e, d, 'bullet', e.lastHit[0], e.lastHit[1], e.lastHit[2]);

      for (const e of this.enemies) if (e.state === 'idle' && Math.hypot(e.x - p.x, e.z - p.z) < 45) e.state = 'chase';
    }
    fireProjectile(type, speedMul = 1, muzzle = null) {
      const p = this.player, f = this.forward(), d = PROJ[type];
      const rx = -Math.cos(p.yaw), rz = Math.sin(p.yaw), bx = muzzle ? muzzle[0] : 0, by = muzzle ? muzzle[1] : 0;
      const ux = -Math.sin(p.pitch) * Math.sin(p.yaw), uy = Math.cos(p.pitch), uz = -Math.sin(p.pitch) * Math.cos(p.yaw);
      const ox = p.x + f[0] * 0.5 + rx * (0.18 + bx) + ux * by, oy = this.eye - 0.18 + f[1] * 0.5 + uy * by, oz = p.z + f[2] * 0.5 + rz * (0.18 + bx) + uz * by;

      const h = this.trace(p.x, this.eye, p.z, f[0], f[1], f[2], 400);
      const tx = p.x + f[0] * h.t, ty = this.eye + f[1] * h.t, tz = p.z + f[2] * h.t;
      let ax = tx - ox, ay = ty - oy, az = tz - oz; const l = Math.hypot(ax, ay, az) || 1; ax /= l; ay /= l; az /= l;
      if (h.t < 2) { ax = f[0]; ay = f[1]; az = f[2]; }
      const sp = d.speed * speedMul;
      const pr = this.addProj(type, ox, oy, oz, ax * sp, ay * sp + (d.up || 0), az * sp, 'p');
      if (muzzle) { pr.muzzle = muzzle; pr.born = this.time; pr.ox = ox; pr.oy = oy; pr.oz = oz; }
    }
    addProj(type, x, y, z, vx, vy, vz, owner, target) {
      const d = PROJ[type];
      const pr = { id: this.nextId++, type, def: d, x, y, z, px: x, py: y, pz: z, vx, vy, vz, owner, life: d.life || 8, fuse: d.fuse || 0, hitSet: null, target, dead: false, rolling: false };
      this.projs.push(pr); return pr;
    }
    updateWeapon(inp) {
      const p = this.player;
      if (p.switchT > 0) {
        const before = p.switchT; p.switchT -= DT;
        if (before > 0.2 && p.switchT <= 0.2 && p.next) { p.cur = p.next; p.next = null; p.spin = 0; p.fireT = 0; }
        if (p.switchT > 0) return;
      }
      if (p.fireT > 0) p.fireT -= DT;
      if (p.reloadT > 0) { p.reloadT -= DT; if (p.reloadT <= 0) p.clip = p.dual ? 12 : 6; }
      const w = p.cur, d = WEAPONS[w];
      if (inp.reload && w === 'colt' && p.reloadT <= 0 && p.clip < (p.dual ? 12 : 6)) { p.reloadT = d.reload; this.sound('reload', p.x, this.eye, p.z, 0.7); }
      if (w === 'minigun') { p.spin = clamp(p.spin + (inp.fire && this.hasAmmo(w) ? DT / d.spinup : -DT / 1.2), 0, 1); p.spinA += p.spin * DT * 40; }
      if (!this.hasAmmo(w)) { if (!p.next) { const b = this.bestWeapon(); if (b !== w) this.selectWeapon(b); } return; }
      if (w === 'cannon') {
        if (inp.fire && p.fireT <= 1e-6) { if (!p.charging) { p.charging = true; p.charge = 0; this.emit({ t: 'charge' }); } p.charge = Math.min(d.charge, p.charge + DT); return; }
        if (p.charging && !inp.fire) {
          p.charging = false; if (!p.infAmmo) p.ammo.balls -= 1; p.fireT = d.rate; p.lastFire = this.time;
          this.fireProjectile('cannonball', 0.65 + (p.charge / d.charge) * 0.9); p.charge = 0;
          this.emit({ t: 'fire', w }); this.sound('cannon', p.x, this.eye, p.z); p.kick = 1;
        }
        return;
      }
      if (!inp.fire || p.fireT > 1e-6) return;
      if (w === 'minigun' && p.spin < 1) return;
      if (w === 'colt' && p.reloadT > 0) return;
      p.fireT = Math.max(p.fireT, -DT) + (w === 'colt' && p.dual ? d.rate * 0.55 : d.rate); p.lastFire = this.time; p.kick = 1;
      if (d.ammo && !p.infAmmo) p.ammo[d.ammo] -= d.use || 1;
      const barrel = d.barrels ? p.barrel : null;
      if (barrel != null) { p.barrel = (barrel + 1) % d.barrels.length; p.barrelFire[barrel] = this.time; }
      this.emit({ t: 'fire', w, hand: p.hand, barrel }); this.sound(d.sound, p.x, this.eye, p.z);
      if (w === 'colt') { p.hand ^= 1; if (!p.infAmmo && --p.clip <= 0) { p.reloadT = d.reload; this.sound('reload', p.x, this.eye, p.z, 0.7); } }
      if (d.melee) {
        const f = this.forward();
        let hit = null, best = d.range + 1;
        for (const e of this.enemies) {
          if (e.dead || e.spawnT > 0) continue;
          const dx = e.x - p.x, dz = e.z - p.z, dist = Math.hypot(dx, dz) - e.r; if (dist > d.range) continue;
          if (e.y > this.eye + 0.5 || e.y + e.h < p.y) continue;
          if ((dx * f[0] + dz * f[2]) / (Math.hypot(dx, dz) || 1) < 0.55) continue;
          if (dist < best) { best = dist; hit = e; }
        }
        if (hit) { this.hurtEnemy(hit, d.dmg, 'melee', hit.x, p.y + 1.3, hit.z); this.sound('stab', hit.x, p.y + 1.3, hit.z); }
      } else if (d.proj) this.fireProjectile(d.proj, 1, barrel != null ? d.barrels[barrel] : null);
      else this.fireHitscan(d.dmg, d.spread, d.pellets || 1, 300, w === 'tommy' || w === 'minigun');
    }

    updatePlayer(inp) {
      const p = this.player;
      if (p.dead) { p.vx *= 0.9; p.vz *= 0.9; this.W.move(p, DT); return; }
      p.yaw = wrapAng(p.yaw + (inp.dyaw || 0)); p.pitch = clamp(p.pitch + (inp.dpitch || 0), -1.5, 1.5);
      if (inp.weapon) this.selectWeapon(inp.weapon);
      if (inp.cycle) this.cycleWeapon(inp.cycle);
      if (inp.prev && p.prevW) this.selectWeapon(p.prevW);
      if (p.noclip) this.flyNoclip(inp);
      else this.walk(inp);
      if (p.power > 0) p.power -= DT;
      if (p.hurtT > 0) p.hurtT -= DT;
      if (p.kick > 0) p.kick = Math.max(0, p.kick - DT * 6);
      if (p.hp > 100) p.hp = Math.max(100, p.hp - DT);

      for (const it of this.items) {
        if (it.taken) continue;
        if (Math.abs(it.x - p.x) < 1.3 && Math.abs(it.z - p.z) < 1.3 && it.y > p.y - 1.2 && it.y < p.y + 2.2) this.tryPickup(it);
      }

      for (const t of this.triggers) {
        if (t.fired) continue;
        if (p.x < t.x0 || p.x > t.x1 || p.z < t.z0 || p.z > t.z1 || p.y < t.y0 || p.y > t.y1) continue;
        if (t.after && !this.waveDone(t.after)) continue;
        t.fired = true; this.runActions(t.actions);
      }
      this.updateWeapon(inp);
    }

    walk(inp) {
      const p = this.player, sp = (inp.walk ? WALK : RUN) * p.runMul, fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), rx = -Math.cos(p.yaw), rz = Math.sin(p.yaw);
      let mx = (inp.fwd || 0) * fx + (inp.strafe || 0) * rx, mz = (inp.fwd || 0) * fz + (inp.strafe || 0) * rz;
      const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
      const tvx = mx * sp, tvz = mz * sp, acc = (p.ground ? 75 : 14) * p.runMul * DT;
      const dvx = tvx - p.vx, dvz = tvz - p.vz, dl = Math.hypot(dvx, dvz);
      const over = Math.hypot(p.vx, p.vz) > sp + 1;
      const a = over ? (p.ground ? 30 : 4) * DT : acc;
      if (dl > 0) { const k = Math.min(1, a / dl); p.vx += dvx * k; p.vz += dvz * k; }
      if (inp.jump && p.ground) { p.vy = JUMP * Math.sqrt(p.jumpMul); p.ground = false; this.emit({ t: 'jump' }); }
      const land = this.W.move(p, DT);
      if (land > 9) this.emit({ t: 'land', v: land });
      if (p.ground && ml > 0.1) p.bob += DT * sp * 1.1;
    }
    flyNoclip(inp) {
      const p = this.player, W = this.W, f = this.forward(), rx = -Math.cos(p.yaw), rz = Math.sin(p.yaw), fwd = inp.fwd || 0, str = inp.strafe || 0;
      let mx = fwd * f[0] + str * rx, my = fwd * f[1] + (inp.jump ? 1 : 0) - (inp.down ? 1 : 0), mz = fwd * f[2] + str * rz;
      const ml = Math.hypot(mx, my, mz); if (ml > 1) { mx /= ml; my /= ml; mz /= ml; }
      const sp = (inp.walk ? FLY * 0.35 : FLY) * p.runMul;
      p.vx = mx * sp; p.vy = my * sp; p.vz = mz * sp; p.ground = false;
      p.x = clamp(p.x + p.vx * DT, W.bx0 - 40, W.bx1 + 40);
      p.z = clamp(p.z + p.vz * DT, W.bz0 - 40, W.bz1 + 40);
      p.y = clamp(p.y + p.vy * DT, W.terrainAt(p.x, p.z) - 30, W.hmMax + 120);
    }

    runActions(list) {
      for (const a of list) {
        if (a.wave) this.startWave(a.wave);
        if (a.msg) this.message(a.msg, 'netricsa');
        if (a.open && this.gates[a.open]) { this.gates[a.open].target = 1; this.sound('gate', this.def.gates[a.open].box.x0, 2, this.def.gates[a.open].box.z0); }
        if (a.close && this.gates[a.close]) { this.gates[a.close].target = 0; this.sound('gate', this.def.gates[a.close].box.x0, 2, this.def.gates[a.close].box.z0); }
        if (a.item) { this.addItem(a.item, a.x, a.z, a.y); this.emit({ t: 'spawn', x: a.x, y: this.W.groundAt(a.x, a.z), z: a.z, r: 0.5, h: 1, item: true }); }
        if (a.secret) { this.stats.secrets++; this.stats.score += 1000; this.emit({ t: 'secret' }); this.sound('secret'); }
        if (a.exit) { this.state = 'done'; this.stats.time = this.time; this.emit({ t: 'levelDone' }); }
      }
    }
    startWave(id) {
      const w = this.waves[id]; if (!w || w.started) return;
      w.started = true;
    }
    updateWaves() {
      for (const id in this.waves) {
        const w = this.waves[id]; if (!w.started || w.done) continue;
        let pending = false;
        for (const g of w.groups) {
          if (g.left <= 0) continue; pending = true;
          g.t -= DT;
          while (g.t <= 0 && g.left > 0) {
            this.spawnFromGroup(w, g.g); g.left--;
            if (g.g.every) { g.t += g.g.every; } else if (g.left > 0) continue;
          }
        }
        if (!pending && w.alive <= 0) { w.done = true; this.emit({ t: 'waveDone', id }); this.runActions(w.def.then); }
      }
    }
    updateGates() {
      for (const id in this.gates) {
        const g = this.gates[id]; if (g.t === g.target) continue;
        g.t = g.t < g.target ? Math.min(g.target, g.t + DT * g.speed) : Math.max(g.target, g.t - DT * g.speed);
        this.W.setGate(id, g.t);
      }
    }

    faceTo(e, tx, tz, rate) { const want = Math.atan2(tx - e.x, tz - e.z), d = wrapAng(want - e.yaw); e.yaw = wrapAng(e.yaw + clamp(d, -rate * DT, rate * DT)); return Math.abs(d); }
    steer(e, speed, direct) {
      const p = this.player; let dx, dz;
      const fd = !direct ? this.W.flowDir(e.x, e.z) : null;
      if (fd) { dx = fd[0]; dz = fd[1]; } else { dx = p.x - e.x; dz = p.z - e.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; }
      const acc = (e.ground || e.fly ? 30 : 4) * DT;
      e.vx += clamp(dx * speed - e.vx, -acc, acc); e.vz += clamp(dz * speed - e.vz, -acc, acc);
      this.faceTo(e, e.x + dx, e.z + dz, 7);
      e.anim.move = Math.min(1, Math.hypot(e.vx, e.vz) / Math.max(1, e.def.speed));
    }
    brake(e, k = 12) { const a = k * DT; e.vx -= clamp(e.vx, -a, a); e.vz -= clamp(e.vz, -a, a); e.anim.move = Math.min(1, Math.hypot(e.vx, e.vz) / Math.max(1, e.def.speed)); }
    onFlowField(e) {
      const W = this.W;
      for (let dz = -1.5; dz <= 1.5; dz += 1.5) for (let dx = -1.5; dx <= 1.5; dx += 1.5) {
        const c = W.cellOf(e.x + dx, e.z + dz);
        if (c >= 0 && W.flow[c] !== 65535 && Math.abs(W.navH[c] - e.y) < 1.2) return true;
      }
      return false;
    }
    rescueStranded(e) {
      const p = this.player, W = this.W;
      e.lostT = 0;
      for (let k = 0; k < 40; k++) {
        const a = this.rng() * Math.PI * 2, d = 14 + this.rng() * 16, x = p.x + Math.sin(a) * d, z = p.z + Math.cos(a) * d, c = W.cellOf(x, z);
        if (c < 0 || W.flow[c] === 65535 || !this.canStand(x, z, Math.min(e.r, 1.5))) continue;
        e.x = x; e.z = z; e.y = W.groundAt(x, z, 0.2); e.vx = e.vy = e.vz = 0; e.spawnT = 0.6;
        this.emit({ t: 'spawn', x, y: e.y, z, r: e.r, h: e.h });
        return true;
      }
      return false;
    }
    shootAt(e, projType, shots, fan, ox, oy, oz) {
      const p = this.player, d = PROJ[projType];
      const tx = p.x + p.vx * 0.25, ty = p.y + 1.1, tz = p.z + p.vz * 0.25;
      let dx = tx - ox, dy = ty - oy, dz = tz - oz; const dist = Math.hypot(dx, dz) || 1;
      if (d.gravity) { const tt = dist / d.speed; dy = dy + 0.5 * d.gravity * tt * tt - (d.up || 0) * tt; }
      const base = Math.atan2(dx, dz), pitch = Math.atan2(dy, dist);
      for (let i = 0; i < shots; i++) {
        const a = base + (shots > 1 ? (i - (shots - 1) / 2) * (fan || 0.1) : 0) + (this.rng() - 0.5) * 0.04;
        const cp = Math.cos(pitch), sp = d.speed;
        this.addProj(projType, ox, oy, oz, Math.sin(a) * cp * sp, Math.sin(pitch) * sp + (d.up || 0), Math.cos(a) * cp * sp, 'e', d.homing ? p : null);
      }
    }
    updateEnemies() {
      const p = this.player, W = this.W;

      this.flowT -= DT;
      if (this.flowT <= 0) { this.flowT = 0.25; const c = W.cellOf(p.x, p.z), gy = W.groundAt(p.x, p.z, 0.2); this.playerOnFloor = p.y - gy < 1.5; if (c !== W.flowCell || this.flowDirty || Math.abs(gy - (W.flowY == null ? gy : W.flowY)) > 0.3) { W.updateFlow(p.x, p.z, gy); W.flowY = gy; this.flowDirty = false; } }
      for (const e of this.enemies) {
        const def = e.def;
        if (e.flash > 0) e.flash -= DT;
        e.anim.t += DT;
        if (e.dead) {
          e.deadT += DT; this.brake(e, 10); if (!e.fly) W.move(e, DT); else { e.vy -= 20 * DT; e.y = Math.max(W.floorAt(e.x, e.z, e.r, e.y + 1), e.y + e.vy * DT); }
          continue;
        }
        if (e.spawnT > 0) { e.spawnT -= DT; if (e.spawnT <= 0) e.state = 'chase'; continue; }
        const dx = p.x - e.x, dz = p.z - e.z, dist = Math.hypot(dx, dz), dy = p.y - e.y;

        if (!e.fly && e.wave && !e.los && this.playerOnFloor && W.flowSeeds > 4) {
          const cut = !this.onFlowField(e);
          e.lostT = cut ? e.lostT + DT : Math.max(0, e.lostT - DT);
          if (e.lostT > 10) this.rescueStranded(e);
        } else e.lostT = 0;
        e.losT -= DT;
        if (e.losT <= 0) {
          e.losT = 0.2 + this.rng() * 0.15;
          e.los = !p.dead && dist < 250 && W.los(e.x, e.y + e.h * 0.8, e.z, p.x, this.eye, p.z);
          if (e.los && !this.seen.has(e.type) && dist < 90) { this.seen.add(e.type); this.emit({ t: 'newEnemy', type: e.type }); }
        }
        if (e.state === 'idle') { if (e.los && dist < 40) { e.state = 'chase'; if (def.sounds.alert) this.sound(def.sounds.alert, e.x, e.y + e.h, e.z); } else { this.brake(e); W.move(e, DT); continue; } }
        if (e.cool > 0) e.cool -= DT;
        if (e.rcool > 0) e.rcool -= DT;
        if (e.atkT > 0) { e.atkT -= DT; e.anim.attack = Math.sin(clamp(1 - e.atkT / 0.5, 0, 1) * Math.PI); } else e.anim.attack = Math.max(0, e.anim.attack - DT * 4);
        if (p.dead) { this.brake(e); W.move(e, DT); e.anim.walk += e.anim.move * DT * 8; continue; }
        const reachD = dist - e.r - PR;
        switch (def.ai) {
          case 'kamikaze': {
            this.steer(e, def.speed, e.los && dist < 30);
            e.screamT -= DT; if (e.screamT <= 0) { e.screamT = 2 + this.rng() * 1.5; if (dist < 80) this.sound('scream', e.x, e.y + 1.5, e.z, 0.8); }
            if (reachD < 0.8 && Math.abs(dy) < 2.5) { e.hp = 0; this.killEnemy(e, 'blast', 99); }
            break;
          }
          case 'melee': case 'kleer': case 'hopper': {
            if (reachD > def.reach * 0.8 || Math.abs(dy) > 2.5) {
              if (def.ai === 'hopper') {
                if (e.ground) { this.brake(e, 20); e.cool -= DT; if (e.modeT <= 0) { const l = dist || 1; e.vx = (dx / l) * def.speed * (0.8 + this.rng() * 0.5); e.vz = (dz / l) * def.speed * (0.8 + this.rng() * 0.5); e.vy = 5.5 + this.rng() * 2; e.ground = false; e.modeT = 0.35 + this.rng() * 0.4; this.faceTo(e, p.x, p.z, 50); if (this.rng() < 0.15) this.sound('hop', e.x, e.y, e.z, 0.5); } else e.modeT -= DT; }
                e.anim.air = e.ground ? 0 : 1;
              } else this.steer(e, def.speed, e.los && dist < 18);
              if (def.ai === 'kleer' && e.ground && dist > 7 && this.rng() < DT * 1.2) { e.vy = 6.5; e.ground = false; const l = dist || 1; e.vx += (dx / l) * 5; e.vz += (dz / l) * 5; }
              if (def.ai === 'kleer' && e.los && dist > 9 && dist < 50 && e.rcool <= 0) { e.rcool = def.rcool + this.rng(); e.atkT = 0.5; this.shootAt(e, def.proj, def.shots, def.fan, e.x, e.y + 1.9, e.z); this.sound('throw', e.x, e.y + 2, e.z, 0.7); }
            } else {
              this.brake(e, 25); this.faceTo(e, p.x, p.z, 10);
              if (e.cool <= 0) { e.cool = def.cool; e.atkT = 0.5; e.hitP = true; if (def.sounds.attack) this.sound(def.sounds.attack, e.x, e.y + 1, e.z, 0.8); }
            }
            if (e.hitP && e.atkT < 0.25) { e.hitP = false; if (reachD < def.reach && Math.abs(dy) < 2.5) { this.hurtPlayer(def.dmg, e.x, e.z, 'melee'); const l = dist || 1; this.knock(p, (dx / l) * 3, 1.5, (dz / l) * 3); } }
            break;
          }
          case 'charge': {
            if (e.mode === 'charge') {
              e.modeT -= DT; e.anim.charge = 1;
              const want = Math.atan2(dx, dz); const dd = wrapAng(want - e.yaw);
              if (Math.abs(dd) < 1.2) e.yaw = wrapAng(e.yaw + clamp(dd, -0.9 * DT, 0.9 * DT));
              const cs = def.charge; e.vx = Math.sin(e.yaw) * cs; e.vz = Math.cos(e.yaw) * cs; e.anim.move = 1.4;
              if (!e.hitP && reachD < 0.9 && Math.abs(dy) < 2.5) { e.hitP = true; this.hurtPlayer(def.dmg, e.x, e.z, 'charge'); this.knock(p, Math.sin(e.yaw) * def.knock, 8, Math.cos(e.yaw) * def.knock); this.sound(def.sounds.attack, e.x, e.y + 1.5, e.z); }
              const passed = (dx * Math.sin(e.yaw) + dz * Math.cos(e.yaw)) < -6;
              if (e.modeT <= 0 || passed || e.hitWall) { e.mode = 'recover'; e.modeT = 0.9; e.cool = def.cool; }
            } else if (e.mode === 'recover') { this.brake(e, 20); e.anim.charge = Math.max(0, e.anim.charge - DT * 2); e.modeT -= DT; if (e.modeT <= 0) e.mode = 'walk'; }
            else {
              this.steer(e, def.speed, e.los && dist < 20); e.anim.charge = 0;
              if (e.los && dist < 45 && dist > 4 && e.cool <= 0 && this.faceTo(e, p.x, p.z, 4) < 0.25) { e.mode = 'charge'; e.modeT = 3.5; e.hitP = false; this.sound('bull', e.x, e.y + 2, e.z); }
            }
            break;
          }
          case 'ranged': case 'gunner': {
            const wantMove = !e.los || dist > def.range * 0.8 || dist > def.keep * 2.5;
            if (e.burst > 0) { this.brake(e, 20); }
            else if (wantMove) this.steer(e, def.speed, false);
            else {

              e.modeT -= DT; if (e.modeT <= 0) { e.modeT = 1 + this.rng() * 2; e.side = this.rng() < 0.5 ? -1 : this.rng() < 0.5 ? 0 : 1; }
              const l = dist || 1, sx = -dz / l * (e.side || 0), sz = dx / l * (e.side || 0), sp = def.speed * 0.6, acc = 20 * DT;
              const bk = dist < def.keep ? -1 : 0;
              e.vx += clamp((sx + (dx / l) * bk) * sp - e.vx, -acc, acc); e.vz += clamp((sz + (dz / l) * bk) * sp - e.vz, -acc, acc);
              e.anim.move = Math.min(1, Math.hypot(e.vx, e.vz) / def.speed);
              this.faceTo(e, p.x, p.z, 6);
            }
            e.anim.aim = Math.max(0, Math.min(1, e.anim.aim + (e.los && dist < def.range ? DT * 3 : -DT * 3)));
            if (def.ai === 'gunner') {
              if (e.burst > 0) {
                e.burstT -= DT; this.faceTo(e, p.x, p.z, 3);
                if (e.burstT <= 0) {
                  e.burstT = 0.08; e.burst--; e.atkT = 0.1;
                  const ox = e.x + Math.sin(e.yaw) * 0.6, oy = e.y + 2.9, oz = e.z + Math.cos(e.yaw) * 0.6;
                  const miss = this.rng() < 0.45 + Math.min(0.4, Math.hypot(p.vx, p.vz) * 0.04);
                  const tx = p.x + (miss ? (this.rng() - 0.5) * 3 : 0), ty = p.y + 1.1 + (miss ? (this.rng() - 0.5) * 2 : 0), tz = p.z + (miss ? (this.rng() - 0.5) * 3 : 0);
                  const clear = W.los(ox, oy, oz, tx, ty, tz);
                  this.emit({ t: 'tracer', x0: ox, y0: oy, z0: oz, x1: tx, y1: ty, z1: tz, enemy: true });
                  this.sound('arachgun', ox, oy, oz, 0.6);
                  if (!miss && clear) this.hurtPlayer(def.dmg, e.x, e.z, 'bullet');
                }
              } else if (e.los && dist < def.range && e.cool <= 0 && this.faceTo(e, p.x, p.z, 4) < 0.3) { e.cool = def.cool; e.burst = def.burst; e.burstT = 0.3; }
            } else if (e.los && dist < def.range && e.cool <= 0 && this.faceTo(e, p.x, p.z, 5) < 0.35) {
              e.cool = def.cool * (0.8 + this.rng() * 0.4); e.atkT = 0.5; e.pendingShot = 0.22;
            }
            if (e.pendingShot > 0) {
              e.pendingShot -= DT;
              if (e.pendingShot <= 0) {
                const s = e.def.model === 'biomajor' ? 1.75 : 1, side = Math.cos(e.yaw), sd = -Math.sin(e.yaw);
                const oy = e.y + (def.model.startsWith('bio') ? 2.9 * s : def.model === 'golem' ? 3.2 : 1.5);
                const off = def.model.startsWith('bio') ? 0.95 * s : 0.36;
                if (def.model.startsWith('bio')) { this.shootAt(e, def.proj, def.shots / 2, def.fan, e.x + side * off, oy, e.z + sd * off); this.shootAt(e, def.proj, def.shots / 2, def.fan, e.x - side * off, oy, e.z - sd * off); }
                else this.shootAt(e, def.proj, def.shots, def.fan, e.x + side * off + Math.sin(e.yaw) * 0.6, oy, e.z + sd * off + Math.cos(e.yaw) * 0.6);
                this.sound(def.proj === 'e_rocket' || def.proj === 'e_bio' ? 'erocket' : def.proj === 'e_lava' ? 'lava' : 'efire', e.x, oy, e.z, 0.8);
              }
            }
            break;
          }
          case 'flyer': {
            const ty = p.y + def.fly + Math.sin(e.anim.t * 1.3 + e.id) * 1.5;
            if (e.mode === 'dive') {
              const l = Math.hypot(dx, p.y + 1 - e.y, dz) || 1;
              e.vx = (dx / l) * def.speed * 1.5; e.vz = (dz / l) * def.speed * 1.5; e.vy = ((p.y + 1 - e.y) / l) * def.speed * 1.5;
              this.faceTo(e, p.x, p.z, 10);
              if (l < 2.2) { this.hurtPlayer(def.dmg, e.x, e.z, 'melee'); this.sound('claw', e.x, e.y, e.z); e.mode = 'climb'; e.modeT = 1.5; e.atkT = 0.5; }
              e.modeT -= DT; if (e.modeT <= 0) { e.mode = 'climb'; e.modeT = 1.5; }
            } else {
              e.orbit += DT * 0.6; const R = e.mode === 'climb' ? 18 : 13;
              const gx = p.x + Math.cos(e.orbit) * R, gz = p.z + Math.sin(e.orbit) * R;
              let vx = gx - e.x, vz = gz - e.z; const l = Math.hypot(vx, vz) || 1; const sp = Math.min(def.speed, l * 2);
              e.vx += clamp((vx / l) * sp - e.vx, -20 * DT, 20 * DT); e.vz += clamp((vz / l) * sp - e.vz, -20 * DT, 20 * DT); e.vy = clamp((ty - e.y) * 2, -6, 6);
              this.faceTo(e, p.x, p.z, 5);
              if (e.mode === 'climb') { e.modeT -= DT; if (e.modeT <= 0) e.mode = 'walk'; }
              else if (e.los && e.cool <= 0 && dist < 30 && this.rng() < DT * 0.8) { e.mode = 'dive'; e.modeT = 2.5; e.cool = def.cool * 2; this.sound('harpy', e.x, e.y, e.z); }
              else if (e.los && e.rcool <= 0 && dist < 45) { e.rcool = def.rcool + this.rng(); e.atkT = 0.5; this.shootAt(e, def.proj, 1, 0, e.x, e.y + 0.9, e.z); this.sound('efire', e.x, e.y, e.z, 0.5); }
            }
            e.anim.move = 1;
            break;
          }
          case 'boss': {
            e.anim.stomp = Math.max(0, e.anim.stomp - DT * 1.5);
            if (e.mode === 'walk' || !e.mode) {
              if (dist > 40) this.steer(e, def.speed, true); else if (dist < 20) { const l = dist || 1; this.brake(e, 10); e.vx -= (dx / l) * 2 * DT; e.vz -= (dz / l) * 2 * DT; e.anim.move = 0.4; } else this.brake(e, 6);
              this.faceTo(e, p.x, p.z, 1.2);
              if (e.cool <= 0) {
                const r = this.rng();
                if (dist < 18 && e.ground) { e.mode = 'stomp'; e.modeT = 1.2; }
                else if (r < 0.5) { e.mode = 'fire'; e.modeT = 2.4; e.burst = 5; e.burstT = 0.6; }
                else { e.mode = 'rockets'; e.modeT = 2.2; e.burst = 6; e.burstT = 0.5; }
              }
            } else {
              this.brake(e, 8); this.faceTo(e, p.x, p.z, 1.6); e.modeT -= DT;
              if (e.mode === 'fire' || e.mode === 'rockets') {
                e.anim.aim = Math.min(1, e.anim.aim + DT * 3); e.burstT -= DT;
                if (e.burst > 0 && e.burstT <= 0) {
                  e.burst--; e.burstT = e.mode === 'fire' ? 0.32 : 0.22; e.atkT = 0.3;
                  const sc = def.h / 2.3, side = Math.cos(e.yaw), sd = -Math.sin(e.yaw), fw = Math.sin(e.yaw), fz = Math.cos(e.yaw);
                  if (e.mode === 'fire') { const ox = e.x + side * 0.62 * sc + fw * 0.4 * sc, oz = e.z + sd * 0.62 * sc + fz * 0.4 * sc; this.shootAt(e, 'e_boss', 1, 0, ox, e.y + 1.5 * sc, oz); this.sound('bossfire', ox, e.y + 15, oz); }
                  else { const ox = e.x - side * 0.45 * sc, oz = e.z - sd * 0.45 * sc; this.shootAt(e, 'e_bossrock', 1, 0, ox, e.y + 2.2 * sc, oz); this.sound('erocket', ox, e.y + 20, oz); }
                }
              } else if (e.mode === 'stomp') {
                e.anim.stomp = Math.min(1, e.anim.stomp + DT * 3);
                if (e.modeT < 0.5 && !e.stomped) { e.stomped = true; this.emit({ t: 'shake', a: 1.2 }); this.sound('stomp', e.x, e.y, e.z); this.emit({ t: 'explosion', x: e.x + Math.sin(e.yaw) * 6, y: e.y, z: e.z + Math.cos(e.yaw) * 6, r: 10, big: true, dust: true }); if (dist < 22 && p.ground) { this.hurtPlayer(def.dmg * (1 - dist / 26), e.x, e.z, 'stomp'); const l = dist || 1; this.knock(p, (dx / l) * def.knock, 9, (dz / l) * def.knock); } }
              }
              if (e.modeT <= 0) { e.mode = 'walk'; e.cool = 0.8 + this.rng() * 1.2; e.stomped = false; e.anim.aim = 0; }
            }
            break;
          }
        }
        e.anim.walk += e.anim.move * DT * (def.ai === 'kleer' ? 9 : def.ai === 'charge' ? 9 : def.hp > 200 ? 4.5 : 10);
        W.move(e, DT);

        if (e.hitWall && !e.fly) { e.stuck += DT; if (e.stuck > 0.6) { e.stuck = 0; const a = e.yaw + (this.rng() < 0.5 ? 1.6 : -1.6); e.vx = Math.sin(a) * def.speed; e.vz = Math.cos(a) * def.speed; } } else e.stuck = 0;
      }

      const H = this.cellHash; H.clear();
      for (const e of this.enemies) { if (e.dead || e.spawnT > 0) continue; const k = (Math.floor(e.x / 3) & 1023) * 1024 + (Math.floor(e.z / 3) & 1023); let l = H.get(k); if (!l) H.set(k, l = []); l.push(e); }
      for (const e of this.enemies) {
        if (e.dead || e.spawnT > 0) continue;
        const cx = Math.floor(e.x / 3), cz = Math.floor(e.z / 3);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
          const l = H.get(((cx + a) & 1023) * 1024 + ((cz + b) & 1023)); if (!l) continue;
          for (const o of l) {
            if (o.id <= e.id || e.fly !== o.fly) continue;
            const dx = o.x - e.x, dz = o.z - e.z, rr = e.r + o.r, d2 = dx * dx + dz * dz;
            if (d2 >= rr * rr || Math.abs(o.y - e.y) > 2) continue;
            const d = Math.sqrt(d2) || 0.01, push = (rr - d) * 0.5, mw = e.def.hp / (e.def.hp + o.def.hp);
            const nx = dx / d, nz = dz / d; e.x -= nx * push * (1 - mw) * 2; e.z -= nz * push * (1 - mw) * 2; o.x += nx * push * mw * 2; o.z += nz * push * mw * 2;
          }
        }

        const dx = e.x - p.x, dz = e.z - p.z, rr = e.r + PR, d2 = dx * dx + dz * dz;
        if (d2 < rr * rr && Math.abs(e.y - p.y) < 1.7 && !p.dead) { const d = Math.sqrt(d2) || 0.01; e.x += (dx / d) * (rr - d); e.z += (dz / d) * (rr - d); }
      }

      this.enemies = this.enemies.filter(e => !(e.dead && (e.gibbed || e.deadT > 8)));
    }

    updateProjectiles() {
      const p = this.player, W = this.W;
      for (const pr of this.projs) {
        if (pr.dead) continue;
        const d = pr.def;
        pr.life -= DT; if (pr.life <= 0) { this.projHit(pr, null); continue; }
        if (d.fuse) { pr.fuse -= DT; if (pr.fuse <= 0) { this.projHit(pr, null); continue; } }
        if (d.homing && pr.target && !p.dead) {
          const tx = p.x - pr.x, ty = p.y + 1 - pr.y, tz = p.z - pr.z, tl = Math.hypot(tx, ty, tz) || 1, sp = Math.hypot(pr.vx, pr.vy, pr.vz) || 1;
          const k = Math.min(1, d.homing * DT);
          pr.vx += ((tx / tl) * sp - pr.vx) * k; pr.vy += ((ty / tl) * sp - pr.vy) * k; pr.vz += ((tz / tl) * sp - pr.vz) * k;
          const nl = Math.hypot(pr.vx, pr.vy, pr.vz) || 1; pr.vx *= sp / nl; pr.vy *= sp / nl; pr.vz *= sp / nl;
        }
        if (d.gravity) pr.vy -= d.gravity * DT;
        pr.px = pr.x; pr.py = pr.y; pr.pz = pr.z;
        const sx = pr.vx * DT, sy = pr.vy * DT, sz = pr.vz * DT, len = Math.hypot(sx, sy, sz);
        if (len < 1e-6) continue;
        const dx = sx / len, dy = sy / len, dz = sz / len;

        let hitT = len, hitE = null, hitP = false;
        if (pr.owner === 'p') {
          for (const e of this.enemies) {
            if (e.dead || e.spawnT > 0 || (pr.hitSet && pr.hitSet.has(e.id))) continue;
            if (Math.abs(e.x - pr.x) > len + e.r + 2 || Math.abs(e.z - pr.z) > len + e.r + 2) continue;
            const t = rayCyl(pr.x, pr.y, pr.z, dx, dy, dz, e.x, e.z, e.r + d.size, e.y, e.y + e.h);
            if (t >= 0 && t <= hitT) { hitT = t; hitE = e; }
          }
        } else if (!p.dead) {
          const t = rayCyl(pr.x, pr.y, pr.z, dx, dy, dz, p.x, p.z, PR + d.size, p.y, p.y + PH);
          if (t >= 0 && t <= hitT) { hitT = t; hitP = true; }
        }
        const wh = W.ray(pr.x, pr.y, pr.z, dx, dy, dz, Math.min(len, hitT) + d.size * 0.5, true);
        if (wh && wh.t <= hitT) {
          const hx = pr.x + dx * wh.t, hy = pr.y + dy * wh.t, hz = pr.z + dz * wh.t;
          if (d.bounce) {
            const n = wh.n, vn = pr.vx * n[0] + pr.vy * n[1] + pr.vz * n[2];
            pr.x = hx + n[0] * 0.05; pr.y = hy + n[1] * 0.05; pr.z = hz + n[2] * 0.05;
            pr.vx -= (1 + d.bounce) * vn * n[0]; pr.vy -= (1 + d.bounce) * vn * n[1]; pr.vz -= (1 + d.bounce) * vn * n[2];
            if (n[1] > 0.6) { const fr = d.roll ? 0.985 : 0.8; pr.vx *= fr; pr.vz *= fr; if (Math.abs(pr.vy) < 2) { pr.vy = 0; pr.rolling = true; pr.y = hy + d.size; } }
            if (Math.abs(vn) > 3) this.sound(d.roll ? 'ballbounce' : 'bounce', pr.x, pr.y, pr.z, Math.min(1, Math.abs(vn) / 15));
            continue;
          }
          pr.x = hx - dx * 0.1; pr.y = hy - dy * 0.1; pr.z = hz - dz * 0.1;
          this.projHit(pr, null, wh.n);
          continue;
        }
        if (hitE) {
          const hx = pr.x + dx * hitT, hy = pr.y + dy * hitT, hz = pr.z + dz * hitT;
          if (d.pierce) {
            (pr.hitSet || (pr.hitSet = new Set())).add(hitE.id);
            const before = hitE.hp; this.hurtEnemy(hitE, d.dmg, 'ball', hx, hy, hz);
            if (before > d.dmg * (p.power > 0 ? 4 : 1)) { pr.x = hx; pr.y = hy; pr.z = hz; this.projHit(pr, null); continue; }
            pr.x += sx; pr.y += sy; pr.z += sz; continue;
          }
          pr.x = hx; pr.y = hy; pr.z = hz;
          if (d.dmg) this.hurtEnemy(hitE, d.dmg, 'bullet', hx, hy, hz);
          this.projHit(pr, hitE);
          continue;
        }
        if (hitP) { pr.x += dx * hitT; pr.y += dy * hitT; pr.z += dz * hitT; if (d.dmg) this.hurtPlayer(d.dmg, pr.px, pr.pz, 'proj'); this.projHit(pr, 'player'); continue; }
        pr.x += sx; pr.y += sy; pr.z += sz;
        if (pr.y < -20 || pr.x < W.bx0 - 20 || pr.x > W.bx1 + 20 || pr.z < W.bz0 - 20 || pr.z > W.bz1 + 20) pr.dead = true;
        if (d.roll && pr.rolling && Math.hypot(pr.vx, pr.vz) < 1) {  }
      }
      this.projs = this.projs.filter(q => !q.dead);
    }
    projHit(pr, what, n) {
      const d = pr.def; pr.dead = true;
      if (d.splash) this.explode(pr.x, pr.y, pr.z, d.splash, d.radius, pr.owner === 'p' ? 'p' : 'e');
      else this.emit({ t: 'impact', x: pr.x, y: pr.y, z: pr.z, n: n || [0, 1, 0], energy: d.sprite || [1, 1, 1], small: true });
      void what;
    }

    tick(inp = {}) {
      if (this.state === 'done') return;
      this.time += DT; if (this.state === 'play') this.stats.time = this.time;
      this.updatePlayer(inp);
      this.updateGates();
      this.updateWaves();
      this.updateEnemies();
      this.updateProjectiles();
      for (const it of this.items) if (it.taken) it.gone = true;
      if (this.items.length > 0 && this.items.some(i => i.gone)) this.items = this.items.filter(i => !i.gone);
    }
    get dt() { return DT; }
    activeEnemies() { let n = 0; for (const e of this.enemies) if (!e.dead && e.state !== 'idle') n++; return n; }
    boss() { return this.enemies.find(e => e.def.boss && !e.dead) || null; }

    cheat(name) {
      const p = this.player;
      if (name === 'god') { p.god = !p.god; return p.god ? 'cheatOn' : 'cheatOff'; }
      if (name === 'giveall') { for (const w of WEAPON_ORDER) p.weapons.add(w); for (const a in AMMO) p.ammo[a] = AMMO[a].max; p.dual = true; p.hp = Math.max(p.hp, 200); p.armor = 200; return 'cheatAll'; }
      if (name === 'killall') { for (const e of this.enemies) if (!e.dead && !e.def.boss) this.hurtEnemy(e, 1e6, 'env', e.x, e.y + 1, e.z); return 'cheatKill'; }
      return null;
    }

    setNoclip(on) {
      const p = this.player; p.noclip = !!on;
      p.vx = p.vy = p.vz = 0; p.ground = false;
    }
    debugHeal() {
      const p = this.player, revived = p.dead;
      if (revived) { p.dead = false; this.state = 'play'; }
      p.hp = Math.max(p.hp, 100); p.hurtT = 0;
      return revived;
    }
    debugArmor() { this.player.armor = 200; }
    debugGive(w) {
      const p = this.player, d = WEAPONS[w];
      p.weapons.add(w);
      if (w === 'colt') { p.dual = true; p.clip = 12; }
      if (d.ammo) p.ammo[d.ammo] = AMMO[d.ammo].max;
      this.selectWeapon(w, true);
    }
    debugGiveAll() {
      const p = this.player;
      for (const w of WEAPON_ORDER) p.weapons.add(w);
      for (const a in AMMO) p.ammo[a] = AMMO[a].max;
      p.dual = true; if (p.cur === 'colt') p.clip = 12;
    }
  }

  const MOTION_KEYS = ['x', 'y', 'z'];
  const TELEPORT = 6;
  function snapshotMotion(g) {
    for (const list of [g.enemies, g.projs]) for (const o of list) { o.ipx = o.x; o.ipy = o.y; o.ipz = o.z; o.ipyaw = o.yaw; }
    const p = g.player; p.ipbob = p.bob; p.ipkick = p.kick;
  }
  function withMotionLerp(g, a, draw) {
    const saved = [];
    const lerp = o => {
      if (o.ipx == null || Math.hypot(o.x - o.ipx, o.z - o.ipz) > TELEPORT) return;
      saved.push([o, o.x, o.y, o.z, o.yaw]);
      for (const k of MOTION_KEYS) o[k] = o['ip' + k] + (o[k] - o['ip' + k]) * a;
      if (o.yaw != null && o.ipyaw != null) o.yaw = o.ipyaw + wrapAng(o.yaw - o.ipyaw) * a;
    };
    for (const list of [g.enemies, g.projs]) for (const o of list) lerp(o);
    const p = g.player, bob = p.bob, kick = p.kick;
    if (p.ipbob != null) { p.bob = p.ipbob + (p.bob - p.ipbob) * a; p.kick = p.ipkick + (p.kick - p.ipkick) * a; }
    try { return draw(); } finally {
      for (const [o, x, y, z, yaw] of saved) { o.x = x; o.y = y; o.z = z; o.yaw = yaw; }
      p.bob = bob; p.kick = kick;
    }
  }

  S.Game = Game; S.rayCyl = rayCyl; S.snapshotMotion = snapshotMotion; S.withMotionLerp = withMotionLerp; S.newInventory = newInventory; S.GAME = { DT, EYE, PR, PH, RUN, WALK, JUMP, FLY };
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.SeriousSam98 = globalThis.SeriousSam98 || {});
