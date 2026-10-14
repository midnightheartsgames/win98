(function (Z) {
  'use strict';

  const LIMBS = ['head', 'torso', 'larm', 'rarm', 'lleg', 'rleg'];
  Z.LIMBS = LIMBS;
  Z.LIMB_NAMES = { head: 'Голова', torso: 'Торс', larm: 'Левая рука', rarm: 'Правая рука', lleg: 'Левая нога', rleg: 'Правая нога' };
  const LIMB_SHARE = { head: 0.35, torso: 1, larm: 0.5, rarm: 0.5, lleg: 0.55, rleg: 0.55 };

  let nextId = 1;
  Z.resetIds = n => { nextId = n || 1; };

  class Actor {
    constructor(o = {}) {
      this.id = o.id || ('a' + (nextId++));
      this.kind = o.kind || 'npc';
      this.def = o.def || null;
      this.name = o.name || '';
      this.faction = o.faction || 'none';
      this.x = o.x || 0; this.y = o.y || 0; this.z = o.z || 0;
      this.yaw = o.yaw || 0; this.pitch = 0;
      this.vx = 0; this.vy = 0; this.vz = 0;
      this.onGround = true; this.ground = this.y;
      this.radius = o.radius || 0.35;
      this.height = o.height || 1.8;
      this.sheet = o.sheet || new Z.Sheet();
      this.inv = [];
      this.equip = { weapon: null, body: null, head: null, eyes: null };
      this.hpMax = o.hpMax || this.sheet.maxHP();
      this.hp = o.hp === undefined ? this.hpMax : o.hp;
      this.limbs = {};
      for (const l of LIMBS) this.limbs[l] = this.limbMax(l);
      this.crippled = {};
      this.ap = this.sheet.maxAP();
      this.rads = 0;
      this.dtBase = o.dt || 0;
      this.dead = false;
      this.effects = [];
      this.anim = { phase: 0, state: 'idle', t: 0, fire: 0, hit: 0, swing: 0 };
      this.ai = o.ai || null;
      this.flags = {};
      this.sneak = false;
      this.cell = o.cell || 'ext';
      this.look = o.look || null;
      this.essential = !!o.essential;
      this.hostile = !!o.hostile;
    }

    limbMax(l) { return Math.max(4, Math.round(this.hpMax * LIMB_SHARE[l] * (this.sheet.traits.includes('frail') && l !== 'head' && l !== 'torso' ? 0.75 : 1))); }

    count(id) { let n = 0; for (const e of this.inv) if (e.id === id) n += e.n; return n; }
    has(id, n = 1) { return this.count(id) >= n; }
    find(id) { return this.inv.find(e => e.id === id); }

    give(id, n = 1, cond) {
      const d = Z.item(id);
      if (!d || n <= 0) return null;
      if (d.stack) {
        let e = this.inv.find(x => x.id === id);
        if (!e) { e = { id, n: 0 }; this.inv.push(e); }
        e.n += n;
        return e;
      }
      let last = null;
      for (let i = 0; i < n; i++) {
        last = { id, n: 1, cond: cond === undefined ? 1 : cond };
        if (d.cat === 'weapon' && d.mag) last.loaded = 0;
        this.inv.push(last);
      }
      return last;
    }

    take(id, n = 1) {
      let left = n;
      for (let i = this.inv.length - 1; i >= 0 && left > 0; i--) {
        const e = this.inv[i];
        if (e.id !== id) continue;
        const k = Math.min(left, e.n);
        e.n -= k; left -= k;
        if (e.n <= 0) {
          for (const s in this.equip) if (this.equip[s] === e) this.equip[s] = null;
          this.inv.splice(i, 1);
        }
      }
      return n - left;
    }

    removeEntry(e) {
      const i = this.inv.indexOf(e);
      if (i >= 0) this.inv.splice(i, 1);
      for (const s in this.equip) if (this.equip[s] === e) this.equip[s] = null;
    }

    weight() {
      let w = 0;
      for (const e of this.inv) { const d = Z.item(e.id); if (d && !d.currency) w += (d.w || 0) * e.n; }
      return Math.round(w * 10) / 10;
    }

    weapon() { return this.equip.weapon ? Z.item(this.equip.weapon.id) : Z.item('fists'); }

    equipEntry(e) {
      const d = Z.item(e.id);
      if (!d) return false;
      if (d.cat === 'weapon') { this.equip.weapon = e; return true; }
      if (d.cat === 'apparel') { this.equip[d.slot] = e; this.applyApparel(); return true; }
      return false;
    }

    unequip(slot) { this.equip[slot] = null; if (slot !== 'weapon') this.applyApparel(); }

    applyApparel() {
      this.sheet.mods = this.sheet.mods.filter(m => !m.apparel);
      let glasses = false;
      for (const s of ['body', 'head', 'eyes']) {
        const e = this.equip[s];
        if (!e) continue;
        const d = Z.item(e.id);
        if (d.glasses) glasses = true;
        if (d.bonus) this.sheet.mods.push(Object.assign({ apparel: true }, d.bonus));
        if (d.rr) this.sheet.mods.push({ apparel: true, rr: d.rr });
      }
      this.sheet.glasses = glasses;
    }

    dt() {
      let dt = this.dtBase;
      for (const s of ['body', 'head']) {
        const e = this.equip[s];
        if (!e) continue;
        const d = Z.item(e.id);
        dt += d.dt * (0.6 + 0.4 * (e.cond === undefined ? 1 : e.cond));
      }
      return Math.max(0, dt + this.sheet.dtBonus());
    }

    disguise() {
      const b = this.equip.body && Z.item(this.equip.body.id), h = this.equip.head && Z.item(this.equip.head.id);
      return (b && b.faction) || (h && h.faction) || null;
    }

    refreshMax() {
      const old = this.hpMax;
      this.hpMax = this.sheet.maxHP();
      if (this.hpMax > old) this.hp += this.hpMax - old;
      this.hp = Math.min(this.hp, this.hpMax);
      for (const l of LIMBS) this.limbs[l] = Math.min(this.limbs[l], this.limbMax(l));
    }

    heal(n) {
      if (this.dead) return 0;
      const before = this.hp;
      this.hp = Math.min(this.hpMax, this.hp + n);
      return this.hp - before;
    }

    healLimbs(full) {
      for (const l of LIMBS) {
        this.limbs[l] = full ? this.limbMax(l) : Math.min(this.limbMax(l), this.limbs[l] + this.limbMax(l) * 0.5);
        if (this.limbs[l] > 0) delete this.crippled[l];
      }
    }

    applyDamage(amount, info = {}) {
      if (this.dead) return { dmg: 0 };
      let dt = this.dt();
      if (info.pierce) dt = Math.max(0, dt - info.pierce);
      if (info.explosion && info.hitDeck) dt += 25;
      let dmg = Math.max(amount * 0.2, amount - dt);
      if (info.mult) dmg *= info.mult;
      if (this.god) dmg = 0;
      const part = info.part || 'torso';
      if (this.limbs[part] !== undefined) {
        this.limbs[part] -= dmg * (part === 'torso' ? 0.6 : 1);
        if (this.limbs[part] <= 0 && !this.crippled[part]) { this.crippled[part] = true; info.crippled = part; }
      }
      this.hp -= dmg;
      this.anim.hit = 0.25;
      this.lastHit = info;
      if (this.hp <= 0) {
        if (this.essential && this.kind !== 'player') { this.hp = 1; this.downed = 8; }
        else this.die(info);
      }
      return { dmg, crippled: info.crippled };
    }

    die(info = {}) {
      this.dead = true;
      this.hp = 0;
      this.anim.state = 'dead';
      this.anim.t = 0;
      this.deathInfo = info;
      this.vx = this.vz = 0;
    }

    addEffect(src, mods, dur) {
      this.effects = this.effects.filter(e => e.src !== src);
      const m = Object.assign({ fx: src }, mods);
      this.effects.push({ src, mods: m, t: dur });
      this.sheet.mods.push(m);
    }

    tickEffects(dt) {
      for (const e of this.effects) e.t -= dt;
      const gone = this.effects.filter(e => e.t <= 0);
      if (gone.length) {
        this.effects = this.effects.filter(e => e.t > 0);
        this.sheet.mods = this.sheet.mods.filter(m => !gone.some(g => g.mods === m));
      }
      return gone;
    }

    serialize() {
      return {
        id: this.id, kind: this.kind, def: this.def, name: this.name, faction: this.faction, x: this.x, y: this.y, z: this.z, yaw: this.yaw,
        hp: this.hp, hpMax: this.hpMax, limbs: this.limbs, crippled: this.crippled, rads: this.rads, dead: this.dead, cell: this.cell,
        sheet: this.sheet.serialize(), inv: this.inv.map(e => Object.assign({}, e)), equip: Object.fromEntries(Object.entries(this.equip).map(([k, e]) => [k, e ? this.inv.indexOf(e) : -1])),
        effects: this.effects.map(e => ({ src: e.src, mods: e.mods, t: e.t })), flags: this.flags, hostile: this.hostile, ap: this.ap
      };
    }

    static restore(o, a) {
      a = a || new Actor({ id: o.id, kind: o.kind });
      Object.assign(a, { kind: o.kind, def: o.def, name: o.name, faction: o.faction, x: o.x, y: o.y, z: o.z, yaw: o.yaw, hp: o.hp, hpMax: o.hpMax, rads: o.rads, dead: o.dead, cell: o.cell, flags: o.flags || {}, hostile: o.hostile, ap: o.ap === undefined ? a.ap : o.ap });
      a.sheet = new Z.Sheet(o.sheet);
      a.limbs = Object.assign({}, o.limbs);
      a.crippled = Object.assign({}, o.crippled);
      a.inv = o.inv.map(e => Object.assign({}, e));
      a.equip = { weapon: null, body: null, head: null, eyes: null };
      for (const k in o.equip) if (o.equip[k] >= 0) a.equip[k] = a.inv[o.equip[k]];
      a.applyApparel();
      a.effects = [];
      for (const e of o.effects || []) a.addEffect(e.src, e.mods, e.t);
      if (a.dead) a.anim.state = 'dead';
      return a;
    }
  }

  Z.Actor = Actor;
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
