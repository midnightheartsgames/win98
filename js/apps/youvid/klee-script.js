(function () {
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Cast = window.KleeCast;
  const Cards = window.KleeCards;

  const ID = 'kL33T4T4T4a';
  const DURATION = 97.22;
  const VISUAL_END = 91.93;

  const VOICE = K.envelope('000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008oELJHEAACDypjktELKIHGGEDyrpqzEIGGIJJHILNOLJDCDFCvrqyFMNNMKGGEFDCADHKIGHLOOKKKLJGCwpowHONLICxtyGPNKGBtntCLLIDxyCJMLLLLKIHEDDEDDCCDGIIJKLLKHAADLOMGxojmwHLGyqje8fpBBzCGJFyrleagqBDCFIMMHArjgeda630000ewMOGvh821000000cttwxPOJKPRyvwMJIJQRzg00dsGIJKGCzAAxvog854aqIRTUVPJCvmeajxLOGCBDDEHIFDzrwEONLHEyCHPMJINPMJEBxyyurnrvCFGFEDEEFECAzyBDCFFJJOSTOKIGGGJHzsuFOTTNGBFNUYULGGINOQHEHPLGGOSNFCvi4003bmwBEDDCEIMPQSTPMMRWYZZZZZZYTLGFHHCyyFGIINJFAwtnpvCCvvAEEFJNNLGAtmpxFFBBCEFILMHEyvprAKONPSVUTSUURQPQPPOPPQSSRNKIIIHGHIJKNQSTVWWVVVWUSQONMLNOQQRSSSSSSQPPONMMNOMLKJHINSTQNLJGEHMNKHJMQTXWRKCFNXWTNMPUZYSOPVYWSMIEHLPPNLIFCHKMIFDCBEINNPRSOPRXXYYXXYVTTWZXUTTTRRTVYTRRXZYYYYWWXZXVVXZZYXVVWYYVQLHHIKLPTTTTYWVVXZYYYWVVXXTQRWZZZZXXXWUSSRRRQPONNMLKKKKMMLMMNKKLNMNRTUTTSSRQRRRQPOMKLOSSSRSNJJNQMKMPNJJMLGFIMKHKNMGGLNIHLPLHJNNIGKONIGEECGKPRQQPRRRPOMLKJHEGLRSTUVUUUUTSOIBxuvtqorvtkc9bb975310000000006bfc83100003gvJLMLGpa0000007pIGzzLQNIFAnotuurHEupsBqf44000000000000000000000000000000000000004bgd610004bfb510000000000000000000000000000017bd97410000000000000000000000000138isyxuqnhb9gmqponnoopomlkjjjkkiggggggggcaadfecc851112136cfgfdcdfilmljkjloswxxwxxBDFEAvuvyzDILLKLNNNOQSRRSWYZZZZXURONNOPQPQRQOLKKJJJLKFztuBKLIGIJHEEHJCzvFLSPMKMMORXZZZYYYWUPNLKGCABCFHHCzBGJORRLIGHHEFKOPRVYWUSRPOKKKLLLKIFDJPUUTSSQOMLKLNNOONNNOPONMMPTWYZXUSSSQPOONMLNNORVVTSRQONOSWWVVWWWVTRPPOPOONKKKNOPPPONOPPNNNOKHFGHLOQOKJKNONNNNNPOMKMNMKLNMLMNMIJLMKKOQOMPSRPQSROPTWUPKFBEKRSQNKHHLQTUVWYYYWURPQRRPPPPPNLJHILORQRQQPOMLKIHGEGJORTTTSRPMKJHGFDEIOQPQQSROLLJHFCACJPSRQPNNQTTSRQQPQRSTSSSSRSUWVUTUSPLGDEGIHINRUTRRQPOPRTTUTUUVWVTRTUUROKKJGCDHMNPOLFzuvCLQNJDzvAHNNLHDyyFMSRQLGCGMTUURTTUSQQOOPOOORUVVUTTSSRPONMJFDGIJHHKKMNOQPPMMMLKJMMMJJLOQRRSRPNLMMNKKLNORTWWVUTTTTSSSRRPOQSUTTTSQPQSUUTRPNMKJILLJFEDJPVWVUVVXWVUTSSRSSTSSRSPMIEFILMGIKSNMKJGIQQBxzMKKNRJHJTOJGxxwLJHKMJHIOPPCk5eqxj70000000000000000000000000000000000000000000000', 20);

  const ENVS = {
    day: { exposure: 1.0, sunDir: [-0.4, -0.8, -0.45], sunColor: [0.78, 0.68, 0.5], ambTop: [0.74, 0.82, 0.96], ambBottom: [0.5, 0.56, 0.44], fogColor: [0.74, 0.88, 0.99], fogNear: 40, fogFar: 120 },
    sunset: { exposure: 1.0, sunDir: [0.2, -0.3, 0.9], sunColor: [1.0, 0.62, 0.34], ambTop: [0.86, 0.62, 0.78], ambBottom: [0.62, 0.46, 0.4], fogColor: [1.0, 0.78, 0.56], fogNear: 30, fogFar: 100 },
    night: { exposure: 1.0, sunDir: [-0.3, -0.7, -0.5], sunColor: [0.34, 0.4, 0.74], ambTop: [0.4, 0.46, 0.8], ambBottom: [0.2, 0.24, 0.42], fogColor: [0.2, 0.26, 0.55], fogNear: 25, fogFar: 90 },
    purple: { exposure: 1.0, sunDir: [-0.2, -0.6, -0.7], sunColor: [0.7, 0.4, 0.9], ambTop: [0.7, 0.5, 0.95], ambBottom: [0.34, 0.2, 0.5], fogColor: [0.62, 0.44, 0.82], fogNear: 25, fogFar: 90 },
    hall: { exposure: 1.0, sunDir: [0.1, -0.7, -0.7], sunColor: [0.4, 0.38, 0.34], ambTop: [1.0, 0.96, 0.92], ambBottom: [0.7, 0.66, 0.66], fogColor: [0.6, 0.6, 0.66], fogNear: 40, fogFar: 120 },
    white: { exposure: 1.0, sunDir: [-0.3, -0.7, -0.6], sunColor: [0.5, 0.46, 0.42], ambTop: [1.0, 0.98, 0.98], ambBottom: [0.82, 0.78, 0.78], fogColor: [0.99, 0.98, 0.97], fogNear: 200, fogFar: 400 }
  };

  const SUN_TO_FRONT = PI / 2;

  function inSpan(t, span) {
    return t >= span[0] && t < span[1];
  }

  function mix3(a, b, k) {
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  }

  function seg(t, a, b) {
    return clamp((t - a) / (b - a), 0, 1);
  }

  function blank() {
    return {
      kind: 'scene',
      set: 'field',
      tod: 'day',
      env: 'day',
      camera: { eye: [0, 1, 3], at: [0, 0.8, 0], fov: 42 },
      klee: null,
      stelle: null,
      jean: null,
      jeanLegs: null,
      hilis: [],
      slimes: [],
      dumpties: [],
      books: [],
      golem: null,
      flames: [],
      blasts: [],
      glints: [],
      clovers: [],
      beams: [],
      flash: 0,
      flashColor: [1, 1, 1],
      overlay: null,
      sigil: -1
    };
  }

  function standing(t, x, z, yaw, extra) {
    const m = Cast.standPose(t);
    return Object.assign({ pos: [x, 0.48 + m.bob, z], yaw, eyes: 'open', mouth: 'smile' }, m, extra);
  }

  function running(t, x, z, yaw, extra, rate, amp) {
    const m = Cast.runPose(t, rate || 15, amp);
    return Object.assign({ pos: [x, 0.48 + m.bob, z], yaw, lean: 0.14, eyes: 'open', mouth: 'grin', sp: [0.08, 0, 0] }, m, extra);
  }

  function leaping(t, x, y, z, yaw, extra) {
    const m = Cast.jumpPose(t);
    return Object.assign({ pos: [x, 0.48 + y, z], yaw, lean: -0.1, eyes: 'wide', mouth: 'wide', sp: [-0.12, 0, 0] }, m, extra);
  }

  function hili(t, x, z, yaw, variant, extra) {
    return Object.assign({ pos: [x, 0, z], yaw, variant, t, run: 1 }, extra);
  }

  function kleeVoice(t) {
    const spans = [[14.3, 15.0], [16.4, 16.75], [19.0, 19.5], [60.95, 62.5], [76.5, 77.0]];
    if (!spans.some(s => inSpan(t, s))) return 0;
    return 0.5 + 0.5 * S(t * 17);
  }

  function mouthFor(v, idle) {
    if (v > 0.8) return 'open';
    if (v > 0.35) return 'talk';
    return idle || 'smile';
  }

  function track(base, steps) {
    let cur = base;
    return steps.map(([t, ch]) => {
      cur = Object.assign({}, cur, ch);
      return [t, cur];
    });
  }

  function poseAt(t, keys) {
    let i = 0;
    while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const k = b[0] > a[0] ? ease(clamp((t - a[0]) / (b[0] - a[0]), 0, 1)) : 0;
    const out = {};
    Object.keys(a[1]).forEach(name => {
      const va = a[1][name], vb = b[1][name];
      if (typeof va === 'number') out[name] = lerp(va, vb, k);
      else if (Array.isArray(va)) out[name] = va.map((v, j) => lerp(v, vb[j], k));
      else out[name] = va;
    });
    return out;
  }

  function blink(t, eyes, rate) {
    return eyes === 'open' && K.frac(t * (rate || 0.37)) < 0.045 ? 'shut' : eyes;
  }

  function posed(t, p) {
    const v = kleeVoice(t);
    const talky = p.mouth === 'smile' || p.mouth === 'talk';
    return standing(t, p.x, p.z, p.yaw, {
      roll: p.roll,
      sp: p.sp,
      nk: p.nk,
      hL: p.hL,
      hR: p.hR,
      eL: p.eL,
      eR: p.eR,
      eyes: blink(t, p.eyes),
      mouth: v > 0.35 && talky ? mouthFor(v, p.mouth) : p.mouth
    });
  }

  function throwing(t, period, offset) {
    const q = K.frac(t / period + (offset || 0));
    const lift = S(clamp(q / 0.6, 0, 1) * PI);
    return { hR: [-0.14, -0.1 + 0.34 * lift, 0.05 + 0.12 * lift], eR: [-0.6, 0.5, -0.4] };
  }

  function fighter(t, x, z, yaw, period, extra) {
    return standing(t, x, z, yaw, Object.assign({ eyes: blink(t, 'open'), mouth: 'grin', hL: [0.15, -0.1, 0.06], eL: [0.6, -0.2, -0.6] }, throwing(t, period), extra));
  }

  function arc(t, t0, t1, from, to, height) {
    const u = seg(t, t0, t1);
    return [lerp(from[0], to[0], u), lerp(from[1], to[1], u) + S(u * PI) * height, lerp(from[2], to[2], u)];
  }

  const ARMS_DOWN = { hL: [0.12, -0.13, 0.05], hR: [-0.12, -0.13, 0.05], eL: [0.5, -0.2, -0.7], eR: [-0.5, -0.2, -0.7] };

  const DANCE = track(Object.assign({ x: 0, z: 0, yaw: 0.35, roll: 0, sp: [0, 0, 0], nk: [0.08, -0.25, 0], eyes: 'open', mouth: 'smile' }, ARMS_DOWN), [
    [14.23, {}],
    [15.0, { nk: [0.08, -0.2, 0.04] }],
    [15.55, { nk: [0.1, -0.22, 0.17] }],
    [16.0, { nk: [0.05, -0.15, 0.0], yaw: 0.28 }],
    [16.15, { eyes: 'wink' }],
    [16.4, { eyes: 'open' }],
    [16.75, { hL: [0.16, -0.1, 0.12], hR: [-0.16, -0.1, 0.12] }],
    [17.0, { hL: [0.3, -0.07, 0.04], hR: [-0.3, -0.07, 0.04], eL: [0.7, 0.3, -0.3], eR: [-0.7, 0.3, -0.3], yaw: 0.18 }],
    [17.22, { sp: [0.42, 0, 0], nk: [0.3, -0.1, 0], hL: [0.03, 0.0, 0.14], hR: [-0.03, 0.0, 0.14], eL: [0.5, -0.2, -0.7], eR: [-0.5, -0.2, -0.7], eyes: 'shut', mouth: 'grin' }],
    [17.47, { sp: [-0.08, 0, 0], nk: [-0.1, -0.1, 0], hL: [0.18, 0.29, 0.02], hR: [-0.18, 0.29, 0.02], eL: [0.7, 0.5, -0.3], eR: [-0.7, 0.5, -0.3], eyes: 'open', mouth: 'open', yaw: 0.1 }],
    [17.72, { sp: [0, 0, 0], nk: [0.05, 0.2, 0], hL: [0.32, 0.07, 0.0], hR: [-0.32, 0.07, 0.0], yaw: -0.25, mouth: 'wide' }],
    [18.0, Object.assign({ yaw: 0.12, nk: [0.05, 0, 0], mouth: 'smile' }, ARMS_DOWN)],
    [18.25, { roll: 0.16, nk: [0.05, 0, 0.15], hR: [-0.3, 0.0, 0.03], eR: [-0.7, 0.3, -0.3], eyes: 'shut', mouth: 'grin' }],
    [18.55, { roll: 0.36, nk: [0.08, 0.1, 0.3], hR: [-0.3, 0.12, 0.03], hL: [0.18, -0.05, 0.06] }],
    [18.8, {}],
    [19.0, { roll: 0, nk: [0.05, -0.1, 0.05], hL: [0.17, -0.1, 0.06], hR: [-0.17, -0.1, 0.06], eR: [-0.5, -0.2, -0.7], eyes: 'open', mouth: 'smile' }],
    [19.25, { hL: [0.04, -0.06, 0.12], hR: [-0.04, -0.06, 0.12], yaw: 0 }],
    [19.4, {}],
    [19.7, { yaw: -2.5, sp: [0.45, 0, 0], nk: [0.25, -0.3, 0], x: -0.04, z: 0.1, eyes: 'shut', mouth: 'grin', hL: [0.16, -0.12, 0.08], hR: [-0.16, -0.12, 0.08] }],
    [20.1, { yaw: -2.85, sp: [0.12, 0, 0], nk: [0.05, -0.35, 0], z: 0.2 }],
    [20.8, { yaw: -2.95, nk: [0.05, -0.45, 0], z: 0.24 }]
  ]);

  const LATTICE = track({ x: 0, z: 0, yaw: 1.15, roll: 0, sp: [0, 0, 0], nk: [0, 0.25, 0.05], hL: [0.06, 0.0, 0.11], hR: [-0.06, 0.0, 0.11], eL: [0.6, 0, -0.3], eR: [-0.6, 0, -0.3], eyes: 'open', mouth: 'smile' }, [
    [20.8, {}],
    [21.5, { nk: [0.05, 0.3, 0.08] }],
    [21.95, { eyes: 'happy' }],
    [22.1, { nk: [0.05, 0.25, 0.1] }],
    [22.5, { yaw: 0.3, nk: [0.05, -0.05, 0.06], hL: [0.03, 0.06, 0.12], hR: [-0.03, 0.06, 0.12], eyes: 'open' }],
    [23.3, { nk: [0.08, -0.1, 0.12] }],
    [23.65, { yaw: -0.3, roll: -0.1, sp: [0.22, 0, 0], hL: [0.3, 0.05, 0.05], hR: [-0.1, -0.06, 0.1], eL: [0.7, 0.3, -0.3], eyes: 'happy', mouth: 'laugh' }],
    [24.05, { sp: [0.55, 0, 0], nk: [0.3, 0, 0], roll: -0.05, eyes: 'shut' }],
    [24.3, {}]
  ]);

  const HIP_L = [0.155, -0.2, 0.03];

  const STELLE = track({ shift: 0, sp: [0.02, 0, 0], nk: [0.2, 0.32, 0.08], hL: HIP_L, eL: [0.8, -0.3, -0.9], hR: [-0.19, -0.3, 0.06], eR: [-0.5, -0.2, -0.7], wave: 0, eyes: 'open', mouth: 'shut' }, [
    [20.8, {}],
    [21.35, { shift: 1, nk: [0.24, 0.26, -0.06] }],
    [21.95, { nk: [0.32, 0.3, 0.06], sp: [0.06, 0.04, 0], eyes: 'happy', mouth: 'smile' }],
    [22.35, { nk: [0.16, 0.34, 0.1], sp: [0.02, 0, 0] }],
    [22.5, { eyes: 'open' }],
    [22.8, { hR: [-0.26, 0.3, 0.1], eR: [-1, -0.2, 0.1], wave: 1, sp: [-0.02, -0.1, 0.04], nk: [0.18, 0.4, -0.05], mouth: 'talk' }],
    [23.35, { mouth: 'smile' }],
    [23.5, { wave: 0, hR: [-0.16, -0.02, 0.24], eR: [-0.7, -0.6, -0.3], shift: 0 }],
    [23.7, { hR: [-0.1, 0.14, 0.32], eR: [-0.8, -0.5, 0], sp: [-0.05, 0.12, 0], nk: [0.12, 0.3, 0.04], eyes: 'happy', mouth: 'open' }],
    [24.05, { mouth: 'smile' }],
    [24.3, {}]
  ]);

  function stelleAt(t) {
    const p = poseAt(t, STELLE);
    const x = 0.95, z = -2.8, yaw = -0.7;
    const sway = lerp(-1, 1, p.shift) * 0.022 + S(t * 1.3) * 0.006;
    const breath = S(t * 2.3);
    const wave = S((t - 22.8) * 13) * p.wave;
    const eyes = p.eyes === 'open' && K.frac(t * 0.29 + 0.4) < 0.05 ? 'shut' : p.eyes;
    return {
      pos: [x + C(yaw) * sway, 0.948 - Math.abs(sway) * 0.4 + breath * 0.002, z - S(yaw) * sway],
      base: [x, 0, z],
      yaw: yaw + 0.04 * p.shift,
      roll: -sway * 2.2,
      sp: [p.sp[0] + breath * 0.012, p.sp[1], p.sp[2] + sway * 1.6],
      nk: p.nk,
      hL: p.hL,
      eL: p.eL,
      hR: [p.hR[0] + wave * 0.05, p.hR[1], p.hR[2]],
      eR: p.eR,
      wR: [0, 0, wave * 0.5],
      footL: [0.11, 0, 0.07],
      footR: [-0.08, 0, -0.03],
      eyes,
      mouth: p.mouth === 'talk' && K.frac(t * 3.2) < 0.5 ? 'smile' : p.mouth
    };
  }

  function plazaDance(t) {
    const s = blank();
    s.set = 'plaza';
    const p = poseAt(t, DANCE);
    const up = 0.32 * (1 - seg(t, 19.3, 19.7));
    s.klee = posed(t, Object.assign(p, { nk: [p.nk[0] - up, p.nk[1], p.nk[2]] }));
    const k = seg(t, 14.23, 20.8);
    s.camera = { eye: [lerp(0.31, 0.28, k), 1.08, lerp(0.53, 0.49, k)], at: [0.13, 0.71, -0.03], fov: 55 };
    return s;
  }

  function lattice(t) {
    const s = blank();
    s.set = 'plaza';
    s.lattice = true;
    const p = poseAt(t, LATTICE);
    const up = 0.28 * (1 - seg(t, 22.2, 22.5));
    s.klee = posed(t, Object.assign(p, { yaw: p.yaw + 0.25 * (1 - seg(t, 22.2, 22.5)), nk: [p.nk[0] - up, p.nk[1] + 0.2 * (1 - seg(t, 22.2, 22.5)), p.nk[2]] }));
    s.stelle = stelleAt(t);
    const out = ease(seg(t, 23.2, 23.7));
    s.camera = { eye: [lerp(0.75, 0.35, out), lerp(0.74, 0.82, out), lerp(0.6, 1.6, out)], at: [lerp(0.36, 0.0, out), lerp(0.7, 0.62, out), lerp(-0.27, 0, out)], fov: 42 };

    if (t >= 24.03) {
      s.overlay = 'wipe';
      s.k = t - 24.03;
    }
    return s;
  }

  function titleCard(t) {
    const s = blank();
    s.env = 'white';
    s.set = 'none';
    const hop = Math.abs(S((t - 24.25) * 2.6));
    s.klee = leaping(t, 0.0, 0.25 + hop * 0.1, 0, 0.12 + S(t * 1.5) * 0.12, { eyes: 'open', mouth: 'wide', lean: -0.06, hL: [0.24, 0.2, 0.02], hR: [-0.24, 0.2, 0.02] });
    s.camera = { eye: [0, 0.84, 2.35], at: [0, 0.84, 0], fov: 38 };
    s.overlay = 'title';
    s.k = t - 24.35;
    s.whiteK = (t - 24.25) / 0.75;
    return s;
  }

  function meadowBattle(t) {
    const s = blank();
    s.river = true;
    s.path = false;
    s.skySpin = 0.4;
    const k = t - 27.83;
    const kz = -4.0 - k * 0.35;
    s.klee = running(t, -1.1, kz, PI + 0.45, Object.assign({ mouth: 'grin' }, throwing(t, 0.55)), 11, 0.6);
    s.hilis = [
      hili(t, -4.1, -6.6, 1.2, 'dark', { run: 0.5 }),
      hili(t, -4.0, -8.2, 1.0, 'red', { run: 0, raise: 1.0 + S(t * 5) * 0.3 }),
      hili(t, -3.1, -6.1, 0.9, 'dark', { run: 0.6 }),
      hili(t, -2.9, -7.4, 1.3, 'brown', { run: 0.4 })
    ];
    s.slimes = [{ pos: [-1.5, Math.max(0, S(t * 4)) * 0.25, -10.5], t, scale: 1.1, tint: [0.55, 0.85, 1], seed: 2 }];
    s.flames = [[-0.12, 0, -3.5, 1.0], [0.8, 0, -4.0, 1.1], [1.9, 0, -5.0, 1.0], [0.42, 0, -3.3, 0.9], [1.3, 0, -3.7, 1.1], [0.4, 0, -4.4, 0.8], [1.3, 0, -4.8, 0.9]];
    s.blasts = [
      { pos: [-3.1, 0.6, -6.1], size: 0.8, k: seg(t, 28.4, 28.9) },
      { pos: [-4.0, 0.8, -8.0], size: 0.9, k: seg(t, 28.95, 29.45) },
      { pos: [-1.5, 0.5, -10.2], size: 0.8, k: seg(t, 29.4, 29.8) },
      { pos: [-2.4, 0.8, -6.4], size: 2.4, k: seg(t, 29.85, 30.3) }
    ];
    s.glints = [[-3.1, 0.9, -6.1, 0.3, 1], [-4.0, 1.0, -8.0, 0.25, 2]];
    s.flash = 0.85 * seg(t, 29.92, 30.1);
    s.flashColor = [1, 0.98, 0.94];
    s.camera = { eye: [0.9, 2.4, -0.4], at: [-0.8, 0.4, -5.5], fov: 40 };

    return s;
  }

  function smokeProfile(t) {
    const s = blank();
    s.river = true;
    s.skySpin = 2.4;
    const k = t - 30.1;
    const x = -k * 1.4;
    s.klee = running(t, x, 0, -PI / 2, { mouth: 'grin', eyes: 'happy', nk: [0.25, 0, 0] }, 14, 0.9);
    s.books = [{ pos: [x + 0.5, 1.05 + S(k * 7) * 0.06, -0.15], yaw: 0.8 + k * 2, roll: 0.5, flap: t * 12, scale: 1.2 }];
    const turn = ease(seg(t, 30.3, 30.75));
    s.camera = { eye: [x + lerp(0.95, 0.5, turn), lerp(1.15, 1.0, turn), lerp(1.0, 1.35, turn)], at: [x + 0.12, 0.5, -0.2], fov: 46 };
    s.flash = 0.9 * (1 - seg(t, 30.1, 30.42));
    s.flashColor = [1, 0.98, 0.94];
    return s;
  }

  function runToward(t) {
    const s = blank();
    s.skySpin = 2.4;
    const k = t - 30.9;
    const z = -3 + k * 1.6;
    s.klee = running(t, 0.1, z, 0, { mouth: 'grin' }, 14, 1);
    s.books = [{ pos: [0.65, 1.2 + S(k * 6) * 0.08, z - 0.2], yaw: k * 4, roll: 0.4, flap: t * 12, scale: 1.3 }];
    s.blasts = [{ pos: [0.2, 1.35, z], size: 0.55, k: seg(t, 30.92, 31.45) }];
    s.glints = [[0.2, 1.35, z, 0.3, 1], [0.6, 0.9, z, 0.06, 2], [-0.3, 0.7, z, 0.05, 3]];
    s.camera = { eye: [0.1, 0.85, z + 3.4], at: [0.1, 0.75, z], fov: 44 };
    return s;
  }

  function comicPanel(t) {
    const s = blank();
    s.set = 'none';
    s.overlay = 'comic';
    s.comic = t < 32.17 ? 'burst' : 'text';
    s.k = s.comic === 'burst' ? (t - 32.0) / 0.17 * 0.25 : (t - 32.17) / 0.43;
    return s;
  }

  function backpackClose(t) {
    const s = blank();
    s.skySpin = 2.2;
    const k = t - 32.6;
    const kz = -8 - k * 1.5;
    s.klee = running(t, 0, kz, PI, { mouth: 'grin' }, 13, 0.8);
    s.books = [{ pos: [-0.55, 1.1 + S(k * 6) * 0.06, kz - 0.4], yaw: 0.6 + k * 3, roll: 0.5, flap: t * 12, scale: 1.0 }];
    s.flames = [[-1.0, 0, kz + 0.4, 0.9], [1.0, 0, kz - 0.3, 1.0], [-0.6, 0, kz - 1.8, 0.9], [0.7, 0, kz + 1.4, 0.8], [1.3, 0, kz - 1.2, 0.9], [-1.4, 0, kz - 0.8, 1.0]];
    s.camera = { eye: [0.18, 0.8, kz + 1.0], at: [0, 0.62, kz - 1.2], fov: 52 };
    s.glints = [[0.5, 0.9, kz - 0.6, 0.05, 1], [-0.4, 1.0, kz - 0.4, 0.04, 3]];
    s.iris = seg(t, 32.6, 32.95);
    return s;
  }

  function throwFromBehind(t) {
    const s = blank();
    s.skySpin = 2.2;
    const k = t - 33.4;
    const kz = -6 - k * 0.9;
    s.klee = running(t, 0, kz, PI, Object.assign({ mouth: 'grin' }, t < 33.75 ? throwing(t - 33.4, 0.6) : {}), 13, 0.8);
    const land = [0.2, 0.25, -8.0];
    const dPos = t < 34.0 ? arc(t, 33.4, 34.0, [0, 0.95, -6.2], land, 0.9) : [land[0], land[1] + Math.abs(S((t - 34.0) * 7)) * 0.08 * (1 - seg(t, 34.0, 34.6)), land[2]];
    s.dumpties = [{ pos: dPos, scale: 0.55, yaw: PI + k * 2, roll: S(k * 9) * 0.2 }];
    s.blasts = [{ pos: [land[0], 0.5, land[2]], size: 1.1, k: seg(t, 33.98, 34.45) }];
    const rows = [];
    for (let i = 0; i < 6; i++) {
      rows.push([-1.2 - (i % 2) * 0.4, 0, -4.5 - i * 1.0, 0.9 + (i % 3) * 0.1, i]);
      rows.push([1.2 + (i % 2) * 0.4, 0, -4.8 - i * 1.0, 0.9 + ((i + 1) % 3) * 0.1, i + 6]);
    }
    if (t > 34.2) rows.push([land[0] - 0.4, 0, land[2] + 0.2, 0.7, 13], [land[0] + 0.5, 0, land[2] - 0.1, 0.8, 14]);
    s.flames = rows;
    s.hilis = [hili(t, 1.0, -8.4, -0.6, 'red', { run: 0.3 })];
    s.camera = { eye: [0.15, 1.15, kz + 2.6], at: [0, 0.7, kz - 2.5], fov: 46 };
    return s;
  }

  function dumptyLow(t) {
    const s = blank();
    s.skySpin = 0.9;
    s.path = false;
    s.dry = true;
    const jump = 0.3 * S(seg(t, 35.15, 35.45) * PI);
    s.klee = standing(t, -3.3, -4.6, 0.6, { mouth: 'grin', eyes: blink(t, 'open') });
    s.dumpties = [{ pos: [-0.3, 0.26 + jump, 0.0], scale: 0.6, yaw: -0.3, roll: S(t * 9) * 0.06 }];
    s.blasts = [{ pos: [-0.3, 0.15, 0.3], size: 0.4, k: seg(t, 34.9, 35.2) }];
    s.flames = t > 35.05 ? [[-0.65, 0, -0.1, 0.55], [0.25, 0, -0.2, 0.6], [-0.2, 0, -0.45, 0.5]] : [];
    s.camera = { eye: [0.25, 0.75, 1.7], at: [-0.5, 0.3, -1.2], fov: 46 };
    return s;
  }

  function blastFront(t) {
    const s = blank();
    s.skySpin = 0.9;
    s.path = false;
    s.dry = true;
    s.klee = standing(t, -0.6, -5, 0.2, { mouth: 'grin' });
    s.blasts = [
      { pos: [0.1, 0.4, 0.0], size: 1.8, k: seg(t, 35.55, 36.5) },
      { pos: [-0.5, 0.3, -0.3], size: 1.2, k: seg(t, 35.7, 36.6) }
    ];
    s.flames = t > 35.85 ? [[-0.4, 0, 0.2, 1.0], [0.5, 0, -0.2, 1.1], [0.1, 0, 0.5, 0.8]] : [];
    s.glints = [[0.6, 0.9, 0.2, 0.12, 1], [-0.7, 1.1, -0.1, 0.1, 2]];
    s.flash = 0.4 * (1 - seg(t, 35.53, 35.9));
    s.camera = { eye: [0, 0.45, 2.4], at: [0, 0.6, -2], fov: 46 };
    return s;
  }

  function battleMid(t) {
    const s = blank();
    s.skySpin = 1.4;
    const k = t - 36.65;
    s.klee = fighter(t, 0.3 - k * 0.1, -1.0, -2.3, 0.55, { mouth: 'grin' });
    s.hilis = [
      hili(t, -1.4, -2.0, 0.9, 'dark', { run: 0.5 }),
      hili(t, -0.6, -2.6, 0.5, 'red', { run: 0, raise: 1.0 + S(t * 6) * 0.4 }),
      hili(t, -2.0, -2.8, 0.8, 'dark', { run: 0.4 }),
      hili(t, -0.9, -1.4, 1.2, 'brown', { run: 0.6 })
    ];
    s.slimes = [{ pos: [1.8, Math.max(0, S(t * 4.5)) * 0.25, -2.4], t, scale: 0.9, tint: [0.55, 0.85, 1], seed: 3 }];
    const d = [];
    if (t > 36.75 && t < 37.35) d.push({ pos: arc(t, 36.75, 37.35, [0.2, 0.9, -1.0], [-1.0, 0.3, -2.2], 0.7), scale: 0.4, yaw: t * 6, roll: 0.2 });
    if (t > 37.75 && t < 38.2) d.push({ pos: arc(t, 37.75, 38.2, [0.2, 0.9, -1.0], [-0.6, 0.3, -2.5], 0.6), scale: 0.4, yaw: t * 6, roll: 0.2 });
    s.dumpties = d;
    s.blasts = [
      { pos: [-1.0, 0.5, -2.2], size: 1.1, k: seg(t, 37.35, 37.85) },
      { pos: [-0.6, 0.5, -2.5], size: 1.0, k: seg(t, 38.2, 38.65) }
    ];
    const fl = [[-1.6, 0, -1.6, 0.7], [-0.4, 0, -1.8, 0.6]];
    if (t > 38.45) for (let i = 0; i < 7; i++) fl.push([-2.4 + i * 0.7, 0, -1.6 - (i % 2) * 0.5, 1.2 * seg(t, 38.45, 38.7), i]);
    s.flames = fl;
    s.camera = { eye: [1.0, 1.25, 1.5], at: [-0.4, 0.45, -1.8], fov: 46 };
    return s;
  }

  function fireSweep(t) {
    const s = blank();
    s.skySpin = 1.4;
    const k = seg(t, 38.7, 39.6);
    s.klee = running(t, 0, -1.0, 0.5, { mouth: 'grin' }, 14, 0.7);
    const fl = [];
    for (let i = 0; i < 10; i++) fl.push([-3 + i * 0.65, 0, -0.6 - (i % 3) * 0.45, 1.2 + (i % 2) * 0.3, i]);
    s.flames = fl;
    s.hilis = [{ pos: [-1.0, 0.4 + k * 2.0, -1.6], yaw: 0.6, variant: 'dark', t, run: 0, tumble: k * 6 }];
    s.blasts = [{ pos: [1.2, 0.6, -1.0], size: 1.6, k: seg(t, 38.95, 39.45) }];
    s.flash = 0.3 * (1 - seg(t, 38.7, 38.95));
    s.camera = { eye: [lerp(-0.4, 0.6, k), 1.0, 2.6], at: [lerp(-0.6, 0.6, k), 0.6, -1.2], fov: 46 };
    return s;
  }

  function runLeft(t) {
    const s = blank();
    s.skySpin = 1.6;
    s.path = false;
    const k = t - 39.6;
    const yaw = -0.7;
    const x = 0.6 + S(yaw) * k * 2.0, z = -2.0 + C(yaw) * k * 2.0;
    s.klee = running(t, x, z, yaw, { mouth: 'grin' }, 15, 1);
    s.hilis = [{ pos: [1.6 + k * 0.5, 2.0 + k * 0.9 - k * k * 0.7, -4.5], yaw: -0.4, variant: 'red', t, run: 0, tumble: k * 6 }];
    s.flames = [[1.4, 0, -2.6, 0.9], [2.0, 0, -2.0, 1.0], [1.0, 0, -3.2, 0.8]];
    s.camera = { eye: [0.2, 1.1, 2.6], at: [x * 0.6 - 0.1, 0.8, -2], fov: 46 };
    return s;
  }

  function slimeBeach(t) {
    const s = blank();
    s.lake = true;
    s.dry = true;
    s.path = false;
    s.skySpin = 1.2;
    const k = t - 40.5;
    const x = -0.8 + k * 1.0;
    s.klee = running(t, x, -1.0, PI / 2, { mouth: 'grin' }, 15, 1);
    const purple = [0.62, 0.34, 0.86];
    s.slimes = [
      { pos: [-1.5 + k * 0.4, 0.6 * Math.abs(S(k * 2.2 + 0.4)), -2.2], t, scale: 1.3, tint: purple, seed: 1 },
      { pos: [1.0, 0, -2.0], t, scale: 1.7, tint: purple, seed: 3 },
      { pos: [2.0, 0, -2.8], t, scale: 1.3, tint: purple, seed: 5 }
    ];
    s.blasts = [
      { pos: [-0.3, 0.4, -1.4], size: 1.6, k: seg(t, 40.55, 41.0) },
      { pos: [0.5, 0.4, -1.2], size: 1.0, k: seg(t, 41.45, 41.88) }
    ];
    s.flames = t > 40.9 ? [[0.0, 0, -1.2, 0.6], [0.5, 0, -1.4, 0.7], [-0.4, 0, -1.0, 0.6], [0.9, 0, -1.1, 0.5]] : [];
    s.flash = 0.45 * (1 - seg(t, 40.55, 40.9)) * (t > 40.55 ? 1 : 0);
    s.camera = { eye: [x * 0.5, 0.75, 3.2], at: [x * 0.5, 0.7, -1.2], fov: 46 };
    return s;
  }

  function slimeHit(t) {
    const s = blank();
    s.lake = true;
    s.dry = true;
    s.path = false;
    s.skySpin = 1.2;
    const k = t - 41.88;
    s.slimes = [{ pos: [0.8, 0.5 * Math.abs(S(k * 3)), -0.5], t, scale: 1.2, tint: [0.62, 0.34, 0.86], seed: 5 }];
    s.klee = running(t, 0.5 - k * 1.4, 0, -PI / 2, { mouth: 'grin' }, 15, 1);
    s.flames = [[1.4, 0, -0.4, 0.6], [1.0, 0, -0.9, 0.5]];
    s.camera = { eye: [0.2, 0.7, 3.0], at: [0.1, 0.6, -0.3], fov: 46 };
    return s;
  }

  function grassWide(t) {
    const s = blank();
    s.lake = true;
    s.dry = true;
    s.skySpin = 0.2;
    const k = t - 42.45;
    s.klee = running(t, 0.4 + k * 0.4, -5.5 - k * 2.2, PI * 0.96, { mouth: 'grin' }, 15, 1);
    s.slimes = [{ pos: [2.6, 0, -4.2], t, scale: 1.3, tint: [0.62, 0.34, 0.86], seed: 6 }];
    s.flames = [[-0.3, 0, -6.5, 0.9], [0.8, 0, -7.2, 0.8]];
    s.camera = { eye: [-1.6, 0.9, 4.0 - k * 0.7], at: [0.3, 1.4, -10], fov: 46 };
    return s;
  }

  function castleSide(t) {
    const s = blank();
    s.lake = true;
    s.dry = true;
    s.skySpin = 0.2;
    const k = seg(t, 43.45, 44.9);
    const x = -1.5 + k * 1.4;
    const yaw = lerp(PI / 2, 0.5, ease(seg(t, 44.2, 44.85)));
    s.klee = running(t, x, 0, yaw, { mouth: 'grin' }, 15, lerp(1, 0.6, k));
    s.flames = [[x - 0.6, 0, 0.3, 0.5], [x - 1.4, 0, -0.4, 0.6]];
    const near = ease(k);
    s.camera = { eye: [x + lerp(-0.4, 0.25, near), lerp(0.7, 0.78, near), lerp(4.0, 1.35, near)], at: [x + 0.2, lerp(1.2, 0.8, near), -8], fov: 46 };
    return s;
  }

  function frontArmsOut(t) {
    const s = blank();
    s.lake = true;
    s.dry = true;
    s.path = false;
    s.skySpin = 0.5;
    const closed = (t > 45.18 && t < 45.36) || (t > 45.68 && t < 45.86);
    s.klee = standing(t, 0, 0, 0.08 * S(t * 1.4), {
      eyes: closed ? 'happy' : 'open',
      mouth: closed ? 'grin' : 'smile',
      nk: [0.04, 0.05 * S(t * 1.1), 0.07 * S(t * 2)],
      hL: [0.31, 0.06 + S(t * 3) * 0.02, 0.04],
      hR: [-0.31, 0.06 - S(t * 3) * 0.02, 0.04],
      eL: [0.6, 0.4, -0.4],
      eR: [-0.6, 0.4, -0.4]
    });
    s.camera = { eye: [0.1, 0.6, 1.05], at: [0.1, 0.66, 0], fov: 44 };
    return s;
  }

  function jeanLegsShot(t) {
    const s = blank();
    s.skySpin = 0.5;
    const k = t - 46.28;
    s.jeanLegs = { pos: [-0.52, 0, 2.25], yaw: 0.9, scale: 1 };
    s.klee = running(t, 0.2, -8 + k * 2.4, 0, { mouth: 'grin' }, 14, 1);
    s.camera = { eye: [0, 0.95, 3.4], at: [0, 0.8, -1], fov: 40 };
    return s;
  }

  function jeanFace(t) {
    const s = blank();
    s.skySpin = 0.5;
    const talk = t > 48.5 && t < 51.8 ? VOICE(t) : 0;
    const k = t - 48.13;
    s.jean = {
      pos: [0, 1.34, 0],
      yaw: -0.3,
      headYaw: 0.08 + S(t * 0.9) * 0.05,
      pitch: S(t * 0.7) * 0.03 + talk * 0.03,
      eyes: t < 48.35 || K.frac(t * 0.42) < 0.05 ? 'shut' : 'open',
      mouth: talk > 0.6 ? 'open' : talk > 0.25 ? 'talk' : 'shut',
      scale: 1.8
    };
    s.camera = { eye: [lerp(-0.32, -0.29, k / 4.2), 1.52, lerp(1.29, 1.18, k / 4.2)], at: [-0.15, 1.46, 0.12], fov: 36 };
    s.flash = seg(t, 51.35, 51.9);
    s.flashColor = [0, 0, 0];
    return s;
  }

  function hallWide(t) {
    const s = blank();
    s.set = 'hall';
    s.env = 'hall';
    const k = seg(t, 52.37, 56.48);
    s.camera = { eye: [0.0, 1.5, lerp(5.2, 4.2, k)], at: [0, 1.5, -4], fov: 40 };
    s.sigil = Math.floor(t * 1.5) % 3;
    return s;
  }

  function hallNear(t) {
    const s = blank();
    s.set = 'hall';
    s.env = 'hall';
    const k = seg(t, 56.48, 60.87);
    s.camera = { eye: [lerp(0.0, 0.1, k), lerp(1.45, 1.4, k), lerp(2.6, 2.1, k)], at: [lerp(0.0, 0.1, k), 1.35, -4], fov: 40 };
    s.sigil = Math.floor(t * 1.5) % 3;
    s.flash = 0.22 * seg(t, 59.6, 60.4);
    s.flashColor = [1, 0.98, 0.92];
    return s;
  }

  function doorClose(t) {
    const s = blank();
    s.set = 'hall';
    s.env = 'hall';
    const k = seg(t, 60.87, 61.1);
    s.camera = { eye: [0.42, lerp(1.2, 1.18, k), lerp(-3.05, -3.15, k)], at: [0.38, 1.12, -4], fov: 40 };
    return s;
  }

  function kleeFaceClose(t) {
    const s = blank();
    s.set = 'plaza';
    const v = kleeVoice(t);
    const pop = ease(seg(t, 61.1, 61.4));
    s.klee = standing(t, lerp(-0.3, 0, pop), 0, lerp(0.5, -0.2, pop) + S(t * 1.2) * 0.08, {
      eyes: t < 61.45 ? 'happy' : K.frac(t * 0.6) < 0.06 ? 'happy' : 'open',
      mouth: v > 0.7 ? 'laugh' : v > 0.3 ? 'wide' : 'grin',
      nk: [-0.06, 0.08, 0.12 + S(t * 2) * 0.05 - 0.2 * (1 - pop)],
      roll: -0.25 * (1 - pop),
      hL: [0.15, -0.08, 0.08],
      hR: [-0.3, 0.05, 0.14],
      eR: [-0.7, 0.2, -0.4]
    });
    const k = seg(t, 61.1, 62.58);
    s.camera = { eye: [0.1, 0.8, lerp(0.5, 0.46, k)], at: [0.06, 0.81, 0], fov: 44 };
    return s;
  }

  function armsOutFront(t) {
    const s = blank();
    s.set = 'plaza';
    const turn = ease(seg(t, 63.35, 63.9));
    s.klee = standing(t, 0, 0, lerp(0.25, 1.35, turn), {
      eyes: blink(t, 'open'),
      mouth: 'grin',
      nk: [0.04, lerp(0.0, -0.3, turn), 0.05],
      hL: mix3([0.31, 0.04, 0.03], [0.14, -0.12, -0.04], turn),
      hR: mix3([-0.31, 0.04, 0.03], [-0.14, -0.12, -0.04], turn),
      eL: [0.6, 0.4, -0.4],
      eR: [-0.6, 0.4, -0.4],
      lean: 0.08 * turn
    });
    s.camera = { eye: [-0.3, 0.55, 0.95], at: [0.1, 0.62, 0], fov: 44 };
    return s;
  }

  function wallRun(t) {
    const s = blank();
    s.set = 'plaza';
    const k = t - 64.0;
    const yaw = PI * 0.82;
    s.klee = running(t, -0.5 + S(yaw) * k * 2.6, 0.4 + C(yaw) * k * 2.6, yaw, { mouth: 'grin' }, 15, 1);
    s.camera = { eye: [-0.9, 0.85, 1.4], at: [0.4, 0.55, -2.5], fov: 44 };
    return s;
  }

  function golemTop(t) {
    const s = blank();
    s.set = 'plaza';
    s.hex = true;
    const k = t - 65.9;
    s.golem = { pos: [0, 0, 0], scale: 1, glow: 0.7 + S(t * 8) * 0.3 };
    s.klee = leaping(t, -0.1 + k * 0.05, 2.04 + Math.abs(S(k * 4)) * 0.12, 0.05, 0.4, { eyes: 'open', mouth: 'grin' });
    s.hilis = [
      hili(t, -2.4, 1.5, 1.2, 'red', { run: 1 }),
      hili(t, 2.6, -1.8, -1.4, 'dark', { run: 1 }),
      hili(t, 1.6, 2.4, -2.4, 'red', { run: 1 })
    ];
    s.blasts = [
      { pos: [-1.5, 0.8, 1.4], size: 0.6, k: seg(t, 67.55, 67.95) },
      { pos: [1.8, 0.8, -1.2], size: 0.7, k: seg(t, 68.3, 68.7) },
      { pos: [-1.0, 0.7, 0.8], size: 1.5, k: seg(t, 68.95, 69.42) }
    ];
    s.flash = 0.3 * seg(t, 68.95, 69.15) * (1 - seg(t, 69.15, 69.42));
    s.camera = { eye: [lerp(2.0, 2.4, k / 3.5), 2.2, 3.4], at: [0, 1.6, 0], fov: 46 };
    return s;
  }

  function dumptyPortrait(t) {
    const s = blank();
    s.set = 'plaza';
    const k = seg(t, 69.42, 70.35);
    const glow = seg(t, 69.9, 70.35);
    s.klee = standing(t, 0.08, 0, 0.15, {
      eyes: glow > 0.5 ? 'happy' : 'open',
      mouth: glow > 0.5 ? 'laugh' : 'grin',
      nk: [0.12, -0.1, 0.05],
      hL: [0.07, -0.02, 0.15],
      hR: [-0.07, -0.02, 0.15],
      eL: [0.6, -0.4, -0.3],
      eR: [-0.6, -0.4, -0.3]
    });
    s.dumpties = [{ pos: [lerp(-0.3, -0.26, k), 0.62, 0.2], scale: 0.32, yaw: 0.4, roll: S(t * 7) * 0.05 }];
    s.blasts = glow > 0 ? [{ pos: [-0.26, 0.64, 0.28], size: 0.25 + glow * 0.3, k: 0.25 + glow * 0.2 }] : [];
    s.glints = [[-0.12, 0.9, 0.35, 0.04, 1], [0.25, 0.75, 0.3, 0.03, 2], [0.15, 0.95, 0.3, 0.03 + glow * 0.04, 3]];
    s.flash = 0.35 * glow;
    s.flashColor = [1, 0.95, 0.85];
    s.camera = { eye: [-0.05, 0.74, 0.85], at: [-0.1, 0.72, 0], fov: 46 };
    return s;
  }

  function purpleThrow(t) {
    const s = blank();
    s.tod = 'purple';
    s.env = 'purple';
    s.set = 'plaza';
    const k = seg(t, 70.35, 70.52);
    s.klee = standing(t, 0, 0, PI, {
      eyes: 'open',
      mouth: 'grin',
      hR: [-0.12, 0.3 * k + 0.1, 0.1],
      eR: [-0.5, 0.6, -0.2],
      sp: [-0.1, 0, 0]
    });
    s.clovers = [[0.0, 1.2, -0.4, 0.12, 1]];
    s.glints = [[0.2, 1.2, -0.3, 0.07, 1], [-0.4, 1.0, -0.2, 0.05, 2], [0.5, 1.4, -0.4, 0.06, 3], [-0.1, 1.6, -0.2, 0.05, 4]];
    s.camera = { eye: [0.0, 0.12, 0.95], at: [0, 0.85, 0], fov: 60 };
    return s;
  }

  function sigilBlast(t) {
    const s = blank();
    s.tod = 'night';
    s.env = 'night';
    s.skySpin = 0.4;
    const k = seg(t, 70.52, 71.25);
    s.klee = standing(t, 0, -1.2, 0, { mouth: 'grin', eyes: 'happy' });
    s.blasts = [{ pos: [0, 0.7, -1.0], size: 2.6, k: 0.3 + k * 0.6 }, { pos: [-0.8, 0.4, -0.6], size: 1.2, k: 0.2 + k * 0.7 }];
    s.clovers = [[0, 1.0, -0.6, lerp(0.35, 0.5, k), 1]];
    s.flames = [[-1.4, 0, -0.6, 1.2], [1.3, 0, -0.8, 1.1], [-0.6, 0, 0.2, 0.9], [0.8, 0, 0.1, 0.9]];
    s.flash = 0.4 * (1 - k);
    s.flashColor = [1, 0.8, 0.5];
    s.camera = { eye: [0, 0.9, 2.2], at: [0, 0.8, -1], fov: 50 };
    return s;
  }

  function battleFront(t, t0, night) {
    const s = blank();
    if (night) {
      s.tod = 'night';
      s.env = 'night';
    }
    s.path = false;
    s.skySpin = night ? 0.4 : 0.9;
    s.klee = fighter(t, 0, -1.0, 0.1, 0.5);
    s.hilis = [
      hili(t, -1.6, -1.6, 0.9, 'dark', { run: 0.5 }),
      hili(t, -2.2, -1.0, 1.2, 'red', { run: 0, raise: 1.0 + S(t * 6) * 0.4 }),
      hili(t, -1.0, -2.4, 0.6, 'dark', { run: 0.4 })
    ];
    s.slimes = [
      { pos: [0.9, Math.max(0, S(t * 4)) * 0.2, -2.6], t, scale: 0.6, tint: [0.55, 0.85, 1], seed: 2 },
      { pos: [-0.4, 0, -3.0], t, scale: 0.7, tint: [0.55, 0.85, 1], seed: 4 }
    ];
    s.flames = [[-2.4, 0, -1.4, 1.0], [-1.6, 0, -0.6, 0.8], [1.8, 0, -1.8, 0.9], [1.2, 0, -0.6, 0.6]];
    s.glints = [[0.4, 1.3, -1, 0.15, 1], [-1.5, 1.6, -2, 0.1, 2]];
    s.blasts = [
      { pos: [-1.4, 0.6, -1.6], size: 0.9, k: seg(t, t0 + 0.2, t0 + 0.6) },
      { pos: [1.2, 0.6, -1.2], size: 0.8, k: seg(t, t0 + 0.45, t0 + 0.85) }
    ];
    s.camera = { eye: [0, 1.1, 3.4], at: [0, 0.6, -1.2], fov: 46 };
    return s;
  }

  function nightBattle(t) {
    return battleFront(t, 71.25, true);
  }

  function dayBattle(t) {
    return battleFront(t, 72.25, false);
  }

  function archRuins(t) {
    const s = blank();
    s.arch = true;
    s.path = false;
    s.skySpin = 0.8;
    s.klee = fighter(t, 0, -0.4, 0.05, 0.6);
    s.hilis = [
      hili(t, -1.0, -0.8, 1.2, 'dark', { run: 0.5 }),
      hili(t, -1.6, -1.2, 1.0, 'red', { run: 0.3 }),
      hili(t, -2.0, -0.6, 1.3, 'dark', { run: 0.5 }),
      hili(t, 1.2, -0.6, -1.2, 'dark', { run: 0, raise: 1.0 + S(t * 6) * 0.4 }),
      hili(t, 1.7, -1.0, -1.0, 'red', { run: 0.4 })
    ];
    s.slimes = [{ pos: [0.8, Math.max(0, S(t * 4)) * 0.2, -1.4], t, scale: 0.8, tint: [0.5, 0.95, 0.8], seed: 4 }];
    s.blasts = [{ pos: [-1.3, 0.6, -1.0], size: 0.8, k: seg(t, 73.3, 73.7) }, { pos: [1.3, 0.6, -0.8], size: 0.8, k: seg(t, 73.8, 74.2) }];
    s.camera = { eye: [-0.3, 0.9, 3.6], at: [-0.5, 1.1, -4], fov: 46 };
    return s;
  }

  function frontShoot(t) {
    const s = blank();
    s.arch = true;
    s.path = false;
    s.skySpin = 0.8;
    const k = t - 74.25;
    s.klee = standing(t, 0, 0, 0, {
      mouth: 'grin',
      eyes: blink(t, 'open'),
      hR: [-0.15, 0.1, 0.18],
      eR: [-0.5, 0.2, -0.5]
    });
    s.beams = [[-1.2, 0.9, -1.5, 3.0, 0.15], [1.4, 1.2, -1.2, 2.6, -0.3], [0.2, 1.6, -2, 2.4, 0.5]];
    s.slimes = [{ pos: [1.1, 0, -1.2], t, scale: 0.9, tint: [0.75, 0.92, 1], spiky: true, seed: 6 }];
    s.blasts = [{ pos: [1.2, 0.6, -1.0], size: 1.0, k: seg(t, 74.4, 74.9) }];
    s.flames = [[1.2, 0, -1.2, 1.0]];
    s.camera = { eye: [0, 0.85, 2.4 + k * 0.1], at: [0, 0.7, 0], fov: 46 };
    return s;
  }

  function clubAttack(t) {
    const s = blank();
    s.arch = true;
    s.path = false;
    s.skySpin = 0.8;
    const k = t - 74.9;
    s.klee = standing(t, 0, 0, PI, { hR: [-0.15, 0.2, 0.1], eR: [-0.6, 0.4, -0.3] });
    s.hilis = [hili(t, 0.7, -0.9 + k * 0.4, -0.5, 'red', { run: 0.3, raise: 0.9 + S(k * 8) * 0.5 })];
    s.slimes = [{ pos: [-0.8, 0, -1.6], t, scale: 0.8, tint: [0.5, 0.95, 0.8], seed: 4 }];
    s.blasts = [{ pos: [-0.6, 0.7, -0.8], size: 1.0, k: seg(t, 74.95, 75.35) }];
    s.flash = 0.3 * seg(t, 75.1, 75.35);
    s.camera = { eye: [0.25, 0.85, 1.5], at: [0.1, 0.7, -2], fov: 48 };
    return s;
  }

  function whiteFlash(t) {
    const s = blank();
    s.arch = true;
    s.path = false;
    s.skySpin = 0.8;
    s.klee = standing(t, -0.2, 0, -1.1, { mouth: 'grin', eyes: 'open', hR: [-0.15, 0.15, 0.12], eR: [-0.6, 0.4, -0.3] });
    s.slimes = [{ pos: [0.6, 0, -0.6], t, scale: 1.1, tint: [0.8, 0.95, 1], spiky: true, seed: 7 }];
    s.flames = [[0.8, 0, -1.0, 1.4], [1.6, 0, -0.4, 1.2]];
    s.blasts = [{ pos: [0.2, 0.9, -1.0], size: 2.2, k: 0.4 + seg(t, 75.35, 76.33) * 0.4 }];
    s.flash = t < 75.62 ? lerp(0.35, 1, seg(t, 75.35, 75.62)) : t < 75.9 ? 1 : lerp(1, 0.4, ease(seg(t, 75.9, 76.15)));
    s.flashColor = [1, 0.99, 0.97];
    s.camera = { eye: [0.5, 0.85, 1.6], at: [0.1, 0.8, -1], fov: 50 };
    return s;
  }

  function sunsetIce(t) {
    const s = blank();
    s.tod = 'sunset';
    s.env = 'sunset';
    s.skySpin = SUN_TO_FRONT + 0.35;
    s.path = false;
    s.dry = true;
    s.klee = fighter(t, 0, -1.2, 0, 0.55);
    const ice = [0.72, 0.88, 1];
    s.slimes = [
      { pos: [-0.8, 0, -1.8], t, scale: 1.3, tint: ice, spiky: true, seed: 7 },
      { pos: [0.9, 0, -2.0], t, scale: 1.5, tint: ice, spiky: true, seed: 8 },
      { pos: [2.0, 0, -3.0], t, scale: 0.8, tint: ice, seed: 9 }
    ];
    s.blasts = [{ pos: [0.6, 0.7, -1.8], size: 0.7, k: seg(t, 76.9, 77.3) }, { pos: [-0.6, 0.6, -1.7], size: 0.8, k: seg(t, 77.3, 77.8) }];
    s.glints = [[0.6, 1.2, -1.5, 0.1, 1], [-0.9, 1.0, -1.6, 0.08, 2]];
    s.camera = { eye: [0, 0.8, 3.0], at: [0, 0.7, -1.5], fov: 46 };
    return s;
  }

  function nightFire(t) {
    const s = blank();
    s.tod = 'night';
    s.env = 'night';
    s.path = false;
    s.skySpin = 1.0;
    const k = t - 77.88;
    s.klee = fighter(t, 0.1, -0.6, 0.1, 0.6);
    const fl = [];
    for (let i = 0; i < 6; i++) fl.push([-2.6 + i * 0.36, 0, -0.5 - i * 0.12, 0.8 + (i % 2) * 0.25, i]);
    fl.push([1.0, 0, -1.4, 0.6, 7], [1.8, 0, -2.2, 0.7, 8]);
    s.flames = fl;
    s.blasts = [{ pos: [-1.2, 0.9, -1.2], size: 0.8, k: seg(t, 78.6, 79.0) }, { pos: [-1.6, 0.7, -0.8], size: 0.9, k: seg(t, 79.15, 79.55) }];
    s.glints = [[-0.4, 1.4, -1.5, 0.12, 1], [1.4, 1.8, -2, 0.14, 2]];
    s.camera = { eye: [0, 1.1, 3.4 - k * 0.08], at: [0, 0.6, -0.8], fov: 46 };
    return s;
  }

  function riverTree(t) {
    const s = blank();
    s.path = false;
    s.dry = true;
    s.skySpin = 2.0;
    s.klee = fighter(t, -0.6, -0.8, 0.15, 0.55);
    s.hilis = [
      hili(t, 0.6, -1.0, -1.2, 'dark', { run: 0.5 }),
      hili(t, 1.2, -1.4, -1.0, 'dark', { run: 0, raise: 1.0 + S(t * 6) * 0.4 }),
      hili(t, 1.7, -0.8, -1.4, 'brown', { run: 0.4 })
    ];
    s.blasts = [{ pos: [1.0, 0.6, -1.1], size: 1.4, k: seg(t, 80.4, 81.0) }, { pos: [1.4, 0.5, -1.3], size: 1.0, k: seg(t, 80.85, 81.3) }];
    s.flash = 0.22 * seg(t, 80.4, 80.6) * (1 - seg(t, 80.9, 81.32));
    s.flashColor = [0.75, 0.45, 1];
    s.camera = { eye: [0.2, 1.0, 3.2], at: [0.2, 0.6, -1], fov: 46 };
    return s;
  }

  function goldBlast(t) {
    const s = blank();
    s.skySpin = 0.2;
    s.path = false;
    s.klee = fighter(t, 0, -0.4, 0, 0.5);
    s.hilis = [
      hili(t, -1.6, -1.4, 0.8, 'dark', { run: 0.5 }),
      hili(t, 1.4, -1.6, -0.8, 'dark', { run: 0.5 }),
      hili(t, -0.8, -2.4, 0.3, 'red', { run: 0.4 })
    ];
    s.blasts = [
      { pos: [-0.9, 0.6, -1.2], size: 1.3, k: seg(t, 81.5, 82.1) },
      { pos: [0.9, 0.7, -1.0], size: 1.4, k: seg(t, 81.9, 82.5) },
      { pos: [0.2, 0.5, -1.6], size: 1.2, k: seg(t, 82.3, 82.95) }
    ];
    s.flames = [[1.0, 0, -1.2, 0.9], [-1.2, 0, -0.8, 0.8], [0.4, 0, -2.0, 0.9]];
    s.glints = [[0.9, 1.4, -1.0, 0.15, 1], [-1.2, 1.2, -1.2, 0.12, 2]];
    s.flash = 0.28 * seg(t, 81.95, 82.15) * (1 - seg(t, 82.3, 82.8));
    s.camera = { eye: [0, 1.0, 3.6], at: [0, 0.7, -1], fov: 46 };
    return s;
  }

  function sunsetBack(t) {
    const s = blank();
    s.tod = 'sunset';
    s.env = 'sunset';
    s.skySpin = SUN_TO_FRONT + 0.45;
    s.path = false;
    s.column = true;
    const k = t - 82.97;
    const z = -2 - k * 0.6;
    s.klee = running(t, 0, z, PI, { mouth: 'grin' }, 12, 0.7);
    s.hilis = [
      hili(t, -1.0, z - 0.7, 0.6, 'dark', { run: 0.5 }),
      hili(t, 1.1, z - 1.0, -0.6, 'brown', { run: 0.5, raise: 1.0 + S(t * 5) * 0.3 })
    ];
    const back = ease(seg(t, 83.1, 83.65));
    s.camera = { eye: [lerp(0.25, 0.1, back), lerp(0.8, 0.75, back), z + lerp(0.7, 2.1, back)], at: [0, lerp(0.62, 0.7, back), z - 1.5], fov: 50 };
    s.glints = [[0.2, 1.0, z - 0.4, 0.05, 1]];
    return s;
  }

  function sunsetWide(t) {
    const s = blank();
    s.tod = 'sunset';
    s.env = 'sunset';
    s.skySpin = SUN_TO_FRONT + 0.45;
    s.column = true;
    s.path = false;
    const k = t - 84.9;
    s.klee = running(t, 0, -4 - k * 2.0, PI, { mouth: 'grin' }, 14, 1);
    s.camera = { eye: [0, 0.6, 3.0], at: [0, 2.2, -10], fov: 50 };
    return s;
  }

  function bootsSide(t) {
    const s = blank();
    s.tod = 'sunset';
    s.env = 'sunset';
    s.skySpin = SUN_TO_FRONT - 1.2;
    s.path = false;
    const k = t - 86.4;
    const x = k * 1.0;
    s.klee = running(t, x, 0, PI / 2, { mouth: 'grin' }, 9, 1.1);
    s.camera = { eye: [x + 0.12, 0.17, 0.78], at: [x + 0.06, 0.15, 0], fov: 42 };
    return s;
  }

  function sunsetLeap(t) {
    const s = blank();
    s.tod = 'sunset';
    s.env = 'sunset';
    s.skySpin = SUN_TO_FRONT;
    s.path = false;
    const z = -1.2 + clamp(t - 88.6, 0, 0.85) * 1.4;
    const up = ease(seg(t, 89.45, 89.7));
    const spread = ease(seg(t, 89.85, 90.15));
    const air = up * (0.28 + 0.1 * S(clamp(t - 89.45, 0, 1.3) * 2.6));
    const hold = { hL: [0.05, -0.02, 0.13], hR: [-0.05, -0.02, 0.13], eL: [0.6, -0.4, -0.3], eR: [-0.6, -0.4, -0.3] };
    if (up > 0.01) {
      s.klee = leaping(t, 0, air, z, 0, {
        eyes: 'shut',
        mouth: 'laugh',
        lean: -0.18,
        hL: mix3([0.17, 0.3, 0.02], [0.3, 0.12, 0.02], spread),
        hR: mix3([-0.17, 0.3, 0.02], [-0.3, 0.12, 0.02], spread)
      });
    } else if (t < 88.6) {
      s.klee = standing(t, 0, z, 0.55, Object.assign({ eyes: 'happy', mouth: 'grin', nk: [0.15, 0.1, 0.08] }, hold));
    } else {
      s.klee = running(t, 0, z, 0, Object.assign({ mouth: 'grin', eyes: 'happy' }, hold), 14, 0.8);
    }
    const glowAt = [0.0, 0.66, z + 0.16];
    s.glints = up > 0.01 ? [[-0.8, 1.2, z, 0.1, 1], [0.9, 1.5, z, 0.08, 2], [0.2, 1.8, z, 0.1, 3]] : [[glowAt[0], glowAt[1], glowAt[2], 0.09, 1], [glowAt[0] + 0.05, glowAt[1] + 0.04, glowAt[2], 0.05, 2]];
    s.slimes = [{ pos: [-1.5, 0, z - 1.4], t, scale: 1.3, tint: [0.55, 0.8, 1], seed: 8 }];
    s.hilis = [hili(t, 1.9, z - 2.4, 0.3, 'dark', { run: 1 })];
    s.flames = t > 89.5 ? [[-0.5, 0, z + 0.1, 1.6], [0.5, 0, z + 0.2, 1.6], [0, 0, z - 0.3, 1.8], [1.2, 0, z - 0.4, 1.3], [-1.2, 0, z - 0.6, 1.3]] : [];
    s.blasts = t > 89.5 ? [{ pos: [0, 0.3, z - 0.3], size: 1.4, k: seg(t, 89.5, 90.6) }] : [];
    const wide = ease(seg(t, 88.7, 89.3));
    s.camera = {
      eye: [lerp(0.35, 0, wide), lerp(0.82, 0.6, wide), z + lerp(0.95, 3.4, wide)],
      at: [lerp(0.02, 0, wide), lerp(0.74, 0.85, wide), z - 0.2 * wide],
      fov: 48
    };
    return s;
  }

  function sunsetPortrait(t) {
    const s = blank();
    s.tod = 'sunset';
    s.env = 'sunset';
    s.set = 'plaza';
    s.skySpin = SUN_TO_FRONT + 3.0;
    const k = seg(t, 90.72, 91.93);
    s.klee = standing(t, 0, 0, -0.2, {
      eyes: blink(t, 'open'),
      mouth: 'smile',
      nk: [0.05, 0.2, 0.1],
      hL: [0.02, 0.13, 0.12],
      eL: [0.6, -0.5, -0.3],
      hR: [-0.1, -0.08, 0.08]
    });
    s.flames = [[0.9, 0, -0.5, 1.8], [-1.0, 0, -0.9, 1.4]];
    s.blasts = [{ pos: [1.0, 0.5, -0.6], size: 1.4, k: 0.3 }];
    s.clovers = [[-0.35, 1.05, 0.0, 0.035, 1], [0.35, 1.1, 0.1, 0.03, 2]];
    s.glints = [[0.4, 1.0, 0.2, 0.05, 1], [-0.5, 0.9, 0.2, 0.04, 2]];
    s.camera = { eye: [0.0, 0.86, lerp(0.85, 0.72, k)], at: [0, 0.82, 0], fov: 44 };
    return s;
  }

  const SHOTS = [
    [14.23, 20.8, plazaDance],
    [20.8, 24.25, lattice],
    [24.25, 27.83, titleCard],
    [27.83, 30.1, meadowBattle],
    [30.1, 30.9, smokeProfile],
    [30.9, 32.0, runToward],
    [32.0, 32.6, comicPanel],
    [32.6, 33.4, backpackClose],
    [33.4, 34.87, throwFromBehind],
    [34.87, 35.53, dumptyLow],
    [35.53, 36.65, blastFront],
    [36.65, 38.7, battleMid],
    [38.7, 39.6, fireSweep],
    [39.6, 40.5, runLeft],
    [40.5, 41.88, slimeBeach],
    [41.88, 42.45, slimeHit],
    [42.45, 43.45, grassWide],
    [43.45, 44.9, castleSide],
    [44.9, 46.28, frontArmsOut],
    [46.28, 48.13, jeanLegsShot],
    [48.13, 52.37, jeanFace],
    [52.37, 56.48, hallWide],
    [56.48, 60.87, hallNear],
    [60.87, 61.1, doorClose],
    [61.1, 62.58, kleeFaceClose],
    [62.58, 64.0, armsOutFront],
    [64.0, 65.9, wallRun],
    [65.9, 69.42, golemTop],
    [69.42, 70.35, dumptyPortrait],
    [70.35, 70.52, purpleThrow],
    [70.52, 71.25, sigilBlast],
    [71.25, 72.25, nightBattle],
    [72.25, 72.9, dayBattle],
    [72.9, 74.25, archRuins],
    [74.25, 74.9, frontShoot],
    [74.9, 75.35, clubAttack],
    [75.35, 76.33, whiteFlash],
    [76.33, 77.88, sunsetIce],
    [77.88, 79.57, nightFire],
    [79.57, 81.32, riverTree],
    [81.32, 82.97, goldBlast],
    [82.97, 84.9, sunsetBack],
    [84.9, 86.4, sunsetWide],
    [86.4, 88.08, bootsSide],
    [88.08, 90.72, sunsetLeap],
    [90.72, VISUAL_END, sunsetPortrait]
  ];

  const CUTS = [0, 4.57].concat(Cards.CARDS.map(c => c.t0).slice(1), SHOTS.map(s => s[0]), [VISUAL_END]).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

  function stage(rawT) {
    const t = clamp(rawT, 0, DURATION);
    let s = null;
    if (t < 4.57) {
      s = blank();
      s.kind = 'black';
      s.set = 'none';
    } else if (t >= VISUAL_END) {
      s = blank();
      s.kind = 'logo';
      s.set = 'none';
      s.logoK = t - VISUAL_END;
    } else if (t < 14.23) {
      s = blank();
      s.kind = 'cards';
      s.set = 'none';
      s.card = Cards.cardAt(t);
      const c = Cards.CARDS[s.card];
      s.cardK = c ? (t - c.t0) / (c.t1 - c.t0) : 0;
    } else {
      const shot = SHOTS.find(x => t >= x[0] && t < x[1]) || SHOTS[SHOTS.length - 1];
      s = shot[2](t);
    }
    s.t = t;
    s.env = s.env || s.tod;
    s.voice = VOICE(t);
    return s;
  }

  window.KleeScript = { ID, DURATION, VISUAL_END, CUTS, VOICE, ENVS, SHOTS, stage, kleeVoice };
})();
