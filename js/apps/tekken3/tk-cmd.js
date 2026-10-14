(function (T) {
  'use strict';
  const { IN } = T;

  const DIRN = { n: 5, f: 6, b: 4, u: 8, d: 2, uf: 9, ub: 7, df: 3, db: 1 };
  const NDIR = { 5: 'n', 6: 'f', 4: 'b', 8: 'u', 2: 'd', 9: 'uf', 7: 'ub', 3: 'df', 1: 'db' };
  const BTNB = { 1: IN.P1, 2: IN.P2, 3: IN.K3, 4: IN.K4 };
  const HIST = 64;

  function dirOf(bits) {
    const u = bits & IN.U, d = bits & IN.D, f = bits & IN.F, b = bits & IN.B;
    const v = u && !d ? 1 : d && !u ? -1 : 0;
    const h = f && !b ? 1 : b && !f ? -1 : 0;
    return 5 + h + v * 3;
  }

  const isDown = d => d === 1 || d === 2 || d === 3;
  const isUp = d => d === 7 || d === 8 || d === 9;
  const isFwd = d => d === 3 || d === 6 || d === 9;
  const isBack = d => d === 1 || d === 4 || d === 7;

  function parseButtons(s) {
    let b = 0;
    for (const ch of s.split('+')) if (BTNB[ch]) b |= BTNB[ch];
    return b;
  }

  function parse(cmd) {
    const out = { raw: cmd, req: null, motion: [], dir: 'n', btn: 0, jf: false, hold: false, anyDir: false };
    let s = cmd.trim();
    const reqM = s.match(/^(ss|ws|run|bt|fc|air|down|st:[a-z0-9]+|rise)\s+/i);
    if (reqM) { out.req = reqM[1].toLowerCase(); s = s.slice(reqM[0].length); }
    if (s.endsWith('*')) { out.hold = true; s = s.slice(0, -1); }
    if (s.startsWith('~')) { out.jf = true; s = s.slice(1); }
    const parts = s.split(',');
    const last = parts.pop();
    for (const p of parts) out.motion.push(DIRN[p] || 5);
    const lm = last.match(/^([a-z]+)\+(.+)$/);
    if (lm && DIRN[lm[1]] !== undefined) { out.dir = lm[1]; out.btn = parseButtons(lm[2]); }
    else if (/^[1-4](\+[1-4])*$/.test(last)) { out.btn = parseButtons(last); out.anyDir = !parts.length; }
    else if (DIRN[last] !== undefined) { out.dir = last; out.btn = 0; }
    out.dirN = DIRN[out.dir];
    out.nbtn = [IN.P1, IN.P2, IN.K3, IN.K4].filter(b => out.btn & b).length;
    out.score = out.motion.length * 10 + (out.dir !== 'n' ? 3 : 0) + out.nbtn * 2 + (out.req ? 4 : 0) + (out.jf ? 5 : 0);
    return out;
  }

  class History {
    constructor() {
      this.dir = new Uint8Array(HIST).fill(5);
      this.held = new Uint16Array(HIST);
      this.press = new Uint16Array(HIST);
      this.frame = -1;
    }
    push(bits) {
      const prevHeld = this.frame >= 0 ? this.held[this.frame % HIST] : 0;
      this.frame++;
      const i = this.frame % HIST;
      this.dir[i] = dirOf(bits);
      this.held[i] = bits & T.BTN;
      this.press[i] = (bits & T.BTN) & ~prevHeld;
    }
    at(back) {
      const f = this.frame - back;
      if (f < 0) return { dir: 5, held: 0, press: 0 };
      const i = f % HIST;
      return { dir: this.dir[i], held: this.held[i], press: this.press[i] };
    }
    dirAt(back) { const f = this.frame - back; return f < 0 ? 5 : this.dir[f % HIST]; }
    pressedWithin(btn, frames) {
      for (let k = 0; k < frames; k++) if (this.at(k).press & btn) return k;
      return -1;
    }
    tapped(dirTest, frames) {
      let seenRelease = false, seenPress = false;
      for (let k = 0; k < frames; k++) {
        const d = this.dirAt(k);
        if (!seenRelease) { if (!dirTest(d)) seenRelease = true; continue; }
        if (!seenPress && dirTest(d)) { seenPress = true; break; }
      }
      return seenPress;
    }
    doubleTap(dirTest, frames) {
      if (!dirTest(this.dirAt(0)) || dirTest(this.dirAt(1))) return false;
      let k = 1;
      while (k < frames && !dirTest(this.dirAt(k))) k++;
      if (k >= frames) return false;
      let held = 0;
      while (k < frames && dirTest(this.dirAt(k))) { k++; held++; }
      return held > 0 && held <= 10;
    }
  }

  function motionMatch(h, motion, lastDir, back, windowFrames) {
    let k = back;
    const limit = back + windowFrames;
    while (k < limit && h.dirAt(k) === lastDir) k++;
    for (let idx = motion.length - 1; idx >= 0; idx--) {
      const want = motion[idx];
      let gap = 0;
      while (k < limit && h.dirAt(k) !== want) {
        if (want === 5 || ++gap > 7) return false;
        k++;
      }
      if (k >= limit) return false;
      while (k < limit && h.dirAt(k) === want) k++;
    }
    return true;
  }

  const FALLBACK = { 1: 2, 3: 2, 7: 8, 9: 8, 4: 5, 6: 5 };

  function dirOk(p, d) {
    if (p.anyDir) return !isDown(d) && !isUp(d);
    return p.dirN === d;
  }

  function matches(h, p, back, dOverride) {
    const snap = h.at(back);
    if (p.btn) {
      const pressed = snap.press | h.at(back + 1).press;
      if (!(snap.press & p.btn)) return false;
      if (pressed & ~p.btn) return false;
      if ((snap.held & p.btn) !== p.btn) return false;
    } else if (snap.press) return false;
    const d = dOverride || snap.dir;
    if (!dirOk(p, d)) return false;
    if (p.motion.length) {
      if (!motionMatch(h, p.motion, snap.dir, back, p.jf ? 14 : 20)) return false;
      if (p.jf && h.dirAt(back + 1) === snap.dir) return false;
    }
    return true;
  }

  Object.assign(T, { DIRN, NDIR, BTNB, FALLBACK, dirOf, isDown, isUp, isFwd, isBack, parseCmd: parse, History, motionMatch, cmdMatches: matches, HIST });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
