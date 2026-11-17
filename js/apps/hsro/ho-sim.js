(function (HO) {
  'use strict';
  const H = globalThis.Hsr98;
  const N = H.HD.N;
  const T = HO.TUN;
  const EPS = 1e-4;

  const CLEAN = {
    move: c => ({ t: 'move', f: HO.sign(c.f), s: HO.sign(c.s), r: HO.sign(c.r) }),
    face: c => (Number.isFinite(c.yaw) ? { t: 'face', yaw: HO.wrapAngle(c.yaw) } : null),
    jump: () => ({ t: 'jump' }),
    autorun: c => ({ t: 'autorun', on: c.on === true }),
    target: c => (Number.isInteger(c.uid) && c.uid >= 0 ? { t: 'target', uid: c.uid } : null),
    attack: c => ({ t: 'attack', on: c.on === true }),
    cast: c => (typeof c.ab === 'string' && (HO.ABILITIES[c.ab] || HO.RACIAL_IDS.includes(c.ab)) ? { t: 'cast', ab: c.ab, uid: Number.isInteger(c.uid) && c.uid >= 0 ? c.uid : 0 } : null),
    stopCast: () => ({ t: 'stopCast' }),
    sit: c => ({ t: 'sit', on: c.on === true }),
    release: c => ({ t: 'release', mode: c.mode === 'medic' ? 'medic' : 'ghost' }),
    revive: () => ({ t: 'revive' }),
    anchorGo: c => (HO.ANCHORS && HO.ANCHORS[c.to] ? { t: 'anchorGo', to: c.to } : null),
    bind: c => (HO.ANCHORS && HO.ANCHORS[c.anchor] ? { t: 'bind', anchor: c.anchor } : null),
    repair: c => (Number.isInteger(c.uid) ? { t: 'repair', uid: c.uid } : null),
    talk: c => (Number.isInteger(c.uid) && c.uid > 0 ? { t: 'talk', uid: c.uid } : null),
    learn: c => (typeof c.ab === 'string' && HO.ABILITIES[c.ab] ? { t: 'learn', ab: c.ab } : null),
    accept: c => (HO.QUESTS && HO.QUESTS[c.q] ? { t: 'accept', q: c.q } : null),
    turnIn: c => (HO.QUESTS && HO.QUESTS[c.q] ? { t: 'turnIn', q: c.q, pick: Number.isInteger(c.pick) ? c.pick : -1, trace: typeof c.trace === 'string' && c.trace.length < 20 ? c.trace : '' } : null),
    abandon: c => (HO.QUESTS && HO.QUESTS[c.q] ? { t: 'abandon', q: c.q } : null),
    use: c => (Number.isInteger(c.uid) && c.uid > 0 ? { t: 'use', uid: c.uid } : null),
    loot: c => (Number.isInteger(c.uid) && c.uid > 0 ? { t: 'loot', uid: c.uid, i: Number.isInteger(c.i) ? c.i : -1 } : null),
    buy: c => (Number.isInteger(c.uid) && HO.ITEMS && HO.ITEMS[c.item] ? { t: 'buy', uid: c.uid, item: c.item } : null),
    sell: c => (Number.isInteger(c.uid) && Number.isInteger(c.slot) && c.slot >= 0 && c.slot < HO.BAG_MAX ? { t: 'sell', uid: c.uid, slot: c.slot } : null),
    sellJunk: c => (Number.isInteger(c.uid) ? { t: 'sellJunk', uid: c.uid } : null),
    buyback: c => (Number.isInteger(c.uid) && Number.isInteger(c.i) && c.i >= 0 && c.i < 10 ? { t: 'buyback', uid: c.uid, i: c.i } : null),
    equip: c => (Number.isInteger(c.slot) && c.slot >= 0 && c.slot < HO.BAG_MAX ? { t: 'equip', slot: c.slot } : null),
    unequip: c => (HO.GEAR_SLOTS && HO.GEAR_SLOTS.includes(c.gear) ? { t: 'unequip', gear: c.gear } : null),
    item: c => (Number.isInteger(c.slot) && c.slot >= 0 && c.slot < HO.BAG_MAX ? { t: 'item', slot: c.slot } : null),
    lift: c => (typeof c.zone === 'string' && c.zone.length < 20 ? { t: 'lift', zone: c.zone } : null),
    order: c => (HO.ORDERS && HO.ORDERS[c.o] ? { t: 'order', o: c.o } : null),
    mark: c => (Number.isInteger(c.uid) && c.uid >= 0 && (c.m === 'first' || c.m === 'stop') ? { t: 'mark', uid: c.uid, m: c.m } : null)
  };
  HO.COMMANDS = Object.keys(CLEAN);

  HO.clean = function (c) {
    if (!c || typeof c !== 'object' || !CLEAN[c.t]) return null;
    if (!Number.isInteger(c.seat) || c.seat < 0 || c.seat >= T.seats) return null;
    const k = CLEAN[c.t](c);
    if (!k) return null;
    k.seat = c.seat;
    return k;
  };

  class World {
    constructor(opts) {
      const o = opts || {};
      if (o.state) this.state = o.state;
      else {
        const zone = HO.ZONES[o.zone || 'greybox'];
        const seed = (o.seed >>> 0) || 1;
        this.state = { v: 1, zone: zone.id, seed, rng: seed, tick: 0, uid: 1, level: HO.clamp(o.level | 0 || 1, 1, HO.MAX_LEVEL), day: o.day | 0, actors: [] };
      }
      this.zone = HO.ZONES[this.state.zone];
      this.boxes = this.zone.boxes;
      this.queue = [];
      this.events = [];
      if (!o.state && o.foes !== false && this.spawnFoes) this.spawnFoes();
      if (!o.state && this.spawnNpcs) this.spawnNpcs();
      if (this.afterInit) this.afterInit();
    }

    static fromState(state) {
      return new World({ state: HO.copy(state) });
    }

    random() {
      const r = H.makeRandom(this.state.rng);
      const v = r();
      this.state.rng = r.state() >>> 0;
      return v;
    }

    hash() {
      return HO.hash(this.state);
    }

    heroAt(seat) {
      for (const a of this.state.actors) if (a.kind === 'hero' && a.seat === seat) return a;
      return null;
    }

    addHero(seat, info) {
      const sp = this.zone.spawn, i = info || {};
      const sheet = i.sheet ? (HO.normSheet ? HO.normSheet(HO.copy(i.sheet)) : HO.copy(i.sheet)) : HO.newSheet({ name: i.name, race: i.race, path: i.path, level: i.level || this.state.level, learnAll: true, look: i.look, sex: i.sex });
      const a = {
        uid: this.state.uid++, kind: 'hero', seat, sheet,
        name: sheet.name, race: sheet.race, path: sheet.path,
        x: sp.x + seat * 1.2, y: sp.y, z: sp.z, yaw: sp.yaw, vx: 0, vy: 0, vz: 0, ground: true,
        mf: 0, ms: 0, mr: 0, auto: false
      };
      if (this.initHero) this.initHero(a, sheet.lvl);
      this.state.actors.push(a);
      return a;
    }

    cmd(c) {
      const k = HO.clean(c);
      if (k) this.queue.push(k);
      return !!k;
    }

    apply(c) {
      const a = this.heroAt(c.seat);
      if (!a) return;
      if (c.t === 'move') {
        a.mf = c.f; a.ms = c.s; a.mr = c.r;
        if (c.f !== 0) a.auto = false;
      } else if (c.t === 'face') a.yaw = c.yaw;
      else if (c.t === 'autorun') a.auto = c.on;
      else if (c.t === 'jump') {
        if (a.ground && !a.dead && (!this.canMove || this.canMove(a))) {
          a.vy = T.jump;
          a.ground = false;
          a.sit = false;
          this.events.push({ k: 'jump', uid: a.uid });
        }
      } else if (this.applyCombat) this.applyCombat(c, a);
    }

    step() {
      this.events = [];
      const cmds = this.queue;
      this.queue = [];
      for (const c of cmds) this.apply(c);
      if (this.combatTick) this.combatTick();
      if (this.worldTick) this.worldTick();
      for (const a of this.state.actors) this.moveActor(a);
      this.state.tick++;
    }

    run(ticks) {
      for (let i = 0; i < ticks; i++) this.step();
    }

    wishVelocity(a) {
      const f = a.auto && a.mf === 0 ? 1 : a.mf, s = a.ms;
      if (f === 0 && s === 0) return [0, 0];
      const sin = N.sin(a.yaw), cos = N.cos(a.yaw);
      const wx = sin * f + cos * s, wz = -cos * f + sin * s;
      const len = Math.sqrt(wx * wx + wz * wz), speed = f < 0 ? T.back : T.run;
      return [wx / len * speed, wz / len * speed];
    }

    moveActor(a) {
      const dt = HO.DT;
      if ((a.dead && a.kind === 'foe') || a.kind === 'obj' || (a.kind === 'npc' && !a.wx && !a.wz && a.ground)) return;
      const free = !a.dead && (!this.canMove || this.canMove(a));
      if (a.kind === 'hero' && a.mr !== 0 && !a.dead && !(this.controlled && this.controlled(a))) a.yaw = HO.wrapAngle(a.yaw + a.mr * T.turn * dt);
      if (a.dash && (!free || this.state.tick >= a.dash.until)) a.dash = null;
      if (a.dash) {
        const dx = a.dash.x - a.x, dz = a.dash.z - a.z, d = Math.sqrt(dx * dx + dz * dz), stop = a.dash.tgt ? HO.CMB.melee * 0.6 : 0.05;
        if (d <= stop) { a.dash = null; a.vx = 0; a.vz = 0; }
        else {
          const sp = Math.min(HO.CMB.dashSpeed, (d - stop) / dt);
          a.vx = dx / d * sp; a.vz = dz / d * sp;
        }
      } else if (a.ground) {
        const w = !free ? [0, 0] : a.kind !== 'hero' ? [a.wx, a.wz] : this.wishVelocity(a);
        const k = free && this.moveScale ? this.moveScale(a) : 1;
        a.vx = w[0] * k; a.vz = w[1] * k;
      }
      const climb = a.ground ? T.step : 0.02;
      if (a.vx !== 0) a.x = this.slide(a, 'x', a.vx * dt, climb);
      if (a.vz !== 0) a.z = this.slide(a, 'z', a.vz * dt, climb);
      this.settle(a, dt);
      if (a.y < T.voidY) this.respawn(a);
    }

    overlapsFoot(b, x, z, rad) {
      const r = rad || T.radius;
      return b[0] < x + r - EPS && b[3] > x - r + EPS && b[2] < z + r - EPS && b[5] > z - r + EPS;
    }

    slide(a, axis, d, climb) {
      const r = a.r || T.radius, xi = axis === 'x' ? 0 : 2, oi = axis === 'x' ? 2 : 0;
      const pos = axis === 'x' ? a.x : a.z, other = axis === 'x' ? a.z : a.x;
      let next = pos + d;
      for (const b of this.boxes) {
        if (b[4] <= a.y + climb + EPS || b[1] >= a.y + (a.h || T.height) - EPS) continue;
        if (!(b[oi] < other + r - EPS && b[oi + 3] > other - r + EPS)) continue;
        if (next + r > b[xi] && next - r < b[xi + 3]) {
          if (d > 0 && pos + r <= b[xi] + EPS) next = b[xi] - r - EPS;
          else if (d < 0 && pos - r >= b[xi + 3] - EPS) next = b[xi + 3] + r + EPS;
        }
      }
      return next;
    }

    floorBelow(x, z, top, rad) {
      let best = -Infinity;
      for (const b of this.boxes) if (b[4] <= top + EPS && b[4] > best && this.overlapsFoot(b, x, z, rad)) best = b[4];
      return best;
    }

    ceilingAbove(a, head) {
      let best = Infinity;
      for (const b of this.boxes) if (b[1] >= head - EPS && b[1] < best && this.overlapsFoot(b, a.x, a.z, a.r)) best = b[1];
      return best;
    }

    settle(a, dt) {
      if (a.ground) {
        const g = this.floorBelow(a.x, a.z, a.y + T.step, a.r);
        if (g >= a.y - T.drop) { a.y = g; a.vy = 0; return; }
        a.ground = false;
        a.vy = 0;
      }
      a.vy = Math.max(a.vy - T.gravity * dt, -T.maxFall);
      let ny = a.y + a.vy * dt;
      if (a.vy > 0) {
        const c = this.ceilingAbove(a, a.y + (a.h || T.height));
        if (ny + (a.h || T.height) > c) { ny = c - (a.h || T.height); a.vy = 0; }
      } else {
        const g = this.floorBelow(a.x, a.z, a.y, a.r);
        if (ny <= g) {
          ny = g; a.vy = 0; a.ground = true;
          this.events.push({ k: 'land', uid: a.uid });
        }
      }
      a.y = ny;
    }

    respawn(a) {
      if (a.kind === 'foe') { if (this.respawnFoe) this.respawnFoe(a); return; }
      const sp = this.zone.spawn;
      a.x = sp.x; a.y = sp.y; a.z = sp.z; a.yaw = sp.yaw;
      a.vx = 0; a.vy = 0; a.vz = 0; a.ground = true; a.auto = false;
      this.events.push({ k: 'respawn', uid: a.uid });
    }
  }

  HO.World = World;

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
