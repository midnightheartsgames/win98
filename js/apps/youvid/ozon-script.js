(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;

  const ID = 'Kl4dbTvOz0n';
  const DURATION = 116.1;
  const CUTS = [0, 13.65, 20.89, 28.86, 39.64, 50.52, 57.29, 65.93, 69.54, 73.24, 93.06, 105.62];
  const ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const SPEECH = [
    [9.25, 'ozon', 'KQs001ZWuTNWMh00000wBHKNBJZXRWv5v00nZJAmvsl00AqxIZOzrd000ba5ac58'],
    [74.8, 'kirya', 'a009lihatikXWubdZPpHLj04iZdZZWGc207FgirIw94162d570007b3009400599ad4'],
    [78.65, 'ozon', 'tb8033d0kKGf08DIp00001OHLt0eps7030tmFWVzRoxRQx76STosvOFXIb0q83ZSg0VZZOEgGDGUFBpfZOl88GZZZQKIOkMZXTKMt70qDj0003lKJNfAzm2'],
    [89.1, 'ozon', 'YZIk1cEHCBkQSAzs5wPz10xnZTn300LS700l65'],
    [95.8, 'ozon', 'a74qxCJHmLCygVYZSneMZQenAc87bxsl00qNMQZSSYZRDga000wPt00UPZNpec1800000efa770tY9oZXZVA6amu6326'],
    [101.4, 'kirya', 'ZYVRn60CzqSEi0JZTMkoj8'],
    [103.35, 'ozon', '44EZZRprRPws64tVHIo890007ZUh56jHFQQzh'],
    [108.4, 'ozon', 'tqIHrc0WZHZRzjZWu9DQyg1xMga'],
    [114.6, 'ozon', 'c9dnqmilmie71gUDkQZZZYYZZVU']
  ];

  function speechAt(t) {
    for (const [t0, who, str] of SPEECH) {
      const x = (t - t0) * 20;
      if (x < 0 || x >= str.length - 1) continue;
      const i = Math.floor(x);
      const a = Math.max(0, ALPHA.indexOf(str[i])) / 61, b = Math.max(0, ALPHA.indexOf(str[i + 1])) / 61;
      return { who, v: lerp(a, b, x - i) };
    }
    return { who: '', v: 0 };
  }

  function VOICE(t) {
    return speechAt(t).v;
  }

  function mouthOf(who, t, rest) {
    const s = speechAt(t);
    if (s.who !== who) return rest || 'shut';
    return s.v < 0.16 ? (rest || 'shut') : s.v < 0.55 ? 'open' : 'wide';
  }

  function blink(t, seed) {
    const p = 3.1 + (seed % 5) * 0.37;
    return ((t + seed * 0.71) % p) < 0.12;
  }

  function hermite(p0, p1, p2, p3, t0, t1, t2, t3, t) {
    const h = t2 - t1;
    const u = clamp((t - t1) / h, 0, 1);
    const u2 = u * u, u3 = u2 * u;
    const m1 = ((p2 - p0) / Math.max(1e-4, t2 - t0)) * h;
    const m2 = ((p3 - p1) / Math.max(1e-4, t3 - t1)) * h;
    return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
  }

  function track(keys) {
    const full = [];
    let cur = {};
    keys.forEach(([t, v]) => {
      cur = Object.assign({}, cur, v);
      full.push([t, cur]);
    });
    const num = (x) => typeof x === 'number';
    return (t) => {
      if (t <= full[0][0]) return Object.assign({}, full[0][1]);
      const n = full.length;
      if (t >= full[n - 1][0]) return Object.assign({}, full[n - 1][1]);
      let i = 1;
      while (i < n && t >= full[i][0]) i++;
      const [t1, a] = full[i - 1], [t2, b] = full[i];
      const [t0, z] = full[Math.max(0, i - 2)], [t3, c] = full[Math.min(n - 1, i + 1)];
      const out = {};
      Object.keys(a).forEach(key => {
        const va = a[key], vb = b[key];
        if (num(va) && num(vb)) {
          const vz = num(z[key]) ? z[key] : va, vc = num(c[key]) ? c[key] : vb;
          out[key] = hermite(vz, va, vb, vc, i - 2 >= 0 ? t0 : t1 - 1, t1, t2, i + 1 < n ? t3 : t2 + 1, t);
        } else if (Array.isArray(va) && Array.isArray(vb) && va.length === vb.length && num(va[0])) {
          const za = Array.isArray(z[key]) && z[key].length === va.length ? z[key] : va;
          const cb = Array.isArray(c[key]) && c[key].length === vb.length ? c[key] : vb;
          out[key] = va.map((x, j) => hermite(za[j], x, vb[j], cb[j], i - 2 >= 0 ? t0 : t1 - 1, t1, t2, i + 1 < n ? t3 : t2 + 1, t));
        } else {
          out[key] = va;
        }
      });
      Object.keys(b).forEach(key => { if (!(key in out)) out[key] = b[key]; });
      return out;
    };
  }

  function W(base, yaw, v) {
    const c = C(yaw), s = S(yaw);
    return [base[0] + v[0] * c + v[2] * s, base[1] + v[1], base[2] - v[0] * s + v[2] * c];
  }

  function body(k) {
    const yaw = k.yaw || 0;
    const M = M4.chain(M4.rotY(yaw), M4.rotX(k.tilt || 0), M4.rotZ(k.roll || 0));
    const base = [k.x, 0, k.z];
    const pose = {
      pos: [k.x, k.h === undefined ? 1.0 : k.h, k.z],
      up: M4.dir(M, [0, 1, 0]),
      fwd: M4.dir(M, [0, 0, 1]),
      sp: k.sp || [0, 0, 0],
      nk: k.nk || [0, 0, 0],
      gL: k.gL || 'relax',
      gR: k.gR || 'relax',
      eyes: k.eyes || 'open',
      mouth: k.mouth || 'shut',
      outfit: k.outfit
    };
    const footL = k.fL || [0.13, 0.08, 0.02], footR = k.fR || [-0.13, 0.08, 0.02];
    pose.fLw = k.fLw || W(base, yaw + (k.fy || 0), footL);
    pose.fRw = k.fRw || W(base, yaw + (k.fy || 0), footR);
    pose.kLw = k.kLw || W(base, yaw, [0.16 + (k.kneeOut || 0), 0.5, 1.2]);
    pose.kRw = k.kRw || W(base, yaw, [-0.16 - (k.kneeOut || 0), 0.5, 1.2]);
    ['hL', 'hR', 'eL', 'eR', 'hLw', 'hRw', 'eLw', 'eRw', 'wL', 'wR', 'aL', 'aR'].forEach(f => { if (k[f] !== undefined) pose[f] = k[f]; });
    return pose;
  }

  const ENV_OLD = {
    sunDir: [0.35, -0.5, 1],
    sunColor: [0.3, 0.31, 0.34],
    ambTop: [0.74, 0.74, 0.76],
    ambBottom: [0.36, 0.35, 0.34],
    fogColor: [0.3, 0.3, 0.3],
    fogNear: 20,
    fogFar: 40,
    points: [{ pos: [-0.2, 2.3, -0.4], color: [0.35, 0.33, 0.3] }, { pos: [0.4, 1.2, -1.5], color: [0.12, 0.14, 0.2] }]
  };

  const ENV_DAY = {
    sunDir: [0.3, -0.55, 0.8],
    sunColor: [0.42, 0.4, 0.36],
    ambTop: [0.98, 0.96, 0.94],
    ambBottom: [0.6, 0.58, 0.55],
    fogColor: [0.8, 0.8, 0.8],
    fogNear: 20,
    fogFar: 40,
    points: [{ pos: [0, 2.4, 0.5], color: [0.2, 0.19, 0.17] }]
  };

  const ENV_YELLOW = {
    sunDir: [-0.2, -1, -0.3],
    sunColor: [0.36, 0.3, 0.18],
    ambTop: [0.92, 0.86, 0.66],
    ambBottom: [0.5, 0.44, 0.3],
    fogColor: [0.2, 0.16, 0.1],
    fogNear: 20,
    fogFar: 40,
    points: [{ pos: [0, 2.45, -0.4], color: [0.45, 0.38, 0.22] }, { pos: [0.6, 1.6, -1.6], color: [0.12, 0.12, 0.14] }]
  };

  const ENV_CAM = {
    sunDir: [0.2, -0.25, 1],
    sunColor: [0.22, 0.22, 0.24],
    ambTop: [0.62, 0.62, 0.66],
    ambBottom: [0.3, 0.3, 0.32],
    fogColor: [0.9, 0.9, 0.9],
    fogNear: 20,
    fogFar: 40,
    points: [{ pos: [0.0, 1.3, 0.4], color: [0.14, 0.15, 0.17] }]
  };

  function cam(eye, at, fov, roll) {
    const r = roll || 0;
    return { eye, at, up: [S(r), C(r), 0], fov };
  }

  function shake(t, amp, seed) {
    const w = K.wobble(t * 1.7, amp, seed);
    return w;
  }

  function handheld(eye, at, t, amp, seed) {
    const a = shake(t, amp, seed), b = shake(t + 7.3, amp * 1.4, seed + 3);
    return { eye: [eye[0] + a[0], eye[1] + a[1], eye[2] + a[2]], at: [at[0] + b[0], at[1] + b[1], at[2] + b[2]] };
  }

  const OZON_OLD = track([
    [0.0, { x: -0.86, z: -0.32, h: 0.68, yaw: 1.62, tilt: -0.22, sp: [0.08, 0.05, 0], nk: [0.05, 0.3, 0], hR: [-0.06, 0.36, 0.16], eR: [-0.25, -1.0, 0.2], gR: 'cig', hL: [0.28, -0.08, 0.22], eL: [0.6, -0.3, -0.3], gL: 'relax', fL: [0.16, 0.08, 0.55], fR: [-0.14, 0.08, 0.52], eyes: 'half' }],
    [0.6, { hR: [-0.1, 0.24, 0.26] }],
    [1.2, { hR: [-0.09, 0.27, 0.25], nk: [0.02, 0.36, 0] }],
    [1.8, { hR: [-0.06, 0.36, 0.16] }],
    [2.7, { hR: [-0.05, 0.33, 0.17], nk: [0.05, 0.3, 0], eyes: 'open' }],
    [3.8, { hR: [-0.05, 0.33, 0.18], tilt: -0.2 }],
    [4.4, { tilt: 0.1, sp: [0.3, 0.1, 0], nk: [0.15, 0.3, 0], hR: [-0.1, 0.1, 0.35], eR: [-0.6, -0.3, -0.3], gR: 'relax', hL: [0.22, 0.05, 0.38] }],
    [5.0, { tilt: 0.18, sp: [0.32, 0.12, 0], nk: [0.1, 0.25, 0], h: 0.68, hR: [-0.14, -0.05, 0.5], hL: [0.18, -0.02, 0.52], gL: 'open', gR: 'open' }],
    [6.0, { tilt: 0.22, sp: [0.38, 0.1, 0], nk: [0.12, 0.22, 0], hR: [-0.12, -0.08, 0.52], hL: [0.15, -0.04, 0.55] }],
    [6.6, { hR: [-0.1, -0.06, 0.55] }],
    [7.4, { hR: [-0.14, -0.08, 0.5], nk: [0.28, 0.28, 0] }],
    [8.4, { tilt: 0.18, sp: [0.34, 0.14, 0], nk: [0.1, 0.3, 0] }],
    [9.05, { tilt: -0.18, sp: [0.05, 0.05, 0], nk: [0.02, 0.4, 0], h: 0.68, hR: [-0.3, 0.05, 0.3], hL: [0.3, 0.05, 0.3], eyes: 'wide' }],
    [9.6, { hR: [-0.36, 0.12, 0.28], hL: [0.36, 0.12, 0.28], nk: [-0.05, 0.44, 0] }],
    [10.4, { hR: [-0.25, 0.2, 0.32], hL: [0.3, 0.0, 0.3], nk: [0.02, 0.4, 0], eyes: 'open' }],
    [11.2, { hR: [-0.07, 0.3, 0.18], eR: [-0.25, -1.0, 0.2], gR: 'cig', hL: [0.28, -0.08, 0.22], gL: 'relax', nk: [0.05, 0.3, 0] }],
    [12.4, { hR: [-0.06, 0.35, 0.16], eyes: 'half' }],
    [13.65, { hR: [-0.06, 0.36, 0.16] }]
  ]);

  function shotOld(t) {
    const k = OZON_OLD(t);
    k.outfit = 'hoodie';
    k.mouth = mouthOf('ozon', t, 'shut');
    if (blink(t, 1) && k.eyes !== 'wide') k.eyes = 'shut';
    return {
      set: 'old',
      env: ENV_OLD,
      camera: cam([-0.07, 1.51, 1.43], [0.105, 1.545, -1.564], 44),
      grade: [0.98, 0.98, 1.0, 0.18],
      colorAdd: [0.02, 0.02, 0.025],
      overlay: 'goal',
      cast: [{ who: 'ozon', pose: body(k) }]
    };
  }

  const BOX_CAM = track([
    [13.65, { e: [0.06, 1.12, 0.32], a: [-0.02, 0.4, -0.75], r: 0.12 }],
    [14.4, { e: [0.0, 1.18, 0.42], a: [-0.06, 0.36, -0.74], r: 0.04 }],
    [15.5, { e: [-0.04, 1.21, 0.49], a: [-0.07, 0.34, -0.73], r: 0.02 }],
    [17.5, { e: [-0.02, 1.22, 0.52], a: [-0.06, 0.34, -0.73], r: 0.0 }],
    [19.5, { e: [-0.05, 1.2, 0.5], a: [-0.07, 0.35, -0.73], r: 0.02 }],
    [20.89, { e: [-0.04, 1.21, 0.5], a: [-0.07, 0.35, -0.73], r: 0.01 }]
  ]);

  function shotBox(t) {
    const k = BOX_CAM(t);
    const h = handheld(k.e, k.a, t, 0.012, 2);
    return { set: 'box', env: ENV_DAY, camera: cam(h.eye, h.at, 42, k.r + 0.01 * S(t * 0.9)), grade: [1.04, 1.0, 0.94, 0.0], colorAdd: [0.015, 0.012, 0.0], overlay: 'rec', cast: [] };
  }

  const TREE_CAM = track([
    [20.89, { e: [-0.2, 1.6, 0.05], a: [0.05, 1.85, -1.3], f: 56 }],
    [21.3, { e: [-0.32, 1.38, 0.0], a: [0.1, 0.72, -1.04], f: 56 }],
    [22.0, { e: [-0.375, 1.33, -0.04], a: [0.08, 0.64, -1.04], f: 55.6 }],
    [23.5, { e: [-0.37, 1.33, -0.03], a: [0.09, 0.64, -1.04], f: 55.6 }],
    [24.6, { e: [-0.33, 1.35, 0.02], a: [0.12, 0.66, -1.04], f: 55.6 }],
    [25.2, { e: [-0.5, 1.15, 0.12], a: [-0.3, 0.75, -1.0], f: 58 }],
    [25.8, { e: [-0.66, 0.9, 0.2], a: [-0.95, 1.0, -0.95], f: 62 }],
    [26.6, { e: [-0.63, 0.8, 0.2], a: [-0.6, 1.12, -0.94], f: 63.7 }],
    [27.5, { e: [-0.63, 0.8, 0.2], a: [-0.65, 1.16, -0.94], f: 63.7 }],
    [28.86, { e: [-0.62, 0.82, 0.2], a: [-0.63, 1.14, -0.94], f: 63.7 }]
  ]);

  function shotTree(t) {
    const k = TREE_CAM(t);
    const h = handheld(k.e, k.a, t, 0.015, 5);
    return { set: 'tree', env: ENV_DAY, camera: cam(h.eye, h.at, k.f, -0.02 + 0.015 * S(t * 0.7)), grade: [1.04, 1.0, 0.98, 0.0], colorAdd: [0.015, 0.012, 0.012], overlay: 'rec', cast: [] };
  }

  const CAM_A = cam([-1.55, 1.45, 3.2], [1.0, 0.98, -1.7], 34);

  const OZON_DANCE = track([
    [28.86, { x: -0.1, z: -0.55, h: 1.05, yaw: -0.4, tilt: 0.15, roll: 0.25, sp: [0.2, -0.3, 0.1], nk: [0.1, 0, 0], hL: [0.45, 0.25, 0.25], hR: [-0.5, 0.1, -0.1], fL: [0.35, 0.45, 0.3], fR: [-0.12, 0.08, -0.1], gL: 'fist', gR: 'fist' }],
    [29.3, { x: -0.15, z: -0.6, h: 0.98, yaw: -0.9, tilt: 0.3, roll: -0.1, sp: [0.3, 0.2, 0], hL: [0.4, -0.1, 0.4], hR: [-0.45, 0.3, 0.1], fL: [0.2, 0.1, 0.35], fR: [-0.15, 0.08, -0.2] }],
    [29.8, { x: -0.1, z: -0.6, h: 0.8, yaw: -1.4, tilt: 0.6, roll: 0, sp: [0.4, 0, 0], hL: [0.3, -0.35, 0.45], hR: [-0.3, -0.35, 0.45], fL: [0.2, 0.08, 0.5], fR: [-0.18, 0.08, -0.35], gL: 'open', gR: 'open' }],
    [30.3, { x: -0.3, z: -0.55, h: 0.45, yaw: -1.6, tilt: 1.0, roll: 0.2, sp: [0.3, 0, 0], hL: [0.35, -0.3, 0.3], hR: [-0.35, -0.3, 0.3], fL: [0.25, 0.08, 0.3], fR: [-0.2, 0.08, -0.45] }],
    [30.9, { x: -0.4, z: -0.45, h: 0.32, yaw: -2.2, tilt: 1.2, roll: 0.5, sp: [0.2, 0.3, 0.2], fL: [0.3, 0.08, -0.1], fR: [-0.2, 0.08, -0.4] }],
    [31.6, { x: -0.35, z: -0.4, h: 0.36, yaw: -1.2, tilt: 0.9, roll: -0.3, sp: [0.3, -0.2, 0], hL: [0.3, -0.25, 0.4], hR: [-0.32, -0.25, 0.42], fL: [0.25, 0.08, 0.2], fR: [-0.25, 0.08, -0.25] }],
    [32.3, { x: -0.25, z: -0.55, h: 0.55, yaw: 0.6, tilt: 0.6, roll: 0, sp: [0.3, 0, 0], nk: [0.2, 0, 0], hL: [0.3, -0.3, 0.3], hR: [-0.3, -0.3, 0.3], fL: [0.2, 0.08, 0.45], fR: [-0.15, 0.08, -0.45] }],
    [32.9, { x: -0.1, z: -0.7, h: 0.72, yaw: 0.9, tilt: 0.45, sp: [0.25, 0, 0], fL: [0.2, 0.08, 0.5], fR: [-0.15, 0.08, -0.4] }],
    [33.5, { x: 0.05, z: -0.85, h: 0.98, yaw: 1.0, tilt: 0.12, sp: [0.12, 0, 0], nk: [0.1, 0, 0], hL: [0.3, -0.2, 0.15], hR: [-0.32, -0.18, 0.15], fL: [0.14, 0.08, 0.12], fR: [-0.14, 0.08, -0.1], gL: 'relax', gR: 'relax' }],
    [34.2, { x: 0.1, z: -0.9, h: 1.03, yaw: 1.3, tilt: 0.05, sp: [0.1, 0, 0], nk: [0.35, -0.2, 0], hL: [0.12, -0.3, 0.2], hR: [-0.1, -0.3, 0.22], gL: 'grip', gR: 'grip', fL: [0.13, 0.08, 0.02], fR: [-0.13, 0.08, 0.02] }],
    [35.0, { x: 0.12, z: -0.9, yaw: 0.6, nk: [0.3, 0.1, 0], hL: [0.14, -0.28, 0.22], hR: [-0.08, -0.32, 0.2] }],
    [35.8, { x: 0.15, z: -0.92, yaw: 0.9, nk: [0.2, 0.3, 0], hL: [0.18, -0.3, 0.2], hR: [-0.16, -0.3, 0.2] }],
    [36.4, { x: 0.16, z: -0.95, yaw: 1.3, nk: [0.25, 0, 0], hL: [0.2, -0.1, 0.35], hR: [-0.2, -0.12, 0.35], gL: 'open', gR: 'open' }],
    [37.0, { x: 0.3, z: -1.0, yaw: 1.5, tilt: 0.1, hL: [0.25, -0.05, 0.4], hR: [-0.15, -0.25, 0.25], fL: [0.13, 0.08, 0.25], fR: [-0.13, 0.08, -0.15] }],
    [37.6, { x: 0.55, z: -1.15, yaw: 1.9, tilt: 0.2, sp: [0.2, 0, 0], hL: [0.3, 0.05, 0.45], hR: [-0.3, 0.05, 0.45], gL: 'grip', gR: 'grip', fL: [0.14, 0.08, 0.2], fR: [-0.12, 0.08, -0.2] }],
    [38.2, { x: 0.72, z: -1.25, yaw: 2.15, tilt: 0.3, sp: [0.3, 0, 0], nk: [0.25, 0, 0], hLw: [1.28, 1.0, -1.38], hRw: [0.98, 1.0, -1.62], fL: [0.14, 0.08, 0.1], fR: [-0.14, 0.08, -0.15] }],
    [39.0, { x: 0.74, z: -1.26, tilt: 0.34, sp: [0.34, 0, 0], hLw: [1.3, 1.02, -1.36], hRw: [0.99, 1.02, -1.62] }],
    [39.64, { x: 0.74, z: -1.26, tilt: 0.36 }]
  ]);

  function shotDance(t) {
    const k = OZON_DANCE(t);
    k.outfit = 'tee';
    k.mouth = 'shut';
    if (blink(t, 2)) k.eyes = 'shut';
    return {
      set: 'yellow',
      dress: 'A',
      env: ENV_YELLOW,
      camera: CAM_A,
      grade: [1.08, 1.0, 0.76, -0.04],
      colorAdd: [0.025, 0.018, 0.0],
      overlay: 'yellowA',
      cast: [{ who: 'ozon', pose: body(k) }]
    };
  }

  const FACE_Z = -0.479;

  const BOXFACE_CAM = track([
    [39.64, { u: 0.88, v: 0.42, d: 0.42, r: 0.12 }],
    [40.4, { u: 0.8, v: 0.4, d: 0.38, r: 0.18 }],
    [41.5, { u: 0.72, v: 0.38, d: 0.45, r: 0.1 }],
    [42.4, { u: 0.55, v: 0.72, d: 0.5, r: 0.0 }],
    [43.4, { u: 0.45, v: 0.73, d: 0.5, r: 0.05 }],
    [44.3, { u: 0.3, v: 0.62, d: 0.48, r: 0.12 }],
    [45.0, { u: 0.36, v: 0.4, d: 0.45, r: 0.1 }],
    [45.8, { u: 0.25, v: 0.33, d: 0.42, r: 0.06 }],
    [46.6, { u: 0.12, v: 0.3, d: 0.48, r: 0.08 }],
    [47.4, { u: 0.02, v: 0.42, d: 0.75, r: 0.12 }],
    [48.2, { u: 0.08, v: 0.78, d: 0.7, r: 0.3 }],
    [49.0, { u: 0.1, v: 0.86, d: 0.55, r: 0.45 }],
    [50.52, { u: 0.1, v: 0.86, d: 0.5, r: 0.55 }]
  ]);

  const FLOOR_CAM = track([
    [50.52, { e: [5.05, 1.4, 1.5], a: [5.3, 0.0, 0.85] }],
    [51.4, { e: [5.15, 1.35, 1.2], a: [5.5, 0.0, 0.4] }],
    [52.2, { e: [5.3, 1.35, 0.6], a: [5.6, 0.1, -0.4] }],
    [53.0, { e: [5.6, 1.3, 0.25], a: [6.0, 0.25, -0.75] }],
    [54.0, { e: [5.75, 1.25, 0.15], a: [6.1, 0.35, -0.85] }],
    [55.2, { e: [5.85, 1.0, 0.0], a: [6.15, 0.35, -0.85] }],
    [56.2, { e: [5.95, 0.75, -0.25], a: [6.2, 0.35, -0.9] }],
    [57.29, { e: [6.0, 0.7, -0.3], a: [6.2, 0.4, -0.95] }]
  ]);

  const BED_CAM = track([
    [57.29, { e: [9.85, 1.05, 0.75], a: [10.25, 0.45, 0.0] }],
    [58.5, { e: [9.75, 1.05, 0.7], a: [10.15, 0.45, 0.0] }],
    [60.0, { e: [9.55, 1.02, 0.75], a: [9.95, 0.45, 0.0] }],
    [61.3, { e: [9.45, 1.0, 0.8], a: [9.55, 0.45, 0.0] }],
    [62.0, { e: [9.1, 1.0, 1.4], a: [9.2, 0.1, 1.2] }],
    [62.8, { e: [9.0, 1.0, 1.5], a: [9.4, 0.3, 0.8] }],
    [63.6, { e: [9.4, 1.05, 1.0], a: [10.0, 0.45, 0.2] }],
    [64.4, { e: [9.4, 1.0, 0.9], a: [9.6, 0.45, -0.3] }],
    [65.93, { e: [9.6, 1.0, 0.8], a: [10.2, 0.45, -0.2] }]
  ]);

  function shotUnbox(t, shot) {
    let camera, zone, hand = null;
    if (shot === 4) {
      const k = BOXFACE_CAM(t);
      const x = -0.81 + 1.62 * k.u, y = k.v;
      const at = [x, y, FACE_Z];
      const eye = [x + 0.12, y + 0.06, FACE_Z + k.d];
      const h = handheld(eye, at, t, 0.02, 9);
      camera = cam(h.eye, h.at, 52, k.r);
      zone = 'box';
      if (t > 48.4) hand = { pos: [x - 0.08, y + 0.08, FACE_Z + 0.05], yaw: 0.3, pitch: -1.2, open: 1 };
    } else if (shot === 5) {
      const k = FLOOR_CAM(t);
      const h = handheld(k.e, k.a, t, 0.04, 11);
      camera = cam(h.eye, h.at, 60, 0.15 * S(t * 1.3));
      zone = 'floor';
      if (t > 54.6) {
        const pull = clamp((t - 54.6) / 1.8, 0, 1);
        hand = { pos: [6.0 + pull * 0.1, 0.62 - pull * 0.05, -0.62 + pull * 0.2], yaw: -0.4, pitch: -0.6, open: pull < 0.3 ? 1 : 0 };
      }
    } else {
      const k = BED_CAM(t);
      const h = handheld(k.e, k.a, t, 0.03, 13);
      camera = cam(h.eye, h.at, 60, 0.25 * S(t * 0.8));
      zone = 'bed';
    }
    return { set: 'unbox', zone, env: ENV_DAY, camera, grade: [1.04, 1.0, 0.96, 0.0], colorAdd: [0.01, 0.01, 0.01], overlay: null, cast: [], hand, blur: shot === 4 ? 0.5 : 0.35 };
  }

  const CAM_B = cam([0.096, 1.713, 0.686], [0.213, 1.386, -0.252], 77.6);
  const CAM_B9 = cam([0.096, 1.713, 0.686], [0.15, 1.386, -0.252], 77.6);
  const CAM_C = cam([0.096, 1.713, 0.686], [1.0, 1.15, -2.0], 55);

  const KIRYA_DESK = track([
    [65.93, { x: 0.5, z: -1.05, h: 1.0, yaw: 2.35, tilt: 0.2, sp: [0.25, 0.25, 0], nk: [0.15, -0.2, 0], hL: [0.22, -0.02, 0.45], hR: [-0.25, 0.05, 0.42], gL: 'open', gR: 'grip' }],
    [66.6, { yaw: 2.1, tilt: 0.12, nk: [0.05, -0.45, 0], hR: [-0.2, 0.15, 0.4], hL: [0.25, -0.08, 0.4] }],
    [67.3, { yaw: 2.4, tilt: 0.28, hR: [-0.15, -0.05, 0.5], hL: [0.18, -0.1, 0.48] }],
    [68.2, { yaw: 2.0, tilt: 0.1, nk: [-0.05, -0.6, 0], hR: [-0.3, 0.2, 0.35] }],
    [69.0, { yaw: 2.3, tilt: 0.25, nk: [0.12, -0.25, 0], hR: [-0.18, 0.0, 0.48] }],
    [69.54, { yaw: 2.3 }]
  ]);

  function shotDesk(t) {
    const k = KIRYA_DESK(t);
    k.outfit = 'track';
    k.mouth = 'shut';
    if (blink(t, 3)) k.eyes = 'shut';
    return {
      set: 'yellow', dress: 'B', env: ENV_YELLOW, camera: CAM_B,
      grade: [1.06, 1.0, 0.78, -0.03], colorAdd: [0.025, 0.02, 0.0], overlay: 'yellowB',
      wallTv: { tilt: 0, screen: 'game' },
      chair: { pos: [0.18, 0, 0.0], yaw: PI + 0.35 },
      cast: [{ who: 'kirya', pose: body(k) }]
    };
  }

  const SOFA = track([
    [69.54, { lx: -1.0, lz: -0.6, ly: 0.12, lnk: [0.05, 0.6, 0], lh: [-0.1, 0.2, 0.3], kx: -0.35, kz: -1.2, ky: 0.3, khR: [-0.3, 0.05, 0.3], knk: [0.0, 0.3, 0], kyaw: 1.3 }],
    [70.4, { khR: [-0.35, 0.2, 0.35], kyaw: 1.5, ly: 0.18, lnk: [-0.05, 0.7, 0] }],
    [70.9, { khR: [-0.1, 0.45, 0.5], kyaw: 1.6, knk: [-0.1, 0.1, 0] }],
    [71.3, { khR: [-0.4, 0.3, 0.55], kyaw: 1.4 }],
    [72.0, { khR: [-0.28, 0.0, 0.35], kyaw: 1.2, ly: 0.1, lnk: [0.1, 0.55, 0] }],
    [73.24, { khR: [-0.3, 0.05, 0.3], kyaw: 1.3 }]
  ]);

  function shotSofa(t) {
    const s = SOFA(t);
    const lysy = body({
      x: s.lx, z: s.lz, h: 0.58, yaw: 1.2, tilt: -0.15, roll: s.ly * 0.4, sp: [0.12, 0.25, 0], nk: s.lnk,
      hR: [-0.12, 0.05, 0.32], hL: [0.15, 0.0, 0.3], gR: 'phone', gL: 'relax', fL: [0.15, 0.08, 0.5], fR: [-0.15, 0.08, 0.48],
      eyes: 'squint', mouth: 'grin', outfit: 'hoodie'
    });
    const kirya = body({
      x: s.kx, z: s.kz, h: 0.62, yaw: s.kyaw, tilt: -0.05, sp: [0.15, 0, 0], nk: s.knk,
      hR: s.khR, hL: [0.25, -0.1, 0.35], gR: 'open', gL: 'relax', fL: [0.16, 0.08, 0.5], fR: [-0.14, 0.08, 0.52],
      eyes: blink(t, 4) ? 'shut' : 'open', mouth: 'open', outfit: 'track'
    });
    const guest = body({
      x: 0.32, z: -0.05, h: 0.6, yaw: 1.25, tilt: -0.1, sp: [0.05, 0, 0], nk: [0.05, 0.25, 0],
      hR: [-0.2, -0.1, 0.35], hL: [0.22, -0.1, 0.35], fL: [0.15, 0.08, 0.5], fR: [-0.15, 0.08, 0.5], outfit: 'jacket'
    });
    return {
      set: 'yellow', dress: 'B', env: ENV_YELLOW, camera: CAM_B,
      grade: [1.06, 1.0, 0.78, -0.03], colorAdd: [0.025, 0.02, 0.0], overlay: 'yellowB',
      wallTv: { tilt: 0, screen: 'game' },
      chair: { pos: [0.32, 0, -0.05], yaw: 1.25 },
      cast: [{ who: 'lysy', pose: lysy }, { who: 'kirya', pose: kirya }, { who: 'guest', pose: guest }]
    };
  }

  const TV_TRACK = track([
    [73.24, { tilt: 0.0 }],
    [74.4, { tilt: 0.05 }],
    [75.4, { tilt: 0.22 }],
    [76.4, { tilt: 0.3 }],
    [77.5, { tilt: 0.36 }],
    [78.6, { tilt: 0.4 }],
    [79.6, { tilt: 0.42 }],
    [81.0, { tilt: 0.3 }],
    [82.5, { tilt: 0.18 }],
    [84.0, { tilt: 0.12 }],
    [85.5, { tilt: 0.08 }],
    [93.06, { tilt: 0.08 }]
  ]);

  const KIRYA_TV = track([
    [73.24, { x: 1.05, z: -1.0, h: 0.96, yaw: 1.75, tilt: 0.05, sp: [0, 0, 0], nk: [-0.25, 0, 0], hLw: [1.55, 1.75, -1.35], hRw: [1.55, 1.7, -0.85], gL: 'open', gR: 'open', eyes: 'open' }],
    [74.2, { x: 1.0, z: -1.05, h: 1.0, tilt: -0.05, nk: [-0.4, 0, 0], hLw: [1.5, 2.3, -1.4], hRw: [1.5, 2.3, -0.9], gL: 'grip', gR: 'grip' }],
    [75.0, { x: 0.95, h: 1.06, tilt: -0.18, fL: [0.13, 0.12, 0.05], fR: [-0.13, 0.12, 0.0] }],
    [75.8, { x: 0.9, h: 1.0, tilt: -0.25, fL: [0.13, 0.08, 0.05], fR: [-0.13, 0.08, 0.0] }],
    [76.6, { x: 0.86, h: 1.08, tilt: -0.32, fL: [0.13, 0.14, 0.05], fR: [-0.13, 0.14, 0.0] }],
    [77.4, { x: 0.84, h: 0.98, tilt: -0.3, fL: [0.13, 0.08, 0.05], fR: [-0.13, 0.08, 0.0] }],
    [78.3, { x: 0.82, h: 1.06, tilt: -0.34, fL: [0.13, 0.13, 0.05], fR: [-0.13, 0.13, 0.0] }],
    [79.2, { x: 0.84, h: 1.0, tilt: -0.3, fL: [0.13, 0.08, 0.05], fR: [-0.13, 0.08, 0.0] }],
    [80.2, { x: 0.9, h: 1.0, tilt: -0.2 }],
    [81.5, { x: 0.98, z: -1.15, tilt: -0.1, hLw: [1.45, 2.25, -1.55], hRw: [1.45, 2.25, -1.05] }],
    [83.2, { x: 1.0, z: -1.2, tilt: -0.05 }],
    [84.4, { x: 0.95, z: -1.15, tilt: -0.15, nk: [-0.2, 0.3, 0] }],
    [85.2, { x: 0.78, z: -1.1, h: 0.98, yaw: 2.4, tilt: -0.15, nk: [0, 0, 0], hL: [0.3, 0.1, 0.25], hR: [-0.3, 0.15, 0.25], hLw: undefined, hRw: undefined, gL: 'open', gR: 'open' }],
    [85.9, { x: 0.2, z: -1.15, h: 0.92, yaw: 1.4, tilt: -0.5, roll: 0.1, fL: [0.15, 0.08, 0.3], fR: [-0.15, 0.08, 0.25] }],
    [86.4, { x: -0.55, z: -1.15, h: 0.65, yaw: 1.3, tilt: -0.9, roll: 0.15, hL: [0.35, 0.25, 0.1], hR: [-0.35, 0.35, 0.1], fL: [0.2, 0.08, 0.6], fR: [-0.2, 0.3, 0.6], eyes: 'wide' }],
    [86.8, { x: -1.0, z: -1.15, h: 0.62, yaw: 1.35, tilt: -1.05, roll: 0.05, hL: [0.38, -0.15, -0.2], hR: [-0.3, 0.3, 0.3], fL: [0.2, 0.25, 0.65], fR: [-0.15, 0.5, 0.6] }],
    [87.6, { x: -1.05, z: -1.12, h: 0.62, yaw: 1.4, tilt: -0.85, sp: [0.3, 0.2, 0], nk: [0.2, 0.2, 0], hL: [0.35, -0.3, -0.15], hR: [-0.35, 0.45, 0.35], gR: 'open', fL: [0.2, 0.08, 0.6], fR: [-0.15, 0.4, 0.62], eyes: 'open' }],
    [88.4, { hR: [-0.45, 0.6, 0.15], sp: [0.35, 0.25, 0] }],
    [89.2, { hR: [-0.3, 0.35, 0.45], sp: [0.3, 0.2, 0] }],
    [90.2, { hR: [-0.42, 0.55, 0.25] }],
    [91.2, { hR: [-0.25, 0.2, 0.45], sp: [0.25, 0.15, 0] }],
    [92.2, { hR: [-0.4, 0.5, 0.3] }],
    [93.06, { hR: [-0.35, 0.4, 0.35] }]
  ]);

  const OZON_TV = track([
    [73.24, { x: -0.6, z: 1.2, h: 1.03, yaw: 0.6, tilt: 0.2, hL: [0.3, -0.2, 0.2], hR: [-0.3, -0.2, 0.2] }],
    [80.1, { x: -0.6, z: 1.2 }],
    [80.6, { x: -0.3, z: 0.45, yaw: 0.9, tilt: 0.25, hL: [0.35, -0.05, 0.25], hR: [-0.35, -0.05, 0.25], fL: [0.13, 0.08, 0.3], fR: [-0.13, 0.08, -0.25] }],
    [81.2, { x: 0.2, z: -0.1, yaw: 1.0, fL: [0.13, 0.08, -0.25], fR: [-0.13, 0.08, 0.3] }],
    [81.8, { x: 0.72, z: -0.55, yaw: 1.4, tilt: 0.05, hLw: [1.5, 2.1, -1.0], hRw: [1.5, 2.0, -0.55], gL: 'open', gR: 'open', fL: [0.13, 0.08, 0.02], fR: [-0.13, 0.08, 0.02], nk: [-0.3, 0, 0] }],
    [82.4, { x: 0.8, z: -0.62, tilt: 0.1, hLw: [1.45, 2.2, -1.1], hRw: [1.45, 2.25, -0.6] }],
    [83.5, { x: 0.8, z: -0.7, hLw: [1.4, 2.1, -1.15], hRw: [1.42, 2.2, -0.68] }],
    [84.4, { x: 0.75, z: -0.8, yaw: 1.9, nk: [-0.1, -0.2, 0], hLw: [0.9, 1.45, -1.2], hRw: [0.85, 1.35, -0.95], gL: 'grip', gR: 'grip' }],
    [85.2, { x: 0.65, z: -0.9, yaw: 2.4, tilt: 0.15, hLw: [0.55, 1.35, -1.25], hRw: [0.6, 1.25, -1.0] }],
    [85.9, { x: 0.4, z: -0.85, yaw: 2.6, tilt: 0.35, hLw: [0.0, 1.15, -1.3], hRw: [0.05, 1.1, -1.05], fL: [0.15, 0.08, 0.3], fR: [-0.15, 0.08, -0.25] }],
    [86.6, { x: 0.25, z: -0.68, yaw: -2.2, tilt: 0.1, hLw: undefined, hRw: undefined, hL: [0.3, -0.15, 0.25], hR: [-0.3, -0.15, 0.25], gL: 'open', gR: 'open', fL: [0.13, 0.08, 0.02], fR: [-0.13, 0.08, 0.02], nk: [0.1, 0, 0] }],
    [87.4, { x: 0.25, z: -0.68, yaw: -2.0, tilt: 0.05, hL: [0.42, 0.0, 0.2], hR: [-0.45, 0.05, 0.25] }],
    [88.4, { hL: [0.4, -0.05, 0.3], hR: [-0.55, 0.12, 0.2], nk: [0.15, 0, 0] }],
    [89.3, { hL: [0.5, 0.1, 0.15], hR: [-0.5, 0.1, 0.15], nk: [0.0, 0, 0] }],
    [90.2, { hL: [0.3, -0.2, 0.2], hR: [-0.45, 0.0, 0.25] }],
    [91.4, { yaw: -1.8, hL: [0.36, -0.1, 0.25], hR: [-0.36, -0.1, 0.25] }],
    [93.06, { yaw: -1.85 }]
  ]);

  const GUEST_WALK = track([
    [89.6, { x: -0.55, z: 1.4 }],
    [90.4, { x: -0.5, z: 0.6 }],
    [91.4, { x: -0.45, z: -0.1 }],
    [92.2, { x: -0.45, z: -0.3 }],
    [93.06, { x: -0.45, z: -0.32 }]
  ]);

  function shotTv(t) {
    const kk = KIRYA_TV(t);
    kk.outfit = 'track';
    kk.mouth = mouthOf('kirya', t, 'shut');
    if (blink(t, 5) && kk.eyes === 'open') kk.eyes = 'shut';
    const oz = OZON_TV(t);
    oz.outfit = 'grey';
    oz.mouth = mouthOf('ozon', t, 'shut');
    oz.eyes = blink(t, 6) ? 'shut' : 'open';
    const tv = TV_TRACK(t);
    const cast = [{ who: 'kirya', pose: body(kk) }];
    if (t > 79.6) cast.push({ who: 'ozon', pose: body(oz) });
    if (t > 89.6) {
      const g = GUEST_WALK(t);
      const step = S((t - 89.6) * 9) * clamp((92.2 - t) / 0.4, 0, 1);
      cast.push({ who: 'guest', pose: body({ x: g.x, z: g.z, yaw: PI + 0.15, tilt: 0.05, h: 0.97 + Math.abs(step) * 0.02, hL: [0.3, -0.22, 0.05 + step * 0.08], hR: [-0.3, -0.22, 0.05 - step * 0.08], fL: [0.13, 0.08 + Math.max(0, step) * 0.08, step * 0.25], fR: [-0.13, 0.08 + Math.max(0, -step) * 0.08, -step * 0.25], outfit: 'hood' }) });
    }
    return {
      set: 'yellow', dress: 'B', env: ENV_YELLOW, camera: CAM_B9,
      grade: [1.06, 1.0, 0.78, -0.03], colorAdd: [0.025, 0.02, 0.0], overlay: 'yellowB',
      wallTv: { tilt: tv.tilt, screen: t >= 80.8 && t < 84.8 ? 'blue' : 'off' },
      chair: { pos: [0.35, 0, -0.15], yaw: PI + 0.5 },
      cast
    };
  }

  const FIGHT = track([
    [93.06, { cx: 0.6, cy: 0.35, cz: -1.0, cyaw: 0.6, cpitch: -1.2, croll: 0.2, kx: 0.1, kz: -0.45, kyaw: 2.4, kt: 0.45, ox: -0.75, oz: 0.35, oyaw: 0.9 }],
    [93.6, { cx: 0.55, cy: 1.15, cz: -0.85, cyaw: 1.4, cpitch: -2.6, croll: 0.4, kt: 0.15 }],
    [94.2, { cx: 0.45, cy: 1.3, cz: -0.6, cyaw: 2.4, cpitch: -2.9, croll: -0.3, kx: 0.05, kz: -0.35, kyaw: 2.3, ox: -0.45, oz: 0.1, oyaw: 1.1 }],
    [94.8, { cx: 0.35, cy: 1.05, cz: -0.45, cyaw: 3.4, cpitch: -2.2, croll: 0.5, kx: 0.0, kz: -0.3, kyaw: 2.7, kt: 0.25, ox: -0.3, oz: -0.05, oyaw: 1.6 }],
    [95.6, { cx: 0.4, cy: 1.0, cz: -0.5, cyaw: 3.0, cpitch: -1.9, croll: 0.2, kx: 0.05, kz: -0.35, kyaw: 3.1, ox: -0.25, oz: -0.1, oyaw: 2.0 }],
    [96.6, { cx: 0.45, cy: 1.15, cz: -0.55, cyaw: 2.5, cpitch: -2.4, croll: -0.2, kx: 0.1, kz: -0.4, kyaw: 2.8, ox: -0.2, oz: -0.15, oyaw: 2.3 }],
    [97.6, { cx: 0.35, cy: 0.95, cz: -0.5, cyaw: 3.1, cpitch: -1.6, croll: 0.3, kx: 0.02, kz: -0.38, kyaw: 3.2, ox: -0.28, oz: -0.12, oyaw: 1.9 }],
    [98.6, { cx: 0.5, cy: 1.1, cz: -0.6, cyaw: 2.7, cpitch: -2.2, croll: -0.1, kx: 0.12, kz: -0.45, kyaw: 2.8, ox: -0.15, oz: -0.2, oyaw: 2.4 }],
    [99.6, { cx: 0.3, cy: 1.0, cz: -0.55, cyaw: 3.3, cpitch: -1.8, kx: -0.02, kz: -0.42, kyaw: 3.2, ox: -0.3, oz: -0.15, oyaw: 2.0 }],
    [100.8, { cx: 0.15, cy: 0.9, cz: -0.65, cyaw: 3.6, cpitch: -1.5, kx: -0.2, kz: -0.55, kyaw: 3.5, ox: -0.45, oz: -0.25, oyaw: 2.3 }],
    [102.0, { cx: 0.25, cy: 1.05, cz: -0.6, cyaw: 3.0, cpitch: -2.0, kx: -0.12, kz: -0.5, kyaw: 3.1, ox: -0.35, oz: -0.2, oyaw: 2.1 }],
    [103.0, { cx: 0.45, cy: 1.1, cz: -0.55, cyaw: 2.6, cpitch: -2.3, kx: 0.05, kz: -0.45, kyaw: 2.8, ox: -0.2, oz: -0.15, oyaw: 2.5 }],
    [103.8, { cx: 0.2, cy: 1.3, cz: -0.45, cyaw: 3.8, cpitch: -2.8, croll: 0.6, kx: -0.05, kz: -0.4, kyaw: 3.4, ox: -0.3, oz: -0.15, oyaw: 2.0 }],
    [104.6, { cx: 0.05, cy: 0.7, cz: -0.4, cyaw: 4.2, cpitch: -1.4, croll: 0.2, kx: -0.15, kz: -0.4, kyaw: 3.7, ox: -0.4, oz: -0.15, oyaw: 2.2 }],
    [105.62, { cx: 0.0, cy: 0.62, cz: -0.4 }]
  ]);

  function shotFight(t) {
    const f = FIGHT(t);
    const jig = S(t * 7.3) * 0.05, jig2 = S(t * 5.1 + 1) * 0.06;
    const chairM = M4.chain(M4.translate(f.cx, f.cy, f.cz), M4.rotY(f.cyaw), M4.rotX(f.cpitch), M4.rotZ(f.croll || 0));
    const grabL = M4.point(chairM, [0.22, 0.55, -0.25]);
    const grabR = M4.point(chairM, [-0.22, 0.55, -0.25]);
    const holdL = M4.point(chairM, [0.25, 0.45, 0.2]);
    const kirya = body({
      x: f.kx + jig * 0.5, z: f.kz, h: 0.95, yaw: f.kyaw, tilt: f.kt + jig, roll: jig2 * 0.5, sp: [0.15, jig2, 0], nk: [0.05, 0, 0],
      hLw: grabL, hRw: grabR, gL: 'grip', gR: 'grip', fL: [0.15, 0.08, 0.15 + jig], fR: [-0.15, 0.08, -0.15 - jig],
      eyes: 'wide', mouth: mouthOf('kirya', t, 'open'), outfit: 'track'
    });
    const ozon = body({
      x: f.ox - jig * 0.4, z: f.oz, h: 1.0, yaw: f.oyaw, tilt: 0.25 + jig2 * 0.5, roll: -jig * 0.5, sp: [0.2, -jig, 0], nk: [0.1, 0, 0],
      hLw: t > 94.6 ? holdL : undefined, hRw: t > 94.6 ? M4.point(M4.chain(M4.translate(f.kx, 1.2, f.kz)), [0.0, 0.0, 0.0]) : undefined,
      hL: [0.35, 0.0, 0.3], hR: [-0.35, 0.0, 0.3], gL: 'grip', gR: 'grip', fL: [0.16, 0.08, 0.2 - jig], fR: [-0.16, 0.08, -0.2 + jig],
      eyes: blink(t, 7) ? 'shut' : 'open', mouth: mouthOf('ozon', t, 'shut'), outfit: 'tee'
    });
    const fade = t > 102.9 ? clamp((105.47 - t) / 2.57, 0, 1) : 1;
    const flash = t > 100.43 && t < 100.87 ? 1 - Math.abs((t - 100.65) / 0.22) * 0.5 : 0;
    return {
      set: 'yellow', dress: 'C', env: ENV_YELLOW, camera: CAM_C,
      grade: [1.06, 1.0, 0.76, -0.03], colorAdd: [0.025, 0.02, 0.0], overlay: 'yellowB',
      chairM,
      cast: [{ who: 'kirya', pose: kirya }, { who: 'ozon', pose: ozon }],
      fade, flash
    };
  }

  const LAUGH = track([
    [105.62, { tilt: 0.2, sp: [0.18, 0.12, 0.05], nk: [0.18, 0.35, 0.08], hR: [-0.06, 0.12, 0.42], hL: [0.3, -0.1, 0.4], gR: 'fist', gL: 'relax' }],
    [106.4, { nk: [0.24, 0.3, 0.0], hR: [-0.05, 0.1, 0.45] }],
    [107.2, { nk: [0.14, 0.4, 0.08], hR: [-0.08, 0.06, 0.48] }],
    [108.0, { nk: [0.2, 0.25, 0.0], hR: [-0.02, 0.4, 0.3], gR: 'relax' }],
    [108.8, { nk: [0.12, 0.35, 0.05], hR: [-0.02, 0.38, 0.32] }],
    [109.6, { nk: [0.22, 0.3, 0.0], hR: [-0.1, 0.12, 0.45], gR: 'fist' }],
    [110.4, { nk: [0.26, 0.2, 0.0], hR: [-0.04, 0.16, 0.45] }],
    [111.0, { nk: [0.3, 0.15, 0.05], hR: [0.0, 0.42, 0.3], gR: 'open' }],
    [112.0, { nk: [0.34, 0.1, 0.0], hR: [0.01, 0.41, 0.31] }],
    [112.8, { nk: [0.4, 0.1, 0.0], tilt: 0.3, hR: [0.05, 0.34, 0.38], hL: [0.18, 0.18, 0.4], gR: 'relax' }],
    [113.6, { nk: [0.3, 0.2, 0.0], hR: [-0.01, 0.45, 0.28], gR: 'open' }],
    [114.6, { nk: [0.24, 0.15, 0.05], hR: [0.0, 0.46, 0.27] }],
    [115.4, { nk: [0.18, 0.2, 0.0], hR: [-0.01, 0.45, 0.28] }],
    [116.1, { nk: [0.2, 0.18, 0.0] }]
  ]);

  function shotCam(t) {
    const k = LAUGH(t);
    const shakeK = S(t * 11) * 0.02 * (VOICE(t) > 0.2 || (t > 105.6 && t < 108) ? 1 : 0.3);
    const ozon = body(Object.assign({}, k, {
      x: 0.08, z: -0.52, h: 0.6, yaw: -0.25, nk: [k.nk[0] + shakeK, k.nk[1], k.nk[2]],
      fL: [0.16, 0.08, 0.5], fR: [-0.16, 0.08, 0.5], eyes: 'squint', mouth: VOICE(t) > 0.3 ? 'wide' : 'grin', outfit: 'print'
    }));
    const fadeIn = clamp((t - 105.62) / 0.3, 0, 1);
    return {
      set: 'cam', env: ENV_CAM, camera: cam([-0.12, 1.22, 0.62], [0.12, 1.02, -0.9], 58),
      grade: [1.08, 1.08, 1.1, 0.3], colorAdd: [0.06, 0.06, 0.07], overlay: 'chat',
      cast: [{ who: 'ozon', pose: ozon }], fade: fadeIn
    };
  }

  function shotAt(t) {
    let i = 0;
    for (let j = 1; j < CUTS.length; j++) if (t >= CUTS[j]) i = j;
    return i;
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const shot = shotAt(tt);
    let st;
    if (shot === 0) st = shotOld(tt);
    else if (shot === 1) st = shotBox(tt);
    else if (shot === 2) st = shotTree(tt);
    else if (shot === 3) st = shotDance(tt);
    else if (shot >= 4 && shot <= 6) st = shotUnbox(tt, shot);
    else if (shot === 7) st = shotDesk(tt);
    else if (shot === 8) st = shotSofa(tt);
    else if (shot === 9) st = shotTv(tt);
    else if (shot === 10) st = shotFight(tt);
    else st = shotCam(tt);
    st.t = tt;
    st.shot = shot;
    if (st.fade === undefined) st.fade = 1;
    if (st.flash === undefined) st.flash = 0;
    return st;
  }

  window.OzonScript = { ID, DURATION, CUTS, VOICE, SPEECH, speechAt, stage, track, body };
})();
