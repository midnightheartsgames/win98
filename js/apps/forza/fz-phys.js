(function (F) {
  'use strict';

  const SURF = [
    { id: 'asphalt', name: 'асфальт', grip: 1.0, rr: 1, rough: 0.02, loose: 0 },
    { id: 'cobble', name: 'брусчатка', grip: 0.88, rr: 1.3, rough: 0.35, loose: 0 },
    { id: 'gravel', name: 'гравий', grip: 0.66, rr: 2.3, rough: 0.5, loose: 1 },
    { id: 'dirt', name: 'грунт', grip: 0.63, rr: 2.7, rough: 0.55, loose: 1 },
    { id: 'grass', name: 'трава', grip: 0.55, rr: 3.4, rough: 0.45, loose: 1 },
    { id: 'sand', name: 'песок', grip: 0.5, rr: 5.5, rough: 0.35, loose: 1 },
    { id: 'pave', name: 'тротуар', grip: 0.95, rr: 1.1, rough: 0.12, loose: 0 },
    { id: 'water', name: 'вода', grip: 0.3, rr: 14, rough: 0.6, loose: 1 },
    { id: 'metal', name: 'металл', grip: 0.92, rr: 1.05, rough: 0.08, loose: 0 }
  ];
  F.SURF = SURF;
  F.S = { ASPHALT: 0, COBBLE: 1, GRAVEL: 2, DIRT: 3, GRASS: 4, SAND: 5, PAVE: 6, WATER: 7, METAL: 8 };

  function surfGrip(code, off, wet) {
    const s = SURF[code] || SURF[0];
    let g = s.loose ? s.grip + (1 - s.grip) * off * 0.85 : s.grip + (1 - s.grip) * off * 0.25;
    if (s.loose && off < 0.2) g *= 0.92 + off * 0.4;
    if (wet) g *= 1 - (s.loose ? 0.07 : 0.16) * Math.min(1, +wet);
    return g;
  }
  function surfRR(code, off) {
    const s = SURF[code] || SURF[0];
    return s.loose ? s.rr - (s.rr - 1) * off * 0.75 : s.rr;
  }
  F.surfGrip = surfGrip;

  const NullWorld = {
    wet: false,
    lastSurf: 0,
    ground() { this.lastSurf = 0; return 0; },
    colliders() { return []; },
    waterDepth() { return 0; }
  };
  F.NullWorld = NullWorld;

  const INNER = 1 / 240, TIRE_PEN = 0.08;
  const RPM = 60 / (2 * Math.PI);
  const TIRE_C = 1.3, TIRE_B = Math.tan(Math.PI / (2 * TIRE_C)), TIRE_K = TIRE_C * TIRE_B, LONG = 1.12;
  function tireCurve(r) { return Math.sin(TIRE_C * Math.atan(TIRE_B * r)); }
  F.tireCurve = tireCurve;

  function newWheel(i) {
    return { front: i < 2, driven: false, lx: 0, lz: 0, w: 0, ang: 0, x: 0, xc: 0, xv: 0, contact: false, load: 0, gy: 0, surf: 0, vl: 0, vt: 0, c: 1, s: 0, mu: 1, kp: 0.1, ap: 0.12, rr: 0, tb: 0, absK: 1, fx: 0, fy: 0, fxSat: 0, sat: false, kappa: 0, alpha: 0, rho: 0 };
  }

  class Vehicle {
    constructor(spec, opts = {}) {
      this.x = opts.x || 0; this.z = opts.z || 0; this.y = opts.y || 0;
      this.yaw = opts.yaw || 0;
      this.vx = 0; this.vz = 0; this.vy = 0; this.r = 0;
      this.pitch = 0; this.roll = 0; this.pitchV = 0; this.rollV = 0;
      this.air = false; this.airT = 0; this.airX = 0; this.airZ = 0; this.noContact = 0;
      this.gear = 1; this.shiftT = 0; this.clutch = 1;
      this.steer = 0; this.delta = 0; this.wheelRot = 0;
      this.spin = 0; this.slideF = 0; this.slideR = 0; this.skid = 0; this.lock = 0;
      this.surf = 0; this.u = 0; this.v = 0; this.beta = 0; this.speed = 0;
      this.axL = 0; this.ayL = 0; this.accF = 0; this.accR = 0; this.limiter = false; this.braking = 0; this.hand = false;
      this.revT = 0; this.launch = 0; this.launchT = 0; this.tcsK = 1; this.stmK = 1; this.muAvg = 1;
      this.assist = Object.assign({ abs: true, tcs: true, stm: true, auto: true, steer: 'std' }, opts.assist || {});
      this.events = [];
      this.landing = 0; this.contact = 0; this.contactT = 0; this.rough = 0;
      this.waterT = 0; this.frozen = false;
      this.hitCool = 0; this.scrapeT = 0;
      this.dmg = null;
      this.wheels = [0, 1, 2, 3].map(newWheel);
      this.surfW = [0, 0, 0, 0];
      this.susp = new Float32Array(4);
      this.spins = new Float32Array(4);
      this.setSpec(spec);
      this.rpm = spec.idle;
    }

    setSpec(spec) {
      this.spec = spec;
      this.gear = F.clamp(this.gear, -1, spec.ratios.length);
      const c = spec.car, sh = c.sh, m = spec.mass, L = spec.L, g = F.G;
      const lvl = (spec.up && spec.up.susp) | 0;
      const tall = !!(sh.suv || sh.van);
      const sporty = spec.grip >= 0.98;
      const soft = c.country === 'su' || c.country === 'lv' || c.country === 'us' || c.year < 1975;
      const stiff = [1, 0.8, 0.62, 1.25][lvl] || 1;
      const travel = (tall ? 0.34 : sporty ? 0.2 : 0.25) * (lvl === 3 ? 1.25 : 1);
      const xs = (tall ? 0.14 : sporty ? 0.075 : soft ? 0.12 : 0.095) * stiff;
      const zeta = (sporty ? 0.5 : 0.4) * (lvl === 1 || lvl === 2 ? 1.2 : 1);
      const mu = m * (tall ? 0.045 : 0.035), ms = m - mu * 4;
      const fz0f = ms * g * spec.b / L / 2, fz0r = ms * g * spec.a / L / 2;
      const kf = fz0f / xs, kr = fz0r / xs;
      const kt = 180000 + m * 30;
      const arb = spec.dt === 'RWD' ? [0.55, 0.25] : spec.dt === 'FWD' ? [0.35, 0.55] : [0.5, 0.35];
      const arbK = (sporty ? 1.2 : soft ? 0.65 : 1) * (lvl === 1 || lvl === 2 ? 1.3 : lvl === 3 ? 0.8 : 1);
      const tw = spec.track / 2;
      this.k = {
        m, ms, mu, kt, ct: 0.45 * Math.sqrt(kt * mu), travel, xs, kf, kr,
        cf: 2 * zeta * Math.sqrt(kf * fz0f / g), cr: 2 * zeta * Math.sqrt(kr * fz0r / g),
        arbF: kf * arb[0] * arbK, arbR: kr * arb[1] * arbK,
        dropF: (fz0f + mu * g) / kt, dropR: (fz0r + mu * g) / kt, wr: spec.wr,
        Iw: (tall ? 1.3 : 0.85) * (spec.wr / 0.3) * (spec.wr / 0.3),
        Ie: F.clamp(0.03 + spec.T / 5000, 0.04, 0.17),
        Ix: m * (spec.wid * spec.wid + spec.hgt * spec.hgt) / 12 * 1.2,
        Iy: m * (spec.len * spec.len + spec.hgt * spec.hgt) / 12,
        h: spec.cg, hRoll: Math.max(0.15, spec.cg - (soft ? 0.03 : 0.08)),
        lsd: c.lsd !== undefined ? c.lsd : soft ? 0 : spec.P / m > 130 ? 0.6 : 0.2,
        awdF: c.awdF || 0.4,
        fric: spec.T * 0.14,
        brakeT: spec.brake * m * g * spec.wr,
        handT: m * g * spec.wr * 1.2
      };
      const W = this.wheels;
      for (let i = 0; i < 4; i++) {
        W[i].lx = i < 2 ? spec.a : -spec.b;
        W[i].lz = i % 2 ? tw : -tw;
        W[i].driven = spec.dt === 'AWD' || (spec.dt === 'FWD') === (i < 2);
        W[i].hTop = spec.wr - (i < 2 ? this.k.dropF : this.k.dropR) + travel - xs;
        W[i].init = false;
      }
    }

    place(x, z, yaw, world) {
      this.x = x; this.z = z; this.yaw = yaw;
      this.vx = this.vz = this.vy = this.r = 0;
      this.pitch = this.roll = this.pitchV = this.rollV = 0;
      this.y = world ? world.ground(x, z, 1e4) : 0;
      this.air = false; this.airT = 0; this.noContact = 0;
      this.gear = 1; this.rpm = this.spec.idle; this.shiftT = 0; this.clutch = 1;
      this.steer = 0; this.delta = 0; this.spin = 0; this.skid = 0;
      this.tcsK = 1; this.stmK = 1;
      this.waterT = 0;
      for (const wl of this.wheels) { wl.w = 0; wl.contact = false; wl.x = 0; wl.xv = 0; wl.load = 0; wl.absK = 1; wl.fx = wl.fy = 0; wl.init = false; }
    }

    fwd() { return [Math.sin(this.yaw), -Math.cos(this.yaw)]; }

    gearRatio(g) {
      const sp = this.spec;
      if (g < 0) return -sp.ratios[0] * sp.final * 0.95;
      if (g === 0) return 0;
      return sp.ratios[g - 1] * sp.final;
    }

    drivenSpeed() {
      const W = this.wheels, dt = this.spec.dt;
      const front = (W[0].w + W[1].w) / 2, rear = (W[2].w + W[3].w) / 2;
      if (dt === 'FWD') return front;
      if (dt === 'RWD') return rear;
      return front * this.k.awdF + rear * (1 - this.k.awdF);
    }

    freeRev(h, thr) {
      const sp = this.spec, k = this.k;
      let tq = thr * F.Cars.torqueAt(sp, this.rpm) - k.fric * (0.2 + 0.8 * this.rpm / sp.red);
      this.limiter = this.rpm >= sp.red;
      if (this.limiter) tq = Math.min(tq, -k.fric);
      if (this.rpm < sp.idle && thr < 0.05) tq += k.fric * 2;
      this.rpm = F.clamp(this.rpm + F.clamp(tq / k.Ie * h * RPM, -h * 7000, h * 6000), sp.idle * 0.9, sp.red * 1.02);
    }

    step(dt, inp, world) {
      const sp = this.spec;
      this.events.length = 0;
      const thrIn = F.clamp(inp.thr || 0, 0, 1), brkIn = F.clamp(inp.brk || 0, 0, 1);
      this.hand = !!inp.hand;
      if (inp.shiftUp && !this.assist.auto) this.shift(1);
      if (inp.shiftDown && !this.assist.auto) this.shift(-1);
      if (this.frozen) {
        this.vx = this.vz = this.vy = this.r = 0;
        this.pitchV = this.rollV = 0;
        for (const wl of this.wheels) wl.w = 0;
        this.freeRev(dt, thrIn);
        return;
      }
      const fx = Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = -fz, rz = fx;
      const u = this.vx * fx + this.vz * fz, v = this.vx * rx + this.vz * rz;
      let thr = thrIn, brk = brkIn;
      if (this.assist.auto || this.gear === -1 || this.gear === 0) {
        if (this.gear >= 0 && brkIn > 0.1 && thrIn < 0.1 && u < 0.6) {
          this.revT += dt;
          if (this.revT > 0.25) { this.gear = -1; this.shiftT = 0; }
        } else if (this.gear < 0 && thrIn > 0.1 && u > -0.6) {
          this.gear = 1; this.revT = 0;
        } else if (this.gear >= 0) this.revT = 0;
        if (this.gear < 0) { thr = brkIn; brk = thrIn; }
      } else if (this.gear < 0) { thr = thrIn; brk = brkIn; }
      if (this.shiftT > 0) this.shiftT -= dt;

      const target = F.clamp(inp.steer || 0, -1, 1);
      if (inp.analog) this.steer = F.approach(this.steer, target, dt * 7);
      else {
        const back = target === 0 || Math.sign(target) !== Math.sign(this.steer);
        this.steer = F.approach(this.steer, target, dt * (back ? 7 : 3.4));
      }
      const au = Math.abs(u), vel = Math.hypot(u, v);
      let dLim = sp.maxSteer;
      if (this.assist.steer === 'std') dLim = Math.min(sp.maxSteer, (sp.L * this.muAvg * F.G) / Math.max(au * au, 1) + sp.alphaPeak * 1.3 + 0.03);
      let delta = this.steer * dLim;
      const beta = vel > 2 ? Math.atan2(v, au) : 0;
      if (this.assist.steer === 'std' && vel > 6 && Math.abs(beta) > 0.05 && !this.air) {
        const cs = F.clamp(beta * 0.85, -0.45, 0.45);
        delta = F.clamp(delta + cs * (1 - Math.abs(this.steer) * 0.35), -sp.maxSteer, sp.maxSteer);
      }
      this.delta = delta;
      this.stmK = this.assist.stm && Math.abs(beta) > 0.2 && vel > 5 ? F.clamp(1 - (Math.abs(beta) - 0.2) * 3, 0.2, 1) : 1;

      const n = Math.max(1, Math.ceil(dt / INNER - 1e-6)), h = dt / n;
      for (let i = 0; i < n; i++) this.integrate(h, thr, brk, world);
      this.finishStep(dt, thrIn, brkIn, thr, brk);
      if (this.assist.auto && this.gear > 0 && this.shiftT <= 0 && !this.air) this.autoShift(this.u, thrIn, brkIn);
      this.collide(world);
      this.water(dt, world);
      if (this.hitCool > 0) this.hitCool -= dt;
      if (this.scrapeT > 0) this.scrapeT -= dt;
      if (this.dmg) {
        this.dmg.update(dt, this.speed, this.axL);
        for (const e of this.dmg.drain()) this.events.push(e);
      }
    }

    integrate(h, thr, brk, world) {
      const sp = this.spec, k = this.k, W = this.wheels;
      const fx = Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = -fz, rz = fx;
      const u = this.vx * fx + this.vz * fz, v = this.vx * rx + this.vz * rz;
      const sT = Math.sin(this.pitch), sR = Math.sin(this.roll), cT = Math.cos(this.pitch), cR = Math.cos(this.roll), cc = cT * cR;
      const ref = this.y + k.travel + k.wr + 0.6;
      const wet = world.wet;
      const dm = this.dmg && this.dmg.mechOn ? this.dmg.mech : null;
      let contacts = 0;
      for (let i = 0; i < 4; i++) {
        const wl = W[i];
        const px = this.x + fx * wl.lx + rx * wl.lz, pz = this.z + fz * wl.lx + rz * wl.lz;
        const gy = world.ground(px, pz, ref);
        wl.surf = world.lastSurf;
        wl.gy = gy;
        const hp = this.y + (dm ? wl.hTop - dm.sag[i] : wl.hTop) * cc + wl.lx * sT + wl.lz * sR;
        if (!wl.init) { wl.wy = hp - (k.travel - k.xs); wl.wv = this.vy; wl.init = true; }
        let pen = gy + k.wr - (dm ? dm.drop[i] : 0) - wl.wy;
        if (pen > TIRE_PEN) { wl.wy += pen - TIRE_PEN; pen = TIRE_PEN; if (wl.wv < 0) wl.wv = 0; }
        wl.contact = pen > 0;
        wl.load = wl.contact ? Math.max(0, k.kt * pen - k.ct * wl.wv) : 0;
        if (wl.contact) contacts++;
        wl.x = k.travel - (hp - wl.wy);
        wl.xv = wl.wv - (this.vy + wl.lx * this.pitchV * cT + wl.lz * this.rollV * cR);
      }
      if (contacts && this.air) {
        const impact = Math.max(0, -this.vy);
        this.air = false;
        this.landing = impact;
        this.events.push({ t: 'land', impact, airT: this.airT, dist: Math.hypot(this.x - this.airX, this.z - this.airZ) });
        if (this.dmg) {
          const rec = this.dmg.land(impact);
          if (rec) this.events.push({ t: 'dent', rec, land: true, speed: impact, x: this.x, y: this.y, z: this.z });
        }
        if (impact > 7) {
          const kk = F.clamp(1 - (impact - 7) * 0.02, 0.8, 1);
          this.vx *= kk; this.vz *= kk;
        }
        this.airT = 0;
      }
      const stop = k.travel * 0.82;
      for (let i = 0; i < 4; i++) {
        const wl = W[i];
        const ks = wl.front ? k.kf : k.kr, cs = wl.front ? k.cf : k.cr;
        const axv = Math.abs(wl.xv);
        wl.xc = F.clamp(wl.x, 0, k.travel);
        let f = ks * wl.xc + cs * (axv < 0.5 ? wl.xv : Math.sign(wl.xv) * (0.5 + (axv - 0.5) * 0.5));
        if (wl.xc > stop) { const o = wl.xc - stop; f += ks * o * (3 + 90 * o); }
        wl.fs = f;
      }
      { const d = (W[0].xc - W[1].xc) * k.arbF; W[0].fs += d; W[1].fs -= d; }
      { const d = (W[2].xc - W[3].xc) * k.arbR; W[2].fs += d; W[3].fs -= d; }
      let muSum = 0;
      const cd = Math.cos(this.delta), sd = Math.sin(this.delta);
      for (let i = 0; i < 4; i++) {
        const wl = W[i];
        const ui = u - this.r * wl.lz, vi = v + this.r * wl.lx;
        if (dm) {
          const a = (wl.front ? this.delta : 0) + dm.toe[i];
          wl.c = Math.cos(a); wl.s = Math.sin(a);
        } else { wl.c = wl.front ? cd : 1; wl.s = wl.front ? sd : 0; }
        wl.vl = ui * wl.c + vi * wl.s;
        wl.vt = -ui * wl.s + vi * wl.c;
        const loose = (SURF[wl.surf] || SURF[0]).loose;
        wl.mu = sp.grip * surfGrip(wl.surf, sp.off, wet) * (1 + this.launch * 0.25) * (dm ? dm.grip[i] : 1);
        wl.kp = loose ? 0.17 : 0.1;
        wl.ap = sp.alphaPeak * (loose ? 1.35 : 1);
        wl.rr = sp.crr * surfRR(wl.surf, sp.off) * wl.load * k.wr * (dm ? dm.rr[i] : 1);
        muSum += wl.mu;
      }
      this.muAvg = muSum / 4;

      const gr = this.gearRatio(this.gear);
      let driveT = 0, J = 0;
      if (this.gear !== 0 && this.shiftT <= 0) {
        const rpmW = Math.abs(this.drivenSpeed() * gr) * RPM;
        const first = Math.abs(this.gear) === 1;
        const slipTarget = first ? sp.idle + thr * (Math.min(sp.rpmT * 1.25, sp.red * 0.75) - sp.idle) : sp.idle;
        if (rpmW >= slipTarget) {
          this.clutch = 1;
          this.rpm = Math.min(rpmW, sp.red * 1.03);
          J = k.Ie * gr * gr;
        } else {
          this.clutch = 0;
          this.rpm = F.approach(this.rpm, Math.max(slipTarget, rpmW), h * 9000);
        }
        let tq = F.Cars.torqueAt(sp, this.rpm) * thr * this.tcsK * this.stmK * (dm ? dm.power : 1);
        this.limiter = this.rpm >= sp.red;
        if (this.limiter) tq = 0;
        if (thr < 0.05 && this.clutch) tq -= k.fric * (0.25 + 0.75 * this.rpm / sp.red);
        driveT = tq * gr * sp.eta;
      } else this.freeRev(h, this.gear === 0 ? thr : 0);

      const bF = brk * k.brakeT * 0.31, bR = brk * k.brakeT * 0.19;
      for (let i = 0; i < 4; i++) {
        const wl = W[i];
        let tb = (wl.front ? bF : bR) * wl.absK;
        if (!wl.front && this.hand) tb += k.handT;
        wl.tb = tb + wl.rr;
      }
      if (sp.dt === 'RWD') { this.solveAxle(W[2], W[3], driveT, J, h); this.solveAxle(W[0], W[1], 0, 0, h); }
      else if (sp.dt === 'FWD') { this.solveAxle(W[0], W[1], driveT, J, h); this.solveAxle(W[2], W[3], 0, 0, h); }
      else { this.solveAxle(W[0], W[1], driveT * k.awdF, J * k.awdF, h); this.solveAxle(W[2], W[3], driveT * (1 - k.awdF), J * (1 - k.awdF), h); }

      let slip = 0;
      for (let i = 0; i < 4; i++) {
        const wl = W[i];
        wl.ang += wl.w * h;
        if (this.assist.abs && brk > 0.05 && wl.contact && wl.kappa < -wl.kp * 1.4 && Math.abs(wl.vl) > 2) wl.absK = 0.35;
        else wl.absK = Math.min(1, wl.absK + h * 12);
        if (wl.driven && wl.contact) slip = Math.max(slip, wl.kappa / wl.kp);
      }
      if (this.assist.tcs && thr > 0.1 && slip > 1.15) this.tcsK = Math.max(0.04, this.tcsK - h * 9 * (slip - 1));
      else if (!this.assist.tcs || thr <= 0.1 || slip < 0.9) this.tcsK = Math.min(1, this.tcsK + h * 3);

      let Ff = 0, Fr = 0, Mz = 0, Fup = 0, Mp = 0, Mr = 0;
      for (let i = 0; i < 4; i++) {
        const wl = W[i];
        const ff = wl.fx * wl.c - wl.fy * wl.s, fr = wl.fx * wl.s + wl.fy * wl.c;
        Ff += ff; Fr += fr;
        Mz += wl.lx * fr - wl.lz * ff;
        Fup += wl.fs;
        Mp += wl.lx * wl.fs;
        Mr += wl.lz * wl.fs;
        wl.wv += ((wl.load - wl.fs) / k.mu - F.G) * h;
        wl.wy += wl.wv * h;
      }
      Mp += k.h * Ff;
      Mr += k.hRoll * Fr;
      if (contacts >= 3) {
        Ff -= k.m * F.G * ((W[0].gy + W[1].gy) - (W[2].gy + W[3].gy)) * 0.5 / sp.L;
        Fr -= k.m * F.G * ((W[1].gy + W[3].gy) - (W[0].gy + W[2].gy)) * 0.5 / sp.track;
      }
      this.accF = Ff / k.m; this.accR = Fr / k.m;
      const down = 0.5 * F.RHO * sp.cla * (dm ? dm.cla : 1) * u * u;
      Ff -= 0.5 * F.RHO * sp.cda * (dm ? dm.cda : 1) * u * Math.abs(u);
      Fr -= 1.5 * F.RHO * sp.cda * v * Math.abs(v);
      Fup -= down;
      Mp += down * (0.55 * sp.b - 0.45 * sp.a);
      const au = Math.abs(u);
      if (this.assist.stm && contacts && au > 6) {
        const rKin = (u * Math.tan(this.delta)) / sp.L;
        const ex = this.r - rKin;
        const b = Math.atan2(v, au);
        if (Math.abs(b) > 0.14 && Math.sign(ex) === Math.sign(-b || 1)) Mz -= ex * sp.Iz * 2.2;
      }
      if (!contacts) {
        Mz = -this.r * sp.Iz * 0.3;
        Mp += (-this.pitch * 3 - this.pitchV * 1.2) * k.Iy;
        Mr += (-this.roll * 3 - this.rollV * 1.2) * k.Ix;
      }

      this.vx += (Ff * fx + Fr * rx) / k.m * h;
      this.vz += (Ff * fz + Fr * rz) / k.m * h;
      this.r += Mz / sp.Iz * h;
      this.vy += (Fup / k.ms - F.G) * h;
      this.pitchV += Mp / k.Iy * h;
      this.rollV += Mr / k.Ix * h;
      this.x += this.vx * h;
      this.z += this.vz * h;
      this.y += this.vy * h;
      this.yaw = F.wrap(this.yaw + this.r * h);
      this.pitch += this.pitchV * h;
      this.roll += this.rollV * h;
      if (Math.abs(this.pitch) > 0.8) { this.pitch = F.clamp(this.pitch, -0.8, 0.8); this.pitchV = 0; }
      if (Math.abs(this.roll) > 0.6) { this.roll = F.clamp(this.roll, -0.6, 0.6); this.rollV = 0; }
      const gAvg = (W[0].gy + W[1].gy + W[2].gy + W[3].gy) * 0.25;
      if (this.y < gAvg - 0.3) { this.y = gAvg - 0.3; if (this.vy < 0) this.vy = 0; }
      this.travelLimits();

      if (contacts) this.noContact = 0;
      else {
        this.noContact += h;
        if (this.air) this.airT += h;
        else if (this.noContact > 0.08 && Math.hypot(this.vx, this.vz) > 3) {
          this.air = true;
          this.airT = this.noContact;
          this.airX = this.x; this.airZ = this.z;
          this.events.push({ t: 'takeoff' });
        }
      }
    }

    travelLimits() {
      const k = this.k, sag = this.dmg && this.dmg.mechOn ? this.dmg.mech.sag : null;
      for (let i = 0; i < 4; i++) {
        const wl = this.wheels[i];
        const cT = Math.cos(this.pitch), cR = Math.cos(this.roll);
        const hp = this.y + (sag ? wl.hTop - sag[i] : wl.hTop) * cT * cR + wl.lx * Math.sin(this.pitch) + wl.lz * Math.sin(this.roll);
        const hpv = this.vy + wl.lx * this.pitchV * cT + wl.lz * this.rollV * cR;
        const over = wl.wy - hp;
        if (over > 0) {
          const aP = wl.lx * cT / k.Iy, aR = wl.lz * cR / k.Ix, inv = 1 / k.ms + wl.lx * aP + wl.lz * aR;
          const lp = over / inv;
          this.y += lp / k.ms; this.pitch += lp * aP; this.roll += lp * aR;
          const rel = wl.wv - hpv;
          if (rel > 0) { const lv = rel / inv; this.vy += lv / k.ms; this.pitchV += lv * aP; this.rollV += lv * aR; }
        } else if (-over > k.travel) {
          wl.wy = hp - k.travel;
          if (wl.wv < hpv) wl.wv = hpv;
        }
      }
    }

    tireLin(wl, pass) {
      if (!wl.contact || wl.load <= 0) return [0, 0];
      if (pass > 0 && wl.sat) return [0, -wl.fxSat * this.k.wr];
      const r = this.k.wr, D = Math.max(Math.abs(wl.vl), 3);
      const cx = wl.mu * wl.load * TIRE_K * LONG / wl.kp;
      return [cx * r * r / D, cx * r * wl.vl / D];
    }

    solveAxle(A, B, T, J, h) {
      const k = this.k, Iw = k.Iw, r = k.wr;
      const kv = T !== 0 || J > 0 ? k.lsd * 40 : 0;
      const w0A = A.w, w0B = B.w;
      const sA = w0A > 0.05 ? 1 : w0A < -0.05 ? -1 : 0, sB = w0B > 0.05 ? 1 : w0B < -0.05 ? -1 : 0;
      const m11 = Iw + J / 4, m12 = J / 4;
      A.sat = false; B.sat = false;
      for (let pass = 0; pass < 2; pass++) {
        const lA = this.tireLin(A, pass), lB = this.tireLin(B, pass);
        const a11 = m11 / h + lA[0] + kv, a22 = m11 / h + lB[0] + kv, a12 = m12 / h - kv;
        const rA = (m11 * w0A + m12 * w0B) / h + T / 2 + lA[1] - sA * A.tb;
        const rB = (m12 * w0A + m11 * w0B) / h + T / 2 + lB[1] - sB * B.tb;
        const det = a11 * a22 - a12 * a12;
        let wA = (rA * a22 - a12 * rB) / det, wB = (a11 * rB - a12 * rA) / det;
        if (sA !== 0 && Math.sign(wA) === -sA) wA = 0;
        if (sB !== 0 && Math.sign(wB) === -sB) wB = 0;
        if (sA === 0 && A.tb > 0) { const lim = A.tb * h / m11; wA = Math.abs(wA) <= lim ? 0 : wA - Math.sign(wA) * lim; }
        if (sB === 0 && B.tb > 0) { const lim = B.tb * h / m11; wB = Math.abs(wB) <= lim ? 0 : wB - Math.sign(wB) * lim; }
        A.w = wA; B.w = wB;
        this.tireForces(A);
        this.tireForces(B);
        if (pass > 0) break;
        A.sat = Math.abs(A.fx * r) < Math.abs(lA[0] * wA - lA[1]) * 0.97;
        B.sat = Math.abs(B.fx * r) < Math.abs(lB[0] * wB - lB[1]) * 0.97;
        if (!A.sat && !B.sat) break;
        A.fxSat = A.fx; B.fxSat = B.fx;
      }
    }

    tireForces(wl) {
      if (!wl.contact || wl.load <= 0) { wl.fx = 0; wl.fy = 0; wl.kappa = 0; wl.alpha = 0; wl.rho = 0; return; }
      const kappa = (wl.w * this.k.wr - wl.vl) / Math.max(Math.abs(wl.vl), 3);
      const alpha = Math.atan2(wl.vt, Math.max(Math.abs(wl.vl), 2));
      const sx = kappa / wl.kp, sy = Math.tan(F.clamp(alpha, -1.4, 1.4)) / Math.tan(wl.ap);
      const rho = Math.hypot(sx, sy);
      if (rho < 1e-6) { wl.fx = 0; wl.fy = 0; }
      else {
        const f = wl.mu * wl.load * tireCurve(rho) / rho;
        wl.fx = f * sx * LONG;
        wl.fy = -f * sy;
      }
      wl.kappa = kappa; wl.alpha = alpha; wl.rho = rho;
    }

    finishStep(dt, thrIn, brkIn, thr, brk) {
      const sp = this.spec, k = this.k, W = this.wheels;
      const fx = Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = -fz, rz = fx;
      let u = this.vx * fx + this.vz * fz, v = this.vx * rx + this.vz * rz;
      if (!this.air && thrIn < 0.05 && brkIn < 0.05 && Math.hypot(this.vx, this.vz) < 0.25) {
        this.vx *= 0.8; this.vz *= 0.8; this.r *= 0.8;
      }
      if (!this.air && brk > 0.3 && Math.abs(u) < 0.35 && this.gear >= 0 && thr < 0.05) {
        this.vx *= 0.5; this.vz *= 0.5; this.r *= 0.5;
        for (const wl of W) wl.w *= 0.5;
      }
      u = this.vx * fx + this.vz * fz; v = this.vx * rx + this.vz * rz;
      this.u = u; this.v = v;
      this.speed = Math.hypot(this.vx, this.vz);
      this.beta = this.speed > 3 ? Math.atan2(v, Math.abs(u)) : 0;
      let spin = 0, slideF = 0, slideR = 0, lock = 0, squeal = 0;
      for (let i = 0; i < 4; i++) {
        const wl = W[i];
        this.surfW[i] = wl.surf;
        this.spins[i] = wl.ang;
        this.susp[i] = F.clamp(k.wr - (wl.wy - this.y - wl.lx * Math.sin(this.pitch) - wl.lz * Math.sin(this.roll)), -0.15, k.travel + 0.1);
        if (!wl.contact) continue;
        const sx = wl.kappa / wl.kp;
        const lat = Math.abs(Math.tan(F.clamp(wl.alpha, -1.4, 1.4)) / Math.tan(wl.ap));
        if (wl.driven && sx > 1.3) spin = Math.max(spin, F.clamp((sx - 1.3) / 3, 0, 1));
        if (wl.kappa < -0.5 && Math.abs(wl.vl) > 1.5) lock = 1;
        const sl = F.clamp((lat - 0.9) / 2, 0, 1);
        if (wl.front) slideF = Math.max(slideF, sl); else slideR = Math.max(slideR, sl);
        squeal = Math.max(squeal, F.clamp((wl.rho - 0.95) / 1.5, 0, 1));
      }
      this.spin = F.lerp(this.spin, spin, Math.min(1, dt * 10));
      this.slideF = slideF; this.slideR = slideR; this.lock = lock;
      this.surf = W[2].contact ? W[2].surf : W[0].surf;
      const loose = SURF[this.surf] && SURF[this.surf].loose;
      const sk = Math.max(squeal, this.spin, lock * 0.9) * F.clamp(this.speed / 6, 0, 1);
      const burn = this.speed < 6 ? this.spin : 0;
      this.skid = F.lerp(this.skid, (loose ? 0.4 : 1) * Math.max(sk, burn), Math.min(1, dt * 12));
      this.wheelRot = (W[2].ang + W[3].ang) * 0.5;
      this.braking = brkIn > 0.05 && this.gear >= 0 ? 1 : 0;
      this.axL = F.lerp(this.axL, F.clamp(this.accF, -14, 14), Math.min(1, dt * 8));
      this.ayL = F.lerp(this.ayL, F.clamp(this.accR, -14, 14), Math.min(1, dt * 8));
      if (this.launchT > 0) { this.launchT -= dt; if (this.launchT <= 0) this.launch = 0; }
      this.rough = (SURF[this.surf] || SURF[0]).rough * (1 - sp.off * 0.6) * F.clamp(this.speed / 25, 0, 1);
    }

    autoShift(u, thr, brk) {
      const sp = this.spec;
      const n = sp.ratios.length;
      const wheelRpm = (Math.abs(u) / sp.wr) * RPM;
      const cur = wheelRpm * this.gearRatio(this.gear);
      if (this.gear < n && cur > sp.red * 0.95 && thr > 0.2) {
        this.shift(1);
        return;
      }
      if (this.gear < n && cur > sp.red * 0.8 && thr < 0.15 && brk < 0.1) {
        this.shift(1);
        return;
      }
      if (this.gear > 1) {
        const down = wheelRpm * this.gearRatio(this.gear - 1);
        const low = brk > 0.2 ? sp.rpmT * 0.95 : thr > 0.6 ? Math.max(sp.rpmT * 0.8, sp.idle * 1.8) : sp.idle * 1.7;
        if (cur < low && down < sp.red * 0.86) this.shift(-1);
      }
    }

    shift(dir) {
      const n = this.spec.ratios.length;
      if (dir > 0) {
        if (this.gear < 0) { this.gear = 1; return; }
        if (this.gear >= n) return;
        this.gear++;
      } else {
        if (this.gear <= 1) {
          if (!this.assist.auto && Math.abs(this.u) < 2) this.gear = this.gear === 1 ? -1 : this.gear;
          return;
        }
        this.gear--;
      }
      this.shiftT = this.spec.shift;
      this.events.push({ t: 'shift', dir });
    }

    obb() {
      const sp = this.spec;
      const fx = Math.sin(this.yaw), fz = -Math.cos(this.yaw);
      return { x: this.x, z: this.z, fx, fz, rx: -fz, rz: fx, hl: sp.len * 0.5, hw: sp.wid * 0.5 };
    }

    collide(world) {
      const sp = this.spec;
      const R = sp.len * 0.5 + 1;
      const list = world.colliders(this.x - R, this.z - R, this.x + R, this.z + R);
      if (!list.length) { this.brush = null; return; }
      const o = this.obb();
      let brush = null;
      for (let pass = 0; pass < 2; pass++) {
        for (const c of list) {
          if (c.y1 !== undefined && (this.y > c.y1 || this.y + sp.hgt < c.y0)) continue;
          if (c.broken) continue;
          if (c.k === 'brush') {
            if (pass) continue;
            const bh = c.seg ? obbSeg(o, { x1: c.x1, z1: c.z1, x2: c.x2, z2: c.z2, r: c.w }) : obbCirc(o, c.x, c.z, c.r);
            if (!bh) continue;
            (brush || (brush = [])).push(c);
            if (this.speed > 2 && !(this.brush && this.brush.includes(c))) {
              const k = c.drag * Math.min(1, this.speed / 12);
              this.vx *= 1 - k; this.vz *= 1 - k;
              this.events.push({ t: 'brush', obj: c, speed: this.speed, x: bh.px, z: bh.pz });
            }
            continue;
          }
          let hit = null;
          if (c.k === 'box') hit = obbObb(o, c);
          else if (c.k === 'poly') hit = obbPoly(o, c);
          else if (c.k === 'circ' || c.k === 'smash') hit = obbCirc(o, c.x, c.z, c.r);
          else if (c.k === 'seg') hit = obbSeg(o, c);
          if (!hit) continue;
          if (c.k === 'smash') {
            if (this.speed > 1.5) {
              c.broken = true;
              const vx0 = this.vx, vz0 = this.vz, vn = Math.max(0, -(vx0 * hit.nx + vz0 * hit.nz));
              const k = c.mass / (c.mass + sp.mass);
              this.vx *= 1 - k; this.vz *= 1 - k;
              this.events.push({ t: 'smash', obj: c, speed: this.speed, vx: vx0, vz: vz0, nx: hit.nx, nz: hit.nz, px: hit.px, pz: hit.pz });
              if (this.dmg) { const hk = F.DMG.hardOf(c); this.crash(hit.px, hit.pz, hit.nx, hit.nz, vn, c, hk[0], hk[1]); }
              continue;
            }
          }
          this.x += hit.nx * hit.d;
          this.z += hit.nz * hit.d;
          o.x = this.x; o.z = this.z;
          this.impulse(hit.px, hit.pz, hit.nx, hit.nz, c.k === 'smash' ? 0.1 : 0.22, c);
        }
      }
      this.brush = brush;
    }

    impulse(px, pz, nx, nz, e, obj) {
      const sp = this.spec;
      const rpx = px - this.x, rpz = pz - this.z;
      const perpX = -rpz, perpZ = rpx;
      const vpx = this.vx + this.r * perpX, vpz = this.vz + this.r * perpZ;
      const vn = vpx * nx + vpz * nz;
      if (vn >= 0) return;
      const k = perpX * nx + perpZ * nz;
      const J = (-(1 + e) * vn) / (1 / sp.mass + (k * k) / sp.Iz);
      this.vx += (J * nx) / sp.mass;
      this.vz += (J * nz) / sp.mass;
      this.r += (J * k) / sp.Iz * 0.6;
      const tx = -nz, tz = nx;
      const vt = vpx * tx + vpz * tz;
      const kt = perpX * tx + perpZ * tz;
      let Jt = -vt / (1 / sp.mass + (kt * kt) / sp.Iz);
      Jt = F.clamp(Jt, -0.35 * J, 0.35 * J);
      this.vx += (Jt * tx) / sp.mass;
      this.vz += (Jt * tz) / sp.mass;
      this.r += (Jt * kt) / sp.Iz * 0.6;
      const fwd = Math.sin(this.yaw) * nx - Math.cos(this.yaw) * nz, side = Math.cos(this.yaw) * nx + Math.sin(this.yaw) * nz;
      this.pitchV += fwd * J / sp.mass * 0.25;
      this.rollV += side * J / sp.mass * 0.35;
      const imp = -vn;
      if (imp > 1.2 && this.hitCool <= 0) {
        this.events.push({ t: 'hit', impact: imp, obj, x: px, z: pz });
        this.hitCool = 0.25;
      }
      this.contact = Math.max(this.contact, imp);
      if (!this.dmg || !obj) return;
      if (imp > F.DMG.TUNE.v0) {
        const hk = F.DMG.hardOf(obj);
        this.crash(px, pz, nx, nz, imp, obj, hk[0], hk[1]);
      } else if (Math.abs(vt) > F.DMG.TUNE.scrape && this.scrapeT <= 0) {
        this.scrapeT = 0.1;
        const q = this.toLocal(px, pz, nx, nz, obj);
        const rec = this.dmg.scrape(q[0], q[1], q[2], q[3], Math.abs(vt));
        if (rec) this.events.push({ t: 'dent', rec, scrape: true, speed: Math.abs(vt), x: px, y: this.y + rec.y, z: pz });
      }
    }

    toLocal(px, pz, nx, nz, obj) {
      const o = this.obb();
      let cu = (px - o.x) * o.fx + (pz - o.z) * o.fz, cv = (px - o.x) * o.rx + (pz - o.z) * o.rz;
      const du = -(nx * o.fx + nz * o.fz), dv = -(nx * o.rx + nz * o.rz);
      if (obj && obj.k !== 'circ' && obj.k !== 'smash') {
        const front = Math.abs(du) >= Math.abs(dv), span = front ? o.hw : o.hl;
        const fu = Math.sign(du) * o.hl, fv = Math.sign(dv) * o.hw;
        let su = 0, sv = 0, n = 0;
        for (let k = -2; k <= 2; k++) {
          const t = k / 2 * span * 0.95, u = front ? fu : t, v = front ? t : fv;
          if (insideCol(obj, o.x + o.fx * u + o.rx * v, o.z + o.fz * u + o.rz * v, 0.25)) { su += u; sv += v; n++; }
        }
        if (n) { cu = su / n; cv = sv / n; } else if (front) { cu = fu; cv = F.clamp(cv, -o.hw, o.hw); } else { cv = fv; cu = F.clamp(cu, -o.hl, o.hl); }
      }
      return [cv, -cu, nx * o.rx + nz * o.rz, -(nx * o.fx + nz * o.fz)];
    }

    crash(px, pz, nx, nz, speed, obj, hard = 1, rk = 1, y = null) {
      if (!this.dmg) return null;
      const q = this.toLocal(px, pz, nx, nz, obj);
      const rec = this.dmg.hit(q[0], y, q[1], q[2], q[3], speed, hard, rk);
      if (rec) this.events.push({ t: 'dent', rec, speed, x: px, y: this.y + rec.y, z: pz, obj, nx, nz });
      return rec;
    }

    water(dt, world) {
      const d = world.waterDepth(this.x, this.z);
      if (d > 0.4 && this.y < F.WATER_Y + 0.25) {
        this.waterT += dt;
        const k = Math.exp(-dt * 2.5);
        this.vx *= k; this.vz *= k; this.r *= k;
        for (const wl of this.wheels) wl.w *= k;
        if (this.waterT > 0.05 && this.waterT - dt <= 0.05) this.events.push({ t: 'splash' });
      } else this.waterT = 0;
    }

    snap() {
      const W = this.wheels;
      return [this.x, this.y, this.z, this.yaw, this.vx, this.vz, this.vy, this.r, this.air ? 1 : 0, this.airT, this.rpm, this.gear, this.steer, this.pitch, this.roll, this.pitchV, this.rollV, W[0].w, W[1].w, W[2].w, W[3].w, this.dmg ? this.dmg.mark() : null];
    }

    restore(s) {
      [this.x, this.y, this.z, this.yaw, this.vx, this.vz, this.vy, this.r] = s;
      this.air = !!s[8]; this.airT = s[9]; this.rpm = s[10]; this.gear = s[11]; this.steer = s[12];
      this.pitch = s[13] || 0; this.roll = s[14] || 0; this.pitchV = s[15] || 0; this.rollV = s[16] || 0;
      for (let i = 0; i < 4; i++) { const wl = this.wheels[i]; wl.w = s[17 + i] || 0; wl.contact = false; wl.absK = 1; wl.init = false; }
      this.noContact = 0;
      this.shiftT = 0; this.speed = Math.hypot(this.vx, this.vz);
      this.waterT = 0;
      if (this.dmg && s[21]) this.dmg.rewind(s[21]);
    }
  }

  function insideCol(c, x, z, m) {
    if (c.k === 'box') {
      const dx = x - c.x, dz = z - c.z;
      return Math.abs(dx * c.c + dz * c.s) < c.hx + m && Math.abs(-dx * c.s + dz * c.c) < c.hz + m;
    }
    if (c.k === 'poly') return F.inPoly(x, z, c.pts) || F.polyEdgeDist(x, z, c.pts) < m;
    if (c.k === 'seg') return F.segDist(x, z, c.x1, c.z1, c.x2, c.z2).d < c.r + m;
    return Math.hypot(x - c.x, z - c.z) < (c.r || 0) + m;
  }

  function obbObb(o, c) {
    const dx = c.x - o.x, dz = c.z - o.z;
    const axes = [[o.fx, o.fz], [o.rx, o.rz], [c.c, c.s], [-c.s, c.c]];
    let best = Infinity, bx = 0, bz = 0;
    for (const [ax, az] of axes) {
      const ra = o.hl * Math.abs(o.fx * ax + o.fz * az) + o.hw * Math.abs(o.rx * ax + o.rz * az);
      const rb = c.hx * Math.abs(c.c * ax + c.s * az) + c.hz * Math.abs(-c.s * ax + c.c * az);
      const dist = dx * ax + dz * az;
      const ov = ra + rb - Math.abs(dist);
      if (ov <= 0) return null;
      if (ov < best) {
        best = ov;
        const s = dist > 0 ? -1 : 1;
        bx = ax * s; bz = az * s;
      }
    }
    const cp = closestOnObb(o, c.x, c.z);
    const px = F.clamp(cp[0], c.x - c.hx - c.hz, c.x + c.hx + c.hz);
    const pz = F.clamp(cp[1], c.z - c.hx - c.hz, c.z + c.hx + c.hz);
    return { nx: bx, nz: bz, d: best, px, pz };
  }

  function obbPoly(o, c) {
    const P = c.pts, n = P.length;
    const corners = [[o.x + o.fx * o.hl + o.rx * o.hw, o.z + o.fz * o.hl + o.rz * o.hw], [o.x + o.fx * o.hl - o.rx * o.hw, o.z + o.fz * o.hl - o.rz * o.hw],
      [o.x - o.fx * o.hl - o.rx * o.hw, o.z - o.fz * o.hl - o.rz * o.hw], [o.x - o.fx * o.hl + o.rx * o.hw, o.z - o.fz * o.hl + o.rz * o.hw]];
    let best = Infinity, bx = 0, bz = 0;
    const test = (ax, az) => {
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (const q of corners) { const d = q[0] * ax + q[1] * az; if (d < a0) a0 = d; if (d > a1) a1 = d; }
      for (const q of P) { const d = q[0] * ax + q[1] * az; if (d < b0) b0 = d; if (d > b1) b1 = d; }
      const ov = Math.min(a1 - b0, b1 - a0);
      if (ov <= 0) return false;
      if (ov < best) {
        best = ov;
        const s = (a0 + a1) * 0.5 < (b0 + b1) * 0.5 ? -1 : 1;
        bx = ax * s; bz = az * s;
      }
      return true;
    };
    if (!test(o.fx, o.fz) || !test(o.rx, o.rz)) return null;
    for (let i = 0; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n];
      let ax = b[1] - a[1], az = a[0] - b[0];
      const l = Math.hypot(ax, az);
      if (l < 1e-6) continue;
      if (!test(ax / l, az / l)) return null;
    }
    const cp = closestOnObb(o, c.x, c.z);
    return { nx: bx, nz: bz, d: best, px: cp[0], pz: cp[1] };
  }

  function closestOnObb(o, px, pz) {
    const dx = px - o.x, dz = pz - o.z;
    const lf = F.clamp(dx * o.fx + dz * o.fz, -o.hl, o.hl);
    const lr = F.clamp(dx * o.rx + dz * o.rz, -o.hw, o.hw);
    return [o.x + o.fx * lf + o.rx * lr, o.z + o.fz * lf + o.rz * lr];
  }

  function obbCirc(o, cx, cz, r) {
    const cp = closestOnObb(o, cx, cz);
    let dx = cp[0] - cx, dz = cp[1] - cz;
    let d = Math.hypot(dx, dz);
    if (d >= r) return null;
    if (d < 1e-4) {
      dx = o.x - cx; dz = o.z - cz;
      d = Math.hypot(dx, dz) || 1;
      return { nx: dx / d, nz: dz / d, d: r, px: cx, pz: cz };
    }
    return { nx: dx / d, nz: dz / d, d: r - d, px: cp[0], pz: cp[1] };
  }

  function obbSeg(o, c) {
    const mx = (c.x1 + c.x2) * 0.5, mz = (c.z1 + c.z2) * 0.5;
    const len = Math.hypot(c.x2 - c.x1, c.z2 - c.z1) || 1;
    const box = { x: mx, z: mz, hx: len * 0.5, hz: c.r, c: (c.x2 - c.x1) / len, s: (c.z2 - c.z1) / len };
    return obbObb(o, box);
  }

  F.Vehicle = Vehicle;
  F.Coll = { obbObb, obbPoly, obbCirc, obbSeg, closestOnObb, insideCol };

  const PI_IN = [100, 290, 411, 480, 560, 660, 700, 780, 800, 900, 998];
  const PI_OUT = [100, 160, 300, 450, 505, 600, 640, 790, 812, 950, 998];
  function piMap(raw) {
    for (let i = 1; i < PI_IN.length; i++) {
      if (raw <= PI_IN[i]) return F.lerp(PI_OUT[i - 1], PI_OUT[i], (raw - PI_IN[i - 1]) / (PI_IN[i] - PI_IN[i - 1]));
    }
    return PI_OUT[PI_OUT.length - 1];
  }

  const perfCache = new Map();
  function perf(sp) {
    const key = sp.id + JSON.stringify(sp.up);
    if (perfCache.has(key)) return perfCache.get(key);
    const veh = new Vehicle(sp, { assist: { abs: true, tcs: true, stm: true, auto: true, steer: 'std' } });
    veh.place(0, 0, 0, NullWorld);
    const dt = 1 / 120;
    let t = 0, t60 = 0, t100 = 0, vmax = 0, lastGain = 0;
    const inp = { thr: 1, brk: 0, steer: 0 };
    for (let i = 0; i < 120 * 120; i++) {
      veh.step(dt, inp, NullWorld);
      t += dt;
      const kmh = veh.speed * 3.6;
      if (!t60 && kmh >= 60) t60 = t;
      if (!t100 && kmh >= 100) t100 = t;
      if (kmh > vmax + 0.05) { vmax = kmh; lastGain = t; }
      if (t - lastGain > 6) break;
    }
    if (!t100) t100 = 60;
    if (!t60) t60 = 40;
    const latG = F.clamp(sp.grip * (1 + (0.5 * F.RHO * sp.cla * 27.8 * 27.8) / (sp.mass * F.G) * 0.9), 0.3, 2);
    const dec = Math.min(sp.grip * 1.1, sp.brake) * F.G * 0.92;
    const brake100 = (27.78 * 27.78) / (2 * dec);
    const speed = F.clamp((vmax - 100) / 28, 0, 10);
    const accel = F.clamp(10 * (1 - Math.log(t100 / 2.4) / Math.log(40 / 2.4)), 0, 10);
    const launch = F.clamp(10 * (1 - Math.log(t60 / 1.2) / Math.log(22 / 1.2)), 0, 10);
    const handling = F.clamp((latG - 0.58) * 15, 0, 10);
    const braking = F.clamp((72 - brake100) / 4.2, 0, 10);
    const offroad = F.clamp(sp.off * 10, 0, 10);
    const w = 0.33 * speed / 10 + 0.27 * accel / 10 + 0.26 * handling / 10 + 0.08 * braking / 10 + 0.06 * launch / 10;
    const pi = Math.round(F.clamp(piMap(100 + 899 * Math.pow(F.clamp(w, 0, 1), 0.82)), 100, 998));
    const res = { speed, accel, launch, handling, braking, offroad, pi, cls: F.classOf(pi).c, t60, t100, vmax, latG, brake100 };
    perfCache.set(key, res);
    return res;
  }
  F.perf = perf;
  F.perfOf = (id, up) => perf(F.Cars.spec(id, up || {}));
})(globalThis.Forza = globalThis.Forza || {});
