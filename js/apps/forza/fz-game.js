(function (F) {
  'use strict';

  const EV = () => F.EV;
  const SAVE_KEY = 'fh_riga_profile_v1';
  const MAP_VERSION = 2;
  const RIVAL_LIVERIES = ['number', 'cola', 'fm', 'horizon', 'mobile', 'kafija', 'rally'];

  const SKILL = {
    drift: 'ДРИФТ', air: 'ПОЛЁТ', near: 'ПОЧТИ ЗАДЕЛ', speed: 'СКОРОСТЬ', wreck: 'РАЗРУШЕНИЕ', burn: 'БЁРНАУТ',
    pass: 'ОБГОН', draft: 'СЛИПСТРИМ', ebrake: 'РАЗВОРОТ НА РУЧНИКЕ', landing: 'ЧИСТОЕ ПРИЗЕМЛЕНИЕ', clean: 'ЧИСТЫЙ КРУГ'
  };
  F.SKILL = SKILL;

  const WEATHER = {
    clear: { name: 'Ясно', cover: 0.22, rain: 0, storm: 0, fog: 1, mist: 0, wind: 0.25, temp: 0, dur: [480, 960], next: [['clear', 0.35], ['overcast', 0.5], ['fog', 0.15]] },
    overcast: { name: 'Пасмурно', cover: 0.86, rain: 0, storm: 0, fog: 0.8, mist: 0, wind: 0.45, temp: -3, dur: [300, 600], next: [['clear', 0.38], ['downpour', 0.27], ['storm', 0.2], ['fog', 0.15]] },
    downpour: { name: 'Ливень', cover: 0.97, rain: 1, storm: 0, fog: 0.55, mist: 0, wind: 0.6, temp: -6, dur: [180, 360], next: [['overcast', 0.5], ['storm', 0.25], ['clear', 0.1], ['fog', 0.15]] },
    storm: { name: 'Гроза', cover: 1, rain: 0.85, storm: 1, fog: 0.48, mist: 0, wind: 1, temp: -5, dur: [150, 300], next: [['downpour', 0.55], ['overcast', 0.45]] },
    fog: { name: 'Туман', cover: 0.55, rain: 0, storm: 0, fog: 0.5, mist: 1, damp: 0.35, wind: 0.04, temp: -2, dur: [240, 480], next: [['clear', 0.55], ['overcast', 0.45]] }
  };
  const WX_KEYS = ['cover', 'rain', 'storm', 'fog', 'mist', 'wind'];
  const WX_RATE = { cover: 0.02, rain: 0.035, storm: 0.04, fog: 0.02, mist: 0.02, wind: 0.05 };
  const FOG_HOURS = clock => 0.5 + 2.5 * Math.max(0, Math.cos((clock - 6) / 24 * Math.PI * 2)) ** 3;
  const OLD_WEATHER = { cloudy: 'clear', rain: 'downpour' };

  function weatherId(id) {
    if (WEATHER[id]) return id;
    return OLD_WEATHER[id] || 'clear';
  }

  function weatherParams(id, cover) {
    const w = WEATHER[weatherId(id)];
    const o = { id: weatherId(id), flash: 0, flashDir: [0, 1, 0] };
    for (const k of WX_KEYS) o[k] = w[k];
    if (cover !== undefined && o.id === 'clear') o.cover = cover;
    o.wet = w.rain > 0 ? 1 : w.damp || 0;
    return o;
  }
  F.WEATHER = WEATHER;
  F.weatherId = weatherId;
  F.weatherParams = weatherParams;

  function defaultSettings() {
    return { diff: 1, abs: true, tcs: true, stm: true, auto: true, steer: 'std', line: 'full', dmg: 'full', units: 'kmh', cam: 'chase', vol: 0.8, music: 0.6, engine: 0.9, sfx: 0.8, ambient: 0.8, radio: 0, res: 0, dither: false, gfx: 'ultra', draw: 900, flora: 2, mirror: true, traffic: 1, fov: 0 };
  }

  function newProfile(name) {
    const c = F.Cars.get('vaz2105');
    return {
      v: 1, map: MAP_VERSION, name: name || 'Гонщик', credits: 5000, xp: 0, level: 1, sp: 0, perks: [],
      cars: [{ uid: 1, id: 'vaz2105', up: {}, c1: c.col, c2: c.col2 || c.col, livery: c.livery || 'none', metal: false, dirt: 0, odo: 0 }], current: 1, nextUid: 2,
      band: 0, pts: 0, results: {}, stunts: {}, boards: [], barns: [], outposts: ['hub'], roads: [],
      settings: defaultSettings(), stats: { dist: 0, drift: 0, top: 0, wins: 0, races: 0, smashed: 0, near: 0, air: 0, bestChain: 0, time: 0 },
      prologue: false, finale: false, clock: 11.5, weather: 'clear', pos: null, ftCount: 0
    };
  }

  function loadProfile() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p || p.v !== 1 || !Array.isArray(p.cars)) return null;
      const older = !(p.settings && p.settings.gfx);
      p.settings = Object.assign(defaultSettings(), p.settings || {});
      if (older) { p.settings.dither = false; p.settings.res = 0; }
      p.stats = Object.assign(newProfile().stats, p.stats || {});
      if (p.map !== MAP_VERSION) { p.map = MAP_VERSION; p.roads = []; p.pos = null; }
      p.weather = weatherId(p.weather);
      return p;
    } catch (e) { return null; }
  }

  function saveProfile(p) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); return true; } catch (e) { return false; }
  }

  function wipeProfile() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }

  const PRESETS = [
    {},
    { engine: 1, tires: 1, susp: 1, brakes: 1 },
    { engine: 2, tires: 1, susp: 1, brakes: 1, weight: 1, trans: 1 },
    { engine: 2, tires: 2, susp: 2, brakes: 2, weight: 2, trans: 1, aero: 1 },
    { engine: 3, tires: 2, susp: 2, brakes: 2, weight: 3, trans: 2, aero: 2 }
  ];
  const OFF_PRESETS = [
    {},
    { engine: 1, tires: 3, susp: 3, brakes: 1 },
    { engine: 2, tires: 3, susp: 3, brakes: 1, weight: 1, trans: 1 },
    { engine: 3, tires: 3, susp: 3, brakes: 2, weight: 2, trans: 2 }
  ];

  function classRange(cls) {
    const k = F.CLASSES.find(c => c.c === cls) || F.CLASSES[0];
    return [k.min, k.max];
  }

  function pickRivals(ev, playerPI, n, rng, excludeId) {
    const [cmin, cmax] = classRange(ev.cls);
    const target = F.clamp(playerPI, cmin, cmax);
    const offroad = ev.type === 'dirt' || ev.type === 'cc';
    const cands = [];
    for (const c of F.Cars.CARS) {
      if (c.barn || c.id === 'mclarenf1') continue;
      const stock = F.perfOf(c.id, {}).pi;
      if (stock > target + 12) continue;
      if (stock < target - 320) continue;
      const presets = offroad && c.sh.suv ? OFF_PRESETS : PRESETS;
      let best = null;
      for (const up of presets) {
        const pi = F.perfOf(c.id, up).pi;
        if (pi > target + 12) continue;
        if (!best || pi > best.pi) best = { up, pi };
      }
      if (!best || best.pi < target - 90) continue;
      let w = 1 - Math.abs(target - best.pi) / 120;
      if (offroad) w *= 0.35 + c.off * 1.3;
      else w *= 1.15 - c.off * 0.5;
      cands.push({ id: c.id, up: best.up, pi: best.pi, w: Math.max(0.05, w) });
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      let pool = cands.filter(c => out.filter(o => o.id === c.id).length < 2);
      if (!pool.length) pool = cands;
      const tot = pool.reduce((a, c) => a + c.w, 0);
      let r = rng() * tot, pick = pool[0];
      for (const c of pool) { r -= c.w; if (r <= 0) { pick = c; break; } }
      if (!pick) break;
      out.push(pick);
    }
    return { rivals: out, target };
  }

  class Game {
    constructor(world, o = {}) {
      this.world = world;
      this.profile = o.profile || newProfile();
      this.out = [];
      this.mode = 'free';
      this.time = 0;
      this.rng = F.rng((o.seed || 1) + 5);
      this.traffic = new F.Traffic(world, { seed: 11 });
      this.traffic.density = this.profile.settings.traffic;
      this.chain = null;
      this.drift = null;
      this.race = null;
      this.snaps = [];
      this.snapT = 0;
      this.rewinding = false;
      this.stuntState = {};
      this.broken = [];
      this.lastRoadPos = null;
      this.near = new Map();
      this.speedT = 0; this.burnT = 0; this.draftT = 0; this.hbT = 0; this.hbYaw = 0;
      this.saveT = 0;
      this.clock = this.profile.clock || 12;
      this.weather = weatherId(this.profile.weather);
      this.clearCover = WEATHER.clear.cover;
      this.weatherT = 600;
      this.wx = weatherParams(this.weather);
      this.wetK = this.wx.wet;
      this.boltT = 4;
      this.waypoint = null;
      this.gps = null;
      this.zoneRoutes = {};
      this.trapPrev = {};
      this.prepareStunts();
      this.roadsSeen = new Set(this.profile.roads || []);
      this.damages = new Map();
      this.wreckT = 0; this.fixT = 0; this.repairCool = 0;
      this.traffic.crash = (a, c, hit, speed) => this.rivalTrafficCrash(a, c, hit, speed);
      this.setCar(this.profile.current);
      if (o.place !== false) this.placeStart();
    }

    emit(e) { this.out.push(e); }
    drain() { const o = this.out; this.out = []; return o; }

    get settings() { return this.profile.settings; }

    carEntry(uid = this.profile.current) { return this.profile.cars.find(c => c.uid === uid) || this.profile.cars[0]; }
    playerCarId() { return this.veh ? this.veh.spec.id : null; }

    assist() {
      const s = this.settings;
      return { abs: s.abs, tcs: s.tcs, stm: s.stm, auto: s.auto, steer: s.steer };
    }

    setCar(uid, keepPose = true) {
      const entry = this.carEntry(uid);
      this.profile.current = entry.uid;
      const spec = F.Cars.spec(entry.id, entry.up);
      const old = this.veh;
      this.veh = new F.Vehicle(spec, { assist: this.assist() });
      if (old && keepPose) {
        this.veh.place(old.x, old.z, old.yaw, this.world);
      }
      this.entry = entry;
      this.veh.dmg = this.damageFor(entry, spec);
      this.paint1 = F.hexRgb(entry.c1);
      this.paint2 = F.hexRgb(entry.c2 || entry.c1);
      this.emit({ t: 'car', id: entry.id });
    }

    applyAssists() { if (this.veh) this.veh.assist = this.assist(); }

    refreshSpec() {
      const entry = this.entry;
      const spec = F.Cars.spec(entry.id, entry.up);
      this.veh.setSpec(spec);
      if (this.veh.dmg) this.veh.dmg.setWing(spec.wing);
      this.paint1 = F.hexRgb(entry.c1);
      this.paint2 = F.hexRgb(entry.c2 || entry.c1);
    }

    damageFor(entry, spec, fresh = false) {
      const mode = this.settings.dmg || 'full';
      if (mode === 'off' || !entry) return null;
      let d = fresh ? null : this.damages.get(entry.uid);
      if (!d) {
        d = new F.Damage(F.Cars.get(entry.id), { mech: mode === 'full', wing: spec ? spec.wing : null, seed: entry.uid * 101 + 7 });
        if (!fresh) this.damages.set(entry.uid, d);
      }
      d.mechOn = mode === 'full';
      d.refreshMech();
      return d;
    }

    applyDamageMode() {
      const mode = this.settings.dmg || 'full';
      if (mode === 'off') {
        this.veh.dmg = null;
        this.damages.clear();
        this.wreckT = 0;
        return;
      }
      if (!this.veh.dmg) this.veh.dmg = this.race ? this.damageFor(this.entry, this.veh.spec, true) : this.damageFor(this.entry, this.veh.spec);
      this.veh.dmg.mechOn = mode === 'full';
      if (!this.veh.dmg.mechOn) this.veh.dmg.patch(this.veh.dmg.hp);
      this.veh.dmg.refreshMech();
    }

    otherDamage(o) {
      if ((this.settings.dmg || 'full') === 'off') return null;
      if (!o.dmg) o.dmg = new F.Damage(F.Cars.get(o.id), { mech: false, wing: o.spec ? o.spec.wing : null, seed: (o.uid || 1) * 37 + 5 });
      return o.dmg;
    }

    dentOther(o, d, px, pz, nx, nz, speed, hard) {
      const fx = Math.sin(o.yaw), fz = -Math.cos(o.yaw), rx = -fz, rz = fx, sh = F.Cars.get(o.id).sh;
      const hl = o.hl || sh.len / 2, hw = o.hw || sh.wid / 2;
      const u = F.clamp((px - o.x) * fx + (pz - o.z) * fz, -hl, hl), v = F.clamp((px - o.x) * rx + (pz - o.z) * rz, -hw, hw);
      const rec = d.hit(v, null, -u, nx * rx + nz * rz, -(nx * fx + nz * fz), speed, hard, 1);
      const paint1 = o.paint1 || o.rgb || (o.col ? F.hexRgb(o.col) : null);
      let vx = 0, vz = 0;
      if (o.vx !== undefined) { vx = o.vx; vz = o.vz; } else if (o.velocity) { const q = o.velocity(); vx = q[0]; vz = q[1]; } else if (o.tx !== undefined) { vx = o.tx * (o.v || 0); vz = o.tz * (o.v || 0); }
      const owner = { x: o.x, y: o.y || 0, z: o.z, yaw: o.yaw, vx, vz, id: o.id, wing: o.spec ? o.spec.wing : undefined, dmg: d, paint1, paint2: o.paint2 || paint1, livery: o.livery, metal: o.metal };
      if (rec) this.emit({ t: 'dent', rec, speed, x: px, y: (o.y || 0) + rec.y, z: pz, other: true, owner });
      for (const e of d.drain()) this.emit(Object.assign({ owner, other: true }, e));
      return rec;
    }

    carCrash(o, hit, speed) {
      if (speed < F.DMG.TUNE.v0) return;
      const v = this.veh, m1 = v.spec.mass, m2 = o.mass || 1200;
      const mine = F.clamp(2 * m2 / (m1 + m2), 0.5, 1.5), theirs = F.clamp(2 * m1 / (m1 + m2), 0.5, 1.5);
      if (v.dmg) {
        const n0 = v.events.length;
        v.crash(hit.px, hit.pz, hit.nx, hit.nz, speed, null, 0.75 * mine, 1);
        for (const e of v.events.splice(n0)) this.handleVehEvent(e);
        for (const e of v.dmg.drain()) this.handleVehEvent(e);
      }
      const d = this.otherDamage(o);
      if (d) this.dentOther(o, d, hit.px, hit.pz, -hit.nx, -hit.nz, speed, 0.75 * theirs);
    }

    rivalTrafficCrash(a, c, hit, speed) {
      if (speed < F.DMG.TUNE.v0) return;
      const da = this.otherDamage(a), dc = this.otherDamage(c);
      const m1 = a.mass || 1200, m2 = c.mass || 1200;
      if (da) this.dentOther(a, da, hit.px, hit.pz, hit.nx, hit.nz, speed, 0.75 * F.clamp(2 * m2 / (m1 + m2), 0.5, 1.5));
      if (dc) this.dentOther(c, dc, hit.px, hit.pz, -hit.nx, -hit.nz, speed, 0.75 * F.clamp(2 * m1 / (m1 + m2), 0.5, 1.5));
    }

    playerOwner() {
      const v = this.veh, e = this.entry;
      return { x: v.x, y: v.y, z: v.z, yaw: v.yaw, vx: v.vx, vz: v.vz, id: v.spec.id, wing: v.spec.wing, dmg: v.dmg, paint1: this.paint1, paint2: this.paint2, livery: e.livery, metal: !!e.metal, player: true };
    }

    repairCost() {
      const d = this.veh.dmg;
      if (!d || !d.damaged) return 0;
      const sev = d.severity();
      return Math.max(100, Math.round((150 + 3500 * sev * F.Cars.priceFactor(this.carPI())) / 50) * 50);
    }

    buyRepair() {
      const d = this.veh.dmg, cost = this.repairCost();
      if (!d || !cost || this.race) return false;
      if (this.profile.credits < cost) return false;
      this.profile.credits -= cost;
      d.repair();
      this.wreckT = 0;
      this.save();
      this.emit({ t: 'repaired', cost });
      return true;
    }

    field(dt, inp) {
      const v = this.veh, d = v.dmg;
      const can = !!(d && d.mechOn && !d.burning && !d.burnt && d.hp < F.DMG.TUNE.fixHp && v.speed < 1 && !this.rewinding);
      this.fixable = can;
      if (!can || !inp.fix) {
        if (this.fixT > 0) this.emit({ t: 'fixStop' });
        this.fixT = 0;
        if (d) d.fixing = 0;
        return;
      }
      if (this.fixT === 0) this.emit({ t: 'fixStart' });
      this.fixT += dt;
      d.fixing = this.fixT;
      if (this.fixT >= F.DMG.TUNE.fixT) {
        d.fix();
        d.fixing = 0;
        this.fixT = 0;
        this.emit({ t: 'fixed' });
      }
    }

    serviceStop(dt) {
      if (this.repairCool > 0) { this.repairCool -= dt; return; }
      const v = this.veh, d = v.dmg;
      if (!d || !d.damaged || d.burnt || v.speed > 3) return;
      for (const o of F.MAP.OUTPOSTS) {
        if (!this.profile.outposts.includes(o.id) || Math.hypot(o.x - v.x, o.z - v.z) > 30) continue;
        d.repair();
        this.repairCool = 4;
        this.emit({ t: 'repaired', cost: 0, outpost: o.name });
        return;
      }
    }

    wreck(dt) {
      if (this.wreckT <= 0) return;
      this.wreckT -= dt;
      if (this.wreckT > 0) return;
      const fee = this.race ? 0 : Math.min(500, this.profile.credits);
      this.profile.credits -= fee;
      if (this.veh.dmg) this.veh.dmg.repair();
      this.resetCar();
      this.emit({ t: 'recovered', fee });
    }

    placeStart() {
      const p = this.profile.pos;
      if (p && isFinite(p.x) && !this.world.isWaterAt(p.x, p.z)) this.veh.place(p.x, p.z, p.yaw || 0, this.world);
      else {
        const h = F.MAP.HUB;
        this.veh.place(h.x, h.z, h.yaw, this.world);
      }
    }

    toHub() {
      const h = F.MAP.HUB;
      this.veh.place(h.x, h.z, h.yaw, this.world);
      this.traffic.clear();
    }

    step(dt, inp) {
      const veh = this.veh;
      this.time += dt;
      if (inp.rewind && this.canRewind()) { this.doRewind(dt); return; }
      if (this.rewinding) { this.rewinding = false; this.emit({ t: 'rewindEnd' }); }
      const sub = F.SUB;
      const events = [];
      const pre = { x: veh.x, z: veh.z };
      this.field(dt, inp);
      for (let i = 0; i < sub; i++) {
        veh.step(dt / sub, inp, this.world);
        for (const e of veh.events) events.push(e);
      }
      this.wreck(dt);
      const moved = Math.hypot(veh.x - pre.x, veh.z - pre.z);
      this.profile.stats.dist += moved;
      this.entry.odo = (this.entry.odo || 0) + moved;
      this.soil(dt);
      if (veh.speed * 3.6 > this.profile.stats.top) this.profile.stats.top = veh.speed * 3.6;
      const trafficOn = this.mode === 'free' ? this.settings.traffic > 0 : !!(this.race && this.race.ev.traffic);
      if (trafficOn) {
        this.traffic.density = this.mode === 'free' ? this.settings.traffic : 0.8;
        this.traffic.update(dt, veh, { others: this.race ? this.race.rivals : null });
        this.traffic.collide(veh, this);
      } else if (this.traffic.cars.length) this.traffic.clear();
      if (this.race) this.race.step(dt, veh);
      for (const e of events) this.handleVehEvent(e);
      this.skills(dt, inp);
      if (this.mode === 'free') {
        this.stunts(dt);
        this.discover();
        this.advanceClock(dt);
        this.serviceStop(dt);
      }
      this.updateWeather(dt);
      this.checkWater(dt);
      this.recordSnap(dt);
      this.respawnProps(dt);
      if (this.mode === 'free') {
        this.saveT += dt;
        if (this.saveT > 45) { this.saveT = 0; this.save(); }
      }
      this.updateGps();
    }

    soil(dt) {
      const v = this.veh, s = F.SURF[v.surf] || F.SURF[0], wet = +this.world.wet || 0;
      let d = this.entry.dirt || 0;
      if (s.id === 'water') d -= dt * 0.08 * Math.min(1, v.speed / 6);
      else if (s.loose) d += dt * 0.012 * Math.min(1, v.speed / 12) * (1 + 1.5 * wet);
      d -= dt * 0.0015 * (this.wx ? this.wx.rain : wet);
      this.entry.dirt = F.clamp(d, 0, 1);
    }

    canRewind() {
      if (this.race) return this.race.state === 'race' && this.race.snaps.length > 1;
      return this.snaps.length > 1;
    }

    doRewind(dt) {
      if (!this.rewinding) { this.rewinding = true; this.rewAcc = 0; this.emit({ t: 'rewind' }); this.chainLost(true); }
      this.rewAcc += dt;
      while (this.rewAcc >= 0.05) {
        this.rewAcc -= 0.05;
        if (this.race) {
          const s = this.race.snaps;
          if (s.length > 1) { s.pop(); this.race.restore(s[s.length - 1], this.veh); }
        } else if (this.snaps.length > 1) {
          this.snaps.pop();
          this.veh.restore(this.snaps[this.snaps.length - 1]);
        }
      }
      this.veh.events.length = 0;
      const d = this.veh.dmg;
      if (d) {
        d.drain();
        if (!d.burnt) this.wreckT = 0;
        else if (this.wreckT <= 0) this.wreckT = 3.2;
      }
    }

    recordSnap(dt) {
      if (this.race) return;
      this.snapT += dt;
      if (this.snapT >= 0.1) {
        this.snapT = 0;
        this.snaps.push(this.veh.snap());
        if (this.snaps.length > 120) this.snaps.shift();
      }
    }

    handleVehEvent(e) {
      const st = this.profile.stats;
      switch (e.t) {
        case 'hit':
          this.emit({ t: 'hit', impact: e.impact, obj: e.obj });
          if (e.impact > 5.5) this.chainLost();
          if (e.obj && e.obj.sign) this.emit({ t: 'signhit' });
          break;
        case 'smash': {
          const obj = e.obj;
          this.broken.push({ obj, t: 0 });
          if (obj.board) { this.collectBoard(obj.board); break; }
          st.smashed++;
          this.addSkill('wreck', 60 * (this.hasPerk('wreck') ? 2 : 1), true);
          this.emit({ t: 'smash', obj, speed: e.speed, x: obj.x, z: obj.z });
          if (obj.src && this.onPropBroken) this.onPropBroken(obj.src);
          break;
        }
        case 'takeoff': this.emit({ t: 'takeoff' }); break;
        case 'land': {
          this.emit({ t: 'land', impact: e.impact });
          if (e.airT > 0.45) {
            const pts = Math.round((200 + e.airT * 320 + e.dist * 6) * (this.hasPerk('air') ? 1.5 : 1));
            this.addSkill('air', pts, true);
            st.air = Math.max(st.air, e.dist);
            if (e.impact < 6 && e.airT > 0.9) this.addSkill('landing', 150, true);
          }
          this.checkJump(e);
          break;
        }
        case 'splash': this.emit({ t: 'splash' }); break;
        case 'brush': this.emit({ t: 'brush', obj: e.obj, speed: e.speed, x: e.x, z: e.z }); break;
        case 'shift': this.emit({ t: 'shift', dir: e.dir }); break;
        case 'dent': {
          const owner = this.playerOwner();
          this.emit({ t: 'dent', rec: e.rec, speed: e.speed, x: e.x, y: e.y, z: e.z, land: !!e.land, scrape: !!e.scrape, owner });
          if (e.rec.d > 0.12 && !e.scrape) this.chainLost();
          const src = e.obj && e.obj.src;
          if (src && src.lot !== undefined && src.id && !e.scrape && e.nx !== undefined) {
            const d = this.otherDamage(src);
            if (d) this.dentOther(src, d, e.x, e.z, -e.nx, -e.nz, e.speed, 0.7);
          }
          break;
        }
        case 'part': case 'flat': case 'fire': case 'misfire':
          this.emit(Object.assign({ owner: this.playerOwner() }, e));
          break;
        case 'boom':
          this.wreckT = 3.2;
          this.chainLost(true);
          this.emit(Object.assign({ owner: this.playerOwner() }, e));
          break;
        default: break;
      }
    }

    hasPerk(id) { return this.profile.perks.includes(id); }

    addSkill(kind, pts, counts) {
      if (this.rewinding) return;
      if (!this.chain) this.chain = { pts: 0, count: 0, t: 0, last: kind, lastPts: 0, list: [] };
      const c = this.chain;
      c.pts += pts;
      if (counts) {
        c.count++;
        c.list.push({ kind, pts });
        if (c.list.length > 5) c.list.shift();
      }
      c.last = kind;
      c.lastPts = pts;
      c.t = 0;
      this.emit({ t: 'skill', kind, pts });
    }

    chainMult() { return this.chain ? Math.min(10, 1 + Math.floor(this.chain.count / 2)) : 1; }

    chainLost(silent) {
      if (!this.chain) return;
      if (!silent) this.emit({ t: 'chainlost', pts: this.chain.pts });
      this.chain = null;
      this.drift = null;
    }

    bankChain() {
      const c = this.chain;
      if (!c) return;
      const total = Math.round(c.pts * this.chainMult());
      this.chain = null;
      if (total < 10) return;
      const p = this.profile;
      p.stats.bestChain = Math.max(p.stats.bestChain, total);
      const xp = Math.round(total / 8 * (this.hasPerk('fans') ? 1.25 : 1));
      const cr = Math.round(total / 30);
      p.spAcc = (p.spAcc || 0) + total;
      let sp = 0;
      while (p.spAcc >= 3500) { p.spAcc -= 3500; sp++; }
      p.sp += sp;
      p.credits += cr;
      this.emit({ t: 'bank', total, xp, cr, sp });
      this.addXp(xp);
    }

    skills(dt, inp) {
      const v = this.veh;
      const chainWindow = 3.2 + (this.hasPerk('chain') ? 1.5 : 0);
      const beta = Math.abs(v.beta);
      if (!v.air && v.speed > 9 && beta > 0.2 && !this.rewinding) {
        if (!this.drift) this.drift = { pts: 0, t: 0, low: 0 };
        const d = this.drift;
        d.t += dt; d.low = 0;
        const add = dt * v.speed * Math.min(beta, 1.1) * 42 * (this.hasPerk('drift') ? 1.5 : 1);
        d.pts += add;
        if (!this.chain) this.chain = { pts: 0, count: 0, t: 0, last: 'drift', lastPts: 0, list: [] };
        this.chain.pts += add;
        this.chain.t = 0;
        this.chain.last = 'drift';
        this.chain.lastPts = Math.round(d.pts);
        this.profile.stats.drift = Math.max(this.profile.stats.drift, d.pts);
        this.stuntDrift(add);
      } else if (this.drift) {
        this.drift.low += dt;
        if (this.drift.low > 0.35) {
          if (this.drift.pts > 120 && this.chain) { this.chain.count++; this.chain.list.push({ kind: 'drift', pts: Math.round(this.drift.pts) }); if (this.chain.list.length > 5) this.chain.list.shift(); }
          this.emit({ t: 'driftEnd', pts: Math.round(this.drift.pts) });
          this.drift = null;
        }
      }
      if (v.speed > 52 && !v.air) {
        this.speedT += dt;
        if (this.speedT > 1) { this.speedT = 0; this.addSkill('speed', Math.round(80 + (v.speed - 52) * 12), this.chain && this.chain.last !== 'speed'); }
      } else this.speedT = 0;
      if (v.speed < 6 && v.spin > 0.5) {
        this.burnT += dt;
        if (this.burnT > 1.2) { this.burnT = -1; this.addSkill('burn', 150, true); }
      } else if (this.burnT > 0) this.burnT = 0;
      if (v.hand && v.speed > 6) {
        if (this.hbT === 0) this.hbYaw = v.yaw;
        this.hbT += dt;
        if (Math.abs(F.wrap(v.yaw - this.hbYaw)) > 1.6 && this.hbT < 3) { this.hbT = -10; this.addSkill('ebrake', 300, true); }
      } else if (!v.hand) this.hbT = 0;
      this.nearMiss(dt);
      this.drafting(dt);
      if (this.chain && !this.drift) {
        this.chain.t += dt;
        if (this.chain.t > chainWindow) this.bankChain();
      }
      void inp;
    }

    nearMiss(dt) {
      const v = this.veh;
      const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw), rx = -fz, rz = fx;
      const list = this.traffic.cars;
      const seen = new Set();
      for (const c of list) {
        const dx = c.x - v.x, dz = c.z - v.z;
        if (Math.abs(dx) > 14 || Math.abs(dz) > 14) continue;
        seen.add(c.uid);
        const f = dx * fx + dz * fz, r = dx * rx + dz * rz;
        const prev = this.near.get(c.uid);
        const relV = Math.hypot(v.vx - (c.tx || 0) * c.v, v.vz - (c.tz || 0) * c.v);
        if (prev && prev.f > 0 && f <= 0 && !c.hitByPlayer && c.state !== 'hit') {
          const clear = Math.abs(r) - (c.hw + v.spec.wid / 2);
          if (clear < 1.3 && clear > -0.2 && relV > 9) {
            this.profile.stats.near++;
            this.addSkill('near', Math.round(250 * (this.hasPerk('miss') ? 1.5 : 1)), true);
          }
        }
        this.near.set(c.uid, { f, t: 0 });
      }
      for (const k of this.near.keys()) if (!seen.has(k)) this.near.delete(k);
      void dt;
    }

    drafting(dt) {
      const v = this.veh;
      if (v.speed < 25) { this.draftT = 0; return; }
      const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw);
      let behind = false;
      const check = (x, z) => {
        const dx = x - v.x, dz = z - v.z;
        const f = dx * fx + dz * fz, r = Math.abs(-dx * fz + dz * fx);
        if (f > 3 && f < 14 && r < 1.6) behind = true;
      };
      for (const c of this.traffic.cars) check(c.x, c.z);
      if (this.race) for (const a of this.race.rivals) check(a.x, a.z);
      if (behind) {
        this.draftT += dt;
        if (this.draftT > 1.6) { this.draftT = -3; this.addSkill('draft', 200, true); }
      } else if (this.draftT > 0) this.draftT = 0;
    }

    trafficHit(c, impact) {
      if (impact > 4) this.chainLost();
    }

    prepareStunts() {
      const w = this.world;
      this.stuntDefs = [];
      for (const st of EV().STUNTS) {
        const d = Object.assign({}, st);
        if (st.kind === 'trap') {
          const nr = w.nearestRoad(st.at[0], st.at[1], 60);
          if (nr) Object.assign(d, { x: nr.x, z: nr.z, tx: nr.tx, tz: nr.tz, hw: nr.e.hw });
        } else if (st.kind === 'zone' || st.kind === 'drift') {
          try {
            const r = F.Route.fromVia(w, [st.a, st.b], false, null);
            d.route = r;
            d.len = r.total;
            const a = r.point(0), b = r.point(r.total);
            Object.assign(d, { ax: a.x, az: a.z, atx: a.tx, atz: a.tz, bx: b.x, bz: b.z, btx: b.tx, btz: b.tz, hw: a.hw });
          } catch (e) { continue; }
        } else if (st.kind === 'jump') {
          const rp = w.ramps.find(r => r.id === st.id);
          if (rp) Object.assign(d, { x: rp.x, z: rp.z, yaw: rp.yaw });
        }
        this.stuntDefs.push(d);
      }
    }

    crossed(prevX, prevZ, x, z, px, pz, tx, tz, hw) {
      const a = (prevX - px) * tx + (prevZ - pz) * tz, b = (x - px) * tx + (z - pz) * tz;
      if (!(a < 0 && b >= 0)) return false;
      const lat = Math.abs(-(x - px) * tz + (z - pz) * tx);
      return lat < hw + 7;
    }

    stunts(dt) {
      const v = this.veh;
      const prev = this.prevPos || { x: v.x, z: v.z };
      this.prevPos = { x: v.x, z: v.z };
      for (const d of this.stuntDefs) {
        if (d.kind === 'trap' && d.x !== undefined) {
          if (this.crossed(prev.x, prev.z, v.x, v.z, d.x, d.z, d.tx, d.tz, d.hw) || this.crossed(prev.x, prev.z, v.x, v.z, d.x, d.z, -d.tx, -d.tz, d.hw)) {
            this.stuntResult(d, Math.round(v.speed * 3.6));
          }
        } else if ((d.kind === 'zone' || d.kind === 'drift') && d.route) {
          const s = this.stuntState[d.id];
          if (!s) {
            if (this.crossed(prev.x, prev.z, v.x, v.z, d.ax, d.az, d.atx, d.atz, d.hw)) {
              this.stuntState[d.id] = { t: 0, pts: 0, idx: 0 };
              this.emit({ t: 'stuntStart', stunt: d });
            }
          } else {
            s.t += dt;
            const pr = d.route.project(v.x, v.z, s.idx, 20);
            s.idx = pr.i;
            if (pr.d > 45 || s.t > 90) { delete this.stuntState[d.id]; this.emit({ t: 'stuntFail', stunt: d }); continue; }
            if (this.crossed(prev.x, prev.z, v.x, v.z, d.bx, d.bz, d.btx, d.btz, d.hw + 4)) {
              delete this.stuntState[d.id];
              if (d.kind === 'zone') this.stuntResult(d, Math.round(d.len / s.t * 3.6));
              else this.stuntResult(d, Math.round(s.pts));
            }
          }
        }
      }
    }

    stuntDrift(add) {
      for (const d of this.stuntDefs) {
        if (d.kind !== 'drift') continue;
        const s = this.stuntState[d.id];
        if (s) s.pts += add;
      }
    }

    activeStunt() {
      for (const d of this.stuntDefs) {
        const s = this.stuntState[d.id];
        if (s) {
          if (d.kind === 'zone') return { d, value: s.t > 0.2 ? Math.round(d.route.project(this.veh.x, this.veh.z, s.idx, 20).s / s.t * 3.6) : 0, t: s.t };
          return { d, value: Math.round(s.pts), t: s.t };
        }
      }
      return null;
    }

    checkJump(e) {
      const v = this.veh;
      for (const d of this.stuntDefs) {
        if (d.kind !== 'jump' || d.x === undefined) continue;
        if (Math.hypot(v.airX - d.x, v.airZ - d.z) < 14) this.stuntResult(d, Math.round(e.dist));
      }
    }

    stuntResult(d, value) {
      const p = this.profile;
      const prevBest = p.stunts[d.id] || 0;
      const stars = d.stars.filter(t => value >= t).length;
      const prevStars = d.stars.filter(t => prevBest >= t).length;
      let xp = 100, cr = 0;
      if (value > prevBest) p.stunts[d.id] = value;
      if (stars > prevStars) {
        xp += (stars - prevStars) * 400;
        if (stars === 3) cr = 2500;
      }
      p.credits += cr;
      this.emit({ t: 'stunt', stunt: d, value, stars, best: Math.max(prevBest, value), improved: value > prevBest, xp, cr });
      this.addXp(xp);
    }

    collectBoard(id) {
      const p = this.profile;
      if (p.boards.includes(id)) return;
      p.boards.push(id);
      const kind = id.startsWith('ft') ? 'ft' : 'xp';
      const xp = kind === 'xp' ? 1000 : 500;
      this.emit({ t: 'board', id, kind, xp, count: p.boards.filter(b => b.startsWith(kind)).length, total: EV().BOARDS.filter(b => b.kind === kind).length });
      this.addXp(xp);
    }

    fastTravelCost(outId) {
      if (outId === 'hub') return 0;
      const ft = this.profile.boards.filter(b => b.startsWith('ft')).length;
      const total = EV().BOARDS.filter(b => b.kind === 'ft').length;
      let c = Math.round(5000 * (1 - ft / total) / 100) * 100;
      if (this.hasPerk('tourist')) c = Math.round(c / 2);
      return c;
    }

    fastTravel(outId) {
      const o = F.MAP.OUTPOSTS.find(q => q.id === outId);
      if (!o || !this.profile.outposts.includes(outId)) return false;
      const cost = this.fastTravelCost(outId);
      if (this.profile.credits < cost) return false;
      this.profile.credits -= cost;
      this.veh.place(o.x, o.z, o.yaw, this.world);
      this.traffic.clear();
      this.snaps.length = 0;
      this.chainLost(true);
      this.emit({ t: 'fasttravel', id: outId, cost });
      return true;
    }

    discover() {
      const v = this.veh;
      const e = this.world.lastEdge;
      if (e && !this.roadsSeen.has(e.id)) {
        this.roadsSeen.add(e.id);
        this.profile.roads.push(e.id);
        const pct = Math.floor(this.roadsSeen.size / this.world.edges.length * 100);
        this.emit({ t: 'road', name: e.name, pct });
        this.addXp(15);
      }
      if (e) this.lastRoadPos = { x: v.x, z: v.z, yaw: v.yaw };
      for (const o of F.MAP.OUTPOSTS) {
        if (this.profile.outposts.includes(o.id)) continue;
        if (Math.hypot(o.x - v.x, o.z - v.z) < 70) {
          this.profile.outposts.push(o.id);
          this.emit({ t: 'outpost', o });
          this.addXp(500);
        }
      }
      for (const b of this.world.barns) {
        if (this.profile.barns.includes(b.id)) continue;
        const def = EV().BARNS.find(q => q.id === b.id);
        if (!def || def.tier > this.profile.band) continue;
        if (Math.hypot(b.door[0] - v.x, b.door[1] - v.z) < 9 && v.speed < 4) {
          this.profile.barns.push(b.id);
          this.giveCar(b.car, true);
          this.emit({ t: 'barn', barn: b, car: b.car });
          this.addXp(3000);
        }
      }
    }

    rumors() {
      return EV().BARNS.filter(b => b.tier <= this.profile.band && !this.profile.barns.includes(b.id));
    }

    advanceClock(dt) {
      this.clock = (this.clock + dt / 100) % 24;
      this.profile.clock = this.clock;
      this.weatherT -= dt;
      if (this.weatherT <= 0) {
        const w = WEATHER[this.weather], bias = FOG_HOURS(this.clock);
        const odds = w.next.map(([id, p]) => [id, id === 'fog' ? p * bias : p]), sum = odds.reduce((a, o) => a + o[1], 0);
        let r = this.rng() * sum, next = odds[odds.length - 1][0];
        for (const [id, p] of odds) { if (r < p) { next = id; break; } r -= p; }
        this.setWeather(next, false);
      }
    }

    setWeather(id, instant) {
      const w = WEATHER[weatherId(id)];
      const changed = this.weather !== weatherId(id);
      this.weather = weatherId(id);
      this.profile.weather = this.weather;
      this.weatherT = w.dur[0] + this.rng() * (w.dur[1] - w.dur[0]);
      if (this.weather === 'clear') this.clearCover = 0.06 + this.rng() * 0.34;
      if (instant) {
        const p = weatherParams(this.weather, this.clearCover);
        for (const k of WX_KEYS) this.wx[k] = p[k];
        this.wetK = p.wet;
        this.world.wet = this.wetK;
        this.boltT = 1.5;
      }
      if (changed) this.emit({ t: 'weather', w: this.weather, instant: !!instant });
    }

    updateWeather(dt) {
      const target = weatherParams(this.weather, this.clearCover), wx = this.wx;
      wx.id = this.weather;
      for (const k of WX_KEYS) wx[k] = F.approach(wx[k], target[k], WX_RATE[k] * dt);
      const damp = wx.mist * WEATHER.fog.damp;
      if (wx.rain > 0.05) this.wetK = Math.min(1, this.wetK + wx.rain * dt / 25);
      else if (this.wetK < damp) this.wetK = Math.min(damp, this.wetK + dt / 90);
      else this.wetK = Math.max(damp, this.wetK - dt / 150);
      this.world.wet = this.wetK;
      wx.flash = Math.max(0, wx.flash - dt * 3.2);
      if (wx.storm < 0.4) return;
      this.boltT -= dt * wx.storm;
      if (this.boltT > 0) return;
      this.boltT = 5 + this.rng() * 12;
      this.strike();
    }

    strike(near) {
      const v = this.veh, a = this.rng() * Math.PI * 2, d = near ? 180 + this.rng() * 160 : 350 + this.rng() * 1900;
      const x = v.x + Math.cos(a) * d, z = v.z + Math.sin(a) * d;
      const l = Math.hypot(x - v.x, 600, z - v.z);
      this.wx.flash = Math.min(1, this.wx.flash + 0.4 + 330 / d);
      this.wx.flashDir = [(x - v.x) / l, 600 / l, (z - v.z) / l];
      this.emit({ t: 'lightning', x, z, d, seed: Math.floor(this.rng() * 1e6) });
    }

    skipTime(to) {
      if (this.race) return 0;
      const target = ((to % 24) + 24) % 24;
      const skipped = (target - this.clock + 24) % 24;
      this.clock = target;
      this.profile.clock = target;
      this.save();
      return skipped;
    }

    checkWater(dt) {
      if (this.veh.waterT > 1.1) {
        this.emit({ t: 'water' });
        this.resetCar();
      }
      void dt;
    }

    resetCar() {
      const v = this.veh;
      if (this.race) {
        const p = this.race.route.point(this.race.pProg);
        v.place(p.x, p.z, Math.atan2(p.tx, -p.tz), this.world);
        this.race.lastIdx = p.i;
      } else {
        const nr = this.world.nearestRoad(v.x, v.z, 400, e => !e.bridge || true);
        if (nr) {
          const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw);
          const sgn = nr.tx * fx + nr.tz * fz >= 0 ? 1 : -1;
          v.place(nr.x, nr.z, Math.atan2(nr.tx * sgn, -nr.tz * sgn), this.world);
        } else this.toHub();
      }
      if (v.dmg) {
        const was = v.dmg.burning || v.dmg.burnt;
        v.dmg.patch(0.3);
        if (was) this.emit({ t: 'extinguished' });
      }
      this.wreckT = 0;
      this.chainLost(true);
      this.snaps.length = 0;
      this.emit({ t: 'reset' });
    }

    respawnProps(dt) {
      const v = this.veh;
      for (let i = this.broken.length - 1; i >= 0; i--) {
        const b = this.broken[i];
        b.t += dt;
        if (b.obj.board) { this.broken.splice(i, 1); continue; }
        if (b.t > 60 && Math.hypot(b.obj.x - v.x, b.obj.z - v.z) > 180) {
          b.obj.broken = false;
          this.broken.splice(i, 1);
          if (b.obj.src && this.onPropBroken) this.onPropBroken(b.obj.src);
        }
      }
    }

    addXp(n) {
      const p = this.profile;
      p.xp += Math.round(n);
      let need = EV().xpForLevel(p.level);
      while (p.xp >= need && p.level < 60) {
        p.xp -= need;
        p.level++;
        const r = EV().levelReward(p.level);
        p.credits += r.cr;
        let car = null;
        if (r.car && !p.cars.some(c => c.id === r.car)) { this.giveCar(r.car, false); car = r.car; }
        this.emit({ t: 'levelup', level: p.level, cr: r.cr, car });
        need = EV().xpForLevel(p.level);
      }
    }

    giveCar(id, silent) {
      const p = this.profile;
      const c = F.Cars.get(id);
      const uid = p.nextUid++;
      p.cars.push({ uid, id, up: {}, c1: c.col, c2: c.col2 || c.col, livery: c.livery || 'none', metal: c.year >= 1992, dirt: 0, odo: 0 });
      if (!silent) this.emit({ t: 'gift', id });
      return uid;
    }

    buyCar(id) {
      const c = F.Cars.get(id);
      if (!c || c.barn) return false;
      if (this.profile.credits < c.price) return false;
      this.profile.credits -= c.price;
      const uid = this.giveCar(id, true);
      this.save();
      return uid;
    }

    carValue(entry) {
      const c = F.Cars.get(entry.id);
      let v = c.price;
      for (const u of F.Cars.UPGRADES) {
        const lv = entry.up[u.id] | 0;
        for (let i = 1; i <= lv; i++) v += this.partPrice(entry, u.id, i) * 0.5;
      }
      return Math.round(v);
    }

    sellCar(uid) {
      const p = this.profile;
      if (p.cars.length < 2 || uid === p.current) return false;
      const entry = p.cars.find(c => c.uid === uid);
      if (!entry) return false;
      const val = Math.round(this.carValue(entry) * 0.6);
      p.credits += val;
      p.cars = p.cars.filter(c => c.uid !== uid);
      this.save();
      return val;
    }

    partPrice(entry, cat, level) {
      const u = F.Cars.UPGRADES.find(x => x.id === cat);
      const stock = F.perfOf(entry.id, {}).pi;
      return Math.round(u.levels[level].price * F.Cars.priceFactor(stock) / 50) * 50;
    }

    buyPart(uid, cat, level) {
      const entry = this.profile.cars.find(c => c.uid === uid);
      if (!entry) return false;
      const cur = entry.up[cat] | 0;
      if (cur === level) return true;
      const price = level === 0 ? 0 : this.partPrice(entry, cat, level);
      if (this.profile.credits < price) return false;
      this.profile.credits -= price;
      entry.up[cat] = level;
      if (uid === this.profile.current) this.refreshSpec();
      this.save();
      return true;
    }

    paintCar(uid, c1, c2, livery, metal) {
      const entry = this.profile.cars.find(c => c.uid === uid);
      if (!entry) return;
      entry.c1 = c1; entry.c2 = c2 || c1; entry.livery = livery || 'none'; entry.metal = !!metal; entry.dirt = 0;
      if (uid === this.profile.current) { this.paint1 = F.hexRgb(entry.c1); this.paint2 = F.hexRgb(entry.c2); }
      this.save();
    }

    buyPerk(id) {
      const pk = EV().PERKS.find(q => q.id === id);
      const p = this.profile;
      if (!pk || p.perks.includes(id) || p.sp < pk.cost) return false;
      p.sp -= pk.cost;
      p.perks.push(id);
      this.save();
      return true;
    }

    carPI(entry = this.entry) { return F.perfOf(entry.id, entry.up).pi; }

    eventLocked(ev) {
      if (ev.id === 'prologue') return false;
      if (ev.id === 'finale') return this.profile.band < 5;
      return ev.tier > this.profile.band;
    }

    eventAllowed(ev, entry = this.entry) {
      const ci = F.classOf(this.carPI(entry)).c;
      return F.classIndex(ci) <= F.classIndex(ev.cls);
    }

    startEvent(id, o = {}) {
      const ev = EV().get(id);
      if (!ev) return null;
      this.chainLost(true);
      this.bankChain();
      this.saveFree = { x: this.veh.x, z: this.veh.z, yaw: this.veh.yaw, clock: this.clock, weather: this.weather, wx: Object.assign({}, this.wx), wetK: this.wetK, weatherT: this.weatherT, car: this.profile.current };
      if (ev.id === 'prologue') {
        this.tempCar = true;
        this.veh = new F.Vehicle(F.Cars.spec('mclarenf1', { tires: 1 }), { assist: this.assist() });
        this.paint1 = F.hexRgb('#e24a22'); this.paint2 = this.paint1;
        this.entry = { uid: 0, id: 'mclarenf1', up: { tires: 1 }, c1: '#e24a22', c2: '#e24a22', livery: 'none' };
      }
      this.veh.dmg = this.damageFor(this.entry, this.veh.spec, true);
      this.wreckT = 0; this.fixT = 0;
      const rng = F.rng((o.seed || 1) * 31 + ev.id.length * 7 + Math.floor(this.time));
      const pi = this.carPI();
      const diff = o.difficulty !== undefined ? o.difficulty : this.settings.diff;
      let rivalSpecs = [];
      if (ev.rivals && !ev.rivalCar) {
        const n = ev.vilks ? ev.rivals - 1 : ev.rivals;
        const pick = pickRivals(ev, pi, n, rng, null);
        const names = F.RIVAL_NAMES.slice();
        rivalSpecs = pick.rivals.map((r, k) => {
          const car = F.Cars.get(r.id);
          const nm = names.splice(Math.floor(rng() * names.length), 1)[0];
          const skillBoost = F.clamp((pick.target - r.pi) / 400, -0.04, 0.06);
          const base = F.DIFF[diff];
          return { name: nm, spec: F.Cars.spec(r.id, r.up), paint1: F.hexRgb(rng() < 0.5 ? car.col : rng.pick(F.PAINTS)), livery: k % 3 === 2 ? 'none' : RIVAL_LIVERIES[(k + ev.id.length) % RIVAL_LIVERIES.length], metal: k % 2 === 0, dirt: ev.type === 'dirt' || ev.type === 'cc' ? 0.35 + (k % 3) * 0.12 : 0, skill: { grip: base.grip + skillBoost, acc: base.acc + skillBoost * 0.5, rb: base.rb, pay: base.pay }, k };
        });
        if (ev.vilks) {
          const base = F.DIFF[Math.min(4, diff + 1)];
          rivalSpecs.push({ name: 'Вилкс', spec: F.Cars.spec('diablo', { engine: 1, tires: 1, susp: 1 }), paint1: F.hexRgb('#141416'), skill: { grip: base.grip + 0.02, acc: base.acc + 0.02, rb: base.rb * 0.5, pay: base.pay } });
        }
      }
      if (ev.rivalCar === 'train') {
        const tr = ev.train;
        const s0 = this.railS(tr.from), s1 = this.railS(tr.to);
        ev.train.s0 = s0; ev.train.s1 = s1;
      }
      this.race = new F.Race(this, ev, { difficulty: diff, rivalSpecs, seed: o.seed || 1, wet: WEATHER[weatherId(ev.weather)].rain > 0 });
      this.race.placePlayer(this.veh);
      this.mode = 'race';
      this.traffic.clear();
      this.clock = ev.time;
      this.weather = weatherId(ev.weather);
      Object.assign(this.wx, weatherParams(this.weather));
      this.wetK = this.wx.wet;
      this.world.wet = this.wetK;
      this.snaps.length = 0;
      this.emit({ t: 'eventStart', ev });
      return this.race;
    }

    railS(pt) {
      const r = this.world.rail;
      let best = 0, bd = Infinity;
      for (let i = 0; i < r.pts.length; i++) {
        const d = Math.hypot(r.pts[i][0] - pt[0], r.pts[i][1] - pt[1]);
        if (d < bd) { bd = d; best = r.s[i]; }
      }
      return best;
    }

    raceRewards() {
      const race = this.race, ev = race.ev;
      const p = this.profile;
      const st = race.standings();
      const pos = st.findIndex(r => r.player) + 1;
      const s = this.settings;
      let bonus = F.DIFF[s.diff].pay;
      if (!s.abs) bonus += 0.05;
      if (!s.tcs) bonus += 0.05;
      if (!s.stm) bonus += 0.05;
      if (!s.auto) bonus += 0.1;
      if (s.steer === 'sim') bonus += 0.05;
      if (this.hasPerk('sponsor')) bonus += 0.1;
      const base = ev.id === 'finale' ? 100000 : ev.id === 'prologue' ? 0 : EV().CLASS_PAY[ev.cls] * (ev.type === 'showcase' ? 1.5 : 1);
      const posMult = [1, 0.7, 0.55, 0.42, 0.36, 0.3, 0.26, 0.22, 0.2, 0.18, 0.16, 0.15][pos - 1] || 0.15;
      const special = !!race.special;
      const won = pos === 1;
      const cr = Math.round(base * (special && !won ? 0.25 : posMult) * (1 + bonus) / 10) * 10;
      const xp = ev.id === 'prologue' ? 1500 : Math.round(700 + 180 * Math.max(0, ev.tier) + (pos === 1 ? 700 : pos === 2 ? 400 : pos === 3 ? 220 : 0));
      const ptsNew = ev.id === 'prologue' ? 0 : special ? (won ? 5 : 0) : pos === 1 ? 3 : pos === 2 ? 2 : pos === 3 ? 1 : 0;
      const prev = p.results[ev.id];
      const prevPts = prev ? prev.pts || 0 : 0;
      const gained = Math.max(0, ptsNew - prevPts);
      return { pos, cr, xp, pts: ptsNew, gained, bonus, standings: st, time: race.finishTime || race.time, prev, total: st.length };
    }

    finishEvent() {
      const race = this.race;
      if (!race) return null;
      const ev = race.ev;
      const p = this.profile;
      const r = this.raceRewards();
      p.credits += r.cr;
      const prev = p.results[ev.id] || {};
      p.results[ev.id] = { pos: Math.min(prev.pos || 99, r.pos), time: prev.time ? Math.min(prev.time, r.time) : r.time, pts: Math.max(prev.pts || 0, r.pts) };
      p.pts += r.gained;
      p.stats.races++;
      if (r.pos === 1) p.stats.wins++;
      this.addXp(r.xp);
      r.bandUp = null;
      const bands = EV().BANDS;
      while (p.band < bands.length - 1 && p.pts >= bands[p.band + 1].need) {
        p.band++;
        r.bandUp = bands[p.band];
        this.emit({ t: 'band', band: bands[p.band] });
      }
      if (ev.id === 'prologue') p.prologue = true;
      if (ev.id === 'finale' && r.pos === 1) {
        r.finaleWon = !p.finale;
        if (!p.finale) {
          p.finale = true;
          if (!p.cars.some(c => c.id === 'mclarenf1')) this.giveCar('mclarenf1', true); else p.credits += 500000;
        }
      }
      return r;
    }

    endEvent(r) {
      const race = this.race;
      if (!race) return;
      const ev = race.ev;
      this.race = null;
      this.mode = 'free';
      this.veh.frozen = false;
      if (this.tempCar) {
        this.tempCar = false;
        this.setCar(this.profile.current, false);
      }
      const end = race.route.point(race.route.closed ? 0 : race.route.total - 5);
      if (ev.id === 'prologue') {
        const h = F.MAP.HUB;
        this.veh.place(h.x, h.z, h.yaw, this.world);
      } else if (r && r.retry === false) {
        this.veh.place(end.x, end.z, Math.atan2(end.tx, -end.tz), this.world);
      } else if (this.saveFree) {
        this.veh.place(this.saveFree.x, this.saveFree.z, this.saveFree.yaw, this.world);
      }
      this.restoreFree();
      this.veh.dmg = this.damageFor(this.entry, this.veh.spec);
      this.wreckT = 0; this.fixT = 0;
      this.snaps.length = 0;
      this.traffic.clear();
      this.save();
    }

    restoreFree() {
      const s = this.saveFree;
      if (!s) return;
      this.clock = s.clock;
      this.weather = weatherId(s.weather);
      if (s.wx) Object.assign(this.wx, s.wx, { flash: 0 }); else Object.assign(this.wx, weatherParams(this.weather));
      this.wetK = s.wetK !== undefined ? s.wetK : this.wx.wet;
      if (s.weatherT) this.weatherT = s.weatherT;
      this.world.wet = this.wetK;
    }

    abandonEvent() {
      this.race = null;
      this.mode = 'free';
      this.veh.frozen = false;
      if (this.tempCar) { this.tempCar = false; this.setCar(this.profile.current, false); }
      if (this.saveFree) this.veh.place(this.saveFree.x, this.saveFree.z, this.saveFree.yaw, this.world);
      this.restoreFree();
      this.veh.dmg = this.damageFor(this.entry, this.veh.spec);
      this.wreckT = 0; this.fixT = 0;
      this.snaps.length = 0;
    }

    grantCredits(n) {
      this.profile.credits = Math.max(0, this.profile.credits + Math.round(n));
      this.save();
    }

    debugDamage(kind) {
      const v = this.veh;
      if (!v.dmg) return false;
      const d = v.dmg, fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw), rx = -fz, rz = fx, hl = v.spec.len / 2, hw = v.spec.wid / 2;
      const at = (u, w, nx, nz, speed) => v.crash(v.x + fx * u + rx * w, v.z + fz * u + rz * w, nx, nz, speed, null, 1, 1);
      if (kind === 'front') at(hl, -hw * 0.3, -fx, -fz, 17);
      else if (kind === 'rear') at(-hl, hw * 0.4, fx, fz, 15);
      else if (kind === 'left') at(hl * 0.35, -hw, rx, rz, 14);
      else if (kind === 'right') at(-hl * 0.2, hw, -rx, -rz, 14);
      else if (kind === 'engine') { d.hp = Math.min(d.hp, 0.25); d.refreshMech(); }
      else if (kind === 'fire') { d.hp = Math.min(d.hp, F.DMG.TUNE.fireHp * 0.5); d.refreshMech(); }
      else if (kind === 'flat') { d.flat[0] = 1; d.bend[0] = Math.max(d.bend[0], 0.18); d.toeRaw[0] += 0.12; d.refreshMech(); d.ver++; v.events.push({ t: 'flat', wheel: 0 }); }
      else if (kind === 'repair') { d.repair(); this.wreckT = 0; }
      for (const e of v.events) this.handleVehEvent(e);
      v.events.length = 0;
      for (const e of d.drain()) this.handleVehEvent(e);
      return true;
    }

    grantXp(n) {
      this.addXp(n);
      this.save();
    }

    grantLevel() {
      const p = this.profile;
      if (p.level >= 60) return;
      this.grantXp(EV().xpForLevel(p.level) - p.xp);
    }

    teleportSpots() {
      const w = this.world, out = [];
      for (const o of F.MAP.OUTPOSTS) out.push({ group: 'Аванпосты', name: o.name, x: o.x, z: o.z, yaw: o.yaw, exact: true });
      for (const lm of w.landmarks) if (lm.name) out.push({ group: 'Достопримечательности', name: lm.name, x: lm.x, z: lm.z });
      for (const ev of EV().EVENTS) if (ev.id !== 'prologue') out.push({ group: 'События', name: ev.name, x: ev.via[0][0], z: ev.via[0][1], toward: ev.via[1] });
      for (const b of w.barns) out.push({ group: 'Сараи', name: 'Сарай: ' + F.Cars.get(b.car).make + ' ' + F.Cars.get(b.car).model, x: b.door[0], z: b.door[1] });
      return out;
    }

    teleport(spot) {
      if (this.race || !spot) return false;
      const w = this.world, v = this.veh;
      let x = spot.x, z = spot.z, yaw = spot.yaw || 0;
      if (!spot.exact) {
        const nr = w.nearestRoad(spot.x, spot.z, 400, e => !e.bridge);
        if (!nr) return false;
        const aim = spot.toward || [spot.x, spot.z];
        let sgn = nr.tx * (aim[0] - nr.x) + nr.tz * (aim[1] - nr.z) >= 0 ? 1 : -1;
        if (!spot.toward && Math.hypot(aim[0] - nr.x, aim[1] - nr.z) < 1) sgn = 1;
        x = nr.x; z = nr.z; yaw = Math.atan2(nr.tx * sgn, -nr.tz * sgn);
      }
      v.place(x, z, yaw, w);
      this.traffic.clear();
      this.snaps.length = 0;
      this.chainLost(true);
      this.emit({ t: 'teleport', name: spot.name });
      return true;
    }

    setWaypoint(x, z) {
      if (x === null) { this.waypoint = null; this.gps = null; return; }
      this.waypoint = { x, z };
      this.gpsT = 99;
    }

    updateGps() {
      if (!this.waypoint || this.mode !== 'free') { this.gps = null; return; }
      const v = this.veh;
      if (Math.hypot(this.waypoint.x - v.x, this.waypoint.z - v.z) < 30) { this.waypoint = null; this.gps = null; this.emit({ t: 'arrived' }); return; }
      this.gpsT = (this.gpsT || 0) + 1 / 60;
      if (this.gps && this.gpsT < 3) return;
      this.gpsT = 0;
      try {
        const fx = Math.sin(v.yaw) * 8, fz = -Math.cos(v.yaw) * 8;
        this.gps = F.Route.fromVia(this.world, [[v.x + fx, v.z + fz], [this.waypoint.x, this.waypoint.z]], false, null);
      } catch (e) { this.gps = null; }
    }

    nearestEvent(maxD = 26) {
      const v = this.veh;
      let best = null, bd = maxD;
      for (const ev of EV().EVENTS) {
        if (ev.id === 'prologue') continue;
        const d = Math.hypot(ev.via[0][0] - v.x, ev.via[0][1] - v.z);
        if (d < bd) { bd = d; best = ev; }
      }
      return best;
    }

    completion() {
      const p = this.profile, E = EV();
      const events = E.EVENTS.filter(e => e.id !== 'prologue');
      return {
        events: events.filter(e => p.results[e.id]).length, eventsTotal: events.length,
        wins: events.filter(e => p.results[e.id] && p.results[e.id].pos === 1).length,
        stunts: E.STUNTS.filter(s => (p.stunts[s.id] || 0) >= s.stars[0]).length, stuntsTotal: E.STUNTS.length,
        stars: E.STUNTS.reduce((a, s) => a + s.stars.filter(t => (p.stunts[s.id] || 0) >= t).length, 0), starsTotal: E.STUNTS.length * 3,
        xpBoards: p.boards.filter(b => b.startsWith('xp')).length, xpTotal: E.BOARDS.filter(b => b.kind === 'xp').length,
        ftBoards: p.boards.filter(b => b.startsWith('ft')).length, ftTotal: E.BOARDS.filter(b => b.kind === 'ft').length,
        barns: p.barns.length, barnsTotal: E.BARNS.length,
        roads: this.roadsSeen.size, roadsTotal: this.world.edges.length,
        cars: new Set(p.cars.map(c => c.id)).size, carsTotal: F.Cars.CARS.length
      };
    }

    save() {
      const p = this.profile;
      if (this.mode === 'free' && this.veh) p.pos = { x: +this.veh.x.toFixed(1), z: +this.veh.z.toFixed(1), yaw: +this.veh.yaw.toFixed(3) };
      p.clock = this.clock;
      p.weather = this.weather;
      p.stats.time = (p.stats.time || 0);
      return saveProfile(p);
    }
  }

  F.Game = Game;
  F.Profile = { newProfile, loadProfile, saveProfile, wipeProfile, defaultSettings, SAVE_KEY };
  F.pickRivals = pickRivals;
})(globalThis.Forza = globalThis.Forza || {});
