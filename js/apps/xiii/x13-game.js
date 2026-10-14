(function (X) {
  'use strict';
  const F = X.F, W = X.WEAPONS;
  const clamp = X.clamp;
  const RUN = 5.0, WALK = 2.3, CROUCH = 2.1;

  class Script {
    constructor(g) { this.g = g; this.h = {}; }
    on(ev, fn) { (this.h[ev] = this.h[ev] || []).push(fn); return this; }
    zone(id, fn) { return this.on('zone:' + id, fn); }
    dead(id, fn) { return this.on('dead:' + id, fn); }
    cleared(grp, fn) { return this.on('cleared:' + grp, fn); }
    use(id, fn) { return this.on('use:' + id, fn); }
    pick(id, fn) { return this.on('pick:' + id, fn); }
    timer(name, fn) { return this.on('timer:' + name, fn); }
    flag(name, fn) { return this.on('flag:' + name, fn); }
    has(ev) { return !!this.h[ev]; }
    fire(ev, repeat) {
      const g = this.g;
      if (!repeat) {
        if (g.flags['!' + ev]) return false;
        if (!this.h[ev]) { if (/^(zone|use|dead|cleared|pick|timer):/.test(ev)) g.flags['!' + ev] = 1; return false; }
        g.flags['!' + ev] = 1;
      }
      const list = this.h[ev];
      if (!list) return false;
      for (const fn of list) fn(g);
      return true;
    }
  }
  X.Script = Script;

  function newPlayer(pos, yaw) {
    return {
      pos: pos.slice(), vel: [0, 0, 0], yaw, pitch: 0, kick: 0, kickYaw: 0, bloom: 0,
      health: 100, maxHealth: 100, armor: 0, alive: true,
      crouched: false, height: X.PLAYER_H, eye: X.EYE, onGround: true, ground: null,
      weapons: { fists: true }, clip: {}, res: {}, weapon: 'fists', prevWeapon: 'fists', object: null, objectHits: 0,
      medkits: 0, keys: [], gadgets: {}, docs: [], skills: [],
      fireCd: 0, reloadT: 0, switchT: 0, zoom: 0, fireHeld: false, jumpHeld: false, useHeld: false,
      ladder: null, rope: null, swim: false, underwater: false, air: 20, hostage: null, body: null,
      lock: null, lockT: 0, hurtT: -10, lastHurt: -10, stepAcc: 0, speed: 0, meleeT: -10, throwT: -10, landT: -10, fallV: 0
    };
  }

  class Game {
    constructor(opts) {
      this.opts = opts = opts || {};
      this.def = typeof opts.level === 'object' ? opts.level : X.level(opts.level || 'brighton');
      if (!this.def) throw new Error('Unknown level ' + opts.level);
      this.diff = X.DIFFICULTY[opts.difficulty === undefined ? 1 : opts.difficulty] || X.DIFFICULTY[1];
      this.rng = X.rng(opts.seed || 1313);
      const built = X.buildLevel(this.def, { game: this });
      this.world = built.world;
      this.B = built.B;
      this.nav = opts.noNav ? null : new X.Nav(this.world, this.B.navBounds);
      this.time = 0;
      this.tickN = 0;
      this.events = [];
      this.flags = {};
      this.objectives = [];
      this.timers = [];
      this.state = 'play';
      this.alarmOn = false;
      this.stats = { kills: 0, headshots: 0, ko: 0, shots: 0, hits: 0, alarms: 0, secrets: 0, secretsTotal: 0, time: 0, deaths: opts.deaths || 0 };
      this.chars = [];
      this.byId = {};
      this.projectiles = [];
      this.vehicles = this.B.vehicles.map(v => Object.assign({ dead: false, maxHp: v.hp }, v, { pos: v.pos.slice() }));
      this.items = this.B.items.map(it => Object.assign({ taken: false }, it));
      this.stats.secretsTotal = this.items.filter(i => i.kind === 'doc').length;
      this.objects = this.B.objects.map(o => Object.assign({ taken: false, broken: false }, o));
      this.doors = this.B.doors;
      this.usables = this.B.usables;
      this.triggers = this.B.triggers;
      this.alarms = this.B.alarms;
      this.cams = this.B.cams;
      this.secCams = this.B.secCams.map(c => Object.assign({ dead: false, sus: 0, cur: c.yaw, t: 0, off: false }, c));
      this.grapples = this.B.grapples.map(g => Object.assign({ deployed: false }, g));
      this.zones = this.B.zones;
      this.groups = this.B.groups;
      this.barrels = this.B.barrels;
      this.searchlights = this.B.searchlights.map(s => Object.assign({ cur: s.yaw, spot: s.pos.slice(), t: s.phase, seeT: -10 }, s));
      this.dropped = [];
      for (const c of this.secCams) {
        c.block = this.world.addMover({ x: c.pos[0], y: c.pos[1], z: c.pos[2], hx: 0.18, hy: 0.14, hz: 0.18, yaw: 0, flags: F.SHOT });
        c.block.cam = c;
      }
      for (const d of this.doors) this.placeDoor(d);
      this.player = newPlayer(this.B.player.pos, this.B.player.yaw);
      this.applyLoadout(opts.carry || null);
      for (const s of this.B.spawns) this.spawnChar(s, !!s.hidden);
      this.script = new Script(this);
      if (this.def.script) this.def.script(this.script, this);
      if (opts.snapshot) this.restore(opts.snapshot);
      else {
        this.script.fire('start');
        this.saved = this.serialize();
      }
    }

    applyLoadout(carry) {
      const p = this.player, st = this.def.start || {};
      const src = (carry && !st.strip) ? carry : (this.def.loadout || null);
      if (src) {
        for (const w of src.weapons || []) p.weapons[w] = true;
        Object.assign(p.clip, src.clip || {});
        Object.assign(p.res, src.res || {});
        p.medkits = src.medkits || 0;
        p.armor = src.armor || 0;
        p.gadgets = Object.assign({}, src.gadgets || {});
        if (src.weapon && p.weapons[src.weapon]) p.weapon = src.weapon;
      }
      if (carry && carry.skills) p.skills = carry.skills.slice();
      else if (this.def.loadout && this.def.loadout.skills) p.skills = this.def.loadout.skills.slice();
      if (carry && st.strip) p.medkits = Math.min(p.medkits, carry.medkits || 0);
      if (!p.skills.includes('sense')) p.skills.unshift('sense');
      if (st.give) {
        for (const w of st.give.weapons || []) { p.weapons[w] = true; }
        Object.assign(p.clip, st.give.clip || {});
        for (const k in st.give.res || {}) p.res[k] = Math.max(p.res[k] || 0, st.give.res[k]);
        if (st.give.gadgets) Object.assign(p.gadgets, st.give.gadgets);
        if (st.give.medkits) p.medkits = Math.max(p.medkits, st.give.medkits);
      }
      p.weapons.fists = true;
      if (!p.weapons[p.weapon]) p.weapon = 'fists';
      for (const w in p.weapons) this.ensureAmmo(w);
    }
    loadout() {
      const p = this.player;
      return { weapons: Object.keys(p.weapons).filter(w => p.weapons[w] && w !== 'object'), clip: Object.assign({}, p.clip), res: Object.assign({}, p.res), medkits: p.medkits, armor: Math.round(p.armor), gadgets: Object.assign({}, p.gadgets), skills: p.skills.slice(), weapon: p.weapon === 'object' ? p.prevWeapon : p.weapon };
    }
    ensureAmmo(w) {
      const p = this.player, wd = W[w];
      if (!wd) return;
      if (wd.clip && p.clip[w] === undefined) p.clip[w] = 0;
      if (p.res[w] === undefined) p.res[w] = 0;
    }
    ev(e) { this.events.push(e); return e; }
    msg(text, dur) { this.ev({ t: 'msg', text, dur: dur || 3 }); }
    has(skill) { return this.player.skills.includes(skill); }

    spawnChar(s, hidden) {
      const def = X.CHARS[s.type];
      if (!def) throw new Error('Unknown char ' + s.type);
      const ch = {
        id: s.id, type: s.type, def, team: s.team || def.team, spawn: s,
        pos: s.pos.slice(), vel: [0, 0, 0], yaw: s.yaw || 0, pitch: 0,
        health: s.hp || def.hp, maxHealth: s.hp || def.hp, armor: s.armor || (def.look.vest ? 40 : 0),
        state: hidden ? 'hidden' : 'alive', weapon: s.weapon === undefined ? def.weapon : s.weapon,
        group: s.group || null, noKill: s.noKill === undefined ? !!def.noKill : s.noKill, boss: !!def.boss || !!s.boss,
        crouch: 0, speed: 0, fireT: -10, hitT: -10, hitDir: [0, 0, 1], deathT: 0, deathKind: null, koDmg: 0, onGround: true, ground: null,
        pose: s.pose || null, grp: s.grp || null, talkT: -10, invuln: !!s.invuln
      };
      this.chars.push(ch);
      this.byId[ch.id] = ch;
      if (X.AI) X.AI.init(this, ch, s);
      if (s.dead) { ch.state = 'dead'; ch.deathT = -10; ch.deathKind = s.dead === true ? 'back' : s.dead; if (ch.ai) ch.ai.dead = true; }
      return ch;
    }
    char(id) { return this.byId[id] || null; }
    vehicle(id) { return this.vehicles.find(v => v.id === id) || null; }
    activeChars() { return this.chars.filter(c => c.state === 'alive' || c.state === 'hostage'); }

    step(input) {
      if (this.state !== 'play') { this.time += X.TICK; return; }
      const dt = X.TICK;
      this.time += dt;
      this.tickN++;
      this.stats.time += dt;
      const p = this.player;
      if (p.alive) this.updatePlayer(input || {}, dt);
      this.updateGroups(dt);
      this.updateDoors(dt);
      if (X.AI) for (const ch of this.chars) if (ch.state === 'alive') X.AI.update(this, ch, dt);
      this.updateHostage();
      for (const v of this.vehicles) if (X.AI && X.AI.vehicle) X.AI.vehicle(this, v, dt);
      this.updateProjectiles(dt);
      this.updateCams(dt);
      this.updateSearchlights(dt);
      if (p.alive) {
        this.updatePickups();
        this.updateTriggers();
        if (this.has('tough') && p.health < 40 && this.time - p.lastHurt > 4) p.health = Math.min(40, p.health + 3 * dt);
      }
      this.updateTimers();
      if (this.def.tick) this.def.tick(this, dt);
    }

    eyePos() { const p = this.player; return [p.pos[0], p.pos[1] + p.eye, p.pos[2]]; }
    aimDir() {
      const p = this.player;
      const sw = this.sway();
      return X.fwd(p.yaw + p.kickYaw + sw[0], p.pitch + p.kick + sw[1]);
    }
    sway() {
      const p = this.player, w = W[p.weapon];
      if (!p.zoom || !w || !w.sway) return [0, 0];
      let a = w.sway * (this.has('cold') ? 0.2 : 1) * (p.crouched ? 0.5 : 1);
      const t = this.time;
      return [Math.sin(t * 0.9) * a + Math.sin(t * 2.3) * a * 0.3, Math.sin(t * 1.3 + 1) * a * 0.8];
    }

    updatePlayer(inp, dt) {
      const p = this.player, w = this.world;
      p.yaw = X.wrap(inp.yaw === undefined ? p.yaw : inp.yaw);
      p.pitch = clamp(inp.pitch === undefined ? p.pitch : inp.pitch, -1.45, 1.45);
      p.kick *= Math.exp(-9 * dt);
      p.kickYaw *= Math.exp(-9 * dt);
      p.bloom = Math.max(0, p.bloom - dt * 0.9);
      const wantCrouch = !!inp.crouch && !p.rope && !p.ladder && !p.swim;
      if (wantCrouch) p.crouched = true;
      else if (p.crouched) {
        if (w.ceiling(p.pos[0], p.pos[2], X.PLAYER_R * 0.8, p.pos[1] + 0.3) > p.pos[1] + X.PLAYER_H + 0.02) p.crouched = false;
      }
      p.height = p.crouched ? X.CROUCH_H : X.PLAYER_H;
      p.eye = X.approach(p.eye, p.crouched ? X.CROUCH_EYE : X.EYE, dt * 4);
      const wy = w.waterAt(p.pos[0], p.pos[2]);
      if (!p.swim && wy !== null && p.pos[1] < wy - 1.05 && !p.rope && !p.ladder) { p.swim = true; this.ev({ t: 'splash', p: p.pos.slice() }); }
      if (p.rope) this.ropeMove(inp, dt);
      else if (p.ladder) this.ladderMove(inp, dt);
      else if (p.swim) this.swimMove(inp, dt, wy);
      else this.walkMove(inp, dt);
      if (!p.swim) p.air = Math.min(20, p.air + dt * 6);
      this.updateWeapon(inp, dt);
      this.updateUse(inp, dt);
      if (p.pos[1] < (this.def.killY === undefined ? -40 : this.def.killY)) this.hurtPlayer(1000, null, 'fall');
    }

    walkMove(inp, dt) {
      const p = this.player, w = this.world;
      const f = X.fwd(p.yaw, 0), r = X.right(p.yaw);
      let fw = clamp(inp.fwd || 0, -1, 1), sd = clamp(inp.side || 0, -1, 1);
      let wx = f[0] * fw + r[0] * sd, wz = f[2] * fw + r[2] * sd;
      const wl = Math.hypot(wx, wz);
      if (wl > 1) { wx /= wl; wz /= wl; }
      let speed = RUN;
      if (inp.walk) speed = WALK;
      if (p.crouched) speed = CROUCH;
      const wd = W[p.weapon];
      if (wd && wd.heavy) speed *= wd.heavy;
      if (p.hostage || p.body) speed = Math.min(speed, 1.9);
      if (p.zoom) speed *= 0.55;
      if (p.lock) speed = 0;
      const tx = wx * speed, tz = wz * speed;
      const acc = (p.onGround ? 42 : 7) * dt;
      const dx = tx - p.vel[0], dz = tz - p.vel[2];
      const dl = Math.hypot(dx, dz);
      if (dl > acc) { p.vel[0] += dx / dl * acc; p.vel[2] += dz / dl * acc; } else { p.vel[0] = tx; p.vel[2] = tz; }
      if (inp.jump && !p.jumpHeld && p.onGround && !p.crouched && !p.hostage && !p.body && !p.lock) {
        p.vel[1] = 5.3; p.onGround = false; p.ground = null;
        this.ev({ t: 'jump' });
      }
      p.jumpHeld = !!inp.jump;
      if (!p.onGround) p.vel[1] -= X.GRAVITY * dt;
      const old = [p.pos[0], p.pos[1], p.pos[2]];
      this.moveBody(p, X.PLAYER_R, p.height, dt, true);
      p.speed = Math.hypot(p.pos[0] - old[0], p.pos[2] - old[2]) / dt;
      if (p.onGround && p.speed > 0.6) {
        p.stepAcc += p.speed * dt;
        const stride = inp.walk || p.crouched ? 0.75 : 1.05;
        if (p.stepAcc > stride) {
          p.stepAcc = 0;
          const running = !inp.walk && !p.crouched;
          const rad = running ? 9 : (this.has('silent') ? 0.8 : 2.8);
          this.noise(p.pos, rad, 'step', 'player');
          this.ev({ t: 'step', p: p.pos.slice(), mat: this.surfaceAt(p), run: running });
        }
      }
      const ld = w.ladderAt(p.pos[0], p.pos[1] + 0.3, p.pos[2], X.PLAYER_R);
      const fromTop = ld && p.pos[1] > ld.y0 + 1.0 && Math.abs(fw) > 0.2;
      if (ld && ((fw > 0.2 && Math.abs(X.angDiff(p.yaw, ld.yaw)) < 1.2) || fromTop) && !p.hostage && !p.body) {
        p.ladder = ld; p.vel = [0, 0, 0]; p.onGround = false;
      }
    }

    moveBody(o, r, h, dt, isPlayer) {
      const w = this.world;
      const vx = o.vel[0], vz = o.vel[2];
      const dist = Math.hypot(vx, vz) * dt;
      const n = Math.max(1, Math.ceil(dist / 0.2));
      for (let i = 0; i < n; i++) {
        const px = o.pos[0], pz = o.pos[2];
        o.pos[0] += vx * dt / n; o.pos[2] += vz * dt / n;
        w.collide(o.pos, r, o.pos[1] + X.STEP, o.pos[1] + h);
        const th = w.terrainAt(o.pos[0], o.pos[2]);
        if (th !== null && th > o.pos[1] + X.STEP) {
          const tr = w.terrainObj(o.pos[0], o.pos[2]);
          const nn = tr.normalAt(o.pos[0], o.pos[2]);
          if (nn[1] < 0.7 || th > o.pos[1] + 1.2) { o.pos[0] = px; o.pos[2] = pz; }
        }
      }
      const newY = o.pos[1] + o.vel[1] * dt;
      const maxY = o.vel[1] > 0.5 ? o.pos[1] + 0.05 : o.pos[1] + X.STEP;
      const sup = w.support(o.pos[0], o.pos[2], r * 0.75, maxY);
      if (o.vel[1] <= 0 && newY <= sup.y) {
        if (!o.onGround) { o.landV = o.vel[1]; if (isPlayer) this.landed(o.vel[1]); }
        o.pos[1] = sup.y; o.vel[1] = 0; o.onGround = true; o.ground = sup.block;
      } else if (o.onGround && o.vel[1] <= 0 && sup.y > o.pos[1] - X.STEP - 0.05 && sup.y > -1e8) {
        o.pos[1] = sup.y; o.vel[1] = 0; o.ground = sup.block;
      } else {
        o.pos[1] = newY; o.onGround = false; o.ground = null;
      }
      const ceil = w.ceiling(o.pos[0], o.pos[2], r * 0.75, o.pos[1] + 0.25);
      if (o.pos[1] + h > ceil) { o.pos[1] = Math.max(sup.y > -1e8 ? sup.y : o.pos[1] - 1, ceil - h); if (o.vel[1] > 0) o.vel[1] = 0; }
    }

    landed(vy) {
      const p = this.player;
      p.landT = this.time; p.fallV = vy;
      if (vy < -10.5) this.hurtPlayer(Math.round((-vy - 10.5) * 9), null, 'fall');
      if (vy < -4) this.ev({ t: 'land', v: vy, mat: this.surfaceAt(p) });
    }

    surfaceAt(o) {
      if (o.ground && o.ground.mat) return o.ground.mat;
      const tv = this.world.visuals.find(v => v.t === 'terrain' && v.ref.heightAt(o.pos[0], o.pos[2]) !== null);
      if (tv) {
        if (tv.low && o.pos[1] < tv.lowY) return tv.low;
        return tv.mat;
      }
      return 'concrete';
    }

    ladderMove(inp, dt) {
      const p = this.player, ld = p.ladder;
      const f = X.fwd(ld.yaw, 0);
      const fw = inp.fwd || 0;
      let dir = 0;
      const facing = Math.abs(X.angDiff(p.yaw, ld.yaw)) < 1.6;
      if (fw > 0.1) dir = !facing || p.pitch < -0.55 ? -1 : 1;
      else if (fw < -0.1) dir = facing ? -1 : 1;
      p.pos[1] += dir * 2.6 * dt;
      const tx = ld.x - f[0] * 0.32, tz = ld.z - f[2] * 0.32;
      p.pos[0] += (tx - p.pos[0]) * Math.min(1, dt * 10);
      p.pos[2] += (tz - p.pos[2]) * Math.min(1, dt * 10);
      p.vel = [0, 0, 0];
      p.speed = Math.abs(dir) * 2.6;
      if (dir !== 0) {
        p.stepAcc += dt;
        if (p.stepAcc > 0.4) { p.stepAcc = 0; this.ev({ t: 'step', p: p.pos.slice(), mat: 'ladder', run: false }); }
      }
      if (p.pos[1] >= ld.y1 - 0.05 && dir > 0) {
        p.pos[1] = ld.y1 + 0.02;
        p.pos[0] = ld.x + f[0] * 0.6; p.pos[2] = ld.z + f[2] * 0.6;
        this.world.collide(p.pos, X.PLAYER_R, p.pos[1] + X.STEP, p.pos[1] + p.height);
        p.ladder = null; p.onGround = true;
      } else if (p.pos[1] <= ld.y0 && dir < 0) {
        p.pos[1] = ld.y0; p.ladder = null; p.onGround = true;
      }
      if (inp.jump && !p.jumpHeld) { p.ladder = null; p.vel = [-f[0] * 2.5, 1.5, -f[2] * 2.5]; p.onGround = false; }
      p.jumpHeld = !!inp.jump;
    }

    ropeMove(inp, dt) {
      const p = this.player, rp = p.rope, hk = rp.hook;
      const fw = inp.fwd || 0;
      const dir = fw > 0.1 ? 1 : fw < -0.1 ? -1 : 0;
      p.pos[1] += dir * 2.2 * dt;
      const f = X.fwd(hk.yaw, 0);
      const tx = hk.pos[0] - f[0] * 0.4, tz = hk.pos[2] - f[2] * 0.4;
      p.pos[0] += (tx - p.pos[0]) * Math.min(1, dt * 8);
      p.pos[2] += (tz - p.pos[2]) * Math.min(1, dt * 8);
      p.vel = [0, 0, 0];
      p.speed = Math.abs(dir) * 2;
      if (p.pos[1] + 1.2 >= hk.pos[1] && dir > 0) {
        const tgt = [hk.pos[0] + f[0] * 0.9, hk.pos[1] + 0.6, hk.pos[2] + f[2] * 0.9];
        const s = this.world.support(tgt[0], tgt[2], 0.2, tgt[1]);
        if (s.y > hk.pos[1] - 1.5) {
          p.pos = [tgt[0], s.y + 0.02, tgt[2]]; p.rope = null; p.onGround = true;
          this.world.collide(p.pos, X.PLAYER_R, p.pos[1] + X.STEP, p.pos[1] + X.PLAYER_H);
          this.ev({ t: 'ropeTop' });
          return;
        }
        p.pos[1] = hk.pos[1] - 1.2;
      }
      if (p.pos[1] <= hk.bottom && dir < 0) { p.pos[1] = hk.bottom; p.rope = null; p.onGround = true; }
      if (inp.jump && !p.jumpHeld) { p.rope = null; p.vel = [-f[0] * 2, 1, -f[2] * 2]; p.onGround = false; }
      p.jumpHeld = !!inp.jump;
    }

    swimMove(inp, dt, wy) {
      const p = this.player, w = this.world;
      if (wy === null) { p.swim = false; return; }
      const f = X.fwd(p.yaw, p.pitch), r = X.right(p.yaw);
      const fw = inp.fwd || 0, sd = inp.side || 0;
      let v = [f[0] * fw + r[0] * sd, f[1] * fw, f[2] * fw + r[2] * sd];
      const l = X.vlen(v);
      if (l > 1) v = X.vscale(v, 1 / l);
      const sp = 2.7;
      let vy = v[1] * sp;
      if (inp.jump) vy += 2.4;
      if (inp.crouch) vy -= 2.4;
      const surf = wy - 1.25;
      if (p.pos[1] > surf && vy > 0 && !inp.jump) vy = 0;
      if (!fw && !sd && !inp.jump && !inp.crouch) vy = p.pos[1] < surf ? 0.6 : 0;
      p.vel = [v[0] * sp, vy, v[2] * sp];
      p.pos[0] += p.vel[0] * dt; p.pos[2] += p.vel[2] * dt;
      w.collide(p.pos, X.PLAYER_R, p.pos[1] + 0.3, p.pos[1] + 1.4);
      p.pos[1] += p.vel[1] * dt;
      if (p.pos[1] > wy - 1.05 && !inp.jump) p.pos[1] = Math.min(p.pos[1], wy - 1.05);
      const sup = w.support(p.pos[0], p.pos[2], X.PLAYER_R * 0.7, p.pos[1] + X.STEP);
      if (p.pos[1] < sup.y) p.pos[1] = sup.y;
      p.speed = Math.hypot(p.vel[0], p.vel[2]);
      if (sup.y > wy - 1.1 && p.pos[1] <= sup.y + 0.15) { p.swim = false; p.onGround = true; p.pos[1] = sup.y; }
      if (inp.jump && sup.y > wy - 1.6 && sup.y < wy + 0.5 && p.pos[1] >= wy - 1.3 && fw > 0) {
        const ahead = [p.pos[0] + f[0] * 0.6, p.pos[2] + f[2] * 0.6];
        const s2 = w.support(ahead[0], ahead[1], 0.2, wy + 0.8);
        if (s2.y > wy - 0.4 && !w.overlaps(ahead[0], ahead[1], 0.3, s2.y + 0.3, s2.y + 1.7)) { p.pos = [ahead[0], s2.y, ahead[1]]; p.swim = false; p.onGround = true; }
      }
      p.underwater = p.pos[1] + p.eye < wy;
      if (p.underwater) {
        p.air -= dt;
        if (p.air < 0) { p.air = 0; if (this.tickN % 30 === 0) this.hurtPlayer(6, null, 'drown'); }
      } else p.air = Math.min(20, p.air + dt * 6);
      p.jumpHeld = !!inp.jump;
      if (p.speed > 0.5) {
        p.stepAcc += p.speed * dt;
        if (p.stepAcc > 1.6) { p.stepAcc = 0; this.ev({ t: 'swim', p: p.pos.slice(), under: p.underwater }); }
      }
    }

    updateGroups(dt) {
      for (const g of this.groups) {
        if (!g.moving || !g.path) { g.vel = [0, 0, 0]; continue; }
        const pts = g.path;
        let seg = Math.floor(g.pathT), frac = g.pathT - seg;
        if (seg >= pts.length - 1) {
          if (g.loop) { g.pathT -= pts.length - 1; seg = 0; }
          else { g.moving = false; g.vel = [0, 0, 0]; this.script.fire(g.ev || ('arrive:' + g.id), true); continue; }
        }
        const a = pts[seg], b = pts[seg + 1];
        const len = Math.max(0.01, X.vdist(a, b));
        g.pathT += g.speed * dt / len;
        seg = Math.floor(g.pathT); frac = g.pathT - seg;
        let np;
        if (seg >= pts.length - 1) np = g.loop ? pts[0].slice() : pts[pts.length - 1].slice();
        else np = X.vlerp(pts[seg], pts[seg + 1], frac);
        const old = g.pos.slice(), oldYaw = g.yaw;
        let yaw = g.yaw;
        if (g.face && seg < pts.length - 1) {
          const dir = X.vsub(pts[seg + 1], pts[seg]);
          if (Math.hypot(dir[0], dir[2]) > 1e-3) yaw = X.turnTo(g.yaw, Math.atan2(-dir[0], -dir[2]), (g.turn || 0.9) * dt);
        }
        const d = X.vsub(np, old);
        const dy = yaw - oldYaw, cy = Math.cos(dy), sy = Math.sin(dy);
        const shift = q => {
          const rx = q[0] - old[0], rz = q[2] - old[2];
          q[0] = np[0] + rx * cy + rz * sy; q[1] += d[1]; q[2] = np[2] - rx * sy + rz * cy;
        };
        g.vel = X.vscale(d, 1 / dt);
        X.placeGroup(g, np, yaw);
        const inBox = o => {
          const b = g.carry;
          if (!b) return false;
          const c = Math.cos(oldYaw), sn = Math.sin(oldYaw);
          const rx = o.pos[0] - old[0], ry = o.pos[1] - old[1], rz = o.pos[2] - old[2];
          const lx = rx * c - rz * sn, lz = rx * sn + rz * c;
          return lx > b[0] && lx < b[3] && ry > b[1] && ry < b[4] && lz > b[2] && lz < b[5];
        };
        const carry = o => { if ((o.ground && o.ground.grp === g) || (!o.ground && inBox(o))) shift(o.pos); };
        carry(this.player);
        for (const c of this.chars) {
          if (c.grp === g.id && (c.state === 'alive' || c.state === 'dead' || c.state === 'ko')) { shift(c.pos); c.yaw += dy; }
          else carry(c);
        }
        for (const it of this.items) if (it.grp === g.id && !it.taken) shift(it.pos);
        for (const u of this.usables) if (u.grp === g.id) shift(u.pos);
      }
    }
    moveGroup(id, pts, speed, o) {
      const g = this.groups.find(q => q.id === id);
      if (!g) return;
      o = typeof o === 'string' ? { ev: o } : (o || {});
      g.loop = !!o.loop; g.face = !!o.face; g.turn = o.turn || 0;
      g.path = g.loop ? pts.map(q => q.slice()).concat([pts[0].slice()]) : [g.pos.slice()].concat(pts);
      g.pathT = 0; g.speed = speed; g.moving = true; g.ev = o.ev || null;
    }
    stopGroup(id) { const g = this.groups.find(q => q.id === id); if (g) g.moving = false; }

    placeDoor(d) {
      const b = d.block;
      if (d.kind === 'slide') {
        const off = d.open * d.w * 0.95;
        const cx = d.hinge[0] + Math.cos(d.baseYaw) * (d.w / 2) + d.slideAxis[0] * off * d.openSign;
        const cz = d.hinge[1] - Math.sin(d.baseYaw) * (d.w / 2) + d.slideAxis[2] * off * d.openSign;
        this.world.moveMover(b, cx, d.y + d.h / 2, cz, d.baseYaw);
      } else {
        const yaw = d.baseYaw + d.angle * d.openSign;
        this.world.moveMover(b, d.hinge[0] + Math.cos(yaw) * (d.w / 2), d.y + d.h / 2, d.hinge[1] - Math.sin(yaw) * (d.w / 2), yaw);
      }
    }
    updateDoors(dt) {
      for (const d of this.doors) {
        if (d.kind === 'slide') {
          const t = d.target;
          if (d.open === t) continue;
          d.open = X.approach(d.open, t, dt * (d.speed * 0.5));
        } else {
          const tgt = d.target * 1.62;
          if (d.angle === tgt) continue;
          d.angle = X.approach(d.angle, tgt, dt * d.speed);
          d.open = d.angle / 1.62;
        }
        this.placeDoor(d);
      }
    }
    door(id) { return this.doors.find(d => d.id === id) || null; }
    openDoor(d, from) {
      if (typeof d === 'string') d = this.door(d);
      if (!d || d.target === 1) return;
      if (d.kind === 'swing' && from) {
        const n = [Math.sin(d.baseYaw), Math.cos(d.baseYaw)];
        const cx = d.hinge[0] + Math.cos(d.baseYaw) * d.w / 2, cz = d.hinge[1] - Math.sin(d.baseYaw) * d.w / 2;
        const side = (from[0] - cx) * n[0] + (from[2] - cz) * n[1];
        d.openSign = side > 0 ? -1 : 1;
      }
      d.target = 1;
      this.ev({ t: 'door', id: d.id, open: true, p: [d.hinge[0], d.y + 1, d.hinge[1]], kind: d.kind, bars: d.bars });
    }
    closeDoor(d) {
      if (typeof d === 'string') d = this.door(d);
      if (!d || d.target === 0) return;
      d.target = 0;
      this.ev({ t: 'door', id: d.id, open: false, p: [d.hinge[0], d.y + 1, d.hinge[1]], kind: d.kind, bars: d.bars });
    }
    unlock(id) { const d = this.door(id); if (d) d.locked = null; }

    updateUse(inp, dt) {
      const p = this.player;
      const pressed = inp.use && !p.useHeld;
      p.useHeld = !!inp.use;
      if (p.lock) {
        const d = p.lock;
        const dd = Math.hypot(d.hinge[0] - p.pos[0], d.hinge[1] - p.pos[2]);
        if (!inp.use || dd > d.w + 1.8) { p.lock = null; p.lockT = 0; this.ev({ t: 'lockStop' }); return; }
        p.lockT += dt / (this.has('hands') ? 1.6 : 2.6);
        if (this.tickN % 20 === 0) this.ev({ t: 'lockTick' });
        if (p.lockT >= 1) {
          d.locked = null; p.lock = null; p.lockT = 0;
          this.ev({ t: 'unlocked', id: d.id });
          this.openDoor(d, p.pos);
          this.script.fire('unlock:' + d.id);
        }
        return;
      }
      if (!pressed) return;
      if (p.hostage) { this.releaseHostage(false); return; }
      if (p.body) { this.dropBody(); return; }
      if (p.rope) { p.rope = null; return; }
      const eye = this.eyePos(), dir = X.fwd(p.yaw, p.pitch);
      let bestU = null, bu = 1e9;
      for (const u of this.usables) {
        if (!u.enabled) continue;
        const d = X.vsub(u.pos, eye), dist = X.vlen(d);
        if (dist > u.r + 0.5) continue;
        const dot = X.vdot(X.vscale(d, 1 / Math.max(dist, 0.01)), dir);
        if (dot < (dist < 0.9 ? -0.2 : 0.55)) continue;
        const score = dist * (1.6 - dot);
        if (score < bu) { bu = score; bestU = u; }
      }
      const hit = this.world.ray(eye, dir, 2.4, F.SOLID);
      const door = hit && hit.block && hit.block.isMover ? this.doors.find(d => d.block === hit.block) : null;
      if (bestU && (!door || bu < hit.t)) { this.useUsable(bestU); return; }
      if (door) { this.useDoor(door); return; }
      if (this.tryGrapple()) return;
      if (this.tryObject(eye, dir)) return;
      if (this.tryHostage()) return;
      if (this.tryBody()) return;
      if (bestU) this.useUsable(bestU);
    }
    useUsable(u) {
      if (u.need && !this.player.keys.includes(u.need) && !this.player.gadgets[u.need]) { this.msg(u.needMsg || 'Нужен предмет: ' + u.need); return; }
      if (u.once) u.enabled = false;
      this.ev({ t: 'use', id: u.id });
      this.script.fire('use:' + u.id, !u.once);
    }
    useDoor(d) {
      const p = this.player;
      if (d.target === 1) { if (!d.noClose) this.closeDoor(d); return; }
      if (d.locked) {
        if (d.locked === 'pick') {
          if (!p.gadgets.lockpick) { this.msg('Заперто. Нужна отмычка.'); this.ev({ t: 'locked', id: d.id }); return; }
          p.lock = d; p.lockT = 0; this.ev({ t: 'lockStart', id: d.id }); return;
        }
        if (d.locked === 'script') { this.msg(d.label || 'Заперто.'); this.ev({ t: 'locked', id: d.id }); return; }
        if (p.keys.includes(d.locked)) { d.locked = null; this.msg('Открыто ключом: ' + (d.keyName || d.locked)); }
        else { this.msg('Заперто. Нужен ключ' + (d.keyName ? ': ' + d.keyName : '.')); this.ev({ t: 'locked', id: d.id }); return; }
      }
      this.openDoor(d, p.pos);
      this.script.fire('open:' + d.id);
    }
    tryGrapple() {
      const p = this.player;
      if (!p.gadgets.hook) return false;
      for (const h of this.grapples) {
        const dh = Math.hypot(h.pos[0] - p.pos[0], h.pos[2] - p.pos[2]);
        if (dh > 3.2 || p.pos[1] > h.pos[1] || p.pos[1] < h.bottom - 1.5) continue;
        h.deployed = true;
        this.flags['hook:' + h.id] = 1;
        p.rope = { hook: h };
        p.pos[1] = Math.max(p.pos[1], h.bottom);
        p.vel = [0, 0, 0];
        p.hostage = null;
        this.ev({ t: 'grapple', id: h.id });
        return true;
      }
      return false;
    }
    tryObject(eye, dir) {
      const p = this.player;
      let best = null, bd = 2.1;
      for (const o of this.objects) {
        if (o.taken || o.broken) continue;
        const d = X.vsub([o.pos[0], o.pos[1] + 0.3, o.pos[2]], eye), dist = X.vlen(d);
        if (dist > bd) continue;
        if (X.vdot(X.vscale(d, 1 / dist), dir) < 0.6) continue;
        best = o; bd = dist;
      }
      if (!best) return false;
      if (p.object) this.dropObject();
      best.taken = true;
      p.object = best.kind; p.objectHits = (X.OBJECTS[best.kind] || { hits: 1 }).hits; p.objectRef = best;
      if (p.weapon !== 'object') p.prevWeapon = p.weapon;
      p.weapons.object = true;
      p.weapon = 'object'; p.switchT = 0.25; p.zoom = 0;
      this.ev({ t: 'pickup', kind: 'object', name: (X.OBJECTS[best.kind] || {}).name || best.kind });
      return true;
    }
    dropObject() {
      const p = this.player;
      if (!p.object) return;
      const o = p.objectRef;
      if (o) {
        const f = X.fwd(p.yaw, 0);
        o.pos = [p.pos[0] + f[0] * 0.8, 0, p.pos[2] + f[2] * 0.8];
        o.pos[1] = this.world.support(o.pos[0], o.pos[2], 0.1, p.pos[1] + 0.5).y;
        o.taken = false;
      }
      p.object = null; p.objectRef = null; p.weapons.object = false;
      if (p.weapon === 'object') { p.weapon = p.prevWeapon && p.weapons[p.prevWeapon] ? p.prevWeapon : 'fists'; p.switchT = 0.3; }
    }
    tryHostage() {
      const p = this.player;
      const f = X.fwd(p.yaw, 0);
      for (const c of this.chars) {
        if (c.state !== 'alive' || c.boss || c.team === 'ally' || c.team === 'player' || c.grp) continue;
        const d = [c.pos[0] - p.pos[0], 0, c.pos[2] - p.pos[2]];
        const dist = Math.hypot(d[0], d[2]);
        if (dist > 1.5 || Math.abs(c.pos[1] - p.pos[1]) > 0.6) continue;
        const dn = [d[0] / dist, 0, d[2] / dist];
        if (dn[0] * f[0] + dn[2] * f[2] < 0.5) continue;
        const cf = X.fwd(c.yaw, 0);
        const behind = cf[0] * dn[0] + cf[2] * dn[2] > 0.2;
        const stunned = !!(c.ai && (c.ai.stunT || 0) > 0);
        if (!behind && !stunned) continue;
        p.hostage = c;
        c.state = 'hostage';
        c.pose = null;
        if (p.object) this.dropObject();
        this.ev({ t: 'hostage', id: c.id });
        if (c.ai) X.AI.onHostage && X.AI.onHostage(this, c);
        this.script.fire('hostage:' + c.id);
        this.script.fire('hostage', true);
        return true;
      }
      return false;
    }
    tryBody() {
      const p = this.player;
      const f = X.fwd(p.yaw, 0);
      let best = null, bd = 1.8;
      for (const c of this.chars) {
        if ((c.state !== 'dead' && c.state !== 'ko') || c.boss || c.noCarry) continue;
        const dx = c.pos[0] - p.pos[0], dz = c.pos[2] - p.pos[2];
        const dist = Math.hypot(dx, dz);
        if (dist > bd || Math.abs(c.pos[1] - p.pos[1]) > 0.8) continue;
        if ((dx * f[0] + dz * f[2]) / Math.max(dist, 0.01) < 0.2 && dist > 0.6) continue;
        best = c; bd = dist;
      }
      if (!best) return false;
      p.body = best;
      best.carried = true;
      if (p.object) this.dropObject();
      this.ev({ t: 'bodyPick', id: best.id });
      return true;
    }
    dropBody() {
      const p = this.player, c = p.body;
      if (!c) return;
      const f = X.fwd(p.yaw, 0);
      c.pos = [p.pos[0] + f[0] * 0.8, p.pos[1], p.pos[2] + f[2] * 0.8];
      this.world.collide(c.pos, 0.25, c.pos[1] + 0.3, c.pos[1] + 0.6);
      c.pos[1] = this.world.support(c.pos[0], c.pos[2], 0.2, p.pos[1] + 0.5).y;
      c.yaw = p.yaw + Math.PI / 2;
      c.carried = false;
      p.body = null;
      this.ev({ t: 'bodyDrop', id: c.id, p: c.pos.slice() });
    }
    updateHostage() {
      const p = this.player;
      const hold = (c, dist, drop) => {
        const f = X.fwd(p.yaw, 0);
        c.pos = [p.pos[0] + f[0] * dist, p.pos[1] + (drop || 0), p.pos[2] + f[2] * dist];
        c.yaw = p.yaw;
        c.vel = [0, 0, 0];
      };
      if (p.hostage) {
        if (p.hostage.state !== 'hostage' || !p.alive) { p.hostage = null; }
        else hold(p.hostage, 0.55, 0);
      }
      if (p.body) {
        if (!p.alive || (p.body.state !== 'dead' && p.body.state !== 'ko')) { p.body = null; }
        else hold(p.body, 0.35, 0.35);
      }
    }
    releaseHostage(knock) {
      const p = this.player, c = p.hostage;
      if (!c) return;
      p.hostage = null;
      if (knock) {
        c.state = 'alive';
        this.knockOut(c, true);
        this.ev({ t: 'word', text: X.WORDS.punch[this.tickN % 3], p: [c.pos[0], c.pos[1] + 1.7, c.pos[2]], style: 'hit' });
        return;
      }
      c.state = 'alive';
      const f = X.fwd(p.yaw, 0);
      c.vel = [f[0] * 3, 0, f[2] * 3];
      c.pos = [p.pos[0] + f[0] * 1.0, c.pos[1], p.pos[2] + f[2] * 1.0];
      this.world.collide(c.pos, 0.3, c.pos[1] + X.STEP, c.pos[1] + 1.7);
      if (c.ai) { c.ai.stunT = 1.2; X.AI.alert(this, c, p.pos, true); }
      this.ev({ t: 'release', id: c.id });
    }

    selectWeapon(w) {
      const p = this.player;
      if (!p.weapons[w] || w === p.weapon) return;
      if (w !== 'object' && p.object) this.dropObject();
      const wd = W[w];
      if (wd.kind === 'throw' || wd.kind === 'grenade') { if ((p.res[w] || 0) <= 0) return; }
      p.prevWeapon = p.weapon;
      p.weapon = w;
      p.switchT = 0.4; p.reloadT = 0; p.zoom = 0;
      this.ev({ t: 'switch', w });
    }
    ownedList() {
      const p = this.player;
      return X.WEAPON_ORDER.filter(w => p.weapons[w] && (w !== 'object' || p.object) && (!(W[w].kind === 'throw' || W[w].kind === 'grenade') || (p.res[w] || 0) > 0));
    }
    cycleWeapon(dir) {
      const list = this.ownedList();
      if (!list.length) return;
      const i = list.indexOf(this.player.weapon);
      this.selectWeapon(list[(i + dir + list.length) % list.length]);
    }
    slotWeapon(slot) {
      const list = this.ownedList().filter(w => W[w].slot === slot);
      if (!list.length) return;
      const i = list.indexOf(this.player.weapon);
      this.selectWeapon(list[(i + 1) % list.length]);
    }

    updateWeapon(inp, dt) {
      const p = this.player;
      p.fireCd -= dt; p.switchT -= dt;
      if (p.reloadT > 0) {
        p.reloadT -= dt;
        if (p.reloadT <= 0) this.finishReload();
      }
      if (inp.weapon) this.selectWeapon(inp.weapon);
      if (inp.slot) this.slotWeapon(inp.slot);
      if (inp.next) this.cycleWeapon(1);
      if (inp.prev) this.cycleWeapon(-1);
      if (inp.lastWeapon && p.prevWeapon && p.weapons[p.prevWeapon]) this.selectWeapon(p.prevWeapon);
      if (inp.reload) this.startReload();
      if (inp.medkit) this.useMedkit();
      const wd = W[p.weapon];
      if (inp.zoom && wd && wd.zoom && p.switchT <= 0 && p.reloadT <= 0) { p.zoom = (p.zoom + 1) % (wd.zoom.length + 1); this.ev({ t: 'zoom', z: p.zoom }); }
      if (inp.grenade && !p.hostage && !p.body && !p.swim && (p.res.grenade || 0) > 0 && p.fireCd <= 0 && p.weapons.grenade) this.throwGrenade();
      if (p.hostage) {
        if (inp.fire && !p.fireHeld) this.releaseHostage(true);
        p.fireHeld = !!inp.fire;
        return;
      }
      if (p.body || p.rope || p.ladder || p.lock) { p.fireHeld = !!inp.fire; return; }
      if (inp.fire && (wd.auto || !p.fireHeld)) this.tryFire();
      p.fireHeld = !!inp.fire;
    }
    startReload() {
      const p = this.player, w = p.weapon, wd = W[w];
      if (!wd || !wd.clip || p.reloadT > 0 || p.switchT > 0) return;
      if ((p.clip[w] || 0) >= wd.clip || (p.res[w] || 0) <= 0) return;
      p.reloadT = wd.reload * (this.has('hands') ? 0.67 : 1);
      p.zoom = 0;
      this.ev({ t: 'reload', w });
    }
    finishReload() {
      const p = this.player, w = p.weapon, wd = W[w];
      if (!wd || !wd.clip) return;
      if (wd.shellReload) {
        if (p.res[w] > 0 && p.clip[w] < wd.clip) { p.clip[w]++; p.res[w]--; this.ev({ t: 'shell' }); }
        if (p.res[w] > 0 && p.clip[w] < wd.clip) p.reloadT = wd.reload * (this.has('hands') ? 0.67 : 1);
        else this.ev({ t: 'reloadEnd', w });
        return;
      }
      const need = wd.clip - p.clip[w], take = Math.min(need, p.res[w]);
      p.clip[w] += take; p.res[w] -= take;
      this.ev({ t: 'reloadEnd', w });
    }
    useMedkit() {
      const p = this.player;
      if (p.medkits <= 0 || p.health >= p.maxHealth) return;
      p.medkits--;
      p.health = Math.min(p.maxHealth, p.health + 50);
      this.ev({ t: 'heal', n: 50 });
    }
    spread(wd) {
      const p = this.player;
      if (p.zoom && wd.zoomSpread !== undefined) return wd.zoomSpread;
      let s = wd.spread || 0;
      if (this.has('marksman') && wd.slot >= 3 && wd.slot <= 5) s *= 0.67;
      if (p.speed > 1) s *= 1 + Math.min(1, p.speed / 5) * 0.8;
      if (!p.onGround && !p.swim) s *= 2.4;
      if (p.crouched) s *= 0.7;
      return s + p.bloom * 0.05;
    }
    tryFire() {
      const p = this.player, w = p.weapon, wd = W[w];
      if (p.fireCd > 0 || p.switchT > 0) return;
      if (p.reloadT > 0) {
        if (wd.shellReload && p.clip[w] > 0) { p.reloadT = 0; this.ev({ t: 'reloadEnd', w }); } else return;
      }
      if (p.swim && !wd.underwater && wd.kind !== 'melee') { if (p.underwater) { this.ev({ t: 'dry', w }); p.fireCd = 0.4; return; } }
      if (wd.kind === 'melee') { this.melee(wd); return; }
      if (wd.kind === 'throw') { this.throwKnife(); return; }
      if (wd.kind === 'grenade') { this.throwGrenade(); return; }
      if ((p.clip[w] || 0) <= 0) {
        if ((p.res[w] || 0) > 0) this.startReload();
        else { this.ev({ t: 'dry', w }); p.fireCd = 0.35; if (!wd.auto) this.autoSwitch(); }
        return;
      }
      p.clip[w]--;
      p.fireCd = wd.rate;
      this.stats.shots++;
      const eye = this.eyePos();
      if (wd.kind === 'hitscan') {
        const aim = this.aimDir();
        const s = this.spread(wd);
        const n = wd.pellets || 1;
        let anyHit = false;
        for (let i = 0; i < n; i++) {
          const dir = this.perturb(aim, s);
          if (this.traceShot(eye, dir, wd, w, null, i === 0)) anyHit = true;
        }
        if (anyHit) this.stats.hits++;
      } else if (wd.kind === 'proj') {
        const aim = this.aimDir();
        const r = X.right(p.yaw);
        const o = [eye[0] + r[0] * 0.12, eye[1] - 0.1, eye[2] + r[2] * 0.12];
        this.spawnProj(wd.proj, o, X.vscale(this.perturb(aim, p.zoom ? 0 : 0.004), wd.speed), w, 'player');
      }
      p.kick += wd.recoil * (p.crouched ? 0.7 : 1);
      p.kickYaw += (this.rng() - 0.5) * wd.recoil * 0.4;
      p.bloom = Math.min(1, p.bloom + (wd.auto ? 0.12 : 0.25));
      this.noise(eye, wd.noise, 'shot', 'player');
      this.ev({ t: 'fire', w, who: 'player' });
      if (w === 'sniper' || w === 'crossbow' || w === 'harpoon' || w === 'bazooka') { if (p.clip[w] <= 0 && p.res[w] > 0) this.startReload(); }
      if (wd.clip === 1) p.zoom = p.zoom && p.res[w] > 0 ? p.zoom : 0;
    }
    autoSwitch() {
      const p = this.player;
      const order = ['m60', 'm16', 'kalash', 'shotgun', 'magnum', 'silenced', 'beretta', 'sniper', 'crossbow', 'knife', 'fists'];
      for (const w of order) {
        if (!p.weapons[w] || w === p.weapon) continue;
        const wd = W[w];
        if (wd.kind === 'melee' || (wd.clip ? (p.clip[w] + p.res[w]) > 0 : p.res[w] > 0)) { this.selectWeapon(w); return; }
      }
    }
    perturb(d, s) {
      if (!s) return d.slice();
      const a = this.rng() * X.TAU, r = Math.sqrt(this.rng()) * s;
      const up = Math.abs(d[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
      const u = X.vnorm(X.vcross(d, up)), v = X.vcross(u, d);
      return X.vnorm([d[0] + (u[0] * Math.cos(a) + v[0] * Math.sin(a)) * r, d[1] + (u[1] * Math.cos(a) + v[1] * Math.sin(a)) * r, d[2] + (u[2] * Math.cos(a) + v[2] * Math.sin(a)) * r]);
    }
    hitboxes(c) {
      const k = c.def.look.tall || 1;
      const crouch = c.crouch > 0.5;
      const hy = (crouch ? 1.06 : 1.62) * k;
      const f = X.fwd(c.yaw, 0);
      return {
        head: [c.pos[0] + f[0] * 0.03, c.pos[1] + hy, c.pos[2] + f[2] * 0.03],
        a: [c.pos[0], c.pos[1] + 0.3, c.pos[2]],
        b: [c.pos[0], c.pos[1] + (crouch ? 0.86 : 1.36) * k, c.pos[2]],
        r: 0.27 * (c.def.look.big || 1), hr: 0.15
      };
    }
    charRay(o, d, maxT, ignore) {
      let best = null, bt = maxT;
      for (const c of this.chars) {
        if ((c.state !== 'alive' && c.state !== 'hostage') || c === ignore) continue;
        const dx = c.pos[0] - o[0], dz = c.pos[2] - o[2];
        const along = dx * d[0] + dz * d[2];
        if (along < -1 || along > bt + 1) continue;
        const hb = this.hitboxes(c);
        const th = X.raySphere(o, d, hb.head, hb.hr);
        if (th >= 0 && th < bt) { bt = th; best = { c, t: th, part: 'head' }; }
        const tb = X.rayCapsule(o, d, hb.a, hb.b, hb.r);
        if (tb >= 0 && tb < bt) {
          const py = o[1] + d[1] * tb;
          bt = tb; best = { c, t: tb, part: py < c.pos[1] + 0.8 ? 'legs' : 'body' };
        }
      }
      for (const v of this.vehicles) {
        if (v.dead || v === ignore) continue;
        const t = X.raySphere(o, d, v.pos, v.r || 2.2);
        if (t >= 0 && t < bt) { bt = t; best = { v, t, part: 'body' }; }
      }
      return best;
    }
    traceShot(o, d, wd, w, shooter, tracer) {
      let maxT = w === 'sniper' ? 400 : 180;
      let origin = o;
      let hit = this.world.ray(origin, d, maxT, F.SHOT);
      let travelled = 0;
      let guard = 0;
      while (hit && hit.block && (hit.block.flags & F.GLASS) && guard++ < 4) {
        this.breakGlass(hit.block, hit.p);
        travelled += hit.t;
        origin = X.vma(hit.p, 0.02, d);
        hit = this.world.ray(origin, d, maxT - travelled, F.SHOT);
      }
      const worldT = hit ? travelled + hit.t : maxT;
      const ch = this.charRay(o, d, worldT, shooter);
      const byPlayer = !shooter;
      let end;
      if (ch && ch.c) {
        end = X.vma(o, ch.t, d);
        this.damageChar(ch.c, wd.dmg, ch.part, d, byPlayer ? 'player' : shooter, w, end);
      } else if (ch && ch.v) {
        end = X.vma(o, ch.t, d);
        this.damageVehicle(ch.v, wd.dmg, byPlayer);
        this.ev({ t: 'impact', p: end, n: X.vscale(d, -1), mat: 'metal' });
      } else if (hit) {
        end = hit.p;
        const b = hit.block;
        if (b && b.barrel) this.damageBarrel(b.barrel, wd.dmg);
        if (b && b.cam) this.killCam(b.cam, byPlayer);
        this.ev({ t: 'impact', p: hit.p, n: hit.n, mat: b ? (b.mat || 'concrete') : this.terrainMat(hit.p) });
      } else end = X.vma(o, maxT, d);
      if (tracer !== false) this.ev({ t: 'shot', w, from: o, to: end, who: byPlayer ? 'player' : shooter.id });
      return !!(ch && (ch.c || ch.v));
    }
    terrainMat(p) {
      const tv = this.world.visuals.find(v => v.t === 'terrain' && v.ref.heightAt(p[0], p[2]) !== null);
      return tv ? (tv.low && p[1] < tv.lowY ? tv.low : tv.mat) : 'dirt';
    }
    breakGlass(b, p) {
      if (b.dead) return;
      b.dead = true;
      this.flags['glass:' + b.index] = 1;
      this.ev({ t: 'glass', p: p || [b.x, b.y, b.z], block: b.index });
      this.noise([b.x, b.y, b.z], 16, 'glass', 'player');
    }

    melee(wd) {
      const p = this.player;
      p.fireCd = wd.rate;
      p.meleeT = this.time;
      const eye = this.eyePos(), f = X.fwd(p.yaw, p.pitch);
      let best = null, bd = wd.range;
      for (const c of this.chars) {
        if (c.state !== 'alive' || c.team === 'ally') continue;
        const hb = this.hitboxes(c);
        const mid = X.vlerp(hb.a, hb.head, 0.6);
        const d = X.vsub(mid, eye), dist = X.vlen(d);
        if (dist > bd + 0.3) continue;
        const dot = X.vdot(X.vscale(d, 1 / dist), f);
        if (dot < 0.72) continue;
        best = c; bd = dist;
      }
      const w = p.weapon;
      if (best) {
        const dir = X.vnorm(X.vsub(best.pos, p.pos));
        this.damageChar(best, wd.dmg, 'body', dir, 'player', w, [best.pos[0], best.pos[1] + 1.5, best.pos[2]]);
        this.ev({ t: 'melee', w, hit: true, obj: p.object });
        this.ev({ t: 'word', text: X.pick(this.rng, w === 'object' ? X.WORDS.object : X.WORDS.punch), p: [best.pos[0], best.pos[1] + 1.8, best.pos[2]], style: 'hit' });
        this.noise(p.pos, wd.noise, 'melee', 'player');
        if (w === 'object') {
          p.objectHits--;
          if (p.objectHits <= 0) {
            const ob = p.objectRef;
            if (ob) { ob.broken = true; ob.taken = true; }
            this.ev({ t: 'objBreak', kind: p.object, p: [best.pos[0], best.pos[1] + 1.4, best.pos[2]] });
            p.object = null; p.objectRef = null; p.weapons.object = false;
            p.weapon = p.prevWeapon && p.weapons[p.prevWeapon] && p.prevWeapon !== 'object' ? p.prevWeapon : 'fists';
            p.switchT = 0.35;
          }
        }
      } else {
        const hit = this.world.ray(eye, f, wd.range, F.SHOT);
        if (hit && hit.block && (hit.block.flags & F.GLASS)) this.breakGlass(hit.block, hit.p);
        if (hit && hit.block && hit.block.barrel) this.damageBarrel(hit.block.barrel, 5);
        this.ev({ t: 'melee', w, hit: !!hit, obj: p.object, wall: !!hit });
      }
    }
    throwKnife() {
      const p = this.player;
      if ((p.res.knife || 0) <= 0) { this.autoSwitch(); return; }
      p.res.knife--;
      p.fireCd = W.knife.rate * (this.has('knives') ? 0.75 : 1);
      p.throwT = this.time;
      const eye = this.eyePos(), aim = this.aimDir(), r = X.right(p.yaw);
      const o = [eye[0] + r[0] * 0.15, eye[1] - 0.05, eye[2] + r[2] * 0.15];
      const sp = W.knife.speed * (this.has('knives') ? 1.3 : 1);
      this.spawnProj('knife', o, X.vscale(aim, sp), 'knife', 'player');
      this.noise(p.pos, 1.5, 'throw', 'player');
      this.ev({ t: 'throw', kind: 'knife' });
      this.stats.shots++;
      if (p.res.knife <= 0) setTimeoutLike(this, 0.5, () => { if (this.player.weapon === 'knife' && this.player.res.knife <= 0) this.autoSwitch(); });
    }
    throwGrenade() {
      const p = this.player;
      if ((p.res.grenade || 0) <= 0) return;
      p.res.grenade--;
      p.fireCd = W.grenade.rate;
      p.throwT = this.time;
      const eye = this.eyePos();
      const aim = X.fwd(p.yaw, p.pitch + 0.18);
      const g = this.spawnProj('grenade', X.vma(eye, 0.3, aim), X.vadd(X.vscale(aim, W.grenade.speed), [p.vel[0] * 0.5, 0, p.vel[2] * 0.5]), 'grenade', 'player');
      g.fuse = W.grenade.fuse;
      this.ev({ t: 'throw', kind: 'grenade', id: g.id });
      if (p.res.grenade <= 0 && p.weapon === 'grenade') setTimeoutLike(this, 0.6, () => this.autoSwitch());
    }
    spawnProj(kind, pos, vel, w, owner) {
      const pr = { id: 'pr' + (this.projN = (this.projN || 0) + 1), kind, pos: pos.slice(), vel: vel.slice(), w, owner, t: 0, fuse: 0, rest: false, yaw: 0 };
      this.projectiles.push(pr);
      return pr;
    }
    updateProjectiles(dt) {
      const list = this.projectiles;
      for (let i = list.length - 1; i >= 0; i--) {
        const pr = list[i];
        pr.t += dt;
        const wd = W[pr.w] || {};
        if (pr.kind === 'grenade') {
          pr.fuse -= dt;
          if (pr.fuse <= 0) { list.splice(i, 1); this.explode(pr.pos, wd.radius || 6, wd.dmg || 200, pr.owner, 'grenade', pr.id); continue; }
          if (pr.rest) continue;
          pr.vel[1] -= X.GRAVITY * dt;
          const d = X.vscale(pr.vel, dt), l = X.vlen(d);
          if (l < 1e-6) continue;
          const dir = X.vscale(d, 1 / l);
          const hit = this.world.ray(pr.pos, dir, l + 0.06, F.SOLID | F.SHOT);
          if (hit) {
            if (hit.block && (hit.block.flags & F.GLASS)) { this.breakGlass(hit.block, hit.p); pr.pos = X.vadd(pr.pos, d); continue; }
            pr.pos = X.vma(hit.p, 0.05, hit.n);
            const vn = X.vdot(pr.vel, hit.n);
            pr.vel = X.vscale(X.vsub(pr.vel, X.vscale(hit.n, 2 * vn)), 0.38);
            if (Math.abs(vn) > 2) this.ev({ t: 'bounce', p: pr.pos.slice() });
            if (X.vlen(pr.vel) < 0.8 && hit.n[1] > 0.6) { pr.rest = true; pr.vel = [0, 0, 0]; }
          } else pr.pos = X.vadd(pr.pos, d);
          continue;
        }
        pr.vel[1] -= (wd.gravity || 0) * dt;
        if (pr.kind === 'rocket' && pr.t > 6) { list.splice(i, 1); continue; }
        const d = X.vscale(pr.vel, dt), l = X.vlen(d);
        const dir = X.vscale(d, 1 / Math.max(l, 1e-9));
        let hit = this.world.ray(pr.pos, dir, l, F.SHOT);
        while (hit && hit.block && (hit.block.flags & F.GLASS)) { this.breakGlass(hit.block, hit.p); hit = this.world.ray(pr.pos, dir, l, F.SHOT); }
        const shooter = pr.owner === 'player' ? null : this.byId[pr.owner];
        if (pr.owner !== 'player' && this.player.alive) {
          const pl = this.player;
          const tp = X.rayCapsule(pr.pos, dir, [pl.pos[0], pl.pos[1] + 0.3, pl.pos[2]], [pl.pos[0], pl.pos[1] + pl.height - 0.2, pl.pos[2]], 0.4);
          if (tp >= 0 && tp <= (hit ? hit.t : l)) {
            list.splice(i, 1);
            const p = X.vma(pr.pos, tp, dir);
            if (pr.kind === 'rocket') this.explode(p, wd.radius, wd.dmg, pr.owner, 'rocket');
            else this.hurtPlayer(wd.dmg * this.diff.dmg * 0.5, dir, 'shot');
            continue;
          }
        }
        const ch = this.charRay(pr.pos, dir, hit ? hit.t : l, shooter);
        if (ch) {
          list.splice(i, 1);
          const p = X.vma(pr.pos, ch.t, dir);
          if (pr.kind === 'rocket') { this.explode(p, wd.radius, wd.dmg, pr.owner, 'rocket'); continue; }
          if (ch.c) {
            this.damageChar(ch.c, wd.dmg, ch.part, dir, pr.owner === 'player' ? 'player' : shooter, pr.w, p);
            if (pr.kind === 'knife' && pr.owner === 'player') this.dropItem({ kind: 'knives', n: 1 }, [ch.c.pos[0] + 0.3, ch.c.pos[1] + 0.1, ch.c.pos[2]]);
            this.ev({ t: 'word', text: 'THUNK', p, style: 'small' });
          } else if (ch.v) this.damageVehicle(ch.v, wd.dmg, pr.owner === 'player');
          continue;
        }
        if (hit) {
          list.splice(i, 1);
          if (pr.kind === 'rocket') { this.explode(X.vma(hit.p, 0.2, hit.n), wd.radius, wd.dmg, pr.owner, 'rocket'); continue; }
          if (hit.block && hit.block.barrel) this.damageBarrel(hit.block.barrel, wd.dmg);
          if (hit.block && hit.block.cam) this.killCam(hit.block.cam, pr.owner === 'player');
          this.ev({ t: 'impact', p: hit.p, n: hit.n, mat: hit.block ? hit.block.mat : 'dirt', stick: pr.kind });
          if (pr.owner === 'player' && (pr.kind === 'knife' || pr.kind === 'bolt')) this.dropItem(Object.assign(pr.kind === 'knife' ? { kind: 'knives', n: 1, stuck: true, dir } : { kind: 'ammo', w: 'crossbow', n: 1, stuck: true, dir }, hit.block && hit.block.grp ? { grp: hit.block.grp.id } : {}), X.vma(hit.p, 0.05, hit.n));
          this.noise(hit.p, 5, 'impact', pr.owner);
          continue;
        }
        pr.pos = X.vadd(pr.pos, d);
        if (this.world.waterAt(pr.pos[0], pr.pos[2]) !== null && pr.pos[1] < this.world.waterAt(pr.pos[0], pr.pos[2]) && pr.kind !== 'harpoon') { pr.vel = X.vscale(pr.vel, Math.exp(-3 * dt)); }
        if (pr.pos[1] < -60) list.splice(i, 1);
      }
    }
    explode(p, radius, dmg, owner, kind, projId) {
      this.ev({ t: 'explode', p: p.slice(), r: radius, kind, proj: projId });
      this.ev({ t: 'word', text: X.pick(this.rng, X.WORDS.explode), p: [p[0], p[1] + 1.2, p[2]], style: 'explode' });
      this.noise(p, 70, 'explosion', owner);
      const byPlayer = owner === 'player';
      for (const c of this.chars) {
        if (c.state !== 'alive' && c.state !== 'hostage') continue;
        const hb = this.hitboxes(c);
        const mid = X.vlerp(hb.a, hb.b, 0.5);
        const d = X.vdist(mid, p);
        if (d > radius) continue;
        if (!this.world.visible(p, mid)) continue;
        const k = 1 - d / radius;
        this.damageChar(c, dmg * (0.25 + 0.75 * k), 'body', X.vnorm(X.vsub(mid, p)), byPlayer ? 'player' : this.byId[owner] || null, 'explode', mid);
      }
      for (const v of this.vehicles) if (!v.dead && X.vdist(v.pos, p) < radius + (v.r || 2)) this.damageVehicle(v, dmg, byPlayer);
      const pl = this.player;
      if (pl.alive) {
        const mid = [pl.pos[0], pl.pos[1] + 1, pl.pos[2]];
        const d = X.vdist(mid, p);
        if (d < radius && this.world.visible(p, mid)) this.hurtPlayer(dmg * 0.55 * (1 - d / radius), X.vnorm(X.vsub(mid, p)), 'explode');
      }
      for (const b of this.barrels) if (!b.dead && X.vdist(b.pos, p) < radius * 0.8) setTimeoutLike(this, 0.15, () => this.damageBarrel(b, 999));
      this.world.forBlocks(p[0] - radius, p[2] - radius, p[0] + radius, p[2] + radius, b => {
        if ((b.flags & F.GLASS) && !b.dead && Math.hypot(b.x - p[0], b.y - p[1], b.z - p[2]) < radius) this.pendingGlass = (this.pendingGlass || []).concat([b]);
      });
      if (this.pendingGlass) { for (const b of this.pendingGlass) this.breakGlass(b, [b.x, b.y, b.z]); this.pendingGlass = null; }
      for (const c of this.secCams) if (!c.dead && X.vdist(c.pos, p) < radius) this.killCam(c, byPlayer);
    }
    damageBarrel(b, dmg) {
      if (b.dead) return;
      b.hp -= dmg;
      if (b.hp > 0) return;
      b.dead = true;
      b.block.dead = true;
      b.vis.hidden = true;
      this.flags['barrel:' + b.id] = 1;
      this.explode(b.pos, b.radius, b.dmg, 'player', 'barrel');
    }
    killCam(c, byPlayer) {
      if (c.dead) return;
      c.dead = true;
      c.block.dead = true;
      this.flags['cam:' + c.id] = 1;
      this.ev({ t: 'camDead', id: c.id, p: c.pos.slice() });
      this.ev({ t: 'impact', p: c.pos.slice(), n: [0, 1, 0], mat: 'metal' });
    }
    damageVehicle(v, dmg, byPlayer) {
      if (v.dead) return;
      v.hp -= dmg;
      v.hitT = this.time;
      if (v.hp <= 0) {
        v.dead = true;
        this.ev({ t: 'explode', p: v.pos.slice(), r: 8, kind: 'vehicle' });
        this.ev({ t: 'word', text: 'KA-BOOM!', p: v.pos.slice(), style: 'explode' });
        this.stats.kills++;
        this.script.fire('dead:' + v.id);
      }
    }

    damageChar(c, dmg, part, dir, by, w, at) {
      if ((c.state !== 'alive' && c.state !== 'hostage') || c.invuln) return;
      const wd = W[w] || {};
      const byPlayer = by === 'player';
      if (byPlayer && c.team === 'ally') return;
      if (by && by !== 'player' && by.team && !X.hostile(by.team, c.team) && c.team !== 'neutral') return;
      c.hitT = this.time; c.hitDir = dir ? dir.slice() : [0, 0, 1];
      if (wd.ko) {
        const aware = c.ai && c.ai.alert >= 2 && (c.ai.stunT || 0) <= 0;
        const f = X.fwd(c.yaw, 0);
        const behind = dir && (f[0] * dir[0] + f[2] * dir[2]) > 0.2;
        if (c.boss) { c.health -= dmg * 0.25; if (c.ai) X.AI.onHurt(this, c, byPlayer ? this.player.pos : null); if (c.health <= 0) this.killChar(c, { dir, by, w }); return; }
        if (wd.koOneHit || !aware || behind || c.state === 'hostage') { this.knockOut(c, byPlayer); return; }
        c.koDmg += dmg;
        if (c.koDmg >= 58) { this.knockOut(c, byPlayer); return; }
        if (c.ai) { c.ai.stunT = 0.7; X.AI.onHurt(this, c, byPlayer ? this.player.pos : null); }
        return;
      }
      let m = part === 'head' ? (wd.headMul || 3) : part === 'legs' ? 0.75 : 1;
      if (c.boss && part === 'head') m = Math.min(m, 1.6);
      let d = dmg * m;
      if (by && by !== 'player' && !c.boss) d *= 1.4;
      if (c.armor > 0 && part !== 'head' && w !== 'explode') { const a = Math.min(c.armor, d * 0.5); c.armor -= a; d -= a; }
      c.health -= d;
      if (byPlayer) this.stats.hitsOn = (this.stats.hitsOn || 0) + 1;
      this.ev({ t: 'blood', p: at || [c.pos[0], c.pos[1] + 1.2, c.pos[2]], dir: c.hitDir, head: part === 'head', id: c.id });
      if (c.health <= 0) {
        if (c.state === 'hostage') { this.player.hostage = null; c.state = 'alive'; }
        this.killChar(c, { head: part === 'head' && w !== 'explode', dir, by, w });
      } else {
        if (this.rng() < 0.45) this.ev({ t: 'word', text: X.pick(this.rng, X.WORDS.pain), p: [c.pos[0], c.pos[1] + 2, c.pos[2]], style: 'pain' });
        if (c.ai) X.AI.onHurt(this, c, byPlayer ? this.player.pos : (by && by.pos) || null);
      }
    }
    killChar(c, o) {
      o = o || {};
      const byPlayer = o.by === 'player';
      c.state = 'dead';
      c.deathT = this.time;
      c.deathKind = o.w === 'explode' ? 'explode' : o.head ? 'head' : (o.dir && (X.fwd(c.yaw, 0)[0] * o.dir[0] + X.fwd(c.yaw, 0)[2] * o.dir[2]) > 0 ? 'front' : 'back');
      c.deathDir = o.dir ? o.dir.slice() : [0, 0, 1];
      c.vel = [0, 0, 0];
      if (c.deathKind === 'explode') c.vel = [c.deathDir[0] * 5, 4, c.deathDir[2] * 5];
      if (byPlayer) {
        this.stats.kills++;
        if (o.head) this.stats.headshots++;
      }
      this.dropWeapon(c);
      this.ev({ t: 'death', id: c.id, head: !!o.head, kind: c.deathKind, byPlayer, w: o.w });
      if (o.head && byPlayer) this.ev({ t: 'word', text: X.pick(this.rng, ['AARGH', 'ARRRR', 'ARRRRr']), p: [c.pos[0], c.pos[1] + 2.1, c.pos[2]], style: 'scream' });
      else if (this.rng() < 0.6) this.ev({ t: 'word', text: X.pick(this.rng, X.WORDS.pain), p: [c.pos[0], c.pos[1] + 1.9, c.pos[2]], style: 'pain' });
      this.noise(c.pos, 6, 'body', c.id);
      if (byPlayer && c.noKill) {
        const why = c.team === 'neutral' ? 'Вы убили невиновного человека.' : 'Вы убили агента ФБР. Тринадцатый не убийца.';
        this.fail(why);
      }
      this.neutralized(c);
    }
    knockOut(c, byPlayer) {
      if (c.state === 'hostage') { this.player.hostage = null; }
      c.state = 'ko';
      c.deathT = this.time;
      c.deathKind = 'ko';
      c.vel = [0, 0, 0];
      if (byPlayer) this.stats.ko++;
      this.dropWeapon(c);
      this.ev({ t: 'ko', id: c.id });
      this.noise(c.pos, 4, 'body', c.id);
      this.neutralized(c);
    }
    neutralized(c) {
      if (c.ai) c.ai.dead = true;
      this.script.fire('dead:' + c.id);
      if (c.group) {
        const left = this.chars.some(o => o.group === c.group && (o.state === 'alive' || o.state === 'hidden' || o.state === 'hostage'));
        if (!left) this.script.fire('cleared:' + c.group);
      }
      this.script.fire('kill', true);
    }
    dropWeapon(c) {
      if (!c.weapon || c.spawn.drop === false || c.team === 'ally') return;
      const wd = W[c.weapon];
      if (!wd) return;
      const n = c.spawn.dropAmmo || (wd.clip ? Math.max(4, Math.round(wd.clip * (0.4 + this.rng() * 0.5))) : 2);
      const grp = c.grp ? { grp: c.grp } : {};
      const spread = c.grp ? 0.3 : 1;
      this.dropItem(Object.assign({ kind: 'weapon', w: c.weapon, n }, grp), [c.pos[0] + (this.rng() - 0.5) * 0.6 * spread, c.pos[1] + 0.1, c.pos[2] + (this.rng() - 0.5) * 0.6 * spread]);
      if (c.spawn.loot) for (const l of c.spawn.loot) this.dropItem(Object.assign({}, l, grp), [c.pos[0] + (this.rng() - 0.5) * spread, c.pos[1] + 0.1, c.pos[2] + (this.rng() - 0.5) * spread]);
    }
    dropItem(o, pos) {
      const it = Object.assign({ id: 'drop' + (this.dropN = (this.dropN || 0) + 1), pos: pos.slice(), taken: false, dropped: true }, o);
      this.items.push(it);
      this.dropped.push(it);
      return it;
    }

    hurtPlayer(dmg, dir, kind) {
      const p = this.player;
      if (!p.alive || this.god) return;
      let d = dmg;
      if (p.armor > 0 && kind !== 'fall' && kind !== 'drown') { const a = Math.min(p.armor, d * 0.6); p.armor -= a; d -= a; }
      p.health -= d;
      p.hurtT = this.time; p.lastHurt = this.time;
      this.ev({ t: 'hurt', dmg: d, dir: dir || null, kind });
      if (p.health <= 0) {
        p.health = 0; p.alive = false;
        if (p.hostage) { p.hostage.state = 'alive'; p.hostage = null; }
        this.stats.deaths++;
        this.state = 'dead';
        this.ev({ t: 'playerDead', kind });
      }
    }

    noise(p, radius, kind, src) {
      if (!X.AI || radius <= 0) return;
      for (const c of this.chars) {
        if (c.state !== 'alive' || c.id === src) continue;
        const d = X.vdist(c.pos, p);
        if (d > radius) continue;
        X.AI.hear(this, c, p, kind, d / radius, src);
      }
    }

    updatePickups() {
      const p = this.player;
      for (const it of this.items) {
        if (it.taken || it.hidden) continue;
        const dx = it.pos[0] - p.pos[0], dz = it.pos[2] - p.pos[2], dy = it.pos[1] - p.pos[1];
        if (dx * dx + dz * dz > 1.0 || dy < -0.6 || dy > 1.6) continue;
        if (this.pickup(it)) {
          it.taken = true;
          if (!it.dropped) this.flags['item:' + it.id] = 1;
          this.script.fire('pick:' + it.id);
        }
      }
    }
    pickup(it) {
      const p = this.player;
      const say = (name, extra) => this.ev({ t: 'pickup', kind: it.kind, name, w: it.w, extra });
      switch (it.kind) {
        case 'medkit':
          if (p.medkits >= X.ITEMS.medkit.max) {
            if (p.health < p.maxHealth) { p.health = Math.min(p.maxHealth, p.health + 50); say('Аптечка (+50)'); return true; }
            return false;
          }
          p.medkits++; say('Аптечка'); return true;
        case 'food':
          if (p.health >= p.maxHealth) return false;
          p.health = Math.min(p.maxHealth, p.health + (it.n || 15)); say(it.name || 'Перекус'); return true;
        case 'vest':
          if (p.armor >= 100) return false;
          p.armor = Math.min(100, p.armor + (it.n || 50)); say('Бронежилет'); return true;
        case 'helmet':
          if (p.armor >= 100) return false;
          p.armor = Math.min(100, p.armor + 25); say('Каска'); return true;
        case 'lockpick': p.gadgets.lockpick = true; say('Отмычка'); return true;
        case 'hook': p.gadgets.hook = true; say('Кошка с тросом'); return true;
        case 'gadget': p.gadgets[it.name] = true; say(it.label || it.name); return true;
        case 'key':
          if (!p.keys.includes(it.key)) p.keys.push(it.key);
          say(it.label || 'Ключ'); return true;
        case 'doc':
          p.docs.push(it.id);
          this.stats.secrets++;
          this.ev({ t: 'doc', id: it.id, title: it.title || 'Документ', text: it.text || '' });
          return true;
        case 'knives': {
          const mx = this.has('knives') ? 15 : W.knife.max;
          if ((p.res.knife || 0) >= mx) return false;
          p.weapons.knife = true;
          p.res.knife = Math.min(mx, (p.res.knife || 0) + (it.n || 1));
          say('Ножи'); return true;
        }
        case 'grenades': {
          if ((p.res.grenade || 0) >= W.grenade.max) return false;
          p.weapons.grenade = true;
          p.res.grenade = Math.min(W.grenade.max, (p.res.grenade || 0) + (it.n || 1));
          say('Гранаты'); return true;
        }
        case 'ammo': {
          const wd = W[it.w];
          if (!wd) return false;
          if ((p.res[it.w] || 0) >= wd.max) return false;
          p.res[it.w] = Math.min(wd.max, (p.res[it.w] || 0) + (it.n || wd.clip || 1));
          say('Патроны: ' + wd.name); return true;
        }
        case 'weapon': {
          const w = it.w, wd = W[w];
          if (!wd) return false;
          const had = !!p.weapons[w];
          if (wd.kind === 'throw' || wd.kind === 'grenade') {
            const key = w === 'knife' ? 'knife' : 'grenade';
            if (had && (p.res[key] || 0) >= wd.max) return false;
            p.weapons[w] = true; p.res[key] = Math.min(wd.max, (p.res[key] || 0) + (it.n || 1));
          } else {
            this.ensureAmmo(w);
            if (had && p.res[w] >= wd.max) return false;
            p.weapons[w] = true;
            if (!had) { p.clip[w] = Math.min(wd.clip, it.n || wd.clip); p.res[w] = Math.min(wd.max, Math.max(0, (it.n || wd.clip) - p.clip[w]) + (p.res[w] || 0)); }
            else p.res[w] = Math.min(wd.max, p.res[w] + (it.n || wd.clip));
          }
          say(wd.name, had ? 'ammo' : 'new');
          this.script.fire('got:' + w, true);
          if (!had && !p.hostage && !p.body && (W[p.weapon].slot < wd.slot || p.weapon === 'fists') && p.weapon !== 'object' && w !== 'grenade') this.selectWeapon(w);
          return true;
        }
      }
      return false;
    }

    updateTriggers() {
      const p = this.player, c = [p.pos[0], p.pos[1] + 0.9, p.pos[2]];
      for (const t of this.triggers) {
        if (t.off) continue;
        if (c[0] < t.min[0] || c[0] > t.max[0] || c[1] < t.min[1] || c[1] > t.max[1] || c[2] < t.min[2] || c[2] > t.max[2]) { t.inside = false; continue; }
        if (t.inside && t.repeat) continue;
        t.inside = true;
        this.script.fire('zone:' + t.id, !!t.repeat);
      }
    }
    later(name, sec) {
      this.timers = this.timers.filter(t => t.name !== name);
      this.timers.push({ name, t: this.time + sec });
    }
    cancel(name) { this.timers = this.timers.filter(t => t.name !== name); }
    updateTimers() {
      if (!this.timers.length && !(this.jobs && this.jobs.length)) return;
      const due = this.timers.filter(t => t.t <= this.time);
      if (due.length) {
        this.timers = this.timers.filter(t => t.t > this.time);
        for (const t of due) this.script.fire('timer:' + t.name, true);
      }
      if (this.jobs && this.jobs.length) {
        const jd = this.jobs.filter(j => j.t <= this.time);
        this.jobs = this.jobs.filter(j => j.t > this.time);
        for (const j of jd) j.fn();
      }
    }

    updateCams(dt) {
      const p = this.player;
      for (const c of this.secCams) {
        if (c.dead || c.off || this.flags.camsOff) continue;
        c.t += dt;
        c.cur = c.yaw + Math.sin(c.t * 0.5) * c.sweep;
        if (!p.alive) continue;
        const target = [p.pos[0], p.pos[1] + 1.2, p.pos[2]];
        const d = X.vsub(target, c.pos), dist = X.vlen(d);
        let seen = false;
        if (dist < c.range) {
          const yawTo = X.yawTo(c.pos, target);
          if (Math.abs(X.angDiff(c.cur, yawTo)) < 0.42 && X.pitchTo(c.pos, target) < 0.2 && this.world.visible(c.pos, target, c.block)) seen = true;
        }
        if (seen) {
          c.sus += dt * (1.3 - dist / c.range);
          if (c.sus > 0.25 && !c.warned) { c.warned = true; this.ev({ t: 'camSee', id: c.id }); }
          if (c.sus >= 1) {
            c.sus = 0;
            c.warned = false;
            this.ev({ t: 'panel', kind: 'cam', cam: c.id, pos: c.pos.slice(), look: target, dur: 2.5, text: 'КАМЕРА!' });
            this.raiseAlarm(p.pos, 'camera');
          }
        } else c.sus = Math.max(0, c.sus - dt * 0.4);
      }
    }
    updateSearchlights(dt) {
      const p = this.player;
      for (const s of this.searchlights) {
        const off = this.flags.powerOff || s.off;
        s.light.on = !off;
        if (off) continue;
        s.t += dt;
        s.cur = s.yaw + Math.sin(s.t * s.speed) * s.sweep;
        const dir = X.fwd(s.cur, s.pitch + Math.sin(s.t * s.speed * 1.7) * 0.06);
        const hit = this.world.ray(s.pos, dir, s.range, F.SIGHT);
        let ht = hit ? hit.t : s.range;
        const wy = this.world.waterAt(s.pos[0], s.pos[2]);
        if (wy !== null && dir[1] < -1e-3 && s.pos[1] > wy) ht = Math.min(ht, (s.pos[1] - wy) / -dir[1]);
        s.spot = X.vma(s.pos, ht, dir);
        s.light.p = [s.spot[0], s.spot[1] + 2.2, s.spot[2]];
        if (!p.alive || (p.swim && p.underwater)) continue;
        const dx = p.pos[0] - s.spot[0], dz = p.pos[2] - s.spot[2];
        if (dx * dx + dz * dz > 3.2 * 3.2 || Math.abs(p.pos[1] - s.spot[1]) > 2.5) continue;
        if (!this.world.visible(s.pos, [p.pos[0], p.pos[1] + 1.2, p.pos[2]])) continue;
        if (this.time - s.seeT < 4) continue;
        s.seeT = this.time;
        this.ev({ t: 'panel', kind: 'cam', pos: X.vma(s.pos, 1.2, X.vnorm(X.vsub(s.pos, s.spot))), look: [p.pos[0], p.pos[1] + 1, p.pos[2]], dur: 2.2, text: 'ПРОЖЕКТОР!', tint: 'red', player: true });
        this.ev({ t: 'spotted', id: s.id });
        let n = 0;
        for (const c of this.chars) {
          if (c.state !== 'alive' || c.team !== 'enemy' || !c.ai || X.vdist(c.pos, p.pos) > 45) continue;
          X.AI.alert(this, c, p.pos);
          if (++n >= 4) break;
        }
      }
    }
    raiseAlarm(pos, by) {
      if (this.def.noAlarm) return;
      const first = !this.alarmOn;
      this.alarmOn = true;
      this.alarmPos = pos ? pos.slice() : this.player.pos.slice();
      if (first) {
        this.stats.alarms++;
        this.ev({ t: 'alarm', p: this.alarmPos, by });
        this.ev({ t: 'word', text: 'WEEOO!', p: [this.alarmPos[0], this.alarmPos[1] + 2.5, this.alarmPos[2]], style: 'alert' });
      }
      if (X.AI) for (const c of this.chars) if (c.state === 'alive' && c.team === 'enemy' && c.ai && !c.ai.noAlarmReact) X.AI.alert(this, c, this.alarmPos, false);
      if (first) this.script.fire('alarm');
    }

    objective(id, text, o) {
      let ob = this.objectives.find(q => q.id === id);
      if (ob) return ob;
      ob = Object.assign({ id, text, done: false, failed: false }, o || {});
      this.objectives.push(ob);
      this.ev({ t: 'objective', id, text, state: 'new', optional: !!ob.optional });
      return ob;
    }
    complete(id) {
      const ob = this.objectives.find(q => q.id === id);
      if (!ob || ob.done) return;
      ob.done = true;
      this.ev({ t: 'objective', id, text: ob.text, state: 'done', optional: !!ob.optional });
    }
    failObjective(id) {
      const ob = this.objectives.find(q => q.id === id);
      if (!ob || ob.done || ob.failed) return;
      ob.failed = true;
      this.ev({ t: 'objective', id, text: ob.text, state: 'failed', optional: !!ob.optional });
    }
    say(who, text, dur, o) { this.ev(Object.assign({ t: 'say', id: who, text, dur: dur || Math.max(2.4, text.length * 0.07) }, o || {})); }
    radio(who, text, dur) { this.say(who, text, dur, { radio: true }); }
    caption(text, dur) { this.ev({ t: 'caption', text, dur: dur || 4 }); }
    panel(spec) { this.ev(Object.assign({ t: 'panel' }, spec)); }
    comic(key) { this.ev({ t: 'comic', key }); this.pendingComic = key; }
    music(mode) { this.musicMode = mode; this.ev({ t: 'music', mode }); }
    memory(skill, text) {
      const p = this.player;
      if (skill && !p.skills.includes(skill)) p.skills.push(skill);
      this.ev({ t: 'memory', skill, text });
    }
    give(o) {
      const p = this.player;
      if (o.weapon) { this.ensureAmmo(o.weapon); p.weapons[o.weapon] = true; if (o.clip !== undefined) p.clip[o.weapon] = o.clip; if (o.res !== undefined) p.res[o.weapon] = Math.max(p.res[o.weapon] || 0, o.res); }
      if (o.key && !p.keys.includes(o.key)) p.keys.push(o.key);
      if (o.gadget) p.gadgets[o.gadget] = true;
      if (o.medkits) p.medkits = Math.min(X.ITEMS.medkit.max, p.medkits + o.medkits);
      if (o.select) this.selectWeapon(o.select);
    }
    strip() {
      const p = this.player;
      p.weapons = { fists: true }; p.clip = {}; p.res = {}; p.weapon = 'fists'; p.object = null; p.objectRef = null; p.zoom = 0;
    }
    spawn(group, alertPos) {
      for (const c of this.chars) {
        if (c.group !== group || c.state !== 'hidden') continue;
        c.state = 'alive';
        if (alertPos && X.AI) X.AI.alert(this, c, alertPos, false);
      }
      this.flags['spawn:' + group] = alertPos ? alertPos.slice() : 1;
    }
    alertGroup(group, pos) {
      for (const c of this.chars) if (c.group === group && c.state === 'alive' && X.AI) X.AI.alert(this, c, pos || this.player.pos, false);
    }
    hide(id) { const c = this.char(id); if (c) { c.state = 'hidden'; this.flags['hidden:' + id] = 1; } }
    setFlag(name, v) {
      const was = this.flags[name];
      this.flags[name] = v === undefined ? 1 : v;
      if (!was) this.script.fire('flag:' + name);
    }
    enable(id, on) { const u = this.usables.find(q => q.id === id); if (u) { u.enabled = on !== false; this.flags['use:' + id] = u.enabled ? 1 : 0; } }
    after(sec, fn) { setTimeoutLike(this, sec, fn); }
    checkpoint(name) {
      if (this.state !== 'play') return;
      this.saved = this.serialize();
      this.saved.name = name;
      this.ev({ t: 'checkpoint', name });
    }
    finish() {
      if (this.state !== 'play') return;
      this.state = 'complete';
      this.ev({ t: 'finish' });
    }
    fail(reason) {
      if (this.state !== 'play') return;
      this.state = 'failed';
      this.failReason = reason;
      this.ev({ t: 'fail', reason });
    }
    allObjectivesDone() { return this.objectives.filter(o => !o.optional).every(o => o.done); }

    serialize() {
      const p = this.player;
      return {
        level: this.def.id, time: this.time, stats: Object.assign({}, this.stats), flags: JSON.parse(JSON.stringify(this.flags)),
        objectives: this.objectives.map(o => Object.assign({}, o)), alarmOn: this.alarmOn,
        timers: this.timers.map(t => ({ name: t.name, left: t.t - this.time })),
        player: {
          pos: p.pos.slice(), yaw: p.yaw, pitch: p.pitch, health: p.health, armor: p.armor, weapons: Object.assign({}, p.weapons, { object: false }), clip: Object.assign({}, p.clip), res: Object.assign({}, p.res),
          weapon: p.weapon === 'object' ? (p.prevWeapon || 'fists') : p.weapon, medkits: p.medkits, keys: p.keys.slice(), gadgets: Object.assign({}, p.gadgets), docs: p.docs.slice(), skills: p.skills.slice(), crouched: p.crouched
        },
        chars: this.chars.map(c => ({ id: c.id, state: c.state === 'hostage' ? 'alive' : c.state, pos: c.pos.slice(), yaw: c.yaw, health: c.health, armor: c.armor, deathKind: c.deathKind, weapon: c.weapon, ai: c.ai ? X.AI.save(c) : null })),
        items: this.items.filter(i => !i.dropped).map(i => ({ id: i.id, taken: i.taken, hidden: !!i.hidden })),
        dropped: this.dropped.filter(i => !i.taken).map(i => Object.assign({}, i)),
        objects: this.objects.map(o => ({ id: o.id, pos: o.pos.slice(), taken: o.taken && !(p.objectRef === o), broken: o.broken })),
        doors: this.doors.map(d => ({ id: d.id, locked: d.locked, target: d.target, openSign: d.openSign })),
        usables: this.usables.map(u => ({ id: u.id, enabled: u.enabled })),
        cams: this.secCams.map(c => ({ id: c.id, dead: c.dead, off: c.off })),
        groups: this.groups.map(g => ({ id: g.id, pos: g.pos.slice(), yaw: g.yaw, moving: g.moving, path: g.path ? g.path.map(q => q.slice()) : null, pathT: g.pathT, speed: g.speed, ev: g.ev, loop: !!g.loop, face: !!g.face, turn: g.turn || 0 })),
        grapples: this.grapples.map(g => ({ id: g.id, deployed: g.deployed })),
        vehicles: this.vehicles.map(v => ({ id: v.id, hp: v.hp, dead: v.dead, pos: v.pos.slice(), active: v.active })),
        triggers: this.triggers.map(t => ({ id: t.id, off: !!t.off }))
      };
    }
    restore(s) {
      this.time = s.time;
      this.stats = Object.assign({}, s.stats);
      this.flags = JSON.parse(JSON.stringify(s.flags));
      this.objectives = s.objectives.map(o => Object.assign({}, o));
      this.alarmOn = s.alarmOn;
      this.timers = (s.timers || []).map(t => ({ name: t.name, t: this.time + Math.max(0.5, t.left) }));
      const p = this.player, sp = s.player;
      p.pos = sp.pos.slice(); p.yaw = sp.yaw; p.pitch = sp.pitch; p.health = Math.max(sp.health, 30); p.armor = sp.armor;
      p.weapons = Object.assign({}, sp.weapons); p.clip = Object.assign({}, sp.clip); p.res = Object.assign({}, sp.res);
      p.weapon = p.weapons[sp.weapon] ? sp.weapon : 'fists'; p.medkits = sp.medkits; p.keys = sp.keys.slice(); p.gadgets = Object.assign({}, sp.gadgets);
      p.docs = sp.docs.slice(); p.skills = sp.skills.slice(); p.crouched = !!sp.crouched;
      p.vel = [0, 0, 0]; p.onGround = true;
      for (const cs of s.chars) {
        const c = this.byId[cs.id];
        if (!c) continue;
        c.state = cs.state; c.pos = cs.pos.slice(); c.yaw = cs.yaw; c.health = cs.health; c.armor = cs.armor; c.deathKind = cs.deathKind; c.weapon = cs.weapon;
        if (c.state === 'dead' || c.state === 'ko') { c.deathT = this.time - 10; if (c.ai) c.ai.dead = true; }
        if (c.ai && cs.ai) X.AI.load(c, cs.ai);
      }
      const im = {};
      for (const i of s.items) im[i.id] = i;
      for (const it of this.items) if (im[it.id]) { it.taken = im[it.id].taken; it.hidden = im[it.id].hidden; }
      for (const d of s.dropped || []) { this.items.push(Object.assign({}, d)); this.dropped.push(this.items[this.items.length - 1]); }
      const om = {};
      for (const o of s.objects) om[o.id] = o;
      for (const o of this.objects) if (om[o.id]) { o.pos = om[o.id].pos.slice(); o.taken = om[o.id].taken; o.broken = om[o.id].broken; }
      const dm = {};
      for (const d of s.doors) dm[d.id] = d;
      for (const d of this.doors) if (dm[d.id]) { d.locked = dm[d.id].locked; d.target = dm[d.id].target; d.openSign = dm[d.id].openSign; d.open = d.target; d.angle = d.target * 1.62; this.placeDoor(d); }
      const um = {};
      for (const u of s.usables) um[u.id] = u;
      for (const u of this.usables) if (um[u.id]) u.enabled = um[u.id].enabled;
      for (const c of s.cams) { const cc = this.secCams.find(q => q.id === c.id); if (cc) { cc.dead = c.dead; cc.off = c.off; if (cc.dead) cc.block.dead = true; } }
      for (const g of s.groups || []) {
        const gg = this.groups.find(q => q.id === g.id);
        if (!gg) continue;
        gg.moving = g.moving; gg.path = g.path; gg.pathT = g.pathT; gg.speed = g.speed; gg.ev = g.ev || null; gg.loop = !!g.loop; gg.face = !!g.face; gg.turn = g.turn || 0;
        const o0 = gg.pos.slice(), dyaw = g.yaw - gg.yaw, cy = Math.cos(dyaw), sy = Math.sin(dyaw);
        const move = q => { const rx = q[0] - o0[0], rz = q[2] - o0[2]; return [g.pos[0] + rx * cy + rz * sy, q[1] + g.pos[1] - o0[1], g.pos[2] - rx * sy + rz * cy]; };
        X.placeGroup(gg, g.pos.slice(), g.yaw);
        for (const it of this.items) if (it.grp === gg.id && !it.dropped) it.pos = move(it.pos);
        for (const u of this.usables) if (u.grp === gg.id) u.pos = move(u.pos);
      }
      for (const g of s.grapples || []) { const gg = this.grapples.find(q => q.id === g.id); if (gg) gg.deployed = g.deployed; }
      for (const t of s.triggers || []) { const tt = this.triggers.find(q => q.id === t.id); if (tt) tt.off = t.off; }
      for (const k in this.flags) {
        if (k.startsWith('glass:')) { const b = this.world.blocks[Number(k.slice(6))]; if (b) b.dead = true; }
        if (k.startsWith('barrel:')) { const b = this.barrels.find(q => q.id === k.slice(7)); if (b) { b.dead = true; b.block.dead = true; b.vis.hidden = true; } }
      }
      this.script.fire('restore', true);
      for (const v of s.vehicles || []) { const vv = this.vehicles.find(q => q.id === v.id); if (vv) { vv.hp = v.hp; vv.dead = v.dead; vv.crashed = !!v.dead; vv.pos = v.pos.slice(); vv.active = v.active; } }
      this.saved = s;
    }
  }

  function setTimeoutLike(g, sec, fn) {
    g.jobs = g.jobs || [];
    g.jobs.push({ t: g.time + sec, fn });
  }

  X.pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];
  X.Game = Game;
})(globalThis.XIII = globalThis.XIII || {});
