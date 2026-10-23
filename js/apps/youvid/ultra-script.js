(function () {
  const K = window.YouVidKit;
  const { clamp, lerp, ease } = K;

  const ID = 'Str3yUltr498';
  const DURATION = 15.95;

  const VOICE = K.envelope('7fcakpkc8cemjgeikicjnfhgekjjanojjqrfjomgibgl9hhmbhfchjeahfbbehdbgdifgjf8bbbc845qabvpfdWZZFskf8efbtugecqonyFFueeijxn75mb54fkbadf674c55g7ac8uqbab9fcab99ek76bcfdcedfgcea98efebfhsb3a4joc432nstClgd9dba6536656d9muv5ab78fb9gkhd89aa44bfca6933dkb2ag36f85bgbcf5335dkf69ge8ch97k98a99gakfb778blfgaacfie9cfjheb8ahde98fccfebd855c76560', 20);

  const HEAD_KEYS = [
    [0.0, [0.60, 0.53, 0.45, -0.04, 0.04, 0.02]],
    [1.0, [0.59, 0.52, 0.45, -0.02, 0.02, 0.01]],
    [2.0, [0.58, 0.52, 0.44, 0.00, 0.02, 0.01]],
    [2.4, [0.58, 0.50, 0.44, 0.09, 0.02, -0.01]],
    [3.2, [0.61, 0.53, 0.46, 0.02, 0.01, -0.03]],
    [3.8, [0.64, 0.54, 0.46, -0.01, 0.03, -0.07]],
    [4.2, [0.60, 0.51, 0.45, 0.12, 0.04, -0.06]],
    [4.4, [0.57, 0.50, 0.43, 0.14, 0.06, -0.01]],
    [4.8, [0.60, 0.46, 0.42, 0.08, -0.01, -0.04]],
    [5.6, [0.62, 0.47, 0.42, 0.01, -0.01, -0.04]],
    [6.4, [0.62, 0.48, 0.42, 0.01, -0.05, -0.05]],
    [6.8, [0.64, 0.51, 0.43, -0.12, 0.00, -0.02]],
    [7.2, [0.62, 0.48, 0.44, -0.05, 0.02, -0.05]],
    [7.8, [0.61, 0.46, 0.41, -0.02, -0.03, -0.04]],
    [8.6, [0.61, 0.46, 0.42, -0.01, -0.04, -0.05]],
    [9.0, [0.63, 0.46, 0.43, -0.09, -0.01, -0.04]],
    [9.6, [0.62, 0.47, 0.42, -0.05, 0.01, -0.03]],
    [10.2, [0.60, 0.48, 0.43, 0.00, -0.04, -0.04]],
    [10.8, [0.61, 0.47, 0.43, 0.03, -0.03, -0.03]],
    [11.6, [0.61, 0.48, 0.43, 0.00, -0.02, -0.03]],
    [12.2, [0.60, 0.48, 0.42, -0.02, -0.01, -0.01]],
    [12.8, [0.61, 0.42, 0.42, -0.05, -0.06, -0.03]],
    [13.4, [0.62, 0.45, 0.43, -0.01, -0.04, -0.03]],
    [13.8, [0.61, 0.43, 0.42, 0.04, -0.06, -0.04]],
    [14.2, [0.59, 0.47, 0.44, 0.13, -0.01, -0.02]],
    [14.8, [0.60, 0.47, 0.42, 0.10, 0.00, -0.01]],
    [15.4, [0.60, 0.46, 0.44, 0.16, -0.04, -0.06]],
    [15.95, [0.60, 0.47, 0.45, 0.19, -0.04, -0.09]]
  ];

  const SPEECH_SPANS = [
    [2.8, 6.4],
    [6.8, 7.6],
    [8.8, 14.3]
  ];

  const EYES = [
    [0.0, 'open'],
    [0.4, 'half'],
    [1.6, 'open'],
    [2.2, 'half'],
    [2.8, 'open'],
    [3.9, 'wide'],
    [4.3, 'pop'],
    [4.6, 'wide'],
    [5.9, 'half'],
    [7.1, 'shut'],
    [7.4, 'half'],
    [9.4, 'open'],
    [9.75, 'pop'],
    [10.5, 'open'],
    [11.0, 'half'],
    [12.5, 'wide'],
    [13.1, 'open'],
    [14.0, 'wide'],
    [14.7, 'open']
  ];

  const BROWS = [
    [0.0, 'furrow'],
    [2.8, 'up/furrow'],
    [3.9, 'high'],
    [4.6, 'up'],
    [5.9, 'furrow'],
    [8.8, 'up/furrow'],
    [9.7, 'high'],
    [10.9, 'furrow'],
    [11.7, 'up'],
    [12.5, 'high'],
    [13.2, 'up/furrow'],
    [14.0, 'up'],
    [14.8, 'furrow']
  ];

  const BLINKS = [1.1, 2.55, 6.5, 8.2, 11.3, 14.9];
  const ROUND_SPANS = [[4.5, 5.25], [7.0, 7.6], [8.8, 9.3], [11.7, 12.95]];
  const TEETH_SPANS = [[2.8, 4.45], [5.3, 5.9], [9.35, 10.9], [13.1, 14.3], [15.2, 15.95]];
  const SMIRK_SPANS = [[14.4, 15.15]];
  const POUT_SPANS = [[0.8, 2.3], [7.7, 8.7]];

  const CHAT = [
    ['vovapain', '#54a0ff', '\u041e\u0421\u0423\u0416\u0414\u0410\u042e \u041c\u0410\u041a\u0421\u0418\u041c\u0410\u041b\u042c\u041d\u041e'],
    ['dima_pudge', '#ff9f43', '\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425'],
    ['katos_donat', '#ff6b6b', '\u0423\u041b\u042c\u0422\u0420\u0410 \u0413\u0418\u041f\u0415\u0420 \u041e\u0421\u0423\u0416\u0414\u0415\u041d\u0418\u0415 KEKW'],
    ['artur_145', '#1dd1a1', '\u0421\u0412\u0415\u0420\u0425\u041e\u0421\u0423\u0416\u0414\u0415\u041d\u0418\u0415'],
    ['stepan228', '#feca57', 'F[F[F[F[F[F[F[F'],
    ['nikita_boss', '#ff6b81', '\u041c\u0410\u041a\u0421\u0418\u041c\u0410\u041b\u042c\u041d\u041e\u0415 \u041e\u0421\u0423\u0416\u0414\u0415\u041d\u0418\u0415'],
    ['serega_pirat', '#70a1ff', '\u0410\u0425\u0410\u0425\u0410\u0425\u041f\u0425\u041f\u0425\u041f\u0425\u041f'],
    ['roma_krip', '#7bed9f', '\u041e\u0421\u0423\u0416\u0414\u0410\u0415\u041c \u0412\u0421\u0415\u041c \u0427\u0410\u0422\u041e\u041c'],
    ['kirill_mid', '#ffa502', '\u0423\u041b\u042c\u0422\u0420\u0410 \u0413\u0418\u041f\u0415\u0420 \u0412\u0410\u0422\u0418\u041a\u0410\u041d\u0421\u041a\u041e\u0415'],
    ['maxim_stream', '#a29bfe', '\u0412\u0425\u0410\u0425\u0412\u0425\u0410\u0425\u0412\u0425\u0410\u0425\u0412\u0425'],
    ['vitalya_98', '#fd79a8', '\u0411\u041e\u0414\u042f \u0412\u042b\u0414\u0410\u041b \u0411\u0410\u0417\u0423 \u041e\u0421\u0423\u0416\u0414\u0415\u041d\u0418\u042f'],
    ['gleb_stray', '#00cec9', '\u041f\u0420\u041e\u0421\u0422\u041e \u0421\u0412\u0415\u0420\u0425\u041e\u0421\u0423\u0416\u0414\u0415\u041d\u0418\u0415 KEKW'],
    ['danya_zxc', '#fab1a0', '\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u0425\u0410\u0425'],
    ['egor_pudge', '#fdcb6e', '\u0417\u0410 \u0422\u0410\u041a\u0418\u0415 \u0412\u042b\u0421\u041a\u0410\u0417\u042b\u0412\u0410\u041d\u0418\u042f \u041e\u0421\u0423\u0416\u0414\u0410\u042e'],
    ['ilya_manta', '#55efc4', 'F[[F[F[F[F[F[F'],
    ['pavel_radiance', '#ff7675', '\u0421\u0422\u0420\u0410\u0425\u041e\u0412\u041a\u0410 \u041a\u0410\u041d\u0410\u041b\u0410 1000%'],
    ['anton_usy', '#74b9ff', '\u0423\u041b\u042c\u0422\u0420\u0410-\u0413\u0418\u041f\u0415\u0420 \u041e\u0421\u0423\u0416\u0414\u0410\u042e'],
    ['kostya_tinker', '#ffeaa7', '\u0410\u0425\u0410\u0425\u0410\u0425\u0410\u0425\u041f\u0425\u041f\u0425\u041f'],
    ['zhenya_cat', '#81ecec', '\u041d\u041e\u0412\u042b\u0419 \u0423\u0420\u041e\u0412\u0415\u041d\u042c \u041e\u0421\u0423\u0416\u0414\u0415\u041d\u0418\u042f'],
    ['vlad_immortal', '#a29bfe', '\u041e\u0421\u0423\u0416\u0414\u0410\u042e \u041c\u0410\u041a\u0421\u0418\u041c\u0410\u041b\u042c\u041d\u041e!']
  ];

  const headAt = K.keys(HEAD_KEYS);

  function pick(list, t) {
    let v = list[0][1];
    list.forEach(([t0, x]) => { if (t >= t0) v = x; });
    return v;
  }

  function inSpan(span, t) {
    return t >= span[0] && t < span[1];
  }

  function screenGlow(t) {
    const flash1 = ease(clamp((t - 3.4) / 0.25, 0, 1)) * (1 - ease(clamp((t - 4.7) / 0.3, 0, 1)));
    const dim = ease(clamp((t - 6.8) / 0.3, 0, 1)) * (1 - ease(clamp((t - 9.1) / 0.25, 0, 1)));
    const flash2 = ease(clamp((t - 9.4) / 0.25, 0, 1)) * (1 - ease(clamp((t - 11.0) / 0.3, 0, 1)));
    const endGlow = ease(clamp((t - 12.8) / 0.35, 0, 1));
    return clamp(0.62 + 0.28 * flash1 - 0.36 * dim + 0.34 * flash2 + 0.22 * endGlow, 0, 1);
  }

  function gradeAt(t) {
    const g = screenGlow(t);
    return [lerp(0.92, 1.13, g), lerp(0.91, 1.09, g), lerp(0.96, 1.20, g), lerp(-0.02, 0.06, g)];
  }

  function faceAt(t, yaw) {
    const rawV = VOICE(t);
    const speaking = SPEECH_SPANS.some(s => inSpan(s, t));
    const v = speaking ? rawV : rawV * 0.16;
    const blink = BLINKS.some(b => t > b && t < b + 0.12);
    const eyes = blink ? 'shut' : pick(EYES, t);
    const brows = pick(BROWS, t);
    let mouth = v < 0.11 ? 'shut' : v < 0.28 ? 'a1' : v < 0.5 ? 'a2' : 'a3';
    let spread = 0;
    if (ROUND_SPANS.some(s => inSpan(s, t))) mouth = 'round';
    if (TEETH_SPANS.some(s => inSpan(s, t))) {
      mouth = 'teeth';
      spread = v > 0.42 ? 1 : 0;
    }
    if (mouth === 'shut' && POUT_SPANS.some(s => inSpan(s, t))) mouth = 'pout';
    if (mouth === 'shut' && SMIRK_SPANS.some(s => inSpan(s, t))) mouth = 'smirk';
    const gaze = yaw > 0.11 ? -1 : yaw < -0.08 ? 1 : 0;
    return { eyes, brows, mouth, gaze, spread, voice: v };
  }

  function worldOf(k) {
    const dist = 0.26 / k[2];
    return [(k[0] - 0.5) * 1.016 * dist, (0.5 - k[1]) * 0.728 * dist, 1 - dist];
  }

  function chatScroll(t) {
    return clamp(t / 15.5, 0, 1);
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const k = headAt(tt);
    const p = worldOf(k);
    const jolt = ((tt >= 3.6 && tt <= 5.5) || (tt >= 9.3 && tt <= 14.1)) ? Math.sin(tt * 20.0) * 0.005 : 0;
    const sway = [Math.sin(tt * 1.9) * 0.004 + jolt, Math.sin(tt * 2.5 + 1) * 0.003, 0];
    const yaw = k[3] + Math.sin(tt * 2.8) * 0.011;
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
    return { t: tt, pose, face, chat: chatScroll(tt), grade: gradeAt(tt), size: k[2] };
  }

  window.UltraScript = {
    ID,
    DURATION,
    VOICE,
    HEAD_KEYS,
    SPEECH_SPANS,
    TEETH_SPANS,
    ROUND_SPANS,
    CHAT,
    stage,
    faceAt,
    chatScroll,
    gradeAt
  };
})();
