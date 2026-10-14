(function () {
  const { M4, V3, Builder, shade, rand, cookieMatrix } = window.P3D;
  const { Figure, restPose } = window.P3DFigure;
  const { texNoise, texGlow } = window.P3DParanoiaKit.tex;

  const BPM = 120;
  const BEAT0 = 0.19;
  const DURATION = 164;
  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (x) => { const k = clamp(x, 0, 1); return k * k * (3 - 2 * k); };
  const frac = (x) => x - Math.floor(x);
  const lerp = (a, b, k) => a + (b - a) * k;
  const mixv = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
  const beatAt = (t) => ((t - BEAT0) * BPM) / 60;
  const bang = (b) => { const k = 0.5 + 0.5 * C(PI * 2 * b); return k * k; };
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const pulse = (t, a, b) => S(PI * span(t, a, b));

  const FW = 512;
  const FH = 288;
  const MAIN = { x: 0, y: 48, w: FW, h: FH };

  const LOCATIONS = [
    { id: 'desk', name: 'Стол президента', color: '#8a1418', scene: 'oval' },
    { id: 'office', name: 'Овальный кабинет', color: '#e0b48a', scene: 'oval' },
    { id: 'seal', name: 'Герб на ковре', color: '#f0a020', scene: 'oval' },
    { id: 'stage', name: 'Сцена WAR', color: '#e01818', scene: 'stage' },
    { id: 'posters', name: 'Плакаты', color: '#8aa06a', scene: 'posters' },
    { id: 'globe', name: 'Глобус и бассейн', color: '#20a8e8', scene: 'globe' },
    { id: 'flag', name: 'Флаг', color: '#2a3a8a', scene: 'flag' },
    { id: 'spot', name: 'Прожектор', color: '#f4f0d8', scene: 'oval' },
    { id: 'exit', name: 'Выход', color: '#6a3a2a', scene: 'oval' }
  ];

  const SHOT_LIST = [
    [0, 'desk', 'deskMax'],
    [8.014, 'desk', 'samClose'],
    [9.638, 'desk', 'maxClose'],
    [11.11, 'office', 'calendar'],
    [18.688, 'desk', 'two'],
    [20.701, 'office', 'shelfSign'],
    [28.398, 'office', 'shelfClose'],
    [36.128, 'office', 'nutcracker'],
    [38.327, 'desk', 'two'],
    [39.968, 'office', 'sofa'],
    [45.618, 'desk', 'two'],
    [47.986, 'office', 'fireplace'],
    [51.589, 'seal', 'seal'],
    [54.584, 'desk', 'globe'],
    [58.356, 'office', 'eagle'],
    [62.213, 'office', 'dance'],
    [69.487, 'office', 'door'],
    [72.582, 'stage', 'warWide'],
    [75.289, 'stage', 'warTilt'],
    [77.217, 'stage', 'warSide'],
    [79.281, 'posters', 'peepers'],
    [81.581, 'globe', 'dome'],
    [86.098, 'globe', 'lid'],
    [86.808, 'globe', 'rim'],
    [90.09, 'globe', 'pool'],
    [95.435, 'posters', 'giveMe'],
    [101.305, 'flag', 'star'],
    [107.429, 'flag', 'line'],
    [112.588, 'flag', 'kicks'],
    [116.665, 'desk', 'iris'],
    [122.298, 'office', 'couch'],
    [127.407, 'desk', 'ring'],
    [135.019, 'spot', 'march'],
    [143.815, 'spot', 'portrait'],
    [144.559, 'spot', 'above'],
    [145.151, 'spot', 'portrait'],
    [145.642, 'spot', 'monkey'],
    [146.234, 'spot', 'portrait'],
    [147.097, 'spot', 'bell'],
    [147.909, 'spot', 'portrait'],
    [151.647, 'exit', 'exit'],
    [160.815, 'desk', 'final'],
    [163.217, 'desk', 'maxEnd']
  ];

  const EMPTY_CAMS = ['nutcracker', 'door', 'warWide', 'star', 'exit'];

  const SHOTS = SHOT_LIST.map(([start, loc, cam], i) => ({
    index: i,
    start,
    end: i + 1 < SHOT_LIST.length ? SHOT_LIST[i + 1][0] : DURATION,
    loc,
    cam,
    scene: LOCATIONS.find(l => l.id === loc).scene,
    emptyOk: EMPTY_CAMS.includes(cam),
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

  function fadeAt(t) {
    if (t < 0.5) return 1 - t / 0.5;
    return t > DURATION - 0.12 ? clamp((t - (DURATION - 0.12)) / 0.1, 0, 1) : 0;
  }

  const VOICE = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000nzzznrrqon000ovtvmlpsrsrsssql00000ostsuvusrsqonnnkkkkjh00000000000000000000000000006bdhouxzzxsqkktxzwrpprxwllj00jnttuwxzyxyzzyzzxyxxrnmlkiifadd7000000000000008bgqtuywxwvulga0ensvugf00imstuvxztkswzzzzxk0llkppruutvslgge400000009adfgghmqtsi00khgggf0kpropqrqqlkkhmsstwyzttsqklljfeedccegd000000000000000000000000000000000000000gnvxxxmprotzzzzzvvurxxuqqqttuvuvvvxxxxyyyxyyxxwxxwwxxxwxuutsooljkj000000000000000000aqwwwyvctyzyyvnlzxtuugivzvrsvttuuuutututttttttsrtssvupvyvvwvusc40ehidkltuyzzyzu30000000afnttvwwyyo533000004biklooputuuwwvuth98mtwyzzh6e7noqvwcecbfkpqrsrsttvvvvuvttsstuvttuutuuttvttttsrpnkkkifecb0000000000000000000000000inotvsnnmljeigce00000glprtvwyzxyyxxxxxwwvwwwwvwxvwwvttstqssqorrqqpolkljjggatzpja0hj87el00yso00jwxxvwvutvribnvsh0jqqrzzpqtuyyqqvutgnokmmkswvxwj0lwvvvwxsvwwvuzzustxxxmnvvvxxwtrrqie000000000000000000ilf00000luututpinwwvyyyttttsii0000000000000nrqvvwsrxxotxvvklvyyxyxyywrqvwvsjtutusa6uwxxxvttrsd8dwzvrpauqi3vzzsvxwnfbzzxqrmjjimsurqkliigjjrqphhjihiimnkcjklikhfcfyu028mnmpo0pl809qonojhlmlkkooq0pt024ilnpolj0lzyvso06510jutopoxvuppqsyytriepwvpoonpldc76100ce000001mzztd9vuzzxwsrxzyurvwrrkf6gi008c8a000aqnovwk33ezturrn9psusnilhkporssrpnututroklhqosrrnpoqm7120000eh4lwwtoljqprne0kg00lljj0muvvutvwtuoqurmavtqzzy3vszzxrmvvqsrnxxvttuustxzzyyxxvpppyzyyyzyvvuxyyxwxxvvtvxwwvwvsrkgb765562300000000000000h0000000000000loppopnf0000hnl00000xzywur000000000000000000000gg0000q0000000qon00000000ig00000000000jonnnn00pqm0000mqqppmijkj00gmok00dsgb0h000id0cda0dyzs0pwwzzzsktwwyzyuuusqmmpooong0000000nnf0000qrqpni000000000000000000000jjno000000000kqrrrqmj000000000stq0000lyzwwwwtrywr0000zzzywzzyxwk0kutn000000pro0000000zt000qopurusuxum0000npn00000000000000000npl0000000000uvr000000000000000xz0000000000000000000000000000000000000lm0000000000000000lmk00000000000000pqm00000nuvrrnj0000dzzzzzwwwzyzzyxusuun000gsttttsrnon00qvvo0000tuuusrj00000000000mlg0000stsm0000pqm0000uywwvvt00000000000ln00000qrssqposvtl0000lrrqqqqkoj0000000000hmlke00000hzzzzzywvvuusxwywzyxwvwvttssqrrpqm0000000000000000momjhf0000000000000000009sroponml0opnttkkif00000000lzzwywutuuqplprrqsq00000qzyvvk0pqon000000djjc00tyzxn000000000000nxxyyssuusrooorsuj000000etzzwwusri0ipplmlhsrpntspi00000000000epvyzzzzxtupl0000000jprihlmoonkffhb30009ba30cmknmlkijjmqmlmrpnqpmke900cjkosuwxzxzxyxxzvyzzzxxxyzyyxyyvutrrrrqrokihcb750000ajhnsutssrqrkd900000000000fvxrssgvttuntsiivvvgnzzyuvwwwvvujsrrn0nsqszzwmrvwwtttxuusvwwvuwyunsovuurptuurtpttsyzzxrtwyyuuyyyxyxvwtrn00000000000000000000000qwwvwvvutpkuvvtutturqrqonk0000000qvwyyuttxxvupttbctvtsestuwxvzyxtnottr0boovzoijrqpqrsrojcclwwtmqzyopetspsxywoqtzzsopuxvvvtxust9wwowuvtonijilhg50000000000073yzupmrtqa0pqnnetuuvwqppjjivvvtpqpdd8wvrqmffdbwsupm80000cfihkgbghjmehc9bedccdfhhhwwlirzzvtruvilutyzutxsieknwzwvogggdovqqparrlgf40fe57400aih2ktuwwunuzvurhghrsvvuwwvuonkjgg830000000000vwxb5vywrrvs67mokfdrzx97fystml417bzvxtvzvqjkidzyolph09fljkmkomuqunrrinrihjqztuqm3kioqrqh0stl9iwuqooqtpieecnwskka0imoppqojkjaikokjkllicbdlopooplfedc700000000003yzxtqzxxvnwzyvnwzzyxzyvqoqyvutsuuh80000cwzzxurnloqyxuxvmf6qytsqqqorrqqmpup00zzzwooesvwvvcqwwurwyzxwwyywvvzzywwuqppxyxwwwvvwvvvvvvvuuuuvtttvr000hjgffeed000a9000000000000000000000000000000000000000000lsxyzywsqi0000000nxvlmyzykrsttzzxyxovvv';
  const VOICE_LV = Array.from(VOICE, ch => parseInt(ch, 36) / 35);

  function voiceAt(t) {
    const f = t * 20;
    const i = Math.floor(f);
    if (i < 0 || i >= VOICE_LV.length) return 0;
    const a = VOICE_LV[i], b = VOICE_LV[i + 1] || 0;
    return a + (b - a) * (f - i);
  }

  const SOLO = [[5.4, 39.9], [48.2, 63.9], [116.4, 120.9], [134.6, 151.9]];
  const CHORUS = [[39.9, 48.2], [63.9, 70.2], [120.9, 134.6], [151.9, 159.9]];
  const SCAT = [[93.5, 104.2], [107.2, 109.2]];
  const LINES = [
    { start: 162, end: 162.64, who: 'sam', text: 'Ну…' },
    { start: 162.84, end: 164, who: 'max', text: 'Давай больше так не будем.' }
  ];
  const within = (list, t) => list.some(([a, b]) => t >= a && t < b);

  function mouthFor(role, t) {
    const v = voiceAt(t);
    if (role === 'superball') {
      if (within(SOLO, t) || within(CHORUS, t)) return v;
      return within(SCAT, t) ? v * 0.7 : 0;
    }
    if (role === 'agent') return within(CHORUS, t) ? v * 0.9 : 0;
    const line = LINES.find(l => l.who === role && t >= l.start && t < l.end);
    return line ? v : 0;
  }

  function lineAt(t) {
    return LINES.find(l => t >= l.start - 0.05 && t < l.end + 0.15) || null;
  }

  const DIMS = {
    agent: { hip: 0.1, thigh: 0.47, shin: 0.45, sole: 0.06, shoulder: 0.238, upper: 0.31, fore: 0.27, torso: 0.56, waist: 0.15, chest: 0.2, depth: 0.12, headR: 0.12 },
    sam: { hip: 0.11, thigh: 0.37, shin: 0.35, sole: 0.065, shoulder: 0.262, upper: 0.3, fore: 0.27, torso: 0.55, waist: 0.2, chest: 0.25, depth: 0.17, headR: 0.15 },
    max: { hip: 0.075, thigh: 0.15, shin: 0.14, sole: 0.045, shoulder: 0.135, upper: 0.15, fore: 0.13, torso: 0.3, waist: 0.15, chest: 0.155, depth: 0.135, headR: 0.15 }
  };
  const SOLVERS = {};
  Object.keys(DIMS).forEach(k => { SOLVERS[k] = { d: DIMS[k], scale: 1 }; });
  const legLen = (kind) => DIMS[kind].thigh + DIMS[kind].shin + DIMS[kind].sole;

  const LOOKS = {
    superball: { name: 'Агент Суперболл', skin: [0.91, 0.82, 0.68, 0.1], hair: 0x5a3a24, suit: 0x2a1c1c, shirt: 0xf0ece4, tie: 0xb0283a, stripe: 0xf0dcd4, shoe: 0x141010 },
    agent: { name: 'Агенты Секретной службы', skin: [0.91, 0.82, 0.68, 0.1], hair: 0x5a3a24, suit: 0x2a1c1c, shirt: 0xf0ece4, tie: 0xb0283a, stripe: 0xf0dcd4, shoe: 0x141010 },
    sam: { name: 'Сэм', fur: 0xa8582c, dark: 0x6e3216, nose: [0.07, 0.05, 0.05, 0], suit: 0x5e6676, shirt: 0xf0f0f0, tie: 0x2050b0, stripe: 0x101828, hat: 0x6a6c74, band: 0x1a1a1e, shoe: 0x3a2414 },
    max: { name: 'Макс', fur: 0xeceaf2, inner: 0xf0c4cc, nose: 0xe8909a }
  };

  function solveActor(a) {
    const m = Figure.prototype.solve.call(SOLVERS[a.kind], a.pose);
    a.m = m;
    a.head = M4.point(m.head, [0, 0, 0]);
    a.hips = M4.point(m.hips, [0, 0, 0]);
    return a;
  }

  function base(x, z, ry) {
    const p = restPose();
    p.x = x;
    p.z = z;
    p.ry = ry || 0;
    p.shL = [0.06, 0, 0.1];
    p.shR = [0.06, 0, 0.1];
    p.elL = [0.22, 0, 0];
    p.elR = [0.22, 0, 0];
    return p;
  }

  function face(from, to) {
    return Math.atan2(to[0] - from[0], to[1] - from[1]);
  }

  function setArms(p, l, r) {
    if (l) { p.shL = [l[0], l[1], l[2]]; p.elL = [l[3], 0, 0]; }
    if (r) { p.shR = [r[0], r[1], r[2]]; p.elR = [r[3], 0, 0]; }
    return p;
  }

  const ARM = {
    rest: [0.06, 0, 0.1, 0.22],
    present: [0.35, 0, 0.42, 0.5],
    wide: [0.3, 0, 0.75, 0.3],
    chest: [0.06, -1.04, 0.38, 2.17],
    cup: [1.57, -0.01, 0.6, 1.98],
    pray: [0.07, -1.05, 0.77, 1.88],
    fist: [1.0, 0.22, -0.05, 2.58],
    foldL: [0.21, -1.4, 0.59, 1.69],
    foldR: [0.45, -1.05, -0.04, 1.62],
    wave: [1.45, 1.0, 0, 1.5],
    thumb: [1.1, 0, 0.15, 1.2],
    point: [2.35, 0.1, 0.45, 0.1]
  };

  function arms(p, l, r, k) {
    const kk = k === undefined ? 1 : k;
    const L = mixv(ARM.rest, typeof l === 'string' ? ARM[l] : l, kk);
    const R = mixv(ARM.rest, typeof r === 'string' ? ARM[r] : r, kk);
    return setArms(p, L, R);
  }

  function singHead(p, t, amt) {
    const a = amt === undefined ? 1 : amt;
    p.neck = [-0.08 * a + 0.04 * S(t * 2.1), 0.12 * S(t * 0.9) * a, 0.07 * S(t * 1.3) * a];
    return p;
  }

  function bounce(p, b, amt) {
    const k = bang(b) * (amt === undefined ? 1 : amt);
    p.knL = [0.08 + 0.22 * k, 0, 0];
    p.knR = [0.08 + 0.22 * k, 0, 0];
    p.hipL = [0.05 + 0.12 * k, 0, 0.04];
    p.hipR = [0.05 + 0.12 * k, 0, 0.04];
    return p;
  }

  function sway(p, b, amt) {
    const a = amt === undefined ? 1 : amt;
    const s = S(PI * b);
    p.spine = [0.02, 0.05 * s * a, 0.09 * s * a];
    p.neck = [0, -0.06 * s * a, -0.08 * s * a];
    p.hipL = [0.04, 0, 0.04 + 0.08 * Math.max(0, s) * a];
    p.hipR = [0.04, 0, 0.04 + 0.08 * Math.max(0, -s) * a];
    p.knL = [0.06 + 0.2 * Math.max(0, -s) * a, 0, 0];
    p.knR = [0.06 + 0.2 * Math.max(0, s) * a, 0, 0];
    return p;
  }

  function jazz(p, b, t) {
    bounce(p, b, 0.8);
    const shake = 0.14 * S(t * 31);
    const s = S(PI * b);
    setArms(p, [1.45 + 0.12 * s, 0.9 + shake, 0, 1.35 + 0.15 * s], [1.45 - 0.12 * s, 0.9 - shake, 0, 1.35 - 0.15 * s]);
    p.spine = [-0.06, 0.08 * s, 0.06 * s];
    return p;
  }

  function swing(p, b, t) {
    const k = bang(b);
    const s = S(PI * b);
    p.knL = [0.4 + 0.4 * k, 0, 0];
    p.knR = [0.4 + 0.4 * k, 0, 0];
    p.hipL = [0.32 + 0.28 * k, 0, 0.14 + 0.12 * Math.max(0, s)];
    p.hipR = [0.32 + 0.28 * k, 0, 0.14 + 0.12 * Math.max(0, -s)];
    p.spine = [0.2, 0.2 * s, 0];
    setArms(p, [0.65 + 0.45 * s, 0.3, 0, 1.95], [0.65 - 0.45 * s, 0.3, 0, 1.95]);
    p.neck = [-0.08, -0.18 * s, 0];
    return p;
  }

  function cossack(p, b) {
    const beat = Math.floor(b);
    const k = frac(b);
    const kickL = beat % 2 === 0;
    const out = k < 0.5 ? S(PI * k * 2) : 0;
    p.hipL = kickL ? [lerp(1.75, 1.15, out), 0, 0.35] : [1.75, 0, 0.35];
    p.knL = kickL ? [lerp(2.3, 0.15, out), 0, 0] : [2.3, 0, 0];
    p.hipR = !kickL ? [lerp(1.75, 1.15, out), 0, 0.35] : [1.75, 0, 0.35];
    p.knR = !kickL ? [lerp(2.3, 0.15, out), 0, 0] : [2.3, 0, 0];
    p.spine = [-0.1, 0, 0];
    p.neck = [0.05, 0, 0];
    setArms(p, ARM.foldL, ARM.foldR);
    return p;
  }

  function kickStep(p, b, height) {
    const h = height === undefined ? 1 : height;
    const beat = Math.floor(b);
    const k = frac(b);
    const up = S(PI * k) * h;
    const left = beat % 2 === 0;
    p.hipL = left ? [1.5 * up, 0, 0.08] : [0.05, 0, 0.06];
    p.knL = left ? [0.25 * up, 0, 0] : [0.12 + 0.15 * up, 0, 0];
    p.hipR = !left ? [1.5 * up, 0, 0.08] : [0.05, 0, 0.06];
    p.knR = !left ? [0.25 * up, 0, 0] : [0.12 + 0.15 * up, 0, 0];
    p.spine = [-0.12 * up, 0, 0];
    return p;
  }

  function walk(p, ph, amt) {
    const a = amt === undefined ? 1 : amt;
    const s = S(ph * PI * 2);
    const c = C(ph * PI * 2);
    p.hipL = [0.45 * s * a, 0, 0.04];
    p.hipR = [-0.45 * s * a, 0, 0.04];
    p.knL = [0.1 + 0.5 * Math.max(0, -c) * a, 0, 0];
    p.knR = [0.1 + 0.5 * Math.max(0, c) * a, 0, 0];
    setArms(p, [-0.45 * s * a + 0.05, 0, 0.1, 0.3], [0.45 * s * a + 0.05, 0, 0.1, 0.3]);
    p.spine = [0.05, 0.08 * s * a, 0];
    p.lift = 0.02 * Math.abs(c) * a;
    return p;
  }

  function lying(kind, p, opts) {
    const o = opts || {};
    const d = DIMS[kind];
    const pv = legLen(kind) + 0.1 + d.torso * 0.45;
    p.ground = false;
    p.pivot = pv;
    p.rx = o.rx === undefined ? -PI / 2 : o.rx;
    p.rz = o.rz || 0;
    p.y = (o.h || 0) - pv + (o.thick === undefined ? d.depth + 0.02 : o.thick);
    return p;
  }

  function seated(kind, p, seatY) {
    p.ground = false;
    p.y = seatY - legLen(kind);
    p.hipL = [1.5, 0, 0.12];
    p.hipR = [1.5, 0, 0.12];
    p.knL = [1.5, 0, 0];
    p.knR = [1.5, 0, 0];
    return p;
  }

  function actor(id, kind, look, pose, role, extra) {
    return Object.assign({ id, kind, look, pose, role: role || kind, hidden: false }, extra || {});
  }

  function cam(eye, at, fov, roll) {
    const f = V3.norm(V3.sub(at, eye));
    let rt = V3.cross(f, [0, 1, 0]);
    if (V3.len(rt) < 1e-4) rt = [1, 0, 0];
    rt = V3.norm(rt);
    const up0 = V3.cross(rt, f);
    const rl = roll || 0;
    return { eye, at, fov, up: V3.add(V3.mul(up0, C(rl)), V3.mul(rt, S(rl))), near: 0.05, far: 90 };
  }

  function drift(t, k) {
    return [0.02 * S(t * 0.7) * k, 0.012 * S(t * 0.9 + 1) * k, 0.015 * S(t * 0.6 + 2) * k];
  }

  function starPath(ctx, x, y, ro, ri, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * PI * 2 - PI / 2 + (rot || 0);
      const r = i % 2 ? ri : ro;
      if (i) ctx.lineTo(x + C(a) * r, y + S(a) * r); else ctx.moveTo(x + C(a) * r, y + S(a) * r);
    }
    ctx.closePath();
  }

  function outlined(ctx, text, x, y, fill, stroke, width) {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }

  function drawMaxFace(kind) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      [[90, 1], [166, -1]].forEach(([x, s]) => {
        ctx.fillStyle = '#100c12';
        ctx.beginPath();
        ctx.ellipse(x, 76, 10, 15, s * 0.16, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(x - 3, 70, 2.6, 0, PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#e0838f';
      ctx.beginPath();
      ctx.ellipse(128, 106, 9, 5.5, 0, 0, PI * 2);
      ctx.fill();
      const dark = '#22101a';
      const outline = (depth) => {
        ctx.beginPath();
        ctx.moveTo(30, 118);
        ctx.quadraticCurveTo(128, 136, 226, 118);
        ctx.quadraticCurveTo(128, depth, 30, 118);
        ctx.closePath();
      };
      if (kind === 'grin') {
        outline(262);
        ctx.fillStyle = '#ece8de';
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = 'rgba(80,60,90,0.3)';
        ctx.fillRect(0, 118, 256, 16);
        ctx.restore();
        ctx.strokeStyle = dark;
        ctx.lineWidth = 9;
        outline(262);
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i <= 10; i++) {
          const x = lerp(44, 212, i / 10);
          const y = i % 2 ? 178 : 146;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.lineWidth = 6;
        ctx.stroke();
      } else {
        const depth = kind === 'open2' ? 300 : 280;
        outline(depth);
        ctx.fillStyle = '#360c18';
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#c4465a';
        ctx.beginPath();
        ctx.ellipse(128, depth * 0.5 + 66, 42, 20, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ece8de';
        ctx.beginPath();
        ctx.moveTo(22, 110);
        for (let i = 0; i <= 10; i++) ctx.lineTo(lerp(40, 216, i / 10), i % 2 ? 156 : 130);
        ctx.lineTo(234, 110);
        ctx.closePath();
        ctx.fill();
        const low = depth * 0.5 + 58;
        ctx.beginPath();
        ctx.moveTo(52, low + 30);
        for (let i = 0; i <= 8; i++) ctx.lineTo(lerp(60, 196, i / 8), i % 2 ? low - 18 : low + 4);
        ctx.lineTo(204, low + 30);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = dark;
        ctx.lineWidth = 9;
        outline(depth);
        ctx.stroke();
      }
      ctx.restore();
    };
  }

  function drawSeal(ctx, cx, cy, R) {
    ctx.fillStyle = '#e8902a';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a85a14';
    ctx.lineWidth = R * 0.02;
    ctx.stroke();
    ctx.fillStyle = '#f6e6c4';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.8, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#26285a';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.66, 0, PI * 2);
    ctx.fill();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * PI * 2;
      ctx.fillStyle = '#ffd25a';
      starPath(ctx, cx + C(a) * R * 0.9, cy + S(a) * R * 0.9, R * 0.045, R * 0.019, a);
      ctx.fill();
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2;
      ctx.fillStyle = '#e8a83a';
      starPath(ctx, cx + C(a) * R * 0.73, cy + S(a) * R * 0.73, R * 0.035, R * 0.015, a);
      ctx.fill();
    }
    ctx.strokeStyle = '#ffd25a';
    ctx.lineWidth = R * 0.012;
    for (let i = 0; i < 26; i++) {
      const a = PI * 1.12 + (i / 25) * PI * 0.76;
      ctx.beginPath();
      ctx.moveTo(cx + C(a) * R * 0.2, cy - R * 0.06 + S(a) * R * 0.2);
      ctx.lineTo(cx + C(a) * R * 0.6, cy - R * 0.06 + S(a) * R * 0.6);
      ctx.stroke();
    }
    ctx.fillStyle = '#fbf6ea';
    ctx.beginPath();
    ctx.ellipse(cx, cy - R * 0.36, R * 0.3, R * 0.09, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a5524';
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(cx + s * R * 0.06, cy - R * 0.06);
      ctx.quadraticCurveTo(cx + s * R * 0.42, cy - R * 0.42, cx + s * R * 0.5, cy - R * 0.04);
      ctx.quadraticCurveTo(cx + s * R * 0.38, cy + R * 0.18, cx + s * R * 0.1, cy + R * 0.16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5a3414';
      ctx.lineWidth = R * 0.01;
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + s * R * 0.1, cy + R * 0.02);
        ctx.lineTo(cx + s * R * (0.12 + i * 0.07), cy - R * (0.32 - i * 0.05));
        ctx.stroke();
      }
    });
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy - R * 0.14, R * 0.075, R * 0.09, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0b020';
    ctx.beginPath();
    ctx.moveTo(cx + R * 0.02, cy - R * 0.12);
    ctx.lineTo(cx + R * 0.1, cy - R * 0.09);
    ctx.lineTo(cx + R * 0.02, cy - R * 0.07);
    ctx.fill();
    const sx = cx - R * 0.13, sy = cy - R * 0.03, sw = R * 0.26, sh = R * 0.3;
    ctx.fillStyle = '#2a3a8a';
    ctx.fillRect(sx, sy, sw, sh * 0.3);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#c8202a';
      ctx.fillRect(sx + (i * sw) / 7, sy + sh * 0.3, sw / 7 + 0.5, sh * 0.5);
    }
    ctx.beginPath();
    ctx.moveTo(sx, sy + sh * 0.8);
    ctx.quadraticCurveTo(cx, cy + R * 0.42, sx + sw, sy + sh * 0.8);
    ctx.fillStyle = '#c8202a';
    ctx.fill();
    ctx.fillStyle = '#fbf6ea';
    ctx.save();
    ctx.translate(cx, cy - R * 0.25);
    ctx.rotate(-0.12);
    ctx.fillRect(-R * 0.22, -R * 0.035, R * 0.44, R * 0.07);
    ctx.fillStyle = '#5a2a14';
    ctx.font = `bold ${Math.round(R * 0.055)}px Georgia`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E PLURIBUS UNUM', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(cx + R * 0.28, cy + R * 0.3);
    ctx.rotate(0.18);
    ctx.fillStyle = '#d0201c';
    ctx.fillRect(-R * 0.08, -R * 0.1, R * 0.16, R * 0.2);
    ctx.fillStyle = '#f8d040';
    ctx.font = `bold ${Math.round(R * 0.07)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAS', 0, R * 0.02);
    ctx.fillStyle = '#202020';
    ctx.fillRect(-R * 0.03, -R * 0.14, R * 0.06, R * 0.04);
    ctx.restore();
    ctx.save();
    ctx.translate(cx - R * 0.3, cy + R * 0.26);
    ctx.rotate(-0.4);
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(-R * 0.07, -R * 0.06, R * 0.14, R * 0.12);
    ctx.fillStyle = '#c03030';
    ctx.fillRect(-R * 0.07, -R * 0.02, R * 0.14, R * 0.025);
    ctx.fillStyle = '#3050a0';
    ctx.fillRect(-R * 0.03, -R * 0.12, R * 0.02, R * 0.08);
    ctx.fillRect(R * 0.01, -R * 0.13, R * 0.02, R * 0.08);
    ctx.restore();
  }

  function drawSealTex(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    drawSeal(ctx, w / 2, h / 2, w * 0.49);
  }

  function drawRug(ctx, w, h) {
    texNoise('#1c2452', 31, 0.12)(ctx, w, h);
    const cx = w / 2, cy = h / 2;
    ctx.strokeStyle = '#d8dcea';
    ctx.lineWidth = w * 0.05;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.44, h * 0.44, 0, 0, PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#e0b040';
    ctx.lineWidth = w * 0.006;
    [0.414, 0.466].forEach(k => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * k, h * k, 0, 0, PI * 2);
      ctx.stroke();
    });
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * PI * 2;
      ctx.fillStyle = '#e8b030';
      starPath(ctx, cx + C(a) * w * 0.44, cy + S(a) * h * 0.44, w * 0.016, w * 0.007, a);
      ctx.fill();
    }
  }

  function drawCalendar(ctx, w, h) {
    ctx.fillStyle = '#f6f4ee';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c8201c';
    ctx.font = 'bold 34px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    outlined(ctx, 'APRIL', w / 2, 26, '#d42a1c', '#5a0a08', 3);
    ctx.strokeStyle = '#5a5a60';
    ctx.lineWidth = 1;
    const x0 = 8, y0 = 52, cw = (w - 16) / 7, ch = (h - 60) / 5;
    for (let i = 0; i <= 7; i++) { ctx.beginPath(); ctx.moveTo(x0 + i * cw, y0); ctx.lineTo(x0 + i * cw, y0 + ch * 5); ctx.stroke(); }
    for (let j = 0; j <= 5; j++) { ctx.beginPath(); ctx.moveTo(x0, y0 + j * ch); ctx.lineTo(x0 + cw * 7, y0 + j * ch); ctx.stroke(); }
    ctx.fillStyle = '#2a2a30';
    ctx.font = 'bold 9px Arial';
    for (let d = 1; d <= 30; d++) {
      const k = d + 1;
      ctx.fillText(String(d), x0 + (k % 7) * cw + cw * 0.5, y0 + Math.floor(k / 7) * ch + 8);
    }
    ctx.fillStyle = '#f2d048';
    ctx.save();
    ctx.translate(x0 + cw * 1.5, y0 + ch * 1.6);
    ctx.rotate(-0.3);
    ctx.fillRect(-11, -11, 22, 22);
    ctx.fillStyle = '#6a4a10';
    ctx.font = 'bold 6px Arial';
    ctx.fillText('TODAY!', 0, 0);
    ctx.restore();
  }

  function drawGlobe(ctx, w, h) {
    ctx.fillStyle = '#2a9ab4';
    ctx.fillRect(0, 0, w, h);
    const g = rand(44);
    const land = (pts, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      pts.forEach(([x, y], i) => { if (i) ctx.lineTo(x * w, y * h); else ctx.moveTo(x * w, y * h); });
      ctx.closePath();
      ctx.fill();
    };
    land([[0.74, 0.16], [0.86, 0.12], [0.97, 0.2], [0.95, 0.34], [0.86, 0.42], [0.8, 0.36], [0.72, 0.28]], '#e8a040');
    land([[0.7, 0.42], [0.76, 0.4], [0.8, 0.5], [0.77, 0.72], [0.72, 0.7], [0.69, 0.55]], '#9ac860');
    land([[0.86, 0.6], [0.94, 0.58], [0.96, 0.7], [0.88, 0.72]], '#d8c070');
    land([[0.08, 0.18], [0.2, 0.14], [0.27, 0.24], [0.2, 0.34], [0.08, 0.3]], '#e8a040');
    land([[0.46, 0.4], [0.52, 0.42], [0.55, 0.56], [0.5, 0.74], [0.46, 0.6]], '#9ac860');
    land([[0.4, 0.36], [0.46, 0.38], [0.45, 0.44], [0.39, 0.42]], '#d8c070');
    land([[0.02, 0.9], [0.98, 0.9], [0.98, 1], [0.02, 1]], '#eef2f4');
    ctx.fillStyle = '#d42020';
    ctx.beginPath();
    ctx.moveTo(w * 0.4, h * 0.14);
    ctx.bezierCurveTo(w * 0.44, h * 0.07, w * 0.57, h * 0.07, w * 0.61, h * 0.14);
    ctx.bezierCurveTo(w * 0.64, h * 0.21, w * 0.61, h * 0.3, w * 0.58, h * 0.34);
    ctx.bezierCurveTo(w * 0.55, h * 0.39, w * 0.52, h * 0.34, w * 0.48, h * 0.37);
    ctx.bezierCurveTo(w * 0.44, h * 0.34, w * 0.4, h * 0.3, w * 0.38, h * 0.23);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a1010';
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath();
      ctx.arc(g() * w, g() * h * 0.9, 6 + g() * 20, 0, PI * 2);
      ctx.fill();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(h * 0.05)}px "Comic Sans MS", Arial`;
    outlined(ctx, 'UNITED STATES', w * 0.5, h * 0.17, '#ffffff', '#7a0a0a', 4);
    outlined(ctx, 'OF AMERICA', w * 0.505, h * 0.245, '#ffffff', '#7a0a0a', 4);
    [[0.405, 0.2, 0.018], [0.6, 0.25, 0.016], [0.43, 0.12, 0.012]].forEach(([x, y, r]) => {
      ctx.fillStyle = '#d42020';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      starPath(ctx, x * w, y * h, r * w, r * w * 0.45, 0.2);
      ctx.fill();
      ctx.stroke();
    });
  }

  function drawFlagSmall(ctx, w, h) {
    for (let i = 0; i < 13; i++) {
      ctx.fillStyle = i % 2 ? '#f4f0ea' : '#c8202a';
      ctx.fillRect(0, (i * h) / 13, w, h / 13 + 0.5);
    }
    ctx.fillStyle = '#26307a';
    ctx.fillRect(0, 0, w * 0.42, h * 0.54);
    ctx.fillStyle = '#ffffff';
    for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) {
      starPath(ctx, w * 0.04 + i * w * 0.066 + (j % 2) * w * 0.03, h * 0.06 + j * h * 0.1, w * 0.018, w * 0.008);
      ctx.fill();
    }
  }

  function drawPresFlag(ctx, w, h) {
    ctx.fillStyle = '#1e2a6a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e0b040';
    ctx.fillRect(0, h - 8, w, 8);
    drawSeal(ctx, w / 2, h * 0.45, w * 0.32);
  }

  function drawPortrait(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#5a4a3a');
    g.addColorStop(1, '#2a2018');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7a6a5a';
    ctx.fillRect(w * 0.62, h * 0.1, w * 0.3, h * 0.55);
    ctx.fillStyle = '#18141a';
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h);
    ctx.lineTo(w * 0.28, h * 0.48);
    ctx.quadraticCurveTo(w * 0.45, h * 0.38, w * 0.62, h * 0.48);
    ctx.lineTo(w * 0.7, h);
    ctx.fill();
    ctx.fillStyle = '#f2ece2';
    ctx.beginPath();
    ctx.moveTo(w * 0.4, h * 0.46);
    ctx.lineTo(w * 0.5, h * 0.62);
    ctx.lineTo(w * 0.52, h * 0.46);
    ctx.fill();
    ctx.fillStyle = '#ecc8a8';
    ctx.beginPath();
    ctx.ellipse(w * 0.46, h * 0.33, w * 0.1, h * 0.1, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4f2f0';
    ctx.beginPath();
    ctx.ellipse(w * 0.46, h * 0.25, w * 0.12, h * 0.06, 0, PI, PI * 2);
    ctx.fill();
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(w * (0.46 + s * 0.11), h * 0.32, w * 0.04, h * 0.05, 0, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = '#18141a';
    ctx.beginPath();
    ctx.moveTo(w * 0.62, h * 0.52);
    ctx.lineTo(w * 0.8, h * 0.36);
    ctx.lineTo(w * 0.84, h * 0.4);
    ctx.lineTo(w * 0.66, h * 0.6);
    ctx.fill();
    ctx.fillStyle = '#ecc8a8';
    ctx.beginPath();
    ctx.arc(w * 0.83, h * 0.35, w * 0.035, 0, PI * 2);
    ctx.fill();
  }

  function drawTank(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#9ab4c8');
    g.addColorStop(0.55, '#e8d8b0');
    g.addColorStop(0.56, '#c8a070');
    g.addColorStop(1, '#a87848');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4a4a30';
    ctx.fillRect(w * 0.25, h * 0.55, w * 0.5, h * 0.16);
    ctx.fillRect(w * 0.36, h * 0.44, w * 0.26, h * 0.13);
    ctx.fillRect(w * 0.58, h * 0.48, w * 0.32, h * 0.035);
    ctx.fillStyle = '#2a2a1a';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(w * (0.3 + i * 0.08), h * 0.7, w * 0.035, 0, PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(240,220,180,0.5)';
    ctx.beginPath();
    ctx.ellipse(w * 0.18, h * 0.66, w * 0.14, h * 0.08, 0, 0, PI * 2);
    ctx.fill();
  }

  function drawBadges(ctx, w, h) {
    ctx.fillStyle = '#2a4a5a';
    ctx.fillRect(0, 0, w, h);
    const cols = ['#e04040', '#40a060', '#e0b040', '#4060c0', '#c060c0', '#40b0c0', '#e07030', '#f0f0f0', '#80c040'];
    for (let i = 0; i < 9; i++) {
      const x = w * (0.22 + (i % 3) * 0.28), y = h * (0.2 + Math.floor(i / 3) * 0.26);
      ctx.fillStyle = cols[i];
      ctx.beginPath();
      ctx.arc(x, y, w * 0.09, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f0e0b0';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.fillStyle = '#f0e0b0';
    ctx.fillRect(w * 0.25, h * 0.88, w * 0.5, h * 0.05);
  }

  function drawPeepers(ctx, w, h) {
    ctx.fillStyle = '#f4f0ea';
    ctx.fillRect(0, 0, w, h);
    ['#c8202a', '#f4f0ea', '#26307a'].forEach((c, i) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = 4;
      ctx.strokeRect(8 + i * 4, 8 + i * 4, w - 16 - i * 8, h - 16 - i * 8);
    });
    const g = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.4, w * 0.6);
    g.addColorStop(0, '#f8d8e8');
    g.addColorStop(1, '#c8a0c0');
    ctx.fillStyle = g;
    ctx.fillRect(22, 22, w - 44, h * 0.66);
    ctx.fillStyle = '#2a3480';
    ctx.beginPath();
    ctx.moveTo(w * 0.24, h * 0.66);
    ctx.quadraticCurveTo(w * 0.5, h * 0.52, w * 0.76, h * 0.66);
    ctx.lineTo(w * 0.76, h * 0.69);
    ctx.lineTo(w * 0.24, h * 0.69);
    ctx.fill();
    ctx.fillStyle = '#f4f0ea';
    ctx.fillRect(w * 0.47, h * 0.55, w * 0.06, h * 0.12);
    ctx.fillStyle = '#c8202a';
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.55);
    ctx.lineTo(w * 0.55, h * 0.55);
    ctx.lineTo(w * 0.5, h * 0.6);
    ctx.fill();
    ctx.fillStyle = '#f0c8a0';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.36, w * 0.22, h * 0.17, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c050';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.24, w * 0.22, h * 0.06, 0, PI, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a3480';
    ctx.fillRect(w * 0.32, h * 0.06, w * 0.36, h * 0.16);
    ctx.fillRect(w * 0.24, h * 0.2, w * 0.52, h * 0.03);
    ctx.fillStyle = '#f4f0ea';
    ctx.fillRect(w * 0.32, h * 0.15, w * 0.36, h * 0.035);
    ctx.fillStyle = '#ffffff';
    starPath(ctx, w * 0.5, h * 0.1, w * 0.05, w * 0.022);
    ctx.fill();
    [-1, 1].forEach(s => {
      const x = w * (0.5 + s * 0.09), y = h * 0.34;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.07, h * 0.05, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a8ae0';
      ctx.beginPath();
      ctx.arc(x, y + 2, w * 0.04, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#101018';
      ctx.beginPath();
      ctx.arc(x, y + 2, w * 0.018, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b08020';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - s * w * 0.08, y - h * 0.07);
      ctx.lineTo(x + s * w * 0.04, y - h * 0.045);
      ctx.stroke();
    });
    ctx.fillStyle = '#e04848';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.42, w * 0.045, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6a2a1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, w * 0.05, PI * 1.15, PI * 1.85);
    ctx.stroke();
    ctx.fillStyle = '#f0c8a0';
    ctx.beginPath();
    ctx.ellipse(w * 0.62, h * 0.6, w * 0.06, h * 0.045, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.6, h * 0.5, w * 0.03, h * 0.09);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(h * 0.11)}px Impact, "Arial Black", Arial`;
    ctx.fillStyle = '#1a2058';
    ctx.fillText('I CAN SEE YOU', w * 0.5, h * 0.78);
    ctx.font = `bold ${Math.round(h * 0.05)}px Arial`;
    ctx.fillText('VOTE FOR PEEPERS', w * 0.5, h * 0.88);
  }

  function drawGiveMe(ctx, w, h) {
    ctx.fillStyle = '#d8d8a0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#5a6a3a';
    ctx.fillRect(10, 10, w - 20, h - 20);
    const g = rand(7);
    const cam = ['#7a8a4a', '#3a4a2a', '#a8a070', '#4a5a30'];
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = cam[i % 4];
      ctx.beginPath();
      ctx.ellipse(12 + g() * (w - 24), 12 + g() * (h - 24), 10 + g() * 26, 6 + g() * 16, g() * PI, 0, PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#58584a';
    ctx.fillRect(10, h * 0.62, w - 20, h * 0.3);
    ctx.fillStyle = '#121214';
    ctx.fillRect(w * 0.3, h * 0.4, w * 0.4, h * 0.13);
    ctx.fillRect(w * 0.4, h * 0.31, w * 0.2, h * 0.1);
    ctx.fillRect(w * 0.58, h * 0.34, w * 0.26, h * 0.035);
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(w * (0.34 + i * 0.065), h * 0.54, w * 0.026, 0, PI * 2); ctx.fill(); }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(h * 0.12)}px "Comic Sans MS", Arial`;
    outlined(ctx, 'GIVE ME', w * 0.5, h * 0.13, '#f4f4f0', '#1a1a1a', 5);
    outlined(ctx, 'ALL YOU', w * 0.5, h * 0.25, '#f4f4f0', '#1a1a1a', 5);
    ctx.font = `bold ${Math.round(h * 0.26)}px Impact, "Arial Black", Arial`;
    outlined(ctx, 'GOT!', w * 0.5, h * 0.78, '#f4f4f0', '#141414', 8);
  }

  function drawWarSign(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(h * 0.82)}px Georgia, "Times New Roman"`;
    ctx.save();
    ctx.translate(w / 2, h * 0.54);
    ctx.scale(1.15, 1);
    outlined(ctx, 'WAR', 0, 0, '#ff3a26', '#ff3a26', 6);
    ctx.restore();
  }

  function drawPlate(ctx, w, h) {
    ctx.fillStyle = '#f0c8c8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a1a1a';
    ctx.font = 'bold 13px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MR. PRESIDENT', w / 2, h * 0.42);
    ctx.font = '7px Arial';
    ctx.fillText('CEO OF THE USA', w / 2, h * 0.8);
  }

  function drawSpot(soft) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w / 2, h / 2, w * (0.42 - soft), w / 2, h / 2, w * 0.42);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#000000');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.42, 0, PI * 2);
      ctx.fill();
    };
  }

  function drawStarCookie(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.filter = 'blur(3px)';
    ctx.fillStyle = '#fff';
    starPath(ctx, w / 2, h * 0.53, w * 0.44, w * 0.19);
    ctx.fill();
    ctx.filter = 'none';
  }

  function drawSpots3(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    [[0.18, 0.5], [0.52, 0.42], [0.84, 0.56]].forEach(([x, y]) => {
      const g = ctx.createRadialGradient(x * w, y * h, w * 0.06, x * w, y * h, w * 0.12);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#000000');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x * w, y * h, w * 0.12, 0, PI * 2);
      ctx.fill();
    });
  }

  function drawIris(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    const x0 = w * 0.22, x1 = w * 0.71, top = h * 0.03, bot = h * 0.97, r = (x1 - x0) * 0.42;
    ctx.beginPath();
    ctx.moveTo(x0, bot);
    ctx.lineTo(x0, top + r);
    ctx.quadraticCurveTo(x0, top, x0 + r, top);
    ctx.lineTo(x1 - r, top);
    ctx.quadraticCurveTo(x1, top, x1, top + r);
    ctx.lineTo(x1, bot);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawSubtitle(text) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 21px "Comic Sans MS", Arial';
      outlined(ctx, text, w / 2, h / 2, '#ffffff', '#101010', 5);
    };
  }

  function drawStripes(colors, n) {
    return (ctx, w, h) => {
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect((i * w) / n, 0, w / n + 1, h);
      }
    };
  }

  function drawDrape(ctx, w, h) {
    for (let x = 0; x < w; x++) {
      const k = 0.62 + 0.38 * Math.pow(0.5 + 0.5 * C((x / w) * PI * 2 * 5), 1.5);
      ctx.fillStyle = `rgb(${Math.round(30 * k)},${Math.round(40 * k)},${Math.round(92 * k)})`;
      ctx.fillRect(x, 0, 1, h);
    }
  }

  function drawBlinds(ctx, w, h) {
    for (let y = 0; y < h; y += 8) {
      ctx.fillStyle = '#5a3820';
      ctx.fillRect(0, y, w, 6);
      ctx.fillStyle = '#2a180c';
      ctx.fillRect(0, y + 6, w, 2);
    }
  }

  function drawWater(ctx, w, h) {
    ctx.fillStyle = '#1aa6e6';
    ctx.fillRect(0, 0, w, h);
    const g = rand(9);
    ctx.strokeStyle = 'rgba(190,240,255,0.28)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 22; i++) {
      const x = g() * w, y = g() * h, r = 8 + g() * 20;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.6, g() * PI, 0, PI * 1.3);
      ctx.stroke();
    }
  }

  function drawLeather(ctx, w, h) {
    ctx.fillStyle = '#7a161c';
    ctx.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, 6);
      g.addColorStop(0, 'rgba(30,0,0,0.4)');
      g.addColorStop(1, 'rgba(40,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 8, y - 8, 16, 16);
    }
  }

  function drawBooks(ctx, w, h) {
    const g = rand(12);
    let x = 0;
    while (x < w) {
      const bw = 6 + Math.floor(g() * 8);
      const set = g() < 0.55;
      ctx.fillStyle = set ? '#1e2a6e' : ['#8a1e1e', '#2a6a3a', '#c8a050', '#3a3a6a'][Math.floor(g() * 4)];
      const top = set ? 4 : Math.floor(g() * 12);
      ctx.fillRect(x, top, bw - 1, h - top);
      ctx.fillStyle = '#e0c060';
      ctx.fillRect(x + 1, top + 6, bw - 3, 2);
      ctx.fillRect(x + 1, h - 10, bw - 3, 2);
      x += bw;
    }
  }

  function makeTextures(r) {
    const tx = (size, fn, opts) => r.texture(size, fn, opts);
    return {
      maxFace: { grin: tx(256, drawMaxFace('grin'), { clamp: true }), open1: tx(256, drawMaxFace('open1'), { clamp: true }), open2: tx(256, drawMaxFace('open2'), { clamp: true }) },
      rug: tx(512, drawRug, { clamp: true }),
      seal: tx(512, drawSealTex, { clamp: true }),
      calendar: tx(128, drawCalendar, { height: 160, clamp: true }),
      globe: tx(1024, drawGlobe, { height: 512, clamp: true }),
      flagSmall: tx(128, drawFlagSmall, { height: 64 }),
      presFlag: tx(64, drawPresFlag, { height: 96, clamp: true }),
      portrait: tx(128, drawPortrait, { height: 160, clamp: true }),
      tank: tx(128, drawTank, { height: 96, clamp: true }),
      badges: tx(128, drawBadges, { clamp: true }),
      peepers: tx(256, drawPeepers, { height: 340, clamp: true }),
      giveMe: tx(512, drawGiveMe, { height: 384, clamp: true }),
      warSign: tx(256, drawWarSign, { height: 96, clamp: true }),
      plate: tx(128, drawPlate, { height: 32, clamp: true }),
      spot: tx(128, drawSpot(0.08), { clamp: true }),
      spotSoft: tx(128, drawSpot(0.2), { clamp: true }),
      star: tx(256, drawStarCookie, { clamp: true }),
      spots3: tx(256, drawSpots3, { clamp: true }),
      iris: tx(512, drawIris, { height: 288, clamp: true }),
      subs: LINES.map(l => tx(512, drawSubtitle(l.text), { height: 48, clamp: true })),
      sofa: tx(64, drawStripes(['#c81e28', '#f2ebe2', '#c81e28', '#f2ebe2', '#c81e28', '#ece6ee'], 12)),
      drape: tx(128, drawDrape),
      blinds: tx(64, drawBlinds),
      water: tx(128, drawWater),
      leather: tx(64, drawLeather),
      books: tx(128, drawBooks, { height: 32 }),
      wall: tx(128, texNoise('#ecd4b8', 41, 0.08)),
      carpet: tx(128, texNoise('#1e2652', 42, 0.14)),
      wood: tx(128, texNoise('#5a2a18', 43, 0.18)),
      stone: tx(128, texNoise('#9aa0a8', 44, 0.2)),
      glow: tx(64, texGlow, { clamp: true })
    };
  }

  const FRONT = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];
  const UP = [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]];

  function patch(b, rx, ry, rz, y0, y1, p0, p1, nu, nv, col, uvs) {
    const pt = (u, v) => {
      const yaw = y0 + (y1 - y0) * u, pit = p0 + (p1 - p0) * v;
      const n = [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
      return { p: [n[0] * rx, n[1] * ry, n[2] * rz], n: V3.norm([n[0] / rx, n[1] / ry, n[2] / rz]) };
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const a = pt(u0, v0), bb = pt(u1, v0), c = pt(u1, v1), d = pt(u0, v1);
        const uv = uvs ? [[u0 * uvs[0], v0 * uvs[1]], [u1 * uvs[0], v0 * uvs[1]], [u1 * uvs[0], v1 * uvs[1]], [u0 * uvs[0], v1 * uvs[1]]] : null;
        b.quad(a.p, bb.p, c.p, d.p, col, uv, [a.n, bb.n, c.n, d.n]);
      }
    }
    return b;
  }

  function beam(b, x0, y0, x1, y1, w, z0, z1, col) {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1;
    const nx = (-dy / l) * w / 2, ny = (dx / l) * w / 2;
    const p = [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]];
    const at = (q, z) => [q[0], q[1], z];
    b.quad(at(p[3], z1), at(p[2], z1), at(p[1], z1), at(p[0], z1), col, null, FRONT);
    for (let i = 0; i < 4; i++) {
      const a = p[i], c = p[(i + 1) % 4];
      const n = V3.norm([c[1] - a[1], -(c[0] - a[0]), 0]);
      const side = shade(col, 0.55);
      b.quad(at(a, z0), at(c, z0), at(c, z1), at(a, z1), side, null, [n, n, n, n]);
    }
    return b;
  }

  function starMesh(b, ro, ri, z0, z1, col, sideCol) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = PI / 2 + (i / 10) * PI * 2;
      const rr = i % 2 ? ri : ro;
      pts.push([C(a) * rr, S(a) * rr]);
    }
    for (let i = 0; i < 10; i++) {
      const a = pts[i], c = pts[(i + 1) % 10];
      b.tri([0, 0, z1], [a[0], a[1], z1], [c[0], c[1], z1], col, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      if (z1 !== z0) {
        const n = V3.norm([c[1] - a[1], -(c[0] - a[0]), 0]);
        b.quad([a[0], a[1], z0], [c[0], c[1], z0], [c[0], c[1], z1], [a[0], a[1], z1], sideCol || shade(col, 0.6), null, [n, n, n, n]);
      }
    }
    return b;
  }

  function ringY(b, ro, ri, y, n, col, uvScale) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const p = (a, r) => [S(a) * r, y, C(a) * r];
      const uv = uvScale ? (a, r) => [S(a) * r * uvScale, C(a) * r * uvScale] : null;
      b.quad(p(a0, ri), p(a0, ro), p(a1, ro), p(a1, ri), col, uv ? [uv(a0, ri), uv(a0, ro), uv(a1, ro), uv(a1, ri)] : null, UP);
    }
    return b;
  }

  function tieStripes(b, look, x0, x1, yTop, yBot, zTop, zBot, n) {
    for (let i = 0; i < n; i++) {
      const y = lerp(yTop, yBot, (i + 0.6) / (n + 0.4));
      const z = lerp(zTop, zBot, (yTop - y) / (yTop - yBot)) + 0.003;
      b.quad([x0, y + 0.004, z], [x1, y - 0.022, z], [x1, y - 0.034, z], [x0, y - 0.008, z], look.stripe, null, FRONT);
    }
  }

  function makeAgent(r) {
    const L = LOOKS.agent, d = DIMS.agent, J = L.suit;
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    return {
      head: mk(b => {
        b.at(0, 0.012, -0.006, h => h.ellipsoid(0.098, 0.114, 0.104, 12, 9, L.skin));
        b.at(0, -0.06, 0.012, h => h.ellipsoid(0.088, 0.08, 0.088, 10, 7, L.skin));
        b.at(0, -0.122, 0.048, h => h.ellipsoid(0.05, 0.04, 0.048, 8, 5, L.skin));
        b.at(0, -0.02, 0.104, h => h.ellipsoid(0.021, 0.046, 0.03, 6, 5, shade(L.skin, 0.97)));
        [-1, 1].forEach(s => b.at(s * 0.097, 0, -0.012, h => h.ellipsoid(0.017, 0.034, 0.026, 6, 4, shade(L.skin, 0.92))));
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.044, 0.06, 0.096), M4.rotZ(s * 0.14));
          b.box(0.048, 0.008, 0.014, shade(L.hair, 0.8));
          b.pop();
        });
        b.at(-0.11, 0.002, -0.004, h => h.box(0.018, 0.024, 0.022, 0x161616));
        b.at(-0.112, -0.075, -0.012, h => h.prism(5, 0.005, 0.005, -0.06, 0.005, 0.005, 0.07, 0x262626));
      }),
      hair: mk(b => {
        b.at(0, 0.07, -0.03, h => h.ellipsoid(0.103, 0.08, 0.106, 12, 7, L.hair));
        b.push(M4.translate(0, 0.152, 0.052), M4.rotX(-0.6));
        b.ellipsoid(0.086, 0.064, 0.074, 12, 7, shade(L.hair, 1.08));
        b.pop();
        b.push(M4.translate(0, 0.176, -0.005), M4.rotX(-0.25));
        b.ellipsoid(0.082, 0.066, 0.088, 12, 7, L.hair);
        b.pop();
        b.at(0, 0.13, -0.062, h => h.ellipsoid(0.09, 0.072, 0.07, 10, 6, L.hair));
        b.at(0, 0.206, 0.04, h => h.ellipsoid(0.048, 0.03, 0.048, 8, 5, shade(L.hair, 1.3)));
        [-1, 1].forEach(s => {
          b.at(s * 0.083, 0.07, -0.02, h => h.ellipsoid(0.03, 0.065, 0.085, 6, 5, shade(L.hair, 0.9)));
          b.at(s * 0.095, 0.02, 0.026, h => h.box(0.014, 0.05, 0.03, L.hair));
        });
      }),
      glasses: mk(b => {
        const lens = [0.03, 0.03, 0.04, 0];
        [-1, 1].forEach(s => {
          b.at(s * 0.044, 0.022, 0.101, h => {
            h.ellipsoid(0.047, 0.028, 0.012, 10, 5, lens);
            h.at(-0.013, 0.009, 0.011, g => g.box(0.017, 0.004, 0.002, [0.55, 0.58, 0.68, 0.75]));
          });
          b.at(s * 0.094, 0.036, 0.036, h => h.box(0.006, 0.008, 0.12, lens));
        });
        b.at(0, 0.03, 0.109, h => h.box(0.03, 0.006, 0.008, lens));
      }),
      mouth: mk(b => b.ellipsoid(1, 1, 1, 8, 5, [0.16, 0.04, 0.05, 0.05])),
      teeth: mk(b => b.box(1, 1, 1, [0.97, 0.96, 0.92, 0.3])),
      torso: mk(b => {
        b.prism(10, 0.158, 0.122, -0.15, 0.148, 0.115, 0, J, { capTop: false, capBottom: true });
        b.prism(10, 0.148, 0.115, 0, 0.228, 0.128, 0.45, J, { capTop: false });
        b.at(0, 0.468, 0, h => h.ellipsoid(0.232, 0.085, 0.127, 12, 6, J));
        b.tri([-0.062, 0.553, 0.09], [0.062, 0.553, 0.09], [0, 0.27, 0.127], L.shirt, null, [[0, 0.3, 1], [0, 0.3, 1], [0, 0.3, 1]]);
        b.at(0, 0.527, 0.1, h => h.box(0.034, 0.03, 0.02, L.tie));
        b.quad([-0.016, 0.513, 0.106], [0.016, 0.513, 0.106], [0.028, 0.295, 0.13], [-0.028, 0.295, 0.13], L.tie, null, FRONT);
        b.tri([-0.028, 0.295, 0.13], [0.028, 0.295, 0.13], [0, 0.258, 0.132], L.tie, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        tieStripes(b, L, -0.024, 0.024, 0.5, 0.3, 0.106, 0.13, 4);
        [-1, 1].forEach(s => b.quad([s * 0.062, 0.553, 0.091], [s * 0.118, 0.52, 0.106], [s * 0.034, 0.27, 0.131], [s * 0.006, 0.276, 0.13], shade(J, 0.72), null, FRONT));
        b.at(0, 0.53, 0, h => h.prism(10, 0.062, 0.058, 0, 0.056, 0.052, 0.05, L.shirt, { capTop: false }));
        b.at(0, 0.54, 0, h => h.prism(8, 0.048, 0.046, 0, 0.044, 0.042, 0.12, L.skin));
        [0.2, 0.13].forEach(y => b.at(0.03, y, 0.12, h => h.box(0.012, 0.012, 0.008, 0x0c0808)));
        b.at(0.13, 0.4, 0.105, h => h.box(0.05, 0.008, 0.008, shade(J, 0.7)));
      }),
      hips: mk(b => b.prism(10, 0.15, 0.115, -0.12, 0.146, 0.11, 0.1, J, { capBottom: true })),
      upper: mk(b => {
        b.ellipsoid(0.064, 0.064, 0.064, 8, 6, J);
        b.prism(8, 0.05, 0.052, -d.upper, 0.058, 0.058, 0, J, { capBottom: true });
      }),
      fore: mk(b => {
        b.prism(8, 0.044, 0.044, -d.fore + 0.015, 0.05, 0.05, 0, J, { capBottom: true });
        b.at(0, -d.fore + 0.015, 0, h => h.prism(8, 0.043, 0.043, -0.022, 0.043, 0.043, 0, L.shirt, { capBottom: true }));
        b.at(0, -d.fore - 0.045, 0.004, h => h.box(0.032, 0.085, 0.07, L.skin));
        b.at(0, -d.fore - 0.09, 0.004, h => h.ellipsoid(0.017, 0.022, 0.035, 6, 4, L.skin));
        b.at(0, -d.fore - 0.03, 0.045, h => h.box(0.022, 0.05, 0.022, L.skin));
      }),
      thigh: mk(b => b.prism(8, 0.064, 0.068, -d.thigh, 0.08, 0.084, 0, J, { capBottom: true })),
      shin: mk(b => {
        b.prism(8, 0.052, 0.056, -d.shin, 0.064, 0.068, 0, J, { capBottom: true });
        b.at(0, -d.shin - d.sole / 2, 0.05, h => h.box(0.1, d.sole, 0.24, L.shoe, { faces: { top: shade(L.shoe, 1.8) } }));
        b.at(0, -d.shin - d.sole * 0.5, 0.17, h => h.ellipsoid(0.05, d.sole * 0.52, 0.05, 8, 4, L.shoe));
      })
    };
  }

  function makeSam(r) {
    const L = LOOKS.sam, d = DIMS.sam, J = L.suit;
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    return {
      head: mk(b => {
        b.at(0, 0.035, -0.02, h => h.ellipsoid(0.13, 0.124, 0.135, 12, 9, L.fur));
        b.at(0, -0.035, 0.112, h => h.ellipsoid(0.094, 0.078, 0.122, 10, 7, L.fur));
        [-1, 1].forEach(s => b.at(s * 0.046, -0.083, 0.152, h => h.ellipsoid(0.058, 0.05, 0.076, 8, 6, L.fur)));
        b.at(0, -0.002, 0.225, h => h.ellipsoid(0.062, 0.046, 0.042, 10, 6, L.nose));
        b.at(-0.02, 0.022, 0.255, h => h.ellipsoid(0.016, 0.008, 0.006, 6, 3, [0.7, 0.7, 0.75, 0.6]));
        [-1, 1].forEach(s => {
          b.at(s * 0.05, 0.05, 0.118, h => h.ellipsoid(0.026, 0.03, 0.02, 8, 5, [0.96, 0.95, 0.9, 0.12]));
          b.at(s * 0.048, 0.046, 0.134, h => h.ellipsoid(0.011, 0.014, 0.008, 6, 4, [0.05, 0.04, 0.04, 0]));
          b.push(M4.translate(s * 0.052, 0.086, 0.112), M4.rotZ(-s * 0.18));
          b.ellipsoid(0.042, 0.016, 0.026, 6, 4, L.dark);
          b.pop();
          b.push(M4.translate(s * 0.132, -0.045, -0.025), M4.rotZ(s * 0.22), M4.rotX(0.12));
          b.ellipsoid(0.034, 0.13, 0.078, 8, 7, L.dark);
          b.pop();
        });
        [-1, 1].forEach(s => b.at(s * 0.036, -0.122, 0.19, h => h.box(0.014, 0.022, 0.012, [0.97, 0.96, 0.9, 0.2])));
        b.at(0, -0.118, 0.205, h => h.box(0.05, 0.006, 0.01, [0.2, 0.06, 0.06, 0]));
      }),
      jaw: mk(b => {
        b.at(0, -0.03, 0.085, h => h.ellipsoid(0.072, 0.034, 0.098, 8, 5, shade(L.fur, 0.9)));
        b.at(0, -0.006, 0.08, h => h.ellipsoid(0.058, 0.018, 0.08, 8, 4, [0.45, 0.1, 0.12, 0.1]));
        b.at(0, -0.02, 0.1, h => h.ellipsoid(0.04, 0.012, 0.05, 6, 4, [0.82, 0.38, 0.42, 0.1]));
      }),
      hat: mk(b => {
        b.at(0, 0.098, 0, h => h.prism(16, 0.185, 0.195, -0.006, 0.185, 0.195, 0.006, L.hat, { capBottom: true }));
        b.at(0, 0.1, -0.01, h => h.prism(12, 0.126, 0.132, 0, 0.11, 0.115, 0.13, L.hat));
        b.at(0, 0.1, -0.01, h => h.prism(12, 0.129, 0.135, 0, 0.126, 0.132, 0.035, L.band, { capTop: false }));
        b.push(M4.translate(0, 0.232, -0.01), M4.rotZ(0));
        b.box(0.03, 0.03, 0.16, shade(L.hat, 0.8));
        b.pop();
      }),
      torso: mk(b => {
        b.prism(10, 0.21, 0.175, -0.13, 0.2, 0.168, 0, J, { capTop: false, capBottom: true });
        b.prism(10, 0.2, 0.168, 0, 0.25, 0.172, 0.43, J, { capTop: false });
        b.prism(10, 0.25, 0.172, 0.43, 0.13, 0.11, 0.55, J);
        b.tri([-0.075, 0.545, 0.122], [0.075, 0.545, 0.122], [0, 0.25, 0.18], L.shirt, null, [[0, 0.3, 1], [0, 0.3, 1], [0, 0.3, 1]]);
        b.at(0, 0.52, 0.128, h => h.box(0.042, 0.036, 0.024, L.tie));
        b.quad([-0.02, 0.505, 0.134], [0.02, 0.505, 0.134], [0.036, 0.27, 0.184], [-0.036, 0.27, 0.184], L.tie, null, FRONT);
        b.tri([-0.036, 0.27, 0.184], [0.036, 0.27, 0.184], [0, 0.228, 0.186], L.tie, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        tieStripes(b, L, -0.032, 0.032, 0.49, 0.28, 0.134, 0.184, 4);
        [-1, 1].forEach(s => b.quad([s * 0.075, 0.545, 0.123], [s * 0.132, 0.51, 0.138], [s * 0.04, 0.25, 0.18], [s * 0.008, 0.256, 0.18], shade(J, 0.8), null, FRONT));
        b.at(0, 0.53, 0, h => h.prism(10, 0.08, 0.075, 0, 0.074, 0.07, 0.05, L.shirt, { capTop: false }));
        b.at(0, 0.54, 0.01, h => h.prism(8, 0.075, 0.07, 0, 0.07, 0.066, 0.1, L.fur));
        [0.18, 0.1].forEach(y => b.at(0.04, y, 0.175, h => h.box(0.014, 0.014, 0.008, 0x3a3a40)));
      }),
      hips: mk(b => b.prism(10, 0.2, 0.165, -0.12, 0.196, 0.16, 0.1, J, { capBottom: true })),
      upper: mk(b => {
        b.ellipsoid(0.075, 0.075, 0.075, 8, 6, J);
        b.prism(8, 0.06, 0.062, -d.upper, 0.07, 0.07, 0, J, { capBottom: true });
      }),
      fore: mk(b => {
        b.prism(8, 0.054, 0.054, -d.fore + 0.015, 0.06, 0.06, 0, J, { capBottom: true });
        b.at(0, -d.fore + 0.015, 0, h => h.prism(8, 0.052, 0.052, -0.02, 0.052, 0.052, 0, L.shirt, { capBottom: true }));
        b.at(0, -d.fore - 0.05, 0.004, h => h.ellipsoid(0.03, 0.06, 0.05, 8, 5, L.fur));
        b.at(0, -d.fore - 0.035, 0.05, h => h.ellipsoid(0.016, 0.03, 0.016, 6, 4, L.fur));
      }),
      thigh: mk(b => b.prism(8, 0.075, 0.08, -d.thigh, 0.095, 0.1, 0, J, { capBottom: true })),
      shin: mk(b => {
        b.prism(8, 0.065, 0.068, -d.shin, 0.075, 0.08, 0, J, { capBottom: true });
        b.at(0, -d.shin - d.sole / 2, 0.05, h => h.box(0.12, d.sole, 0.26, L.shoe, { faces: { top: shade(L.shoe, 1.4) } }));
        b.at(0, -d.shin - d.sole * 0.5, 0.18, h => h.ellipsoid(0.06, d.sole * 0.52, 0.055, 8, 4, L.shoe));
      })
    };
  }

  const MAX_HEAD = M4.translate(0, -0.11, 0.012);
  const AGENT_HEAD = M4.chain(M4.translate(0, -0.012, 0.006), M4.scale(1.32));
  const SAM_HEAD = M4.chain(M4.translate(0, 0.04, 0.012), M4.scale(1.26));

  function makeMax(r) {
    const L = LOOKS.max, d = DIMS.max, F = L.fur;
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    return {
      head: mk(b => {
        b.ellipsoid(0.18, 0.16, 0.155, 16, 12, F);
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.066, 0.128, -0.018), M4.rotZ(-s * 0.12), M4.rotX(-0.08));
          b.at(0, 0.19, 0, h => h.ellipsoid(0.046, 0.205, 0.03, 8, 8, F));
          b.at(0, 0.19, 0.018, h => h.ellipsoid(0.026, 0.165, 0.014, 6, 6, L.inner));
          b.pop();
        });
      }),
      face: mk(b => patch(b, 0.1815, 0.1615, 0.1565, -1.2, 1.2, -0.8, 0.7, 14, 10, [1, 1, 1, 0], [1, 1])),
      torso: mk(b => {
        b.at(0, 0.09, 0.005, h => h.ellipsoid(0.165, 0.17, 0.148, 12, 8, F));
        b.at(0, 0.24, 0, h => h.ellipsoid(0.13, 0.15, 0.118, 10, 7, F));
        b.at(0.03, 0.08, 0.15, h => h.box(0.012, 0.006, 0.004, [0.5, 0.45, 0.55, 0]));
      }),
      hips: mk(b => b.at(0, -0.02, 0, h => h.ellipsoid(0.15, 0.1, 0.13, 10, 6, F))),
      upper: mk(b => {
        b.ellipsoid(0.042, 0.042, 0.042, 6, 5, F);
        b.prism(8, 0.034, 0.036, -d.upper, 0.04, 0.04, 0, F, { capBottom: true });
      }),
      fore: mk(b => {
        b.prism(8, 0.03, 0.03, -d.fore, 0.035, 0.035, 0, F, { capBottom: true });
        b.at(0, -d.fore - 0.035, 0.004, h => h.ellipsoid(0.03, 0.046, 0.036, 7, 5, F));
      }),
      thigh: mk(b => b.prism(8, 0.05, 0.052, -d.thigh, 0.062, 0.064, 0, F, { capBottom: true })),
      shin: mk(b => {
        b.prism(8, 0.044, 0.046, -d.shin, 0.05, 0.052, 0, F, { capBottom: true });
        b.at(0, -d.shin - d.sole / 2, 0.05, h => h.ellipsoid(0.06, d.sole * 0.6, 0.11, 8, 5, F));
      })
    };
  }

  const MAX_FACE = (open) => (open < 0.22 ? 'grin' : open < 0.6 ? 'open1' : 'open2');

  function drawActor(r, X, a, opts) {
    if (!a || a.hidden) return;
    const o = opts || {};
    const m = a.m;
    const set = a.kind === 'agent' ? X.agent : a.kind === 'sam' ? X.sam : X.max;
    const pass = o.flat ? { flat: o.flat, blend: o.flat[3] < 1, shadow: o.shadow } : o.tint ? { tint: o.tint } : {};
    const W = (M) => (o.pre ? M4.mul(o.pre, M) : M);
    r.draw(set.hips, W(m.hips), pass);
    r.draw(set.torso, W(m.torso), pass);
    ['L', 'R'].forEach(s => {
      r.draw(set.upper, W(m['upper' + s]), pass);
      r.draw(set.fore, W(m['fore' + s]), pass);
      r.draw(set.thigh, W(m['thigh' + s]), pass);
      r.draw(set.shin, W(m['shin' + s]), pass);
    });
    const open = clamp(a.pose.mouth || 0, 0, 1);
    if (a.kind === 'agent') {
      const hm = M4.mul(m.head, AGENT_HEAD);
      r.draw(set.head, W(hm), pass);
      r.draw(set.hair, W(hm), pass);
      r.draw(set.glasses, W(hm), pass);
      if (o.flat) return;
      const mouthM = M4.chain(hm, M4.translate(0, -0.078, 0.1), M4.scale(0.024 + open * 0.004, 0.0028 + open * 0.0135, 0.011));
      r.draw(set.mouth, mouthM, pass);
      if (open > 0.3) r.draw(set.teeth, M4.chain(hm, M4.translate(0, -0.069 + open * 0.002, 0.106), M4.scale(0.022, 0.005, 0.004)), pass);
    } else if (a.kind === 'sam') {
      const hm = M4.mul(m.head, SAM_HEAD);
      r.draw(set.head, W(hm), pass);
      r.draw(set.jaw, W(M4.chain(hm, M4.translate(0, -0.088, 0.06), M4.rotX(open * 0.42))), pass);
      r.draw(set.hat, W(M4.chain(hm, M4.translate(0, 0.045, -0.03), M4.rotX(-0.16))), pass);
    } else {
      const hm = M4.mul(m.head, MAX_HEAD);
      r.draw(set.head, W(hm), pass);
      if (!o.flat) r.draw(set.face, hm, Object.assign({ texture: X.T.maxFace[a.pose.faceKind || MAX_FACE(open)] }, pass));
    }
  }

  function planarFloor(lightDir, h) {
    return M4.planarShadow(V3.norm(lightDir), h || 0.012);
  }

  function planarWallZ(lightDir, z0) {
    const L = V3.norm(lightDir);
    const kx = L[2] === 0 ? 0 : L[0] / L[2], ky = L[2] === 0 ? 0 : L[1] / L[2];
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, -kx, -ky, 0, 0, kx * z0, ky * z0, z0, 1]);
  }

  function drawShadow(r, X, a, M, alpha) {
    if (!a || a.hidden || a.noShadow) return;
    drawActor(r, X, a, { flat: [0.04, 0.03, 0.08, alpha === undefined ? 0.42 : alpha], shadow: true, pre: M });
  }

  const ROOM = { A: 6.2, B: 5, H: 4.3 };
  const DOOR_TH = PI / 2;
  const FIRE_TH = 0;
  const PORTRAIT_TH = PI * 0.89;
  const SPOTS = {
    desk: [0, -3.1],
    chair: [0, -3.82],
    sam: [-2.1, -3.2],
    globe: [-1.62, -3.0],
    calendar: [1.55, -3.55],
    sofa: [0, 3],
    nut: [-2.15, 3.15],
    nutRy: Math.atan2(-0.55, -0.25),
    plant: [-3.35, 2.95],
    eagle: [-3.7, -3.05],
    bell: [-3.15, -1.95],
    chairA: [-2.25, 0.2],
    chairB: [-2.7, 2.0]
  };

  function wallFrame(th, off, y) {
    const c = C(th), s = S(th);
    const n = V3.norm([-c / ROOM.A, 0, -s / ROOM.B]);
    const o = off || 0;
    const p = [ROOM.A * c + n[0] * o, y || 0, ROOM.B * s + n[2] * o];
    return new Float32Array([n[2], 0, -n[0], 0, 0, 1, 0, 0, n[0], 0, n[2], 0, p[0], p[1], p[2], 1]);
  }

  function wallPoint(th, off, y) {
    return M4.point(wallFrame(th, off, y), [0, 0, 0]);
  }

  function place(x, z, ry) {
    return M4.chain(M4.translate(x, 0, z), M4.rotY(ry || 0));
  }

  function ellipseFan(b, ra, rb, y, n, col, uv, normalUp) {
    const nn = normalUp === false ? [[0, -1, 0], [0, -1, 0], [0, -1, 0]] : [[0, 1, 0], [0, 1, 0], [0, 1, 0]];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const p0 = [C(a0) * ra, y, S(a0) * rb], p1 = [C(a1) * ra, y, S(a1) * rb];
      b.tri([0, y, 0], p1, p0, col, uv ? [uv([0, y, 0]), uv(p1), uv(p0)] : null, nn);
    }
    return b;
  }

  function door(b, w, h, cream) {
    const frame = shade(cream, 0.92);
    b.at(-w / 2 - 0.08, h / 2, 0.03, f => f.box(0.16, h + 0.02, 0.08, frame));
    b.at(w / 2 + 0.08, h / 2, 0.03, f => f.box(0.16, h + 0.02, 0.08, frame));
    b.at(0, h + 0.08, 0.03, f => f.box(w + 0.32, 0.16, 0.08, frame));
    b.at(0, h + 0.27, 0.05, f => f.box(w + 0.6, 0.12, 0.14, frame));
    const g = 0.8, hw = (w + 0.6) / 2, dz = 0.42;
    b.push(M4.translate(0, h + 0.33, 0.04));
    b.tri([-hw, 0, dz], [hw, 0, dz], [0, g, dz], shade(cream, 0.95), null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    b.tri([-hw + 0.17, 0.08, dz + 0.012], [hw - 0.17, 0.08, dz + 0.012], [0, g - 0.12, dz + 0.012], 0x26305a, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    [-1, 1].forEach(s => {
      const n = V3.norm([s * g, hw, 0]);
      b.quad([s * hw, 0, 0], [s * hw, 0, dz], [0, g, dz], [0, g, 0], shade(cream, 1.04), null, [n, n, n, n]);
    });
    b.quad([-hw, 0, 0], [hw, 0, 0], [hw, 0, dz], [-hw, 0, dz], shade(cream, 0.8), null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    b.pop();
  }

  function leaf(b, w, h, cream) {
    b.at(w / 2, h / 2, 0, f => f.box(w, h, 0.05, cream));
    [[0.62, 0.3], [0.2, 0.3]].forEach(([y, hh]) => b.at(w / 2, h * y + h * hh / 2 - h * 0.15, 0.028, f => f.box(w * 0.66, h * hh * 0.9, 0.012, shade(cream, 0.9))));
    b.at(w - 0.08, h * 0.45, 0.06, f => f.ellipsoid(0.03, 0.03, 0.03, 6, 4, [0.85, 0.65, 0.25, 0.15]));
  }

  function niche(b, books, cream) {
    const w = 1.25, h = 2.5;
    b.at(0, h / 2 + 0.05, -0.03, f => f.box(w, h, 0.02, shade(cream, 0.82)));
    b.at(-w / 2 - 0.07, h / 2 + 0.3, 0.02, f => f.box(0.14, h + 0.6, 0.1, cream));
    b.at(w / 2 + 0.07, h / 2 + 0.3, 0.02, f => f.box(0.14, h + 0.6, 0.1, cream));
    b.at(0, 0.45, 0.06, f => f.box(w + 0.28, 0.9, 0.2, cream));
    for (let i = 0; i < 9; i++) {
      const a0 = (i / 9) * PI, a1 = ((i + 1) / 9) * PI;
      const cy = h + 0.05;
      b.tri([0, cy, -0.02], [C(a0) * w / 2, cy + S(a0) * w / 2, -0.02], [C(a1) * w / 2, cy + S(a1) * w / 2, -0.02], i % 2 ? shade(cream, 0.88) : shade(cream, 0.97), null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    }
    [1.15, 1.75, 2.35].forEach((y, i) => {
      b.at(0, y, 0.02, f => f.box(w, 0.04, 0.3, cream));
      if (i < 2) books.at(0, y + 0.02, 0.0, f => f.box(w * 0.86, 0.3, 0.2, [1, 1, 1, 0], { uvScale: 1 }));
    });
    [-0.36, 0, 0.36].forEach(x => b.at(x, 2.55, 0.0, f => f.prism(14, 0.13, 0.13, -0.01, 0.13, 0.13, 0.01, [0.92, 0.92, 0.95, 0.05], { phase: 0 })));
  }

  function framed(b, pic, M, w, h, frameCol) {
    b.push(M);
    pic.push(M);
    b.at(0, 0, 0, f => f.box(w + 0.14, h + 0.14, 0.05, frameCol));
    pic.at(0, 0, 0.03, f => f.quad([-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], [1, 1, 1, 0], null, FRONT));
    pic.pop();
    b.pop();
  }

  function buildOval(r, X) {
    const T = X.T;
    const A = ROOM.A, Bz = ROOM.B, H = ROOM.H;
    const cream = 0xdcc4b8;
    const meshes = [];
    const add = (b, opts) => { meshes.push(Object.assign({ mesh: r.mesh(b) }, opts || {})); return b; };
    const plain = new Builder(), wall = new Builder(), wood = new Builder(), carpet = new Builder(), drapes = new Builder();
    const blinds = new Builder(), books = new Builder(), sofa = new Builder(), leather = new Builder(), metal = new Builder();
    const N = 96;
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * PI * 2, t1 = ((i + 1) / N) * PI * 2;
      const P = (t, k, y) => [C(t) * A + k[0], y, S(t) * Bz + k[2]];
      const n0 = V3.norm([-C(t0) / A, 0, -S(t0) / Bz]), n1 = V3.norm([-C(t1) / A, 0, -S(t1) / Bz]);
      const seg = (y0, y1, col, inset) => {
        const k0 = V3.mul(n0, inset), k1 = V3.mul(n1, inset);
        const u0 = i * 0.42, u1 = (i + 1) * 0.42;
        wall.quad(P(t0, k0, y0), P(t1, k1, y0), P(t1, k1, y1), P(t0, k0, y1), col, [[u0, y0 * 0.5], [u1, y0 * 0.5], [u1, y1 * 0.5], [u0, y1 * 0.5]], [n0, n1, n1, n0]);
      };
      seg(0, 0.16, shade(cream, 0.86), 0.035);
      seg(0.16, 1.02, shade(cream, 1.02), 0);
      seg(1.02, 1.1, shade(cream, 1.05), 0.045);
      seg(1.1, H - 0.34, 0xb89ea6, 0);
      seg(H - 0.34, H - 0.2, shade(cream, 0.96), 0.05);
      seg(H - 0.2, H, shade(cream, 1.04), 0.09);
      if (i % 3 === 0) {
        const th = (i + 1.5) / N * PI * 2;
        const near = [DOOR_TH, PI * 1.2, PI * 1.81, FIRE_TH, PI * 2, PI * 1.39, PI * 1.5, PI * 1.61].some(a => Math.abs(th - a) < 0.17);
        if (!near) {
          plain.push(wallFrame(th, 0.012));
          plain.at(0, 0.6, 0, f => f.box(0.62, 0.62, 0.025, shade(cream, 1.06)));
          plain.at(0, 0.6, 0.014, f => f.box(0.5, 0.5, 0.012, shade(cream, 0.93)));
          plain.pop();
        }
      }
    }
    ellipseFan(carpet, A, Bz, 0, N, [1, 1, 1, 0], p => [p[0] * 0.5, p[2] * 0.5]);
    const ceilK = 0.62;
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * PI * 2, t1 = ((i + 1) / N) * PI * 2;
      const P = (t, k, y) => [C(t) * A * k, y, S(t) * Bz * k];
      const dn = [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]];
      plain.quad(P(t0, 1, H), P(t1, 1, H), P(t1, ceilK, H), P(t0, ceilK, H), shade(cream, 0.9), null, dn);
      const nIn = V3.norm([-C(t0), 0, -S(t0)]);
      plain.quad(P(t0, ceilK, H), P(t1, ceilK, H), P(t1, ceilK, H + 0.3), P(t0, ceilK, H + 0.3), [0.86, 0.74, 0.66, 0.25], null, [nIn, nIn, nIn, nIn]);
    }
    const ceilIn = new Builder();
    ellipseFan(ceilIn, A * ceilK, Bz * ceilK, H + 0.3, N, shade(cream, 0.95), null, false);
    add(ceilIn);
    const glowB = new Builder();
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * PI * 2, a1 = ((i + 1) / N) * PI * 2;
      const y = H + 0.29;
      const p0 = [C(a0) * A * ceilK, y, S(a0) * Bz * ceilK], p1 = [C(a1) * A * ceilK, y, S(a1) * Bz * ceilK];
      const q0 = [p0[0] * 0.45, y, p0[2] * 0.45], q1 = [p1[0] * 0.45, y, p1[2] * 0.45];
      const hot = [1, 0.22, 0.12, 1], mid = [0.7, 0.07, 0.05, 1], rim = [0.2, 0.01, 0.01, 1];
      glowB.tri([0, y, 0], q1, q0, [hot, mid, mid], null, [[0, -1, 0], [0, -1, 0], [0, -1, 0]]);
      glowB.quad(q0, q1, p1, p0, [mid, mid, rim, rim], null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    }
    const glow = r.mesh(glowB);

    [PI * 1.39, PI * 1.5, PI * 1.61].forEach(th => {
      plain.push(wallFrame(th, 0.015));
      blinds.push(wallFrame(th, 0.015));
      drapes.push(wallFrame(th, 0.015));
      plain.at(0, 2.15, 0, f => f.box(1.5, 2.7, 0.04, shade(cream, 0.92)));
      blinds.at(0, 2.15, 0.03, f => f.quad([-0.62, -1.18, 0], [0.62, -1.18, 0], [0.62, 1.18, 0], [-0.62, 1.18, 0], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 8], [0, 8]], FRONT));
      [-1, 1].forEach(s => drapes.at(s * 0.82, 1.95, 0.08, f => f.box(0.5, 3.9, 0.1, [1, 1, 1, 0], { uvScale: 1.4 })));
      drapes.at(0, 3.85, 0.12, f => f.box(1.9, 0.42, 0.14, [1, 1, 1, 0], { uvScale: 1.2 }));
      [-1, 1].forEach(s => plain.at(s * 0.82, 1.15, 0.15, f => f.box(0.5, 0.06, 0.06, 0xd8a838)));
      for (let k = 0; k < 6; k++) plain.at(-0.85 + k * 0.34, 3.85, 0.2, f => f.box(0.07, 0.4, 0.02, 0xd8a838));
      plain.pop();
      blinds.pop();
      drapes.pop();
    });

    const deskX = SPOTS.desk[0], deskZ = SPOTS.desk[1];
    wood.push(place(deskX, deskZ, 0));
    wood.at(0, 0.38, 0, f => f.box(1.9, 0.72, 0.9, 0xa86a4a, { uvScale: 2 }));
    wood.at(0, 0.755, 0, f => f.box(2.04, 0.05, 1.02, 0xc07a52, { uvScale: 2 }));
    wood.at(0, 0.36, 0.455, f => f.box(0.62, 0.5, 0.02, 0x8a5236, { uvScale: 2 }));
    [-0.62, 0.62].forEach(x => {
      wood.at(x, 0.32, 0.455, f => f.box(0.46, 0.46, 0.02, 0x96583a, { uvScale: 2 }));
      wood.at(x, 0.62, 0.462, f => f.box(0.4, 0.1, 0.012, 0x7a4228, { uvScale: 2 }));
    });
    wood.at(0, 0.04, 0, f => f.box(1.96, 0.08, 0.96, 0x6a3a22, { uvScale: 2 }));
    wood.pop();
    const top = 0.78;
    plain.push(place(deskX, deskZ, 0));
    plain.at(0.02, top + 0.06, 0.18, f => {
      f.box(0.66, 0.1, 0.46, [0.93, 0.9, 0.86, 0.05]);
      f.at(0, 0.055, 0, g => g.box(0.68, 0.012, 0.47, 0xb02a2a));
      f.push(M4.translate(-0.17, 0.07, 0), M4.rotZ(0.12));
      f.box(0.33, 0.02, 0.44, [0.98, 0.97, 0.93, 0.08]);
      f.pop();
      f.push(M4.translate(0.17, 0.07, 0), M4.rotZ(-0.12));
      f.box(0.33, 0.02, 0.44, [0.98, 0.97, 0.93, 0.08]);
      f.pop();
    });
    plain.at(0, top + 0.02, 0.43, f => {
      f.box(0.42, 0.04, 0.12, 0xe8b830);
      [-0.13, 0.13].forEach(x => {
        f.at(x, 0.03, 0, g => g.ellipsoid(0.025, 0.02, 0.025, 6, 4, 0x6a3a1a));
        f.push(M4.translate(x, 0.03, 0), M4.rotX(0.15), M4.rotZ(x > 0 ? -0.4 : 0.4));
        f.prism(6, 0.008, 0.008, 0, 0.004, 0.004, 0.2, 0x2a1a10);
        f.pop();
      });
    });
    plain.at(0.68, top, 0.2, f => {
      f.prism(10, 0.06, 0.06, 0, 0.065, 0.065, 0.14, 0xd08a2a);
      for (let k = 0; k < 6; k++) f.at(-0.03 + (k % 3) * 0.03, 0.14, -0.015 + Math.floor(k / 3) * 0.03, g => g.prism(5, 0.006, 0.006, 0, 0.006, 0.006, 0.12, [0xd04040, 0x40a040, 0xe0c040][k % 3]));
    });
    plain.at(0.86, top + 0.08, -0.05, f => f.box(0.24, 0.16, 0.2, 0x1a1a22));
    plain.at(-0.55, top + 0.03, 0.28, f => starMesh(f, 0.09, 0.04, 0, 0.04, 0xd82a20));
    plain.pop();
    const plateB = new Builder();
    plateB.push(place(deskX, deskZ, 0));
    plateB.push(M4.translate(-0.78, top + 0.05, 0.36), M4.rotX(-0.5));
    plateB.quad([-0.17, -0.04, 0], [0.17, -0.04, 0], [0.17, 0.04, 0], [-0.17, 0.04, 0], [1, 1, 1, 0], null, FRONT);
    plateB.pop();
    plateB.pop();
    plain.push(place(deskX, deskZ, 0));
    plain.push(M4.translate(-0.78, top + 0.04, 0.35), M4.rotX(-0.5));
    plain.box(0.38, 0.1, 0.03, 0x2a1a1a);
    plain.pop();
    plain.pop();

    const chair = M4.chain(M4.translate(SPOTS.chair[0], 0, SPOTS.chair[1]));
    leather.push(chair);
    leather.at(0, 0.5, 0, f => f.box(0.82, 0.14, 0.72, [1, 1, 1, 0], { uvScale: 3 }));
    leather.at(0, 0.98, -0.32, f => f.box(0.86, 0.9, 0.16, [1, 1, 1, 0], { uvScale: 3 }));
    leather.at(0, 1.43, -0.32, f => f.ellipsoid(0.46, 0.12, 0.1, 10, 5, [1, 1, 1, 0]));
    [-1, 1].forEach(s => {
      leather.at(s * 0.44, 1.08, -0.16, f => f.box(0.12, 0.62, 0.36, [1, 1, 1, 0], { uvScale: 3 }));
      leather.at(s * 0.44, 0.78, 0.06, f => f.box(0.14, 0.32, 0.62, [1, 1, 1, 0], { uvScale: 3 }));
    });
    leather.pop();
    wood.push(chair);
    [[-0.34, -0.3], [0.34, -0.3], [-0.34, 0.3], [0.34, 0.3]].forEach(([x, z]) => wood.at(x, 0.22, z, f => f.box(0.06, 0.44, 0.06, 0x3a1a10)));
    wood.pop();

    [[-1.25, 'us'], [1.25, 'pres']].forEach(([x, kind]) => {
      metal.push(place(x, -4.35, 0));
      metal.at(0, 0, 0, f => f.prism(8, 0.025, 0.025, 0, 0.022, 0.022, 2.9, [0.8, 0.62, 0.3, 0.1]));
      metal.at(0, 2.98, 0, f => f.ellipsoid(0.07, 0.09, 0.07, 6, 5, [0.9, 0.72, 0.3, 0.25]));
      metal.at(0, 0.02, 0, f => f.prism(10, 0.18, 0.18, 0, 0.16, 0.16, 0.08, 0x3a2a1a));
      metal.pop();
    });
    const flagUS = new Builder(), flagPres = new Builder();
    [[-1.25, flagUS], [1.25, flagPres]].forEach(([x, fb]) => {
      fb.push(place(x, -4.35, 0));
      const n = 8, wdt = 0.62, y0 = 1.25, y1 = 2.85;
      for (let i = 0; i < n; i++) {
        const xa = 0.03 + (i / n) * wdt, xb = 0.03 + ((i + 1) / n) * wdt;
        const za = (i % 2 ? 0.07 : -0.04), zb = ((i + 1) % 2 ? 0.07 : -0.04);
        const nrm = V3.norm([za - zb, 0, xb - xa]);
        fb.quad([xa * (x < 0 ? 1 : -1), y0 + i * 0.03, za], [xb * (x < 0 ? 1 : -1), y0 + (i + 1) * 0.03, zb], [xb * (x < 0 ? 1 : -1), y1, zb], [xa * (x < 0 ? 1 : -1), y1, za], [1, 1, 1, 0], [[i / n, 0], [(i + 1) / n, 0], [(i + 1) / n, 1], [i / n, 1]], [nrm, nrm, nrm, nrm]);
      }
      fb.pop();
    });

    const easel = new Builder(), calB = new Builder();
    [[-0.32, 0.22], [0.32, 0.22], [0, -0.32]].forEach(([x, z]) => {
      easel.push(M4.translate(x * 0.5, 0, z * 0.5), M4.rotX(z < 0 ? 0.25 : -0.12), M4.rotZ(-x * 0.4));
      easel.prism(5, 0.018, 0.018, 0, 0.015, 0.015, 1.9, 0x5a3a22);
      easel.pop();
    });
    easel.at(0, 1.47, 0.06, f => f.box(0.82, 1.02, 0.04, 0x6a4a30));
    calB.quad([-0.38, 0.99, 0.085], [0.38, 0.99, 0.085], [0.38, 1.95, 0.085], [-0.38, 1.95, 0.085], [1, 1, 1, 0.12], null, FRONT);

    const globeStand = new Builder();
    globeStand.push(M4.rotY(0.4));
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * PI * 2;
      globeStand.push(M4.rotY(a), M4.translate(0, 0, 0.28), M4.rotX(-0.32));
      globeStand.prism(5, 0.03, 0.03, 0, 0.025, 0.025, 0.66, 0x5a2e18);
      globeStand.pop();
    }
    globeStand.at(0, 0.62, 0, f => ringY(f, 0.5, 0.44, 0, 24, 0x7a4426));
    globeStand.at(0, 0.6, 0, f => f.prism(24, 0.5, 0.5, -0.03, 0.5, 0.5, 0.0, 0x6a3a20, { capTop: false }));
    for (let i = 0; i < 16; i++) {
      const a0 = -PI / 2 + (i / 16) * PI, a1 = -PI / 2 + ((i + 1) / 16) * PI;
      globeStand.push(M4.translate(0, 1.04, 0), M4.rotZ(0.4));
      globeStand.quad([C(a0) * 0.46, S(a0) * 0.46, -0.012], [C(a1) * 0.46, S(a1) * 0.46, -0.012], [C(a1) * 0.46, S(a1) * 0.46, 0.012], [C(a0) * 0.46, S(a0) * 0.46, 0.012], [0.8, 0.6, 0.28, 0.12], null, null);
      globeStand.pop();
    }
    globeStand.pop();
    const globeBall = new Builder();
    patch(globeBall, 0.42, 0.42, 0.42, -PI, PI, -PI / 2, PI / 2, 24, 14, [1, 1, 1, 0.04], [1, 1]);

    const sofaB = new Builder(), sofaLegs = new Builder(), pillows = new Builder();
    sofaB.at(0, 0.36, 0.02, f => f.box(2.3, 0.22, 0.82, [1, 1, 1, 0], { uvScale: 2.4 }));
    sofaB.at(0, 0.78, -0.36, f => f.box(2.3, 0.72, 0.22, [1, 1, 1, 0], { uvScale: 2.4 }));
    sofaB.push(M4.translate(0, 1.12, -0.38), M4.rotZ(PI / 2));
    sofaB.prism(12, 0.13, 0.13, -1.15, 0.13, 0.13, 1.15, [1, 1, 1, 0], { capBottom: true });
    sofaB.pop();
    [-1, 1].forEach(s => {
      sofaB.at(s * 1.2, 0.55, 0, f => f.box(0.22, 0.5, 0.86, [1, 1, 1, 0], { uvScale: 2.4 }));
      sofaB.push(M4.translate(s * 1.24, 0.82, 0.02), M4.rotX(PI / 2));
      sofaB.prism(12, 0.17, 0.17, -0.45, 0.17, 0.17, 0.45, [1, 1, 1, 0], { capBottom: true });
      sofaB.pop();
    });
    [[-1.15, -0.35], [1.15, -0.35], [-1.15, 0.38], [1.15, 0.38]].forEach(([x, z]) => sofaLegs.at(x, 0.12, z, f => f.prism(6, 0.035, 0.035, -0.12, 0.05, 0.05, 0.14, 0x3a1a10)));
    [-0.82, 0.82].forEach(x => {
      pillows.push(M4.translate(x, 0.78, -0.2), M4.rotX(-0.25), M4.rotZ(x * 0.2));
      starMesh(pillows, 0.3, 0.14, -0.06, 0.06, [0.95, 0.66, 0.12, 0.06], [0.85, 0.5, 0.08, 0.04]);
      pillows.pop();
    });

    [[SPOTS.chairA, 1.35], [SPOTS.chairB, 1.75]].forEach(([p, ry]) => {
      sofa.push(place(p[0], p[1], ry));
      sofa.at(0, 0.36, 0.02, f => f.box(0.86, 0.22, 0.8, [1, 1, 1, 0], { uvScale: 2.4 }));
      sofa.at(0, 0.82, -0.34, f => f.box(0.86, 0.8, 0.18, [1, 1, 1, 0], { uvScale: 2.4 }));
      [-1, 1].forEach(s => sofa.at(s * 0.48, 0.58, 0, f => f.box(0.14, 0.44, 0.8, [1, 1, 1, 0], { uvScale: 2.4 })));
      sofa.pop();
      wood.push(place(p[0], p[1], ry));
      [[-0.38, -0.32], [0.38, -0.32], [-0.38, 0.34], [0.38, 0.34]].forEach(([x, z]) => wood.at(x, 0.12, z, f => f.box(0.06, 0.24, 0.06, 0x3a1a10)));
      wood.pop();
    });

    const doorLeaf = new Builder();
    leaf(doorLeaf, 0.72, 2.5, 0xf2e2c4);
    plain.push(wallFrame(DOOR_TH, 0.01));
    door(plain, 1.44, 2.5, 0xf2e2c4);
    plain.at(0, 1.26, 0.006, f => f.box(1.44, 2.52, 0.004, [0.02, 0.015, 0.012, 0]));
    plain.pop();
    const signB = new Builder();
    signB.push(wallFrame(DOOR_TH, 0.5));
    signB.quad([-0.72, 2.9, 0], [0.72, 2.9, 0], [0.72, 3.44, 0], [-0.72, 3.44, 0], [1, 1, 1, 1], null, FRONT);
    signB.pop();
    [PI * 1.2, PI * 1.81].forEach(th => {
      plain.push(wallFrame(th, 0.01));
      door(plain, 1.0, 2.4, 0xf2e2c4);
      leaf(plain, 0.5, 2.4, 0xf2e2c4);
      plain.push(M4.translate(-0.5, 0, 0));
      leaf(plain, 0.5, 2.4, 0xf2e2c4);
      plain.pop();
      plain.pop();
    });

    const pics = new Builder(), tank = new Builder(), badges = new Builder(), portrait = new Builder();
    const nicheAt = (th) => {
      plain.push(wallFrame(th, 0.01));
      books.push(wallFrame(th, 0.01));
      niche(plain, books, cream);
      books.pop();
      plain.pop();
    };
    [DOOR_TH - 0.5, DOOR_TH + 0.5].forEach(nicheAt);
    [DOOR_TH - 0.25, DOOR_TH + 0.27].forEach(th => framed(wood, tank, wallFrame(th, 0.02, 2.0), 0.95, 0.7, 0x4a2a16));
    [PI * 1.27, PI * 1.33].forEach((th, i) => framed(wood, badges, wallFrame(th, 0.02, 2.2 - i * 0.1), 0.6, 0.72, 0x3a2414));
    framed(wood, portrait, wallFrame(PORTRAIT_TH, 0.02, 2.15), 0.85, 1.05, [0.85, 0.66, 0.28, 0.12]);
    plain.push(wallFrame(PORTRAIT_TH, 0.02));
    plain.at(0, 0.45, 0.22, f => f.box(1.25, 0.9, 0.45, shade(cream, 0.98)));
    [-0.3, 0.3].forEach(x => plain.at(x, 0.55, 0.45, f => f.ellipsoid(0.03, 0.03, 0.02, 6, 4, [0.85, 0.65, 0.25, 0.15])));
    plain.at(0.32, 0.9, 0.24, f => {
      f.prism(10, 0.07, 0.07, 0, 0.12, 0.12, 0.12, 0x3050b0);
      f.at(0, 0.12, 0, g => g.prism(10, 0.12, 0.12, 0, 0.16, 0.16, 0.22, 0x3a60c8));
      f.at(0, 0.34, 0, g => g.prism(10, 0.16, 0.16, 0, 0.08, 0.08, 0.06, 0x2a48a0));
      [-1, 1].forEach(s => f.at(s * 0.18, 0.26, 0, g => g.box(0.04, 0.1, 0.02, 0x3050b0)));
    });
    plain.pop();
    nicheAt(PORTRAIT_TH - 0.3);

    const marble = 0xc4ae96;
    plain.push(wallFrame(FIRE_TH, 0.02));
    plain.at(0, 1.25, 0.24, f => f.box(2.1, 0.08, 0.44, shade(marble, 1.06)));
    [-0.85, 0.85].forEach(x => {
      plain.at(x, 0.62, 0.18, f => f.box(0.3, 1.2, 0.3, shade(marble, 1.02)));
      plain.at(x, 0.62, 0.34, f => f.prism(8, 0.07, 0.07, -0.55, 0.07, 0.07, 0.55, shade(marble, 1.08)));
    });
    plain.at(0, 1.13, 0.18, f => f.box(1.5, 0.16, 0.28, shade(marble, 0.98)));
    plain.at(0, 0.5, 0.02, f => f.box(1.4, 1.0, 0.04, 0x1a0e0a));
    plain.at(0, 0.04, 0.35, f => f.box(2.0, 0.08, 0.6, shade(cream, 0.85)));
    [-0.32, 0.32].forEach(x => {
      for (let i = 0; i < 10; i++) {
        const a0 = (i / 10) * PI, a1 = ((i + 1) / 10) * PI;
        const R = 0.3;
        plain.quad([x + C(a0) * R, 0.6 + S(a0) * R, 0.14], [x + C(a1) * R, 0.6 + S(a1) * R, 0.14], [x + C(a1) * (R - 0.04), 0.6 + S(a1) * (R - 0.04), 0.14], [x + C(a0) * (R - 0.04), 0.6 + S(a0) * (R - 0.04), 0.14], [0.85, 0.62, 0.22, 0.25], null, FRONT);
      }
      [-1, 1].forEach(s => plain.at(x + s * 0.28, 0.3, 0.14, f => f.box(0.04, 0.6, 0.02, [0.85, 0.62, 0.22, 0.25])));
    });
    plain.at(-0.7, 1.29, 0.25, f => {
      f.prism(8, 0.05, 0.05, 0, 0.07, 0.07, 0.2, 0x3a2a6a);
      for (let k = 0; k < 7; k++) f.at(-0.06 + (k % 4) * 0.04, 0.22 + Math.floor(k / 4) * 0.08, 0, g => g.ellipsoid(0.03, 0.03, 0.03, 5, 4, [0.85, 0.08, 0.08, 0.1]));
    });
    plain.at(0.1, 1.29, 0.25, f => {
      f.prism(10, 0.06, 0.06, 0, 0.1, 0.1, 0.16, 0x1a2a6a);
      f.at(0, 0.16, 0, g => g.prism(10, 0.1, 0.1, 0, 0.04, 0.04, 0.14, 0x1a2a6a));
    });
    plain.pop();
    framed(wood, pics, wallFrame(FIRE_TH - 0.32, 0.02, 2.0), 0.65, 0.5, 0x3a2414);
    const fireB = new Builder();
    fireB.push(wallFrame(FIRE_TH, 0.06));
    fireB.at(0, 0.35, 0, f => f.ellipsoid(0.5, 0.28, 0.02, 10, 6, [1, 0.45, 0.35, 1]));
    fireB.pop();

    wood.push(place(SPOTS.eagle[0], SPOTS.eagle[1], 0.6));
    wood.at(0, 0, 0, f => f.prism(8, 0.05, 0.05, 0, 0.04, 0.04, 0.7, 0x5a2e18));
    wood.at(0, 0.7, 0, f => f.prism(14, 0.42, 0.42, 0, 0.42, 0.42, 0.05, 0x7a4426));
    wood.at(0, 0.02, 0, f => f.prism(8, 0.24, 0.24, 0, 0.2, 0.2, 0.05, 0x5a2e18));
    wood.pop();
    const eagle = new Builder();
    const bronze = [0.6, 0.37, 0.18, 0.06];
    const bronzeD = shade(bronze, 0.72);
    eagle.push(place(SPOTS.eagle[0], SPOTS.eagle[1], 0.6));
    eagle.at(0, 0.75, 0, f => {
      f.prism(8, 0.07, 0.07, 0, 0.06, 0.06, 0.05, bronze);
      f.prism(6, 0.016, 0.016, 0.05, 0.014, 0.014, 0.34, bronze);
      f.at(0, 0.5, 0, g => {
        g.ellipsoid(0.11, 0.15, 0.1, 10, 7, bronze);
        g.at(0, 0.17, 0.04, k => k.ellipsoid(0.07, 0.068, 0.072, 8, 6, bronze));
        g.push(M4.translate(0, 0.16, 0.11), M4.rotX(0.5));
        g.prism(5, 0.03, 0.024, 0, 0.004, 0.004, 0.07, bronzeD);
        g.pop();
        [-1, 1].forEach(s => {
          for (let i = 0; i < 5; i++) {
            const a0 = 0.25 + i * 0.22;
            g.push(M4.translate(s * 0.08, 0.06, -0.03), M4.rotZ(-s * a0), M4.rotX(-0.25));
            g.at(0, 0.2 + i * 0.015, 0, k => k.ellipsoid(0.034, 0.21 + i * 0.02, 0.014, 6, 6, i % 2 ? bronze : shade(bronze, 0.9)));
            g.pop();
          }
          g.at(s * 0.05, -0.16, 0.04, k => k.prism(4, 0.014, 0.014, -0.04, 0.014, 0.014, 0.03, bronzeD));
        });
        g.at(0.11, -0.2, 0.07, k => {
          k.box(0.14, 0.035, 0.03, bronzeD);
          k.at(0.04, 0.0, 0, q => q.prism(10, 0.03, 0.03, -0.02, 0.03, 0.03, 0.02, bronzeD));
          k.at(-0.06, -0.04, 0, q => q.box(0.035, 0.07, 0.025, bronzeD));
        });
        g.push(M4.translate(-0.11, -0.22, 0.06), M4.rotZ(0.25));
        g.prism(10, 0.03, 0.03, -0.08, 0.03, 0.03, 0.08, shade(bronze, 1.15), { capBottom: true });
        g.pop();
      });
    });
    eagle.pop();

    metal.push(place(SPOTS.bell[0], SPOTS.bell[1], 0.5));
    const bellCol = [0.72, 0.62, 0.42, 0.04];
    metal.at(0, 0.02, 0, f => {
      f.prism(14, 0.34, 0.34, 0, 0.3, 0.3, 0.08, bellCol, { capBottom: true });
      f.prism(14, 0.3, 0.3, 0.08, 0.22, 0.22, 0.4, bellCol);
      f.prism(14, 0.22, 0.22, 0.4, 0.15, 0.15, 0.58, bellCol);
      f.at(0.12, 0.25, 0.27, g => g.box(0.012, 0.3, 0.02, 0x3a2a1a));
    });
    metal.pop();
    wood.push(place(SPOTS.bell[0], SPOTS.bell[1], 0.5));
    wood.at(0, 0.66, 0, f => f.box(0.62, 0.12, 0.16, 0x5a3418));
    wood.at(0, 0.62, 0, f => f.prism(10, 0.07, 0.07, 0, 0.07, 0.07, 0.1, 0xb0a890));
    wood.pop();

    const nut = { body: new Builder(), jaw: new Builder(), hands: new Builder() };
    wood.push(place(SPOTS.nut[0], SPOTS.nut[1], SPOTS.nutRy));
    wood.at(0, 0, 0, f => f.prism(6, 0.04, 0.04, 0, 0.035, 0.035, 0.62, 0x4a2414));
    wood.at(0, 0.62, 0, f => f.prism(12, 0.3, 0.3, 0, 0.3, 0.3, 0.04, 0x6a3a20));
    wood.pop();
    nut.body.at(0, 0, 0, f => {
      f.prism(8, 0.13, 0.11, 0, 0.11, 0.09, 0.3, [0.36, 0.14, 0.5, 0.04], { capBottom: true });
      f.at(0, 0.3, 0, g => g.prism(8, 0.12, 0.1, 0, 0.06, 0.05, 0.05, [0.9, 0.5, 0.1, 0.1]));
      f.at(0, 0.44, 0, g => {
        const skin = [0.94, 0.74, 0.64, 0.08], wig = [0.92, 0.92, 0.95, 0.12];
        g.ellipsoid(0.105, 0.125, 0.105, 12, 9, skin);
        g.at(0, 0.0, 0.11, k => k.ellipsoid(0.026, 0.05, 0.04, 6, 5, shade(skin, 0.95)));
        g.at(0, 0.075, -0.025, k => k.ellipsoid(0.112, 0.07, 0.1, 10, 6, wig));
        g.at(0, -0.02, -0.1, k => k.ellipsoid(0.06, 0.09, 0.04, 6, 5, wig));
        [-1, 1].forEach(s => {
          g.push(M4.translate(s * 0.1, 0.03, -0.015), M4.rotX(PI / 2));
          g.prism(10, 0.034, 0.034, -0.06, 0.034, 0.034, 0.06, wig, { capBottom: true });
          g.pop();
          g.push(M4.translate(s * 0.1, -0.035, -0.02), M4.rotX(PI / 2));
          g.prism(10, 0.03, 0.03, -0.05, 0.03, 0.03, 0.05, wig, { capBottom: true });
          g.pop();
          g.at(s * 0.038, 0.045, 0.094, k => k.ellipsoid(s > 0 ? 0.03 : 0.022, s > 0 ? 0.034 : 0.018, 0.018, 8, 5, [0.98, 0.98, 0.95, 0.2]));
          g.at(s * 0.038, 0.045, 0.108, k => k.ellipsoid(0.011, 0.011, 0.006, 6, 3, [0.2, 0.38, 0.6, 0.1]));
          g.push(M4.translate(s * 0.042, 0.088, 0.09), M4.rotZ(s * 0.35));
          g.box(0.05, 0.016, 0.02, wig);
          g.pop();
        });
        g.at(0, -0.045, 0.094, k => k.box(0.075, 0.03, 0.03, [0.18, 0.03, 0.04, 0]));
        g.at(0, -0.032, 0.103, k => k.box(0.07, 0.008, 0.012, [0.96, 0.95, 0.9, 0.2]));
      });
    });
    nut.jaw.at(0, 0, 0, f => {
      for (let k = 0; k < 4; k++) f.at(-0.045 + k * 0.03, -0.12, 0, g => g.box(0.024, 0.24, 0.03, [0.94, 0.94, 0.92, 0.12]));
      f.at(0, -0.005, 0, g => g.box(0.11, 0.02, 0.04, [0.95, 0.93, 0.85, 0.15]));
    });
    [-1, 1].forEach(s => nut.hands.at(s * 0.086, 0, 0, f => {
      f.push(M4.rotZ(-s * 0.25));
      f.ellipsoid(0.034, 0.06, 0.026, 8, 5, [0.97, 0.96, 0.95, 0.15]);
      f.at(-s * 0.03, -0.02, 0.01, g => g.ellipsoid(0.014, 0.03, 0.014, 5, 4, [0.97, 0.96, 0.95, 0.15]));
      f.at(0, -0.1, -0.02, g => g.prism(6, 0.025, 0.025, -0.12, 0.03, 0.03, 0, [0.36, 0.14, 0.5, 0.04]));
      f.pop();
    }));

    const monkey = { body: new Builder(), arm: new Builder() };
    monkey.body.at(0, 0, 0, f => {
      f.prism(8, 0.07, 0.06, 0, 0.08, 0.07, 0.14, 0xf0c020, { capBottom: true });
      for (let k = 0; k < 3; k++) f.at(0, 0.02 + k * 0.045, 0, g => g.prism(8, 0.082, 0.072, 0, 0.082, 0.072, 0.02, 0xc8202a, { capTop: false }));
      f.at(0, 0.2, 0, g => {
        g.ellipsoid(0.075, 0.07, 0.068, 8, 6, 0x3a2a24);
        g.at(0, -0.015, 0.05, k => k.ellipsoid(0.055, 0.045, 0.03, 8, 5, 0xe8c8a0));
        g.at(0, -0.03, 0.075, k => k.box(0.07, 0.025, 0.012, [0.98, 0.98, 0.95, 0.2]));
        [-1, 1].forEach(s => {
          g.at(s * 0.028, 0.018, 0.064, k => k.ellipsoid(0.017, 0.017, 0.01, 5, 3, [0.98, 0.98, 0.95, 0.2]));
          g.at(s * 0.028, 0.018, 0.072, k => k.ellipsoid(0.008, 0.008, 0.004, 4, 3, [0.7, 0.05, 0.05, 0.2]));
          g.at(s * 0.08, 0.005, 0, k => k.ellipsoid(0.026, 0.03, 0.012, 5, 4, 0xe8c8a0));
        });
        g.at(0, 0.07, 0, k => k.prism(10, 0.04, 0.04, 0, 0.034, 0.034, 0.055, 0xc81818));
        g.at(0.02, 0.13, 0.02, k => k.box(0.012, 0.03, 0.012, 0xe8c030));
      });
    });
    monkey.arm.at(0, 0, 0, f => {
      f.prism(6, 0.02, 0.02, -0.1, 0.022, 0.022, 0, 0x3a2a24, { capBottom: true });
      f.push(M4.translate(0, -0.11, 0.02), M4.rotX(PI / 2));
      f.prism(12, 0.06, 0.06, -0.005, 0.02, 0.02, 0.01, [0.92, 0.72, 0.18, 0.3], { capBottom: true });
      f.pop();
    });

    const plants = new Builder();
    const plantAt = (x, z) => {
      plants.push(place(x, z, 0));
      plants.at(0, 0, 0, f => f.prism(10, 0.18, 0.18, 0, 0.22, 0.22, 0.4, 0xb8402a, { capBottom: true }));
      plants.at(0, 0.4, 0, f => f.prism(6, 0.025, 0.025, 0, 0.02, 0.02, 0.6, 0x5a3a1a));
      const g = rand(Math.round(x * 100 + z * 7));
      for (let k = 0; k < 16; k++) {
        const a = g() * PI * 2, y = 0.75 + g() * 0.6, rr = 0.1 + g() * 0.28;
        plants.at(C(a) * rr, y, S(a) * rr, f => f.ellipsoid(0.12, 0.07, 0.1, 6, 4, [0.18 + g() * 0.1, 0.42 + g() * 0.15, 0.16, 0.02]));
      }
      plants.pop();
    };
    plantAt(SPOTS.plant[0], SPOTS.plant[1]);
    const pwf = wallFrame(PORTRAIT_TH, 0.45);
    const pwp = M4.point(pwf, [1.05, 0, 0]);
    plantAt(pwp[0], pwp[2]);

    const rugB = new Builder();
    ellipseFan(rugB, 4.6, 3.6, 0.006, 64, [1, 1, 1, 0], p => [0.5 + p[0] / 9.2, 0.5 - p[2] / 7.2]);
    const sealB = new Builder();
    ellipseFan(sealB, 1.75, 1.75, 0.01, 48, [1, 1, 1, 0], p => [0.5 + p[0] / 3.5, 0.5 - p[2] / 3.5]);

    add(wall, { texture: T.wall });
    add(carpet, { texture: T.carpet });
    add(rugB, { texture: T.rug });
    add(sealB, { texture: T.seal });
    add(plain);
    add(wood, { texture: T.wood });
    add(drapes, { texture: T.drape });
    add(blinds, { texture: T.blinds });
    add(books, { texture: T.books });
    add(sofa, { texture: T.sofa });
    add(leather, { texture: T.leather });
    add(metal);
    add(eagle);
    add(plants);
    add(flagUS, { texture: T.flagSmall });
    add(flagPres, { texture: T.presFlag });
    add(plateB, { texture: T.plate });
    add(tank, { texture: T.tank });
    add(badges, { texture: T.badges });
    add(portrait, { texture: T.portrait });
    add(pics, { texture: T.badges });
    return {
      meshes,
      glow,
      fire: r.mesh(fireB),
      sign: r.mesh(signB),
      leaf: r.mesh(doorLeaf),
      sofa: { body: r.mesh(sofaB), legs: r.mesh(sofaLegs), pillows: r.mesh(pillows) },
      calendar: { easel: r.mesh(easel), page: r.mesh(calB) },
      globe: r.mesh(globeBall),
      globeStand: r.mesh(globeStand),
      nut: { body: r.mesh(nut.body), jaw: r.mesh(nut.jaw), hands: r.mesh(nut.hands) },
      monkey: { body: r.mesh(monkey.body), arm: r.mesh(monkey.arm) }
    };
  }

  const LETTERS = {
    W: [[0, 1, 0.22, 0], [0.22, 0, 0.42, 0.62], [0.42, 0.62, 0.62, 0], [0.62, 0, 0.84, 1]],
    A: [[0, 0, 0.36, 1], [0.36, 1, 0.72, 0], [0.16, 0.36, 0.56, 0.36]],
    R: [[0.04, 0, 0.04, 1], [0.04, 1, 0.42, 1], [0.04, 0.5, 0.42, 0.5], [0.3, 0.5, 0.66, 0]]
  };

  function warLetters(b, x0, y0, h, z0, z1, col) {
    let x = x0;
    const thick = h * 0.2;
    [['W', 0.84], ['A', 0.72], ['R', 0.7]].forEach(([ch, wk]) => {
      LETTERS[ch].forEach(([ax, ay, bx, by]) => beam(b, x + ax * h, y0 + ay * h, x + bx * h, y0 + by * h, thick, z0, z1, col));
      if (ch === 'R') {
        for (let i = 0; i < 8; i++) {
          const a0 = -PI / 2 + (i / 8) * PI, a1 = -PI / 2 + ((i + 1) / 8) * PI;
          const cx = x + 0.42 * h, cy = y0 + 0.75 * h, rr = 0.25 * h;
          beam(b, cx + C(a0) * rr, cy + S(a0) * rr, cx + C(a1) * rr, cy + S(a1) * rr, thick, z0, z1, col);
        }
      }
      x += wk * h + h * 0.14;
    });
    return x - h * 0.14;
  }

  function buildStage(r, X) {
    const meshes = [];
    const add = (b, opts) => meshes.push(Object.assign({ mesh: r.mesh(b) }, opts || {}));
    const floor = new Builder();
    floor.quad([-14, 0, -6], [14, 0, -6], [14, 0, 14], [-14, 0, 14], [0.06, 0.06, 0.08, 0], null, UP);
    const back = new Builder();
    const P = [[-6, 0], [6, 0], [6, 4.6], [0, 7.4], [-6, 4.6]];
    const frontZ = -3.2;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], c = P[(i + 1) % P.length];
      back.tri([0, 3, frontZ], [a[0], a[1], frontZ], [c[0], c[1], frontZ], 0x3c4256, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      beam(back, a[0], a[1], c[0], c[1], 0.36, frontZ, frontZ + 0.18, 0x2a2e3e);
    }
    add(floor);
    add(back);
    const lettersDark = new Builder(), lettersLit = new Builder();
    const h = 3.3;
    const wTot = (0.84 + 0.72 + 0.7) * h + 2 * 0.14 * h;
    warLetters(lettersDark, -wTot / 2, 0.75, h, frontZ + 0.2, frontZ + 0.75, [0.55, 0.06, 0.05, 0]);
    warLetters(lettersLit, -wTot / 2, 0.75, h, frontZ + 0.2, frontZ + 0.75, [1, 0.16, 0.1, 0.55]);
    const disc = new Builder();
    disc.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], null, FRONT);
    return { meshes, dark: r.mesh(lettersDark), lit: r.mesh(lettersLit), disc: r.mesh(disc), frontZ };
  }

  function buildPosters(r, X) {
    const floor = new Builder();
    floor.quad([-16, 0, -10], [16, 0, -10], [16, 0, 14], [-16, 0, 14], [0.04, 0.04, 0.05, 0], null, UP);
    const peepers = new Builder();
    peepers.quad([-1.6, 0, 0], [1.6, 0, 0], [1.6, 4.25, 0], [-1.6, 4.25, 0], [1, 1, 1, 0.05], null, FRONT);
    const peepersBack = new Builder();
    peepersBack.at(0, 2.125, -0.06, f => f.box(3.3, 4.36, 0.1, 0x2a2a30));
    const give = new Builder();
    give.quad([-3.1, 0.012, 2.3], [3.1, 0.012, 2.3], [3.1, 0.012, -2.3], [-3.1, 0.012, -2.3], [1, 1, 1, 0.04], null, UP);
    const giveBack = new Builder();
    giveBack.at(0, 0.006, 0, f => f.box(6.4, 0.01, 4.6, 0x1a1a14));
    const disc = new Builder();
    disc.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], null, FRONT);
    return { floor: r.mesh(floor), peepers: r.mesh(peepers), peepersBack: r.mesh(peepersBack), give: r.mesh(give), giveBack: r.mesh(giveBack), disc: r.mesh(disc) };
  }

  const POOL = { r: 2.65, rim: 3.15, water: 0.28, top: 0.42 };

  function buildGlobe(r, X) {
    const floor = new Builder();
    floor.quad([-20, -0.01, -20], [20, -0.01, -20], [20, -0.01, 20], [-20, -0.01, 20], [0.02, 0.02, 0.03, 0], null, UP);
    ringY(floor, 6, 0, 0, 40, [0.3, 0.04, 0.04, 0]);
    ringY(floor, 6.3, 6, 0.005, 40, [0.55, 0.1, 0.06, 0.15]);
    const domeUV = new Builder();
    const ptsDome = (yaw, pit) => [S(yaw) * C(pit) * 3.1, S(pit) * 3.1, C(yaw) * C(pit) * 3.1];
    for (let j = 0; j < 12; j++) {
      for (let i = 0; i < 40; i++) {
        const y0 = -PI + (i / 40) * PI * 2, y1 = -PI + ((i + 1) / 40) * PI * 2;
        const p0 = (j / 12) * (PI / 2), p1 = ((j + 1) / 12) * (PI / 2);
        const uv = (yaw, pit) => [(yaw + PI) / (PI * 2), 0.5 + pit / PI];
        const a = ptsDome(y0, p0), b = ptsDome(y1, p0), c = ptsDome(y1, p1), d = ptsDome(y0, p1);
        domeUV.quad(a, b, c, d, [1, 1, 1, 0.03], [uv(y0, p0), uv(y1, p0), uv(y1, p1), uv(y0, p1)], [V3.norm(a), V3.norm(b), V3.norm(c), V3.norm(d)]);
      }
    }
    const domeIn = new Builder();
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 24; i++) {
        const y0 = (i / 24) * PI * 2, y1 = ((i + 1) / 24) * PI * 2;
        const p0 = (j / 8) * (PI / 2), p1 = ((j + 1) / 8) * (PI / 2);
        const q = (yaw, pit) => [S(yaw) * C(pit) * 3.04, S(pit) * 3.04, C(yaw) * C(pit) * 3.04];
        const nIn = (yaw, pit) => V3.mul(V3.norm(q(yaw, pit)), -1);
        domeIn.quad(q(y0, p0), q(y0, p1), q(y1, p1), q(y1, p0), [0.13, 0.3, 0.66, 0.06], null, [nIn(y0, p0), nIn(y0, p1), nIn(y1, p1), nIn(y1, p0)]);
      }
    }
    const rim = new Builder();
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const p = (a, rr, y) => [S(a) * rr, y, C(a) * rr];
      rim.quad(p(a0, POOL.r, POOL.top), p(a0, POOL.rim, POOL.top), p(a1, POOL.rim, POOL.top), p(a1, POOL.r, POOL.top), [0.62, 0.7, 0.86, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], UP);
      const no = V3.norm([S((a0 + a1) / 2), 0, C((a0 + a1) / 2)]);
      rim.quad(p(a0, POOL.rim, 0), p(a1, POOL.rim, 0), p(a1, POOL.rim, POOL.top), p(a0, POOL.rim, POOL.top), shade(0xffffff, 0.8), null, [no, no, no, no]);
      const ni = V3.mul(no, -1);
      rim.quad(p(a1, POOL.r, POOL.water - 0.6), p(a0, POOL.r, POOL.water - 0.6), p(a0, POOL.r, POOL.top), p(a1, POOL.r, POOL.top), shade(0xffffff, 0.7), null, [ni, ni, ni, ni]);
    }
    const water = new Builder();
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const p = (a) => [S(a) * POOL.r, POOL.water, C(a) * POOL.r];
      const uv = (q) => [q[0] * 0.35, q[2] * 0.35];
      water.tri([0, POOL.water, 0], p(a0), p(a1), [1, 1, 1, 0.35], [uv([0, 0, 0]), uv(p(a0)), uv(p(a1))], [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    }
    const platform = new Builder();
    platform.prism(14, 0.5, 0.5, -2, 0.5, 0.5, 0, 0x8a96a8, { capTop: true });
    platform.at(0, 0, 0, f => ringY(f, 0.52, 0.42, 0.002, 14, [0.9, 0.95, 1, 0.3]));
    const disc = new Builder();
    disc.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], null, FRONT);
    return { floor: r.mesh(floor), dome: r.mesh(domeUV), domeIn: r.mesh(domeIn), rim: r.mesh(rim), water: r.mesh(water), platform: r.mesh(platform), disc: r.mesh(disc) };
  }

  const FLAG = { z: -2.6, x0: -11, x1: 11, top: 9.1, stripes: 13, cantonX: -2.2, starR: 0.36, hero: [-6.6, 6.65] };

  function buildFlag(r, X) {
    const wall = new Builder();
    const sh = FLAG.top / FLAG.stripes;
    for (let i = 0; i < FLAG.stripes; i++) {
      const y1 = FLAG.top - i * sh, y0 = y1 - sh;
      const col = i % 2 ? [0.95, 0.94, 0.92, 0.08] : [0.78, 0.1, 0.12, 0.04];
      const xa = i < 7 ? FLAG.cantonX : FLAG.x0;
      wall.quad([xa, y0, FLAG.z], [FLAG.x1, y0, FLAG.z], [FLAG.x1, y1, FLAG.z], [xa, y1, FLAG.z], col, null, FRONT);
    }
    const cantonY0 = FLAG.top - 7 * sh;
    wall.quad([FLAG.x0, cantonY0, FLAG.z], [FLAG.cantonX, cantonY0, FLAG.z], [FLAG.cantonX, FLAG.top, FLAG.z], [FLAG.x0, FLAG.top, FLAG.z], [0.1, 0.16, 0.48, 0.02], null, FRONT);
    const stars = new Builder();
    const starsAt = [];
    for (let row = 0; row < 7; row++) {
      const n = row % 2 ? 5 : 6;
      for (let c = 0; c < n; c++) {
        const x = FLAG.x0 + 0.85 + (c + (row % 2 ? 0.5 : 0)) * 1.42;
        const y = FLAG.top - 0.55 - row * 0.66;
        if (Math.abs(x - FLAG.hero[0]) < 0.5 && Math.abs(y - FLAG.hero[1]) < 0.4) continue;
        starsAt.push([x, y]);
        stars.at(x, y, FLAG.z + 0.01, f => starMesh(f, FLAG.starR, FLAG.starR * 0.42, 0, 0.0, [0.96, 0.96, 1, 0.15]));
      }
    }
    const hero = new Builder();
    starMesh(hero, 0.62, 0.26, 0, 0, [0.97, 0.97, 1, 0.3]);
    const hole = new Builder();
    starMesh(hole, 0.62, 0.26, 0, 0, [0.03, 0.04, 0.12, 0]);
    const floor = new Builder();
    floor.quad([-16, 0, FLAG.z], [16, 0, FLAG.z], [16, 0, 12], [-16, 0, 12], [0.2, 0.05, 0.06, 0], null, UP);
    const disc = new Builder();
    disc.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], null, FRONT);
    return { wall: r.mesh(wall), stars: r.mesh(stars), hero: r.mesh(hero), hole: r.mesh(hole), floor: r.mesh(floor), disc: r.mesh(disc) };
  }

  function alarmAt(t) {
    if (t < 13.6) return 0;
    return ease(span(t, 13.6, 14.6)) * (0.72 + 0.28 * bang(beatAt(t) / 2));
  }

  function signAt(t) {
    if (t < 24.75) return 0;
    if (t < 25.15) return frac(t * 9) < 0.5 ? 1 : 0.15;
    return 0.86 + 0.14 * bang(beatAt(t));
  }

  function superball(pose, t, extra) {
    pose.mouth = mouthFor('superball', t);
    return actor('superball', 'agent', 'superball', pose, 'superball', extra);
  }

  function agentA(id, pose, t, extra) {
    pose.mouth = mouthFor('agent', t);
    return actor(id, 'agent', 'agent', pose, 'agent', extra);
  }

  function maxSeated(t, extra) {
    const p = base(SPOTS.chair[0], SPOTS.chair[1] + 0.06, 0);
    seated('max', p, 0.57);
    arms(p, [0.7, -0.2, 0.25, 0.7], [0.7, -0.2, 0.25, 0.7]);
    p.neck = [0.02 * S(t * 0.8), 0.1 * S(t * 0.45), 0.05 * S(t * 0.6)];
    p.spine = [0.02, 0, 0];
    p.mouth = mouthFor('max', t);
    return actor('max', 'max', 'max', p, 'max', extra);
  }

  function samStand(x, z, ry, t, extra) {
    const p = base(x, z, ry);
    arms(p, [0.12, 0, 0.12, 0.3], [0.12, 0, 0.12, 0.3]);
    p.neck = [0.04, 0.04 * S(t * 0.5), 0];
    p.mouth = mouthFor('sam', t);
    return actor('sam', 'sam', 'sam', p, 'sam', extra);
  }

  function ovalLight(t, extra) {
    return Object.assign({ alarm: alarmAt(t), sign: signAt(t), dim: 0 }, extra || {});
  }

  function wDeskMax(t, sh) {
    const u = t - sh.start;
    const max = maxSeated(t);
    max.pose.neck = [0.03, 0.12 * S(t * 0.6) + (u > 5.2 ? 0.3 * ease(span(u, 5.2, 6.2)) : 0), 0.04 * S(t * 0.7)];
    const rise = ease(span(t, 4.85, 5.75));
    const sp = base(1.12, -4.3, -0.3);
    sp.ground = false;
    sp.y = -0.32 - 1.1 * (1 - rise);
    arms(sp, ARM.rest, ARM.rest);
    if (t > 6.4) {
      arms(sp, 'present', [0.3, 0, 0.3, 0.6], ease(span(t, 6.4, 7.1)));
      singHead(sp, t, 0.6);
    }
    const cast = [max];
    if (rise > 0.01) cast.push(superball(sp, t, { noShadow: true }));
    const k = ease(span(t, 6.2, 8));
    const camera = cam([lerp(0.42, 0.48, k), 1.0, lerp(-1.4, -1.55, k)], [lerp(0.55, 0.6, k), 1.12, -3.8], 35);
    return { scene: 'oval', cast, camera, light: ovalLight(t) };
  }

  function samSpot(kind) {
    return kind === 'two' ? [-0.86, -4.02] : [SPOTS.sam[0], SPOTS.sam[1]];
  }

  function wSamClose(t, sh) {
    const sp = samSpot('close');
    const s = samStand(sp[0], sp[1], 1.35, t);
    s.pose.neck = [0.1, -0.1 + 0.06 * S(t * 1.4), 0.05];
    const camera = cam([-1.35 + 0.03 * S(t), 1.5, -2.42], [-2.12, 1.8, -3.24], 40);
    return { scene: 'oval', cast: [s, maxSeated(t)], camera, light: ovalLight(t) };
  }

  function wMaxClose(t, sh) {
    const max = maxSeated(t);
    max.pose.neck = [0.0, -0.22 + 0.32 * ease(span(t, sh.start + 0.4, sh.start + 1.1)), 0.03];
    const camera = cam([0.33, 1.1, -3.0], [0.02, 1.2, -3.78], 34);
    return { scene: 'oval', cast: [max], camera, light: ovalLight(t) };
  }

  function wCalendar(t, sh) {
    const u = t - sh.start;
    const p = base(0.55, -0.9 - 0.35 * ease(span(u, 2.2, 5.5)), PI);
    walk(p, u * 0.9, 0.25 * pulse(u, 2.0, 6));
    arms(p, 'present', 'present', 0.6 + 0.4 * S(t * 1.2));
    if (u > 2.6) arms(p, [0.4, 0, 0.6, 0.45], [0.4, 0, 0.6, 0.45], ease(span(u, 2.6, 3.6)));
    singHead(p, t, 0.8);
    if (u > 4.5) p.neck = [-0.25 * ease(span(u, 4.5, 6)), 0.08 * S(t), 0];
    const k = ease(span(u, 0.8, 7.4));
    const eye = mixv([1.22, 1.5, -2.98], [-0.3, 0.88, -2.35], k);
    const at = mixv([0.52, 1.74, 0.6], [0.32, 2.75, 1.5], k);
    return { scene: 'oval', cast: [superball(p, t)], camera: cam(eye, at, lerp(42, 52, k)), light: ovalLight(t), props: { calendar: place(1.62, -1.95, PI + 0.2) } };
  }

  function wTwo(t, sh) {
    const sp = samSpot('two');
    const s = samStand(sp[0], sp[1], 0.75, t);
    s.pose.neck = [0.06, 0.32 + 0.08 * S(t * 0.9), 0];
    const max = maxSeated(t);
    const camera = cam([-0.5, 1.0, -2.15], [-0.36, 1.48, -3.9], 46);
    return { scene: 'oval', cast: [s, max], camera, light: ovalLight(t) };
  }

  const SHELF_TH = DOOR_TH - 0.5;

  function shelfSpot() {
    const p = wallPoint(SHELF_TH + 0.14, 1.25);
    return [p[0], p[2]];
  }

  function wShelfSign(t, sh) {
    const u = t - sh.start;
    const pos = shelfSpot();
    const cast = [];
    const sign = wallPoint(DOOR_TH, 0.3, 3.15);
    if (t < 24.6) {
      const p = base(pos[0], pos[1], face(pos, [0, 0]) - 0.15);
      arms(p, 'present', [0.5, 0, 0.5, 1.2], 1);
      if (u > 1.9) arms(p, 'rest', 'point', ease(span(u, 1.9, 2.4)));
      singHead(p, t, 0.7);
      if (u > 1.9) p.neck = [-0.35, -0.3, 0];
      cast.push(superball(p, t));
    } else {
      const p = base(sign[0] - 0.2, wallPoint(DOOR_TH, 0.56)[2], PI);
      lying('agent', p, { rx: 0, rz: -PI / 2, h: 3.42, thick: 0.16 });
      arms(p, [0.4, 0, 2.4, 2.2], [0.6, 0, 0.3, 0.4]);
      p.hipL = [0.3, 0, 0];
      p.knL = [0.5, 0, 0];
      p.neck = [-0.1, 0, 0.35];
      cast.push(superball(p, t, { noShadow: true }));
    }
    const k = ease(span(u, 1.9, 3.95));
    const eye = mixv(wallPoint(SHELF_TH + 0.1, 3.0, 1.5), wallPoint(DOOR_TH - 0.1, 3.0, 2.1), k);
    const at = mixv(wallPoint(SHELF_TH + 0.17, 1.2, 1.72), wallPoint(DOOR_TH, 0.3, 3.3), k);
    return { scene: 'oval', cast, camera: cam(V3.add(eye, drift(t, 1)), at, lerp(44, 50, k)), light: ovalLight(t) };
  }

  function wShelfClose(t, sh) {
    const pos = shelfSpot();
    const p = base(pos[0], pos[1], face(pos, [0, 0]) - 0.1);
    arms(p, [0.35, 0, 0.35, 0.9], [0.35, 0, 0.35, 0.9]);
    singHead(p, t, 0.6);
    if (t > 31.1) {
      const k = ease(span(t, 31.1, 32.3));
      arms(p, [0.5, 0, 0.62, 0.55], [0.5, 0, 0.62, 0.55], k);
      p.neck = [-0.32 * k, 0.05 * S(t * 2), 0.04 * S(t * 3)];
      p.spine = [-0.12 * k, 0, 0];
    }
    const camera = cam(V3.add(wallPoint(SHELF_TH + 0.05, 2.95, 1.7), drift(t, 0.6)), wallPoint(SHELF_TH + 0.16, 1.2, 1.86), 40);
    return { scene: 'oval', cast: [superball(p, t)], camera, light: ovalLight(t) };
  }

  function wNutcracker(t, sh) {
    const head = [SPOTS.nut[0], 1.12, SPOTS.nut[1]];
    const u = t - sh.start;
    const camera = cam([head[0] - 0.46 - u * 0.02, 0.98, head[2] - 0.22 - u * 0.01], [head[0] + 0.1, head[1] + 0.06, head[2] + 0.12], 50);
    return { scene: 'oval', cast: [], camera, light: ovalLight(t, { scream: ease(span(t, 36.3, 36.9)) }) };
  }

  function wSofa(t, sh) {
    const u = t - sh.start;
    const b = beatAt(t);
    const p = base(0, 2.95, PI);
    p.ground = false;
    p.y = 0.47;
    arms(p, 'wide', 'wide', 0.85);
    singHead(p, t, 0.8);
    bounce(p, b, 0.4);
    p.ground = false;
    if (t > 43.7) {
      arms(p, [0.35, 0, 0.6, 0.5], 'chest', ease(span(t, 43.7, 44.3)));
    }
    const lean = (side, ph) => {
      const inK = t < 40.85 ? 0 : clamp(0.75 + 0.25 * S((t - 40.85) * PI * 0.5 + ph), 0, 1) * ease(span(t, 40.85, 41.25));
      const a = base(side * 1.55, 0.4, PI + side * 0.35);
      a.pivot = 0;
      a.rz = -side * 0.62 * inK;
      arms(a, 'present', 'present', 0.5);
      singHead(a, t + side, 0.5);
      a.neck = [0.05, -side * 0.2, side * 0.25];
      return a;
    };
    const cast = [superball(p, t)];
    if (t > 40.8) {
      cast.push(agentA('a1', lean(1, 0), t));
      cast.push(agentA('a2', lean(-1, 1.2), t));
    }
    const k = ease(span(t, 44.15, 44.7));
    const eye = mixv([0, 1.5, -0.65], [0.05, 2.0, 1.4], k);
    const at = mixv([0, 1.55, 3.0], [0, 2.12, 3.0], k);
    return { scene: 'oval', cast, camera: cam(eye, at, lerp(52, 44, k)), light: ovalLight(t) };
  }

  function wFireplace(t, sh) {
    const fp = wallPoint(FIRE_TH, 0.85);
    const p = base(fp[0], fp[2] - 1.0, -PI / 2 + 0.35);
    arms(p, 'present', 'present', 0.8 + 0.2 * S(t * 2));
    singHead(p, t, 0.7);
    bounce(p, beatAt(t), 0.3);
    const camera = cam([fp[0] - 2.3, 0.62, fp[2] + 0.2], [fp[0] - 0.3, 1.55, fp[2] - 0.35], 52);
    return { scene: 'oval', cast: [superball(p, t)], camera, light: ovalLight(t) };
  }

  function wSeal(t, sh) {
    const cast = [];
    const slide = ease(span(t, 51.7, 52.9));
    [[0.78 * PI, 'a1', 0], [-0.78 * PI, 'a2', 0.1], [0.44 * PI, 'a3', 0.2], [-0.44 * PI, 'a4', 0.3]].forEach(([phi, id, d]) => {
      const k = ease(span(t, 51.7 + d, 52.8 + d));
      const R = lerp(5, 1.7, k);
      const p = base(S(phi) * R, C(phi) * R, phi);
      lying('agent', p, {});
      arms(p, [0.2, 0, 1.45, 0.2], [0.2, 0, 1.45, 0.2]);
      p.hipL = [0, 0, 0.25];
      p.hipR = [0, 0, 0.25];
      p.neck = [0, 0.2 * S(t * 2 + d * 10), 0];
      cast.push(agentA(id, p, t));
    });
    const sp = base(0, lerp(4, 1.9, slide), 0);
    lying('agent', sp, {});
    arms(sp, [0.2, 0, 1.4, 0.3], [0.2, 0, 1.4, 0.3]);
    sp.neck = [0.15, 0, 0];
    cast.push(superball(sp, t));
    const roll = 0.12 * span(t, 51.6, 54.6);
    const camera = cam([0, 3.35, 0.3], [0, 0, 0.28], 54, roll);
    camera.up = [S(roll), 0, -C(roll)];
    return { scene: 'oval', cast, camera, light: ovalLight(t) };
  }

  function wGlobe(t, sh) {
    const s = samStand(-1.42, -2.0, 0.65, t);
    s.pose.neck = [0.05, 0.35, 0.05];
    const max = maxSeated(t);
    const lie = base(-0.15, -3.0, 0);
    lying('agent', lie, { rx: 0, rz: PI / 2, h: 0.8, thick: 0.2 });
    arms(lie, [0.3, 0, 0.4, 0.8], [1.2, 0, 0.2, 0.6]);
    lie.hipL = [0.25, 0, 0];
    lie.knL = [0.5, 0, 0];
    lie.neck = [0, 0, -0.2];
    const cast = [s, max, agentA('a1', lie, t)];
    if (t > 57.15) {
      const k = ease(span(t, 57.15, 57.55));
      const p = base(lerp(0.75, 0.15, k), -2.05, PI + 0.3);
      p.pivot = 0;
      p.rz = 0.35 * (1 - k);
      arms(p, 'rest', 'rest');
      singHead(p, t, 0.4);
      cast.push(superball(p, t));
      const q = base(-1.05, -1.85, PI - 0.4);
      q.ground = false;
      q.y = lerp(-0.9, -0.42, ease(span(t, 57.3, 57.7)));
      singHead(q, t + 2, 0.4);
      cast.push(agentA('a2', q, t));
    }
    const camera = cam([-0.28, 1.18, -0.62], [-0.72, 1.3, -3.0], 54);
    return { scene: 'oval', cast, camera, light: ovalLight(t), props: { globe: [-0.72, -2.42] } };
  }

  function wEagle(t, sh) {
    const u = t - sh.start;
    const e = [SPOTS.eagle[0], 1.2, SPOTS.eagle[1]];
    const p = base(e[0] + 0.5, e[2] + 0.58, -1.0);
    p.ground = false;
    p.y = -0.3;
    arms(p, 'rest', 'rest');
    singHead(p, t, 0.8);
    p.neck = [0.05, 0.25 + 0.1 * S(t), -0.15];
    const camera = cam(V3.add([e[0] + 0.4 - u * 0.04, 1.72, e[2] + 1.02], drift(t, 0.5)), [e[0] + 0.32 - u * 0.03, 1.52, e[2]], 50);
    return { scene: 'oval', cast: [superball(p, t)], camera, light: ovalLight(t) };
  }

  function wDance(t, sh) {
    const u = t - sh.start;
    const b = beatAt(t);
    const p = base(0, 1.6, PI);
    sway(p, b, 1);
    arms(p, [0.4, -0.2, 0.75 + 0.2 * S(PI * b), 0.6], [0.4, -0.2, 0.75 - 0.2 * S(PI * b), 0.6]);
    singHead(p, t, 0.6);
    const cast = [superball(p, t)];
    [[1.1, 'a1', 0], [-1.1, 'a2', 1], [2.05, 'a3', 1], [-2.05, 'a4', 0]].forEach(([x, id, ph]) => {
      const a = base(x, 2.3, PI - x * 0.08);
      cossack(a, b + ph);
      cast.push(agentA(id, a, t));
    });
    const k = ease(span(u, 1.2, 4.6));
    const eye = mixv([0.1, 1.55, -1.9], [0.0, 1.95, 0.1], k);
    const at = mixv([0, 1.7, 3.0], [0, 1.95, 2.2], k);
    const starK = ease(span(t, 64.2, 65.2));
    const light = ovalLight(t, { dim: 0.82 * starK, cookie: starK > 0 ? { tex: 'star', dir: V3.norm([0, -0.15, 1]), center: [0, 2.0, 3.0], half: 2.3, strength: starK } : null });
    return { scene: 'oval', cast, camera: cam(eye, at, lerp(56, 46, k)), light, props: { sofa: place(-2.75, 1.5, PI / 2 + 0.25) } };
  }

  function wDoor(t, sh) {
    const u = t - sh.start;
    const open = ease(span(u, 0.0, 0.9));
    const fly = ease(span(u, 0.35, 1.25));
    const eye = mixv([0.3, 0.82, 2.85], [0.0, 1.45, 5.7], fly);
    const at = mixv([-0.1, 2.75, 5.0], [0.0, 1.5, 9.0], fly);
    const cast = [];
    if (fly < 0.6) {
      [[0.62, 'a1'], [-0.62, 'a2']].forEach(([x, id]) => {
        const a = base(x * 1.12, 3.32, 0);
        arms(a, 'rest', 'rest');
        cast.push(agentA(id, a, t, { noShadow: true }));
      });
    }
    return { scene: 'oval', cast, camera: cam(eye, at, 58), light: ovalLight(t, { black: span(u, 0.95, 1.2) }), props: { door: -open * 1.35, doorSide: 'left', sofa: place(-2.75, 1.5, PI / 2 + 0.25) } };
  }

  const WAR_LINE = [-2.4, -0.8, 0.8, 2.4];

  function stageDance(t, line, opts) {
    const o = opts || {};
    const b = beatAt(t);
    return line.map((x, i) => {
      const a = base(x, o.z === undefined ? -1.6 : o.z, o.ry || 0);
      if (o.move === 'kick') kickStep(a, b + (i % 2) * 0.5, 0.8);
      else if (o.move === 'cossack') cossack(a, b + i * 0.5);
      else swing(a, b + (i % 2) * 0.5, t);
      const role = i === 1 ? 'superball' : 'agent';
      a.mouth = mouthFor(role, t);
      return role === 'superball' ? actor('superball', 'agent', 'superball', a, 'superball') : actor('a' + i, 'agent', 'agent', a, 'agent');
    });
  }

  function wWarWide(t, sh) {
    const reveal = ease(span(t, 72.6, 73.3));
    const cast = t > 72.95 ? stageDance(t, WAR_LINE) : [];
    const camera = cam([0, 2.35 - 0.15 * span(t, 72.6, 75.3), 7.0 - 0.45 * span(t, 72.6, 75.3)], [0, 2.85, -2.0], 48);
    return { scene: 'stage', cast, camera, light: { stage: reveal, lit: t > 74.4 ? 1 : 0, spots: [[-2.2, 3.4, 4.6, [1, 1, 1]], [2.6, 3.0, 4.8, [0.35, 0.55, 1]]] } };
  }

  function wWarTilt(t, sh) {
    const blue = t > 75.95;
    const cast = stageDance(t, WAR_LINE);
    const camera = cam([0.4, 1.65, 0.65], [-0.7, 2.1, -2.2], 56, -0.26);
    return { scene: 'stage', cast, camera, light: { stage: 1, lit: blue ? 0 : 1, blue: blue ? 1 : 0, spots: [[-2.0, 3.2, 4.2, blue ? [0.4, 0.6, 1] : [1, 1, 1]], [2.2, 3.4, 4.6, [0.35, 0.55, 1]]] } };
  }

  function wWarSide(t, sh) {
    const cast = stageDance(t, [-3.2, -2.3, -1.4, -0.5], { z: -1.6, ry: 0.55, move: 'cossack' });
    cast.forEach((a, i) => { a.pose.z = -1.4 + i * 0.5; });
    const camera = cam([0.1, 1.3, 1.2], [-2.0, 1.85, -1.5], 56, 0.2);
    return { scene: 'stage', cast, camera, light: { stage: 1, lit: 1, spots: [[-3.0, 3.0, 3.6, [1, 1, 1]], [1.8, 3.4, 4.0, [0.35, 0.55, 1]]] } };
  }

  function wPeepers(t, sh) {
    const u = t - sh.start;
    const cast = [[-2.1, 'a1', 0.35, 0], [1.95, 'a2', -0.45, 1]].map(([x, id, ry, ph]) => {
      const a = base(x, 0.6, ry);
      arms(a, x < 0 ? 'wave' : 'rest', x < 0 ? 'present' : 'wave');
      const w = 0.35 * S(t * 9 + ph);
      if (x < 0) a.elL = [0.75 + w, 0, 0]; else a.elR = [0.75 + w, 0, 0];
      a.spine = [0, 0, x < 0 ? 0.12 : -0.12];
      sway(a, beatAt(t) + ph, 0.5);
      return agentA(id, a, t);
    });
    const camera = cam([-0.1 - u * 0.05, 1.85, 4.3], [0.25, 2.15, -0.4], 50, 0.1);
    return { scene: 'posters', cast, camera, light: { poster: 'peepers', spot: [0.2, 2.6, 2.6] } };
  }

  function domeMarch(t, n, R, speed) {
    const cast = [];
    for (let i = 0; i < n; i++) {
      const phi = (i / n) * PI * 2 + t * speed;
      const p = base(S(phi) * R, C(phi) * R, phi + PI / 2);
      walk(p, t * 1.0 + i * 0.5, 0.9);
      arms(p, [-0.2, 0, 0.12, 0.3], [-0.2, 0, 0.12, 0.3]);
      cast.push(agentA('a' + i, p, t));
    }
    return cast;
  }

  function wDome(t, sh) {
    const u = t - sh.start;
    const cast = domeMarch(t, 7, 3.75, 0.32);
    const ang = -0.25 + u * 0.06;
    const camera = cam([S(ang) * 7.4, 1.55, C(ang) * 7.4], [0, 1.5, 0], 50);
    return { scene: 'globe', cast, camera, light: { lid: 0, pool: 0 } };
  }

  function wLid(t, sh) {
    const cast = domeMarch(t, 7, 3.75, 0.32);
    const camera = cam([2.4, 7.6, 4.6], [0, 0.4, 0], 50);
    return { scene: 'globe', cast, camera, light: { lid: ease(span(t, 86.15, 86.8)), pool: 1 } };
  }

  function wRim(t, sh) {
    const u = t - sh.start;
    const cast = [];
    const Rr = (POOL.r + POOL.rim) / 2;
    for (let i = 0; i < 4; i++) {
      const s = 1.05 + u * 0.42 - i * 0.5;
      const phi = -s;
      const p = base(S(phi) * Rr, C(phi) * Rr, phi - PI / 2);
      p.ground = false;
      p.y = POOL.top;
      walk(p, u * 1.1 + i * 0.5, 1);
      p.ground = false;
      p.y = POOL.top + (p.lift || 0);
      arms(p, i === 0 ? 'present' : [-0.2, 0, 0.12, 0.3], i === 0 ? 'present' : [-0.2, 0, 0.12, 0.3], 0.8);
      cast.push(agentA('a' + i, p, t));
    }
    const camPhi = 0.25;
    const eye = [S(camPhi) * Rr, POOL.top + 0.18, C(camPhi) * Rr];
    const at = [S(-0.6) * Rr, POOL.top + 1.1, C(-0.6) * Rr];
    return { scene: 'globe', cast, camera: cam(eye, at, 62), light: { lid: 2, pool: 1 } };
  }

  function wPool(t, sh) {
    const u = t - sh.start;
    const cast = [];
    const spin = u * 0.22;
    for (let i = 0; i < 4; i++) {
      const phi = (i / 4) * PI * 2 + spin + PI / 4;
      const p = base(S(phi) * 1.55, C(phi) * 1.55, phi);
      lying('agent', p, { h: POOL.water - 0.06 });
      arms(p, [0, 0, 1.3 + 0.2 * S(t * 2 + i), 0.1], [0, 0, 1.3 + 0.2 * S(t * 2 + i + 1), 0.1]);
      p.hipL = [0, 0, 0.35];
      p.hipR = [0, 0, 0.35];
      cast.push(agentA('a' + i, p, t, { noShadow: true }));
    }
    const rise = ease(span(t, 92.3, 94.2));
    const platformY = POOL.water - 1.9 + rise * 2.25 + 0.12 * span(t, 90.8, 92.3);
    if (t > 90.8) {
      const sp = base(0, 0, 0);
      sp.ground = false;
      sp.y = platformY;
      arms(sp, [0.9, 0, 2.15, 0.25], [0.3, 0, 1.25, 0.25], ease(span(t, 93.0, 94.0)));
      singHead(sp, t, 0.5);
      cast.push(superball(sp, t, { noShadow: true }));
    }
    const tilt = ease(span(t, 93.25, 94.7));
    const eye = mixv([0.01, 6.4, 0.4], [0.0, 1.75, 3.7], tilt);
    const at = mixv([0, 0, 0.35], [0, 1.45 + rise * 0.65, 0], tilt);
    const camera = cam(eye, at, lerp(52, 52, tilt));
    if (tilt < 0.5) camera.up = [0, 0, -1];
    return { scene: 'globe', cast, camera, light: { lid: 1.25, pool: 1, platform: platformY, spotUp: rise } };
  }

  function wGiveMe(t, sh) {
    const u = t - sh.start;
    const b = beatAt(t);
    const cast = [-1.95, -0.65, 0.65, 1.95].map((x, i) => {
      const a = base(x, 0.9 + (i % 2) * 0.15, 0);
      sway(a, b + i * 0.5, 0.7);
      arms(a, 'present', 'present');
      if (u > 2.2) arms(a, 'wide', 'wide', 0.6 + 0.4 * bang(b + i * 0.25));
      return agentA('a' + i, a, t);
    });
    const k = ease(span(u, 0, 5.8));
    const camera = cam([0.1, lerp(3.4, 3.8, k), lerp(4.0, 4.4, k)], [0, 0.45, -0.7], 50, 0.04);
    return { scene: 'posters', cast, camera, light: { poster: 'give', reveal: ease(span(u, 0.1, 2.6)) } };
  }

  function wStar(t, sh) {
    const u = t - sh.start;
    const hx = FLAG.hero[0], hy = FLAG.hero[1];
    const pop = ease(span(t, 102.25, 102.65));
    const cast = [];
    if (t > 102.2 && t < 104.6) {
      const p = base(hx, FLAG.z - 0.22, 0);
      p.ground = false;
      p.y = hy - 1.6 - 0.25 * (1 - pop);
      p.pivot = 1.05;
      p.rx = -0.15 + 0.85 * pop;
      arms(p, [1.1, 0, 1.2, 0.4], [0.8, 0, 0.9, 0.5], pop);
      singHead(p, t, 0.6);
      cast.push(superball(p, t, { noShadow: true }));
    }
    if (t > 105.6) {
      for (let i = 0; i < 6; i++) {
        const x = -3.6 + i * 1.15 + (t - 105.6) * 0.9;
        const a = base(x, -1.0, PI / 2);
        walk(a, t * 1.0 + i * 0.5, 0.9);
        cast.push(agentA('a' + i, a, t));
      }
    }
    const pull = ease(span(t, 103.15, 104.2));
    const pan = ease(span(t, 104.0, 105.8));
    const e0 = [hx, hy - 0.1, FLAG.z + 2.5], a0 = [hx, hy, FLAG.z];
    const e1 = [hx + 1.2, hy - 0.4, FLAG.z + 5.2], a1 = [hx + 1.4, hy - 0.2, FLAG.z];
    const e2 = [3.1, 0.75, 2.6], a2 = [-1.0, 2.7, FLAG.z];
    const eye = mixv(mixv(e0, e1, pull), e2, pan);
    const at = mixv(mixv(a0, a1, pull), a2, pan);
    return { scene: 'flag', cast, camera: cam(eye, at, lerp(lerp(44, 50, pull), 52, pan), lerp(-0.1, 0.22, pan)), light: { hole: pop, heroSpot: 1 - pan } };
  }

  function wLine(t, sh) {
    const u = t - sh.start;
    const b = beatAt(t);
    const cast = [];
    const sp = base(0, -0.6, 0);
    if (t < 108.95) {
      arms(sp, 'rest', 'rest');
      if (t > 107.95) arms(sp, 'cup', 'cup', ease(span(t, 107.95, 108.2)));
      singHead(sp, t, 0.4);
      sp.mouth = t > 107.95 ? Math.max(0.5, voiceAt(t)) : mouthFor('superball', t);
      cast.push(actor('superball', 'agent', 'superball', sp, 'superball'));
      if (t > 108.0) {
        const q = base(-1.1, -1.3, 0.2);
        arms(q, 'cup', 'cup', ease(span(t, 108.0, 108.25)));
        q.mouth = 0.6;
        cast.push(actor('a9', 'agent', 'agent', q, 'agent'));
      }
    }
    if (t > 108.7) {
      for (let i = 0; i < 6; i++) {
        const a = base(-3.4 + i * 1.36, -1.25, 0);
        jazz(a, b + (i % 2) * 0.5, t);
        cast.push(agentA('a' + i, a, t));
      }
    }
    const k = ease(span(t, 108.65, 109.9));
    const eye = mixv([0.15, 1.85, 1.0], [0.3, 0.95, 3.4], k);
    const at = mixv([0, 1.95, -0.6], [0, 2.55, FLAG.z], k);
    return { scene: 'flag', cast, camera: cam(V3.add(eye, drift(t, 0.4)), at, lerp(40, 52, k)), light: {} };
  }

  function wKicks(t, sh) {
    const u = t - sh.start;
    const b = beatAt(t);
    const cast = [];
    [[-0.35, 0.4], [0.9, -0.5], [-1.6, -1.1], [2.2, -1.3]].forEach(([x, z], i) => {
      const a = base(x, z, 0.25 - i * 0.12);
      kickStep(a, b + (i % 2) * 0.5, 1);
      arms(a, [0.4, 0, 1.4, 0.4], [0.4, 0, 1.4, 0.4]);
      if (i === 0) arms(a, [1.6, 0, 0.9, 1.4], [1.6, 0, 0.9, 1.4]);
      cast.push(i === 0 ? superball(a, t) : agentA('a' + i, a, t));
    });
    const camera = cam([0.6 + u * 0.15, 0.32, 2.4], [0.0, 1.6, -1.0], 62, 0.3);
    return { scene: 'flag', cast, camera, light: {} };
  }

  function wIris(t, sh) {
    const slide = ease(span(t, 117.15, 117.95));
    const sofaX = lerp(-3.6, -0.85, slide);
    const sofaZ = 2.15;
    const p = base(sofaX + 0.1, sofaZ + 0.05, 0);
    lying('agent', p, { rx: 0, rz: -PI / 2, h: 0.55, thick: 0.2 });
    arms(p, [0.4, 0, 2.6, 2.3], [0.4, 0, 0.2, 0.5]);
    p.neck = [0, 0, 0.2];
    const sb = solveActor(superball(p, t, { noShadow: true }));
    const cast = [maxSeated(t), sb];
    const dolly = ease(span(t, 120.4, 121.15));
    const eye0 = [0.45, 1.08, 4.55], at0 = [0.2, 1.08, -3.5];
    const headP = sb.head;
    const eye1 = [headP[0] + 0.1, headP[1] + 0.05, headP[2] + 0.62], at1 = headP;
    const camera = cam(mixv(eye0, eye1, dolly), mixv(at0, at1, dolly), lerp(34, 40, dolly));
    return { scene: 'oval', cast, camera, light: ovalLight(t, { iris: 1, dim: 0.35 }), props: { sofa: place(sofaX, sofaZ, 0.55) } };
  }

  function wCouch(t, sh) {
    const u = t - sh.start;
    const b = beatAt(t);
    const sofaP = SPOTS.sofa;
    const p = base(sofaP[0] + 0.15, sofaP[1] + 0.05, PI);
    lying('agent', p, { rx: 0, rz: PI / 2, h: 0.47, thick: 0.2 });
    arms(p, [0.3, 0, 2.7, 2.2], [0.5, 0, 0.3, 0.6]);
    p.hipR = [0.3, 0, 0];
    p.knR = [0.6, 0, 0];
    p.neck = [0, 0, -0.25];
    const cast = [superball(p, t)];
    if (t > 124.2) {
      [-1.35, -0.45, 0.45, 1.35].forEach((x, i) => {
        const a = base(x, sofaP[1] + 0.85, PI);
        sway(a, b + i * 0.5, 0.8);
        arms(a, 'present', 'present', 0.6);
        singHead(a, t + i, 0.6);
        cast.push(agentA('a' + i, a, t));
      });
    }
    const k = ease(span(u, 0, 1.3));
    const eye = mixv([1.25, 0.72, 2.25], [0.05, 1.05, 1.35], k);
    const at = mixv([1.3, 0.7, 2.9], [0.0, 1.0, 3.1], k);
    const hue = Math.floor(beatAt(t)) % 3;
    const col = [[0.5, 0.65, 1.2], [1.25, 0.5, 0.55], [1.1, 0.8, 0.95]][hue];
    const light = ovalLight(t, { dim: 0.6, cookie: { tex: 'star', dir: V3.norm([0, -0.2, 1]), center: [0, 1.7, 3.6], half: 2.6, strength: 1, color: col } });
    return { scene: 'oval', cast, camera: cam(eye, at, 50), light };
  }

  function wRing(t, sh) {
    const b = beatAt(t);
    const cast = [maxSeated(t)];
    [[-1.05, -3.55, 0.9], [-0.55, -4.15, 0.5], [0.55, -4.15, -0.5], [1.05, -3.55, -0.9]].forEach(([x, z, ry], i) => {
      const a = base(x, z, ry);
      arms(a, 'foldL', 'foldR');
      a.spine = [0.25 + 0.15 * bang(b + i * 0.5), 0, (x < 0 ? -1 : 1) * 0.15];
      a.neck = [0.2, 0, 0];
      kickStep(a, b + (i % 2) * 0.5, 0.45);
      cast.push(agentA('a' + i, a, t));
    });
    if (t > 131.0) {
      const k = ease(span(t, 131.0, 131.5));
      const p = base(0, -2.5, 0);
      p.ground = false;
      p.y = lerp(-1.5, -0.66, k);
      arms(p, 'present', 'present', k);
      singHead(p, t, 0.6);
      cast.push(superball(p, t, { noShadow: true }));
    }
    const hue = Math.floor(b) % 3;
    const tint = [[0.7, 0.8, 1.35], [1.35, 0.55, 0.6], [1.15, 1.1, 1.15]][hue];
    const camera = cam([0.0, 1.62, -1.55], [0.0, 1.32, -3.6], 52);
    return { scene: 'oval', cast, camera, light: ovalLight(t, { dim: 0.55, wash: tint }) };
  }

  function wMarch(t, sh) {
    const u = t - sh.start;
    const cast = [];
    for (let i = 0; i < 6; i++) {
      const z = -3.2 + ((u * 0.55 + i * 1.3) % 7.8);
      const a = base(-1.75 + 0.2 * S(i), z, 0);
      walk(a, t * 1.0 + i * 0.5, 1);
      const role = i === 2 ? 'superball' : 'agent';
      a.mouth = mouthFor(role, t);
      cast.push(role === 'superball' ? actor('superball', 'agent', 'superball', a, 'superball') : actor('a' + i, 'agent', 'agent', a, 'agent'));
    }
    const eye = [0.35 - u * 0.02, 0.5, 0.4 + u * 0.12];
    const at = [-2.4, 1.35, 0.4 + u * 0.12];
    const ph = u * 0.6;
    const light = ovalLight(t, { dim: 0.5, cookie: { tex: 'spots3', dir: V3.norm([-1, -0.18, 0.05]), center: [-2.2, 1.25, 0.6 + u * 0.12 + 1.4 * S(ph)], half: 3.2, strength: 1, color: [[1.25, 0.8, 0.85], [0.75, 0.9, 1.3], [1.2, 1.15, 1.05]][Math.floor(u / 1.4) % 3] } });
    return { scene: 'oval', cast, camera: cam(eye, at, 58), light };
  }

  function portraitSpot() {
    const p = wallPoint(PORTRAIT_TH, 1.65);
    return p;
  }

  function wPortrait(t, sh) {
    const pos = portraitSpot();
    const into = face([pos[0], pos[2]], [0, 0]);
    const p = base(pos[0], pos[2], into);
    arms(p, [0.35, 0, 0.3, 1.1], [0.35, 0, 0.3, 1.1]);
    if (t > 147.9) arms(p, 'present', 'present', ease(span(t, 147.9, 148.4)));
    singHead(p, t, 0.8);
    const fwd = [S(into), 0, C(into)];
    const side = [C(into), 0, -S(into)];
    const v = sh.index % 4;
    const eye = V3.add(pos, V3.add(V3.mul(fwd, 2.1 + v * 0.1), V3.add(V3.mul(side, -0.35 + v * 0.06), [0, 1.5, 0])));
    const at = V3.add(pos, V3.add(V3.mul(side, -0.25), [0, 1.98, 0]));
    const light = ovalLight(t, { dim: 0.85, cookie: { tex: 'spot', dir: V3.norm(V3.sub(V3.add(pos, [0, 1.3, 0]), V3.add(eye, [0, 0.6, 0]))), center: V3.add(pos, V3.add(V3.mul(side, -0.3), [0, 1.5, 0])), half: 2.1, strength: 1 } });
    return { scene: 'oval', cast: [superball(p, t)], camera: cam(eye, at, 44), light };
  }

  function wAbove(t, sh) {
    const p = base(0.85, -2.05, PI * 0.15);
    arms(p, 'wide', [0.6, 0, 1.1, 0.6]);
    singHead(p, t, 0.6);
    p.neck = [-0.45, 0, 0];
    const center = [0.85, 1.0, -2.05];
    const light = ovalLight(t, { dim: 0.85, cookie: { tex: 'spot', dir: [0, -1, 0.0001], center, half: 1.7, strength: 1 } });
    return { scene: 'oval', cast: [superball(p, t)], camera: cam([1.55, 3.45, -0.85], [0.7, 0.9, -2.2], 54, 0.35), light };
  }

  function wMonkey(t, sh) {
    const fp = wallPoint(FIRE_TH, 1.15);
    const p = base(5.2, 0.05, face([5.2, 0.05], [4.6, 1.25]));
    const k = span(t, 145.65, 146.2);
    if (k < 0.3) arms(p, 'pray', 'pray'); else arms(p, 'fist', [0.2, -0.3, 1.0, 1.4]);
    singHead(p, t, 0.6);
    const camera = cam([4.0, 1.5, 1.8], [5.5, 1.6, 0.3], 48);
    const light = ovalLight(t, { dim: 0.8, cookie: { tex: 'spotSoft', dir: V3.norm([0.75, -0.3, -0.6]), center: [5.6, 1.5, 0.5], half: 2.0, strength: 1 } });
    return { scene: 'oval', cast: [superball(p, t)], camera, light, props: { clap: t } };
  }

  function wBell(t, sh) {
    const bp = SPOTS.bell;
    const p = base(bp[0] + 0.45, bp[1] + 0.35, PI * 0.8);
    arms(p, 'wave', 'wave', 0.7);
    p.elL = [1.2 + 0.3 * S(t * 8), 0, 0];
    p.elR = [1.2 - 0.3 * S(t * 8), 0, 0];
    singHead(p, t, 0.5);
    p.neck = [-0.5, 0, 0];
    const light = ovalLight(t, { dim: 0.85, cookie: { tex: 'spot', dir: [0.0001, -1, 0], center: [bp[0] + 0.3, 0.8, bp[1] + 0.2], half: 1.6, strength: 1 } });
    return { scene: 'oval', cast: [superball(p, t)], camera: cam([bp[0] + 1.15, 3.55, bp[1] + 1.45], [bp[0] + 0.3, 0.85, bp[1] + 0.2], 50, -0.2), light };
  }

  function wExit(t, sh) {
    const u = t - sh.start;
    const b = beatAt(t);
    const cast = [];
    const door = wallPoint(DOOR_TH, 0.6);
    let open = ease(span(t, 153.5, 154.3));
    if (t > 159.35) open *= 1 - ease(span(t, 159.35, 160.3));
    for (let i = 0; i < 3; i++) {
      const leave = 154.3 + i * 1.55;
      const walkK = span(t, leave, leave + 1.9);
      const start = [-0.85 + i * 0.85, 3.75];
      const pos = mixv(start, [door[0] + 0.25, door[2] + 1.4], ease(walkK));
      if (walkK >= 1) continue;
      const a = base(pos[0], pos[1], walkK > 0 ? face(start, [door[0], door[2] + 1]) : PI * 0.85);
      if (walkK > 0) {
        walk(a, t * 1.1 + i * 0.3, 0.9);
        arms(a, 'wave', 'rest', 0.7);
        a.elL = [0.8 + 0.4 * S(t * 9), 0, 0];
      } else {
        jazz(a, b + i * 0.5, t + i);
        sway(a, b + i * 0.5, 0.8);
        singHead(a, t + i, 0.6);
      }
      const role = i === 1 ? 'superball' : 'agent';
      a.mouth = mouthFor(role, t) * (walkK > 0.5 ? 0 : 1);
      cast.push(role === 'superball' ? actor('superball', 'agent', 'superball', a, 'superball') : actor('a' + i, 'agent', 'agent', a, 'agent'));
    }
    if (t > 158.6 && t < 159.6) {
      const q = base(door[0] + 0.32, door[2] + 0.42, PI * 1.08);
      arms(q, 'thumb', 'rest');
      cast.push(actor('a7', 'agent', 'agent', q, 'agent', { noShadow: true }));
    }
    const k = ease(span(u, 0, 2.6));
    const eye = mixv([-1.1, 0.62, 2.1], [-1.5, 0.78, 2.35], k);
    const at = mixv([0.2, 2.1, 4.2], [0.55, 1.75, 4.6], k);
    return { scene: 'oval', cast, camera: cam(eye, at, 54), light: ovalLight(t), props: { door: -open * 1.45, doorSide: 'right', sofa: place(-2.75, 1.5, PI / 2 + 0.25) } };
  }

  function wFinal(t, sh) {
    const sp = samSpot('final');
    const s = samStand(sp[0], sp[1], 0.55, t);
    const turn = ease(span(t, 161.85, 162.25));
    s.pose.ry = lerp(0.55, 1.35, turn);
    s.pose.neck = [0.05, 0.25 * turn, 0];
    const max = maxSeated(t);
    const camera = cam([1.2, 1.7, 2.85], [-0.72, 1.0, -3.1], 46);
    return { scene: 'oval', cast: [s, max], camera, light: ovalLight(t, { alarm: 0 }) };
  }

  function wMaxEnd(t, sh) {
    const max = maxSeated(t);
    max.pose.neck = [0.04, 0.12, 0.05 * S(t * 3)];
    const camera = cam([-0.12, 1.15, -2.86], [0.1, 1.2, -3.78], 36);
    return { scene: 'oval', cast: [max], camera, light: ovalLight(t, { alarm: 0 }) };
  }

  const WORLDS = {
    deskMax: wDeskMax, samClose: wSamClose, maxClose: wMaxClose, calendar: wCalendar, two: wTwo, shelfSign: wShelfSign,
    shelfClose: wShelfClose, nutcracker: wNutcracker, sofa: wSofa, fireplace: wFireplace, seal: wSeal, globe: wGlobe,
    eagle: wEagle, dance: wDance, door: wDoor, warWide: wWarWide, warTilt: wWarTilt, warSide: wWarSide, peepers: wPeepers,
    dome: wDome, lid: wLid, rim: wRim, pool: wPool, giveMe: wGiveMe, star: wStar, line: wLine, kicks: wKicks, iris: wIris,
    couch: wCouch, ring: wRing, march: wMarch, portrait: wPortrait, above: wAbove, monkey: wMonkey, bell: wBell,
    exit: wExit, final: wFinal, maxEnd: wMaxEnd
  };

  function worldFor(t, shot) {
    const st = WORLDS[shot.cam](t, shot);
    st.props = st.props || {};
    st.cast.forEach(solveActor);
    return st;
  }

  function stage(t, shot) {
    const st = worldFor(t, shot);
    const focus = {};
    st.cast.forEach(a => { focus[a.id] = { head: a.head, hips: a.hips }; });
    return Object.assign(st, { focus, shot, beat: beatAt(t) });
  }

  function makeQuads(r) {
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    return { unit: mk(b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], null, FRONT)) };
  }

  const SCENE_ENV = {
    oval: { sunDir: [-0.5, -0.62, 0.6], sunColor: [0.8, 0.6, 0.46], ambTop: [0.27, 0.21, 0.37], ambBottom: [0.12, 0.08, 0.15] },
    stage: { sunDir: [0.12, -0.42, -1], sunColor: [0.95, 0.95, 1.05], ambTop: [0.1, 0.1, 0.15], ambBottom: [0.04, 0.04, 0.06] },
    posters: { sunDir: [0.15, -0.5, -1], sunColor: [1.0, 0.96, 0.95], ambTop: [0.14, 0.13, 0.18], ambBottom: [0.05, 0.05, 0.07] },
    globe: { sunDir: [0.35, -0.8, -0.5], sunColor: [1.05, 1.0, 0.95], ambTop: [0.34, 0.34, 0.44], ambBottom: [0.14, 0.12, 0.16] },
    flag: { sunDir: [0.3, -0.38, -1], sunColor: [1.05, 1.0, 0.95], ambTop: [0.34, 0.3, 0.38], ambBottom: [0.16, 0.12, 0.16] }
  };

  function create(r) {
    const T = makeTextures(r);
    const X = { T, agent: makeAgent(r), sam: makeSam(r), max: makeMax(r), Q: makeQuads(r) };
    const BUILD = { oval: buildOval, stage: buildStage, posters: buildPosters, globe: buildGlobe, flag: buildFlag };
    const sets = {};
    const setFor = (id) => sets[id] || (sets[id] = BUILD[id](r, X));
    const F = { full: r.frameTexture(false), small: r.frameTexture(false), tiny: r.frameTexture(false) };
    const OVER_ENV = { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0, 0, 0], fogNear: 1000, fogFar: 2000 };
    const ORTHO = new Float32Array([2 / FW, 0, 0, 0, 0, 2 / FH, 0, 0, 0, 0, -1, 0, -1, -1, 0, 1]);
    const VIEW = M4.ident();
    let polys = 0;
    const tally = () => { polys += r.polys; r.polys = 0; };
    const over = (colorM, colorAdd) => {
      tally();
      r.begin(OVER_ENV, { proj: ORTHO, view: VIEW, colorM, colorAdd }, MAIN, true);
    };
    const rect = (x, y, w, h, opts) => r.draw(X.Q.unit, M4.chain(M4.translate(x, y, 0), M4.scale(w, h, 1)), Object.assign({ noFog: true }, opts));
    const full = (tex, opts) => rect(0, 0, FW, FH, Object.assign({ texture: tex }, opts));
    const grab = (tex) => r.grab(tex, MAIN.x, MAIN.y, FW, FH);

    function bloom(k) {
      if (k <= 0.02) return;
      grab(F.full);
      over([2.2, 0, 0, 0, 2.2, 0, 0, 0, 2.2], [-1.15, -1.15, -1.15]);
      rect(0, 0, 128, 72, { texture: F.full });
      r.grab(F.small, MAIN.x, MAIN.y, 128, 72);
      over();
      rect(0, 0, 32, 18, { texture: F.small });
      r.grab(F.tiny, MAIN.x, MAIN.y, 32, 18);
      full(F.full);
      full(F.small, { additive: true, alpha: Math.min(1, 0.6 * k) });
      full(F.tiny, { additive: true, alpha: Math.min(1, 0.9 * k) });
    }

    function envFor(st, t) {
      const L = st.light || {};
      const base0 = SCENE_ENV[st.scene];
      const env = { sunDir: base0.sunDir, sunColor: base0.sunColor.slice(), ambTop: base0.ambTop.slice(), ambBottom: base0.ambBottom.slice(), fogColor: [0, 0, 0], fogNear: 40, fogFar: 90, points: [] };
      if (st.scene === 'oval') {
        const dim = L.dim || 0;
        env.sunColor = env.sunColor.map(v => v * (1 - dim * 0.85));
        env.ambTop = env.ambTop.map(v => v * (1 - dim * 0.75));
        env.ambBottom = env.ambBottom.map(v => v * (1 - dim * 0.75));
        const al = L.alarm || 0;
        env.points.push({ pos: [0, 3.9, 0.2], color: [0.95 * al, 0.12 * al, 0.08 * al] });
        const fp = wallPoint(FIRE_TH, 0.7, 0.55);
        const fl = (0.55 + 0.15 * S(t * 13) + 0.1 * S(t * 7.3)) * (1 - dim * 0.9);
        env.points.push({ pos: fp, color: [0.9 * fl, 0.42 * fl, 0.22 * fl] });
        if (L.wash) {
          env.sunColor = env.sunColor.map((v, i) => v * L.wash[i]);
          env.ambTop = env.ambTop.map((v, i) => v * L.wash[i]);
        }
      } else if (st.scene === 'stage') {
        const k = L.stage === undefined ? 1 : L.stage;
        const col = L.blue ? [0.42, 0.55, 1.1] : [0.95, 0.95, 1.05];
        env.sunColor = col.map(v => v * k);
        env.ambTop = env.ambTop.map(v => v * k);
      } else if (st.scene === 'posters') {
        const k = L.reveal === undefined ? 1 : L.reveal;
        env.sunColor = env.sunColor.map(v => v * k);
        env.ambTop = env.ambTop.map(v => v * k);
      } else if (st.scene === 'globe') {
        if (L.spotUp) {
          env.points.push({ pos: [0, (L.platform || 0) + 2.6, 1.2], color: [2.2 * L.spotUp, 2.3 * L.spotUp, 2.6 * L.spotUp] });
          env.ambTop = env.ambTop.map(v => v * (1 + L.spotUp));
        }
      }
      if (st.scene !== 'globe' && !L.fixedSun) {
        const cm = st.camera;
        if (st.scene === 'oval' && !cm.grade) cm.grade = [0.93, 0.88, 1.03, 0];
        const f = V3.norm(V3.sub(cm.at, cm.eye));
        let rt = V3.cross(f, [0, 1, 0]);
        if (V3.len(rt) < 1e-3) rt = [1, 0, 0];
        rt = V3.norm(rt);
        const k = L.key || [0.55, 0.5, -0.7];
        env.sunDir = V3.norm(V3.add(V3.add(V3.mul(f, k[0]), V3.mul(rt, k[1])), [0, k[2], 0]));
      }
      if (L.sunDir) env.sunDir = L.sunDir;
      if (L.cookie) {
        const ck = L.cookie;
        const k = clamp(ck.strength, 0, 1);
        env.cookie = { texture: T[ck.tex], matrix: cookieMatrix(ck.dir, ck.center, ck.half), strength: k };
        env.sunDir = V3.norm(mixv(env.sunDir, ck.dir, k));
        const c = ck.color || [1.1, 1.05, 0.98];
        env.sunColor = mixv(env.sunColor, c, k);
      }
      return env;
    }

    function drawOval(set, st, t) {
      const L = st.light || {};
      const P = st.props || {};
      set.meshes.forEach(m => r.draw(m.mesh, null, m.texture ? { texture: m.texture } : {}));
      const al = L.alarm || 0;
      if (al > 0.01) r.draw(set.glow, null, { additive: true, alpha: 0.7 * al, noFog: true });
      const sg = L.sign || 0;
      const k = 0.3 + sg * 0.95;
      r.draw(set.sign, null, { texture: T.warSign, tint: [k, k * (0.6 + 0.4 * sg), k * (0.6 + 0.4 * sg)] });
      r.draw(set.fire, null, { additive: true, alpha: 0.45 + 0.15 * S(t * 11) });
      const frame = wallFrame(DOOR_TH, 0.035);
      const a = P.door || 0;
      const leftA = P.doorSide === 'right' ? 0 : a;
      const rightA = P.doorSide === 'left' ? 0 : a;
      r.draw(set.leaf, M4.chain(frame, M4.translate(-0.72, 0, 0), M4.rotY(leftA)));
      r.draw(set.leaf, M4.chain(frame, M4.translate(0.72, 0, 0), M4.rotY(-rightA), M4.scale(-1, 1, 1)));
      const sofaM = P.sofa || place(SPOTS.sofa[0], SPOTS.sofa[1], PI);
      r.draw(set.sofa.body, sofaM, { texture: T.sofa });
      r.draw(set.sofa.legs, sofaM, { texture: T.wood });
      r.draw(set.sofa.pillows, sofaM);
      const gp = P.globe || SPOTS.globe;
      r.draw(set.globeStand, M4.translate(gp[0], 0, gp[1]));
      r.draw(set.globe, M4.chain(M4.translate(gp[0], 1.04, gp[1]), M4.rotZ(0.4), M4.rotY(t * 0.25)), { texture: T.globe });
      const calM = P.calendar || place(SPOTS.calendar[0], SPOTS.calendar[1], -0.35);
      r.draw(set.calendar.easel, calM);
      r.draw(set.calendar.page, calM, { texture: T.calendar });
      const scream = L.scream || 0;
      const nutM = M4.chain(place(SPOTS.nut[0], SPOTS.nut[1], SPOTS.nutRy), M4.translate(0, 0.66, 0));
      r.draw(set.nut.body, nutM);
      r.draw(set.nut.jaw, M4.chain(nutM, M4.translate(0, 0.38 - scream * 0.05, 0.1), M4.rotX(-scream * 0.2)));
      r.draw(set.nut.hands, M4.chain(nutM, M4.translate(0, lerp(0.18, 0.41, scream), lerp(0, 0.085, scream))));
      const mk = wallFrame(FIRE_TH, 0.25, 1.29);
      const monkeyM = M4.chain(mk, M4.translate(0.75, 0, 0), M4.scale(1.7));
      r.draw(set.monkey.body, monkeyM);
      const clap = 0.5 + 0.5 * C(PI * 2 * beatAt(P.clap || t) * (P.clap ? 2 : 1));
      [-1, 1].forEach(s => r.draw(set.monkey.arm, M4.chain(monkeyM, M4.translate(s * 0.085, 0.13, 0.02), M4.rotX(-1.25), M4.rotZ(s * lerp(0.15, 0.75, clap)))));
    }

    function drawStage(set, st, t) {
      const L = st.light || {};
      set.meshes.forEach(m => r.draw(m.mesh, null, {}));
      r.draw(L.lit ? set.lit : set.dark, null, {});
      (L.spots || []).forEach(([x, y, s, col]) => {
        const k = L.stage === undefined ? 1 : L.stage;
        r.draw(set.disc, M4.chain(M4.translate(x + 0.3 * S(t * 0.7 + x), y + 0.2 * S(t * 0.5 + y), set.frontZ + 0.02), M4.scale(s, s, 1)), { texture: T.glow, additive: true, alpha: 0.75 * k, tint: col, noFog: true });
      });
    }

    function drawPosters(set, st, t) {
      const L = st.light || {};
      r.draw(set.floor, null, {});
      if (L.poster === 'peepers') {
        const M = M4.chain(M4.translate(0.2, 0, -0.6), M4.rotY(0.32), M4.rotZ(-0.05));
        r.draw(set.peepersBack, M);
        r.draw(set.peepers, M, { texture: T.peepers });
        const sp = L.spot;
        r.draw(set.disc, M4.chain(M, M4.translate(sp[0] - 0.2 + 0.25 * S(t * 0.8), sp[1], 0.02), M4.scale(sp[2], sp[2], 1)), { texture: T.glow, additive: true, alpha: 0.5, noFog: true });
      } else {
        const M = M4.chain(M4.translate(0, 0, -1.0), M4.rotY(0.04));
        r.draw(set.giveBack, M);
        r.draw(set.give, M, { texture: T.giveMe, tint: [0.35 + 0.65 * (L.reveal || 0), 0.35 + 0.65 * (L.reveal || 0), 0.35 + 0.65 * (L.reveal || 0)] });
      }
    }

    function drawGlobe(set, st, t) {
      const L = st.light || {};
      r.draw(set.floor, null, {});
      if (L.pool) {
        r.draw(set.rim, null, { texture: T.stone });
        r.draw(set.water, null, { texture: T.water, uvScroll: [t * 0.03, t * 0.02] });
      }
      if (L.platform !== undefined) r.draw(set.platform, M4.translate(0, L.platform, 0));
      const lid = L.lid || 0;
      if (lid < 1.5) {
        const hinge = -3.1;
        const M = lid > 0 ? M4.chain(M4.translate(0, 0, hinge), M4.rotX(-lid * 1.9), M4.translate(0, 0, -hinge)) : M4.ident();
        r.draw(set.dome, M4.mul(M, M4.rotY(-0.35)), { texture: T.globe });
        r.draw(set.domeIn, M);
      }
      if (L.spotUp) {
        r.draw(set.disc, M4.chain(M4.translate(0, POOL.water + 0.02, 0), M4.rotX(-PI / 2), M4.scale(2.6, 2.6, 1)), { texture: T.glow, additive: true, alpha: 0.6 * L.spotUp, noFog: true });
        r.draw(set.disc, M4.chain(M4.translate(0, 1.9, -2.6), M4.scale(4.2, 3.4, 1)), { texture: T.glow, additive: true, alpha: 0.75 * L.spotUp, tint: [0.45, 0.9, 1], noFog: true });
      }
    }

    function drawFlag(set, st, t) {
      const L = st.light || {};
      r.draw(set.floor, null, {});
      r.draw(set.wall, null, {});
      r.draw(set.stars, null, {});
      const hx = FLAG.hero[0], hy = FLAG.hero[1];
      if (L.heroSpot) r.draw(set.disc, M4.chain(M4.translate(hx, hy, FLAG.z + 0.005), M4.scale(3.0, 3.0, 1)), { texture: T.spot, additive: true, alpha: 0.6 * L.heroSpot, tint: [0.3, 0.5, 1], noFog: true });
      if (L.hole > 0.02) r.draw(set.hole, M4.chain(M4.translate(hx, hy, FLAG.z + 0.012), M4.scale(lerp(0.4, 1.12, L.hole), lerp(0.4, 1.12, L.hole), 1)));
      if ((L.hole || 0) < 0.98) r.draw(set.hero, M4.chain(M4.translate(hx, hy, FLAG.z + 0.02), M4.scale(1 - (L.hole || 0), 1 - (L.hole || 0), 1)));
    }

    const DRAW = { oval: drawOval, stage: drawStage, posters: drawPosters, globe: drawGlobe, flag: drawFlag };

    function drawCast(st, env) {
      const sun = env.sunDir;
      const floorM = planarFloor(sun, st.scene === 'globe' ? POOL.top + 0.012 : 0.014);
      st.cast.forEach(a => {
        if (a.hidden) return;
        if (st.scene === 'flag') drawShadow(r, X, a, planarWallZ(sun, FLAG.z + 0.03), 0.45);
        else if (st.scene === 'stage') drawShadow(r, X, a, planarWallZ(sun, setFor('stage').frontZ + 0.03), 0.5);
        if (!env.cookie && st.scene !== 'globe') drawShadow(r, X, a, floorM, 0.32);
      });
      st.cast.forEach(a => drawActor(r, X, a, {}));
    }

    return {
      warm() {
        Object.keys(BUILD).forEach(setFor);
      },
      render(t) {
        polys = 0;
        r.polys = 0;
        const shot = shotAt(t);
        const st = worldFor(t, shot);
        r.clear([0, 0, 0]);
        const env = envFor(st, t);
        const set = setFor(st.scene);
        r.begin(env, st.camera, MAIN);
        DRAW[st.scene](set, st, t);
        drawCast(st, env);
        const L = st.light || {};
        let bl = 0;
        if (st.scene === 'stage') bl = L.lit ? 0.9 : 0.4;
        else if (st.scene === 'oval') bl = 0.35 * Math.max(L.alarm || 0, L.sign || 0);
        else if (st.scene === 'globe') bl = 0.35;
        bloom(bl);
        if (L.iris) {
          over();
          full(T.iris, { tint: [0, 0, 0] });
        }
        if (L.black) {
          over();
          rect(0, 0, FW, FH, { flat: [0, 0, 0, clamp(L.black, 0, 1)], blend: true });
        }
        const line = lineAt(t);
        if (line) {
          over();
          rect(0, 6, FW, 48, { texture: T.subs[LINES.indexOf(line)] });
        }
        tally();
        return { shot, polys: Math.round(polys), fade: fadeAt(t), overlay: null, subtitle: line ? line.text : '' };
      }
    };
  }

  const clip = {
    id: 'war-song',
    number: 6,
    artist: 'Sam & Max',
    title: 'War Song',
    originalYear: 2007,
    audio: 'content/clip/War Song.mp3',
    duration: DURATION,
    bpm: BPM,
    poster: 74.8,
    locations: LOCATIONS,
    shots: SHOTS,
    looks: { superball: LOOKS.superball, agent: LOOKS.agent, sam: LOOKS.sam, max: LOOKS.max },
    lines: LINES,
    shotAt,
    stage,
    fadeAt,
    voiceAt,
    mouthFor,
    lineAt,
    create
  };

  window.poligonClips = window.poligonClips || [];
  if (!window.poligonClips.some(c => c.id === clip.id)) window.poligonClips.push(clip);
})();

