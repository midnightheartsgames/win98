(function (T) {
  'use strict';
  const { clamp, lerp, vadd, vsub, vscale, vdot, vcross, vlen, vnorm, vmad, mmul, mvec, mtvec, rotY, rotZ, rotX, rotYPR } = T;

  const BODY = {
    size: 1, hipW: 0.1, hipDrop: 0.07, thigh: 0.44, shin: 0.43, ankleH: 0.075,
    footLen: 0.24, footW: 0.1, footH: 0.075,
    spine: 0.48, shW: 0.19, shDrop: 0.05, neck: 0.075, headR: 0.115,
    upArm: 0.29, foreArm: 0.26, fist: 0.085,
    chestW: 0.38, chestD: 0.23, waistW: 0.29, waistD: 0.19, pelW: 0.31, pelD: 0.21,
    arm: [0.06, 0.048, 0.047, 0.037], leg: [0.095, 0.07, 0.066, 0.046], neckR: 0.052, handW: 0.09
  };

  const SCALARS = ['py', 'cy', 'cp', 'cr', 'hy', 'hp', 'by', 'bp', 'br', 'lfy', 'rfy', 'lo', 'ro'];
  const VECS = ['p', 'lh', 'rh', 'lf', 'rf', 'le', 're', 'lk', 'rk'];

  const NEUTRAL = {
    p: [0, 0.9, 0], py: 0, cy: 0, cp: 0.04, cr: 0, hy: 0, hp: 0, by: 0, bp: 0, br: 0, lfy: 0, rfy: 0, lo: 0, ro: 0,
    lh: [0.12, 0.08, -0.26], rh: [0.12, 0.08, 0.26], lf: [0.02, 0.075, -0.13], rf: [0.02, 0.075, 0.13],
    le: [-0.25, -1, -0.45], re: [-0.25, -1, 0.45], lk: [1, 0.05, -0.12], rk: [1, 0.05, 0.12]
  };

  function clonePose(a) {
    const o = {};
    for (const k of SCALARS) o[k] = a[k];
    for (const k of VECS) o[k] = a[k].slice();
    return o;
  }

  function fillPose(part, base) {
    const o = clonePose(base || NEUTRAL);
    if (!part) return o;
    for (const k of SCALARS) if (part[k] !== undefined) o[k] = part[k];
    for (const k of VECS) if (part[k] !== undefined) o[k] = part[k].slice();
    return o;
  }

  function lerpPose(a, b, t, out) {
    const o = out || {};
    for (const k of SCALARS) o[k] = a[k] + (b[k] - a[k]) * t;
    for (const k of VECS) {
      const x = a[k], y = b[k];
      o[k] = [x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t];
    }
    return o;
  }

  function mirrorPose(a) {
    const o = clonePose(a);
    const mz = v => [v[0], v[1], -v[2]];
    o.p = mz(a.p);
    for (const k of ['py', 'cy', 'cr', 'hy', 'by', 'br']) o[k] = -a[k];
    o.lh = mz(a.rh); o.rh = mz(a.lh); o.lf = mz(a.rf); o.rf = mz(a.lf);
    o.le = mz(a.re); o.re = mz(a.le); o.lk = mz(a.rk); o.rk = mz(a.lk);
    o.lfy = -a.rfy; o.rfy = -a.lfy; o.lo = a.ro; o.ro = a.lo;
    return o;
  }

  function perp(d) {
    const a = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    return vnorm(vcross(d, a));
  }

  function ik(A, target, l1, l2, pole) {
    const d = vsub(target, A);
    const dist = vlen(d);
    const dir = dist > 1e-6 ? vscale(d, 1 / dist) : [0, -1, 0];
    const dc = clamp(dist, Math.abs(l1 - l2) + 0.02, (l1 + l2) * 0.998);
    const end = vmad(A, dir, dc);
    const cosA = clamp((l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc), -1, 1);
    const sinA = Math.sqrt(1 - cosA * cosA);
    let pp = vsub(pole, vscale(dir, vdot(pole, dir)));
    pp = vlen(pp) < 1e-5 ? perp(dir) : vnorm(pp);
    const mid = vadd(A, vadd(vscale(dir, l1 * cosA), vscale(pp, l1 * sinA)));
    return [mid, end];
  }

  function frames(pose, B) {
    const s = B.size;
    const P = vscale(pose.p, s);
    const Rp = rotY(pose.py);
    const Rc = mmul(mmul(mmul(Rp, rotY(pose.cy)), rotZ(-pose.cp)), rotX(pose.cr));
    const S0 = vadd(P, mvec(Rp, [0, 0.06 * s, 0]));
    return { s, P, Rp, Rc, S0 };
  }

  function chestLocal(pose, B, abs) {
    const f = frames(pose, B);
    return vscale(mtvec(f.Rc, vsub(vscale(abs, f.s), f.S0)), 1 / f.s);
  }

  function chestAbs(pose, B, local) {
    const f = frames(pose, B);
    return vscale(vadd(f.S0, mvec(f.Rc, vscale(local, f.s))), 1 / f.s);
  }

  function solve(pose, B) {
    const { s, P, Rp, Rc, S0 } = frames(pose, B);
    const N = vadd(S0, mvec(Rc, [0, B.spine * s, 0]));
    const Rh = mmul(rotY(pose.hy), rotZ(-pose.hp));
    const neckTop = vadd(N, mvec(Rc, [0, B.neck * s * 0.6, 0]));
    const head = vadd(neckTop, mvec(Rh, [0.012 * s, B.headR * s * 1.05, 0]));
    const shL = vadd(N, mvec(Rc, [0, -B.shDrop * s, -B.shW * s]));
    const shR = vadd(N, mvec(Rc, [0, -B.shDrop * s, B.shW * s]));
    const hL = vadd(S0, mvec(Rc, vscale(pose.lh, s)));
    const hR = vadd(S0, mvec(Rc, vscale(pose.rh, s)));
    const [elL, waL] = ik(shL, hL, B.upArm * s, B.foreArm * s, mvec(Rc, pose.le));
    const [elR, waR] = ik(shR, hR, B.upArm * s, B.foreArm * s, mvec(Rc, pose.re));
    const fdL = vnorm(vsub(waL, elL)), fdR = vnorm(vsub(waR, elR));
    const fiL = vmad(waL, fdL, B.fist * s * 0.5), fiR = vmad(waR, fdR, B.fist * s * 0.5);
    const hipL = vadd(P, mvec(Rp, [0, -B.hipDrop * s, -B.hipW * s]));
    const hipR = vadd(P, mvec(Rp, [0, -B.hipDrop * s, B.hipW * s]));
    const [knL, anL] = ik(hipL, vscale(pose.lf, s), B.thigh * s, B.shin * s, mvec(Rp, pose.lk));
    const [knR, anR] = ik(hipR, vscale(pose.rf, s), B.thigh * s, B.shin * s, mvec(Rp, pose.rk));
    const foot = (an, kn, yaw) => {
      const flat = [Math.cos(pose.py + yaw), 0, Math.sin(pose.py + yaw)];
      const k = clamp((an[1] / s - 0.14) / 0.3, 0, 0.8);
      const shinDir = vnorm(vsub(an, kn));
      return vnorm(vadd(vscale(flat, 1 - k), vscale(shinDir, k)));
    };
    const ftL = foot(anL, knL, pose.lfy), ftR = foot(anR, knR, pose.rfy);
    const j = {
      s, P, S0, N, neckTop, head, Rp, Rc, Rh,
      shL, shR, elL, elR, waL, waR, fiL, fiR, fdL, fdR,
      hipL, hipR, knL, knR, anL, anR, ftL, ftR, lo: pose.lo, ro: pose.ro
    };
    if (pose.by || pose.bp || pose.br) {
      const Rb = rotYPR(pose.by, pose.bp, pose.br);
      const rp = v => vadd(P, mvec(Rb, vsub(v, P)));
      for (const k of ['S0', 'N', 'neckTop', 'head', 'shL', 'shR', 'elL', 'elR', 'waL', 'waR', 'fiL', 'fiR', 'hipL', 'hipR', 'knL', 'knR', 'anL', 'anR']) j[k] = rp(j[k]);
      for (const k of ['fdL', 'fdR', 'ftL', 'ftR']) j[k] = mvec(Rb, j[k]);
      for (const k of ['Rp', 'Rc', 'Rh']) j[k] = mmul(Rb, j[k]);
    }
    return j;
  }

  function lowestY(j) {
    let m = Infinity;
    for (const k of ['anL', 'anR', 'knL', 'knR', 'head', 'fiL', 'fiR', 'P', 'N', 'elL', 'elR']) m = Math.min(m, j[k][1]);
    return m;
  }

  Object.assign(T, { BODY, NEUTRAL, SCALARS, VECS, clonePose, fillPose, lerpPose, mirrorPose, ik, solve, chestLocal, chestAbs, frames, lowestY });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
