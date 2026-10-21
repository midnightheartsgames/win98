(function () {
  const K = window.YouVidKit;
  const { clamp, lerp, ease } = K;

  const ID = 'Str3yTr3k98';
  const DURATION = 36.18;

  const VOICE = K.envelope('221111000000100000001111111135444454233224432455325454443344434422222222110431044334422322124223643344454433453236432554444344533453233322322144214532343124333442155455544454336321556344434332366665222554333215567753336433422242114655565435544743156433545542225556743322223234464ba9ac358b87aa5678876323332332115421543243213432244126678634247777633364315336544666446654333444323587466543644442214211554555534421277637733454342wZPBtYm417c34Cxlmhajyd38e2kh8sb4gfjq93ffd62nvyk7oggmqr4am49B62sQEg365htpc42110000000000000006g31008xHnijlmc4ajadAibfjod3h4267oqa79becijd44agth58a1gi721101100147c6119jroia42233222223542222cid33ab5eka8ib488c44h996lf7bcda729e515c77844ac73211452be434cb855nhjumfbfe84387aadddcbce7678da3776555576443105320', 20);

  const HEAD_KEYS = [
    [0.0, [0.58, 0.45, 0.41, 0.08, -0.02, -0.01]],
    [1.0, [0.58, 0.45, 0.41, 0.05, -0.02, -0.01]],
    [2.0, [0.57, 0.44, 0.42, 0.02, 0.04, 0.00]],
    [2.8, [0.57, 0.43, 0.43, 0.00, 0.08, 0.01]],
    [3.8, [0.58, 0.45, 0.41, 0.06, -0.01, 0.00]],
    [5.0, [0.57, 0.45, 0.41, 0.14, 0.02, 0.01]],
    [6.2, [0.59, 0.44, 0.42, 0.04, 0.03, 0.02]],
    [7.4, [0.57, 0.45, 0.41, 0.12, 0.01, 0.01]],
    [8.8, [0.56, 0.45, 0.40, 0.18, 0.02, 0.00]],
    [10.2, [0.58, 0.45, 0.41, 0.08, -0.03, -0.01]],
    [11.4, [0.56, 0.44, 0.41, 0.16, 0.03, 0.01]],
    [12.8, [0.55, 0.45, 0.41, 0.22, 0.02, 0.02]],
    [13.8, [0.59, 0.44, 0.43, 0.02, -0.04, -0.02]],
    [14.8, [0.60, 0.44, 0.43, -0.04, -0.02, -0.01]],
    [15.8, [0.57, 0.45, 0.41, 0.14, 0.01, 0.01]],
    [17.2, [0.56, 0.44, 0.42, 0.18, 0.03, 0.02]],
    [18.5, [0.57, 0.43, 0.44, 0.26, 0.03, 0.02]],
    [19.3, [0.57, 0.43, 0.45, 0.24, 0.02, 0.02]],
    [19.6, [0.58, 0.43, 0.47, 0.0, 0.0, 0.0]],
    [20.3, [0.58, 0.44, 0.45, 0.02, 0.04, 0.01]],
    [21.0, [0.59, 0.43, 0.45, 0.02, -0.04, 0.02]],
    [21.8, [0.62, 0.41, 0.49, -0.08, -0.08, 0.04]],
    [22.6, [0.63, 0.41, 0.51, -0.12, -0.09, 0.05]],
    [23.5, [0.61, 0.42, 0.48, -0.06, -0.06, 0.03]],
    [24.5, [0.60, 0.43, 0.46, 0.04, -0.04, 0.01]],
    [25.5, [0.56, 0.44, 0.43, 0.20, -0.02, -0.01]],
    [26.8, [0.53, 0.45, 0.41, 0.34, 0.02, 0.01]],
    [28.2, [0.54, 0.45, 0.42, 0.28, 0.01, 0.02]],
    [29.4, [0.59, 0.42, 0.46, 0.02, -0.08, 0.04]],
    [30.4, [0.60, 0.43, 0.45, -0.04, -0.05, 0.02]],
    [31.5, [0.58, 0.44, 0.44, 0.06, -0.02, 0.00]],
    [32.6, [0.61, 0.43, 0.46, -0.06, -0.04, 0.02]],
    [33.8, [0.62, 0.42, 0.48, -0.08, -0.06, 0.03]],
    [35.0, [0.59, 0.44, 0.45, 0.04, -0.02, 0.01]],
    [36.18, [0.58, 0.45, 0.42, 0.08, 0.00, 0.00]]
  ];

  const HAND_REST = [0.38, -0.5, 0.15, 0.8, -0.35, -0.93];
  const CUP_HOLD = [0.172, -0.03, -0.03, 0.5, -0.35, -0.93];
  const CUP_LIFT = [0.17, -0.012, -0.035, 0.45, -0.28, -0.88];
  const CUP_PRESS = [0.175, -0.036, -0.026, 0.55, -0.4, -0.98];

  const HAND_KEYS = [
    [5.85, HAND_REST],
    [6.2, CUP_HOLD],
    [6.55, CUP_LIFT],
    [6.9, CUP_PRESS],
    [7.15, CUP_HOLD],
    [7.5, HAND_REST],
    [17.45, HAND_REST],
    [17.65, CUP_HOLD],
    [17.9, CUP_LIFT],
    [18.15, HAND_REST],
    [29.5, HAND_REST],
    [29.8, CUP_HOLD],
    [30.15, CUP_LIFT],
    [30.45, CUP_PRESS],
    [30.7, CUP_HOLD],
    [31.0, HAND_REST]
  ];
  const HAND_SPANS = [[5.86, 7.49], [17.46, 18.14], [29.51, 30.99]];

  const MUG_KEYS = [
    [1.4, [0.16, -0.38, 0.12, 0.0, 0.0, 0.0]],
    [2.2, [0.06, -0.13, 0.19, -0.55, 0.10, 0.18]],
    [3.1, [0.05, -0.12, 0.20, -0.65, 0.12, 0.22]],
    [4.1, [0.16, -0.38, 0.12, 0.0, 0.0, 0.0]]
  ];
  const MUG_SPAN = [1.45, 4.05];

  const SPEECH_SPANS = [
    [13.8, 15.85],
    [21.1, 25.4],
    [25.65, 30.1],
    [30.5, 35.6]
  ];

  const EYES = [
    [0.0, 'half'],
    [2.0, 'shut'],
    [3.3, 'open'],
    [4.6, 'half'],
    [5.0, 'open'],
    [5.4, 'half'],
    [7.45, 'pop'],
    [8.7, 'open'],
    [10.2, 'half'],
    [11.4, 'open'],
    [12.7, 'wide'],
    [13.4, 'half'],
    [15.8, 'open'],
    [17.4, 'half'],
    [18.05, 'pop'],
    [20.1, 'wide'],
    [21.2, 'shut'],
    [21.7, 'half'],
    [22.2, 'open'],
    [27.4, 'half'],
    [29.9, 'shut'],
    [30.3, 'open'],
    [33.4, 'half']
  ];

  const BROWS = [
    [0.0, 'furrow'],
    [5.0, 'up'],
    [5.4, 'furrow'],
    [7.45, 'high'],
    [8.7, 'up/furrow'],
    [10.2, 'furrow'],
    [11.4, 'up/furrow'],
    [12.7, 'up'],
    [13.4, 'furrow'],
    [16.0, 'up'],
    [17.4, 'furrow'],
    [18.05, 'high'],
    [20.1, 'up'],
    [22.2, 'furrow'],
    [25.6, 'up'],
    [29.1, 'furrow'],
    [31.5, 'up/furrow'],
    [33.7, 'furrow']
  ];

  const BLINKS = [0.8, 4.4, 7.6, 10.5, 13.3, 16.6, 20.4, 24.8, 28.1, 32.9, 35.6];
  const ROUND_SPANS = [[14.0, 14.9], [26.8, 28.2], [33.8, 34.9]];
  const TEETH_SPANS = [[22.4, 24.9], [28.3, 29.9], [31.6, 33.2]];
  const SMIRK_SPANS = [[30.2, 31.5]];
  const POUT_SPANS = [[7.5, 8.7]];
  const AGAPE_SPANS = [[12.75, 13.35], [20.1, 21.5]];
  const GASP_SPANS = [[18.05, 20.1]];

  const CHAT = [
    ['ebashalovo2', '#e056fd', 'АХАХАХАХАХХА'],
    ['artstyle_dota', '#ff6b6b', 'АХАХАХАХПХПХПХПХХПХП'],
    ['dimapudge', '#ff9f43', 'ВХВХАХВХАХВХАХВХ'],
    ['deadl0rd1', '#54a0ff', 'АХХАХАХАХ'],
    ['artur_145', '#1dd1a1', 'F[F[F[F[[F[F[F'],
    ['trapalligator', '#feca57', 'АХАХАХАХАХ'],
    ['vovapain', '#ff6b81', 'КАТОС ЧТО ТЫ СКИНУЛ'],
    ['stepan228', '#70a1ff', 'маленькая страна PogChamp'],
    ['nikita_boss', '#7bed9f', 'ОСУЖДАЮ МАКСИМАЛЬНО'],
    ['serega_pirat', '#ffa502', 'АХАХАХАХАХАХАХ'],
    ['roma_krip', '#a29bfe', 'не тот ремикс KEKW'],
    ['kirill_mid', '#fd79a8', 'ХПХПХПХПХПХП'],
    ['maxim_stream', '#00cec9', 'КАТОС ПЕРЕПУТАЛ ТРЭК'],
    ['vitalya_98', '#fab1a0', 'АХАХАХАХАХАХ'],
    ['gleb_stray', '#fdcb6e', 'спасибо за 1000 KEKW'],
    ['danya_zxc', '#55efc4', 'АХХАХАХАХАХХАХА'],
    ['egor_pudge', '#ff7675', 'ОСУЖДАЕМ ВСЕМ ЧАТОМ'],
    ['ilya_manta', '#74b9ff', 'F[[F[F[F[F[F[F'],
    ['pavel_radiance', '#ffeaa7', 'ВХАХВХАХВХАХВХ'],
    ['anton_usy', '#81ecec', 'КАТОС ОПЯТЬ ЗА СВОЕ'],
    ['kostya_tinker', '#fab1a0', 'АХАХАХАХХАХАХА'],
    ['zhenya_cat', '#a29bfe', 'я не этот трек думал KEKW'],
    ['vlad_immortal', '#55efc4', 'ОСУЖДАЮ МАКСИМАЛЬНО']
  ];

  const headAt = K.keys(HEAD_KEYS);
  const handAt = K.keys(HAND_KEYS);
  const mugAt = K.keys(MUG_KEYS);

  function pick(list, t) {
    let v = list[0][1];
    list.forEach(([t0, x]) => { if (t >= t0) v = x; });
    return v;
  }

  function inSpan(span, t) {
    return t >= span[0] && t < span[1];
  }

  function screenGlow(t) {
    const p1 = ease(clamp((t - 4.8) / 0.4, 0, 1)) * (1 - ease(clamp((t - 10.1) / 0.35, 0, 1)));
    const p2 = ease(clamp((t - 10.9) / 0.35, 0, 1)) * (1 - ease(clamp((t - 13.3) / 0.35, 0, 1)));
    const p3 = ease(clamp((t - 15.4) / 0.3, 0, 1)) * (1 - ease(clamp((t - 16.3) / 0.3, 0, 1)));
    const p4 = ease(clamp((t - 17.8) / 0.4, 0, 1)) * (1 - ease(clamp((t - 23.1) / 0.25, 0, 1)));
    return clamp(p1 + p2 + p3 + p4, 0, 1);
  }

  function gradeAt(t) {
    const g = screenGlow(t);
    return [lerp(0.94, 1.10, g), lerp(0.93, 1.08, g), lerp(0.98, 1.18, g), lerp(-0.01, 0.05, g)];
  }

  function faceAt(t, yaw) {
    const rawV = VOICE(t);
    const speaking = SPEECH_SPANS.some(s => inSpan(s, t));
    const v = speaking ? rawV : rawV * 0.18;
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
    return clamp(t / 35.2, 0, 1);
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const k = headAt(tt);
    const p = worldOf(k);
    const shake = (tt >= 21.2 && tt <= 25.0) ? Math.sin(tt * 18.0) * 0.005 : 0;
    const sway = [Math.sin(tt * 1.6) * 0.004 + shake, Math.sin(tt * 2.2 + 1) * 0.003, 0];
    const yaw = k[3] + Math.sin(tt * 2.7) * 0.012;
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
    if (inSpan(MUG_SPAN, tt)) {
      const m = mugAt(tt);
      pose.mug = { p: [m[0], m[1], m[2]], rx: m[3], ry: m[4], rz: m[5] };
    }
    return { t: tt, pose, face, chat: chatScroll(tt), grade: gradeAt(tt), size: k[2] };
  }

  window.TrekScript = {
    ID,
    DURATION,
    VOICE,
    HEAD_KEYS,
    HAND_SPANS,
    MUG_SPAN,
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
