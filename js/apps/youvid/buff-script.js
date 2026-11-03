(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;

  const ID = 'n33dAbUfF98';
  const DURATION = 23.8;
  const CUTS = [0, 3.461, 5.547, 6.422, 7.382, 13.721, 15.598, 17.183, 19.06, 21.813, 22.772];
  const WHO = ['knight', 'bard', 'knight', 'bard', 'bard', 'knight', 'bard', 'knight', 'bard', 'knight', 'boss'];
  const BEAT0 = 0.07;
  const BEAT = 0.4914;
  const KNIGHT_AT = [0, 0, 0];
  const BARD_AT = [0, 0, 3.4];

  const CAPTIONS = [
    [0.542, 2.127, ['This boss looks formidable'], 0.477],
    [2.127, 3.461, ['Can you help me out?'], 0.477],
    [3.879, 5.547, ['Say no more'], 0.513],
    [14.139, 15.598, ['What’s this yellow aura?'], 0.477],
    [15.807, 17.183, ['It’s a Charisma buff'], 0.499],
    [17.601, 19.06, ['What am I supposed to do', 'with that?!'], 0.477]
  ];

  const TALK = [
    ['knight', 0.22, 1.78, 7],
    ['knight', 2.08, 3.25, 5],
    ['bard', 3.76, 4.6, 3],
    ['knight', 14.05, 15.25, 7],
    ['bard', 15.72, 16.95, 6],
    ['knight', 17.44, 18.9, 10]
  ];

  const BLINKS = [1.32, 2.95, 4.95, 6.05, 8.7, 11.3, 12.9, 14.0, 16.4, 18.95, 20.2, 22.05];

  function hermite(p0, p1, p2, p3, t0, t1, t2, t3, t) {
    const h = t2 - t1;
    const u = clamp((t - t1) / h, 0, 1);
    const u2 = u * u, u3 = u2 * u;
    const m1 = ((p2 - p0) / Math.max(1e-4, t2 - t0)) * h;
    const m2 = ((p3 - p1) / Math.max(1e-4, t3 - t1)) * h;
    return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
  }

  function track(keys) {
    const full = [];
    let cur = {};
    keys.forEach(([t, v]) => {
      cur = Object.assign({}, cur, v);
      full.push([t, cur]);
    });
    const num = (x) => typeof x === 'number';
    return (t) => {
      if (t <= full[0][0]) return Object.assign({}, full[0][1]);
      const n = full.length;
      if (t >= full[n - 1][0]) return Object.assign({}, full[n - 1][1]);
      let i = 1;
      while (i < n && t >= full[i][0]) i++;
      const [t1, a] = full[i - 1], [t2, b] = full[i];
      const [t0, z] = full[Math.max(0, i - 2)], [t3, c] = full[Math.min(n - 1, i + 1)];
      const T0 = i - 2 >= 0 ? t0 : t1 - 1, T3 = i + 1 < n ? t3 : t2 + 1;
      const out = {};
      Object.keys(a).forEach(key => {
        const va = a[key], vb = b[key];
        if (num(va) && num(vb)) {
          out[key] = hermite(num(z[key]) ? z[key] : va, va, vb, num(c[key]) ? c[key] : vb, T0, t1, t2, T3, t);
        } else if (Array.isArray(va) && Array.isArray(vb) && va.length === vb.length && num(va[0])) {
          const za = Array.isArray(z[key]) && z[key].length === va.length ? z[key] : va;
          const cb = Array.isArray(c[key]) && c[key].length === vb.length ? c[key] : vb;
          out[key] = va.map((x, j) => hermite(za[j], x, vb[j], cb[j], T0, t1, t2, T3, t));
        } else {
          out[key] = (t - t1) / (t2 - t1) < 0.5 ? va : vb;
        }
      });
      Object.keys(b).forEach(key => { if (!(key in out)) out[key] = b[key]; });
      return out;
    };
  }

  function W(base, yaw, v) {
    const c = C(yaw), s = S(yaw);
    return [base[0] + v[0] * c + v[2] * s, base[1] + v[1], base[2] - v[0] * s + v[2] * c];
  }

  function body(base, faceYaw, k) {
    const yaw = faceYaw + (k.yaw || 0);
    const M = M4.chain(M4.rotY(yaw), M4.rotX(k.lean || 0), M4.rotZ(k.roll || 0));
    const hip = k.hip || [0, 0];
    const p = W(base, yaw, [hip[0], k.h === undefined ? 0.985 : k.h, hip[1]]);
    const st = k.stance === undefined ? 0.17 : k.stance;
    const fy = k.fy || 0;
    const pose = {
      p,
      up: M4.dir(M, [0, 1, 0]),
      fwd: M4.dir(M, [0, 0, 1]),
      sp: k.sp || [0, 0, 0],
      nk: k.nk || [0, 0, 0],
      gL: k.gL || 'relax',
      gR: k.gR || 'relax',
      fLw: W(base, faceYaw + fy, k.fL || [st, 0.075, 0.02]),
      fRw: W(base, faceYaw - fy, k.fR || [-st, 0.075, 0.02]),
      kLw: W(base, yaw, [st + 0.12 + (k.kneeOut || 0), 0.5, 1.2]),
      kRw: W(base, yaw, [-st - 0.12 - (k.kneeOut || 0), 0.5, 1.2]),
      aL: k.aL || 0,
      aR: k.aR || 0
    };
    ['hL', 'hR', 'eL', 'eR', 'wL', 'wR'].forEach(f => { if (k[f] !== undefined) pose[f] = k[f]; });
    return pose;
  }

  const PALM = [0.2, 2.3, 0.0];

  const KNIGHT = track([
    [0.0, { yaw: 0.48, h: 0.982, stance: 0.16, sp: [0.02, 0.0, 0.0], nk: [-0.28, 0.5, -0.03], hL: [0.26, -0.37, 0.1], eL: [0.6, -0.1, -0.5], wL: [0.1, 0.2, 0.0], hR: [-0.255, -0.44, 0.03], eR: [-0.5, -0.1, -0.7], wR: [0.05, -0.1, 0.0], gL: 'relax', gR: 'relax' }],
    [0.6, { nk: [-0.26, 0.48, -0.02] }],
    [1.05, { nk: [-0.18, 0.36, 0.0] }],
    [1.4, { nk: [-0.02, -0.12, 0.04], sp: [0.02, -0.12, 0.0] }],
    [1.9, { nk: [0.04, -0.2, 0.06], sp: [0.03, -0.16, 0.0] }],
    [2.3, { nk: [0.02, -0.22, 0.09], sp: [0.05, -0.18, 0.0] }],
    [2.9, { nk: [0.04, -0.19, 0.06] }],
    [3.46, { nk: [0.03, -0.2, 0.07] }],
    [5.55, { yaw: 0.12, sp: [0.02, 0.0, 0.0], nk: [0.03, -0.06, 0.02], hL: [0.255, -0.42, 0.06], hR: [-0.255, -0.43, 0.04] }],
    [6.0, { nk: [0.02, -0.04, 0.03] }],
    [6.42, { nk: [0.03, -0.05, 0.02] }],
    [13.72, { yaw: 0.06, sp: [0.2, 0.0, 0.0], nk: [0.52, 0.06, 0.0], hL: [0.17, -0.14, 0.3], eL: [0.6, -0.6, -0.4], wL: PALM, hR: [-0.07, -0.14, 0.31], eR: [-0.6, -0.6, -0.4], wR: PALM, gL: 'cup', gR: 'cup' }],
    [13.98, { sp: [0.14, 0.0, 0.0], nk: [0.42, 0.04, 0.0] }],
    [14.2, { sp: [0.04, 0.0, 0.0], nk: [0.0, 0.0, 0.04], hL: [0.22, -0.12, 0.3], hR: [-0.07, -0.12, 0.32], gL: 'open', gR: 'cup' }],
    [14.8, { nk: [0.03, 0.05, 0.06], hL: [0.24, -0.11, 0.3], hR: [-0.06, -0.12, 0.32] }],
    [15.6, { nk: [0.02, 0.0, 0.05] }],
    [17.18, { yaw: 0.04, sp: [0.03, 0.0, 0.0], nk: [0.0, 0.0, 0.03], hL: [0.24, -0.12, 0.31], hR: [-0.1, -0.12, 0.32], gL: 'open', gR: 'open' }],
    [17.7, { nk: [-0.03, 0.06, -0.03], hL: [0.27, -0.09, 0.32], hR: [-0.13, -0.09, 0.33] }],
    [18.2, { nk: [0.02, -0.07, 0.05], hL: [0.26, -0.11, 0.31], hR: [-0.12, -0.11, 0.32] }],
    [18.7, { nk: [-0.02, 0.05, 0.0], hL: [0.28, -0.08, 0.32], hR: [-0.14, -0.08, 0.33] }],
    [19.06, { nk: [0.0, 0.0, 0.02] }],
    [21.81, { yaw: 0.05, sp: [0.03, 0.0, 0.0], nk: [0.02, 0.0, 0.03], hL: [0.25, -0.12, 0.3], hR: [-0.09, -0.12, 0.31], gL: 'open', gR: 'cup' }],
    [22.3, { nk: [0.03, 0.02, 0.04] }],
    [22.77, { nk: [-0.12, 0.0, 0.0] }]
  ]);

  const UKE_PLAY = { p: [-0.25, 0.01, 0.205], x: [0.93, 0.3, 0.16], z: [-0.12, 0.08, 1.0] };
  const UKE_LIFT = { p: [-0.14, -0.08, 0.26], x: [0.5, 0.86, 0.12], z: [-0.25, 0.05, 1.0] };

  const BARD = track([
    [3.46, { yaw: 0.0, roll: 0.0, h: 0.985, stance: 0.17, sp: [0.0, 0.0, 0.0], nk: [0.02, 0.0, 0.0], hL: [0.26, -0.43, 0.05], eL: [0.5, -0.1, -0.7], wL: [0.0, 0.0, 0.0], hR: [-0.26, -0.42, 0.06], eR: [-0.5, -0.1, -0.7], wR: [0.0, 0.0, 0.0], gL: 'relax', gR: 'relax', beret: [-0.01, 0.2, -0.1], uk: 0 }],
    [3.58, { hR: [-0.2, -0.12, 0.2] }],
    [3.75, { hR: [-0.15, 0.19, 0.22], eR: [-0.3, -1.0, -0.1], wR: [0.0, 1.5, 0.0], gR: 'two', nk: [0.0, 0.0, 0.05] }],
    [4.3, { hR: [-0.14, 0.2, 0.23], nk: [0.02, 0.03, 0.06] }],
    [4.55, { hR: [-0.15, 0.17, 0.22] }],
    [4.85, { hR: [-0.12, -0.18, 0.24], gR: 'relax', wR: [0.0, 0.3, 0.0], sp: [0.04, 0.0, 0.0] }],
    [5.1, { sp: [0.55, -0.12, -0.1], nk: [0.45, 0.0, 0.0], h: 0.95, hip: [0.0, -0.06], hL: [0.24, -0.58, 0.22], hR: [-0.2, -0.5, 0.12] }],
    [5.4, { sp: [1.05, -0.28, -0.22], nk: [0.55, 0.0, 0.0], h: 0.9, hip: [0.0, -0.12], hL: [0.24, -0.66, 0.3], hR: [-0.18, -0.55, 0.15] }],
    [5.55, { sp: [1.1, -0.3, -0.24], nk: [0.55, 0.0, 0.0], h: 0.89, hL: [0.25, -0.68, 0.32] }],
    [6.42, { sp: [0.06, 0.0, 0.0], nk: [0.02, 0.0, 0.03], h: 0.985, hip: [0.0, 0.0], uk: 0.0, hL: [0.26, -0.43, 0.05], hR: [-0.26, -0.42, 0.06], gL: 'fret', gR: 'strum' }],
    [6.62, { sp: [0.03, 0.0, 0.0], uk: 0.45 }],
    [6.86, { sp: [0.02, 0.0, 0.0], uk: 1.0 }],
    [7.38, { nk: [0.04, 0.0, 0.04] }],
    [7.39, { yaw: -0.14, roll: 0.12, sp: [0.32, 0.1, 0.16], nk: [-0.1, -0.05, 0.2], hip: [0.06, 0.0], stance: 0.22 }],
    [7.8, { roll: 0.11, sp: [0.3, 0.1, 0.15], nk: [-0.08, -0.04, 0.2] }],
    [8.3, { roll: 0.07, sp: [0.18, 0.06, 0.12], nk: [-0.03, 0.0, 0.16] }],
    [9.0, { roll: 0.05, sp: [0.1, 0.04, 0.1], nk: [0.0, 0.02, 0.14] }],
    [9.8, { roll: 0.04, sp: [0.08, 0.02, 0.09], nk: [0.02, -0.02, 0.12] }],
    [10.5, { roll: 0.04, sp: [0.07, 0.03, 0.09], nk: [0.02, 0.03, 0.14], stance: 0.24 }],
    [11.4, { roll: 0.02, sp: [0.05, 0.02, 0.05], nk: [0.04, -0.02, 0.06], stance: 0.3, h: 0.95, kneeOut: 0.06 }],
    [12.4, { yaw: -0.04, roll: 0.0, sp: [0.04, 0.0, 0.02], nk: [0.03, 0.02, 0.03], hip: [0.0, 0.0], stance: 0.33, h: 0.94 }],
    [13.72, { sp: [0.04, 0.0, 0.0], nk: [0.03, 0.0, 0.03] }],
    [15.6, { yaw: 0.0, stance: 0.36, h: 0.95, kneeOut: 0.03, sp: [-0.04, 0.0, 0.06], nk: [0.02, 0.06, 0.14], beret: [-0.01, 0.22, -0.12] }],
    [16.3, { sp: [-0.05, 0.03, 0.08], nk: [0.0, 0.08, 0.16] }],
    [17.18, { sp: [-0.04, 0.0, 0.05], nk: [0.02, 0.04, 0.1] }],
    [19.06, { stance: 0.36, h: 0.95, sp: [-0.03, 0.0, 0.04], nk: [0.02, 0.02, 0.08] }],
    [19.8, { sp: [-0.02, 0.03, -0.02], nk: [0.03, -0.04, 0.02] }],
    [20.5, { sp: [-0.03, -0.03, 0.04], nk: [0.02, 0.03, 0.08] }],
    [20.9, { sp: [0.08, 0.0, 0.02], nk: [0.5, 0.0, 0.16], beret: [-0.01, 0.3, -0.3] }],
    [21.3, { sp: [0.12, 0.02, 0.0], nk: [0.72, -0.05, 0.12], beret: [-0.01, 0.32, -0.36] }],
    [21.81, { sp: [0.1, 0.0, 0.0], nk: [0.6, 0.0, 0.1] }]
  ]);

  const CAMS = [
    { eye: [0.03, 1.47, 3.15], at: [0.0, 1.36, 0], fov: 36 },
    { eye: [0.0, 1.52, 0.35], at: [0.0, 1.37, 3.4], fov: 36 },
    { eye: [-0.06, 1.46, 3.2], at: [-0.04, 1.33, 0], fov: 36 },
    { eye: [0.0, 1.52, 0.35], at: [0.0, 1.37, 3.4], fov: 36 },
    null,
    { eye: [0.03, 1.42, 3.05], at: [0.03, 1.335, 0], fov: 36 },
    { eye: [0.0, 1.42, 0.25], at: [0.0, 1.34, 3.4], fov: 36 },
    { eye: [0.03, 1.42, 3.05], at: [0.03, 1.335, 0], fov: 36 },
    { eye: [0.04, 1.42, 0.25], at: [0.04, 1.34, 3.4], fov: 36 },
    { eye: [0.03, 1.42, 3.05], at: [0.03, 1.335, 0], fov: 36 },
    { eye: [0.0, 1.05, 2.1], at: [0.15, 1.72, 0], fov: 42 }
  ];

  const CLOSE = track([
    [7.38, { eye: [-0.1, 1.4, 1.35], at: [-0.02, 1.34] }],
    [8.4, { eye: [-0.08, 1.39, 1.25], at: [0.0, 1.33] }],
    [9.0, { eye: [-0.07, 1.38, 1.17], at: [0.0, 1.32] }],
    [10.5, { eye: [-0.06, 1.42, 1.02], at: [0.0, 1.36] }],
    [12.5, { eye: [-0.01, 1.38, 0.55], at: [0.0, 1.31] }],
    [13.72, { eye: [0.0, 1.39, 0.48], at: [0.0, 1.33] }]
  ]);

  function shotAt(t) {
    let i = 0;
    while (i + 1 < CUTS.length && t >= CUTS[i + 1]) i++;
    return i;
  }

  function beatPhase(t) {
    return (t - BEAT0) / BEAT;
  }

  function talkAt(who, t) {
    for (const [w, t0, t1, n] of TALK) {
      if (w !== who || t < t0 || t > t1) continue;
      const u = (t - t0) / (t1 - t0);
      const syl = Math.abs(S(PI * n * u));
      const env = clamp(u / 0.08, 0, 1) * clamp((1 - u) / 0.08, 0, 1);
      return syl * env * (0.75 + 0.25 * S(t * 9.1 + n));
    }
    return 0;
  }

  function mouthOf(v, rest) {
    if (v < 0.22) return rest || 'shut';
    return v < 0.62 ? 'open' : 'wide';
  }

  function eyesAt(t) {
    return BLINKS.some(b => t >= b && t < b + 0.11) ? 'shut' : BLINKS.some(b => (t >= b - 0.04 && t < b) || (t >= b + 0.11 && t < b + 0.16)) ? 'half' : 'open';
  }

  function auraAt(t, who) {
    if (who === 'boss') return 0;
    if (t < 7.95) return 0;
    if (who === 'knight') return 1;
    return ease((t - 7.95) / 1.7);
  }

  function knightPose(t) {
    const k = KNIGHT(t);
    const pose = body(KNIGHT_AT, 0, k);
    const breath = S(t * 2.1) * 0.006;
    pose.p = [pose.p[0], pose.p[1] + breath * 0.4, pose.p[2]];
    pose.sp = [pose.sp[0] + breath, pose.sp[1], pose.sp[2]];
    pose.mouth = mouthOf(talkAt('knight', t), t > 21.9 ? 'open' : 'shut');
    pose.eyes = t > 22.6 ? 'wide' : eyesAt(t);
    return pose;
  }

  function strum(t) {
    const ph = beatPhase(t) * 2;
    const f = ph - Math.floor(ph);
    return Math.floor(ph) % 2 === 0 ? 1 - 2 * ease(f) : -1 + 2 * ease(f);
  }

  function bardPose(t) {
    const k = BARD(t);
    const pose = body(BARD_AT, PI, k);
    const playing = t >= 6.42;
    const groove = playing ? S(beatPhase(t) * PI) : 0;
    pose.p = [pose.p[0], pose.p[1] - Math.abs(groove) * 0.008, pose.p[2]];
    pose.nk = [pose.nk[0] + (playing ? Math.abs(groove) * 0.05 : 0), pose.nk[1], pose.nk[2]];
    pose.beret = k.beret;
    pose.mouth = mouthOf(talkAt('bard', t), t > 9 && t < 15.5 ? 'smile' : 'shut');
    pose.eyes = eyesAt(t + 0.37);
    if (playing) {
      const u = clamp(k.uk, 0, 1);
      const L = (a, b) => a.map((v, i) => lerp(v, b[i], ease(u)));
      pose.uke = { p: L(UKE_LIFT.p, UKE_PLAY.p), x: L(UKE_LIFT.x, UKE_PLAY.x), z: L(UKE_LIFT.z, UKE_PLAY.z) };
      const s = strum(t) * (u > 0.9 ? 1 : 0);
      pose.play = { r: [0.15, 0.075 + s * 0.035, 0.075], l: [0.385, -0.05, -0.005] };
      pose.eR = [-0.55, -0.75, -0.3];
      pose.eL = [0.4, -0.85, -0.2];
      pose.wR = [0.75, -0.3, 0.4];
      pose.wL = [-0.3, 1.2, 0.2];
      pose.gL = 'fret';
      pose.gR = 'strum';
    }
    return pose;
  }

  function bossAt(t, shot) {
    if (shot === 9 && t > 22.6) {
      const k = clamp((t - 22.6) / 0.172, 0, 1);
      return { y: lerp(2.62, 1.95, k * k), blur: 0, falling: true };
    }
    if (shot === 10) {
      const k = clamp((t - 22.772) / 0.11, 0, 1);
      return { drop: (1 - k) * (1 - k) * 0.55 - 0.012 * S(clamp((t - 22.88) / 0.25, 0, 1) * PI), blur: 1 - clamp((t - 22.86) / 0.4, 0, 1) };
    }
    return null;
  }

  function dustAt(t) {
    if (t < 22.772) return 0;
    const u = t - 22.772;
    return clamp(u / 0.1, 0, 1) * (1 - clamp((u - 0.45) / 0.7, 0, 0.62));
  }

  function shakeAt(t) {
    if (t < 22.772) return [0, 0, 0];
    const u = t - 22.772;
    const a = 0.09 * Math.exp(-u * 4.5);
    return [S(u * 71) * a, C(u * 53) * a * 1.3, S(u * 37 + 1) * a * 0.4];
  }

  function cameraAt(t, shot) {
    if (shot === 4) {
      const v = CLOSE(t);
      return { eye: v.eye, at: [v.at[0], v.at[1], 3.4], fov: 36 };
    }
    const c = CAMS[shot];
    const sway = K.wobble(t * 0.5, 0.004, shot + 1);
    const out = { eye: [c.eye[0] + sway[0], c.eye[1] + sway[1], c.eye[2]], at: c.at.slice(), fov: c.fov };
    if (shot === 10) {
      const sh = shakeAt(t);
      out.eye = [out.eye[0] + sh[0], out.eye[1] + sh[1], out.eye[2]];
      out.at = [out.at[0] + sh[0] * 1.4, out.at[1] + sh[1] * 1.6, out.at[2]];
    }
    return out;
  }

  function captionAt(t) {
    const c = CAPTIONS.find(([t0, t1]) => t >= t0 && t < t1);
    return c ? { lines: c[2], y: c[3] } : null;
  }

  function stage(t) {
    const shot = shotAt(t);
    const who = WHO[shot];
    return {
      shot,
      who,
      camera: cameraAt(t, shot),
      knight: who === 'knight' ? knightPose(t) : null,
      bard: who === 'bard' ? bardPose(t) : null,
      aura: auraAt(t, who),
      caption: captionAt(t),
      boss: bossAt(t, shot),
      bossCam: shot === 10 ? CAMS[10] : null,
      dust: dustAt(t),
      beat: beatPhase(t)
    };
  }

  function VOICE(t) {
    return Math.max(talkAt('knight', t), talkAt('bard', t));
  }

  window.BuffScript = { ID, DURATION, CUTS, WHO, CAPTIONS, TALK, BEAT0, BEAT, KNIGHT_AT, BARD_AT, stage, shotAt, VOICE, knightPose, bardPose, cameraAt };
})();
