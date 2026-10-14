(function () {
  const { M4, V3, Builder, shade, cookieMatrix, rand } = window.P3D;
  const { Figure, restPose, DIM } = window.P3DFigure;

  const BPM = 85;
  const BEAT0 = 0.105;
  const DURATION = 224.05;
  const VOICE = '9ijzzuqqpobmst7mqpjpkf640100000008jpn10trewxk6lzzumlqg08ozripjmi10c00800wpmfzujggd2i1cnnhmmwpdkg9f05g0kgib700mkhl6000ph0kh7qinntvbje2k800cld745023lheaimcmk9z9eepmvvu79rhf19h00a3mzm9lbaiyee7lr0u50nbl07kg0502z7pq0u0v89bau7zf4ohjhceo0057z7r1pd0vd50fs0rk00m6a6bp0cgarwn0qnpzddbg8zzk00w400ax000fptm0khkmygghbz3z90y88agwc00jctkkmao3o3faizby00v74106x70jgt0m0600x050fciedhcejecabe608jj2071cu630g78ze00h24z43342byihep97ol00f56hy10mh50z429c78zacz4q0p77o090q1du0m0x3bw0e7v0jzokat1cf9l0q88blb3l580j23o4i0949m770khkzd00u0j8ez0c5gzld9n95vk0050prw05u0l0ft1ea68ze0eab8p2giim1y27ugd2lcsb4b0z23ll60u0000tft26mvecokv0gmfzgs0trdt0227rgzb00r1mcdsafbcwej0kbesj0090vzr0aoa78jq0hcjazi2ff87u09mdt3z00rd80ikt643az3jnha8e0000o4wb84oojfd0782ftlpdzziyim2pzec3h1901wa09bn9d1b0000s0m4tuze9liwbgw9edaktgad0a40bqcywfz0dq1g7b0zdc6iu0dga0j0gwcp0az0j0lzau5x2k0fu9b003zgcq35aft04fsbld5zb65dx001j5bgio952cou7fv0djnz06e88y1004kb9pm6sdgq2bs0f6nbw000fz07bqoig0z5mg9r0dgo0cgaz9h0gy03ktiptsi4eikh0zbb0ei0ofd0njawqv4ee4ei90k00wz80qbc0ek0f8exthdzblp8fbm97di60e950hf0tlhfpfnbze0zsg0nm0u965a30rm8lan0tcckdl3z52p692w50li90o00gn60y7j7z20p380oa5x060o3dm26am0fx1g4x1qygq0t0npbt0s1uhal4j0igtwczjy9zdhoel0qcbrfb0l4c0mb6t3d0744t900hp0z00pilfcar8d65yhjeodby0000wbza20u44nfl0e0avah0hb9v8c7ngtzj77xlk1pv0g6iwx40rc2850000z0u56z9b0nb8nllashmoipem2295q0z00r7hbb7r9gefrakelc7r2000w0zc07rc1hdq0lcgzei0jehtii7rcuzi50wc1hjw020azpf4j779f0000vjtpnvrthqnisqmpzxpzsyrth415170050100320310315645295600000ztprqflisnkqlvtmmqtgkk900000hszmudxqrnbc5xfcd176zbg9b1030ejgbji0zrtkgtqtf0olomj97e02ocne00e963420000kfjmfsylspiikxpqin0eu0qff1fzbb018hzfi52jili80mcok03aehublw080fzad9a2fq808ff3gwahoa97za70il8x1400y0v0fs2000qf01t6kh37la0qhfkaqii1pl3jg8000jcbztreelik923fe910523840010100vfpblci7qe8wiazk30t0odcq9hb3py71h6abt4000u7z09x3f0mrjmomjudhmwkjt8lams8z00v9b0sfz0190z159nb2d0004xete90wdfldb0kmgxfm0skvo06a30qze30y0j69s0d6dvnf0tjgorce30thz08s5h8gu879b0ygbtn8ergkimu7z03xc20c0u0025z0cbh29d0003wfse8bx4bfjc0mdcwff0vnnhn90x52zb00o0oeeuafagzka6q9atk3000pqr72vaf0no0mccazl4qfjhp6albk7y00tkh0qdp5090z0qkuh5o8037ukzluqvvuyxvkzwvxwvjzvuytgie877524210000000000qrtvlzwiuwvyvywxwszwuzzvrvvn30qo40000000mojigrrrtsttnlzwsrpklzzzpd96545422wyxwupmlhgfccaa5544222111000000000000000000000000000000000000000000000000000000000000000000000';
  const VOICE_LV = Array.from(VOICE, ch => parseInt(ch, 36) / 35);
  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (x) => { const k = clamp(x, 0, 1); return k * k * (3 - 2 * k); };
  const inWin = (t, a, b) => t >= a && t < b;
  const frac = (x) => x - Math.floor(x);
  const beatAt = (t) => ((t - BEAT0) * BPM) / 60;
  const mod = (a, n) => ((a % n) + n) % n;

  const LOCATIONS = [
    { id: 'ident', name: 'Заставка', color: '#8a8f99', scene: 'ident' },
    { id: 'set', name: 'Съёмочная площадка', color: '#d9a05b', scene: 'set' },
    { id: 'roofs', name: 'Ночные крыши', color: '#2b6f9e', scene: 'roofs' },
    { id: 'vault', name: 'Хранилище', color: '#e0304e', scene: 'vault' },
    { id: 'street', name: 'Погоня', color: '#8e3fd6', scene: 'street' },
    { id: 'ring', name: 'Ринг', color: '#c64fb8', scene: 'ring' },
    { id: 'desert', name: 'Пустыня', color: '#f0a040', scene: 'desert' },
    { id: 'deep', name: 'Под водой', color: '#2fa6d8', scene: 'deep' },
    { id: 'dream', name: 'Красный сон', color: '#9c1a24', scene: 'dream' },
    { id: 'stage', name: 'Сцена', color: '#ff5f8f', scene: 'stage' },
    { id: 'lineup', name: 'Опознание', color: '#e8e8ee', scene: 'stage' },
    { id: 'burst', name: 'Комикс', color: '#f5e03a', scene: 'burst' }
  ];

  const GRADES = {
    night: [0.5, 1.35, 0.55, 1],
    thermal: [1.4, 0.72, 1.2, 0.1],
    cam: [1.45, 1.35, 1.15, 0.3],
    red: [1.3, 0.6, 0.7, 0.2]
  };

  const SHOT_LIST = [
    [0, 'ident', 'logo'], [3.37, 'set', 'camera'], [5.5, 'set', 'gear'], [6.67, 'set', 'clap'], [7.29, 'set', 'hands'],
    [8.3, 'roofs', 'nightvision', { grade: 'night', overlay: 'rec' }], [10.96, 'vault', 'sneak'], [12.87, 'roofs', 'aerial'],
    [15.2, 'roofs', 'topdown'], [17.5, 'roofs', 'shaft'], [19.92, 'vault', 'corridor'], [21.29, 'vault', 'close'],
    [22.46, 'vault', 'close2'], [24.5, 'vault', 'glance'], [26.54, 'vault', 'lasers'],
    [29.87, 'vault', 'thermal', { grade: 'thermal', overlay: 'rec' }], [31, 'vault', 'climb'], [32.17, 'vault', 'lasers2'],
    [34.17, 'vault', 'close3'], [35.8, 'vault', 'servers'], [37.12, 'vault', 'screens'], [38.5, 'street', 'garage'],
    [40.5, 'street', 'cart'], [43.79, 'street', 'neon'], [45.21, 'street', 'glasses'], [46.3, 'street', 'carSide'],
    [47.29, 'street', 'garageClose'], [48.79, 'street', 'close'], [49.62, 'street', 'chase'], [53.5, 'street', 'chaseFront'],
    [57.33, 'burst', 'pop'], [57.92, 'street', 'sparks'], [61, 'street', 'chase'], [63.79, 'street', 'inside'],
    [64.29, 'street', 'buggy'], [66.58, 'street', 'driver'], [69, 'street', 'smoke'], [71.08, 'street', 'inside'],
    [72.21, 'ring', 'entrance'], [76.08, 'burst', 'slash'], [76.58, 'ring', 'aerial'], [80, 'ring', 'orbit'],
    [83.46, 'ring', 'top'], [84.71, 'ring', 'close'], [87.08, 'ring', 'wide2'], [88.21, 'ring', 'truss'],
    [89.62, 'ring', 'robot'], [92.58, 'ring', 'robotClose'], [94, 'ring', 'crowd', { grade: 'red' }], [94.58, 'ring', 'robot2'],
    [95.83, 'ring', 'kick'], [97.42, 'ring', 'fight'], [100.96, 'ring', 'grimace'], [103.5, 'desert', 'eye'],
    [106, 'desert', 'duskRun'], [108.79, 'desert', 'duskSky'], [109.79, 'burst', 'fly'], [110.96, 'burst', 'charge'],
    [113.08, 'burst', 'whoosh'], [113.9, 'desert', 'eye'], [114.79, 'ring', 'hit'], [116, 'ring', 'scream'],
    [117.08, 'burst', 'boom'], [118.04, 'desert', 'village'], [119.17, 'desert', 'bikes'], [121, 'desert', 'rider'],
    [122.75, 'desert', 'jeepChase'], [126.3, 'desert', 'bikes2'], [129.83, 'desert', 'truck'], [131.71, 'desert', 'interior'],
    [132.83, 'desert', 'mirror'], [133.71, 'desert', 'backseat'], [134.75, 'desert', 'wheel'], [138, 'desert', 'maskClose'],
    [142.21, 'deep', 'portal'], [146.5, 'set', 'camcorder', { grade: 'cam', overlay: 'rec' }], [151.21, 'deep', 'swim'],
    [153.67, 'deep', 'swimWide'], [156.25, 'deep', 'reach'], [157.2, 'deep', 'vortex'], [158.17, 'dream', 'close'],
    [160.5, 'dream', 'spirit'], [162.79, 'dream', 'room'], [165.5, 'dream', 'spirit2'], [167.87, 'dream', 'trio'],
    [169.37, 'dream', 'run'], [170.04, 'dream', 'bridge'], [171.67, 'burst', 'splash'], [172.25, 'deep', 'debris'],
    [173.21, 'desert', 'splash'], [174.21, 'desert', 'driverGrin'], [175.71, 'stage', 'letters'], [176.42, 'burst', 'fire'],
    [177.6, 'stage', 'dance'], [180.5, 'stage', 'danceWide'], [183.5, 'stage', 'letterClose'], [184.5, 'stage', 'couch'],
    [187.71, 'desert', 'crew'], [189.6, 'desert', 'hatClose'], [191.54, 'desert', 'gate'], [192.54, 'desert', 'hatClose'],
    [193.17, 'desert', 'glider'], [193.79, 'desert', 'sunsetJeep'], [194.37, 'stage', 'comic1'], [194.96, 'stage', 'comic2'],
    [195.67, 'lineup', 'm1'], [196.29, 'lineup', 'm2'], [196.96, 'lineup', 'pair'], [197.62, 'lineup', 'm3'],
    [198.29, 'stage', 'scream'], [199, 'stage', 'letters2'], [199.71, 'stage', 'red'], [200.33, 'lineup', 'm4'],
    [201.46, 'desert', 'gate'], [202.33, 'desert', 'driverEnd'], [204.2, 'desert', 'sunsetAway'], [206.58, 'ident', 'endcard'],
    [213.33, 'ident', 'credits']
  ];

  const SHOTS = SHOT_LIST.map(([start, loc, cam, opts], i) => ({
    index: i,
    start,
    end: i + 1 < SHOT_LIST.length ? SHOT_LIST[i + 1][0] : DURATION,
    loc,
    cam,
    scene: LOCATIONS.find(l => l.id === loc).scene,
    grade: opts && opts.grade ? GRADES[opts.grade] : null,
    overlay: opts && opts.overlay ? opts.overlay : null
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

  function voiceAt(t) {
    if (t < 10.9 || t > 206.5) return 0;
    const f = t * 10;
    const i = Math.floor(f);
    const a = VOICE_LV[i] || 0, b = VOICE_LV[i + 1] || 0;
    return Math.pow(a + (b - a) * (f - i), 0.85);
  }

  function blinkAt(t, seed) {
    return frac(t * 0.31 + seed) < 0.035 ? 1 : 0;
  }

  function fadeAt(t) {
    if (t < 0.4) return 1 - t / 0.4;
    if (t > 219) return clamp((t - 219) / 4.5, 0, 1);
    return 0;
  }

  const MEMBERS = [
    { id: 'lev', name: 'ЛЁВА', color: '#ff7a1a' },
    { id: 'bo', name: 'БО', color: '#f2c21a' },
    { id: 'miro', name: 'МИРО', color: '#8a5ad0' },
    { id: 'ryzhy', name: 'РЫЖИЙ', color: '#d03a2a' },
    { id: 'teo', name: 'ТЕО', color: '#2fb8a0' },
    { id: 'niko', name: 'НИКО', color: '#3aa856' }
  ];

  const LOOKS = {
    lev: { skin: 0xf0c8a8, hair: 0x3a2418, hairStyle: 'short', top: 0xf2f2ee, collar: 0xff7a1a, cuffs: 0xff7a1a, shirtFront: 0xff7a1a, legs: 0x2a2a34, shoes: 0xff7a1a, eyes: 0x5a3a20 },
    bo: { skin: 0x5a3826, hair: 0x111111, hairStyle: 'bald', top: 0xf2c21a, sleeves: 0x1a1a1a, collar: 0x1a1a1a, legs: 0x3a4a6a, shoes: 0xeeeeee, eyes: 0x2a1a10 },
    miro: { skin: 0xf2d2b8, hair: 0x14141a, hairStyle: 'bob', top: 0x7a4ab8, collar: 0xe8e0f0, legs: 0x222228, shoes: 0x222222, specs: 0x101010, eyes: 0x3a2a20 },
    ryzhy: { skin: 0xf0c0a0, hair: 0xc05a20, hairStyle: 'bandana', hat: 0xc02020, top: 0x4a6ea8, bareArms: true, shortSleeves: true, shirtFront: 0xf2f2f2, legs: 0x1c1c22, shoes: 0x333333, eyes: 0x3a6a30 },
    teo: { skin: 0xc89068, hair: 0x2a1a10, hairStyle: 'bucket', hat: 0x2fb8a0, top: 0x1a1a22, collar: 0x2fb8a0, legs: 0x6a6a50, shoes: 0xdddddd, eyes: 0x2a1a10 },
    niko: { skin: 0x7a4a30, hair: 0x1a1210, hairStyle: 'afro', top: 0x2f9a4a, cuffs: 0xf2f2f2, collar: 0xf2f2f2, legs: 0x2f9a4a, shoes: 0xf2f2f2, eyes: 0x2a1a10 },
    robot: { robot: true, scale: 1.55, skin: 0x8a8f96, top: 0x5a5e66, sleeves: 0x9a6a3a, legs: 0x4a4e56, shoes: 0x2a2a2a, hair: 0x333333, shirtFront: 0x2a2c30, collar: 0x3a3c40 },
    biker: { skin: 0xd0a080, hair: 0x222222, hairStyle: 'helmet', hat: 0x202024, helmetFace: true, top: 0x2a2a2e, collar: 0x8a1a1a, legs: 0x1e1e22, shoes: 0x111111 },
    spirit: { skin: 0x60e8ff, hair: 0x60e8ff, hairStyle: 'long', top: 0x40c8ff, legs: 0x40c8ff, shoes: 0x40c8ff, eyes: 0xffffff }
  };

  function base(x, z, ry) {
    const p = restPose();
    p.x = x;
    p.z = z;
    p.ry = ry || 0;
    return p;
  }

  function bounce(p, b, amp = 1) {
    const k = 0.5 + 0.5 * C(2 * PI * b);
    p.knL = [0.15 + 0.22 * k * amp, 0, 0];
    p.knR = [0.15 + 0.22 * k * amp, 0, 0];
    p.hipL = [0.1 + 0.11 * k * amp, 0, 0.1];
    p.hipR = [0.1 + 0.11 * k * amp, 0, 0.1];
    p.spine = [0.08 + 0.05 * k, 0.15 * S(PI * b) * amp, 0];
    p.neck = [0.1 * k - 0.05, 0.12 * S(PI * b * 0.5), 0];
    p.shL = [0.25, 0.1, 0.25 + 0.1 * k];
    p.shR = [0.25, 0.1, 0.25 + 0.1 * k];
    p.elL = [0.9, 0, 0];
    p.elR = [0.9, 0, 0];
    return p;
  }

  function dance(p, b, mirror) {
    bounce(p, b, 1.2);
    const k = mirror ? -1 : 1;
    const s = S(PI * b) * k;
    p.x += 0.16 * s;
    p.rz = -0.05 * s;
    p.shL = [0.6 + 1.2 * Math.max(0, s), 0.5, 0.3];
    p.elL = [1.5 - 1.1 * Math.max(0, s), 0, 0];
    p.shR = [0.6 + 1.2 * Math.max(0, -s), 0.5, 0.3];
    p.elR = [1.5 - 1.1 * Math.max(0, -s), 0, 0];
    p.spine = [0.1, 0.3 * s, 0.08 * s];
    return p;
  }

  function sneak(p, b) {
    const s = S(PI * b), c = C(PI * b);
    p.hipL = [0.9 + 0.35 * s, 0, 0.1];
    p.hipR = [0.9 - 0.35 * s, 0, 0.1];
    p.knL = [1.15 + 0.3 * Math.max(0, c), 0, 0];
    p.knR = [1.15 + 0.3 * Math.max(0, -c), 0, 0];
    p.spine = [0.55, 0.1 * s, 0];
    p.neck = [-0.45, 0.2 * S(PI * b * 0.5), 0];
    p.shL = [0.7, 0.3, 0.2];
    p.elL = [1.2, 0, 0];
    p.shR = [0.7, 0.3, 0.2];
    p.elR = [1.2, 0, 0];
    return p;
  }

  function run(p, b) {
    const s = S(PI * b), c = C(PI * b);
    p.hipL = [0.2 + 0.85 * s, 0, 0.05];
    p.hipR = [0.2 - 0.85 * s, 0, 0.05];
    p.knL = [0.3 + 1.2 * Math.max(0, -c), 0, 0];
    p.knR = [0.3 + 1.2 * Math.max(0, c), 0, 0];
    p.shL = [-0.9 * s, 0, 0.15];
    p.shR = [0.9 * s, 0, 0.15];
    p.elL = [1.4, 0, 0];
    p.elR = [1.4, 0, 0];
    p.spine = [0.28, -0.15 * s, 0];
    p.neck = [-0.18, 0.1 * s, 0];
    p.lift = 0.08 * Math.abs(c);
    return p;
  }

  function sit(p, seatY, drive) {
    p.ground = false;
    p.y = seatY - 0.925;
    p.hipL = [1.45, 0, 0.12];
    p.hipR = [1.45, 0, 0.12];
    p.knL = [1.4, 0, 0];
    p.knR = [1.4, 0, 0];
    p.spine = [-0.05, 0, 0];
    if (drive) {
      p.shL = [1.1, 0.25, 0.1];
      p.elL = [0.6, 0, 0];
      p.shR = [1.1, 0.25, 0.1];
      p.elR = [0.6, 0, 0];
    } else {
      p.shL = [0.35, 0, 0.25];
      p.elL = [1.0, 0, 0];
      p.shR = [0.35, 0, 0.25];
      p.elR = [1.0, 0, 0];
    }
    return p;
  }

  function cheer(p, b) {
    const s = S(2 * PI * b);
    p.shL = [2.5 + 0.4 * s, 0, 0.3];
    p.elL = [0.4, 0, 0];
    p.shR = [2.5 - 0.4 * s, 0, 0.3];
    p.elR = [0.4, 0, 0];
    p.neck = [-0.2, 0.2 * s, 0];
    return p;
  }

  function swim(p, t, y, reach) {
    p.ground = false;
    p.pivot = 1.0;
    p.rx = 1.35;
    p.y = y;
    const s = S(t * 2.4);
    p.shL = [2.6 + 0.6 * s, 0, 0.4];
    p.shR = reach ? [3.0, 0, 0.1] : [2.6 - 0.6 * s, 0, 0.4];
    p.elL = [0.3, 0, 0];
    p.elR = reach ? [0.05, 0, 0] : [0.3, 0, 0];
    p.hipL = [0.3 * s, 0, 0.1];
    p.hipR = [-0.3 * s, 0, 0.1];
    p.knL = [0.2 + 0.25 * Math.max(0, s), 0, 0];
    p.knR = [0.2 + 0.25 * Math.max(0, -s), 0, 0];
    p.neck = [-0.7, 0, 0];
    return p;
  }

  function fly(p, y) {
    p.ground = false;
    p.pivot = 1.0;
    p.rx = 1.3;
    p.y = y;
    p.shR = [3.0, 0, 0.1];
    p.elR = [0.05, 0, 0];
    p.shL = [0.2, 0, 0.35];
    p.elL = [0.3, 0, 0];
    p.hipL = [0.05, 0, 0.05];
    p.hipR = [-0.25, 0, 0.05];
    p.knR = [0.6, 0, 0];
    p.neck = [-0.6, 0, 0];
    return p;
  }

  function fight(p, b) {
    const f = frac(b * 2);
    const left = Math.floor(b * 2) % 2 === 0;
    p.knL = [0.35, 0, 0];
    p.knR = [0.35, 0, 0];
    p.hipL = [0.35, 0, 0.18];
    p.hipR = [0.05, 0, 0.18];
    p.spine = [0.15, 0.2, 0];
    p.neck = [-0.1, -0.2, 0];
    p.shL = [1.1, 0.5, 0.1];
    p.elL = [2.0, 0, 0];
    p.shR = [1.1, 0.5, 0.1];
    p.elR = [2.0, 0, 0];
    if (f < 0.35) {
      const k = S((f / 0.35) * PI);
      if (left) { p.shL = [1.1 + 0.45 * k, 0.5 - 0.4 * k, 0.1]; p.elL = [2.0 - 1.9 * k, 0, 0]; }
      else { p.shR = [1.1 + 0.45 * k, 0.5 - 0.4 * k, 0.1]; p.elR = [2.0 - 1.9 * k, 0, 0]; p.spine = [0.15, 0.2 - 0.5 * k, 0]; }
    }
    return p;
  }

  function kick(p, f) {
    const k = S(PI * clamp(f, 0, 1));
    p.hipR = [1.7 * k, 0, 0.1];
    p.knR = [1.4 * (1 - k), 0, 0];
    p.knL = [0.2, 0, 0];
    p.shL = [0.5, 0, 1.1];
    p.shR = [0.5, 0, 1.1];
    p.elL = [0.3, 0, 0];
    p.elR = [0.3, 0, 0];
    p.spine = [-0.25 * k, 0, 0];
    return p;
  }

  function robotSwing(p, b, amp = 1) {
    const s = S(PI * b);
    p.shR = [1.1 + 0.9 * s * amp, -0.2, 0.35 + 0.4 * Math.max(0, -s)];
    p.elR = [0.5, 0, 0];
    p.shL = [1.1 - 0.9 * s * amp, -0.2, 0.35 + 0.4 * Math.max(0, s)];
    p.elL = [0.5, 0, 0];
    p.knL = [0.35, 0, 0];
    p.knR = [0.35, 0, 0];
    p.hipL = [0.2, 0, 0.25];
    p.hipR = [0.2, 0, 0.25];
    p.spine = [0.2, 0.35 * s, 0];
    p.neck = [0.1, -0.2 * s, 0];
    return p;
  }

  function scared(p) {
    p.spine = [-0.2, 0, 0];
    p.shL = [2.2, 0.7, 0.3];
    p.elL = [1.9, 0, 0];
    p.shR = [2.2, 0.7, 0.3];
    p.elR = [1.9, 0, 0];
    p.knL = [0.3, 0, 0];
    p.knR = [0.3, 0, 0];
    p.hipL = [0.1, 0, 0.1];
    p.hipR = [0.1, 0, 0.1];
    return p;
  }

  function scream(p) {
    p.neck = [-0.5, 0, 0];
    p.shL = [0.6, 0, 1.3];
    p.shR = [0.6, 0, 1.3];
    p.elL = [0.3, 0, 0];
    p.elR = [0.3, 0, 0];
    p.spine = [-0.2, 0, 0];
    p.mouth = 1;
    return p;
  }

  function poseCool(p) {
    p.shL = [2.9, 0.4, 0.7];
    p.elL = [2.3, 0, 0];
    p.shR = [2.9, 0.4, 0.7];
    p.elR = [2.3, 0, 0];
    p.hipL = [0, 0, 0.18];
    p.hipR = [0, 0, 0.18];
    p.neck = [-0.1, 0.2, 0];
    return p;
  }

  function holdFront(p) {
    p.shL = [0.85, 0.5, 0.05];
    p.elL = [1.05, 0, 0];
    p.shR = [0.85, 0.5, 0.05];
    p.elR = [1.05, 0, 0];
    return p;
  }

  function holdCam(p) {
    p.shR = [1.25, 0.6, 0.15];
    p.elR = [1.95, 0, 0];
    p.shL = [1.0, 0.7, 0.1];
    p.elL = [1.9, 0, 0];
    p.neck = [0.05, 0, 0];
    return p;
  }

  function jumpArc(p, f, height) {
    p.ground = false;
    p.y = height * S(PI * clamp(f, 0, 1));
    const k = S(PI * clamp(f, 0, 1));
    p.hipL = [1.1 * k, 0, 0.15];
    p.hipR = [0.3 * k, 0, 0.15];
    p.knL = [1.4 * k, 0, 0];
    p.knR = [0.6 * k, 0, 0];
    p.shL = [2.8, 0, 0.5];
    p.shR = [2.8, 0, 0.5];
    return p;
  }

  function limbo(p, k) {
    p.spine = [-1.05 * k, 0, 0];
    p.knL = [1.3 * k, 0, 0];
    p.knR = [1.3 * k, 0, 0];
    p.hipL = [-0.1 * k, 0, 0.3];
    p.hipR = [-0.1 * k, 0, 0.3];
    p.neck = [0.3 * k, 0, 0];
    p.shL = [0.3, 0, 1.2 * k];
    p.shR = [0.3, 0, 1.2 * k];
    return p;
  }

  function cartwheel(p, f) {
    p.ground = false;
    p.pivot = 1.0;
    p.rz = 2 * PI * ease(f);
    p.y = 0.25 * S(PI * f);
    p.shL = [0, 0, 2.9];
    p.shR = [0, 0, 2.9];
    p.elL = [0.05, 0, 0];
    p.elR = [0.05, 0, 0];
    p.hipL = [0, 0, 0.6];
    p.hipR = [0, 0, 0.6];
    return p;
  }

  function climb(p, t, y) {
    p.ground = false;
    p.y = y;
    const s = S(t * 5);
    p.shL = [2.8 + 0.25 * s, 0, 0.25];
    p.elL = [0.4 + 0.8 * Math.max(0, -s), 0, 0];
    p.shR = [2.8 - 0.25 * s, 0, 0.25];
    p.elR = [0.4 + 0.8 * Math.max(0, s), 0, 0];
    p.hipL = [0.7 + 0.4 * s, 0, 0.1];
    p.hipR = [0.7 - 0.4 * s, 0, 0.1];
    p.knL = [1.1, 0, 0];
    p.knR = [1.1, 0, 0];
    return p;
  }

  function actor(id, look, pose, extra) {
    return Object.assign({ id, look, pose, hidden: false }, extra || {});
  }

  function member(id, pose, t, extra) {
    if (pose.mouth === 0 || pose.mouth === undefined) pose.mouth = extra && extra.sings ? voiceAt(t) : 0;
    pose.blink = blinkAt(t, MEMBERS.findIndex(m => m.id === id) * 0.17);
    return actor(id, id, pose, extra);
  }

  function carSeat(M, local, heading) {
    const w = M4.point(M, local);
    return { x: w[0], z: w[2], y: w[1], ry: heading };
  }

  function seated(id, M, heading, local, t, drive, extra) {
    const s = carSeat(M, local, heading);
    const p = sit(base(s.x, s.z, s.ry), s.y, drive);
    return member(id, p, t, extra);
  }

  function vehicleMatrix(x, y, z, heading, roll) {
    return M4.chain(M4.translate(x, y, z), M4.rotY(heading), M4.rotZ(roll || 0));
  }

  function worldIdent() {
    return { cast: [], vehicles: [] };
  }

  function worldSet(t, b, shot) {
    if (shot.cam === 'camcorder') {
      const cast = MEMBERS.map((m, i) => member(m.id, bounce(base((i - 2.5) * 1.05, -1.4 + (i % 2) * 0.35, 0), b + i * 0.2, 0.6), t));
      cast[0].pose.shR = [1.6, 0, 0.9];
      cast[3].pose = poseCool(cast[3].pose);
      return { cast, vehicles: [] };
    }
    const teo = member('teo', holdCam(base(0, 0, 0)), t, { props: [{ id: 'camcorder', part: 'head', at: [0.02, -0.01, 0.2] }] });
    const niko = member('niko', holdFront(base(0.1, 1.5, PI)), t, { props: [{ id: 'clapper', part: 'torso', at: [0, 0.34, 0.3] }] });
    return { cast: [teo, niko], vehicles: [] };
  }

  function worldRoofs(t, b, shot) {
    const lev = sneak(base(-5 + 0.9 * clamp(t - 12.87, 0, 5), 1, PI / 2), b * 2);
    lev.lift = 10;
    if (shot.cam === 'shaft') {
      const drop = Math.max(0, t - 18.4);
      lev.x = 0;
      lev.z = 0;
      lev.lift = 10 - 4.9 * drop * drop;
      lev.spine = [0, 0, 0];
      lev.hipL = [0.1, 0, 0.1];
      lev.hipR = [0.1, 0, 0.1];
      lev.knL = [0.2, 0, 0];
      lev.knR = [0.2, 0, 0];
      lev.shL = [2.8, 0, 0.4];
      lev.shR = [2.8, 0, 0.4];
      lev.neck = [0.3, 0, 0];
    }
    const teo = sneak(base(4.5, 3.5, -2.4), b * 0.5);
    teo.lift = 10;
    const bo = sneak(base(-18 + 0.8 * (t - 8.3), 16, PI / 2), b * 2);
    bo.lift = 13;
    return { cast: [member('lev', lev, t), member('teo', teo, t), member('bo', bo, t)], vehicles: [] };
  }

  function worldVault(t, b, shot) {
    const cast = [];
    let lev;
    if (t < 26.54) {
      lev = sneak(base(0, -2 - 0.8 * clamp(t - 19.92, 0, 7), PI), b);
      lev.spine = [0.2, 0, 0];
      lev.knL = [0.5, 0, 0];
      lev.knR = [0.5, 0, 0];
      lev.hipL = [0.4 + 0.25 * S(PI * b), 0, 0.1];
      lev.hipR = [0.4 - 0.25 * S(PI * b), 0, 0.1];
    } else {
      const k = (t - 26.54) / 1.6;
      const f = frac(k);
      lev = Math.floor(k) % 2 ? cartwheel(base(0, -18, PI / 2), f) : limbo(base(0, -18, PI), S(PI * f));
    }
    cast.push(member('lev', lev, t, { sings: true }));
    const miro = base(-1.15, -10.5, -PI / 2);
    miro.shL = [1.3, 0.3, 0.1];
    miro.elL = [0.5 + 0.2 * S(t * 11), 0, 0];
    miro.shR = [1.3, 0.3, 0.1];
    miro.elR = [0.5 + 0.2 * S(t * 13 + 1), 0, 0];
    miro.neck = [0.1, shot.cam === 'glance' || shot.cam === 'close3' ? -1.1 * ease((t - shot.start) / 0.6) : 0, 0];
    cast.push(member('miro', miro, t, { sings: shot.cam === 'glance' || shot.cam === 'close3' }));
    cast.push(member('ryzhy', climb(base(35.1, -3, PI / 2), t, 0.3 + 0.9 * clamp(t - 31, 0, 1.2)), t));
    ['bo', 'niko', 'teo'].forEach((id, i) => cast.push(member(id, sneak(base(25 + 1.1 * clamp(t - 10.96, 0, 2) + i * 1.3, -1.5 + i * 1.4, PI / 2), b * 2 + i * 0.3), t)));
    return { cast, vehicles: [] };
  }

  const STREET_SPEED = 20;

  function worldStreet(t, b, shot) {
    const inGarage = ['garage', 'cart', 'garageClose'].includes(shot.cam);
    if (inGarage) {
      const cast = [];
      if (shot.cam === 'cart') {
        const M = vehicleMatrix(200, 0, -18 + 5 * (t - 40.5), 0);
        cast.push(seated('lev', M, 0, [0.35, 0.55, 0.2], t, true, { sings: true }));
        cast.push(seated('bo', M, 0, [-0.35, 0.55, 0.2], t, false));
        cast.push(seated('niko', M, 0, [0, 0.6, -0.8], t, false));
        return { cast, vehicles: [{ kind: 'cart', M, spin: t * 12 }] };
      }
      const walkT = shot.cam === 'garage' ? t - 38.5 : 2;
      const lev = sneak(base(200, -6 + 1.1 * walkT, 0), b * 2);
      lev.spine = [0.25, 0, 0];
      if (shot.cam === 'garageClose') { lev.neck = [0, 0.6 * S(t * 1.5), 0]; lev.knL = [0.3, 0, 0]; lev.knR = [0.3, 0, 0]; lev.hipL = [0.2, 0, 0.1]; lev.hipR = [0.2, 0, 0.1]; }
      cast.push(member('lev', lev, t, { sings: true, props: [{ id: 'flashlight', part: 'foreR', at: [0, -0.3, 0.02] }] }));
      cast.push(member('bo', sneak(base(199, -8 + 1.1 * walkT, 0), b * 2 + 0.5), t));
      cast.push(member('teo', sneak(base(201.2, -9 + 1.1 * walkT, 0), b * 2 + 1), t));
      return { cast, vehicles: [] };
    }
    const carM = vehicleMatrix(1.8, 0, 0.3 * S(t * 0.9), 0.03 * S(t * 0.9));
    const vanM = vehicleMatrix(-1.6 + 0.6 * S(t * 0.6), 0, -10 + 2 * S(t * 0.4), 0.05 * S(t * 0.6));
    const buggyM = vehicleMatrix(-4.3, 0, -5 + 2 * S(t * 0.5 + 1), -0.04 * S(t * 0.7));
    const spin = (t * STREET_SPEED) / 0.36;
    const cast = [
      seated('lev', carM, 0.03 * S(t * 0.9), [0.45, 0.62, -0.3], t, true, { sings: true }),
      seated('bo', carM, 0.03 * S(t * 0.9), [-0.45, 0.62, -0.3], t, false, { sings: shot.cam === 'close' }),
      seated('miro', carM, 0.03 * S(t * 0.9), [0.45, 0.66, -1.2], t, false, { sings: shot.cam === 'glasses' }),
      seated('niko', carM, 0.03 * S(t * 0.9), [-0.45, 0.66, -1.2], t, false),
      seated('teo', buggyM, 0, [0.35, 0.7, 0], t, true),
      seated('ryzhy', buggyM, 0, [-0.35, 0.7, 0], t, false)
    ];
    if (shot.cam === 'driver') {
      cast[0].pose.neck = [-0.1, -0.5, 0];
      cast[0].pose.mouth = 0.9;
    }
    cast[3].pose = cheer(cast[3].pose, b);
    cast[5].pose.shR = [2.7, 0, 0.3];
    cast[5].pose.elR = [0.3, 0, 0];
    return {
      cast,
      vehicles: [
        { kind: 'car', M: carM, spin },
        { kind: 'van', M: vanM, spin },
        { kind: 'buggy', M: buggyM, spin: spin * 0.8 }
      ]
    };
  }

  const RING_Y = 1.1;

  function worldRing(t, b, shot) {
    const cast = [];
    let lev;
    if (t < 76.58) {
      lev = base(0, 9.8 - 1.0 * clamp(t - 72.21, 0, 4), PI);
      const s = S(PI * b * 2);
      lev.hipL = [0.3 * s, 0, 0.05];
      lev.hipR = [-0.3 * s, 0, 0.05];
      lev.knL = [0.1 + 0.3 * Math.max(0, -s), 0, 0];
      lev.knR = [0.1 + 0.3 * Math.max(0, s), 0, 0];
      lev.shL = [-0.3 * s, 0, 0.15];
      lev.shR = [0.3 * s, 0, 0.15];
    } else if (inWin(t, 95.83, 97.42)) {
      lev = kick(base(-1.1, 0, PI / 2), (t - 95.83) / 0.9);
      lev.lift = RING_Y;
    } else if (inWin(t, 114.79, 117.08)) {
      lev = scream(base(-1.1, 0, PI / 2));
      lev.lift = RING_Y;
    } else {
      lev = fight(base(-1.1, 0, PI / 2), b);
      lev.lift = RING_Y;
    }
    cast.push(member('lev', lev, t, { sings: shot.cam !== 'scream' }));
    const robot = robotSwing(base(1.3, 0, -PI / 2), b * 0.5, inWin(t, 114.79, 117.08) ? 0.2 : 1);
    robot.lift = RING_Y;
    if (inWin(t, 114.79, 117.08)) {
      robot.spine = [-0.5, 0.3, 0.2];
      robot.x = 1.6 + 0.3 * (t - 114.79);
    }
    cast.push(actor('robot', 'robot', robot, { hidden: t < 76.58 }));
    ['bo', 'niko', 'teo', 'miro', 'ryzhy'].forEach((id, i) => {
      const p = sit(base(-2.4 + i * 1.2, 5.3, PI), 0.5, false);
      cast.push(member(id, cheer(p, b + i * 0.25), t));
    });
    return { cast, vehicles: [] };
  }

  const DESERT_SPEED = 22;
  const DUSK_END = 118.04;

  function desertSpeed(shot) {
    return ['duskRun', 'duskSky', 'eye', 'splash', 'glider'].includes(shot.cam) ? 7 : DESERT_SPEED;
  }

  function worldDesert(t, b, shot) {
    const cast = [];
    if (shot.cam === 'duskRun' || shot.cam === 'duskSky') {
      cast.push(member('lev', run(base(0, 0, 0), b * 2), t));
      return { cast, vehicles: [] };
    }
    if (shot.cam === 'splash') {
      MEMBERS.forEach((m, i) => {
        const f = clamp((t - 173.21 - i * 0.08) / 0.9, 0, 1);
        const p = jumpArc(base(40 + (i - 2.5) * 1.1, (i % 2) * 0.6, 0), f, 1.6);
        cast.push(member(m.id, p, t));
      });
      return { cast, vehicles: [] };
    }
    const heading = 0.02 * S(t * 0.8);
    const jeepM = vehicleMatrix(0, 0, 0.3 * S(t * 0.7), heading, 0.015 * S(t * 3.1));
    const spin = (t * DESERT_SPEED) / 0.45;
    const eyeCam = shot.cam === 'eye' || shot.cam === 'maskClose';
    cast.push(seated('lev', jeepM, heading, [0.45, 0.78, 0.35], t, true, { sings: true }));
    cast.push(seated('bo', jeepM, heading, [-0.45, 0.78, 0.35], t, false, { sings: shot.cam === 'backseat' }));
    cast.push(seated('niko', jeepM, heading, [-0.55, 0.82, -0.75], t, false));
    cast.push(seated('miro', jeepM, heading, [0, 0.82, -0.75], t, false, { sings: eyeCam }));
    const teoOnGlider = shot.cam === 'glider';
    if (teoOnGlider) {
      const g = base(0.5, 1.5 + 0.4 * S(t * 2), 0);
      g.ground = false;
      g.y = 4.2;
      g.shL = [2.9, 0, 0.5];
      g.shR = [2.9, 0, 0.5];
      g.elL = [0.2, 0, 0];
      g.elR = [0.2, 0, 0];
      g.hipL = [0.3, 0, 0.1];
      g.knL = [0.4, 0, 0];
      cast.push(member('teo', g, t));
    } else {
      cast.push(seated('teo', jeepM, heading, [0.55, 0.82, -0.75], t, false, { sings: shot.cam === 'hatClose' }));
    }
    const standAt = carSeat(jeepM, [0, 0.72, -1.55], heading);
    const ryzhy = base(standAt.x, standAt.z, heading);
    ryzhy.lift = standAt.y;
    ryzhy.shR = [2.8, 0, 0.35];
    ryzhy.elR = [0.2, 0, 0];
    ryzhy.shL = [1.4, 0.3, 0.3];
    ryzhy.elL = [0.6, 0, 0];
    ryzhy.knL = [0.25, 0, 0];
    ryzhy.knR = [0.25, 0, 0];
    ryzhy.hipL = [0.15, 0, 0.18];
    ryzhy.hipR = [0.15, 0, 0.18];
    cast.push(member('ryzhy', ryzhy, t, { sings: shot.cam === 'truck' || shot.cam === 'rider' }));
    if (shot.cam === 'driverGrin' || shot.cam === 'driverEnd') cast[0].pose.neck = [0, -0.45, 0];
    const vehicles = [{ kind: 'jeep', M: jeepM, spin }];
    const bikesOn = ['bikes', 'bikes2', 'village', 'jeepChase', 'rider', 'wheel', 'mirror'].includes(shot.cam);
    if (bikesOn) {
      [[-3.2, -7, 0.7, 0], [3.4, -11, 0.6, 1]].forEach(([bx, bz, w, ph], i) => {
        const bh = 0.05 * S(t * w + ph);
        const M = vehicleMatrix(bx + 0.8 * S(t * w * 1.3 + ph), 0, bz + 1.5 * S(t * w + ph), bh, 0.1 * S(t * w + ph));
        vehicles.push({ kind: 'bike', M, spin: spin * 1.3 });
        const s = carSeat(M, [0, 0.72, -0.15], bh);
        const p = sit(base(s.x, s.z, s.ry), s.y, true);
        p.spine = [0.45, 0, 0];
        p.hipL = [1.0, 0, 0.2];
        p.hipR = [1.0, 0, 0.2];
        p.knL = [1.6, 0, 0];
        p.knR = [1.6, 0, 0];
        p.shL = [1.3, 0.2, 0.1];
        p.shR = [1.3, 0.2, 0.1];
        p.elL = [0.4, 0, 0];
        p.elR = [0.4, 0, 0];
        cast.push(actor('biker' + i, 'biker', p));
      });
    }
    if (shot.cam === 'glider') vehicles.push({ kind: 'glider', M: M4.translate(0.5, 5.95 + 0.4 * S(t * 2), 1.5 + 0.4 * S(t * 2)), spin: 0 });
    return { cast, vehicles };
  }

  function worldDeep(t, b, shot) {
    const cast = [];
    const drift = t - 142;
    const reach = shot.cam === 'reach';
    cast.push(member('lev', swim(base(-1.5, -2 - 0.25 * drift, PI), t, 3.2 + 0.3 * S(t), reach), t));
    cast.push(member('miro', swim(base(1.2, -0.5 - 0.25 * drift, PI + 0.2), t + 1, 4.4 + 0.3 * S(t + 1)), t));
    cast.push(member('niko', swim(base(0.2, 2 - 0.25 * drift, PI - 0.15), t + 2, 5.6), t));
    if (shot.cam === 'debris') {
      cast.forEach((a, i) => { a.pose.rx = 1.35 + t * (0.6 + i * 0.2); a.pose.rz = 0.4 * S(t + i); });
    }
    return { cast, vehicles: [] };
  }

  function worldDream(t, b, shot) {
    const cast = [];
    if (shot.cam === 'run' || shot.cam === 'bridge') {
      ['lev', 'bo', 'teo'].forEach((id, i) => {
        const p = run(base(-6 + 6 * (t - 169.37) - i * 1.2, (i - 1) * 0.7, PI / 2), b * 2 + i * 0.3);
        cast.push(member(id, p, t));
      });
      if (shot.cam === 'bridge') {
        const f = clamp((t - 170.04) / 1.4, 0, 1);
        const p = base(2 + 2 * f, -1.2 - 2.5 * f, 0.3);
        p.ground = false;
        p.pivot = 1.0;
        p.y = 1.3 * S(PI * f) - 3 * f * f;
        p.rx = 1.8 * f;
        p.shL = [3.0, 0, 0.2];
        p.shR = [3.0, 0, 0.2];
        cast.push(member('ryzhy', p, t));
      }
    } else {
      cast.push(member('lev', scared(base(0, 0, 0)), t, { sings: shot.cam === 'close' }));
      cast.push(member('bo', scared(base(-0.85, 0.35, 0.25)), t));
      cast.push(member('teo', scared(base(0.85, 0.35, -0.25)), t));
      const miro = base(-10.5, -0.2, -PI / 2);
      miro.shL = [1.4, 0.2, 0.1];
      miro.shR = [1.4, 0.2, 0.1];
      cast.push(member('miro', miro, t));
    }
    const sp = base(7 - 1.3 * (t - 158), 0, -PI / 2);
    sp.ground = false;
    sp.y = 0.6 + 0.25 * S(t * 1.7);
    sp.shL = [1.6, 0, 0.6];
    sp.shR = [1.6, 0, 0.6];
    sp.elL = [0.2, 0, 0];
    sp.elR = [0.2, 0, 0];
    cast.push(actor('spirit', 'spirit', sp, { glow: true, hidden: !['spirit', 'spirit2', 'room', 'close'].includes(shot.cam) }));
    return { cast, vehicles: [] };
  }

  const DANCE_SPOTS = [[-3, -1], [-1.8, -2.2], [-0.6, -1], [0.6, -2.2], [1.8, -1], [3, -2.2]];

  function worldStage(t, b, shot) {
    const cast = [];
    if (shot.loc === 'lineup') {
      MEMBERS.forEach((m, i) => {
        const p = holdFront(base(80 + (i - 2.5) * 1.3, -1.3, 0));
        p.neck = [0, 0.15 * S(t + i), 0];
        cast.push(member(m.id, p, t, { props: [{ id: 'slate_' + m.id, part: 'torso', at: [0, 0.2, 0.26] }] }));
      });
      return { cast, vehicles: [] };
    }
    if (shot.cam === 'dance' || shot.cam === 'danceWide') {
      MEMBERS.forEach((m, i) => cast.push(member(m.id, dance(base(-40 + DANCE_SPOTS[i][0], DANCE_SPOTS[i][1], 0), b * 2, i % 2 === 1), t, { sings: m.id === 'lev' })));
      return { cast, vehicles: [] };
    }
    if (shot.cam === 'comic1' || shot.cam === 'comic2') {
      cast.push(member('niko', poseCool(bounce(base(40, -3, 0), b, 0.5)), t));
      return { cast, vehicles: [] };
    }
    if (shot.cam === 'red') {
      const p = fight(base(-80, -3, 0), b);
      cast.push(member('ryzhy', p, t, { sings: true }));
      return { cast, vehicles: [] };
    }
    const lev = bounce(base(shot.cam === 'letters' ? -3 + 1.2 * (t - 175.71) : 1.2, -5.2, shot.cam === 'letters' ? PI / 2 : 0), b, 0.8);
    cast.push(member('lev', lev, t, { sings: shot.cam === 'letters2' }));
    const bo = bounce(base(shot.cam === 'letters' ? -4.3 + 1.2 * (t - 175.71) : -0.2, -5.6, shot.cam === 'letters' ? PI / 2 : 0), b + 0.5, 0.8);
    if (shot.cam === 'letterClose') { bo.shL = [1.6, 0.8, 0.2]; bo.elL = [1.5, 0, 0]; bo.shR = [1.6, 0.8, 0.2]; bo.elR = [1.5, 0, 0]; }
    cast.push(member('bo', bo, t, { sings: shot.cam === 'letterClose' }));
    const teo = sit(base(2.6, -6.6, -0.3), 0.55, false);
    teo.shL = [0.3, 0, 1.2];
    teo.elL = [0.2, 0, 0];
    cast.push(member('teo', teo, t, { sings: shot.cam === 'couch' }));
    cast.push(member('miro', scream(base(-2.2, -4.8, 0.2)), t, { hidden: shot.cam !== 'scream' }));
    return { cast, vehicles: [] };
  }

  const BURSTS = {
    pop: { bg: [1, 0.35, 0.65], a: [1, 0.92, 0.2], b: [1, 0.45, 0.7], who: 'bo', pose: 'cheer' },
    slash: { bg: [0.02, 0.02, 0.03], a: [0.9, 0.08, 0.12], b: [0.02, 0.02, 0.03], who: 'lev', pose: 'kick', silhouette: true },
    fly: { bg: [0.15, 0.35, 0.95], a: [1, 0.9, 0.2], b: [0.3, 0.6, 1], who: 'teo', pose: 'fly' },
    charge: { bg: [0.2, 0.85, 0.95], a: [1, 1, 1], b: [0.25, 0.75, 1], who: 'niko', pose: 'punch' },
    whoosh: { bg: [0.05, 0.12, 0.45], a: [0.2, 0.9, 0.9], b: [0.05, 0.2, 0.6], who: 'miro', pose: 'fly' },
    boom: { bg: [1, 0.55, 0.1], a: [1, 0.95, 0.3], b: [0.95, 0.25, 0.1], who: 'robot', pose: 'hit' },
    splash: { bg: [0.85, 0.95, 1], a: [0.3, 0.7, 1], b: [1, 1, 1], who: 'ryzhy', pose: 'dive' },
    fire: { bg: [0.95, 0.3, 0.08], a: [1, 0.85, 0.2], b: [0.8, 0.1, 0.05], who: 'lev', pose: 'cool' }
  };

  function worldBurst(t, b, shot) {
    const d = BURSTS[shot.cam];
    let p = base(0, 0, 0);
    if (d.pose === 'cheer') p = cheer(bounce(p, b), b);
    else if (d.pose === 'kick') p = kick(base(0, 0, PI / 2), 0.5);
    else if (d.pose === 'fly') { p = fly(base(0, 0, PI / 2), 0.2); }
    else if (d.pose === 'punch') { p = fight(base(0, 0, 0.4), 0.05); p.shR = [1.55, 0.1, 0.05]; p.elR = [0.05, 0, 0]; }
    else if (d.pose === 'hit') { p = robotSwing(p, 0.5); p.spine = [-0.6, 0.4, 0.3]; }
    else if (d.pose === 'dive') { p.ground = false; p.pivot = 1; p.rx = 1.2; p.y = 0.3; p.shL = [3, 0, 0.2]; p.shR = [3, 0, 0.2]; }
    else if (d.pose === 'cool') p = poseCool(p);
    const who = d.who;
    const a = who === 'robot' ? actor('robot', 'robot', p) : member(who, p, t);
    a.silhouette = !!d.silhouette;
    return { cast: [a], vehicles: [] };
  }

  const WORLDS = { ident: worldIdent, set: worldSet, roofs: worldRoofs, vault: worldVault, street: worldStreet, ring: worldRing, desert: worldDesert, deep: worldDeep, dream: worldDream, stage: worldStage, burst: worldBurst };

  const SOLVERS = {};
  function solveFocus(look, pose) {
    const size = look.size || 'm';
    const sc = look.scale || 1;
    const key = size + sc;
    if (!SOLVERS[key]) SOLVERS[key] = { d: DIM[size], scale: sc };
    const m = Figure.prototype.solve.call(SOLVERS[key], pose);
    return { head: M4.point(m.head, [0, 0, 0]), hips: M4.point(m.hips, [0, 0, 0]), hand: M4.point(m.foreR, [0, -0.3, 0]), foot: M4.point(m.shinR, [0, -0.45, 0.05]), m };
  }

  function wobble(t, k = 1) {
    return [(0.02 * S(t * 1.3) + 0.01 * S(t * 2.9)) * k, 0.015 * S(t * 1.7 + 1) * k, 0.01 * S(t * 1.1 + 2) * k];
  }

  function frame(eye, at, fov, t, shake = 1, up) {
    const w = wobble(t, shake);
    return { eye: V3.add(eye, w), at: V3.add(at, V3.mul(w, 0.6)), fov, up };
  }

  const head = (F, id, dy = -0.04) => V3.add(F[id].head, [0, dy, 0]);
  const around = (F, id, dist, ang, dy) => {
    const h = F[id].head;
    return [h[0] + S(ang) * dist, h[1] + dy, h[2] + C(ang) * dist];
  };
  const vpos = (F, i, local) => M4.point(F.vehicles[i].M, local);

  const CAMS = {
    ident: {
      logo: (t, u) => frame([0, 0, 4.2 - 0.8 * u], [0, 0, 0], 40, t, 0),
      endcard: (t, u) => frame([0, 0.4, 5], [0, 0, 0], 42, t, 0),
      credits: (t, u) => frame([0, 0, 6 + 2 * u], [0, 0, 0], 40, t, 0)
    },
    set: {
      camera: (t, u, F) => frame(V3.add(head(F, 'teo', 0), [0.35 - 0.1 * u, -0.05, 0.45]), head(F, 'teo', -0.02), 40, t),
      gear: (t, u, F) => frame(V3.add(head(F, 'teo', 0), [-0.35, -0.15, 0.3]), V3.add(head(F, 'teo', 0), [0, -0.05, 0.2]), 38, t),
      clap: (t, u, F) => frame(V3.add(F.niko.hips, [0.3, 0.55, -0.9]), V3.add(F.niko.hips, [0, 0.45, -0.3]), 42, t, 0.5),
      hands: (t, u, F) => frame([2.4 - 0.3 * u, 1.5, 0.8], [0, 1.3, 0.75], 44, t),
      camcorder: (t, u) => frame([0.3 * S(t), 1.55, 3.2 - 0.3 * u], [0, 1.3, -1.3], 50, t, 1.6)
    },
    roofs: {
      nightvision: (t, u) => frame([-26 + 4 * u, 22, 30], [-6, 8, 4], 44, t, 1.2),
      aerial: (t, u) => { const a = 0.8 + 0.5 * u; return frame([S(a) * 22, 24, C(a) * 22], [-2, 9, 1], 48, t, 0.4); },
      topdown: (t, u, F) => frame(V3.add(F.lev.hips, [0.01, 9, 0.2]), F.lev.hips, 50, t, 0.3, [1, 0, 0]),
      shaft: (t, u) => frame([0.02, 17, 0.4], [0, 4, 0], 46, t, 0.3, [0, 0, -1])
    },
    vault: {
      sneak: (t, u) => frame([33 - 2 * u, 3.2, 6], [27, 0.8, 0], 50, t, 0.5),
      corridor: (t, u, F) => frame([0.6, 1.4, F.lev.hips[2] - 4.5], V3.add(F.lev.hips, [0, 0.4, 0]), 50, t),
      close: (t, u, F) => frame(V3.add(head(F, 'lev', 0), [0.2, 0.02, -0.75]), head(F, 'lev'), 38, t),
      close2: (t, u, F) => frame(V3.add(head(F, 'lev', 0), [-0.35, -0.06, -0.7]), head(F, 'lev'), 36, t),
      glance: (t, u, F) => frame(V3.add(head(F, 'miro', 0), [0.7, 0.05, 0.25]), head(F, 'miro'), 38, t),
      lasers: (t, u) => frame([1.5 - 0.6 * u, 1.2, -12.8], [0, 1.0, -18], 56, t),
      thermal: (t, u) => frame([-1.5, 2.9, -11], [0, 0.8, -18], 54, t, 1.4),
      climb: (t, u, F) => frame(V3.add(F.ryzhy.hips, [-2.2, 0.8, 1.2]), V3.add(F.ryzhy.hips, [0, 0.4, 0]), 46, t),
      lasers2: (t, u) => frame([-1.5, 0.35, -14], [0, 1.0, -18], 58, t),
      close3: (t, u, F) => frame(V3.add(head(F, 'miro', 0), [0.2, 0.0, 0.6]), head(F, 'miro'), 36, t),
      servers: (t, u, F) => frame([1.2, 1.7, -8.2 - 0.6 * u], [-1.6, 1.4, -10.9], 50, t),
      screens: (t, u) => frame([1.5, 1.6, -13], [-2, 1.8, -17], 56, t, 1.5)
    },
    street: {
      garage: (t, u, F) => frame([203, 2.2, F.lev.hips[2] + 5], V3.add(F.lev.hips, [0, 0.5, 0]), 50, t),
      cart: (t, u, F) => frame(vpos(F, 0, [2.2, 1.6, 3.5]), vpos(F, 0, [0, 0.9, 0]), 50, t, 1.2),
      neon: (t, u, F) => frame([-5, 3.5 - u, 18], vpos(F, 0, [0, 0.8, 0]), 50, t, 0.8),
      glasses: (t, u, F) => frame(V3.add(head(F, 'miro', 0), [0.1, 0.05, 0.65]), head(F, 'miro'), 38, t, 1.2),
      carSide: (t, u, F) => frame(vpos(F, 0, [3.6, 1.2, 1 - 1.5 * u]), vpos(F, 0, [0, 0.9, -0.5]), 48, t, 1.3),
      garageClose: (t, u, F) => frame(V3.add(head(F, 'lev', 0), [0.3, 0.05, 0.75]), head(F, 'lev'), 38, t),
      close: (t, u, F) => frame(V3.add(head(F, 'bo', 0), [-0.2, 0.05, 0.7]), head(F, 'bo'), 38, t, 1.2),
      chase: (t, u, F) => frame(vpos(F, 1, [1.5, 2.8, -6]), vpos(F, 0, [0, 0.8, 0]), 52, t, 1.4),
      chaseFront: (t, u, F) => frame(vpos(F, 0, [0.3, 1.8, 7]), vpos(F, 1, [0, 1, 0]), 56, t, 1.4),
      sparks: (t, u, F) => frame(vpos(F, 1, [-1.4, 0.45, -6.5]), vpos(F, 1, [0, 0.6, -1]), 56, t, 1.6),
      inside: (t, u, F) => frame(vpos(F, 0, [0, 1.35, 1.7]), vpos(F, 0, [0, 1.0, -1]), 62, t, 1.6),
      buggy: (t, u, F) => frame(vpos(F, 2, [0.6, 1.1, 6]), vpos(F, 2, [0, 0.9, 0]), 50, t, 1.4),
      driver: (t, u, F) => frame(V3.add(head(F, 'lev', 0), [0.05, 0.05, 0.75]), head(F, 'lev'), 40, t, 1.4),
      smoke: (t, u, F) => frame(vpos(F, 1, [3, 1.2, -5]), vpos(F, 1, [0, 0.8, 1]), 54, t, 1.2)
    },
    ring: {
      entrance: (t, u, F) => frame([1.2, 1.6, F.lev.hips[2] + 2.4], [0, 2.4, -6], 58, t),
      aerial: (t, u) => { const a = 0.4 + 0.6 * u; return frame([S(a) * 11, 9, C(a) * 11], [0, 1.5, 0], 50, t, 0.5); },
      orbit: (t, u) => { const a = 2 + u; return frame([S(a) * 7, 3, C(a) * 7], [0, 1.8, 0], 52, t); },
      top: (t, u) => frame([0.01, 11, 0.3], [0, 1, 0], 54, t, 0.3, [0, 0, -1]),
      close: (t, u, F) => frame(around(F, 'lev', 0.8, PI / 2 - 0.3, 0.02), head(F, 'lev'), 38, t),
      wide2: (t, u) => frame([-8, 2.2, 9 - 2 * u], [0, 1.8, 0], 50, t),
      truss: (t, u) => frame([5, 7.5, 5], [0, 1.2, 0], 56, t, 0.6),
      robot: (t, u, F) => frame([0.2, 1.9, 4.2 - 0.6 * u], [0.1, 2.3, 0], 50, t),
      robotClose: (t, u, F) => frame(around(F, 'robot', 1.2, -PI / 2 + 0.3, 0.05), head(F, 'robot', 0), 40, t),
      crowd: (t, u) => frame([0.3, 1.6, 3.9], [0, 1.05, 5.4], 74, t),
      robot2: (t, u, F) => frame([-3, 1.6, 3.2], [0.5, 2.4, 0], 50, t),
      kick: (t, u, F) => frame([-2.6, 1.5, 2.2], [-0.4, 1.9, 0], 54, t),
      fight: (t, u) => frame([6 - u, 3.2, 5], [0, 1.9, 0], 48, t),
      grimace: (t, u, F) => frame(around(F, 'lev', 0.65, PI / 2, 0), head(F, 'lev'), 36, t, 1.2),
      hit: (t, u, F) => frame(around(F, 'robot', 2.2, -PI / 2 + 0.6, -0.3), head(F, 'robot', -0.4), 48, t, 1.6),
      scream: (t, u, F) => frame(around(F, 'lev', 0.6, PI / 2 + 0.2, 0.05), head(F, 'lev', -0.06), 38, t, 1.4)
    },
    desert: {
      eye: (t, u, F) => frame(V3.add(head(F, 'miro', 0), [0.05, 0.03, 0.28]), V3.add(head(F, 'miro', 0), [0.04, 0.02, 0]), 30, t, 0.5),
      duskRun: (t, u, F) => frame([2.5, 0.5, 4], V3.add(F.lev.hips, [0, 0.4, 0]), 54, t, 1.2),
      duskSky: (t, u, F) => frame([1.5, 0.3, 3], [0, 4, -10], 60, t, 0.8),
      village: (t, u) => frame([-14, 16, -12 + 4 * u], [0, 0, 2], 55, t, 0.5),
      bikes: (t, u, F) => frame([-6, 0.9, -3], [0, 0.8, -8], 56, t, 1.4),
      bikes2: (t, u, F) => frame([5.5, 1.4, -4], [0, 0.8, -8], 56, t, 1.4),
      rider: (t, u, F) => frame(V3.add(head(F, 'ryzhy', 0), [1.2, -0.2, 1.3]), head(F, 'ryzhy', -0.1), 46, t, 1.2),
      jeepChase: (t, u, F) => frame(vpos(F, 0, [2, 2.6, -8 + u]), vpos(F, 0, [0, 1, 0]), 54, t, 1.3),
      truck: (t, u, F) => frame(V3.add(F.ryzhy.hips, [1.8, 0.2, 2.2]), V3.add(F.ryzhy.hips, [0, 0.7, 0]), 50, t, 1.2),
      interior: (t, u, F) => frame(vpos(F, 0, [-0.2, 1.55, 1.3]), head(F, 'lev'), 56, t, 1.2),
      mirror: (t, u, F) => frame(vpos(F, 0, [0.9, 1.62, 0.15]), vpos(F, 0, [0.35, 1.55, 0.72]), 40, t, 1.2),
      backseat: (t, u, F) => frame(vpos(F, 0, [0, 1.75, -1.4]), vpos(F, 0, [0, 1.1, 2]), 62, t, 1.2),
      wheel: (t, u, F) => frame(vpos(F, 0, [-4.4, 0.7, 5.5 - 2 * u]), vpos(F, 0, [0, 0.8, 0]), 50, t, 0.7),
      maskClose: (t, u, F) => frame(V3.add(head(F, 'miro', 0), [0.25, 0, 0.6]), head(F, 'miro'), 36, t, 1.2),
      splash: (t, u) => frame([43.5, 1.1, 5.5], [40, 1.2, 0], 54, t),
      driverGrin: (t, u, F) => frame(V3.add(head(F, 'lev', 0), [0.55, 0.02, 0.35]), head(F, 'lev'), 40, t, 1.2),
      crew: (t, u, F) => frame(vpos(F, 0, [1.6, 2.3, 3.4]), vpos(F, 0, [0, 1.2, -0.5]), 54, t, 1.3),
      hatClose: (t, u, F) => frame(V3.add(head(F, 'teo', 0), [0.3, 0.05, 0.6]), head(F, 'teo'), 36, t, 1.2),
      gate: (t, u, F) => frame([-3.5, 1.4, 18], vpos(F, 0, [0, 1, 0]), 50, t, 0.8),
      glider: (t, u, F) => frame([4.5, 3.2, 6], [0.5, 4.3, 1], 56, t, 1),
      sunsetJeep: (t, u, F) => frame(vpos(F, 0, [0.5, 1.4, -9]), vpos(F, 0, [0, 1.8, 6]), 52, t, 1),
      driverEnd: (t, u, F) => frame(V3.add(head(F, 'lev', 0), [0.6, 0.04, 0.4]), head(F, 'lev'), 42, t, 1.2),
      sunsetAway: (t, u, F) => frame(vpos(F, 0, [0.2, 1.1, -7 - 10 * u]), [0, 3, 150], 50, t, 0.6)
    },
    deep: {
      portal: (t, u) => frame([1.2, 3.5, 5 - 2 * u], [0, 4, -10], 58, t, 0.8),
      swim: (t, u, F) => frame(V3.add(F.miro.head, [0.9, 0.2, -0.9]), head(F, 'miro'), 44, t),
      swimWide: (t, u, F) => frame(V3.add(F.lev.hips, [4, 1.5, 2]), V3.add(F.lev.hips, [0, 0, -1]), 56, t),
      reach: (t, u, F) => frame(V3.add(F.lev.head, [0.6, 0.35, 0.8]), V3.add(F.lev.head, [0, 0.1, -1.5]), 50, t),
      vortex: (t, u) => frame([0.5, 4.2, 2], [0, 4, -10], 50, t, 0.6),
      debris: (t, u, F) => frame(V3.add(F.lev.hips, [2.5, 0.5, 2]), F.lev.hips, 60, t, 1.3)
    },
    dream: {
      close: (t, u, F) => frame(V3.add(head(F, 'lev', 0), [0.3, 0.02, 0.7]), head(F, 'lev'), 38, t),
      spirit: (t, u, F) => frame([-3, 1.4, 3], V3.add(F.spirit.hips, [0, 0.4, 0]), 54, t),
      room: (t, u) => frame([-7.5, 1.5, 1.5], [-11, 1.4, -0.2], 54, t),
      spirit2: (t, u, F) => frame([F.spirit.hips[0] - 2.5, 1.2, -2.5], V3.add(F.spirit.hips, [0, 0.5, 0]), 52, t),
      trio: (t, u) => frame([0.1, 1.55, 2.4 - 0.4 * u], [0, 1.5, 0.2], 46, t, 1.2),
      run: (t, u, F) => frame([F.lev.hips[0] + 3.5, 1.2, 2.8], V3.add(F.lev.hips, [0, 0.3, 0]), 56, t, 1.4),
      bridge: (t, u, F) => frame([F.ryzhy.hips[0] + 1, 2.4, 3.5], V3.add(F.ryzhy.hips, [0, 0, 0]), 58, t, 1.2)
    },
    stage: {
      letters: (t, u) => frame([2 - 2 * u, 1.3, 3], [0, 2.4, -9], 58, t),
      dance: (t, u) => frame([-40 + 0.8 * S(u * 2), 1.5, 4.5 - u], [-40, 1.2, -1.6], 52, t),
      danceWide: (t, u) => frame([-46 + 3 * u, 3.2, 6], [-40, 1.1, -1.6], 54, t, 0.6),
      letterClose: (t, u, F) => frame(V3.add(head(F, 'bo', 0), [0.2, -0.05, 0.9]), head(F, 'bo', -0.08), 42, t),
      couch: (t, u, F) => frame([5.2, 1.5, -4.6], V3.add(F.teo.hips, [0, 0.3, 0]), 48, t),
      comic1: (t, u) => frame([41.5, 0.8, 4.5], [40, 1.5, -3], 56, t, 0.4),
      comic2: (t, u) => frame([40, 1.1, 5.5], [40, 1.3, -3], 50, t, 0.4),
      scream: (t, u, F) => frame(V3.add(head(F, 'miro', 0), [0.3, 0.1, 1.1]), head(F, 'miro'), 44, t, 1.5),
      letters2: (t, u, F) => frame(V3.add(head(F, 'lev', 0), [0.6, -0.2, 1.4]), head(F, 'lev', -0.15), 50, t),
      red: (t, u, F) => frame([-79, 1.3, 1.5], [-80, 1.3, -3], 54, t),
      m1: (t, u, F) => frame([F.lev.hips[0], 1.35, 2.2], V3.add(F.lev.hips, [0, 0.45, 0]), 40, t, 0.3),
      m2: (t, u, F) => frame([F.teo.hips[0], 1.35, 2.2], V3.add(F.teo.hips, [0, 0.45, 0]), 40, t, 0.3),
      pair: (t, u, F) => frame([(F.bo.hips[0] + F.ryzhy.hips[0]) / 2, 1.35, 3], [(F.bo.hips[0] + F.ryzhy.hips[0]) / 2, 1.4, -1.3], 42, t, 0.3),
      m3: (t, u, F) => frame([F.miro.hips[0], 1.35, 2.2], V3.add(F.miro.hips, [0, 0.45, 0]), 40, t, 0.3),
      m4: (t, u, F) => frame([F.niko.hips[0], 1.35, 2.2], V3.add(F.niko.hips, [0, 0.45, 0]), 40, t, 0.3)
    },
    burst: {
      pop: (t, u) => frame([0, 1.2, 3.8 - 0.4 * u], [0, 1.1, 0], 50, t, 0),
      slash: (t, u) => frame([0, 1.2, 4], [0, 1.1, 0], 50, t, 0),
      fly: (t, u) => frame([0.4, 1.4, 3.6], [0, 1.1, 0], 52, t, 0.5),
      charge: (t, u) => frame([0.3, 1.4, 3.2 - 0.6 * u], [0, 1.3, 0], 50, t, 1),
      whoosh: (t, u) => frame([0, 1.2, 4], [0, 1.1, 0], 54, t, 0.5),
      boom: (t, u) => frame([0, 2, 6], [0, 2, 0], 54, t, 2),
      splash: (t, u) => frame([0, 1.4, 4], [0, 1.1, 0], 54, t, 1),
      fire: (t, u) => frame([0.2, 1.3, 3.8], [0, 1.2, 0], 50, t, 1)
    }
  };

  function stage(t, shot) {
    const b = beatAt(t);
    const world = WORLDS[shot.scene](t, b, shot);
    const focus = { vehicles: world.vehicles };
    world.cast.forEach(a => { focus[a.id] = solveFocus(LOOKS[a.look], a.pose); });
    const u = clamp((t - shot.start) / Math.max(0.01, shot.end - shot.start), 0, 1);
    const camera = CAMS[shot.scene][shot.cam](t, u, focus);
    if (shot.grade) camera.grade = shot.grade;
    return { cast: world.cast, vehicles: world.vehicles, focus, camera, beat: b, shot };
  }

  function texNoise(basecol, seed, amount = 0.14) {
    return (ctx, w, h) => {
      const r = rand(seed);
      ctx.fillStyle = basecol;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < w * h * 0.35; i++) {
        ctx.fillStyle = r() < 0.5 ? `rgba(0,0,0,${amount * r()})` : `rgba(255,255,255,${amount * r()})`;
        ctx.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1);
      }
    };
  }

  function texWindows(seed, lit) {
    return (ctx, w, h) => {
      const r = rand(seed);
      ctx.fillStyle = '#12141d';
      ctx.fillRect(0, 0, w, h);
      const n = 8, cw = w / n, ch = h / n;
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          ctx.fillStyle = r() < 0.38 ? lit[Math.floor(r() * lit.length)] : '#1c2233';
          ctx.fillRect(x * cw + 3, y * ch + 3, cw - 6, ch - 5);
        }
      }
    };
  }

  function texGrid(line, bg, step) {
    return (ctx, w, h) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = line;
      for (let i = 0; i < w; i += step) {
        ctx.fillRect(i, 0, 2, h);
        ctx.fillRect(0, i, w, 2);
      }
    };
  }

  function texStripes(colors, horizontal) {
    return (ctx, w, h) => {
      const n = colors.length;
      colors.forEach((c, i) => {
        ctx.fillStyle = c;
        if (horizontal) ctx.fillRect(0, (i * h) / n, w, h / n + 1);
        else ctx.fillRect((i * w) / n, 0, w / n + 1, h);
      });
    };
  }

  function texRoad(ctx, w, h) {
    texNoise('#2a2a30', 5, 0.2)(ctx, w, h);
    ctx.fillStyle = '#d8c860';
    ctx.fillRect(w / 2 - 2, 0, 4, h / 2);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(4, 0, 3, h);
    ctx.fillRect(w - 7, 0, 3, h);
  }

  function texGlitch(ctx, w, h) {
    const r = rand(77);
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, w, h);
    const cols = ['#ff2d7a', '#2de0ff', '#8a5aff', '#ffffff', '#1a8aff'];
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = cols[Math.floor(r() * cols.length)];
      ctx.fillRect(Math.floor(r() * w), Math.floor(r() * h), 4 + Math.floor(r() * 30), 2 + Math.floor(r() * 8));
    }
  }

  function texCaustics(ctx, w, h) {
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    const r = rand(9);
    for (let i = 0; i < 40; i++) {
      const x = r() * w, y = r() * h, rad = 10 + r() * 22;
      for (let ox = -w; ox <= w; ox += w) {
        for (let oy = -h; oy <= h; oy += h) {
          ctx.beginPath();
          ctx.ellipse(x + ox, y + oy, rad, rad * (0.6 + r() * 0.5), r() * PI, 0, PI * 2);
          ctx.stroke();
        }
      }
    }
  }

  function texText(lines, bg, fg, font) {
    return (ctx, w, h) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((ln, i) => {
        ctx.font = ln.font || font;
        ctx.fillText(ln.text, w / 2, (h * (i + 1)) / (lines.length + 1));
      });
    };
  }

  function texLineup(ctx, w, h) {
    ctx.fillStyle = '#f4f4f6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a2a30';
    for (let i = 0; i < 16; i++) {
      const y = (i * h) / 16;
      ctx.fillRect(0, y, w, i % 4 === 0 ? 3 : 1);
    }
  }

  function texComic(palette, seed) {
    return (ctx, w, h) => {
      const r = rand(seed);
      ctx.fillStyle = palette[0];
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        const cx = r() * w, cy = r() * h, rad = 12 + r() * 40;
        ctx.fillStyle = palette[1 + Math.floor(r() * (palette.length - 1))];
        ctx.beginPath();
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * PI * 2;
          const rr = k % 2 ? rad * 0.55 : rad;
          ctx.lineTo(cx + C(a) * rr, cy + S(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    };
  }

  function texDiamonds(ctx, w, h) {
    ctx.fillStyle = '#3a0610';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ff3a4a';
    ctx.lineWidth = 5;
    for (let s = 12; s < w; s += 22) {
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2 - s);
      ctx.lineTo(w / 2 + s, h / 2);
      ctx.lineTo(w / 2, h / 2 + s);
      ctx.lineTo(w / 2 - s, h / 2);
      ctx.closePath();
      ctx.stroke();
    }
  }

  function texSign(ctx, w, h) {
    ctx.fillStyle = '#e8e4d8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2c21a';
    ctx.beginPath();
    ctx.moveTo(w * 0.25, h * 0.2);
    ctx.lineTo(w * 0.45, h * 0.5);
    ctx.lineTo(w * 0.25, h * 0.8);
    ctx.lineTo(w * 0.05, h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c02020';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.5, h * 0.28, 0, PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.52, h * 0.3);
    ctx.lineTo(w * 0.92, h * 0.7);
    ctx.stroke();
  }

  function texGlow(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.3, '#8a8a8a');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function uvq(b, pts, col, us, axis) {
    const uv = pts.map(p => axis === 'z' ? [p[2] * us, p[1] * us] : axis === 'y' ? [p[0] * us, p[2] * us] : [p[0] * us, p[1] * us]);
    b.quad(pts[0], pts[1], pts[2], pts[3], col, uv);
  }

  function cone(b, r0, r1, len, col0, col1, sides = 10) {
    b.prism(sides, r0, r0, 0, r1, r1, len, col0, { topColor: col1, capTop: false, flat: true });
  }

  function wheelMesh(r, width) {
    const b = new Builder();
    b.push(M4.rotZ(PI / 2));
    b.prism(12, r, r, -width / 2, r, r, width / 2, [0.08, 0.08, 0.09, 0], { capBottom: true });
    b.prism(6, r * 0.5, r * 0.5, -width / 2 - 0.01, r * 0.5, r * 0.5, width / 2 + 0.01, [0.7, 0.7, 0.74, 0], { capBottom: true });
    b.box(r * 1.6, 0.04, 0.06, [0.5, 0.5, 0.55, 0]);
    b.pop();
    return b;
  }

  function beams(b, pts, len, col) {
    pts.forEach(([x, y, z]) => {
      b.push(M4.translate(x, y, z), M4.rotX(PI / 2 - 0.06));
      cone(b, 0.12, 1.6, len, col, [0, 0, 0, 1]);
      b.pop();
    });
  }

  const VEHICLES = {
    car(r) {
      const b = new Builder();
      const col = [0.55, 0.2, 0.75, 0];
      const dark = [0.06, 0.06, 0.08, 0];
      b.at(0, 0.3, 0, (c) => c.box(1.9, 0.45, 4.4, col, { base: true }));
      b.at(0, 0.8, 1.35, (c) => c.box(1.86, 0.08, 1.6, shade(col, 1.15)));
      b.at(0, 0.8, -1.7, (c) => c.box(1.86, 0.1, 1.0, shade(col, 1.15)));
      b.push(M4.translate(0, 1.0, 0.5), M4.rotX(-0.55));
      b.box(1.7, 0.45, 0.04, [0.55, 0.75, 0.95, 0.35]);
      b.pop();
      [0.45, -0.45].forEach(x => {
        b.at(x, 0.55, -0.35, (c) => c.box(0.55, 0.12, 0.5, dark));
        b.at(x, 0.85, -0.6, (c) => c.box(0.55, 0.5, 0.1, dark));
      });
      b.at(0, 0.6, -1.25, (c) => c.box(1.5, 0.12, 0.5, dark));
      b.at(0, 0.9, -1.5, (c) => c.box(1.5, 0.5, 0.1, dark));
      b.push(M4.translate(0.45, 1.0, 0.25), M4.rotX(-1.1));
      b.prism(10, 0.17, 0.17, -0.015, 0.17, 0.17, 0.015, dark, { capBottom: true });
      b.pop();
      [0.65, -0.65].forEach(x => {
        b.at(x, 0.58, 2.21, (c) => c.box(0.36, 0.16, 0.02, [1, 1, 0.85, 1]));
        b.at(x, 0.6, -2.21, (c) => c.box(0.32, 0.12, 0.02, [1, 0.1, 0.12, 1]));
      });
      b.at(0, 0.36, 2.25, (c) => c.box(1.9, 0.1, 0.08, [0.8, 0.8, 0.85, 0.2]));
      b.at(0, 0.36, -2.25, (c) => c.box(1.9, 0.1, 0.08, [0.8, 0.8, 0.85, 0.2]));
      const g = new Builder();
      beams(g, [[0.65, 0.58, 2.25], [-0.65, 0.58, 2.25]], 12, [0.9, 0.85, 0.7, 1]);
      return { body: r.mesh(b), glow: r.mesh(g), wheel: r.mesh(wheelMesh(0.36, 0.26)), wheels: [[0.88, 0.36, 1.4], [-0.88, 0.36, 1.4], [0.88, 0.36, -1.4], [-0.88, 0.36, -1.4]] };
    },
    van(r) {
      const b = new Builder();
      const col = [0.08, 0.08, 0.1, 0];
      b.at(0, 0.35, 0, (c) => c.box(2.0, 1.6, 4.8, col, { base: true }));
      b.at(0, 1.45, 1.6, (c) => c.box(1.9, 0.45, 1.2, [0.1, 0.14, 0.2, 0.2]));
      [0.7, -0.7].forEach(x => {
        b.at(x, 0.75, 2.41, (c) => c.box(0.34, 0.16, 0.02, [1, 1, 0.9, 1]));
        b.at(x, 0.8, -2.41, (c) => c.box(0.3, 0.2, 0.02, [1, 0.1, 0.1, 1]));
      });
      b.at(0, 0.45, 2.45, (c) => c.box(2.0, 0.18, 0.1, [0.25, 0.25, 0.28, 0]));
      const g = new Builder();
      beams(g, [[0.7, 0.75, 2.45], [-0.7, 0.75, 2.45]], 12, [0.9, 0.9, 0.8, 1]);
      return { body: r.mesh(b), glow: r.mesh(g), wheel: r.mesh(wheelMesh(0.38, 0.28)), wheels: [[0.95, 0.38, 1.55], [-0.95, 0.38, 1.55], [0.95, 0.38, -1.55], [-0.95, 0.38, -1.55]] };
    },
    buggy(r) {
      const b = new Builder();
      const col = [0.95, 0.75, 0.1, 0];
      const bar = [0.15, 0.15, 0.18, 0];
      b.at(0, 0.4, 0, (c) => c.box(1.5, 0.25, 2.8, col, { base: true }));
      [0.35, -0.35].forEach(x => b.at(x, 0.65, 0, (c) => c.box(0.5, 0.1, 0.5, bar)));
      [[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]].forEach(([x, z]) => b.at(x, 1.2, z, (c) => c.box(0.06, 1.1, 0.06, bar)));
      b.at(0, 1.75, 0, (c) => c.box(1.46, 0.06, 1.46, bar));
      [0.4, -0.4].forEach(x => b.at(x, 0.6, 1.41, (c) => c.box(0.22, 0.14, 0.02, [1, 1, 0.8, 1])));
      const g = new Builder();
      beams(g, [[0.4, 0.6, 1.45], [-0.4, 0.6, 1.45]], 9, [0.9, 0.85, 0.6, 1]);
      return { body: r.mesh(b), glow: r.mesh(g), wheel: r.mesh(wheelMesh(0.42, 0.34)), wheels: [[0.85, 0.42, 1.05], [-0.85, 0.42, 1.05], [0.85, 0.42, -1.05], [-0.85, 0.42, -1.05]] };
    },
    cart(r) {
      const b = new Builder();
      b.at(0, 0.3, 0, (c) => c.box(1.3, 0.3, 2.4, [0.9, 0.9, 0.92, 0], { base: true }));
      b.at(0, 1.5, -0.1, (c) => c.box(1.3, 0.06, 1.8, [0.2, 0.5, 0.3, 0]));
      [[0.6, 0.7], [-0.6, 0.7], [0.6, -0.9], [-0.6, -0.9]].forEach(([x, z]) => b.at(x, 1.0, z, (c) => c.box(0.05, 1.0, 0.05, [0.3, 0.3, 0.32, 0])));
      [0.35, -0.35].forEach(x => b.at(x, 0.6, 0.2, (c) => c.box(0.5, 0.1, 0.5, [0.15, 0.15, 0.18, 0])));
      b.at(0, 0.62, -0.8, (c) => c.box(1.1, 0.12, 0.5, [0.15, 0.15, 0.18, 0]));
      [0.4, -0.4].forEach(x => b.at(x, 0.5, 1.21, (c) => c.box(0.2, 0.12, 0.02, [1, 1, 0.8, 1])));
      const g = new Builder();
      beams(g, [[0.4, 0.5, 1.25], [-0.4, 0.5, 1.25]], 8, [0.8, 0.8, 0.6, 1]);
      return { body: r.mesh(b), glow: r.mesh(g), wheel: r.mesh(wheelMesh(0.25, 0.18)), wheels: [[0.62, 0.25, 0.85], [-0.62, 0.25, 0.85], [0.62, 0.25, -0.85], [-0.62, 0.25, -0.85]] };
    },
    jeep(r) {
      const b = new Builder();
      const col = [0.72, 0.62, 0.42, 0];
      const bar = [0.18, 0.16, 0.14, 0];
      b.at(0, 0.45, 0, (c) => c.box(1.9, 0.55, 3.8, col, { base: true }));
      b.at(0, 1.0, 1.35, (c) => c.box(1.86, 0.06, 1.1, shade(col, 1.1)));
      b.push(M4.translate(0, 1.25, 0.75), M4.rotX(-0.25));
      b.at(0, 0.25, 0, (c) => c.box(1.7, 0.05, 0.05, bar));
      [0.83, -0.83].forEach(x => b.at(x, 0, 0, (c) => c.box(0.05, 0.5, 0.05, bar)));
      b.pop();
      [0.9, -0.9].forEach(x => {
        b.at(x, 1.45, -0.3, (c) => c.box(0.07, 1.0, 0.07, bar));
        b.at(x, 1.95, -0.9, (c) => c.box(0.07, 0.07, 1.3, bar));
        b.at(x, 1.45, -1.5, (c) => c.box(0.07, 1.0, 0.07, bar));
      });
      b.at(0, 1.95, -0.9, (c) => c.box(1.86, 0.07, 0.07, bar));
      b.at(0, 1.02, 0.35, (c) => c.box(1.5, 0.1, 0.5, [0.25, 0.18, 0.12, 0]));
      b.at(0, 1.05, -0.75, (c) => c.box(1.6, 0.1, 0.55, [0.25, 0.18, 0.12, 0]));
      b.push(M4.translate(0.45, 1.3, 0.75), M4.rotX(-1.2));
      b.prism(10, 0.17, 0.17, -0.015, 0.17, 0.17, 0.015, bar, { capBottom: true });
      b.pop();
      b.at(0.35, 1.55, 0.72, (c) => c.box(0.26, 0.09, 0.03, [0.95, 0.65, 0.4, 0.8]));
      b.at(0, 0.9, -1.95, (c) => c.push(M4.rotX(PI / 2)).prism(10, 0.38, 0.38, 0, 0.38, 0.38, 0.22, [0.08, 0.08, 0.09, 0], { capBottom: true }).pop());
      return { body: r.mesh(b), glow: null, wheel: r.mesh(wheelMesh(0.45, 0.34)), wheels: [[0.95, 0.45, 1.25], [-0.95, 0.45, 1.25], [0.95, 0.45, -1.25], [-0.95, 0.45, -1.25]] };
    },
    bike(r) {
      const b = new Builder();
      const col = [0.75, 0.12, 0.1, 0];
      b.at(0, 0.62, 0.15, (c) => c.box(0.25, 0.28, 0.6, col));
      b.at(0, 0.62, -0.2, (c) => c.box(0.2, 0.08, 0.5, [0.1, 0.1, 0.1, 0]));
      b.at(0, 0.45, 0.1, (c) => c.box(0.18, 0.2, 0.9, [0.3, 0.3, 0.32, 0]));
      b.push(M4.translate(0, 0.65, 0.65), M4.rotX(0.35));
      b.box(0.05, 0.6, 0.05, [0.6, 0.6, 0.64, 0]);
      b.pop();
      b.at(0, 0.95, 0.72, (c) => c.box(0.7, 0.04, 0.04, [0.2, 0.2, 0.2, 0]));
      b.at(0, 0.85, 0.82, (c) => c.box(0.12, 0.1, 0.02, [1, 1, 0.8, 1]));
      return { body: r.mesh(b), glow: null, wheel: r.mesh(wheelMesh(0.33, 0.12)), wheels: [[0, 0.33, 0.72], [0, 0.33, -0.62]] };
    },
    glider(r) {
      const b = new Builder();
      const sail = [0.95, 0.35, 0.2, 0.1];
      b.tri([0, 0.2, 1.4], [-2.6, 0, -0.8], [0, 0.35, -0.6], sail);
      b.tri([0, 0.2, 1.4], [0, 0.35, -0.6], [2.6, 0, -0.8], shade(sail, 0.85));
      b.at(0, -0.6, 0.2, (c) => c.box(0.9, 0.04, 0.04, [0.2, 0.2, 0.22, 0]));
      [-0.4, 0.4].forEach(x => b.push(M4.translate(x * 0.5, -0.3, 0.2), M4.rotZ(x)).box(0.03, 0.65, 0.03, [0.2, 0.2, 0.22, 0]).pop());
      return { body: r.mesh(b), glow: null, wheel: null, wheels: [] };
    }
  };

  const PROPS = {
    camcorder(r) {
      const b = new Builder();
      b.box(0.12, 0.13, 0.26, [0.1, 0.1, 0.12, 0]);
      b.at(0, 0.01, 0.16, (c) => c.push(M4.rotX(PI / 2)).prism(10, 0.04, 0.04, 0, 0.05, 0.05, 0.08, [0.2, 0.2, 0.22, 0], { capTop: false }).pop());
      b.at(0, 0.01, 0.245, (c) => c.box(0.07, 0.07, 0.005, [0.3, 0.4, 0.6, 0.6]));
      b.at(0.075, 0.02, 0.02, (c) => c.box(0.01, 0.08, 0.11, [0.35, 0.5, 0.7, 0.7]));
      b.at(-0.03, 0.08, -0.05, (c) => c.box(0.02, 0.02, 0.02, [1, 0.1, 0.1, 1]));
      return { mesh: r.mesh(b) };
    },
    clapper(r, opts = {}) {
      const b = new Builder();
      b.box(0.42, 0.3, 0.02, [1, 1, 1, 0.15], { faces: { front: [1, 1, 1, 0.15] } });
      const top = new Builder();
      for (let i = 0; i < 6; i++) top.at(-0.175 + i * 0.07, 0, 0, (c) => c.box(0.07, 0.06, 0.03, i % 2 ? [0.95, 0.95, 0.95, 0.2] : [0.05, 0.05, 0.05, 0]));
      const lines = opts.lines || [{ text: 'ПОЛИГОН', font: 'bold 22px Arial' }, { text: 'СЦЕНА 1  ДУБЛЬ 3', font: 'bold 13px Arial' }];
      const tex = r.texture(128, texText(lines, '#101014', '#f2f2f2', 'bold 16px Arial'), { clamp: true });
      const face = new Builder();
      face.quad([-0.2, -0.14, 0.012], [0.2, -0.14, 0.012], [0.2, 0.14, 0.012], [-0.2, 0.14, 0.012], [1, 1, 1, 0.3], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      const topMesh = r.mesh(top);
      const snapAt = opts.snapAt || 6.95;
      return {
        mesh: r.mesh(b),
        face: r.mesh(face),
        tex,
        extra: (t) => {
          const snap = t < snapAt ? 0.7 * clamp((snapAt - t) / 0.5, 0, 1) : 0;
          return [{ mesh: topMesh, M: M4.chain(M4.translate(-0.21, 0.18, 0), M4.rotZ(snap), M4.translate(0.21, 0, 0)) }];
        }
      };
    },
    flashlight(r) {
      const b = new Builder();
      b.push(M4.rotX(PI / 2));
      b.prism(8, 0.025, 0.025, -0.08, 0.035, 0.035, 0.08, [0.2, 0.2, 0.22, 0]);
      b.at(0, 0.082, 0, (c) => c.prism(8, 0.03, 0.03, 0, 0.03, 0.03, 0.005, [1, 1, 0.8, 1]));
      b.pop();
      const g = new Builder();
      g.push(M4.rotX(PI / 2));
      cone(g, 0.03, 1.2, 7, [0.9, 0.9, 0.7, 1], [0, 0, 0, 1]);
      g.pop();
      return { mesh: r.mesh(b), glow: r.mesh(g) };
    }
  };

  function slateProp(r, m) {
    const b = new Builder();
    b.box(0.46, 0.3, 0.02, [0.08, 0.08, 0.1, 0]);
    const face = new Builder();
    face.quad([-0.21, -0.13, 0.012], [0.21, -0.13, 0.012], [0.21, 0.13, 0.012], [-0.21, 0.13, 0.012], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const tex = r.texture(128, texText([{ text: m.name, font: 'bold 30px Arial' }, { text: 'ПАРАНОЙЯ-01', font: 'bold 12px Arial' }], '#14141a', m.color, 'bold 20px Arial'), { clamp: true });
    return { mesh: r.mesh(b), face: r.mesh(face), tex };
  }

  function starburst(b, rIn, rOut, spikes, colA, colB, z) {
    for (let i = 0; i < spikes; i++) {
      const a0 = (i / spikes) * PI * 2, a1 = ((i + 0.5) / spikes) * PI * 2, a2 = ((i + 1) / spikes) * PI * 2;
      const c = i % 2 ? colA : colB;
      b.tri([0, 0, z], [C(a0) * rIn, S(a0) * rIn, z], [C(a1) * rOut, S(a1) * rOut, z], c);
      b.tri([0, 0, z], [C(a1) * rOut, S(a1) * rOut, z], [C(a2) * rIn, S(a2) * rIn, z], c);
    }
  }

  const LETTER_FONT = {
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    'М': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    'Е': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    'Г': ['11111', '10000', '10000', '10000', '10000', '10000', '10000'],
    'А': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    'Н': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    'С': ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
    'Р': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    'Л': ['00111', '01001', '01001', '01001', '01001', '10001', '10001'],
    'В': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    'Д': ['00110', '01010', '01010', '01010', '01010', '11111', '10001'],
    'И': ['10001', '10001', '10011', '10101', '11001', '10001', '10001'],
    'К': ['10001', '10010', '10100', '11000', '10100', '10010', '10001']
  };

  function voxelWord(b, word, cube, x0, y0, z, depth, colTop, colBottom) {
    const lw = 5 * cube + cube;
    const total = word.length * lw - cube;
    [...word].forEach((ch, li) => {
      const rows = LETTER_FONT[ch];
      if (!rows) return;
      rows.forEach((row, ry) => {
        [...row].forEach((bit, rx) => {
          if (bit !== '1') return;
          const k = ry / 6;
          const col = [colTop[0] + (colBottom[0] - colTop[0]) * k, colTop[1] + (colBottom[1] - colTop[1]) * k, colTop[2] + (colBottom[2] - colTop[2]) * k, 1];
          b.at(x0 - total / 2 + li * lw + rx * cube + cube / 2, y0 + (6 - ry) * cube + cube / 2, z, (c) => c.box(cube * 0.96, cube * 0.96, depth, col, { faces: { front: col, top: shade(col, 0.8), left: shade(col, 0.6), right: shade(col, 0.6), back: null, bottom: null } }));
        });
      });
    });
  }

  function buildIdent(r) {
    const tri = new Builder();
    tri.tri([0, 1.1, 0], [-0.95, -0.55, 0], [0.95, -0.55, 0], [[0.18, 0.36, 0.84, 1], [0.88, 0.19, 0.12, 1], [0.18, 0.72, 0.29, 1]]);
    tri.tri([0, 1.1, 0], [0.95, -0.55, 0], [-0.95, -0.55, 0], [[0.18, 0.36, 0.84, 1], [0.18, 0.72, 0.29, 1], [0.88, 0.19, 0.12, 1]]);
    const gems = MEMBERS.map(m => {
      const b = new Builder();
      const hex = parseInt(m.color.slice(1), 16);
      b.ellipsoid(0.22, 0.3, 0.22, 4, 2, [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, 0.85], { flat: true });
      return r.mesh(b);
    });
    return {
      env: { sunDir: [0.3, -0.5, -0.8], sunColor: [0.6, 0.6, 0.6], ambTop: [0.3, 0.3, 0.3], ambBottom: [0.1, 0.1, 0.1], fogColor: [0, 0, 0], fogNear: 50, fogFar: 90 },
      layers: [],
      draw(rr, t, shot) {
        const u = clamp((t - shot.start) / (shot.end - shot.start), 0, 1);
        if (shot.cam === 'logo') {
          const k = ease(u * 1.6);
          rr.draw(r.meshCache.tri, M4.chain(M4.rotY(t * 2.2), M4.scale(k)));
        } else {
          rr.draw(r.meshCache.tri, M4.chain(M4.rotY(t * 0.8), M4.scale(shot.cam === 'credits' ? 0.6 : 0.8)));
          if (shot.cam === 'endcard') {
            gems.forEach((g, i) => {
              const a = t * 0.9 + (i / 6) * PI * 2;
              rr.draw(g, M4.chain(M4.translate(C(a) * 2.1, S(a * 2) * 0.2, S(a) * 2.1 - 0.5), M4.rotY(t * 2)));
            });
          }
        }
      },
      init() { r.meshCache.tri = r.mesh(tri); }
    };
  }

  function buildSet(r) {
    const room = new Builder();
    room.quad([-8, 0, 8], [8, 0, 8], [8, 0, -6], [-8, 0, -6], [0.3, 0.2, 0.14, 0], [[0, 0], [8, 0], [8, 7], [0, 7]]);
    room.quad([-8, 0, -6], [8, 0, -6], [8, 6, -6], [-8, 6, -6], [0.22, 0.16, 0.13, 0]);
    room.quad([-8, 0, 8], [-8, 0, -6], [-8, 6, -6], [-8, 6, 8], [0.2, 0.15, 0.12, 0]);
    for (let i = 0; i < 9; i++) room.at(-3.2, 1.2 + i * 0.28, -5.95, (w) => w.box(4.2, 0.16, 0.02, [1, 0.72, 0.4, 0.9]));
    [[3.5, -3], [-3.8, 2.5]].forEach(([x, z]) => room.at(x, 0, z, (s) => {
      s.prism(6, 0.02, 0.02, 0, 0.02, 0.02, 2.2, [0.2, 0.2, 0.22, 0]);
      s.at(0, 2.3, 0, (h) => h.box(0.9, 0.7, 0.08, [1, 0.95, 0.85, 1]));
      [0, 2.1, 4.2].forEach(a => s.push(M4.rotY(a), M4.rotX(0.5)).box(0.03, 0.9, 0.03, [0.2, 0.2, 0.22, 0]).pop());
    }));
    room.at(-2.5, 0, -2.5, (c) => { c.box(1.4, 0.9, 1.0, [0.35, 0.25, 0.15, 0], { base: true }); c.at(0.2, 1.1, 0, (d) => d.box(0.6, 0.4, 0.6, [0.4, 0.3, 0.2, 0])); });
    const wood = r.texture(128, texNoise('#b08a60', 3, 0.25));
    return {
      env: {
        sunDir: V3.norm([0.4, -0.35, 0.85]),
        sunColor: [0.95, 0.68, 0.4],
        ambTop: [0.28, 0.22, 0.2],
        ambBottom: [0.1, 0.07, 0.06],
        fogColor: [0.12, 0.08, 0.06],
        fogNear: 8,
        fogFar: 30,
        points: [{ pos: [3.5, 2.3, -2.6], color: [1.2, 1.0, 0.8] }, { pos: [-2, 2.5, -5], color: [1.0, 0.6, 0.3] }]
      },
      layers: [{ mesh: r.mesh(room), texture: wood }],
      shadows: 'blob'
    };
  }

  function buildRoofs(r) {
    const facades = new Builder();
    const roofs = new Builder();
    const rr = rand(41);
    for (let gx = -4; gx <= 4; gx++) {
      for (let gz = -4; gz <= 4; gz++) {
        if (gx === 0 && gz === 0) continue;
        const w = 7 + rr() * 4, d = 7 + rr() * 4, h = gx === -1 && gz === 1 ? 13 : 5 + rr() * 12;
        const x = gx * 14 + (rr() - 0.5) * 2, z = gz * 14 + (rr() - 0.5) * 2;
        facades.at(x, 0, z, (b) => b.box(w, h, d, [1, 1, 1, 1], { base: true, uvScale: 0.25, faces: { top: null, bottom: null } }));
        roofs.at(x, h, z, (b) => b.box(w + 0.3, 0.3, d + 0.3, [0.14, 0.15, 0.2, 0], { faces: { bottom: null } }));
        if (rr() < 0.7) roofs.at(x + (rr() - 0.5) * w * 0.5, h + 0.15, z + (rr() - 0.5) * d * 0.5, (b) => b.box(1.3, 0.8, 1.0, [0.3, 0.31, 0.36, 0], { base: true }));
        if (rr() < 0.3) roofs.at(x, h + 0.15, z, (b) => { b.prism(10, 0.9, 0.9, 1.4, 0.9, 0.9, 3.2, [0.35, 0.28, 0.22, 0]); [[0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]].forEach(([lx, lz]) => b.at(lx, 0, lz, (l) => l.box(0.08, 1.4, 0.08, [0.2, 0.2, 0.2, 0], { base: true }))); });
      }
    }
    facades.at(0, 0, 0, (b) => b.box(14, 10, 14, [1, 1, 1, 1], { base: true, uvScale: 0.25, faces: { top: null, bottom: null } }));
    const hr = [0.16, 0.17, 0.22, 0];
    roofs.at(-4, 10, 0, (b) => b.box(6, 0.3, 14, hr, { faces: { bottom: null } }));
    roofs.at(4, 10, 0, (b) => b.box(6, 0.3, 14, hr, { faces: { bottom: null } }));
    roofs.at(0, 10, -4, (b) => b.box(2, 0.3, 6, hr, { faces: { bottom: null } }));
    roofs.at(0, 10, 4, (b) => b.box(2, 0.3, 6, hr, { faces: { bottom: null } }));
    roofs.at(0, 9.7, 0, (b) => b.quad([-1, 0, 1], [1, 0, 1], [1, 0, -1], [-1, 0, -1], [0.75, 0.95, 1, 1]));
    [[-1, 0], [1, 0]].forEach(([x]) => roofs.at(x, 10.25, 0, (b) => b.box(0.08, 0.2, 2, [0.5, 0.5, 0.55, 0])));
    roofs.at(4, 10.15, -4, (b) => { b.prism(10, 1.1, 1.1, 1.6, 1.1, 1.1, 3.8, [0.4, 0.3, 0.22, 0]); [[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]].forEach(([lx, lz]) => b.at(lx, 0, lz, (l) => l.box(0.1, 1.6, 0.1, [0.2, 0.2, 0.2, 0], { base: true }))); });
    roofs.quad([-80, 0, 80], [80, 0, 80], [80, 0, -80], [-80, 0, -80], [0.06, 0.07, 0.1, 0]);
    for (let i = 0; i < 40; i++) roofs.at(-60 + rr() * 120, 0.3, -60 + rr() * 120, (b) => b.box(0.3, 0.3, 0.3, [1, 0.7, 0.3, 1]));
    roofs.at(-60, 70, -120, (b) => b.ellipsoid(6, 6, 1, 12, 6, [0.9, 0.92, 1, 1]));
    const windows = r.texture(128, texWindows(12, ['#ffd27a', '#ffe6a8', '#7ae6ff', '#ff9a5a']));
    return {
      env: {
        sunDir: V3.norm([-0.4, -0.6, -0.7]),
        sunColor: [0.28, 0.34, 0.55],
        ambTop: [0.12, 0.15, 0.28],
        ambBottom: [0.04, 0.05, 0.09],
        fogColor: [0.05, 0.07, 0.14],
        fogNear: 25,
        fogFar: 120,
        points: [{ pos: [0, 9.2, 0], color: [0.6, 0.9, 1.0] }]
      },
      layers: [{ mesh: r.mesh(facades), texture: windows }, { mesh: r.mesh(roofs) }],
      shadows: 'blob'
    };
  }

  function buildVault(r) {
    const hall = new Builder();
    const wall = [0.12, 0.14, 0.18, 0];
    hall.quad([-2, 3.5, 10], [2, 3.5, 10], [2, 3.5, -40], [-2, 3.5, -40], [0.08, 0.09, 0.12, 0]);
    hall.quad([-2, 0, -40], [-2, 0, 10], [-2, 3.5, 10], [-2, 3.5, -40], wall);
    hall.quad([2, 0, 10], [2, 0, -40], [2, 3.5, -40], [2, 3.5, 10], wall);
    for (let z = 8; z > -38; z -= 3) {
      hall.at(-1.98, 1.75, z, (b) => b.box(0.02, 3.2, 0.06, [0.3, 0.9, 1, 1]));
      hall.at(1.98, 1.75, z, (b) => b.box(0.02, 3.2, 0.06, [0.3, 0.9, 1, 1]));
      hall.at(0, 3.47, z, (b) => b.box(1.6, 0.04, 0.2, [0.9, 0.95, 1, 1]));
    }
    for (let z = 4; z > -36; z -= 8) {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * PI * 2;
        hall.at(C(a) * 1.65, 1.75 + S(a) * 1.65, z, (b) => b.box(0.25, 0.25, 0.1, [0.6, 1, 1, 1]));
      }
    }
    hall.push(M4.translate(0, 1.75, -39.6), M4.rotX(PI / 2));
    hall.prism(20, 1.6, 1.6, 0, 1.6, 1.6, 0.4, [0.62, 0.64, 0.7, 0.1], { capTop: true });
    hall.pop();
    for (let i = 0; i < 6; i++) hall.push(M4.translate(0, 1.75, -39.15), M4.rotZ((i / 6) * PI)).box(2.6, 0.12, 0.08, [0.4, 0.42, 0.48, 0]).pop();
    hall.at(0, 1.75, -39.1, (b) => b.box(0.3, 0.3, 0.1, [1, 0.15, 0.15, 1]));
    const floor = new Builder();
    floor.quad([-2, 0, 10], [2, 0, 10], [2, 0, -40], [-2, 0, -40], [1, 1, 1, 1], [[0, 0], [2, 0], [2, 25], [0, 25]]);
    floor.quad([20, 0, 8], [40, 0, 8], [40, 0, -8], [20, 0, -8], [0.1, 0.1, 0.12, 0]);
    const screens = new Builder();
    screens.quad([-1.97, 0.6, -9], [-1.97, 0.6, -12], [-1.97, 2.8, -12], [-1.97, 2.8, -9], [1, 1, 1, 1], [[0, 0], [1.5, 0], [1.5, 1], [0, 1]]);
    screens.quad([-1.97, 0.4, -15], [-1.97, 0.4, -22], [-1.97, 3.2, -22], [-1.97, 3.2, -14], [1, 1, 1, 1], [[0, 0], [3, 0], [3, 1], [0, 1]]);
    const room = new Builder();
    room.quad([20, 0, -8], [40, 0, -8], [40, 6, -8], [20, 6, -8], [0.1, 0.1, 0.13, 0]);
    room.quad([36, 0, 8], [36, 0, -8], [36, 6, -8], [36, 6, 8], [0.12, 0.12, 0.15, 0]);
    [[24, -4], [29, 3], [33, -5], [23, 4]].forEach(([x, z]) => room.at(x, 0, z, (b) => b.box(1.6, 1.2, 1.6, [0.35, 0.28, 0.18, 0], { base: true })));
    for (let y = 0.3; y < 6; y += 0.4) room.at(35.9, y, -3, (b) => b.box(0.1, 0.05, 0.8, [0.5, 0.5, 0.55, 0]));
    room.at(35.9, 3, -3.4, (b) => b.box(0.08, 6, 0.06, [0.5, 0.5, 0.55, 0]));
    room.at(35.9, 3, -2.6, (b) => b.box(0.08, 6, 0.06, [0.5, 0.5, 0.55, 0]));
    const glows = new Builder();
    [[25, -1], [29, 1], [33, -1.5]].forEach(([x, z]) => glows.push(M4.translate(x, 6, z), M4.rotX(PI)).prism(10, 0.3, 0.3, 0, 1.8, 1.8, 6, [0.5, 0.75, 1, 1], { topColor: [0.05, 0.08, 0.12, 1], capTop: false, flat: true }).pop());
    const laser = new Builder();
    laser.box(5, 0.025, 0.025, [1, 0.1, 0.15, 1]);
    const grid = r.texture(128, texGrid('#39e6ff', '#05080e', 32));
    const glitch = r.texture(128, texGlitch);
    const laserMesh = r.mesh(laser);
    const hallEnv = {
      sunDir: [0, -1, 0],
      sunColor: [0.15, 0.2, 0.25],
      ambTop: [0.14, 0.18, 0.26],
      ambBottom: [0.04, 0.05, 0.07],
      fogColor: [0.02, 0.04, 0.07],
      fogNear: 8,
      fogFar: 42,
      points: [{ pos: [0, 2.5, -10], color: [0.4, 0.9, 1.0] }, { pos: [0, 1.2, -18], color: [1.0, 0.1, 0.15] }]
    };
    const roomEnv = Object.assign({}, hallEnv, { ambTop: [0.22, 0.26, 0.36], points: [{ pos: [29, 3.5, 1], color: [0.9, 1.2, 1.5] }, { pos: [33, 2.5, -3], color: [0.7, 0.9, 1.2] }] });
    return {
      envAt: (t, st) => (st && ['sneak', 'climb'].includes(st.shot.cam) ? roomEnv : hallEnv),
      layers: [
        { mesh: r.mesh(hall) },
        { mesh: r.mesh(floor), texture: grid },
        { mesh: r.mesh(room) }
      ],
      draw(rr, t) {
        rr.draw(r.meshCache.vaultScreens, null, { texture: glitch, uvScroll: [Math.floor(t * 8) * 0.37, Math.floor(t * 6) * 0.21] });
        for (let i = 0; i < 9; i++) {
          const z = -13 - i * 1.1;
          const a = t * (0.8 + i * 0.13) + i;
          rr.draw(laserMesh, M4.chain(M4.translate(0, 1.2 + 0.7 * S(t * 1.3 + i), z), M4.rotZ(0.6 * S(a))), { additive: true, alpha: 0.9 });
        }
      },
      glows: [{ mesh: r.mesh(glows), opts: { additive: true, alpha: 0.18 } }],
      init() { r.meshCache.vaultScreens = r.mesh(screens); },
      shadows: 'blob'
    };
  }

  function buildStreet(r, opts = {}) {
    const PERIOD = 60;
    const city = new Builder();
    const lamps = new Builder();
    const road = new Builder();
    const signs = new Builder();
    const rr = rand(19);
    for (let rep = -2; rep <= 3; rep++) {
      const z0 = rep * PERIOD;
      road.quad([-6, 0, z0 - PERIOD / 2], [6, 0, z0 - PERIOD / 2], [6, 0, z0 + PERIOD / 2], [-6, 0, z0 + PERIOD / 2], [0.6, 0.6, 0.66, 0], [[0, 0], [1, 0], [1, 6], [0, 6]]);
      [-1, 1].forEach(s => city.at(s * 7.5, 0.08, z0, (b) => b.box(3, 0.16, PERIOD, [0.3, 0.3, 0.34, 0])));
    }
    const blocks = [];
    for (let i = 0; i < 6; i++) blocks.push({ side: i % 2 ? 1 : -1, z: -PERIOD / 2 + (Math.floor(i / 2) + 0.5) * (PERIOD / 3), w: 8 + rr() * 4, d: 16 + rr() * 3, h: 8 + rr() * 16, sign: ['#ff2d9a', '#2de0ff', '#ffe23a', '#9a5aff'][Math.floor(rr() * 4)] });
    for (let rep = -2; rep <= 3; rep++) {
      const z0 = rep * PERIOD;
      blocks.forEach(bl => {
        const x = bl.side * (9 + bl.w / 2);
        city.at(x, 0, z0 + bl.z, (b) => b.box(bl.w, bl.h, bl.d, [1, 1, 1, 1], { base: true, uvScale: 0.25, faces: { top: null, bottom: null } }));
        const hex = parseInt(bl.sign.slice(1), 16);
        const col = [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, 1];
        signs.at(x - bl.side * (bl.w / 2 + 0.15), 4 + (bl.h - 8) * 0.3, z0 + bl.z, (b) => b.box(0.2, 1.2, 4, col));
      });
      for (let z = -PERIOD / 2; z < PERIOD / 2; z += 15) {
        [-1, 1].forEach(s => {
          lamps.at(s * 6.6, 0, z0 + z, (b) => {
            b.prism(6, 0.06, 0.06, 0, 0.05, 0.05, 5, [0.2, 0.2, 0.22, 0]);
            b.at(-s * 0.6, 5, 0, (h) => h.box(1.3, 0.08, 0.08, [0.2, 0.2, 0.22, 0]));
            b.at(-s * 1.1, 4.9, 0, (h) => h.box(0.4, 0.12, 0.25, [1, 0.8, 0.5, 1]));
          });
          lamps.at(s * 8.4, 0, z0 + z + 7, (b) => {
            b.push(M4.rotZ(s * 0.08)).prism(6, 0.12, 0.12, 0, 0.09, 0.09, 6, [0.35, 0.25, 0.18, 0]).pop();
            for (let k = 0; k < 7; k++) b.push(M4.translate(s * 0.48, 6, 0), M4.rotY((k / 7) * PI * 2), M4.rotZ(-0.5)).box(1.8, 0.04, 0.35, [0.15, 0.4, 0.2, 0]).pop();
          });
        });
      }
    }
    const garage = new Builder();
    garage.quad([190, 0, 12], [210, 0, 12], [210, 0, -30], [190, 0, -30], [0.35, 0.34, 0.33, 0]);
    garage.quad([190, 0, -30], [210, 0, -30], [210, 8, -30], [190, 8, -30], [0.2, 0.18, 0.16, 0]);
    garage.quad([190, 0, 12], [190, 0, -30], [190, 8, -30], [190, 8, 12], [0.22, 0.2, 0.18, 0]);
    garage.quad([210, 0, -30], [210, 0, 12], [210, 8, 12], [210, 8, -30], [0.22, 0.2, 0.18, 0]);
    [194, 206].forEach(x => {
      for (let z = -26; z < 10; z += 4) {
        garage.at(x, 0, z, (b) => {
          b.box(2, 0.08, 3.6, [0.55, 0.3, 0.1, 0]);
          [0, 1.5, 3].forEach(y => b.at(0, y + 0.05, 0, (s) => s.box(2, 0.06, 3.6, [0.6, 0.35, 0.12, 0])));
          [[-0.95, -1.75], [0.95, -1.75], [-0.95, 1.75], [0.95, 1.75]].forEach(([px, pz]) => b.at(px, 2.2, pz, (p) => p.box(0.08, 4.4, 0.08, [0.2, 0.3, 0.6, 0])));
          [0.1, 1.55].forEach(y => b.at(0, y + 0.5, 0, (c) => c.box(1.6, 0.8, 1.2 + (z % 3) * 0.3, [0.55, 0.42, 0.26, 0])));
        });
      }
    });
    garage.at(203, 0, 4, (f) => { f.box(1.3, 1.2, 2.2, [0.95, 0.65, 0.1, 0], { base: true }); f.at(0, 1.8, 1.2, (m) => m.box(1.1, 3.4, 0.12, [0.2, 0.2, 0.22, 0])); });
    const garageGlow = new Builder();
    [-20, -10, 0].forEach(z => {
      garage.at(200, 7.5, z, (l) => l.box(0.8, 0.15, 0.8, [1, 0.9, 0.6, 1]));
      garageGlow.push(M4.translate(200, 7.4, z), M4.rotX(PI)).prism(10, 0.4, 0.4, 0, 3, 3, 7.4, [1, 0.8, 0.5, 1], { topColor: [0.05, 0.04, 0.02, 1], capTop: false, flat: true }).pop();
    });
    const windows = r.texture(128, texWindows(23, ['#ff7ae0', '#ffd27a', '#7ae6ff']));
    const asphalt = r.texture(128, texRoad);
    const glowTex = r.texture(64, texGlow, { clamp: true });
    const smoke = new Builder();
    smoke.ellipsoid(1.2, 0.9, 1.2, 8, 5, [0.6, 0.55, 0.7, 0]);
    const spark = new Builder();
    spark.box(0.03, 0.03, 0.6, [1, 0.7, 0.2, 1]);
    const smokeMesh = r.mesh(smoke), sparkMesh = r.mesh(spark);
    return {
      env: {
        sunDir: V3.norm([0.3, -0.7, 0.4]),
        sunColor: [0.22, 0.2, 0.38],
        ambTop: [0.22, 0.16, 0.38],
        ambBottom: [0.06, 0.05, 0.1],
        fogColor: [0.12, 0.06, 0.2],
        fogNear: 14,
        fogFar: 78,
        points: [{ pos: [0, 4, 6], color: [1.0, 0.3, 0.7] }, { pos: [0, 4, -10], color: [0.3, 0.8, 1.0] }]
      },
      layers: [
        { mesh: r.mesh(road), texture: asphalt, scroll: PERIOD },
        { mesh: r.mesh(city), texture: windows, scroll: PERIOD },
        { mesh: r.mesh(lamps), scroll: PERIOD },
        { mesh: r.mesh(signs), scroll: PERIOD },
        { mesh: r.mesh(garage) }
      ],
      scrollSpeed: opts.speed || (() => STREET_SPEED),
      glows: [{ mesh: r.mesh(garageGlow), opts: { additive: true, alpha: 0.14 } }],
      draw(rr, t, shot, world) {
        if (shot.cam === 'sparks' || shot.cam === 'chase') {
          const van = world.vehicles[1];
          for (let i = 0; i < 14; i++) {
            const f = frac(t * 3 + i * 0.37);
            const p = M4.point(van.M, [(i % 2 ? 0.9 : -0.9) + 0.3 * S(i * 7), 0.1 + f * 0.5, -2.4 - f * 3]);
            rr.draw(sparkMesh, M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(S(i) * 0.5), M4.rotX(-0.3)), { additive: true, alpha: 1 - f });
          }
        }
        if (shot.cam === 'smoke' || shot.cam === 'buggy') {
          for (let i = 0; i < 7; i++) {
            const f = frac(t * 0.8 + i / 7);
            const p = M4.point(world.vehicles[0].M, [(i % 2 ? 0.6 : -0.6), 0.5 + f, -2.5 - f * 7]);
            rr.draw(smokeMesh, M4.chain(M4.translate(p[0], p[1], p[2]), M4.scale(0.6 + f * 1.6)), { flat: [0.55, 0.5, 0.65, 0.35 * (1 - f)], blend: true });
          }
        }
        if (['garage', 'garageClose'].includes(shot.cam)) rr.draw(r.meshCache.flare, M4.translate(200, 7.3, -10), { additive: true, alpha: 0.6, texture: glowTex });
      },
      init() {
        const f = new Builder();
        f.quad([-1.5, -1.5, 0], [1.5, -1.5, 0], [1.5, 1.5, 0], [-1.5, 1.5, 0], [1, 0.85, 0.6, 1]);
        r.meshCache.flare = r.mesh(f);
      },
      shadows: 'blob'
    };
  }

  function truss(b, a, c, size, col) {
    const d = V3.sub(c, a);
    const len = V3.len(d);
    const yaw = Math.atan2(d[0], d[2]);
    const pitch = Math.asin(clamp(d[1] / len, -1, 1));
    b.push(M4.translate(a[0], a[1], a[2]), M4.rotY(yaw), M4.rotX(-pitch));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, y]) => b.at(x * size / 2, y * size / 2, len / 2, (s) => s.box(0.05, 0.05, len, col)));
    for (let z = 0; z + size <= len; z += size) {
      [-1, 1].forEach(x => b.push(M4.translate(x * size / 2, 0, z + size / 2), M4.rotX(-0.785)).box(0.03, 0.03, size * 1.41, col).pop());
      [-1, 1].forEach(y => b.push(M4.translate(0, y * size / 2, z + size / 2), M4.rotY(0.785)).box(0.03, 0.03, size * 1.41, col).pop());
    }
    b.pop();
  }

  function buildRing(r) {
    const arena = new Builder();
    arena.quad([-30, 0, 30], [30, 0, 30], [30, 0, -30], [-30, 0, -30], [0.08, 0.06, 0.12, 0]);
    arena.at(0, 0, 0, (b) => b.box(7.6, RING_Y - 0.1, 7.6, [0.16, 0.1, 0.28, 0], { base: true }));
    arena.at(0, RING_Y - 0.1, 0, (b) => b.box(7.2, 0.1, 7.2, [0.82, 0.82, 0.88, 0], { base: true }));
    [[3.5, 3.5], [-3.5, 3.5], [3.5, -3.5], [-3.5, -3.5]].forEach(([x, z]) => arena.at(x, RING_Y, z, (b) => b.prism(8, 0.09, 0.09, 0, 0.09, 0.09, 1.5, [0.9, 0.9, 0.95, 0.1])));
    [1.45, 1.85, 2.25].forEach((y, i) => {
      const col = i % 2 ? [1, 1, 1, 0.3] : [1, 0.25, 0.7, 0.5];
      [[0, 3.5, 7, 0.05], [0, -3.5, 7, 0.05]].forEach(([x, z, w]) => arena.at(x, y, z, (b) => b.box(w, 0.05, 0.05, col)));
      [[3.5, 0], [-3.5, 0]].forEach(([x, z]) => arena.at(x, y, z, (b) => b.box(0.05, 0.05, 7, col)));
    });
    const steel = [0.55, 0.55, 0.6, 0];
    [[6, 6], [-6, 6], [6, -6], [-6, -6]].forEach(([x, z]) => truss(arena, [x, 0, z], [x, 8, z], 0.5, steel));
    truss(arena, [-6, 8, 6], [6, 8, 6], 0.5, steel);
    truss(arena, [-6, 8, -6], [6, 8, -6], 0.5, steel);
    truss(arena, [6, 8, -6], [6, 8, 6], 0.5, steel);
    truss(arena, [-6, 8, -6], [-6, 8, 6], 0.5, steel);
    for (let ring = 0; ring < 4; ring++) {
      const d = 11 + ring * 2.2;
      const y = 0.4 + ring * 0.9;
      [[0, d, 2 * d, 1.6], [0, -d, 2 * d, 1.6]].forEach(([x, z, w, dd]) => arena.at(x, y / 2, z, (b) => b.box(w, y, dd, [0.14, 0.08, 0.2, 0])));
      [[d, 0], [-d, 0]].forEach(([x, z]) => arena.at(x, y / 2, z, (b) => b.box(1.6, y, 2 * d, [0.14, 0.08, 0.2, 0])));
    }
    [[-2.4, 5.3], [-1.2, 5.3], [0, 5.3], [1.2, 5.3], [2.4, 5.3]].forEach(([x, z]) => arena.at(x, 0, z, (b) => { b.box(0.5, 0.45, 0.5, [0.2, 0.2, 0.24, 0], { base: true }); b.at(0, 0.75, 0.22, (c) => c.box(0.5, 0.6, 0.06, [0.2, 0.2, 0.24, 0])); }));
    const screens = new Builder();
    screens.quad([-7, 3, -18], [7, 3, -18], [7, 10, -18], [-7, 10, -18], [1, 1, 1, 1], [[0, 0], [2, 0], [2, 1], [0, 1]]);
    screens.quad([18, 3, -7], [18, 3, 7], [18, 10, 7], [18, 10, -7], [1, 1, 1, 1], [[0, 0], [2, 0], [2, 1], [0, 1]]);
    screens.quad([-18, 3, 7], [-18, 3, -7], [-18, 10, -7], [-18, 10, 7], [1, 1, 1, 1], [[0, 0], [2, 0], [2, 1], [0, 1]]);
    const leds = new Builder();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2;
      leds.at(C(a) * 17, 5.5, S(a) * 17, (b) => b.box(1.5, 0.2, 1.5, i % 2 ? [1, 0.2, 0.7, 1] : [0.2, 0.9, 1, 1]));
    }
    const spots = new Builder();
    [[6, 6], [-6, 6], [6, -6], [-6, -6]].forEach(([x, z]) => {
      const dir = V3.norm([-x, -8, -z]);
      spots.push(M4.translate(x, 8, z), M4.rotY(Math.atan2(dir[0], dir[2])), M4.rotX(Math.atan2(Math.hypot(dir[0], dir[2]), dir[1])));
      spots.prism(10, 0.25, 0.25, 0, 1.8, 1.8, 10, [0.9, 0.8, 1, 1], { topColor: [0.05, 0.04, 0.08, 1], capTop: false, flat: true });
      spots.pop();
    });
    const screenTex = r.texture(128, texStripes(['#ff2d9a', '#2a0a3a', '#2de0ff', '#12051e', '#9a5aff', '#2a0a3a'], false));
    return {
      env: {
        sunDir: V3.norm([0.1, -1, 0.25]),
        sunColor: [0.6, 0.5, 0.75],
        ambTop: [0.32, 0.22, 0.48],
        ambBottom: [0.08, 0.05, 0.12],
        fogColor: [0.17, 0.09, 0.26],
        fogNear: 10,
        fogFar: 48,
        points: [{ pos: [0, 5, 0], color: [1.3, 1.2, 1.4] }, { pos: [0, 4, -12], color: [1.0, 0.3, 0.8] }]
      },
      layers: [{ mesh: r.mesh(arena) }, { mesh: r.mesh(leds) }],
      draw(rr, t) {
        rr.draw(r.meshCache.ringScreens, null, { texture: screenTex, uvScroll: [t * 0.4, 0] });
      },
      glows: [{ mesh: r.mesh(spots), opts: { additive: true, alpha: 0.14 } }],
      init() { r.meshCache.ringScreens = r.mesh(screens); },
      shadows: 'blob'
    };
  }

  function buildDesert(r, opts = {}) {
    const isDusk = opts.isDusk || ((t) => t < DUSK_END);
    const PERIOD = 80;
    const sand = new Builder();
    const props = new Builder();
    const rr = rand(55);
    for (let rep = -2; rep <= 3; rep++) {
      const z0 = rep * PERIOD;
      sand.quad([-120, 0, z0 - PERIOD / 2], [120, 0, z0 - PERIOD / 2], [120, 0, z0 + PERIOD / 2], [-120, 0, z0 + PERIOD / 2], [0.95, 0.72, 0.5, 0], [[0, 0], [24, 0], [24, 8], [0, 8]]);
      sand.quad([-4, 0.01, z0 - PERIOD / 2], [4, 0.01, z0 - PERIOD / 2], [4, 0.01, z0 + PERIOD / 2], [-4, 0.01, z0 + PERIOD / 2], [0.8, 0.58, 0.4, 0], [[0, 0], [1, 0], [1, 8], [0, 8]]);
    }
    const items = [];
    for (let i = 0; i < 16; i++) {
      const side = rr() < 0.5 ? -1 : 1;
      items.push({ kind: rr(), x: side * (9 + rr() * 30), z: -PERIOD / 2 + rr() * PERIOD, s: rr() });
    }
    for (let rep = -2; rep <= 3; rep++) {
      const z0 = rep * PERIOD;
      items.forEach(it => {
        const x = it.x, z = z0 + it.z;
        if (it.kind < 0.35) props.at(x, -0.5, z, (b) => b.ellipsoid(4 + it.s * 5, 1.4 + it.s, 3 + it.s * 3, 8, 4, [0.95, 0.7, 0.48, 0]));
        else if (it.kind < 0.6) props.at(x, 0, z, (b) => { b.box(3 + it.s * 3, 2.4 + it.s * 2, 3, [0.88, 0.72, 0.52, 0], { base: true }); b.at(0, 1.2, 1.51, (w) => w.box(0.6, 0.7, 0.02, [0.2, 0.12, 0.08, 0])); });
        else if (it.kind < 0.85) props.at(x, 0, z, (b) => {
          b.push(M4.rotZ(0.1)).prism(6, 0.14, 0.14, 0, 0.1, 0.1, 5.5, [0.45, 0.32, 0.2, 0]).pop();
          for (let k = 0; k < 7; k++) b.push(M4.translate(0.55, 5.5, 0), M4.rotY((k / 7) * PI * 2), M4.rotZ(-0.45)).box(2.0, 0.04, 0.4, [0.25, 0.45, 0.2, 0]).pop();
        });
        else props.at(x, 0, z, (b) => { b.prism(6, 0.1, 0.1, 0, 0.08, 0.08, 9, [0.3, 0.3, 0.32, 0]); b.at(0, 9, 0, (h) => h.box(1.4, 0.8, 0.3, [1, 0.95, 0.8, 1])); });
      });
    }
    const far = new Builder();
    const sunsetLow = [1, 0.62, 0.32, 1], sunsetMid = [0.95, 0.45, 0.45, 1], sunsetTop = [0.35, 0.25, 0.52, 1];
    const D = 170;
    [[0, 1], [PI / 2, 1], [PI, 1], [-PI / 2, 1]].forEach(([a]) => {
      far.push(M4.rotY(a));
      far.quad([-D, -5, D], [D, -5, D], [D, 14, D], [-D, 14, D], [sunsetLow, sunsetLow, sunsetMid, sunsetMid]);
      far.quad([-D, 14, D], [D, 14, D], [D, 70, D], [-D, 70, D], [sunsetMid, sunsetMid, sunsetTop, sunsetTop]);
      far.pop();
    });
    far.quad([-D, 70, D], [D, 70, D], [D, 70, -D], [-D, 70, -D], sunsetTop);
    far.at(0, 11, D - 2, (b) => b.ellipsoid(9, 9, 1, 14, 7, [1, 0.92, 0.65, 1]));
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * PI * 2, dd = 140;
      far.push(M4.rotY(a)).tri([-24, -1, dd], [24, -1, dd], [rr() * 10 - 5, 10 + rr() * 16, dd], [0.42, 0.25, 0.3, 0.55]).pop();
    }
    const mesas = new Builder();
    [[-40, 60], [55, 30], [-70, -20], [30, 90]].forEach(([x, z]) => mesas.at(x, 0, z, (b) => b.prism(7, 12, 9, 0, 9, 7, 14, [0.8, 0.42, 0.28, 0])));
    const pool = new Builder();
    pool.at(40, 0.02, 0, (b) => b.box(9, 0.04, 4.5, [0.25, 0.65, 0.85, 0.35]));
    pool.at(40, 0.05, 0, (b) => b.box(9.6, 0.1, 5.1, [0.85, 0.82, 0.76, 0], { faces: { top: null } }));
    const wheelProp = new Builder();
    wheelProp.push(M4.rotY(0.4), M4.rotZ(PI / 2 - 0.15));
    wheelProp.prism(14, 0.75, 0.75, -0.05, 0.75, 0.75, 0.05, [0.35, 0.22, 0.12, 0], { capTop: false });
    for (let k = 0; k < 7; k++) wheelProp.push(M4.rotY((k / 7) * PI)).box(1.45, 0.06, 0.06, [0.4, 0.26, 0.14, 0]).pop();
    wheelProp.pop();
    const gate = new Builder();
    [-12, -6, -4.2, 4.2, 6, 12].forEach(x => gate.at(x, 0, 0, (b) => b.prism(6, 0.06, 0.06, 0, 0.06, 0.06, 2.6, [0.5, 0.5, 0.52, 0])));
    [-1, 1].forEach(s => gate.at(s * 8.1, 1.3, 0, (b) => b.box(7.8, 2.4, 0.02, [0.7, 0.72, 0.74, 0])));
    gate.at(-5.1, 1.5, 0.05, (b) => b.box(1.6, 1.0, 0.03, [1, 1, 1, 0.2]));
    const signFace = new Builder();
    signFace.quad([-0.78, -0.48, 0.07], [0.78, -0.48, 0.07], [0.78, 0.48, 0.07], [-0.78, 0.48, 0.07], [1, 1, 1, 0.4], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const dust = new Builder();
    dust.ellipsoid(0.9, 0.6, 0.9, 8, 4, [0.9, 0.7, 0.5, 0]);
    const bolt = new Builder();
    let px = 0, py = 12;
    for (let i = 0; i < 8; i++) {
      const nx = px + (rr() - 0.5) * 3, ny = py - 1.5;
      bolt.quad([px - 0.15, py, 0], [px + 0.15, py, 0], [nx + 0.15, ny, 0], [nx - 0.15, ny, 0], [1, 0.95, 0.3, 1]);
      px = nx; py = ny;
    }
    const sandTex = r.texture(128, texNoise('#e8c090', 31, 0.25));
    const signTex = r.texture(128, texSign, { clamp: true });
    const meshes = { pool: r.mesh(pool), wheel: r.mesh(wheelProp), gate: r.mesh(gate), sign: r.mesh(signFace), dust: r.mesh(dust), bolt: r.mesh(bolt) };
    const sunset = {
      sunDir: V3.norm([0, -0.35, -0.94]),
      sunColor: [1.0, 0.7, 0.45],
      ambTop: [0.45, 0.35, 0.55],
      ambBottom: [0.42, 0.28, 0.2],
      fogColor: [0.95, 0.6, 0.45],
      fogNear: 30,
      fogFar: 170
    };
    const dusk = {
      sunDir: V3.norm([0.3, -0.5, -0.8]),
      sunColor: [0.3, 0.42, 0.85],
      ambTop: [0.22, 0.3, 0.6],
      ambBottom: [0.12, 0.14, 0.3],
      fogColor: [0.2, 0.3, 0.6],
      fogNear: 25,
      fogFar: 150
    };
    return {
      envAt: (t) => (isDusk(t) ? dusk : sunset),
      layers: [
        { mesh: r.mesh(sand), texture: sandTex, scroll: PERIOD },
        { mesh: r.mesh(props), scroll: PERIOD },
        { mesh: r.mesh(mesas) },
        { mesh: r.mesh(far), opts: { noFog: true }, tintAt: (t) => (isDusk(t) ? [0.35, 0.55, 1.2] : [1, 1, 1]) }
      ],
      scrollSpeed: opts.speed || desertSpeed,
      draw(rr, t, shot, world) {
        if (shot.cam === 'splash') {
          rr.draw(meshes.pool, null);
          for (let i = 0; i < 18; i++) {
            const f = frac((t - 173.21) * 0.9 + i * 0.05);
            const a = (i / 18) * PI * 2;
            rr.draw(meshes.dust, M4.chain(M4.translate(40 + C(a) * (1 + f * 3), 0.3 + S(PI * f) * 2, S(a) * (0.6 + f * 1.5)), M4.scale(0.3)), { flat: [0.85, 0.95, 1, 0.8 * (1 - f)], blend: true });
          }
        }
        if (shot.cam === 'wheel') rr.draw(meshes.wheel, M4.translate(-3.3, 0.75, 4.2));
        if (shot.cam === 'gate') {
          const gz = 12 - 14 * (t - shot.start);
          rr.draw(meshes.gate, M4.translate(0, 0, gz));
          rr.draw(meshes.sign, M4.translate(-5.1, 1.5, gz), { texture: signTex });
        }
        if (shot.cam === 'duskSky') {
          for (let i = 0; i < 3; i++) rr.draw(meshes.bolt, M4.chain(M4.translate(-8 + i * 7, 4, -22), M4.rotZ(0.2 * S(i))), { additive: true, alpha: frac(t * 3 + i * 0.3) < 0.5 ? 1 : 0.2 });
        }
        world.vehicles.forEach(v => {
          if (v.kind !== 'jeep' && v.kind !== 'bike') return;
          for (let i = 0; i < 4; i++) {
            const f = frac(t * 1.6 + i / 4);
            const p = M4.point(v.M, [(i % 2 ? 0.8 : -0.8) * (v.kind === 'bike' ? 0.2 : 1), 0.3 + f * 0.6, -1.8 - f * 5]);
            rr.draw(meshes.dust, M4.chain(M4.translate(p[0], p[1], p[2]), M4.scale(0.5 + f * 1.8)), { flat: [0.9, 0.68, 0.48, 0.45 * (1 - f)], blend: true });
          }
        });
      },
      shadows: 'blob'
    };
  }

  function buildDeep(r) {
    const floor = new Builder();
    floor.quad([-40, 0, 30], [40, 0, 30], [40, 0, -40], [-40, 0, -40], [0.6, 0.6, 0.5, 0], [[0, 0], [10, 0], [10, 9], [0, 9]]);
    const rr = rand(8);
    for (let i = 0; i < 30; i++) floor.at(-20 + rr() * 40, 0, -30 + rr() * 45, (b) => b.ellipsoid(0.6 + rr() * 1.8, 0.4 + rr(), 0.6 + rr() * 1.5, 7, 4, [0.3, 0.35, 0.35, 0]));
    for (let i = 0; i < 40; i++) {
      const x = -18 + rr() * 36, z = -25 + rr() * 35, h = 2 + rr() * 6;
      floor.push(M4.translate(x, 0, z), M4.rotZ((rr() - 0.5) * 0.3)).prism(4, 0.08, 0.02, 0, 0.05, 0.01, h, [0.2, 0.55, 0.3, 0.1], { capTop: false }).pop();
    }
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * PI * 2;
      floor.at(C(a) * 3.2, 4 + S(a) * 3.2, -10, (b) => b.box(0.6, 0.6, 0.8, [0.45, 0.5, 0.55, 0.1]));
      floor.at(C(a) * 2.8, 4 + S(a) * 2.8, -9.55, (b) => b.box(0.2, 0.2, 0.05, [0.4, 1, 1, 1]));
    }
    const bubbles = new Builder();
    for (let i = 0; i < 90; i++) bubbles.at(-10 + rr() * 20, rr() * 14, -14 + rr() * 18, (b) => b.box(0.06 + rr() * 0.06, 0.06 + rr() * 0.06, 0.06, [0.8, 1, 1, 0.8]));
    const shafts = new Builder();
    for (let i = 0; i < 6; i++) {
      const x = -8 + i * 3.4, z = -6 + rr() * 6;
      shafts.quad([x - 0.6, 16, z], [x + 0.6, 16, z], [x + 2.2, 0, z - 2], [x + 0.4, 0, z - 2], [[0.5, 0.9, 1, 1], [0.5, 0.9, 1, 1], [0, 0.05, 0.08, 1], [0, 0.05, 0.08, 1]]);
    }
    const swirl = new Builder();
    for (let i = 0; i < 36; i++) {
      const a = i * 0.5, rad = 0.2 + i * 0.075;
      const col = i % 3 === 0 ? [1, 0.4, 0.8, 1] : [0.4, 0.95, 1, 1];
      swirl.quad([C(a) * rad, S(a) * rad, 0], [C(a + 0.45) * (rad + 0.08), S(a + 0.45) * (rad + 0.08), 0], [C(a + 0.45) * (rad + 0.3), S(a + 0.45) * (rad + 0.3), 0], [C(a) * (rad + 0.22), S(a) * (rad + 0.22), 0], col);
    }
    const debris = new Builder();
    debris.box(0.5, 0.3, 0.7, [0.5, 0.45, 0.4, 0]);
    const sandTex = r.texture(128, texNoise('#c8b890', 13, 0.25));
    const caustic = r.texture(128, texCaustics);
    const meshes = { bubbles: r.mesh(bubbles), swirl: r.mesh(swirl), debris: r.mesh(debris) };
    const envBase = {
      sunDir: V3.norm([0.1, -1, 0.1]),
      sunColor: [0.45, 0.85, 0.95],
      ambTop: [0.12, 0.36, 0.52],
      ambBottom: [0.02, 0.08, 0.15],
      fogColor: [0.02, 0.18, 0.3],
      fogNear: 3,
      fogFar: 28,
      points: [{ pos: [0, 4, -9.5], color: [0.6, 1.4, 1.6] }]
    };
    return {
      envAt: (t) => Object.assign({}, envBase, { cookie: { texture: caustic, matrix: cookieMatrix([0.1, -1, 0.1], [t * 0.35, 0, t * 0.2], 3), strength: 0.8 } }),
      layers: [{ mesh: r.mesh(floor), texture: sandTex }],
      draw(rr, t, shot) {
        const off = mod(t * 1.3, 14);
        rr.draw(meshes.bubbles, M4.translate(0, off, 0), { noCookie: true });
        rr.draw(meshes.bubbles, M4.translate(0, off - 14, 0), { noCookie: true });
        [0, 1, 2].forEach(k => rr.draw(meshes.swirl, M4.chain(M4.translate(0, 4, -9.9 + k * 0.05), M4.rotZ(-t * (1.2 + k * 0.5)), M4.scale(1 - k * 0.2)), { additive: true, alpha: 0.6 }));
        if (shot.cam === 'debris') {
          for (let i = 0; i < 12; i++) rr.draw(meshes.debris, M4.chain(M4.translate(-2 + (i % 4) * 1.6, 2 + Math.floor(i / 4) * 1.4 + 0.3 * S(t + i), -2 - 0.25 * (t - 142) + (i % 3)), M4.rotX(t * (0.5 + i * 0.1)), M4.rotY(t * 0.7 + i)));
        }
      },
      glows: [{ mesh: r.mesh(shafts), opts: { additive: true, alpha: 0.12, noCookie: true } }],
      shadows: 'none'
    };
  }

  function buildDream(r) {
    const bridge = new Builder();
    bridge.at(0, -0.2, 0, (b) => b.box(60, 0.4, 3.2, [0.35, 0.12, 0.14, 0]));
    for (let x = -30; x <= 30; x += 1.5) {
      [-1.5, 1.5].forEach(z => bridge.at(x, 0.5, z, (b) => b.box(0.08, 1.0, 0.08, [0.15, 0.05, 0.06, 0])));
      if (Math.round(x * 2) % 6 === 0) bridge.at(x, 1.1, 1.5, (b) => b.box(0.15, 0.15, 0.15, [1, 0.8, 0.3, 1]));
    }
    [-1.5, 1.5].forEach(z => bridge.at(0, 1.0, z, (b) => b.box(60, 0.08, 0.1, [0.2, 0.06, 0.08, 0])));
    bridge.at(-11.5, 1.6, -0.2, (b) => b.box(0.1, 2.4, 3.6, [0.12, 0.03, 0.05, 0]));
    const screen = new Builder();
    screen.quad([-11.44, 0.6, 1.4], [-11.44, 0.6, -1.8], [-11.44, 2.6, -1.8], [-11.44, 2.6, 1.4], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const cloud = new Builder();
    cloud.ellipsoid(3, 1.6, 3, 9, 5, [1, 0.4, 0.5, 0]);
    const rr = rand(4);
    const clouds = [];
    for (let i = 0; i < 16; i++) clouds.push([-28 + rr() * 56, -3 + rr() * 4, (rr() < 0.5 ? -1 : 1) * (4 + rr() * 10), 0.7 + rr() * 1.5]);
    const glitch = r.texture(128, texGlitch);
    const cloudMesh = r.mesh(cloud);
    return {
      envAt: (t, world) => {
        const sp = world && world.focus && world.focus.spirit ? world.focus.spirit.hips : [0, 1, 0];
        return {
          sunDir: [0, -1, 0.2],
          sunColor: [0.5, 0.1, 0.15],
          ambTop: [0.7, 0.2, 0.3],
          ambBottom: [0.25, 0.03, 0.08],
          fogColor: [0.5, 0.07, 0.15],
          fogNear: 5,
          fogFar: 42,
          points: [{ pos: V3.add(sp, [0, 0.4, 0.6]), color: [0.4, 1.4, 1.6] }, { pos: [0, 3, 3], color: [0.8, 0.3, 0.4] }]
        };
      },
      layers: [{ mesh: r.mesh(bridge) }],
      draw(rr, t) {
        rr.draw(r.meshCache.dreamScreen, null, { texture: glitch, uvScroll: [0, Math.floor(t * 10) * 0.13] });
        clouds.forEach(([x, y, z, s], i) => rr.draw(cloudMesh, M4.chain(M4.translate(x + 0.4 * S(t * 0.3 + i), y, z), M4.scale(s)), { flat: [0.95, 0.35, 0.5, 0.22], blend: true }));
      },
      init() { r.meshCache.dreamScreen = r.mesh(screen); },
      shadows: 'blob'
    };
  }

  function buildStage(r, opts = {}) {
    const stageMesh = new Builder();
    stageMesh.quad([-100, 0, 20], [100, 0, 20], [100, 0, -20], [-100, 0, -20], [0.05, 0.05, 0.07, 0]);
    stageMesh.quad([-16, 0, -12], [16, 0, -12], [16, 12, -12], [-16, 12, -12], [0.1, 0.04, 0.14, 0]);
    for (let x = -14; x <= 14; x += 2) stageMesh.at(x, 0.01, -8, (b) => b.box(0.9, 0.02, 0.1, [1, 0.3, 0.6, 1]));
    voxelWord(stageMesh, opts.word || 'PARANOIA', opts.cube || 0.62, 0, 0.4, -9.5, 0.7, [1, 0.35, 0.65], [1, 0.62, 0.2]);
    if (opts.topWord) voxelWord(stageMesh, opts.topWord, opts.cube || 0.62, 0, 0.4 + 8 * (opts.cube || 0.62), -9.5, 0.7, [0.45, 1, 0.35], [1, 0.9, 0.2]);
    stageMesh.at(2.6, 0, -7, (b) => {
      b.box(2.4, 0.5, 1.0, [0.45, 0.15, 0.6, 0], { base: true });
      b.at(0, 0.7, -0.4, (c) => c.box(2.4, 0.9, 0.25, [0.4, 0.12, 0.55, 0]));
      [-1.1, 1.1].forEach(x => b.at(x, 0.6, 0, (c) => c.box(0.25, 0.4, 1.0, [0.4, 0.12, 0.55, 0])));
    });
    const walls = new Builder();
    walls.quad([-50, 0, -6], [-30, 0, -6], [-30, 10, -6], [-50, 10, -6], [1, 1, 1, 1], [[0, 0], [3, 0], [3, 1.5], [0, 1.5]]);
    const comicL = new Builder();
    comicL.quad([32, 0, -7], [40, 0, -7], [40, 8, -7], [32, 8, -7], [1, 1, 1, 1]);
    const comicR = new Builder();
    comicR.quad([40, 0, -7], [48, 0, -7], [48, 8, -7], [40, 8, -7], [1, 1, 1, 1]);
    const lineup = new Builder();
    lineup.quad([72, 0, -2], [88, 0, -2], [88, 5, -2], [72, 5, -2], [1, 1, 1, 0.55], [[0, 0], [3, 0], [3, 1], [0, 1]]);
    lineup.quad([72, 0, 3], [88, 0, 3], [88, 0, -2], [72, 0, -2], [0.3, 0.3, 0.34, 0]);
    const red = new Builder();
    red.quad([-90, 0, -7], [-70, 0, -7], [-70, 10, -7], [-90, 10, -7], [0.9, 0.12, 0.15, 1]);
    red.at(-80, 3.5, -6.9, (b) => starburst(b, 1.2, 6, 14, [0.05, 0.0, 0.02, 1], [0.95, 0.2, 0.2, 1], 0));
    const smoke = new Builder();
    smoke.ellipsoid(1.6, 0.8, 1.6, 8, 4, [1, 0.5, 0.8, 0]);
    const smokeMesh = r.mesh(smoke);
    const diamondTex = r.texture(128, texDiamonds);
    const lineupTex = r.texture(128, texLineup);
    const comicA = r.texture(128, texComic(['#22d8e8', '#ff2a4a', '#1a1a2a', '#ffe23a'], 3));
    const comicB = r.texture(128, texComic(['#6ae08a', '#f2f25a', '#1a3a2a', '#ff7a3a'], 8));
    return {
      env: {
        sunDir: V3.norm([0.2, -0.6, -0.7]),
        sunColor: [0.75, 0.6, 0.85],
        ambTop: [0.38, 0.28, 0.48],
        ambBottom: [0.1, 0.06, 0.12],
        fogColor: [0.12, 0.05, 0.14],
        fogNear: 16,
        fogFar: 70,
        points: [{ pos: [0, 3, -7], color: [1.3, 0.45, 0.85] }, { pos: [-40, 3, -3], color: [1.2, 0.2, 0.3] }]
      },
      layers: [
        { mesh: r.mesh(stageMesh) },
        { mesh: r.mesh(walls), texture: diamondTex },
        { mesh: r.mesh(comicL), texture: comicA },
        { mesh: r.mesh(comicR), texture: comicB },
        { mesh: r.mesh(lineup), texture: lineupTex },
        { mesh: r.mesh(red) }
      ],
      draw(rr, t, shot) {
        if (shot.cam === 'scream') {
          for (let i = 0; i < 8; i++) rr.draw(smokeMesh, M4.chain(M4.translate(-2.2 + S(i * 2.1) * 2.5, 0.4 + (i % 3) * 0.5, -4.8 + C(i * 1.7) * 1.5), M4.scale(1 + 0.2 * S(t + i))), { flat: [1, 0.45, 0.8, 0.25], blend: true });
        }
      },
      shadows: 'blob'
    };
  }

  function buildBurst(r, opts = {}) {
    const table = opts.table || BURSTS;
    const meshes = {};
    const words = {};
    Object.keys(table).forEach(k => {
      const d = table[k];
      if (d.text) {
        const wb = new Builder();
        wb.quad([-2.2, -0.9, -1.2], [2.2, -0.9, -1.2], [2.2, 0.9, -1.2], [-2.2, 0.9, -1.2], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        words[k] = { mesh: r.mesh(wb), tex: r.texture(256, (ctx, w, h) => {
          ctx.clearRect(0, 0, w, h);
          ctx.font = `bold ${d.textSize || 96}px Impact, Arial Black, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 14;
          ctx.strokeStyle = '#111';
          ctx.strokeText(d.text, w / 2, h / 2);
          ctx.fillStyle = d.textColor || '#fff';
          ctx.fillText(d.text, w / 2, h / 2);
        }, { clamp: true, height: 128 }) };
      }
      const b = new Builder();
      b.quad([-12, -12, -3.2], [12, -12, -3.2], [12, 12, -3.2], [-12, 12, -3.2], [...d.bg, 1]);
      starburst(b, 1.6, 9, 18, [...d.a, 1], [...d.bg, 1], -3.1);
      starburst(b, 0.8, 4, 12, [...d.b, 1], [...d.a, 1], -3.0);
      meshes[k] = r.mesh(b);
    });
    const lines = new Builder();
    const rr = rand(2);
    for (let i = 0; i < 40; i++) {
      const a = rr() * PI * 2, r0 = 1.5 + rr() * 2, r1 = r0 + 3 + rr() * 5;
      lines.tri([C(a) * r0, S(a) * r0, -2.9], [C(a + 0.03) * r1, S(a + 0.03) * r1, -2.9], [C(a - 0.03) * r1, S(a - 0.03) * r1, -2.9], [1, 1, 1, 1]);
    }
    const lineMesh = r.mesh(lines);
    return {
      env: { sunDir: V3.norm([0.4, -0.5, -0.75]), sunColor: [1, 1, 1], ambTop: [0.55, 0.55, 0.6], ambBottom: [0.25, 0.25, 0.3], fogColor: [0, 0, 0], fogNear: 50, fogFar: 90 },
      layers: [],
      draw(rr2, t, shot) {
        rr2.draw(meshes[shot.cam], M4.chain(M4.translate(0, 1.1, 0), M4.rotZ(t * 0.6)), { noFog: true });
        if (['charge', 'fly', 'whoosh', 'splash'].includes(shot.cam) || table[shot.cam].lines) rr2.draw(lineMesh, M4.chain(M4.translate(0, 1.1, 0), M4.rotZ(t * 5)), { additive: true, alpha: 0.8, noFog: true });
        const wd = words[shot.cam];
        if (wd) {
          const k = clamp((t - shot.start) / 0.25, 0, 1);
          rr2.draw(wd.mesh, M4.chain(M4.translate(0, 2.1, 0.6), M4.rotZ(0.12 * S(t * 9)), M4.scale(0.6 + 0.5 * k)), { texture: wd.tex, noFog: true });
        }
      },
      shadows: 'none'
    };
  }

  const BUILDERS = { ident: buildIdent, set: buildSet, roofs: buildRoofs, vault: buildVault, street: buildStreet, ring: buildRing, desert: buildDesert, deep: buildDeep, dream: buildDream, stage: buildStage, burst: buildBurst };

  function makeCreate(spec) {
    return function create(renderer) {
    const { builders: BUILDERS, looks: LOOKS, vehicles: VEHICLES, prop: makeProp, stage, shotAt, fadeAt } = spec;
    renderer.meshCache = renderer.meshCache || {};
    const overlay = spec.overlay ? spec.overlay(renderer) : null;
    const scenes = {};
    const figures = {};
    const vehicles = {};
    const props = {};
    const sceneFor = (id) => {
      if (!scenes[id]) {
        scenes[id] = BUILDERS[id](renderer, (spec.sceneOpts && spec.sceneOpts[id]) || {});
        if (scenes[id].init) scenes[id].init();
      }
      return scenes[id];
    };
    const figureFor = (a) => {
      const key = a.id + ':' + a.look;
      if (!figures[key]) {
        const look = LOOKS[a.look];
        figures[key] = new Figure(renderer, look, look.size || 'm');
      }
      return figures[key];
    };
    const vehicleFor = (kind) => {
      if (!vehicles[kind]) vehicles[kind] = VEHICLES[kind](renderer);
      return vehicles[kind];
    };
    const propFor = (id) => {
      if (!props[id]) props[id] = makeProp(id, renderer);
      return props[id];
    };
    const drawVehicle = (v, glowPass) => {
      const vh = vehicleFor(v.kind);
      if (glowPass) {
        if (vh.glow) renderer.draw(vh.glow, v.M, { additive: true, alpha: 0.16 });
        return;
      }
      renderer.draw(vh.body, v.M);
      vh.wheels.forEach(w => renderer.draw(vh.wheel, M4.chain(v.M, M4.translate(w[0], w[1], w[2]), M4.rotX(v.spin))));
    };
    const drawProps = (a, fig, t) => {
      (a.props || []).forEach(pr => {
        const P = propFor(pr.id);
        const off = M4.mul(M4.translate(pr.at[0], pr.at[1], pr.at[2]), M4.scale(pr.scale || 1));
        fig.drawProp(P.mesh, pr.part, off);
        if (P.face) fig.drawProp(P.face, pr.part, off, { texture: P.tex });
        if (P.extra) P.extra(t, pr).forEach(e => fig.drawProp(e.mesh, pr.part, M4.mul(off, e.M), e.opts));
      });
    };
    return {
      warm() {
        Object.keys(BUILDERS).forEach(sceneFor);
      },
      render(t) {
        const shot = shotAt(t);
        const sc = sceneFor(shot.scene);
        const st = stage(t, shot);
        const env = sc.envAt ? sc.envAt(t, st) : sc.env;
        renderer.begin(env, st.camera);
        const speed = sc.scrollSpeed ? sc.scrollSpeed(shot) : 0;
        sc.layers.forEach(l => {
          let model = null;
          if (l.scroll) model = M4.translate(0, 0, -mod(t * speed, l.scroll));
          const opts = Object.assign({ texture: l.texture }, l.opts || {});
          if (l.tintAt) opts.tint = l.tintAt(t);
          renderer.draw(l.mesh, model, opts);
        });
        if (sc.draw) sc.draw(renderer, t, shot, st);
        st.vehicles.forEach(v => drawVehicle(v, false));
        if (overlay && overlay.opaque) overlay.opaque(renderer, t, shot, st);
        const active = st.cast.map(a => ({ a, fig: figureFor(a) }));
        active.forEach(({ a, fig }) => {
          fig.solve(a.pose);
          if (a.hidden) return;
          if (a.glow) {
            fig.drawParts({ additive: true, alpha: 0.55 });
          } else if (a.silhouette) {
            fig.drawParts({ flat: [0.02, 0.02, 0.03, 1] });
          } else {
            fig.draw();
            drawProps(a, fig, t);
          }
        });
        if (sc.shadows === 'blob') active.forEach(({ a, fig }) => { if (!a.hidden && a.pose.ground !== false && !a.glow) fig.drawBlob(0.3); });
        (sc.glows || []).forEach(l => renderer.draw(l.mesh, null, l.opts));
        st.vehicles.forEach(v => drawVehicle(v, true));
        active.forEach(({ a, fig }) => {
          (a.props || []).forEach(pr => {
            const P = propFor(pr.id);
            if (P.glow && !a.hidden) fig.drawProp(P.glow, pr.part, M4.translate(pr.at[0], pr.at[1], pr.at[2]), { additive: true, alpha: 0.2 });
          });
        });
        if (overlay && overlay.blend) overlay.blend(renderer, t, shot, st);
        return { shot, polys: Math.round(renderer.polys), fade: fadeAt(t), overlay: shot.overlay };
      }
    };
    };
  }

  function paranoiaProp(id, r) {
    if (id.startsWith('slate_')) return slateProp(r, MEMBERS.find(m => m.id === id.slice(6)));
    return PROPS[id](r);
  }

  const create = makeCreate({ builders: BUILDERS, looks: LOOKS, vehicles: VEHICLES, prop: paranoiaProp, stage, shotAt, fadeAt });

  window.P3DParanoiaKit = {
    moves: { base, bounce, dance, sneak, run, sit, cheer, swim, fly, fight, kick, robotSwing, scared, scream, poseCool, holdFront, holdCam, jumpArc, limbo, cartwheel, climb },
    cams: { wobble, frame, head, around, vpos },
    tex: { texNoise, texWindows, texGrid, texStripes, texRoad, texGlitch, texCaustics, texText, texLineup, texComic, texDiamonds, texSign, texGlow },
    geo: { uvq, cone, wheelMesh, beams, truss, starburst, voxelWord },
    builders: BUILDERS,
    VEHICLES,
    PROPS,
    LOOKS,
    actor,
    carSeat,
    vehicleMatrix,
    solveFocus,
    makeCreate,
    RING_Y,
    STREET_SPEED,
    DESERT_SPEED
  };

  const clip = {
    id: 'heartsteel-paranoia',
    number: 2,
    artist: 'HEARTSTEEL',
    title: 'PARANOIA',
    originalYear: 2023,
    audio: 'content/clip/HEARTSTEEL– PARANOIA.mp3',
    duration: DURATION,
    bpm: BPM,
    poster: 179.3,
    locations: LOCATIONS,
    shots: SHOTS,
    looks: Object.fromEntries(MEMBERS.map(m => [m.id, LOOKS[m.id]])),
    members: MEMBERS,
    shotAt,
    stage,
    fadeAt,
    voiceAt,
    create
  };

  window.poligonClips = window.poligonClips || [];
  if (!window.poligonClips.some(c => c.id === clip.id)) window.poligonClips.push(clip);
})();
