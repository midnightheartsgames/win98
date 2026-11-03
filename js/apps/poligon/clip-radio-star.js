(function () {
  const { M4, V3, Builder, rgb } = window.P3D;
  const { restPose } = window.P3DFigure;
  const Cast = window.P3DCccCast;
  const GK = window.P3DGodKnowsCast;

  const BPM = 130.86;
  const BEAT0 = 0.338;
  const BEAT = 60 / BPM;
  const DURATION = 201.22;
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
    { id: 'night', name: 'Ночь у приёмника', color: '#4a48b8', scene: 'night' },
    { id: 'poster', name: 'Плакат', color: '#d8d8d8', scene: 'poster' },
    { id: 'white', name: 'Белая студия', color: '#9ab4d8', scene: 'white' },
    { id: 'lab', name: 'Лаборатория', color: '#4ab09a', scene: 'lab' },
    { id: 'pile', name: 'Гора приёмников', color: '#c83a3a', scene: 'pile' },
    { id: 'pink', name: 'Розовый павильон', color: '#e04aa8', scene: 'pink' },
    { id: 'tv', name: 'Телевизоры', color: '#3a8ad8', scene: 'tvpile' },
    { id: 'studio', name: 'Студия', color: '#f0b830', scene: 'studio' }
  ];

  const SHOT_LIST = [
    [0, 'night', 'moonRise', { emptyOk: true }], [18.44, 'night', 'radio'], [29.64, 'night', 'glow1'], [31.48, 'white', 'keysTilt'],
    [33.36, 'poster', 'face1'], [37.3, 'night', 'moonRight', { mix: 1.6 }], [46.08, 'poster', 'face2'], [47.96, 'night', 'glow2'],
    [49.72, 'night', 'duet1'], [51.84, 'night', 'sparkle1'], [53.4, 'night', 'boom1', { emptyOk: true }], [55.24, 'night', 'sparkle2'],
    [57.04, 'night', 'sparkle3'], [59.5, 'night', 'duet2', { mix: 0.5 }], [63.3, 'night', 'future', { mix: 1.0 }], [66.3, 'lab', 'reels'],
    [71.68, 'lab', 'pianoLab'], [73.4, 'lab', 'walkTube'], [77.88, 'lab', 'tubeClose1'], [79.28, 'lab', 'twoShot'],
    [81.04, 'lab', 'tubeClose2'], [82.64, 'lab', 'singerTv'], [86.28, 'lab', 'tvTwins1'], [87.92, 'white', 'keysHands'],
    [89.68, 'lab', 'tvTwins2'], [91.64, 'lab', 'singerClose'], [101.52, 'lab', 'rise'], [102.96, 'lab', 'tvTwins3'],
    [105.28, 'lab', 'girlTube'], [106.8, 'lab', 'girlFace'], [107.72, 'lab', 'pianoTv'], [111.76, 'white', 'keysLean'],
    [113.16, 'lab', 'tubeUp'], [113.96, 'white', 'keysSynths'], [115.52, 'lab', 'tubeStand'], [117.44, 'pile', 'climb'],
    [123.28, 'pile', 'shatter'], [125.08, 'pile', 'boom2', { emptyOk: true }], [126.76, 'pink', 'twinsClose'], [128.6, 'pink', 'twinsFull'],
    [129.92, 'tv', 'tvWall1', { emptyOk: true }], [131.12, 'tv', 'tvWall2', { emptyOk: true }], [132.16, 'tv', 'tvRow', { emptyOk: true }], [134.2, 'tv', 'tvSilver', { emptyOk: true }],
    [136.12, 'tv', 'tvKeys', { emptyOk: true }], [137.56, 'tv', 'tvSinger', { emptyOk: true }], [141.64, 'white', 'keysHands2'], [144.36, 'tv', 'tvLong', { emptyOk: true }],
    [159.96, 'lab', 'flyUp'], [163.28, 'lab', 'breach'], [165.9, 'studio', 'enter', { mix: 0.6 }], [170.16, 'studio', 'whip'],
    [174.16, 'studio', 'bassBack'], [176.24, 'studio', 'synthClose'], [177.92, 'studio', 'synthPull'], [178.76, 'studio', 'keysClose'],
    [180.64, 'studio', 'bandWide'], [181.96, 'studio', 'danceLong'], [191.08, 'studio', 'organBass'], [193.36, 'studio', 'finale']
  ];

  const SHOTS = SHOT_LIST.map(([start, loc, cam, opts], i) => Object.assign({
    index: i,
    start,
    end: i + 1 < SHOT_LIST.length ? SHOT_LIST[i + 1][0] : DURATION,
    loc,
    cam,
    scene: LOCATIONS.find(l => l.id === loc).scene,
    overlay: null
  }, opts || {}));

  function shotAt(t) {
    let lo = 0, hi = SHOTS.length - 1;
    const tt = clamp(t, 0, DURATION);
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (SHOTS[mid].start <= tt) lo = mid; else hi = mid - 1;
    }
    return SHOTS[lo];
  }

  const fadeAt = (t) => smooth(span(t, 199.7, 201.1));
  const whiteAt = (t) => smooth(span(t, 195.8, 199.0));
  const boomAt = (t, t0, len) => smooth(span(t, t0 - 0.05, t0)) * (1 - smooth(span(t, t0 + 0.12, t0 + len)));
  const flashAt = (t) => Math.max(boomAt(t, 53.4, 0.55), boomAt(t, 125.08, 0.45), 0.85 * boomAt(t, 125.3, 0.7));

  const VOICE = '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000swwulqttssvumjrsrnlopngptutppob3swwt8opj2osq09uuj0apqmnonkh80000000000000cswwvvxzxrsutrpuxxtvxuopwxuirxv8ptsnmqutpknttuwwtlitvspqqmha00000000000000lvu70rvvsopphovwvtnrsm0msrefggsurc002mqn4dmssmklh66dfffeb78500000000ipqppnoopqtsk0prrrqqruututqolb0000000000000000000000000000000000000000000000000uzzvmvyworvuiksxyywwwq0gouwxwurkrxzvhvwnkosrj0jorrrvyyzzzxg520000000000000pzzzuyzxpemqqruxyurvuttwywswzxpsvvqixzvitwwvxywp4mrxzzzzzzsh9000000000000vwtqtwxwutvwyyxurppqpjguwumisr70rutneooheptq3nqodlnrvwwxyxt900000000susrrqonoqtq40susrqqpquvsqpl90000000000009xyskmvxtmttmfuyzzzzzxvutwzzzzzywusrrrrqpqtse0psrrrqopqstsqma0330000000000htt40xzzvoxxi5vyzzzzzxuvwxyyzzxqntxxsrvwvvvvwxwsn9ptttttuuqgagkiqttuvvuttssvxxvututpnniruuwwvvvuqj4565100fqtutqsvvvwvuvuqmecstrstsqqjhlmllvyvuvustsuwwwvustusllimstuwwvuurkb7641000nxxhsyzzzzyumhmyzzzzzzzzzzxutrpm9rvvur7degrvvvurm11qutsrqqro500038cdc9300iqssrqqrrrqol7mokcptrf5qtsqrrpl0qsrsttsssrqnnnonkjkg400000000000000000000000001tunmvxxwsrxyuwzzzurwyyvuvwvvxwsovxxusvscersqqvzzzzwsrsssstrld000000004dhhpzzvmxzzyusl2qvyzzxxyxsxzzywywnjsxyuotutstutsquwuolpqrssrsrojfmrsrqmlkkllwxtqryzzyxxxvuwxwuuuvvrfdeeeuwtqxzxvuwxuqpwwrnqwvepvwuutrqponka68cedeorrqpoppptsmeirsrssrrtttvung5774000000000hyzsswxwssvtg0qwyzytilljptwxvvwwxwvutsqpnrtpdlstrqppqsrqsroi30000000000000vzysuuvwttutsvxyzzzwmdhosvwwvwwtsvwvqsvvvvvuvwvrkcqsrrqqpnhfnqposvvuuustrruvvvvuuvspomgrtuwwvuurnc0342000mrttrruuuvutuusojblstsssrpmglprqruvutusqrrtvvvvuttspmkdsuuvwxwttrm6320000ewzxwvvwwwwxxtqtwwvwwyywvvvuyzyyyxqqswyxtoquvwwxtehqtuuvuuuvvvun50000bvyusvvvwwuqimpsxzzzzvnqtuvxywspoowzzzyq2nuvtrk9flnlkkg04nqssrsssrsstsnhha6055lprrssrqqpnif9mmd0nqm2frtrrroib0oqpqqqppoomjhhfb9985000000000000120466100horrpppopqonlcilje0opj0mqqpqqpl9lppnopokklmmmmnlif9630000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000aquurosuvuwvtutsqj8rsqqrrqpjamqqnpuvvtsssrrvwwwutttrlkijsuvvvtttqj61220000ntutqnsuuuutttqmg8prqqrqpolb68gkruuttsssrruvtutsrssoljhruvvuttutpha630000csvsmnsttvyxskrwyywwxvtrpnoqyzyyxtpotxxuqlsvvwxwrdgjnqrrsstttttsoi000buugpuwwvupdcgpvxxxumgruvvxytkklpuwxyvi0quvtocbgpqjb000qtttutstuuuurh000000000wytnvzzyxwrielyzzzzzzzzzzzwvuld7lvwwvqeiirwvuutm34qttvvtsvvusj60000000000nsq65vzzyywvrjpsrqwyxyzzzzxsvxwxwpg91txxuc4pwxxyyzzwvvvuuuttstsssrpnkiilmkkjjmmljec80000000000000000000000000000000000000000000000000000000130000000dhhfeffefggffgfegfefhgeefiiiihhhhhhhgghhhiihhhighiihgegjlkfffeddedfgc7524cfghhjkkjggghghkkjihjjhhijkihhijllklmmkknmjkmkjllkif800000000007fjlkhdgiloqqponopqomqrpopppoqrssssssttstutrstsssttstttustvvssspoquvtqrrqtuvvtrnifgnpprtstvwtruvtrqqqqqsuusstttrrtusstuuutsuwutuustutqof9500000000000000000iqssppsttuvutttrm9lrsrrsrol8flnoqtvwvurpqoqvvttsrrssokfmrssuvtrqof31100009mqsspossssstttrnbfrspqpmjgcehjlmrsssrporqsuuutsstrqnljjpsuvvttsrnea950000jqsqmostuututtqjefstsssqnlblmmkmtwwwurqsssvvuutqsutqoliruuvwvtsrog7652001krtsqqsssttuuvtpi9qsrsrokgbchknosuutsqppqprvvvusrsqojiiqttuutssqhfnqqrrsvvuvvuuvutuutuvvtttvvuvvvvvvwvuuvwvuwwwvtsqsutrpoqqszzzwxzxuttttuvwwxupifciqtvxwwyxvwvvvvutuutuvvwwvuvvutuvvtrqpoonnrtsrsrpppmihcjnpsttrqoj9hkjkqrqqstusprrqststtsqrrrrqrrrrqqrqqrrrssrrqqqpnmnonlkifgpqnnoqqnllmlkjlnoliea49ehgfhhhiiiihghhfghhghjhdddbbdfd9aca753254799885243000000233310000000000000121100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
  const VOICE_LV = Array.from(VOICE, ch => parseInt(ch, 36) / 35);

  function voiceAt(t) {
    const f = t * 20;
    const i = Math.floor(f);
    if (i < 0 || i >= VOICE_LV.length) return 0;
    const a = VOICE_LV[i], b = VOICE_LV[i + 1] || 0;
    return a + (b - a) * (f - i);
  }

  const SOLO = [[18.5, 28.8], [33.4, 36.3], [37.4, 43.6], [46.0, 48.0], [49.7, 51.8], [59.5, 65.4], [66.4, 76.9], [79.4, 80.8], [83.0, 84.8], [91.6, 105.6], [133.4, 149.4], [166.8, 170.4], [176.4, 178.2], [186.8, 188.2]];
  const CHOIR = [[28.9, 31.0], [36.4, 37.3], [43.7, 45.8], [46.4, 50.0], [51.8, 59.7], [77.2, 79.3], [80.8, 82.6], [84.8, 88.0], [88.3, 91.4], [126.8, 133.4], [152.3, 166.6], [170.5, 176.4], [178.2, 186.8], [188.3, 195.2]];
  const inside = (list, t) => list.some(([a, b]) => t >= a && t <= b);

  function mouthFor(role, t) {
    const list = role === 'singer' ? SOLO : role === 'twin' || role === 'silver' ? CHOIR : null;
    if (!list || !inside(list, t)) return 0;
    return clamp((voiceAt(t) - 0.15) / 0.7, 0, 1);
  }

  const ENERGY = [[0, 0.25], [18.4, 0.45], [33.4, 0.55], [37.3, 0.7], [51.8, 0.9], [66.3, 0.7], [91.6, 0.9], [106, 0.7], [119, 0.5], [123.3, 0.95], [126.8, 0.85], [149.5, 0.35], [160, 1], [194, 0.6], [198, 0.2]];
  function energyAt(t) {
    let i = 0;
    while (i + 1 < ENERGY.length && ENERGY[i + 1][0] <= t) i++;
    const next = ENERGY[i + 1];
    if (!next) return ENERGY[i][1];
    return lerp(ENERGY[i][1], next[1], smooth(span(t, next[0] - 0.8, next[0])));
  }

  const CHARACTERS = {
    singer: { name: 'Певец' },
    keys: { name: 'Клавишник' },
    synth: { name: 'Синтезаторщик' },
    girl: { name: 'Девочка' },
    silver: { name: 'Девушка из будущего' },
    twins: { name: 'Близняшки' }
  };

  const ARMS = {
    down: [0.08, 0, 0.1, 0.12], relax: [0.2, 0.15, 0.22, 0.42], low: [0.32, 0.1, 0.62, 0.16], spread: [0.05, 0, 1.45, 0.06],
    vUp: [0.25, 0, 2.45, 0.08], wave: [2.55, 0.25, 0.45, 0.45], palms: [0.75, 0.55, 0.55, 1.35], side2: [0.35, 0, 1.15, 0.2],
    bentUp: [2.2, 0.7, 0.45, 1.25], open: [0.6, 0.35, 0.7, 0.55], reachUp: [2.35, 0.15, 0.3, 0.25], fwd: [1.35, 0.1, 0.12, 0.25],
    swingF: [0.42, 0.05, 0.12, 0.45], swingB: [-0.3, 0, 0.12, 0.3], climbHi: [2.1, 0.1, 0.25, 0.7], climbLo: [1.1, 0.1, 0.2, 0.9],
    float: [0.2, 0, 1.95, 0.1], thigh: [0.32, 0.05, 0.15, 0.55], knee: [0.55, 0.1, 0.1, 0.35], point: [1.45, 0.18, 0.05, 0.08],
    hipBack: [-0.15, 0.2, 0.5, 1.2]
  };

  const LEGS = {
    stand: { hipL: [0.03, 0, 0.05], knL: [0.05, 0, 0], hipR: [0.03, 0, 0.05], knR: [0.05, 0, 0] },
    apart: { hipL: [0.02, 0, 0.17], knL: [0.06, 0, 0], hipR: [0.02, 0, 0.17], knR: [0.06, 0, 0] },
    restL: { hipL: [0.16, 0.12, -0.02], knL: [0.34, 0, 0], hipR: [0.02, 0, 0.07], knR: [0.02, 0, 0] },
    restR: { hipL: [0.02, 0, 0.07], knL: [0.02, 0, 0], hipR: [0.16, 0.12, -0.02], knR: [0.34, 0, 0] },
    kneel: { hipL: [0.32, 0, 0.12], knL: [1.9, 0, 0], hipR: [0.32, 0, 0.12], knR: [1.9, 0, 0] },
    perch: { hipL: [1.35, 0, 0.16], knL: [1.6, 0, 0], hipR: [1.35, 0, 0.16], knR: [1.6, 0, 0] },
    together: { hipL: [0.0, 0, 0.0], knL: [0.04, 0, 0], hipR: [0.0, 0, 0.0], knR: [0.04, 0, 0] },
    float: { hipL: [0.12, 0, 0.02], knL: [0.4, 0, 0], hipR: [-0.06, 0, 0.02], knR: [0.18, 0, 0] },
    dance: { hipL: [0.08, 0.1, 0.12], knL: [0.25, 0, 0], hipR: [0.02, 0, 0.06], knR: [0.06, 0, 0] }
  };

  const mixArm = (a, b, w) => a.map((v, i) => lerp(v, b[i], w));
  const JOINTS = ['spine', 'neck', 'shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR'];

  function blendActor(a, b, w) {
    if (w <= 0) return a;
    if (w >= 1) return b;
    const p = Object.assign({}, w < 0.5 ? a.pose : b.pose);
    JOINTS.forEach(j => { p[j] = mixArm(a.pose[j], b.pose[j], w); });
    ['x', 'z', 'ry'].forEach(k => { p[k] = lerp(a.pose[k], b.pose[k], w); });
    const ya = a.pose.ground === false ? a.pose.y : 0, yb = b.pose.ground === false ? b.pose.y : 0;
    if (a.pose.ground === false || b.pose.ground === false) {
      p.ground = false;
      p.y = lerp(ya, yb, w);
    }
    return Object.assign({}, w < 0.5 ? a : b, { pose: p });
  }

  function base(x, z, ry, legs) {
    const p = restPose();
    p.x = x;
    p.z = z;
    p.ry = ry || 0;
    const L = LEGS[legs || 'stand'];
    p.hipL = L.hipL.slice();
    p.knL = L.knL.slice();
    p.hipR = L.hipR.slice();
    p.knR = L.knR.slice();
    return p;
  }

  function setArm(p, side, a) {
    const A = typeof a === 'string' ? ARMS[a] : a;
    p['sh' + side] = [A[0], A[1], A[2]];
    p['el' + side] = [A[3], 0, 0];
    return p;
  }

  function arms(p, l, r) {
    setArm(p, 'L', l);
    return setArm(p, 'R', r);
  }

  const ikCache = {};
  function reachWorld(key, form, p, side, world, hint) {
    if (!ikCache[key]) {
      const m = Cast.solve(form, p);
      const local = M4.point(GK.invRigid(m.torso), world);
      ikCache[key] = GK.ik(form, side, local, hint);
    }
    return ikCache[key];
  }

  function reachLocal(form, side, target, hint) {
    return GK.ik(form, side, side === 'L' ? target : [-target[0], target[1], target[2]], hint);
  }

  const blinkAt = (t, k) => frac(t / 3.3 + (k || 0)) < 0.035;

  function faceFor(role, t, rest) {
    const tt = Math.floor(t * 12) / 12;
    const v = mouthFor(role, tt);
    if (v > 0.72) return 'belt';
    if (v > 0.42) return 'sing';
    if (v > 0.14) return 'say';
    return rest || 'calm';
  }

  function finish(id, form, p, t, role, rest, props) {
    p.face = faceFor(role, t, rest);
    p.blink = blinkAt(t, hash(id.length, 3)) ? 1 : 0;
    return { id, form, look: form, pose: p, hidden: false, props: props || [] };
  }

  function solveActor(a) {
    const m = Cast.solve(a.form, a.pose);
    a.m = m;
    a.head = M4.point(m.head, [0, 0, 0]);
    a.hips = M4.point(m.hips, [0, 0, 0]);
    a.root = [a.pose.x, 0, a.pose.z];
    return a;
  }

  function walkCycle(p, t, speed) {
    const ph = t * speed * PI;
    const s = S(ph);
    p.hipL = [0.3 * s, 0, 0.04];
    p.hipR = [-0.3 * s, 0, 0.04];
    p.knL = [0.08 + 0.35 * Math.max(0, -C(ph)), 0, 0];
    p.knR = [0.08 + 0.35 * Math.max(0, C(ph)), 0, 0];
    p.shL = [-0.28 * s, 0, 0.12];
    p.shR = [0.28 * s, 0, 0.12];
    p.elL = [0.3, 0, 0];
    p.elR = [0.3, 0, 0];
    p.spine = [0.04, 0.05 * s, 0];
    return p;
  }

  const RADIO_W = 0.72, RADIO_H = 0.64, RADIO_D = 0.38;
  const KNOB_W = [0.25, 0.12, RADIO_D / 2 + 0.035];
  const KNEEL = { x: 0.6, z: 0.42, ry: -1.62 };
  const NIGHT_GIRL = { x: 0.45, z: 0.35 };

  function kneelBase(x, z, ry) {
    const p = base(x, z, ry, 'kneel');
    p.spine = [0.34, 0.08, 0];
    p.neck = [0.12, -0.1, 0.04];
    return p;
  }

  function girlAt(t, mode, o) {
    const opt = o || {};
    let p, rest = 'calm';
    const e = energyAt(t);
    if (mode === 'kneel') {
      p = kneelBase(KNEEL.x, KNEEL.z, KNEEL.ry);
      const a = reachWorld('girlKnob', 'rsGirl', kneelBase(KNEEL.x, KNEEL.z, KNEEL.ry), 'R', KNOB_W);
      setArm(p, 'R', a);
      p.elR = [a[3], 0.32 * S(t * 2.1), 0];
      setArm(p, 'L', ARMS.thigh);
      p.neck = [0.12 + 0.04 * S(t * 0.9), -0.1 + 0.06 * S(t * 0.6), 0.04];
      p.spine[0] += 0.02 * S(t * 1.3);
    } else if (mode === 'perch') {
      p = base(opt.x, opt.z, opt.ry, 'kneel');
      p.ground = false;
      p.y = opt.y;
      p.spine = [0.2, 0, 0];
      arms(p, ARMS.knee, ARMS.knee);
      p.neck = [-0.1 + 0.08 * S(t * 0.8), 0.35 * S(t * 0.55), 0];
    } else if (mode === 'climb') {
      p = base(opt.x, opt.z, opt.ry, 'stand');
      p.ground = false;
      p.y = opt.y;
      const ph = t * 2.4;
      p.hipL = [0.9 + 0.5 * S(ph), 0, 0.1];
      p.hipR = [0.9 - 0.5 * S(ph), 0, 0.1];
      p.knL = [1.2 + 0.4 * C(ph), 0, 0];
      p.knR = [1.2 - 0.4 * C(ph), 0, 0];
      p.spine = [0.45, 0, 0];
      p.neck = [-0.3, 0, 0];
      setArm(p, 'L', mixArm(ARMS.climbHi, ARMS.climbLo, 0.5 + 0.5 * S(ph)));
      setArm(p, 'R', mixArm(ARMS.climbHi, ARMS.climbLo, 0.5 - 0.5 * S(ph)));
    } else if (mode === 'reach') {
      p = base(opt.x, opt.z, opt.ry, 'stand');
      arms(p, ARMS.reachUp, ARMS.reachUp);
      p.shL[0] += 0.1 * S(t * 1.7);
      p.shR[0] += 0.1 * S(t * 1.7 + 1.2);
      p.neck = [-0.5, 0, 0];
      p.spine = [-0.08, 0, 0];
      rest = 'surprised';
    } else if (mode === 'look') {
      p = base(opt.x, opt.z, opt.ry, 'stand');
      arms(p, ARMS.down, ARMS.down);
      p.neck = [-0.42 + 0.05 * S(t * 0.7), 0.1 * S(t * 0.5), 0];
      rest = 'surprised';
    } else {
      p = base(opt.x === undefined ? NIGHT_GIRL.x : opt.x, opt.z === undefined ? NIGHT_GIRL.z : opt.z, opt.ry || 0, 'stand');
      arms(p, ARMS.down, ARMS.down);
      p.shL[2] += 0.06 * S(t * 1.1);
      p.shR[2] += 0.06 * S(t * 1.1 + 0.5);
      p.spine = [0, 0, 0.03 * e * S(PI * beatAt(t))];
      p.neck = [-0.08 + 0.04 * S(t * 0.8), 0.2 * S(t * 0.4), 0];
    }
    return finish('girl', 'rsGirl', p, t, 'girl', rest);
  }

  const POSTER_RY = 0.8;
  function posterBase(front) {
    const p = base(0, 0, front ? 0 : POSTER_RY, 'stand');
    p.spine = [0.06, 0, 0];
    return p;
  }

  function micPoint(front) {
    const m = Cast.solve('rsSingerPoster', posterBase(front));
    return M4.point(m.head, front ? [0, -0.21, 0.13] : [0, -0.08, 0.16]);
  }

  let MIC = null;
  function mics() {
    if (!MIC) MIC = { side: micPoint(false), front: micPoint(true) };
    return MIC;
  }

  function singerPoster(t, front) {
    const p = posterBase(front);
    const mic = mics()[front ? 'front' : 'side'];
    const grip = [mic[0], mic[1] - 0.15, mic[2]];
    const a = reachWorld(front ? 'micFront' : 'micSide', 'rsSingerPoster', posterBase(front), 'R', grip);
    setArm(p, 'R', a);
    setArm(p, 'L', ARMS.down);
    const e = energyAt(t);
    p.neck = [0.06 + 0.05 * e * (bob(t) - 0.5), 0.04 * S(t * 0.7), 0.03 * S(PI * beatAt(t))];
    return finish('singer', 'rsSingerPoster', p, t, 'singer', 'calm');
  }

  const CAB = [[2.62, -3.62], [3.3, -3.62]];
  const TUBE = { x: 1.55, z: -2.35, r: 0.46, h: 2.7, base: 0.14 };
  const LAB_PIANO = { x: -3.35, z: -2.55, ry: 0.55 };
  const LAB_TV = { x: -2.05, z: -3.05, ry: 0.35 };
  const LAB_TV_Y = 1.03;
  const labTvMatrix = () => M4.chain(M4.translate(LAB_TV.x, 0, LAB_TV.z + 0.1), M4.rotY(LAB_TV.ry));

  function singerLab(t, mode, o) {
    const opt = o || {};
    let p;
    const e = energyAt(t);
    if (mode === 'lean') {
      p = base(3.2, -3.08, -0.55, 'restR');
      p.spine = [0.06, 0, -0.12];
      const lean = base(3.2, -3.08, -0.55, 'restR');
      lean.spine = [0.06, 0, -0.12];
      const a = reachWorld('cabLean', 'rsSingerLab', lean, 'R', [2.98, 1.68, -3.45]);
      setArm(p, 'R', a);
      setArm(p, 'L', ARMS.relax);
    } else if (mode === 'walk') {
      const k = span(t, opt.t0, opt.t1);
      const x = lerp(opt.from[0], opt.to[0], k), z = lerp(opt.from[1], opt.to[1], k);
      const still = arms(base(x, z, opt.ry || 0, 'stand'), ARMS.relax, ARMS.relax);
      const step = walkCycle(base(x, z, opt.ry || 0, 'stand'), t, 1.6);
      const w = smooth(span(t, opt.t0 - 0.15, opt.t0 + 0.35)) * (1 - smooth(span(t, opt.t1 - 0.35, opt.t1 + 0.15)));
      p = still;
      JOINTS.forEach(j => { p[j] = mixArm(still[j], step[j], w); });
    } else if (mode === 'up') {
      p = base(opt.x, opt.z, opt.ry, 'stand');
      arms(p, ARMS.down, ARMS.relax);
      p.neck = [-0.45, 0, 0];
    } else {
      p = base(opt.x, opt.z, opt.ry || 0, 'restL');
      const sw = S(PI * beatAt(t) * 0.5);
      setArm(p, 'L', mixArm(ARMS.open, ARMS.palms, 0.5 + 0.5 * sw));
      setArm(p, 'R', mixArm(ARMS.palms, ARMS.open, 0.5 + 0.5 * sw));
      p.spine = [(opt.lean || 0.08) + 0.03 * e * (bob(t) - 0.5), 0.08 * sw, 0];
    }
    if (!p.neck || (p.neck[0] === 0 && p.neck[1] === 0)) p.neck = [0.04 * S(t * 0.9), 0.08 * S(t * 0.5), 0.04 * S(PI * beatAt(t))];
    return finish('singer', 'rsSingerLab', p, t, 'singer', 'calm');
  }

  const keyCache = {};
  function keyChain(form, side, cx, y, z) {
    const key = form + side + cx + ':' + y + ':' + z;
    if (!keyCache[key]) {
      const press = [], lift = [];
      [-0.1, -0.05, 0, 0.05, 0.1].forEach((dx, i) => {
        press.push(GK.ik(form, side, [cx + dx, y, z], press[i - 1]));
        lift.push(GK.ik(form, side, [cx + dx, y + 0.045, z - 0.01], press[i]));
      });
      keyCache[key] = { press, lift };
    }
    return keyCache[key];
  }

  function playKeys(p, form, t, spec, phase) {
    ['L', 'R'].forEach((side, si) => {
      const k = side === 'L' ? 1 : -1;
      const ch = keyChain(form, side, k * spec.cx, spec.y, spec.z);
      const u = clamp(2 + 1.7 * S(t * 0.83 + phase + si * 2.1), 0, 3.999);
      const i = Math.floor(u), f = u - i;
      const press = mixArm(ch.press[i], ch.press[i + 1], f);
      const lift = mixArm(ch.lift[i], ch.lift[i + 1], f);
      const hit = 0.5 + 0.5 * C(2 * PI * (beatAt(t) * (side === 'L' ? 1 : 2) + si * 0.25));
      setArm(p, side, mixArm(press, lift, 1 - hit));
    });
    return p;
  }

  const KEY_SPEC = { cx: 0.14, y: 0.0, z: 0.27 };

  function keyboardistAt(t, form, spot, extra) {
    const p = base(spot.x, spot.z, spot.ry, 'apart');
    p.spine = [0.14, 0, 0];
    playKeys(p, form, t, KEY_SPEC, spot.phase || 0);
    const e = energyAt(t);
    p.spine[0] += 0.03 * e * (bob(t) - 0.5);
    p.spine[2] = 0.025 * S(PI * beatAt(t) * 0.5);
    p.neck = [0.22 + 0.06 * e * (bob(t, 0.12) - 0.5), (extra && extra.turn) || 0.05 * S(t * 0.4), 0.04 * S(PI * beatAt(t))];
    p.knL[0] += 0.06 * e * bob(t);
    p.knR[0] += 0.06 * e * bob(t);
    return p;
  }

  function keyboardPlacement(form, spot) {
    const p = base(spot.x, spot.z, spot.ry, 'apart');
    p.spine = [0.14, 0, 0];
    const m = Cast.solve(form, p);
    return M4.chain(m.torso, M4.translate(0, KEY_SPEC.y - 0.05, KEY_SPEC.z + 0.03), M4.rotX(-0.14));
  }

  function silverAt(t, mode, o) {
    const opt = o || {};
    let p;
    const e = energyAt(t);
    if (mode === 'tube') {
      p = base(TUBE.x, TUBE.z, opt.ry || 0.15, 'together');
      p.ground = false;
      p.y = TUBE.base + (opt.y || 0);
      const chest = reachLocal('rsSilver', 'R', [0.02, 0.27, 0.15]);
      setArm(p, 'R', chest);
      setArm(p, 'L', ARMS.down);
      p.neck = [0.05 * S(t * 0.8), 0.15 * S(t * 0.45), 0.08];
      p.spine = [0, 0.06 * S(t * 0.6), 0];
    } else if (mode === 'touch') {
      p = base(TUBE.x, TUBE.z, opt.ry || 0.15, 'restL');
      p.ground = false;
      p.y = TUBE.base;
      setArm(p, 'R', [1.45, 0.25, 0.25, 0.35]);
      setArm(p, 'L', reachLocal('rsSilver', 'L', [0.04, 0.28, 0.15]));
      p.neck = [-0.05, 0.1, -0.1];
    } else if (mode === 'float') {
      p = base(opt.x === undefined ? TUBE.x : opt.x, opt.z === undefined ? TUBE.z : opt.z, opt.ry || 0, 'float');
      p.ground = false;
      p.y = opt.y;
      const k = opt.open === undefined ? 1 : opt.open;
      setArm(p, 'L', mixArm(ARMS.down, ARMS.float, k));
      setArm(p, 'R', mixArm(ARMS.down, ARMS.float, k));
      p.shL[2] += 0.08 * S(t * 2.0);
      p.shR[2] += 0.08 * S(t * 2.0 + 0.6);
      p.neck = [-0.25 * k, 0, 0];
    } else if (mode === 'dance') {
      p = base(opt.x, opt.z, opt.ry || 0, 'dance');
      const b = beatAt(t);
      const step = Math.floor(b / 4);
      const ph = frac(b / 4);
      const moves = [['vUp', 'vUp'], ['wave', 'low'], ['bentUp', 'bentUp'], ['low', 'wave'], ['side2', 'side2'], ['vUp', 'bentUp']];
      const cur = moves[((step % moves.length) + moves.length) % moves.length];
      const nxt = moves[(((step + 1) % moves.length) + moves.length) % moves.length];
      const w = smooth(span(ph, 0.82, 1));
      setArm(p, 'L', mixArm(ARMS[cur[0]], ARMS[nxt[0]], w));
      setArm(p, 'R', mixArm(ARMS[cur[1]], ARMS[nxt[1]], w));
      const sw = S(PI * b);
      p.shL[2] += 0.12 * sw;
      p.shR[2] -= 0.12 * sw;
      p.spine = [-0.06, 0.18 * sw, 0.1 * sw];
      p.neck = [-0.12, 0.2 * S(PI * b * 0.5), -0.1 * sw];
      p.knL[0] += 0.18 * e * bob(t);
      p.knR[0] += 0.12 * e * bob(t, 0.3);
      p.ry = (opt.ry || 0) + (opt.spin ? opt.spin(t) : 0.25 * S(PI * b * 0.25));
    } else {
      p = base(opt.x, opt.z, opt.ry || 0, 'together');
      arms(p, ARMS.down, ARMS.down);
      p.neck = [0.05, 0.1 * S(t * 0.5), 0.05];
    }
    return finish('silver', 'rsSilver', p, t, 'silver', 'calm');
  }

  function twinAt(t, idx, mode, o) {
    const opt = o || {};
    const s = idx ? -1 : 1;
    const p = base(opt.x, opt.z, opt.ry || 0, idx ? 'restR' : 'restL');
    const sw = S(PI * beatAt(t) * 0.5 + idx * 0.4);
    if (mode === 'pose') {
      const hip = reachLocal('rsTwin', 'L', [0.15, 0.03, 0.02]);
      setArm(p, idx ? 'R' : 'L', hip);
      setArm(p, idx ? 'L' : 'R', ARMS.relax);
      p.spine = [0.05, 0.1 * s, 0.14 * s + 0.03 * sw];
      p.neck = [0.05, -0.2 * s, -0.12 * s];
    } else {
      arms(p, ARMS.down, ARMS.down);
      p.spine = [0.08, 0.05 * s, 0.05 * s + 0.04 * sw];
      p.neck = [0.0, 0.18 * s + 0.08 * sw, 0.15 * s];
    }
    return finish(idx ? 'twin2' : 'twin1', 'rsTwin', p, t, 'twin', 'calm');
  }

  function singerBass(t, spot) {
    const p = base(spot.x, spot.z, spot.ry || 0, 'apart');
    const b = beatAt(t);
    const prop = GK.play(p, 'rsSingerStudio', 'rsBass', { strum: 0.5 + 0.5 * S(2 * PI * b), fret: 0.35 + 0.25 * S(PI * b / 4), range: 0.9 });
    const e = energyAt(t);
    p.spine = [0.08 + 0.04 * e * (bob(t) - 0.5), (spot.twist || 0) + 0.06 * S(PI * b * 0.5), 0];
    p.neck = [0.1 + 0.08 * e * (bob(t, 0.15) - 0.5), (spot.turn || 0) + 0.12 * S(t * 0.6), 0.05 * S(PI * b)];
    p.knL[0] += 0.12 * e * bob(t);
    p.knR[0] += 0.12 * e * bob(t);
    return finish('singer', 'rsSingerStudio', p, t, 'singer', 'calm', [prop]);
  }

  const STUDIO = {
    keys: { x: -1.45, z: -10.55, ry: 0.15, phase: 0 },
    singer: { x: 0.1, z: -9.95, ry: -0.2 },
    synth: { x: 1.75, z: -12.55, ry: -0.1, phase: 1.3 },
    silver: { x: 2.95, z: -10.15, ry: -0.45 }
  };
  const WHITE_KEYS = { x: 0, z: -0.42, ry: 0, phase: 0.6 };
  const LAB_KEYS = { x: LAB_PIANO.x + S(LAB_PIANO.ry) * 0.62, z: LAB_PIANO.z + C(LAB_PIANO.ry) * 0.62, ry: LAB_PIANO.ry + PI, phase: 2.2 };

  function studioBand(t, opts) {
    const o = opts || {};
    const cast = [];
    cast.push(finish('keys', 'rsKeysSilver', keyboardistAt(t, 'rsKeysSilver', STUDIO.keys, o.keysTurn ? { turn: o.keysTurn } : null), t, 'keys', 'calm'));
    cast.push(singerBass(t, Object.assign({}, STUDIO.singer, o.singer || {})));
    cast.push(finish('synth', 'rsSynth', keyboardistAt(t, 'rsSynth', STUDIO.synth), t, 'synth', 'calm'));
    cast.push(silverAt(t, 'dance', Object.assign({}, STUDIO.silver, o.silver || {})));
    return cast;
  }

  const roll = (eye, at, r) => {
    if (!r) return [0, 1, 0];
    const f = V3.norm(V3.sub(at, eye));
    let rt = V3.cross(f, [0, 1, 0]);
    if (V3.len(rt) < 1e-4) rt = [1, 0, 0];
    rt = V3.norm(rt);
    const up = V3.cross(rt, f);
    return V3.norm(addV(V3.mul(up, C(r)), V3.mul(rt, S(r))));
  };
  const view = (eye, at, fov, extra) => Object.assign({ eye, at, fov: fov || 40 }, extra || {});
  const drift = (a, b, u) => mixV(a, b, smooth(u));
  const path3 = (pts, u) => {
    const n = pts.length - 1;
    const f = clamp(u, 0, 1) * n;
    const i = Math.min(n - 1, Math.floor(f));
    return mixV(pts[i], pts[i + 1], smooth(f - i));
  };
  const headOf = (a, o) => addV(a.head, o || [0, 0, 0]);

  const GIRL_STAND = { x: 0.45, z: 0.3, ry: 0.15 };

  function nightCast(t, girlMode, extra) {
    const cast = [];
    if (girlMode === 'kneel') cast.push(girlAt(t, 'kneel'));
    else if (girlMode === 'stand') cast.push(girlAt(t, 'stand', GIRL_STAND));
    else if (girlMode === 'rise') cast.push(blendActor(girlAt(t, 'kneel'), girlAt(t, 'stand', GIRL_STAND), smooth(span(t, 50.25, 51.05))));
    if (extra === 'silver') cast.push(silverAt(t, 'stand', { x: GIRL_STAND.x, z: GIRL_STAND.z, ry: GIRL_STAND.ry }));
    return cast.map(solveActor);
  }

  const night = (o) => Object.assign({ light: 'night', radio: true, streaks: 1, moon: 1 }, o || {});

  const WORLDS = {
    moonRise(t, u) {
      const k = smooth(span(t, 6.5, 18.4)), tilt = smooth(span(t, 2.8, 6.5));
      return view(mixV([0, 1.25, 3.0], [0, 1.0, 4.6], k), mixV(mixV([0, 6.9, -28], [0, 4.4, -28], tilt), [0, 1.9, -24], k), lerp(lerp(15, 22, tilt), 31, k), night({
        cast: nightCast(t, 'kneel'), moon: smooth(span(t, 0.2, 3.2)), moonGrow: lerp(0.45, 1, smooth(span(t, 0.2, 3.4))),
        girlLight: smooth(span(t, 14.2, 18.2)) * 0.7, streaks: smooth(span(t, 4.4, 6.5)),
        puffs: [{ t0: 7.76, at: [1.3, 8.2, -27.4], size: 5.2, drift: [0.9, 0.45, 0], life: 4.2, n: 9 }]
      }));
    },
    radio(t, u) {
      const k = smooth(span(t, 25.4, 29.4));
      return view(mixV([-0.62, 0.72, 1.85], [-0.4, 0.95, 3.9], k), mixV([0.12, 0.42, 0], [0.1, 1.55, -10], k), lerp(42, 36, k), night({
        cast: nightCast(t, 'kneel'), girlLight: 1, poster: { mode: 'left', alpha: smooth(span(t, 18.6, 19.4)) * (1 - smooth(span(t, 29.2, 29.64))) }
      }));
    },
    glow1(t, u) {
      return view(drift([-0.2, 0.56, 1.95], [-0.12, 0.55, 1.85], u), [0.3, 0.4, 0.05], 42, night({
        cast: nightCast(t, 'kneel'), girlLight: 1, glow: smooth(span(t, 29.64, 30.0)) * (1 - smooth(span(t, 30.9, 31.4))), streaks: 0.6
      }));
    },
    moonRight(t, u) {
      return view(drift([0.1, 1.0, 4.7], [0.05, 1.0, 4.4], u), [-0.35, 1.9, -10], 33, night({
        cast: nightCast(t, 'kneel'), girlLight: 1,
        poster: { mode: 'right', alpha: smooth(span(t, 38.0, 38.9)) * (1 - smooth(span(t, 43.7, 44.3))) },
        glow: smooth(span(t, 44.2, 44.6)) * (1 - smooth(span(t, 45.4, 45.8))), dim: smooth(span(t, 45.6, 46.05))
      }));
    },
    glow2(t, u) {
      return view(drift([-0.05, 0.5, 1.6], [0.0, 0.48, 1.5], u), [0.34, 0.36, 0.05], 44, night({
        cast: nightCast(t, 'kneel'), girlLight: 1, glow: smooth(span(t, 47.96, 48.2)) * (1 - smooth(span(t, 49.4, 49.72))), streaks: 0.5
      }));
    },
    duet1(t, u) {
      return view([0.1, 1.0, 5.6], [0.15, 1.95, -10], 31, night({
        cast: nightCast(t, 'rise'), girlLight: 1, poster: { mode: 'duet', alpha: smooth(span(t, 49.72, 50.0)) }
      }));
    },
    sparkle1(t, u) {
      return view(drift([-0.25, 0.85, 3.0], [-0.2, 0.86, 2.75], u), [0.3, 1.05, -6], 38, night({
        cast: nightCast(t, 'stand'), girlLight: 1, sparkle: 1,
        puffs: [{ t0: 51.84, at: [-0.4, 0.5, -0.6], size: 1.2, drift: [-0.3, 0.25, 0], life: 3, n: 5 }]
      }));
    },
    boom1(t, u) {
      return view(drift([0.05, 0.5, 1.75], [0.05, 0.55, 2.1], u), [0, 0.42, 0], 46, night({
        cast: nightCast(t, 'none'), radio: false, boom: { t0: 53.4, at: [0, 0.32, 0.05] }, streaks: 0.4
      }));
    },
    sparkle2(t, u) {
      return view(drift([0.15, 0.9, 2.6], [0.12, 0.92, 2.45], u), [0.4, 1.05, -6], 36, night({
        cast: nightCast(t, 'stand'), girlLight: 1, radio: false, debris: true, sparkle: 1,
        puffs: [{ t0: 55.0, at: [-0.5, 0.35, 0.1], size: 1.0, drift: [-0.2, 0.3, 0], life: 4, n: 6 }]
      }));
    },
    sparkle3(t, u) {
      return view(drift([0.3, 0.95, 2.05], [0.32, 0.95, 1.9], u), [0.42, 0.95, -6], 34, night({
        cast: nightCast(t, 'stand'), girlLight: 1, radio: false, debris: true, sparkle: 1,
        burst: smooth(span(t, 57.0, 57.15)) * (1 - smooth(span(t, 57.3, 58.0)))
      }));
    },
    duet2(t, u) {
      return view([0.38, 1.0, 4.45], [-0.6 - 0.8 * smooth(span(t, 61.8, 63.3)), 1.75 + 0.2 * smooth(span(t, 61.8, 63.3)), -10], 30, night({
        cast: nightCast(t, 'stand'), girlLight: 1, radio: false, debris: true, poster: { mode: 'duet', alpha: smooth(span(t, 59.6, 60.1)) * (1 - smooth(span(t, 61.9, 62.9))) }
      }));
    },
    future(t, u) {
      return view([0.38, 1.0, 4.45], [-1.4, 1.95, -10], 30, night({
        cast: nightCast(t, 'none', 'silver'), girlLight: 1, radio: false, debris: true
      }));
    },
    face1(t, u) {
      return view(drift([0, 1.6, 0.86], [0, 1.6, 0.72], u), [0, 1.57, 0], 34, { light: 'poster', cast: [solveActor(singerPoster(t, true))] });
    },
    face2(t, u) {
      return view(drift([0.04, 1.6, 0.74], [0.02, 1.6, 0.8], u), [0, 1.57, 0], 34, { light: 'poster', cast: [solveActor(singerPoster(t, true))] });
    },
    keysTilt(t, u) {
      const a = solveActor(finish('keys', 'rsKeysSilver', keyboardistAt(t, 'rsKeysSilver', WHITE_KEYS), t, 'keys', 'calm'));
      const eye = drift([1.05, 0.95, 0.75], [0.95, 0.98, 0.7], u), at = [0, 1.2, -0.35];
      return view(eye, at, 46, { light: 'white', cast: [a], upv: roll(eye, at, 0.32), rig: 'white' });
    },
    keysHands(t, u) {
      const a = solveActor(finish('keys', 'rsKeysSilver', keyboardistAt(t, 'rsKeysSilver', WHITE_KEYS), t, 'keys', 'calm'));
      const eye = drift([0.62, 1.12, 0.45], [0.55, 1.1, 0.42], u), at = [0.02, 0.92, -0.12];
      return view(eye, at, 50, { light: 'white', cast: [a], upv: roll(eye, at, -0.25), rig: 'white' });
    },
    keysLean(t, u) {
      const a = solveActor(finish('keys', 'rsKeysSilver', keyboardistAt(t, 'rsKeysSilver', WHITE_KEYS), t, 'keys', 'calm'));
      const eye = drift([1.35, 0.55, 1.35], [1.25, 0.58, 1.25], u), at = [0, 1.05, -0.3];
      return view(eye, at, 52, { light: 'white', cast: [a], upv: roll(eye, at, 0.14), rig: 'white' });
    },
    keysSynths(t, u) {
      const a = solveActor(finish('keys', 'rsKeysSilver', keyboardistAt(t, 'rsKeysSilver', WHITE_KEYS, { turn: 0.4 * S(t * 1.4) }), t, 'keys', 'calm'));
      const eye = drift([-0.35, 1.25, 2.2], [-0.25, 1.22, 2.0], u), at = [0, 1.0, -0.3];
      return view(eye, at, 46, { light: 'white', cast: [a], rig: 'white' });
    },
    keysHands2(t, u) {
      const a = solveActor(finish('keys', 'rsKeysSilver', keyboardistAt(t, 'rsKeysSilver', WHITE_KEYS), t, 'keys', 'calm'));
      const eye = drift([0.55, 1.42, 0.62], [0.45, 1.38, 0.55], u), at = [0.05, 0.9, -0.12];
      return view(eye, at, 46, { light: 'white', cast: [a], upv: roll(eye, at, 0.12), rig: 'white' });
    },
    reels(t, u) {
      const s = solveActor(singerLab(t, 'lean'));
      const k = smooth(span(t, 69.3, 70.9));
      const eye = mixV([2.78, 1.36, -2.55], [2.95, 1.55, -1.45], k), at = mixV([2.7, 1.32, -3.4], headOf(s, [-0.1, -0.12, 0]), k);
      return view(eye, at, lerp(40, 46, k), { light: 'lab', cast: [s, labKeys(t)].map(solveActor), iris: span(t, 66.3, 67.05) });
    },
    pianoLab(t, u) {
      const k = solveActor(labKeys(t, -0.45));
      const ry = LAB_KEYS.ry;
      const fwd = [S(ry), 0, C(ry)], right = [-C(ry), 0, S(ry)];
      const eye = addV(k.head, [fwd[0] * 0.4 + right[0] * lerp(0.95, 0.88, u), -0.12, fwd[2] * 0.4 + right[2] * lerp(0.95, 0.88, u)]);
      return view(eye, addV(k.head, [fwd[0] * 0.18, -0.16, fwd[2] * 0.18]), 46, { light: 'lab', cast: [k] });
    },
    walkTube(t, u) {
      const s = solveActor(singerLab(t, 'walk', { t0: 73.5, t1: 77.0, from: [0.62, -2.15], to: [0.42, -0.62], ry: 0.05 }));
      const w = solveActor(silverAt(t, 'tube', { y: lerp(2.8, 0, smooth(span(t, 74.0, 76.3))) }));
      const k = smooth(span(t, 76.0, 77.7));
      const at = mixV(headOf(s, [0, -0.15, 0]), [TUBE.x, 1.45, TUBE.z], k);
      return view(drift([0.15, 1.5, 1.45], [0.4, 1.5, 1.05], span(t, 73.4, 77.88)), at, 46, { light: 'lab', cast: [s, w, solveActor(labKeys(t))] });
    },
    tubeClose1(t, u) {
      const w = solveActor(silverAt(t, 'tube'));
      return view(drift([TUBE.x + 0.12, 1.62, TUBE.z + 1.12], [TUBE.x + 0.08, 1.6, TUBE.z + 1.02], u), headOf(w, [0, -0.2, 0]), 36, { light: 'lab', cast: [w] });
    },
    twoShot(t, u) {
      const s = solveActor(singerLab(t, 'sing', { x: 0.62, z: -1.75, ry: 0.32 }));
      const w = solveActor(silverAt(t, 'tube'));
      return view(drift([0.9, 1.5, 0.35], [0.95, 1.5, 0.25], u), [1.15, 1.42, -2.1], 42, { light: 'lab', cast: [s, w] });
    },
    tubeClose2(t, u) {
      const w = solveActor(silverAt(t, 'touch'));
      return view(drift([TUBE.x - 0.05, 1.62, TUBE.z + 1.0], [TUBE.x, 1.6, TUBE.z + 0.95], u), headOf(w, [0, -0.15, 0.1]), 36, { light: 'lab', cast: [w] });
    },
    singerTv(t, u) {
      const s = solveActor(singerLab(t, 'sing', { x: 0.55, z: -1.2, ry: 0.12, lean: 0.12 }));
      const w = solveActor(silverAt(t, 'tube'));
      const k = smooth(span(t, 84.9, 86.2));
      const at = mixV(headOf(s, [0, -0.12, 0]), [LAB_TV.x, 1.15, LAB_TV.z], k);
      return view(mixV([0.62, 1.55, 0.25], [-0.6, 1.4, -0.6], k), at, 46, { light: 'lab', cast: [s, w, solveActor(labKeys(t))], tv: 'twins' });
    },
    tvTwins1(t, u) {
      return view(drift([LAB_TV.x + 0.28, 1.12, LAB_TV.z + 0.92], [LAB_TV.x + 0.2, 1.12, LAB_TV.z + 0.8], u), [LAB_TV.x, 1.08, LAB_TV.z], 40, { light: 'lab', cast: [solveActor(labKeys(t))], tv: 'twins' });
    },
    tvTwins2(t, u) {
      const k = smooth(span(t, 90.3, 91.2));
      const kb = solveActor(labKeys(t));
      const eye = mixV([LAB_TV.x + 0.15, 1.15, LAB_TV.z + 0.85], [LAB_TV.x - 0.35, 1.3, LAB_TV.z + 1.25], k);
      const at = mixV([LAB_TV.x, 1.08, LAB_TV.z], keysPoint(), k);
      return view(eye, at, 42, { light: 'lab', cast: [kb], tv: 'twins', upv: roll(eye, at, 0.22 * (1 - k)) });
    },
    singerClose(t, u) {
      const s = solveActor(singerLab(t, 'sing', { x: 0.68, z: -1.25, ry: lerp(0.05, 0.35, smooth(span(t, 95.3, 96.2))), lean: 0.22 }));
      const w = solveActor(silverAt(t, 'tube'));
      const g = solveActor(girlAt(t, 'look', { x: 1.0, z: -1.55, ry: 2.4 }));
      const k1 = smooth(span(t, 95.3, 96.3)), k2 = smooth(span(t, 99.3, 101.4));
      const eye = path3([[0.78, 1.58, -0.62], [0.95, 1.55, -0.45], [1.3, 1.5, -0.2]], (k1 + k2) / 2);
      const at = mixV(mixV(headOf(s, [0, -0.04, 0]), [1.0, 1.45, -2.0], k1), [TUBE.x, 1.5, TUBE.z], k2);
      return view(eye, at, 58, { light: 'lab', cast: [s, w, g, solveActor(labKeys(t))] });
    },
    rise(t, u) {
      const s = solveActor(singerLab(t, 'up', { x: 0.95, z: -1.75, ry: 0.7 }));
      const g = solveActor(girlAt(t, 'reach', { x: 1.18, z: -1.95, ry: 2.5 }));
      const w = solveActor(silverAt(t, 'float', { y: TUBE.base + 2.0 * smooth(span(t, 101.55, 102.95)), open: 0 }));
      return view(drift([0.05, 1.45, 1.5], [0.12, 1.45, 1.35], u), [1.25, 1.55, -2.2], 50, { light: 'lab', cast: [s, g, w] });
    },
    tvTwins3(t, u) {
      return view(drift([LAB_TV.x + 0.35, 1.2, LAB_TV.z + 1.1], [LAB_TV.x + 0.18, 1.13, LAB_TV.z + 0.75], u), [LAB_TV.x - 0.05, 1.08, LAB_TV.z], 42, { light: 'lab', cast: [solveActor(labKeys(t))], tv: 'twins' });
    },
    girlTube(t, u) {
      const g = solveActor(girlAt(t, 'reach', { x: 1.18, z: -1.95, ry: 2.5 }));
      const w = solveActor(silverAt(t, 'tube'));
      return view(drift([0.35, 1.0, -0.95], [0.42, 1.02, -1.0], u), [1.4, 1.35, -2.35], 46, { light: 'lab', cast: [g, w] });
    },
    girlFace(t, u) {
      const g = solveActor(girlAt(t, 'look', { x: 1.18, z: -1.95, ry: 2.5 }));
      const fwd = [S(2.5), 0, C(2.5)], right = [-C(2.5), 0, S(2.5)];
      return view(addV(g.head, [fwd[0] * 0.42 + right[0] * 0.22, -0.1, fwd[2] * 0.42 + right[2] * 0.22]), headOf(g, [0, 0.0, 0]), 36, { light: 'lab', cast: [g, solveActor(silverAt(t, 'tube'))] });
    },
    pianoTv(t, u) {
      const kb = solveActor(labKeys(t));
      const k = smooth(span(t, 108.4, 109.0)) * (1 - smooth(span(t, 110.3, 110.9)));
      const hands = keysPoint();
      const eye = mixV([hands[0] + 0.35, hands[1] + 0.35, hands[2] + 0.4], [LAB_TV.x + 0.25, 1.18, LAB_TV.z + 0.8], k);
      const at = mixV(hands, [LAB_TV.x, 1.08, LAB_TV.z], k);
      return view(eye, at, 44, { light: 'lab', cast: [kb], tv: 'wheel' });
    },
    tubeUp(t, u) {
      const w = solveActor(silverAt(t, 'tube'));
      return view([TUBE.x + 0.08, 0.32, TUBE.z + 0.36], [TUBE.x, 3.2, TUBE.z - 0.1], 72, { light: 'purple', cast: [w], upv: [0, 0, -1] });
    },
    tubeStand(t, u) {
      const w = solveActor(silverAt(t, 'tube'));
      const g = solveActor(girlAt(t, 'look', { x: 1.02, z: -1.6, ry: 2.55 }));
      return view(drift([1.05, 1.25, -0.42], [1.12, 1.25, -0.5], u), [TUBE.x, 1.3, TUBE.z], 46, { light: 'lab', cast: [w, g, solveActor(labKeys(t))] });
    },
    flyUp(t, u) {
      const s = solveActor(singerLab(t, 'up', { x: 0.45, z: -1.55, ry: 0.85 }));
      const y = TUBE.base + 0.2 * smooth(span(t, 160.0, 160.6)) + 3.0 * smooth(span(t, 161.0, 163.28));
      const w = solveActor(silverAt(t, 'float', { y: TUBE.h - 1.0 + y, open: 1 }));
      return view(drift([-0.2, 3.5, 2.5], [-0.25, 3.55, 2.4], u), [0.9, 2.3, -3.5], 58, { light: 'lab', cast: [s, w] });
    },
    breach(t, u) {
      const k = smooth(span(t, 163.3, 165.9));
      return view(mixV([0.1, 1.6, 1.6], [0.15, 1.62, -3.0], k), [0.25, 1.5, -10.5], 52, { light: 'lab', area: 'breach', cast: studioBand(t).map(solveActor), pinkBeyond: 1 - smooth(span(t, 165.2, 166.2)) });
    },
    enter(t, u) {
      const k = smooth(span(t, 165.6, 170.16));
      return view(mixV([0.15, 1.62, -3.9], [0.55, 1.75, -6.2], k), [0.35, 1.35, -11], 54, { light: 'studio', cast: studioBand(t).map(solveActor), pinkBeyond: 1 - smooth(span(t, 165.2, 166.4)) });
    },
    whip(t, u) {
      const band = studioBand(t).map(solveActor);
      const w = band.find(a => a.id === 'silver'), sy = band.find(a => a.id === 'synth');
      const k = smooth(span(t, 170.62, 170.98));
      const eye = mixV(addV(w.head, [-0.55, -0.05, 0.6]), [0.85, 1.65, -10.3], smooth(span(t, 170.62, 174.16)));
      const at = mixV(headOf(w, [0, -0.08, 0]), headOf(sy, [0, -0.25, 0]), k);
      return view(eye, at, 48, { light: 'studio', cast: band });
    },
    bassBack(t, u) {
      const band = studioBand(t, { singer: { ry: PI - 0.5, turn: 0.2 } }).map(solveActor);
      return view(drift([0.65, 1.55, -8.75], [0.55, 1.55, -8.9], u), [-1.0, 1.25, -10.6], 50, { light: 'studio', cast: band });
    },
    synthClose(t, u) {
      const band = studioBand(t).map(solveActor);
      const sy = band.find(a => a.id === 'synth');
      return view(drift(addV(sy.head, [-0.2, 0.05, 0.75]), addV(sy.head, [-0.15, 0.04, 0.68]), u), headOf(sy, [0, -0.12, 0]), 44, { light: 'studio', cast: band });
    },
    synthPull(t, u) {
      const band = studioBand(t).map(solveActor);
      const sy = band.find(a => a.id === 'synth');
      return view(drift(addV(sy.head, [-0.3, 0.15, 1.6]), addV(sy.head, [-0.35, 0.2, 1.75]), u), headOf(sy, [0, -0.35, 0]), 48, { light: 'studio', cast: band });
    },
    keysClose(t, u) {
      const band = studioBand(t).map(solveActor);
      const kb = band.find(a => a.id === 'keys');
      return view(drift(addV(kb.head, [0.45, 0.02, 0.62]), addV(kb.head, [0.38, 0.0, 0.58]), u), headOf(kb, [0, -0.2, 0]), 50, { light: 'studio', cast: band });
    },
    bandWide(t, u) {
      return view(drift([0.4, 1.45, -5.6], [0.35, 1.45, -5.8], u), [0.7, 1.15, -11], 54, { light: 'studio', cast: studioBand(t).map(solveActor) });
    },
    danceLong(t, u) {
      const band = studioBand(t, { singer: { ry: lerp(-0.2, PI - 0.4, smooth(span(t, 186.4, 187.6))) } }).map(solveActor);
      const w = band.find(a => a.id === 'silver'), kb = band.find(a => a.id === 'keys'), s = band.find(a => a.id === 'singer');
      const k1 = smooth(span(t, 185.4, 186.4)), k2 = smooth(span(t, 187.0, 187.9)), k3 = smooth(span(t, 188.6, 190.6));
      const eye = path3([addV(w.head, [-0.6, -0.2, 1.0]), [0.6, 1.5, -8.4], [0.4, 1.5, -8.2], [0.3, 1.5, -5.8]], (k1 + k2 + k3) / 3);
      let at = headOf(w, [0, -0.25, 0]);
      at = mixV(at, headOf(kb, [0, -0.3, 0]), k1);
      at = mixV(at, headOf(s, [0, -0.3, 0]), k2);
      at = mixV(at, [0.6, 1.15, -11], k3);
      return view(eye, at, lerp(46, 54, k3), { light: 'studio', cast: band });
    },
    organBass(t, u) {
      const band = studioBand(t, { singer: { ry: 0.6 } }).map(solveActor);
      const kb = band.find(a => a.id === 'keys');
      return view(drift([-0.45, 1.25, -9.25], [-0.5, 1.22, -9.35], u), headOf(kb, [0, -0.45, 0]), 52, { light: 'studio', cast: band });
    },
    finale(t, u) {
      return view(drift([0.3, 1.5, -5.4], [0.3, 1.5, -6.0], span(t, 193.36, 199)), [0.65, 1.2, -11], 52, { light: 'studio', cast: studioBand(t).map(solveActor) });
    },
    climb(t, u) {
      const k = span(t, 117.44, 119.6);
      const climbing = girlAt(t, 'climb', { x: lerp(-0.85, -0.2, smooth(k)), z: lerp(0.65, 0.05, smooth(k)), ry: 0.6, y: 1.42 * smooth(k) });
      const perched = girlAt(t, 'perch', { x: -0.2, z: 0.05, ry: 0.6 - 0.9 * smooth(span(t, 120, 123)), y: 1.42 });
      const a = solveActor(blendActor(climbing, perched, smooth(span(t, 119.3, 119.95))));
      return view(drift([2.3, 1.35, 3.3], [1.9, 1.7, 3.0], span(t, 117.44, 123.28)), mixV([0, 0.95, 0], addV(a.hips, [0, 0.05, 0]), 0.45), 44, { light: 'pile', cast: [a] });
    },
    shatter(t, u) {
      const a = solveActor(girlAt(t, 'perch', { x: -0.2, z: 0.05, ry: -0.3, y: 1.42 }));
      return view(drift([0.2, 1.7, 3.0], [0.15, 1.75, 3.3], u), [0, 1.35, 0], 46, { light: 'pile', cast: [a], sky: true, shatter: span(t, 123.3, 125.1) });
    },
    boom2(t, u) {
      return view([0, 0.9, 2.6], [0, 0.85, 0], 46, { light: 'pile', cast: [], sky: false, pileGone: true, boom: { t0: 125.24, at: [0, 0.9, 0] } });
    },
    twinsClose(t, u) {
      const c = [twinAt(t, 0, 'sing', { x: -0.17, z: 0, ry: 0.35 }), twinAt(t, 1, 'sing', { x: 0.2, z: 0.12, ry: -0.3 })].map(solveActor);
      const eye = drift([0.12, 1.55, 0.72], [0.08, 1.53, 0.68], u), at = [0.02, 1.5, 0];
      return view(eye, at, 42, { light: 'pink', cast: c, upv: roll(eye, at, 0.14) });
    },
    twinsFull(t, u) {
      const c = [twinAt(t, 0, 'pose', { x: -0.3, z: 0, ry: 0.25 }), twinAt(t, 1, 'pose', { x: 0.32, z: -0.15, ry: -0.2 })].map(solveActor);
      const eye = drift([0.05, 1.05, 3.1], [0.0, 1.05, 2.95], u), at = [0, 0.95, 0];
      return view(eye, at, 40, { light: 'pink', cast: c, upv: roll(eye, at, -0.12) });
    },
    tvWall1(t, u) {
      return view(drift([0.1, 1.5, 2.4], [0.0, 1.3, 2.3], u), drift([0.1, 1.55, -1.2], [0.0, 0.9, -1.1], u), 46, { light: 'tvpile', cast: [], tvs: true });
    },
    tvWall2(t, u) {
      return view(drift([-0.2, 0.95, 1.85], [-0.1, 0.9, 1.75], u), [0.0, 0.55, -0.4], 46, { light: 'tvpile', cast: [], tvs: true });
    },
    tvRow(t, u) {
      return view(drift([0.4, 0.78, 1.7], [0.3, 0.75, 1.6], u), [0.25, 0.42, 0], 46, { light: 'tvpile', cast: [], tvs: true });
    },
    tvSilver(t, u) {
      const T = TVS[2];
      return view(drift([T.x + 0.05, T.y + 0.12, T.z + 0.82], [T.x + 0.02, T.y + 0.1, T.z + 0.72], u), [T.x, T.y + 0.06, T.z], 40, { light: 'tvpile', cast: [], tvs: true });
    },
    tvKeys(t, u) {
      const T = TVS[0];
      return view(drift([T.x - 0.1, T.y + 0.18, T.z + 0.95], [T.x - 0.05, T.y + 0.15, T.z + 0.85], u), [T.x, T.y + 0.08, T.z], 40, { light: 'tvpile', cast: [], tvs: true });
    },
    tvSinger(t, u) {
      const T = TVS[1];
      return view(drift([T.x + 0.12, T.y + 0.14, T.z + 1.0], [T.x + 0.06, T.y + 0.12, T.z + 0.88], u), [T.x, T.y + 0.08, T.z], 40, { light: 'tvpile', cast: [], tvs: true });
    },
    tvLong(t, u) {
      const T = TVS[1];
      const k = smooth(span(t, 152.6, 159.9));
      const eye = mixV([T.x + 0.1, T.y + 0.13, T.z + 0.95], [T.x + 0.02, T.y + 0.1, T.z + 0.45], k);
      return view(eye, [T.x, T.y + 0.08, T.z], lerp(40, 34, k), {
        light: 'tvpile', cast: [], tvs: true,
        poster: { mode: 'front', alpha: smooth(span(t, 147.8, 149.0)) * (1 - smooth(span(t, 150.9, 152.0))) },
        swap: smooth(span(t, 151.4, 152.5))
      });
    }
  };

  function labKeys(t, turn) {
    return finish('keys', 'rsKeysLab', keyboardistAt(t, 'rsKeysLab', LAB_KEYS, turn ? { turn } : null), t, 'keys', 'calm');
  }

  let KEYS_POINT = null;
  function keysPoint() {
    if (!KEYS_POINT) {
      const M = keyboardPlacement('rsKeysLab', LAB_KEYS);
      KEYS_POINT = M4.point(M, [0, 0.02, 0]);
    }
    return KEYS_POINT;
  }

  const TVS = [
    { x: -0.62, y: 0.3, z: 0.05, ry: 0.28, w: 0.62, h: 0.5, wood: true, feed: 'keys' },
    { x: 0.42, y: 0.26, z: 0.18, ry: -0.18, w: 0.66, h: 0.52, wood: false, feed: 'singer' },
    { x: 1.32, y: 0.36, z: -0.35, ry: -0.42, w: 0.5, h: 0.4, wood: true, feed: 'silver' }
  ];

  function cam(w) {
    return { eye: w.eye, at: w.at, fov: w.fov, up: w.upv || [0, 1, 0], near: 0.03, far: 120 };
  }

  function worldFor(t, shot) {
    const u = span(t, shot.start, shot.end);
    const w = WORLDS[shot.cam](t, u, shot);
    return Object.assign({}, w, { scene: shot.scene, cast: w.cast || [], camera: cam(w) });
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
  const MOON = [0, 7.2, -28];

  function rnd(seed) {
    let s = seed;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  function texGlow(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.3, '#9a9a9a');
    g.addColorStop(0.7, '#202020');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function texSmoke(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const r = rnd(11);
    for (let i = 0; i < 26; i++) {
      const a = r() * PI * 2, d = r() * w * 0.24;
      const x = w / 2 + C(a) * d, y = h / 2 + S(a) * d, rad = w * (0.1 + r() * 0.16);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(255,255,255,0.28)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    const fade = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w / 2);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, w, h);
  }

  function texPuff(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const r = rnd(5);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 14; i++) {
      const a = r() * PI * 2, d = r() * w * 0.2;
      ctx.beginPath();
      ctx.arc(w / 2 + C(a) * d, h / 2 + S(a) * d, w * (0.12 + r() * 0.14), 0, PI * 2);
      ctx.fill();
    }
  }

  function texSpark(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.18);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d8d8ff';
    [[0, 1], [1, 0]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(w / 2 - dx * w * 0.48 - dy * 1.5, h / 2 - dy * h * 0.48 - dx * 1.5);
      ctx.lineTo(w / 2 + dx * w * 0.48 - dy * 1.5, h / 2 + dy * h * 0.48 - dx * 1.5);
      ctx.lineTo(w / 2 + dx * w * 0.48 + dy * 1.5, h / 2 + dy * h * 0.48 + dx * 1.5);
      ctx.lineTo(w / 2 - dx * w * 0.48 + dy * 1.5, h / 2 - dy * h * 0.48 + dx * 1.5);
      ctx.fill();
    });
  }

  function texStreaks(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const r = rnd(23);
    for (let i = 0; i < 70; i++) {
      const y = r() * h, len = w * (0.15 + r() * 0.5), x = r() * w;
      const g = ctx.createLinearGradient(x - len / 2, 0, x + len / 2, 0);
      const c = r() < 0.5 ? '230,220,255' : '255,255,255';
      g.addColorStop(0, `rgba(${c},0)`);
      g.addColorStop(0.5, `rgba(${c},${0.35 + r() * 0.6})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - len / 2, y);
      for (let k = 0; k <= 8; k++) ctx.lineTo(x - len / 2 + (len * k) / 8, y + S(k * 1.7 + i) * 1.6);
      for (let k = 8; k >= 0; k--) ctx.lineTo(x - len / 2 + (len * k) / 8, y + 1.2 + r() * 2 + S(k * 1.7 + i) * 1.6);
      ctx.fill();
    }
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.abs(x - w / 2) / (w / 2)})`;
      ctx.fillRect(x, 0, 1, h);
    }
  }

  function texDial(ctx, w, h) {
    ctx.fillStyle = '#f0c848';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#5a3a10';
    for (let i = 0; i < 26; i++) ctx.fillRect(8 + i * ((w - 16) / 25), h * 0.3, 1.5, i % 5 ? h * 0.2 : h * 0.34);
    ctx.fillRect(6, h * 0.66, w - 12, 2);
    ctx.fillStyle = '#c02010';
    ctx.fillRect(w * 0.42, h * 0.16, 3, h * 0.7);
  }

  function radioArt(ctx, x, y, w, h, kind, pal) {
    const line = Math.max(2, w * 0.03);
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = line;
    ctx.strokeStyle = '#141418';
    const rr = (x0, y0, ww, hh, r, fill) => {
      ctx.beginPath();
      ctx.moveTo(x0 + r, y0);
      ctx.arcTo(x0 + ww, y0, x0 + ww, y0 + hh, r);
      ctx.arcTo(x0 + ww, y0 + hh, x0, y0 + hh, r);
      ctx.arcTo(x0, y0 + hh, x0, y0, r);
      ctx.arcTo(x0, y0, x0 + ww, y0, r);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();
    };
    if (kind === 0) {
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.95);
      ctx.lineTo(w * 0.08, h * 0.45);
      ctx.arc(w * 0.5, h * 0.45, w * 0.42, PI, 0);
      ctx.lineTo(w * 0.92, h * 0.95);
      ctx.closePath();
      ctx.fillStyle = pal[0];
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.48, w * 0.28, PI, 0);
      ctx.lineTo(w * 0.78, h * 0.62);
      ctx.lineTo(w * 0.22, h * 0.62);
      ctx.closePath();
      ctx.fillStyle = pal[1];
      ctx.fill();
      ctx.stroke();
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(w * (0.22 + i * 0.093), h * 0.3);
        ctx.lineTo(w * (0.22 + i * 0.093), h * 0.62);
        ctx.stroke();
      }
      rr(w * 0.3, h * 0.7, w * 0.4, h * 0.12, 4, pal[2]);
    } else if (kind === 1) {
      rr(w * 0.05, h * 0.1, w * 0.9, h * 0.8, w * 0.08, pal[0]);
      ctx.beginPath();
      ctx.arc(w * 0.34, h * 0.5, h * 0.28, 0, PI * 2);
      ctx.fillStyle = pal[2];
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.34, h * 0.22);
      ctx.lineTo(w * 0.34, h * 0.78);
      ctx.moveTo(w * 0.34, h * 0.5);
      ctx.lineTo(w * 0.34 - h * 0.2, h * 0.7);
      ctx.moveTo(w * 0.34, h * 0.5);
      ctx.lineTo(w * 0.34 + h * 0.2, h * 0.7);
      ctx.moveTo(w * 0.34 - h * 0.25, h * 0.36);
      ctx.lineTo(w * 0.34 + h * 0.25, h * 0.36);
      ctx.stroke();
      rr(w * 0.66, h * 0.25, w * 0.2, h * 0.5, 4, pal[1]);
      for (let i = 0; i < 5; i++) ctx.fillRect(w * 0.69, h * (0.32 + i * 0.08), w * 0.14, 2);
    } else if (kind === 2) {
      rr(w * 0.06, h * 0.15, w * 0.88, h * 0.72, 6, pal[1]);
      rr(w * 0.14, h * 0.25, w * 0.42, h * 0.5, 4, pal[2]);
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = '#141418';
        ctx.fillRect(w * 0.18, h * (0.3 + i * 0.06), w * 0.34, 2);
      }
      ctx.beginPath();
      ctx.arc(w * 0.74, h * 0.38, h * 0.1, 0, PI * 2);
      ctx.fillStyle = pal[0];
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * 0.74, h * 0.64, h * 0.1, 0, PI * 2);
      ctx.fillStyle = pal[0];
      ctx.fill();
      ctx.stroke();
    } else {
      rr(w * 0.1, h * 0.08, w * 0.8, h * 0.84, w * 0.2, pal[0]);
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.42, w * 0.24, 0, PI * 2);
      ctx.fillStyle = pal[2];
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.42, w * (0.05 + i * 0.05), 0, PI * 2);
        ctx.stroke();
      }
      rr(w * 0.25, h * 0.74, w * 0.5, h * 0.1, 4, pal[1]);
    }
    ctx.restore();
  }

  const RADIO_PALS = [['#8a98a8', '#d8d0c0', '#c03a34'], ['#d8d0c0', '#c03a34', '#5a6878'], ['#c03a34', '#e8e0d0', '#3a4250'], ['#5a6878', '#e8e0d0', '#c03a34'],
    ['#e8e0d0', '#8a98a8', '#c03a34'], ['#3a4250', '#c03a34', '#d8d0c0'], ['#a8b0b8', '#c03a34', '#2a2e36'], ['#c8584a', '#d8d0c0', '#3a4250']];

  function texRadios(ctx, w, h) {
    ctx.fillStyle = '#2a2e36';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      const cx = (i % 4) * (w / 4), cy = Math.floor(i / 4) * (h / 2);
      ctx.fillStyle = '#2a2e36';
      ctx.fillRect(cx, cy, w / 4, h / 2);
      radioArt(ctx, cx + 4, cy + 4, w / 4 - 8, h / 2 - 8, i % 4, RADIO_PALS[i]);
    }
  }

  function mural(ctx, w, h, seed) {
    ctx.fillStyle = '#34363e';
    ctx.fillRect(0, 0, w, h);
    const r = rnd(seed);
    for (let i = 0; i < 40; i++) {
      const sw = 70 + r() * 90, sh = sw * (0.6 + r() * 0.5);
      ctx.save();
      ctx.translate(r() * w, r() * h);
      ctx.rotate((r() - 0.5) * 0.9);
      radioArt(ctx, -sw / 2, -sh / 2, sw, sh, Math.floor(r() * 4), RADIO_PALS[Math.floor(r() * 8)]);
      ctx.restore();
    }
    ctx.strokeStyle = '#101014';
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      let x = r() * w, y = r() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (r() - 0.5) * 120;
        y += (r() - 0.5) * 80;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function jagged(cx, cy, rx, ry, n, r) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2;
      const k = 0.65 + r() * 0.5;
      pts.push([cx + C(a) * rx * k, cy + S(a) * ry * k]);
    }
    return pts;
  }

  function polyPath(ctx, pts) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
  }

  function texWall(ctx, w, h, seed, holes, breach) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#e6e4de');
    g.addColorStop(1, '#d2d0c8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = rnd(seed);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(120,118,110,${0.04 + r() * 0.08})`;
      ctx.beginPath();
      ctx.arc(r() * w, r() * h, 4 + r() * 22, 0, PI * 2);
      ctx.fill();
    }
    const art = document.createElement('canvas');
    art.width = w;
    art.height = h;
    mural(art.getContext('2d'), w, h, seed + 7);
    holes.forEach(([cx, cy, rx, ry]) => {
      const pts = jagged(cx * w, cy * h, rx * w, ry * h, 22, r);
      ctx.save();
      polyPath(ctx, pts);
      ctx.clip();
      ctx.drawImage(art, 0, 0);
      ctx.restore();
      ctx.strokeStyle = '#121216';
      ctx.lineWidth = 7;
      polyPath(ctx, pts);
      ctx.stroke();
      ctx.lineWidth = 3;
      for (let k = 0; k < 5; k++) {
        const p = pts[Math.floor(r() * pts.length)];
        ctx.beginPath();
        let x = p[0], y = p[1];
        ctx.moveTo(x, y);
        for (let s = 0; s < 4; s++) {
          x += (x - cx * w) * 0.12 + (r() - 0.5) * 30;
          y += (y - cy * h) * 0.12 + (r() - 0.5) * 30;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });
    if (breach) {
      const pts = jagged(w * 0.5, h * 0.52, w * 0.2, h * 0.42, 26, rnd(99));
      ctx.strokeStyle = '#121216';
      ctx.lineWidth = 16;
      polyPath(ctx, pts);
      ctx.stroke();
      ctx.save();
      polyPath(ctx, pts);
      ctx.clip();
      ctx.clearRect(0, 0, w, h);
      ctx.restore();
    }
  }

  function texSign(ctx, w, h) {
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff2a20';
    ctx.font = `bold ${Math.round(h * 0.66)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RECORDING', w / 2, h * 0.54);
  }

  function texModular(ctx, w, h) {
    ctx.fillStyle = '#16161a';
    ctx.fillRect(0, 0, w, h);
    const r = rnd(31);
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = '#26262c';
      ctx.fillRect(x + 1, 0, 30, h);
      for (let y = 10; y < h - 6; y += 18) {
        ctx.fillStyle = r() < 0.5 ? '#d8d8d0' : '#9a9a96';
        ctx.beginPath();
        ctx.arc(x + 9 + (r() < 0.5 ? 0 : 12), y, 4, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#060608';
        ctx.beginPath();
        ctx.arc(x + 22, y + 6, 2.4, 0, PI * 2);
        ctx.fill();
      }
    }
    const cols = ['#e8c020', '#d03030', '#3070d0', '#30a050', '#f0f0f0'];
    ctx.lineWidth = 3;
    for (let i = 0; i < 22; i++) {
      ctx.strokeStyle = cols[i % cols.length];
      const x0 = r() * w, y0 = r() * h * 0.8, x1 = x0 + (r() - 0.5) * 160, y1 = y0 + r() * 60;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 40, x1, y1);
      ctx.stroke();
    }
  }

  function texPlanks(ctx, w, h) {
    ctx.fillStyle = '#f4f4f6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#5a5a64';
    ctx.fillRect(0, 0, 3, h);
    ctx.fillRect(w / 2, 0, 3, h);
    ctx.fillStyle = '#b8b8c0';
    ctx.fillRect(w / 4, h * 0.3, 2, h * 0.2);
    ctx.fillRect((w * 3) / 4, h * 0.7, 2, h * 0.2);
  }

  function texSand(ctx, w, h) {
    ctx.fillStyle = '#c8a46a';
    ctx.fillRect(0, 0, w, h);
    const r = rnd(41);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(120,90,50,0.35)' : 'rgba(240,220,170,0.35)';
      ctx.fillRect(r() * w, r() * h, 2, 2);
    }
  }

  function texPileBg(ctx, w, h) {
    const g = ctx.createRadialGradient(w * 0.2, h * 0.25, 10, w * 0.4, h * 0.5, w * 0.8);
    g.addColorStop(0, '#3a6a52');
    g.addColorStop(0.45, '#2a3a36');
    g.addColorStop(1, '#16181c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function texWheel(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#5ac8f0');
    g.addColorStop(1, '#2a88c8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function texKeys(ctx, w, h) {
    ctx.fillStyle = '#f4f2ea';
    ctx.fillRect(0, 0, w, h);
    const n = 36;
    ctx.fillStyle = '#7a7a76';
    for (let i = 0; i <= n; i++) ctx.fillRect((i * w) / n, 0, 1, h);
    ctx.fillStyle = '#121214';
    for (let i = 0; i < n; i++) {
      const k = i % 7;
      if (k === 2 || k === 6) continue;
      ctx.fillRect(((i + 0.68) * w) / n, 0, (w / n) * 0.62, h * 0.6);
    }
  }

  function quadAt(b, x0, y0, x1, y1, z, col, uv) {
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, uv || null, NZ);
  }

  function floorTiles(b, x0, z0, x1, z1, step, y, col, uvScale) {
    for (let x = x0; x < x1 - 1e-6; x += step) {
      for (let z = z0; z < z1 - 1e-6; z += step) {
        const xb = Math.min(x1, x + step), zb = Math.min(z1, z + step);
        const k = uvScale || 0;
        const uv = k ? [[x * k, zb * k], [xb * k, zb * k], [xb * k, z * k], [x * k, z * k]] : null;
        b.quad([x, y, zb], [xb, y, zb], [xb, y, z], [x, y, z], col, uv, NY);
      }
    }
  }

  function radioBody(b, col) {
    b.at(0, RADIO_H / 2, 0, (h) => h.box(RADIO_W, RADIO_H, RADIO_D, col));
    b.at(0, RADIO_H + 0.012, 0, (h) => h.box(RADIO_W + 0.03, 0.024, RADIO_D + 0.03, col));
    b.at(0, 0.012, 0, (h) => h.box(RADIO_W + 0.02, 0.024, RADIO_D + 0.02, col));
  }

  function annulus(b, cx, cy, z, r0, r1, n, col) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      b.quad([cx + C(a0) * r1, cy + S(a0) * r1, z], [cx + C(a1) * r1, cy + S(a1) * r1, z], [cx + C(a1) * r0, cy + S(a1) * r0, z], [cx + C(a0) * r0, cy + S(a0) * r0, z], col, null, NZ);
    }
  }

  function radioFront(b) {
    const z = RADIO_D / 2 + 0.004;
    const gx = -0.06, gy = 0.3;
    for (let i = 0; i < 6; i++) annulus(b, gx, gy, z + 0.001 * (i % 2), i * 0.03, (i + 1) * 0.03, 22, i % 2 ? 0x46523c : 0x232a1e);
    annulus(b, gx, gy, z + 0.006, 0.18, 0.205, 26, glow(0xa89040, 0.25));
    [-1, 1].forEach(s => b.push(M4.translate(s * 0.25, 0.12, z), M4.rotX(PI / 2)).prism(12, 0.034, 0.034, 0, 0.034, 0.034, 0.045, 0xf2f0e8).pop());
  }

  function ringMesh(b, r0, r1, depth, col) {
    const n = 28;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      [-depth / 2, depth / 2].forEach(z => b.quad([C(a0) * r1, S(a0) * r1, z], [C(a1) * r1, S(a1) * r1, z], [C(a1) * r0, S(a1) * r0, z], [C(a0) * r0, S(a0) * r0, z], col, null, NZ));
      const nm = [C((a0 + a1) / 2), S((a0 + a1) / 2), 0];
      b.quad([C(a0) * r1, S(a0) * r1, -depth / 2], [C(a1) * r1, S(a1) * r1, -depth / 2], [C(a1) * r1, S(a1) * r1, depth / 2], [C(a0) * r1, S(a0) * r1, depth / 2], col, null, [nm, nm, nm, nm]);
    }
  }

  function keyboardMesh(b, w, opts) {
    const o = opts || {};
    const body = o.body || 0x18181c;
    b.at(0, -0.04, 0.05, (h) => h.box(w + 0.08, 0.08, 0.3, body));
    if (o.wood) [-1, 1].forEach(s => b.at(s * (w / 2 + 0.05), -0.02, 0.05, (h) => h.box(0.03, 0.12, 0.32, 0x8a5a30)));
    b.at(0, 0.003, -0.02, (h) => h.box(w, 0.012, 0.13, 0xf4f2ea));
    const n = Math.round(w / 0.023);
    for (let i = 0; i < n; i++) {
      const k = i % 7;
      if (k === 2 || k === 6) continue;
      b.at(-w / 2 + (i + 1) * (w / n), 0.015, 0.0, (h) => h.box(0.012, 0.012, 0.075, 0x121214));
    }
    b.push(M4.translate(0, 0.02, 0.15), M4.rotX(-0.5));
    b.box(w + 0.06, 0.012, 0.12, o.panel || 0x2a2a30);
    for (let i = 0; i < 9; i++) b.at(-w / 2 + 0.05 + i * (w - 0.1) / 8, 0.012, 0, (h) => h.prism(8, 0.012, 0.012, 0, 0.012, 0.012, 0.014, i % 3 ? 0xd8d8d0 : 0xe04030));
    b.pop();
  }

  function xStand(b, w, hgt) {
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * (w / 2 - 0.1), hgt / 2, 0));
      [-1, 1].forEach(d => {
        b.push(M4.rotX(d * 0.55));
        b.box(0.03, hgt / C(0.55), 0.03, 0x2a2a2e);
        b.pop();
      });
      b.pop();
    });
    b.at(0, hgt * 0.5, 0, (h) => h.box(w - 0.1, 0.03, 0.03, 0x2a2a2e));
  }

  function tvCabinet(b, w, h, wood) {
    const d = h * 0.9;
    const col = wood ? 0x6a4428 : 0x1c1c20;
    b.at(0, 0, -d / 2 + 0.02, (q) => q.box(w, h, d, col));
    b.at(0, 0, -d - 0.08, (q) => q.box(w * 0.6, h * 0.6, 0.2, wood ? 0x5a3a20 : 0x161618));
    b.at(0, -h * 0.42, 0.024, (q) => q.box(w * 0.96, h * 0.1, 0.01, wood ? 0x7a5432 : 0x26262a));
    [0.3, 0.4].forEach(k => b.push(M4.translate(w * k, -h * 0.42, 0.03), M4.rotX(PI / 2)).prism(10, 0.016, 0.016, -0.01, 0.016, 0.016, 0.012, 0xc8c8c0).pop());
  }

  function screenMesh(b, w, h, cols) {
    const nx = 8, ny = 6;
    const pt = (i, j) => {
      const u = i / nx, v = j / ny;
      const dx = u - 0.5, dy = v - 0.5;
      return [dx * w, dy * h, 0.02 * (1 - 4 * (dx * dx + dy * dy))];
    };
    const shadeAt = (i, j) => {
      const dx = i / nx - 0.5, dy = j / ny - 0.5;
      const k = 1 - 1.6 * (dx * dx + dy * dy);
      return [k * cols[0], k * cols[1], k * cols[2], 1];
    };
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), [shadeAt(i, j), shadeAt(i + 1, j), shadeAt(i + 1, j + 1), shadeAt(i, j + 1)], [[i / nx, j / ny], [(i + 1) / nx, j / ny], [(i + 1) / nx, (j + 1) / ny], [i / nx, (j + 1) / ny]], NZ);
      }
    }
  }

  function buildNight(b) {
    floorTiles(b, -24, -36, 24, 12, 6, 0, 0x07080c);
  }

  function buildWhite(b) {
    floorTiles(b, -10, -10, 10, 8, 4, 0, 0xf2f2f4);
    b.push(M4.translate(0, 0, -6));
    quadAt(b, -12, 0, 12, 8, 0, 0xf4f4f6);
    b.pop();
  }

  function whiteRig(b) {
    const M = keyboardPlacement('rsKeysSilver', WHITE_KEYS);
    b.push(M);
    keyboardMesh(b, 0.86, { body: 0x101012 });
    b.pop();
    b.push(M);
    b.at(0, -0.46, 0.08, (h) => h.box(0.98, 0.8, 0.34, [0.05, 0.05, 0.06, 0.04]));
    b.pop();
    b.push(M4.translate(-1.05, 0, -0.75), M4.rotY(0.6));
    xStand(b, 0.9, 0.78);
    b.push(M4.translate(0, 0.86, 0));
    keyboardMesh(b, 0.72, { wood: true, panel: 0xc8c8c0 });
    b.pop();
    b.push(M4.translate(0, 1.08, 0.12), M4.rotX(-0.25));
    keyboardMesh(b, 0.62, { wood: true, panel: 0x2a2a30 });
    b.pop();
    b.pop();
    b.push(M4.translate(1.05, 0, -0.65), M4.rotY(-0.55));
    xStand(b, 0.9, 0.8);
    b.push(M4.translate(0, 0.88, 0));
    keyboardMesh(b, 0.8, { body: 0x202024 });
    b.pop();
    b.pop();
  }

  function buildLab(b) {
    floorTiles(b, -5, -4, 5, 4, 2, 0, 0xd0d0c8);
    b.push(M4.translate(0, 4.2, 0), M4.rotX(PI));
    floorTiles(b, -5, -4, 5, 4, 2.5, 0, 0x1a1a1e);
    b.pop();
    b.quad([5, 0, -4], [5, 0, 4], [5, 4.2, 4], [5, 4.2, -4], 0xd8d6ce, null, [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]]);
    for (let i = 0; i < 6; i++) b.at(-4.5 + i * 1.8, 4.1, 0, (h) => h.box(0.12, 0.12, 8, 0x2a2a30));
    CAB.forEach(([x, z]) => b.at(x, 0.85, z, (h) => {
      h.box(0.62, 1.7, 0.5, 0xeeeee8);
      h.at(0, 0.42, 0.252, (q) => q.box(0.56, 0.62, 0.01, 0xd8d8d0));
      h.at(0, -0.22, 0.252, (q) => q.box(0.5, 0.36, 0.01, 0xc8c8c0));
      [-0.15, 0, 0.15].forEach(x2 => h.at(x2, -0.12, 0.262, (q) => q.box(0.06, 0.02, 0.01, 0x2a2a30)));
      h.at(0, 0.1, 0.262, (q) => q.box(0.12, 0.05, 0.01, glow(0xe04020, 0.6)));
    }));
    b.push(M4.translate(LAB_PIANO.x, 0, LAB_PIANO.z), M4.rotY(LAB_PIANO.ry));
    b.at(0, 0.68, 0.04, (h) => h.box(1.45, 1.36, 0.42, [0.06, 0.06, 0.07, 0.05]));
    [-1, 1].forEach(s => b.at(s * 0.66, 0.44, 0.3, (h) => h.box(0.06, 0.88, 0.06, [0.06, 0.06, 0.07, 0.05])));
    b.pop();
    b.push(labTvMatrix());
    b.at(0, 0.38, 0, (h) => h.box(1.0, 0.76, 0.6, 0xeeeee8));
    b.at(0, LAB_TV_Y, -0.05, (h) => tvCabinet(h, 0.62, 0.5, false));
    [[-0.38, 0.82, 0.12, 0.18], [0.36, 0.8, 0.1, 0.14], [0.2, 0.84, -0.18, 0.12]].forEach(([x, y, z, s]) => b.at(x, y, z, (h) => h.box(s * 1.4, s * 0.6, s, 0xd8c8a0)));
    b.pop();
    const r = rnd(77);
    for (let i = 0; i < 40; i++) {
      const x = -4.6 + r() * 9.2, z = -3.8 + r() * 1.4 + (r() < 0.3 ? r() * 3 : 0);
      if (Math.abs(x - TUBE.x) < 0.7 && Math.abs(z - TUBE.z) < 0.7) continue;
      const s = 0.08 + r() * 0.16;
      b.push(M4.translate(x, s * 0.25, z), M4.rotY(r() * PI), M4.rotZ((r() - 0.5) * 0.5));
      b.box(s * 1.6, s * 0.5, s, r() < 0.4 ? 0xa85a3a : r() < 0.7 ? 0xe8e6de : 0xc8b890);
      b.pop();
    }
    b.push(M4.translate(TUBE.x, 0, TUBE.z));
    b.prism(16, TUBE.r + 0.12, TUBE.r + 0.12, 0, TUBE.r + 0.1, TUBE.r + 0.1, TUBE.base, 0x2a2a30, { capTop: true });
    b.prism(16, TUBE.r + 0.08, TUBE.r + 0.08, TUBE.h, TUBE.r + 0.08, TUBE.r + 0.08, TUBE.h + 0.14, 0xd8d8d0, { capTop: true, capBottom: true });
    b.pop();
    [[-3.6, 0x30d070], [3.4, 0x4a7af0]].forEach(([x, col]) => b.at(x, 3.95, 1.2, (h) => {
      h.box(0.3, 0.26, 0.4, 0x1a1a1e);
      h.at(0, -0.14, 0.05, (q) => q.box(0.2, 0.02, 0.2, glow(col, 0.95)));
    }));
  }

  function buildStudio(b) {
    floorTiles(b, -7, -16, 7, -4.15, 1.0, 0.0, 0xffffff, 0.5);
  }

  function buildStudioSet(b) {
    b.push(M4.translate(0, 0, -16));
    quadAt(b, -8, 0, 8, 7, 0, 0xf6f6f8);
    b.pop();
    [-1, 1].forEach(s => b.quad([s * 7, 0, s > 0 ? -16 : -4.1], [s * 7, 0, s > 0 ? -4.1 : -16], [s * 7, 7, s > 0 ? -4.1 : -16], [s * 7, 7, s > 0 ? -16 : -4.1], 0xf4f4f6, null, [[-s, 0, 0], [-s, 0, 0], [-s, 0, 0], [-s, 0, 0]]));
    b.push(M4.translate(0, 7, 0), M4.rotX(PI));
    floorTiles(b, -7, 4.1, 7, 16, 3.5, 0, 0xf0f0f2);
    b.pop();
    const kb = keyboardPlacement('rsKeysSilver', STUDIO.keys);
    b.push(kb);
    keyboardMesh(b, 0.86, { body: 0x16161a });
    b.pop();
    b.push(M4.translate(STUDIO.keys.x, 0, STUDIO.keys.z + 0.32), M4.rotY(STUDIO.keys.ry));
    xStand(b, 0.95, 0.8);
    b.pop();
    b.push(M4.translate(STUDIO.keys.x - 0.95, 0, STUDIO.keys.z + 0.15), M4.rotY(0.75));
    xStand(b, 0.9, 0.8);
    b.at(0, 0.88, 0, (h) => keyboardMesh(h, 0.8, { wood: true, panel: 0x2a2a30 }));
    b.at(0, 1.06, 0.1, (h) => h.box(0.8, 0.2, 0.32, 0x8a5a30));
    b.pop();
    const sy = keyboardPlacement('rsSynth', STUDIO.synth);
    b.push(sy);
    keyboardMesh(b, 0.86, { body: 0x16161a, panel: 0xc8c8c0 });
    b.pop();
    b.push(M4.translate(STUDIO.synth.x, 0, STUDIO.synth.z + 0.32), M4.rotY(STUDIO.synth.ry));
    xStand(b, 0.95, 0.8);
    b.pop();
    b.push(M4.translate(-2.4, 0, -6.7));
    [0, 2.1, 4.2].forEach(a => {
      b.push(M4.rotY(a), M4.rotX(0.32));
      b.at(0, 0.62, 0.0, (h) => h.box(0.04, 1.3, 0.04, 0x8a8e96));
      b.pop();
    });
    b.at(0, 1.3, 0, (h) => {
      h.box(0.34, 0.36, 0.56, 0xd8d8dc);
      h.at(0, 0.02, -0.38, (q) => q.prism(12, 0.1, 0.1, -0.02, 0.1, 0.1, 0.02, 0x1a1a1e));
      h.push(M4.translate(0, 0.02, -0.32), M4.rotX(PI / 2));
      h.prism(12, 0.1, 0.1, 0, 0.11, 0.11, 0.2, 0x2a2a30);
      h.pop();
      h.at(0.18, 0.14, 0.18, (q) => q.box(0.12, 0.12, 0.2, 0x4a4a52));
      h.at(0, -0.22, 0, (q) => q.box(0.2, 0.06, 0.2, 0xc02020));
    });
    b.pop();
    const r = rnd(13);
    for (let i = 0; i < 30; i++) {
      const x = -3.5 + r() * 7, z = -4.3 - r() * 1.6;
      const s = 0.07 + r() * 0.16;
      b.push(M4.translate(x, s * 0.25, z), M4.rotY(r() * PI), M4.rotZ((r() - 0.5) * 0.4));
      b.box(s * 1.6, s * 0.5, s, r() < 0.3 ? 0xb06a48 : 0xeeeeea);
      b.pop();
    }
  }

  function buildModular(b) {
    b.push(M4.translate(2.15, 0, -13.75));
    b.at(0, 1.15, 0, (h) => h.box(3.2, 2.3, 0.5, 0x121216));
    quadAt(b, -1.55, 0.25, 1.55, 2.2, 0.252, [1, 1, 1, 0], [[0, 0], [3, 0], [3, 2], [0, 2]]);
    [-1.1, -0.3, 0.5, 1.2].forEach(x => b.at(x, 2.45, 0.05, (h) => {
      h.box(0.5, 0.32, 0.4, 0x16161a);
      h.at(0, 0, 0.205, (q) => q.box(0.4, 0.22, 0.01, glow(0x30d060, 0.95)));
    }));
    b.pop();
  }

  const PILE = (() => {
    const r = rnd(57);
    const out = [];
    [[0, 9, 1.1, 0.0], [1, 7, 0.72, 0.42], [2, 5, 0.4, 0.84], [3, 3, 0.14, 1.18]].forEach(([layer, n, rad, y0]) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * PI * 2 + layer * 0.7 + r() * 0.3;
        const w = 0.8 + r() * 0.55, h = w * (0.55 + r() * 0.3);
        const sp = 1.4 + r() * 1.2;
        out.push({
          x: C(a) * rad, z: S(a) * rad * 0.8, y: y0 + h * 0.35, w, h,
          ry: PI / 2 - a + (r() - 0.5) * 0.6, rx: -0.3 - r() * 0.5, rz: (r() - 0.5) * 0.6, cell: Math.floor(r() * 8),
          v: [C(a) * sp, 0.5 + r() * 1.2 + layer * 0.2, S(a) * sp * 0.8 + 0.6], spin: [(r() - 0.5) * 3, (r() - 0.5) * 3, (r() - 0.5) * 3]
        });
      }
    });
    return out;
  })();

  function cardMesh(b, w, h, cell) {
    const u0 = (cell % 4) / 4, v0 = cell < 4 ? 0.5 : 0;
    const uv = [[u0, v0], [u0 + 0.25, v0], [u0 + 0.25, v0 + 0.5], [u0, v0 + 0.5]];
    b.quad([-w / 2, -h / 2, 0.035], [w / 2, -h / 2, 0.035], [w / 2, h / 2, 0.035], [-w / 2, h / 2, 0.035], [1, 1, 1, 0.38], uv, NZ);
    b.quad([w / 2, -h / 2, -0.035], [-w / 2, -h / 2, -0.035], [-w / 2, h / 2, -0.035], [w / 2, h / 2, -0.035], [3.0, 2.6, 2.2, 0.25], [[0, 0], [0.001, 0], [0.001, 0.001], [0, 0.001]], [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
  }

  function buildPileGround(b) {
    floorTiles(b, -8, -8, 8, 6, 2, 0, 0x2a2c30);
  }

  function buildTvPile(b) {
    const r = rnd(91);
    const n = 16;
    const yy = (xx, zz) => 0.12 + 0.1 * S(xx * 2.1 + zz * 1.3) * C(zz * 1.7) - 0.02 * zz;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < 12; j++) {
        const x = -2.4 + (i / n) * 4.8, z = -1.6 + (j / 12) * 3.6;
        const x1 = x + 4.8 / n, z1 = z + 3.6 / 12;
        b.quad([x, yy(x, z1), z1], [x1, yy(x1, z1), z1], [x1, yy(x1, z), z], [x, yy(x, z), z], [0.78, 0.64, 0.42, 0], [[x, z1], [x1, z1], [x1, z], [x, z]], NY);
      }
    }
    for (let i = 0; i < 26; i++) {
      const x = -1.8 + r() * 3.6, z = -0.6 + r() * 1.8;
      b.push(M4.translate(x, 0.2 + r() * 0.08, z), M4.rotY(r() * PI), M4.rotX((r() - 0.5) * 0.6));
      b.box(0.2, 0.06, 0.1, r() < 0.7 ? 0xa04a32 : 0xd8c8a8);
      b.pop();
    }
  }

  function buildTvWall(b) {
    const r = rnd(17);
    for (let i = 0; i < 16; i++) {
      const row = Math.floor(i / 6), col = i % 6;
      const w = 0.7 + r() * 0.5, h = w * (0.6 + r() * 0.3);
      b.push(M4.translate(-2.1 + col * 0.82 + (row % 2) * 0.3 + (r() - 0.5) * 0.2, 0.55 + row * 0.62 + r() * 0.1, -1.25 - row * 0.12 - r() * 0.15), M4.rotZ((r() - 0.5) * 0.7), M4.rotY((r() - 0.5) * 0.5));
      cardMesh(b, w, h, Math.floor(r() * 8));
      b.pop();
    }
  }

  const FW = 512;
  const FH = 384;
  const FULL = { x: 0, y: 0, w: FW, h: FH };
  const FEEDS = [{ x: 0, y: 0, w: 256, h: 192 }, { x: 256, y: 0, w: 256, h: 192 }, { x: 0, y: 192, w: 256, h: 192 }];
  const OVER_ENV = { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0, 0, 0], fogNear: 1000, fogFar: 2000, points: [] };
  const ORTHO = new Float32Array([2 / FW, 0, 0, 0, 0, 2 / FH, 0, 0, 0, 0, -1, 0, -1, -1, 0, 1]);
  const LUM = [0.3, 0.59, 0.11];
  const POSTER_GAIN = 9;
  const POSTER_CUT = 0.34;
  const POSTER_M = new Float32Array([LUM[0], LUM[0], LUM[0], LUM[1], LUM[1], LUM[1], LUM[2], LUM[2], LUM[2]].map(v => v * POSTER_GAIN));
  const POSTER_ADD = [-POSTER_CUT * POSTER_GAIN, -POSTER_CUT * POSTER_GAIN, -POSTER_CUT * POSTER_GAIN];

  function billboard(cm) {
    const f = V3.norm(V3.sub(cm.eye, cm.at));
    let rt = V3.cross([0, 1, 0], f);
    if (V3.len(rt) < 1e-4) rt = [1, 0, 0];
    rt = V3.norm(rt);
    const up = V3.cross(f, rt);
    return new Float32Array([rt[0], rt[1], rt[2], 0, up[0], up[1], up[2], 0, f[0], f[1], f[2], 0, 0, 0, 0, 1]);
  }

  function keyDir(cm) {
    const f = V3.norm(V3.sub(cm.at, cm.eye));
    let rt = V3.cross(f, [0, 1, 0]);
    if (V3.len(rt) < 1e-3) rt = [1, 0, 0];
    rt = V3.norm(rt);
    return V3.norm(V3.add(V3.add(V3.mul(f, 0.6), V3.mul(rt, 0.45)), [0, -0.62, 0]));
  }

  function create(r) {
    const X = Cast.makeCast(r);
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    const T = {
      glow: r.texture(64, texGlow, { clamp: true }),
      smoke: r.texture(128, texSmoke, { clamp: true }),
      puff: r.texture(64, texPuff, { clamp: true }),
      spark: r.texture(32, texSpark, { clamp: true }),
      streaks: r.texture(256, texStreaks),
      dial: r.texture(128, texDial, { height: 32, clamp: true }),
      radios: r.texture(512, texRadios, { height: 256, clamp: true }),
      wall: r.texture(1024, (c, w, h) => texWall(c, w, h, 3, [[0.12, 0.3, 0.1, 0.22], [0.33, 0.18, 0.08, 0.14], [0.56, 0.28, 0.12, 0.2], [0.82, 0.22, 0.12, 0.2], [0.7, 0.6, 0.07, 0.12]], false), { height: 512, clamp: true }),
      wallBroken: r.texture(1024, (c, w, h) => texWall(c, w, h, 3, [[0.12, 0.3, 0.1, 0.22], [0.82, 0.22, 0.12, 0.2]], true), { height: 512, clamp: true }),
      sideWall: r.texture(1024, (c, w, h) => texWall(c, w, h, 8, [[0.3, 0.3, 0.14, 0.24], [0.7, 0.4, 0.1, 0.2]], false), { height: 512, clamp: true }),
      sign: r.texture(256, texSign, { height: 64, clamp: true }),
      modular: r.texture(256, texModular),
      planks: r.texture(128, texPlanks),
      sand: r.texture(128, texSand),
      pileBg: r.texture(256, texPileBg, { clamp: true }),
      wheelBg: r.texture(64, texWheel, { clamp: true }),
      keys: r.texture(256, texKeys, { height: 32 }),
      poster: r.frameTexture(),
      prev: r.frameTexture(),
      feeds: [r.frameTexture(), r.frameTexture(), r.frameTexture()]
    };
    const Q = {
      unit: mk(b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], null, NZ)),
      flip: mk(b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], [[1, 0], [0, 0], [0, 1], [1, 1]], NZ)),
      sprite: mk(b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], null, NZ)),
      moon: mk(b => {
        for (let i = 0; i < 32; i++) {
          const a0 = (i / 32) * PI * 2, a1 = ((i + 1) / 32) * PI * 2;
          b.tri([0, 0, 0], [C(a0), S(a0), 0], [C(a1), S(a1), 0], [1, 1, 0.97, 1], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        }
      }),
      streaks: mk(b => b.quad([-2.8, 0.012, -1.0], [2.8, 0.012, -1.0], [2.8, 0.012, -27], [-2.8, 0.012, -27], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 7], [0, 7]], NY)),
      radioBody: mk(b => radioBody(b, 0x5a2016)),
      radioGlow: mk(b => radioBody(b, [1.0, 0.5, 0.12, 0.95])),
      radioFront: mk(radioFront),
      dial: mk(b => {
        b.push(M4.translate(0, RADIO_H - 0.1, RADIO_D / 2 - 0.02), M4.rotX(-0.32));
        quadAt(b, -0.24, -0.06, 0.24, 0.06, 0.03, [1, 1, 1, 0.6]);
        b.pop();
      }),
      ring: mk(b => ringMesh(b, 0.165, 0.205, 0.03, glow(0xe8c040, 0.7))),
      debris: mk(b => b.box(0.05, 0.03, 0.04, 0x2a1a14)),
      tube: mk(b => b.prism(20, TUBE.r, TUBE.r, 0, TUBE.r, TUBE.r, TUBE.h - TUBE.base, [0.8, 0.9, 0.95, 0.4], { capTop: false })),
      reel: mk(b => {
        annulus(b, 0, 0, 0, 0.02, 0.14, 24, 0x18181c);
        annulus(b, 0, 0, 0.003, 0.03, 0.05, 16, 0xc8c8c8);
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * PI * 2;
          b.at(C(a) * 0.09, S(a) * 0.09, 0.004, (h) => h.ellipsoid(0.028, 0.028, 0.002, 10, 2, 0x8a8a90));
        }
      }),
      sign: mk(b => quadAt(b, -0.85, -0.2, 0.85, 0.2, 0, [1, 1, 1, 0.8])),
      wall: mk(b => quadAt(b, -5, 0, 5, 4.2, 0, [1, 1, 1, 0])),
      sideWall: mk(b => b.quad([-4.99, 0, 4], [-4.99, 0, -4], [-4.99, 4.2, -4], [-4.99, 4.2, 4], [1, 1, 1, 0], null, [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]])),
      labTvScreen: mk(b => screenMesh(b, 0.5, 0.34, [1, 1, 1])),
      tvScreens: TVS.map(tv => mk(b => screenMesh(b, tv.w * 0.8, tv.h * 0.66, [1, 1, 1]))),
      tvCabs: TVS.map(tv => mk(b => tvCabinet(b, tv.w, tv.h, tv.wood))),
      cards: PILE.map(c => mk(b => cardMesh(b, c.w, c.h, c.cell))),
      pileBg: mk(b => quadAt(b, -12, -1, 12, 11, 0, [1, 1, 1, 1])),
      backdrop: mk(b => {
        floorTiles(b, -6, -3, 6, 4, 2, 0, [1, 1, 1, 0]);
        b.push(M4.translate(0, 0, -3));
        quadAt(b, -6, 0, 6, 6, 0, [1, 1, 1, 0]);
        b.pop();
      }),
      panel: mk(b => quadAt(b, -0.6, 0, 0.6, 2.2, 0, [0.85, 0.92, 1, 0.3])),
      wheel: mk(b => {
        ringMesh(b, 0.3, 0.42, 0.06, [0.86, 0.94, 1, 0.5]);
        for (let i = 0; i < 6; i++) {
          b.push(M4.rotZ((i / 6) * PI * 2));
          b.at(0, 0.16, 0, (h) => h.box(0.04, 0.28, 0.04, [0.8, 0.9, 1, 0.5]));
          b.pop();
        }
      }),
      ringIris: mk(b => annulus(b, 0, 0, 0, 1, 60, 48, [0, 0, 0, 1]))
    };
    const sets = {};
    const setFor = (id) => {
      if (sets[id]) return sets[id];
      if (id === 'night') sets[id] = { base: mk(buildNight) };
      else if (id === 'white') sets[id] = { base: mk(buildWhite), rig: mk(whiteRig) };
      else if (id === 'lab') sets[id] = { base: mk(buildLab) };
      else if (id === 'studio') sets[id] = { floor: mk(buildStudio), base: mk(buildStudioSet), modular: mk(buildModular) };
      else if (id === 'pile') sets[id] = { base: mk(buildPileGround) };
      else if (id === 'tvpile') sets[id] = { base: mk(buildTvPile), wall: mk(buildTvWall) };
      return sets[id];
    };
    const labKeysMesh = mk(b => {
      b.push(keyboardPlacement('rsKeysLab', LAB_KEYS));
      keyboardMesh(b, 1.0, { body: [0.06, 0.06, 0.07, 0.05], panel: [0.06, 0.06, 0.07, 0.05] });
      b.pop();
    });

    let polys = 0;
    const tally = () => { polys += r.polys; r.polys = 0; };

    function envFor(st) {
      const cm = st.camera;
      const kd = keyDir(cm);
      const L = st.light;
      if (L === 'night') {
        const g = st.girlLight === undefined ? 1 : st.girlLight;
        const glowK = st.glow || 0;
        const env = {
          sunDir: kd, sunColor: [0.62 * g, 0.6 * g, 0.66 * g], ambTop: [0.1, 0.1, 0.13], ambBottom: [0.03, 0.03, 0.05],
          fogColor: [0, 0, 0], fogNear: 14, fogFar: 42, points: []
        };
        if (glowK > 0.01) env.points.push({ pos: [0.1, 0.45, 0.5], color: [2.6 * glowK, 1.2 * glowK, 0.3 * glowK] });
        if (st.burst) env.points.push({ pos: [GIRL_STAND.x, 1.2, GIRL_STAND.z - 0.6], color: [1.6 * st.burst, 1.8 * st.burst, 2.4 * st.burst] });
        return env;
      }
      if (L === 'poster') return { sunDir: V3.norm(addV(V3.norm(V3.sub(cm.at, cm.eye)), [0.25, -0.2, 0])), sunColor: [0.7, 0.7, 0.7], ambTop: [0.62, 0.62, 0.62], ambBottom: [0.5, 0.5, 0.5], fogColor: [0, 0, 0], fogNear: 40, fogFar: 80, points: [] };
      if (L === 'white') return { sunDir: kd, sunColor: [0.45, 0.45, 0.46], ambTop: [0.85, 0.85, 0.88], ambBottom: [0.68, 0.68, 0.7], fogColor: [0.97, 0.97, 0.98], fogNear: 5, fogFar: 22, points: [] };
      if (L === 'lab' || L === 'purple') {
        const purple = L === 'purple';
        return {
          sunDir: kd, sunColor: purple ? [0.9, 0.35, 0.9] : [0.62, 0.62, 0.6], ambTop: purple ? [0.5, 0.2, 0.55] : [0.58, 0.62, 0.6], ambBottom: purple ? [0.25, 0.08, 0.3] : [0.34, 0.36, 0.36],
          fogColor: purple ? [0.3, 0.08, 0.32] : [0.78, 0.8, 0.78], fogNear: 9, fogFar: 26,
          points: [{ pos: [-3.6, 3.6, 1.2], color: [0.2, 1.1, 0.5] }, { pos: [3.4, 3.6, 1.2], color: [0.35, 0.55, 1.4] }]
        };
      }
      if (L === 'studio') return { sunDir: kd, sunColor: [0.5, 0.5, 0.5], ambTop: [0.88, 0.88, 0.9], ambBottom: [0.72, 0.72, 0.75], fogColor: [0.98, 0.98, 0.99], fogNear: 9, fogFar: 30, points: [] };
      if (L === 'studioPink') return { sunDir: kd, sunColor: [0.9, 0.3, 0.7], ambTop: [0.7, 0.25, 0.55], ambBottom: [0.35, 0.1, 0.3], fogColor: [0.85, 0.3, 0.65], fogNear: 4, fogFar: 14, points: [] };
      if (L === 'pile') return { sunDir: kd, sunColor: [0.85, 0.82, 0.76], ambTop: [0.4, 0.46, 0.42], ambBottom: [0.18, 0.2, 0.2], fogColor: st.sky ? [0.16, 0.66, 0.94] : [0.09, 0.1, 0.11], fogNear: 12, fogFar: 30, points: [] };
      if (L === 'pink') return { sunDir: kd, sunColor: [1.0, 0.45, 0.75], ambTop: [0.85, 0.32, 0.68], ambBottom: [0.5, 0.12, 0.35], fogColor: [0.86, 0.36, 0.7], fogNear: 8, fogFar: 20, points: [] };
      return { sunDir: kd, sunColor: [0.78, 0.66, 0.5], ambTop: [0.42, 0.38, 0.34], ambBottom: [0.2, 0.17, 0.14], fogColor: [0.12, 0.1, 0.09], fogNear: 6, fogFar: 18, points: [] };
    }

    function drawCast(cast, opts) {
      cast.forEach(a => Cast.drawActor(r, X, a, opts));
    }

    function drawSprite(bb, pos, size, tex, tint, alpha, opts) {
      r.draw(Q.sprite, M4.chain(M4.translate(pos[0], pos[1], pos[2]), bb, M4.scale(size)), Object.assign({ texture: tex, additive: true, noFog: true, tint, alpha }, opts || {}));
    }

    function drawPuffs(st, t, bb) {
      (st.puffs || []).forEach(pf => {
        const age = t - pf.t0;
        if (age < 0 || age > pf.life) return;
        const k = age / pf.life;
        for (let i = 0; i < pf.n; i++) {
          const a = hash(i, 4) * PI * 2, d = 0.3 + hash(i, 6) * 0.6;
          const pos = addV(pf.at, [C(a) * d * pf.size * 0.35 + pf.drift[0] * age, S(a) * d * pf.size * 0.25 + pf.drift[1] * age, 0.05 * i]);
          drawSprite(bb, pos, pf.size * (0.45 + 0.6 * smooth(k * 1.5)) * (0.7 + hash(i, 9) * 0.6), T.smoke, [1, 0.88, 0.6], 0.75 * (1 - smooth(span(k, 0.55, 1))) * smooth(span(age, 0, 0.12)));
        }
      });
    }

    function drawSparkles(st, t, bb) {
      if (!st.sparkle) return;
      for (let i = 0; i < 70; i++) {
        const sp = 0.35 + hash(i, 2) * 0.4;
        const ph = frac(hash(i, 1) + t * sp * 0.22);
        const x = GIRL_STAND.x + (hash(i, 3) - 0.5) * 3.2, z = GIRL_STAND.z - 0.5 + (hash(i, 5) - 0.5) * 2.2;
        const y = 2.6 - ph * 2.7;
        const tw = 0.5 + 0.5 * S(t * (6 + hash(i, 7) * 6) + i);
        drawSprite(bb, [x + 0.05 * S(t + i), y, z], 0.025 + 0.035 * tw, i % 4 ? T.glow : T.spark, [1, 1, 1], 0.9 * tw * st.sparkle);
      }
    }

    function drawBoom(st, t, bb, cm) {
      const B = st.boom;
      if (!B) return;
      const age = t - B.t0;
      if (age < 0) return;
      const fire = smooth(span(age, 0, 0.15)) * (1 - smooth(span(age, 0.3, 1.2)));
      drawSprite(bb, B.at, 1.6 + age * 1.5, T.glow, [1, 0.75, 0.4], fire);
      for (let i = 0; i < 14; i++) {
        const a = hash(i, 12) * PI * 2, up = hash(i, 13);
        const d = (0.25 + hash(i, 14) * 0.5) * smooth(span(age, 0, 1.4));
        const pos = addV(B.at, [C(a) * d, 0.1 + up * 0.35 * smooth(span(age, 0, 1.6)) + S(a) * d * 0.4, 0.1]);
        drawSprite(bb, pos, 0.7 + 0.9 * smooth(span(age, 0, 1.4)), T.smoke, [1, 0.86, 0.55], 0.8 * smooth(span(age, 0.05, 0.3)) * (1 - 0.4 * smooth(span(age, 1.2, 1.8))));
      }
      const ringA = smooth(span(age, 0.35, 0.8));
      if (ringA > 0.01) r.draw(Q.ring, M4.chain(M4.translate(B.at[0], B.at[1] - 0.02, B.at[2] + 0.12), M4.rotY(0.25 * S(age * 0.9)), M4.rotX(0.08 * S(age * 1.3))), { tint: [ringA, ringA, ringA] });
      for (let i = 0; i < 24; i++) {
        const a = hash(i, 21) * PI * 2, el = 0.2 + hash(i, 22) * 1.1, sp = 1.2 + hash(i, 23) * 2.4;
        const tt = Math.min(age, 1.4);
        const pos = addV(B.at, [C(a) * C(el) * sp * tt, S(el) * sp * tt - 2.2 * tt * tt, S(a) * C(el) * sp * tt * 0.6 + 0.2]);
        if (pos[1] < 0) continue;
        r.draw(Q.debris, M4.chain(M4.translate(pos[0], pos[1], pos[2]), M4.rotX(age * 7 + i), M4.rotZ(age * 5 + i)), {});
      }
    }

    function drawNight(st, t) {
      const cm = st.camera;
      const bb = billboard(cm);
      const S0 = setFor('night');
      r.draw(S0.base, null, {});
      if (st.moon > 0.001) {
        const s = 2.1 * (st.moonGrow || 1);
        drawSprite(bb, MOON, s * 4.2, T.glow, [0.85, 0.85, 0.95], 0.55 * st.moon);
        r.draw(Q.moon, M4.chain(M4.translate(MOON[0], MOON[1], MOON[2] + 0.5), M4.scale(s)), { noFog: true, tint: [st.moon, st.moon, st.moon] });
      }
      if (st.streaks > 0.001) {
        r.draw(Q.streaks, null, { texture: T.streaks, additive: true, noFog: true, uvScroll: [0.03 * S(t * 0.4), t * 0.11], alpha: 0.85 * st.streaks, tint: [0.85, 0.82, 1] });
        r.draw(Q.streaks, M4.translate(0.3, 0.004, 0), { texture: T.streaks, additive: true, noFog: true, uvScroll: [0.5, -t * 0.07], alpha: 0.5 * st.streaks, tint: [0.75, 0.7, 1] });
      }
      if (st.radio) {
        const g = st.glow || 0;
        r.draw(g > 0.5 ? Q.radioGlow : Q.radioBody, null, {});
        r.draw(Q.radioFront, null, {});
        r.draw(Q.dial, null, { texture: T.dial });
      } else if (st.debris) {
        r.draw(Q.ring, M4.chain(M4.translate(-0.05, 0.03, 0.1), M4.rotX(-PI / 2 + 0.15)), { tint: [0.6, 0.55, 0.45] });
        for (let i = 0; i < 16; i++) r.draw(Q.debris, M4.chain(M4.translate((hash(i, 31) - 0.5) * 1.4, 0.015, (hash(i, 32) - 0.5) * 1.0), M4.rotY(i)), {});
      }
      drawCast(st.cast);
      if (st.radio && st.glow > 0.01) drawSprite(bb, [0.0, 0.4, 0.3], 1.8, T.glow, [1, 0.55, 0.15], 0.5 * st.glow);
      if (st.burst) drawSprite(bb, [GIRL_STAND.x - 0.2, 1.1, GIRL_STAND.z - 0.9], 4.5, T.glow, [0.7, 0.85, 1], 0.9 * st.burst);
      drawPuffs(st, t, bb);
      drawSparkles(st, t, bb);
      drawBoom(st, t, bb, cm);
    }

    function drawPosterScene(st, t) {
      drawCast(st.cast);
      const mic = mics().front;
      r.draw(X.prop('rsMic'), M4.translate(mic[0], mic[1] - 0.035, mic[2]), {});
    }

    function drawWhite(st, t) {
      const W = setFor('white');
      r.draw(W.base, null, {});
      r.draw(W.rig, null, {});
      drawCast(st.cast);
    }

    function drawReels(t) {
      CAB.forEach(([x, z], i) => [-0.14, 0.14].forEach((dx, j) => {
        r.draw(Q.reel, M4.chain(M4.translate(x + dx, 1.32, z + 0.262), M4.rotZ(-t * (1.6 + 0.3 * j) - i)), {});
      }));
    }

    function drawTube(st, t, cm) {
      r.draw(Q.tube, M4.translate(TUBE.x, TUBE.base, TUBE.z), { blend: true, alpha: 0.2, tint: [0.9, 0.95, 1] });
      for (let i = 0; i < 9; i++) {
        const y = TUBE.base + 0.2 + (i / 8) * (TUBE.h - 0.6);
        const a = t * 0.3 + i * 1.7;
        const pos = [TUBE.x + C(a) * 0.18, y + 0.08 * S(t * 0.5 + i), TUBE.z + S(a) * 0.18];
        r.draw(Q.sprite, M4.chain(M4.translate(pos[0], pos[1], pos[2]), billboard(cm), M4.scale(0.75)), { texture: T.puff, blend: true, alpha: 0.18, tint: [1, 1, 1] });
      }
    }

    function drawLabTv(st) {
      r.draw(Q.labTvScreen, M4.chain(labTvMatrix(), M4.translate(0, LAB_TV_Y + 0.03, -0.012)), st.tv ? { texture: T.feeds[0], tint: [0.78, 0.95, 1.12], noFog: true } : { flat: [0.1, 0.16, 0.18, 1] });
    }

    function drawLab(st, t) {
      const cm = st.camera;
      const L = setFor('lab');
      r.draw(L.base, null, {});
      r.draw(Q.wall, M4.translate(0, 0, -4), { texture: st.area === 'breach' ? T.wallBroken : T.wall });
      r.draw(Q.sideWall, null, { texture: T.sideWall });
      r.draw(Q.sign, M4.translate(-3.6, 2.55, -3.98), { texture: T.sign, noFog: true });
      r.draw(labKeysMesh, null, {});
      drawReels(t);
      drawLabTv(st);
      if (st.area !== 'breach') drawCast(st.cast);
      drawTube(st, t, cm);
      const bb = billboard(cm);
      [[-3.6, 0x30d070], [3.4, 0x4a7af0]].forEach(([x, col]) => {
        const c = rgb(col);
        drawSprite(bb, [x, 3.8, 1.3], 1.0, T.glow, [c[0], c[1], c[2]], 0.8);
      });
    }

    function drawStudio(st, t, pink) {
      const D = setFor('studio');
      r.draw(D.floor, null, { texture: T.planks });
      r.draw(D.base, null, {});
      r.draw(D.modular, null, { texture: T.modular });
      drawCast(st.cast);
      [[-0.2, -11.85], [1.6, -11.75], [3.4, -11.9]].forEach(([x, z]) => r.draw(Q.panel, M4.translate(x, 0, z), { blend: true, alpha: 0.12 }));
      if (pink > 0.01) {
        const bb = billboard(st.camera);
        drawSprite(bb, [0.3, 2.2, -11.5], 9, T.glow, [1, 0.3, 0.75], 0.8 * pink);
      }
    }

    function drawPile(st, t) {
      const P = setFor('pile');
      r.draw(P.base, null, {});
      r.draw(Q.pileBg, M4.translate(0, 0, -7), st.sky ? { flat: [0.16, 0.66, 0.94, 1] } : { texture: T.pileBg, noFog: true });
      if (!st.pileGone) {
        const k = st.shatter || 0;
        PILE.forEach((c, i) => {
          const tt = k * 1.8;
          const pos = [c.x + c.v[0] * tt, c.y + c.v[1] * tt, c.z + c.v[2] * tt];
          r.draw(Q.cards[i], M4.chain(M4.translate(pos[0], pos[1], pos[2]), M4.rotY(c.ry + c.spin[1] * tt), M4.rotX(c.rx + c.spin[0] * tt), M4.rotZ(c.rz + c.spin[2] * tt)), { texture: T.radios });
        });
      }
      drawCast(st.cast);
      drawBoom(st, t, billboard(st.camera), st.camera);
    }

    function drawPink(st, t) {
      r.draw(Q.backdrop, null, { tint: [0.92, 0.36, 0.72] });
      drawCast(st.cast);
    }

    function drawTvPile(st, t) {
      const P = setFor('tvpile');
      r.draw(P.base, null, { texture: T.sand });
      r.draw(P.wall, null, { texture: T.radios });
      TVS.forEach((tv, i) => {
        const M = M4.chain(M4.translate(tv.x, tv.y, tv.z), M4.rotY(tv.ry), M4.rotX(-0.08));
        r.draw(Q.tvCabs[i], M, {});
        r.draw(Q.tvScreens[i], M4.chain(M, M4.translate(0, tv.h * 0.06, 0.03)), { texture: T.feeds[i], tint: [0.8, 0.96, 1.1], noFog: true });
      });
    }

    const FEED_ENV = { sunDir: V3.norm([-0.35, -0.45, -0.82]), sunColor: [0.75, 0.75, 0.78], ambTop: [0.72, 0.74, 0.8], ambBottom: [0.5, 0.52, 0.58], fogColor: [0.62, 0.84, 0.95], fogNear: 30, fogFar: 60, points: [] };
    const FEED_BG = { singer: [0.6, 0.84, 0.95], keys: [0.62, 0.86, 0.96], silver: [0.86, 0.92, 0.98], twins: [0.86, 0.6, 0.86], wheel: null };

    function feedWorld(kind, t, st) {
      if (kind === 'singer') {
        const p = base(0, 0, 0, 'apart');
        const reach = st && st.reachOut ? st.reachOut : 0;
        arms(p, ARMS.relax, mixArm(ARMS.relax, [1.45, 0.25, 0.2, 0.15], reach));
        p.neck = [0.05 + 0.04 * (bob(t) - 0.5), 0.1 * S(t * 0.6), 0.04 * S(PI * beatAt(t))];
        p.spine = [0.06 + 0.15 * reach, 0, 0];
        const a = solveActor(finish('singer', 'rsSingerStudio', p, t, 'singer', 'calm'));
        return { cast: [a], cam: { eye: addV(a.head, [0.05, 0.0, 0.78 - 0.2 * reach]), at: headOf(a, [0, -0.1, 0]), fov: 38 } };
      }
      if (kind === 'keys' || kind === 'keysZoom') {
        const a = solveActor(finish('keys', 'rsKeysSilver', keyboardistAt(t, 'rsKeysSilver', WHITE_KEYS), t, 'keys', 'calm'));
        if (kind === 'keysZoom') {
          const k = smooth(span(t, 152.6, 159.9));
          return { cast: [a], rig: true, cam: { eye: mixV([0.9, 1.25, 0.9], [0.32, 1.05, 0.22], k), at: mixV([0, 1.0, -0.3], [0.0, 0.92, -0.12], k), fov: 44 } };
        }
        return { cast: [a], rig: true, cam: { eye: [0.95, 1.2, 1.15], at: [0, 1.05, -0.3], fov: 44 } };
      }
      if (kind === 'silver') {
        const a = solveActor(silverAt(t, 'dance', { x: 0, z: 0, ry: 0 }));
        return { cast: [a], cam: { eye: [0.3, 1.2, 2.6], at: [0, 1.05, 0], fov: 40 } };
      }
      if (kind === 'twins') {
        const c = [twinAt(t, 0, 'sing', { x: -0.17, z: 0, ry: 0.35 }), twinAt(t, 1, 'sing', { x: 0.2, z: 0.12, ry: -0.3 })].map(solveActor);
        return { cast: c, cam: { eye: [0.05, 1.5, 1.05], at: [0.02, 1.42, 0], fov: 40 } };
      }
      return { cast: [], wheel: true, cam: { eye: [0, 0, 1.6], at: [0, 0, 0], fov: 40 } };
    }

    function renderFeed(kind, t, rect, tex, st) {
      const F = feedWorld(kind, t, st);
      const bg = FEED_BG[kind === 'keysZoom' ? 'keys' : kind];
      r.begin(Object.assign({}, FEED_ENV, { fogColor: bg || [0.3, 0.7, 0.9] }), Object.assign({ up: [0, 1, 0], near: 0.03, far: 40 }, F.cam), rect);
      if (F.wheel) {
        r.draw(Q.unit, M4.chain(M4.translate(-2, -1.5, -1), M4.scale(4, 3, 1)), { texture: T.wheelBg, noFog: true });
        r.draw(Q.wheel, M4.chain(M4.rotY(t * 0.9), M4.rotX(0.4)), {});
      } else {
        if (F.rig) r.draw(setFor('white').rig, null, {});
        drawCast(F.cast);
      }
      tally();
      r.grab(tex, rect.x, rect.y, rect.w, rect.h);
    }

    function renderPoster(st, t) {
      const front = st.poster.mode === 'front';
      const a = solveActor(singerPoster(t, front));
      const mic = mics()[front ? 'front' : 'side'];
      const head = a.head;
      const camPose = front
        ? { eye: addV(head, [0.0, -0.02, 0.66]), at: addV(head, [0.0, -0.08, 0]), fov: 38 }
        : { eye: addV(head, [0.0, -0.08, 0.98]), at: addV(head, [0.27, -0.2, 0]), fov: 40 };
      r.begin(envFor({ light: 'poster', camera: Object.assign({ up: [0, 1, 0] }, camPose) }), Object.assign({ up: [0, 1, 0], near: 0.03, far: 20, colorM: POSTER_M, colorAdd: POSTER_ADD }, camPose), FULL);
      drawCast([a]);
      r.draw(X.prop('rsMic'), M4.translate(mic[0], mic[1] - 0.035, mic[2]), {});
      tally();
      r.grab(T.poster, 0, 0, FW, FH);
    }

    function overlayTex(tex, alpha, mode) {
      tally();
      r.begin(OVER_ENV, { proj: ORTHO, view: M4.ident() }, FULL, true);
      r.draw(mode === 'flip' ? Q.flip : Q.unit, M4.scale(FW, FH, 1), { texture: tex, noFog: true, additive: mode !== 'blend', blend: mode === 'blend', alpha });
    }

    function overlayFlat(col, alpha) {
      if (alpha <= 0.001) return;
      tally();
      r.begin(OVER_ENV, { proj: ORTHO, view: M4.ident() }, FULL, true);
      r.draw(Q.unit, M4.scale(FW, FH, 1), { flat: [col[0], col[1], col[2], alpha], blend: true, noFog: true });
    }

    function overlayIris(k) {
      if (k >= 1) return;
      tally();
      r.begin(OVER_ENV, { proj: ORTHO, view: M4.ident() }, FULL, true);
      const rad = lerp(18, 340, smooth(k));
      r.draw(Q.ringIris, M4.chain(M4.translate(FW / 2, FH / 2, 0), M4.scale(rad, rad, 1)), { flat: [0, 0, 0, 1], noFog: true });
    }

    function feedsFor(st, t) {
      if (st.poster && st.poster.alpha > 0.001) renderPoster(st, t);
      if (st.tv) renderFeed(st.tv, t, FEEDS[0], T.feeds[0]);
      if (st.tvs) {
        const sw = st.swap || 0;
        TVS.forEach((tv, i) => {
          let kind = tv.feed;
          if (i === 1 && st.swap !== undefined) kind = sw > 0.5 ? 'keysZoom' : 'singer';
          renderFeed(kind, t, FEEDS[i], T.feeds[i], i === 1 ? { reachOut: smooth(span(t, 145.0, 146.2)) * (1 - smooth(span(t, 148.2, 149.5))) } : null);
        });
      }
    }

    function drawWorld(st, t) {
      feedsFor(st, t);
      const env = envFor(st);
      const scene = st.scene;
      const camera = Object.assign({}, st.camera);
      if (scene === 'poster') Object.assign(camera, { colorM: POSTER_M, colorAdd: POSTER_ADD });
      if (scene === 'lab' && st.area === 'breach') {
        r.clear([1, 1, 1]);
        r.begin(envFor(Object.assign({}, st, { light: 'studioPink' })), camera, FULL);
        drawStudio(st, t, st.pinkBeyond || 0);
        tally();
        r.begin(env, camera, FULL, true);
        drawLab(st, t);
      } else {
        r.clear(env.fogColor);
        r.begin(env, camera, FULL);
        if (scene === 'night') drawNight(st, t);
        else if (scene === 'poster') drawPosterScene(st, t);
        else if (scene === 'white') drawWhite(st, t);
        else if (scene === 'lab') drawLab(st, t);
        else if (scene === 'studio') drawStudio(st, t, st.pinkBeyond || 0);
        else if (scene === 'pile') drawPile(st, t);
        else if (scene === 'pink') drawPink(st, t);
        else drawTvPile(st, t);
      }
      tally();
      if (st.poster && st.poster.alpha > 0.001) {
        const m = st.poster.mode;
        if (m === 'left' || m === 'duet' || m === 'front') overlayTex(T.poster, st.poster.alpha, 'add');
        if (m === 'right' || m === 'duet') overlayTex(T.poster, st.poster.alpha, 'flip');
      }
      if (st.dim) overlayFlat([0, 0, 0], st.dim);
      if (st.iris !== undefined) overlayIris(st.iris);
    }

    return {
      warm() {
        ['night', 'white', 'lab', 'studio', 'pile', 'tvpile'].forEach(setFor);
        mics();
        keysPoint();
        X.prop('rsMic');
        X.prop('rsBass');
      },
      render(t) {
        polys = 0;
        r.polys = 0;
        const shot = shotAt(t);
        const st = worldFor(t, shot);
        const mixK = shot.mix && t < shot.start + shot.mix ? smooth((t - shot.start) / shot.mix) : 1;
        if (mixK < 1 && shot.index > 0) {
          const pst = worldFor(t, SHOTS[shot.index - 1]);
          drawWorld(pst, t);
          tally();
          r.grab(T.prev, 0, 0, FW, FH);
        }
        drawWorld(st, t);
        if (mixK < 1 && shot.index > 0) overlayTex(T.prev, 1 - mixK, 'blend');
        overlayFlat([1, 1, 1], flashAt(t));
        overlayFlat([1, 1, 1], whiteAt(t));
        tally();
        return { shot, polys: Math.round(polys), fade: fadeAt(t), overlay: null };
      }
    };
  }

  const clip = {
    id: 'video-killed-the-radio-star',
    number: 11,
    artist: 'The Buggles',
    title: 'Video Killed The Radio Star',
    originalYear: 1979,
    audio: 'content/clip/The Buggles - Video Killed The Radio Star.mp3',
    duration: DURATION,
    bpm: BPM,
    beat0: BEAT0,
    poster: 21.5,
    locations: LOCATIONS,
    shots: SHOTS,
    looks: CHARACTERS,
    shotAt,
    stage,
    fadeAt,
    flashAt,
    whiteAt,
    voiceAt,
    mouthFor,
    energyAt,
    create
  };

  window.poligonClips = window.poligonClips || [];
  if (!window.poligonClips.some(c => c.id === clip.id)) window.poligonClips.unshift(clip);
})();
