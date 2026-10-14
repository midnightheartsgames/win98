(function (O) {
  'use strict';
  const M4 = O.M4;
  const B = O.BONES, PARENT = O.BONE_PARENT;
  const N = 15;
  const PI = Math.PI;
  const clamp = O.clamp;
  const sm = t => { const x = t < 0 ? 0 : t > 1 ? 1 : t; return x * x * (3 - 2 * x); };
  const env = (t, a, h, r) => t < 0 ? 0 : t < a ? sm(t / a) : t < a + h ? 1 : t < a + h + r ? 1 - sm((t - a - h) / r) : 0;
  const kick = (t, a, r) => t < 0 ? 0 : t < a ? sm(t / a) : Math.exp(-(t - a) * r);
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

  const STYLE = {
    tracer: 'dual', soldier: 'rifle', mccree: 'pistol', junkrat: 'rifle', torbjorn: 'claw', widowmaker: 'rifle',
    reinhardt: 'hammer', roadhog: 'rifle', winston: 'rifle', lucio: 'pistol', mercy: 'staff', zenyatta: 'orbs', trainbot: 'pistol'
  };
  const FREE_LEFT = { pistol: 1, staff: 1, claw: 0.5, hammer: 0.7 };

  function base(style) {
    const r = Array.from({ length: N }, () => [0, 0, 0]);
    if (style === 'rifle') {
      r[B.UAR] = [-1.2, 0.32, 0]; r[B.LAR] = [-0.37, 0, 0];
      r[B.UAL] = [-1.15, -0.6, 0]; r[B.LAL] = [-0.8, 0, 0];
    } else if (style === 'pistol') {
      r[B.UAR] = [-1.25, 0.18, 0]; r[B.LAR] = [-0.32, 0, 0];
      r[B.UAL] = [0.05, 0, 0.12]; r[B.LAL] = [-0.35, 0, 0];
    } else if (style === 'dual') {
      r[B.UAR] = [-1.22, 0.1, 0]; r[B.LAR] = [-0.35, 0, 0];
      r[B.UAL] = [-1.22, -0.1, 0]; r[B.LAL] = [-0.35, 0, 0];
    } else if (style === 'hammer') {
      r[B.UAR] = [-0.55, 0.25, 0.15]; r[B.LAR] = [-1.0, 0, 0];
      r[B.UAL] = [-0.9, -0.2, 0]; r[B.LAL] = [-0.7, 0, 0];
    } else if (style === 'staff') {
      r[B.UAR] = [-0.95, 0.2, 0]; r[B.LAR] = [-0.62, 0, 0];
      r[B.UAL] = [-0.2, 0, 0.18]; r[B.LAL] = [-0.4, 0, 0];
    } else if (style === 'claw') {
      r[B.UAR] = [-1.2, 0.25, 0]; r[B.LAR] = [-0.37, 0, 0];
      r[B.UAL] = [-0.9, -0.1, 0.1]; r[B.LAL] = [-0.6, 0, 0];
    } else if (style === 'orbs') {
      r[B.UAR] = [-0.6, 0.3, 0.2]; r[B.LAR] = [-0.9, 0, 0];
      r[B.UAL] = [-0.6, -0.3, -0.2]; r[B.LAL] = [-0.9, 0, 0];
    }
    return r;
  }
  const BASE = {};
  for (const id in STYLE) BASE[id] = base(STYLE[id]);
  const IDLE = {
    dual: r => { r[B.UAR] = [-0.28, 0.1, -0.16]; r[B.LAR] = [-0.55, 0, 0]; r[B.UAL] = [-0.28, -0.1, 0.16]; r[B.LAL] = [-0.55, 0, 0]; },
    rifle: r => { r[B.UAR] = [-0.35, 0.2, -0.05]; r[B.LAR] = [-0.9, 0, 0]; r[B.UAL] = [-0.7, -0.5, 0]; r[B.LAL] = [-0.9, 0, 0]; },
    pistol: r => { r[B.UAR] = [-0.15, 0.1, -0.08]; r[B.LAR] = [-0.45, 0, 0]; r[B.UAL] = [0.05, 0, 0.1]; r[B.LAL] = [-0.3, 0, 0]; },
    claw: r => { r[B.UAR] = [-0.4, 0.2, -0.05]; r[B.LAR] = [-0.8, 0, 0]; r[B.UAL] = [-0.15, 0, 0.12]; r[B.LAL] = [-0.35, 0, 0]; },
    hammer: r => { r[B.UAR] = [-0.2, 0.15, -0.1]; r[B.LAR] = [-0.75, 0, 0]; r[B.UAL] = [-0.1, 0, 0.16]; r[B.LAL] = [-0.4, 0, 0]; },
    staff: r => { r[B.UAR] = [-0.3, 0.15, -0.06]; r[B.LAR] = [-0.8, 0, 0]; r[B.UAL] = [0, 0, 0.14]; r[B.LAL] = [-0.3, 0, 0]; },
    orbs: r => { r[B.UAR] = [-0.5, 0.35, 0.15]; r[B.LAR] = [-1.1, 0, 0]; r[B.UAL] = [-0.5, -0.35, -0.15]; r[B.LAL] = [-1.1, 0, 0]; }
  };

  const GAIT = {
    def: { rate: 1, amp: 0.62, knee: 1.15, bob: 0.045, lean: 0.16, roll: 0.03, arm: 0.7, width: 0.02, cross: 0, limp: 0 },
    tracer: { amp: 0.74, knee: 1.4, bob: 0.055, lean: 0.27, arm: 0.6 },
    soldier: { amp: 0.64, knee: 1.15, lean: 0.17 },
    mccree: { amp: 0.6, knee: 1.05, roll: 0.05, lean: 0.12, width: 0.04 },
    junkrat: { amp: 0.68, knee: 1.25, bob: 0.065, lean: 0.2, limp: 1, roll: 0.06 },
    torbjorn: { amp: 0.5, knee: 0.95, bob: 0.06, lean: 0.1, roll: 0.08, width: 0.05 },
    widowmaker: { amp: 0.6, knee: 1.05, bob: 0.03, lean: 0.12, cross: 0.07, width: 0 },
    reinhardt: { amp: 0.5, knee: 0.9, bob: 0.07, lean: 0.12, roll: 0.06, width: 0.08 },
    roadhog: { amp: 0.46, knee: 0.85, bob: 0.07, lean: 0.08, roll: 0.13, width: 0.12 },
    winston: { amp: 0.58, knee: 1.0, bob: 0.07, lean: 0.14, roll: 0.07, width: 0.06, arm: 1.1 },
    mercy: { amp: 0.56, knee: 1.0, bob: 0.035, lean: 0.12, cross: 0.05, width: 0 },
    lucio: {}, zenyatta: {}, trainbot: { amp: 0.5, knee: 0.8 }
  };
  for (const id in GAIT) if (id !== 'def') GAIT[id] = Object.assign({}, GAIT.def, GAIT[id]);
  const STRIDE = { torbjorn: 1.3, reinhardt: 0.84, roadhog: 0.86, winston: 0.94, widowmaker: 0.96, tracer: 1.06 };
  const RECOIL = { widowmaker: 0.32, mccree: 0.4, roadhog: 0.45, junkrat: 0.34, torbjorn: 0.26, soldier: 0.14, tracer: 0.12, lucio: 0.2, mercy: 0.16, zenyatta: 0.18, winston: 0.05, trainbot: 0.15 };
  const HIPMAX = 0.5;

  function hipTarget(lf, ll) {
    if (Math.hypot(lf, ll) < 0.4) return 0;
    const phi = Math.atan2(ll, lf);
    const rel = Math.abs(phi) > 1.95 ? O.wrapAng(phi - PI) : phi;
    return clamp(rel, -HIPMAX, HIPMAX);
  }

  function reloadTime(heroId) {
    const d = O.HEROES && O.HEROES[heroId];
    if (!d) return 1.5;
    const w = d.w || d.blaster || d.orb || d.tesla || {};
    return w.reload || d.reload || 1.5;
  }

  function add(r, i, x, y, z) { r[i][0] += x; r[i][1] += y; r[i][2] += z; }
  function set(r, i, v, k) { r[i] = k === undefined || k >= 1 ? v.slice() : mix(r[i], v, k); }

  function legs(heroId, r, S, st, v, airW, crouchW, sprintW) {
    const g = GAIT[heroId] || GAIT.def;
    const ro = st.rootOff, rr = st.rootRot;
    const ph = st.phase || 0;
    const wk = clamp(v / 2.2, 0, 1) * (1 - airW);
    const lf = st.lf !== undefined ? st.lf : v, ll = st.ll || 0;
    let fwd = 1, side = 0, hip = 0;
    if (Math.hypot(lf, ll) > 0.3) {
      const phi = Math.atan2(ll, lf);
      hip = st.hipYaw !== undefined ? st.hipYaw : hipTarget(lf, ll);
      fwd = Math.cos(phi - hip); side = Math.sin(phi - hip);
    }
    const amp = g.amp * clamp(v / 5.5, 0.45, 1.2) * (1 - crouchW * 0.35) * (1 + sprintW * 0.22);
    const sL = Math.sin(ph), cL = Math.cos(ph - 0.25);
    const fx = amp * fwd * wk, sx = amp * Math.abs(side) * 0.7 * wk;
    const u = (1 + (side >= 0 ? 1 : -1) * sL) / 2;
    const kn = g.knee * amp * wk;
    const limpR = g.limp ? 0.35 : 1;
    const spread = g.width + 0.02;
    r[B.ULL] = [-sL * fx, 0, spread + sx * u - g.cross * wk];
    r[B.ULR] = [sL * fx, 0, -spread - sx * u + g.cross * wk];
    r[B.LLL] = [kn * Math.max(0, cL) + 0.1 * wk, 0, 0];
    r[B.LLR] = [(kn * Math.max(0, -cL) + 0.1 * wk) * limpR, 0, 0];
    rr[1] += hip;
    r[B.SPINE][1] -= hip;
    const runK = clamp((v - 2.5) / 2.5, 0, 1);
    const bob = g.bob * wk * ((1 - runK) * (Math.abs(Math.cos(ph)) - 0.5) + runK * (Math.abs(sL) - 0.5));
    ro[1] += bob * S.s - (g.limp ? 0.035 * S.s * wk * Math.max(0, -sL) : 0);
    rr[2] += sL * g.roll * wk * 0.5;
    r[B.SPINE][2] += sL * g.roll * wk - side * 0.07 * wk;
    const lean = g.lean * clamp(v / 5.5, 0, 1.2) * (fwd >= 0 ? fwd : fwd * 0.45) * (1 - airW);
    r[B.SPINE][0] += lean + sprintW * 0.2;
    r[B.HEAD][0] -= lean * 0.55 + sprintW * 0.15;
    r[B.SPINE][1] += sL * 0.09 * wk * fwd;
    const style = STYLE[heroId];
    const free = FREE_LEFT[style] || 0;
    if (free) add(r, B.UAL, sL * g.arm * amp * fwd * wk * free, 0, 0);
    add(r, B.UAR, Math.cos(2 * ph) * 0.035 * wk, 0, 0);
    if (style === 'rifle' || style === 'dual') add(r, B.UAL, Math.cos(2 * ph) * 0.035 * wk, 0, 0);
    if (sprintW > 0) {
      set(r, B.UAR, [-0.55, 0.55, -0.05], sprintW); set(r, B.LAR, [-1.35, 0, 0], sprintW);
      set(r, B.UAL, [sL * 1.05 * fwd - 0.15, 0, 0.12], sprintW); set(r, B.LAL, [-1.25, 0, 0], sprintW);
    }
    if (airW > 0) {
      const k = clamp(0.5 + (st.vy || 0) / 8, 0, 1);
      set(r, B.ULL, [-0.3 - 0.7 * k, 0, 0.08], airW); set(r, B.LLL, [0.55 + 0.8 * k, 0, 0], airW);
      set(r, B.ULR, [-0.08 - 0.12 * k, 0, -0.08], airW); set(r, B.LLR, [0.35 + 0.35 * k, 0, 0], airW);
      r[B.SPINE][0] += 0.08 * airW * k - 0.04 * airW * (1 - k);
      if (free) add(r, B.UAL, -0.35 * airW * (1 - k) * free, 0, 0.3 * airW * free);
    }
    const lt = st.landT === undefined ? 9 : st.landT;
    if (lt < 0.42) {
      const q = clamp((st.landV || 0) / 11, 0.15, 1) * (1 - lt / 0.42) * (1 - lt / 0.42);
      ro[1] -= q * 0.2 * S.s;
      r[B.ULL][0] -= 0.75 * q; r[B.ULR][0] -= 0.75 * q;
      r[B.LLL][0] += 1.3 * q; r[B.LLR][0] += 1.3 * q;
      r[B.SPINE][0] += 0.22 * q;
      if (free) add(r, B.UAL, 0, 0, 0.25 * q * free);
    }
    if (crouchW > 0) {
      ro[1] -= 0.3 * S.s * crouchW;
      r[B.ULL][0] -= 0.95 * crouchW; r[B.ULR][0] -= 0.95 * crouchW;
      r[B.LLL][0] += 1.45 * crouchW; r[B.LLR][0] += 1.45 * crouchW;
      r[B.SPINE][0] += 0.12 * crouchW;
    }
    const still = 1 - clamp(v / 1.2, 0, 1);
    const tw = st.turn ? clamp((Math.abs(st.turn) - 0.9) / 2, 0, 1) * still * (1 - airW) : 0;
    if (tw > 0) {
      const tp = st.tphase || 0, a = 0.2 * tw;
      r[B.ULL][0] -= Math.sin(tp) * a; r[B.ULR][0] += Math.sin(tp) * a;
      r[B.LLL][0] += Math.max(0, Math.cos(tp)) * a * 1.8; r[B.LLR][0] += Math.max(0, -Math.cos(tp)) * a * 1.8;
    }
    return still;
  }

  function skate(r, S, st, v, airW, crouchW) {
    const ro = st.rootOff, rr = st.rootRot;
    const ph = st.phase || 0;
    const wk = clamp(v / 2, 0, 1) * (1 - airW);
    const lf = st.lf !== undefined ? st.lf : v, ll = st.ll || 0;
    const hip = st.hipYaw !== undefined ? st.hipYaw : hipTarget(lf, ll);
    const k = Math.sin(ph * 0.55);
    const pushL = Math.max(0, k), pushR = Math.max(0, -k);
    r[B.ULL] = [-0.42 + pushL * 0.35, 0, 0.14 + pushL * 0.42]; r[B.LLL] = [0.7 - pushL * 0.35, 0, 0];
    r[B.ULR] = [-0.42 + pushR * 0.35, 0, -0.14 - pushR * 0.42]; r[B.LLR] = [0.7 - pushR * 0.35, 0, 0];
    const idle = 1 - wk;
    r[B.ULL] = mix(r[B.ULL], [-0.2, 0, 0.1], idle); r[B.LLL] = mix(r[B.LLL], [0.35, 0, 0], idle);
    r[B.ULR] = mix(r[B.ULR], [-0.2, 0, -0.1], idle); r[B.LLR] = mix(r[B.LLR], [0.35, 0, 0], idle);
    ro[1] -= (0.08 + 0.08 * wk) * S.s;
    rr[1] += hip;
    r[B.SPINE][1] -= hip - k * 0.14 * wk;
    r[B.SPINE][0] += 0.12 + 0.2 * wk;
    r[B.HEAD][0] -= 0.12 * wk;
    r[B.SPINE][2] -= clamp(ll * 0.03, -0.15, 0.15);
    add(r, B.UAL, -k * 0.5 * wk, 0, 0.1 * wk);
    rr[2] += (pushL - pushR) * 0.06 * wk;
    if (airW > 0) {
      set(r, B.ULL, [-0.75, 0, 0.12], airW); set(r, B.LLL, [1.1, 0, 0], airW);
      set(r, B.ULR, [-0.45, 0, -0.12], airW); set(r, B.LLR, [0.9, 0, 0], airW);
    }
    if (st.wallride) {
      r[B.ULL] = [-0.7, 0, 0.3]; r[B.LLL] = [0.8, 0, 0]; r[B.ULR] = [-0.3, 0, -0.25]; r[B.LLR] = [0.5, 0, 0];
      rr[2] += 0.32 * (st.wallSide || 1);
      add(r, B.UAL, -0.3, 0, 0.6 * (st.wallSide || 1));
    }
    const lt = st.landT === undefined ? 9 : st.landT;
    if (lt < 0.35) { const q = clamp((st.landV || 0) / 11, 0.15, 1) * (1 - lt / 0.35) ** 2; ro[1] -= q * 0.16 * S.s; r[B.LLL][0] += q; r[B.LLR][0] += q; }
    if (crouchW > 0) { ro[1] -= 0.25 * S.s * crouchW; r[B.ULL][0] -= 0.8 * crouchW; r[B.ULR][0] -= 0.8 * crouchW; r[B.LLL][0] += 1.2 * crouchW; r[B.LLR][0] += 1.2 * crouchW; }
    return 1 - wk;
  }

  function float(r, S, st, v) {
    const ro = st.rootOff, rr = st.rootRot, t = st.t;
    ro[1] = -0.12 * S.hip + Math.sin(t * 2) * 0.05;
    r[B.ULL] = [-1.5, 0.75, 0]; r[B.LLL] = [0, 0, -2.45];
    r[B.ULR] = [-1.5, -0.75, 0]; r[B.LLR] = [0, 0, 2.45];
    const lf = st.lf !== undefined ? st.lf : v, ll = st.ll || 0;
    rr[0] += clamp(lf * 0.035, -0.18, 0.2);
    rr[2] -= clamp(ll * 0.035, -0.18, 0.18);
    r[B.HEAD][0] -= clamp(lf * 0.03, -0.1, 0.15);
    r[B.BACK] = [Math.sin(t * 1.1) * 0.06, Math.sin(t * 0.45) * 0.35, Math.sin(t * 0.8) * 0.04];
    return 1 - clamp(v / 1.2, 0, 1);
  }

  function reload(heroId, r, st, at) {
    const dur = reloadTime(heroId);
    if (at > dur + 0.1) return;
    const k = env(at, 0.2, dur - 0.45, 0.25);
    const p = clamp(at / dur, 0, 1);
    if (heroId === 'tracer') {
      const spin = env(at, 0.05, 0.25, 0.3);
      add(r, B.UAR, 0.55 * spin, 0, -0.2 * spin); add(r, B.UAL, 0.55 * spin, 0, 0.2 * spin);
      add(r, B.LAR, -0.6 * spin, 0, 0); add(r, B.LAL, -0.6 * spin, 0, 0);
      const a = sm(clamp((at - 0.1) / 0.55, 0, 1)) * PI * 2;
      r[B.GUN] = [a, 0, 0]; r[B.OFF] = [a, 0, 0];
    } else if (heroId === 'mccree') {
      add(r, B.UAR, 0.35 * k, -0.1 * k, 0); add(r, B.LAR, -0.5 * k, 0, 0);
      r[B.GUN][2] -= 0.9 * k;
      const load = env(at, 0.3, dur - 0.75, 0.3);
      set(r, B.UAL, [-1.0, -0.55, 0.05], load); set(r, B.LAL, [-1.0 - Math.sin(p * PI * 6) * 0.15 * load, 0, 0], load);
      if (at > dur - 0.35 && at < dur) r[B.GUN][2] += 0.9 * env(at - (dur - 0.35), 0.08, 0.1, 0.17);
    } else if (heroId === 'roadhog') {
      add(r, B.UAR, 0.45 * k, 0.15 * k, 0);
      const shove = env(at, 0.3, 0.2, 0.25) + env(at - 0.75, 0.2, 0.1, 0.25);
      set(r, B.UAL, [-1.35, -0.55, 0], k); set(r, B.LAL, [-1.2 + shove * 0.6, 0, 0], k);
      r[B.SPINE][0] += 0.08 * shove;
    } else if (heroId === 'zenyatta') {
      const w = Math.sin(p * PI * 2);
      set(r, B.UAR, [-0.9 + w * 0.25, 0.45, 0.2], k); set(r, B.UAL, [-0.9 - w * 0.25, -0.45, -0.2], k);
      set(r, B.LAR, [-1.3, 0, 0], k); set(r, B.LAL, [-1.3, 0, 0], k);
      r[B.HEAD][0] += 0.15 * k;
    } else if (heroId === 'torbjorn') {
      add(r, B.UAR, 0.3 * k, 0.2 * k, 0);
      const slam = env(at, 0.35, 0.05, 0.25) * 0.7 + env(at - 0.9, 0.3, 0.05, 0.25) * 0.7;
      set(r, B.UAL, [-1.5 + slam * 0.5, -0.5, 0.1], k); set(r, B.LAL, [-0.9 - slam * 0.4, 0, 0], k);
    } else if (heroId === 'winston') {
      add(r, B.UAR, 0.3 * k, 0, -0.2 * k);
      const slap = env(at, 0.3, 0.05, 0.2) + env(at - 0.65, 0.15, 0.05, 0.2);
      add(r, B.UAL, 0.3 * slap, -0.2 * slap, 0);
      r[B.GUN][2] -= 0.4 * k;
    } else {
      add(r, B.UAR, 0.45 * k, 0, 0); add(r, B.LAR, 0, 0, 0.5 * k);
      r[B.GUN][2] -= 0.55 * k;
      const mag = env(at, 0.25, dur * 0.35, 0.25) - env(at - dur * 0.45, 0.2, 0.15, 0.2) * 0.6;
      add(r, B.UAL, 0.35 * k + 0.25 * mag, 0.25 * k, 0); add(r, B.LAL, 0.3 * mag, 0, 0);
      r[B.HEAD][0] += 0.12 * k;
    }
  }

  function melee(heroId, r, st, at) {
    if (at >= 0.55) return;
    const k = env(at, 0.1, 0.06, 0.32), wind = env(at, 0.06, 0, 0.08);
    const style = STYLE[heroId];
    if (heroId === 'zenyatta') {
      r[B.ULR] = [-1.7 * k, 0, -0.1]; r[B.LLR] = [0.45 * (1 - k) + 1.2 * wind, 0, 0];
      st.rootRot[0] -= 0.35 * k;
      add(r, B.UAL, 0, 0, 0.5 * k); add(r, B.UAR, 0, 0, -0.5 * k);
    } else if (heroId === 'reinhardt') {
      r[B.UAR] = [-1.3 + 0.4 * k, 0.9 - 1.9 * k, 0.2]; r[B.LAR] = [-0.7, 0, 0];
      r[B.SPINE][1] += 0.5 - k;
    } else if (heroId === 'mercy') {
      r[B.UAR] = [-1.0 - 0.9 * k, 0.6 - 1.1 * k, 0]; r[B.LAR] = [-0.5 + 0.3 * k, 0, 0];
      r[B.SPINE][1] += 0.3 - 0.7 * k;
    } else if (style === 'rifle' && heroId !== 'roadhog' && heroId !== 'winston') {
      add(r, B.UAR, -0.25 * k + 0.25 * wind, 0.5 * k, 0); add(r, B.UAL, -0.3 * k, 0.45 * k, 0);
      r[B.SPINE][1] += 0.4 * wind - 0.55 * k; r[B.SPINE][0] += 0.12 * k;
    } else {
      r[B.UAL] = [-1.55 * k - 0.2 + 0.4 * wind, -0.4 * k, 0.25 - 0.1 * k]; r[B.LAL] = [-0.25 - 0.9 * (1 - k), 0, 0];
      r[B.SPINE][1] -= 0.4 * k - 0.2 * wind; r[B.SPINE][0] += 0.1 * k;
    }
  }

  function throwAnim(heroId, r, st, at) {
    const item = st.item;
    if (item === 'field') {
      if (at >= 0.65) return;
      const k = env(at, 0.2, 0.15, 0.3);
      r[B.SPINE][0] += 0.55 * k; st.rootOff[1] -= 0.18 * k * st.s;
      r[B.ULL][0] -= 0.4 * k; r[B.LLL][0] += 0.7 * k; r[B.ULR][0] -= 0.4 * k; r[B.LLR][0] += 0.7 * k;
      set(r, B.UAL, [-0.7, -0.2, 0.1], k); set(r, B.LAL, [-0.3, 0, 0], k);
      return;
    }
    if (item === 'flash' || item === 'pack' || item === 'bubble') {
      if (at >= 0.5) return;
      const p = clamp(at / 0.32, 0, 1), k = env(at, 0.08, 0.2, 0.2);
      set(r, B.UAL, [0.5 - 1.9 * sm(p), -0.2, 0.15], k); set(r, B.LAL, [-0.3 - 0.3 * Math.sin(p * PI), 0, 0], k);
      r[B.SPINE][1] -= 0.3 * k * (sm(p) - 0.5);
      return;
    }
    if (item === 'turret') {
      if (at >= 0.7) return;
      const p = clamp(at / 0.45, 0, 1), k = env(at, 0.12, 0.25, 0.3);
      set(r, B.UAL, [0.3 - 2.0 * sm(p), -0.3, 0.1], k); set(r, B.LAL, [-0.8 + 0.5 * p, 0, 0], k);
      set(r, B.UAR, [0.2 - 1.6 * sm(p), 0.3, -0.1], k * 0.6);
      r[B.SPINE][0] += (0.3 - 0.5 * sm(p)) * k;
      return;
    }
    if (at >= 0.5) return;
    const p = clamp(at / 0.34, 0, 1), k = env(at, 0.1, 0.18, 0.22);
    set(r, B.UAL, [-2.7 + 2.3 * sm(p), -0.25, 0.1], k); set(r, B.LAL, [-0.9 + 0.75 * p, 0, 0], k);
    r[B.SPINE][1] += (0.35 - 0.7 * sm(p)) * k; r[B.SPINE][0] += 0.12 * sm(p) * k;
  }

  function actions(heroId, r, S, st) {
    const t = st.t, act = st.act, at = t - (st.actT === undefined ? -9 : st.actT);
    const ro = st.rootOff, rr = st.rootRot;
    const style = STYLE[heroId];
    if (act === 'melee') melee(heroId, r, st, at);
    else if (act === 'throw') throwAnim(heroId, r, st, at);
    else if (act === 'reload') reload(heroId, r, st, at);
    else if (act === 'roll' && at < 0.5) {
      const p = clamp(at / 0.45, 0, 1);
      const yaw = Math.hypot(st.lf || 0, st.ll || 0) > 1 ? Math.atan2(st.ll || 0, st.lf || 0) : 0;
      rr[1] += yaw * env(at, 0.05, 0.3, 0.1);
      rr[0] = sm(p) * PI * 2;
      ro[1] -= 0.55 * S.s * Math.sin(p * PI);
      const tuck = Math.sin(p * PI);
      r[B.ULL] = [-1.6 * tuck, 0, 0.1]; r[B.LLL] = [2.0 * tuck, 0, 0]; r[B.ULR] = [-1.6 * tuck, 0, -0.1]; r[B.LLR] = [2.0 * tuck, 0, 0];
      r[B.SPINE][0] += 0.6 * tuck; add(r, B.UAL, -0.8 * tuck, 0, 0);
    } else if (act === 'deadeye') {
      r[B.UAR] = [-1.2, 0.4, 0]; r[B.LAR] = [-0.45, 0, 0];
      r[B.UAL] = [-1.2, -0.5, 0.05]; r[B.LAL] = [-0.95 + Math.sin(t * 5) * 0.05, 0, 0];
      r[B.SPINE][0] += 0.12; ro[1] -= 0.06 * S.s;
      r[B.ULL][0] -= 0.25; r[B.LLL][0] += 0.4; r[B.ULR][0] += 0.15; r[B.LLR][0] += 0.25;
    } else if (act === 'blink' && at < 0.25) {
      const k = env(at, 0.03, 0.05, 0.17);
      r[B.SPINE][0] += 0.35 * k; add(r, B.UAR, 0.5 * k, 0, 0); add(r, B.UAL, 0.5 * k, 0, 0);
      r[B.ULR][0] += 0.5 * k; r[B.LLR][0] += 0.6 * k;
    } else if (act === 'swing' && at < 0.7) {
      const side = st.side || 1;
      const p = clamp((at - 0.05) / 0.3, 0, 1), k = env(at, 0.05, 0.4, 0.25);
      const a = side * (1.3 - 2.6 * sm(p));
      set(r, B.UAR, [-1.35 + 0.4 * Math.sin(p * PI), 0.25 + a, 0.2], k); set(r, B.LAR, [-0.6, 0, 0], k);
      set(r, B.UAL, [-1.0, -0.35 + a * 0.5, -0.1], k * 0.8); set(r, B.LAL, [-0.8, 0, 0], k * 0.8);
      r[B.SPINE][1] += side * (0.55 - 1.1 * sm(p)) * k;
      r[B.SPINE][0] += 0.1 * Math.sin(p * PI) * k;
      rr[1] += side * (0.12 - 0.24 * sm(p)) * k;
    } else if (act === 'charge' && at < 3) {
      const k = env(at, 0.2, 2.5, 0.3);
      r[B.SPINE][0] += 0.5 * k; r[B.HEAD][0] -= 0.35 * k;
      set(r, B.UAR, [0.35, 0.2, -0.3], k); set(r, B.LAR, [-0.7, 0, 0], k);
      set(r, B.UAL, [-1.35, -0.25, 0.25], k); set(r, B.LAL, [-0.35, 0, 0], k);
    } else if (act === 'shatter' && at < 1.2) {
      const up = env(at, 0.18, 0.1, 0.27), slam = env(at - 0.45, 0.08, 0.35, 0.3);
      const p = clamp((at - 0.3) / 0.25, 0, 1);
      set(r, B.UAR, [-2.9 + 2.3 * sm(p), 0.3, -0.1], 1); set(r, B.LAR, [-0.4 + 0.2 * p, 0, 0], 1);
      set(r, B.UAL, [-2.7 + 2.0 * sm(p), -0.2, 0.1], 1); set(r, B.LAL, [-0.5, 0, 0], 1);
      r[B.SPINE][0] += -0.2 * up + 0.75 * slam;
      ro[1] += 0.4 * S.s * up - 0.32 * S.s * slam;
      r[B.ULL][0] -= 0.9 * slam; r[B.LLL][0] += 1.3 * slam; r[B.ULR][0] -= 0.3 * slam; r[B.LLR][0] += 1.4 * slam;
    } else if (act === 'strike' && at < 0.65) {
      const p = clamp(at / 0.3, 0, 1), k = env(at, 0.05, 0.3, 0.3);
      set(r, B.UAR, [-2.7 + 1.9 * sm(p), 0.1 + 0.9 * sm(p), -0.3], k); set(r, B.LAR, [-0.4, 0, 0], k);
      r[B.SPINE][1] += (0.45 - 0.9 * sm(p)) * k; r[B.SPINE][0] += 0.3 * sm(p) * k;
    } else if (act === 'hook' && at < 0.7) {
      const p = clamp(at / 0.18, 0, 1), k = env(at, 0.06, 0.4, 0.24);
      set(r, B.UAL, [-0.6 - 1.0 * sm(p), -0.15, 0.05], k); set(r, B.LAL, [-0.9 * (1 - p), 0, 0], k);
      r[B.SPINE][1] -= 0.25 * k * sm(p);
    } else if (act === 'breather' && at < 1.3) {
      const k = env(at, 0.2, 0.85, 0.25);
      set(r, B.UAL, [-1.8, -0.65, 0], k); set(r, B.LAL, [-1.55, 0, 0], k);
      r[B.HEAD][0] -= 0.25 * k; r[B.SPINE][0] -= 0.08 * k;
    } else if (act === 'hog' && at < 6.2) {
      const k = env(at, 0.25, 5.6, 0.3), sh = Math.sin(t * 40) * 0.03;
      set(r, B.UAR, [-0.95 + sh, 0.35, -0.05], k); set(r, B.LAR, [-0.65, 0, 0], k);
      set(r, B.UAL, [-1.1, -0.45, 0], k); set(r, B.LAL, [-0.95, 0, 0], k);
      r[B.SPINE][0] -= 0.12 * k; ro[1] -= 0.05 * S.s * k;
    } else if (act === 'leap' && st.air) {
      r[B.SPINE][0] += 0.5; set(r, B.UAR, [-2.2, 0.2, -0.2]); set(r, B.UAL, [-2.2, -0.2, 0.2]);
      r[B.ULL] = [-1.1, 0, 0.15]; r[B.LLL] = [1.4, 0, 0]; r[B.ULR] = [-0.9, 0, -0.15]; r[B.LLR] = [1.3, 0, 0];
    } else if (act === 'punch' && at < 0.5) {
      const side = Math.round((st.actT || 0) * 30) % 2 ? 1 : -1;
      const k = env(at, 0.09, 0.05, 0.3);
      const A = side > 0 ? B.UAL : B.UAR, F = side > 0 ? B.LAL : B.LAR, O2 = side > 0 ? B.UAR : B.UAL;
      r[A] = [-1.65 * k - 0.4, -side * 0.45 * k, side * 0.2]; r[F] = [-0.2 - 0.8 * (1 - k), 0, 0];
      r[O2] = [-0.6, side * 0.4, -side * 0.3];
      r[B.SPINE][1] += -side * 0.45 * k; r[B.SPINE][0] += 0.2 * k;
    } else if (act === 'rage' && at < 1.6) {
      const k = env(at, 0.2, 1.0, 0.4), beat = Math.max(0, Math.sin(at * 14));
      set(r, B.UAR, [-0.9 - beat * 0.5, 0.9, -0.6], k); set(r, B.UAL, [-0.9 - (1 - beat) * 0.5, -0.9, 0.6], k);
      set(r, B.LAR, [-1.6, 0, 0], k); set(r, B.LAL, [-1.6, 0, 0], k);
      r[B.HEAD][0] -= 0.5 * k; r[B.SPINE][0] -= 0.25 * k;
    } else if (act === 'rez' && at < 1.6) {
      const k = env(at, 0.25, 1.0, 0.35);
      set(r, B.UAR, [-2.75, 0.1, -0.15], k); set(r, B.LAR, [-0.1, 0, 0], k);
      set(r, B.UAL, [-1.45, -0.3, 0.1], k); set(r, B.LAL, [-0.15, 0, 0], k);
      r[B.HEAD][0] -= 0.2 * k;
    } else if (act === 'ga' && at < 0.9) {
      const k = env(at, 0.1, 0.5, 0.3);
      rr[0] += 0.9 * k;
      set(r, B.UAR, [-2.6, 0.2, -0.1], k); set(r, B.UAL, [0.4, 0, 0.3], k);
      set(r, B.ULL, [0.15, 0, 0.03], k); set(r, B.ULR, [0.2, 0, -0.03], k); set(r, B.LLL, [0.3, 0, 0], k); set(r, B.LLR, [0.5, 0, 0], k);
    } else if (act === 'trans' && at < 6.5) {
      const k = env(at, 0.4, 5.5, 0.5);
      set(r, B.UAR, [-0.4, 0.2, -1.2], k); set(r, B.UAL, [-0.4, -0.2, 1.2], k); set(r, B.LAR, [-0.5, 0, 0], k); set(r, B.LAL, [-0.5, 0, 0], k);
      ro[1] += 0.45 * k + Math.sin(t * 3) * 0.05 * k;
      r[B.HEAD][0] -= 0.3 * k;
    } else if (act === 'cast' && at < 0.45) {
      const p = clamp(at / 0.2, 0, 1), k = env(at, 0.05, 0.15, 0.25);
      set(r, B.UAL, [-0.8 - 0.9 * sm(p), -0.2, 0], k); set(r, B.LAL, [-0.8 + 0.7 * p, 0, 0], k);
    } else if (act === 'soundbarrier' && at < 1.1) {
      const up = env(at, 0.25, 0.1, 0.3), slam = env(at - 0.55, 0.06, 0.25, 0.25);
      ro[1] += 1.1 * up * S.s - 0.2 * slam * S.s;
      set(r, B.UAR, [-2.9, 0, 0.15], up); set(r, B.UAL, [-2.9, 0, -0.15], up);
      set(r, B.UAL, [-1.0, -0.2, 0.2], slam); set(r, B.LAL, [-0.1, 0, 0], slam);
      r[B.SPINE][0] += 0.6 * slam - 0.15 * up;
      r[B.ULL][0] -= 1.0 * slam; r[B.LLL][0] += 1.5 * slam; r[B.ULR][0] -= 0.4 * slam; r[B.LLR][0] += 1.6 * slam;
    } else if (act === 'amp' && at < 0.9) {
      const k = env(at, 0.15, 0.45, 0.3);
      set(r, B.UAR, [-2.85, 0.1, -0.2], k); set(r, B.LAR, [-0.2, 0, 0], k);
      r[B.HEAD][0] -= 0.25 * k;
    } else if (act === 'wave' && at < 0.45) {
      const k = env(at, 0.05, 0.12, 0.28);
      add(r, B.UAR, -0.35 * k, 0, 0); add(r, B.LAR, 0.25 * k, 0, 0);
      r[B.SPINE][0] -= 0.1 * k; r[B.SPINE][1] += 0.15 * k;
    } else if (act === 'hammer' && at < 0.55) {
      const p = clamp(at / 0.22, 0, 1), k = env(at, 0.04, 0.25, 0.25);
      set(r, B.UAR, [-2.6 + 2.0 * sm(p), 0.3 + 0.2 * p, -0.3], k); set(r, B.LAR, [-0.5, 0, 0], k);
      r[B.SPINE][0] += 0.3 * sm(p) * k; r[B.SPINE][1] += (0.25 - 0.5 * sm(p)) * k;
    } else if (act === 'tire') {
      set(r, B.UAR, [-0.9, 0.5, 0], 1); set(r, B.LAR, [-0.9, 0, 0], 1);
      set(r, B.UAL, [-0.9, -0.5, 0], 1); set(r, B.LAL, [-0.9, 0, 0], 1);
      r[B.SPINE][0] += 0.3; ro[1] -= 0.12 * S.s;
    }
    if (style === 'hammer') {
      const w = st.shieldW !== undefined ? st.shieldW : (st.shield ? 1 : 0);
      if (w > 0) {
        set(r, B.UAL, [-1.45, -0.3, 0.05], w); set(r, B.LAL, [-0.25, 0, 0], w);
        set(r, B.UAR, [-0.25, 0.15, -0.25], w); set(r, B.LAR, [-0.9, 0, 0], w);
        r[B.SPINE][0] += 0.08 * w;
      }
    }
    if (heroId === 'widowmaker') {
      const w = st.scopeW !== undefined ? st.scopeW : (st.scope >= 0 ? 1 : 0);
      if (w > 0) {
        add(r, B.UAR, -0.12 * w, 0.08 * w, 0); add(r, B.UAL, -0.3 * w, 0.1 * w, 0); add(r, B.LAL, 0.35 * w, 0, 0);
        r[B.HEAD][2] -= 0.15 * w; r[B.HEAD][0] += 0.08 * w; r[B.SPINE][2] -= 0.05 * w;
      }
    }
    if (heroId === 'mercy' && st.beam) {
      set(r, B.UAR, [-1.45, 0.12, 0], 0.85); set(r, B.LAR, [-0.12, 0, 0], 0.85);
    }
    if (heroId === 'zenyatta' && st.volley) {
      const k = clamp(st.volley / 5, 0.3, 1), sh = Math.sin(t * 30) * 0.03 * k;
      set(r, B.UAR, [-1.05 + sh, 0.7, 0.1], 0.9); set(r, B.UAL, [-1.05 - sh, -0.7, -0.1], 0.9);
      set(r, B.LAR, [-0.9, 0, 0], 0.9); set(r, B.LAL, [-0.9, 0, 0], 0.9);
    }
  }

  function recoil(heroId, r, st) {
    const t = st.t;
    const style = STYLE[heroId];
    if (style === 'hammer') return;
    const s1 = t - (st.shot1T === undefined ? (st.shotT === undefined ? -9 : st.shotT) : st.shot1T);
    const s2 = t - (st.shot2T === undefined ? -9 : st.shot2T);
    const amt = RECOIL[heroId] || 0.15;
    if (heroId === 'zenyatta') {
      if (s1 >= 0 && s1 < 0.35 && !st.volley) {
        const side = Math.round(((st.shot1T === undefined ? st.shotT : st.shot1T) || 0) * 60) % 2 ? 1 : -1;
        const k = env(s1, 0.05, 0.03, 0.22);
        const A = side > 0 ? B.UAL : B.UAR;
        add(r, A, -0.75 * k, side * -0.25 * k, 0); add(r, side > 0 ? B.LAL : B.LAR, 0.6 * k, 0, 0);
      }
      return;
    }
    if (s1 >= 0 && s1 < 0.4) {
      const k = kick(s1, 0.025, 13) * amt;
      add(r, B.UAR, 1.4 * k, 0, 0); add(r, B.LAR, 0.6 * k, 0, 0);
      if (style === 'rifle' || style === 'dual') add(r, B.UAL, 1.0 * k, 0, 0);
      r[B.SPINE][0] -= 0.3 * k; r[B.HEAD][0] -= 0.15 * k;
    }
    if (s2 >= 0 && s2 < 0.6) {
      if (heroId === 'mccree') {
        const k = env(s2, 0.03, 0.04, 0.12);
        set(r, B.UAL, [-1.2, -0.75 + 0.35 * k, 0], 0.9); set(r, B.LAL, [-0.7 - 0.25 * k, 0, 0], 0.9);
        add(r, B.UAR, 0.4 * kick(s2, 0.02, 14), 0, 0);
      } else if (heroId === 'soldier') {
        const k = kick(s2, 0.03, 7);
        add(r, B.UAR, 0.8 * k, 0, 0); add(r, B.UAL, 0.7 * k, 0, 0); r[B.SPINE][0] -= 0.2 * k;
      } else {
        const k = kick(s2, 0.03, 10) * amt * 1.6;
        add(r, B.UAR, 1.2 * k, 0, 0); r[B.SPINE][0] -= 0.25 * k;
      }
    }
  }

  function hurt(r, st) {
    const ht = st.hurtT;
    if (ht === undefined || ht < 0 || ht > 0.3) return;
    const k = env(ht, 0.035, 0.02, 0.24) * (st.hurtK || 1);
    const side = st.hurtSide || 0;
    r[B.SPINE][0] -= 0.16 * k; r[B.HEAD][0] -= 0.24 * k;
    r[B.SPINE][1] += side * 0.22 * k; r[B.SPINE][2] += side * 0.08 * k;
    add(r, B.UAL, 0.15 * k, 0, 0.12 * k); add(r, B.UAR, 0.15 * k, 0, -0.12 * k);
  }

  function death(heroId, r, S, st) {
    const ro = st.rootOff, rr = st.rootRot;
    const dt = st.deadT || 0;
    const kind = st.deathKind || 0;
    const buckle = sm(dt / 0.22), fall = sm((dt - 0.12) / 0.55);
    const bounce = dt > 0.67 ? Math.max(0, Math.sin((dt - 0.67) * 14) * Math.exp(-(dt - 0.67) * 8)) * 0.06 : 0;
    if (kind === 1) {
      r[B.ULL] = [-1.4 * buckle + 0.9 * fall, 0, 0.1]; r[B.LLL] = [1.6 * buckle - 0.8 * fall, 0, 0];
      r[B.ULR] = [-1.2 * buckle + 0.8 * fall, 0, -0.1]; r[B.LLR] = [1.5 * buckle - 0.6 * fall, 0, 0];
      rr[0] = fall * PI / 2 * 0.92;
      ro[1] -= buckle * S.hip * 0.42 + fall * S.hip * 0.4;
      r[B.UAL] = [-1.6 * fall, 0, 0.5]; r[B.UAR] = [-1.5 * fall, 0, -0.6]; r[B.LAL] = [-0.4, 0, 0]; r[B.LAR] = [-0.6, 0, 0];
      r[B.HEAD] = [-0.5 * fall, 0.4 * fall, 0];
    } else if (kind === 2) {
      const sd = st.deathSide || 1;
      r[B.ULL] = [-0.5 * buckle, 0, 0.1 + 0.3 * fall]; r[B.LLL] = [1.0 * buckle, 0, 0];
      r[B.ULR] = [-0.3 * buckle, 0, -0.1 - 0.2 * fall]; r[B.LLR] = [0.7 * buckle, 0, 0];
      rr[1] = sd * 0.8 * fall; rr[2] = sd * fall * PI / 2 * 0.9;
      ro[1] -= buckle * S.hip * 0.2 + fall * S.hip * 0.62;
      r[B.UAL] = [-0.4, 0, 0.6 + 0.9 * fall]; r[B.UAR] = [-0.6 * fall, 0, -0.4 - 0.6 * fall];
      r[B.SPINE] = [0.2 * fall, sd * 0.3 * fall, 0]; r[B.HEAD] = [0.2, sd * -0.5 * fall, 0];
    } else {
      r[B.ULL] = [-0.7 * buckle + 0.4 * fall, 0, 0.1 + 0.25 * fall]; r[B.LLL] = [1.1 * buckle - 0.6 * fall, 0, 0];
      r[B.ULR] = [-0.5 * buckle + 0.2 * fall, 0, -0.1 - 0.3 * fall]; r[B.LLR] = [0.9 * buckle - 0.3 * fall, 0, 0];
      rr[0] = -fall * PI / 2 * 0.95;
      ro[1] -= buckle * S.hip * 0.25 + fall * S.hip * 0.55;
      r[B.UAR] = [-0.6 * fall, 0, -0.3 - 1.0 * fall]; r[B.UAL] = [-0.6 * fall, 0, 0.3 + 1.0 * fall];
      r[B.LAR] = [-0.3, 0, 0]; r[B.LAL] = [-0.3, 0, 0];
      r[B.SPINE] = [-0.25 * fall, 0, 0]; r[B.HEAD] = [0.35 * fall, 0.3 * fall, 0];
    }
    ro[1] += bounce * S.s;
  }

  function live(heroId, S, st) {
    const style = STYLE[heroId];
    const r = BASE[heroId] ? BASE[heroId].map(a => a.slice()) : base('rifle');
    const t = st.t;
    const v = st.move || 0;
    if (st.dead) { death(heroId, r, S, st); return r; }
    if (st.idle && IDLE[style]) IDLE[style](r);
    if (st.rest) { const z = Array.from({ length: N }, () => [0, 0, 0]); for (const k of ['UAL', 'LAL', 'UAR', 'LAR']) z[B[k]] = O.Clips.REST[k].slice(); return z; }
    const airW = st.airW !== undefined ? st.airW : (st.air ? 1 : 0);
    const crouchW = st.crouchW !== undefined ? st.crouchW : (st.crouch ? 1 : 0);
    const sprintW = st.sprintW !== undefined ? st.sprintW : (st.sprint ? 1 : 0);
    let still;
    if (heroId === 'zenyatta') still = float(r, S, st, v);
    else if (heroId === 'lucio') still = skate(r, S, st, v, airW, crouchW);
    else still = legs(heroId, r, S, st, v, airW, crouchW, sprintW);
    if (heroId === 'mercy' && st.air && (st.fly || st.descent)) {
      r[B.ULL] = [0.05, 0, 0.02]; r[B.LLL] = [0.3, 0, 0]; r[B.ULR] = [0.12, 0, -0.02]; r[B.LLR] = [0.42, 0, 0];
      if (st.fly) { st.rootRot[0] += 0.4; r[B.HEAD][0] -= 0.3; }
      r[B.BACK][0] -= 0.12;
    }
    if (heroId === 'winston') { r[B.SPINE][0] += 0.3; r[B.HEAD][0] -= 0.3; }
    if (heroId === 'torbjorn') r[B.SPINE][0] += 0.05;
    if (heroId === 'roadhog') r[B.SPINE][0] -= 0.04;
    const pitch = st.pitch || 0;
    r[B.SPINE][0] += -pitch * 0.55;
    r[B.HEAD][0] += -pitch * 0.45;
    const b = Math.sin(t * 1.75 + (st.seed || 0));
    const br = 0.4 + 0.6 * still;
    r[B.SPINE][0] += b * 0.018 * br; r[B.HEAD][0] -= b * 0.012 * br;
    add(r, B.UAR, b * 0.02 * br, 0, 0); add(r, B.UAL, b * 0.02 * br, 0, 0);
    st.rootOff[1] += b * 0.004 * still;
    if (still > 0.5 && !st.idle) { const w = Math.sin(t * 0.37 + (st.seed || 0) * 2); r[B.SPINE][2] += w * 0.025 * still; st.rootRot[2] -= w * 0.012 * still; r[B.HEAD][1] += Math.sin(t * 0.29 + (st.seed || 0)) * 0.08 * still; }
    if (st.idle) { r[B.HEAD][1] += Math.sin(t * 0.45) * 0.14; r[B.HEAD][0] += Math.sin(t * 0.31) * 0.04; }
    actions(heroId, r, S, st);
    recoil(heroId, r, st);
    hurt(r, st);
    if (st.stun) { r[B.HEAD][0] += 0.3; r[B.SPINE][0] += 0.2; r[B.UAR][0] += 0.6; r[B.UAL][0] += 0.6; r[B.HEAD][1] += Math.sin(t * 9) * 0.15; }
    return r;
  }

  const CS = new Float64Array(48);
  function clipPose(heroId, S, st, c, out) {
    const ct = Math.max(0, st.t - (st.poseT0 || 0));
    st.clipT = ct;
    O.Clips.sample(c, ct, CS);
    for (let i = 0; i < N; i++) out[i] = [CS[i * 3], CS[i * 3 + 1], CS[i * 3 + 2]];
    out.rr = [CS[0], CS[1], CS[2]];
    out[0] = [0, 0, 0];
    out.ro = [CS[45] * S.hip, CS[46] * S.hip, CS[47] * S.hip];
    if (c.breath !== false) {
      const b = Math.sin(ct * 1.7), h = c.kind === 'pose' ? Math.max(0, Math.min(1, (ct - c.end * 0.6) / 0.4)) : 0.7;
      out[B.SPINE][0] += b * 0.022 * h; out[B.HEAD][0] -= b * 0.014 * h;
      out[B.UAR][2] -= b * 0.018 * h; out[B.UAL][2] += b * 0.018 * h;
      out.ro[1] += b * 0.005 * S.s * h;
    }
    return out;
  }

  function pose(heroId, S, st) {
    st.rootOff = [0, 0, 0];
    st.rootRot = [0, 0, 0];
    st.s = S.s;
    st.hip = S.hip;
    const c = st.pose && O.Clips ? O.Clips.get(heroId, st.pose) : null;
    st.clip = c;
    const w = c ? (st.poseW === undefined ? 1 : st.poseW) : 0;
    if (c && w >= 0.999) {
      const r = clipPose(heroId, S, st, c, new Array(N));
      st.rootOff = r.ro; st.rootRot = r.rr;
      return r;
    }
    const r = live(heroId, S, st);
    if (c && w > 0) {
      const ro = st.rootOff.slice(), rr = st.rootRot.slice();
      const q = clipPose(heroId, S, st, c, new Array(N));
      const k = sm(w);
      for (let i = 1; i < N; i++) r[i] = mix(r[i], q[i], k);
      st.rootOff = mix(ro, q.ro, k); st.rootRot = mix(rr, q.rr, k);
    }
    return r;
  }

  const tmp = new Float32Array(16);
  function compute(S, rot, st, out, hide) {
    const J = S.J;
    const world = compute.world || (compute.world = Array.from({ length: N }, () => new Float32Array(16)));
    const ro = st.rootOff, rr = st.rootRot;
    let m = M4.translate(st.x, st.y, st.z);
    m = M4.mul(m, M4.rotY(st.yaw || 0));
    if (st.scale && st.scale !== 1) m = M4.mul(m, M4.scale(st.scale, st.scale, st.scale));
    m = M4.mul(m, M4.trs(J[0][0] + ro[0], J[0][1] + ro[1], J[0][2] + ro[2], rr[0] + rot[0][0], rr[1] + rot[0][1], rr[2] + rot[0][2]));
    world[0].set(m);
    for (let i = 1; i < N; i++) {
      const p = PARENT[i];
      const l = M4.trs(J[i][0] - J[p][0], J[i][1] - J[p][1], J[i][2] - J[p][2], rot[i][0], rot[i][1], rot[i][2]);
      M4.mul(world[p], l, world[i]);
    }
    for (let i = 0; i < N; i++) {
      if (hide && hide[i]) { out.fill(0, i * 16, i * 16 + 16); out[i * 16 + 12] = st.x; out[i * 16 + 13] = st.y; out[i * 16 + 14] = st.z; out[i * 16 + 15] = 1; continue; }
      const inv = M4.translate(-J[i][0], -J[i][1], -J[i][2]);
      M4.mul(world[i], inv, tmp);
      out.set(tmp, i * 16);
    }
    return world;
  }

  function hideFor(heroId, st) {
    const h = new Array(N).fill(false);
    const c = st.clip && (st.poseW === undefined || st.poseW >= 0.5) ? st.clip : null;
    const w = c && c.w !== undefined ? c.w : (st.weapon || 0);
    if (heroId === 'torbjorn' || heroId === 'mercy') { if (w === 1) h[B.GUN] = true; else h[B.ALT] = true; }
    else h[B.ALT] = true;
    if (heroId === 'roadhog' && !(st.act === 'hook' && st.t - st.actT < 0.8) && !(c && c.off)) h[B.OFF] = true;
    if (c) {
      if (!c.gun) { h[B.GUN] = true; h[B.ALT] = true; }
      if (c.off === false || (!c.gun && c.off === undefined)) h[B.OFF] = true;
    }
    if (st.noWeapon) { h[B.GUN] = true; h[B.ALT] = true; h[B.OFF] = true; }
    if (heroId === 'winston' && st.rage) h[B.GUN] = true;
    return h;
  }

  const HAND = [];
  function propList(heroId, S, st, world) {
    const c = st.clip;
    if (!c || !c.props || (st.poseW !== undefined && st.poseW < 0.5)) return null;
    const list = O.Clips.propsAt(c, st.clipT || 0);
    if (!list || !list.length) return null;
    const s = S.s;
    const out = [];
    for (const p of list) {
      let f;
      if (p.b === 'R' || p.b === 'L') {
        const key = S.hand - S.elbow;
        if (!HAND[0] || HAND[1] !== key) { HAND[0] = M4.mul(M4.translate(0, key, 0), M4.rotX(PI / 2)); HAND[1] = key; }
        f = M4.mul(world[p.b === 'R' ? B.LAR : B.LAL], HAND[0]);
      } else if (p.b === 'H') f = M4.mul(world[B.HEAD], M4.translate(0, S.head - S.neck, 0));
      else if (p.b === 'C') f = M4.mul(world[B.SPINE], M4.translate(0, S.chest - S.hip - 0.08 * s, 0));
      else {
        f = M4.mul(M4.translate(st.x, st.y, st.z), M4.rotY(st.yaw || 0));
        if (st.scale && st.scale !== 1) f = M4.mul(f, M4.scale(st.scale, st.scale, st.scale));
      }
      const at = p.at || [0, 0, 0], rot = p.r || [0, 0, 0], k = (p.s || 1) * (p.b === 'G' ? 1 : s);
      out.push({ m: p.m, arg: p.arg, mat: M4.mul(f, M4.trs(at[0] * s, at[1] * s, at[2] * s, rot[0], rot[1], rot[2], k, k, k)) });
    }
    return out;
  }


  const VB = 8;
  const ZERO = M4.scale(0, 0, 0);
  const VKICK = {
    widowmaker: [0.1, 0.05, 0.03], mccree: [0.13, 0.05, 0.05], roadhog: [0.15, 0.07, 0.04], junkrat: [0.11, 0.06, 0.03], torbjorn: [0.08, 0.04, 0.03],
    soldier: [0.035, 0.018, 0.02], tracer: [0.025, 0.014, 0.025], lucio: [0.045, 0.03, 0.02], mercy: [0.035, 0.02, 0.02], zenyatta: [0, 0, 0],
    winston: [0.012, 0.006, 0.01], reinhardt: [0, 0, 0], trainbot: [0.04, 0.02, 0.02]
  };
  const VM_PART = {
    mccree: { p: [0.18, -0.17, -0.47], spin: 'z' }, soldier: { p: [0.14, -0.25, -0.62], held: [0.1, -0.2, -0.64] },
    widowmaker: { p: [0.12, -0.25, -0.5], held: [0.08, -0.2, -0.64] }, junkrat: { p: [0.14, -0.2, -0.46], spin: 'x' },
    roadhog: { p: [0.18, -0.06, -0.47], held: [-0.2, -0.28, -0.5] }, winston: { p: [0, -0.33, -0.56] },
    lucio: { p: [0.22, -0.2, -0.68], spin: 'z' }, mercy: { p: [0.2, -0.27, -0.42], alt: true }
  };
  const ITEM_SLOT = {
    mccree: { flash: 5 }, soldier: { field: 5 }, tracer: { bomb: 5 }, junkrat: { mine: 5, trap: 6 }, torbjorn: { turret: 5, pack: 6 },
    widowmaker: { venom: 5 }, winston: { bubble: 5 }, roadhog: { breather: 6 }
  };
  const ROT = { x: M4.rotX, y: M4.rotY, z: M4.rotZ };
  const pose3 = () => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 });
  const HANDS = {
    def: [[0.18, -0.26, -0.37], [-0.16, -0.3, -0.4]], tracer: [[0.2, -0.22, -0.38], [-0.2, -0.22, -0.38]], soldier: [[0.16, -0.25, -0.36], [0.1, -0.24, -0.62]],
    mccree: [[0.18, -0.24, -0.36], [-0.16, -0.3, -0.36]], junkrat: [[0.2, -0.28, -0.34], [0.04, -0.3, -0.56]], torbjorn: [[0.2, -0.27, -0.34], [-0.24, -0.34, -0.35]],
    widowmaker: [[0.14, -0.25, -0.34], [0.08, -0.24, -0.62]], reinhardt: [[0.3, -0.38, -0.32], [-0.3, -0.4, -0.34]], roadhog: [[0.22, -0.3, -0.34], [-0.2, -0.34, -0.46]],
    winston: [[0.24, -0.33, -0.4], [-0.24, -0.33, -0.4]], lucio: [[0.22, -0.27, -0.34], [-0.22, -0.4, -0.4]], mercy: [[0.22, -0.28, -0.34], [-0.22, -0.42, -0.4]],
    zenyatta: [[0.2, -0.3, -0.36], [-0.2, -0.3, -0.36]]
  };
  const ROOT_PIVOT = [0.12, -0.22, -0.3];
  const piv = (q, p) => M4.mul(M4.translate(q.x + p[0], q.y + p[1], q.z + p[2]), M4.mul(M4.trs(0, 0, 0, q.rx, q.ry, q.rz), M4.translate(-p[0], -p[1], -p[2])));

  function vmReload(heroId, at, P) {
    const dur = reloadTime(heroId);
    if (at < 0 || at > dur + 0.15) return;
    const k = env(at, 0.18, dur - 0.42, 0.24);
    const p = clamp(at / dur, 0, 1);
    const L = P.L, R = P.R, X = P.X;
    if (heroId === 'mccree') {
      R.rz += 0.55 * k; R.rx += 0.25 * k; R.x -= 0.05 * k; R.y += 0.03 * k;
      const open = env(at, 0.12, dur - 0.5, 0.15);
      X.x -= 0.04 * open; X.rz += 0.9 * open;
      X.spin = sm(clamp((at - (dur - 0.34)) / 0.3, 0, 1)) * PI * 4 + p * PI * 2 * open;
      const load = env(at - 0.25, 0.2, dur - 0.85, 0.2);
      L.x += 0.2 * load; L.y += 0.12 * load; L.z -= 0.05 * load + Math.sin(p * PI * 5) * 0.02 * load; L.rx += 0.3 * load;
    } else if (heroId === 'soldier' || heroId === 'widowmaker') {
      const roll = heroId === 'widowmaker' ? 0.16 : 0.3;
      R.rz += roll * k; R.rx += roll * 0.4 * k; R.x -= 0.03 * k; R.y -= 0.01 * k;
      const out = env(at, 0.15, dur * 0.28, 0.18), back = env(at - dur * 0.42, 0.18, dur * 0.1, 0.2);
      X.y -= 0.2 * out; X.rx -= 0.35 * out;
      L.y -= 0.16 * out - 0.1 * back; L.x -= 0.05 * out - 0.04 * back; L.rx += 0.3 * back;
      X.held = out > 0.92 ? 1 : 0;
    } else if (heroId === 'tracer') {
      const spin = sm(clamp((at - 0.08) / 0.5, 0, 1)) * PI * 2;
      R.rx -= spin; L.rx -= spin;
      R.y -= 0.04 * k; L.y -= 0.04 * k; R.z += 0.04 * k; L.z += 0.04 * k;
    } else if (heroId === 'junkrat') {
      R.rz -= 0.45 * k; R.rx += 0.3 * k; R.y += 0.04 * k;
      const twist = env(at - 0.2, 0.25, dur - 0.75, 0.25);
      X.spin = twist * PI * 1.5 * p; L.x += 0.14 * twist; L.y += 0.1 * twist; L.z += 0.08 * twist;
    } else if (heroId === 'roadhog') {
      R.rz += 0.35 * k; R.rx += 0.35 * k;
      const shove = env(at, 0.3, 0.15, 0.2) + env(at - 0.7, 0.2, 0.1, 0.2);
      L.x += 0.2 * k; L.y += 0.22 * k - 0.08 * shove; L.z -= 0.06 * k; L.rx += 0.6 * k;
      X.held = k > 0.35 ? 1 : 0;
    } else if (heroId === 'torbjorn') {
      R.rx += 0.3 * k; R.rz += 0.25 * k;
      const slam = env(at, 0.3, 0.05, 0.25) + env(at - 0.8, 0.3, 0.05, 0.25);
      L.y += 0.16 * k - 0.08 * slam; L.x += 0.16 * k; L.rx += 0.4 * slam;
    } else if (heroId === 'winston') {
      X.rz += Math.sin(p * PI * 6) * 0.08 * k; X.y -= 0.04 * k;
      const slap = env(at, 0.3, 0.05, 0.2) + env(at - 0.65, 0.15, 0.05, 0.2);
      L.x += 0.1 * slap; L.y += 0.06 * slap;
    } else if (heroId === 'lucio') {
      R.rz += 0.5 * k; R.rx += 0.15 * k;
      X.spin = sm(clamp((at - 0.15) / (dur - 0.3), 0, 1)) * PI * 3;
      const tap = env(at - 0.2, 0.15, 0.25, 0.2);
      L.x += 0.16 * tap; L.y += 0.08 * tap;
    } else if (heroId === 'mercy') {
      R.rz += 0.5 * k; R.rx += 0.2 * k;
      const out = env(at, 0.12, dur * 0.3, 0.2), back = env(at - dur * 0.45, 0.2, 0.1, 0.2);
      X.y -= 0.16 * out; L.x += 0.12 * back; L.y += 0.12 * back;
    } else if (heroId === 'zenyatta') {
      const w = Math.sin(p * PI * 2);
      R.x += 0.05 * w * k; L.x -= 0.05 * w * k; R.y += 0.06 * k; L.y += 0.06 * k;
      X.grow = 1 - env(at, 0.15, dur - 0.5, 0.35) * 0.9;
    } else { R.rx -= 0.5 * k; R.rz += 0.5 * k; R.y -= 0.08 * k; }
  }

  const THROW_BACK = { soldier: 0.24, widowmaker: 0.26, junkrat: 0.16 };
  function vmThrow(item, at, P, heroId) {
    const L = P.L, I = P.I;
    L.z += (THROW_BACK[heroId] || 0) * env(at, 0.08, 0.3, 0.2);
    if (item === 'field') {
      if (at > 0.65) return;
      const k = env(at, 0.18, 0.15, 0.3);
      L.y -= 0.3 * k; L.x += 0.05 * k; L.z += 0.05 * k; L.rx -= 0.6 * k;
      P.R.y -= 0.06 * k; P.R.rx += 0.15 * k;
      I.on = at < 0.34 ? 1 : 0;
      return;
    }
    const dur = item === 'turret' ? 0.6 : 0.5;
    if (at > dur) return;
    const p = clamp(at / (dur * 0.65), 0, 1);
    const k = env(at, 0.1, dur * 0.4, dur * 0.4);
    if (item === 'flash' || item === 'pack' || item === 'bubble') { L.y -= 0.12 * (1 - p) * k - 0.04 * k; L.z -= 0.35 * sm(p) * k; L.x += 0.08 * k; L.rx += (0.8 * sm(p) - 0.4) * k; }
    else { L.y += 0.2 * k * (1 - sm(p)) + 0.06 * k; L.z -= 0.28 * sm(p) * k - 0.08 * (1 - p) * k; L.x += 0.06 * k; L.rx += (-0.7 + 1.4 * sm(p)) * k; }
    if (item === 'turret') { P.R.y -= 0.05 * k; P.R.rx -= 0.2 * k; }
    I.on = p < 0.85 ? 1 : 0;
  }

  function vmActions(heroId, st, P, C) {
    const t = st.t, act = st.act, at = t - (st.actT === undefined ? -9 : st.actT);
    const L = P.L, R = P.R, X = P.X;
    if (act === 'reload') vmReload(heroId, at, P);
    else if (act === 'throw') vmThrow(st.item, at, P, heroId);
    else if (act === 'melee' && at < 0.5) {
      const k = env(at, 0.08, 0.06, 0.3), w = env(at, 0.05, 0, 0.08);
      if (heroId === 'reinhardt') { C.ry += (0.8 - 1.8 * sm(at / 0.3)) * env(at, 0.05, 0.25, 0.2); C.rx -= 0.4 * k; }
      else if (heroId === 'mercy') { R.z -= 0.25 * k; R.ry += 0.6 * k - 0.3 * w; R.x -= 0.1 * k; }
      else if (heroId === 'zenyatta') { C.y += 0.06 * k; L.y -= 0.1 * k; R.y -= 0.1 * k; C.rx -= 0.12 * k; }
      else { L.z -= 0.42 * k - 0.06 * w; L.y += 0.07 * k; L.x += 0.16 * k; L.ry -= 0.3 * k; R.y -= 0.05 * k; R.rz -= 0.12 * k; }
    } else if (act === 'swing' && at < 0.7) {
      const p = clamp((at - 0.03) / 0.28, 0, 1), s = st.side || 1, k = env(at, 0.04, 0.42, 0.24);
      C.ry += s * (1.1 - 2.2 * sm(p)) * 0.62 * k; C.rx += (-0.55 + 0.9 * Math.sin(p * PI)) * k; C.z -= 0.08 * Math.sin(p * PI) * k;
    } else if (act === 'strike' && at < 0.65) { const p = clamp(at / 0.3, 0, 1), k = env(at, 0.05, 0.3, 0.3); C.rx += (-1.05 + 1.5 * sm(p)) * k; C.ry += (0.45 - 0.9 * sm(p)) * k; }
    else if (act === 'shatter' && at < 1.1) { const p = clamp((at - 0.3) / 0.25, 0, 1), k = env(at, 0.15, 0.6, 0.3); C.rx += (-1.3 + 2.1 * sm(p)) * k; C.y += (0.12 - 0.26 * sm(p)) * k; }
    else if (act === 'charge' && at < 3) { const k = env(at, 0.2, 2.5, 0.3); R.y -= 0.1 * k; R.z += 0.12 * k; R.rx += 0.4 * k; L.z -= 0.1 * k; L.y += 0.04 * k; C.rz += Math.sin(t * 16) * 0.02 * k; }
    else if (act === 'roll' && at < 0.5) { const p = clamp(at / 0.45, 0, 1); C.rz += Math.sin(p * PI) * 0.9; C.y -= 0.14 * Math.sin(p * PI); X.spin = sm(p) * PI * 4; X.rz += 0.8 * Math.sin(p * PI); }
    else if (act === 'hook' && at < 0.6) { const p = clamp(at / 0.16, 0, 1), k = env(at, 0.05, 0.35, 0.2); L.z -= 0.32 * sm(p) * k; L.y += 0.1 * k; L.x += 0.05 * k; L.rx += 0.25 * k; }
    else if (act === 'cast' && at < 0.45) { const k = env(at, 0.05, 0.12, 0.25); L.z -= 0.28 * k; L.y += 0.06 * k; L.x += 0.06 * k; X.lt = k; }
    else if (act === 'punch' && at < 0.45) {
      const side = Math.round((st.actT || 0) * 30) % 2 ? 1 : -1, k = env(at, 0.08, 0.05, 0.28);
      const A = side > 0 ? L : R;
      A.z -= 0.42 * k; A.x -= side * 0.12 * k; A.y += 0.05 * k; A.ry += side * 0.3 * k;
    } else if (act === 'breather' && at < 1.3) { const k = env(at, 0.2, 0.85, 0.25); L.y += 0.2 * k; L.x += 0.18 * k; L.z += 0.1 * k; L.rx += 0.8 * k; C.rx -= 0.2 * k; P.I.on = k > 0.25 ? 1 : 0; }
    else if (act === 'blink' && at < 0.25) { const k = env(at, 0.03, 0.04, 0.18); C.z += 0.12 * k; C.y -= 0.05 * k; C.rx -= 0.18 * k; }
    else if (act === 'recall' && at < 1.3) { const k = env(at, 0.1, 1.0, 0.2); C.y -= 0.12 * k; C.rz += Math.sin(at * 18) * 0.1 * k; }
    else if (act === 'rez' && at < 1.6) { const k = env(at, 0.25, 1.0, 0.35); L.z -= 0.25 * k; L.y += 0.18 * k; L.x += 0.1 * k; L.rx += 0.6 * k; R.y += 0.12 * k; R.rx -= 0.3 * k; }
    else if (act === 'ga' && at < 0.8) { const k = env(at, 0.08, 0.4, 0.3); R.z -= 0.12 * k; R.y += 0.06 * k; C.z += 0.05 * k; }
    else if (act === 'amp' && at < 0.9) { const k = env(at, 0.15, 0.4, 0.3); R.y += 0.12 * k; R.rx -= 0.45 * k; R.z -= 0.04 * k; R.x += 0.03 * k; }
    else if (act === 'wave' && at < 0.45) { const k = env(at, 0.05, 0.1, 0.28); R.z -= 0.18 * k; R.rx -= 0.1 * k; C.z -= 0.05 * k; }
    else if (act === 'soundbarrier' && at < 1.1) { const up = env(at, 0.25, 0.1, 0.3), slam = env(at - 0.55, 0.06, 0.25, 0.25); L.y += 0.25 * up - 0.3 * slam; L.z -= 0.1 * slam; R.y += 0.2 * up; C.rx -= 0.3 * up - 0.4 * slam; }
    else if (act === 'hammer' && at < 0.55) { const p = clamp(at / 0.22, 0, 1), k = env(at, 0.04, 0.25, 0.25); C.rx += (-0.9 + 1.5 * sm(p)) * k; C.z -= 0.06 * Math.sin(p * PI) * k; C.ry += (0.2 - 0.3 * p) * k; }
    else if (act === 'leap' && st.air) { C.rx -= 0.25; C.y -= 0.05; L.y += 0.05; R.y += 0.05; }
    else if (act === 'rage' && at < 1.6) { const k = env(at, 0.2, 1.0, 0.4), b = Math.max(0, Math.sin(at * 14)); L.y += 0.1 * k * b; R.y += 0.1 * k * (1 - b); L.x += 0.08 * k; R.x -= 0.08 * k; C.rx -= 0.2 * k; }
    else if (act === 'hog' && at < 6.2) { const k = env(at, 0.25, 5.6, 0.3); C.y -= 0.03 * k; C.rx += 0.05 * k + Math.sin(t * 45) * 0.012 * k; C.rz += Math.sin(t * 37) * 0.01 * k; }
    else if (act === 'deadeye') { R.x -= 0.06; R.y -= 0.03; R.rz += 0.15; L.x += 0.18; L.y += 0.08; L.z -= 0.02 + Math.sin(t * 6) * 0.01; L.ry -= 0.3; }
    else if (act === 'tire') { C.y -= 0.4; }
  }

  O.Anim = {
    STYLE, STRIDE, pose, compute, hideFor, hipTarget, reloadTime, VB,
    heroBones(heroId, S, st, out) {
      const rot = pose(heroId, S, st);
      return compute(S, rot, st, out, hideFor(heroId, st));
    },
    props: propList,
    view(heroId, st, out) {
      const t = st.t, fp = st.fp || {};
      const R = pose3(), L = pose3(), C = pose3();
      const X = Object.assign(pose3(), { spin: 0, grow: 1, held: 0, lt: 0, rt: 0 }), I = { on: 0 };
      const P = { R, L, X, I };
      const crouch = fp.crouch || 0;
      const bobW = st.onGround ? clamp((st.move || 0) / 5.5, 0, 1.2) * (1 - crouch * 0.45) : 0;
      const ph = st.phase || 0;
      C.x = Math.sin(ph * 0.5) * 0.014 * bobW + (fp.sx || 0);
      C.y = -Math.abs(Math.cos(ph * 0.5)) * 0.012 * bobW + Math.sin(t * 1.6) * 0.0035 * (1 - clamp(bobW, 0, 1)) + (fp.sy || 0) + (fp.land || 0) + (fp.air || 0) * 0.012 - 0.015 * crouch;
      C.rx = (fp.srx || 0) + (fp.land || 0) * 2.2 - (fp.air || 0) * 0.035;
      C.ry = fp.sry || 0;
      C.rz = (fp.roll || 0) + Math.sin(ph * 0.5) * 0.02 * bobW + 0.05 * crouch;
      const eq = fp.equip === undefined ? 1 : fp.equip;
      if (eq < 1) { const e = 1 - sm(eq); C.y -= 0.32 * e * e; C.rx -= 0.9 * e; C.rz += 0.25 * e; }
      const sinceShot = t - (st.shotT === undefined ? -9 : st.shotT);
      const kk = VKICK[heroId] || VKICK.trainbot;
      if (sinceShot >= 0 && sinceShot < 0.35) {
        const k = kick(sinceShot, 0.02, 15), sg = Math.round((st.shotT || 0) * 97) % 2 ? 1 : -1;
        C.rx += kk[0] * k; C.z += kk[1] * k; C.rz += kk[2] * k * sg; C.y += kk[0] * 0.15 * k;
        if (heroId === 'mccree') X.spin += sm(clamp(sinceShot / 0.12, 0, 1)) * PI / 3;
      }
      vmActions(heroId, st, P, C);
      const s2 = t - (st.shot2T === undefined ? -9 : st.shot2T);
      if (s2 >= 0 && s2 < 0.6) {
        if (heroId === 'mccree') { const k = env(s2, 0.025, 0.03, 0.1); L.x += 0.2 * k; L.y += 0.08 * k; L.z -= 0.02 * k; L.ry -= 0.5 * k; C.rx += 0.06 * kick(s2, 0.02, 15); X.spin += sm(clamp(s2 / 0.1, 0, 1)) * PI / 3; }
        else if (heroId === 'soldier') { const k = kick(s2, 0.03, 7); C.rx += 0.16 * k; C.z += 0.06 * k; C.y += 0.02 * k; }
        else if (heroId === 'lucio') { const k = kick(s2, 0.03, 9); C.z += 0.06 * k; C.rx += 0.08 * k; }
        else if (heroId === 'zenyatta') { const k = kick(s2, 0.03, 8); C.z += 0.05 * k; L.z -= 0.15 * k; R.z -= 0.15 * k; X.lt = Math.max(X.lt, k); X.rt = Math.max(X.rt, k); }
        else if (heroId === 'torbjorn') { const k = kick(s2, 0.02, 10); C.rx += 0.12 * k; C.z += 0.06 * k; }
      }
      if (heroId === 'zenyatta' && sinceShot >= 0 && sinceShot < 0.3 && !st.volley) {
        const side = Math.round((st.shotT || 0) * 60) % 2 ? 1 : -1, k = env(sinceShot, 0.04, 0.02, 0.2);
        const A = side > 0 ? L : R;
        A.z -= 0.2 * k; A.y += 0.04 * k;
        if (side > 0) X.lt = Math.max(X.lt, k); else X.rt = Math.max(X.rt, k);
      }
      if (heroId === 'reinhardt' && st.shield) { C.rx += 0.5; C.y -= 0.25; C.ry -= 0.2; L.x += 0.12; L.y += 0.14; L.z -= 0.12; }
      if (heroId === 'widowmaker' && st.scope >= 0) { C.x -= 0.1; C.y += 0.05; C.z += 0.08; }
      if (heroId === 'mercy' && st.beam && st.weapon !== 1) { R.z -= 0.05; R.y += 0.02; R.rx -= 0.05; }
      const sp = fp.sprint !== undefined ? fp.sprint : (st.sprint ? 1 : 0);
      if (sp > 0) { C.rx -= 0.38 * sp; C.ry += 0.45 * sp; C.y -= 0.05 * sp; C.rz += Math.sin(ph * 0.5) * 0.05 * sp; C.x += Math.sin(ph * 0.5) * 0.02 * sp; }
      if (st.dead) C.y -= 0.6;
      if (st.breath) { C.rx -= 0.4; C.y -= 0.15; }
      const hp = HANDS[heroId] || HANDS.def;
      const root = piv(C, ROOT_PIVOT);
      const right = M4.mul(root, piv(R, hp[0]));
      const left = M4.mul(root, piv(L, hp[1]));
      const w1 = (heroId === 'torbjorn' || heroId === 'mercy') && st.weapon === 1;
      for (let i = 0; i < VB; i++) out.set(ZERO, i * 16);
      out.set(w1 ? ZERO : right, 0);
      out.set(left, 16);
      out.set(w1 ? right : ZERO, 48);
      if (heroId === 'torbjorn') out.set(right, 32);
      const part = VM_PART[heroId];
      if (part && (!part.alt || w1)) {
        const [px, py, pz] = part.p;
        let m;
        if (X.held && part.held) m = M4.mul(left, M4.translate(part.held[0] - px, part.held[1] - py, part.held[2] - pz));
        else {
          m = M4.mul(right, M4.translate(px + X.x, py + X.y, pz + X.z));
          m = M4.mul(m, M4.trs(0, 0, 0, X.rx, X.ry, X.rz));
          if (X.spin) m = M4.mul(m, ROT[part.spin || 'z'](X.spin));
          m = M4.mul(m, M4.translate(-px, -py, -pz));
        }
        if (heroId === 'winston' && st.rage) m = ZERO;
        out.set(m, 64);
      }
      if (heroId === 'zenyatta') {
        const orb = (hand, k, dir, g) => {
          const s = (1 + (st.volley || 0) * 0.22 + Math.sin(t * 3) * 0.04) * (1 - k * 0.6) * g;
          return M4.mul(hand, M4.mul(M4.translate(dir * 0.13, -0.24 + Math.sin(t * 2.2 + dir) * 0.01, -0.62 - k * 0.3), M4.mul(M4.mul(M4.scale(s, s, s), M4.rotY(dir * t * 1.5)), M4.translate(0, 0.24, 0.62))));
        };
        out.set(orb(right, X.rt, 1, X.grow), 32);
        out.set(orb(left, X.lt, -1, X.grow), 64);
      }
      const slot = ITEM_SLOT[heroId] && ITEM_SLOT[heroId][st.act === 'breather' ? 'breather' : st.item];
      if (slot !== undefined && I.on) out.set(left, slot * 16);
      return out;
    }
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
