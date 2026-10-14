(function (C) {
  'use strict';
  const { clamp, lerp, wrapAngle } = C;
  const D = C.DATA, M = C.MAP;
  const DT = C.DT;
  const ONLINE_R = 170, OFFLINE_R = 190;
  const PREF_DIST = { pistol: 13, shotgun: 8, rifle: 26, sniper: 55, none: 2 };

  let actorSeq = 1;

  function pickName(g, type) {
    const r = g.rng, N = D.NAMES;
    if (type === 'bandit') return N.bandit[Math.floor(r() * N.bandit.length)];
    if (type === 'merc') return N.merc[Math.floor(r() * N.merc.length)];
    if (type === 'zombie') return 'Зомбированный';
    return N.first[Math.floor(r() * N.first.length)] + ' ' + N.last[Math.floor(r() * N.last.length)];
  }

  function spawnActor(g, typeId, x, y, opts = {}) {
    const T = D.NPC_TYPES[typeId] || {};
    const r = g.rng;
    const kind = opts.kind || T.kind || 'human';
    const a = {
      id: opts.id || ('a' + (actorSeq++)), type: typeId, kind, faction: opts.faction || T.faction || 'stalker',
      look: opts.look || (T.looks ? T.looks[Math.floor(r() * T.looks.length)] : ''),
      weapon: opts.weapon !== undefined ? opts.weapon : (T.guns ? T.guns[Math.floor(r() * T.guns.length)] : null),
      hp: opts.hp || T.hp || 100, maxHp: opts.hp || T.hp || 100, armor: opts.armor != null ? opts.armor : (T.armor || 0), skill: opts.skill || T.skill || 0.5,
      x, y, z: opts.z != null ? opts.z : g.W.groundAt(x, y, g.T.heightAt(x, y) + 0.4).h, yaw: opts.yaw != null ? opts.yaw : r() * C.TAU, vx: 0, vy: 0,
      radius: kind === 'chimera' ? 0.9 : kind === 'boar' ? 0.6 : kind === 'dog' ? 0.4 : 0.36,
      height: kind === 'chimera' ? 1.7 : kind === 'boar' ? 1.1 : kind === 'dog' ? 0.8 : kind === 'flesh' ? 1.0 : 1.8,
      name: opts.name || (kind === 'human' ? pickName(g, T.names || 'stalker') : T.names || typeId),
      role: opts.role || 'wander', state: 'idle', home: { x, y, z: opts.z, yaw: opts.yaw || 0, r: opts.homeR || 12 },
      anim: 'idle', animT: r() * 5, online: true, dead: false, deadT: 0, inv: [], money: 0,
      target: null, lastSeen: null, alert: 0, fireCd: 1 + r(), burst: 0, mag: 30, reloadT: 0, path: null, pathI: 0, repathT: 0, thinkT: r() * 0.4,
      talk: !!opts.talk, dialog: opts.dialog || null, trader: opts.trader || null, named: opts.named || null, immortal: !!opts.immortal, friendly: !!opts.friendly,
      squad: opts.squad || null, static: !!opts.static, sit: opts.sit || null, invis: 0, visibleT: 0, leapCd: 2, attackCd: 0, stuckT: 0, waitT: 0, speedK: 1, sheltered: false
    };
    if (a.weapon) { const w = D.WEAPONS[a.weapon]; a.mag = w.mag; a.npcClass = w.npc; } else a.npcClass = 'none';
    if (T.invisible) a.invis = 1;
    if (opts.extra) Object.assign(a, opts.extra);
    g.actors.push(a);
    return a;
  }

  function lootFor(g, a) {
    const r = g.rng, inv = [];
    if (a.kind === 'human' && !a.named) {
      if (a.weapon && D.WEAPONS[a.weapon]) {
        const w = D.WEAPONS[a.weapon];
        inv.push(C.makeItem(a.weapon, 1, { cond: 0.3 + r() * 0.4, mag: Math.floor(r() * w.mag) }));
        if (w.ammo) inv.push(C.makeItem('ammo_' + w.ammo[0], 5 + Math.floor(r() * (w.mag * 1.2))));
      }
      const pool = a.faction === 'zombie' ? ['bread', 'vodka', 'bandage'] : ['medkit', 'bandage', 'bread', 'sausage', 'conserva', 'vodka', 'antirad', 'energy'];
      for (let k = 0; k < 1 + Math.floor(r() * 2.5); k++) if (r() < 0.7) inv.push(C.makeItem(pool[Math.floor(r() * pool.length)], 1));
      if (a.faction === 'merc' && r() < 0.5) inv.push(C.makeItem('medkit_army', 1));
      if (r() < 0.2) inv.push(C.makeItem('f1', 1));
      a.money = a.faction === 'zombie' ? Math.floor(r() * 60) : 60 + Math.floor(r() * 550);
      if (a.faction !== 'zombie' && r() < 0.28) a.stashIntel = true;
    } else if (a.kind !== 'human') {
      const T = D.NPC_TYPES[a.type];
      if (T && T.part && r() < 0.8) inv.push(C.makeItem(T.part, 1));
    }
    a.inv = inv;
  }

  function isEnemy(g, a, b) {
    if (b === 'player') return g.hostileToPlayer(a);
    if (a.dead || b.dead) return false;
    if (a.friendly && (b.faction === 'monster' || g.hostileToPlayer(b))) return true;
    if (b.friendly && g.hostileToPlayer(a)) return true;
    if ((a.friendly || b.friendly) && a.faction !== 'monster' && b.faction !== 'monster') return false;
    if (a.angryAt === b.id || b.angryAt === a.id) return true;
    return g.relation(a.faction, b.faction) <= -50;
  }

  function targetPos(g, t) {
    if (t === 'player') { const p = g.player; return { x: p.x, y: p.y, z: p.z, h: p.crouch ? 1.2 : 1.8 }; }
    return t ? { x: t.x, y: t.y, z: t.z, h: t.height } : null;
  }

  function resolveTarget(g, a) {
    if (a.target === 'player') return g.dead ? null : 'player';
    if (!a.target) return null;
    const t = g.actorById(a.target);
    return t && !t.dead && t.online ? t : null;
  }

  Object.assign(C.Game.prototype, {
    actorById(id) { return this._actorIndex && this._actorIndex.get(id) || this.actors.find(a => a.id === id) || null; },
    spawnActor(type, x, y, opts) { const a = spawnActor(this, type, x, y, opts); this._actorIndex = null; return a; },

    damageActor(a, dmg, type, src, info = {}) {
      if (a.dead) return;
      if (a.invis && type !== 'anomaly') a.visibleT = 3;
      if (a.immortal) { if (src === 'player' && type !== 'anomaly') this.provoke(a); return; }
      a.hp -= dmg;
      a.hitT = 0.25;
      if (src === 'player') this.provoke(a);
      else if (src && typeof src === 'object' && src.id && !src.dead) { a.angryAt = src.id; if (!a.target) a.target = src.id; }
      else if (src === 'anomaly' && a.hp > 0 && this.rng() < 0.02) this.sound('scream', a.x, a.y, a.z + 1.5, 0.8);
      if (a.kind === 'human' && dmg > 8 && this.rng() < 0.4) this.sound(a.faction === 'zombie' ? 'zombie_hurt' : 'npc_hurt', a.x, a.y, a.z + 1.5, 0.8);
      else if (a.kind !== 'human' && dmg > 5 && this.rng() < 0.5) this.sound(a.kind + '_hurt', a.x, a.y, a.z + 1, 0.9);
      if (a.hp <= 0) this.killActor(a, src, info);
    },

    provoke(a) {
      if (a.dead) return;
      if (a.faction === 'monster' || a.faction === 'zombie') { a.target = 'player'; return; }
      if (a.immortal) { this.safeWarnings = (this.safeWarnings || 0) + 1; this.msg(a.name + ': Ты что творишь?! Ещё раз — и пристрелим!', '#ff9070'); if (this.safeWarnings > 3) this.changeRelation('stalker', -100); return; }
      if (!a.angry) {
        a.angry = true; a.target = 'player';
        for (const b of this.actors) if (!b.dead && b.faction === a.faction && !b.immortal && Math.hypot(b.x - a.x, b.y - a.y) < 45) { b.angry = true; b.target = 'player'; }
        if (this.onProvoke) this.onProvoke(a);
      }
    },

    killActor(a, src, info = {}) {
      a.dead = true; a.hp = 0; a.anim = 'die'; a.animT = 0; a.deadT = 0; a.target = null; a.path = null; a.invis = 0;
      lootFor(this, a);
      if (a.kind === 'human') this.sound(a.faction === 'zombie' ? 'zombie_die' : 'npc_die', a.x, a.y, a.z + 1.2, 1);
      else this.sound(a.kind + '_die', a.x, a.y, a.z + 1, 1);
      if (src === 'player') {
        if (a.kind === 'human' && a.faction !== 'zombie') this.stats.kills++; else this.stats.mutants++;
        if (a.faction === 'stalker' && !a.angry) { this.changeRelation('stalker', -40); this.rep -= 1; this.msg('Вы убили одиночку. Скадовск этого не забудет.', '#ff8060'); }
        if (a.faction === 'bandit' && !a.angry) this.changeRelation('bandit', -30);
        if (a.faction === 'merc') this.changeRelation('merc', -100);
        const key = 'enc_' + (a.kind === 'human' ? a.faction : a.kind);
        if (!this.encyclopedia[key]) { this.encyclopedia[key] = true; this.emit({ type: 'encyclopedia', id: key }); }
      }
      if (this.onKill) this.onKill(a, src);
    },

    onAlert(a, x, y, src, d) {
      if (a.dead || a.static) return;
      if (a.faction === 'monster') { if (d < 45 && !a.target && src === 'player' && a.kind !== 'flesh') a.target = 'player'; else if (!a.target) a.lastSeen = { x, y, t: this.realTime }; return; }
      if (!a.target) { a.lastSeen = { x, y, t: this.realTime }; a.alert = 1; a.yaw = Math.atan2(y - a.y, x - a.x); }
    },

    actorSees(a, tgt) {
      const tp = targetPos(this, tgt);
      if (!tp) return false;
      const dx = tp.x - a.x, dy = tp.y - a.y, d = Math.hypot(dx, dy);
      const T = D.NPC_TYPES[a.type] || {};
      let range = T.sight || (a.faction === 'zombie' ? 40 : 72);
      if (this.isNight()) range *= a.kind === 'human' ? 0.45 : 0.75;
      if (tgt === 'player') {
        const p = this.player;
        if (p.crouch) range *= 0.62;
        if (p.flashlight && this.isNight()) range *= 2.2;
        if (p.zone && p.zone.dark && !p.flashlight) range *= 0.6;
        range *= this.weatherSight();
        if (d < p.noise) return true;
      }
      if (d > range) return false;
      if (d > 4 && a.alert < 0.5) {
        const ang = Math.abs(wrapAngle(Math.atan2(dy, dx) - a.yaw));
        if (ang > 1.3) return false;
      }
      return this.W.lineOfSight(a.x, a.y, a.z + (a.kind === 'human' ? 1.6 : a.height * 0.8), tp.x, tp.y, tp.z + tp.h * 0.8);
    },

    findTarget(a) {
      let best = null, bd = 1e9;
      const range = 80;
      if (isEnemy(this, a, 'player')) {
        const d = Math.hypot(this.player.x - a.x, this.player.y - a.y);
        if (d < range) { best = 'player'; bd = d; }
      }
      for (const b of this.actors) {
        if (b === a || b.dead || !b.online) continue;
        if (b.invis && b.visibleT <= 0 && Math.hypot(b.x - a.x, b.y - a.y) > 6) continue;
        if (!isEnemy(this, a, b)) continue;
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d < bd && d < range) { bd = d; best = b; }
      }
      if (!best) return null;
      if (!this.actorSees(a, best)) {
        if (best === 'player' && a.target === 'player') return 'player';
        return a.target && a.target !== 'player' && best.id === a.target ? best : null;
      }
      return best;
    },

    moveActor(a, tx, ty, speed) {
      const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
      if (d < 0.05) { a.vx *= 0.8; a.vy *= 0.8; return true; }
      const vx = dx / d * speed, vy = dy / d * speed;
      a.vx += (vx - a.vx) * Math.min(1, DT * 8); a.vy += (vy - a.vy) * Math.min(1, DT * 8);
      const turn = Math.atan2(dy, dx);
      a.yaw += wrapAngle(turn - a.yaw) * Math.min(1, DT * 8);
      let nx = a.x + a.vx * DT, ny = a.y + a.vy * DT;
      if (!a.noCollide) [nx, ny] = this.W.collide(nx, ny, a.z + 0.5, a.z + a.height, a.radius);
      const depth = -this.T.heightAt(nx, ny);
      if (depth > 1.2 && !this.W.walkable(nx, ny)) { a.stuckT += DT * 3; return false; }
      const moved = Math.hypot(nx - a.x, ny - a.y);
      if (moved < speed * DT * 0.3) a.stuckT += DT; else a.stuckT = Math.max(0, a.stuckT - DT);
      a.x = nx; a.y = ny;
      const g = this.W.groundAt(a.x, a.y, a.z + 0.3, 0.6).h;
      a.z += (g - a.z) * Math.min(1, DT * 12);
      return d < 0.6;
    },

    followPath(a, tx, ty, speed) {
      const d = Math.hypot(tx - a.x, ty - a.y);
      if (d < 1.2) { this.moveActor(a, tx, ty, Math.min(speed, d * 2)); return true; }
      a.repathT -= DT;
      if (d < 25) {
        a.losT = (a.losT || 0) - DT;
        if (a.losT <= 0) { a.losT = 0.4 + this.rng() * 0.2; a.directOk = this.W.lineOfSight(a.x, a.y, a.z + 0.8, tx, ty, this.T.heightAt(tx, ty) + 0.8); }
        if (a.directOk && a.stuckT < 1) { a.path = null; this.moveActor(a, tx, ty, speed); return false; }
      }
      const goalMoved = !a.pathGoal || Math.hypot(a.pathGoal[0] - tx, a.pathGoal[1] - ty) > 4;
      const legDone = a.path && a.pathI >= a.path.length - 1 && a.pathLeg && Math.hypot(a.path[a.path.length - 1][0] - a.x, a.path[a.path.length - 1][1] - a.y) < 2;
      const needPath = !a.path || goalMoved || legDone || a.stuckT > 1.2;
      if (needPath && a.repathT <= 0 && (this.pathBudget || 0) > 0) {
        this.pathBudget--;
        let gx = tx, gy = ty, leg = false;
        if (d > 70) {
          const ahead = 55 / d;
          const w = this.W.nearestWalkable(a.x + (tx - a.x) * ahead, a.y + (ty - a.y) * ahead, 12);
          if (w) { gx = w[0]; gy = w[1]; leg = true; }
        }
        const direct = !leg && d < 25 && this.W.lineOfSight(a.x, a.y, a.z + 0.8, tx, ty, this.T.heightAt(tx, ty) + 0.8, { noTrees: false });
        const found = direct ? [[tx, ty]] : this.W.findPath(a.x, a.y, gx, gy, 5000);
        a.path = found && found.length ? found : [[gx, gy]];
        a.pathI = 0; a.pathGoal = [tx, ty]; a.pathLeg = leg; a.stuckT = 0;
        a.repathT = 1 + this.rng();
      }
      if (!a.path) { this.moveActor(a, tx, ty, speed); return false; }
      let wp = a.path[a.pathI];
      while (wp && Math.hypot(wp[0] - a.x, wp[1] - a.y) < 1.1 && a.pathI < a.path.length - 1) { a.pathI++; wp = a.path[a.pathI]; }
      if (!wp) return true;
      this.moveActor(a, wp[0], wp[1], speed);
      return false;
    },

    updateActors() {
      this.pathBudget = this.tickN % 2 ? 1 : 0;
      const p = this.player;
      if (!this._actorIndex || this._actorIndex.size !== this.actors.length) this._actorIndex = new Map(this.actors.map(a => [a.id, a]));
      for (const a of this.actors) {
        const dp = Math.hypot(a.x - p.x, a.y - p.y);
        const wasOnline = a.online;
        a.online = a.static ? dp < 260 : (dp < ONLINE_R || (a.online && dp < OFFLINE_R));
        if (a.online && !wasOnline && !a.static && !a.dead) {
          const w = this.W.nearestWalkable(a.x, a.y, 10);
          if (w) { a.x = w[0]; a.y = w[1]; }
          a.z = this.W.groundAt(a.x, a.y, this.T.heightAt(a.x, a.y) + 0.4).h;
          a.path = null;
        }
        if (a.dead) { a.animT += DT; a.deadT += DT; continue; }
        a.animT += DT;
        a.hitT = Math.max(0, (a.hitT || 0) - DT);
        if (a.invis) a.visibleT = Math.max(0, a.visibleT - DT);
        if (!a.online) { this.offlineActor(a); continue; }
        if (a.static) { this.staticActor(a, dp); continue; }
        a.thinkT -= DT;
        if (a.thinkT <= 0) {
          a.thinkT = 0.3 + this.rng() * 0.2;
          const t = this.findTarget(a);
          if (t) { a.target = t === 'player' ? 'player' : t.id; const tp = targetPos(this, t); a.lastSeen = { x: tp.x, y: tp.y, t: this.realTime }; a.alert = 1; a.seesTarget = true; }
          else a.seesTarget = false;
          if (a.target && !resolveTarget(this, a)) a.target = null;
          if (a.target && a.lastSeen && this.realTime - a.lastSeen.t > 25) { a.target = null; a.alert = 0.5; }
        }
        a.alert = Math.max(0, a.alert - DT * 0.03);
        if (a.target) { if (a.kind === 'human') this.humanCombat(a); else this.mutantCombat(a); }
        else if (a.guard && a.home) { a.static = !a.angry && !this.hostileToPlayer(a) && Math.hypot(a.home.x - a.x, a.home.y - a.y) < 1.5 && a.returnHome; if (!a.static) { a.returnHome = true; a.role = 'guard'; this.idleBehavior(a); } }
        else this.idleBehavior(a);
      }
      this._actorIndex = null;
    },

    staticActor(a, dp) {
      const p = this.player;
      if (a.sit) a.anim = a.sit;
      else a.anim = dp < 3.5 && a.talk ? (this.talkingTo === a ? 'talk' : 'idle') : 'idle';
      if (dp < 4 && !a.sit) { const want = Math.atan2(p.y - a.y, p.x - a.x); a.yaw += wrapAngle(want - a.yaw) * Math.min(1, DT * 3); }
      else if (a.home.yaw != null && !a.sit) a.yaw += wrapAngle(a.home.yaw - a.yaw) * Math.min(1, DT * 2);
      if (a.guard && this.hostileToPlayer(a)) { a.static = false; a.target = 'player'; }
    },

    offlineActor(a) {
      if (a.static || !a.goal) return;
      if (this.tickN % 30) return;
      const dx = a.goal.x - a.x, dy = a.goal.y - a.y, d = Math.hypot(dx, dy);
      if (d < 3) return;
      const step = Math.min(d, 1.3 * 0.5);
      a.x += dx / d * step; a.y += dy / d * step;
      a.yaw = Math.atan2(dy, dx);
    },

    idleBehavior(a) {
      const p = this.player;
      const speedW = a.kind === 'human' ? (a.faction === 'zombie' ? 0.9 : 1.4) : (D.NPC_TYPES[a.type].speed || 5) * 0.28;
      if (a.follow) {
        const d = Math.hypot(p.x - a.x, p.y - a.y);
        if (d > 4) { a.anim = d > 9 ? 'run' : 'walk'; this.followPath(a, p.x - Math.cos(p.yaw) * 2, p.y - Math.sin(p.yaw) * 2, d > 9 ? 5 : 2.6); }
        else { a.anim = 'idle'; a.vx *= 0.8; a.vy *= 0.8; }
        return;
      }
      if (a.goal) {
        const d = Math.hypot(a.goal.x - a.x, a.goal.y - a.y);
        if (d > 2.5) { a.anim = a.faction === 'zombie' ? 'zombie' : 'walk'; this.followPath(a, a.goal.x, a.goal.y, speedW * (a.goal.hurry ? 2.6 : 1)); return; }
        if (a.goal.sit) { a.anim = a.goal.sit; a.vx = a.vy = 0; return; }
      }
      if (a.alert > 0.5 && a.lastSeen && a.kind === 'human' && a.faction !== 'zombie') {
        a.anim = 'aim'; a.yaw += wrapAngle(Math.atan2(a.lastSeen.y - a.y, a.lastSeen.x - a.x) - a.yaw) * DT * 4; return;
      }
      a.waitT -= DT;
      if (a.role === 'guard') {
        const h = a.home;
        if (Math.hypot(h.x - a.x, h.y - a.y) > 1.5) { a.anim = 'walk'; this.followPath(a, h.x, h.y, 1.5); }
        else { a.anim = 'idle'; a.vx = a.vy = 0; a.yaw += wrapAngle(h.yaw - a.yaw) * DT * 2; }
        return;
      }
      if (a.wanderTo && Math.hypot(a.wanderTo[0] - a.x, a.wanderTo[1] - a.y) > 1) {
        a.anim = a.faction === 'zombie' ? 'zombie' : 'walk';
        this.followPath(a, a.wanderTo[0], a.wanderTo[1], speedW);
        if (a.stuckT > 3) a.wanderTo = null;
        return;
      }
      a.anim = 'idle'; a.vx *= 0.8; a.vy *= 0.8;
      if (a.waitT <= 0) {
        a.waitT = 4 + this.rng() * 10;
        const h = a.home, ang = this.rng() * C.TAU, r = this.rng() * h.r;
        const w = this.W.nearestWalkable(h.x + Math.cos(ang) * r, h.y + Math.sin(ang) * r, 5);
        a.wanderTo = w;
      }
    },

    humanCombat(a) {
      const t = resolveTarget(this, a);
      if (!t) { a.target = null; return; }
      const tp = targetPos(this, t);
      const dx = tp.x - a.x, dy = tp.y - a.y, d = Math.hypot(dx, dy);
      const w = a.weapon ? D.WEAPONS[a.weapon] : null;
      const cls = a.npcClass || 'rifle';
      const pref = PREF_DIST[cls] || 20;
      const zombie = a.faction === 'zombie';
      const hpK = a.hp / a.maxHp;
      if (!zombie && hpK < 0.28 && !a.fled && a.faction !== 'merc' && this.rng() < 0.004) { a.fleeT = 6; a.fled = true; }
      if (a.fleeT > 0) {
        a.fleeT -= DT; a.anim = 'run';
        this.followPath(a, a.x - dx / d * 20, a.y - dy / d * 20, 4.4);
        return;
      }
      const sees = a.seesTarget;
      a.fireCd -= DT;
      if (a.reloadT > 0) { a.reloadT -= DT; if (a.reloadT <= 0 && w) a.mag = w.mag; }
      if (!w) { a.anim = 'run'; this.followPath(a, a.x - dx / d * 10, a.y - dy / d * 10, 4); return; }
      if (sees) {
        a.yaw += wrapAngle(Math.atan2(dy, dx) - a.yaw) * Math.min(1, DT * 10);
        let mvx = 0, mvy = 0;
        if (d > pref * 1.35) { mvx = dx / d; mvy = dy / d; }
        else if (d < pref * 0.55 && !zombie) { mvx = -dx / d; mvy = -dy / d; }
        a.strafeT = (a.strafeT || 0) - DT;
        if (a.strafeT <= 0) { a.strafeT = 1 + this.rng() * 2; a.strafeDir = this.rng() < 0.5 ? -1 : this.rng() < 0.5 ? 0 : 1; }
        if (!zombie && a.strafeDir) { mvx += -dy / d * a.strafeDir * 0.8; mvy += dx / d * a.strafeDir * 0.8; }
        const ml = Math.hypot(mvx, mvy);
        if (ml > 0.1) { this.moveActor(a, a.x + mvx / ml * 3, a.y + mvy / ml * 3, zombie ? 1.0 : 2.4); a.anim = zombie ? 'zombie' : 'walk'; a.yaw = Math.atan2(dy, dx); }
        else { a.vx *= 0.7; a.vy *= 0.7; a.anim = 'aim'; }
        if (a.reloadT <= 0 && a.fireCd <= 0) {
          if (a.mag <= 0) { a.reloadT = (w.reload || 2) + 0.5; this.sound('reload_rifle', a.x, a.y, a.z + 1.4, 0.5); return; }
          const auto = w.modes && w.modes.includes('auto');
          if (a.burst <= 0) a.burst = auto ? 2 + Math.floor(this.rng() * 4) : 1;
          this.npcShoot(a, w, tp, t === 'player');
          a.burst--; a.mag--;
          a.fireCd = a.burst > 0 ? 60 / w.rpm : (auto ? 0.5 : 0.7) + this.rng() * (zombie ? 1.8 : 0.9) + (w.npc === 'sniper' ? 1.5 : 0);
          a.anim = 'fire'; a.fireFlash = 0.06;
        }
      } else {
        a.anim = zombie ? 'zombie' : 'run';
        const ls = a.lastSeen || tp;
        const arrived = this.followPath(a, ls.x, ls.y, zombie ? 1.0 : 3.4);
        if (arrived) { a.anim = 'aim'; a.yaw += DT * 1.5; }
      }
      if (a.fireFlash > 0) a.fireFlash -= DT;
    },

    npcShoot(a, w, tp, atPlayer) {
      const pellets = w.pellets || 1;
      const zombie = a.faction === 'zombie';
      const moving = Math.hypot(a.vx, a.vy) > 0.5;
      const tMove = atPlayer ? Math.hypot(this.player.vx, this.player.vy) : 0;
      let spread = w.spread * 1.2 + (1 - a.skill) * 0.03 + (moving ? 0.008 : 0) + tMove * 0.0025;
      spread /= this.diff.npcAcc;
      if (zombie) spread *= 1.6;
      if (this.isNight()) spread *= 1.25;
      const ox = a.x + Math.cos(a.yaw) * 0.4, oy = a.y + Math.sin(a.yaw) * 0.4, oz = a.z + 1.45;
      const aimZ = tp.z + tp.h * 0.62;
      const dx = tp.x - ox, dy = tp.y - oy, dz = aimZ - oz, dl = Math.hypot(dx, dy, dz);
      const baseYaw = Math.atan2(dy, dx), basePitch = Math.asin(dz / dl);
      for (let k = 0; k < pellets; k++) {
        const ang = this.rng() * C.TAU, r = Math.sqrt(this.rng()) * spread;
        const yaw = baseYaw + Math.cos(ang) * r, pitch = basePitch + Math.sin(ang) * r;
        const dir = [Math.cos(yaw) * Math.cos(pitch), Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch)];
        this.traceShot([ox, oy, oz], dir, w.dmg * (w.pellets ? 1 : 0.8), w.range, 0.3, a, k === 0);
      }
      this.sound(w.silent ? 'shot_silenced' : 'shot_' + (w.sound || 'rifle'), ox, oy, oz, 1, { npc: true });
      if (!w.silent) this.alertAround(a.x, a.y, 70, a);
    },

    mutantCombat(a) {
      const t = resolveTarget(this, a);
      if (!t) { a.target = null; return; }
      const T = D.NPC_TYPES[a.type];
      const tp = targetPos(this, t);
      const dx = tp.x - a.x, dy = tp.y - a.y, d = Math.hypot(dx, dy);
      a.attackCd -= DT; a.leapCd -= DT;
      const hpK = a.hp / a.maxHp;
      if ((a.kind === 'dog' || a.kind === 'flesh') && hpK < 0.35 && !a.fled) { a.fleeT = 5; a.fled = true; }
      if (a.fleeT > 0) { a.fleeT -= DT; a.anim = 'run'; this.followPath(a, a.x - dx / d * 25, a.y - dy / d * 25, T.speed); return; }
      if (a.invis) a.visibleT = Math.max(a.visibleT, d < 5 ? 0.5 : 0);
      if (a.leap) {
        a.leap.t -= DT;
        a.x += a.leap.vx * DT; a.y += a.leap.vy * DT; a.z += a.leap.vz * DT; a.leap.vz -= 14 * DT;
        const g = this.W.groundAt(a.x, a.y, a.z + 0.5, 1).h;
        if (a.z <= g || a.leap.t <= 0) { a.z = Math.max(g, a.z); a.leap = null; }
        a.anim = 'attack';
        if (d < T.reach + 0.5 && a.attackCd <= 0) this.mutantHit(a, t, T);
        return;
      }
      if (d < T.reach) {
        a.yaw += wrapAngle(Math.atan2(dy, dx) - a.yaw) * Math.min(1, DT * 10);
        a.vx *= 0.5; a.vy *= 0.5;
        a.anim = 'attack';
        if (a.attackCd <= 0) this.mutantHit(a, t, T);
        return;
      }
      if (T.leap && d > 5 && d < 13 && a.leapCd <= 0 && this.W.lineOfSight(a.x, a.y, a.z + 1, tp.x, tp.y, tp.z + 1)) {
        a.leapCd = 4 + this.rng() * 2;
        const tt = 0.7;
        a.leap = { vx: dx / tt, vy: dy / tt, vz: 5, t: tt };
        this.sound(a.kind + '_attack', a.x, a.y, a.z + 1, 1.2);
        return;
      }
      let speed = T.speed;
      if (a.kind === 'boar' && d < 20) speed *= 1.3;
      a.circleT = (a.circleT || 0) + DT;
      if (a.kind === 'dog' && d < 12 && d > 4 && a.circleT % 5 < 2) {
        a.circle = a.circle || (this.rng() < 0.5 ? 1 : -1);
        const tx = tp.x - dx / d * 3 + -dy / d * a.circle * 4, ty = tp.y - dy / d * 3 + dx / d * a.circle * 4;
        a.anim = 'run'; this.followPath(a, tx, ty, speed); return;
      }
      a.anim = 'run';
      this.followPath(a, tp.x, tp.y, speed);
      if (this.rng() < DT * 0.3) this.sound(a.kind + '_idle', a.x, a.y, a.z + 1, 0.8);
    },

    mutantHit(a, t, T) {
      a.attackCd = a.kind === 'dog' ? 0.8 : a.kind === 'chimera' ? 1.2 : a.kind === 'bloodsucker' ? 1.1 : 1.3;
      this.sound(a.kind + '_attack', a.x, a.y, a.z + 1, 1);
      if (t === 'player') {
        this.damagePlayer(T.melee * (0.8 + this.rng() * 0.4), 'melee', a);
        if (a.kind === 'boar' || a.kind === 'chimera') { const p = this.player, dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy) || 1; p.vx += dx / d * 5; p.vy += dy / d * 5; }
        if (a.kind === 'bloodsucker') { a.hp = Math.min(a.maxHp, a.hp + 10); a.visibleT = 2; }
      } else this.damageActor(t, T.melee, 'melee', a, {});
    },

    serializeActor(a) {
      const o = {};
      for (const k of Object.keys(a)) if (!['path', 'pathGoal', 'leap', 'wanderTo'].includes(k)) o[k] = a[k];
      return o;
    },

    restoreActors(list) {
      this.actors = list.map(o => Object.assign({ path: null, pathI: 0, repathT: 0, stuckT: 0 }, o));
      for (const a of this.actors) { const n = parseInt(String(a.id).replace(/\D/g, ''), 10); if (n >= actorSeq) actorSeq = n + 1; }
      this._actorIndex = null;
    }
  });

  const SQUAD_SPOTS = {
    stalker: ['camp_cranes', 'camp_claw', 'camp_oakpine', 'camp_lake', 'camp_stoyanka', 'claw', 'oakpine', 'izumrud', 'fuel', 'dredge_pier', 'noah_pier', 'lake_pier', 'campfire_skadovsk', 'krug_door'],
    bandit: ['stoyanka', 'camp_stoyanka', 'forestry_yard', 'camp_forestry', 'fuel', 'camp_cranes', 'lair_south']
  };

  function spotPos(g, name) {
    const m = g.W.markers[name];
    if (m) return { x: m.x, y: m.y };
    const poi = M.POI[name];
    if (poi) return { x: poi.x, y: poi.y };
    return null;
  }

  function initPopulation(g) {
    const Mk = g.W.markers;
    const at = (name, type, opts = {}) => { const m = Mk[name]; if (!m) return null; return g.spawnActor(type, m.x, m.y, Object.assign({ z: m.z, yaw: m.yaw, static: true, role: 'static' }, opts)); };
    at('beard', 'stalker', { id: 'beard', name: 'Борода', look: 'beard', weapon: null, talk: true, dialog: 'beard', trader: 'beard', named: 'beard', immortal: true });
    at('owl', 'stalker', { id: 'owl', name: 'Сыч', look: 'owl', weapon: null, talk: true, dialog: 'owl', trader: 'owl', named: 'owl', immortal: true });
    at('nimble', 'stalker', { id: 'nimble', name: 'Шустрый', look: 'nimble', weapon: null, talk: true, dialog: 'nimble', trader: 'nimble', named: 'nimble', immortal: true });
    at('cardan', 'stalker', { id: 'cardan', name: 'Кардан', look: 'cardan', weapon: null, talk: true, dialog: 'cardan', named: 'cardan', immortal: true });
    at('sultan', 'bandit', { id: 'sultan', name: 'Султан', look: 'sultan', weapon: 'fort', talk: true, dialog: 'sultan', trader: 'sultan', named: 'sultan', immortal: true });
    at('zveroboy', 'veteran', { id: 'zveroboy', name: 'Зверобой', look: 'zarya', weapon: 'chaser', talk: true, dialog: 'zveroboy', named: 'zveroboy', immortal: true });
    at('owl_guard', 'veteran', { name: 'Хмурый', look: 'zarya', weapon: 'ak', talk: true, dialog: 'guard', immortal: true });
    for (const k of ['bandit1', 'bandit2', 'bandit3']) at(k, 'bandit', { talk: true, dialog: 'bandit', immortal: true });
    const barLooks = ['loner', 'loner2', 'zarya', 'loner'];
    ['bar1', 'bar2', 'bar3', 'bar4', 'bar5'].forEach((k, i) => at(k, 'stalker', { look: barLooks[i % barLooks.length], weapon: i % 2 ? 'aksu' : 'toz', talk: true, dialog: 'stalker', immortal: true, sit: 'sit' }));
    at('bar_guitar', 'stalker', { name: 'Гитарист Кеша', look: 'loner2', weapon: null, talk: true, dialog: 'guitar', immortal: true, sit: 'guitar' });
    for (const k of ['guard_deck1', 'guard_deck2', 'guard_out1', 'guard_out2', 'guard_bridge']) at(k, 'stalker', { weapon: 'ak', talk: true, dialog: 'guard', immortal: true });
    at('noah', 'stalker', { id: 'noah', name: 'Ной', look: 'noah', weapon: 'toz', talk: true, dialog: 'noah', trader: 'noah', named: 'noah', immortal: true });
    at('noah_dog', 'dog', { id: 'noah_dog', name: 'Пёс Ноя', kind: 'dog', faction: 'stalker', friendly: true, immortal: true, weapon: null });
    at('tesak', 'merc', { id: 'tesak', name: 'Тесак', look: 'tesak', weapon: 'trs', talk: true, dialog: 'tesak', named: 'tesak', hp: 220, armor: 0.4, extra: { stationGuard: true, guard: true } });
    for (const k of ['merc_up1', 'merc_up2', 'merc_in1', 'merc_in2', 'merc_tower', 'merc_gate1', 'merc_gate2', 'merc_yard1', 'merc_yard2']) at(k, 'merc', { talk: true, dialog: 'merc', extra: { stationGuard: true, guard: true }, weapon: k === 'merc_tower' ? 'svd' : undefined });
    for (const k of ['wps_merc1', 'wps_merc2', 'wps_merc3', 'wps_merc4']) at(k, 'merc', { talk: true, dialog: 'merc', extra: { guard: true, wpsGuard: true } });
    for (const k of ['saw_zombie1', 'saw_zombie2', 'saw_zombie3']) { const m = Mk[k]; g.spawnActor('zombie', m.x, m.y, { z: m.z, homeR: 8 }); }
    for (const k of ['dredge_deck1', 'dredge_deck2', 'dredge_in', 'dredge_top']) { const m = Mk[k]; g.spawnActor('zombie', m.x, m.y, { z: m.z, homeR: 3, extra: { dredgeZombie: true, noCollide: false } }); }
    for (const k of ['lair1', 'lair2', 'lair3']) { const m = Mk[k]; g.spawnActor('bloodsucker', m.x, m.y, { z: m.z, homeR: 10, extra: { lairBloodsucker: true } }); }
    const camps = ['camp_claw', 'camp_oakpine', 'camp_lake', 'camp_cranes'];
    for (const c of camps) {
      const m = Mk[c];
      const n = 2 + Math.floor(g.rng() * 2);
      for (let k = 0; k < n; k++) {
        const a = k / n * C.TAU;
        g.spawnActor(k === 0 && g.rng() < 0.4 ? 'veteran' : 'stalker', m.x + Math.cos(a) * 2.2, m.y + Math.sin(a) * 2.2, { yaw: a + Math.PI, talk: true, dialog: 'stalker', role: 'camp', extra: { goal: { x: m.x + Math.cos(a) * 2.2, y: m.y + Math.sin(a) * 2.2, sit: 'sit' }, campfire: c } });
      }
    }
    spawnSquads(g);
    spawnLairs(g, true);
    const bus = Mk.tutorial_bus;
    g.spawnActor('flesh', bus.x + 8, bus.y + 6, { homeR: 10, extra: { tutorialFlesh: true } });
    g.spawnActor('flesh', bus.x + 12, bus.y + 2, { homeR: 10 });
    const corpse = g.spawnActor('novice', 908, 694, { name: 'Сталкер Жук', weapon: 'pm' });
    corpse.hp = 0; corpse.dead = true; corpse.anim = 'die'; corpse.animT = 5; corpse.deadT = 999;
    corpse.inv = [C.makeItem('ammo_9x18', 12), C.makeItem('bandage', 2)]; corpse.money = 180; corpse.tutorialCorpse = true;
  }

  function spawnSquads(g) {
    g.squads = g.squads || [];
    const mk = (faction, n, spot) => {
      const pos = spotPos(g, spot);
      if (!pos) return;
      const id = 'sq' + g.squads.length;
      const members = [];
      for (let k = 0; k < n; k++) {
        const type = faction === 'bandit' ? 'bandit' : (k === 0 ? 'stalker' : g.rng() < 0.5 ? 'novice' : 'stalker');
        const a = g.spawnActor(type, pos.x + (g.rng() - 0.5) * 6, pos.y + (g.rng() - 0.5) * 6, { squad: id, talk: faction === 'stalker', dialog: faction === 'stalker' ? 'stalker' : 'bandit', role: 'squad' });
        members.push(a.id);
      }
      g.squads.push({ id, faction, members, spot, waitT: 60 + g.rng() * 120 });
    };
    mk('stalker', 3, 'fuel'); mk('stalker', 2, 'izumrud'); mk('stalker', 3, 'lake_pier'); mk('stalker', 2, 'noah_pier');
    mk('bandit', 3, 'forestry_yard'); mk('bandit', 2, 'stoyanka');
  }

  const LAIRS = [
    ['lair_forestry', 'dog', 4], ['lair_fuel', 'boar', 3], ['lair_izumrud', 'dog', 4], ['lair_stoyanka', 'flesh', 3],
    ['lair_oakpine', 'dog', 4], ['lair_northshore', 'boar', 2], ['lair_ne', 'dog', 4], ['lair_south', 'flesh', 3],
    ['lair_plateau', 'dog', 3], ['lair_swamp', 'flesh', 2], ['lair_beton', 'boar', 2], ['lair_east', 'dog', 3]
  ];

  function spawnLairs(g, initial) {
    g.lairs = g.lairs || {};
    for (const [mk, type, n] of LAIRS) {
      const m = g.W.markers[mk];
      if (!m) continue;
      const alive = g.actors.filter(a => a.lair === mk && !a.dead).length;
      if (!initial && alive > 0) continue;
      if (!initial && Math.hypot(g.player.x - m.x, g.player.y - m.y) < 120) continue;
      for (let k = 0; k < n; k++) {
        const w = g.W.nearestWalkable(m.x + (g.rng() - 0.5) * 10, m.y + (g.rng() - 0.5) * 10, 8);
        if (!w) continue;
        g.spawnActor(type, w[0], w[1], { homeR: 18, extra: { lair: mk } });
      }
    }
  }

  function updateSquads(g) {
    if (!g.squads) return;
    for (const sq of g.squads) {
      const members = sq.members.map(id => g.actorById(id)).filter(a => a && !a.dead);
      if (!members.length) continue;
      const leader = members[0];
      if (leader.target) continue;
      sq.waitT -= 1;
      const pos = spotPos(g, sq.spot);
      if (g.emission.phase === 'warning' && !sq.hiding) {
        sq.hiding = true;
        let best = null, bd = 1e9;
        for (const z of g.W.zones) if (z.shelter && !z.base) { const d = Math.hypot(z.x - leader.x, z.y - leader.y); if (d < bd) { bd = d; best = z; } }
        if (best) members.forEach((a, i) => { a.goal = { x: best.x + (i - 1) * 0.8, y: best.y + (i % 2) * 0.8, hurry: true }; });
        continue;
      }
      if (g.emission.phase === 'none') sq.hiding = false;
      if (sq.waitT > 0) {
        if (pos) members.forEach((a, i) => { if (!a.goal || a.goal.spot !== sq.spot) { const ang = i / members.length * C.TAU; a.goal = { x: pos.x + Math.cos(ang) * 2.5, y: pos.y + Math.sin(ang) * 2.5, spot: sq.spot, sit: sq.spot.startsWith('camp') && g.rng() < 0.7 ? 'sit' : null }; } });
        continue;
      }
      const list = SQUAD_SPOTS[sq.faction];
      let next = sq.spot;
      while (next === sq.spot) next = list[Math.floor(g.rng() * list.length)];
      sq.spot = next; sq.waitT = 90 + g.rng() * 240;
      const np = spotPos(g, next);
      if (np) members.forEach((a, i) => { const ang = i / members.length * C.TAU; a.goal = { x: np.x + Math.cos(ang) * 2.5, y: np.y + Math.sin(ang) * 2.5, spot: next }; });
    }
  }

  const baseUpdate = C.Game.prototype.updateActors;
  C.Game.prototype.updateActors = function () {
    baseUpdate.call(this);
    if (this.tickN % 60 === 0) updateSquads(this);
  };
  C.Game.prototype.respawnLairs = function () { spawnLairs(this, false); };
  C.Game.prototype.cleanupCorpses = function () {
    const p = this.player;
    this.actors = this.actors.filter(a => !a.dead || a.named || a.keep || a.tutorialCorpse || Math.hypot(a.x - p.x, a.y - p.y) < 60 || a.deadT < 600);
    this._actorIndex = null;
  };

  C.initPopulation = initPopulation;
  C.spawnActorRaw = spawnActor;
})(globalThis.Cop98 = globalThis.Cop98 || {});
