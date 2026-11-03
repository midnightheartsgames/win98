(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Heavy = window.MeetHeavy;
  const Props = window.MeetProps;
  const FP = window.FabPose;
  const Fab = window.FabCast;
  const Voice = window.MeetVoice;

  const ID = 'M33tTh3H3vy';
  const DURATION = 88.84;
  const CUTS = [0, 1.165, 4.287, 4.994, 7.367, 35.797, 36.255, 38.045, 40.875, 49.533, 65.767, 68.722, 68.972, 76.798, 80.502, 81.127, 81.751, 82.375, 83.0, 85.414];

  const jawV = K.envelope(Voice.JAW, Voice.RATE);
  const rndV = K.envelope(Voice.ROUND, Voice.RATE);

  function spline(keys) {
    const n = keys.length;
    const arr = Array.isArray(keys[0][1]);
    const val = (k) => (arr ? k[1] : [k[1]]);
    return (t) => {
      let out;
      if (t <= keys[0][0]) out = val(keys[0]).slice();
      else if (t >= keys[n - 1][0]) out = val(keys[n - 1]).slice();
      else {
        let i = 0;
        while (i < n - 2 && t > keys[i + 1][0]) i++;
        const a = keys[Math.max(0, i - 1)], b = keys[i], c = keys[i + 1], d = keys[Math.min(n - 1, i + 2)];
        const h = c[0] - b[0], u = (t - b[0]) / h;
        const u2 = u * u, u3 = u2 * u;
        const va = val(a), vb = val(b), vc = val(c), vd = val(d);
        out = vb.map((_, j) => {
          const m1 = (vc[j] - va[j]) / Math.max(1e-6, c[0] - a[0]) * h;
          const m2 = (vd[j] - vb[j]) / Math.max(1e-6, d[0] - b[0]) * h;
          return (2 * u3 - 3 * u2 + 1) * vb[j] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * vc[j] + (u3 - u2) * m2;
        });
      }
      return arr ? out : out[0];
    };
  }

  function steps(keys, dur) {
    return (t) => {
      let i = 0;
      while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
      const cur = keys[i][1];
      if (i === 0) return cur;
      const k = ease((t - keys[i][0]) / (keys[i][2] || dur || 0.3));
      const prev = keys[i - 1][1];
      return Array.isArray(cur) ? cur.map((v, j) => lerp(prev[j], v, k)) : lerp(prev, cur, k);
    };
  }

  const X = {
    calm: [0.35, 0, 0, 0.05, 0, 0, 0, 0, 0.55, 0.35, 0],
    stern: [0.75, 0, 0, 0, 0.15, 0, 0, 0, 0.45, 0.4, 0],
    proud: [0.15, 0.35, 0, 0.3, 0, 0, 0, 0, 0.6, 0.35, 0],
    smirk: [0.5, 0, 0, 0.45, 0, 0.2, 0, 0.1, 0.5, 0.45, 0],
    grin: [0.45, 0, 0, 0.8, 0, 0.6, 0, 0, 0.45, 0.55, 0.08],
    raised: [0, 0.8, 0, 0.1, 0, 0, 0, 0, 0.75, 0.3, 0],
    menace: [1.0, 0, 0, 0, 0.1, 0.1, 0, 0.2, 0.38, 0.45, 0],
    laugh: [0, 0.1, 0.6, 1.0, 0, 0.8, 0, 0, 0.18, 0.85, 0.5],
    wipe: [0, 0, 0.7, 0.8, 0, 0.5, 0, 0, 0.12, 0.9, 0.3],
    glare: [0.95, 0, 0, 0, 0.25, 0.15, 0, 0.15, 0.5, 0.4, 0],
    shout: [1.0, 0, 0, 0, 0, 0.55, 0, 0.3, 0.75, 0.3, 0.2],
    crazy: [0.85, 0, 0, 0.25, 0, 0.35, 0, 0, 0.92, 0.2, 0],
    roar: [1.0, 0, 0, 0, 0, 0.7, 0, 0.45, 0.55, 0.4, 0.75],
    maniac: [0, 0.45, 0.2, 1.0, 0, 1.0, 0, 0, 0.95, 0.25, 0.55],
    grim: [0.85, 0, 0, 0, 0.35, 0.3, 0, 0.25, 0.55, 0.4, 0]
  };

  const FACE = steps([
    [0, X.calm], [7.4, X.stern], [10.6, X.calm], [13.2, X.smirk], [15.8, X.stern], [18.6, X.proud], [21.4, X.smirk], [22.2, X.grin],
    [23.6, X.stern], [26.4, X.menace], [28.7, X.raised], [30.8, X.stern], [32.4, X.menace], [35.0, X.smirk], [35.75, X.laugh, 0.15],
    [38.8, X.wipe], [40.1, X.smirk], [40.9, X.glare, 0.2], [42.7, X.menace], [46.6, X.shout, 0.2], [49.2, X.stern], [49.6, X.calm],
    [52.2, X.stern], [55.0, X.smirk], [58.4, X.calm], [60.2, X.stern], [61.5, X.crazy], [64.4, X.grin], [65.8, X.roar, 0.1],
    [70.3, X.maniac, 0.2], [71.6, X.roar], [76.8, X.grim], [80.5, X.grim, 0.01]
  ], 0.3);

  const BLINKS = [8.9, 11.9, 14.2, 17.3, 20.5, 24.1, 27.3, 30.2, 33.5, 41.6, 44.9, 48.6, 50.4, 53.6, 57.2, 59.6, 62.4, 67.9, 80.9, 82.2];

  function blinkAt(t) {
    let v = 0;
    BLINKS.forEach(b => {
      const d = Math.abs(t - b);
      if (d < 0.09) v = Math.max(v, 1 - d / 0.09);
    });
    return v;
  }

  const LOOK = steps([
    [0, [0, 0]], [8.3, [0.05, -0.25]], [9.3, [0, 0]], [14.0, [-0.15, -0.2]], [15.3, [0, 0]], [43.0, [0.05, -0.3]], [46.6, [0, 0]],
    [58.6, [0.15, 0.05]], [60.6, [0, 0]], [66, [0, 0.05]]
  ], 0.18);

  function faceAt(t, extra) {
    const e = FACE(t);
    const v = jawV(t);
    const talk = clamp(v * 0.95, 0, 1);
    const f = {
      browDown: e[0], browUp: e[1], browInUp: e[2], smile: e[3], frown: e[4], wide: e[5], round: clamp(rndV(t) * 0.8 * (1 - e[5]), 0, 1), sneer: e[7],
      lidU: e[8], lidL: e[9], jaw: clamp(e[10] + talk * (0.75 - e[10] * 0.4), 0, 1.15), blink: blinkAt(t), look: LOOK(t)
    };
    return Object.assign(f, extra || {});
  }

  const TABLE_Y = 0.74;
  const TABLE_M = M4.chain(M4.translate(0, 0, 0.5), M4.scale(1.1, 0.74 / 0.79, 1.1));
  const GUN_REST = [0.1, TABLE_Y + Props.BOTTOM, 0.22];

  function gunOnTable(t) {
    const e = ease((t - 7.37) / 0.55);
    const lift = t < 7.37 ? 1 : 1 - e;
    return M4.chain(M4.translate(GUN_REST[0] + 0.12 * lift, GUN_REST[1] + 0.32 * lift, GUN_REST[2] - 0.05 * lift), M4.rotY(0.04), M4.rotZ(0.22 * lift));
  }

  function legsSeated(pose, p, yaw) {
    const fwd = [S(yaw), 0, C(yaw)], side = [C(yaw), 0, -S(yaw)];
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const hip = V3.add(p, V3.mul(side, k * 0.2));
      pose['f' + s + 'w'] = [hip[0] + fwd[0] * 0.48, 0.08, hip[2] + fwd[2] * 0.48];
      pose['k' + s + 'w'] = V3.add(hip, [fwd[0] * 1.5 + side[0] * k * 0.3, 0.6, fwd[2] * 1.5 + side[2] * k * 0.3]);
    });
    return pose;
  }

  function legsStanding(pose, p, yaw, spread) {
    const fwd = [S(yaw), 0, C(yaw)], side = [C(yaw), 0, -S(yaw)];
    const base = p[1] - 1.02;
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const f = V3.add(p, V3.add(V3.mul(side, k * (0.19 + (spread || 0))), V3.mul(fwd, 0.04)));
      pose['f' + s + 'w'] = [f[0], base + 0.075, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.4 + side[0] * k * 0.2, base + 0.6, fwd[2] * 1.4 + side[2] * k * 0.2]);
    });
    return pose;
  }

  function body(o) {
    const yaw = o.yaw || 0;
    const pose = { p: o.p, fwd: [S(yaw), 0, C(yaw)], up: o.up || [0, 1, 0], sp: o.sp || [0, 0, 0], nk: o.nk || [0, 0, 0], eL: [0.85, -0.75, -0.15], eR: [-0.85, -0.75, -0.15] };
    if (o.hL) pose.hLw = o.hL;
    if (o.hR) pose.hRw = o.hR;
    if (o.eL) pose.eL = o.eL;
    if (o.eR) pose.eR = o.eR;
    if (o.sit) legsSeated(pose, o.p, yaw); else legsStanding(pose, o.p, yaw, o.spread);
    return pose;
  }

  function handOn(M0, local, fingersL, palmL, pose, lift) {
    const M = Props.gunM(M0);
    const pos = M4.point(M, local);
    const fingers = V3.norm(M4.dir(M, fingersL));
    const palm = V3.norm(M4.dir(M, palmL));
    const wrist = V3.sub(pos, V3.mul(fingers, 0.075 + (lift || 0)));
    const up = V3.mul(palm, -0.035);
    return { target: V3.add(wrist, up), fingers, palm, pose };
  }

  function freeHand(pos, fingers, palm, pose) {
    return { target: pos, fingers: V3.norm(fingers), palm: V3.norm(palm), pose };
  }

  function heavyState(pose, hands, extra) {
    const p = Object.assign({}, pose);
    if (hands.L) p.hLw = hands.L.target;
    if (hands.R) p.hRw = hands.R.target;
    const m = Heavy.solve(p);
    const hm = {};
    ['L', 'R'].forEach(s => {
      const h = hands[s];
      if (!h) return;
      hm[s] = { pose: h.pose, M: h.free ? null : Heavy.handBasis(m.pts['wrist' + s], h.fingers, h.palm) };
    });
    return Object.assign({ pose: p, m, hands: hm }, extra || {});
  }

  function headPos(st, off) {
    return M4.point(st.m.head, off || [0, 0, 0]);
  }

  const SEAT = [0.0, 0.78, -0.27];

  function introState(t) {
    const G = gunOnTable(t);
    const sit = ease((t - 9.45) / 0.9);
    const p = V3.lerp([0.02, 0.98, -0.24], SEAT, sit);
    const lean = spline([[7.37, 0.12], [7.9, 0.42], [9.3, 0.5], [10.3, 0.3], [15.6, 0.28], [19.5, 0.3], [20.3, 0.42], [21.5, 0.5], [22.2, 0.52], [35.8, 0.5]])(t);
    const twist = spline([[7.37, 0.0], [9.0, 0.1], [10.5, -0.05], [16.0, -0.12], [19.5, -0.04], [21.5, 0.0], [35.8, 0.02]])(t);
    const nk = spline([[7.37, [-0.18, 0, 0]], [8.0, [-0.1, 0.05, 0]], [8.6, [0.25, -0.15, 0.1]], [9.3, [0.3, -0.25, 0.15]], [10.2, [-0.05, -0.15, 0]], [11.0, [-0.18, -0.12, 0.02]],
      [12.0, [-0.3, -0.1, 0.05]], [13.0, [-0.2, -0.1, 0]], [14.4, [0.05, -0.25, 0.05]], [15.4, [-0.15, -0.15, 0]], [17.0, [-0.2, -0.05, -0.05]], [18.5, [-0.25, 0.0, 0]],
      [19.8, [-0.18, -0.1, 0.05]], [20.8, [-0.1, -0.2, 0.18]], [21.6, [-0.25, -0.12, 0.1]], [22.3, [-0.42, -0.06, 0.05]], [24.0, [-0.38, 0.02, -0.03]], [26.4, [-0.3, 0.05, 0]],
      [28.7, [-0.42, 0.02, 0.05]], [31.0, [-0.35, -0.04, 0]], [32.6, [-0.28, 0.0, -0.05]], [34.5, [-0.33, 0.04, 0]], [35.8, [-0.3, 0.06, 0.05]]])(t);
    const pose = body({ p, sit: sit > 0.5, sp: [lean, twist, 0], nk });
    const rest = handOn(G, [-0.33, 0.12, 0.0], [0.15, -0.6, 1], [0, -1, 0.2], 'drape');
    const restL = handOn(G, [0.04, 0.17, -0.03], [0.3, -0.5, 1], [0, -1, 0.15], 'drape');
    const flatR = handOn(G, [-0.12, 0.17, 0.0], [0.2, -0.65, 1], [0, -1, 0.1], 'drape');
    const flatL = handOn(G, [0.22, 0.13, 0.02], [-0.1, -0.6, 1], [0, -1, 0.1], 'drape');
    let hR = rest, hL = restL;
    if (t > 20.4) {
      const k = ease((t - 20.4) / 0.8);
      hR = blendHand(rest, flatR, k);
      hL = blendHand(restL, flatL, k);
    }
    if (t > 15.5 && t < 19.6) {
      const up = ease((t - 15.5) / 0.5) * (1 - ease((t - 19.0) / 0.6));
      const wob = S((t - 15.5) * 3.1) * 0.04;
      const gesture = t < 16.9
        ? freeHand([-0.42 + wob, 1.12, 0.12], [-0.6, 0.35, 1], [0.6, 0.6, 0.4], 'open')
        : freeHand([-0.38, 1.15 + wob, 0.18], [-0.35, 0.25, 1], [0.7, -0.3, 0.3], 'point');
      hR = blendHand(rest, gesture, up);
    }
    const spin = 0;
    return heavyState(pose, { L: hL, R: hR }, { gun: { M: G, spin } });
  }

  function blendHand(a, b, k) {
    if (k <= 0) return a;
    if (k >= 1) return b;
    return { target: V3.lerp(a.target, b.target, k), fingers: V3.norm(V3.lerp(a.fingers, b.fingers, k)), palm: V3.norm(V3.lerp(a.palm, b.palm, k)), pose: k < 0.5 ? a.pose : b.pose };
  }

  const WAREHOUSE_ENV = {
    key: { dir: [0.55, -0.42, -0.72], col: [1.3, 1.08, 0.9] },
    ambTop: [0.24, 0.23, 0.28], ambBot: [0.1, 0.08, 0.09], warp: [0.62, 0.28, 0.22], rim: [0.6, 0.68, 0.88], rimPow: 3,
    points: [{ pos: [1.8, 2.2, -1.4], col: [0.42, 0.48, 0.62], k: 0.3 }, { pos: [-2.2, 2.0, 2.5], col: [0.3, 0.24, 0.2], k: 0.2 }],
    fogCol: [0.08, 0.06, 0.07], fog: [5, 16], clear: [0.05, 0.04, 0.05], grade: [1.0, 0.98, 1.0, 0.04], vig: 0.35
  };

  const LOW_ENV = Object.assign({}, WAREHOUSE_ENV, {
    key: { dir: [0.6, -0.55, -0.55], col: [1.15, 1.0, 0.85] },
    ambTop: [0.42, 0.38, 0.38], rim: [0.75, 0.72, 0.68], fog: [4, 14], fogCol: [0.2, 0.16, 0.14]
  });

  const BATTLE_ENV = {
    key: { dir: [-0.35, -0.75, 0.55], col: [1.15, 1.05, 0.9] },
    ambTop: [0.55, 0.62, 0.72], ambBot: [0.42, 0.34, 0.27], warp: [0.75, 0.42, 0.32], rim: [0.7, 0.8, 0.95], rimPow: 2.6,
    points: [], fogCol: [0.7, 0.86, 0.94], fog: [30, 150], clear: [0.6, 0.82, 0.95], grade: [1.03, 1.0, 0.98, 0.05], vig: 0.2
  };

  const LINEUP_ENV = {
    key: { dir: [0.4, -0.5, -0.75], col: [1.0, 0.95, 0.9] },
    ambTop: [0.55, 0.55, 0.55], ambBot: [0.3, 0.28, 0.27], warp: [0.7, 0.38, 0.32], rim: [0.6, 0.6, 0.62], rimPow: 3,
    points: [], fogCol: [0.55, 0.53, 0.5], fog: [12, 40], clear: [0.5, 0.48, 0.45], grade: [1, 1, 1, 0.05], vig: 0.25
  };

  function cam(eye, at, fov, roll) {
    return { eye, at, fov, roll: roll || 0, near: 0.03, far: 300 };
  }

  function shake(t, amp, seed) {
    return K.wobble(t * 1.7, amp, seed || 1);
  }

  function shotTitle(t) {
    return { shot: 'title', kind: 'card', cards: [{ tex: 'title', zoom: 1 + (t - 1.165) * 0.006 }] };
  }

  function shotBox(t) {
    const u = t - 4.994;
    const rise = ease(u / 1.4) * 0.3 + ease((u - 1.35) / 0.9) * 0.32;
    const tilt = ease((u - 1.3) / 1.0) * 0.55;
    const shift = ease((u - 1.4) / 0.95) * -0.26;
    const G = M4.chain(M4.translate(0.08 + shift, TABLE_Y + 0.42 + rise, 0.42), M4.rotY(0.1 + tilt * 0.3), M4.rotZ(tilt * 0.6), M4.rotX(-tilt * 0.35));
    const pose = body({ p: [0.02, 0.98, -0.15], sp: [0.32 - rise * 0.3, 0, 0], nk: [0.35, 0, 0] });
    const hR = handOn(G, [-0.36, 0.35, -0.01], [0, -0.55, 1], [0, -1, 0.25], 'grip');
    const hL = handOn(G, [0.3, 0.13, 0.02], [0, -0.5, 1], [0, -0.6, 0.6], 'grip');
    const st = heavyState(pose, { L: hL, R: hR }, { gun: { M: G, spin: 0 } });
    const eye = [0.1 + u * 0.01, 1.3 + ease((u - 1.2) / 1.2) * 0.05, 2.25];
    const at = [0.06, 1.3 + ease((u - 1.2) / 1.2) * 0.1, 0.0];
    return {
      shot: 'box', kind: '3d', set: 'warehouse', env: WAREHOUSE_ENV, camera: cam(eye, at, 33), blur: 0.45, blurSplit: 'heavy',
      heavy: st, face: faceAt(t), props: [{ kind: 'box', M: M4.chain(M4.translate(0.05, TABLE_Y, 0.42), M4.scale(1.85, 1.3, 1.25)) }, { kind: 'table', M: TABLE_M }]
    };
  }

  function shotIntro(t) {
    const st = introState(t);
    const camEye = spline([[7.37, [-0.5, 1.3, 1.62]], [8.4, [-0.3, 1.33, 1.6]], [9.5, [0.1, 1.32, 1.56]], [10.5, [0.26, 1.3, 1.5]], [15.0, [0.26, 1.3, 1.48]], [21.5, [0.24, 1.3, 1.46]],
      [22.1, [-0.2, 1.46, 1.0]], [28.0, [-0.2, 1.47, 0.98]], [35.8, [-0.19, 1.48, 0.96]]])(t);
    const camAt = spline([[7.37, [-0.08, 1.52, -0.2]], [8.4, [-0.04, 1.48, -0.2]], [9.5, [-0.1, 1.4, -0.25]], [10.5, [-0.22, 1.4, -0.27]], [21.5, [-0.22, 1.4, -0.27]],
      [22.1, [-0.08, 1.58, -0.25]], [35.8, [-0.08, 1.58, -0.25]]])(t);
    const fov = spline([[7.37, 34], [10.5, 31], [21.5, 31], [22.1, 32], [35.8, 32]])(t);
    return {
      shot: 'intro', kind: '3d', set: 'warehouse', env: WAREHOUSE_ENV, camera: cam(camEye, camAt, fov), blur: t < 21.6 ? 0.5 : 0.75,
      heavy: st, face: faceAt(t), props: [{ kind: 'table', M: TABLE_M }]
    };
  }

  function seatedGun(t, extraNk, lean, twist) {
    const G = M4.chain(M4.translate(GUN_REST[0], GUN_REST[1], GUN_REST[2]), M4.rotY(0.04));
    const pose = body({ p: SEAT, sit: true, sp: [lean, twist || 0, 0], nk: extraNk });
    return { G, pose };
  }

  function shotLaughA(t) {
    const u = t - 35.797;
    const { G, pose } = seatedGun(t, [0.3 + u * 0.3, -0.3, -0.15], 0.55, -0.1);
    const hR = handOn(G, [-0.12, 0.17, 0.0], [0.2, -0.65, 1], [0, -1, 0.1], 'claw');
    const hL = handOn(G, [0.22, 0.13, 0.02], [-0.1, -0.6, 1], [0, -1, 0.1], 'drape');
    const st = heavyState(pose, { L: hL, R: hR }, { gun: { M: G, spin: 0 } });
    const h = headPos(st);
    return {
      shot: 'laughA', kind: '3d', set: 'warehouse', env: WAREHOUSE_ENV, camera: cam(V3.add(h, [-0.38, -0.16, 0.62]), V3.add(h, [0.04, -0.14, 0.0]), 40), blur: 0.8,
      heavy: st, face: faceAt(t), props: []
    };
  }

  function shotLaughB(t) {
    const u = t - 36.255;
    const back = ease(u / 0.35) * (1 - ease((u - 0.85) / 0.25));
    const drop = ease((u - 0.95) / 0.3) * (1 - ease((u - 1.45) / 0.35));
    const lean = 0.35 - back * 0.45 + drop * 0.75;
    const { G, pose } = seatedGun(t, [-0.55 * back + 0.5 * drop, 0.1, -0.15 * back], lean, 0.05);
    const fist = freeHand([-0.5, 1.62 + back * 0.12, 0.05], [0.15, 1, 0.2], [0.6, 0, 0.8], 'fist');
    const hR = blendHand(handOn(G, [-0.12, 0.17, 0.0], [0.2, -0.65, 1], [0, -1, 0.1], 'claw'), fist, ease((u - 0.3) / 0.3) * (1 - ease((u - 1.0) / 0.4)));
    const hL = handOn(G, [0.22, 0.13, 0.02], [-0.1, -0.6, 1], [0, -1, 0.1], 'drape');
    const st = heavyState(pose, { L: hL, R: hR }, { gun: { M: G, spin: 0 } });
    const h0 = headPos(st);
    const eye = [0.08, 1.5, 0.62];
    const at = [-0.08, h0[1] - 0.12, -0.25];
    return {
      shot: 'laughB', kind: '3d', set: 'warehouse', env: LOW_ENV, camera: cam(V3.add(eye, shake(t, 0.01)), at, 52), blur: 0.7,
      heavy: st, face: faceAt(t), props: []
    };
  }

  function shotLaughC(t) {
    const u = t - 38.045;
    const wipe = ease((u - 0.6) / 0.35) * (1 - ease((u - 1.75) / 0.35));
    const finger = ease((u - 1.95) / 0.3);
    const { G, pose } = seatedGun(t, [-0.2 + wipe * 0.2, 0.15 - finger * 0.1, 0.05], 0.3, -0.05);
    const st0 = heavyState(pose, {}, {});
    const h = headPos(st0);
    const wipeHand = freeHand(V3.add(h, [0.12, -0.04, 0.17]), [-0.5, 0.75, 0.2], [-0.6, -0.1, -0.7], 'claw');
    const fingerHand = freeHand(V3.add(h, [-0.06, -0.14, 0.22]), [0.15, 1, 0.15], [0.4, 0, -0.9], 'point');
    const hL = blendHand(handOn(G, [0.22, 0.13, 0.02], [-0.1, -0.6, 1], [0, -1, 0.1], 'drape'), wipeHand, wipe);
    const hR = blendHand(handOn(G, [-0.12, 0.17, 0.0], [0.2, -0.65, 1], [0, -1, 0.1], 'claw'), fingerHand, finger);
    const st = heavyState(pose, { L: hL, R: hR }, { gun: { M: G, spin: 0 } });
    return {
      shot: 'laughC', kind: '3d', set: 'warehouse', env: LOW_ENV, camera: cam(V3.add(V3.add(h, [-0.04, -0.42, 0.72]), shake(t, 0.008)), V3.add(h, [0.02, -0.05, 0]), 44), blur: 0.7,
      heavy: st, face: faceAt(t), props: []
    };
  }

  function shotTouched(t) {
    const u = t - 40.875;
    const nk = spline([[0, [-0.2, -0.05, 0]], [1.8, [-0.18, -0.02, 0]], [2.2, [0.25, 0.05, 0.05]], [5.6, [0.3, 0.0, 0.1]], [6.0, [-0.05, -0.35, 0]], [6.6, [-0.1, 0.25, -0.05]],
      [7.2, [-0.12, -0.3, 0.05]], [7.8, [-0.1, 0.15, 0]], [8.7, [-0.15, -0.05, 0]]])(u);
    const lean = spline([[0, 0.55], [2.2, 0.62], [5.6, 0.65], [6.2, 0.5], [8.7, 0.5]])(u);
    const { G, pose } = seatedGun(t, nk, lean, -0.04);
    const hR = handOn(G, [-0.33, 0.12, 0.0], [0.15, -0.6, 1], [0, -1, 0.2], 'grip');
    const hL = handOn(G, [0.04, 0.17, -0.02], [0.2, -0.5, 1], [0, -1, 0.15], 'grip');
    const st = heavyState(pose, { L: hL, R: hR }, { gun: { M: G, spin: 0 } });
    const eye = spline([[0, [-0.55, 1.3, 1.45]], [8.7, [-0.5, 1.32, 1.42]]])(u);
    return {
      shot: 'touched', kind: '3d', set: 'warehouse', env: WAREHOUSE_ENV, camera: cam(eye, [0.0, 1.42, -0.2], 34), blur: 0.55,
      heavy: st, face: faceAt(t), props: [{ kind: 'table', M: TABLE_M }]
    };
  }

  function shotOutsmart(t) {
    const u = t - 49.533;
    const nk = spline([[0, [-0.1, 0.18, -0.05]], [3, [-0.06, 0.12, 0]], [5.6, [-0.1, 0.22, 0.1]], [7.2, [-0.02, 0.1, -0.08]], [9.0, [-0.08, 0.2, 0]], [12.0, [0.05, 0.05, 0.02]],
      [13.2, [0.02, -0.05, 0.05]], [14.6, [-0.08, -0.08, 0.06]], [16.3, [-0.1, -0.1, 0.05]]])(u);
    const lean = spline([[0, 0.25], [12, 0.3], [13.5, 0.55], [16.3, 0.62]])(u);
    const { G, pose } = seatedGun(t, nk, lean, 0.04);
    const showUp = ease((u - 13.2) / 0.9);
    const hL0 = handOn(G, [0.22, 0.13, 0.02], [-0.1, -0.6, 1], [0, -1, 0.1], 'drape');
    const st0 = heavyState(pose, {}, {});
    const h = headPos(st0);
    const show = freeHand(V3.add(h, [0.17, -0.3, 0.22]), [-0.1, 0.9, 0.25], [-0.85, 0.1, -0.3], 'pinch');
    const hL = blendHand(hL0, show, showUp);
    const hR = handOn(G, [-0.12, 0.17, 0.0], [0.2, -0.65, 1], [0, -1, 0.1], 'drape');
    const st = heavyState(pose, { L: hL, R: hR }, { gun: { M: G, spin: 0 } });
    const props = [];
    if (showUp > 0.02) {
      const HM = st.hands.L && st.hands.L.M;
      if (HM) props.push({ kind: 'round', M: M4.chain(HM, M4.translate(-0.01, -0.13, 0.03), M4.rotX(PI), M4.scale(1.5, 1.5, 1.5)) });
    }
    const push = ease((u - 13.0) / 2.5);
    const eye = V3.add(V3.add(h, V3.lerp([-0.12, -0.36, 0.8], [-0.07, -0.12, 0.5], push)), shake(t, 0.004));
    const at = V3.add(h, V3.lerp([0.0, -0.12, 0], [0.05, -0.08, 0], push));
    return {
      shot: 'outsmart', kind: '3d', set: 'warehouse', env: LOW_ENV, camera: cam(eye, at, 40), blur: 0.65, shafts: true,
      heavy: st, face: faceAt(t), props
    };
  }

  const PLAT = [0, 3.0, 0];

  function battleHeavy(t, o) {
    const p = [PLAT[0] + (o.dx || 0), PLAT[1] + 1.02, PLAT[2]];
    const kick = S(t * 47) * 0.006 + S(t * 31) * 0.004;
    const G = M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(o.yaw || 0), M4.translate(-0.14, -0.06 + kick, 0.72), M4.rotY(-PI / 2 + (o.aim || 0)), M4.rotZ(o.tilt || 0.05));
    const pose = body({ p, sp: [o.lean === undefined ? 0.18 : o.lean, o.twist || 0, 0], nk: o.nk || [0, 0, 0], spread: 0.08, yaw: o.yaw || 0 });
    const hR = handOn(G, [-0.56, 0.08, 0.07], [0, -1, 0.15], [0, 0, -1], 'grip');
    const hL = handOn(G, [-0.36, 0.28, 0], [0.2, -0.6, 1], [0, -1, 0.2], 'grip');
    return heavyState(pose, { L: hL, R: hR }, { gun: { M: G, spin: (o.fire ? t * 40 : 0), fire: o.fire } });
  }

  const BLU = [
    { cls: 'scout', path: [[64, [-9, 0, 10]], [78, [7, 0, 9]]], die: 74.3 },
    { cls: 'soldier', path: [[64, [-3, 0, 20]], [78, [-1.5, 0, 9]]], die: 75.1, gun: 'rocket' },
    { cls: 'demo', path: [[64, [5, 0, 16]], [78, [2, 0, 10]]], die: 74.75 },
    { cls: 'pyro', path: [[64, [-7, 0, 14]], [78, [-4.5, 0, 9]]], gun: 'flamer' },
    { cls: 'medic', path: [[64, [3, 0, 22]], [78, [1, 0, 14]]], die: 76.2, gun: 'medigun' },
    { cls: 'engineer', path: [[64, [8, 0, 15]], [78, [7.5, 0, 15.2]]], crouch: true, gun: 'shotgun' },
    { cls: 'spy', path: [[64, [-1, 0, 24]], [78, [-3, 0, 15]]], item: 'revolver' },
    { cls: 'heavy', path: [[64, [-12, 0, 18]], [78, [-8, 0, 12]]], gun: 'minigun' },
    { cls: 'scout', path: [[64, [10, 0, 12]], [78, [-2, 0, 11]]], die: 72.9 }
  ];

  function bluActors(t) {
    return BLU.map((b, i) => {
      const a = b.path[0], z = b.path[1];
      const k = clamp((t - a[0]) / (z[0] - a[0]), 0, 1);
      const pos = V3.lerp(a[1], z[1], k);
      const dir = V3.sub(z[1], a[1]);
      const yaw = Math.atan2(dir[0], dir[2]);
      const actor = { cls: b.cls, team: 'blu', gun: b.gun, itemR: b.item };
      if (b.die && t > b.die) {
        const u = t - b.die;
        const g = rand(i + 3);
        const vx = (g() - 0.5) * 4, vz = 2 + g() * 2, vy = 6 + g() * 2;
        if (u < 1.1) {
          const pp = [pos[0] + vx * u, Math.max(0.3, 0.9 + vy * u - 4.9 * u * u * 1.4), pos[2] + vz * u];
          const spin = u * 7;
          actor.pose = FP.airborne(b.cls, pp, [S(spin) * 0.8, C(spin), 0.3], [0, -0.2, 1]);
        } else {
          actor.pose = FP.supine(b.cls, pos[0] + vx * 1.1, pos[2] + vz * 1.1, yaw);
        }
        actor.gun = null;
        return actor;
      }
      if (b.crouch) actor.pose = FP.crouch(b.cls, pos[0], pos[2], yaw + PI, {});
      else actor.pose = FP.run(b.cls, pos[0], pos[2], yaw, t * 1.6 + i * 0.37, {});
      if (actor.gun) Object.assign(actor.pose, FP.aimGun(b.cls, actor.gun));
      if (actor.gun) actor.gunM = FP.aimGun(b.cls, actor.gun).gunM;
      return actor;
    });
  }

  function battleFx(t, st, fire) {
    const fx = [];
    if (fire && st.gun) {
      const GM = Props.gunM(st.gun.M);
      const mz = M4.point(GM, [0.9, 0.06, 0]);
      const dir = V3.norm(M4.dir(GM, [1, 0, 0]));
      const fl = frac(t * 14);
      fx.push({ kind: 'muzzle', p: V3.add(mz, V3.mul(dir, 0.18)), s: 0.75 + fl * 0.6, spin: t * 23 });
      for (let i = 0; i < 4; i++) {
        const ph = frac(t * 3 + i / 4);
        const target = [Math.sin(i * 2.1 + t * 0.7) * 6, 0.3, 12 + Math.cos(i * 1.3) * 4];
        const a = V3.add(mz, V3.mul(dir, 0.4));
        const b = V3.lerp(a, target, clamp(ph + 0.12, 0, 1));
        const c = V3.lerp(a, target, clamp(ph, 0, 1));
        fx.push({ kind: 'tracer', a: c, b });
        fx.push({ kind: 'dust', p: [target[0] + S(t * 9 + i) * 0.5, 0.2, target[2]], u: frac(t * 2.3 + i * 0.27), s: 0.7 });
      }
      const side = V3.norm(M4.dir(GM, [0, 0.3, -1]));
      for (let i = 0; i < 14; i++) {
        const ph = frac(t * 2.5 + i / 14);
        const base = M4.point(GM, [-0.1, 0.05, -0.15]);
        const v = V3.add(V3.mul(side, 1.1), [S(i * 1.7) * 0.25, 1.2, C(i * 2.3) * 0.25]);
        fx.push({ kind: 'shell', p: [base[0] + v[0] * ph, base[1] + v[1] * ph - 4.9 * ph * ph, base[2] + v[2] * ph], spin: ph * 20 + i });
      }
    }
    return fx;
  }

  function shotBattleA(t) {
    const u = t - 65.767;
    if (u < 0.9) {
      const k = ease(u / 0.9);
      const eye = [-5.5, 1.2, 9.5];
      const at = V3.lerp([-16, 9, 25], [-6, 8, 30], k);
      return {
        shot: 'battleA', kind: '3d', set: 'battle', env: BATTLE_ENV, camera: cam(eye, at, 50, -0.08), motionBlur: 0.5,
        heavy: null, actors: bluActors(t), fx: []
      };
    }
    const st = battleHeavy(t, { fire: true, nk: [-0.12, 0.25, 0], lean: 0.12, aim: -0.55, yaw: 0.35 });
    const h = headPos(st);
    const eye = V3.add(h, V3.add([0.9, -1.15, 2.7], shake(t, 0.05, 3)));
    return {
      shot: 'battleA', kind: '3d', set: 'battle', env: BATTLE_ENV, camera: cam(eye, V3.add(h, [-0.35, -0.55, 0]), 44), heavy: st, face: faceAt(t),
      actors: bluActors(t), fx: battleFx(t, st, true)
    };
  }

  function shotBattleB(t) {
    const u = t - 68.972;
    const orbit = spline([[0, 0.55], [1.2, 0.4], [2.0, 0.15], [2.6, -0.4], [3.4, -1.6], [4.6, -2.9], [6.0, -3.6], [7.83, -4.1]])(u);
    const dist = spline([[0, 1.15], [1.3, 0.95], [2.0, 0.66], [2.6, 0.7], [3.6, 1.05], [5.0, 1.3], [7.83, 1.7]])(u);
    const hgt = spline([[0, -0.82], [1.3, -0.45], [2.0, -0.08], [2.6, 0.0], [4.2, 0.22], [7.83, 0.12]])(u);
    const nk = spline([[0, [-0.28, 0.25, 0]], [1.5, [-0.2, 0.15, 0]], [2.4, [-0.1, 0.05, 0]], [3.0, [0.0, -0.3, 0]], [4.5, [0.1, 0.1, 0]], [7.83, [0.12, -0.15, 0]]])(u);
    const aim = spline([[0, -0.7], [2.4, -0.6], [3.4, -0.1], [7.83, 0.1]])(u) + S(t * 0.9) * 0.12;
    const st = battleHeavy(t, { fire: true, nk, lean: 0.15, aim, twist: aim * 0.3 + S(t * 0.7) * 0.08 });
    const h = headPos(st);
    const eye = V3.add(V3.add(h, [S(orbit) * dist, hgt, C(orbit) * dist]), shake(t, 0.03, 5));
    const look = V3.lerp(h, V3.add(h, [-1.2, -1.5, 8]), clamp((u - 2.6) / 1.4, 0, 1) * 0.55);
    const fov = spline([[0, 50], [2.0, 44], [3.0, 50], [7.83, 56]])(u);
    const fx = battleFx(t, st, true);
    const boom = (tb, p, s) => { if (t > tb && t < tb + 1.4) fx.push({ kind: 'boom', p, u: t - tb, s }); };
    boom(72.2, V3.add(h, [-1.5, -1.0, 2.5]), 1.0);
    boom(74.7, [-5, 0.6, 12], 2.2);
    boom(75.0, [-7, 0.6, 10], 2.0);
    boom(76.1, [1, 0.6, 14], 2.0);
    if (t > 75.3) fx.push({ kind: 'fire', p: [-6.5, 0.1, 9], u: t - 75.3, w: 3, d: 2, h: 1.6, s: 1.3, n: 26 });
    fx.push({ kind: 'smokeTrail', p: [-1, 0.5, 15], u, h: 6 });
    return {
      shot: 'battleB', kind: '3d', set: 'battle', env: BATTLE_ENV, camera: cam(eye, look, fov, S(t * 1.3) * 0.04), heavy: st, face: faceAt(t),
      actors: bluActors(t), fx
    };
  }

  const LINE = [
    { cls: 'pyro', x: -2.75, z: 0.25, yaw: 0.25, gun: 'flamer' },
    { cls: 'engineer', x: -1.85, z: 0.35, yaw: 0.2, gun: 'shotgun' },
    { cls: 'spy', x: -1.0, z: -0.05, yaw: 0.15, item: 'revolver', raise: true },
    { cls: 'sniper', x: 0.95, z: 0.0, yaw: -0.15, item: 'rifle', raise: true },
    { cls: 'soldier', x: 1.75, z: 0.1, yaw: -0.2, gun: 'rocket' },
    { cls: 'scout', x: 1.0, z: 0.9, yaw: -0.3, item: 'bat', crouch: true },
    { cls: 'demo', x: 2.55, z: 0.35, yaw: -0.3, gun: 'grenade' },
    { cls: 'medic', x: 3.35, z: 0.0, yaw: -0.35, gun: 'medigun' }
  ];

  function lineupActors() {
    return LINE.map(c => {
      const pose = c.crouch ? FP.crouch(c.cls, c.x, c.z, c.yaw, { depth: 0.5 }) : FP.stand(c.cls, c.x, c.z, c.yaw, {});
      const a = { cls: c.cls, team: 'red', pose };
      if (c.gun) {
        a.gun = c.gun;
        const g = FP.aimGun(c.cls, c.gun);
        Object.assign(pose, { hR: g.hR, hL: g.hL });
        a.gunM = g.gunM;
      }
      if (c.item) {
        a.itemR = c.item;
        if (c.raise) {
          pose.hR = [-0.2, 0.42, 0.12];
          pose.eR = [-0.8, -0.3, 0.2];
        }
      }
      return a;
    });
  }

  function lineupHeavy(t) {
    const p = [0.05, 1.02, 0.1];
    const G = M4.chain(M4.translate(p[0] + 0.05, p[1] - 0.2, p[2] + 0.62), M4.rotY(-PI / 2 - 0.35), M4.rotZ(-0.3));
    const pose = body({ p, sp: [0.05, -0.05, 0], nk: [-0.12, 0.05, 0], spread: 0.1 });
    const hR = handOn(G, [-0.56, 0.08, 0.07], [0, -1, 0.15], [0, 0, -1], 'grip');
    const hL = handOn(G, [-0.36, 0.28, 0], [0.2, -0.6, 1], [0, -1, 0.2], 'grip');
    return heavyState(pose, { L: hL, R: hR }, { gun: { M: G, spin: 0 } });
  }

  function shotEnd(t, which) {
    const st = lineupHeavy(t);
    const h = headPos(st);
    let camera;
    if (which === 'endA') camera = cam(V3.add(h, [0.32, -0.04, 0.48]), V3.add(h, [-0.04, -0.02, 0]), 30);
    else if (which === 'endB') camera = cam(V3.add(h, [0.05, -0.12, 0.95]), V3.add(h, [-0.28, -0.12, 0]), 38);
    else camera = cam([0.1, 1.08, 1.5], [0.1, 1.62, 0], 56);
    const actors = lineupActors();
    return {
      shot: which, kind: '3d', set: 'lineup', env: LINEUP_ENV, camera, heavy: st, face: faceAt(t), actors, blur: which === 'endA' ? 0.4 : 0.15
    };
  }

  function shotLogo(t) {
    const st = lineupHeavy(t);
    const wide = t >= 83.0;
    const camera = wide ? cam([0.35, 1.25, 3.3], [0.35, 1.35, 0], 50) : cam([0.25, 0.95, 3.1], [0.2, 1.4, 0], 52);
    const u = t - 82.375;
    const flip = wide ? 1 : ease((u - 0.45) / 0.17);
    const fly = t < 83.72 ? 0 : clamp((t - 83.72) / 0.2, 0, 1);
    return {
      shot: wide ? 'logoB' : 'logoA', kind: '3d', set: 'lineup', env: LINEUP_ENV, camera, heavy: st, face: faceAt(t), actors: lineupActors(),
      logo: { flip, y: wide ? 0 : (1 - flip) * -0.15, emblem: t < 83.72 ? 0 : fly, emblemFly: t >= 83.72 && t < 83.92 }
    };
  }

  const SHOTS = [
    [0, 'black'], [1.165, 'title'], [4.287, 'black'], [4.994, 'box'], [7.367, 'intro'], [35.797, 'laughA'], [36.255, 'laughB'], [38.045, 'laughC'],
    [40.875, 'touched'], [49.533, 'outsmart'], [65.767, 'battleA'], [68.722, 'flash'], [68.972, 'battleB'], [76.798, 'black'], [80.502, 'endA'],
    [81.127, 'endB'], [81.751, 'endC'], [82.375, 'logo'], [85.414, 'orange']
  ];

  function shotAt(t) {
    let i = 0;
    while (i < SHOTS.length - 1 && t >= SHOTS[i + 1][0]) i++;
    return SHOTS[i][1];
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION - 0.001);
    const name = shotAt(tt);
    switch (name) {
      case 'black': return { shot: 'black', kind: 'black' };
      case 'title': return shotTitle(tt);
      case 'box': return shotBox(tt);
      case 'intro': return shotIntro(tt);
      case 'laughA': return shotLaughA(tt);
      case 'laughB': return shotLaughB(tt);
      case 'laughC': return shotLaughC(tt);
      case 'touched': return shotTouched(tt);
      case 'outsmart': return shotOutsmart(tt);
      case 'battleA': return shotBattleA(tt);
      case 'flash': return { shot: 'flash', kind: 'flash', u: tt - 68.722 };
      case 'battleB': return shotBattleB(tt);
      case 'endA': case 'endB': case 'endC': return shotEnd(tt, name);
      case 'logo': return shotLogo(tt);
      case 'orange': return { shot: 'orange', kind: 'card', cards: [{ tex: 'orange', zoom: 1 }] };
      default: return { shot: 'black', kind: 'black' };
    }
  }

  function voiceAt(t) {
    return jawV(t);
  }

  window.MeetScript = { ID, DURATION, CUTS, SHOTS, stage, voiceAt, faceAt, spline, X };
})();
