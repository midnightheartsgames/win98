(function (H) {
  'use strict';

  const STAND_H = 1.8, DUCK_H = 1.1, EYE_STAND = 1.64, EYE_DUCK = 0.98, PR = 0.36;
  const USE_RANGE = 2.3;

  H.SPEAKERS = {
    alyx: ['Аликс', '#ffa860'], barney: ['Барни', '#8fc0ff'], kleiner: ['Кляйнер', '#b8f0a8'], eli: ['Илай', '#ffd87f'],
    mossman: ['Моссман', '#e0a8ff'], breen: ['Брин', '#ff9a8a'], gman: ['G-Man', '#d0d0d0'], grigori: ['Отец Григорий', '#ffcf9f'],
    vort: ['Вортигонт', '#9fe0b0'], rebel: ['Повстанец', '#d8d8a8'], medic: ['Медик', '#d8d8a8'], citizen: ['Гражданин', '#c8c8c8'],
    metrocop: ['Гражданская оборона', '#9fb4d0'], soldier: ['Солдат Альянса', '#7fb8e0'], overwatch: ['Голос Надзора', '#58d4ff'],
    hev: ['H.E.V.', '#ffb000'], odessa: ['Полковник Одесса', '#d8c890'], radio: ['Радио', '#b8b8b8'], lamarr: ['Ламарр', '#c8c8c8']
  };

  class Game {
    constructor(o = {}) {
      this.seed = o.seed || 20001116;
      this.rng = H.rng(this.seed);
      this.skillIndex = o.skill === undefined ? 1 : o.skill;
      this.skill = H.SKILLS[this.skillIndex];
      this.mapId = o.map;
      const def = H.maps[o.map];
      if (!def) throw new Error('hl2: unknown map ' + o.map);
      this.def = def;
      this.world = new H.World(def);
      this.world.buildNav();
      this.time = 0;
      this.nextId = 1;
      this.npcs = [];
      this.props = [];
      this.items = [];
      this.doors = [];
      this.chargers = [];
      this.buttons = [];
      this.hazards = [];
      this.vehicles = [];
      this.surfaces = [];
      this.projectiles = [];
      this.dynLights = [];
      this.events = [];
      this.noises = [];
      this.flags = {};
      this.god = !!o.god;
      this.stats = { kills: 0, caches: 0, cachesTotal: this.world.caches.length, time: 0, found: [] };
      this.fx = new H.Fx(this);
      this.prevIn = {};
      this.pendingMap = null;
      this.player = this.makePlayer(o.carry);
      this.scripts = (def.scripts || []).map((s, i) => ({ id: s.id || 's' + i, def: s, fired: false, running: false, pc: 0, wait: 0, enabled: s.enabled !== false }));
      if (o.save) this.restore(o.save);
      else {
        this.spawnAll();
        const st = o.spot && this.world.spots[o.spot] ? this.world.spots[o.spot] : def.start;
        this.placePlayer(st);
      }
      this.lastBark = {};
    }

    makePlayer(carry) {
      const p = {
        kind: 'player', team: 'player', pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0,
        hp: 100, armor: 0, aux: 100, suit: false, dead: false, deadT: 0, onGround: true, ducked: false, duckAmt: 0, height: STAND_H,
        weapons: {}, ammo: {}, clip: {}, cur: null, prev: null, fireCd: 0, altCd: 0, reloadT: 0, drawT: 0, shellReload: false,
        held: null, flashlight: false, vehicle: null, ladder: null, waterLevel: 0, poison: 0, poisonT: 0, drownDmg: 0, drownT: 0,
        lastHurtT: -9, hurtDir: null, punch: 0, bob: 0, stepT: 0, frozen: false, grabbed: null, zoom: false, superGG: false,
        sprinting: false, fallV: 0, chargeSnd: 0, laser: true, lastLand: 0, blind: 0
      };
      for (const k of Object.keys(H.AMMO)) p.ammo[k] = 0;
      if (carry) {
        Object.assign(p, { hp: carry.hp, armor: carry.armor, aux: carry.aux, suit: carry.suit, weapons: Object.assign({}, carry.weapons), cur: carry.cur, superGG: !!carry.superGG });
        Object.assign(p.ammo, carry.ammo);
        Object.assign(p.clip, carry.clip);
        p.flashlight = false;
      }
      return p;
    }

    carry() {
      const p = this.player;
      return { hp: Math.max(1, Math.round(p.hp)), armor: Math.round(p.armor), aux: p.aux, suit: p.suit, weapons: Object.assign({}, p.weapons), ammo: Object.assign({}, p.ammo), clip: Object.assign({}, p.clip), cur: p.cur, superGG: p.superGG };
    }

    placePlayer(st) {
      const p = this.player;
      p.pos.x = st.x; p.pos.z = st.z;
      p.pos.y = st.y !== undefined && st.y !== null ? st.y : this.world.spawnY(st.x, st.z, null, 0.3);
      p.yaw = st.yaw || 0;
      p.pitch = 0;
      p.vel = { x: 0, y: 0, z: 0 };
    }

    emit(ev) {
      if (this.events.length > 300) this.events.shift();
      this.events.push(ev);
    }

    noise(pos, radius, who) {
      this.noises.push({ pos: H.vcopy(pos), radius, t: this.time, who });
      if (this.noises.length > 40) this.noises.shift();
    }

    say(who, text, dur) {
      this.emit({ type: 'say', who, text, dur: dur || this.sayDur(text) });
      for (const n of this.npcs) if (n.alive && (n.id === who || n.speaker === who)) n.talkT = dur || this.sayDur(text);
    }

    sayDur(text) { return 1.3 + text.length * 0.052; }

    bark(team, who, text, cd = 7) {
      if (this.time - (this.lastBark[team] || -99) < cd) return;
      this.lastBark[team] = this.time;
      this.emit({ type: 'say', who, text, dur: 2.2, bark: true });
    }

    spawnAll() {
      for (const s of this.world.spawns) if (!s.group) this.spawnFrom(s);
    }

    spawnGroup(name) {
      const out = [];
      for (const s of this.world.spawns) if (s.group === name) out.push(this.spawnFrom(s));
      return out;
    }

    spawnFrom(s) {
      switch (s.kind) {
        case 'npc': return this.spawnNpc(s.type, s.x, s.z, s);
        case 'prop': {
          const y = s.y !== undefined ? s.y : this.world.spawnY(s.x, s.z, s.from, 0);
          const stackY = s.stack ? this.stackTop(s.x, s.z, y) : y;
          return H.Phys.makeProp(this, s.type, s.x, stackY, s.z, s);
        }
        case 'item': return this.spawnItem(s.type, s.x, s.z, s);
        case 'door': return this.makeDoor(s);
        case 'charger': return this.makeCharger(s);
        case 'button': return this.makeButton(s);
        case 'hazard': return this.makeHazard(s);
        case 'vehicle': return H.Vehicle.make(this, s.type, s.x, s.z, s.yaw || 0, s);
        case 'seesaw': return H.Phys.makeSurface(this, Object.assign({ kind: 'seesaw' }, s));
        case 'floatramp': return H.Phys.makeSurface(this, Object.assign({ kind: 'floatramp' }, s));
      }
      return null;
    }

    stackTop(x, z, y) {
      let top = y;
      for (const p of this.props) {
        if (Math.abs(p.pos.x - x) < p.half.x && Math.abs(p.pos.z - z) < p.half.z) top = Math.max(top, p.pos.y + p.half.y * 2);
      }
      return top;
    }

    spawnNpc(type, x, z, o = {}) {
      const y = o.y !== undefined && o.y !== null ? o.y : this.world.spawnY(x, z, o.from, 0.2);
      return H.AI.make(this, type, x, y, z, o);
    }

    spawnItem(type, x, z, o = {}) {
      const def = H.ITEMS[type];
      if (!def) throw new Error('hl2: unknown item ' + type);
      const y = o.y !== undefined ? o.y : this.world.spawnY(x, z, o.from, 0);
      const it = { id: o.id || ('i' + this.nextId++), kind: 'item', type, def, pos: { x, y, z }, vel: { x: 0, y: 0, z: 0 }, settled: false, tag: o.tag || null, spin: this.rng() * 6 };
      this.items.push(it);
      return it;
    }

    makeDoor(s) {
      const b = s.box;
      const h = b[4] - b[1];
      const d = {
        id: s.id, kind: 'door', type: s.type, base: b.slice(), open: !!s.open, t: s.open ? 1 : 0, locked: !!s.locked,
        move: s.move || (s.type === 'swing' || s.type === 'field' ? [0, 0, 0] : [0, h - 0.12, 0]), speed: s.speed || 1.1, auto: !!s.auto, use: s.use !== false && !s.auto && !s.lift, lift: !!s.lift, autoTeam: s.autoTeam || null,
        tex: s.tex || (s.type === 'field' ? 'field' : 'door_metal'), hinge: s.hinge || 'x1', solid: true, closeT: 0, blocksCombine: s.type !== 'field', tag: s.tag || null,
        box: { x1: b[0], y1: b[1], z1: b[2], x2: b[3], y2: b[4], z2: b[5] }, sound: s.sound || (s.type === 'field' ? 'field' : 'door')
      };
      d.box.ref = d;
      this.updateDoorBox(d);
      this.doors.push(d);
      return d;
    }

    updateDoorBox(d) {
      const b = d.base, t = d.t;
      if (d.type === 'swing' || d.type === 'field') {
        d.box.x1 = b[0]; d.box.y1 = b[1]; d.box.z1 = b[2]; d.box.x2 = b[3]; d.box.y2 = b[4]; d.box.z2 = b[5];
        d.solid = d.type === 'field' ? t < 0.5 : t < 0.35;
      } else {
        d.box.x1 = b[0] + d.move[0] * t; d.box.y1 = b[1] + d.move[1] * t; d.box.z1 = b[2] + d.move[2] * t;
        d.box.x2 = b[3] + d.move[0] * t; d.box.y2 = b[4] + d.move[1] * t; d.box.z2 = b[5] + d.move[2] * t;
        d.solid = true;
      }
    }

    doorCmd(id, cmd) {
      for (const d of this.doors) {
        if (d.id !== id && d.tag !== id) continue;
        if (cmd === 'open') { if (!d.open) this.emit({ type: 'sound', name: d.sound, pos: this.doorCenter(d) }); d.open = true; d.locked = false; }
        else if (cmd === 'close') { if (d.open) this.emit({ type: 'sound', name: d.sound, pos: this.doorCenter(d) }); d.open = false; }
        else if (cmd === 'lock') d.locked = true;
        else if (cmd === 'unlock') d.locked = false;
      }
    }

    doorCenter(d) {
      return { x: (d.box.x1 + d.box.x2) / 2, y: (d.box.y1 + d.box.y2) / 2, z: (d.box.z1 + d.box.z2) / 2 };
    }

    makeCharger(s) {
      const cap = s.type === 'health' ? 50 : s.type === 'suit' ? 75 : 1e9;
      const c = { id: s.id || ('c' + this.nextId++), kind: 'charger', type: s.type, pos: { x: s.x, y: s.y, z: s.z }, yaw: s.yaw || 0, charge: s.charge || cap, max: s.charge || cap, active: false, tick: 0 };
      this.chargers.push(c);
      return c;
    }

    makeButton(s) {
      const b = { id: s.id, kind: 'button', pos: { x: s.x, y: s.y, z: s.z }, yaw: s.yaw || 0, pressed: false, once: s.once !== false, locked: !!s.locked, door: s.door || null, label: s.label || null, pressT: -9 };
      this.buttons.push(b);
      return b;
    }

    makeHazard(s) {
      const dps = { fire: 22, electric: 30, blades: 400, toxic: 12, hurt: 15, kill: 1000, crush: 1000 }[s.type] || 15;
      const h = { id: s.id, kind: 'hazard', type: s.type, box: { x1: s.box[0], y1: s.box[1], z1: s.box[2], x2: s.box[3], y2: s.box[4], z2: s.box[5] }, on: s.on !== false, dps: s.dps || dps, t: 0 };
      this.hazards.push(h);
      return h;
    }

    npcBox(n) {
      const r = n.def.radius || 0.34;
      const h = n.alive ? (n.crouch ? n.def.height * 0.65 : n.def.height) : 0.35;
      return { x1: n.pos.x - r, y1: n.pos.y, z1: n.pos.z - r, x2: n.pos.x + r, y2: n.pos.y + h, z2: n.pos.z + r, ref: n };
    }

    playerBox() {
      const p = this.player;
      return { x1: p.pos.x - PR, y1: p.pos.y, z1: p.pos.z - PR, x2: p.pos.x + PR, y2: p.pos.y + p.height, z2: p.pos.z + PR, ref: p };
    }

    eye() {
      const p = this.player;
      if (p.vehicle) return p.vehicle.eye();
      const e = H.lerp(EYE_STAND, EYE_DUCK, p.duckAmt);
      return { x: p.pos.x, y: p.pos.y + (p.dead ? 0.3 : e), z: p.pos.z };
    }

    aimDir() {
      const p = this.player;
      return H.forward(p.yaw, H.clamp(p.pitch + p.punch, -1.55, 1.55));
    }

    npcById(id) { return this.npcs.find(n => n.id === id) || null; }
    npcsByTag(tag) { return this.npcs.filter(n => n.tag === tag || n.id === tag); }
    tagDead(tag) { return !this.npcs.some(n => (n.tag === tag || n.id === tag) && n.alive); }
    tagCount(tag) { return this.npcs.filter(n => (n.tag === tag || n.id === tag) && n.alive).length; }

    obstaclesFor(self, o = {}) {
      const list = [];
      for (const p of this.props) if (!p.dead && p !== self && !p.held && !(o.skipLight && p.mass < 8)) list.push(H.Phys.propBox(p));
      for (const d of this.doors) if (d.solid && !(o.combine && !d.blocksCombine)) list.push(d.box);
      for (const s of this.surfaces) for (const b of s.boxes) list.push(b);
      for (const v of this.vehicles) if (v !== self && v !== o.skipVehicle) list.push(v.box());
      if (o.npcs) for (const n of this.npcs) if (n !== self && n.alive && !n.def.flying && !n.held && (n.def.radius || 0.34) > 0.3 && n.def.height > 0.5) list.push(this.npcBox(n));
      if (o.player && !this.player.dead && !this.player.vehicle) list.push(this.playerBox());
      return list;
    }

    step(input = {}) {
      const dt = H.TICK;
      this.time += dt;
      this.stats.time += dt;
      const inp = input;
      const pr = {};
      for (const k of ['jump', 'use', 'fire1', 'fire2', 'reload', 'flashlight', 'next', 'prev', 'last', 'squad', 'duck']) pr[k] = !!inp[k] && !this.prevIn[k];
      pr.slot = inp.slot && inp.slot !== this.prevIn.slot ? inp.slot : 0;
      this.prevIn = Object.assign({}, inp);
      this.updatePlayer(inp, pr, dt);
      for (const v of this.vehicles) H.Vehicle.step(this, v, v === this.player.vehicle ? inp : null, dt, v === this.player.vehicle ? pr : null);
      H.AI.stepAll(this, dt);
      H.Phys.stepSurfaces(this, dt);
      H.Phys.stepProps(this, dt);
      this.updateHeldNpc(dt);
      this.updateDoors(dt);
      this.updateProjectiles(dt);
      this.updateItems(dt);
      this.updateHazards(dt);
      this.updateChargers(dt, inp);
      this.runScripts(dt);
      if (this.def.tick) this.def.tick(this, dt);
      this.fx.step(dt);
      for (let i = this.dynLights.length - 1; i >= 0; i--) {
        const l = this.dynLights[i];
        l.t -= dt;
        if (l.t <= 0) this.dynLights.splice(i, 1);
      }
      for (let i = this.noises.length - 1; i >= 0; i--) if (this.time - this.noises[i].t > 1.5) this.noises.splice(i, 1);
    }

    addDynLight(pos, col, radius, t) {
      this.dynLights.push({ pos: H.vcopy(pos), col, radius, t, t0: t });
      if (this.dynLights.length > 6) this.dynLights.shift();
    }

    updatePlayer(inp, pr, dt) {
      const p = this.player;
      const w = this.world;
      p.punch = H.approach(p.punch, 0, dt * 0.6 + Math.abs(p.punch) * dt * 6);
      p.blind = Math.max(0, p.blind - dt);
      if (p.dead) {
        p.deadT += dt;
        p.vel.y -= H.GRAVITY * dt;
        w.moveBox(p.pos, PR, 0.4, { x: p.vel.x * dt, y: p.vel.y * dt, z: p.vel.z * dt }, { extra: this.obstaclesFor(p) });
        p.vel.x *= 0.9; p.vel.z *= 0.9;
        return;
      }
      if (p.poison > 0) {
        p.poisonT += dt;
        if (p.poisonT > 0.45) { p.poisonT = 0; const g = Math.min(1, p.poison); p.poison -= g; p.hp = Math.min(100, p.hp + g); }
      }
      if (pr.flashlight && p.suit) { p.flashlight = !p.flashlight; this.emit({ type: 'sound', name: 'flashlight' }); }
      if (p.vehicle) {
        this.updatePlayerWeapons(inp, pr, dt, true);
        if (pr.use && this.time - p.vehicle.enterT > 0.5) this.exitVehicle();
        this.auxPower(dt, false);
        this.pickupItems();
        this.checkCaches();
        return;
      }
      const wishDuck = !!inp.duck;
      if (wishDuck && !p.ducked) {
        p.ducked = true;
        if (!p.onGround) p.pos.y += STAND_H - DUCK_H - 0.05;
      } else if (!wishDuck && p.ducked) {
        const drop = !p.onGround ? STAND_H - DUCK_H - 0.05 : 0;
        const ty = p.pos.y - drop;
        if (!w.overlaps(p.pos.x, ty, p.pos.z, PR, STAND_H, PR, this.obstaclesFor(p))) { p.ducked = false; p.pos.y = ty; }
        else if (drop && !w.overlaps(p.pos.x, p.pos.y, p.pos.z, PR, STAND_H, PR, this.obstaclesFor(p))) p.ducked = false;
      }
      p.height = p.ducked ? DUCK_H : STAND_H;
      p.duckAmt = H.approach(p.duckAmt, p.ducked ? 1 : 0, dt * 7);
      const wl = w.waterAt(p.pos.x, p.pos.z);
      const eyeY = p.pos.y + H.lerp(EYE_STAND, EYE_DUCK, p.duckAmt);
      p.waterLevel = wl <= p.pos.y ? 0 : wl < p.pos.y + 0.9 ? 1 : wl < eyeY ? 2 : 3;
      const wtype = p.waterLevel ? w.waterType(p.pos.x, p.pos.z) : null;
      if (p.grabbed) {
        p.vel.x = p.vel.z = 0;
        this.updatePlayerWeapons(inp, pr, dt, false);
        return;
      }
      const frozen = p.frozen;
      const fwdIn = frozen ? 0 : H.clamp(inp.fwd || 0, -1, 1), sideIn = frozen ? 0 : H.clamp(inp.side || 0, -1, 1);
      const f = H.forward(p.yaw, 0), r = H.rightOf(p.yaw);
      let wx = f.x * fwdIn + r.x * sideIn, wz = f.z * fwdIn + r.z * sideIn;
      const wl2 = Math.hypot(wx, wz);
      if (wl2 > 1) { wx /= wl2; wz /= wl2; }
      p.sprinting = !!inp.sprint && p.suit && p.aux > 1 && fwdIn > 0 && !p.ducked && p.waterLevel < 2;
      let speed = p.ducked ? 2.1 : inp.walk ? 2.6 : p.sprinting ? 7.8 : 4.9;
      if (!p.suit && inp.sprint && fwdIn > 0 && !p.ducked) speed = 6.2;
      if (p.held && p.held.ent.mass > 60) speed *= 0.75;
      if (p.waterLevel === 2) speed *= 0.7;
      const ladder = w.onLadder(p.pos, PR);
      p.ladder = ladder && !p.onGround ? ladder : ladder && fwdIn !== 0 ? ladder : null;
      const extra = this.obstaclesFor(p, { npcs: true });
      if (p.ladder) {
        const climb = fwdIn * (p.pitch > -0.35 ? 1 : -1) * 3.2;
        p.vel.x = wx * 1.2; p.vel.z = wz * 1.2; p.vel.y = climb;
        if (pr.jump) { p.vel.x = -f.x * 4; p.vel.z = -f.z * 4; p.vel.y = 2; p.ladder = null; }
      } else if (p.waterLevel >= 3 || (p.waterLevel === 2 && !p.onGround)) {
        const vf = H.forward(p.yaw, p.pitch);
        const sw = 3.4 * (inp.sprint && p.suit ? 1.35 : 1);
        const tx = (vf.x * fwdIn + r.x * sideIn) * sw, tz = (vf.z * fwdIn + r.z * sideIn) * sw;
        let ty = vf.y * fwdIn * sw + (inp.jump ? 3 : 0) - (inp.duck ? 2 : 0) - 0.35;
        if (p.waterLevel === 2 && inp.jump) ty = 3.8;
        p.vel.x = H.approach(p.vel.x, tx, 10 * dt); p.vel.z = H.approach(p.vel.z, tz, 10 * dt); p.vel.y = H.approach(p.vel.y, ty, 8 * dt);
      } else {
        const tx = wx * speed, tz = wz * speed;
        if (p.onGround) {
          const acc = (wl2 > 0.01 ? 55 : 30) * dt;
          p.vel.x = H.approach(p.vel.x, tx, acc);
          p.vel.z = H.approach(p.vel.z, tz, acc);
          if (pr.jump && !frozen) {
            p.vel.y = p.waterLevel === 2 ? 4.2 : 5.5;
            p.onGround = false;
            this.emit({ type: 'sound', name: 'jump' });
          }
        } else {
          const acc = 9 * dt;
          const cur = p.vel.x * wx + p.vel.z * wz;
          if (cur < speed) { p.vel.x += wx * acc * speed * 0.35; p.vel.z += wz * acc * speed * 0.35; }
        }
        p.vel.y -= H.GRAVITY * dt;
        if (p.vel.y < -40) p.vel.y = -40;
      }
      const vy0 = p.vel.y;
      const wasGround = p.onGround;
      const res = w.moveBox(p.pos, PR, p.height, { x: p.vel.x * dt, y: p.vel.y * dt, z: p.vel.z * dt }, { step: 0.55, grounded: wasGround || p.ladder || p.waterLevel >= 2, extra });
      if (res.hitX) { this.pushProp(res.hitX, 'x', p.vel.x); p.vel.x = 0; }
      if (res.hitZ) { this.pushProp(res.hitZ, 'z', p.vel.z); p.vel.z = 0; }
      if (res.hitY) {
        if (vy0 < 0) {
          if (!wasGround && vy0 < -11 && p.waterLevel < 2) this.fallDamage(-vy0);
          if (!wasGround && vy0 < -3) this.emit({ type: 'sound', name: 'land', vol: Math.min(1, -vy0 / 10) });
        }
        p.vel.y = 0;
      }
      p.onGround = res.onGround;
      if (!p.onGround && wasGround && p.vel.y <= 0.01 && !p.ladder && p.waterLevel < 2) {
        const g = this.groundUnder(p.pos, PR, 0.6, extra);
        if (g !== null) { p.pos.y = g; p.onGround = true; p.vel.y = 0; }
      }
      if (p.onGround && res.ground && res.ground.surface) {
        const s = res.ground.surface;
        if (s.kind === 'floatramp' || s.kind === 'seesaw') p.vel.y = 0;
      }
      if (wtype === 'sludge' && p.waterLevel >= 1) this.hurtOverTime('sludge', 14 * dt * (p.waterLevel >= 2 ? 1.5 : 1), 'toxic');
      const cell = w.cellAt(p.pos.x, p.pos.z);
      if (cell.hurt && p.pos.y < cell.f + 0.3) this.hurtOverTime('cell', (cell.hurtDps || 20) * dt, cell.hurt);
      this.auxPower(dt, p.waterLevel >= 3);
      this.footsteps(dt, wl2, speed, cell, wtype);
      if (pr.use) this.useAction();
      if (pr.squad) this.squadCommand();
      this.updatePlayerWeapons(inp, pr, dt, false);
      this.updateHeldTarget();
      this.pickupItems();
      this.checkCaches();
      if (p.pos.y < -60) this.damagePlayer(1000, { type: 'fall', fixed: true });
    }

    groundUnder(pos, r, maxDrop, extra) {
      const probe = { x: pos.x, y: pos.y, z: pos.z };
      const res = this.world.moveBox(probe, r, this.player.height, { x: 0, y: -maxDrop, z: 0 }, { extra });
      return res.onGround ? probe.y : null;
    }

    pushProp(hit, axis, v) {
      const p = hit.ref;
      if (!p || p.kind !== 'prop' || p.frozen || p.mass > 160) return;
      H.Phys.wake(p);
      const k = 80 / (80 + p.mass);
      p.vel[axis] = v * Math.max(0.3, k) * 1.1;
    }

    fallDamage(v) {
      const dmg = (v - 11) * 7;
      this.damagePlayer(dmg, { type: 'fall', fixed: true });
      if (dmg > 25 && this.player.suit) this.hevSay('Обнаружен перелом.');
    }

    hevSay(text) {
      if (this.time - (this.lastHev || -99) < 6) return;
      this.lastHev = this.time;
      this.emit({ type: 'say', who: 'hev', text, dur: 2.4 });
      this.emit({ type: 'sound', name: 'hev_beep' });
    }

    hurtOverTime(key, amount, type) {
      const p = this.player;
      p.hurtAcc = (p.hurtAcc || 0) + amount;
      if (p.hurtAcc >= 5) { this.damagePlayer(p.hurtAcc, { type }); p.hurtAcc = 0; }
      if (type === 'toxic' && p.suit) this.hevSay('Внимание: токсичная среда.');
    }

    auxPower(dt, underwater) {
      const p = this.player;
      if (!p.suit) { p.aux = 100; if (underwater) this.drown(dt); else this.recoverDrown(dt); return; }
      let drain = 0;
      if (p.sprinting) drain += 11;
      if (p.flashlight) drain += 2.2;
      if (underwater) drain += 7;
      if (drain > 0) p.aux = Math.max(0, p.aux - drain * dt);
      else p.aux = Math.min(100, p.aux + 9 * dt);
      if (p.flashlight && p.aux <= 0) p.flashlight = false;
      if (underwater && p.aux <= 0) this.drown(dt);
      else if (!underwater) this.recoverDrown(dt);
    }

    drown(dt) {
      const p = this.player;
      p.drownT += dt;
      if (p.drownT > 1.8) { p.drownT = 0; this.damagePlayer(10, { type: 'drown', fixed: true }); p.drownDmg += 10; }
    }

    recoverDrown(dt) {
      const p = this.player;
      if (p.drownDmg > 0) {
        p.drownT += dt;
        if (p.drownT > 0.5) { p.drownT = 0; const g = Math.min(2, p.drownDmg); p.drownDmg -= g; p.hp = Math.min(100, p.hp + g); }
      } else p.drownT = 0;
    }

    footsteps(dt, moving, speed, cell, wtype) {
      const p = this.player;
      if (!p.onGround || moving < 0.1) { p.stepT = 0; return; }
      const hs = Math.hypot(p.vel.x, p.vel.z);
      p.bob += dt * hs * 1.9;
      p.stepT += dt * hs;
      const stride = p.sprinting ? 2.4 : 1.9;
      if (p.stepT > stride) {
        p.stepT = 0;
        let mat = 'concrete';
        if (p.waterLevel >= 1) mat = 'water';
        else {
          const tex = cell.smooth || !cell.t ? cell.t : cell.t;
          mat = H.TEX_MAT[tex] || 'concrete';
          if (mat === 'grass') mat = 'dirt';
        }
        this.emit({ type: 'sound', name: 'step_' + mat, vol: p.ducked || speed < 3 ? 0.35 : 0.7 });
        if (!p.ducked && speed > 3) this.noise(p.pos, p.sprinting ? 9 : 5, p);
      }
    }

    useTarget() {
      const eye = this.eye(), d = this.aimDir();
      let best = null, bestT = USE_RANGE;
      const test = (ent, box, kind) => {
        const h = H.rayBox(eye, d, box.x1, box.y1, box.z1, box.x2, box.y2, box.z2);
        if (h && h.t < bestT) { bestT = h.t; best = { ent, kind }; }
      };
      for (const b of this.buttons) test(b, { x1: b.pos.x - 0.25, y1: b.pos.y - 0.25, z1: b.pos.z - 0.25, x2: b.pos.x + 0.25, y2: b.pos.y + 0.25, z2: b.pos.z + 0.25 }, 'button');
      for (const c of this.chargers) test(c, { x1: c.pos.x - 0.35, y1: c.pos.y - 0.4, z1: c.pos.z - 0.35, x2: c.pos.x + 0.35, y2: c.pos.y + 0.4, z2: c.pos.z + 0.35 }, 'charger');
      for (const dd of this.doors) if (dd.use && dd.type !== 'field') test(dd, dd.box, 'door');
      for (const v of this.vehicles) test(v, v.box(), 'vehicle');
      for (const p of this.props) {
        if (p.dead || p.held) continue;
        const pb = H.Phys.propBox(p);
        const m = Math.max(0, 0.16 - Math.min(p.half.x, p.half.z));
        test(p, { x1: pb.x1 - m, y1: pb.y1 - m * 0.5, z1: pb.z1 - m, x2: pb.x2 + m, y2: pb.y2 + m, z2: pb.z2 + m }, 'prop');
      }
      for (const n of this.npcs) if (n.alive) test(n, this.npcBox(n), 'npc');
      for (const it of this.items) test(it, { x1: it.pos.x - 0.3, y1: it.pos.y, z1: it.pos.z - 0.3, x2: it.pos.x + 0.3, y2: it.pos.y + 0.4, z2: it.pos.z + 0.3 }, 'item');
      const wh = this.world.raycast(eye, d, bestT);
      if (wh && best) return null;
      return best;
    }

    useAction() {
      const p = this.player;
      if (p.held) { this.dropHeld(true); return; }
      const t = this.useTarget();
      if (!t) { this.emit({ type: 'sound', name: 'use_deny' }); return; }
      const e = t.ent;
      if (t.kind === 'button') {
        if (e.locked) { this.emit({ type: 'sound', name: 'use_deny' }); this.flags['locked:' + e.id] = true; return; }
        if (e.pressed && e.once) return;
        e.pressed = true;
        e.pressT = this.time;
        this.flags['btn:' + e.id] = true;
        this.emit({ type: 'sound', name: 'button', pos: e.pos });
        if (e.door) { const d = this.doors.find(x => x.id === e.door); if (d) this.doorCmd(d.id, d.open ? 'close' : 'open'); }
      } else if (t.kind === 'door') {
        if (e.locked) { this.emit({ type: 'sound', name: 'door_locked', pos: this.doorCenter(e) }); this.flags['locked:' + e.id] = true; return; }
        this.doorCmd(e.id, e.open ? 'close' : 'open');
      } else if (t.kind === 'vehicle') {
        this.enterVehicle(e);
      } else if (t.kind === 'prop') {
        if (e.mass <= 36 && !e.frozen) this.grab(e, 'use');
        else this.emit({ type: 'sound', name: 'use_deny' });
        this.flags['use:' + e.id] = true;
        if (e.tag) this.flags['use:' + e.tag] = true;
      } else if (t.kind === 'npc') {
        this.flags['use:' + e.id] = true;
        if (e.tag) this.flags['use:' + e.tag] = true;
        H.AI.onUse(this, e);
      } else if (t.kind === 'item') {
        this.tryPickup(e, true);
      }
    }

    enterVehicle(v) {
      const p = this.player;
      if (v.locked) { this.emit({ type: 'sound', name: 'use_deny' }); return; }
      if (p.held) this.dropHeld(false);
      p.vehicle = v;
      v.driver = p;
      v.enterT = this.time;
      p.flashlight = false;
      p.yaw = v.yaw;
      p.pitch = 0;
      this.flags['vehicle:' + v.type] = true;
      this.emit({ type: 'sound', name: 'vehicle_in' });
    }

    exitVehicle(force) {
      const p = this.player, v = p.vehicle;
      if (!v) return;
      if (v.noExit && !force) { this.emit({ type: 'sound', name: 'use_deny' }); return; }
      const tries = [H.rightOf(v.yaw), H.vscale(H.rightOf(v.yaw), -1), H.forward(v.yaw + Math.PI), H.forward(v.yaw)];
      for (const d of tries) {
        for (const dist of [1.9, 2.6, 3.4]) {
          const x = v.pos.x + d.x * dist, z = v.pos.z + d.z * dist;
          const g = this.world.surfaceAt(x, z, v.pos.y + 1.5, PR);
          const wl = this.world.waterAt(x, z);
          const y = wl > g + 1.2 ? wl - 1.25 : g;
          if (y < v.pos.y - 3 || y > v.pos.y + 1.6) continue;
          if (this.world.overlaps(x, y + 0.02, z, PR, STAND_H, PR, this.obstaclesFor(null, { skipVehicle: null }))) continue;
          p.pos = { x, y: y + 0.02, z };
          p.vel = { x: 0, y: 0, z: 0 };
          p.vehicle = null;
          v.driver = null;
          this.emit({ type: 'sound', name: 'vehicle_out' });
          return;
        }
      }
      if (force) {
        p.pos = { x: v.pos.x, y: v.pos.y + 1.6, z: v.pos.z };
        p.vehicle = null;
        v.driver = null;
      }
    }

    squadCommand() {
      const squad = this.npcs.filter(n => n.alive && n.follow !== undefined && n.def.squad && n.inSquad);
      if (!squad.length) return;
      const holding = squad.some(n => n.hold);
      if (holding) {
        for (const n of squad) { n.hold = null; n.path = null; }
        this.emit({ type: 'squad', text: 'Отряд: за мной!' });
        this.bark('rebel', 'rebel', 'Идём за тобой!', 2);
      } else {
        const h = this.traceLine(this.eye(), this.aimDir(), 40, { ignore: this.player });
        const pt = h ? h.point : H.vadd(this.eye(), this.aimDir(), 10);
        let k = 0;
        for (const n of squad) {
          const a = (k++ / squad.length) * Math.PI * 2;
          n.hold = { x: pt.x + Math.cos(a) * 1.4, y: pt.y, z: pt.z + Math.sin(a) * 1.4 };
          n.path = null;
        }
        this.emit({ type: 'squad', text: 'Отряд: занять позицию' });
        this.bark('rebel', 'rebel', 'Уже иду!', 2);
      }
      this.emit({ type: 'sound', name: 'squad' });
    }

    checkCaches() {
      const p = this.player;
      this.world.caches.forEach((c, i) => {
        if (this.stats.found.includes(i)) return;
        if (p.pos.x >= c.x1 && p.pos.x <= c.x2 && p.pos.z >= c.z1 && p.pos.z <= c.z2) {
          this.stats.found.push(i);
          this.stats.caches++;
          this.emit({ type: 'cache', n: this.stats.caches, total: this.stats.cachesTotal });
          this.emit({ type: 'sound', name: 'cache' });
        }
      });
    }

    pickupItems() {
      const p = this.player;
      const c = p.vehicle ? p.vehicle.pos : p.pos;
      const reach = p.vehicle ? 2.6 : 0.9;
      for (const it of this.items) {
        if (it.dead) continue;
        if (Math.hypot(it.pos.x - c.x, it.pos.z - c.z) > reach || it.pos.y > c.y + 1.8 || it.pos.y < c.y - 1.2) continue;
        this.tryPickup(it, false);
      }
      this.items = this.items.filter(i => !i.dead);
    }

    tryPickup(it, byUse) {
      const p = this.player;
      const d = it.def;
      if (!p.suit && !d.suit && !d.weapon && !byUse) return false;
      let took = false;
      if (d.suit) { p.suit = true; took = true; this.emit({ type: 'suit' }); this.flags.suit = true; }
      else if (d.health) { if (p.hp < 100) { p.hp = Math.min(100, p.hp + d.health); took = true; } }
      else if (d.armor) { if (p.suit && p.armor < 100) { p.armor = Math.min(100, p.armor + d.armor); took = true; } }
      else if (d.weapon) {
        const had = !!p.weapons[d.weapon];
        p.weapons[d.weapon] = true;
        if (d.ammo) {
          const w = H.WEAPONS[d.weapon];
          if (!had && w.clip) { p.clip[d.weapon] = Math.min(w.clip, d.count); p.ammo[d.ammo] = Math.min(H.AMMO[d.ammo].max, p.ammo[d.ammo] + Math.max(0, d.count - w.clip)); }
          else p.ammo[d.ammo] = Math.min(H.AMMO[d.ammo].max, p.ammo[d.ammo] + d.count);
          if (!w.clip) p.ammo[d.ammo] = Math.min(H.AMMO[d.ammo].max, Math.max(p.ammo[d.ammo], d.count));
        }
        took = true;
        if (!had) this.switchTo(d.weapon);
        this.flags['got:' + d.weapon] = true;
      } else if (d.ammo) {
        const max = H.AMMO[d.ammo].max;
        if (p.ammo[d.ammo] < max) { p.ammo[d.ammo] = Math.min(max, p.ammo[d.ammo] + Math.ceil(d.count * this.skill.ammo)); took = true; }
      }
      if (took) {
        it.dead = true;
        this.emit({ type: 'pickup', item: it.type });
        this.emit({ type: 'sound', name: d.health ? 'pickup_health' : d.armor ? 'pickup_battery' : d.suit ? 'suit' : 'pickup' });
        if (it.tag) this.flags['got:' + it.tag] = true;
      }
      return took;
    }

    ownedWeapons() {
      const p = this.player;
      return Object.keys(H.WEAPONS).filter(k => p.weapons[k]).sort((a, b) => (H.WEAPONS[a].slot - H.WEAPONS[b].slot) || (H.WEAPONS[a].order - H.WEAPONS[b].order));
    }

    hasAmmoFor(id) {
      const w = H.WEAPONS[id], p = this.player;
      if (!w.ammo) return true;
      return (p.clip[id] || 0) > 0 || p.ammo[w.ammo] > 0;
    }

    switchTo(id) {
      const p = this.player;
      if (!id || !p.weapons[id] || p.cur === id) return;
      if (p.held && p.cur === 'gravgun') this.dropHeld(false);
      p.prev = p.cur;
      p.cur = id;
      p.drawT = 0.45;
      p.reloadT = 0;
      p.shellReload = false;
      p.zoom = false;
      this.emit({ type: 'weapon', id });
      this.emit({ type: 'sound', name: 'draw' });
    }

    selectSlot(slot) {
      const list = this.ownedWeapons().filter(k => H.WEAPONS[k].slot === slot - 1);
      if (!list.length) { this.emit({ type: 'sound', name: 'use_deny' }); return; }
      const i = list.indexOf(this.player.cur);
      this.switchTo(list[(i + 1) % list.length]);
    }

    cycleWeapon(dir) {
      const list = this.ownedWeapons();
      if (!list.length) return;
      let i = list.indexOf(this.player.cur);
      for (let k = 0; k < list.length; k++) {
        i = (i + dir + list.length) % list.length;
        if (this.hasAmmoFor(list[i])) { this.switchTo(list[i]); return; }
      }
    }

    updatePlayerWeapons(inp, pr, dt, inVehicle) {
      const p = this.player;
      p.fireCd -= dt;
      p.altCd -= dt;
      if (inVehicle) { p.vehicle && H.Vehicle.fire(this, p.vehicle, inp, pr, dt); return; }
      if (pr.slot) this.selectSlot(pr.slot);
      if (pr.next) this.cycleWeapon(1);
      if (pr.prev) this.cycleWeapon(-1);
      if (pr.last && p.prev) this.switchTo(p.prev);
      if (!p.cur && this.ownedWeapons().length) this.switchTo(this.ownedWeapons()[0]);
      const id = p.cur;
      const w = H.WEAPONS[id];
      if (!w || p.frozen) return;
      if (p.drawT > 0) { p.drawT -= dt; return; }
      if (p.held && p.held.mode === 'use') {
        if (pr.fire1) this.launchHeld(6);
        return;
      }
      if (p.reloadT > 0) {
        p.reloadT -= dt;
        if (w.reloadShell && inp.fire1 && (p.clip[id] || 0) > 0) { p.reloadT = 0; p.shellReload = false; }
        else if (p.reloadT <= 0) this.finishReload(id);
        if (p.reloadT > 0) return;
      }
      if (w.gravgun) { this.gravgun(inp, pr, dt); return; }
      if (p.autoReload && p.fireCd <= 0) { p.autoReload = false; if (!(p.clip[id] > 0)) this.startReload(id); if (p.reloadT > 0) return; }
      if (w.clip && pr.reload) this.startReload(id);
      if (w.zoom && pr.fire2) { p.zoom = !p.zoom; this.emit({ type: 'sound', name: 'zoom' }); }
      if (inp.fire1 && p.fireCd <= 0) this.primary(id, w, pr.fire1);
      else if (inp.fire2 && p.altCd <= 0 && p.fireCd <= 0 && !w.zoom) this.secondary(id, w, pr.fire2);
    }

    startReload(id) {
      const p = this.player, w = H.WEAPONS[id];
      if (!w.clip || (p.clip[id] || 0) >= w.clip || p.ammo[w.ammo] <= 0 || w.id === 'rpg') return false;
      if (w.reloadShell) { p.shellReload = true; p.reloadT = w.reloadShell + 0.3; }
      else p.reloadT = w.reload;
      p.zoom = false;
      this.emit({ type: 'sound', name: 'reload_' + id });
      return true;
    }

    finishReload(id) {
      const p = this.player, w = H.WEAPONS[id];
      if (w.reloadShell) {
        if ((p.clip[id] || 0) < w.clip && p.ammo[w.ammo] > 0) {
          p.clip[id] = (p.clip[id] || 0) + 1;
          p.ammo[w.ammo]--;
          this.emit({ type: 'sound', name: 'shell' });
          if (p.clip[id] < w.clip && p.ammo[w.ammo] > 0) { p.reloadT = w.reloadShell; return; }
        }
        p.shellReload = false;
        return;
      }
      const need = w.clip - (p.clip[id] || 0);
      const take = Math.min(need, p.ammo[w.ammo]);
      p.clip[id] = (p.clip[id] || 0) + take;
      p.ammo[w.ammo] -= take;
    }

    primary(id, w, fresh) {
      const p = this.player;
      const eye = this.eye(), dir = this.aimDir();
      if (w.melee) {
        p.fireCd = w.rate;
        this.emit({ type: 'viewanim', anim: 'swing' });
        const h = this.traceLine(eye, dir, w.range, { ignore: p });
        if (h) {
          this.emit({ type: 'sound', name: h.kind === 'npc' ? 'crowbar_flesh' : 'crowbar_hit', pos: h.point });
          this.applyHit(h, w.dmg, { type: 'club', attacker: p, dir, weapon: id, impulse: 300 });
        } else {
          p.fireCd = w.rate + 0.08;
          this.emit({ type: 'sound', name: 'crowbar_swing' });
        }
        return;
      }
      if (w.throw) {
        if (p.ammo.grenade <= 0) { this.cycleWeapon(1); return; }
        p.ammo.grenade--;
        p.fireCd = w.rate;
        this.throwGrenade(eye, dir, 15, p);
        this.emit({ type: 'viewanim', anim: 'throw' });
        if (p.ammo.grenade <= 0) p.drawT = 0;
        return;
      }
      if (w.bugbait) {
        p.fireCd = w.rate;
        this.throwBugbait(eye, dir);
        return;
      }
      if (id === 'rpg') {
        if (this.projectiles.some(q => q.kind === 'rocket' && q.guided)) return;
        if (p.ammo.rocket <= 0) { this.emit({ type: 'sound', name: 'empty' }); p.fireCd = 0.4; return; }
        p.ammo.rocket--;
        p.fireCd = w.rate;
        const muzzle = H.vadd(H.vadd(eye, dir, 0.6), H.rightOf(p.yaw), -0.2);
        this.fireRocket(muzzle, dir, p, true);
        p.punch += 0.05;
        this.emit({ type: 'viewanim', anim: 'fire' });
        return;
      }
      const clip = p.clip[id] || 0;
      if (clip <= 0) {
        if (!this.startReload(id)) { this.emit({ type: 'sound', name: 'empty' }); p.fireCd = 0.3; if (p.ammo[w.ammo] <= 0 && fresh) this.cycleWeapon(1); }
        return;
      }
      if (id === 'pistol' && !fresh) { p.fireCd = 0.05; if (this.time - (p.lastShotT || 0) < 0.42) return; }
      p.clip[id] = clip - 1;
      p.fireCd = w.rate;
      p.lastShotT = this.time;
      this.emit({ type: 'sound', name: w.sound });
      this.emit({ type: 'viewanim', anim: 'fire' });
      this.noise(p.pos, 34, p);
      const muzzle = H.vadd(H.vadd(eye, dir, 0.7), H.rightOf(p.yaw), -0.16);
      muzzle.y -= 0.12;
      this.fx.muzzle(muzzle, id === 'ar2' ? [0.5, 0.8, 1] : [1, 0.8, 0.4]);
      this.addDynLight(muzzle, id === 'ar2' ? [0.4, 0.7, 1.2] : [1.2, 0.9, 0.5], 5, 0.05);
      if (w.projectile === 'bolt') {
        this.projectiles.push({ kind: 'bolt', pos: H.vcopy(eye), vel: H.vscale(dir, w.speed), owner: p, t: 0, dmg: w.dmg });
        p.fireCd = w.rate;
        p.reloadT = w.reload;
        p.clip[id] = 0;
        if (p.ammo.bolt > 0) { p.clip[id] = 1; p.ammo.bolt--; }
        p.zoom = false;
        return;
      }
      const spread = w.spread * (p.ducked ? 0.6 : 1) * (p.onGround ? 1 : 2) * (Math.hypot(p.vel.x, p.vel.z) > 3 ? 1.4 : 1);
      const n = w.pellets || 1;
      for (let k = 0; k < n; k++) this.fireBullet(eye, dir, spread, w.dmg, p, id, muzzle);
      p.punch += w.kick * (0.6 + this.rng() * 0.8);
      if (clip - 1 <= 0 && p.ammo[w.ammo] > 0) p.autoReload = true;
    }

    secondary(id, w, fresh) {
      const p = this.player;
      const eye = this.eye(), dir = this.aimDir();
      if (w.throw && fresh) {
        if (p.ammo.grenade <= 0) return;
        p.ammo.grenade--;
        p.fireCd = w.rate;
        this.throwGrenade(eye, H.vnorm({ x: dir.x, y: dir.y - 0.3, z: dir.z }), 7, p);
        return;
      }
      if (w.bugbait && fresh) {
        p.fireCd = 0.6;
        this.emit({ type: 'sound', name: 'bugbait_squeeze' });
        for (const n of this.npcs) if (n.alive && n.team === 'pet') { n.baitT = 0; n.bait = null; n.follow = true; }
        return;
      }
      if (id === 'rpg' && fresh) { p.laser = !p.laser; return; }
      if (id === 'shotgun' && fresh) {
        const clip = p.clip[id] || 0;
        if (clip < 2) { this.primary(id, w, true); return; }
        p.clip[id] = clip - 2;
        p.fireCd = 1.0;
        this.emit({ type: 'sound', name: 'shotgun_double' });
        this.emit({ type: 'viewanim', anim: 'fire' });
        this.noise(p.pos, 40, p);
        for (let k = 0; k < 12; k++) this.fireBullet(eye, dir, w.spread * 1.25, w.dmg, p, id, null);
        p.punch += 0.13;
        return;
      }
      if (id === 'smg' && fresh) {
        if (p.ammo.smggren <= 0) { this.emit({ type: 'sound', name: 'empty' }); p.altCd = 0.5; return; }
        p.ammo.smggren--;
        p.altCd = 1.0;
        this.emit({ type: 'sound', name: 'smg_gl' });
        this.projectiles.push({ kind: 'smggren', pos: H.vadd(eye, dir, 0.5), vel: H.vadd(H.vscale(dir, 28), { x: 0, y: 2, z: 0 }), owner: p, t: 0 });
        return;
      }
      if (id === 'ar2' && fresh) {
        if (p.ammo.ar2ball <= 0) { this.emit({ type: 'sound', name: 'empty' }); p.altCd = 0.5; return; }
        p.ammo.ar2ball--;
        p.altCd = 1.2;
        p.fireCd = 0.6;
        this.emit({ type: 'sound', name: 'ar2_ball' });
        this.launchBall(H.vadd(eye, dir, 0.6), H.vscale(dir, 20), p);
        p.punch += 0.08;
      }
    }

    launchBall(pos, vel, owner) {
      this.projectiles.push({ kind: 'ball', pos: H.vcopy(pos), vel, owner, t: 0, life: 4.5, bounces: 0 });
    }

    throwGrenade(eye, dir, speed, owner) {
      const pos = H.vadd(eye, dir, 0.5);
      const base = owner && owner.vel ? owner.vel : { x: 0, y: 0, z: 0 };
      this.projectiles.push({ kind: 'grenade', pos, vel: { x: dir.x * speed + base.x * 0.5, y: dir.y * speed + 2.5, z: dir.z * speed + base.z * 0.5 }, owner, t: 0, fuse: 2.6 });
      this.emit({ type: 'sound', name: 'throw' });
    }

    throwBugbait(eye, dir) {
      this.projectiles.push({ kind: 'bait', pos: H.vadd(eye, dir, 0.5), vel: { x: dir.x * 14, y: dir.y * 14 + 2, z: dir.z * 14 }, owner: this.player, t: 0 });
      this.emit({ type: 'sound', name: 'throw' });
    }

    fireRocket(pos, dir, owner, guided) {
      this.projectiles.push({ kind: 'rocket', pos: H.vcopy(pos), dir: H.vcopy(dir), speed: guided ? 10 : 18, owner, t: 0, guided: !!guided });
      this.emit({ type: 'sound', name: 'rpg', pos });
    }

    fireBullet(o, dir, spread, dmg, attacker, weapon, muzzle, range = 150) {
      const r = this.rng;
      const d = H.vnorm({ x: dir.x + (r() - 0.5) * 2 * spread, y: dir.y + (r() - 0.5) * 2 * spread, z: dir.z + (r() - 0.5) * 2 * spread });
      const h = this.traceLine(o, d, range, { ignore: attacker, water: true, player: attacker !== this.player });
      const end = h ? h.point : H.vadd(o, d, range);
      if (muzzle && r() < 0.5) this.fx.tracer(muzzle, end);
      else if (!muzzle && attacker !== this.player) this.fx.tracer(o, end);
      if (h) this.applyHit(h, dmg, { type: 'bullet', attacker, dir: d, weapon });
      return h;
    }

    applyHit(h, dmg, info) {
      if (h.kind === 'npc') {
        const n = h.ent;
        const mult = h.head && n.def.height > 1.2 ? 2 : 1;
        this.damageNpc(n, dmg * mult, Object.assign({ pos: h.point }, info));
      } else if (h.kind === 'player') {
        this.damagePlayer(dmg, info);
      } else if (h.kind === 'prop') {
        const p = h.ent;
        this.fx.impact(h.point, h.n || H.vscale(info.dir, -1), p.def.mat);
        H.Phys.damageProp(this, p, dmg, { type: info.type, impulse: (info.impulse || 60) + dmg * 8, dir: info.dir });
      } else if (h.kind === 'vehicle') {
        this.fx.spark(h.point, 4);
      } else if (h.kind === 'door') {
        this.fx.impact(h.point, h.n, 'metal');
      } else {
        if (h.water) { this.fx.splash(h.point, 0.5); return; }
        this.fx.impact(h.point, h.n, H.TEX_MAT[h.tex] || 'concrete');
        if (info.type === 'bullet' && this.rng() < 0.25) this.emit({ type: 'sound', name: 'ricochet', pos: h.point, vol: 0.4 });
      }
    }

    traceLine(o, d, range, opt = {}) {
      let best = null;
      const wh = this.world.raycast(o, d, range, { water: opt.water });
      if (wh) best = { t: wh.t, point: wh.point, n: wh.n, kind: 'world', tex: wh.tex, water: !!wh.water };
      const maxT = best ? best.t : range;
      const consider = (kind, ent, box) => {
        const h = H.rayBox(o, d, box.x1, box.y1, box.z1, box.x2, box.y2, box.z2);
        if (h && h.t <= (best ? best.t : maxT)) best = { t: h.t, point: H.vadd(o, d, h.t), n: h.n, kind, ent };
      };
      for (const dd of this.doors) if (dd.solid && dd.type !== 'field') consider('door', dd, dd.box);
      if (opt.props !== false) for (const p of this.props) if (!p.dead && p !== opt.ignoreProp && (!p.held || opt.hitHeld)) consider('prop', p, H.Phys.propBox(p));
      for (const v of this.vehicles) if (v !== opt.ignoreVehicle && !(this.player.vehicle === v && opt.ignore === this.player)) consider('vehicle', v, v.box());
      for (const s of this.surfaces) for (const b of s.boxes) consider('world', null, b);
      if (opt.npcs !== false) {
        for (const n of this.npcs) {
          if (!n.alive || n === opt.ignore || n.held) continue;
          if (opt.skipTeam && n.team === opt.skipTeam) continue;
          const b = this.npcBox(n);
          const h = H.rayBox(o, d, b.x1, b.y1, b.z1, b.x2, b.y2, b.z2);
          if (h && h.t <= (best ? best.t : maxT)) {
            const pt = H.vadd(o, d, h.t);
            best = { t: h.t, point: pt, n: h.n, kind: 'npc', ent: n, head: pt.y > b.y2 - 0.32 };
          }
        }
      }
      if (opt.player && !this.player.dead) {
        const b = this.playerBox();
        if (this.player.vehicle) { const vb = this.player.vehicle.box(); b.x1 = vb.x1; b.x2 = vb.x2; b.z1 = vb.z1; b.z2 = vb.z2; b.y1 = vb.y1; b.y2 = vb.y2 + 0.8; }
        const h = H.rayBox(o, d, b.x1, b.y1, b.z1, b.x2, b.y2, b.z2);
        if (h && h.t <= (best ? best.t : maxT)) best = { t: h.t, point: H.vadd(o, d, h.t), n: h.n, kind: 'player', ent: this.player };
      }
      return best;
    }

    damagePlayer(amount, info = {}) {
      const p = this.player;
      if (p.dead || this.god || amount <= 0) return;
      let dmg = info.fixed ? amount : amount * this.skill.taken;
      if (info.type === 'poison') {
        const real = Math.min(p.hp - 1, dmg);
        p.hp -= real;
        p.poison += Math.max(0, real - 10);
        this.emit({ type: 'hurt', amount: real, dir: info.dir || null, kind: 'poison' });
        if (p.suit) this.hevSay('Обнаружен нейротоксин. Вводится антидот.');
        return;
      }
      if (p.suit && p.armor > 0 && !['fall', 'drown', 'toxic'].includes(info.type)) {
        let absorb = dmg * 0.8;
        if (absorb > p.armor) absorb = p.armor;
        p.armor -= absorb;
        dmg -= absorb;
      }
      p.hp -= dmg;
      p.lastHurtT = this.time;
      p.punch += Math.min(0.08, dmg * 0.004) * (this.rng() < 0.5 ? 1 : -1);
      this.emit({ type: 'hurt', amount: dmg, dir: info.dir || null, kind: info.type });
      this.emit({ type: 'sound', name: dmg > 15 ? 'pain_big' : 'pain' });
      if (p.hp <= 0) {
        p.hp = 0;
        p.dead = true;
        p.deadT = 0;
        if (p.held) this.dropHeld(false);
        if (p.vehicle) this.exitVehicle(true);
        p.grabbed = null;
        this.emit({ type: 'death' });
        this.emit({ type: 'sound', name: 'flatline' });
      } else if (p.suit && p.hp < 30 && info.type !== 'fall') this.hevSay('Внимание: жизненные показатели критические.');
    }

    damageNpc(n, amount, info = {}) {
      if (!n.alive || n.def.invulnerable) return;
      const pl = this.player;
      const byPlayer = info.attacker === pl || (info.attacker && info.attacker.driver === pl);
      if (byPlayer && n.team !== 'combine' && !H.hostile('player', n.team) && n.team !== 'pet') {
        if (info.type === 'bullet' || info.type === 'club') H.AI.complain(this, n);
        return;
      }
      if (n.def.rocketsOnly) {
        if (info.type !== 'rocket') { if (info.type === 'bullet') this.fx.spark(info.pos || n.pos, 3); return; }
        amount = 1;
      } else if (n.def.onlyGun) {
        if (info.weapon !== 'airboatgun') { if (info.type === 'bullet') this.fx.spark(info.pos || n.pos, 3); return; }
      } else {
        if (byPlayer) amount *= this.skill.dealt;
        if (n.def.noBullets && (info.type === 'bullet' || info.type === 'club')) amount *= n.def.noBullets;
      }
      if (info.type === 'energy' && !n.def.boss) amount = Math.max(amount, n.hp + 1);
      n.hp -= amount;
      n.lastHurtT = this.time;
      n.hurtDir = info.dir || null;
      if (info.pos && info.type !== 'blast') {
        const alien = ['antlion', 'antlionguard'].includes(n.type) || n.def.model === 'vort';
        const synth = ['manhack', 'scanner', 'turret', 'rollermine', 'hunterchopper', 'gunship', 'strider', 'apc', 'dropship'].includes(n.type);
        if (synth) this.fx.spark(info.pos, 5);
        else this.fx.blood(info.pos, info.dir, alien ? 'yellow' : 'red');
      }
      H.AI.onHurt(this, n, amount, info);
      if (n.hp <= 0) {
        if (n.essential || n.def.essential) { n.hp = 1; n.downT = 3; return; }
        this.killNpc(n, info);
      }
    }

    killNpc(n, info = {}) {
      if (!n.alive) return;
      n.alive = false;
      n.hp = 0;
      n.deadT = this.time;
      n.deathDir = info.dir || { x: 0, y: 0, z: 1 };
      n.deathType = info.type || 'bullet';
      n.state = 'dead';
      if (info.type === 'energy') n.dissolve = 0.01;
      if (n.held) this.releaseHeldNpc(n);
      const byPlayer = info.attacker === this.player || (info.attacker && info.attacker.driver === this.player);
      if (byPlayer) this.stats.kills++;
      this.flags['killed:' + n.id] = true;
      H.AI.onDeath(this, n, info);
      this.emit({ type: 'kill', npc: n.type, byPlayer });
      const dead = this.npcs.filter(x => !x.alive && !x.def.flying);
      if (dead.length > 24) {
        const old = dead[0];
        this.npcs.splice(this.npcs.indexOf(old), 1);
      }
    }

    gravTarget(range, cone) {
      const p = this.player;
      const eye = this.eye(), d = this.aimDir();
      const h = this.traceLine(eye, d, range, { ignore: p });
      if (h && h.kind === 'prop') return { ent: h.ent, dist: h.t, isNpc: false };
      if (h && h.kind === 'npc' && this.canGrabNpc(h.ent)) return { ent: h.ent, dist: h.t, isNpc: true };
      let best = null, bestScore = Math.cos(cone);
      for (const q of this.props) {
        if (q.dead || q.held) continue;
        const c = { x: q.pos.x, y: q.pos.y + q.half.y, z: q.pos.z };
        const v = H.vsub(c, eye);
        const dist = H.vlen(v);
        if (dist > range || dist < 0.2) continue;
        const dot = H.vdot(v, d) / dist;
        if (dot < bestScore) continue;
        if (!this.world.lineClear(eye, c)) continue;
        bestScore = dot;
        best = { ent: q, dist, isNpc: false };
      }
      for (const n of this.npcs) {
        if (!n.alive || !this.canGrabNpc(n)) continue;
        const c = { x: n.pos.x, y: n.pos.y + n.def.height / 2, z: n.pos.z };
        const v = H.vsub(c, eye);
        const dist = H.vlen(v);
        if (dist > range) continue;
        const dot = H.vdot(v, d) / dist;
        if (dot < bestScore) continue;
        if (!this.world.lineClear(eye, c)) continue;
        bestScore = dot;
        best = { ent: n, dist, isNpc: true };
      }
      return best;
    }

    canGrabNpc(n) {
      if (n.def.grabbable || n.def.turret) return true;
      if (this.player.superGG && n.team === 'combine' && n.def.height > 1.2 && n.def.height < 2.2 && !n.def.boss) return true;
      return false;
    }

    gravgun(inp, pr, dt) {
      const p = this.player;
      const maxMass = p.superGG ? 3000 : 260;
      if (p.held) {
        if (pr.fire1) this.launchHeld(null);
        else if (pr.fire2) this.dropHeld(true);
        return;
      }
      if (pr.fire1 && p.fireCd <= 0) {
        p.fireCd = 0.5;
        const t = this.gravTarget(p.superGG ? 12 : 4.5, 0.25);
        this.emit({ type: 'viewanim', anim: 'punt' });
        if (!t) { this.emit({ type: 'sound', name: 'gg_dry' }); return; }
        const d = this.aimDir();
        this.emit({ type: 'sound', name: 'gg_punt' });
        this.fx.beam(H.vadd(this.eye(), d, 0.5), t.isNpc ? t.ent.pos : t.ent.pos, p.superGG ? [0.5, 0.8, 1.4] : [1.2, 0.7, 0.25], 0.06, 0.12);
        if (t.isNpc) this.puntNpc(t.ent, d);
        else {
          const q = t.ent;
          H.Phys.wake(q);
          const sp = H.clamp(1100 / (q.mass + 10), 6, 30) * (p.superGG ? 1.6 : 1);
          q.vel.x += d.x * sp; q.vel.y += d.y * sp + 1.5; q.vel.z += d.z * sp;
          q.spin.p += (this.rng() - 0.5) * 10; q.spin.r += (this.rng() - 0.5) * 10;
          q.thrownBy = 'player'; q.thrownT = this.time;
          if (q.def.hp && p.superGG) H.Phys.damageProp(this, q, 999, { type: 'crush' });
          if (q.def.explode && q.hp < q.def.hp) q.thrownT = this.time;
        }
        return;
      }
      if (inp.fire2) {
        const t = this.gravTarget(p.superGG ? 30 : 22, 0.14);
        if (!t) { if (pr.fire2) this.emit({ type: 'sound', name: 'gg_dry' }); return; }
        if (!t.isNpc && (t.ent.mass > maxMass || t.ent.frozen)) { if (pr.fire2) this.emit({ type: 'sound', name: 'gg_deny' }); return; }
        if (t.dist < 3.4) { this.grab(t.ent, 'gravgun', t.isNpc); return; }
        this.emit({ type: 'gghum' });
        const eye = this.eye();
        if (t.isNpc) {
          const n = t.ent;
          const v = H.vnorm(H.vsub(eye, n.pos));
          n.pos.x += v.x * 6 * dt; n.pos.z += v.z * 6 * dt;
        } else {
          const q = t.ent;
          H.Phys.wake(q);
          const v = H.vnorm(H.vsub(eye, { x: q.pos.x, y: q.pos.y + q.half.y, z: q.pos.z }));
          const k = Math.min(30, 4000 / (q.mass + 40)) * dt;
          q.vel.x += v.x * k * 6; q.vel.y += v.y * k * 6 + H.GRAVITY * dt * 0.9; q.vel.z += v.z * k * 6;
          const sp = H.vlen(q.vel);
          if (sp > 12) q.vel = H.vscale(q.vel, 12 / sp);
        }
      }
    }

    puntNpc(n, d) {
      const p = this.player;
      if (p.superGG && n.team === 'combine' && !n.def.boss) {
        this.damageNpc(n, 1000, { type: 'energy', attacker: p, dir: d, pos: n.pos });
        n.vel = H.vscale(d, 20);
        return;
      }
      if (n.def.turret) { H.AI.tipTurret(this, n, d); return; }
      n.vel = n.vel || { x: 0, y: 0, z: 0 };
      n.vel.x += d.x * 9; n.vel.y += 3; n.vel.z += d.z * 9;
      n.knockT = 0.6;
      if (!n.def.invulnerable) this.damageNpc(n, n.def.height < 0.6 ? 12 : 4, { type: 'club', attacker: p, dir: d, pos: n.pos });
    }

    grab(ent, mode, isNpc) {
      const p = this.player;
      if (isNpc) {
        if (p.superGG && ent.team === 'combine' && !ent.def.grabbable && !ent.def.turret) {
          this.damageNpc(ent, 1000, { type: 'energy', attacker: p, pos: ent.pos });
          const body = H.Phys.makeProp(this, 'body', ent.pos.x, ent.pos.y, ent.pos.z, { yaw: ent.yaw });
          body.skin = ent.def.model;
          const idx = this.npcs.indexOf(ent);
          if (idx >= 0) this.npcs.splice(idx, 1);
          ent = body;
          isNpc = false;
        }
      }
      const holder = { ent, mode, isNpc: !!isNpc, target: H.vcopy(ent.pos), yaw: ent.yaw || 0, stuck: 0, npcHeld: null };
      this.flags['held:' + mode] = true;
      p.held = holder;
      if (isNpc) { ent.held = holder; ent.state = 'held'; }
      else { ent.held = holder; H.Phys.wake(ent); }
      this.updateHeldTarget();
      this.emit({ type: 'sound', name: mode === 'gravgun' ? 'gg_pickup' : 'pickup_prop' });
    }

    updateHeldTarget() {
      const p = this.player;
      const h = p.held;
      if (!h) return;
      const e = h.ent;
      if (e.dead || (h.isNpc && !e.alive && !e.def.turret)) { p.held = null; return; }
      const half = h.isNpc ? { x: 0.4, y: 0.3, z: 0.4 } : e.half;
      const reach = (h.mode === 'use' ? 1.0 : 1.35) + Math.max(half.x, half.z, half.y) * 1.2;
      const eye = this.eye(), d = this.aimDir();
      h.target = { x: eye.x + d.x * reach, y: eye.y + d.y * reach - half.y - 0.15, z: eye.z + d.z * reach };
      const minY = p.pos.y - 0.3;
      if (h.target.y < minY && Math.hypot(h.target.x - p.pos.x, h.target.z - p.pos.z) < 0.9) h.target.y = minY;
      h.yaw = p.yaw;
      if (!h.isNpc && h.stuck > 0.6) this.dropHeld(false);
    }

    updateHeldNpc(dt) {
      const p = this.player;
      const h = p.held;
      if (!h || !h.isNpc) return;
      const n = h.ent;
      const v = H.vsub(h.target, n.pos);
      const d = H.vlen(v);
      const k = Math.min(1, 12 * dt);
      const extra = this.obstaclesFor(n);
      this.world.moveBox(n.pos, n.def.radius || 0.3, n.def.height, H.vscale(v, k), { extra });
      n.yaw = H.turnTo(n.yaw, p.yaw, dt * 5);
      h.stuck = d > 2 ? h.stuck + dt : 0;
      if (h.stuck > 0.6) this.dropHeld(false);
      if (n.type === 'manhack') H.AI.heldManhackHits(this, n);
    }

    launchHeld(speedOverride) {
      const p = this.player;
      const h = p.held;
      if (!h) return;
      const d = this.aimDir();
      const e = h.ent;
      p.held = null;
      e.held = null;
      p.fireCd = 0.5;
      this.emit({ type: 'sound', name: h.mode === 'gravgun' ? 'gg_launch' : 'throw' });
      this.flags['thrown:' + h.mode] = true;
      if (h.mode === 'gravgun') {
        this.emit({ type: 'viewanim', anim: 'punt' });
        this.fx.beam(H.vadd(this.eye(), d, 0.5), e.pos, p.superGG ? [0.5, 0.8, 1.4] : [1.2, 0.7, 0.25], 0.07, 0.12);
      }
      if (h.isNpc) {
        const sp = speedOverride || 18;
        H.AI.launched(this, e, H.vscale(d, sp));
        return;
      }
      const sp = speedOverride || H.clamp(1100 / (e.mass + 10), 7, 32) * (p.superGG ? 1.5 : 1);
      e.vel = { x: d.x * sp + p.vel.x * 0.3, y: d.y * sp + 1, z: d.z * sp + p.vel.z * 0.3 };
      e.spin.p = (this.rng() - 0.5) * 8; e.spin.r = (this.rng() - 0.5) * 8;
      e.thrownBy = 'player';
      e.thrownT = this.time;
      e.sleeping = false;
    }

    dropHeld(soft) {
      const p = this.player;
      const h = p.held;
      if (!h) return;
      p.held = null;
      h.ent.held = null;
      if (h.isNpc) H.AI.launched(this, h.ent, { x: 0, y: 0, z: 0 });
      else { h.ent.vel = { x: p.vel.x * 0.5, y: 0.5, z: p.vel.z * 0.5 }; h.ent.sleeping = false; }
      if (soft) this.emit({ type: 'sound', name: h.mode === 'gravgun' ? 'gg_drop' : 'drop_prop' });
    }

    releaseHeldNpc(n) {
      const p = this.player;
      if (p.held && p.held.ent === n) { p.held = null; n.held = null; }
    }

    updateDoors(dt) {
      const pl = this.player;
      for (const d of this.doors) {
        if (d.auto && !d.locked) {
          const c = this.doorCenter(d);
          let near = Math.hypot(pl.pos.x - c.x, pl.pos.z - c.z) < 3 && Math.abs(pl.pos.y - d.base[1]) < 2.5;
          if (!near) for (const n of this.npcs) if (n.alive && !n.def.flying && Math.hypot(n.pos.x - c.x, n.pos.z - c.z) < 2.4 && (d.autoTeam ? n.team === d.autoTeam : n.team !== 'zombie')) { near = true; break; }
          if (near) { if (!d.open) this.doorCmd(d.id, 'open'); d.closeT = 2.5; }
          else if (d.open) { d.closeT -= dt; if (d.closeT <= 0) this.doorCmd(d.id, 'close'); }
        }
        const target = d.open ? 1 : 0;
        if (d.t !== target) {
          const oldTop = d.box.y2, ob = { x1: d.box.x1, z1: d.box.z1, x2: d.box.x2, z2: d.box.z2 };
          d.t = H.approach(d.t, target, dt * d.speed);
          this.updateDoorBox(d);
          const dy = d.box.y2 - oldTop;
          if (d.lift && Math.abs(dy) > 1e-6) this.carryOnLift(ob, oldTop, dy, d.box.x2 - ob.x2, d.box.z2 - ob.z2);
        }
      }
    }

    carryOnLift(b, top, dy, dx, dz) {
      const on = (pos, r) => pos.x + r > b.x1 && pos.x - r < b.x2 && pos.z + r > b.z1 && pos.z - r < b.z2 && Math.abs(pos.y - top) < 0.12;
      const pl = this.player;
      if (!pl.dead && on(pl.pos, PR * 0.9)) { pl.pos.y = top + dy + 0.001; pl.pos.x += dx; pl.pos.z += dz; if (dy > 0) pl.vel.y = Math.max(0, pl.vel.y); pl.onGround = true; }
      for (const n of this.npcs) if (n.alive && !n.def.flying && on(n.pos, 0.3)) { n.pos.y = top + dy + 0.001; n.pos.x += dx; n.pos.z += dz; }
      for (const q of this.props) if (!q.dead && !q.held && on(q.pos, Math.min(q.half.x, q.half.z))) { q.pos.y = top + dy + 0.001; q.pos.x += dx; q.pos.z += dz; }
    }

    updateProjectiles(dt) {
      const w = this.world;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const q = this.projectiles[i];
        q.t += dt;
        let remove = false;
        if (q.kind === 'grenade' || q.kind === 'bait' || q.kind === 'bomb') {
          q.vel.y -= H.GRAVITY * dt;
          const step = H.vscale(q.vel, dt);
          const len = H.vlen(step);
          const h = len > 0 ? this.traceLine(q.pos, H.vscale(step, 1 / len), len + 0.08, { ignore: q.owner, player: q.owner !== this.player, props: true }) : null;
          if (h) {
            q.pos = H.vadd(h.point, h.n || { x: 0, y: 1, z: 0 }, 0.08);
            if (q.kind === 'bait') { this.baitLanded(q.pos); remove = true; }
            else if (q.kind === 'bomb' && q.t > 0.3) { H.Phys.explode(this, q.pos, 90, 6, q.owner); remove = true; }
            else {
              const n = h.n || { x: 0, y: 1, z: 0 };
              const vn = H.vdot(q.vel, n);
              q.vel = H.vscale(H.vsub(q.vel, H.vscale(n, 1.6 * vn)), 0.45);
              if (Math.abs(vn) > 2) this.emit({ type: 'sound', name: 'grenade_bounce', pos: q.pos, vol: 0.5 });
            }
          } else q.pos = H.vadd(q.pos, step);
          if (q.kind === 'grenade') {
            q.fuse -= dt;
            if (q.fuse <= 0) { H.Phys.explode(this, q.pos, 125, 6.5, q.owner); remove = true; }
            q.blink = (q.blink || 0) + dt;
          }
        } else if (q.kind === 'smggren') {
          q.vel.y -= H.GRAVITY * dt;
          const step = H.vscale(q.vel, dt);
          const len = H.vlen(step);
          const h = this.traceLine(q.pos, H.vscale(step, 1 / len), len, { ignore: q.owner, player: q.owner !== this.player });
          if (h) { H.Phys.explode(this, h.point, 100, 5, q.owner); remove = true; }
          else q.pos = H.vadd(q.pos, step);
        } else if (q.kind === 'rocket') {
          q.speed = Math.min(26, q.speed + dt * 30);
          if (q.guided && q.owner === this.player && this.player.cur === 'rpg' && this.player.laser && !this.player.dead) {
            const eye = this.eye(), ad = this.aimDir();
            const lh = this.traceLine(eye, ad, 300, { ignore: this.player });
            const tgt = lh ? lh.point : H.vadd(eye, ad, 300);
            const want = H.vnorm(H.vsub(tgt, q.pos));
            const turn = Math.min(1, 3.2 * dt);
            q.dir = H.vnorm(H.vadd(H.vscale(q.dir, 1 - turn), want, turn));
          } else if (q.target && q.target.alive !== false) {
            const tp = q.target.pos ? { x: q.target.pos.x, y: q.target.pos.y + 1, z: q.target.pos.z } : q.target;
            const want = H.vnorm(H.vsub(tp, q.pos));
            const turn = Math.min(1, 1.2 * dt);
            q.dir = H.vnorm(H.vadd(H.vscale(q.dir, 1 - turn), want, turn));
          }
          const len = q.speed * dt;
          const h = this.traceLine(q.pos, q.dir, len, { ignore: q.owner, player: q.owner !== this.player });
          if (h || q.t > 8) {
            const pt = h ? H.vadd(h.point, q.dir, -0.2) : q.pos;
            if (h && h.kind === 'npc') this.damageNpc(h.ent, 150, { type: 'rocket', attacker: q.owner, dir: q.dir, pos: pt });
            H.Phys.explode(this, pt, q.owner === this.player ? 150 : 70, 5, q.owner);
            remove = true;
          } else {
            q.pos = H.vadd(q.pos, q.dir, len);
            if (this.rng() < 0.7) this.fx.smoke(q.pos, 1, [0.55, 0.55, 0.55], 0.22);
            this.fx.add({ pos: H.vcopy(q.pos), life: 0.05, size: 0.3, col: [1, 0.7, 0.3], blend: 'add' });
            if (q.t < 0.1 || this.rng() < 0.2) this.addDynLight(q.pos, [1.1, 0.7, 0.3], 4, 0.05);
          }
        } else if (q.kind === 'bolt') {
          q.vel.y -= 1.5 * dt;
          const step = H.vscale(q.vel, dt);
          const len = H.vlen(step);
          const dir = H.vscale(step, 1 / len);
          const h = this.traceLine(q.pos, dir, len, { ignore: q.owner, water: false });
          if (h) {
            if (h.kind === 'npc') this.damageNpc(h.ent, q.dmg, { type: 'bullet', attacker: q.owner, dir, pos: h.point, weapon: 'crossbow' });
            else if (h.kind === 'prop') H.Phys.damageProp(this, h.ent, q.dmg, { type: 'bullet', impulse: 500, dir });
            else { this.fx.spark(h.point, 5); this.emit({ type: 'sound', name: 'bolt_hit', pos: h.point }); }
            remove = true;
          } else q.pos = H.vadd(q.pos, step);
        } else if (q.kind === 'ball') {
          const step = H.vscale(q.vel, dt);
          const len = H.vlen(step);
          const dir = H.vscale(step, 1 / len);
          const h = this.traceLine(q.pos, dir, len + 0.2, { ignore: q.owner, player: q.owner !== this.player });
          if (h) {
            if (h.kind === 'npc') {
              this.damageNpc(h.ent, q.owner === this.player ? 1000 : 40, { type: 'energy', attacker: q.owner, dir, pos: h.point });
              if (h.ent.alive) q.bounces += 3;
              q.pos = H.vadd(q.pos, step);
            } else if (h.kind === 'player') {
              this.damagePlayer(q.owner && q.owner.team === 'combine' ? 25 : 15, { type: 'energy', dir });
              remove = true;
            } else {
              const n = h.n || { x: 0, y: 1, z: 0 };
              const vn = H.vdot(q.vel, n);
              q.vel = H.vsub(q.vel, H.vscale(n, 2 * vn));
              q.pos = H.vadd(h.point, n, 0.25);
              q.bounces++;
              this.emit({ type: 'sound', name: 'ball_bounce', pos: q.pos, vol: 0.6 });
              if (h.kind === 'prop') H.Phys.damageProp(this, h.ent, 30, { type: 'energy', impulse: 400, dir });
            }
          } else q.pos = H.vadd(q.pos, step);
          if (q.t > q.life || q.bounces > 9) {
            this.fx.spark(q.pos, 20, [0.6, 0.9, 1]);
            this.addDynLight(q.pos, [0.7, 1, 1.4], 6, 0.3);
            this.emit({ type: 'sound', name: 'ball_explode', pos: q.pos });
            remove = true;
          }
        } else if (q.kind === 'crab') {
          remove = true;
        }
        if (q.pos.y < -80) remove = true;
        if (remove) this.projectiles.splice(i, 1);
      }
    }

    baitLanded(pos) {
      this.emit({ type: 'sound', name: 'bugbait_splat', pos });
      this.fx.blood(pos, null, 'yellow');
      let target = null, bestD = 5;
      for (const n of this.npcs) {
        if (!n.alive || n.team !== 'combine') continue;
        const d = H.dist(n.pos, pos);
        if (d < bestD) { bestD = d; target = n; }
      }
      for (const n of this.npcs) {
        if (!n.alive || n.team !== 'pet') continue;
        n.bait = H.vcopy(pos);
        n.baitT = 12;
        n.follow = false;
        if (target) n.enemy = target;
      }
      this.flags.baitThrown = (this.flags.baitThrown || 0) + 1;
    }

    updateItems(dt) {
      for (const it of this.items) {
        it.spin += dt;
        if (it.settled) continue;
        it.vel.y -= H.GRAVITY * dt;
        const g = this.world.surfaceAt(it.pos.x, it.pos.z, it.pos.y + 0.2, 0.05);
        it.pos.x += it.vel.x * dt; it.pos.z += it.vel.z * dt;
        it.pos.y += it.vel.y * dt;
        if (it.pos.y <= g) { it.pos.y = g; it.vel = { x: 0, y: 0, z: 0 }; it.settled = true; }
      }
    }

    updateHazards(dt) {
      const pb = this.playerBox();
      for (const h of this.hazards) {
        if (!h.on) continue;
        h.t += dt;
        const b = h.box;
        if (h.type === 'fire' && this.rng() < 0.6) this.fx.fire({ x: H.lerp(b.x1, b.x2, this.rng()), y: b.y1, z: H.lerp(b.z1, b.z2, this.rng()) });
        if (h.type === 'electric' && this.rng() < 0.1) this.fx.spark({ x: H.lerp(b.x1, b.x2, this.rng()), y: H.lerp(b.y1, b.y2, this.rng()), z: H.lerp(b.z1, b.z2, this.rng()) }, 4, [0.6, 0.8, 1]);
        const inside = bb => bb.x2 > b.x1 && bb.x1 < b.x2 && bb.y2 > b.y1 && bb.y1 < b.y2 && bb.z2 > b.z1 && bb.z1 < b.z2;
        if (!this.player.dead && inside(pb)) {
          if (h.type === 'kill' || h.type === 'crush') this.damagePlayer(1000, { type: 'crush', fixed: true });
          else this.hurtOverTime('hz:' + h.id, h.dps * dt, h.type === 'fire' ? 'fire' : h.type);
        }
        for (const n of this.npcs) {
          if (!n.alive || !inside(this.npcBox(n))) continue;
          this.damageNpc(n, h.dps * dt * (h.type === 'blades' ? 1 : 2), { type: h.type === 'blades' ? 'slash' : h.type === 'fire' ? 'fire' : 'shock', pos: H.vcopy(n.pos) });
        }
      }
    }

    updateChargers(dt, inp) {
      const p = this.player;
      let using = null;
      if (inp.use && !p.dead && !p.vehicle && !p.held) {
        const t = this.useTarget();
        if (t && t.kind === 'charger') using = t.ent;
      }
      for (const c of this.chargers) {
        const was = c.active;
        c.active = c === using;
        if (!c.active) { c.gave = false; if (was && c.type !== 'rockets') this.emit({ type: 'sound', name: 'charger_stop' }); continue; }
        if (c.type === 'rockets') { c.tick += dt; if (c.tick > 1.2) { c.tick = 0; c.gave = false; } else if (!c.gave) { c.tick = 0; } if (p.ammo.rocket < H.AMMO.rocket.max && !c.gave) { p.ammo.rocket++; c.gave = true; this.emit({ type: 'sound', name: 'pickup' }); this.emit({ type: 'pickup', item: 'ammo_rocket' }); if (!p.weapons.rpg) this.give('rpg', 0); } continue; }
        if (c.charge <= 0) { if (!was) this.emit({ type: 'sound', name: 'use_deny' }); continue; }
        c.tick += dt;
        if (!was) this.emit({ type: 'sound', name: 'charger_start' });
        if (c.tick < 0.1) continue;
        c.tick = 0;
        if (c.type === 'health' && p.hp < 100) { p.hp = Math.min(100, p.hp + 1); c.charge--; }
        else if (c.type === 'suit' && p.suit && p.armor < 100) { p.armor = Math.min(100, p.armor + 1); c.charge--; }
      }
    }

    runScripts(dt) {
      for (const s of this.scripts) {
        if (!s.enabled) continue;
        if (!s.running) {
          if (s.fired) continue;
          if (!this.checkWhen(s.def.when)) continue;
          s.running = true;
          s.pc = 0;
          s.wait = 0;
          s.fired = !s.def.repeat;
        }
        this.runScript(s, dt);
      }
    }

    runScript(s, dt) {
      if (s.wait > 0) {
        s.wait -= dt;
        if (s.wait > 0) return;
      }
      for (let guard = 0; guard < 60 && s.running; guard++) {
        const st = s.def.steps[s.pc];
        if (!st) { s.running = false; return; }
        const r = this.execStep(s, st);
        if (r === false) return;
        s.pc++;
        if (typeof r === 'number' && r > 0) { s.wait = r; return; }
      }
    }

    checkWhen(w) {
      if (!w || w === 'start') return true;
      if (typeof w === 'function') return !!w(this);
      const p = this.player;
      const pos = p.vehicle ? p.vehicle.pos : p.pos;
      if (w.zone) return this.world.zoneHas(w.zone, pos) && !p.dead;
      if (w.dead) return this.tagDead(w.dead);
      if (w.flag) return !!this.flags[w.flag];
      if (w.noflag) return !this.flags[w.noflag];
      if (w.use) return !!this.flags['use:' + w.use];
      if (w.btn) return !!this.flags['btn:' + w.btn];
      if (w.time !== undefined) return this.time >= w.time;
      if (w.all) return w.all.every(c => this.checkWhen(c));
      if (w.any) return w.any.some(c => this.checkWhen(c));
      if (w.npcZone) return this.npcs.some(n => n.alive && (n.tag === w.npcZone[0] || n.id === w.npcZone[0]) && this.world.zoneHas(w.npcZone[1], n.pos));
      if (w.propZone) return this.props.some(q => !q.dead && q.tag === w.propZone[0] && this.world.zoneHas(w.propZone[1], q.pos));
      if (w.count) return this.tagCount(w.count[0]) <= w.count[1];
      if (w.gone) return !this.props.some(q => !q.dead && q.tag === w.gone) && !this.npcs.some(n => n.alive && n.tag === w.gone);
      return false;
    }

    execStep(s, st) {
      const op = st[0], a = st.slice(1);
      switch (op) {
        case 'say': { const dur = a[2] || this.sayDur(a[1]); this.say(a[0], a[1], dur); return dur; }
        case 'sayq': this.say(a[0], a[1], a[2] || this.sayDur(a[1])); return true;
        case 'wait': return a[0];
        case 'until': return this.checkWhen(a[0]) ? true : false;
        case 'hint': this.emit({ type: 'hint', text: a[0], dur: a[1] || 6 }); return true;
        case 'group': this.spawnGroup(a[0]); return true;
        case 'spawn': this.spawnFrom(Object.assign({ kind: a[0], type: a[1], x: a[2], z: a[3] }, a[4] || {})); return true;
        case 'door': this.doorCmd(a[0], a[1]); return true;
        case 'npc': this.npcCmd(a[0], a[1], a.slice(2)); return true;
        case 'give': this.give(a[0], a[1]); return true;
        case 'strip': this.strip(a[0]); return true;
        case 'flag': this.flags[a[0]] = a.length > 1 ? a[1] : true; return true;
        case 'sound': this.emit({ type: 'sound', name: a[0], pos: a[1] || null, vol: a[2] || 1 }); return true;
        case 'music': this.emit({ type: 'music', name: a[0] }); return true;
        case 'shake': this.emit({ type: 'shake', amount: a[0], dur: a[1] || 1 }); return true;
        case 'flash': this.emit({ type: 'flash', col: a[0], dur: a[1] || 0.5 }); return true;
        case 'fade': this.emit({ type: 'fade', col: a[0], dur: a[1] || 1, hold: a[2] || 0 }); return true;
        case 'teleport': {
          const sp = typeof a[0] === 'string' ? this.world.spots[a[0]] : { x: a[0], z: a[1], y: a[2], yaw: a[3] };
          if (this.player.vehicle) this.exitVehicle(true);
          this.placePlayer(sp);
          return true;
        }
        case 'freeze': this.player.frozen = a[0] !== false; return true;
        case 'autosave': this.emit({ type: 'autosave' }); return true;
        case 'changelevel': this.pendingMap = a[0]; this.pendingSpot = a[1] || null; return true;
        case 'title': this.emit({ type: 'title', chapter: a[0] }); return true;
        case 'credits': this.emit({ type: 'credits' }); this.flags.credits = true; return true;
        case 'enable': this.scripts.forEach(x => { if (x.id === a[0]) x.enabled = true; }); return true;
        case 'disable': this.scripts.forEach(x => { if (x.id === a[0]) x.enabled = false; }); return true;
        case 'hazard': this.hazards.forEach(h => { if (h.id === a[0]) h.on = a[1] !== false; }); return true;
        case 'kill': this.npcsByTag(a[0]).forEach(n => this.killNpc(n, { type: a[1] || 'bullet' })); return true;
        case 'remove':
          this.npcs = this.npcs.filter(n => n.tag !== a[0] && n.id !== a[0]);
          this.props.forEach(q => { if (q.tag === a[0] || q.id === a[0]) q.dead = true; });
          this.items.forEach(i => { if (i.tag === a[0]) i.dead = true; });
          this.items = this.items.filter(i => !i.dead);
          return true;
        case 'vehicle': this.vehicles.forEach(v => { if (v.id === a[0] || v.type === a[0]) Object.assign(v, a[1]); }); return true;
        case 'player': Object.assign(this.player, a[0]); return true;
        case 'explode': { const sp = this.world.spots[a[0]]; if (sp) H.Phys.explode(this, { x: sp.x, y: sp.y || 0, z: sp.z }, a[1] || 100, a[2] || 5, null); return true; }
        case 'do': { const r = a[0](this, s); return r === undefined ? true : r; }
        case 'lambda': this.emit({ type: 'hint', text: a[0], dur: 4 }); return true;
      }
      throw new Error('hl2: unknown script op ' + op);
    }

    npcCmd(tag, action, args) {
      for (const n of this.npcsByTag(tag)) {
        switch (action) {
          case 'goto': n.script = { goto: { x: args[0], y: args[3] !== undefined ? args[3] : null, z: args[1] }, run: !!args[2] }; n.path = null; break;
          case 'path': n.script = { path: args[0], i: 0, run: !!args[1], loop: !!args[2] }; n.path = null; break;
          case 'follow': n.follow = true; n.script = null; n.hold = null; n.inSquad = n.def.squad || n.inSquad; break;
          case 'squad': n.follow = true; n.inSquad = true; n.script = null; break;
          case 'stay': n.follow = false; n.script = null; n.hold = null; break;
          case 'team': n.team = args[0]; n.enemy = null; break;
          case 'face': n.faceT = args[0] === 'player' ? 'player' : args[0]; break;
          case 'weapon': n.weapon = args[0]; break;
          case 'teleport': n.pos = { x: args[0], y: args[2] !== undefined ? args[2] : this.world.spawnY(args[0], args[1], null, 0.2), z: args[1] }; n.path = null; break;
          case 'hate': n.sleep = false; n.enemy = this.player; n.state = 'combat'; n.lastSeenT = this.time; n.lastSeenPos = H.vcopy(this.player.pos); break;
          case 'passive': n.passive = args[0] !== false; break;
          case 'anim': n.act = args[0]; n.actT = args[1] || 1.5; break;
          case 'yaw': n.yaw = args[0]; n.faceT = null; break;
          case 'set': Object.assign(n, args[0]); break;
          case 'hp': n.hp = args[0]; break;
        }
      }
    }

    give(what, count) {
      const p = this.player;
      this.flags['got:' + what] = true;
      if (what === 'suit') { p.suit = true; this.emit({ type: 'suit' }); return; }
      if (what === 'supergg') { p.superGG = true; p.weapons.gravgun = true; this.switchTo('gravgun'); return; }
      if (H.WEAPONS[what]) {
        const had = p.weapons[what];
        p.weapons[what] = true;
        const w = H.WEAPONS[what];
        if (w.clip && !had) p.clip[what] = w.clip;
        if (w.ammo && count) p.ammo[w.ammo] = Math.min(H.AMMO[w.ammo].max, p.ammo[w.ammo] + count);
        if (!had) this.switchTo(what);
        return;
      }
      if (H.AMMO[what]) { p.ammo[what] = Math.min(H.AMMO[what].max, p.ammo[what] + (count || 1)); return; }
      if (what === 'health') { p.hp = Math.min(100, p.hp + (count || 100)); return; }
      if (what === 'armor') { p.armor = Math.min(100, p.armor + (count || 100)); }
    }

    strip(keep) {
      const p = this.player;
      if (p.held) this.dropHeld(false);
      const keepList = keep ? [].concat(keep) : [];
      for (const k of Object.keys(p.weapons)) if (!keepList.includes(k)) delete p.weapons[k];
      p.cur = null;
      if (keepList.length) this.switchTo(keepList[0]);
    }

    serialize() {
      const p = this.player;
      const pos = v => [Math.round(v.x * 1000) / 1000, Math.round(v.y * 1000) / 1000, Math.round(v.z * 1000) / 1000];
      return {
        v: 1, map: this.mapId, skill: this.skillIndex, time: this.time, seed: this.seed,
        player: {
          pos: pos(p.pos), yaw: p.yaw, pitch: p.pitch, hp: p.hp, armor: p.armor, aux: p.aux, suit: p.suit, weapons: p.weapons, ammo: p.ammo, clip: p.clip, cur: p.cur,
          superGG: p.superGG, ducked: p.ducked, vehicle: p.vehicle ? p.vehicle.id : null, frozen: p.frozen, poison: p.poison
        },
        npcs: this.npcs.filter(n => n.alive || !n.def.flying).map(n => H.AI.serialize(n)),
        props: this.props.filter(q => !q.dead).map(q => ({ id: q.id, type: q.type, pos: pos(q.pos), yaw: q.yaw, hp: q.hp, tag: q.tag, frozen: q.frozen, contains: q.contains, skin: q.skin || null })),
        items: this.items.map(i => ({ id: i.id, type: i.type, pos: pos(i.pos), tag: i.tag })),
        doors: this.doors.map(d => ({ id: d.id, open: d.open, locked: d.locked, t: d.t })),
        buttons: this.buttons.map(b => ({ id: b.id, pressed: b.pressed, locked: b.locked })),
        chargers: this.chargers.map(c => ({ id: c.id, charge: c.charge })),
        hazards: this.hazards.map(h => ({ id: h.id, on: h.on })),
        vehicles: this.vehicles.map(v => ({ id: v.id, type: v.type, pos: pos(v.pos), yaw: v.yaw, gun: v.gun, locked: v.locked, noExit: v.noExit })),
        surfaces: this.surfaces.map(s => ({ id: s.id, angle: s.angle, yEnd: s.yEnd })),
        scripts: this.scripts.map(s => ({ id: s.id, fired: s.fired, running: s.running, pc: s.pc, wait: s.wait, enabled: s.enabled })),
        flags: this.flags, stats: this.stats
      };
    }

    restore(sv) {
      const p = this.player;
      this.time = sv.time || 0;
      this.flags = Object.assign({}, sv.flags);
      this.stats = Object.assign(this.stats, sv.stats);
      const P = sv.player;
      p.pos = { x: P.pos[0], y: P.pos[1], z: P.pos[2] };
      Object.assign(p, { yaw: P.yaw, pitch: P.pitch, hp: P.hp, armor: P.armor, aux: P.aux, suit: P.suit, weapons: Object.assign({}, P.weapons), cur: P.cur, superGG: !!P.superGG, ducked: !!P.ducked, frozen: !!P.frozen, poison: P.poison || 0 });
      Object.assign(p.ammo, P.ammo);
      p.clip = Object.assign({}, P.clip);
      p.height = p.ducked ? DUCK_H : STAND_H;
      p.duckAmt = p.ducked ? 1 : 0;
      for (const s of this.world.spawns) {
        if (s.kind === 'door') this.makeDoor(s);
        else if (s.kind === 'charger') this.makeCharger(s);
        else if (s.kind === 'button') this.makeButton(s);
        else if (s.kind === 'hazard') this.makeHazard(s);
        else if ((s.kind === 'seesaw' || s.kind === 'floatramp') && !s.group) this.spawnFrom(s);
      }
      for (const d of sv.doors || []) { const x = this.doors.find(q => q.id === d.id); if (x) { x.open = d.open; x.locked = d.locked; x.t = d.t; this.updateDoorBox(x); } }
      for (const b of sv.buttons || []) { const x = this.buttons.find(q => q.id === b.id); if (x) { x.pressed = b.pressed; x.locked = b.locked; } }
      for (const c of sv.chargers || []) { const x = this.chargers.find(q => q.id === c.id); if (x) x.charge = c.charge; }
      for (const h of sv.hazards || []) { const x = this.hazards.find(q => q.id === h.id); if (x) x.on = h.on; }
      for (const s of sv.surfaces || []) { const x = this.surfaces.find(q => q.id === s.id); if (x) { x.angle = s.angle; x.yEnd = s.yEnd; } }
      for (const q of sv.props || []) {
        const pr = H.Phys.makeProp(this, q.type, q.pos[0], q.pos[1], q.pos[2], { id: q.id, yaw: q.yaw, tag: q.tag, frozen: q.frozen, contains: q.contains, sleep: true });
        if (q.hp !== undefined) pr.hp = q.hp;
        if (q.skin) pr.skin = q.skin;
      }
      for (const i of sv.items || []) this.spawnItem(i.type, i.pos[0], i.pos[2], { id: i.id, y: i.pos[1], tag: i.tag });
      for (const n of sv.npcs || []) H.AI.deserialize(this, n);
      for (const v of sv.vehicles || []) {
        const veh = H.Vehicle.make(this, v.type, v.pos[0], v.pos[2], v.yaw, { id: v.id, y: v.pos[1] });
        veh.gun = v.gun; veh.locked = v.locked; veh.noExit = v.noExit;
        if (P.vehicle === v.id) { p.vehicle = veh; veh.driver = p; veh.enterT = -9; }
      }
      for (const s of sv.scripts || []) { const x = this.scripts.find(q => q.id === s.id); if (x) Object.assign(x, s); }
      const maxId = [...this.npcs, ...this.props, ...this.items].reduce((m, e) => Math.max(m, parseInt(String(e.id).replace(/\D/g, ''), 10) || 0), 0);
      this.nextId = Math.max(this.nextId, maxId + 1);
    }
  }

  H.Game = Game;
  H.PLAYER = { STAND_H, DUCK_H, EYE_STAND, EYE_DUCK, PR };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
