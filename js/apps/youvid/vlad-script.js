(function () {
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;

  const DURATION = 91.6;
  const VOICE = K.envelope('0013314iyEwqzPVTQRTTVTOKCnb410000003bdfzRRPTVWVRHvj9200000000000000000000000dETUSKHPUOGxnd51003akuDNQFAKUVQDqilxGCpa25iwCAn97itti7100000008qHSWWVPEyvszOSKFEwrxBxvADCBAqb5flnHTQNKKICvsmpHUTKud200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009wQWWTONPQMGBzzzzywqf40014hDOGvqklyPWSJKQSSLArluFCqkpCOTSQJABNVSJCAzuka30122100018iihtGHxohmyAqf61000000037hBRHe0000000000000000000000000000000000000000000000000000000000001000000000000ayNKFBBKUWWVOzvKMtmCOGtf8iCRUTODvtqka30000000000000000000000000007jvMWSDkmByf7jzFNVOvnBLIxi720000000000000000000000000038636jDIym9202427tPSIwk831003jGTVVTTVVTLynheda63100000000000137aegea8874100005gwLTVWVUUVVVTOzb000000000000000000000000000000000000000000000000000000000000000016dc512evAzJOHGQWWWVUTLAridkzHFvj847bdfeb8400000000buywDOUTMFwne75dkgaadb6554200000113crAAAGRWSLCBNWSGn700000000009mi68rLJEKEsnnqsxFAf4320000000000000000000000000000000000000000000000000bzNSVUMCwnc3000000000000000000000000000007sOVTSURCl94520000000000000000000000000000000000000000000000000000000000000000000000000000000025hERSUWVVUOCpe510000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006jzONt800byMORTSPya0000000cCTWVSKEHGxsrj9ahd5321100000000000000000000000000000008vQVMs83clifnmcfg60000000000000000006lsrrohfdb96884000003jGHlmKWSGn60000000000000000000000000000000000000000000004dgb41008uPTKBxAHQVVWULAwqmzQQHFBogefmoh9300000000000000000001cxPUOIHAspoh60000000000000000000002549nwxCKFusDRWTMCrmnwEDCHONAowOWQDAMSIsjtHGwrrqh51eCQURICzrrIUSJDFBma5447c9200ayRVUUQMPPDqga41000000000000000000000000000000000000000000000000000000000byMPOJAtlaiIVPINQOSWTHvzDvsonDDk82000037afgnre2', 20);

  const CUTS = [0, 9.7, 20.03, 24.27, 33.77, 40.37, 42.13, 60.83, 66.97, 76.77, 81.33, 87.9];

  const TOP = 0.47;

  const FLAT = { fL: [0.15, -0.9, -0.15], fR: [-0.15, -0.9, -0.15], kL: [0.15, 0, 1], kR: [-0.15, 0, 1], aL: 0.55, aR: 0.55 };
  const KNEE_L = { fL: [0.19, -0.5, -0.17], kL: [0.35, 0, 1], aL: 0.05 };
  const FLAT_L = { fL: [0.15, -0.9, -0.15], kL: [0.15, 0, 1], aL: 0.55 };
  const FLAT_R = { fR: [-0.15, -0.9, -0.15], kR: [-0.15, 0, 1], aR: 0.55 };
  const LIFT_L = { fL: [0.2, -0.42, 0.55], kL: [0.25, 0.4, 1], aL: 0.6 };
  const KICK_L = { fL: [0.42, -0.68, 0.42], kL: [0.35, 0, 1], aL: 0.75 };
  const UP_BOTH = { fL: [0.17, -0.22, 0.86], fR: [-0.19, -0.3, 0.82], kL: [0.2, 0.6, 1], kR: [-0.2, 0.6, 1], aL: 0.7, aR: 0.7 };
  const CURL = { fL: [0.08, -0.8, 0.3], fR: [-0.12, -0.84, 0.18], kL: [0.1, 0, 1], kR: [-0.1, 0, 1], aL: 0.4, aR: 0.4 };
  const PRONE = { fL: [0.16, -0.9, 0.12], fR: [-0.14, -0.9, 0.12], kL: [0.15, 0, -1], kR: [-0.15, 0, -1], aL: -0.6, aR: -0.6 };

  const LIE_20 = {
    p: [-0.16, TOP + 0.1, 0.6], up: [-0.95, 0.12, -0.2], fwd: [0.06, 0.97, 0.2], sp: [0.1, -0.08, 0.02], nk: [0.6, -0.6, 0.0],
    hRw: [-0.6, 0.92, 0.75], eRw: [-0.38, 0.72, 0.98], hLw: [-0.12, 0.82, 0.5], eLw: [-0.24, 0.7, 0.28]
  };

  const UNDER = {
    p: [-0.2, TOP + 0.1, 0.55], up: [-0.98, 0.14, -0.12], fwd: [0.1, 0.98, 0.15], sp: [0.08, 0, 0], nk: [0.5, -0.35, 0.0],
    hRw: null, eRw: null, hLw: null, eLw: null, wear: 'tee', belly: false, phone: null, eyes: 'open'
  };

  const ARMS_DOWN = { hL: [0.22, 0.05, 0.3], hR: [-0.22, 0.02, 0.3], eL: [0.8, 0, -0.2], eR: [-0.8, 0, -0.2] };

  const BACK_64 = {
    p: [-0.2, TOP + 0.1, 0.55], up: [-0.99, 0.08, -0.08], fwd: [0.06, 0.99, 0.1], sp: [0.06, 0, 0], nk: [0.45, -0.3, 0.0],
    hRw: null, eRw: null, hLw: null, eLw: null, gL: 'open', gR: 'open'
  };

  const SIDE_SLEEP = {
    p: [-0.08, TOP + 0.13, 0.5], up: [-1, 0.05, 0], fwd: [0, 0.15, 1], sp: [0.12, 0, 0], nk: [0.12, 0, 0.2],
    hL: [-0.05, 0.3, 0.4], eL: [-0.5, -0.2, 0.8], gL: 'open',
    hR: [0.02, 0.45, 0.42], eR: [0.1, -0.4, 0.8], gR: 'open',
    eyes: 'shut', belly: false, wear: 'tee'
  };

  function legs(...parts) {
    return Object.assign({ legs: 'keyed' }, ...parts);
  }

  const SHOT_A = {
    p: [0.32, 0.66, 0.66], up: [0.52, 0.55, -0.62], fwd: [0.4, -0.55, -0.7],
    sp: [0.15, 0.25, -0.1], nk: [-0.25, -0.6, 0.15],
    hL: [0.3, 0.05, 0.42], eL: [0.6, -0.5, 0.0], gL: 'phone',
    hRw: [0.55, 1.62, 0.36], eR: [-1, 0.2, -0.2], gR: 'fist',
    fL: [0.18, -0.62, 0.55], fR: [-0.1, -0.7, 0.5], kL: [0.2, 0, 1], kR: [-0.1, 0, 1],
    aL: 0.3, aR: 0.3, belly: false, wear: 'hoodie', phone: 'L'
  };

  const ARM_UP = [0.6, 1.66, 0.34];
  const ARM_HEAD = [0.74, 1.12, 0.3];
  const ARM_BENT = [0.42, 1.24, 0.42];

  const SHOT_D = {
    p: [-0.25, TOP + 0.14, 0.42], up: [-1, 0.08, 0], fwd: [0, 0.05, -1],
    sp: [0.15, 0, 0], nk: [0.2, 0, 0.1],
    hR: [0.12, 0.56, 0.32], eR: [-0.6, 0.2, 0.6], gR: 'phone', phone: 'R', wR: [0.4, 0, 0],
    hL: [0.2, 0.3, 0.35], eL: [0.8, 0.2, 0.2], gL: 'open', hRw: null, hLw: null, eRw: null, eLw: null
  };

  const POSES = [
    [0, Object.assign({}, SHOT_A, { hRw: ARM_HEAD })],
    [0.25, { hRw: [0.6, 1.3, 0.4] }],
    [0.45, { hRw: [0.44, 1.6, 0.45] }],
    [0.7, { hRw: ARM_UP }],
    [1.2, { hRw: [0.66, 1.68, 0.3] }],
    [1.6, { hRw: ARM_UP }],
    [1.8, { hRw: ARM_BENT }],
    [2.05, { hRw: ARM_UP }],
    [2.8, { hRw: [0.56, 1.68, 0.38] }],
    [3.5, { hRw: [0.64, 1.66, 0.3] }],
    [4.2, { hRw: [0.58, 1.68, 0.36] }],
    [4.6, { hRw: ARM_UP }],
    [4.85, { hRw: [0.5, 1.3, 0.48] }],
    [5.05, { hRw: ARM_HEAD }],
    [5.6, { hRw: [0.72, 1.14, 0.32] }],
    [5.85, { hRw: [0.4, 1.22, 0.3] }],
    [6.2, { hRw: [0.44, 1.26, 0.36] }],
    [6.45, { hRw: [0.5, 1.55, 0.4] }],
    [6.7, { hRw: ARM_UP }],
    [7.4, { hRw: [0.66, 1.68, 0.3] }],
    [8.0, { hRw: [0.56, 1.67, 0.38] }],
    [8.8, { hRw: ARM_UP }],
    [9.05, { hRw: [0.5, 1.35, 0.5] }],
    [9.25, { hRw: ARM_HEAD }],
    [9.69, { hRw: [0.7, 1.16, 0.3] }],

    [9.7, { hRw: null, gL: 'open', gR: 'phone', phone: 'R', wR: [0, 0, 0], wear: 'hoodie', belly: false, legs: 'motion' }],
    [10.95, legs({ fL: [0.2, -0.42, 0.6], fR: [-0.2, -0.45, 0.58], kL: [0.2, 0, 1], kR: [-0.2, 0, 1], aL: 0.2, aR: 0.2 })],
    [11.4, { fL: [0.2, -0.3, 0.72], fR: [-0.2, -0.48, 0.62] }],
    [11.75, legs(LIFT_L, { fR: [-0.16, -0.75, 0.25], belly: true })],
    [12.1, legs(KNEE_L, { fR: [-0.15, -0.88, -0.05] })],
    [12.6, legs(KNEE_L, FLAT_R)],
    [14.25, legs(KNEE_L, FLAT_R)],
    [14.5, legs({ fL: [0.17, -0.75, 0.05], kL: [0.2, 0, 1], aL: 0.3 })],
    [14.75, legs({ fL: [0.16, -0.72, 0.45], kL: [0.2, 0.3, 1], aL: 0.8 })],
    [15.05, legs(FLAT)],
    [18.35, legs(FLAT)],
    [18.7, legs(FLAT_L, { fR: [-0.08, -0.88, -0.06], aR: 0.7 })],
    [19.2, legs(FLAT)],

    [20.03, legs(FLAT, LIE_20, { gL: 'open', gR: 'phone', phone: 'R', belly: true })],
    [20.9, { hRw: [-0.62, 0.9, 0.74], eRw: [-0.4, 0.72, 0.98] }],
    [21.4, legs(FLAT, { hRw: [-0.6, 0.88, 0.76], nk: [0.6, -0.55, 0.05] })],
    [22.1, legs(KNEE_L, FLAT_R, { hRw: [-0.63, 0.91, 0.72] })],
    [23.2, { hRw: [-0.59, 0.87, 0.75], nk: [0.58, -0.6, 0.02] }],
    [24.26, { hRw: [-0.62, 0.89, 0.73] }],

    [24.27, legs(KNEE_L, FLAT_R, LIE_20, { p: [-0.2, TOP + 0.1, 0.6], hRw: [-0.42, 0.95, 0.72], eRw: [-0.3, 0.74, 0.98], gL: 'open', gR: 'phone', phone: 'R', belly: true })],
    [25.3, { hRw: [-0.5, 0.96, 0.7] }],
    [25.9, { hRw: [-0.57, 0.86, 0.68] }],
    [26.19, legs(FLAT, { hRw: null, eRw: null, hLw: null, eLw: null, gL: 'phone', gR: 'open', phone: 'L', wL: [0.3, 0, 0] })],
    [40.36, legs(FLAT)],

    [40.37, Object.assign({}, SHOT_D, CURL, { legs: 'keyed' })],
    [42.12, { hR: [0.0, 0.63, 0.31] }],

    [42.13, legs(KNEE_L, FLAT_R, { hRw: null, gL: 'open', gR: 'open', phone: null, belly: true })],
    [42.45, legs(LIFT_L, FLAT_R)],
    [42.9, legs({ fL: [0.25, -0.5, 0.75], kL: [0.25, 0.4, 1], aL: 0.8 }, FLAT_R)],
    [43.25, legs(LIFT_L, FLAT_R)],
    [43.65, legs(KNEE_L, FLAT_R)],
    [44.1, legs(FLAT)],
    [47.4, legs(FLAT)],
    [47.75, legs(KICK_L, FLAT_R)],
    [48.05, legs({ fL: [0.5, -0.62, 0.4], kL: [0.35, 0, 1], aL: 0.8 }, FLAT_R)],
    [48.3, legs(KNEE_L, FLAT_R)],
    [48.6, legs(KICK_L, { fR: [-0.12, -0.85, 0.15] })],
    [48.9, legs(KNEE_L, FLAT_R)],
    [49.3, legs({ fL: [0.5, -0.55, 0.5], kL: [0.35, 0.2, 1], aL: 0.8 }, FLAT_R)],
    [49.6, legs({ fL: [0.25, -0.5, 0.45], fR: [-0.22, -0.5, 0.4], kL: [0.25, 0, 1], kR: [-0.25, 0, 1], aL: 0.3, aR: 0.3 })],
    [49.7, { keep: 'nk', nk: [0.2, 0.05, 0.0] }],
    [49.95, { legs: 'motion', belly: false }],
    [50.6, { keep: 'nk', nk: [0.25, 0.0, 0.0] }],
    [50.75, { keep: '' }],
    [51.2, { wear: 'cape', capeDrop: 0.2, sleeveL: 0, sleeveR: 0 }],
    [51.6, { capeDrop: 0.6 }],
    [54.6, { sleeveR: 0 }],
    [54.9, { sleeveR: 0.3 }],
    [55.2, { sleeveR: 1, sleeveL: 0.4 }],
    [55.5, { sleeveL: 1, capeDrop: 0.9 }],
    [55.62, { wear: 'tee' }],

    [60.83, { wear: 'tee', legs: 'motion', belly: false }],
    [61.35, legs({ fL: [0.22, -0.45, 0.58], fR: [-0.22, -0.45, 0.56], kL: [0.22, 0, 1], kR: [-0.22, 0, 1], aL: 0.2, aR: 0.2 })],
    [61.8, legs({ fL: [0.2, -0.32, 0.75], fR: [-0.2, -0.35, 0.72], kL: [0.2, 0.3, 1], kR: [-0.2, 0.3, 1] })],
    [62.2, legs(UP_BOTH, { belly: true })],
    [62.6, legs(UP_BOTH)],
    [62.95, legs(LIFT_L, { fR: [-0.17, -0.6, 0.35], kR: [-0.2, 0.3, 1], aR: 0.5 })],
    [63.3, legs(KNEE_L, { fR: [-0.16, -0.75, 0.05] })],
    [63.79, legs(KNEE_L, FLAT_R)],
    [63.8, legs(KNEE_L, FLAT_R, BACK_64, { hR: [-0.3, 0.62, 0.05], eR: [-0.9, 0.2, -0.3], hL: [0.28, 0.5, 0.25], eL: [0.9, 0.1, 0] })],
    [64.4, { hR: [-0.22, 0.66, 0.02], hL: [0.3, 0.42, 0.3] }],
    [65.2, { hR: [-0.3, 0.6, 0.06], hL: [0.36, -0.05, 0.2], eL: [0.7, 0, -0.4] }],
    [66.0, { nk: [0.48, -0.25, 0.0], hL: [0.38, -0.2, 0.0] }],
    [66.96, legs(KNEE_L, FLAT_R, { hR: [-0.28, 0.62, 0.05] })],

    [66.97, legs(KNEE_L, FLAT_R, UNDER, { hL: [0.16, 0.26, 0.3], hR: [-0.16, 0.24, 0.3], eL: [0.8, -0.3, 0.2], eR: [-0.8, -0.3, 0.2], gL: 'fist', gR: 'fist', hideL: false, hideR: false })],
    [67.4, { hL: [0.2, 0.36, 0.28], hR: [-0.2, 0.34, 0.28] }],
    [67.6, { hideL: true, hideR: true }],
    [67.9, { hL: [0.3, 0.05, 0.3], hR: [-0.3, 0.02, 0.3] }],
    [68.3, legs(FLAT, ARMS_DOWN, { gL: 'open', gR: 'open' })],
    [69.15, legs(FLAT, ARMS_DOWN)],
    [69.45, { hL: [0.2, 0.25, 0.48], hR: [-0.2, 0.22, 0.48], gL: 'fist', gR: 'fist' }],
    [69.85, { hL: [0.28, 0.1, 0.3], hR: [-0.28, 0.08, 0.3] }],
    [70.3, legs(FLAT_R, ARMS_DOWN, { fL: [0.17, -0.7, -0.08], kL: [0.25, 0, 1], gL: 'open', gR: 'open' })],
    [70.9, { hideR: false }],
    [71.0, { hR: [-0.25, 0.45, 0.3], eR: [-0.9, -0.2, 0.1] }],
    [71.5, { hR: [-0.18, 0.62, 0.32] }],
    [72.3, legs(FLAT, { hR: [-0.2, 0.6, 0.34] })],
    [74.9, { hR: [-0.19, 0.61, 0.33] }],
    [75.5, { hR: [-0.36, 0.0, 0.05], eR: [-0.6, 0, -0.4] }],
    [75.8, { hideR: true }],
    [76.76, legs(FLAT)],

    [76.77, legs(CURL, SIDE_SLEEP, { hideL: false, hideR: true })],
    [79.5, { nk: [0.14, 0.04, 0.2] }],
    [81.32, { nk: [0.13, 0.0, 0.21] }],
    [81.33, { hL: [0.14, 0.05, 0.44], nk: [0.12, -0.04, 0.2] }],
    [84.0, { nk: [0.16, 0.02, 0.18] }],
    [85.3, { nk: [0.35, -0.3, 0.1], hR: [-0.05, 0.5, 0.38] }],
    [86.6, legs(CURL, { fwd: [0, -0.35, 1], nk: [0.5, -0.5, 0.05] })],
    [87.89, { fwd: [0, -0.5, 1], nk: [0.55, -0.6, 0.0] }],
    [87.9, legs(CURL, { p: [-0.2, TOP + 0.13, 0.5], fwd: [0, -0.7, 0.7], nk: [0.3, -0.75, 0.0], hR: [-0.1, 0.55, 0.35], hL: [0.3, 0.3, 0.3] })],
    [89.2, legs(PRONE, { fwd: [0, -0.85, 0.5], nk: [0.25, -0.85, 0.0] })],
    [91.6, legs(PRONE, { fwd: [0, -0.9, 0.42], nk: [0.25, -0.9, 0.0] })]
  ];

  function resolve(list) {
    const out = [];
    let cur = {};
    list.forEach(([t, o, e]) => {
      cur = Object.assign({}, cur, o);
      out.push({ t, o: cur, e: e || 'io' });
    });
    return out;
  }

  const TRACK = resolve(POSES);

  function shape(kind, k) {
    if (kind === 'lin') return k;
    if (kind === 'hold') return 0;
    return ease(k);
  }

  function blend(a, b, k) {
    const o = {};
    const keys = new Set(Object.keys(a).concat(Object.keys(b)));
    keys.forEach(key => {
      const va = a[key], vb = b[key];
      if (Array.isArray(va) && Array.isArray(vb) && va.length === vb.length) o[key] = va.map((v, i) => lerp(v, vb[i], k));
      else if (typeof va === 'number' && typeof vb === 'number') o[key] = lerp(va, vb, k);
      else o[key] = k < 1 ? (va === undefined ? vb : va) : vb;
    });
    return o;
  }

  const motionAt = window.YouVidRig.motion((window.YouVidMotion || {}).i9AyI356ye4);

  const LEG_KEYS = ['fLw', 'kLw', 'fRw', 'kRw'];

  function applyMotion(pose, v) {
    return window.YouVidRig.applyMotion(pose, v, key => (pose.legs === 'keyed' && LEG_KEYS.includes(key)) || (pose.keep && pose.keep.split(' ').includes(key)));
  }

  function keyedAt(t) {
    let lo = 0, hi = TRACK.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (TRACK[mid].t <= t) lo = mid; else hi = mid - 1;
    }
    const a = TRACK[lo], b = TRACK[Math.min(TRACK.length - 1, lo + 1)];
    if (b === a || t <= a.t) return Object.assign({}, a.o);
    const k = shape(b.e, clamp((t - a.t) / (b.t - a.t), 0, 1));
    return blend(a.o, b.o, k);
  }

  function poseAt(t) {
    const pose = keyedAt(t);
    const mv = motionAt(t);
    return mv ? applyMotion(pose, mv) : pose;
  }

  const MAIN = { eye: [-0.26, 1.03, 2.66], at: [0.08, 0.71, 0.45], fov: 32 };

  function main(o) {
    return Object.assign({}, MAIN, o);
  }

  const SHOTS = [
    [0, { eye: [-0.452, 1.356, 1.724], at: [0.001, 0.7, 0.814], fov: 58, shake: 0.012, props: { armchair: [-0.98, 1.22, 0.95], floorPhone: [-0.55, 1.18, 0.4], chair: [0.9, 1.3, -1.3], cabinet: [1.75, 0.8, -0.5], heap: 'wall', clothes: true } }],
    [9.7, main({ shake: 0.004, props: { heap: 'foot' } })],
    [20.03, main({ shake: 0.004, props: { heap: 'foot' } })],
    [24.27, { eye: [-0.24, 1.04, 2.1], at: [-0.2, 0.69, 0.46], fov: 44, shake: 0.018, props: { heap: 'back' }, move: { t0: 24.27, t1: 25.4, eye: [-0.29, 1.05, 1.81], at: [-0.27, 0.7, 0.46], fov: 44 } }],
    [33.77, { eye: [-0.29, 1.05, 1.81], at: [-0.27, 0.7, 0.46], fov: 44, shake: 0.007, props: { heap: 'back' } }],
    [40.37, { eye: [-0.3, 1.32, 2.05], at: [-0.2, 0.66, 0.3], fov: 42, shake: 0.006, props: { heap: 'back' } }],
    [42.13, main({ eye: [-0.25, 1.01, 2.66], shake: 0.006, props: { heap: 'back' } })],
    [60.83, main({ eye: [-0.25, 1.01, 2.66], shake: 0.006, props: { heap: 'back' } })],
    [66.97, main({ eye: [-0.25, 1.01, 2.66], shake: 0.005, props: {} })],
    [76.77, main({ eye: [-0.25, 1.0, 2.66], shake: 0.004, props: {} })],
    [81.33, main({ eye: [-0.25, 1.0, 2.66], shake: 0.004, props: {} })],
    [87.9, main({ eye: [-0.25, 1.0, 2.66], shake: 0.004, props: {} })]
  ];

  function shotAt(t) {
    let i = 0;
    while (i + 1 < SHOTS.length && SHOTS[i + 1][0] <= t) i++;
    return { index: i, start: SHOTS[i][0], end: i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DURATION, o: SHOTS[i][1] };
  }

  function cameraAt(t) {
    const sh = shotAt(t);
    const o = sh.o;
    let eye = o.eye, at = o.at, fov = o.fov;
    if (o.move) {
      const k = ease(clamp((t - o.move.t0) / (o.move.t1 - o.move.t0), 0, 1));
      eye = eye.map((v, i) => lerp(v, o.move.eye[i], k));
      at = at.map((v, i) => lerp(v, o.move.at[i], k));
      fov = lerp(fov, o.move.fov, k);
    }
    const w = K.wobble(t * 1.3, o.shake || 0, 3.1 + sh.index);
    const w2 = K.wobble(t * 3.7, (o.shake || 0) * 0.35, 7.7 + sh.index);
    const roll = (o.roll || 0) + S(t * 0.9 + sh.index) * (o.shake || 0) * 0.6;
    return { eye: [eye[0] + w[0] + w2[0], eye[1] + w[1] + w2[1], eye[2] + w[2] * 0.5], at: [at[0] + w[0] * 0.3, at[1] + w[1] * 0.3, at[2]], up: [S(roll), C(roll), 0], fov, shot: sh };
  }

  function blinkAt(t) {
    const b = (t * 0.31 + 0.17) % 1;
    return b < 0.03;
  }

  function faceAt(t, pose) {
    const v = VOICE(t);
    const mouth = v < 0.16 ? 'shut' : v < 0.48 ? 'open' : 'wide';
    let eyes = pose.eyes || 'open';
    if (eyes === 'open' && blinkAt(t)) eyes = 'shut';
    return { mouth, eyes };
  }

  function layer(t, p) {
    const v = VOICE(t);
    const breath = S(t * 1.6) * 0.012;
    const out = Object.assign({}, p);
    out.sp = [(p.sp ? p.sp[0] : 0) + breath, p.sp ? p.sp[1] : 0, p.sp ? p.sp[2] : 0];
    const nk = p.nk || [0, 0, 0];
    out.nk = [nk[0] + v * 0.06 * S(t * 13), nk[1] + v * 0.04 * S(t * 7.3), nk[2] + v * 0.03 * S(t * 5.1)];
    if (t > 38.0 && t < 38.9) out.p = [p.p[0], p.p[1] + 0.01 * S(t * 40), p.p[2]];
    return out;
  }

  function hoodieAt(t) {
    if (t < 55.62 || t >= 66.97) return null;
    const land = [-0.5, TOP + 0.02, 0.3];
    const far = [-0.78, TOP + 0.05, 0.16];
    if (t < 56.45) {
      const k = clamp((t - 55.62) / 0.83, 0, 1);
      const from = [0.0, 1.0, 0.45];
      return { p: [lerp(from[0], land[0], k), lerp(from[1], land[1], k) + S(k * PI) * 0.35, lerp(from[2], land[2], k)], ry: k * 2.5, rz: S(k * PI) * 0.8 };
    }
    if (t < 60.05) return { p: land, ry: 2.5, rz: 0 };
    if (t < 60.5) {
      const k = clamp((t - 60.05) / 0.45, 0, 1);
      return { p: [lerp(land[0], far[0], k), lerp(land[1], far[1], k) + S(k * PI) * 0.22, lerp(land[2], far[2], k)], ry: 2.5 + k * 1.5, rz: S(k * PI) * 0.6 };
    }
    return { p: far, ry: 4.0, rz: 0 };
  }

  function blanketAt(t) {
    if (t < 66.97) return null;
    if (t < 76.77) {
      const k = clamp((t - 66.97) / 1.5, 0, 1);
      const lift = t > 69.2 && t < 70.7 ? S(((t - 69.2) / 1.5) * PI) * 0.11 : 0;
      const fold = ease(clamp((t - 70.7) / 0.5, 0, 1) * clamp((75.8 - t) / 0.5, 0, 1));
      return { mode: 'throw', k, lift, x0: lerp(-1.0, -0.62, fold), x1: lerp(0.05, 1.06, ease(k)), z0: 0.02, z1: 1.03, armsUnder: true, reach: 0.24 };
    }
    return { mode: 'wrap', k: 1, lift: 0, x0: -0.32, x1: 1.06, z0: 0.02, z1: 1.03, armsUnder: false, bunch: 1, reach: 0.12 };
  }

  function fadeAt(t) {
    if (t < 87.5) return 1;
    return Math.pow(clamp((90.4 - t) / 2.9, 0, 1), 1.3);
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const raw = poseAt(tt);
    const pose = layer(tt, raw);
    const face = faceAt(tt, pose);
    pose.mouth = face.mouth;
    pose.eyes = face.eyes;
    const cam = cameraAt(tt);
    return { t: tt, pose, camera: cam, shot: cam.shot, props: cam.shot.o.props || {}, hoodie: hoodieAt(tt), blanket: blanketAt(tt), fade: fadeAt(tt) };
  }

  window.VladScript = { DURATION, VOICE, CUTS, SHOTS, TRACK, stage, poseAt, shotAt };
})();
