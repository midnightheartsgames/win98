(function (N) {
  'use strict';

  const SAVE_PREFIX = 'gtann_save_';
  const SET_KEY = 'gtann_settings';
  N.SAVE_PREFIX = SAVE_PREFIX;

  const store = () => (typeof localStorage !== 'undefined' ? localStorage : null);

  N.defaultSettings = () => ({ sfx: 0.8, radio: 0.6, voice: 0.9, tts: true, sens: 1, invert: false, draw: 1, traffic: 1, peds: 1, scale: 1, trails: false, subtitles: true, throwAid: true, camDist: 1, gfx: 'high', cars: 'high', city: 'high' });
  N.loadSettings = () => {
    const s = N.defaultSettings();
    try { const raw = store() && store().getItem(SET_KEY); if (raw) Object.assign(s, JSON.parse(raw)); } catch (e) { }
    return s;
  };
  N.saveSettings = s => { try { if (store()) store().setItem(SET_KEY, JSON.stringify(s)); } catch (e) { } };

  const GIVER = { kesha: 'К', colonel: 'П', lyova: 'Л' };
  N.GIVER = GIVER;

  class Game {
    static newState() {
      return {
        v: 1, money: 0, done: {}, flags: {}, outfit: 'zek', clock: 23 * 60, weapons: { fists: { ammo: 1, clip: 0 } }, hp: 100, armor: 0, maxArmor: 100,
        stashes: [], jumps: [], props: {}, unlocked: N.START_WEAPONS.slice(), taxi: { fares: 0 }, police: { level: 0 }, spawnAt: 'hotel_spawn', played: 0, day: 0, views: [],
        stats: { kills: 0, copsKilled: 0, carsStolen: 0, carsDestroyed: 0, shots: 0, hits: 0, driven: 0, walked: 0, headshots: 0, busted: 0, wasted: 0, earned: 0, photos: 0 },
        park: { tirBest: 0, tirRounds: 0, tirPerfect: 0, rides: 0, eaten: 0 }
      };
    }

    constructor(city, o = {}) {
      this.city = city;
      this.state = o.state ? Object.assign(Game.newState(), JSON.parse(JSON.stringify(o.state))) : Game.newState();
      this.state.park = Object.assign(Game.newState().park, this.state.park || {});
      for (const id of N.START_WEAPONS.concat(this.state.unlocked)) this.unlock(id);
      this.settings = o.settings || N.defaultSettings();
      const spawn = city.places[this.state.spawnAt] || city.places.hotel_spawn;
      this.world = new N.World(city, { seed: o.seed || (Date.now() & 0xffff), clock: this.state.clock, outfit: this.state.outfit, spawn, god: o.god, settings: { traffic: this.settings.traffic, peds: this.settings.peds } });
      const pl = this.world.player;
      if (this.world.metro) this.world.metro.wallet = { get: () => this.state.money, pay: v => this.addMoney(-v) };
      pl.weapons = JSON.parse(JSON.stringify(this.state.weapons));
      pl.weapon = 'fists';
      pl.hp = this.state.hp || 100;
      pl.armor = this.state.armor || 0;
      pl.maxArmor = this.state.maxArmor || 100;
      Object.assign(this.world.stats, this.state.stats);
      this.flags = this.state.flags;
      this.mission = null;
      this.side = null;
      this.cut = null;
      this.cutLights = null;
      this.fade = null;
      this.subs = [];
      this.voice = o.voice || null;
      this.speaker = null;
      this.failInfo = null;
      this.failReq = false;
      this.msg = { obj: null, help: null, big: null, zone: null, veh: null, pager: [], title: null, radio: null, view: null };
      this.timers = [];
      this.shop = null;
      this.death = null;
      this.cool = new Set();
      this.cheatBuf = '';
      this.saveReq = null;
      this.headless = !!o.headless;
      this.lastZone = '';
      this.stashPickups();
      this.rewardPickups();
      if (!this.state.done.m1 && o.newGame !== false && !o.state) this.later(0.1, () => this.startMission('m1'));
    }

    stashPickups() {
      const got = new Set(this.state.stashes);
      for (const s of this.city.stashes) if (!got.has(s.id)) this.world.addPickup('stash', s.x, s.z, { stash: s.id });
    }

    rewardPickups() {
      const w = this.world;
      w.pickups = w.pickups.filter(k => !k.reward);
      const n = this.state.stashes.length;
      const h = this.city.places.hotel_door;
      const list = [[5, 'pm', 48], [10, 'shotgun', 24], [15, 'ak', 120], [20, 'svd', 20]];
      let i = 0;
      for (const [need, wid, ammo] of list) {
        const q = N.placeAt(h, -1 - i * 1.4, -6);
        if (n >= need) w.addPickup('weapon', q[0], q[1], { weapon: wid, ammo, respawn: 60, reward: true });
        i++;
      }
      const a = N.placeAt(h, -1, 6);
      if (this.state.maxArmor > 100 || this.flags.policeDone) w.addPickup('armor', a[0], a[1], { respawn: 60, reward: true });
    }

    later(t, fn) { this.timers.push({ t, fn }); }

    objective(text) { this.msg.obj = { text, t: 7 }; }
    help(text, t) { this.msg.help = { text, t: t || 8 }; }
    big(title, sub, t, style) { this.msg.big = { title, sub: sub || '', t: t || 3, style: style || 'mission', t0: t || 3 }; }
    pager(text) { this.msg.pager.push({ text, t: 0 }); this.world.emit({ t: 'pager' }); }
    say(who, text, o = {}) {
      const prio = o.prio === undefined ? 1 : o.prio;
      if (prio === 0 && this.subs.length) return null;
      if (prio > 0) {
        const s0 = this.subs[0];
        if (s0 && s0.prio === 0) { if (s0.h && this.voice) this.voice.stop(); this.subs.shift(); }
        this.subs = this.subs.filter(q => q.prio !== 0);
      }
      const sub = { who, text, t: N.lineDur(text), el: 0, prio, via: o.via || null, cut: !!o.cut, look: o.look || null, h: null, started: false, done: false };
      this.subs.push(sub);
      return sub;
    }
    bark(p, text) { if (!this.subs.length && !this.cut) this.say(p.who || '', text, { prio: 0, look: p.look }); }
    cutLine(sub) {
      if (!sub || sub.done) return;
      if (sub.h && this.voice) this.voice.stop();
      sub.done = true;
      const i = this.subs.indexOf(sub);
      if (i >= 0) this.subs.splice(i, 1);
    }
    hushVoice() {
      const s = this.subs[0];
      if (s && s.h && this.voice) { this.voice.stop(); s.h = null; s.started = false; s.el = 0; }
    }
    speaking() { return this.subs.length > 0; }
    stepSubs(dt) {
      const s = this.subs[0];
      if (s) {
        if (!s.started) { s.started = true; s.el = 0; s.h = this.voice ? this.voice.speak(s) : null; }
        if (s.h && this.voice && !this.voice.alive(s.h)) s.h = null;
        s.el += dt;
        const over = s.h ? (s.h.done && s.el > 0.3) || s.el > s.t * 2.2 + 2 : s.el >= s.t;
        if (over) { s.done = true; this.subs.shift(); }
      }
      const cur = this.subs[0];
      const who = cur && cur.started && !cur.via ? cur.who : null;
      const sp = who ? this.speakerOf(who) : null;
      if (this.speaker && this.speaker !== sp) this.speaker.anim.speak = 0;
      this.speaker = sp;
      if (sp) sp.anim.speak = cur.h && cur.h.done ? 0 : 1;
    }
    speakerOf(who) {
      const w = this.world;
      if (who === 'tyoma') return w.player.dead ? null : w.player;
      const m = this.mission || (this.cut && this.cut.run);
      if (m) for (const e of Object.values(m.ents)) if (e && e.kind === 'ped' && e.who === who && !e.dead && !e.removed && !e.veh) return e;
      return null;
    }
    flag(k, v) { this.flags[k] = v; }
    done(id) { return !!this.state.done[id]; }
    unlock(id) {
      if (!this.state.unlocked.includes(id)) this.state.unlocked.push(id);
      for (const w of N.WEAPON_IDS) if (N.WEAPONS[w].unlockWith === id && !this.state.unlocked.includes(w)) this.state.unlocked.push(w);
    }

    addMoney(v) {
      this.state.money = Math.max(0, this.state.money + v);
      if (v > 0) this.state.stats.earned += v;
      this.world.emit({ t: 'money', v });
    }

    giveWeapon(id, ammo) { this.world.giveWeapon(this.world.player, id, ammo); this.world.emit({ t: 'weapon', id }); }

    setOutfit(id) {
      this.state.outfit = id;
      this.world.player.look = N.playerLook(id);
      this.world.setWanted(0);
      this.world.emit({ t: 'outfit', id });
    }

    ownProperty(id) {
      this.state.props[id] = true;
      this.world.emit({ t: 'property', id });
    }

    teleport(placeId, dx, dz, keepVeh) {
      const w = this.world, pl = w.player;
      const p = this.city.places[placeId];
      if (pl.veh) w.exitVehicle(pl);
      w.resetPed(pl);
      const q = N.placeAt(p, dx || 0, dz || 0);
      pl.x = q[0];
      pl.z = q[1];
      pl.y = p.y !== undefined ? p.y : this.city.groundY(pl.x, pl.z);
      if (p.y !== undefined) pl.deck = null;
      pl.vx = pl.vz = pl.vy = 0;
      pl.yaw = p.yaw || 0;
      this.cool.add(placeId);
      w.emit({ t: 'teleport' });
    }

    teleportTo(x, z) {
      const w = this.world, pl = w.player, city = this.city;
      const v = pl.veh && pl.veh.driver === pl ? pl.veh : null;
      if (v) {
        const nl = city.nearestLane(x, z, 80, l => l.ambient) || city.nearestLane(x, z, 600, () => true);
        if (nl) { x = nl.x; z = nl.z; v.yaw = N.yawOf(nl.dx, nl.dz); }
        Object.assign(v, { x, z, y: city.groundY(x, z), vx: 0, vz: 0, vy: 0, wz: 0, wp: 0, wr: 0, pitch: 0, roll: 0, spd: 0, air: false, sink: 0 });
        pl.x = x; pl.z = z; pl.y = v.y; pl.yaw = v.yaw;
      } else {
        if (pl.veh) w.exitVehicle(pl);
        let sp = city.freeSpot(x, z, 6);
        if (city.ground(sp[0], sp[1]) === N.GT.WATER || !city.inPlay(sp[0], sp[1])) {
          const nl = city.nearestLane(x, z, 3000, l => l.ambient);
          if (nl) sp = city.freeSpot(nl.x, nl.z, 8);
        }
        w.resetPed(pl);
        Object.assign(pl, { x: sp[0], z: sp[1], y: city.groundY(sp[0], sp[1]), vx: 0, vz: 0, vy: 0, deck: null });
      }
      for (const m of this.markers()) if (Math.hypot(m.x - pl.x, m.z - pl.z) < 5) this.cool.add(m.id);
      w.emit({ t: 'teleport' });
    }

    teleportNear(x, z, r) {
      const pl = this.world.player;
      if (pl.veh) this.world.exitVehicle(pl);
      this.world.resetPed(pl);
      const sp = this.city.freeSpot(x + r, z, 3);
      pl.x = sp[0]; pl.z = sp[1];
      pl.y = this.city.groundY(pl.x, pl.z);
      pl.yaw = N.yawOf(x - pl.x, z - pl.z);
    }

    available() {
      if (this.mission || this.failInfo) return [];
      return N.MISSIONS.filter(m => !this.state.done[m.id] && m.marker && m.requires.every(r => this.state.done[r]));
    }

    markers() {
      const out = [];
      const P = this.city.places;
      if (!this.mission) {
        for (const m of this.available()) { const p = P[m.marker]; out.push({ id: 'mission_' + m.id, x: p.x, z: p.z, type: 'mission', letter: GIVER[m.giver], mission: m.id }); }
      }
      out.push({ id: 'save_hotel', x: P.hotel_save.x, z: P.hotel_save.z, type: 'save' });
      if (this.state.props.flat) out.push({ id: 'save_flat', x: P.flat.x, z: P.flat.z, type: 'save' });
      else out.push({ id: 'buy_flat', x: P.flat.x, z: P.flat.z, type: 'buy', price: 20000, label: 'Квартира на Мончегорской' });
      if (this.state.props.club) out.push({ id: 'save_club', x: P.club_in.x, z: P.club_in.z - 3, type: 'save' });
      out.push({ id: 'gunshop', x: P.gunshop.x, z: P.gunshop.z, type: 'shop' });
      if (this.state.done.m2) out.push({ id: 'clothes', x: P.market_clothes.x, z: P.market_clothes.z, type: 'clothes' });
      for (const r of ['respray_n', 'respray_s']) if (P[r]) out.push({ id: r, x: P[r].x, z: P[r].z, type: 'respray' });
      const pk = this.city.parkData;
      if (pk && pk.wheel && P.ferris && !this.world.player.ride) out.push({ id: 'park_ride', x: P.ferris.x, z: P.ferris.z, type: 'ride' });
      if (pk && pk.tir && P.tir && !this.world.player.tir) out.push({ id: 'park_tir', x: P.tir.x, z: P.tir.z, type: 'tir' });
      if (pk) for (const f of pk.foods) if (P[f.place]) out.push({ id: 'park_' + f.id, x: P[f.place].x, z: P[f.place].z, type: 'food', stall: f.id });
      for (const t of this.city.teleports) {
        out.push({ id: 'tele_' + t.id + '_a', x: P[t.a].x, z: P[t.a].z, type: 'tele', to: t.b, text: t.text, gate: t.gate, inward: true });
        out.push({ id: 'tele_' + t.id + '_b', x: P[t.b].x, z: P[t.b].z, y: P[t.b].y, type: 'tele', to: t.a, text: t.back, gate: t.gate, inward: false });
      }
      return out;
    }

    blips() {
      const out = [];
      if (this.mission) out.push(...this.mission.blips());
      if (this.side) out.push(...this.side.blips());
      return out;
    }

    radarIcons() {
      const P = this.city.places;
      const out = [];
      for (const m of this.markers()) {
        if (m.type === 'mission') out.push({ x: m.x, z: m.z, icon: 'letter', letter: m.letter });
        else if (m.type === 'save') out.push({ x: m.x, z: m.z, icon: 'save' });
        else if (m.type === 'shop') out.push({ x: m.x, z: m.z, icon: 'gun' });
        else if (m.type === 'clothes') out.push({ x: m.x, z: m.z, icon: 'clothes' });
        else if (m.type === 'respray') out.push({ x: m.x, z: m.z, icon: 'spray' });
        else if (m.type === 'buy') out.push({ x: m.x, z: m.z, icon: 'buy' });
        else if (m.type === 'ride') out.push({ x: m.x, z: m.z, icon: 'wheel' });
        else if (m.type === 'tir') out.push({ x: m.x, z: m.z, icon: 'tir' });
        else if (m.type === 'food') out.push({ x: m.x, z: m.z, icon: 'food' });
      }
      for (const id of N.HOSPITALS) if (P[id]) out.push({ x: P[id].x, z: P[id].z, icon: 'hosp' });
      for (const s of this.city.metroSpots || []) out.push({ x: s.x, z: s.z, icon: 'metro' });
      for (const id of N.MILITIA) if (P[id]) out.push({ x: P[id].x, z: P[id].z, icon: 'ovd' });
      return out;
    }

    startMission(id) {
      const def = N.MISSION_BY[id];
      if (!def || this.mission || this.failInfo) return false;
      if (this.side) this.side.end('Смена прервана.');
      this.world.setWanted(0);
      this.msg.title = { text: def.title, t: 4 };
      this.mission = new N.MissionRun(this, def, { startSnap: this.snapPlayer() });
      this.world.emit({ t: 'missionstart', id });
      return true;
    }

    snapPlayer() {
      const w = this.world, pl = w.player;
      return {
        x: pl.x, z: pl.z, y: pl.y, yaw: pl.yaw, weapons: JSON.parse(JSON.stringify(pl.weapons)), weapon: pl.weapon, hp: pl.hp, armor: pl.armor,
        money: this.state.money, outfit: this.state.outfit, clock: w.clock, weather: w.weather, flags: JSON.parse(JSON.stringify(this.flags))
      };
    }

    restorePlayer(s) {
      const w = this.world, pl = w.player;
      if (pl.veh) w.exitVehicle(pl);
      w.resetPed(pl);
      Object.assign(pl, { dead: false, state: 'idle', hp: pl.maxHp || 100, armor: s.armor, vx: 0, vz: 0, vy: 0, deck: null, swim: null, burn: 0, puppet: null });
      pl.anim.fall = 0;
      pl.anim.handsUp = 0;
      pl.anim.gest = null;
      pl.weapons = JSON.parse(JSON.stringify(s.weapons));
      pl.weapon = pl.weapons[s.weapon] ? s.weapon : 'fists';
      this.state.money = s.money;
      this.state.flags = JSON.parse(JSON.stringify(s.flags));
      this.flags = this.state.flags;
      if (s.outfit !== this.state.outfit) this.setOutfit(s.outfit);
      w.clock = s.clock;
      w.setWeather(s.weather, 'instant');
    }

    putPlayer(x, z, yaw, y) {
      const w = this.world, pl = w.player;
      if (pl.veh) w.exitVehicle(pl);
      w.resetPed(pl);
      pl.x = x; pl.z = z;
      pl.y = y !== undefined ? y : this.city.groundY(x, z);
      pl.yaw = yaw || 0;
      pl.vx = pl.vz = pl.vy = 0;
      pl.deck = null;
      for (const m of this.markers()) if (Math.hypot(m.x - x, m.z - z) < 5) this.cool.add(m.id);
      w.emit({ t: 'teleport' });
    }

    clearAction() {
      const w = this.world, pl = w.player;
      w.setWanted(0);
      w.busted = false;
      w.slowmo = 1;
      w.fires.length = 0;
      w.projs.length = 0;
      for (const q of w.peds.slice()) if (q.cop && !q.persistent) w.removePed(q);
      for (const v of w.vehs.slice()) if (v.copCar && !v.persistent && v.parkedSpot < 0) w.removeVehicle(v);
      for (const q of w.peds) if (!q.persistent && q.ai && q.ai.mode === 'attack' && q.ai.target === pl) q.ai = { mode: 'walk', edge: -1 };
    }

    retry(kind) {
      const F = this.failInfo;
      if (!F) return false;
      this.failInfo = null;
      this.failReq = false;
      F.run.dispose();
      this.death = null;
      this.subs = [];
      if (this.voice) this.voice.stop();
      this.clearAction();
      const cp = kind === 'cp' && F.cp ? F.cp : null;
      this.restorePlayer(cp ? cp.snap : F.start);
      if (!cp) this.putPlayer(F.start.x, F.start.z, F.start.yaw, F.start.y);
      this.world.player.invuln = 1.5;
      this.msg.big = null;
      this.msg.title = { text: F.def.title, t: 3.5 };
      this.fade = { t: 0.8, dur: 0.8, hold: 0.25 };
      this.mission = new N.MissionRun(this, F.def, { cp, startSnap: F.start });
      if (cp) this.big('КОНТРОЛЬНАЯ ТОЧКА', cp.name, 2.6, 'side');
      this.world.emit({ t: 'missionstart', id: F.def.id, retry: kind });
      return true;
    }

    leaveFailed() {
      const F = this.failInfo;
      if (!F) return false;
      this.failInfo = null;
      this.failReq = false;
      F.run.cleanup(false);
      if (this.death) { this.respawn(this.death); this.fade = { t: 0.8, dur: 0.8, hold: 0.25 }; }
      return true;
    }

    missionPassed(run) {
      const def = run.def;
      if (this.world.player.ride) this.world.player.ride.loop = false;
      this.state.done[def.id] = true;
      this.addMoney(def.reward);
      this.big(def.finale ? 'ГЛАВА ПРОЙДЕНА!' : 'ЗАДАНИЕ ВЫПОЛНЕНО!', '+' + N.money(def.reward), 5, 'pass');
      this.mission = null;
      this.msg.obj = null;
      this.world.emit({ t: 'passed', id: def.id });
      if (def.onPass) def.onPass(this);
      if (N.MISSIONS.every(m => this.state.done[m.id])) this.flag('chapter1', true);
    }

    missionFailed(run) {
      if (this.world.player.ride) this.world.player.ride.loop = false;
      this.big('ЗАДАНИЕ ПРОВАЛЕНО!', run.failed, 4, 'fail');
      this.mission = null;
      this.msg.obj = null;
      if (this.cut) this.endCut();
      this.subs = this.subs.filter(q => !q.cut);
      this.world.frozen = false;
      this.failInfo = { def: run.def, run, reason: run.failed, cp: run.cp, start: run.startSnap, death: this.death ? this.death.kind : null, t: 0 };
      this.world.emit({ t: 'failed', id: run.def.id });
    }

    startSide() {
      const v = this.world.player.veh;
      if (this.side) { this.side.end('Смена окончена.'); return; }
      if (!v || this.mission) return;
      if (v.livery === 'taxi') this.side = new N.TaxiJob(this);
      else if (v.livery === 'militia' || v.copCar) {
        if (this.world.wanted.level > 0) { this.help('Сначала оторвись от милиции.'); return; }
        this.side = new N.PoliceJob(this);
      }
    }

    sideEnded(job, title, sub) {
      this.big(title, sub, 3.5, 'side');
      if (this.side === job) this.side = null;
    }

    playCut(step, run) {
      if (this.cut) this.endCut();
      if (this.voice) this.voice.stop();
      this.subs = [];
      this.world.frozen = true;
      this.msg.obj = null;
      this.msg.help = null;
      this.cut = new N.Cut(this, step, run);
      if (this.cut.over) this.endCut();
    }

    nextShot() { if (this.cut) { this.cut.next(); if (this.cut.over) this.endCut(); } }

    coolNear(r) {
      const pl = this.world.player;
      for (const m of this.markers()) if (Math.hypot(m.x - pl.x, m.z - pl.z) < r) this.cool.add(m.id);
    }

    endCut() {
      const c = this.cut;
      this.cut = null;
      if (c && !c.over) c.skipAll();
      this.coolNear(3.5);
      if (this.voice && this.subs.some(q => q.cut && q.h)) this.voice.stop();
      this.subs = this.subs.filter(q => !q.cut);
      this.world.frozen = false;
      this.world.truce = false;
      this.cutLights = null;
      if (this.msg.title && this.msg.title.cut) this.msg.title = null;
    }

    cutCamera() { return this.cut ? this.cut.camera() : null; }

    step(dt, input = {}) {
      const w = this.world;
      this.state.played += dt;
      for (let i = this.timers.length - 1; i >= 0; i--) { const tm = this.timers[i]; tm.t -= dt; if (tm.t <= 0) { this.timers.splice(i, 1); tm.fn(); } }
      if (this.fade) {
        const f = this.fade;
        f.t += dt;
        if (!f.fired && f.t >= f.dur) { f.fired = true; if (f.then) f.then(); }
        if (f.wait && f.fired && this.fade === f) f.t = Math.min(f.t, f.dur + (f.hold || 0.2));
        if (this.fade === f && f.t >= f.dur + (f.hold || 0.2) + f.dur) this.fade = null;
      }
      if (this.cut) {
        this.cut.step(dt, input);
        if (this.cut && this.cut.over) this.endCut();
      }
      this.stepSubs(dt);
      if (this.failInfo && !this.failInfo.asked && !this.death) {
        this.failInfo.t += dt;
        if (this.failInfo.t > 2.2) { this.failInfo.asked = true; this.failReq = true; }
      }
      for (const k of ['obj', 'help', 'big', 'title', 'zone', 'veh', 'radio', 'view']) {
        const m = this.msg[k];
        if (m) { m.t -= dt; if (m.t <= 0) this.msg[k] = null; }
      }
      for (const p of this.msg.pager) p.t += dt;
      while (this.msg.pager.length && this.msg.pager[0].t > 9) this.msg.pager.shift();
      if (this.shop) return;
      const locked = !!(this.death || this.fade && this.fade.lock);
      w.step(dt, locked || this.cut ? {} : input);
      this.handleEvents();
      if (this.mission) this.mission.step(dt, input);
      if (this.side && !this.death) this.side.step(dt);
      if (!this.cut && !locked) {
        if (input.trip) this.metroSkip();
        if (input.side) this.startSide();
        this.checkMarkers();
        if (input.cheat) this.cheat(input.cheat);
      }
      this.stepDeath(dt);
      this.stepClub();
      if (w.clock + 720 < this.state.clock) this.state.day = (this.state.day || 0) + 1;
      this.state.clock = w.clock;
      const pl = w.player;
      const z = this.city.zoneAt(pl.x, pl.z);
      if (z !== this.lastZone && !this.cut) { this.lastZone = z; this.msg.zone = { text: z, t: 3.5 }; }
    }

    metroSkip() {
      const pl = this.world.player, pk = this.world.park;
      if (pk && pl.ride && !pl.ride.loop && !this.fade && !pl.dead) {
        this.fade = { t: 0, dur: 0.45, hold: 0.45, lock: true, then: () => { if (pk.skip(pl)) this.msg.zone = { text: 'Круг на колесе обозрения', t: 3 }; } };
        return true;
      }
      const M = this.world.metro, A = M && M.player.aboard;
      if (!A || this.fade || this.world.player.dead) return false;
      const nx = M.skipTime(A.tr);
      if (!nx) return false;
      this.fade = { t: 0, dur: 0.45, hold: 0.45, lock: true, then: () => { const st = M.skip(); if (st) this.msg.zone = { text: 'Метро «' + st.name + '»', t: 3.5 }; } };
      return true;
    }

    stepClub() {
      const w = this.world, pl = w.player;
      const inside = this.city.inClub(pl.x, pl.z) && !pl.dead;
      const busy = this.mission && this.mission.def.club;
      if (inside && !this.crowd && !busy) {
        const r = this.city.clubRoom;
        this.crowd = [];
        const kinds = ['dancer', 'dancer', 'girl', 'business', 'gopnik', 'dancer', 'student', 'girl', 'business', 'dancer'];
        kinds.forEach((k, i) => {
          const p = w.spawnPed(k, r.x0 + 14 + (i % 4) * 3.4 + (w.rng() - 0.5), r.z0 + 10 + Math.floor(i / 4) * 3.6 + (w.rng() - 0.5), w.rng() * 6.28, { persistent: true });
          p.ai = { mode: 'idle', dance: true };
          this.crowd.push(p);
        });
        const bar = w.spawnPed('business', r.x0 + 1.5, r.z0 + 10, Math.PI / 2, { persistent: true });
        bar.ai = { mode: 'idle', face: { x: r.x0 + 10, z: r.z0 + 10 } };
        this.crowd.push(bar);
      } else if ((!inside || busy) && this.crowd) {
        for (const p of this.crowd) if (!p.removed) w.removePed(p);
        this.crowd = null;
      }
    }

    handleEvents() {
      const w = this.world;
      for (const e of w.ev) {
        if (e.handled) continue;
        e.handled = true;
        if (e.t === 'wasted' && !this.death) this.onDeath('wasted');
        else if (e.t === 'busted' && !this.death && !w.player.dead) this.onDeath('busted');
        else if (e.t === 'pickup') this.onPickup(e.k);
        else if (e.t === 'jumpend') this.onJump(e);
        else if (e.t === 'mtalk') { const ab = !!(w.metro && w.metro.player.aboard); if (e.aboard === ab && !this.subs.some(q => q.text === e.text) && !this.cut && !(this.mission && this.subs.length)) this.say(e.who, e.text, { prio: 0 }); }
        else if (e.t === 'mfare') {
          if (!e.ok) this.help('Жетон стоит ' + N.METRO.fare + ' р., а денег нет. Турникет не пустит — разве что перепрыгнуть (Пробел), но милиция рядом.');
          else if (!this.flags.metroHelp) { this.flags.metroHelp = true; this.help('Метро: жетон — ' + N.METRO.fare + ' р. Поезда ходят примерно каждые две минуты. В вагоне F — сесть или встать, X — пропустить поездку до следующей станции.'); }
        }
        else if (e.t === 'mdodge') this.say('Дежурная', e.jump ? 'Молодой человек! А ну стой! Ишь, прыгун!' : 'Куда без жетона?! Здесь выход!', { prio: 0 });
        else if (e.t === 'wade' && !this.flags.waterHelp) { this.flags.waterHelp = true; this.help(N.HELP.water); }
        else if (e.t === 'tirend') this.onTirEnd(e);
        else if (e.t === 'rideheld') this.help('Выйти можно только внизу, когда кабинка подойдёт к площадке.', 4);
        else if (e.t === 'ride' && e.on) { this.state.park.rides++; if (!this.flags.wheelHelp) { this.flags.wheelHelp = true; this.help('Колесо обозрения: мышь — смотреть по сторонам, C — камера. Оружие работает и наверху. F — выйти внизу, X — докрутить круг до конца.'); } }
        else if (e.t === 'eatdone') this.state.park.eaten++;
        else if (e.t === 'drowning' && e.p === w.player && !this.flags.drownHelp) { this.flags.drownHelp = true; this.help(N.HELP.drown); }
        else if (e.t === 'enter') {
          const v = e.v;
          this.msg.veh = { text: v.spec.name + (v.livery === 'taxi' ? ' · такси' : v.livery === 'militia' ? ' · милиция' : ''), t: 3.2 };
          const job = v.livery === 'taxi' ? 'taxi' : v.livery === 'militia' || v.copCar ? 'police' : null;
          if (job && !this.side && !this.mission) {
            const flag = job + 'Help';
            this.help(N.HELP[job], this.flags[flag] ? 5 : 8);
            this.flags[flag] = true;
          }
          if (this.flags.taxiBoost && v.livery === 'taxi') v.boost = 1.35;
        }
      }
    }

    onPickup(k) {
      if (k.type === 'money') this.addMoney(k.amount || 50);
      if (k.type === 'stash') {
        if (!this.state.stashes.includes(k.stash)) this.state.stashes.push(k.stash);
        const n = this.state.stashes.length;
        this.addMoney(250);
        let sub = 'Найдено заначек: ' + n + ' из ' + this.city.stashes.length;
        if (n % 5 === 0) {
          sub += '. В гостинице тебя ждёт ' + ({ 5: 'ПМ', 10: 'дробовик', 15: 'АК-74', 20: 'СВД' }[n] || 'подарок') + '.';
          this.rewardPickups();
          if (n === this.city.stashes.length) this.addMoney(20000);
        }
        this.big('ЗАНАЧКА!', sub, 3.5, 'money');
      }
      if (k.type === 'weapon') this.world.emit({ t: 'weapon', id: k.weapon });
    }

    onJump(e) {
      if (!e.ok) { this.big('НЕУДАЧНЫЙ ТРЮК', '', 1.8, 'side'); return; }
      const first = !this.state.jumps.includes(e.j.id);
      const reward = first ? e.j.reward : 50;
      if (first) this.state.jumps.push(e.j.id);
      this.addMoney(reward);
      this.big(first ? 'УНИКАЛЬНЫЙ ТРЮК!' : 'ТРЮК', '+' + N.money(reward) + '  ·  ' + e.dist.toFixed(0) + ' м  ·  ' + e.air.toFixed(1) + ' с', 3.5, 'money');
    }

    onDeath(kind) {
      const w = this.world;
      const op = this.city.outsidePos(w.player.x, w.player.z);
      this.death = { kind, t: 0, x: op.x, z: op.z, drown: kind === 'wasted' && w.player.anim.deathKind === 'drown' };
      this.state.stats[kind === 'wasted' ? 'wasted' : 'busted']++;
      this.big(kind === 'wasted' ? 'ПОТРАЧЕНО' : 'ПОВЯЗАЛИ', '', 3.2, kind);
      w.slowmo = 0.35;
      if (this.mission) this.mission.fail(kind === 'wasted' ? 'Тёма погиб.' : 'Тёму задержала милиция.');
      if (this.side) this.side.end(kind === 'wasted' ? 'Смена окончена.' : 'Смена окончена.');
      if (kind === 'busted') {
        const pl = w.player;
        pl.wantVx = pl.wantVz = 0;
        pl.anim.handsUp = 1;
      }
    }

    stepDeath(dt) {
      const d = this.death;
      if (!d) return;
      d.t += dt;
      if (d.t > 2.4 && !d.faded) {
        d.faded = true;
        if (this.failInfo) this.fade = { t: 0, dur: 0.8, hold: 0.6, lock: true, wait: true, then: () => { if (this.failInfo) { this.failInfo.asked = true; this.failReq = true; } else this.respawn(d); } };
        else this.fade = { t: 0, dur: 0.8, hold: 0.6, lock: true, then: () => this.respawn(d) };
      }
    }

    respawn(d) {
      const w = this.world, pl = w.player;
      const P = this.city.places;
      const opts = (d.kind === 'wasted' ? N.HOSPITALS : N.MILITIA).filter(id => P[id]);
      let best = opts[0], bd = Infinity;
      for (const id of opts) { const p = P[id]; const dd = Math.hypot(p.x - d.x, p.z - d.z); if (dd < bd) { bd = dd; best = id; } }
      if (pl.veh) w.exitVehicle(pl);
      const p = P[best];
      w.resetPed(pl);
      Object.assign(pl, { x: p.x, z: p.z, y: this.city.groundY(p.x, p.z), vx: 0, vz: 0, vy: 0, dead: false, hp: 100, armor: 0, state: 'idle', yaw: p.yaw || 0, deck: null });
      pl.anim.fall = 0;
      pl.anim.handsUp = 0;
      pl.weapons = { fists: { ammo: 1, clip: 0 } };
      pl.weapon = 'fists';
      const fee = Math.min(this.state.money, d.kind === 'wasted' ? 1000 : 1500);
      this.state.money -= fee;
      w.setWanted(0);
      w.busted = false;
      w.slowmo = 1;
      w.clock = (w.clock + 180) % 1440;
      for (const q of w.peds.slice()) if (q.cop && !q.persistent) w.removePed(q);
      for (const v of w.vehs.slice()) if (v.copCar && !v.persistent && v.parkedSpot < 0) w.removeVehicle(v);
      this.help(d.kind === 'wasted' ? (d.drown ? 'Тёму выловили из воды и откачали. ' : '') + (P[best].title || 'Больница') + '. Лечение обошлось в ' + N.money(fee) + ' Оружие пропало.' : 'Отпустили под подписку. «Штраф» — ' + N.money(fee) + ' Оружие изъято.');
      this.death = null;
      pl.invuln = 2;
    }

    checkMarkers() {
      const w = this.world, pl = w.player;
      if (pl.dead) return;
      const ms = this.markers();
      for (const id of Array.from(this.cool)) {
        const m = ms.find(q => q.id === id) || (this.city.places[id] ? { x: this.city.places[id].x, z: this.city.places[id].z } : null);
        if (!m || Math.hypot(pl.x - m.x, pl.z - m.z) > 3) this.cool.delete(id);
      }
      for (const m of ms) {
        if (this.cool.has(m.id)) continue;
        const r = m.type === 'respray' ? 4.5 : 1.4;
        const d = Math.hypot(pl.x - m.x, pl.z - m.z);
        if (d > r) continue;
        if (m.y !== undefined && Math.abs(pl.y - m.y) > 2) continue;
        if (m.y === undefined && pl.y > 6 && m.type !== 'save') continue;
        this.cool.add(m.id);
        if (m.type === 'respray') { if (pl.veh) this.respray(pl.veh); continue; }
        if (pl.veh) { this.cool.delete(m.id); continue; }
        if (m.type === 'ride') { this.rideWheel(); continue; }
        if (m.type === 'tir' || m.type === 'food') {
          const o = w.park ? w.park.open(m.type === 'tir' ? 'tir' : m.stall) : { ok: false, why: 'Закрыто.' };
          if (!o.ok) { this.help(o.why, 4); continue; }
          if (pl.tir || pl.ride) continue;
          this.openShop(m.type, m.stall);
          continue;
        }
        if (m.type === 'mission') {
          if (w.wanted.level > 0) { this.help('Сначала оторвись от милиции.'); continue; }
          if (this.side) this.side.end('Смена прервана.');
          this.coolNear(3);
          this.fade = { t: 0, dur: 0.4, hold: 0.2, lock: true, then: () => { if (!this.mission && !this.failInfo) this.startMission(m.mission); } };
          return;
        } else if (m.type === 'tele') {
          const to = m.to;
          if (m.gate === 'metro' && w.metro) { const why = w.metro.gate(m.inward); if (why) { this.help(why); continue; } }
          const followers = w.peds.filter(q => q.ai && (q.ai.mode === 'follow' && q.ai.target === pl || m.gate === 'metro' && q.cop && q.ai.mode === 'cop') && !q.veh && !q.dead && Math.hypot(q.x - pl.x, q.z - pl.z) < 12);
          this.fade = { t: 0, dur: 0.35, hold: 0.25, lock: true, then: () => {
            this.teleport(to);
            this.cool.add(ms.find(q => q.type === 'tele' && this.city.places[to] && q.x === this.city.places[to].x && q.z === this.city.places[to].z)?.id);
            for (const f of followers) { f.x = pl.x + 1; f.z = pl.z + 1; f.y = pl.y; }
          } };
        } else if (m.type === 'save') this.saveReq = { at: m.id };
        else if (m.type === 'shop') this.openShop('guns');
        else if (m.type === 'clothes') this.openShop('clothes');
        else if (m.type === 'buy') this.openShop('flat');
      }
    }

    respray(v) {
      const w = this.world;
      if (this.state.money < 500) { this.help('Перекраска стоит 500 р. Приходи с деньгами.'); return; }
      this.fade = { t: 0, dur: 0.6, hold: 1.2, lock: true, then: () => {
        this.state.money -= 500;
        const pal = v.spec.colors.filter(c => c !== v.color);
        if (!v.livery) v.color = pal[Math.floor(w.rng() * pal.length)] || v.color;
        v.hp = v.maxHp;
        v.burning = false;
        v.popped = false;
        w.setWanted(0);
        v.ctl.thr = 0;
        v.vx *= 0; v.vz *= 0;
        const nm = !v.livery && N.PAINT_NAME[v.color];
        this.big('ПЕРЕКРАСКА', (nm ? 'Цвет «' + nm + '». ' : 'Как новенькая! ') + '−500 р.', 2.5, 'side');
        w.emit({ t: 'respray' });
      } };
    }

    shopItems(kind) {
      const pl = this.world.player;
      if (kind === 'guns') {
        const out = [];
        for (const id of this.state.unlocked) {
          const W = N.WEAPONS[id];
          if (!W) continue;
          const own = pl.weapons[id];
          if (W.melee) out.push({ id, kind: 'weapon', name: W.name, price: W.price, owned: !!own, note: own ? 'уже есть' : '' });
          else if (W.throw) out.push({ id, kind: 'ammo', name: W.name + ' ×1', price: W.price });
          else out.push(own ? { id, kind: 'ammo', name: W.name + ': патроны ×' + W.ammoPack, price: W.ammoPrice } : { id, kind: 'weapon', name: W.name + ' + ' + W.ammoPack + ' патр.', price: W.price });
        }
        out.push({ id: 'armor', kind: 'armor', name: 'Бронежилет', price: 1200, owned: pl.armor >= pl.maxArmor });
        return out;
      }
      if (kind === 'clothes') return Object.entries(N.OUTFITS).filter(([id]) => id !== 'zek').map(([id, o]) => ({ id, kind: 'outfit', name: o.name, price: o.price, owned: this.state.outfit === id }));
      if (kind === 'flat') return [{ id: 'flat', kind: 'property', name: 'Квартира на Мончегорской', price: 20000, owned: !!this.state.props.flat, note: 'Место сохранения' }];
      if (kind === 'food') {
        const full = pl.hp >= pl.maxHp - 0.5;
        return N.PARK.menu.map(m => ({ id: m.id, kind: 'food', name: m.name, price: m.price, note: '+' + m.hp + ' здоровья' + (full && m.id !== 'kvass' ? ', ты сыт' : '') }));
      }
      if (kind === 'tir') {
        const S = this.state.park, P = N.PARK.tir;
        return [{ id: 'round', kind: 'tir', name: 'Стрельба: ' + P.shots + ' пулек', price: P.price, note: S.tirRounds ? 'рекорд ' + S.tirBest + ' из ' + P.shots : 'пневматика ИЖ-38' }];
      }
      return [];
    }

    openShop(kind, stall) {
      const title = { guns: 'Магазин «Охотник»', clothes: 'Вещевой рынок', flat: 'Агентство недвижимости «Кремль»', food: 'Шаурма', tir: 'Тир' }[kind];
      this.shop = { kind, title, sel: 0, items: this.shopItems(kind), stall: stall || null };
      if (kind === 'tir') this.shop.msg = 'Сбей все десять мишеней — получишь главный приз. Enter — к стойке, Esc — уйти.';
      this.world.emit({ t: 'shop', kind });
    }

    rideWheel() {
      const w = this.world, pl = w.player, pk = w.park;
      if (!pk || pl.ride || pl.tir || this.fade) return false;
      const free = !!(this.mission && this.mission.def.id === 'm6');
      const price = N.PARK.wheel.ticket;
      if (!free && this.state.money < price) { this.help('Билет на колесо обозрения стоит ' + N.money(price) + ' А в кармане пусто.', 4); return false; }
      this.fade = { t: 0, dur: 0.35, hold: 0.3, lock: true, then: () => {
        if (!free) this.state.money -= price;
        pk.board(pl, { loop: free });
        w.emit({ t: 'ticket' });
      } };
      return true;
    }

    onTirEnd(e) {
      const S = this.state.park, P = N.PARK.tir, hits = e.hits;
      this.cool.add('park_tir');
      S.tirRounds++;
      if (!this.state.unlocked.includes('izh38')) { this.unlock('izh38'); this.later(4.5, () => this.help('Понравилась «воздушка»? ИЖ-38 и пульки к ней теперь продаются в «Охотнике».', 7)); }
      if (e.quit) { this.big('ТИР', 'Сбито ' + hits + ' из ' + P.shots, 2.5, 'side'); return; }
      const best = hits > S.tirBest;
      S.tirBest = Math.max(S.tirBest, hits);
      let prize = 0, label = '';
      for (const [need, money, name] of N.PARK.prizes) if (hits >= need) { prize = money; label = name; break; }
      if (hits >= P.shots && !S.tirPerfect) { prize = N.PARK.firstPrize; label = 'Главный приз! Хозяин тира отсчитал'; }
      if (hits >= P.shots) S.tirPerfect++;
      if (prize) this.addMoney(prize);
      this.big('ТИР: ' + hits + ' ИЗ ' + P.shots, prize ? label + ': +' + N.money(prize) : best && hits ? 'Новый рекорд' : 'Без приза', 4, prize ? 'money' : 'side');
    }

    closeShop() { this.shop = null; }

    buy(i) {
      const s = this.shop;
      if (!s) return false;
      const it = s.items[i];
      if (!it) return false;
      if (it.owned && it.kind !== 'ammo') { this.world.emit({ t: 'deny' }); return false; }
      if (this.state.money < it.price) { this.world.emit({ t: 'deny' }); s.msg = 'Не хватает денег.'; return false; }
      const pl = this.world.player;
      if (it.kind === 'food') {
        const o = this.world.park ? this.world.park.open(s.stall) : { ok: false, why: 'Закрыто.' };
        if (!o.ok) { s.msg = o.why; this.world.emit({ t: 'deny' }); return false; }
        if (pl.hp >= pl.maxHp - 0.5 && it.id !== 'kvass') { s.msg = 'Тёма сыт. Здоровье и так полное.'; this.world.emit({ t: 'deny' }); return false; }
        this.state.money -= it.price;
        this.closeShop();
        this.world.park.eat(pl, N.PARK.menu.find(m => m.id === it.id));
        this.world.emit({ t: 'buy' });
        return true;
      }
      if (it.kind === 'tir') {
        this.state.money -= it.price;
        this.closeShop();
        this.fade = { t: 0, dur: 0.3, hold: 0.25, lock: true, then: () => { if (!this.world.park.tirStart(pl)) { this.state.money += it.price; this.help('Тир закрыт.', 3); } else if (!this.flags.tirHelp) { this.flags.tirHelp = true; this.help('Тир: мышь — прицел, ЛКМ — выстрел. После выстрела Тёма сам переламывает ствол и вставляет пульку. Мушка у тировских винтовок всегда кривая — смотри, куда ложатся пульки. F — уйти от стойки.', 9); } } };
        this.world.emit({ t: 'buy' });
        return true;
      }
      this.state.money -= it.price;
      if (it.kind === 'weapon') { const W = N.WEAPONS[it.id]; this.world.giveWeapon(pl, it.id, W.ammoPack || 1); pl.weapon = it.id; }
      else if (it.kind === 'ammo') { const W = N.WEAPONS[it.id]; this.world.giveWeapon(pl, it.id, W.throw ? 1 : W.ammoPack); }
      else if (it.kind === 'armor') pl.armor = pl.maxArmor;
      else if (it.kind === 'outfit') this.setOutfit(it.id);
      else if (it.kind === 'property') { this.ownProperty('flat'); this.big('КВАРТИРА КУПЛЕНА', 'Теперь здесь можно сохраняться', 3, 'money'); }
      this.world.emit({ t: 'buy' });
      s.items = this.shopItems(s.kind);
      s.msg = 'Куплено: ' + it.name;
      return true;
    }

    cheat(code) {
      this.cheatBuf = (this.cheatBuf + code).slice(-12).toUpperCase();
      const w = this.world, pl = w.player;
      const hit = c => this.cheatBuf.endsWith(c);
      let ok = null;
      if (hit('ZDOROVIE')) { pl.hp = pl.maxHp; ok = 'Здоровье'; }
      else if (hit('BRONYA')) { pl.armor = pl.maxArmor; ok = 'Броня'; }
      else if (hit('STVOLY')) { for (const id of ['knuckles', 'pm', 'shotgun', 'ak', 'svd', 'grenade']) w.giveWeapon(pl, id, id === 'grenade' ? 10 : 200); ok = 'Оружие'; }
      else if (hit('BABKI')) { this.addMoney(250000); ok = 'Деньги'; }
      else if (hit('MENTY')) { w.setWanted(0); ok = 'Розыск снят'; }
      else if (hit('POGODA')) { w.setWeather({ clear: 'cloudy', cloudy: 'rain', rain: 'fog', fog: 'clear' }[w.weather], 'fast'); ok = 'Погода: ' + w.wx.name.toLowerCase(); }
      if (ok) { this.cheatBuf = ''; this.help('Чит-код активирован: ' + ok + '.'); w.emit({ t: 'cheat' }); }
    }

    snapshot() {
      const w = this.world, pl = w.player;
      const s = JSON.parse(JSON.stringify(this.state));
      s.weapons = JSON.parse(JSON.stringify(pl.weapons));
      s.hp = pl.hp;
      s.armor = pl.armor;
      s.maxArmor = pl.maxArmor;
      s.clock = w.clock;
      s.stats = Object.assign({}, s.stats, w.stats);
      return s;
    }

    save(slot, at) {
      const s = this.snapshot();
      s.spawnAt = at === 'save_flat' ? 'flat' : at === 'save_club' ? 'club_door' : 'hotel_spawn';
      s.savedAt = new Date().toISOString();
      s.label = (Object.keys(s.done).length) + '/10 · ' + N.clock(s.clock) + ' · ' + N.money(s.money);
      try { store().setItem(SAVE_PREFIX + slot, JSON.stringify(s)); } catch (e) { return false; }
      return true;
    }

    static slots() {
      const out = [];
      for (let i = 1; i <= 4; i++) {
        let s = null;
        try { const raw = store() && store().getItem(SAVE_PREFIX + i); if (raw) { const j = JSON.parse(raw); if (j && j.v === 1) s = j; } } catch (e) { }
        out.push({ slot: i, s });
      }
      return out;
    }

    static load(slot) {
      try {
        const raw = store().getItem(SAVE_PREFIX + slot);
        const j = raw ? JSON.parse(raw) : null;
        return j && j.v === 1 ? j : null;
      } catch (e) { return null; }
    }

    progress() {
      const s = this.state;
      return {
        missions: Object.keys(s.done).filter(k => N.MISSION_BY[k]).length,
        missionsTotal: N.MISSIONS.length,
        stashes: s.stashes.length, stashTotal: this.city.stashes.length,
        jumps: s.jumps.length, jumpTotal: this.city.jumps.length,
        taxi: s.taxi.fares, police: s.police.level,
        views: (s.views || []).length, viewTotal: N.PHOTO ? N.PHOTO.VIEWS.length : 0
      };
    }

    photoTaken(ids) {
      const s = this.state, P = N.PHOTO;
      s.views = s.views || [];
      this.world.stats.photos = (this.world.stats.photos || 0) + 1;
      const fresh = [];
      for (const id of ids || []) if (P.VIEWS.some(v => v.id === id) && !s.views.includes(id) && !fresh.includes(id)) fresh.push(id);
      if (!fresh.length) return fresh;
      for (const id of fresh) { s.views.push(id); this.addMoney(P.fee); }
      const names = fresh.map(id => P.VIEWS.find(v => v.id === id).name).join(', ');
      this.pager('АВТОЗАВОДЕЦ: берём в номер — ' + names + '. Гонорар ' + N.money(P.fee * fresh.length));
      if (s.views.length >= P.VIEWS.length) {
        this.addMoney(P.bonus);
        this.later(4, () => this.pager('АВТОЗАВОДЕЦ: все ' + P.VIEWS.length + ' видов у нас! Премия ' + N.money(P.bonus) + ' и календарь-2001.'));
      }
      return fresh;
    }
  }

  N.Game = Game;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
