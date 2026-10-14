(function (C) {
  'use strict';
  const { clamp, lerp, smoothstep, wrapAngle } = C;
  const D = C.DATA, M = C.MAP;
  const DT = 1 / 60;
  const GAME_MIN_PER_SEC = 0.2;
  const SAVE_VERSION = 2;
  const TWO_HANDED = new Set(['rifle', 'grenade']);
  const STACKS = new Set(['ammo', 'consumable', 'part', 'grenade']);
  const P = { EYE: 1.65, CROUCH_EYE: 1.05, R: 0.32, WALK: 2.7, RUN: 5.0, CROUCH: 1.4, ACCEL: 14, JUMP: 4.3, GRAV: 13, STEP: 0.55, HEIGHT: 1.8, CROUCH_H: 1.2 };

  let uidSeq = 1;
  function makeItem(id, count = 1, extra = {}) {
    const def = D.ITEMS[id];
    if (!def) throw new Error('item ' + id);
    const it = { uid: uidSeq++, id, count: 1 };
    if (def.type === 'ammo' || def.type === 'consumable' || def.type === 'part' || def.type === 'grenade') it.count = count;
    if (def.type === 'weapon') {
      const w = D.WEAPONS[id];
      it.cond = extra.cond == null ? 0.9 : extra.cond;
      it.mag = extra.mag == null ? (w.mag || 0) : extra.mag;
      it.ammoType = w.ammo ? w.ammo[0] : null;
      it.mode = 0;
      it.upg = extra.upg || [];
    }
    if (def.type === 'outfit') { it.cond = extra.cond == null ? 0.95 : extra.cond; it.upg = extra.upg || []; }
    return Object.assign(it, extra.keep || {});
  }

  function rollPool(pool, rnd) {
    const total = pool.reduce((s, [, w]) => s + w, 0);
    let r = rnd() * total;
    for (const [id, w] of pool) { r -= w; if (r <= 0) return id; }
    return pool[0][0];
  }

  class Game {
    constructor(opts = {}) {
      this.seed = opts.seed || 1999;
      this.W = opts.world || new C.World({ seed: 1999 });
      this.T = this.W.terrain;
      this.rng = C.makeRandom(opts.rngSeed || (Date.now() & 0xffffff));
      this.difficulty = opts.difficulty == null ? 1 : opts.difficulty;
      this.diff = D.DIFFICULTY[this.difficulty];
      this.events = [];
      this.log = [];
      this.pda = [];
      this.flags = {};
      this.counters = {};
      this.quests = {};
      this.rep = 0;
      this.playerRel = { stalker: 20, bandit: 0, merc: 0, zombie: -100, monster: -100 };
      this.stats = { kills: 0, mutants: 0, artifacts: 0, shots: 0, hits: 0, distance: 0, money: 0, emissions: 0, stashes: 0, deaths: 0 };
      this.time = 7 * 60 + 10;
      this.realTime = 0;
      this.tickN = 0;
      this.actors = [];
      this.items = [];
      this.projectiles = [];
      this.particles = [];
      this.tracers = [];
      this.anomalies = [];
      this.artifacts = [];
      this.usables = [];
      this.stashes = {};
      this.knownStashes = {};
      this.discovered = {};
      this.encyclopedia = {};
      this.weather = C.makeWeather('clear');
      this.emission = { phase: 'none', t: 0, next: 50 * 60, count: 0, scripted: false };
      this.dead = false;
      this.won = false;
      this.cheats = { god: false };
      this.focus = null;
      this.traderStock = {};
      this.upgradeTier = 1;
      this.nimbleOrders = [];
      this.initPlayer();
      this.initStashes();
      this.initAnomalies();
      if (C.initPopulation && !opts.skipPopulation) C.initPopulation(this);
      if (C.initStory) C.initStory(this, !!opts.skipPopulation);
      this.restock();
    }

    initPlayer() {
      const m = this.W.markers.player_start;
      this.player = {
        x: m.x, y: m.y, z: m.z, yaw: m.yaw, pitch: -0.05, vx: 0, vy: 0, vz: 0, ground: true, crouch: false,
        hp: 100, stamina: 100, bleed: 0, rad: 0, food: 80, drunk: 0, psy: 0, money: 2500,
        inv: [], slots: { knife: null, pistol: null, rifle: null, outfit: null, detector: null }, belt: [], quick: ['medkit', 'bandage', 'antirad', 'bread'],
        active: 'rifle', detectorOut: false, flashlight: false, fireCd: 0, reload: 0, reloadFor: null, switchT: 0, jammed: false, recoil: 0, bloom: 0, aim: false, aimK: 0,
        boltCd: 0, grenadeCd: 0, useCd: 0, stepT: 0, hurtT: 0, lastHurtDir: 0, zone: null, deepWarnT: 0, overT: 0, noise: 0, sleepT: 0
      };
      const p = this.player;
      const give = (id, n, extra) => { const it = makeItem(id, n, extra); p.inv.push(it); return it; };
      p.slots.knife = give('knife').uid;
      p.slots.pistol = give('pm', 1, { cond: 0.85 }).uid;
      p.slots.rifle = give('aksu', 1, { cond: 0.78 }).uid;
      p.slots.outfit = give('zarya', 1, { cond: 0.9 }).uid;
      p.slots.detector = give('otklik').uid;
      give('ammo_9x18', 40); give('ammo_5.45', 90); give('medkit', 3); give('bandage', 4); give('antirad', 2); give('bread', 2); give('conserva', 1); give('vodka', 1); give('f1', 2);
    }

    initStashes() {
      for (const s of D.STASHES) {
        const m = this.W.markers[s.marker];
        if (!m) continue;
        this.stashes[s.id] = { id: s.id, name: s.name, x: m.x, y: m.y, z: m.z, opened: false, locked: s.locked || null, items: s.items.map(([id, n]) => makeItem(id, D.ITEMS[id].type === 'ammo' ? n * D.ITEMS[id].box : n)), money: s.money };
      }
    }

    initAnomalies() {
      this.anomalies = [];
      for (const f of D.FIELDS) this.populateField(f, 0);
      this.artifacts = [];
      for (const f of D.FIELDS) this.spawnFieldArtifacts(f, true);
    }

    populateField(f, gen) {
      const rnd = C.makeRandom(C.hashInt(f.x, f.y, gen * 7919 + 13));
      const placed = [];
      let fixedIdx = 0;
      for (const [type, n] of f.list) {
        for (let k = 0; k < n; k++) {
          let x, y;
          if (f.fixed && fixedIdx < f.fixed.length) { [x, y] = f.fixed[fixedIdx++]; }
          else if (f.fixedMarker && this.W.markers[f.fixedMarker]) { const m = this.W.markers[f.fixedMarker]; x = m.x; y = m.y; }
          else {
            let tries = 0;
            do {
              const a = rnd() * C.TAU, r = Math.sqrt(rnd()) * f.r;
              x = f.x + Math.cos(a) * r; y = f.y + Math.sin(a) * r; tries++;
            } while (tries < 30 && (placed.some(p => Math.hypot(p[0] - x, p[1] - y) < 5) || (f.clear || []).some(([cx, cy, cr]) => Math.hypot(cx - x, cy - y) < cr) || this.T.heightAt(x, y) < -0.6));
          }
          placed.push([x, y]);
          const T = D.ANOMALY_TYPES[type];
          const m = f.fixedMarker ? this.W.markers[f.fixedMarker] : null;
          const z = m ? m.z : f.z != null ? f.z : Math.max(this.T.heightAt(x, y), 0);
          this.anomalies.push({ id: f.id + '_' + placed.length, field: f.id, type, x, y, z, radius: T.radius, trigger: T.trigger, state: 'idle', t: 0, cool: 0, phase: rnd() * 10 });
        }
      }
    }

    spawnFieldArtifacts(f, initial) {
      if (!f.arts) return;
      if (!initial && f.noRespawn) return;
      const rnd = this.rng;
      const existing = this.artifacts.filter(a => a.field === f.id && !a.taken).length;
      const want = f.arts - existing;
      const anoms = this.anomalies.filter(a => a.field === f.id);
      for (let k = 0; k < want; k++) {
        let x, y;
        if (f.artifactAt && initial) [x, y] = f.artifactAt;
        else {
          const base = anoms.length ? anoms[Math.floor(rnd() * anoms.length)] : { x: f.x, y: f.y, trigger: 2 };
          const a = rnd() * C.TAU, r = base.trigger + 0.6 + rnd() * 2.5;
          x = base.x + Math.cos(a) * r; y = base.y + Math.sin(a) * r;
        }
        const id = f.artifact && initial ? f.artifact : rollPool(D.ARTIFACT_POOLS[f.pool], rnd);
        const g = this.W.groundAt(x, y, f.z != null ? f.z + 0.4 : this.T.heightAt(x, y) + 0.4).h;
        this.artifacts.push({ uid: uidSeq++, id, field: f.id, x, y, z: Math.max(g, 0.05) + 0.25, visible: false, taken: false, bob: rnd() * 6 });
      }
    }

    spawnSpecialArtifact(id, x, y, extra = {}) {
      const a = Object.assign({ uid: uidSeq++, id, field: 'special', x, y, z: Math.max(this.T.heightAt(x, y), 0.05) + 0.3, visible: false, taken: false, bob: 0 }, extra);
      this.artifacts.push(a);
      return a;
    }

    restock() {
      for (const [tid, tr] of Object.entries(D.TRADERS)) {
        const stock = [];
        for (const [id, n] of tr.stock) {
          const def = D.ITEMS[id];
          const cnt = Math.max(1, Math.round(n * (0.6 + this.rng() * 0.6)));
          if (def.type === 'ammo') stock.push(makeItem(id, cnt * def.box));
          else if (def.type === 'consumable' || def.type === 'grenade') stock.push(makeItem(id, cnt));
          else for (let k = 0; k < Math.min(cnt, 2); k++) stock.push(makeItem(id, 1, { cond: 0.95 }));
        }
        this.traderStock[tid] = stock;
      }
    }

    emit(ev) { this.events.push(ev); }
    msg(text, color = '#e8e0b0') { this.emit({ type: 'msg', text, color }); this.log.push({ t: this.time, text }); if (this.log.length > 200) this.log.shift(); }
    news(from, text, important = false) {
      const e = { t: this.time, from, text, important };
      this.pda.push(e); if (this.pda.length > 120) this.pda.shift();
      this.emit({ type: 'news', from, text, important });
    }
    flag(k) { return !!this.flags[k]; }
    setFlag(k, v = true) { this.flags[k] = v; }
    count(k) { return this.counters[k] || 0; }
    addCount(k, n = 1) { this.counters[k] = (this.counters[k] || 0) + n; return this.counters[k]; }
    hour() { return (this.time / 60) % 24; }
    day() { return Math.floor(this.time / 1440) + 1; }
    isNight() { const h = this.hour(); return h < 5.5 || h > 21; }
    sound(name, x, y, z, vol = 1, extra = {}) { this.emit(Object.assign({ type: 'sound', name, x, y, z, vol }, extra)); }
    sound2d(name, vol = 1) { this.emit({ type: 'sound', name, vol, ui: true }); }

    item(uid) { return this.player.inv.find(i => i.uid === uid) || null; }
    slotItem(slot) { const u = this.player.slots[slot]; return u ? this.item(u) : null; }
    outfit() { const it = this.slotItem('outfit'); return it ? it : null; }
    outfitStats() {
      const it = this.outfit();
      const base = Object.assign({}, D.OUTFITS[it ? it.id : 'none']);
      if (it) for (const u of it.upg || []) { const up = D.UPGRADES.outfit.find(q => q.id === u); if (up) for (const [k, v] of Object.entries(up.fx)) base[k] = (base[k] || 0) + v; }
      if (it) { const k = 0.4 + it.cond * 0.6; base.armor *= k; }
      for (const a of this.beltArtifacts()) {
        const fx = D.ARTIFACTS[a.id].fx;
        if (fx.armor) base.armor += fx.armor;
        for (const k of ['burn', 'shock', 'chem']) if (fx[k]) base[k] = (base[k] || 0) + fx[k];
        if (fx.carry) base.carry += fx.carry;
      }
      return base;
    }
    beltArtifacts() { return this.player.belt.map(u => this.item(u)).filter(Boolean); }
    beltSlots() { const it = this.outfit(); let n = D.OUTFITS[it ? it.id : 'none'].belt; if (it) for (const u of it.upg || []) { const up = D.UPGRADES.outfit.find(q => q.id === u); if (up && up.fx.belt) n += up.fx.belt; } return n; }
    maxWeight() { return 50 + this.outfitStats().carry; }
    itemWeight(it) {
      const def = D.ITEMS[it.id];
      if (def.type === 'ammo') return D.AMMO[def.caliber].weight * it.count;
      if (def.type === 'weapon') { const w = D.WEAPONS[it.id]; return def.weight + (w.ammo ? D.AMMO[it.ammoType].weight * it.mag : 0); }
      if (def.type === 'outfit') { let w = def.weight; for (const u of it.upg || []) { const up = D.UPGRADES.outfit.find(q => q.id === u); if (up && up.fx.weight) w += up.fx.weight; } return Math.max(0.5, w); }
      return (def.weight || 0) * (it.count || 1);
    }
    totalWeight() { return this.player.inv.reduce((s, it) => s + this.itemWeight(it), 0); }

    countItem(id) { return this.player.inv.filter(i => i.id === id).reduce((s, i) => s + (i.count || 1), 0); }
    hasItem(id, n = 1) { return this.countItem(id) >= n; }
    addItem(id, count = 1, extra = {}) {
      const def = D.ITEMS[id];
      const stack = ['ammo', 'consumable', 'part', 'grenade'].includes(def.type);
      if (stack) {
        const ex = this.player.inv.find(i => i.id === id);
        if (ex) { ex.count += count; return ex; }
      }
      const it = makeItem(id, count, extra);
      this.player.inv.push(it);
      if (def.type === 'quest') this.emit({ type: 'questItem', id });
      return it;
    }
    addInstance(it) {
      const def = D.ITEMS[it.id];
      if (['ammo', 'consumable', 'part', 'grenade'].includes(def.type)) return this.addItem(it.id, it.count);
      this.player.inv.push(it);
      if (def.type === 'quest') this.emit({ type: 'questItem', id: it.id });
      return it;
    }
    removeItem(id, count = 1) {
      const p = this.player;
      let left = count;
      for (const it of p.inv.slice()) {
        if (it.id !== id || left <= 0) continue;
        const n = it.count || 1;
        if (n > left) { it.count -= left; left = 0; }
        else { left -= n; this.dropFromSlots(it.uid); p.inv.splice(p.inv.indexOf(it), 1); }
      }
      return left === 0;
    }
    removeInstance(it, count) {
      const p = this.player;
      if (count && it.count > count) { it.count -= count; return makeItem(it.id, count); }
      this.dropFromSlots(it.uid);
      const i = p.inv.indexOf(it);
      if (i >= 0) p.inv.splice(i, 1);
      return it;
    }
    dropFromSlots(uid) {
      const p = this.player;
      for (const k in p.slots) if (p.slots[k] === uid) p.slots[k] = null;
      p.belt = p.belt.filter(u => u !== uid);
    }

    equip(it) {
      const def = D.ITEMS[it.id], p = this.player;
      if (def.type === 'weapon') { const slot = D.WEAPONS[it.id].slot; p.slots[slot] = it.uid; p.active = slot; p.reload = 0; p.switchT = 0.5; p.holstered = null; if (TWO_HANDED.has(slot)) p.detectorOut = false; this.sound2d('equip'); return true; }
      if (def.type === 'outfit') {
        p.slots.outfit = it.uid;
        while (p.belt.length > this.beltSlots()) p.belt.pop();
        this.sound2d('cloth'); return true;
      }
      if (def.type === 'detector') { p.slots.detector = it.uid; this.sound2d('equip'); return true; }
      if (def.type === 'artifact') {
        if (p.belt.includes(it.uid)) { p.belt = p.belt.filter(u => u !== it.uid); return true; }
        if (p.belt.length >= this.beltSlots()) { this.msg('Нет свободных контейнеров на поясе.', '#e0a060'); return false; }
        p.belt.push(it.uid); this.sound2d('equip'); return true;
      }
      if (def.type === 'consumable') return this.useConsumable(it.id);
      return false;
    }
    unequip(slot) { this.player.slots[slot] = null; if (this.player.active === slot) this.player.active = 'knife'; }

    useConsumable(id) {
      const p = this.player, c = D.CONSUMABLES[id];
      if (!c || !this.hasItem(id)) return false;
      this.removeItem(id, 1);
      const u = c.use;
      if (u.health) p.healT = (p.healT || 0) + u.health;
      if (u.bleed) p.bleed = Math.max(0, p.bleed + u.bleed * 3);
      if (u.rad) p.radCure = (p.radCure || 0) - u.rad;
      if (u.food) p.food = clamp(p.food + u.food, 0, 100);
      if (u.stamina) p.stamina = clamp(p.stamina + u.stamina, 0, 100);
      if (u.drunk) p.drunk = clamp(p.drunk + u.drunk, 0, 100);
      this.sound2d(id === 'vodka' ? 'drink' : ['bread', 'sausage', 'conserva'].includes(id) ? 'eat' : id === 'energy' ? 'drink' : 'medkit');
      this.msg('Использовано: ' + c.name, '#b8d8a0');
      return true;
    }

    useQuick(i) {
      const id = this.player.quick[i];
      if (!id) return;
      if (!this.hasItem(id)) { this.msg('Нет предмета: ' + D.ITEMS[id].name, '#e0a060'); return; }
      this.useConsumable(id);
    }

    weaponStats(it) {
      const w = D.WEAPONS[it.id];
      const s = Object.assign({}, w);
      for (const u of it.upg || []) {
        const up = D.UPGRADES.weapon.find(q => q.id === u);
        if (!up) continue;
        for (const [k, v] of Object.entries(up.fx)) {
          if (k === 'mag') s.mag = Math.round(s.mag * v);
          else if (k === 'wear') s.wear = v;
          else s[k] = (s[k] || 0) * v;
        }
      }
      s.wear = s.wear || 1;
      return s;
    }

    activeWeapon() {
      const p = this.player;
      if (p.active === 'knife' || p.active === 'pistol' || p.active === 'rifle') return this.slotItem(p.active);
      return null;
    }

    selectSlot(slot) {
      const p = this.player;
      if (slot === p.active) { this.toggleHolster(); return; }
      if ((slot === 'pistol' || slot === 'rifle' || slot === 'knife') && !p.slots[slot]) return;
      if (slot === 'grenade' && !this.hasItem('f1')) { this.msg('Нет гранат.', '#e0a060'); return; }
      p.active = slot; p.reload = 0; p.switchT = 0.45; p.aim = false; p.holstered = null;
      if (TWO_HANDED.has(slot)) p.detectorOut = false;
      this.sound2d('equip');
    }

    toggleHolster() {
      const p = this.player;
      if (p.active !== 'none') {
        p.lastWeapon = p.active; p.active = 'none'; p.holstered = null;
        p.reload = 0; p.aim = false; p.switchT = 0.3;
        this.sound2d('equip', 0.6);
        return;
      }
      const usable = s => s === 'grenade' ? this.hasItem('f1') : !!p.slots[s];
      const next = [p.lastWeapon, 'rifle', 'pistol', 'knife'].find(s => s && usable(s));
      if (next) this.selectSlot(next);
    }

    toggleDetector() {
      const p = this.player;
      if (!p.slots.detector) { p.detectorOut = false; this.msg('Нет детектора.', '#e0a060'); return; }
      p.detectorOut = !p.detectorOut;
      this.sound2d('equip', 0.5);
      if (p.detectorOut && TWO_HANDED.has(p.active)) {
        p.holstered = p.active; p.active = 'none'; p.reload = 0; p.aim = false; p.switchT = 0.3;
      } else if (!p.detectorOut && p.active === 'none' && p.holstered) this.selectSlot(p.holstered);
    }

    eyeZ() { return this.player.z + (this.player.crouch ? P.CROUCH_EYE : P.EYE); }
    aimDir(extraYaw = 0, extraPitch = 0) {
      const p = this.player, yaw = p.yaw + extraYaw, pitch = clamp(p.pitch + extraPitch, -1.3, 1.3);
      const cp = Math.cos(pitch);
      return [Math.cos(yaw) * cp, Math.sin(yaw) * cp, Math.sin(pitch)];
    }

    inShelter() { const z = this.player.zone; return !!(z && z.shelter); }
    inSafeZone() { const z = this.player.zone; return !!(z && z.safe); }

    relation(a, b) {
      if (a === b) return 100;
      if (a === 'player') return this.playerRel[b] == null ? 0 : this.playerRel[b];
      if (b === 'player') return this.playerRel[a] == null ? 0 : this.playerRel[a];
      return (D.RELATIONS[a] && D.RELATIONS[a][b] != null) ? D.RELATIONS[a][b] : 0;
    }
    hostileToPlayer(a) {
      if (a.dead) return false;
      if (a.angry) return true;
      if (a.friendly) return false;
      return this.relation(a.faction, 'player') <= -50;
    }
    changeRelation(faction, delta) { if (faction in this.playerRel) this.playerRel[faction] = clamp(this.playerRel[faction] + delta, -100, 100); }

    tick(input = {}) {
      if (this.dead || this.won) { this.realTime += DT; return; }
      this.tickN++;
      this.realTime += DT;
      const sleepMul = this.player.sleepT > 0 ? 120 : 1;
      this.time += DT * GAME_MIN_PER_SEC * sleepMul;
      this.updatePlayer(input);
      this.updateWeapon(input);
      this.updateStatus();
      this.updateProjectiles();
      this.updateAnomalies();
      this.updateArtifacts();
      this.updateEmission();
      this.updateWeather();
      if (this.updateActors) this.updateActors();
      if (this.updateStory) this.updateStory();
      this.updateParticles();
      this.updateFocus();
      if (input.use) this.interact();
      if (input.quick != null) this.useQuick(input.quick);
      if (this.player.sleepT > 0) { this.player.sleepT -= DT * sleepMul * GAME_MIN_PER_SEC; if (this.player.sleepT <= 0) { this.player.sleepT = 0; this.msg('Вы проснулись. ' + C.formatClock(this.time), '#c8d8e8'); this.emit({ type: 'wake' }); } }
    }

    updatePlayer(input) {
      const p = this.player, W = this.W;
      if (p.sleepT > 0) return;
      if (input.lookX) p.yaw = wrapAngle(p.yaw + input.lookX);
      if (input.lookY) p.pitch = clamp(p.pitch + input.lookY, -1.35, 1.35);
      if (p.drunk > 0) { p.yaw += Math.sin(this.realTime * 1.3) * p.drunk * 0.00012; p.pitch += Math.cos(this.realTime * 0.9) * p.drunk * 0.00008; }
      const wantCrouch = !!input.crouch;
      if (!wantCrouch && p.crouch) { const ceil = W.ceilingAt(p.x, p.y, p.z + 0.5); if (ceil > p.z + P.HEIGHT) p.crouch = false; }
      else p.crouch = wantCrouch;
      const fx = Math.cos(p.yaw), fy = Math.sin(p.yaw), rx = Math.sin(p.yaw), ry = -Math.cos(p.yaw);
      let mx = 0, my = 0;
      if (input.fwd) { mx += fx; my += fy; }
      if (input.back) { mx -= fx; my -= fy; }
      if (input.right) { mx += rx; my += ry; }
      if (input.left) { mx -= rx; my -= ry; }
      const ml = Math.hypot(mx, my);
      if (ml > 0) { mx /= ml; my /= ml; }
      const weight = this.totalWeight(), maxW = this.maxWeight();
      const outfitDef = D.OUTFITS[this.outfit() ? this.outfit().id : 'none'];
      let speed = p.crouch ? P.CROUCH : P.WALK;
      const canRun = !p.crouch && input.run && p.stamina > 4 && weight <= maxW && !outfitDef.noSprint && input.fwd && !p.aim;
      if (canRun) speed = P.RUN;
      if (p.aim) speed *= 0.6;
      if (weight > maxW) speed *= 0.6;
      if (weight > maxW + 10) { speed = 0; if (ml > 0 && (p.overT -= DT) <= 0) { this.msg('Перегруз! Выбросите часть вещей.', '#e08060'); p.overT = 3; } }
      const depth = -this.T.heightAt(p.x, p.y);
      if (depth > 0 && p.z < 0.2) speed *= 1 - clamp(depth / 1.4, 0, 1) * 0.55;
      if (p.hp < 25) speed *= 0.85;
      const tvx = mx * speed, tvy = my * speed;
      const acc = p.ground ? P.ACCEL : P.ACCEL * 0.25;
      p.vx += clamp(tvx - p.vx, -acc * DT, acc * DT);
      p.vy += clamp(tvy - p.vy, -acc * DT, acc * DT);
      if (canRun && ml > 0) p.stamina = Math.max(0, p.stamina - DT * 9);
      if (input.jump && p.ground && p.stamina > 8 && !p.crouch && weight <= maxW) { p.vz = P.JUMP; p.ground = false; p.stamina -= 8; this.sound2d('jump', 0.5); }
      let nx = p.x + p.vx * DT, ny = p.y + p.vy * DT;
      const h = p.crouch ? P.CROUCH_H : P.HEIGHT;
      [nx, ny] = W.collide(nx, ny, p.z + P.STEP * 0.9, p.z + h, P.R);
      const nd = -this.T.heightAt(nx, ny);
      const g = W.groundAt(nx, ny, p.z, P.STEP);
      const onStruct = g.h > this.T.heightAt(nx, ny) + 0.05;
      if (nd > 1.3 && !onStruct) {
        nx = p.x; ny = p.y; p.vx *= -0.2; p.vy *= -0.2;
        if ((p.deepWarnT -= DT) <= 0) { this.msg('Слишком глубоко — не пройти.', '#a0c0e0'); p.deepWarnT = 3; }
      } else if (!onStruct && p.ground && this.T.slopeAt(nx, ny) > 1.25 && this.T.heightAt(nx, ny) > p.z + 0.2) { nx = p.x; ny = p.y; }
      const moved = Math.hypot(nx - p.x, ny - p.y);
      this.stats.distance += moved;
      p.x = nx; p.y = ny;
      p.vz -= P.GRAV * DT;
      p.z += p.vz * DT;
      const ground = W.groundAt(p.x, p.y, Math.max(p.z, p.z - p.vz * DT), P.STEP).h;
      const ceil = W.ceilingAt(p.x, p.y, p.z + 0.3);
      if (p.z + h > ceil && p.vz > 0) { p.vz = 0; p.z = ceil - h; }
      if (p.z <= ground) {
        if (!p.ground && p.vz < -9) { const dmg = (-p.vz - 9) * 9; this.damagePlayer(dmg, 'fall'); }
        if (!p.ground && p.vz < -3) this.sound2d('land', 0.6);
        p.z = ground; p.vz = 0; p.ground = true;
      } else if (p.z > ground + 0.08) p.ground = false;
      else if (p.ground) p.z = ground;
      if (p.ground && moved > 0.001) {
        p.stepT -= moved;
        if (p.stepT <= 0) {
          p.stepT = canRun ? 1.9 : 1.5;
          const mat = g.mat || (depth > 0.05 && p.z < 0.1 ? 'water' : (['grass', 'grass', 'dirt', 'dirt', 'dirt', 'dirt', 'grass', 'concrete', 'dirt', 'gravel', 'dirt'][this.T.materialAt(p.x, p.y)] || 'dirt'));
          this.sound2d('step_' + mat, p.crouch ? 0.25 : canRun ? 0.8 : 0.5);
          p.noise = Math.max(p.noise, (p.crouch ? 3 : canRun ? 16 : 8) * this.weatherNoise());
        }
      }
      p.noise = Math.max(0, p.noise - DT * 20);
      p.zone = W.zoneAt(p.x, p.y, p.z + 0.5);
      if (p.zone && p.zone.name && !this.discovered[p.zone.name]) { this.discovered[p.zone.name] = true; }
      for (const [k, poi] of Object.entries(M.POI)) {
        if (this.discovered['poi_' + k]) continue;
        if (Math.hypot(poi.x - p.x, poi.y - p.y) < 45) { this.discovered['poi_' + k] = true; if (k !== 'start') this.emit({ type: 'discover', id: k, name: poi.name }); }
      }
    }

    updateWeapon(input) {
      const p = this.player;
      p.fireCd = Math.max(0, p.fireCd - DT);
      p.boltCd = Math.max(0, p.boltCd - DT);
      p.grenadeCd = Math.max(0, p.grenadeCd - DT);
      p.useCd = Math.max(0, p.useCd - DT);
      p.recoil = Math.max(0, p.recoil - DT * 0.25);
      p.bloom = Math.max(0, p.bloom - DT * 0.08);
      if (p.switchT > 0) { p.switchT -= DT; return; }
      if (input.detector) this.toggleDetector();
      if (input.holster) this.toggleHolster();
      if (input.flashlight) { p.flashlight = !p.flashlight; this.sound2d('click', 0.6); }
      if (input.slot) this.selectSlot(input.slot);
      if (input.bolt && p.boltCd <= 0) this.throwBolt();
      if (input.grenade && p.grenadeCd <= 0) this.throwGrenade();
      const safe = this.inSafeZone();
      const wit = this.activeWeapon();
      p.aim = !!input.aim && !!wit && !safe && p.reload <= 0 && p.active !== 'knife';
      p.aimK += ((p.aim ? 1 : 0) - p.aimK) * Math.min(1, DT * 10);
      if (p.reload > 0) {
        p.reload -= DT;
        if (p.reload <= 0) this.finishReload();
        return;
      }
      if (!wit) return;
      const s = this.weaponStats(wit);
      if (input.mode && s.modes && s.modes.length > 1) { wit.mode = (wit.mode + 1) % s.modes.length; this.msg('Режим огня: ' + (s.modes[wit.mode] === 'auto' ? 'автоматический' : 'одиночный'), '#c8d0b0'); this.sound2d('click', 0.5); }
      if (input.ammoSwap && s.ammo && s.ammo.length > 1) {
        const next = s.ammo[(s.ammo.indexOf(wit.ammoType) + 1) % s.ammo.length];
        if (this.hasItem('ammo_' + next)) { this.unloadWeapon(wit); wit.ammoType = next; this.startReload(wit, s); } else this.msg('Нет патронов ' + D.AMMO[next].name, '#e0a060');
      }
      if (input.reload) {
        if (p.jammed) { p.jammed = false; p.reload = 1.1; p.reloadFor = null; this.sound2d('unjam'); return; }
        if (s.ammo && wit.mag < s.mag) this.startReload(wit, s);
      }
      if (safe) return;
      const fire = input.fire;
      if (!fire) { p.triggerHeld = false; return; }
      if (s.melee) { if (p.fireCd <= 0) this.knifeAttack(s); return; }
      const auto = s.modes && s.modes[wit.mode] === 'auto';
      if (!auto && p.triggerHeld) return;
      if (p.fireCd > 0) return;
      p.triggerHeld = true;
      if (p.jammed) { this.sound2d('dryfire'); this.msg('Клин! Нажмите R, чтобы передёрнуть затвор.', '#e0a060'); p.fireCd = 0.3; return; }
      if (wit.mag <= 0) { this.sound2d('dryfire'); p.fireCd = 0.25; if (this.hasItem('ammo_' + wit.ammoType)) this.startReload(wit, s); return; }
      this.shoot(wit, s);
    }

    startReload(wit, s) {
      if (!this.hasItem('ammo_' + wit.ammoType)) {
        const alt = (s.ammo || []).find(a => this.hasItem('ammo_' + a));
        if (!alt) { this.msg('Нет патронов.', '#e0a060'); return; }
        if (wit.mag > 0) this.unloadWeapon(wit);
        wit.ammoType = alt;
      }
      const p = this.player;
      p.reload = s.shellReload ? Math.max(0.6, (s.mag - wit.mag) * 0.5) : s.reload;
      p.reloadFor = wit.uid;
      this.sound2d('reload_' + (s.npc === 'shotgun' ? 'shotgun' : s.slot === 'pistol' ? 'pistol' : 'rifle'));
    }
    finishReload() {
      const p = this.player;
      const wit = p.reloadFor ? this.item(p.reloadFor) : null;
      p.reloadFor = null;
      if (!wit) return;
      const s = this.weaponStats(wit);
      const need = s.mag - wit.mag, have = this.countItem('ammo_' + wit.ammoType);
      const n = Math.min(need, have);
      if (n > 0) { this.removeItem('ammo_' + wit.ammoType, n); wit.mag += n; }
    }
    unloadWeapon(wit) { if (wit.mag > 0 && wit.ammoType) { this.addItem('ammo_' + wit.ammoType, wit.mag); wit.mag = 0; } }

    shoot(wit, s) {
      const p = this.player;
      const auto = s.modes && s.modes[wit.mode] === 'auto';
      p.fireCd = 60 / s.rpm;
      wit.mag--;
      this.stats.shots++;
      wit.cond = Math.max(0, wit.cond - 0.0011 * s.wear);
      const ammo = D.AMMO[wit.ammoType];
      const slug = ammo.slug;
      const pellets = slug ? 1 : (s.pellets || 1);
      const moving = Math.hypot(p.vx, p.vy);
      const condK = 1 + (1 - wit.cond) * 1.4;
      let spread = s.spread * condK * (1 + moving * 0.35) * (p.crouch ? 0.7 : 1) * (1 - p.aimK * 0.55) + p.bloom;
      if (pellets > 1) spread = s.spread * (1 - p.aimK * 0.2);
      const eye = [p.x, p.y, this.eyeZ()];
      for (let k = 0; k < pellets; k++) {
        const a = this.rng() * C.TAU, r = Math.sqrt(this.rng()) * spread;
        const dir = this.aimDir(Math.cos(a) * r, Math.sin(a) * r);
        this.traceShot(eye, dir, s.dmg * ammo.dmg, s.range, ammo.pierce, 'player', k === 0);
      }
      p.recoil = Math.min(0.4, p.recoil + s.recoil);
      p.pitch = clamp(p.pitch + s.recoil * (0.7 + this.rng() * 0.5) * (1 - p.aimK * 0.3), -1.35, 1.35);
      p.yaw += (this.rng() - 0.5) * s.recoil * 0.8;
      if (auto) p.bloom = Math.min(0.05, p.bloom + s.spread * 0.25);
      this.sound2d(s.silent ? 'shot_silenced' : 'shot_' + (s.sound || 'rifle'));
      p.noise = s.silent ? 14 : 95;
      this.emit({ type: 'muzzle', silent: !!s.silent });
      this.alertAround(p.x, p.y, s.silent ? 14 : 90, 'player');
      if (wit.cond < 0.55 && s.wear > 0.6 && this.rng() < (0.55 - wit.cond) * 0.07) { p.jammed = true; this.sound2d('jam'); this.msg('Оружие заклинило!', '#e0a060'); }
    }

    knifeAttack(s) {
      const p = this.player;
      p.fireCd = 60 / s.rpm;
      this.sound2d('knife');
      this.emit({ type: 'knife' });
      const eye = [p.x, p.y, this.eyeZ()], dir = this.aimDir();
      const hit = this.hitActors(eye, dir, s.range, 'player');
      if (hit) { this.damageActor(hit.actor, s.dmg * (hit.head ? 1.6 : 1), 'melee', 'player', { dir, head: hit.head }); this.bloodAt(hit.x, hit.y, hit.z); }
    }

    hitActors(o, d, maxDist, src, ignore) {
      let best = null;
      for (const a of this.actors) {
        if (a.dead || !a.online || a === ignore || a.id === src) continue;
        const r = a.radius || 0.4, hgt = a.height || 1.8;
        const fx = o[0] - a.x, fy = o[1] - a.y;
        const A = d[0] * d[0] + d[1] * d[1];
        if (A < 1e-9) continue;
        const B = 2 * (fx * d[0] + fy * d[1]), Cq = fx * fx + fy * fy - r * r;
        const disc = B * B - 4 * A * Cq;
        if (disc < 0) continue;
        const sq = Math.sqrt(disc);
        let t = (-B - sq) / (2 * A);
        if (t < 0) t = (-B + sq) / (2 * A);
        if (t < 0 || t > maxDist || (best && t >= best.t)) continue;
        const z = o[2] + d[2] * t;
        const base = a.z + (a.crouch ? -0.3 : 0);
        if (z < base || z > base + hgt) continue;
        const head = a.kind === 'human' || a.kind === 'bloodsucker' ? z > base + hgt - 0.3 : false;
        best = { t, actor: a, head, x: o[0] + d[0] * t, y: o[1] + d[1] * t, z };
      }
      return best;
    }

    traceShot(o, d, dmg, range, pierce, src, tracer) {
      const maxD = range * 2.2;
      const wh = this.W.raycast(o[0], o[1], o[2], d[0], d[1], d[2], maxD);
      const srcActor = typeof src === 'string' ? null : src;
      const ah = this.hitActors(o, d, wh ? wh.t : maxD, srcActor ? srcActor.id : src, srcActor);
      let playerHit = null;
      if (src !== 'player') {
        const p = this.player;
        const fx = o[0] - p.x, fy = o[1] - p.y, A = d[0] * d[0] + d[1] * d[1], B = 2 * (fx * d[0] + fy * d[1]), Cq = fx * fx + fy * fy - 0.36 * 0.36;
        const disc = B * B - 4 * A * Cq;
        if (disc >= 0 && A > 1e-9) {
          const t = (-B - Math.sqrt(disc)) / (2 * A), z = o[2] + d[2] * t;
          const lim = Math.min(wh ? wh.t : maxD, ah ? ah.t : maxD);
          if (t > 0 && t < lim && z > p.z && z < p.z + (p.crouch ? P.CROUCH_H : P.HEIGHT)) playerHit = { t, z };
        }
      }
      let endT = wh ? wh.t : maxD;
      if (ah && ah.t < endT) endT = ah.t;
      if (playerHit && playerHit.t < endT) endT = playerHit.t;
      const falloff = t => t < range ? 1 : Math.max(0.25, 1 - (t - range) / (range * 1.4));
      if (playerHit && playerHit.t <= endT) {
        this.damagePlayer(dmg * falloff(playerHit.t), 'bullet', srcActor, { pierce, dir: d });
      } else if (ah && ah.t <= endT) {
        const k = ah.head ? (ah.actor.kind === 'human' ? 2.6 : 1.8) : 1;
        const armor = ah.actor.armor || 0;
        const final = dmg * falloff(ah.t) * k * (1 - armor * (1 - (pierce || 0)));
        this.damageActor(ah.actor, final, 'bullet', src, { dir: d, head: ah.head });
        if (src === 'player') this.stats.hits++;
        this.bloodAt(ah.x, ah.y, ah.z);
      } else if (wh) {
        this.impactAt(wh, d);
      }
      if (tracer && this.rng() < 0.5) { const life = clamp(endT / 650, 0.035, 0.12); this.tracers.push({ ax: o[0] + d[0] * 1.2, ay: o[1] + d[1] * 1.2, az: o[2] + d[2] * 1.2 - 0.12, bx: o[0] + d[0] * endT, by: o[1] + d[1] * endT, bz: o[2] + d[2] * endT, t: life, life }); }
    }

    impactAt(h, d) {
      const col = h.kind === 'water' ? 0xa0b0b0 : h.kind === 'tree' ? 0x6a5030 : h.kind === 'struct' ? 0x9a9488 : 0x7a6a50;
      for (let k = 0; k < (h.kind === 'water' ? 6 : 4); k++) this.particles.push({ x: h.x, y: h.y, z: h.z, vx: (this.rng() - 0.5) * 2 - d[0], vy: (this.rng() - 0.5) * 2 - d[1], vz: this.rng() * 2.5, g: 8, life: 0.5 + this.rng() * 0.3, size: 0.06, color: C.hex(col), mode: 'alpha', alpha: 0.9, lit: true });
      const r = () => this.fxRand();
      if (h.kind !== 'water') this.particles.push({ x: h.x - d[0] * 0.1, y: h.y - d[1] * 0.1, z: h.z, vx: -d[0] * 0.6, vy: -d[1] * 0.6, vz: 0.35, g: -0.1, life: 0.9, size: 0.22, grow: 0.9, color: C.hex(h.kind === 'tree' ? 0x5a4a34 : col), mode: 'alpha', alpha: 0.4, lit: true });
      const sparks = h.kind === 'struct' ? (h.mat === 'metal' ? 6 : 2) : 0;
      for (let k = 0; k < sparks; k++) this.particles.push({ x: h.x, y: h.y, z: h.z, vx: (r() - 0.5) * 6 - d[0] * 3, vy: (r() - 0.5) * 6 - d[1] * 3, vz: r() * 4 + 1, g: 9, life: 0.18 + r() * 0.2, size: 0.03, color: C.hex(0xffd080), mode: 'spark', alpha: 1 });
      if (h.kind === 'struct' && (h.mat === 'metal')) { this.particles.push({ x: h.x, y: h.y, z: h.z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.07, size: 0.18, color: C.hex(0xffd080), mode: 'add', alpha: 1 }); this.sound('ric', h.x, h.y, h.z, 0.4); }
      else this.sound('impact', h.x, h.y, h.z, 0.3);
    }

    fxRand() { this.fxSeed = ((this.fxSeed || 7) * 1103515245 + 12345) >>> 0; return this.fxSeed / 4294967296; }

    bloodAt(x, y, z) {
      for (let k = 0; k < 6; k++) this.particles.push({ x, y, z, vx: (this.rng() - 0.5) * 2.5, vy: (this.rng() - 0.5) * 2.5, vz: this.rng() * 2, g: 9, life: 0.6, size: 0.07, color: C.hex(0x8a1410), mode: 'alpha', alpha: 1, lit: true });
    }

    alertAround(x, y, radius, src) {
      for (const a of this.actors) {
        if (a.dead || !a.online) continue;
        const d = Math.hypot(a.x - x, a.y - y);
        if (d < radius && this.onAlert) this.onAlert(a, x, y, src, d);
      }
    }

    damagePlayer(dmg, type, src, info = {}) {
      const p = this.player;
      if (this.cheats.god || this.dead) return;
      const o = this.outfitStats();
      let k = 1;
      if (type === 'bullet') k = 1 - o.armor * (1 - (info.pierce || 0) * 0.5);
      else if (type === 'burn') k = 1 - o.burn;
      else if (type === 'shock') k = 1 - o.shock;
      else if (type === 'chem') k = 1 - o.chem;
      else if (type === 'melee') k = 1 - o.armor * 0.6;
      else if (type === 'gravity') k = 1 - o.armor * 0.2;
      const final = dmg * clamp(k, 0.1, 1) * this.diff.dmgTaken;
      p.hp -= final;
      p.hurtT = 0.5;
      if (src && src.x != null) p.lastHurtDir = Math.atan2(src.y - p.y, src.x - p.x);
      if ((type === 'bullet' || type === 'melee') && this.rng() < 0.35 * (final / 20)) p.bleed = clamp(p.bleed + 0.25 + this.rng() * 0.35, 0, 3);
      const it = this.outfit();
      if (it && (type === 'bullet' || type === 'melee')) it.cond = Math.max(0, it.cond - final * 0.0009);
      this.emit({ type: 'hurt', amount: final, kind: type });
      if (final > 3) this.sound2d(type === 'burn' ? 'hurt_burn' : type === 'shock' ? 'hurt_shock' : 'hurt', 0.7);
      if (p.hp <= 0) this.die(type, src);
    }

    die(cause, src) {
      const p = this.player;
      p.hp = 0;
      this.dead = true;
      this.stats.deaths++;
      const causes = { bullet: 'Убит пулей', melee: 'Растерзан', burn: 'Сгорел в аномалии', shock: 'Убит разрядом аномалии', gravity: 'Разорван аномалией', chem: 'Химический ожог', rad: 'Лучевая болезнь', bleed: 'Истёк кровью', emission: 'Попал под выброс', fall: 'Разбился', hunger: 'Истощение' };
      this.deathCause = causes[cause] || 'Погиб';
      if (src && src.name) this.deathCause += ': ' + src.name;
      this.emit({ type: 'death', cause: this.deathCause });
    }

    updateStatus() {
      const p = this.player;
      const o = this.outfitStats();
      let healthRegen = 0.03, bleedHeal = 0.012, stamRegen = 11, radRate = 0;
      for (const a of this.beltArtifacts()) {
        const A = D.ARTIFACTS[a.id];
        radRate += A.rad;
        if (A.fx.health) healthRegen += A.fx.health;
        if (A.fx.bleedHeal) bleedHeal += A.fx.bleedHeal * 0.2;
        if (A.fx.stamina) stamRegen += A.fx.stamina * 10;
      }
      for (const z of M.ZONE_RADIATION) {
        const d = Math.hypot(p.x - z.x, p.y - z.y);
        if (d < z.r) radRate += z.power * 9 * (1 - d / z.r) * (1 - o.rad);
      }
      for (const an of this.anomalies) {
        const d = Math.hypot(p.x - an.x, p.y - an.y);
        if (d < 4 && (an.type === 'kisel' || an.type === 'zharka')) radRate += (1 - d / 4) * 1.2 * (1 - o.rad);
      }
      const edge = Math.min(p.x, p.y, M.SIZE - p.x, M.SIZE - p.y);
      if (edge < 50) radRate += (1 - edge / 50) * 20 * (1 - o.rad);
      this.radRate = radRate;
      if (radRate > 0) p.rad += radRate * DT;
      else p.rad = Math.max(0, p.rad + radRate * DT * 6);
      if (p.radCure > 0) { const step = Math.min(p.radCure, 90 * DT); p.rad = Math.max(0, p.rad - step); p.radCure -= step; }
      p.rad = Math.max(0, p.rad - DT * 0.35);
      if (p.healT > 0) { const step = Math.min(p.healT, 22 * DT); p.hp = Math.min(100, p.hp + step); p.healT -= step; }
      if (p.rad > 30) this.damageRaw(p.rad * 0.0016 * DT * 60 / 60, 'rad');
      if (p.bleed > 0) { this.damageRaw(p.bleed * 0.6 * DT, 'bleed'); p.bleed = Math.max(0, p.bleed - bleedHeal * DT); }
      p.food = Math.max(0, p.food - DT * (p.sleepT > 0 ? 0.02 : 0.012));
      if (p.food < 5) this.damageRaw(0.03 * DT, 'hunger');
      if (p.bleed <= 0.01 && p.food > 30 && p.rad < 30) p.hp = Math.min(100, p.hp + healthRegen * DT);
      if (p.food < 15) stamRegen *= 0.5;
      p.stamina = Math.min(100, p.stamina + stamRegen * DT * (Math.hypot(p.vx, p.vy) > 3.5 ? 0 : 1));
      p.drunk = Math.max(0, p.drunk - DT * 0.35);
      p.hurtT = Math.max(0, p.hurtT - DT);
      if (p.sleepT > 0) { p.hp = Math.min(100, p.hp + DT * 0.5); p.stamina = 100; }
    }

    damageRaw(v, cause) {
      if (this.cheats.god || this.dead) return;
      this.player.hp -= v;
      if (this.player.hp <= 0) this.die(cause);
    }

    throwBolt() {
      const p = this.player;
      p.boltCd = 0.7;
      const d = this.aimDir(0, 0.18);
      const e = this.eyeZ();
      this.projectiles.push({ kind: 'bolt', x: p.x + d[0] * 0.4, y: p.y + d[1] * 0.4, z: e - 0.1, vx: d[0] * 13 + p.vx, vy: d[1] * 13 + p.vy, vz: d[2] * 13, life: 7, bounces: 0 });
      this.sound2d('throw', 0.5);
      this.emit({ type: 'throw', what: 'bolt' });
    }

    throwGrenade() {
      const p = this.player;
      if (!this.hasItem('f1')) { this.msg('Нет гранат.', '#e0a060'); return; }
      if (this.inSafeZone()) return;
      p.detectorOut = false;
      this.removeItem('f1', 1);
      p.grenadeCd = 1.2;
      const d = this.aimDir(0, 0.2);
      this.projectiles.push({ kind: 'grenade', x: p.x + d[0] * 0.4, y: p.y + d[1] * 0.4, z: this.eyeZ() - 0.1, vx: d[0] * 15 + p.vx, vy: d[1] * 15 + p.vy, vz: d[2] * 15, life: 3.6, bounces: 0, src: 'player' });
      this.sound2d('pin');
      this.emit({ type: 'throw', what: 'grenade' });
    }

    updateProjectiles() {
      for (const pr of this.projectiles) {
        pr.life -= DT;
        pr.vz -= 12 * DT;
        let nx = pr.x + pr.vx * DT, ny = pr.y + pr.vy * DT, nz = pr.z + pr.vz * DT;
        const sp = Math.hypot(pr.vx, pr.vy, pr.vz);
        if (sp > 0.3) {
          const hit = this.W.raycast(pr.x, pr.y, pr.z, pr.vx / sp, pr.vy / sp, pr.vz / sp, sp * DT + 0.05, { noTrees: false });
          if (hit) {
            const horiz = hit.kind === 'terrain' || hit.kind === 'water' || (hit.kind === 'struct' && pr.vz < 0 && Math.abs(hit.z - hit.collider.z1) < 0.2);
            if (hit.kind === 'water') { pr.vx *= 0.3; pr.vy *= 0.3; pr.vz = -1; if (pr.bounces === 0) this.sound('splash', hit.x, hit.y, hit.z, 0.4); pr.bounces++; nz = hit.z - 0.05; }
            else if (horiz) { pr.vz = Math.abs(pr.vz) * 0.35; pr.vx *= 0.55; pr.vy *= 0.55; nx = hit.x; ny = hit.y; nz = hit.z + 0.03; if (pr.bounces++ < 3 && sp > 2) this.sound(pr.kind === 'bolt' ? 'bolt' : 'grenade_bounce', hit.x, hit.y, hit.z, 0.4); }
            else { pr.vx *= -0.4; pr.vy *= -0.4; nx = pr.x; ny = pr.y; if (pr.bounces++ < 3) this.sound(pr.kind === 'bolt' ? 'bolt' : 'grenade_bounce', hit.x, hit.y, hit.z, 0.4); }
          }
        }
        const g = this.W.groundAt(nx, ny, nz + 0.2, 0.3).h;
        if (nz < g && g > 0) { nz = g + 0.02; pr.vz = Math.abs(pr.vz) * 0.3; pr.vx *= 0.6; pr.vy *= 0.6; }
        pr.x = nx; pr.y = ny; pr.z = nz;
        if (pr.kind === 'bolt') {
          for (const an of this.anomalies) {
            if (Math.hypot(an.x - pr.x, an.y - pr.y) < an.trigger && Math.abs(pr.z - an.z) < 2.5) {
              if (an.state === 'idle') this.triggerAnomaly(an, 'bolt');
              if (an.type === 'vortex' || an.type === 'carousel') { pr.vx += (an.x - pr.x) * DT * 20; pr.vy += (an.y - pr.y) * DT * 20; pr.vz += DT * 20; }
              if (an.type === 'springboard' && an.state === 'active') { pr.vz = 8; pr.vx = (pr.x - an.x) * 5; pr.vy = (pr.y - an.y) * 5; }
            }
          }
        }
        if (pr.kind === 'grenade' && pr.life <= 0) this.explode(pr.x, pr.y, pr.z + 0.2, D.GRENADES.f1, pr.src);
      }
      this.projectiles = this.projectiles.filter(p => p.life > 0);
    }

    explode(x, y, z, spec, src) {
      this.sound('explosion', x, y, z, 1.5);
      this.emit({ type: 'explosion', x, y, z });
      for (let k = 0; k < 24; k++) {
        const a = this.rng() * C.TAU, s = 2 + this.rng() * 6;
        this.particles.push({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: this.rng() * 6, g: 6, life: 0.3 + this.rng() * 0.5, size: 0.3 + this.rng() * 0.3, color: C.hex(this.rng() < 0.5 ? 0xffb050 : 0xffe0a0), mode: 'add', alpha: 1 });
      }
      for (let k = 0; k < 14; k++) this.particles.push({ x: x + (this.rng() - 0.5) * 2, y: y + (this.rng() - 0.5) * 2, z: z + this.rng(), vx: (this.rng() - 0.5), vy: (this.rng() - 0.5), vz: 1 + this.rng(), g: -0.3, life: 2 + this.rng() * 2, size: 1.2 + this.rng(), color: C.hex(0x6a6660), mode: 'alpha', alpha: 0.45, lit: true, grow: 0.8 });
      const p = this.player;
      const pd = Math.hypot(p.x - x, p.y - y, p.z + 1 - z);
      if (pd < spec.radius && this.W.lineOfSight(x, y, z + 0.3, p.x, p.y, p.z + 1)) this.damagePlayer(spec.dmg * Math.pow(1 - pd / spec.radius, 1.3), 'bullet', null, { pierce: 0.5 });
      for (const a of this.actors) {
        if (a.dead || !a.online) continue;
        const d = Math.hypot(a.x - x, a.y - y, a.z + 1 - z);
        if (d < spec.radius && this.W.lineOfSight(x, y, z + 0.3, a.x, a.y, a.z + 1)) this.damageActor(a, spec.dmg * Math.pow(1 - d / spec.radius, 1.2), 'explosion', src || 'player', {});
      }
      this.alertAround(x, y, 120, src || 'player');
      this.emit({ type: 'shake', amount: clamp(1 - pd / 30, 0, 1) });
    }

    triggerAnomaly(an, by) {
      const T = D.ANOMALY_TYPES[an.type];
      if (T.continuous) return;
      if (an.state !== 'idle') return;
      an.state = 'active'; an.t = 0;
      this.sound('anom_' + T.sound, an.x, an.y, an.z + 0.5, 1);
      if (!this.encyclopedia['anom_' + an.type]) { this.encyclopedia['anom_' + an.type] = true; this.emit({ type: 'encyclopedia', id: 'anom_' + an.type }); }
    }

    updateAnomalies() {
      const p = this.player;
      let nearest = 1e9;
      const movers = this.tickN % 3 === 0 ? this.actors.filter(a => a.online && !a.dead && !a.static) : [];
      for (const an of this.anomalies) {
        const T = D.ANOMALY_TYPES[an.type];
        const dp = Math.hypot(p.x - an.x, p.y - an.y), dz = p.z - an.z;
        if (dp - an.trigger < nearest && Math.abs(dz) < 3) nearest = dp - an.trigger;
        if (an.state === 'active') {
          an.t += DT;
          this.anomalyActiveFx(an, T);
          if (an.t >= T.active) { an.state = 'cool'; an.t = 0; }
        } else if (an.state === 'cool') {
          an.t += DT;
          if (an.t >= T.cool) { an.state = 'idle'; an.t = 0; }
        }
        const inside = (x, y, z) => Math.hypot(x - an.x, y - an.y) < an.trigger && z > an.z - 1.2 && z < an.z + 3;
        if (T.continuous) {
          if (inside(p.x, p.y, p.z)) { if ((an.hitCd = (an.hitCd || 0) - DT) <= 0) { an.hitCd = 0.5; this.damagePlayer(T.dmg * 0.5, T.hit); this.sound('anom_' + T.sound, an.x, an.y, an.z, 0.6); } }
          if (this.rng() < 0.05 && dp < 60) this.particles.push({ x: an.x + (this.rng() - 0.5) * an.radius * 1.6, y: an.y + (this.rng() - 0.5) * an.radius * 1.6, z: an.z + 0.1, vx: 0, vy: 0, vz: 0.3, g: 0, life: 1.2, size: 0.12, color: C.hex(an.type === 'kisel' ? 0x80ff60 : 0xa09080), mode: an.type === 'kisel' ? 'add' : 'alpha', alpha: 0.6, lit: an.type !== 'kisel' });
        } else {
          if (an.state === 'idle' && inside(p.x, p.y, p.z)) this.triggerAnomaly(an, 'player');
          for (const a of movers) if (an.state === 'idle' && Math.abs(a.x - an.x) < an.trigger && Math.abs(a.y - an.y) < an.trigger && inside(a.x, a.y, a.z)) this.triggerAnomaly(an, a);
          if (an.type === 'vortex' || an.type === 'carousel') {
            if (dp < an.trigger && Math.abs(dz) < 3) {
              const pull = (T.pull || 5) * (1 - dp / an.trigger) * DT;
              p.x += (an.x - p.x) / Math.max(dp, 0.1) * pull; p.y += (an.y - p.y) / Math.max(dp, 0.1) * pull;
            }
          }
          if (an.state === 'active') {
            const hitR = an.type === 'vortex' ? an.radius : an.trigger;
            if (dp < hitR && Math.abs(dz) < 3 && (an.hitCd = (an.hitCd || 0) - DT) <= 0) {
              an.hitCd = an.type === 'vortex' ? 0.4 : 0.35;
              const frac = an.type === 'vortex' ? (an.t > T.active * 0.8 ? 1 : 0.1) : 0.5;
              this.damagePlayer(T.dmg * frac * 0.5, T.hit, null);
              if (an.type === 'springboard') { p.vz = 6; p.vx = (p.x - an.x) / Math.max(dp, 0.2) * 8; p.vy = (p.y - an.y) / Math.max(dp, 0.2) * 8; p.ground = false; }
              if (an.type === 'carousel') { p.vz = 4; p.ground = false; }
            }
            for (const a of this.actors) {
              if (a.dead || !a.online || Math.abs(a.x - an.x) > hitR || Math.abs(a.y - an.y) > hitR) continue;
              if (Math.hypot(a.x - an.x, a.y - an.y) < hitR && (a.anomCd = (a.anomCd || 0) - DT) <= 0) { a.anomCd = 0.4; this.damageActor(a, T.dmg * 0.4, T.hit, 'anomaly', {}); }
            }
          }
        }
      }
      this.nearestAnomaly = nearest;
    }

    anomalyActiveFx(an, T) {
      const r = this.rng;
      if (this.tickN % 2) return;
      if (an.type === 'zharka') for (let k = 0; k < 3; k++) this.particles.push({ x: an.x + (r() - 0.5) * 0.8, y: an.y + (r() - 0.5) * 0.8, z: an.z + 0.1, vx: (r() - 0.5) * 0.6, vy: (r() - 0.5) * 0.6, vz: 4 + r() * 4, g: -1, life: 0.6 + r() * 0.3, size: 0.5 + r() * 0.5, color: C.hex(r() < 0.5 ? 0xff9030 : 0xffd060), mode: 'add', alpha: 0.9, sprite: 'fx_fire' });
      else if (an.type === 'electra') for (let k = 0; k < 2; k++) { const a = r() * C.TAU, rr = r() * an.radius; this.particles.push({ x: an.x + Math.cos(a) * rr, y: an.y + Math.sin(a) * rr, z: an.z + 0.3 + r() * 1.8, vx: 0, vy: 0, vz: 0, g: 0, life: 0.12, size: 0.5, color: C.hex(0xa0d0ff), mode: 'add', alpha: 1, sprite: 'fx_spark' }); if (k === 0) this.tracers.push({ ax: an.x, ay: an.y, az: an.z + 0.2, bx: an.x + Math.cos(a) * rr, by: an.y + Math.sin(a) * rr, bz: an.z + 1 + r() * 1.5, t: 0.08, color: 0xc0e0ff, arc: true, seed: (r() * 9999) | 0 }); }
      else if (an.type === 'vortex' || an.type === 'carousel') for (let k = 0; k < 3; k++) { const a = r() * C.TAU, rr = 1 + r() * an.trigger; this.particles.push({ x: an.x + Math.cos(a) * rr, y: an.y + Math.sin(a) * rr, z: an.z + r() * 2, vx: -Math.sin(a) * 6 - Math.cos(a) * 3, vy: Math.cos(a) * 6 - Math.sin(a) * 3, vz: 1.5, g: 0, life: 0.5, size: 0.12, color: C.hex(0x6a5a3a), mode: 'alpha', alpha: 0.9, lit: true }); }
      else if (an.type === 'springboard') for (let k = 0; k < 4; k++) { const a = r() * C.TAU; this.particles.push({ x: an.x, y: an.y, z: an.z + 0.2, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, vz: 2, g: 4, life: 0.4, size: 0.1, color: C.hex(0x7a6a50), mode: 'alpha', alpha: 0.9, lit: true }); }
    }

    updateArtifacts() {
      const p = this.player;
      const det = p.slots.detector ? this.item(p.slots.detector) : null;
      const spec = det ? D.DETECTORS[det.id] : null;
      let nearest = null, nd = 1e9;
      for (const a of this.artifacts) {
        if (a.taken) continue;
        const d = Math.hypot(a.x - p.x, a.y - p.y, a.z - p.z - 1);
        if (spec && p.detectorOut && d < spec.range && d < nd) { nd = d; nearest = a; }
        if (spec && p.detectorOut && d < spec.reveal) a.visible = true;
        if (a.visible && d > 40) a.visible = false;
      }
      this.detector = spec && p.detectorOut ? { spec, nearest, dist: nd } : null;
      if (this.detector && nearest) {
        this.detBeep = (this.detBeep || 0) - DT;
        const interval = clamp(nd / spec.range, 0.06, 1) * 1.4;
        if (this.detBeep <= 0) { this.detBeep = interval; this.sound2d('det_beep', 0.55); }
      }
      if (this.nearestAnomaly < 3.5) {
        this.anomBeep = (this.anomBeep || 0) - DT;
        if (this.anomBeep <= 0) { this.anomBeep = clamp(this.nearestAnomaly / 3.5, 0.08, 1) * 0.9; this.sound2d('anom_beep', 0.35); }
      }
    }

    pickArtifact(a) {
      a.taken = true;
      this.addItem(a.id);
      this.stats.artifacts++;
      this.sound2d('pickup_art');
      this.msg('Найден артефакт: ' + D.ARTIFACTS[a.id].name, '#a0e0ff');
      if (!this.encyclopedia['art_' + a.id]) { this.encyclopedia['art_' + a.id] = true; this.emit({ type: 'encyclopedia', id: 'art_' + a.id }); }
      this.emit({ type: 'artifact', id: a.id });
    }

    scheduleEmission(delaySec) { this.emission.next = this.realTime + delaySec; }

    startEmission(scripted = false) {
      const e = this.emission;
      if (e.phase !== 'none') return;
      e.phase = 'warning'; e.t = 0; e.scripted = scripted;
      this.news('Борода', 'Внимание всем! Идёт выброс! Всем срочно в укрытия! Повторяю: выброс!', true);
      this.sound2d('siren', 0.8);
      this.emit({ type: 'emission', phase: 'warning' });
    }

    updateEmission() {
      const e = this.emission;
      if (e.phase === 'none') {
        if (this.realTime >= e.next && !this.flag('no_emissions')) this.startEmission(false);
        return;
      }
      e.t += DT;
      const p = this.player;
      if (e.phase === 'warning') {
        if (e.t > 40 && e.t < 41 && !this.inShelter()) this.msg('Выброс близко! Ищите укрытие — помещение, трюм, подвал.', '#ff8060');
        if (e.t >= 100) { e.phase = 'strike'; e.t = 0; this.emit({ type: 'emission', phase: 'strike' }); this.sound2d('emission_blast', 1); }
        if (this.rng() < DT * (0.2 + e.t / 120)) this.emit({ type: 'lightning' });
      } else if (e.phase === 'strike') {
        if (!this.inShelter() && !this.cheats.god) {
          p.hurtT = 0.3;
          const lethal = this.diff.emissionLethal;
          const dmg = 14 * DT;
          if (!lethal && p.hp - dmg < 12) p.hp = Math.min(p.hp, 12);
          else { p.hp -= dmg; if (p.hp <= 0) this.die('emission'); }
          p.psy = Math.min(100, p.psy + DT * 30);
        }
        if (this.rng() < DT * 2) this.emit({ type: 'lightning' });
        if (e.t >= 16) { e.phase = 'after'; e.t = 0; this.emit({ type: 'emission', phase: 'after' }); this.afterEmission(); }
      } else if (e.phase === 'after') {
        if (e.t >= 25) { e.phase = 'none'; e.t = 0; this.scheduleEmission(30 * 60 + this.rng() * 20 * 60); this.news('Борода', 'Выброс закончился. Можно выходить. Смотрите в оба — аномалии могли сместиться.'); }
      }
      p.psy = Math.max(0, p.psy - DT * 5);
    }

    afterEmission() {
      const e = this.emission;
      e.count++;
      this.stats.emissions++;
      const shifting = new Set(D.FIELDS.filter(f => !f.noRespawn && !f.fixedMarker).map(f => f.id));
      this.anomalies = this.anomalies.filter(a => !shifting.has(a.field));
      for (const f of D.FIELDS) if (shifting.has(f.id)) this.populateField(f, e.count);
      for (const f of D.FIELDS) this.spawnFieldArtifacts(f, false);
      if (this.onEmissionEnd) this.onEmissionEnd();
      this.restock();
    }

    updateParticles() {
      for (const pt of this.particles) {
        pt.life -= DT;
        pt.vz -= (pt.g || 0) * DT;
        pt.x += pt.vx * DT; pt.y += pt.vy * DT; pt.z += pt.vz * DT;
        if (pt.grow) pt.size += pt.grow * DT;
      }
      this.particles = this.particles.filter(p => p.life > 0);
      if (this.particles.length > 900) this.particles.splice(0, this.particles.length - 900);
      for (const t of this.tracers) t.t -= DT;
      this.tracers = this.tracers.filter(t => t.t > 0);
    }

    addUsable(u) { this.usables.push(Object.assign({ r: 1.6 }, u)); }

    updateFocus() {
      const p = this.player;
      if (this.tickN % 4) return;
      const eye = [p.x, p.y, this.eyeZ()], d = this.aimDir();
      let best = null, bestScore = 1e9;
      const consider = (kind, obj, x, y, z, range, label) => {
        const dx = x - eye[0], dy = y - eye[1], dz = z - eye[2], dist = Math.hypot(dx, dy, dz);
        if (dist > range) return;
        const dot = (dx * d[0] + dy * d[1] + dz * d[2]) / Math.max(dist, 0.01);
        if (dot < (dist < 1 ? 0.3 : 0.82)) return;
        const score = dist * (2 - dot);
        if (score < bestScore) { bestScore = score; best = { kind, obj, label }; }
      };
      for (const a of this.actors) {
        if (!a.online) continue;
        if (a.dead) consider('loot', a, a.x, a.y, a.z + 0.3, 2.2, 'Обыскать: ' + (a.name || 'труп'));
        else if (a.talk && !this.hostileToPlayer(a)) consider('talk', a, a.x, a.y, a.z + 1.3, 2.6, 'Говорить: ' + a.name);
      }
      for (const it of this.items) consider('item', it, it.x, it.y, it.z + 0.1, 2.0, 'Взять: ' + D.ITEMS[it.item.id].name + (it.item.count > 1 ? ' (' + it.item.count + ')' : ''));
      for (const a of this.artifacts) if (a.visible && !a.taken) consider('artifact', a, a.x, a.y, a.z, 2.0, 'Взять артефакт: ' + D.ARTIFACTS[a.id].name);
      for (const s of Object.values(this.stashes)) consider('stash', s, s.x, s.y, s.z + 0.3, 2.0, s.opened ? 'Тайник' : 'Открыть тайник');
      for (const u of this.usables) if (!u.cond || u.cond(this)) consider('use', u, u.x, u.y, u.z, u.r + 0.6, typeof u.label === 'function' ? u.label(this) : u.label);
      this.focus = best;
    }

    interact() {
      const f = this.focus, p = this.player;
      if (!f || p.useCd > 0) return;
      p.useCd = 0.3;
      if (f.kind === 'talk') { this.emit({ type: 'dialog', actor: f.obj }); return; }
      if (f.kind === 'loot') { this.emit({ type: 'loot', target: f.obj, source: 'corpse' }); if (this.onLoot) this.onLoot(f.obj); return; }
      if (f.kind === 'stash') {
        const s = f.obj;
        if (s.locked && !this.flag(s.locked)) { this.msg('Сундук заперт.', '#c0b090'); return; }
        if (!s.opened) { s.opened = true; this.stats.stashes++; if (s.money) { p.money += s.money; this.msg('Найдено ' + C.formatMoney(s.money), '#e0d080'); s.money = 0; } this.sound2d('stash'); }
        this.emit({ type: 'loot', target: s, source: 'stash' });
        return;
      }
      if (f.kind === 'item') {
        const it = f.obj;
        this.items.splice(this.items.indexOf(it), 1);
        this.addInstance(it.item);
        this.sound2d('pickup');
        this.msg('Подобрано: ' + D.ITEMS[it.item.id].name, '#d0d0b0');
        this.emit({ type: 'pickup', id: it.item.id });
        return;
      }
      if (f.kind === 'artifact') { this.pickArtifact(f.obj); return; }
      if (f.kind === 'use') { f.obj.act(this); return; }
    }

    dropItem(it, count) {
      const p = this.player;
      const inst = this.removeInstance(it, count);
      const a = p.yaw + (this.rng() - 0.5) * 0.6;
      const x = p.x + Math.cos(a) * 0.9, y = p.y + Math.sin(a) * 0.9;
      this.items.push({ item: inst, x, y, z: this.W.groundAt(x, y, p.z + 0.5).h });
      this.sound2d('drop');
    }

    spawnGroundItem(id, x, y, count = 1, extra = {}, z = null) {
      const it = makeItem(id, count, extra);
      const gz = z != null ? z : this.W.groundAt(x, y, this.T.heightAt(x, y) + 0.4).h;
      const entry = { item: it, x, y, z: gz };
      this.items.push(entry);
      return entry;
    }

    price(it, mode, traderId) {
      const def = D.ITEMS[it.id], tr = D.TRADERS[traderId];
      let base = def.price;
      if (def.type === 'ammo') base = def.price * (it.count / def.box);
      else if (def.type === 'weapon' || def.type === 'outfit') base = def.price * (0.3 + 0.7 * (it.cond == null ? 1 : it.cond));
      else base = def.price * (it.count || 1);
      if (mode === 'buy') return Math.round(base * tr.sellK * this.diff.prices);
      const k = def.type === 'artifact' ? tr.artifactK : tr.buyK;
      return Math.round(base * k * (this.rep >= 3 ? 1.1 : 1));
    }
    traderBuys(traderId, it) { const def = D.ITEMS[it.id]; return def.type !== 'quest' && D.TRADERS[traderId].buys.includes(def.type); }

    buy(traderId, it, count) {
      const stock = this.traderStock[traderId];
      const def = D.ITEMS[it.id];
      const n = count || it.count || 1;
      const unit = STACKS.has(def.type) && n < it.count ? makeItem(it.id, n) : it;
      const cost = this.price(unit, 'buy', traderId);
      if (this.player.money < cost) { this.msg('Не хватает денег.', '#e08060'); return false; }
      this.player.money -= cost;
      if (unit === it) stock.splice(stock.indexOf(it), 1);
      else it.count -= unit.count;
      this.addInstance(unit);
      this.sound2d('money');
      return true;
    }

    sell(traderId, it, count) {
      if (!this.traderBuys(traderId, it)) return false;
      const def = D.ITEMS[it.id];
      if (def.type === 'weapon') this.unloadWeapon(it);
      const unit = this.removeInstance(it, count);
      const got = this.price(unit, 'sell', traderId);
      this.player.money += got;
      this.stats.money += got;
      const stock = this.traderStock[traderId];
      const ex = ['ammo', 'consumable', 'part', 'grenade'].includes(def.type) ? stock.find(s => s.id === unit.id) : null;
      if (ex) ex.count += unit.count; else stock.push(unit);
      this.sound2d('money');
      if (this.onSell) this.onSell(traderId, unit);
      return true;
    }

    dealUnit(it, count) {
      if (!STACKS.has(D.ITEMS[it.id].type) || count == null || count >= it.count) return it;
      return Object.assign({}, it, { count });
    }

    dealValue(traderId, mine, theirs) {
      let sell = 0, buy = 0;
      for (const [it, n] of mine) sell += this.price(this.dealUnit(it, n), 'sell', traderId);
      for (const [it, n] of theirs) buy += this.price(this.dealUnit(it, n), 'buy', traderId);
      const refused = mine.some(([it]) => !this.traderBuys(traderId, it));
      return { sell, buy, balance: sell - buy, refused, ok: !refused && (mine.length + theirs.length) > 0 && this.player.money + sell - buy >= 0 };
    }

    executeDeal(traderId, mine, theirs) {
      const v = this.dealValue(traderId, mine, theirs);
      if (!v.ok) { if (!v.refused && mine.length + theirs.length) this.msg('Не хватает денег на сделку.', '#e08060'); return null; }
      for (const [it, n] of mine) this.sell(traderId, it, STACKS.has(D.ITEMS[it.id].type) && n < it.count ? n : undefined);
      for (const [it, n] of theirs) this.buy(traderId, it, n);
      return v;
    }

    storeItem(list, it) {
      if (!this.player.inv.includes(it) || D.ITEMS[it.id].type === 'quest') return false;
      this.removeInstance(it);
      const ex = STACKS.has(D.ITEMS[it.id].type) ? list.find(s => s.id === it.id) : null;
      if (ex) ex.count += it.count; else list.push(it);
      this.sound2d('drop', 0.6);
      return true;
    }

    takeItem(list, it) {
      const i = list.indexOf(it);
      if (i < 0) return false;
      list.splice(i, 1);
      this.addInstance(it);
      this.sound2d('pickup');
      return true;
    }

    repairCost(it) {
      const def = D.ITEMS[it.id];
      return Math.round(def.price * (1 - it.cond) * 0.35);
    }
    repair(it) {
      const cost = this.repairCost(it);
      if (this.player.money < cost) { this.msg('Не хватает денег на ремонт.', '#e08060'); return false; }
      this.player.money -= cost; it.cond = 1; this.sound2d('repair'); return true;
    }
    canUpgrade(it, up) {
      if ((it.upg || []).includes(up.id)) return 'installed';
      if (up.tier > this.upgradeTier) return 'tools';
      if (this.player.money < up.price) return 'money';
      return 'ok';
    }
    upgrade(it, up) {
      if (this.canUpgrade(it, up) !== 'ok') return false;
      this.player.money -= up.price;
      it.upg = (it.upg || []).concat(up.id);
      this.sound2d('repair');
      this.msg('Установлено: ' + up.name, '#b8e0a0');
      return true;
    }

    sleep(hours) {
      if (this.emission.phase !== 'none') { this.msg('Какой тут сон — выброс!', '#e0a060'); return false; }
      this.player.sleepT = hours * 60;
      this.emit({ type: 'sleep', hours });
      return true;
    }

    serialize() {
      const p = this.player;
      return JSON.stringify({
        v: SAVE_VERSION, time: this.time, realTime: this.realTime, difficulty: this.difficulty, uidSeq,
        player: Object.assign({}, p, { zone: null }),
        flags: this.flags, counters: this.counters, quests: this.quests, rep: this.rep, playerRel: this.playerRel, stats: this.stats,
        pda: this.pda, log: this.log.slice(-40), discovered: this.discovered, encyclopedia: this.encyclopedia, knownStashes: this.knownStashes,
        items: this.items, stashes: this.stashes, artifacts: this.artifacts, emission: this.emission, weather: this.weather, traderStock: this.traderStock,
        upgradeTier: this.upgradeTier, nimbleOrders: this.nimbleOrders,
        actors: this.actors.map(a => this.serializeActor ? this.serializeActor(a) : a),
        anomalySeed: this.emission.count,
        placedAnomalies: this.anomalies.filter(a => !D.FIELDS.some(f => f.id === a.field))
      });
    }

    static deserialize(json, opts = {}) {
      const s = typeof json === 'string' ? JSON.parse(json) : json;
      const legacy = (s.v || 1) < SAVE_VERSION;
      const g = new Game(Object.assign({}, opts, { difficulty: s.difficulty, skipPopulation: !legacy }));
      uidSeq = Math.max(uidSeq, s.uidSeq || 1);
      g.time = s.time; g.realTime = s.realTime;
      Object.assign(g.player, s.player);
      const keep = ['flags', 'counters', 'quests', 'rep', 'playerRel', 'stats', 'pda', 'log', 'encyclopedia', 'knownStashes', 'emission', 'weather', 'traderStock', 'upgradeTier', 'nimbleOrders'];
      for (const k of legacy ? keep : keep.concat(['discovered', 'items', 'stashes', 'artifacts'])) if (s[k] != null) g[k] = s[k];
      g.normalizeWeather();
      if (legacy) {
        for (const [id, st] of Object.entries(s.stashes || {})) if (g.stashes[id]) Object.assign(g.stashes[id], { opened: st.opened, items: st.items, money: st.money, locked: st.locked });
        if (g.migrateLegacy) g.migrateLegacy(s);
        g.events.length = 0;
        return g;
      }
      g.anomalies = [];
      for (const f of D.FIELDS) g.populateField(f, (f.noRespawn || f.fixedMarker) ? 0 : s.emission.count);
      if (s.placedAnomalies) g.anomalies.push(...s.placedAnomalies);
      if (g.restoreActors) g.restoreActors(s.actors);
      if (g.afterLoad) g.afterLoad();
      g.events.length = 0;
      return g;
    }
  }

  C.Game = Game;
  C.makeItem = makeItem;
  C.PLAYER = P;
  C.DT = DT;
  C.GAME_MIN_PER_SEC = GAME_MIN_PER_SEC;
  C.SAVE_VERSION = SAVE_VERSION;
})(globalThis.Cop98 = globalThis.Cop98 || {});
