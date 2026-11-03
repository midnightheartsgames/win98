(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Pyro = window.MeetPyro;
  const Heavy = window.MeetHeavy;
  const Scout = window.MeetScout;
  const Voice = window.MpyVoice;
  const Props = window.MpyProps;

  const ID = 'M33tTh3Pyr0';
  const DURATION = 151.37;

  const heavyV = K.envelope(Voice.HEAVY, Voice.RATE);
  const scoutV = K.envelope(Voice.SCOUT, Voice.RATE);
  const spyV = K.envelope(Voice.SPY, Voice.RATE);
  const screamV = K.envelope(Voice.SCREAM, Voice.RATE);
  const soldierV = K.envelope(Voice.SOLDIER, Voice.RATE);
  const rndV = K.envelope(Voice.ROUND, Voice.RATE);
  const wideV = K.envelope(Voice.WIDE, Voice.RATE);

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

  function track(keys, dur) {
    return (t) => {
      let i = 0;
      while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
      const cur = keys[i][1];
      if (i === 0) return Object.assign({}, cur);
      const k = ease((t - keys[i][0]) / (keys[i][2] || dur || 0.25));
      const a = keys[i - 1][1], out = {};
      new Set([...Object.keys(a), ...Object.keys(cur)]).forEach(key => {
        const va = a[key] === undefined ? 0 : a[key], vb = cur[key] === undefined ? 0 : cur[key];
        out[key] = Array.isArray(va) || Array.isArray(vb) ? [0, 1].map(j => lerp((va && va[j]) || 0, (vb && vb[j]) || 0, k)) : lerp(va, vb, k);
      });
      return out;
    };
  }

  function blinkAt(t, list) {
    let v = 0;
    list.forEach(b => {
      const d = Math.abs(t - b);
      if (d < 0.09) v = Math.max(v, 1 - d / 0.09);
    });
    return v;
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

  const STAND_Y = 0.985;

  function feet(pose, g, yaw, o) {
    const { fwd, side } = axes(yaw);
    const spread = o.spread === undefined ? 0.07 : o.spread;
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const lift = o['lift' + s] || 0;
      const fo = o['f' + s] || [0, 0];
      const f = V3.add(g, V3.add(V3.mul(side, k * (Pyro.D.hipX + spread) + fo[0]), V3.mul(fwd, 0.03 + fo[1])));
      pose['f' + s + 'w'] = [f[0], (g[1] || 0) + 0.075 + lift, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.5 + side[0] * k * 0.3, 0.6 + lift, fwd[2] * 1.5 + side[2] * k * 0.3]);
    });
    return pose;
  }

  function standPose(o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at || [0, 0, 0];
    const sway = o.sway || 0;
    const p = o.p || [g[0] + sway * side[0], (g[1] || 0) + STAND_Y - (o.drop || 0), g[2] + sway * side[2]];
    const pose = { p, fwd, up: o.up || [0, 1, 0], sp: o.sp || [0.06, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.7, -0.5, -0.4], eR: o.eR || [-0.7, -0.5, -0.4] };
    if (o.hL) pose.hL = o.hL;
    if (o.hR) pose.hR = o.hR;
    return feet(pose, g, yaw, o);
  }

  function walkPose(o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at;
    const ph = (o.phase || 0) * PI * 2;
    const stride = o.stride === undefined ? 0.3 : o.stride;
    const bob = Math.abs(S(ph)) * (o.bob === undefined ? 0.035 : o.bob);
    const lean = o.lean === undefined ? 0.08 : o.lean;
    const p = [g[0], (g[1] || 0) + STAND_Y - 0.03 + bob + (o.y || 0), g[2]];
    const pose = { p, fwd, up: [0, 1, 0], sp: [lean, S(ph) * 0.08 + (o.twist || 0), S(ph) * 0.03], nk: o.nk || [-lean * 0.6, -S(ph) * 0.06, 0], eL: [0.6, -0.4, -0.6], eR: [-0.6, -0.4, -0.6] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const sw = S(ph) * k;
      const lift = Math.max(0, C(ph) * k) * (o.lift === undefined ? 0.16 : o.lift);
      const f = V3.add(g, V3.add(V3.mul(side, k * (Pyro.D.hipX + 0.06)), V3.mul(fwd, sw * stride)));
      pose['f' + s + 'w'] = [f[0], (g[1] || 0) + 0.075 + lift, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.5 + side[0] * k * 0.2, 0.7, fwd[2] * 1.5 + side[2] * k * 0.2]);
    });
    pose.hL = o.hL || [Pyro.D.shX + 0.08, -0.25, -S(ph) * 0.18 + 0.08];
    pose.hR = o.hR || [-(Pyro.D.shX + 0.08), -0.25, S(ph) * 0.18 + 0.08];
    return pose;
  }

  function runPose(o) {
    return walkPose(Object.assign({ stride: 0.46, bob: 0.07, lean: 0.3, lift: 0.3, nk: [-0.25, 0, 0] }, o));
  }

  function airPose(o) {
    const legLen = Pyro.D.thigh + Pyro.D.shin;
    const tuck = o.tuck === undefined ? 0.5 : o.tuck;
    const pose = { p: o.p, fwd: V3.norm(o.fwd || [0, 0, 1]), up: V3.norm(o.up || [0, 1, 0]), sp: o.sp || [0.3, 0, 0], nk: o.nk || [-0.2, 0, 0] };
    pose.fL = [Pyro.D.hipX + 0.05, -legLen * lerp(0.95, 0.5, tuck), lerp(0.1, 0.38, tuck)];
    pose.fR = [-(Pyro.D.hipX + 0.05), -legLen * lerp(0.9, 0.72, tuck), lerp(-0.3, -0.22, tuck)];
    pose.kL = [0.1, 0, 1];
    pose.kR = [-0.1, 0, 1];
    pose.hL = o.hL || [Pyro.D.shX + 0.2, 0.05, 0.1];
    pose.hR = o.hR || [-(Pyro.D.shX + 0.15), -0.05, 0.25];
    pose.eL = o.eL || [0.6, -0.3, -0.5];
    pose.eR = o.eR || [-0.6, -0.3, -0.5];
    return pose;
  }

  function hand(target, fingers, palm, pose) {
    return { target, fingers: V3.norm(fingers), palm: V3.norm(palm), pose };
  }

  function pyroState(pose, hands, extra) {
    const p = Object.assign({}, pose);
    if (hands && hands.L) p.hLw = hands.L.target;
    if (hands && hands.R) p.hRw = hands.R.target;
    const m = Pyro.solve(p);
    const hm = {};
    ['L', 'R'].forEach(s => {
      const h = hands && hands[s];
      if (!h) return;
      hm[s] = { pose: h.pose, M: Pyro.handBasis(m.pts['wrist' + s], h.fingers, h.palm) };
    });
    return Object.assign({ pose: p, m, hands: hm }, extra || {});
  }

  function chestOf(pose) {
    return Pyro.solve(pose).chest;
  }

  const GRIPS = {
    flamer: { R: [[0, -0.07, -0.02], [0, -0.3, 1], [1, 0, 0], 'grip'], L: [[0, -0.05, 0.42], [0, -0.2, 1], [-1, 0, 0], 'grip'] },
    rainblower: { R: [[0, -0.06, -0.02], [0, -0.3, 1], [1, 0, 0], 'grip'], L: [[0, -0.03, 0.3], [0, -0.2, 1], [-1, 0, 0], 'grip'] },
    axe: { R: [[0, -0.32, 0], [0, 0, 1], [1, 0, 0], 'grip'], L: [[0, -0.12, 0], [0, 0, 1], [1, 0, 0], 'grip'] },
    lolli: { R: [[0, -0.42, 0], [0, 0, 1], [1, 0, 0], 'grip'] },
    flare: { R: [[0, -0.03, -0.0], [0, -0.3, 1], [1, 0, 0], 'grip'] }
  };

  function gripOn(G, kind, side) {
    const g = GRIPS[kind][side];
    if (!g) return null;
    const pos = M4.point(G, g[0]);
    const fingers = V3.norm(M4.dir(G, g[1]));
    const palm = V3.norm(M4.dir(G, g[2]));
    const wrist = V3.sub(V3.sub(pos, V3.mul(fingers, 0.055)), V3.mul(palm, 0.03));
    return hand(wrist, fingers, palm, g[3]);
  }

  function holding(pose, G, kind, extra) {
    const hands = { R: gripOn(G, kind, 'R') };
    const L = gripOn(G, kind, 'L');
    if (L) hands.L = L;
    const e = extra || {};
    if (e.L) hands.L = e.L;
    if (e.R) hands.R = e.R;
    const p = Object.assign({}, pose);
    p.eR = e.eR || [-0.6, -0.5, -0.4];
    if (L || e.L) p.eL = e.eL || [0.7, -0.4, -0.2];
    return pyroState(p, hands, { weapon: { kind, M: G } });
  }

  function hipFlamer(pose, o) {
    const ch = chestOf(pose);
    const q = o || {};
    return M4.chain(ch, M4.translate(q.x === undefined ? -0.1 : q.x, q.y === undefined ? -0.14 : q.y, q.z === undefined ? 0.24 : q.z), M4.rotY(q.yaw || 0.08), M4.rotX(-(q.pitch || 0)), M4.rotZ(q.roll || 0));
  }

  function headPos(st, off) {
    return Pyro.headPoint(st.m, off || [0, 0, 0]);
  }

  function cam(eye, at, fov, roll) {
    return { eye, at, fov, roll: roll || 0, near: 0.03, far: 420 };
  }

  function orbit(target, yaw, pitch, dist, fov, roll) {
    const eye = [target[0] + S(yaw) * C(pitch) * dist, target[1] + S(pitch) * dist, target[2] + C(yaw) * C(pitch) * dist];
    return cam(eye, target, fov, roll);
  }

  function shake(t, amp, seed) {
    return K.wobble(t * 1.7, amp, seed || 1);
  }

  function heavyBody(o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const pose = { p: o.p, fwd: o.fwd || fwd, up: o.up || [0, 1, 0], sp: o.sp || [0, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.85, -0.75, -0.15], eR: o.eR || [-0.85, -0.75, -0.15] };
    if (o.legs === 'sit') {
      [['L', 1], ['R', -1]].forEach(([s, k]) => {
        const hip = V3.add(o.p, V3.mul(side, k * 0.2));
        pose['f' + s + 'w'] = [hip[0] + fwd[0] * 0.55 + side[0] * k * 0.12, 0.08, hip[2] + fwd[2] * 0.55 + side[2] * k * 0.12];
        pose['k' + s + 'w'] = V3.add(hip, [fwd[0] * 1.5 + side[0] * k * 0.4, 0.6, fwd[2] * 1.5 + side[2] * k * 0.4]);
      });
    } else if (o.legs) {
      Object.assign(pose, o.legs);
    }
    if (o.hL) pose.hL = o.hL;
    if (o.hR) pose.hR = o.hR;
    return pose;
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

  function scoutState(pose, hands, extra) {
    const p = Object.assign({}, pose);
    if (hands && hands.L) p.hLw = hands.L.target;
    if (hands && hands.R) p.hRw = hands.R.target;
    const m = Scout.solve(p);
    const hm = {};
    ['L', 'R'].forEach(s => {
      const h = hands && hands[s];
      if (!h) return;
      hm[s] = { pose: h.pose, M: Scout.handBasis(m.pts['wrist' + s], h.fingers, h.palm) };
    });
    return Object.assign({ pose: p, m, hands: hm }, extra || {});
  }

  const HEAVY_BLINKS = [12.2, 14.1, 16.4, 18.6];
  const SCOUT_BLINKS = [25.3, 26.7, 28.1, 29.5];
  const SPY_BLINKS = [38.0, 40.2, 43.9, 46.4, 49.1];

  function heavyFace(t, e, extra) {
    const x = Object.assign({ lidU: 0.55, lidL: 0.35 }, e || {});
    const v = clamp(heavyV(t), 0, 1);
    const f = {
      browDown: x.browDown || 0, browUp: x.browUp || 0, browInUp: x.browInUp || 0, smile: x.smile || 0, frown: x.frown || 0, wide: x.wide || 0, round: clamp((x.round || 0) + rndV(t) * 0.6, 0, 1),
      sneer: x.sneer || 0, lidU: x.lidU, lidL: x.lidL, jaw: clamp((x.jaw || 0) + v * 0.75, 0, 1.15), blink: Math.max(x.blink || 0, blinkAt(t, HEAVY_BLINKS)), look: x.look || [0, 0]
    };
    return Object.assign(f, extra || {});
  }

  function scoutFace(t, e, extra) {
    const x = Object.assign({ lidU: 0.5, lidL: 0.35 }, e || {});
    const v = clamp(scoutV(t) * 0.95, 0, 1);
    const f = {
      browDown: x.browDown || 0, browUp: x.browUp || 0, browInUp: x.browInUp || 0, smileL: x.smileL || 0, smileR: x.smileR || 0, frown: x.frown || 0,
      wide: clamp((x.wide || 0) + wideV(t) * 0.35, 0, 1.2), round: clamp((x.round || 0) + rndV(t) * 0.8, 0, 1), sneer: x.sneer || 0,
      lidU: x.lidU, lidL: x.lidL, jaw: clamp((x.jaw || 0) + v * 0.8, 0, 1.15), blink: blinkAt(t, SCOUT_BLINKS), look: x.look || [0, 0]
    };
    return Object.assign(f, extra || {});
  }

  function spyFace(t, e) {
    const x = e || {};
    return { jaw: clamp(spyV(t) * 0.55 + (x.jaw || 0), 0, 1), smile: x.smile || 0.08, wide: wideV(t) * 0.2, lidU: x.lidU === undefined ? 0.36 : x.lidU, blink: blinkAt(t, SPY_BLINKS), browDown: x.browDown || 0.2, look: x.look || [0, 0] };
  }

  function screamJaw(t, base) {
    return clamp((base || 0.4) + screamV(t) * 0.7, 0, 1.15);
  }

  function soldierJaw(t) {
    return clamp(0.25 + soldierV(t) * 0.6, 0, 1.1);
  }

  function giggle(t, seed) {
    const s = seed || 0;
    return { smile: 1, jaw: 0.35 + Math.abs(S(t * 13 + s)) * 0.35, wide: 0.5, browUp: 0.4, lidU: 0.3, lidL: 0.6 };
  }

  const ENV = {
    title: { clear: [0, 0, 0] },
    silhouette: {
      key: { dir: [0.15, -0.4, -1], col: [0.9, 0.6, 0.36] },
      ambTop: [0.07, 0.05, 0.04], ambBot: [0.05, 0.035, 0.03], warp: [0.6, 0.3, 0.2], rim: [0.8, 0.5, 0.28], rimPow: 3.2,
      points: [], fogCol: [0.86, 0.56, 0.34], fog: [8, 110], clear: [0.86, 0.56, 0.34], grade: [1.05, 0.95, 0.85, 0.08], vig: 0.4
    },
    fireFront: {
      key: { dir: [0.65, -0.3, -0.7], col: [0.95, 0.46, 0.2] },
      ambTop: [0.1, 0.055, 0.04], ambBot: [0.08, 0.04, 0.03], warp: [0.62, 0.28, 0.14], rim: [1.2, 0.6, 0.25], rimPow: 2.6,
      points: [{ pos: [-2, 1.5, -2], col: [1.2, 0.5, 0.15], k: 0.3 }], fogCol: [0.4, 0.18, 0.07], fog: [3, 50], clear: [0.3, 0.12, 0.05], grade: [1.06, 0.94, 0.82, 0.05], vig: 0.45
    },
    desert: {
      key: { dir: [0.2, -0.35, -1], col: [1.1, 0.72, 0.44] },
      ambTop: [0.2, 0.14, 0.11], ambBot: [0.12, 0.08, 0.06], warp: [0.6, 0.3, 0.2], rim: [1.3, 0.8, 0.45], rimPow: 2.2,
      points: [{ pos: [2, 0.6, 6], col: [1.4, 0.6, 0.2], k: 0.5 }], fogCol: [0.86, 0.56, 0.34], fog: [8, 110], clear: [0.86, 0.56, 0.34], grade: [1.05, 0.95, 0.85, 0.08], vig: 0.4
    },
    room: {
      key: { dir: [0.3, -0.25, 1], col: [0.25, 0.25, 0.27] },
      ambTop: [0.07, 0.07, 0.08], ambBot: [0.04, 0.035, 0.035], warp: [0.55, 0.35, 0.3], rim: [1.3, 1.3, 1.35], rimPow: 2.2,
      points: [{ pos: [0.6, 1.8, -1.2], col: [0.6, 0.6, 0.62], k: 0.8 }], fogCol: [0, 0, 0], fog: [500, 900], clear: [0.02, 0.02, 0.02], grade: [1, 1, 1, 0.15], vig: 0.45
    },
    spy: {
      key: { dir: [-0.6, -0.15, -0.8], col: [0.16, 0.16, 0.19] },
      ambTop: [0.05, 0.05, 0.06], ambBot: [0.03, 0.03, 0.035], warp: [0.5, 0.36, 0.34], rim: [1.0, 1.02, 1.1], rimPow: 2.4,
      points: [{ pos: [0.3, 1.6, 0.4], col: [0.9, 0.5, 0.2], k: 9 }], fogCol: [0, 0, 0], fog: [500, 900], clear: [0.02, 0.02, 0.025], grade: [1, 1, 1, 0.2], vig: 0.5
    },
    street: {
      key: { dir: [0.1, -0.3, -1], col: [1.3, 0.85, 0.5] },
      ambTop: [0.12, 0.08, 0.06], ambBot: [0.07, 0.05, 0.04], warp: [0.6, 0.3, 0.2], rim: [1.2, 0.75, 0.4], rimPow: 2.4,
      points: [{ pos: [5.6, 1.6, 18.2], col: [2.6, 2.1, 1.4], k: 0.12 }], fogCol: [0.74, 0.46, 0.28], fog: [6, 80], clear: [0.74, 0.46, 0.28], grade: [1.05, 0.95, 0.85, 0.1], vig: 0.5
    },
    door: {
      key: { dir: [0.6, -0.3, -0.7], col: [1.0, 0.72, 0.45] },
      ambTop: [0.2, 0.14, 0.1], ambBot: [0.1, 0.07, 0.05], warp: [0.6, 0.32, 0.22], rim: [0.9, 0.6, 0.35], rimPow: 2.6,
      points: [{ pos: [1.5, 1.4, 0.6], col: [1.6, 1.0, 0.5], k: 0.6 }], fogCol: [0.2, 0.13, 0.08], fog: [4, 30], clear: [0.24, 0.15, 0.09], grade: [1.05, 0.96, 0.86, 0.1], vig: 0.5
    },
    fire: {
      key: { dir: [0.0, -0.2, -1], col: [1.6, 0.9, 0.4] },
      ambTop: [0.1, 0.055, 0.04], ambBot: [0.08, 0.04, 0.03], warp: [0.65, 0.3, 0.15], rim: [1.0, 0.55, 0.22], rimPow: 2.4,
      points: [{ pos: [0, 2, 7], col: [2.4, 1.1, 0.3], k: 0.25 }, { pos: [-3, 1, -2], col: [1.2, 0.5, 0.15], k: 0.3 }], fogCol: [0.4, 0.18, 0.07], fog: [3, 50], clear: [0.3, 0.12, 0.05], grade: [1.08, 0.92, 0.78, 0.05], vig: 0.45
    },
    interior: {
      key: { dir: [0.3, -0.4, -0.8], col: [1.15, 0.82, 0.55] },
      ambTop: [0.2, 0.14, 0.12], ambBot: [0.15, 0.09, 0.06], warp: [0.65, 0.34, 0.2], rim: [1.3, 0.75, 0.32], rimPow: 2.2,
      points: [{ pos: [1, 1.2, 1], col: [2.6, 1.2, 0.35], k: 0.5 }, { pos: [-3, 1.5, -2], col: [2.0, 0.9, 0.25], k: 0.4 }], fogCol: [0.36, 0.16, 0.06], fog: [2, 22], clear: [0.3, 0.12, 0.05], grade: [1.08, 0.92, 0.78, 0.05], vig: 0.5
    },
    land: {
      key: { dir: [-0.35, -0.75, -0.5], col: [0.5, 0.48, 0.45] },
      ambTop: [0.6, 0.62, 0.68], ambBot: [0.4, 0.4, 0.42], warp: [0.82, 0.68, 0.7], rim: [0.45, 0.48, 0.55], rimPow: 2.6,
      points: [], fogCol: [0.7, 0.84, 0.95], fog: [70, 340], clear: [0.5, 0.74, 0.92], grade: [1.0, 1.0, 1.02, 0.0], vig: 0.12
    },
    vista: {
      key: { dir: [0.3, -0.5, -0.8], col: [0.55, 0.5, 0.56] },
      ambTop: [0.56, 0.52, 0.66], ambBot: [0.42, 0.36, 0.44], warp: [0.82, 0.66, 0.76], rim: [0.5, 0.45, 0.6], rimPow: 2.6,
      points: [], fogCol: [0.82, 0.74, 0.88], fog: [80, 360], clear: [0.7, 0.64, 0.84], grade: [1.0, 0.98, 1.02, 0.0], vig: 0.12
    },
    shedIn: {
      key: { dir: [0.5, -0.2, -0.85], col: [0.55, 0.4, 0.28] },
      ambTop: [0.07, 0.07, 0.09], ambBot: [0.04, 0.04, 0.05], warp: [0.6, 0.4, 0.34], rim: [0.6, 0.45, 0.3], rimPow: 2.6,
      points: [{ pos: [0.25, 1.6, 0.5], col: [0.7, 0.42, 0.22], k: 3.0 }], fogCol: [0.05, 0.04, 0.03], fog: [3, 12], clear: [0.05, 0.04, 0.03], grade: [1.02, 0.98, 0.94, 0.1], vig: 0.5
    },
    backlit: {
      key: { dir: [0.2, -0.3, 1], col: [1.1, 0.7, 0.4] },
      ambTop: [0.06, 0.04, 0.03], ambBot: [0.04, 0.03, 0.02], warp: [0.6, 0.3, 0.2], rim: [1.3, 0.7, 0.3], rimPow: 2.4,
      points: [{ pos: [0.3, 1.2, 0.6], col: [2.0, 0.9, 0.3], k: 0.5 }], fogCol: [0.3, 0.14, 0.06], fog: [4, 40], clear: [0.2, 0.1, 0.05], grade: [1.06, 0.94, 0.82, 0.05], vig: 0.5
    },
    lineup: {
      key: { dir: [-0.4, -0.6, -0.7], col: [1.0, 0.96, 0.9] },
      ambTop: [0.5, 0.5, 0.52], ambBot: [0.26, 0.24, 0.22], warp: [0.62, 0.4, 0.34], rim: [0.6, 0.6, 0.62], rimPow: 3,
      points: [], fogCol: [0.5, 0.5, 0.5], fog: [60, 120], clear: [0.45, 0.44, 0.42], grade: [1, 1, 1, 0.05], vig: 0.25
    }
  };

  window.MpyShots = {
    ID, DURATION, heavyV, scoutV, spyV, screamV, seg, spline, track, blinkAt, basisM, frameAt, axes, STAND_Y, standPose, walkPose, runPose, airPose, hand, pyroState, chestOf,
    GRIPS, gripOn, holding, hipFlamer, headPos, cam, orbit, shake, heavyBody, heavyState, scoutState, heavyFace, scoutFace, spyFace, screamJaw, soldierJaw, giggle, ENV
  };
})();
