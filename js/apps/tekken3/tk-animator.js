(function (T) {
  'use strict';
  const { clamp, lerp, wrapAngle, EASE, fillPose, clonePose, lerpPose, stancePose, mod, setHand, setFoot, evalTrack, ARCH, LV_Y, solve } = T;

  function crouchOf(S) {
    const c = mod(S, { '+p': [0.03, -0.34, 0], '+cp': 0.16, hp: -0.08 });
    c.lf = [S.lf[0] + 0.04, S.lf[1], S.lf[2] * 1.15];
    c.rf = [S.rf[0] - 0.04, S.rf[1], S.rf[2] * 1.15];
    c.lk = [1, 0.3, -0.3]; c.rk = [1, 0.3, 0.3];
    c.lh = [S.lh[0], S.lh[1] - 0.06, S.lh[2]]; c.rh = [S.rh[0], S.rh[1] - 0.06, S.rh[2]];
    return c;
  }

  function lieOf(face) {
    const up = face !== 'down';
    return fillPose({
      p: [0, 0.13, 0], py: 0, cy: 0, cp: 0, cr: 0, hy: 0, hp: up ? -0.15 : 0.25,
      bp: up ? -Math.PI / 2 : Math.PI / 2,
      lh: [0.02, 0.02, -0.34], rh: [0.05, 0.08, 0.36], le: [0, -0.3, -1], re: [0, -0.3, 1],
      lf: [0.06, -0.7, -0.16], rf: [0.2, -0.62, 0.14], lk: [1, 0, -0.3], rk: [1, 0, 0.3],
      lo: 1, ro: 1
    });
  }

  const REACT = {
    hitH: (S, k) => mod(S, { '+p': [-0.07 * k, -0.02, 0], cp: S.cp - 0.32 * k, hp: -0.5 * k, hy: 0.3 * k, '+cy': 0.25 * k, lh: [0.1, 0.3, -0.34], rh: [0.05, 0.25, 0.36], lo: 1, ro: 1 }),
    hitM: (S, k) => mod(S, { '+p': [-0.05 * k, -0.06 * k, 0], cp: S.cp + 0.5 * k, hp: 0.25 * k, lh: [0.25, 0.08, -0.08], rh: [0.26, 0.05, 0.1], lo: 1, ro: 1 }),
    hitL: (S, k) => {
      const p = mod(S, { '+p': [0, -0.1 * k, 0], cp: S.cp + 0.2 * k, hp: 0.15 * k, '+cr': 0.12 * k });
      p.lf = [S.lf[0] - 0.08 * k, S.lf[1] + 0.05 * k, S.lf[2]];
      return p;
    },
    hitC: (C, k) => mod(C, { '+p': [-0.05 * k, -0.04 * k, 0], cp: C.cp - 0.2 * k, hp: -0.4 * k, lo: 1, ro: 1 }),
    double: (S, k) => mod(S, { '+p': [-0.02, -0.18 * k, 0], cp: 0.95 * k, hp: 0.3, lh: [0.25, 0.05, -0.06], rh: [0.24, 0.02, 0.08], lo: 1, ro: 1, py: 0.1, cy: 0 }),
    stagger: (S, k) => mod(S, { '+p': [-0.1 * k, -0.08 * k, 0], cp: -0.2 * k, hp: -0.3 * k, cr: 0.25 * Math.sin(k * 5), lh: [0.05, 0.1, -0.4], rh: [-0.05, 0.2, 0.4], lo: 1, ro: 1 })
  };

  function guardHigh(S) {
    return mod(S, { '+p': [-0.02, -0.02, 0], '+cp': -0.04, hp: 0.12, lh: [0.28, 0.5, -0.07], rh: [0.26, 0.5, 0.09], le: [0.2, -1, -0.3], re: [0.2, -1, 0.3] });
  }

  function guardLow(C) {
    return mod(C, { lh: [0.36, 0.08, -0.1], rh: [0.34, 0.1, 0.12], le: [0, -1, -0.6], re: [0, -1, 0.6], hp: 0.05 });
  }

  function airPose(S, bp, t) {
    return fillPose({
      p: [0, 0.9, 0], py: 0.2, cy: 0, cp: -0.2, cr: 0, hy: 0, hp: -0.4, bp,
      lh: [0.1 - 0.1 * Math.sin(t * 0.4), 0.55, -0.42], rh: [0.0, 0.45 + 0.1 * Math.sin(t * 0.3), 0.44], le: [0, 0.2, -1], re: [0, 0.2, 1],
      lf: [0.25, 0.3, -0.16], rf: [0.05, 0.12, 0.16], lk: [1, 0.2, -0.2], rk: [1, 0.3, 0.2], lo: 1, ro: 1
    });
  }

  const THROW_POSES = {
    grab: S => { const p = mod(S, { '+p': [0.06, -0.03, 0], py: 0.05, cy: 0, cp: 0.12, lo: 1, ro: 1 }); setHand(p, T.BODY, 'l', [0.5, 1.4, -0.14]); setHand(p, T.BODY, 'r', [0.5, 1.4, 0.14]); return p; },
    grabHigh: S => { const p = mod(S, { '+p': [0.04, 0, 0], py: 0.2, cy: 0, cp: 0, ro: 1 }); setHand(p, T.BODY, 'r', [0.55, 1.5, 0.02]); return p; },
    liftOne: S => { const p = mod(S, { '+p': [0.02, 0.02, 0], py: 0.2, cy: 0, cp: -0.15, ro: 1 }); setHand(p, T.BODY, 'r', [0.55, 1.95, 0.02]); p.re = [0, -0.2, 1]; return p; },
    kneeUp: S => { const p = THROW_POSES.grab(S); p.rf = [0.1, 0.62, 0.08]; p.rk = [1, 0.6, 0]; p.p = [p.p[0] + 0.04, p.p[1] + 0.03, 0]; p.cp -= 0.1; return p; },
    shove: S => { const p = mod(S, { '+p': [0.14, -0.04, 0], py: 0.1, cy: 0, cp: 0.2, lo: 1, ro: 1 }); setHand(p, T.BODY, 'l', [0.72, 1.3, -0.12]); setHand(p, T.BODY, 'r', [0.72, 1.3, 0.12]); return p; },
    hipLoad: S => { const p = mod(S, { '+p': [0.02, -0.18, 0], py: 1.5, cy: 0.2, cp: 0.3, lo: 1, ro: 1 }); setHand(p, T.BODY, 'l', [0.4, 1.2, -0.2]); setHand(p, T.BODY, 'r', [0.3, 1.25, 0.2]); return p; },
    hipThrow: S => { const p = mod(S, { '+p': [0.05, -0.28, 0], py: 1.8, cy: 0.3, cp: 0.8, lo: 1, ro: 1 }); setHand(p, T.BODY, 'l', [0.6, 0.6, -0.1]); setHand(p, T.BODY, 'r', [0.55, 0.6, 0.15]); return p; },
    lift: S => { const p = mod(S, { '+p': [0.05, -0.2, 0], py: 0.05, cy: 0, cp: 0.25, lo: 1, ro: 1 }); setHand(p, T.BODY, 'l', [0.42, 1.05, -0.18]); setHand(p, T.BODY, 'r', [0.42, 1.05, 0.18]); return p; },
    bridge: S => { const p = mod(S, { p: [0.15, 0.75, 0], py: 0, cy: 0, cp: -1.2, hp: -0.6, lo: 1, ro: 1 }); p.lf = [0.35, 0.075, -0.16]; p.rf = [0.35, 0.075, 0.16]; p.lk = [1, 0.4, -0.2]; p.rk = [1, 0.4, 0.2]; setHand(p, T.BODY, 'l', [-0.3, 1.3, -0.15]); setHand(p, T.BODY, 'r', [-0.3, 1.3, 0.15]); return p; },
    liftHigh: S => { const p = mod(S, { '+p': [0, 0.02, 0], py: 0, cy: 0, cp: -0.08, lo: 1, ro: 1 }); setHand(p, T.BODY, 'l', [0.12, 2.05, -0.22]); setHand(p, T.BODY, 'r', [0.12, 2.05, 0.22]); p.le = [0, 0, -1]; p.re = [0, 0, 1]; return p; },
    slamDown: S => { const p = mod(S, { '+p': [0.12, -0.3, 0], py: 0, cy: 0, cp: 0.7, lo: 1, ro: 1 }); setHand(p, T.BODY, 'l', [0.7, 0.35, -0.2]); setHand(p, T.BODY, 'r', [0.7, 0.35, 0.2]); return p; },
    headBack: S => { const p = THROW_POSES.grab(S); p.cp = -0.3; p.hp = -0.4; return p; },
    headFwd: S => { const p = THROW_POSES.grab(S); p.cp = 0.35; p.hp = 0.35; p.p = [p.p[0] + 0.06, p.p[1], 0]; return p; },
    sitBack: S => { const p = mod(S, { p: [-0.1, 0.45, 0], py: 0, cy: 0, cp: 0.3, lo: 1, ro: 1 }); p.lf = [0.35, 0.075, -0.16]; p.rf = [0.2, 0.3, 0.12]; setHand(p, T.BODY, 'l', [0.45, 1.1, -0.15]); setHand(p, T.BODY, 'r', [0.45, 1.1, 0.15]); return p; },
    rollKick: S => { const p = fillPose({ p: [-0.2, 0.22, 0], bp: -1.5, hp: 0.3, lo: 1, ro: 1, lh: [0.3, 0.55, -0.18], rh: [0.3, 0.55, 0.18], lf: [0.4, -0.4, -0.12], rf: [0.2, -0.9, 0.12], lk: [1, 0, -0.2], rk: [1, 0, 0.2] }); return p; },
    choke: S => { const p = mod(S, { '+p': [0.05, -0.25, 0], py: 0, cy: 0, cp: 0.45, lo: 0, ro: 0 }); setHand(p, T.BODY, 'l', [0.45, 0.95, -0.08]); setHand(p, T.BODY, 'r', [0.45, 0.98, 0.08]); return p; },
    dive: S => { const p = mod(S, { p: [0.3, 0.55, 0], py: 0, cy: 0, cp: 1.0, hp: -0.5, lo: 1, ro: 1 }); setHand(p, T.BODY, 'l', [0.85, 0.7, -0.2]); setHand(p, T.BODY, 'r', [0.85, 0.7, 0.2]); p.lf = [-0.3, 0.1, -0.12]; p.rf = [-0.55, 0.35, 0.12]; return p; },
    mount: S => { const p = fillPose({ p: [0.5, 0.52, 0], py: 0, cp: 0.25, hp: 0.35, lh: [0.3, 0.3, -0.2], rh: [0.3, 0.35, 0.2], lf: [0.2, 0.075, -0.35], rf: [0.2, 0.075, 0.35], lk: [1, 0.2, -0.5], rk: [1, 0.2, 0.5] }); return p; },
    mountHitL: S => { const p = THROW_POSES.mount(S); setHand(p, T.BODY, 'l', [0.8, 0.28, -0.05]); p.cy = 0.4; return p; },
    mountHitR: S => { const p = THROW_POSES.mount(S); setHand(p, T.BODY, 'r', [0.8, 0.28, 0.05]); p.cy = -0.4; return p; },
    hug: S => { const p = mod(S, { '+p': [0.06, 0, 0], py: 0, cy: 0, cp: 0.05, lo: 1, ro: 1 }); setHand(p, T.BODY, 'l', [0.55, 1.2, 0.08]); setHand(p, T.BODY, 'r', [0.55, 1.22, -0.08]); p.le = [0, 0, -1]; p.re = [0, 0, 1]; return p; },
    hugShake: S => { const p = THROW_POSES.hug(S); p.cp = -0.25; p.p = [p.p[0], p.p[1] + 0.06, 0]; p.cr = 0.15; return p; },
    twist: S => { const p = mod(S, { '+p': [0.04, -0.06, 0], py: -0.6, cy: -0.3, cp: 0.25, lo: 1, ro: 1 }); setHand(p, T.BODY, 'l', [0.45, 1.1, 0.1]); setHand(p, T.BODY, 'r', [0.4, 1.0, 0.3]); return p; },
    kneelHold: S => { const p = fillPose({ p: [0.05, 0.5, 0], py: 0.2, cp: 0.5, hp: 0.4, lh: [0.45, 0.1, 0.0], rh: [0.45, 0.05, 0.2], lf: [0.25, 0.075, -0.2], rf: [-0.35, 0.1, 0.12], lk: [1, 0.3, -0.2], rk: [0.3, -1, 0.2], lo: 1, ro: 1 }); return p; },
    stance: S => S
  };

  const VICTIM = {
    held: S => mod(S, { '+p': [0, 0.02, 0], cp: 0.05, hp: -0.1, lh: [0.25, 0.3, -0.3], rh: [0.25, 0.28, 0.3], lo: 1, ro: 1 }),
    double: S => REACT.double(S, 1),
    fly: () => fillPose({ p: [0, 0.9, 0], cp: -0.1, hp: -0.3, lh: [0.05, 0.6, -0.45], rh: [0.05, 0.6, 0.45], le: [0, 0.3, -1], re: [0, 0.3, 1], lf: [0.1, 0.1, -0.22], rf: [-0.05, 0.12, 0.22], lo: 1, ro: 1 }),
    limp: () => fillPose({ p: [0, 0.9, 0], cp: 0, hp: -0.1, lh: [0.02, 0.0, -0.34], rh: [0.05, 0.05, 0.36], lf: [0.06, 0.075, -0.16], rf: [0.2, 0.12, 0.14], lo: 1, ro: 1 })
  };

  function winPoses(S) {
    const fist = mod(S, { '+p': [0, 0.06, 0], py: 0.2, cy: 0, cp: -0.1, hp: -0.25, ro: 0 });
    setHand(fist, T.BODY, 'r', [0.12, 2.1, 0.25]);
    fist.re = [0, 0, 1];
    fist.lf = [0.12, 0.075, -0.14]; fist.rf = [-0.1, 0.075, 0.14];
    const bow = mod(S, { '+p': [-0.02, 0.06, 0], py: 0, cy: 0, cp: 0.55, hp: 0.3, lh: [0.08, 0.05, -0.28], rh: [0.08, 0.05, 0.28], lo: 1, ro: 1 });
    bow.lf = [0.05, 0.075, -0.12]; bow.rf = [0.05, 0.075, 0.12]; bow.lfy = 0; bow.rfy = 0;
    const upright = mod(S, { '+p': [0, 0.07, 0], py: 0, cy: 0, cp: 0, hp: 0, lh: [0.08, 0.05, -0.28], rh: [0.08, 0.05, 0.28], lo: 1, ro: 1 });
    upright.lf = bow.lf; upright.rf = bow.rf; upright.lfy = 0; upright.rfy = 0;
    const flex = mod(upright, { cp: -0.05, hp: -0.1, ro: 0, lo: 0 });
    setHand(flex, T.BODY, 'l', [0.05, 1.75, -0.42]); setHand(flex, T.BODY, 'r', [0.05, 1.75, 0.42]);
    flex.le = [0, -0.2, -1]; flex.re = [0, -0.2, 1];
    return { fist, bow, upright, flex };
  }

  class Chain {
    constructor(n, len) { this.n = n; this.len = len; this.p = null; this.o = null; }
    update(anchor, dirHint, grav) {
      const n = this.n;
      if (!this.p) {
        this.p = []; this.o = [];
        for (let i = 0; i <= n; i++) { const q = [anchor[0] + dirHint[0] * this.len * i, anchor[1] + dirHint[1] * this.len * i, anchor[2] + dirHint[2] * this.len * i]; this.p.push(q); this.o.push(q.slice()); }
      }
      this.p[0] = anchor.slice();
      for (let i = 1; i <= n; i++) {
        const p = this.p[i], o = this.o[i];
        const vx = (p[0] - o[0]) * 0.86, vy = (p[1] - o[1]) * 0.86, vz = (p[2] - o[2]) * 0.86;
        o[0] = p[0]; o[1] = p[1]; o[2] = p[2];
        p[0] += vx + dirHint[0] * 0.0025; p[1] += vy - (grav || 0.004) + dirHint[1] * 0.0025; p[2] += vz + dirHint[2] * 0.0025;
        if (p[1] < 0.02) p[1] = 0.02;
      }
      for (let it = 0; it < 3; it++) {
        for (let i = 1; i <= n; i++) {
          const a = this.p[i - 1], b = this.p[i];
          const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
          const d = Math.hypot(dx, dy, dz) || 1e-6;
          const k = this.len / d;
          b[0] = a[0] + dx * k; b[1] = a[1] + dy * k; b[2] = a[2] + dz * k;
        }
      }
      return this.p;
    }
  }

  class Animator {
    constructor(f) {
      this.f = f;
      this.B = f.B;
      this.initStyle(f.sd);
      this.pose = clonePose(this.S);
      this.from = null; this.blendT = 0; this.blendN = 0;
      this.sig = '';
      this.feet = null;
      this.clock = 0;
      this.moveFrom = null;
      this.chains = {};
      this.j = solve(this.pose, this.B);
    }

    initStyle(def) {
      this.styleDef = def;
      this.S = def.stancePose ? fillPose(def.stancePose, stancePose(def.stance)) : stancePose(def.stance || 'karate');
      this.style = T.STANCES[def.stance] || T.STANCES.karate;
      this.C = crouchOf(this.S);
      this.G = guardHigh(this.S);
      this.GL = guardLow(this.C);
      this.W = winPoses(this.S);
      this.cache = new Map();
    }

    track(m) {
      let keys = this.cache.get(m.id);
      if (keys) return keys;
      const f = this.f;
      const s = this.B.size || 1;
      const a = m.anim || { arch: 'punch', kind: 'straight', side: 'r' };
      const base = m.crouch || m.fromCrouch ? this.C : this.S;
      const endPose = m.fc ? this.C : this.S;
      const y = a.y || m.y || LV_Y[m.l] || LV_Y.m;
      const ctx = Object.assign({ B: this.B, s, base, st: m.st, act: m.act, rec: m.rec, y, r: m.r, endPose }, a);
      if (a.mods) ctx.mods = a.mods;
      const fn = ARCH[a.arch] || ARCH.punch;
      keys = T.buildTrack(fn(ctx));
      if (a.lo || a.open) keys = keys.map((k, i) => i === keys.length - 1 ? k : { f: k.f, e: k.e, pose: mod(k.pose, { lo: 1, ro: 1 }) });
      this.cache.set(m.id, keys);
      return keys;
    }

    grabTrack(m) {
      let keys = this.cache.get('grab:' + m.id);
      if (keys) return keys;
      const S = this.S;
      const g = THROW_POSES.grab(S);
      const reach = mod(g, { '+p': [0.1, -0.02, 0], '+cp': 0.1 });
      keys = [T.K(Math.max(2, m.st - 4), reach), T.K(m.st, g, 'in'), T.K(m.st + m.act + 6, reach), T.K(m.total, S)];
      if (m.low) {
        const dv = THROW_POSES.dive(S);
        keys = [T.K(m.st, dv, 'in'), T.K(m.st + m.act + 8, mod(dv, { '+p': [0.1, -0.3, 0] })), T.K(m.total - 6, this.C), T.K(m.total, S)];
      }
      this.cache.set('grab:' + m.id, keys);
      return keys;
    }

    standPose(t, walk) {
      const st = this.style;
      const P = clonePose(this.S);
      const b = Math.sin(t * (st.rate || 0.08) * 2) * (st.bob || 0.01);
      P.p = [P.p[0], P.p[1] + b - (st.bounce ? Math.abs(Math.sin(t * (st.rate || 0.1))) * 0.02 : 0), P.p[2]];
      P.cp += b * 1.5;
      if (st.sway) { P.cr += Math.sin(t * 0.04) * st.sway; P.p[2] += Math.sin(t * 0.04) * st.sway * 0.3; P.hy += Math.sin(t * 0.03) * st.sway; }
      if (st.ginga) {
        const g = Math.sin(t * 0.07);
        const lead = g > 0;
        const k = Math.abs(g);
        P.py = lerp(0.3, lead ? 0.55 : -0.2, k);
        P.lf = lead ? [lerp(0.2, 0.28, k), 0.075, -0.22] : [lerp(0.2, -0.1, k), 0.075, -0.25];
        P.rf = lead ? [lerp(-0.25, 0.0, k), 0.075, 0.28] : [lerp(-0.25, -0.35, k), 0.075, 0.2];
        P.lh = lead ? [0.1, 0.5, -0.25] : [0.35, 0.2, -0.2];
        P.rh = lead ? [0.35, 0.2, 0.25] : [0.1, 0.5, 0.25];
        P.p = [P.p[0] + g * 0.04, P.p[1] - k * 0.05, P.p[2]];
      }
      if (walk) {
        P.p = [P.p[0], P.p[1] - 0.015 + Math.abs(Math.sin(t * 0.25)) * 0.015, P.p[2]];
        P.cp += walk * 0.04;
      }
      return P;
    }

    target() {
      const f = this.f;
      const s = f.state, t = f.t;
      const S = this.S, C = this.C;
      const clock = this.clock;
      switch (s) {
        case 'idle': case 'recover': case 'tbreak':
          if (f.bt) return mod(this.standPose(clock), { by: Math.PI });
          return this.standPose(clock);
        case 'walk': return this.standPose(clock, f.walkDir);
        case 'rise': return lerpPose(C, this.standPose(clock), EASE.io(clamp(t / 10, 0, 1)));
        case 'land': return lerpPose(mod(S, { '+p': [0, -0.2, 0], '+cp': 0.1 }), S, clamp(t / Math.max(1, f.dur), 0, 1));
        case 'crouch': {
          const d = f.dir;
          return d === 1 || d === 2 ? this.GL : C;
        }
        case 'prejump': return mod(S, { '+p': [0, -0.16 * Math.min(1, t / 3), 0], '+cp': 0.12 });
        case 'jump': {
          const up = f.vy > 0;
          const P = mod(S, { '+p': [0, 0.08, 0], cp: 0.1, py: 0.2 });
          P.lf = [0.15, up ? 0.42 : 0.22, -0.13]; P.rf = [-0.05, up ? 0.32 : 0.18, 0.14];
          P.lk = [1, 0.5, -0.1]; P.rk = [1, 0.5, 0.1];
          if (f.jumpDir < 0) P.bp = -Math.sin(Math.min(1, t / 36) * Math.PI) * Math.PI * 2 * (f.def.backflip ? 1 : 0);
          return P;
        }
        case 'dash': {
          const k = Math.sin(clamp(t / 16, 0, 1) * Math.PI);
          const P = mod(S, { '+p': [0.05 * k, -0.05 * k, 0], '+cp': 0.2 * k });
          P.lf = [S.lf[0] + 0.12 * k, S.lf[1] + 0.08 * Math.sin(clamp(t / 8, 0, 1) * Math.PI), S.lf[2]];
          return P;
        }
        case 'bdash': {
          const k = Math.sin(clamp(t / 20, 0, 1) * Math.PI);
          const P = mod(S, { '+p': [-0.06 * k, 0.03 * k, 0], '+cp': -0.12 * k });
          P.rf = [S.rf[0] - 0.12 * k, S.rf[1] + 0.1 * Math.sin(clamp(t / 10, 0, 1) * Math.PI), S.rf[2]];
          return P;
        }
        case 'run': {
          const ph = clock * 0.42;
          const sw = Math.sin(ph), cw = Math.cos(ph);
          const P = fillPose({
            p: [0.02, 0.9 + Math.abs(cw) * 0.04, 0], py: sw * 0.2, cy: -sw * 0.35, cp: 0.38, hp: -0.25,
            lh: [0.15 - sw * 0.3, 0.2, -0.24], rh: [0.15 + sw * 0.3, 0.2, 0.24], le: [-1, -0.3, -0.3], re: [-1, -0.3, 0.3],
            lf: [0.35 * sw + 0.05, 0.1 + Math.max(0, cw) * 0.25, -0.1], rf: [-0.35 * sw + 0.05, 0.1 + Math.max(0, -cw) * 0.25, 0.1]
          });
          return P;
        }
        case 'ss': {
          const k = Math.sin(clamp(t / Math.max(1, f.dur), 0, 1) * Math.PI);
          const lat = f.ssLateral ? f.ssLateral() : 1;
          const P = mod(S, { '+p': [0, -0.06 * k, lat * 0.05 * k], '+cr': -lat * 0.12 * k });
          const lead = lat > 0 ? 'rf' : 'lf';
          P[lead] = [P[lead][0], P[lead][1] + 0.08 * Math.sin(clamp(t / 8, 0, 1) * Math.PI), P[lead][2] + lat * 0.12 * k];
          return P;
        }
        case 'stance': {
          const st = f.sd.stances && f.sd.stances[f.stance];
          if (st && st.pose) {
            const key = 'stance:' + f.stance;
            let P = this.cache.get(key);
            if (!P) { P = mod(st.low ? C : S, st.pose); this.cache.set(key, P); }
            const b = Math.sin(clock * 0.12) * 0.012;
            return mod(P, { '+p': [0, b, 0] });
          }
          return S;
        }
        case 'block': return f.blockLow ? this.GL : this.G;
        case 'hit': return this.hitPose();
        case 'move': return null;
        case 'air': case 'ko': return this.airOrLie();
        case 'crumple': {
          const k = clamp(t / Math.max(1, f.dur), 0, 1);
          if (k < 0.55) {
            const kk = k / 0.55;
            const P = mod(C, { '+p': [0.05 * kk, -0.25 * kk, 0], cp: 0.3 + 0.5 * kk, hp: 0.4, lh: [0.1, -0.1, -0.3], rh: [0.1, -0.1, 0.3], lo: 1, ro: 1 });
            return P;
          }
          const kk = (k - 0.55) / 0.45;
          return lerpPose(mod(C, { '+p': [0.05, -0.25, 0], cp: 0.8, hp: 0.4, lo: 1, ro: 1 }), lieOf('down'), EASE.in(kk));
        }
        case 'down': return this.lieBreath(lieOf(f.face));
        case 'getup': {
          const k = clamp(t / Math.max(1, f.dur), 0, 1);
          const L = lieOf(f.face);
          const mid = mod(C, { '+p': [-0.05, -0.2, 0], cp: 0.5, lh: [0.3, -0.25, -0.3], rh: [0.3, -0.25, 0.3] });
          return k < 0.5 ? lerpPose(L, mid, EASE.io(k * 2)) : lerpPose(mid, S, EASE.io((k - 0.5) * 2));
        }
        case 'roll': {
          const k = clamp(t / Math.max(1, f.dur), 0, 1);
          const L = lieOf(f.face);
          if (f.rollKind === 'tech') {
            const P = mod(C, { '+p': [0, -0.2, 0], cp: 0.4, br: (f.rollDir || 1) * Math.PI * 2 * EASE.out(k) });
            return k < 0.2 ? lerpPose(L, P, k / 0.2) : lerpPose(P, S, EASE.io(clamp((k - 0.6) / 0.4, 0, 1)));
          }
          if (f.rollKind === 'side') return mod(L, { br: (f.face === 'down' ? -1 : 1) * (f.rollDir || 1) * Math.PI * 2 * EASE.io(k) });
          if (f.rollKind === 'back') {
            const P = mod(C, { '+p': [0, -0.35, 0], cp: 1.0 });
            return lerpPose(L, mod(P, { bp: -Math.PI * 2 * EASE.io(k) }), EASE.io(Math.min(1, k * 1.4)));
          }
          return lerpPose(L, mod(C, { bp: Math.PI * 2 * EASE.io(k) }), EASE.io(Math.min(1, k * 1.3)));
        }
        case 'throw': return this.throwPose();
        case 'thrown': {
          const tp = f.tpose;
          if (!tp) return VICTIM.held(S);
          const P = clonePose((VICTIM[tp.pose] || VICTIM.held)(S));
          P.bp = tp.bp; P.br = tp.br;
          if (tp.pose === 'limp' && Math.abs(Math.abs(wrapAngle(tp.bp)) - Math.PI / 2) < 0.3) return mod(lieOf(wrapAngle(tp.bp) < 0 ? 'up' : 'down'), { bp: tp.bp });
          return P;
        }
        case 'intro': return this.introPose(t);
        case 'win': return this.winPose(t);
        case 'lose': {
          const P = mod(S, { '+p': [0, 0.05, 0], cp: 0.3, hp: 0.5, py: 0.1, cy: 0, lh: [0.05, 0.02, -0.3], rh: [0.05, 0.02, 0.3], lo: 1, ro: 1 });
          P.lf = [0.08, 0.075, -0.12]; P.rf = [-0.04, 0.075, 0.12]; P.lfy = 0; P.rfy = 0;
          return lerpPose(S, P, clamp(t / 30, 0, 1));
        }
      }
      return S;
    }

    lieBreath(L) {
      const b = Math.sin(this.clock * 0.1) * 0.01;
      return mod(L, { '+p': [0, b, 0] });
    }

    hitPose() {
      const f = this.f, r = f.react || { lvl: 'm' };
      const dur = Math.max(1, f.dur);
      const t = f.t;
      const peak = Math.min(6, dur * 0.3);
      const k = t < peak ? EASE.out(t / peak) : 1 - EASE.io(clamp((t - peak) / (dur - peak), 0, 1));
      const kk = (r.heavy ? 1 : 0.65) * k;
      const S = this.S;
      if (r.double) return REACT.double(S, Math.max(0.6, 1 - t / dur * 0.5));
      if (r.stagger) return REACT.stagger(S, 1 - t / dur);
      if (r.crouch) return REACT.hitC(this.C, kk);
      if (r.spin) return mod(REACT.hitH(S, kk), { by: Math.PI * EASE.out(clamp(t / 10, 0, 1)) });
      if (r.lvl === 'h') return REACT.hitH(S, kk);
      if (r.lvl === 'l') return REACT.hitL(S, kk);
      return REACT.hitM(S, kk);
    }

    airOrLie() {
      const f = this.f;
      const y = f.pos[1];
      if (y <= 0.001 && (f.state === 'ko' && f.koLanded)) return this.koLie();
      const k = f.spinKind || 'launch';
      let bp;
      if (f.face === 'down') bp = clamp(0.3 + (f.vy < 0 ? (1 - clamp(y / 1.2, 0, 1)) * 1.3 : 0.2), 0, 1.57);
      else {
        const fall = f.vy < 0 ? 1 - clamp(y / 1.3, 0, 1) : 0;
        bp = k === 'trip' ? -0.6 - EASE.in(clamp(f.t / 18, 0, 1)) * 0.95 : -0.35 - (k === 'launch' ? 0.45 : 0.6) - fall * 0.6;
        if (k === 'launch' && f.vy > 0) bp = -0.2 - (1 - clamp(f.vy / 5, 0, 1)) * 0.7;
      }
      const P = airPose(this.S, bp, this.clock);
      if (y < 0.12 && f.vy <= 0) return lerpPose(P, lieOf(f.face), 0.6);
      return P;
    }

    koLie() { return lieOf(this.f.face); }

    throwPose() {
      const f = this.f, S = this.S;
      const Sx = f.m.throwS;
      if (!Sx || Sx.a !== f) return S;
      const keys = Sx.script.a;
      let k0 = [0, 'stance'], k1 = keys[0];
      for (let i = 0; i < keys.length; i++) {
        if (Sx.t <= keys[i][0]) { k1 = keys[i]; k0 = i > 0 ? keys[i - 1] : [0, this.moveFrom ? null : 'stance']; break; }
        k0 = keys[i]; k1 = keys[i];
      }
      const pa = k0[1] ? (THROW_POSES[k0[1]] || THROW_POSES.stance)(S) : (this.moveFrom || S);
      const pb = (THROW_POSES[k1[1]] || THROW_POSES.stance)(S);
      const span = k1[0] - k0[0];
      const t = span > 0 ? clamp((Sx.t - k0[0]) / span, 0, 1) : 1;
      return lerpPose(pa, pb, EASE.io(t));
    }

    introPose(t) {
      const S = this.S, W = this.W;
      const k = clamp(t / 90, 0, 1);
      const custom = this.f.sd.intro;
      if (custom === 'bow') return k < 0.5 ? lerpPose(W.upright, W.bow, EASE.io(k * 2)) : lerpPose(W.bow, S, EASE.io((k - 0.5) * 2));
      if (custom === 'flex') return k < 0.6 ? lerpPose(W.upright, W.flex, EASE.io(k / 0.6)) : lerpPose(W.flex, S, EASE.io((k - 0.6) / 0.4));
      return lerpPose(W.upright, S, EASE.io(k));
    }

    winPose(t) {
      const W = this.W, S = this.S;
      const k = clamp(t / 40, 0, 1);
      const kind = (this.f.sd.wins || ['fist', 'bow'])[this.f.winPose || 0] || 'fist';
      const P = W[kind] || W.fist;
      const b = Math.sin(this.clock * 0.1) * 0.01;
      return mod(lerpPose(S, P, EASE.io(k)), { '+p': [0, b, 0] });
    }

    signature() {
      const f = this.f;
      if (f.state === 'move') return 'move:' + f.move.id + ':' + (f.moveSerial || 0);
      if (f.state === 'hit') return 'hit:' + f.dur + ':' + (f.react && f.react.lvl);
      return f.state + (f.state === 'crouch' ? ':' + (f.dir === 1 || f.dir === 2) : '') + (f.state === 'stance' ? f.stance : '');
    }

    update() {
      const f = this.f;
      this.clock++;
      if (f.sd !== this.styleDef) this.initStyle(f.sd);
      const sig = this.signature();
      const newState = sig !== this.sig;
      if (newState) {
        const prev = this.sig;
        this.sig = sig;
        if (f.state === 'move') {
          this.moveFrom = clonePose(this.pose);
          this.from = null; this.blendN = 0;
        } else {
          this.from = clonePose(this.pose);
          this.blendT = 0;
          this.blendN = f.state === 'hit' || f.state === 'block' ? 2 : f.state === 'air' || f.state === 'ko' ? 4 : f.state === 'thrown' || f.state === 'throw' ? 5 : prev.startsWith('move') ? 5 : 6;
          if (f.state === 'roll' || f.state === 'getup') this.blendN = 3;
        }
      }
      let P;
      if (f.state === 'move') {
        const m = f.move;
        if (m.l === 't') P = evalTrack(this.grabTrack(m), f.mf, this.moveFrom);
        else P = evalTrack(this.track(m), f.mf, this.moveFrom);
        if (f.fromDown && f.mf < m.st) P = lerpPose(lieOf(f.face), P, EASE.io(clamp(f.mf / m.st, 0, 1)));
      } else {
        P = this.target();
        if (this.from && this.blendT < this.blendN) {
          this.blendT++;
          const from = this.from;
          for (const k of ['by', 'bp', 'br']) from[k] = P[k] + wrapAngle(from[k] - P[k]);
          P = lerpPose(from, P, EASE.io(this.blendT / this.blendN));
        }
      }
      this.pose = P;
      this.plantFeet(P);
      this.j = solve(this.pose, this.B);
      return this.pose;
    }

    plantFeet(P) {
      const f = this.f;
      const loco = f.state === 'idle' || f.state === 'walk' || f.state === 'crouch' || f.state === 'block' || f.state === 'hit' && !(f.react && (f.react.stagger || f.react.spin)) || f.state === 'recover' || f.state === 'tbreak' || f.state === 'rise';
      const s = this.B.size || 1;
      const c = Math.cos(f.yaw), sn = Math.sin(f.yaw);
      const toW = v => [f.pos[0] + (c * v[0] - sn * v[2]) * s, v[1] * s, f.pos[2] + (sn * v[0] + c * v[2]) * s];
      const toL = w => { const dx = (w[0] - f.pos[0]) / s, dz = (w[2] - f.pos[2]) / s; return [c * dx + sn * dz, w[1] / s, -sn * dx + c * dz]; };
      if (!loco || P.by || P.bp || P.br || f.pos[1] > 0.02) { this.feet = null; return; }
      const want = { l: toW(P.lf), r: toW(P.rf) };
      if (!this.feet) { this.feet = { l: { a: want.l, st: null }, r: { a: want.r, st: null } }; return; }
      const F = this.feet;
      for (const k of ['l', 'r']) {
        const ft = F[k], o = F[k === 'l' ? 'r' : 'l'];
        if (ft.st) {
          ft.st.t++;
          const u = clamp(ft.st.t / ft.st.n, 0, 1);
          const e = EASE.io(u);
          ft.a = [lerp(ft.st.from[0], want[k][0], e), want[k][1] + Math.sin(u * Math.PI) * 0.06 * s, lerp(ft.st.from[2], want[k][2], e)];
          if (u >= 1) { ft.st = null; ft.a = want[k].slice(); }
        } else {
          const d = Math.hypot(ft.a[0] - want[k][0], ft.a[2] - want[k][2]);
          if (d > 0.11 * s && (!o.st || d > 0.3 * s)) ft.st = { from: ft.a.slice(), t: 0, n: f.state === 'walk' ? 8 : 6 };
          else ft.a[1] = want[k][1];
        }
      }
      P.lf = toL(F.l.a); P.rf = toL(F.r.a);
    }

    world() {
      const f = this.f;
      return { pos: [f.pos[0], f.pos[1], f.pos[2]], yaw: f.yaw };
    }
  }

  Object.assign(T, { Animator, Chain, crouchOf, lieOf, guardHigh, guardLow, THROW_POSES, VICTIM, REACT, winPoses });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
