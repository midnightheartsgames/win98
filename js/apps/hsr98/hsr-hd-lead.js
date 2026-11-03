(function (H) {
  'use strict';
  const HD = H.HD, TUN = HD.TUN, DT = HD.DT;
  const MAX_WINDOW = 1, SMOOTH = 0.04, SNAP = 96, LOST_AFTER = 1.5, EXTRA_DELAY = 0.04, FIRST_RTT = 0.15, JUMP = 0.3, BLEND = 0.2;
  const MOVES = new Set(['move', 'goto', 'attack', 'stop', 'recall']);

  class HeroLead {
    constructor(A, h, rttMs) {
      this.A = A; this.h = h; this.rttMs = rttMs;
      this.log = []; this.seq = 0; this.skew = null;
      this.x = h.x; this.y = h.y; this.dir = h.dir; this.moving = false; this.ahead = false;
      this.s = { x: h.x, y: h.y, r: h.r, range: h.range, dir: h.dir, vx: 0, vy: 0, moveDir: null, path: null, forced: null, held: false };
    }

    nextSeq() { return ++this.seq; }

    sent(seq, c, at) { this.log.push({ seq, c, at, plan: null }); }

    landed(seq) {
      const i = this.log.findIndex(e => e.seq === seq);
      if (i < 0) return;
      const sample = this.log[i].at - this.A.time;
      this.skew = this.skew == null || Math.abs(sample - this.skew) > JUMP ? sample : this.skew + (sample - this.skew) * BLEND;
      this.log.splice(0, i + 1);
    }

    window(now) {
      if (this.skew == null) { const rtt = this.rttMs(); this.skew = now - this.A.time - (rtt == null ? FIRST_RTT : rtt / 1000) - EXTRA_DELAY; }
      return Math.max(0, Math.min(MAX_WINDOW, now - this.A.time - this.skew));
    }

    apply(e) {
      const s = this.s, c = e.c, A = this.A;
      if (c.t === 'move') {
        const l = HD.N.hypot(c.dx || 0, c.dy || 0);
        s.moveDir = l ? { x: c.dx / l, y: c.dy / l } : null;
        if (l) { s.path = null; s.forced = null; s.held = false; }
      } else if (c.t === 'goto') {
        if (!e.plan) e.plan = A.pathTo(s, c.x, c.y, TUN.heroPathLimit) || [];
        s.path = e.plan.slice();
        s.forced = null; s.moveDir = null; s.held = false;
      } else if (c.t === 'attack') {
        const t = A.byId(c.id);
        if (t && t.side === 'foe') { s.forced = t.uid; s.path = null; s.moveDir = null; }
      } else if (c.t === 'stop') {
        s.path = null; s.forced = null; s.moveDir = null;
      } else if (c.t === 'recall') {
        s.path = null; s.forced = null; s.moveDir = null; s.held = true;
      }
    }

    stepOnce(spd) {
      const s = this.s, A = this.A;
      if (s.held) return false;
      if (s.moveDir) { A.stepTo(s, s.x + s.moveDir.x * 40, s.y + s.moveDir.y * 40, spd); return true; }
      if (s.path) { if (!s.path.length || A.follow(s, s.path, spd)) s.path = null; return true; }
      if (s.forced == null) return false;
      const f = A.byId(s.forced);
      if (!f || A.inRange(s, f) || !A.clearLine(s.x, s.y, f.x, f.y, s.r - 2)) return false;
      A.stepTo(s, f.x, f.y, spd);
      return true;
    }

    forecast(now) {
      const A = this.A, h = this.h, s = this.s;
      if (h.dead || A.stunned(h) || A.has(h, 'root')) return false;
      const W = this.window(now), steps = W / DT, whole = Math.floor(steps), spd = A.moveSpd(h), moves = this.log.filter(e => MOVES.has(e.c.t));
      Object.assign(s, { x: h.x, y: h.y, r: h.r, range: h.range, dir: h.dir, moveDir: h.moveDir, path: h.path ? h.path.slice() : null, forced: h.forced, held: h.recall > 0 || !!h.chan });
      let i = 0, moved = false, lx = s.x, ly = s.y;
      for (let k = 0; k <= whole; k++) {
        const end = now - W + (k + 1) * DT;
        while (i < moves.length && moves[i].at <= end) this.apply(moves[i++]);
        lx = s.x; ly = s.y;
        if (this.stepOnce(spd)) moved = true;
      }
      const part = steps - whole;
      s.x = lx + (s.x - lx) * part;
      s.y = ly + (s.y - ly) * part;
      return moved;
    }

    frame(now, dt, active, tickPart) {
      const h = this.h, a = Math.min(1, tickPart);
      if (this.log.length && now - this.log[0].at > LOST_AFTER) this.log = this.log.filter(e => now - e.at <= LOST_AFTER);
      if (!active) this.skew = null;
      const ahead = active && this.forecast(now);
      const tx = ahead ? this.s.x : h.px + (h.x - h.px) * a, ty = ahead ? this.s.y : h.py + (h.y - h.py) * a;
      this.ahead = ahead;
      this.dir = ahead ? this.s.dir : h.dir;
      this.moving = ahead || !!h.moving;
      if (HD.N.hypot(tx - this.x, ty - this.y) > SNAP) { this.x = tx; this.y = ty; return; }
      const k = 1 - Math.exp(-dt / SMOOTH);
      this.x += (tx - this.x) * k;
      this.y += (ty - this.y) * k;
    }
  }

  HD.HeroLead = HeroLead;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
