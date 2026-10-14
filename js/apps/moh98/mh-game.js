(function (S) {
  'use strict';
  const { clamp, lerp, RNG, wrapAng } = S;
  const D = S.DATA, WP = D.WEAPONS, PK = D.PICKUPS;
  const DT = 1 / 60, EYE = 1.62, EYE_CROUCH = 1.02;

  class Game {
    constructor(opt = {}) {
      this.mi = opt.mission || 0;
      this.mission = S.MISSIONS[this.mi];
      this.skill = opt.skill == null ? 1 : opt.skill;
      this.sk = D.SKILLS[this.skill];
      this.lang = opt.lang || 'ru';
      this.codes = Object.assign({}, opt.codes || {});
      this.rng = RNG(opt.seed || 12345);
      this.realT = 0; this.events = [];
      this.player = this.newPlayer();
      this.own = []; this.ammo = {}; this.mag = {}; this.items = {}; this.charges = 0; this.cur = null;
      this.stats = { time: 0, shots: 0, hits: 0, kills: 0, headshots: 0, dmgTaken: 0, alarms: 0, dishonor: 0, minHp: 100 };
      this.alarm = false; this.alarmLate = false; this.done = false; this.failed = null; this.msgT = {};
      this.god = !!this.codes.BULLETPROOF;
      this.giveKit(this.mission.kit);
      if (this.codes.ARSENAL) this.giveArsenal();
      this.loadLevel();
    }
    L(o) { return o == null ? '' : typeof o === 'string' ? o : (o[this.lang] || o.ru || o.en || ''); }
    emit(e) { this.events.push(e); return e; }
    msg(text, color = '#f0e8c8', key = null, every = 0) {
      if (key) { const t = this.msgT[key]; if (t != null && this.realT - t < every) return; this.msgT[key] = this.realT; }
      this.emit({ t: 'msg', text: this.L(text), color });
    }
    sound(s, x, y, z, vol = 1) { this.emit({ t: 'sound', s, x, y, z, vol }); }
    str(k) { return D.STR[this.lang][k] || k; }
    get eye() { const p = this.player; return p.y + lerp(EYE, EYE_CROUCH, p.crouch) - (p.dead ? 1.2 : 0); }
    forward() { const p = this.player, cp = Math.cos(p.pitch); return [Math.sin(p.yaw) * cp, Math.sin(p.pitch), Math.cos(p.yaw) * cp]; }
    newPlayer() {
      return { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: 0.34, h: 1.8, yaw: 0, pitch: 0, ground: true, hp: 100, crouch: 0, lean: 0, dead: false, bob: 0, aim: 0, walk: false, hurtT: 0,
        w: { state: 'idle', t: 0, trig: false, kick: 0, next: null } };
    }
    giveKit(kit) {
      for (const w of kit.weapons) this.giveWeapon(w, true);
      for (const k in kit.ammo) { if (k === 'charges') this.charges += kit.ammo[k]; else this.ammo[k] = Math.min(D.AMMO[k].max, (this.ammo[k] || 0) + kit.ammo[k]); }
      this.cur = this.own.find(w => WP[w].cat === 2) || this.own[0];
    }
    giveArsenal() {
      for (const w of ['colt', 'silenced', 'thompson', 'garand', 'bar', 'springfield', 'bazooka', 'grenade', 'mp40', 'stg44', 'kar98']) this.giveWeapon(w, true);
      for (const k in D.AMMO) this.ammo[k] = D.AMMO[k].max;
      this.charges = Math.max(this.charges, 4);
    }
    giveWeapon(id, full) {
      const d = WP[id]; if (!d) return false;
      const fresh = !this.own.includes(id);
      if (fresh) { this.own.push(id); this.own.sort((a, b) => WP[a].cat - WP[b].cat); }
      if (d.mag && fresh) this.mag[id] = full ? d.mag : 0;
      return fresh;
    }
    addAmmo(type, n) {
      const A = D.AMMO[type]; if (!A) return 0;
      const have = this.ammo[type] || 0, k = Math.max(0, Math.min(n, A.max - have));
      this.ammo[type] = have + k; return k;
    }

    loadLevel() {
      const def = S.LEVELS[this.mission.level](); this.def = def; this.W = new S.World(def);
      const W = this.W;
      this.projs = []; this.actors = []; this.tanks = []; this.pickups = []; this.planted = [];
      this.doors = def.doors.map(d => Object.assign(d, { open: 0, target: 0, idleT: 0 }));
      this.targets = def.targets.map(t => Object.assign({}, t, { dead: false, detonated: 0, dmg: 0 }));
      this.plants = def.plants.map(p => Object.assign({}, p, { planted: false }));
      def.npcs.forEach((n, i) => this.actors.push(S.makeHuman(this, n, i)));
      def.dogs.forEach((n, i) => this.actors.push(S.makeDog(this, n, i)));
      def.tanks.forEach(t => this.tanks.push(S.makeTank(this, t)));
      for (const p of def.pickups) this.pickups.push({ id: p.id, x: p.x, z: p.z, y: p.y != null ? p.y : W.groundAt(p.x, p.z, 0.1), ph: (p.x * 3 + p.z) % 6 });
      const sp = def.spawns.start, p = this.player;
      p.x = sp.x; p.z = sp.z; p.y = sp.y != null ? sp.y : W.groundAt(sp.x, sp.z, 0.3); p.yaw = sp.yaw || 0; p.pitch = 0;
      this.objectives = this.mission.objectives.map(o => Object.assign({ state: 'active' }, o));
      this.disguised = !!this.mission.disguise;
      if (this.disguised) this.cur = 'papers';
      this.emit({ t: 'level', id: def.id });
    }
    actorById(id) { return this.actors.find(a => a.id === id) || null; }
    targetById(id) { return this.targets.find(t => t.id === id) || null; }
    inRect(r, x, z) { return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1; }
    zone(id) { return this.def.zones.find(z => z.id === id); }

    tick(inp = {}) {
      const p = this.player;
      this.realT += DT;
      if (!this.done && !this.failed) this.stats.time += DT;
      if (!p.dead) this.updatePlayer(inp);
      else { p.vx *= 0.9; p.vz *= 0.9; this.W.move(p, DT); }
      this.updateDoors();
      this.updatePlants();
      this.updateProjectiles();
      S.updateActors(this);
      S.updateTanks(this);
      this.updatePickups();
      this.updateObjectives();
      if (this.alarmT > 0) this.alarmT -= DT;
    }

    updatePlayer(inp) {
      const p = this.player, W = this.W;
      if (inp.dyaw) p.yaw = wrapAng(p.yaw + inp.dyaw);
      if (inp.dpitch) p.pitch = clamp(p.pitch + inp.dpitch, -1.45, 1.45);
      if (inp.crouch) p.crouch = Math.min(1, p.crouch + DT * 5);
      else { const c = W.ceilAt(p.x, p.z, p.r, p.y + 1.0); if (c > p.y + 1.85) p.crouch = Math.max(0, p.crouch - DT * 5); }
      p.h = 1.8 - p.crouch * 0.6;
      p.lean += ((inp.lean || 0) - p.lean) * Math.min(1, DT * 8);
      p.walk = !!inp.walk;
      let speed = p.walk ? 2.2 : 4.7;
      if (p.crouch > 0.5) speed = 1.9;
      if (p.aim > 0.5) speed *= 0.6;
      const f = inp.fwd || 0, s = inp.strafe || 0, l = Math.hypot(f, s) || 1;
      const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
      const tx = ((sy * f) - (cy * s)) / l * speed, tz = ((cy * f) + (sy * s)) / l * speed;
      const acc = p.ground ? 12 : 2;
      p.vx += (tx - p.vx) * Math.min(1, DT * acc); p.vz += (tz - p.vz) * Math.min(1, DT * acc);
      if (inp.jump && p.ground && !p.jumpHeld && p.crouch < 0.5) { p.vy = 5.2; p.ground = false; this.emit({ t: 'jump' }); }
      p.jumpHeld = !!inp.jump;
      const land = W.move(p, DT);
      if (land > 3) this.emit({ t: 'land', v: land });
      if (land > 10) this.hurtPlayer((land - 10) * 8, 'fall', null);
      for (const t of this.tanks) { const dx = p.x - t.x, dz = p.z - t.z, d = Math.hypot(dx, dz), rr = t.r + p.r; if (d < rr && d > 1e-4) { p.x += dx / d * (rr - d); p.z += dz / d * (rr - d); } }
      const hsp = Math.hypot(p.vx, p.vz);
      if (p.ground) { const ob = p.bob; p.bob += hsp * DT * 0.9; if (Math.floor(ob) !== Math.floor(p.bob)) { this.emit({ t: 'step', surf: this.surfaceAt(p.x, p.z, p.y) }); if (!p.walk && p.crouch < 0.5) this.noise(p.x, p.z, 7, 'step'); } }
      p.hurtT = Math.max(0, p.hurtT - DT);
      if (p.hp <= 0) { this.killPlayer(); return; }
      this.updateWeapon(inp);
      this.updateFocus();
      if (inp.use) this.useFocus();
      if (inp.nade) this.quickNade();
    }
    surfaceAt(x, z, y) {
      const g = this.W.terrainAt(x, z);
      if (y > g + 0.15) return 'hard';
      for (const r of this.def.roads) if (S.lineDist(x, z, r.pts).d < r.w / 2) return r.kind === 'cobble' ? 'hard' : r.kind === 'snow' ? 'snow' : 'dirt';
      return this.def.env.snow ? 'snow' : 'grass';
    }
    hurtPlayer(dmg, type, from, dir) {
      const p = this.player; if (p.dead || this.done) return;
      const d = type === 'fall' ? dmg : dmg * this.sk.dmgIn;
      if (!this.god) { p.hp -= d; this.stats.dmgTaken += Math.min(d, Math.max(0, p.hp + d)); }
      p.hurtT = 0.3; this.stats.minHp = Math.min(this.stats.minHp, Math.max(0, p.hp));
      this.emit({ t: 'hurt', dmg: d, dir: dir != null ? dir : from && from.x != null ? Math.atan2(from.x - p.x, from.z - p.z) : null, type });
      if (d > 4) this.emit({ t: 'sound', s: 'pain', vol: 0.8 });
      if (p.hp <= 0) this.killPlayer();
    }
    killPlayer() {
      const p = this.player; if (p.dead) return;
      p.dead = true; p.hp = 0; this.emit({ t: 'pdie' }); this.emit({ t: 'sound', s: 'pdeath' });
    }

    weaponsInCat(c) { return this.own.filter(w => WP[w].cat === c && (!WP[w].throw || (this.ammo[WP[w].ammo] || 0) > 0)); }
    select(id) {
      if (!id || !this.own.includes(id)) return;
      const w = this.player.w;
      if (id === this.cur && w.state !== 'switch') return;
      w.state = 'switch'; w.t = 0.45; w.next = id;
      this.emit({ t: 'switch', w: id });
    }
    selectCat(c) {
      const list = this.weaponsInCat(c); if (!list.length) return;
      const w = this.player.w, cur = w.state === 'switch' ? w.next : this.cur;
      const k = list.indexOf(cur); this.select(list[(k + 1) % list.length]);
    }
    cycle(dir) {
      const list = this.own.filter(w => !WP[w].throw || (this.ammo[WP[w].ammo] || 0) > 0); if (!list.length) return;
      const w = this.player.w, cur = w.state === 'switch' ? w.next : this.cur;
      const k = list.indexOf(cur); this.select(list[(k + dir + list.length) % list.length]);
    }
    updateWeapon(inp) {
      const p = this.player, w = p.w;
      if (inp.cat) this.selectCat(inp.cat);
      if (inp.cycle) this.cycle(inp.cycle);
      w.kick = Math.max(0, w.kick - DT * 3.2);
      if (w.state === 'switch') { w.t -= DT; if (w.t <= 0) { this.cur = w.next; w.state = 'idle'; } p.aim = Math.max(0, p.aim - DT * 6); w.trig = !!inp.fire; return; }
      const id = this.cur, d = WP[id];
      if (!d) { w.trig = !!inp.fire; return; }
      p.aim = clamp(p.aim + (inp.aim && w.state !== 'reload' && !d.throw ? DT * 7 : -DT * 7), 0, 1);
      if (w.state === 'reload') {
        w.t -= DT;
        if (w.t <= 0) { w.state = 'idle'; const need = d.mag - (this.mag[id] || 0), got = Math.min(need, this.ammo[d.ammo] || 0); this.mag[id] = (this.mag[id] || 0) + got; this.ammo[d.ammo] -= got; }
        w.trig = !!inp.fire; return;
      }
      if (w.state === 'cool') { w.t -= DT; if (w.t <= 0) w.state = 'idle'; }
      if (d.papers) { w.trig = !!inp.fire; return; }
      if (d.throw) {
        if (inp.fire && !w.trig && w.state === 'idle' && (this.ammo[d.ammo] || 0) > 0) this.throwGrenade(id);
        w.trig = !!inp.fire; return;
      }
      if (inp.reload && w.state === 'idle') this.startReload(id);
      const fireNow = inp.fire && w.state === 'idle';
      if (fireNow && (d.auto || !w.trig)) {
        if ((this.mag[id] || 0) <= 0) { if (!w.trig) { this.emit({ t: 'sound', s: 'dry' }); if ((this.ammo[d.ammo] || 0) > 0) this.startReload(id); else this.msg(this.str('noAmmo'), '#e0b080', 'noammo', 2); } }
        else this.fireWeapon(id, d);
      }
      w.trig = !!inp.fire;
    }
    startReload(id) {
      const d = WP[id], w = this.player.w;
      if (!d.mag || (this.mag[id] || 0) >= d.mag || (this.ammo[d.ammo] || 0) <= 0) return;
      w.state = 'reload'; w.t = d.reload; this.emit({ t: 'reload', w: id });
    }
    spreadDeg(d) {
      const p = this.player, mv = Math.hypot(p.vx, p.vz);
      let s = lerp(d.spread, d.aim, p.aim);
      s *= 1 + mv * 0.16 + (p.ground ? 0 : 1.5);
      if (p.crouch > 0.5) s *= 0.7;
      return s + p.w.kick * 0.9;
    }
    fireWeapon(id, d) {
      const p = this.player, w = p.w;
      this.mag[id]--; w.state = 'cool'; w.t = 60 / d.rpm;
      const f = this.forward();
      const ex = p.x - Math.cos(p.yaw) * p.lean * 0.35, ez = p.z + Math.sin(p.yaw) * p.lean * 0.35, ey = this.eye - Math.abs(p.lean) * 0.08;
      if (d.proj) {
        this.projs.push({ kind: 'rocket', x: ex + f[0] * 0.8, y: ey + f[1] * 0.8 - 0.05, z: ez + f[2] * 0.8, vx: f[0] * 42, vy: f[1] * 42, vz: f[2] * 42, t: 0, fuse: 4, owner: 'player', dmg: d.dmg, radius: d.radius, straight: true });
        this.stats.shots++;
      } else {
        const spread = this.spreadDeg(d) * Math.PI / 180;
        this.stats.shots++;
        this.bullet('player', ex, ey, ez, this.coneDir(f, spread), d.dmg, true);
      }
      const rec = d.recoil * (p.crouch > 0.5 ? 0.75 : 1) * (1 - p.aim * 0.3) * Math.PI / 180;
      p.pitch = clamp(p.pitch + rec * (0.7 + this.rng() * 0.5), -1.45, 1.45); p.yaw = wrapAng(p.yaw + (this.rng() - 0.5) * rec * 0.7);
      w.kick = Math.min(4, w.kick + d.recoil * 0.4);
      this.emit({ t: 'fire', w: id });
      this.emit({ t: 'sound', s: d.sound, vol: 1 });
      if (d.ping && this.mag[id] === 0) this.emit({ t: 'sound', s: 'ping', vol: 0.8 });
      if (d.bolt && this.mag[id] > 0) this.emit({ t: 'sound', s: 'bolt', vol: 0.6 });
      this.noise(p.x, p.z, d.noise, 'shot');
      if (this.disguised && d.noise > 20) this.raiseAlarm('shot');
    }
    coneDir(f, spread) {
      if (spread <= 0) return f.slice();
      const a = this.rng() * Math.PI * 2, r = Math.sqrt(this.rng()) * Math.tan(spread / 2);
      let ux = -f[2], uz = f[0]; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
      const vx = f[1] * uz, vy = f[2] * ux - f[0] * uz, vz = -f[1] * ux;
      const dx = f[0] + (ux * Math.cos(a) + vx * Math.sin(a)) * r, dy = f[1] + vy * Math.sin(a) * r, dz = f[2] + (uz * Math.cos(a) + vz * Math.sin(a)) * r, l = Math.hypot(dx, dy, dz);
      return [dx / l, dy / l, dz / l];
    }
    trace(ox, oy, oz, dx, dy, dz, maxT, ignore) {
      const wh = this.W.ray(ox, oy, oz, dx, dy, dz, maxT, true);
      let best = wh ? wh.t : maxT, hit = wh ? { t: wh.t, n: wh.n, box: wh.box, terrain: wh.terrain } : null;
      const dl2 = dx * dx + dz * dz;
      for (const a of this.actors) {
        if (a === ignore || a.hidden || (a.dead && a.deadT > 0.4)) continue;
        const cx = a.x - ox, cz = a.z - oz;
        const along = cx * dx + cz * dz; if (along < -1 || along > best + 1) continue;
        const hh = S.actorHead(a);
        { const hx = hh[0] - ox, hy = hh[1] - oy, hz = hh[2] - oz, b = hx * dx + hy * dy + hz * dz, c = hx * hx + hy * hy + hz * hz - hh[3] * hh[3], disc = b * b - c;
          if (disc > 0) { const t = b - Math.sqrt(disc); if (t > 0 && t < best) { best = t; hit = { t, actor: a, loc: 'head' }; } } }
        const r = a.kind === 'human' ? 0.3 : a.r, hgt = S.actorHeight(a);
        if (dl2 < 1e-9) continue;
        const b = cx * dx + cz * dz, c = cx * cx + cz * cz - r * r, disc = b * b - dl2 * c;
        if (disc < 0) continue;
        const sq = Math.sqrt(disc);
        for (const t of [(b - sq) / dl2, (b + sq) / dl2]) {
          if (t <= 0 || t >= best) continue;
          const y = oy + dy * t;
          if (y >= a.y && y <= a.y + hgt * (a.kind === 'human' ? 0.86 : 1)) {
            best = t; let loc = 'torso';
            if (a.kind === 'human') {
              const fr = (y - a.y) / hgt, px = ox + dx * t - a.x, pz = oz + dz * t - a.z, side = Math.abs(px * Math.cos(a.yaw) - pz * Math.sin(a.yaw));
              loc = fr < 0.47 ? 'legs' : fr < 0.58 ? 'groin' : side > 0.2 ? 'arm' : 'torso';
            }
            hit = { t, actor: a, loc }; break;
          }
        }
      }
      for (const tk of this.tanks) {
        const cx = tk.x - ox, cz = tk.z - oz, r = tk.r, b = cx * dx + cz * dz, c = cx * cx + cz * cz - r * r, disc = b * b - dl2 * c;
        if (disc < 0 || dl2 < 1e-9) continue;
        const t = (b - Math.sqrt(disc)) / dl2, y = oy + dy * t;
        if (t > 0 && t < best && y > tk.y && y < tk.y + 2.9) { best = t; hit = { t, tank: tk, n: [-dx, 0, -dz] }; }
      }
      for (const tg of this.targets) {
        if (tg.dead) continue;
        const R = S.TARGET_R[tg.kind] || 1, cx = tg.x - ox, cz = tg.z - oz, b = cx * dx + cz * dz, c = cx * cx + cz * cz - R * R * 0.5, disc = b * b - dl2 * c;
        if (disc < 0 || dl2 < 1e-9) continue;
        const t = (b - Math.sqrt(disc)) / dl2, y = oy + dy * t;
        if (t > 0 && t < best && y > tg.y && y < tg.y + (tg.kind === 'v2' ? 13 : tg.kind === 'radio' ? 1.1 : 3)) { best = t; hit = { t, target: tg, n: [-dx, 0, -dz] }; }
      }
      return hit;
    }
    bullet(shooter, ox, oy, oz, dir, dmg, visual) {
      const ign = shooter === 'player' ? null : shooter;
      const h = this.trace(ox, oy, oz, dir[0], dir[1], dir[2], 260, ign);
      let pt = null;
      if (shooter !== 'player' && !this.player.dead) {
        const p = this.player, cx = p.x - ox, cz = p.z - oz, dl2 = dir[0] * dir[0] + dir[2] * dir[2];
        const b = cx * dir[0] + cz * dir[2], c = cx * cx + cz * cz - 0.32 * 0.32, disc = b * b - dl2 * c;
        if (disc > 0 && dl2 > 1e-9) { const t = (b - Math.sqrt(disc)) / dl2, y = oy + dir[1] * t; if (t > 0 && (!h || t < h.t) && y > p.y && y < p.y + p.h + 0.1) pt = { t, head: y > p.y + p.h - 0.25 }; }
      }
      const end = pt ? pt.t : h ? h.t : 140;
      const ex = ox + dir[0] * end, ey = oy + dir[1] * end, ez = oz + dir[2] * end;
      if (visual) this.emit({ t: 'tracer', a: [ox + dir[0] * 0.8, oy + dir[1] * 0.8 - 0.05, oz + dir[2] * 0.8], b: [ex, ey, ez], enemy: shooter !== 'player' });
      if (shooter !== 'player') { const p = this.player, dd = S.pointLineDist(p.x, this.eye, p.z, ox, oy, oz, ex, ey, ez); if (dd < 1.6 && !pt) this.emit({ t: 'sound', s: 'whiz', x: p.x + dir[0], y: this.eye, z: p.z + dir[2], vol: 0.5 }); }
      if (pt) {
        this.hurtPlayer(dmg * (end > 60 ? 0.75 : 1) * (pt.head ? 1.4 : 1), 'bullet', shooter);
        this.emit({ t: 'sound', s: 'hitflesh', vol: 0.6 });
        return;
      }
      if (!h) return;
      if (h.actor) {
        const a = h.actor; let k = { head: 4, torso: 1, arm: 0.6, legs: 0.7, groin: 1.4 }[h.loc] || 1;
        if (h.loc === 'head' && a.helmet && dmg < 70 && a.kind === 'human' && !a.dead) { a.helmet = false; k = 0.35; this.emit({ t: 'helmet', uid: a.uid, x: a.x, y: a.y + 1.8, z: a.z, yaw: Math.atan2(dir[0], dir[2]) }); this.sound('helmet', a.x, a.y + 1.8, a.z); if (a.ai) S.bark(this, a, D.BARKS.helmet, true); }
        if (this.codes.HEADHUNTER && shooter === 'player' && h.loc !== 'head' && a.kind === 'human') k = 0;
        if (shooter === 'player' && !a.dead) { this.stats.hits++; if (h.loc === 'head' && k > 1) a.lastHead = true; else a.lastHead = false; }
        S.damageActor(this, a, dmg * k * (end > 80 ? 0.8 : 1), 'bullet', shooter, dir, 1.5, h.loc);
        this.emit({ t: 'blood', x: ex, y: ey, z: ez, n: h.loc === 'head' ? 8 : 5 });
      } else if (h.tank) {
        this.emit({ t: 'impact', x: ex, y: ey, z: ez, n: h.n, surf: 'metal' }); this.sound('ricochet', ex, ey, ez, 0.7);
      } else if (h.target) {
        this.emit({ t: 'impact', x: ex, y: ey, z: ez, n: h.n, surf: 'metal' });
        if (!h.target.explosive && h.target.hp > 1) this.damageTarget(h.target, dmg, shooter === 'player');
      } else {
        const tx = h.box ? h.box.tex : '';
        const surf = h.terrain ? (this.def.env.snow ? 'snow' : 'dirt') : /metal|rust|door|quay/.test(tx) ? 'metal' : /planks|crate|logs|bark/.test(tx) ? 'wood' : /glass/.test(tx) ? 'glass' : 'stone';
        this.emit({ t: 'impact', x: ex, y: ey, z: ez, n: h.n, surf });
      }
      if (shooter === 'player') for (const a of this.actors) if (!a.dead && !a.hidden && a.kind === 'human' && !a.ally) { const d = S.pointLineDist(a.x, a.y + 1.2, a.z, ox, oy, oz, ex, ey, ez); if (d < 2.5) S.alertActor(this, a, this.player.x, this.player.z, 'shot'); }
    }
    damageTarget(tg, dmg, byPlayer) {
      if (tg.dead) return;
      tg.dmg += dmg;
      if (tg.dmg >= tg.hp && tg.hp > 1) this.destroyTarget(tg, byPlayer);
    }
    destroyTarget(tg) {
      if (tg.dead) return;
      tg.dead = true;
      this.emit({ t: 'explosion', x: tg.x, y: tg.y + 1.2, z: tg.z, r: tg.kind === 'radio' ? 3 : 9 });
      this.emit({ t: 'sound', s: 'explosion', x: tg.x, y: tg.y + 1, z: tg.z, vol: 1.6 });
      this.emit({ t: 'targetDown', id: tg.id, kind: tg.kind });
      this.msg(this.str('targetDown'), '#f0d080');
      if (tg.kind !== 'radio') this.blast(tg.x, tg.y + 1, tg.z, 6, 120, 'player');
    }
    throwGrenade(id, fromNade) {
      const d = WP[id], p = this.player, f = this.forward(), sp = 14;
      if ((this.ammo[d.ammo] || 0) <= 0) return false;
      this.ammo[d.ammo]--;
      this.projs.push({ kind: id, x: p.x + f[0] * 0.5, y: this.eye + f[1] * 0.5 - 0.1, z: p.z + f[2] * 0.5, vx: f[0] * sp + p.vx * 0.5, vy: f[1] * sp + 3, vz: f[2] * sp + p.vz * 0.5, t: 0, fuse: d.fuse, owner: 'player', dmg: d.dmg, radius: d.radius, rot: 0 });
      this.emit({ t: 'sound', s: 'throw' }); this.emit({ t: 'fire', w: id, nade: true });
      const w = p.w; w.state = 'cool'; w.t = 0.9;
      if ((this.ammo[d.ammo] || 0) <= 0 && !fromNade) { const next = this.own.find(x => WP[x].cat === 2 || WP[x].cat === 3) || this.own.find(x => WP[x].cat === 1); if (next) { w.state = 'switch'; w.t = 0.9; w.next = next; } }
      return true;
    }
    quickNade() {
      const w = this.player.w; if (w.state !== 'idle' && w.state !== 'cool') return;
      const id = ['grenade', 'stick'].find(g => this.own.includes(g) && (this.ammo[WP[g].ammo] || 0) > 0);
      if (!id) return;
      this.throwGrenade(id, true);
    }
    npcThrow(a, tx, tz, kind = 'stick', fuse = null) {
      const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz), tFlight = clamp(d / 14, 0.6, 1.8);
      const ty = this.W.groundAt(tx, tz, 0.2);
      const W2 = WP[kind] || WP.stick;
      this.projs.push({ kind, x: a.x, y: a.y + 1.6, z: a.z, vx: dx / tFlight, vy: (ty - a.y - 1.6) / tFlight + 0.5 * 20 * tFlight, vz: dz / tFlight, t: 0, fuse: fuse != null ? fuse : W2.fuse, owner: a, dmg: W2.dmg, radius: W2.radius, rot: 0 });
      this.emit({ t: 'sound', s: 'throw', x: a.x, y: a.y + 1.5, z: a.z });
    }
    updateProjectiles() {
      const W = this.W;
      for (const pr of this.projs) {
        pr.t += DT; pr.rot = (pr.rot || 0) + DT * 10;
        if (!pr.straight) pr.vy -= 20 * DT;
        const dx = pr.vx * DT, dy = pr.vy * DT, dz = pr.vz * DT, len = Math.hypot(dx, dy, dz);
        if (pr.straight) {
          if (pr.kind === 'rocket' && this.rng() < 0.6) this.emit({ t: 'smoke', x: pr.x, y: pr.y, z: pr.z });
          const h = this.trace(pr.x, pr.y, pr.z, dx / len, dy / len, dz / len, len + 0.05, pr.owner === 'player' ? null : pr.owner);
          let hitP = false;
          if (pr.owner !== 'player') { const p = this.player; if (Math.hypot(p.x - pr.x, p.z - pr.z) < 0.6 && pr.y > p.y && pr.y < p.y + 1.9) hitP = true; }
          if (h || hitP) {
            const t = h ? Math.max(0, h.t - 0.1) : 0;
            pr.x += dx / len * t; pr.y += dy / len * t; pr.z += dz / len * t;
            if (h && h.tank) S.damageTank(this, h.tank, pr.dmg * 1.4, pr.owner);
            if (h && h.target && h.target.explosive) this.damageTarget(h.target, pr.dmg * 1.2, pr.owner === 'player');
            this.explode(pr); pr.dead = true; continue;
          }
          pr.x += dx; pr.y += dy; pr.z += dz;
          pr.fuse -= DT; if (pr.fuse <= 0) { this.explode(pr); pr.dead = true; }
          continue;
        }
        if (len > 1e-6) {
          const h = W.ray(pr.x, pr.y, pr.z, dx / len, dy / len, dz / len, len + 0.05, true);
          if (h) {
            pr.x += dx / len * Math.max(0, h.t - 0.05); pr.y += dy / len * Math.max(0, h.t - 0.05); pr.z += dz / len * Math.max(0, h.t - 0.05);
            const n = h.n, vn = pr.vx * n[0] + pr.vy * n[1] + pr.vz * n[2], bounce = this.codes.RUBBERBALLS ? 0.9 : 0.4;
            pr.vx = (pr.vx - 2 * vn * n[0]) * bounce; pr.vy = (pr.vy - 2 * vn * n[1]) * bounce * 0.8; pr.vz = (pr.vz - 2 * vn * n[2]) * bounce;
            if (Math.abs(vn) > 2) this.emit({ t: 'sound', s: 'nadebounce', x: pr.x, y: pr.y, z: pr.z, vol: 0.6 });
            if (n[1] > 0.6 && Math.hypot(pr.vx, pr.vy, pr.vz) < 1) { pr.vx = pr.vy = pr.vz = 0; pr.rest = true; }
          } else { pr.x += dx; pr.y += dy; pr.z += dz; }
        }
        pr.fuse -= DT;
        if (pr.fuse <= 0) { this.explode(pr); pr.dead = true; }
      }
      this.projs = this.projs.filter(p => !p.dead);
    }
    explode(pr) {
      const R = pr.radius || 6, x = pr.x, y = pr.y + 0.2, z = pr.z;
      this.emit({ t: 'explosion', x, y, z, r: R });
      this.emit({ t: 'sound', s: 'explosion', x, y, z, vol: 1.4 });
      this.blast(x, y, z, R, pr.dmg || 180, pr.owner);
    }
    blast(x, y, z, R, dmg, owner) {
      this.noise(x, z, 120, owner === 'player' ? 'shot' : 'noise');
      if (this.disguised && owner === 'player') this.raiseAlarm('blast');
      const p = this.player, dp = Math.hypot(p.x - x, p.y + 1 - y, p.z - z);
      if (dp < R && this.W.los(x, y, z, p.x, p.y + 1, p.z)) { this.hurtPlayer(dmg * 0.55 * Math.pow(1 - dp / R, 1.2), 'explosion', null, Math.atan2(x - p.x, z - p.z)); p.vx += (p.x - x) / (dp + 0.5) * 5; p.vy += 3; p.vz += (p.z - z) / (dp + 0.5) * 5; }
      for (const a of this.actors) {
        if (a.dead || a.hidden) continue;
        const da = Math.hypot(a.x - x, a.y + 0.8 - y, a.z - z); if (da >= R) continue;
        if (!this.W.los(x, y, z, a.x, a.y + 0.9, a.z)) continue;
        S.damageActor(this, a, dmg * Math.pow(1 - da / R, 1.1), 'explosion', owner, [(a.x - x) / (da + 0.1), 0.5, (a.z - z) / (da + 0.1)], 4, 'torso');
      }
      for (const t of this.tanks) { const d = Math.hypot(t.x - x, t.z - z); if (d < R + t.r) S.damageTank(this, t, dmg * clamp(1.2 - d / (R + t.r), 0.2, 1), owner); }
      for (const tg of this.targets) { if (tg.dead || !tg.explosive && tg.hp <= 1) continue; const d = Math.hypot(tg.x - x, tg.z - z); if (d < R + (S.TARGET_R[tg.kind] || 1)) this.damageTarget(tg, dmg * clamp(1.2 - d / (R + 2), 0.3, 1), owner === 'player'); }
      for (const d of this.doors) { if (d.locked && d.locked !== 'never' && d.tex !== 'bars') { const cx = d.dir === 'x' ? (d.a + d.b) / 2 : d.c, cz = d.dir === 'x' ? d.c : (d.a + d.b) / 2; if (Math.hypot(cx - x, cz - z) < R * 0.5) this.unlockDoor(d, true); } }
    }
    noise(x, z, r, kind) {
      for (const a of this.actors) {
        if (a.dead || a.hidden || a.ally) continue;
        const d = Math.hypot(a.x - x, a.z - z); if (d > r) continue;
        S.alertActor(this, a, x, z, kind);
      }
    }

    raiseAlarm(reason, late = false) {
      if (this.alarm) return;
      this.alarm = true; this.alarmT = 8; this.disguised = false;
      if (!late) this.stats.alarms++; else this.alarmLate = true;
      this.emit({ t: 'alarm', reason });
      this.msg(this.str('alarm'), '#ff6040');
      for (const s of this.def.alarms) this.emit({ t: 'sound', s: 'siren', x: s.x, y: s.y, z: s.z, vol: 1.2 });
      const p = this.player;
      for (const a of this.actors) {
        if (a.dead || a.ally) continue;
        if (a.hidden && a.group === 'reinf') { a.hidden = false; a.ai.state = 'alert'; a.ai.lastSeen = { x: p.x, z: p.z }; a.ai.alertT = 30; continue; }
        if (a.hidden) continue;
        if (a.ai.state === 'idle' || a.ai.state === 'inspect') { a.ai.state = 'alert'; a.ai.lastSeen = { x: p.x + (this.rng() - 0.5) * 20, z: p.z + (this.rng() - 0.5) * 20 }; a.ai.alertT = 20; a.ai.path = null; }
      }
      for (const o of this.objectives) if (o.type === 'stealth' && o.state === 'active' && !late) { o.state = 'failed'; this.emit({ t: 'obj', id: o.id, state: 'failed' }); }
    }

    updateDoors() {
      const p = this.player, W = this.W;
      for (const d of this.doors) {
        const cx = d.dir === 'x' ? (d.a + d.b) / 2 : d.c, cz = d.dir === 'x' ? d.c : (d.a + d.b) / 2;
        let near = false, nearP = false;
        if (!p.dead && Math.abs(p.y - d.y) < 2 && Math.hypot(p.x - cx, p.z - cz) < 1.6) { near = true; nearP = true; }
        if (!near) for (const a of this.actors) { if (a.dead || a.hidden) continue; if (Math.abs(a.x - cx) < 1.8 && Math.abs(a.z - cz) < 1.8 && Math.abs(a.y - d.y) < 2 && Math.hypot(a.x - cx, a.z - cz) < 1.6) { near = true; break; } }
        if (d.locked) {
          if (nearP && d.locked !== 'never' && this.items[d.locked]) this.unlockDoor(d);
          else if (nearP) this.msg(this.items.key || this.items.cellkey ? this.str('lockedDoor') : (d.locked === 'never' ? this.str('lockedDoor') : this.str('needKey')), '#e0c090', 'locked', 3);
          continue;
        }
        if (near) { d.target = 1; d.idleT = 0; } else { d.idleT += DT; if (d.idleT > 3) d.target = 0; }
        if (d.target === 0 && d.open > 0) { let blocked = false; const b = d.cbox; if (b) { if (p.x + p.r > b.x0 && p.x - p.r < b.x1 && p.z + p.r > b.z0 && p.z - p.r < b.z1) blocked = true; for (const a of this.actors) if (!a.dead && !a.hidden && a.x + a.r > b.x0 && a.x - a.r < b.x1 && a.z + a.r > b.z0 && a.z - a.r < b.z1) blocked = true; } if (blocked) d.target = 1; }
        const was = d.open;
        d.open = clamp(d.open + (d.target - d.open > 0 ? 1 : d.target - d.open < 0 ? -1 : 0) * DT * 2.6, 0, 1);
        if (was === 0 && d.open > 0) this.emit({ t: 'sound', s: d.tex === 'bars' ? 'bars' : d.tex === 'metaldoor' || d.tex === 'gate' ? 'metaldoor' : 'door', x: cx, y: d.y + 1, z: cz, vol: 0.8 });
        if (d.cbox) d.cbox.off = d.open > 0.25;
      }
      void W;
    }
    unlockDoor(d, forced) {
      d.locked = null; d.target = 1;
      if (d.cbox) this.W.refreshNav(d.cbox.x0, d.cbox.z0, d.cbox.x1, d.cbox.z1);
      if (!forced) this.emit({ t: 'sound', s: 'unlock' });
    }
    doorById(id) { return this.doors.find(d => d.id === id) || null; }

    updatePlants() {
      for (const c of this.planted) {
        if (c.done) continue;
        c.fuse -= DT;
        if (Math.floor(c.fuse + DT) !== Math.floor(c.fuse) && c.fuse > 0) this.emit({ t: 'sound', s: 'tick', x: c.x, y: c.y + 0.3, z: c.z, vol: 0.5 });
        if (c.fuse <= 0) {
          c.done = true;
          if (this.mission.disguise || this.mission.objectives.some(o => o.type === 'stealth')) this.raiseAlarm('charge', true);
          const tg = this.targetById(c.target);
          this.emit({ t: 'explosion', x: c.x, y: c.y + 0.5, z: c.z, r: c.blast });
          this.emit({ t: 'sound', s: 'explosion', x: c.x, y: c.y + 0.5, z: c.z, vol: 1.8 });
          this.blast(c.x, c.y + 0.6, c.z, c.blast, 220, 'player');
          if (tg) { tg.detonated++; if (tg.detonated >= (tg.charges || 1)) this.destroyTarget(tg); }
        }
      }
      const pl = this.planting;
      if (pl) {
        const p = this.player;
        if (Math.hypot(p.x - pl.x, p.z - pl.z) > pl.r + 0.6 || p.dead) { this.planting = null; return; }
        pl.t -= DT;
        if (pl.t <= 0) {
          this.planting = null; pl.planted = true; this.charges--;
          this.planted.push({ x: pl.x, y: pl.y, z: pl.z, fuse: pl.fuse, target: pl.target, blast: pl.blast });
          this.msg(this.str('planted'), '#f0d080'); this.emit({ t: 'sound', s: 'plant' });
        }
      }
    }

    updatePickups() {
      const p = this.player; if (p.dead) return;
      for (const it of this.pickups) {
        if (it.taken) continue;
        if (Math.abs(it.x - p.x) > 1.2 || Math.abs(it.z - p.z) > 1.2 || Math.abs(it.y - p.y) > 1.6) continue;
        if (Math.hypot(it.x - p.x, it.z - p.z) > 1.1) continue;
        this.takePickup(it);
      }
      this.pickups = this.pickups.filter(i => !i.taken);
    }
    takePickup(it) {
      const p = this.player, P = PK[it.id], W2 = WP[it.id];
      let took = false, label = '';
      if (W2) {
        const fresh = this.giveWeapon(it.id, false);
        const n = it.n != null ? it.n : (W2.mag || 1) * (W2.throw ? 1 : 1);
        const got = this.addAmmo(W2.ammo, W2.throw ? Math.max(1, it.n || 1) : n);
        took = fresh || got > 0; label = this.L(W2.name);
        if (fresh && !W2.throw) this.mag[it.id] = 0;
      } else if (P && P.hp) { if (p.hp < 100) { p.hp = Math.min(100, p.hp + P.hp); took = true; label = `${this.L(P.name)} +${P.hp}`; } }
      else if (P && P.ammo) { const got = this.addAmmo(P.ammo, P.n); took = got > 0; label = `${this.L(P.name)} +${got}`; }
      else if (P && P.charges) { this.charges += P.charges; took = true; label = this.L(P.name); }
      else if (P && P.quest) { this.items[it.id] = true; took = true; label = this.L(P.name); this.emit({ t: 'quest', id: it.id }); }
      if (!took) return;
      it.taken = true;
      this.emit({ t: 'pickup', id: it.id, name: label });
      this.emit({ t: 'sound', s: P && P.hp ? 'health' : W2 ? 'pickgun' : 'pickup' });
    }
    dropPickup(id, x, y, z, extra = {}) { const it = Object.assign({ id, x, z, y, ph: Math.random() * 6 }, extra); this.pickups.push(it); return it; }

    updateFocus() {
      const p = this.player, f = this.forward(), ex = p.x, ey = this.eye, ez = p.z;
      let best = null, bd = 2.4;
      const wh = this.W.ray(ex, ey, ez, f[0], f[1], f[2], 3, true); const wall = wh ? wh.t : 3;
      const consider = (kind, o, x, y, z, rad) => {
        const vx = x - ex, vy = y - ey, vz = z - ez, t = vx * f[0] + vy * f[1] + vz * f[2]; if (t < 0 || t > bd + rad || t > wall + rad) return;
        const px = ex + f[0] * t - x, py = ey + f[1] * t - y, pz = ez + f[2] * t - z; if (Math.hypot(px, py, pz) > rad) return;
        const dd = Math.hypot(vx, vy, vz); if (dd < bd + rad) { bd = Math.max(0, dd - rad); best = { kind, o }; }
      };
      for (const a of this.actors) {
        if (a.hidden || a.dead || a.kind !== 'human') continue;
        if (Math.abs(a.x - p.x) > 4 || Math.abs(a.z - p.z) > 4) continue;
        if (a.beh === 'prisoner' && !a.freed) consider('free', a, a.x, a.y + 1.2, a.z, 0.7);
        if (a.ai && a.ai.state === 'inspect' && a.ai.asked) consider('papers', a, a.x, a.y + 1.3, a.z, 0.8);
      }
      for (const pl of this.plants) { if (pl.planted) continue; if (Math.hypot(pl.x - p.x, pl.z - p.z) < pl.r + 0.5 && Math.abs(pl.y - p.y) < 1.6) { best = { kind: 'plant', o: pl }; break; } }
      this.focus = best;
    }
    useFocus() {
      const fo = this.focus;
      if (!fo) { if (this.disguised || this.actors.some(a => a.ai && a.ai.state === 'inspect')) this.showPapers(); return; }
      if (fo.kind === 'free') this.freeActor(fo.o);
      else if (fo.kind === 'papers') this.showPapers();
      else if (fo.kind === 'plant') {
        if (this.charges <= 0) { this.msg(this.str('noCharges'), '#e0b080', 'nocharge', 2); return; }
        if (this.planting) return;
        this.planting = Object.assign(fo.o, { t: 2 }); this.msg(this.str('planting'), '#e0e0c0'); this.emit({ t: 'sound', s: 'planting' });
      }
    }
    freeActor(a) {
      if (a.freed || a.dead) return;
      a.freed = true; a.beh = a.tpl === 'agent' ? 'follow' : 'flee';
      if (a.ai) { a.ai.state = 'idle'; a.ai.path = null; }
      this.msg(a.tpl === 'agent' ? this.str('escort') : this.str('freed'), '#a0e0a0');
      this.emit({ t: 'freed', id: a.id }); this.emit({ t: 'sound', s: 'ally' });
    }
    showPapers() {
      const p = this.player;
      const insp = this.actors.find(a => !a.dead && a.ai && a.ai.state === 'inspect' && Math.hypot(a.x - p.x, a.z - p.z) < 4);
      if (!insp) return false;
      if (this.cur !== 'papers') { this.msg(this.str('showPapers'), '#e0d0a0', 'papers', 2); return false; }
      S.papersShown(this, insp);
      return true;
    }

    objective(id) { return this.objectives.find(o => o.id === id); }
    primaryDone(except) { return this.objectives.every(o => o === except || o.optional || o.type === 'reach' || o.state === 'done'); }
    updateObjectives() {
      if (this.done || this.failed) return;
      const p = this.player;
      for (const o of this.objectives) {
        if (o.state !== 'active') continue;
        let ok = false;
        switch (o.type) {
          case 'take': ok = !!this.items[o.item]; break;
          case 'free': {
            const list = o.actors.map(id => this.actorById(id));
            if (list.some(a => !a || (a.dead && !a.freed) || (a.dead && a.tpl === 'agent'))) { this.fail(o.id === 'agent' || o.actors.includes('agent') ? this.str('agentLost') : this.L(o.text)); return; }
            ok = list.every(a => a.freed); break;
          }
          case 'destroy': ok = (o.targets || []).every(id => { const t = this.targetById(id); return t && t.dead; }) && (o.tanks || []).every(id => { const t = this.tanks.find(k => k.id === id); return t && t.dead; }); break;
          case 'kill': ok = o.actors.every(id => { const a = this.actorById(id); return a && a.dead; }); break;
          case 'reach': {
            const z = this.zone(o.zone); if (!z || !this.inRect(z, p.x, p.z)) break;
            if (!this.primaryDone(o)) { this.msg(this.str('mustFinish'), '#e0c090', 'mustfinish', 4); break; }
            if (o.escort) { const far = o.escort.map(id => this.actorById(id)).some(a => !a || a.dead || Math.hypot(a.x - p.x, a.z - p.z) > 14); if (far) { this.msg(this.str('escort'), '#e0c090', 'escortwait', 4); break; } }
            ok = true; break;
          }
          default: break;
        }
        if (o.escort && o.type === 'reach') { const ag = o.escort.map(id => this.actorById(id)); if (ag.some(a => a && a.dead)) { this.fail(this.str('agentLost')); return; } }
        if (ok) {
          o.state = 'done'; this.emit({ t: 'obj', id: o.id, state: 'done' }); this.msg(`${this.str('objDone')}: ${this.L(o.text)}`, '#a8e890'); this.emit({ t: 'sound', s: 'objective' });
          if (o.type === 'reach') this.complete();
        }
      }
    }
    complete() {
      if (this.done) return;
      for (const o of this.objectives) if (o.type === 'stealth' && o.state === 'active') o.state = 'done';
      this.done = true; this.emit({ t: 'complete' });
    }
    fail(reason) { if (this.failed || this.done) return; this.failed = reason || true; this.emit({ t: 'failed', reason }); }
  }

  S.rateMission = function (st, skill, objectives) {
    const acc = st.shots ? st.hits / st.shots : 0.5;
    const par = 600, tK = clamp(1.4 - st.time / par * 0.6, 0.2, 1);
    const hpK = clamp(1 - st.dmgTaken / 300, 0, 1);
    let r = acc * 38 + tK * 22 + hpK * 25 + Math.min(1, st.headshots / 6) * 10 + (st.alarms === 0 ? 5 : 0);
    r *= [0.85, 1, 1.12][skill] || 1;
    const optDone = (objectives || []).filter(o => o.optional && o.state === 'done').length;
    r = clamp(Math.round(r + optDone * 4 - st.dishonor * 15), 0, 100);
    const medals = ['bronze'];
    if (r >= 55) medals.push('silver');
    if (r >= 80 && skill >= 1 && st.dishonor === 0) medals.push('dsc');
    if (st.minHp <= 20) medals.push('purple');
    if ((objectives || []).some(o => o.type === 'stealth' && o.state === 'done')) medals.push('shadow');
    return { rating: r, acc, medals };
  };

  S.Game = Game; S.GAME = { DT, EYE, EYE_CROUCH };
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Moh98 = globalThis.Moh98 || {});
