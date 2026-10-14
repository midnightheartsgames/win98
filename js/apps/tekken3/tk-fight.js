(function (T) {
  'use strict';
  const { clamp, lerp, wrapAngle, approach, IN, DT, RNG, History, cmdMatches, FALLBACK, isDown, isUp, isFwd, isBack, THROWS } = T;

  const R_BODY = 0.27;
  const GRAV = 14;
  const MAX_HP = 170;
  const START_X = 1.15;
  const FREE = new Set(['idle', 'walk', 'crouch', 'rise', 'dash', 'bdash', 'run', 'ss', 'stance']);

  const juggleScale = n => Math.max(0.35, Math.pow(0.84, n));

  class Fighter {
    constructor(def, idx, match, opts) {
      const o = opts || {};
      this.def = def; this.idx = idx; this.m = match;
      this.team = o.team === undefined ? idx : o.team;
      this.B = Object.assign({}, T.BODY, def.body || {});
      this.ms = def.compiled || (def.compiled = T.compileMoves(def));
      this.sd = def;
      this.maxHp = Math.round((def.hp || MAX_HP) * (o.hpMul || 1));
      this.hp = o.hp === undefined ? this.maxHp : o.hp;
      this.dmgMul = o.dmgMul || def.dmgMul || 1;
      this.weight = def.weight || 1;
      this.pos = [0, 0, 0]; this.vel = [0, 0, 0]; this.yaw = 0;
      this.hist = new History();
      this.brain = null;
      this.opp = null;
      this.reset();
    }

    reset() {
      this.state = 'idle'; this.t = 0; this.dur = 0;
      this.move = null; this.mf = 0; this.hitMask = 0; this.queued = null; this.moveHit = null;
      this.vy = 0; this.vel = [0, 0, 0]; this.airHits = 0; this.face = 'up'; this.techQ = 0;
      this.react = null; this.walkDir = 0; this.ssDir = 0; this.runSpeed = 0; this.jumpDir = 0;
      this.bt = false; this.stance = null; this.invuln = 0; this.buffer = -1;
      this.combo = { hits: 0, dmg: 0, air: 0 };
      this.throwRole = null; this.tpose = null; this.bounced = false; this.koT = 0; this.winPose = 0;
      this.crouchT = 0; this.lastAction = null;
      this.pos[1] = 0;
    }

    get dir() { return this.hist.dirAt(0); }
    get fwd() { return [Math.cos(this.yaw), Math.sin(this.yaw)]; }
    angleToOpp() { const o = this.opp; return Math.atan2(o.pos[2] - this.pos[2], o.pos[0] - this.pos[0]); }
    distOpp() { const o = this.opp; return Math.hypot(o.pos[0] - this.pos[0], o.pos[2] - this.pos[2]); }

    set(state, dur) {
      if (state !== 'move') { this.move = null; this.queued = null; }
      this.state = state; this.t = 0; this.dur = dur || 0;
    }

    isAirborne() {
      if (this.state === 'jump' || this.state === 'air' || this.state === 'ko' && this.pos[1] > 0.05) return true;
      if (this.state === 'move' && this.move) {
        const m = this.move;
        if (m.air) return true;
        if (m.lc && this.mf >= m.lc[0] && this.mf <= m.lc[1]) return true;
      }
      return this.pos[1] > 0.3;
    }

    isLow() {
      const s = this.state;
      if (s === 'crouch' || s === 'down' || s === 'roll' || s === 'crumple') return true;
      if (s === 'block') return !!this.blockLow;
      if (s === 'hit') return !!(this.react && this.react.crouch);
      if (s === 'getup') return this.t < 14;
      if (s === 'rise') return this.t < 3;
      if (s === 'stance' && this.sd.stances && this.sd.stances[this.stance] && this.sd.stances[this.stance].low) return true;
      if (s === 'move' && this.move) {
        const m = this.move;
        if (m.crouch && this.mf > 2) return true;
        if (m.hc && this.mf >= m.hc[0] && this.mf <= m.hc[1]) return true;
      }
      return false;
    }

    isLying() {
      return this.state === 'down' || this.state === 'roll' && !this.teching || this.state === 'ko' && this.pos[1] < 0.05 || this.state === 'getup' && this.t < 8;
    }

    guardLevel() {
      const d = this.dir;
      switch (this.state) {
        case 'idle': return isFwd(d) ? null : 'high';
        case 'walk': return this.walkDir < 0 ? 'high' : null;
        case 'bdash': return this.t > 8 ? 'high' : null;
        case 'crouch': return d === 1 || d === 2 ? 'low' : null;
        case 'rise': return isFwd(d) ? null : 'high';
        case 'land': return this.t > 2 ? 'high' : null;
        case 'getup': return this.t > 14 ? 'high' : null;
        case 'block': return d === 1 || d === 2 ? 'low' : d === 3 ? null : 'high';
        case 'stance': {
          const st = this.sd.stances && this.sd.stances[this.stance];
          return st && st.guard ? st.guard : null;
        }
        default: return null;
      }
    }

    isCounterable() {
      const s = this.state;
      return (s === 'move' && !(this.move && this.move.getup)) || s === 'prejump' || s === 'jump' || s === 'dash' || s === 'run';
    }

    throwable(low) {
      if (this.invuln > 0) return false;
      const s = this.state;
      if (!(FREE.has(s) || s === 'move' || s === 'land' || s === 'prejump')) return false;
      if (this.isAirborne()) return false;
      if (!low && this.isLow()) return false;
      if (s === 'stance') { const st = this.sd.stances[this.stance]; if (st && st.noThrow) return false; }
      return true;
    }

    faceOpp(rate) {
      const a = this.angleToOpp();
      if (rate === undefined || rate >= 1) this.yaw = a;
      else this.yaw += wrapAngle(a - this.yaw) * rate;
    }

    moveGround(dx, dz) { this.pos[0] += dx; this.pos[2] += dz; }

    stepForward(d) { this.pos[0] += Math.cos(this.yaw) * d; this.pos[2] += Math.sin(this.yaw) * d; }

    reqOk(m) {
      const req = m.p.req, s = this.state;
      if (m.getup) return s === 'down' && this.t >= 6;
      if (req === 'ws') return s === 'rise' && this.t <= 14;
      if (req === 'ss') return s === 'ss' && this.t >= 3;
      if (req === 'run') return s === 'run' && this.runSpeed > 2.6;
      if (req === 'air') return s === 'jump' && this.t >= 4 && this.pos[1] > 0.2;
      if (req === 'down') return s === 'down' && this.t >= 6;
      if (req === 'bt') return this.bt && (FREE.has(s) || s === 'land');
      if (req && req.startsWith('st:')) return s === 'stance' && this.stance === req.slice(3) && this.t >= 2;
      if (s === 'down' || s === 'jump' || s === 'run' || s === 'stance') return false;
      if (this.bt) return false;
      if (s === 'prejump') return this.t <= 3;
      if (s === 'ss') return this.t >= 3;
      if (s === 'bdash') return this.t >= 6;
      return FREE.has(s) || s === 'land';
    }

    tryMove(back) {
      const h = this.hist;
      const snap = h.at(back);
      if (!snap.press) return false;
      const cmds = this.ms.cmds;
      for (const m of cmds) if (this.reqOk(m) && cmdMatches(h, m.p, back)) { this.startMove(m); return true; }
      const fb = FALLBACK[snap.dir];
      if (fb) for (const m of cmds) if (this.reqOk(m) && cmdMatches(h, m.p, back, fb)) { this.startMove(m); return true; }
      if (this.bt && FREE.has(this.state)) {
        this.bt = false;
        const r = this.tryMove(back);
        if (!r) this.bt = true;
        return r;
      }
      return false;
    }

    startMove(m, keepYaw) {
      const wasCrouch = this.state === 'crouch';
      const wasDown = this.state === 'down';
      this.set('move');
      this.move = m; this.mf = 1; this.hitMask = 0; this.queued = null; this.moveHit = null;
      this.fromCrouch = wasCrouch; this.fromDown = wasDown;
      if (!keepYaw && !this.bt) this.faceOpp(1);
      if (m.stance) this.pendingStance = m.stance;
      this.bt = false;
      this.lastAction = m.id;
      this.moveSerial = (this.moveSerial || 0) + 1;
      this.m.ev({ type: 'start', f: this, m });
    }

    update(control) {
      const inp = control ? 1 : 0;
      this.t++;
      if (this.invuln > 0) this.invuln--;
      if (this.state === 'move' && this.mf >= this.move.total && !(this.move.air && this.pos[1] > 0)) this.endMove();
      if ((this.state === 'block' || this.state === 'hit') && this.t > this.dur) this.exitStun(inp ? this.dir : 5);
      if (this.state === 'land' && this.t > this.dur) this.set(inp && isDown(this.dir) ? 'crouch' : 'idle');
      if (this.state === 'recover' && this.t > this.dur) this.set('idle');
      const s = this.state;
      const h = this.hist;
      const d = inp ? this.dir : 5;
      const press = inp ? h.at(0).press : 0;
      if (press && !FREE.has(s) && s !== 'down' && s !== 'land' && s !== 'prejump' && s !== 'jump') this.buffer = h.frame;
      switch (s) {
        case 'intro': case 'win': case 'lose': return;
        case 'idle': case 'walk': case 'crouch': case 'rise': case 'land': case 'stance':
          if (inp && this.freeActions(d, press)) return;
          break;
        case 'dash': case 'bdash': case 'run': case 'ss':
          if (inp && this.freeActions(d, press)) return;
          break;
      }
      switch (this.state) {
        case 'idle': this.doIdle(d, inp); break;
        case 'walk': this.doWalk(d, inp); break;
        case 'crouch': this.doCrouch(d, inp); break;
        case 'rise': if (this.t >= 12) this.set('idle'); else this.doIdle(d, inp, true); break;
        case 'land': break;
        case 'prejump': this.doPrejump(d, inp); break;
        case 'jump': this.doJump(d, inp, press); break;
        case 'dash': this.doDash(d, inp); break;
        case 'bdash': this.doBdash(d, inp); break;
        case 'run': this.doRun(d, inp); break;
        case 'ss': this.doSidestep(d, inp); break;
        case 'stance': this.doStance(d, inp, press); break;
        case 'move': this.doMove(inp, press); break;
        case 'block': case 'hit': this.doStun(d, inp); break;
        case 'recover': break;
        case 'tbreak': this.stepForward(-0.018 * Math.max(0, 1 - this.t / 18)); if (this.t >= this.dur) this.set('idle'); break;
        case 'air': case 'ko': this.doAir(inp, press, d); break;
        case 'crumple': if (this.t >= this.dur) this.toGround('down'); break;
        case 'down': this.doDown(d, inp, press); break;
        case 'roll': this.doRoll(); break;
        case 'getup': if (this.t >= this.dur) this.set('idle'); break;
      }
      if (this.state !== 'air' && this.state !== 'ko' && this.state !== 'jump' && !(this.state === 'move' && (this.move.air || this.move.jumpy))) {
        if (this.pos[1] > 0) this.pos[1] = Math.max(0, this.pos[1] - 0.08);
      }
      if (this.vel[0] || this.vel[2]) {
        this.pos[0] += this.vel[0] * DT; this.pos[2] += this.vel[2] * DT;
        const damp = this.state === 'air' || this.state === 'ko' && this.pos[1] > 0 ? 0.995 : 0.84;
        this.vel[0] *= damp; this.vel[2] *= damp;
        if (Math.abs(this.vel[0]) + Math.abs(this.vel[2]) < 0.02) { this.vel[0] = 0; this.vel[2] = 0; }
      }
    }

    freeActions(d, press) {
      const h = this.hist;
      if (this.buffer >= 0 && h.frame - this.buffer <= 8 && !press) {
        const back = h.frame - this.buffer;
        this.buffer = -1;
        if (this.tryMove(back)) return true;
      }
      if (press) {
        this.buffer = -1;
        if (this.tryMove(0)) return true;
        if (this.state !== 'run' && (press & (IN.P1 | IN.K3)) && (press & (IN.P2 | IN.K4)) === 0 && this.m.opts.noThrows) return false;
      }
      const s = this.state;
      if (s === 'dash' || s === 'bdash' || s === 'ss' || s === 'run') return false;
      if (s === 'stance') return false;
      if (!press && d !== h.dirAt(1) && this.ms.motion.length) {
        for (const m of this.ms.motion) if (this.reqOk(m) && cmdMatches(h, m.p, 0)) { this.startMove(m); return true; }
      }
      if (h.doubleTap(isFwd, 14) && !isDown(d) && !isUp(d)) { this.set('dash'); this.faceOpp(1); this.m.ev({ type: 'dash', f: this }); return true; }
      if (h.doubleTap(isBack, 14) && !isDown(d) && !isUp(d)) { this.set('bdash'); this.faceOpp(1); this.m.ev({ type: 'bdash', f: this }); return true; }
      if (d === 8 || d === 9 || d === 7) {
        if (h.dirAt(1) !== d || s === 'land') {
          this.set('prejump'); this.jumpDir = d === 9 ? 1 : d === 7 ? -1 : 0; return true;
        }
      }
      if (s === 'crouch' && !isDown(d) && this.crouchT <= 5 && d === 5 && !press) {
        this.startSidestep(-1); return true;
      }
      return false;
    }

    doIdle(d, inp, rising) {
      if (!inp) { this.walkDir = 0; if (!rising) this.faceOpp(0.3); return; }
      if (isDown(d)) { this.set('crouch'); this.crouchT = 0; return; }
      if (d === 6) { if (this.state !== 'walk') this.set('walk'); this.walkDir = 1; return; }
      if (d === 4) { if (this.state !== 'walk') this.set('walk'); this.walkDir = -1; return; }
      if (!rising && this.state !== 'idle') this.set('idle');
      this.faceOpp(0.3);
    }

    doWalk(d, inp) {
      if (!inp || !(d === 6 || d === 4)) { this.doIdle(d, inp); if (this.state === 'walk') this.set('idle'); return; }
      this.walkDir = d === 6 ? 1 : -1;
      this.faceOpp(0.35);
      const sp = (this.walkDir > 0 ? 1.35 : 1.15) * (this.def.walk || 1);
      this.stepForward(this.walkDir * sp * DT);
    }

    doCrouch(d, inp) {
      this.crouchT++;
      this.faceOpp(0.25);
      if (!inp || !isDown(d)) {
        if (this.crouchT <= 5 && inp && d === 5) { this.startSidestep(-1); return; }
        this.set('rise'); return;
      }
      if (d === 3 && this.def.crouchWalk) this.stepForward(0.9 * DT);
    }

    startSidestep(dir) {
      this.set('ss', 16); this.ssDir = dir; this.faceOpp(1);
      this.m.ev({ type: 'ss', f: this });
    }

    doPrejump(d, inp) {
      if (this.t <= 4 && inp && !isUp(d) && this.jumpDir === 0) { this.startSidestep(1); return; }
      if (this.t >= 5) {
        this.set('jump');
        this.vy = 4.5 * (this.def.jump || 1);
        const hs = this.jumpDir > 0 ? 1.9 : this.jumpDir < 0 ? -1.6 : 0;
        this.vel[0] = Math.cos(this.yaw) * hs; this.vel[2] = Math.sin(this.yaw) * hs;
        this.m.ev({ type: 'jump', f: this });
      }
    }

    doJump(d, inp, press) {
      this.vy -= GRAV * DT;
      this.pos[1] += this.vy * DT;
      this.pos[0] += this.vel[0] * DT; this.pos[2] += this.vel[2] * DT;
      if (press && inp && this.t >= 4) {
        const m = this.pickAir(press);
        if (m) {
          const vy = this.vy, vel = this.vel.slice();
          this.startMove(m, true);
          this.vy = vy; this.vel = vel;
          return;
        }
      }
      if (this.pos[1] <= 0 && this.vy < 0) {
        this.pos[1] = 0; this.vel[0] = 0; this.vel[2] = 0;
        this.set('land', 5); this.m.ev({ type: 'land', f: this });
      }
    }

    pickAir(press) {
      const by = this.ms.byId;
      if (press & IN.K4) return by['air 4'];
      if (press & IN.K3) return by['air 3'];
      if (press & IN.P2) return by['air 2'];
      if (press & IN.P1) return by['air 1'];
      return null;
    }

    doDash(d, inp) {
      const p = this.t / 16;
      const sp = Math.sin(Math.min(1, p) * Math.PI) * 3.0 * (this.def.dash || 1);
      this.faceOpp(0.5);
      this.stepForward(sp * DT);
      if (this.t >= 12 && inp && isFwd(d) && !isDown(d)) { this.set('run'); this.runSpeed = 2.4; return; }
      if (inp && isDown(d) && this.t >= 4) { this.set('crouch'); this.crouchT = 10; return; }
      if (this.t >= 16) this.set('idle');
    }

    doBdash(d, inp) {
      const p = this.t / 20;
      const sp = Math.sin(Math.min(1, p) * Math.PI) * 2.6 * (this.def.dash || 1);
      this.faceOpp(0.5);
      this.stepForward(-sp * DT);
      if (this.t >= 20) this.set('idle');
    }

    doRun(d, inp) {
      this.faceOpp(0.2);
      if (!inp || !isFwd(d)) {
        this.runSpeed = approach(this.runSpeed, 0, 0.5);
        this.stepForward(this.runSpeed * DT);
        if (this.runSpeed <= 0.2) this.set('idle');
        return;
      }
      this.runSpeed = Math.min(5.2 * (this.def.run || 1), this.runSpeed + 0.14);
      this.stepForward(this.runSpeed * DT);
      if (this.t >= 16 && this.distOpp() < 1.05 && this.opp.state !== 'down') {
        this.startMove(this.ms.byId.ram);
      }
    }

    doSidestep() {
      const o = this.opp;
      const dx = this.pos[0] - o.pos[0], dz = this.pos[2] - o.pos[2];
      const dist = Math.hypot(dx, dz) || 1;
      const lateral = this.ssLateral();
      const p = this.t / this.dur;
      const sp = Math.sin(Math.min(1, p) * Math.PI) * 0.95 * Math.PI * 30 / this.dur * (this.def.ss || 1);
      const ang = -lateral * sp * DT / Math.max(0.8, dist);
      const c = Math.cos(ang), s = Math.sin(ang);
      this.pos[0] = o.pos[0] + dx * c - dz * s;
      this.pos[2] = o.pos[2] + dx * s + dz * c;
      this.faceOpp(0.5);
      if (this.t >= this.dur) this.set('idle');
    }

    ssLateral() {
      const a = this.m.camA;
      const L = [Math.sin(a), -Math.cos(a)];
      const right = [-Math.sin(this.yaw), Math.cos(this.yaw)];
      const into = Math.sign(L[0] * right[0] + L[1] * right[1]) || 1;
      return (this.ssDir > 0 ? into : -into);
    }

    doStance(d, inp, press) {
      const st = this.sd.stances && this.sd.stances[this.stance];
      if (!st) { this.set('idle'); this.stance = null; return; }
      this.faceOpp(0.2);
      if (st.hp && this.t % 30 === 0 && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + st.hp);
      if (st.move && inp) { if (d === 6) this.stepForward(st.move * DT); if (d === 4) this.stepForward(-st.move * DT); }
      const exit = inp && (st.exit === 'release' ? !(isDown(d)) : st.exit === 'b' ? isBack(d) : false);
      if (exit || (st.max && this.t >= st.max)) { this.stance = null; this.set(st.low ? 'rise' : 'idle'); }
    }

    doMove(inp, press) {
      const m = this.move;
      this.mf++;
      if (m.mv && this.mf <= m.st + m.act) this.stepForward(m.mv / (m.st + m.act));
      if (m.back) this.stepForward(-m.back / m.total);
      if (m.jumpy) {
        const air = m.st + m.act + Math.round(m.rec * 0.4);
        this.pos[1] = this.mf < air ? Math.sin(Math.PI * this.mf / air) * (m.jh || 0.45) : 0;
      }
      if (m.air && this.state === 'move') {
        this.vy -= GRAV * DT;
        this.pos[1] += this.vy * DT;
        this.pos[0] += this.vel[0] * DT; this.pos[2] += this.vel[2] * DT;
        if (this.pos[1] <= 0 && this.vy < 0) {
          this.pos[1] = 0; this.vel[0] = 0; this.vel[2] = 0;
          this.set('land', Math.max(4, Math.round(m.rec * 0.6))); return;
        }
      }
      if (this.mf < m.st && m.trk) {
        const a = this.angleToOpp();
        const dA = wrapAngle(a - this.yaw);
        const lim = m.trk / Math.max(1, m.st);
        this.yaw += clamp(dA, -lim, lim);
      }
      if (m.rehit && m.rehit.includes(this.mf)) this.hitMask = 0;
      if (m.selfDmg && this.mf === m.st) this.hp = Math.max(1, this.hp - m.selfDmg);
      if (m.heal && this.mf === m.st) { this.hp = Math.min(this.maxHp, this.hp + m.heal); this.m.ev({ type: 'heal', f: this, n: m.heal }); }
      if (m.fx && this.mf >= m.st && this.mf < m.st + m.act) this.m.ev({ type: 'fx', kind: m.fx, f: this, m });
      if (m.tele && this.mf === m.tele) this.teleport(m.teleDist || 0.9);
      if (m.buff && this.mf === m.st) { this.buff = m.buff; this.m.ev({ type: 'buff', f: this }); }
      if (inp && m.nx && !this.queued) {
        const snap = this.hist.at(0);
        for (const n of m.nx) {
          if (this.mf < n.w[0] || this.mf > n.w[1]) continue;
          if (!(snap.press & n.bits)) continue;
          if ((snap.held & n.bits) !== n.bits) continue;
          if (n.dirN && snap.dir !== n.dirN && !(n.dirN === 5 && !isDown(snap.dir) && !isUp(snap.dir))) continue;
          this.queued = n; break;
        }
      }
      if (inp && this.mf <= 2 && press && m.p) {
        const combo = m.p.btn | this.hist.at(0).held;
        if (combo !== m.p.btn) {
          for (const c of this.ms.cmds) {
            if (c === m || !c.p.btn || (c.p.btn & m.p.btn) !== m.p.btn || c.p.btn === m.p.btn) continue;
            if (c.p.req !== m.p.req) continue;
            if (T.cmdMatches(this.hist, c.p, 0)) { this.startMove(c, true); return; }
          }
        }
      }
      const q = this.queued;
      if (q && this.mf >= q.at && (!q.hit || this.moveHit === 'hit') && (!q.blk || this.moveHit)) {
        const next = this.ms.byId[q.id];
        this.startMove(next, true);
      }
    }

    teleport(dist) {
      const o = this.opp;
      const oy = o.yaw;
      this.pos[0] = o.pos[0] - Math.cos(oy) * dist;
      this.pos[2] = o.pos[2] - Math.sin(oy) * dist;
      this.faceOpp(1);
      this.m.ev({ type: 'tele', f: this });
    }

    useStyle(sd) {
      this.sd = sd;
      this.ms = sd.compiled || (sd.compiled = T.compileMoves(sd));
    }

    invulnNow() {
      if (this.invuln > 0) return true;
      const m = this.state === 'move' && this.move;
      return !!(m && m.inv && this.mf >= m.inv[0] && this.mf <= m.inv[1]);
    }

    endMove() {
      const m = this.move;
      if (m.air || this.pos[1] > 0.05 && !m.jumpy) { this.set('jump'); this.vy = Math.min(this.vy, 0); return; }
      this.pos[1] = 0;
      if (this.pendingStance) {
        const name = this.pendingStance;
        this.pendingStance = null;
        this.stance = name; this.set('stance'); return;
      }
      if (m.bt) { this.bt = true; }
      if (m.fc || isDown(this.dir) && this.m.phase === 'fight') { this.set('crouch'); this.crouchT = 10; }
      else this.set('idle');
    }

    doStun(d) {
      if (this.state === 'block') this.blockLow = isDown(d) && d !== 3;
    }

    exitStun(d) {
      if (this.react && this.react.spin) this.bt = true;
      this.set(isDown(d) ? 'crouch' : 'idle');
      this.crouchT = 10;
    }

    doAir(inp, press, d) {
      if (this.state === 'ko' && this.koLanded) { this.pos[1] = 0; this.vy = 0; return; }
      this.vy -= GRAV * DT;
      this.pos[1] += this.vy * DT;
      if (inp && press && this.vy < 0 && this.pos[1] < 0.9 && !this.noTech) this.techQ = this.hist.frame;
      if (this.pos[1] <= 0 && this.vy < 0) {
        this.pos[1] = 0;
        if (!this.bounced && this.vy < -3.2) {
          this.bounced = true;
          this.vy = Math.min(1.8, -this.vy * 0.28);
          this.m.ev({ type: 'bounce', f: this });
          return;
        }
        this.vy = 0;
        if (this.state === 'ko') { this.m.ev({ type: 'thud', f: this, big: true }); this.koLanded = true; this.vel[0] *= 0.3; this.vel[2] *= 0.3; return; }
        const tech = this.techQ && this.hist.frame - this.techQ < 16 && !this.noTech && inp;
        this.toGround(tech ? 'tech' : 'down');
      }
    }

    toGround(kind) {
      this.airHits = 0; this.bounced = false; this.techQ = 0; this.groundHits = 0;
      this.vel[0] *= 0.25; this.vel[2] *= 0.25;
      if (kind === 'tech') {
        const d = this.dir;
        this.teching = true; this.rollDir = isUp(d) ? 1 : isDown(d) ? -1 : (this.m.rng.chance(0.5) ? 1 : -1);
        this.set('roll', 20); this.rollKind = 'tech'; this.invuln = 12;
        this.m.ev({ type: 'tech', f: this });
        return;
      }
      this.teching = false;
      this.set('down');
      this.m.ev({ type: 'thud', f: this });
    }

    doDown(d, inp, press) {
      this.faceOpp(0.1);
      if (this.t <= 4 && inp && press && this.techQ === 0 && !this.noTech && this.m.phase === 'fight' && this.lastFall === 'air') {
        this.toGround('tech'); return;
      }
      if (this.t < 10) return;
      if (inp && press && this.freeDownMove()) return;
      if (inp) {
        if (d === 8 || d === 9 || d === 7) { this.set('getup', 24); return; }
        if (d === 6) { this.rollKind = 'fwd'; this.set('roll', 18); return; }
        if (d === 4) { this.rollKind = 'back'; this.set('roll', 18); return; }
        if (press & IN.P1) { this.rollKind = 'side'; this.rollDir = this.m.rng.chance(0.5) ? 1 : -1; this.set('roll', 16); return; }
      }
      if (this.t >= (inp ? 90 : 60)) this.set('getup', 24);
    }

    freeDownMove() {
      const h = this.hist, snap = h.at(0);
      for (const m of this.ms.cmds) {
        if (!m.getup) continue;
        if ((snap.press & m.p.btn) && (snap.held & m.p.btn) === m.p.btn) { this.startMove(m, false); return true; }
      }
      return false;
    }

    doRoll() {
      const p = this.t / this.dur;
      const sp = Math.sin(Math.min(1, p) * Math.PI);
      if (this.rollKind === 'back') this.stepForward(-1.9 * sp * DT);
      else if (this.rollKind === 'fwd') this.stepForward(1.7 * sp * DT);
      else {
        const lat = this.rollDir * 1.8 * sp * DT;
        this.pos[0] += -Math.sin(this.yaw) * lat; this.pos[2] += Math.cos(this.yaw) * lat;
        if (this.rollKind === 'tech') this.stepForward(-0.4 * sp * DT);
      }
      if (this.t >= this.dur) {
        if (this.rollKind === 'tech') { this.teching = false; this.set('idle'); this.faceOpp(1); }
        else if (this.rollKind === 'side') this.set('down');
        else this.set('getup', 18);
      }
    }
  }

  class Match {
    constructor(defs, opts) {
      this.opts = opts || {};
      this.rng = new RNG(this.opts.seed || 12345);
      const fo = this.opts.fighters || [];
      this.fs = defs.map((d, i) => new Fighter(d, i, this, fo[i]));
      if (this.fs.length >= 2) { this.fs[0].opp = this.fs[1]; this.fs[1].opp = this.fs[0]; }
      this.roundsToWin = this.opts.rounds || 2;
      this.roundFrames = this.opts.time === 0 ? 0 : (this.opts.time || 60) * 60;
      this.wins = this.fs.map(() => 0);
      this.round = 0;
      this.events = [];
      this.frame = 0;
      this.hitstop = 0;
      this.slow = 0;
      this.camA = 0;
      this.throwS = null;
      this.carry = this.opts.carryHp || null;
      this.log = [];
      this.startRound();
    }

    ev(e) { this.events.push(e); }

    startRound() {
      this.round++;
      this.phase = this.round === 1 && !this.opts.skipIntro ? 'intro' : 'ready';
      this.pt = 0;
      this.timer = this.roundFrames;
      this.hitstop = 0; this.slow = 0; this.throwS = null;
      this.camA = 0;
      this.roundWinner = -1;
      this.result = null;
      this.fs.forEach((f, i) => {
        const hp = f.hp;
        f.reset();
        if (f.def.mimic && this.opts.mimicPool && this.opts.mimicPool.length) f.useStyle(this.rng.pick(this.opts.mimicPool));
        f.hp = this.opts.keepHp ? Math.max(1, hp) : f.maxHp;
        f.pos = [i === 0 ? -START_X : START_X, 0, 0];
        f.yaw = i === 0 ? 0 : Math.PI;
        f.state = this.phase === 'intro' ? 'intro' : 'idle';
        f.dmgDealt = 0; f.maxCombo = 0;
      });
      this.ev({ type: 'round', n: this.round, final: this.isFinalRound() });
    }

    isFinalRound() { return this.wins.every(w => w === this.roundsToWin - 1) && this.roundsToWin > 1; }

    relInput(i, screen) {
      const f = this.fs[i];
      if (!f || !f.opp) return screen;
      const R = [Math.cos(this.camA), Math.sin(this.camA)];
      const side = (f.opp.pos[0] - f.pos[0]) * R[0] + (f.opp.pos[2] - f.pos[2]) * R[1];
      let bits = screen & ~(IN.F | IN.B);
      const left = screen & IN.B, right = screen & IN.F;
      if (side >= 0) { if (right) bits |= IN.F; if (left) bits |= IN.B; }
      else { if (left) bits |= IN.F; if (right) bits |= IN.B; }
      return bits;
    }

    step(inputs) {
      this.events.length = 0;
      this.frame++;
      const control = this.phase === 'fight';
      for (let i = 0; i < this.fs.length; i++) {
        const f = this.fs[i];
        let bits = inputs ? inputs[i] | 0 : 0;
        if (f.brain) bits = f.brain.think(this, f);
        f.hist.push(bits);
      }
      if (this.slow > 0) this.slow--;
      if (this.hitstop > 0) { this.hitstop--; return; }
      this.pt++;
      if (this.phase === 'intro') {
        if (this.pt >= (this.opts.introFrames || 130)) { this.phase = 'ready'; this.pt = 0; this.fs.forEach(f => f.set('idle')); }
      } else if (this.phase === 'ready') {
        if (this.pt === 60) this.ev({ type: 'fight' });
        if (this.pt >= 90) { this.phase = 'fight'; this.pt = 0; }
      } else if (this.phase === 'fight') {
        if (this.roundFrames && this.timer > 0) {
          this.timer--;
          if (this.timer <= 0) this.timeUp();
        }
      }
      for (const f of this.fs) {
        const own = control && f.state !== 'ko' && !(this.phase === 'ko');
        if (f.state === 'throw' || f.state === 'thrown') { f.t++; continue; }
        f.update(own || this.phase === 'fight');
      }
      if (this.throwS) this.updateThrow();
      if (this.phase === 'fight' || this.phase === 'ko') this.resolveHits();
      this.collide();
      this.updateFacing();
      this.updateCamera();
      if (this.phase === 'fight') this.checkKO();
      else if (this.phase === 'ko' || this.phase === 'timeup') this.afterKO();
      else if (this.phase === 'roundEnd') this.roundEndTick();
    }

    updateFacing() {
      for (const f of this.fs) {
        if (f.state === 'down' || f.state === 'air' || f.state === 'ko' || f.state === 'throw' || f.state === 'thrown' || f.state === 'roll') continue;
        if (f.bt && FREE.has(f.state)) {
          const a = f.angleToOpp() + Math.PI;
          f.yaw += wrapAngle(a - f.yaw) * 0.3;
        }
      }
    }

    updateCamera() {
      if (this.opts.fixedCam !== undefined) { this.camA = this.opts.fixedCam; return; }
      const [a, b] = this.fs;
      const dx = b.pos[0] - a.pos[0], dz = b.pos[2] - a.pos[2];
      if (dx * dx + dz * dz < 0.04) return;
      let t = Math.atan2(dz, dx);
      if (Math.abs(wrapAngle(t - this.camA)) > Math.PI / 2) t = wrapAngle(t + Math.PI);
      this.camA = wrapAngle(this.camA + wrapAngle(t - this.camA) * 0.12);
    }

    collide() {
      const fs = this.fs;
      for (let i = 0; i < fs.length; i++) for (let j = i + 1; j < fs.length; j++) {
        const a = fs[i], b = fs[j];
        if (a.state === 'throw' || a.state === 'thrown' || b.state === 'throw' || b.state === 'thrown') continue;
        if (Math.abs(a.pos[1] - b.pos[1]) > 0.7) continue;
        if (a.isLying() && b.isLying()) continue;
        const dx = b.pos[0] - a.pos[0], dz = b.pos[2] - a.pos[2];
        const dist = Math.hypot(dx, dz);
        const lying = a.isLying() || b.isLying();
        const min = lying ? 0.45 : R_BODY * 2 * ((a.def.bulk || 1) + (b.def.bulk || 1)) / 2;
        if (dist >= min) continue;
        const nx = dist > 1e-4 ? dx / dist : Math.cos(a.yaw), nz = dist > 1e-4 ? dz / dist : Math.sin(a.yaw);
        const push = min - dist;
        const wa = b.isLying() ? 1 : a.isLying() ? 0 : 0.5;
        a.pos[0] -= nx * push * wa; a.pos[2] -= nz * push * wa;
        b.pos[0] += nx * push * (1 - wa); b.pos[2] += nz * push * (1 - wa);
      }
      if (this.opts.bounds) {
        const b = this.opts.bounds;
        for (const f of fs) {
          if (f.state === 'thrown') continue;
          f.pos[0] = Math.max(b[0], Math.min(b[1], f.pos[0]));
          f.pos[2] = Math.max(b[2], Math.min(b[3], f.pos[2]));
        }
        return;
      }
      const lim = this.opts.arena || 40;
      for (const f of fs) {
        const r = Math.hypot(f.pos[0], f.pos[2]);
        if (r > lim) { f.pos[0] *= lim / r; f.pos[2] *= lim / r; }
      }
    }

    resolveHits() {
      const hits = [];
      for (const a of this.fs) {
        if (a.state !== 'move' || !a.move) continue;
        const m = a.move;
        if (a.mf < m.st || a.mf >= m.st + m.act) continue;
        for (const d of this.fs) {
          if (d === a || d.team === a.team) continue;
          if (a.hitMask & (1 << d.idx)) continue;
          const r = this.testHit(a, d, m);
          if (r) hits.push([a, d, m, r]);
        }
      }
      for (const [a, d, m, r] of hits) {
        if (m.l === 't' && a.state !== 'move') continue;
        this.applyHit(a, d, m, r);
      }
      for (const a of this.fs) {
        if (a.state === 'move' && a.move && a.mf === a.move.st + a.move.act - 1 && !a.moveHit && a.move.l !== 't' && a.move.l !== 'x') {
          a.moveHit = 'whiff';
          this.ev({ type: 'whiff', f: a, m: a.move });
        }
      }
    }

    testHit(a, d, m) {
      if (m.l === 'x') return null;
      if (d.invulnNow()) return null;
      const ds = d.state;
      if (ds === 'throw' || ds === 'thrown' || ds === 'intro' || ds === 'win' || ds === 'tbreak') return null;
      if (ds === 'ko' && this.phase !== 'ko') return null;
      if (ds === 'ko' && d.koLanded) return null;
      const dx = d.pos[0] - a.pos[0], dz = d.pos[2] - a.pos[2];
      const c = Math.cos(a.yaw), s = Math.sin(a.yaw);
      const fwd = dx * c + dz * s, lat = -dx * s + dz * c;
      const rD = R_BODY * (d.def.bulk || 1);
      if (m.l === 't') {
        const dist = Math.hypot(dx, dz);
        if (dist > m.r + rD || fwd < 0) return null;
        if (!d.throwable(m.low)) return null;
        const back = Math.abs(wrapAngle(d.yaw - (a.yaw + Math.PI))) > 1.9;
        if (Math.abs(lat) > 0.55) return null;
        return { throw: true, back };
      }
      if (m.spin360) {
        if (Math.hypot(dx, dz) > m.r + rD) return null;
      } else {
        const airBonus = d.state === 'air' || d.state === 'crumple' ? 0.18 : 0;
        if (fwd < -0.25 || fwd > m.r + rD + airBonus) return null;
        if (Math.abs(lat) > m.w + rD * 0.75) return null;
      }
      const lying = d.isLying();
      if (lying) {
        if (!(m.gr || m.l === 'l')) return null;
        if (m.l === 'l' && !m.gr && d.state !== 'down') return null;
      } else {
        const airborne = d.isAirborne();
        if (airborne) {
          if (m.l === 'l' && d.pos[1] > 0.3) return null;
          if (d.pos[1] > 1.35) return null;
        } else if (d.isLow() && m.l === 'h') return null;
        if (m.gr && m.onlyGround) return null;
      }
      const toA = Math.atan2(-dz, -dx);
      const off = Math.abs(wrapAngle(toA - d.yaw));
      return { back: off > 1.9 || d.bt, side: off > 1.1, lying };
    }

    applyHit(a, d, m, r) {
      a.hitMask |= 1 << d.idx;
      if (r.throw) { this.startThrow(a, d, m, r.back); return; }
      const remaining = m.total - a.mf;
      const g = r.back || r.lying || d.isAirborne() ? null : d.guardLevel();
      const blocked = m.l !== 'u' && g && ((m.l === 'h' || m.l === 'm') ? g === 'high' : m.l === 'sm' ? true : m.l === 'l' ? g === 'low' : false);
      const c = Math.cos(a.yaw), s = Math.sin(a.yaw);
      const contact = [d.pos[0] - c * 0.2, lerpY(m, d), d.pos[2] - s * 0.2];
      const pz = this.parryOf(d, m, a);
      if (pz) {
        this.ev({ type: 'parry', f: d, a, pos: contact });
        this.hitstop = 8;
        d.stance = null;
        if (pz.rev) { this.startThrowScript(d, a, pz.rev, pz.dmg || 24, false); return; }
        a.set('hit', 20); a.react = { lvl: 'm', heavy: false };
        d.set('recover', 3);
        if (pz.counter) d.startMove(d.ms.byId[pz.counter]);
        return;
      }
      if (blocked) {
        d.set('block', Math.max(1, remaining + (m.b || 0)));
        d.blockLow = g === 'low';
        d.faceOpp(1);
        const pushB = m.pushB === undefined ? 0.22 : m.pushB;
        d.vel[0] += c * pushB * 6; d.vel[2] += s * pushB * 6;
        a.moveHit = a.moveHit || 'block';
        this.hitstop = Math.max(this.hitstop, 5);
        this.ev({ type: 'block', a, d, m, pos: contact, low: g === 'low' });
        return;
      }
      const wasCombo = d.state === 'hit' || d.state === 'air' || d.state === 'crumple' || d.state === 'down' || d.state === 'ko' || (d.state === 'block' && false);
      const ch = !r.lying && d.isCounterable();
      const inAir = d.state === 'air' || d.state === 'crumple' || d.isAirborne() && d.state !== 'jump' && d.state !== 'move';
      let dmg = m.d * (ch ? 1.25 : 1) * (a.buff || 1);
      a.buff = 0;
      if (inAir) dmg *= juggleScale(d.airHits);
      if (r.lying) dmg *= 0.6;
      dmg = Math.max(1, Math.round(dmg * a.dmgMul * (this.opts.dmgScale || 1)));
      d.hp = Math.max(0, d.hp - dmg);
      a.dmgDealt = (a.dmgDealt || 0) + dmg;
      if (wasCombo) { d.combo.hits++; d.combo.dmg += dmg; } else d.combo = { hits: 1, dmg, air: 0 };
      a.maxCombo = Math.max(a.maxCombo || 0, d.combo.hits);
      a.moveHit = 'hit';
      const eff = ch && m.ch !== undefined ? m.ch : m.h;
      const heavy = dmg >= 16 || typeof eff === 'string';
      this.hitstop = Math.max(this.hitstop, clamp(Math.round(4 + dmg / 4 + (ch ? 2 : 0)), 4, 13));
      this.ev({ type: 'hit', a, d, m, dmg, ch, pos: contact, heavy, air: inAir, lying: r.lying, back: r.back });
      d.bt = false; d.stance = null;
      if (d.hp <= 0 && this.phase === 'fight') {
        this.koHit(a, d, m, eff);
        return;
      }
      if (d.hp <= 0 && this.opts.noRounds) { this.koHit(a, d, m, eff); return; }
      if (d.state === 'ko') { d.vy = Math.max(d.vy, 2.2); return; }
      if (r.lying) {
        d.groundHits = (d.groundHits || 0) + 1;
        if (d.groundHits >= 2) { d.set('getup', 22); d.invuln = 34; d.groundHits = 0; return; }
        d.set('down'); d.t = 6; d.lastFall = 'ground'; return;
      }
      if (inAir) { this.juggle(a, d, m, eff); return; }
      this.effect(a, d, m, eff, remaining);
    }

    parryOf(d, m, a) {
      if (m.l === 'l' || m.l === 'u' || m.l === 't' || m.l === 'x') return null;
      let pz = null;
      if (d.state === 'stance' && d.sd.stances && d.sd.stances[d.stance] && d.sd.stances[d.stance].parry) pz = d.sd.stances[d.stance];
      else if (d.state === 'move' && d.move.parry && d.mf >= d.move.parry[0] && d.mf <= d.move.parry[1]) pz = d.move;
      if (!pz) return null;
      const arch = m.anim && m.anim.arch;
      if (pz.pOnly === 'p' && arch !== 'punch') return null;
      if (pz.pOnly === 'k' && arch !== 'kick') return null;
      return { rev: pz.rev, dmg: pz.revDmg, counter: pz.counter };
    }

    effect(a, d, m, eff, remaining) {
      const c = Math.cos(a.yaw), s = Math.sin(a.yaw);
      const push = m.push === undefined ? 0.12 : m.push;
      const low = d.isLow();
      if (typeof eff === 'number') {
        d.set('hit', Math.max(1, remaining + eff));
        d.react = { lvl: m.l === 'l' ? 'l' : m.l === 'h' ? 'h' : 'm', heavy: m.d >= 15, crouch: low, side: m.anim ? m.anim.side : 'r' };
        d.faceOpp(1);
        d.vel[0] += c * push * 6; d.vel[2] += s * push * 6;
        return;
      }
      d.airHits = 0; d.bounced = false; d.noTech = !!m.nt;
      d.faceOpp(1);
      const launch = (vy, back, face, spin) => {
        d.set('air'); d.vy = vy; d.vel = [c * back, 0, s * back]; d.face = face; d.spinKind = spin; d.lastFall = 'air';
        d.pos[1] = Math.max(d.pos[1], 0.02);
      };
      switch (eff) {
        case 'L': launch(5.3 * (m.lift || 1), 0.3, 'up', 'launch'); d.combo.air = 1; break;
        case 'L2': launch(6.2, 0.25, 'up', 'launch'); break;
        case 'K': launch(2.7, 2.0, 'up', 'fall'); break;
        case 'KF': launch(2.4, 1.2, 'down', 'fallF'); break;
        case 'T': launch(2.1, 0.6, 'up', 'trip'); break;
        case 'B': launch(3.3, 4.2 * (m.blow || 1), 'up', 'blow'); break;
        case 'C': d.set('crumple', 40); d.react = { lvl: 'm', heavy: true }; d.face = 'down'; d.lastFall = 'crumple'; break;
        case 'S': d.set('hit', remaining + 28); d.react = { lvl: 'm', heavy: true, stagger: true }; d.vel = [c * 1.5, 0, s * 1.5]; break;
        case 'D': d.set('hit', remaining + 22); d.react = { lvl: 'm', heavy: true, double: true }; break;
        case 'SP': d.set('hit', remaining + 12); d.react = { lvl: 'h', heavy: true, spin: true }; break;
        default: d.set('hit', remaining + 6); d.react = { lvl: 'm', heavy: false };
      }
    }

    juggle(a, d, m, eff) {
      const c = Math.cos(a.yaw), s = Math.sin(a.yaw);
      d.airHits++;
      const dec = Math.pow(0.8, d.airHits);
      if (d.state !== 'air') { d.set('air'); d.face = 'up'; d.spinKind = 'launch'; d.lastFall = 'air'; }
      let lift = (m.lift ? 3.4 * m.lift : 3.1) * dec;
      let back = 0.45;
      if (eff === 'L' || eff === 'L2') lift = 4.6 * dec + 0.6;
      if (eff === 'K' || eff === 'B' || eff === 'KF') { lift = 2.2 * dec; back = eff === 'B' ? 4.2 : 2.4; d.spinKind = 'blow'; }
      if (eff === 'T') lift = 1.2 * dec;
      d.vy = Math.max(d.vy * 0.4, lift);
      d.vel = [c * back, 0, s * back];
      d.bounced = false;
      d.combo.air++;
      if (m.nt) d.noTech = true;
    }

    koHit(a, d, m, eff) {
      const c = Math.cos(a.yaw), s = Math.sin(a.yaw);
      d.set('ko');
      d.vy = eff === 'L' || eff === 'L2' ? 5.6 : 3.6;
      const back = eff === 'B' ? 4.6 : 2.4;
      d.vel = [c * back, 0, s * back];
      d.face = eff === 'KF' || eff === 'C' ? 'down' : 'up';
      d.spinKind = 'ko';
      d.koLanded = false;
      d.pos[1] = Math.max(d.pos[1], 0.05);
      d.faceOpp(1);
      if (this.opts.noRounds) { this.hitstop = 10; this.ev({ type: 'down', a, d }); return; }
      this.slow = 90;
      this.hitstop = 16;
      this.phase = 'ko'; this.pt = 0;
      this.ev({ type: 'ko', a, d });
    }

    checkKO() {
      const dead = this.fs.filter(f => f.hp <= 0);
      if (!dead.length) return;
      if (this.opts.noRounds) { for (const f of dead) if (f.state !== 'ko') { f.set('ko'); f.vy = 1.5; f.koLanded = false; f.pos[1] = Math.max(f.pos[1], 0.02); } return; }
      for (const f of dead) if (f.state !== 'ko') { f.set('ko'); f.vy = 2; f.vel = [0, 0, 0]; f.koLanded = false; }
      this.phase = 'ko'; this.pt = 0; this.slow = 90;
      this.ev({ type: 'ko' });
    }

    timeUp() {
      this.phase = 'timeup'; this.pt = 0;
      this.ev({ type: 'timeup' });
    }

    afterKO() {
      const living = this.fs.filter(f => f.hp > 0);
      const all = this.fs.every(f => f.state !== 'move' && f.state !== 'air' && (f.state !== 'ko' || f.koLanded || f.pos[1] <= 0));
      if (this.pt >= (this.phase === 'timeup' ? 70 : 110) && all) {
        let winner = -1;
        if (this.phase === 'timeup') {
          const r = this.fs.map(f => f.hp / f.maxHp);
          if (r[0] > r[1]) winner = 0; else if (r[1] > r[0]) winner = 1;
        } else if (living.length === 1) winner = living[0].idx;
        this.roundWinner = winner;
        if (winner >= 0) this.wins[winner]++;
        else if (this.fs.length === 2) { this.wins[0]++; this.wins[1]++; }
        const w = winner >= 0 ? this.fs[winner] : null;
        this.result = {
          winner, time: this.phase === 'timeup', draw: winner < 0,
          perfect: !!(w && w.hp === w.maxHp), great: !!(w && this.fs[1 - winner] && this.fs[1 - winner].combo.hits >= 4 && !this.phase === 'timeup')
        };
        if (w) {
          w.set('win'); w.winPose = this.rng.int(0, 1);
          this.fs.forEach(f => { if (f !== w && f.state !== 'ko' && f.state !== 'down') f.set('lose'); });
        } else this.fs.forEach(f => { if (f.state !== 'ko' && f.state !== 'down') f.set('lose'); });
        this.phase = 'roundEnd'; this.pt = 0;
        this.ev({ type: 'roundEnd', result: this.result });
      }
    }

    roundEndTick() {
      if (this.pt < 150) return;
      const target = this.roundsToWin;
      const done = this.wins.some(w => w >= target);
      if (done) {
        const top = Math.max(...this.wins);
        const leaders = this.wins.map((w, i) => w === top ? i : -1).filter(i => i >= 0);
        if (leaders.length > 1) { this.roundsToWin++; this.startRound(); return; }
        this.phase = 'over'; this.pt = 0;
        this.matchWinner = leaders[0];
        this.ev({ type: 'matchEnd', winner: this.matchWinner });
        return;
      }
      if (this.opts.maxRounds && this.round >= this.opts.maxRounds) { this.phase = 'over'; this.matchWinner = -1; return; }
      this.startRound();
    }

    startThrowScript(a, d, key, dmg, back) {
      this.startThrow(a, d, { d: dmg, throw: key, brk: 0, id: 'rev:' + key }, back, key);
    }

    startThrow(a, d, m, back, forceKey) {
      const key = forceKey || (back ? (a.sd.backThrow || 'back') : m.throw);
      const script = THROWS[key];
      if (!script) return;
      a.set('throw'); d.set('thrown');
      a.throwRole = 'a'; d.throwRole = 'v';
      this.throwS = { a, d, m, script, key, t: 0, brk: back ? 0 : (m.brk || 0), window: this.opts.breakWindow || 17, broken: false, dealt: 0, back, dmg: m.d };
      d.yaw = back ? a.yaw : a.yaw + Math.PI;
      d.bt = false; d.stance = null;
      this.ev({ type: 'grab', a, d, m });
      this.placeVictim(this.throwS);
    }

    placeVictim(S) {
      const { a, d, script } = S;
      const v = script.v;
      let k0 = v[0], k1 = v[v.length - 1];
      for (let i = 0; i < v.length - 1; i++) if (S.t >= v[i][0] && S.t <= v[i + 1][0]) { k0 = v[i]; k1 = v[i + 1]; break; }
      if (S.t >= k1[0]) k0 = k1;
      const span = k1[0] - k0[0];
      const t = span > 0 ? clamp((S.t - k0[0]) / span, 0, 1) : 1;
      const e = T.smooth(t);
      const off = [lerp(k0[1][0], k1[1][0], e), lerp(k0[1][1], k1[1][1], e), lerp(k0[1][2], k1[1][2], e)];
      const c = Math.cos(a.yaw), s = Math.sin(a.yaw);
      const sz = a.B.size || 1;
      d.pos[0] = a.pos[0] + (c * off[0] - s * off[2]) * sz;
      d.pos[2] = a.pos[2] + (s * off[0] + c * off[2]) * sz;
      d.pos[1] = off[1] * sz;
      const yRel = k0[5] !== undefined ? lerp(k0[5], k1[5] === undefined ? k0[5] : k1[5], e) : Math.PI;
      d.yaw = a.yaw + (S.back && k0[5] === undefined ? 0 : yRel);
      d.tpose = { bp: lerp(k0[2], k1[2], e), br: lerp(k0[3], k1[3], e), pose: t < 0.5 ? k0[4] : k1[4] };
    }

    updateThrow() {
      const S = this.throwS;
      const { a, d, m, script } = S;
      S.t++;
      if (S.brk && !S.broken && S.t <= S.window) {
        const need = S.brk === 12 ? (IN.P1 | IN.P2) : S.brk === 1 ? IN.P1 : IN.P2;
        const h = d.hist;
        let got = 0;
        for (let k = 0; k < Math.min(S.t, 4); k++) got |= h.at(k).press;
        const held = h.at(0).held;
        if ((got & need) && (held & need) === need && S.t >= 3) {
          S.broken = true;
          a.set('tbreak', 20); d.set('tbreak', 20);
          a.throwRole = d.throwRole = null; d.tpose = null;
          d.yaw = a.yaw + Math.PI; d.pos[1] = 0;
          this.throwS = null;
          this.ev({ type: 'break', a, d });
          return;
        }
      }
      if (script.chain) {
        for (const c of script.chain) {
          if (S.t < c.w[0] || S.t > c.w[1]) continue;
          const pr = a.hist.at(0).press, held = a.hist.at(0).held;
          if ((pr & c.bits) && (held & c.bits) === c.bits) {
            S.script = THROWS[c.next]; S.key = c.next; S.t = 0; S.brk = c.brk || 0; S.window = c.win || 14; S.dmg = c.dmg || S.dmg;
            S.part = (S.part || 1) + 1;
            this.ev({ type: 'chain', a, d, part: S.part });
            this.placeVictim(S);
            return;
          }
        }
      }
      for (const [fr, part] of script.dmg) {
        if (S.t === fr) {
          const dmg = Math.max(1, Math.round(S.dmg * part * a.dmgMul * (this.opts.dmgScale || 1)));
          d.hp = Math.max(0, d.hp - dmg); S.dealt += dmg;
          a.dmgDealt = (a.dmgDealt || 0) + dmg;
          d.combo = { hits: d.combo.hits + 1, dmg: d.combo.dmg + dmg, air: 0 };
          this.ev({ type: 'throwHit', a, d, dmg, pos: [d.pos[0], d.pos[1] + 0.9, d.pos[2]], big: part >= 0.5 });
        }
      }
      if (script.shake) for (const [fr, str] of script.shake) if (S.t === fr) this.ev({ type: 'shake', s: str });
      this.placeVictim(S);
      if (S.t >= script.dur) {
        this.throwS = null;
        a.throwRole = d.throwRole = null;
        const end = script.end;
        d.tpose = null; d.pos[1] = 0;
        d.face = end.face; d.lastFall = 'throw';
        if (d.hp <= 0 && this.opts.noRounds) {
          d.set('ko'); d.koLanded = true; d.vy = 0;
          this.ev({ type: 'down', a, d });
        } else if (d.hp <= 0 && this.phase === 'fight') {
          d.set('ko'); d.koLanded = true; d.vy = 0;
          this.phase = 'ko'; this.pt = 0; this.slow = 60;
          this.ev({ type: 'ko', a, d });
        } else {
          d.set('down'); d.t = 0;
        }
        d.faceOpp(1);
        a.set('recover', script.aRec || 8);
        a.faceOpp(1);
      }
    }
  }

  function lerpY(m, d) {
    const base = m.l === 'l' ? 0.4 : m.l === 'h' ? 1.45 : 1.1;
    return d.isLying() ? 0.15 : Math.min(base + d.pos[1], d.pos[1] + 1.5);
  }

  Object.assign(T, { Fighter, Match, R_BODY, GRAV, MAX_HP, FREE, juggleScale });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
