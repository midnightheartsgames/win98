(function () {
  const K = window.YouVidKit;
  const { clamp, lerp, ease } = K;

  const ID = 'Str3yOsud1l';
  const DURATION = 31.3;

  const VOICE = K.envelope('000100000018qCwh985kuBpb5647ud31727jf5cfc8d38yd3xCCggd5331ci6dgbca7d47db84flkb987216d32689je366194327ba86311111111117CqtHFdFGcdf610bCGBmXZZob9ZCb611100111100011100001011000017pVuhIAAkdwC92118511zGGAa31110001001gGEq10100000000012jCBx72210000305AzAe495444322110004csDl100031gvuc100110111ibcumjt6bt8anbesXZZyhzAvJKOhegKPksEj3hjJcwIEFddaca42111111jm2111111111atg2111111112iv6d8xo111113hp4124arc11111121kqd11111111111aoj1111111141nqe11111623qn2111221mqa1111eomd111111111kYpwuZMSqzLy96Ly9hvpBijJZXv6otnyDa6f9afxp95gTn7lGyBmZZZZEIw9EVBXr6HRx6vp62czptqn732pCMkDBsdjqld3275311112114eGDx6ZEjIoXZWSmkGb98ssyIHEoiscafe615MDPFOwld6322121110', 20);

  const HEAD_KEYS = [
    [0, [0.58, 0.45, 0.40, 0.14, 0.04, -0.02]],
    [0.8, [0.60, 0.45, 0.41, 0.05, 0.05, 0.00]],
    [1.6, [0.62, 0.46, 0.41, 0.04, 0.06, 0.03]],
    [2.4, [0.63, 0.46, 0.41, -0.03, 0.07, 0.03]],
    [3.4, [0.62, 0.45, 0.42, 0.03, 0.04, 0.02]],
    [4.4, [0.61, 0.44, 0.42, 0.08, 0.03, 0.03]],
    [5.4, [0.60, 0.45, 0.41, 0.11, 0.04, 0.03]],
    [6.2, [0.59, 0.45, 0.40, 0.12, 0.05, 0.01]],
    [7.0, [0.49, 0.44, 0.37, 0.46, 0.06, 0.04]],
    [7.6, [0.49, 0.44, 0.37, 0.48, 0.07, 0.04]],
    [8.2, [0.55, 0.44, 0.40, 0.28, 0.03, 0.01]],
    [8.7, [0.56, 0.44, 0.41, 0.26, 0.02, 0.01]],
    [9.1, [0.60, 0.42, 0.46, 0.04, -0.12, 0.02]],
    [9.7, [0.59, 0.42, 0.46, 0.06, -0.10, 0.01]],
    [10.3, [0.50, 0.45, 0.37, 0.46, 0.07, 0.02]],
    [11.2, [0.50, 0.44, 0.37, 0.47, 0.05, -0.01]],
    [11.9, [0.52, 0.43, 0.40, 0.34, -0.02, 0.01]],
    [12.7, [0.50, 0.44, 0.38, 0.44, 0.05, 0.02]],
    [13.6, [0.49, 0.45, 0.37, 0.47, 0.08, 0.01]],
    [14.3, [0.55, 0.44, 0.43, 0.24, 0.02, 0.01]],
    [15.0, [0.58, 0.43, 0.48, 0.06, -0.06, 0.04]],
    [15.6, [0.59, 0.43, 0.50, 0.04, -0.08, 0.04]],
    [16.4, [0.57, 0.44, 0.46, 0.14, -0.03, -0.01]],
    [17.1, [0.59, 0.43, 0.47, 0.04, -0.04, -0.02]],
    [17.7, [0.51, 0.48, 0.38, 0.46, 0.10, 0.02]],
    [18.6, [0.51, 0.49, 0.38, 0.47, 0.11, 0.03]],
    [19.4, [0.51, 0.49, 0.38, 0.47, 0.11, 0.03]],
    [20.2, [0.55, 0.46, 0.41, 0.32, 0.05, 0.02]],
    [20.8, [0.58, 0.44, 0.45, 0.10, 0.00, 0.00]],
    [21.6, [0.52, 0.46, 0.39, 0.44, 0.07, 0.01]],
    [22.4, [0.57, 0.45, 0.43, 0.10, 0.02, -0.01]],
    [23.2, [0.49, 0.46, 0.37, 0.46, 0.08, 0.00]],
    [23.9, [0.62, 0.43, 0.45, -0.06, -0.04, 0.02]],
    [24.8, [0.65, 0.44, 0.47, -0.18, -0.03, 0.05]],
    [25.7, [0.64, 0.42, 0.48, -0.15, -0.08, 0.04]],
    [26.6, [0.63, 0.43, 0.48, -0.12, -0.05, 0.04]],
    [27.4, [0.60, 0.43, 0.45, -0.08, -0.03, -0.01]],
    [28.2, [0.58, 0.45, 0.44, 0.06, 0.02, -0.01]],
    [29.0, [0.60, 0.45, 0.44, 0.02, 0.03, -0.01]],
    [29.8, [0.61, 0.46, 0.45, -0.01, 0.05, -0.02]],
    [30.6, [0.59, 0.46, 0.43, 0.04, 0.05, -0.02]],
    [31.3, [0.56, 0.46, 0.42, 0.14, 0.04, -0.01]]
  ];

  const HAND_KEYS = [
    [14.5, [0.28, -0.38, 0.05, -0.3, 0, 0]],
    [15.2, [0.18, -0.16, 0.10, 0.25, -0.3, 0]],
    [16.0, [0.20, -0.18, 0.09, 0.15, -0.25, 0]],
    [16.8, [0.28, -0.38, 0.05, -0.3, 0, 0]]
  ];
  const HAND_SPAN = [14.55, 16.75];

  const EYES = [
    [0, 'half'],
    [1.0, 'open'],
    [6.4, 'wide'],
    [7.8, 'open'],
    [8.9, 'wide'],
    [10.2, 'open'],
    [11.8, 'wide'],
    [13.1, 'open'],
    [14.5, 'half'],
    [15.2, 'wide'],
    [17.4, 'open'],
    [20.4, 'wide'],
    [21.5, 'open'],
    [25.6, 'wide'],
    [28.5, 'open'],
    [30.4, 'half']
  ];

  const BROWS = [
    [0, 'furrow'],
    [4.0, 'up/furrow'],
    [6.4, 'up'],
    [7.8, 'lift'],
    [8.8, 'up'],
    [10.2, 'furrow'],
    [11.8, 'up'],
    [13.1, 'furrow'],
    [14.4, 'up'],
    [17.4, 'lift'],
    [20.3, 'up'],
    [21.5, 'furrow'],
    [25.6, 'up/furrow'],
    [28.4, 'furrow']
  ];

  const BLINKS = [0.6, 2.9, 5.5, 8.2, 11.4, 14.1, 18.8, 22.8, 25.4, 28.5, 30.8];
  const ROUND_SPAN = [8.7, 10.05];
  const ROUND_SPANS = [[8.7, 10.05], [11.88, 13.06], [25.95, 26.85]];
  const TEETH_SPANS = [[7.95, 8.68], [14.35, 17.35], [19.8, 21.3], [26.85, 28.45]];
  const SMIRK_SPANS = [[7.5, 8.7], [13.8, 14.35], [17.35, 21.5]];

  const headAt = K.keys(HEAD_KEYS);
  const handAt = K.keys(HAND_KEYS);

  function pick(list, t) {
    let v = list[0][1];
    list.forEach(([t0, x]) => { if (t >= t0) v = x; });
    return v;
  }

  function inSpan(span, t) {
    return t >= span[0] && t < span[1];
  }

  function faceAt(t, yaw) {
    const v = VOICE(t);
    const blink = BLINKS.some(b => t > b && t < b + 0.12);
    const eyes = blink ? 'shut' : pick(EYES, t);
    const brows = pick(BROWS, t);
    let mouth = v < 0.1 ? 'shut' : v < 0.28 ? 'a1' : v < 0.5 ? 'a2' : 'a3';
    let spread = 0;
    if (ROUND_SPANS.some(s => inSpan(s, t)) && v > 0.14) mouth = 'round';
    if (TEETH_SPANS.some(s => inSpan(s, t))) {
      mouth = 'teeth';
      spread = v > 0.42 ? 1 : 0;
    }
    if (mouth === 'shut' && SMIRK_SPANS.some(s => inSpan(s, t))) mouth = 'smirk';
    const gaze = yaw > 0.32 ? -1 : 0;
    return { eyes, brows, mouth, gaze, spread, voice: v };
  }

  function worldOf(k) {
    const dist = 0.26 / k[2];
    return [(k[0] - 0.5) * 1.016 * dist, (0.5 - k[1]) * 0.728 * dist, 1 - dist];
  }

  function chatScroll(t) {
    return clamp(t / 30.5, 0, 1);
  }

  function gradeAt(t) {
    const k = ease(clamp((t - 8.7) / 0.35, 0, 1)) * (1 - ease(clamp((t - 10.1) / 0.45, 0, 1)));
    return [lerp(1, 1.06, k), lerp(1, 1.03, k), lerp(1, 1.12, k), lerp(0, 0.06, k)];
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const k = headAt(tt);
    const p = worldOf(k);
    const laugh = (tt >= 14.4 && tt <= 17.2) ? Math.sin(tt * 15.0) * 0.006 : 0;
    const sway = [Math.sin(tt * 1.7) * 0.004, Math.sin(tt * 2.3 + 1) * 0.003 + laugh, 0];
    const yaw = k[3] + Math.sin(tt * 2.9) * 0.012;
    const face = faceAt(tt, yaw);
    const pose = {
      p: [p[0] + sway[0], p[1] + sway[1], p[2]],
      yaw,
      pitch: k[4] + face.voice * 0.03,
      roll: k[5],
      lean: clamp((k[2] - 0.35) / 0.7, 0, 1),
      face: [face.eyes, face.brows, face.mouth, face.gaze, face.spread].join('|'),
      hand: null
    };
    if (inSpan(HAND_SPAN, tt)) {
      const h = handAt(tt);
      pose.hand = { p: [h[0], h[1], h[2]], rz: h[3], rx: h[4], ry: h[5] };
    }
    return { t: tt, pose, face, chat: chatScroll(tt), grade: gradeAt(tt), size: k[2] };
  }

  window.OsudilScript = { ID, DURATION, VOICE, HEAD_KEYS, HAND_SPAN, TEETH_SPANS, ROUND_SPAN, ROUND_SPANS, stage, faceAt, chatScroll };
})();
