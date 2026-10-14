(function (G) {
  'use strict';
  const { T, clamp, dist, dist2, wrapAngle, pointAt, projectOn } = G;

  const AI = {
    think(dt) {
      for (const c of this.cars) {
        if (c.removed || c.dead) continue;
        const d = c.driver;
        if (!d || d.isPlayer) continue;
        if (c.ai.panic > 0 && c.ai.mode !== 'traffic') c.ai.panic -= dt;
        switch (c.ai.mode) {
          case 'traffic': this.aiTraffic(c, dt); break;
          case 'police': this.aiPolice(c, dt); break;
          case 'hunt': this.aiHunt(c, dt, c.ai.target && !c.ai.target.dead ? c.ai.target : this.player, c.ai.speed || 330); this.aiShooters(c); break;
          case 'route': this.aiRoute(c, dt); break;
          case 'flee': c.ai.panic = 99; c.ai.fleeFrom = this.player; this.aiTraffic(c, dt); break;
          case 'race': this.aiRace(c, dt); break;
          case 'follow': this.aiFollow(c, dt); break;
          default: this.aiStop(c);
        }
      }
      for (const p of this.peds) {
        if (p.removed || p.dead || p.car || p.isPlayer) continue;
        p.blockedX = p.blockedY = false;
        if (p.down > 0) { p.vx *= 0.9; p.vy *= 0.9; continue; }
        switch (p.state) {
          case 'walk': this.pedWalk(p, dt); break;
          case 'flee': this.pedFlee(p, dt); break;
          case 'chase': this.pedChase(p, dt); break;
          case 'attack': this.pedAttack(p, dt); break;
          case 'guard': this.pedGuard(p, dt); break;
          case 'goto': this.pedGoto(p, dt); break;
          case 'enter': this.pedEnter(p, dt); break;
          case 'hail': this.pedHail(p, dt); break;
          case 'follow': this.pedFollow(p, dt); break;
          default: p.vx = 0; p.vy = 0; if (p.faceA != null) p.a = p.faceA;
        }
        if (!p.cop && p.gang && this.hostile.has(p.gang) && (p.state === 'walk' || p.state === 'idle') && !this.player.dead) {
          const d2v = dist2(p.x, p.y, this.px, this.py);
          if (d2v < 150 * 150 && this.rng.chance(dt * 0.8)) { p.state = 'attack'; p.target = this.player; }
        }
        if (p.cop && this.wanted.level > 0 && p.state !== 'chase' && p.state !== 'attack' && !this.player.dead && !p.tag) {
          if (dist2(p.x, p.y, this.px, this.py) < 300 * 300) { p.state = 'chase'; p.target = this.player; }
        }
      }
    },

    aiStop(c) { c.ctl.thr = 0; c.ctl.steer = 0; c.ctl.hand = true; },

    driveAt(c, tx, ty, speed, dt, o) {
      const ai = c.ai;
      const want = Math.atan2(ty - c.y, tx - c.x);
      const diff = wrapAngle(want - c.a);
      const sp = c.fwd;
      if (ai.reverseT > 0) {
        ai.reverseT -= dt;
        c.ctl.thr = -1; c.ctl.steer = -Math.sign(diff || 1); c.ctl.hand = false;
        return;
      }
      if (c.ctl.thr > 0.5 && Math.abs(sp) < 14) {
        ai.stuckT = (ai.stuckT || 0) + dt;
        if (ai.stuckT > 1.2) { ai.stuckT = 0; ai.reverseT = 0.8 + this.rng.next() * 0.4; }
      } else ai.stuckT = 0;
      let target = speed * (1 - clamp(Math.abs(diff) / 1.7, 0, 0.78));
      if (o && o.cap != null) target = Math.min(target, o.cap);
      c.ctl.steer = clamp(diff * 2.6, -1, 1);
      if (target < 4 && sp < 20) { c.ctl.thr = 0; c.ctl.hand = true; return; }
      c.ctl.hand = false;
      if (sp < target - 8) c.ctl.thr = 1;
      else if (sp > target + 30) c.ctl.thr = -1;
      else if (sp > target + 6) c.ctl.thr = 0;
      else c.ctl.thr = 0.45;
      if (Math.abs(diff) > 2.4 && Math.abs(sp) < 40 && !(o && o.noReverse)) { ai.reverseT = 0.7; }
    },

    snapLane(c, onlyTraffic) {
      const net = this.city.net, ai = c.ai;
      const r = net.nearestLane(c.x, c.y, c.a, 40 * this.city.M, onlyTraffic);
      if (!r) { ai.lane = -1; return null; }
      ai.lane = r.lane; ai.s = r.s; ai.next = -1; ai.off = r.d;
      return r;
    },

    chooseRandom(c, lane) {
      const net = this.city.net, ai = c.ai;
      const opts = lane.next.filter(i => net.lanes[i].traffic);
      const list = opts.length ? opts : lane.next;
      if (!list.length) return -1;
      if (ai.fleeFrom) {
        const f = ai.fleeFrom.car || ai.fleeFrom;
        let best = list[0], bd = -1;
        for (const i of list) {
          const l = net.lanes[i], p = l.pts;
          const d2v = dist2(p[p.length - 2], p[p.length - 1], f.x, f.y) + this.rng.next() * 30000;
          if (d2v > bd) { bd = d2v; best = i; }
        }
        return best;
      }
      const main = list.filter(i => net.lanes[i].main);
      const pool = main.length && this.rng.chance(0.85) ? main : list;
      const straight = pool.filter(i => net.lanes[i].turn === 's');
      if (straight.length && this.rng.chance(0.5)) return straight[this.rng.int(0, straight.length - 1)];
      return pool[this.rng.int(0, pool.length - 1)];
    },

    chooseField(f) {
      const net = this.city.net;
      return lane => {
        let best = -1, bd = Infinity;
        for (const i of lane.next) { const v = f[i] + (net.lanes[i].main ? 0 : 30); if (v < bd) { bd = v; best = i; } }
        return best;
      };
    },

    laneCap(c, lane, ai, careful) {
      const net = this.city.net, M = this.city.M;
      if (lane.conn) return Infinity;
      const left = lane.len - ai.s - c.m.L / 2 - 3 * M;
      if (left > 220) return Infinity;
      let cap = Infinity;
      if (lane.light >= 0) {
        const st = net.lightState(lane.light, lane.group, this.t);
        if (st === 2 || (st === 1 && left > 26)) cap = Math.max(0, left - 4) * 2.1;
        if (cap < Infinity && left < -10) cap = Infinity;
      }
      if (cap === Infinity && ai.next >= 0) {
        const conn = net.lanes[ai.next];
        if (conn && conn.conn && left < 90) {
          const node = net.nodes[conn.node];
          if (node && node.kind === 2 && !this.junctionClear(c, node, conn, lane)) {
            ai.yieldT = (ai.yieldT || 0) + 1 / 60;
            if (ai.yieldT < 4.5) cap = Math.max(0, left - 2) * 2.2;
          } else ai.yieldT = 0;
        }
      }
      if (ai.next >= 0) {
        const conn = net.lanes[ai.next];
        if (conn && conn.turn !== 's' && left < 120) cap = Math.min(cap, (careful ? 70 : 95) + Math.max(0, left) * 1.2);
      }
      return cap;
    },

    junctionClear(c, node, conn, lane) {
      const net = this.city.net;
      const p = conn.pts;
      const ux = p[2] - p[0], uy = p[3] - p[1], ul = Math.hypot(ux, uy) || 1;
      const myRank = lane.seg >= 0 ? (4 - net.segs[lane.seg].cls) : 0;
      const lit = node.light >= 0;
      const R = node.r + 6;
      const buf = this._jb || (this._jb = []);
      for (const e of this.near(node.x, node.y, R + 140, buf)) {
        if (e === c || e.removed || e.dead || (e.kind !== 'car' && e.kind !== 'tram')) continue;
        const sp = Math.hypot(e.vx, e.vy);
        const dx = e.x - node.x, dy = e.y - node.y, d = Math.hypot(dx, dy);
        const cosv = sp > 1 ? (e.vx * ux + e.vy * uy) / (sp * ul) : 1;
        if (d < R && sp > 12 && cosv < 0.75) return false;
        if (lit) continue;
        if (d >= R && d < R + 130 && sp > 35) {
          const toward = -(e.vx * dx + e.vy * dy) / (sp * d);
          if (toward < 0.6) continue;
          if (e.kind === 'tram') return false;
          const el = e.ai && e.ai.lane >= 0 ? net.lanes[e.ai.lane] : null;
          const eRank = el && el.seg >= 0 ? 4 - net.segs[el.seg].cls : myRank;
          if (eRank > myRank) return false;
          if (eRank === myRank) { const cr = (e.x - c.x) * (c.vy) - (e.y - c.y) * (c.vx); if (cr < 0 && Math.abs(cosv) < 0.5) return false; }
        }
      }
      return true;
    },

    obstacleCap(c, carsOnly) {
      const fx = Math.cos(c.a), fy = Math.sin(c.a);
      const look = 26 + Math.max(0, c.fwd) * 0.85 + c.m.L / 2;
      let cap = Infinity, who = null;
      const cx = c.x + fx * look * 0.5, cy = c.y + fy * look * 0.5;
      for (const e of this.near(cx, cy, look * 0.5 + 50, this._obuf || (this._obuf = []))) {
        if (e === c || e.removed) continue;
        if (e.kind === 'ped') { if (carsOnly || e.dead || e.car) continue; }
        const dx = e.x - c.x, dy = e.y - c.y;
        const lx = dx * fx + dy * fy, ly = -dx * fy + dy * fx;
        const isCar = e.kind === 'car' || e.kind === 'tram';
        const oh = isCar ? Math.min(e.m.W, e.m.L) / 2 + 2 : 5, ol = isCar ? e.m.L / 2 : 5;
        if (lx <= 0 || lx > look + ol) continue;
        if (Math.abs(ly) > c.m.W / 2 + oh + 2) continue;
        const gap = lx - c.m.L / 2 - ol - 6;
        let v = 0;
        if (isCar) v = Math.max(0, e.vx * fx + e.vy * fy);
        const cp = v * 0.9 + Math.max(0, gap - 4) * 2.2;
        if (cp < cap) { cap = cp; who = e; }
      }
      return [cap, who];
    },

    laneFollow(c, dt, chooser, cruise, o) {
      const net = this.city.net, ai = c.ai, M = this.city.M;
      const opt = o || {};
      if (ai.lane == null || ai.lane < 0 || ai.relane > 0) {
        ai.relane = 0;
        if (!this.snapLane(c, opt.onlyTraffic)) {
          const r = net.nearestLane(c.x, c.y, null, 120 * M, false);
          if (r) this.driveAt(c, r.x, r.y, 90, dt); else this.aiStop(c);
          return false;
        }
      }
      let lane = net.lanes[ai.lane];
      const pr = projectOn(lane.pts, lane.cum, c.x, c.y, Math.max(0, ai.s - 40), ai.s + 120);
      ai.s = pr[0]; ai.off = pr[1];
      if (pr[1] > 4.5 * M + c.m.W) { ai.lostT = (ai.lostT || 0) + dt; if (ai.lostT > 0.4) { ai.lostT = 0; ai.lane = -1; } }
      else ai.lostT = 0;
      if (ai.next < 0 && lane.len - ai.s < 90 + Math.max(0, c.fwd) * 0.6) ai.next = chooser(lane);
      if (ai.s >= lane.len - 1.5) {
        if (ai.next >= 0) { ai.s -= lane.len; ai.lane = ai.next; ai.next = -1; lane = net.lanes[ai.lane]; if (lane.len - ai.s < 90) ai.next = chooser(lane); }
        else { this.aiStop(c); ai.lane = -1; return false; }
      }
      const look = 26 + Math.max(0, c.fwd) * 0.3;
      let tl = lane, ts = ai.s + look;
      if (ts > lane.len && ai.next >= 0) { ts -= lane.len; tl = net.lanes[ai.next]; }
      const q = pointAt(tl.pts, tl.cum, Math.min(ts, tl.len));
      let tX = q[0], tY = q[1];
      if (ai.detourT > 0) { ai.detourT -= dt; const a = q[2]; tX += -Math.sin(a) * 26; tY += Math.cos(a) * 26; }
      let cap = opt.ignoreRules ? Infinity : this.laneCap(c, lane, ai, opt.careful);
      if (opt.capOverride != null) cap = Math.min(cap, opt.capOverride);
      this.driveAt(c, tX, tY, cruise, dt, { cap, noReverse: !!opt.noReverse });
      return true;
    },

    aiTraffic(c, dt) {
      const ai = c.ai;
      if (ai.panic > 0) ai.panic -= dt;
      const panic = ai.panic > 0;
      const cruise = (ai.cruise || 150) * (panic ? 1.7 : 1);
      const [oc, who] = this.obstacleCap(c);
      let capO = ai.detourT > 0 ? 80 : oc;
      if (oc < 12 && who) {
        ai.waitT = (ai.waitT || 0) + dt;
        const blocker = who.kind === 'car' ? who : null;
        const pl = who.isPlayer || (blocker && blocker.driver && blocker.driver.isPlayer);
        if (pl && ai.waitT > 1 && (ai.honkT || 0) < this.t) { ai.honkT = this.t + 1.5 + this.rng.next() * 2; this.event('horn', c.x, c.y, { car: c, ai: true }); }
        const stuck = !blocker || Math.hypot(blocker.vx, blocker.vy) < 8;
        if (ai.waitT > (pl ? 3 : 4.5) && stuck && who.kind !== 'tram') { ai.detourT = 1.6; ai.waitT = 0; }
      } else ai.waitT = 0;
      this.laneFollow(c, dt, lane => this.chooseRandom(c, lane), cruise, { onlyTraffic: true, noReverse: true, ignoreRules: panic, capOverride: panic ? (oc < 30 ? oc + 60 : Infinity) : capO });
    },

    goalFor(tx, ty) {
      const net = this.city.net;
      const r = net.nearestLane(tx, ty, null, 90 * this.city.M, false);
      if (!r) return null;
      return { lane: r.lane, s: r.s, x: r.x, y: r.y };
    },

    routeDrive(c, dt, tx, ty, speed, o) {
      const ai = c.ai, M = this.city.M;
      const d = Math.hypot(tx - c.x, ty - c.y);
      const opt = o || {};
      if (d < (opt.direct || 26 * M) && (d < 12 * M || this.city.losClear(c.x, c.y, tx, ty))) {
        const [cap] = this.obstacleCap(c, true);
        this.driveAt(c, tx, ty, Math.min(speed, 60 + d * 1.2), dt, { cap: cap < 30 ? cap + 40 : Infinity });
        return;
      }
      if (!ai.goal || (this.t - (ai.goalT || -9)) > (opt.ttl || 2) || Math.hypot(ai.goal.tx - tx, ai.goal.ty - ty) > 30 * M) {
        const g = this.goalFor(tx, ty);
        ai.goal = g ? Object.assign(g, { tx, ty }) : null;
        ai.goalT = this.t;
        ai.field = g ? this.city.net.fieldTo(g.lane, g.s) : null;
        ai.next = -1;
      }
      if (!ai.field) { this.driveAt(c, tx, ty, speed * 0.6, dt); return; }
      if (ai.lane === ai.goal.lane && ai.s > ai.goal.s - 6 * M) {
        const [cap] = this.obstacleCap(c, true);
        this.driveAt(c, tx, ty, Math.min(speed, 60 + d), dt, { cap: cap < 30 ? cap + 40 : Infinity });
        return;
      }
      const [oc] = this.obstacleCap(c, !opt.careful);
      const capO = opt.careful ? oc : (oc < 20 ? oc + 50 : Infinity);
      this.laneFollow(c, dt, this.chooseField(ai.field), speed, { careful: opt.careful, ignoreRules: !opt.careful, capOverride: capO });
    },

    aiHunt(c, dt, tgt, speed) {
      const t = tgt.car ? tgt.car : tgt;
      const d = Math.hypot(t.x - c.x, t.y - c.y);
      if (d < 190 && this.city.losClear(c.x, c.y, t.x, t.y)) {
        this.driveAt(c, t.x + (t.vx || 0) * 0.3, t.y + (t.vy || 0) * 0.3, speed, dt);
        return;
      }
      if (c.m.boat) { this.driveAt(c, t.x, t.y, speed * 0.8, dt); return; }
      this.routeDrive(c, dt, t.x, t.y, speed, { ttl: 1 });
    },

    aiPolice(c, dt) {
      const P = this.player;
      if (this.wanted.level === 0 || P.dead) { c.ai = { mode: 'traffic' }; c.siren = false; return; }
      c.siren = true;
      const tgt = P.car || P;
      const d = Math.hypot(tgt.x - c.x, tgt.y - c.y);
      const pSpeed = P.car ? Math.hypot(P.car.vx, P.car.vy) : 0;
      if ((!P.car && d < 150) || (P.car && pSpeed < 30 && d < 120)) {
        this.aiStop(c);
        if (Math.abs(c.fwd) < 30) {
          for (const q of [c.driver].concat(c.pass)) {
            if (!q || q.isPlayer) continue;
            this.ejectPed(q, c);
            q.state = 'chase'; q.target = P;
          }
          c.ai = { mode: 'none' }; c.siren = false; c.flash = true;
        }
        return;
      }
      this.aiHunt(c, dt, P, c.m.max);
      if (this.wanted.level >= 3) this.aiShooters(c);
    },

    aiShooters(c) {
      const P = this.player;
      if (P.dead) return;
      const tgt = P.car || P;
      const d = Math.hypot(tgt.x - c.x, tgt.y - c.y);
      if (d > 230 || !this.city.losClear(c.x, c.y, tgt.x, tgt.y)) return;
      for (const q of c.pass.concat(c.m.bike ? [c.driver] : [])) {
        if (!q || !q.weapon || q.cool > 0) continue;
        q.x = c.x; q.y = c.y;
        this.fireWeapon(q, Math.atan2(tgt.y - c.y, tgt.x - c.x), true);
      }
      if (c.pass.length === 0 && c.driver && c.driver.weapon && c.driver.cool <= 0 && c.ai.mode === 'hunt') {
        c.driver.x = c.x; c.driver.y = c.y;
        this.fireWeapon(c.driver, Math.atan2(tgt.y - c.y, tgt.x - c.x), true);
        c.driver.cool += 0.8;
      }
    },

    aiRoute(c, dt) {
      const ai = c.ai;
      const dest = ai.dest;
      const d = Math.hypot(dest.x - c.x, dest.y - c.y);
      if (d < (ai.arriveR || 44)) {
        if (!ai.arrived) { ai.arrived = true; this.emit('arrive', { car: c, dest }); }
        this.aiStop(c);
        return;
      }
      if (c.m.boat) { this.driveAt(c, dest.x, dest.y, ai.speed || 200, dt); return; }
      if (ai.careful) {
        const [oc] = this.obstacleCap(c);
        if (oc < 12) { ai.waitT = (ai.waitT || 0) + dt; if (ai.waitT > 3.5) { ai.detourT = 1.4; ai.waitT = 0; } } else ai.waitT = 0;
      }
      this.routeDrive(c, dt, dest.x, dest.y, ai.speed || 200, { careful: ai.careful, ttl: 6 });
    },

    aiRace(c, dt) {
      const ai = c.ai;
      const cp = ai.cps[ai.cp];
      if (!cp) { this.aiStop(c); return; }
      if (dist2(cp.x, cp.y, c.x, c.y) < 70 * 70) {
        ai.cp++;
        ai.goal = null;
        this.emit('raceCp', { car: c, cp: ai.cp });
        if (ai.cp >= ai.cps.length) { this.emit('raceFinish', { car: c }); ai.mode = 'none'; return; }
      }
      this.routeDrive(c, dt, cp.x, cp.y, ai.speed || c.m.max * 0.92, { ttl: 8 });
    },

    aiFollow(c, dt) {
      const ai = c.ai;
      const tgt = ai.target;
      if (!tgt || tgt.removed) { this.aiStop(c); return; }
      const t = tgt.car || tgt;
      const d = Math.hypot(t.x - c.x, t.y - c.y);
      if (d < (ai.keep || 70)) { this.aiStop(c); return; }
      this.routeDrive(c, dt, t.x, t.y, Math.min(c.m.max, 120 + d), { ttl: 1 });
    },

    onCarsCollide(a, b, imp) {
      for (const [me, other] of [[a, b], [b, a]]) {
        if (!me.driver || !me.driver.isPlayer || !other.driver || other.driver.isPlayer) continue;
        const dx = other.x - me.x, dy = other.y - me.y, d = Math.hypot(dx, dy) || 1;
        const push = (me.vx * dx + me.vy * dy) / d - (other.vx * dx + other.vy * dy) / d;
        const aggressor = push > 40 && Math.hypot(me.vx, me.vy) > Math.hypot(other.vx, other.vy);
        if (other.m.bike && imp > 90 && other.driver) { const q = other.driver; this.ejectPed(q, other); q.down = 1.4; q.state = 'flee'; q.fleeT = 8; q.flee = { x: me.x, y: me.y }; this.pedDamage(q, 10, me.driver, 'car'); }
        if (!aggressor) continue;
        if (other.m.police) { if ((other.hitT || 0) < this.t) { other.hitT = this.t + 3; this.crime('hitcop', other.x, other.y); } }
        else if (other.driver.gang && this.hostile.has(other.driver.gang)) { other.ai = { mode: 'hunt', target: this.player, speed: other.m.max * 0.9 }; }
        else if (other.ai.mode === 'traffic') { other.ai.panic = 4; if (imp > 120) this.crime('hitped', other.x, other.y); }
      }
    },

    pedSnap(p) {
      const net = this.city.net;
      const r = net.nearestWalk(p.x, p.y, 60 * this.city.M);
      if (!r) { p.edge = -1; return false; }
      p.edge = r.edge; p.es = r.s; p.edir = this.rng.chance(0.5) ? 1 : -1;
      return true;
    },

    pedWalk(p, dt) {
      const net = this.city.net, M = this.city.M;
      if (p.edge == null || p.edge < 0) { if (!this.pedSnap(p)) { p.vx = p.vy = 0; return; } }
      let e = net.walkEdges[p.edge];
      if (p.waitCross > 0) {
        p.waitCross -= dt;
        const st = net.lightState(e.light, e.group, this.t);
        p.vx = p.vy = 0;
        if (st === 2 || p.waitCross <= 0) p.waitCross = 0; else return;
      }
      const look = 16;
      let s1 = p.es + p.edir * look;
      if (s1 > e.len || s1 < 0) {
        const nodeId = p.edir > 0 ? e.b : e.a;
        const node = net.walkNodes[nodeId];
        if (Math.hypot(node.x - p.x, node.y - p.y) < 10) {
          const opts = node.edges.filter(i => i !== p.edge);
          let next = p.edge;
          if (opts.length) {
            const side = opts.filter(i => net.walkEdges[i].kind === 'side');
            const cross = opts.filter(i => net.walkEdges[i].kind === 'cross');
            const pool = cross.length && (this.rng.chance(0.3) || !side.length) ? cross : side.length ? side : opts;
            next = pool[this.rng.int(0, pool.length - 1)];
          }
          const ne = net.walkEdges[next];
          p.edge = next;
          if (ne.a === nodeId) { p.edir = 1; p.es = 0; } else { p.edir = -1; p.es = ne.len; }
          if (ne.kind === 'cross' && ne.light >= 0 && net.lightState(ne.light, ne.group, this.t) !== 2) p.waitCross = 14;
          e = ne;
          s1 = p.es + p.edir * look;
        } else s1 = p.edir > 0 ? e.len : 0;
      }
      const q = pointAt(e.pts, e.cum, clamp(s1, 0, e.len));
      const nx = -Math.sin(q[2]), ny = Math.cos(q[2]);
      const lat = e.kind === 'side' ? clamp(p.lane, -(e.w || 20) * 0.35, (e.w || 20) * 0.35) * p.edir : 0;
      const tx = q[0] + nx * lat, ty = q[1] + ny * lat;
      const dx = tx - p.x, dy = ty - p.y, dl = Math.hypot(dx, dy) || 1;
      const sp = p.speed;
      p.vx = dx / dl * sp; p.vy = dy / dl * sp;
      const pr = projectOn(e.pts, e.cum, p.x, p.y, Math.max(0, p.es - 30), p.es + 30);
      p.es = pr[0];
      if (pr[1] > 30 * M) p.edge = -1;
      p.a += wrapAngle(Math.atan2(p.vy, p.vx) - p.a) * Math.min(1, dt * 10);
    },

    pedFlee(p, dt) {
      p.fleeT -= dt;
      if (p.fleeT <= 0 || !p.flee) { p.state = 'walk'; p.edge = -1; return; }
      if (p.blockedX || p.blockedY) p.jit = (p.jit || 0) + (this.rng.chance(0.5) ? 1.3 : -1.3);
      else p.jit = (p.jit || 0) * Math.exp(-dt);
      const a = Math.atan2(p.y - p.flee.y, p.x - p.flee.x) + (p.jit || 0);
      p.vx = Math.cos(a) * p.run; p.vy = Math.sin(a) * p.run;
      p.a = a;
    },

    moveTo(p, x, y, sp) {
      const a = Math.atan2(y - p.y, x - p.x);
      if (p.blockedX || p.blockedY) p.side = (p.side || 0) + 1;
      const off = p.side ? ((p.side % 2 ? 1 : -1) * 1.2) : 0;
      if (p.side && this.rng.chance(0.02)) p.side = 0;
      const aa = a + off;
      p.vx = Math.cos(aa) * sp; p.vy = Math.sin(aa) * sp;
      p.a += wrapAngle(a - p.a) * 0.3;
    },

    pedChase(p, dt) {
      const P = this.player;
      if (this.wanted.level === 0 || P.dead) { p.state = 'walk'; p.edge = -1; p.target = null; p.arrest = 0; return; }
      const tgt = P.car || P;
      const d = Math.hypot(tgt.x - p.x, tgt.y - p.y);
      const lvl = this.wanted.level;
      if (p.weapon && (lvl >= 3 || (P.car && Math.hypot(P.car.vx, P.car.vy) > 40)) && d < 250 && d > 30 && this.city.losClear(p.x, p.y, tgt.x, tgt.y)) {
        p.a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
        if (p.cool <= 0 && this.rng.chance(0.4)) this.fireWeapon(p, p.a + this.rng.range(-0.08, 0.08));
      }
      if (!P.car) {
        if (d < 14) {
          p.vx = 0; p.vy = 0;
          p.arrest = (p.arrest || 0) + dt;
          if (p.arrest > 0.35) this.emit('busted', { by: p });
          return;
        }
        p.arrest = 0;
        this.moveTo(p, P.x, P.y, p.run);
      } else {
        const c = P.car;
        const reach = Math.max(c.m.W, c.m.L * 0.6) / 2 + 14;
        if (d < reach && Math.hypot(c.vx, c.vy) < 28) {
          p.vx = 0; p.vy = 0;
          p.arrest = (p.arrest || 0) + dt;
          if (p.arrest > 0.9 && !c.m.tank) this.emit('busted', { by: p });
          return;
        }
        p.arrest = 0;
        if (d > 500) { p.state = 'walk'; p.edge = -1; return; }
        this.moveTo(p, c.x, c.y, p.run);
      }
    },

    pedAttack(p, dt) {
      const tgtP = p.target || this.player;
      if (!tgtP || tgtP.dead || tgtP.removed) { p.state = p.post ? 'guard' : 'walk'; p.edge = -1; p.target = null; return; }
      const tgt = tgtP.car || tgtP;
      const d = Math.hypot(tgt.x - p.x, tgt.y - p.y);
      if (d > 700) { p.state = p.post ? 'guard' : 'walk'; p.edge = -1; return; }
      const a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      const los = d < 280 && this.city.losClear(p.x, p.y, tgt.x, tgt.y);
      if (p.weapon) {
        if (los) {
          p.a = a;
          if (p.cool <= 0 && this.rng.chance(0.35)) this.fireWeapon(p, a + this.rng.range(-0.1, 0.1));
          if (d > 150) this.moveTo(p, tgt.x, tgt.y, p.run * 0.8);
          else if (d < 60) { p.vx = -Math.cos(a) * p.speed; p.vy = -Math.sin(a) * p.speed; }
          else { const s = (p.id % 2 ? 1 : -1); p.vx = -Math.sin(a) * s * p.speed * 0.6; p.vy = Math.cos(a) * s * p.speed * 0.6; }
        } else this.moveTo(p, tgt.x, tgt.y, p.run);
      } else {
        if (d < 15 && !tgtP.car) {
          p.vx = p.vy = 0; p.a = a;
          if (p.cool <= 0) { p.cool = 0.7; this.pedDamage(tgtP, 8, p, 'fist'); this.event('punch', tgtP.x, tgtP.y); }
        } else this.moveTo(p, tgt.x, tgt.y, p.run);
      }
    },

    pedGuard(p, dt) {
      p.vx = 0; p.vy = 0;
      if (p.faceA != null) p.a = p.faceA;
      if (p.post && dist2(p.x, p.y, p.post.x, p.post.y) > 40 * 40) { this.moveTo(p, p.post.x, p.post.y, p.speed); }
      if (this.player.dead) return;
      const hostile = p.hostileAlways || (p.gang && this.hostile.has(p.gang));
      if (!hostile) return;
      const r = p.aggro || 190;
      if (dist2(p.x, p.y, this.px, this.py) < r * r && this.city.losClear(p.x, p.y, this.px, this.py)) { p.state = 'attack'; p.target = this.player; }
    },

    pedGoto(p, dt) {
      const g = p.goal;
      if (!g) { p.state = 'idle'; return; }
      const d = Math.hypot(g.x - p.x, g.y - p.y);
      if (d < 10) { p.vx = p.vy = 0; p.state = p.after || 'idle'; this.emit('pedArrive', { ped: p }); return; }
      this.moveTo(p, g.x, g.y, p.hurry ? p.run : p.speed * 1.3);
    },

    pedEnter(p, dt) {
      const c = p.goalCar;
      if (!c || c.removed || c.dead) { p.state = 'idle'; return; }
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < Math.max(c.m.W, c.m.L) / 2 + 12 && Math.hypot(c.vx, c.vy) < 30) {
        this.putIn(p, c, !c.driver);
        p.state = 'ride';
        this.emit('pedBoard', { ped: p, car: c });
        return;
      }
      if (d > 400) { p.state = 'idle'; return; }
      this.moveTo(p, c.x, c.y, p.run * 0.8);
    },

    pedHail(p, dt) {
      p.vx = 0; p.vy = 0;
      if (p.faceA != null) p.a = p.faceA;
      p.wave = (p.wave || 0) + dt;
    },

    pedFollow(p, dt) {
      const t = p.target || this.player;
      const tx = t.car || t;
      const d = Math.hypot(tx.x - p.x, tx.y - p.y);
      if (d < 26) { p.vx = p.vy = 0; return; }
      this.moveTo(p, tx.x, tx.y, d > 80 ? p.run : p.speed * 1.4);
    }
  };

  Object.assign(G.World.prototype, AI);
  Object.assign(G, { AI });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
