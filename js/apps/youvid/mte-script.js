(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Eng = window.MeetEngineer;
  const Props = window.EngProps;
  const Voice = window.EngVoice;
  const FP = window.FabPose;
  const Heavy = window.MeetScript;

  const ID = 'M33tTh3Eng1';
  const DURATION = 86.93;
  const CUTS = [0, 1.581, 4.245, 5.452, 13.736, 23.851, 32.925, 38.503, 39.626, 41.916, 43.04, 47.785, 49.408, 54.944, 64.726, 69.68, 72.469, 74.758, 77.089, 78.587, 79.212, 79.836, 80.46, 81.085, 83.499];
  const LINEUP_SHIFT = 1.915;

  const jawV = K.envelope(Voice.JAW, Voice.RATE);
  const rndV = K.envelope(Voice.ROUND, Voice.RATE);
  const BEATS = Voice.BEATS;

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
      return cur.map((v, j) => lerp(prev[j], v, k));
    };
  }

  const X = {
    calm: [0.15, 0.15, 0, 0, 0, 0, 0, 0],
    smile: [0.55, 0.55, 0, 0, 0, 0, 0, 0],
    grin: [0.95, 0.9, 0.25, 0, 0, 0, 0, 0.1],
    talk: [0.3, 0.3, 0.05, 0, 0, 0, 0, 0],
    smirk: [0.85, 0.3, 0.1, 0, 0, 0, 0.15, 0.04],
    sly: [0.6, 0.25, 0, 0, 0, 0.15, 0.25, 0],
    press: [0.1, 0.1, 0, 0, 0.25, 0.85, 0, 0],
    stern: [0, 0, 0, 0, 0.3, 0.35, 0.1, 0],
    drink: [0.1, 0.1, 0, 0.7, 0, 0, 0, 0.12],
    shout: [0.2, 0.2, 0.45, 0, 0, 0, 0.3, 0.2],
    menace: [0.35, 0.15, 0, 0, 0.1, 0.2, 0.35, 0]
  };

  const FACE = steps([
    [0, X.grin], [8.1, X.talk], [12.4, X.smile], [13.0, X.grin], [14.0, X.talk], [15.9, X.grin, 0.2], [16.4, X.talk], [19.9, X.smile], [20.6, X.grin], [21.1, X.talk],
    [22.0, X.smile], [22.6, X.grin], [23.2, X.talk], [24.2, X.smile], [25.6, X.calm], [25.9, X.drink, 0.25], [28.2, X.smile, 0.25], [29.2, X.grin], [30.6, X.talk],
    [31.6, X.press], [32.9, X.talk], [33.8, X.press, 0.15], [34.4, X.talk], [35.2, X.smirk], [36.2, X.talk], [38.6, X.grin], [40.5, X.talk], [41.4, X.grin],
    [43.0, X.calm], [44.6, X.talk], [45.7, X.smile], [46.3, X.grin], [46.6, X.talk], [48.4, X.calm], [49.8, X.shout, 0.15], [51.2, X.smirk, 0.25], [53.8, X.sly],
    [55.4, X.smile], [56.7, X.talk], [61.2, X.smile], [61.8, X.talk], [64.1, X.grin], [64.9, X.grin], [65.4, X.talk], [66.4, X.menace], [67.3, X.talk], [68.9, X.menace],
    [70, X.smirk]
  ], 0.25);

  const NOD = spline([[0, 0], [8.2, 0], [8.6, 0.06], [9.0, -0.02], [10.1, 0.05], [10.6, -0.03], [11.4, 0.04], [12.1, -0.04], [14.3, 0.05], [15.1, -0.03], [15.8, 0.05],
    [16.8, -0.02], [17.7, 0.05], [18.6, -0.03], [19.4, 0.05], [22.3, -0.04], [22.9, 0.04], [33.2, 0.05], [34.4, -0.04], [35.5, 0.05], [36.8, -0.03], [37.9, 0.05],
    [40.7, 0.06], [41.2, -0.02], [44.9, 0.06], [45.4, -0.04], [47.2, 0.05], [50.2, 0.09], [50.8, -0.05], [57.5, 0.04], [58.6, -0.03], [59.7, 0.05], [60.6, -0.02],
    [63.2, 0.05], [63.8, -0.03], [65.4, 0.04], [66.0, -0.02], [67.7, 0.05], [68.4, -0.03], [70, 0]]);

  function faceAt(t, extra) {
    const e = FACE(t);
    const talk = clamp(jawV(t) * 0.95, 0, 1);
    const f = {
      smileL: e[0], smileR: e[1], wide: e[2], round: clamp(e[3] + rndV(t) * 0.8, 0, 1), frown: e[4], press: e[5] * (1 - talk * 0.8), sneer: e[6],
      jaw: clamp(e[7] + talk * (0.75 - e[7] * 0.4), 0, 1.15)
    };
    return Object.assign(f, extra || {});
  }

  function beatPhase(t) {
    let lo = 0, hi = BEATS.length - 1;
    if (t < BEATS[0]) return { i: -1, u: 0, len: 0.37 };
    if (t >= BEATS[hi]) return { i: hi, u: frac((t - BEATS[hi]) / 0.37), len: 0.37 };
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (BEATS[mid] <= t) lo = mid; else hi = mid;
    }
    const len = BEATS[lo + 1] - BEATS[lo];
    return { i: lo, u: (t - BEATS[lo]) / len, len };
  }

  function strumOffset(t) {
    const b = beatPhase(t);
    const k = ease(Math.min(1, b.u / 0.32));
    const down = b.i % 2 === 0;
    return down ? 1 - 2 * k : -1 + 2 * k;
  }

  const CHORDS = [0.5, 0.5, 0.45, 0.45, 0.53, 0.53, 0.47, 0.47];

  function chordAt(t) {
    const b = beatPhase(t);
    const i = Math.max(0, b.i);
    const a = CHORDS[Math.floor(i / 2) % CHORDS.length], c = CHORDS[Math.floor((i + 1) / 2) % CHORDS.length];
    return lerp(a, c, b.i % 2 === 1 ? ease((b.u - 0.75) / 0.25) : 0);
  }

  const SEAT = { p: [0.0, 0.53, -0.02], toolbox: [0, 0, 0] };
  const PLACES = {
    toolbox: M4.translate(0, 0, 0),
    crate: M4.chain(M4.translate(-0.8, 0, -0.03), M4.rotY(0.05)),
    counter: M4.chain(M4.translate(-0.86, 0.52, 0.04), M4.rotY(0.18)),
    bottle: M4.translate(-0.55, 0.52, 0.12),
    bottles: [M4.chain(M4.translate(0.52, 0, 0.12), M4.rotY(0.4)), M4.chain(M4.translate(0.64, 0, -0.06), M4.rotY(1.2)), M4.chain(M4.translate(0.95, 0.034, 0.3), M4.rotY(-0.5), M4.rotZ(-PI / 2))],
    shotgun: M4.chain(M4.translate(-0.42, 0.0, -0.52), M4.rotY(0.3), M4.rotX(-0.22)),
    truck: M4.chain(M4.translate(-0.95, 0, -1.58), M4.scale(1.2, 1.2, 1.2)),
    s1: [-1.5, 0, 0.55],
    s2: [1.75, 0, 0.75],
    s3hood: [-0.02, 1.7, -1.58],
    s3cliff: [3.7, window.EngSets.cliffH(3.7, -2.4), -2.4]
  };

  const KILLS = [28.9, 39.3, 42.7, 48.9, 55.15, 62.4, 64.3, 70.4, 71.6, 73.1, 74.0, 76.6];

  function counterValue(t) {
    let v = 209;
    KILLS.forEach(k => { v += ease((t - k) / 0.3); });
    return v;
  }

  function seatedPose(o) {
    const yaw = o.yaw || 0;
    const fwd = [S(yaw), 0, C(yaw)], side = [C(yaw), 0, -S(yaw)];
    const p = o.p || SEAT.p;
    const pose = { p, fwd, up: o.up || [0, 1, 0], sp: o.sp || [0.32, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.7, -0.75, 0.0], eR: o.eR || [-1, 0.25, -0.65] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const hip = V3.add(p, V3.mul(side, k * 0.15));
      const spread = o.spread === undefined ? 0.08 : o.spread;
      const reach = o['reach' + s] || 0.32;
      pose['f' + s + 'w'] = o['f' + s] || [hip[0] + fwd[0] * reach + side[0] * k * spread, 0.075, hip[2] + fwd[2] * reach + side[2] * k * spread];
      pose['k' + s + 'w'] = o['k' + s] || V3.add(hip, [fwd[0] * 1.4 + side[0] * k * 0.42, 0.75, fwd[2] * 1.4 + side[2] * k * 0.42]);
    });
    return pose;
  }

  function standPose(o) {
    const yaw = o.yaw || 0;
    const fwd = [S(yaw), 0, C(yaw)], side = [C(yaw), 0, -S(yaw)];
    const p = o.p;
    const base = p[1] - 0.775;
    const pose = { p, fwd, up: [0, 1, 0], sp: o.sp || [0.04, 0, 0], nk: o.nk || [0, 0, 0], eL: [0.8, -0.6, -0.2], eR: [-0.8, -0.6, -0.2] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const lift = o['lift' + s] || 0;
      const f = V3.add(p, V3.add(V3.mul(side, k * 0.17), V3.mul(fwd, 0.04 + lift * 0.5)));
      pose['f' + s + 'w'] = [f[0], base + 0.075 + lift, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.5 + side[0] * k * 0.2, base + 0.6 + lift, fwd[2] * 1.5 + side[2] * k * 0.2]);
    });
    return pose;
  }

  function guitarM(pelvis, o) {
    const g = o || {};
    const X0 = V3.norm(g.neck || [0.95, 0.22, 0.2]);
    const Z0 = g.face || [0.04, 0.3, 1];
    const Y = V3.norm(V3.cross(Z0, X0));
    const Z = V3.cross(X0, Y);
    const at = g.at || [-0.07, 0.06, 0.34];
    const L = new Float32Array([X0[0], X0[1], X0[2], 0, Y[0], Y[1], Y[2], 0, Z[0], Z[1], Z[2], 0, at[0], at[1], at[2], 1]);
    return M4.chain(pelvis, L, M4.scale(0.9, 0.9, 0.9));
  }

  function axis(M, c) {
    return V3.norm([M[c * 4], M[c * 4 + 1], M[c * 4 + 2]]);
  }

  function gripOn(point, fingers, palm, pose, reach, lift) {
    const f = V3.norm(fingers), pn = V3.norm(palm);
    const wrist = V3.sub(V3.sub(point, V3.mul(f, reach)), V3.mul(pn, lift || 0));
    return { target: wrist, fingers: f, palm: pn, pose };
  }

  function strumHand(G, t, amp) {
    const X = axis(G, 0), Y = axis(G, 1), Z = axis(G, 2);
    const s = strumOffset(t) * (amp === undefined ? 0.04 : amp);
    const pick = M4.point(G, [-0.04, s - 0.05, 0.05]);
    const fingers = V3.norm(V3.add(V3.mul(Y, -0.85), V3.add(V3.mul(Z, -0.3), V3.mul(X, 0.25))));
    const palm = V3.norm(V3.add(V3.mul(Z, -0.85), V3.mul(Y, -0.15)));
    return gripOn(pick, fingers, palm, 'strum', 0.15, 0.04);
  }

  function fretHand(G, t, xo) {
    const X = axis(G, 0), Y = axis(G, 1), Z = axis(G, 2);
    const x = xo === undefined ? chordAt(t) : xo;
    const tip = M4.point(G, [x, 0.012, 0.03]);
    const fingers = V3.norm(V3.add(V3.mul(Y, 0.9), V3.add(V3.mul(X, -0.25), V3.mul(Z, 0.15))));
    const palm = V3.norm(V3.add(V3.mul(Z, -0.85), V3.mul(Y, -0.3)));
    return gripOn(tip, fingers, palm, 'fret', 0.13, 0.03);
  }

  function freeHand(pos, fingers, palm, pose) {
    return { target: pos, fingers: V3.norm(fingers), palm: V3.norm(palm), pose };
  }

  function blendHand(a, b, k) {
    if (k <= 0) return a;
    if (k >= 1) return b;
    return { target: V3.lerp(a.target, b.target, k), fingers: V3.norm(V3.lerp(a.fingers, b.fingers, k)), palm: V3.norm(V3.lerp(a.palm, b.palm, k)), pose: k < 0.5 ? a.pose : b.pose };
  }

  function engState(pose, hands, extra) {
    const p = Object.assign({}, pose);
    if (hands.L) p.hLw = hands.L.target;
    if (hands.R) p.hRw = hands.R.target;
    const m = Eng.solve(p);
    const hm = {};
    ['L', 'R'].forEach(s => {
      const h = hands[s];
      if (!h) return;
      hm[s] = { pose: h.pose, M: Eng.handBasis(m.pts['wrist' + s], h.fingers, h.palm) };
    });
    return Object.assign({ pose: p, m, hands: hm }, extra || {});
  }

  function headPos(st, off) {
    return M4.point(st.m.head, off || [0, 0, 0]);
  }

  function chestOf(pose) {
    return Eng.solve(pose).chest;
  }

  function pelvisOf(pose) {
    return Eng.solve(pose).pelvis;
  }

  function playState(t, o) {
    const pose = seatedPose(o);
    const G = guitarM(pelvisOf(pose), o.guitar);
    const R = o.handR || strumHand(G, t, o.amp);
    const L = o.handL || fretHand(G, t, o.fret);
    return engState(pose, { L, R }, { guitar: G });
  }

  const SKY_ENV = {
    key: { dir: [0.55, -0.5, -0.65], col: [1.18, 0.98, 0.86] },
    ambTop: [0.36, 0.36, 0.5], ambBot: [0.2, 0.13, 0.12], warp: [0.6, 0.3, 0.26], rim: [0.75, 0.62, 0.82], rimPow: 2.6,
    points: [{ pos: [-2.5, 2.2, -3.2], col: [0.5, 0.36, 0.44], k: 0.06 }],
    fogCol: [0.42, 0.38, 0.52], fog: [18, 240], clear: [0.3, 0.3, 0.45], grade: [1.02, 0.98, 1.02, 0.06], vig: 0.3
  };

  const CLOSE_ENV = Object.assign({}, SKY_ENV, {
    key: { dir: [0.75, -0.35, -0.55], col: [1.25, 1.02, 0.86] },
    ambTop: [0.32, 0.33, 0.48], ambBot: [0.28, 0.19, 0.17], fog: [6, 60], fogCol: [0.3, 0.32, 0.42]
  });

  const ECU_ENV = Object.assign({}, CLOSE_ENV, {
    key: { dir: [0.85, -0.3, -0.4], col: [1.05, 0.82, 0.66] },
    ambTop: [0.28, 0.28, 0.4], ambBot: [0.26, 0.17, 0.15], rim: [0.6, 0.55, 0.75], grade: [1.04, 0.96, 0.98, 0.08], vig: 0.4
  });

  const LOW_ENV = Object.assign({}, SKY_ENV, {
    key: { dir: [0.6, -0.4, -0.7], col: [1.1, 0.92, 0.8] },
    ambTop: [0.3, 0.33, 0.55], rim: [0.55, 0.6, 0.9], fog: [20, 260], fogCol: [0.24, 0.28, 0.48], grade: [0.98, 0.98, 1.06, 0.08]
  });

  const DUSK_ENV = Object.assign({}, SKY_ENV, {
    key: { dir: [0.5, -0.35, -0.8], col: [1.15, 0.9, 0.8] },
    ambTop: [0.42, 0.36, 0.5], ambBot: [0.25, 0.14, 0.12], fog: [25, 240], fogCol: [0.55, 0.42, 0.52], grade: [1.04, 0.96, 1.0, 0.08], vig: 0.35
  });

  const SIL_ENV = Object.assign({}, DUSK_ENV, {
    key: { dir: [0.2, -0.3, 0.9], col: [0.7, 0.55, 0.5] },
    ambTop: [0.22, 0.2, 0.3], ambBot: [0.1, 0.06, 0.06], fog: [12, 200], fogCol: [0.5, 0.4, 0.5], vig: 0.45
  });

  function cam(eye, at, fov, roll) {
    return { eye, at, fov, roll: roll || 0, near: 0.03, far: 320 };
  }

  function shake(t, amp, seed) {
    return K.wobble(t * 1.7, amp, seed || 1);
  }

  const DRESS_CAMP = ['sky', 'ground', 'cliff', 'poles', 'trees', 'rocks'];

  function camp(t, extra) {
    const s1 = extra && extra.s1 || {};
    const s2 = extra && extra.s2 || {};
    return {
      counter: counterValue(t),
      sentries: [
        { level: 1, at: PLACES.s1, yaw: s1.yaw === undefined ? -1.05 + S(t * 0.6) * 0.25 : s1.yaw, pitch: s1.pitch || 0.02, kick: s1.kick || 0 },
        { level: 2, at: PLACES.s2, yaw: s2.yaw === undefined ? 0.75 + S(t * 0.5 + 1) * 0.3 : s2.yaw, pitch: s2.pitch || 0.05, spin: s2.spin || 0 },
        { level: 3, at: PLACES.s3hood, yaw: 0.2 + S(t * 0.4) * 0.3, pitch: 0.12, spin: 0 },
        { level: 3, at: PLACES.s3cliff, yaw: 0.6 + S(t * 0.35 + 2) * 0.25, pitch: 0.25, spin: (extra && extra.s3spin) || 0 }
      ]
    };
  }

  function shotTitle(t) {
    return { shot: 'title', kind: 'title', zoom: 1 + (t - 1.581) * 0.004 };
  }

  function shotPlay(t) {
    const u = t - 5.452;
    const nk = spline([[0, [0.32, 0.08, 0.05]], [1.4, [0.3, -0.05, 0.05]], [2.8, [0.18, -0.15, 0.0]], [3.6, [0.0, -0.22, -0.02]], [5.0, [-0.05, -0.25, 0.0]],
      [6.4, [0.05, -0.2, 0.04]], [7.2, [0.12, -0.3, 0.03]], [8.28, [0.08, -0.3, 0.0]]])(u);
    const sp = spline([[0, [0.38, 0.04, 0]], [3, [0.32, 0.02, 0]], [8.28, [0.3, 0.05, 0]]])(u);
    const st = playState(t, { sp, nk: V3.add(nk, [NOD(t), 0, 0]) });
    const eye = spline([[0, [0.12, 0.79, 1.56]], [8.28, [0.32, 0.8, 1.5]]])(u);
    const at = spline([[0, [-0.01, 0.884, 0.294]], [8.28, [-0.12, 0.88, 0.3]]])(u);
    return { shot: 'play', kind: '3d', env: CLOSE_ENV, camera: cam(eye, at, 40), eng: st, face: faceAt(t), dress: DRESS_CAMP, camp: camp(t), blur: 0.35, sparks: t > 12.4 && t < 13.7 ? [{ p: [-3.4, 4.2, -9], u: t - 12.4 }] : null };
  }

  function talkCam(st, off, aim, fov) {
    const h = headPos(st);
    return cam(V3.add(h, off), V3.add(h, aim), fov);
  }

  function shotTalkA(t) {
    const u = t - 13.736;
    const nk = spline([[0, [0.0, -0.42, 0.06]], [1.5, [-0.08, -0.36, 0.05]], [3.0, [-0.05, -0.3, 0.08]], [4.6, [-0.1, -0.38, 0.02]], [6.2, [-0.06, -0.26, 0.06]],
      [7.4, [-0.12, -0.34, 0.08]], [8.6, [-0.1, -0.28, 0.03]], [10.115, [-0.08, -0.22, 0.05]]])(u);
    const gesture = ease((t - 22.55) / 0.35);
    const st0 = playState(t, { nk: V3.add(nk, [NOD(t), 0, 0]), sp: [0.28, 0.06, 0.02] });
    let st = st0;
    if (gesture > 0) {
      const G = st0.guitar;
      const h = headPos(st0);
      const wave = freeHand(V3.add(h, [-0.32, -0.18, 0.28 + S((t - 22.6) * 3) * 0.02]), [-0.25, 1, 0.35], [-0.15, 0.1, 1], 'wave');
      st = engState(seatedPose({ nk: V3.add(nk, [NOD(t), 0, 0]), sp: [0.28, 0.06, 0.02] }), { L: fretHand(G, t), R: blendHand(strumHand(G, t), wave, gesture) }, { guitar: G });
    }
    return { shot: 'talkA', kind: '3d', env: CLOSE_ENV, camera: talkCam(st0, [-0.3, -0.23, 0.7], [-0.02, -0.04, -0.07], 36), eng: st, face: faceAt(t), dress: DRESS_CAMP, camp: camp(t), blur: 0.55 };
  }

  function drinkHands(t, st0) {
    const G = st0.guitar;
    const h = headPos(st0);
    const reach = ease((t - 25.2) / 0.55) * (1 - ease((t - 28.75) / 0.5));
    const lift = ease((t - 25.75) / 0.45) * (1 - ease((t - 28.2) / 0.45));
    const rest = M4.point(PLACES.bottle, [0, 0.11, 0]);
    const mouth = M4.point(st0.m.head, [0.0, -0.052, 0.14]);
    let bottleM = PLACES.bottle;
    if (reach > 0) {
      const lowHold = V3.add(rest, [0.08 * reach, 0.18 * reach, 0.05 * reach]);
      const axisUp = V3.norm(V3.lerp([0, 1, 0], V3.sub(V3.add(mouth, [0, 0, 0]), V3.add(mouth, [-0.17, 0.11, -0.08])), lift));
      const tilt = lift > 0 ? V3.norm(V3.lerp([0, 1, 0], V3.norm(V3.sub(mouth, V3.add(mouth, [-0.2, 0.14, 0.1]))), lift)) : [0, 1, 0];
      const neckTip = V3.lerp(V3.add(lowHold, [0, 0.14, 0]), mouth, lift);
      const ax = lift > 0 ? tilt : axisUp;
      const bottom = V3.sub(neckTip, V3.mul(ax, 0.255));
      const yv = ax;
      let xv = V3.cross(yv, [0, 0, 1]);
      xv = V3.len(xv) < 1e-3 ? [1, 0, 0] : V3.norm(xv);
      const zv = V3.cross(xv, yv);
      const B = new Float32Array([xv[0], xv[1], xv[2], 0, yv[0], yv[1], yv[2], 0, zv[0], zv[1], zv[2], 0, bottom[0], bottom[1], bottom[2], 1]);
      bottleM = reach < 1 && lift === 0 ? (reach > 0.4 ? B : PLACES.bottle) : B;
    }
    const grip = M4.point(bottleM, [0, 0.1, 0]);
    const out = V3.norm(V3.add([-0.6, 0.0, 0.5], [0, 0, 0]));
    const gx = V3.norm(V3.cross(axis(bottleM, 1), out));
    const holdHand = freeHand(V3.add(grip, V3.add(V3.mul(out, 0.07), V3.mul(gx, -0.09))), gx, V3.mul(out, -1), 'bottle');
    const strum = strumHand(G, t, 0.03);
    return { R: blendHand(strum, holdHand, reach), bottle: reach > 0.4 ? bottleM : PLACES.bottle, lift };
  }

  function shotWide1(t) {
    const u = t - 23.851;
    const lift0 = ease((t - 25.75) / 0.45) * (1 - ease((t - 28.2) / 0.45));
    const nk = spline([[0, [0.05, -0.1, 0]], [1.4, [0.12, -0.25, 0.04]], [2.0, [0.0, -0.1, 0.0]], [4.6, [-0.05, -0.05, 0.0]], [6.4, [0.18, -0.2, 0.0]], [9.07, [0.0, -0.05, 0.0]]])(u);
    const sp = [0.3 - lift0 * 0.12, 0.03, 0];
    const base = { nk: V3.add(V3.add(nk, [-lift0 * 0.55, 0.1 * lift0, 0]), [NOD(t), 0, 0]), sp };
    const st0 = playState(t, base);
    const dr = drinkHands(t, st0);
    const st = engState(seatedPose(base), { L: fretHand(st0.guitar, t), R: dr.R }, { guitar: st0.guitar, bottle: dr.bottle });
    const eye = spline([[0, [0.32, 0.57, 2.02]], [9.07, [0.36, 0.57, 1.97]]])(u);
    return { shot: 'wide1', kind: '3d', env: SKY_ENV, camera: cam(eye, [-0.127, 0.795, 0.192], 34), eng: st, face: faceAt(t), dress: DRESS_CAMP, camp: camp(t), blur: 0.2 };
  }

  function shotLow(t) {
    const u = t - 32.925;
    const nk = spline([[0, [-0.12, 0.25, 0.08]], [1.6, [-0.18, 0.18, 0.06]], [3.0, [-0.1, 0.3, 0.1]], [4.4, [-0.2, 0.22, 0.04]], [5.578, [-0.15, 0.28, 0.08]]])(u);
    const st = playState(t, { nk: V3.add(nk, [NOD(t), 0, 0]), sp: [0.22, -0.04, 0] });
    const h = headPos(st);
    const eye = V3.add(h, V3.add([-0.62, -0.42, 0.9], [u * 0.004, 0, 0]));
    return { shot: 'low', kind: '3d', env: LOW_ENV, camera: cam(eye, V3.add(h, [0.22, 0.0, 0]), 44, -0.04), eng: st, face: faceAt(t), dress: ['sky', 'ground', 'cliff', 'trees'], camp: camp(t), blur: 0.25 };
  }

  function sentryFire(t, start, rate, count) {
    const k = (t - start) * rate;
    if (k < 0 || k >= count) return 0;
    return 1 - frac(k);
  }

  function shotSentry1(t) {
    const u = t - 38.503;
    const st = playState(t, { nk: [0.12 + NOD(t), -0.1, 0.02], sp: [0.32, 0.02, 0] });
    const fire = Math.max(sentryFire(t, 38.74, 7.5, 5), 0);
    const yaw = spline([[0, 0.28], [0.24, 0.34], [1.12, 0.38]])(u);
    const c = camp(t, { s1: { yaw, pitch: 0.06, kick: fire * 0.025 } });
    const eye = spline([[0, [-2.35, 1.32, 1.62]], [1.123, [-2.3, 1.3, 1.62]]])(u);
    return {
      shot: 'sentry1', kind: '3d', env: CLOSE_ENV, camera: cam(V3.add(eye, shake(t, 0.004 + fire * 0.012, 4)), [-0.15, 0.92, -0.25], 46), eng: st, face: faceAt(t), dress: DRESS_CAMP, camp: c, blur: 0.3,
      flashes: fire > 0.15 ? [{ level: 1, at: 's1', s: 0.5 + fire * 0.5, full: fire > 0.5 ? (fire - 0.5) * 1.6 : 0 }] : null
    };
  }

  function shotTalkB(t) {
    const u = t - 39.626;
    const nk = spline([[0, [0.1, -0.45, 0.1]], [1.0, [-0.04, -0.4, 0.12]], [2.29, [0.02, -0.42, 0.08]]])(u);
    const st = playState(t, { nk: V3.add(nk, [NOD(t), 0, 0]), sp: [0.3, 0.05, 0.02] });
    return { shot: 'talkB', kind: '3d', env: CLOSE_ENV, camera: talkCam(st, [-0.31, -0.23, 0.72], [-0.01, -0.04, -0.07], 36), eng: st, face: faceAt(t), dress: DRESS_CAMP, camp: camp(t), blur: 0.55 };
  }

  function shotSentry2(t) {
    const u = t - 41.916;
    const st = playState(t, { nk: [0.22 + NOD(t), -0.3, 0.0], sp: [0.34, 0.0, 0] });
    const fire = sentryFire(t, 41.95, 9, 10);
    const c = camp(t, { s2: { yaw: -0.85 + u * 0.08, pitch: 0.5, spin: t * 28 } });
    const eye = V3.add([2.65, 0.38, 3.05], shake(t, 0.012, 7));
    return {
      shot: 'sentry2', kind: '3d', env: DUSK_ENV, camera: cam(eye, [0.85, 1.2, 0.0], 50, -0.2), eng: st, face: faceAt(t), dress: ['sky', 'ground', 'railR', 'poles', 'rocks'], camp: c, blur: 0.15,
      flashes: [{ level: 2, at: 's2', s: 0.9 + fire * 0.6, full: 0, both: true, glow: 0.6 + fire * 0.4 }]
    };
  }

  function shotTalkC(t) {
    const u = t - 43.04;
    const nk = spline([[0, [0.3, -0.35, 0.04]], [1.2, [0.24, -0.3, 0.02]], [2.2, [0.05, -0.36, 0.06]], [3.4, [-0.02, -0.42, 0.08]], [4.745, [0.04, -0.36, 0.06]]])(u);
    const st = playState(t, { nk: V3.add(nk, [NOD(t), 0, 0]), sp: [0.3, 0.05, 0.02] });
    return { shot: 'talkC', kind: '3d', env: CLOSE_ENV, camera: talkCam(st, [-0.3, -0.24, 0.7], [-0.01, -0.05, -0.07], 36), eng: st, face: faceAt(t), dress: DRESS_CAMP, camp: camp(t), blur: 0.55 };
  }

  function shotWide2(t) {
    const st = playState(t, { nk: [0.15 + NOD(t), -0.05, 0], sp: [0.32, 0, 0] });
    const rockets = [];
    [[48.45, 0], [48.6, 1], [48.75, 2], [48.9, 3]].forEach(([t0, i]) => {
      const k = (t - t0) / 0.75;
      if (k > 0 && k < 1.6) rockets.push({ from: [4.9, 4.7, -2.3], to: [-14 - i * 2, 13 + i * 1.5, -16], k, i });
    });
    return {
      shot: 'wide2', kind: '3d', env: SKY_ENV, camera: cam([-0.456, 0.3, 6.7], [-0.091, 1.493, 0.365], 36), eng: st, face: faceAt(t), dress: DRESS_CAMP, camp: camp(t, { s3spin: t * 20 }), blur: 0,
      rockets
    };
  }

  function shotTalkD(t) {
    const u = t - 49.408;
    const nk = spline([[0, [-0.02, -0.38, 0.06]], [0.7, [-0.1, -0.4, 0.08]], [1.5, [0.06, -0.3, 0.04]], [3.0, [-0.04, 0.1, -0.04]], [4.4, [-0.06, 0.16, -0.06]], [5.536, [-0.08, 0.12, -0.05]]])(u);
    const st = playState(t, { nk: V3.add(nk, [NOD(t), 0, 0]), sp: [0.28, 0.08, 0.02] });
    const push = ease(u / 5.5);
    return { shot: 'talkD', kind: '3d', env: CLOSE_ENV, camera: talkCam(st, V3.lerp([0.24, -0.32, 0.74], [0.21, -0.3, 0.68], push), [-0.1, -0.04, -0.16], 36), eng: st, face: faceAt(t), dress: DRESS_CAMP, camp: camp(t), blur: 0.55 };
  }

  function shotWide3(t) {
    const u = t - 54.944;
    const legUp = ease((t - 60.4) / 0.8) * (1 - ease((t - 63.6) / 0.6));
    const lean = spline([[0, 0.3], [5.5, 0.28], [6.2, 0.1], [7.2, -0.05], [8.8, 0.0], [9.78, 0.18]])(u);
    const nk = spline([[0, [0.1, -0.1, 0]], [2.0, [-0.05, -0.18, 0.04]], [4.0, [0.0, -0.1, 0.0]], [6.0, [-0.1, -0.25, 0.04]], [7.6, [-0.15, -0.3, 0.0]], [9.78, [0.0, -0.12, 0.0]]])(u);
    const fR = legUp > 0 ? V3.lerp([-0.23, 0.075, 0.34], [-0.52, 0.58, 0.16], legUp) : null;
    const kR = legUp > 0 ? V3.lerp([-0.5, 1.2, 1.4], [-0.1, 2.2, 0.9], legUp) : null;
    const base = { nk: V3.add(nk, [NOD(t), 0, 0]), sp: [lean, 0.06 * legUp, 0], fR, kR, guitar: { neck: V3.lerp([0.95, 0.22, 0.2], [0.88, 0.45, 0.2], legUp), at: V3.lerp([-0.07, 0.06, 0.34], [-0.04, 0.2, 0.32], legUp) } };
    const st = playState(t, base);
    const fire = Math.max(sentryFire(t, 62.2, 9, 4), sentryFire(t, 64.2, 9, 3));
    const turn = spline([[0, -1.25], [3.5, -1.2], [5.0, -0.9], [6.8, -0.5], [7.25, -0.62], [9.0, -0.8], [9.78, -0.9]])(u);
    const c = camp(t, { s1: { yaw: turn, pitch: 0.04, kick: fire * 0.03 } });
    const gibs = [];
    if (t > 55.0 && t < 56.3) gibs.push({ p: [-1.3 + (t - 55) * 1.2, 0.25 + S((t - 55) * 2.6) * 0.3, 1.4 - (t - 55) * 0.5], spin: (t - 55) * 9 });
    return {
      shot: 'wide3', kind: '3d', env: SKY_ENV, camera: cam([0.2, 0.77, 3.13], [-0.433, 0.618, 0.283], 36), eng: st, face: faceAt(t), dress: DRESS_CAMP, camp: c, blur: 0.12, gibs,
      flashes: fire > 0.15 ? [{ level: 1, at: 's1', s: 0.6 + fire * 0.5, full: 0, smoke: true }] : null
    };
  }

  function shotEcu(t) {
    const u = t - 64.726;
    const nk = spline([[0, [0.02, 0.2, -0.06]], [1.2, [0.06, 0.16, -0.08]], [2.6, [0.12, 0.2, -0.06]], [3.6, [0.18, 0.15, -0.1]], [4.954, [0.2, 0.12, -0.1]]])(u);
    const st = playState(t, { nk: V3.add(nk, [NOD(t), 0, 0]), sp: [0.26, 0.04, 0] });
    const drift = ease(u / 5);
    return { shot: 'ecu', kind: '3d', env: ECU_ENV, camera: talkCam(st, V3.lerp([0.18, -0.2, 0.64], [0.16, -0.21, 0.62], drift), [-0.02, -0.07, 0.07], 34), eng: st, face: faceAt(t), dress: DRESS_CAMP, camp: camp(t), blur: 0.65 };
  }

  const BLU = {
    draped: { cls: 'scout', pose: () => FP.airborne('scout', [-4.5, 2.05, -0.3], [0.1, -0.55, 0.85], [0.1, -0.8, -0.5], { hL: [0.3, 0.35, 0.25], hR: [-0.3, 0.4, 0.2], fL: [0.12, -0.3, -0.5], fR: [-0.12, -0.35, -0.45] }) },
    burn: { cls: 'pyro', pose: () => FP.supine('pyro', 2.9, 3.5, 0.4) },
    burn2: { cls: 'pyro', pose: () => FP.prone('pyro', 4.6, 2.8, 2.0) },
    deadA: { cls: 'soldier', pose: () => FP.supine('soldier', -1.6, 3.8, 0.9) },
    heavyDead: { cls: 'heavy', pose: () => FP.supine('heavy', -1.9, 6.9, 2.0) },
    scoutDead: { cls: 'scout', pose: () => FP.prone('scout', 3.7, 6.35, -1.4) }
  };

  function bluStatic(list) {
    return list.map(k => {
      const b = BLU[k];
      return { cls: b.cls, team: 'blu', pose: b.pose() };
    });
  }

  function shotBattle1(t) {
    const u = t - 69.68;
    const st = playState(t, { nk: [0.1 + NOD(t), -0.05, 0], sp: [0.32, 0, 0] });
    const fire = sentryFire(t, 71.2, 10, 8);
    const c = camp(t, { s2: { yaw: 0.35 + u * 0.05, pitch: 0.08, spin: t * 30 } });
    const actors = bluStatic(['draped', 'burn', 'burn2', 'deadA', 'scoutDead']);
    const k = ease(u / 2.79);
    const eye = V3.lerp([-0.48, 0.92, 5.4], [-0.28, 1.74, 7.9], k);
    const at = V3.lerp([-0.37, 1.24, -1.25], [-0.27, 0.97, -1.18], k);
    return {
      shot: 'battle1', kind: '3d', env: DUSK_ENV, camera: cam(eye, at, 50), eng: st, face: faceAt(t), dress: DRESS_CAMP, camp: c, blur: 0, actors,
      fires: [{ p: [2.9, 0.15, 3.5], u, s: 0.9, n: 22 }, { p: [4.6, 0.15, 2.8], u: u + 1, s: 0.8, n: 18 }], sparkRain: [{ p: [3.4, 2.6, -1.2], u }],
      flashes: t > 71.2 ? [{ level: 2, at: 's2', s: 0.8 + fire * 0.6, both: true, glow: 0.4 + fire * 0.5, tracers: true }] : null,
      rockets: t > 70.2 ? [{ from: [5.0, 4.7, -2.3], to: [-16, 15, -20], k: (t - 70.2) / 1.1, i: 1 }] : []
    };
  }

  function runner(cls, from, to, t0, t1, t, die) {
    const k = clamp((t - t0) / (t1 - t0), 0, 1);
    const p = V3.lerp(from, to, k);
    const d = V3.sub(to, from);
    const yaw = Math.atan2(d[0], d[2]);
    if (die && t > die) {
      const q = t - die;
      if (q < 0.9) return { cls, team: 'blu', pose: FP.airborne(cls, [p[0] - d[0] * 0.05 * q, 0.9 + q * 2.2 - q * q * 4, p[2] - d[2] * 0.08 * q], [S(q * 6) * 0.8, C(q * 6), 0.2], [0, -0.2, 1]) };
      return { cls, team: 'blu', pose: FP.supine(cls, p[0], p[2] - 0.6, yaw) };
    }
    return { cls, team: 'blu', pose: FP.run(cls, p[0], p[2], yaw, t * 1.7 + from[0], {}) };
  }

  function shotBattle2(t) {
    const u = t - 72.469;
    const st = playState(t, { nk: [0.1 + NOD(t), -0.05, 0], sp: [0.32, 0, 0] });
    const c = camp(t, { s2: { yaw: 0.6, pitch: 0.06, spin: t * 30 } });
    const actors = bluStatic(['heavyDead', 'deadA', 'burn', 'burn2', 'scoutDead', 'draped']);
    actors.push(runner('soldier', [7.6, 0, 5.6], [5.2, 0, 2.6], 72.5, 74.4, t, 74.15));
    const eye = spline([[0, [1.0, 4.74, 15.22]], [2.29, [0.85, 4.6, 14.9]]])(u);
    return {
      shot: 'battle2', kind: '3d', env: DUSK_ENV, camera: cam(eye, [-0.6, 1.07, -1.22], 46), eng: st, face: faceAt(t), dress: DRESS_CAMP.concat(['railL', 'sign']), camp: c, blur: 0, actors,
      fires: [{ p: [2.9, 0.15, 3.5], u: u + 2.8, s: 1.0, n: 26 }, { p: [4.6, 0.15, 2.8], u: u + 3.5, s: 0.9, n: 20 }], sparkRain: [{ p: [3.4, 2.6, -1.2], u }],
      flashes: [{ level: 2, at: 's2', s: 0.6, both: true, glow: 0.4, tracers: true }],
      rockets: [{ from: [5.0, 4.7, -2.3], to: [-20, 16, -22], k: (t - 72.0) / 1.0, i: 0 }, { from: [1.0, 2.4, -1.4], to: [-18, 14, -18], k: (t - 73.4) / 1.0, i: 2 }]
    };
  }

  function shotSil(t) {
    const u = t - 74.758;
    const st = playState(t, { nk: [0.1, -0.05, 0], sp: [0.32, 0, 0] });
    const actors = [
      runner('sniper', [-4.6, 0, 28.6], [-4.0, 0, 26.6], 74.6, 77.2, t),
      runner('pyro', [1.1, 0, 30.4], [0.6, 0, 28.6], 74.6, 77.2, t),
      runner('heavy', [-5.6, 0, 32.0], [-4.6, 0, 29.6], 75.7, 77.2, t),
      runner('scout', [-0.6, 0, 19.0], [-0.3, 0, 12.0], 74.6, 77.2, t),
      runner('demo', [2.0, 0, 18.5], [1.6, 0, 12.5], 74.6, 77.2, t),
      runner('soldier', [-2.6, 0, 21.5], [-2.0, 0, 15.5], 74.6, 77.2, t),
      runner('medic', [3.2, 0, 23.0], [2.6, 0, 17.0], 74.6, 77.2, t)
    ];
    actors.forEach(a => { a.flat = true; });
    const tracers = [];
    for (let i = 0; i < 3; i++) {
      const ph = frac(t * 2.2 + i / 3);
      tracers.push({ a: [1.6, 1.2, 0.8], b: V3.lerp([1.6, 1.2, 0.8], [-1 + i, 0.9, 14 + i * 2], ph), k: ph });
    }
    return {
      shot: 'sil', kind: '3d', env: SIL_ENV, camera: cam(V3.add([-2.0, 2.5, 36.0], [u * 0.05, 0, -u * 0.15]), [0.8, 1.2, 0.0], 44), eng: st, face: faceAt(t), dress: DRESS_CAMP.concat(['tower']), camp: camp(t), blur: 0, actors,
      fires: [{ p: [3.4, 0.15, 4.2], u: u + 5, s: 1.0, n: 20 }], tracerLines: tracers,
      booms: t > 76.5 ? [{ p: [0.5, 0.6, 12.5], u: t - 76.5, s: 2.2 }] : [],
      rockets: [{ from: [5.0, 4.7, -2.3], to: [-30, 30, 20], k: (t - 74.4) / 1.4, i: 3 }]
    };
  }

  function lineupEng(t) {
    const p = [-1.85, 0.785, 0.3];
    const yaw = 0.18;
    const pose = standPose({ p, yaw, sp: [0.06, 0.12, 0], nk: [-0.08, -0.1, 0.04], liftL: 0.32 });
    const chest = chestOf(pose);
    const X = axis(chest, 0), Y = axis(chest, 1), Z = axis(chest, 2);
    const base = M4.point(chest, [-0.25, 0.1, 0.2]);
    const top = M4.point(chest, [-0.3, 0.66, 0.08]);
    const up = V3.norm(V3.sub(top, base));
    const side = V3.norm(V3.cross(up, Z));
    const fwd = V3.cross(side, up);
    const wrenchM = new Float32Array([side[0], side[1], side[2], 0, up[0], up[1], up[2], 0, fwd[0], fwd[1], fwd[2], 0, base[0], base[1], base[2], 1]);
    const grip = M4.point(wrenchM, [0, 0.1, 0]);
    const R = freeHand(V3.add(V3.add(grip, V3.mul(X, -0.05)), V3.mul(Y, -0.08)), V3.add(V3.mul(X, 0.9), V3.mul(Y, 0.25)), V3.mul(Z, 1), 'grip');
    const knee = Eng.solve(pose).pts.kneeL;
    const L = freeHand(V3.add(knee, [0.02, 0.1, 0.06]), [0.1, -1, 0.35], [0, -0.2, -1], 'drape');
    return engState(pose, { L, R }, { wrench: wrenchM });
  }

  function shotLineup(t, which) {
    const hs = Heavy.stage(t + LINEUP_SHIFT);
    const st = lineupEng(t);
    const h = headPos(st);
    let camera = hs.camera;
    if (which === 'endA') camera = cam(V3.add(h, [-0.06, -0.06, 0.6]), V3.add(h, [-0.02, -0.02, 0]), 30);
    else if (which === 'endB') camera = cam(V3.add(h, [-0.1, -0.24, 1.05]), V3.add(h, [-0.04, -0.2, 0]), 36);
    else if (which === 'endC') camera = cam([-1.7, 0.95, 1.85], [-1.55, 1.25, 0.2], 50);
    const actors = (hs.actors || []).filter(a => a.cls !== 'engineer');
    return {
      shot: which, kind: 'lineup', env: hs.env, camera, heavy: hs.heavy, heavyFace: hs.face, actors, eng: st, face: Object.assign(faceAt(70), { smileL: 1, smileR: 0.45, wide: 0.25, jaw: 0.12 }), logo: hs.logo || null,
      blur: which === 'endA' ? 0.4 : which === 'endB' ? 0.25 : 0.1
    };
  }

  const SHOTS = [
    [0, 'black'], [1.581, 'title'], [4.245, 'black'], [5.452, 'play'], [13.736, 'talkA'], [23.851, 'wide1'], [32.925, 'low'], [38.503, 'sentry1'], [39.626, 'talkB'],
    [41.916, 'sentry2'], [43.04, 'talkC'], [47.785, 'wide2'], [49.408, 'talkD'], [54.944, 'wide3'], [64.726, 'ecu'], [69.68, 'battle1'], [72.469, 'battle2'],
    [74.758, 'sil'], [77.089, 'black'], [78.587, 'endA'], [79.212, 'endB'], [79.836, 'endC'], [80.46, 'logoA'], [81.085, 'logoB'], [83.499, 'orange']
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
      case 'title': return shotTitle(tt);
      case 'play': return shotPlay(tt);
      case 'talkA': return shotTalkA(tt);
      case 'wide1': return shotWide1(tt);
      case 'low': return shotLow(tt);
      case 'sentry1': return shotSentry1(tt);
      case 'talkB': return shotTalkB(tt);
      case 'sentry2': return shotSentry2(tt);
      case 'talkC': return shotTalkC(tt);
      case 'wide2': return shotWide2(tt);
      case 'talkD': return shotTalkD(tt);
      case 'wide3': return shotWide3(tt);
      case 'ecu': return shotEcu(tt);
      case 'battle1': return shotBattle1(tt);
      case 'battle2': return shotBattle2(tt);
      case 'sil': return shotSil(tt);
      case 'endA': case 'endB': case 'endC': case 'logoA': case 'logoB': return shotLineup(tt, name);
      case 'orange': return { shot: 'orange', kind: 'card', tex: 'orange', fade: clamp((DURATION - tt) / 1.1, 0, 1) };
      default: return { shot: 'black', kind: 'black' };
    }
  }

  function voiceAt(t) {
    return jawV(t);
  }

  window.EngScript = { ID, DURATION, CUTS, SHOTS, PLACES, KILLS, LINEUP_SHIFT, stage, voiceAt, faceAt, counterValue, beatPhase, spline, X };
})();
