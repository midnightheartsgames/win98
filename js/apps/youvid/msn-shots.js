(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Sniper = window.MeetSniper;
  const Heavy = window.MeetHeavy;
  const Voice = window.MsnVoice;
  const FP = window.FabPose;

  const ID = 'M33tTh3Sn1p';
  const DURATION = 100.07;

  const jawV = K.envelope(Voice.JAW, Voice.RATE);
  const rndV = K.envelope(Voice.ROUND, Voice.RATE);
  const wideV = K.envelope(Voice.WIDE, Voice.RATE);
  const heavyV = K.envelope(Voice.HEAVY, Voice.RATE);

  function seg(t, a, b) {
    return clamp((t - a) / (b - a), 0, 1);
  }

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

  const FACE_REST = { lidU: 0.3, lidL: 0.42 };

  function lerpObj(a, b, k) {
    const out = {};
    new Set([...Object.keys(a), ...Object.keys(b)]).forEach(key => {
      const va = a[key] === undefined ? (FACE_REST[key] || 0) : a[key];
      const vb = b[key] === undefined ? (FACE_REST[key] || 0) : b[key];
      out[key] = Array.isArray(va) ? va.map((v, i) => lerp(v, vb[i], k)) : lerp(va, vb, k);
    });
    return out;
  }

  function track(keys, dur) {
    return (t) => {
      let i = 0;
      while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
      const cur = keys[i][1];
      if (i === 0) return Object.assign({}, cur);
      const k = ease((t - keys[i][0]) / (keys[i][2] || dur || 0.25));
      return lerpObj(keys[i - 1][1], cur, k);
    };
  }

  const X = {
    calm: { frown: 0.25, browDown: 0.15 },
    talk: { frown: 0.15, browUp: 0.15 },
    explain: { frown: 0.1, browUp: 0.35, browInUp: 0.2, lidU: 0.42 },
    wry: { smileL: 0.45, smileR: 0.1, browDown: 0.15, lidU: 0.34 },
    smirk: { smileL: 0.6, smileR: 0.25, browDown: 0.25, sneer: 0.1, lidU: 0.32 },
    grin: { smileL: 0.7, smileR: 0.6, wide: 0.3, browUp: 0.1 },
    grim: { frown: 0.6, browDown: 0.45, sneer: 0.1, lidU: 0.3 },
    squint: { frown: 0.3, browDown: 0.6, lidU: 0.22, lidL: 0.55, sneer: 0.15 },
    sad: { frown: 0.7, browInUp: 0.6, browDown: 0.1, lidU: 0.28 },
    annoyed: { frown: 0.55, browDown: 0.6, sneer: 0.25, lidU: 0.32 },
    hurt: { frown: 0.5, browInUp: 0.7, lidU: 0.3, wide: 0.15 },
    surprise: { browUp: 0.8, browInUp: 0.4, lidU: 0.7, round: 0.15 },
    shout: { browDown: 0.5, wide: 0.6, jaw: 0.6, sneer: 0.3, lidU: 0.45 },
    brush: { frown: 0.15, browDown: 0.2, round: 0.35, jaw: 0.12, lidU: 0.32 },
    disgust: { frown: 0.75, browDown: 0.5, sneer: 0.45, lidU: 0.3, lidL: 0.5 },
    firm: { frown: 0.4, browDown: 0.3, lidU: 0.36 }
  };

  const BLINKS = [14.2, 16.6, 19.9, 22.2, 24.4, 27.8, 38.2, 40.9, 43.3, 45.9, 47.8, 51.2, 53.8, 57.3, 59.4, 66.5, 68.7, 70.3, 81.2, 86.4, 88.3, 89.6];

  function blinkAt(t, list) {
    let v = 0;
    (list || BLINKS).forEach(b => {
      const d = Math.abs(t - b);
      if (d < 0.09) v = Math.max(v, 1 - d / 0.09);
    });
    return v;
  }

  function sniperFace(t, expr, extra) {
    const e = Object.assign({}, FACE_REST, expr || {});
    const v = clamp(jawV(t) * 0.95, 0, 1);
    const base = e.jaw || 0;
    const f = {
      browDown: e.browDown || 0, browUp: e.browUp || 0, browInUp: e.browInUp || 0, smileL: e.smileL || 0, smileR: e.smileR || 0,
      frown: clamp((e.frown || 0) * (1 - v * 0.5), 0, 1), wide: clamp((e.wide || 0) + wideV(t) * 0.35, 0, 1.2), round: clamp((e.round || 0) + rndV(t) * 0.8, 0, 1),
      sneer: e.sneer || 0, lidU: e.lidU, lidL: e.lidL, jaw: clamp(base + v * (0.75 - base * 0.4), 0, 1.15), blink: blinkAt(t), look: e.look || [0, 0]
    };
    return Object.assign(f, extra || {});
  }

  const HX = {
    calm: { browDown: 0.3, smile: 0.05, lidU: 0.55, lidL: 0.35 },
    laugh: { smile: 1, wide: 0.85, jaw: 0.75, browUp: 0.35, lidU: 0.45, lidL: 0.55 },
    hit: { browUp: 0.9, browInUp: 0.6, wide: 0.5, jaw: 0.95, round: 0.4, lidU: 0.95, lidL: 0.15 }
  };

  function heavyFace(t, expr, extra) {
    const e = Object.assign({ lidU: 0.55, lidL: 0.35 }, expr || {});
    const v = clamp(heavyV(t) * 0.9, 0, 1);
    const f = {
      browDown: e.browDown || 0, browUp: e.browUp || 0, browInUp: e.browInUp || 0, smile: e.smile || 0, frown: e.frown || 0, wide: e.wide || 0,
      round: e.round || 0, sneer: e.sneer || 0, lidU: e.lidU, lidL: e.lidL, jaw: clamp((e.jaw || 0) + v * 0.35, 0, 1.15), blink: e.blink || 0, look: e.look || [0, 0]
    };
    return Object.assign(f, extra || {});
  }

  function basisM(o, x, y, z) {
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, o[0], o[1], o[2], 1]);
  }

  function frameAt(o, fwd, up) {
    const z = V3.norm(fwd);
    let x = V3.cross(up || [0, 1, 0], z);
    x = V3.len(x) < 1e-5 ? [1, 0, 0] : V3.norm(x);
    return basisM(o, x, V3.cross(z, x), z);
  }

  function axes(yaw) {
    return { fwd: [S(yaw), 0, C(yaw)], side: [C(yaw), 0, -S(yaw)] };
  }

  const STAND_Y = 1.045;

  function standPose(o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at || [0, 0, 0];
    const drop = o.drop || 0;
    const sway = o.sway || 0;
    const p = o.p || [g[0] + sway * side[0], (g[1] || 0) + STAND_Y - drop, g[2] + sway * side[2]];
    const pose = { p, fwd: o.fwd || fwd, up: o.up || [0, 1, 0], sp: o.sp || [0.04, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.7, -0.5, -0.4], eR: o.eR || [-0.7, -0.5, -0.4] };
    const spread = o.spread === undefined ? 0.06 : o.spread;
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const lift = o['lift' + s] || 0;
      const fo = o['f' + s] || [0, 0];
      const f = V3.add(g, V3.add(V3.mul(side, k * (Sniper.D.hipX + spread) + fo[0]), V3.mul(fwd, 0.03 + fo[1])));
      pose['f' + s + 'w'] = [f[0], (g[1] || 0) + 0.075 + lift, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.5 + side[0] * k * 0.25, 0.6 + lift, fwd[2] * 1.5 + side[2] * k * 0.25]);
    });
    return pose;
  }

  function sitPose(o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const seat = o.seat;
    const p = [seat[0], seat[1] + 0.06, seat[2]];
    const pose = { p, fwd, up: o.up || [0, 1, 0], sp: o.sp || [-0.05, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.7, -0.4, -0.3], eR: o.eR || [-0.7, -0.4, -0.3] };
    const foot = o.foot === undefined ? 0.5 : o.foot;
    const floor = o.floor === undefined ? seat[1] - 0.48 : o.floor;
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const fo = o['f' + s] || [0, 0];
      const spread = o.spread === undefined ? 0.13 : o.spread;
      const f = V3.add(seat, V3.add(V3.mul(side, k * spread + fo[0]), V3.mul(fwd, foot + fo[1])));
      pose['f' + s + 'w'] = [f[0], floor + 0.075 + (o['lift' + s] || 0), f[2]];
      pose['k' + s + 'w'] = V3.add(seat, [fwd[0] * 2 + side[0] * k * 0.4, 1.2, fwd[2] * 2 + side[2] * k * 0.4]);
    });
    return pose;
  }

  function placeHead(pose, target) {
    const h = Sniper.solve(pose).pts.head;
    const d = V3.sub(target, h);
    const out = Object.assign({}, pose, { p: V3.add(pose.p, d) });
    ['fLw', 'fRw', 'kLw', 'kRw'].forEach(k => { if (pose[k]) out[k] = V3.add(pose[k], k[0] === 'f' ? [d[0], 0, d[2]] : d); });
    return out;
  }

  function hand(target, fingers, palm, pose) {
    return { target, fingers: V3.norm(fingers), palm: V3.norm(palm), pose };
  }

  function sniperState(pose, hands, extra) {
    const p = Object.assign({}, pose);
    if (hands && hands.L) p.hLw = hands.L.target;
    if (hands && hands.R) p.hRw = hands.R.target;
    const m = Sniper.solve(p);
    const hm = {};
    ['L', 'R'].forEach(s => {
      const h = hands && hands[s];
      if (!h) return;
      hm[s] = { pose: h.pose, M: h.free ? null : Sniper.handBasis(m.pts['wrist' + s], h.fingers, h.palm) };
    });
    return Object.assign({ pose: p, m, hands: hm }, extra || {});
  }

  function chestOf(pose) {
    return Sniper.solve(pose).chest;
  }

  function local(M, p) {
    return M4.point(M, p);
  }

  function dirL(M, d) {
    return V3.norm(M4.dir(M, d));
  }

  const GEST = {
    down: { L: [[0.25, -0.36, 0.03], [0.05, -1, 0.1], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.25, -0.36, 0.03], [-0.05, -1, 0.1], [1, 0, 0.1], 'relax', [-0.6, -0.2, -0.6]] },
    loose: { L: [[0.27, -0.3, 0.1], [0.15, -1, 0.3], [-1, 0, 0.2], 'rest', [0.7, -0.2, -0.5]], R: [[-0.27, -0.3, 0.1], [-0.15, -1, 0.3], [1, 0, 0.2], 'rest', [-0.7, -0.2, -0.5]] },
    explain: { L: [[0.25, -0.34, 0.06], [0.1, -1, 0.2], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.16, 0.06, 0.36], [0.25, 0.35, 1], [0.6, 0.3, -0.2], 'claw', [-0.4, -1, -0.2]] },
    open: { L: [[0.25, -0.34, 0.06], [0.1, -1, 0.2], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.24, 0.0, 0.34], [-0.3, 0.2, 1], [0.1, 1, 0.2], 'open', [-0.5, -1, -0.2]] },
    point: { L: [[0.25, -0.34, 0.06], [0.1, -1, 0.2], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.14, 0.12, 0.46], [0.15, 0.1, 1], [0.2, -1, 0], 'point', [-0.8, -0.5, -0.1]] }
  };

  function gestureHands(chest, name) {
    const G = GEST[name];
    const out = { elbows: {} };
    ['L', 'R'].forEach(s => {
      const [at, fingers, palm, pose, elbow] = G[s];
      const tip = local(chest, at);
      const f = dirL(chest, fingers);
      out[s] = hand(V3.sub(tip, V3.mul(f, 0.08)), f, dirL(chest, palm), pose);
      out.elbows[s] = elbow;
    });
    return out;
  }

  function blendHand(a, b, k) {
    if (k <= 0) return a;
    if (k >= 1) return b;
    return { target: V3.lerp(a.target, b.target, k), fingers: V3.norm(V3.lerp(a.fingers, b.fingers, k)), palm: V3.norm(V3.lerp(a.palm, b.palm, k)), pose: k < 0.5 ? a.pose : b.pose };
  }

  function handTrack(keys, t, dur) {
    let i = 0;
    while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
    const cur = keys[i][1];
    if (i === 0) return cur;
    const k = ease((t - keys[i][0]) / (keys[i][2] || dur || 0.3));
    return blendHand(keys[i - 1][1], cur, k);
  }

  function gripHand(grip, reach) {
    const wrist = V3.sub(grip.pos, V3.mul(grip.fingers, reach === undefined ? 0.055 : reach));
    return hand(V3.sub(wrist, V3.mul(grip.palm, 0.022)), grip.fingers, grip.palm, grip.pose);
  }

  function heavyState(pose, hands, extra) {
    const p = Object.assign({}, pose);
    if (hands && hands.L) p.hLw = hands.L.target;
    if (hands && hands.R) p.hRw = hands.R.target;
    const m = Heavy.solve(p);
    const hm = {};
    ['L', 'R'].forEach(s => {
      const h = hands && hands[s];
      if (!h) return;
      hm[s] = { pose: h.pose, M: Heavy.handBasis(m.pts['wrist' + s], h.fingers, h.palm) };
    });
    return Object.assign({ pose: p, m, hands: hm }, extra || {});
  }

  function headPos(st, off) {
    return M4.point(st.m.head, off || [0, 0, 0]);
  }

  function cam(eye, at, fov, roll) {
    return { eye, at, fov, roll: roll || 0, near: 0.02, far: 600 };
  }

  function orbit(target, yaw, pitch, dist, fov, roll) {
    const eye = [target[0] + S(yaw) * C(pitch) * dist, target[1] + S(pitch) * dist, target[2] + C(yaw) * C(pitch) * dist];
    return cam(eye, target, fov, roll);
  }

  function shake(t, amp, seed) {
    return K.wobble(t * 1.7, amp, seed || 1);
  }

  function blu(cls, pose, extra) {
    return Object.assign({ cls, team: 'blu', pose }, extra || {});
  }

  function red(cls, pose, extra) {
    return Object.assign({ cls, team: 'red', pose }, extra || {});
  }

  const DESERT_KEY = { dir: [0.45, -0.55, 0.7], col: [1.25, 1.08, 0.9] };

  const ENV = {
    road: {
      key: { dir: [0.35, -0.6, -0.72], col: [1.2, 1.06, 0.92] }, ambTop: [0.62, 0.6, 0.62], ambBot: [0.42, 0.34, 0.3], warp: [0.65, 0.42, 0.34], rim: [0.6, 0.55, 0.5], rimPow: 3,
      points: [], fogCol: [0.88, 0.8, 0.72], fog: [25, 300], clear: [0.88, 0.82, 0.72], grade: [1.02, 0.99, 0.95, 0.1], vig: 0.25
    },
    dash: {
      key: { dir: [-0.3, -0.6, -0.75], col: [1.1, 0.98, 0.86] }, ambTop: [0.46, 0.42, 0.4], ambBot: [0.22, 0.19, 0.17], warp: [0.6, 0.38, 0.3], rim: [0.75, 0.66, 0.56], rimPow: 2.6,
      points: [], fogCol: [0.8, 0.7, 0.62], fog: [30, 300], clear: [0.8, 0.7, 0.62], grade: [1.03, 0.98, 0.93, 0.08], vig: 0.35
    },
    cab: {
      key: { dir: [-0.55, -0.45, -0.7], col: [1.2, 1.08, 0.94] }, ambTop: [0.5, 0.47, 0.46], ambBot: [0.3, 0.25, 0.22], warp: [0.62, 0.4, 0.32], rim: [0.8, 0.72, 0.62], rimPow: 2.6,
      points: [{ pos: [0.9, 1.6, 1.2], col: [0.35, 0.32, 0.3], k: 0.4 }], fogCol: [0.86, 0.78, 0.7], fog: [25, 260], clear: [0.86, 0.8, 0.74], grade: [1.03, 0.99, 0.95, 0.1], vig: 0.25
    },
    mirror: {
      key: { dir: [0.4, -0.5, -0.75], col: [0.95, 0.9, 0.84] }, ambTop: [0.48, 0.46, 0.44], ambBot: [0.24, 0.22, 0.2], warp: [0.6, 0.4, 0.34], rim: [0.55, 0.52, 0.5], rimPow: 3,
      points: [{ pos: [0.4, 2.1, 1.1], col: [0.7, 0.66, 0.6], k: 0.4 }], fogCol: [0.5, 0.48, 0.45], fog: [20, 80], clear: [0.45, 0.42, 0.4], grade: [1.0, 0.98, 0.95, 0.12], vig: 0.3
    },
    scope: {
      key: { dir: [0.35, -0.6, -0.7], col: [1.25, 1.1, 0.92] }, ambTop: [0.68, 0.62, 0.55], ambBot: [0.4, 0.33, 0.27], warp: [0.68, 0.45, 0.32], rim: [0.7, 0.6, 0.48], rimPow: 3,
      points: [], fogCol: [0.75, 0.62, 0.5], fog: [40, 160], clear: [0.62, 0.5, 0.38], grade: [1.04, 0.99, 0.9, 0.1], vig: 0
    },
    nest: {
      key: { dir: [0.4, -0.6, 0.7], col: [1.2, 1.05, 0.9] }, ambTop: [0.55, 0.52, 0.5], ambBot: [0.32, 0.28, 0.25], warp: [0.62, 0.42, 0.34], rim: [0.5, 0.45, 0.4], rimPow: 3,
      points: [], fogCol: [0.82, 0.74, 0.66], fog: [30, 220], clear: [0.8, 0.74, 0.66], grade: [1.0, 0.97, 0.94, 0.12], vig: 0.35
    },
    nestIn: {
      key: { dir: [0.2, -0.3, 1], col: [0.35, 0.3, 0.26] }, ambTop: [0.12, 0.1, 0.1], ambBot: [0.07, 0.06, 0.06], warp: [0.6, 0.4, 0.34], rim: [0.9, 0.78, 0.66], rimPow: 2.4,
      points: [], fogCol: [0, 0, 0], fog: [50, 300], clear: [0.05, 0.05, 0.05], grade: [1, 1, 1, 0.05], vig: 0.35
    },
    phone: {
      key: { dir: [0.5, -0.4, -0.75], col: [1.15, 1.04, 0.95] }, ambTop: [0.6, 0.58, 0.62], ambBot: [0.38, 0.32, 0.32], warp: [0.62, 0.42, 0.36], rim: [0.75, 0.7, 0.72], rimPow: 2.6,
      points: [], fogCol: [0.74, 0.66, 0.7], fog: [20, 260], clear: [0.84, 0.82, 0.8], grade: [1.02, 0.99, 0.98, 0.1], vig: 0.22
    },
    tower: {
      key: DESERT_KEY, ambTop: [0.62, 0.6, 0.64], ambBot: [0.4, 0.33, 0.3], warp: [0.65, 0.42, 0.34], rim: [0.6, 0.55, 0.52], rimPow: 3,
      points: [], fogCol: [0.8, 0.74, 0.72], fog: [30, 330], clear: [0.86, 0.82, 0.76], grade: [1.02, 0.99, 0.96, 0.1], vig: 0.2
    },
    hut: {
      key: { dir: [0.7, -0.35, 0.6], col: [1.25, 1.02, 0.78] }, ambTop: [0.24, 0.2, 0.19], ambBot: [0.12, 0.1, 0.09], warp: [0.65, 0.38, 0.28], rim: [0.6, 0.5, 0.42], rimPow: 2.6,
      points: [{ pos: [1.6, 1.8, 1.4], col: [1.4, 1.1, 0.8], k: 0.25 }], fogCol: [0.1, 0.08, 0.07], fog: [12, 60], clear: [0.1, 0.08, 0.07], grade: [1.04, 0.98, 0.92, 0.08], vig: 0.4
    },
    hall: {
      key: { dir: [0.1, -1, -0.2], col: [0.75, 0.74, 0.74] }, ambTop: [0.4, 0.42, 0.44], ambBot: [0.22, 0.22, 0.23], warp: [0.6, 0.45, 0.42], rim: [0.6, 0.62, 0.66], rimPow: 3,
      points: [{ pos: [0, 2.35, 0], col: [1.3, 1.25, 1.15], k: 0.5 }], fogCol: [0.35, 0.36, 0.38], fog: [8, 40], clear: [0.3, 0.3, 0.32], grade: [0.98, 0.99, 1.02, 0.15], vig: 0.35
    },
    sun: {
      key: { dir: [0.5, -0.2, 0.85], col: [1.0, 0.9, 0.8] }, ambTop: [0.72, 0.72, 0.76], ambBot: [0.5, 0.42, 0.4], warp: [0.65, 0.45, 0.4], rim: [1.4, 1.25, 1.05], rimPow: 2,
      points: [], fogCol: [0.85, 0.85, 0.85], fog: [60, 400], clear: [0.66, 0.74, 0.8], grade: [1.05, 1.02, 0.98, 0.08], vig: 0.12
    },
    town: {
      key: { dir: [-0.5, -0.45, -0.75], col: [1.25, 1.1, 0.92] }, ambTop: [0.55, 0.5, 0.48], ambBot: [0.36, 0.3, 0.26], warp: [0.65, 0.42, 0.34], rim: [0.85, 0.75, 0.62], rimPow: 2.6,
      points: [], fogCol: [0.86, 0.76, 0.66], fog: [20, 200], clear: [0.9, 0.82, 0.72], grade: [1.04, 1.0, 0.95, 0.08], vig: 0.25
    }
  };

  window.MsnShots = {
    ID, DURATION, jawV, heavyV, seg, spline, track, X, HX, sniperFace, heavyFace, blinkAt, basisM, frameAt, axes, standPose, sitPose, placeHead,
    hand, sniperState, chestOf, local, dirL, GEST, gestureHands, blendHand, handTrack, gripHand, heavyState, headPos, cam, orbit, shake, blu, red, ENV, STAND_Y, FP
  };
})();
