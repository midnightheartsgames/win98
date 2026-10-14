/**
 * S.T.A.L.K.E.R. 98 — simulation core (no DOM): fixed-step player physics and survival stats (health, stamina, bleeding,
 * radiation, hunger, weight), weapons (magazines, fire modes, spread, recoil, wear and jams), hitscan ballistics with
 * armour, grenades and bolts, anomalies and artifacts, inventory, trade, loot, relations, day/night clock, weather,
 * level travel with persistent level states, and save/load serialisation.
 * Actor AI lives in st-ai.js, story content in st-quests.js.
 */
(function (S) {
  'use strict';
  const { clamp, lerp, RNG, wrapAng } = S;
  const D = S.DATA, IT = D.ITEMS;
  const DT = 1 / 60, TIME_FACTOR = 10, EYE = 1.62, EYE_CROUCH = 1.02;
  const DAY = 86400;

  let UID = 1;
  const nextUid = () => UID++;

  class Game {
    constructor(opt = {}) {
      this.skill = opt.skill == null ? 1 : opt.skill;
      this.sk = D.SKILLS[this.skill];
      this.lang = opt.lang || 'ru';
      this.rng = RNG(opt.seed || 12345);
      this.time = 7.5 * 3600;           // game clock (seconds since day 1 00:00)
      this.realT = 0;                   // simulated seconds
      this.events = [];
      this.flags = {}; this.quests = {}; this.questOrder = []; this.diary = []; this.knownStashes = {}; this.news = [];
      this.goodwill = Object.assign({}, D.GOODWILL);
      this.stats = { human: 0, mutant: 0, arts: 0, stashes: 0, rating: 0, deaths: 0 };
      this.levelStates = {};
      this.weather = { rain: 0, target: 0, t: 30, thunderT: 20 };
      this.player = this.newPlayer();
      this.inv = []; this.money = opt.money == null ? 500 : opt.money;
      this.slots = { knife: null, pistol: null, rifle: null, suit: null, belt: [null, null, null, null, null] };
      this.cur = 'pistol'; this.flashlight = false;
      if (!opt.empty) {
        this.startKit();
        this.loadLevel(opt.level || 'cordon', opt.spawn || 'start', true);
        if (S.QUESTS && S.QUESTS.onNewGame) S.QUESTS.onNewGame(this);
      }
    }
    // ================================================================ helpers
    L(o) { return o == null ? '' : typeof o === 'string' ? o : (o[this.lang] || o.ru || o.en || ''); }
    emit(e) { this.events.push(e); return e; }
    msg(text, color = '#e8e0b0') { this.emit({ t: 'msg', text: this.L(text), color }); }
    sound(s, x, y, z, vol = 1) { this.emit({ t: 'sound', s, x, y, z, vol }); }
    get eye() { const p = this.player; return p.y + (p.crouch > 0.5 ? EYE_CROUCH : EYE) - (p.dead ? 1.2 : 0); }
    hours() { return (this.time % DAY) / 3600; }
    day() { return Math.floor(this.time / DAY) + 1; }
    // 0 at night, 1 at noon
    daylight() { const h = this.hours(); return clamp(Math.sin(((h - 5.5) / 15) * Math.PI) * 1.4, 0, 1); }
    forward() { const p = this.player, cp = Math.cos(p.pitch); return [Math.sin(p.yaw) * cp, Math.sin(p.pitch), Math.cos(p.yaw) * cp]; }
    newPlayer() {
      return { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: 0.34, h: 1.8, yaw: 0, pitch: 0, ground: true, hp: 100, stamina: 100, bleed: 0, rad: 0, food: 0.8, drunk: 0,
        crouch: 0, lean: 0, dead: false, bob: 0, radIn: 0, exhausted: false, w: { state: 'idle', t: 0, trig: false, kick: 0, burst: 0, mode: 0 }, aim: 0, sprint: false, hurtT: 0, landT: 0 };
    }
    startKit() {
      const knife = this.addItem({ id: 'knife', cond: 0.9 }), pm = this.addItem({ id: 'pm', cond: 0.72, mag: 8, ammo: '9x18' });
      this.slots.knife = knife.uid; this.slots.pistol = pm.uid;
      const suit = this.addItem({ id: 'jacket', cond: 0.8 }); this.slots.suit = suit.uid;
      this.addItem({ id: '9x18', n: 20 }); this.addItem({ id: '9x18', n: 20 });
      this.addItem({ id: 'bandage' }); this.addItem({ id: 'bandage' }); this.addItem({ id: 'medkit' }); this.addItem({ id: 'bread' });
      this.addItem({ id: 'detector' }); this.addItem({ id: 'bolt', n: 99 }); this.addItem({ id: 'binoc' });
      this.cur = 'pistol';
    }

    // ================================================================ inventory
    addItem(o) {
      const d = IT[o.id]; if (!d) return null;
      const it = { uid: nextUid(), id: o.id };
      if (d.kind === 'ammo') it.n = o.n == null ? d.box : o.n;
      if (o.id === 'bolt') it.n = 99;
      if (d.kind === 'weapon' || d.kind === 'suit') it.cond = o.cond == null ? 0.85 : o.cond;
      if (d.kind === 'weapon' && d.mag) { it.mag = o.mag == null ? 0 : o.mag; it.ammo = o.ammo || d.ammo[0]; it.mode = 0; }
      if (o.id === 'bolt' && this.inv.some(i => i.id === 'bolt')) return this.inv.find(i => i.id === 'bolt');
      this.inv.push(it); this.autoSlot(it);
      return it;
    }
    // new weapons and outfits go straight into empty slots, like in the original
    autoSlot(it) {
      const d = IT[it.id]; if (!d || !this.slots) return;
      if (d.kind === 'weapon' && d.slot && !this.slots[d.slot]) this.slots[d.slot] = it.uid;
      else if (d.kind === 'suit' && !this.slots.suit) this.slots.suit = it.uid;
    }
    // give by id with counts; returns list of created items
    give(id, n = 1, cond) {
      const d = IT[id], out = [];
      if (!d) return out;
      if (d.kind === 'ammo') { for (let i = 0; i < n; i++) out.push(this.addItem({ id, n: d.box })); }
      else for (let i = 0; i < n; i++) out.push(this.addItem({ id, cond, mag: d.mag || 0 }));
      return out;
    }
    item(uid) { return this.inv.find(i => i.uid === uid) || null; }
    has(id, n = 1) { return this.count(id) >= n; }
    count(id) { const d = IT[id]; let c = 0; for (const i of this.inv) if (i.id === id) c += d && d.kind === 'ammo' ? 1 : 1; return c; }
    ammoCount(type) { let c = 0; for (const i of this.inv) if (i.id === type) c += i.n; return c; }
    takeById(id, n = 1) {
      let left = n;
      for (let k = this.inv.length - 1; k >= 0 && left > 0; k--) if (this.inv[k].id === id) { this.removeItem(this.inv[k].uid); left--; }
      return left === 0;
    }
    removeItem(uid) {
      const k = this.inv.findIndex(i => i.uid === uid); if (k < 0) return null;
      const it = this.inv[k]; this.inv.splice(k, 1);
      for (const s of ['knife', 'pistol', 'rifle', 'suit']) if (this.slots[s] === uid) this.slots[s] = null;
      this.slots.belt = this.slots.belt.map(b => (b === uid ? null : b));
      if (this.cur !== 'knife' && this.cur !== 'grenade' && this.cur !== 'bolt' && this.cur !== 'binoc' && !this.slots[this.cur]) this.cur = this.slots.pistol ? 'pistol' : this.slots.rifle ? 'rifle' : 'knife';
      return it;
    }
    itemWeight(it) { const d = IT[it.id]; if (!d) return 0; if (d.kind === 'ammo') return d.w * (it.n / d.box); return d.w; }
    weight() { let w = 0; for (const it of this.inv) w += this.itemWeight(it); return w; }
    maxWeight() { return 50 + this.artEff('weight'); }
    suit() { const u = this.slots.suit; return u ? this.item(u) : null; }
    prot(type) { const s = this.suit(); let v = 0; if (s) v = (IT[s.id].prot[type] || 0) * (0.4 + 0.6 * s.cond); return clamp(v + this.artEff(type), 0, 0.9); }
    belt() { return this.slots.belt.map(u => (u ? this.item(u) : null)).filter(Boolean); }
    artEff(k) { let v = 0; for (const it of this.belt()) { const e = IT[it.id].eff; if (e && e[k]) v += e[k]; } return v; }
    // equip a weapon/suit/artifact into its slot
    equip(uid) {
      const it = this.item(uid); if (!it) return false; const d = IT[it.id];
      if (d.kind === 'weapon') { this.slots[d.slot] = uid; this.selectSlot(d.slot); return true; }
      if (d.kind === 'suit') { this.slots.suit = uid; this.emit({ t: 'sound', s: 'cloth' }); return true; }
      if (d.kind === 'art') { if (this.slots.belt.includes(uid)) return false; const k = this.slots.belt.indexOf(null); if (k < 0) { this.msg(D.T('Пояс заполнен', 'Belt is full')); return false; } this.slots.belt[k] = uid; this.emit({ t: 'sound', s: 'art' }); return true; }
      return false;
    }
    unequip(uid) {
      for (const s of ['knife', 'pistol', 'rifle', 'suit']) if (this.slots[s] === uid) { this.slots[s] = null; if (this.cur === s) this.cur = this.slots.pistol ? 'pistol' : 'knife'; return true; }
      const k = this.slots.belt.indexOf(uid); if (k >= 0) { this.slots.belt[k] = null; return true; }
      return false;
    }
    isEquipped(uid) { return ['knife', 'pistol', 'rifle', 'suit'].some(s => this.slots[s] === uid) || this.slots.belt.includes(uid); }
    useItem(uid) {
      const it = this.item(uid); if (!it) return false; const d = IT[it.id], p = this.player;
      if (d.kind === 'med' || d.kind === 'food') {
        const e = d.eff || {};
        if (e.hp) p.hp = Math.min(100, p.hp + e.hp);
        if (e.bleed) p.bleed = Math.max(0, p.bleed - e.bleed);
        if (e.rad) p.rad = Math.max(0, p.rad - e.rad);
        if (e.food) p.food = Math.min(1.2, p.food + e.food);
        if (e.stamina) p.stamina = Math.min(100, p.stamina + e.stamina);
        if (e.drunk) p.drunk = Math.min(60, p.drunk + e.drunk);
        this.removeItem(uid);
        this.emit({ t: 'sound', s: d.kind === 'food' ? (it.id === 'vodka' || it.id === 'energy' ? 'drink' : 'eat') : it.id === 'bandage' ? 'bandage' : 'medkit' });
        this.emit({ t: 'used', id: it.id });
        return true;
      }
      if (d.kind === 'weapon' || d.kind === 'suit' || d.kind === 'art') return this.isEquipped(uid) ? this.unequip(uid) : this.equip(uid);
      return false;
    }
    quickUse(q) {
      const order = { 1: ['medkit', 'medkit_army'], 2: ['bandage'], 3: ['antirad', 'vodka'], 4: ['bread', 'sausage', 'tourist'] }[q];
      if (!order) return false;
      for (const id of order) { const it = this.inv.find(i => i.id === id); if (it) return this.useItem(it.uid); }
      this.msg(D.T('Нет подходящих предметов', 'Nothing to use'), '#c0a080'); return false;
    }
    dropItem(uid) {
      const it = this.item(uid); if (!it || IT[it.id].noDrop || IT[it.id].kind === 'quest') return false;
      this.removeItem(uid);
      const p = this.player, f = this.forward();
      this.items.push(Object.assign(it, { x: p.x + f[0] * 0.8, z: p.z + f[2] * 0.8, y: this.W.groundAt(p.x + f[0] * 0.8, p.z + f[2] * 0.8, 0.1, null), ph: Math.random() * 6 }));
      this.emit({ t: 'sound', s: 'drop' });
      return true;
    }
    unloadWeapon(uid) {
      const it = this.item(uid); if (!it || !it.mag) return false;
      this.addAmmo(it.ammo, it.mag); it.mag = 0; this.emit({ t: 'sound', s: 'reload1' }); return true;
    }
    addAmmo(type, n) {
      const d = IT[type]; if (!d || n <= 0) return;
      for (const it of this.inv) if (it.id === type && it.n < d.box) { const k = Math.min(n, d.box - it.n); it.n += k; n -= k; if (!n) return; }
      while (n > 0) { const k = Math.min(n, d.box); this.addItem({ id: type, n: k }); n -= k; }
    }
    takeAmmo(type, n) {
      let got = 0;
      const boxes = this.inv.filter(i => i.id === type).sort((a, b) => a.n - b.n);
      for (const b of boxes) { const k = Math.min(n - got, b.n); b.n -= k; got += k; if (b.n <= 0) this.removeItem(b.uid); if (got >= n) break; }
      return got;
    }

    // ================================================================ relations
    attitudeOf(a, b) {
      // returns -1 enemy, 0 neutral, 1 friend for actor a towards b (b may be 'player' or an actor)
      if (b === 'player' || b === this.player) {
        if (a.kind === 'mutant') return -1;
        if (a.hostile) return -1;
        if (a.attitude === 'neutral') return 0;
        if (a.attitude === 'friend') return 1;
        if (a.attitude === 'enemy') return -1;
        const g = this.goodwill[a.faction] || 0;
        return g <= -300 ? -1 : g >= 300 ? 1 : 0;
      }
      if (a === b) return 1;
      if (b.ignore || a.ignore) return 0;
      if (a.kind === 'mutant' && b.kind === 'mutant') return 1;
      if (a.kind === 'mutant' || b.kind === 'mutant') return -1;
      if (a.group && a.group === b.group) return 1;
      return (D.REL[a.faction] || {})[b.faction] || 0;
    }
    playerAttitudeLabel(a) { const v = this.attitudeOf(a, 'player'); return v < 0 ? 'enemy' : v > 0 ? 'friend' : 'neutral'; }
    // player attacked actor a
    provoke(a, killed) {
      if (a.kind !== 'human') return;
      const was = this.attitudeOf(a, 'player');
      if (was >= 0 || a.attitude === 'neutral') {
        a.hostile = true; a.attitude = null;
        // the group and witnesses of the same faction turn on the player
        for (const o of this.actors) {
          if (o === a || o.dead || o.kind !== 'human') continue;
          if ((a.group && o.group === a.group) || (o.faction === a.faction && Math.hypot(o.x - a.x, o.z - a.z) < 35)) { o.hostile = true; o.attitude = null; o.ai.alertT = 10; o.ai.lastSeen = { x: this.player.x, z: this.player.z }; }
        }
        if (was > 0) this.addGoodwill(a.faction, killed ? -400 : -150);
      }
      if (killed && was < 0) { this.addGoodwill(a.faction, -20); for (const f in D.REL) if ((D.REL[f] || {})[a.faction] === -1 && f !== 'monster') this.addGoodwill(f, 15); }
    }
    addGoodwill(f, v) { if (f === 'monster' || f === 'trader') return; this.goodwill[f] = clamp((this.goodwill[f] || 0) + v, -1000, 1000); }
    rank() { let r = D.RANKS[0]; for (const k of D.RANKS) if (this.stats.rating >= k.at) r = k; return r; }

    // ================================================================ levels
    loadLevel(id, spawn, fresh) {
      const def = S.LEVELS[id](); this.levelId = id; this.def = def; this.W = new S.World(def);
      this.projs = []; this.corpseT = 0;
      const snap = this.levelStates[id];
      if (snap) this.restoreLevel(snap);
      else this.populate();
      for (const a of this.anomalies) this.W.markCost(a.x, a.z, a.r + 1.2, 12);
      const sp = def.spawns[spawn] || def.spawns.start || Object.values(def.spawns)[0], p = this.player;
      p.x = sp.x; p.z = sp.z; p.y = sp.y != null ? sp.y : this.W.groundAt(sp.x, sp.z, 0.3); p.yaw = sp.yaw || 0; p.pitch = 0; p.vx = p.vy = p.vz = 0; p.ground = true;
      this.zoneIn = {}; this.exitIn = null;
      for (const z of def.zones) if (this.inRect(z, p.x, p.z)) this.zoneIn[z.id] = true;
      for (const e of def.exits) if (this.inRect(e, p.x, p.z)) this.exitIn = e.id;
      this.emit({ t: 'level', id });
      if (S.QUESTS && S.QUESTS.onLevel) S.QUESTS.onLevel(this, id, !!fresh || !snap);
    }
    populate() {
      const def = this.def, W = this.W;
      this.actors = []; this.items = []; this.stashes = []; this.anomalies = [];
      def.npcs.forEach((n, i) => this.actors.push(S.makeHuman(this, n, i)));
      def.mutants.forEach((m, i) => this.actors.push(S.makeMutant(this, m, i)));
      for (const it of def.items) { const o = this.addGround(it.id, it.x, it.z, it.y, { quest: it.quest }); if (o && it.y == null) o.y = W.groundAt(it.x, it.z, 0.1); }
      for (const a of def.arts) this.addGround(a.id, a.x, a.z, null);
      for (const s of def.stashes) {
        const items = [];
        for (const [id, n, cond] of s.items) { const d = IT[id]; for (let k = 0; k < (n || 1); k++) items.push(this.mkItem(id, cond)); void d; }
        this.stashes.push({ id: s.id, x: s.x, z: s.z, y: s.y != null ? s.y : W.groundAt(s.x, s.z, 0.2), kind: s.kind, hidden: s.hidden, name: s.name, items, opened: false });
      }
      for (const a of def.anomalies) {
        const A = D.ANOMALIES[a.type];
        this.anomalies.push({ type: a.type, x: a.x, z: a.z, y: W.groundAt(a.x, a.z, 0.3), r: a.r || A.r, t: 0, state: 'idle', cd: 0, seed: Math.random() * 100 });
      }
    }
    mkItem(id, cond) {
      const d = IT[id]; const it = { uid: nextUid(), id };
      if (d.kind === 'ammo') it.n = d.box;
      if (d.kind === 'weapon' || d.kind === 'suit') it.cond = cond == null ? 0.7 : cond;
      if (d.kind === 'weapon' && d.mag) { it.mag = Math.floor(d.mag * 0.6); it.ammo = d.ammo[0]; it.mode = 0; }
      return it;
    }
    addGround(id, x, z, y, extra = {}) {
      const it = Object.assign(this.mkItem(id), { x, z, y: y != null ? y : this.W.groundAt(x, z, 0.1), ph: (x * 3 + z) % 6 }, extra);
      if (IT[id] && IT[id].kind === 'weapon' && IT[id].mag) it.mag = 0;
      this.items.push(it); return it;
    }
    snapshot() {
      const strip = a => { const o = Object.assign({}, a); delete o.ai; delete o.anim; delete o.pathPts; return o; };
      return {
        actors: this.actors.map(strip), items: this.items.map(i => Object.assign({}, i)), stashes: this.stashes.map(s => Object.assign({}, s, { items: s.items.slice() })),
        anomalies: this.anomalies.map(a => ({ type: a.type, x: a.x, z: a.z, y: a.y, r: a.r })), leftAt: this.time
      };
    }
    restoreLevel(snap) {
      this.actors = snap.actors.map(a => S.reviveActor(this, JSON.parse(JSON.stringify(a))));
      this.items = snap.items.map(i => Object.assign({}, i));
      this.stashes = snap.stashes.map(s => Object.assign({}, s, { items: s.items.slice() }));
      this.anomalies = snap.anomalies.map(a => Object.assign({ t: 0, state: 'idle', cd: 0, seed: Math.random() * 100 }, a));
      // time passed: the dead are cleared away eventually
      const away = this.time - (snap.leftAt || this.time);
      if (away > 6 * 3600) this.actors = this.actors.filter(a => !a.dead || a.essential || (a.inv && a.inv.some(i => IT[i.id] && IT[i.id].kind === 'quest')));
    }
    travel(exit) {
      if (!exit) return;
      if (exit.to === 'agroprom') { if (S.QUESTS && S.QUESTS.onAgroprom) S.QUESTS.onAgroprom(this); return; }
      this.levelStates[this.levelId] = this.snapshot();
      this.loadLevel(exit.to, exit.spawn, false);
      this.emit({ t: 'autosave' });
    }
    inRect(r, x, z) { return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1; }
    actorById(id) { return this.actors.find(a => a.id === id) || null; }
    group(name) { return this.actors.filter(a => a.group === name); }
    groupAlive(name) { return this.group(name).filter(a => !a.dead && !a.hidden); }
    groupDead(name) { const g = this.group(name); return g.length > 0 && g.every(a => a.dead); }
    spawnGroup(name) { for (const a of this.group(name)) if (a.hidden) { a.hidden = false; a.ai.alertT = 0; } }

    // ================================================================ main tick
    tick(inp = {}) {
      const p = this.player;
      this.realT += DT; this.time += DT * TIME_FACTOR;
      this.updateWeather();
      if (!p.dead) this.updatePlayer(inp);
      else { p.vx *= 0.9; p.vz *= 0.9; this.W.move(p, DT); }
      this.updateProjectiles();
      this.updateAnomalies();
      S.updateActors(this);
      this.updateZones();
      if (S.QUESTS && S.QUESTS.tick) S.QUESTS.tick(this);
    }
    updateWeather() {
      const w = this.weather, env = this.def.env;
      w.t -= DT;
      if (w.t <= 0) { w.t = 60 + this.rng() * 120; w.target = this.rng() < (env.rain || 0) ? 0.4 + this.rng() * 0.6 : 0; }
      w.rain += clamp(w.target - w.rain, -DT * 0.03, DT * 0.03);
      if (w.rain > 0.6) { w.thunderT -= DT; if (w.thunderT <= 0) { w.thunderT = 15 + this.rng() * 30; this.emit({ t: 'lightning' }); } }
    }

    // ================================================================ player
    updatePlayer(inp) {
      const p = this.player, W = this.W;
      if (inp.dyaw) p.yaw = wrapAng(p.yaw + inp.dyaw);
      if (inp.dpitch) p.pitch = clamp(p.pitch + inp.dpitch, -1.45, 1.45);
      // posture
      const wantCrouch = !!inp.crouch;
      if (wantCrouch) p.crouch = Math.min(1, p.crouch + DT * 5);
      else { const c = W.ceilAt(p.x, p.z, p.r, p.y + 1.0); if (c > p.y + 1.85) p.crouch = Math.max(0, p.crouch - DT * 5); }
      p.h = 1.8 - p.crouch * 0.6;
      p.lean += ((inp.lean || 0) - p.lean) * Math.min(1, DT * 8);
      // weight & stamina
      const wt = this.weight(), mw = this.maxWeight(), over = wt > mw, stuck = wt > mw + 10;
      if (over && !this.overMsgT) { this.msg(stuck ? D.STR[this.lang].cantMove : D.STR[this.lang].overweight, '#ff9060'); this.overMsgT = 8; }
      if (this.overMsgT) this.overMsgT = Math.max(0, this.overMsgT - DT);
      const moving = inp.fwd || inp.strafe;
      if (p.stamina <= 0.5) p.exhausted = true; else if (p.stamina > 25) p.exhausted = false;
      p.sprint = !!inp.sprint && moving && inp.fwd > 0 && !over && !p.exhausted && p.crouch < 0.3 && p.aim < 0.3;
      let speed = p.sprint ? 5.8 : 3.3;
      if (p.crouch > 0.5) speed = 1.7;
      if (p.aim > 0.5) speed *= 0.6;
      if (over) speed *= stuck ? 0.12 : 0.7;
      if (p.food <= 0.05) speed *= 0.9;
      const f = inp.fwd || 0, s = inp.strafe || 0, l = Math.hypot(f, s) || 1;
      const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
      // right vector for this engine = (-cos, +sin) of yaw
      const tx = ((sy * f) - (cy * s)) / l * speed, tz = ((cy * f) + (sy * s)) / l * speed;
      const acc = p.ground ? 12 : 2;
      p.vx += (tx - p.vx) * Math.min(1, DT * acc); p.vz += (tz - p.vz) * Math.min(1, DT * acc);
      if (inp.jump && p.ground && !p.jumpHeld && p.stamina > 8 && !stuck && p.crouch < 0.5) { p.vy = 5.3; p.ground = false; p.stamina -= 10; this.emit({ t: 'jump' }); }
      p.jumpHeld = !!inp.jump;
      const land = W.move(p, DT);
      if (land > 3) this.emit({ t: 'land', v: land });
      if (land > 9.5) this.hurtPlayer((land - 9.5) * 9, 'fall', null);
      const hsp = Math.hypot(p.vx, p.vz);
      if (p.ground) { const ob = p.bob; p.bob += hsp * DT * 0.9; if (Math.floor(ob) !== Math.floor(p.bob)) this.emit({ t: 'step', surf: this.surfaceAt(p.x, p.z, p.y), run: p.sprint }); }
      // stamina
      if (p.sprint && hsp > 1) p.stamina = Math.max(0, p.stamina - DT * (over ? 18 : 11));
      else p.stamina = Math.min(100, p.stamina + DT * (7 + this.artEff('stamina') * 10) * (p.food < 0.2 ? 0.5 : 1) * (p.rad > 0.4 ? 0.6 : 1));
      // survival
      p.food = Math.max(0, p.food - DT * TIME_FACTOR / 28800);
      if (p.food < 0.2 && !this.hungryMsg) { this.hungryMsg = true; this.msg(D.STR[this.lang].hungry, '#e0c080'); }
      if (p.food > 0.3) this.hungryMsg = false;
      if (p.food <= 0) p.hp -= DT * 0.06;
      // radiation from zones and artifacts
      let rin = 0;
      for (const z of this.def.rads) { const d = Math.hypot(p.x - z.x, p.z - z.z); if (d < z.r) rin += z.power * (1 - d / z.r) * (0.5 + 0.5 * (1 - d / z.r)); }
      p.radIn = rin;
      p.rad = clamp(p.rad + rin * (1 - this.prot('rad')) * DT + this.artEff('rad') * DT - 0.0004 * DT, 0, 1.2);
      if (p.rad > 0.05) p.hp -= p.rad * 1.1 * DT;
      // bleeding
      p.bleed = clamp(p.bleed - DT * (0.012 + this.artEff('bleed')), 0, 4);
      if (p.bleed > 0.01) { p.hp -= p.bleed * DT; this.bleedDripT = (this.bleedDripT || 0) - DT; if (this.bleedDripT <= 0) { this.bleedDripT = 1.2 / (0.5 + p.bleed); this.emit({ t: 'blood', x: p.x, y: p.y + 0.9, z: p.z, n: 2 }); } }
      // regeneration
      p.hp = Math.min(100, p.hp + DT * ((p.food > 0.5 ? 0.02 : 0) + this.artEff('hp')));
      p.drunk = Math.max(0, p.drunk - DT);
      p.hurtT = Math.max(0, p.hurtT - DT);
      if (p.hp <= 0) { this.killPlayer(); return; }
      // weapons & interaction
      this.updateWeapon(inp);
      this.updateFocus();
      if (inp.use) this.useFocus();
      if (inp.flashlight) { this.flashlight = !this.flashlight; this.emit({ t: 'sound', s: 'click' }); }
      if (inp.quick) this.quickUse(inp.quick);
    }
    surfaceAt(x, z, y) {
      const g = this.W.terrainAt(x, z);
      if (y > g + 0.15 || this.W.F.inHole(x, z)) return 'hard';
      for (const r of this.def.roads) if (S.lineDist(x, z, r.pts).d < r.w / 2) return r.kind === 'asphalt' ? 'hard' : 'dirt';
      return 'grass';
    }
    hurtPlayer(dmg, type, from, dir) {
      const p = this.player; if (p.dead || this.god) return;
      let k = 1;
      if (type === 'bullet') k = 1 - this.prot('bullet');
      else if (type === 'bite' || type === 'strike') k = 1 - this.prot('tear') * 0.8;
      else if (type === 'burn' || type === 'shock' || type === 'chem') k = 1 - this.prot(type);
      else if (type === 'explosion') k = 1 - this.prot('bullet') * 0.5;
      const d = dmg * k * (type === 'fall' ? 1 : this.sk.dmgIn);
      p.hp -= d; p.hurtT = 0.3;
      // bleeding from wounds
      if (type === 'bullet' || type === 'bite' || type === 'explosion') p.bleed = Math.min(4, p.bleed + d * (type === 'bite' ? 0.02 : 0.014) * (1 - this.prot('tear') * 0.6));
      // armour wears
      const s = this.suit(); if (s && type !== 'fall') s.cond = Math.max(0, s.cond - d * 0.0012);
      this.emit({ t: 'hurt', dmg: d, dir: dir != null ? dir : from ? Math.atan2(from.x - p.x, from.z - p.z) : null, type });
      if (d > 4) this.emit({ t: 'sound', s: 'pain', vol: 0.8 });
      if (p.hp <= 0) this.killPlayer();
    }
    killPlayer() {
      const p = this.player; if (p.dead) return;
      p.dead = true; p.hp = 0; this.stats.deaths++; this.emit({ t: 'pdie' }); this.emit({ t: 'sound', s: 'pdeath' });
    }

    // ================================================================ weapons
    weaponItem(slot = this.cur) { const u = this.slots[slot]; return u ? this.item(u) : null; }
    selectSlot(slot) {
      if (slot === this.cur && this.player.w.state !== 'switch') return;
      if ((slot === 'pistol' || slot === 'rifle' || slot === 'knife') && !this.slots[slot]) return;
      if (slot === 'grenade' && !this.inv.some(i => IT[i.id].kind === 'grenade')) { this.msg(D.T('Нет гранат', 'No grenades'), '#c0a080'); return; }
      if (slot === 'binoc' && !this.has('binoc')) return;
      const w = this.player.w; w.state = 'switch'; w.t = 0.45; w.next = slot; w.reloading = false;
      this.emit({ t: 'switch', slot });
    }
    curWeaponId() {
      if (this.cur === 'grenade') { const g = this.inv.find(i => IT[i.id].kind === 'grenade'); return g ? g.id : 'f1'; }
      if (this.cur === 'bolt') return 'bolt';
      if (this.cur === 'binoc') return 'binoc';
      const it = this.weaponItem(); return it ? it.id : 'knife';
    }
    updateWeapon(inp) {
      const p = this.player, w = p.w;
      if (inp.slot) this.selectSlot(inp.slot);
      if (inp.cycle) {
        const order = ['knife', 'pistol', 'rifle', 'grenade', 'bolt'].filter(s => s === 'bolt' || (s === 'grenade' ? this.inv.some(i => IT[i.id].kind === 'grenade') : this.slots[s]));
        const k = order.indexOf(w.state === 'switch' ? w.next : this.cur); this.selectSlot(order[(k + inp.cycle + order.length) % order.length]);
      }
      w.kick = Math.max(0, w.kick - DT * 3.2);
      if (w.state === 'switch') { w.t -= DT; if (w.t <= 0) { this.cur = w.next; w.state = 'idle'; } p.aim = Math.max(0, p.aim - DT * 6); return; }
      const it = this.weaponItem(), d = it ? IT[it.id] : null, gun = d && d.mag && (this.cur === 'pistol' || this.cur === 'rifle');
      p.aim = clamp(p.aim + (inp.aim && w.state !== 'reload' && !p.sprint ? DT * 7 : -DT * 7), 0, 1);
      if (inp.mode && gun && d.modes.length > 1) { it.mode = (it.mode + 1) % d.modes.length; this.emit({ t: 'sound', s: 'click' }); this.emit({ t: 'mode', m: d.modes[it.mode] }); }
      if (w.state === 'reload') {
        w.t -= DT;
        if (w.t <= 0) {
          w.state = 'idle';
          if (it && d.mag) { const need = d.mag - it.mag; const got = this.takeAmmo(it.ammo, need); it.mag += got; }
        }
        return;
      }
      if (w.state === 'jam') { if (inp.reload) { w.state = 'reload'; w.t = (d ? d.reload : 2) * 1.2; this.emit({ t: 'reload', w: it ? it.id : null, jam: true }); } if (inp.fire && !w.trig) this.emit({ t: 'sound', s: 'dry' }); w.trig = !!inp.fire; return; }
      if (w.state === 'cool') { w.t -= DT; if (w.t <= 0) w.state = 'idle'; }
      if (inp.reload && gun && w.state === 'idle') this.startReload(it);
      if (p.sprint) { w.trig = !!inp.fire; return; }
      const fireNow = inp.fire && w.state === 'idle';
      if (this.cur === 'knife') { if (fireNow) { this.knifeAttack(); w.state = 'cool'; w.t = IT.knife.rate; } w.trig = !!inp.fire; return; }
      if (this.cur === 'bolt') { if (fireNow && !w.trig) { this.throwThing('bolt'); w.state = 'cool'; w.t = 0.7; } w.trig = !!inp.fire; return; }
      if (this.cur === 'binoc') { w.trig = !!inp.fire; return; }
      if (this.cur === 'grenade') {
        if (fireNow && !w.trig) { const g = this.inv.find(i => IT[i.id].kind === 'grenade'); if (g) { this.removeItem(g.uid); this.throwThing(g.id); w.state = 'cool'; w.t = 1.1; if (!this.inv.some(i => IT[i.id].kind === 'grenade')) { w.state = 'switch'; w.t = 0.9; w.next = this.slots.rifle ? 'rifle' : this.slots.pistol ? 'pistol' : 'knife'; } } }
        w.trig = !!inp.fire; return;
      }
      if (!gun) { w.trig = !!inp.fire; return; }
      const auto = d.modes[it.mode] === 'a';
      if (fireNow && (auto || !w.trig)) {
        if (it.mag <= 0) { if (!w.trig) { this.emit({ t: 'sound', s: 'dry' }); if (this.ammoCount(it.ammo) > 0 || d.ammo.some(a => this.ammoCount(a) > 0)) this.startReload(it); else this.msg(D.STR[this.lang].noAmmo, '#c0a080'); } }
        else this.fireWeapon(it, d);
      }
      w.trig = !!inp.fire;
    }
    startReload(it) {
      const d = IT[it.id], w = this.player.w;
      if (it.mag >= d.mag && this.ammoCount(it.ammo) > 0) return;
      // switch to another compatible ammo type if the current one is gone
      if (this.ammoCount(it.ammo) <= 0) { const alt = d.ammo.find(a => this.ammoCount(a) > 0); if (!alt) { this.msg(D.STR[this.lang].noAmmo, '#c0a080'); return; } if (it.mag > 0) this.addAmmo(it.ammo, it.mag); it.mag = 0; it.ammo = alt; }
      w.state = 'reload'; w.t = d.reload; this.emit({ t: 'reload', w: it.id });
    }
    spreadDeg(d, it) {
      const p = this.player, mv = Math.hypot(p.vx, p.vz);
      let s = lerp(d.spread, d.aim, p.aim);
      s *= 1 + mv * 0.18 + (p.ground ? 0 : 1.5);
      if (p.crouch > 0.5) s *= 0.72;
      s *= 1 + (1 - it.cond) * 1.1;
      s += p.w.kick * 1.2;
      if (p.drunk > 0) s *= 1.3;
      return s;
    }
    fireWeapon(it, d) {
      const p = this.player, w = p.w;
      it.mag--; w.state = 'cool'; w.t = 60 / d.rpm;
      it.cond = Math.max(0, it.cond - d.wear);
      const spread = this.spreadDeg(d, it) * Math.PI / 180, f = this.forward();
      const ex = p.x - Math.cos(p.yaw) * p.lean * 0.35, ez = p.z + Math.sin(p.yaw) * p.lean * 0.35, ey = this.eye - Math.abs(p.lean) * 0.08;
      const ammo = IT[it.ammo] || {};
      for (let k = 0; k < (d.pellets || 1); k++) {
        const dir = this.coneDir(f, spread);
        this.bullet('player', ex, ey, ez, dir, d.dmg * (ammo.dmg || 1), ammo.pierce || 0, d.hit || 1, k === 0);
      }
      // recoil kicks the view
      const rec = d.recoil * (p.crouch > 0.5 ? 0.75 : 1) * (1 - p.aim * 0.25) * Math.PI / 180;
      p.pitch = clamp(p.pitch + rec * (0.7 + this.rng() * 0.5), -1.45, 1.45); p.yaw = wrapAng(p.yaw + (this.rng() - 0.5) * rec * 0.8);
      w.kick = Math.min(4, w.kick + d.recoil * 0.45);
      this.emit({ t: 'fire', w: it.id });
      this.noise(p.x, p.z, d.pellets ? 90 : it.id === 'pm' || it.id === 'fort' ? 60 : 110, 'player');
      // jams on worn weapons
      if (it.cond < 0.62 && this.rng() < (0.62 - it.cond) * 0.07) { w.state = 'jam'; this.msg(D.STR[this.lang].jam, '#ff9060'); this.emit({ t: 'sound', s: 'jam' }); }
    }
    coneDir(f, spread) {
      if (spread <= 0) return f.slice();
      const a = this.rng() * Math.PI * 2, r = Math.sqrt(this.rng()) * Math.tan(spread / 2);
      let ux = -f[2], uz = f[0]; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
      const vx = f[1] * uz, vy = f[2] * ux - f[0] * uz, vz = -f[1] * ux;
      const dx = f[0] + (ux * Math.cos(a) + vx * Math.sin(a)) * r, dy = f[1] + vy * Math.sin(a) * r, dz = f[2] + (uz * Math.cos(a) + vz * Math.sin(a)) * r, l = Math.hypot(dx, dy, dz);
      return [dx / l, dy / l, dz / l];
    }
    // ray against world and actors
    trace(ox, oy, oz, dx, dy, dz, maxT, ignore) {
      const wh = this.W.ray(ox, oy, oz, dx, dy, dz, maxT, true);
      let best = wh ? wh.t : maxT, hit = wh ? { t: wh.t, n: wh.n, box: wh.box, terrain: wh.terrain } : null;
      for (const a of this.actors) {
        if (a === ignore || a.hidden || (a.dead && a.deadT > 0.5)) continue;
        const cx = a.x - ox, cz = a.z - oz;
        const along = cx * dx + cz * dz; if (along < -1 || along > best + 1) continue;
        // head sphere
        const hh = S.actorHead(a);
        { const hx = hh[0] - ox, hy = hh[1] - oy, hz = hh[2] - oz, b = hx * dx + hy * dy + hz * dz, c = hx * hx + hy * hy + hz * hz - hh[3] * hh[3], disc = b * b - c;
          if (disc > 0) { const t = b - Math.sqrt(disc); if (t > 0 && t < best) { best = t; hit = { t, actor: a, head: true }; } } }
        // body cylinder
        const r = a.kind === 'human' ? 0.3 : a.r, hgt = S.actorHeight(a), dl2 = dx * dx + dz * dz;
        if (dl2 < 1e-9) continue;
        const b = (cx * dx + cz * dz), c = cx * cx + cz * cz - r * r, disc = b * b - dl2 * c;
        if (disc < 0) continue;
        const sq = Math.sqrt(disc);
        for (const t of [(b - sq) / dl2, (b + sq) / dl2]) {
          if (t <= 0 || t >= best) continue;
          const y = oy + dy * t;
          if (y >= a.y && y <= a.y + hgt) { best = t; hit = { t, actor: a, head: false }; break; }
        }
      }
      return hit;
    }
    // shooter: 'player' or actor
    bullet(shooter, ox, oy, oz, dir, dmg, pierce, hitPow, visual) {
      const ign = shooter === 'player' ? null : shooter;
      const h = this.trace(ox, oy, oz, dir[0], dir[1], dir[2], 250, ign);
      // bullets aimed at the player
      let pt = null;
      if (shooter !== 'player' && !this.player.dead) {
        const p = this.player, cx = p.x - ox, cz = p.z - oz, dl2 = dir[0] * dir[0] + dir[2] * dir[2];
        const b = cx * dir[0] + cz * dir[2], c = cx * cx + cz * cz - 0.3 * 0.3, disc = b * b - dl2 * c;
        if (disc > 0 && dl2 > 1e-9) { const t = (b - Math.sqrt(disc)) / dl2, y = oy + dir[1] * t; if (t > 0 && (!h || t < h.t) && y > p.y && y < p.y + p.h + 0.1) pt = { t, head: y > p.y + p.h - 0.25 }; }
      }
      const end = pt ? pt.t : h ? h.t : 120;
      const ex = ox + dir[0] * end, ey = oy + dir[1] * end, ez = oz + dir[2] * end;
      if (visual) this.emit({ t: 'tracer', a: [ox + dir[0] * 0.8, oy + dir[1] * 0.8 - 0.05, oz + dir[2] * 0.8], b: [ex, ey, ez], enemy: shooter !== 'player' });
      if (pt) {
        const falloff = end > 60 ? 0.75 : 1;
        this.hurtPlayer(dmg * falloff * (pt.head ? 1.5 : 1) * (1 - pierce * 0.3), 'bullet', shooter);
        this.emit({ t: 'sound', s: 'hitflesh', x: ex, y: ey, z: ez, vol: 0.6 });
        return;
      }
      if (!h) return;
      if (h.actor) {
        const a = h.actor, falloff = end > 60 ? 0.75 : 1;
        let d = dmg * falloff * (h.head ? (a.kind === 'human' ? 2.6 : 1.8) : 1);
        if (a.kind === 'human' && a.suit) { const pr = (IT[a.suit] ? IT[a.suit].prot.bullet : 0); d *= 1 - pr * (1 - pierce); }
        S.damageActor(this, a, d, 'bullet', shooter, dir, hitPow);
        this.emit({ t: 'blood', x: ex, y: ey, z: ez, n: h.head ? 8 : 5 });
      } else {
        const surf = h.terrain ? 'dirt' : (h.box && /metal|rust|tin|btr|wire/.test(h.box.tex) ? 'metal' : h.box && /planks|logs|wood/.test(h.box.tex) ? 'wood' : 'concrete');
        this.emit({ t: 'impact', x: ex, y: ey, z: ez, n: h.n, surf });
      }
      // near misses make actors react (suppression)
      if (shooter === 'player') for (const a of this.actors) if (!a.dead && !a.hidden && a.kind === 'human') { const d = S.pointLineDist(a.x, a.y + 1.2, a.z, ox, oy, oz, ex, ey, ez); if (d < 2.5) S.alertActor(this, a, this.player.x, this.player.z, 'shot'); }
    }
    knifeAttack() {
      const p = this.player, f = this.forward();
      const h = this.trace(p.x, this.eye, p.z, f[0], f[1], f[2], IT.knife.range, null);
      this.emit({ t: 'fire', w: 'knife' });
      if (h && h.actor) { S.damageActor(this, h.actor, IT.knife.dmg * (h.head ? 1.5 : 1), 'knife', 'player', f, 1); this.emit({ t: 'blood', x: p.x + f[0] * h.t, y: this.eye + f[1] * h.t, z: p.z + f[2] * h.t, n: 6 }); this.emit({ t: 'sound', s: 'knifehit' }); }
      else if (h) this.emit({ t: 'sound', s: 'knifewall' });
    }
    throwThing(kind) {
      const p = this.player, f = this.forward(), sp = kind === 'bolt' ? 14 : 13;
      this.projs.push({ kind, x: p.x + f[0] * 0.5, y: this.eye + f[1] * 0.5 - 0.1, z: p.z + f[2] * 0.5, vx: f[0] * sp + p.vx * 0.5, vy: f[1] * sp + 2.5, vz: f[2] * sp + p.vz * 0.5, t: 0, fuse: kind === 'bolt' ? 8 : IT[kind].fuse, owner: 'player', rot: 0 });
      this.emit({ t: 'sound', s: 'throw' }); this.emit({ t: 'fire', w: kind });
    }
    // an NPC throws a grenade toward a point
    npcThrow(a, tx, tz, kind = 'rgd5') {
      const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz), tFlight = clamp(d / 14, 0.6, 1.8);
      const ty = this.W.groundAt(tx, tz, 0.2);
      this.projs.push({ kind, x: a.x, y: a.y + 1.6, z: a.z, vx: dx / tFlight, vy: (ty - a.y - 1.6) / tFlight + 0.5 * 20 * tFlight, vz: dz / tFlight, t: 0, fuse: IT[kind].fuse, owner: a, rot: 0 });
      this.emit({ t: 'sound', s: 'throw', x: a.x, y: a.y + 1.5, z: a.z });
    }
    updateProjectiles() {
      const W = this.W;
      for (const pr of this.projs) {
        pr.t += DT; pr.rot += DT * 10;
        pr.vy -= 20 * DT;
        const dx = pr.vx * DT, dy = pr.vy * DT, dz = pr.vz * DT, len = Math.hypot(dx, dy, dz);
        if (len > 1e-6) {
          const h = W.ray(pr.x, pr.y, pr.z, dx / len, dy / len, dz / len, len + 0.05, true);
          if (h) {
            pr.x += dx / len * Math.max(0, h.t - 0.05); pr.y += dy / len * Math.max(0, h.t - 0.05); pr.z += dz / len * Math.max(0, h.t - 0.05);
            const n = h.n, vn = pr.vx * n[0] + pr.vy * n[1] + pr.vz * n[2];
            pr.vx = (pr.vx - 2 * vn * n[0]) * 0.45; pr.vy = (pr.vy - 2 * vn * n[1]) * 0.35; pr.vz = (pr.vz - 2 * vn * n[2]) * 0.45;
            if (Math.abs(vn) > 2) this.emit({ t: 'sound', s: pr.kind === 'bolt' ? 'bolt' : 'nadebounce', x: pr.x, y: pr.y, z: pr.z, vol: 0.6 });
            if (n[1] > 0.6 && Math.hypot(pr.vx, pr.vy, pr.vz) < 1) { pr.vx = pr.vy = pr.vz = 0; pr.rest = true; }
          } else { pr.x += dx; pr.y += dy; pr.z += dz; }
        }
        // bolts set off anomalies
        if (pr.kind === 'bolt') for (const a of this.anomalies) if (a.state === 'idle' && a.cd <= 0 && Math.hypot(a.x - pr.x, a.z - pr.z) < a.r && pr.y - a.y < 2.5) this.triggerAnomaly(a);
        pr.fuse -= DT;
        if (pr.fuse <= 0) { if (pr.kind !== 'bolt') this.explode(pr); pr.dead = true; }
      }
      this.projs = this.projs.filter(p => !p.dead);
    }
    explode(pr) {
      const d = IT[pr.kind], R = d.radius, x = pr.x, y = pr.y + 0.2, z = pr.z;
      this.emit({ t: 'explosion', x, y, z, r: R });
      this.emit({ t: 'sound', s: 'explosion', x, y, z, vol: 1.4 });
      this.noise(x, z, 150, pr.owner === 'player' ? 'player' : null);
      const p = this.player, dp = Math.hypot(p.x - x, p.y + 1 - y, p.z - z);
      if (dp < R && this.W.los(x, y, z, p.x, p.y + 1, p.z)) { this.hurtPlayer(d.dmg * Math.pow(1 - dp / R, 1.3), 'explosion', null, Math.atan2(x - p.x, z - p.z)); p.vx += (p.x - x) / (dp + 0.5) * 5; p.vy += 3; p.vz += (p.z - z) / (dp + 0.5) * 5; }
      for (const a of this.actors) {
        if (a.dead || a.hidden) continue;
        const da = Math.hypot(a.x - x, a.y + 0.8 - y, a.z - z); if (da >= R) continue;
        if (!this.W.los(x, y, z, a.x, a.y + 0.9, a.z)) continue;
        S.damageActor(this, a, d.dmg * Math.pow(1 - da / R, 1.3), 'explosion', pr.owner, [(a.x - x) / (da + 0.1), 0.5, (a.z - z) / (da + 0.1)], 3);
      }
      // grenades also set off anomalies
      for (const a of this.anomalies) if (Math.hypot(a.x - x, a.z - z) < a.r + 2 && a.state === 'idle' && a.cd <= 0) this.triggerAnomaly(a);
    }
    // loud noises alert actors in range
    noise(x, z, r, src) {
      for (const a of this.actors) {
        if (a.dead || a.hidden) continue;
        const d = Math.hypot(a.x - x, a.z - z); if (d > r) continue;
        S.alertActor(this, a, x, z, src === 'player' ? 'shot' : 'noise');
      }
    }

    // ================================================================ anomalies
    triggerAnomaly(a) {
      if (a.state !== 'idle' || a.cd > 0) return;
      const A = D.ANOMALIES[a.type]; if (A.cd === 0) return;
      a.state = 'charge'; a.t = A.delay;
      this.emit({ t: 'anom', type: a.type, x: a.x, y: a.y, z: a.z, phase: 'charge' });
      this.sound('an_' + a.type + '_charge', a.x, a.y + 0.5, a.z, 0.8);
    }
    updateAnomalies() {
      const p = this.player, W = this.W;
      let near = Infinity, nearArt = Infinity;
      const bodies = [];
      if (!p.dead) bodies.push({ o: p, player: true });
      for (const a of this.actors) if (!a.dead && !a.hidden) bodies.push({ o: a, player: false });
      for (const an of this.anomalies) {
        const A = D.ANOMALIES[an.type];
        const dpl = Math.hypot(p.x - an.x, p.z - an.z); if (dpl - an.r < near) near = dpl - an.r;
        if (an.cd > 0) an.cd -= DT;
        an.t -= DT;
        if (an.type === 'acid') {
          for (const b of bodies) { const o = b.o, d = Math.hypot(o.x - an.x, o.z - an.z); if (d < an.r && o.y - an.y < 1) { if (b.player) { this.hurtPlayer(A.dmg * DT, 'chem', null); this.acidT = (this.acidT || 0) - DT; if (this.acidT <= 0) { this.acidT = 0.5; this.sound('an_acid', an.x, an.y, an.z, 0.6); } } else S.damageActor(this, o, A.dmg * DT, 'chem', null, null, 0); } }
          continue;
        }
        if (an.state === 'idle' && an.cd <= 0) {
          for (const b of bodies) { const o = b.o; if (Math.hypot(o.x - an.x, o.z - an.z) < an.r * 0.85 && o.y - an.y < 2.2) { this.triggerAnomaly(an); break; } }
        } else if (an.state === 'charge') {
          if (an.type === 'whirligig') for (const b of bodies) { const o = b.o, dx = an.x - o.x, dz = an.z - o.z, d = Math.hypot(dx, dz); if (d < an.r * 1.2 && d > 0.2) { const k = 7 * DT * (1 - d / (an.r * 1.2)); if (b.player) { o.vx += dx / d * k * 6; o.vz += dz / d * k * 6; } else { o.x += dx / d * k; o.z += dz / d * k; } } }
          if (an.t <= 0) {
            an.state = 'fire'; an.t = an.type === 'burner' ? 1.2 : 0.35;
            this.emit({ t: 'anom', type: an.type, x: an.x, y: an.y, z: an.z, phase: 'fire' });
            this.sound('an_' + an.type, an.x, an.y + 0.5, an.z, 1.2);
            if (an.type !== 'burner') this.anomalyHit(an, A, bodies, 1);
          }
        } else if (an.state === 'fire') {
          if (an.type === 'burner') this.anomalyHit(an, A, bodies, DT);
          if (an.t <= 0) { an.state = 'idle'; an.cd = A.cd; }
        }
      }
      for (const it of this.items) if (IT[it.id] && IT[it.id].kind === 'art') { const d = Math.hypot(p.x - it.x, p.z - it.z); if (d < nearArt) nearArt = d; }
      this.detector = { anomaly: near, art: nearArt };
    }
    anomalyHit(an, A, bodies, k) {
      for (const b of bodies) {
        const o = b.o, dx = o.x - an.x, dz = o.z - an.z, d = Math.hypot(dx, dz);
        if (d > an.r * 1.15 || o.y - an.y > 3) continue;
        const f = an.type === 'burner' ? 1 : clamp(1.2 - d / an.r, 0.3, 1);
        const dmg = A.dmg * f * k;
        if (b.player) {
          this.hurtPlayer(dmg, A.type, null, Math.atan2(an.x - o.x, an.z - o.z));
          if (an.type === 'springboard' || an.type === 'whirligig') { const l = d || 1; o.vx += dx / l * 7; o.vz += dz / l * 7; o.vy = an.type === 'whirligig' ? 9 : 6.5; o.ground = false; }
        } else {
          S.damageActor(this, o, dmg * (an.type === 'whirligig' ? 2 : 1), A.type, null, [dx / (d || 1), 1, dz / (d || 1)], 3);
          if (an.type === 'springboard') { o.vy = 5; }
        }
      }
      // loose items get tossed or destroyed
      for (const pr of this.projs) if (Math.hypot(pr.x - an.x, pr.z - an.z) < an.r) { pr.vy += 6; pr.vx += (pr.x - an.x) * 2; pr.vz += (pr.z - an.z) * 2; }
    }

    // ================================================================ focus & interaction
    updateFocus() {
      const p = this.player, f = this.forward(), ex = p.x, ey = this.eye, ez = p.z;
      let best = null, bd = 2.6;
      const wh = this.W.ray(ex, ey, ez, f[0], f[1], f[2], 3, true); const wall = wh ? wh.t : 3;
      const consider = (kind, o, x, y, z, rad) => {
        const vx = x - ex, vy = y - ey, vz = z - ez, t = vx * f[0] + vy * f[1] + vz * f[2]; if (t < 0 || t > bd + rad || t > wall + rad) return;
        const px = ex + f[0] * t - x, py = ey + f[1] * t - y, pz = ez + f[2] * t - z; if (Math.hypot(px, py, pz) > rad) return;
        const dd = Math.hypot(vx, vy, vz); if (dd < bd + rad) { bd = Math.max(0, dd - rad); best = { kind, o }; }
      };
      for (const a of this.actors) {
        if (a.hidden) continue;
        const d = Math.hypot(a.x - p.x, a.z - p.z); if (d > 4) continue;
        if (a.dead) { consider('body', a, a.x, a.y + 0.3, a.z, 0.8); continue; }
        if (a.kind !== 'human') continue;
        if (this.attitudeOf(a, 'player') < 0 && !a.wounded) continue;
        consider(a.wounded ? 'wounded' : 'talk', a, a.x, a.y + (a.wounded ? 0.4 : 1.2), a.z, a.wounded ? 0.7 : 0.55);
      }
      for (const it of this.items) { if (Math.abs(it.x - p.x) > 3 || Math.abs(it.z - p.z) > 3) continue; consider('item', it, it.x, it.y + 0.15, it.z, 0.35); }
      for (const s of this.stashes) { if (Math.abs(s.x - p.x) > 3 || Math.abs(s.z - p.z) > 3) continue; consider('stash', s, s.x, s.y + 0.3, s.z, 0.6); }
      this.focus = best;
    }
    useFocus() {
      const fo = this.focus; if (!fo) return;
      if (fo.kind === 'item') this.pickUp(fo.o);
      else if (fo.kind === 'stash') { fo.o.opened = true; if (fo.o.hidden && !fo.o.found) { fo.o.found = true; this.stats.stashes++; this.stats.rating += 15; } this.emit({ t: 'loot', target: fo.o, kind: 'stash' }); this.emit({ t: 'sound', s: 'stash' }); }
      else if (fo.kind === 'body') { this.emit({ t: 'loot', target: fo.o, kind: 'body' }); this.emit({ t: 'sound', s: 'cloth' }); }
      else if (fo.kind === 'talk' || fo.kind === 'wounded') this.emit({ t: 'dialog', actor: fo.o });
    }
    pickUp(it) {
      const k = this.items.indexOf(it); if (k < 0) return false;
      const d = IT[it.id];
      this.items.splice(k, 1);
      const clean = Object.assign({}, it); delete clean.x; delete clean.y; delete clean.z; delete clean.ph;
      if (d.kind === 'ammo') this.addAmmo(it.id, it.n); else { this.inv.push(clean); this.autoSlot(clean); }
      if (d.kind === 'art' && !it.counted) { this.stats.arts++; this.stats.rating += 25; clean.counted = true; }
      this.emit({ t: 'pickup', id: it.id, name: this.L(d.name) });
      if (S.QUESTS && S.QUESTS.onPickup) S.QUESTS.onPickup(this, it.id);
      return true;
    }
    // loot: container is a stash or a dead actor; returns true if moved
    lootTake(cont, uid) {
      const list = cont.items || cont.inv; const k = list.findIndex(i => i.uid === uid); if (k < 0) return false;
      const it = list[k]; list.splice(k, 1);
      if (cont.weaponUid === uid) cont.weaponUid = null;
      if (IT[it.id].kind === 'ammo') this.addAmmo(it.id, it.n); else { this.inv.push(it); this.autoSlot(it); }
      if (IT[it.id].kind === 'art' && !it.counted) { this.stats.arts++; it.counted = true; }
      if (cont.money && false) void 0;
      if (IT[it.id].id === 'pda' && S.QUESTS && S.QUESTS.onPda) S.QUESTS.onPda(this, it, cont);
      if (S.QUESTS && S.QUESTS.onPickup) S.QUESTS.onPickup(this, it.id);
      this.emit({ t: 'sound', s: 'pickup' });
      return true;
    }
    lootAll(cont) {
      const list = (cont.items || cont.inv).slice();
      for (const it of list) this.lootTake(cont, it.uid);
      if (cont.money) { this.money += cont.money; this.msg(`+${cont.money} RU`, '#e0d070'); cont.money = 0; }
    }
    lootMoney(cont) { if (cont.money) { this.money += cont.money; this.msg(`+${cont.money} RU`, '#e0d070'); cont.money = 0; this.emit({ t: 'sound', s: 'money' }); } }
    // put an item into a container (stash)
    lootPut(cont, uid) { const it = this.item(uid); if (!it || IT[it.id].noDrop || IT[it.id].kind === 'quest') return false; this.removeItem(uid); (cont.items || cont.inv).push(it); return true; }

    // ================================================================ trade
    traderOf(actor) { return S.QUESTS && S.QUESTS.TRADERS ? S.QUESTS.TRADERS[actor.trade] : null; }
    buyPrice(id, cond, tr) { const d = IT[id]; const k = (d.kind === 'weapon' || d.kind === 'suit') ? 0.4 + 0.6 * (cond == null ? 1 : cond) : 1; return Math.max(5, Math.round(d.cost * (tr ? tr.sellMul : 1.2) * k * (d.kind === 'ammo' ? 1 : 1))); }
    sellPrice(it, tr) {
      const d = IT[it.id]; if (d.kind === 'quest' || d.noDrop) return 0;
      let k = tr ? tr.buyMul : 0.4; if (d.kind === 'art') k = tr ? tr.artMul : 0.6; if (d.kind === 'part') k = 0.75;
      if (d.kind === 'weapon' || d.kind === 'suit') k *= Math.max(0.1, it.cond) * 0.9;
      if (d.kind === 'ammo') k *= it.n / d.box;
      return Math.max(1, Math.round(d.cost * k));
    }
    buy(tr, entry) {
      const price = this.buyPrice(entry.id, entry.cond, tr);
      if (this.money < price) { this.msg(D.STR[this.lang].notEnough, '#ff8060'); return false; }
      this.money -= price; tr.money = (tr.money || 0) + price;
      const d = IT[entry.id];
      if (d.kind === 'ammo') this.addAmmo(entry.id, d.box); else this.addItem({ id: entry.id, cond: entry.cond == null ? 1 : entry.cond, mag: 0 });
      if (entry.n != null) { entry.n--; if (entry.n <= 0) tr.stock.splice(tr.stock.indexOf(entry), 1); }
      this.emit({ t: 'sound', s: 'money' });
      return true;
    }
    sell(tr, uid) {
      const it = this.item(uid); if (!it) return false; const price = this.sellPrice(it, tr);
      if (price <= 0) { this.msg(D.T('Торговец это не купит', 'The trader won\'t buy this'), '#ff8060'); return false; }
      if ((tr.money || 0) < price) { this.msg(D.STR[this.lang].traderPoor, '#ff8060'); return false; }
      if (this.isEquipped(uid) && IT[it.id].kind !== 'art') this.unequip(uid);
      if (it.mag) { this.addAmmo(it.ammo, it.mag); it.mag = 0; }
      this.removeItem(uid); this.money += price; tr.money -= price;
      if (IT[it.id].kind === 'art' || IT[it.id].kind === 'part' || IT[it.id].kind === 'weapon') tr.stock.push({ id: it.id, cond: it.cond, n: 1, resale: true });
      this.emit({ t: 'sound', s: 'money' });
      if (S.QUESTS && S.QUESTS.onSell) S.QUESTS.onSell(this, it.id);
      return true;
    }

    // ================================================================ zones, exits
    updateZones() {
      const p = this.player;
      for (const z of this.def.zones) {
        const inn = this.inRect(z, p.x, p.z);
        if (inn && !this.zoneIn[z.id]) { this.zoneIn[z.id] = true; if (S.QUESTS && S.QUESTS.onZone) S.QUESTS.onZone(this, z.id); }
        else if (!inn && this.zoneIn[z.id]) this.zoneIn[z.id] = false;
      }
      let ex = null; for (const e of this.def.exits) if (this.inRect(e, p.x, p.z)) ex = e;
      if (ex && this.exitIn !== ex.id && !p.dead) this.emit({ t: 'exitPrompt', exit: ex });
      this.exitIn = ex ? ex.id : null;
    }

    // ================================================================ save / load
    serialize() {
      const states = Object.assign({}, this.levelStates); states[this.levelId] = this.snapshot();
      const p = this.player;
      return {
        v: 1, skill: this.skill, time: this.time, realT: this.realT, level: this.levelId, uid: UID,
        player: { x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch, hp: p.hp, stamina: p.stamina, bleed: p.bleed, rad: p.rad, food: p.food },
        inv: this.inv, money: this.money, slots: this.slots, cur: this.cur,
        flags: this.flags, quests: this.quests, questOrder: this.questOrder, diary: this.diary, knownStashes: this.knownStashes, goodwill: this.goodwill, stats: this.stats, news: this.news.slice(-40),
        levels: states, weather: this.weather
      };
    }
    static deserialize(data, opt = {}) {
      const g = new Game({ empty: true, skill: data.skill, lang: opt.lang });
      UID = Math.max(UID, data.uid || 1);
      g.time = data.time; g.realT = data.realT || 0;
      g.inv = data.inv; g.money = data.money; g.slots = data.slots; g.cur = data.cur;
      g.flags = data.flags || {}; g.quests = data.quests || {}; g.questOrder = data.questOrder || Object.keys(g.quests); g.diary = data.diary || []; g.knownStashes = data.knownStashes || {};
      g.goodwill = Object.assign({}, D.GOODWILL, data.goodwill); g.stats = Object.assign(g.stats, data.stats); g.news = data.news || [];
      g.levelStates = data.levels || {}; if (data.weather) g.weather = data.weather;
      g.loadLevel(data.level, 'start', false);
      const p = g.player, sp = data.player; Object.assign(p, { x: sp.x, y: sp.y, z: sp.z, yaw: sp.yaw, pitch: sp.pitch || 0, hp: sp.hp, stamina: sp.stamina, bleed: sp.bleed, rad: sp.rad, food: sp.food });
      g.zoneIn = {}; for (const z of g.def.zones) if (g.inRect(z, p.x, p.z)) g.zoneIn[z.id] = true;
      g.exitIn = null; for (const e of g.def.exits) if (g.inRect(e, p.x, p.z)) g.exitIn = e.id;
      g.events.length = 0;
      return g;
    }
  }

  S.Game = Game; S.GAME = { DT, EYE, EYE_CROUCH, TIME_FACTOR };
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Stalker98 = globalThis.Stalker98 || {});
