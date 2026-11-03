(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Scout = window.MeetScout;
  const Heavy = window.MeetHeavy;
  const Voice = window.MscVoice;
  const FP = window.FabPose;

  const ID = 'M33tTh3Sc0t';
  const DURATION = 94.73;

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

  function lerpObj(a, b, k) {
    const out = {};
    new Set([...Object.keys(a), ...Object.keys(b)]).forEach(key => {
      const va = a[key] === undefined ? (FACE_REST[key] || 0) : a[key];
      const vb = b[key] === undefined ? (FACE_REST[key] || 0) : b[key];
      out[key] = Array.isArray(va) ? va.map((v, i) => lerp(v, vb[i], k)) : lerp(va, vb, k);
    });
    return out;
  }

  const FACE_REST = { lidU: 0.45, lidL: 0.35 };

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
    talk: { smileL: 0.2, smileR: 0.2, browUp: 0.2 },
    cocky: { smileL: 0.6, smileR: 0.35, browUp: 0.3, lidU: 0.55 },
    smirk: { smileL: 0.8, smileR: 0.15, browDown: 0.2, lidU: 0.5, sneer: 0.1 },
    grin: { smileL: 0.95, smileR: 0.9, wide: 0.35, browUp: 0.15, jaw: 0.08 },
    bigGrin: { smileL: 1, smileR: 1, wide: 0.7, browUp: 0.3, jaw: 0.14, lidL: 0.55 },
    sly: { smileL: 0.7, smileR: 0.3, browDown: 0.35, lidU: 0.42, sneer: 0.15 },
    huh: { browUp: 0.85, browInUp: 0.45, frown: 0.15, lidU: 0.8 },
    wideEye: { browUp: 1, browInUp: 0.3, lidU: 0.95, round: 0.2 },
    angry: { browDown: 0.95, sneer: 0.55, frown: 0.4, wide: 0.35, lidU: 0.45 },
    grit: { browDown: 0.75, sneer: 0.45, wide: 0.8, smileL: 0.35, smileR: 0.35, lidU: 0.35, jaw: 0.12 },
    pain: { browDown: 0.7, browInUp: 0.7, sneer: 0.6, wide: 0.85, lidU: 0.22, lidL: 0.6, jaw: 0.1 },
    laugh: { smileL: 1, smileR: 1, wide: 0.6, jaw: 0.55, lidU: 0.3, lidL: 0.65, browInUp: 0.3 },
    shout: { browUp: 0.5, wide: 0.55, jaw: 0.95, round: 0.15, lidU: 0.85 },
    yell: { browDown: 0.8, wide: 0.85, jaw: 0.55, sneer: 0.45, lidU: 0.5 },
    admire: { smileL: 0.55, smileR: 0.5, browUp: 0.55, browInUp: 0.45, lidU: 0.42 },
    pout: { frown: 0.5, browInUp: 0.3, round: 0.3, lidU: 0.55 },
    tight: { frown: 0.35, browDown: 0.3, sneer: 0.1, lidU: 0.5 },
    focus: { browDown: 0.5, smileL: 0.25, lidU: 0.5 }
  };

  const SCOUT_BLINKS = [12.7, 16.1, 36.0, 38.9, 41.5, 45.9, 50.0, 54.1, 58.3, 60.4, 64.0, 66.9, 70.7, 78.3, 80.2, 82.4, 84.1];

  function blinkAt(t, list) {
    let v = 0;
    list.forEach(b => {
      const d = Math.abs(t - b);
      if (d < 0.09) v = Math.max(v, 1 - d / 0.09);
    });
    return v;
  }

  function scoutFace(t, expr, extra) {
    const e = Object.assign({}, FACE_REST, expr || {});
    const v = clamp(jawV(t) * 0.95, 0, 1);
    const base = e.jaw || 0;
    const f = {
      browDown: e.browDown || 0, browUp: e.browUp || 0, browInUp: e.browInUp || 0, smileL: e.smileL || 0, smileR: e.smileR || 0,
      frown: e.frown || 0, wide: clamp((e.wide || 0) + wideV(t) * 0.35, 0, 1.2), round: clamp((e.round || 0) + rndV(t) * 0.8, 0, 1), sneer: e.sneer || 0,
      lidU: e.lidU, lidL: e.lidL, jaw: clamp(base + v * (0.8 - base * 0.4), 0, 1.15), blink: blinkAt(t, SCOUT_BLINKS), look: e.look || [0, 0]
    };
    return Object.assign(f, extra || {});
  }

  const HX = {
    calm: { browDown: 0.35, smile: 0.05, lidU: 0.55, lidL: 0.35 },
    chew: { browDown: 0.1, browInUp: 0.2, smile: 0.35, lidU: 0.3, lidL: 0.55 },
    bite: { browUp: 0.3, wide: 0.5, jaw: 0.9, lidU: 0.5, lidL: 0.4 },
    surprise: { browUp: 0.9, browInUp: 0.3, wide: 0.3, jaw: 0.45, lidU: 0.85, lidL: 0.3 },
    angry: { browDown: 1, sneer: 0.4, wide: 0.6, jaw: 0.35, lidU: 0.45, lidL: 0.4 },
    roar: { browDown: 1, sneer: 0.5, wide: 0.75, jaw: 0.85, lidU: 0.5, lidL: 0.4 },
    choke: { browUp: 0.8, browInUp: 0.8, wide: 0.6, jaw: 0.75, lidU: 0.95, lidL: 0.2 },
    hurt: { browDown: 0.6, browInUp: 0.9, sneer: 0.3, wide: 0.6, jaw: 0.4, lidU: 0.2, lidL: 0.6 },
    smirk: { browDown: 0.3, smile: 0.6, wide: 0.3, lidU: 0.45, lidL: 0.45 },
    ko: { browInUp: 0.4, smile: 0.25, jaw: 0.35, lidU: 0.08, lidL: 0.5, blink: 0.85 }
  };

  function heavyFace(t, expr, extra) {
    const e = Object.assign({ lidU: 0.55, lidL: 0.35 }, expr || {});
    const v = clamp(heavyV(t) * 0.9, 0, 1);
    const f = {
      browDown: e.browDown || 0, browUp: e.browUp || 0, browInUp: e.browInUp || 0, smile: e.smile || 0, frown: e.frown || 0, wide: e.wide || 0,
      round: e.round || 0, sneer: e.sneer || 0, lidU: e.lidU, lidL: e.lidL, jaw: clamp((e.jaw || 0) + v * 0.5, 0, 1.15), blink: e.blink || 0, look: e.look || [0, 0]
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

  function alongM(o, along, hint) {
    const y = V3.norm(along);
    let x = V3.cross(y, hint || [0, 0, 1]);
    x = V3.len(x) < 1e-5 ? V3.norm(V3.cross(y, [1, 0, 0])) : V3.norm(x);
    return basisM(o, x, y, V3.cross(x, y));
  }

  function axes(yaw) {
    return { fwd: [S(yaw), 0, C(yaw)], side: [C(yaw), 0, -S(yaw)] };
  }

  const STAND_Y = 0.985;

  function standPose(o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at || [0, 0, 0];
    const drop = o.drop || 0;
    const p = o.p || [g[0] + (o.sway || 0) * side[0], (g[1] || 0) + STAND_Y - drop, g[2] + (o.sway || 0) * side[2]];
    const pose = { p, fwd, up: o.up || [0, 1, 0], sp: o.sp || [0.04, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.7, -0.5, -0.4], eR: o.eR || [-0.7, -0.5, -0.4] };
    const spread = o.spread === undefined ? 0.06 : o.spread;
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const lift = o['lift' + s] || 0;
      const fo = o['f' + s] || [0, 0];
      const f = V3.add(g, V3.add(V3.mul(side, k * (Scout.D.hipX + spread) + fo[0]), V3.mul(fwd, 0.03 + fo[1])));
      pose['f' + s + 'w'] = [f[0], (g[1] || 0) + 0.075 + lift, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.5 + side[0] * k * 0.25, 0.6 + lift, fwd[2] * 1.5 + side[2] * k * 0.25]);
    });
    return pose;
  }

  function crouchPose(o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at || [0, 0, 0];
    const depth = o.depth === undefined ? 0.45 : o.depth;
    const p = [g[0] + fwd[0] * (o.back || -0.05), (g[1] || 0) + lerp(STAND_Y, 0.42, depth), g[2] + fwd[2] * (o.back || -0.05)];
    const pose = { p, fwd, up: [0, 1, 0], sp: o.sp || [0.45 * depth + 0.1, 0, 0], nk: o.nk || [-0.3 * depth, 0, 0], eL: o.eL || [0.7, -0.3, 0.2], eR: o.eR || [-0.7, -0.3, 0.2] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const fo = o['f' + s] || [0, 0];
      const f = V3.add(g, V3.add(V3.mul(side, k * (0.17 + (o.spread || 0)) + fo[0]), V3.mul(fwd, (k > 0 ? 0.18 : -0.06) + fo[1])));
      pose['f' + s + 'w'] = [f[0], (g[1] || 0) + 0.075, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 2 + side[0] * k * 0.6, 1.0, fwd[2] * 2 + side[2] * k * 0.6]);
    });
    return pose;
  }

  function runPose(o) {
    const yaw = o.yaw || 0;
    const { fwd, side } = axes(yaw);
    const g = o.at;
    const ph = (o.phase || 0) * PI * 2;
    const amp = o.stride === undefined ? 0.42 : o.stride;
    const legLen = Scout.D.thigh + Scout.D.shin;
    const bob = Math.abs(S(ph)) * 0.06;
    const lean = o.lean === undefined ? 0.32 : o.lean;
    const p = [g[0], (g[1] || 0) + STAND_Y - 0.08 + bob + (o.y || 0), g[2]];
    const pose = { p, fwd, up: [0, 1, 0], sp: [lean, S(ph) * 0.18 + (o.twist || 0), 0], nk: o.nk || [-lean * 0.8, -S(ph) * 0.14, 0] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const sw = S(ph) * k;
      const lift = Math.max(0, C(ph) * k) * 0.3;
      pose['f' + s] = [k * (Scout.D.hipX + 0.02), -legLen + 0.08 + lift, sw * amp * legLen];
      pose['k' + s] = [k * 0.12, 0, 1];
    });
    pose.aL = -0.25 * S(ph);
    pose.aR = 0.25 * S(ph);
    pose.hL = o.hL || [Scout.D.shX + 0.05, -0.12, -S(ph) * 0.26 + 0.12];
    pose.hR = o.hR || [-(Scout.D.shX + 0.05), -0.12, S(ph) * 0.26 + 0.12];
    pose.eL = [0.5, -0.2, -0.8];
    pose.eR = [-0.5, -0.2, -0.8];
    return pose;
  }

  function airPose(o) {
    const legLen = Scout.D.thigh + Scout.D.shin;
    const tuck = o.tuck === undefined ? 0.5 : o.tuck;
    const pose = { p: o.p, fwd: V3.norm(o.fwd || [0, 0, 1]), up: V3.norm(o.up || [0, 1, 0]), sp: o.sp || [0.3, 0, 0], nk: o.nk || [-0.2, 0, 0] };
    pose.fL = [Scout.D.hipX + 0.04, -legLen * lerp(0.95, 0.45, tuck), lerp(0.1, 0.35, tuck)];
    pose.fR = [-(Scout.D.hipX + 0.04), -legLen * lerp(0.9, 0.7, tuck), lerp(-0.3, -0.25, tuck)];
    pose.kL = [0.1, 0, 1];
    pose.kR = [-0.1, 0, 1];
    pose.hL = o.hL || [Scout.D.shX + 0.2, 0.05, 0.1];
    pose.hR = o.hR || [-(Scout.D.shX + 0.15), -0.05, 0.25];
    pose.eL = [0.6, -0.3, -0.5];
    pose.eR = [-0.6, -0.3, -0.5];
    return pose;
  }

  function placeHead(pose, target) {
    const h = Scout.solve(pose).pts.head;
    const d = V3.sub(target, h);
    const out = Object.assign({}, pose, { p: V3.add(pose.p, d) });
    ['fLw', 'fRw', 'kLw', 'kRw'].forEach(k => { if (pose[k]) out[k] = V3.add(pose[k], k[0] === 'f' ? [d[0], 0, d[2]] : d); });
    return out;
  }

  function hand(target, fingers, palm, pose) {
    return { target, fingers: V3.norm(fingers), palm: V3.norm(palm), pose };
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
      hm[s] = { pose: h.pose, M: h.free ? null : Scout.handBasis(m.pts['wrist' + s], h.fingers, h.palm) };
    });
    return Object.assign({ pose: p, m, hands: hm }, extra || {});
  }

  function chestOf(pose) {
    return Scout.solve(pose).chest;
  }

  function local(M, p) {
    return M4.point(M, p);
  }

  function dirL(M, d) {
    return V3.norm(M4.dir(M, d));
  }

  const GEST = {
    down: { L: [[0.24, -0.33, 0.02], [0.05, -1, 0.1], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.24, -0.33, 0.02], [-0.05, -1, 0.1], [1, 0, 0.1], 'relax', [-0.6, -0.2, -0.6]] },
    loose: { L: [[0.26, -0.28, 0.1], [0.15, -1, 0.3], [-1, 0, 0.2], 'rest', [0.7, -0.2, -0.5]], R: [[-0.26, -0.28, 0.1], [-0.15, -1, 0.3], [1, 0, 0.2], 'rest', [-0.7, -0.2, -0.5]] },
    pray: { L: [[0.02, 0.32, 0.26], [-0.05, 1, 0.15], [-1, 0, 0], 'flat', [0.8, -0.6, 0]], R: [[-0.02, 0.32, 0.26], [0.05, 1, 0.15], [1, 0, 0], 'flat', [-0.8, -0.6, 0]] },
    prayUp: { L: [[0.02, 0.44, 0.24], [-0.05, 1, 0.1], [-1, 0, 0], 'flat', [0.8, -0.5, 0]], R: [[-0.02, 0.44, 0.24], [0.05, 1, 0.1], [1, 0, 0], 'flat', [-0.8, -0.5, 0]] },
    shrug: { L: [[0.4, 0.04, 0.24], [0.7, 0.1, 0.6], [0, 1, 0.1], 'open', [0.5, -1, -0.2]], R: [[-0.4, 0.04, 0.24], [-0.7, 0.1, 0.6], [0, 1, 0.1], 'open', [-0.5, -1, -0.2]] },
    shrugLow: { L: [[0.34, -0.12, 0.22], [0.6, -0.2, 0.7], [0, 1, 0.2], 'open', [0.5, -1, -0.2]], R: [[-0.34, -0.12, 0.22], [-0.6, -0.2, 0.7], [0, 1, 0.2], 'open', [-0.5, -1, -0.2]] },
    present: { L: [[0.28, 0.02, 0.3], [0.5, 0.1, 0.9], [-0.1, 1, 0.1], 'open', [0.45, -1, -0.2]], R: [[-0.12, 0.05, 0.32], [-0.2, 0.3, 1], [0.6, 0.4, -0.3], 'rest', [-0.4, -1, -0.1]] },
    explain: { L: [[0.16, 0.06, 0.32], [-0.2, 0.3, 1], [-0.6, 0.3, -0.2], 'claw', [0.35, -1, -0.2]], R: [[-0.16, 0.0, 0.32], [0.2, 0.3, 1], [0.6, 0.3, -0.2], 'claw', [-0.35, -1, -0.2]] },
    count: { L: [[0.24, -0.3, 0.06], [0.1, -1, 0.2], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.1, 0.16, 0.36], [0.1, 1, 0.3], [0, 0, 1], 'claw', [-0.4, -1, -0.1]] },
    pointMe: { L: [[0.24, -0.28, 0.06], [0.1, -1, 0.2], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.06, 0.2, 0.18], [0.9, 0.15, -0.4], [0, 0.2, 1], 'thumb', [-0.8, -0.6, 0.2]] },
    pointYou: { L: [[0.24, -0.28, 0.06], [0.1, -1, 0.2], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.14, 0.12, 0.44], [0.15, 0.1, 1], [0.2, -1, 0], 'point', [-0.8, -0.5, -0.1]] },
    pointYouL: { L: [[0.14, 0.12, 0.44], [-0.15, 0.1, 1], [-0.2, -1, 0], 'point', [0.8, -0.5, -0.1]], R: [[-0.24, -0.28, 0.06], [-0.1, -1, 0.2], [1, 0, 0.1], 'relax', [-0.6, -0.2, -0.6]] },
    temple: { L: [[0.24, -0.28, 0.06], [0.1, -1, 0.2], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.17, 0.62, 0.08], [0.2, 0.7, 0.4], [0.9, 0.0, -0.3], 'point', [-0.9, -0.2, 0.2]] },
    flex: { L: [[0.24, -0.3, 0.05], [0.1, -1, 0.2], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.3, 0.46, 0.06], [0.25, 1, 0.05], [0.4, 0, -1], 'fist', [-0.9, -0.15, -0.1]] },
    fists: { L: [[0.16, 0.2, 0.32], [0, 0.6, 0.8], [-1, 0, 0], 'fist', [0.4, -1, -0.2]], R: [[-0.16, 0.16, 0.3], [0, 0.6, 0.8], [1, 0, 0], 'fist', [-0.4, -1, -0.2]] },
    thumbs: { L: [[0.24, -0.28, 0.06], [0.1, -1, 0.2], [-1, 0, 0.1], 'relax', [0.6, -0.2, -0.6]], R: [[-0.14, 0.06, 0.32], [0.9, 0, 0.3], [0, 0.1, 1], 'thumb', [-0.8, -0.6, 0]] },
    reach: { L: [[0.16, 0.5, 0.32], [-0.05, 0.1, 1], [-0.1, -1, 0], 'point', [0.7, -0.5, -0.2]], R: [[-0.24, -0.26, 0.08], [-0.1, -1, 0.2], [1, 0, 0.1], 'relax', [-0.6, -0.2, -0.6]] },
    claws: { L: [[0.2, 0.12, 0.3], [0, 0.4, 1], [-0.7, 0, 0.2], 'claw', [0.35, -1, -0.2]], R: [[-0.2, 0.12, 0.3], [0, 0.4, 1], [0.7, 0, 0.2], 'claw', [-0.35, -1, -0.2]] },
    wide: { L: [[0.62, 0.36, 0.02], [1, 0.2, 0], [0, 0, 1], 'open', [0.6, -0.8, 0]], R: [[-0.62, 0.36, 0.02], [-1, 0.2, 0], [0, 0, 1], 'open', [-0.6, -0.8, 0]] },
    hips: { L: [[0.22, -0.12, -0.02], [-0.3, -0.6, 0.6], [-0.7, 0, -0.3], 'fist', [0.9, 0, -0.2]], R: [[-0.22, -0.12, -0.02], [0.3, -0.6, 0.6], [0.7, 0, -0.3], 'fist', [-0.9, 0, -0.2]] }
  };

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

  function withGesture(pose, chest, gest) {
    const p = Object.assign({}, pose);
    p.eL = gest.elbows.L;
    p.eR = gest.elbows.R;
    return scoutState(p, { L: gest.L, R: gest.R });
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
    } else if (o.legs === 'stand') {
      const base = o.p[1] - 1.02 + (o.drop || 0);
      [['L', 1], ['R', -1]].forEach(([s, k]) => {
        const fo = o['f' + s] || [0, 0];
        const f = V3.add(o.p, V3.add(V3.mul(side, k * (0.21 + (o.spread || 0)) + fo[0]), V3.mul(fwd, 0.04 + fo[1])));
        pose['f' + s + 'w'] = [f[0], base + 0.075 - (o.drop || 0), f[2]];
        pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.4 + side[0] * k * 0.3, base + 0.6, fwd[2] * 1.4 + side[2] * k * 0.3]);
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

  function gripHand(grip, reach) {
    const wrist = V3.sub(grip.pos, V3.mul(grip.fingers, reach === undefined ? 0.05 : reach));
    return hand(V3.sub(wrist, V3.mul(grip.palm, 0.02)), grip.fingers, grip.palm, grip.pose);
  }

  function blu(cls, pose, extra) {
    return Object.assign({ cls, team: 'blu', pose }, extra || {});
  }

  function red(cls, pose, extra) {
    return Object.assign({ cls, team: 'red', pose }, extra || {});
  }

  function runner(cls, team, from, to, t0, t1, t, opts) {
    const k = clamp((t - t0) / (t1 - t0), 0, 1);
    const p = V3.lerp(from, to, k);
    const d = V3.sub(to, from);
    const yaw = Math.atan2(d[0], d[2]);
    return { cls, team, pose: FP.run(cls, p[0], p[2], yaw, t * 1.8 + from[0] * 0.3, opts || {}) };
  }

  const ENV = {
    respawn: {
      key: { dir: [0.1, -0.35, -1], col: [0.25, 0.22, 0.2] },
      ambTop: [0.05, 0.045, 0.045], ambBot: [0.035, 0.03, 0.03], warp: [0.5, 0.3, 0.26], rim: [0.6, 0.6, 0.62], rimPow: 3,
      points: [{ pos: [0.2, 0.4, 0.6], col: [5.5, 5.2, 4.8], k: 2.4 }],
      fogCol: [0, 0, 0], fog: [500, 900], clear: [0, 0, 0], grade: [1, 1, 1, 0.05], vig: 0.35
    },
    outdoor: {
      key: { dir: [-0.35, -0.75, 0.55], col: [1.22, 1.16, 1.08] },
      ambTop: [0.62, 0.62, 0.66], ambBot: [0.38, 0.35, 0.33], warp: [0.62, 0.42, 0.36], rim: [0.55, 0.55, 0.6], rimPow: 3,
      points: [], fogCol: [0.8, 0.78, 0.76], fog: [40, 220], clear: [0.86, 0.85, 0.84], grade: [1.02, 1, 0.98, 0.12], vig: 0.2
    },
    glare: {
      key: { dir: [-0.2, -0.6, -0.75], col: [1.3, 1.25, 1.15] },
      ambTop: [0.75, 0.74, 0.76], ambBot: [0.5, 0.48, 0.46], warp: [0.62, 0.42, 0.36], rim: [0.9, 0.88, 0.85], rimPow: 2.5,
      points: [], fogCol: [0.95, 0.94, 0.92], fog: [8, 60], clear: [0.97, 0.96, 0.95], grade: [1.05, 1.04, 1.02, 0.1], vig: 0.15
    },
    yard: {
      key: { dir: [0.45, -0.7, 0.55], col: [1.15, 1.08, 1.0] },
      ambTop: [0.58, 0.58, 0.62], ambBot: [0.34, 0.32, 0.3], warp: [0.62, 0.42, 0.36], rim: [0.6, 0.6, 0.62], rimPow: 3,
      points: [], fogCol: [0.78, 0.77, 0.75], fog: [30, 160], clear: [0.84, 0.84, 0.84], grade: [1.0, 0.99, 0.98, 0.15], vig: 0.2
    },
    hall: {
      key: { dir: [0.3, -0.8, 0.5], col: [0.95, 0.9, 0.82] },
      ambTop: [0.5, 0.48, 0.46], ambBot: [0.28, 0.26, 0.24], warp: [0.62, 0.4, 0.34], rim: [0.55, 0.52, 0.5], rimPow: 3,
      points: [{ pos: [0, 5, -9], col: [0.9, 0.85, 0.75], k: 0.02 }], fogCol: [0.62, 0.6, 0.56], fog: [12, 70], clear: [0.6, 0.58, 0.55], grade: [1.0, 0.98, 0.96, 0.12], vig: 0.3
    },
    front: {
      key: { dir: [0.35, -0.25, -1], col: [1.35, 1.25, 1.12] },
      ambTop: [0.1, 0.08, 0.08], ambBot: [0.07, 0.05, 0.05], warp: [0.6, 0.34, 0.28], rim: [0.25, 0.22, 0.22], rimPow: 3,
      points: [{ pos: [0.6, 0.6, 1.8], col: [0.9, 0.85, 0.8], k: 0.4 }], fogCol: [0, 0, 0], fog: [3, 9], clear: [0, 0, 0], grade: [1.02, 1, 0.98, 0.05], vig: 0.35
    },
    dark: {
      key: { dir: [0.3, -0.8, 0.5], col: [0.32, 0.3, 0.28] },
      ambTop: [0.12, 0.11, 0.11], ambBot: [0.06, 0.055, 0.05], warp: [0.6, 0.4, 0.34], rim: [0.3, 0.3, 0.3], rimPow: 3,
      points: [], fogCol: [0.05, 0.05, 0.05], fog: [6, 30], clear: [0.03, 0.03, 0.03], grade: [1, 1, 1, 0.1], vig: 0.5
    },
    locker: {
      key: { dir: [-0.55, -0.45, -0.7], col: [1.15, 1.08, 1.0] },
      ambTop: [0.55, 0.55, 0.58], ambBot: [0.34, 0.32, 0.3], warp: [0.62, 0.4, 0.34], rim: [0.75, 0.75, 0.8], rimPow: 2.6,
      points: [{ pos: [2.5, 2.4, 3.0], col: [0.35, 0.33, 0.3], k: 0.05 }], fogCol: [0.9, 0.88, 0.86], fog: [20, 90], clear: [0.92, 0.9, 0.88], grade: [1.02, 1, 0.98, 0.06], vig: 0.25
    },
    lot: {
      key: { dir: [0.4, -0.65, 0.65], col: [1.12, 1.08, 1.02] },
      ambTop: [0.6, 0.62, 0.68], ambBot: [0.36, 0.35, 0.34], warp: [0.62, 0.42, 0.36], rim: [0.75, 0.76, 0.82], rimPow: 2.6,
      points: [], fogCol: [0.8, 0.8, 0.82], fog: [18, 120], clear: [0.86, 0.87, 0.9], grade: [1.0, 1.0, 1.0, 0.12], vig: 0.22
    }
  };

  window.MscShots = {
    ID, DURATION, jawV, heavyV, seg, spline, track, X, HX, scoutFace, heavyFace, blinkAt, basisM, frameAt, alongM, axes, standPose, crouchPose, runPose, airPose,
    hand, placeHead, scoutState, chestOf, local, dirL, GEST, gestureHands, gestureAt, withGesture, blendHand, heavyBody, heavyState, headPos, cam, orbit, shake,
    gripHand, blu, red, runner, ENV, STAND_Y
  };
})();
