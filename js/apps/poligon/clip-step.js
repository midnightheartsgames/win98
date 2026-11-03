(function () {
  const { M4, V3, Builder, shade, rgb } = window.P3D;
  const { restPose } = window.P3DFigure;
  const Cast = window.P3DCccCast;
  const GK = window.P3DGodKnowsCast;

  const BPM = 106;
  const BEAT0 = 0.364;
  const BEAT = 60 / BPM;
  const DURATION = 133.0;
  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const smooth = (x) => { const k = clamp(x, 0, 1); return k * k * (3 - 2 * k); };
  const frac = (x) => x - Math.floor(x);
  const hash = (i, k) => frac(S(i * 127.1 + (k || 0) * 311.7) * 43758.5453);
  const beatAt = (t) => (t - BEAT0) / BEAT;
  const bob = (t, lag) => 0.5 + 0.5 * C(2 * PI * (beatAt(t) - (lag === undefined ? 0.06 : lag)));
  const mixV = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const addV = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const glow = (c, k) => { const v = rgb(c); return [v[0], v[1], v[2], k === undefined ? 0.95 : k]; };

  const LOCATIONS = [
    { id: 'stage', name: 'Сцена', color: '#f0b020', scene: 'arena' },
    { id: 'close', name: 'Крупные планы', color: '#e8506a', scene: 'arena' },
    { id: 'sky', name: 'Небо на экране', color: '#58b0e8', scene: 'arena' },
    { id: 'night', name: 'Ночная сцена', color: '#8a4a1a', scene: 'arena' },
    { id: 'hall', name: 'Зал', color: '#6a5a8a', scene: 'arena' }
  ];

  const SHOT_LIST = [
    [0, 'stage', 'open'], [3.549, 'close', 'point'], [7.683, 'stage', 'openArms'], [8.666, 'close', 'lowLeft'], [10.166, 'hall', 'crowd1'],
    [12.449, 'close', 'cheeks'], [14.316, 'close', 'fingers'], [16.883, 'hall', 'crowd2'], [19.299, 'close', 'chin'], [20.95, 'stage', 'spread'],
    [21.549, 'stage', 'hipPoint'], [23.433, 'close', 'giggle'], [25.699, 'stage', 'walk1'], [28.299, 'close', 'binoculars'], [30.366, 'sky', 'title'],
    [31.099, 'close', 'laugh'], [31.43, 'sky', 'skyWide'], [32.499, 'sky', 'skyPush'], [34.799, 'sky', 'skyArms'], [37.299, 'sky', 'skyCrane'],
    [39.666, 'close', 'fingers2'], [41.85, 'hall', 'flashWide'], [44.066, 'close', 'winkPoint'], [45.333, 'stage', 'step'], [46.183, 'stage', 'screen1'],
    [47.316, 'close', 'waveLow'], [48.283, 'stage', 'screen2'], [51.099, 'close', 'clasp'], [53.016, 'stage', 'walk2'], [55.349, 'stage', 'craneOut1'],
    [59.983, 'hall', 'arena1'], [61.033, 'stage', 'pinkStars'], [62.133, 'close', 'eyeCover'], [63.349, 'night', 'beams1'], [64.399, 'close', 'byeClose'],
    [65.299, 'night', 'beams2'], [66.449, 'stage', 'arc'], [68.28, 'stage', 'screen3'], [68.833, 'close', 'heart'], [70.983, 'hall', 'crowd3'],
    [73.433, 'hall', 'arena2'], [75.266, 'stage', 'craneOut2'], [82.349, 'stage', 'stars'], [83.466, 'stage', 'topDown'], [86.949, 'night', 'tPose'],
    [88.949, 'night', 'tiltUp'], [91.516, 'night', 'sunset'], [93.649, 'night', 'salute'], [95.399, 'night', 'beamsWide'], [96.149, 'night', 'orangeArc'],
    [99.333, 'night', 'orangeWide'], [100.549, 'night', 'pushScreen'], [105.0, 'hall', 'lightsBack'], [107.716, 'close', 'screen4'], [109.266, 'hall', 'arena3'],
    [111.783, 'stage', 'screen5'], [114.116, 'close', 'kiss'], [116.283, 'hall', 'crowd4'], [118.799, 'stage', 'craneOut3'], [124.533, 'stage', 'banzai'],
    [125.466, 'close', 'bye']
  ];

  const SHOTS = SHOT_LIST.map(([start, loc, cam], i) => ({
    index: i,
    start,
    end: i + 1 < SHOT_LIST.length ? SHOT_LIST[i + 1][0] : DURATION,
    loc,
    cam,
    scene: LOCATIONS.find(l => l.id === loc).scene,
    overlay: null
  }));

  function shotAt(t) {
    let lo = 0, hi = SHOTS.length - 1;
    const tt = clamp(t, 0, DURATION);
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (SHOTS[mid].start <= tt) lo = mid; else hi = mid - 1;
    }
    return SHOTS[lo];
  }

  const fadeAt = (t) => smooth(span(t, 132.5, 133));

  function flashAt(t) {
    const up = (a, b) => smooth(span(t, a, b));
    const f1 = up(41.45, 41.85) * (1 - up(41.85, 42.45));
    const f2 = up(104.2, 105.0) * (1 - up(105.0, 105.9));
    const end = 0.42 * up(125.46, 126.3) + 0.5 * up(129.5, 133);
    return Math.max(f1, f2, end);
  }

  const VOICE = '0000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000bzzxuuqyzyyzzvtpmtwwtqqn70aqwxwutpmrutrpj80003quutp7swtntuqngtunfd710000ovxyzxrgruvtne22000muxwttyxknvwuwwvssuvxyui0007pvxxwrtwuk0mvxxunltxvqotxxwoauzytdsxzzyxwsgpxzyvvvusm90000000iqvwsnjrxytpttoiguwsrrsspomisxxvuvuortttpg10000swyxsjtyvruwuoanouyyyxwtntxyxxwwxtrwxxtk60000pvwsgfuyxvwyxwsd9twwuplswvocjvxvupnvyxtsvwvuuvsd5ryyvxwrksvtuvvwxxyxxwwxyyvl403fkljbbjwxxxpktsj28sxwuqi318mrrqppolmmg54iqutok9689adtvtttqttlb7txyxuqladmonnmlkkkic9amqssqlgb600etxxxxwwsouwwvvskjrsomf7lppmkhgcbsvuuvvrd3bdchtwxxxyyyyyxxxxyzzzyxxxyxyzyxyxxyyzxtnjf758a85cqwyxxvo62qssyzyyyyufdlrwzzzzzxpvyxyyywpb10006rvwwthstnhtwxyyvptwsrvxxxxtjmqqprqtvvvvtsvwr9rxyyvn0hkghmuxwse0bgecgtyyxuutoltxxvwuminrrpmrvyyvttvwvtvwxywrpvvptwwxwuqgnsuuttwxrjltxxujeuyyxtkdijhetwvwrbtxxvrouwuuwvnlqxzyxxuiorsspjtxxwqirwywwyvtqrwwtphvxtqklsuvxui4uxvsmluxvrstvxunlqtphtwtngqxxurlotvwwttvutpipptwwvp40006rvutuurontwvuuwxxuorqppsvvronoomhuwttuvvsuxxwrsxywxywskqwwtttssuvslquvvtuvwwtmrvvwxwtlf9202twvrmlltwtqquxzxrqwxtptvsoi6hoppqqtvvupksxyxsioomkfstqtrdtvstqh9bba5qwvuvvq00pwyxxxtklnppnruwxvqotvurotxzytlsxvmuxvvuo7jsuutstuqggjuyulkrwvn6drvvrksuwxslpxxn8dswwyvi67qxyxwsnhnrstqnotvvtoqrnfuyvn3qvywl4rxxs569guyvn5sxxvrhntvvtnuyvplrvvtqnnjbpvwurprvvuvsrwwtn8npvzxslntvtniovwuttqebsvuwwvvvvvvwvtuurb694000muxxwsktwwvprvvwwxxwwtdeuyyxxwvvvr6qtrrsssrttqntvuuvvuurihsvwxwwvvwwwwwwwxxxxyyxwxxwxxxxyyyzyyyyyvn2343000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000nstutokuvmpwyyyyvhrwtnxzzzzvj80007pwzxxwuxyxo4swyzzwqorpjhrvwwuk6898cntvtstuurtxyxxxthc37bhovxyyxuuwxwwzzzzxswxqsxxwvuqh0001ftzzufivzzxnhuzzzyulhijhwzzxl0nxzytmvxvvws20szzzxxuld00000txxs06swxxxxvsptwwriavyvqijotxyvh0uyywsmtyytuuvzxrgmuulqwvrntxwvtosxyyytuxwtmourvzzzys40000ntussrleguyyyxuoervwuonvxwwxvibkvxwxyxqqxzzyyywvwxywn5pvxzzzzzzvrvxupttstvvrotusvxuspig700pvwwqdfrsmtttyzyvtvwqnwyywrfhpsrttuwwsmjsxyywmcjmj9itxug4svtuslalmjenvxvtvs39owzyxyvjjpsroltwxywstvvvtswyxukotqlvxwwun8kruutsvxth9ltwvnervumb8rvvsnsvxxvqrxvgegswvvvs989uyyyxuhlqssqmmtvtpkmrpirvsj0bwzysaqxyvl43luxwo1juyxwqbtyyytswwvoguxxvpppk0rxxvniwzxwwwrluvrsqsxwuqlqstutplnonlgddkstsuvvvuvwwvuvvvvvr0363frxyywqpwzyvnswxxxxxxxxupwyxyyxxwsgovwxxyyxvsnpxzxwwxwvrlkswwwwwxyzzzzzzzzzzzzzzyrc752';
  const VOICE_LV = Array.from(VOICE, ch => parseInt(ch, 36) / 35);

  function voiceAt(t) {
    const f = t * 20;
    const i = Math.floor(f);
    if (i < 0 || i >= VOICE_LV.length) return 0;
    const a = VOICE_LV[i], b = VOICE_LV[i + 1] || 0;
    return a + (b - a) * (f - i);
  }

  const SINGING = [[12.7, 30.32], [30.5, 80.4], [87.2, 124.9]];
  const singing = (t) => SINGING.some(([a, b]) => t >= a && t <= b);

  function mouthFor(role, t) {
    if (role !== 'mio' || !singing(t)) return 0;
    return clamp((voiceAt(t) - 0.15) / 0.7, 0, 1);
  }

  const ENERGY = [[0, 0.3], [2.7, 0.55], [12.6, 0.6], [21.5, 0.7], [30.3, 1], [39.7, 0.85], [44, 0.7], [53, 0.8], [59.9, 1], [80.3, 0.6], [87.2, 0.45], [96, 0.6], [100.5, 0.8], [105, 1], [124.8, 0.85]];
  function energyAt(t) {
    let i = 0;
    while (i + 1 < ENERGY.length && ENERGY[i + 1][0] <= t) i++;
    const next = ENERGY[i + 1];
    if (!next) return ENERGY[i][1];
    return lerp(ENERGY[i][1], next[1], smooth(span(t, next[0] - 0.8, next[0])));
  }

  const CHARACTERS = {
    mio: { name: 'Мио Хонда' },
    crowd: { name: 'Зрители' }
  };

  const ARMS = {
    down: { a: [0.08, 0, 0.1, 0.12] },
    relax: { a: [0.2, 0.15, 0.22, 0.42] },
    low: { a: [0.32, 0.1, 0.62, 0.16] },
    lowOut: { a: [0.15, 0, 0.85, 0.08] },
    lowBack: { a: [-0.25, 0, 0.45, 0.1] },
    side: { a: [0.1, 0, 1.42, 0.03] },
    side2: { a: [0.35, 0, 1.15, 0.2] },
    spread: { a: [0.05, 0, 1.45, 0.06] },
    vUp: { a: [0.25, 0, 2.45, 0.08] },
    vUp2: { a: [0.35, 0, 2.3, 0.2] },
    up: { a: [2.95, 0.05, 0.12, 0.06] },
    pointUp: { a: [2.8, 0.2, 0.15, 0.15] },
    wave: { a: [2.55, 0.25, 0.45, 0.45], wig: [0, 0, 0.22, 0.28] },
    point: { a: [1.5, 0.18, 0.02, 0.05] },
    point2: { a: [1.42, 0.22, 0.05, 0.12] },
    pointDown: { a: [0.75, 0.3, 0.12, 0.05] },
    pointDown2: { a: [0.85, 0.36, 0.15, 0.1] },
    jazz: { a: [1.25, 0.95, 0, 1.55] },
    jazz2: { a: [1.35, 1.0, 0.05, 1.65] },
    bentUp: { a: [2.2, 0.7, 0.45, 1.25] },
    palms: { a: [0.75, 0.55, 0.55, 1.35] },
    swingIn: { a: [0.62, -0.45, 0.12, 1.35] },
    swingOut: { a: [0.42, 0.55, 0.35, 1.15] },
    swingFwd: { a: [0.45, 0.05, 0.12, 0.5] },
    swingBack: { a: [-0.32, 0, 0.12, 0.3] },
    fist: { a: [0.85, -0.3, 0.12, 2.1] },
    bye: { a: [1.15, 1.15, 0.2, 1.6], wig: [0, 0.18, 0, 0.22] },
    kissOut: { a: [1.35, -0.1, 0.45, 0.2] },
    up2: { a: [2.6, 0.1, 0.4, 0.5] },
    hip: { ik: [0.15, 0.03, 0.02] },
    cheek: { ik: [0.12, 0.52, 0.07] },
    cheekOpen: { ik: [0.13, 0.55, 0.11] },
    chin: { ik: [0.055, 0.43, 0.13] },
    chest: { ik: [0.02, 0.27, 0.16] },
    chestR: { ik: [-0.02, 0.29, 0.14] },
    chestLow: { ik: [0.02, 0.18, 0.15] },
    heart: { ik: [0.035, 0.31, 0.17] },
    mouth: { ik: [-0.005, 0.5, 0.15] },
    salute: { ik: [0.07, 0.66, 0.12] },
    ear: { ik: [0.125, 0.6, 0.02] },
    eye: { ik: [0.045, 0.6, 0.15] },
    head: { ik: [0.08, 0.74, 0.02] },
    head2: { ik: [0.17, 0.7, 0.04] },
    circle: { ik: [0.05, 0.82, 0.08] },
    fingers: { ik: [0.2, 0.6, 0.06] },
    faceWave: { ik: [0.2, 0.55, 0.12], wig: [0, 0.16, 0.1, 0.2] },
    faceWave2: { ik: [0.17, 0.48, 0.15], wig: [0, 0.16, 0.1, 0.2] },
    clapL: { abs: [0.17, 0.32, 0.17] },
    clapR: { abs: [0.11, 0.32, 0.19] }
  };

  const LEG_L = {
    stand: { hipL: [0.03, 0, 0.05], knL: [0.05, 0, 0], hipR: [0.03, 0, 0.05], knR: [0.05, 0, 0] },
    rest: { hipL: [0.16, 0.12, -0.02], knL: [0.34, 0, 0], hipR: [0.02, 0, 0.07], knR: [0.02, 0, 0] },
    apart: { hipL: [0.02, 0, 0.17], knL: [0.04, 0, 0], hipR: [0.02, 0, 0.17], knR: [0.04, 0, 0] },
    dip: { hipL: [0.3, 0, 0.1], knL: [0.55, 0, 0], hipR: [0.3, 0, 0.1], knR: [0.55, 0, 0] },
    knee: { hipL: [1.15, 0, 0.1], knL: [1.5, 0, 0], hipR: [0.05, 0, 0.05], knR: [0.08, 0, 0] },
    tap: { hipL: [0.1, 0, 0.3], knL: [0.14, 0, 0], hipR: [0.06, 0, 0.0], knR: [0.14, 0, 0] },
    walk: { hipL: [0.32, 0, 0.04], knL: [0.12, 0, 0], hipR: [-0.2, 0, 0.04], knR: [0.32, 0, 0] }
  };

  const LEGS = {};
  Object.keys(LEG_L).forEach(k => {
    const v = LEG_L[k];
    LEGS[k + 'L'] = v;
    LEGS[k + 'R'] = { hipL: v.hipR, knL: v.knR, hipR: v.hipL, knR: v.knL };
  });
  LEGS.stand = LEG_L.stand;
  LEGS.apart = LEG_L.apart;
  LEGS.dip = LEG_L.dip;

  const MOVES = {
    idle: { len: 4, still: true, keys: [[0, { L: 'down', R: 'down', legs: 'stand' }]] },
    point: { len: 2, keys: [[0, { L: 'hip', R: 'point', legs: 'restL', lean: 0.05, tilt: 0.08 }], [1, { L: 'hip', R: 'point2', legs: 'restL', lean: 0.07, tilt: 0.04 }]] },
    wave1: { len: 2, keys: [[0, { L: 'hip', R: 'wave', legs: 'restL', roll: -0.05, tilt: 0.1 }], [1, { L: 'hip', R: 'wave', legs: 'restL', roll: -0.03, tilt: 0.05 }]] },
    openLow: { len: 4, keys: [[0, { L: 'low', R: 'low', legs: 'restL', roll: 0.05, tilt: 0.12, eyes: 'happy' }], [2, { L: 'low', R: 'low', legs: 'restR', roll: -0.05, tilt: -0.12, eyes: 'happy' }]] },
    sway: { len: 4, keys: [[0, { L: 'side2', R: 'low', legs: 'restR', roll: -0.08, dx: 0.06, tilt: -0.14 }], [2, { L: 'low', R: 'side2', legs: 'restL', roll: 0.08, dx: -0.06, tilt: 0.14 }]] },
    steps: { len: 2, keys: [[0, { L: 'swingIn', R: 'swingOut', legs: 'tapL', dx: -0.08, roll: 0.05, tilt: 0.06 }], [1, { L: 'swingOut', R: 'swingIn', legs: 'tapR', dx: 0.08, roll: -0.05, tilt: -0.06 }]] },
    bounce: { len: 2, keys: [[0, { L: 'relax', R: 'relax', legs: 'restL', tilt: 0.05 }], [1, { L: 'relax', R: 'relax', legs: 'restR', tilt: -0.05 }]] },
    chin: { len: 2, keys: [[0, { L: 'chin', R: 'chin', legs: 'stand', nod: 0.08, tilt: 0.1 }], [1, { L: 'chin', R: 'chin', legs: 'dip', nod: 0.05, tilt: -0.1 }]] },
    cheeks: { len: 2, keys: [[0, { L: 'cheek', R: 'cheek', legs: 'restL', tilt: 0.1 }], [1, { L: 'cheek', R: 'cheek', legs: 'restR', tilt: -0.1 }]] },
    cheeksOpen: { len: 2, keys: [[0, { L: 'cheekOpen', R: 'cheekOpen', legs: 'restL', tilt: 0.12 }], [1, { L: 'cheekOpen', R: 'cheekOpen', legs: 'restR', tilt: -0.06 }]] },
    fingers: { len: 2, keys: [[0, { L: 'fingers', R: 'fingers', legs: 'restL', tilt: 0.16, roll: 0.04 }], [1, { L: 'fingers', R: 'fingers', legs: 'restR', tilt: -0.16, roll: -0.04, eyes: 'wink' }]] },
    clapSide: { len: 1, keys: [[0, { L: 'clapL', R: 'clapR', legs: 'restR', twist: 0.25, roll: 0.06, eyes: 'happy', mood: 'beam' }]] },
    jazz: { len: 2, keys: [[0, { L: 'jazz', R: 'jazz', legs: 'restL', tilt: 0.1 }], [1, { L: 'jazz2', R: 'jazz2', legs: 'restR', tilt: -0.1 }]] },
    spread: { len: 4, keys: [[0, { L: 'spread', R: 'spread', legs: 'apart', lean: -0.06, nod: -0.12, eyes: 'happy' }], [2, { L: 'spread', R: 'spread', legs: 'apart', lean: -0.04, nod: -0.08, eyes: 'happy' }]] },
    hipPoint: { len: 4, keys: [[0, { L: 'hip', R: 'pointDown', legs: 'restL', roll: 0.06, twist: -0.12 }], [2, { L: 'hip', R: 'pointDown2', legs: 'restL', roll: 0.03, twist: -0.06 }]] },
    waveFace: { len: 2, keys: [[0, { L: 'faceWave', R: 'faceWave2', legs: 'restL', tilt: 0.1 }], [1, { L: 'faceWave2', R: 'faceWave', legs: 'restR', tilt: -0.1 }]] },
    waveBoth: { len: 2, keys: [[0, { L: 'faceWave', R: 'faceWave', legs: 'restL', tilt: 0.08, eyes: 'happy' }], [1, { L: 'faceWave', R: 'faceWave', legs: 'restR', tilt: -0.08, eyes: 'happy' }]] },
    chest: { len: 4, keys: [[0, { L: 'chest', R: 'chest', legs: 'restL', tilt: 0.12, eyes: 'happy', mood: 'beam' }]] },
    clasp: { len: 4, keys: [[0, { L: 'chest', R: 'chest', legs: 'restL', tilt: 0.1, nod: 0.05, eyes: 'happy' }], [2, { L: 'chest', R: 'chest', legs: 'restR', tilt: -0.1, nod: 0.05, eyes: 'happy' }]] },
    giggle: { len: 4, keys: [[0, { L: 'chestLow', R: 'mouth', legs: 'restR', lean: 0.1, tilt: 0.15, eyes: 'happy', mood: 'smile' }]] },
    walk: { len: 1, walk: true, keys: [[0, { L: 'swingBack', R: 'swingFwd', legs: 'walkL' }], [0.5, { L: 'swingFwd', R: 'swingBack', legs: 'walkR' }]] },
    walkHead: { len: 1, walk: true, keys: [[0, { L: 'head', R: 'head', legs: 'walkL', tilt: 0.08, eyes: 'happy' }], [0.5, { L: 'head', R: 'head', legs: 'walkR', tilt: -0.08, eyes: 'happy' }]] },
    pointUp: { len: 2, keys: [[0, { L: 'hip', R: 'pointUp', legs: 'restL', roll: 0.05, nod: -0.1 }], [1, { L: 'hip', R: 'pointUp', legs: 'restL', roll: 0.02, nod: -0.06 }]] },
    binoculars: { len: 4, keys: [[0, { L: 'eye', R: 'eye', legs: 'restL', lean: 0.12, nod: 0.05 }]] },
    vUp: { len: 2, keys: [[0, { L: 'vUp', R: 'vUp', legs: 'apart', lean: -0.05, nod: -0.1, eyes: 'happy' }], [1, { L: 'vUp2', R: 'vUp2', legs: 'apart', lean: -0.04, eyes: 'happy' }]] },
    megaphone: { len: 4, keys: [[0, { L: 'hip', R: 'mouth', legs: 'restL', nod: -0.06 }]] },
    kneeUp: { len: 2, keys: [[0, { L: 'swingOut', R: 'up2', legs: 'kneeL' }], [1, { L: 'low', R: 'low', legs: 'stand' }]] },
    chestHand: { len: 4, keys: [[0, { L: 'lowOut', R: 'chestR', legs: 'restR', nod: -0.08, eyes: 'happy' }]] },
    lookUp: { len: 4, keys: [[0, { L: 'lowBack', R: 'lowBack', legs: 'stand', nod: -0.35, lean: -0.08, eyes: 'happy' }]] },
    pointSide: { len: 4, keys: [[0, { L: 'hip', R: 'side', legs: 'restL', turn: -0.35, roll: 0.04 }]] },
    tiltWink: { len: 4, keys: [[0, { L: 'low', R: 'jazz', legs: 'restR', tilt: -0.22, eyes: 'wink' }]] },
    headHands: { len: 2, keys: [[0, { L: 'head', R: 'head', legs: 'restL', tilt: 0.1, eyes: 'happy' }], [1, { L: 'head', R: 'head', legs: 'restR', tilt: -0.1, eyes: 'happy' }]] },
    hips: { len: 4, keys: [[0, { L: 'hip', R: 'hip', legs: 'apart' }]] },
    eyeCover: { len: 4, keys: [[0, { L: 'hip', R: 'eye', legs: 'restL', tilt: -0.1, eyes: 'winkR' }]] },
    fists: { len: 2, keys: [[0, { L: 'fist', R: 'fist', legs: 'restL', eyes: 'happy' }], [1, { L: 'fist', R: 'fist', legs: 'restR', eyes: 'happy' }]] },
    up1: { len: 2, keys: [[0, { L: 'hip', R: 'up', legs: 'restL' }]] },
    heart: { len: 4, keys: [[0, { L: 'heart', R: 'heart', legs: 'restL', tilt: 0.12, eyes: 'happy' }], [2, { L: 'heart', R: 'heart', legs: 'restR', tilt: -0.06, eyes: 'happy' }]] },
    tPose: { len: 4, still: true, keys: [[0, { L: 'spread', R: 'spread', legs: 'apart', nod: -0.04 }]] },
    earHand: { len: 4, keys: [[0, { L: 'hip', R: 'ear', legs: 'restL', tilt: 0.15, eyes: 'happy' }]] },
    salute: { len: 4, keys: [[0, { L: 'hip', R: 'salute', legs: 'restL', tilt: -0.08, eyes: 'wink' }]] },
    palms: { len: 2, keys: [[0, { L: 'palms', R: 'palms', legs: 'restL', tilt: 0.1 }], [1, { L: 'palms', R: 'palms', legs: 'restR', tilt: -0.06 }]] },
    circleUp: { len: 4, keys: [[0, { L: 'circle', R: 'circle', legs: 'stand', nod: -0.1, eyes: 'happy' }]] },
    pointBoth: { len: 2, keys: [[0, { L: 'point', R: 'point', legs: 'apart', lean: 0.06 }], [1, { L: 'point2', R: 'point2', legs: 'apart', lean: 0.04 }]] },
    kiss: { len: 2, keys: [[0, { L: 'hip', R: 'mouth', legs: 'restL', mood: 'kiss', eyes: 'happy' }], [1, { L: 'hip', R: 'kissOut', legs: 'restL', eyes: 'wink' }]] },
    banzai: { len: 2, keys: [[0, { L: 'bentUp', R: 'bentUp', legs: 'apart', eyes: 'happy', mood: 'beam' }]] },
    bye: { len: 2, keys: [[0, { L: 'bye', R: 'bye', legs: 'restL', tilt: 0.08, eyes: 'wink', mood: 'grin' }], [1, { L: 'bye', R: 'bye', legs: 'restR', tilt: 0.04, eyes: 'wink', mood: 'grin' }]] }
  };

  const CHOREO = [
    [0, 'idle'], [3.5, 'point'], [4.3, 'wave1'], [5.4, 'openLow'], [6.5, 'headHands'], [7.2, 'openLow'], [8.6, 'sway'], [10.1, 'steps'],
    [12.4, 'chin'], [13.4, 'cheeks'], [14.3, 'fingers'], [16.3, 'clapSide'], [16.85, 'steps'], [19.25, 'chin'], [19.9, 'jazz'], [20.6, 'openLow'],
    [20.9, 'spread'], [21.5, 'hipPoint'], [23.4, 'waveFace'], [25.0, 'giggle'], [25.7, 'walk'], [27.6, 'pointUp'],
    [28.25, 'wave1'], [29.0, 'binoculars'], [29.6, 'vUp'], [30.0, 'steps'], [30.35, 'megaphone'], [31.05, 'chest'], [31.4, 'kneeUp'],
    [32.45, 'jazz'], [33.5, 'cheeksOpen'], [34.0, 'spread'], [34.75, 'chestHand'], [35.5, 'spread'], [36.7, 'lookUp'], [37.3, 'spread'], [38.4, 'vUp'],
    [39.6, 'chin'], [40.3, 'fingers'], [41.8, 'steps'], [44.0, 'wave1'], [44.9, 'pointUp'], [45.3, 'steps'], [46.15, 'waveBoth'], [48.0, 'openLow'],
    [48.25, 'pointSide'], [49.2, 'chest'], [49.7, 'spread'], [50.3, 'wave1'], [50.8, 'cheeks'], [51.05, 'clasp'], [52.1, 'jazz'], [52.7, 'tiltWink'],
    [53.0, 'walk'], [54.2, 'walkHead'], [54.85, 'walk'], [55.3, 'pointSide'], [56.3, 'wave1'], [58.2, 'steps'], [59.95, 'hips'], [61.0, 'bounce'],
    [62.1, 'eyeCover'], [62.6, 'pointUp'], [63.0, 'wave1'], [63.3, 'megaphone'], [64.35, 'waveBoth'], [66.4, 'spread'], [67.2, 'fists'], [67.6, 'wave1'],
    [68.25, 'up1'], [68.8, 'clasp'], [69.9, 'heart'], [70.2, 'jazz'], [70.7, 'wave1'], [70.95, 'steps'], [73.4, 'hipPoint'], [74.6, 'pointUp'],
    [77.0, 'steps'], [82.3, 'openLow'], [83.45, 'walk'], [86.9, 'tPose'], [88.9, 'pointSide'], [90.4, 'pointUp'], [91.1, 'earHand'], [91.5, 'pointUp'],
    [93.6, 'salute'], [95.35, 'bounce'], [96.1, 'clasp'], [97.3, 'palms'], [98.1, 'jazz'], [98.9, 'fists'], [99.3, 'sway'], [100.5, 'vUp'],
    [102.6, 'circleUp'], [105.0, 'steps'], [107.7, 'wave1'], [109.2, 'sway'], [111.75, 'pointBoth'], [112.8, 'vUp'], [113.6, 'kiss'], [114.1, 'heart'],
    [115.0, 'cheeks'], [115.7, 'jazz'], [116.25, 'steps'], [118.75, 'hips'], [119.2, 'point'], [119.6, 'wave1'], [120.8, 'steps'], [124.5, 'vUp'],
    [125.0, 'banzai'], [125.45, 'bye']
  ];

  const PATH = [
    [0, 0, 0.3, 0], [25.698, 0, 0.3, 0], [25.699, 1.1, -0.9, -0.6], [26.0, 1.1, -0.9, -0.6], [28.0, -0.2, 0.9, -0.6], [29.2, -0.2, 0.9, 0],
    [30.365, -0.2, 0.9, 0], [30.366, 0, 0.3, 0], [37.35, 0, 0.3, 0], [38.45, 0, 0.3, PI * 2], [39.665, 0, 0.3, PI * 2], [39.666, 0, 0.3, 0],
    [53.015, 0, 0.3, 0], [53.016, 0, -1.1, 0], [53.2, 0, -1.1, 0], [55.25, 0, 0.6, 0], [83.465, 0, 0.6, 0], [83.466, -0.5, 1.0, 2.5],
    [83.75, -0.5, 1.0, 2.5], [86.4, 0.85, -0.9, 2.5], [86.948, 0.85, -0.9, 2.5], [86.949, 0, 0.3, 0]
  ];

  function glideEase(u) {
    const a = 0.2;
    if (u <= a) return (u * u) / (2 * a * (1 - a));
    if (u >= 1 - a) return 1 - ((1 - u) * (1 - u)) / (2 * a * (1 - a));
    return (u - a / 2) / (1 - a);
  }

  function rootAt(t) {
    let i = 0;
    while (i + 1 < PATH.length && PATH[i + 1][0] <= t) i++;
    const a = PATH[i], b = PATH[i + 1];
    if (!b) return { x: a[1], z: a[2], ry: a[3] };
    const k = b[0] - a[0] < 0.05 ? (t >= b[0] ? 1 : 0) : glideEase(span(t, a[0], b[0]));
    return { x: lerp(a[1], b[1], k), z: lerp(a[2], b[2], k), ry: lerp(a[3], b[3], k) };
  }

  const armCache = {};
  function armOf(name, side, b) {
    const A = ARMS[name];
    let base;
    if (A.a) base = A.a;
    else {
      const key = name + side;
      if (!armCache[key]) {
        const target = A.abs ? A.abs : side === 'L' ? A.ik : [-A.ik[0], A.ik[1], A.ik[2]];
        armCache[key] = GK.ik('mioStep', side, target, A.hint);
      }
      base = armCache[key];
    }
    if (!A.wig) return base;
    const w = S(2 * PI * 2 * b + (side === 'L' ? 0 : 1.3));
    return base.map((v, i) => v + A.wig[i] * w);
  }

  function keyPose(k, b) {
    const L = armOf(k.L || 'down', 'L', b), R2 = armOf(k.R || 'down', 'R', b);
    const lg = LEGS[k.legs || 'stand'];
    return {
      shL: [L[0], L[1], L[2]], elL: [L[3], 0, 0], shR: [R2[0], R2[1], R2[2]], elR: [R2[3], 0, 0],
      hipL: lg.hipL, knL: lg.knL, hipR: lg.hipR, knR: lg.knR,
      spine: [k.lean || 0, k.twist || 0, k.roll || 0], neck: [k.nod || 0, k.turn || 0, k.tilt || 0],
      dx: k.dx || 0, eyes: k.eyes || 'open', mood: k.mood || 'smile'
    };
  }

  const FIELDS = ['shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR', 'spine', 'neck'];

  function mixPose(a, b, w) {
    const o = {};
    FIELDS.forEach(f => { o[f] = mixV(a[f], b[f], w); });
    o.dx = lerp(a.dx, b.dx, w);
    o.eyes = w < 0.5 ? a.eyes : b.eyes;
    o.mood = w < 0.5 ? a.mood : b.mood;
    return o;
  }

  function moveAt(name, t0, t) {
    const M = MOVES[name];
    const b = beatAt(t);
    const b0 = Math.round(beatAt(t0));
    const ph = ((b - b0) % M.len + M.len) % M.len;
    const keys = M.keys;
    if (keys.length === 1) return keyPose(keys[0][1], b);
    let i = 0;
    while (i + 1 < keys.length && keys[i + 1][0] <= ph) i++;
    const ka = keys[i], kb = keys[(i + 1) % keys.length];
    const end = i + 1 < keys.length ? kb[0] : M.len + keys[0][0];
    const w = 0.5 - 0.5 * C(PI * clamp((ph - ka[0]) / (end - ka[0]), 0, 1));
    return mixPose(keyPose(ka[1], b), keyPose(kb[1], b), w);
  }

  const XF = 0.4;
  function choreoIndex(t) {
    let i = 0;
    while (i + 1 < CHOREO.length && CHOREO[i + 1][0] <= t) i++;
    return i;
  }

  function poseAt(i, t) {
    const [t0, name] = CHOREO[i];
    const cur = moveAt(name, t0, t);
    if (i > 0 && t - t0 < XF) return mixPose(poseAt(i - 1, t), cur, smooth((t - t0) / XF));
    return cur;
  }

  function danceAt(t) {
    const i = choreoIndex(t);
    return { pose: poseAt(i, t), move: CHOREO[i][1] };
  }

  const blinkAt = (t) => frac(t / 3.1 + 0.37) < 0.035;

  function faceAt(t, d) {
    const tt = Math.floor(t * 12) / 12;
    let eyes = d.eyes;
    if (eyes === 'open' && blinkAt(tt)) eyes = 'shut';
    let mouth = d.mood === 'kiss' ? 'oh' : d.mood;
    if (singing(tt)) {
      const v = voiceAt(tt);
      if (v > 0.82) mouth = eyes === 'happy' ? 'belt' : 'beam';
      else if (v > 0.5) mouth = 'sing';
      else if (v > 0.2) mouth = 'say';
    }
    return eyes + '|' + mouth;
  }

  function mioAt(t) {
    const root = rootAt(t);
    const d = danceAt(t);
    const p = restPose();
    const P = d.pose;
    const still = MOVES[d.move].still;
    const e = still ? 0.15 : energyAt(t);
    const walking = MOVES[d.move].walk;
    const bo = bob(t);
    FIELDS.forEach(f => { p[f] = P[f].slice(); });
    if (!walking) {
      p.knL[0] += 0.12 * e * bo;
      p.knR[0] += 0.12 * e * bo;
      p.hipL[0] += 0.06 * e * bo;
      p.hipR[0] += 0.06 * e * bo;
    }
    const sw = S(PI * beatAt(t));
    p.spine[2] += 0.03 * e * sw;
    p.neck[2] += 0.05 * e * S(PI * beatAt(t) + 0.6);
    p.spine[0] += 0.03 * e * bo;
    p.x = root.x + P.dx * C(root.ry);
    p.z = root.z - P.dx * S(root.ry);
    p.ry = root.ry;
    p.skirtSwing = 0.05 * e * sw;
    p.hair = 0.04 * e * sw;
    p.face = faceAt(t, P);
    return { id: 'mio', form: 'mioStep', look: 'mioStep', pose: p, hidden: false, props: [], move: d.move };
  }

  function solveActor(a) {
    const m = Cast.solve(a.form, a.pose);
    a.m = m;
    a.head = M4.point(m.head, [0, 0, 0]);
    a.hips = M4.point(m.hips, [0, 0, 0]);
    a.root = [a.pose.x, 0, a.pose.z];
    return a;
  }

  const view = (eye, at, fov, extra) => Object.assign({ eye, at, fov: fov || 40 }, extra || {});
  const drift = (a, b, u) => mixV(a, b, smooth(u));
  const rel = (m, o) => [m.root[0] + o[0], o[1], m.root[2] + o[2]];
  const near = (m, o) => addV(m.head, o);
  const path3 = (pts, u) => {
    const n = pts.length - 1;
    const f = clamp(u, 0, 1) * n;
    const i = Math.min(n - 1, Math.floor(f));
    return mixV(pts[i], pts[i + 1], smooth(f - i));
  };

  const day = (screen, extra) => Object.assign({ light: 'day', screen: screen || 'yellow' }, extra || {});
  const night = (screen, extra) => Object.assign({ light: 'night', screen: screen || 'orange', disco: true }, extra || {});
  const arena = (extra) => Object.assign({ light: 'arena', screen: 'yellow' }, extra || {});

  const WORLDS = {
    open(t, u, m) {
      return view([0, 1.7, 15], [0, 2.3, -3], 46, day('yellow', { up: smooth(span(t, 2.55, 2.9)), crowd: true }));
    },
    point(t, u, m) {
      const k = span(t, 4.6, 7.6);
      return view(path3([near(m, [0.06, -0.06, 1.0]), rel(m, [0, 1.3, 1.9]), rel(m, [0, 1.55, 4.6]), rel(m, [0, 1.8, 8.2])], k), path3([near(m, [0, -0.08, 0]), rel(m, [0, 1.2, 0]), rel(m, [0, 1.35, 0]), rel(m, [0, 2.3, -3])], k), lerp(38, 44, smooth(k)), day('yellow'));
    },
    openArms(t, u, m) {
      return view(rel(m, [-1.3, 1.25, 2.8]), rel(m, [0, 1.0, 0]), 42, day('yellow'));
    },
    lowLeft(t, u, m) {
      return view(drift(near(m, [0.5, -0.32, 1.0]), near(m, [0.42, -0.3, 1.02]), u), near(m, [0, -0.14, 0]), 42, day('yellow'));
    },
    crowd1(t, u, m) {
      return view(drift([0.6, 2.3, 14.2], [0.4, 2.3, 13.9], u), [0, 1.9, -3], 40, day('yellow', { crowd: true }));
    },
    cheeks(t, u, m) {
      return view(near(m, [0.02, -0.03, 0.95]), near(m, [0, -0.05, 0]), 38, day('yellow'));
    },
    fingers(t, u, m) {
      return view(drift(near(m, [-0.3, -0.16, 0.98]), near(m, [-0.24, -0.14, 0.95]), u), near(m, [0, -0.08, 0]), 36, day('yellow'));
    },
    crowd2(t, u, m) {
      return view(drift([-0.6, 1.7, 11.6], [-0.5, 1.7, 11.3], u), [0, 1.2, -2], 36, day('yellow', { crowd: true }));
    },
    chin(t, u, m) {
      return view(near(m, [0.05, -0.04, 0.88]), near(m, [0, -0.1, 0]), 38, day('yellow'));
    },
    spread(t, u, m) {
      return view(rel(m, [0.3, 1.2, 4.2]), rel(m, [0, 1.15, 0]), 40, day('yellow'));
    },
    hipPoint(t, u, m) {
      return view(drift(rel(m, [-1.4, 0.45, 2.6]), rel(m, [-1.3, 0.45, 2.5]), u), rel(m, [0, 1.0, 0]), 44, day('yellow'));
    },
    giggle(t, u, m) {
      return view(near(m, [0.36, -0.12, 1.05]), near(m, [0, -0.12, 0]), 38, day('yellow'));
    },
    walk1(t, u, m) {
      return view([-2.4, 2.6, 4.4], addV(m.hips, [0, 0.1, 0]), 44, day('pink'));
    },
    binoculars(t, u, m) {
      return view(near(m, [0.28, -0.32, 0.95]), near(m, [0, -0.02, 0]), 40, day('pink'));
    },
    title(t, u, m) {
      return view(rel(m, [0, 0.75, 2.1]), rel(m, [0, 2.0, -1.2]), 46, day('sky', { title: smooth(span(t, 30.45, 31.0)) }));
    },
    laugh(t, u, m) {
      return view(near(m, [0.32, -0.05, 0.8]), near(m, [0, -0.08, 0]), 38, day('sky', { title: 1 }));
    },
    skyWide(t, u, m) {
      return view(drift([-3.6, 2.4, 9.6], [-3.3, 2.4, 9.3], u), [0.5, 2.2, -3], 44, day('sky', { title: 1, crowd: true }));
    },
    skyPush(t, u, m) {
      return view(drift(rel(m, [0.2, 0.8, 2.6]), near(m, [0.05, -0.06, 0.9]), u), drift(rel(m, [0, 1.45, 0]), near(m, [0, -0.04, 0]), u), lerp(40, 36, u), day('sky', { title: 1 }));
    },
    skyArms(t, u, m) {
      return view(path3([rel(m, [-1.4, 1.2, 1.6]), rel(m, [-1.1, 0.9, 1.5]), rel(m, [-0.7, 0.55, 1.05])], u), drift(rel(m, [0, 1.3, 0]), near(m, [0, -0.05, 0]), u), 42, day('sky', { title: 1 }));
    },
    skyCrane(t, u, m) {
      return view(path3([rel(m, [0.9, 0.7, -1.3]), rel(m, [1.8, 2.2, 1.6]), rel(m, [2.4, 4.6, 4.6])], u), drift(rel(m, [0, 1.6, 1.0]), rel(m, [0, 0.5, -0.6]), u), 44, day('sky', { title: 1 }));
    },
    fingers2(t, u, m) {
      return view(near(m, [0, -0.06, 0.9]), near(m, [0, -0.08, 0]), 38, day('yellow'));
    },
    flashWide(t, u, m) {
      return view(drift([0, 2.6, 15.5], [0, 2.6, 14.9], u), [0, 2.1, -3], 44, day('pink', { crowd: true }));
    },
    winkPoint(t, u, m) {
      return view(near(m, [0.34, -0.08, 0.92]), near(m, [0, -0.05, 0]), 36, day('yellow'));
    },
    step(t, u, m) {
      return view(rel(m, [1.8, 0.9, 3.2]), rel(m, [0, 0.9, 0]), 40, day('yellow'));
    },
    screen1(t, u, m) {
      return view(rel(m, [0.6, 1.0, 3.0]), rel(m, [0, 1.75, -1]), 46, day('live'));
    },
    waveLow(t, u, m) {
      return view(near(m, [-0.5, -0.5, 0.9]), near(m, [0, -0.15, 0]), 40, day('live'));
    },
    screen2(t, u, m) {
      return view(drift(rel(m, [0.2, 0.9, 3.6]), rel(m, [0.1, 0.9, 3.3]), u), rel(m, [0, 1.75, -1.5]), 44, day('live'));
    },
    clasp(t, u, m) {
      return view(near(m, [0.08, -0.2, 1.2]), near(m, [0, -0.2, 0]), 38, day('yellow'));
    },
    walk2(t, u, m) {
      return view([0, 2.4, 6], addV(m.hips, [0, 0.2, 0]), 40, day('pink'));
    },
    craneOut1(t, u, m) {
      const k = span(t, 55.35, 59.98);
      return view(path3([rel(m, [1.1, 0.8, 0.9]), rel(m, [0.25, 1.25, 1.3]), rel(m, [0.1, 1.3, 1.5]), rel(m, [0, 1.8, 6]), [0, 2.3, 11]], k), path3([rel(m, [0, 1.3, 0]), near(m, [0, -0.1, 0]), near(m, [0, -0.12, 0]), rel(m, [0, 1.8, -2]), [0, 2.2, -3]], k), 42, day('pink'));
    },
    arena1(t, u, m) {
      return view(drift(rel(m, [0.3, 1.4, -2.6]), rel(m, [0.25, 1.45, -2.4]), u), rel(m, [0, 1.6, 6]), 46, arena());
    },
    pinkStars(t, u, m) {
      return view(rel(m, [0, 1.0, 4.5]), rel(m, [0, 1.6, 0]), 42, day('pink'));
    },
    eyeCover(t, u, m) {
      return view(near(m, [0.38, -0.06, 0.85]), near(m, [0, -0.03, 0]), 36, day('yellow'));
    },
    beams1(t, u, m) {
      return view(rel(m, [2.2, 1.0, 2.6]), rel(m, [0, 1.0, 0]), 42, night('orange', { disco: false }));
    },
    byeClose(t, u, m) {
      return view(near(m, [0.1, -0.06, 0.9]), near(m, [0, -0.04, 0]), 36, day('yellow'));
    },
    beams2(t, u, m) {
      return view(rel(m, [-1.4, 0.9, 2.2]), rel(m, [0, 1.2, 0]), 40, night('orange', { disco: false }));
    },
    arc(t, u, m) {
      return view(path3([rel(m, [-1.8, 1.2, 0.6]), rel(m, [-1.0, 1.25, 1.3]), rel(m, [-0.2, 1.3, 1.4])], u), rel(m, [0, 1.25, 0]), lerp(42, 38, u), day('live'));
    },
    screen3(t, u, m) {
      return view(rel(m, [0.4, 0.5, 3.2]), rel(m, [0, 1.9, -1]), 46, day('live'));
    },
    heart(t, u, m) {
      return view(drift(rel(m, [-0.3, 1.25, 1.9]), rel(m, [-0.2, 1.25, 1.75]), u), rel(m, [0, 1.15, 0]), 38, day('pink'));
    },
    crowd3(t, u, m) {
      return view(drift([0.8, 2.6, 16], [0.6, 2.6, 15.5], u), [0, 2.3, -3], 42, day('pink', { crowd: true }));
    },
    arena2(t, u, m) {
      return view(drift(rel(m, [0.6, 1.5, -3.2]), rel(m, [0.35, 1.6, -1.4]), u), rel(m, [0, 1.7, 4]), 46, arena({ dark: true }));
    },
    craneOut2(t, u, m) {
      return view(path3([near(m, [0.45, -0.4, 0.65]), rel(m, [0.3, 1.5, 2.5]), rel(m, [0, 2.0, 7]), [-2, 3.0, 15.5]], u), path3([near(m, [0, 0.02, 0]), rel(m, [0, 1.5, 0]), rel(m, [0, 1.6, -2]), [0, 2.4, -3]], u), 42, day('pink', { crowd: true }));
    },
    stars(t, u, m) {
      return view(rel(m, [0.3, 1.0, 3.6]), rel(m, [0, 1.45, -0.5]), 42, day('pink'));
    },
    topDown(t, u, m) {
      const dark = smooth(span(t, 86.3, 86.75));
      return view(path3([rel(m, [-2.0, 1.8, 3.0]), rel(m, [-1.4, 4.5, 2.4]), rel(m, [-0.5, 7.6, 1.3])], u), drift(rel(m, [0, 0.8, 0]), rel(m, [0, 0, 0]), u), 44, day('yellow', { upv: mixV([0, 1, 0], [0, 0.25, -1], smooth(u)), dark }));
    },
    tPose(t, u, m) {
      return view(drift(rel(m, [0, 1.0, 3.8]), rel(m, [0, 1.0, 3.6]), u), rel(m, [0, 1.1, 0]), 40, night('white', { disco: false }));
    },
    tiltUp(t, u, m) {
      return view(drift(rel(m, [-0.9, 0.55, 1.2]), rel(m, [-0.9, 1.15, 1.25]), u), drift(rel(m, [0, 0.75, 0]), near(m, [0, -0.06, 0]), u), 40, night('orange'));
    },
    sunset(t, u, m) {
      return view(drift([-4.0, 1.6, 4.8], [-3.8, 1.6, 4.6], u), [1.0, 1.8, -1], 42, night('sunset'));
    },
    salute(t, u, m) {
      return view(near(m, [0.3, -0.3, 0.85]), near(m, [0, 0.03, 0]), 38, night('sunset'));
    },
    beamsWide(t, u, m) {
      return view([0, 2.5, 14], [0, 2.6, -3], 44, night('orange', { crowd: true }));
    },
    orangeArc(t, u, m) {
      return view(path3([rel(m, [-1.3, 1.15, 1.1]), rel(m, [-0.7, 1.1, 1.5]), rel(m, [0.1, 1.1, 1.75])], u), rel(m, [0, 1.5, -1]), 40, night('orange'));
    },
    orangeWide(t, u, m) {
      return view(rel(m, [0, 1.1, 5]), rel(m, [0, 2.4, -2]), 44, night('orange'));
    },
    pushScreen(t, u, m) {
      return view(path3([[0, 2.4, 14.5], [0, 2.2, 8], [0, 2.6, 2]], span(t, 100.55, 104.6)), path3([[0, 2.5, -3], [0, 3.2, -5], [0, 4.0, -6]], span(t, 100.55, 104.6)), 44, night(t < 102.8 ? 'orange' : 'live', { crowd: true }));
    },
    lightsBack(t, u, m) {
      return view(drift([-6, 2.6, 14], [-5.6, 2.6, 13.6], u), [0.5, 1.6, -2], 44, day('pink', { crowd: true }));
    },
    screen4(t, u, m) {
      return view(near(m, [-0.42, -0.3, 0.95]), near(m, [0.08, 0.08, 0]), 40, day('live'));
    },
    arena3(t, u, m) {
      return view(drift(rel(m, [-0.4, 1.3, -2.8]), rel(m, [-0.3, 1.35, -2.6]), u), rel(m, [0, 1.7, 5]), 46, arena({ pink: true }));
    },
    screen5(t, u, m) {
      return view(drift(rel(m, [0.2, 0.9, 3.4]), rel(m, [0.15, 0.9, 3.2]), u), rel(m, [0, 1.75, -1.5]), 44, day('live'));
    },
    kiss(t, u, m) {
      return view(near(m, [0, -0.1, 0.9]), near(m, [0, -0.06, 0]), 38, day('pink'));
    },
    crowd4(t, u, m) {
      return view(drift([-8, 3.4, 14], [-3, 3.0, 15.5], u), [0, 1.5, -2], 46, day('pink', { crowd: true }));
    },
    craneOut3(t, u, m) {
      return view(path3([near(m, [0.05, -0.05, 0.85]), rel(m, [0, 1.6, 3]), rel(m, [0, 1.8, 6]), [0, 2.8, 15.5]], u), path3([near(m, [0, -0.04, 0]), rel(m, [0, 1.5, 0]), rel(m, [0, 1.7, -2]), [0, 2.5, -3]], u), 42, day('yellow', { crowd: true }));
    },
    banzai(t, u, m) {
      return view(rel(m, [0, 0.4, 3.2]), rel(m, [0, 1.5, 0]), 44, day('yellow'));
    },
    bye(t, u, m) {
      return view(near(m, [0, -0.12, 1.15]), near(m, [0, -0.15, 0]), 38, day('yellow'));
    }
  };

  function cam(w) {
    return { eye: w.eye, at: w.at, fov: w.fov, up: w.upv || [0, 1, 0], near: 0.05, far: 160 };
  }

  function worldFor(t, shot) {
    const u = span(t, shot.start, shot.end);
    const mio = solveActor(mioAt(t));
    const w = WORLDS[shot.cam](t, u, mio, shot);
    return Object.assign({}, w, { scene: shot.scene, cast: [mio], camera: cam(w), mio });
  }

  function stage(t, shot) {
    const sh = shot || shotAt(t);
    const st = worldFor(t, sh);
    const focus = {};
    st.cast.forEach(a => { focus[a.id] = { head: a.head, hips: a.hips }; });
    return Object.assign(st, { focus, shot: sh, beat: beatAt(t) });
  }

  const NY = [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]];
  const NZ = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];
  const FLOOR = -1.2;
  const STAGE_FRONT = 4.5;
  const SCREEN = { x: 0, y: 4.45, z: -6.25, w: 7.2, h: 4.05 };
  const DISCO = [-3.4, 1.45, -2.4];

  function wallQuad(b, x0, y0, x1, y1, z, col, uv) {
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, uv || null, NZ);
  }

  function texQuads(b, x0, z0, x1, z1, y, nx, nz, col) {
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const xa = lerp(x0, x1, i / nx), xb = lerp(x0, x1, (i + 1) / nx);
        const za = lerp(z0, z1, j / nz), zb = lerp(z0, z1, (j + 1) / nz);
        const uv = (x, z) => [(x - x0) / (x1 - x0), (z - z0) / (z1 - z0)];
        b.quad([xa, y, zb], [xb, y, zb], [xb, y, za], [xa, y, za], col, [uv(xa, zb), uv(xb, zb), uv(xb, za), uv(xa, za)], NY);
      }
    }
  }

  function candyColumn(b, x, z, r, h) {
    const n = 12, rows = 28;
    const cols = [0x8ad86a, 0xf8e070, 0xf49ac0, 0xfaf4e8];
    for (let j = 0; j < rows; j++) {
      const y0 = (h * j) / rows, y1 = (h * (j + 1)) / rows;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        const col = cols[Math.floor((i * 2 + j) / 4) % 4];
        const nm0 = [S(a0), 0, C(a0)], nm1 = [S(a1), 0, C(a1)];
        b.quad([x + S(a0) * r, y0, z + C(a0) * r], [x + S(a1) * r, y0, z + C(a1) * r], [x + S(a1) * r, y1, z + C(a1) * r], [x + S(a0) * r, y1, z + C(a0) * r], col, null, [nm0, nm1, nm1, nm0]);
      }
    }
    b.at(x, h + 0.25, z, (c) => c.ellipsoid(r * 1.3, r * 1.1, r * 1.3, 10, 6, 0xf8d050));
    b.at(x, 0.1, z, (c) => c.prism(12, r * 1.25, r * 1.25, -0.1, r * 1.2, r * 1.2, 0.12, 0xf2b84a));
  }

  function balloon(b, x, y, z, r, col) {
    b.at(x, y, z, (c) => c.ellipsoid(r, r * 1.06, r, 10, 7, col));
  }

  function movingHead(b, x, y, z, ry) {
    b.push(M4.translate(x, y, z), M4.rotY(ry || 0));
    b.at(0, 0.06, 0, (c) => c.box(0.34, 0.12, 0.3, 0x1a1a1e));
    [-1, 1].forEach(s => b.at(s * 0.15, 0.24, 0, (c) => c.box(0.04, 0.3, 0.1, 0x222226)));
    b.push(M4.translate(0, 0.3, 0), M4.rotX(-0.5));
    b.box(0.24, 0.26, 0.3, 0x18181c);
    b.at(0, 0, 0.155, (c) => c.box(0.16, 0.16, 0.01, [0.95, 0.92, 0.8, 0.85]));
    b.pop();
    b.pop();
  }

  function buildStage(b) {
    wallQuad(b, -9, FLOOR, 9, 0, STAGE_FRONT, 0xb02838);
    b.at(0, -0.03, STAGE_FRONT + 0.05, (h) => h.box(18.2, 0.08, 0.12, 0xe0a838));
    for (let i = 0; i < 46; i++) b.at(-8.8 + i * 0.39, -0.45, STAGE_FRONT + 0.03, (h) => h.ellipsoid(0.07, 0.07, 0.04, 6, 3, glow(0xffe8a0)));
    for (let s = 0; s < 3; s++) {
      const y0 = s * 0.38, y1 = (s + 1) * 0.38;
      const zf = -4.9 - s * 0.45;
      b.at(0, (y0 + y1) / 2, zf - 0.6, (h) => h.box(11.4, y1 - y0, 1.2, 0xf6e6b8));
      for (let k = 0; k < 14; k++) {
        const x = -5.2 + k * 0.8;
        if (Math.abs(x) < 0.5 && s === 0) continue;
        b.at(x, (y0 + y1) / 2, zf + 0.005, (h) => h.box(0.6, (y1 - y0) * 0.62, 0.01, glow(0xfffbe8, 0.9)));
      }
    }
    b.at(0, 2.4, -6.5, (h) => h.box(11.6, 0.1, 0.3, 0xf4c868));
    b.at(0, SCREEN.y, SCREEN.z - 0.32, (h) => h.box(SCREEN.w + 0.6, SCREEN.h + 0.6, 0.12, 0xf28ab0));
    b.at(0, SCREEN.y, SCREEN.z - 0.16, (h) => h.box(SCREEN.w + 0.3, SCREEN.h + 0.3, 0.08, 0xf2c650));
    for (let i = 0; i < 24; i++) {
      const a0 = PI * (i / 24), a1 = PI * ((i + 1) / 24);
      const ro = 6.0, ri = 5.2, cy = 4.6;
      const col = i % 2 ? 0xf6a0b8 : 0xf8d070;
      b.quad([-C(a0) * ro, cy + S(a0) * ro * 0.62, -6.6], [-C(a1) * ro, cy + S(a1) * ro * 0.62, -6.6], [-C(a1) * ri, cy + S(a1) * ri * 0.62, -6.6], [-C(a0) * ri, cy + S(a0) * ri * 0.62, -6.6], col, null, NZ);
    }
    [-1, 1].forEach(s => {
      candyColumn(b, s * 4.5, -5.6, 0.42, 7.2);
      candyColumn(b, s * 7.3, -4.4, 0.48, 7.8);
      for (let k = 0; k < 6; k++) b.at(s * 8.6, 3.5, -5.5 + k * 1.35, (h) => h.box(0.3, 7, 0.5, k % 2 ? 0xf6d060 : 0xf0c048));
      b.at(s * 8.9, 3.5, 0, (h) => h.box(0.1, 7, 13, 0xf2c85a));
      for (let k = 0; k < 7; k++) {
        const z = -5 + k * 1.6;
        b.tri([s * 8.82, 6.8, z], [s * 8.82, 6.8, z + 1.2], [s * 8.82, 6.0, z + 0.6], k % 2 ? 0x8ad86a : 0xf49ac0, null, [[-s, 0, 0], [-s, 0, 0], [-s, 0, 0]]);
      }
      [[7.0, 0.62, -3.0, 0.62, 0xf4a888], [7.6, 1.0, -1.9, 0.8, 0xc0a8e8], [8.0, 0.55, -0.8, 0.55, 0x98dcb8], [7.9, 0.85, 1.8, 0.85, 0xf8b088], [8.2, 0.5, 3.1, 0.5, 0xc0a8e8], [5.6, 2.9, -5.9, 0.55, 0x98dcb8]].forEach(([x, y, z, r, col]) => balloon(b, s * x, y, z, r, col));
      movingHead(b, s * 2.6, 0.38, -5.25, 0);
      movingHead(b, s * 4.2, 0.76, -5.75, 0);
      movingHead(b, s * 6.6, 0, 3.6, s * 0.3);
      b.push(M4.translate(s * 5.6, 1.35, -3.9), M4.rotX(PI / 2));
      b.prism(20, 1.06, 1.06, -0.12, 1.06, 1.06, 0.1, 0xf0b040, { capBottom: true, capTop: false });
      b.pop();
    });
    b.at(0, 8.4, -2.5, (h) => h.box(18, 0.25, 0.25, 0x2a2a30));
    b.at(0, 8.4, 2.0, (h) => h.box(18, 0.25, 0.25, 0x2a2a30));
  }

  function buildArena(b) {
    b.quad([-18, FLOOR, 40], [18, FLOOR, 40], [18, FLOOR, STAGE_FRONT], [-18, FLOOR, STAGE_FRONT], 0x2a2420, null, NY);
    [-1, 1].forEach(s => {
      b.quad([s * 18, FLOOR, 40], [s * 18, FLOOR, -8], [s * 18, 14, -8], [s * 18, 14, 40], 0x1e1a18, null, [[-s, 0, 0], [-s, 0, 0], [-s, 0, 0], [-s, 0, 0]]);
      b.quad([s * 9, 0, -8], [s * 18, 0, -8], [s * 18, 14, -8], [s * 9, 14, -8], 0x1c1816, null, NZ);
    });
    b.quad([-18, 14, 40], [18, 14, 40], [18, 14, -8], [-18, 14, -8], 0x141210, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    b.quad([-9, 9.5, -7.2], [9, 9.5, -7.2], [9, 14, -7.2], [-9, 14, -7.2], 0x16141a, null, NZ);
    wallQuad(b, -18, 8, 18, 14, 36, 0x26221e);
    b.at(0, 8.2, 35.2, (h) => h.box(36, 0.4, 1.6, 0x3a342c));
  }

  function crowdRows(r) {
    const rows = [];
    const BODY = [0x2c2622, 0x382e28, 0x241e1c, 0x302a30];
    const STICK = [[1, 0.6, 0.12, 0.96], [1, 0.8, 0.2, 0.96], [1, 0.7, 0.16, 0.96]];
    for (let row = 0; row < 13; row++) {
      const z = 5.3 + row * 0.66;
      const base = new Builder(), sticks = new Builder();
      const n = 30 + row;
      for (let i = 0; i < n; i++) {
        if (hash(i, row) < 0.08) continue;
        const x = -11 + (22 * (i + 0.5)) / n + (hash(i, row + 50) - 0.5) * 0.3;
        const zz = z + (hash(i, row + 90) - 0.5) * 0.2;
        const tall = 0.92 + hash(i, row + 3) * 0.14;
        const y = FLOOR;
        const col = BODY[Math.floor(hash(i, row + 7) * BODY.length)];
        base.at(x, y, zz, (h) => {
          h.prism(6, 0.19 * tall, 0.13, 0, 0.21 * tall, 0.14, 1.38 * tall, col, { capTop: false });
          h.at(0, 1.52 * tall, 0, (c) => c.box(0.19, 0.24, 0.2, shade(col, 0.85), { faces: { bottom: null } }));
        });
        const sx = x + (hash(i, row + 11) > 0.5 ? 0.17 : -0.17);
        const hy = y + 1.55 * tall + (hash(i, row + 23) - 0.5) * 0.2;
        const stick = (px, col) => sticks.push(M4.translate(px, hy, zz + 0.05), M4.rotZ((hash(i, row + 29) - 0.5) * 0.5)).at(0, 0.1, 0, (h) => h.box(0.022, 0.2, 0.022, col)).pop();
        stick(sx, STICK[(i + row) % 3]);
        if (hash(i, row + 17) < 0.35) stick(x - (sx - x), STICK[(i + row + 1) % 3]);
      }
      rows.push({ z, hand: FLOOR + 1.6, base: r.mesh(base), sticks: r.mesh(sticks), phase: hash(row, 99) * 0.6 });
    }
    return rows;
  }

  function texSky(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#4aa8f0');
    g.addColorStop(1, '#bfe6ff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    [[30, 40, 26], [70, 32, 20], [150, 56, 30], [196, 44, 22], [230, 70, 18], [100, 90, 24], [20, 100, 16]].forEach(([x, y, r]) => {
      [[0, 0, 1], [r * 0.8, 4, 0.75], [-r * 0.8, 5, 0.7], [r * 0.3, -r * 0.4, 0.7]].forEach(([dx, dy, k]) => {
        ctx.beginPath();
        ctx.ellipse(x + dx, y + dy, r * k, r * 0.62 * k, 0, 0, PI * 2);
        ctx.fill();
      });
    });
  }

  function starPath(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rot + (i / 10) * PI * 2;
      const rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + S(a) * rr, y - C(a) * rr);
    }
    ctx.closePath();
  }

  function ledGrid(ctx, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1, h);
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  }

  function texStars(ctx, w, h, bg, stars) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, bg[0]);
    g.addColorStop(1, bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    let s = 7;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 26; i++) {
      const x = rnd() * w, y = rnd() * h, r = 6 + rnd() * 16;
      ctx.fillStyle = stars[i % stars.length];
      starPath(ctx, x, y, r, rnd());
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 60; i++) ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
    ledGrid(ctx, w, h);
  }

  function texSunset(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#7a4a9a');
    g.addColorStop(0.45, '#f07a8a');
    g.addColorStop(0.75, '#f8b060');
    g.addColorStop(1, '#ffe0a0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,220,230,0.5)';
    [[40, 50, 30], [120, 36, 40], [200, 60, 34]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.3, 0, 0, PI * 2); ctx.fill(); });
    ledGrid(ctx, w, h);
  }

  function texWhite(ctx, w, h) {
    ctx.fillStyle = '#fff8e8';
    ctx.fillRect(0, 0, w, h);
    ledGrid(ctx, w, h);
  }

  function texTitle(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `bold ${Math.round(h * 0.78)}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = h * 0.14;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText('STEP!', w / 2, h * 0.54);
    const g = ctx.createLinearGradient(0, h * 0.15, 0, h * 0.9);
    g.addColorStop(0, '#ffd23a');
    g.addColorStop(1, '#ff7a1a');
    ctx.fillStyle = g;
    ctx.fillText('STEP!', w / 2, h * 0.54);
  }

  function texFloor(ctx, w, h) {
    ctx.setTransform(w / 18, 0, 0, -h / 11.5, (9 * w) / 18, (4.5 * h) / 11.5);
    const cols = ['#f2d43e', '#96d266', '#f6b466', '#72cca2'];
    for (let i = -14; i < 14; i++) {
      for (let j = -14; j < 14; j++) {
        const cx = (i - j) * 0.62, cz = (i + j) * 0.62 - 1;
        ctx.fillStyle = cols[((i + j * 3) % 4 + 4) % 4];
        ctx.beginPath();
        ctx.moveTo(cx, cz - 0.62);
        ctx.lineTo(cx + 0.62, cz);
        ctx.lineTo(cx, cz + 0.62);
        ctx.lineTo(cx - 0.62, cz);
        ctx.closePath();
        ctx.fill();
      }
    }
    const lane = (x0, z0, x1, z1) => {
      ctx.strokeStyle = '#4ac8b0';
      ctx.lineWidth = 0.42;
      ctx.beginPath();
      ctx.moveTo(x0, z0);
      ctx.lineTo(x1, z1);
      ctx.stroke();
      const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.55);
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k <= n; k++) {
        ctx.beginPath();
        ctx.arc(lerp(x0, x1, k / n), lerp(z0, z1, k / n), 0.07, 0, PI * 2);
        ctx.fill();
      }
    };
    lane(-9, -6.5, 9, 6.5);
    lane(9, -6.5, -9, 6.5);
    lane(-9, 1.5, 0, -6.5);
    lane(9, 1.5, 0, -6.5);
    const stripes = ['#f49ac0', '#f8e070', '#f8b060', '#f49ac0', '#f8e070'];
    stripes.forEach((c, k) => {
      ctx.fillStyle = c;
      ctx.fillRect(-0.75 + k * 0.3, -5, 0.3, 9.6);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(0, 0.3, 1.1, 0, PI * 2);
    ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function texChecker(ctx, w, h) {
    const cols = ['#f8a060', '#f8e070', '#7ad0c0', '#f49ac0', '#fff4d8', '#b8e08a'];
    const nx = 16, ny = 4;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      ctx.fillStyle = cols[(i * 7 + j * 5) % cols.length];
      ctx.fillRect((i * w) / nx, (j * h) / ny, w / nx + 1, h / ny + 1);
    }
  }

  function texDots(ctx, w, h) {
    ctx.fillStyle = '#f6b0a0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff4ec';
    for (let y = 8; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, PI * 2);
      ctx.fill();
    }
  }

  function texDisc(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#fff2a0');
    g.addColorStop(0.7, '#f8b040');
    g.addColorStop(1, '#e08a20');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ['#ffffff', '#f8e070', '#f49ac0', '#7ad0c0'].forEach((c, i) => {
      ctx.fillStyle = c;
      starPath(ctx, w * (0.3 + 0.4 * (i % 2)), h * (0.3 + 0.4 * (i > 1 ? 1 : 0)), w * 0.13, i);
      ctx.fill();
    });
  }

  function texCrowd(ctx, w, h, tilt) {
    ctx.fillStyle = '#16120f';
    ctx.fillRect(0, 0, w, h);
    let s = 3;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let row = 0; row < 8; row++) {
      const y = 10 + row * 15;
      for (let i = 0; i < 24; i++) {
        const x = i * 10.6 + rnd() * 4;
        ctx.fillStyle = '#2c241e';
        ctx.beginPath();
        ctx.arc(x, y + 6, 3.4, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = rnd() < 0.5 ? '#ffb030' : '#ffd860';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 2);
        ctx.lineTo(x + 3 + tilt * 4, y - 5);
        ctx.stroke();
      }
    }
  }

  function texGlow(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, '#8a8a8a');
    g.addColorStop(0.75, '#1a1a1a');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function texBurst(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d8d0b8';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 + C(a + 0.08) * 6, h / 2 + S(a + 0.08) * 6);
      ctx.lineTo(w / 2 + C(a) * w * 0.48, h / 2 + S(a) * h * 0.48);
      ctx.lineTo(w / 2 + C(a - 0.08) * 6, h / 2 + S(a - 0.08) * 6);
      ctx.fill();
    }
  }

  const FW = 512;
  const FH = 384;
  const MAIN = { x: 0, y: 48, w: FW, h: 288 };
  const LIVE = { x: 0, y: 0, w: 256, h: 128 };
  const OVER_ENV = { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0, 0, 0], fogNear: 1000, fogFar: 2000, points: [] };
  const ORTHO = new Float32Array([2 / FW, 0, 0, 0, 0, 2 / FH, 0, 0, 0, 0, -1, 0, -1, -1, 0, 1]);

  function billboard(cm) {
    const f = V3.norm(V3.sub(cm.eye, cm.at));
    let rt = V3.cross([0, 1, 0], f);
    if (V3.len(rt) < 1e-4) rt = [1, 0, 0];
    rt = V3.norm(rt);
    const up = V3.cross(f, rt);
    return new Float32Array([rt[0], rt[1], rt[2], 0, up[0], up[1], up[2], 0, f[0], f[1], f[2], 0, 0, 0, 0, 1]);
  }

  function alignY(d) {
    let x = V3.cross(d, [0, 0, 1]);
    if (V3.len(x) < 1e-4) x = [1, 0, 0];
    x = V3.norm(x);
    const z = V3.cross(x, d);
    return new Float32Array([x[0], x[1], x[2], 0, d[0], d[1], d[2], 0, z[0], z[1], z[2], 0, 0, 0, 0, 1]);
  }

  function create(r) {
    const X = Cast.makeCast(r);
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    const T = {
      floor: r.texture(512, texFloor),
      sky: r.texture(256, texSky, { height: 128 }),
      yellow: r.texture(256, (c, w, h) => texStars(c, w, h, ['#ffd84a', '#ffa83a'], ['#ffffff', '#fff2b0', '#ffe070'])),
      pink: r.texture(256, (c, w, h) => texStars(c, w, h, ['#f878b0', '#ffa0c8'], ['#ffe060', '#7ae0f0', '#ffffff'])),
      orange: r.texture(256, (c, w, h) => texStars(c, w, h, ['#f86a1a', '#ffa040'], ['#ffc060', '#ffe0a0'])),
      sunset: r.texture(256, texSunset, { height: 128 }),
      white: r.texture(256, texWhite, { height: 128 }),
      title: r.texture(512, texTitle, { height: 128, clamp: true }),
      checker: r.texture(256, texChecker, { height: 64, clamp: true }),
      dots: r.texture(64, texDots),
      disc: r.texture(128, texDisc, { clamp: true }),
      crowdA: r.texture(256, (c, w, h) => texCrowd(c, w, h, -1), { height: 128 }),
      crowdB: r.texture(256, (c, w, h) => texCrowd(c, w, h, 1), { height: 128 }),
      glow: r.texture(64, texGlow, { clamp: true }),
      burst: r.texture(128, texBurst, { clamp: true }),
      live: r.frameTexture()
    };
    const quadUV = (x0, y0, x1, y1, col, u1, v1) => mk(b => b.quad([x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], col, [[0, 0], [u1 || 1, 0], [u1 || 1, v1 || 1], [0, v1 || 1]], NZ));
    const Q = {
      unit: mk(b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], null, NZ)),
      sprite: mk(b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], NZ)),
      screen: quadUV(-SCREEN.w / 2, -SCREEN.h / 2, SCREEN.w / 2, SCREEN.h / 2, [1, 1, 1, 0.97]),
      title: quadUV(-2.6, -0.65, 2.6, 0.65, [1, 1, 1, 0.97]),
      checker: quadUV(-5.6, -0.6, 5.6, 0.6, [1, 1, 1, 0.75]),
      disc: mk(b => {
        for (let i = 0; i < 20; i++) {
          const a0 = (i / 20) * PI * 2, a1 = ((i + 1) / 20) * PI * 2;
          b.tri([0, 0, 0], [S(a0), C(a0), 0], [S(a1), C(a1), 0], [1, 1, 1, 0.85], [[0.5, 0.5], [0.5 + S(a0) / 2, 0.5 + C(a0) / 2], [0.5 + S(a1) / 2, 0.5 + C(a1) / 2]], [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        }
      }),
      dots: mk(b => b.quad([-1.2, 0, 0], [1.2, 0, 0], [1.2, 7.2, 0], [-1.2, 7.2, 0], [1, 1, 1, 0.3], [[0, 0], [4, 0], [4, 12], [0, 12]], NZ)),
      crowdFar: mk(b => {
        b.quad([-16, FLOOR + 1.55, 20], [16, FLOOR + 1.55, 20], [16, FLOOR + 1.55, 13.8], [-16, FLOOR + 1.55, 13.8], [1, 1, 1, 0.92], [[0, 0], [8, 0], [8, 2], [0, 2]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
        b.quad([-17, 8.5, 33], [17, 8.5, 33], [17, FLOOR + 1.55, 20], [-17, FLOOR + 1.55, 20], [1, 1, 1, 0.92], [[0, 0], [9, 0], [9, 5], [0, 5]], [[0, 0.6, -1], [0, 0.6, -1], [0, 0.6, -1], [0, 0.6, -1]]);
        [-1, 1].forEach(s => b.quad([s * 17.8, FLOOR + 0.2, 6], [s * 17.8, FLOOR + 0.2, 33], [s * 17.8, 8, 33], [s * 17.8, 5, 6], [1, 1, 1, 0.92], [[0, 0], [7, 0], [7, 3], [0, 2]], [[-s, 0, 0], [-s, 0, 0], [-s, 0, 0], [-s, 0, 0]]));
      }),
      beam: mk(b => b.prism(14, 0.12, 0.12, 0, 1.1, 1.1, -1, [1, 1, 1, 1], { capTop: false, topColor: [0, 0, 0, 1] })),
      disco: mk(b => b.ellipsoid(0.8, 0.8, 0.8, 18, 12, [0.96, 0.78, 0.32, 0.25], { flat: true, colorAt: (p) => (Math.floor(p[0] * 9) + Math.floor(p[1] * 9) + Math.floor(p[2] * 9)) % 2 ? [1, 0.86, 0.42, 0.45] : [0.78, 0.56, 0.2, 0.2] })),
      spot: mk(b => b.quad([-1, 0, 1], [1, 0, 1], [1, 0, -1], [-1, 0, -1], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], NY))
    };
    const sets = {};
    const setFor = (id) => sets[id] || (sets[id] = { stage: mk(buildStage), arena: mk(buildArena), floor: mk(b => texQuads(b, -9, -7, 9, STAGE_FRONT, 0.002, 9, 6, [1, 1, 1, 0.1])) });
    let rows = null;
    const crowd = () => rows || (rows = crowdRows(r));

    const BEAMS = [];
    for (let i = 0; i < 8; i++) BEAMS.push({ x: -6.3 + i * 1.8, z: -2.5, ph: i * 0.9 });
    const BULBS = [];
    for (let i = 0; i < 23; i++) BULBS.push([-8.8 + i * 0.78, -0.45, STAGE_FRONT + 0.06]);
    const STARS = [-8, -4, 0, 4, 8].map(x => [x, 10.6, 35]);

    function keyDir(cm) {
      const f = V3.norm(V3.sub(cm.at, cm.eye));
      let rt = V3.cross(f, [0, 1, 0]);
      if (V3.len(rt) < 1e-3) rt = [1, 0, 0];
      rt = V3.norm(rt);
      return V3.norm(V3.add(V3.add(V3.mul(f, 0.6), V3.mul(rt, 0.45)), [0, -0.62, 0]));
    }

    function envFor(st) {
      const cm = st.camera;
      const kd = keyDir(cm);
      const m = st.mio;
      if (st.light === 'night') {
        return {
          sunDir: kd, sunColor: [0.62, 0.5, 0.34], ambTop: [0.22, 0.17, 0.12], ambBottom: [0.08, 0.06, 0.05],
          fogColor: [0.07, 0.05, 0.03], fogNear: 18, fogFar: 60,
          points: [{ pos: [m.root[0], 3.0, m.root[2] + 1.2], color: [2.2, 1.7, 1.0] }, { pos: [0, 4.2, -5.2], color: [1.8, 0.8, 0.25] }]
        };
      }
      if (st.light === 'arena') {
        const pink = st.pink ? [1.4, 0.6, 1.1] : [0.9, 0.8, 0.6];
        return {
          sunDir: kd, sunColor: [0.85, 0.78, 0.66], ambTop: [0.46, 0.42, 0.38], ambBottom: [0.2, 0.18, 0.16],
          fogColor: st.dark ? [0.2, 0.17, 0.13] : [0.42, 0.38, 0.32], fogNear: 6, fogFar: 42,
          points: [{ pos: [m.root[0], 3.2, m.root[2] - 1.2], color: pink }]
        };
      }
      const up = st.up === undefined ? 1 : st.up;
      const dk = 1 - (st.dark || 0);
      const k = up * dk;
      const env = {
        sunDir: kd, sunColor: [0.95 * k, 0.86 * k, 0.7 * k], ambTop: [0.7 * k, 0.63 * k, 0.5 * k], ambBottom: [0.46 * k, 0.38 * k, 0.28 * k],
        fogColor: [lerp(0.04, 1.0, k), lerp(0.03, 0.93, k), lerp(0.02, 0.74, k)], fogNear: 40, fogFar: 120,
        points: [{ pos: [0, 4.5, -3.5], color: [1.2 * k, 1.0 * k, 0.6 * k] }]
      };
      if (st.dark) env.points.push({ pos: [m.root[0], 3.0, m.root[2] + 0.6], color: [2.4 * st.dark, 1.9 * st.dark, 1.2 * st.dark] });
      return env;
    }

    function screenTex(st) {
      if (st.screen === 'live') return T.live;
      return T[st.screen] || T.yellow;
    }

    function drawScreen(st, t) {
      const live = st.screen === 'live';
      const k = st.light === 'day' ? (st.up === undefined ? 1 : st.up) * (1 - (st.dark || 0)) : 1;
      r.draw(Q.screen, M4.translate(SCREEN.x, SCREEN.y, SCREEN.z), { texture: screenTex(st), uvScroll: live ? [0, 0] : [t * 0.035, t * 0.012], noFog: true, tint: [lerp(0.25, 1, k), lerp(0.25, 1, k), lerp(0.25, 1, k)] });
      if (st.title) {
        const s = lerp(0.2, 1, st.title);
        r.draw(Q.title, M4.chain(M4.translate(0, SCREEN.y + 0.2, SCREEN.z + 0.05), M4.scale(s)), { texture: T.title, noFog: true });
      }
    }

    function drawSetDynamic(st, t) {
      const nightish = st.light === 'night' || (st.dark || 0) > 0.5;
      const k = st.light === 'day' ? (st.up === undefined ? 1 : st.up) : 1;
      r.draw(Q.checker, M4.translate(0, 1.76, -6.42), { texture: T.checker, noFog: true, tint: nightish ? [0.35, 0.3, 0.25] : [k, k, k] });
      [-1, 1].forEach(s => {
        r.draw(Q.dots, M4.translate(s * 6.0, 0, -5.88), { texture: T.dots, tint: nightish ? [0.25, 0.2, 0.18] : [1, 1, 1] });
        r.draw(Q.disc, M4.chain(M4.translate(s * 5.6, 1.35, -3.76), M4.rotZ(t * 0.3 * s)), { texture: T.disc, tint: [k, k, k] });
      });
      drawScreen(st, t);
      if (st.disco && st.light === 'night') r.draw(Q.disco, M4.chain(M4.translate(DISCO[0], DISCO[1], DISCO[2]), M4.rotY(t * 0.4)), {});
    }

    function drawCrowd(st, t) {
      const e = energyAt(t);
      const k = st.light === 'day' ? (st.up === undefined ? 1 : st.up) : 1;
      const tint = st.light === 'night' ? [0.45, 0.38, 0.3] : st.light === 'arena' ? [0.7, 0.66, 0.6] : [0.6 * k + 0.1, 0.55 * k + 0.1, 0.5 * k + 0.1];
      const eyeZ = st.camera.eye[2];
      crowd().forEach(row => {
        if (eyeZ > STAGE_FRONT && row.z > eyeZ - 2.6) return;
        const hop = bob(t + row.phase * 0.1) * 0.05 * e;
        r.draw(row.base, M4.translate(0, hop, 0), { tint });
        const sway = 0.5 * e * S(PI * beatAt(t) + row.phase);
        const y0 = row.hand + hop;
        r.draw(row.sticks, new Float32Array([1, 0, 0, 0, sway, 1, 0, 0, 0, 0, 1, 0, -sway * y0, hop, 0, 1]), { tint: [lerp(0.35, 1, k), lerp(0.35, 1, k), lerp(0.35, 1, k)] });
      });
      const ph = Math.floor(beatAt(t)) % 2;
      r.draw(Q.crowdFar, null, { texture: ph ? T.crowdA : T.crowdB, tint: st.light === 'arena' ? [0.9, 0.85, 0.8] : [0.8, 0.75, 0.7] });
    }

    function drawGlows(st, t) {
      const cm = st.camera;
      const bb = billboard(cm);
      const night = st.light === 'night';
      const k = st.light === 'day' ? (st.up === undefined ? 1 : st.up) : 1;
      BULBS.forEach((p, i) => {
        const on = 0.55 + 0.45 * S(PI * beatAt(t) + i * 0.7);
        r.draw(Q.sprite, M4.chain(M4.translate(p[0], p[1], p[2] + 0.05), bb, M4.scale(0.6)), { texture: T.glow, additive: true, tint: [1, 0.8, 0.45], noFog: true, alpha: (night ? 0.9 : 0.45) * on * k });
      });
      if (st.light === 'arena' || st.crowd) {
        STARS.forEach(p => r.draw(Q.sprite, M4.chain(M4.translate(p[0], p[1], p[2]), bb, M4.scale(7.5)), { texture: T.burst, additive: true, tint: [1, 0.95, 0.85], noFog: true, alpha: 0.9 * k }));
      }
      const beamA = night ? 0.26 : st.light === 'arena' ? 0.15 : 0.1 * k;
      BEAMS.forEach(bm => {
        const sw = S(t * 0.6 + bm.ph) * 0.45;
        const dir = V3.norm([S(sw) * 0.6, -1, 0.35 + 0.3 * C(t * 0.45 + bm.ph)]);
        const M = M4.chain(M4.translate(bm.x, 8.3, bm.z), alignY(V3.mul(dir, -1)), M4.scale(1, 9, 1));
        r.draw(Q.beam, M, { additive: true, noFog: true, alpha: beamA, tint: night ? [1, 0.78, 0.4] : [1, 0.95, 0.8] });
      });
      if (night || st.dark) {
        const m = st.mio;
        const a = night ? 0.55 : 0.6 * st.dark;
        r.draw(Q.spot, M4.chain(M4.translate(m.root[0], 0.01, m.root[2]), M4.scale(1.3)), { texture: T.glow, additive: true, noFog: true, alpha: a, tint: [1, 0.85, 0.6] });
      }
      if (st.light === 'arena' && st.pink) {
        const m = st.mio;
        const M = M4.chain(M4.translate(m.root[0], 9, m.root[2] - 0.3), M4.scale(1.4, 9, 1.4));
        r.draw(Q.beam, M, { additive: true, noFog: true, alpha: 0.35, tint: [1, 0.55, 0.85] });
      }
    }

    function liveEnv(t) {
      return { sunDir: V3.norm([-0.3, -0.4, -0.86]), sunColor: [0.85, 0.8, 0.7], ambTop: [0.7, 0.64, 0.56], ambBottom: [0.5, 0.42, 0.36], fogColor: [1, 0.86, 0.5], fogNear: 40, fogFar: 90, points: [] };
    }

    function renderLive(st, t) {
      const m = st.mio;
      const fwd = [S(m.pose.ry), 0, C(m.pose.ry)];
      const eye = addV(m.head, [fwd[0] * 1.1, -0.06, fwd[2] * 1.1]);
      const at = addV(m.head, [0, -0.1, 0]);
      r.begin(liveEnv(t), { eye, at, fov: 30, up: [0, 1, 0], near: 0.05, far: 30 }, LIVE);
      r.draw(Q.unit, M4.chain(M4.translate(at[0] - fwd[0] * 1.5 - 4, at[1] - 3, at[2] - fwd[2] * 1.5), M4.scale(8, 6, 1)), { flat: [1, 0.82, 0.4, 1], noFog: true });
      Cast.drawActor(r, X, m);
      r.grab(T.live, LIVE.x, LIVE.y, LIVE.w, LIVE.h);
    }

    let polys = 0;
    const tally = () => { polys += r.polys; r.polys = 0; };
    const F = { full: r.frameTexture(), small: r.frameTexture(), tiny: r.frameTexture() };
    const ORTHO_MAIN = new Float32Array([2 / MAIN.w, 0, 0, 0, 0, 2 / MAIN.h, 0, 0, 0, 0, -1, 0, -1, -1, 0, 1]);
    const inMain = (colorM, colorAdd) => {
      tally();
      r.begin(OVER_ENV, { proj: ORTHO_MAIN, view: M4.ident(), colorM, colorAdd }, MAIN, true);
    };
    const rect = (x, y, w, h, opts) => r.draw(Q.unit, M4.chain(M4.translate(x, y, 0), M4.scale(w, h, 1)), Object.assign({ noFog: true }, opts));
    const BLOOM = { day: [2.5, -1.85, 0.34], night: [2.0, -0.95, 0.55], arena: [2.0, -1.1, 0.45] };

    function bloom(st) {
      const [gain, cut, k] = BLOOM[st.light];
      const up = st.light === 'day' ? (st.up === undefined ? 1 : st.up) : 1;
      if (k * up <= 0.02) return;
      r.grab(F.full, MAIN.x, MAIN.y, MAIN.w, MAIN.h);
      inMain(new Float32Array([gain, 0, 0, 0, gain, 0, 0, 0, gain]), [cut, cut, cut]);
      rect(0, 0, 128, 72, { texture: F.full });
      r.grab(F.small, MAIN.x, MAIN.y, 128, 72);
      inMain();
      rect(0, 0, 32, 18, { texture: F.small });
      r.grab(F.tiny, MAIN.x, MAIN.y, 32, 18);
      rect(0, 0, MAIN.w, MAIN.h, { texture: F.full });
      rect(0, 0, MAIN.w, MAIN.h, { texture: F.small, additive: true, alpha: 0.6 * k * up });
      rect(0, 0, MAIN.w, MAIN.h, { texture: F.tiny, additive: true, alpha: k * up });
    }

    function overlay(t) {
      const a = flashAt(t);
      if (a <= 0.001) return;
      tally();
      r.begin(OVER_ENV, { proj: ORTHO, view: M4.ident() }, { x: 0, y: 0, w: FW, h: FH }, true);
      r.draw(Q.unit, M4.chain(M4.translate(0, MAIN.y, 0), M4.scale(FW, MAIN.h, 1)), { flat: [1, 0.99, 0.95, a], blend: true, noFog: true });
    }

    function clearColor(st) {
      if (st.light === 'night') return [0.07, 0.05, 0.03];
      if (st.light === 'arena') return st.dark ? [0.2, 0.17, 0.13] : [0.42, 0.38, 0.32];
      const k = (st.up === undefined ? 1 : st.up) * (1 - (st.dark || 0));
      return [lerp(0.04, 1, k), lerp(0.03, 0.93, k), lerp(0.02, 0.74, k)];
    }

    return {
      warm() {
        setFor('arena');
        crowd();
        Object.keys(ARMS).forEach(n => { armOf(n, 'L', 0); armOf(n, 'R', 0); });
      },
      render(t) {
        polys = 0;
        r.polys = 0;
        const shot = shotAt(t);
        const st = worldFor(t, shot);
        if (st.screen === 'live') {
          r.clear([0, 0, 0]);
          renderLive(st, t);
          tally();
        }
        r.clear([0, 0, 0]);
        const env = Object.assign(envFor(st), { fogColor: clearColor(st) });
        r.begin(env, st.camera, MAIN);
        const S2 = setFor('arena');
        const k = st.light === 'day' ? (st.up === undefined ? 1 : st.up) : 1;
        r.draw(S2.arena, null, {});
        r.draw(S2.stage, null, { tint: [k, k, k] });
        r.draw(S2.floor, null, { texture: T.floor, tint: st.light === 'night' ? [0.4, 0.34, 0.28] : [k, k, k] });
        drawSetDynamic(st, t);
        drawCrowd(st, t);
        Cast.drawActor(r, X, st.mio);
        drawGlows(st, t);
        bloom(st);
        overlay(t);
        tally();
        return { shot, polys: Math.round(polys), fade: fadeAt(t), overlay: null };
      }
    };
  }

  const clip = {
    id: 'step',
    number: 10,
    artist: 'Мио Хонда',
    title: 'Step!',
    originalYear: 2016,
    audio: 'content/clip/Mio Honda - Step!.mp3',
    duration: DURATION,
    bpm: BPM,
    beat0: BEAT0,
    poster: 36.2,
    locations: LOCATIONS,
    shots: SHOTS,
    looks: CHARACTERS,
    shotAt,
    stage,
    fadeAt,
    flashAt,
    voiceAt,
    mouthFor,
    energyAt,
    rootAt,
    moveAt: (t) => danceAt(t).move,
    create
  };

  window.poligonClips = window.poligonClips || [];
  if (!window.poligonClips.some(c => c.id === clip.id)) window.poligonClips.push(clip);
})();
