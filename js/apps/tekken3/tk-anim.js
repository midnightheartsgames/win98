(function (T) {
  'use strict';
  const { clamp, lerp, EASE, vadd, vsub, vscale, vlen, vnorm, mvec, mtvec, rotYPR, fillPose, clonePose, lerpPose, chestLocal, mirrorPose } = T;

  const LV_Y = { h: 1.5, m: 1.12, sm: 1.02, l: 0.36, lp: 0.7, g: 0.12, t: 1.3, u: 1.15 };

  const STANCES = {
    karate: {
      p: [-0.03, 0.88, 0.02], py: 0.55, cy: -0.2, cp: 0.1, hp: 0.04,
      lf: [0.25, 0.075, -0.12], rf: [-0.26, 0.075, 0.15], lfy: -0.55, rfy: 0.35,
      lh: [0.34, 0.36, -0.06], rh: [0.2, 0.3, 0.15], le: [-0.2, -1, -0.5], re: [-0.35, -1, 0.45],
      lk: [1, 0.05, -0.3], rk: [1, 0.1, 0.35], bob: 0.012, rate: 0.09
    },
    boxer: {
      p: [-0.02, 0.86, 0.02], py: 0.5, cy: -0.1, cp: 0.16, hp: 0.12,
      lf: [0.22, 0.075, -0.13], rf: [-0.22, 0.075, 0.15], lfy: -0.45, rfy: 0.3,
      lh: [0.28, 0.44, -0.05], rh: [0.2, 0.43, 0.12], le: [-0.1, -1, -0.35], re: [-0.2, -1, 0.35],
      lk: [1, 0.05, -0.25], rk: [1, 0.1, 0.3], bob: 0.025, rate: 0.16, bounce: true
    },
    kung: {
      p: [-0.04, 0.82, 0], py: 0.75, cy: -0.35, cp: 0.05, hp: 0.02,
      lf: [0.32, 0.075, -0.08], rf: [-0.3, 0.075, 0.18], lfy: -0.7, rfy: 0.6,
      lh: [0.42, 0.3, -0.02], rh: [0.26, 0.22, 0.14], le: [-0.1, -0.8, -0.8], re: [-0.3, -1, 0.6],
      lk: [1, 0.05, -0.3], rk: [1, 0.2, 0.5], lo: 1, ro: 1, bob: 0.01, rate: 0.07
    },
    tkd: {
      p: [-0.03, 0.92, 0.02], py: 0.9, cy: -0.4, cp: 0.02, hp: 0.0,
      lf: [0.24, 0.075, -0.05], rf: [-0.24, 0.075, 0.12], lfy: -0.9, rfy: 0.2,
      lh: [0.28, 0.2, -0.12], rh: [0.18, 0.18, 0.16], le: [-0.2, -1, -0.5], re: [-0.3, -1, 0.5],
      lk: [1, 0.05, -0.2], rk: [1, 0.1, 0.25], bob: 0.03, rate: 0.14, bounce: true
    },
    wrestler: {
      p: [0, 0.84, 0], py: 0.2, cy: -0.05, cp: 0.3, hp: -0.2,
      lf: [0.18, 0.075, -0.2], rf: [-0.14, 0.075, 0.22], lfy: -0.25, rfy: 0.25,
      lh: [0.42, 0.2, -0.24], rh: [0.38, 0.18, 0.26], le: [-0.4, -0.7, -1], re: [-0.4, -0.7, 1],
      lk: [1, 0.05, -0.4], rk: [1, 0.05, 0.4], lo: 1, ro: 1, bob: 0.015, rate: 0.06
    },
    capoeira: {
      p: [-0.02, 0.8, 0.02], py: 0.3, cy: -0.1, cp: 0.22, hp: -0.05,
      lf: [0.2, 0.075, -0.22], rf: [-0.25, 0.075, 0.2], lfy: -0.3, rfy: 0.4,
      lh: [0.3, 0.22, -0.2], rh: [0.05, 0.5, 0.25], le: [-0.3, -0.6, -1], re: [-0.2, -0.3, 1],
      lk: [1, 0.05, -0.4], rk: [1, 0.1, 0.4], lo: 1, ro: 1, bob: 0.02, rate: 0.05, ginga: true
    },
    ninja: {
      p: [-0.05, 0.84, 0.02], py: 0.6, cy: -0.25, cp: 0.14, hp: 0.05,
      lf: [0.28, 0.075, -0.12], rf: [-0.28, 0.075, 0.16], lfy: -0.6, rfy: 0.5,
      lh: [0.3, 0.26, 0.02], rh: [0.26, 0.24, 0.1], le: [-0.2, -1, -0.5], re: [-0.3, -1, 0.5],
      lk: [1, 0.05, -0.3], rk: [1, 0.1, 0.4], bob: 0.012, rate: 0.08
    },
    drunk: {
      p: [-0.04, 0.84, 0.03], py: 0.35, cy: 0.2, cp: 0.18, cr: 0.12, hp: 0.1, hy: 0.25,
      lf: [0.18, 0.075, -0.18], rf: [-0.2, 0.075, 0.2], lfy: -0.4, rfy: 0.5,
      lh: [0.3, 0.32, -0.1], rh: [0.1, 0.1, 0.3], le: [-0.2, -0.8, -0.7], re: [-0.3, -1, 0.6],
      lk: [1, 0.05, -0.3], rk: [1, 0.1, 0.35], lo: 1, ro: 0, bob: 0.03, rate: 0.045, sway: 0.12
    },
    bear: {
      p: [0, 0.86, 0], py: 0.1, cy: 0, cp: 0.35, hp: -0.3,
      lf: [0.16, 0.075, -0.24], rf: [-0.12, 0.075, 0.24], lfy: -0.1, rfy: 0.15,
      lh: [0.46, 0.32, -0.26], rh: [0.44, 0.34, 0.26], le: [-0.4, -0.8, -1], re: [-0.4, -0.8, 1],
      lk: [1, 0.05, -0.5], rk: [1, 0.05, 0.5], lo: 1, ro: 1, bob: 0.03, rate: 0.05, sway: 0.08
    },
    robot: {
      p: [0, 0.9, 0], py: 0.25, cy: -0.1, cp: 0.08, hp: 0,
      lf: [0.18, 0.075, -0.2], rf: [-0.16, 0.075, 0.22], lfy: -0.25, rfy: 0.1,
      lh: [0.36, 0.3, -0.2], rh: [0.3, 0.26, 0.24], le: [-0.3, -1, -0.8], re: [-0.3, -1, 0.8],
      lk: [1, 0.05, -0.3], rk: [1, 0.05, 0.3], bob: 0.004, rate: 0.03
    },
    thai: {
      p: [-0.02, 0.9, 0.02], py: 0.35, cy: -0.1, cp: 0.08, hp: 0.06,
      lf: [0.2, 0.075, -0.14], rf: [-0.2, 0.075, 0.16], lfy: -0.35, rfy: 0.25,
      lh: [0.3, 0.46, -0.1], rh: [0.26, 0.46, 0.14], le: [-0.2, -0.9, -0.5], re: [-0.2, -0.9, 0.5],
      lk: [1, 0.05, -0.25], rk: [1, 0.1, 0.3], bob: 0.02, rate: 0.12, bounce: true
    },
    aiki: {
      p: [-0.02, 0.9, 0.02], py: 0.45, cy: -0.15, cp: 0.06, hp: 0.02,
      lf: [0.22, 0.075, -0.1], rf: [-0.22, 0.075, 0.14], lfy: -0.45, rfy: 0.3,
      lh: [0.4, 0.28, -0.04], rh: [0.26, 0.2, 0.12], le: [-0.1, -1, -0.4], re: [-0.3, -1, 0.4],
      lk: [1, 0.05, -0.25], rk: [1, 0.1, 0.3], lo: 1, ro: 1, bob: 0.01, rate: 0.07
    },
    wingchun: {
      p: [0, 0.86, 0], py: 0.2, cy: -0.1, cp: 0.04, hp: 0.02,
      lf: [0.12, 0.075, -0.15], rf: [-0.1, 0.075, 0.15], lfy: -0.1, rfy: 0.2,
      lh: [0.45, 0.32, -0.02], rh: [0.28, 0.3, 0.03], le: [0, -1, -0.1], re: [0, -1, 0.1],
      lk: [1, 0.1, 0.2], rk: [1, 0.1, -0.2], lo: 1, ro: 0, bob: 0.008, rate: 0.08
    },
    colossus: {
      p: [0, 0.86, 0], py: 0.3, cy: -0.1, cp: 0.2, hp: -0.1,
      lf: [0.24, 0.075, -0.22], rf: [-0.22, 0.075, 0.24], lfy: -0.3, rfy: 0.3,
      lh: [0.44, 0.24, -0.24], rh: [0.3, 0.3, 0.3], le: [-0.4, -0.8, -1], re: [-0.4, -0.8, 1],
      lk: [1, 0.05, -0.4], rk: [1, 0.05, 0.4], lo: 1, ro: 0, bob: 0.02, rate: 0.04
    }
  };

  function stancePose(name) {
    const st = STANCES[name] || STANCES.karate;
    return fillPose(st);
  }

  const K = (f, pose, e) => ({ f: Math.max(0, Math.round(f)), pose, e: e || 'io' });

  function unrot(pose, B, abs) {
    if (!pose.by && !pose.bp && !pose.br) return abs;
    const P = pose.p;
    const Rb = rotYPR(pose.by, pose.bp, pose.br);
    return vadd(P, mtvec(Rb, vsub(abs, P)));
  }

  function setHand(pose, B, side, abs) {
    const a = unrot(pose, B, abs);
    pose[side === 'l' ? 'lh' : 'rh'] = chestLocal(pose, B, a);
    return pose;
  }

  function setFoot(pose, B, side, abs) {
    pose[side === 'l' ? 'lf' : 'rf'] = unrot(pose, B, abs);
    return pose;
  }

  function mod(base, m) {
    const o = clonePose(base);
    for (const k in m) {
      const v = m[k];
      if (k.startsWith('+')) {
        const key = k.slice(1);
        if (Array.isArray(v)) o[key] = [o[key][0] + v[0], o[key][1] + v[1], o[key][2] + v[2]];
        else o[key] = o[key] + v;
      } else o[k] = Array.isArray(v) ? v.slice() : v;
    }
    return o;
  }

  const sgn = side => side === 'l' ? -1 : 1;

  function times(c) {
    const st = Math.max(3, c.st), act = Math.max(1, c.act), rec = Math.max(2, c.rec);
    const total = st + act + rec;
    return { st, act, rec, total, wind: Math.max(1, Math.round(st * 0.5)), hold: st + act - 1, back: st + act + Math.round(rec * 0.45) };
  }

  function guardOf(stance) { return { lh: stance.lh.slice(), rh: stance.rh.slice(), le: stance.le.slice(), re: stance.re.slice() }; }

  const ARCH = {};

  ARCH.punch = (c) => {
    const { B, s } = c;
    const tm = times(c);
    const side = c.side || 'r', z = sgn(side);
    const kind = c.kind || 'straight';
    const y = (c.y || LV_Y.h) / s, r = (c.r || 0.85) / s;
    const S = c.base;
    const hand = side === 'l' ? 'lh' : 'rh';
    const elbow = side === 'l' ? 'le' : 're';
    const turn = side === 'l' ? 0.35 : -0.55;
    const keys = [];
    let wind = mod(S, { '+cy': -turn * 0.25 });
    let hit = mod(S, { '+cy': turn, '+p': [0.07, -0.02, 0], '+cp': 0.08 });
    let tgt = [r, y, z * -0.02];
    if (kind === 'hook') {
      wind = mod(S, { '+cy': -turn * 0.6, '+p': [0, -0.02, 0] });
      setHand(wind, B, side, [0.05, y, z * 0.42]);
      wind[elbow] = [0, 0.3, z];
      hit = mod(S, { '+cy': turn * 1.6, '+p': [0.06, -0.03, 0], '+cp': 0.1 });
      hit[elbow] = [-0.1, 0.6, z];
      tgt = [r * 0.92, y, -z * 0.12];
    } else if (kind === 'upper') {
      wind = mod(S, { '+cy': -turn * 0.3, '+p': [0.02, -0.12, 0], '+cp': 0.3 });
      setHand(wind, B, side, [0.2, 0.92, z * 0.08]);
      wind[elbow] = [0.2, -1, z * 0.3];
      hit = mod(S, { '+cy': turn * 1.2, '+p': [0.1, 0.06, 0], cp: -0.12, hp: -0.1 });
      hit[elbow] = [0.4, -1, z * 0.2];
      tgt = [r * 0.85, y + 0.1 / s, -z * 0.02];
    } else if (kind === 'body') {
      wind = mod(S, { '+cy': -turn * 0.3, '+p': [0, -0.08, 0], '+cp': 0.2 });
      hit = mod(S, { '+cy': turn * 1.2, '+p': [0.1, -0.14, 0], '+cp': 0.38 });
      hit[elbow] = [-0.2, -0.7, z * 0.9];
      tgt = [r, Math.min(y, 1.08 / s), -z * 0.04];
    } else if (kind === 'elbow') {
      wind = mod(S, { '+cy': -turn * 0.6 });
      hit = mod(S, { '+cy': turn * 1.8, '+p': [0.12, -0.03, 0], '+cp': 0.12 });
      tgt = [0.18 / s, y - 0.02 / s, -z * 0.3];
      hit[elbow] = [1, 0.25, z * 0.4];
    } else if (kind === 'hammer') {
      wind = mod(S, { '+cy': -turn * 0.2, '+p': [-0.02, 0.03, 0], cp: -0.12 });
      setHand(wind, B, side, [0.05, 2.0 / s, z * 0.12]);
      wind[elbow] = [0, 0.2, z];
      hit = mod(S, { '+cy': turn * 0.6, '+p': [0.1, -0.08, 0], '+cp': 0.35 });
      hit[elbow] = [0, 0.5, z];
      tgt = [r, y, 0];
    } else if (kind === 'back') {
      wind = mod(S, { '+cy': turn * 0.4 });
      setHand(wind, B, side, [0.1, y, -z * 0.3]);
      hit = mod(S, { '+cy': -turn * 0.7, '+p': [0.05, 0, 0] });
      hit[elbow] = [0, 0.6, z];
      tgt = [r, y, z * 0.2];
    } else if (kind === 'palm') {
      wind = mod(S, { '+p': [-0.04, -0.03, 0], cy: 0, py: 0.1, lo: 1, ro: 1 });
      setHand(wind, B, 'l', [0.2, y, -0.12]); setHand(wind, B, 'r', [0.2, y, 0.12]);
      hit = mod(S, { '+p': [0.14, -0.06, 0], cy: 0, py: 0.15, '+cp': 0.12, lo: 1, ro: 1 });
      setHand(hit, B, 'l', [r, y, -0.1]); setHand(hit, B, 'r', [r, y, 0.1]);
      keys.push(K(tm.wind, wind), K(tm.st, hit, 'in'), K(tm.hold, hit, 'lin'), K(tm.back, lerpPose(hit, S, 0.55)), K(tm.total, S));
      return keys;
    } else if (kind === 'low') {
      wind = mod(S, { '+p': [0, -0.3, 0], '+cp': 0.25, '+cy': -turn * 0.2 });
      hit = mod(S, { '+p': [0.08, -0.36, 0], '+cp': 0.35, '+cy': turn });
      tgt = [r, Math.min(y, LV_Y.lp / s), -z * 0.02];
    } else if (kind === 'jab') {
      hit = mod(S, { '+cy': turn * 0.8, '+p': [0.05, -0.01, 0], '+cp': 0.04 });
    }
    setHand(hit, B, side, tgt);
    const recover = c.endPose || S;
    keys.push(K(tm.wind, wind), K(tm.st, hit, kind === 'hook' || kind === 'upper' ? 'io' : 'in'), K(tm.hold, hit, 'lin'), K(tm.back, lerpPose(hit, recover, 0.6), 'out'), K(tm.total, recover));
    return keys;
  };

  ARCH.kick = (c) => {
    const { B, s } = c;
    const tm = times(c);
    const side = c.side || 'r', z = sgn(side);
    const other = side === 'l' ? 'r' : 'l';
    const kind = c.kind || 'front';
    const y = (c.y || LV_Y.m) / s, r = (c.r || 1.0) / s;
    const S = c.base;
    const foot = side === 'l' ? 'lf' : 'rf', knee = side === 'l' ? 'lk' : 'rk';
    const oFoot = other === 'l' ? 'lf' : 'rf', fy = other === 'l' ? 'lfy' : 'rfy';
    const keys = [];
    const support = [-0.02, 0.075, -z * 0.1];
    let ch, hit, mids = [];
    if (kind === 'front' || kind === 'push') {
      ch = mod(S, { '+p': [-0.04, 0.03, 0], cp: -0.05, py: z * -0.25 });
      ch[oFoot] = support; ch[foot] = [0.12, 0.5, z * 0.06]; ch[knee] = [1, 0.4, 0];
      hit = mod(S, { '+p': [-0.02, 0.04, 0], cp: -0.28, py: z * -0.35 });
      hit[oFoot] = support; hit[knee] = [0.3, 1, 0];
      setFoot(hit, B, side, [r, y, 0]);
    } else if (kind === 'side') {
      ch = mod(S, { '+p': [-0.04, 0.02, 0], py: z * -1.4, cy: z * 0.4, cr: -z * 0.25 });
      ch[oFoot] = support; ch[fy] = z * 0.9; ch[foot] = [0.02, 0.62, z * 0.02]; ch[knee] = [0.6, 0.5, z * 0.6];
      hit = mod(S, { '+p': [-0.06, 0.04, 0], py: z * -1.5, cy: z * 0.4, cr: -z * 0.42, cp: -0.08 });
      hit[oFoot] = support; hit[fy] = z * 0.9; hit[knee] = [0, 1, z * 0.2];
      setFoot(hit, B, side, [r, y, 0]);
    } else if (kind === 'round' || kind === 'low' || kind === 'hook') {
      const hy = kind === 'low' ? Math.min(y, 0.42 / s) : y;
      ch = mod(S, { '+p': [0, 0.02, 0], py: S.py - z * 0.5, cr: -z * 0.15 });
      ch[oFoot] = support; ch[foot] = [-0.12, kind === 'low' ? 0.3 : 0.58, z * 0.42]; ch[knee] = [0.4, 0.6, z * 1];
      const midP = mod(S, { '+p': [0, 0.03, 0], py: S.py - z * 1.1, cr: -z * 0.28, cp: -0.05 });
      midP[oFoot] = support; midP[fy] = z * 0.7; midP[knee] = [0.2, 0.7, z * 1];
      setFoot(midP, B, side, [0.45, hy * 0.92, z * 0.62]);
      mids.push(midP);
      hit = mod(S, { '+p': [0, kind === 'low' ? -0.03 : 0.04, 0], py: S.py - z * 1.6, cr: kind === 'low' ? -z * 0.12 : -z * 0.4, cp: kind === 'low' ? 0.12 : -0.12 });
      hit[oFoot] = support; hit[fy] = z * 1.2; hit[knee] = [0, 1, z * 0.6];
      setFoot(hit, B, side, [r, hy, -z * 0.08]);
      if (kind === 'hook') {
        ch = mod(S, { py: S.py + z * 0.4, cr: z * 0.2 });
        ch[oFoot] = support; ch[foot] = [0.1, 0.6, -z * 0.35]; ch[knee] = [0.6, 0.6, -z];
        mids = [];
        hit = mod(S, { '+p': [-0.04, 0.04, 0], py: S.py + z * 0.6, cr: z * 0.35, cp: -0.2 });
        hit[oFoot] = support; hit[knee] = [0, 1, -z * 0.3];
        setFoot(hit, B, side, [r, y, z * 0.25]);
      }
    } else if (kind === 'axe') {
      ch = mod(S, { '+p': [-0.04, 0.04, 0], cp: -0.25 });
      ch[oFoot] = support; ch[knee] = [1, 0.2, 0];
      setFoot(ch, B, side, [0.35, 1.95 / s, z * 0.12]);
      hit = mod(S, { '+p': [0.08, 0, 0], cp: 0.1 });
      hit[oFoot] = support; hit[knee] = [1, 0.3, 0];
      setFoot(hit, B, side, [r, Math.min(y, 1.25 / s), 0]);
    } else if (kind === 'knee') {
      ch = mod(S, { '+p': [0.02, 0.02, 0], cp: 0.1 });
      ch[oFoot] = support; ch[foot] = [-0.05, 0.35, z * 0.1]; ch[knee] = [1, 0.2, 0];
      hit = mod(S, { '+p': [0.14, 0.08, 0], cp: -0.12, py: z * -0.2 });
      hit[oFoot] = [-0.12, 0.075, -z * 0.1]; hit[knee] = [1, 0.6, 0];
      hit[foot] = [0.02, 0.62, z * 0.05];
      if (c.clinch) {
        setHand(hit, B, 'l', [0.45, 1.5 / s, -0.1]); setHand(hit, B, 'r', [0.45, 1.5 / s, 0.1]);
        hit.lo = 1; hit.ro = 1;
      }
    } else if (kind === 'sweep') {
      ch = mod(S, { '+p': [0, -0.4, 0], cp: 0.45, by: -z * 0.4 });
      ch[foot] = [-0.1, 0.12, z * 0.55]; ch[oFoot] = [0.1, 0.075, -z * 0.15]; ch[knee] = [0.5, 1, z];
      setHand(ch, B, other, [0.3, 0.12, -z * 0.25]);
      const midP = mod(S, { '+p': [0, -0.44, 0], cp: 0.5, by: z * 0.3 });
      midP[oFoot] = [0.1, 0.075, -z * 0.15]; midP[knee] = [0, 1, z];
      setFoot(midP, B, side, [0.35, 0.1, z * 0.7]);
      setHand(midP, B, other, [0.3, 0.12, -z * 0.25]);
      mids.push(midP);
      hit = mod(S, { '+p': [0.02, -0.46, 0], cp: 0.5, by: z * 0.9 });
      hit[oFoot] = [0.1, 0.075, -z * 0.15]; hit[knee] = [0, 1, 0];
      setFoot(hit, B, side, [r, 0.12, 0]);
      setHand(hit, B, other, [0.25, 0.12, -z * 0.3]);
    } else if (kind === 'spin') {
      ch = mod(S, { '+p': [0, 0.02, 0], by: -z * 1.6, cp: 0.1 });
      ch[foot] = [-0.05, 0.4, z * 0.1]; ch[knee] = [1, 0.3, 0];
      hit = mod(S, { '+p': [0, 0.04, 0], by: -z * Math.PI, cp: 0.25 });
      hit[oFoot] = [0.05, 0.075, -z * 0.1]; hit[knee] = [0, 1, 0];
      setFoot(hit, B, side, [r, y, 0]);
      const endP = mod(S, { by: -z * Math.PI * 2 });
      keys.push(K(tm.wind, ch), K(tm.st, hit, 'in'), K(tm.hold, hit, 'lin'), K(tm.back, lerpPose(hit, endP, 0.5)), K(tm.total, endP));
      return keys;
    } else if (kind === 'flip') {
      ch = mod(S, { '+p': [0, -0.14, 0], cp: 0.2 });
      ch[knee] = [1, 0.2, 0];
      hit = mod(S, { '+p': [-0.05, 0.5, 0], bp: -1.2 });
      hit[oFoot] = [-0.05, 0.4, -z * 0.1];
      hit[knee] = [0.5, 1, 0];
      setFoot(hit, B, side, [r * 0.75, y, 0]);
      const top = mod(S, { '+p': [-0.2, 0.75, 0], bp: -3.4 });
      top.lf = [0.1, 0.5, -0.1]; top.rf = [0.1, 0.5, 0.1];
      const land = mod(S, { '+p': [-0.3, -0.08, 0], bp: -Math.PI * 2, cp: 0.25 });
      const endP = mod(S, { bp: -Math.PI * 2 });
      keys.push(K(tm.wind, ch), K(tm.st, hit, 'io'), K(tm.hold, hit, 'lin'), K(tm.st + tm.act + tm.rec * 0.35, top), K(tm.st + tm.act + tm.rec * 0.7, land), K(tm.total, endP));
      return keys;
    } else if (kind === 'hop') {
      ch = mod(S, { '+p': [0, -0.12, 0], cp: 0.15 });
      hit = mod(S, { '+p': [0.06, 0.34, 0], cp: -0.25 });
      hit[oFoot] = [0.05, 0.45, -z * 0.12]; hit[knee] = [0.3, 1, 0];
      setFoot(hit, B, side, [r, y, 0]);
      const land = mod(S, { '+p': [0.04, -0.08, 0] });
      keys.push(K(tm.wind, ch), K(tm.st, hit, 'io'), K(tm.hold, hit, 'lin'), K(tm.back, land), K(tm.total, S));
      return keys;
    } else if (kind === 'double') {
      ch = mod(S, { '+p': [0, -0.15, 0], cp: 0.1 });
      hit = mod(S, { '+p': [-0.05, 0.42, 0], cp: -0.35, bp: -0.3 });
      hit[knee] = [0.2, 1, 0]; hit[other === 'l' ? 'lk' : 'rk'] = [0.2, 1, 0];
      setFoot(hit, B, side, [r, y, z * 0.08]);
      setFoot(hit, B, other, [r * 0.85, y + 0.25 / s, -z * 0.08]);
    } else if (kind === 'stomp') {
      ch = mod(S, { '+p': [0.05, 0.04, 0], cp: 0.2 });
      ch[foot] = [0.25, 0.55, z * 0.05]; ch[knee] = [1, 0.5, 0];
      hit = mod(S, { '+p': [0.12, -0.08, 0], cp: 0.35, hp: 0.4 });
      hit[foot] = [r, 0.1, 0]; hit[knee] = [1, 0.5, 0];
    }
    const recover = c.endPose || S;
    keys.push(K(tm.wind, ch));
    mids.forEach((m, i) => keys.push(K(tm.wind + (tm.st - tm.wind) * (i + 1) / (mids.length + 1), m, 'lin')));
    keys.push(K(tm.st, hit, mids.length ? 'lin' : 'in'), K(tm.hold, hit, 'lin'), K(tm.back, lerpPose(hit, recover, 0.5), 'out'), K(tm.total, recover));
    return keys;
  };

  ARCH.body = (c) => {
    const { B, s } = c;
    const tm = times(c);
    const S = c.base;
    const kind = c.kind || 'shoulder';
    const y = (c.y || LV_Y.m) / s, r = (c.r || 0.7) / s;
    let wind, hit;
    if (kind === 'shoulder') {
      wind = mod(S, { '+p': [-0.05, -0.08, 0], py: 1.1, cy: 0.2, cp: 0.3 });
      hit = mod(S, { '+p': [0.22, -0.05, 0], py: 1.3, cy: 0.3, cp: 0.2 });
    } else if (kind === 'headbutt') {
      wind = mod(S, { '+p': [-0.06, 0, 0], cp: -0.3, hp: -0.3 });
      setHand(wind, B, 'l', [0.45, 1.35 / s, -0.15]); setHand(wind, B, 'r', [0.45, 1.35 / s, 0.15]);
      hit = mod(S, { '+p': [0.14, -0.02, 0], cp: 0.45, hp: 0.3 });
      setHand(hit, B, 'l', [0.5, 1.3 / s, -0.15]); setHand(hit, B, 'r', [0.5, 1.3 / s, 0.15]);
    } else if (kind === 'tackle') {
      wind = mod(S, { '+p': [0, -0.2, 0], cp: 0.5 });
      hit = mod(S, { '+p': [0.4, -0.35, 0], cp: 1.0, hp: -0.4, py: 0 });
      setHand(hit, B, 'l', [r, 0.7 / s, -0.2]); setHand(hit, B, 'r', [r, 0.7 / s, 0.2]);
      hit.lf = [-0.1, 0.075, -0.15]; hit.rf = [-0.5, 0.2, 0.15];
    } else if (kind === 'splash') {
      wind = mod(S, { '+p': [0, 0.3, 0], cp: -0.2 });
      hit = mod(S, { p: [0.4, 0.3, 0], bp: 1.45, cp: 0 });
      setHand(hit, B, 'l', [0.9, 0.1, -0.4]); setHand(hit, B, 'r', [0.9, 0.1, 0.4]);
    } else if (kind === 'slide') {
      wind = mod(S, { '+p': [0, -0.2, 0], cp: 0.2 });
      hit = mod(S, { p: [0.1, 0.35, 0], bp: -1.2, cp: 0.4 });
      hit.lf = [r, 0.12, -0.08]; hit.rf = [r * 0.8, 0.25, 0.08];
      hit.lk = [0, 1, 0]; hit.rk = [0, 1, 0];
    } else if (kind === 'hip') {
      wind = mod(S, { '+p': [0, -0.04, 0], py: 1.4, cy: 0.1 });
      hit = mod(S, { '+p': [0.2, -0.1, 0], py: 1.6, cy: 0.15, cr: -0.2 });
    }
    const recover = c.endPose || S;
    return [K(tm.wind, wind), K(tm.st, hit, 'in'), K(tm.hold, hit, 'lin'), K(tm.back, lerpPose(hit, recover, 0.5)), K(tm.total, recover)];
  };

  ARCH.sword = (c) => {
    const { B, s } = c;
    const tm = times(c);
    const S = c.base;
    const kind = c.kind || 'slash';
    const y = (c.y || LV_Y.m) / s, r = (c.r || 1.1) / s;
    let wind, hit;
    if (kind === 'thrust') {
      wind = mod(S, { '+p': [-0.06, -0.02, 0], cy: -0.5, py: 0.8 });
      setHand(wind, B, 'r', [-0.05, 1.1 / s, 0.25]);
      hit = mod(S, { '+p': [0.16, -0.06, 0], cy: -0.1, py: 0.2, cp: 0.2 });
      setHand(hit, B, 'r', [0.62, y, 0.02]);
    } else if (kind === 'low') {
      wind = mod(S, { '+p': [0, -0.22, 0], cy: 0.6, cp: 0.3 });
      setHand(wind, B, 'r', [0.1, 0.9 / s, -0.4]);
      hit = mod(S, { '+p': [0.08, -0.3, 0], cy: -0.8, cp: 0.4 });
      setHand(hit, B, 'r', [0.55, 0.45 / s, 0.35]);
    } else if (kind === 'over') {
      wind = mod(S, { '+p': [-0.04, 0.03, 0], cp: -0.2 });
      setHand(wind, B, 'r', [0.0, 2.0 / s, 0.1]); setHand(wind, B, 'l', [0.0, 1.95 / s, 0.0]);
      hit = mod(S, { '+p': [0.12, -0.12, 0], cp: 0.35 });
      setHand(hit, B, 'r', [0.6, 1.0 / s, 0.05]); setHand(hit, B, 'l', [0.55, 1.0 / s, -0.02]);
    } else {
      wind = mod(S, { cy: 0.7, py: 0.9 });
      setHand(wind, B, 'r', [0.0, y + 0.2 / s, -0.45]);
      hit = mod(S, { cy: -0.9, py: 0.1, '+p': [0.08, -0.02, 0] });
      setHand(hit, B, 'r', [0.55, y, 0.45]);
    }
    const recover = c.endPose || S;
    return [K(tm.wind, wind), K(tm.st, hit, 'in'), K(tm.hold, hit, 'lin'), K(tm.back, lerpPose(hit, recover, 0.5)), K(tm.total, recover)];
  };

  ARCH.pose = (c) => {
    const tm = times(c);
    const S = c.base;
    const P = mod(S, c.mods || {});
    const recover = c.endPose || S;
    return [K(tm.wind, lerpPose(S, P, 0.6)), K(tm.st, P), K(tm.hold, P, 'lin'), K(tm.total, recover)];
  };

  function buildTrack(keys) {
    keys.sort((a, b) => a.f - b.f);
    return keys;
  }

  function evalTrack(keys, f, from) {
    if (!keys.length) return from;
    if (f <= 0 && from) return from;
    let prev = from ? { f: 0, pose: from } : keys[0];
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (f <= k.f) {
        const span = k.f - prev.f;
        const t = span <= 0 ? 1 : clamp((f - prev.f) / span, 0, 1);
        return lerpPose(prev.pose, k.pose, (EASE[k.e] || EASE.io)(t));
      }
      prev = k;
    }
    return keys[keys.length - 1].pose;
  }

  Object.assign(T, { LV_Y, STANCES, stancePose, ARCH, K, mod, setHand, setFoot, unrot, times, buildTrack, evalTrack, guardOf });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
