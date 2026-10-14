(function (F) {
  'use strict';

  const PARTS = ['body', 'bumperF', 'bumperR', 'hood', 'trunk', 'mirrorL', 'mirrorR', 'wing', 'headL', 'headR', 'tailL', 'tailR', 'glassF', 'glassB', 'glassL', 'glassR'];
  const PART = {};
  PARTS.forEach((n, i) => { PART[n] = i; });

  const TUNE = {
    v0: 2.2, k: 0.0125, maxDent: 0.34, maxCrush: 0.5, radius: 0.3, spread: 1.6,
    engine: 1.7, engineReach: 0.9, fireHp: 0.08, fireT: 9, fireDrain: 0.008, misfireHp: 0.45, fixHp: 0.6, fixT: 3,
    toe: 0.24, toeMax: 0.055, sag: 0.12, sagMax: 0.05, flat: 0.17, wheelReach: 0.35,
    land: 7.5, scrape: 6
  };

  const LIMITS = {
    bumperF: [0.1, 0.26], bumperR: [0.1, 0.26], hood: [0.13, 0.42], trunk: [0.13, 0.4],
    mirrorL: [0.03, 0.03], mirrorR: [0.03, 0.03], wing: [0.16, 0.16],
    headL: [0.035, 0.035], headR: [0.035, 0.035], tailL: [0.035, 0.035], tailR: [0.035, 0.035],
    glassF: [0.05, 0.2], glassB: [0.07, 0.07], glassL: [0.06, 0.06], glassR: [0.06, 0.06]
  };

  const LOOSE = ['bumperF', 'bumperR', 'hood', 'trunk', 'mirrorL', 'mirrorR', 'wing'];

  const HARD = {
    lamp: [0.95, 0.55], blamp: [0.85, 0.55], plamp: [0.75, 0.5], alamp: [0.95, 0.55], hlamp: [0.7, 0.5], slamp: [0.7, 0.5],
    tlight: [0.95, 0.55], sign: [0.5, 0.5], flagpole: [0.8, 0.45], bollard: [0.95, 0.45], gatepost: [0.9, 0.5], windsock: [0.6, 0.5],
    citylight: [0.6, 0.8], kiosk: [0.75, 1.1], phone: [0.55, 0.8], pump: [0.6, 0.5], hoop: [0.6, 0.5], shed: [0.5, 1],
    bin: [0.2, 0.6], bench: [0.35, 0.9], fence: [0.25, 1.2], picket: [0.2, 1.2], qrail: [0.4, 1], afence: [0.35, 1.2],
    flowers: [0.35, 0.8], parasol: [0.05, 0.6], stall: [0.12, 1.1], table: [0.1, 0.7], crates: [0.15, 0.8], fflag: [0.04, 0.5],
    sandbox: [0.3, 1], ghouse: [0.25, 1], barrel: [0.3, 0.7], picnic: [0.25, 0.9], goal: [0.3, 0.9], boat: [0.45, 1],
    vnet: [0.03, 0.6], cone: [0.02, 0.4], rblock: [0.7, 1], trolleys: [0.2, 0.8], cart: [0.2, 0.8], swing: [0.5, 0.8], slide: [0.4, 0.8],
    beds: [0.05, 0.8], tires: [0.3, 1.2], board: [0.45, 1.1], stunt: [0.5, 0.5],
    rock: [1, 0.75], log: [0.8, 1.2], stump: [0.85, 0.55], pile: [0.9, 1.3], bale: [0.06, 1.2]
  };

  function segDist3(p, s) {
    const a = s.a, b = s.b;
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const l2 = dx * dx + dy * dy + dz * dz;
    let t = l2 > 0 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy + (p[2] - a[2]) * dz) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t, p[2] - a[2] - dz * t);
  }

  function layout(car, wing) {
    const sh = car.sh, L = sh.len, W = sh.wid / 2, Z = f => -L / 2 + f * L;
    const yb = sh.clr + 0.07, wr = sh.wr, boxy = !!(sh.suv || sh.van);
    const lightY = Math.max(yb + 0.22, sh.nose * 0.86 - 0.13), tailY = Math.max(yb + 0.2, sh.tail * 0.9 - 0.12);
    const belt = sh.hood + 0.02, zF = Z(0) + (L - sh.wb) * 0.47, zR = zF + sh.wb, tw = sh.wid * 0.42;
    const zm = Z(sh.ws + 0.12 / L), ym = belt + 0.1;
    const seg = (a, b, r) => ({ a, b, r });
    const pt = (p, r) => seg(p, p, r);
    const P = {
      bumperF: seg([-W, yb + 0.12, Z(0)], [W, yb + 0.12, Z(0)], 0.32),
      bumperR: seg([-W, yb + 0.12, Z(1)], [W, yb + 0.12, Z(1)], 0.32),
      hood: sh.ws > 0.12 ? seg([0, sh.hood, Z(0.08)], [0, sh.hood, Z(sh.ws * 0.9)], W * 0.75) : null,
      trunk: !boxy && sh.rb < 0.9 ? seg([0, sh.deck, Z(sh.rb + 0.03)], [0, sh.deck, Z(0.96)], W * 0.75) : null,
      mirrorL: pt([-W - 0.1, ym, zm], 0.22),
      mirrorR: pt([W + 0.1, ym, zm], 0.22),
      wing: wing ? pt([0, sh.deck + 0.18, Z(0.95)], W * 0.7) : null,
      headL: pt([-W * 0.64, lightY, Z(0)], 0.2),
      headR: pt([W * 0.64, lightY, Z(0)], 0.2),
      tailL: pt([-W * 0.66, tailY, Z(1)], 0.2),
      tailR: pt([W * 0.66, tailY, Z(1)], 0.2),
      glassF: pt([0, (sh.hood + sh.hgt) / 2, Z((sh.ws + sh.wt) / 2)], W * 0.85),
      glassB: pt([0, (sh.hgt + sh.deck) / 2, Z((sh.rt + sh.rb) / 2)], W * 0.85),
      glassL: seg([-W * 0.95, (belt + sh.hgt) / 2, Z(sh.ws + 0.05)], [-W * 0.95, (belt + sh.hgt) / 2, Z(sh.rt)], 0.42),
      glassR: seg([W * 0.95, (belt + sh.hgt) / 2, Z(sh.ws + 0.05)], [W * 0.95, (belt + sh.hgt) / 2, Z(sh.rt)], 0.42)
    };
    const wheels = [[-tw, wr, zF], [tw, wr, zF], [-tw, wr, zR], [tw, wr, zR]];
    const rear = car.wf < 0.48;
    const engine = rear ? [0, Math.max(sh.deck, sh.tail) * 0.72, Z(0.84)] : [0, sh.hood * 0.72, Z(Math.max(0.1, sh.ws * 0.5))];
    return { L, W, yb, belt, P, wheels, engine, rear, Z, bumperY: yb + 0.12, doorY: (yb + belt) / 2, hgt: sh.hgt, hood: sh.hood, deck: sh.deck };
  }

  class Damage {
    constructor(car, o = {}) {
      this.car = car;
      this.id = car.id;
      this.mechOn = o.mech !== false;
      this.wing = o.wing || null;
      this.seed = (o.seed || 1) >>> 0;
      this.lay = layout(car, this.wing);
      this.log = [];
      this.ver = 0;
      this.out = [];
      this.mech = { power: 1, toe: [0, 0, 0, 0], grip: [1, 1, 1, 1], rr: [1, 1, 1, 1], drop: [0, 0, 0, 0], sag: [0, 0, 0, 0], cda: 1, cla: 1 };
      this.t = 0;
      this.reset();
    }

    reset() {
      this.log.length = 0;
      this.amt = new Float32Array(PARTS.length);
      this.st = new Uint8Array(PARTS.length);
      this.hang = { bumperF: 1, bumperR: -1 };
      this.crack = null;
      this.bend = [0, 0, 0, 0];
      this.toeRaw = [0, 0, 0, 0];
      this.flat = [0, 0, 0, 0];
      this.zone = [0, 0, 0, 0];
      this.burnt = false;
      this.hp = 1;
      this.burning = false;
      this.fireT = 0;
      this.misT = 0;
      this.fixing = 0;
      this.anim = { hood: 0, hoodW: 0, tear: 0, trunk: 0, trunkW: 0, bumperF: 0, bumperFW: 0, bumperR: 0, bumperRW: 0, dragF: 0, dragR: 0 };
      this.rng = F.rng(this.seed * 977 + 13);
      this.ver++;
      this.refreshMech();
    }

    get damaged() { return this.log.length > 0 || this.hp < 1; }

    setWing(w) {
      if ((w || null) === this.wing) return;
      this.wing = w || null;
      this.lay = layout(this.car, this.wing);
      this.recompute();
      this.ver++;
    }

    part(name) { return this.st[PART[name]]; }

    autoY(x, z) {
      const l = this.lay;
      const endZ = Math.abs(z) > l.L / 2 - 0.35;
      return endZ ? l.bumperY + 0.06 : l.doorY;
    }

    hit(x, y, z, nx, nz, speed, hard = 1, rk = 1, kind = 'hit') {
      if (this.burnt) return null;
      const T = TUNE;
      const d = F.clamp((speed - T.v0) * T.k * hard, 0, T.maxDent);
      if (d < 0.004) return null;
      const l = Math.hypot(nx, nz) || 1;
      const yy = y === null || y === undefined ? this.autoY(x, z) : y;
      const rec = { x, y: yy, z, nx: nx / l, ny: 0, nz: nz / l, d, r: (T.radius + d * T.spread) * rk, s: (this.log.length * 7919 + this.seed * 31) >>> 0, kind };
      this.log.push(rec);
      this.apply(rec, false);
      this.ver++;
      return rec;
    }

    scrape(x, z, nx, nz, speed) {
      if (this.burnt || this.log.length > 320) return null;
      const d = Math.min(0.016, 0.003 + speed * 0.0003);
      const l = Math.hypot(nx, nz) || 1;
      const rec = { x, y: this.autoY(x, z), z, nx: nx / l, ny: 0, nz: nz / l, d, r: 0.24, s: (this.log.length * 7919 + this.seed * 31) >>> 0, kind: 'scrape' };
      this.log.push(rec);
      this.apply(rec, false);
      this.ver++;
      return rec;
    }

    land(impact) {
      if (this.burnt || impact < TUNE.land) return null;
      const d = Math.min(0.2, (impact - TUNE.land) * 0.02);
      const rec = { land: 1, d, s: (this.log.length * 7919 + this.seed * 31) >>> 0 };
      this.log.push(rec);
      this.apply(rec, false);
      if (this.mechOn) this.hp = Math.max(0, this.hp - d * 0.6);
      this.ver++;
      this.refreshMech();
      return rec;
    }

    apply(rec, quiet) {
      const l = this.lay;
      if (rec.boom) {
        for (let i = 1; i < PARTS.length; i++) {
          if (!this.hasPart(i)) continue;
          if (this.st[i] < 2) { this.st[i] = 2; if (!quiet) this.out.push({ t: 'part', part: PARTS[i], state: 2 }); }
        }
        this.flat = [1, 1, 1, 1];
        this.burnt = true;
        this.ver++;
        return;
      }
      if (rec.land) {
        for (let i = 0; i < 4; i++) {
          this.bend[i] += rec.d * 0.5;
          this.toeRaw[i] += (F.hash2(rec.s, i, 5) - 0.5) * rec.d * 0.5;
        }
        this.refreshMech();
        return;
      }
      const p = [rec.x, rec.y, rec.z];
      const zi = rec.z < -l.L / 2 + 0.9 ? 0 : rec.z > l.L / 2 - 0.9 ? 1 : rec.x < 0 ? 2 : 3;
      this.zone[zi] += rec.d;
      const scr = rec.kind === 'scrape' ? 0.5 : 1;
      const adds = new Float32Array(PARTS.length);
      for (const name of Object.keys(LIMITS)) {
        const s = l.P[name];
        if (!s) continue;
        const reach = rec.r + s.r;
        const dist = segDist3(p, s);
        if (dist < reach) adds[PART[name]] += rec.d * (1 - dist / reach) * scr;
      }
      if (rec.d > 0.1 && zi === 0) adds[PART.glassF] += (rec.d - 0.1) * 0.6;
      if (rec.d > 0.1 && zi === 1 && l.P.glassB) adds[PART.glassB] += (rec.d - 0.1) * 0.5;
      for (const name of Object.keys(LIMITS)) {
        const i = PART[name];
        if (!adds[i] || !l.P[name]) continue;
        this.amt[i] += adds[i];
        const lim = LIMITS[name];
        const was = this.st[i];
        let now = was;
        if (this.amt[i] >= lim[1]) now = 2;
        else if (this.amt[i] >= lim[0] && lim[0] < lim[1]) now = Math.max(1, was);
        if (now !== was) {
          if (now === 1 && (name === 'bumperF' || name === 'bumperR')) this.hang[name] = rec.x > 0 ? -1 : 1;
          if (name === 'glassF' && !this.crack) this.crack = { x: F.clamp(rec.x * 0.6, -l.W * 0.55, l.W * 0.55), R: 0.3 };
          this.st[i] = now;
          const a = l.P[name];
          if (!quiet) this.out.push({ t: 'part', part: name, state: now, x: (a.a[0] + a.b[0]) / 2, y: (a.a[1] + a.b[1]) / 2, z: (a.a[2] + a.b[2]) / 2 });
        }
        if (name === 'glassF' && this.crack) this.crack.R = F.clamp(0.3 + this.amt[i] * 4, 0.3, 1.4);
      }
      for (let w = 0; w < 4; w++) {
        const c = l.wheels[w];
        const dist = Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]);
        const reach = rec.r + TUNE.wheelReach;
        if (dist >= reach) continue;
        const add = rec.d * (1 - dist / reach) * scr;
        this.bend[w] += add;
        this.toeRaw[w] += add * (Math.abs(rec.nx) > 0.4 ? Math.sign(rec.nx) : F.hash2(rec.s, w, 9) < 0.5 ? -1 : 1);
        if (add > TUNE.flat && !this.flat[w]) {
          this.flat[w] = 1;
          if (!quiet) this.out.push({ t: 'flat', wheel: w });
        }
      }
      if (!quiet && this.mechOn) {
        const e = l.engine;
        const dist = Math.hypot(p[0] - e[0], p[1] - e[1], p[2] - e[2]);
        const reach = rec.r + TUNE.engineReach;
        if (dist < reach) this.hp = Math.max(0, this.hp - rec.d * TUNE.engine * (1 - dist / reach) * (rec.kind === 'scrape' ? 0.3 : 1));
      }
      this.refreshMech();
    }

    hasPart(i) {
      const name = PARTS[i];
      return !!(LIMITS[name] && this.lay.P[name]);
    }

    refreshMech() {
      const m = this.mech, T = TUNE;
      for (let i = 0; i < 4; i++) {
        const sgn = Math.sign(this.toeRaw[i]);
        m.toe[i] = this.mechOn ? sgn * Math.min(T.toeMax, Math.abs(this.toeRaw[i]) * T.toe) : 0;
        m.sag[i] = this.mechOn ? Math.min(T.sagMax, this.bend[i] * T.sag) : 0;
        const fl = this.mechOn && this.flat[i];
        m.grip[i] = fl ? 0.45 : 1;
        m.rr[i] = fl ? 5 : 1;
        m.drop[i] = this.flat[i] ? 0.07 : 0;
      }
      const st = this.st;
      let cda = 1;
      if (st[PART.bumperF] === 2) cda += 0.04;
      if (st[PART.bumperR] === 2) cda += 0.02;
      if (st[PART.hood] === 2) cda += 0.05;
      if (st[PART.hood] === 1) cda += 0.03 + this.anim.hood * 0.06;
      if (st[PART.trunk] >= 1) cda += 0.03;
      m.cda = this.mechOn ? cda : 1;
      m.cla = this.mechOn && this.wing && st[PART.wing] === 2 ? 0.4 : 1;
      m.power = this.mechOn ? this.enginePower() : 1;
    }

    enginePower() {
      if (this.burnt) return 0;
      const base = 0.5 + 0.5 * F.smooth(0, 0.85, this.hp);
      return base * (this.misT > 0 ? 0.15 : 1);
    }

    update(dt, speed = 0, acc = 0) {
      this.t += dt;
      const a = this.anim, st = this.st;
      const fast = F.clamp((speed - 9) / 14, 0, 1);
      if (st[PART.hood] < 2 && (st[PART.hood] === 1 || this.fixing > 0 || a.hood > 0.001)) {
        const flut = Math.sin(this.t * 17) * 0.05 + Math.sin(this.t * 31) * 0.025;
        const target = this.fixing > 0 ? 1.05 : st[PART.hood] === 1 ? 0.05 + 1.05 * Math.pow(fast, 1.5) + flut * fast : 0;
        a.hoodW += ((target - a.hood) * 60 - a.hoodW * 7 - acc * 0.5) * dt;
        a.hood = F.clamp(a.hood + a.hoodW * dt, 0, 1.15);
        if (a.hood <= 0 || a.hood >= 1.15) a.hoodW *= -0.3;
        if (st[PART.hood] === 0 && target === 0 && a.hood < 0.004) { a.hood = 0; a.hoodW = 0; }
        if (st[PART.hood] === 1 && a.hood > 0.95 && speed > 22) {
          a.tear += dt;
          if (a.tear > 2.5) this.detach('hood');
        } else a.tear = Math.max(0, a.tear - dt * 0.5);
      }
      if (st[PART.trunk] === 1) {
        const target = 0.32 + 0.08 * Math.sin(this.t * 7) * Math.min(1, speed / 8) - 0.2 * fast;
        a.trunkW += ((target - a.trunk) * 50 - a.trunkW * 6 + acc * 0.6) * dt;
        a.trunk = F.clamp(a.trunk + a.trunkW * dt, 0.02, 1.1);
      }
      for (const name of ['bumperF', 'bumperR']) {
        if (st[PART[name]] !== 1) continue;
        const target = 0.32 + 0.12 * fast + Math.sin(this.t * 13 + (name === 'bumperF' ? 0 : 1.7)) * 0.04 * Math.min(1, speed / 6);
        a[name + 'W'] += ((target - a[name]) * 45 - a[name + 'W'] * 6 + (name === 'bumperF' ? -acc : acc) * 0.3) * dt;
        a[name] = F.clamp(a[name] + a[name + 'W'] * dt, 0, 0.75);
        const dk = name === 'bumperF' ? 'dragF' : 'dragR';
        if (speed > 20) { a[dk] += dt; if (a[dk] > 6) this.detach(name); } else a[dk] = Math.max(0, a[dk] - dt);
      }
      if (!this.mechOn || this.burnt) return;
      if (!this.burning && this.hp < TUNE.fireHp) {
        this.burning = true;
        this.fireT = 0;
        this.out.push({ t: 'fire' });
      }
      if (this.burning) {
        this.fireT += dt;
        this.hp = Math.max(0, this.hp - TUNE.fireDrain * dt);
        if (this.fireT >= TUNE.fireT) this.explode();
      }
      if (this.misT > 0) this.misT -= dt;
      else if (this.hp < TUNE.misfireHp && this.rng() < dt * (TUNE.misfireHp - this.hp) * 7) {
        this.misT = 0.08 + this.rng() * 0.1;
        this.out.push({ t: 'misfire' });
      }
      this.refreshMech();
    }

    detach(name) {
      const i = PART[name];
      if (this.st[i] === 2 || !this.hasPart(i)) return;
      const lim = LIMITS[name][1];
      const add = lim - this.amt[i] + 1e-4;
      const s = this.lay.P[name];
      const rec = { x: (s.a[0] + s.b[0]) / 2, y: (s.a[1] + s.b[1]) / 2, z: (s.a[2] + s.b[2]) / 2, nx: 0, ny: 0, nz: 0, d: 0, r: 0, s: 0, kind: 'tear', part: name, add };
      this.log.push(rec);
      this.amt[i] += add;
      this.st[i] = 2;
      this.out.push({ t: 'part', part: name, state: 2, x: rec.x, y: rec.y, z: rec.z, torn: true });
      this.ver++;
      this.refreshMech();
    }

    explode() {
      if (this.burnt) return;
      this.burning = false;
      this.hp = 0;
      const rec = { boom: 1 };
      this.log.push(rec);
      this.apply(rec, false);
      this.out.push({ t: 'boom' });
      this.refreshMech();
    }

    fix() {
      if (!this.mechOn || this.burning || this.burnt) return false;
      this.hp = Math.max(this.hp, TUNE.fixHp);
      this.misT = 0;
      this.ver++;
      this.refreshMech();
      return true;
    }

    patch(minHp = 0.3) {
      this.burning = false;
      this.fireT = 0;
      if (this.burnt) { this.repair(); return; }
      this.hp = Math.max(this.hp, minHp);
      this.refreshMech();
    }

    repair() {
      this.reset();
      this.out.push({ t: 'repaired' });
    }

    recompute() {
      const hp = this.hp, burning = this.burning, fireT = this.fireT, log = this.log.slice(), anim = this.anim;
      this.amt = new Float32Array(PARTS.length);
      this.st = new Uint8Array(PARTS.length);
      this.crack = null;
      this.bend = [0, 0, 0, 0];
      this.toeRaw = [0, 0, 0, 0];
      this.flat = [0, 0, 0, 0];
      this.zone = [0, 0, 0, 0];
      this.burnt = false;
      for (const rec of log) {
        if (rec.kind === 'tear') { const i = PART[rec.part]; this.amt[i] += rec.add; this.st[i] = 2; continue; }
        this.apply(rec, true);
      }
      this.hp = hp; this.burning = burning; this.fireT = fireT; this.anim = anim;
      for (const name of LOOSE) if (this.st[PART[name]] !== 1) { if (anim[name] !== undefined) anim[name] = 0; }
      this.refreshMech();
    }

    mark() {
      return { n: this.log.length, hp: this.hp, burning: this.burning, fireT: this.fireT };
    }

    rewind(m) {
      if (!m) return;
      const changed = m.n !== this.log.length;
      if (m.n < this.log.length) this.log.length = m.n;
      this.hp = m.hp; this.burning = m.burning; this.fireT = m.fireT; this.misT = 0;
      if (changed) { this.recompute(); this.ver++; }
      this.refreshMech();
    }

    drain() {
      const o = this.out;
      this.out = [];
      return o;
    }

    zones() { return this.zone.map(v => F.clamp(v / 0.6, 0, 1)); }

    severity() {
      if (this.burnt) return 1;
      let s = 0;
      for (const v of this.zone) s += Math.min(0.6, v);
      s = s / 1.6;
      let parts = 0;
      for (let i = 1; i < PARTS.length; i++) parts += this.st[i] * 0.025;
      const wheels = this.flat.reduce((a, f) => a + f * 0.04, 0) + this.bend.reduce((a, b) => a + Math.min(0.1, b * 0.2), 0);
      return F.clamp(s + parts + wheels + (1 - this.hp) * 0.45, 0, 1);
    }

    paceK() { return 1 - 0.07 * this.severity(); }

    smoke() {
      if (this.burnt) return 0.55;
      if (this.burning) return 1;
      return this.hp < 0.65 ? F.clamp((0.65 - this.hp) / 0.6, 0, 1) : 0;
    }

    animKey() {
      const a = this.anim;
      return Math.round(a.hood * 60) * 1e6 + Math.round(a.trunk * 60) * 1e4 + Math.round(a.bumperF * 60) * 100 + Math.round(a.bumperR * 60);
    }
  }

  function hardOf(c) {
    if (!c) return [0.85, 1];
    if (c.board) return HARD.board;
    if (c.sign) return HARD.stunt;
    if (c.src && c.src.type) return HARD[c.src.type] || [0.3, 0.8];
    if (c.k === 'poly') return [1, 1.15];
    if (c.rail) return [0.9, 1.2];
    if (c.src && F.TREE && F.TREE[c.src.kind]) return [0.9, 0.55];
    if (c.src && c.src.lot !== undefined && c.src.id) return [0.7, 1];
    return [0.85, 1];
  }

  F.DMG = { PARTS, PART, TUNE, LIMITS, HARD, LOOSE, layout, hardOf, segDist3 };
  F.Damage = Damage;
})(globalThis.Forza = globalThis.Forza || {});
