(function (L) {
  'use strict';

  class Commander {
    constructor(battle, side, opts) {
      this.b = battle;
      this.side = side;
      this.o = Object.assign({ signalAt: 40, signalRange: 130, reserve: 0.15, hunt: true, rally: true, protect: true, disengage: true, think: 1.5, huntGeneral: false }, opts || {});
      this.t = this.o.think * (side === 1 ? 0.5 : 0.8);
      this.engagedSince = new Map();
      this.recharge = new Map();
    }

    tick(dt) {
      const b = this.b;
      if (b.state !== 'battle') return;
      this.t -= dt;
      if (this.t > 0) return;
      this.t = this.o.think;
      const side = b.sides[this.side];
      const mine = b.squads.filter(s => s.side === this.side && s.alive > 0 && s.onField && s.state !== 'fled' && s.state !== 'absent');
      const foes = b.squads.filter(s => s.side !== this.side && s.alive > 0 && s.onField && s.state !== 'fled' && s.state !== 'absent');
      if (!mine.length || !foes.length) return;
      const cpOk = cost => side.cp - cost >= side.cpMax * this.o.reserve;
      if (!side.signaled && mine.some(s => s.state === 'waiting')) {
        let close = false;
        for (const m of mine) {
          for (const f of foes) {
            if (b.edgeDist(m, f) < this.o.signalRange) { close = true; break; }
          }
          if (close) break;
        }
        if ((close || b.time > this.o.signalAt) && side.cp >= L.COSTS.signal) b.signal(this.side);
      }
      if (this.o.rally && side.general && !side.generalDead) {
        const g = side.general;
        const routing = mine.filter(s => s.state === 'routing' && s.rallies < 2 && L.dist(s.cx, s.cz, g.cx, g.cz) < side.leaderR * 2);
        if (routing.length >= 2 && side.cp >= L.COSTS.rally) b.rally(this.side);
      }
      if (this.o.protect && side.general && !side.generalDead) {
        const g = side.general;
        const threat = foes.find(f => f.state !== 'routing' && L.dist(f.cx, f.cz, g.cx, g.cz) < 45);
        if (threat && g.state !== 'engaged' && !(g.order && g.order.type === 'move')) {
          const dx = g.cx - threat.cx, dz = g.cz - threat.cz;
          const l = Math.hypot(dx, dz) || 1;
          const tx = L.clamp(g.cx + dx / l * 60, 15, b.size - 15), tz = L.clamp(g.cz + dz / l * 60, 15, b.size - 15);
          if (b.terrain.passable(tx, tz, g.clsName) && side.cp >= b.orderCost(g)) b.command(g, { type: 'move', x: tx, z: tz, run: true });
        }
      }
      if (side.signaled) {
        for (const sq of mine) {
          if (sq.general || sq.cls.cav || sq.state !== 'holding' || sq.order || sq.target) continue;
          if (sq.def.fire && sq.fireTarget) continue;
          const cost = b.orderCost(sq);
          if (!cpOk(cost)) break;
          b.command(sq, { type: 'doctrine', doctrine: sq.doctrine === 'hold' || sq.doctrine === 'longhold' ? 'advance' : sq.doctrine });
        }
      }
      for (const sq of mine) {
        if (!sq.cls.cav || sq.general || sq.state === 'routing') continue;
        const cost = b.orderCost(sq);
        if (this.o.disengage && sq.state === 'engaged' && sq.target) {
          const since = this.engagedSince.get(sq.id) || b.time;
          this.engagedSince.set(sq.id, since);
          const hard = sq.target.clsName === 'HeavyInf' || sq.target.def.spear || (sq.target.def.trample && sq.target.def.trample[1] >= 50);
          if (b.time - since > 10 && (hard || sq.morale < sq.moraleMax * 0.55) && cpOk(cost)) {
            b.command(sq, { type: 'disengage' });
            this.recharge.set(sq.id, b.time + 8);
            this.engagedSince.delete(sq.id);
            continue;
          }
        } else this.engagedSince.delete(sq.id);
        if (!this.o.hunt) continue;
        if ((this.recharge.get(sq.id) || 0) > b.time) continue;
        const idle = !sq.order && (sq.state === 'holding' || sq.state === 'advancing' || sq.state === 'waiting' || !sq.target);
        if (!idle || sq.state === 'engaged') continue;
        const prey = this.pickPrey(sq, foes);
        if (prey && cpOk(cost)) b.command(sq, { type: 'attack', target: prey });
      }
    }

    pickPrey(sq, foes) {
      const b = this.b;
      let best = null, bs = 0;
      for (const f of foes) {
        const d = L.dist(sq.cx, sq.cz, f.cx, f.cz);
        if (d > 320) continue;
        let v = 0;
        if (f.state === 'routing') v = 2;
        else if (f.clsName === 'Skirmisher' || f.clsName === 'Archer') v = 5;
        else if (f.general) {
          if (!this.o.huntGeneral) continue;
          v = 6;
        }
        else if (f.clsName === 'LightInf') v = 2.5;
        else if (f.cls.cav) v = f.clsName === 'LightCav' && sq.clsName === 'HeavyCav' ? 3 : 1.5;
        else continue;
        const eff = b.terrain.effAt(f.cx, f.cz, sq.clsName);
        if (eff < 0.5) v *= 0.2;
        const guard = foes.some(o => o !== f && o.state !== 'routing' && !o.cls.cav && (o.clsName === 'HeavyInf' || o.def.spear || (f.general && o.clsName === 'LightInf')) && L.dist(o.cx, o.cz, f.cx, f.cz) < (f.general ? 30 : 22));
        if (guard) v *= 0.35;
        v *= 1 - d / 400;
        if (v > bs) { bs = v; best = f; }
      }
      return bs > 1 ? best : null;
    }
  }

  L.Commander = Commander;
})(globalThis.Legion = globalThis.Legion || {});
