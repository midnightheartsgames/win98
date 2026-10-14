(function (Z) {
  'use strict';

  const M4 = Z.M4, V = Z.V3;
  const ease = t => t * t * (3 - 2 * t);
  const easeIn = t => t * t;
  const span = (u, a, b) => ease(Z.clamp((u - a) / (b - a), 0, 1));
  const lerp3 = (a, b, t) => [Z.lerp(a[0], b[0], t), Z.lerp(a[1], b[1], t), Z.lerp(a[2], b[2], t)];
  const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

  const qOf = m => {
    const ax = Math.hypot(m[0], m[1], m[2]) || 1, ay = Math.hypot(m[4], m[5], m[6]) || 1, az = Math.hypot(m[8], m[9], m[10]) || 1;
    const m00 = m[0] / ax, m10 = m[1] / ax, m20 = m[2] / ax, m01 = m[4] / ay, m11 = m[5] / ay, m21 = m[6] / ay, m02 = m[8] / az, m12 = m[9] / az, m22 = m[10] / az;
    const tr = m00 + m11 + m22;
    if (tr > 0) { const S = Math.sqrt(tr + 1) * 2; return [(m21 - m12) / S, (m02 - m20) / S, (m10 - m01) / S, 0.25 * S]; }
    if (m00 > m11 && m00 > m22) { const S = Math.sqrt(1 + m00 - m11 - m22) * 2; return [0.25 * S, (m01 + m10) / S, (m02 + m20) / S, (m21 - m12) / S]; }
    if (m11 > m22) { const S = Math.sqrt(1 + m11 - m00 - m22) * 2; return [(m01 + m10) / S, 0.25 * S, (m12 + m21) / S, (m02 - m20) / S]; }
    const S = Math.sqrt(1 + m22 - m00 - m11) * 2;
    return [(m02 + m20) / S, (m12 + m21) / S, 0.25 * S, (m10 - m01) / S];
  };
  const slerp = (a, b, t) => {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3], s = 1;
    if (d < 0) { d = -d; s = -1; }
    let k0, k1;
    if (d > 0.9995) { k0 = 1 - t; k1 = t; } else { const th = Math.acos(d), sn = Math.sin(th); k0 = Math.sin((1 - t) * th) / sn; k1 = Math.sin(t * th) / sn; }
    const q = [a[0] * k0 + b[0] * k1 * s, a[1] * k0 + b[1] * k1 * s, a[2] * k0 + b[2] * k1 * s, a[3] * k0 + b[3] * k1 * s];
    const L = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / L, q[1] / L, q[2] / L, q[3] / L];
  };
  const mOf = (q, p, out = new Float32Array(16)) => {
    const [x, y, z, w] = q, x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
    out[0] = 1 - (yy + zz); out[1] = xy + wz; out[2] = xz - wy; out[3] = 0;
    out[4] = xy - wz; out[5] = 1 - (xx + zz); out[6] = yz + wx; out[7] = 0;
    out[8] = xz + wy; out[9] = yz - wx; out[10] = 1 - (xx + yy); out[11] = 0;
    out[12] = p[0]; out[13] = p[1]; out[14] = p[2]; out[15] = 1;
    return out;
  };
  const blendM = (A, B, t) => {
    if (t <= 0) return A;
    if (t >= 1) return B;
    return mOf(slerp(qOf(A), qOf(B), t), [Z.lerp(A[12], B[12], t), Z.lerp(A[13], B[13], t), Z.lerp(A[14], B[14], t)]);
  };
  const eulerOf = m => [Math.atan2(m[8], m[10]), Math.asin(Z.clamp(-m[9], -1, 1)), Math.atan2(m[1], m[5])];
  const rotAxis = (axis, ang, piv) => {
    const n = V.norm(axis), c = Math.cos(ang), s = Math.sin(ang), t = 1 - c, [x, y, z] = n;
    const R = new Float32Array([t * x * x + c, t * x * y + s * z, t * x * z - s * y, 0, t * x * y - s * z, t * y * y + c, t * y * z + s * x, 0, t * x * z + s * y, t * y * z - s * x, t * z * z + c, 0, 0, 0, 0, 1]);
    if (piv) { const q = M4.dir(R, piv[0], piv[1], piv[2]); R[12] = piv[0] - q[0]; R[13] = piv[1] - q[1]; R[14] = piv[2] - q[2]; }
    return R;
  };
  const trans = (x, y, z) => M4.trs(x, y, z, 0, 0, 0);

  const PG = (c, a, R, sight, x) => Object.assign({ r: { s: 'pg', c, a, R, trig: 1, ro: a > 1 ? 1 : 0 }, sight }, x || {});
  const HOLD = {
    pm: PG([0, 0.012, 0.009], 0.05, 0.018, [0.106, 0.016, 0.107, -0.144, 0.42], { cup: 1, re: 'grip', ins: { model: 'pmag', top: [0, 0.058, 0.01], a: 0.05 }, slide: 0.024, gear: 'hip' }),
    tt: PG([0, 0.014, 0.009], 0.05, 0.018, [0.112, 0.016, 0.113, -0.172, 0.42], { cup: 1, re: 'grip', ins: { model: 'pmag', top: [0, 0.062, 0.01], a: 0.05 }, slide: 0.026, gear: 'hip' }),
    nagan: PG([0, 0.012, 0.026], 0.22, 0.017, [0.106, 0.02, 0.104, -0.21, 0.4], { cup: 1, re: 'gate', gate: [0.016, 0.084, 0.006], gear: 'hip' }),
    molniya: PG([0, 0.022, 0.012], 0.05, 0.018, [0.142, 0.0, 0.142, -0.2, 0.4], { cup: 1, re: 'grip', ins: { model: 'cell', top: [0, 0.04, 0.012], a: 0.05 }, gear: 'hip' }),
    luch: PG([0, 0.018, 0.012], 0.05, 0.018, [0.126, 0.0, 0.126, -0.2, 0.4], { cup: 1, re: 'grip', ins: { model: 'cell', top: [0, 0.035, 0.012], a: 0.05 }, gear: 'hip' }),
    rivet: PG([0, 0.016, -0.004], 0.12, 0.02, [0.15, 0.0, 0.15, -0.25, 0.38], { l: { s: 'fore', c: [0, 0.1, -0.15], R: 0.045 }, re: 'grip', ins: { model: 'cell', top: [0, 0.03, -0.004], a: 0.12 }, gear: 'hip' }),
    obrez: PG([0, 0.03, 0.08], 0.35, 0.019, [0.09, -0.03, 0.088, -0.42, 0.44], { l: { s: 'fore', c: [0, 0.062, -0.15], R: 0.026 }, re: 'break', hinge: [0, 0.05, -0.03], gear: 'hip' }),
    toz: PG([0, 0.05, 0.105], 1.2, 0.023, [0.09, -0.03, 0.087, -0.72, 0.42], { l: { s: 'fore', c: [0, 0.064, -0.24], R: 0.027 }, re: 'break', hinge: [0, 0.05, -0.03], gear: 'back' }),
    mosin: PG([0, 0.045, 0.1], 1.25, 0.02, [0.092, -0.135, 0.095, -0.88, 0.5], { scopeSight: [0.128, 0.06, 0.128, -0.2, 0.12], scope: 'pu', l: { s: 'fore', c: [0, 0.066, -0.26], R: 0.022 }, re: 'clip', clip: [0, 0.142, 0.0], bolt: 'turn', gear: 'back' }),
    sks: PG([0, 0.046, 0.1], 1.24, 0.021, [0.112, -0.17, 0.115, -0.51, 0.5], { l: { s: 'fore', c: [0, 0.07, -0.25], R: 0.024 }, re: 'clip', clip: [0, 0.152, -0.02], gear: 'back' }),
    akm: PG([0, 0.012, -0.006], 0.12, 0.017, [0.123, -0.21, 0.128, -0.548, 0.36], { l: { s: 'fore', c: [0, 0.085, -0.27], R: 0.023 }, re: 'box', mag: { c: [0, -0.02, -0.14], t: [0, 0.94, 0.34], R: 0.016 }, rack: [0.03, 0.094, -0.05], gear: 'back' }),
    ppsh: PG([0, 0.052, 0.05], 1.15, 0.02, [0.106, 0.0, 0.106, -0.51, 0.38], { l: { s: 'fore', c: [0, 0.075, -0.22], R: 0.024 }, re: 'box', mag: { c: [0, 0.012, -0.16], t: [0, 1, 0], R: 0.036 }, gear: 'back' }),
    svd: PG([0, 0.0, 0.06], 0.45, 0.017, [0.138, 0.08, 0.138, -0.17, 0.12], { scope: 'pso', l: { s: 'fore', c: [0, 0.085, -0.28], R: 0.026 }, re: 'box', mag: { c: [0, 0.0, -0.098], t: [0, 1, 0], R: 0.015 }, gear: 'back' }),
    giper: PG([0, 0.004, -0.006], 0.12, 0.017, [0.136, 0.0, 0.132, -0.42, 0.34], { l: { s: 'fore', c: [0, 0.08, -0.26], R: 0.03 }, re: 'grip', ins: { model: 'cell', top: [0, 0.07, -0.15], a: 0 }, gear: 'back' }),
    knife: { r: { s: 'handle', c: [0, 0.012, 0.01], R: 0.0135 }, gear: 'sheath' },
    shovel: { r: { s: 'handle', c: [0, 0, 0.08], R: 0.017 }, gear: 'belt' },
    crowbar: { r: { s: 'handle', c: [0, -0.004, 0.05], R: 0.012 }, gear: 'belt' },
    rebar: { r: { s: 'handle', c: [0, 0, 0.03], R: 0.0105 }, gear: 'belt' },
    axe: { r: { s: 'handle', c: [0, -0.004, 0.06], R: 0.017 }, gear: 'belt' },
    sabre: { r: { s: 'handle', c: [0, -0.001, 0.035], R: 0.015 }, gear: 'scabbard' },
    sledge: { r: { s: 'handle', c: [0, 0, 0.0], R: 0.0195 }, l: { s: 'handle', c: [0, 0, 0.17], R: 0.02 }, gear: 'back' },
    fists: { fist: 1 }, kastet: { fist: 1, worn: 'kastet' }, glove: { fist: 1, worn: 'glove' },
    f1: { r: { s: 'ball', c: [0, 0.047, 0], R: 0.03 } }, rgd: { r: { s: 'ball', c: [0, 0.05, 0], R: 0.027 } },
    molotov: { r: { s: 'ball', c: [0, 0.03, 0], R: 0.035 } }, tnt: { r: { s: 'ball', c: [0, 0.04, 0], R: 0.026 } },
    mine: { r: { s: 'ball', c: [0, 0.012, 0], R: 0.045 } }
  };
  Z.HOLD_DATA = HOLD;
  Z.holdOf = model => HOLD[model] || HOLD.pm;

  const gunFrame = (side, h, k) => {
    if (h.s === 'fore') return Z.graspFrame(side, h.c, [0, 0, -1], [0, 1, 0], h.R, k, -0.006);
    if (h.s === 'handle') return Z.graspFrame(side, h.c, [0, 0, -1], [-side, 0, 0], h.R, k, -0.006);
    const a = h.a || 0, T = h.t || [0, Math.cos(a), -Math.sin(a)];
    return Z.graspFrame(side, h.c, T, h.ro ? V.rot([-side, 0, 0], T, h.ro) : [-side, 0, 0], h.R, k, h.trig ? -0.012 : -0.006);
  };
  const frameCache = new Map();
  Z.wieldFrames = (model, k) => {
    const key = model + '|' + k.toFixed(3);
    let f = frameCache.get(key);
    if (f) return f;
    const H = Z.holdOf(model);
    f = { H, k };
    if (H.r) {
      f.r = gunFrame(1, H.r, k);
      f.rPose = H.r.s === 'ball' ? Z.handWrap(H.r.R, { thumb: 'side' }) : Z.handWrap(H.r.R, { trig: H.r.trig, thumb: H.r.trig && H.cup ? 'fwd' : undefined });
    }
    if (H.cup) {
      const a = H.r.a || 0;
      f.l = Z.graspFrame(-1, add3(H.r.c, [-0.004, -0.012, -0.012]), [0, Math.cos(a), -Math.sin(a)], [1, 0, 0], 0.03, k, -0.006);
      f.lPose = Z.handWrap(0.03, { thumb: 'fwd' });
    } else if (H.l) {
      f.l = gunFrame(-1, H.l, k);
      f.lPose = Z.handWrap(H.l.R, H.l.s === 'fore' ? { thumb: 'side', open: 1 } : {});
    }
    if (H.mag) { f.mag = Z.graspFrame(-1, H.mag.c, V.norm(H.mag.t), [1, 0, 0], H.mag.R, k, -0.004); f.magPose = Z.handWrap(H.mag.R, {}); }
    if (H.ins) {
      const a = H.ins.a, ax = [0, Math.cos(a), -Math.sin(a)];
      const c = add3(H.ins.top, ax, -0.06);
      f.ins = Z.graspFrame(-1, c, ax, [1, 0, 0], 0.011, k, 0.004);
      f.insAxis = ax;
      f.insPose = Z.handWrap(0.012, { thumb: 'side' });
    }
    frameCache.set(key, f);
    return f;
  };

  const frameT = (G, f) => {
    const D = V.norm(M4.dir(G, f.D[0], f.D[1], f.D[2])), P0 = M4.dir(G, f.P[0], f.P[1], f.P[2]);
    const d = V.dot(P0, D), P = V.norm([P0[0] - D[0] * d, P0[1] - D[1] * d, P0[2] - D[2] * d]);
    return Z.handBasis(f.side, D, P, M4.transform(G, f.wrist[0], f.wrist[1], f.wrist[2]), f.k);
  };
  const frameMix = (a, b, t) => {
    if (t <= 0) return a;
    if (t >= 1) return b;
    const D = V.norm(lerp3(a.D, b.D, t)), P0 = lerp3(a.P, b.P, t), d = V.dot(P0, D);
    let P = [P0[0] - D[0] * d, P0[1] - D[1] * d, P0[2] - D[2] * d];
    if (Math.hypot(P[0], P[1], P[2]) < 1e-3) P = b.P;
    return Z.handBasis(a.side, D, V.norm(P), lerp3(a.wrist, b.wrist, t), a.k);
  };
  const frameShift = (f, v) => Z.handBasis(f.side, f.D, f.P, add3(f.wrist, v), f.k);

  const adsPose = (d, H) => {
    const s = (d.scope && H.scopeSight) || H.sight || [0.11, 0, 0.11, -0.3, 0.3];
    const el = Math.atan2(s[2] - s[0], s[1] - s[3]);
    const q = M4.dir(M4.trs(0, 0, 0, 0, -el, 0), 0, s[0], s[1]);
    return [[-q[0], -q[1], -s[4] - q[2]], [0, -el, 0]];
  };

  const holdKindOf = d => Z.holdKind(d && d.cat === 'weapon' ? d : null);
  Z.wieldKind = holdKindOf;

  const tilt = (u, a, b, c, d) => span(u, a, b) - span(u, c, d);

  const R_BOX = (u, F, H) => {
    const k = tilt(u, 0, 0.12, 0.86, 1);
    const pull = span(u, 0.2, 0.34), out = span(u, 0.34, 0.5), back2 = span(u, 0.58, 0.7), ins = span(u, 0.7, 0.77);
    const ax = V.norm(H.mag.t), magOff = u < 0.34 ? -0.06 * pull : u < 0.7 ? -0.06 : -0.06 * (1 - ins);
    const magF = frameShift(F.mag, [ax[0] * magOff, ax[1] * magOff, ax[2] * magOff]);
    let lh, pose = F.magPose;
    if (u < 0.1) { lh = { g: F.l }; pose = F.lPose; }
    else if (u < 0.2) { const t = span(u, 0.1, 0.2); lh = { g: F.l, g2: F.mag, t }; pose = Z.handBlend(F.lPose, F.magPose, t); }
    else if (u < 0.34) lh = { g: magF };
    else if (u < 0.58) lh = { g: magF, away: 1, t: u < 0.5 ? out : 1 };
    else if (u < 0.7) lh = { g: magF, away: 1, t: 1 - back2 };
    else if (u < 0.8) lh = { g: magF };
    else if (H.rack && u < 0.9) {
      const rk = Z.graspFrame(-1, H.rack, [0, 0, 1], [0, -1, 0], 0.01, F.k, 0);
      const pullb = span(u, 0.84, 0.87) - span(u, 0.87, 0.89);
      lh = { g: magF, g2: frameShift(rk, [0, 0, 0.06 * pullb]), t: span(u, 0.8, 0.84) };
      pose = Z.handBlend(F.magPose, Z.HAND_POSES.pinch, span(u, 0.8, 0.84));
    } else { const t = span(u, H.rack ? 0.9 : 0.8, 1); lh = { g: H.rack ? Z.graspFrame(-1, H.rack, [0, 0, 1], [0, -1, 0], 0.01, F.k, 0) : magF, g2: F.l, t }; pose = Z.handBlend(H.rack ? Z.HAND_POSES.pinch : F.magPose, F.lPose, t); }
    const parts = {};
    if (u >= 0.2 && u < 0.34 || u >= 0.7 && u < 0.77) parts.mag = trans(ax[0] * magOff, ax[1] * magOff, ax[2] * magOff);
    else if (u >= 0.34 && u < 0.7) parts.mag = { hand: 'l', grab: F.mag };
    if (H.rack) { const b = span(u, 0.84, 0.87) - span(u, 0.87, 0.89); if (b > 0) parts.bolt = trans(0, 0, 0.06 * b); }
    return { dp: [-0.07 * k, 0.07 * k, 0.03 * k], dr: [0.3 * k, 0.22 * k, -0.7 * k], lh, lPose: pose, parts };
  };

  const R_GRIP = (u, F, H) => {
    const k = tilt(u, 0, 0.12, 0.86, 1), ax = F.insAxis, lift = H.l ? 0 : 1;
    const drop = Z.clamp((u - 0.1) / 0.22, 0, 1), dropD = 0.2 * drop * drop + 0.03 * drop;
    const ins = span(u, 0.6, 0.7), gone = span(u, 0.08, 0.3), comeback = span(u, 0.36, 0.56);
    const insOff = -0.095 * (1 - ins) - (u < 0.36 ? 0.1 : 0);
    const insF = frameShift(F.ins, [ax[0] * insOff, ax[1] * insOff, ax[2] * insOff]);
    let lh, pose = F.insPose;
    if (u < 0.36) { lh = { g: F.l, away: 1, t: gone }; pose = Z.handBlend(F.lPose, Z.HAND_POSES.relax, gone); }
    else if (u < 0.56) { lh = { g: insF, away: 1, t: 1 - comeback }; }
    else if (u < 0.72) { lh = { g: insF }; pose = Z.handBlend(F.insPose, Z.HAND_POSES.flat, span(u, 0.64, 0.7)); }
    else { const t = span(u, 0.74, 0.96); lh = { g: insF, g2: F.l, t }; pose = Z.handBlend(Z.HAND_POSES.flat, F.lPose, t); }
    const extras = [];
    if (u > 0.1 && u < 0.4) extras.push({ model: H.ins.model, M: M4.mul(trans(0, H.ins.top[1] - dropD, H.ins.top[2] + 0.02 * drop), M4.trs(0, 0, 0, 0, 0, drop * 0.6)) });
    if (u >= 0.36 && u < 0.7) extras.push({ model: H.ins.model, hand: 'l', grab: F.ins, M: M4.trs(H.ins.top[0], H.ins.top[1], H.ins.top[2], 0, -H.ins.a, 0) });
    const parts = {};
    if (H.slide) { const s = span(u, 0.76, 0.8) - span(u, 0.8, 0.82); if (s > 0) parts.slide = trans(0, 0, H.slide * s); }
    return { dp: [-0.07 * k, 0.06 * k * lift + 0.02 * k, 0.03 * k], dr: [0.25 * k, 0.3 * k, -0.6 * k], lh, lPose: pose, extras, parts };
  };

  const R_BREAK = (u, F, H) => {
    const k = tilt(u, 0, 0.1, 0.9, 1), open = span(u, 0.04, 0.16) - span(u, 0.78, 0.86);
    const bar = rotAxis([1, 0, 0], -0.7 * open, H.hinge);
    const parts = { barrel: bar };
    const extras = [];
    const breech = x => M4.mul(bar, trans(x, 0.072, -0.042));
    if (u > 0.14 && u < 0.36) { const e = (u - 0.14) / 0.22; for (const x of [-0.0135, 0.0135]) extras.push({ model: 'shell', M: M4.mul(M4.mul(breech(x), trans(x * 2, 0.25 * e - 0.4 * e * e, 0.3 * e)), M4.trs(0, 0, 0, 0, e * 5, 0)) }); }
    const ins = span(u, 0.56, 0.66);
    const lfore = frameT(bar, F.l);
    const shellF = Z.graspFrame(-1, [0, 0.08, 0.06], [0, 0, -1], [0, -1, 0], 0.012, F.k, 0.006);
    let lh, pose = F.lPose;
    if (u < 0.22) lh = { g: lfore };
    else if (u < 0.36) { lh = { g: lfore, away: 1, t: span(u, 0.22, 0.36) }; pose = Z.handBlend(F.lPose, Z.HAND_POSES.relax, span(u, 0.22, 0.36)); }
    else if (u < 0.54) { lh = { g: frameShift(frameT(bar, shellF), [0, 0, 0.05]), away: 1, t: 1 - span(u, 0.4, 0.54) }; pose = Z.HAND_POSES.pinch; }
    else if (u < 0.68) { lh = { g: frameShift(frameT(bar, shellF), [0, 0, 0.05 * (1 - ins)]) }; pose = Z.HAND_POSES.pinch; }
    else { const t = span(u, 0.68, 0.78); lh = { g: frameT(bar, shellF), g2: lfore, t }; pose = Z.handBlend(Z.HAND_POSES.pinch, F.lPose, t); }
    if (u >= 0.36 && u < 0.68) {
      const back2 = 0.06 * (1 - ins);
      for (const x of [-0.0135, 0.0135]) extras.push({ model: 'shell', hand: u < 0.54 ? 'l' : null, grab: u < 0.54 ? frameT(bar, shellF) : null, M: M4.mul(breech(x), trans(0, 0, back2)) });
    }
    return { dp: [-0.09 * k, 0.04 * k, -0.08 * k], dr: [0.32 * k, -0.25 * open + 0.05 * k, -0.25 * k], lh, lPose: pose, parts, extras };
  };

  const R_GATE = (u, F, H, st) => {
    const n = Math.max(1, Math.min(7, st.rounds || 7));
    const k = tilt(u, 0, 0.1, 0.9, 1);
    const gD = V.norm([-0.5, 0.1, -0.86]), gP = V.norm([0.1, -1, -0.05]);
    const gateF = basis(-1, gD, gP, add3(add3(H.gate, gD, -0.078 * F.k), gP, -0.022 * F.k), F.k);
    const c = Z.clamp((u - 0.12) / 0.74, 0, 1) * n, i = Math.min(n - 1, Math.floor(c)), f = c - i;
    const inCyc = u > 0.12 && u < 0.86;
    let lh, pose = Z.HAND_POSES.pinch;
    const extras = [];
    if (!inCyc) { const t = u <= 0.12 ? span(u, 0, 0.12) : 1 - span(u, 0.86, 1); lh = { g: F.l, g2: frameShift(gateF, [0.02, -0.04, 0.05]), t }; pose = Z.handBlend(F.lPose, Z.HAND_POSES.pinch, t); }
    else {
      const away = f < 0.4 ? span(f, 0, 0.4) : 1 - span(f, 0.4, 0.75);
      const push = span(f, 0.75, 0.95);
      lh = { g: frameShift(gateF, [0.02 * (1 - push), -0.04 * (1 - push), 0.05 * (1 - push)]), away: 1, t: away * 0.85 };
      if (f > 0.35 && f < 0.95) extras.push({ model: 'round', hand: 'l', grab: gateF, M: trans(H.gate[0] - 0.012, H.gate[1] - 0.004, H.gate[2] - 0.004) });
    }
    const turn = (i + span(f, 0.95, 1)) * Math.PI * 2 / 7;
    return { dp: [-0.1 * k, 0.07 * k, 0.0], dr: [0.35 * k, 0.3 * k, 1.1 * k], lh, lPose: pose, parts: { cyl: inCyc ? rotAxis([0, 0, 1], turn, [0, 0.077, 0]) : null }, extras };
  };

  const R_CLIP = (u, F, H) => {
    const k = tilt(u, 0, 0.12, 0.88, 1);
    const turn = H.bolt === 'turn';
    const boltA = turn ? span(u, 0.1, 0.17) - span(u, 0.82, 0.88) : 0, boltB = span(u, 0.17, 0.24) - span(u, 0.76, 0.82);
    const boltM = turn ? M4.mul(trans(0, 0, 0.075 * boltB), rotAxis([0, 0, 1], 1.15 * boltA, [0, 0.072, 0])) : trans(0, 0, 0.06 * boltB);
    const knob = M4.transform(boltM, 0.074, 0.058, 0.024);
    const knobF = Z.graspFrame(1, knob, [0, 0, -1], [-0.3, -1, 0].map(v => v / Math.hypot(0.3, 1)), 0.01, F.k, 0.012);
    const push = span(u, 0.52, 0.6) * 0.6 + span(u, 0.62, 0.7) * 0.4;
    const clipAt = add3(H.clip, [0, -0.052 * push, 0]);
    const clipF = Z.graspFrame(1, add3(H.clip, [0.004, 0.012, 0.03]), [0, 0, -1], [0, -1, 0], 0.012, F.k, 0.014);
    let rh, pose = Z.HAND_POSES.pinch;
    if (u < 0.1) { rh = { g: F.r, g2: knobF, t: span(u, 0.02, 0.1) }; pose = Z.handBlend(F.rPose, Z.HAND_POSES.pinch, span(u, 0.02, 0.1)); }
    else if (u < 0.26) rh = { g: knobF };
    else if (u < 0.4) rh = { g: knobF, away: 1, t: span(u, 0.26, 0.4) };
    else if (u < 0.5) rh = { g: frameShift(clipF, [0, 0.04, 0]), away: 1, t: 1 - span(u, 0.4, 0.5) };
    else if (u < 0.7) rh = { g: frameShift(clipF, [0, -0.04 * push, 0]) };
    else if (u < 0.76) rh = { g: frameShift(clipF, [0, -0.03, 0]), g2: knobF, t: span(u, 0.7, 0.76) };
    else if (u < 0.88) rh = { g: knobF };
    else { const t = span(u, 0.88, 0.98); rh = { g: knobF, g2: F.r, t }; pose = Z.handBlend(Z.HAND_POSES.pinch, F.rPose, t); }
    const extras = [];
    if (u > 0.44 && u < 0.7) extras.push({ model: 'clip', M: trans(clipAt[0], clipAt[1] + (u < 0.5 ? 0.04 * (1 - span(u, 0.44, 0.5)) : 0), clipAt[2]) });
    if (u >= 0.7 && u < 0.8) { const e = (u - 0.7) / 0.1; extras.push({ model: 'clip', M: M4.mul(trans(0.1 * e, H.clip[1] - 0.052 + 0.12 * e - 0.2 * e * e, H.clip[2]), M4.trs(0, 0, 0, 0, 0, -e * 4)) }); }
    return { dp: [-0.05 * k, 0.03 * k, 0.03 * k], dr: [0.12 * k, 0.1 * k, 0.45 * k], rh, rPose: pose, parts: { bolt: boltA > 0 || boltB > 0 ? boltM : null }, extras };
  };

  const RELOADS = { box: R_BOX, grip: R_GRIP, break: R_BREAK, gate: R_GATE, clip: R_CLIP };

  Z.wieldAction = (F, st) => {
    const H = F.H;
    if (st.reload > 0 && H.re && RELOADS[H.re]) return RELOADS[H.re](st.reload, F, H, st);
    const out = { dp: [0, 0, 0], dr: [0, 0, 0], parts: {} };
    if (H.bolt === 'turn' && st.cycle > 0 && st.cycle < 1) {
      const u = st.cycle, up = span(u, 0.12, 0.26) - span(u, 0.68, 0.8), bk = span(u, 0.26, 0.42) - span(u, 0.5, 0.66);
      const boltM = M4.mul(trans(0, 0, 0.075 * bk), rotAxis([0, 0, 1], 1.15 * up, [0, 0.072, 0]));
      const knob = M4.transform(boltM, 0.074, 0.058, 0.024);
      const knobF = Z.graspFrame(1, knob, [0, 0, -1], [-0.3, -1, 0].map(v => v / Math.hypot(0.3, 1)), 0.01, F.k, 0.012);
      const t = span(u, 0.0, 0.12) - span(u, 0.8, 0.95);
      out.rh = { g: F.r, g2: knobF, t };
      out.rPose = Z.handBlend(F.rPose, Z.HAND_POSES.pinch, t);
      out.parts.bolt = boltM;
      const k = Math.sin(Z.clamp(u, 0, 1) * Math.PI);
      out.dr = [0.06 * k, 0.05 * k, 0.25 * k];
    }
    if (H.slide) {
      const s = st.empty ? 1 : Z.clamp(st.kick * 1.6, 0, 1);
      if (s > 0) out.parts.slide = trans(0, 0, H.slide * s);
    }
    if (H.rack && st.kick > 0) out.parts.bolt = trans(0, 0, 0.055 * Z.clamp(st.kick * 1.4, 0, 1));
    return out;
  };

  const SWINGS = {
    fore: [[0, [0, 0, 0], [0, 0, 0]], [0.3, [0.06, 0.2, 0.14], [0.45, 0.7, 0.55]], [0.5, [-0.26, -0.12, -0.2], [-0.85, -0.55, -0.35]], [0.66, [-0.34, -0.2, -0.08], [-1.1, -0.75, -0.45]], [1, [0, 0, 0], [0, 0, 0]]],
    backh: [[0, [0, 0, 0], [0, 0, 0]], [0.3, [-0.22, 0.12, 0.1], [-0.7, 0.55, -0.6]], [0.5, [0.12, -0.08, -0.22], [0.75, -0.45, 0.35]], [0.66, [0.18, -0.16, -0.1], [0.95, -0.7, 0.45]], [1, [0, 0, 0], [0, 0, 0]]],
    over: [[0, [0, 0, 0], [0, 0, 0]], [0.32, [-0.04, 0.22, 0.14], [-0.3, 1.0, -0.1]], [0.52, [-0.06, -0.1, -0.22], [-0.35, -0.45, -0.1]], [0.7, [-0.05, -0.14, -0.12], [-0.3, -0.55, -0.05]], [1, [0, 0, 0], [0, 0, 0]]]
  };
  const keyAt = (keys, u) => {
    let i = 0;
    while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1], t = ease(Z.clamp((u - a[0]) / (b[0] - a[0]), 0, 1));
    return [lerp3(a[1], b[1], t), lerp3(a[2], b[2], t)];
  };
  Z.wieldSwing = (d, st) => {
    const u = Z.clamp(1 - st.swing, 0, 1);
    const keys = d && d.twoHand ? SWINGS.over : st.punchSide ? SWINGS.backh : SWINGS.fore;
    return keyAt(keys, u);
  };
  Z.wieldPunch = st => {
    const u = Z.clamp(1 - st.swing, 0, 1);
    const ext = u < 0.24 ? ease(u / 0.24) : 1 - ease(Z.clamp((u - 0.3) / 0.45, 0, 1));
    return { side: st.punchSide ? -1 : 1, ext };
  };
  Z.wieldThrow = st => {
    const u = Z.clamp(1 - st.throwT, 0, 1);
    return keyAt([[0, [0, 0, 0], [0, 0, 0]], [0.42, [0.06, 0.24, 0.26], [0.1, 0.9, 0.3]], [0.62, [-0.04, 0.16, -0.36], [-0.05, -0.3, 0]], [0.8, [-0.06, -0.12, -0.3], [0, -0.7, 0]], [1, [0, 0, 0], [0, 0, 0]]], u).concat([u]);
  };

  Z.wieldDrawOffset = (kind, k, dir) => {
    const t = Z.clamp(k, 0, 1), e = dir > 0 ? 1 - (1 - t) * (1 - t) + 0.07 * Math.sin(Math.PI * t) * t : easeIn(t), q = 1 - e;
    const T = {
      rifle: [[0.12, -0.42, 0.12], [0.5, -0.7, 1.0]], pistol: [[0.06, -0.4, 0.15], [0.2, -1.2, -0.3]],
      melee: [[0.12, -0.45, 0.25], [-0.3, 1.0, 0.4]], unarmed: [[0, -0.42, 0.15], [0, -0.6, 0]], throw: [[0.04, -0.42, 0.1], [0, -0.5, 0]]
    }[kind] || [[0, -0.4, 0.1], [0, -0.6, 0]];
    return [[T[0][0] * q, T[0][1] * q, T[0][2] * q], [T[1][0] * q, T[1][1] * q, T[1][2] * q]];
  };

  const RIG1 = new Z.RigDef([{ name: 'root', pos: [0, 0, 0] }]);
  const basis = (side, D, Ph, wrist, k = 1) => {
    const Dn = V.norm(D), d = V.dot(Ph, Dn);
    return Z.handBasis(side, Dn, V.norm([Ph[0] - Dn[0] * d, Ph[1] - Dn[1] * d, Ph[2] - Dn[2] * d]), wrist, k);
  };
  const resolveHand = (spec, G, away) => {
    let f = frameT(G, spec.g);
    if (spec.g2) f = frameMix(f, frameT(G, spec.g2), spec.t);
    if (spec.away && away) f = frameMix(f, away, spec.t);
    return f;
  };
  const attachM = (handF, grab, M) => {
    const inv = M4.invert(grab.M);
    const A = M4.mul(handF.M, inv);
    return M ? M4.mul(A, M) : A;
  };

  const WORN = {
    kastet: new Float32Array([0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, -0.025, -0.058, 0, 1]),
    glove: new Float32Array([0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0.004, -0.05, 0, 1])
  };

  const FP = {
    rifle: { c: [0.15, -0.185, -0.36], r: [-0.04, 0.03, 0] },
    pistol: { c: [0.15, -0.165, -0.44], r: [-0.05, 0.04, 0] },
    melee: { c: [0.21, -0.2, -0.44], r: [-0.35, 0.5, 0.22] },
    melee2: { c: [0.15, -0.23, -0.4], r: [0.55, 0.45, 0.3] },
    throw: { c: [0.18, -0.16, -0.42], r: [0, 0.1, 0] }
  };
  const FP_SH = { 1: [0.21, -0.3, 0.12], '-1': [-0.21, -0.32, 0.1] };
  const FP_POLE = { 1: [0.5, -0.75, 0.35], '-1': [-0.5, -0.75, 0.3] };
  const fpAway = side => basis(side, [-side * 0.15, 0.9, -0.35], [-side, 0, 0], [side * 0.16, -0.62, -0.26]);

  const skinPaint = (mb, mat, tint, face) => {
    if (face === undefined) { Z.MODEL_KIT.paint(mb, mat, tint); return undefined; }
    mb.setMat(Z.FACE_BASE + face, 0, 0); mb.setTint(128, 128, 128, 255);
    return (v0, v1) => { for (let i = v0; i < v1; i++) { mb.uv[i * 2] = Z.SKIN_UV[0]; mb.uv[i * 2 + 1] = Z.SKIN_UV[1]; } };
  };
  const fpHands = new Map();
  const fpHand = (side, pose, mat, tint, face) => {
    const key = side + '|' + pose.key + '|' + mat + '|' + tint.join(',') + '|' + face;
    let mb = fpHands.get(key);
    if (mb) return mb;
    mb = new Z.SkinBuilder(RIG1);
    const post = skinPaint(mb, mat, tint, face);
    Z.buildHand(mb, { side, pose, sides: 8, post, shade: mb.tint.slice(0, 3) });
    if (fpHands.size > 500) fpHands.clear();
    fpHands.set(key, mb);
    return mb;
  };

  const appendMesh = (mb, src, M) => {
    const s0 = mb.n;
    mb.append(src);
    mb.transformFrom(s0, M);
  };

  const appendGun = (mb, gm, W, partsCam) => {
    const s0 = mb.n;
    mb.append(gm);
    const cuts = [];
    if (gm.parts) for (const name in partsCam) { const r = gm.parts[name]; if (r && partsCam[name]) cuts.push([s0 + r[0], s0 + r[1], partsCam[name]]); }
    cuts.sort((a, b) => a[0] - b[0]);
    let at = s0;
    for (const [a, b, M] of cuts) { if (a > at) mb.transformFrom(at, W, a); mb.transformFrom(a, M, b); at = b; }
    if (at < mb.n) mb.transformFrom(at, W, mb.n);
  };

  class ViewModel {
    constructor(scene) {
      this.scene = scene;
      this.r = scene.r;
      const gl = this.r.gl;
      this.vao = gl.createVertexArray();
      this.vb = gl.createBuffer();
      this.ib = gl.createBuffer();
      this.cap = 96 * 1024 * 4;
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vb);
      gl.bufferData(gl.ARRAY_BUFFER, this.cap, gl.DYNAMIC_DRAW);
      const S = Z.MeshBuilder.STRIDE;
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.BYTE, true, S, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, S, 16);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, S, 24);
      gl.enableVertexAttribArray(4); gl.vertexAttribIPointer(4, 4, gl.UNSIGNED_BYTE, S, 28);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib);
      gl.bindVertexArray(null);
      this.proj = new Float32Array(16);
      this.vp = new Float32Array(16);
      this.st = { bob: 0, swayX: 0, swayY: 0, kick: 0, ads: 0, run: 0, air: 0, land: 0, breath: 0, ground: true, vy: 0 };
    }

    build(state) {
      const mb = new Z.MeshBuilder(), st = this.st;
      const d = Z.item(state.wid) || Z.item('fists'), model = d.model || state.wid, kind = holdKindOf(d);
      const F = Z.wieldFrames(model, 1), H = F.H, gun = kind === 'rifle' || kind === 'pistol';
      const ads = gun ? ease(st.ads) : 0, run = ease(st.run);
      let pos = [0, 0, 0], rot = [0, 0, 0];
      if (!H.fist) {
        const T = kind === 'melee' ? (d.twoHand ? FP.melee2 : FP.melee) : FP[kind] || FP.pistol;
        const R = M4.trs(0, 0, 0, T.r[0], T.r[1], T.r[2]), c = M4.dir(R, H.r.c[0], H.r.c[1], H.r.c[2]);
        pos = [T.c[0] - c[0], T.c[1] - c[1], T.c[2] - c[2]];
        rot = T.r.slice();
        if (ads > 0) { const A = adsPose(d, H); pos = lerp3(pos, A[0], ads); rot = lerp3(rot, A[1], ads); }
      }
      const mv = state.move * (1 - ads * 0.8);
      const br = Math.sin(st.breath * 1.7) * 0.0025 * (1 - ads * 0.7);
      let dp = [Math.sin(st.bob) * 0.011 * mv * (1 + run) + st.swayX * 0.6, -Math.abs(Math.cos(st.bob)) * 0.012 * mv * (1 + run * 1.3) + br + st.swayY * 0.6 + st.air - st.land * 0.05, 0];
      let dr = [0, -st.land * 0.07, Math.sin(st.bob) * 0.02 * mv];
      if (run > 0) {
        const RP = kind === 'rifle' ? [[0.008, -0.012, 0.012], [0.07, -0.05, 0.08]] : kind === 'pistol' ? [[0.0, -0.015, 0.01], [0.02, -0.08, 0.02]] : [[0.005, -0.012, 0.01], [0.03, -0.05, 0]];
        dp = add3(dp, RP[0], run); dr = add3(dr, RP[1], run);
      }
      if (gun) { dp[2] += st.kick * (kind === 'rifle' ? 0.05 : 0.04); dp[1] += st.kick * 0.008; dr[1] += st.kick * (kind === 'pistol' ? 0.28 : 0.1); }
      const dd = Z.wieldDrawOffset(kind, state.k, state.dir);
      dp = add3(dp, dd[0]); dr = add3(dr, dd[1]);
      const act = H.fist ? null : Z.wieldAction(F, Object.assign({}, state, { kick: st.kick }));
      if (act) { dp = add3(dp, act.dp); dr = add3(dr, act.dr); }
      if (state.swing > 0 && kind === 'melee') { const s = Z.wieldSwing(d, state); dp = add3(dp, s[0]); dr = add3(dr, s[1]); }
      let throwU = -1;
      if (state.throwT > 0 && kind === 'throw') { const s = Z.wieldThrow(state); dp = add3(dp, s[0]); dr = add3(dr, s[1]); throwU = s[2]; }
      const qu = state.quick ? state.quick.u : -1;
      if (qu >= 0) { const dip = Math.sin(qu * Math.PI); dp = add3(dp, [0.03, -0.1, 0.05], dip); dr = add3(dr, [0.15, -0.35, 0.25], dip); }
      const W = M4.trs(pos[0] + dp[0], pos[1] + dp[1], pos[2] + dp[2], rot[0] + dr[0], rot[1] + dr[1], rot[2] + dr[2]);

      let rF, rPose, lF = null, lPose = null;
      if (H.fist) {
        const pu = state.swing > 0 ? Z.wieldPunch(state) : { side: 1, ext: 0 };
        const fist = (side, c) => {
          const e = pu.side === side ? pu.ext : 0;
          const t = add3(add3(c, dp), [-side * 0.09 * e, 0.05 * e, -0.3 * e]);
          const D = V.norm([-side * (0.12 + 0.2 * e), 0.28 - 0.1 * e, -1]);
          return basis(side, D, [-side, 0.15, 0], add3(t, D, -0.085));
        };
        rF = fist(1, [0.13, -0.14, -0.38]); lF = fist(-1, [-0.15, -0.155, -0.42]);
        rPose = lPose = Z.HAND_POSES.fist;
      } else {
        const awayL = fpAway(-1), awayR = fpAway(1);
        rF = frameT(W, F.r); rPose = F.rPose;
        if (act && act.rh) { rF = resolveHand(act.rh, W, awayR); rPose = act.rPose || rPose; }
        if (F.l) { lF = frameT(W, F.l); lPose = F.lPose; }
        if (act && act.lh) { lF = resolveHand(act.lh, W, awayL); lPose = act.lPose || lPose; }
        if (lF) { const join = span(state.k, 0.55, 1); if (join < 1) { lF = frameMix(awayL, lF, join); lPose = Z.handBlend(Z.HAND_POSES.relax, lPose, join); } }
        if (throwU > 0.6) rPose = Z.handBlend(rPose, Z.HAND_POSES.open, span(throwU, 0.6, 0.7));
      }

      let quickM = null;
      if (qu >= 0) {
        const QK = [[0, [-0.16, -0.62, -0.26], [0.1, 0.9, -0.3], [0.3, 0, -0.9]], [0.36, [-0.3, -0.04, -0.2], [0.1, 0.75, -0.65], [0.2, 0.2, -0.95]], [0.6, [-0.08, -0.02, -0.56], [0.15, 0.3, -1], [0, -1, -0.2]], [0.78, [-0.04, -0.3, -0.46], [0.1, -0.2, -1], [0, -1, 0.2]], [1, [-0.16, -0.62, -0.3], [0.1, 0.9, -0.3], [0.3, 0, -0.9]]];
        let i = 0;
        while (i < QK.length - 2 && qu > QK[i + 1][0]) i++;
        const a0 = QK[i], a1 = QK[i + 1], t = ease(Z.clamp((qu - a0[0]) / (a1[0] - a0[0]), 0, 1));
        lF = basis(-1, lerp3(a0[2], a1[2], t), lerp3(a0[3], a1[3], t), lerp3(a0[1], a1[1], t));
        const QH = Z.holdOf(state.quick.model);
        lPose = qu < 0.6 ? Z.handWrap(QH.r ? QH.r.R : 0.03, { thumb: 'side' }) : Z.handBlend(Z.handWrap(QH.r ? QH.r.R : 0.03, { thumb: 'side' }), Z.HAND_POSES.open, span(qu, 0.6, 0.7));
        if (qu < 0.6 && QH.r) quickM = attachM(lF, gunFrame(-1, QH.r, 1));
      }
      if (quickM) appendMesh(mb, Z.gunMesh(state.quick.model, {}), quickM);
      if (!H.fist && !(kind === 'throw' && throwU > 0.63)) {
        const partsCam = {};
        if (act) for (const name in act.parts) {
          const p = act.parts[name];
          if (!p) continue;
          partsCam[name] = p.hand ? attachM(p.hand === 'l' ? lF : rF, p.grab) : M4.mul(W, p);
        }
        appendGun(mb, Z.gunMesh(model, d), W, partsCam);
        if (act) for (const e of act.extras || []) {
          const M = e.hand ? attachM(e.hand === 'l' ? lF : rF, e.grab, e.M) : M4.mul(W, e.M);
          appendMesh(mb, Z.gunMesh(e.model, {}), M);
        }
      }
      if (H.worn) appendMesh(mb, Z.gunMesh(H.worn, {}), M4.mul(rF.M, WORN[H.worn]));

      const L = state.look || {}, O = (Z.OUTFITS && Z.OUTFITS[L.top]) || Z.OUTFITS.shirt;
      const sleeveCol = O.raw ? [200, 200, 200] : (L.topCol || [70, 72, 76]), sleeveMat = O.mat || 'cloth';
      const fit = Math.min(0.03, O.fit || 0), skin = L.skin || [210, 170, 140];
      const handMat = O.gloves ? (O.armor ? 'robotPaint' : 'rubber') : 'skin', handCol = O.gloves || skin;
      const face = !O.gloves && !L.gasmask && this.scene.faceLayer ? this.scene.faceLayer(L) : undefined;
      const short = O.sleeve === 'short' || O.sleeve === 'rolled' || O.sleeve === 'torn';
      const kit = new Z.SkinBuilder(RIG1), K = Z.MODEL_KIT;
      const arm = (side, hf, pose) => {
        const sh = FP_SH[side], w = hf.wrist;
        const dist = Math.hypot(w[0] - sh[0], w[1] - sh[1], w[2] - sh[2]), Ln = Math.max(0.6, dist * 1.04);
        const b = [sh[0], sh[1] - Ln * 0.52, sh[2]], c = [sh[0], b[1] - Ln * 0.48, sh[2]];
        const pole = add3(sh, FP_POLE[side]);
        const ik = Z.solveIK2(sh, b, c, w, pole), e = ik.elbow;
        const at = t => lerp3(e, w, t);
        const cuff = short ? at(O.sleeve === 'rolled' ? 0.35 : 0.08) : at(0.8);
        K.paint(kit, sleeveMat, sleeveCol);
        K.tubeAlong(kit, [sh, lerp3(sh, e, 0.5), e, cuff], [0.058 + fit, 0.054 + fit, 0.048 + fit, (short ? 0.046 : 0.04) + fit * 0.8], { b: 'root', sides: 12, capB: false, loft: { uvU: 5, uvV: O.raw || O.mat === 'quilt' ? (O.uvV || 2) : 5 } });
        if (O.cuffs || O.sleeve === 'rolled') K.tubeAlong(kit, [at(short ? 0.3 : 0.74), cuff], [0.045 + fit, 0.044 + fit], { b: 'root', sides: 12, capB: false });
        const post = skinPaint(kit, handMat, handCol, face);
        K.tubeAlong(kit, [at(short ? 0.0 : 0.76), at(0.9), w, add3(w, hf.D, 0.012)], [short ? 0.037 : 0.031, 0.027, 0.0235, 0.02], { b: 'root', sides: 10, capB: false, post });
        appendMesh(kit, fpHand(side, pose, handMat, handCol, face), hf.M);
      };
      arm(1, rF, rPose);
      if (lF) arm(-1, lF, lPose);
      this.hands = { r: rF, l: lF };
      mb.append(kit);
      for (let i = 3; i < mb.mat.length; i += 4) mb.mat[i] = 2;
      const g = Z.GUN_MODELS[model] || {};
      const mz = g.muzzle || [0, 0.05, -0.3];
      return { mb, muzzle: M4.transform(W, mz[0], mz[1], mz[2]) };
    }

    draw(r, cam, state) {
      const gl = r.gl;
      const { mb, muzzle } = this.build(state);
      this.muzzleCam = muzzle;
      const packed = mb.pack();
      if (!packed.count) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vb);
      if (packed.buf.byteLength > this.cap) { this.cap = packed.buf.byteLength * 2; gl.bufferData(gl.ARRAY_BUFFER, this.cap, gl.DYNAMIC_DRAW); }
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, packed.buf);
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, packed.idx, gl.DYNAMIC_DRAW);
      const camM = M4.invert(r.view);
      const [w, h] = [r.canvas.width, r.canvas.height];
      M4.persp(1.05, w / h, 0.02, 10, this.proj);
      M4.mul(this.proj, r.view, this.vp);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      const p = r.prog.world.use();
      r.setEnvUniforms(p);
      r.bindWorldTextures(p);
      gl.uniformMatrix4fv(p.u.uVP, false, this.vp);
      gl.uniformMatrix4fv(p.u.uModel, false, camM);
      gl.disable(gl.CULL_FACE);
      gl.drawElements(gl.TRIANGLES, packed.count, packed.idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
      gl.enable(gl.CULL_FACE);
      gl.uniformMatrix4fv(p.u.uModel, false, r.ident);
      gl.bindVertexArray(null);
      this.muzzleWorld = M4.transform(camM, muzzle[0], muzzle[1], muzzle[2]);
    }

    update(dt, state) {
      const st = this.st, d = Z.item(state.wid) || Z.item('fists'), kind = holdKindOf(d);
      st.bob += dt * state.speed * 1.9;
      st.breath += dt;
      st.swayX = Z.lerp(st.swayX, Z.clamp(-state.turnX * 0.0015, -0.03, 0.03), Math.min(1, dt * 8));
      st.swayY = Z.lerp(st.swayY, Z.clamp(state.turnY * 0.0015, -0.03, 0.03), Math.min(1, dt * 8));
      st.kick = Math.max(0, st.kick - dt * 8);
      st.ads = kind === 'rifle' || kind === 'pistol' ? state.ads || 0 : 0;
      const ready = state.aim || state.firing || (state.sinceFire || 9) < 0.8 || state.reload > 0 || state.swing > 0 || state.throwT > 0;
      st.run = ready ? Z.approach(st.run, 0, dt * 14) : Z.approach(st.run, state.speed > 3.8 && state.onGround ? 1 : 0, dt * 4);
      st.air = Z.lerp(st.air, state.onGround ? 0 : Z.clamp(-(state.vy || 0) * 0.008, -0.04, 0.05), Math.min(1, dt * 8));
      if (state.onGround && !st.ground) st.land = Math.min(1, Math.max(st.land, -st.vy * 0.12));
      st.ground = !!state.onGround;
      st.vy = state.vy || 0;
      st.land = Math.max(0, st.land - dt * 4);
    }
  }
  Z.ViewModel = ViewModel;

  const TP = {
    rifle: { aim: { butt: 1, at: [0.1, 0.03, 0.05], r: [0, 0, 0] }, low: { butt: 1, at: [0.1, -0.04, 0.0], r: [0.42, -0.42, 0.15] } },
    pistol: { aim: { at: [0.03, -0.03, -0.44], r: [0, 0, 0] }, low: { at: [0.05, -0.27, -0.3], r: [0.12, -0.75, 0] } },
    carbine: { aim: { at: [0.04, -0.05, -0.26], r: [0, 0, 0] }, low: { at: [0.04, -0.2, -0.2], r: [0.2, -0.6, 0.1] } },
    melee: { aim: { at: [0.19, -0.44, -0.22], r: [-0.1, 0.95, 0.15] } },
    melee2: { aim: { at: [0.08, -0.25, -0.28], r: [-0.67, 0.86, 0] } },
    throw: { aim: { at: [0.17, -0.26, -0.27], r: [0, 0.1, 0] } }
  };
  const GEAR = {
    hip: (P, w) => M4.mul(P.boneMat('hips'), M4.trs(0.19 * w + 0.035, -0.035, 0.03, 0, -Math.PI / 2 + 0.12, 0)),
    back: (P) => M4.mul(P.boneMat('chest'), new Float32Array([0, 0, 1, 0, -0.83, -0.55, 0, 0, 0.55, -0.83, 0, 0, 0.11, -0.2, 0.15, 1])),
    belt: (P, w) => M4.mul(P.boneMat('hips'), M4.trs(-0.19 * w - 0.03, -0.0, -0.03, 0.15, -Math.PI / 2 - 0.25, 0)),
    sheath: (P, w) => M4.mul(P.boneMat('hips'), M4.trs(-0.18 * w - 0.03, 0.01, 0.05, 0, -Math.PI / 2 - 0.15, 0)),
    scabbard: (P, w) => M4.mul(P.boneMat('hips'), M4.trs(-0.19 * w - 0.035, 0.02, -0.04, Math.PI, -Math.PI / 2 + 0.62, 0))
  };
  const GEAR_EXTRA = { hip: 'holster', sheath: 'sheath', scabbard: 'scabbard' };
  const unscaled = m => { const a = Math.hypot(m[0], m[1], m[2]) || 1, b = Math.hypot(m[4], m[5], m[6]) || 1, c = Math.hypot(m[8], m[9], m[10]) || 1; return new Float32Array([m[0] / a, m[1] / a, m[2] / a, 0, m[4] / b, m[5] / b, m[6] / b, 0, m[8] / c, m[9] / c, m[10] / c, 0, m[12], m[13], m[14], 1]); };

  const fkFrame = (P, side, off, k) => {
    const B = P.boneMat(side > 0 ? 'rhand' : 'lhand');
    const X = V.norm([B[0], B[1], B[2]]), Y = V.norm([B[4], B[5], B[6]]);
    const D = [-Y[0], -Y[1], -Y[2]], Pv = [-side * X[0], -side * X[1], -side * X[2]];
    const w = M4.transform(B, off[0] * side, off[1], off[2]);
    return Z.handBasis(side, D, Pv, w, k);
  };

  const REST_TH = Z.HAND_POSES.relax.th;
  const thumbVec = (th, side) => {
    const d = (v, l) => [-side * v[1] * l, -v[0] * l, -v[2] * l];
    const a = d(V.norm(th[1]), 0.032), b = d(V.norm(th[2]), 0.026);
    return V.norm([a[0] + b[0], a[1] + b[1], a[2] + b[2]]);
  };
  const setFingers = (P, side, pose) => {
    const s = side > 0 ? 'r' : 'l', R = Z.HAND_POSES.relax;
    let c1 = 0, c2 = 0;
    for (let i = 0; i < 4; i++) { c1 += pose.f[i][0] - R.f[i][0]; c2 += pose.f[i][1] + 0.6 * pose.f[i][2] - R.f[i][1] - 0.6 * R.f[i][2]; }
    P.set(s + 'fing', 0, 0, -side * c1 / 4);
    P.set(s + 'tip', 0, 0, -side * c2 / 4);
    const vr = thumbVec(REST_TH, side), vp = thumbVec(pose.th, side);
    const ax = V.cross(vr, vp), sn = Math.hypot(ax[0], ax[1], ax[2]), cs = V.dot(vr, vp);
    if (sn < 1e-4) { P.set(s + 'thumb', 0, 0, 0); return; }
    const e = eulerOf(rotAxis(ax, Math.atan2(sn, cs)));
    P.set(s + 'thumb', e[1], e[0], e[2]);
  };

  const placeArm = (P, side, frame, off, sc, chest) => {
    const s = side > 0 ? 'r' : 'l';
    const sh = P.bonePos(s + 'uarm'), el = P.bonePos(s + 'farm'), hd = P.bonePos(s + 'hand');
    const Bx = [-side * frame.P[0], -side * frame.P[1], -side * frame.P[2]], By = [-frame.D[0], -frame.D[1], -frame.D[2]];
    const tgt = [frame.wrist[0] - sc * (Bx[0] * off[0] * side + By[0] * off[1]), frame.wrist[1] - sc * (Bx[1] * off[0] * side + By[1] * off[1]), frame.wrist[2] - sc * (Bx[2] * off[0] * side + By[2] * off[1])];
    const pole = M4.transform(chest, side * 0.55, -0.35, 0.3);
    const ik = Z.solveIK2(sh, el, hd, tgt, pole);
    const mid = [(sh[0] + ik.hand[0]) / 2, (sh[1] + ik.hand[1]) / 2, (sh[2] + ik.hand[2]) / 2];
    const bend = V.norm([ik.elbow[0] - mid[0], ik.elbow[1] - mid[1], ik.elbow[2] - mid[2]]);
    P.setBoneWorld(s + 'uarm', sh, [sh[0] - ik.elbow[0], sh[1] - ik.elbow[1], sh[2] - ik.elbow[2]], bend);
    P.setBoneWorld(s + 'farm', ik.elbow, [ik.elbow[0] - ik.hand[0], ik.elbow[1] - ik.hand[1], ik.elbow[2] - ik.hand[2]], bend);
    P.setBoneWorld(s + 'hand', ik.hand, By, [-frame.T[0], -frame.T[1], -frame.T[2]]);
  };

  Z.wieldTP = (P, a, ctx) => {
    ctx.gunId = null; ctx.gunM = null; ctx.parts = null; ctx.extras = [];
    const sc = ctx.scale || 1, fem = a.look && a.look.sex === 'f';
    const kf = (fem ? 0.76 : 0.82) * sc, off = [(fem ? 0.172 : 0.19) - 0.19, 0.015, 0];
    const wid = ctx.wid, d = wid ? Z.item(wid) : null, model = d ? (d.model || wid) : 'fists', kind = holdKindOf(d);
    const F = Z.wieldFrames(model, kf), H = F.H;
    const k = ctx.wk === undefined ? 1 : ctx.wk, an = a.anim || {};
    const chest = P.boneMat('chest');
    let rPose = Z.HAND_POSES.relax, lPose = Z.HAND_POSES.relax;
    const finish = (rp, lp) => { setFingers(P, 1, rp); setFingers(P, -1, lp); P.refresh(['rhand', 'lhand']); };
    if (k <= 0 && (H.fist || !H.gear)) { finish(rPose, lPose); return; }
    const o = M4.transform(chest, 0, 0.17, 0);
    const aimK = ctx.aimK || 0;
    const Fm = M4.trs(o[0], o[1], o[2], -(ctx.aimYaw !== undefined ? ctx.aimYaw : a.yaw), Z.clamp(ctx.aimPitch || 0, -1.1, 1.1) * (0.45 + 0.55 * aimK), 0);
    const pouch = side => {
      const hp = unscaled(P.boneMat('hips'));
      const w = M4.transform(hp, side * 0.15 * sc, 0.02 * sc, -0.13 * sc);
      return basis(side, M4.dir(hp, side * 0.15, -1, -0.25), M4.dir(hp, -side, 0, 0), w, kf);
    };
    if (H.fist) {
      const e = ease(Z.clamp(k, 0, 1));
      const pu = an.swing > 0 ? Z.wieldPunch({ swing: an.swing, punchSide: a.punchSide }) : { side: 1, ext: 0 };
      for (const side of [1, -1]) {
        const ext = pu.side === side ? pu.ext : 0;
        const c = side > 0 ? [0.11, -0.03 + 0.04 * ext, -0.25 - 0.3 * ext] : [-0.1, 0.0 + 0.04 * ext, -0.32 - 0.26 * ext];
        c[0] += -side * 0.08 * ext;
        const t = M4.transform(Fm, c[0] * sc, c[1] * sc, c[2] * sc);
        const D = M4.dir(Fm, -side * (0.12 + 0.2 * ext), 0.3 - 0.1 * ext, -1), Ph = M4.dir(Fm, -side, 0.15, 0);
        const Dn = V.norm(D);
        let fr = basis(side, Dn, Ph, add3(t, Dn, -0.08 * sc), kf);
        if (e < 1) fr = frameMix(fkFrame(P, side, off, kf), fr, e);
        placeArm(P, side, fr, off, sc, chest);
        if (side > 0 && H.worn && e > 0.5) ctx.extras.push({ model: H.worn, M: M4.mul(fr.M, M4.mul(new Float32Array([kf, 0, 0, 0, 0, kf, 0, 0, 0, 0, kf, 0, 0, 0, 0, 1]), WORN[H.worn])) });
      }
      const fp = Z.handBlend(Z.HAND_POSES.relax, Z.HAND_POSES.fist, e);
      finish(fp, fp);
      return;
    }
    const T = kind === 'melee' ? TP[d && d.twoHand ? 'melee2' : 'melee'] : kind === 'pistol' && H.l ? TP.carbine : TP[kind] || TP.pistol;
    const anchor = T.aim.butt && (Z.GUN_MODELS[model] || {}).stock ? [0, 0.025, Z.GUN_MODELS[model].stock] : H.r.c;
    let at = T.aim.at, rr = T.aim.r;
    if (T.low) { const lk = Z.clamp(aimK, 0, 1); at = lerp3(T.low.at, T.aim.at, lk); rr = lerp3(T.low.r, T.aim.r, lk); }
    let dp = [0, 0, 0], dr = [0, 0, 0];
    const kick = an.fire || 0;
    if (kind === 'rifle') { dp = [0, 0.008 * kick, 0.045 * kick]; dr = [0, 0.07 * kick, 0]; }
    else if (kind === 'pistol') { dp = [0, 0.01 * kick, 0.03 * kick]; dr = [0, 0.3 * kick, 0]; }
    const we = a.equip && a.equip.weapon;
    const act = Z.wieldAction(F, { reload: an.reload || 0, rounds: ctx.rounds, cycle: ctx.cycle || 0, kick, empty: !!(d && d.mag && we && (we.loaded || 0) <= 0 && !(an.reload > 0)) });
    dp = add3(dp, act.dp); dr = add3(dr, act.dr);
    if (an.swing > 0 && kind === 'melee') { const s = Z.wieldSwing(d, { swing: an.swing, punchSide: a.punchSide }); dp = add3(dp, s[0]); dr = add3(dr, s[1]); }
    let throwU = -1;
    if (an.throwT > 0 && kind === 'throw') { const s = Z.wieldThrow({ throwT: an.throwT }); dp = add3(dp, s[0]); dr = add3(dr, s[1]); throwU = s[2]; }
    const R0 = M4.trs(0, 0, 0, rr[0] + dr[0], rr[1] + dr[1], rr[2] + dr[2]);
    const ac = M4.dir(R0, anchor[0], anchor[1], anchor[2]);
    const ready = M4.mul(Fm, M4.trs((at[0] + dp[0]) * sc - ac[0], (at[1] + dp[1]) * sc - ac[1], (at[2] + dp[2]) * sc - ac[2], rr[0] + dr[0], rr[1] + dr[1], rr[2] + dr[2]));
    const bw = 1 + ((a.look && a.look.build !== undefined ? a.look.build : 0.5) - 0.5) * 0.22 + ((a.look && a.look.bulk) || 0);
    const gear = H.gear ? unscaled(GEAR[H.gear](P, bw)) : null;
    const reach = span(k, 0, 0.42), carry = span(k, 0.42, 1);
    let gunM = gear ? blendM(gear, ready, carry) : ready;
    if (gear && carry > 0 && carry < 1) gunM[13] += Math.sin(carry * Math.PI) * 0.08 * sc;
    const fkR = fkFrame(P, 1, off, kf), fkL = fkFrame(P, -1, off, kf);
    let rF = frameT(gunM, F.r), lF = F.l ? frameT(gunM, F.l) : null;
    rPose = F.rPose; lPose = F.lPose || Z.HAND_POSES.relax;
    if (k >= 1) {
      if (act.rh) { rF = resolveHand(act.rh, gunM, pouch(1)); rPose = act.rPose || rPose; }
      if (act.lh) { lF = resolveHand(act.lh, gunM, pouch(-1)); lPose = act.lPose || lPose; }
    }
    if (reach < 1) { rF = frameMix(fkR, rF, reach); rPose = Z.handBlend(Z.HAND_POSES.relax, Z.handBlend(Z.HAND_POSES.open, F.rPose, span(k, 0.3, 0.45)), span(k, 0, 0.3)); }
    if (lF) { const j = span(k, 0.7, 1); if (j < 1) { lF = frameMix(fkL, lF, j); lPose = Z.handBlend(Z.HAND_POSES.relax, lPose, j); } }
    if (kind === 'throw' && k < 0.42) gunM = null;
    if (throwU > 0.63) { gunM = null; rPose = Z.handBlend(rPose, Z.HAND_POSES.open, span(throwU, 0.63, 0.72)); }
    placeArm(P, 1, rF, off, sc, chest);
    if (lF) placeArm(P, -1, lF, off, sc, chest);
    finish(rPose, lF ? lPose : Z.HAND_POSES.relax);
    if (gunM) {
      ctx.gunId = wid;
      ctx.gunM = gunM;
      const parts = {};
      let any = false;
      if (k >= 1) for (const name in act.parts) {
        const p = act.parts[name];
        if (!p) continue;
        parts[name] = p.hand ? M4.mul(M4.invert(gunM), attachM(p.hand === 'l' ? lF : rF, p.grab)) : p;
        any = true;
      }
      ctx.parts = any ? parts : null;
      if (k >= 1) for (const e of act.extras || []) ctx.extras.push({ model: e.model, M: e.hand ? attachM(e.hand === 'l' ? lF : rF, e.grab, e.M) : M4.mul(gunM, e.M) });
    }
    if (gear && GEAR_EXTRA[H.gear]) ctx.extras.push({ model: GEAR_EXTRA[H.gear], M: gear });
    ctx.gripR = rF; ctx.gripL = lF;
  };

  Z.WIELD_TIMES = { draw: 0.42, holster: 0.24 };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
