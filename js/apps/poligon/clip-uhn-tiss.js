(function () {
  const { M4, V3, Builder, rgb } = window.P3D;
  const { restPose } = window.P3DFigure;
  const Cast = window.P3DCccCast;
  const GK = window.P3DGodKnowsCast;
  const U = window.P3DUhnTissCast;

  const BPM = 135;
  const BEAT0 = 0.255;
  const BEAT = 60 / BPM;
  const DURATION = 263.73;
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
  const bob = (t, lag) => 0.5 + 0.5 * C(2 * PI * (beatAt(t) - (lag === undefined ? 0.08 : lag)));
  const punch = (t, lag) => Math.pow(bob(t, lag), 3);
  const mixV = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const addV = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const drift = (a, b, u) => mixV(a, b, smooth(u));

  const LOCATIONS = [
    { id: 'door', name: 'Вход', color: '#c8283a', scene: 'street' },
    { id: 'floor', name: 'Танцпол', color: '#2a9a5a', scene: 'club' },
    { id: 'bar', name: 'Бар', color: '#d89a30', scene: 'club' },
    { id: 'hall', name: 'Туалет', color: '#3a8ab0', scene: 'wc' },
    { id: 'stall', name: 'Кабинка', color: '#7a2a3a', scene: 'wc' },
    { id: 'hole', name: 'Окошко', color: '#1e2e3e', scene: 'wc' },
    { id: 'girl', name: 'Соседка', color: '#d8287a', scene: 'wc' },
    { id: 'band', name: 'Группа', color: '#d8c020', scene: 'wc' }
  ];

  const SHOT_LIST = [
    [0, 'hole', 'lipsIntro'], [2.3, 'door', 'sign'], [4.25, 'door', 'queue'], [6.3, 'door', 'queueClose'], [8.3, 'door', 'curtain'],
    [9.6, 'door', 'ropeAbove'], [10.97, 'door', 'arrive'], [12.14, 'floor', 'toWc'], [16.64, 'floor', 'dance1'], [17.77, 'hall', 'enter'],
    [20.69, 'floor', 'dance2'], [22.31, 'hall', 'chat'], [23.77, 'floor', 'shadesHead'], [25.27, 'hall', 'heroWalk'], [26.78, 'hall', 'heroNose'],
    [28.4, 'hall', 'twoGirls'], [30.65, 'hall', 'busker'], [34.58, 'hall', 'buskerWide'], [35.95, 'floor', 'handsUp'], [36.99, 'floor', 'laugh'],
    [37.79, 'floor', 'dance3'], [39.62, 'stall', 'turn'], [43.0, 'stall', 'inside'], [45.13, 'stall', 'close1'], [48.21, 'stall', 'sit1'],
    [49.88, 'band', 'lineup1'], [51.09, 'stall', 'close2'], [51.55, 'stall', 'wall1'], [52.22, 'stall', 'reach1'], [53.59, 'stall', 'point1'],
    [55.35, 'stall', 'wave1'], [56.97, 'stall', 'spin'], [59.23, 'band', 'drums1'], [61.27, 'band', 'guitar1'], [62.85, 'band', 'lineup2'],
    [64.19, 'stall', 'close3'], [65.65, 'stall', 'wide1'], [66.36, 'bar', 'bar1'], [67.73, 'stall', 'close4'], [68.36, 'band', 'guitar2'],
    [70.11, 'band', 'lineup3'], [71.03, 'stall', 'close5'], [73.11, 'stall', 'thumb'], [75.07, 'bar', 'bar2'], [76.2, 'band', 'djPhones'],
    [76.83, 'stall', 'sit2'], [78.37, 'band', 'bassShades'], [79.79, 'stall', 'sit3'], [81.08, 'band', 'guitarHair'], [81.91, 'stall', 'close6'],
    [82.71, 'band', 'drumFace'], [83.79, 'stall', 'close7'], [84.58, 'stall', 'peek1'], [85.54, 'hole', 'see1'], [86.84, 'stall', 'eye1'],
    [88.21, 'stall', 'close8'], [91.17, 'stall', 'wide2'], [92.93, 'girl', 'pose1'], [94.8, 'stall', 'close9'], [97.18, 'stall', 'wide3'],
    [97.93, 'stall', 'close10'], [98.76, 'stall', 'above1'], [99.85, 'girl', 'pose2'], [101.85, 'hall', 'creamFace'], [106.06, 'hall', 'creamWide'],
    [108.32, 'floor', 'dance4'], [110.11, 'stall', 'bend'], [111.36, 'hole', 'see2'], [112.07, 'stall', 'peek2'], [112.95, 'girl', 'pose3'],
    [114.53, 'hole', 'see3'], [115.45, 'stall', 'doorOpen'], [119.54, 'band', 'lineup4'], [121.25, 'stall', 'wag'], [123.12, 'floor', 'green'],
    [124.55, 'hall', 'hippie'], [130.21, 'stall', 'wide4'], [131.63, 'stall', 'point2'], [132.21, 'hall', 'whip'], [133.97, 'hall', 'clerk1'],
    [136.05, 'stall', 'close11'], [137.51, 'hall', 'clerk2'], [139.31, 'stall', 'close12'], [140.51, 'stall', 'close13'], [141.64, 'hall', 'clerk3'],
    [144.52, 'stall', 'peek3'], [145.98, 'hole', 'see4'], [147.69, 'stall', 'close14'], [148.65, 'hole', 'see5'], [150.11, 'stall', 'close15'],
    [151.73, 'hall', 'maid'], [153.9, 'hall', 'maidClose'], [155.32, 'floor', 'shadesGirl'], [156.61, 'stall', 'close16'], [157.24, 'floor', 'dance5'],
    [158.78, 'stall', 'wide5'], [162.66, 'floor', 'dance6'], [165.54, 'stall', 'close17'], [166.75, 'hole', 'see6'], [167.92, 'stall', 'peek4'],
    [168.92, 'stall', 'wide6'], [170.04, 'band', 'lineup5'], [171.09, 'hole', 'lips1'], [172.05, 'stall', 'close18'], [173.17, 'hall', 'tank'],
    [175.01, 'hall', 'blind'], [176.38, 'floor', 'speakers'], [177.93, 'hole', 'lips2'], [179.43, 'hall', 'party'], [182.56, 'hall', 'blueShirt'],
    [183.85, 'hall', 'sleeper'], [186.35, 'floor', 'dance7'], [188.19, 'hole', 'lips3'], [188.94, 'hall', 'robotWalk'], [191.07, 'hall', 'robot'],
    [193.48, 'stall', 'peek5'], [194.32, 'hole', 'see7'], [195.69, 'stall', 'kiss1'], [196.99, 'floor', 'dance8'], [197.99, 'hall', 'swap'],
    [204.79, 'stall', 'whisper'], [206.66, 'stall', 'wide7'], [207.67, 'stall', 'sit4'], [208.83, 'stall', 'kiss2'], [209.92, 'stall', 'arms1'],
    [210.75, 'hole', 'dogEye'], [211.84, 'stall', 'kiss3'], [213.21, 'stall', 'wide8'], [214.88, 'stall', 'close19'], [216.97, 'stall', 'stop'],
    [218.43, 'stall', 'kiss4'], [220.05, 'stall', 'clap'], [221.22, 'stall', 'kiss5'], [222.68, 'stall', 'wide9'], [224.14, 'stall', 'walls'],
    [225.1, 'stall', 'above2'], [225.89, 'stall', 'kiss6'], [227.23, 'stall', 'paper'], [228.52, 'hole', 'tongue'], [229.98, 'girl', 'smile1'],
    [231.44, 'floor', 'dance9'], [232.94, 'stall', 'kiss7'], [234.32, 'floor', 'dance10'], [236.61, 'girl', 'smile2'], [240.11, 'floor', 'dance11'],
    [241.78, 'hall', 'exit'], [250.33, 'floor', 'dance12'], [252.42, 'girl', 'pose4'], [253.04, 'floor', 'dance13'], [254.71, 'girl', 'smile3'],
    [257.84, 'door', 'carpet']
  ];

  const EMPTY_CAMS = ['sign', 'lipsIntro', 'lips1', 'lips2', 'lips3', 'dogEye', 'tongue'];

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
    if (t < 0.62) return 1;
    if (t < 0.72) return 1 - (t - 0.62) / 0.1;
    return smooth(span(t, 261.2, 262.4));
  }

  const FLASHES = [[2.3, 2.95, 1], [42.85, 43.45, 0.95], [59.2, 59.6, 0.95], [115.45, 115.75, 0.9]];
  const DIPS = [4.25, 6.3, 8.3, 9.6];

  function flashAt(t) {
    let w = 0;
    FLASHES.forEach(([a, b, k]) => {
      if (t >= a - 0.12 && t <= b) w = Math.max(w, k * (t < a ? (t - a + 0.12) / 0.12 : 1 - (t - a) / (b - a)));
    });
    return clamp(w, 0, 1);
  }

  function dipAt(t) {
    let w = 0;
    DIPS.forEach(c => { w = Math.max(w, 1 - Math.abs(t - c) / 0.4); });
    if (t > 3.6 && t < 4.25) w = Math.max(w, span(t, 3.6, 4.2));
    return clamp(w, 0, 1) * 0.92;
  }

  const VOICE = '0000000000000dqi88kd00knf0ej900iph0ei900lrolbgjg00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000xzzd8lmpecormlc000szzfco000pzzyfnomj9aa0ewkkiiihchone0000bhf00zzd0dljgc0000ctjiomic00mqoe0000fd90btzzljmdjesjiijk700uk00glctjyvqqnji0a00000007zzusnfgp00rnk00000sp00evl08mzk000cjjic00dnsqq700akzq00om00kdhcxzzzqltrqgiq00osqg00000msqol9800000pzzv0dgc00xtqqrve0mdihixn00gzvsspnkaia00000000yzr00d000iplonpa0gzzj0oj008kjmzg0ljfzusrsr90pyxd0n0000b00izzxs0000rzzzzi000zzzwp9000xzzq00aejjc00cpob0xzq0fna00owokoqomimnvumvxrrg00000000000iuzuoci000zxtqflrsukg70zzyyvqf007lp0jzzs9f700gzsphlmf08g00a0000aolhc9000hqfdi80000000aib0ckf00bj007un00nzi08d000zvtqoh000jqonk8e000000zzzxqe000gyto0clqib000cde9000000g000we00kzpqglj00szwmb0009znlmwzvn80000bwtkgnic0000000000000000000000000000000000000000000000000000000nyrhcdfgopnkggh9900000ikjhdea000d0000000pi008ha087igiltj00ec0icjhiqsf000hgc000fl7ifbfjkc0gbcb9a0000000000000000000000000000000000000000000000000000000nzzyvk0000swse0jmp09000ebb000000c000hu000zsoofob0bzytc0000zwjlqzznh00000zvtyjkjd00000000000000000000000000000000000000000000000000000lzztmjjheizzzwwyzyj0b00zzussoideppg000008zo009j00ldimipnc00d90biejgomi008hdb900lg0878fcea0000000000000000000000000000ac00kd00bng0bha00bmh0df900fprldgkh000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000rvwvswsk09ypmoemg0vrolg0hf7nzzzo7iggfmc0lzzzvoe00punn700000000ikidfhqtvp0000kpjldgpaeusqpga0000000lyl0ijzsob00cdpyvti0000pjfdpwsqpfed000000tzvnnimsqmm78knugczqmmia00zzxxtnik000lzrsnlk0bo8so00cig00e800juomnfjhflozy80000zzzwte00iybhfuzxvkmh990iptlwa00booobpqrlqka70rnnnfomke000000000000fso80cctqidicccki990000hopqpfff000000jkjnihhhorn00zzvwh0000mmnofjh80ee00zzsutv9a8mr90fzzwqtrj9ssl9prjaltotm08ke0yspoj8000nbgtnqqolafpd00000000xrejckn000ypesgslkkf900000000000emtlrqmdark000rqpnh070bxtd09jqmf0000ze00hvspqk8000000000000dbal88hhsssmjgroivrrqhtso70000jpnlh00000000uzzytg000bvwq98mpna7009ceb000000f000pn007zpqljk80lzwqc0000zpkmszxnc00000utnfnkc0000000000000000000000000000000000000000000000000000000kwtjcdgfmsolhghc090000glkheeb800b9000000lo000hc088ghbpvm00dd0geiifrvk000ghe900bp8gibimje0gd9c890000000000000000000000000000000000000000000000000000000ezzzxma000oxsi0inodb000ecd000000bb000y000yuoqeqg00zzug8000wzjlpzzpl00000zztzhmjf00000000000000000000000000000000000000000000000000000dzzxmjjhbhzzzxwzzzo0b00rzvstpjedkpj000000zz000ia0fihlinhf00bb08ndjiloo000geba00gl0870fbgb0000000000000000000000000000gja0ke000ig80qc007ii9brd00clqmfgii7aif098900ejd0ab000bke0ac000hrojbgid0ejb08b000gi80cc000hj00bb000000000007ig008b008je0cc700cje08b700esnkbbfd0dia08a000ei80dd000fi00gb000000000000hi000c000jg09db009ih09ba00bmqlchif0aid00b000eha0bc000dj70gc000000000000fi90bc000if09aa007hg0aca00bmpldfig0bhd07b000dia09c000ci90ec000000000000gi908b000gh009b000gia89900ajqkefhh09if00b800ajb0ad000bjd0ec000000000000fib0cd000hh00bc000gi809a008krmfddg79hg00ab008hc09b7009je0ba000000000000djb0ad000gh90bd000ejb0bc000irngchh90hh908c007ie08a8009jf0cb700000000000bid07c800cia0cc000fjc0ac000jsnhciha0ii80ad009hf07aa00ari0bib00000000000zzzxrg000jztn0cloie800bcd8000008g000zd00nzprhll00wzwmd000bzmmmyztn70000gxsjholc0000000000000000000000000000000000000000000000000000009pyrhacfflpmkhiib900000ijjgedb80bc0000000si000i90geihfmuj00da0gbjgjque000hge000ji8hecmnkd0gdb9000000000000000000000000000000000000000000000000000000000nzzzvl9000xxre0kmqac007db9000000g900iv000ztpngna0ezxsd9000zvkmqzzni0000azwuyjold00000000000000000000000000000000000000000000000000000nzzuolkecgzzzwwzzzi7e00zzustojeespf000009zp00bi00nfilhmnc00e90fjfjgnqg00ajdca00jf0008gjia0000000000000000000000000000eg00kd00ajf0eja009jg0hla00dnqldgjh0djd08c000cia0ac000dkc09a000iqmhbhja0fi80ad000hf08ab007ih0bhb00000000000aif00b800cic08c000djb08c000esnibcfc0fi00bc000gg00ac000ih00bb000000000009ig079a00bid08c800bjf07c000frnjchid0eia0ad000fg00ac000fi00bb000000000000hh009b009ic09b000ajd09b700fqnjagid0eic08c000fi00ac000ej00cb000000000000gg008a007he09c8009ig08a800dnpkbfjf0cid00b000ei90fc000ej80hc000000000000hi909d000jf0aba008ih008b00cmqlcddg0bid08c000cja0cb000cja0db000000000000fi808d000hg00cc000hi809a007kqmefhg0ajg08c900bid0cb000dlc0hb000000000000eja09b000cf00cd000hi90bb00alrmfehh78ig09ba00aga0ce000fpd0ec0000';
  const VOICE_LV = Array.from(VOICE, ch => parseInt(ch, 36) / 35);

  function voiceAt(t) {
    const f = t * 20;
    const i = Math.floor(f);
    if (i < 0 || i >= VOICE_LV.length) return 0;
    const a = VOICE_LV[i], b = VOICE_LV[i + 1] || 0;
    return a + (b - a) * (f - i);
  }

  const SINGING = [[45.4, 102.2], [116.5, 258.2]];
  const GIRL_VOICE = [[0.6, 2.45]];
  const singing = (t) => SINGING.some(([a, b]) => t >= a && t <= b);

  function mouthFor(role, t) {
    if (role === 'hero' && singing(t)) return clamp((voiceAt(t) - 0.12) / 0.7, 0, 1);
    if (role === 'girl' && GIRL_VOICE.some(([a, b]) => t >= a && t <= b)) return clamp((voiceAt(t) - 0.12) / 0.7, 0, 1);
    if (role === 'lips') return clamp((voiceAt(t) - 0.08) / 0.6, 0, 1);
    return 0;
  }

  const ENERGY = [[0, 0.5], [16.6, 0.7], [45.1, 0.85], [102, 0.6], [116.6, 0.85], [171, 1], [241, 0.9], [258, 0.3]];
  function energyAt(t) {
    let i = 0;
    while (i + 1 < ENERGY.length && ENERGY[i + 1][0] <= t) i++;
    const [, e0] = ENERGY[i];
    const next = ENERGY[i + 1];
    if (!next) return e0;
    return lerp(e0, next[1], smooth(span(t, next[0] - 0.8, next[0])));
  }

  const CHARACTERS = {
    hero: { name: 'Солист в бордовом пиджаке' },
    girl: { name: 'Соседка в малиновом платье' },
    guitar: { name: 'Гитарист' },
    bass: { name: 'Басист с усами' },
    dj: { name: 'Клавишник в кепке' },
    drum: { name: 'Барабанщик с ирокезом' },
    dog: { name: 'Пёс' },
    regulars: { name: 'Завсегдатаи туалета' },
    crowd: { name: 'Танцпол' }
  };

  const STALL_D = 1.6;
  const PART_H = 2.3;
  const CEIL = 2.9;
  const HALL_Z = 3.2;
  const STALLS = [-3, -2, -1, 0, 1, 2, 3];
  const HOLE = [1.0, 1.12, -0.75];
  const HOLE_R = 0.032;
  const TOILET_Z = -STALL_D + 0.34;
  const HERO_STAND = [0.5, -0.72];
  const HERO_SIT = [0.5, -1.18];
  const GIRL_SPOT = [1.5, -0.8];
  const KIT_X = -1.5;

  function pose(x, z, ry) {
    const p = restPose();
    p.x = x;
    p.z = z;
    p.ry = ry || 0;
    return p;
  }

  function actor(id, form, p) {
    return { id, form, look: form, pose: p, hidden: false, props: [] };
  }

  const blinkAt = (t, seed) => (frac(t / 3.1 + seed * 0.37) < 0.045 ? 1 : 0);

  function singFace(t, mood) {
    const tt = Math.floor(t * 12) / 12;
    if (!singing(tt)) return mood || 'calm';
    const v = voiceAt(tt);
    if (v > 0.86) return mood === 'soft' ? 'sing' : 'belt';
    if (v > 0.5) return 'sing';
    if (v > 0.18) return 'say';
    return mood || 'calm';
  }

  const ARMS = {
    rest: { R: [0.08, 0, 0.1, 0.28], L: [0.08, 0, 0.1, 0.28] },
    point: { R: [1.45, 0.05, 0.14, 0.06] },
    pointL: { L: [1.4, 0.05, 0.14, 0.08] },
    pointUp: { R: [2.65, 0, 0.12, 0.2] },
    out: { R: [0.25, 0, 1.4, 0.15] },
    outL: { L: [0.25, 0, 1.4, 0.15] },
    walls: { R: [0.3, 0, 1.28, 0.3], L: [0.3, 0, 1.28, 0.3] },
    wave: { R: [2.35, 0, 0.55, 0.8] },
    stop: { R: [1.4, 0, 0.12, 0.32] },
    up: { R: [2.7, 0, 0.32, 0.25], L: [2.7, 0, 0.32, 0.25] },
    shrug: { R: [0.3, 0, 0.55, 1.6], L: [0.3, 0, 0.55, 1.6] },
    swing: { R: [0.45, 0, 0.12, 0.35], L: [-0.35, 0, 0.12, 0.25] },
    play: { R: [0.4, -0.5, 0.25, 1.4], L: [0.4, -0.5, 0.25, 1.4] }
  };

  const IKS = {
    cross: { R: [0.12, 0.27, 0.15], L: [-0.12, 0.24, 0.12] },
    chest: { R: [0.03, 0.32, 0.15] },
    chin: { R: [0.0, 0.5, 0.16] },
    pocket: { R: [-0.15, -0.03, 0.07] },
    pockets: { R: [-0.15, -0.03, 0.07], L: [0.15, -0.03, 0.07] },
    hips: { R: [-0.17, 0.07, 0.03], L: [0.17, 0.07, 0.03] },
    thumb: { R: [-0.25, 0.44, 0.04] },
    clap: { R: [-0.02, 0.3, 0.3], L: [0.02, 0.3, 0.3] },
    hair: { R: [-0.08, 0.76, -0.02], L: [0.08, 0.76, -0.02] },
    hairR: { R: [-0.1, 0.74, 0.02] },
    nose: { R: [0.0, 0.6, 0.17] },
    ear: { R: [-0.13, 0.66, 0.02] },
    tp: { R: [-0.02, 0.27, 0.3] },
    tie: { R: [0.0, 0.42, 0.18], L: [0.03, 0.36, 0.17] },
    rip: { R: [-0.22, 0.34, 0.2], L: [0.22, 0.34, 0.2] },
    glasses: { R: [-0.04, 0.68, 0.16] },
    eat: { R: [-0.02, 0.56, 0.2], L: [0.12, 0.12, 0.26] },
    lip: { R: [-0.03, 0.56, 0.17], L: [0.04, 0.5, 0.26] },
    kissOut: { R: [-0.06, 0.52, 0.3] },
    beckon: { R: [-0.08, 0.36, 0.34] },
    tray: { R: [-0.1, 0.12, 0.26], L: [0.1, 0.12, 0.26] },
    remote: { R: [-0.08, 0.18, 0.28], L: [0.08, 0.18, 0.28] },
    hearts: { R: [-0.22, 0.36, 0.3], L: [0.22, 0.36, 0.3] },
    pail: { R: [-0.2, -0.02, 0.06] },
    board: { R: [-0.04, 0.26, 0.26], L: [0.1, 0.22, 0.22] },
    bowl: { R: [-0.1, 0.18, 0.3], L: [0.1, 0.18, 0.3] },
    sip: { R: [-0.04, 0.4, 0.26] },
    knock: { R: [-0.08, 0.42, 0.36] },
    mirror: { L: [0.06, 0.52, 0.3], R: [-0.02, 0.56, 0.18] },
    phones: { R: [-0.14, 0.62, 0.02], L: [0.14, 0.62, 0.02] }
  };

  const REST_ARM = [0.08, 0, 0.1, 0.28];
  const armCache = {};

  function armsFor(form, name) {
    const key = form + ':' + name;
    if (armCache[key]) return armCache[key];
    const out = { R: REST_ARM.slice(), L: REST_ARM.slice() };
    const a = ARMS[name];
    if (a) ['R', 'L'].forEach(s => { if (a[s]) out[s] = a[s].slice(); });
    const ik = IKS[name];
    if (ik) ['R', 'L'].forEach(s => { if (ik[s]) out[s] = GK.ik(form, s, ik[s]).slice(); });
    armCache[key] = out;
    return out;
  }

  function gestureAt(ts, list) {
    if (!list || !list.length) return { a: 'rest', b: 'rest', w: 0 };
    let i = 0;
    while (i + 1 < list.length && list[i + 1][0] <= ts) i++;
    const cur = list[i];
    const prev = list[i - 1];
    if (!prev) return { a: cur[1], b: cur[1], w: 0 };
    return { a: prev[1], b: cur[1], w: smooth((ts - cur[0]) / 0.45) };
  }

  function applyGesture(p, form, g) {
    const A = armsFor(form, g.a), B = armsFor(form, g.b);
    ['R', 'L'].forEach(s => {
      const v = GK.mixArm(A[s], B[s], g.w);
      p['sh' + s] = [v[0], v[1], v[2]];
      p['el' + s] = [v[3], 0, 0];
    });
  }

  function wiggle(p, t, name, w) {
    if (!w) return;
    if (name === 'wave') p.elR = [p.elR[0] + 0.45 * S(t * 9) * w, 0, 0];
    if (name === 'clap') {
      const k = Math.abs(S(PI * beatAt(t))) * w;
      p.shR = [p.shR[0], p.shR[1], p.shR[2] + 0.2 * k];
      p.shL = [p.shL[0], p.shL[1], p.shL[2] + 0.2 * k];
    }
    if (name === 'point' || name === 'stop') p.shR = [p.shR[0] + 0.08 * S(2 * PI * beatAt(t)) * w, p.shR[1], p.shR[2]];
    if (name === 'beckon') p.elR = [p.elR[0] + 0.35 * (0.5 + 0.5 * S(t * 7)) * w, 0, 0];
    if (name === 'kissOut') p.elR = [p.elR[0] - (0.25 - 0.25 * C(2 * PI * t * 0.7)) * w, 0, 0];
  }

  function walkPose(p, ph, k) {
    const w = k === undefined ? 1 : k;
    p.hipL = [0.42 * S(ph) * w, 0, 0.04];
    p.hipR = [-0.42 * S(ph) * w, 0, 0.04];
    p.knL = [(0.15 + 0.5 * Math.max(0, -S(ph - 0.6))) * w, 0, 0];
    p.knR = [(0.15 + 0.5 * Math.max(0, S(ph - 0.6))) * w, 0, 0];
    p.shL = [-0.3 * S(ph) * w, 0, 0.1];
    p.shR = [0.3 * S(ph) * w, 0, 0.1];
    p.elL = [0.3, 0, 0];
    p.elR = [0.3, 0, 0];
    p.spine = [0.04, 0.06 * S(ph) * w, 0];
    return p;
  }

  function dancePose(p, t, seed, style, e) {
    const b = beatAt(t) + seed * 0.13;
    const hit = punch(t + seed * 0.04);
    const en = e === undefined ? 1 : e;
    p.knL = [0.1 + 0.18 * hit * en, 0, 0];
    p.knR = [0.1 + 0.18 * hit * en, 0, 0];
    p.hipL = [0.08 + 0.1 * hit * en, 0, 0.06];
    p.hipR = [0.08 + 0.1 * hit * en, 0, 0.06];
    p.spine = [0.05 + 0.06 * hit * en, 0.18 * S(PI * b * 0.5), 0.08 * S(PI * b)];
    p.neck = [0.05 + 0.1 * hit * en, 0.15 * S(PI * b * 0.25 + seed), 0.06 * S(PI * b * 0.5)];
    if (style === 'up') {
      p.shR = [2.7 + 0.15 * hit, 0.1, 0.25 + 0.15 * S(PI * b)];
      p.shL = [2.6 - 0.1 * hit, 0.1, 0.3];
      p.elR = [0.25 + 0.25 * hit, 0, 0];
      p.elL = [0.3, 0, 0];
    } else if (style === 'head') {
      p.shR = [2.1, 0.2, 0.9];
      p.shL = [2.1, 0.2, 0.9];
      p.elR = [2.0, 0, 0];
      p.elL = [2.0, 0, 0];
    } else if (style === 'fist') {
      p.shR = [2.2 + 0.5 * hit, 0.2, 0.2];
      p.elR = [0.9 - 0.5 * hit, 0, 0];
      p.shL = [0.4, 0, 0.2];
      p.elL = [1.3, 0, 0];
    } else if (style === 'sway') {
      p.shR = [0.5 + 0.3 * S(PI * b), 0, 0.3];
      p.shL = [0.5 - 0.3 * S(PI * b), 0, 0.3];
      p.elR = [1.3, 0, 0];
      p.elL = [1.3, 0, 0];
    } else if (style === 'cup') {
      p.shR = [0.7, -0.3, 0.2];
      p.elR = [1.6, 0, 0];
      p.shL = [0.3 + 0.2 * S(PI * b), 0, 0.3];
      p.elL = [1.2, 0, 0];
    } else {
      p.shR = [0.9 + 0.4 * S(PI * b), -0.2, 0.25];
      p.shL = [0.9 - 0.4 * S(PI * b), -0.2, 0.25];
      p.elR = [1.5, 0, 0];
      p.elL = [1.5, 0, 0];
    }
    return p;
  }

  function hero(t, o) {
    const opts = o || {};
    const mode = opts.mode || 'stand';
    const spot = opts.at || (mode === 'sit' ? HERO_SIT : HERO_STAND);
    const p = pose(spot[0], spot[1], opts.ry === undefined ? 0 : opts.ry);
    const e = energyAt(t), b = beatAt(t), hit = punch(t);
    p.spine = [0.03 + 0.05 * hit * e, 0.07 * S(b * PI * 0.5), 0.035 * S(b * PI)];
    p.neck = [-0.03 + 0.07 * hit * e + (opts.nod || 0), (opts.look || 0) + 0.08 * S(b * PI * 0.25), 0.05 * S(b * PI * 0.5) + (opts.tilt || 0)];
    p.hipL = [0.05 + 0.06 * hit * e, 0, 0.07];
    p.hipR = [0.05 + 0.06 * hit * e, 0, 0.07];
    p.knL = [0.08 + 0.14 * hit * e, 0, 0];
    p.knR = [0.08 + 0.14 * hit * e, 0, 0];
    if (mode === 'sit') {
      p.ground = false;
      p.y = -0.39;
      p.hipL = [1.5, 0, 0.12];
      p.hipR = [1.5, 0, 0.12];
      p.knL = [1.55, 0, 0];
      p.knR = [1.55, 0, 0];
      p.spine = [0.18 + 0.05 * hit * e, 0.06 * S(b * PI * 0.5), 0];
    } else if (mode === 'crouch') {
      const lean = opts.lean === undefined ? 1 : opts.lean;
      p.hipL = [1.6 * lean, 0, 0.1];
      p.hipR = [1.6 * lean, 0, 0.1];
      p.knL = [2.4 * lean, 0, 0];
      p.knR = [2.4 * lean, 0, 0];
      p.spine = [0.55 * lean + 0.02 * hit, 0, 0];
      p.neck = [-0.45 * lean + (opts.nod || 0), (opts.look || 0), opts.tilt || 0];
    } else if (mode === 'floor') {
      p.ground = false;
      p.y = -0.86;
      p.hipL = [1.35, 0, 0.3];
      p.hipR = [1.35, 0, 0.3];
      p.knL = [0.9, 0, 0];
      p.knR = [0.6, 0, 0];
      p.spine = [-0.35, 0.1 * S(t * 2), 0];
      p.neck = [-0.3, 0.2 * S(t * 1.7), 0.1];
    } else if (mode === 'walk') {
      walkPose(p, opts.phase || 0, opts.stride);
    }
    if (mode !== 'walk' || opts.gest) {
      const g = opts.g || gestureAt(opts.ts || 0, opts.gest);
      applyGesture(p, 'utsHero', g);
      wiggle(p, t, g.b, g.a === g.b ? 1 : g.w);
    }
    p.face = opts.face || singFace(t, opts.mood);
    p.blink = opts.face ? 0 : blinkAt(t, 0.11);
    const a = actor('hero', 'utsHero', p);
    if (opts.props) a.props = opts.props;
    return a;
  }

  function girl(t, o) {
    const opts = o || {};
    const spot = opts.at || GIRL_SPOT;
    const p = pose(spot[0], spot[1], opts.ry === undefined ? 0 : opts.ry);
    const b = beatAt(t), hit = punch(t, 0.12);
    p.spine = [0.02, 0.12 * S(b * PI * 0.5), 0.06 * S(b * PI)];
    p.neck = [-0.02 + (opts.nod || 0), (opts.look || 0) + 0.1 * S(b * PI * 0.25), 0.08 * S(b * PI * 0.5) + (opts.tilt || 0)];
    p.hipL = [0.04 + 0.05 * hit, 0, 0.05 + 0.04 * S(b * PI)];
    p.hipR = [0.04 + 0.05 * hit, 0, 0.05 - 0.04 * S(b * PI)];
    p.knL = [0.08 + 0.12 * hit, 0, 0];
    p.knR = [0.08 + 0.12 * hit, 0, 0];
    if (opts.mode === 'crouch') {
      const lean = opts.lean === undefined ? 1 : opts.lean;
      p.hipL = [1.5 * lean, 0, 0.12];
      p.hipR = [1.5 * lean, 0, 0.12];
      p.knL = [2.3 * lean, 0, 0];
      p.knR = [2.3 * lean, 0, 0];
      p.spine = [0.55 * lean, 0, 0];
      p.neck = [-0.45 * lean, opts.look || 0, opts.tilt || 0];
    } else if (opts.mode === 'walk') {
      walkPose(p, opts.phase || 0, 0.9);
      p.hipL[2] = 0.02;
      p.hipR[2] = 0.02;
    } else if (opts.mode === 'sit') {
      p.ground = false;
      p.y = -0.33;
      p.hipL = [1.5, 0, 0.1];
      p.hipR = [1.5, 0, 0.04];
      p.knL = [1.55, 0, 0];
      p.knR = [1.6, 0, 0];
      p.spine = [0.12, 0.05 * S(b * PI * 0.5), 0];
    }
    if (opts.mode !== 'walk') {
      const g = opts.g || gestureAt(opts.ts || 0, opts.gest);
      applyGesture(p, 'utsGirl', g);
      wiggle(p, t, g.b, g.a === g.b ? 1 : g.w);
    }
    p.hair = 0.06 * S(b * PI) + (opts.flip ? 0.2 * S(t * 6) : 0);
    p.face = opts.face || 'smile';
    p.blink = opts.face ? 0 : blinkAt(t, 0.57);
    const a = actor('girl', 'utsGirl', p);
    if (opts.props) a.props = opts.props;
    return a;
  }

  function member(id, form, t, o) {
    const opts = o || {};
    const p = pose(opts.at[0], opts.at[1], opts.ry || 0);
    const b = beatAt(t), hit = punch(t, opts.lag || 0.1);
    const e = energyAt(t);
    p.spine = [0.03 + 0.04 * hit * e, 0.05 * S(b * PI * 0.5 + (opts.seed || 0)), 0.03 * S(b * PI)];
    p.neck = [0.0 + 0.08 * hit * e + (opts.nod || 0), (opts.look || 0) + 0.06 * S(b * PI * 0.25 + (opts.seed || 0)), 0.04 * S(b * PI * 0.5)];
    p.knL = [0.06 + 0.12 * hit * e, 0, 0];
    p.knR = [0.06 + 0.12 * hit * e, 0, 0];
    p.hipL = [0.04 + 0.05 * hit * e, 0, 0.07];
    p.hipR = [0.04 + 0.05 * hit * e, 0, 0.07];
    if (opts.dance) dancePose(p, t, opts.seed || 0, opts.dance, e);
    else {
      const g = opts.g || gestureAt(opts.ts || 0, opts.gest || [[0, opts.arms || 'rest']]);
      applyGesture(p, form, g);
      wiggle(p, t, g.b, 1);
    }
    if (opts.lift) p.lift = opts.lift;
    p.face = opts.face || 'calm';
    p.blink = opts.face === 'sleep' ? 0 : blinkAt(t, (opts.seed || 0) + 0.3);
    const a = actor(id, form, p);
    if (opts.props) a.props = opts.props;
    return a;
  }

  const BAND_SPOTS = { hero: [0.1, 1.3], guitar: [-0.7, 1.02], bass: [0.9, 1.02], dj: [-0.35, 0.62], drum: [0.55, 0.62] };

  function lineup(t, ts, k) {
    const ry = 0.05;
    const v = k || 0;
    const poses = [['cross', 'pockets', 'hips', 'cross', 'chin'], ['hips', 'cross', 'pocket', 'hairR', 'cross'], ['pocket', 'hips', 'cross', 'pockets', 'thumb'], ['chest', 'pockets', 'cross', 'hips', 'ear'], ['point', 'cross', 'hips', 'pockets', 'cross']][v % 5];
    return [
      hero(t, { at: [BAND_SPOTS.hero[0], BAND_SPOTS.hero[1]], ry, gest: [[0, poses[0]]], ts, mood: 'smug' }),
      member('guitar', 'utsGuitar', t, { at: BAND_SPOTS.guitar, ry: ry + 0.2, arms: poses[1], face: 'smug', seed: 1 }),
      member('bass', 'utsBass', t, { at: BAND_SPOTS.bass, ry: ry - 0.2, arms: poses[2], face: 'calm', seed: 2 }),
      member('dj', 'utsDj', t, { at: BAND_SPOTS.dj, ry: ry + 0.1, arms: poses[3], face: 'sly', seed: 3 }),
      member('drum', 'utsDrum', t, { at: BAND_SPOTS.drum, ry: ry - 0.1, arms: poses[4], face: 'grin', seed: 4 })
    ];
  }

  function guitarist(t, at, ry, o) {
    const opts = o || {};
    const p = pose(at[0], at[1], ry);
    const b = beatAt(t), hit = punch(t);
    p.spine = [0.18 + 0.12 * hit, 0.05 * S(b * PI * 0.5), 0.03 * S(b * PI)];
    p.neck = [0.25 + 0.28 * hit, 0.1 * S(b * PI * 0.25), 0.06 * S(b * PI * 0.5)];
    p.hipL = [0.12, 0, 0.18];
    p.hipR = [0.12, 0, 0.18];
    p.knL = [0.2 + 0.12 * hit, 0, 0];
    p.knR = [0.2 + 0.12 * hit, 0, 0];
    p.hair = 0.2 * S(b * PI * 2) * 0.6;
    p.face = opts.face || (hit > 0.6 ? 'shout' : 'grit');
    p.blink = 0;
    const a = actor('guitar', 'utsGuitar', p);
    const fret = 0.25 + 0.45 * (0.5 + 0.5 * S(t * 1.3));
    const strum = 0.5 + 0.5 * C(2 * PI * (t - BEAT0) / (BEAT / 2));
    a.props.push(GK.play(p, 'utsGuitar', 'utsArrow', { strum, fret }));
    return a;
  }

  const KIT = {
    snare: [KIT_X + 0.08, 0.62, -0.62],
    hat: [KIT_X + 0.3, 0.8, -0.66],
    tom: [KIT_X - 0.05, 0.78, -0.5],
    crash: [KIT_X - 0.32, 1.05, -0.48],
    rest: [KIT_X + 0.02, 0.6, -0.72]
  };

  function drummer(t, o) {
    const opts = o || {};
    const p = pose(KIT_X, -1.15, 0);
    p.ground = false;
    p.y = -0.36;
    p.hipL = [1.4, 0, 0.14];
    p.hipR = [1.4, 0, 0.14];
    p.knL = [1.35, 0, 0];
    p.knR = [1.35, 0, 0];
    p.spine = [0.12, 0, 0];
    const b = beatAt(t);
    p.neck = [0.1 + 0.14 * punch(t), 0.05 * S(b * PI * 0.5), 0];
    p.face = opts.face || 'grin';
    p.blink = blinkAt(t, 0.9);
    const ph = frac(b * 2);
    const strokeR = Math.pow(0.5 + 0.5 * C(2 * PI * ph), 2);
    const strokeL = Math.pow(0.5 + 0.5 * C(2 * PI * (b + 0.5) * 0.5), 2);
    const arms = drummerArms();
    GK.applyArm(p, 'R', GK.mixArm(arms.R[0], arms.R[1], 1 - strokeR));
    GK.applyArm(p, 'L', GK.mixArm(arms.L[0], arms.L[1], 1 - strokeL));
    const a = actor('drum', 'utsDrum', p);
    a.sticks = [{ side: 'R', tip: [KIT.hat[0], KIT.hat[1] + 0.07 * (1 - strokeR), KIT.hat[2]] }, { side: 'L', tip: [KIT.snare[0], KIT.snare[1] + 0.07 * (1 - strokeL), KIT.snare[2]] }];
    return a;
  }

  let drumArmCache = null;
  function drummerArms() {
    if (drumArmCache) return drumArmCache;
    const p = pose(KIT_X, -1.15, 0);
    p.ground = false;
    p.y = -0.36;
    p.hipL = [1.4, 0, 0.14];
    p.hipR = [1.4, 0, 0.14];
    p.knL = [1.35, 0, 0];
    p.knR = [1.35, 0, 0];
    p.spine = [0.12, 0, 0];
    const inv = GK.invRigid(Cast.solve('utsDrum', p).torso);
    const hand = (tip, side, up) => M4.point(inv, [tip[0] + (side === 'R' ? -0.08 : 0.08), tip[1] + 0.1 + up, tip[2] - 0.22]);
    const hint = [0.75, -0.25, 0.3, 1.35];
    const pair = (tip, side) => {
      const low = GK.ik('utsDrum', side, hand(tip, side, 0), hint);
      return [low, GK.ik('utsDrum', side, hand(tip, side, 0.12), low)];
    };
    drumArmCache = { R: pair(KIT.hat, 'R'), L: pair(KIT.snare, 'L') };
    return drumArmCache;
  }

  function dancer(form, x, z, ry, t, seed, style, extra) {
    const p = pose(x, z, ry);
    dancePose(p, t, seed, style, energyAt(t));
    p.face = (extra && extra.face) || (hash(seed, 3) > 0.5 ? 'grin' : 'smile');
    p.blink = blinkAt(t, seed);
    const a = actor('d' + seed, form, p);
    if (extra && extra.props) a.props = extra.props;
    return a;
  }

  function walker(id, form, t, from, to, t0, t1, o) {
    const k = span(t, t0, t1);
    const dx = to[0] - from[0], dz = to[1] - from[1];
    const x = lerp(from[0], to[0], k), z = lerp(from[1], to[1], k);
    const p = pose(x, z, (o && o.ry !== undefined) ? o.ry : Math.atan2(dx, dz));
    const dist = Math.hypot(dx, dz) * k;
    walkPose(p, dist / 0.7 * PI, 0.2 + 0.8 * smooth(Math.min(k, 1 - k) / 0.08));
    p.face = (o && o.face) || 'calm';
    p.blink = blinkAt(t, x);
    const a = actor(id, form, p);
    if (o && o.props) a.props = o.props;
    return a;
  }

  function idle(id, form, x, z, ry, t, arms, face, seed) {
    return member(id, form, t, { at: [x, z], ry, arms, face, seed: seed || 0 });
  }

  const view = (eye, at, fov, extra) => Object.assign({ eye, at, fov: fov || 40 }, extra || {});

  function wcView(eye, at, fov, cast, extra) {
    return view(eye, at, fov, Object.assign({ set: 'wc', cast, light: { mode: 'wc' }, doors: { 0: 1.75 } }, extra || {}));
  }

  function stallClose(o) {
    return (t, u, shot) => {
      const ts = t - shot.start;
      const h = hero(t, { gest: o.g, ts, mood: o.mood, look: o.look, nod: o.nod, tilt: o.tilt, face: o.face ? o.face(ts) : undefined });
      const sx = o.side || 0;
      const eye = drift([0.5 + sx * 0.2, 1.58 + (o.dy || 0), -0.02 + (o.dz || 0)], [0.5 + sx * 0.2 + (o.dx === undefined ? 0.03 : o.dx), 1.58 + (o.dy || 0), -0.08 + (o.dz || 0)], u);
      const roll = o.roll || 0;
      return wcView(eye, [0.5 + sx * 0.03, 1.6 + (o.ay || 0), -0.75], o.fov || 36, [h], { light: { mode: 'stall' }, up: [S(roll), C(roll), 0] });
    };
  }

  function stallWide(o) {
    return (t, u, shot) => {
      const ts = t - shot.start;
      const h = hero(t, { mode: o.mode, gest: o.g, ts, mood: o.mood, look: o.look, props: o.props });
      const eye = drift(o.eye || [0.5, 1.82, 0.62], o.eye2 || [0.48, 1.8, 0.56], u);
      return wcView(eye, o.at || [0.5, 1.15, -0.9], o.fov || 50, [h], { light: { mode: 'stall' } });
    };
  }

  const PEEK_RY = PI / 2 - 0.5;
  const PEEK_F = [S(PEEK_RY), C(PEEK_RY)];
  const PEEK_EYE_AT = [0.605, -0.915];
  const PEEK_KISS_AT = [0.61, -0.952];

  function peekShot(o) {
    return (t, u, shot) => {
      const ts = t - shot.start;
      const lean = smooth(span(ts, 0, o.inT || 0.35));
      const kiss = o.kiss ? 0.5 + 0.5 * C(2 * PI * beatAt(t) * 0.5) : 0;
      const base = o.kiss ? PEEK_KISS_AT : PEEK_EYE_AT;
      const push = 0.035 * kiss - 0.08 * (1 - lean);
      const face = o.face ? o.face(ts, t) : undefined;
      const h = hero(t, { mode: 'crouch', at: [base[0] + PEEK_F[0] * push, base[1] + PEEK_F[1] * push], ry: PEEK_RY, lean: (o.kiss ? 0.97 : 1) * (0.92 + 0.08 * lean), gest: o.g || [[0, 'rest']], ts, face, mood: o.mood, look: o.look || 0, nod: o.nod || 0, props: face === 'kiss' ? [{ id: 'utsPucker', part: 'head', at: [0, -0.062, 0.104] }] : undefined });
      const close = o.close || 0;
      const low = o.kiss ? 0.05 : 0.03;
      const ex = o.kiss ? 0.9 : 0.972;
      const eye = drift([ex, 1.18 - low - close * 0.015, (o.kiss ? -0.24 : -0.3) - close * (o.kiss ? 0.05 : 0.12)], [ex, 1.17 - low - close * 0.015, (o.kiss ? -0.27 : -0.33) - close * (o.kiss ? 0.05 : 0.12)], u);
      const lick = o.lick ? smooth(span(ts, o.lick[0], o.lick[0] + 0.25)) * (1 - smooth(span(ts, o.lick[1], o.lick[1] + 0.25))) : 0;
      return wcView(eye, o.kiss ? [0.955, 1.12, -0.8] : [0.885, 1.13 - low, -0.8], o.fov || (o.kiss ? 32 : close ? 30 : 38), [h], { light: { mode: 'stall' }, doors: { 0: 1.75 }, tongue: lick ? { k: lick, t } : null });
    };
  }

  const SEE_EYE = [1.03, 1.12, -0.75];

  function seeShot(o) {
    return (t, u, shot) => {
      const ts = t - shot.start;
      const g = girl(t, Object.assign({ ts }, o.girl(ts, t)));
      return view(drift(SEE_EYE, addV(SEE_EYE, [0.02, 0, 0]), u), o.at || [1.6, 1.42, -0.82], o.fov || 62, { set: 'wc', cast: [g], light: { mode: 'girlStall' }, hole: true, doors: { 1: 0 } });
    };
  }

  function girlPose(o) {
    return (t, u, shot) => {
      const ts = t - shot.start;
      const g = girl(t, Object.assign({ ts, at: [1.5, -0.86], ry: 0 }, o.girl(ts, t)));
      return wcView(drift(o.eye, o.eye2 || o.eye, u), o.at || [1.5, 1.42, -0.86], o.fov || 40, [g], { light: { mode: 'girlStall', key: [1.5, -0.86] }, doors: { 1: 1.75 } });
    };
  }

  function girlSmile(o) {
    return (t, u, shot) => {
      const ts = t - shot.start;
      const g = girl(t, Object.assign({ ts, at: [0.6, 1.4], ry: PI }, o.girl ? o.girl(ts, t) : { face: 'smile' }));
      const far = o.far || 0;
      return wcView(drift([0.62, 1.56, 0.8 - far], [0.6, 1.55, 0.86 - far], u), [0.6, 1.52 - far * 0.2, 1.4], 30 + far * 8, [g], { light: { mode: 'backlit' } });
    };
  }

  function crowdShot(o) {
    const flip = o.mirror !== false;
    const mz = (v) => (flip ? [v[0], v[1], -v[2]] : v);
    const crowd = o.crowd === undefined ? { from: -6.5, to: 6.5 } : o.crowd && flip ? { from: -o.crowd.to, to: -o.crowd.from } : o.crowd;
    return (t, u, shot) => {
      const cast = (o.feat || []).map(([form, x, z, ry, style, extra], i) => {
        const r0 = ry === undefined ? PI : ry;
        return dancer(form, x, flip ? -z : z, flip ? PI - r0 : r0, t, (o.seed || 0) + i, style, extra);
      });
      return view(drift(mz(o.eye), mz(o.eye2 || o.eye), u), mz(o.at), o.fov || 42, { set: 'club', cast, light: { mode: 'club' }, crowd });
    };
  }

  const FEAT_A = [['utsF1', 0.2, 2.2, PI - 0.2, 'head'], ['utsM2', -0.8, 2.6, PI + 0.3, 'fist'], ['utsF2', 1.1, 2.9, PI - 0.4, 'sway'], ['utsM1', -0.2, 3.4, PI, 'up']];
  const FEAT_B = [['utsM3', 0.1, 2.3, PI + 0.2, 'cup', { face: 'smug', props: [{ id: 'utsCup', part: 'foreR', at: [0, -0.26, 0.04] }] }], ['utsF4', -0.7, 2.7, PI - 0.2, 'sway'], ['utsF3', 0.9, 2.6, PI - 0.3, 'up'], ['utsTank', -1.4, 3.2, PI, 'fist']];
  const FEAT_C = [['utsM4', 0, 2.4, PI, 'fist'], ['utsPink', -0.9, 2.8, PI + 0.2, 'up'], ['utsF1', 0.8, 3.0, PI - 0.3, 'sway'], ['utsM1', 1.6, 3.6, PI - 0.2, 'up'], ['utsF3', -1.6, 3.5, PI + 0.3, 'head']];

  function queueCast(t, k) {
    const forms = U.CROWD_FORMS;
    const out = [];
    for (let i = 0; i < 9; i++) {
      const x = -1.55 - (i % 2) * 0.55;
      const z = -0.9 + i * 0.62;
      out.push(member('q' + i, forms[(i + k) % forms.length], t, { at: [x, z], ry: PI * 0.95 + 0.4 * (hash(i, 7) - 0.5), arms: ['cross', 'pockets', 'rest', 'hips', 'chest'][i % 5], face: ['calm', 'smile', 'smug', 'calm'][i % 4], seed: i + k }));
    }
    return out;
  }

  function doorman(t, ts, o) {
    const opts = o || {};
    return member('doorman', 'utsDoorman', t, Object.assign({ at: [-1.05, -1.1], ry: 0.4, gest: opts.gest || [[0, 'board']], ts, face: 'scowl', seed: 6, props: [{ id: 'utsClipboard', part: 'foreR', at: [0, -0.28, 0.06], rot: [-1.2, 0, 0] }] }, opts));
  }

  function streetView(eye, at, fov, cast, extra) {
    return view(eye, at, fov, Object.assign({ set: 'street', cast, light: { mode: 'street' } }, extra || {}));
  }

  function bandAtBar(t, ts) {
    const ry = PI / 2 + 0.1;
    return [
      member('hero', 'utsHero', t, { at: [7.0, -1.6], ry, arms: 'sip', face: 'grin', seed: 1, props: [{ id: 'utsCup', part: 'foreR', at: [0, -0.26, 0.04] }] }),
      member('guitar', 'utsGuitar', t, { at: [6.9, -0.9], ry: ry - 0.2, arms: 'chest', face: 'smug', seed: 2 }),
      member('bass', 'utsBass', t, { at: [7.1, -2.4], ry: ry + 0.3, arms: 'hips', face: 'calm', seed: 3 }),
      member('dj', 'utsDj', t, { at: [6.6, -0.2], ry: ry - 0.4, arms: 'pocket', face: 'sly', seed: 4 }),
      member('drum', 'utsDrum', t, { at: [6.6, -3.1], ry: ry + 0.5, arms: 'cross', face: 'grin', seed: 5 })
    ];
  }

  function swapState(ts) {
    const out = { girl: null, dog: null, door: 0 };
    if (ts < 1.25) out.door = smooth(span(ts, 0.85, 1.25)) * 1.6;
    else if (ts < 4.2) out.door = 1.6;
    else out.door = 1.6 * (1 - smooth(span(ts, 4.6, 5.9)));
    if (ts > 0.9 && ts < 3.8) {
      const a = span(ts, 0.9, 2.1), b = span(ts, 2.1, 3.8);
      const at = ts < 2.1 ? [1.5, lerp(-0.6, 1.0, a)] : [lerp(1.5, -1.5, b), lerp(1.0, 1.35, b)];
      out.girl = { at, ry: lerp(0, -PI / 2 + 0.12, smooth(span(ts, 1.8, 2.4))), phase: ts * 7.6 };
    }
    const dk = span(ts, 2.9, 5.0);
    if (ts > 2.9) {
      const x = ts < 4.2 ? lerp(4.8, 1.55, span(ts, 2.9, 4.2)) : 1.55;
      const z = ts < 4.2 ? 0.75 : lerp(0.75, -0.7, span(ts, 4.2, 5.0));
      out.dog = { x, z, ry: lerp(-PI / 2, -PI, smooth(span(ts, 4.0, 4.4))), walk: 1 - smooth(span(ts, 4.8, 5.1)), phase: ts * 9, wag: ts * 12, tailUp: 0.7 };
    }
    return out;
  }

  const WORLDS = {
    lipsIntro(t, u) {
      return { macro: 'lips', eye: [0, -0.004, 0.105], at: [0, -0.002, 0], fov: 42, cast: [], light: { mode: 'white' }, lips: { open: mouthFor('girl', t), pucker: 0.15 + 0.2 * smooth(span(t, 1.6, 2.2)), smile: 0.1 } };
    },
    sign(t, u) {
      return streetView(drift([0.1, 3.3, 1.8], [0.05, 3.32, 1.55], u), [0, 3.25, -2], 36, [], { signOn: t < 2.62 ? 0.4 : t < 2.74 ? 0.1 : 1 });
    },
    queue(t, u) {
      return streetView(drift([-0.2, 1.7, 3.8], [-0.4, 1.68, 3.4], u), [-2.0, 1.4, -0.4], 46, queueCast(t, 0), { dark: 0.6 });
    },
    queueClose(t, u) {
      return streetView(drift([-0.9, 1.5, 2.4], [-1.1, 1.48, 2.2], u), [-2.2, 1.45, 0.3], 44, queueCast(t, 3), { dark: 0.65 });
    },
    curtain(t, u, shot) {
      return streetView(drift([0.8, 1.7, 1.3], [0.7, 1.68, 1.1], u), [-0.9, 1.45, -1.6], 44, queueCast(t, 5).concat([doorman(t, t - shot.start)]), { dark: 0.45 });
    },
    ropeAbove(t, u) {
      return streetView(drift([-0.6, 4.4, 2.4], [-0.7, 4.3, 2.1], u), [-1.7, 0.4, 0.4], 48, queueCast(t, 7), { dark: 0.35 });
    },
    arrive(t, u, shot) {
      const ts = t - shot.start;
      const cast = [doorman(t, ts, { gest: [[0, 'board'], [0.6, 'stop']] }), walker('hero', 'utsHero', t, [0.6, 3.2], [0.1, 0.2], shot.start - 0.4, shot.end + 0.6, { face: 'smug' }), walker('guitar', 'utsGuitar', t, [1.2, 3.8], [0.7, 0.9], shot.start - 0.4, shot.end + 0.6), walker('bass', 'utsBass', t, [-0.2, 4.2], [-0.4, 1.2], shot.start - 0.4, shot.end + 0.6)];
      return streetView(drift([1.6, 1.62, 2.4], [1.5, 1.6, 2.2], u), [-0.4, 1.45, -0.6], 40, cast, { dark: 0.2 });
    },
    toWc(t, u, shot) {
      const ts = t - shot.start;
      const h = walker('hero', 'utsHero', t, [-4.5, 3.2], [-8.7, -1.4], shot.start - 0.2, shot.end - 0.4, { face: 'calm' });
      const look = smooth(span(ts, 3.2, 4.4));
      const eye = mixV(drift([-3.2, 1.7, 5.4], [-5.6, 1.66, 2.4], span(ts, 0, 3.2)), [-8.1, 1.95, -0.6], look);
      const at = mixV(mixV([-5.5, 1.4, 2.0], [-8.9, 1.4, -1.5], smooth(span(ts, 0, 3.2))), [-9.9, 2.1, -1.95], look);
      const cast = [h, dancer('utsF1', -6.6, 2.6, 1.2, t, 301, 'sway'), dancer('utsM2', -5.2, 0.4, 0.6, t, 302, 'fist'), dancer('utsF3', -7.4, 0.9, 1.6, t, 303, 'up'), dancer('utsM4', -3.4, 1.4, 0.2, t, 304, 'sway'), dancer('utsPink', -6.4, 1.9, 2.4, t, 305, 'head')];
      return view(eye, at, lerp(48, 30, look), { set: 'club', cast, light: { mode: 'club' }, crowd: { from: -6.5, to: -3.5 } });
    },
    dance1: crowdShot({ eye: [0.4, 1.6, 0.6], eye2: [0.2, 1.62, 0.7], at: [0.2, 1.3, 3.0], fov: 46, feat: FEAT_A, seed: 0 }),
    enter(t, u, shot) {
      const h = walker('hero', 'utsHero', t, [-4.4, 1.6], [-0.2, 0.7], shot.start, shot.end + 0.4, { face: 'calm' });
      const cast = [h, idle('p1', 'utsM3', -1.6, 0.45, PI / 2, t, 'cross', 'smug', 1), idle('p2', 'utsF2', -1.15, 0.6, -PI / 2, t, 'hips', 'smile', 2), idle('p3', 'utsTank', 1.6, 1.8, -2.2, t, 'pockets', 'calm', 3)];
      return wcView(drift([3.2, 1.7, 2.6], [3.0, 1.68, 2.4], u), [-1.8, 1.25, 0.2], 46, cast, { light: { mode: 'hall', green: 1 } });
    },
    dance2: crowdShot({ eye: [-0.3, 1.45, 1.1], eye2: [-0.1, 1.48, 1.2], at: [0.3, 1.35, 3.4], fov: 40, feat: FEAT_B, seed: 10 }),
    chat(t, u) {
      const cast = [idle('p1', 'utsM1', -1.3, 0.55, 0.4, t, 'pocket', 'smile', 1), idle('p2', 'utsF3', -0.85, 0.85, PI + 0.6, t, 'cross', 'grin', 2), idle('p3', 'utsM2', 2.4, 0.6, -0.3, t, 'hips', 'calm', 3), idle('p4', 'utsF1', 2.9, 0.75, PI - 0.5, t, 'chest', 'smile', 4)];
      return wcView(drift([0.6, 1.75, 2.9], [0.4, 1.74, 2.85], u), [0.4, 1.2, -0.3], 52, cast, { light: { mode: 'hall', green: 0.6 }, doors: { '-1': 0.4, 2: 0.8 } });
    },
    shadesHead: crowdShot({ eye: [0.1, 1.62, 1.25], eye2: [0.2, 1.6, 1.3], at: [0.05, 1.56, 2.6], fov: 38, feat: [['utsM2', 0.05, 2.6, PI, 'sway', { face: 'grin' }]].concat(FEAT_A.slice(0, 2)), seed: 20, crowd: { from: 2, to: 7 } }),
    heroWalk(t, u, shot) {
      const h = walker('hero', 'utsHero', t, [-2.6, 0.9], [0.4, 0.75], shot.start - 0.3, shot.end + 0.3, { face: 'calm' });
      return wcView(drift([0.9, 1.62, 1.95], [1.2, 1.62, 1.9], u), [-1.0, 1.5, 0.82], 36, [h], { light: { mode: 'hall', green: 1 } });
    },
    heroNose(t, u, shot) {
      const ts = t - shot.start;
      const cast = [hero(t, { at: [-0.4, 0.9], ry: 0.15, gest: [[0, 'nose'], [0.9, 'rest']], ts, face: 'smug' }), member('guitar', 'utsGuitar', t, { at: [-0.95, 0.6], ry: 0.35, arms: 'cross', face: 'grin' }), member('bass', 'utsBass', t, { at: [0.3, 0.55], ry: -0.3, arms: 'hips', face: 'calm', seed: 3 })];
      return wcView(drift([-0.35, 1.62, 1.95], [-0.3, 1.62, 1.9], u), [-0.4, 1.58, 0.9], 34, cast, { light: { mode: 'hall', green: 1 } });
    },
    twoGirls(t, u, shot) {
      const cast = [walker('g1', 'utsF1', t, [4.4, 1.2], [3.5, -0.4], shot.start, shot.end, { face: 'grin' }), walker('g2', 'utsF3', t, [4.9, 1.5], [3.6, 0.1], shot.start + 0.2, shot.end + 0.3, { face: 'smile' }), walker('m1', 'utsDoorman', t, [1.5, 2.2], [-1.2, 1.4], shot.start, shot.end + 1.2)];
      return wcView(drift([0.6, 1.66, 2.6], [0.7, 1.64, 2.5], u), [3.6, 1.2, -0.2], 46, cast, { light: { mode: 'hall', green: 0.5 }, doors: { 3: 1.6 } });
    },
    busker(t, u) {
      const p = pose(3.5, -0.75, PI);
      const b = beatAt(t);
      p.neck = [0.12, 0.08 * S(b * PI * 0.5), 0];
      p.spine = [0.06, 0.05 * S(b * PI * 0.5), 0];
      p.face = 'calm';
      const a = actor('busker', 'utsBusker', p);
      a.props.push(GK.play(p, 'utsBusker', 'utsAcoustic', { strum: 0.5 + 0.5 * C(2 * PI * (t - BEAT0) / BEAT), fret: 0.4 + 0.2 * S(t * 0.9) }));
      return wcView(drift([3.5, 1.55, 0.95], [3.48, 1.6, 0.6], u), [3.5, 1.35, -0.75], 44, [a], { light: { mode: 'hall' }, doors: { 3: 1.75 } });
    },
    buskerWide(t, u, shot) {
      const p = pose(3.5, -0.75, PI);
      p.face = 'calm';
      const a = actor('busker', 'utsBusker', p);
      a.props.push(GK.play(p, 'utsBusker', 'utsAcoustic', { strum: 0.5 + 0.5 * C(2 * PI * (t - BEAT0) / BEAT), fret: 0.45 }));
      const cast = [a, walker('hero', 'utsHero', t, [0.2, 1.9], [2.2, 1.2], shot.start - 0.4, shot.end + 0.6, { face: 'smug' }), walker('m2', 'utsM3', t, [-1.5, 1.0], [1.4, 1.4], shot.start, shot.end + 1)];
      return wcView(drift([-0.6, 1.7, 2.9], [-0.5, 1.7, 2.8], u), [2.4, 1.2, -0.2], 50, cast, { light: { mode: 'hall', green: 0.4 }, doors: { 3: 1.75, 2: 0.3 } });
    },
    handsUp: crowdShot({ eye: [0.2, 2.6, 0.3], eye2: [0.1, 2.62, 0.5], at: [0.1, 0.9, 4.0], fov: 50, feat: FEAT_C.map(f => [f[0], f[1], f[2], f[3], 'up']), seed: 30 }),
    laugh: crowdShot({ eye: [0.34, 1.58, 1.2], eye2: [0.32, 1.58, 1.26], at: [0.25, 1.52, 2.4], fov: 34, feat: [['utsF1', 0.25, 2.4, PI - 0.25, 'sway', { face: 'happy' }]], seed: 40, crowd: { from: 3, to: 8 } }),
    dance3: crowdShot({ eye: [-0.6, 1.5, 0.9], eye2: [-0.4, 1.52, 1.0], at: [0.4, 1.3, 3.2], fov: 44, feat: FEAT_C, seed: 50 }),
    turn(t, u, shot) {
      const ts = t - shot.start;
      const ry = ts < 0.7 ? lerp(PI * 0.8, 0.15, smooth(ts / 0.7)) : ts < 2.9 ? 0.15 : lerp(0.15, -1.3, smooth((ts - 2.9) / 0.5));
      const h = hero(t, { ry, gest: [[0, 'rest'], [1.5, 'pointL'], [2.6, 'rest']], ts, face: ts < 1.5 ? 'surprised' : 'grin' });
      return wcView(drift([0.42, 1.6, 0.0], [0.46, 1.6, -0.04], u), [0.5, 1.6, -0.72], 34, [h], { light: { mode: 'stall', cold: true } });
    },
    inside(t, u, shot) {
      const ts = t - shot.start;
      const h = hero(t, { gest: [[0, 'chin'], [1.0, 'out']], ts, face: 'smug', ry: 0.3 * S(ts * 1.5) });
      return wcView(drift([0.5, 1.95, 0.75], [0.52, 1.9, 0.62], u), [0.5, 1.1, -0.9], 52, [h], { light: { mode: 'stall' } });
    },
    close1: stallClose({ g: [[0, 'rest'], [1.2, 'chest']], mood: 'smug', dy: -0.08 }),
    sit1: stallWide({ mode: 'sit', g: [[0, 'rest']], eye: [0.5, 2.05, 0.55], eye2: [0.5, 2.0, 0.45], at: [0.5, 0.8, -1.1], mood: 'smug' }),
    lineup1(t, u, shot) {
      return wcView(drift([0.15, 1.5, 2.95], [0.12, 1.52, 2.85], u), [0.1, 1.25, 0.8], 46, lineup(t, t - shot.start, 0), { light: { mode: 'band' }, doors: {} });
    },
    close2: stallClose({ g: [[0, 'chest']], dx: -0.02 }),
    wall1: stallWide({ g: [[0, 'outL']] }),
    reach1: stallWide({ g: [[0, 'out'], [0.6, 'point']], eye: [0.4, 1.8, 0.6] }),
    point1: stallClose({ g: [[0, 'rest'], [0.15, 'point']], mood: 'grin', dz: 0.05 }),
    wave1: stallWide({ g: [[0, 'wave'], [0.9, 'up']], mood: 'grin' }),
    spin(t, u, shot) {
      const ts = t - shot.start;
      const h = hero(t, { mode: 'floor', at: [0.42, -1.0], ry: 0.2, gest: [[0, 'up']], ts, mood: 'grin' });
      const roll = lerp(0, PI * 1.15, smooth(u));
      return wcView([0.45, 1.55, -0.62], [0.42, 0.62, -0.98], 46, [h], { light: { mode: 'stall' }, up: [S(roll), 0, -C(roll)] });
    },
    drums1(t, u, shot) {
      const roller = member('roller', 'utsRoller', t, { at: [-2.5, -0.8], ry: 0.1, arms: 'up', face: 'grin', seed: 7, dance: 'up' });
      return wcView(drift([-1.0, 1.55, 2.3], [-1.05, 1.56, 2.2], u), [-2.0, 1.1, -0.7], 48, [roller, drummer(t)], { light: { mode: 'hall', green: 0.3 }, doors: { '-3': -1.6, '-2': -1.6 } });
    },
    guitar1(t, u) {
      return wcView(drift([-1.2, 1.25, 1.35], [-1.25, 1.3, 1.3], u), [-1.55, 1.1, -0.4], 50, [guitarist(t, [-1.5, 0.45], 0.2), drummer(t)], { light: { mode: 'band' }, doors: { '-2': -1.6 } });
    },
    lineup2(t, u, shot) {
      return wcView(drift([0.6, 1.42, 2.95], [0.4, 1.45, 2.9], u), [0.1, 1.25, 0.8], 46, lineup(t, t - shot.start, 1), { light: { mode: 'band' }, doors: {} });
    },
    close3: stallClose({ g: [[0, 'rest']], mood: 'soft', nod: 0.08, roll: 0.1, face: (ts) => (ts > 0.3 && ts < 1.2 ? 'dreamy' : undefined) }),
    wide1: stallWide({ g: [[0, 'shrug']] }),
    bar1(t, u, shot) {
      return view(drift([4.6, 1.7, -1.4], [4.7, 1.7, -1.55], u), [8.6, 1.5, -1.6], 50, { set: 'club', cast: bandAtBar(t, t - shot.start), light: { mode: 'bar' }, crowd: null });
    },
    close4: stallClose({ g: [[0, 'chin']], side: 0.3, mood: 'smug' }),
    guitar2(t, u) {
      return wcView(drift([-0.9, 1.0, 1.4], [-1.0, 1.05, 1.32], u), [-1.55, 1.2, -0.2], 46, [guitarist(t, [-1.5, 0.45], -0.25), drummer(t)], { light: { mode: 'band' }, doors: { '-2': -1.6 } });
    },
    lineup3(t, u, shot) {
      return wcView(drift([-0.3, 1.5, 2.95], [-0.2, 1.5, 2.9], u), [0.1, 1.25, 0.8], 46, lineup(t, t - shot.start, 2), { light: { mode: 'band' }, doors: {} });
    },
    close5: stallClose({ g: [[0, 'rest'], [0.8, 'chest']], side: -0.25 }),
    thumb: stallClose({ g: [[0, 'rest'], [0.3, 'thumb']], mood: 'smug', look: -0.25 }),
    bar2(t, u, shot) {
      return view(drift([4.4, 1.85, -0.2], [4.5, 1.85, -0.35], u), [8.6, 1.4, -2.0], 48, { set: 'club', cast: bandAtBar(t, t - shot.start), light: { mode: 'bar' }, crowd: null });
    },
    djPhones(t, u, shot) {
      const d = member('dj', 'utsDj', t, { at: [-0.35, 0.62], ry: 0.1, gest: [[0, 'phones']], ts: t - shot.start, face: 'sly', seed: 3 });
      return wcView(drift([-0.3, 1.64, 1.36], [-0.28, 1.64, 1.32], u), [-0.35, 1.62, 0.62], 32, [d], { light: { mode: 'band' } });
    },
    sit2: stallWide({ mode: 'sit', g: [[0, 'chin']], eye: [0.5, 1.6, 0.4], eye2: [0.5, 1.58, 0.3], at: [0.5, 1.15, -1.1], fov: 44 }),
    bassShades(t, u, shot) {
      const d = member('bass', 'utsBass', t, { at: [0.9, 1.02], ry: -0.15, gest: [[0, 'glasses']], ts: t - shot.start, face: 'smug', seed: 2 });
      return wcView(drift([0.8, 1.7, 1.86], [0.82, 1.7, 1.82], u), [0.9, 1.66, 1.02], 32, [d], { light: { mode: 'band' } });
    },
    sit3: stallWide({ mode: 'sit', g: [[0, 'rest'], [0.5, 'point']], eye: [0.5, 1.9, 0.5], at: [0.5, 0.9, -1.1] }),
    guitarHair(t, u, shot) {
      const d = member('guitar', 'utsGuitar', t, { at: [-0.7, 1.02], ry: 0.25, gest: [[0, 'hairR']], ts: t - shot.start, face: 'smug', seed: 1, look: 0.2 });
      return wcView(drift([-0.62, 1.68, 1.68], [-0.6, 1.68, 1.64], u), [-0.7, 1.66, 1.02], 30, [d], { light: { mode: 'band' } });
    },
    close6: stallClose({ g: [[0, 'rest']], side: 0.2, mood: 'smug', roll: -0.08, dy: -0.1 }),
    drumFace(t, u, shot) {
      const d = member('drum', 'utsDrum', t, { at: [0.55, 0.62], ry: -0.2, gest: [[0, 'cross']], ts: t - shot.start, face: 'grin', seed: 4, nod: 0.1 });
      return wcView(drift([0.42, 1.74, 1.32], [0.44, 1.74, 1.28], u), [0.55, 1.74, 0.62], 32, [d], { light: { mode: 'band' } });
    },
    close7: stallClose({ g: [[0, 'rest']], side: -0.15 }),
    peek1: peekShot({ g: [[0, 'rest']], face: () => 'surprised', inT: 0.6 }),
    see1: seeShot({ at: [1.5, 1.12, -1.0], girl: (ts) => ({ mode: 'sit', at: [1.5, -1.18], ry: -0.25, gest: [[0, 'mirror']], face: ts > 0.6 ? 'kiss' : 'smile', props: [{ id: 'utsLipstick', part: 'foreR', at: [0, -0.26, 0.04] }] }) }),
    eye1: peekShot({ g: [[0, 'rest']], close: 1.6, face: () => 'surprised', fov: 18 }),
    close8: stallClose({ g: [[0, 'rest'], [1.0, 'chest'], [2.2, 'point']], mood: 'grin' }),
    wide2: stallWide({ g: [[0, 'pocket']], mood: 'smug' }),
    pose1: girlPose({ eye: [1.5, 1.52, 0.42], eye2: [1.52, 1.52, 0.34], girl: (ts) => ({ gest: [[0, 'hair']], face: 'smile' }) }),
    close9: stallClose({ g: [[0, 'rest'], [1.1, 'chest']], mood: 'soft', side: 0.1, dy: -0.14, fov: 40 }),
    wide3: stallWide({ g: [[0, 'out']] }),
    close10: stallClose({ g: [[0, 'pointUp']], mood: 'grin' }),
    above1(t, u, shot) {
      const h = hero(t, { gest: [[0, 'rest']], ts: t - shot.start, nod: -0.55, mood: 'grin' });
      return wcView(drift([0.5, 2.55, -0.25], [0.5, 2.5, -0.3], u), [0.5, 0.8, -1.0], 46, [h], { light: { mode: 'stall' } });
    },
    pose2: girlPose({ eye: [1.38, 1.45, 0.5], eye2: [1.4, 1.46, 0.42], at: [1.5, 1.3, -0.86], fov: 46, girl: (ts) => ({ gest: [[0, 'hips'], [1.0, 'hair']], face: ts > 1 ? 'wink' : 'smile' }) }),
    creamFace(t, u, shot) {
      const ts = t - shot.start;
      const c = member('cream', 'utsCream', t, { at: [2.5, -1.12], ry: 0, gest: [[0, 'eat']], ts, face: 'cream', seed: 8, props: [{ id: 'utsPuff', part: 'foreR', at: [0, -0.26, 0.05] }] });
      c.pose.ground = false;
      c.pose.y = -0.39;
      c.pose.hipL = [1.5, 0, 0.12];
      c.pose.hipR = [1.5, 0, 0.12];
      c.pose.knL = [1.55, 0, 0];
      c.pose.knR = [1.55, 0, 0];
      c.pose.neck = [0.1 + 0.08 * S(ts * 9), 0, 0];
      return wcView(drift([2.48, 1.22, -0.5], [2.5, 1.22, -0.55], u), [2.5, 1.18, -1.12], 34, [c], { light: { mode: 'stall', key: [2.5, -0.75] }, doors: { 2: 1.75 } });
    },
    creamWide(t, u, shot) {
      const c = member('cream', 'utsCream', t, { at: [2.5, -1.12], ry: 0, gest: [[0, 'tray']], ts: t - shot.start, face: 'cream', seed: 8, props: [{ id: 'utsTray', part: 'foreR', at: [0.1, -0.27, 0.04], rot: [PI / 2, 0, 0] }] });
      c.pose.ground = false;
      c.pose.y = -0.39;
      c.pose.hipL = [1.5, 0, 0.12];
      c.pose.hipR = [1.5, 0, 0.12];
      c.pose.knL = [1.55, 0, 0];
      c.pose.knR = [1.55, 0, 0];
      return wcView(drift([2.5, 1.85, 0.75], [2.48, 1.82, 0.6], u), [2.5, 0.9, -1.1], 50, [c], { light: { mode: 'stall', key: [2.5, -0.75] }, doors: { 2: 1.75 } });
    },
    dance4: crowdShot({ eye: [0.0, 1.62, 1.05], eye2: [0.15, 1.62, 1.1], at: [0.1, 1.5, 2.6], fov: 40, feat: FEAT_B, seed: 60 }),
    bend(t, u, shot) {
      const ts = t - shot.start;
      const h = hero(t, { mode: 'crouch', at: [0.62, -0.75], ry: PI / 2, lean: 0.4 + 0.6 * smooth(span(ts, 0.1, 0.9)), gest: [[0, 'rest']], ts, face: 'sly' });
      return wcView(drift([0.42, 1.85, 0.6], [0.44, 1.82, 0.5], u), [0.65, 1.0, -0.9], 50, [h], { light: { mode: 'stall' } });
    },
    see2: seeShot({ girl: (ts) => ({ at: [1.62, -0.85], ry: lerp(0.6, -2.0, smooth(ts / 0.7)), gest: [[0, 'out']], face: 'grin', flip: true }) }),
    peek2: peekShot({ g: [[0, 'rest']], face: () => 'smug', close: 0.6 }),
    pose3: girlPose({ eye: [1.5, 1.6, 0.95], eye2: [1.5, 1.58, 0.85], at: [1.5, 1.05, -0.86], fov: 50, girl: (ts) => ({ gest: [[0, 'hips']], face: 'smug' }) }),
    see3: seeShot({ at: [1.6, 1.12, -0.75], fov: 52, girl: (ts) => ({ mode: 'crouch', at: [1.68, -0.75], ry: -PI / 2, lean: 0.97, gest: [[0, 'rest']], face: ts < 0.5 ? 'surprised' : 'wink' }) }),
    doorOpen(t, u, shot) {
      const ts = t - shot.start;
      const h = hero(t, { gest: [[0, 'cross']], ts, mood: 'smug', face: singing(t) ? undefined : 'smug' });
      const door = smooth(span(ts, 0.5, 0.85)) * 1.75;
      return wcView(drift([0.5, 1.6, 1.5], [0.5, 1.6, 1.2], u), [0.5, 1.35, -0.6], 46, [h], { light: { mode: 'stall' }, doors: { 0: door } });
    },
    lineup4(t, u, shot) {
      return wcView(drift([0.1, 1.48, 2.98], [0.25, 1.5, 2.9], u), [0.1, 1.25, 0.8], 46, lineup(t, t - shot.start, 3), { light: { mode: 'band' }, doors: {} });
    },
    wag: stallClose({ g: [[0, 'point']], mood: 'grin', dz: 0.08 }),
    green: crowdShot({ eye: [-1.2, 1.6, 1.2], eye2: [-1.0, 1.6, 1.25], at: [-0.4, 1.5, 2.8], fov: 40, feat: [['utsM3', -0.6, 2.7, PI + 0.6, 'sway', { face: 'smug' }], ['utsF4', -0.1, 2.9, PI - 0.6, 'sway', { face: 'smile' }], ['utsPink', 0.6, 3.6, PI, 'up']], seed: 70 }),
    hippie(t, u, shot) {
      const ts = t - shot.start;
      const hp = member('hippie', 'utsHippie', t, { at: [-0.5, -0.85], ry: 0, gest: [[0, 'bowl']], ts, face: 'smile', seed: 9, props: [{ id: 'utsBowl', part: 'foreR', at: [0.1, -0.27, 0.05], rot: [PI / 2, 0, 0] }] });
      const sipA = member('sipA', 'utsSipA', t, { at: [-0.85, -0.2], ry: PI - 0.4, gest: [[0, 'sip']], ts, face: 'kiss', seed: 10 });
      const sipB = member('sipB', 'utsSipB', t, { at: [-0.15, -0.2], ry: PI + 0.4, gest: [[0, 'sip']], ts, face: 'kiss', seed: 11 });
      const clerk = walker('clerk', 'utsClerk', t, [-3.4, 1.2], [2.5, 0.2], shot.start + 2.2, shot.end + 0.3);
      const pan = smooth(span(ts, 2.6, 5.2));
      const eye = mixV(drift([-0.5, 1.6, 1.4], [-0.3, 1.6, 1.3], span(ts, 0, 2.6)), [1.2, 1.62, 2.0], pan);
      const at = mixV([-0.5, 1.35, -0.6], [2.3, 1.45, 0.3], pan);
      return wcView(eye, at, 44, [hp, sipA, sipB, clerk], { light: { mode: 'hall' }, doors: { '-1': 1.75, 2: 1.4 } });
    },
    wide4: stallWide({ g: [[0, 'pocket'], [0.8, 'point']] }),
    point2: stallClose({ g: [[0, 'point']], mood: 'grin', side: -0.1 }),
    whip(t, u, shot) {
      const c = idle('clerk', 'utsClerk', 2.5, -0.75, 0, t, 'tie', 'calm', 12);
      const yaw = lerp(-0.9, 0.35, smooth(u));
      return wcView([1.6, 1.6, 1.9], [1.6 + S(yaw) * 3, 1.4, 1.9 - C(yaw) * 3], 44, [c], { light: { mode: 'hall' }, doors: { 2: 1.0 * (1 - u) }, blur: 1 });
    },
    clerk1(t, u, shot) {
      const c = member('clerk', 'utsClerk', t, { at: [2.5, -0.8], ry: 0, gest: [[0, 'tie']], ts: t - shot.start, face: 'calm', seed: 12 });
      return wcView(drift([2.55, 1.66, 0.8], [2.52, 1.64, 0.7], u), [2.5, 1.3, -0.8], 44, [c], { light: { mode: 'stall', key: [2.5, -0.8] }, doors: { 2: 1.75 } });
    },
    close11: stallClose({ g: [[0, 'rest'], [1.0, 'chest']], side: 0.15, roll: 0.07 }),
    clerk2(t, u, shot) {
      const ts = t - shot.start;
      const opened = ts > 0.6;
      const c = member('clerk', opened ? 'utsClerkHero' : 'utsClerk', t, { at: [2.5, -0.8], ry: 0, gest: [[0, 'tie'], [0.45, 'rip'], [1.4, 'hips']], ts, face: opened ? 'grin' : 'calm', seed: 12 });
      return wcView(drift([2.5, 1.55, 0.55], [2.5, 1.56, 0.45], u), [2.5, 1.38, -0.8], 40, [c], { light: { mode: 'stall', key: [2.5, -0.8] }, doors: { 2: 1.75 } });
    },
    close12: stallClose({ g: [[0, 'stop']], mood: 'grin' }),
    close13: stallClose({ g: [[0, 'rest']], side: -0.2, mood: 'smug', dy: 0.06 }),
    clerk3(t, u, shot) {
      const ts = t - shot.start;
      const c = member('clerk', 'utsClerkHero', t, { at: [2.5, -0.8], ry: 0.15, gest: [[0, 'tie'], [1.2, 'glasses'], [2.2, 'hips']], ts, face: 'smug', seed: 12, look: 0.2 });
      return wcView(drift([2.45, 1.6, 0.55], [2.47, 1.6, 0.5], u), [2.5, 1.5, -0.8], 36, [c], { light: { mode: 'stall', key: [2.5, -0.8] }, doors: { 2: 1.75 } });
    },
    peek3: peekShot({ g: [[0, 'rest']], face: () => 'grin' }),
    see4: seeShot({ at: [1.62, 1.48, -0.82], girl: (ts) => ({ at: [1.66, -0.8], ry: -PI / 2 + 0.3, gest: [[0, 'wave']], face: 'smile' }) }),
    close14: stallClose({ g: [[0, 'rest'], [0.3, 'wave']], mood: 'grin' }),
    see5: seeShot({ fov: 70, at: [1.66, 1.36, -0.85], girl: (ts) => ({ at: [1.72, -0.85], ry: -PI / 2 + 0.6 * S(ts * 3), gest: [[0, 'hair']], face: 'grin', flip: true }) }),
    close15: stallClose({ g: [[0, 'chest']], mood: 'soft', roll: -0.1 }),
    maid(t, u, shot) {
      const m = member('maid', 'utsMaid', t, { at: [-0.5, -0.8], ry: 0.3, gest: [[0, 'pail']], ts: t - shot.start, face: 'surprised', seed: 13, look: 0.3 * S(t * 1.2), props: [{ id: 'utsPail', part: 'foreR', at: [0, -0.28, 0.02] }] });
      const cast = [m, walker('g1', 'utsF4', t, [2.4, 1.0], [-2.6, 0.8], shot.start - 0.6, shot.end + 0.8, { face: 'smile' }), walker('g2', 'utsPink', t, [3.0, 1.3], [-2.0, 1.1], shot.start - 0.4, shot.end + 1, { face: 'grin' })];
      return wcView(drift([0.9, 1.65, 2.4], [0.8, 1.64, 2.3], u), [-0.4, 1.2, -0.6], 46, cast, { light: { mode: 'hall' }, doors: { '-1': 1.75 } });
    },
    maidClose(t, u, shot) {
      const m = member('maid', 'utsMaid', t, { at: [-0.5, -0.8], ry: 0.2, gest: [[0, 'pail']], ts: t - shot.start, face: 'sad', seed: 13, look: 0.25 * S(t * 1.6), tilt: 0.15, props: [{ id: 'utsPail', part: 'foreR', at: [0, -0.28, 0.02] }] });
      return wcView(drift([-0.45, 1.6, 0.0], [-0.47, 1.6, -0.05], u), [-0.5, 1.56, -0.8], 30, [m], { light: { mode: 'stall', key: [-0.5, -0.8] }, doors: { '-1': 1.75 } });
    },
    shadesGirl: crowdShot({ eye: [0.3, 1.62, 1.6], eye2: [0.35, 1.62, 1.65], at: [0.1, 1.58, 2.6], fov: 34, feat: [['utsM3', 0.0, 2.6, PI + 0.2, 'cup', { face: 'smug', props: [{ id: 'utsCup', part: 'foreR', at: [0, -0.26, 0.04] }] }], ['utsF4', 0.55, 2.9, PI - 0.3, 'sway']], seed: 80, crowd: { from: 3, to: 8 } }),
    close16: stallClose({ g: [[0, 'rest']], mood: 'smug', side: 0.2, dy: -0.12 }),
    dance5: crowdShot({ eye: [0.5, 1.5, 1.2], eye2: [0.35, 1.52, 1.25], at: [0.0, 1.4, 3.0], fov: 42, feat: FEAT_C, seed: 90 }),
    wide5: stallWide({ g: [[0, 'chest']], mood: 'soft' }),
    dance6: crowdShot({ eye: [-0.2, 1.68, 1.6], eye2: [0.0, 1.66, 1.62], at: [0.0, 1.6, 2.8], fov: 38, feat: [['utsM1', -0.3, 2.7, PI + 0.2, 'fist'], ['utsM4', 0.4, 2.8, PI - 0.2, 'up'], ['utsTank', 0.0, 3.4, PI, 'fist']], seed: 100 }),
    close17: stallClose({ g: [[0, 'rest']], mood: 'grin', dz: 0.06 }),
    see6: seeShot({ at: [1.6, 1.52, -0.78], fov: 54, girl: (ts) => ({ at: [1.64, -0.78], ry: -PI / 2, gest: [[0, 'kissOut']], face: ts > 0.2 && ts < 0.8 ? 'kiss' : 'smile' }) }),
    peek4: peekShot({ g: [[0, 'chest']], face: () => 'grin', close: 0.4 }),
    wide6: stallWide({ g: [[0, 'up']], mood: 'grin' }),
    lineup5(t, u, shot) {
      return wcView(drift([0.1, 1.5, 2.95], [0.0, 1.5, 2.88], u), [0.1, 1.25, 0.8], 46, lineup(t, t - shot.start, 4), { light: { mode: 'band' }, doors: {} });
    },
    lips1(t) {
      return { macro: 'lips', eye: [0.004, -0.004, 0.1], at: [0, -0.003, 0], fov: 42, cast: [], light: { mode: 'macro' }, lips: { open: mouthFor('lips', t), pucker: 0.15, smile: 0.25 }, ring: 'soft' };
    },
    close18: stallClose({ g: [[0, 'rest'], [0.4, 'point']], mood: 'grin' }),
    tank(t, u) {
      const cast = [idle('tank', 'utsTank', 2.6, 0.45, PI - 0.2, t, 'hips', 'smug', 14), idle('pink', 'utsPink', 2.0, 0.6, PI + 0.6, t, 'chest', 'smile', 15)];
      return wcView(drift([1.2, 1.62, 2.4], [1.3, 1.62, 2.3], u), [2.4, 1.3, 0.2], 44, cast, { light: { mode: 'hall', green: 0.7 }, doors: { 2: 0.6, 3: 0.3 } });
    },
    blind(t, u, shot) {
      const d = member('blind', 'utsBlind', t, { at: [-0.5, -1.0], ry: 0, gest: [[0, 'hearts']], ts: t - shot.start, face: 'smile', seed: 16, look: 0.25 * S(t * 1.4), props: [{ id: 'utsHearts', part: 'foreR', at: [0.22, -0.27, 0.04] }] });
      return wcView(drift([-0.5, 1.66, -0.05], [-0.5, 1.66, -0.1], u), [-0.5, 1.5, -1.0], 38, [d], { light: { mode: 'stall', key: [-0.5, -1.0] }, doors: { '-1': 1.75 } });
    },
    speakers: crowdShot({ mirror: false, eye: [0.0, 2.2, 5.5], eye2: [0.2, 2.2, 5.3], at: [0, 1.6, -6], fov: 50, feat: [['utsF2', -0.7, 4.1, PI, 'up'], ['utsM4', 0.8, 3.9, PI, 'fist']], seed: 110, crowd: { from: -6.5, to: 3.5 } }),
    lips2(t) {
      return { macro: 'lips', eye: [-0.004, -0.003, 0.098], at: [0, -0.003, 0], fov: 40, cast: [], light: { mode: 'macro' }, lips: { open: mouthFor('lips', t), pucker: 0.3 + 0.3 * smooth(span(t, 178.8, 179.3)), smile: 0.1 }, ring: 'soft' };
    },
    party(t, u) {
      const cast = [dancer('utsF2', -0.6, 0.6, 0.8, t, 121, 'sway'), dancer('utsM4', 0.1, 0.8, PI - 0.4, t, 122, 'fist'), dancer('utsF3', 1.4, 1.0, PI + 0.3, t, 123, 'up'), dancer('utsM1', 2.2, 0.7, -0.6, t, 124, 'sway'), idle('p5', 'utsDoorman', -1.8, 1.4, 0.9, t, 'cross', 'scowl', 125)];
      return wcView(drift([-2.6, 1.7, 2.8], [-2.3, 1.7, 2.7], u), [1.0, 1.2, 0.2], 48, cast, { light: { mode: 'hall', green: 0.9 }, doors: { '-1': 0.4, 1: 0, 2: 0.7 } });
    },
    blueShirt: crowdShot({ eye: [-0.4, 1.6, 1.5], eye2: [-0.3, 1.62, 1.55], at: [0.2, 1.4, 2.8], fov: 40, feat: [['utsM1', 0.15, 2.6, PI - 0.3, 'sway', { face: 'grin' }], ['utsF1', -0.6, 3.0, PI + 0.2, 'up']], seed: 130 }),
    sleeper(t, u) {
      const p = pose(-1.5, -1.2, 0.0);
      p.spine = [0.55, 0, 0.1];
      p.neck = [0.3, 0.3, 0.2];
      GK.reach(p, 'utsSleeper', 'R', [-0.05, 0.62, 0.28]);
      GK.reach(p, 'utsSleeper', 'L', [0.2, 0.62, 0.3]);
      p.knL = [0.2, 0, 0];
      p.knR = [0.2, 0, 0];
      p.face = 'sleep';
      const a = actor('sleeper', 'utsSleeper', p);
      return wcView(drift([-1.25, 1.75, -0.2], [-1.3, 1.74, -0.25], u), [-1.5, 1.5, -1.5], 42, [a], { light: { mode: 'stall', key: [-1.5, -1.0] }, doors: { '-2': 1.75 }, noKit: true });
    },
    dance7: crowdShot({ eye: [0.6, 1.55, 1.0], eye2: [0.4, 1.55, 1.05], at: [-0.2, 1.4, 3.2], fov: 44, feat: FEAT_A, seed: 140 }),
    lips3(t) {
      return { macro: 'lips', eye: [0.0, -0.004, 0.1], at: [0, -0.002, 0], fov: 42, cast: [], light: { mode: 'macro' }, lips: { open: mouthFor('lips', t), pucker: 0.2, smile: 0.3 }, ring: 'soft' };
    },
    robotWalk(t, u, shot) {
      const ts = t - shot.start;
      const rob = idle('robot', 'utsRobot', -0.5, -0.85, 0.2, t, 'out', 'calm', 17);
      const inv = idle('inventor', 'utsInventor', -0.2, 0.5, -0.6, t, 'remote', 'smug', 18);
      inv.props = [{ id: 'utsRemote', part: 'foreR', at: [0.1, -0.27, 0.05], rot: [PI / 2, 0, 0] }];
      const cast = [rob, inv, walker('w1', 'utsF2', t, [-3.0, 1.15], [2.6, 1.0], shot.start - 0.8, shot.end + 1.5, { face: 'smile' }), walker('w2', 'utsM2', t, [3.2, 1.45], [-2.6, 1.3], shot.start - 0.5, shot.end + 1.5)];
      return wcView(drift([1.4, 1.65, 2.8], [1.2, 1.64, 2.75], u), [-0.4, 1.25, -0.4], 46, cast, { light: { mode: 'hall' }, doors: { '-1': 1.75 } });
    },
    robot(t, u, shot) {
      const ts = t - shot.start;
      const rob = member('robot', 'utsRobot', t, { at: [-0.5, -0.85], ry: 0.4, gest: [[0, 'out'], [0.6, 'pointUp'], [1.3, 'out'], [1.9, 'wave']], ts, face: 'calm', seed: 17 });
      const inv = member('inventor', 'utsInventor', t, { at: [-0.1, -0.1], ry: -0.5, gest: [[0, 'remote']], ts, face: ts > 1.2 ? 'grin' : 'smug', seed: 18, look: -0.3, props: [{ id: 'utsRemote', part: 'foreR', at: [0.1, -0.27, 0.05], rot: [PI / 2, 0, 0] }] });
      return wcView(drift([-0.25, 1.55, 1.05], [-0.3, 1.56, 1.0], u), [-0.4, 1.3, -0.55], 48, [rob, inv], { light: { mode: 'stall', key: [-0.4, -0.6] }, doors: { '-1': -1.6 } });
    },
    peek5: peekShot({ g: [[0, 'rest']], face: () => 'grin', close: 0.3 }),
    see7: seeShot({ at: [1.62, 1.48, -0.8], fov: 58, girl: (ts) => ({ at: [1.66, -0.8], ry: -PI / 2 + 0.15, gest: [[0, 'beckon']], face: 'sly' }) }),
    kiss1: peekShot({ g: [[0, 'rest']], face: () => 'kiss', kiss: true, close: 0.7 }),
    dance8: crowdShot({ eye: [0.0, 1.55, 1.2], eye2: [0.1, 1.55, 1.3], at: [0.0, 1.45, 3.0], fov: 42, feat: FEAT_B, seed: 150 }),
    swap(t, u, shot) {
      const ts = t - shot.start;
      const st = swapState(ts);
      const cast = [walker('w1', 'utsM3', t, [-2.2, 1.7], [4.6, 1.9], shot.start - 2.6, shot.start + 2.4), walker('w2', 'utsF1', t, [-2.6, 1.5], [4.2, 1.6], shot.start - 2.4, shot.start + 2.6, { face: 'smile' })];
      if (st.girl) cast.push(girl(t, { mode: 'walk', at: st.girl.at, ry: st.girl.ry, phase: st.girl.phase, face: 'smile' }));
      const pan = smooth(span(ts, 5.2, 6.2));
      const eye = mixV(drift([1.2, 1.5, 2.75], [1.4, 1.45, 2.6], span(ts, 0, 5.0)), [1.7, 1.38, 1.15], pan);
      const at = mixV(drift([1.3, 1.1, -0.4], [1.55, 0.9, -0.4], span(ts, 0, 5.0)), [1.8, 1.25, 0.05], pan);
      return wcView(eye, at, lerp(50, 34, pan), cast, { light: { mode: 'hall' }, doors: { 1: st.door, 0: 0, 2: 0 }, dogs: st.dog ? [st.dog] : [], latch: smooth(span(ts, 6.0, 6.6)) });
    },
    whisper(t, u, shot) {
      const ts = t - shot.start;
      const h = hero(t, { at: [0.3, -0.62], ry: -0.35, gest: [[0, 'rest'], [1.1, 'stop']], ts, face: ts < 1.1 ? 'surprised' : 'smug', look: 0.45, tilt: -0.12 });
      const gtr = member('guitar', 'utsGuitar', t, { at: [-0.48, -0.7], ry: PI / 2, gest: [[0, 'walls']], ts, face: 'sly', seed: 1 });
      gtr.pose.lift = 1.0;
      gtr.pose.spine = [0.55, 0.05 * S(t * 2), 0];
      gtr.pose.neck = [0.3, -0.3, 0];
      return wcView(drift([0.78, 1.72, 0.18], [0.76, 1.73, 0.13], u), [0.06, 2.12, -0.7], 50, [h, gtr], { light: { mode: 'stall' } });
    },
    wide7: stallWide({ g: [[0, 'cross']], mood: 'smug' }),
    sit4: stallWide({ mode: 'sit', g: [[0, 'chin']], eye: [0.5, 1.75, 0.45], at: [0.5, 1.0, -1.1], fov: 46 }),
    kiss2: peekShot({ g: [[0, 'rest']], face: () => 'kiss', kiss: true, close: 0.9 }),
    arms1: stallWide({ g: [[0, 'up'], [0.6, 'out']], mood: 'grin' }),
    dogEye(t) {
      return { macro: 'dog', eye: [0.105, 0.03, 0.15], at: [0.042, 0.022, 0.075], fov: 38, cast: [], light: { mode: 'macro' }, dog: { blink: frac(t * 0.6) < 0.05, look: 0.05 * S(t * 3) }, ring: 'hole' };
    },
    kiss3: peekShot({ g: [[0, 'rest']], face: () => 'kiss', kiss: true, close: 0.8 }),
    wide8: stallWide({ g: [[0, 'walls']], mood: 'grin' }),
    close19: stallClose({ g: [[0, 'rest']], mood: 'grin', roll: 0.12, side: -0.2 }),
    stop: stallClose({ g: [[0, 'rest'], [0.15, 'stop']], mood: 'grin', dz: 0.08 }),
    kiss4: peekShot({ g: [[0, 'rest']], face: () => 'kiss', kiss: true, close: 1.0 }),
    clap: stallWide({ g: [[0, 'clap']], mood: 'grin', eye: [0.5, 1.7, 0.3], eye2: [0.5, 1.7, 0.22], at: [0.5, 1.4, -0.8], fov: 44 }),
    kiss5: peekShot({ g: [[0, 'rest']], face: () => 'kiss', kiss: true, close: 0.7 }),
    wide9: stallWide({ g: [[0, 'pocket'], [0.7, 'point']] }),
    walls: stallWide({ g: [[0, 'walls']], mood: 'grin', eye: [0.5, 1.65, 0.45], at: [0.5, 1.4, -0.8], fov: 50 }),
    above2(t, u, shot) {
      const h = hero(t, { gest: [[0, 'up']], ts: t - shot.start, nod: -0.5, mood: 'grin' });
      return wcView(drift([0.5, 2.6, -0.3], [0.5, 2.55, -0.35], u), [0.5, 0.8, -0.95], 48, [h], { light: { mode: 'stall' } });
    },
    kiss6: peekShot({ g: [[0, 'rest']], face: () => 'kiss', kiss: true, close: 0.9 }),
    paper: stallWide({ g: [[0, 'tp']], mood: 'smug', props: [{ id: 'utsTp', part: 'foreR', at: [0, -0.27, 0.06] }] }),
    tongue(t) {
      const lick = 0.5 + 0.5 * S(t * 7);
      return { macro: 'dog', eye: [0.06, -0.05, 0.36], at: [0, -0.035, 0.06], fov: 46, cast: [], light: { mode: 'macro' }, dog: { tongue: 0.4 + lick, nod: 0.12 + 0.06 * lick, close: 0.03 * lick }, ring: 'hole' };
    },
    smile1: girlSmile({ girl: () => ({ face: 'smile', flip: true }) }),
    dance9: crowdShot({ eye: [-0.3, 1.6, 1.1], eye2: [-0.1, 1.62, 1.2], at: [0.2, 1.45, 3.0], fov: 42, feat: FEAT_A, seed: 160 }),
    kiss7: peekShot({ g: [[0, 'rest']], face: (ts) => (ts > 0.5 ? 'bliss' : 'kiss'), kiss: true, close: 0.8, lick: [0.25, 1.1] }),
    dance10: crowdShot({ eye: [0.4, 1.6, 1.3], eye2: [0.3, 1.6, 1.35], at: [0.0, 1.5, 2.8], fov: 40, feat: FEAT_C, seed: 170 }),
    smile2: girlSmile({ girl: (ts) => ({ face: ts > 1.8 && ts < 2.3 ? 'wink' : 'grin', look: 0.1 * S(ts) }) }),
    dance11: crowdShot({ eye: [0.0, 2.4, 0.4], eye2: [0.1, 2.38, 0.6], at: [0.0, 1.0, 4.0], fov: 48, feat: FEAT_B.map(f => [f[0], f[1], f[2], f[3], 'up']), seed: 180 }),
    exit(t, u, shot) {
      const ts = t - shot.start;
      let h;
      const walkRy = Math.atan2(0.95, 0.85);
      if (ts < 3.6) {
        h = hero(t, { at: [0.5, lerp(-0.72, -0.3, smooth(span(ts, 0.6, 1.6)))], ry: walkRy * smooth(span(ts, 3.1, 3.6)), gest: [[0, 'rest'], [0.8, 'chest'], [1.8, 'hips'], [2.8, 'rest']], ts, face: 'bliss' });
      } else if (ts < 5.0) {
        h = walker('hero', 'utsHero', t, [0.5, -0.3], [1.45, 0.55], shot.start + 3.6, shot.start + 5.0, { face: 'smug', ry: walkRy });
      } else {
        h = hero(t, { at: [1.45, 0.55], ry: lerp(walkRy, PI, smooth(span(ts, 5.0, 5.5))), gest: [[0, 'rest'], [0.6, 'knock'], [2.4, 'ear'], [3.3, 'rest']], ts: ts - 5.0, face: 'sly', look: 0.3 * smooth(span(ts, 5.0, 5.6)) });
      }
      const cast = [h, walker('w1', 'utsF3', t, [-2.6, 1.9], [4.4, 1.8], shot.start + 5.6, shot.start + 10.6, { face: 'smile' }), walker('w2', 'utsM2', t, [-3.0, 2.2], [4.0, 2.0], shot.start + 6.0, shot.start + 11.2)];
      const follow = smooth(span(ts, 3.4, 5.4));
      const eye = mixV([0.5, 1.7, 1.25], [1.05, 1.7, 2.25], follow);
      const at = mixV([0.5, 1.45, -0.4], [1.5, 1.4, 0.2], follow);
      return wcView(eye, at, 44, cast, { light: { mode: 'hall' }, doors: { 0: smooth(span(ts, 0.1, 0.6)) * 1.75, 1: 0 } });
    },
    dance12: crowdShot({ eye: [0.2, 1.3, 1.6], eye2: [0.3, 1.32, 1.65], at: [0.1, 1.2, 2.8], fov: 40, feat: [['utsF4', 0.05, 2.6, PI - 0.2, 'sway'], ['utsM3', -0.6, 3.0, PI + 0.3, 'cup']], seed: 190 }),
    pose4: girlSmile({ far: 0.45, girl: () => ({ gest: [[0, 'hair']], face: 'smile', flip: true }) }),
    dance13: crowdShot({ eye: [-0.2, 1.62, 1.5], eye2: [-0.1, 1.62, 1.55], at: [0.0, 1.55, 2.7], fov: 38, feat: FEAT_A, seed: 200 }),
    smile3: girlSmile({ girl: (ts) => ({ face: ts > 2.2 ? 'grin' : 'smile', look: -0.08 }) }),
    carpet(t, u, shot) {
      const ts = t - shot.start;
      const k = span(ts, 0, 4.2);
      const z = lerp(-0.6, 5.2, k);
      const w = walker('walker', 'utsWalker', t, [0.1, -0.6], [0.1, 5.2], shot.start, shot.start + 4.2);
      const dog = { x: 0.62, z: z - 0.15, ry: 0, walk: 1, phase: ts * 9.5, wag: ts * 11, tailUp: 0.6 };
      return streetView([0.5, 1.5, -1.75], [0.2, 0.55, 3.2], 48, [w], { dogs: [dog], leash: true, light: { mode: 'street', bright: true } });
    }
  };

  function cam(eye, at, fov, up) {
    return { eye, at, fov, up: up || [0, 1, 0], near: 0.03, far: 70 };
  }

  function solveActor(a) {
    const m = Cast.solve(a.form, a.pose);
    a.m = m;
    a.head = M4.point(m.head, [0, 0, 0]);
    a.hips = M4.point(m.hips, [0, 0, 0]);
    if (a.sticks) {
      const d = GK.dimsOf(a.form);
      a.sticks.forEach(st => { st.hand = M4.point(m['fore' + st.side], [0, -d.fore - 0.035, 0.004]); });
    }
    return a;
  }

  function worldFor(t, shot) {
    const u = span(t, shot.start, shot.end);
    const w = WORLDS[shot.cam](t, u, shot);
    const cast = w.cast || [];
    cast.forEach(solveActor);
    const camera = cam(w.eye, w.at, w.fov, w.up);
    if (w.near) camera.near = w.near;
    if (w.macro) {
      camera.near = 0.005;
      camera.far = 5;
    }
    return Object.assign({}, w, { scene: w.macro ? 'macro' : shot.scene, cast, camera, light: w.light || {}, doors: w.doors || {}, dogs: w.dogs || [] });
  }

  function stage(t, shot) {
    const sh = shot || shotAt(t);
    const st = worldFor(t, sh);
    const focus = {};
    st.cast.forEach(a => { focus[a.id] = { head: a.head, hips: a.hips }; });
    return Object.assign(st, { focus, shot: sh, beat: beatAt(t) });
  }

  const NZ = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];
  const NY = [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]];
  const glow = (c, k) => { const v = rgb(c); return [v[0], v[1], v[2], k === undefined ? 0.95 : k]; };

  function tiles(b, x0, z0, x1, z1, nx, nz, y, colA, colB) {
    const dx = (x1 - x0) / nx, dz = (z1 - z0) / nz;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const xa = x0 + i * dx, za = z0 + j * dz;
        b.quad([xa, y, za + dz], [xa + dx, y, za + dz], [xa + dx, y, za], [xa, y, za], (i + j) % 2 ? colA : colB, null, NY);
      }
    }
  }

  function wallZ(b, x0, y0, x1, y1, z, col, nz) {
    const n = [0, 0, nz || 1];
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, null, [n, n, n, n]);
  }

  function wallX(b, z0, y0, z1, y1, x, col, nx) {
    const n = [nx || 1, 0, 0];
    b.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], col, null, [n, n, n, n]);
  }

  function partition(b, x, col) {
    const z0 = -STALL_D, z1 = -0.02, y0 = 0.12, y1 = PART_H;
    [-1, 1].forEach(s => {
      const xx = x + s * 0.014;
      if (Math.abs(x - HOLE[0]) > 0.01) {
        wallX(b, z0, y0, z1, y1, xx, col, s);
        return;
      }
      const hz0 = HOLE[2] - 0.09, hz1 = HOLE[2] + 0.09, hy0 = HOLE[1] - 0.09, hy1 = HOLE[1] + 0.09;
      wallX(b, z0, y0, hz0, y1, xx, col, s);
      wallX(b, hz1, y0, z1, y1, xx, col, s);
      wallX(b, hz0, y0, hz1, hy0, xx, col, s);
      wallX(b, hz0, hy1, hz1, y1, xx, col, s);
      const n = 16;
      const sq = (a) => {
        const c = C(a), sn = S(a);
        const k = 0.09 / Math.max(Math.abs(c), Math.abs(sn));
        return [HOLE[2] + c * k, HOLE[1] + sn * k];
      };
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        const p0 = sq(a0), p1 = sq(a1);
        const nn = [s, 0, 0];
        b.quad([xx, HOLE[1] + S(a0) * HOLE_R, HOLE[2] + C(a0) * HOLE_R], [xx, HOLE[1] + S(a1) * HOLE_R, HOLE[2] + C(a1) * HOLE_R], [xx, p1[1], p1[0]], [xx, p0[1], p0[0]], col, null, [nn, nn, nn, nn]);
      }
    });
    if (Math.abs(x - HOLE[0]) < 0.01) {
      b.push(M4.translate(HOLE[0], HOLE[1], HOLE[2]), M4.rotZ(PI / 2));
      b.prism(16, HOLE_R + 0.012, HOLE_R + 0.012, -0.022, HOLE_R + 0.012, HOLE_R + 0.012, 0.022, [0.82, 0.86, 0.9, 0.2], { capTop: false });
      b.prism(16, HOLE_R, HOLE_R, -0.02, HOLE_R, HOLE_R, 0.02, [0.62, 0.66, 0.72, 0.1], { capTop: false });
      b.pop();
    }
    b.at(x, PART_H + 0.015, -STALL_D / 2, (h) => h.box(0.04, 0.03, STALL_D, 0xb8ccd8));
  }

  function toilet(b, x, z) {
    b.push(M4.translate(x, 0, z));
    b.at(0, 0.2, 0.02, (h) => h.prism(12, 0.14, 0.17, -0.2, 0.19, 0.24, 0.2, 0xf4f6f6, { capBottom: true }));
    b.at(0, 0.405, 0.04, (h) => h.prism(14, 0.2, 0.25, -0.006, 0.2, 0.25, 0.012, 0xfbfcfc));
    b.at(0, 0.41, 0.04, (h) => h.prism(14, 0.13, 0.17, -0.004, 0.13, 0.17, 0.016, 0x1e2a30, { capTop: false }));
    b.at(0, 0.43, -0.26, (h) => h.box(0.3, 0.1, 0.06, 0xfbfcfc));
    b.at(0, 0.62, -0.31, (h) => h.prism(8, 0.018, 0.018, 0, 0.018, 0.018, 0.5, [0.8, 0.84, 0.9, 0.25]));
    b.at(0, 1.14, -0.3, (h) => h.box(0.12, 0.06, 0.05, [0.82, 0.86, 0.92, 0.25]));
    b.pop();
  }

  function frameArt(b, x) {
    b.at(x, 1.62, -STALL_D + 0.012, (h) => h.box(0.46, 0.56, 0.02, 0x16161a));
  }

  function drumKit(b) {
    const SH = 0x2a2a34;
    b.push(M4.translate(KIT_X, 0.24, -0.45), M4.rotX(PI / 2));
    b.prism(16, 0.24, 0.24, -0.15, 0.24, 0.24, 0.15, SH, { capTop: false });
    b.disc(0.235, 16, 0xf2f0e8, 0.152);
    b.pop();
    [[KIT.snare, 0.13, 0.1, 0xc8c8d0], [KIT.tom, 0.1, 0.12, SH]].forEach(([p, r, h, col]) => {
      b.at(p[0], p[1] - h / 2, p[2], (c) => {
        c.prism(14, r, r, -h / 2, r, r, h / 2, col, { capTop: false });
        c.disc(r * 0.98, 14, 0xf0eee6, h / 2 + 0.002);
      });
      b.at(p[0], (p[1] - h) / 2, p[2], (c) => c.box(0.014, p[1] - h, 0.014, 0xb8b8bc));
    });
    [[KIT.hat, 0.15], [KIT.crash, 0.2]].forEach(([p, r]) => {
      b.at(p[0], p[1], p[2], (c) => c.prism(14, r, r, -0.004, 0.02, 0.02, 0.012, 0xd8b050));
      b.at(p[0], p[1] / 2, p[2], (c) => c.box(0.014, p[1], 0.014, 0xb8b8bc));
    });
    b.at(KIT_X, 0.22, -1.15, (h) => h.prism(10, 0.16, 0.16, 0.18, 0.16, 0.16, 0.24, 0x1a1a1e));
  }

  function buildWc(b) {
    tiles(b, -4.6, -STALL_D, 5.2, HALL_Z, 14, 8, 0, 0x2e3e46, 0x2a3940);
    wallZ(b, -4.6, 0, 5.2, 0.9, -STALL_D, 0x7c9cac);
    for (let i = 0; i < 7; i++) {
      const y0 = 0.9 + i * 0.2;
      wallZ(b, -4.6, y0, 5.2, y0 + 0.17, -STALL_D, i % 2 ? 0xb4c8d4 : 0xa2b8c6);
      wallZ(b, -4.6, y0 + 0.17, 5.2, y0 + 0.2, -STALL_D, 0x5a7080);
    }
    wallZ(b, -4.6, 2.3, 5.2, CEIL, -STALL_D, 0x24323a);
    STALLS.concat([4]).forEach(k => partition(b, k, k % 2 ? 0x9cc0d0 : 0x94b8c8));
    STALLS.concat([4]).forEach(k => {
      b.at(k, PART_H / 2, 0.03, (h) => h.box(0.15, PART_H, 0.1, 0x6a8a9a));
      b.at(k, 1.25, 0.085, (h) => h.box(0.036, 1.3, 0.02, [1, 1, 1, 1]));
      b.at(k, PART_H + 0.09, 0.0, (h) => h.box(0.16, 0.18, 0.12, 0x5a7686));
    });
    b.at(0.5, PART_H + 0.1, 0.03, (h) => h.box(8.2, 0.08, 0.06, 0x5a7686));
    STALLS.forEach(k => {
      toilet(b, k + 0.5, TOILET_Z);
      frameArt(b, k + 0.5);
      b.at(k + 0.04, 0.72, -0.9, (h) => h.box(0.03, 0.03, 0.14, [0.8, 0.84, 0.9, 0.2]));
      b.at(k + 0.07, 0.68, -0.9, (h) => { h.push(M4.rotZ(PI / 2)); h.prism(10, 0.05, 0.05, -0.05, 0.05, 0.05, 0.05, 0xfbfbf8, { capBottom: true }); h.pop(); });
    });
    drumKit(b);
    wallZ(b, -4.6, 0, 5.2, CEIL, HALL_Z, 0x2e4450, -1);
    b.at(0.4, 0.82, HALL_Z - 0.28, (h) => h.box(6.4, 0.08, 0.56, 0xeef2f2));
    b.at(0.4, 0.42, HALL_Z - 0.32, (h) => h.box(6.4, 0.8, 0.46, 0x3a5260));
    for (let i = 0; i < 4; i++) b.at(-2.0 + i * 1.6, 0.86, HALL_Z - 0.3, (h) => h.prism(12, 0.18, 0.13, -0.02, 0.18, 0.13, 0.01, 0xc8d4d8));
    b.at(0.4, 1.55, HALL_Z - 0.012, (h) => h.box(6.4, 1.0, 0.02, [0.55, 0.72, 0.78, 0.55]));
    b.at(0.4, 2.12, HALL_Z - 0.03, (h) => h.box(6.6, 0.05, 0.03, glow(0x40f080)));
    wallX(b, -STALL_D, 0, HALL_Z, CEIL, 5.2, 0x2a3e48, -1);
    wallX(b, -STALL_D, 0, 0.5, CEIL, -4.6, 0x2a3e48, 1);
    wallX(b, 2.6, 0, HALL_Z, CEIL, -4.6, 0x2a3e48, 1);
    wallX(b, 0.5, 2.5, 2.6, CEIL, -4.6, 0x2a3e48, 1);
    wallX(b, 0.5, 0, 2.6, 2.5, -4.75, glow(0x1a7a3a, 0.6), 1);
    b.quad([-4.6, CEIL, HALL_Z], [5.2, CEIL, HALL_Z], [5.2, CEIL, -STALL_D], [-4.6, CEIL, -STALL_D], 0x1a242a, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    for (let i = 0; i < 4; i++) b.at(-3 + i * 2.2, CEIL - 0.01, 1.6, (h) => h.box(1.2, 0.02, 0.4, [0.92, 0.98, 1.0, 1]));
  }

  function door(b) {
    b.at(0.42, 1.2, 0, (h) => h.box(0.84, 2.1, 0.03, 0xffffff));
    b.at(0.74, 1.05, 0.03, (h) => h.box(0.025, 0.14, 0.03, [0.85, 0.88, 0.92, 0.3]));
    b.at(0.74, 1.05, -0.03, (h) => h.box(0.025, 0.14, 0.03, [0.85, 0.88, 0.92, 0.3]));
    b.at(0.74, 1.25, 0.022, (h) => h.box(0.05, 0.03, 0.014, [0.85, 0.88, 0.92, 0.3]));
  }

  function speakerStack(b, x, z) {
    b.at(x, 1.4, z, (h) => h.box(1.4, 2.8, 0.6, 0x14161c));
    [[0, 0.65, 0.42], [0, 1.65, 0.42], [-0.32, 2.45, 0.16], [0.32, 2.45, 0.16]].forEach(([dx, y, r]) => b.at(x + dx, y, z + 0.31, (h) => {
      h.push(M4.rotX(PI / 2));
      h.prism(16, r, r, -0.02, r * 0.4, r * 0.4, 0.06, 0x2a2e38, { capTop: true });
      h.disc(r * 1.05, 16, 0x8a9098, -0.02);
      h.at(0, 0.07, 0, (c) => c.ellipsoid(r * 0.25, 0.04, r * 0.25, 8, 4, 0x3a3e48));
      h.pop();
    }));
  }

  function buildClub(b) {
    tiles(b, -10, -8, 10, 8, 10, 8, 0, 0x16191c, 0x121418);
    wallZ(b, -10, 0, 10, 4.5, -8, 0x161c2a);
    for (let i = 0; i < 6; i++) b.at(-7.5 + i * 3, 3.6, -7.95, (h) => h.ellipsoid(0.5, 0.5, 0.05, 12, 4, 0xf0f0f4));
    speakerStack(b, -4.5, -7.6);
    speakerStack(b, 4.5, -7.6);
    b.at(0, 1.0, -7.2, (h) => h.box(3.0, 1.1, 0.8, 0x1e2230));
    b.at(0, 1.58, -7.2, (h) => h.box(3.1, 0.06, 0.9, glow(0x30d070, 0.8)));
    wallX(b, -8, 0, 8, 4.5, 10, 0x1a1e24, -1);
    wallX(b, -8, 0, 8, 4.5, -10, 0x1c2228, 1);
    wallZ(b, -10, 0, 10, 4.5, 8, 0x1a1e24, -1);
    for (let i = 0; i < 14; i++) b.at(-3 + i * 0.44, 1.6, 7.95, (h) => h.box(0.22, 3.2, 0.06, i % 2 ? 0xf2f0ea : 0xc8202a));
    b.at(8.2, 0.55, -1.0, (h) => h.box(0.8, 1.1, 8.0, 0x3a2418));
    b.at(8.2, 1.12, -1.0, (h) => h.box(1.0, 0.06, 8.2, 0x5a3a24));
    for (let r = 0; r < 3; r++) {
      b.at(9.6, 1.5 + r * 0.6, -1.0, (h) => h.box(0.6, 0.04, 8.0, glow(0xc89040, 0.6)));
      for (let i = 0; i < 26; i++) {
        const col = [0x40c070, 0xe0a030, 0x30a0d0, 0xd04040, 0xf0d060][(i + r * 2) % 5];
        b.at(9.6 + 0.1 * S(i), 1.5 + r * 0.6 + 0.16, -4.8 + i * 0.3, (h) => h.prism(6, 0.04, 0.04, -0.13, 0.03, 0.03, 0.13, glow(col, 0.55)));
      }
    }
    for (let i = 0; i < 6; i++) b.at(7.0, 0.35, -4.0 + i * 1.2, (h) => {
      h.prism(10, 0.18, 0.18, 0.34, 0.18, 0.18, 0.4, 0x1a1a1a);
      h.box(0.04, 0.68, 0.04, 0x8a8a90);
    });
    b.at(-9.95, 1.2, -1.95, (h) => h.box(0.06, 2.3, 1.0, 0x2a5a6a));
    b.quad([-10, 4.5, 8], [10, 4.5, 8], [10, 4.5, -8], [-10, 4.5, -8], 0x0e1014, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    for (let i = 0; i < 4; i++) b.at(0, 4.2, -6 + i * 4, (h) => h.box(18, 0.12, 0.12, 0x3a3e46));
  }

  function palm(b, x, z) {
    b.at(x, 0, z, (h) => {
      h.prism(8, 0.3, 0.3, 0, 0.36, 0.36, 0.55, 0x2a2a30, { capBottom: true });
      h.prism(6, 0.05, 0.05, 0.5, 0.04, 0.04, 1.7, 0x5a4a2a);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * PI * 2;
        h.push(M4.translate(0, 1.7, 0), M4.rotY(a), M4.rotX(0.9 + 0.25 * S(i * 2.1)));
        h.quad([-0.14, 0, 0], [0.14, 0, 0], [0.04, 0.95, 0], [-0.04, 0.95, 0], i % 2 ? 0x1e5a2a : 0x2a7a36, null, NZ);
        h.pop();
      }
    });
  }

  function buildStreet(b) {
    tiles(b, -14, -2, 14, 3.2, 14, 3, 0, 0x4a4c52, 0x46484e);
    tiles(b, -14, 3.2, 14, 14, 7, 5, -0.12, 0x1c1e22, 0x1a1c20);
    b.at(0, -0.06, 3.25, (h) => h.box(28, 0.12, 0.12, 0x6a6c72));
    wallZ(b, -14, 0, -0.95, 6, -2, 0x16161c);
    wallZ(b, 0.95, 0, 14, 6, -2, 0x16161c);
    wallZ(b, -0.95, 2.7, 0.95, 6, -2, 0x16161c);
    wallZ(b, -0.95, 0, 0.95, 2.7, -2.6, glow(0xd8a060, 0.7));
    for (let i = 0; i < 8; i++) b.at(-0.84 + i * 0.24, 1.3, -2.3, (h) => h.box(0.12, 2.6, 0.04, i % 2 ? 0xf2f0ea : 0xc8202a));
    [-1, 1].forEach(s => wallX(b, -2.6, 0, -2, 2.7, s * 0.95, 0x24242c, -s));
    b.at(0, 3.25, -1.92, (h) => h.box(2.9, 1.25, 0.12, 0x0e0e12));
    b.quad([-0.8, 0.012, -2], [0.8, 0.012, -2], [0.8, 0.012, 3.2], [-0.8, 0.012, 3.2], 0xa8141e, null, NY);
    [-1, 1].forEach(s => {
      for (let i = 0; i < 6; i++) {
        const z = -1.4 + i * 0.9;
        b.at(s * 1.05, 0.48, z, (h) => {
          h.prism(8, 0.025, 0.025, -0.44, 0.025, 0.025, 0.46, [0.85, 0.82, 0.6, 0.35]);
          h.at(0, 0.5, 0, (c) => c.ellipsoid(0.05, 0.05, 0.05, 8, 4, [0.9, 0.86, 0.6, 0.4]));
          h.at(0, -0.46, 0, (c) => c.prism(10, 0.14, 0.14, -0.02, 0.14, 0.14, 0.02, [0.85, 0.82, 0.6, 0.35]));
        });
        if (i < 5) {
          for (let k = 0; k < 6; k++) {
            const f0 = k / 6, f1 = (k + 1) / 6;
            const sag = (f) => 0.82 - 0.16 * S(PI * f);
            b.quad([s * 1.05, sag(f0) + 0.025, z + 0.9 * f0], [s * 1.05, sag(f1) + 0.025, z + 0.9 * f1], [s * 1.05, sag(f1) - 0.025, z + 0.9 * f1], [s * 1.05, sag(f0) - 0.025, z + 0.9 * f0], 0x9a1020, null, [[s, 0, 0], [s, 0, 0], [s, 0, 0], [s, 0, 0]]);
          }
        }
      }
    });
    [-2.2, -3.6, -5.2, -6.8, 2.2, 3.6, 5.2, 6.8].forEach((x, i) => palm(b, x, -1.55 + (i % 2) * 0.2));
    [-6, 6].forEach(x => b.at(x, 0, 2.9, (h) => {
      h.prism(8, 0.07, 0.07, 0, 0.05, 0.05, 4.2, 0x2a2a30);
      h.at(0, 4.25, 0, (c) => c.ellipsoid(0.18, 0.12, 0.18, 8, 4, glow(0xf0e0b0)));
    }));
    wallZ(b, -40, -0.12, 40, 9, 16, 0x0a0c14, -1);
  }

  const BUILD = { wc: buildWc, club: buildClub, street: buildStreet };

  const FW = 512;
  const FH = 384;
  const MAIN = { x: 0, y: 48, w: FW, h: 288 };
  const OVER_ENV = { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0, 0, 0], fogNear: 1000, fogFar: 2000, points: [] };
  const ORTHO = new Float32Array([2 / FW, 0, 0, 0, 0, 2 / FH, 0, 0, 0, 0, -1, 0, -1, -1, 0, 1]);

  function texGlow(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, '#9a9a9a');
    g.addColorStop(0.8, '#1a1a1a');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function texSign(ctx, w, h) {
    ctx.fillStyle = '#08080c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#4aa0ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.font = `bold ${Math.round(h * 0.56)}px "Trebuchet MS", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    [[14, '#5a1a6a'], [8, '#b040d0'], [3.5, '#ffd8ff']].forEach(([lw, col]) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.strokeText('FLUSH', w * 0.46, h * 0.5);
    });
    const x = w * 0.88, y0 = h * 0.18;
    ctx.strokeStyle = '#80d0ff';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(x, y0 + i * h * 0.075, h * 0.025, 0, PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x - h * 0.06, h * 0.68);
    ctx.lineTo(x + h * 0.06, h * 0.68);
    ctx.lineTo(x + h * 0.035, h * 0.8);
    ctx.lineTo(x - h * 0.035, h * 0.8);
    ctx.closePath();
    ctx.stroke();
  }

  function texArt(ctx, w, h) {
    ctx.fillStyle = '#d8dcde';
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';
    const strokes = [[0.1, 0.2, 0.9, 0.5, 0.2, 0.9, 14, '#1a1a1e'], [0.8, 0.1, 0.2, 0.4, 0.7, 0.85, 9, '#3a3c42'], [0.2, 0.7, 0.5, 0.2, 0.9, 0.7, 6, '#0e0e10'], [0.4, 0.9, 0.6, 0.6, 0.3, 0.3, 4, '#5a5c62']];
    strokes.forEach(([x0, y0, x1, y1, x2, y2, lw, col]) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x0 * w, y0 * h);
      ctx.quadraticCurveTo(x1 * w, y1 * h, x2 * w, y2 * h);
      ctx.stroke();
    });
    [[0.3, 0.35, 0.08], [0.65, 0.62, 0.06], [0.5, 0.8, 0.05]].forEach(([x, y, r]) => {
      ctx.fillStyle = '#f8f8f8';
      ctx.beginPath();
      ctx.arc(x * w, y * h, r * w, 0, PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
  }

  function texPicto(ctx, w, h) {
    ctx.fillStyle = '#2a5a6a';
    ctx.fillRect(0, 0, w, h);
    [0.3, 0.7].forEach((x, i) => {
      ctx.fillStyle = '#2050c0';
      ctx.beginPath();
      ctx.arc(x * w, h * 0.5, w * 0.17, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4f4f4';
      ctx.beginPath();
      ctx.arc(x * w, h * 0.36, w * 0.03, 0, PI * 2);
      ctx.fill();
      if (i) {
        ctx.beginPath();
        ctx.moveTo(x * w, h * 0.41);
        ctx.lineTo(x * w + w * 0.06, h * 0.6);
        ctx.lineTo(x * w - w * 0.06, h * 0.6);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(x * w - w * 0.035, h * 0.41, w * 0.07, h * 0.17);
      }
      ctx.fillRect(x * w - w * 0.03, h * 0.58, w * 0.022, h * 0.1);
      ctx.fillRect(x * w + w * 0.008, h * 0.58, w * 0.022, h * 0.1);
    });
  }

  function lipLobe(b, upper) {
    const n = 18, m = 8;
    const W = upper ? 0.03 : 0.028;
    const pt = (i, j) => {
      const x = -W + (2 * W * i) / n;
      const f = 1 - (x / W) * (x / W);
      const ty = (upper ? 0.0038 : 0.0052) * Math.pow(Math.max(0, f), 0.6) + 0.0007;
      const tz = (upper ? 0.0055 : 0.0068) * Math.pow(Math.max(0, f), 0.5) + 0.0008;
      const yc = upper ? 0.0042 * f + 0.0008 - 0.0016 * Math.exp(-(x / 0.005) * (x / 0.005)) * (j < m / 2 ? 1 : 0.3) : -0.0045 * f - 0.0006;
      const a = (j / m) * PI;
      return { p: [x, yc + ty * C(a), tz * S(a)], n: V3.norm([0, C(a) / ty * 0.002, S(a) / tz * 0.002 + 0.15]), a };
    };
    const base = upper ? [0.72, 0.08, 0.14] : [0.78, 0.1, 0.17];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        const A = pt(i, j), Bp = pt(i + 1, j), Cp = pt(i + 1, j + 1), D = pt(i, j + 1);
        const hi = !upper && j > 1 && j < 4 ? 0.12 : upper && j > 2 && j < 5 ? 0.06 : 0;
        const col = [Math.min(1, base[0] + hi), base[1] + hi * 0.8, base[2] + hi * 0.8, 0];
        b.quad(A.p, Bp.p, Cp.p, D.p, col, null, [A.n, Bp.n, Cp.n, D.n]);
      }
    }
  }

  function macroFace(b, skin) {
    const nx = 24, ny = 18;
    const X0 = -0.08, X1 = 0.08, Y0 = -0.06, Y1 = 0.065;
    const P = (i, j) => {
      const x = X0 + ((X1 - X0) * i) / nx, y = Y0 + ((Y1 - Y0) * j) / ny;
      const z = -0.004 - (x * x) / 0.11 * 0.55 - ((y + 0.01) * (y + 0.01)) / 0.12 * 0.4;
      return [x, y, z];
    };
    const sk = rgb(skin);
    const colAt = (x, y) => {
      let k = 1;
      const fold = Math.exp(-Math.pow((Math.abs(x) - 0.042 - (y - 0.02) * 0.25) / 0.006, 2)) * (y > -0.01 && y < 0.05 ? 1 : 0);
      k -= fold * 0.18;
      k -= Math.exp(-Math.pow((y + 0.012) / 0.01, 2)) * Math.exp(-Math.pow(x / 0.03, 2)) * 0.12;
      k -= Math.exp(-Math.pow(x / 0.005, 2)) * (y > 0.008 && y < 0.03 ? 0.06 : 0);
      const nos = [-1, 1].some(s => Math.pow((x - s * 0.012) / 0.007, 2) + Math.pow((y - 0.05) / 0.004, 2) < 1);
      if (nos) k = 0.35;
      k -= Math.max(0, (Math.abs(x) - 0.05)) * 3;
      return [sk[0] * k, sk[1] * k, sk[2] * k, 0];
    };
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const a = P(i, j), c = P(i + 1, j), d = P(i + 1, j + 1), e = P(i, j + 1);
        const cols = [colAt(a[0], a[1]), colAt(c[0], c[1]), colAt(d[0], d[1]), colAt(e[0], e[1])];
        b.quad(a, c, d, e, cols, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }
    }
  }

  function ringMesh(r0, r1, n) {
    const b = new Builder();
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      b.quad([C(a0) * r0, S(a0) * r0, 0], [C(a1) * r0, S(a1) * r0, 0], [C(a1) * r1, S(a1) * r1, 0], [C(a0) * r1, S(a0) * r1, 0], [1, 1, 1, 1], null, NZ);
    }
    return b;
  }

  function create(r) {
    const X = Cast.makeCast(r);
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    const T = {
      glow: r.texture(64, texGlow, { clamp: true }),
      sign: r.texture(256, texSign, { height: 128, clamp: true }),
      art: r.texture(128, texArt, { clamp: true }),
      picto: r.texture(128, texPicto, { height: 64, clamp: true })
    };
    const texQuad = (w, h, n) => mk(b => b.quad([-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], [1, 1, 1, n === undefined ? 0.5 : n], [[0, 0], [1, 0], [1, 1], [0, 1]], NZ));
    const Q = {
      unit: mk(b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], null, NZ)),
      sprite: mk(b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], NZ)),
      sign: texQuad(2.7, 1.1, 1),
      art: texQuad(0.4, 0.5, 0.2),
      picto: texQuad(0.9, 0.45, 0.4),
      door: mk(door),
      stick: mk(b => {
        b.prism(6, 0.0075, 0.0075, 0, 0.0095, 0.0095, 1, 0xd8b880, { capBottom: true });
        b.at(0, 1.0, 0, (h) => h.ellipsoid(0.011, 0.016, 0.011, 6, 4, 0xe8d0a0));
      }),
      face: mk(b => macroFace(b, 0xf0cdb8)),
      upper: mk(b => lipLobe(b, true)),
      lower: mk(b => lipLobe(b, false)),
      mouth: mk(b => { b.push(M4.rotX(PI / 2)); b.disc(1, 16, [0.16, 0.03, 0.05, 0], 0); b.pop(); }),
      teeth: mk(b => b.box(1, 1, 0.002, [0.95, 0.94, 0.9, 0.2])),
      tongue: mk(b => b.ellipsoid(0.022, 0.008, 0.05, 8, 4, 0xe06a7a)),
      leash: mk(b => b.at(0, 0.5, 0, (h) => h.box(0.008, 1, 0.008, 0x8a1020))),
      ringIn: r.mesh(ringMesh(112, 124, 48)),
      ringRim: r.mesh(ringMesh(124, 134, 48)),
      ringOut: r.mesh(ringMesh(134, 420, 48)),
      soft: [0, 1, 2, 3, 4, 5].map(i => r.mesh(ringMesh(96 + i * 12, 108 + i * 12, 48))),
      softOut: r.mesh(ringMesh(168, 420, 48))
    };
    const D = U.dogSet(r);
    const sets = {};
    const setFor = (id) => sets[id] || (sets[id] = mk(BUILD[id]));
    let rows = null;

    function crowdRows() {
      if (rows) return rows;
      rows = [];
      const SKIN = [0xf4dcc8, 0xe8c4a0, 0xc8946a, 0x8a5a3a, 0xf0d0b8];
      const TOPS = [0x2a2a30, 0xc0283a, 0x2a9a9a, 0xf0f0ec, 0x6a9ad8, 0x16161a, 0xe868a8, 0x5a2a6a];
      const HAIRS = [0x1e1a18, 0x5a3c26, 0xe2c88a, 0x6a4028, 0x1a1618];
      for (let row = 0; row < 12; row++) {
        const z = -6.4 + row * 1.0;
        const base = new Builder(), arms = new Builder();
        const n = 16;
        for (let i = 0; i < n; i++) {
          if (hash(i, row) < 0.12) continue;
          const x = -8 + (16 * (i + 0.5)) / n + (hash(i, row + 50) - 0.5) * 0.4;
          if (Math.abs(x) < 1.6 && z > -4.4 && z < -1.5) continue;
          const zz = z + (hash(i, row + 90) - 0.5) * 0.35;
          const tall = 0.92 + hash(i, row + 3) * 0.14;
          const skin = SKIN[(i + row) % SKIN.length];
          const top = TOPS[Math.floor(hash(i, row + 7) * TOPS.length)];
          const hair = HAIRS[Math.floor(hash(i, row + 11) * HAIRS.length)];
          const place = M4.chain(M4.translate(x, 0, zz), M4.rotY(PI + (hash(i, row + 13) - 0.5) * 1.2), M4.scale(tall));
          base.push(place);
          arms.push(place);
          base.at(0, 0.42, 0, (h) => h.box(0.28, 0.84, 0.2, 0x2a3240, { faces: { top: null, bottom: null } }));
          base.at(0, 1.1, 0, (h) => h.box(0.36, 0.52, 0.22, top, { faces: { bottom: null } }));
          base.at(0, 1.52, 0, (h) => h.ellipsoid(0.1, 0.12, 0.11, 6, 3, skin));
          base.at(0, 1.58, -0.018, (h) => h.ellipsoid(0.112, 0.098, 0.116, 6, 3, hair));
          if (hash(i, row + 21) < 0.6) {
            [-1, 1].forEach(s => {
              if (s < 0 || hash(i, row + 33) < 0.6) {
                arms.at(s * 0.2, 1.62, 0.02, (h) => h.box(0.08, 0.55, 0.08, top));
                arms.at(s * 0.2, 1.93, 0.02, (h) => h.box(0.08, 0.08, 0.08, skin));
              }
            });
          }
          base.pop();
          arms.pop();
        }
        rows.push({ z, base: r.mesh(base), arms: r.mesh(arms), phase: hash(row, 99) });
      }
      return rows;
    }

    function keyDir(cm) {
      const f = V3.norm(V3.sub(cm.at, cm.eye));
      let rt = V3.cross(f, [0, 1, 0]);
      if (V3.len(rt) < 1e-3) rt = [1, 0, 0];
      rt = V3.norm(rt);
      return V3.norm(V3.add(V3.add(V3.mul(f, 0.62), V3.mul(rt, 0.42)), [0, -0.6, 0]));
    }

    function envFor(st, t) {
      const L = st.light;
      const cm = st.camera;
      const hit = punch(t);
      if (L.mode === 'white') {
        return { sunDir: [0, -0.3, -1], sunColor: [0.5, 0.5, 0.5], ambTop: [0.9, 0.9, 0.9], ambBottom: [0.8, 0.8, 0.8], fogColor: [1, 1, 1], fogNear: 4, fogFar: 9, points: [] };
      }
      if (L.mode === 'macro') {
        return { sunDir: V3.norm([-0.3, -0.6, -0.75]), sunColor: [0.6, 0.57, 0.55], ambTop: [0.36, 0.4, 0.43], ambBottom: [0.2, 0.22, 0.25], fogColor: [0.08, 0.12, 0.16], fogNear: 4, fogFar: 9, points: [] };
      }
      if (L.mode === 'street') {
        const sign = st.signOn === undefined ? 1 : st.signOn;
        if (L.bright) return { sunDir: V3.norm([0.3, -0.7, 0.6]), sunColor: [0.5, 0.48, 0.52], ambTop: [0.26, 0.28, 0.36], ambBottom: [0.1, 0.1, 0.14], fogColor: [0.03, 0.035, 0.06], fogNear: 9, fogFar: 26, points: [{ pos: [0, 2.4, 1.8], color: [1.4, 1.2, 0.9] }, { pos: [0, 1.6, -1.6], color: [1.2, 0.8, 0.5] }] };
        return { sunDir: V3.norm([0.3, -0.7, -0.6]), sunColor: [0.22, 0.24, 0.36], ambTop: [0.12, 0.14, 0.22], ambBottom: [0.05, 0.05, 0.08], fogColor: [0.02, 0.025, 0.05], fogNear: 8, fogFar: 26, points: [{ pos: [0, 3.0, -1.2], color: [1.3 * sign, 0.5 * sign, 1.5 * sign] }, { pos: [0, 1.6, -1.8], color: [0.9, 0.6, 0.35] }] };
      }
      if (L.mode === 'club' || L.mode === 'bar') {
        const pulse = 0.6 + 0.4 * hit;
        const env = { sunDir: keyDir(cm), sunColor: [0.5, 0.44, 0.52], ambTop: [0.1, 0.13, 0.17], ambBottom: [0.04, 0.05, 0.07], fogColor: [0.03, 0.04, 0.07], fogNear: 7, fogFar: 24, points: [{ pos: [cm.eye[0] - 1.5, 3.2, cm.eye[2] + 1.0], color: [0.9 * pulse, 0.25 * pulse, 0.85 * pulse] }, { pos: [cm.at[0] + 1.5, 3.0, cm.at[2]], color: [0.2 * pulse, 0.9 * pulse, 0.6 * pulse] }] };
        if (L.mode === 'bar') env.points = [{ pos: [9.3, 2.2, -1.0], color: [1.6, 1.1, 0.5] }, { pos: [5.5, 3.0, -1.0], color: [0.3, 0.7, 0.4] }];
        return env;
      }
      const kd = keyDir(cm);
      if (L.mode === 'stall' || L.mode === 'girlStall') {
        const c = L.cold ? [0.58, 0.66, 0.76] : [0.8, 0.73, 0.66];
        return { sunDir: kd, sunColor: c, ambTop: [0.3, 0.33, 0.36], ambBottom: [0.14, 0.16, 0.18], fogColor: [0.08, 0.14, 0.17], fogNear: 9, fogFar: 22, points: [{ pos: [L.key ? L.key[0] : st.cast.length && st.cast[0].head ? st.cast[0].head[0] : 0.5, 2.4, 0.2], color: [0.28, 0.36, 0.4] }] };
      }
      if (L.mode === 'backlit') {
        return { sunDir: kd, sunColor: [0.8, 0.72, 0.66], ambTop: [0.36, 0.37, 0.4], ambBottom: [0.18, 0.18, 0.2], fogColor: [0.72, 0.86, 0.94], fogNear: 1.2, fogFar: 6, points: [{ pos: [0.6, 2.0, 2.4], color: [0.8, 0.95, 1.05] }] };
      }
      const green = L.green || 0;
      return { sunDir: kd, sunColor: [0.68, 0.66, 0.64], ambTop: [0.27, 0.32 + 0.08 * green, 0.34], ambBottom: [0.12, 0.15 + 0.05 * green, 0.17], fogColor: [0.06, 0.12, 0.14], fogNear: 7, fogFar: 20, points: [{ pos: [-4.4, 1.5, 1.6], color: [0.25 * green, 1.2 * green, 0.5 * green] }, { pos: [0.5, 2.6, 1.2], color: [0.32, 0.4, 0.44] }] };
    }

    function gradeFor(st) {
      const m = st.light.mode;
      if (m === 'white') return [2.1, 2.05, 2.0, 0];
      if (m === 'club') return [0.96, 1.04, 1.0, 0.05];
      if (m === 'bar') return [1.05, 1.0, 0.85, 0.05];
      if (m === 'street') return [0.95, 0.95, 1.08, 0.05];
      if (m === 'macro') return [1.05, 1.02, 1.04, 0];
      if (st.blur) return [0.55, 0.62, 0.66, 0.2];
      return [0.93, 1.0, 1.04, 0.06];
    }

    function clearColor(st) {
      const e = envFor(st, 0);
      return e.fogColor;
    }

    function drawCrowd(st, t) {
      const c = st.crowd;
      if (!c) return;
      const e = energyAt(t);
      crowdRows().forEach(row => {
        if (row.z < (c.from === undefined ? -99 : c.from) || row.z > (c.to === undefined ? 99 : c.to)) return;
        const hop = bob(t + row.phase * 0.12) * 0.05 * e;
        r.draw(row.base, M4.translate(0, hop, 0), {});
        r.draw(row.arms, M4.translate(0, hop + 0.04 * punch(t + row.phase * 0.1), 0), {});
      });
    }

    function drawDoors(st) {
      const doors = st.doors || {};
      STALLS.forEach(k => {
        const a = doors[k] === undefined ? (k === 1 ? 0 : 0.12 * (k % 2 ? 1 : 0)) : doors[k];
        const col = k % 2 ? [0.18, 0.42, 0.48] : [0.14, 0.36, 0.34];
        r.draw(Q.door, M4.chain(M4.translate(k + 0.075, 0, 0.0), M4.rotY(-a)), { tint: col });
      });
      STALLS.forEach(k => r.draw(Q.art, M4.translate(k + 0.5, 1.62, -STALL_D + 0.024), { texture: T.art }));
      if (st.latch !== undefined) {
        const L = st.latch;
        r.draw(Q.unit, M4.chain(M4.translate(1.82, 1.25, 0.05), M4.rotZ(L * PI / 2), M4.scale(0.04, 0.012, 1), M4.translate(-0.5, -0.5, 0)), { flat: [0.85, 0.88, 0.92, 1] });
      }
    }

    function drawSticks(st) {
      st.cast.forEach(a => (a.sticks || []).forEach(sk => {
        if (!sk.hand) return;
        const dir = V3.sub(sk.tip, sk.hand);
        const len = V3.len(dir) + 0.05;
        r.draw(Q.stick, M4.chain(M4.translate(sk.hand[0], sk.hand[1], sk.hand[2]), alignY(V3.norm(dir)), M4.translate(0, -0.05, 0), M4.scale(1, len, 1)), {});
      }));
    }

    function drawDogs(st) {
      st.dogs.forEach(d => {
        const m = U.drawDog(r, D, d);
        if (st.leash) {
          const w = st.cast.find(a => a.id === 'walker');
          if (w) {
            const hand = M4.point(w.m.foreR, [0, -0.28, 0]);
            const collar = M4.point(m.head, [0, -0.06, -0.06]);
            const dir = V3.sub(collar, hand);
            r.draw(Q.leash, M4.chain(M4.translate(hand[0], hand[1], hand[2]), alignY(V3.norm(dir)), M4.scale(1, V3.len(dir), 1)), {});
          }
        }
      });
    }

    function drawTongueThrough(st) {
      if (!st.tongue) return;
      const k = st.tongue.k;
      const wig = 0.15 * S(st.tongue.t * 14);
      r.draw(Q.tongue, M4.chain(M4.translate(HOLE[0] + 0.01, HOLE[1] - 0.008, HOLE[2]), M4.rotY(-PI / 2 + wig), M4.rotX(-0.2), M4.translate(0, 0, 0.05 * k - 0.04), M4.scale(1, 1, 0.4 + k)), {});
    }

    function drawStreetDynamic(st, t) {
      const on = st.signOn === undefined ? 1 : st.signOn;
      const flick = t < 3.4 ? (frac(t * 7.3) < 0.2 ? 0.55 : 1) : 1;
      r.draw(Q.sign, M4.translate(0, 3.25, -1.85), { texture: T.sign, tint: [on * flick, on * flick, on * flick] });
      const cm = st.camera;
      [[-6, 4.25, 2.9], [6, 4.25, 2.9], [0, 3.25, -1.6]].forEach((p, i) => r.draw(Q.sprite, M4.chain(M4.translate(p[0], p[1], p[2]), billboard(cm), M4.scale(i === 2 ? 3.4 * on : 1.4)), { texture: T.glow, additive: true, tint: i === 2 ? [0.7, 0.25, 0.9] : [1, 0.85, 0.5], noFog: true, alpha: 0.55 }));
    }

    function drawClubDynamic(st, t) {
      r.draw(Q.picto, M4.chain(M4.translate(-9.9, 2.5, -1.95), M4.rotY(PI / 2)), { texture: T.picto });
      const cm = st.camera;
      const hit = punch(t);
      for (let i = 0; i < 6; i++) {
        const x = -7.5 + i * 3;
        const col = i % 2 ? [0.3, 1, 0.5] : [0.9, 0.3, 1];
        r.draw(Q.sprite, M4.chain(M4.translate(x, 3.6, -7.8), billboard(cm), M4.scale(2.2 + hit)), { texture: T.glow, additive: true, tint: col, noFog: true, alpha: 0.35 + 0.3 * hit });
      }
    }

    function drawMacro(st, t) {
      if (st.macro === 'lips') {
        const L = st.lips || {};
        const open = clamp(L.open || 0, 0, 1), pk = clamp(L.pucker || 0, 0, 1), sm = L.smile || 0;
        r.draw(Q.face, null, {});
        const sx = 1 - 0.3 * pk + 0.08 * sm;
        r.draw(Q.mouth, M4.chain(M4.translate(0, -0.0006, 0.0005), M4.scale(0.024 * sx, 0.0012 + open * 0.009, 1)), {});
        if (open > 0.2) r.draw(Q.teeth, M4.chain(M4.translate(0, 0.0004 + open * 0.0018, 0.001), M4.scale(0.026 * sx, 0.0035, 1)), {});
        r.draw(Q.upper, M4.chain(M4.translate(0, open * 0.0035 + sm * 0.0006, pk * 0.004), M4.scale(sx, 1 + pk * 0.15, 1 + pk * 0.5)), {});
        r.draw(Q.lower, M4.chain(M4.translate(0, -open * 0.0065, pk * 0.0045), M4.scale(sx, 1 + pk * 0.1, 1 + pk * 0.5)), {});
        return;
      }
      const d = st.dog || {};
      const hm = M4.chain(M4.translate(0, 0, d.close || 0), M4.rotY(d.look || 0), M4.rotX(d.nod || 0));
      r.draw(D.head, hm, {});
      if (d.tongue) r.draw(Q.tongue, M4.chain(hm, M4.translate(0, -0.052, 0.12), M4.rotX(0.3 - 0.15 * d.tongue), M4.translate(0, 0, 0.03 * d.tongue), M4.scale(1.35, 1.4, 0.7 + 0.6 * d.tongue)), {});
      if (d.blink) r.draw(Q.unit, M4.chain(hm, M4.translate(0.05, 0.034, 0.07), M4.rotY(0.9), M4.scale(0.034, 0.03, 1), M4.translate(-0.5, -0.5, 0)), { flat: [0.08, 0.07, 0.08, 1] });
    }

    let polys = 0;
    const tally = () => { polys += r.polys; r.polys = 0; };
    const over = () => {
      tally();
      r.begin(OVER_ENV, { proj: ORTHO, view: M4.ident() }, { x: 0, y: 0, w: FW, h: FH }, true);
    };
    const rect = (x, y, w, h, opts) => r.draw(Q.unit, M4.chain(M4.translate(x, y, 0), M4.scale(w, h, 1)), Object.assign({ noFog: true }, opts));
    const ringAt = (mesh, col) => r.draw(mesh, M4.translate(FW / 2, MAIN.y + MAIN.h / 2, 0), { noFog: true, flat: col, blend: col[3] < 1 });

    function drawOverlay(st, t) {
      const flash = flashAt(t);
      const dip = dipAt(t);
      const ring = st.hole ? 'hole' : st.ring;
      if (!ring && !flash && !dip && !st.blur) return;
      over();
      if (ring === 'hole') {
        ringAt(Q.ringIn, [0.04, 0.08, 0.12, 0.55]);
        ringAt(Q.ringRim, [0.42, 0.56, 0.66, 1]);
        ringAt(Q.ringOut, [0.02, 0.03, 0.05, 1]);
      } else if (ring === 'soft') {
        Q.soft.forEach((m, i) => ringAt(m, [0.16, 0.36, 0.48, 0.12 + i * 0.13]));
        ringAt(Q.softOut, [0.14, 0.32, 0.44, 0.92]);
      }
      if (st.blur) {
        for (let i = 0; i < 9; i++) rect(0, MAIN.y + (i * MAIN.h) / 9, FW, MAIN.h / 18, { flat: [0.04, 0.06, 0.08, 0.35], blend: true });
      }
      if (dip > 0) rect(0, MAIN.y, FW, MAIN.h, { flat: [0, 0, 0, dip], blend: true });
      if (flash > 0) rect(0, MAIN.y, FW, MAIN.h, { flat: [1, 1, 1, flash], blend: true });
    }

    function drawWorld(st, t) {
      if (st.scene === 'macro') {
        drawMacro(st, t);
        return;
      }
      r.draw(setFor(st.set), null, {});
      if (st.set === 'wc') {
        drawDoors(st);
        drawSticks(st);
        drawTongueThrough(st);
      } else if (st.set === 'club') {
        drawClubDynamic(st, t);
        drawCrowd(st, t);
      } else if (st.set === 'street') {
        drawStreetDynamic(st, t);
      }
      st.cast.forEach(a => Cast.drawActor(r, X, a));
      drawDogs(st);
    }

    return {
      warm() {
        Object.keys(BUILD).forEach(setFor);
        crowdRows();
        [50, 60, 61.5, 84.8, 120, 196, 230].forEach(t => stage(t));
      },
      render(t) {
        polys = 0;
        r.polys = 0;
        const shot = shotAt(t);
        const st = worldFor(t, shot);
        r.clear([0, 0, 0]);
        const env = envFor(st, t);
        st.camera.grade = gradeFor(st);
        st.camera.fx = { grain: 0.035, vignette: st.scene === 'macro' ? 0.2 : 0.55, time: t };
        if (st.dark) env.sunColor = env.sunColor.map(v => v * (1 - st.dark));
        r.begin(env, st.camera, MAIN);
        drawWorld(st, t);
        drawOverlay(st, t);
        tally();
        return { shot, polys: Math.round(polys), fade: fadeAt(t), overlay: null };
      }
    };
  }

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

  const clip = {
    id: 'uhn-tiss',
    number: 9,
    artist: 'Bloodhound Gang',
    title: 'Uhn Tiss Uhn Tiss Uhn Tiss',
    originalYear: 2005,
    audio: 'content/clip/Bloodhound Gang - Uhn Tiss Uhn Tiss Uhn Tiss.mp3',
    duration: DURATION,
    bpm: BPM,
    beat0: BEAT0,
    poster: 166.9,
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
    swapState,
    create
  };

  window.poligonClips = window.poligonClips || [];
  if (!window.poligonClips.some(c => c.id === clip.id)) window.poligonClips.push(clip);
})();
