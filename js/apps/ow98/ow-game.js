(function (O) {
  'use strict';
  const { clamp, TICK } = O;
  const JUMP_V = 6.2;
  const ULT_PASSIVE = 4;
  const HEAD_BONUS = 0.06;

  function blankInput() {
    return { fwd: 0, side: 0, jump: false, crouch: false, fire: false, fire2: false, shift: false, e: false, q: false, reload: false, melee: false, slot: 0, spray: false, yaw: 0, pitch: 0 };
  }
  O.blankInput = blankInput;

  class Game {
    constructor(opts) {
      this.opts = opts;
      this.rand = O.rng(opts.seed || 12345);
      this.t = 0;
      this.tickN = 0;
      this.mapId = opts.map;
      this.def = O.MAPS[opts.map];
      this.mode = opts.mode || this.def.mode;
      this.rules = Object.assign({ cdMul: 1, hpMul: 1, noLimits: false, mystery: false, practice: false, respawn: O.RESPAWN }, opts.rules || {});
      this.attTeam = this.mode === 'control' ? 0 : (opts.attack === undefined ? 0 : opts.attack);
      this.stage = 0;
      this.subStage = opts.stage || 0;
      this.events = [];
      this.fx = [];
      this.feed = [];
      this.chat = [];
      this.proj = [];
      this.deploy = [];
      this.barriers = [];
      this.nextId = 100;
      this.heroes = [];
      this.worldVer = 0;
      this.loadMap(this.subStage);
      const teams = opts.teams || [[], []];
      for (let t = 0; t < 2; t++) {
        for (let i = 0; i < teams[t].length; i++) this.heroes.push(this.makeHero(t, i, teams[t][i]));
      }
      this.player = this.heroes.find(h => h.human) || null;
      this.phase = 'assemble';
      this.phaseT = opts.assemble === undefined ? 20 : opts.assemble;
      this.winner = null;
      this.endT = 0;
      this.stats = { kills: [0, 0] };
      O.MODES[this.mode].init(this);
      this.applyStage();
      if (O.Replay) this.replay = new O.Replay(this);
    }

    loadMap(sub) {
      this.map = O.buildMap(this.mapId, sub, { visual: !!this.opts.visual });
      this.world = this.map.world;
      this.nav = new O.Nav(this.map);
      this.pickups = this.map.health.map(h => ({ x: h.x, y: h.y, z: h.z, big: h.big, t: 0 }));
      this.worldVer++;
      this.dyn = [];
    }

    uid() { return this.nextId++; }

    roleOf(team) { return this.mode === 'control' ? (team === 0 ? 'att' : 'def') : (team === this.attTeam ? 'att' : 'def'); }
    teamOfRole(role) { return this.mode === 'control' ? (role === 'att' ? 0 : 1) : (role === 'att' ? this.attTeam : 1 - this.attTeam); }

    applyStage() {
      const stage = this.mode === 'control' ? 0 : this.stage;
      for (const s of this.world.solids) {
        if (!s.role) continue;
        s.blockTeam = this.teamOfRole(s.role);
        const active = !s.stage || (stage >= s.stage[0] && stage <= s.stage[1]);
        if (s.gate === 'setup') s.off = !(active && (this.phase === 'setup' || this.phase === 'assemble'));
        else s.off = !active;
      }
      this.nav.setTeams(this.teamOfRole('att'), stage);
      for (const h of this.heroes) {
        if (!h.alive) continue;
        for (const sp of this.map.spawns) {
          if (stage < sp.stage[0] || stage > sp.stage[1] || this.teamOfRole(sp.role) === h.team) continue;
          const [x0, z0, x1, z1] = sp.room;
          if (h.pos.x > x0 - 0.5 && h.pos.x < x1 + 0.5 && h.pos.z > z0 - 0.5 && h.pos.z < z1 + 0.5 && Math.abs(h.pos.y - sp.y) < 3) { this.placeInSpawn(h); break; }
        }
      }
    }

    makeHero(team, idx, slot) {
      const h = {
        id: this.heroes.length, team, idx, drill: slot.drill || null, home: null, name: slot.name || ('Игрок ' + (idx + 1)), bot: !slot.human, human: !!slot.human, skill: slot.skill === undefined ? 1 : slot.skill,
        heroId: null, def: null, want: slot.hero || null, skin: slot.skin || 'classic', skins: slot.skins || {},
        pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, onGround: true, r: 0.35, h: 1.8, eyeH: 1.6,
        alive: false, spawned: false, deadT: 0, respawnT: 0, deathPos: null,
        hp: 1, maxHp: 1, armor: 0, maxArmor: 0, shield: 0, maxShield: 0, temp: 0, packArmor: 0, bonusHp: 0,
        ult: 0, ultOn: null, ultT: 0, cd: {}, st: {}, k: {}, aux: {},
        ammo: 0, maxAmmo: 0, reloadT: 0, fireCd: 0, weapon: 0,
        prev: blankInput(), inp: blankInput(),
        lastHurt: -99, lastDmgT: -99, hurtBy: {}, healBy: {}, lastAttacker: null,
        stats: { elims: 0, finals: 0, deaths: 0, dmg: 0, heal: 0, blocked: 0, objTime: 0, objKills: 0, solo: 0, best: 0, ults: 0, streak: 0, bestStreak: 0, envKills: 0, time: {} },
        recentKills: [], vis: { shotT: -9, shot2T: -9, act: null, actT: -9, beams: [], weapon: 0, scope: -1 },
        inSpawn: false, frozen: false, crouch: false, hist: [], comp: null, ai: null, pendingHero: null
      };
      return h;
    }

    setHero(h, heroId, keepPos) {
      const def = O.HEROES[heroId];
      if (!def) return false;
      if (!this.rules.noLimits && !def.training && this.heroes.some(o => o !== h && o.team === h.team && (o.heroId === heroId || o.pendingHero === heroId))) return false;
      const changed = h.heroId !== heroId;
      if (h.heroId && changed && O.KITS[h.heroId] && O.KITS[h.heroId].cleanup) O.KITS[h.heroId].cleanup(this, h);
      h.heroId = heroId;
      h.def = def;
      h.r = def.r; h.h = def.h; h.eyeH = def.eye;
      if (changed) { h.ult = 0; h.ultOn = null; }
      h.skin = (h.skins && h.skins[heroId]) || 'classic';
      h.pendingHero = null;
      this.resetHero(h);
      if (!keepPos && h.alive) this.placeInSpawn(h);
      this.ev('hero', { h: h.id, hero: heroId });
      return true;
    }

    resetHero(h) {
      const d = h.def;
      const m = this.rules.hpMul;
      h.maxHp = d.hp * m; h.hp = h.maxHp;
      h.maxArmor = d.armor * m; h.armor = h.maxArmor;
      h.maxShield = d.shield * m; h.shield = h.maxShield;
      h.temp = 0; h.packArmor = 0; h.bonusHp = 0;
      h.cd = {}; h.st = {}; h.k = {}; h.aux = {}; h.reloadT = 0; h.fireCd = 0; h.weapon = 0; h.ultOn = null; h.ultT = 0;
      h.vis.beams = []; h.vis.act = null; h.vis.scope = -1; h.vis.weapon = 0; h.vis.pose = null;
      h.hist = [];
      const kit = O.KITS[h.heroId];
      if (kit && kit.init) kit.init(this, h);
    }

    placeInSpawn(h) {
      if (h.home) {
        h.pos = { x: h.home.x, y: h.home.y, z: h.home.z };
        h.vel = { x: 0, y: 0, z: 0 };
        h.yaw = h.home.yaw || 0; h.pitch = 0;
        h.onGround = true;
        return;
      }
      const sp = this.spawnFor(h.team);
      if (!sp) { h.pos = { x: 0, y: 5, z: 0 }; return; }
      const p = sp.pts[(h.idx + this.tickN) % sp.pts.length];
      h.pos = { x: p.x + (this.rand() - 0.5) * 0.6, y: p.y, z: p.z + (this.rand() - 0.5) * 0.6 };
      h.vel = { x: 0, y: 0, z: 0 };
      h.yaw = p.yaw; h.pitch = 0;
      h.onGround = true;
    }

    spawnFor(team) {
      const role = this.roleOf(team);
      const stage = this.mode === 'control' ? 0 : this.stage;
      return this.map.spawns.find(s => s.role === role && stage >= s.stage[0] && stage <= s.stage[1]) || this.map.spawns.find(s => s.role === role);
    }

    inOwnSpawn(h) {
      const sp = this.spawnFor(h.team);
      if (!sp) return false;
      const [x0, z0, x1, z1] = sp.room;
      return h.pos.x > x0 && h.pos.x < x1 && h.pos.z > z0 && h.pos.z < z1 && Math.abs(h.pos.y - sp.y) < 3;
    }

    spawnHero(h) {
      if (!h.heroId) return;
      if (this.rules.mystery && h.spawned) {
        const taken = new Set(this.heroes.filter(o => o.team === h.team && o !== h).map(o => o.heroId));
        const pool = O.HERO_ORDER.filter(id => this.rules.noLimits || !taken.has(id));
        const id = O.pick(this.rand, pool);
        if (id) { h.heroId = null; this.setHero(h, id, true); }
      }
      if (h.pendingHero) this.setHero(h, h.pendingHero, true);
      this.resetHero(h);
      h.alive = true; h.spawned = true; h.deadT = 0; h.respawnT = 0;
      h.lastHurt = -99; h.hurtBy = {}; h.healBy = {};
      this.placeInSpawn(h);
      h.stats.streak = 0;
      this.ev('spawn', { h: h.id });
    }

    ev(type, data) {
      if (this.events.length > 600) this.events.splice(0, 300);
      const e = Object.assign({ type, t: this.t }, data);
      this.events.push(e);
      return e;
    }

    addFx(type, data) {
      if (this.fx.length > 800) this.fx.splice(0, 400);
      const f = Object.assign({ type, t: this.t }, data);
      this.fx.push(f);
      return f;
    }

    sound(id, pos, o) {
      this.ev('snd', Object.assign({ id, x: pos ? pos.x : 0, y: pos ? pos.y : 0, z: pos ? pos.z : 0 }, o || {}));
    }

    eye(h) { return { x: h.pos.x, y: h.pos.y + (h.crouch ? h.eyeH * 0.72 : h.eyeH), z: h.pos.z }; }
    aim(h) { return O.dir(h.yaw, h.pitch); }
    chest(h) { return { x: h.pos.x, y: h.pos.y + h.h * 0.6, z: h.pos.z }; }
    heroH(h) { return h.crouch ? h.h * 0.72 : h.h; }

    muzzle(h, side = 1) {
      const e = this.eye(h), f = this.aim(h);
      const rx = -Math.cos(h.yaw), rz = Math.sin(h.yaw);
      return { x: e.x + f.x * 0.6 + rx * 0.22 * side, y: e.y + f.y * 0.6 - 0.18, z: e.z + f.z * 0.6 + rz * 0.22 * side };
    }

    spreadDir(d, amount) {
      if (amount <= 0) return d;
      const a = this.rand() * Math.PI * 2, r = Math.sqrt(this.rand()) * amount;
      let ux = -d.z, uy = 0, uz = d.x;
      let ul = Math.hypot(ux, uy, uz);
      if (ul < 1e-6) { ux = 1; uy = 0; uz = 0; ul = 1; }
      ux /= ul; uz /= ul;
      const vx = d.y * uz - d.z * uy, vy = d.z * ux - d.x * uz, vz = d.x * uy - d.y * ux;
      const ca = Math.cos(a) * r, sa = Math.sin(a) * r;
      const x = d.x + ux * ca + vx * sa, y = d.y + uy * ca + vy * sa, z = d.z + uz * ca + vz * sa;
      const l = Math.hypot(x, y, z);
      return { x: x / l, y: y / l, z: z / l };
    }

    enemies(h) { return this.heroes.filter(o => o.team !== h.team && o.alive); }
    allies(h, incl) { return this.heroes.filter(o => o.team === h.team && o.alive && (incl || o !== h)); }

    targetable(o) { return o.alive && !o.st.phase && !(o.k && o.k.recalling); }

    rayHero(o, ox, oy, oz, dx, dy, dz, maxT) {
      const hh = this.heroH(o);
      const headR = o.def.headR + HEAD_BONUS;
      const hx = o.pos.x, hy = o.pos.y + hh - headR * 0.9, hz = o.pos.z;
      let best = null;
      {
        const lx = ox - hx, ly = oy - hy, lz = oz - hz;
        const b = lx * dx + ly * dy + lz * dz, c = lx * lx + ly * ly + lz * lz - headR * headR;
        const disc = b * b - c;
        if (disc >= 0) {
          const t = -b - Math.sqrt(disc);
          if (t >= 0 && t <= maxT) best = { t, crit: true };
        }
      }
      const r = o.r + 0.06, y0 = o.pos.y, y1 = o.pos.y + hh - headR * 1.6;
      const a = dx * dx + dz * dz;
      if (a > 1e-9) {
        const lx = ox - o.pos.x, lz = oz - o.pos.z;
        const b = lx * dx + lz * dz, c = lx * lx + lz * lz - r * r;
        const disc = b * b - a * c;
        if (disc >= 0) {
          const sq = Math.sqrt(disc);
          for (const t of [(-b - sq) / a, (-b + sq) / a]) {
            if (t < 0 || t > maxT) continue;
            const y = oy + dy * t;
            if (y >= y0 && y <= y1) { if (!best || t < best.t) best = { t, crit: false }; break; }
          }
        }
      }
      for (const cy of [y0, y1]) {
        if (Math.abs(dy) < 1e-9) continue;
        const t = (cy - oy) / dy;
        if (t < 0 || t > maxT) continue;
        const x = ox + dx * t - o.pos.x, z = oz + dz * t - o.pos.z;
        if (x * x + z * z <= r * r && (!best || t < best.t)) best = { t, crit: false };
      }
      return best;
    }

    rayBarrier(b, ox, oy, oz, dx, dy, dz, maxT) {
      if (b.kind === 'rect') {
        const den = dx * b.nx + dz * b.nz;
        if (Math.abs(den) < 1e-6) return null;
        const t = ((b.x - ox) * b.nx + (b.z - oz) * b.nz) / den;
        if (t < 0 || t > maxT) return null;
        const px = ox + dx * t - b.x, py = oy + dy * t, pz = oz + dz * t - b.z;
        const u = px * -b.nz + pz * b.nx;
        if (Math.abs(u) > b.w / 2 || py < b.y0 || py > b.y1) return null;
        return t;
      }
      const lx = ox - b.x, ly = oy - b.y, lz = oz - b.z;
      const bb = lx * dx + ly * dy + lz * dz, c = lx * lx + ly * ly + lz * lz - b.r * b.r;
      const disc = bb * bb - c;
      if (disc < 0) return null;
      const sq = Math.sqrt(disc);
      const t1 = -bb - sq, t2 = -bb + sq;
      if (t1 >= 0 && t1 <= maxT) return t1;
      if (t2 >= 0 && t2 <= maxT) return t2;
      return null;
    }

    trace(src, ox, oy, oz, dx, dy, dz, maxT, o = {}) {
      const w = this.world.raycast(ox, oy, oz, dx, dy, dz, maxT);
      let best = w ? w.t : maxT, res = { t: best, world: w, hero: null, barrier: null, dep: null, crit: false };
      if (!o.noBarrier) {
        for (const b of this.barriers) {
          if (b.team === src.team || b.hp <= 0) continue;
          const t = this.rayBarrier(b, ox, oy, oz, dx, dy, dz, best);
          if (t !== null && t < best) { best = t; res = { t, world: null, hero: null, barrier: b, dep: null, crit: false }; }
        }
      }
      for (const o2 of this.heroes) {
        if (o2.team === src.team || !this.targetable(o2)) continue;
        if (o.ignore && o.ignore.has(o2.id)) continue;
        if (Math.abs(o2.pos.x - ox) + Math.abs(o2.pos.z - oz) > best + 4) continue;
        const r = this.rayHero(o2, ox, oy, oz, dx, dy, dz, best);
        if (r && r.t < best) { best = r.t; res = { t: r.t, world: null, hero: o2, barrier: null, dep: null, crit: r.crit }; }
      }
      for (const d of this.deploy) {
        if (d.team === src.team || !d.shootable || d.hp <= 0) continue;
        const cx = d.pos.x, cy = d.pos.y + (d.cy || 0.5), cz = d.pos.z, rr = d.rad || 0.5;
        const lx = ox - cx, ly = oy - cy, lz = oz - cz;
        const bb = lx * dx + ly * dy + lz * dz, c = lx * lx + ly * ly + lz * lz - rr * rr;
        const disc = bb * bb - c;
        if (disc < 0) continue;
        const t = -bb - Math.sqrt(disc);
        if (t >= 0 && t < best) { best = t; res = { t, world: null, hero: null, barrier: null, dep: d, crit: false }; }
      }
      res.x = ox + dx * res.t; res.y = oy + dy * res.t; res.z = oz + dz * res.t;
      return res;
    }

    falloff(dist, f) {
      if (!f) return 1;
      if (dist <= f[0]) return 1;
      if (dist >= f[1]) return f[2];
      return 1 - (1 - f[2]) * (dist - f[0]) / (f[1] - f[0]);
    }

    hitscan(h, dir, range, dmg, o = {}) {
      const e = o.from || this.eye(h);
      const r = this.trace(h, e.x, e.y, e.z, dir.x, dir.y, dir.z, range, o);
      const mult = this.falloff(r.t, o.fall);
      if (r.hero) {
        const crit = r.crit && o.crit ? o.crit : 1;
        this.damage(h, r.hero, dmg * mult * crit, { kind: o.kind || 'bullet', ability: o.ability, crit: crit > 1, from: e, hitPos: r });
      } else if (r.barrier) {
        this.damageBarrier(r.barrier, dmg * mult, h);
      } else if (r.dep) {
        this.damageDeploy(r.dep, dmg * mult, h);
      }
      if (!o.noFx) {
        const m = o.muzzle || this.muzzle(h, o.side || 1);
        this.addFx(o.tracer || 'tracer', { x0: m.x, y0: m.y, z0: m.z, x1: r.x, y1: r.y, z1: r.z, team: h.team, hero: h.heroId, owner: h.id, side: o.side || 1, charge: o.charge, crit: !!(r.hero && r.crit && o.crit), hit: !!(r.hero || r.dep), shield: !!r.barrier, n: r.world ? [r.world.nx, r.world.ny, r.world.nz] : null });
      }
      return r;
    }

    damage(src, target, amount, o = {}) {
      if (!target || !target.alive || amount <= 0) return 0;
      if (target.st.invuln > 0 || target.st.phase > 0 || (target.k && target.k.recalling)) return 0;
      if (src && src.team === target.team && src !== target) return 0;
      let mult = 1;
      if (src && src !== target && src.st.boost > 0) mult *= O.HEROES.mercy.staff.boost;
      if (src && src !== target && target.st.discord > 0) mult *= O.HEROES.zenyatta.discord.mul;
      if (this.rules.dmgMul && src !== target) mult *= this.rules.dmgMul;
      let d = amount * mult;
      let dealt = 0;
      if (target.temp > 0) { const a = Math.min(target.temp, d); target.temp -= a; d -= a; dealt += a; }
      if (d > 0 && target.shield > 0) { const a = Math.min(target.shield, d); target.shield -= a; d -= a; dealt += a; }
      const arm = target.armor + target.packArmor;
      if (d > 0 && arm > 0) {
        const eff = d - Math.min(5, d * 0.5);
        const use = Math.min(arm, eff);
        const fromPack = Math.min(target.packArmor, use);
        target.packArmor -= fromPack;
        target.armor -= use - fromPack;
        dealt += use;
        d = eff > arm ? d - arm * d / eff : 0;
      }
      if (d > 0) { const a = Math.min(target.hp, d); target.hp -= a; dealt += a; }
      const kit = O.KITS[target.heroId];
      if (kit && kit.onDamaged) kit.onDamaged(this, target, src, dealt, o);
      target.lastHurt = this.t;
      if (src && src !== target) {
        target.hurtBy[src.id] = this.t;
        target.lastAttacker = src.id;
        src.stats.dmg += dealt;
        if (!o.noUlt) this.addUlt(src, dealt);
        src.lastDmgT = this.t;
        this.ev('hit', { src: src.id, dst: target.id, dmg: dealt, crit: !!o.crit, kind: o.kind });
      } else if (src === target) {
        this.ev('hit', { src: -1, dst: target.id, dmg: dealt, crit: false, kind: o.kind });
      }
      if (o.from) this.ev('hurtdir', { dst: target.id, x: o.from.x, z: o.from.z });
      if (target.hp <= 0.001) this.kill(target, src, o);
      return dealt;
    }

    heal(src, target, amount, o = {}) {
      if (!target || !target.alive || amount <= 0) return 0;
      if (target.st.antiheal > 0) return 0;
      let a = amount, got = 0;
      const needHp = target.maxHp - target.hp;
      if (needHp > 0) { const x = Math.min(needHp, a); target.hp += x; a -= x; got += x; }
      const needArm = target.maxArmor - target.armor;
      if (a > 0 && needArm > 0) { const x = Math.min(needArm, a); target.armor += x; a -= x; got += x; }
      const needSh = target.maxShield - target.shield;
      if (a > 0 && needSh > 0) { const x = Math.min(needSh, a); target.shield += x; a -= x; got += x; }
      if (got > 0 && src) {
        if (src !== target || o.self) src.stats.heal += got;
        if (!o.noUlt) this.addUlt(src, got);
        target.healBy[src.id] = this.t;
      }
      return got;
    }

    addUlt(h, pts) {
      if (!h.def || h.ultOn) return;
      const was = h.ult < h.def.ultCost;
      h.ult = Math.min(h.def.ultCost, h.ult + pts);
      if (was && h.ult >= h.def.ultCost) this.ev('ultready', { h: h.id });
    }

    damageBarrier(b, amount, src) {
      if (b.hp <= 0) return;
      const a = Math.min(b.hp, amount);
      b.hp -= a;
      if (b.ref) b.ref.hp = b.hp;
      if (b.owner) { const ow = this.heroes[b.ownerIdx]; if (ow) ow.stats.blocked += a; }
      if (src) this.addUlt(src, a * 0.5);
      this.addFx('shieldhit', { x: b.x, y: b.kind === 'rect' ? (b.y0 + b.y1) / 2 : b.y, z: b.z, team: b.team });
      this.ev('hit', { src: src ? src.id : -1, dst: -1, dmg: a, barrier: true });
      if (b.hp <= 0) {
        this.sound('barrierBreak', b);
        this.addFx('barrierbreak', { x: b.x, y: b.kind === 'rect' ? (b.y0 + b.y1) / 2 : b.y, z: b.z, team: b.team, kind: b.kind, r: b.r || 3 });
      }
    }

    damageDeploy(d, amount, src) {
      if (d.hp <= 0) return;
      d.hp -= amount;
      if (src) { src.stats.dmg += Math.min(amount, d.hp + amount); this.addUlt(src, amount * 0.5); this.ev('hit', { src: src.id, dst: -2, dmg: amount }); }
      if (d.hp <= 0) {
        d.dead = true;
        this.addFx('explosion', { x: d.pos.x, y: d.pos.y + 0.5, z: d.pos.z, r: 1.2, small: true });
        this.sound('deployDie', d.pos);
        const kit = O.KITS[d.hero];
        if (kit && kit.deployDied) kit.deployDied(this, d, src);
        if (src) this.ev('feed', { killer: src.id, kind: d.kind, depTeam: d.team, depOwner: d.owner });
      }
    }

    explode(src, pos, dmg, radius, o = {}) {
      const minF = o.minF === undefined ? 0.3 : o.minF;
      for (const t of this.heroes) {
        if (!t.alive) continue;
        const isSelf = t === src;
        if (!isSelf && t.team === src.team) continue;
        if (isSelf && !o.self) continue;
        const c = this.chest(t);
        const dx = c.x - pos.x, dy = c.y - pos.y, dz = c.z - pos.z;
        const d = Math.max(0, Math.hypot(dx, dy, dz) - t.r * 0.8);
        if (d > radius) continue;
        if (!this.world.clear(pos.x, pos.y + 0.2, pos.z, c.x, c.y, c.z)) {
          if (!this.world.clear(pos.x, pos.y + 0.2, pos.z, t.pos.x, t.pos.y + this.heroH(t) - 0.2, t.pos.z)) continue;
        }
        if (!isSelf && this.blockedByBarrier(src.team, pos, c)) continue;
        const f = 1 - (1 - minF) * (d / radius);
        let amt = dmg * f;
        if (o.direct && o.direct === t) amt = dmg;
        if (isSelf) amt *= o.self;
        if (amt > 0) this.damage(src, t, amt, { kind: 'splash', ability: o.ability, from: pos });
        if (o.knock) {
          const l = Math.hypot(dx, dz) || 1;
          const k = o.knock * (0.5 + 0.5 * f);
          this.knock(t, dx / l * k, (o.lift === undefined ? 0.55 : o.lift) * k, dz / l * k);
        }
      }
      for (const d of this.deploy) {
        if (d.team === src.team || !d.shootable || d.hp <= 0) continue;
        const dd = Math.hypot(d.pos.x - pos.x, d.pos.y - pos.y, d.pos.z - pos.z);
        if (dd <= radius) this.damageDeploy(d, dmg * (1 - (1 - minF) * dd / radius), src);
      }
      for (const b of this.barriers) {
        if (b.team === src.team || b.hp <= 0) continue;
        const bx = b.x, by = b.kind === 'rect' ? (b.y0 + b.y1) / 2 : b.y, bz = b.z;
        const dd = Math.hypot(bx - pos.x, by - pos.y, bz - pos.z);
        if (dd <= radius + (b.kind === 'rect' ? b.w / 2 : b.r) * 0.6) this.damageBarrier(b, dmg * 0.8, src);
      }
      if (!o.noFx) this.addFx('explosion', { x: pos.x, y: pos.y, z: pos.z, r: radius, team: src.team, kind: o.fx || 'boom' });
      if (!o.silent) this.sound(o.snd || 'explode', pos, { big: radius > 3 });
    }

    blockedByBarrier(team, a, b) {
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz);
      if (d < 1e-4) return false;
      for (const bar of this.barriers) {
        if (bar.team === team || bar.hp <= 0) continue;
        if (this.rayBarrier(bar, a.x, a.y, a.z, dx / d, dy / d, dz / d, d) !== null) return true;
      }
      return false;
    }

    knock(t, vx, vy, vz) {
      if (!t.alive || (t.k && t.k.charging) || t.st.unstoppable > 0) return;
      t.vel.x += vx; t.vel.y = Math.max(t.vel.y, 0) + vy; t.vel.z += vz;
      t.onGround = false;
      t.st.kb = 0.45;
    }

    kill(target, src, o = {}) {
      if (!target.alive) return;
      target.alive = false;
      target.hp = 0;
      target.deadT = 0;
      target.respawnT = this.rules.respawn;
      target.deathPos = { x: target.pos.x, y: target.pos.y, z: target.pos.z };
      target.stats.deaths++;
      target.stats.streak = 0;
      target.vis.act = 'death'; target.vis.actT = this.t; target.vis.pose = null;
      const kit = O.KITS[target.heroId];
      if (kit && kit.onDeath) kit.onDeath(this, target, src);
      if (target.ultOn && kit && kit.endUlt) kit.endUlt(this, target);
      target.ultOn = null;
      let killer = src && src !== target ? src : null;
      let env = false;
      if (!killer && target.lastAttacker !== null && this.t - (target.hurtBy[target.lastAttacker] || -99) < 5) {
        killer = this.heroes[target.lastAttacker];
        env = !!o.env;
      }
      const assists = [];
      for (const id in target.hurtBy) {
        const a = this.heroes[id];
        if (!a || a === killer || a.team === target.team) continue;
        if (this.t - target.hurtBy[id] <= 3) assists.push(a);
      }
      const helpers = new Set();
      for (const a of [killer, ...assists]) {
        if (!a) continue;
        for (const id in a.healBy) {
          const hh = this.heroes[id];
          if (hh && hh !== a && hh.team === a.team && this.t - a.healBy[id] <= 3 && hh !== killer) helpers.add(hh);
        }
        if (a.st.boost > 0 && a.aux.boostBy !== undefined) { const m = this.heroes[a.aux.boostBy]; if (m && m !== killer) helpers.add(m); }
      }
      for (const a of assists) helpers.add(a);
      const obj = O.MODES[this.mode].nearObjective(this, target.deathPos) || (killer && O.MODES[this.mode].nearObjective(this, killer.pos));
      if (killer) {
        killer.stats.finals++;
        killer.stats.elims++;
        killer.stats.streak++;
        killer.stats.bestStreak = Math.max(killer.stats.bestStreak, killer.stats.streak);
        if (env) killer.stats.envKills++;
        if (!assists.length) killer.stats.solo++;
        if (obj) killer.stats.objKills++;
        killer.recentKills = killer.recentKills.filter(t => this.t - t < 4);
        killer.recentKills.push(this.t);
        if (killer.recentKills.length >= 2) this.ev('multikill', { h: killer.id, n: killer.recentKills.length });
        killer.stats.best = Math.max(killer.stats.best, killer.recentKills.length);
        this.stats.kills[killer.team]++;
      }
      for (const a of helpers) { if (a.team !== target.team) { a.stats.elims++; if (obj) a.stats.objKills++; } }
      const icon = o.ability || (killer && killer.heroId) || 'skull';
      const item = { t: this.t, killer: killer ? killer.id : -1, victim: target.id, icon, crit: !!o.crit, env, assists: [...helpers].map(a => a.id), obj: !!obj };
      this.feed.push(item);
      if (this.feed.length > 30) this.feed.shift();
      this.ev('kill', item);
      this.addFx('death', { x: target.pos.x, y: target.pos.y, z: target.pos.z, hero: target.heroId, team: target.team });
      this.sound('death', target.pos, { hero: target.heroId });
      for (const d of this.deploy) if (d.attach === target.id) d.attach = null;
      for (const h of this.heroes) {
        if (h.k && h.k.beamTo === target.id) h.k.beamTo = null;
        if (h.k && h.k.harmony === target.id) h.k.harmony = null;
        if (h.k && h.k.discord === target.id) h.k.discord = null;
      }
      if (O.KITS.torbjorn && O.KITS.torbjorn.scrapDrop) O.KITS.torbjorn.scrapDrop(this, target);
    }

    step(pinput) {
      const dt = TICK;
      this.t += dt;
      this.tickN++;
      this.phaseTick(dt);
      const M = O.MODES[this.mode];
      this.barriers = [];
      for (const h of this.heroes) {
        const kit = O.KITS[h.heroId];
        if (h.alive && kit && kit.barrier) kit.barrier(this, h);
      }
      for (const d of this.deploy) if (d.barrier && !d.dead && d.hp > 0) this.barriers.push(d.barrier);
      for (const h of this.heroes) {
        if (!h.heroId) {
          if (h.bot && O.AI && this.phase !== 'end') O.AI.pick(this, h);
          continue;
        }
        if (!h.alive) {
          if (!h.spawned) { if (this.phase !== 'end') this.spawnHero(h); continue; }
          h.deadT += dt;
          if (this.phase !== 'end' && this.phase !== 'roundEnd') h.respawnT -= dt;
          if (h.respawnT <= 0 && this.phase !== 'end' && this.phase !== 'roundEnd') this.spawnHero(h);
          continue;
        }
        let inp;
        if (h.human) inp = pinput || blankInput();
        else inp = O.AI ? O.AI.think(this, h, dt) : blankInput();
        if (this.phase === 'end' || h.frozen) { inp = Object.assign(blankInput(), { yaw: inp.yaw, pitch: inp.pitch }); }
        this.tickHero(h, inp, dt);
        h.prev = inp;
      }
      this.separate();
      this.tickProjectiles(dt);
      this.tickDeploy(dt);
      this.tickPickups(dt);
      if (this.phase === 'play' || this.phase === 'overtime') M.tick(this, dt);
      else if (M.idle) M.idle(this, dt);
      if (this.replay) this.replay.record(this);
    }

    phaseTick(dt) {
      if (this.phase === 'assemble') {
        this.phaseT -= dt;
        if (this.rules.practice && this.player && (this.player.heroId || this.player.pendingHero)) this.phaseT = Math.min(this.phaseT, 0);
        if (this.phaseT <= 0 && this.heroes.every(h => h.heroId || !h.human)) {
          for (const h of this.heroes) if (!h.heroId && h.human) O.AI && O.AI.pick(this, h, true);
          this.phase = this.mode === 'control' || this.rules.practice ? 'play' : 'setup';
          this.phaseT = this.phase === 'setup' ? (this.opts.setup === undefined ? 25 : this.opts.setup) : 0;
          this.applyStage();
          if (this.phase === 'play') O.MODES[this.mode].begin(this);
          this.ev('phase', { phase: this.phase });
        } else if (this.phaseT <= 0) {
          for (const h of this.heroes) if (!h.heroId) O.AI && O.AI.pick(this, h, true);
        }
        for (const h of this.heroes) h.frozen = true;
        return;
      }
      for (const h of this.heroes) h.frozen = false;
      if (this.phase === 'setup') {
        this.phaseT -= dt;
        if (this.phaseT <= 0) {
          this.phase = 'play';
          this.applyStage();
          O.MODES[this.mode].begin(this);
          this.ev('phase', { phase: 'play' });
        }
      } else if (this.phase === 'roundEnd') {
        this.phaseT -= dt;
        if (this.phaseT <= 0) O.MODES[this.mode].nextRound(this);
      } else if (this.phase === 'end') {
        this.endT += dt;
      }
    }

    finish(winner) {
      if (this.phase === 'end') return;
      this.phase = 'end';
      this.winner = winner;
      this.endT = 0;
      this.ev('end', { winner });
      for (const h of this.heroes) { h.vis.beams = []; }
    }

    tickHero(h, inp, dt) {
      const st = h.st;
      for (const k in st) if (st[k] > 0) st[k] = Math.max(0, st[k] - dt);
      for (const k in h.cd) if (h.cd[k] > 0) h.cd[k] = Math.max(0, h.cd[k] - dt * (this.rules.cdMul === 1 ? 1 : 1 / this.rules.cdMul));
      if (h.def) h.stats.time[h.heroId] = (h.stats.time[h.heroId] || 0) + dt;
      if (h.fireCd > 0) h.fireCd -= dt;
      h.inSpawn = this.inOwnSpawn(h);
      if (h.inSpawn && this.phase !== 'end') {
        this.heal(null, h, 400 * dt, { noUlt: true });
      }
      const stunned = st.stun > 0 || st.knock > 0 || st.hooked > 0;
      const kit = O.KITS[h.heroId];
      h.inp = inp;
      h.yaw = inp.yaw; h.pitch = clamp(inp.pitch, -1.5, 1.5);
      if (st.poison > 0 && h.aux.poisonSrc !== undefined) {
        const src = this.heroes[h.aux.poisonSrc];
        this.damage(src, h, (h.aux.poisonDps || 15) * dt, { kind: 'dot', ability: 'venom' });
        if (!h.alive) return;
      }
      if (!stunned && kit && this.phase !== 'end' && !h.frozen) kit.tick(this, h, inp, dt);
      else if (kit && kit.passive) kit.passive(this, h, dt);
      if (!h.alive) return;
      if (h.shield < h.maxShield && this.t - h.lastHurt > 3) h.shield = Math.min(h.maxShield, h.shield + 30 * dt);
      if (h.temp > 0 && h.aux.tempDecay) h.temp = Math.max(0, h.temp - h.aux.tempDecay * dt);
      if (!h.ultOn && (this.phase === 'play' || this.phase === 'overtime')) this.addUlt(h, ULT_PASSIVE * dt);
      this.moveHero(h, inp, dt, stunned);
      if (h.alive && h.pos.y < this.map.killY) this.kill(h, null, { env: true, ability: 'fall' });
      h.hist.push({ t: this.t, x: h.pos.x, y: h.pos.y, z: h.pos.z, hp: h.hp, armor: h.armor, shield: h.shield, ammo: h.ammo });
      while (h.hist.length && this.t - h.hist[0].t > 3.2) h.hist.shift();
      const v = h.vis;
      v.moving = Math.hypot(h.vel.x, h.vel.z);
      v.air = !h.onGround;
      v.pitch = h.pitch;
      v.weapon = h.weapon;
      v.crouch = h.crouch;
    }

    speedMul(h) {
      let m = 1;
      const kit = O.KITS[h.heroId];
      if (kit && kit.speed) m *= kit.speed(this, h);
      if (h.st.song > 0) m *= h.aux.songMul || 1;
      if (h.crouch) m *= 0.55;
      if (h.st.slow > 0) m *= 0.5;
      return m;
    }

    moveHero(h, inp, dt, stunned) {
      const kit = O.KITS[h.heroId];
      if (kit && kit.move && kit.move(this, h, inp, dt, stunned)) return;
      let wx = 0, wz = 0;
      const rooted = h.st.root > 0 || h.frozen;
      h.crouch = !!inp.crouch && h.onGround && !stunned;
      if (!stunned && !rooted) {
        const sy = Math.sin(h.yaw), cy = Math.cos(h.yaw);
        let f = inp.fwd, s = inp.side;
        const l = Math.hypot(f, s);
        if (l > 1) { f /= l; s /= l; }
        const sp = 5.5 * this.speedMul(h);
        wx = (sy * f - cy * s) * sp;
        wz = (cy * f + sy * s) * sp;
      }
      const v = h.vel;
      if (h.onGround && !(h.st.kb > 0)) {
        const k = Math.min(1, dt * 22);
        v.x += (wx - v.x) * k; v.z += (wz - v.z) * k;
      } else {
        const ctrl = h.st.kb > 0 ? 1.2 : 4;
        if (wx || wz) {
          const k = Math.min(1, dt * ctrl);
          v.x += (wx - v.x) * k; v.z += (wz - v.z) * k;
        }
        if (h.onGround && h.st.kb > 0) { v.x *= 1 - Math.min(1, dt * 6); v.z *= 1 - Math.min(1, dt * 6); }
      }
      if (inp.jump && h.onGround && !stunned && !rooted && !(h.st.nojump > 0)) {
        v.y = JUMP_V * (h.k.jumpMul || 1);
        h.onGround = false;
        this.sound('jump', h.pos, { soft: true, h: h.id });
      }
      let g = O.GRAVITY * (h.k.gravMul || 1);
      if (kit && kit.gravity) g = kit.gravity(this, h, inp, g);
      v.y -= g * dt;
      if (v.y < -40) v.y = -40;
      h.dyn = this.dyn;
      const wasAir = !h.onGround, vyBefore = v.y;
      this.world.moveChar(h, dt);
      if (wasAir && h.onGround && vyBefore < -9) this.sound('land', h.pos, { soft: true, h: h.id });
      if (kit && kit.landed && wasAir && h.onGround) kit.landed(this, h, vyBefore);
    }

    separate() {
      const hs = this.heroes;
      for (let i = 0; i < hs.length; i++) {
        const a = hs[i];
        if (!a.alive) continue;
        for (let j = i + 1; j < hs.length; j++) {
          const b = hs[j];
          if (!b.alive || a.team === b.team) continue;
          const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
          const min = a.r + b.r;
          if (Math.abs(dx) > min || Math.abs(dz) > min) continue;
          if (a.pos.y > b.pos.y + b.h - 0.2 || b.pos.y > a.pos.y + a.h - 0.2) continue;
          const d = Math.hypot(dx, dz);
          if (d >= min || d < 1e-5) continue;
          const push = (min - d) / 2, nx = dx / d, nz = dz / d;
          if (!(a.k && a.k.charging)) { a.pos.x -= nx * push; a.pos.z -= nz * push; }
          if (!(b.k && b.k.charging)) { b.pos.x += nx * push; b.pos.z += nz * push; }
        }
      }
    }

    spawnProj(h, o) {
      const p = Object.assign({ id: this.uid(), owner: h.id, team: h.team, hero: h.heroId, grav: 0, r: 0.12, life: 3, dmg: 0, crit: 0, bounce: 0, age: 0, hits: null }, o);
      p.pos = Object.assign({}, o.pos);
      p.vel = Object.assign({}, o.vel);
      this.proj.push(p);
      return p;
    }

    aimPoint(h, range = 80) {
      const e = this.eye(h), d = this.aim(h);
      const r = this.trace(h, e.x, e.y, e.z, d.x, d.y, d.z, range, { noBarrier: true });
      return { x: r.x, y: r.y, z: r.z, t: r.t };
    }

    fireProj(h, speed, o, side = 1, spread = 0) {
      const m = this.muzzle(h, side);
      const e = this.eye(h);
      const d0 = this.spreadDir(this.aim(h), spread);
      const ap = this.trace(h, e.x, e.y, e.z, d0.x, d0.y, d0.z, 80, { noBarrier: true });
      let dx = ap.x - m.x, dy = ap.y - m.y, dz = ap.z - m.z;
      if (ap.t < 1.2) { dx = d0.x; dy = d0.y; dz = d0.z; }
      const l = Math.hypot(dx, dy, dz) || 1;
      const start = ap.t < 1.2 ? e : m;
      return this.spawnProj(h, Object.assign({ pos: { x: start.x, y: start.y, z: start.z }, vel: { x: dx / l * speed, y: dy / l * speed, z: dz / l * speed } }, o));
    }

    tickProjectiles(dt) {
      const list = this.proj;
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        if (p.dead) continue;
        p.age += dt;
        if (p.age > p.life) { this.projEnd(p, null); continue; }
        if (p.stuckTo !== undefined) { this.projKit(p, 'stuck', dt); continue; }
        if (p.grav) p.vel.y -= p.grav * dt;
        const vx = p.vel.x * dt, vy = p.vel.y * dt, vz = p.vel.z * dt;
        const len = Math.hypot(vx, vy, vz);
        if (len < 1e-7) { this.projKit(p, 'idle', dt); continue; }
        const dx = vx / len, dy = vy / len, dz = vz / len;
        let best = len, ev = null;
        const w = this.world.raycast(p.pos.x, p.pos.y, p.pos.z, dx, dy, dz, len + p.r * 0.5);
        if (w && w.t < best + p.r * 0.5) { best = Math.min(best, w.t); ev = { type: 'world', t: w.t, n: [w.nx, w.ny, w.nz] }; }
        if (!p.noBarrier) {
          for (const b of this.barriers) {
            if (b.team === p.team || b.hp <= 0) continue;
            const t = this.rayBarrier(b, p.pos.x, p.pos.y, p.pos.z, dx, dy, dz, best);
            if (t !== null && t <= best) { best = t; ev = { type: 'barrier', t, b }; }
          }
        }
        if (!p.noHero) {
          for (const o of this.heroes) {
            if (o.team === p.team || !this.targetable(o)) continue;
            if (p.hits && p.hits.has(o.id)) continue;
            const hr = this.sweepHero(o, p.pos, dx, dy, dz, best, p.r);
            if (hr && hr.t <= best) { best = hr.t; ev = { type: 'hero', t: hr.t, h: o, crit: hr.crit }; }
          }
          for (const d of this.deploy) {
            if (d.team === p.team || !d.shootable || d.hp <= 0) continue;
            const cx = d.pos.x, cy = d.pos.y + (d.cy || 0.5), cz = d.pos.z, rr = (d.rad || 0.5) + p.r;
            const lx = p.pos.x - cx, ly = p.pos.y - cy, lz = p.pos.z - cz;
            const bb = lx * dx + ly * dy + lz * dz, c = lx * lx + ly * ly + lz * lz - rr * rr;
            const disc = bb * bb - c;
            if (disc < 0) continue;
            const t = -bb - Math.sqrt(disc);
            if (t >= 0 && t <= best) { best = t; ev = { type: 'dep', t, d }; }
          }
        }
        if (!ev) { p.pos.x += vx; p.pos.y += vy; p.pos.z += vz; if (p.proxim) this.projKit(p, 'fly', dt); continue; }
        const tt = Math.max(0, ev.t - 0.02);
        p.pos.x += dx * tt; p.pos.y += dy * tt; p.pos.z += dz * tt;
        this.projKit(p, ev.type, dt, ev);
      }
      this.proj = list.filter(p => !p.dead);
    }

    sweepHero(o, pos, dx, dy, dz, maxT, pr) {
      const hh = this.heroH(o);
      const headR = o.def.headR + HEAD_BONUS + pr;
      const hx = o.pos.x, hy = o.pos.y + hh - (headR - pr) * 0.9, hz = o.pos.z;
      let best = null;
      {
        const lx = pos.x - hx, ly = pos.y - hy, lz = pos.z - hz;
        const b = lx * dx + ly * dy + lz * dz, c = lx * lx + ly * ly + lz * lz - headR * headR;
        const disc = b * b - c;
        if (disc >= 0) {
          const t = -b - Math.sqrt(disc);
          if (t >= -headR && t <= maxT) best = { t: Math.max(0, t), crit: true };
        }
      }
      const r = o.r + 0.06 + pr, y0 = o.pos.y - pr, y1 = o.pos.y + hh - (headR - pr) * 1.6;
      const a = dx * dx + dz * dz;
      const lx = pos.x - o.pos.x, lz = pos.z - o.pos.z;
      if (lx * lx + lz * lz <= r * r && pos.y >= y0 && pos.y <= y1) return best && best.t === 0 ? best : { t: 0, crit: false };
      if (a > 1e-9) {
        const b = lx * dx + lz * dz, c = lx * lx + lz * lz - r * r;
        const disc = b * b - a * c;
        if (disc >= 0) {
          const t = (-b - Math.sqrt(disc)) / a;
          if (t >= 0 && t <= maxT) {
            const y = pos.y + dy * t;
            if (y >= y0 && y <= y1 && (!best || t < best.t)) best = { t, crit: false };
          }
        }
      }
      return best;
    }

    projKit(p, type, dt, ev) {
      const kit = O.KITS[p.hero];
      if (kit && kit.proj && kit.proj(this, p, type, ev, dt) !== false) return;
      this.projDefault(p, type, ev);
    }

    projDefault(p, type, ev) {
      const src = this.heroes[p.owner];
      if (type === 'hero') {
        const crit = ev.crit && p.crit ? p.crit : 1;
        this.damage(src, ev.h, p.dmg * crit, { kind: 'proj', ability: p.ability, crit: crit > 1, from: p.pos });
        if (p.splash) this.explode(src, p.pos, p.splash.dmg, p.splash.r, Object.assign({ direct: null }, p.splash));
        this.addFx('impact', { x: p.pos.x, y: p.pos.y, z: p.pos.z, kind: p.fx || p.kind, team: p.team, hero: true });
        if (p.pierce) { p.hits = p.hits || new Set(); p.hits.add(ev.h.id); return; }
        this.projEnd(p, ev);
      } else if (type === 'barrier') {
        this.damageBarrier(ev.b, p.dmg, src);
        if (p.splash) this.explode(src, p.pos, p.splash.dmg, p.splash.r, p.splash);
        if (p.pierceBarrier) return;
        this.projEnd(p, ev);
      } else if (type === 'dep') {
        this.damageDeploy(ev.d, p.dmg, src);
        if (p.splash) this.explode(src, p.pos, p.splash.dmg, p.splash.r, p.splash);
        this.projEnd(p, ev);
      } else if (type === 'world') {
        if (p.bounce > 0) {
          p.bounce--;
          const n = ev.n;
          const dot = p.vel.x * n[0] + p.vel.y * n[1] + p.vel.z * n[2];
          const rest = p.rest === undefined ? 0.5 : p.rest;
          p.vel.x = (p.vel.x - 2 * dot * n[0]) * rest; p.vel.y = (p.vel.y - 2 * dot * n[1]) * rest; p.vel.z = (p.vel.z - 2 * dot * n[2]) * rest;
          p.pos.x += n[0] * 0.05; p.pos.y += n[1] * 0.05; p.pos.z += n[2] * 0.05;
          this.sound('bounce', p.pos, { soft: true });
          return;
        }
        if (p.splash) this.explode(src, p.pos, p.splash.dmg, p.splash.r, p.splash);
        this.addFx('impact', { x: p.pos.x, y: p.pos.y, z: p.pos.z, kind: p.fx || p.kind, team: p.team, n: ev.n });
        this.projEnd(p, ev);
      } else if (type === 'idle') {
        return;
      }
    }

    projEnd(p, ev) {
      if (p.dead) return;
      p.dead = true;
      if (p.explodeOnEnd && !ev) {
        const src = this.heroes[p.owner];
        this.explode(src, p.pos, p.splash.dmg, p.splash.r, p.splash);
      }
    }

    addDeploy(h, o) {
      const d = Object.assign({ id: this.uid(), owner: h.id, team: h.team, hero: h.heroId, hp: 0, age: 0, life: 9999 }, o);
      d.pos = Object.assign({}, o.pos);
      this.deploy.push(d);
      return d;
    }

    tickDeploy(dt) {
      for (const d of this.deploy) {
        if (d.dead) continue;
        d.age += dt;
        if (d.age > d.life) { d.dead = true; const kit = O.KITS[d.hero]; if (kit && kit.deployEnd) kit.deployEnd(this, d); continue; }
        const kit = O.KITS[d.hero];
        if (kit && kit.deploy) kit.deploy(this, d, dt);
      }
      this.deploy = this.deploy.filter(d => !d.dead);
    }

    tickPickups(dt) {
      for (const p of this.pickups) {
        if (p.t > 0) { p.t -= dt; continue; }
        for (const h of this.heroes) {
          if (!h.alive) continue;
          if (Math.abs(h.pos.x - p.x) > 1.1 || Math.abs(h.pos.z - p.z) > 1.1 || Math.abs(h.pos.y - p.y) > 1.6) continue;
          if (h.hp + h.armor + h.shield >= h.maxHp + h.maxArmor + h.maxShield - 0.5) continue;
          this.heal(null, h, p.big ? 250 : 75, { noUlt: true });
          p.t = p.big ? 15 : 10;
          this.sound('pickup', p, { h: h.id });
          this.addFx('pickup', { x: p.x, y: p.y, z: p.z, big: p.big });
          break;
        }
      }
    }

    requestHero(h, heroId) {
      if (!O.HEROES[heroId]) return false;
      if (h.heroId === heroId) return true;
      if (!this.rules.noLimits && !O.HEROES[heroId].training && this.heroes.some(o => o !== h && o.team === h.team && (o.heroId === heroId || o.pendingHero === heroId))) return false;
      if (!h.heroId || !h.spawned) { h.heroId = null; h.pendingHero = null; this.setHero(h, heroId, true); return true; }
      if (!h.alive) { h.pendingHero = heroId; return true; }
      if (h.inSpawn || this.phase === 'assemble' || this.phase === 'setup' || this.rules.practice) {
        const pos = Object.assign({}, h.pos), yaw = h.yaw;
        this.setHero(h, heroId, true);
        h.pos = pos; h.yaw = yaw;
        return true;
      }
      return false;
    }

    teamComp(team) { return this.heroes.filter(h => h.team === team).map(h => h.heroId || h.pendingHero).filter(Boolean); }

    say(h, text, all) {
      this.chat.push({ t: this.t, from: h ? h.id : -1, text, team: h ? h.team : -1, all: !!all });
      if (this.chat.length > 40) this.chat.shift();
      this.ev('chat', { from: h ? h.id : -1, text, all: !!all });
    }

    useUlt(h, name) {
      h.ult = 0;
      h.ultOn = name;
      h.ultT = 0;
      h.stats.ults++;
      this.ev('ult', { h: h.id, hero: h.heroId, name });
      this.sound('ult', h.pos, { hero: h.heroId, h: h.id });
    }

    endUlt(h) { h.ultOn = null; }

    ultReady(h) { return h.def && h.ult >= h.def.ultCost && !h.ultOn; }

    pressed(h, inp, key) { return inp[key] && !h.prev[key]; }
  }

  O.Game = Game;
})(globalThis.Ow98 = globalThis.Ow98 || {});
