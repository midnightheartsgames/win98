(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Spy = window.MeetSpy;
  const Scout = window.MeetScout;
  const Sol = window.MeetSoldier;
  const Heavy = window.MeetHeavy;
  const Eng = window.MeetEngineer;
  const Voice = window.MspVoice;

  const ID = 'M33tTh3Sp1y';
  const DURATION = 199.8;

  const spyV = K.envelope(Voice.JAW, Voice.RATE);
  const redV = K.envelope(Voice.RED, Voice.RATE);
  const rndV = K.envelope(Voice.ROUND, Voice.RATE);
  const wideV = K.envelope(Voice.WIDE, Voice.RATE);
  const solV = K.envelope(Voice.SOLDIER, Voice.RATE);
  const scoutV = K.envelope(Voice.SCOUT, Voice.RATE);
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

  const FACE_REST = { lidU: 0.45, lidL: 0.35 };

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
    calm: {},
    talk: { browUp: 0.15, smileL: 0.1, smileR: 0.1 },
    smug: { smileL: 0.55, smileR: 0.2, browDown: 0.25, lidU: 0.38, sneer: 0.1 },
    sly: { smileL: 0.7, smileR: 0.35, browDown: 0.35, lidU: 0.36, sneer: 0.15 },
    stern: { browDown: 0.55, frown: 0.25, lidU: 0.4 },
    cold: { browDown: 0.35, frown: 0.15, lidU: 0.32, lidL: 0.42 },
    scorn: { browDown: 0.45, sneer: 0.45, frown: 0.2, lidU: 0.34, smileL: 0.2 },
    raise: { browUp: 0.75, browInUp: 0.2, lidU: 0.6 },
    archL: { browUp: 0.4, browDown: 0.2, smileL: 0.35, lidU: 0.5 },
    angry: { browDown: 0.95, sneer: 0.5, frown: 0.35, wide: 0.3, lidU: 0.48 },
    alarm: { browUp: 0.7, browInUp: 0.6, lidU: 0.85, wide: 0.25, frown: 0.2 },
    shock: { browUp: 1, browInUp: 0.4, lidU: 1, wide: 0.5, jaw: 0.35, round: 0.2 },
    grin: { smileL: 0.9, smileR: 0.85, wide: 0.4, browUp: 0.15, jaw: 0.06 },
    puff: { round: 0.45, smileL: 0.2, lidU: 0.3, browDown: 0.15 }
  };

  const CX = {
    calm: {},
    talk: { smileL: 0.2, smileR: 0.2, browUp: 0.2 },
    cocky: { smileL: 0.6, smileR: 0.35, browUp: 0.3, lidU: 0.55 },
    smirk: { smileL: 0.8, smileR: 0.15, browDown: 0.2, lidU: 0.5, sneer: 0.1 },
    grin: { smileL: 0.95, smileR: 0.9, wide: 0.35, browUp: 0.15, jaw: 0.08 },
    sly: { smileL: 0.7, smileR: 0.3, browDown: 0.35, lidU: 0.42, sneer: 0.15 },
    huh: { browUp: 0.85, browInUp: 0.45, frown: 0.15, lidU: 0.8 },
    wideEye: { browUp: 1, browInUp: 0.3, lidU: 0.95, round: 0.2 },
    angry: { browDown: 0.95, sneer: 0.55, frown: 0.4, wide: 0.35, lidU: 0.45 },
    pain: { browDown: 0.7, browInUp: 0.7, sneer: 0.6, wide: 0.85, lidU: 0.22, lidL: 0.6, jaw: 0.1 },
    shout: { browUp: 0.5, wide: 0.55, jaw: 0.95, round: 0.15, lidU: 0.85 },
    yell: { browDown: 0.8, wide: 0.85, jaw: 0.55, sneer: 0.45, lidU: 0.5 },
    pout: { frown: 0.5, browInUp: 0.3, round: 0.3, lidU: 0.55 },
    tight: { frown: 0.35, browDown: 0.3, sneer: 0.1, lidU: 0.5 }
  };

  const SPY_BLINKS = [36.4, 40.9, 44.3, 46.8, 52.3, 57.6, 60.6, 63.2, 66.1, 70.9, 74.2, 80.4, 83.9, 86.8, 92.2, 94.8, 108.2, 123.6, 125.1, 137.4, 139.2];
  const RED_BLINKS = [173.3, 180.5, 184.1, 187.2, 190.2];

  function blinkAt(t, list) {
    let v = 0;
    list.forEach(b => {
      const d = Math.abs(t - b);
      if (d < 0.09) v = Math.max(v, 1 - d / 0.09);
    });
    return v;
  }

  function spyFace(t, expr, extra, red) {
    const e = Object.assign({}, FACE_REST, expr || {});
    const v = clamp((red ? redV(t) : spyV(t)) * 0.95, 0, 1);
    const base = e.jaw || 0;
    const f = {
      browDown: e.browDown || 0, browUp: e.browUp || 0, browInUp: e.browInUp || 0, smileL: e.smileL || 0, smileR: e.smileR || 0,
      frown: e.frown || 0, wide: clamp((e.wide || 0) + wideV(t) * 0.35, 0, 1.2), round: clamp((e.round || 0) + rndV(t) * 0.8, 0, 1), sneer: e.sneer || 0,
      lidU: e.lidU, lidL: e.lidL, jaw: clamp(base + v * (0.75 - base * 0.4), 0, 1.15), blink: blinkAt(t, red ? RED_BLINKS : SPY_BLINKS), look: e.look || [0, 0]
    };
    return Object.assign(f, extra || {});
  }

  const SCOUT_BLINKS = [12.9, 26.1, 39.9, 52.7, 55.4, 62.2, 68.4, 87.2, 145.7, 166.9];

  function scoutFace(t, expr, extra) {
    const e = Object.assign({}, FACE_REST, expr || {});
    const v = clamp(scoutV(t) * 0.95, 0, 1);
    const base = e.jaw || 0;
    const f = {
      browDown: e.browDown || 0, browUp: e.browUp || 0, browInUp: e.browInUp || 0, smileL: e.smileL || 0, smileR: e.smileR || 0,
      frown: e.frown || 0, wide: e.wide || 0, round: e.round || 0, sneer: e.sneer || 0,
      lidU: e.lidU, lidL: e.lidL, jaw: clamp(base + v * (0.8 - base * 0.4), 0, 1.15), blink: blinkAt(t, SCOUT_BLINKS), look: e.look || [0, 0]
    };
    return Object.assign(f, extra || {});
  }

  const SX = {
    calm: { smile: 0.1, wide: 0.1, sneer: 0.15, jaw: 0.04 },
    shout: { smile: 0.1, frown: 0.25, wide: 0.75, sneer: 0.6, lower: 0.5, jaw: 0.25 },
    yell: { frown: 0.3, wide: 0.95, sneer: 0.85, lower: 0.85, jaw: 0.85 },
    grin: { smile: 0.9, wide: 0.75, sneer: 0.6, lower: 0.35, jaw: 0.08 },
    laugh: { smile: 1, wide: 0.85, sneer: 0.6, lower: 0.55, jaw: 0.45 },
    proud: { smile: 0.3, wide: 0.45, sneer: 0.45, lower: 0.2, jaw: 0.06 },
    scowl: { frown: 0.55, wide: 0.25, sneer: 0.3, lower: 0.1 },
    smirk: { smile: 0.55, wide: 0.45, sneer: 0.45, lower: 0.15, jaw: 0.03 },
    grimace: { frown: 0.7, wide: 0.95, sneer: 0.9, lower: 0.65, jaw: 0.02 },
    pout: { frown: 0.35, round: 0.55 }
  };

  function soldierFace(t, expr) {
    const e = expr || {};
    const talk = clamp(solV(t), 0, 1);
    return {
      smile: e.smile || 0, frown: e.frown || 0, wide: clamp((e.wide || 0) + talk * 0.25, 0, 1.2), round: clamp((e.round || 0) + talk * 0.2, 0, 1), sneer: e.sneer || 0,
      lower: clamp((e.lower || 0) + talk * 0.2, 0, 1.2), jaw: clamp((e.jaw || 0) + talk * (0.8 - (e.jaw || 0) * 0.4), 0, 1.15)
    };
  }

  function heavyFace(t, expr) {
    const e = Object.assign({ lidU: 0.55, lidL: 0.35 }, expr || {});
    const v = clamp(heavyV(t) * 0.9, 0, 1);
    return Object.assign({}, e, { jaw: clamp((e.jaw || 0) + v * 0.6, 0, 1.15), blink: e.blink || 0, look: e.look || [0, 0] });
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

  const STAND = { spy: 0.985, scout: 0.985, soldier: 0.97, heavy: 0.98, engineer: 0.81, medic: 1.02, sniper: 1.04 };
  const HERO = { spy: Spy, scout: Scout, soldier: Sol, heavy: Heavy, engineer: Eng };

  function heroOf(who) {
    return HERO[who] || (who === 'medic' ? window.MeetMedic : who === 'sniper' ? window.MeetSniper : null);
  }

  function standPose(who, o) {
    const H = heroOf(who);
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at || [0, 0, 0];
    const drop = o.drop || 0;
    const p = o.p || [g[0] + (o.sway || 0) * side[0], (g[1] || 0) + STAND[who] - drop, g[2] + (o.sway || 0) * side[2]];
    const pose = { p, fwd, up: o.up || [0, 1, 0], sp: o.sp || [0.04, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.7, -0.5, -0.4], eR: o.eR || [-0.7, -0.5, -0.4] };
    const spread = o.spread === undefined ? 0.06 : o.spread;
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const lift = o['lift' + s] || 0;
      const fo = o['f' + s] || [0, 0];
      const f = V3.add(g, V3.add(V3.mul(side, k * (H.D.hipX + spread) + fo[0]), V3.mul(fwd, 0.03 + fo[1])));
      pose['f' + s + 'w'] = [f[0], (g[1] || 0) + 0.075 + lift, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.5 + side[0] * k * 0.25, 0.6 + lift, fwd[2] * 1.5 + side[2] * k * 0.25]);
    });
    if (o.hL) pose.hL = o.hL;
    if (o.hR) pose.hR = o.hR;
    return pose;
  }

  function walkPose(who, o) {
    const H = heroOf(who);
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at;
    const ph = (o.phase || 0) * PI * 2;
    const stride = o.stride === undefined ? 0.28 : o.stride;
    const bob = Math.abs(C(ph)) * 0.02;
    const pose = { p: [g[0], (g[1] || 0) + STAND[who] - 0.02 + bob, g[2]], fwd, up: [0, 1, 0], sp: o.sp || [0.08, S(ph) * 0.08, 0], nk: o.nk || [-0.04, -S(ph) * 0.06, 0] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const sw = S(ph) * k;
      const lift = Math.max(0, C(ph) * k) * 0.09;
      const f = V3.add(g, V3.add(V3.mul(side, k * (H.D.hipX + 0.03)), V3.mul(fwd, sw * stride)));
      pose['f' + s + 'w'] = [f[0], (g[1] || 0) + 0.075 + lift, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.5 + side[0] * k * 0.2, 0.6, fwd[2] * 1.5 + side[2] * k * 0.2]);
    });
    pose.hL = o.hL || [H.D.shX + 0.08, -0.24, -S(ph) * 0.14 + 0.02];
    pose.hR = o.hR || [-(H.D.shX + 0.08), -0.24, S(ph) * 0.14 + 0.02];
    pose.eL = [0.6, -0.3, -0.7];
    pose.eR = [-0.6, -0.3, -0.7];
    return pose;
  }

  function runPose(who, o) {
    const H = heroOf(who);
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at;
    const ph = (o.phase || 0) * PI * 2;
    const amp = o.stride === undefined ? 0.42 : o.stride;
    const legLen = H.D.thigh + H.D.shin;
    const bob = Math.abs(S(ph)) * 0.06;
    const lean = o.lean === undefined ? 0.3 : o.lean;
    const p = [g[0], (g[1] || 0) + STAND[who] - 0.08 + bob + (o.y || 0), g[2]];
    const pose = { p, fwd, up: [0, 1, 0], sp: [lean, S(ph) * 0.18 + (o.twist || 0), 0], nk: o.nk || [-lean * 0.8, -S(ph) * 0.14, 0] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const sw = S(ph) * k;
      const lift = Math.max(0, C(ph) * k) * 0.3;
      pose['f' + s] = [k * (H.D.hipX + 0.02), -legLen + 0.08 + lift, sw * amp * legLen];
      pose['k' + s] = [k * 0.12, 0, 1];
    });
    pose.aL = -0.25 * S(ph);
    pose.aR = 0.25 * S(ph);
    pose.hL = o.hL || [H.D.shX + 0.05, -0.12, -S(ph) * 0.26 + 0.12];
    pose.hR = o.hR || [-(H.D.shX + 0.05), -0.12, S(ph) * 0.26 + 0.12];
    pose.eL = [0.5, -0.2, -0.8];
    pose.eR = [-0.5, -0.2, -0.8];
    return pose;
  }

  function hand(target, fingers, palm, pose) {
    return { target, fingers: V3.norm(fingers), palm: V3.norm(palm), pose };
  }

  function gripHand(g, reach, lift) {
    const wrist = V3.sub(g.pos, V3.mul(g.fingers, reach === undefined ? 0.05 : reach));
    return hand(V3.sub(wrist, V3.mul(g.palm, lift === undefined ? 0.02 : lift)), g.fingers, g.palm, g.pose);
  }

  function stairY(z) {
    return clamp(3.0 - z * (3.0 / 4.5), 0, 3.0);
  }

  function stateOf(who, pose, hands, extra) {
    const H = heroOf(who);
    const p = Object.assign({}, pose);
    if (hands && hands.L) p.hLw = hands.L.target;
    if (hands && hands.R) p.hRw = hands.R.target;
    const m = H.solve(p);
    const hm = {};
    ['L', 'R'].forEach(s => {
      const h = hands && hands[s];
      if (!h) return;
      hm[s] = { pose: h.pose, M: h.free ? null : H.handBasis(m.pts['wrist' + s], h.fingers, h.palm) };
    });
    return Object.assign({ pose: p, m, hands: hm }, extra || {});
  }

  function chestOf(who, pose) {
    return heroOf(who).solve(pose).chest;
  }

  function guestFace(expr) {
    return Object.assign({ lidU: 0.45, lidL: 0.35, jaw: 0, blink: 0, look: [0, 0] }, expr || {});
  }

  function placeHead(who, pose, target) {
    const h = heroOf(who).solve(pose).pts.head;
    const d = V3.sub(target, h);
    const out = Object.assign({}, pose, { p: V3.add(pose.p, d) });
    ['fLw', 'fRw', 'kLw', 'kRw', 'hLw', 'hRw'].forEach(k => { if (pose[k]) out[k] = V3.add(pose[k], k[0] === 'f' ? [d[0], 0, d[2]] : d); });
    return out;
  }

  const GEST = {
    down: { L: [[0.27, -0.36, 0.02], [0.05, -1, 0.1], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.27, -0.36, 0.02], [-0.05, -1, 0.1], [1, 0, 0.1], 'relax', [-0.6, -0.2, -0.6]] },
    loose: { L: [[0.28, -0.3, 0.1], [0.15, -1, 0.3], [-1, 0, 0.2], 'rest', [0.7, -0.2, -0.5]], R: [[-0.28, -0.3, 0.1], [-0.15, -1, 0.3], [1, 0, 0.2], 'rest', [-0.7, -0.2, -0.5]] },
    back: { L: [[0.12, -0.2, -0.2], [-0.3, -0.5, -0.3], [0, 0, -1], 'rest', [0.6, -0.4, -0.7]], R: [[-0.12, -0.2, -0.2], [0.3, -0.5, -0.3], [0, 0, -1], 'rest', [-0.6, -0.4, -0.7]] },
    explain: { L: [[0.16, 0.06, 0.34], [-0.2, 0.3, 1], [-0.6, 0.3, -0.2], 'claw', [0.35, -1, -0.2]], R: [[-0.27, -0.33, 0.04], [-0.05, -1, 0.1], [1, 0, 0.1], 'relax', [-0.6, -0.2, -0.6]] },
    present: { L: [[0.3, 0.02, 0.32], [0.5, 0.1, 0.9], [-0.1, 1, 0.1], 'open', [0.45, -1, -0.2]], R: [[-0.27, -0.33, 0.04], [-0.05, -1, 0.1], [1, 0, 0.1], 'relax', [-0.6, -0.2, -0.6]] },
    pointYou: { L: [[0.27, -0.3, 0.06], [0.1, -1, 0.2], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.14, 0.14, 0.46], [0.15, 0.1, 1], [0.2, -1, 0], 'point', [-0.8, -0.5, -0.1]] },
    raiseFinger: { L: [[0.27, -0.3, 0.06], [0.1, -1, 0.2], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.12, 0.42, 0.3], [0.05, 1, 0.2], [0, 0, 1], 'point', [-0.8, -0.6, 0]] },
    chest: { L: [[0.06, 0.24, 0.2], [-0.8, 0.3, 0.2], [0, 0, -1], 'flat', [0.8, -0.6, 0.1]], R: [[-0.27, -0.33, 0.04], [-0.05, -1, 0.1], [1, 0, 0.1], 'relax', [-0.6, -0.2, -0.6]] },
    shrug: { L: [[0.4, 0.04, 0.24], [0.7, 0.1, 0.6], [0, 1, 0.1], 'open', [0.5, -1, -0.2]], R: [[-0.4, 0.04, 0.24], [-0.7, 0.1, 0.6], [0, 1, 0.1], 'open', [-0.5, -1, -0.2]] },
    hips: { L: [[0.24, -0.12, -0.02], [-0.3, -0.6, 0.6], [-0.7, 0, -0.3], 'fist', [0.9, 0, -0.2]], R: [[-0.24, -0.12, -0.02], [0.3, -0.6, 0.6], [0.7, 0, -0.3], 'fist', [-0.9, 0, -0.2]] },
    fists: { L: [[0.16, 0.2, 0.32], [0, 0.6, 0.8], [-1, 0, 0], 'fist', [0.4, -1, -0.2]], R: [[-0.16, 0.16, 0.3], [0, 0.6, 0.8], [1, 0, 0], 'fist', [-0.4, -1, -0.2]] },
    reach: { L: [[0.16, 0.3, 0.42], [-0.05, 0.1, 1], [-0.1, -1, 0], 'open', [0.7, -0.5, -0.2]], R: [[-0.24, -0.26, 0.08], [-0.1, -1, 0.2], [1, 0, 0.1], 'relax', [-0.6, -0.2, -0.6]] },
    smoke: { L: [[0.27, -0.33, 0.04], [0.05, -1, 0.1], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.06, 0.22, 0.3], [0.35, 0.85, 0.3], [0.3, -0.1, 1], 'cig', [-0.75, -0.6, 0]] },
    smokeTalk: { L: [[0.16, 0.06, 0.34], [-0.2, 0.3, 1], [-0.6, 0.3, -0.2], 'claw', [0.35, -1, -0.2]], R: [[-0.08, 0.2, 0.32], [0.35, 0.85, 0.3], [0.3, -0.1, 1], 'cig', [-0.75, -0.6, 0]] },
    smokePoint: { L: [[0.27, -0.33, 0.04], [0.05, -1, 0.1], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.12, 0.16, 0.46], [0.15, 0.2, 1], [0.2, -1, 0], 'cig', [-0.8, -0.5, -0.1]] }
  };

  function local(M, p) {
    return M4.point(M, p);
  }

  function dirL(M, d) {
    return V3.norm(M4.dir(M, d));
  }

  function gestureHands(chest, name) {
    const G = GEST[name];
    const out = { elbows: {} };
    ['L', 'R'].forEach(s => {
      const [at, fingers, palm, pose, elbow] = G[s];
      const tip = local(chest, at);
      const f = dirL(chest, fingers);
      out[s] = hand(V3.sub(tip, V3.mul(f, 0.075)), f, dirL(chest, palm), pose);
      out.elbows[s] = elbow;
    });
    return out;
  }

  function blendHand(a, b, k) {
    if (k <= 0) return a;
    if (k >= 1) return b;
    return { target: V3.lerp(a.target, b.target, k), fingers: V3.norm(V3.lerp(a.fingers, b.fingers, k)), palm: V3.norm(V3.lerp(a.palm, b.palm, k)), pose: k < 0.5 ? a.pose : b.pose };
  }

  function gestureAt(chest, keys, t, dur) {
    let i = 0;
    while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
    const cur = gestureHands(chest, keys[i][1]);
    if (i === 0) return cur;
    const k = ease((t - keys[i][0]) / (keys[i][2] || dur || 0.3));
    if (k >= 1) return cur;
    const prev = gestureHands(chest, keys[i - 1][1]);
    const out = { elbows: {} };
    ['L', 'R'].forEach(s => {
      out[s] = blendHand(prev[s], cur[s], k);
      out.elbows[s] = V3.lerp(prev.elbows[s], cur.elbows[s], k);
    });
    return out;
  }

  function withGesture(who, pose, chest, gest, extra) {
    const p = Object.assign({}, pose);
    p.eL = gest.elbows.L;
    p.eR = gest.elbows.R;
    return stateOf(who, p, { L: gest.L, R: gest.R }, extra);
  }

  function cigInHand(st, side) {
    const hm = st.hands[side || 'R'];
    const M = hm && hm.M ? hm.M : st.m['hand' + (side || 'R')];
    return M4.chain(M, M4.translate(0.004, -0.085, 0.01), M4.rotX(-PI / 2 - 0.2), M4.translate(0, 0, -0.03));
  }

  function cigFx(st, side) {
    const M = cigInHand(st, side);
    const tip = M4.point(M, [0, 0, 0.075]);
    return { props: [{ kind: 'cig', M }], glows: [{ p: tip, s: 0.035, a: 0.9, tint: [1, 0.5, 0.2] }], smoke: [{ p: tip, n: 6, a: 0.35, rise: 0.45 }] };
  }

  function headPos(st, off) {
    return M4.point(st.m.head, off || [0, 0, 0]);
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

  function blu(cls, pose, extra) {
    return Object.assign({ cls, team: 'blu', pose }, extra || {});
  }

  function red(cls, pose, extra) {
    return Object.assign({ cls, team: 'red', pose }, extra || {});
  }

  const ENV = {
    room: {
      key: { dir: [0.25, -1, -0.35], col: [0.95, 0.92, 0.85] },
      ambTop: [0.24, 0.26, 0.3], ambBot: [0.1, 0.1, 0.11], warp: [0.6, 0.38, 0.32], rim: [0.45, 0.5, 0.6], rimPow: 3,
      points: [{ pos: [4, 2.4, 0.6], col: [0.65, 0.6, 0.52], k: 0.3 }, { pos: [4, 2.2, 2.6], col: [0.45, 0.42, 0.36], k: 0.4 }], fogCol: [0.05, 0.06, 0.07], fog: [12, 40], clear: [0.04, 0.045, 0.05], grade: [1, 1, 1, 0], vig: 0.35
    },
    map: {
      key: { dir: [0.1, -1, 0.2], col: [0.8, 0.78, 0.72] },
      ambTop: [0.18, 0.2, 0.24], ambBot: [0.06, 0.06, 0.07], warp: [0.6, 0.36, 0.3], rim: [0.5, 0.55, 0.65], rimPow: 3,
      points: [{ pos: [3.2, 2.2, 2.6], col: [0.8, 0.74, 0.62], k: 0.5 }, { pos: [4.8, 2.2, 2.6], col: [0.6, 0.55, 0.48], k: 0.5 }], fogCol: [0.03, 0.035, 0.04], fog: [10, 30], clear: [0.02, 0.025, 0.03], grade: [1, 1, 1, 0], vig: 0.45
    },
    hall: {
      key: { dir: [0.35, -1, 0.25], col: [0.95, 0.94, 0.9] },
      ambTop: [0.46, 0.47, 0.48], ambBot: [0.2, 0.21, 0.22], warp: [0.6, 0.42, 0.36], rim: [0.45, 0.55, 0.7], rimPow: 3,
      points: [], fogCol: [0.2, 0.22, 0.24], fog: [14, 40], clear: [0.12, 0.14, 0.16], grade: [1, 1, 1, 0], vig: 0.3
    },
    alarm: {
      key: { dir: [0.3, -0.6, -1], col: [0.75, 0.82, 0.9] },
      ambTop: [0.3, 0.34, 0.4], ambBot: [0.12, 0.13, 0.16], warp: [0.55, 0.45, 0.45], rim: [0.4, 0.55, 0.8], rimPow: 3,
      points: [], fogCol: [0.04, 0.05, 0.07], fog: [10, 50], clear: [0.03, 0.04, 0.05], grade: [1, 1, 1, 0], vig: 0.35
    },
    stairs: {
      key: { dir: [-0.5, -0.8, 0.4], col: [0.8, 0.82, 0.84] },
      ambTop: [0.4, 0.42, 0.46], ambBot: [0.14, 0.15, 0.17], warp: [0.6, 0.42, 0.36], rim: [0.4, 0.55, 0.8], rimPow: 3,
      points: [{ pos: [-0.2, 4.7, -1.1], col: [0.85, 0.84, 0.8], k: 0.6 }], fogCol: [0.06, 0.07, 0.09], fog: [8, 30], clear: [0.05, 0.06, 0.08], grade: [1, 1, 1, 0], vig: 0.35
    },
    sentry: {
      key: { dir: [0.1, -1, 0.15], col: [0.75, 0.72, 0.66] },
      ambTop: [0.16, 0.17, 0.19], ambBot: [0.06, 0.06, 0.07], warp: [0.6, 0.4, 0.34], rim: [0.45, 0.48, 0.55], rimPow: 3,
      points: [{ pos: [0, 2.9, -0.4], col: [0.9, 0.85, 0.72], k: 0.4 }, { pos: [-3.6, 1.2, -3.6], col: [0.7, 0.62, 0.5], k: 0.6 }], fogCol: [0.16, 0.16, 0.17], fog: [3, 22], clear: [0.05, 0.05, 0.06], grade: [1, 1, 1, 0.15], vig: 0.5
    },
    hut: {
      key: { dir: [0.5, -0.5, 0.7], col: [1.0, 0.86, 0.66] },
      ambTop: [0.3, 0.22, 0.16], ambBot: [0.12, 0.08, 0.05], warp: [0.7, 0.42, 0.28], rim: [0.7, 0.55, 0.38], rimPow: 3,
      points: [{ pos: [-1.1, 1.5, -2.2], col: [0.9, 0.7, 0.45], k: 0.5 }], fogCol: [0.25, 0.17, 0.1], fog: [2, 14], clear: [0.12, 0.08, 0.05], grade: [1.08, 0.88, 0.66, 0.55], vig: 0.55
    },
    medic: {
      key: { dir: [0.1, -1, 0.2], col: [0.8, 0.82, 0.8] },
      ambTop: [0.2, 0.23, 0.24], ambBot: [0.07, 0.08, 0.08], warp: [0.6, 0.42, 0.36], rim: [0.45, 0.55, 0.6], rimPow: 3,
      points: [{ pos: [0, 2.8, 0], col: [0.75, 0.75, 0.7], k: 0.4 }], fogCol: [0.08, 0.1, 0.1], fog: [4, 20], clear: [0.04, 0.05, 0.05], grade: [1, 1, 1, 0.1], vig: 0.5
    }
  };

  function flicker(env, t, rate, depth, tint) {
    const on = (Math.floor(t * (rate || 4)) % 2) === 0;
    const k = on ? 1 : 1 - (depth === undefined ? 0.4 : depth);
    const tn = on && tint ? tint : [1, 1, 1];
    return Object.assign({}, env, { key: { dir: env.key.dir, col: env.key.col.map((v, i) => v * k * tn[i]) }, ambTop: env.ambTop.map((v, i) => v * (0.7 + 0.3 * k) * tn[i]) });
  }

  window.MspShots = {
    ID, DURATION, X, SX, CX, seg, heroOf, guestFace, spline, track, spyFace, scoutFace, soldierFace, heavyFace, blinkAt, frameAt, basisM, axes, STAND, HERO,
    standPose, walkPose, runPose, hand, gripHand, stairY, cigInHand, cigFx, stateOf, chestOf, placeHead, GEST, gestureAt, withGesture, headPos, cam, orbit, shake, blu, red, ENV, flicker,
    spyV, redV, solV, scoutV, heavyV
  };
})();
