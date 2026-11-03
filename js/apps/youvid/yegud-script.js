(function () {
  const { V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;

  const ID = 'YeGuDNa1s98';
  const DURATION = 12.95;
  const CUT = 4.94;
  const CUTS = [0, CUT];
  const FOV = 20;
  const WIDE = 2.35;
  const P_Y = 0.97;
  const EYE_UP = 0.768;

  const BEAT = K.envelope('id931754OZjiOtutttXWuqBxCvk7943954MZrnItAnghZIDxqCAqg8a21a74QZipNFCytuZOFxDHxCk8653whbJFutBxyjdjZMquBKMTyjCHATCcuEwQPwhBAtZIlwLFYYlcGCnYydrBzKYkdvqf54310010000000000010000009oa4321rsc775eAjcZBkuogJZleZDqidawpenDwtzAzXFjHJBAlnlYoaHEmHDyqjaiCquZAcsusxAxqMUILr8n0', 20);

  const STRIKES = [
    [-0.47, -0.0, 0.47, 0.95, 1.45, 1.94, 2.45, 2.94, 3.4, 3.94, 4.4, 4.87, 5.34],
    [4.88, 5.41, 5.94, 6.47, 6.94, 7.41, 7.88, 8.41, 8.88, 9.41, 9.88, 10.34, 10.88, 11.41, 11.95, 12.48, 12.95, 13.42]
  ];
  const FIRST_LEFT = [true, true];

  const HEAD1 = [[-0.6, -0.62], [0.0, -0.54], [0.6, -0.324], [1.2, -0.162], [1.6, -0.081], [2.2, -0.027], [2.8, 0.0], [CUT + 0.6, 0.0]];
  const SPEED = 1.279;
  const END1 = [0.0, -0.88];
  const HEAD2 = [[CUT - 0.6, 0.0], [10.0, 0.0], [11.0, -0.06], [11.9, -0.12], [12.4, -0.38], [DURATION, -1.0], [DURATION + 0.6, -1.2]];
  const SPEED2 = 1.22;
  const START2 = [0.0, 0.4];

  const CAM1 = [
    [0.0, 0.046, 0.116, 2.02],
    [0.5, 0.023, 0.103, 1.78],
    [1.0, -0.005, 0.083, 1.54],
    [1.5, 0.076, 0.066, 1.4],
    [2.0, 0.084, 0.055, 1.36],
    [2.5, 0.077, 0.069, 1.36],
    [3.0, 0.037, 0.079, 1.38],
    [3.5, 0.056, 0.073, 1.4],
    [4.0, 0.03, 0.052, 1.4],
    [4.5, 0.059, 0.045, 1.36],
    [4.94, 0.055, 0.045, 1.33]
  ];
  const CAM2 = [
    [CUT, -0.02, 0.13, 1.37],
    [5.5, 0.012, 0.117, 1.43],
    [6.0, 0.005, 0.123, 1.75],
    [6.5, 0.066, 0.123, 1.93],
    [7.0, 0.091, 0.13, 1.97],
    [7.5, 0.126, 0.141, 1.96],
    [8.0, 0.134, 0.14, 1.88],
    [8.5, 0.118, 0.138, 1.9],
    [9.0, 0.04, 0.149, 1.95],
    [9.5, 0.011, 0.139, 1.85],
    [10.0, -0.023, 0.158, 1.98],
    [10.5, 0.005, 0.186, 2.24],
    [11.0, 0.049, 0.22, 2.44],
    [11.5, 0.24, 0.246, 2.65],
    [12.0, 0.42, 0.274, 2.86],
    [12.5, 0.48, 0.33, 3.19],
    [12.95, 0.42, 0.37, 3.42]
  ];
  const YAW2 = [[CUT, 0.0], [8.5, 0.0], [9.2, 0.09], [10.2, 0.13], [11.0, 0.2], [12.0, 0.27], [12.6, 0.3], [DURATION, 0.3]];

  function track(list, t) {
    if (t <= list[0][0]) return list[0].slice(1);
    for (let i = 1; i < list.length; i++) {
      if (t <= list[i][0]) {
        const a = list[i - 1], b = list[i];
        const k = (t - a[0]) / (b[0] - a[0]);
        const u = k * k * (3 - 2 * k);
        return a.slice(1).map((v, j) => lerp(v, b[j + 1], u));
      }
    }
    return list[list.length - 1].slice(1);
  }

  function pathLinear(list, t) {
    if (t <= list[0][0]) {
      const a = list[0], b = list[1];
      const k = (t - a[0]) / (b[0] - a[0]);
      return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
    }
    for (let i = 1; i < list.length; i++) {
      if (t <= list[i][0]) {
        const a = list[i - 1], b = list[i];
        const k = (t - a[0]) / (b[0] - a[0]);
        return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
      }
    }
    const a = list[list.length - 2], b = list[list.length - 1];
    const k = (t - a[0]) / (b[0] - a[0]);
    return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  }

  function headAt(list, t) {
    if (t <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      if (t <= list[i][0]) return lerp(list[i - 1][1], list[i][1], (t - list[i - 1][0]) / (list[i][0] - list[i - 1][0]));
    }
    return list[list.length - 1][1];
  }

  function integrate(keys, speed, t0, t1, anchorT, anchor) {
    const dt = 0.01, n = Math.round((t1 - t0) / dt) + 1;
    const pts = [[0, 0]];
    for (let i = 1; i < n; i++) {
      const h = headAt(keys, t0 + (i - 0.5) * dt);
      const q = pts[i - 1];
      pts.push([q[0] + S(h) * speed * dt, q[1] + C(h) * speed * dt]);
    }
    const k = Math.round((anchorT - t0) / dt);
    const off = [anchor[0] - pts[k][0], anchor[1] - pts[k][1]];
    return { t0, dt, pts: pts.map(q => [q[0] + off[0], q[1] + off[1]]) };
  }

  const PATH1_TABLE = integrate(HEAD1, SPEED, -0.6, CUT + 0.6, CUT, END1);
  const PATH2_TABLE = integrate(HEAD2, SPEED2, CUT - 0.6, DURATION + 0.6, CUT, START2);

  function tableAt(T, t) {
    const x = clamp((t - T.t0) / T.dt, 0, T.pts.length - 1.001);
    const i = Math.floor(x), u = x - i;
    const a = T.pts[i], b = T.pts[i + 1];
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  }

  function batemanPos(t) {
    return t < CUT ? tableAt(PATH1_TABLE, t) : tableAt(PATH2_TABLE, t);
  }

  function heading(posAt, t) {
    const a = posAt(t - 0.12), b = posAt(t + 0.12);
    return Math.atan2(b[0] - a[0], b[1] - a[1]);
  }

  function strikeIndex(list, t) {
    let i = 0;
    while (i < list.length - 2 && t >= list[i + 1]) i++;
    return i;
  }

  function phaseAt(list, t) {
    const i = strikeIndex(list, t);
    const u = clamp((t - list[i]) / (list[i + 1] - list[i]), 0, 1.5);
    return (i + u) * PI;
  }

  function footAt(list, firstLeft, side, t, posAt, stepOut, footFwd) {
    const isLeft = side === 'L';
    const own = list.filter((s, i) => ((i % 2 === 0) === firstLeft) === isLeft);
    let k = 0;
    while (k < own.length - 1 && t >= own[k + 1]) k++;
    const plant = (ts) => {
      const p = posAt(ts);
      const hd = heading(posAt, ts);
      const fx = S(hd), fz = C(hd);
      const sx = isLeft ? fz : -fz, sz = isLeft ? -fx : fx;
      return [p[0] + fx * footFwd + sx * stepOut, p[1] + fz * footFwd + sz * stepOut, hd];
    };
    const t0 = own[k];
    const t1 = own[k + 1] !== undefined ? own[k + 1] : t0 + 0.94;
    const stance = t0 + (t1 - t0) * 0.6;
    const a = plant(t0);
    if (t <= stance || t < t0) return { pos: [a[0], 0.075, a[1]], yaw: a[2], roll: 0 };
    const b = plant(t1);
    const u = clamp((t - stance) / (t1 - stance), 0, 1);
    const e = ease(u);
    return {
      pos: [lerp(a[0], b[0], e), 0.075 + 0.085 * S(u * PI) * (1 - u * 0.3), lerp(a[1], b[1], e)],
      yaw: lerp(a[2], b[2], e),
      roll: -0.5 * S(u * PI) * (1 - u) + 0.25 * S(u * PI) * u
    };
  }

  function gait(opts) {
    const t = opts.t;
    const list = opts.strikes;
    const ph = phaseAt(list, t) + (opts.firstLeft ? PI : 0);
    const pos = opts.posAt(t);
    const hd = opts.yaw !== undefined ? opts.yaw : heading(opts.posAt, t);
    const fx = S(hd), fz = C(hd);
    const side = [fz, 0, -fx];
    const bob = -opts.bob * C(2 * ph);
    const sway = -opts.sway * S(ph);
    const hipYaw = opts.hipYaw * C(ph);
    const L = footAt(list, opts.firstLeft, 'L', t, opts.posAt, opts.stepOut, opts.footFwd);
    const R = footAt(list, opts.firstLeft, 'R', t, opts.posAt, opts.stepOut, opts.footFwd);
    return {
      ph,
      p: [pos[0] + side[0] * sway, opts.height + bob, pos[1] + side[2] * sway],
      fwd: [S(hd + hipYaw), 0, C(hd + hipYaw)],
      up: [-side[0] * opts.roll * S(ph), 1, -side[2] * opts.roll * S(ph)],
      sp: [opts.lean, -hipYaw * 1.6, opts.roll * 0.6 * S(ph)],
      nk: [0.02, hipYaw * 0.55, -opts.roll * 0.4 * S(ph)],
      fLw: L.pos,
      fRw: R.pos,
      kLw: V3.add(L.pos, [fx * 0.6, 0.5, fz * 0.6]),
      kRw: V3.add(R.pos, [fx * 0.6, 0.5, fz * 0.6]),
      aL: L.roll,
      aR: R.roll,
      swing: C(ph)
    };
  }

  function batemanGait(t) {
    const shot = t < CUT ? 0 : 1;
    return gait({
      t,
      strikes: STRIKES[shot],
      firstLeft: FIRST_LEFT[shot],
      posAt: shot === 0 ? (x) => tableAt(PATH1_TABLE, x) : (x) => tableAt(PATH2_TABLE, x),
      height: P_Y,
      bob: 0.021,
      sway: 0.024,
      hipYaw: 0.07,
      roll: 0.02,
      lean: 0.03,
      stepOut: 0.1,
      footFwd: 0.3
    });
  }


  function cameraAt(t) {
    const g = batemanGait(t);
    const pos = batemanPos(t);
    const headY = P_Y + EYE_UP;
    if (t < CUT) {
      const [X, Y, dist] = track(CAM1, t);
      const yaw = headAt(HEAD1, t);
      const f = [-S(yaw), 0, -C(yaw)];
      const right = [C(yaw), 0, -S(yaw)];
      const w = K.wobble(t * 1.7, 0.004, 1.3);
      const head = [pos[0], headY, pos[1]];
      const eye = [head[0] - f[0] * dist - right[0] * X + w[0], head[1] - Y + w[1], head[2] - f[2] * dist - right[2] * X];
      return { eye, at: V3.add(eye, V3.mul(f, 10)), up: [S(w[2] * 2), 1, 0], fov: FOV, shot: 0, g };
    }
    const [X, Y, dist] = track(CAM2, t);
    const yaw = track(YAW2, t)[0];
    const f = [-S(yaw), 0, C(yaw)];
    const right = [-C(yaw), 0, -S(yaw)];
    const head = [pos[0], headY - 0.03, pos[1]];
    const w = K.wobble(t * 1.5, 0.005, 4.1);
    const eye = [head[0] - f[0] * dist - right[0] * X + w[0], head[1] - Y + w[1], head[2] - f[2] * dist - right[2] * X + w[2] * 0.4];
    return { eye, at: V3.add(eye, V3.mul(f, 10)), up: [S(w[2] * 2) * 0.5, 1, 0], fov: FOV, shot: 1, g };
  }

  function batemanPose(t) {
    const g = batemanGait(t);
    const sw = g.swing;
    return {
      p: g.p,
      up: g.up,
      fwd: g.fwd,
      sp: g.sp,
      nk: g.nk,
      fLw: g.fLw,
      fRw: g.fRw,
      kLw: g.kLw,
      kRw: g.kRw,
      aL: g.aL,
      aR: g.aR,
      hL: [0.215, -0.27, 0.02 + 0.1 * sw],
      eL: [0.6, -0.1, -0.7],
      hR: [-0.225, -0.285, 0.02 - 0.05 * sw],
      eR: [-0.6, -0.1, -0.6],
      gL: 'relax',
      gR: 'fist',
      case: 'R',
      caseSwing: 0.06 * sw,
      eyes: 'open'
    };
  }

  const EXTRAS = [
    { who: 'redhead', shot: 0, act: 'walk', keys: [[-0.6, 0.0, -8.6], [0.0, 0.35, -9.06], [0.6, 0.8, -9.5], [1.2, 1.5, -9.9], [2.2, 2.6, -10.6]] },
    { who: 'navySuit', shot: 0, act: 'walk', keys: [[-0.6, 0.85, -8.8], [0.0, 0.99, -9.32], [0.6, 1.05, -9.9], [1.4, 0.8, -10.9], [2.4, 0.4, -12.0]] },
    { who: 'greySuit', shot: 0, act: 'walk', keys: [[-0.6, 2.9, -8.6], [0.0, 2.45, -8.0], [0.6, 2.0, -7.5], [1.2, 1.7, -7.1], [1.8, 1.55, -6.6], [2.6, 1.6, -5.8]] },
    { who: 'greyPart', shot: 0, act: 'walk', keys: [[1.8, -0.6, -9.3], [2.8, -0.32, -8.0], [3.6, -0.3, -7.2], [4.94, -0.2, -5.6]] },
    { who: 'charcoal', shot: 0, act: 'walk', keys: [[2.4, 0.55, -1.6], [2.9, 0.65, -3.0], [3.4, 0.74, -4.4], [4.0, 0.85, -5.4], [4.94, 1.1, -6.6]] },
    { who: 'blackSuit', shot: 0, act: 'walk', keys: [[2.8, 1.6, -9.7], [3.8, 1.35, -9.0], [4.94, 1.15, -8.3]] },
    { who: 'redhead', shot: 1, act: 'walk', keys: [[4.6, -0.62, 1.1], [4.94, -0.36, 0.3], [5.3, -0.26, -0.45]], blur: true, look: -0.9 },
    { who: 'shirtGlasses', shot: 1, act: 'stand', keys: [[0.0, -1.2, 4.1]], yaw: -1.8 },
    { who: 'reader', shot: 1, act: 'read', keys: [[0.0, 1.1, 4.95]], yaw: PI - 0.35 },
    { who: 'blackSuit', shot: 1, act: 'walk', keys: [[4.94, 1.0, 5.6], [6.45, 1.0, 5.58], [7.1, 0.98, 4.6], [7.8, 1.05, 3.4], [8.5, 1.2, 2.2]], hold: [4.94, 6.45], yaw: PI + 0.25 },
    { who: 'overcoat', shot: 1, act: 'walk', keys: [[6.2, 0.55, 10.4], [7.0, 0.7, 9.6], [7.47, 0.83, 9.1], [8.0, 0.92, 7.5], [8.6, 1.0, 6.0], [9.2, 1.05, 4.6]] },
    { who: 'seated', shot: 1, act: 'sit', keys: [[0.0, -1.3, 7.75]], yaw: PI / 2 + 0.25 },
    { who: 'secretary', shot: 1, act: 'sit', keys: [[0.0, 0.45, 11.75]], yaw: PI, desk: true },
    { who: 'charcoal', shot: 1, act: 'walk', keys: [[9.4, 1.25, 10.3], [10.0, 1.22, 9.3], [10.48, 1.2, 8.4], [11.0, 1.28, 7.5], [11.4, 1.4, 6.9]] },
    { who: 'navySuit', shot: 1, act: 'walk', keys: [[10.5, 1.55, 10.35], [11.0, 1.05, 9.75], [11.48, 1.0, 9.05], [12.0, 1.35, 8.3], [12.5, 1.75, 7.7]] },
    { who: 'greyPart', shot: 1, act: 'walk', keys: [[10.6, 1.75, 10.5], [11.0, 1.4, 10.05], [11.48, 1.35, 9.4], [12.0, 1.6, 8.7], [12.6, 2.0, 8.0]] },
    { who: 'grinner', shot: 1, act: 'walk', keys: [[11.2, 0.5, 10.5], [12.0, 0.75, 9.6], [12.48, 1.05, 8.95], [12.95, 1.45, 8.3]] }
  ];


  function keyPos(keys, t) {
    if (keys.length === 1) return [keys[0][1], keys[0][2]];
    return pathLinear(keys, t);
  }

  function extraPose(e, t) {
    const look = window.YegudCast ? window.YegudCast.LOOKS[e.who] : null;
    const D = look ? window.YegudCast.BODY[look.body] : { thigh: 0.44, shin: 0.42, chestY: 0.21 };
    const legLen = D.thigh + D.shin + 0.075 + 0.04;
    const seed = e.keys[0][1] * 3.1 + e.keys[0][2] * 1.7;
    const held = e.hold && t >= e.hold[0] && t < e.hold[1];
    const pos = held ? [e.keys[0][1], e.keys[0][2]] : keyPos(e.keys, t);
    let yaw = e.yaw || 0, speed = 0;
    if (e.act === 'walk' && !held) {
      const a = keyPos(e.keys, t - 0.15), b = keyPos(e.keys, t + 0.15);
      speed = Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.3;
      if (speed > 0.05) yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
    }
    const breath = S(t * 1.7 + seed) * 0.01;
    const pose = { eyes: blinkAt(t, Math.abs(seed * 0.37) % 1), gL: 'relax', gR: 'relax' };
    if (e.act === 'sit') {
      pose.p = [pos[0], 0.52, pos[1]];
      pose.fwd = [S(yaw), 0, C(yaw)];
      pose.up = [0, 1, 0];
      pose.sp = [0.06 + breath, 0, 0];
      pose.nk = [e.desk ? 0.28 : 0.32, S(t * 0.4 + seed) * 0.12, 0];
      pose.fL = [0.12, -0.42, 0.42];
      pose.fR = [-0.12, -0.42, 0.42];
      pose.kL = [0.1, 0.4, 1];
      pose.kR = [-0.1, 0.4, 1];
      pose.hL = [0.12, -0.12, 0.34];
      pose.hR = [-0.12, -0.12, 0.34];
      pose.eL = [0.5, -0.2, -0.2];
      pose.eR = [-0.5, -0.2, -0.2];
      if (look && look.prop === 'folder') { pose.folder = true; pose.folderTilt = 0.9; pose.gL = 'folder'; pose.gR = 'folder'; }
      return pose;
    }
    const k = clamp(speed / 1.2, 0, 1.1);
    const ph = (t * Math.max(speed, 0.001) / 0.66) * PI + seed;
    const sw = k * C(ph);
    pose.p = [pos[0] + C(yaw) * 0.02 * k * S(ph), legLen - 0.02 - k * 0.018 * C(2 * ph) + breath * 0.3, pos[1] - S(yaw) * 0.02 * k * S(ph)];
    pose.fwd = [S(yaw + 0.06 * sw), 0, C(yaw + 0.06 * sw)];
    pose.up = [0, 1, 0];
    pose.sp = [0.03 + breath, -0.1 * sw, 0];
    pose.nk = [0.02, 0.05 * sw + (e.look || 0), 0];
    [['L', 1, 0], ['R', -1, PI]].forEach(([sd, side, off]) => {
      const f = ph + off;
      pose['f' + sd] = [side * 0.1, -(legLen - 0.04) + 0.075 + 0.08 * k * Math.max(0, S(f)), 0.03 + 0.3 * k * C(f)];
      pose['k' + sd] = [side * 0.12, 0.05, 1];
      pose['a' + sd] = 0.25 * k * S(f);
    });
    pose.hL = [0.21, -0.27, 0.02 + 0.12 * sw];
    pose.hR = [-0.21, -0.27, 0.02 - 0.12 * sw];
    pose.eL = [0.6, -0.1, -0.7];
    pose.eR = [-0.6, -0.1, -0.7];
    if (look && look.prop === 'briefcase') {
      pose.hR = [-0.22, -0.285, 0.02 - 0.05 * sw];
      pose.gR = 'fist';
      pose.case = 'R';
      pose.caseSwing = 0.06 * sw;
    }
    if (e.act === 'read') {
      pose.hL = [0.09, -0.02, 0.3];
      pose.hR = [-0.09, -0.02, 0.3];
      pose.eL = [0.5, -0.4, -0.3];
      pose.eR = [-0.5, -0.4, -0.3];
      pose.gL = 'folder';
      pose.gR = 'folder';
      pose.folder = true;
      pose.folderTilt = 0.75;
      pose.nk = [0.42, 0.04 * S(t * 0.6), 0];
      pose.eyes = 'half';
    }
    return pose;
  }

  function castAt(t, shot) {
    const out = [];
    EXTRAS.forEach(e => {
      if (e.shot !== shot) return;
      const k0 = e.keys[0][0], k1 = e.keys[e.keys.length - 1][0];
      const from = e.from !== undefined ? e.from : (e.act === 'walk' ? k0 : -1);
      const to = e.to !== undefined ? e.to : (e.act === 'walk' ? k1 : 99);
      if (t < from || t > to) return;
      if (e.blur) {
        [-0.09, -0.06, -0.03, 0].forEach((dt, i) => out.push({ who: e.who, pose: extraPose(e, t + dt), opts: { alpha: [0.22, 0.28, 0.34, 0.42][i] } }));
        return;
      }
      out.push({ who: e.who, pose: extraPose(e, t), opts: {} });
    });
    return out;
  }

  function blinkAt(t, phase) {
    const b = (t * 0.23 + phase) % 1;
    return b < 0.03 ? 'shut' : b < 0.045 ? 'half' : 'open';
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const cam = cameraAt(tt);
    const pose = batemanPose(tt);
    pose.eyes = blinkAt(tt, 0.61);
    const shade = tt < CUT ? lerp(1, 0.58, clamp((tt - 3.05) / 0.5, 0, 1)) : 1;
    return {
      t: tt,
      shot: cam.shot,
      camera: { eye: cam.eye, at: cam.at, up: cam.up, fov: cam.fov, wide: WIDE },
      bateman: pose,
      beat: BEAT(tt),
      cast: castAt(tt, cam.shot),
      batemanTint: [shade, shade * 0.99, shade * 0.98],
      wallShadow: tt < CUT ? 0 : clamp((tt - 10.7) / 0.4, 0, 1) * clamp((12.3 - tt) / 0.5, 0, 1),
      stripes: tt < CUT ? 0 : Math.max(clamp(1 - Math.abs(tt - 6.55) / 0.45, 0, 1), clamp(1 - Math.abs(tt - 8.8) / 0.55, 0, 1))
    };
  }

  window.YegudScript = { EXTRAS, castAt, extraPose, ID, DURATION, CUT, CUTS, FOV, WIDE, BEAT, STRIKES, HEAD1, HEAD2, CAM1, CAM2, YAW2, headAt, integrate, tableAt, batemanPos, batemanPose, batemanGait, gait, phaseAt, cameraAt, blinkAt, stage, pathLinear, track };
})();
