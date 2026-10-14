(function (Z) {
  'use strict';

  Z.START_TIME = 8 * 60 + 30;
  Z.TIMESCALE = 30;
  Z.DATE0 = { y: 2280, m: 9, d: 1 };
  Z.dateStr = minutes => {
    const day = Math.floor(minutes / 1440);
    const d = new Date(Date.UTC(2000, Z.DATE0.m - 1, Z.DATE0.d + day));
    const dd = d.getUTCDate(), mm = d.getUTCMonth() + 1;
    return (dd < 10 ? '0' : '') + dd + '.' + (mm < 10 ? '0' : '') + mm + '.' + (Z.DATE0.y + (d.getUTCFullYear() - 2000));
  };

  class Cell {
    constructor(id, cw) {
      this.id = id;
      this.cw = cw;
      this.actors = [];
      this.items = [];
      this.objects = [];
      this.lights = [];
    }
  }
  Z.Cell = Cell;

  class Game {
    constructor(o = {}) {
      this.map = o.map || new Z.WorldMap();
      this.town = o.town || new Z.Town(this.map);
      this.ev = new Z.Emitter();
      this.rng = Z.rng(o.seed || 1234);
      this.time = Z.START_TIME;
      this.flags = {};
      this.karma = 0;
      this.rep = {};
      for (const f of Z.FACTIONS) this.rep[f.id] = { fame: 0, inf: 0 };
      this.cells = new Map();
      this.ext = this.buildExterior();
      this.cell = this.ext;
      this.player = null;
      this.messages = [];
      this.paused = false;
      this.godMode = false;
      this.hooks = [];
      for (const fn of Z.GAME_INIT || []) fn(this);
    }

    buildExterior() {
      const cw = new Z.CollisionWorld(this.map);
      for (const b of this.town.buildings) {
        const extra = b.gable ? Math.min(4.2, (b.obb ? b.obb.wid : 8) * 0.42) : (b.S.parapet || 0.3);
        b.solid = cw.addPoly(b.poly, b.base - 3, b.top + extra, { b });
      }
      for (const t of this.town.trees) if (t.sp !== 'apricot' || t.s > 0.8) cw.addCyl(t.x, t.z, 0.28 * t.s + 0.08, t.y - 1, t.y + 6 * t.s, { tree: t });
      const c = new Cell('ext', cw);
      c.exterior = true;
      this.cells.set('ext', c);
      for (const fn of Z.EXTERIOR_BUILDERS || []) fn(this, c);
      return c;
    }

    newGame(o = {}) {
      const p = new Z.Actor({ id: 'player', kind: 'player', name: o.name || 'Курьер', faction: 'player', sheet: new Z.Sheet(o.sheet || {}) });
      p.sex = o.sex || 'm';
      p.hpMax = p.sheet.maxHP();
      p.hp = p.hpMax;
      p.refreshMax();
      p.ap = p.sheet.maxAP();
      const sp = o.spawn || Z.SPAWN || { x: 470, z: 175 };
      p.x = sp.x; p.z = sp.z; p.y = this.ext.cw.groundAt(sp.x, sp.z, 100); p.yaw = sp.yaw || 0;
      p.ground = p.y;
      this.player = p;
      this.ext.actors.push(p);
      for (const fn of Z.NEWGAME || []) fn(this, o);
      return p;
    }

    msg(text, kind) {
      const m = { text, kind: kind || 'info', t: this.time };
      this.messages.push(m);
      if (this.messages.length > 60) this.messages.shift();
      this.ev.emit('msg', m);
    }

    get hour() { return (this.time / 60) % 24; }

    waterSwim(a) {
      if (!this.cell.exterior) return null;
      const depth = Z.WATER_Y - this.map.groundH(a.x, a.z);
      if (depth > 1.3) return Z.WATER_Y - 1.35;
      return null;
    }

    controlPlayer(dt, inp) {
      const p = this.player;
      if (!p || p.dead) return;
      p.yaw = inp.yaw;
      p.pitch = inp.pitch;
      p.sneak = !!inp.sneak;
      const legs = (p.crippled.lleg ? 1 : 0) + (p.crippled.rleg ? 1 : 0);
      const enc = p.weight() > p.sheet.carry();
      let speed = inp.walk ? 2.2 : 4.4;
      if (p.sneak) speed = inp.walk ? 1.4 : 2.6;
      if (legs) speed *= legs === 2 ? 0.5 : 0.7;
      if (enc) speed = Math.min(speed, 1.4);
      if (p.swim) speed = Math.min(speed, 2.0);
      if (p.equip.body && Z.item(p.equip.body.id).power && !this.flags.powerTraining) speed = Math.min(speed, 0.7);
      if (inp.aim) speed *= 0.65;
      const f = inp.move[0], s = inp.move[1];
      const L = Math.hypot(f, s);
      let tx = 0, tz = 0;
      if (L > 0.01) {
        const fx = Math.sin(p.yaw), fz = -Math.cos(p.yaw);
        const rx = Math.cos(p.yaw), rz = Math.sin(p.yaw);
        tx = (fx * f + rx * s) / Math.max(1, L) * speed;
        tz = (fz * f + rz * s) / Math.max(1, L) * speed;
      }
      const acc = p.onGround || p.swim ? 18 : 3;
      p.vx = Z.approach(p.vx, tx, acc * dt);
      p.vz = Z.approach(p.vz, tz, acc * dt);
      if (inp.jump && p.onGround && !p.swim && !enc) { p.vy = 4.3; p.onGround = false; this.ev.emit('jump', { a: p }); }
      p.moving = Math.hypot(p.vx, p.vz) > 0.3;
      p.running = p.moving && !inp.walk && Math.hypot(p.vx, p.vz) > 3;
      p.blocked = false;
      Z.moveActor(this.cell.cw, p, dt, { water: a => this.waterSwim(a) });
      if (p.landSpeed) {
        if (p.landSpeed > 9) {
          const dmg = Math.round((p.landSpeed - 9) * 14);
          p.applyDamage(dmg, { part: Math.random() < 0.5 ? 'lleg' : 'rleg', fall: true });
          this.ev.emit('hurt', { a: p, dmg, fall: true });
        }
        this.ev.emit('land', { a: p, v: p.landSpeed });
        p.landSpeed = 0;
      }
      this.clampToPlay(p);
    }

    clampToPlay(a) {
      if (!this.cell.exterior) return;
      const m = this.map;
      a.x = Z.clamp(a.x, m.x0 + 30, m.x1 - 30);
      a.z = Z.clamp(a.z, m.z0 + 30, m.z1 - 30);
      if (this.playArea && !Z.pointInPoly(a.x, a.z, this.playArea)) {
        const last = a.lastInside;
        if (last) { a.x = last[0]; a.z = last[1]; a.vx = a.vz = 0; }
        if (!this.edgeMsgT || this.time - this.edgeMsgT > 2) { this.edgeMsgT = this.time; this.msg(this.edgeText(a), 'warn'); }
      } else a.lastInside = [a.x, a.z];
    }

    edgeText(a) {
      return this.map.waterDepth(a.x, a.z) > 0.5 ? 'Течение здесь слишком сильное. Дальше не проплыть.' : 'Дальше — чужой район. Туда пока не пройти.';
    }

    update(dt, inp) {
      if (this.paused) return;
      this.time += dt * Z.TIMESCALE / 60;
      if (inp) this.controlPlayer(dt, inp);
      const p = this.player;
      if (p && !p.dead) {
        p.ap = Math.min(p.sheet.maxAP(), p.ap + p.sheet.apRegen() * dt);
        const gone = p.tickEffects(dt);
        for (const g of gone) this.ev.emit('effectEnd', { a: p, src: g.src });
        p.sheet.lowHP = p.hp < p.hpMax * 0.2;
      }
      for (const fn of this.hooks) fn(this, dt);
    }
  }

  Z.Game = Game;
  Z.GAME_INIT = Z.GAME_INIT || [];
  Z.NEWGAME = Z.NEWGAME || [];
  Z.EXTERIOR_BUILDERS = Z.EXTERIOR_BUILDERS || [];
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
