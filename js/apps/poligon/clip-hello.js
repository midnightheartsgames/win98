(function () {
  const { M4, V3, Builder, rgb } = window.P3D;
  const { restPose } = window.P3DFigure;
  const Cast = window.P3DCccCast;
  const GK = window.P3DGodKnowsCast;
  const KH = window.P3DHelloCast;

  const BPM = 102;
  const BEAT0 = 0.015;
  const BEAT = 60 / BPM;
  const DURATION = 173.54;
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
  const shadeC = (c, k) => [c[0] * k, c[1] * k, c[2] * k, c[3]];
  const NY = [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]];
  const NZ = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];

  const LOCATIONS = [
    { id: 'logo', name: 'Заставка', color: '#8a5ad0', scene: 'ident' },
    { id: 'steppe', name: 'Обочина', color: '#c8a46a', scene: 'steppe' },
    { id: 'car', name: 'Кабриолет', color: '#b4583c', scene: 'canyon' },
    { id: 'field', name: 'Поле', color: '#e8457c', scene: 'field' },
    { id: 'sunset', name: 'Закат', color: '#f08a2a', scene: 'field' },
    { id: 'air', name: 'С высоты', color: '#6a9a4a', scene: 'air' }
  ];

  const SHOT_LIST = [
    [0, 'logo', 'name'], [5.04, 'logo', 'ident'], [8.84, 'steppe', 'leanCar'], [18.28, 'car', 'hood1'], [21.92, 'car', 'side1'],
    [24.32, 'car', 'rear1'], [26.68, 'steppe', 'danceCar'], [29.08, 'car', 'hood2'], [31.16, 'car', 'side2'], [34.12, 'steppe', 'chin'],
    [37.56, 'car', 'hood3'], [39.32, 'car', 'hood4'], [41.24, 'car', 'side3'], [43.48, 'car', 'side4'], [45.32, 'car', 'side5'],
    [46.84, 'steppe', 'selfie'], [49.52, 'car', 'side6'], [52.84, 'steppe', 'selfieClose'], [54.2, 'car', 'flowers'], [55.48, 'field', 'walkIn'],
    [62.36, 'field', 'line1'], [67.16, 'field', 'soloSun1'], [69.36, 'car', 'handsUp'], [71.48, 'air', 'air1'], [74.08, 'field', 'line2'],
    [76.88, 'car', 'standUp1'], [79.6, 'field', 'line3'], [81.68, 'field', 'soloSun2'], [85.68, 'car', 'standUp2'], [88.68, 'field', 'dolly'],
    [93.92, 'field', 'soloClose'], [95.44, 'field', 'frame'], [99.56, 'sunset', 'selfieCam'], [101.0, 'car', 'hood5'], [103.52, 'sunset', 'pose'],
    [104.6, 'car', 'side7'], [106.96, 'car', 'side8'], [108.08, 'air', 'air2'], [110.76, 'field', 'soloFar'], [112.24, 'car', 'side9'],
    [113.76, 'sunset', 'heart'], [116.56, 'car', 'standUp3'], [119.28, 'field', 'soloSil'], [120.88, 'sunset', 'photo'], [122.16, 'car', 'lean1'],
    [126.28, 'field', 'hands'], [129.6, 'car', 'side10'], [130.92, 'field', 'low1'], [133.52, 'sunset', 'run'], [135.4, 'car', 'lean2'],
    [137.88, 'sunset', 'wave'], [139.84, 'field', 'low2'], [142.48, 'sunset', 'bounce'], [144.72, 'field', 'backlit'], [147.04, 'field', 'whip'],
    [149.6, 'sunset', 'pump'], [151.84, 'sunset', 'couple1'], [154.32, 'field', 'soloDance'], [156.68, 'sunset', 'couple2'], [161.88, 'sunset', 'finale'],
    [165.08, 'air', 'air3']
  ];

  const EMPTY = new Set(['air1', 'air2', 'air3', 'hands']);

  const SHOTS = SHOT_LIST.map(([start, loc, cam], i) => ({
    index: i,
    start,
    end: i + 1 < SHOT_LIST.length ? SHOT_LIST[i + 1][0] : DURATION,
    loc,
    cam,
    scene: LOCATIONS.find(l => l.id === loc).scene,
    overlay: null,
    emptyOk: EMPTY.has(cam)
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

  const fadeAt = (t) => smooth(span(t, 169.9, 172.6));

  function flashAt(t) {
    const pulse = (a, m, b) => smooth(span(t, a, m)) * (1 - smooth(span(t, m, b)));
    return Math.max(pulse(4.82, 4.98, 5.22), pulse(99.42, 99.6, 99.9));
  }

  const titleAt = (t) => smooth(span(t, 9.3, 9.8)) * (1 - smooth(span(t, 11.0, 11.6)));

  const VOICE = '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000233687326ghcbcb6667acddb86889bb759foqonnkf622222123bfeaa96675422110110001469cb6bb876752100000169acca789ggb9bddec74122246667abaadmpoqqpnja44222238cgheca9854666765411123244bmpooolgddc85000000112222476ehuxyyyxwxwxyzzzzyyyzzyyxxwxwvtssrqponnnkggfeeb89aegd96457887787nqttrsvtsxzyxvsuwyzzyxxyyyzyyxwwvvvusqpoljikkjigdcaa98997555665799988721gvyxul4qwxwvtpkfmqnvzyxwvupjmqquxxvvxwrcuyyyzzzyxvttrpprqppokhihhikkieedcb8666555565566665446akrwzyvuqkcervwvvwwvtpnjhrwxvvvvvuvvwvuuwxwuromsurifqwwuutttssqqqpppnnnnllmnljie778777886542465cnyzzyyxwxxxxvtuutsttrrrpprrrsuwxxxyzytmea8ceddeghhggfqwxwwvuwyywrefghkmsxyvtqsvwwsilpquwvtrpoomvxvsqoswwxwrljrvvuvxvrpmsuvtntwwvvuuxyxvogggfebtxxvutwzzzwpbegggfsutvvuuttvwtppruvvxxwwwuronlouxywttvxvsttuuuwwuvtllruxwssqmuwvwxwxzxuqmiheb987754nswxvuyyughruuuvwvtpuyyyxwwwwwurqpppoqpkfecegfbkpstrsxxuttpbntutvxuhkqobuxyyyyzwuvtmuxyxwusrqtxxxyxutsrokkjhhgcefdb966jtwwxxxwvvyzywwvvwvutrqrqrssrqnklkihgfda998765554444ivzzzzzyxyyxyxwvspomjjihjjkkjjjkkjiijjikjfeddfffefggeedefpuwyywsplqyzzzwuutsuuxzzwvwyzyxwrtxyxxzyvutwyyyzzzzzzyxwvvvwxwvtusokkkie7654333346755667742233rxywyywvtswyzzywvsrwxshgqvxxxxxvprxyxxwtsqsxzyyzzzyxyyxwutwxwwvssutrpmkhffd87766789bda44432246otspxyuplvxwsidiuxxyyyxupruwxyxwxwyzyxyxuppzzzyzzzzzzzyxxwxxxxvropqrsttroifeeb7bryzyyxurnovxvvvvvvwxwvuvvvvvvvtstttutssqokecaa96798csxyyxxyxyzzyyyyyxuuvvuqllkikllklnmjiiijiefffgfeddeedbcccdrtmuzzzxxwxyxwuohkptwxywvwvwwvwwtuxxwwwskmwyxyzzyxyywvwwxyyxyywuttrnklkgecabccbbceeb77787667ekouxyzzyxwwxyvqprttwyxwvsuxwwwtyyrwzzyxvqejtxxyzzyxwuuwvwwwwwwwutuusnlljhea7898acefgijkkkihgdeimsvxwqfquvxzxvtqpqsuvwyyxwtwyxxywvxyyyxtjgvzzyyzyyyzyxxyxxyxxwvtuuttttrolgcbbabfotuwywsttxzyzzyzzyxzywvvvxxwvvvvusrpooljkhd96668cb6543222222222221110000000fvxvvwvtqmgccbbb97642246787545532ntvwvnlsvuvurtvvvtrvvtttvwtostttqqtuuuwxuoorsvyzzyxwvvurpoonnoomklmlmoomhijd874432453223334322aruvvrisuuwyxyxssrqxytrrloqtvuqwvptwwvtsutnqrrtvwvvusrrstuuurponpqomllmlighec86755665656665432223333326mrttqvyxwvuvvuxyxxxwwwwurnmkinpopnfgflpqqppohb9dpusqxxwvvxxxxxxwvvwwwvuutsrsxyyzzyxvtsuvsowywutrnnkipuurrqpvxwvuutpifgktxywwwurqstuvwvvvutuvvvvwvwwvvwxxulbghikntxxvuruwvtphorruvutqppnowxtnkotwwwtmhguxvvwwtqpptvurovyxvvtwyyxtkffgd9lvywvuuxzzzukfedbapuuvxwvutvxvsposuuxyxvutrpommqwyywuuwxutvuusuxwvvrgmrvwtrqkrwwvwwxzyxvpjida999a94fovxwtwywqbmtvuuwxurpwywxwvwvvutrqppooqnhdcbfgecmsttpvxvttsjgrvutxxrgqrkqwyxxxyxuvvpnwyxwuuutswyyyyxwwuspmkjhigegfdc869puwwxxwvuxzywwxwwvvuutssrsssssqppommh762111122112211lxzzzzzyzzzyxwwvpihhijihjkjikjiiiihhhhihfhgcdeddcddbbcbcfrvwyyusriuzzzyvwvstuvyzyvxxyyxxvpvzyxyyxutuyyyzzzzzzzxwwwvwxxwvuuqhkkihe985554568987777874434ewyyyyxvvttxzzyxwvrwyumikuxxxyxvspuyyxywtrpuxxyzzyxxxyxvutuwvvwvuvuspnjhghgc98886899cc98876654btunuywspqwyungdltvxyzyvrsuvxyywvwwxyxwxwrmwzzzzzzzyyyywxxxyyxwvvurqqstsplgffd98jvzzyxwtqltwwvwwxxyyxvuuuvwvvvutuusrstvurnjgecca7896ivyyyzzxxzzyxxxyxvuuvvtpnkiiklmklmljihhgfeefhigdddccb99aalutkwzzyyxwxxxvrlejquxyxvvvwxvvxvtvxxwxvnftxyyzzzyyywwxwwxyxxxwuvvtpljjhdb9886666898765554338glrwzzzzxwvvxxtqruutwywvuswyxwuwzwtxzzxxtkdowzzzzzyywtvwxxwwxwvvututqmkkkjhb8889acilkiijjihhgefkouxyvkntvwzzxusqqpquvxyyxvtxyxyxwwyxxxvqjoxzyxzzyxyyxxyyxxxwwvutuuttutrokgfecbekrvwyyvstvyzyyyyyyxxyxwvvwwwwvuuvusrqpnkihfca875aca7hvyyxyzyzzyxyywvroonjd86432222222111111000000000000000000000000000000000000000000000000000000000000000';
  const VOICE_LV = Array.from(VOICE, ch => parseInt(ch, 36) / 35);

  function voiceAt(t) {
    const f = t * 20;
    const i = Math.floor(f);
    if (i < 0 || i >= VOICE_LV.length) return 0;
    const a = VOICE_LV[i], b = VOICE_LV[i + 1] || 0;
    return a + (b - a) * (f - i);
  }

  const SINGING = [[18.7, 93.0], [94.3, 169.75]];
  const ALONG = [[29.08, 31.16], [85.68, 88.68], [101.0, 103.52], [116.56, 119.28]];
  const inside = (list, t) => list.some(([a, b]) => t >= a && t <= b);

  function mouthFor(role, t) {
    const v = clamp((voiceAt(t) - 0.15) / 0.7, 0, 1);
    if (role === 'singer') return inside(SINGING, t) ? v : 0;
    if (role === 'girl') return inside(ALONG, t) ? v * 0.8 : 0;
    return 0;
  }

  const ENERGY = [[0, 0.3], [8.8, 0.45], [18.3, 0.6], [34.5, 0.7], [55.3, 1], [93.0, 0.5], [94.2, 0.7], [110.6, 0.75], [131.8, 1], [169.4, 0.4]];

  function energyAt(t) {
    let i = 0;
    while (i + 1 < ENERGY.length && ENERGY[i + 1][0] <= t) i++;
    const next = ENERGY[i + 1];
    if (!next) return ENERGY[i][1];
    return lerp(ENERGY[i][1], next[1], smooth(span(t, next[0] - 0.8, next[0])));
  }

  const CHARACTERS = {
    singer: { name: 'Солист' },
    girl: { name: 'Девушка в сером костюме' },
    dancers: { name: 'Танцовщицы в розовом' }
  };

  const ARMS = {
    down: { a: [0.08, 0, 0.1, 0.12] },
    relax: { a: [0.2, 0.15, 0.22, 0.42] },
    swingFwd: { a: [0.5, 0.05, 0.14, 0.55] },
    swingBack: { a: [-0.35, 0, 0.14, 0.3] },
    swingOut: { a: [0.3, 0, 0.62, 0.4] },
    low: { a: [0.3, 0.1, 0.6, 0.2] },
    lowBack: { a: [-0.3, 0, 0.35, 0.2] },
    side: { a: [0.1, 0, 1.42, 0.05] },
    sideUp: { a: [0.3, 0, 1.78, 0.1] },
    up: { a: [2.95, 0.05, 0.15, 0.08] },
    upBent: { a: [2.55, 0.25, 0.45, 0.85] },
    pointUp: { a: [2.7, 0.15, 0.4, 0.08] },
    pointDown: { a: [0.55, 0.2, 0.45, 0.06] },
    point: { a: [1.5, 0.15, 0.05, 0.05] },
    flex: { a: [1.5, 1.35, 0.1, 1.9] },
    flex2: { a: [1.35, 1.2, 0.2, 1.45] },
    pumpUp: { a: [2.55, 0.2, 0.78, 0.55] },
    pumpDown: { a: [1.95, 0.25, 0.9, 1.45] },
    front: { a: [1.15, 0.25, 0.15, 1.0] },
    open: { a: [1.05, 0.55, 0.35, 0.35] },
    openWide: { a: [0.8, 0.9, 0.5, 0.25] },
    selfie: { a: [2.45, -0.3, 0.25, 0.3] },
    snap: { a: [1.85, -0.4, 0.3, 0.22] },
    twirlUp: { a: [2.85, 0.3, 0.2, 0.4] },
    doorArm: { a: [0.15, 0.2, 1.15, 1.25] },
    outDoor: { a: [0.45, 0.1, 1.55, 0.3] },
    kissOut: { a: [1.35, -0.1, 0.45, 0.2] },
    wave: { a: [2.4, 0.2, 0.55, 0.9], wig: [0, 0, 0.2, 0.3] },
    hip: { ik: [0.15, 0.03, 0.02] },
    pocket: { ik: [0.15, -0.05, 0.07] },
    chest: { ik: [0.03, 0.28, 0.16] },
    mouth: { ik: [0.0, 0.5, 0.15] },
    kiss: { ik: [0.0, 0.52, 0.16] },
    clap: { ik: [0.025, 0.4, 0.3] },
    clapOpen: { ik: [0.14, 0.42, 0.26] },
    lap: { ik: [0.09, -0.04, 0.27] },
    behindHead: { ik: [0.06, 0.66, -0.05] },
    faceWave: { ik: [0.2, 0.56, 0.12], wig: [0, 0.16, 0.1, 0.2] },
    chestFist: { ik: [0.08, 0.3, 0.24] },
    peace: { ik: [0.1, 0.62, 0.17] },
    photo: { ik: [0.07, 0.56, 0.24] },
    frameUp: { ik: [0.1, 0.66, 0.3] },
    headTop: { ik: [0.03, 0.74, 0.02] },
    holdLow: { ik: [0.06, 0.06, 0.4] },
    hold: { ik: [0.12, 0.12, 0.38] },
    hug: { ik: [-0.12, 0.25, 0.28] },
    shoulder: { ik: [-0.14, 0.38, 0.12] },
    standFrame: { ik: [0.24, 0.14, 0.3] },
    frameTop: { ik: [0.02, 0.4, 0.34] },
    frameLow: { ik: [0.02, 0.2, 0.34] },
    watchL: { ik: [0.02, 0.3, 0.3] },
    watchR: { ik: [0.03, 0.31, 0.25] },
    chinReach: { ik: [0.0, 0.4, 0.46] },
    doorPull: { ik: [0.22, 0.12, 0.34] },
    wheelL: { wheel: 'L' },
    wheelR: { wheel: 'R' }
  };

  const LEG_L = {
    stand: { hipL: [0.03, 0, 0.05], knL: [0.05, 0, 0], hipR: [0.03, 0, 0.05], knR: [0.05, 0, 0] },
    rest: { hipL: [0.16, 0.12, -0.02], knL: [0.34, 0, 0], hipR: [0.02, 0, 0.07], knR: [0.02, 0, 0] },
    apart: { hipL: [0.02, 0, 0.17], knL: [0.04, 0, 0], hipR: [0.02, 0, 0.17], knR: [0.04, 0, 0] },
    dip: { hipL: [0.3, 0, 0.12], knL: [0.55, 0, 0], hipR: [0.3, 0, 0.12], knR: [0.55, 0, 0] },
    tap: { hipL: [0.1, 0, 0.3], knL: [0.14, 0, 0], hipR: [0.06, 0, 0.0], knR: [0.14, 0, 0] },
    lunge: { hipL: [0.4, 0, 0.55], knL: [0.95, 0, 0], hipR: [0.02, 0, 0.32], knR: [0.04, 0, 0] },
    crouch: { hipL: [0.62, 0, 0.18], knL: [1.0, 0, 0], hipR: [0.62, 0, 0.18], knR: [1.0, 0, 0] },
    crouch2: { hipL: [0.5, 0, 0.22], knL: [0.82, 0, 0], hipR: [0.66, 0, 0.12], knR: [1.08, 0, 0] },
    seat: { hipL: [1.38, 0.05, 0.1], knL: [1.42, 0, 0], hipR: [1.38, -0.05, 0.1], knR: [1.42, 0, 0] },
    standCar: { hipL: [0.16, 0, 0.06], knL: [0.24, 0, 0], hipR: [0.16, 0, 0.06], knR: [0.24, 0, 0] }
  };

  const LEGS = {};
  Object.keys(LEG_L).forEach(k => {
    const v = LEG_L[k];
    LEGS[k + 'L'] = v;
    LEGS[k + 'R'] = { hipL: v.hipR, knL: v.knR, hipR: v.hipL, knR: v.knL };
    LEGS[k] = v;
  });

  const MOVES = {
    idle: { len: 4, still: true, keys: [[0, { L: 'down', R: 'down', legs: 'stand' }]] },
    groove: { len: 2, keys: [[0, { L: 'swingFwd', R: 'swingBack', legs: 'tapL', tilt: 0.06, roll: 0.04, twist: 0.08 }], [1, { L: 'swingBack', R: 'swingFwd', legs: 'tapR', tilt: -0.06, roll: -0.04, twist: -0.08 }]] },
    clapHigh: { len: 2, keys: [[0, { L: 'clap', R: 'clap', legs: 'tapL', nod: -0.05, eyes: 'happy', mood: 'grin' }], [1, { L: 'clapOpen', R: 'clapOpen', legs: 'tapR' }]] },
    pointUp: { len: 4, keys: [[0, { L: 'hip', R: 'pointUp', legs: 'restL', roll: 0.08, nod: -0.15, turn: -0.1 }], [1, { L: 'hip', R: 'pointDown', legs: 'restR', roll: -0.04 }], [2, { L: 'pointUp', R: 'hip', legs: 'restR', roll: -0.08, nod: -0.15, turn: 0.1 }], [3, { L: 'pointDown', R: 'hip', legs: 'restL', roll: 0.04 }]] },
    raise: { len: 2, xf: 0.5, keys: [[0, { L: 'up', R: 'up', legs: 'apart', nod: -0.2, eyes: 'happy', mood: 'grin' }], [1, { L: 'upBent', R: 'upBent', legs: 'dip', nod: -0.1 }]] },
    lunge: { len: 4, keys: [[0, { L: 'sideUp', R: 'side', legs: 'lungeL', dx: 0.2, roll: -0.12, tilt: -0.1 }], [1, { L: 'low', R: 'low', legs: 'stand' }], [2, { L: 'side', R: 'sideUp', legs: 'lungeR', dx: -0.2, roll: 0.12, tilt: 0.1 }], [3, { L: 'low', R: 'low', legs: 'stand' }]] },
    flex: { len: 2, keys: [[0, { L: 'flex', R: 'flex', legs: 'apart', mood: 'grin' }], [1, { L: 'flex2', R: 'flex2', legs: 'dip' }]] },
    wave: { len: 4, keys: [[0, { L: 'up', R: 'upBent', legs: 'restL', roll: 0.16, dx: -0.08 }], [2, { L: 'upBent', R: 'up', legs: 'restR', roll: -0.16, dx: 0.08 }]] },
    bounceLow: { len: 2, keys: [[0, { L: 'front', R: 'front', legs: 'crouch', lean: 0.18 }], [1, { L: 'front', R: 'front', legs: 'crouch2', lean: 0.24, twist: 0.15 }]] },
    whip: { len: 2, keys: [[0, { L: 'lowBack', R: 'lowBack', legs: 'apart', lean: 0.5, nod: 0.45, hair: -0.7, eyes: 'shut' }], [1, { L: 'swingOut', R: 'swingOut', legs: 'apart', lean: -0.06, nod: -0.25, hair: 0.45 }]] },
    pump: { len: 1, keys: [[0, { L: 'pumpUp', R: 'pumpUp', legs: 'apart', nod: -0.15, mood: 'grin' }], [0.5, { L: 'pumpDown', R: 'pumpDown', legs: 'dip', nod: -0.05, mood: 'grin' }]] },
    walk: { len: 2, walk: 'walk', keys: [[0, {}]] },
    jog: { len: 2, walk: 'jog', keys: [[0, {}]] },
    cool: { len: 4, keys: [[0, { L: 'pocket', R: 'pocket', legs: 'apart', nod: 0.04, mood: 'calm' }], [2, { L: 'pocket', R: 'pocket', legs: 'apart', nod: -0.04, mood: 'calm' }]] },
    singChest: { len: 4, keys: [[0, { L: 'down', R: 'chest', legs: 'restR', nod: -0.05 }], [2, { L: 'relax', R: 'chest', legs: 'restL', nod: 0.02 }]] },
    singOpen: { len: 4, keys: [[0, { L: 'down', R: 'open', legs: 'restL', tilt: 0.05 }], [2, { L: 'open', R: 'relax', legs: 'restR', tilt: -0.05 }]] },
    singPoint: { len: 2, keys: [[0, { L: 'down', R: 'point', legs: 'restL', nod: 0.04 }]] },
    singSway: { len: 4, keys: [[0, { L: 'low', R: 'low', legs: 'restL', roll: 0.05, tilt: 0.08 }], [2, { L: 'low', R: 'low', legs: 'restR', roll: -0.05, tilt: -0.08 }]] },
    soloStep: { len: 2, keys: [[0, { L: 'swingOut', R: 'open', legs: 'tapL', twist: 0.15, roll: 0.05 }], [1, { L: 'open', R: 'swingOut', legs: 'tapR', twist: -0.15, roll: -0.05 }]] },
    pairHim: { len: 2, keys: [[0, { L: 'relax', R: 'holdLow', legs: 'tapL', tilt: 0.05 }], [1, { L: 'relax', R: 'holdLow', legs: 'tapR', tilt: -0.05 }]] },
    pairHer: { len: 2, keys: [[0, { L: 'holdLow', R: 'relax', legs: 'tapR', tilt: -0.05, eyes: 'happy', mood: 'grin' }], [1, { L: 'holdLow', R: 'relax', legs: 'tapL', tilt: 0.05, mood: 'grin' }]] },
    twirlHim: { len: 2, xf: 0.3, keys: [[0, { L: 'relax', R: 'twirlUp', legs: 'restL', nod: -0.1 }]] },
    twirlHer: { len: 2, xf: 0.3, spin: 2, keys: [[0, { L: 'twirlUp', R: 'swingOut', legs: 'restR', eyes: 'happy', mood: 'grin' }]] },
    stepHim: { len: 2, keys: [[0, { L: 'hold', R: 'hold', legs: 'tapL', dx: 0.06 }], [1, { L: 'hold', R: 'hold', legs: 'tapR', dx: -0.06 }]] },
    stepHer: { len: 2, keys: [[0, { L: 'hold', R: 'hold', legs: 'tapR', dx: -0.06, mood: 'grin' }], [1, { L: 'hold', R: 'hold', legs: 'tapL', dx: 0.06, mood: 'grin' }]] },
    hugHim: { len: 4, keys: [[0, { L: 'hug', R: 'relax', legs: 'stand', tilt: -0.1 }]] },
    hugHer: { len: 4, keys: [[0, { L: 'relax', R: 'shoulder', legs: 'restL', tilt: 0.2, eyes: 'happy', mood: 'smile' }]] },
    leanCar: { len: 4, still: true, keys: [[0, { L: 'relax', R: 'relax', legs: 'restR', lean: -0.12, nod: -0.22, turn: -0.5, mood: 'calm' }]] },
    watch: { len: 4, still: true, keys: [[0, { L: 'watchL', R: 'watchR', legs: 'restR', lean: -0.06, nod: 0.32, turn: 0.1, mood: 'calm' }]] },
    lookCam: { len: 4, still: true, keys: [[0, { L: 'relax', R: 'relax', legs: 'restR', lean: -0.1, turn: 0.4, mood: 'smile' }]] },
    door: { len: 4, still: true, keys: [[0, { L: 'doorPull', R: 'down', legs: 'stand', lean: 0.1, mood: 'smile' }]] },
    chinHim: { len: 4, keys: [[0, { L: 'chinReach', R: 'relax', legs: 'restL', lean: 0.06, nod: 0.12, mood: 'smile' }]] },
    chinHer: { len: 4, keys: [[0, { L: 'relax', R: 'relax', legs: 'restR', lean: -0.06, nod: -0.22, eyes: 'happy', mood: 'grin' }], [2, { L: 'relax', R: 'chest', legs: 'restR', lean: -0.04, nod: -0.12, mood: 'grin' }]] },
    selfieHim: { len: 2, keys: [[0, { L: 'down', R: 'selfie', legs: 'restL', nod: -0.25, turn: -0.15 }], [1, { L: 'relax', R: 'selfie', legs: 'restR', nod: -0.22 }]] },
    danceHer: { len: 2, keys: [[0, { L: 'faceWave', R: 'swingOut', legs: 'tapL', roll: 0.08, eyes: 'happy', mood: 'grin' }], [1, { L: 'swingOut', R: 'faceWave', legs: 'tapR', roll: -0.08, mood: 'grin' }]] },
    snapHer: { len: 4, keys: [[0, { L: 'down', R: 'snap', legs: 'restL', tilt: 0.15, turn: -0.1, mood: 'grin' }]] },
    snapHim: { len: 4, keys: [[0, { L: 'relax', R: 'peace', legs: 'restR', tilt: -0.18, roll: 0.05, mood: 'grin' }]] },
    poseHer: { len: 4, keys: [[0, { L: 'hip', R: 'headTop', legs: 'restL', tilt: 0.12, roll: -0.06, mood: 'smile' }]] },
    heartHim: { len: 4, keys: [[0, { L: 'frameUp', R: 'frameUp', legs: 'stand', nod: -0.15, mood: 'grin' }]] },
    heartHer: { len: 4, keys: [[0, { L: 'down', R: 'hug', legs: 'restL', tilt: 0.25, eyes: 'happy', mood: 'smile' }]] },
    photoHer: { len: 4, keys: [[0, { L: 'photo', R: 'photo', legs: 'restL', nod: 0.02, mood: 'smile' }]] },
    drive: { len: 4, keys: [[0, { L: 'wheelL', R: 'wheelR', legs: 'seat', lean: -0.18, mood: 'calm' }]] },
    driveSing: { len: 4, keys: [[0, { L: 'wheelL', R: 'open', legs: 'seat', lean: -0.18, turn: -0.3 }], [2, { L: 'wheelL', R: 'relax', legs: 'seat', lean: -0.18, turn: -0.1 }]] },
    doorSing: { len: 4, keys: [[0, { L: 'doorArm', R: 'wheelR', legs: 'seat', lean: -0.18, turn: 0.25 }], [2, { L: 'doorArm', R: 'wheelR', legs: 'seat', lean: -0.18, turn: 0.4, tilt: 0.06 }]] },
    gesture: { len: 2, keys: [[0, { L: 'wheelL', R: 'openWide', legs: 'seat', lean: -0.18, turn: -0.2 }], [1, { L: 'wheelL', R: 'open', legs: 'seat', lean: -0.18, turn: -0.3 }]] },
    leanBack: { len: 4, keys: [[0, { L: 'doorArm', R: 'wheelR', legs: 'seat', lean: -0.18, nod: -0.42, turn: 0.5, eyes: 'shut', mood: 'bliss' }]] },
    leanTo: { len: 4, keys: [[0, { L: 'wheelL', R: 'relax', legs: 'seat', lean: -0.18, roll: 0.1, tilt: 0.25, turn: -0.25, mood: 'smile' }]] },
    handsUpCar: { len: 2, keys: [[0, { L: 'up', R: 'up', legs: 'seat', lean: -0.18, nod: -0.15, mood: 'grin' }], [1, { L: 'upBent', R: 'upBent', legs: 'seat', lean: -0.18, mood: 'grin' }]] },
    blowKiss: { len: 4, keys: [[0, { L: 'wheelL', R: 'kiss', legs: 'seat', lean: -0.18, mood: 'kiss' }], [2, { L: 'wheelL', R: 'kissOut', legs: 'seat', lean: -0.18, mood: 'smile' }]] },
    sitLaugh: { len: 4, keys: [[0, { L: 'lap', R: 'lap', legs: 'seat', lean: -0.25, tilt: 0.1, eyes: 'happy', mood: 'grin' }], [2, { L: 'lap', R: 'lap', legs: 'seat', lean: -0.22, tilt: -0.05, mood: 'grin' }]] },
    headrest: { len: 4, keys: [[0, { L: 'lap', R: 'behindHead', legs: 'seat', lean: -0.3, nod: -0.15, tilt: -0.1, mood: 'smile' }]] },
    armOut: { len: 4, keys: [[0, { L: 'lap', R: 'outDoor', legs: 'seat', lean: -0.2, turn: -0.35, eyes: 'happy', mood: 'grin' }]] },
    waveCar: { len: 2, keys: [[0, { L: 'lap', R: 'faceWave', legs: 'seat', lean: -0.2, tilt: 0.08, mood: 'grin' }], [1, { L: 'lap', R: 'faceWave', legs: 'seat', lean: -0.2, tilt: -0.04, mood: 'grin' }]] },
    danceSeat: { len: 2, keys: [[0, { L: 'chestFist', R: 'chestFist', legs: 'seat', lean: -0.15, roll: 0.1, tilt: 0.1, mood: 'grin' }], [1, { L: 'chestFist', R: 'chestFist', legs: 'seat', lean: -0.15, roll: -0.1, tilt: -0.1, mood: 'grin' }]] },
    laughMouth: { len: 4, keys: [[0, { L: 'mouth', R: 'lap', legs: 'seat', lean: -0.2, nod: 0.1, eyes: 'happy', mood: 'grin' }]] },
    leanToHer: { len: 4, keys: [[0, { L: 'lap', R: 'lap', legs: 'seat', lean: -0.18, roll: -0.1, tilt: -0.25, turn: 0.25, eyes: 'happy', mood: 'smile' }]] },
    standCar: { len: 4, xf: 0.9, keys: [[0, { L: 'standFrame', R: 'standFrame', legs: 'standCar', stand: 1, lean: 0.12, eyes: 'happy', mood: 'grin' }]] },
    standArms: { len: 4, xf: 0.6, keys: [[0, { L: 'sideUp', R: 'sideUp', legs: 'standCar', stand: 1, lean: -0.05, nod: -0.2, eyes: 'happy', mood: 'grin' }]] },
    standWave: { len: 2, xf: 0.6, keys: [[0, { L: 'up', R: 'upBent', legs: 'standCar', stand: 1, roll: 0.1, mood: 'grin' }], [1, { L: 'upBent', R: 'up', legs: 'standCar', stand: 1, roll: -0.1, mood: 'grin' }]] }
  };

  const GROUP = [
    [0, 'groove'], [55.48, 'walk'], [56.95, 'groove'], [58.75, 'clapHigh'], [59.95, 'groove'], [62.3, 'pointUp'], [64.6, 'raise'], [65.8, 'groove'],
    [74.0, 'raise'], [75.2, 'pointUp'], [79.55, 'lunge'], [88.6, 'flex'], [90.0, 'groove'], [91.3, 'raise'], [92.9, 'groove'], [95.4, 'groove'],
    [130.85, 'wave'], [132.2, 'groove'], [133.45, 'jog'], [137.8, 'wave'], [139.8, 'lunge'], [141.2, 'pointUp'], [142.4, 'bounceLow'], [144.7, 'groove'],
    [147.0, 'whip'], [149.55, 'pump'], [151.8, 'groove'], [161.8, 'jog'], [163.55, 'pump']
  ];

  const LEAD = [
    [0, 'groove'], [55.48, 'walk'], [56.95, 'groove'], [59.4, 'walk'], [60.5, 'singOpen'], [62.3, 'pointUp'], [64.6, 'raise'], [65.8, 'groove'],
    [67.1, 'singChest'], [68.2, 'singOpen'], [74.0, 'raise'], [75.2, 'pointUp'], [79.55, 'lunge'], [81.6, 'singSway'], [83.2, 'singPoint'], [84.4, 'singOpen'],
    [88.6, 'pairHim'], [90.2, 'stepHim'], [91.3, 'raise'], [92.9, 'groove'], [93.9, 'singChest'], [95.4, 'pairHim'], [97.0, 'twirlHim'], [98.2, 'pairHim'],
    [110.7, 'soloStep'], [119.2, 'soloStep'], [130.85, 'wave'], [132.2, 'groove'], [133.45, 'jog'], [137.8, 'wave'], [139.8, 'lunge'], [141.2, 'pointUp'],
    [142.4, 'bounceLow'], [144.7, 'groove'], [147.0, 'cool'], [149.55, 'pump'], [151.8, 'pairHim'], [152.9, 'twirlHim'], [153.9, 'pairHim'], [154.3, 'soloStep'],
    [156.6, 'pairHim'], [157.4, 'stepHim'], [158.9, 'twirlHim'], [160.1, 'pairHim'], [160.9, 'hugHim'], [161.8, 'jog'], [163.55, 'pump']
  ];

  const PARTNER = [
    [0, 'groove'], [55.48, 'walk'], [56.95, 'groove'], [58.75, 'clapHigh'], [59.95, 'danceHer'], [62.3, 'pointUp'], [64.6, 'raise'], [65.8, 'groove'],
    [74.0, 'raise'], [75.2, 'pointUp'], [79.55, 'lunge'], [88.6, 'pairHer'], [90.2, 'stepHer'], [91.3, 'raise'], [92.9, 'groove'], [95.4, 'pairHer'],
    [97.0, 'twirlHer'], [98.2, 'pairHer'], [130.85, 'wave'], [132.2, 'groove'], [133.45, 'jog'], [137.8, 'wave'], [139.8, 'lunge'], [141.2, 'pointUp'],
    [142.4, 'bounceLow'], [144.7, 'groove'], [147.0, 'whip'], [149.55, 'pump'], [151.8, 'pairHer'], [152.9, 'twirlHer'], [153.9, 'pairHer'], [156.6, 'pairHer'],
    [157.4, 'stepHer'], [158.9, 'twirlHer'], [160.1, 'pairHer'], [160.9, 'hugHer'], [161.8, 'jog'], [163.55, 'pump']
  ];

  const ROAD_HIM = [[0, 'leanCar'], [10.4, 'watch'], [12.3, 'lookCam'], [13.5, 'walk'], [17.0, 'door'], [26.6, 'groove'], [34.1, 'chinHim'], [46.8, 'selfieHim'], [52.8, 'selfieHim']];
  const ROAD_HER = [[0, 'sitLaugh'], [26.6, 'danceHer'], [34.1, 'chinHer'], [46.8, 'danceHer'], [52.8, 'danceHer']];
  const GOLD_HIM = [[0, 'snapHim'], [103.5, 'relax'], [113.7, 'heartHim'], [120.8, 'relax']];
  const GOLD_HER = [[0, 'snapHer'], [103.5, 'poseHer'], [113.7, 'heartHer'], [120.8, 'photoHer']];

  const CAR_HIM = [
    [0, 'drive'], [21.9, 'doorSing'], [24.3, 'drive'], [29.0, 'driveSing'], [31.1, 'doorSing'], [37.5, 'gesture'], [39.3, 'driveSing'], [41.2, 'doorSing'],
    [43.4, 'leanBack'], [45.3, 'doorSing'], [49.5, 'doorSing'], [54.1, 'leanTo'], [69.3, 'handsUpCar'], [76.8, 'drive'], [85.6, 'driveSing'], [101.0, 'driveSing'],
    [104.5, 'gesture'], [106.9, 'doorSing'], [112.2, 'blowKiss'], [116.5, 'drive'], [122.1, 'leanBack'], [129.5, 'doorSing'], [135.3, 'leanBack']
  ];

  const CAR_HER = [
    [0, 'sitLaugh'], [21.9, 'headrest'], [24.3, 'armOut'], [29.0, 'waveCar'], [31.1, 'sitLaugh'], [37.5, 'sitLaugh'], [39.3, 'danceSeat'], [41.2, 'sitLaugh'],
    [43.4, 'headrest'], [45.3, 'danceSeat'], [49.5, 'danceSeat'], [54.1, 'leanToHer'], [69.3, 'handsUpCar'], [75.6, 'standCar'], [79.0, 'standCar'], [85.0, 'standArms'],
    [94.0, 'sitLaugh'], [101.0, 'danceSeat'], [104.5, 'sitLaugh'], [106.9, 'laughMouth'], [112.2, 'waveCar'], [115.6, 'standWave'], [121.0, 'danceSeat'], [129.5, 'armOut'],
    [135.3, 'sitLaugh']
  ];
  MOVES.relax = { len: 4, keys: [[0, { L: 'relax', R: 'relax', legs: 'restL', tilt: -0.08, mood: 'smile' }]] };

  const IK_BODY = { him: 'khSinger', her: 'khGirl' };
  const armCache = {};
  let WHEEL = null;

  function wheelSetup() {
    if (WHEEL) return WHEEL;
    const p = restPose();
    Object.assign(p, LEGS.seat);
    p.spine = [-0.18, 0, 0];
    p.ground = false;
    p.y = 0;
    const m = Cast.solve('khSinger', p);
    const local = M4.chain(M4.translate(0, 0.25, 0.4), M4.rotX(-0.25), M4.rotY(PI));
    const rim = (x) => M4.point(local, [x, 0.08, 0]);
    WHEEL = { local, lift: LEG_BASE.him - M4.point(m.hips, [0, 0, 0])[1], L: rim(-0.15), R: rim(0.15) };
    return WHEEL;
  }

  function armOf(name, side, b, body) {
    const A = ARMS[name] || ARMS.down;
    let base;
    if (A.a) base = A.a;
    else {
      const key = name + side + body;
      if (!armCache[key]) {
        const k = body === 'him' ? 1.1 : 1;
        let target;
        if (A.wheel) target = wheelSetup()[side];
        else target = [(side === 'L' ? 1 : -1) * A.ik[0] * k, A.ik[1] * k, A.ik[2] * k];
        armCache[key] = GK.ik(IK_BODY[body], side, target);
      }
      base = armCache[key];
    }
    if (!A.wig) return base;
    const w = S(2 * PI * 2 * b + (side === 'L' ? 0 : 1.3));
    return base.map((v, i) => v + A.wig[i] * w);
  }

  function keyPose(k, b, body) {
    const L = armOf(k.L || 'down', 'L', b, body), R2 = armOf(k.R || 'down', 'R', b, body);
    const lg = LEGS[k.legs || 'stand'];
    return {
      shL: [L[0], L[1], L[2]], elL: [L[3], 0, 0], shR: [R2[0], R2[1], R2[2]], elR: [R2[3], 0, 0],
      hipL: lg.hipL, knL: lg.knL, hipR: lg.hipR, knR: lg.knR,
      spine: [k.lean || 0, k.twist || 0, k.roll || 0], neck: [k.nod || 0, k.turn || 0, k.tilt || 0],
      dx: k.dx || 0, hair: k.hair || 0, stand: k.stand || 0, eyes: k.eyes || 'open', mood: k.mood || 'smile'
    };
  }

  function walkFrame(b, kind) {
    const ph = PI * b;
    const jog = kind === 'jog';
    const amp = jog ? 0.5 : 0.36;
    return {
      shL: [-0.36 * S(ph), 0, 0.12], elL: [jog ? 1.2 : 0.35, 0, 0], shR: [0.36 * S(ph), 0, 0.12], elR: [jog ? 1.2 : 0.35, 0, 0],
      hipL: [amp * S(ph), 0, 0.04], knL: [0.12 + (jog ? 0.8 : 0.55) * Math.max(0, -S(ph - 0.5)), 0, 0],
      hipR: [-amp * S(ph), 0, 0.04], knR: [0.12 + (jog ? 0.8 : 0.55) * Math.max(0, S(ph - 0.5)), 0, 0],
      spine: [jog ? 0.12 : 0.05, 0.08 * S(ph), 0], neck: [0, 0, 0], dx: 0, hair: 0.06 * S(2 * ph), stand: 0, eyes: 'open', mood: 'smile'
    };
  }

  const FIELDS = ['shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR', 'spine', 'neck'];

  function mixPose(a, b, w) {
    const o = {};
    FIELDS.forEach(f => { o[f] = mixV(a[f], b[f], w); });
    o.dx = lerp(a.dx, b.dx, w);
    o.hair = lerp(a.hair, b.hair, w);
    o.stand = lerp(a.stand, b.stand, w);
    o.eyes = w < 0.5 ? a.eyes : b.eyes;
    o.mood = w < 0.5 ? a.mood : b.mood;
    return o;
  }

  function moveAt(name, t0, t, body) {
    const M = MOVES[name];
    const b = beatAt(t);
    if (M.walk) return walkFrame(b, M.walk);
    const b0 = Math.round(beatAt(t0));
    const ph = ((b - b0) % M.len + M.len) % M.len;
    const keys = M.keys;
    if (keys.length === 1) return keyPose(keys[0][1], b, body);
    let i = 0;
    while (i + 1 < keys.length && keys[i + 1][0] <= ph) i++;
    const ka = keys[i], kb = keys[(i + 1) % keys.length];
    const end = i + 1 < keys.length ? kb[0] : M.len + keys[0][0];
    const w = 0.5 - 0.5 * C(PI * clamp((ph - ka[0]) / (end - ka[0]), 0, 1));
    return mixPose(keyPose(ka[1], b, body), keyPose(kb[1], b, body), w);
  }

  function chorIndex(list, t) {
    let i = 0;
    while (i + 1 < list.length && list[i + 1][0] <= t) i++;
    return i;
  }

  function poseOn(list, i, t, body, depth) {
    const [t0, name] = list[i];
    const cur = moveAt(name, t0, t, body);
    const xf = MOVES[name].xf || 0.4;
    if (i > 0 && t - t0 < xf && (depth || 0) < 3) return mixPose(poseOn(list, i - 1, t, body, (depth || 0) + 1), cur, smooth((t - t0) / xf));
    return cur;
  }

  function danceAt(list, t, body) {
    const i = chorIndex(list, t);
    const [t0, name] = list[i];
    const M = MOVES[name];
    let spin = 0;
    for (let j = 0; j <= i; j++) {
      const Mj = MOVES[list[j][1]];
      if (Mj.spin) spin += smooth(clamp((t - list[j][0]) / (Mj.spin * BEAT), 0, 1)) * PI * 2;
    }
    return { pose: poseOn(list, i, t, body), move: name, still: !!M.still, walk: !!M.walk, spin };
  }

  const blinkAt = (t, seed) => (frac(t / 3.3 + seed * 0.37) < 0.04 ? 1 : 0);

  function faceKind(role, t, eyes, mood) {
    const tt = Math.floor(t * 12) / 12;
    const m = mouthFor(role, tt);
    if (m > 0.05) {
      const v = voiceAt(tt);
      if (v > 0.84) return 'belt';
      if (v > 0.5) return 'sing';
      return 'say';
    }
    if (eyes === 'happy') return mood === 'grin' ? 'happy' : 'bliss';
    if (eyes === 'shut') return mood === 'bliss' ? 'bliss' : 'sleep';
    if (mood === 'kiss') return 'kiss';
    return mood || 'smile';
  }

  function body(t, list, kind, o) {
    const opts = o || {};
    const d = danceAt(list, t, kind === 'him' ? 'him' : 'her');
    const P = d.pose;
    const p = restPose();
    FIELDS.forEach(f => { p[f] = P[f].slice(); });
    const e = d.still ? 0.12 : (opts.energy === undefined ? energyAt(t) : opts.energy);
    const amp = opts.amp === undefined ? 1 : opts.amp;
    if (!d.walk && !opts.seated) {
      const bo = bob(t, opts.lag);
      p.knL[0] += 0.12 * e * bo * amp;
      p.knR[0] += 0.12 * e * bo * amp;
      p.hipL[0] += 0.06 * e * bo * amp;
      p.hipR[0] += 0.06 * e * bo * amp;
      p.spine[0] += 0.03 * e * bo;
    }
    const sw = S(PI * beatAt(t) + (opts.phase || 0));
    p.spine[2] += 0.03 * e * sw * amp;
    p.neck[2] += 0.04 * e * S(PI * beatAt(t) + 0.6 + (opts.phase || 0)) * amp;
    const ry = (opts.ry || 0) + d.spin;
    p.x = (opts.x || 0) + P.dx * C(ry);
    p.z = (opts.z || 0) - P.dx * S(ry);
    p.ry = ry;
    p.hair = P.hair + 0.05 * e * sw + (opts.wind || 0);
    p.face = opts.face || faceKind(opts.role || '', t, P.eyes, P.mood);
    p.blink = blinkAt(t, opts.seed || 0);
    p.stand = P.stand;
    return { p, move: d.move, walk: d.walk };
  }

  function actor(id, form, p, props) {
    return { id, form, look: id, pose: p, hidden: false, props: props || [] };
  }

  function solveActor(a) {
    const m = Cast.solve(a.form, a.pose);
    a.m = m;
    a.head = M4.point(m.head, [0, 0, 0]);
    a.hips = M4.point(m.hips, [0, 0, 0]);
    a.root = [a.pose.x, 0, a.pose.z];
    return a;
  }

  const LEG_BASE = { him: 0.9, her: 0.835 };

  function seatPose(p, kind, seat, carY, scale) {
    const W = wheelSetup();
    const hipY = KH.SEATS.hipY + carY;
    const sx = seat === 'driver' ? KH.SEATS.driver[0] : KH.SEATS.passenger[0];
    p.ground = false;
    const standY = 0.31 + carY;
    const sitY = hipY - LEG_BASE[kind] * (scale || 1) + W.lift;
    p.y = lerp(sitY, standY - 0.02, p.stand || 0);
    p.x = sx;
    p.z = lerp(-0.1, 0.12, p.stand || 0);
    return p;
  }

  function carHim(t, carY, list) {
    const r = body(t, list || CAR_HIM, 'him', { seated: true, role: 'singer', seed: 0.2, energy: 0.35 });
    seatPose(r.p, 'him', 'driver', carY);
    return actor('singer', 'khSinger', r.p);
  }

  function carHer(t, carY, wind, list) {
    const r = body(t, list || CAR_HER, 'her', { seated: true, role: 'girl', seed: 0.6, energy: 0.45, wind });
    seatPose(r.p, 'her', 'passenger', carY);
    if (r.p.stand > 0.01) r.p.hair += 0.25 * r.p.stand + 0.08 * S(t * 9);
    return actor('girl', 'khGirl', r.p);
  }

  const SPEED = 13;
  const carBounce = (t) => 0.006 * S(t * 11) + 0.004 * S(t * 17.3 + 1);

  function canyonCar(t) {
    const y = carBounce(t);
    return { m: M4.chain(M4.translate(0, y, 0), M4.rotZ(0.004 * S(t * 7.1))), y, moving: true, spin: (t * SPEED) / KH.CAR.wheelR, door: 0, scroll: (t * SPEED) % PERIOD };
  }

  const PERIOD = 240;

  function carStage(t) {
    const car = canyonCar(t);
    const cast = [carHim(t, car.y), carHer(t, car.y, 0.55)];
    cast.forEach(solveActor);
    return { car, cast, singer: cast[0], girl: cast[1] };
  }

  const toCar = (car, p) => M4.point(car.m, p);
  const view = (eye, at, fov, extra) => Object.assign({ eye, at, fov: fov || 32 }, extra || {});
  const drift = (a, b, u) => mixV(a, b, smooth(u));
  const near = (a, o) => addV(a.head, o);
  const path3 = (pts, u) => {
    const n = pts.length - 1;
    const f = clamp(u, 0, 1) * n;
    const i = Math.min(n - 1, Math.floor(f));
    return mixV(pts[i], pts[i + 1], smooth(f - i));
  };
  const shake = (t, k) => [k * (S(t * 3.1) + 0.5 * S(t * 7.7)), k * (S(t * 2.3 + 1) + 0.4 * S(t * 6.1)), 0];

  function carView(t, eye, at, fov, cast, car, extra) {
    return view(addV(toCar(car, eye), shake(t, 0.004)), toCar(car, at), fov, Object.assign({ cast, car, scene: 'canyon', light: 'day' }, extra || {}));
  }

  const ROAD_CAR = { x: 4.4, z: 0, ry: 0 };

  function parkedCar(door) {
    return { m: M4.chain(M4.translate(ROAD_CAR.x, 0, ROAD_CAR.z), M4.rotY(ROAD_CAR.ry)), y: 0, moving: false, spin: 0, door: door || 0, scroll: 0 };
  }

  const LEAN_SPOT = [3.36, 1.4];
  const SINGER_WALK = [[13.5, 3.36, 1.4], [14.2, 3.3, 2.5], [14.8, 3.66, 3.12], [15.4, 4.44, 3.36], [16.0, 5.22, 3.1], [16.55, 5.62, 2.38], [17.25, 5.7, 1.45]];

  function pathDirs(pts) {
    const d = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][2] - pts[i][2]);
      d.push(i > 0 ? turnTo(d[i - 1], a) : a);
    }
    d.push(d[d.length - 1]);
    return d;
  }

  function walkAlong(pts, t) {
    const dirs = pathDirs(pts);
    if (t <= pts[0][0]) return { x: pts[0][1], z: pts[0][2], dir: dirs[0] };
    let i = 0;
    while (i + 1 < pts.length && pts[i + 1][0] <= t) i++;
    const a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)];
    const k = b[0] > a[0] ? clamp((t - a[0]) / (b[0] - a[0]), 0, 1) : 1;
    return { x: lerp(a[1], b[1], k), z: lerp(a[2], b[2], k), dir: lerp(dirs[i], dirs[Math.min(i + 1, dirs.length - 1)], smooth(k)) };
  }

  function steppeHim(t, place) {
    const r = body(t, ROAD_HIM, 'him', { role: 'singer', seed: 0.2, x: place.x, z: place.z, ry: place.ry });
    return actor('singer', 'khSinger', r.p, place.props);
  }

  function steppeHer(t, place) {
    const r = body(t, ROAD_HER, 'her', { role: 'girl', seed: 0.6, x: place.x, z: place.z, ry: place.ry, phase: 0.7 });
    return actor('girl', 'khGirl', r.p);
  }

  function turnTo(from, to) {
    let d = to - from;
    while (d > PI) d -= 2 * PI;
    while (d < -PI) d += 2 * PI;
    return from + d;
  }

  function leanCarStage(t) {
    const car = parkedCar(smooth(span(t, 17.35, 17.95)) * 1.0);
    let him;
    if (t < 13.5) {
      him = steppeHim(t, { x: LEAN_SPOT[0], z: LEAN_SPOT[1], ry: -PI / 2 });
    } else if (t < 17.25) {
      const w = walkAlong(SINGER_WALK, t);
      const ry = lerp(-PI / 2, w.dir, smooth(span(t, 13.5, 14.0)));
      const r = body(t, ROAD_HIM, 'him', { role: 'singer', seed: 0.2, x: w.x, z: w.z, ry });
      him = actor('singer', 'khSinger', r.p);
    } else {
      const last = walkAlong(SINGER_WALK, 17.25).dir;
      const ry = lerp(last, turnTo(last, -PI / 2), smooth(span(t, 17.25, 17.75)));
      him = steppeHim(t, { x: 5.68 + 0.12 * smooth(span(t, 17.6, 18.2)), z: 1.45 - 0.55 * smooth(span(t, 17.4, 18.2)), ry });
    }
    const her = actor('girl', 'khGirl', seatPose(body(t, ROAD_HER, 'her', { seated: true, role: 'girl', seed: 0.6, energy: 0.2 }).p, 'her', 'passenger', 0));
    const hp = M4.point(car.m, [her.pose.x, 0, her.pose.z]);
    her.pose.x = hp[0];
    her.pose.z = hp[2];
    her.pose.ry = ROAD_CAR.ry;
    const cast = [him, her];
    cast.forEach(solveActor);
    return { car, cast, singer: him, girl: her };
  }

  function steppeView(eye, at, fov, cast, car, extra) {
    return view(eye, at, fov, Object.assign({ cast, car, scene: 'steppe', light: 'day' }, extra || {}));
  }

  const SLOTS = [];
  for (let i = 0; i < 12; i++) SLOTS.push({ x: (i - 5.5) * 1.12, z: -0.012 * Math.pow((i - 5.5) * 1.12, 2) });
  const SLOT_OF = { girl: 5, singer: 6 };
  const DANCER_SLOT = [0, 1, 2, 3, 4, 7, 8, 9, 10, 11];
  const DELAY = DANCER_SLOT.map((s, i) => 0.012 + hash(i, 3) * 0.045);

  function fieldCast(t, o) {
    const opts = o || {};
    const place = opts.place || ((who, i) => ({ x: SLOTS[i].x, z: SLOTS[i].z, ry: 0 }));
    const cast = [];
    if (opts.dancers !== false) {
      KH.DANCER_IDS.forEach((form, i) => {
        const slot = DANCER_SLOT[i];
        const pl = place('dancer', slot, i);
        if (!pl) return;
        const tt = t - DELAY[i];
        const r = body(tt, pl.list || GROUP, 'her', { role: 'dancer', seed: hash(i, 7), x: pl.x, z: pl.z, ry: pl.ry, phase: hash(i, 9) * 2, amp: 0.85 + 0.3 * hash(i, 5), lag: 0.04 + 0.05 * hash(i, 11) });
        cast.push(actor('d' + i, form, r.p));
      });
    }
    if (opts.girl !== false) {
      const pl = place('girl', SLOT_OF.girl);
      if (pl) {
        const r = body(t, pl.list || PARTNER, 'her', { role: 'girl', seed: 0.6, x: pl.x, z: pl.z, ry: pl.ry, phase: 0.7 });
        cast.push(actor('girl', 'khGirl', r.p, pl.props));
      }
    }
    if (opts.singer !== false) {
      const pl = place('singer', SLOT_OF.singer);
      if (pl) {
        const r = body(t, pl.list || LEAD, 'him', { role: 'singer', seed: 0.2, x: pl.x, z: pl.z, ry: pl.ry });
        cast.push(actor('singer', 'khSinger', r.p, pl.props));
      }
    }
    cast.forEach(solveActor);
    return cast;
  }

  const byId = (cast, id) => cast.find(a => a.id === id);

  function fieldView(eye, at, fov, cast, extra) {
    return view(eye, at, fov, Object.assign({ cast, scene: 'field', light: 'field' }, extra || {}));
  }

  function walkInPlace(who, slot, i) {
    return (t) => {
      const sx = SLOTS[slot].x * 0.8 + (hash(slot, 4) - 0.5) * 0.6;
      const row = slot % 3;
      const z0 = 1.2 - row * 1.1 + (hash(slot, 6) - 0.5) * 0.5;
      const away = 1.05 * clamp(t - 55.48, 0, 1.47);
      const back = 0.22 * clamp(t - 57.6, 0, 4.8);
      let z = z0 - away + back;
      let x = sx;
      let ry = PI;
      if (t > 56.95) ry = PI + PI * smooth(span(t, 56.95, 57.6));
      if (who === 'singer') {
        x = lerp(sx, 0.35, smooth(span(t, 59.4, 60.5)));
        z += 1.4 * smooth(span(t, 59.4, 60.5));
      }
      if (who === 'girl') {
        x = lerp(sx, -0.45, smooth(span(t, 59.0, 60.3)));
        z += 0.9 * smooth(span(t, 59.0, 60.3));
      }
      return { x, z, ry };
    };
  }

  function coupleCast(t, cx, cz, gap, o) {
    const opts = o || {};
    const g = gap || 0.92;
    const cast = fieldCast(t, {
      dancers: false,
      place: (who) => (who === 'singer' ? { x: cx + g / 2, z: cz, ry: -PI / 2, list: opts.him } : { x: cx - g / 2, z: cz, ry: PI / 2, list: opts.her })
    });
    return cast;
  }

  function sunsetView(eye, at, fov, cast, extra) {
    return view(eye, at, fov, Object.assign({ cast, scene: 'field', light: 'sunset', silhouette: true }, extra || {}));
  }

  function goldenCast(t, cx, cz, apart) {
    const hold = [];
    const cast = fieldCast(t, {
      dancers: false,
      place: (who) => (who === 'singer' ? { x: cx + 0.28 + (apart || 0), z: cz - 0.05, ry: -0.25, list: GOLD_HIM } : { x: cx - 0.24, z: cz, ry: 0.3, list: GOLD_HER, props: hold })
    });
    const her = byId(cast, 'girl');
    if (t < 103.5 || t >= 120.8) her.props.push({ id: 'khInstant', part: t >= 120.8 ? 'foreL' : 'foreR', at: t >= 120.8 ? [-0.06, -0.27, 0.07] : [0, -0.28, 0.06], rot: t >= 120.8 ? [-1.3, 0.3, 0] : [-1.5, 0, 0] });
    return cast;
  }

  const AIR_SPEED = 16;
  const AIR_START = { air1: -330, air2: 120, air3: 480 };

  function roadX(z) {
    return 140 * S(z / 230) + 45 * S(z / 97 + 1.3);
  }

  function baseH(x, z) {
    return 26 * S(x / 170 + 0.4) * C(z / 210) + 15 * S((x + z) / 95) + 8 * S(x / 41 - z / 63) + 0.004 * (x * x) * 0.02;
  }

  function roadH(z) {
    return 6 * S(z / 260) + 3 * S(z / 90);
  }

  function terrainH(x, z) {
    const d = x - roadX(z);
    const v = Math.exp(-(d * d) / (2 * 34 * 34));
    return lerp(baseH(x, z), roadH(z), v);
  }

  function roadPoint(s) {
    const x = roadX(s);
    return [x, roadH(s) + 0.9, s];
  }

  function airCar(t, sh) {
    const s = AIR_START[sh.cam] + AIR_SPEED * (t - sh.start);
    const p = roadPoint(s), q = roadPoint(s + 2);
    const ry = Math.atan2(q[0] - p[0], q[2] - p[2]);
    return { s, pos: p, m: M4.chain(M4.translate(p[0], p[1] - 0.6, p[2]), M4.rotY(ry)), y: 0, moving: true, spin: (t * AIR_SPEED) / KH.CAR.wheelR, door: 0, scroll: 0, ry };
  }

  function airView(t, sh, eyeOff, atOff, fov) {
    const car = airCar(t, sh);
    const p = car.pos;
    return view(addV(p, eyeOff), addV(p, atOff), fov, { cast: [], car, scene: 'air', light: 'air' });
  }

  const WORLDS = {
    name(t, u) {
      return view([0, 0.25, lerp(10.4, 9.2, smooth(u))], [0, 0.35, 0], 30, { cast: [], scene: 'ident', ident: 'name' });
    },
    ident(t, u) {
      return view([0, 0.2, 7.2], [0, 0.25, 0], 30, { cast: [], scene: 'ident', ident: 'ident' });
    },
    leanCar(t, u) {
      const s = leanCarStage(t);
      const k = smooth(span(t, 13.6, 16.3));
      const eye = path3([[2.3, 1.42, -2.2], [2.12, 1.46, -1.7], [0.75, 1.5, 0.9], [3.1, 1.38, 7.2]], span(t, 8.84, 16.3));
      const at = mixV(near(s.singer, [0, -0.1, 0]), [4.7, 1.05, 0.6], smooth(span(t, 15.6, 16.6)));
      return steppeView(addV(eye, shake(t, 0.004)), at, lerp(30, 38, k), s.cast, s.car, { title: titleAt(t) });
    },
    hood1(t, u) {
      const s = carStage(t);
      return carView(t, [0.05, 1.05, 2.05], [0.0, 1.0, 0.0], 44, s.cast, s.car);
    },
    side1(t, u) {
      const s = carStage(t);
      return carView(t, [1.25, 1.26, 0.45], [-0.4, 1.06, -0.45], 40, s.cast, s.car);
    },
    rear1(t, u) {
      const s = carStage(t);
      return carView(t, [0.0, 1.38, -1.05], [0.0, 1.0, 6.0], 46, s.cast, s.car);
    },
    danceCar(t, u) {
      const car = parkedCar(0);
      const cast = [steppeHim(t, { x: 1.9, z: 0.5, ry: -0.2 }), steppeHer(t, { x: 2.75, z: 0.85, ry: -0.3 })];
      cast.forEach(solveActor);
      return steppeView([-1.4, 1.45, 15.5], [3.1, 0.95, 0.7], 22, cast, car);
    },
    hood2(t, u) {
      const s = carStage(t);
      return carView(t, [-0.05, 1.08, 2.1], [0.0, 1.02, 0.0], 44, s.cast, s.car);
    },
    side2(t, u) {
      const s = carStage(t);
      return carView(t, [1.22, 1.24, 0.5], [-0.38, 1.08, -0.42], 38, s.cast, s.car);
    },
    chin(t, u) {
      const car = parkedCar(0);
      const her = steppeHer(t, { x: 2.99, z: -0.19, ry: -PI / 4 });
      const him = steppeHim(t, { x: 2.55, z: 0.25, ry: PI * 0.75 });
      const cast = [him, her];
      cast.forEach(solveActor);
      const eye = [2.37, him.head[1] - 0.04, 1.06];
      return steppeView(drift(eye, addV(eye, [0.05, 0, -0.06]), u), addV(her.head, [-0.08, -0.06, 0]), 32, cast, car);
    },
    hood3(t, u) {
      const s = carStage(t);
      return carView(t, [0.0, 1.06, 2.05], [0.0, 1.0, 0.0], 44, s.cast, s.car, { sign: true });
    },
    hood4(t, u) {
      const s = carStage(t);
      return carView(t, [0.1, 1.04, 2.0], [0.0, 1.02, 0.0], 42, s.cast, s.car);
    },
    side3(t, u) {
      const s = carStage(t);
      return carView(t, [1.24, 1.25, 0.42], [-0.42, 1.06, -0.48], 38, s.cast, s.car);
    },
    side4(t, u) {
      const s = carStage(t);
      return carView(t, [1.15, 1.22, 0.32], [-0.36, 1.04, -0.4], 34, s.cast, s.car);
    },
    side5(t, u) {
      const s = carStage(t);
      return carView(t, [1.26, 1.26, 0.48], [-0.38, 1.06, -0.46], 38, s.cast, s.car);
    },
    selfie(t, u) {
      const car = parkedCar(0);
      const him = steppeHim(t, { x: 2.3, z: 1.2, ry: -0.5, props: [{ id: 'khPhone', part: 'foreR', at: [0.0, -0.33, 0.05], rot: [-1.2, 0, 0] }] });
      const cast = [him];
      cast.forEach(solveActor);
      return steppeView(drift([-1.9, 1.05, 5.2], [-1.7, 1.08, 5.0], u), [2.9, 1.3, 0.6], 30, cast, car);
    },
    side6(t, u) {
      const s = carStage(t);
      return carView(t, [1.25, 1.27, 0.46], [-0.4, 1.05, -0.46], 38, s.cast, s.car);
    },
    selfieClose(t, u) {
      const car = parkedCar(0);
      const him = steppeHim(t, { x: 2.3, z: 1.2, ry: -0.5, props: [{ id: 'khPhone', part: 'foreR', at: [0.0, -0.33, 0.05], rot: [-1.2, 0, 0] }] });
      const her = steppeHer(t, { x: 2.75, z: 0.25, ry: -0.6 });
      const cast = [him, her];
      cast.forEach(solveActor);
      return steppeView(drift(near(him, [-0.95, -0.12, 0.9]), near(him, [-0.85, -0.1, 0.85]), u), near(him, [0.1, 0.05, -0.2]), 34, cast, car);
    },
    flowers(t, u) {
      const s = carStage(t);
      return carView(t, [0.04, 1.4, -1.22], [0.0, 1.26, 0.2], 40, s.cast, s.car);
    },
    walkIn(t, u) {
      const cast = fieldCast(t, { place: (who, slot) => walkInPlace(who, slot)(t) });
      const singer = byId(cast, 'singer');
      const k = span(t, 55.48, 60.5);
      const eye = path3([[0.3, 1.0, 6.8], [0.2, 1.05, 5.4], [0.3, 1.25, 4.4], [0.45, 1.4, 3.6]], k);
      const at = mixV([0, 1.1, -3], near(singer, [0, -0.1, 0]), smooth(span(t, 59.2, 60.6)));
      const close = smooth(span(t, 60.5, 61.0));
      return fieldView(addV(mixV(eye, near(singer, [0.12, -0.04, 1.05]), close), shake(t, 0.01)), at, lerp(42, 36, close), cast, { light: 'back', bloom: true });
    },
    line1(t, u) {
      const cast = fieldCast(t);
      return fieldView(drift([0.6, 1.05, 13.5], [0.4, 0.95, 11.6], u), [0, 1.0, 0], 30, cast);
    },
    soloSun1(t, u) {
      const cast = fieldCast(t, { dancers: false, girl: false, place: () => ({ x: 0, z: 0, ry: 0 }) });
      const s = cast[0];
      return fieldView(drift(near(s, [0.35, -0.75, 1.6]), near(s, [0.2, -0.7, 1.4]), u), near(s, [0, -0.25, 0]), 36, cast, { light: 'back', bloom: true, sun: [0.5, 0.18] });
    },
    handsUp(t, u) {
      const s = carStage(t);
      return carView(t, [0.0, 1.42, -1.1], [0.0, 1.15, 6.0], 46, s.cast, s.car);
    },
    air1(t, u, sh) {
      return airView(t, sh, [-72, 52, -58], [12, -4, 34], 36);
    },
    line2(t, u) {
      const cast = fieldCast(t);
      return fieldView(drift([-0.4, 1.0, 12.6], [-0.3, 1.0, 11.8], u), [0, 1.05, 0], 30, cast);
    },
    standUp1(t, u) {
      const s = carStage(t);
      return carView(t, [0.0, 1.12, 2.1], [0.0, 1.25, 0.0], 46, s.cast, s.car);
    },
    line3(t, u) {
      const cast = fieldCast(t);
      return fieldView([0.5, 1.6, 19], [0, 0.9, 0], 28, cast);
    },
    soloSun2(t, u) {
      const cast = fieldCast(t, { dancers: false, girl: false, place: () => ({ x: 0, z: 0, ry: 0.15 }) });
      const s = cast[0];
      const k = smooth(u);
      return fieldView(addV(mixV([2.6, 1.0, 3.6], [0.6, 1.1, 2.0], k), [0, 0, 0]), near(s, [0, -0.45, 0]), lerp(34, 32, k), cast, { light: 'back', bloom: true, sun: [-0.4, 0.14] });
    },
    standUp2(t, u) {
      const s = carStage(t);
      return carView(t, [0.0, 1.14, 2.15], [0.0, 1.3, 0.0], 46, s.cast, s.car);
    },
    dolly(t, u) {
      const cast = fieldCast(t, { place: (who, slot) => (who === 'singer' ? { x: 0.45, z: 1.6, ry: -PI / 2 } : who === 'girl' ? { x: -0.45, z: 1.6, ry: PI / 2 } : { x: SLOTS[slot].x, z: SLOTS[slot].z - 0.8, ry: 0 }) });
      return fieldView(path3([[0.1, 1.3, 4.6], [0.2, 1.35, 8.5], [0.3, 1.4, 13.5]], u), drift([0, 1.25, 1.6], [0, 1.0, 0.0], u), 32, cast);
    },
    soloClose(t, u) {
      const cast = fieldCast(t, { dancers: false, girl: false, place: () => ({ x: 0, z: 0, ry: -0.1 }) });
      const s = cast[0];
      return fieldView(drift(near(s, [-0.25, -0.05, 0.85]), near(s, [-0.15, -0.04, 0.95]), u), near(s, [0, -0.06, 0]), 34, cast, { light: 'back', bloom: true, sun: [0.35, 0.2] });
    },
    frame(t, u) {
      const holders = { 0: { x: -0.8, z: 2.45, ry: PI / 2 }, 9: { x: 0.8, z: 2.45, ry: -PI / 2 } };
      const cast = fieldCast(t, {
        place: (who, slot, i) => {
          if (who === 'singer') return { x: 0.45, z: -13.5, ry: -PI / 2 };
          if (who === 'girl') return { x: -0.45, z: -13.5, ry: PI / 2 };
          if (holders[i]) return Object.assign({ list: [[0, 'frameHold']] }, holders[i]);
          return null;
        }
      });
      return fieldView([0.02, 1.3, 4.4], [0, 1.2, -6], 30, cast, { frame: { pos: [0, 1.22, 2.45] }, light: 'back', bloom: true });
    },
    selfieCam(t, u) {
      const cast = goldenCast(t, 0, 0);
      const her = byId(cast, 'girl');
      return fieldView(drift(near(her, [0.3, -0.12, 1.3]), near(her, [0.28, -0.1, 1.2]), u), near(her, [0.25, -0.12, 0]), 32, cast, { light: 'golden', bloom: true });
    },
    hood5(t, u) {
      const s = carStage(t);
      return carView(t, [-0.06, 1.06, 2.05], [0.0, 1.0, 0.0], 44, s.cast, s.car);
    },
    pose(t, u) {
      const cast = goldenCast(t, 0, 0, 0.32);
      const her = byId(cast, 'girl');
      return fieldView(drift(near(her, [0.1, -0.35, 1.5]), near(her, [0.05, -0.32, 1.42]), u), near(her, [0.05, -0.3, 0]), 34, cast, { light: 'golden', bloom: true });
    },
    side7(t, u) {
      const s = carStage(t);
      return carView(t, [1.24, 1.24, 0.44], [-0.4, 1.05, -0.46], 38, s.cast, s.car);
    },
    side8(t, u) {
      const s = carStage(t);
      return carView(t, [1.12, 1.22, 0.3], [-0.34, 1.1, -0.34], 32, s.cast, s.car);
    },
    air2(t, u, sh) {
      return airView(t, sh, [-34, 32, 86], [0, -3, -22], 34);
    },
    soloFar(t, u) {
      const cast = fieldCast(t, { dancers: false, girl: false, place: () => ({ x: 0, z: 0, ry: 0.1 }) });
      return fieldView([0.4, 1.4, 26], [0, 1.6, 0], 30, cast, { light: 'back', bloom: true, sun: [0.6, 0.2] });
    },
    side9(t, u) {
      const s = carStage(t);
      return carView(t, [1.24, 1.25, 0.43], [-0.42, 1.06, -0.47], 38, s.cast, s.car);
    },
    heart(t, u) {
      const cast = goldenCast(t, 0, 0);
      const him = byId(cast, 'singer');
      return fieldView(drift(near(him, [-0.7, -0.25, 1.9]), near(him, [-0.6, -0.22, 1.75]), u), near(him, [-0.25, -0.1, 0]), 34, cast, { light: 'golden', bloom: true });
    },
    standUp3(t, u) {
      const s = carStage(t);
      return carView(t, [0.05, 1.12, 2.1], [0.0, 1.28, 0.0], 46, s.cast, s.car);
    },
    soloSil(t, u) {
      const cast = fieldCast(t, { dancers: false, girl: false, place: () => ({ x: 0, z: 0, ry: 0 }) });
      return fieldView(drift([0.6, 0.6, 15], [0.4, 0.6, 14.4], u), [0, 1.5, 0], 30, cast, { light: 'back', bloom: true, sun: [0.02, 0.06] });
    },
    photo(t, u) {
      const cast = goldenCast(t, 0, 0);
      const her = byId(cast, 'girl');
      return fieldView(drift(near(her, [0.12, -0.12, 1.15]), near(her, [0.1, -0.1, 1.05]), u), near(her, [0.06, -0.12, 0]), 32, cast, { light: 'golden', bloom: true });
    },
    lean1(t, u) {
      const s = carStage(t);
      return carView(t, [1.12, 1.12, -0.92], [0.34, 1.36, -0.08], 40, s.cast, s.car);
    },
    hands(t, u) {
      return fieldView([0.0, 0.6, 0.82], [0, 0.5, 0], 30, [], { light: 'golden', bloom: true, hands: true });
    },
    side10(t, u) {
      const s = carStage(t);
      return carView(t, [1.25, 1.26, 0.45], [-0.42, 1.05, -0.48], 38, s.cast, s.car);
    },
    low1(t, u) {
      const cast = fieldCast(t);
      return fieldView(drift([0.6, 0.35, 9.5], [0.2, 0.35, 9.0], u), [0, 1.35, 0], 32, cast);
    },
    run(t, u) {
      const cast = fieldCast(t, { place: (who, slot) => ({ x: SLOTS[slot].x + 3.2 - 1.6 * (t - 133.52), z: SLOTS[slot].z, ry: -PI / 2 }) });
      return sunsetView([0, 0.55, 15], [0, 1.3, 0], 26, cast);
    },
    lean2(t, u) {
      const s = carStage(t);
      return carView(t, [1.1, 1.14, -0.95], [0.34, 1.36, -0.1], 36, s.cast, s.car);
    },
    wave(t, u) {
      const cast = fieldCast(t);
      return sunsetView([0.3, 0.55, 14.5], [0, 1.3, 0], 26, cast);
    },
    low2(t, u) {
      const cast = fieldCast(t);
      return fieldView(drift([-0.5, 0.35, 9.2], [-0.2, 0.35, 8.8], u), [0, 1.4, 0], 32, cast);
    },
    bounce(t, u) {
      const cast = fieldCast(t);
      return sunsetView([-0.4, 0.5, 14.5], [0, 1.2, 0], 26, cast);
    },
    backlit(t, u) {
      const cast = fieldCast(t, { place: (who, slot) => ({ x: SLOTS[slot].x * 0.9, z: SLOTS[slot].z - (slot % 2) * 0.9, ry: 0 }) });
      return fieldView(drift([0.5, 0.4, 15.5], [0.3, 0.4, 15.0], u), [0, 1.5, 0], 30, cast, { light: 'back', bloom: true, sun: [0.05, 0.1] });
    },
    whip(t, u) {
      const cast = fieldCast(t);
      return fieldView(drift([0.6, 0.45, 6.5], [0.4, 0.45, 6.2], u), [0.3, 1.25, 0], 30, cast);
    },
    pump(t, u) {
      const cast = fieldCast(t);
      return sunsetView([0.2, 0.55, 15], [0, 1.35, 0], 26, cast);
    },
    couple1(t, u) {
      const cast = coupleCast(t, 0, 0);
      return sunsetView(drift([0.4, 0.45, 7.6], [0.2, 0.45, 7.3], u), [0, 1.15, 0], 28, cast);
    },
    soloDance(t, u) {
      const cast = fieldCast(t, { dancers: false, girl: false, place: () => ({ x: 0, z: 0, ry: 0 }) });
      return fieldView(drift([1.5, 0.9, 7.2], [1.2, 0.9, 6.8], u), [0, 1.1, 0], 32, cast, { light: 'back', bloom: true, sun: [0.3, 0.12] });
    },
    couple2(t, u) {
      const cast = coupleCast(t, 0, 0);
      return sunsetView(drift([0.2, 0.45, 8.0], [0.0, 0.45, 7.6], u), [0, 1.15, 0], 28, cast);
    },
    finale(t, u) {
      const k = smooth(span(t, 161.88, 163.55));
      const cast = fieldCast(t, { place: (who, slot) => ({ x: SLOTS[slot].x + 2.2 - 2.2 * k, z: SLOTS[slot].z, ry: lerp(-PI / 2, 0, smooth(span(t, 163.2, 163.8))) }) });
      return sunsetView([0, 0.55, 15.5], [0, 1.3, 0], 26, cast);
    },
    air3(t, u, sh) {
      return airView(t, sh, [26, 110, -22], [0, -6, 14], 34);
    }
  };

  MOVES.frameHold = { len: 4, still: true, keys: [[0, { L: 'frameTop', R: 'frameLow', legs: 'restL', nod: 0.05, mood: 'smile' }]] };

  function cam(w) {
    return { eye: w.eye, at: w.at, fov: w.fov, up: w.upv || [0, 1, 0], near: 0.05, far: 400 };
  }

  function stage(t, shot) {
    const sh = shot || shotAt(t);
    const u = span(t, sh.start, sh.end);
    const w = WORLDS[sh.cam](t, u, sh);
    const cast = w.cast || [];
    const focus = {};
    cast.forEach(a => { focus[a.id] = { head: a.head, hips: a.hips }; });
    return Object.assign({ light: 'day', title: 0 }, w, { scene: w.scene || sh.scene, cast, camera: cam(w), focus, shot: sh, beat: beatAt(t) });
  }

  const ROAD_W = 3.6;

  function quadsZ(b, x0, x1, z0, z1, y0, y1, col, n, uvk) {
    for (let i = 0; i < n; i++) {
      const za = lerp(z0, z1, i / n), zb = lerp(z0, z1, (i + 1) / n);
      const uv = uvk ? [[x0 * uvk, za * uvk], [x1 * uvk, za * uvk], [x1 * uvk, zb * uvk], [x0 * uvk, zb * uvk]] : null;
      b.quad([x0, y0, za], [x1, y1, za], [x1, y1, zb], [x0, y0, zb], col, uv, NY);
    }
  }

  function canyonH(x, z) {
    const s = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const w = (k, ph) => S((2 * PI * k * z) / PERIOD + ph + (s > 0 ? 1.7 : 0));
    const ridge = 30 + 16 * w(1, 0.3) + 10 * w(3, 1.1) + 7 * w(5, 2.0) + 4 * w(11, 0.7);
    const t = clamp((ax - 5.6) / 26, 0, 1);
    const rough = 1.8 * S(z * 0.73 + ax * 0.51) * S(z * 0.29 - ax * 0.83) * t;
    return ridge * Math.pow(t, 1.15 + 0.35 * w(2, 0.5)) + rough + 2.5 * t * w(7, 0.2);
  }

  function canyonColor(x, z, h) {
    const s = x < 0 ? 1 : 2;
    const n = frac(S(x * 0.71 + z * 1.37 + s * 5.1) * 43758.5453);
    const strata = frac(S(Math.floor(h / 3.5) * 7.3 + s * 2.2 + Math.floor(z / 30)) * 1234.5);
    const rock = clamp((h - 2.5) / 9, 0, 1) * (s === 2 ? 1 : 0.75);
    const grass = [0.44 + 0.1 * n, 0.47 + 0.08 * n, 0.25 + 0.05 * n];
    const dry = [0.64 + 0.06 * n, 0.57 + 0.05 * n, 0.4];
    const red = [0.58 + 0.14 * strata, 0.3 + 0.07 * strata, 0.2 + 0.04 * n];
    const dark = [0.34 + 0.06 * n, 0.2, 0.15];
    const low = mixV(grass, dry, clamp(n * 1.4 - 0.4, 0, 1));
    const high = mixV(red, dark, strata > 0.78 ? 0.7 : n > 0.85 ? 0.5 : 0);
    const c = mixV(low, high, rock * (0.7 + 0.3 * n));
    return [c[0], c[1], c[2], 0];
  }

  function buildCanyon(b) {
    const half = PERIOD / 2;
    const n = 60;
    quadsZ(b, -ROAD_W, ROAD_W, -half, half, 0, 0, 0x55565b, n);
    for (let k = 0; k < PERIOD / 9; k++) {
      const z = -half + k * 9;
      b.quad([-0.07, 0.006, z], [0.07, 0.006, z], [0.07, 0.006, z + 3], [-0.07, 0.006, z + 3], 0xeeeeea, null, NY);
    }
    [-1, 1].forEach(s => {
      quadsZ(b, s * ROAD_W, s * 5.6, -half, half, 0.0, 0.05, 0xa89878, n);
      b.quad([s * 3.3, 0.006, -half], [s * 3.42, 0.006, -half], [s * 3.42, 0.006, half], [s * 3.3, 0.006, half], 0xe6e6e0, null, NY);
    });
    const xs = [5.6, 6.6, 8, 9.8, 12, 14.6, 18, 22, 27, 33, 41, 52, 68, 95, 140];
    [-1, 1].forEach(s => {
      for (let j = 0; j < n; j++) {
        const za = -half + (PERIOD * j) / n, zb = -half + (PERIOD * (j + 1)) / n;
        for (let i = 0; i + 1 < xs.length; i++) {
          const xa = s * xs[i], xb = s * xs[i + 1];
          const p = [[xa, canyonH(xa, za), za], [xb, canyonH(xb, za), za], [xb, canyonH(xb, zb), zb], [xa, canyonH(xa, zb), zb]];
          const nn = V3.norm(V3.cross(V3.sub(p[2], p[0]), V3.sub(p[1], p[0])));
          const nrm = nn[1] < 0 ? V3.mul(nn, -1) : nn;
          b.quad(p[0], p[1], p[2], p[3], p.map(q => canyonColor(q[0], q[2], q[1])), null, [nrm, nrm, nrm, nrm]);
        }
      }
    });
    for (let k = 0; k < 12; k++) {
      const s = k % 2 ? 1 : -1;
      const z = -half + k * (PERIOD / 12) + 6 * hash(k, 2);
      const x = s * (6.5 + 3 * hash(k, 4));
      const y = canyonH(x, z);
      const hgt = 4.5 + 2 * hash(k, 6);
      b.at(x, y, z, (h) => {
        h.prism(6, 0.14, 0.14, 0, 0.1, 0.1, hgt * 0.5, 0x5a4a3a);
        h.at(0, hgt * 0.62, 0, (c) => c.ellipsoid(1.4, hgt * 0.38, 1.4, 8, 5, [0.46, 0.62, 0.3, 0]));
        h.at(0.4, hgt * 0.8, 0.3, (c) => c.ellipsoid(0.9, hgt * 0.24, 0.9, 7, 4, [0.56, 0.7, 0.36, 0]));
      });
    }
    for (let k = 0; k < PERIOD / 24; k++) {
      [-1, 1].forEach(s => {
        const z = -half + k * 24 + (s > 0 ? 12 : 0);
        b.at(s * 4.4, 0, z, (h) => {
          h.box(0.12, 1.0, 0.12, 0xf2f2ee, { base: true });
          h.at(0, 0.8, 0.0, (c) => c.box(0.125, 0.14, 0.125, 0xd02a2a));
        });
      });
    }
    for (let k = 0; k < PERIOD / 40; k++) {
      const z = -half + k * 40 + 20;
      b.at(-6.2, canyonH(-6.2, z), z, (h) => {
        h.prism(6, 0.09, 0.09, 0, 0.08, 0.08, 7.5, 0x6a5440);
        h.at(0, 7.0, 0, (c) => c.box(1.4, 0.08, 0.08, 0x5a4636));
      });
    }
  }

  function chevronSign(b) {
    b.box(0.07, 1.2, 0.07, 0x9a9a9a, { base: true });
    b.at(0, 1.42, 0.04, (h) => h.box(0.75, 0.5, 0.03, 0xf2c41a));
  }

  function texChevron(ctx, w, h) {
    ctx.fillStyle = '#f2c41a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#16161a';
    for (let i = 0; i < 3; i++) {
      const x = w * (0.18 + i * 0.26);
      ctx.beginPath();
      ctx.moveTo(x, h * 0.12);
      ctx.lineTo(x + w * 0.16, h * 0.5);
      ctx.lineTo(x, h * 0.88);
      ctx.lineTo(x + w * 0.08, h * 0.88);
      ctx.lineTo(x + w * 0.24, h * 0.5);
      ctx.lineTo(x + w * 0.08, h * 0.12);
      ctx.closePath();
      ctx.fill();
    }
  }

  function buildSteppe(b) {
    quadsZ(b, -ROAD_W, ROAD_W, -200, 200, 0, 0, 0x8c8c8c, 50);
    [-1, 1].forEach(s => {
      quadsZ(b, s * ROAD_W, s * 3.75, -200, 200, 0.0, -0.03, 0x9a9890, 50);
      b.quad([s * 3.2, 0.005, -200], [s * 3.3, 0.005, -200], [s * 3.3, 0.005, 200], [s * 3.2, 0.005, 200], 0xd8d8d0, null, NY);
    });
    for (let k = 0; k < 60; k++) {
      const z = -150 + k * 5 + hash(k, 1) * 3;
      const x = (k % 2 ? 1 : -1) * (5 + hash(k, 2) * 30);
      b.at(x, 0, z, (h) => h.ellipsoid(0.4 + 0.5 * hash(k, 3), 0.22 + 0.2 * hash(k, 4), 0.4 + 0.4 * hash(k, 5), 6, 3, [0.5 + 0.1 * hash(k, 6), 0.52, 0.34, 0]));
    }
    for (let k = 0; k < 9; k++) {
      const z = -160 + k * 40;
      b.at(-9, 0, z, (h) => {
        h.prism(6, 0.1, 0.1, 0, 0.08, 0.08, 7.2, 0x6a5a48);
        h.at(0, 6.8, 0, (c) => c.box(1.2, 0.08, 0.08, 0x5a4a3a));
      });
    }
  }

  function groundTiles(b, half, step, y) {
    for (let x = -half; x < half; x += step) {
      for (let z = -half; z < half; z += step) {
        b.quad([x, y, z + step], [x + step, y, z + step], [x + step, y, z], [x, y, z], [1, 1, 1, 0], [[x / 4, (z + step) / 4], [(x + step) / 4, (z + step) / 4], [(x + step) / 4, z / 4], [x / 4, z / 4]], NY);
      }
    }
  }

  function flowerClumps(b, seed) {
    let s = seed;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 900; i++) {
      const x = (rnd() - 0.5) * 34;
      const z = -9 + rnd() * 28;
      const hgt = 0.18 + rnd() * 0.22;
      const w = 0.18 + rnd() * 0.14;
      const a = rnd() * PI;
      const v = Math.floor(rnd() * 4) * 0.25;
      [a, a + PI / 2].forEach(ang => {
        const dx = C(ang) * w, dz = S(ang) * w;
        b.quad([x - dx, 0, z - dz], [x + dx, 0, z + dz], [x + dx, hgt, z + dz], [x - dx, hgt, z - dz], [1, 1, 1, 0], [[v, 0], [v + 0.25, 0], [v + 0.25, 1], [v, 1]], [[0, 0.6, 1], [0, 0.6, 1], [0, 0.6, 1], [0, 0.6, 1]]);
      });
    }
  }

  function mountainRing(b, seed) {
    const n = 160;
    const dist = (i) => 760 + 160 * (0.5 + 0.5 * S((i / n) * PI * 14 + seed));
    const height = (i) => {
      const a = (i / n) * PI * 2;
      const back = Math.max(0, -C(a));
      const ridge = 0.55 + 0.3 * S(a * 5 + seed) * S(a * 3.3 + 1.2) + 0.15 * S(a * 17 + seed * 2) + 0.12 * (hash(i % n, seed) - 0.5);
      return (30 + 72 * back) * (0.6 + 0.6 * ridge);
    };
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const d0 = dist(i), d1 = dist(i + 1);
      const h0 = height(i), h1 = height(i + 1);
      const p = (a, d, y) => [S(a) * d, y, C(a) * d];
      const top = [0.46, 0.52, 0.62, 0], mid = [0.4, 0.46, 0.5, 0], low = [0.36, 0.4, 0.4, 0];
      b.quad(p(a0, d0, -20), p(a1, d1, -20), p(a1, d1, h1 * 0.45), p(a0, d0, h0 * 0.45), [low, low, mid, mid], null, [[-S(a0), 0.3, -C(a0)], [-S(a1), 0.3, -C(a1)], [-S(a1), 0.3, -C(a1)], [-S(a0), 0.3, -C(a0)]]);
      b.quad(p(a0, d0, h0 * 0.45), p(a1, d1, h1 * 0.45), p(a1, d1 + 60, h1), p(a0, d0 + 60, h0), [mid, mid, top, top], null, [[-S(a0), 0.6, -C(a0)], [-S(a1), 0.6, -C(a1)], [-S(a1), 0.6, -C(a1)], [-S(a0), 0.6, -C(a0)]]);
    }
  }

  function farGround(b, col) {
    const rs = [120, 200, 320, 520, 850, 1400, 2400, 4000];
    const n = 32;
    for (let j = 0; j + 1 < rs.length; j++) {
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        b.quad([S(a0) * rs[j], -0.05, C(a0) * rs[j]], [S(a1) * rs[j], -0.05, C(a1) * rs[j]], [S(a1) * rs[j + 1], -0.05, C(a1) * rs[j + 1]], [S(a0) * rs[j + 1], -0.05, C(a0) * rs[j + 1]], col, null, NY);
      }
    }
  }

  function skyDome(b) {
    const seg = 32, rings = 10, R = 3000;
    const e0 = -0.12;
    for (let j = 0; j < rings; j++) {
      const ea = e0 + (j / rings) * (PI / 2 - e0), eb = e0 + ((j + 1) / rings) * (PI / 2 - e0);
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * PI * 2, a1 = ((i + 1) / seg) * PI * 2;
        const p = (a, e) => [S(a) * C(e) * R, S(e) * R, C(a) * C(e) * R];
        const uv = (a, e) => [a / (PI * 2), (e - e0) / (PI / 2 - e0)];
        b.quad(p(a0, ea), p(a1, ea), p(a1, eb), p(a0, eb), [1, 1, 1, 1], [uv(a0, ea), uv(a1, ea), uv(a1, eb), uv(a0, eb)], NY);
      }
    }
  }

  function airTerrain(b) {
    const half = 900, n = 72, step = (half * 2) / n;
    const col = (x, z, h) => {
      const nn = frac(S(x * 0.13 + z * 0.21) * 43758.5453);
      const patch = 0.5 + 0.5 * S(x / 61 + 0.7) * C(z / 47 - 0.3);
      const red = clamp((Math.abs(S(x / 120 + 1.3) * C(z / 150)) - 0.5) * 3, 0, 1) * clamp((h - 2) / 14, 0, 1);
      const green = [0.3 + 0.08 * nn, 0.42 + 0.08 * nn, 0.2 + 0.04 * nn];
      const olive = [0.5 + 0.06 * nn, 0.5 + 0.05 * nn, 0.3];
      const brown = [0.46 + 0.05 * nn, 0.38, 0.26];
      const r = [0.56 + 0.08 * nn, 0.3 + 0.04 * nn, 0.2];
      const base = patch > 0.66 ? mixV(green, olive, nn) : patch > 0.33 ? mixV(olive, brown, nn * 0.6) : mixV(green, brown, nn * 0.4);
      const c = mixV(base, r, red);
      return [c[0], c[1], c[2], 0];
    };
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x0 = -half + i * step, z0 = -half + j * step, x1 = x0 + step, z1 = z0 + step;
        const p = [[x0, terrainH(x0, z0), z0], [x1, terrainH(x1, z0), z0], [x1, terrainH(x1, z1), z1], [x0, terrainH(x0, z1), z1]];
        const nn = V3.norm(V3.cross(V3.sub(p[2], p[0]), V3.sub(p[1], p[0])));
        const nrm = nn[1] < 0 ? V3.mul(nn, -1) : nn;
        b.quad(p[0], p[1], p[2], p[3], p.map(q => col(q[0], q[2], q[1])), null, [nrm, nrm, nrm, nrm]);
      }
    }
    for (let i = 0; i < 320; i++) {
      const s = -half + hash(i, 21) * half * 2;
      const side = (hash(i, 22) - 0.5) * 2;
      const x = roadX(s) + side * (9 + 120 * Math.pow(hash(i, 23), 1.6));
      const y = terrainH(x, s);
      const rock = hash(i, 24) < 0.08;
      const r = rock ? 2.5 + 3 * hash(i, 25) : 0.9 + 1.3 * hash(i, 26);
      const col = rock ? [0.34 + 0.06 * hash(i, 27), 0.24, 0.18, 0] : [0.18 + 0.05 * hash(i, 29), 0.28 + 0.08 * hash(i, 28), 0.13, 0];
      b.at(x, y + r * 0.15, s, (h) => {
        h.ellipsoid(r * 1.4, r * (rock ? 0.45 : 0.75), r, 7, 3, col, { flat: rock });
        if (rock) h.at(r * 0.8, 0, r * 0.5, (q) => q.ellipsoid(r * 0.8, r * 0.35, r * 0.7, 6, 3, shadeC(col, 0.85), { flat: true }));
      });
    }
    for (let s = -half; s < half; s += 6) {
      const a = roadPoint(s), c = roadPoint(s + 6);
      const d = V3.norm(V3.sub(c, a));
      const side = V3.norm(V3.cross(d, [0, 1, 0]));
      const w = 4.2;
      b.quad(addV(a, V3.mul(side, -w)), addV(a, V3.mul(side, w)), addV(c, V3.mul(side, w)), addV(c, V3.mul(side, -w)), 0x8a8a86, null, NY);
    }
  }

  const LETTERS = {
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100']
  };

  const NAME_CUBES = (() => {
    const word = 'KALIFARNIYA';
    const cube = 0.1;
    const lw = 6 * cube;
    const total = word.length * lw - cube;
    const out = [];
    [...word].forEach((ch, li) => {
      LETTERS[ch].forEach((row, ry) => {
        [...row].forEach((bit, rx) => {
          if (bit !== '1') return;
          const i = out.length;
          const target = [-total / 2 + li * lw + rx * cube + cube / 2, (3 - ry) * cube, 0];
          const a = hash(i, 1) * PI * 2, d = 2.5 + 4 * hash(i, 2);
          out.push({ target, start: [target[0] + C(a) * d, target[1] + S(a) * d * 0.6, -3 - 6 * hash(i, 3)], t0: 0.5 + 2.9 * hash(i, 4) * (0.4 + 0.6 * (li / word.length)), spin: [hash(i, 5) * 8, hash(i, 6) * 8, hash(i, 7) * 8], k: ry / 6 });
        });
      });
    });
    return out;
  })();

  function texSky(kind) {
    return (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      const stops = {
        day: [['#4a7cbc', 0], ['#7aa6d4', 0.5], ['#c2d8e6', 0.86], ['#d8e2e2', 0.93], ['#b8b4a0', 1]],
        canyon: [['#3c72c4', 0], ['#6c9ed8', 0.5], ['#b8d2ea', 0.88], ['#d2dee6', 0.94], ['#a89880', 1]],
        back: [['#7ea2c4', 0], ['#a8c4d8', 0.45], ['#dcdcd0', 0.82], ['#ece8d6', 0.93], ['#b8b08a', 1]],
        golden: [['#8a94b4', 0], ['#c8a8b4', 0.42], ['#ecc4a8', 0.78], ['#f8d8b4', 0.92], ['#9a7a58', 1]],
        sunset: [['#b85a2c', 0], ['#e0782e', 0.45], ['#f8a248', 0.8], ['#ffc46a', 0.92], ['#4a2a1a', 1]],
        air: [['#5a84b8', 0], ['#8eb0d0', 0.5], ['#d0dee4', 0.86], ['#dde4e2', 0.93], ['#8a9070', 1]]
      }[kind];
      stops.forEach(([c, k]) => g.addColorStop(k, c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      let s = kind.length * 17 + 3;
      const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      if (kind === 'day' || kind === 'air' || kind === 'canyon' || kind === 'back') {
        const n = kind === 'canyon' ? 6 : 14;
        for (let i = 0; i < n; i++) {
          const x = rnd() * w, y = h * (0.45 + rnd() * 0.38), rr = 18 + rnd() * 40;
          ctx.fillStyle = kind === 'back' ? 'rgba(255,252,240,0.4)' : 'rgba(255,255,255,0.55)';
          [[0, 0, 1], [rr * 0.7, 3, 0.7], [-rr * 0.8, 4, 0.65], [rr * 0.2, -rr * 0.25, 0.6]].forEach(([dx, dy, k]) => {
            ctx.beginPath();
            ctx.ellipse(x + dx, y + dy, rr * k * 1.6, rr * 0.42 * k, 0, 0, PI * 2);
            ctx.fill();
          });
        }
      }
      if (kind === 'sunset' || kind === 'golden') {
        ctx.fillStyle = kind === 'sunset' ? 'rgba(120,50,30,0.35)' : 'rgba(255,230,220,0.35)';
        for (let i = 0; i < 9; i++) {
          const x = rnd() * w, y = h * (0.6 + rnd() * 0.25);
          ctx.beginPath();
          ctx.ellipse(x, y, 40 + rnd() * 60, 2 + rnd() * 3, 0, 0, PI * 2);
          ctx.fill();
        }
      }
    };
  }

  function texField(ctx, w, h) {
    ctx.fillStyle = '#7a8a3e';
    ctx.fillRect(0, 0, w, h);
    let s = 11;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * w, y = rnd() * h;
      const k = rnd();
      ctx.fillStyle = k < 0.35 ? '#5e7a32' : k < 0.6 ? '#8e9a46' : k < 0.82 ? '#e2c83a' : k < 0.94 ? '#f2eedc' : '#c8b030';
      const r = k < 0.6 ? 2.6 : 1.8;
      ctx.fillRect(x, y, r, r * (k < 0.6 ? 2.2 : 1));
    }
  }

  function texSteppe(ctx, w, h) {
    ctx.fillStyle = '#a89468';
    ctx.fillRect(0, 0, w, h);
    let s = 23;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 1800; i++) {
      const x = rnd() * w, y = rnd() * h;
      const k = rnd();
      ctx.fillStyle = k < 0.4 ? '#8e7e56' : k < 0.7 ? '#b8a478' : k < 0.88 ? '#7e8a52' : '#c8b88c';
      ctx.fillRect(x, y, 2 + rnd() * 3, 1.5 + rnd() * 2);
    }
  }

  function texClump(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const q = w / 4;
    for (let v = 0; v < 4; v++) {
      let s = 31 + v * 7;
      const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      for (let i = 0; i < 14; i++) {
        const x = v * q + q * (0.1 + rnd() * 0.8);
        ctx.strokeStyle = rnd() < 0.5 ? '#4e6a2a' : '#6a7e34';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, h);
        const top = h * (0.15 + rnd() * 0.5);
        ctx.lineTo(x + (rnd() - 0.5) * 8, top);
        ctx.stroke();
        if (v < 3 || rnd() < 0.4) {
          ctx.fillStyle = v === 1 ? '#f4f0e0' : rnd() < 0.7 ? '#f2d23a' : '#f6f0d8';
          ctx.beginPath();
          ctx.arc(x + (rnd() - 0.5) * 6, top, 3.5 + rnd() * 3, 0, PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function texGlow(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, '#bcbcbc');
    g.addColorStop(0.6, '#3a3a3a');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function texTitle(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `italic ${Math.round(h * 0.5)}px "Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(60,40,0,0.55)';
    ctx.strokeText('Hello', w * 0.5, h * 0.36);
    const g = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.6);
    g.addColorStop(0, '#fff2a0');
    g.addColorStop(1, '#e8c228');
    ctx.fillStyle = g;
    ctx.fillText('Hello', w * 0.5, h * 0.36);
    ctx.font = `bold ${Math.round(h * 0.17)}px "Arial Black", Arial, sans-serif`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.strokeText('KALIFARNIYA', w * 0.53, h * 0.8);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('KALIFARNIYA', w * 0.53, h * 0.8);
  }

  function texIdent(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `bold ${Math.round(h * 0.62)}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ПОЛИГОН', w / 2, h * 0.55);
  }

  const FW = 512;
  const FH = 384;
  const MAIN = { x: 0, y: 85, w: FW, h: 214 };
  const OVER_ENV = { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0, 0, 0], fogNear: 1000, fogFar: 2000, points: [] };
  const ORTHO_MAIN = new Float32Array([2 / MAIN.w, 0, 0, 0, 0, 2 / MAIN.h, 0, 0, 0, 0, -1, 0, -1, -1, 0, 1]);

  const LIGHTS = {
    day: { sky: 'day', sun: [1.0, 0.94, 0.82], top: [0.5, 0.56, 0.66], bottom: [0.44, 0.4, 0.32], haze: [0.84, 0.88, 0.88], fog: [60, 420], bloom: 0 },
    canyon: { sky: 'canyon', sun: [1.02, 0.94, 0.8], top: [0.5, 0.56, 0.68], bottom: [0.46, 0.38, 0.3], haze: [0.8, 0.86, 0.9], fog: [70, 330], bloom: 0 },
    field: { sky: 'day', sun: [0.98, 0.92, 0.8], top: [0.52, 0.58, 0.66], bottom: [0.42, 0.42, 0.3], haze: [0.8, 0.86, 0.88], fog: [60, 420], bloom: 0.15 },
    back: { sky: 'back', sun: [0.62, 0.58, 0.5], top: [0.64, 0.66, 0.68], bottom: [0.48, 0.46, 0.36], haze: [0.9, 0.9, 0.82], fog: [30, 300], bloom: 0.3 },
    golden: { sky: 'golden', sun: [0.95, 0.76, 0.58], top: [0.5, 0.46, 0.5], bottom: [0.36, 0.3, 0.26], haze: [0.94, 0.82, 0.72], fog: [40, 320], bloom: 0.3 },
    sunset: { sky: 'sunset', sun: [0.5, 0.3, 0.18], top: [0.3, 0.18, 0.12], bottom: [0.12, 0.08, 0.06], haze: [0.96, 0.62, 0.32], fog: [30, 260], bloom: 0.55 },
    air: { sky: 'air', sun: [1.15, 1.06, 0.9], top: [0.34, 0.38, 0.44], bottom: [0.28, 0.27, 0.22], haze: [0.8, 0.84, 0.84], fog: [250, 1500], bloom: 0 }
  };

  function create(r) {
    const X = Cast.makeCast(r);
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    const T = {
      field: r.texture(256, texField),
      steppe: r.texture(256, texSteppe),
      clump: r.texture(256, texClump, { height: 64 }),
      glow: r.texture(64, texGlow, { clamp: true }),
      chevron: r.texture(64, texChevron, { height: 32, clamp: true }),
      title: r.texture(512, texTitle, { height: 256, clamp: true }),
      ident: r.texture(512, texIdent, { height: 128, clamp: true })
    };
    const SKY = {};
    const skyTex = (kind) => SKY[kind] || (SKY[kind] = r.texture(512, texSky(kind), { height: 256, clamp: true }));
    const M = {};
    const lazy = (key, fn) => M[key] || (M[key] = mk(fn));
    const Q = {
      unit: mk(b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], null, NZ)),
      sprite: mk(b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], NZ)),
      tex: mk(b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], NZ)),
      cube: mk(b => b.box(1, 1, 1, [1, 1, 1, 0])),
      tri: mk(b => {
        b.tri([0, 1.1, 0], [-0.95, -0.55, 0], [0.95, -0.55, 0], [[0.18, 0.36, 0.84, 1], [0.88, 0.19, 0.12, 1], [0.18, 0.72, 0.29, 1]]);
        b.tri([0, 1.1, 0], [0.95, -0.55, 0], [-0.95, -0.55, 0], [[0.18, 0.36, 0.84, 1], [0.18, 0.72, 0.29, 1], [0.88, 0.19, 0.12, 1]]);
      })
    };
    const CARM = {
      body: r.mesh(KH.carBody()),
      door: r.mesh(KH.carDoor()),
      glass: r.mesh(KH.carGlass()),
      wheel: r.mesh(KH.carWheel()),
      steer: r.mesh(KH.steering()),
      flowers: r.mesh(KH.carFlowers()),
      frame: mk(b => KH.goldFrame(b)),
      armHim: r.mesh(KH.macroArm(KH.SKINS.singer, null, null, 1)),
      armHer: r.mesh(KH.macroArm(KH.SKINS.girl, KH.COLORS.CHARCOAL, 0xeef0f2, -1))
    };

    function keyDir(cm, back) {
      const f = V3.norm(V3.sub(cm.at, cm.eye));
      let rt = V3.cross(f, [0, 1, 0]);
      if (V3.len(rt) < 1e-3) rt = [1, 0, 0];
      rt = V3.norm(rt);
      if (back) return V3.norm(V3.add(V3.add(V3.mul(f, -0.75), V3.mul(rt, 0.35)), [0, -0.45, 0]));
      return V3.norm(V3.add(V3.add(V3.mul(f, 0.55), V3.mul(rt, 0.5)), [0, -0.66, 0]));
    }

    function lightOf(st) {
      if (st.scene === 'canyon') return LIGHTS.canyon;
      if (st.scene === 'steppe') return LIGHTS.day;
      return LIGHTS[st.light] || LIGHTS.field;
    }

    function envFor(st, L) {
      const back = st.light === 'back' || st.light === 'sunset';
      return {
        sunDir: st.scene === 'air' ? V3.norm([0.62, -0.48, 0.3]) : keyDir(st.camera, back), sunColor: L.sun, ambTop: L.top, ambBottom: L.bottom,
        fogColor: L.haze, fogNear: L.fog[0], fogFar: L.fog[1], points: []
      };
    }

    function farFog(L) {
      const seam = 150, mtn = 900;
      const f0 = clamp((seam - L.fog[0]) / (L.fog[1] - L.fog[0]), 0, 0.95);
      const f1 = Math.max(f0 + 0.2, 0.62);
      const a = (mtn - seam) / (f1 - f0);
      const n = seam - f0 * a;
      return [n, n + a];
    }

    function drawFar(st, L) {
      const cm = st.camera;
      const ff = farFog(L);
      const env = { sunDir: [0.3, -0.6, -0.5], sunColor: L.sun, ambTop: L.top, ambBottom: L.bottom, fogColor: L.haze, fogNear: ff[0], fogFar: ff[1], points: [] };
      r.begin(env, { eye: cm.eye, at: cm.at, fov: cm.fov, up: cm.up, near: 2, far: 6000 }, MAIN);
      r.draw(lazy('sky', skyDome), M4.translate(cm.eye[0], cm.eye[1] * 0.2, cm.eye[2]), { texture: skyTex(L.sky), noFog: true });
      if (st.sun) {
        const f = V3.norm(V3.sub(cm.at, cm.eye));
        const sa = Math.atan2(f[0], f[2]) + st.sun[0];
        const sp = addV(cm.eye, [S(sa) * 2000, Math.tan(st.sun[1]) * 2000, C(sa) * 2000]);
        r.draw(Q.sprite, M4.chain(M4.translate(sp[0], sp[1], sp[2]), billboard(cm), M4.scale(900)), { texture: T.glow, additive: true, noFog: true, alpha: 0.9, tint: [1, 0.96, 0.84] });
      }
      if (st.light === 'sunset') {
        const sp = addV(cm.eye, [120, 60, -2000]);
        r.draw(Q.sprite, M4.chain(M4.translate(sp[0], sp[1], sp[2]), billboard(cm), M4.scale(1200)), { texture: T.glow, additive: true, noFog: true, alpha: 0.7, tint: [1, 0.72, 0.36] });
      }
      if (st.scene !== 'air') {
        const ground = st.scene === 'steppe' ? [0.6, 0.55, 0.4, 0] : st.scene === 'canyon' ? [0.5, 0.42, 0.32, 0] : st.light === 'sunset' ? [0.1, 0.08, 0.06, 0] : [0.42, 0.48, 0.24, 0];
        r.draw(lazy('farGround', b => farGround(b, [1, 1, 1, 0])), null, { tint: ground.slice(0, 3) });
      }
      const sunset = st.light === 'sunset';
      const mt = sunset ? [0.2, 0.11, 0.12] : st.light === 'golden' ? [0.78, 0.68, 0.74] : [1, 1, 1];
      r.draw(lazy('mountains', b => mountainRing(b, 3)), sunset ? M4.scale(1, 0.32, 1) : null, { tint: mt, noFog: sunset });
    }

    const billboard = (cm) => {
      const f = V3.norm(V3.sub(cm.eye, cm.at));
      let rt = V3.cross([0, 1, 0], f);
      if (V3.len(rt) < 1e-4) rt = [1, 0, 0];
      rt = V3.norm(rt);
      const up = V3.cross(f, rt);
      return new Float32Array([rt[0], rt[1], rt[2], 0, up[0], up[1], up[2], 0, f[0], f[1], f[2], 0, 0, 0, 0, 1]);
    };

    const SIL = [0.035, 0.022, 0.02, 1];

    function shadowMatrix(st) {
      const cm = st.camera;
      const f = V3.norm(V3.sub(cm.at, cm.eye));
      if (st.light === 'back') return M4.planarShadow(V3.norm([f[0] * -0.9 + 0.2, -0.55, f[2] * -0.9]), 0.012);
      return M4.planarShadow(V3.norm([0.35, -1, -0.45]), 0.012);
    }

    function drawCast(st) {
      if (st.silhouette) {
        st.cast.forEach(a => Cast.drawActor(r, X, a, { flat: SIL }));
        return;
      }
      if (st.scene !== 'canyon') {
        const SH = shadowMatrix(st);
        const k = st.light === 'back' ? 0.32 : st.light === 'golden' ? 0.25 : 0.38;
        st.cast.forEach(a => { if (a.pose.ground !== false) Cast.drawActor(r, X, a, { pre: SH, flat: [0.08, 0.08, 0.06, k], shadow: true }); });
      }
      st.cast.forEach(a => Cast.drawActor(r, X, a));
    }

    function drawCar(st, t) {
      const car = st.car;
      if (!car) return;
      const m = car.m;
      if (st.scene !== 'air') {
        const SH = M4.planarShadow(V3.norm([0.25, -1, -0.3]), 0.01);
        r.draw(CARM.body, M4.mul(SH, m), { flat: [0.06, 0.05, 0.05, 0.45], blend: true, shadow: true });
      }
      r.draw(CARM.body, m, {});
      const [hx, hz] = KH.CAR.hinge;
      r.draw(CARM.door, M4.chain(m, M4.translate(hx, 0, hz), M4.rotY(-(car.door || 0)), M4.translate(-hx, 0, -hz)), {});
      KH.CAR.axles.forEach(z => [-1, 1].forEach(s => {
        r.draw(CARM.wheel, M4.chain(m, M4.translate(s * KH.CAR.track, KH.CAR.wheelR, z), M4.scale(-s, 1, 1), M4.rotX(car.spin || 0)), {});
      }));
      r.draw(CARM.flowers, m, {});
      const W = wheelSetup();
      r.draw(CARM.steer, M4.chain(m, M4.translate(KH.SEATS.driver[0], KH.SEATS.hipY + 0.1, -0.1), M4.rotX(-0.18), W.local), {});
    }

    function drawGlass(st) {
      if (!st.car || st.scene === 'air') return;
      r.draw(CARM.glass, st.car.m, { blend: true, alpha: 0.16, tint: [0.75, 0.85, 0.95] });
    }

    function drawSet(st, t, L) {
      if (st.scene === 'canyon') {
        const sc = st.car ? st.car.scroll : 0;
        const mesh = lazy('canyon', buildCanyon);
        for (let k = -1; k <= 2; k++) {
          const z0 = k * PERIOD - sc;
          if (z0 + PERIOD / 2 < -340 || z0 - PERIOD / 2 > 340) continue;
          r.draw(mesh, M4.translate(0, 0, z0), {});
        }
        if (st.sign) {
          const z = 8 - (t - 37.56) * SPEED;
          r.draw(lazy('chevron', chevronSign), M4.translate(-4.6, 0, z), {});
          r.draw(Q.tex, M4.chain(M4.translate(-4.6 - 0.37, 1.17, z + 0.06), M4.scale(0.74, 0.5, 1)), { texture: T.chevron });
        }
        return;
      }
      if (st.scene === 'steppe') {
        r.draw(lazy('steppe', buildSteppe), null, {});
        r.draw(lazy('ground', b => groundTiles(b, 160, 16, -0.04)), null, { texture: T.steppe, tint: [1, 1, 1] });
        return;
      }
      if (st.scene === 'air') {
        r.draw(lazy('air', airTerrain), null, {});
        return;
      }
      const dark = st.light === 'sunset';
      r.draw(lazy('ground', b => groundTiles(b, 160, 16, -0.04)), null, { texture: T.field, tint: dark ? [0.12, 0.1, 0.08] : st.light === 'golden' ? [0.9, 0.78, 0.62] : [1, 1, 1] });
      r.draw(lazy('clumps', b => flowerClumps(b, 7)), null, { texture: T.clump, tint: dark ? [0.05, 0.04, 0.035] : [1, 1, 1] });
    }

    function drawFrame(st) {
      if (!st.frame) return;
      const p = st.frame.pos;
      r.draw(CARM.frame, M4.translate(p[0], p[1], p[2]), {});
    }

    function drawHands(st, t) {
      if (!st.hands) return;
      const his = smooth(span(t, 126.3, 127.6)), hers = smooth(span(t, 127.0, 128.1)), hold = smooth(span(t, 128.0, 128.7));
      r.draw(CARM.armHim, M4.chain(M4.translate(1.15 - 0.98 * his + 0.02 * hold, 0.5 + 0.01 * S(t * 2), 0.0), M4.rotZ(0.05), M4.scale(-1, 1, 1), M4.rotX(-0.25 - 0.9 * hold)), {});
      r.draw(CARM.armHer, M4.chain(M4.translate(-1.2 + 1.03 * hers, 0.49, 0.02), M4.rotZ(-0.04), M4.rotX(1.0 - 0.6 * hold)), {});
    }

    function drawIdent(st, t) {
      const env = { sunDir: V3.norm([0.3, -0.5, -0.8]), sunColor: [0.7, 0.66, 0.8], ambTop: [0.35, 0.3, 0.42], ambBottom: [0.12, 0.1, 0.16], fogColor: [0, 0, 0], fogNear: 40, fogFar: 90, points: [] };
      r.begin(env, st.camera, MAIN);
      if (st.ident === 'name') {
        NAME_CUBES.forEach((c, i) => {
          const k = smooth(clamp((t - c.t0) / 0.9, 0, 1));
          if (k <= 0.001) return;
          const p = mixV(c.start, c.target, k);
          const sp = 1 - k;
          const pulse = 0.12 + 0.1 * S(t * 3 + c.target[0] * 2) * smooth(span(t, 3.6, 4.4));
          const col = [lerp(0.66, 0.5, c.k), lerp(0.42, 0.28, c.k), lerp(0.96, 0.84, c.k)];
          r.draw(Q.cube, M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotX(c.spin[0] * sp), M4.rotY(c.spin[1] * sp), M4.rotZ(c.spin[2] * sp), M4.scale(0.094 * (0.4 + 0.6 * k))), { tint: col });
          if (pulse > 0) r.draw(Q.cube, M4.chain(M4.translate(p[0], p[1], p[2] + 0.002), M4.scale(0.1)), { blend: true, alpha: pulse * k, tint: [0.9, 0.7, 1] });
        });
      } else {
        const k = smooth(span(t, 5.1, 5.9));
        r.draw(Q.tri, M4.chain(M4.translate(0, 0.45, 0), M4.rotY(t * 1.6 + (1 - k) * 4), M4.scale(0.75 * k)), {});
        const a = smooth(span(t, 5.9, 6.6));
        if (a > 0.01) r.draw(Q.tex, M4.chain(M4.translate(-1.1, -0.72, 0), M4.scale(2.2, 0.55, 1)), { texture: T.ident, blend: true, alpha: a, noFog: true });
      }
    }

    let polys = 0;
    const tally = () => { polys += r.polys; r.polys = 0; };
    const F = { full: r.frameTexture(), small: r.frameTexture(), tiny: r.frameTexture() };
    const inMain = (colorM, colorAdd) => {
      tally();
      r.begin(OVER_ENV, { proj: ORTHO_MAIN, view: M4.ident(), colorM, colorAdd }, MAIN, true);
    };
    const rect = (x, y, w, h, opts) => r.draw(Q.unit, M4.chain(M4.translate(x, y, 0), M4.scale(w, h, 1)), Object.assign({ noFog: true }, opts));
    const trect = (x, y, w, h, opts) => r.draw(Q.tex, M4.chain(M4.translate(x, y, 0), M4.scale(w, h, 1)), Object.assign({ noFog: true }, opts));

    function bloom(k) {
      if (k <= 0.02) return;
      const gain = 2.3, cut = -1.55;
      r.grab(F.full, MAIN.x, MAIN.y, MAIN.w, MAIN.h);
      inMain(new Float32Array([gain, 0, 0, 0, gain, 0, 0, 0, gain]), [cut, cut, cut]);
      trect(0, 0, 128, 54, { texture: F.full });
      r.grab(F.small, MAIN.x, MAIN.y, 128, 54);
      inMain();
      trect(0, 0, 32, 14, { texture: F.small });
      r.grab(F.tiny, MAIN.x, MAIN.y, 32, 14);
      trect(0, 0, MAIN.w, MAIN.h, { texture: F.full });
      trect(0, 0, MAIN.w, MAIN.h, { texture: F.small, additive: true, alpha: 0.6 * k });
      trect(0, 0, MAIN.w, MAIN.h, { texture: F.tiny, additive: true, alpha: k });
    }

    function overlays(st, t) {
      if (st.title > 0.01) {
        inMain();
        trect(262, 50, 240, 120, { texture: T.title, blend: true, alpha: st.title });
      }
      const a = flashAt(t);
      if (a > 0.001) {
        inMain();
        rect(0, 0, MAIN.w, MAIN.h, { flat: [1, 0.99, 0.95, a], blend: true });
      }
    }

    return {
      warm() {
        wheelSetup();
        ['him', 'her'].forEach(bd => Object.keys(ARMS).forEach(n => { if (!ARMS[n].a) { armOf(n, 'L', 0, bd); armOf(n, 'R', 0, bd); } }));
        ['khSinger', 'khGirl'].concat(KH.DANCER_IDS).forEach(f => X.form(f));
        ['canyon', 'steppe', 'air'].forEach(k => lazy(k, k === 'canyon' ? buildCanyon : k === 'steppe' ? buildSteppe : airTerrain));
      },
      render(t) {
        polys = 0;
        r.polys = 0;
        const shot = shotAt(t);
        const st = stage(t, shot);
        r.clear([0, 0, 0]);
        if (st.scene === 'ident') {
          drawIdent(st, t);
        } else {
          const L = lightOf(st);
          drawFar(st, L);
          tally();
          const cm = st.camera;
          const camN = Object.assign({}, cm, st.scene === 'air' ? { near: 1, far: 2600 } : { near: 0.05, far: 420 });
          r.begin(envFor(st, L), camN, MAIN, true);
          drawSet(st, t, L);
          drawCar(st, t);
          drawFrame(st);
          drawCast(st);
          drawHands(st, t);
          drawGlass(st);
          bloom(L.bloom * (st.bloom ? 1 : 0.6));
        }
        overlays(st, t);
        tally();
        return { shot, polys: Math.round(polys), fade: fadeAt(t), overlay: null };
      }
    };
  }

  const clip = {
    id: 'hello',
    number: 13,
    artist: 'Kalifarniya',
    title: 'Hello',
    originalYear: 2024,
    audio: 'content/clip/Kalifarniya - Hello.mp3',
    duration: DURATION,
    bpm: BPM,
    beat0: BEAT0,
    poster: 64.1,
    locations: LOCATIONS,
    shots: SHOTS,
    looks: CHARACTERS,
    shotAt,
    stage,
    fadeAt,
    flashAt,
    titleAt,
    voiceAt,
    mouthFor,
    energyAt,
    moveAt: (t, list) => danceAt(list || LEAD, t, 'him').move,
    create
  };

  window.poligonClips = window.poligonClips || [];
  if (!window.poligonClips.some(c => c.id === clip.id)) window.poligonClips.push(clip);
})();
