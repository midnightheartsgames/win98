(function (T) {
  'use strict';
  T.CTF = { reach: 1.3, returnTime: 60, regrab: 1.5, limit: 3, shift: 600, lastShift: 120, captureCrits: 10, act: 10, postHold: 15 };
  const C = T.CTF;
  const ATTACK_SHARE = 0.4, GUARD_SHARE = 0.3;
  const ATTACK_FIRST = ['runner', 'knight', 'inspector', 'diver', 'vet', 'welder', 'plumber', 'miner', 'strongman', 'hunter'];
  const GUARD_FIRST = ['strongman', 'plumber', 'miner', 'vet', 'welder', 'diver', 'hunter', 'inspector', 'knight', 'runner'];
  const ROLE_NEAR = 30, GRAB_NEAR = 25;
  const ORDER_HOME = 1, ORDER_GRAB = 2, ORDER_CHASE = 3, ORDER_OWN_DROPPED = 4, ORDER_ESCORT = 5, ORDER_FOE_FLAG = 6, ORDER_TUNNEL = 7, ORDER_POST = 20;
  const MOUTH_NEAR = 3;

  class Ctf {
    constructor(g) {
      this.g = g;
      this.id = 'ctf';
      this.phase = 'shift';
      this.timer = C.shift;
      this.captures = { hot: 0, cold: 0 };
      this.critT = { hot: 0, cold: 0 };
      this.winner = null;
      this.flags = {};
      this.zones = {};
      this.posts = { hot: { guard: [], bridge: [], mouth: [] }, cold: { guard: [], bridge: [], mouth: [] } };
      for (const f of g.map.flags) this.flags[f.team] = { team: f.team, home: f, x: f.x, y: f.y, z: f.z, state: 'home', carrier: null, returnT: 0, dropper: null, graceT: 0 };
      for (const c of g.map.captures) this.zones[c.team] = c;
      for (const p of g.map.posts) this.posts[p.team][p.role].push(p);
    }

    start() {
      for (const team of ['hot', 'cold']) {
        const bots = this.g.heroes.filter(h => h.brain && h.team === team);
        const ranked = order => bots.filter(h => !h.role).sort((a, b) => order.indexOf(a.merc) - order.indexOf(b.merc) || a.id - b.id);
        const attackers = ranked(ATTACK_FIRST).slice(0, Math.round(bots.length * ATTACK_SHARE));
        attackers.forEach((h, i) => { h.role = 'attack'; h.byTunnel = i % 2 === 1; h.tunnelStep = 0; });
        ranked(GUARD_FIRST).slice(0, Math.round(bots.length * GUARD_SHARE)).forEach(h => { h.role = 'guard'; });
        bots.forEach(h => { if (!h.role) h.role = 'bridge'; });
      }
    }

    respawned(h) { h.tunnelStep = 0; }

    say(what, flag, hero) {
      this.g.events.push({ type: 'flag', what, team: flag.team, hero: hero ? hero.id : -1 });
    }

    canTake(h, f) {
      if (!h.alive || h.fixed || h.team === f.team || h.flag || h.uberT > 0 || h.cloaked) return false;
      if (f.state === 'dropped' && f.dropper === h && f.graceT > 0) return false;
      return Math.hypot(h.pos.x - f.x, h.pos.z - f.z) <= C.reach && Math.abs(h.pos.y + h.h / 2 - f.y) <= 1.6;
    }

    take(h, f) {
      f.state = 'carried';
      f.carrier = h;
      f.dropper = null;
      h.flag = f;
      this.g.dropDisguise(h);
      this.say('taken', f, h);
    }

    goHome(f, what, hero) {
      if (f.carrier) f.carrier.flag = null;
      f.state = 'home';
      f.carrier = null;
      f.dropper = null;
      f.returnT = 0;
      f.x = f.home.x; f.y = f.home.y; f.z = f.home.z;
      if (what) this.say(what, f, hero);
    }

    drop(h) {
      const f = h.flag;
      if (!f) return;
      const g = this.g, x = h.pos.x, z = h.pos.z;
      h.flag = null;
      f.carrier = null;
      const ground = g.world.groundAt(x, z, h.pos.y + 0.1, 0);
      if (h.pos.y < g.map.killY || ground === -Infinity) {
        this.goHome(f, 'returned', h);
        return;
      }
      const water = g.world.waterTop(x, ground + 0.01, z);
      f.state = 'dropped';
      f.x = x; f.z = z;
      f.y = Math.max(ground, water);
      f.returnT = C.returnTime;
      f.dropper = h;
      f.graceT = C.regrab;
      this.say('dropped', f, h);
    }

    capture(h) {
      const f = h.flag, team = h.team;
      this.captures[team]++;
      this.critT[team] = C.captureCrits;
      this.goHome(f, null);
      this.say('captured', f, h);
      if (this.captures[team] >= C.limit || this.phase === 'last') this.finish(team);
    }

    finish(winner) {
      const g = this.g;
      this.winner = winner;
      this.phase = 'act';
      this.timer = C.act;
      for (const team of ['hot', 'cold']) if (this.flags[team].carrier) this.drop(this.flags[team].carrier);
      for (const h of g.heroes) if (winner && h.team !== winner) h.disarmed = true;
      if (winner) this.critT[winner] = C.act;
      g.events.push({ type: 'shiftEnd', winner });
    }

    startLastShift() {
      const g = this.g;
      this.phase = 'last';
      this.timer = C.lastShift;
      g.rules.noRespawn = true;
      for (const team of ['hot', 'cold']) this.goHome(this.flags[team], null);
      for (const h of g.heroes) if (!h.fixed) g.respawn(h);
      g.events.push({ type: 'lastShift' });
    }

    bothHome() { return this.flags.hot.state === 'home' && this.flags.cold.state === 'home'; }

    resolve() {
      if (this.captures.hot > this.captures.cold) this.finish('hot');
      else if (this.captures.cold > this.captures.hot) this.finish('cold');
      else this.startLastShift();
    }

    stepFlags(dt) {
      const g = this.g;
      for (const team of ['hot', 'cold']) {
        const f = this.flags[team];
        if (f.graceT > 0) f.graceT -= dt;
        if (f.state === 'carried') {
          f.x = f.carrier.pos.x; f.y = f.carrier.pos.y + f.carrier.h; f.z = f.carrier.pos.z;
          continue;
        }
        if (f.state === 'dropped') {
          f.returnT -= dt;
          if (f.returnT <= 0) { this.goHome(f, 'returned'); continue; }
        }
        for (const h of g.heroes) {
          if (this.canTake(h, f)) { this.take(h, f); break; }
        }
      }
    }

    stepCaptures() {
      for (const h of this.g.heroes) {
        if (!h.flag || !h.alive) continue;
        const z = this.zones[h.team];
        if (Math.hypot(h.pos.x - z.x, h.pos.z - z.z) <= z.r && Math.abs(h.pos.y - z.y) < 2) {
          this.capture(h);
          if (this.phase === 'act') return;
        }
      }
    }

    stepCrits(dt) {
      for (const team of ['hot', 'cold']) {
        if (this.critT[team] <= 0) continue;
        this.critT[team] = Math.max(0, this.critT[team] - dt);
        for (const h of this.g.heroes) if (h.team === team && h.alive) h.critT = Math.max(h.critT, this.critT[team]);
      }
    }

    wipedOut(team) { return !this.g.heroes.some(h => h.team === team && h.alive && !h.fixed); }

    step(dt) {
      if (this.phase === 'over') return;
      this.stepCrits(dt);
      if (this.phase === 'act') {
        this.timer -= dt;
        if (this.timer <= 0) { this.phase = 'over'; this.g.events.push({ type: 'over', winner: this.winner }); }
        return;
      }
      this.stepFlags(dt);
      this.stepCaptures();
      if (this.phase === 'act') return;
      if (this.phase === 'shift') {
        this.timer -= dt;
        if (this.timer > 0) return;
        this.timer = 0;
        if (this.bothHome()) {
          this.resolve();
        } else {
          this.phase = 'overtime';
          this.g.events.push({ type: 'overtime' });
        }
      } else if (this.phase === 'overtime') {
        if (this.bothHome()) this.resolve();
      } else if (this.phase === 'last') {
        this.timer -= dt;
        if (this.wipedOut('hot')) this.finish(this.wipedOut('cold') ? null : 'cold');
        else if (this.wipedOut('cold')) this.finish('hot');
        else if (this.timer <= 0) { this.timer = 0; this.finish(null); }
      }
    }

    near(h, p, r) { return Math.hypot(p.x - h.pos.x, p.z - h.pos.z) < r; }

    post(h, role) {
      const list = this.posts[h.team][role];
      const at = (h.id * 7 + Math.floor(this.g.t / C.postHold)) % list.length;
      const p = list[at];
      return { x: p.x, y: p.y, z: p.z, key: ORDER_POST + at, hold: true };
    }

    order(h) {
      const own = this.flags[h.team], foe = this.flags[T.enemyOf(h.team)];
      if (h.flag) {
        const z = this.zones[h.team];
        return { x: z.x, y: z.y, z: z.z, key: ORDER_HOME, urgent: true };
      }
      if (this.phase === 'act' || this.phase === 'over') return this.post(h, 'bridge');
      if (foe.state === 'dropped' && this.near(h, foe, GRAB_NEAR)) return { x: foe.x, y: foe.y, z: foe.z, key: ORDER_GRAB, push: true };
      if (h.role !== 'attack' && own.state === 'carried' && (h.role === 'guard' || this.near(h, own, ROLE_NEAR))) {
        return { x: own.x, y: own.carrier.pos.y, z: own.z, key: ORDER_CHASE, push: true };
      }
      if (h.role !== 'attack' && own.state === 'dropped' && this.near(h, own, ROLE_NEAR)) return { x: own.x, y: own.y, z: own.z, key: ORDER_OWN_DROPPED };
      if (h.role === 'guard' || h.role === 'bridge') return this.post(h, h.role);
      if (foe.state === 'carried') return { x: foe.x, y: foe.carrier.pos.y, z: foe.z, key: ORDER_ESCORT, push: true };
      if (h.byTunnel && h.tunnelStep < 2) {
        const m = this.posts[h.tunnelStep === 0 ? h.team : foe.team].mouth[0];
        if (this.near(h, m, MOUTH_NEAR) && Math.abs(h.pos.y - m.y) < 1.5) h.tunnelStep++;
        else return { x: m.x, y: m.y, z: m.z, key: ORDER_TUNNEL + h.tunnelStep, push: true };
      }
      return { x: foe.x, y: foe.state === 'home' ? foe.home.y - 0.9 : foe.y, z: foe.z, key: ORDER_FOE_FLAG, push: true };
    }

    hash() {
      const f = this.flags;
      return [this.phase, this.timer, this.captures.hot, this.captures.cold, f.hot.state, f.hot.x, f.hot.z, f.cold.state, f.cold.x, f.cold.z].join(',');
    }
  }

  T.Modes = { ctf: Ctf };

  if (typeof module !== 'undefined') module.exports = T;
})(globalThis.Tf98 = globalThis.Tf98 || {});
