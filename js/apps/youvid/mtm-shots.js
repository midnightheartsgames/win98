(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Medic = window.MeetMedic;
  const Heavy = window.MeetHeavy;
  const Scout = window.MeetScout;
  const Demo = window.MeetDemoman;
  const Voice = window.MedVoice;
  const Props = window.MedProps;

  const ID = 'M33tTh3M3d1';
  const DURATION = 249.17;

  const jawV = K.envelope(Voice.JAW, Voice.RATE);
  const rndV = K.envelope(Voice.ROUND, Voice.RATE);
  const wideV = K.envelope(Voice.WIDE, Voice.RATE);
  const heavyV = K.envelope(Voice.HEAVY, Voice.RATE);
  const scoutV = K.envelope(Voice.SCOUT, Voice.RATE);
  const demoV = K.envelope(Voice.DEMO, Voice.RATE);
  const spyV = K.envelope(Voice.SPY, Voice.RATE);

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

  function lerpObj(a, b, k, rest) {
    const out = {};
    new Set([...Object.keys(a), ...Object.keys(b)]).forEach(key => {
      const va = a[key] === undefined ? (rest[key] || 0) : a[key];
      const vb = b[key] === undefined ? (rest[key] || 0) : b[key];
      out[key] = Array.isArray(va) ? va.map((v, i) => lerp(v, vb[i], k)) : lerp(va, vb, k);
    });
    return out;
  }

  function track(keys, rest, dur) {
    return (t) => {
      let i = 0;
      while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
      const cur = keys[i][1];
      if (i === 0) return Object.assign({}, cur);
      const k = ease((t - keys[i][0]) / (keys[i][2] || dur || 0.25));
      return lerpObj(keys[i - 1][1], cur, k, rest || {});
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

  const MED_REST = { lidU: 0.62, lidL: 0.32 };

  const X = {
    calm: {},
    talk: { smileL: 0.25, smileR: 0.25, browUp: 0.15 },
    story: { smileL: 0.55, smileR: 0.5, browUp: 0.35, lidU: 0.5 },
    laugh: { smileL: 1, smileR: 1, wide: 0.6, jaw: 0.6, lidU: 0.25, lidL: 0.6, browInUp: 0.3 },
    grin: { smileL: 0.95, smileR: 0.95, wide: 0.55, browUp: 0.25, jaw: 0.1, lidL: 0.5 },
    mad: { smileL: 1, smileR: 0.9, wide: 0.85, browDown: 0.4, browInUp: 0.2, jaw: 0.14, lidU: 0.62, lidL: 0.3 },
    smug: { smileL: 0.7, smileR: 0.35, browDown: 0.25, lidU: 0.36, sneer: 0.1 },
    sly: { smileL: 0.85, smileR: 0.2, browDown: 0.45, lidU: 0.34, sneer: 0.2 },
    shock: { browUp: 0.9, browInUp: 0.5, wide: 0.5, jaw: 0.25, lidU: 0.9, lidL: 0.2 },
    alarm: { browUp: 1, browInUp: 0.6, wide: 0.75, jaw: 0.5, round: 0.3, lidU: 0.95, lidL: 0.15 },
    grimace: { browUp: 0.5, browInUp: 0.8, wide: 0.95, smileL: 0.3, smileR: 0.3, jaw: 0.08, lidU: 0.75, lidL: 0.4 },
    focus: { browDown: 0.55, lidU: 0.4, frown: 0.15 },
    stern: { browDown: 0.75, frown: 0.25, sneer: 0.1, lidU: 0.45 },
    gleeful: { smileL: 1, smileR: 1, wide: 0.4, browUp: 0.5, jaw: 0.3, lidU: 0.6 },
    tender: { smileL: 0.45, smileR: 0.45, browInUp: 0.4, lidU: 0.4 },
    worried: { browInUp: 0.8, frown: 0.35, lidU: 0.6, wide: 0.2 },
    disgust: { sneer: 0.8, browDown: 0.5, frown: 0.4, lidU: 0.4, wide: 0.3 },
    shout: { browUp: 0.6, wide: 0.6, jaw: 0.9, round: 0.2, lidU: 0.9 }
  };

  const MED_BLINKS = [24.6, 27.4, 31.9, 36.2, 39.0, 41.5, 46.2, 50.4, 53.0, 58.2, 61.1, 67.6, 69.3, 72.0, 81.2, 87.0, 93.9, 96.3, 98.9, 103.1, 105.0,
    106.9, 126.9, 129.9, 131.6, 144.8, 152.9, 155.0, 157.8, 181.9, 195.6, 213.1, 219.2, 220.6];

  function medicFace(t, expr, extra) {
    const e = Object.assign({}, MED_REST, expr || {});
    const v = clamp(jawV(t) * 0.95, 0, 1);
    const base = e.jaw || 0;
    const f = {
      browDown: e.browDown || 0, browUp: e.browUp || 0, browInUp: e.browInUp || 0, smileL: e.smileL || 0, smileR: e.smileR || 0,
      frown: e.frown || 0, wide: clamp((e.wide || 0) + wideV(t) * 0.35, 0, 1.2), round: clamp((e.round || 0) + rndV(t) * 0.8, 0, 1), sneer: e.sneer || 0,
      lidU: e.lidU, lidL: e.lidL, jaw: clamp(base + v * (0.85 - base * 0.4), 0, 1.15), blink: blinkAt(t, MED_BLINKS), look: e.look || [0, 0]
    };
    return Object.assign(f, extra || {});
  }

  const HX = {
    calm: { browDown: 0.2, smile: 0.1, lidU: 0.5, lidL: 0.35 },
    happy: { smile: 0.75, browUp: 0.2, lidU: 0.4, lidL: 0.55 },
    laugh: { smile: 1, wide: 0.5, jaw: 0.55, lidU: 0.25, lidL: 0.7, browInUp: 0.3 },
    worried: { browInUp: 0.9, browUp: 0.3, frown: 0.2, wide: 0.3, lidU: 0.75, lidL: 0.3 },
    grimace: { browInUp: 0.8, wide: 0.9, smile: 0.25, jaw: 0.08, lidU: 0.7, lidL: 0.4 },
    scared: { browUp: 0.9, browInUp: 0.6, wide: 0.6, jaw: 0.3, lidU: 0.95, lidL: 0.2 },
    scream: { browUp: 0.7, browInUp: 0.5, wide: 0.7, jaw: 1.0, lidU: 0.9, lidL: 0.2 },
    stern: { browDown: 0.9, sneer: 0.25, frown: 0.3, lidU: 0.5, lidL: 0.4 },
    roar: { browDown: 1, sneer: 0.5, wide: 0.75, jaw: 0.95, lidU: 0.55, lidL: 0.4 },
    grin: { smile: 0.95, wide: 0.6, browDown: 0.3, jaw: 0.08, lidU: 0.45, lidL: 0.5 },
    oh: { browUp: 0.9, round: 0.8, jaw: 0.55, lidU: 0.95, lidL: 0.2 },
    content: { smile: 0.5, browUp: 0.15, lidU: 0.35, lidL: 0.5 }
  };

  const HEAVY_BLINKS = [29.0, 33.5, 39.7, 44.6, 52.1, 60.5, 79.2, 89.9, 94.7, 104.6, 112.0, 121.2, 124.1, 147.2, 179.0, 190.0];

  function heavyFace(t, expr, extra) {
    const e = Object.assign({ lidU: 0.55, lidL: 0.35 }, expr || {});
    const v = clamp(heavyV(t) * 0.95, 0, 1);
    const f = {
      browDown: e.browDown || 0, browUp: e.browUp || 0, browInUp: e.browInUp || 0, smile: e.smile || 0, frown: e.frown || 0, wide: e.wide || 0,
      round: e.round || 0, sneer: e.sneer || 0, lidU: e.lidU, lidL: e.lidL, jaw: clamp((e.jaw || 0) + v * 0.6, 0, 1.15), blink: Math.max(e.blink || 0, blinkAt(t, HEAVY_BLINKS)), look: e.look || [0, 0]
    };
    return Object.assign(f, extra || {});
  }

  const SX = {
    yell: { browDown: 0.6, wide: 0.85, jaw: 0.5, sneer: 0.4, lidU: 0.7 },
    scream: { browUp: 0.8, browInUp: 0.6, wide: 0.9, jaw: 0.9, lidU: 0.95, lidL: 0.15 },
    dead: { browInUp: 0.3, jaw: 0.25, lidU: 0.12, lidL: 0.5, blink: 0.8 },
    grin: { smileL: 1, smileR: 0.95, wide: 0.7, browDown: 0.2, jaw: 0.12, lidU: 0.5, lidL: 0.55 },
    happy: { smileL: 0.9, smileR: 0.9, wide: 0.5, browUp: 0.4, jaw: 0.2, lidU: 0.6 },
    blissful: { smileL: 0.8, smileR: 0.8, browUp: 0.5, browInUp: 0.4, lidU: 0.2, lidL: 0.55 }
  };

  function scoutFace(t, expr, extra) {
    const e = Object.assign({ lidU: 0.45, lidL: 0.35 }, expr || {});
    const v = clamp(scoutV(t) * 0.95, 0, 1);
    const f = {
      browDown: e.browDown || 0, browUp: e.browUp || 0, browInUp: e.browInUp || 0, smileL: e.smileL || 0, smileR: e.smileR || 0, frown: e.frown || 0,
      wide: e.wide || 0, round: e.round || 0, sneer: e.sneer || 0, lidU: e.lidU, lidL: e.lidL, jaw: clamp((e.jaw || 0) + v * 0.7, 0, 1.15), blink: e.blink || 0, look: e.look || [0, 0]
    };
    return Object.assign(f, extra || {});
  }

  const DX = {
    charge: { browDown: 0.9, wide: 0.7, sneer: 0.4, jaw: 0.3, lidU: 0.75 },
    shout: { browDown: 0.6, wide: 0.8, jaw: 0.6, lidU: 0.85 },
    laugh: { smileL: 1, smileR: 1, wide: 0.7, jaw: 0.65, lidU: 0.35, lidL: 0.7 },
    hurt: { browDown: 0.7, wide: 0.6, press: 0.3, jaw: 0.25, lidU: 0.4 }
  };

  function demoFace(t, expr, extra) {
    const e = Object.assign({ lidU: 0.6, lidL: 0.35 }, expr || {});
    const v = clamp(demoV(t) * 0.95, 0, 1);
    const f = Object.assign({}, e, { jaw: clamp((e.jaw || 0) + v * 0.7, 0, 1.15) });
    return Object.assign(f, extra || {});
  }

  function spyJaw(t) {
    return clamp(spyV(t), 0, 1);
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

  const MED_STAND_Y = 1.03;

  function medStand(o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at || [0, 0, 0];
    const drop = o.drop || 0;
    const p = o.p || [g[0] + (o.sway || 0) * side[0], (g[1] || 0) + MED_STAND_Y - drop, g[2] + (o.sway || 0) * side[2]];
    const pose = { p, fwd, up: o.up || [0, 1, 0], sp: o.sp || [0.04, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.7, -0.5, -0.4], eR: o.eR || [-0.7, -0.5, -0.4] };
    const spread = o.spread === undefined ? 0.06 : o.spread;
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const lift = o['lift' + s] || 0;
      const fo = o['f' + s] || [0, 0];
      const f = V3.add(g, V3.add(V3.mul(side, k * (Medic.D.hipX + spread) + fo[0]), V3.mul(fwd, 0.03 + fo[1])));
      pose['f' + s + 'w'] = [f[0], (g[1] || 0) + 0.075 + lift, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.5 + side[0] * k * 0.2, 0.6 + lift, fwd[2] * 1.5 + side[2] * k * 0.2]);
    });
    return pose;
  }

  function medWalk(o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at;
    const ph = (o.phase || 0) * PI * 2;
    const amp = o.stride === undefined ? 0.3 : o.stride;
    const legLen = Medic.D.thigh + Medic.D.shin;
    const bob = Math.abs(S(ph)) * 0.035;
    const lean = o.lean === undefined ? 0.08 : o.lean;
    const p = [g[0], (g[1] || 0) + MED_STAND_Y - 0.03 + bob, g[2]];
    const pose = { p, fwd, up: [0, 1, 0], sp: [lean, S(ph) * 0.1, 0], nk: o.nk || [-lean * 0.5, -S(ph) * 0.06, 0] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const sw = S(ph) * k;
      const lift = Math.max(0, C(ph) * k) * 0.16;
      pose['f' + s] = [k * (Medic.D.hipX + 0.02), -legLen + 0.06 + lift, sw * amp * legLen];
      pose['k' + s] = [k * 0.1, 0, 1];
    });
    pose.hL = o.hL || [Medic.D.shX + 0.05, -0.2, -S(ph) * 0.16 + 0.06];
    pose.hR = o.hR || [-(Medic.D.shX + 0.05), -0.2, S(ph) * 0.16 + 0.06];
    pose.eL = [0.5, -0.2, -0.8];
    pose.eR = [-0.5, -0.2, -0.8];
    return pose;
  }

  function hand(target, fingers, palm, pose) {
    return { target, fingers: V3.norm(fingers), palm: V3.norm(palm), pose };
  }

  function gripHand(grip, reach) {
    const wrist = V3.sub(grip.pos, V3.mul(grip.fingers, reach === undefined ? 0.05 : reach));
    return hand(V3.sub(wrist, V3.mul(grip.palm, 0.02)), grip.fingers, grip.palm, grip.pose);
  }

  function makeState(Hero, pose, hands, extra) {
    const p = Object.assign({}, pose);
    if (hands && hands.L) p.hLw = hands.L.target;
    if (hands && hands.R) p.hRw = hands.R.target;
    const m = Hero.solve(p);
    const hm = {};
    ['L', 'R'].forEach(s => {
      const h = hands && hands[s];
      if (!h) return;
      hm[s] = { pose: h.pose, M: Hero.handBasis(m.pts['wrist' + s], h.fingers, h.palm) };
    });
    return Object.assign({ pose: p, m, hands: hm }, extra || {});
  }

  const medicState = (pose, hands, extra) => makeState(Medic, pose, hands, extra);
  const heavyState = (pose, hands, extra) => makeState(Heavy, pose, hands, extra);
  const scoutState = (pose, hands, extra) => makeState(Scout, pose, hands, extra);
  const demoState = (pose, hands, extra) => makeState(Demo, pose, hands, extra);
  const engState = (pose, hands, extra) => makeState(window.MeetEngineer, pose, hands, extra);

  function chestOf(Hero, pose) {
    return Hero.solve(pose).chest;
  }

  function local(M, p) {
    return M4.point(M, p);
  }

  function dirL(M, d) {
    return V3.norm(M4.dir(M, d));
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

  function shaken(c, t, amp, seed) {
    const w = shake(t, amp, seed);
    return Object.assign({}, c, { eye: V3.add(c.eye, w), at: V3.add(c.at, V3.mul(w, 0.6)) });
  }

  const BACK = 0.56;
  const BACK_DIR = [C(BACK), S(BACK), 0];
  const BACK_N = [-S(BACK), C(BACK), 0];

  function backPoint(s, off) {
    return V3.add(V3.add([0.178, 0.788, 0], V3.mul(BACK_DIR, s)), V3.mul(BACK_N, off || 0));
  }

  function heavyOnTable(o) {
    const opt = o || {};
    const p = V3.add(backPoint(-0.16, 0.23), [0, 0, 0]);
    const lift = opt.sit || 0;
    const up = V3.norm(V3.lerp(BACK_DIR, [0.35, 1, 0], lift));
    const fwd = V3.norm(V3.lerp(BACK_N, [1, -0.2, 0], lift));
    const pose = {
      p: V3.add(p, [lift * 0.1, lift * 0.05, 0]), up, fwd, sp: opt.sp || [0.02 + lift * 0.2, 0, 0], nk: opt.nk || [-0.32, 0.25, 0],
      eL: opt.eL || [0.9, -0.2, -0.6], eR: opt.eR || [-0.9, -0.2, -0.6]
    };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      pose['f' + s + 'w'] = [-0.88, 0.9, k * 0.2];
      pose['k' + s + 'w'] = [-0.5, 1.5, k * 0.32];
    });
    pose.hL = opt.hL || [0.42, -0.25, 0.12];
    pose.hR = opt.hR || [-0.42, -0.25, 0.12];
    return pose;
  }

  function legLen(D) {
    return D.thigh + D.shin;
  }

  function poseRun(D, o) {
    const yaw = o.yaw || 0;
    const { fwd } = axes(yaw);
    const ph = (o.phase || 0) * PI * 2;
    const L = legLen(D);
    const amp = o.stride === undefined ? 0.36 : o.stride;
    const bob = Math.abs(S(ph)) * 0.05;
    const lean = o.lean === undefined ? 0.3 : o.lean;
    const p = [o.at[0], (o.at[1] || 0) + L * 0.92 + 0.07 + bob - (o.drop || 0), o.at[2]];
    const pose = { p, fwd, up: o.up || [0, 1, 0], sp: [lean, S(ph) * 0.16 + (o.twist || 0), 0], nk: o.nk || [-lean * 0.8, -S(ph) * 0.1, 0] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const sw = S(ph) * k;
      const lift = Math.max(0, C(ph) * k) * 0.25;
      pose['f' + s] = [k * (D.hipX + 0.02), -L + 0.06 + lift, sw * amp * L];
      pose['k' + s] = [k * 0.12, 0, 1];
    });
    pose.hL = o.hL || [D.shX + 0.06, -0.12, -S(ph) * 0.26 + 0.12];
    pose.hR = o.hR || [-(D.shX + 0.06), -0.12, S(ph) * 0.26 + 0.12];
    pose.eL = o.eL || [0.5, -0.2, -0.8];
    pose.eR = o.eR || [-0.5, -0.2, -0.8];
    return pose;
  }

  function poseCrawl(D, o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at;
    const ph = (o.phase || 0) * PI * 2;
    const hipH = o.hipH === undefined ? 0.5 : o.hipH;
    const p = [g[0], (g[1] || 0) + hipH, g[2]];
    const up = V3.norm(V3.add(V3.mul(fwd, 0.9), [0, o.rise === undefined ? 0.45 : o.rise, 0]));
    const front = V3.norm(V3.add(V3.mul(fwd, -0.35), [0, -1, 0]));
    const pose = { p, fwd: front, up, sp: o.sp || [0.15, 0, 0], nk: o.nk || [-0.9, 0, 0] };
    const reach = D.chestY + D.shY;
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const step = S(ph + (k > 0 ? 0 : PI)) * 0.12;
      const hand = V3.add(V3.add(p, V3.mul(fwd, reach + 0.16 + step)), V3.mul(side, k * (D.shX + 0.04)));
      pose['h' + s + 'w'] = [hand[0], (g[1] || 0) + 0.06 + Math.max(0, C(ph + (k > 0 ? 0 : PI))) * 0.06, hand[2]];
      pose['e' + s] = [k * 0.6, -0.3, -0.5];
      const knee = V3.add(V3.add(p, V3.mul(fwd, -0.05 - step)), V3.mul(side, k * (D.hipX + 0.03)));
      const foot = V3.add(knee, V3.mul(fwd, -D.shin * 0.95));
      pose['f' + s + 'w'] = [foot[0], (g[1] || 0) + 0.12, foot[2]];
      pose['k' + s + 'w'] = [knee[0] + fwd[0] * 0.5, (g[1] || 0) - 0.6, knee[2] + fwd[2] * 0.5];
    });
    return pose;
  }

  function poseSupine(D, o) {
    const yaw = o.yaw || 0;
    const dir = [S(yaw), 0, C(yaw)];
    const side = [C(yaw), 0, -S(yaw)];
    const g = o.at;
    const p = [g[0], (g[1] || 0) + (o.h || 0.16), g[2]];
    const pose = { p, up: V3.norm([dir[0], o.tilt || 0.05, dir[2]]), fwd: [0, 1, 0], sp: o.sp || [0, 0, 0], nk: o.nk || [0.2, 0, 0] };
    const L = legLen(D);
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const f = V3.add(V3.add(p, V3.mul(dir, -L)), V3.mul(side, -k * (D.hipX + 0.1)));
      pose['f' + s + 'w'] = [f[0], (g[1] || 0) + 0.08, f[2]];
      pose['k' + s] = [k * 0.3, 0, 1];
    });
    pose.hL = o.hL || [D.shX + 0.25, -0.1, -0.05];
    pose.hR = o.hR || [-(D.shX + 0.25), -0.1, -0.05];
    return pose;
  }

  function poseAir(D, o) {
    const L = legLen(D);
    const tuck = o.tuck === undefined ? 0.5 : o.tuck;
    const pose = { p: o.p, fwd: V3.norm(o.fwd || [0, 0, 1]), up: V3.norm(o.up || [0, 1, 0]), sp: o.sp || [0.3, 0, 0], nk: o.nk || [-0.2, 0, 0] };
    pose.fL = o.fL || [D.hipX + 0.06, -L * lerp(0.95, 0.5, tuck), lerp(0.1, 0.35, tuck)];
    pose.fR = o.fR || [-(D.hipX + 0.06), -L * lerp(0.9, 0.65, tuck), lerp(-0.3, -0.2, tuck)];
    pose.kL = [0.1, 0, 1];
    pose.kR = [-0.1, 0, 1];
    pose.hL = o.hL || [D.shX + 0.25, 0.1, 0.1];
    pose.hR = o.hR || [-(D.shX + 0.2), -0.05, 0.25];
    pose.eL = [0.6, -0.3, -0.5];
    pose.eR = [-0.6, -0.3, -0.5];
    return pose;
  }

  function poseStand(D, o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at || [0, 0, 0];
    const L = legLen(D);
    const p = [g[0], (g[1] || 0) + L * 0.985 + 0.075 - (o.drop || 0), g[2]];
    const pose = { p, fwd, up: o.up || [0, 1, 0], sp: o.sp || [0.04, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.7, -0.5, -0.4], eR: o.eR || [-0.7, -0.5, -0.4] };
    const spread = o.spread === undefined ? 0.06 : o.spread;
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const fo = o['f' + s] || [0, 0];
      const f = V3.add(g, V3.add(V3.mul(side, k * (D.hipX + spread) + fo[0]), V3.mul(fwd, 0.03 + fo[1])));
      pose['f' + s + 'w'] = [f[0], (g[1] || 0) + 0.075, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.5 + side[0] * k * 0.2, 0.6, fwd[2] * 1.5 + side[2] * k * 0.2]);
    });
    if (o.hL) pose.hL = o.hL;
    if (o.hR) pose.hR = o.hR;
    return pose;
  }

  function poseSit(D, o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at || [0, 0, 0];
    const seat = o.seat === undefined ? 0.48 : o.seat;
    const p = [g[0], (g[1] || 0) + seat + 0.1, g[2]];
    const pose = { p, fwd, up: o.up || [0, 1, 0], sp: o.sp || [0.08, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.7, -0.4, -0.3], eR: o.eR || [-0.7, -0.4, -0.3] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const fo = o['f' + s] || [0, 0];
      const f = V3.add(g, V3.add(V3.mul(side, k * (D.hipX + 0.08) + fo[0]), V3.mul(fwd, D.thigh * 0.95 + fo[1])));
      pose['f' + s + 'w'] = [f[0], (g[1] || 0) + 0.075, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.2 + side[0] * k * 0.2, 1.0, fwd[2] * 1.2 + side[2] * k * 0.2]);
    });
    if (o.hL) pose.hL = o.hL;
    if (o.hR) pose.hR = o.hR;
    return pose;
  }

  const MED_SPOT = [0.1, 0, -0.52];

  const ENV = {
    lab: {
      key: { dir: [0.5, -0.7, -0.5], col: [0.95, 0.92, 0.86] },
      ambTop: [0.36, 0.4, 0.38], ambBot: [0.18, 0.2, 0.19], warp: [0.6, 0.38, 0.32], rim: [0.5, 0.58, 0.56], rimPow: 2.6,
      points: [{ pos: [0.3, 2.2, 0.2], col: [1.0, 0.96, 0.88], k: 0.45 }, { pos: [0, 1.9, -2.2], col: [0.12, 0.3, 0.36], k: 0.3 }],
      fogCol: [0.12, 0.14, 0.13], fog: [6, 16], clear: [0.1, 0.12, 0.11], grade: [1.0, 1.0, 0.98, 0.08], vig: 0.35
    },
    labDark: {
      key: { dir: [0.5, -0.7, -0.5], col: [0.5, 0.5, 0.48] },
      ambTop: [0.14, 0.17, 0.16], ambBot: [0.06, 0.07, 0.07], warp: [0.6, 0.38, 0.32], rim: [0.35, 0.42, 0.42], rimPow: 2.8,
      points: [{ pos: [0.3, 2.2, 0.2], col: [0.9, 0.86, 0.78], k: 0.9 }, { pos: [0, 1.9, -2.2], col: [0.1, 0.25, 0.3], k: 0.3 }],
      fogCol: [0.03, 0.04, 0.04], fog: [5, 14], clear: [0.02, 0.025, 0.025], grade: [1.0, 1.0, 1.0, 0.1], vig: 0.5
    },
    labRed: {
      key: { dir: [0.2, -1, 0.15], col: [0.5, 0.2, 0.18] },
      ambTop: [0.28, 0.1, 0.09], ambBot: [0.2, 0.05, 0.05], warp: [0.7, 0.2, 0.15], rim: [0.9, 0.3, 0.2], rimPow: 2.4,
      points: [{ pos: [0.3, 1.35, 0.2], col: [1.5, 0.32, 0.2], k: 1.6 }, { pos: [0.3, 2.2, 0.3], col: [0.5, 0.18, 0.13], k: 0.6 }],
      fogCol: [0.2, 0.04, 0.03], fog: [4, 12], clear: [0.16, 0.03, 0.02], grade: [1.08, 0.95, 0.92, 0.05], vig: 0.45
    },
    dusk: {
      key: { dir: [0.25, -0.35, 1], col: [0.95, 0.85, 0.62] },
      ambTop: [0.36, 0.36, 0.42], ambBot: [0.2, 0.18, 0.16], warp: [0.62, 0.42, 0.34], rim: [1.0, 0.86, 0.6], rimPow: 2.2,
      points: [], fogCol: [0.5, 0.46, 0.4], fog: [18, 120], clear: [0.4, 0.38, 0.36], grade: [1.02, 1.0, 0.95, 0.12], vig: 0.35
    },
    battle: {
      key: { dir: [-0.35, -0.6, -0.6], col: [1.05, 0.98, 0.88] },
      ambTop: [0.46, 0.46, 0.5], ambBot: [0.26, 0.24, 0.22], warp: [0.62, 0.42, 0.36], rim: [0.75, 0.68, 0.56], rimPow: 2.5,
      points: [], fogCol: [0.62, 0.58, 0.52], fog: [14, 110], clear: [0.6, 0.57, 0.52], grade: [1.02, 1.0, 0.96, 0.15], vig: 0.3
    },
    fog: {
      key: { dir: [0.3, -0.5, -0.8], col: [0.95, 0.96, 1.0] },
      ambTop: [0.55, 0.58, 0.62], ambBot: [0.3, 0.3, 0.32], warp: [0.6, 0.45, 0.4], rim: [0.9, 0.92, 1.0], rimPow: 2.2,
      points: [], fogCol: [0.56, 0.6, 0.66], fog: [3, 22], clear: [0.58, 0.62, 0.68], grade: [1.0, 1.0, 1.02, 0.12], vig: 0.45
    },
    grey: {
      key: { dir: [0.4, -0.5, -0.75], col: [1.0, 0.96, 0.9] },
      ambTop: [0.4, 0.4, 0.42], ambBot: [0.2, 0.2, 0.2], warp: [0.6, 0.4, 0.34], rim: [0.7, 0.7, 0.72], rimPow: 2.4,
      points: [], fogCol: [0.22, 0.22, 0.23], fog: [6, 30], clear: [0.24, 0.24, 0.25], grade: [1.0, 1.0, 1.0, 0.12], vig: 0.5
    },
    door: {
      key: { dir: [0.2, -0.6, -1], col: [0.5, 0.5, 0.52] },
      ambTop: [0.18, 0.18, 0.19], ambBot: [0.1, 0.1, 0.1], warp: [0.6, 0.4, 0.34], rim: [0.6, 0.6, 0.62], rimPow: 2.6,
      points: [{ pos: [0, 1.5, 1.5], col: [0.8, 0.8, 0.8], k: 0.6 }], fogCol: [0.05, 0.05, 0.05], fog: [6, 20], clear: [0.05, 0.05, 0.05], grade: [1, 1, 1, 0.12], vig: 0.55
    },
    hangar: {
      key: { dir: [0.6, -0.5, -0.5], col: [0.85, 0.8, 0.72] },
      ambTop: [0.3, 0.29, 0.28], ambBot: [0.16, 0.15, 0.14], warp: [0.62, 0.4, 0.34], rim: [0.7, 0.65, 0.55], rimPow: 2.5,
      points: [], fogCol: [0.36, 0.34, 0.32], fog: [10, 50], clear: [0.3, 0.29, 0.28], grade: [1.02, 1.0, 0.97, 0.12], vig: 0.4
    },
    sunset: {
      key: { dir: [0.0, -0.25, 1], col: [1.3, 0.95, 0.55] },
      ambTop: [0.42, 0.34, 0.28], ambBot: [0.18, 0.14, 0.12], warp: [0.7, 0.4, 0.3], rim: [1.4, 1.0, 0.55], rimPow: 2.0,
      points: [], fogCol: [0.72, 0.6, 0.42], fog: [10, 90], clear: [0.85, 0.7, 0.45], grade: [1.06, 1.0, 0.9, 0.1], vig: 0.4
    },
    waiting: {
      key: { dir: [0.3, -0.8, -0.4], col: [0.9, 0.88, 0.82] },
      ambTop: [0.38, 0.36, 0.34], ambBot: [0.2, 0.18, 0.17], warp: [0.62, 0.4, 0.34], rim: [0.55, 0.52, 0.5], rimPow: 2.6,
      points: [{ pos: [1.2, 2.6, -3.0], col: [0.6, 0.3, 0.2], k: 0.8 }], fogCol: [0.2, 0.19, 0.18], fog: [8, 22], clear: [0.2, 0.19, 0.18], grade: [1.02, 1.0, 0.97, 0.12], vig: 0.4
    }
  };

  window.MedShots = {
    ID, DURATION, jawV, heavyV, scoutV, demoV, spyJaw, seg, spline, track, X, HX, SX, DX, MED_REST, medicFace, heavyFace, scoutFace, demoFace, blinkAt,
    basisM, frameAt, axes, medStand, medWalk, hand, gripHand, medicState, heavyState, scoutState, demoState, engState, chestOf, local, dirL, headPos, cam, orbit, shake, shaken,
    BACK_DIR, BACK_N, backPoint, heavyOnTable, MED_SPOT, ENV, MED_STAND_Y, Props, poseRun, poseCrawl, poseSupine, poseAir, poseStand, poseSit
  };
})();
