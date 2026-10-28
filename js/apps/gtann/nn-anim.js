(function (N) {
  'use strict';

  const PB = N.PB, PAR = N.PPARENT, NB = PAR.length;
  const M3 = N.M3;
  const mat = M3.mat;

  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const nrm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const madd = (...terms) => { const o = [0, 0, 0]; for (let i = 0; i < terms.length; i += 2) { const v = terms[i], k = terms[i + 1]; o[0] += v[0] * k; o[1] += v[1] * k; o[2] += v[2] * k; } return o; };

  const col = (m, i) => [m[i], m[3 + i], m[6 + i]];
  const pos = m => [m[9], m[10], m[11]];
  const ap = (m, p) => [m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[9], m[3] * p[0] + m[4] * p[1] + m[5] * p[2] + m[10], m[6] * p[0] + m[7] * p[1] + m[8] * p[2] + m[11]];
  const av = (m, p) => [m[0] * p[0] + m[1] * p[1] + m[2] * p[2], m[3] * p[0] + m[4] * p[1] + m[5] * p[2], m[6] * p[0] + m[7] * p[1] + m[8] * p[2]];
  const basis = (o, X, Y, Z, P) => {
    o[0] = X[0]; o[1] = Y[0]; o[2] = Z[0];
    o[3] = X[1]; o[4] = Y[1]; o[5] = Z[1];
    o[6] = X[2]; o[7] = Y[2]; o[8] = Z[2];
    o[9] = P[0]; o[10] = P[1]; o[11] = P[2];
    return o;
  };
  const inv = (m, o) => {
    const r = o || mat();
    r[0] = m[0]; r[1] = m[3]; r[2] = m[6];
    r[3] = m[1]; r[4] = m[4]; r[5] = m[7];
    r[6] = m[2]; r[7] = m[5]; r[8] = m[8];
    r[9] = -(r[0] * m[9] + r[1] * m[10] + r[2] * m[11]);
    r[10] = -(r[3] * m[9] + r[4] * m[10] + r[5] * m[11]);
    r[11] = -(r[6] * m[9] + r[7] * m[10] + r[8] * m[11]);
    return r;
  };
  const frame = (y, xh) => {
    const Y = nrm(y);
    let X = sub(xh, scl(Y, dot(xh, Y)));
    if (len(X) < 1e-4) X = Math.abs(Y[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
    X = nrm(sub(X, scl(Y, dot(X, Y))));
    return { x: X, y: Y, z: cross(X, Y) };
  };
  const wframe = (F, U) => {
    const f = nrm(F);
    const u = nrm(sub(U, scl(f, dot(U, f))));
    return { f, u, r: cross(f, u) };
  };
  const wmat = (o, P, w) => basis(o, w.r, w.u, scl(w.f, -1), P);

  const GRIPS = {
    pistol: { y: [0, 0.94, 0.35], x: [1, 0, 0], d: 0.075 },
    rifle: { y: [0, 0.88, 0.47], x: [1, 0, 0], d: 0.075 },
    wrist: { y: [0, 0.6, 0.8], x: [1, 0, 0], d: 0.07 }
  };
  const SUPPORTS = {
    under: { y: [-0.72, -0.5, 0.48], x: [0.55, -0.83, 0], d: 0.075 },
    cup: { y: [-0.55, 0.62, 0.55], x: [0.75, 0.65, 0], d: 0.07 },
    mag: { y: [-0.6, -0.6, 0.53], x: [0.6, -0.8, 0], d: 0.07 }
  };
  const hold = wid => { const G = N.WGRIP && N.WGRIP[wid]; return G && G.grip ? { R: GRIPS[G.grip], L: SUPPORTS[G.support || 'under'] } : null; };
  const HANDW = { knife: [0, -0.07, 0], knuckles: [0, -0.095, -0.002], grenade: [0, -0.085, 0], molotov: [0, -0.085, 0.02] };
  const AIMS = { pistol: [0.46, -0.02, -0.16], chest: [0.38, -0.1, -0.12], launcher: [0.22, -0.03, -0.02] };
  const RPOSE = {
    pistol: (C, R, U, F) => [madd(C, 1, R, 0.05, U, -0.12, F, 0.32), madd(F, 0.7, U, 0.5), madd(U, 0.6, F, -0.4)],
    rifle: (C, R, U, F) => [madd(C, 1, R, 0.1, U, -0.17, F, 0.3), madd(F, 0.85, U, 0.1, R, -0.25), madd(U, 0.8, R, 0.6)],
    shotgun: (C, R, U, F) => [madd(C, 1, R, 0.08, U, -0.2, F, 0.28), madd(F, 0.85, U, 0.05, R, -0.3), madd(U, 0.5, R, 0.85)],
    break: (C, R, U, F) => [madd(C, 1, R, 0.1, U, -0.22, F, 0.24), madd(F, 0.9, U, -0.1, R, -0.25), U],
    revolver: (C, R, U, F) => [madd(C, 1, R, 0.04, U, -0.1, F, 0.3), madd(F, 0.75, U, 0.35, R, -0.25), madd(R, 0.8, U, 0.4)],
    pkm: (C, R, U, F) => [madd(C, 1, R, 0.12, U, -0.24, F, 0.22), madd(F, 0.9, R, -0.35), madd(U, 0.9, R, 0.3)],
    rpg: (C, R, U, F) => [madd(C, 1, R, 0.14, U, -0.18, F, 0.12), madd(F, 0.65, U, 0.5, R, -0.5), U]
  };
  const amounts = K => K.map(([u, v]) => [u, [v]]);
  const loadShells = (us, at, lead) => us.flatMap(u => [[u - lead, 'pouch'], [u, at]]);
  const RELOADS = {
    pistol: {
      pose: 'pistol',
      lh: [[0, 'lh'], [0.12, 'lh'], [0.24, 'pouch'], [0.38, 'pouch'], [0.5, 'mag', 'down', 0.1], [0.56, 'mag'], [0.66, 'slide'], [0.76, 'slide', 'back', 0.05], [0.82, 'slide'], [0.94, 'lh'], [1, 'lh']],
      mag: [['gun', 0.12], ['drop', 0.3], ['none', 0.38], ['hand', 0.55], ['gun', 1]]
    },
    mag: {
      pose: 'rifle',
      lh: [[0, 'lh'], [0.1, 'mag'], [0.18, 'mag', 'down', 0.12], [0.32, 'pouch'], [0.42, 'pouch'], [0.56, 'mag', 'down', 0.12], [0.63, 'mag'], [0.7, 'ch'], [0.78, 'ch', 'back', 0.08], [0.84, 'ch'], [0.95, 'lh'], [1, 'lh']],
      mag: [['gun', 0.12], ['hand', 0.62], ['gun', 1]]
    },
    pump: {
      pose: 'shotgun',
      lh: [[0, 'lh'], [0.06, 'pouch'], ...loadShells([0.16, 0.32, 0.48, 0.64], 'port', 0.07), [0.76, 'lh'], [1, 'lh']],
      part: { pump: amounts([[0, 0], [0.82, 0], [0.86, 1], [0.92, 0], [1, 0]]) }
    },
    break: {
      pose: 'break',
      lh: [[0, 'lh'], [0.2, 'lh'], [0.3, 'pouch'], [0.4, 'pouch'], [0.46, 'breech', 'up', 0.05], [0.5, 'breech'], [0.57, 'pouch'], [0.6, 'breech', 'up', 0.05], [0.64, 'breech'], [0.72, 'lh'], [1, 'lh']],
      part: { brk: amounts([[0, 0], [0.08, 0], [0.16, 1], [0.8, 1], [0.88, 0], [1, 0]]) }
    },
    revolver: {
      pose: 'revolver',
      lh: [[0, 'lh'], [0.05, 'drum'], [0.12, 'drum'], [0.2, 'drum', 'fwd', 0.06], [0.24, 'drum'], ...loadShells([0.34, 0.44, 0.54, 0.64, 0.74], 'drum', 0.05), [0.82, 'drum'], [0.88, 'drum'], [0.95, 'lh'], [1, 'lh']],
      part: { cyl: amounts([[0, 0], [0.05, 0], [0.12, 1], [0.84, 1], [0.89, 0], [1, 0]]) }
    },
    clip: {
      pose: 'rifle',
      lh: [[0, 'lh'], [0.05, 'ch'], [0.1, 'ch', 'back', 0.09], [0.14, 'ch', 'back', 0.09], [0.22, 'pouch'], [0.3, 'pouch'], [0.38, 'clip', 'up', 0.08], [0.42, 'clip', 'up', 0.01], [0.48, 'clip', 'up', 0.05], [0.6, 'clip', 'down', 0.01], [0.66, 'clip', 'up', 0.03], [0.76, 'ch', 'back', 0.09], [0.84, 'ch'], [0.94, 'lh'], [1, 'lh']],
      mag: [['none', 0.3], ['hand', 0.42], ['gun', 0.84], ['drop', 0.98], ['none', 1]]
    },
    belt: {
      pose: 'pkm',
      lh: [[0, 'lh'], [0.05, 'lid'], [0.12, 'lid'], [0.18, 'mag', 'up', 0.02], [0.24, 'mag'], [0.3, 'mag', 'down', 0.12], [0.36, 'pouch'], [0.42, 'pouch'], [0.48, 'mag', 'down', 0.1], [0.52, 'mag'], [0.6, 'top', 'up', 0.03], [0.66, 'top'], [0.7, 'lid'], [0.77, 'lid'], [0.84, 'ch'], [0.9, 'ch', 'back', 0.12], [0.96, 'lh'], [1, 'lh']],
      mag: [['gun', 0.24], ['drop', 0.34], ['none', 0.42], ['hand', 0.52], ['gun', 1]],
      part: { cover: amounts([[0, 0], [0.05, 0], [0.12, 1], [0.7, 1], [0.77, 0], [1, 0]]) }
    },
    airgun: {
      pose: 'break',
      lh: [[0, 'lh'], [0.08, 'end'], [0.13, 'end'], [0.36, 'end'], [0.42, 'end'], [0.5, 'pouch'], [0.56, 'pouch'], [0.62, 'breech', 'up', 0.05], [0.68, 'breech'], [0.74, 'end'], [0.78, 'end'], [0.88, 'end'], [0.95, 'lh'], [1, 'lh']],
      part: { brk: amounts([[0, 0], [0.13, 0], [0.36, 1], [0.76, 1], [0.88, 0], [1, 0]]) }
    },
    rocket: {
      pose: 'rpg',
      lh: [[0, 'lh'], [0.1, 'lh'], [0.2, 'pouch'], [0.28, 'pouch'], [0.42, 'muzzle', 'fwd', 0.39], [0.62, 'muzzle', 'fwd', 0.17], [0.72, 'lh'], [1, 'lh']],
      mag: [['none', 0.24], ['hand', 0.42], ['feed', 0.62], ['gun', 1]]
    }
  };
  const reloadOf = W => RELOADS[W.reloadAnim || (W.two ? 'mag' : 'pistol')];
  const partOf = (wid, name) => N.Models.wparts(wid).find(q => q.name === name);
  const partPoint = (P, a, q) => {
    if (P.kind === 'slide') { const k = a * P.max; return [q[0] + P.dir[0] * k, q[1] + P.dir[1] * k, q[2] + P.dir[2] * k]; }
    const x = q[0] - P.at[0], y = q[1] - P.at[1], z = q[2] - P.at[2];
    const c = Math.cos(a * P.max), s = Math.sin(a * P.max);
    if (P.axis === 'x') return [q[0], P.at[1] + y * c - z * s, P.at[2] + y * s + z * c];
    if (P.axis === 'y') return [P.at[0] + x * c + z * s, q[1], P.at[2] - x * s + z * c];
    return [P.at[0] + x * c - y * s, P.at[1] + x * s + y * c, q[2]];
  };
  const partLocal = (P, a, o) => {
    if (P.kind === 'slide') { const k = a * P.max; return M3.euler(0, 0, 0, P.at[0] + P.dir[0] * k, P.at[1] + P.dir[1] * k, P.at[2] + P.dir[2] * k, o); }
    const r = a * P.max;
    return M3.euler(P.axis === 'x' ? r : 0, P.axis === 'y' ? r : 0, P.axis === 'z' ? r : 0, P.at[0], P.at[1], P.at[2], o);
  };
  const magMode = (RL, u) => {
    let prev = 0;
    for (const [mode, until] of RL.mag) { if (u < until) return { mode, u0: prev, u1: until }; prev = until; }
    return { mode: 'gun', u0: prev, u1: 1 };
  };

  const ST = new WeakMap();
  const state = p => {
    let s = ST.get(p);
    if (!s) {
      s = { t: null, seed: N.hash2(p.id || 1, 3, 9), E: new Float32Array(NB * 3), M: Array.from({ length: NB }, mat), G: Array.from({ length: NB }, mat), F: mat(), aimW: 0, guard: 0, fallDir: 1, headYaw: 0, headTgt: 0, headT: 0, turn: 0, turnPh: 0, lastYaw: p.yaw || 0, still: 0, squat: 0, W: mat(), Mg: mat(), Pm: mat(), tmp: mat(), inv: mat() };
      ST.set(p, s);
    }
    return s;
  };

  const keys = (K, u) => {
    if (u <= K[0][0]) return K[0][1];
    for (let i = 1; i < K.length; i++) if (u <= K[i][0]) { const a = K[i - 1], b = K[i]; return mix(a[1], b[1], N.smooth(0, 1, (u - a[0]) / Math.max(1e-4, b[0] - a[0]))); }
    return K[K.length - 1][1];
  };

  function solveArm(M, piv, side, T, hb, pole) {
    const ua = side < 0 ? PB.UAL : PB.UAR, fa = ua + 1, hd = ua + 2;
    const S = pos(M[ua]);
    const a = Math.abs(piv[ua][1] - piv[fa][1]), b = Math.abs(piv[fa][1] - piv[hd][1]);
    let D = sub(T, S);
    let d = len(D);
    const dir = d > 1e-5 ? scl(D, 1 / d) : [0, -1, 0];
    d = N.clamp(d, Math.abs(a - b) + 0.01, a + b - 0.002);
    const cosA = N.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
    let pp = sub(pole, scl(dir, dot(pole, dir)));
    if (len(pp) < 1e-4) pp = Math.abs(dir[1]) < 0.9 ? [0, -1, 0] : [0, 0, 1];
    pp = nrm(pp);
    const E = add(S, add(scl(dir, a * cosA), scl(pp, a * sinA)));
    const W = add(S, scl(dir, d));
    const up = nrm(sub(S, E)), fd = nrm(sub(W, E));
    let bend = sub(fd, scl(up, dot(fd, up)));
    if (len(bend) < 1e-4) bend = scl(pp, -1);
    bend = nrm(bend);
    const Z = scl(bend, -1);
    const X = cross(up, Z);
    basis(M[ua], X, up, Z, S);
    const yF = scl(fd, -1);
    let zF = cross(X, yF);
    zF = nrm(zF);
    const xF = cross(yF, zF);
    basis(M[fa], xF, yF, zF, E);
    if (hb) basis(M[hd], hb.x, hb.y, hb.z, W);
    else basis(M[hd], xF, yF, zF, W);
  }

  const GRIP_PALM = 0.034, GRIP_WRIST = 0.085, GRIP_SLACK = 0.03;

  function carMat(v, o) {
    return M3.euler((v.pitch || 0) + (v.bodyPitch || 0), -v.yaw, v.roll || 0, v.x, v.y, v.z, o);
  }

  const GEST_HANDS = new Set(['point', 'wave', 'phone', 'give', 'hips', 'arms', 'shrug', 'calm', 'head', 'face', 'fist', 'count', 'back', 'drink', 'smoke', 'hug', 'duck', 'kneel', 'up', 'beckon', 'watch']);
  N.GESTURES = Array.from(GEST_HANDS).concat(['nod', 'no', 'down', 'look', 'crouch']);

  function gestPose(k, t, w, inc, toward) {
    let rootY = 0;
    if (k === 'nod') inc(PB.HEAD, -Math.max(0, Math.sin(t * 7)) * 0.22 * w, 0, 0);
    else if (k === 'no') inc(PB.HEAD, 0, Math.sin(t * 6.5) * 0.32 * w, 0);
    else if (k === 'down' || k === 'head' || k === 'face' || k === 'watch') inc(PB.HEAD, -0.32 * w, 0, 0);
    else if (k === 'look') inc(PB.HEAD, 0.12 * w, 0.5 * w, 0);
    else if (k === 'shrug') { inc(PB.CHEST, 0.06 * w, 0, 0); inc(PB.HEAD, 0.05 * w, 0, 0.16 * w); }
    else if (k === 'phone') inc(PB.HEAD, -0.06 * w, 0.12 * w, -0.14 * w);
    else if (k === 'arms') { inc(PB.CHEST, 0.05 * w, 0, 0); inc(PB.HEAD, 0.06 * w, 0, 0); }
    else if (k === 'hug') { inc(PB.CHEST, 0.08 * w, 0, 0); inc(PB.HEAD, 0.08 * w, 0, 0); }
    else if (k === 'back') { inc(PB.CHEST, 0.08 * w, 0, 0); inc(PB.HEAD, 0.04 * w, 0, 0); }
    else if (k === 'fist') inc(PB.CHEST, -0.08 * w, 0, 0);
    else if (k === 'count') inc(PB.HEAD, -0.42 * w, 0, 0);
    else if (k === 'duck') {
      for (const [th, sh, ft, s] of [[PB.THL, PB.SHL, PB.FOOTL, -1], [PB.THR, PB.SHR, PB.FOOTR, 1]]) { toward(th, 1.75, 0, s * 0.28, w); toward(sh, -2.2, 0, 0, w); toward(ft, 0.45, 0, 0, w); }
      toward(PB.SPINE, -0.55, 0, 0, w); toward(PB.CHEST, -0.2, 0, 0, w); toward(PB.HEAD, -0.15, 0, 0, w);
      rootY -= 0.4 * w;
    } else if (k === 'kneel' || k === 'crouch') {
      toward(PB.THL, 0.08, 0, -0.06, w); toward(PB.SHL, -1.55, 0, 0, w); toward(PB.FOOTL, 0.55, 0, 0, w);
      toward(PB.THR, 1.5, 0, 0.12, w); toward(PB.SHR, -1.52, 0, 0, w); toward(PB.FOOTR, 0.05, 0, 0, w);
      toward(PB.SPINE, -0.12, 0, 0, w); toward(PB.HEAD, 0.18, 0, 0, w);
      rootY -= 0.47 * w;
    }
    return rootY;
  }

  function gestHands(k, t, w, C, Rb, Ub, Fb, handIK) {
    const at = (r, u, f) => madd(C, 1, Rb, r, Ub, u, Fb, f);
    const fwd = s => frame(scl(Fb, -1), scl(Ub, s > 0 ? 1 : -1));
    const up = s => frame(scl(Ub, -1), scl(Fb, s > 0 ? -1 : 1));
    const down = s => frame(Ub, scl(Fb, s > 0 ? 1 : -1));
    const out = s => frame(madd(Rb, -s * 0.75, Fb, -0.45, Ub, -0.2), scl(Ub, s));
    const set = (s, T, hb, pole) => { handIK[s < 0 ? 'L' : 'R'] = { T, hb, pole, k: w }; };
    const pulse = (sp, ph) => Math.pow(Math.max(0, Math.sin(t * sp + ph)), 1.5);
    if (k === 'point') set(1, at(0.2, 0.27, 0.58), fwd(1), madd(Rb, 0.5, Ub, -0.8));
    else if (k === 'wave') set(1, at(0.34 + Math.sin(t * 9) * 0.08, 0.6, 0.12), up(1), madd(Rb, 1, Ub, -0.4));
    else if (k === 'phone') set(1, at(0.12, 0.38, 0.07), up(1), madd(Rb, 0.6, Ub, -0.7, Fb, 0.3));
    else if (k === 'give') set(1, at(0.1, 0.04, 0.48), fwd(1), madd(Rb, 0.6, Ub, -0.8));
    else if (k === 'beckon') set(1, at(0.16, 0.12, 0.42 + Math.sin(t * 8) * 0.06), up(1), madd(Rb, 0.7, Ub, -0.7));
    else if (k === 'hips') for (const s of [-1, 1]) set(s, at(s * 0.2, -0.3, 0.02), down(s), madd(Rb, s, Fb, -0.5));
    else if (k === 'arms') {
      set(-1, at(0.14, 0.02, 0.18), frame(scl(Rb, -1), Ub), madd(Rb, -0.7, Fb, 0.4, Ub, -0.5));
      set(1, at(-0.14, 0.06, 0.21), frame(Rb, Ub), madd(Rb, 0.7, Fb, 0.4, Ub, -0.5));
    } else if (k === 'shrug') for (const s of [-1, 1]) set(s, at(s * 0.34, -0.12, 0.28), out(s), madd(Rb, s, Ub, -0.6));
    else if (k === 'calm') for (const s of [-1, 1]) set(s, at(s * 0.2, Math.sin(t * 5) * 0.035, 0.42), fwd(s), madd(Rb, s * 0.7, Ub, -0.7));
    else if (k === 'head') for (const s of [-1, 1]) set(s, at(s * 0.13, 0.55, 0.0), up(s), madd(Rb, s, Ub, 0.1, Fb, -0.2));
    else if (k === 'face') set(1, at(0.03, 0.36, 0.15), up(1), madd(Rb, 0.5, Ub, -0.8, Fb, 0.2));
    else if (k === 'fist') set(1, at(0.22, 0.3 + Math.abs(Math.sin(t * 10)) * 0.05, 0.3), up(1), madd(Rb, 0.8, Ub, -0.6));
    else if (k === 'count') { set(-1, at(-0.04, -0.08, 0.32), fwd(-1), madd(Rb, -0.7, Ub, -0.7)); set(1, at(0.07, -0.05 + pulse(7, 0) * 0.05, 0.31), fwd(1), madd(Rb, 0.7, Ub, -0.7)); }
    else if (k === 'back') for (const s of [-1, 1]) set(s, at(s * 0.07, -0.42, -0.2), down(s), madd(Rb, s, Fb, -0.6));
    else if (k === 'drink' || k === 'smoke') {
      const b = k === 'drink' ? pulse(1.4, -1.2) : pulse(0.9, -0.5);
      set(1, mix(at(0.14, -0.04, 0.27), at(0.03, 0.33, 0.17), b), frame(madd(Ub, 0.55, Fb, -0.8, Rb, -0.25), madd(Rb, 0.4, Fb, 0.6)), madd(Rb, 0.8, Ub, -0.6));
    } else if (k === 'hug') for (const s of [-1, 1]) set(s, at(s * 0.46, 0.14, 0.36), out(s), madd(Rb, s, Ub, -0.4));
    else if (k === 'duck') for (const s of [-1, 1]) set(s, at(s * 0.1, 0.48, 0.18), up(s), madd(Rb, s, Ub, -0.2, Fb, 0.5));
    else if (k === 'kneel' || k === 'up') for (const s of [-1, 1]) set(s, at(s * 0.24, 0.58, 0.06), frame(scl(Ub, -1), scl(Fb, s > 0 ? -1 : 1)), madd(Rb, s, Ub, -0.3));
    else if (k === 'watch') { set(-1, at(-0.02, 0.06, 0.3), frame(madd(Rb, 1, Ub, 0.3), Fb), madd(Rb, -0.8, Ub, -0.6)); set(1, at(0.02, 0.05, 0.27), fwd(1), madd(Rb, 0.8, Ub, -0.6)); }
  }

  const RES = { G: null, wpn: null, parts: [], item: null };
  const ITEM = mat();
  const WPN = mat(), CARM = mat(), WHM = mat();
  const PSLOT = Array.from({ length: 4 }, () => ({ mb: null, m: mat() }));

  N.pedRig = (p, t, root, piv, ctx) => {
    const st = state(p);
    const dt = st.t === null ? 0 : N.clamp(t - st.t, 0, 0.1);
    st.t = t;
    const A = p.anim || {};
    const E = st.E;
    E.fill(0);
    const set = (b, x, y, z) => { E[b * 3] = x; E[b * 3 + 1] = y; E[b * 3 + 2] = z; };
    const inc = (b, x, y, z) => { E[b * 3] += x; E[b * 3 + 1] += y; E[b * 3 + 2] += z; };
    const toward = (b, x, y, z, k) => { E[b * 3] += (x - E[b * 3]) * k; E[b * 3 + 1] += (y - E[b * 3 + 1]) * k; E[b * 3 + 2] += (z - E[b * 3 + 2]) * k; };
    const look = p.look || {};
    const cx = ctx || {};
    const wid = p.weapon && N.WEAPONS[p.weapon] ? p.weapon : 'fists';
    const W = N.WEAPONS[wid];
    const veh = p.veh || null;
    const sit = N.clamp(cx.sit !== undefined ? cx.sit : veh ? 1 : A.sit || 0, 0, 1);
    const swim = p.swim && !p.dead ? p.swim : null;
    const fall = A.fall || 0;
    const lying = (p.dead || p.state === 'down') && sit < 0.01;
    const gu = !lying && A.getUp > 0 ? N.clamp(A.getUp / 0.5, 0, 1) : 0;
    const sp = sit > 0.01 || swim ? 0 : (A.speed || 0);
    const yawRate = dt > 0 ? N.wrap((p.yaw || 0) - st.lastYaw) / dt : 0;
    st.lastYaw = p.yaw || 0;
    let fk = 1, sk = 0;
    if (sp > 0.1) {
      const yw = p.yaw || 0;
      fk = (p.vx * Math.sin(yw) - p.vz * Math.cos(yw)) / sp;
      sk = (p.vx * Math.cos(yw) + p.vz * Math.sin(yw)) / sp;
    }
    const ph = A.phase || 0;
    const walkW = N.smooth(0.05, 1.0, sp), runW = N.smooth(2.4, 4.4, sp), sprW = N.smooth(4.9, 6.4, sp);
    const old = !!look.old, fem = look.male === false;
    const wade = !swim && sit < 0.01 ? N.clamp((p.wade || 0) / 0.8, 0, 1) : 0;
    let rootY = 0;
    const ampH = (N.lerp(0.42, 0.62, runW) + sprW * 0.14) * (old ? 0.7 : 1);
    const kneeS = (N.lerp(0.95, 1.9, runW) + sprW * 0.25) * (1 + wade * 0.35);
    const legs = [[PB.THL, PB.SHL, PB.FOOTL, 0, -1], [PB.THR, PB.SHR, PB.FOOTR, Math.PI, 1]];
    for (const [th, sh, ft, off, s] of legs) {
      const ps = ph + off;
      const sn = Math.sin(ps), cs = Math.cos(ps);
      const swing = Math.pow(Math.max(0, cs), 1.2);
      const hip = sn * ampH * walkW;
      const pitch = hip * fk + runW * 0.1;
      const roll = sk * walkW * (0.1 + 0.18 * sn);
      const knee = -(swing * kneeS + 0.06 + runW * 0.18 * Math.max(0, -sn)) * walkW;
      const foot = -(pitch + knee) * 0.85 * (1 - swing * 0.4) - 0.35 * Math.max(0, -sn) * Math.max(0, -cs) * walkW;
      set(th, pitch, 0, roll + s * 0.02);
      set(sh, knee, 0, 0);
      set(ft, foot, 0, 0);
    }
    rootY += walkW * (1 - runW) * (-0.022 * Math.cos(2 * ph)) + runW * (0.04 * Math.abs(Math.cos(ph)) - 0.045);
    const lean = 0.03 * walkW + 0.15 * runW + 0.12 * sprW;
    set(PB.PELVIS, 0, Math.sin(ph) * 0.11 * walkW * fk, Math.cos(ph) * 0.045 * walkW * (1 - runW * 0.5) * (fem ? 1.6 : 1));
    set(PB.SPINE, -lean * 0.45, -Math.sin(ph) * 0.06 * walkW, -Math.cos(ph) * 0.03 * walkW);
    set(PB.CHEST, -lean * 0.55, -Math.sin(ph) * 0.09 * walkW * fk, 0);
    set(PB.HEAD, lean * 0.7, 0, 0);
    const armA = (0.32 + 0.5 * runW) * walkW * N.clamp(0.4 + fk * 0.6, 0.2, 1);
    for (const [ua, fa, s] of [[PB.UAL, PB.FAL, -1], [PB.UAR, PB.FAR, 1]]) {
      const sw = -s * Math.sin(ph) * armA;
      set(ua, -sw, s * 0.05 * runW, s * (0.07 + 0.06 * runW));
      set(fa, 0.22 + 0.2 * walkW + 1.1 * runW + Math.max(0, -sw) * 0.3, 0, 0);
    }
    const idle = 1 - walkW;
    if (idle > 0.01) {
      const br = Math.sin(t * 1.7 + st.seed * 10) * 0.018 * idle;
      inc(PB.CHEST, br, 0, 0);
      const shift = Math.sin(t * 0.55 + st.seed * 7) * idle;
      inc(PB.PELVIS, 0, 0, shift * 0.035);
      inc(shift > 0 ? PB.SHL : PB.SHR, -Math.abs(shift) * 0.16, 0, 0);
      inc(shift > 0 ? PB.THL : PB.THR, Math.abs(shift) * 0.08, 0, 0);
      st.headT -= dt;
      if (st.headT <= 0) { st.headT = 2.5 + N.hash2(Math.floor(t), p.id || 0, 5) * 4; st.headTgt = N.hash2(Math.floor(t * 3), (p.id || 0) + 7, 11) < 0.55 ? 0 : (N.hash2(Math.floor(t * 7), p.id || 0, 13) - 0.5) * 1.3; }
    } else st.headTgt = 0;
    st.headYaw = N.approach(st.headYaw, st.headTgt, dt * 1.6);
    inc(PB.HEAD, 0, st.headYaw * idle, 0);
    if (old) { inc(PB.SPINE, -0.18, 0, 0); inc(PB.CHEST, -0.08, 0, 0); inc(PB.HEAD, 0.2, 0, 0); inc(PB.SHL, -0.08, 0, 0); inc(PB.SHR, -0.08, 0, 0); inc(PB.THL, 0.05, 0, 0); inc(PB.THR, 0.05, 0, 0); }
    if (idle > 0.5 && Math.abs(yawRate) > 1.2 && sit < 0.01 && !lying) { st.turnPh += dt * 9; st.turn = Math.min(1, st.turn + dt * 6); } else st.turn = Math.max(0, st.turn - dt * 4);
    if (st.turn > 0.01) {
      const k = st.turn * 0.22;
      inc(PB.THL, Math.sin(st.turnPh) * k, 0, 0); inc(PB.THR, -Math.sin(st.turnPh) * k, 0, 0);
      inc(PB.SHL, -Math.max(0, Math.cos(st.turnPh)) * k * 2, 0, 0); inc(PB.SHR, -Math.max(0, -Math.cos(st.turnPh)) * k * 2, 0, 0);
    }
    const gopnik = (p.type === 'gopnik' || p.type === 'zarechny') && !p.isPlayer && sp < 0.1 && !A.action && (A.aim || 0) < 0.05 && !veh && !lying && !swim && (!p.ai || p.ai.mode === 'idle' || p.ai.mode === 'guard' || p.ai.mode === 'chat' || p.ai.mode === 'wait');
    st.still = gopnik ? st.still + dt : 0;
    st.squat = N.approach(st.squat, st.still > 2.5 ? 1 : 0, dt * 1.8);
    if (st.squat > 0.001) {
      const q = N.smooth(0, 1, st.squat);
      rootY -= 0.43 * q;
      for (const [th, sh, ft, s] of [[PB.THL, PB.SHL, PB.FOOTL, -1], [PB.THR, PB.SHR, PB.FOOTR, 1]]) { toward(th, 2.05, 0, s * 0.32, q); toward(sh, -2.45, 0, 0, q); toward(ft, 0.38, 0, 0, q); }
      toward(PB.SPINE, -0.35, 0, 0, q); toward(PB.CHEST, -0.1, 0, 0, q); toward(PB.HEAD, 0.28, 0, 0, q);
      toward(PB.UAL, 0.85, 0, -0.18, q); toward(PB.UAR, 0.85, 0, 0.18, q); toward(PB.FAL, 0.75, 0, 0, q); toward(PB.FAR, 0.75, 0, 0, q);
    }
    if (wade > 0.01) {
      inc(PB.UAL, 0.25 * wade, 0, -0.35 * wade); inc(PB.UAR, 0.25 * wade, 0, 0.35 * wade);
      inc(PB.FAL, 0.5 * wade, 0, 0); inc(PB.FAR, 0.5 * wade, 0, 0);
      inc(PB.SPINE, -0.1 * wade, 0, 0);
    }
    if (A.rope && !p.dead) {
      set(PB.THL, 0.55, 0, -0.05); set(PB.SHL, -1.0, 0, 0); set(PB.THR, 0.18, 0, 0.05); set(PB.SHR, -0.35, 0, 0);
      set(PB.FOOTL, 0.3, 0, 0); set(PB.FOOTR, 0.2, 0, 0);
    }
    const airborne = !p.onGround && !p.dead && p.state !== 'down' && !swim && sit < 0.01 && p.onGround !== undefined && !A.rope;
    if (airborne) {
      const jump = A.jumpT > 0;
      const k = jump ? N.smooth(0, 0.15, 0.6 - A.jumpT) : N.smooth(1.5, 4, -(p.vy || 0));
      toward(PB.THL, 0.95, 0, -0.05, k); toward(PB.SHL, -1.35, 0, 0, k); toward(PB.THR, 0.35, 0, 0.05, k); toward(PB.SHR, -0.6, 0, 0, k);
      toward(PB.UAL, 0.5, 0, -0.75, k); toward(PB.UAR, 0.5, 0, 0.75, k); toward(PB.FAL, 0.5, 0, 0, k); toward(PB.FAR, 0.5, 0, 0, k);
      if (!jump && (p.vy || 0) < -6) {
        const w = t * 11;
        set(PB.UAL, Math.sin(w) * 1.6 + 1.2, 0, -0.6); set(PB.UAR, Math.sin(w + 2) * 1.6 + 1.2, 0, 0.6);
        set(PB.THL, 0.6 + Math.sin(w * 0.8) * 0.5, 0, 0); set(PB.THR, 0.6 - Math.sin(w * 0.8) * 0.5, 0, 0);
      }
    }
    if (A.land > 0 && sit < 0.01) {
      const k = N.clamp(A.land / 0.32, 0, 1);
      inc(PB.THL, 0.65 * k, 0, 0); inc(PB.THR, 0.65 * k, 0, 0); inc(PB.SHL, -1.25 * k, 0, 0); inc(PB.SHR, -1.25 * k, 0, 0);
      inc(PB.FOOTL, 0.6 * k, 0, 0); inc(PB.FOOTR, 0.6 * k, 0, 0); inc(PB.SPINE, -0.25 * k, 0, 0);
      rootY -= 0.2 * k;
    }
    if (A.flinch > 0) { inc(PB.CHEST, A.flinch * 1.1, 0, 0); inc(PB.HEAD, A.flinch * 0.8, 0, 0); }
    if (A.dance && sit < 0.01 && !lying) {
      const d = t * 4 + (p.id || 0);
      set(PB.UAL, 2.5 + Math.sin(d) * 0.45, 0, -0.45); set(PB.UAR, 2.5 + Math.cos(d) * 0.45, 0, 0.45);
      set(PB.FAL, 0.7 + Math.sin(d * 2) * 0.3, 0, 0); set(PB.FAR, 0.7 + Math.cos(d * 2) * 0.3, 0, 0);
      set(PB.PELVIS, 0, Math.sin(d * 0.5) * 0.35, Math.sin(d) * 0.1);
      set(PB.CHEST, 0, -Math.sin(d * 0.5) * 0.2, -Math.sin(d) * 0.08);
      set(PB.THL, 0.2 + Math.max(0, Math.sin(d)) * 0.45, 0, 0); set(PB.SHL, -Math.max(0, Math.sin(d)) * 0.7, 0, 0);
      set(PB.THR, 0.2 + Math.max(0, -Math.sin(d)) * 0.45, 0, 0); set(PB.SHR, -Math.max(0, -Math.sin(d)) * 0.7, 0, 0);
      set(PB.HEAD, Math.sin(d * 2) * 0.12, 0, 0);
      rootY -= 0.04 + Math.abs(Math.sin(d)) * 0.05;
    }
    const talkK = Math.max(A.talk || 0, A.speak || 0);
    if (talkK > 0.01 && sit < 0.5 && !lying && sp < 0.3 && st.squat < 0.5) {
      const g = t * 2.6 + st.seed * 9, k = talkK;
      inc(PB.UAR, (0.55 + Math.sin(g) * 0.25) * k, 0, 0.12 * k);
      inc(PB.FAR, (1.05 + Math.sin(g * 1.7) * 0.35) * k, 0, 0);
      inc(PB.HEAD, Math.sin(g * 2.3) * 0.06 * k, Math.sin(g * 0.7) * 0.15 * k, 0);
      inc(PB.CHEST, 0, Math.sin(g * 0.9) * 0.08 * k, 0);
    }
    const act = A.action, at = A.actionT || 0;
    if (act === 'punch' && (A.combo || 0) === 2) {
      const k = N.clamp(1 - at / 0.3, 0, 1), ext = Math.sin(k * Math.PI);
      set(PB.THR, 1.35 * ext, 0, 0.05); set(PB.SHR, -1.5 * ext * (1 - ext * 0.8), 0, 0); set(PB.FOOTR, -0.4 * ext, 0, 0);
      inc(PB.SPINE, 0.22 * ext, 0, 0);
    }
    if (act === 'windup') {
      const wk = N.clamp(p.charging || 1, 0, 1);
      set(PB.UAR, N.lerp(-1.75, -2.4, wk), -0.2, 0.55); set(PB.FAR, N.lerp(1.2, 1.6, wk), 0, 0);
      set(PB.UAL, N.lerp(0.9, 1.35, wk), 0, -0.25); set(PB.FAL, 0.35, 0, 0);
      inc(PB.CHEST, 0.12, N.lerp(0.2, 0.55, wk), 0); inc(PB.SPINE, 0, N.lerp(0.08, 0.26, wk), 0);
      set(PB.THL, 0.35, 0, -0.08); set(PB.SHL, -0.15, 0, 0);
    }
    if (act === 'throw') {
      const k = N.smooth(0, 1, 1 - N.clamp(at / 0.4, 0, 1));
      set(PB.UAR, N.lerp(-2.4, 1.3, k), 0, N.lerp(0.55, 0.15, k)); set(PB.FAR, N.lerp(1.5, 0.2, k), 0, 0);
      set(PB.UAL, N.lerp(1.2, -0.3, k), 0, -0.25); set(PB.FAL, 0.5, 0, 0);
      inc(PB.CHEST, N.lerp(0.12, -0.25, k), N.lerp(0.45, -0.4, k), 0); inc(PB.SPINE, N.lerp(0, -0.2, k), N.lerp(0.2, -0.25, k), 0);
      set(PB.THL, N.lerp(0.35, 0.55, k), 0, -0.08); set(PB.SHL, -0.3 * k, 0, 0); set(PB.THR, -0.35 * k, 0, 0);
    }
    if (A.handsUp && sit < 0.01) { inc(PB.SPINE, 0.06, 0, 0); }
    const GS = A.gest && !lying && !swim && sit < 0.05 && !p.dead ? A.gest : null;
    const gw = GS ? N.smooth(0, 0.3, GS.t) * (GS.d ? 1 - N.smooth(GS.d - 0.35, GS.d, GS.t) : 1) : 0;
    if (gw > 0.001) rootY += gestPose(GS.k, GS.t, gw, inc, toward);
    const sitBike = veh && veh.spec.type === 'bike' || cx.bike;
    if (sit > 0.001) {
      const s = sit;
      if (sitBike) {
        for (const [th, sh, ft, sd] of [[PB.THL, PB.SHL, PB.FOOTL, -1], [PB.THR, PB.SHR, PB.FOOTR, 1]]) { toward(th, 1.05, 0, sd * 0.24, s); toward(sh, -1.75, 0, 0, s); toward(ft, 0.6, 0, 0, s); }
        toward(PB.SPINE, -0.32, 0, 0, s); toward(PB.CHEST, -0.12, 0, 0, s); toward(PB.HEAD, 0.38, 0, 0, s); toward(PB.PELVIS, 0, 0, 0, s);
      } else {
        for (const [th, sh, ft, sd] of [[PB.THL, PB.SHL, PB.FOOTL, -1], [PB.THR, PB.SHR, PB.FOOTR, 1]]) { toward(th, cx.bench ? 1.5 : 1.72, 0, sd * 0.07, s); toward(sh, cx.bench ? -1.42 : -1.08, 0, 0, s); toward(ft, cx.bench ? 0.05 : 0.3, 0, 0, s); }
        toward(PB.SPINE, 0.13, 0, 0, s); toward(PB.CHEST, 0.1, 0, 0, s); toward(PB.HEAD, -0.32, 0, 0, s); toward(PB.PELVIS, 0.15, 0, 0, s);
        toward(PB.UAL, 0.42, 0, -0.12, s); toward(PB.UAR, 0.42, 0, 0.12, s); toward(PB.FAL, 1.0, 0, 0, s); toward(PB.FAR, 1.0, 0, 0, s);
      }
      rootY *= 1 - s;
      if (p.enter && p.enter.ph === 'in' || p.exit && p.exit.ph === 'out' || cx.duck) inc(PB.SPINE, -0.45 * Math.sin(Math.PI * s), 0, 0);
      if (veh && veh.driver === p && !sitBike) {
        const L = (st.reach || 0) * s;
        inc(PB.SPINE, -L * 0.6, 0, 0); inc(PB.CHEST, -L * 0.4, 0, 0); inc(PB.HEAD, L * 0.9, (veh.steer || 0) * 0.5, 0);
      }
      if (veh && veh.dead && !p.isPlayer) { inc(PB.SPINE, -0.5, 0, 0.2); inc(PB.HEAD, -0.5, 0, 0.4); }
    }
    let lie = 0;
    if (lying) lie = N.smooth(0, 1, fall);
    else if (gu > 0) lie = N.smooth(0, 1, gu);
    if (lying && fall < 0.08) {
      const yw = p.yaw || 0;
      const back = -(p.vx * Math.sin(yw) - p.vz * Math.cos(yw));
      st.fallDir = back < -0.6 ? -1 : 1;
    }
    if (swim) {
      const k = t * 7.5 + st.seed * 9;
      if (swim.under) {
        set(PB.UAL, 2.85, 0, -0.25); set(PB.UAR, 2.9, 0, 0.25); set(PB.FAL, 0.25 + Math.sin(k) * 0.2, 0, 0); set(PB.FAR, 0.25 + Math.cos(k) * 0.2, 0, 0);
        set(PB.HEAD, 0.55, 0, 0); set(PB.SPINE, 0.15, 0, 0);
      } else {
        set(PB.UAL, 2.3 + Math.sin(k) * 0.75, 0, -0.55 + Math.cos(k) * 0.35); set(PB.UAR, 2.3 + Math.sin(k + 2.6) * 0.75, 0, 0.55 - Math.cos(k + 2.6) * 0.35);
        set(PB.FAL, 0.6 + Math.sin(k * 1.3) * 0.45, 0, 0); set(PB.FAR, 0.6 + Math.cos(k * 1.3) * 0.45, 0, 0);
        set(PB.HEAD, 0.38 + Math.sin(k * 0.7) * 0.12, Math.sin(k * 0.9) * 0.35, 0);
        set(PB.SPINE, 0.12, Math.sin(k * 0.5) * 0.18, 0); set(PB.CHEST, 0.05, 0, Math.sin(k * 0.6) * 0.1);
      }
      set(PB.THL, 0.55 + Math.sin(k * 1.2) * 0.5, 0, -0.1); set(PB.SHL, -0.9 - Math.cos(k * 1.2) * 0.3, 0, 0);
      set(PB.THR, 0.55 - Math.sin(k * 1.2) * 0.5, 0, 0.1); set(PB.SHR, -0.9 + Math.cos(k * 1.2) * 0.3, 0, 0);
      set(PB.PELVIS, 0, 0, 0);
      rootY = 0;
    }
    if (lie > 0.001) {
      const dir = st.fallDir;
      const mid = Math.sin(Math.PI * lie);
      const v = Math.floor(st.seed * 3);
      const k = lie;
      for (const [ua, fa, s] of [[PB.UAL, PB.FAL, -1], [PB.UAR, PB.FAR, 1]]) {
        const up = v === 2 || (v === 1 && s > 0);
        toward(ua, dir > 0 ? (up ? 2.6 : 0.6) : 2.4, 0, s * (up ? 0.3 : 1.25), k);
        toward(fa, up ? 0.2 : 0.35, 0, 0, k);
      }
      for (const [th, sh, ft, s] of [[PB.THL, PB.SHL, PB.FOOTL, -1], [PB.THR, PB.SHR, PB.FOOTR, 1]]) {
        const bent = v === 0 ? s > 0 : v === 1 ? s < 0 : false;
        toward(th, (bent ? 0.75 : 0.06) + mid * 0.5, 0, s * 0.16, k);
        toward(sh, (bent ? -1.2 : -0.1) - mid * 0.8, 0, 0, k);
        toward(ft, dir > 0 ? -0.6 : 0.4, 0, 0, k);
      }
      toward(PB.SPINE, 0, 0, 0, k); toward(PB.CHEST, 0, 0, 0, k); toward(PB.PELVIS, 0, 0, 0, k);
      toward(PB.HEAD, 0, p.dead ? (st.seed - 0.5) * 1.4 : 0, 0, k);
      if (gu > 0) { const c = Math.sin(Math.PI * lie); inc(PB.THL, c * 1.3, 0, 0); inc(PB.SHL, -c * 2.0, 0, 0); inc(PB.THR, c * 0.6, 0, 0); inc(PB.SHR, -c * 1.4, 0, 0); inc(PB.SPINE, -c * 0.5, 0, 0); }
      rootY = 0;
    }
    const F = st.F;
    const tb = lying && A.tumble ? A.tumble : null;
    if (tb) {
      const ang = st.fallDir * lie * Math.PI / 2 + tb.a, w = Math.abs(Math.sin(tb.a / (2 * tb.n))), h = 0.95;
      M3.euler(ang, 0, 0, 0, N.lerp(lie * 0.14, h - h * Math.cos(ang), w), -h * Math.sin(ang) * w, F);
    } else if (lie > 0.001) M3.euler(st.fallDir * lie * Math.PI / 2, 0, 0, 0, lie * 0.14, 0, F);
    else M3.euler(0, 0, 0, 0, 0, 0, F);
    const shotK = (A.shot !== undefined && A.shot < 0.16) ? Math.pow(1 - A.shot / 0.16, 2) : 0;
    const kick = W.kick || [0, 0];
    if (shotK > 0 && !W.melee && !W.throw) { inc(PB.CHEST, shotK * kick[1] * 0.4, 0, 0); inc(PB.HEAD, shotK * kick[1] * 0.25, 0, 0); }
    const busyBody = lying || swim || gu > 0.01;
    const aimW = N.clamp(A.aim || 0, 0, 1);
    const inCarShot = !!veh && !W.melee && !W.throw && A.shot !== undefined && A.shot < 1.2;
    const eating = !!p.eat && !busyBody && !p.dead && sit < 0.05;
    const showWeapon = wid !== 'fists' && !busyBody && (sit < 0.05 || inCarShot) && !(veh && !inCarShot) && !eating && !(gw > 0.2 && GEST_HANDS.has(GS.k));
    const meleeOn = showWeapon && (W.melee || W.throw) || wid === 'fists' && !busyBody && sit < 0.05;
    if (meleeOn && (act === 'punch' || act === 'stab')) st.guard = 1.6;
    st.guard = Math.max(0, st.guard - dt);
    const guardW = meleeOn && !W.throw && !p.dead ? N.smooth(0, 0.3, st.guard) * (A.dance ? 0 : 1) : 0;
    const pk = N.clamp(1 - at / 0.3, 0, 1);
    const ext = act === 'punch' || act === 'stab' ? (pk < 0.35 ? N.smooth(0, 0.35, pk) : 1 - N.smooth(0.35, 1, pk)) : 0;
    const combo = A.combo || 0;
    if (guardW > 0.01 && sp < 0.5) { inc(PB.THL, 0.15 * guardW, 0, -0.08 * guardW); inc(PB.THR, -0.05 * guardW, 0, 0.08 * guardW); inc(PB.SHL, -0.3 * guardW, 0, 0); inc(PB.SHR, -0.25 * guardW, 0, 0); inc(PB.PELVIS, 0, 0.25 * guardW, 0); inc(PB.CHEST, 0, -0.2 * guardW, 0); rootY -= 0.04 * guardW; }
    if (act === 'stab') inc(PB.CHEST, 0, combo === 1 ? -0.45 * ext : 0.15 * ext, 0);
    if (act === 'punch' && combo === 1) inc(PB.CHEST, 0, -0.25 * ext, 0);
    if (act === 'punch' && combo === 0) { inc(PB.CHEST, 0, 0.45 * ext, 0); inc(PB.PELVIS, 0, 0.15 * ext, 0); }
    const pitch = N.clamp(p.aimPitch || 0, -0.8, 0.8);
    if (showWeapon && !W.melee && !W.throw && sit < 0.05) {
      const bl = W.two ? 0.35 + 0.65 * aimW : 0.6 * aimW;
      inc(PB.SPINE, 0, -0.22 * bl, 0);
      inc(PB.CHEST, pitch * 0.3 * aimW, -0.28 * bl, 0);
      inc(PB.HEAD, W.two ? -0.12 * aimW : 0, 0.5 * bl, W.two ? -0.2 * aimW : 0);
      inc(PB.PELVIS, 0, -0.08 * bl, 0);
    }
    const M = st.M;
    for (let b = 0; b < NB; b++) {
      const par = PAR[b];
      const pv = piv[b], pp = par >= 0 ? piv[par] : [0, 0, 0];
      const L = M3.euler(E[b * 3], E[b * 3 + 1], E[b * 3 + 2], pv[0] - pp[0], pv[1] - pp[1] + (b === 0 ? rootY : 0), pv[2] - pp[2], st.tmp);
      M3.mul(par >= 0 ? M[par] : F, L, M[b]);
    }
    const Ch = M[PB.CHEST];
    const C = pos(Ch), Rb = col(Ch, 0), Ub = col(Ch, 1), Fb = scl(col(Ch, 2), -1);
    const poleDef = s => madd(Rb, s * 0.5, Ub, -0.8, Fb, -0.25);
    const invRoot = inv(root, st.inv);
    const toModel = w => ap(invRoot, w);
    let Wm = null;
    const handIK = { L: null, R: null };
    const two = !!W.two;
    const H = hold(wid), G = (N.WGRIP && N.WGRIP[wid]) || {}, RL = reloadOf(W);
    const ru = p.reloadT > 0 && W.reload && !W.melee && !W.throw ? N.clamp(1 - p.reloadT / W.reload, 0, 1) : -1;
    const amt = {};
    const rel = veh ? N.wrap((p.aimYaw !== undefined ? p.aimYaw : p.yaw || 0) - (p.yaw || 0)) : 0;
    let rk = 0;
    if (showWeapon && !W.melee && !W.throw) {
      const aim = inCarShot ? 1 : aimW;
      const Fa = [Math.sin(rel) * Math.cos(pitch * aim), Math.sin(pitch * aim), -Math.cos(rel) * Math.cos(pitch * aim)];
      const wa = wframe(Fa, [0, 1, 0]);
      const S = pos(M[PB.UAR]);
      const style = G.aim || (two ? 'shoulder' : 'pistol');
      const ao = AIMS[style] || [G.stock || 0.36, -0.1, -0.05];
      const hold0 = w => madd(S, 1, w.f, ao[0], w.u, ao[1], w.r, ao[2]);
      let P, w, fpLift = null;
      if (two) {
        let pl, wl;
        if (G.carry === 'hip') { wl = wframe(madd(Fb, 0.95, Rb, -0.2, Ub, -0.1), Ub); pl = madd(C, 1, Rb, 0.15, Ub, -0.2, Fb, 0.16); }
        else if (G.carry === 'shoulder') { wl = wframe(madd(Fb, 0.85, Ub, 0.5), Ub); pl = hold0(wl); }
        else if (G.carry === 'low') { wl = wframe(madd(Fb, 0.75, Ub, -0.6, Rb, -0.2), Ub); pl = madd(C, 1, Rb, 0.1, Ub, -0.2, Fb, 0.24); }
        else { wl = wframe(madd(Fb, 0.55, Ub, -0.45, Rb, -0.7), Ub); pl = madd(C, 1, Rb, 0.14, Ub, -0.08, Fb, 0.22); }
        P = mix(pl, hold0(wa), aim);
        w = wframe(mix(wl.f, wa.f, aim), mix(wl.u, wa.u, aim));
      } else {
        P = hold0(wa);
        w = wa;
      }
      if (cx.fp !== undefined && aim > 0.001) {
        const pistol = style === 'pistol', eye = ap(M[PB.HEAD], [N.PED_EYE[0], N.PED_EYE[1] * (look.tall || 1), N.PED_EYE[2]]);
        const sight = madd(eye, 1, w.f, pistol ? 0.4 : 0.17, w.u, -((G.tip ? G.tip[1] : 0.05) + (pistol ? 0.03 : 0.06)));
        const hip = madd(sight, 1, w.r, pistol ? 0.1 : 0.13, w.u, pistol ? -0.1 : -0.09, w.f, 0.06);
        const P0 = P;
        P = mix(P, mix(hip, sight, cx.fp), aim);
        fpLift = sub(P, P0);
      }
      if (ru >= 0 && RL) {
        const rw = N.smooth(0, 0.1, ru) * (1 - N.smooth(0.9, 1, ru));
        const rp = RPOSE[RL.pose](C, Rb, Ub, Fb), wr = wframe(rp[1], rp[2]);
        rk = rw;
        P = mix(P, fpLift ? add(rp[0], scl(fpLift, 0.85)) : rp[0], rw);
        w = wframe(mix(w.f, wr.f, rw), mix(w.u, wr.u, rw));
        for (const k in RL.part || {}) amt[k] = keys(RL.part[k], ru)[0];
      }
      if (G.pump && ru < 0 && A.shot !== undefined && A.shot > 0.2 && A.shot < 0.62) amt.pump = Math.sin(Math.PI * (A.shot - 0.2) / 0.42);
      if (shotK > 0) { P = madd(P, 1, w.f, -shotK * kick[0]); w = wframe(madd(w.f, 1, w.u, shotK * kick[1]), madd(w.u, 1, w.f, -shotK * kick[1])); }
      if ((two || aim > 0.02 || ru >= 0) && H) {
        Wm = wmat(WPN, P, w);
        const k = two ? 1 : Math.max(aim, rk);
        const hr = frame(av(Wm, H.R.y), av(Wm, H.R.x));
        handIK.R = { T: add(P, scl(hr.y, H.R.d)), hb: hr, pole: madd(Rb, 0.75, Ub, -0.7, Fb, -0.1), k };
        const pt = name => { const q = G[name], mv = G.moves && G.moves[name]; return ap(Wm, mv ? partPoint(partOf(wid, mv), amt[mv] || 0, q) : q); };
        let lp = pt('lh');
        let lhb = frame(av(Wm, H.L.y), av(Wm, H.L.x));
        if (ru >= 0 && RL) {
          const pouch = madd(C, 1, Rb, -0.16, Ub, -0.36, Fb, 0.1);
          const DIR = { down: scl(w.u, -1), up: w.u, back: scl(w.f, -1), fwd: w.f };
          lp = keys(RL.lh.map(([u, name, d, a]) => [u, name === 'pouch' ? pouch : d ? madd(pt(name), 1, DIR[d], a) : pt(name)]), ru);
          const fr = frame(madd(w.u, 0.3, Rb, -0.6, Fb, -0.4), madd(Rb, 1, w.u, 0.3));
          lhb = frame(mix(lhb.y, fr.y, rk), mix(lhb.x, fr.x, rk));
        }
        handIK.L = { T: add(lp, scl(lhb.y, H.L.d)), hb: lhb, pole: madd(Rb, -0.35, Ub, -1, Fb, -0.1), k };
      }
    }
    if (guardW > 0.01 || ext > 0) {
      const gL = madd(C, 1, Rb, -0.1, Ub, 0.18, Fb, 0.24), gR = madd(C, 1, Rb, 0.08, Ub, 0.14, Fb, 0.2);
      const fist = () => frame(madd(Ub, -0.5, Fb, -0.85), Rb);
      const punchHB = s2 => frame(scl(Fb, -1), scl(Ub, s2 > 0 ? 1 : -1));
      let tL = gL, tR = gR, hL = fist(), hR = fist();
      if (act === 'stab') {
        const from = combo === 1 ? madd(C, 1, Rb, 0.3, Ub, 0.35, Fb, 0.25) : combo === 2 ? madd(C, 1, Rb, 0.15, Ub, -0.05, Fb, 0.2) : madd(C, 1, Rb, 0.15, Ub, 0.6, Fb, 0.2);
        const to = combo === 1 ? madd(C, 1, Rb, -0.25, Ub, -0.1, Fb, 0.5) : combo === 2 ? madd(C, 1, Rb, 0.05, Ub, 0.0, Fb, 0.66) : madd(C, 1, Rb, 0.05, Ub, -0.05, Fb, 0.55);
        tR = mix(from, to, ext);
        hR = punchHB(1);
      } else if (act === 'punch' && combo === 1) { tL = madd(C, 1, Rb, -0.04, Ub, 0.2, Fb, 0.24 + 0.36 * ext); if (ext > 0.2) hL = punchHB(-1); }
      else if (act === 'punch' && combo === 0) { tR = madd(C, 1, Rb, 0.0, Ub, 0.18, Fb, 0.2 + 0.42 * ext); if (ext > 0.2) hR = punchHB(1); }
      const gw = Math.max(guardW, ext > 0 ? 1 : 0);
      handIK.L = { T: tL, hb: hL, pole: madd(Rb, -0.6, Ub, -0.6), k: gw };
      handIK.R = { T: tR, hb: hR, pole: madd(Rb, 0.6, Ub, -0.6), k: gw };
    }
    if (eating) {
      const e = p.eat, ph = e.t / 0.9 * Math.PI * 2, bite = Math.pow(Math.max(0, Math.sin(ph - 0.6)), 1.6) * (e.t > 0.35 ? 1 : e.t / 0.35);
      const low = madd(C, 1, Rb, 0.12, Ub, -0.02, Fb, 0.3), mouth = madd(C, 1, Rb, 0.03, Ub, 0.33, Fb, 0.17);
      handIK.R = { T: mix(low, mouth, bite), hb: frame(madd(Ub, 0.55, Fb, -0.8, Rb, -0.25), madd(Rb, 0.4, Fb, 0.6)), pole: madd(Rb, 0.8, Ub, -0.6), k: 1 };
    }
    if (A.rope && !p.dead) {
      handIK.L = { T: madd(C, 1, Ub, 0.66, Fb, 0.12), hb: frame(scl(Ub, -1), Rb), pole: madd(Rb, -0.7, Ub, -0.3), k: 1 };
      handIK.R = { T: madd(C, 1, Ub, 0.42, Fb, 0.12), hb: frame(scl(Ub, -1), scl(Rb, -1)), pole: madd(Rb, 0.7, Ub, -0.3), k: 1 };
    }
    if (A.handsUp && !p.dead) {
      for (const s of [-1, 1]) handIK[s < 0 ? 'L' : 'R'] = { T: madd(C, 1, Rb, s * 0.24, Ub, 0.58, Fb, 0.06), hb: frame(scl(Ub, -1), scl(Fb, s > 0 ? -1 : 1)), pole: madd(Rb, s, Ub, -0.3), k: 1 };
    }
    if (gw > 0.001 && GEST_HANDS.has(GS.k)) gestHands(GS.k, GS.t, gw, C, Rb, Ub, Fb, handIK);
    const doorTask = !p.dead && (p.enter && p.enter.v && (p.enter.ph === 'open' || p.enter.ph === 'locked' || p.enter.ph === 'jack') ? p.enter : p.exit && p.exit.v && (p.exit.ph === 'close' || p.exit.ph === 'open') ? p.exit : null);
    if (doorTask && doorTask.v.door) {
      const v = doorTask.v, sd = doorTask.side, cab = N.cabin(v.spec);
      if (cab.door) {
        carMat(v, CARM);
        const th = (v.door[sd < 0 ? 0 : 1] || 0) * 1.15;
        const L0 = cab.door.len - 0.08;
        const ry = sd * th;
        const inside = doorTask === p.exit && p.exit.ph === 'open';
        const hl = [sd * cab.hw + Math.sin(ry) * L0 - (inside ? sd * 0.08 : 0), cab.belt - 0.1, cab.door.z0 + Math.cos(ry) * L0];
        let T = toModel(ap(CARM, hl));
        const side = sd < 0 ? -1 : 1;
        const hand = side < 0 ? 'L' : 'R';
        let k = 1;
        if (doorTask.ph === 'jack') {
          const tt = doorTask.t || 0;
          const seatW = ap(CARM, [cab.seat.x, cab.seat.y + 0.5, cab.seat.z]);
          const reach = toModel(seatW);
          const pull = madd(C, 1, Fb, 0.25, Ub, -0.05);
          T = tt < 0.3 ? mix(T, reach, N.smooth(0, 0.3, tt)) : mix(reach, pull, N.smooth(0.3, 0.6, tt));
          handIK.L = { T: add(T, scl(Rb, -0.12)), hb: frame(scl(Fb, -1), scl(Ub, -1)), pole: madd(Rb, -0.6, Ub, -0.7), k: 1 };
          handIK.R = { T: add(T, scl(Rb, 0.12)), hb: frame(scl(Fb, -1), Ub), pole: madd(Rb, 0.6, Ub, -0.7), k: 1 };
        } else {
          if (doorTask.ph === 'locked') T = add(T, scl(Fb, -0.03 * Math.abs(Math.sin((doorTask.t || 0) * 30))));
          if (doorTask.ph === 'open' && doorTask === p.enter) k = N.smooth(0, 0.16, doorTask.t || 0);
          if (doorTask.ph === 'close') k = 1 - N.smooth(0.22, 0.36, doorTask.t || 0);
          handIK[hand] = { T, hb: frame(madd(Fb, -0.8, Ub, 0.4), scl(Rb, side > 0 ? 1 : -1)), pole: madd(Rb, side * 0.6, Ub, -0.7), k };
        }
      }
    }
    if (veh && sit > 0.5 && !inCarShot) {
      const cab = N.cabin(veh.spec);
      carMat(veh, CARM);
      if (cab.bike && veh.driver === p) {
        for (const s of [-1, 1]) handIK[s < 0 ? 'L' : 'R'] = { T: toModel(ap(CARM, [cab.seat.x + s * cab.bars.x, cab.bars.y, cab.bars.z])), hb: frame(madd(Fb, 0.4, Ub, 0.8), scl(Rb, 1)), pole: madd(Rb, s * 0.7, Ub, -0.5, Fb, -0.3), k: 1 };
      } else if (!cab.bike && veh.driver === p) {
        const ws = cab.wheel;
        M3.mul(CARM, M3.euler(-ws.tilt, 0, -(veh.steer || 0) * 2.4, ws.x, ws.y, ws.z, st.tmp), WHM);
        let short = -1;
        for (const s of [-1, 1]) {
          const a = s < 0 ? Math.PI - 0.5 : 0.5, c = Math.cos(a), sn = Math.sin(a);
          const rim = toModel(ap(WHM, [c * ws.r, sn * ws.r, 0]));
          const dir = l => sub(toModel(ap(WHM, [c * ws.r + l[0], sn * ws.r + l[1], l[2]])), rim);
          const Y = nrm(madd(dir([c, sn, 0]), -1, dir([0, 0, 1]), 0.45)), Z = scl(dir([-sn, c, 0]), -s), X = cross(Y, Z);
          const T = madd(rim, 1, X, s * GRIP_PALM, Y, GRIP_WRIST), ua = s < 0 ? PB.UAL : PB.UAR;
          short = Math.max(short, len(sub(T, pos(M[ua]))) - Math.abs(piv[ua][1] - piv[ua + 2][1]) + GRIP_SLACK);
          handIK[s < 0 ? 'L' : 'R'] = { T, hb: { x: X, y: Y, z: Z }, pole: madd(Rb, s * 0.75, Ub, -0.6), k: 1 };
        }
        st.reach = N.clamp((st.reach || 0) + short * 1.2, 0, 0.7);
      }
      const da = p.anim && p.anim.doorArm;
      if (da && da.t < 0.42 && veh.door && !cab.bike) {
        const th = (veh.door[da.side < 0 ? 0 : 1] || 0) * 1.15, ry = da.side * th, L0 = cab.door.len - 0.12;
        const T = toModel(ap(CARM, [da.side * (cab.hw - 0.08) + Math.sin(ry) * L0, cab.belt - 0.05, cab.door.z0 + Math.cos(ry) * L0]));
        const hnd = da.side < 0 ? 'L' : 'R';
        handIK[hnd] = { T, hb: frame(madd(Fb, -0.5, Rb, da.side * -0.6), Ub), pole: madd(Rb, da.side * 0.6, Ub, -0.7), k: 1 - N.smooth(0.3, 0.42, da.t) };
      }
    }
    for (const side of ['L', 'R']) {
      const h = handIK[side];
      if (!h || h.k <= 0.001) continue;
      const s = side === 'L' ? -1 : 1;
      const hd = s < 0 ? PB.HANDL : PB.HANDR;
      let T = h.T, hb = h.hb;
      if (h.k < 0.999) {
        const cur = M[hd];
        T = mix(pos(cur), h.T, h.k);
        hb = frame(mix(col(cur, 1), hb.y, h.k), mix(col(cur, 0), hb.x, h.k));
      }
      solveArm(M, piv, s, T, hb, h.pole || poleDef(s));
    }
    RES.wpn = null;
    RES.parts.length = 0;
    if (showWeapon) {
      if (Wm) {
        if (!two && handIK.R && handIK.R.k < 0.999) {
          const hr = frame(H.R.y, H.R.x);
          M3.mul(M[PB.HANDR], inv(basis(st.Mg, hr.x, hr.y, hr.z, scl(hr.y, H.R.d)), st.Pm), WPN);
        }
      } else if (H) {
        const hr = frame(H.R.y, H.R.x);
        M3.mul(M[PB.HANDR], inv(basis(st.Mg, hr.x, hr.y, hr.z, scl(hr.y, H.R.d)), st.Pm), WPN);
      } else {
        const o = HANDW[wid] || [0, -0.08, 0];
        M3.mul(M[PB.HANDR], M3.euler(0, 0, 0, o[0], o[1], o[2], st.tmp), WPN);
      }
      RES.wpn = M3.mul(root, WPN, st.W);
      const slot = p.weapons && p.weapons[wid];
      const loaded = slot ? slot.clip > 0 : p.clip !== 0;
      for (const q of N.Models.wparts(wid)) {
        const out = PSLOT[RES.parts.length];
        if (!out) break;
        if (q.kind === 'mag') {
          const mm = ru >= 0 && RL && RL.mag ? magMode(RL, ru) : { mode: q.hidden || W.rocket && !loaded ? 'none' : 'gun', u0: 0, u1: 1 };
          if (mm.mode === 'none') continue;
          if (mm.mode === 'gun') M3.mul(RES.wpn, M3.euler(0, 0, 0, q.at[0], q.at[1], q.at[2], st.tmp), out.m);
          else if (mm.mode === 'drop') { const f = (ru - mm.u0) * W.reload; M3.mul(RES.wpn, M3.euler(0, 0, 0, q.at[0], q.at[1] - 4.9 * f * f - 0.04, q.at[2], st.tmp), out.m); }
          else if (mm.mode === 'feed') { const d = (1 - N.smooth(0, 1, (ru - mm.u0) / (mm.u1 - mm.u0))) * 0.22; M3.mul(RES.wpn, M3.euler(0, 0, 0, q.at[0], q.at[1], q.at[2] - d, st.tmp), out.m); }
          else { M3.mul(root, M[PB.HANDL], st.Pm); M3.mul(st.Pm, M3.euler(0.2, 0, 0, 0, -0.07, -0.01, st.tmp), out.m); }
        } else M3.mul(RES.wpn, partLocal(q, amt[q.name] || 0, st.tmp), out.m);
        out.mb = q.mb;
        RES.parts.push(out);
      }
    }
    const Gw = st.G;
    for (let b = 0; b < NB; b++) M3.mul(root, M[b], Gw[b]);
    RES.G = Gw;
    RES.item = eating ? M3.mul(Gw[PB.HANDR], M3.euler(0.35, 0, 0, 0.0, -0.075, 0.0, st.tmp), ITEM) : null;
    return RES;
  };

  N.pedRoot = (p, o) => M3.euler(0, -(p.yaw || 0), 0, p.x, p.y, p.z, o);

  N.PED_EYE = [0, 0.216, -0.13];
  N.pedEye = (G, look) => ap(G[PB.HEAD], [N.PED_EYE[0], N.PED_EYE[1] * ((look && look.tall) || 1), N.PED_EYE[2]]);

  const HEADLESS = Array.from({ length: NB }, () => M3.mat());
  N.headless = G => {
    for (let b = 0; b < NB; b++) HEADLESS[b].set(G[b]);
    HEADLESS[PB.HEAD].fill(0, 0, 9);
    return HEADLESS;
  };

  N.Anim = { hold, keys, solveArm, frame, reloadOf, RELOADS };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
