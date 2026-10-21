(function () {
  const K = window.YouVidKit;
  const { clamp, lerp, ease } = K;

  const ID = 'Str3yHarmon1';
  const DURATION = 23.24;

  const VOICE = K.envelope('eAb8yHndbtJLmCIBzg8BAjgqytzvtjCAoznzc9oiEnvtyorrgfxAqnotrlnddfaikgcjhgfe876b967778bbdgijnmhgijkljliibccpqrsttrsrqpnjg97dmoqrpnrpnnnpprprqotutpuwoovquyutuxuqwvi866698accdba9fgeabaifhdejiimlfdfccdihdcbcbbaagheb99dccefhc99aOJGGMmhgONyjjLZZZZZZZZAYZKuSWfJTQSYGcAMe98xIzYGzKqhDZBifrWUZUZQGPuyoFAvZzjellkggpwkFCFzFCmixynjifguopkRDIlNZUOogtArkGKCAXRIJnDvnoqnxtogjpgdimonhnqLHBpricbaaa99itlgeJMyppNZKLDqvpmDdeuMHwFspkBAgFvhwvFNHFAtjdeddpmeecekKEBXVxghgHmqjhixHoecdefbcccdd', 20);

  const HEAD_KEYS = [
    [0, [0.62, 0.42, 0.35, 0, 0.1, 0]],
    [1, [0.56, 0.4, 0.36, 0.05, 0.15, 0.12]],
    [2, [0.6, 0.38, 0.36, -0.05, 0.35, -0.05]],
    [3, [0.62, 0.44, 0.34, 0, -0.25, 0]],
    [3.8, [0.5, 0.44, 0.37, 0.25, 0, 0.1]],
    [4.6, [0.46, 0.42, 0.38, 0.3, 0, 0.15]],
    [5.4, [0.5, 0.44, 0.38, 0.1, 0, -0.05]],
    [6.2, [0.52, 0.45, 0.38, 0.05, 0, 0]],
    [7.2, [0.52, 0.45, 0.38, 0, 0, 0.06]],
    [8, [0.45, 0.5, 0.4, 0.4, -0.05, 0]],
    [9, [0.44, 0.5, 0.4, 0.45, -0.05, 0]],
    [9.6, [0.47, 0.5, 0.46, 0.3, 0.1, 0]],
    [10, [0.5, 0.48, 0.55, 0.1, 0.2, 0]],
    [11, [0.44, 0.5, 0.66, 0.5, 0, 0.05]],
    [11.8, [0.3, 0.56, 0.8, 0.6, -0.2, 0.05]],
    [12.6, [0.27, 0.58, 0.88, 0.72, -0.2, 0]],
    [13.4, [0.3, 0.58, 0.84, 0.7, -0.2, 0]],
    [14.2, [0.58, 0.55, 0.62, 0.5, -0.05, 0]],
    [15, [0.55, 0.52, 0.62, 0.45, 0, 0.05]],
    [16, [0.46, 0.55, 0.57, 0.5, -0.1, 0]],
    [17, [0.58, 0.52, 0.58, 0.3, 0, -0.05]],
    [17.8, [0.55, 0.54, 0.53, 0, 0.05, 0]],
    [18.6, [0.52, 0.55, 0.6, 0, 0, 0.05]],
    [19.4, [0.52, 0.56, 0.62, 0, 0.05, 0]],
    [20.2, [0.42, 0.52, 0.5, 0.15, 0, 0]],
    [21, [0.5, 0.55, 0.5, 0.05, 0, 0]],
    [23.24, [0.52, 0.55, 0.5, 0, 0, 0]]
  ];

  const HAND_KEYS = [
    [3.2, [0.3, -0.35, 0.05, -0.3, 0, 0]],
    [3.9, [0.16, -0.06, 0.09, 0.4, -0.4, 0]],
    [4.6, [0.16, -0.05, 0.09, 0.5, -0.5, 0]],
    [5, [0.3, 0.05, 0.1, -0.3, -0.2, 0]],
    [5.4, [0.34, 0.1, 0.1, -0.9, 0, 0]],
    [6.1, [0.34, -0.4, 0.05, -0.6, 0, 0]]
  ];
  const HAND_SPAN = [3.25, 6.05];

  const EYES = [[0, 'half'], [1.6, 'open'], [2, 'shut'], [2.7, 'half'], [3.2, 'open'], [9.6, 'wide'], [11, 'open'], [17.7, 'wide'], [19.9, 'open']];
  const BROWS = [[0, 'lift'], [1.8, 'up'], [2.7, 'flat'], [3.4, 'furrow'], [6.2, 'up/furrow'], [7.6, 'furrow'], [9.6, 'up'], [11, 'furrow'], [17.6, 'up'], [20, 'up/furrow']];
  const BLINKS = [0.35, 3.1, 5.9, 7.3, 8.7, 14.6, 15.8, 16.7, 21.4, 22.6];
  const ROUND_SPAN = [9.8, 11.0];
  const TEETH_SPANS = [[18.2, 18.7], [19.0, 19.9]];
  const SMIRK_SPAN = [6.2, 7.5];

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
    if (inSpan(ROUND_SPAN, t) && v > 0.18) mouth = 'round';
    if (TEETH_SPANS.some(s => inSpan(s, t))) {
      mouth = 'teeth';
      spread = v > 0.5 ? 1 : 0;
    }
    if (mouth === 'shut' && inSpan(SMIRK_SPAN, t)) mouth = 'smirk';
    const gaze = yaw > 0.35 ? -1 : 0;
    return { eyes, brows, mouth, gaze, spread, voice: v };
  }

  function worldOf(k) {
    const dist = 0.26 / k[2];
    return [(k[0] - 0.5) * 1.016 * dist, (0.5 - k[1]) * 0.728 * dist, 1 - dist];
  }

  function chatScroll(t) {
    return clamp(t / 22.5, 0, 1);
  }

  function gradeAt(t) {
    const k = ease(clamp((t - 1.5) / 0.3, 0, 1)) * (1 - ease(clamp((t - 2.6) / 0.5, 0, 1)));
    return [lerp(1, 1.04, k), lerp(1, 1.22, k), lerp(1, 1.08, k), lerp(0, 0.08, k)];
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const k = headAt(tt);
    const p = worldOf(k);
    const sway = [Math.sin(tt * 1.7) * 0.004, Math.sin(tt * 2.3 + 1) * 0.003, 0];
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

  window.StrayScript = { ID, DURATION, VOICE, HEAD_KEYS, HAND_SPAN, TEETH_SPANS, ROUND_SPAN, stage, faceAt, chatScroll };
})();
