(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;

  const ID = 'pAmPaRam98';
  const DURATION = 10.54;
  const CUTS = [0];
  const P_Y = 0.92;
  const STRIDE = 1.15;

  const VOICE = K.envelope('000000000000000000000000000000000000000000000000000000000000000000000esSZZZZZVXZYZZZZZZZVRZTZZZZZZZZZOLZXZUYUXVURFGADsse00000BZZZTKyBvqoIZVSWZYUORPNTVZTEokgf000000000000000000000wXZZTOXPKSRZZPMZZWZUTSTPHFFwEysm0', 20);
  const BASS = K.envelope('0000000gSJAGFFCLECFABLDFHMHADKLBOMJRIKOJJIEJOIFEPHIQSFHJJLHIOMQMSLLRQYQzjdbcpBDxBpglulgoptoqngiihfihoxDqzsAxwxvEFSRRPYZl4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', 20);

  const PATH = [
    [0.0, [-1.55, -0.58], 0.12],
    [1.0, [-1.05, -0.18], 0.18],
    [2.0, [-0.45, 0.08], 0.22],
    [3.5, [0.42, 0.24], 0.18],
    [5.0, [1.35, 0.32], 0.14],
    [6.2, [2.12, 0.36], -0.18],
    [7.5, [2.95, 0.38], 0.08],
    [8.35, [3.48, 0.4], 0.02],
    [10.54, [3.54, 0.42], 0.0]
  ];

  function pathAt(t) {
    if (t <= PATH[0][0]) return { pos: PATH[0][1].slice(), yaw: PATH[0][2] };
    for (let i = 1; i < PATH.length; i++) {
      if (t <= PATH[i][0]) {
        const [t0, p0, y0] = PATH[i - 1];
        const [t1, p1, y1] = PATH[i];
        const u = clamp((t - t0) / (t1 - t0), 0, 1);
        const k = i >= PATH.length - 2 ? ease(u) : u;
        return {
          pos: [lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k)],
          yaw: lerp(y0, y1, ease(u))
        };
      }
    }
    const last = PATH[PATH.length - 1];
    return { pos: last[1].slice(), yaw: last[2] };
  }

  const DIST = (() => {
    const step = 0.05;
    const n = Math.ceil(DURATION / step) + 2;
    const d = new Float32Array(n);
    let prev = pathAt(0).pos;
    for (let i = 1; i < n; i++) {
      const p = pathAt(i * step).pos;
      d[i] = d[i - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      prev = p;
    }
    return { step, d };
  })();

  function distAt(t) {
    const x = clamp(t, 0, DURATION) / DIST.step;
    const i = Math.min(DIST.d.length - 2, Math.floor(x));
    return lerp(DIST.d[i], DIST.d[i + 1], x - i);
  }

  function speedAt(t) {
    return (distAt(t + 0.12) - distAt(t - 0.12)) / 0.24;
  }

  const POCKET_L = { hL: [0.28, -0.2, 0.22], eL: [0.95, 0.02, -0.1], gL: 'pocket', wL: [0, 0, 0] };
  const POCKET_R = { hR: [-0.28, -0.2, 0.22], eR: [-0.95, 0.02, -0.1], gR: 'pocket', wR: [0, 0, 0] };
  const POCKETS = Object.assign({}, POCKET_L, POCKET_R);

  const BEATS = [
    [0.0, Object.assign({}, POCKETS, {
      sp: [0.04, 0, 0], nk: [0.02, 0, 0],
      hL: [0.52, -0.2, 0.1], eL: [0.75, -0.1, -0.25], gL: 'open',
      hR: [-0.34, -0.21, 0.18], eR: [-0.82, -0.05, -0.2], gR: 'open',
      eyes: 'open', gesture: 'intro'
    })],
    [0.45, {
      hL: [0.68, -0.08, 0.08], eL: [0.8, 0.0, -0.18], gL: 'open',
      hR: [-0.3, -0.2, 0.2], eR: [-0.88, 0.0, -0.15], gR: 'pocket'
    }],
    [1.15, Object.assign({}, POCKETS, {
      sp: [0.05, 0.04, 0], nk: [0.02, -0.04, 0], eyes: 'half', gesture: 'walk'
    })],
    [2.4, Object.assign({}, POCKETS, {
      sp: [0.05, -0.04, 0], nk: [0.03, 0.04, 0], eyes: 'open', gesture: 'walk'
    })],
    [3.48, Object.assign({}, POCKETS, {
      sp: [0.04, 0.02, 0], nk: [0.02, -0.02, 0], eyes: 'open', gesture: 'pam1'
    })],
    [4.6, Object.assign({}, POCKETS, {
      sp: [0.05, -0.05, 0.02], nk: [0.03, 0.05, -0.02], eyes: 'half', gesture: 'pam1'
    })],
    [5.85, Object.assign({}, POCKETS, {
      sp: [0.04, -0.12, -0.03], nk: [0.02, -0.22, 0.02], eyes: 'side', gesture: 'turn'
    })],
    [6.3, Object.assign({}, POCKETS, {
      sp: [0.04, -0.08, -0.02], nk: [0.01, -0.14, 0.01], eyes: 'open', gesture: 'pam2'
    })],
    [7.35, Object.assign({}, POCKETS, {
      sp: [0.03, -0.02, 0], nk: [0.01, -0.02, 0], eyes: 'open', gesture: 'pam2'
    })],
    [8.2, Object.assign({}, POCKETS, {
      sp: [0.02, 0, 0], nk: [0.01, 0.02, 0], eyes: 'open', gesture: 'stop'
    })],
    [8.68, Object.assign({}, POCKETS, {
      sp: [0.02, 0.02, 0], nk: [0.01, 0.02, 0], eyes: 'open', gesture: 'stop'
    })],
    [8.95, Object.assign({}, POCKET_R, {
      sp: [0.01, -0.03, -0.02], nk: [0.02, 0.02, 0],
      hL: [0.68, 0.26, 0.18], eL: [0.64, -0.26, 0.08], gL: 'wave', wL: [0.18, 1.38, -0.34],
      eyes: 'half', gesture: 'wave'
    })],
    [9.55, Object.assign({}, POCKET_R, {
      sp: [0.01, -0.02, -0.02], nk: [0.02, 0.02, 0],
      hL: [0.7, 0.28, 0.18], eL: [0.65, -0.24, 0.08], gL: 'wave', wL: [0.18, 1.38, -0.28],
      eyes: 'open', gesture: 'wave'
    })],
    [9.95, Object.assign({}, POCKETS, {
      sp: [0.02, 0, 0], nk: [0.02, 0, 0], eyes: 'open', gesture: 'outro'
    })],
    [10.54, Object.assign({}, POCKETS, {
      sp: [0.02, 0, 0], nk: [0.01, 0, 0], eyes: 'open', gesture: 'outro'
    })]
  ];

  const TRACK = (() => {
    let cur = {};
    return BEATS.map(([t, o]) => {
      cur = Object.assign({}, cur, o);
      return [t, cur];
    });
  })();

  function beatAt(t) {
    let lo = 0;
    while (lo + 1 < TRACK.length && TRACK[lo + 1][0] <= t) lo++;
    const [t0, a] = TRACK[lo];
    const nx = TRACK[lo + 1];
    if (!nx || t <= t0) return Object.assign({}, a);
    const [t1, b] = nx;
    const k = ease(clamp((t - t0) / (t1 - t0), 0, 1));
    const out = {};
    Object.keys(a).forEach(key => {
      const va = a[key], vb = b[key];
      if (Array.isArray(va) && Array.isArray(vb)) out[key] = va.map((v, i) => lerp(v, vb[i], k));
      else if (typeof va === 'number' && typeof vb === 'number') out[key] = lerp(va, vb, k);
      else out[key] = k < 0.5 ? va : vb;
    });
    return out;
  }

  function legsAt(t, sp) {
    const ph = (distAt(t) / STRIDE) * PI * 2 + 0.6;
    const k = clamp(sp / 0.55, 0, 1);
    const out = {};
    [['L', 1, 0], ['R', -1, PI]].forEach(([s, side, off]) => {
      const f = ph + off;
      const stepZ = 0.04 + 0.26 * k * S(f);
      const lift = 0.095 * k * Math.max(0, C(f));
      const wideX = side * (0.2 + 0.04 * k * Math.max(0, C(f)));
      out['f' + s] = [wideX, -0.84 + lift, stepZ];
      out['k' + s] = [side * (0.26 + 0.06 * k), 0.05, 1];
      out['a' + s] = 0.12 * k * C(f);
    });
    out.bob = k * 0.032 * C(ph * 2);
    out.sway = k * 0.055 * S(ph);
    out.roll = k * 0.05 * C(ph);
    out.yaw = k * 0.065 * S(ph);
    return out;
  }

  const CAM_TRACK = [
    [0.0, [-1.42, 1.04, 2.65], [-1.45, 0.88, -0.58], 42, 1.38],
    [0.6, [-1.2, 1.02, 2.38], [-1.25, 0.88, -0.35], 42, 1.4],
    [1.8, [-0.52, 0.98, 1.98], [-0.55, 0.92, 0.02], 42, 1.44],
    [3.5, [0.46, 1.03, 2.04], [0.42, 1.0, 0.24], 41, 1.42],
    [5.0, [1.38, 1.06, 2.02], [1.35, 1.04, 0.3], 40, 1.38],
    [6.0, [2.02, 1.08, 1.96], [2.04, 1.08, 0.24], 40, 1.34],
    [7.5, [2.95, 1.1, 1.96], [2.95, 1.1, 0.25], 40, 1.32],
    [8.5, [3.68, 1.1, 1.98], [3.72, 1.08, 0.25], 40, 1.32],
    [9.4, [3.78, 1.1, 1.98], [3.85, 1.08, 0.25], 40, 1.32],
    [10.54, [3.84, 1.1, 1.98], [3.96, 1.08, 0.22], 40, 1.28]
  ];

  function cameraAt(t, bass) {
    let lo = 0;
    while (lo + 1 < CAM_TRACK.length && CAM_TRACK[lo + 1][0] <= t) lo++;
    const [t0, e0, a0, f0, w0] = CAM_TRACK[lo];
    const nx = CAM_TRACK[lo + 1] || CAM_TRACK[lo];
    const [t1, e1, a1, f1, w1] = nx;
    const u = t1 > t0 ? ease(clamp((t - t0) / (t1 - t0), 0, 1)) : 0;
    const eye = e0.map((v, i) => lerp(v, e1[i], u));
    const at = a0.map((v, i) => lerp(v, a1[i], u));
    const fov = lerp(f0, f1, u);
    const wide = lerp(w0, w1, u) + bass * 0.04 * S(t * 18);

    const amp = 0.007 + bass * 0.015;
    const w = K.wobble(t * 2.4, amp, 2.3);
    const pulse = bass * 0.012 * S(t * 24);
    const roll = S(t * 1.9) * 0.01 + bass * 0.015 * C(t * 15);
    return {
      eye: [eye[0] + w[0], eye[1] + w[1] + pulse, eye[2] + w[2] * 0.5],
      at: [at[0] + w[0] * 1.3, at[1] + w[1] * 1.1 + pulse * 0.7, at[2]],
      up: [S(roll), C(roll), 0],
      fov,
      wide
    };
  }

  function faceAt(t, pose) {
    const v = VOICE(t);
    const mouth = v < 0.15 ? (t > 8.7 && t < 9.0 ? 'smirk' : 'shut') : v < 0.52 ? 'open' : 'wide';
    let eyes = pose.eyes || 'open';
    const b = (t * 0.33 + 0.19) % 1;
    if ((eyes === 'open' || eyes === 'side') && b < 0.035) eyes = 'shut';
    return { mouth, eyes };
  }

  function speakerAt(t) {
    if (t >= 3.48 && t < 5.95) return { line: 'Пам-парам', part: 1 };
    if (t >= 6.25 && t < 7.82) return { line: 'Пам-парам', part: 2 };
    if (t >= 8.88 && t < 10.46) return { line: 'Приветствую смотрящих', part: 3 };
    return null;
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const pl = pathAt(tt);
    const sp = speedAt(tt);
    const lg = legsAt(tt, sp);
    const pose = beatAt(tt);
    const v = VOICE(tt);
    const bass = BASS(tt);

    ['fL', 'fR', 'kL', 'kR', 'aL', 'aR'].forEach(k => { pose[k] = lg[k]; });
    const breath = S(tt * 1.8) * 0.01;
    pose.sp = [
      pose.sp[0] + breath + bass * 0.018 * S(tt * 16),
      pose.sp[1] + lg.yaw,
      pose.sp[2] + lg.roll
    ];
    pose.nk = [
      pose.nk[0] + v * 0.04 * S(tt * 11),
      pose.nk[1] + v * 0.025 * S(tt * 7.1) - lg.yaw * 0.65,
      pose.nk[2] - lg.roll * 0.5
    ];

    if (pose.gL === 'wave') {
      const wag = 0.03 * S(tt * 11);
      pose.hL = [pose.hL[0] + wag, pose.hL[1] + 0.012 * C(tt * 11), pose.hL[2]];
    }

    const base = M4.chain(M4.translate(pl.pos[0], P_Y + lg.bob, pl.pos[1]), M4.rotY(pl.yaw), M4.translate(lg.sway, 0, 0));
    pose.p = M4.point(base, [0, 0, 0]);
    pose.up = M4.dir(base, [0, 1, 0]);
    pose.fwd = M4.dir(base, [0, 0, 1]);

    const face = faceAt(tt, pose);
    pose.mouth = face.mouth;
    pose.eyes = face.eyes;

    const m = window.PamparamCast.solve(pose);
    const camera = cameraAt(tt, bass);
    return {
      t: tt,
      pose,
      m,
      world: { x: pl.pos[0], z: pl.pos[1], yaw: pl.yaw, speed: sp },
      camera,
      voice: v,
      bass,
      speaker: speakerAt(tt)
    };
  }

  window.PamparamScript = { ID, DURATION, CUTS, P_Y, VOICE, BASS, TRACK, stage, pathAt, speedAt, speakerAt };
})();
