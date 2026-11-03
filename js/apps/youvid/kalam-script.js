(function () {
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac, envelope } = K;

  const ID = 'Ka1amBurg98';
  const DURATION = 121.74;

  const VOICE = envelope(
    '00000000000000000K000KSJT3zSK00TNEJCyzRF00000hSJ8Wq0000Mz00000wU000000Ve0000CPLy00000Q000000Ob000000U000000ANOA000m500000IWy00000KK0000dQBJM00000M000000P000G00AJ00Du00x800D500E000v000v00QVsSz6ISxg0000' +
    '00000ltloBBtkl9000csmwFGtukcqmd17400PHp0cUtGMOKBxb000cUoKNvPMGml6Cm00009KD0JBAz0xN0Pm0P0mF0Df0z09t0sgzIC0k00g0410500000000000000cZYUOOMQFj0NGTOF000Q000000Q000000Os000000N000000Qi00000Lr000000Q000000zU' +
    'PLvn9000BIJJILRLROUZQPPSRMMFs40004d00000000060600000000000000800001000000000wVxXSGPUsPNANSSMyrpn65000000a011090630KUIGNPPEHOIuYIpqOPBlUKAu5JQSOEqtqa0bto6000TPzJRPNPHsHUMGSKOSRLvomd000Sj2000000HWEyMLrf' +
    'SZTPECuBDi1QOPDywryq5HNlBVJAWSFDuqDSTyMKu6uh0FUKYNWYXVWVXRUSUUVRHTSVRMMMOJKFxusk97oneecgfaerlg9fgggc8cfnjklgggjef5eb7464344fefeca965kfgfgdc59hdgfkoiikkgbjlccbbifffcaelponopoonnuqkopojhkpwwwyrjlrlniida' +
    '12000000000000000LQ5000000000MM0UHONNOOSRPNKJEBGvBKKKLFGEHHEFFHHGGEEBCDDyzFDINOOQQPKIIHFKHzABFEAKDKLSIHGILFEolnpxztBAvABEFCDyysf3b0000zvuOptZZZDqyETxEDzvtnfyZZZTvhxASBGDyxjwg9YTZYClgANOCDBAHPXxTWXZZWP' +
    'NSVMQJLOJ000b5fuxyEIvqj10000000000000060100jwhEzdfGxkfvysrqornrl0RIHLx69PCEvuDx5mYMVPrqVVRSua0oWUVTWUUnCZQMQZXEpgfYSRXVsdnuPUMTMUMVZZZUOyIRSVRFAvKTKTKSqXJUwc4FZYGsTFRHXUqHZURYZPMPKOHZGZTSg00bjwHGLGDFD' +
    'EAFByzEAxxAuvxuSFOQKNNMSFOQKNNMVVVVGWRPOQJNSODWNIomTJUOENWPmMYvoRCLh83TjuEZZZZUmGLYxqJB0DUuAZZZZJRQFyLHlmpg4Ny5000000NONGTTkfeVZPNh3ZSusRRKgceTXOJdzPHq00015kCSRJp430URxxKXUWVSRTSTQROVRQSOUQQSNUQQQNRQQ' +
    'QSVSDACSJIqga0000AVSBc00000005sHSSCexBm06IRg0Er003000000GPMIDBzc00000000000000000000000yAnIOPCLLJwpErn50008tDNOQYWZZZYWMx000000000ASQSEGHEJybpPSNQSQOMOOKNENMNOJOJMOKILIMGGLINIDBqMLJug700000LJyGNNLlNH9' +
    '00007e800HUGFGnBrv7BHuDC00aW0RIKQ000000008losCHFyppe5000000ENWNWNWNWNWNVNWNWNWNVLMJAtyrtkmlghecdb8ec9cba995a94cb7984795ctzywyvnrsoib6dtkiuzsnttnef8d4773873775a97872864688885a7589bupum0000fk40020000000' +
    '0009vEFv836nvBJEzFqBNFpCAc7WIB8tff3000pCPSNKNNPOMJHHJHINFKOMEJLHGFIFvvEDwvvzABEHJJJxpujuEJIGEDBsrkBDyyDJJIJvvwuxwtvwvwxxvzywxBxyzBLIELFDEzuspqigji60200000000QGkJrMOLGEzqsuIysGEimwuwyxvwzDKOQVUOITrwMKi' +
    'mqDuqOrmNLIprIHloEGFpmGGyqzCDGDAyyywuAHHHIFCgiiggoAEMUFxyAvELJCxrnpljtyowtlnksohhtmmqrkrstruurmdxytutvACBxyxzuvwxwtuAwxtwyxxADEGEECFzGFBEACEEzFGDyuDEyvADDvuCCytuDxsDAyECuDCtCCvFEEBECEEGDFECzGDDBzEDBAB' +
    'ECzserItcCOQDmsrEPKLvfhjdfegebgahiceihcbfijhCskgifhjeclrszvBCyByzzxEBBuqywJDyoBxuAAvCAtxGDqqusAyrqmnhHLDuuLzAGECJxvIEAroojDAEKIGANICwEBtDCxFFtsDvikwixtoiqkgLJDtCGzDGyFEvsJHrnqrctsxDEzzyvvyywuwtuGSLGGE' +
    'f000000000000000000000000000000000', 20);

  const SPEAK = [
    [23.9, 32.3, 'host'], [47.45, 50.2, 'host'], [52.25, 52.9, 'host'], [53.5, 57.2, 'host'],
    [62.2, 68.45, 'host'], [70.3, 72.3, 'host'], [79.2, 81.4, 'host'],
    [88.5, 91.9, 'driver'], [97.05, 101.3, 'pilot'], [102.2, 103.3, 'pilot'],
    [110.25, 111.1, 'radar'], [118.35, 121.74, 'radar']
  ];

  function speaking(who, t) {
    return SPEAK.some(([a, b, w]) => w === who && t >= a && t < b);
  }

  function mouthOf(who, t, rest) {
    if (!speaking(who, t)) return rest || 'shut';
    const v = VOICE(t);
    if (v < 0.3) return rest === 'chew' ? 'chew' : 'shut';
    if (v > 0.86) return 'wide';
    return frac(t * 3.1) < 0.3 ? 'o' : 'open';
  }

  function blink(t, seed) {
    const p = 2.9 + (seed % 5) * 0.41;
    return ((t + seed * 0.73) % p) < 0.11;
  }

  function hermite(p0, p1, p2, p3, t0, t1, t2, t3, t) {
    const h = t2 - t1;
    const u = clamp((t - t1) / h, 0, 1);
    const u2 = u * u, u3 = u2 * u;
    const m1 = ((p2 - p0) / Math.max(1e-4, t2 - t0)) * h * 0.8;
    const m2 = ((p3 - p1) / Math.max(1e-4, t3 - t1)) * h * 0.8;
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
    const vec = (x) => Array.isArray(x) && num(x[0]);
    return (t) => {
      const n = full.length;
      if (t <= full[0][0]) return Object.assign({}, full[0][1]);
      if (t >= full[n - 1][0]) return Object.assign({}, full[n - 1][1]);
      let i = 1;
      while (i < n && t >= full[i][0]) i++;
      const [t1, a] = full[i - 1], [t2, b] = full[i];
      const [t0, z] = full[Math.max(0, i - 2)], [t3, c] = full[Math.min(n - 1, i + 1)];
      const tz = i - 2 >= 0 ? t0 : t1 - 1, tc = i + 1 < n ? t3 : t2 + 1;
      const out = {};
      Object.keys(Object.assign({}, a, b)).forEach(key => {
        const va = a[key] !== undefined ? a[key] : b[key], vb = b[key] !== undefined ? b[key] : va;
        if (num(va) && num(vb)) {
          out[key] = hermite(num(z[key]) ? z[key] : va, va, vb, num(c[key]) ? c[key] : vb, tz, t1, t2, tc, t);
        } else if (vec(va) && vec(vb) && va.length === vb.length) {
          out[key] = va.map((v, j) => hermite(vec(z[key]) ? z[key][j] : v, v, vb[j], vec(c[key]) ? c[key][j] : vb[j], tz, t1, t2, tc, t));
        } else {
          out[key] = (t - t1) / (t2 - t1) < 0.5 ? va : vb;
        }
      });
      return out;
    };
  }

  const ENVS = {
    office: { sunDir: [0.45, -0.55, -0.7], sunColor: [0.5, 0.46, 0.42], ambTop: [0.84, 0.76, 0.74], ambBottom: [0.46, 0.38, 0.38], fogColor: [0.92, 0.82, 0.8], fogNear: 30, fogFar: 60, points: [{ pos: [-0.6, 2.2, 1.0], color: [0.25, 0.2, 0.18] }] },
    diner: { sunDir: [-0.3, -0.8, -0.4], sunColor: [0.45, 0.42, 0.38], ambTop: [0.85, 0.82, 0.78], ambBottom: [0.4, 0.36, 0.32], fogColor: [0.75, 0.68, 0.58], fogNear: 8, fogFar: 22 },
    studio: { sunDir: [0.2, 1, 0.1], sunColor: [0.5, 0.42, 0.25], ambTop: [0.7, 0.6, 0.42], ambBottom: [1.1, 0.95, 0.65], fogColor: [0.86, 0.72, 0.48], fogNear: 4, fogFar: 14 },
    hut: { sunDir: [0.35, -0.5, -0.8], sunColor: [0.5, 0.44, 0.34], ambTop: [0.8, 0.72, 0.6], ambBottom: [0.44, 0.36, 0.28], fogColor: [0.7, 0.55, 0.38], fogNear: 30, fogFar: 60 },
    truck: { sunDir: [-0.2, -0.3, -1], sunColor: [0.3, 0.32, 0.34], ambTop: [0.62, 0.64, 0.66], ambBottom: [0.18, 0.18, 0.19], fogColor: [0.92, 0.94, 0.96], fogNear: 30, fogFar: 60, points: [{ pos: [0.4, 1.6, 1.3], color: [0.6, 0.62, 0.66] }] },
    sky: { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0.55, 0.8, 0.95], fogNear: 200, fogFar: 400 },
    radar: { sunDir: [0.5, -0.6, -0.6], sunColor: [0.42, 0.42, 0.4], ambTop: [0.86, 0.85, 0.82], ambBottom: [0.48, 0.47, 0.44], fogColor: [0.85, 0.84, 0.8], fogNear: 30, fogFar: 60, points: [{ pos: [0.6, 2.2, 1.2], color: [0.3, 0.3, 0.28] }] },
    card: { sunDir: [0.4, -0.3, -1], sunColor: [0.55, 0.55, 0.55], ambTop: [0.7, 0.7, 0.7], ambBottom: [0.25, 0.25, 0.25], fogColor: [0.07, 0.07, 0.08], fogNear: 30, fogFar: 60 },
    smiley: { sunDir: [0.4, -0.5, -0.8], sunColor: [0.55, 0.52, 0.45], ambTop: [0.75, 0.72, 0.68], ambBottom: [0.45, 0.42, 0.38], fogColor: [1, 1, 1], fogNear: 30, fogFar: 60 }
  };

  function lumM(tint) {
    const w = [0.3, 0.59, 0.11];
    const m = new Float32Array(9);
    for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) m[c * 3 + r] = w[c] * tint[r];
    return m;
  }

  function hueM(deg, sat) {
    const a = (deg * PI) / 180;
    const cs = C(a), sn = S(a);
    const s = sat === undefined ? 1 : sat;
    const lr = 0.213, lg = 0.715, lb = 0.072;
    const rows = [
      [lr + cs * (1 - lr) + sn * -lr, lg + cs * -lg + sn * -lg, lb + cs * -lb + sn * (1 - lb)],
      [lr + cs * -lr + sn * 0.143, lg + cs * (1 - lg) + sn * 0.14, lb + cs * -lb + sn * -0.283],
      [lr + cs * -lr + sn * -(1 - lr), lg + cs * -lg + sn * lg, lb + cs * (1 - lb) + sn * lb]
    ];
    const m = new Float32Array(9);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const grey = [lr, lg, lb][c];
      m[c * 3 + r] = grey + (rows[r][c] - grey) * s;
    }
    return m;
  }

  const LOOKS = {
    invert: { colorM: new Float32Array([-1, 0, 0, 0, -1, 0, 0, 0, -1]), colorAdd: [1, 1, 1] },
    teal: { colorM: new Float32Array([-0.6, 0, 0, 0, -1, 0, 0, 0, -1]), colorAdd: [0.75, 1.05, 1.0] },
    grey: { colorM: lumM([1.05, 1.0, 0.95]), colorAdd: [0, 0, 0] },
    red: { colorM: lumM([1.6, 0.06, 0.05]), colorAdd: [0.25, 0, 0] },
    purple: { colorM: new Float32Array([0.85, 0, 0, 0, 0.62, 0, 0, 0, 1.05]), colorAdd: [0.14, 0.06, 0.3] },
    green: { colorM: hueM(110, 1.4), colorAdd: [0, 0.02, 0] },
    psy: { colorM: hueM(200, 2.6), colorAdd: [0.05, -0.1, 0.1] },
    pink: { colorM: hueM(130, 1.3), colorAdd: [0.18, 0.0, 0.08] },
    lime: { colorM: hueM(-110, 1.2), colorAdd: [0.05, 0.12, 0.0] },
    bright: { colorM: null, colorAdd: [0.28, 0.27, 0.25] },
    bw: { colorM: lumM([1, 1, 1]), colorAdd: [0, 0, 0] }
  };

  const CAMS = {
    lunchTight: { eye: [-1.9, 1.3, 1.23], at: [-1.69, 1.28, 0.26], fov: 38 },
    lunchWide: { eye: [0.04, 1.3, 1.18], at: [-0.09, 1.24, 0.19], fov: 42 },
    lunchMed: { eye: [0.04, 1.3, 1.18], at: [-0.02, 1.26, 0.19], fov: 34 },
    lunchMirror: { eye: [0.04, 1.3, 1.18], at: [-0.09, 1.24, 0.19], fov: 42, mirror: true },
    hostClose: { eye: [-0.07, 0.9, 0.0], at: [0.06, 1.15, -0.92], fov: 32 },
    hostTight: { eye: [-0.13, 1.21, -0.27], at: [0.26, 1.15, -1.19], fov: 25 },
    vas: { eye: [0.3, 1.6, -1.3], at: [0.32, 1.58, -1.6], fov: 72 },
    standBack: { eye: [-0.3, 1.5, -0.35], at: [0.32, 1.42, -1.4], fov: 40 },
    standMed: { eye: [0.24, 1.37, 0.04], at: [0.2, 1.48, -0.95], fov: 40 },
    standClose: { eye: [-0.6, 1.37, -0.23], at: [0.03, 1.42, -1.01], fov: 40 },
    standWide: { eye: [0.1, 1.45, 0.9], at: [0.3, 1.38, -1.25], fov: 46 },
    standLong: { eye: [0.15, 1.5, 2.4], at: [0.15, 1.25, -1.2], fov: 40, mirror: true },
    standZoom: { eye: [0.15, 1.45, -0.45], at: [0.15, 1.35, -1.25], fov: 30 },
    blinds: { eye: [0.24, 1.37, 0.04], at: [0.2, 1.48, -0.95], fov: 40 },
    deskClose: { eye: [0.21, 1.4, -0.15], at: [0.19, 1.1, -1.1], fov: 34 },
    deskTight: { eye: [0.16, 1.0, 0.09], at: [0.19, 1.14, -0.9], fov: 30, mirror: true },
    deskWide: { eye: [0.31, 1.35, 1.6], at: [0.17, 1.27, 0.61], fov: 40 },
    deskFar: { eye: [0.31, 1.35, 1.75], at: [0.17, 1.27, 0.76], fov: 41 },
    deskLaugh: { eye: [0.05, 0.98, -0.12], at: [0.07, 1.16, -1.11], fov: 32 },
    diner: { eye: [-1.35, 1.65, 0.75], at: [0.6, 0.9, -0.15], fov: 52 },
    hut: { eye: [0.32, 1.32, 0.95], at: [0.34, 1.42, -0.95], fov: 50 },
    truck: { eye: [-0.5, 1.48, 0.28], at: [0.7, 1.3, 0.05], fov: 64 },
    radarClose: { eye: [-0.43, 1.22, 0.47], at: [-0.24, 1.26, -0.51], fov: 48 },
    radarFace: { eye: [-0.6, 1.0, -0.03], at: [-0.22, 1.43, -0.85], fov: 44 },
    radarWide: { eye: [1.9, 1.85, 2.0], at: [0.1, 1.0, -0.5], fov: 46 },
    radarEnd: { eye: [1.9, 1.85, 2.0], at: [0.1, 0.95, -0.55], fov: 46 },
    radarFish: { eye: [-0.2, 1.3, 0.62], at: [-0.2, 1.2, -0.6], fov: 72 }
  };

  const SEAT = { pos: [0.2, 0.62, -1.2], yaw: 0, lean: 0.1, fLw: [0.33, 0.07, -0.72], fRw: [0.07, 0.07, -0.72], kL: [0.1, 0, 1], kR: [-0.1, 0, 1], eyes: 'open' };
  const STAND = { pos: [0.3, 1.0, -1.25], yaw: 0, lean: 0, fL: [0.15, -0.9, 0.03], fR: [-0.15, -0.9, 0.03], eyes: 'open' };

  const HOST_LUNCH = track([
    [22.0, Object.assign({}, SEAT, { yaw: -0.5, sp: [0.06, -0.1, 0], nk: [-0.14, -0.3, 0.06], hR: [-0.1, 0.0, 0.3], gR: 'hold', hL: [0.26, -0.18, 0.3], gL: 'open', eL: [0.6, -0.3, -0.5] })],
    [23.3, { nk: [-0.18, -0.36, 0.08], hR: [-0.12, 0.04, 0.3] }],
    [24.2, { hR: [-0.1, 0.12, 0.28], hL: [0.24, -0.06, 0.34], gL: 'spread' }],
    [25.0, { nk: [-0.1, -0.2, -0.04], hL: [0.3, -0.1, 0.36], hR: [-0.1, 0.06, 0.3] }],
    [26.0, { nk: [-0.16, -0.34, 0.06], hL: [0.22, -0.02, 0.34], gL: 'open' }],
    [27.0, { hR: [-0.08, 0.14, 0.26], hL: [0.3, -0.12, 0.32] }],
    [29.6, { nk: [-0.2, -0.4, 0.08], hL: [0.24, -0.04, 0.36], gL: 'spread' }],
    [30.6, { hL: [0.3, -0.12, 0.34], gL: 'open' }],
    [31.5, { hL: [0.22, 0.02, 0.36], gL: 'spread' }],
    [32.3, { nk: [-0.14, -0.55, 0.04], hL: [0.28, -0.1, 0.34] }],
    [32.8, { nk: [-0.08, -0.15, 0.0], yaw: -0.25 }],
    [33.9, { yaw: -0.15, nk: [-0.06, 0.05, 0.0], hR: [-0.06, 0.1, 0.32], eyes: 'wide' }],
    [35.0, { yaw: -0.45, nk: [-0.16, -0.35, 0.06], eyes: 'open' }],
    [36.2, { yaw: -0.12, nk: [-0.04, 0.05, 0.0], eyes: 'wide', hR: [-0.04, 0.12, 0.34] }],
    [41.6, { yaw: -0.08, nk: [-0.02, 0.02, 0.0], hR: [-0.04, 0.14, 0.34] }]
  ]);

  function hostLunch(t) {
    const p = HOST_LUNCH(t);
    p.mouth = t > 33.85 && t < 41.6 ? (frac(t * 1.7) < 0.55 ? 'chew' : 'shut') : mouthOf('host', t);
    if (blink(t, 1) && p.eyes !== 'wide') p.eyes = 'shut';
    return p;
  }

  const WAITER = track([
    [22.0, { pos: [-0.72, 1.02, -1.05], yaw: 1.0, lean: 0.08, sp: [0.12, 0, 0], nk: [0.32, 0.1, 0], hL: [0.1, -0.24, 0.3], gL: 'hold', hR: [-0.02, -0.2, 0.34], gR: 'hold', eR: [-0.6, -0.4, -0.4], fL: [0.12, -0.92, 0.02], fR: [-0.14, -0.92, 0.0], eyes: 'half', mouth: 'shut', prop: 'pad' }],
    [23.3, { hR: [0.0, -0.18, 0.35] }],
    [24.0, { hR: [-0.04, -0.21, 0.32] }],
    [24.8, { hR: [0.02, -0.19, 0.34] }],
    [26.3, { hR: [-0.02, -0.08, 0.34], nk: [0.26, 0.1, 0] }],
    [26.6, { hR: [0.1, -0.18, 0.32] }],
    [27.3, { hR: [0.0, -0.2, 0.33] }],
    [29.5, { lean: 0.04, sp: [0.06, 0, 0], nk: [0.12, 0.25, 0], hL: [0.18, -0.28, 0.12], gL: 'relax', hR: [-0.05, -0.12, 0.38], gR: 'hold', eyes: 'open', prop: 'roll' }],
    [31.6, { nk: [0.08, 0.3, 0], hR: [-0.02, -0.1, 0.4] }],
    [32.15, { pos: [-0.76, 1.02, -1.05], yaw: 1.0 }],
    [32.35, { pos: [-0.95, 0.99, -1.05], yaw: -1.6, lean: 0.2 }],
    [32.7, { pos: [-2.6, 0.99, -0.9], yaw: -1.6 }],
    [34.95, { pos: [-2.4, 0.99, -0.9], yaw: 1.5, prop: 'pad', hL: [0.1, -0.24, 0.3], gL: 'hold', hR: [-0.02, -0.2, 0.34] }],
    [35.25, { pos: [-0.72, 1.02, -1.05], yaw: 1.0, lean: 0.08, nk: [0.32, 0.1, 0], eyes: 'half' }],
    [41.6, {}]
  ]);

  function waiterPose(t) {
    const p = WAITER(t);
    const run = t > 32.15 && t < 35.3;
    if (run) {
      const ph = t * 9;
      p.fL = [0.12, -0.85 + Math.max(0, S(ph)) * 0.15, 0.1 * S(ph)];
      p.fR = [-0.14, -0.85 + Math.max(0, -S(ph)) * 0.15, -0.1 * S(ph)];
    }
    return p;
  }

  const LADY_BASE = [
    { pos: [0.58, 0.64, 0.05], yaw: -PI / 2, look: 0, talk: true },
    { pos: [-0.58, 0.64, -0.12], yaw: PI / 2, look: 1 },
    { pos: [2.98, 0.64, 0.1], yaw: -PI / 2, look: 3 },
    { pos: [1.82, 0.64, -0.05], yaw: PI / 2, look: 4 },
    { pos: [5.38, 0.64, 0.0], yaw: -PI / 2, look: 2 },
    { pos: [4.22, 0.64, 0.12], yaw: PI / 2, look: 1 }
  ];

  function dinerCast(t) {
    return LADY_BASE.map((l, i) => {
      const ph = t * (1.3 + i * 0.37) + i;
      const talk = l.talk ? (S(t * 7) > -0.2 ? 'open' : 'shut') : i === 3 && S(t * 5) > 0.3 ? 'open' : 'shut';
      const fx = l.pos[0] + S(l.yaw) * 0.45;
      return {
        who: 'lady', look: l.look,
        pose: {
          pos: l.pos, yaw: l.yaw + S(ph * 0.5) * 0.12, lean: 0.12, sp: [0.05, S(ph) * 0.1, 0], nk: [0.05 + S(ph * 1.3) * 0.06, S(ph * 0.8) * 0.3, 0],
          hL: [0.2 + S(ph * 2) * 0.05, 0.04, 0.32 + S(ph) * 0.05], hR: [-0.18, 0.0 + (l.talk ? Math.max(0, S(ph * 2.2)) * 0.18 : 0), 0.34], gL: 'relax', gR: l.talk ? 'open' : 'hold',
          fLw: [fx, 0.07, l.pos[2] + 0.13], fRw: [fx, 0.07, l.pos[2] - 0.13], eyes: blink(t, i + 3) ? 'half' : 'open', mouth: talk
        }
      };
    });
  }

  const HOST_STAND = track([
    [45.3, Object.assign({}, STAND, { pos: [0.32, 1.0, -1.3], yaw: PI - 0.15, nk: [0.0, 0.2, 0], hR: [-0.02, 0.38, 0.32], gR: 'point', hL: [0.12, 0.34, 0.32], gL: 'point', eyes: 'open', mouth: 'shut' })],
    [45.9, { nk: [0.05, 0.1, 0], hR: [-0.02, 0.33, 0.33] }],
    [46.15, { yaw: 1.6, nk: [0, 0.3, 0] }],
    [46.45, { yaw: -0.15, nk: [0.02, -0.1, 0.05], hR: [-0.1, -0.15, 0.28], gR: 'relax', hL: [0.28, 0.12, 0.38], gL: 'point', mouth: 'smile' }],
    [46.9, { yaw: -0.1, hL: [0.22, 0.05, 0.42], gL: 'gun', hR: [-0.3, -0.05, 0.35], gR: 'fist' }],
    [47.3, { yaw: 0.15, hL: [0.3, 0.04, 0.46], hR: [-0.22, -0.05, 0.4], gR: 'gun', roll: 0.04 }],
    [47.7, { yaw: -0.1, hL: [0.24, -0.02, 0.42], hR: [-0.32, 0.03, 0.44], roll: -0.04 }],
    [48.1, { yaw: 0.12, hL: [0.32, 0.06, 0.46], hR: [-0.24, -0.06, 0.42], roll: 0.04 }],
    [48.5, { yaw: -0.08, hL: [0.24, -0.02, 0.4], hR: [-0.3, 0.04, 0.46], roll: -0.03 }],
    [48.9, { yaw: 0.12, hL: [0.3, 0.06, 0.46], hR: [-0.22, -0.04, 0.4], roll: 0.04 }],
    [49.3, { yaw: -0.06, hL: [0.26, -0.02, 0.42], hR: [-0.3, 0.04, 0.44], roll: -0.02 }],
    [49.75, { yaw: 0.0, hL: [0.3, 0.12, 0.36], gL: 'spread', hR: [-0.3, 0.12, 0.36], gR: 'spread', mouth: 'wide' }],
    [50.3, { hL: [0.32, 0.2, 0.3], hR: [-0.32, 0.2, 0.3] }],
    [50.4, { yaw: 2.4, nk: [0.0, 0.3, 0], hR: [-0.02, 0.33, 0.32], gR: 'point', hL: [0.2, -0.2, 0.2], gL: 'relax', mouth: 'shut' }],
    [51.0, { yaw: 2.6 }],
    [53.1, { yaw: 0, nk: [0, 0, 0], hL: [0.62, 0.08, 0.18], gL: 'thumb', hR: [-0.62, 0.08, 0.18], gR: 'thumb', roll: 0, mouth: 'open' }],
    [53.7, { hL: [0.6, 0.12, 0.2], hR: [-0.6, 0.04, 0.2], roll: 0.04 }],
    [54.3, { hL: [0.56, 0.0, 0.25], gL: 'spread', hR: [-0.56, -0.04, 0.25], gR: 'spread', roll: -0.04 }],
    [54.9, { yaw: 0.45, hL: [0.3, -0.02, 0.32], gL: 'relax', hR: [-0.2, 0.02, 0.35], gR: 'relax', roll: 0.05 }],
    [55.3, { yaw: -0.2, hL: [0.5, 0.0, 0.25], gL: 'spread', hR: [-0.5, 0.02, 0.25], gR: 'spread', roll: -0.06 }],
    [55.75, { yaw: 0.0, pos: [0.15, 1.0, -1.25], hL: [0.52, -0.05, 0.25], hR: [-0.52, 0.05, 0.25], roll: 0 }],
    [56.2, { yaw: 0.15, hL: [0.36, 0.0, 0.32], gL: 'thumb', hR: [-0.4, -0.1, 0.3], gR: 'relax', roll: 0.05 }],
    [56.6, { yaw: -0.15, hL: [0.42, 0.2, 0.28], hR: [-0.45, -0.05, 0.3], gR: 'thumb', roll: -0.05 }],
    [57.2, { yaw: 0.1, hL: [0.5, 0.0, 0.25], gL: 'spread', hR: [-0.5, 0.02, 0.25], gR: 'spread', roll: 0 }]
  ]);

  function hostStand(t) {
    const p = HOST_STAND(t);
    if (t > 46.4 && t < 57.2 && !(t > 50.38 && t < 53.1)) {
      if (speaking('host', t)) p.mouth = mouthOf('host', t, 'smile');
      p.pos = [p.pos[0], p.pos[1] - Math.abs(S(t * 6.2)) * 0.025, p.pos[2]];
    }
    if (blink(t, 2) && p.eyes === 'open') p.eyes = 'shut';
    return p;
  }

  const NOSE = track([
    [57.2, { pos: [0.3, 0.86, -0.6], yaw: PI, lean: 0.25, nk: [-0.25, 0, 0], hL: [0.12, 0.5, 0.25], gL: 'hold', hR: [-0.12, 0.48, 0.25], gR: 'hold', fL: [0.13, -0.9, 0.0], fR: [-0.13, -0.9, 0.0], eyes: 'open', sheet: 'wall', tear: 0 }],
    [57.7, { hL: [0.1, 0.42, 0.3], nk: [-0.2, 0.1, 0] }],
    [57.85, { tear: 1, sheet: 'hand' }],
    [58.05, { yaw: 0.6, nk: [0.1, -0.3, 0], hL: [0.25, 0.08, 0.32], hR: [-0.1, 0.0, 0.32] }],
    [58.4, { yaw: 0.1, nk: [0.18, 0.15, 0] }],
    [59.0, { yaw: 0.0, nk: [0.12, 0.0, 0.08], hL: [0.22, 0.12, 0.34] }],
    [59.3, { yaw: PI - 0.5, nk: [-0.15, 0, 0], hL: [0.2, 0.2, 0.3] }],
    [59.9, { yaw: PI, hL: [0.15, 0.32, 0.3], hR: [-0.15, 0.3, 0.28] }],
    [60.25, { yaw: 0.0, nk: [0.0, 0, 0], hL: [0.48, 0.05, 0.2], gL: 'spread', hR: [-0.48, 0.05, 0.2], gR: 'spread' }],
    [60.5, { yaw: 0.3 }],
    [60.75, { yaw: PI, nk: [-0.25, 0, 0], hL: [0.12, 0.48, 0.25], gL: 'hold', hR: [-0.12, 0.48, 0.25], gR: 'hold' }],
    [60.9, { tear: 0, sheet: 'wall' }],
    [61.5, {}]
  ]);

  function nosePose(t) {
    const p = NOSE(t);
    if (blink(t, 4)) p.eyes = 'shut';
    return p;
  }

  const HOST_DESK = track([
    [61.4, Object.assign({}, SEAT, { yaw: -0.25, lean: 0.35, sp: [0.25, 0.1, 0], nk: [0.35, 0.2, 0], hL: [0.25, -0.2, 0.36], gL: 'relax', hR: [-0.2, -0.2, 0.36], gR: 'relax', eyes: 'half' })],
    [61.75, { yaw: 0, lean: 0.12, sp: [0.05, 0, 0], nk: [-0.04, 0, 0], eyes: 'open' }],
    [62.15, { hR: [-0.05, 0.26, 0.44], gR: 'point', eR: [-0.5, -0.4, -0.3] }],
    [62.5, { hR: [-0.08, 0.28, 0.42] }],
    [62.85, { hR: [-0.22, -0.18, 0.34], gR: 'relax' }],
    [63.8, { nk: [-0.02, 0.08, -0.04] }],
    [64.6, { nk: [-0.02, -0.06, 0.04] }],
    [65.15, { hR: [-0.12, 0.32, 0.34], gR: 'point', nk: [0.0, 0.0, -0.06] }],
    [65.6, { hR: [-0.16, 0.2, 0.36], gR: 'fist' }],
    [65.95, { hR: [-0.06, 0.32, 0.38], gR: 'point' }],
    [66.25, { hR: [-0.36, 0.3, 0.28], hL: [0.38, 0.32, 0.28], gL: 'point', gR: 'point' }],
    [66.6, { hR: [-0.22, 0.12, 0.34], gR: 'fist', hL: [0.32, 0.22, 0.32] }],
    [66.95, { hL: [0.34, 0.4, 0.28], gL: 'point', hR: [-0.28, -0.1, 0.34], gR: 'relax' }],
    [67.3, { hR: [-0.12, 0.38, 0.3], gR: 'point', hL: [0.25, -0.2, 0.36], gL: 'relax' }],
    [67.6, { lean: 0.32, sp: [0.25, 0.15, 0], nk: [0.4, 0.25, 0], eyes: 'half' }],
    [68.2, {}]
  ]);

  const HOST_VHS = track([
    [68.2, Object.assign({}, STAND, { pos: [0.05, 0.98, -1.15], yaw: -0.1, lean: 0.45, sp: [0.3, -0.2, 0], nk: [-0.2, -0.3, 0], hRw: [-0.6, 0.86, -0.3], gR: 'open', hLw: [0.35, 0.8, -0.6], gL: 'open', eyes: 'open', mouth: 'smile' })],
    [68.6, { hRw: [-0.95, 0.88, -0.25], sp: [0.3, -0.35, 0] }],
    [69.0, { lean: 0.3, sp: [0.15, -0.1, 0], hRw: [-0.3, 1.75, -0.95], gR: 'hold', hLw: [0.4, 0.82, -0.55], nk: [-0.25, -0.1, 0.1], tape: true }],
    [69.6, { hRw: [-0.15, 1.85, -1.0] }],
    [70.05, { hRw: [0.05, 1.7, -0.7], gR: 'open', tape: false }],
    [70.55, Object.assign({}, SEAT, { pos: [0.1, 0.62, -1.2], yaw: 0, lean: 0.12, sp: [0.05, 0, 0], nk: [0, 0, 0], hLw: [0.35, 0.82, -0.62], hRw: [-0.12, 0.82, -0.62], gL: 'open', gR: 'open', mouth: 'shut' })],
    [71.4, { nk: [0, 0.1, 0.03], hLw: [0.32, 0.84, -0.55] }],
    [72.4, { hRw: [0.05, 1.16, -0.9], gR: 'fist', hLw: [0.16, 1.15, -0.9], gL: 'fist', nk: [0.1, 0, 0] }],
    [72.75, { hRw: [0.06, 1.17, -0.89], hLw: [0.17, 1.16, -0.9] }],
    [73.0, {}],
    [73.05, { yaw: -0.2, lean: 0.25, hRw: [-0.55, 0.95, -0.3], gR: 'point', hLw: [0.3, 0.82, -0.6], nk: [0, -0.2, 0] }],
    [74.3, { hRw: [-0.62, 0.95, -0.25] }],
    [76.5, { yaw: 0, lean: 0.12, hLw: [0.2, 0.85, -0.6], hRw: [-0.02, 0.86, -0.62], gL: 'fist', gR: 'fist', nk: [0, 0, 0] }],
    [77.8, { hLw: [0.25, 0.9, -0.55], gL: 'open', hRw: [-0.08, 0.9, -0.55], gR: 'open' }],
    [78.4, { hLw: [0.18, 0.86, -0.6], gL: 'fist', hRw: [0.0, 0.86, -0.6], gR: 'fist' }],
    [80.5, { nk: [0.05, -0.08, 0] }],
    [82.0, { nk: [0.0, 0.08, 0] }],
    [83.0, { hLw: [0.55, 1.12, -0.6], gL: 'spread', hRw: [-0.35, 1.1, -0.6], gR: 'spread', mouth: 'smile' }],
    [83.4, { hLw: [0.6, 1.2, -0.6], hRw: [-0.42, 1.18, -0.6] }],
    [83.8, { hLw: [0.5, 1.08, -0.6], hRw: [-0.3, 1.05, -0.6] }],
    [84.2, {}]
  ]);

  function hostDesk(t) {
    const p = t < 68.2 ? HOST_DESK(t) : HOST_VHS(t);
    if (speaking('host', t)) p.mouth = mouthOf('host', t, p.mouth === 'smile' ? 'smile' : 'shut');
    if (t > 72.4 && t < 73.05) p.mouth = 'smile';
    if (blink(t, 5) && p.eyes === 'open') p.eyes = 'shut';
    return p;
  }

  const DRIVER = track([
    [84.0, { pos: [0.2, 0.75, -0.15], yaw: 0, lean: -0.05, sp: [0, 0, 0], nk: [-0.05, 0.25, 0], hLw: [0.43, 1.32, 0.48], gL: 'fist', hRw: [0.1, 1.12, 0.4], gR: 'fist', fLw: [0.37, 0.52, 0.45], fRw: [0.1, 0.52, 0.45], kL: [0, 0.4, 1], kR: [0, 0.4, 1], eyes: 'half', wheel: 0 }],
    [84.9, { hRw: [0.8, 1.0, 0.2], gR: 'hold' }],
    [85.4, { hRw: [0.85, 1.02, 0.17], wheel: 0.05 }],
    [85.9, { hRw: [0.15, 1.15, 0.42], gR: 'fist', wheel: -0.1 }],
    [86.8, { hRw: [0.8, 1.0, 0.2], gR: 'hold', nk: [-0.05, 0.4, 0] }],
    [87.4, { hRw: [0.87, 1.02, 0.15], wheel: 0.1 }],
    [88.2, { hRw: [0.13, 1.14, 0.4], gR: 'fist', nk: [-0.02, 0.15, 0], eyes: 'open' }],
    [89.0, { nk: [-0.02, 0.5, 0.05], wheel: -0.15 }],
    [89.6, { hRw: [0.81, 1.0, 0.2], gR: 'hold' }],
    [90.2, { hRw: [0.85, 1.03, 0.14], nk: [-0.05, 0.3, 0] }],
    [90.8, { hRw: [0.15, 1.15, 0.42], gR: 'fist', wheel: 0.05 }],
    [91.4, { hRw: [0.8, 1.0, 0.2], gR: 'hold' }],
    [92.0, { hRw: [0.87, 1.03, 0.15], wheel: -0.05 }],
    [92.5, {}]
  ]);

  function driverPose(t) {
    const p = DRIVER(t);
    p.mouth = mouthOf('driver', t);
    if (blink(t, 6)) p.eyes = 'half';
    return p;
  }

  const RADAR = track([
    [106.0, { pos: [0.3, 1.0, -0.62], yaw: -1.25, lean: 0.55, sp: [0.25, 0, 0], nk: [-0.25, -0.15, 0], hLw: [-0.05, 0.8, -0.72], gL: 'open', hRw: [0.22, 0.79, -0.86], gR: 'open', fL: [0.14, -0.9, 0.1], fR: [-0.14, -0.9, -0.1], eyes: 'open' }],
    [106.4, { hLw: [-0.12, 1.08, -0.78], gL: 'point' }],
    [106.9, { hLw: [-0.05, 0.8, -0.72], gL: 'open', eyes: 'wide' }],
    [108.0, { lean: 0.7, nk: [-0.35, -0.1, 0] }],
    [108.7, { lean: 0.55, nk: [-0.2, -0.2, 0], eyes: 'open' }],
    [110.2, { nk: [-0.15, -0.25, 0] }],
    [112.6, { pos: [0.25, 1.0, -0.35], yaw: -1.6, lean: 0.75, sp: [0.3, 0.2, 0], nk: [-0.3, 0.2, 0], hLw: [-0.5, 0.82, -0.65], hRw: [-0.1, 0.8, -0.95], eyes: 'wide' }],
    [113.2, { pos: [0.45, 1.0, -0.25], yaw: -2.2, lean: 0.6, hLw: [0.2, 0.8, -0.7], hRw: [0.65, 0.85, -0.6] }],
    [113.8, { pos: [0.75, 1.0, -0.2], yaw: -2.6, lean: 0.8, sp: [0.3, -0.3, 0], hLw: [0.9, 0.8, -0.75], hRw: [0.55, 0.82, -0.8] }],
    [114.4, { pos: [0.55, 1.0, -0.3], yaw: -1.9, lean: 0.5, sp: [0.1, 0.2, 0], hLw: [0.3, 1.1, -0.5], hRw: [0.1, 0.82, -0.85] }],
    [115.0, { pos: [0.25, 1.0, -0.35], yaw: -1.4, lean: 0.75, hLw: [-0.3, 0.8, -0.75], hRw: [0.1, 0.8, -0.9] }],
    [115.6, { pos: [0.5, 1.0, -0.25], yaw: -2.4, lean: 0.85, hLw: [0.65, 0.8, -0.75], hRw: [0.4, 0.85, -0.85] }],
    [116.3, { pos: [0.3, 1.0, -0.35], yaw: -1.5, lean: 0.6, sp: [0.2, 0.25, 0], hLw: [-0.2, 0.85, -0.7], hRw: [-0.05, 0.82, -0.9] }],
    [116.6, { pos: [0.3, 1.0, -0.62], yaw: -1.25, lean: 0.45, sp: [0.2, 0.3, 0], nk: [-0.1, 0.75, 0], hLw: [-0.05, 0.8, -0.72], hRw: [0.22, 0.79, -0.86], eyes: 'wide' }],
    [117.4, { nk: [-0.05, 0.85, 0] }],
    [118.0, { pos: [0.3, 1.0, -0.62], yaw: -1.25, lean: 0.55, nk: [-0.25, -0.15, 0], eyes: 'open' }],
    [118.8, { pos: [1.05, 1.0, 0.45], yaw: -0.35, lean: 0.25, sp: [0.1, 0, 0], nk: [0.05, 0.1, 0], hRw: [0.95, 1.5, 0.68], gR: 'hold', hLw: [1.3, 0.95, 0.55], gL: 'open', bun: true, eyes: 'wide' }],
    [119.6, { hRw: [0.92, 1.45, 0.78], nk: [0.1, 0.25, 0] }],
    [120.0, { pos: [2.6, 1.0, 1.0] }],
    [121.74, {}]
  ]);

  function radarPose(t) {
    const p = RADAR(t);
    const runs = t > 112.6 && t < 116.4;
    if (runs) {
      const ph = t * 10;
      p.fL = [0.14, -0.84 + Math.max(0, S(ph)) * 0.14, 0.12 * S(ph)];
      p.fR = [-0.14, -0.84 + Math.max(0, -S(ph)) * 0.14, -0.12 * S(ph)];
    }
    p.mouth = t > 118.8 ? (speaking('radar', t) ? mouthOf('radar', t, 'chew') : 'chew') : mouthOf('radar', t, t > 116.5 && t < 118 ? 'o' : 'shut');
    if (blink(t, 7) && p.eyes === 'open') p.eyes = 'half';
    return p;
  }

  const SHOTS = [
    [0, 'title', { title: 'adek', fade: [0, 0.65, 2.95, 3.4] }],
    [3.4, 'title', { title: 'amp', fade: [3.4, 3.9, 5.95, 6.35], alt: [[4.95, 5.4, 'amp2'], [5.55, 5.95, 'amp2']], mark: true }],
    [6.35, 'title', { title: 'or', fade: [6.35, 6.9, 8.2, 8.32] }],
    [8.32, 'bobs', { wipe: [8.32, 8.8], gum: 9.5, bug: false }],
    [10.18, 'actor', { pixel: [11.35, 11.65], bug: false }],
    [11.65, 'title', { title: 'chizh' }],
    [11.82, 'title', { title: 'calamburg' }],
    [12.57, 'title', { title: 'blank', over: [[12.57, 13.95, 'news']], swap: [[12.75, 12.85, 'privet'], [13.45, 13.55, 'chizh'], [13.65, 13.85, 'privet']] }],
    [13.95, 'title', { title: 'calamburg', shrink: [[13.95, 1.0, 0.96], [14.45, 0.96, 0.86], [14.95, 0.6, 0.6], [15.45, 0.35, 0.3], [15.95, 0.0, 0.0]] }],
    [16.38, 'dtb', {}],
    [16.82, 'title', { title: 'cal', fade: [16.82, 17.45, 99, 99], swap: [[19.9, 20.37, 'cum']], big: [20.37, 21.4], out: [21.4, 21.6], mix: [22.05, 22.37] }],
    [22.37, 'office', { cam: 'lunchTight', host: 'lunch', waiter: true, lunch: true, stutter: [22.37, 23.3, 0.36] }],
    [23.25, 'office', { cam: 'lunchWide', host: 'lunch', waiter: true, lunch: true, stutter: [23.25, 23.42, 0.12] }],
    [23.42, 'office', { cam: 'lunchWide', host: 'lunch', waiter: true, lunch: true }],
    [25.25, 'office', { cam: 'lunchMed', host: 'lunch', waiter: true, lunch: true }],
    [25.38, 'office', { cam: 'lunchWide', host: 'lunch', waiter: true, lunch: true }],
    [25.5, 'office', { cam: 'lunchMed', host: 'lunch', waiter: true, lunch: true }],
    [25.63, 'office', { cam: 'lunchWide', host: 'lunch', waiter: true, lunch: true }],
    [27.55, 'diner', { cam: 'diner' }],
    [29.5, 'office', { cam: 'lunchWide', host: 'lunch', waiter: true, lunch: true }],
    [33.88, 'office', { cam: 'hostClose', host: 'lunch', lunch: true, mirrorAt: [34.42, 34.95] }],
    [34.95, 'office', { cam: 'lunchWide', host: 'lunch', waiter: true, lunch: true, blur: [34.95, 35.3] }],
    [36.2, 'office', { cam: 'hostClose', host: 'lunch', lunch: true }],
    [37.0, 'office', { cam: 'lunchMirror', host: 'lunch', waiter: true, lunch: true, ghost: { from: 37.0, to: 37.5, at: 39.0, cam: 'hostTight', alpha: 0.45 } }],
    [37.5, 'office', { cam: 'lunchMirror', host: 'lunch', waiter: true, lunch: true }],
    [38.0, 'office', { cam: 'hostClose', host: 'lunch', lunch: true, look: 'bright', lookFade: [38.0, 38.55] }],
    [38.55, 'office', { cam: 'hostClose', host: 'lunch', lunch: true }],
    [39.62, 'office', { cam: 'hostTight', host: 'lunch', lunch: true, sym: [40.8, 41.43, 'L'] }],
    [41.6, 'studio', { flash: [41.6, 42.0], look: [[42.92, 43.55, 'teal'], [43.55, 44.0, 'grey']], swoop: [44.0, 44.55] }],
    [44.55, 'office', { cam: 'vas', host: 'vas', over: [[44.55, 45.35, 'vas']], vas: true }],
    [45.3, 'office', { cam: 'standBack', host: 'stand' }],
    [46.3, 'office', { cam: 'standMed', host: 'stand', stutter: [48.1, 49.03, 0.0] }],
    [49.88, 'office', { cam: 'standMed', host: 'stand', flips: [49.88, 50.38] }],
    [50.38, 'office', { cam: 'standBack', host: 'stand', melt: [50.75, 51.0] }],
    [51.0, 'office', { cam: 'blinds', gap: [51.75, 53.13] }],
    [52.55, 'office', { cam: 'blinds', gap: [51.75, 53.13], look: 'red' }],
    [53.13, 'office', { cam: 'standClose', host: 'stand' }],
    [54.0, 'office', { cam: 'standWide', host: 'stand', look: 'purple' }],
    [54.55, 'office', { cam: 'standMed', host: 'stand' }],
    [55.73, 'office', { cam: 'standLong', host: 'stand', desk: true, keepBug: true }],
    [57.05, 'office', { cam: 'standZoom', host: 'stand', desk: true, stretch: true }],
    [57.2, 'hut', { cam: 'hut' }],
    [61.2, 'hut', { cam: 'hut', look: 'green' }],
    [61.48, 'office', { cam: 'deskClose', host: 'desk' }],
    [63.2, 'office', { cam: 'deskWide', host: 'desk', vhs: 1, flash: [63.2, 63.32] }],
    [63.32, 'office', { cam: 'deskClose', host: 'desk' }],
    [66.88, 'office', { cam: 'deskTight', host: 'desk' }],
    [67.3, 'office', { cam: 'deskClose', host: 'desk' }],
    [68.2, 'office', { cam: 'deskWide', host: 'desk', vhs: 'fall' }],
    [70.15, 'office', { cam: 'deskWide', host: 'desk', vhs: 1, red: [70.15, 70.55], thrown: [70.05, 70.9] }],
    [70.55, 'office', { cam: 'deskWide', host: 'desk', vhs: 1, can: [71.9, 72.5] }],
    [72.7, 'office', { cam: 'deskLaugh', host: 'desk', vhs: 1 }],
    [73.0, 'office', { cam: 'deskWide', host: 'desk', vhs: 1, ghost: { from: 73.0, to: 73.4, at: 72.9, cam: 'deskLaugh', alpha: 0.4 } }],
    [74.2, 'office', { cam: 'deskWide', host: 'desk', vhs: 1, curl: [74.2, 74.75] }],
    [74.75, 'rzhu', { slide: [76.4, 76.95], bug: false }],
    [76.95, 'office', { cam: 'deskFar', host: 'desk', vhs: 1, rain: [78.1, 79.1], red: [78.95, 79.5], over: [[79.95, 80.45, 'caption']] }],
    [82.3, 'office', { cam: 'deskClose', host: 'desk', vhs: 1, blurry: true }],
    [82.6, 'office', { cam: 'deskFar', host: 'desk', vhs: 1, pip: { from: 82.95, to: 84.0, cam: 'deskClose', rect: [0.38, 0.2, 0.36, 0.42] }, thrown: [83.4, 84.0] }],
    [84.0, 'truck', { cam: 'truck', tiltIn: [84.0, 84.25], bug: false }],
    [92.4, 'kras', { drop: [92.4, 93.3], confetti: [94.4, 94.9], smear: [95.35, 95.85], swirl: [95.7, 96.6], bug: false }],
    [96.6, 'sky', { mode: 'pass', whiteIn: [96.6, 97.05] }],
    [97.32, 'sky', { mode: 'flyby' }],
    [98.38, 'sky', { mode: 'far' }],
    [98.52, 'sky', { mode: 'side' }],
    [98.82, 'sky', { mode: 'cockpit', wild: [98.95, 99.55] }],
    [99.55, 'sky', { mode: 'face', sym: [99.55, 101.28, 'R'], symBug: true }],
    [101.28, 'sky', { mode: 'cockpit', look: 'psy' }],
    [101.75, 'sky', { mode: 'cockpit' }],
    [102.15, 'sky', { mode: 'hull', stutter: [102.15, 103.22, 0.17] }],
    [103.22, 'sky', { mode: 'loop', look: [[103.22, 103.85, 'lime'], [103.85, 104.73, 'pink']] }],
    [104.73, 'sky', { mode: 'loop2', pip: { from: 105.3, to: 106.1, mode: 'loop', rect: [0.18, 0.3, 0.42, 0.34] } }],
    [106.1, 'radar', { cam: 'radarClose', face: [106.4, 106.95] }],
    [108.73, 'radar', { cam: 'radarFace' }],
    [108.97, 'radar', { cam: 'radarClose', mirror: true }],
    [109.2, 'radar', { cam: 'radarClose', feedback: [109.4, 110.15], guy: [110.15, 112.17] }],
    [112.17, 'radar', { cam: 'radarClose', shatter: true }],
    [112.62, 'radar', { cam: 'radarWide', over: [[113.3, 118.78, 'krutoe']] }],
    [116.58, 'radar', { cam: 'radarFace', over: [[113.3, 118.78, 'krutoe']] }],
    [117.0, 'radar', { cam: 'radarWide', over: [[113.3, 118.78, 'krutoe']] }],
    [117.4, 'radar', { cam: 'radarFace', over: [[113.3, 118.78, 'krutoe']] }],
    [118.0, 'radar', { cam: 'radarClose', over: [[113.3, 118.78, 'krutoe']] }],
    [118.45, 'radar', { cam: 'radarFish', over: [[113.3, 118.78, 'krutoe']] }],
    [118.78, 'radar', { cam: 'radarWide' }],
    [120.0, 'radar', { cam: 'radarEnd' }]
  ];

  const CUTS = SHOTS.map(s => s[0]);

  function shotIndex(t) {
    let i = 0;
    while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
    return i;
  }

  function span(t, r) {
    return r && t >= r[0] && t < r[1];
  }

  function within(list, t) {
    return (list || []).filter(([a, b]) => t >= a && t < b).map(x => x[2]);
  }

  function fadeOf(f, t) {
    if (!f) return 1;
    return clamp(Math.min((t - f[0]) / Math.max(1e-3, f[1] - f[0]), (f[3] - t) / Math.max(1e-3, f[3] - f[2])), 0, 1);
  }

  function shake(t, amp) {
    return [S(t * 13.1) * amp + S(t * 31.7) * amp * 0.4, S(t * 11.3 + 1) * amp + S(t * 27.1) * amp * 0.4, 0];
  }

  function camOf(name, t, extra) {
    const c = CAMS[name];
    const w = shake(t, extra || 0.004);
    return { eye: [c.eye[0] + w[0], c.eye[1] + w[1], c.eye[2]], at: c.at.slice(), fov: c.fov, mirror: !!c.mirror, roll: 0 };
  }

  function lookOf(o, t) {
    if (!o.look) return null;
    if (typeof o.look === 'string') return LOOKS[o.look];
    const hit = within(o.look, t)[0];
    return hit ? LOOKS[hit] : null;
  }

  function officeStage(t, o, tt) {
    const st = { kind: 'office', env: ENVS.office, camera: camOf(o.cam, t), set: { lunch: !!o.lunch, chair: o.host === 'desk' || o.host === 'lunch' ? [0.2, -1.22] : null }, cast: [] };
    if (o.vhs !== undefined) st.set.vhs = o.vhs === 'fall' ? clamp((tt - 68.55) / 1.35, 0, 1) : o.vhs;
    if (o.host === 'stand' || o.host === 'vas') st.set.chair = null;
    if (o.desk) st.set.noDesk = false;
    else if (o.host === 'stand' || o.host === 'vas' || !o.host) st.set.noDesk = !o.desk && (o.cam !== 'standLong' && o.cam !== 'standZoom');
    if (o.host === 'lunch') st.cast.push({ who: 'host', pose: hostLunch(tt), prop: 'pizza' });
    if (o.host === 'stand' && !(span(tt, [51.0, 53.1]))) st.cast.push({ who: 'host', pose: hostStand(tt) });
    if (o.host === 'desk') {
      const p = hostDesk(tt);
      st.cast.push({ who: 'host', pose: p, prop: p.tape ? 'tape' : null, flat: span(tt, o.red) ? [0.92, 0.05, 0.04, 1] : null });
    }
    if (o.host === 'vas') st.vasPov = true;
    if (o.waiter) st.cast.push({ who: 'waiter', pose: waiterPose(tt) });
    if (o.melt && span(tt, o.melt)) st.melt = (tt - o.melt[0]) / (o.melt[1] - o.melt[0]);
    if (o.gap && span(tt, o.gap)) st.set.gap = clamp((tt - o.gap[0]) / 0.25, 0, 1);
    if (o.can && span(tt, o.can)) st.can = clamp((tt - o.can[0]) / 0.12, 0, 1);
    if (o.thrown && span(tt, o.thrown)) st.thrown = (tt - o.thrown[0]) / (o.thrown[1] - o.thrown[0]);
    if (o.rain && span(tt, o.rain)) st.rain = (tt - o.rain[0]) / (o.rain[1] - o.rain[0]);
    if (o.stretch) st.stretch = clamp((t - 57.05) / 0.15, 0, 1);
    return st;
  }

  function hutStage(t, o) {
    const p = nosePose(t);
    const st = { kind: 'hut', env: ENVS.hut, camera: camOf('hut', t, 0.006), cast: [{ who: 'nose', pose: p }], set: { tear: p.tear, sheetPos: [0, 0, 0], sheetRot: 0 } };
    st.sheet = p.sheet;
    return st;
  }

  function dinerStage(t) {
    return { kind: 'diner', env: ENVS.diner, camera: camOf('diner', t, 0.008), cast: dinerCast(t) };
  }

  function truckStage(t) {
    const p = driverPose(t);
    const c = camOf('truck', t, 0.012);
    return { kind: 'truck', env: ENVS.truck, camera: c, cast: [{ who: 'driver', pose: p }], set: { wheel: p.wheel } };
  }

  function studioStage(t, o) {
    const u = t - 41.6;
    const yaw = u * 1.9;
    const r = 0.6 + u * 0.4;
    const swoop = o.swoop && span(t, o.swoop) ? (t - o.swoop[0]) / (o.swoop[1] - o.swoop[0]) : 0;
    const eye = [S(yaw) * r, 1.2 + swoop * 2.5, C(yaw) * r - swoop * 3];
    const at = [S(yaw + 1.2) * 2.5, 5.0 - swoop * 2.0, C(yaw + 1.2) * 2.5 - swoop * 4];
    return { kind: 'studio', env: ENVS.studio, camera: { eye, at, fov: 80, roll: u * 0.6 }, flare: 1 + (span(t, o.flash) ? 0 : 0), cast: [] };
  }

  const PLANE_LOOP = (u) => {
    const a = u * 2 * PI;
    return [-S(a) * 4.2 + 0.6, -1.4 + (1 - C(a)) * 2.2, -6 - u * 0.5];
  };

  function skyStage(t, o) {
    const st = { kind: 'sky', env: ENVS.sky, mode: o.mode, cast: [], wild: span(t, o.wild) };
    const u = t - SHOTS[shotIndex(t)][0];
    if (o.mode === 'pass') {
      st.camera = { eye: [0, 0, 4], at: [0, 0, 0], fov: 50 };
      st.plane = { pos: [2.6 - u * 2.2, -0.2, 1.2], yaw: -PI / 2 + 0.3, roll: 0.2, scale: 1 };
    } else if (o.mode === 'flyby') {
      st.camera = { eye: [0, 0.4, 3.6], at: [0, 0.2, 0], fov: 46 };
      st.plane = { pos: [0.9 - u * 1.6, 0.0 + S(u * 3) * 0.1, 0], yaw: -PI / 2 - 0.25, roll: -0.1, scale: 1 };
    } else if (o.mode === 'far') {
      st.camera = { eye: [0, 0, 16], at: [0, 0, 0], fov: 46 };
      st.plane = { pos: [0.5 - u * 3, 0.3, 0], yaw: -PI / 2 + 0.2, roll: 0.1, scale: 1 };
      st.clouds = true;
    } else if (o.mode === 'side') {
      st.camera = { eye: [0, 0.4, 7.5], at: [0, 0, 0], fov: 46 };
      st.plane = { pos: [0.8 - u * 2.5, 0, 0], yaw: -PI / 2, roll: 0, scale: 1 };
      st.clouds = true;
    } else if (o.mode === 'cockpit') {
      st.camera = { eye: [-1.75, 1.08, 0.3], at: [0, 0.92, 0.15], fov: 40 };
      st.plane = { pos: [0, 0, 0], yaw: 0, roll: S(t * 2) * 0.03, scale: 1 };
      st.speedLines = true;
    } else if (o.mode === 'face') {
      st.camera = { eye: [0, 0.98, 2.1], at: [0, 0.94, 0], fov: 32 };
      st.plane = null;
      st.face = true;
      st.hands = u < 0.55 ? 'ok' : u < 1.05 ? 'ears' : 'cover';
      st.handsK = clamp(u / 0.3, 0, 1);
    } else if (o.mode === 'hull') {
      st.camera = { eye: [1.6, 0.5, 0.6], at: [0, 0.3, 0.2], fov: 50 };
      st.plane = { pos: [0, 0, 0], yaw: 0.2, roll: 0, scale: 1 };
      st.clouds = true;
    } else if (o.mode === 'loop' || o.mode === 'loop2') {
      st.camera = { eye: [0, 1.2, 4], at: [0, 1.2, -6], fov: 50 };
      const k = o.mode === 'loop' ? clamp((t - 103.22) / 1.5, 0, 1) : 0.3 + clamp((t - 104.73) / 1.4, 0, 1) * 0.7;
      const pts = [];
      const steps = Math.floor(k * 160);
      for (let i = 0; i <= steps; i++) pts.push(PLANE_LOOP(i / 160));
      st.trail = pts;
      const head = PLANE_LOOP(k);
      const ahead = PLANE_LOOP(Math.min(1, k + 0.01));
      st.plane = { pos: head, yaw: Math.atan2(ahead[0] - head[0], ahead[2] - head[2]) || -PI / 2, pitch: Math.atan2(ahead[1] - head[1], Math.hypot(ahead[0] - head[0], ahead[2] - head[2])), roll: 0, scale: 0.35 };
    }
    return st;
  }

  function radarStage(t, o) {
    const st = { kind: 'radar', env: ENVS.radar, camera: camOf(o.cam, t, 0.006), cast: [{ who: 'radar', pose: radarPose(t) }], set: { t } };
    if (o.mirror) st.camera.mirror = true;
    if (o.cam === 'radarFish') st.camera.fish = true;
    if (span(t, o.face)) st.screen = { kind: 'scared', k: (t - o.face[0]) / (o.face[1] - o.face[0]) };
    if (span(t, o.feedback)) st.screen = { kind: 'feedback' };
    if (span(t, o.guy)) st.screen = { kind: 'guy', u: t - o.guy[0] };
    if (o.shatter) st.screen = { kind: 'shatter' };
    if (t >= 120.0) st.cast = [];
    return st;
  }

  function remap(t, o) {
    if (o.stutter && span(t, o.stutter) && o.stutter[2] > 0) {
      const [a, , len] = o.stutter;
      return a + ((t - a) % len) * 1.0 + Math.floor((t - a) / len) * len * 0.35;
    }
    if (o.stutter && span(t, o.stutter) && o.stutter[2] === 0) return t < (o.stutter[0] + o.stutter[1]) / 2 ? t - 0.95 : t - 1.85;
    return t;
  }

  function stage(time) {
    const t = clamp(time, 0, DURATION - 1e-3);
    const i = shotIndex(t);
    const [t0, kind, o] = SHOTS[i];
    const tt = remap(t, o);
    let st;
    if (kind === 'office') st = officeStage(t, o, tt);
    else if (kind === 'hut') st = hutStage(t, o);
    else if (kind === 'diner') st = dinerStage(t);
    else if (kind === 'truck') st = truckStage(t);
    else if (kind === 'studio') st = studioStage(t, o);
    else if (kind === 'sky') st = skyStage(t, o);
    else if (kind === 'radar') st = radarStage(t, o);
    else st = { kind, env: ENVS.card, cast: [] };
    st.t = t;
    st.tt = tt;
    st.shot = i;
    st.t0 = t0;
    st.o = o;
    st.look = lookOf(o, t);
    st.bug = o.bug === false ? null : !o.keepBug && ((st.camera && st.camera.mirror) || span(t, o.mirrorAt)) ? 'mirror' : 'normal';
    st.mark = t >= 3.4;
    st.overlays = within(o.over, t);
    if (span(t, o.mirrorAt)) st.camera.mirror = true;
    if (kind === 'title') {
      st.title = within(o.swap, t)[0] || within(o.alt, t)[0] || o.title;
      st.alpha = o.fade ? fadeOf(o.fade, t) : 1;
      if (o.shrink) {
        const ks = o.shrink;
        let j = 0;
        while (j + 1 < ks.length && t >= ks[j + 1][0]) j++;
        st.box = ks[j][1] === undefined ? 1 : ks[j][1];
      }
      if (span(t, o.big)) st.big = ease((t - o.big[0]) / 0.18);
      if (o.out && t >= o.out[0]) st.alpha = clamp(1 - (t - o.out[0]) / (o.out[1] - o.out[0]), 0, 1);
      if (span(t, o.mix)) st.mix = (t - o.mix[0]) / (o.mix[1] - o.mix[0]);
    }
    if (kind === 'bobs') {
      st.wipe = span(t, o.wipe) ? (t - o.wipe[0]) / (o.wipe[1] - o.wipe[0]) : t < o.wipe[0] ? 0 : 1;
      st.gum = t >= o.gum;
    }
    if (kind === 'actor') st.pixel = span(t, o.pixel);
    if (kind === 'dtb') st.zoom = (t - t0) / 0.44;
    if (kind === 'rzhu') st.slide = o.slide && t >= o.slide[0] ? ease((t - o.slide[0]) / (o.slide[1] - o.slide[0])) : 0;
    if (kind === 'kras') {
      st.drop = clamp((t - o.drop[0]) / (o.drop[1] - o.drop[0]), 0, 1);
      st.confetti = clamp((t - o.confetti[0]) / (o.confetti[1] - o.confetti[0]), 0, 1);
      st.smear = span(t, o.smear) ? (t - o.smear[0]) / (o.smear[1] - o.smear[0]) : t >= o.smear[1] ? 1 : 0;
      st.swirl = span(t, o.swirl) ? (t - o.swirl[0]) / (o.swirl[1] - o.swirl[0]) : t >= o.swirl[1] ? 1 : 0;
    }
    if (o.ghost && span(t, [o.ghost.from, o.ghost.to])) st.ghost = o.ghost;
    if (o.pip && span(t, [o.pip.from, o.pip.to])) st.pip = o.pip;
    if (o.curl && span(t, o.curl)) st.curl = (t - o.curl[0]) / (o.curl[1] - o.curl[0]);
    if (o.sym && span(t, o.sym)) {
      st.sym = o.sym[2];
      st.symBug = !!o.symBug;
    }
    if (o.flips && span(t, o.flips)) st.flip = Math.floor((t - o.flips[0]) / 0.085) % 2 === 0;
    if (o.flash && span(t, o.flash)) st.flash = 1 - (t - o.flash[0]) / (o.flash[1] - o.flash[0]);
    if (o.lookFade && span(t, o.lookFade)) st.lookK = 1 - (t - o.lookFade[0]) / (o.lookFade[1] - o.lookFade[0]);
    if (o.blur && span(t, o.blur)) st.motionBlur = 1;
    if (o.blurry) st.blurry = true;
    if (o.tiltIn && span(t, o.tiltIn)) st.tiltIn = (t - o.tiltIn[0]) / (o.tiltIn[1] - o.tiltIn[0]);
    if (o.whiteIn && span(t, o.whiteIn)) st.white = 1 - (t - o.whiteIn[0]) / (o.whiteIn[1] - o.whiteIn[0]);
    return st;
  }

  window.KalamScript = { ID, DURATION, CUTS, SHOTS, CAMS, ENVS, LOOKS, SPEAK, VOICE, stage, shotIndex, speaking, mouthOf, hostLunch, hostStand, hostDesk, waiterPose, nosePose, driverPose, radarPose, dinerCast, PLANE_LOOP };
})();
