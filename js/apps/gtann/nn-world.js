(function (N) {
  'use strict';

  const GT = N.GT;
  const Phys = N.Phys;
  const HEAT = [0, 40, 170, 500, 1050, 1900, 3200];
  const HIT_MAT = { tree: 'wood', stump: 'wood', log: 'wood', rock: 'stone' };
  const SUPER_RUN = 3;
  const SUPER_JUMP_VY = 15;
  const FLY_SPEED = 12;
  const FLY_FAST = 36;
  const FLY_Y0 = -60;
  const FLY_Y1 = 400;
  N.HEAT = HEAT;
  N.crashDamage = (v, dv) => (dv > 5 ? Math.pow(dv - 5, 1.5) * 2.6 * Phys.handling(v.spec).dmg : 0);

  const SKIN = ['#e8c4a0', '#dcb08a', '#f0d0b0', '#d4a47c', '#e4bc94'];
  const HAIR = ['#2a1e14', '#4a3420', '#6a4a2a', '#1a1410', '#8a6a3a', '#b8a080', '#d8c8a0'];

  N.makeLook = (kind, rng, over) => {
    const k = N.PED_KINDS[kind] || N.PED_KINDS.worker;
    const old = !!k.old;
    const look = {
      male: k.male !== false,
      skin: rng.pick(SKIN),
      hair: old ? rng.pick(['#b8b8b0', '#d8d8d0', '#8a8a84']) : rng.pick(HAIR),
      hairStyle: k.male !== false ? rng.pick(['short', 'short', 'bald', 'short']) : rng.pick(['long', 'bob', 'long', 'bun']),
      top: rng.pick(k.tops),
      pants: rng.pick(k.pants),
      shoes: rng.pick(['#1a1a1a', '#2a1e14', '#3a3a3a', '#e8e8e8']),
      topKind: k.topKind,
      hat: rng.pick(k.hats || ['none']),
      stripes: !!k.stripes,
      stripesH: !!k.stripesH,
      skirt: !!k.skirt,
      bag: !!k.bag,
      bigBag: !!k.bigBag,
      chain: !!k.chain,
      glasses: !!k.glasses || rng.chance(0.06),
      camo: !!k.camo,
      leather: !!k.leather,
      belt: !!k.belt,
      old,
      fat: rng.chance(0.2) ? 1.18 : rng.chance(0.2) ? 0.92 : 1,
      tall: rng.range(0.94, 1.06)
    };
    return Object.assign(look, over || {});
  };

  N.playerLook = outfit => {
    const o = N.OUTFITS[outfit] || N.OUTFITS.zek;
    return { male: true, skin: '#e0b894', hair: '#2a1c12', hairStyle: 'short', top: o.top, pants: o.pants, shoes: o.shoes, topKind: o.topKind, hat: 'none', stripes: !!o.stripes, chain: !!o.chain, leather: !!o.leather, pattern: o.pattern || null, fat: 1.04, tall: 1.02, old: false, face: 9 };
  };

  class World {
    constructor(city, o = {}) {
      this.city = city;
      this.seed = o.seed || 1;
      this.rng = N.rng(this.seed);
      this.t = 0;
      this.clock = o.clock !== undefined ? o.clock : 20 * 60 + 40;
      this.clockRate = 1;
      this.wx = new N.Weather(this.seed * 7 + 13, o.weather || 'clear', e => this.emit(e));
      this.peds = [];
      this.vehs = [];
      this.pickups = [];
      this.projs = [];
      this.fires = [];
      this.ev = [];
      this.broken = new Map();
      this.debris = [];
      this.brkVer = 0;
      this.gyCache = new Map();
      this.nextId = 1;
      this.wanted = { heat: 0, level: 0, unseen: 0, flash: false, seenT: 0, lastSeen: null, noCops: false };
      this.settings = Object.assign({ traffic: 1, peds: 1, cops: true, ambient: true }, o.settings || {});
      this.cam = { x: 0, z: 0, yaw: 0 };
      this.parkedSpawned = new Map();
      this.spawnT = 0;
      this.dispatchT = 0;
      this.roadblocks = [];
      this.slowmo = 1;
      this.frozen = false;
      this.god = !!o.god;
      this.superRun = false;
      this.superJump = false;
      this.fly = false;
      this.stats = { kills: 0, copsKilled: 0, carsStolen: 0, carsDestroyed: 0, shots: 0, hits: 0, driven: 0, walked: 0, jumps: 0, headshots: 0 };
      this.grid = new Map();
      this.jump = null;
      this.lastCrimeT = -99;
      const sp = o.spawn || city.places.hotel_spawn;
      this.player = this.spawnPed('player', sp.x, sp.z, sp.yaw || 0, { look: N.playerLook(o.outfit || 'zek'), hp: 100, isPlayer: true });
      this.player.weapons = { fists: { ammo: 1, clip: 0 } };
      this.player.weapon = 'fists';
      this.player.maxArmor = 100;
      this.metro = N.Metro && city.metroLine ? new N.Metro(this) : null;
      this.park = N.Park && city.parkData ? new N.Park(this) : null;
      this.initPickups();
    }

    emit(e) { this.ev.push(e); }

    get weather() { return this.wx.kind; }

    setWeather(kind, mode, lock) { return this.wx.set(kind, mode || 'fast', lock); }

    initPickups() {
      for (const p of this.city.pickups) this.addPickup(p.type, p.x, p.z, { weapon: p.weapon, ammo: p.ammo, respawn: 90, world: true });
    }

    addPickup(type, x, z, o) {
      const p = Object.assign({ id: this.nextId++, type, x, z, y: this.city.groundY(x, z) + 0.6, taken: false, t: 0 }, o || {});
      this.pickups.push(p);
      return p;
    }

    spawnPed(kind, x, z, yaw, o = {}) {
      const k = N.PED_KINDS[kind] || {};
      const rng = this.rng;
      const p = {
        id: this.nextId++, kind: 'ped', type: kind, x, z, y: this.city.groundY(x, z), yaw: yaw || 0, vx: 0, vz: 0, vy: 0,
        wantVx: 0, wantVz: 0, onGround: true, r: 0.34,
        hp: o.hp || k.hp || 100, maxHp: o.hp || k.hp || 100, armor: k.armor || 0,
        state: 'idle', stateT: 0, dead: false, deadT: 0,
        look: o.look || N.makeLook(kind, rng),
        weapon: o.weapon !== undefined ? o.weapon : k.arms ? k.arms[(this.nextId - 1) % k.arms.length] : (k.weapon || 'fists'), clip: 0, reloadT: 0, fireT: 0,
        cop: !!k.cop, gang: !!k.gang, isPlayer: !!o.isPlayer,
        veh: null, ai: o.ai || null, tags: o.tags || null,
        anim: { phase: rng() * 6, action: null, actionT: 0, fall: 0, aim: 0, dance: 0, sit: 0 },
        money: o.money !== undefined ? o.money : Math.floor(rng.range(5, 60)),
        tough: k.tough || 0.1, persistent: !!o.persistent, friendly: !!o.friendly, blip: o.blip || null
      };
      if (p.weapon && N.WEAPONS[p.weapon]) p.clip = N.WEAPONS[p.weapon].clip || 0;
      this.peds.push(p);
      return p;
    }

    spawnVehicle(model, x, z, yaw, o = {}) {
      const spec = N.VEHICLES[model];
      const rng = this.rng;
      const liv = o.livery && spec.liveries && spec.liveries[o.livery] ? o.livery : null;
      const color = o.color || (liv ? spec.liveries[liv].c1 : rng.pick(spec.colors));
      const plateCls = N.plateClass(liv), plateIdx = Math.floor(rng() * N.PLATES[plateCls].length);
      const v = {
        id: this.nextId++, kind: 'veh', model, spec, livery: liv, color, color2: o.color2 || '#d8d8d0',
        x, z, y: this.city.groundY(x, z), yaw: yaw || 0, vx: 0, vz: 0, vy: 0, wz: 0, spd: 0, steer: 0,
        pitch: 0, roll: 0, bodyPitch: 0, wp: 0, wr: 0, air: false, wheelRot: 0, wheelRotR: 0, susp: [0, 0, 0, 0], up: 1, wheels: 4, hulls: 0,
        gear: 1, rpm: 0.2, shiftT: 0, slip: 0, spin: 0, upT: 0, hitDv: 0, hitBy: null, scrape: 0, scrapeT: 0,
        ctl: { thr: 0, steer: 0, hand: false, burn: false }, hp: o.hp || spec.hp, maxHp: o.hp || spec.hp, dead: false, fire: 0, burnT: 0,
        driver: null, pass: [], ai: o.ai || null, plate: N.PLATES[plateCls][plateIdx], plateCls, plateIdx, locked: !!o.locked,
        siren: false, horn: 0, lights: false, rev: false, ind: 0, tags: o.tags || null, persistent: !!o.persistent, blip: o.blip || null,
        parkedSpot: o.spot !== undefined ? o.spot : -1, cargo: liv && spec.liveries[liv].cargo ? spec.liveries[liv].cargo : null,
        heavy: o.heavy || 1, owner: o.owner || null, damageFactor: 1,
        door: [0, 0], doorT: [0, 0], doorHold: [0, 0]
      };
      if (spec.turret) Object.assign(v, { turretYaw: 0, gunPitch: 0, reloadT: 0, gunT: 0, coaxT: 0, recoil: 0 });
      this.vehs.push(v);
      return v;
    }

    removePed(p) {
      const i = this.peds.indexOf(p);
      if (i >= 0) this.peds.splice(i, 1);
      if (p.veh) this.unseat(p);
      p.removed = true;
    }

    removeVehicle(v) {
      const i = this.vehs.indexOf(v);
      if (i >= 0) this.vehs.splice(i, 1);
      if (v.driver && !v.driver.isPlayer) this.removePed(v.driver);
      for (const q of v.pass.slice()) if (!q.isPlayer) this.removePed(q);
      if (v.parkedSpot >= 0) this.parkedSpawned.delete(v.parkedSpot);
      v.removed = true;
    }

    seat(p, v, asDriver) {
      if (!p.isPlayer && !p.veh && v.spec.type !== 'bike') {
        const d = Math.hypot(p.x - v.x, p.z - v.z);
        if (d > v.spec.hw * 0.9 && d < v.spec.hl + 3) {
          const side = this.sideOf(v, p.x, p.z);
          p.anim.board = { t: 0, x: p.x, y: p.y, z: p.z, yaw: p.yaw, side };
          this.doorPulse(v, side, 0.5);
        }
      }
      if (asDriver !== false && !v.driver) { v.driver = p; p.seat = 0; } else { v.pass.push(p); p.seat = v.pass.length; }
      p.veh = v;
      p.state = 'drive';
      p.vx = p.vz = 0;
      p.anim.alight = null;
      p.swim = null;
    }

    sideOf(v, x, z) {
      return (x - v.x) * Math.cos(v.yaw) + (z - v.z) * Math.sin(v.yaw) >= 0 ? 1 : -1;
    }

    carLocal(v, lx, lz) {
      const c = Math.cos(v.yaw), s = Math.sin(v.yaw);
      return { x: v.x + lx * c - lz * s, z: v.z + lx * s + lz * c };
    }

    faceYaw(v, side) {
      return N.yawOf(-side * Math.cos(v.yaw), -side * Math.sin(v.yaw));
    }

    seatRootY(p, v) {
      return N.seatRoot(N.cabin(v.spec), (p.look && p.look.tall) || 1);
    }

    openDoor(v, side) {
      if (!v.door || v.spec.type === 'bike' || v.spec.shape.hatch) return;
      const i = side < 0 ? 0 : 1;
      if (v.doorT[i] < 1 && v.door[i] < 0.05) this.emit({ t: 'door', v, open: true });
      v.doorT[i] = 1;
      v.doorHold[i] = 0;
    }

    closeDoor(v, side, delay) {
      if (!v.door || v.spec.type === 'bike' || v.spec.shape.hatch) return;
      const i = side < 0 ? 0 : 1;
      if (delay) v.doorHold[i] = delay;
      else { v.doorT[i] = 0; v.doorHold[i] = 0; }
    }

    doorPulse(v, side, hold) {
      if (!v.door || v.spec.type === 'bike') return;
      this.openDoor(v, side);
      v.doorHold[side < 0 ? 0 : 1] = hold;
    }

    busy(p) {
      return !!(p.enter && p.enter.ph !== 'go' || p.exit && p.exit.ph !== 'close');
    }

    resetPed(p) {
      if (p.enter && p.enter.v) this.closeDoor(p.enter.v, p.enter.side);
      p.enter = null;
      p.exit = null;
      p.pulled = null;
      p.swim = null;
      p.wade = 0;
      p.prevWade = 0;
      p.wl = null;
      p.deepAt = 0;
      p.inWater = false;
      p.holdT = 0;
      p.anim.sit = 0;
      p.anim.board = null;
      p.anim.alight = null;
      p.anim.doorArm = null;
      p.anim.tumble = null;
      p.ride = null;
      p.eat = null;
    }

    exitRear(p) {
      const v = p.veh;
      if (!v) return;
      this.unseat(p);
      const q = this.carLocal(v, 0.45, v.spec.hl + 0.55);
      p.x = q.x;
      p.z = q.z;
      p.y = Math.max(this.city.groundY(p.x, p.z), v.y + 0.6);
      p.yaw = v.yaw + Math.PI;
      p.state = 'idle';
      p.enter = null;
      p.exit = null;
      p.anim.sit = 0;
      p.anim.board = null;
      p.anim.doorArm = null;
      p.holdT = 0.3;
    }

    unseat(p) {
      const v = p.veh;
      if (!v) return;
      if (v.driver === p) v.driver = null;
      const i = v.pass.indexOf(p);
      if (i >= 0) v.pass.splice(i, 1);
      p.veh = null;
      p.seat = -1;
    }

    doorPos(v, side) {
      const cb = N.cabin(v.spec);
      if (cb.bike) return this.carLocal(v, side * 0.75, 0.15);
      return this.carLocal(v, side * (cb.hw + 0.5), cb.door.z1 + 0.12);
    }

    exitVehicle(p, bail) {
      const v = p.veh;
      if (!v) return;
      const sides = [-1, 1];
      let pos = null, side = -1;
      for (const s of sides) {
        const d = this.doorPos(v, s);
        if (this.pedSpotFree(d.x, d.z)) { pos = d; side = s; break; }
      }
      if (!pos) pos = { x: v.x, z: v.z };
      const wasDriver = v.driver === p;
      this.unseat(p);
      p.x = pos.x;
      p.z = pos.z;
      p.y = Math.max(this.city.groundY(p.x, p.z), v.y);
      p.yaw = v.yaw;
      p.state = 'idle';
      p.enter = null;
      p.exit = null;
      p.anim.sit = 0;
      p.anim.board = null;
      p.anim.doorArm = null;
      if (bail || Math.abs(v.spd) > 6) {
        p.vx = v.vx * 0.6;
        p.vz = v.vz * 0.6;
        this.knockDown(p, 1.2);
        this.damagePed(p, Math.min(25, Math.abs(v.spd) * 0.8), null, 'fall');
      } else if (!p.isPlayer && v.spec.type !== 'bike' && pos.x !== v.x) {
        p.anim.alight = { t: 0, v, side };
        p.holdT = 0.5;
        this.doorPulse(v, side, 0.55);
      }
      if (wasDriver) { v.ctl.thr = 0; v.ctl.steer = 0; v.ctl.hand = !bail; }
      if (p.isPlayer) this.emit({ t: 'exit', v });
    }

    pedSpotFree(x, z) {
      let ok = true;
      this.city.hash.query(x - 0.4, z - 0.4, x + 0.4, z + 0.4, it => {
        if (it.brk && this.broken.has(it.brk)) return;
        if (it.circle) { if (N.dist2(x, z, it.x, it.z) < (it.r + 0.35) * (it.r + 0.35)) ok = false; return; }
        if (it.y1 <= 0.6) return;
        if (it.poly) { if (N.pointInPoly(it.poly, x, z) || N.circlePoly(x, z, 0.3, it.poly)) ok = false; return; }
        if (x > it.x0 - 0.3 && x < it.x1 + 0.3 && z > it.z0 - 0.3 && z < it.z1 + 0.3) ok = false;
      });
      if (this.city.ground(x, z) === GT.WATER) ok = false;
      return ok;
    }

    get pveh() { return this.player.veh; }

    buildGrid() {
      const g = this.grid;
      g.clear();
      const add = (e, x, z) => {
        const k = (Math.floor(x / 16) * 4096 + Math.floor(z / 16)) | 0;
        let a = g.get(k);
        if (!a) { a = []; g.set(k, a); }
        a.push(e);
      };
      for (const v of this.vehs) add(v, v.x, v.z);
      for (const p of this.peds) if (!p.veh) add(p, p.x, p.z);
    }

    near(x, z, r, fn) {
      const x0 = Math.floor((x - r) / 16), x1 = Math.floor((x + r) / 16), z0 = Math.floor((z - r) / 16), z1 = Math.floor((z + r) / 16);
      for (let ix = x0; ix <= x1; ix++) {
        for (let iz = z0; iz <= z1; iz++) {
          const a = this.grid.get((ix * 4096 + iz) | 0);
          if (!a) continue;
          for (let i = 0; i < a.length; i++) if (fn(a[i]) === true) return true;
        }
      }
      return false;
    }

    los(ax, ay, az, bx, by, bz) {
      const dx = bx - ax, dy = by - ay, dz = bz - az;
      const L = Math.hypot(dx, dy, dz);
      if (L < 0.01) return true;
      const h = Phys.rayStatic(this.city, ax, ay, az, dx / L, dy / L, dz / L, L, this, true);
      return !h || h.t >= L - 0.3;
    }

    step(dt, input) {
      dt *= this.slowmo;
      this.t += dt;
      this.clock = (this.clock + dt * this.clockRate) % 1440;
      this.stepWeather(dt);
      this.buildGrid();
      if (!this.frozen) this.stepPlayer(dt, input || {});
      else this.idlePlayer(dt);
      N.AI.step(this, dt);
      this.stepVehicles(dt);
      this.stepGreen(dt);
      this.stepPeds(dt);
      if (this.metro) this.metro.step(dt);
      if (this.park) this.park.step(dt);
      this.stepProjectiles(dt);
      this.stepFires(dt);
      N.Debris.step(this, dt);
      this.stepPickups(dt);
      this.stepWanted(dt);
      this.stepJumps(dt);
      if (this.settings.ambient) this.populate(dt);
    }

    stepWeather(dt) {
      this.wx.step(dt, this.clock / 60, this.darkness() < 0.5);
    }

    isNight() { const h = this.clock / 60; return h < 4.5 || h > 22; }
    darkness() {
      const h = this.clock / 60;
      if (h >= 6 && h <= 20.4) return 0;
      if (h > 20.4 && h < 22.4) return (h - 20.4) / 2;
      if (h >= 22.4 || h < 3.8) return 1;
      return 1 - (h - 3.8) / 2.2;
    }

    idlePlayer(dt) {
      const p = this.player;
      p.wantVx = 0;
      p.wantVz = 0;
      if (p.veh && p.veh.driver === p) { p.veh.ctl.thr = 0; p.veh.ctl.hand = true; p.veh.ctl.steer = 0; }
      const q = p.puppet;
      if (!q || p.veh || p.dead || p.state === 'down') return;
      if (q.x !== undefined && !q.arrived) {
        const d = N.AI.moveTo(p, q.x, q.z, q.spd || (q.run ? 4.6 : 1.5), dt);
        if (d < (q.r || 0.45)) { q.arrived = true; p.wantVx = p.wantVz = 0; }
      } else if (q.face) p.yaw = N.turnTo(p.yaw, N.yawOf(q.face.x - p.x, q.face.z - p.z), dt * 6);
      else if (q.yaw !== undefined) p.yaw = N.turnTo(p.yaw, q.yaw, dt * 6);
    }

    moveDir(inp, p) {
      const cy = inp.camYaw !== undefined ? inp.camYaw : p.yaw;
      const mx = (inp.right || 0), mz = (inp.fwd || 0);
      const x = Math.sin(cy) * mz + Math.cos(cy) * mx, z = -Math.cos(cy) * mz + Math.sin(cy) * mx;
      const l = Math.hypot(x, z);
      return l > 0.05 ? { x: x / l, z: z / l, k: Math.min(1, l), cy } : { x: 0, z: 0, k: 0, cy };
    }

    stepPlayer(dt, inp) {
      const p = this.player;
      if (p.dead) { this.idlePlayer(dt); return; }
      if (p.veh && (p.enter || p.exit)) { p.enter = null; p.exit = null; }
      if (p.enter) { this.stepEnter(p, dt, inp); return; }
      if (p.exit) { this.stepExit(p, dt, inp); return; }
      if (p.veh) { this.drivePlayer(p, dt, inp); return; }
      if (p.swim) { this.swimPlayer(p, dt, inp); return; }
      if (p.pulled) { this.stepPulled(p, dt); return; }
      if (p.state === 'down') { p.wantVx = p.wantVz = 0; return; }
      const md = this.moveDir(inp, p);
      if (p.mseat) {
        p.wantVx = p.wantVz = 0;
        if (md.k > 0.05 || inp.jump || inp.enter) this.metro.stand(p);
        return;
      }
      if (p.tir) {
        p.wantVx = p.wantVz = 0;
        p.yaw = N.turnTo(p.yaw, md.cy, dt * 14);
        p.anim.aim = N.approach(p.anim.aim, 1, dt * 8);
        p.scope = false;
        if (inp.enter && this.park) { this.park.tirStop(true); return; }
        this.handleWeapon(p, dt, Object.assign({}, inp, { aim: true, grenade: false, reload: false }), false);
        return;
      }
      if (p.eat && (inp.fire || inp.aim || inp.grenade || inp.enter) && this.park) this.park.stopEating(p);
      const cy = md.cy;
      const w = N.WEAPONS[p.weapon];
      const aiming = !!inp.aim && !w.melee && !p.eat;
      const scope = aiming && w.scope;
      const dirx = md.x, dirz = md.z, ml = md.k;
      let speed = 0;
      if (ml > 0.05 && !p.ride) speed = (scope ? 0 : aiming ? 2.0 : inp.walk || p.eat ? 1.6 : inp.sprint ? 6.6 : 4.3) * (w.heavy || 1) * (this.superRun ? SUPER_RUN : 1);
      p.wantVx = dirx * speed * ml;
      p.wantVz = dirz * speed * ml;
      if (aiming || (inp.fire && !w.melee && !w.throw) || inp.face && !p.ride) p.yaw = N.turnTo(p.yaw, cy, dt * 14);
      else if (ml > 0.05) p.yaw = N.turnTo(p.yaw, N.yawOf(dirx, dirz), dt * 12);
      p.anim.aim = N.approach(p.anim.aim, aiming || ((inp.fire || inp.face) && !w.melee && !w.throw) ? 1 : 0, dt * 8);
      p.scope = scope;
      if (this.fly) this.flyMove(p, md, inp);
      else if (inp.jump && p.onGround && (p.wade || 0) < 0.4 && !p.ride && !p.eat) { p.vy = this.superJump ? SUPER_JUMP_VY : 4.8; p.onGround = false; p.anim.jumpT = 0.6; }
      if (p.eat) { p.anim.aim = 0; p.charging = 0; if (inp.enter) this.park.stopEating(p); return; }
      if (inp.slot !== undefined && inp.slot !== null) this.selectSlot(p, inp.slot);
      if (inp.nextWeapon) this.cycleWeapon(p, 1);
      if (inp.prevWeapon) this.cycleWeapon(p, -1);
      this.handleWeapon(p, dt, p.ride ? Object.assign({}, inp, { grenade: false }) : inp, false);
      if (inp.enter && !(this.metro && this.metro.act(p)) && !(this.park && this.park.act(p))) this.tryEnter(p);
      this.stats.walked += Math.hypot(p.vx, p.vz) * dt;
    }

    flyMove(p, md, inp) {
      const sp = inp.sprint ? FLY_FAST : FLY_SPEED;
      p.wantVx = p.vx = md.x * md.k * sp;
      p.wantVz = p.vz = md.z * md.k * sp;
      p.flyVy = ((inp.rise ? 1 : 0) - (inp.sink ? 1 : 0)) * sp * 0.7;
    }

    flyStep(p, dt) {
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.y = N.clamp(p.y + (p.flyVy || 0) * dt, FLY_Y0, FLY_Y1);
      p.vy = 0;
      p.onGround = false;
      p.swim = null;
      p.wade = 0;
      p.wl = null;
      p.gy = p.y;
      p.landImpact = 0;
    }

    setFly(on) {
      const p = this.player;
      this.fly = !!on;
      p.flyVy = 0;
      p.vy = 0;
      if (!on) p.safeFall = true;
    }

    swimPlayer(p, dt, inp) {
      const md = this.moveDir(inp, p);
      p.wantVx = md.x * 4.3 * md.k;
      p.wantVz = md.z * 4.3 * md.k;
      if (md.k > 0.05) p.yaw = N.turnTo(p.yaw, N.yawOf(md.x, md.z), dt * 4);
      p.anim.aim = 0;
      p.scope = false;
      p.charging = 0;
      p.fireT = Math.max(0, p.fireT - dt);
    }

    selectSlot(p, slot) {
      const list = N.SLOTS[slot] || [];
      const at = list.indexOf(p.weapon);
      for (let k = 1; k <= list.length; k++) {
        const id = list[(at + k + list.length) % list.length];
        if (p.weapons[id] && (p.weapons[id].ammo > 0 || p.weapons[id].clip > 0 || id === 'fists')) { if (id !== p.weapon) { p.weapon = id; p.reloadT = 0; this.emit({ t: 'weapon', id }); } return; }
      }
    }

    cycleWeapon(p, d) {
      const have = N.WEAPON_IDS.filter(id => p.weapons[id] && (id === 'fists' || p.weapons[id].ammo > 0 || p.weapons[id].clip > 0));
      let i = have.indexOf(p.weapon);
      i = (i + d + have.length) % have.length;
      p.weapon = have[i];
      p.reloadT = 0;
      this.emit({ t: 'weapon', id: p.weapon });
    }

    giveWeapon(p, id, ammo) {
      const w = N.WEAPONS[id];
      if (!p.weapons) return;
      if (!p.weapons[id]) p.weapons[id] = { ammo: 0, clip: 0 };
      const slot = p.weapons[id];
      if (w.melee) slot.ammo = 1;
      else if (w.throw) slot.ammo = Math.min(w.max || 12, slot.ammo + ammo);
      else {
        slot.ammo += ammo;
        if (slot.clip === 0) { const take = Math.min(w.clip, slot.ammo); slot.clip = take; slot.ammo -= take; }
      }
      for (const other of N.SLOTS[w.slot]) if (other !== id && p.weapons[other] && N.WEAPONS[other].melee && w.melee) delete p.weapons[other];
    }

    handleWeapon(p, dt, inp, inCar) {
      const w = N.WEAPONS[p.weapon];
      const slot = p.weapons ? p.weapons[p.weapon] : null;
      const f0 = p.fireT;
      p.fireT = Math.max(0, p.fireT - dt);
      p.heat = Math.max(0, (p.heat || 0) - dt * 6);
      if (w.pump && f0 > w.rate - 0.42 && p.fireT <= w.rate - 0.42 && slot && slot.clip > 0) this.emit({ t: 'rsnd', k: 'pump', p, x: p.x, z: p.z });
      if (p.reloadT > 0) {
        const u0 = 1 - p.reloadT / w.reload;
        p.reloadT -= dt;
        const u1 = 1 - p.reloadT / w.reload;
        if (w.rk) for (const [u, k] of w.rk) if (u0 < u && u1 >= u) this.emit({ t: 'rsnd', k, p, x: p.x, z: p.z });
        if (p.reloadT <= 0 && slot) {
          const take = Math.min(w.clip, slot.ammo + slot.clip) - slot.clip;
          slot.clip += take;
          slot.ammo -= take;
        }
        return;
      }
      if (inp.reload && slot && !w.melee && !w.throw && slot.clip < w.clip && slot.ammo > 0) { p.reloadT = w.reload; this.emit({ t: 'reload', p }); return; }
      if (w.throw) {
        if (inp.fire && !p.charging && p.fireT <= 0 && slot && slot.ammo > 0) { p.charging = 0.001; }
        if (p.charging) {
          p.charging = Math.min(1, p.charging + dt * 1.2);
          p.anim.action = 'windup';
          if (!inp.fire) {
            this.throwGrenade(p, inp, 0.35 + p.charging * 0.65, p.weapon);
            p.charging = 0;
            slot.ammo--;
            p.fireT = w.rate;
            p.anim.action = 'throw';
            p.anim.actionT = 0.4;
            if (slot.ammo <= 0) { delete p.weapons[p.weapon]; p.weapon = 'fists'; }
          }
        }
        return;
      }
      const gid = p.weapons && p.weapons.grenade && p.weapons.grenade.ammo > 0 ? 'grenade' : p.weapons && p.weapons.molotov && p.weapons.molotov.ammo > 0 ? 'molotov' : null;
      if (inp.grenade && gid && p.fireT <= 0 && !inCar) {
        this.throwGrenade(p, inp, 0.8, gid);
        p.weapons[gid].ammo--;
        if (p.weapons[gid].ammo <= 0) delete p.weapons[gid];
        p.fireT = 0.8;
        p.anim.action = 'throw';
        p.anim.actionT = 0.4;
        return;
      }
      const trig = w.auto ? inp.fire : inp.firePressed || (inp.fire && p.fireT <= 0 && w.melee);
      if (!trig || p.fireT > 0) return;
      if (w.melee) {
        if (inCar) return;
        this.melee(p, w);
        return;
      }
      if (slot && slot.clip <= 0) {
        if (slot.ammo > 0) { p.reloadT = w.reload; this.emit({ t: 'reload', p }); } else { this.emit({ t: 'click', p }); p.fireT = 0.3; }
        return;
      }
      if (inCar && !w.driveBy) return;
      let ox, oy, oz, dx, dy, dz;
      if (inp.aimO && inp.aimD) {
        const target = this.aimPoint(inp.aimO, inp.aimD, w.range, p);
        const m = this.muzzle(p);
        ox = m.x; oy = m.y; oz = m.z;
        dx = target.x - ox; dy = target.y - oy; dz = target.z - oz;
        const L = Math.hypot(dx, dy, dz) || 1;
        dx /= L; dy /= L; dz /= L;
      } else {
        const m = this.muzzle(p);
        ox = m.x; oy = m.y; oz = m.z;
        const yaw = inCar && inp.driveBySide ? p.veh.yaw + inp.driveBySide * Math.PI / 2 : p.yaw;
        dx = Math.sin(yaw); dy = inp.aimPitch || 0; dz = -Math.cos(yaw);
      }
      if (inCar && inp.driveBySide) {
        const v = p.veh;
        const yaw = v.yaw + inp.driveBySide * Math.PI / 2;
        dx = Math.sin(yaw); dz = -Math.cos(yaw); dy = 0.02;
        ox = v.x + dx * (v.spec.hw + 0.3); oz = v.z + dz * (v.spec.hw + 0.3); oy = v.y + 1.1;
      }
      if (slot) slot.clip--;
      p.fireT = w.rate;
      if (!inCar) p.anim.aim = 1;
      const moving = Math.hypot(p.vx, p.vz);
      const spread = (p.scope ? (w.scopeSpread || w.spread) : w.spread * (p.anim.aim > 0.5 ? 0.6 : 1) * (moving > 3 ? 1.6 : 1) * (w.heavy && moving > 0.5 ? 1.8 : 1)) * (1 + Math.min(1.5, (p.heat || 0) * (w.climb || 0)));
      p.heat = (p.heat || 0) + 1;
      this.fire(p, p.weapon, ox, oy, oz, dx, dy, dz, spread);
      p.anim.action = 'shoot';
      p.anim.actionT = 0.12;
      if (w.air && slot && slot.clip <= 0 && slot.ammo > 0) { p.reloadT = w.reload; this.emit({ t: 'reload', p }); }
      if (!w.quiet) this.crime('gunfire', p.x, p.z);
    }

    muzzle(p) {
      if (p.veh) return { x: p.veh.x, y: p.veh.y + 1.2, z: p.veh.z };
      const w = N.WEAPONS[p.weapon];
      const m = w && w.mz ? w.mz : [0.55, 0.18, 1.38];
      const tall = (p.look && p.look.tall) || 1;
      const pitch = w && w.mz ? N.clamp(p.aimPitch || 0, -0.8, 0.8) * N.clamp(p.anim.aim * 1.5, 0, 1) : 0;
      const fx = Math.sin(p.yaw), fz = -Math.cos(p.yaw), rx = -fz, rz = fx;
      const h = m[0] * Math.cos(pitch);
      let x = p.x + fx * h + rx * m[1], y = p.y + m[2] * tall + m[0] * Math.sin(pitch), z = p.z + fz * h + rz * m[1];
      const ox = p.x, oy = p.y + 1.36 * tall, oz = p.z;
      const dx = x - ox, dy = y - oy, dz = z - oz, D = Math.hypot(dx, dy, dz);
      const hit = Phys.rayStatic(this.city, ox, oy, oz, dx / D, dy / D, dz / D, D, this, false);
      if (hit && hit.t < D) { const k = Math.max(0, hit.t - 0.08) / D; x = ox + dx * k; y = oy + dy * k; z = oz + dz * k; }
      return { x, y, z };
    }

    aimPoint(o, d, range, self) {
      const hit = this.raycast(o[0], o[1], o[2], d[0], d[1], d[2], range, self);
      const t = hit ? hit.t : range;
      return { x: o[0] + d[0] * t, y: o[1] + d[1] * t, z: o[2] + d[2] * t, hit };
    }

    raycast(ox, oy, oz, dx, dy, dz, range, self, noPeds) {
      const st = Phys.rayStatic(this.city, ox, oy, oz, dx, dy, dz, range, this, false);
      let best = st ? st.t : range, hit = st ? { t: st.t, kind: st.it.ground ? 'ground' : 'static', it: st.it } : null;
      if (!noPeds) {
        for (const p of this.peds) {
          if (p === self || p.veh || p.hidden) continue;
          if (Math.abs(p.x - ox) > best + 2 && Math.abs(p.z - oz) > best + 2) continue;
          const h = p.dead || p.state === 'down' ? 0.45 : 1.8;
          const t = N.rayCylinder(ox, oy, oz, dx, dy, dz, p.x, p.z, p.dead ? 0.5 : 0.32, p.y, p.y + h, best);
          if (t >= 0 && t < best) { best = t; hit = { t, kind: 'ped', ped: p }; }
        }
      }
      for (const v of this.vehs) {
        if (self && self.veh === v) continue;
        const r = v.spec.hl + 1;
        if (Math.abs(v.x - ox) > best + r && Math.abs(v.z - oz) > best + r) continue;
        const t = N.rayObb3(ox, oy, oz, dx, dy, dz, Phys.obbOf(v), v.y + v.spec.shape.clr * 0.5, v.y + v.spec.shape.H, best);
        if (t >= 0 && t < best) { best = t; hit = { t, kind: 'veh', veh: v }; }
      }
      for (const h of [this.heli, this.drop]) {
        if (!h || h.down || self && self.heli === h) continue;
        const t = this.heliRay(h, ox, oy, oz, dx, dy, dz, best);
        if (t >= 0 && t < best) { best = t; hit = { t, kind: 'heli', heli: h }; }
      }
      if (this.park) { const th = this.park.rayTir(ox, oy, oz, dx, dy, dz, best); if (th) { best = th.t; hit = th; } }
      for (const b of this.debris) {
        const r = b.sh.r;
        if (Math.abs(b.x - ox) > best + r && Math.abs(b.z - oz) > best + r) continue;
        const ex = b.x - ox, ey = b.y - oy, ez = b.z - oz, tc = ex * dx + ey * dy + ez * dz;
        if (tc < -r || tc > best + r || ex * ex + ey * ey + ez * ez - tc * tc > r * r) continue;
        const t = N.Debris.ray(b, ox, oy, oz, dx, dy, dz, best);
        if (t >= 0 && t < best) { best = t; hit = { t, kind: 'debris', body: b }; }
      }
      return hit;
    }

    heliRay(h, ox, oy, oz, dx, dy, dz, tmax) {
      const H = N.HELIS[h.type].hit, c = Math.cos(h.yaw), s = Math.sin(h.yaw);
      return N.rayObb3(ox, oy, oz, dx, dy, dz, N.obb(h.x - H[0] * s, h.z + H[0] * c, h.yaw, H[1], H[2]), h.y + H[3], h.y + H[4], tmax);
    }

    damageHeli(h, dmg, by, blast) {
      if (!h || h.down || dmg <= 0) return;
      h.hp -= dmg * (blast ? 1 : N.HELIS[h.type].armor);
      if (by && by.isPlayer) h.killer = by;
      if (h.hp > 0) return;
      h.hp = 0;
      h.down = true;
      h.vy = 0;
      this.emit({ t: 'helidown', h, x: h.x, y: h.y, z: h.z });
      if (by && by.isPlayer) { this.stats.carsDestroyed++; this.crime('carboom', h.x, h.z); }
    }

    fire(p, wid, ox, oy, oz, dx, dy, dz, spread) {
      const w = N.WEAPONS[wid] || N.VEH_GUNS[wid];
      const n = w.pellets || 1;
      p.anim.shot = 0;
      p.firedAt = this.t;
      p.aimYaw = N.yawOf(dx, dz);
      this.stats.shots += p.isPlayer ? 1 : 0;
      this.emit({ t: 'shot', w: wid, x: ox, y: oy, z: oz, dx, dy, dz, p });
      if (w.rocket) {
        this.projs.push({ id: this.nextId++, type: 'rocket', x: ox, y: oy, z: oz, dx, dy, dz, sp: 40, t: 0, life: 6, owner: p, rot: 0 });
        if (p.isPlayer || p.cop || p.gang) { this.alarm(ox, oz, 40, p); N.AI.hearShot(this, ox, oz, 40, p); }
        return;
      }
      let impact = null;
      const tb = this.park ? this.park.biasFor(p, wid) : null;
      for (let k = 0; k < n; k++) {
        let ex = dx + (this.rng() - 0.5) * 2 * spread, ey = dy + (this.rng() - 0.5) * 2 * spread, ez = dz + (this.rng() - 0.5) * 2 * spread;
        if (tb) { ex += tb[0]; ey += tb[1]; ez += tb[2]; }
        const L = Math.hypot(ex, ey, ez);
        ex /= L; ey /= L; ez /= L;
        let sx = ox, sy = oy, sz = oz, range = w.range, self = p;
        for (let pass = w.pierce ? 2 : 1; pass > 0; pass--) {
          const hit = this.raycast(sx, sy, sz, ex, ey, ez, range, self);
          const t = hit ? hit.t : range;
          const hx = sx + ex * t, hy = sy + ey * t, hz = sz + ez * t;
          this.emit({ t: 'tracer', x0: sx, y0: sy, z0: sz, x1: hx, y1: hy, z1: hz, w: wid, k });
          if (!hit) break;
          if (!impact) impact = { x: hx, z: hz };
          if (hit.kind === 'ped') {
            const q = hit.ped;
            const head = hy > q.y + 1.52 && !q.dead && q.state !== 'down';
            const dmg = w.dmg * (head ? 2.2 : 1) * (p.isPlayer ? 1 : 0.55);
            if (p.isPlayer && head) this.stats.headshots++;
            if (p.isPlayer) this.stats.hits++;
            this.damagePed(q, dmg, p, 'bullet', [ex, ez]);
            this.emit({ t: 'blood', x: hx, y: hy, z: hz });
            if (w.pierce && !q.dead && q.state !== 'down') this.knockDown(q, 1, ex * 3, ez * 3);
            sx = hx + ex * 0.6; sy = hy + ey * 0.6; sz = hz + ez * 0.6; range -= t + 0.6; self = q;
            if (range < 1) break;
            continue;
          }
          if (hit.kind === 'tir') {
            this.park.tirHit(hit, p, hx, hy, hz);
          } else if (hit.kind === 'heli') {
            this.damageHeli(hit.heli, w.dmg * 0.55, p);
            this.emit({ t: 'spark', x: hx, y: hy, z: hz, metal: true });
          } else if (hit.kind === 'veh') {
            this.damageVehicle(hit.veh, w.dmg * 0.55, p);
            this.emit({ t: 'spark', x: hx, y: hy, z: hz, metal: true });
            if (hit.veh.driver && !hit.veh.driver.isPlayer && !hit.veh.spec.shape.hatch && this.rng() < (w.pierce ? 0.4 : 0.12)) this.damagePed(hit.veh.driver, w.dmg * 0.6, p, 'bullet');
            if (!p.cop) N.AI.carShot(this, hit.veh, p);
          } else if (hit.kind === 'debris') N.Debris.shootBody(this, hit.body, w.dmg, hx, hy, hz, ex, ey, ez, p.isPlayer ? p : null);
          else if (hit.it && hit.it.brk) N.Debris.shootProp(this, hit.it.brk, w.dmg, hx, hy, hz, ex, ey, ez, p.isPlayer ? p : null);
          else this.emit({ t: 'spark', x: hx, y: hy, z: hz, ground: hit.kind === 'ground', mat: hit.it && HIT_MAT[hit.it.kind] });
          break;
        }
      }
      if ((p.isPlayer || p.cop || p.gang) && !tb) {
        this.alarm(ox, oz, w.quiet ? 5 : 30, p);
        N.AI.hearShot(this, ox, oz, w.quiet ? 6 : 28, p);
        if (impact) { this.alarm(impact.x, impact.z, 8, p); N.AI.hearShot(this, impact.x, impact.z, 10, p); }
      }
    }

    ignite(p, by, secs) {
      if (p.veh || p.dead || (p.wade || 0) > 0.5 || p.swim) return;
      if (!(p.burn > 0)) this.emit({ t: 'ignite', p, x: p.x, z: p.z });
      p.burn = Math.max(p.burn || 0, secs);
      p.burnBy = by || p.burnBy || null;
    }

    molotov(g, floor) {
      const W = N.WEAPONS.molotov;
      this.emit({ t: 'molotov', x: g.x, y: floor + 0.3, z: g.z, p: g.owner });
      this.fires.push({ id: this.nextId++, x: g.x, y: floor, z: g.z, r: W.radius, cur: W.radius * 0.35, t: 0, life: W.burn, by: g.owner });
      if (g.owner && g.owner.isPlayer) this.crime('gunfire', g.x, g.z);
      this.alarm(g.x, g.z, 25, g.owner);
    }

    stepFires(dt) {
      for (let i = this.fires.length - 1; i >= 0; i--) {
        const f = this.fires[i];
        f.t += dt;
        if (f.t >= f.life) { this.fires.splice(i, 1); continue; }
        const r = f.r * Math.min(1, 0.35 + f.t * 2.5) * Math.min(1, (f.life - f.t) / 1.5);
        f.cur = r;
        this.near(f.x, f.z, r + 3, e => {
          if (e.kind === 'ped') {
            if (e.dead || e.veh || Math.abs(e.y - f.y) > 1.6) return;
            if (N.dist2(e.x, e.z, f.x, f.z) < r * r) this.ignite(e, f.by, 3.5);
            return;
          }
          if (e.dead || e.burning || Math.abs(e.y - f.y) > 2) return;
          const rr = r + e.spec.hw;
          if (N.dist2(e.x, e.z, f.x, f.z) < rr * rr && e.hp > e.maxHp * 0.24) {
            e.hp = e.maxHp * 0.24;
            if (f.by && f.by.isPlayer && !(e.driver && e.driver.isPlayer)) e.lastHitByPlayer = this.t;
          }
        });
      }
    }

    stepBurn(p, dt) {
      if (!(p.burn > 0)) return;
      p.burn -= dt;
      if (p.dead) return;
      if ((p.wade || 0) > 0.5 || p.swim) { p.burn = 0; this.emit({ t: 'steam', p, x: p.x, y: p.y + 1, z: p.z }); return; }
      this.damagePed(p, N.WEAPONS.molotov.dmg * dt, p.burnBy, 'fire');
      if (!p.isPlayer && !p.dead && p.state !== 'down') {
        p.panicT = (p.panicT || 0) - dt;
        if (p.panicT <= 0) { p.panicT = 0.8 + this.rng() * 0.6; const a = this.rng() * Math.PI * 2; N.AI.flee(p, p.x + Math.cos(a) * 3, p.z + Math.sin(a) * 3, 1.2); }
      }
    }

    stepRocket(g, dt) {
      g.t += dt;
      if (g.t > 0.06) g.sp = Math.min(115, g.sp + dt * 240);
      g.dy -= 0.05 * dt;
      const l = Math.hypot(g.dx, g.dy, g.dz) || 1;
      g.dx /= l; g.dy /= l; g.dz /= l;
      g.rot += dt * 14;
      const step = g.sp * dt;
      const hit = this.raycast(g.x, g.y, g.z, g.dx, g.dy, g.dz, step + 0.3, g.owner);
      let t = hit ? Math.max(0, hit.t - 0.15) : -1;
      const nx = g.x + g.dx * step, ny = g.y + g.dy * step, nz = g.z + g.dz * step;
      const gy = this.city.groundY(nx, nz, g.y);
      const wa = this.city.ground(nx, nz) === GT.WATER ? this.city.waterAt(nx, nz) : null;
      if (t < 0 && wa && ny < wa.level) { t = step; this.emit({ t: 'splash', x: nx, y: wa.level, z: nz, big: true }); }
      if (t < 0 && ny < gy + 0.05) t = step;
      if (t < 0 && g.t >= g.life) t = 0;
      if (t >= 0 && hit && g.t < 0.1) {
        if (hit.kind === 'ped') this.damagePed(hit.ped, 40, g.owner, 'bullet', [g.dx, g.dz]);
        if (hit.kind === 'veh') this.damageVehicle(hit.veh, 60, g.owner);
        this.emit({ t: 'spark', x: g.x + g.dx * t, y: g.y + g.dy * t, z: g.z + g.dz * t, metal: true });
        return true;
      }
      if (t >= 0) {
        const W = N.WEAPONS.rpg7;
        const x = g.x + g.dx * t, y = Math.max(g.y + g.dy * t, Math.min(gy, wa ? wa.level : gy) + 0.1), z = g.z + g.dz * t;
        if (hit && hit.kind === 'veh') this.damageVehicle(hit.veh, W.dmg * 3, g.owner, true);
        if (hit && hit.kind === 'ped') this.damagePed(hit.ped, W.dmg, g.owner, 'explosion');
        this.explode(x, y, z, W.radius, W.dmg, g.owner, 'rocket');
        return true;
      }
      g.x = nx; g.y = ny; g.z = nz;
      return false;
    }

    alarm(x, z, r, src) {
      this.near(x, z, r, e => {
        if (e.kind !== 'ped' || e.dead || e.isPlayer || e === src) return;
        if (e.cop || e.gang || e.ai && e.ai.mission) return;
        if (e.fixed) { e.duck = Math.max(e.duck || 0, 15); return; }
        if (!e.ai || e.ai.mode !== 'flee') N.AI.flee(e, x, z, this.rng.range(6, 12));
      });
    }

    melee(p, w) {
      p.fireT = w.rate;
      p.anim.action = w.blade ? 'stab' : 'punch';
      p.anim.actionT = 0.3;
      p.anim.combo = ((p.anim.combo || 0) + 1) % 3;
      const fx = Math.sin(p.yaw), fz = -Math.cos(p.yaw);
      let best = null, bd = 99;
      this.near(p.x, p.z, w.range + 1, e => {
        if (e.kind !== 'ped' || e === p || e.dead || e.veh) return;
        const dx = e.x - p.x, dz = e.z - p.z;
        const d = Math.hypot(dx, dz);
        if (d > w.range + 0.3) return;
        const dot = (dx * fx + dz * fz) / (d || 1);
        if (dot < 0.35 || Math.abs(e.y - p.y) > 1.2) return;
        if (d < bd) { bd = d; best = e; }
      });
      this.emit({ t: 'swing', p, w: w.id });
      if (!best) { if (p.isPlayer) this.hitProps(p, w, fx, fz); return; }
      const combo = p.anim.combo === 2;
      this.damagePed(best, w.dmg * (combo ? 1.6 : 1) * (p.isPlayer ? 1 : 0.7), p, w.blade ? 'stab' : 'melee', [fx, fz]);
      this.emit({ t: 'hit', x: best.x, y: best.y + 1.4, z: best.z, w: w.id, blade: !!w.blade });
      if (combo && !best.dead) this.knockDown(best, 1.4, fx * 3, fz * 3);
      else if (!best.dead) { best.vx += fx * 1.8; best.vz += fz * 1.8; best.anim.flinch = 0.25; }
    }

    throwGrenade(p, inp, power, type) {
      let dx, dy, dz;
      if (inp && inp.aimD) { dx = inp.aimD[0]; dy = inp.aimD[1]; dz = inp.aimD[2]; } else { dx = Math.sin(p.yaw); dy = 0.1; dz = -Math.cos(p.yaw); }
      const hl = Math.hypot(dx, dz) || 1;
      dx /= hl; dz /= hl;
      const up = N.clamp(dy + 0.42, 0.18, 1.1);
      const sp = 7 + 12 * power;
      const m = this.muzzle(p);
      const kind = type === 'molotov' ? 'molotov' : 'grenade';
      this.projs.push({ id: this.nextId++, type: kind, x: m.x, y: m.y + 0.2, z: m.z, vx: dx * sp + p.vx * 0.5, vy: up * sp * 0.75, vz: dz * sp + p.vz * 0.5, t: kind === 'molotov' ? 8 : N.WEAPONS.grenade.fuse, owner: p, rot: 0 });
      this.emit({ t: 'throw', p });
    }

    stepProjectiles(dt) {
      for (let i = this.projs.length - 1; i >= 0; i--) {
        const g = this.projs[i];
        if (g.type === 'rocket') { if (this.stepRocket(g, dt)) this.projs.splice(i, 1); continue; }
        if (g.type === 'shell') { if (this.stepShell(g, dt)) this.projs.splice(i, 1); continue; }
        g.t -= dt;
        g.vy -= N.G * dt;
        const nx = g.x + g.vx * dt, ny = g.y + g.vy * dt, nz = g.z + g.vz * dt;
        let bx = false, bz = false, wall = null;
        this.city.hash.query(nx - 0.2, nz - 0.2, nx + 0.2, nz + 0.2, it => {
          if (it.brk && this.broken.has(it.brk)) return;
          if (it.circle) { if (N.dist2(nx, nz, it.x, it.z) < it.r * it.r + 0.04 && ny < it.y1) { bx = bz = true; } return; }
          if (ny > it.y1 || ny < it.y0) return;
          if (it.poly) {
            if (N.pointInPoly(it.poly, nx, nz) && !N.pointInPoly(it.poly, g.x, g.z)) { const c = N.circlePoly(nx, nz, 0.01, it.poly); if (c) wall = c; }
            return;
          }
          if (nx > it.x0 && nx < it.x1 && nz > it.z0 && nz < it.z1) {
            const inX = g.x > it.x0 && g.x < it.x1, inZ = g.z > it.z0 && g.z < it.z1;
            if (!inX) bx = true;
            if (!inZ) bz = true;
            if (inX && inZ) { bx = bz = true; }
          }
        });
        for (const v of this.vehs) {
          if (Math.abs(v.x - nx) > 4 || Math.abs(v.z - nz) > 4) continue;
          if (ny < v.y + v.spec.shape.H && N.pointInObb(Phys.obbOf(v), nx, nz)) { bx = bz = true; g.vy = Math.abs(g.vy) * 0.3; }
        }
        const struck = bx || bz || !!wall;
        if (wall && !bx && !bz) {
          const vn = g.vx * wall.nx + g.vz * wall.nz;
          if (vn < 0) { g.vx -= 1.35 * vn * wall.nx; g.vz -= 1.35 * vn * wall.nz; }
        } else {
          if (bx) g.vx *= -0.35; else g.x = nx;
          if (bz) g.vz *= -0.35; else g.z = nz;
        }
        g.y = ny;
        const gy = this.city.groundY(g.x, g.z, g.y + 0.3);
        const roof = this.city.roofAt(g.x, g.z);
        const floor = roof > 0 && roof > gy && g.y > roof - 0.5 ? roof : gy;
        const wa = !g.wet && this.city.ground(g.x, g.z) === GT.WATER ? this.city.waterAt(g.x, g.z) : null;
        if (wa && g.y < wa.level) {
          g.wet = true;
          g.t = Math.min(g.t, 0.8);
          g.vx *= 0.15; g.vz *= 0.15;
          this.emit({ t: 'splash', x: g.x, y: wa.level, z: g.z, big: false });
        }
        if (g.wet) g.vy = -1.1;
        if (g.y < floor + 0.08) {
          g.y = floor + 0.08;
          if (g.wet) { g.vx = 0; g.vz = 0; g.vy = 0; }
          else if (g.vy < -1.5) { g.vy = -g.vy * 0.32; g.vx *= 0.6; g.vz *= 0.6; this.emit({ t: 'bounce', x: g.x, z: g.z }); } else { g.vy = 0; g.vx *= Math.max(0, 1 - dt * 5); g.vz *= Math.max(0, 1 - dt * 5); }
        }
        if (g.type === 'molotov') {
          if (g.wet) { this.projs.splice(i, 1); this.emit({ t: 'fizzle', x: g.x, y: g.y, z: g.z }); continue; }
          if (struck || g.y <= floor + 0.1 || g.t <= 0) { this.projs.splice(i, 1); this.molotov(g, floor); continue; }
        }
        g.rot += dt * 10;
        if (g.t <= 0) {
          this.projs.splice(i, 1);
          this.explode(g.x, g.y, g.z, N.WEAPONS.grenade.radius, N.WEAPONS.grenade.dmg, g.owner, 'grenade');
        }
      }
    }

    stepShell(g, dt) {
      g.t += dt;
      g.px = g.x; g.py = g.y; g.pz = g.z;
      g.vy -= N.G * dt;
      const sp = Math.hypot(g.vx, g.vy, g.vz) || 1, dx = g.vx / sp, dy = g.vy / sp, dz = g.vz / sp, step = sp * dt;
      const hit = this.raycast(g.x, g.y, g.z, dx, dy, dz, step + 0.3, g.owner);
      let t = hit ? hit.t : -1;
      const nx = g.x + dx * step, ny = g.y + dy * step, nz = g.z + dz * step;
      const gy = this.city.groundY(nx, nz, g.y);
      const wa = this.city.ground(nx, nz) === GT.WATER ? this.city.waterAt(nx, nz) : null;
      if (t < 0 && wa && ny < wa.level) { t = step; this.emit({ t: 'splash', x: nx, y: wa.level, z: nz, big: true }); }
      if (t < 0 && ny < gy + 0.05) t = step;
      if (t < 0 && g.t >= g.life) t = 0;
      if (t < 0) { g.x = nx; g.y = ny; g.z = nz; return false; }
      const G = N.VEH_GUNS[g.gun], x = g.x + dx * t, z = g.z + dz * t, y = Math.max(g.y + dy * t, this.city.groundY(x, z) + 0.1);
      if (hit && hit.kind === 'veh') this.damageVehicle(hit.veh, G.dmg * 3, g.owner, true);
      if (hit && hit.kind === 'ped') this.damagePed(hit.ped, G.dmg, g.owner, 'explosion');
      this.explode(x, y, z, G.radius, G.dmg, g.owner, 'shell');
      return true;
    }

    explode(x, y, z, radius, dmg, by, kind) {
      this.emit({ t: 'explosion', x, y, z, r: radius, kind });
      if (by && by.isPlayer) this.crime('explosion', x, z);
      this.alarm(x, z, 50, by);
      for (const p of this.peds.slice()) {
        if (p.veh) continue;
        const d = Math.hypot(p.x - x, p.y + 0.9 - y, p.z - z);
        if (d > radius) continue;
        const k = 1 - d / radius;
        this.damagePed(p, dmg * k, by, 'explosion');
        const ax = (p.x - x) / (d || 1), az = (p.z - z) / (d || 1);
        this.knockDown(p, 2.2, ax * 9 * k, az * 9 * k, 3 + 5 * k);
      }
      for (const v of this.vehs) {
        const d = Math.hypot(v.x - x, v.y + 0.7 - y, v.z - z);
        if (d > radius + v.spec.hl * 0.5) continue;
        const k = N.clamp(1 - (d - v.spec.hl * 0.5) / radius, 0, 1);
        this.damageVehicle(v, dmg * 5 * k, by, true);
        Phys.blast(v, x, z, 9 * k * 1300 / v.spec.mass);
        v.wz += (this.rng() - 0.5) * 2 * k;
        if (!v.ai || v.ai.mode !== 'phys') N.AI.bump(v, this);
      }
      for (const h of [this.heli, this.drop]) {
        if (!h || h.down) continue;
        const d = Math.hypot(h.x - x, h.y - y, h.z - z);
        if (d < radius + 3) this.damageHeli(h, dmg * 4 * N.clamp(1 - (d - 3) / radius, 0, 1), by, true);
      }
      N.Debris.blast(this, x, y, z, radius, dmg, by);
      N.AI.hearShot(this, x, z, 55, by || { x, z });
    }

    dislodge(rec, o) {
      return N.Debris.dislodge(this, rec, o || {});
    }

    carHitsProp(v, rec, nx, nz, vn) {
      if (this.broken.has(rec)) return true;
      const D = N.Debris, anchor = D.anchorOf(rec), M = v.spec.mass, app = Math.max(0, vn);
      if (anchor > 0 && 0.5 * M * app * app < anchor) return false;
      if (anchor > 0) {
        const left = Math.sqrt(Math.max(0, app * app - 2 * anchor / M));
        v.vx += nx * (app - left);
        v.vz += nz * (app - left);
      }
      const d = N.BREAK[rec.kind], m = D.massOf(rec), sp = Math.hypot(v.vx, v.vz) || 1;
      this.dislodge(rec, { by: v.driver && v.driver.isPlayer ? v.driver : null, energy: 0.5 * M * m / (M + m) * app * app, shatter: !!d.pieces && v.spec.type === 'tank', car: v, u: app, dir: sp > 0.5 ? [v.vx / sp, v.vz / sp] : [-nx, -nz] });
      return true;
    }

    pedHitsProp(p, rec, nx, nz) {
      if (this.broken.has(rec)) return true;
      const sp = Math.hypot(p.vx, p.vz);
      if (sp < (p.isPlayer ? 0.8 : 3.5)) return false;
      const j = Math.max(0, -(p.vx * nx + p.vz * nz)) * 1.2 * Math.min(N.Debris.massOf(rec), 25);
      this.dislodge(rec, { by: p.isPlayer ? p : null, impulse: [-nx * j, j * 0.3, -nz * j], at: [rec.x - nx * 0.1, N.Debris.yOf(this.city, rec) + 0.15, rec.z - nz * 0.1] });
      return true;
    }

    hitProps(p, w, fx, fz) {
      const reach = w.range + 0.6;
      let best = null, bd = reach + 1, bodyHit = null;
      this.city.brkHash.query(p.x - reach, p.z - reach, p.x + reach, p.z + reach, rec => {
        if (this.broken.has(rec) || !rec.col) return;
        const dx = rec.x - p.x, dz = rec.z - p.z, d = Math.hypot(dx, dz);
        if (d > reach || (dx * fx + dz * fz) / (d || 1) < 0.3) return;
        if (d < bd) { bd = d; best = rec; }
      });
      for (const b of this.debris) {
        const dx = b.x - p.x, dz = b.z - p.z, d = Math.hypot(dx, dz) - b.sh.r * 0.5;
        if (d > reach || d >= bd || (dx * fx + dz * fz) / (Math.hypot(dx, dz) || 1) < 0.3 || b.y > p.y + 1.8) continue;
        bd = d; bodyHit = b;
      }
      const hy = p.y + 0.9;
      if (bodyHit) { N.Debris.shootBody(this, bodyHit, w.dmg * 1.5, bodyHit.x, Math.max(bodyHit.y, p.y + 0.4), bodyHit.z, fx, 0.15, fz, p); return true; }
      if (best) { N.Debris.shootProp(this, best, w.dmg * 1.5, best.x - fx * 0.2, hy, best.z - fz * 0.2, fx, 0.1, fz, p); return true; }
      return false;
    }

    knockDown(p, time, vx, vz, vy) {
      if (p.dead) return;
      if (p.veh) return;
      if (p.swim) { if (vx !== undefined) { p.vx = vx * 0.3; p.vz = vz * 0.3; } return; }
      if (p.enter && p.enter.v) this.closeDoor(p.enter.v, p.enter.side);
      p.enter = null;
      p.exit = null;
      p.anim.sit = 0;
      p.state = 'down';
      p.stateT = time;
      p.anim.fall = 0.001;
      if (vx !== undefined) { p.vx = vx; p.vz = vz; }
      if (vy) { p.vy = vy; p.onGround = false; }
      p.wantVx = 0;
      p.wantVz = 0;
    }

    damagePed(p, dmg, by, kind, dir) {
      if (p.dead || dmg <= 0) return;
      if (p.isPlayer && (this.god || p.invuln > 0 || this.truce)) return;
      if (p.ai && p.ai.invuln) return;
      if (p.armor > 0 && kind !== 'fall' && kind !== 'drown') {
        const a = Math.min(p.armor, dmg);
        p.armor -= a;
        dmg -= a;
      }
      p.hp -= dmg;
      p.lastHitBy = by;
      p.hurtT = 0.3;
      if (p.isPlayer) this.emit({ t: 'hurt', amount: dmg, kind });
      if (by && by.isPlayer && !p.isPlayer) {
        if (p.cop) this.crime(p.hp <= 0 ? 'killcop' : 'hitcop', p.x, p.z, p);
        else if (!(p.ai && p.ai.mission)) this.crime(p.hp <= 0 ? 'kill' : 'assault', p.x, p.z, p);
      }
      if (p.hp <= 0) { this.killPed(p, by, kind, dir); return; }
      if (!p.isPlayer) N.AI.onHurt(this, p, by, kind);
    }

    killPed(p, by, kind, dir) {
      p.hp = 0;
      p.dead = true;
      p.state = 'dead';
      p.deadT = 0;
      p.anim.fall = 0.001;
      p.anim.deathKind = kind;
      p.anim.sit = 0;
      if (p.enter && p.enter.v) this.closeDoor(p.enter.v, p.enter.side);
      p.enter = null;
      p.exit = null;
      if (dir) { p.vx += dir[0] * 2; p.vz += dir[1] * 2; }
      if (p.veh) {
        const v = p.veh;
        if (v.driver === p && !p.isPlayer) { v.ctl.thr = 0; v.ctl.hand = true; }
      }
      if (by && by.isPlayer && !p.isPlayer) {
        this.stats.kills++;
        if (p.cop) this.stats.copsKilled++;
        if (!p.veh) {
          if (p.money > 0) this.addPickup('money', p.x + 0.3, p.z + 0.3, { amount: p.money, drop: true, life: 30 });
          const PW = N.WEAPONS[p.weapon];
          if (PW && p.weapon !== 'fists' && !PW.melee && !PW.throw) this.addPickup('weapon', p.x - 0.3, p.z - 0.3, { weapon: p.weapon, ammo: PW.rocket ? 1 : Math.max(8, PW.clip || 8), drop: true, life: 30 });
        }
      }
      this.emit({ t: 'death', p, by, kind });
      if (p.isPlayer) this.emit({ t: 'wasted' });
    }

    damageVehicle(v, dmg, by, blast) {
      if (v.dead) return;
      if (v.spec.armor !== undefined) {
        dmg *= blast ? v.spec.blast || 1 : v.spec.armor;
        if (dmg <= 0) return;
      }
      if (v.ai && v.ai.invuln) dmg *= 0.15;
      if (v.driver && v.driver.isPlayer && this.god) return;
      v.hp -= dmg;
      if (by && by.isPlayer && !(v.driver && v.driver.isPlayer)) v.lastHitByPlayer = this.t;
      if (v.hp <= 0) {
        const t = blast ? 0.4 : 1.2;
        if (!v.burning || !(v.burnT > 0) || v.burnT > t) v.burnT = t;
        v.burning = true;
        v.hp = 0;
      }
    }

    blowUp(v) {
      v.dead = true;
      v.burning = false;
      v.fire = 0;
      v.hp = 0;
      v.color = '#161412';
      v.vy = 4;
      v.wr = (v.wr || 0) + ((v.id % 5) - 2) * 0.9;
      v.wp = (v.wp || 0) + ((v.id % 3) - 1) * 0.6;
      v.air = true;
      this.explode(v.x, v.y + 0.6, v.z, 6.5, 170, v.lastHitByPlayer > this.t - 15 ? this.player : null, 'car');
      if (v.lastHitByPlayer > this.t - 15) { this.stats.carsDestroyed++; this.crime('carboom', v.x, v.z); }
      for (const q of [v.driver].concat(v.pass)) {
        if (!q) continue;
        if (q.isPlayer) {
          this.exitVehicle(q, true);
          const a = this.rng() * Math.PI * 2;
          this.knockDown(q, 2.5, Math.cos(a) * 4, Math.sin(a) * 4, 5);
          this.damagePed(q, q.hp + q.armor + 1, null, 'explosion');
          continue;
        }
        this.unseat(q);
        q.x = v.x + (this.rng() - 0.5) * 2;
        q.z = v.z + (this.rng() - 0.5) * 2;
        this.killPed(q, this.player, 'explosion');
      }
      v.driver = null;
      v.pass = [];
      v.wreckT = 0;
      this.emit({ t: 'carboom', v });
    }

    tryEnter(p) {
      let best = null, bd = 4.2 * 4.2;
      for (const v of this.vehs) {
        if (v.dead || v.sink || v.up < -0.2) continue;
        const d = N.dist2(p.x, p.z, v.x, v.z) - v.spec.hl * v.spec.hl * 0.35;
        if (d < bd && Math.abs(v.y - p.y) < 1.5) { bd = d; best = v; }
      }
      if (!best) return false;
      if (best.spec.turret && best.driver && best.driver.isPlayer) return false;
      const side = this.sideOf(best, p.x, p.z);
      p.enter = { v: best, side, ph: 'go', t: 0, ai: null };
      p.anim.aim = 0;
      p.charging = 0;
      if (best.driver && !best.driver.isPlayer && !best.locked) {
        p.enter.ai = best.ai;
        best.ai = null;
        best.ctl.thr = 0;
        best.ctl.steer = 0;
        best.ctl.hand = true;
      }
      return true;
    }

    cancelEnter(p) {
      const E = p.enter;
      if (!E) return;
      const v = E.v;
      if (E.ai && v && v.driver && !v.driver.isPlayer && !v.dead && !v.ai) v.ai = E.ai;
      if (v) this.closeDoor(v, E.side);
      p.enter = null;
      p.anim.sit = 0;
    }

    evict(v, p, side) {
      const d = v.driver;
      if (d && !d.isPlayer) {
        this.unseat(d);
        const dp = this.doorPos(v, side);
        const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw), ox = Math.cos(v.yaw) * side, oz = Math.sin(v.yaw) * side;
        d.x = dp.x - fx * 0.9; d.z = dp.z - fz * 0.9; d.y = v.y; d.state = 'idle';
        this.knockDown(d, 1.3, ox * 2.4 - fx * 1.4, oz * 2.4 - fz * 1.4);
        if (!d.cop) N.AI.afterCarjack(this, d, p, v);
        this.stats.carsStolen++;
        this.crime(d.cop ? 'hitcop' : 'carjack', v.x, v.z, d);
        this.emit({ t: 'carjack', v, d });
      }
      for (const q of v.pass.slice()) {
        if (q.isPlayer) continue;
        if (q.ai && q.ai.mission && q.friendly) continue;
        this.unseat(q);
        const dp = this.doorPos(v, -side);
        q.x = dp.x; q.z = dp.z; q.y = v.y; q.state = 'idle';
        q.anim.alight = { t: 0, v, side: -side };
        this.doorPulse(v, -side, 0.6);
        N.AI.flee(q, p.x, p.z, 8);
      }
    }

    npcExit(p, then) {
      const v = p.veh;
      if (!v) return;
      const cb = N.cabin(v.spec);
      let side = p.seat === 0 ? -1 : 1;
      if (cb.bike || v.spec.shape.hatch || p.seat > 1 || Math.abs(v.spd) > 2.5) { this.exitVehicle(p); if (then) p.ai = then; return; }
      let ph = 'open';
      const free = s => { const d = this.doorPos(v, s); return this.pedSpotFree(d.x, d.z); };
      if (!free(side)) {
        if (p.seat === 0 && !v.pass.some(q => q.seat === 1) && free(1)) { side = 1; ph = 'slide'; }
        else { this.exitVehicle(p); if (then) p.ai = then; return; }
      }
      this.unseat(p);
      if (v.driver === null) { v.ctl.thr = 0; v.ctl.steer = 0; v.ctl.hand = true; }
      p.exit = { v, side, ph, t: 0, then: then || null };
      p.state = 'idle';
      p.anim.sit = 1;
      p.anim.board = null;
      p.anim.alight = null;
      p.wantVx = p.wantVz = 0;
    }

    jackSide(v) {
      if (v.spec.type === 'bike') return -1;
      const d = this.doorPos(v, -1);
      return this.pedSpotFree(d.x, d.z) && !this.near(d.x, d.z, 6, e => e.kind === 'veh' && e !== v && !!N.circleObb(d.x, d.z, 0.4, Phys.obbOf(e))) ? -1 : 1;
    }

    npcJack(p, v, after) {
      if (p.enter || p.dead || p.veh || p.state === 'down' || v.spec.shape.hatch || v.driver !== this.player) return false;
      if (v.jackBy && v.jackBy !== p && !v.jackBy.dead && v.jackBy.enter && v.jackBy.enter.v === v) return false;
      const bike = v.spec.type === 'bike';
      p.enter = { v, side: this.jackSide(v), ph: bike ? 'shove' : 'open', t: 0, npc: true };
      p.ai = { mode: 'jack', car: v, after: after || null };
      p.wantVx = p.wantVz = 0;
      v.jackBy = p;
      return true;
    }

    stepNpcJack(p, dt) {
      const E = p.enter, pl = this.player;
      const v = E && E.v;
      const done = () => {
        if (v && v.jackBy === p) v.jackBy = null;
        p.enter = null;
        p.ai = p.ai.after || { mode: 'walk', edge: -1 };
      };
      if (!E || !v || v.dead || v.removed) { done(); return; }
      if (!E.pulled && (pl.veh !== v || v.driver !== pl || pl.dead || Math.abs(v.spd) > 3)) {
        this.closeDoor(v, E.side);
        const hitBy = Math.abs(v.spd) > 4.5 && Math.hypot(p.x - v.x, p.z - v.z) < v.spec.hl + 1.5;
        done();
        if (hitBy) this.knockDown(p, 1.2, v.vx * 0.5, v.vz * 0.5, 1.2);
        return;
      }
      E.t += dt;
      const d = this.doorPos(v, E.side);
      const k = Math.min(1, dt * 10);
      p.x += (d.x - p.x) * k;
      p.z += (d.z - p.z) * k;
      p.y = Math.max(this.city.groundY(p.x, p.z), v.y);
      p.yaw = N.turnTo(p.yaw, this.faceYaw(v, E.side), dt * 10);
      p.wantVx = p.wantVz = p.vx = p.vz = 0;
      if (E.ph === 'shove') {
        if (E.t > 0.35 && !E.pulled) { E.pulled = true; this.pullOut(v, p, E.side); }
        if (E.t > 0.7) done();
        return;
      }
      if (E.ph === 'open') {
        if (E.t > 0.16 && !E.opened) { E.opened = true; this.openDoor(v, E.side); }
        if (E.t > 0.48) { E.ph = 'jack'; E.t = 0; }
        return;
      }
      if (E.t > 0.3 && !E.pulled) { E.pulled = true; this.pullOut(v, p, E.side); }
      if (E.t > 0.8) done();
    }

    pullOut(v, by, side) {
      const pl = this.player;
      if (pl.veh !== v || v.driver !== pl) return;
      const bike = v.spec.type === 'bike', cb = N.cabin(v.spec);
      this.unseat(pl);
      v.ctl.thr = 0; v.ctl.steer = 0; v.ctl.hand = true; v.ctl.burn = false;
      const q = bike ? this.carLocal(v, side * 1.1, 0.4) : this.carLocal(v, side * (cb.hw + 0.85), cb.door.z1 + 0.9);
      Object.assign(pl, { x: q.x, z: q.z, y: Math.max(this.city.groundY(q.x, q.z), v.y), vx: 0, vz: 0, state: 'idle', enter: null, exit: null });
      pl.yaw = this.faceYaw(v, side);
      pl.anim.sit = 0;
      pl.anim.doorArm = null;
      this.emit({ t: 'exit', v });
      this.emit({ t: 'pulled', v, p: by });
      const ox = Math.cos(v.yaw) * side, oz = Math.sin(v.yaw) * side;
      if (bike) this.knockDown(pl, 1.4, ox * 3, oz * 3, 1.5);
      else {
        pl.anim.alight = { t: 0, v, side };
        if (!by.cop) pl.pulled = { t: 0, side, v, by };
      }
      if (by.cop && !this.busted) { this.busted = true; this.emit({ t: 'busted' }); }
    }

    stepPulled(p, dt) {
      const P = p.pulled;
      P.t += dt;
      p.wantVx = p.wantVz = 0;
      if (P.t < 0.42) return;
      p.pulled = null;
      const ox = Math.cos(P.v.yaw) * P.side, oz = Math.sin(P.v.yaw) * P.side;
      this.knockDown(p, 1.3, ox * 2.6, oz * 2.6, 1.2);
      this.damagePed(p, 4, P.by, 'melee');
    }

    pathAt(v, pts, k) {
      const n = pts.length - 1;
      const f = N.clamp(k, 0, 1) * n;
      const i = Math.min(n - 1, Math.floor(f)), u = f - i;
      return this.carLocal(v, N.lerp(pts[i][0], pts[i + 1][0], u), N.lerp(pts[i][1], pts[i + 1][1], u));
    }

    seatXZ(v, side) {
      const cb = N.cabin(v.spec);
      return [side < 0 ? cb.seat.x : -cb.seat.x, cb.seat.z];
    }

    gapXZ(v, side) {
      const cb = N.cabin(v.spec);
      return [side * (cb.hw - 0.02), cb.seat.z + 0.08];
    }

    outXZ(v, side) {
      const cb = N.cabin(v.spec);
      return cb.bike ? [side * 0.75, 0.15] : [side * (cb.hw + 0.5), cb.door.z1 + 0.12];
    }

    stepEnter(p, dt, inp) {
      const E = p.enter, v = E.v;
      if (!v || v.dead || v.removed || v.sink) { this.cancelEnter(p); return; }
      E.t += dt;
      const bike = v.spec.type === 'bike';
      const moving = Math.abs(inp.fwd || 0) + Math.abs(inp.right || 0) > 0.1;
      p.anim.aim = 0;
      p.fireT = Math.max(0, p.fireT - dt);
      if (E.ph === 'go') {
        const d = this.doorPos(v, E.side);
        const dx = d.x - p.x, dz = d.z - p.z, dist = Math.hypot(dx, dz);
        if (moving && E.t > 0.25 || dist > 9 || Math.abs(v.spd) > 3.5 && dist > 1.5 || p.swim) { this.cancelEnter(p); return; }
        if (dist < 0.3 || E.t > 3) {
          if (dist >= 0.3) { p.x = d.x; p.z = d.z; }
          p.vx = p.vz = 0;
          p.wantVx = p.wantVz = 0;
          E.ph = bike ? 'mount' : v.spec.shape.hatch ? 'climb' : v.locked ? 'locked' : 'open';
          E.t = 0;
          E.y0 = p.y;
          E.yaw0 = p.yaw;
          return;
        }
        const sp = Math.min(dist * 5 + 0.8, inp.sprint ? 6.6 : 4.3);
        p.wantVx = dx / dist * sp;
        p.wantVz = dz / dist * sp;
        p.yaw = N.turnTo(p.yaw, N.yawOf(dx, dz), dt * 12);
        return;
      }
      p.wantVx = p.wantVz = 0;
      p.vx = p.vz = 0;
      if (E.ph === 'climb' || E.ph === 'drop') { this.stepHatch(p, v, E, dt); return; }
      if (E.ph === 'open' || E.ph === 'locked' || E.ph === 'jack') {
        const d = this.doorPos(v, E.side);
        const k = Math.min(1, dt * 12);
        p.x += (d.x - p.x) * k;
        p.z += (d.z - p.z) * k;
        p.yaw = N.turnTo(p.yaw, this.faceYaw(v, E.side), dt * 10);
        if (E.ph === 'locked') {
          if (E.t > 0.85) { this.emit({ t: 'msg', text: 'Машина заперта.' }); this.emit({ t: 'locked', v }); p.enter = null; }
          return;
        }
        if (E.ph === 'open') {
          if (moving && E.t > 0.2) { this.cancelEnter(p); return; }
          if (E.t > 0.16 && !E.opened) {
            E.opened = true;
            this.openDoor(v, E.side);
            if (!v.driver && v.parkedSpot >= 0 && !v.used) { this.stats.carsStolen++; this.crime('steal', v.x, v.z); }
          }
          if (E.t > 0.48) {
            v.ai = null;
            v.ctl.thr = 0;
            v.ctl.hand = true;
            E.ph = v.driver && !v.driver.isPlayer ? 'jack' : 'in';
            E.t = 0;
            E.y0 = p.y;
            E.yaw0 = p.yaw;
            if (E.ph === 'in') this.evict(v, p, E.side);
          }
          return;
        }
        if (E.t > 0.3 && !E.pulled) { E.pulled = true; this.evict(v, p, E.side); }
        if (E.t > 0.8) { E.ph = 'in'; E.t = 0; E.y0 = p.y; E.yaw0 = p.yaw; }
        return;
      }
      const dur = E.ph === 'mount' ? 0.5 : E.ph === 'slide' ? 0.36 : 0.62;
      const k = Math.min(1, E.t / dur);
      const s = N.smooth(0, 1, k);
      const rootY = v.y + this.seatRootY(p, v);
      let pos;
      if (E.ph === 'mount') pos = this.pathAt(v, [this.outXZ(v, E.side), this.seatXZ(v, -1)], s);
      else if (E.ph === 'slide') pos = this.pathAt(v, [this.seatXZ(v, 1), this.seatXZ(v, -1)], s);
      else pos = this.pathAt(v, [this.outXZ(v, E.side), this.gapXZ(v, E.side), this.seatXZ(v, E.side)], s);
      p.x = pos.x;
      p.z = pos.z;
      p.y = E.ph === 'slide' ? rootY : N.lerp(E.y0, rootY, N.smooth(0.1, 0.8, k));
      p.yaw = E.ph === 'slide' ? v.yaw : N.wrap(E.yaw0 + N.wrap(v.yaw - E.yaw0) * N.smooth(0.15, 0.85, k));
      p.anim.sit = E.ph === 'slide' ? 1 : N.smooth(0.05, 0.9, k);
      if (k < 1) return;
      if (E.ph === 'in' && E.side > 0) { E.ph = 'slide'; E.t = 0; return; }
      if (v.driver && v.driver !== p) { this.cancelEnter(p); return; }
      p.enter = null;
      v.ai = null;
      v.used = true;
      this.seat(p, v, true);
      p.anim.sit = 1;
      v.ctl = { thr: 0, steer: 0, hand: false };
      if (!bike) { this.closeDoor(v, E.side, 0.14); p.anim.doorArm = { side: E.side, t: 0 }; }
      this.emit({ t: 'enter', v });
    }

    stepHatch(p, v, E, dt) {
      const cb = N.cabin(v.spec), h = cb.hatch, out = [E.side * (cb.hw + 0.5), cb.door.z1 + 0.12], edge = [E.side * (cb.hw - 0.1), h.z + 0.3];
      if (!E.pulled) {
        E.pulled = true;
        v.ai = null;
        v.ctl.thr = 0;
        v.ctl.hand = true;
        if (v.driver && !v.driver.isPlayer) this.evict(v, p, E.side);
        else if (!v.used) { this.stats.carsStolen++; this.crime('steal', v.x, v.z); }
      }
      const climb = E.ph === 'climb', k = Math.min(1, E.t / (climb ? 0.9 : 0.4)), s = N.smooth(0, 1, k);
      const pos = climb ? this.pathAt(v, [out, edge, [h.x, h.z]], s) : this.carLocal(v, h.x, h.z);
      p.x = pos.x;
      p.z = pos.z;
      p.y = climb ? N.lerp(E.y0, v.y + h.y, N.smooth(0, 0.7, k)) : v.y + h.y - 1.1 * s;
      p.yaw = N.turnTo(p.yaw, v.yaw, dt * 6);
      p.anim.sit = 0;
      if (k < 1) return;
      if (climb) { E.ph = 'drop'; E.t = 0; return; }
      if (v.driver && v.driver !== p) { this.cancelEnter(p); return; }
      p.enter = null;
      v.ai = null;
      v.used = true;
      this.seat(p, v, true);
      v.ctl = { thr: 0, steer: 0, hand: false };
      this.emit({ t: 'enter', v });
    }

    beginExit(p, v) {
      const bike = v.spec.type === 'bike';
      let side = 0;
      for (const s of [-1, 1]) { const d = this.doorPos(v, s); if (this.pedSpotFree(d.x, d.z)) { side = s; break; } }
      if (!side) { this.exitVehicle(p); return; }
      this.unseat(p);
      v.ctl.thr = 0;
      v.ctl.steer = 0;
      v.ctl.hand = true;
      if (v.spec.shape.hatch) {
        p.exit = { v, side, ph: 'hatch', t: 0 };
        p.anim.sit = 0;
        p.anim.doorArm = null;
        p.state = 'idle';
        this.emit({ t: 'exit', v });
        return;
      }
      p.exit = { v, side, ph: bike ? 'off' : side > 0 ? 'slide' : 'open', t: 0 };
      p.anim.sit = 1;
      p.anim.doorArm = null;
      p.state = 'idle';
      this.emit({ t: 'exit', v });
    }

    stepExit(p, dt, inp) {
      const X = p.exit, v = X.v;
      if (!v || v.removed) { p.exit = null; p.anim.sit = 0; return; }
      X.t += dt;
      p.fireT = Math.max(0, p.fireT - dt);
      if (X.ph === 'hatch') {
        const cb = N.cabin(v.spec), h = cb.hatch, k = Math.min(1, X.t / 1.1);
        const pos = k < 0.35 ? this.carLocal(v, h.x, h.z) : this.pathAt(v, [[h.x, h.z], [X.side * (cb.hw - 0.1), h.z + 0.3], [X.side * (cb.hw + 0.5), cb.door.z1 + 0.12]], N.smooth(0.35, 1, k));
        p.x = pos.x;
        p.z = pos.z;
        const gy = this.city.groundY(p.x, p.z);
        p.y = k < 0.35 ? v.y + h.y - 1.1 * (1 - N.smooth(0, 0.35, k)) : N.lerp(v.y + h.y, Math.max(gy, v.y), N.smooth(0.55, 1, k));
        p.wantVx = p.wantVz = p.vx = p.vz = 0;
        p.yaw = N.turnTo(p.yaw, this.faceYaw(v, -X.side), dt * 6);
        if (k >= 1) { p.y = Math.max(gy, v.y); p.exit = null; }
        return;
      }
      const rootY = v.y + this.seatRootY(p, v);
      const seatS = this.seatXZ(v, X.side);
      if (X.ph === 'slide' || X.ph === 'open') {
        const k = X.ph === 'slide' ? N.smooth(0, 1, X.t / 0.36) : 1;
        const pos = X.ph === 'slide' ? this.pathAt(v, [this.seatXZ(v, -1), seatS], k) : this.carLocal(v, seatS[0], seatS[1]);
        p.x = pos.x; p.z = pos.z; p.y = rootY; p.yaw = v.yaw;
        p.wantVx = p.wantVz = p.vx = p.vz = 0;
        p.anim.sit = 1;
        if (X.ph === 'slide' && X.t >= 0.36) { X.ph = 'open'; X.t = 0; }
        else if (X.ph === 'open') {
          if (X.t > 0.08 && !X.opened) { X.opened = true; this.openDoor(v, X.side); }
          if (X.t > 0.34) { X.ph = 'out'; X.t = 0; X.yaw0 = p.yaw; }
        }
        return;
      }
      if (X.ph === 'out' || X.ph === 'off') {
        const dur = X.ph === 'off' ? 0.45 : 0.58;
        const k = Math.min(1, X.t / dur);
        const s = N.smooth(0, 1, k);
        const pos = X.ph === 'off' ? this.pathAt(v, [this.seatXZ(v, -1), this.outXZ(v, X.side)], s) : this.pathAt(v, [seatS, this.gapXZ(v, X.side), this.outXZ(v, X.side)], s);
        p.x = pos.x; p.z = pos.z;
        const gy = this.city.groundY(p.x, p.z);
        p.y = N.lerp(rootY, Math.max(gy, v.y), N.smooth(0.2, 0.9, k));
        const out = N.yawOf(X.side * Math.cos(v.yaw), X.side * Math.sin(v.yaw));
        const face = X.ph === 'off' ? v.yaw : this.faceYaw(v, X.side);
        p.yaw = k < 0.6 ? N.wrap(v.yaw + N.wrap(out - v.yaw) * N.smooth(0.1, 0.6, k) * 0.7) : N.turnTo(p.yaw, face, dt * 9);
        p.wantVx = p.wantVz = p.vx = p.vz = 0;
        p.anim.sit = 1 - N.smooth(0.1, 0.85, k);
        if (k >= 1) {
          p.anim.sit = 0;
          p.y = Math.max(gy, v.y);
          if (X.ph === 'off') { p.exit = null; return; }
          X.ph = 'close'; X.t = 0;
        }
        return;
      }
      const moving = Math.abs(inp.fwd || 0) + Math.abs(inp.right || 0) > 0.1;
      p.wantVx = p.wantVz = 0;
      p.yaw = N.turnTo(p.yaw, this.faceYaw(v, X.side), dt * 9);
      if (X.t > 0.1 && !X.closed) { X.closed = true; this.closeDoor(v, X.side); }
      if (X.t > 0.36 || moving && X.closed) { if (!X.closed) this.closeDoor(v, X.side); p.exit = null; }
    }

    drivePlayer(p, dt, inp) {
      const v = p.veh;
      if (v.driver !== p) {
        if (inp.enter) this.exitVehicle(p);
        return;
      }
      if (v.dead) { this.exitVehicle(p, true); return; }
      const fwd = inp.fwd || 0;
      v.ctl.thr = N.clamp(fwd, -1, 1);
      v.ctl.steer = N.clamp(inp.steer !== undefined ? inp.steer : (inp.right || 0), -1, 1);
      v.ctl.hand = !!inp.hand;
      v.ctl.burn = !!inp.burn && !v.spec.turret;
      if (v.ctl.burn) v.ctl.thr = 1;
      if (inp.horn) { v.horn = 0.3; if (v.spec.liveries && v.livery && N.SIRENS.has(v.spec.liveries[v.livery].beacon)) v.siren = !v.siren; this.hornScare(v); }
      else v.horn = Math.max(0, v.horn - dt);
      p.x = v.x; p.z = v.z; p.y = v.y; p.yaw = v.yaw;
      if (inp.nextWeapon) this.cycleWeapon(p, 1);
      if (inp.prevWeapon) this.cycleWeapon(p, -1);
      if (v.spec.turret) this.vehicleGuns(p, v, dt, inp);
      else if (inp.driveBySide) this.handleWeapon(p, dt, inp, true);
      else p.fireT = Math.max(0, p.fireT - dt);
      if (p.anim.doorArm) { p.anim.doorArm.t += dt; if (p.anim.doorArm.t > 0.5) p.anim.doorArm = null; }
      if (inp.enter && !p.enterLock) {
        if (Math.abs(v.spd) < 2.5 && !v.sink && v.up > 0.6) this.beginExit(p, v);
        else this.exitVehicle(p, Math.abs(v.spd) > 8);
      }
      this.stats.driven += Math.abs(v.spd) * dt;
    }

    gunPose(v, coax) {
      const T = v.spec.turret, P = T.pivot, G = T.gun, q = coax ? T.coax : [0, 0, -T.len];
      const gp = v.gunPitch || 0, cp = Math.cos(gp), sp = Math.sin(gp);
      const lx = G[0] + q[0], ly = G[1] + q[1] * cp - q[2] * sp, lz = G[2] + q[1] * sp + q[2] * cp;
      const ty = v.turretYaw || 0, c = Math.cos(ty), s = Math.sin(ty);
      const w = this.carLocal(v, P[0] + lx * c - lz * s, P[2] + lx * s + lz * c), Y = v.yaw + ty;
      return { x: w.x, y: v.y + P[1] + ly, z: w.z, dx: Math.sin(Y) * cp, dy: sp, dz: -Math.cos(Y) * cp };
    }

    aimTurret(v, tx, ty, tz, dt) {
      const T = v.spec.turret, P = this.carLocal(v, T.pivot[0], T.pivot[2]);
      const dx = tx - P.x, dz = tz - P.z, dh = Math.hypot(dx, dz);
      if (dh < 1) return;
      const turn = N.wrap(N.yawOf(dx, dz) - v.yaw - v.turretYaw), st = T.traverse * dt;
      v.turretYaw = N.wrap(v.turretYaw + N.clamp(turn, -st, st));
      const G = N.VEH_GUNS[T.main], gy = v.y + T.pivot[1] + T.gun[1];
      const want = N.clamp(Math.atan2(ty - gy, dh) + (G.speed ? 0.5 * N.G * dh / (G.speed * G.speed) : 0), T.depress, T.elev), sp = 0.7 * dt;
      v.gunPitch += N.clamp(want - v.gunPitch, -sp, sp);
    }

    vehicleGuns(p, v, dt, inp) {
      v.reloadT = Math.max(0, v.reloadT - dt);
      v.gunT = Math.max(0, v.gunT - dt);
      v.coaxT = Math.max(0, v.coaxT - dt);
      v.recoil = Math.max(0, v.recoil - dt * 2.5);
      p.fireT = Math.max(0, p.fireT - dt);
      if (inp.aimO && inp.aimD) {
        const a = this.aimPoint(inp.aimO, inp.aimD, 400, p);
        this.aimTurret(v, a.x, a.y, a.z, dt);
      }
      if (inp.fire) this.fireTurret(p, v, false);
      if (inp.aim) this.fireTurret(p, v, true);
    }

    fireTurret(p, v, coax, spreadK) {
      const T = v.spec.turret, id = coax ? T.coaxGun : T.main, G = N.VEH_GUNS[id], cannon = !!G.radius, k = spreadK || 1;
      if (coax ? v.coaxT > 0 : cannon ? v.reloadT > 0 : v.gunT > 0) return false;
      const m = this.gunPose(v, coax);
      if (cannon) {
        const j = G.spread * (k - 1);
        let dx = m.dx, dy = m.dy, dz = m.dz;
        if (j > 0) {
          dx += (this.rng() - 0.5) * 2 * j; dy += (this.rng() - 0.5) * 2 * j; dz += (this.rng() - 0.5) * 2 * j;
          const L = Math.hypot(dx, dy, dz);
          dx /= L; dy /= L; dz /= L;
        }
        v.reloadT = T.reload || 6;
        v.recoil = 1;
        this.projs.push({ id: this.nextId++, type: 'shell', x: m.x, y: m.y, z: m.z, px: m.x, py: m.y, pz: m.z, vx: dx * G.speed, vy: dy * G.speed, vz: dz * G.speed, t: 0, life: 4, owner: p, gun: id });
        this.emit({ t: 'shot', w: id, x: m.x, y: m.y, z: m.z, dx, dy, dz, p });
        v.vx -= dx * 0.3;
        v.vz -= dz * 0.3;
        this.alarm(m.x, m.z, 60, p);
      } else {
        if (coax) v.coaxT = G.rate; else v.gunT = G.rate;
        this.fire(p, id, m.x, m.y, m.z, m.dx, m.dy, m.dz, G.spread * k);
      }
      if (p.isPlayer) this.crime('gunfire', v.x, v.z);
      return true;
    }

    crush(t, c, imp) {
      if (t.spec.type !== 'tank' || c.spec.type === 'tank' || c.dead || imp < 2 || Math.abs(t.spd) < 6) return;
      const by = t.driver && t.driver.isPlayer ? this.player : null;
      if (by) c.lastHitByPlayer = this.t;
      this.damageVehicle(c, c.spec.armor !== undefined ? 600 : c.maxHp * 1.2, by, true);
      if (c.ai && c.ai.mode === 'lane') N.AI.bump(c, this);
    }

    hornScare(v) {
      this.near(v.x, v.z, 12, e => {
        if (e.kind !== 'ped' || e.dead || e.isPlayer || e.cop || e.gang || (e.ai && e.ai.mission)) return;
        const dx = e.x - v.x, dz = e.z - v.z;
        const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw);
        if (dx * fx + dz * fz > 0) N.AI.dodge(e, v);
      });
    }

    stepVehicles(dt) {
      for (const v of this.vehs) { v.prevHp = v.hp; v.hitDv = 0; v.hitBy = null; v.scrape = 0; v.landDv = 0; v.pvx = v.vx; v.pvz = v.vz; }
      for (const v of this.vehs) {
        if (v.ai && v.ai.mode === 'lane') continue;
        if (v.parked && !v.driver && Math.abs(v.vx) + Math.abs(v.vz) + Math.abs(v.wz) < 0.01 && !v.air) continue;
        const sub = v === this.player.veh ? 4 : 3, h = dt / sub;
        for (let s = 0; s < sub; s++) {
          Phys.stepVehicle(v, this.city, h, this.wx.grip);
          Phys.collideVehicleStatic(v, this.city, this);
        }
        v.parked = false;
      }
      for (let i = 0; i < this.vehs.length; i++) {
        const a = this.vehs[i];
        this.near(a.x, a.z, 8, b => {
          if (b.kind !== 'veh' || b.id <= a.id) return;
          const r = a.spec.hl + b.spec.hl;
          if (Math.abs(a.x - b.x) > r || Math.abs(a.z - b.z) > r) return;
          const imp = Phys.collideVehicles(a, b);
          if (imp > 0.5) {
            if (a.ai && a.ai.mode === 'lane') N.AI.bump(a, this);
            if (b.ai && b.ai.mode === 'lane') N.AI.bump(b, this);
            a.parked = b.parked = false;
          }
          if (imp > 0) { this.crush(a, b, imp); this.crush(b, a, imp); }
        });
      }
      for (const v of this.vehs) {
        if (v.hitDv > 0) this.crash(v, v.hitDv, v.hitBy);
        if (v.scrape > 4 && this.t - v.scrapeT > 0.09) { v.scrapeT = this.t; this.emit({ t: 'scrape', v, x: v.scrapeX, y: v.y + 0.45, z: v.scrapeZ, force: v.scrape }); }
        if (v.landDv > 3.5 && this.t - (v.landT || 0) > 0.3) { v.landT = this.t; this.emit({ t: 'land', v, x: v.x, z: v.z, force: v.landDv }); }
      }
      for (let i = this.vehs.length - 1; i >= 0; i--) {
        const v = this.vehs[i];
        if (!v.dead) {
          const roof = v.up < -0.3 && Math.hypot(v.vx, v.vz) < 3 && v.spec.type !== 'bike' && !(v.driver && v.driver.isPlayer && this.god);
          v.upT = roof ? v.upT + dt : 0;
          if (v.upT > 2.5 && v.hp > v.maxHp * 0.24) v.hp = v.maxHp * 0.24;
          if (v.hp <= 0) {
            v.burning = true;
            v.burnT -= dt;
            if (v.burnT <= 0) this.blowUp(v);
          } else if (v.hp < v.maxHp * 0.25) {
            v.burning = true;
            v.hp -= v.maxHp * 0.04 * dt;
            if (v.hp <= 0) { v.hp = 0; v.burnT = 0.4; }
          } else v.burning = false;
        }
        v.fire = v.burning ? (v.hp > 0 ? 0.5 : 1) : 0;
        v.smoke = v.dead ? 0.6 : v.hp < v.maxHp * 0.25 ? 1 : v.hp < v.maxHp * 0.45 ? 0.6 : v.hp < v.maxHp * 0.65 ? 0.25 : 0;
        v.damageFactor = v.hp < v.maxHp * 0.3 ? 0.7 : 1;
        if (v.dead) v.wreckT = (v.wreckT || 0) + dt;
        if (v.door) {
          for (let k = 0; k < 2; k++) {
            if (v.doorHold[k] > 0) { v.doorHold[k] -= dt; if (v.doorHold[k] <= 0) v.doorT[k] = 0; }
            const was = v.door[k];
            v.door[k] = N.approach(was, v.doorT[k], dt * (v.doorT[k] > was ? 3.4 : 4.4));
            if (was > 0.02 && v.door[k] === 0) this.emit({ t: 'door', v, open: false });
          }
        }
        if (v.sink > 0) {
          if (v.driver && v.driver.isPlayer && v.sink > 1.2) { const pl = v.driver; this.exitVehicle(pl); pl.y = (v.wl !== undefined ? v.wl : N.WATER_Y) - 1.2; }
          if (v.sink > 5 && !(v.driver && v.driver.isPlayer)) { if (v.persistent) v.dead = true; else { this.removeVehicle(v); continue; } }
        }
        v.lights = this.darkness() > 0.4 && (!!v.driver || (v.ai && v.ai.mode === 'lane')) && !v.dead;
        v.brake = v.driver && (v.ctl.thr < -0.1 && v.spd > 0.5 || v.ctl.hand || v.ctl.burn);
        v.rev = !!v.driver && !v.dead && (v.spd < -0.3 || (v.driver.isPlayer && v.ctl.thr < -0.1 && v.spd < 0.8));
      }
    }

    crash(v, dv, other) {
      const dmg = N.crashDamage(v, dv);
      if (dmg > 0 && !(v.driver && v.driver.isPlayer && this.god)) this.damageVehicle(v, dmg, other && other.driver && other.driver.isPlayer ? this.player : null);
      if (dv > 5.5) this.emit({ t: 'crash', v, x: v.x, z: v.z, force: dv });
      if (v.spec.type === 'bike' && dv > 9 && v.driver) {
        const d = v.driver;
        this.exitVehicle(d, true);
        this.knockDown(d, 2, v.vx * 0.7, v.vz * 0.7, 3);
      }
      if (other && other.driver && other.driver.isPlayer && v.driver && !v.driver.isPlayer && dv > 2.5 && ((other.pvx || 0) * (v.x - other.x) + (other.pvz || 0) * (v.z - other.z)) / (Math.hypot(v.x - other.x, v.z - other.z) || 1) > 1.5) {
        if (v.driver.cop) this.crime('ramcop', v.x, v.z);
        else N.AI.crashReact(this, v, other, dv);
      }
    }

    stepPeds(dt) {
      for (const p of this.peds) {
        p.stateT -= dt;
        p.hurtT = Math.max(0, (p.hurtT || 0) - dt);
        p.invuln = Math.max(0, (p.invuln || 0) - dt);
        const A = p.anim;
        if (A.actionT > 0) { A.actionT -= dt; if (A.actionT <= 0 && A.action !== 'windup') A.action = null; }
        if (A.flinch > 0) A.flinch -= dt;
        if (A.jumpT > 0) A.jumpT -= dt;
        if (A.land > 0) A.land -= dt;
        if (A.gest) { A.gest.t += dt; if (A.gest.d && A.gest.t >= A.gest.d) A.gest = null; }
        A.shot = (A.shot === undefined ? 9 : A.shot) + dt;
        if (A.board) { A.board.t += dt; if (A.board.t > 0.6) A.board = null; }
        if (A.alight) { A.alight.t += dt; if (A.alight.t > 0.55) A.alight = null; }
        if (p.holdT > 0) p.holdT -= dt;
        if (p.veh) {
          const v = p.veh;
          p.x = v.x; p.z = v.z; p.y = v.y; p.yaw = v.yaw;
          if (!p.isPlayer) A.sit = 1;
          continue;
        }
        if (p.rope) {
          const r = p.rope;
          p.x = r.x; p.z = r.z; p.vx = p.vz = p.vy = 0; p.wantVx = p.wantVz = 0;
          p.y = Math.max(r.g, p.y - r.v * dt);
          p.onGround = false;
          A.rope = 1;
          if (p.dead || p.y <= r.g + 0.01) {
            p.rope = null;
            A.rope = 0;
            p.onGround = p.y <= r.g + 0.01;
            if (!p.dead) { p.ai = r.ai; A.land = 0.3; }
          }
          continue;
        }
        if (this.busy(p)) continue;
        if (p.dead) {
          p.deadT += dt;
          p.anim.fall = Math.min(1, p.anim.fall + dt * 3);
          p.wantVx = p.wantVz = 0;
          if (p.onGround) {
            const k = Math.max(0, 1 - dt * 4);
            p.vx *= k; p.vz *= k;
          }
        } else if (p.state === 'down') {
          p.anim.fall = Math.min(1, p.anim.fall + dt * 4);
          p.wantVx = p.wantVz = 0;
          if (p.stateT <= 0 && p.onGround) { p.state = 'idle'; p.anim.fall = 0; p.anim.getUp = 0.5; p.anim.tumble = null; }
        }
        const tb = A.tumble;
        if (tb) {
          if (!p.dead && p.state !== 'down') A.tumble = null;
          else if (!p.onGround) tb.a = Math.abs(tb.a + tb.v * dt) < Math.abs(tb.to) ? tb.a + tb.v * dt : tb.to;
          else { tb.a = N.approach(tb.a, tb.to, dt * 14); if (tb.a === tb.to) A.tumble = null; }
        }
        if (!p.isPlayer && !p.veh) A.sit = 0;
        if (p.isPlayer && this.fly && !p.dead) this.flyStep(p, dt);
        else if (p.bench && !p.dead && p.state !== 'down' && p.ai && p.ai.mode === 'bench') { p.vx = p.vz = p.vy = 0; p.onGround = true; }
        else if ((p.ride || p.fixed) && !p.dead) { p.vx = p.vz = p.vy = 0; p.onGround = true; }
        else {
          Phys.stepPed(p, this.city, dt, this);
          if (p.landImpact) {
            const soft = p.isPlayer && (this.superJump || p.safeFall);
            if (p.landImpact > 2.8 && !p.dead) A.land = Math.min(0.32, p.landImpact * 0.045);
            if (p.landImpact > 9 && !soft) this.damagePed(p, (p.landImpact - 9) * 14, null, 'fall');
            p.landImpact = 0;
          }
          if (p.onGround || p.swim) p.safeFall = false;
          this.stepWater(p, dt);
        }
        this.stepBurn(p, dt);
        const sp = Math.hypot(p.vx, p.vz);
        A.phase += dt * (sp > 0.05 ? 0.35 + 0.5 * Math.sqrt(sp) : 0) * Math.PI * 2;
        A.speed = sp;
        if (A.getUp > 0) A.getUp -= dt;
      }
      for (const p of this.peds) {
        if (p.veh || p.dead || this.busy(p) || p.swim || (p.isPlayer && this.fly) || p.ride || p.fixed) continue;
        this.near(p.x, p.z, 5, e => {
          if (e.kind === 'veh') this.pedVsCar(p, e);
          else if (e !== p && e.kind === 'ped' && !e.veh && !e.dead && !e.ride && !e.fixed && e.id > p.id) {
            const dx = e.x - p.x, dz = e.z - p.z;
            const d2 = dx * dx + dz * dz;
            if (d2 < 0.42 && d2 > 1e-6 && Math.abs(e.y - p.y) < 1) {
              const d = Math.sqrt(d2), push = (0.65 - d) * 0.5;
              p.x -= dx / d * push; p.z -= dz / d * push;
              e.x += dx / d * push; e.z += dz / d * push;
            }
          }
        });
      }
    }

    pedVsCar(p, e) {
      if (p.y > e.y + e.spec.shape.H * 0.8 || p.y + 1.6 < e.y) return;
      const down = p.state === 'down';
      if (down && !p.onGround) return;
      const c = N.circleObb(p.x, p.z, down ? 0.45 : 0.34, Phys.obbOf(e));
      if (!c) return;
      const sp = Math.hypot(e.vx, e.vz);
      const by = e.driver && e.driver.isPlayer ? this.player : e.driver;
      if (down) {
        if (sp < 2.5) { p.x += c.nx * c.depth; p.z += c.nz * c.depth; return; }
        if (p.underT > this.t) return;
        p.underT = this.t + 0.45;
        if (e.spec.type !== 'tank') e.vy = Math.max(e.vy || 0, Math.min(1.4, sp * 0.07) * (e.spec.mass < 2500 ? 1 : 0.3));
        this.damagePed(p, (e.spec.type === 'tank' ? 400 : 6 + sp * 2.2), by, 'car');
        this.emit({ t: 'runover', p, v: e, x: p.x, z: p.z, force: sp * 0.5, under: true });
        if (by && by.isPlayer && !p.dead) this.crime('runover', p.x, p.z, p);
        return;
      }
      const vn = e.vx * c.nx + e.vz * c.nz;
      if (vn > 2.2) { this.hitPed(p, e, c, vn, sp, by); return; }
      p.x += c.nx * c.depth;
      p.z += c.nz * c.depth;
      const pn = p.vx * c.nx + p.vz * c.nz, want = Math.max(0, vn * 1.4);
      if (pn < want) { p.vx += c.nx * (want - pn); p.vz += c.nz * (want - pn); }
      if (vn > 0.9 && !p.isPlayer) {
        p.anim.flinch = 0.3;
        if (!p.cop && !p.gang && !(p.ai && p.ai.mission)) N.AI.dodge(p, e);
      }
    }

    hitPed(p, e, c, vn, sp, by) {
      const fx = sp > 0.5 ? e.vx / sp : c.nx, fz = sp > 0.5 ? e.vz / sp : c.nz;
      const front = c.nx * fx + c.nz * fz > 0.55;
      const lat = c.nx * -fz + c.nz * fx;
      const roll = front && vn > 8.5 && e.spec.shape.H < 1.75 && e.spec.type !== 'bike';
      const facing = Math.sin(p.yaw) * -fx - Math.cos(p.yaw) * -fz > 0;
      p.yaw = facing ? N.yawOf(-fx, -fz) : N.yawOf(fx, fz);
      const keep = roll ? 0.55 : 0.8, push = 1.6 + vn * 0.08;
      const vy = roll ? Math.min(7.5, 3 + vn * 0.2) : Math.min(5, 1.1 + vn * 0.16);
      const side = (lat >= 0 ? 1 : -1) * (roll ? 1.2 : 0.6 + vn * 0.06);
      this.knockDown(p, 1.4 + Math.min(1.6, vn * 0.07), e.vx * keep + c.nx * push - fz * side, e.vz * keep + c.nz * push + fx * side, vy);
      const air = 2 * vy / N.G, turns = vn > 11 ? 1 : 0;
      p.anim.tumble = turns ? { a: 0, n: turns, to: Math.PI * 2 * turns * (facing ? 1 : -1), v: Math.PI * 2 * turns * (facing ? 1 : -1) / Math.max(0.35, air) } : null;
      p.underT = this.t + 0.6;
      const mp = 80, k = (2 * mp / (e.spec.mass + mp)) * 0.6;
      if (e.ai && e.ai.mode === 'lane') e.ai.v *= 1 - k;
      else if (e.spec.type !== 'tank') { e.vx -= c.nx * vn * k; e.vz -= c.nz * vn * k; }
      this.damagePed(p, Math.pow(vn, 1.55) * 1.1 * (e.spec.type === 'tank' ? 4 : 1), by, 'car', [fx, fz]);
      this.emit({ t: 'runover', p, v: e, x: p.x, z: p.z, force: vn });
      if (by && by.isPlayer && !p.dead) this.crime('runover', p.x, p.z, p);
    }

    stepWater(p, dt) {
      const STAND = 1.25;
      const prev = p.prevWade || 0;
      if (p.wl !== null && p.wl !== undefined) {
        if (p.wade > 0.05 && prev <= 0.05 && (p.vy < -2 || Math.hypot(p.vx, p.vz) > 4.5)) this.emit({ t: 'splash', x: p.x, y: p.wl, z: p.z, big: true, p });
        if (p.isPlayer && p.wade > 0.25 && !p.wadeSeen && !p.dead) { p.wadeSeen = true; this.emit({ t: 'wade', p }); }
      } else p.wadeSeen = false;
      p.prevWade = p.wade || 0;
      if (p.dead || p.veh) { p.swim = null; return; }
      if (!p.swim) {
        if (p.wl !== null && p.wl !== undefined && p.deepAt > STAND && p.y < p.wl - 0.9) {
          p.swim = { t: 0, dur: p.isPlayer ? 3.2 : 1.9 + N.hash2(p.id, 17, 5) * 1.4, under: false, ut: 0 };
          if (p.state === 'down') { p.state = 'idle'; p.anim.fall = 0; }
          p.anim.action = null;
          p.anim.aim = 0;
          p.charging = 0;
          p.reloadT = 0;
          this.emit({ t: 'drowning', p, x: p.x, y: p.wl, z: p.z });
        }
        return;
      }
      const s = p.swim;
      s.t += dt;
      if (p.wl === null || p.wl === undefined || !s.under && p.deepAt < STAND - 0.12) {
        p.swim = null;
        p.y = Math.max(p.y, p.gy);
        p.vy = 0;
        p.onGround = true;
        return;
      }
      if (!s.under && s.t > s.dur) { s.under = true; this.emit({ t: 'gulp', p, x: p.x, y: p.wl, z: p.z }); }
      if (s.under) {
        s.ut += dt;
        if (s.ut > 1.3) this.killPed(p, null, 'drown');
      }
    }

    stepPickups(dt) {
      const pl = this.player;
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const k = this.pickups[i];
        if (k.prop || k.follow) continue;
        k.t += dt;
        if (k.life !== undefined && k.t > k.life) { this.pickups.splice(i, 1); continue; }
        if (k.taken) {
          if (k.respawn && k.t > k.respawn) { k.taken = false; k.t = 0; }
          continue;
        }
        if (pl.dead) continue;
        const r = pl.veh ? 2.4 : 1.25;
        if (Math.abs(pl.x - k.x) > r || Math.abs(pl.z - k.z) > r || Math.abs(pl.y + 0.8 - k.y) > 2.2) continue;
        if (pl.veh && k.type !== 'money' && k.type !== 'bribe' && k.type !== 'stash' && k.type !== 'item') continue;
        if (!this.applyPickup(k)) continue;
        if (k.respawn) { k.taken = true; k.t = 0; } else this.pickups.splice(i, 1);
      }
    }

    applyPickup(k) {
      const pl = this.player;
      if (k.type === 'health') { if (pl.hp >= pl.maxHp) return false; pl.hp = pl.maxHp; }
      else if (k.type === 'armor') { if (pl.armor >= pl.maxArmor) return false; pl.armor = pl.maxArmor; }
      else if (k.type === 'weapon') this.giveWeapon(pl, k.weapon, k.ammo || N.WEAPONS[k.weapon].ammoPack || 1);
      else if (k.type === 'bribe') { if (this.wanted.level <= 0) return false; this.setWanted(this.wanted.level - 1); }
      this.emit({ t: 'pickup', k });
      return true;
    }

    crime(type, x, z, victim) {
      if (this.frozen) return;
      const TABLE = { fare: [40, true], assault: [12, true], kill: [55, false], hitcop: [70, false], killcop: [220, false], carjack: [30, true], steal: [18, true], gunfire: [8, true], runover: [30, true], explosion: [70, false], carboom: [60, false], ramcop: [40, false] };
      const c = TABLE[type];
      if (!c) return;
      if (this.wanted.noCops) return;
      let witnessed = !c[1];
      if (!witnessed) {
        this.near(x, z, 45, e => {
          if (e.kind === 'ped' && e.cop && !e.dead) { witnessed = true; return true; }
          if (e.kind === 'veh' && e.driver && e.driver.cop) { witnessed = true; return true; }
        });
      }
      if (type === 'kill' && !witnessed && this.rng() < 0.5) witnessed = true;
      if (!witnessed) return;
      const w = this.wanted;
      const before = w.level;
      w.heat += c[0];
      if (w.level === 0) w.heat = Math.max(w.heat, HEAT[1]);
      if (type === 'killcop' || type === 'hitcop') w.heat = Math.max(w.heat, HEAT[Math.min(6, Math.max(2, w.level))]);
      if (type === 'killcop' && w.level < 3 && this.stats.copsKilled >= 2) w.heat = Math.max(w.heat, HEAT[3]);
      w.level = this.levelOf(w.heat);
      w.unseen = 0;
      w.lastSeen = { x, z };
      if (w.level > before) this.emit({ t: 'wanted', level: w.level, up: true });
    }

    levelOf(heat) {
      let l = 0;
      for (let i = 1; i < HEAT.length; i++) if (heat >= HEAT[i]) l = i;
      return Math.min(l, this.wanted.cap || 6);
    }

    setWanted(level) {
      const w = this.wanted;
      const before = w.level;
      w.level = N.clamp(level, 0, 6);
      w.heat = HEAT[w.level];
      w.unseen = 0;
      if (w.level === 0) N.AI.standDown(this);
      if (before !== w.level) this.emit({ t: 'wanted', level: w.level, up: w.level > before });
    }

    stepWanted(dt) {
      const w = this.wanted;
      if (w.level <= 0) { w.flash = false; return; }
      w.seenT -= dt;
      if (w.seenT <= 0) {
        w.seenT = 0.5;
        const pl = this.player;
        let seen = false;
        const px = pl.x, py = pl.y + 1.5, pz = pl.z;
        const sight = this.wx.sight, hide = this.hidden ? N.GREEN.hideR : Infinity;
        this.near(px, pz, 70, e => {
          let x, y, z, r;
          if (e.kind === 'ped' && e.cop && !e.dead && !e.veh) { x = e.x; y = e.y + 1.6; z = e.z; r = Math.min(45 * sight, hide); }
          else if (e.kind === 'veh' && e.driver && e.driver.cop && !e.dead) { x = e.x; y = e.y + 1.4; z = e.z; r = Math.min(70 * sight, hide); }
          else return;
          if (N.dist2(x, z, px, pz) > r * r) return;
          if (this.los(x, y, z, px, py, pz)) { seen = true; return true; }
        });
        if (this.heli && this.heli.active && !this.hidden && !this.city.inside(px) && N.dist2(this.heli.x, this.heli.z, px, pz) < 60 * 60) seen = true;
        if (seen) { w.unseen = 0; w.lastSeen = { x: px, z: pz }; } else w.unseen += 0.5;
      }
      w.flash = w.unseen > 3;
      const need = 14 + w.level * 6;
      if (w.unseen > need) {
        w.unseen = 0;
        this.setWanted(w.level - 1);
      }
    }

    bushAt(x, z, r) {
      const h = this.city.bushHash;
      if (!h) return null;
      let best = null, bd = Infinity;
      h.query(x - r - 2, z - r - 2, x + r + 2, z + r + 2, b => {
        const d = Math.hypot(b.x - x, b.z - z) - b.r;
        if (d < r && d < bd) { bd = d; best = b; }
      });
      return best;
    }

    stepGreen(dt) {
      const G = N.GREEN, pl = this.player;
      this.hidden = false;
      if (!this.city.bushHash) return;
      this.near(pl.x, pl.z, 140, e => {
        if (e.kind !== 'veh' || e.dead || e.air || e.sink) return;
        const sp = Math.hypot(e.vx, e.vz);
        if (sp < 1.2) return;
        const b = this.bushAt(e.x, e.z, e.spec.hw ? e.spec.hw * 0.8 : 0.8);
        if (!b) return;
        const k = Math.min(0.5, (b.hedge ? G.hedgeDrag : G.drag) * dt * (e.spec.mass > 4000 ? 0.25 : 1));
        e.vx *= 1 - k;
        e.vz *= 1 - k;
        e.spd = e.vx * Math.sin(e.yaw) - e.vz * Math.cos(e.yaw);
        if (this.t - (b.t || -9) > G.rustle) {
          b.t = this.t;
          this.emit({ t: 'rustle', x: b.x, y: e.y + 0.9, z: b.z, big: sp > 7, hedge: !!b.hedge, kind: b.kind, vx: e.vx, vz: e.vz, veh: e });
        }
      });
      if (pl.veh || pl.dead || pl.swim || this.city.inside(pl.x)) return;
      const b = this.bushAt(pl.x, pl.z, 0.05);
      pl.bush = b;
      if (!b) return;
      pl.wantVx *= G.walk;
      pl.wantVz *= G.walk;
      const sp = Math.hypot(pl.vx, pl.vz);
      this.hidden = !b.hedge && sp < G.hideSpeed && this.t - (pl.firedAt || -99) > 2.5;
      if (sp > 1 && this.t - (b.t || -9) > G.rustle * 1.6) {
        b.t = this.t;
        this.emit({ t: 'rustle', x: pl.x, y: pl.y + 0.9, z: pl.z, big: false, hedge: !!b.hedge, kind: b.kind, vx: pl.vx, vz: pl.vz, p: pl });
      }
    }

    stepJumps(dt) {
      const v = this.player.veh;
      if (!v || v.driver !== this.player) { this.jump = null; return; }
      if (!this.jump) {
        if (!v.air || Math.abs(v.spd) < 16) return;
        for (const j of this.city.jumps) {
          if (N.dist2(v.x, v.z, j.x, j.z) < 8 * 8) { this.jump = { j, t: 0, x: v.x, z: v.z, h: 0 }; this.emit({ t: 'jumpstart', j }); break; }
        }
        return;
      }
      const J = this.jump;
      J.t += dt;
      J.h = Math.max(J.h, v.y);
      if (!v.air) {
        const dist = Math.hypot(v.x - J.x, v.z - J.z);
        this.emit({ t: 'jumpend', j: J.j, dist, air: J.t, h: J.h, ok: J.t > 0.9 && dist > 18 && Math.abs(v.roll) < 1.2 });
        this.jump = null;
      }
    }

    populate(dt) {
      this.spawnT -= dt;
      if (this.spawnT > 0) return;
      this.spawnT = 0.25;
      N.AI.populate(this);
    }
  }

  N.World = World;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
