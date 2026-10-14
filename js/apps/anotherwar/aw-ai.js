(function (AW) {
  'use strict';

  const C = AW.C;
  const AI = AW.AI = {};

  function seeRange(watcher, target) {
    let m = C.SEE_M;
    if (target.stealth > 0) m = 1.2;
    if (target.world && target.world.night) m *= 0.85;
    return m;
  }

  AI.canSee = function (a, t) {
    if (!t || t.dead || !t.visible || t === a) return false;
    const W = a.world;
    const d = AW.isoDistM(a.x, a.y, t.x, t.y);
    if (d > seeRange(a, t)) return false;
    if (W.walk && W.walk.rayBlocked(a.x, a.y - 4, t.x, t.y - 4, 100)) return false;
    if (W.isSafe(t)) return false;
    return true;
  };

  AI.nearestHostile = function (a, maxM, needSight) {
    let best = null, bd = Infinity;
    for (const t of a.world.actors) {
      if (t === a || t.dead || !t.visible) continue;
      if (!a.world.hostile(a, t)) continue;
      const d = AW.isoDistM(a.x, a.y, t.x, t.y);
      if (d > maxM) continue;
      if (needSight && !AI.canSee(a, t)) continue;
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  };

  AI.useHealth = function (a) {
    if (a.hp / a.hpMax >= 0.4) return false;
    for (let i = 0; i < 7; i++) {
      const it = a.inv.belt[i];
      if (it && AW.Items.isHealth(it) && it.name !== 'tools' && it.name !== 'weaponkit' && it.name !== 'medkit') {
        a.world.useHealth(a, it);
        return true;
      }
    }
    return false;
  };

  class Base {
    constructor(a, args) { this.a = a; this.args = args || []; this.t = 0; }
    update() {}
    onAttacked() {}
  }

  AI.Idle = class extends Base {};

  AI.Soldier = class extends Base {
    constructor(a, args) {
      super(a, args);
      this.variant = args[0] || 'normal';
      this.mode = 'patrol';
      this.target = null;
      this.scan = AW.rng.next() * 0.6;
      this.home = [a.x, a.y];
      this.wait = 1 + AW.rng.next() * 4;
      this.shout = false;
      this.gTimer = 2 + AW.rng.next() * 6;
      this.panicT = 0;
      this.far = this.variant === 'far' || (this.variant === 'normal' && AW.rng.chance(0.5));
      a.fight = 0;
    }

    onAttacked(from) {
      const a = this.a;
      if (!from || from.dead || !a.world.hostile(a, from)) return;
      const d = AW.isoDistM(a.x, a.y, from.x, from.y);
      if (d < C.UNSEE_M * 1.6 && !(a.world.walk && a.world.walk.rayBlocked(a.x, a.y - 4, from.x, from.y - 4, 100))) {
        if (this.mode !== 'attack' || !this.target || AW.isoDistM(a.x, a.y, this.target.x, this.target.y) > d) this.engage(from);
      } else if (this.mode !== 'attack') {
        this.panicT = 6 + AW.rng.next() * 6;
        this.mode = 'panic';
      }
    }

    engage(t) {
      const a = this.a;
      this.target = t;
      if (this.mode !== 'attack') {
        this.mode = 'attack';
        a.alert = 1;
        a.world.setFight(a, 1);
        a.wmode = 1;
        if (!this.shout) {
          this.shout = true;
          if (a.enemy === 3) a.world.playSound(AW.rng.chance(0.5) ? 'enemies/enemy1/halt1' : 'enemies/enemy1/halt2', a.x, a.y, 100);
          a.world.alertAllies(a, t);
        }
      }
    }

    patrol(dt) {
      const a = this.a;
      this.scan -= dt;
      if (this.scan <= 0) {
        this.scan = 0.35 + AW.rng.next() * 0.35;
        for (const t of a.world.actors) {
          if (t === a || t.dead || !a.world.hostile(a, t)) continue;
          if (AI.canSee(a, t)) { this.engage(t); return; }
        }
      }
      if (a.path) return;
      this.wait -= dt;
      if (this.wait > 0) return;
      this.wait = 2 + AW.rng.next() * 6;
      if (AW.rng.chance(0.55)) {
        const ang = AW.rng.next() * Math.PI * 2, r = 30 + AW.rng.next() * 110;
        a.wmode = 0;
        a.walkTo(this.home[0] + Math.cos(ang) * r, this.home[1] + Math.sin(ang) * r * 0.5, { goalRadius: 12 });
      }
    }

    update(dt) {
      const a = this.a;
      if (a.attack) { AW.Combat.update(a); return; }
      if (a.panic > 0) {
        if (!a.path) {
          a.wmode = 1;
          a.walkTo(a.x + AW.random(-160, 160), a.y + AW.random(-80, 80), { goalRadius: 20 });
        }
        return;
      }
      if (this.mode === 'panic') {
        this.panicT -= dt;
        if (this.panicT <= 0) { this.mode = 'patrol'; return; }
        if (!a.path) { a.wmode = 1; a.walkTo(a.x + AW.random(-150, 150), a.y + AW.random(-80, 80), { goalRadius: 20 }); }
        this.patrolScanOnly(dt);
        return;
      }
      if (a.world.taunter && a.world.taunter.alive && a.world.hostile(a, a.world.taunter) && a.world.taunter.taunt > 0) this.target = a.world.taunter;
      if (this.mode === 'patrol') { this.patrol(dt); return; }
      this.attackStep(dt);
    }

    patrolScanOnly(dt) {
      this.scan -= dt;
      if (this.scan <= 0) {
        this.scan = 0.5;
        const t = AI.nearestHostile(this.a, C.SEE_M, true);
        if (t) this.engage(t);
      }
    }

    lose() {
      const a = this.a;
      this.target = null;
      this.mode = 'patrol';
      this.shout = false;
      a.world.setFight(a, 0);
      a.wmode = 0;
      this.home = [a.x, a.y];
      this.wait = 2;
    }

    attackStep(dt) {
      const a = this.a;
      let t = this.target;
      if (a.chaos > 0 && AW.rng.chance(0.02)) {
        const others = a.world.actors.filter(o => o !== a && !o.dead && o.visible && o.enemy !== 0 && AW.isoDistM(a.x, a.y, o.x, o.y) < 7);
        if (others.length) t = this.target = AW.rng.pick(others);
      }
      if (!t || t.dead || !t.visible || a.world.isSafe(t)) { this.lose(); return; }
      const d = AW.isoDistM(a.x, a.y, t.x, t.y);
      if (d > C.SEE_M * (1 + (12 - t.stat('lck')) / 12) + 1.5) { this.lose(); return; }
      if (AI.useHealth(a)) return;
      if (a.cooldown > 0 || a.path) {
        if (a.path && d < 1 && !this.far) a.stopWalk();
        return;
      }
      const W = a.world;
      const blocked = W.walk && W.walk.rayBlocked(a.x, a.y - 4, t.x, t.y - 4, 100);
      if (blocked) {
        const ang = Math.atan2(a.y - t.y, a.x - t.x) + (AW.rng.next() - 0.5) * 1.2;
        a.wmode = 1;
        a.walkTo(t.x + Math.cos(ang) * (C.HFAR - 20), t.y + Math.sin(ang) * (C.HFAR - 20) * 0.5, { goalRadius: 30 });
        return;
      }
      this.gTimer -= dt;
      if (d > 3 && this.gTimer <= 0) {
        this.gTimer = 2 + AW.rng.next() * 8;
        const gi = a.inv.belt.findIndex(it => it && AW.Items.isGrenade(it) && /Piechotny/.test(it.name));
        if (gi >= 0 && t.nearestEnemyDist() > 100) {
          const g = a.inv.belt[gi];
          a.inv.belt[gi] = null;
          AW.Combat.throwGrenade(a, g, t.x, t.y);
          a.cooldown = 1.4;
          return;
        }
      }
      const ready = a.weaponReady();
      if (!ready && a.weapon() && !AW.Combat.isMelee(a)) {
        if (AW.Combat.reload(a)) return;
      }
      const melee = AW.Combat.isMelee(a) || !a.weaponReady() || this.variant === 'close';
      if (melee) {
        const pd = AW.isoDist(a.x, a.y, t.x, t.y);
        if (pd <= C.HCLOSE - 4) {
          AW.Combat.startAttack(a, t);
          return;
        }
        a.wmode = 1;
        const ang = Math.atan2(a.y - t.y, a.x - t.x);
        a.walkTo(t.x + Math.cos(ang) * 26, t.y + Math.sin(ang) * 13, { goalRadius: 14 });
        return;
      }
      const range = AW.Combat.range(a) / C.HMETR;
      if (d < 1.1 && this.far && AW.rng.chance(0.25)) {
        const ang = Math.atan2(a.y - t.y, a.x - t.x) + (AW.rng.next() - 0.5);
        a.wmode = 1;
        const r = AW.random(C.HFAR - 20, C.SEE_M * C.HMETR * 0.7);
        a.walkTo(t.x + Math.cos(ang) * r, t.y + Math.sin(ang) * r * 0.5, { goalRadius: 20 });
        return;
      }
      if (d <= range) {
        if (AW.rng.chance(0.08)) {
          const ang = AW.rng.next() * Math.PI * 2;
          a.wmode = 1;
          a.walkTo(a.x + Math.cos(ang) * 60, a.y + Math.sin(ang) * 30, { goalRadius: 12 });
          return;
        }
        AW.Combat.startAttack(a, t);
        return;
      }
      a.wmode = 1;
      a.walkTo(t.x + AW.random(-40, 40), t.y + AW.random(-20, 20), { goalRadius: 20 });
    }
  };

  AI.Guardian = class extends Base {
    constructor(a, args) {
      super(a, args);
      this.post = args[0] || null;
      this.watch = args[1] || null;
      this.inside = false;
    }
    update() {
      const a = this.a;
      const W = a.world;
      const h = W.hero;
      const area = W.area(this.watch);
      if (!h || !area) return;
      const inNow = area.contains(h.x, h.y);
      if (inNow && !this.inside && !W.cutscene) {
        this.inside = true;
        W.guardTrigger(a);
      } else if (!inNow) this.inside = false;
    }
  };

  AI.RandomWalker = class extends Base {
    constructor(a, args) {
      super(a, args);
      this.areaId = args[0] || null;
      this.home = [a.x, a.y];
      this.wait = 1 + AW.rng.next() * 5;
    }
    update(dt) {
      const a = this.a;
      if (a.path) return;
      this.wait -= dt;
      if (this.wait > 0) return;
      this.wait = 3 + AW.rng.next() * 8;
      const area = this.areaId ? a.world.area(this.areaId) : null;
      let x, y;
      if (area) {
        const p = area.randomPoint();
        x = p[0]; y = p[1];
      } else {
        const ang = AW.rng.next() * Math.PI * 2, r = 30 + AW.rng.next() * 140;
        x = this.home[0] + Math.cos(ang) * r;
        y = this.home[1] + Math.sin(ang) * r * 0.5;
      }
      a.wmode = 0;
      a.walkTo(x, y, { goalRadius: 16 });
    }
  };

  AI.AreaWalker = class extends Base {
    constructor(a, args) {
      super(a, args);
      this.areaId = args[0];
      this.i = 0;
      this.wait = 1;
    }
    update(dt) {
      const a = this.a;
      const area = a.world.area(this.areaId);
      if (!area || a.path) return;
      this.wait -= dt;
      if (this.wait > 0) return;
      this.wait = 2 + AW.rng.next() * 6;
      const pts = area.poly;
      if (!pts.length) return;
      this.i = AW.random(pts.length) - 1;
      a.wmode = 0;
      a.walkTo(pts[this.i][0], pts[this.i][1], { goalRadius: 16 });
    }
  };

  AI.Undercover = class extends Base {
    constructor(a, args) {
      super(a, args);
      this.wait = 0;
    }
    update(dt) {
      const a = this.a;
      const h = a.world.hero;
      if (!h || h.dead) return;
      this.wait -= dt;
      const d = AW.dist(a.x, a.y, h.x, h.y);
      if (d > 260 && !a.path && this.wait <= 0) {
        this.wait = 1.2;
        const ang = Math.atan2(a.y - h.y, a.x - h.x);
        a.wmode = d > 500 ? 1 : 0;
        a.walkTo(h.x + Math.cos(ang) * 190, h.y + Math.sin(ang) * 95, { goalRadius: 40 });
      } else if (d < 130 && !a.path && this.wait <= 0) {
        this.wait = 2;
        const ang = Math.atan2(a.y - h.y, a.x - h.x);
        a.wmode = 0;
        a.walkTo(a.x + Math.cos(ang) * 90, a.y + Math.sin(ang) * 45, { goalRadius: 30 });
      } else if (!a.path && a.anim.name !== 'ambientlook' && AW.rng.chance(0.01)) {
        a.face(h.x, h.y);
      }
    }
  };

  AI.Rat = class extends Base {
    constructor(a, args) { super(a, args); this.wait = AW.rng.next() * 3; this.home = [a.x, a.y]; }
    update(dt) {
      const a = this.a;
      if (a.path) return;
      this.wait -= dt;
      const h = a.world.hero;
      const near = h && AW.dist(a.x, a.y, h.x, h.y) < 90;
      if (this.wait > 0 && !near) return;
      this.wait = 1.5 + AW.rng.next() * 5;
      const ang = near ? Math.atan2(a.y - h.y, a.x - h.x) + (AW.rng.next() - 0.5) : AW.rng.next() * Math.PI * 2;
      const r = 40 + AW.rng.next() * 90;
      a.wmode = 1;
      a.walkTo(this.home[0] + Math.cos(ang) * r, this.home[1] + Math.sin(ang) * r * 0.5, { goalRadius: 10 });
    }
  };

  AI.Companion = class extends Base {
    constructor(a, args) {
      super(a, args);
      this.target = null;
      this.scan = 0;
      this.retreatT = 0;
      this.hurricane = null;
    }
    onAttacked(from) {
      if (from && !from.dead && this.a.world.hostile(this.a, from)) this.target = from;
    }
    update(dt) {
      const a = this.a;
      const W = a.world;
      const h = W.hero;
      if (!h) return;
      if (a.attack) { AW.Combat.update(a); return; }
      if (this.retreatT > 0) {
        this.retreatT -= dt;
        const e = AI.nearestHostile(a, 10, false);
        if (e && !a.path) {
          const ang = Math.atan2(a.y - e.y, a.x - e.x);
          a.wmode = 1;
          a.walkTo(a.x + Math.cos(ang) * 220, a.y + Math.sin(ang) * 110, { goalRadius: 40 });
        }
        a.heal(dt * 1.2);
        return;
      }
      if (AI.useHealth(a)) return;
      this.scan -= dt;
      if (this.scan <= 0) {
        this.scan = 0.4;
        if (this.hurricane && !this.hurricane.dead && this.hurricaneT > 0) this.target = this.hurricane;
        else if (!this.target || this.target.dead || AW.isoDistM(a.x, a.y, this.target.x, this.target.y) > C.UNSEE_M + 2) {
          this.target = (h.fight || W.inCombat()) ? AI.nearestHostile(a, C.SEE_M + 1, true) : null;
        }
      }
      if (this.hurricaneT > 0) this.hurricaneT -= dt;
      const t = this.target;
      const dh = AW.dist(a.x, a.y, h.x, h.y);
      if (t && !t.dead && !W.isSafe(t) && dh < 520) {
        if (!a.fight) W.setFight(a, 1);
        if (a.cooldown > 0 || a.path) return;
        if (!a.weaponReady() && a.weapon() && !AW.Combat.isMelee(a)) { if (AW.Combat.reload(a)) return; }
        const d = AW.isoDistM(a.x, a.y, t.x, t.y);
        const melee = AW.Combat.isMelee(a) || !a.weaponReady();
        if (melee) {
          if (AW.isoDist(a.x, a.y, t.x, t.y) <= C.HCLOSE - 4) AW.Combat.startAttack(a, t);
          else { a.wmode = 1; a.walkTo(t.x, t.y, { goalRadius: 12 }); }
          return;
        }
        if (d <= AW.Combat.range(a) / C.HMETR) AW.Combat.startAttack(a, t);
        else { a.wmode = 1; a.walkTo(t.x, t.y, { goalRadius: 20 }); }
        return;
      }
      if (a.fight && !h.fight) W.setFight(a, 0);
      const keep = a.followDist || 60;
      if (dh > keep + 50) {
        if (!a.path || (a.pathGoal && AW.dist(a.pathGoal[0], a.pathGoal[1], h.x, h.y) > 60)) {
          a.wmode = dh > 260 || h.isRunning() ? 1 : 0;
          const ang = Math.atan2(a.y - h.y, a.x - h.x);
          a.walkTo(h.x + Math.cos(ang) * keep * 0.8, h.y + Math.sin(ang) * keep * 0.4, { goalRadius: 24 });
        }
      } else if (a.path && dh < keep) a.stopWalk();
      if (dh > 900 && !W.cutscene) {
        const p = W.walk && W.walk.nearestWalkable(h.x - 40, h.y + 10, 10);
        if (p) { a.x = p[0]; a.y = p[1]; a.stopWalk(); }
      }
    }
  };

  AI.Lazy = class extends Base {
    constructor(a, args) {
      super(a, args);
      this.target = args[0] || null;
    }
    update() {
      const a = this.a;
      const W = a.world;
      let t = this.target;
      if (a.attack) { AW.Combat.update(a); return; }
      if (!t || t.dead || !t.visible) {
        t = this.target = AI.nearestHostile(a, C.SEE_M, true);
        if (!t) { a.ai = null; return; }
      }
      if (a.cooldown > 0) return;
      if (!a.weaponReady() && a.weapon() && !AW.Combat.isMelee(a)) { if (AW.Combat.reload(a, false)) return; }
      const melee = AW.Combat.isMelee(a) || !a.weaponReady();
      const pd = AW.isoDist(a.x, a.y, t.x, t.y);
      if (melee) {
        if (pd <= C.HCLOSE - 4) { a.stopWalk(); AW.Combat.startAttack(a, t); }
        else if (!a.path || !a.pathGoal || AW.dist(a.pathGoal[0], a.pathGoal[1], t.x, t.y) > 30) a.walkTo(t.x, t.y, { goalRadius: 12 });
        return;
      }
      const inRange = pd <= AW.Combat.range(a) && !(W.walk && W.walk.rayBlocked(a.x, a.y - 4, t.x, t.y - 4, 100));
      if (inRange) { a.stopWalk(); AW.Combat.startAttack(a, t); }
      else if (!a.path || !a.pathGoal || AW.dist(a.pathGoal[0], a.pathGoal[1], t.x, t.y) > 40) a.walkTo(t.x, t.y, { goalRadius: 30 });
    }
  };

  AI.Interlocutor = class extends Base {
    constructor(a, args) { super(a, args); this.prev = args[0] || null; }
    update() {
      const h = this.a.world.hero;
      if (h) this.a.face(h.x, h.y);
    }
  };

  AI.create = function (a, type, args) {
    const ai = AI.make(a, type, args);
    if (ai) { ai.type = String(type || '').toLowerCase(); ai.args = args || []; }
    return ai;
  };

  AI.make = function (a, type, args) {
    const t = String(type || '').toLowerCase();
    if (t === 'soldier' || t === 'npupierdliwy') return new AI.Soldier(a, args || []);
    if (t === 'npupierdliwyclose') return new AI.Soldier(a, ['close']);
    if (t === 'npupierdliwyfar') return new AI.Soldier(a, ['far']);
    if (t === 'guardian' || t === 'pguardian') return new AI.Guardian(a, args || []);
    if (t === 'randomwalker' || t === 'prandomwalker' || t === 'nprandomwalker' || t === 'npwiesniak') return new AI.RandomWalker(a, args || []);
    if (t === 'areawalker' || t === 'pareawalker') return new AI.AreaWalker(a, args || []);
    if (t === 'undercover' || t === 'pundercover') return new AI.Undercover(a, args || []);
    if (t === 'rat' || t === 'npszczur') return new AI.Rat(a, args || []);
    if (t === 'companion') return new AI.Companion(a, args || []);
    if (t === 'lazy') return new AI.Lazy(a, args || []);
    if (t === 'interlocutor') return new AI.Interlocutor(a, args || []);
    if (t === 'idle' || t === '' || t === 'none') return null;
    return null;
  };
})(globalThis.AW = globalThis.AW || {});
