(function () {
  const K = window.YouVidKit;
  const { clamp, lerp, ease } = K;

  const ID = 'Str3yP0dsk0';
  const DURATION = 24.22;

  const VOICE = K.envelope('223235222374453111498877543789776657886566555433333332222233332463747a464454211257776218aai9ntvsowme68xzqh85npiluElFPmdswd765558hFhecbazwFExrxxsmc8nb8nVLq8BJk655675334343454454lGvoc52Eufb4qISvxwsNOXWZZYURImdagokaccbef7666aiejkha65434556egekec85fheaim56936pzidd3i84gisD635xyg58d446bse4no72eond5lrtstti7g718gbda316sJxI84da64af63dlba4kwmoejtnyg53bg728dike2102aa2df6753897315731001112114aid7jjcdyob8dc44wdp8gg4fwtwvdtn7acg6329c74100000000000011017a345g9bjmgeb6dh5fc376cjigc962111110000000', 20);

  const HEAD_KEYS = [
    [0.0, [0.53, 0.55, 0.39, 0.16, 0.02, 0.00]],
    [1.0, [0.54, 0.55, 0.39, 0.18, 0.02, 0.00]],
    [2.0, [0.53, 0.55, 0.39, 0.22, 0.03, 0.01]],
    [3.0, [0.53, 0.54, 0.40, 0.24, 0.02, 0.01]],
    [3.5, [0.48, 0.48, 0.45, 0.34, 0.04, 0.02]],
    [4.0, [0.44, 0.42, 0.51, 0.42, 0.06, 0.03]],
    [4.35, [0.42, 0.40, 0.55, 0.45, 0.05, 0.03]],
    [4.8, [0.46, 0.45, 0.49, 0.38, 0.02, 0.02]],
    [5.5, [0.47, 0.46, 0.47, 0.34, 0.01, 0.01]],
    [6.1, [0.54, 0.39, 0.48, 0.12, -0.04, 0.00]],
    [6.45, [0.55, 0.46, 0.47, 0.10, 0.05, -0.01]],
    [6.75, [0.49, 0.29, 0.46, 0.16, -0.10, 0.02]],
    [7.0, [0.48, 0.26, 0.47, 0.18, -0.12, 0.03]],
    [7.3, [0.49, 0.31, 0.48, 0.24, -0.06, 0.02]],
    [7.6, [0.48, 0.36, 0.49, 0.36, -0.02, 0.02]],
    [8.4, [0.47, 0.37, 0.51, 0.42, 0.00, 0.03]],
    [9.4, [0.47, 0.36, 0.54, 0.46, -0.05, 0.04]],
    [10.2, [0.48, 0.37, 0.53, 0.44, -0.04, 0.03]],
    [11.2, [0.49, 0.39, 0.50, 0.38, 0.01, 0.02]],
    [12.4, [0.50, 0.39, 0.49, 0.34, 0.01, 0.02]],
    [13.3, [0.52, 0.37, 0.50, 0.08, -0.03, 0.00]],
    [14.1, [0.51, 0.38, 0.50, 0.10, -0.02, 0.00]],
    [14.7, [0.48, 0.41, 0.48, 0.34, 0.01, 0.02]],
    [15.8, [0.49, 0.41, 0.48, 0.36, -0.02, 0.02]],
    [17.0, [0.50, 0.41, 0.47, 0.30, 0.00, 0.01]],
    [17.8, [0.53, 0.43, 0.45, 0.12, -0.02, 0.00]],
    [18.8, [0.52, 0.43, 0.45, 0.14, 0.01, -0.01]],
    [19.6, [0.51, 0.43, 0.45, 0.18, 0.02, -0.02]],
    [20.4, [0.52, 0.45, 0.43, 0.14, 0.00, 0.00]],
    [21.3, [0.53, 0.46, 0.41, 0.08, -0.02, 0.00]],
    [22.6, [0.53, 0.46, 0.41, 0.10, -0.01, 0.00]],
    [24.22, [0.53, 0.47, 0.40, 0.12, 0.00, 0.00]]
  ];

  const HAND_REST = [0.38, -0.5, 0.15, 0.8, -0.35, -0.93];
  const CUP_HOLD = [0.172, -0.03, -0.03, 0.5, -0.35, -0.93];
  const CUP_LIFT = [0.17, -0.012, -0.035, 0.45, -0.28, -0.88];
  const CUP_PRESS = [0.175, -0.036, -0.026, 0.55, -0.4, -0.98];

  const HAND_KEYS = [
    [6.6, HAND_REST],
    [6.85, CUP_LIFT],
    [7.1, CUP_HOLD],
    [7.4, HAND_REST],
    [18.7, HAND_REST],
    [19.0, CUP_HOLD],
    [19.35, CUP_PRESS],
    [19.75, CUP_LIFT],
    [20.15, HAND_REST]
  ];
  const HAND_SPANS = [[6.61, 7.39], [18.71, 20.14]];

  const SPEECH_SPANS = [
    [4.35, 8.2],
    [8.8, 17.8],
    [19.1, 21.1],
    [22.1, 23.6]
  ];

  const EYES = [
    [0.0, 'half'],
    [2.0, 'open'],
    [3.5, 'wide'],
    [4.35, 'pop'],
    [5.6, 'wide'],
    [6.65, 'pop'],
    [7.6, 'wide'],
    [9.2, 'pop'],
    [10.8, 'wide'],
    [12.6, 'open'],
    [13.3, 'wide'],
    [14.6, 'open'],
    [15.6, 'wide'],
    [17.5, 'half'],
    [18.8, 'shut'],
    [19.4, 'open'],
    [21.2, 'half'],
    [22.2, 'open']
  ];

  const BROWS = [
    [0.0, 'furrow'],
    [3.5, 'high'],
    [4.35, 'up/furrow'],
    [6.65, 'high'],
    [7.6, 'up/furrow'],
    [9.2, 'high'],
    [10.8, 'up/furrow'],
    [13.3, 'up'],
    [14.6, 'up/furrow'],
    [17.5, 'furrow'],
    [22.1, 'up/furrow'],
    [23.5, 'furrow']
  ];

  const BLINKS = [0.9, 2.7, 5.9, 8.5, 11.8, 14.3, 17.2, 21.4, 23.7];
  const ROUND_SPANS = [[4.45, 5.3], [6.7, 7.45], [9.25, 10.45], [15.5, 16.5]];
  const TEETH_SPANS = [[5.35, 6.2], [7.5, 8.15], [10.5, 12.2], [13.4, 14.4], [19.2, 20.8], [22.2, 23.4]];
  const SMIRK_SPANS = [[23.4, 24.0]];
  const POUT_SPANS = [[1.2, 2.8], [17.8, 18.7]];
  const AGAPE_SPANS = [[3.6, 4.34], [6.4, 6.69]];
  const GASP_SPANS = [[6.65, 7.2]];

  const CHAT = [
    ['katos_donat', '#ff6b6b', '\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u0410'],
    ['dima_pudge', '#ff9f43', '\u041e\u0421\u0423\u0416\u0414\u0410\u042e \u041c\u0410\u041a\u0421\u0418\u041c\u0410\u041b\u042c\u041d\u041e'],
    ['vovapain', '#54a0ff', '\u041f\u041e\u0414\u0421\u041a\u041e\u0427\u0418\u041b KEKW'],
    ['artur_145', '#1dd1a1', '\u0410\u0425\u0410\u0425\u0410\u0425\u041f\u0425\u041f\u0425\u041f\u0425\u041f\u0425'],
    ['stepan228', '#feca57', '\u0427\u0422\u041e \u0417\u0410 \u0414\u041e\u041d\u0410\u0422 WutFace'],
    ['nikita_boss', '#ff6b81', 'F[F[F[F[F[F[F[F'],
    ['serega_pirat', '#70a1ff', '\u0411\u041e\u0414\u042f \u0412\u0417\u041b\u0415\u0422\u0415\u041b \u0421 \u041a\u0420\u0415\u0421\u041b\u0410'],
    ['roma_krip', '#7bed9f', '\u041e\u0421\u0423\u0416\u0414\u0410\u042e \u041e\u0421\u0423\u0416\u0414\u0410\u042e \u041e\u0421\u0423\u0416\u0414\u0410\u042e'],
    ['kirill_mid', '#ffa502', '\u0412\u0425\u0410\u0425\u0412\u0425\u0410\u0425\u0412\u0425\u0410\u0425\u0412\u0425'],
    ['maxim_stream', '#a29bfe', '\u041c\u0418\u041d\u0423\u0421 \u041a\u0410\u041d\u0410\u041b monkaS'],
    ['vitalya_98', '#fd79a8', '\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u0425\u0410\u0425'],
    ['gleb_stray', '#00cec9', '\u041a\u0410\u041a \u041e\u041d \u041f\u041e\u0414\u041f\u0420\u042b\u0413\u041d\u0423\u041b KEKW'],
    ['danya_zxc', '#fab1a0', '\u0422\u0410\u041a\u041e\u0419 \u0414\u0412\u0418\u0416 \u041d\u0415 \u041e\u0414\u041e\u0411\u0420\u042f\u0415\u041c'],
    ['egor_pudge', '#fdcb6e', '\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425'],
    ['ilya_manta', '#55efc4', '\u0421\u041f\u0420\u0418\u041d\u0422 \u0414\u041e \u0414\u041e\u041d\u0410\u0422\u0410'],
    ['pavel_radiance', '#ff7675', '\u041e\u0421\u0423\u0416\u0414\u0410\u0415\u041c \u0412\u0421\u0415\u041c \u0427\u0410\u0422\u041e\u041c'],
    ['anton_usy', '#74b9ff', 'F[[F[F[F[F[F[F'],
    ['kostya_tinker', '#ffeaa7', '\u0427\u0423\u0422\u042c \u041f\u041e\u0422\u041e\u041b\u041e\u041a \u041d\u0415 \u041f\u0420\u041e\u0411\u0418\u041b'],
    ['zhenya_cat', '#81ecec', '\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u041f\u0425\u041f\u0425\u041f'],
    ['vlad_immortal', '#a29bfe', '\u041c\u0410\u041a\u0421\u0418\u041c\u0410\u041b\u042c\u041d\u041e \u041d\u0415 \u041e\u0414\u041e\u0411\u0420\u042f\u042e']
  ];

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

  function screenGlow(t) {
    const dim1 = ease(clamp((t - 0.7) / 0.3, 0, 1)) * (1 - ease(clamp((t - 3.3) / 0.3, 0, 1)));
    const flash = ease(clamp((t - 6.6) / 0.2, 0, 1)) * (1 - ease(clamp((t - 7.4) / 0.25, 0, 1)));
    const dim2 = ease(clamp((t - 19.1) / 0.25, 0, 1)) * (1 - ease(clamp((t - 20.3) / 0.25, 0, 1)));
    return clamp(0.65 - 0.45 * dim1 + 0.35 * flash - 0.38 * dim2, 0, 1);
  }

  function gradeAt(t) {
    const g = screenGlow(t);
    return [lerp(0.92, 1.12, g), lerp(0.91, 1.09, g), lerp(0.96, 1.19, g), lerp(-0.02, 0.06, g)];
  }

  function faceAt(t, yaw) {
    const rawV = VOICE(t);
    const speaking = SPEECH_SPANS.some(s => inSpan(s, t));
    const v = speaking ? rawV : rawV * 0.16;
    const gasp = GASP_SPANS.some(s => inSpan(s, t));
    const blink = !gasp && BLINKS.some(b => t > b && t < b + 0.12);
    const eyes = blink ? 'shut' : pick(EYES, t);
    const brows = pick(BROWS, t);
    let mouth = v < 0.11 ? 'shut' : v < 0.28 ? 'a1' : v < 0.5 ? 'a2' : 'a3';
    let spread = 0;
    if (ROUND_SPANS.some(s => inSpan(s, t)) && v > 0.14) mouth = 'round';
    if (TEETH_SPANS.some(s => inSpan(s, t))) {
      mouth = 'teeth';
      spread = v > 0.42 ? 1 : 0;
    }
    if (mouth === 'shut' && POUT_SPANS.some(s => inSpan(s, t))) mouth = 'pout';
    if (mouth === 'shut' && SMIRK_SPANS.some(s => inSpan(s, t))) mouth = 'smirk';
    if (AGAPE_SPANS.some(s => inSpan(s, t))) mouth = 'round';
    if (gasp) mouth = 'gasp';
    const gaze = yaw > 0.22 ? -1 : 0;
    return { eyes, brows, mouth, gaze, spread, voice: v };
  }

  function worldOf(k) {
    const dist = 0.26 / k[2];
    return [(k[0] - 0.5) * 1.016 * dist, (0.5 - k[1]) * 0.728 * dist, 1 - dist];
  }

  function chatScroll(t) {
    return clamp(t / 23.6, 0, 1);
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const k = headAt(tt);
    const p = worldOf(k);
    const jolt = (tt >= 6.6 && tt <= 10.5) ? Math.sin(tt * 22.0) * 0.006 : 0;
    const sway = [Math.sin(tt * 1.8) * 0.004 + jolt, Math.sin(tt * 2.4 + 1) * 0.003, 0];
    const yaw = k[3] + Math.sin(tt * 2.9) * 0.012;
    const face = faceAt(tt, yaw);
    const pose = {
      p: [p[0] + sway[0], p[1] + sway[1], p[2]],
      yaw,
      pitch: k[4] + face.voice * 0.03,
      roll: k[5],
      lean: clamp((k[2] - 0.35) / 0.7, 0, 1),
      face: [face.eyes, face.brows, face.mouth, face.gaze, face.spread].join('|'),
      hand: null,
      mug: null
    };
    if (HAND_SPANS.some(s => inSpan(s, tt))) {
      const h = handAt(tt);
      pose.hand = { p: [h[0], h[1], h[2]], rz: h[3], rx: h[4], ry: h[5], grip: true };
    }
    return { t: tt, pose, face, chat: chatScroll(tt), grade: gradeAt(tt), size: k[2] };
  }

  window.PodskochilScript = {
    ID,
    DURATION,
    VOICE,
    HEAD_KEYS,
    HAND_SPANS,
    SPEECH_SPANS,
    TEETH_SPANS,
    ROUND_SPANS,
    GASP_SPANS,
    CHAT,
    stage,
    faceAt,
    chatScroll,
    gradeAt
  };
})();
