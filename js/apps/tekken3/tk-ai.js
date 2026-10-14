(function (T) {
  'use strict';
  const { IN, clamp, lerp, RNG } = T;

  const DB = { n: 0, f: IN.F, b: IN.B, u: IN.U, d: IN.D, df: IN.D | IN.F, db: IN.D | IN.B, uf: IN.U | IN.F, ub: IN.U | IN.B };
  const NUM = { 5: 0, 6: IN.F, 4: IN.B, 8: IN.U, 2: IN.D, 3: IN.D | IN.F, 1: IN.D | IN.B, 9: IN.U | IN.F, 7: IN.U | IN.B };

  const LEVELS = {
    reaction: [28, 21, 16, 12, 9],
    guard: [0.3, 0.5, 0.7, 0.85, 0.94],
    low: [0.04, 0.18, 0.42, 0.66, 0.82],
    punish: [0.05, 0.25, 0.55, 0.8, 0.95],
    brk: [0.04, 0.15, 0.35, 0.55, 0.75],
    tech: [0.1, 0.3, 0.5, 0.7, 0.85],
    aggro: [0.3, 0.42, 0.52, 0.58, 0.62],
    juggle: [0.15, 0.45, 0.72, 0.9, 1],
    step: [0.02, 0.05, 0.1, 0.16, 0.22],
    think: [22, 16, 12, 9, 7],
    chain: [0.35, 0.55, 0.7, 0.8, 0.85]
  };

  function lv(name, L) {
    const a = LEVELS[name];
    const x = clamp(L, 0, a.length - 1);
    const i = Math.floor(x), t = x - i;
    return i >= a.length - 1 ? a[a.length - 1] : lerp(a[i], a[i + 1], t);
  }

  function macroFor(m, extraChain) {
    const p = m.p;
    const out = [];
    if (p.req === 'ws') { for (let i = 0; i < 8; i++) out.push(IN.D); out.push(0); }
    else if (p.req === 'ss') { out.push(IN.U); out.push(0, 0, 0); }
    else if (p.req === 'run') { out.push(IN.F, 0, IN.F); for (let i = 0; i < 22; i++) out.push(IN.F); }
    else if (p.req === 'air') { for (let i = 0; i < 12; i++) out.push(IN.U); }
    let prev = -1;
    for (const d of p.motion) {
      const b = NUM[d] || 0;
      if (b === prev && b) out.push(0);
      out.push(b);
      prev = b;
    }
    const fin = DB[p.dir] || 0;
    if (fin === prev && fin && p.motion.length) out.push(0);
    out.push(fin | p.btn);
    if (p.btn & (IN.P1 | IN.P2 | IN.K3 | IN.K4)) {
      const n = [IN.P1, IN.P2, IN.K3, IN.K4].filter(b => p.btn & b).length;
      if (n > 1) out.push(fin | p.btn);
    }
    return out;
  }

  class Brain {
    constructor(level, seed, opts) {
      this.L = level === undefined ? 2 : level;
      this.rng = new RNG(seed || 99);
      this.o = opts || {};
      this.plan = [];
      this.snaps = [];
      this.cool = 0;
      this.guardHold = 0; this.guardBits = 0;
      this.lastOppMove = null;
      this.brkAt = -1; this.techDone = false; this.wakeAt = -1;
      this.chainPlan = null;
      this.mode = 'neutral';
      this.history = { low: 0, high: 0, throws: 0 };
    }

    p(name) { return lv(name, this.L); }

    snapshot(o) {
      return { state: o.state, move: o.move, mf: o.mf, x: o.pos[0], z: o.pos[2], y: o.pos[1], t: o.t, ss: o.state === 'ss' };
    }

    perceived() {
      const r = Math.round(this.p('reaction'));
      const i = Math.max(0, this.snaps.length - 1 - r);
      return this.snaps[i];
    }

    think(match, f) {
      const o = f.opp;
      this.byId = f.ms.byId;
      this.snaps.push(this.snapshot(o));
      if (this.snaps.length > 60) this.snaps.shift();
      if (match.phase !== 'fight') { this.plan.length = 0; this.brkAt = -1; return 0; }
      if (this.o.passive) return this.o.passive === 'crouch' ? IN.D | IN.B : 0;
      const s = f.state;
      if (s === 'thrown') return this.breakThrow(match, f);
      this.brkAt = -1;
      if (s === 'air' || s === 'ko') {
        this.plan.length = 0;
        if (!this.techDone && f.vy < 0 && f.pos[1] < 0.7 && !f.noTech) {
          this.techDone = true;
          if (this.rng.chance(this.p('tech'))) return IN.K3 | (this.rng.chance(0.5) ? IN.U : IN.D);
        }
        return 0;
      }
      this.techDone = false;
      if (s === 'down') return this.wake(f);
      this.wakeAt = -1; this.woke = false;
      if (s === 'hit' || s === 'crumple' || s === 'throw' || s === 'tbreak' || s === 'roll' || s === 'getup') { this.plan.length = 0; return s === 'getup' ? IN.B : 0; }
      if (this.plan.length) {
        if (s === 'block' && this.guardHold <= 0) this.plan.length = 0;
        else return this.plan.shift();
      }
      if (this.guardHold > 0) {
        this.guardHold--;
        const d = this.defend(match, f, true);
        if (d !== null) return d;
        return this.guardBits;
      }
      const d = this.defend(match, f, false);
      if (d !== null) return d;
      if (s === 'block') return this.guardBits || 0;
      if (s === 'move' || s === 'jump' || s === 'land' || s === 'recover' || s === 'prejump') return 0;
      if (s === 'stance') return this.stanceAct(f);
      const pun = this.punish(match, f);
      if (pun) return pun;
      if (o.state === 'air' && (o.pos[1] > 0.05)) {
        const j = this.juggle(match, f);
        if (j !== null) return j;
      }
      if (this.cool > 0) { this.cool--; return this.idleBits(f); }
      return this.decide(match, f);
    }

    stanceAct(f) {
      if (f.t < 4 + this.rng.int(0, 10)) return 0;
      const key = 'st:' + f.stance;
      const opts = f.ms.cmds.filter(m => m.p.req === key && m.r + 0.4 >= f.distOpp());
      if (!opts.length || this.rng.chance(0.08)) return IN.B;
      return this.exec(this.rng.pick(opts));
    }

    idleBits(f) {
      if (f.state === 'crouch' && this.guardBits & IN.D) return IN.D | IN.B;
      return 0;
    }

    breakThrow(match, f) {
      const S = match.throwS;
      if (!S || S.d !== f || !S.brk) return 0;
      if (this.brkAt < 0) {
        this.brkAt = this.rng.chance(this.p('brk')) ? this.rng.int(3, Math.max(4, S.window - 2)) : 999;
      }
      if (S.t === this.brkAt || S.t === this.brkAt + 1) {
        return S.brk === 12 ? IN.P1 | IN.P2 : S.brk === 1 ? IN.P1 : IN.P2;
      }
      return 0;
    }

    wake(f) {
      if (this.wakeAt < 0) this.wakeAt = f.t + this.rng.int(4, 26);
      if (f.t < this.wakeAt) return 0;
      if (f.t >= this.wakeAt && !this.woke) {
        this.woke = true;
        const r = this.rng.next();
        const dist = f.distOpp();
        if (r < 0.35) return IN.U;
        if (r < 0.55) return IN.B;
        if (r < 0.7) return IN.P1;
        if (r < 0.85 && dist < 1.3) return IN.K3;
        if (dist < 1.4) return IN.K4;
        return IN.U;
      }
      return 0;
    }

    defend(match, f, holding) {
      const snap = this.perceived();
      if (!snap || snap.state !== 'move' || !snap.move) return null;
      const m = snap.move;
      if (this.lastOppMove === snap.move && snap.mf >= this.lastSeenMf && holding) return null;
      if (this.lastOppMove !== snap.move || snap.mf < this.lastSeenMf) {
        this.lastOppMove = snap.move; this.lastSeenMf = snap.mf;
        this.decided = null;
      }
      this.lastSeenMf = snap.mf;
      if (this.decided) return null;
      const lag = Math.round(this.p('reaction'));
      const framesLeft = m.st - (snap.mf + lag);
      if (snap.mf + lag > m.st + m.act) { this.decided = 'late'; return null; }
      const dist = f.distOpp();
      if (dist > m.r + 0.9 && m.l !== 't') { this.decided = 'far'; return null; }
      this.decided = 'yes';
      const dur = Math.max(4, m.st + m.act - snap.mf - lag + 2);
      const busy = f.state === 'move' && f.move && f.mf < f.move.st;
      if (busy) return null;
      if (m.l === 't') {
        this.history.throws++;
        if (this.rng.chance(this.p('low') * 0.8)) return this.hold(IN.D | IN.B, dur);
        return null;
      }
      if (framesLeft < -2 && f.state !== 'block') return null;
      if (m.l === 'l') {
        this.history.low++;
        if (this.rng.chance(this.p('low'))) return this.hold(IN.D | IN.B, dur + 4);
        return null;
      }
      if (m.w < 0.35 && !m.spin360 && this.rng.chance(this.p('step')) && framesLeft > 4) {
        this.plan = [this.rng.chance(0.5) ? IN.U : IN.D, 0];
        return this.plan.shift();
      }
      if (m.l === 'h' && this.rng.chance(this.p('low') * 0.5)) return this.hold(IN.D | IN.B, dur);
      if (this.rng.chance(this.p('guard'))) return this.hold(IN.B, dur);
      return null;
    }

    hold(bits, n) {
      this.plan.length = 0;
      this.guardBits = bits; this.guardHold = n;
      return bits;
    }

    punish(match, f) {
      const o = f.opp;
      if (!this.wasBlocking) { this.wasBlocking = f.state === 'block'; return null; }
      this.wasBlocking = f.state === 'block';
      if (f.state === 'block') return null;
      if (o.state !== 'move' || !o.move) return null;
      const rem = o.move.total - o.mf;
      if (rem < 10 || !this.rng.chance(this.p('punish'))) return null;
      const dist = f.distOpp();
      const cands = f.ms.cmds.filter(m => !m.p.req && m.l !== 't' && m.st <= rem && m.r + 0.27 >= dist && !m.getup && !m.p.motion.length);
      if (!cands.length) return null;
      cands.sort((a, b) => (b.launch ? 40 : 0) + b.d - ((a.launch ? 40 : 0) + a.d));
      const m = cands[0];
      return this.exec(m);
    }

    juggle(match, f) {
      const o = f.opp;
      if (!this.rng.chance(this.p('juggle'))) { this.cool = 20; return null; }
      const dist = f.distOpp();
      const moves = f.ms.cmds.filter(m => !m.p.req && m.l !== 't' && m.l !== 'l' && !m.getup && m.st <= 16 && !m.p.motion.length);
      const tAir = o.vy > 0 ? (o.vy / 14 + Math.sqrt(2 * (o.pos[1] + o.vy * o.vy / 28) / 14)) * 60 : Math.sqrt(2 * Math.max(0, o.pos[1]) / 14) * 60;
      const usable = moves.filter(m => m.st < tAir - 2 && m.r + 0.45 >= dist);
      if (!usable.length) {
        if (dist > 1.1) { this.plan = [0, IN.F, 0, IN.F, IN.F]; return 0; }
        return null;
      }
      const ender = usable.filter(m => m.kd && m.d >= 12);
      const low = o.pos[1] < 0.5;
      const pool = low && ender.length ? ender : usable.filter(m => typeof m.h === 'number' || m.nx);
      const pick = (pool.length ? pool : usable).slice().sort((a, b) => (b.nx ? 6 : 0) + b.d - ((a.nx ? 6 : 0) + a.d))[0];
      return this.exec(pick, true);
    }

    exec(m, chainAlways) {
      const mac = macroFor(m);
      if (m.nx && m.nx.length && (chainAlways || this.rng.chance(this.p('chain')))) {
        let cur = m, extra = [];
        let wait = 0;
        for (let depth = 0; depth < 4 && cur.nx && cur.nx.length; depth++) {
          const opts = cur.nx.filter(n => !n.hit);
          if (!opts.length) break;
          const n = opts[this.rng.int(0, opts.length - 1)];
          const pressAt = Math.max(n.w[0], Math.min(n.w[1], n.w[0] + 2));
          for (let i = 1; i < pressAt; i++) extra.push(0);
          extra.push((n.dirN ? NUM[n.dirN] || 0 : 0) | n.bits);
          const next = this.byId && this.byId[n.id];
          if (!next) break;
          const gap = Math.max(0, n.at - pressAt - 1);
          for (let i = 0; i < gap; i++) extra.push(0);
          cur = next;
          wait++;
          if (!this.rng.chance(this.p('chain')) && !chainAlways) break;
        }
        this.plan = mac.slice(1).concat(extra);
      } else this.plan = mac.slice(1);
      this.cool = Math.round(this.p('think') * this.rng.range(0.6, 1.4));
      return mac[0];
    }

    decide(match, f) {
      const o = f.opp;
      const dist = f.distOpp();
      const rng = this.rng;
      this.cool = Math.round(this.p('think') * rng.range(0.6, 1.5));
      if (o.state === 'down' || o.state === 'roll' || o.state === 'getup' && o.t < 6) {
        const g = f.ms.cmds.filter(m => (m.gr || m.l === 'l') && !m.p.req && m.r + 0.3 >= dist && !m.getup);
        if (g.length && rng.chance(0.55)) return this.exec(rng.pick(g));
        if (dist > 1.6) { this.plan = new Array(10).fill(IN.F); return IN.F; }
        return 0;
      }
      const aggro = this.p('aggro') * (this.o.aggro || 1);
      const hpRatio = f.hp / f.maxHp, oppRatio = o.hp / o.maxHp;
      const reach = f.ms.cmds.reduce((a, m) => m.l !== 't' && !m.p.req ? Math.max(a, m.r) : a, 0.9);
      if (dist > reach + 0.4) {
        const r = rng.next();
        if (r < 0.45) { this.plan = [0, IN.F]; return IN.F; }
        if (r < 0.75) { const n = rng.int(10, 30); this.plan = new Array(n).fill(IN.F); return IN.F; }
        if (r < 0.85 && this.p('step') > 0.05) { this.plan = [0]; return rng.chance(0.5) ? IN.U : IN.D; }
        this.cool = rng.int(6, 20);
        return 0;
      }
      if (!rng.chance(aggro)) {
        const r = rng.next();
        if (r < 0.25) { this.plan = [0, IN.B]; return IN.B; }
        if (r < 0.4 && this.p('step') > 0.04) { this.plan = [0, 0]; return rng.chance(0.5) ? IN.U : IN.D; }
        if (r < 0.55) { const n = rng.int(6, 16); this.plan = new Array(n).fill(IN.D | IN.B); return IN.D | IN.B; }
        this.cool = rng.int(8, 24);
        return 0;
      }
      const cands = f.ms.cmds.filter(m => this.usable(f, m, dist));
      if (!cands.length) { this.plan = new Array(8).fill(IN.F); return IN.F; }
      const pref = f.sd.ai || {};
      const m = rng.weighted(cands, m => {
        let w = 1;
        if (m.l === 't') w = dist < 1.0 ? 1.4 + (this.history.low > 3 ? 0.5 : 0) : 0;
        if (m.launch) w *= 1.5;
        if (m.l === 'l') w *= 1.2;
        if (m.l === 'm') w *= 1.25;
        if (m.nx) w *= 1.3;
        if (!m.safe) w *= this.L >= 3 ? 0.55 : 0.9;
        if (m.st <= 12) w *= 1.25;
        if (m.r + 0.27 < dist - 0.05) w *= 0.15;
        if (m.r > dist + 0.2 && m.r > 1.1) w *= 0.7;
        if (pref.fav && pref.fav.includes(m.id)) w *= 2.2;
        if (pref.avoid && pref.avoid.includes(m.id)) w *= 0.2;
        if (m.selfDmg && hpRatio < 0.3) w = 0;
        if (m.heal && hpRatio > 0.8) w = 0;
        if (m.stance) w *= 0.6;
        if (m.l === 'x' && !(pref.fav && pref.fav.includes(m.id))) w *= 0.15;
        if (oppRatio < 0.15 && m.d >= 18) w *= 1.6;
        return w;
      });
      if (!m) return 0;
      return this.exec(m);
    }

    usable(f, m, dist) {
      if (m.getup || m.chainOnly) return false;
      const req = m.p.req;
      if (req === 'air' || req === 'down' || req === 'bt' || (req && req.startsWith('st:'))) return false;
      if (req === 'run' && dist < 2.2) return false;
      if (m.id === 'ram') return false;
      if (m.p.jf && this.L < 3) return false;
      if (m.gr && m.onlyGround) return false;
      if (m.l === 't' && dist > m.r + 0.3) return false;
      if (m.r + 0.35 < dist) return false;
      return true;
    }
  }

  Object.assign(T, { Brain, macroFor, AI_LEVELS: LEVELS, aiLevel: lv });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
