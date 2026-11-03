(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Demo = window.MeetDemoman;
  const Voice = window.DemoVoice;
  const FP = window.FabPose;
  const Fab = window.FabCast;
  const Heavy = window.MeetHeavy;
  const HeavyScript = window.MeetScript;
  const Props = window.DemoProps;

  const ID = 'M33tTh3D3mo';
  const DURATION = 105.16;
  const LINEUP_SHIFT = -16.358;

  const SHOTS = [
    [0, 'black'], [0.624, 'title'], [4.745, 'tunnelA'], [5.078, 'tunnelB'], [5.785, 'tunnelC'], [6.2015, 'tunnelD'], [6.368, 'leap'],
    [10.447, 'benchA'], [15.817, 'letsdo'], [18.731, 'door'], [19.355, 'shaft'], [19.938, 'flight'], [20.729, 'cover1'], [22.019, 'cover2'],
    [23.934, 'widefire'], [24.641, 'blast'], [25.432, 'benchB'], [32.342, 'yard'], [33.341, 'wallgren'], [34.049, 'pyro'], [34.548, 'boom'],
    [34.673, 'danger'], [35.339, 'drinkA'], [37.462, 'sentryA'], [39.252, 'drinkB'], [40.917, 'sentryB'], [42.332, 'drinkC'], [43.456, 'coverfire'],
    [45.4955, 'roll'], [46.952, 'sentryC'], [48.16, 'flash'], [48.326, 'sentryboom'], [50.033, 'benchF'], [64.185, 'stairs'], [67.807, 'surprised'],
    [68.764, 'bluheavy'], [71.969, 'determined'], [73.384, 'bluRun'], [74.591, 'pass'], [75.59, 'leap2'], [77.297, 'grin'], [78.296, 'corridorA'],
    [79.17, 'stickyA'], [80.128, 'corridorB'], [80.877, 'stickyB'], [81.584, 'window'], [83.249, 'doorway'], [84.082, 'worried'], [85.414, 'stickies'],
    [85.955, 'bottle'], [87.204, 'runout'], [87.45, 'explosion'], [88.494, 'sky'], [96.861, 'endA'], [97.485, 'endB'], [98.11, 'endC'],
    [98.734, 'logoA'], [99.358, 'logoB'], [101.731, 'orange']
  ];
  const CUTS = SHOTS.map(s => s[0]);

  const jawV = K.envelope(Voice.JAW, Voice.RATE);
  const rndV = K.envelope(Voice.ROUND, Voice.RATE);
  const wideV = K.envelope(Voice.WIDE, Voice.RATE);

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

  const FIELDS = ['smileL', 'smileR', 'wide', 'round', 'frown', 'press', 'sneer', 'browDown', 'browUp', 'jaw', 'lidU', 'lidL'];
  const BASE = { smileL: 0, smileR: 0, wide: 0, round: 0, frown: 0, press: 0, sneer: 0, browDown: 0, browUp: 0, jaw: 0, lidU: 0.6, lidL: 0.35 };
  const X = {
    calm: { lidU: 0.55 },
    talk: { smileL: 0.15, smileR: 0.2, lidU: 0.6 },
    grin: { smileL: 0.9, smileR: 0.95, wide: 0.35, jaw: 0.1, lidU: 0.5, lidL: 0.55 },
    laugh: { smileL: 1, smileR: 1, wide: 0.6, jaw: 0.75, lidU: 0.35, lidL: 0.7 },
    roar: { wide: 0.8, sneer: 0.4, browDown: 0.8, jaw: 0.95, lidU: 0.85 },
    scream: { smileL: 0.4, smileR: 0.45, wide: 0.9, jaw: 1.15, browUp: 0.3, lidU: 0.95, lidL: 0.15 },
    drunk: { smileL: 0.35, smileR: 0.2, lidU: 0.3, lidL: 0.5, browUp: 0.15 },
    sly: { smileL: 0.55, smileR: 0.15, sneer: 0.2, lidU: 0.42, browDown: 0.2 },
    angry: { browDown: 0.9, sneer: 0.3, frown: 0.3, press: 0.3, lidU: 0.7 },
    wide: { browUp: 0.9, lidU: 1, lidL: 0.1, jaw: 0.15, press: 0 },
    stern: { browDown: 0.6, press: 0.5, lidU: 0.55 },
    drink: { round: 0.8, jaw: 0.25, lidU: 0.2, lidL: 0.6 },
    shout: { wide: 0.5, browDown: 0.5, jaw: 0.4, sneer: 0.2, lidU: 0.8 },
    proud: { smileL: 0.5, smileR: 0.5, browUp: 0.35, lidU: 0.55 },
    mad: { smileL: 0.7, smileR: 0.75, wide: 0.5, browUp: 0.5, lidU: 0.95, lidL: 0.2 }
  };

  function steps(keys, dur) {
    return (t) => {
      let i = 0;
      while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
      const cur = Object.assign({}, BASE, keys[i][1]);
      if (i === 0) return cur;
      const k = ease((t - keys[i][0]) / (keys[i][2] || dur || 0.3));
      const prev = Object.assign({}, BASE, keys[i - 1][1]);
      const out = {};
      FIELDS.forEach(f => { out[f] = lerp(prev[f], cur[f], k); });
      return out;
    };
  }

  const FACE = steps([
    [0, X.roar], [10.4, X.talk], [11.3, X.sly], [12.4, X.talk], [13.4, X.proud], [14.2, X.talk], [15.2, X.sly], [15.8, X.roar, 0.15], [18.7, X.shout],
    [20.6, X.angry], [22.0, X.shout], [24.6, X.wide], [25.4, X.talk], [26.9, X.sly], [27.8, X.talk], [29.5, X.mad, 0.25], [31.0, X.sly], [31.6, X.laugh, 0.2],
    [33.2, X.grin], [35.3, X.drink, 0.2], [37.5, X.drunk], [39.2, X.drink, 0.2], [40.9, X.drunk], [42.3, X.drink, 0.2], [43.5, X.angry], [50.0, X.drunk, 0.3],
    [51.4, X.talk], [52.6, X.stern], [53.6, X.sly], [55.0, X.talk], [56.8, X.angry], [58.2, X.talk], [59.6, X.proud], [61.5, X.drunk], [63.4, X.shout, 0.2],
    [64.1, X.stern], [67.8, X.wide, 0.1], [72.0, X.stern], [73.3, X.angry], [75.5, X.angry], [77.3, X.mad, 0.15], [78.3, X.sly], [86.0, X.drunk], [86.9, X.laugh, 0.25],
    [88.5, X.drunk], [90.2, X.laugh], [92.3, X.mad, 0.2], [94.6, X.grin], [95.6, X.scream, 0.2], [96.86, X.laugh, 0.1]
  ], 0.25);

  const TALK = spline([[0, 0], [10.3, 0], [10.45, 1], [15.75, 1], [15.82, 1.15], [18.3, 1.15], [18.7, 0], [20.6, 0], [20.75, 0.6], [23.93, 0.6], [24.0, 0], [25.3, 0], [25.43, 1],
    [32.34, 1], [33.1, 0.8], [33.3, 0], [50.0, 0], [50.1, 1], [64.15, 1], [64.2, 0], [77.25, 0], [77.3, 1], [78.3, 1], [78.35, 0], [88.4, 0], [88.5, 1], [96.9, 1], [97, 0]]);

  const BLINKS = [11.9, 14.6, 17.0, 26.8, 29.0, 31.7, 51.2, 53.9, 56.3, 58.6, 61.0, 63.2, 66.9, 72.6, 78.0, 86.5, 89.1, 93.0, 95.0];

  function blinkAt(t) {
    let b = 0;
    BLINKS.forEach(t0 => {
      const u = (t - t0) / 0.16;
      if (u > 0 && u < 1) b = Math.max(b, S(u * PI));
    });
    return b;
  }

  const LOOK = spline([[0, [0, 0]], [12.4, [0, 0]], [12.8, [0.25, 0.05]], [13.4, [0, 0]], [27.0, [-0.1, 0]], [28.0, [0.1, 0.05]], [31.2, [0.2, -0.1]], [32.3, [0, 0]],
    [52.0, [0.0, 0.0]], [57.0, [0.12, 0.04]], [60.0, [0, 0]], [67.8, [0.15, 0.05]], [68.7, [0.05, 0]], [77.3, [0.3, 0.25]], [78.3, [0.2, 0.2]], [86, [0, 0.1]], [94, [0, 0]]]);

  function faceAt(t, extra) {
    const e = FACE(t);
    const gain = TALK(t);
    const talk = clamp(jawV(t) * gain, 0, 1);
    const f = {
      smileL: e.smileL, smileR: e.smileR, wide: clamp(e.wide + wideV(t) * 0.4 * gain, 0, 1.2), round: clamp(e.round + rndV(t) * 0.8 * gain, 0, 1),
      frown: e.frown, press: e.press * (1 - talk * 0.8), sneer: e.sneer, browDown: e.browDown, browUp: e.browUp,
      jaw: clamp(e.jaw + talk * (0.8 - e.jaw * 0.4), 0, 1.2), lidU: e.lidU, lidL: e.lidL, blink: blinkAt(t), look: LOOK(t)
    };
    return Object.assign(f, extra || {});
  }

  const D = Demo.D;
  const STAND_Y = D.thigh + D.shin + 0.075 - D.hipY - 0.02;

  function axis(M, c) {
    return V3.norm([M[c * 4], M[c * 4 + 1], M[c * 4 + 2]]);
  }

  function basisAt(p, x, y, z) {
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, p[0], p[1], p[2], 1]);
  }

  function frameAt(p, fwd, up) {
    const z = V3.norm(fwd);
    let x = V3.cross(V3.norm(up || [0, 1, 0]), z);
    x = V3.len(x) < 1e-4 ? [1, 0, 0] : V3.norm(x);
    const y = V3.cross(z, x);
    return basisAt(p, x, y, z);
  }

  function legs(pose, o) {
    const yaw = o.yaw || 0;
    const fwd = [S(yaw), 0, C(yaw)], side = [C(yaw), 0, -S(yaw)];
    const p = pose.p;
    const base = o.floor || 0;
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const lift = o['lift' + s] || 0;
      const step = o['step' + s] || 0;
      const spread = o.spread === undefined ? 0.04 : o.spread;
      const f = V3.add([p[0], 0, p[2]], V3.add(V3.mul(side, k * (D.hipX + spread)), V3.mul(fwd, 0.04 + step)));
      pose['f' + s + 'w'] = [f[0], base + 0.075 + lift, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.5 + side[0] * k * 0.25, base + 0.6 + lift, fwd[2] * 1.5 + side[2] * k * 0.25]);
    });
  }

  function stand(o) {
    const yaw = o.yaw || 0;
    const p = o.p.length === 3 ? o.p : [o.p[0], STAND_Y + (o.floor || 0) + (o.dy || 0), o.p[1]];
    const pose = { p, fwd: [S(yaw), 0, C(yaw)], up: o.up || [0, 1, 0], sp: o.sp || [0.05, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.8, -0.5, -0.5], eR: o.eR || [-0.8, -0.5, -0.5] };
    legs(pose, o);
    return pose;
  }

  function crouch(o) {
    const yaw = o.yaw || 0;
    const fwd = [S(yaw), 0, C(yaw)], side = [C(yaw), 0, -S(yaw)];
    const depth = o.depth === undefined ? 0.35 : o.depth;
    const p = [o.p[0], STAND_Y - depth + (o.floor || 0), o.p[1]];
    const pose = { p, fwd, up: [0, 1, 0], sp: o.sp || [0.35, 0, 0], nk: o.nk || [-0.2, 0, 0], eL: o.eL || [0.8, -0.5, -0.5], eR: o.eR || [-0.8, -0.5, -0.5] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const ahead = s === 'L' ? (o.leadL === undefined ? 0.22 : o.leadL) : (o.leadR === undefined ? -0.12 : o.leadR);
      const f = V3.add([p[0], 0, p[2]], V3.add(V3.mul(side, k * (D.hipX + 0.1)), V3.mul(fwd, ahead)));
      pose['f' + s + 'w'] = [f[0], (o.floor || 0) + 0.075, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 2 + side[0] * k * 0.4, 0.9, fwd[2] * 2 + side[2] * k * 0.4]);
    });
    return pose;
  }

  function seated(o) {
    const yaw = o.yaw || 0;
    const fwd = [S(yaw), 0, C(yaw)], side = [C(yaw), 0, -S(yaw)];
    const p = o.p || SEAT;
    const pose = { p, fwd, up: [0, 1, 0], sp: o.sp || [0.3, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.9, -0.6, -0.3], eR: o.eR || [-0.9, -0.6, -0.3] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const hip = V3.add(p, V3.mul(side, k * 0.14));
      pose['f' + s + 'w'] = [hip[0] + fwd[0] * 0.42 + side[0] * k * 0.12, 0.075, hip[2] + fwd[2] * 0.42 + side[2] * k * 0.12];
      pose['k' + s + 'w'] = V3.add(hip, [fwd[0] * 1.4 + side[0] * k * 0.4, 0.75, fwd[2] * 1.4 + side[2] * k * 0.4]);
    });
    return pose;
  }

  function run(o) {
    const yaw = o.yaw || 0;
    const fwd = [S(yaw), 0, C(yaw)], side = [C(yaw), 0, -S(yaw)];
    const ph = (o.phase || 0) * PI * 2;
    const amp = o.stride === undefined ? 0.36 : o.stride;
    const legLen = D.thigh + D.shin;
    const bob = Math.abs(S(ph)) * 0.05;
    const base = o.floor || 0;
    const p = [o.p[0], STAND_Y - 0.06 + bob + base + (o.dy || 0), o.p[1]];
    const lean = o.lean === undefined ? 0.25 : o.lean;
    const pose = { p, fwd, up: [0, 1, 0], sp: [lean, S(ph) * 0.15, 0], nk: o.nk || [-lean * 0.7, -S(ph) * 0.12, 0], eL: [0.6, -0.3, -0.8], eR: [-0.6, -0.3, -0.8] };
    [['L', 1, 1], ['R', -1, -1]].forEach(([s, k, sg]) => {
      const sw = S(ph) * sg;
      const lift = Math.max(0, C(ph) * sg) * 0.24;
      const f = V3.add([p[0], 0, p[2]], V3.add(V3.mul(side, k * (D.hipX + 0.02)), V3.mul(fwd, sw * amp * legLen)));
      pose['f' + s + 'w'] = [f[0], base + 0.075 + lift, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.6, base + 0.7, fwd[2] * 1.6]);
    });
    return pose;
  }

  function chestOf(pose) {
    return Demo.solve(pose).chest;
  }

  function hand(target, fingers, palm, pose) {
    return { target, fingers: V3.norm(fingers), palm: V3.norm(palm), pose };
  }

  function gripOn(M, local, fingersL, palmL, pose, reach) {
    const fingers = V3.norm(M4.dir(M, fingersL));
    const palm = V3.norm(M4.dir(M, palmL));
    const pos = M4.point(M, local);
    const wrist = V3.sub(V3.sub(pos, V3.mul(fingers, reach === undefined ? 0.07 : reach)), V3.mul(palm, 0.03));
    return { target: wrist, fingers, palm, pose };
  }

  function blendHand(a, b, k) {
    if (k <= 0) return a;
    if (k >= 1) return b;
    return { target: V3.lerp(a.target, b.target, k), fingers: V3.norm(V3.lerp(a.fingers, b.fingers, k)), palm: V3.norm(V3.lerp(a.palm, b.palm, k)), pose: k < 0.5 ? a.pose : b.pose };
  }

  function demoState(pose, hands, extra) {
    const p = Object.assign({}, pose);
    if (hands.L) p.hLw = hands.L.target;
    if (hands.R) p.hRw = hands.R.target;
    const m = Demo.solve(p);
    const hm = {};
    ['L', 'R'].forEach(s => {
      const h = hands[s];
      if (!h) return;
      hm[s] = { pose: h.pose, M: Demo.handBasis(m.pts['wrist' + s], h.fingers, h.palm) };
    });
    return Object.assign({ pose: p, m, hands: hm }, extra || {});
  }

  function gunFrame(chest, o) {
    const at = o.at || [-0.12, 0.08, 0.34];
    return M4.chain(chest, M4.translate(at[0], at[1], at[2]), M4.rotY(o.yaw || 0), M4.rotX(o.pitch || 0), M4.rotZ(o.roll || 0));
  }

  function launcherHands(G) {
    return {
      R: gripOn(G, [0, -0.09, -0.085], [0.1, -0.2, 1], [1, 0.05, 0.1], 'grip', 0.06),
      L: gripOn(G, [0, -0.07, 0.27], [-0.1, -0.2, 1], [-1, 0.05, 0.1], 'grip', 0.06)
    };
  }

  function stickyHands(G) {
    return {
      R: gripOn(G, [0, -0.07, -0.05], [0.1, -0.2, 1], [1, 0.05, 0.1], 'grip', 0.06),
      L: gripOn(G, [0, -0.06, 0.21], [-0.1, -0.2, 1], [-1, 0.05, 0.1], 'grip', 0.06)
    };
  }

  function armed(pose, gun, o) {
    const chest = chestOf(pose);
    const G = gunFrame(chest, o || {});
    const H = gun === 'sticky' ? stickyHands(G) : launcherHands(G);
    const hands = Object.assign({}, H, (o && o.hands) || {});
    return demoState(pose, hands, { gun: { kind: gun, M: G } });
  }

  function headPos(st, off) {
    return M4.point(st.m.head, off || [0, 0, 0]);
  }

  function cam(eye, at, fov, roll) {
    return { eye, at, fov, roll: roll || 0, near: 0.03, far: 400 };
  }

  function shake(t, amp, seed) {
    return K.wobble(t * 1.7, amp, seed || 1);
  }

  const SHED_ENV = {
    key: { dir: [0.45, -0.7, -0.55], col: [1.18, 0.92, 0.7] },
    ambTop: [0.2, 0.16, 0.14], ambBot: [0.1, 0.075, 0.06], warp: [0.62, 0.3, 0.24], rim: [0.5, 0.4, 0.34], rimPow: 2.8,
    points: [{ pos: [-0.9, 2.1, 1.6], col: [0.45, 0.33, 0.22], k: 0.35 }, { pos: [1.6, 1.7, -0.5], col: [0.3, 0.2, 0.12], k: 0.6 }],
    fogCol: [0.05, 0.038, 0.03], fog: [3.2, 9], clear: [0.04, 0.03, 0.025], grade: [1.05, 0.98, 0.9, 0.05], vig: 0.42
  };

  const PIT_ENV = {
    key: { dir: [-0.45, -0.7, -0.55], col: [1.12, 1.02, 0.92] },
    ambTop: [0.5, 0.5, 0.6], ambBot: [0.4, 0.34, 0.3], warp: [0.72, 0.42, 0.34], rim: [0.66, 0.66, 0.78], rimPow: 2.6,
    points: [], fogCol: [0.74, 0.72, 0.78], fog: [25, 230], clear: [0.72, 0.7, 0.77], grade: [1.02, 0.99, 1.0, 0.06], vig: 0.22
  };

  const ROOM_ENV = Object.assign({}, PIT_ENV, {
    key: { dir: [0.1, -0.35, -0.95], col: [0.85, 0.82, 0.8] },
    ambTop: [0.3, 0.29, 0.3], ambBot: [0.18, 0.16, 0.15], rim: [0.5, 0.5, 0.56],
    points: [{ pos: [0, 2.0, 3.6], col: [0.6, 0.58, 0.6], k: 0.25 }], fog: [12, 120], vig: 0.35
  });

  const INSIDE_ENV = Object.assign({}, PIT_ENV, {
    key: { dir: [0.3, -0.6, -0.75], col: [0.95, 0.86, 0.74] },
    ambTop: [0.34, 0.31, 0.3], ambBot: [0.2, 0.17, 0.15], rim: [0.55, 0.52, 0.5],
    points: [{ pos: [0, 2.8, -3], col: [0.5, 0.44, 0.36], k: 0.15 }], fog: [10, 80], fogCol: [0.4, 0.37, 0.36], vig: 0.35
  });

  const BUNKER_ENV = Object.assign({}, PIT_ENV, {
    key: { dir: [-0.5, -0.6, -0.6], col: [1.0, 0.95, 0.88] },
    ambTop: [0.45, 0.44, 0.5], ambBot: [0.34, 0.3, 0.28], fog: [30, 200], vig: 0.3
  });

  const CLOSE_ENV = Object.assign({}, PIT_ENV, {
    key: { dir: [0.6, -0.45, -0.65], col: [1.2, 1.04, 0.9] },
    ambTop: [0.42, 0.42, 0.52], ambBot: [0.3, 0.25, 0.22], rim: [0.7, 0.68, 0.8], vig: 0.3
  });

  const SKY_ENV = Object.assign({}, PIT_ENV, {
    key: { dir: [-0.3, -0.5, -0.8], col: [1.15, 1.05, 0.95] },
    ambTop: [0.55, 0.55, 0.65], ambBot: [0.42, 0.36, 0.34], rim: [0.75, 0.75, 0.85]
  });

  const SEAT = [0, 0.68, -0.12];

  function benchPose(o) {
    return seated(Object.assign({ p: SEAT, sp: [0.32, 0, 0] }, o));
  }

  function restHand(s, x, z, pose) {
    const k = s === 'L' ? 1 : -1;
    return hand([x, Props.BENCH.top + 0.06, z], [k * 0.1, -0.15, 1], [0, -1, 0.1], pose || 'rest');
  }

  function bottleMatrix(p, tilt, yaw) {
    const t = tilt || [0, 0];
    return M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw || 0), M4.rotX(t[0]), M4.rotZ(t[1]));
  }

  function bottleGrip(B, s, h) {
    const k = s === 'L' ? 1 : -1;
    const up = axis(B, 1);
    const side = axis(B, 0);
    const front = axis(B, 2);
    const center = M4.point(B, [0, h === undefined ? 0.11 : h, 0]);
    const palmDir = V3.norm(V3.add(V3.mul(side, k * 0.8), V3.mul(front, -0.6)));
    const fingers = V3.norm(V3.cross(up, palmDir));
    const fingersSigned = k > 0 ? V3.mul(fingers, -1) : fingers;
    const wrist = V3.sub(V3.sub(center, V3.mul(palmDir, 0.085)), V3.mul(fingersSigned, 0.045));
    return { target: V3.sub(wrist, V3.mul(up, 0.0)), fingers: fingersSigned, palm: palmDir, pose: 'bottle' };
  }

  const BENCH_M = M4.translate(0, 0, 0.6);
  const BENCH_BOTTLE = [0.62, Props.BENCH.top, 0.42];

  function shedBase(t, st, camera, extra) {
    return Object.assign({ kind: '3d', set: 'shed', env: SHED_ENV, camera, demo: st, face: faceAt(t), bench: true, blur: 0.5 }, extra || {});
  }

  function shotTitle(t) {
    return { shot: 'title', kind: 'title', zoom: 1 + (t - 0.624) * 0.006 };
  }

  const TUNNEL = { run0: -12, run1: -0.2, t0: 4.745, t1: 6.368 };

  function tunnelRunner(t) {
    const k = clamp((t - TUNNEL.t0) / (TUNNEL.t1 - TUNNEL.t0), 0, 1);
    const z = lerp(TUNNEL.run0, TUNNEL.run1, Math.pow(k, 0.9));
    const pose = run({ p: [0.1, z], yaw: 0, phase: t * 1.9, lean: 0.35 });
    return armed(pose, 'launcher', { at: [-0.12, 0.06, 0.32], pitch: -0.2 });
  }

  function fireFront(t) {
    return lerp(-15, -0.5, ease((t - 4.9) / 1.5));
  }

  function shotTunnel(t, which) {
    const st = tunnelRunner(t);
    const eyes = { tunnelA: [0.35, 1.35, 5.2], tunnelB: [0.25, 1.28, 4.4], tunnelC: [0.15, 1.2, 3.8], tunnelD: [0.05, 1.1, 3.2] };
    const e = eyes[which];
    const u = t - SHOTS.find(s => s[1] === which)[0];
    const eye = V3.add(e, [0, 0, -u * 0.35]);
    const fz = fireFront(t);
    const fires = [];
    for (let z = -15; z < fz; z += 0.9) fires.push({ p: [0, 0.2, z], u: t * 0.7 + z * 0.1, s: 1.6, n: 10 });
    const env = Object.assign({}, BUNKER_ENV, { points: [{ pos: [0, 1.4, fz - 1], col: [2.4, 1.3, 0.5], k: 0.12 }] });
    return {
      shot: which, kind: '3d', set: 'bunker', env, camera: cam(eye, [0, 1.15, -7], 40), demo: st, face: faceAt(t), sky: true,
      fires, glowWall: [1, 0.85, 0.5, 1], booms: t > 5.0 ? [{ p: [0, 1.2, Math.min(fz, -2)], u: frac((t - 5) * 0.8) * 0.6, s: 1.8 }] : []
    };
  }

  function shotLeap(t) {
    const u = (t - 6.368) / 4.08;
    const p = V3.lerp([0.05, 1.45, 0.4], [0.15, 1.52, 1.35], ease(u));
    const fwd = [0.15, -0.1, 1];
    const pose = {
      p, fwd, up: V3.norm([0.05, 1, 0.15]), sp: [0.1, -0.15, 0.05], nk: [-0.25, 0.15, 0.0], eL: [0.8, -0.3, -0.6], eR: [-0.8, -0.3, -0.6],
      fLw: V3.add(p, [0.22, -0.55, 0.45]), kLw: V3.add(p, [0.35, 0.2, 1.4]), fRw: V3.add(p, [-0.2, -0.78, -0.4]), kRw: V3.add(p, [-0.3, 0.1, 1.2])
    };
    const st = armed(pose, 'launcher', { at: [-0.1, 0.12, 0.3], yaw: 0.5, pitch: -0.15, roll: -0.2 });
    const eye = V3.lerp([-0.45, 0.8, 3.35], [-0.3, 0.85, 3.2], ease(u));
    const debris = [];
    const g = rand(51);
    for (let i = 0; i < 26; i++) debris.push({ p: [(g() - 0.5) * 3.4, 0.2 + g() * 2.6, -0.4 + g() * 1.6], v: [(g() - 0.5) * 0.5, (g() - 0.3) * 0.4, 0.3 + g() * 0.6], u: (t - 6.368) * 0.5, s: 0.03 + g() * 0.05, seed: i });
    return {
      shot: 'leap', kind: '3d', set: 'bunker', env: Object.assign({}, BUNKER_ENV, { points: [{ pos: [0, 1.4, -0.6], col: [1.6, 0.9, 0.35], k: 0.3 }], key: { dir: [0, -0.3, 1], col: [1.3, 0.85, 0.5] } }),
      camera: cam(eye, [0.1, 1.72, 0.7], 50), demo: st, face: faceAt(t), sky: true, glowWall: [1, 0.5, 0.15, 1],
      fires: [{ p: [0, 0.4, -1.2], u: t * 0.4, s: 2.6, n: 26 }, { p: [-0.8, 1.0, -0.5], u: t * 0.4 + 0.5, s: 2.2, n: 18 }, { p: [0.8, 1.0, -0.5], u: t * 0.4 + 0.2, s: 2.2, n: 18 },
        { p: [-1.9, 0.3, 0.3], u: t * 0.3 + 0.1, s: 1.8, n: 12, w: 1.6 }, { p: [1.9, 0.3, 0.3], u: t * 0.3 + 0.7, s: 1.8, n: 12, w: 1.6 }, { p: [0, 2.6, 0.3], u: t * 0.3 + 0.4, s: 1.6, n: 12, w: 3 }], tints: { concrete: [0.62, 0.48, 0.4] },
      booms: [{ p: [0, 1.3, -1.1], u: 0.2 + u * 0.05, s: 2.0 }], rays: [{ p: [0, 1.4, -0.6], u: 0.3, n: 16, len: 3.0 }], debris, glow: 0.15
    };
  }

  function shotBenchA(t) {
    const u = t - 10.447;
    const nk = spline([[0, [0.05, -0.12, 0.04]], [1.2, [-0.05, -0.05, 0]], [2.2, [0.08, 0.2, -0.08]], [3.0, [0.02, 0.05, 0]], [4.2, [0.06, -0.1, 0.06]], [5.37, [0.02, -0.05, 0]]])(u);
    const sp = spline([[0, [0.42, 0.1, 0]], [1.0, [0.38, 0.05, 0]], [2.0, [0.3, -0.35, 0.05]], [2.6, [0.35, -0.2, 0.0]], [3.4, [0.42, 0.05, 0]], [5.37, [0.4, 0.0, 0]]])(u);
    const pose = benchPose({ sp, nk });
    const chest = chestOf(pose);
    const sweep = ease((t - 11.9) / 0.5) * (1 - ease((t - 13.5) / 0.4));
    const point = ease((t - 13.0) / 0.25) * (1 - ease((t - 14.2) / 0.35));
    const L0 = restHand('L', 0.32, 0.36, 'fist');
    const Lup = hand(M4.point(chest, [0.42, 0.62, 0.42]), [0.3, 0.9, 0.2], [-0.2, 0.2, 1], 'point');
    const L = blendHand(L0, Lup, Math.max(sweep, point));
    const R0 = restHand('R', -0.34, 0.4, 'rest');
    const Rg = hand(M4.point(chest, [-0.3, 0.12, 0.5]), [0.3, 0.1, 1], [0.2, -0.9, 0.2], 'claw');
    const R = blendHand(R0, Rg, ease((t - 14.4) / 0.4) * (1 - ease((t - 15.5) / 0.3)));
    const st = demoState(pose, { L, R });
    const eye = spline([[0, [-0.12, 1.2, 1.62]], [5.37, [-0.1, 1.2, 1.55]]])(u);
    return shedBase(t, st, cam(V3.add(eye, shake(t, 0.004, 2)), [-0.02, 1.17, 0.0], 35), { shot: 'benchA', bottle: { M: bottleMatrix(BENCH_BOTTLE) } });
  }

  function shotLetsDo(t) {
    const u = t - 15.817;
    const lift = ease(u / 0.6);
    const turn = ease((t - 18.1) / 0.5);
    const pose = stand({ p: [-0.2, -0.3], yaw: lerp(0.35, -0.9, turn), sp: [lerp(0.15, -0.05, lift), lerp(0, 0.25, lift), 0], nk: [lerp(0, -0.4, lift), 0.15, 0.05], spread: 0.1, stepL: 0.15 });
    const st = armed(pose, 'launcher', { at: [-0.14, lerp(0.02, 0.16, lift), 0.32], yaw: 0.45, pitch: lerp(0.1, -0.55, lift), roll: -0.25 });
    const soldier = { cls: 'soldier', team: 'red', pose: FP.stand('soldier', 1.4, -2.0, -0.4, {}) };
    const g = FP.aimGun('soldier', 'rocket');
    Object.assign(soldier.pose, { hR: g.hR, hL: g.hL });
    soldier.gun = 'rocket';
    soldier.gunM = g.gunM;
    const eye = V3.add([0.1, 0.8, 1.35], shake(t, 0.01, 3));
    return { shot: 'letsdo', kind: '3d', set: 'room', env: ROOM_ENV, camera: cam(eye, [0.4, 1.5, -1.6], 54, 0.06), demo: st, face: faceAt(t), actors: [soldier], blur: 0.2, sky: true, tints: { concrete: [0.62, 0.6, 0.6] } };
  }

  function shotDoor(t) {
    const u = (t - 18.731) / 0.624;
    const z = lerp(2.5, 5.2, u);
    const pose = run({ p: [0.2, z], yaw: 0.05, phase: t * 1.9 });
    const st = armed(pose, 'launcher', {});
    const runner = { cls: 'soldier', team: 'red', pose: FP.run('soldier', lerp(-3.5, 1.5, u), 7.2, PI / 2, t * 1.7, {}) };
    return {
      shot: 'door', kind: '3d', set: 'room', env: Object.assign({}, ROOM_ENV, { key: { dir: [0.2, -0.5, -0.85], col: [0.3, 0.28, 0.28] }, ambTop: [0.12, 0.12, 0.13], ambBot: [0.06, 0.06, 0.06] }),
      camera: cam([-0.1, 1.05, 0.7], [0.25, 1.15, 6], 50), demo: st, face: faceAt(t), actors: [runner], sky: true
    };
  }

  function shotShaft(t) {
    const u = (t - 19.355) / 0.583;
    const y = lerp(1.6, 4.6, ease(u));
    const pose = { p: [-1.5, y, -1.5], fwd: [0, 0.2, 1], up: [0.1, 1, -0.1], sp: [0.2, 0, 0], nk: [0.2, 0, 0], fLw: [-1.42, y - 0.75, -1.35], kLw: [-1.4, y, 0], fRw: [-1.62, y - 0.85, -1.6], kRw: [-1.6, y, 0] };
    const st = armed(pose, 'sticky', { at: [-0.14, 0.12, 0.3], pitch: -0.6 });
    return { shot: 'shaft', kind: '3d', set: 'room', env: Object.assign({}, ROOM_ENV, { ambTop: [0.3, 0.3, 0.33], ambBot: [0.2, 0.19, 0.19] }), camera: Object.assign(cam([-1.25, 0.6, -0.9], [-1.5, 4.6, -1.6], 64), { up: [0, 0, -1] }), demo: st, face: faceAt(t), sky: true };
  }

  const ROCK_SPOT = [3.1, 0.6];

  function shotFlight(t) {
    const u = (t - 19.938) / 0.791;
    const p = V3.lerp([1.6, 1.4, -1.0], [-1.0, 4.2, -2.6], ease(u));
    const pose = { p, fwd: [-0.6, 0.3, 0.8], up: V3.norm([-0.2, 1, 0.3]), sp: [0.3, 0, 0.1], nk: [-0.1, 0.2, 0], fLw: V3.add(p, [0.3, -0.5, 0.2]), kLw: V3.add(p, [0.6, 0.4, 1]), fRw: V3.add(p, [0.1, -0.7, -0.3]), kRw: V3.add(p, [0, 0.4, 1]) };
    const st = armed(pose, 'launcher', { pitch: -0.4 });
    return {
      shot: 'flight', kind: '3d', set: 'rock', env: PIT_ENV, camera: cam([1.9, 1.4, 1.1], V3.add(p, [0.3, 0.1, 0]), 52, -0.15), demo: st, face: faceAt(t), sky: true,
      booms: [{ p: [2.4, 0.4, -1.6], u: 0.1 + u * 0.45, s: 1.5 }], rays: [{ p: [2.4, 0.5, -1.6], u: u, n: 12, len: 2.0 }], blur: 0.15
    };
  }

  function coverPose(t, lean) {
    const pose = crouch({ p: ROCK_SPOT, yaw: -PI / 2 + 0.35, depth: 0.32 - lean * 0.12, sp: [0.3 - lean * 0.15, 0.3 * lean, -0.1], nk: [-0.15, -0.3 * lean, 0], leadL: 0.25, leadR: -0.15 });
    return armed(pose, 'launcher', { at: [-0.1, 0.06, 0.34], yaw: 0.1, pitch: -0.1 });
  }

  function shotCover1(t) {
    const u = t - 20.729;
    const st = coverPose(t, 0.2 + S(u * 2) * 0.1);
    const eye = V3.add([2.5, 1.2, 2.05], shake(t, 0.012, 5));
    return {
      shot: 'cover1', kind: '3d', set: 'rock', env: PIT_ENV, camera: cam(eye, V3.add(headPos(st), [-0.2, -0.3, 0]), 46), demo: st, face: faceAt(t), sky: true,
      booms: [{ p: [5.2, 0.5, -4.5], u: clamp(u / 1.1, 0, 1), s: 3.2 }], debris: debrisBurst([5.2, 0.6, -4.5], u, 60, 16), smokes: [{ p: [5.2, 1.0, -4.5], u: u * 0.6, s: 2.5, n: 10 }],
      fullFlash: u < 0.25 ? (1 - u / 0.25) * 0.7 : 0
    };
  }

  function debrisBurst(p, u, seed, n) {
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < n; i++) out.push({ p, v: [(g() - 0.5) * 7, 3 + g() * 6, (g() - 0.5) * 7], u, s: 0.05 + g() * 0.12, seed: seed + i, grav: true });
    return out;
  }

  function shotCover2(t) {
    const u = t - 22.019;
    const lean = spline([[0, 0.3], [0.8, 0.55], [1.4, 0.4], [1.9, 0.75]])(u);
    const st = coverPose(t, lean);
    const h = headPos(st);
    const eye = V3.add(V3.add(h, [-0.15, -0.16, 0.85]), shake(t, 0.006, 6));
    return { shot: 'cover2', kind: '3d', set: 'rock', env: CLOSE_ENV, camera: cam(eye, V3.add(h, [-0.18, -0.12, 0]), 40), demo: st, face: faceAt(t), sky: true, blur: 0.25, smokes: [{ p: [5.2, 2.0, -4.5], u: 0.6 + u * 0.3, s: 3, n: 10 }] };
  }

  function grenadeArc(from, to, k, h) {
    const p = V3.lerp(from, to, k);
    p[1] += S(k * PI) * (h || 2.0);
    return p;
  }

  function shotWideFire(t) {
    const u = t - 23.934;
    const lean = 0.9;
    const pose = crouch({ p: [3.7, 1.8], yaw: 2.4, depth: 0.15, sp: [0.05, 0.25, -0.15], nk: [-0.05, -0.2, 0], leadL: 0.35, leadR: -0.2 });
    const st = armed(pose, 'launcher', { at: [-0.1, 0.12, 0.34], pitch: -0.35 });
    const muzzle = Props.launcherMuzzle(st.gun.M).p;
    const trails = [0, 0.22, 0.44].map((d, i) => ({ from: muzzle, to: [12 + i * 1.5, 4.2, -14], k: (u - d) / 0.7, i, kind: 'pipe', h: 2.2 }));
    const sniper = { cls: 'sniper', team: 'blu', pose: FP.stand('sniper', 13.5, -13.2, 0.5, { y: 4.7 }) };
    const kick = Math.max(0, 1 - frac(u / 0.22) * 4) * (u < 0.66 ? 1 : 0);
    return {
      shot: 'widefire', kind: '3d', set: 'rock', env: PIT_ENV, camera: cam([1.4, 1.5, 7.2], [8, 2.6, -6], 50), demo: st, face: faceAt(t), sky: true, actors: [sniper], trails,
      flashes: kick > 0.2 ? [{ p: muzzle, dir: Props.launcherMuzzle(st.gun.M).dir, s: 0.5 * kick }] : []
    };
  }

  function shotBlast(t) {
    const u = t - 24.641;
    const fly = ease(u / 0.5);
    const p = V3.lerp([0.4, 0.8, -0.6], [3.2, 1.6, 1.6], fly);
    const pose = { p, fwd: [0.7, -0.2, 0.7], up: V3.norm([0.4, 1, 0.2]), sp: [0.4, 0, 0.3], nk: [0.2, 0, 0], fLw: V3.add(p, [-0.4, -0.5, -0.2]), kLw: V3.add(p, [0.6, 0.4, 1]), fRw: V3.add(p, [-0.6, -0.4, 0.2]), kRw: V3.add(p, [0.6, 0.4, 1]) };
    const st = armed(pose, 'launcher', {});
    return {
      shot: 'blast', kind: '3d', set: 'rock', env: PIT_ENV, camera: cam(V3.add([4.2, 1.2, 4.2], shake(t, 0.05, 7)), [0.8, 1.2, -0.5], 54), demo: u < 0.55 ? st : null, face: faceAt(t), sky: true,
      booms: [{ p: [0.8, 0.9, -0.9], u: clamp(u / 0.8, 0, 1), s: 3.4 }], smokes: [{ p: [1.4, 1.2, 0], u: u * 0.9, s: 3.2, n: 14 }], debris: debrisBurst([0.8, 0.9, -0.9], u, 90, 20),
      fullFlash: u < 0.3 ? 0.85 * (1 - u / 0.3) : 0
    };
  }

  function shotBenchB(t) {
    const u = t - 25.432;
    const lunge = ease((t - 29.4) / 0.35) * (1 - ease((t - 31.7) / 0.5));
    const spread = ease((t - 29.4) / 0.3) * (1 - ease((t - 30.0) / 0.4));
    const sp = spline([[0, [0.3, 0.05, 0]], [1.5, [0.36, -0.08, 0.03]], [2.6, [0.4, 0.1, -0.02]], [3.6, [0.34, -0.12, 0.04]], [4.0, [0.45, 0.0, 0]], [5.2, [0.5, 0.05, 0]], [6.91, [0.36, 0.3, 0.05]]])(u);
    const nk = spline([[0, [0.0, 0.0, 0]], [1.4, [0.06, -0.1, 0.05]], [2.8, [-0.05, 0.1, -0.04]], [4.0, [-0.12, 0, 0]], [5.2, [-0.12, 0, 0]], [5.8, [-0.06, 0.12, 0]], [6.3, [0.12, 0.3, 0]], [6.91, [0.1, 0.4, 0]]])(u);
    const pose = benchPose({ sp: V3.add(sp, [lunge * 0.25, 0, 0]), nk: V3.add(nk, [-lunge * 0.45, 0, 0]), p: V3.add(SEAT, [0, lunge * 0.04, lunge * 0.12]) });
    const chest = chestOf(pose);
    const fistR = ease((t - 27.0) / 0.3) * (1 - ease((t - 29.2) / 0.3));
    const fistL = ease((t - 28.1) / 0.3) * (1 - ease((t - 29.3) / 0.25));
    const wideL = hand(M4.point(chest, [0.6, 0.3, 0.5]), [0.6, 0.5, 0.6], [-0.3, -0.3, 1], 'open');
    const wideR = hand(M4.point(chest, [-0.6, 0.3, 0.5]), [-0.6, 0.5, 0.6], [0.3, -0.3, 1], 'open');
    let L = blendHand(restHand('L', 0.36, 0.34, 'rest'), hand(M4.point(chest, [0.25, 0.3, 0.45]), [0.1, 0.9, 0.2], [-0.3, 0, 1], 'fist'), fistL);
    let R = blendHand(restHand('R', -0.34, 0.36, 'rest'), hand(M4.point(chest, [-0.25, 0.35, 0.45]), [-0.1, 0.9, 0.2], [0.3, 0, 1], 'fist'), fistR);
    L = blendHand(L, wideL, spread);
    R = blendHand(R, wideR, spread);
    const take = ease((t - 30.4) / 0.4);
    let bottleM = bottleMatrix(BENCH_BOTTLE);
    if (take > 0) {
      const lift = ease((t - 30.7) / 0.4) * (1 - ease((t - 31.9) / 0.4));
      const pos = V3.lerp(BENCH_BOTTLE, [0.4, 1.05, 0.38], lift);
      bottleM = bottleMatrix(pos, [lift * -0.2, lift * 0.1]);
      L = blendHand(L, bottleGrip(bottleM, 'L'), take);
    }
    const st = demoState(pose, { L, R });
    const push = ease(u / 6.9);
    const eye = V3.lerp([0.05, 1.2, 1.62], [0.0, 1.22, 1.42], push);
    return shedBase(t, st, cam(V3.add(eye, shake(t, 0.004, 8)), [0.02, 1.16, 0.0], 38), { shot: 'benchB', bottle: { M: bottleM }, blur: 0.45 });
  }

  function yardDemo(t) {
    const pose = stand({ p: [-0.9, 4.4], yaw: 2.3, sp: [0.12, 0.2, 0], nk: [-0.05, -0.25, 0], spread: 0.12, stepL: 0.18 });
    return armed(pose, 'launcher', { at: [-0.12, 0.06, 0.34], pitch: -0.25 });
  }

  function shotYard(t) {
    const u = t - 32.342;
    const st = yardDemo(t);
    const muzzle = Props.launcherMuzzle(st.gun.M);
    const trails = [0, 0.3, 0.6].map((d, i) => ({ from: muzzle.p, to: [12 - i * 2, 4.0, -9.3], k: (u - d) / 0.9, i, kind: 'pipe', h: 1.6 }));
    const kick = Math.max(0, 1 - frac(u / 0.3) * 4);
    return {
      shot: 'yard', kind: '3d', set: 'yard', env: PIT_ENV, camera: cam(V3.lerp([0.2, 1.35, 5.6], [0.4, 1.4, 5.4], u), [-1.2, 2.6, -10], 50), demo: st, face: faceAt(t), sky: true, trails,
      flashes: kick > 0.3 ? [{ p: muzzle.p, dir: muzzle.dir, s: 0.55 * kick }] : []
    };
  }

  function shotWallGren(t) {
    const u = (t - 33.341) / 0.708;
    const p = V3.lerp([1.6, 4.4, -9.0], [11.5, 3.0, -9.0], u);
    p[1] += S(u * PI) * 0.4;
    return {
      shot: 'wallgren', kind: '3d', set: 'yard', env: PIT_ENV, camera: cam(V3.add(p, [-1.6, -0.2, 2.2]), V3.add(p, [0.4, -0.1, 0]), 46), sky: true,
      pipes: [{ M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotZ(-1.2 + u * 6), M4.rotX(0.3)), glow: 1 }], blur: 0
    };
  }

  function shotPyro(t) {
    const u = t - 34.049;
    const pyro = { cls: 'pyro', team: 'blu', pose: FP.run('pyro', 12.6 + u * 2.5, -7.8, PI / 2 + 0.3, t * 1.6, { y: 1.1 }), gun: 'flamer' };
    const g = FP.aimGun('pyro', 'flamer');
    Object.assign(pyro.pose, { hR: g.hR, hL: g.hL });
    pyro.gunM = g.gunM;
    const soldier = { cls: 'soldier', team: 'red', pose: FP.stand('soldier', 13.6, -10.0, 0.2, {}) };
    return {
      shot: 'pyro', kind: '3d', set: 'yard', env: PIT_ENV, camera: cam([9.6, 2.0, -3.6], [13.2, 1.6, -8.4], 44), sky: true, actors: [pyro, soldier],
      fires: [{ p: [12.6 + u * 2.5, 1.5, -7.8], u: t, s: 0.6, n: 10 }], pipes: [{ M: M4.chain(M4.translate(lerp(11.2, 12.8, u * 2), 1.4, -7.6), M4.rotZ(u * 9)), glow: 1 }]
    };
  }

  function shotBoom(t) {
    const u = t - 34.548;
    return {
      shot: 'boom', kind: '3d', set: 'yard', env: PIT_ENV, camera: cam([11.6, 1.8, -5.2], [13.0, 1.6, -8.0], 50), sky: true,
      booms: [{ p: [12.8, 1.5, -7.4], u: 0.12 + u * 1.4, s: 4.0 }], debris: debrisBurst([12.8, 1.5, -7.4], u + 0.1, 120, 24), fullFlash: 0.4
    };
  }

  function shotDanger(t) {
    const u = t - 34.673;
    const at = [25.62, 2.0, 3.45];
    return {
      shot: 'danger', kind: '3d', set: 'yard', env: PIT_ENV, camera: cam(V3.add([23.4, 1.95, 3.6], [u * 0.15, 0, -u * 0.5]), V3.add(at, [0, 0, -u * 0.35]), 40, 0.12), sky: true,
      debris: debrisBurst([22, 2.5, 6], u + 0.3, 140, 14), smokes: [{ p: [23.5, 1.8, 5.0], u: 0.4 + u * 0.5, s: 2.4, n: 8 }]
    };
  }

  function drinkState(t, t0, t1, o) {
    const up = ease((t - t0) / 0.45) * (1 - ease((t - t1 + 0.3) / 0.4));
    const pose = benchPose({ sp: [lerp(0.32, -0.12, up), 0.1, 0], nk: [lerp(0.0, -0.7, up), 0.1, 0.05] });
    const st0 = demoState(pose, { L: restHand('L', 0.32, 0.36, 'rest'), R: restHand('R', -0.32, 0.36, 'rest') });
    const mouth = M4.point(st0.m.head, [0, -0.07, 0.13]);
    const axisUp = V3.norm(V3.lerp([0.1, 1, 0], [-0.25, -0.75, -0.6], up));
    const neckTip = V3.lerp([0.5, 1.2, 0.5], mouth, up);
    const bottom = V3.sub(neckTip, V3.mul(axisUp, 0.31));
    const B = frameAt(bottom, V3.cross([1, 0, 0], axisUp), axisUp);
    const Bm = basisAt(bottom, V3.norm(V3.cross(axisUp, [0, 0, 1])), axisUp, V3.norm(V3.cross(V3.norm(V3.cross(axisUp, [0, 0, 1])), axisUp)));
    const L = bottleGrip(Bm, 'L', 0.1);
    const st = demoState(pose, { L, R: restHand('R', -0.32, 0.36, 'rest') });
    return { st, bottleM: Bm, up, B };
  }

  function shotDrink(t, which) {
    const ranges = { drinkA: [35.339, 37.462], drinkB: [39.252, 40.917], drinkC: [42.332, 43.456] };
    const [t0, t1] = ranges[which];
    const d = drinkState(t, t0 - 0.6, t1 + 0.8);
    const h = headPos(d.st);
    const cams = {
      drinkA: cam(V3.add(h, [0.42, -0.38, 1.3]), V3.add(h, [0.06, -0.02, 0]), 44),
      drinkB: cam(V3.add(h, [0.3, -0.15, 0.95]), V3.add(h, [0.06, 0.06, 0]), 42),
      drinkC: cam(V3.add(h, [0.34, 0.2, 0.44]), V3.add(h, [0.03, 0.02, 0.03]), 38)
    };
    return shedBase(t, d.st, cams[which], { shot: which, bottle: { M: d.bottleM }, face: faceAt(t, { round: 0.8, jaw: 0.25 }), blur: 0.55 });
  }

  const SENTRY_AT = [1.2, 0, 1.6];

  function sentryState(t, o) {
    return Object.assign({ level: 2, at: SENTRY_AT, yaw: -0.3 + S(t * 0.7) * 0.5, pitch: 0.04, spin: 0, team: 'blu' }, o || {});
  }

  function shotSentryA(t) {
    const u = t - 37.462;
    return {
      shot: 'sentryA', kind: '3d', set: 'sentry', env: PIT_ENV, camera: cam(V3.lerp([0.15, 0.95, 3.1], [0.3, 1.0, 3.0], u / 1.8), [1.25, 1.42, 1.65], 44, 0.06), sky: true,
      sentry: sentryState(t, { yaw: spline([[0, -2.5], [0.9, -2.15], [1.79, -1.85]])(u) }), blur: 0
    };
  }

  function shotSentryB(t) {
    const u = t - 40.917;
    const fire = u > 0.25 ? 1 : 0;
    const scoutK = clamp(u / 1.2, 0, 1);
    const scout = { cls: 'scout', team: 'red', pose: u < 1.0 ? FP.run('scout', -0.6, lerp(20, 10, scoutK), PI, t * 2.2, {}) : FP.prone('scout', -0.6, 9.4, PI, {}) };
    return {
      shot: 'sentryB', kind: '3d', set: 'sentry', env: PIT_ENV, camera: cam(V3.add([2.5, 1.55, -0.1], shake(t, 0.01, 9)), [-0.5, 1.0, 16], 50), sky: true, actors: [scout],
      sentry: sentryState(t, { yaw: -0.08, pitch: 0.02, spin: t * 30 * fire }), sentryFire: fire ? { tracers: true, s: 0.8 } : null
    };
  }

  const COVER_DEMO = [-2.4, 6.0];

  function coverFireDemo(t) {
    const pose = crouch({ p: COVER_DEMO, yaw: PI / 2 - 0.25, depth: 0.3, sp: [0.25, 0, 0], nk: [-0.1, 0, 0] });
    return armed(pose, 'launcher', { at: [-0.1, 0.12, 0.36], pitch: -0.45 });
  }

  function shotCoverFire(t) {
    const u = t - 43.456;
    const st = coverFireDemo(t);
    const muzzle = Props.launcherMuzzle(st.gun.M);
    const scout = { cls: 'scout', team: 'red', pose: u < 0.6 ? FP.run('scout', -0.4, lerp(11.5, 9.6, u / 0.6), PI, t * 2.2, {}) : FP.prone('scout', -0.4, 9.2, PI + 0.4, {}) };
    const trails = u > 1.25 ? [{ from: muzzle.p, to: [1.2, 0.25, 2.2], k: (u - 1.25) / 0.85, i: 0, kind: 'pipe', h: 2.8 }] : [];
    const h = headPos(st);
    const swing = ease((u - 1.0) / 0.35);
    const gunEye = M4.point(st.gun.M, [-0.42, 0.1, 0.0]);
    const camera = cam(V3.lerp(gunEye, V3.add(h, [-0.6, 0.35, 0.35]), swing), V3.lerp([-0.4, 0.5, 9.4], [1.2, 0.9, 1.6], swing), 48);
    return { shot: 'coverfire', kind: '3d', set: 'sentry', env: PIT_ENV, camera, demo: st, face: faceAt(t), sky: true, actors: [scout], trails, sentry: sentryState(t, { yaw: -0.4 }), blur: u > 1.0 && u < 1.35 ? 0.5 : 0.15 };
  }

  function rollPipes(t, t0, from, to, dur) {
    const g = rand(77);
    const out = [];
    for (let i = 0; i < 3; i++) {
      const k = clamp((t - t0 - i * 0.16) / (dur || 1.5), 0, 1);
      const a = V3.add(from, [i * 0.35, 0, i * 0.3]), b = V3.add(to, [i * 0.25, 0, i * 0.22]);
      const p = V3.lerp(a, b, k);
      const bounce = Math.abs(S(k * PI * 3)) * (1 - k) * 0.4;
      out.push({ M: M4.chain(M4.translate(p[0], 0.035 + bounce, p[2]), M4.rotY(0.4 + g()), M4.rotX(PI / 2), M4.rotY(k * 12)), glow: 0.8 });
    }
    return out;
  }

  function shotRoll(t) {
    const u = t - 45.4955;
    return {
      shot: 'roll', kind: '3d', set: 'sentry', env: PIT_ENV, camera: cam(V3.lerp([-0.35, 0.13, 3.95], [-0.4, 0.12, 3.9], u / 1.46), [-1.6, 0.1, 4.9], 38), sky: true,
      pipes: rollPipes(t, 45.4, [-2.6, 0, 5.4], [0.6, 0, 3.9], 1.6), sentry: sentryState(t, { yaw: -0.4 }), blur: 0.1
    };
  }

  function shotSentryC(t) {
    const u = t - 46.952;
    return {
      shot: 'sentryC', kind: '3d', set: 'sentry', env: PIT_ENV, camera: cam(V3.lerp([-1.8, 0.5, 6.4], [-1.5, 0.42, 5.8], u), [1.3, 1.0, 1.6], 46, -0.05), sky: true,
      pipes: rollPipes(t, 46.2, [-0.6, 0, 3.8], [0.7, 0, 2.3], 1.6), sentry: sentryState(t, { yaw: spline([[0, -0.3], [0.6, -0.9], [1.2, -1.3]])(u), pitch: -0.25 })
    };
  }

  function shotSentryBoom(t) {
    const u = t - 48.326;
    return {
      shot: 'sentryboom', kind: '3d', set: 'sentry', env: PIT_ENV, camera: cam(V3.add([-1.6, 0.8, 7.6], shake(t, 0.04 * (1 - clamp(u, 0, 1)), 11)), [1.2, 1.0, 1.6], 50), sky: true,
      sentry: u < 0.25 ? sentryState(t, { yaw: -1.3 }) : sentryState(t, { yaw: -1.3, broken: true }),
      booms: [{ p: [1.2, 0.9, 1.6], u: clamp(u / 1.2, 0, 1), s: 3.6 }], smokes: [{ p: [1.2, 1.2, 1.6], u: u * 0.5, s: 3, n: 14 }], debris: debrisBurst([1.2, 0.9, 1.6], u, 150, 22),
      fullFlash: u < 0.35 ? 0.9 * (1 - u / 0.35) : 0
    };
  }

  function shotBenchF(t) {
    const u = t - 50.033;
    const sp = spline([[0, [0.55, 0.3, 0.05]], [0.6, [0.42, 0.15, 0]], [2.2, [0.34, 0.05, 0]], [3.3, [0.3, -0.1, 0.03]], [5.0, [0.36, 0.05, 0]], [7.3, [0.28, 0.12, -0.03]], [9.4, [0.32, 0.25, 0]],
      [11.5, [0.36, 0.1, 0]], [13.4, [0.45, 0.35, 0.05]], [14.15, [0.32, 0.1, 0]]])(u);
    const nk = spline([[0, [0.3, 0.2, 0.05]], [0.8, [0.1, 0.05, 0]], [2.0, [0.0, -0.05, 0.05]], [3.5, [-0.05, 0.08, 0]], [5.5, [0.04, -0.05, 0.05]], [7.4, [-0.08, 0.1, -0.05]], [9.5, [0.0, -0.1, 0.0]],
      [11.6, [0.05, 0.0, 0.05]], [13.4, [0.2, 0.3, 0]], [14.15, [0.0, 0.1, 0]]])(u);
    const pose = benchPose({ sp, nk });
    const chest = chestOf(pose);
    const hold = spline([[0, [0.5, 1.15, 0.45]], [0.5, [0.42, Props.BENCH.top + 0.002, 0.42]], [7.0, [0.4, Props.BENCH.top + 0.002, 0.44]], [7.6, [0.32, 1.1, 0.45]], [9.0, [0.28, 1.15, 0.42]],
      [9.6, [0.34, 1.18, 0.3]], [12.6, [0.33, 1.16, 0.32]], [13.4, [0.6, 1.25, 0.3]], [13.8, [0.5, 1.0, 0.35]], [14.15, [0.45, 0.9, 0.4]]])(u);
    const tilt = spline([[0, [-0.5, 0.4]], [0.5, [0, 0]], [7.0, [0, 0]], [7.6, [0.1, 0.05]], [12.6, [0.1, 0.1]], [13.4, [-0.4, 0.6]], [14.15, [0, 0.2]]])(u);
    const B = bottleMatrix(hold, tilt);
    const L = bottleGrip(B, 'L', 0.12);
    const eyePoint = ease((t - 52.4) / 0.3) * (1 - ease((t - 53.4) / 0.35));
    const Rg = hand(M4.point(chest, [-0.2, 0.62, 0.46]), [0.4, 0.9, 0.1], [0.3, -0.1, 1], 'point');
    const Rgest = hand(M4.point(chest, [-0.35, 0.2, 0.5]), [0.2, 0.3, 1], [0.3, -0.9, 0.3], 'claw');
    let R = restHand('R', -0.34, 0.38, 'rest');
    R = blendHand(R, Rgest, ease((t - 54.6) / 0.4) * (1 - ease((t - 56.6) / 0.4)) + ease((t - 59.8) / 0.3) * (1 - ease((t - 61.6) / 0.4)));
    R = blendHand(R, Rg, eyePoint);
    const st = demoState(pose, { L, R });
    const k = ease(u / 14);
    const eye = V3.lerp([0.2, 1.24, 1.05], [0.12, 1.22, 0.92], k);
    return shedBase(t, st, cam(V3.add(eye, shake(t, 0.004, 12)), [0.06, 1.2, 0.0], 38), { shot: 'benchF', bottle: { M: B } });
  }

  function shotStairs(t) {
    const u = t - 64.185;
    const H = window.DemoSets.HALLS.stair;
    let st, camera, set, actors = [];
    if (u < 1.2) {
      const k = u / 1.2;
      const z = lerp(-2.4, -8.6, k);
      const floor = clamp((-2 - z) / 0.6, 0, 12) * 0.25;
      const pose = run({ p: [H.x, H.z + z], yaw: PI, phase: t * 1.8, floor, lean: 0.4 });
      st = armed(pose, 'launcher', {});
      camera = cam([H.x + 0.2, 1.9 + floor * 0.8, H.z + z + 2.6], [H.x, 2.2 + floor, H.z + z - 3], 52);
      set = 'inside';
    } else {
      const k = clamp((u - 1.2) / 1.6, 0, 1);
      const p = V3.lerp([-2.0, 6.0], [3.4, 1.6], ease(k));
      const pose = k < 1 ? run({ p, yaw: 2.3, phase: t * 1.8 }) : stand({ p: [3.4, 1.6], yaw: 2.0 });
      st = armed(pose, 'launcher', {});
      const rev = clamp((u - 2.6) / 1.0, 0, 1);
      camera = cam(V3.lerp(V3.add([p[0], 1.6, p[1]], [-1.2, 0.2, 2.2]), [4.6, 1.65, 3.2], ease(rev)), V3.lerp([p[0] + 1, 1.3, p[1] - 2], [-2, 1.4, -14], ease(rev)), 52);
      set = 'point';
      const adv = clamp((u - 2.2) / 1.5, 0, 1);
      actors = bluTeam(lerp(-24, -16, adv), t, 0.15);
    }
    return { shot: 'stairs', kind: '3d', set, env: set === 'inside' ? INSIDE_ENV : PIT_ENV, camera, demo: st, face: faceAt(t), sky: set !== 'inside', actors, glowWall: [1, 0.98, 0.94, 1] };
  }

  function bluTeam(z, t, spread) {
    const list = [
      ['medic', -2.0, 0.6, 'medigun'], ['spy', -3.0, -1.6, null], ['soldier', 1.6, -1.2, 'rocket'], ['sniper', 2.8, -2.4, 'rifle'], ['engineer', -1.2, -2.8, 'shotgun'], ['scout', 3.8, -0.4, 'scatter']
    ];
    return list.map(([cls, dx, dz, gun], i) => {
      const pose = FP.run(cls, -2 + dx * (1 + spread), z + dz, 0.05 * (i % 2 ? 1 : -1), t * 1.7 + i * 0.3, {});
      const a = { cls, team: 'blu', pose };
      if (gun) {
        const g = FP.aimGun(cls, gun);
        Object.assign(pose, { hR: g.hR, hL: g.hL });
        a.gun = gun;
        a.gunM = g.gunM;
      }
      if (cls === 'spy') a.itemR = 'revolver';
      return a;
    });
  }

  const HX = {
    grin: { browDown: 0.5, smile: 0.95, wide: 0.6, lidU: 0.5, lidL: 0.5, jaw: 0.08 },
    worried: { browUp: 0.8, browInUp: 0.9, frown: 0.5, lidU: 0.85, lidL: 0.2, jaw: 0.1 }
  };

  function heavyPose(o) {
    const yaw = o.yaw || 0;
    const HD = Heavy.D;
    const sY = HD.thigh + HD.shin + 0.075 - HD.hipY - 0.02;
    const fwd = [S(yaw), 0, C(yaw)], side = [C(yaw), 0, -S(yaw)];
    const p = [o.p[0], sY + (o.dy || 0), o.p[1]];
    const pose = { p, fwd, up: [0, 1, 0], sp: o.sp || [0.08, 0, 0], nk: o.nk || [0, 0, 0], eL: [0.85, -0.75, -0.15], eR: [-0.85, -0.75, -0.15] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const step = o['step' + s] || 0;
      const f = V3.add([p[0], 0, p[2]], V3.add(V3.mul(side, k * (HD.hipX + 0.06)), V3.mul(fwd, step)));
      pose['f' + s + 'w'] = [f[0], 0.075 + (o['lift' + s] || 0), f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.5 + side[0] * k * 0.3, 0.6, fwd[2] * 1.5 + side[2] * k * 0.3]);
    });
    return pose;
  }

  function heavyArmed(pose) {
    const chest = Heavy.solve(pose).chest;
    const G = M4.chain(chest, M4.translate(0.05, -0.36, 0.6), M4.rotY(-PI / 2 - 0.3), M4.rotZ(-0.28));
    const MP = window.MeetProps;
    const handAt = (local, fingersL, palmL, poseName) => {
      const M = MP.gunM(G);
      const pos = M4.point(M, local);
      const fingers = V3.norm(M4.dir(M, fingersL));
      const palm = V3.norm(M4.dir(M, palmL));
      return { target: V3.add(V3.sub(pos, V3.mul(fingers, 0.075)), V3.mul(palm, -0.035)), fingers, palm, pose: poseName };
    };
    const hands = { R: handAt([-0.56, 0.08, 0.07], [0, -1, 0.15], [0, 0, -1], 'grip'), L: handAt([-0.36, 0.28, 0], [0.2, -0.6, 1], [0, -1, 0.2], 'grip') };
    const p = Object.assign({}, pose, { hLw: hands.L.target, hRw: hands.R.target });
    const m = Heavy.solve(p);
    const hm = {};
    ['L', 'R'].forEach(s => { hm[s] = { pose: hands[s].pose, M: Heavy.handBasis(m.pts['wrist' + s], hands[s].fingers, hands[s].palm) }; });
    return { m, hands: hm, gun: { M: G, spin: 0 } };
  }

  function heavyFace(e, t, extra) {
    return Object.assign({ browDown: 0, browUp: 0, browInUp: 0, smile: 0, frown: 0, wide: 0, round: 0, sneer: 0, lidU: 0.55, lidL: 0.35, jaw: 0, blink: 0, look: [0, 0] }, e, extra || {});
  }

  function shotSurprised(t) {
    const pose = stand({ p: [0.6, 2.0], yaw: -0.15, sp: [0.02, 0, 0], nk: [0.05, 0.1, 0] });
    const st = armed(pose, 'launcher', { at: [-0.1, 0.0, 0.3], pitch: -0.1 });
    const h = headPos(st);
    return { shot: 'surprised', kind: '3d', set: 'point', env: CLOSE_ENV, camera: cam(V3.add(h, [-0.08, -0.06, 0.62]), V3.add(h, [-0.06, -0.04, 0]), 34), demo: st, face: faceAt(t, { jaw: 0.12 }), sky: true, blur: 0.6 };
  }

  function shotBluHeavy(t) {
    const u = t - 68.764;
    const z = lerp(-10, -7.6, u / 3.2);
    const pose = heavyPose({ p: [-1.6, z], yaw: 0.05, sp: [0.12, 0, 0], nk: [-0.1, 0, 0], stepL: 0.2 });
    const H = heavyArmed(pose);
    const hd = M4.point(H.m.head, [0, 0, 0]);
    const push = ease(clamp((u - 0.4) / 2.4, 0, 1));
    const eye = V3.lerp(V3.add(hd, [0.35, -0.45, 1.35]), V3.add(hd, [0.05, -0.04, 0.5]), push);
    const actors = bluTeam(z - 1.6, t, 0.05).filter(a => a.cls !== 'scout');
    return {
      shot: 'bluheavy', kind: '3d', set: 'point', env: PIT_ENV, camera: cam(eye, V3.add(hd, [0, -0.08 + push * 0.05, 0]), lerp(46, 34, push)), sky: true, actors, blur: 0.35,
      bluHeavy: Object.assign(H, { face: heavyFace(HX.grin, t) })
    };
  }

  function shotDetermined(t) {
    const u = t - 71.969;
    const turn = ease((u - 0.85) / 0.5);
    const pose = stand({ p: [0.6, 2.0], yaw: lerp(-0.1, 2.6, turn), sp: [0.05, 0, 0], nk: [-0.15, 0, 0] });
    const st = armed(pose, 'launcher', { at: [-0.02, -0.08, 0.28], yaw: 1.25, pitch: 0.25 });
    const h = headPos(st);
    return { shot: 'determined', kind: '3d', set: 'point', env: CLOSE_ENV, camera: cam([0.5, 0.95, 2.95], V3.add(h, [0, -0.22, 0]), 42), demo: st, face: faceAt(t), sky: true, blur: 0.3 };
  }

  function shotBluRun(t) {
    const u = t - 73.384;
    const x = lerp(-1.5, 5.5, u / 1.2);
    const pose = heavyPose({ p: [x, -1.6], yaw: PI / 2 - 0.2, sp: [0.25, 0, 0], stepL: S(t * 9) * 0.35, stepR: -S(t * 9) * 0.35, liftL: Math.max(0, S(t * 9)) * 0.15, liftR: Math.max(0, -S(t * 9)) * 0.15 });
    const H = heavyArmed(pose);
    const medic = { cls: 'medic', team: 'blu', pose: FP.run('medic', x - 1.8, -1.2, PI / 2 - 0.1, t * 1.7, {}), gun: 'medigun' };
    const g = FP.aimGun('medic', 'medigun');
    Object.assign(medic.pose, { hR: g.hR, hL: g.hL });
    medic.gunM = g.gunM;
    return {
      shot: 'bluRun', kind: '3d', set: 'point', env: PIT_ENV, camera: cam([x - 1.4, 1.1, 2.6], [x + 0.8, 1.35, -2.0], 48), sky: true, actors: [medic],
      bluHeavy: Object.assign(H, { face: heavyFace(HX.grin, t) })
    };
  }

  function shotPass(t) {
    const u = (t - 74.591) / 1.0;
    const H = window.DemoSets.HALLS.stair;
    const z = lerp(-1.2, -7.4, u);
    const floor = clamp((-2 - z) / 0.6, 0, 12) * 0.25;
    const pose = run({ p: [H.x - 0.2, H.z + z], yaw: PI, phase: t * 1.8, floor, lean: 0.4 });
    const st = armed(pose, 'launcher', {});
    return {
      shot: 'pass', kind: '3d', set: 'inside', env: INSIDE_ENV, camera: cam([H.x + 0.3, 1.2, H.z - 0.2], [H.x, 3.0, H.z - 12], 56), demo: st, face: faceAt(t), glowWall: [1, 0.98, 0.94, 1], blur: u < 0.2 ? 0.6 : 0
    };
  }

  function shotLeap2(t) {
    const u = t - 75.59;
    const L = window.DemoSets.HALLS.leap;
    const runK = clamp(u / 0.55, 0, 1);
    const jump = clamp((u - 0.55) / 0.5, 0, 1);
    const z = lerp(-7.0, -2.4, runK) + jump * 1.6;
    const y = jump > 0 && jump < 1 ? S(jump * PI) * 0.9 : 0;
    let st;
    if (jump <= 0) st = armed(run({ p: [L.x + 0.2, L.z + z], yaw: 0, phase: t * 1.8 }), 'launcher', {});
    else if (jump < 1) {
      const p = [L.x + 0.2, STAND_Y + y, L.z + z];
      const pose = { p, fwd: [0, 0, 1], up: [0, 1, 0], sp: [0.2, 0, 0], nk: [-0.3, 0, 0], fLw: V3.add(p, [0.15, -0.55, 0.3]), kLw: V3.add(p, [0.2, 0.5, 1]), fRw: V3.add(p, [-0.15, -0.8, -0.2]), kRw: V3.add(p, [-0.2, 0.5, 1]) };
      st = armed(pose, 'launcher', { pitch: -0.3 });
    } else {
      const land = ease((u - 1.05) / 0.3);
      const pose = crouch({ p: [L.x + 0.2, L.z + z], yaw: lerp(0, -0.5, land), depth: lerp(0.35, 0.1, land), sp: [0.2, 0, 0], nk: [-0.2, 0, 0] });
      st = armed(pose, 'launcher', { pitch: lerp(-0.1, 0.25, land) });
    }
    return { shot: 'leap2', kind: '3d', set: 'inside', env: INSIDE_ENV, camera: cam([L.x - 0.4, 0.45, L.z + 1.0], [L.x + 0.2, 1.7, L.z - 2.5], 58), demo: st, face: faceAt(t), glowWall: [1, 0.98, 0.94, 1] };
  }

  function shotGrin(t) {
    const L = window.DemoSets.HALLS.leap;
    const pose = stand({ p: [L.x + 0.2, L.z - 0.8], yaw: -0.4, sp: [-0.05, 0, 0], nk: [-0.2, -0.25, 0.05] });
    const st = armed(pose, 'sticky', { at: [-0.1, 0.02, 0.3], pitch: -0.15 });
    const h = headPos(st);
    return { shot: 'grin', kind: '3d', set: 'inside', env: INSIDE_ENV, camera: cam(V3.add(h, [-0.3, -0.32, 0.85]), V3.add(h, [-0.04, -0.06, 0]), 38), demo: st, face: faceAt(t), blur: 0.4 };
  }

  function corridorShot(t, t0, dur, which) {
    const H = window.DemoSets.HALLS.corridor;
    const u = (t - t0) / dur;
    const base = which === 'corridorA' ? -13 : -9;
    const z = lerp(base, base + 2.2, u);
    const pose = heavyPose({ p: [H.x + 0.2, H.z + z], yaw: 0, sp: [0.22, 0, 0], stepL: S(t * 9) * 0.35, stepR: -S(t * 9) * 0.35, liftL: Math.max(0, S(t * 9)) * 0.15, liftR: Math.max(0, -S(t * 9)) * 0.15 });
    const Hst = heavyArmed(pose);
    const medic = { cls: 'medic', team: 'blu', pose: FP.run('medic', H.x - 0.9, H.z + z - 1.6, 0, t * 1.7, {}), gun: 'medigun' };
    const g = FP.aimGun('medic', 'medigun');
    Object.assign(medic.pose, { hR: g.hR, hL: g.hL });
    medic.gunM = g.gunM;
    const spy = { cls: 'spy', team: 'blu', pose: FP.run('spy', H.x + 0.8, H.z + z - 3.0, 0, t * 1.7 + 0.4, {}), itemR: 'revolver' };
    const hd = M4.point(Hst.m.head, [0, 0, 0]);
    const camera = which === 'corridorA' ? cam([H.x + 0.4, 0.35, H.z + z + 3.0], V3.add(hd, [-0.3, -0.3, 0]), 54) : cam([H.x + 0.25, 0.7, H.z + z + 2.2], V3.add(hd, [-0.25, -0.2, 0]), 50);
    return {
      shot: which, kind: '3d', set: 'inside', env: INSIDE_ENV, camera, actors: [medic, spy],
      bluHeavy: Object.assign(Hst, { face: heavyFace(HX.grin, t) })
    };
  }

  function stickyPOV(t, t0, which) {
    const u = t - t0;
    const eye = which === 'stickyA' ? [2.0, 1.55, 6.0] : [1.2, 1.5, 6.6];
    const aim = which === 'stickyA' ? [-1.6, 2.2, 0] : [1.6, 1.6, 0];
    const fwd = V3.norm(V3.sub(aim, eye));
    const right = V3.norm(V3.cross(fwd, [0, 1, 0]));
    const up = V3.cross(right, fwd);
    const fireAt = which === 'stickyA' ? 0.25 : 0.12;
    const kick = Math.max(0, 1 - Math.abs(u - fireAt) / 0.18);
    const gp = V3.add(V3.add(V3.add(eye, V3.mul(fwd, 0.42 - kick * 0.05)), V3.mul(right, 0.16)), V3.mul(up, -0.2 + kick * 0.03));
    const G = basisAt(gp, V3.mul(right, -1), up, fwd);
    const Hd = stickyHands(G);
    const flash = kick > 0.4 ? [{ p: Props.stickyMuzzle(G).p, dir: fwd, s: 0.5 * kick }] : [];
    const stick = V3.lerp(eye, aim, 0.92);
    return {
      shot: which, kind: '3d', set: 'carea', env: PIT_ENV, camera: cam(V3.add(eye, shake(t, 0.004 + kick * 0.02, 13)), aim, 48), sky: true, pov: { M: G, hand: Hd.R },
      flashes: flash, stickies: u > fireAt + 0.3 ? [{ M: M4.translate(stick[0], stick[1], stick[2]), glow: 1 }] : [], blur: 0
    };
  }

  const STICKY_SPOTS = [[-1.32, 2.15, 0.07], [-1.32, 1.6, 0.07], [-1.32, 1.05, 0.07], [1.3, 2.2, 0.07], [1.3, 1.2, 0.07], [-0.3, 2.78, 0.08], [0.5, 2.82, 0.08], [-1.75, 1.4, 0.06], [1.75, 1.8, 0.06]];

  function stickyList(glow) {
    return STICKY_SPOTS.map(([x, y, z], i) => ({ M: M4.chain(M4.translate(x, y, z), M4.rotY(i * 0.7)), glow }));
  }

  function shotWindow(t) {
    const u = t - 81.584;
    const W = window.DemoSets.HALLS.window;
    const pose = stand({ p: [W.x + 3.0, W.z - 25], yaw: 0.2, floor: 3.6, sp: [0.05, 0.1, 0] });
    const st = armed(pose, 'sticky', { pitch: -0.1 });
    let bluHeavy = null;
    if (u > 1.2) {
      const x = lerp(W.x - 2.4, W.x + 2.6, (u - 1.2) / 0.5);
      bluHeavy = Object.assign(heavyArmed(heavyPose({ p: [x, W.z - 1.2], yaw: PI / 2, sp: [0.2, 0, 0] })), { face: heavyFace(HX.grin, t) });
    }
    return {
      shot: 'window', kind: '3d', set: 'inside', env: INSIDE_ENV, camera: cam([W.x + 0.3, 1.6, W.z - 2.2], V3.lerp([W.x + 0.8, 2.4, W.z - 20], [W.x + 2.2, 3.6, W.z - 24], ease(u / 1.6)), 46), demo: st, face: faceAt(t), sky: true, bluHeavy, windowView: true
    };
  }

  function shotDoorway(t) {
    const u = t - 83.249;
    const legPose = stand({ p: [1.9, 1.6], yaw: PI + 0.3, sp: [0.05, 0, 0] });
    const st = armed(legPose, 'sticky', {});
    const out = bluTeam(lerp(-5.5, -3.8, u / 0.83), t, -0.4).slice(0, 4);
    return {
      shot: 'doorway', kind: '3d', set: 'carea', env: PIT_ENV, camera: cam([0.8, 1.3, 5.6], [0.0, 1.5, -1], 52), demo: st, face: faceAt(t), sky: true, actors: out, stickies: stickyList(0.6),
      bluHeavy: Object.assign(heavyArmed(heavyPose({ p: [0.0, lerp(-4.6, -3.2, u / 0.83)], yaw: 0, sp: [0.18, 0, 0] })), { face: heavyFace(HX.grin, t) })
    };
  }

  function shotWorried(t) {
    const u = t - 84.082;
    const pose = heavyPose({ p: [0.0, -1.2], yaw: 0.05, sp: [0.02, spline([[0, 0.2], [0.6, -0.3], [1.33, 0.1]])(u), 0], nk: [spline([[0, -0.15], [0.7, -0.25], [1.33, -0.05]])(u), spline([[0, 0.3], [0.6, -0.4], [1.33, 0.2]])(u), 0] });
    const H = heavyArmed(pose);
    const hd = M4.point(H.m.head, [0, 0, 0]);
    return {
      shot: 'worried', kind: '3d', set: 'carea', env: PIT_ENV, camera: cam(V3.add(hd, [-0.4, -0.35, 1.35]), V3.add(hd, [0.05, -0.2, 0]), 42), sky: true, stickies: stickyList(0.6), blur: 0.35,
      bluHeavy: Object.assign(H, { face: heavyFace(HX.worried, t, { look: [spline([[0, 0.3], [0.6, -0.35], [1.33, 0.2]])(u), 0.25] }) })
    };
  }

  function shotStickies(t) {
    const u = t - 85.414;
    return {
      shot: 'stickies', kind: '3d', set: 'carea', env: PIT_ENV, camera: cam(V3.lerp([-0.55, 1.6, 1.3], [-0.6, 1.62, 1.2], u / 0.54), [-1.32, 1.6, 0.07], 40), sky: true, stickies: stickyList(1), blur: 0
    };
  }

  function shotBottle(t) {
    const u = t - 85.955;
    const pose = stand({ p: [0.6, 9.0], yaw: PI + 0.15, sp: [-0.05, 0, 0], nk: [-0.1, 0.1, 0.05] });
    const chest = chestOf(pose);
    const B = bottleMatrix(M4.point(chest, [-0.34, 0.12, 0.25]), [0, 0], PI + 0.15);
    const rub = ease((t - 86.3) / 0.25) * (1 - ease((t - 86.85) / 0.25));
    const st0 = demoState(pose, {});
    const eyeSpot = M4.point(st0.m.head, [0.05, 0.0, 0.16]);
    const Lrub = hand(V3.add(eyeSpot, [0.06, -0.1, 0.06]), [-0.3, 0.9, 0.1], [0, -0.2, -1], 'open');
    const Lrest = hand(M4.point(chest, [0.35, -0.25, 0.1]), [0, -1, 0.1], [-1, 0, 0], 'relax');
    const st = demoState(pose, { R: bottleGrip(B, 'R', 0.12), L: blendHand(Lrest, Lrub, rub) });
    return { shot: 'bottle', kind: '3d', set: 'point', env: PIT_ENV, camera: cam([0.45, 0.95, 7.55], V3.add(headPos(st), [0.0, -0.35, 0]), 46), demo: st, face: faceAt(t, rub > 0.3 ? { blink: 1 } : {}), sky: true, bottle: { M: B } };
  }

  function shotRunout(t) {
    const u = t - 87.204;
    const out = bluTeam(-2.4 + u * 4, t, -0.45).slice(0, 4);
    return {
      shot: 'runout', kind: '3d', set: 'carea', env: PIT_ENV, camera: cam([0.6, 1.3, 4.0], [0, 1.4, -3], 54), sky: true, actors: out, stickies: stickyList(1),
      bluHeavy: Object.assign(heavyArmed(heavyPose({ p: [0.3, -1.6 + u * 3], yaw: 0, sp: [0.25, 0, 0] })), { face: heavyFace(HX.worried, t) })
    };
  }

  function shotExplosion(t) {
    const u = t - 87.45;
    return {
      shot: 'explosion', kind: '3d', set: 'carea', env: PIT_ENV, camera: cam(V3.add([0.6, 1.4, 6.0], shake(t, 0.08, 14)), [0, 1.5, -1], 56), sky: true,
      booms: [{ p: [0, 1.5, 0.2], u: clamp(u / 1.0, 0, 1), s: 6 }, { p: [-1.4, 1.2, 0.4], u: clamp((u - 0.12) / 1.0, 0, 1), s: 4 }, { p: [1.5, 1.8, 0.4], u: clamp((u - 0.2) / 1.0, 0, 1), s: 4 }],
      debris: debrisBurst([0, 1.5, 0.3], u, 170, 30), smokes: [{ p: [0, 2, 0.5], u: u * 0.7, s: 4, n: 16 }], fullFlash: u < 0.4 ? 0.9 * (1 - u / 0.4) : (u > 0.55 && u < 0.7 ? 0.5 : 0)
    };
  }

  function gibRain(t) {
    const g = rand(191);
    const out = [];
    for (let i = 0; i < 16; i++) {
      const t0 = 88.5 + g() * 3.5;
      const x0 = -3.5 + g() * 7, z0 = 1.8 + g() * 4;
      const q = t - t0;
      if (q < 0 || q > 3) continue;
      out.push({ p: [x0 + q * (g() - 0.5), 9 - q * q * 2.2, z0], spin: q * (3 + g() * 4), kind: i % 4 });
    }
    return out;
  }

  function shotSky(t) {
    const u = t - 88.494;
    const rise = ease((u - 1.8) / 1.4);
    const pose = stand({ p: [0.1, 0.9], yaw: PI, dy: lerp(-1.4, 0, rise), sp: [lerp(0.4, -0.05, rise), 0, 0], nk: [lerp(-0.2, 0.2, rise), 0, 0] });
    const chest = chestOf(pose);
    const raise = ease((t - 91.4) / 0.4) * (1 - ease((t - 92.6) / 0.5));
    const swig = M4.point(chest, [0.45, 0.85, 0.15]);
    const lowB = M4.point(chest, [0.42, 0.1, 0.3]);
    const B = bottleMatrix(V3.lerp(lowB, swig, raise), [raise * -0.8, raise * 0.6], PI);
    const fist = ease((t - 95.6) / 0.25);
    const R0 = hand(M4.point(chest, [-0.4, -0.15, 0.3]), [0, -0.6, 0.8], [0.6, 0, 0.4], 'fist');
    const Rup = hand(M4.point(chest, [-0.45, 0.75, 0.25]), [0.1, 0.9, 0.2], [0.4, 0, 1], 'fist');
    const st = demoState(pose, { L: bottleGrip(B, 'L', 0.12), R: blendHand(R0, Rup, fist) });
    const h = headPos(st);
    const lunge = ease((t - 95.95) / 0.35);
    const eye = V3.lerp([0.2, 0.85, -0.35], V3.add(h, [0.06, -0.08, -0.42]), lunge);
    const at = V3.lerp(V3.add(h, [0.05, 0.05, 0]), V3.add(h, [0.04, -0.02, 0]), Math.max(lunge, 0));
    return {
      shot: 'sky', kind: '3d', set: 'tower', env: SKY_ENV, camera: cam(eye, at, lerp(52, 36, lunge)), demo: st, face: faceAt(t), sky: true, gibs: gibRain(t), bottle: { M: B },
      embers: [{ p: [0, 6, 2], u, n: 30 }]
    };
  }

  function lineupDemo() {
    const pose = stand({ p: [2.55, 0.35], yaw: -0.3, sp: [0.05, -0.1, 0], nk: [-0.12, 0.25, 0.04], spread: 0.08 });
    return armed(pose, 'launcher', { at: [-0.12, 0.02, 0.32], pitch: 0.1, yaw: 0.25 });
  }

  function shotLineup(t, which) {
    const hs = HeavyScript.stage(t + LINEUP_SHIFT);
    const st = lineupDemo();
    const h = headPos(st);
    let camera = hs.camera;
    if (which === 'endA') camera = cam(V3.add(h, [-0.2, -0.04, 0.5]), V3.add(h, [-0.02, -0.03, 0]), 32);
    else if (which === 'endB') camera = cam(V3.add(h, [-0.35, -0.22, 1.15]), V3.add(h, [-0.05, -0.22, 0]), 40);
    else if (which === 'endC') camera = cam(V3.add(h, [-0.9, -0.55, 2.2]), V3.add(h, [-0.4, -0.4, 0]), 50);
    const actors = (hs.actors || []).filter(a => a.cls !== 'demo');
    return {
      shot: which, kind: 'lineup', env: hs.env, camera, heavy: hs.heavy, heavyFace: hs.face, actors, demo: st, face: faceAt(t, Object.assign({}, X.laugh, { jaw: 0.6 + S(t * 14) * 0.25 })), logo: hs.logo || null,
      blur: which === 'endA' ? 0.4 : which === 'endB' ? 0.25 : 0.1
    };
  }

  function shotAt(t) {
    let i = 0;
    while (i < SHOTS.length - 1 && t >= SHOTS[i + 1][0]) i++;
    return SHOTS[i][1];
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION - 0.001);
    const name = shotAt(tt);
    switch (name) {
      case 'title': return shotTitle(tt);
      case 'tunnelA': case 'tunnelB': case 'tunnelC': case 'tunnelD': return shotTunnel(tt, name);
      case 'leap': return shotLeap(tt);
      case 'benchA': return shotBenchA(tt);
      case 'letsdo': return shotLetsDo(tt);
      case 'door': return shotDoor(tt);
      case 'shaft': return shotShaft(tt);
      case 'flight': return shotFlight(tt);
      case 'cover1': return shotCover1(tt);
      case 'cover2': return shotCover2(tt);
      case 'widefire': return shotWideFire(tt);
      case 'blast': return shotBlast(tt);
      case 'benchB': return shotBenchB(tt);
      case 'yard': return shotYard(tt);
      case 'wallgren': return shotWallGren(tt);
      case 'pyro': return shotPyro(tt);
      case 'boom': return shotBoom(tt);
      case 'danger': return shotDanger(tt);
      case 'drinkA': case 'drinkB': case 'drinkC': return shotDrink(tt, name);
      case 'sentryA': return shotSentryA(tt);
      case 'sentryB': return shotSentryB(tt);
      case 'coverfire': return shotCoverFire(tt);
      case 'roll': return shotRoll(tt);
      case 'sentryC': return shotSentryC(tt);
      case 'flash': return { shot: 'flash', kind: 'flash', u: tt - 48.16 };
      case 'sentryboom': return shotSentryBoom(tt);
      case 'benchF': return shotBenchF(tt);
      case 'stairs': return shotStairs(tt);
      case 'surprised': return shotSurprised(tt);
      case 'bluheavy': return shotBluHeavy(tt);
      case 'determined': return shotDetermined(tt);
      case 'bluRun': return shotBluRun(tt);
      case 'pass': return shotPass(tt);
      case 'leap2': return shotLeap2(tt);
      case 'grin': return shotGrin(tt);
      case 'corridorA': return corridorShot(tt, 78.296, 0.874, 'corridorA');
      case 'stickyA': return stickyPOV(tt, 79.17, 'stickyA');
      case 'corridorB': return corridorShot(tt, 80.128, 0.749, 'corridorB');
      case 'stickyB': return stickyPOV(tt, 80.877, 'stickyB');
      case 'window': return shotWindow(tt);
      case 'doorway': return shotDoorway(tt);
      case 'worried': return shotWorried(tt);
      case 'stickies': return shotStickies(tt);
      case 'bottle': return shotBottle(tt);
      case 'runout': return shotRunout(tt);
      case 'explosion': return shotExplosion(tt);
      case 'sky': return shotSky(tt);
      case 'endA': case 'endB': case 'endC': case 'logoA': case 'logoB': return shotLineup(tt, name);
      case 'orange': return { shot: 'orange', kind: 'card', tex: 'orange', fade: clamp((DURATION - tt) / 1.1, 0, 1) };
      default: return { shot: 'black', kind: 'black' };
    }
  }

  function voiceAt(t) {
    return jawV(t);
  }

  window.DemoScript = { ID, DURATION, CUTS, SHOTS, LINEUP_SHIFT, STICKY_SPOTS, stage, voiceAt, faceAt, spline, X };
})();
