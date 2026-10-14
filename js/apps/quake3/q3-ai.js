(function (Q) {
  'use strict';
  const WP = Q.WP;
  const SK = {
    react: [0.7, 0.5, 0.34, 0.22, 0.14],
    aimErr: [0.16, 0.1, 0.065, 0.042, 0.028],
    turn: [3.4, 5, 7.5, 10.5, 15],
    fov: [1.7, 1.9, 2.1, 2.3, 2.6],
    strafe: [0.2, 0.45, 0.7, 0.85, 1],
    jump: [0, 0.08, 0.2, 0.35, 0.5],
    lead: [0.25, 0.5, 0.75, 0.9, 1],
    timing: [0, 0, 1, 1, 1],
    track: [0.35, 0.55, 0.7, 0.82, 0.92]
  };
  const WVAL = { 2: 5, 3: 30, 4: 22, 5: 62, 6: 52, 7: 56, 8: 46, 9: 70 };
  const RANGE = { 1: [0, 60], 2: [0, 3000], 3: [0, 380], 4: [150, 700], 5: [110, 1100], 6: [0, 760], 7: [300, 8000], 8: [0, 900], 9: [150, 1200] };
  const PREF = { 1: 1, 2: 8, 3: 50, 4: 22, 5: 58, 6: 54, 7: 56, 8: 44, 9: 70 };

  class BotAI {
    constructor(game, p) {
      this.g = game;
      this.p = p;
      this.def = Q.BOTS[p.botKey] || Q.BOTS.sarge;
      this.si = Q.clamp((p.skill | 0) - 1, 0, 4);
      this.yaw = 0;
      this.pitch = 0;
      this.phase = p.id % 4;
      this.reset();
    }

    reset() {
      this.path = null;
      this.pi = 0;
      this.goal = null;
      this.nextGoal = 0;
      this.enemy = null;
      this.enemySeen = -10;
      this.enemyPos = null;
      this.reactAt = 0;
      this.aimOff = [0, 0];
      this.aimOffT = 0;
      this.strafe = 1;
      this.strafeT = 0;
      this.stuckT = 0;
      this.stuckPos = null;
      this.stuckCheck = 0;
      this.wpChoose = 0;
      this.wantWeapon = 0;
      this.lastNode = -1;
      this.jumpNext = false;
      this.alertFrom = null;
      this.alertT = -10;
    }

    onSpawn() { this.reset(); this.yaw = this.p.ps.yaw; this.pitch = 0; }
    onTeleport() { this.path = null; this.nextGoal = 0; this.yaw = this.p.ps.yaw; }
    onPickup() { }
    intermission() { }

    onDamaged(att) {
      if (!att || att === this.p || this.g.sameTeam(att, this.p)) return;
      this.alertFrom = att;
      this.alertT = this.g.time;
      if (!this.enemy || !this.enemy.alive || this.g.time - this.enemySeen > 1) {
        this.enemy = att;
        this.enemyPos = att.ps.origin.slice();
        this.enemySeen = this.g.time - 0.5;
        this.reactAt = Math.max(this.reactAt, this.g.time + SK.react[this.si] * 0.8);
      }
    }

    onDeath(killer) {
      if (killer && this.g.rng() < 0.22 && this.def.death) this.say(this.g.rng.pick(this.def.death));
      this.reset();
    }

    onKill(victim) {
      if (this.g.rng() < 0.25 && this.def.kill) this.say(this.g.rng.pick(this.def.kill));
      if (this.g.rng() < 0.12) this.p.gesture = this.g.time;
      if (victim === this.enemy) this.enemy = null;
      this.nextGoal = 0;
    }

    say(text) {
      if (this.g.time - (this.p.chatCd || -100) < 6) return;
      this.p.chatCd = this.g.time;
      this.g.chat(this.p, text);
    }

    eye() { const o = this.p.ps.origin; return [o[0], o[1], o[2] + this.p.ps.viewheight]; }

    canSee(q) {
      const e = this.eye();
      const t = q.ps.origin;
      const w = this.g.world;
      if (w.visible(e, [t[0], t[1], t[2] + 16])) return true;
      return w.visible(e, [t[0], t[1], t[2] - 8]);
    }

    perceive() {
      const g = this.g, p = this.p, now = g.time;
      const fwdYaw = this.yaw;
      const half = SK.fov[this.si] / 2;
      let best = null, bs = Infinity;
      for (const q of g.players) {
        if (q === p || !q.alive || g.sameTeam(q, p)) continue;
        const d = Q.vdist(q.ps.origin, p.ps.origin);
        if (d > 4000) continue;
        const inv = q.powerups.invis > now;
        if (inv && d > 260 && now - q.lastFire > 0.4) continue;
        const dir = Q.vsub(q.ps.origin, p.ps.origin);
        const ang = Math.abs(Q.angDiff(fwdYaw, Math.atan2(dir[1], dir[0])));
        const heard = now - q.lastFire < 0.3 && d < 1400;
        const hurtBy = this.alertFrom === q && now - this.alertT < 2;
        if (ang > half && d > 180 && !heard && !hurtBy && q !== this.enemy) continue;
        if (!this.canSee(q)) continue;
        let score = d;
        if (q === this.enemy) score *= 0.55;
        if (hurtBy) score *= 0.6;
        score *= 0.6 + Math.min(1.2, (q.health + q.armor) / 250);
        if (score < bs) { bs = score; best = q; }
      }
      if (best) {
        if (best !== this.enemy || now - this.enemySeen > 1.2) this.reactAt = now + SK.react[this.si] * (0.8 + g.rng() * 0.5);
        this.enemy = best;
        this.enemySeen = now;
        this.enemyPos = best.ps.origin.slice();
        this.enemyVel = best.ps.velocity.slice();
      } else if (this.enemy && (!this.enemy.alive || now - this.enemySeen > 4)) {
        this.enemy = null;
      }
    }

    strength(q) {
      let w = 0;
      for (let i = 3; i <= 9; i++) if (q.weapons[i] && q.ammo[i] > 0) w = Math.max(w, PREF[i]);
      return q.health + q.armor * 0.8 + w * 1.5 + (q.powerups.quad > this.g.time ? 150 : 0);
    }

    itemValue(it) {
      const p = this.p, d = it.def;
      if (d.type === 'weapon') {
        if (!p.weapons[d.wp]) return (WVAL[d.wp] || 10) * (this.def.fav === d.wp ? 1.35 : 1);
        return p.ammo[d.wp] < Q.WEAPONS[d.wp].pickup ? 12 : 1.5;
      }
      if (d.type === 'ammo') {
        if (!p.weapons[d.wp]) return 1.5;
        const r = p.ammo[d.wp] / (d.wp === WP.LIGHTNING || d.wp === WP.MACHINEGUN || d.wp === WP.PLASMA ? 150 : 25);
        return r >= 1 ? 0 : 14 * (1 - r) * (PREF[d.wp] / 50);
      }
      if (d.type === 'health') {
        if (d.max === 100 && p.health >= 100) return 0;
        if (p.health >= 200) return 0;
        const need = Math.max(0, (d.max === 100 ? 100 : 200) - p.health);
        const urgency = p.health < 50 ? 2.2 : p.health < 80 ? 1.4 : 1;
        if (d.amount === 100) return 34 + need * 0.35;
        return Math.min(d.amount, need) * 0.9 * urgency + (d.amount === 5 ? 1 : 0);
      }
      if (d.type === 'armor') {
        if (p.armor >= 200) return 0;
        const need = 200 - p.armor;
        if (d.amount === 5) return 3;
        return Math.min(d.amount, need) * 0.55 + (d.amount === 100 ? 14 : 4);
      }
      if (d.type === 'powerup') return this.si >= 1 ? (d.pw === 'quad' ? 95 : 70) : 30;
      if (d.type === 'holdable') return p.holdable ? 0 : d.hold === 'medkit' ? 22 : 12;
      return 0;
    }

    chooseGoal() {
      const g = this.g, p = this.p, nav = g.nav, now = g.time;
      if (!nav || !nav.nodes.length) return;
      const from = nav.nearest(p.ps.origin);
      if (from < 0) { this.path = null; this.nextGoal = now + 0.5; return; }
      const dj = nav.dijkstra(from);
      let best = null, bs = 0;
      const fight = this.enemy && now - this.enemySeen < 1.5;
      const weak = fight && this.strength(p) < this.strength(this.enemy) * 0.75;
      const consider = (it) => {
        let v = this.itemValue(it);
        if (v <= 0) return;
        const node = it.node !== undefined ? it.node : (it.node = nav.nearest(it.pos, 96));
        if (node < 0 || nav.nodes[node].comp !== nav.mainComp) return;
        const tt = dj.dist[node];
        if (!isFinite(tt)) return;
        let wait = 0;
        if (!it.active) {
          if (it.dropped) return;
          wait = it.respawnAt - now - tt;
          if (wait > 0) {
            if (!SK.timing[this.si] || wait > 12) return;
            v *= 0.7;
          } else wait = 0;
        }
        if (weak && (it.def.type === 'health' || it.def.type === 'armor')) v *= 1.8;
        if (fight && !weak && it.def.type !== 'weapon' && it.def.type !== 'powerup') v *= 0.6;
        const s = v / (0.6 + tt + wait) * (it === this.goal ? 1.25 : 1);
        if (s > bs) { bs = s; best = { it, node, tt }; }
      };
      for (const it of g.items) consider(it);
      for (const it of g.dropped) consider(it);
      let goalNode = best ? best.node : -1;
      if (fight && !weak && this.enemy && (!best || bs < 6)) {
        const en = nav.nearest(this.enemy.ps.origin, 200);
        const w = p.weapon;
        const far = Q.vdist(this.enemy.ps.origin, p.ps.origin) > (RANGE[w] ? RANGE[w][1] * 0.8 : 600);
        if (en >= 0 && isFinite(dj.dist[en]) && (far || this.g.rng() < 0.5)) { goalNode = en; best = null; }
      } else if (!best && this.enemyPos && now - this.enemySeen < 5 && this.si >= 1) {
        const en = nav.nearest(this.enemyPos, 200);
        if (en >= 0 && isFinite(dj.dist[en])) goalNode = en;
      }
      if (goalNode < 0) {
        for (let tries = 0; tries < 12; tries++) {
          const n = g.rng.int(nav.nodes.length);
          if (nav.nodes[n].comp === nav.mainComp && isFinite(dj.dist[n]) && dj.dist[n] > 1.5) { goalNode = n; break; }
        }
      }
      this.goal = best ? best.it : null;
      if (goalNode >= 0 && isFinite(dj.dist[goalNode])) {
        this.path = nav.pathFrom(dj.prev, goalNode);
        this.pi = 0;
        this.goalNode = goalNode;
      } else this.path = null;
      this.nextGoal = now + 0.7 + g.rng() * 0.8;
    }

    followPath() {
      const g = this.g, p = this.p, nav = g.nav;
      const out = { dir: null, jump: false, crouch: false };
      if (!this.path || !nav) return out;
      const o = p.ps.origin;
      while (this.pi < this.path.length) {
        const n = nav.nodes[this.path[this.pi]];
        const dh = Q.vdist2(n.pos, o), dz = n.pos[2] - o[2];
        const reach = n.flags & 3 ? 10 : 22;
        if (dh < reach && dz < 30 && dz > -60) {
          if (n.flags & 1 && p.ps.onGround) break;
          this.lastNode = this.path[this.pi];
          this.pi++;
          continue;
        }
        break;
      }
      if (this.pi >= this.path.length) { this.path = null; this.nextGoal = 0; return out; }
      const cur = nav.nodes[this.path[this.pi]];
      let target = cur.pos;
      const prevId = this.pi > 0 ? this.path[this.pi - 1] : this.lastNode;
      const type = prevId >= 0 ? nav.linkType(prevId, this.path[this.pi]) : 'walk';
      if (type === 'pad' && !p.ps.onGround) {
        out.dir = Q.vnorm([target[0] - o[0], target[1] - o[1], 0]);
        out.air = true;
        return out;
      }
      if (type === 'walk' && this.pi + 1 < this.path.length && p.ps.onGround) {
        const nxt = nav.nodes[this.path[this.pi + 1]];
        const lt = nav.linkType(this.path[this.pi], this.path[this.pi + 1]);
        if (lt === 'walk' && !(cur.flags & 3) && Math.abs(nxt.pos[2] - o[2]) < 18 && Q.vdist2(o, cur.pos) < 70) {
          const t = g.world.trace(o, [nxt.pos[0], nxt.pos[1], o[2]], Q.PLAYER_MINS, Q.PLAYER_MAXS, Q.MASK_PLAYER);
          if (t.fraction >= 1) target = nxt.pos;
        }
      }
      if (type === 'jump' && p.ps.onGround && Q.vdist2(o, target) < 90) out.jump = true;
      out.dir = Q.vnorm([target[0] - o[0], target[1] - o[1], 0]);
      if (Q.vdist2(o, target) > 420 || (p.ps.onGround && target[2] - o[2] > 64 && type !== 'pad')) { this.path = null; this.nextGoal = 0; }
      return out;
    }

    chooseWeapon(dist) {
      const p = this.p;
      let best = p.weapon, bs = -Infinity;
      for (let w = 1; w <= 9; w++) {
        if (!p.weapons[w] || (w !== 1 && p.ammo[w] <= 0)) continue;
        const r = RANGE[w];
        let s = PREF[w];
        if (w === this.def.fav) s *= 1.25;
        if (dist < r[0]) s *= 0.25;
        if (dist > r[1]) s *= w === 7 ? 1 : 0.2;
        if (w === 7 && dist < 250) s *= 0.7;
        if (w === 3 && dist < 200) s *= 1.4;
        if (w === 6 && dist > 768) s = 0;
        if (w === 1) s = dist < 50 ? 30 : 0;
        if (w !== 1 && w !== 2 && p.ammo[w] < 3) s *= 0.6;
        if (s > bs) { bs = s; best = w; }
      }
      return best;
    }

    aimAt() {
      const g = this.g, p = this.p, e = this.enemy;
      const eye = this.eye();
      const w = p.weapon;
      const W = Q.WEAPONS[w];
      let target = [e.ps.origin[0], e.ps.origin[1], e.ps.origin[2] + 10];
      const dist = Q.vdist(eye, target);
      if (W && W.speed) {
        const lead = SK.lead[this.si];
        const t = dist / W.speed;
        const v = e.ps.velocity;
        target = [target[0] + v[0] * t * lead, target[1] + v[1] * t * lead, target[2] + (e.ps.onGround ? 0 : v[2] * t * lead * 0.5)];
        if ((w === WP.ROCKET || w === WP.GRENADE) && e.ps.onGround && this.si >= 1) target[2] = e.ps.origin[2] - 18;
        if (w === WP.GRENADE) target[2] += dist * 0.12;
      }
      return { target, dist };
    }

    think() {
      const g = this.g, p = this.p, now = g.time;
      const cmd = { forward: 0, right: 0, up: 0, attack: false, yaw: this.yaw, pitch: this.pitch, weapon: 0 };
      if (!p.alive) return cmd;
      if ((g.tick + this.phase) % 3 === 0) this.perceive();
      if (p.ps.onGround && (now >= this.nextGoal || !this.path)) this.chooseGoal();
      const mv = this.followPath();
      let dir = mv.dir;
      let wantYaw = this.yaw, wantPitch = 0, attack = false;
      const e = this.enemy && this.enemy.alive && now - this.enemySeen < 0.6 ? this.enemy : null;
      if (e) {
        const { target, dist } = this.aimAt();
        if (now >= this.wpChoose) {
          this.wpChoose = now + 0.6 + g.rng() * 0.6;
          const w = this.chooseWeapon(dist);
          if (w !== p.weapon) cmd.weapon = w;
        }
        if (now >= this.aimOffT) {
          this.aimOffT = now + 0.25 + g.rng() * 0.35;
          const lat = Q.vlen2(e.ps.velocity) / 320;
          const err = SK.aimErr[this.si] * (0.6 + lat * 0.8) * (e.powerups.invis > now ? 2.5 : 1);
          this.aimOff = [g.rng.crandom() * err, g.rng.crandom() * err * 0.6];
        }
        const d = Q.vsub(target, this.eye());
        const a = Q.vecToAngles(d);
        wantYaw = a.yaw + this.aimOff[0];
        wantPitch = a.pitch + this.aimOff[1];
        const errA = Math.abs(Q.angDiff(this.yaw, wantYaw)) + Math.abs(this.pitch - wantPitch);
        const w = p.weapon;
        const radius = w === WP.ROCKET || w === WP.GRENADE || w === WP.BFG ? 46 : w === WP.PLASMA ? 26 : 20;
        const cone = Math.atan2(radius, Math.max(40, dist)) * (w === WP.RAILGUN ? 1 : 1.6) + 0.02;
        const tooClose = (w === WP.ROCKET || w === WP.GRENADE || w === WP.BFG) && dist < 90 && p.health + p.armor < 180;
        if (now >= this.reactAt && errA < cone && !tooClose) attack = true;
        if (w === WP.LIGHTNING && dist > 800) attack = false;
        if (w === WP.GAUNTLET && dist > 70) attack = false;
        const toE = Q.vnorm([e.ps.origin[0] - p.ps.origin[0], e.ps.origin[1] - p.ps.origin[1], 0]);
        const side = [toE[1] * this.strafe, -toE[0] * this.strafe, 0];
        if (now >= this.strafeT) {
          this.strafeT = now + 0.35 + g.rng() * 0.9;
          if (g.rng() < 0.6) this.strafe = -this.strafe;
        }
        const range = RANGE[w] || [0, 1000];
        let approach = 0;
        if (dist > range[1] * 0.7) approach = 1;
        else if (dist < range[0] + 40 || (w !== WP.GAUNTLET && w !== WP.SHOTGUN && dist < 120)) approach = -1;
        if (w === WP.GAUNTLET || (w === WP.SHOTGUN && dist > 220)) approach = 1;
        const st = SK.strafe[this.si];
        if (!dir || mv.air) {
          dir = Q.vnorm([side[0] * st + toE[0] * approach, side[1] * st + toE[1] * approach, 0]);
        } else if (!mv.air) {
          dir = Q.vnorm([dir[0] + side[0] * st * 0.9, dir[1] + side[1] * st * 0.9, 0]);
        }
        if (dir && p.ps.onGround && !this.safeStep(dir)) {
          this.strafe = -this.strafe;
          dir = Q.vnorm([-side[0] * st + (mv.dir ? mv.dir[0] : 0), -side[1] * st + (mv.dir ? mv.dir[1] : 0), 0]);
          if (!this.safeStep(dir)) dir = mv.dir;
        }
        if (p.ps.onGround && g.rng() < SK.jump[this.si] * Q.TICK * 1.6) mv.jump = true;
      } else {
        if (this.enemyPos && now - this.enemySeen < 2.5) {
          const a = Q.vecToAngles(Q.vsub([this.enemyPos[0], this.enemyPos[1], this.enemyPos[2] + 10], this.eye()));
          wantYaw = a.yaw; wantPitch = a.pitch * 0.5;
        } else if (this.alertFrom && now - this.alertT < 1.5 && this.alertFrom.alive) {
          const a = Q.vecToAngles(Q.vsub(this.alertFrom.ps.origin, this.eye()));
          wantYaw = a.yaw; wantPitch = 0;
        } else if (dir) {
          wantYaw = Math.atan2(dir[1], dir[0]);
          wantPitch = 0;
        }
        if (now >= this.wpChoose && p.weapon !== this.bestIdleWeapon()) {
          this.wpChoose = now + 1.5;
          cmd.weapon = this.bestIdleWeapon();
        }
      }
      const rate = SK.turn[this.si] * Q.TICK;
      const dy = Q.angDiff(this.yaw, wantYaw);
      const track = SK.track[this.si];
      const stepY = Q.clamp(dy * track, -rate, rate);
      this.yaw = Q.wrapAng(this.yaw + (Math.abs(dy) < rate ? dy * Math.max(track, 0.5) : stepY));
      const dp = wantPitch - this.pitch;
      this.pitch = Q.clamp(this.pitch + Q.clamp(dp * track, -rate, rate), -1.4, 1.4);
      if (p.forceView) { this.yaw = p.forceView.yaw; this.pitch = p.forceView.pitch; p.forceView = null; }
      cmd.yaw = Q.quantAng(this.yaw);
      cmd.pitch = Q.quantAng(this.pitch);
      cmd.attack = attack;
      if (dir) {
        const cy = Math.cos(cmd.yaw), sy = Math.sin(cmd.yaw);
        let f = dir[0] * cy + dir[1] * sy, r = dir[0] * sy - dir[1] * cy;
        const m = Math.max(Math.abs(f), Math.abs(r), 1e-6);
        f /= m; r /= m;
        cmd.forward = Math.round(f * 127);
        cmd.right = Math.round(r * 127);
      }
      if (mv.jump) cmd.up = 127;
      this.checkStuck(cmd, !!dir);
      return cmd;
    }

    bestIdleWeapon() {
      const p = this.p;
      let best = p.weapon, bs = -1;
      for (let w = 2; w <= 9; w++) {
        if (!p.weapons[w] || p.ammo[w] <= 0) continue;
        const s = PREF[w] * (w === this.def.fav ? 1.2 : 1);
        if (s > bs) { bs = s; best = w; }
      }
      return best;
    }

    safeStep(dir) {
      const w = this.g.world, o = this.p.ps.origin;
      for (const dist of [32, 64]) {
        const a = [o[0] + dir[0] * dist, o[1] + dir[1] * dist, o[2]];
        const t = w.trace(a, [a[0], a[1], a[2] - 120], Q.PLAYER_MINS, Q.PLAYER_MAXS, Q.MASK_PLAYER);
        if (t.fraction >= 1) return false;
        if (w.pointContents([t.endpos[0], t.endpos[1], t.endpos[2] - 20]) & Q.MASK_LIQUID) return false;
        if (o[2] - t.endpos[2] > 70) return false;
        for (const h of w.hurts) if (Q.boxOverlap(Q.vadd(t.endpos, Q.PLAYER_MINS), Q.vadd(t.endpos, Q.PLAYER_MAXS), h.min, h.max)) return false;
      }
      return true;
    }

    checkStuck(cmd, moving) {
      const g = this.g, p = this.p, now = g.time;
      if (now < this.stuckCheck) return;
      this.stuckCheck = now + 0.5;
      const o = p.ps.origin;
      if (this.stuckPos && moving && p.ps.onGround && Q.vdist2(o, this.stuckPos) < 12) {
        this.stuckT += 0.5;
        if (this.stuckT >= 1) cmd.up = 127;
        if (this.stuckT >= 2) {
          this.path = null;
          this.nextGoal = 0;
          this.stuckT = 0;
          this.strafe = -this.strafe;
        }
      } else this.stuckT = 0;
      this.stuckPos = o.slice();
    }
  }
  Q.BotAI = BotAI;
  Q.BOT_SKILL = SK;
})(globalThis.Quake3 = globalThis.Quake3 || {});
