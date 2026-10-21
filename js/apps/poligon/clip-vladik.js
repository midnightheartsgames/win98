(function () {
  const { M4, V3, Builder, shade, rand } = window.P3D;
  const K = window.P3DParanoiaKit;
  const { base, bounce, dance, sneak, run, sit, cheer, swim, fly, fight, robotSwing, poseCool, holdFront, jumpArc } = K.moves;
  const { frame, head, around, vpos } = K.cams;
  const { texNoise, texGrid, texText, texGlow } = K.tex;
  const { uvq, cone } = K.geo;

  const BPM = 85;
  const BEAT0 = 0.404;
  const DURATION = 218.36;
  const VOICE = '0000235040596c7milmjm5rlellkizhzvi60rjiwo80qki0qmi9harzn7qu00xt08cd0z0cbc79abfmpjbtcgljfby13g6p0x00zk00f0ppv00t0gdyf9v6aetpls9ccskg91975a9unc0650x460aluyri0q20bhz0018zq05he8xo78d9kjz9bx9e8gv7h000xvcw2u0u2008q5weis300fcv0a80zgf3ie0x0e4hl0vebfrfeebu9iifzdu8zu0t810fsjrk40pb74bqbtoqurz0fd0zma0cgyuvnlh009on0007byl0vfilzfilny2yc0md89flsfl60z2t0100v96birbtlkeib5tno0mqozwnkzi7p0i29cduab0ib4m600h16rd6bm4dq40000pzm8ik03yejgf10nt8crc90xkhz5f0z0dq0c5xf0d0w1naifhb9n62xli4rg0k100d9ek950p800jfcllsmupjvrrgxpzzzy0qfrmk70hkjw900d0hvs00p67fh60cc8szb4id7kndm70o0za0t630og2a850z1054d7w764c80vc6t132d9c5rg4z9b05f0h0020k0ubckuc0dbd0efezpm0oqnj740fglzs00rjaagh0bh3zv80hd9pglld7m5zk3s970ih07d50yb0ick0e667860zj6j0820767jd7z34e035j3020k0u0amoc0c7441f4zpqfig0z9b57kpofztk2f8o00ck80c00e85r200iflkzicp8fgrc3eer6z8chihewp60ei0zpfh0sasfsg7j0z0405dqx00dem2zbfcoe7o2c5du0zja0gc0v3t5erkzrr0gpqk0t0flhwwg9a01z630b0nrwiks0f0hp0mkgczf69078l46iimdw0fn8g08pmhcekz0nl2j0704qbr0zd2nhmjg8r5600z9j0550ig9g9e1gdm0c4ndgn2nioxry7lbkc00043pzta0b60l00006iszo5iia5kc9i0t9xsinahfwsspdlcznbe0cgq4000l0o080010v36lil8xpuaodshhg5ntdzndctimragawsdztqbizpa4007898510l90ofd0a0rb2b29c8i9307cm0ei0oef0yph5fz9l2i9691eaf07s87cac7a5z960i208fd3mnmvih51704592d80b1h24a02a00dh0pywvvpxrnd0icml020c9kzw80hfd79a0860ny10e64dhj955l0zg3k740ea589e0z6570f1k9609j0yb5k322b0c0a92ue154d4e1300o0z95cod0bci6nj9uoh0qoqf570c8dzra0ld82cf0060ss40g69ijlkg9j4zg9n4309f64ef0yg4m8e0j8c00c0zcan045j188ji0x5bs7i4l01f880x799bl0mdh1cofwkk0oq7sg4000wuzzwwsvnuuztzrhxf7jkex81091o0a8021708h383a0lpfp368800hba0zrckhnhhbn00e0ygixmp7t9p0bu3hprofoflgzklj0zkqlh02r0hhcp00m47eopjf70nlmmfj0ub7j0adodzvlb2k0060zfc4e0hkb7aefrwlc0u0ofuvbipreuj0ahzlkwoudyeqn0t07gqsgq0d0s7cg5a083l00ulw2yv3zfz0hpmzmuhon99j4ge9g6355b200000dc03pjhif37ka0re57wtrubr0rupq8p0wqzztzvvm588j9e0095f1va0ha90c1j0500td05db1k5m5dh0zk60o65ghj0bf3vbd08b2ah823dfxwa0nce92j0lc7zt90c74g90000cdzccq7d0df9hbi0zl6l5d3g20f0baz70j4l0a847330y0aee00nbf80c0zi03f8299i27a5z786hi3lc903e0ws60h9f30c0d91zoh0i63a0d1a0euwi6k8i0hc6e7i0zogmit0qqssmyil0xtpnmqkn0ei0z8ohjuim00dnk0z1ojkuvlrfdjssyrekqndl000ec0wsp8f0of9k0jffytrjp0lmc00ndmzynqmlqaop070rpzn6edq0n00ifp0ztpo8h9lj6mlwwrt0xrppzmssqqollkkliffecb8a9baded9efcaa8755600040n000';
  const VOICE_LV = Array.from(VOICE, ch => parseInt(ch, 36) / 35);
  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (x) => { const k = clamp(x, 0, 1); return k * k * (3 - 2 * k); };
  const inWin = (t, a, b) => t >= a && t < b;
  const frac = (x) => x - Math.floor(x);
  const beatAt = (t) => ((t - BEAT0) * BPM) / 60;
  const bar = (k) => Math.round((BEAT0 + (k * 240) / BPM) * 100) / 100;

  const LOCATIONS = [
    { id: 'ident', name: 'Заставка', color: '#8a8f99', scene: 'ident' },
    { id: 'flat', name: 'Квартира', color: '#6f86b8', scene: 'flat' },
    { id: 'bath', name: 'Туалет', color: '#9fd8e8', scene: 'bath' },
    { id: 'pool', name: 'Бассейн', color: '#e8d23a', scene: 'deep' },
    { id: 'ring', name: 'Ринг', color: '#c64fb8', scene: 'ring' },
    { id: 'vault', name: 'Коридор', color: '#e0304e', scene: 'vault' },
    { id: 'street', name: 'Ночная улица', color: '#8e3fd6', scene: 'street' },
    { id: 'store', name: 'Магазин', color: '#4fc36a', scene: 'store' },
    { id: 'roofs', name: 'Крыши', color: '#2b6f9e', scene: 'roofs' },
    { id: 'stage', name: 'Сцена', color: '#ff5f8f', scene: 'stage' },
    { id: 'bridge', name: 'Мост', color: '#9c1a24', scene: 'dream' },
    { id: 'desert', name: 'Пустыня', color: '#f0a040', scene: 'desert' },
    { id: 'burst', name: 'Комикс', color: '#f5e03a', scene: 'burst' }
  ];

  const GRADES = {
    pee: [1.7, 1.45, 0.45, 0.85],
    clinic: [1.45, 1.5, 1.6, 0.55],
    alarm: [1.5, 0.55, 0.55, 0.2],
    dark: [0.55, 0.5, 0.65, 0.2],
    lamp: [1.9, 1.7, 1.45, 0.1]
  };

  const SHOT_LIST = [
    [0, 'ident', 'logo'], [2, 'flat', 'bedNight'], [4.3, 'burst', 'puk1'], [5.4, 'flat', 'blanket'], [6.9, 'burst', 'puk2'],
    [8, 'flat', 'wake'], [9.9, 'flat', 'clap'],
    [bar(4), 'flat', 'sofa'], [bar(5), 'flat', 'fridge'], [16.1, 'flat', 'wcDoor'], [bar(6), 'flat', 'faceSad'],
    [bar(7), 'pool', 'peeSwim', { grade: 'pee' }], [bar(8), 'ring', 'fartSix'], [bar(9), 'bath', 'toiletSad'],
    [bar(10), 'vault', 'gasWalk', { alarm: true }], [bar(11), 'flat', 'window'], [bar(12), 'flat', 'stare'],
    [bar(13), 'street', 'gangsta'], [bar(14), 'stage', 'felix'], [bar(15), 'bridge', 'granny'], [bar(16), 'store', 'prices'],
    [bar(17), 'flat', 'runWc'],
    [bar(18), 'burst', 'bzdyn'], [52.4, 'street', 'kart'], [bar(20), 'street', 'kartFront'], [bar(21), 'street', 'vanChoke'],
    [bar(22), 'street', 'kartSide'], [bar(23), 'stage', 'danceFriends'], [bar(24), 'stage', 'mega'], [bar(25), 'stage', 'thinker'],
    [bar(26), 'flat', 'bedNight'],
    [bar(27), 'desert', 'relax'], [bar(28), 'store', 'candy'], [bar(29), 'flat', 'pc'], [bar(30), 'flat', 'monitor'],
    [bar(31), 'street', 'gangsta2'], [bar(32), 'roofs', 'vsj'], [bar(33), 'vault', 'doctors', { grade: 'clinic' }],
    [95.9, 'burst', 'nani'], [97.1, 'stage', 'critters'], [bar(35), 'store', 'trolley'], [bar(36), 'store', 'thumbs'],
    [bar(37), 'store', 'euro'], [bar(38), 'roofs', 'yakuza'],
    [bar(39), 'bridge', 'writhe'], [bar(40), 'desert', 'hunter'], [bar(41), 'flat', 'gasCloud'], [bar(42), 'vault', 'tiptoe'],
    [bar(43), 'bath', 'doorSlam'],
    [bar(44), 'ring', 'entrance'], [bar(45), 'ring', 'fightV'], [bar(46), 'ring', 'crowdV'], [bar(47), 'ring', 'blast'],
    [bar(48), 'burst', 'pukBig'], [137.2, 'ring', 'robotFly'], [bar(49), 'ring', 'win'], [bar(50), 'stage', 'mega'],
    [bar(51), 'stage', 'thinker'], [bar(52), 'flat', 'bedNight'],
    [bar(53), 'flat', 'skuf'], [bar(54), 'street', 'bench', { grade: 'lamp' }], [bar(55), 'flat', 'oysters'], [bar(56), 'stage', 'girl'],
    [bar(57), 'stage', 'beer'], [bar(58), 'stage', 'flex'], [bar(59), 'stage', 'thumbsLine'], [bar(60), 'pool', 'swimHappy'],
    [bar(61), 'pool', 'surface'], [bar(62), 'burst', 'mega'],
    [bar(63), 'desert', 'toiletJeep'], [bar(64), 'desert', 'critterBikes'], [bar(65), 'desert', 'gasTrail'],
    [bar(66), 'stage', 'danceAll'], [bar(67), 'stage', 'danceAllWide'], [bar(68), 'desert', 'fartJet'],
    [bar(69), 'desert', 'sunsetRide'], [bar(70), 'stage', 'thinkerDark', { grade: 'dark' }],
    [bar(71), 'bath', 'row'], [bar(72), 'bath', 'rowClose'], [bar(73), 'bath', 'smile'], [bar(74), 'flat', 'sunrise'],
    [bar(75), 'ident', 'endcard']
  ];

  const SHOTS = SHOT_LIST.map(([start, loc, cam, opts], i) => ({
    index: i,
    start,
    end: i + 1 < SHOT_LIST.length ? SHOT_LIST[i + 1][0] : DURATION,
    loc,
    cam,
    scene: LOCATIONS.find(l => l.id === loc).scene,
    grade: opts && opts.grade ? GRADES[opts.grade] : null,
    alarm: !!(opts && opts.alarm),
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

  function voiceAt(t) {
    if (t < 4 || t > 212) return 0;
    const f = t * 10;
    const i = Math.floor(f);
    const a = VOICE_LV[i] || 0, b = VOICE_LV[i + 1] || 0;
    return Math.pow(a + (b - a) * (f - i), 0.85);
  }

  function fadeAt(t) {
    if (t < 0.4) return 1 - t / 0.4;
    if (t > 214.5) return clamp((t - 214.5) / 3.6, 0, 1);
    return 0;
  }

  const FRIENDS = ['kamya', 'maks', 'lyoha', 'felix', 'bald'];
  const CRITTER_FUR = [[0xd8b080, 0x8a5aa8], [0xa8a8b0, 0x3a8ad0], [0xf2f0e8, 0xe05a5a], [0xe89a4a, 0x3ab06a], [0xc8a8e0, 0xf2c21a], [0x9ae0c8, 0xff7ab0]];

  const LOOKS = {
    vladik: { skin: 0xf0d0bc, hair: 0x3a2a20, hairStyle: 'short', top: 0x6a7890, collar: 0x5a6880, cuffs: 0x5a6880, legs: 0x7a7a82, shoes: 0x3050a0, eyes: 0x4a5a6a },
    vladikCool: { skin: 0xf0d0bc, hair: 0x3a2a20, hairStyle: 'short', top: 0x1a1a1e, collar: 0xe8c030, cuffs: 0xe8c030, shirtFront: 0xe8c030, legs: 0x2a2a30, shoes: 0xf2f2f2, glasses: true },
    vladikRobe: { skin: 0xf0d0bc, hair: 0x3a2a20, hairStyle: 'short', top: 0xf6f6f2, coat: 0xf6f6f2, collar: 0xe8e8e0, shirtFront: 0x6a7890, legs: 0x7a7a82, shoes: 0x3050a0, eyes: 0x4a5a6a },
    kamya: { skin: 0xe8c0a0, hair: 0x6a4a2a, hairStyle: 'short', top: 0x2a7a6a, collar: 0x1a5a4a, legs: 0x2a2a34, shoes: 0xf0f0f0, eyes: 0x3a2a20 },
    maks: { skin: 0xf0c8a8, hair: 0xd8b060, hairStyle: 'crop', top: 0xf08a3a, shirtFront: 0xfff0c0, bareArms: true, shortSleeves: true, legs: 0x3a6ab0, bareLegs: true, shoes: 0xf0f0f0, glasses: true },
    lyoha: { skin: 0xf2d2b8, hair: 0x2a1a10, hairStyle: 'cap', hat: 0xc03030, top: 0x8a2a2a, legs: 0x2a2a34, shoes: 0xf0f0f0, eyes: 0x3a2a20 },
    felix: { skin: 0xf0c8a8, hair: 0xb05a20, hairStyle: 'short', top: 0x3a8a4a, collar: 0xf2f2f2, legs: 0x2a3a5a, shoes: 0x5a3a20, eyes: 0x3a6a30 },
    bald: { skin: 0xe8c0a0, hair: 0x222222, hairStyle: 'bald', top: 0x1a1a1a, collar: 0x3a3a3a, legs: 0x2a2a30, shoes: 0x111111, eyes: 0x3a2a20 },
    granny: { size: 'f', skin: 0xe8c0a8, hair: 0xcfcfcf, hairStyle: 'scarf', hat: 0xc03a5a, top: 0x7a6a5a, dress: 0x3a3a5a, legs: 0xe8c0a8, bareLegs: true, shoes: 0x3a2a1a, specs: 0x604020, eyes: 0x3a3a3a },
    doctor: { skin: 0xf0c8a8, hair: 0x3a2a20, hairStyle: 'short', top: 0x5ab0a0, coat: 0xf6f6f6, sleeves: 0xf6f6f6, legs: 0x5ab0a0, shoes: 0xf0f0f0, specs: 0x202020, eyes: 0x3a2a20 },
    doctor2: { skin: 0xb8845a, hair: 0x1a1a1a, hairStyle: 'crop', top: 0x5ab0a0, coat: 0xf6f6f6, sleeves: 0xf6f6f6, legs: 0x5ab0a0, shoes: 0xf0f0f0, eyes: 0x2a1a10 },
    thug: { skin: 0xf0c8a8, hair: 0x111111, hairStyle: 'short', top: 0xf2f2f0, shirtFront: 0x151515, lapels: true, legs: 0xf2f2f0, shoes: 0x151515, glasses: true },
    slim: { skin: 0xf0c8a8, hair: 0x5a4a3a, hairStyle: 'short', top: 0x3a3a8a, collar: 0x2a2a6a, legs: 0x2a2a34, shoes: 0xf0f0f0, eyes: 0x3a2a20 },
    skuf: { skin: 0xf0c8a8, hair: 0x5a4a3a, hairStyle: 'crop', top: 0xf2f2f2, bareArms: true, shortSleeves: true, legs: 0x3a3a60, shoes: 0x3a3a3a, belly: true, eyes: 0x3a2a20 },
    sleeper: { skin: 0xd0a080, hair: 0x2a1a10, hairStyle: 'bucket', hat: 0x6a6a4a, top: 0x4a4a3a, legs: 0x3a3a30, shoes: 0x2a2a2a, eyes: 0x2a1a10 },
    jolly: { skin: 0xf0c8a8, hair: 0x8a6a4a, hairStyle: 'short', top: 0x1a1a22, shirtFront: 0xf6f6f6, lapels: true, collar: 0xf6f6f6, legs: 0x1a1a22, shoes: 0x111111, eyes: 0x3a2a20 },
    easy: { size: 'f', skin: 0xf2caa8, hair: 0xf0d890, hairStyle: 'long', top: 0xff6aa8, bareArms: true, shortSleeves: true, legs: 0x2a2a3a, shoes: 0xffffff, eyes: 0x3a6a8a },
    hunter: { skin: 0xe8c0a0, hair: 0x5a3a20, hairStyle: 'cap', hat: 0x4a6a2a, top: 0xff7a1a, sleeves: 0x4a6a2a, legs: 0x4a5a2a, shoes: 0x3a2a1a, eyes: 0x3a2a20 },
    robot: K.LOOKS.robot
  };
  CRITTER_FUR.forEach(([fur, hoodie], i) => {
    LOOKS['critter' + i] = { size: 'f', scale: 0.55, skin: fur, hair: fur, hairStyle: 'ears', earInner: 0xf0a0b0, top: hoodie, legs: shade(hoodie, 0.6), shoes: 0x2a2a2a, eyes: 0x1a1a1a };
  });

  function member(id, look, pose, t, extra) {
    if (!pose.mouth) pose.mouth = extra && extra.sings ? voiceAt(t) : 0;
    pose.blink = frac(t * 0.31 + id.length * 0.13) < 0.035 ? 1 : 0;
    return Object.assign({ id, look, pose, hidden: false }, extra || {});
  }

  const cloud = (k) => ({ id: 'rainCloud', part: 'head', at: [0, 0.5, 0], scale: k === undefined ? 1 : k });

  function slump(p) {
    p.spine = [0.45, 0, 0.05];
    p.neck = [0.5, 0, 0];
    p.shL = [0.15, 0, 0.1];
    p.shR = [0.15, 0, 0.1];
    p.elL = [0.3, 0, 0];
    p.elR = [0.3, 0, 0];
    return p;
  }

  function lie(p, h) {
    p.ground = false;
    p.pivot = 0.93;
    p.rx = -PI / 2;
    p.y = h - 0.93;
    p.shL = [0.1, 0, 0.2];
    p.shR = [0.1, 0, 0.2];
    return p;
  }

  function bendOver(p, k) {
    p.spine = [1.1 * k, 0, 0];
    p.neck = [-0.8 * k, 0, 0];
    p.knL = [0.35 * k, 0, 0];
    p.knR = [0.35 * k, 0, 0];
    p.hipL = [0.3 * k, 0, 0.18];
    p.hipR = [0.3 * k, 0, 0.18];
    p.shL = [0.9 * k, 0, 0.2];
    p.shR = [0.9 * k, 0, 0.2];
    p.elL = [0.6, 0, 0];
    p.elR = [0.6, 0, 0];
    return p;
  }

  function thinker(p) {
    p.spine = [0.5, 0, 0];
    p.neck = [0.1, 0, 0];
    p.shR = [1.55, 0.55, 0];
    p.elR = [2.35, 0, 0];
    p.shL = [0.6, 0.4, 0.1];
    p.elL = [1.2, 0, 0];
    return p;
  }

  function headInHands(p) {
    p.spine = [0.6, 0, 0];
    p.neck = [0.5, 0, 0];
    p.shL = [1.5, 0.55, 0.05];
    p.elL = [2.3, 0, 0];
    p.shR = [1.5, 0.55, 0.05];
    p.elR = [2.3, 0, 0];
    return p;
  }

  function flex(p, b) {
    const k = 0.5 + 0.5 * S(2 * PI * b);
    p.shL = [PI / 2, PI / 2, 0];
    p.elL = [1.7 + 0.3 * k, 0, 0];
    p.shR = [PI / 2, PI / 2, 0];
    p.elR = [1.7 + 0.3 * k, 0, 0];
    p.spine = [-0.1, 0.15 * S(PI * b), 0];
    p.knL = [0.2 * k, 0, 0];
    p.knR = [0.2 * k, 0, 0];
    p.hipL = [0.1, 0, 0.2];
    p.hipR = [0.1, 0, 0.2];
    return p;
  }

  function thumbs(p, b) {
    bounce(p, b, 0.8);
    p.shL = [1.3, 0.2, 0.2];
    p.elL = [1.5, 0, 0];
    p.shR = [1.3, 0.2, 0.2];
    p.elR = [1.5, 0, 0];
    return p;
  }

  function phoneTalk(p, b) {
    bounce(p, b, 0.5);
    p.shR = [1.7, 0.5, 0.35];
    p.elR = [2.4, 0, 0];
    p.shL = [0.4, 0, 0.3];
    p.elL = [1.4, 0, 0];
    return p;
  }

  function noseHold(p) {
    p.shR = [1.6, 0.6, 0.05];
    p.elR = [2.35, 0, 0];
    p.shL = [0.6, 0.2, 0.5];
    p.elL = [0.4, 0, 0];
    p.spine = [-0.2, 0.3, 0];
    p.neck = [-0.1, 0.4, 0];
    return p;
  }

  function writhe(p, t) {
    p.ground = false;
    p.pivot = 0.93;
    p.rx = -PI / 2 + 0.2 * S(t * 7);
    p.rz = 0.5 * S(t * 5);
    p.y = -0.75;
    p.hipL = [0.9 + 0.6 * S(t * 9), 0, 0.2];
    p.hipR = [0.9 - 0.6 * S(t * 9), 0, 0.2];
    p.knL = [1.2, 0, 0];
    p.knR = [1.2, 0, 0];
    p.shL = [2.2 + 0.6 * S(t * 8), 0, 0.5];
    p.shR = [2.2 - 0.6 * S(t * 8), 0, 0.5];
    p.spine = [0.3 * S(t * 6), 0.4 * S(t * 4), 0];
    return p;
  }

  function waveArm(p, b) {
    bounce(p, b, 0.7);
    p.shR = [2.8, 0, 0.5 + 0.35 * S(2 * PI * b)];
    p.elR = [0.3, 0, 0];
    return p;
  }

  function point(p) {
    p.shR = [1.55, -0.3, 0.1];
    p.elR = [0.05, 0, 0];
    p.neck = [0, 0, 0];
    return p;
  }

  function flyAway(p, f, dir) {
    p.ground = false;
    p.pivot = 0.6;
    p.rx = -dir * 5 * f;
    p.y = 3 * S(PI * Math.min(1, f * 1.3));
    p.z += -dir * 6 * f;
    p.shL = [2.8, 0, 0.9];
    p.shR = [2.8, 0, 0.9];
    p.hipL = [0.8, 0, 0.5];
    p.hipR = [0.2, 0, 0.5];
    p.mouth = 1;
    return p;
  }

  function worldIdent() {
    return { cast: [], vehicles: [] };
  }

  function worldFlat(t, b, shot) {
    const cast = [];
    const c = shot.cam;
    if (c === 'bedNight' || c === 'blanket') {
      const p = lie(base(-2.2, -1.75, 0), 0.68);
      cast.push(member('vladik', 'vladik', p, t));
      return { cast, vehicles: [] };
    }
    if (c === 'wake' || c === 'clap' || c === 'sunrise') {
      const p = sit(base(-1.55, -1.7, PI / 2), 0.55, false);
      if (c === 'sunrise') {
        p.shL = [2.9, 0.3, 0.5];
        p.elL = [0.3, 0, 0];
        p.shR = [2.9, 0.3, 0.5];
        p.elR = [0.3, 0, 0];
        p.spine = [-0.15, 0, 0];
        p.neck = [-0.3, 0, 0];
        p.mouth = 0.6;
      } else slump(p);
      cast.push(member('vladik', 'vladik', p, t, { sings: c !== 'clap', props: c === 'sunrise' ? [] : [cloud()] }));
      if (c === 'clap') cast.push(member('felix', 'felix', holdFront(base(0.2, -1.3, -PI / 2)), t, { props: [{ id: 'clapper', part: 'torso', at: [0, 0.34, 0.3] }] }));
      return { cast, vehicles: [] };
    }
    if (c === 'sofa' || c === 'faceSad') {
      const p = slump(sit(base(8, -2.05, 0), 0.5, false));
      p.shL = [0.4, 0.3, 0.1];
      p.elL = [1.0, 0, 0];
      if (c === 'faceSad') p.neck = [-0.05, 0, 0];
      cast.push(member('vladik', 'vladik', p, t, { sings: true, props: [cloud()] }));
      return { cast, vehicles: [] };
    }
    if (c === 'gasCloud') {
      const k = member('kamya', 'kamya', noseHold(base(7.2, -0.6, 0.3)), t);
      const m = member('maks', 'maks', noseHold(base(8.9, -0.3, -0.3)), t);
      const v = slump(sit(base(8, -2.05, 0), 0.5, false));
      v.mouth = 0.4;
      cast.push(k, m, member('vladik', 'vladik', v, t, { sings: true }));
      return { cast, vehicles: [] };
    }
    if (c === 'fridge') {
      const p = base(15.1, -1.2, PI);
      p.shR = [1.3, 0.2, 0.3];
      p.elR = [0.4, 0, 0];
      p.spine = [0.25, 0, 0];
      p.neck = [0.2, 0, 0];
      cast.push(member('vladik', 'vladik', p, t, { sings: true }));
      return { cast, vehicles: [] };
    }
    if (c === 'wcDoor' || c === 'runWc') {
      const p = c === 'runWc' ? run(base(13.2 + 2.1 * (t - shot.start), -1.3, PI / 2 + 0.3), b * 2) : base(18.4, -1.4, 2.55);
      if (c === 'wcDoor') p.neck = [0.1, 0.5 * ease((t - shot.start) / 0.6), 0];
      cast.push(member('vladik', 'vladik', p, t, { sings: c === 'wcDoor' }));
      return { cast, vehicles: [] };
    }
    if (c === 'window' || c === 'stare') {
      const p = base(1.4, -2.0, PI);
      p.spine = [0.1, 0, 0];
      p.neck = [0.25, 0, 0];
      p.shL = [0.2, 0, 0.1];
      p.shR = [0.2, 0, 0.1];
      if (c === 'stare') { p.ry = 0; p.z = -1.2; p.neck = [0, 0, 0]; }
      cast.push(member('vladik', 'vladik', p, t, { sings: c === 'window', props: [cloud()] }));
      return { cast, vehicles: [] };
    }
    if (c === 'pc' || c === 'monitor') {
      const p = sit(base(25, -1.65, PI), 0.5, true);
      p.spine = [0.25, 0, 0];
      p.shL = [1.1, 0.35, 0.05];
      p.shR = [1.1, 0.35, 0.05];
      p.elL = [0.9 + 0.1 * S(t * 17), 0, 0];
      p.elR = [0.9 + 0.1 * S(t * 19), 0, 0];
      cast.push(member('lyoha', 'lyoha', p, t));
      return { cast, vehicles: [] };
    }
    if (c === 'skuf') {
      const late = t - shot.start > 1.4;
      const p = sit(base(8, -2.05, 0), 0.5, false);
      p.spine = [late ? -0.25 : 0.05, 0, 0];
      p.shR = [late ? 1.5 : 0.4, 0.4, 0.2];
      p.elR = [late ? 2.0 : 1.0, 0, 0];
      cast.push(member('ozon', late ? 'skuf' : 'slim', p, t, { props: late ? [{ id: 'beer', part: 'foreR', at: [0, -0.3, 0.05] }] : [] }));
      return { cast, vehicles: [] };
    }
    if (c === 'oysters') {
      const p = sit(base(17.5, -1.95, 0), 0.5, false);
      const k = frac(b * 0.5);
      p.shR = [1.2 + 0.6 * S(PI * k), 0.45, 0.1];
      p.elR = [1.6 + 0.6 * S(PI * k), 0, 0];
      p.shL = [0.9, 0.3, 0.1];
      p.elL = [1.2, 0, 0];
      p.mouth = S(PI * k) > 0.6 ? 0.8 : 0.1;
      cast.push(member('jolly', 'jolly', p, t));
      return { cast, vehicles: [] };
    }
    return { cast, vehicles: [] };
  }

  function worldBath(t, b, shot) {
    const cast = [];
    const c = shot.cam;
    if (c === 'toiletSad' || c === 'doorSlam') {
      const p = headInHands(sit(base(0, -2.25, 0), 0.47, false));
      cast.push(member('vladik', 'vladik', p, t, { sings: true, props: [cloud()] }));
      return { cast, vehicles: [] };
    }
    const crew = ['vladik', ...FRIENDS];
    crew.forEach((id, i) => {
      const p = sit(base(8 + i * 1.4, -2.25, 0), 0.47, false);
      const laugh = 0.5 + 0.5 * S(2 * PI * (b + i * 0.3));
      p.spine = [0.1 - 0.15 * laugh, 0.1 * S(t * 3 + i), 0];
      p.neck = [-0.1 * laugh, 0, 0];
      p.shL = [1.0, 0.45, 0.1];
      p.elL = [0.9, 0, 0];
      p.shR = [1.0, 0.45, 0.1];
      p.elR = [0.9, 0, 0];
      p.mouth = id === 'vladik' ? 0 : 0.3 + 0.5 * laugh;
      const holdPaper = !(id === 'vladik' && c === 'smile');
      if (id === 'vladik' && c === 'smile') { p.shL = [0.3, 0, 0.3]; p.shR = [0.3, 0, 0.3]; p.elL = [0.6, 0, 0]; p.elR = [0.6, 0, 0]; p.neck = [-0.25, 0, 0]; }
      const props = holdPaper ? [{ id: 'newspaper', part: 'torso', at: [0, 0.25, 0.32] }] : [];
      if (id === 'vladik' && c === 'smile') props.push(cloud(1 - ease((t - shot.start) / 2)));
      cast.push(member(id, id, p, t, { sings: id === 'vladik', props }));
    });
    return { cast, vehicles: [] };
  }

  function worldPool(t, b, shot) {
    const cast = [];
    const y = shot.cam === 'surface' ? 3 + 1.8 * (t - shot.start) : 3.8 + 0.3 * S(t);
    const p = swim(base(0.4, -1 - 0.4 * (t - shot.start), PI), t, y, false);
    if (shot.cam === 'surface') p.rx = 0.4;
    cast.push(member('vladik', 'vladik', p, t, { sings: shot.cam !== 'peeSwim' }));
    return { cast, vehicles: [] };
  }

  function worldRing(t, b, shot) {
    const cast = [];
    const c = shot.cam;
    const Y = K.RING_Y;
    if (c === 'fartSix') {
      const blast = 24.3;
      const k = ease((t - shot.start) / 0.8);
      const v = bendOver(base(0, 1.2, 0), k);
      v.lift = Y;
      cast.push(member('vladik', 'vladik', v, t, { sings: true }));
      for (let i = 0; i < 6; i++) {
        let p = bounce(base(-2.2 + i * 0.88, -0.6 - (i % 2) * 0.5, 0), b + i * 0.2, 0.6);
        if (t > blast) p = flyAway(p, (t - blast) / 1.4, 1);
        p.lift = p.ground === false ? 0 : Y;
        if (p.ground === false) p.y += Y;
        cast.push(member('critter' + i, 'critter' + i, p, t));
      }
      return { cast, vehicles: [] };
    }
    let v;
    if (c === 'entrance') {
      v = base(0, 9.8 - 1.0 * (t - shot.start), PI);
      const s = S(PI * b * 2);
      v.hipL = [0.3 * s, 0, 0.05];
      v.hipR = [-0.3 * s, 0, 0.05];
      v.shL = [1.8, 0, 0.6];
      v.shR = [1.8, 0, 0.6];
      v.elL = [1.9, 0, 0];
      v.elR = [1.9, 0, 0];
      cast.push(member('vladik', 'vladikRobe', v, t, { sings: true }));
    } else {
      if (c === 'blast') v = bendOver(base(-1.1, 0, -PI / 2), ease((t - shot.start) / 0.7));
      else if (c === 'win' || c === 'robotFly') v = cheer(bounce(base(0, 0, 0), b), b);
      else v = fight(base(-1.1, 0, PI / 2), b);
      v.lift = Y;
      cast.push(member('vladik', 'vladikRobe', v, t, { sings: true }));
    }
    let robot = robotSwing(base(1.3, 0, -PI / 2), b * 0.5, 1);
    robot.lift = Y;
    if (c === 'blast' && t > shot.start + 1.4) {
      robot = flyAway(robot, (t - shot.start - 1.4) / 1.6, -1);
      robot.y += Y;
    }
    if (c === 'robotFly') {
      const f = (t - 137.2) / 1.5;
      robot = base(3 + 4 * f, 0, -PI / 2);
      robot.ground = false;
      robot.pivot = 1.4;
      robot.rx = -3 * f;
      robot.rz = 1.2 * f;
      robot.y = Y + 3 * S(PI * clamp(f, 0, 1)) - 2 * f * f;
      robot.shL = [2.5, 0, 1];
      robot.shR = [2.5, 0, 1];
    }
    cast.push(Object.assign({ id: 'robot', look: 'robot', pose: robot, hidden: c === 'entrance' || c === 'win' }));
    FRIENDS.forEach((id, i) => cast.push(member(id, id, cheer(sit(base(-2.4 + i * 1.2, 5.3, PI), 0.5, false), b + i * 0.25), t)));
    return { cast, vehicles: [] };
  }

  function worldVault(t, b, shot) {
    const cast = [];
    const c = shot.cam;
    if (c === 'doctors') {
      const d1 = base(-0.7, -11, 0);
      d1.shL = [0.9, 0.5, 0.1];
      d1.elL = [1.2, 0, 0];
      d1.neck = [0, 0.3 * S(t * 1.3), 0];
      const d2 = base(0.8, -11.4, -0.2);
      d2.shR = [1.5, 0.2, 0.3];
      d2.elR = [0.6, 0, 0];
      d2.mouth = 0.5 + 0.4 * S(t * 12);
      cast.push(member('doc1', 'doctor', d1, t, { sings: true }), member('doc2', 'doctor2', d2, t));
      return { cast, vehicles: [] };
    }
    const walkT = t - shot.start;
    const p = c === 'tiptoe' ? sneak(base(0, -6 - 1.1 * walkT, PI), b * 2) : bounce(base(0, -3 - 1.2 * walkT, PI), b * 2, 0.4);
    if (c === 'gasWalk') {
      const s = S(PI * b * 2);
      p.hipL = [0.35 * s, 0, 0.05];
      p.hipR = [-0.35 * s, 0, 0.05];
      p.shL = [1.7, 0.5, 0.3];
      p.shR = [1.7, 0.5, 0.3];
      p.elL = [2.0, 0, 0];
      p.elR = [2.0, 0, 0];
      p.spine = [0.2, 0, 0];
    }
    cast.push(member('vladik', 'vladik', p, t, { sings: true }));
    return { cast, vehicles: [] };
  }

  const STREET_SPEED = 20;

  function worldStreet(t, b, shot) {
    const c = shot.cam;
    const cast = [];
    if (c === 'gangsta' || c === 'gangsta2') {
      const hop = Math.max(0, S(2 * PI * b));
      const carM = M4.chain(M4.translate(-1.5, 0.35 * hop, 0), M4.rotY(PI / 2), M4.rotX(-0.12 * hop));
      const v = dance(base(1.6, 1.5, -0.3), b, false);
      v.shL = [1.3, 0.4, 0.4 + 0.3 * S(PI * b * 2)];
      v.elL = [0.9, 0, 0];
      v.shR = [1.5, 0.2, 0.3];
      v.elR = [0.4 + 0.5 * Math.max(0, S(2 * PI * b)), 0, 0];
      cast.push(member('vladik', 'vladikCool', v, t, { sings: true }));
      return { cast, vehicles: [{ kind: 'car', M: carM, spin: 0 }] };
    }
    if (c === 'bench') {
      const p = lie(base(-7.15, 0.55, 0), 0.6);
      p.rz = 0.1;
      p.hipL = [0.4, 0, 0.1];
      p.knL = [0.8, 0, 0];
      p.shL = [2.6, 0, 0.2];
      p.elL = [2.2, 0, 0];
      cast.push(member('vanomas', 'sleeper', p, t));
      return { cast, vehicles: [] };
    }
    const kartM = K.vehicleMatrix(1.8, 0, 0.3 * S(t * 1.1), 0.05 * S(t * 1.3));
    const vanM = K.vehicleMatrix(-1.6 + 0.9 * S(t * 0.8), 0, -10 + 2 * S(t * 0.5), c === 'vanChoke' ? 0.25 * S(t * 3) : 0.05 * S(t * 0.6));
    const s = K.carSeat(kartM, [0, 0.8, 0.02], 0);
    const v = cheer(sit(base(s.x, s.z, 0), s.y, false), b);
    cast.push(member('vladik', 'vladik', v, t, { sings: true }));
    return { cast, vehicles: [{ kind: 'kart', M: kartM, spin: t * 40 }, { kind: 'van', M: vanM, spin: t * 50 }] };
  }

  function worldStore(t, b, shot) {
    const cast = [];
    const c = shot.cam;
    if (c === 'candy') {
      const p = base(-4.8, -3, -PI / 2);
      const k = frac(b);
      p.shR = [1.4 + 0.3 * S(PI * k), 0, 0.2];
      p.elR = [0.3, 0, 0];
      p.shL = [1.0, 0.5, 0.1];
      p.elL = [1.4, 0, 0];
      cast.push(member('bald', 'bald', p, t, { props: [{ id: 'candyBox', part: 'foreL', at: [0, -0.3, 0.08] }] }));
      return { cast, vehicles: [] };
    }
    if (c === 'prices') {
      const p = base(0, -10.2, PI);
      p.spine = [-0.25, 0, 0];
      p.shL = [2.3, 0.6, 0.3];
      p.elL = [1.9, 0, 0];
      p.shR = [2.3, 0.6, 0.3];
      p.elR = [1.9, 0, 0];
      p.neck = [-0.3, 0, 0];
      cast.push(member('vladik', 'vladik', p, t, { sings: true }));
      return { cast, vehicles: [] };
    }
    const walk = c === 'trolley' ? t - shot.start : 0;
    const p = base(0, 2 - 1.2 * walk, PI);
    if (c === 'trolley') {
      const s = S(PI * b * 2);
      p.hipL = [0.3 * s, 0, 0.05];
      p.hipR = [-0.3 * s, 0, 0.05];
      p.shL = [1.1, 0.3, 0.1];
      p.shR = [1.1, 0.3, 0.1];
      p.elL = [0.5, 0, 0];
      p.elR = [0.5, 0, 0];
    } else if (c === 'thumbs') {
      thumbs(p, b);
      p.ry = 0;
    } else {
      bounce(p, b, 0.5);
      p.ry = 0;
      p.shL = [1.2, 0.4, 0.2];
      p.elL = [1.2, 0, 0];
      p.shR = [2.6, 0, 0.8];
      p.elR = [0.4, 0, 0];
      p.neck = [-0.35, 0, 0];
    }
    cast.push(member('vladik', 'vladik', p, t, { sings: true, props: c === 'euro' ? [{ id: 'wallet', part: 'foreL', at: [0, -0.3, 0.06] }] : [] }));
    const vehicles = c === 'trolley' ? [{ kind: 'trolley', M: K.vehicleMatrix(0, 0, 2 - 1.2 * walk - 0.9, PI), spin: walk * 8 }] : [];
    return { cast, vehicles };
  }

  function worldRoofs(t, b, shot) {
    const cast = [];
    if (shot.cam === 'vsj') {
      const p = base(3, 3, 0.6);
      p.lift = 10;
      p.shL = [0.6, 0, 1.4];
      p.shR = [0.6, 0, 1.4];
      p.elL = [0.2, 0, 0];
      p.elR = [0.2, 0, 0];
      p.spine = [-0.15, 0, 0];
      cast.push(member('vladik', 'vladikCool', p, t, { sings: true }));
      return { cast, vehicles: [] };
    }
    const f = t - shot.start;
    const thug = point(base(1.5, 0.5, PI / 2));
    thug.lift = 10;
    thug.mouth = 0.4 + 0.4 * S(t * 10);
    cast.push(member('thug', 'thug', thug, t));
    let v;
    if (f < 1.3) {
      v = run(base(3.5 + 2.3 * f, 0.5, PI / 2), b * 2);
      v.lift = 10;
    } else {
      const g = f - 1.3;
      v = jumpArc(base(6.5 + 2.2 * g, 0.5, PI / 2), clamp(g / 0.6, 0, 1), 1.2);
      v.y = 10 + (g < 0.6 ? 1.2 * S(PI * g / 0.6) : -4.9 * (g - 0.6) * (g - 0.6) * 3);
      v.mouth = 1;
    }
    cast.push(member('vladik', 'vladik', v, t, { sings: true }));
    return { cast, vehicles: [] };
  }

  function worldStage(t, b, shot) {
    const cast = [];
    const c = shot.cam;
    if (c === 'felix') {
      const p = holdFront(base(80, -1.3, 0));
      cast.push(member('felix', 'felix', p, t, { sings: true, props: [{ id: 'cat', part: 'torso', at: [0, 0.12, 0.3] }, { id: 'slateNotVlad', part: 'torso', at: [0, -0.18, 0.36] }] }));
      return { cast, vehicles: [] };
    }
    if (c === 'danceFriends' || c === 'danceAll' || c === 'danceAllWide') {
      const crew = c === 'danceFriends' ? FRIENDS : ['vladik', ...FRIENDS];
      crew.forEach((id, i) => cast.push(member(id, id === 'vladik' ? 'vladikCool' : id, dance(base(-40 - 3 + i * 1.2, -1 - (i % 2) * 1.1, 0), b * 2, i % 2 === 1), t, { sings: id === 'vladik' })));
      return { cast, vehicles: [] };
    }
    if (c === 'critters') {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * PI * 2 + t * 1.2;
        const p = dance(base(C(a) * 1.6, -5.5 + S(a) * 1.2, -a + PI / 2), b * 2 + i * 0.3, i % 2 === 0);
        cast.push(member('critter' + i, 'critter' + i, p, t, { sings: true }));
      }
      return { cast, vehicles: [] };
    }
    if (c === 'thinker' || c === 'thinkerDark' || c === 'mega') {
      const p = thinker(sit(base(0, -4.45, 0), 0.47, false));
      if (c === 'mega') cheer(p, b);
      cast.push(member('vladik', 'vladik', p, t, { sings: true, hidden: false }));
      return { cast, vehicles: [] };
    }
    if (c === 'girl' || c === 'beer') {
      cast.push(member('easy', 'easy', waveArm(base(0.7, -5, -0.2), b), t, { sings: c === 'girl' }));
      if (c === 'beer') {
        const v = base(-0.6, -5.1, 0.4);
        v.shR = [1.4, -0.4, 0.9];
        v.elR = [0.6, 0, 0];
        v.shL = [2.7, 0, 0.3];
        v.elL = [0.3, 0, 0];
        cast.push(member('vladik', 'vladik', v, t, { sings: true }));
      }
      return { cast, vehicles: [] };
    }
    if (c === 'flex') {
      cast.push(member('vladik', 'vladik', flex(base(0, -5, 0), b), t, { sings: true }));
      return { cast, vehicles: [] };
    }
    if (c === 'thumbsLine') {
      ['vladik', ...FRIENDS].forEach((id, i) => cast.push(member(id, id, thumbs(base(-3 + i * 1.2, -5.2 + (i % 2) * 0.3, 0), b + i * 0.15), t, { sings: id === 'vladik' })));
      return { cast, vehicles: [] };
    }
    return { cast, vehicles: [] };
  }

  function worldBridge(t, b, shot) {
    const cast = [];
    if (shot.cam === 'granny') {
      const p = base(1, -0.4, 0.5);
      p.shR = [1.5, 0.3, 0.2];
      p.elR = [1.5, 0, 0];
      p.shL = [0.8 + 0.5 * Math.max(0, S(2 * PI * b)), 0.2, 0.4];
      p.elL = [0.6, 0, 0];
      p.mouth = 0.3 + 0.6 * Math.abs(S(t * 9));
      cast.push(member('granny', 'granny', p, t, { props: [{ id: 'phone', part: 'foreR', at: [0, -0.3, 0.08] }] }));
    } else {
      cast.push(member('maks', 'maks', writhe(base(0, 0, PI / 2), t), t));
    }
    return { cast, vehicles: [] };
  }

  const DESERT_SPEED = 22;
  const desertSpeed = (shot) => (['relax', 'hunter'].includes(shot.cam) ? 0 : DESERT_SPEED);

  function worldDesert(t, b, shot) {
    const c = shot.cam;
    const cast = [];
    if (c === 'relax') {
      cast.push(member('kamya', 'kamya', phoneTalk(base(-1.3, 0.5, 0.3), b), t, { props: [{ id: 'headset', part: 'head', at: [0, 0, 0] }] }));
      const m = sit(base(1.2, 0.2, -0.3), 0.42, false);
      m.spine = [-0.7, 0, 0];
      m.hipL = [1.0, 0, 0.15];
      m.hipR = [1.0, 0, 0.15];
      m.knL = [0.5, 0, 0];
      m.knR = [0.5, 0, 0];
      poseCool(m);
      cast.push(member('maks', 'maks', m, t));
      return { cast, vehicles: [] };
    }
    if (c === 'hunter') {
      const p = sneak(base(-2 + 0.6 * (t - shot.start), 1.5, PI / 2), b);
      p.shL = [1.7, 0.6, 0.1];
      p.elL = [2.2, 0, 0];
      p.shR = [1.7, 0.6, 0.1];
      p.elR = [2.2, 0, 0];
      cast.push(member('hunter', 'hunter', p, t, { props: [{ id: 'binoculars', part: 'head', at: [0, -0.01, 0.15] }] }));
      for (let i = 0; i < 3; i++) {
        const q = bounce(base(4 + i * 0.7, -1.5 + i * 0.4, -PI / 2), b + i * 0.4, 0.6);
        q.neck = [0, 0.8 * S(t * 2 + i), 0];
        cast.push(member('critter' + i, 'critter' + i, q, t));
      }
      return { cast, vehicles: [] };
    }
    if (c === 'fartJet') {
      const p = fly(base(0, 0, 0), 3.2 + 0.3 * S(t * 2));
      cast.push(member('vladik', 'vladik', p, t, { sings: true }));
      return { cast, vehicles: [] };
    }
    const heading = 0.02 * S(t * 0.8);
    const jeepM = K.vehicleMatrix(0, 0, 0.3 * S(t * 0.7), heading, 0.015 * S(t * 3.1));
    const spin = (t * DESERT_SPEED) / 0.45;
    const seat = (id, local, drive) => {
      const s = K.carSeat(jeepM, local, heading);
      return member(id, id, sit(base(s.x, s.z, heading), s.y, drive), t);
    };
    cast.push(seat('kamya', [0.45, 0.78, 0.35], true), seat('maks', [-0.45, 0.78, 0.35], false), seat('lyoha', [-0.55, 0.82, -0.75], false), seat('felix', [0.55, 0.82, -0.75], false));
    cast[1].pose = cheer(cast[1].pose, b);
    const top = K.carSeat(jeepM, [0, 1.22, -1.35], heading);
    const v = cheer(sit(base(top.x, top.z, heading), top.y, false), b);
    cast.push(member('vladik', 'vladik', v, t, { sings: true }));
    const vehicles = [{ kind: 'jeep', M: jeepM, spin }];
    if (c === 'critterBikes' || c === 'gasTrail') {
      [[-3.2, -7, 0.7, 0], [3.4, -10, 0.6, 1], [0.2, -13, 0.8, 2]].forEach(([bx, bz, w, ph], i) => {
        const wob = c === 'gasTrail' ? 0.3 : 0.08;
        const bh = wob * S(t * w * 3 + ph);
        const M = K.vehicleMatrix(bx + 0.8 * S(t * w * 1.3 + ph), 0, bz + 1.5 * S(t * w + ph), bh, 0.1 * S(t * w + ph));
        vehicles.push({ kind: 'bike', M, spin: spin * 1.3 });
        const s = K.carSeat(M, [0, 0.62, -0.15], bh);
        const p = sit(base(s.x, s.z, s.ry), s.y, true);
        p.spine = [0.35, 0, 0];
        p.shL = [1.3, 0.2, 0.1];
        p.shR = [1.3, 0.2, 0.1];
        if (c === 'gasTrail') { p.shL = [1.6, 0.6, 0.05]; p.elL = [2.3, 0, 0]; p.mouth = 0.8; }
        cast.push(member('critter' + i, 'critter' + i, p, t));
      });
    }
    return { cast, vehicles };
  }

  const BURSTS = {
    puk1: { bg: [0.35, 0.75, 0.2], a: [0.85, 1, 0.3], b: [0.2, 0.5, 0.15], text: 'ПУК!', textColor: '#f4ff6a' },
    puk2: { bg: [0.95, 0.85, 0.2], a: [0.55, 0.9, 0.25], b: [1, 1, 0.6], text: 'ПУК!', textColor: '#7aff5a' },
    bzdyn: { bg: [1, 0.4, 0.65], a: [1, 0.92, 0.2], b: [0.45, 0.9, 0.3], text: 'БЗДЫНЬ!', textSize: 64, textColor: '#fff36a', lines: true },
    nani: { bg: [0.9, 0.95, 1], a: [0.2, 0.25, 0.4], b: [0.9, 0.95, 1], text: 'ナニ?!', textSize: 54, textColor: '#ff3a4a', lines: true },
    pukBig: { bg: [0.3, 0.8, 0.25], a: [1, 0.95, 0.3], b: [0.15, 0.45, 0.1], text: 'ПУК!!!', textColor: '#ffffff', lines: true },
    mega: { bg: [0.95, 0.3, 0.08], a: [1, 0.85, 0.2], b: [0.6, 0.95, 0.25], text: 'МЕГА!', textColor: '#ffffff' }
  };

  function worldBurst(t, b, shot) {
    let p = base(0, 0, 0);
    let id = 'vladik';
    if (shot.cam === 'puk1' || shot.cam === 'puk2' || shot.cam === 'pukBig') p = bendOver(p, 1);
    else if (shot.cam === 'bzdyn') p = cheer(bounce(p, b), b);
    else if (shot.cam === 'nani') { id = 'doc2'; p.shL = [2.2, 0.7, 0.3]; p.elL = [1.9, 0, 0]; p.shR = [2.2, 0.7, 0.3]; p.elR = [1.9, 0, 0]; p.mouth = 1; }
    else p = poseCool(p);
    if (p.spine && shot.cam.startsWith('puk')) p.ry = PI * 0.75;
    const look = id === 'doc2' ? 'doctor2' : 'vladik';
    return { cast: [member(id, look, p, t, { sings: id === 'vladik' && shot.cam === 'bzdyn' })], vehicles: [] };
  }

  const WORLDS = { ident: worldIdent, flat: worldFlat, bath: worldBath, deep: worldPool, ring: worldRing, vault: worldVault, street: worldStreet, store: worldStore, roofs: worldRoofs, stage: worldStage, dream: worldBridge, desert: worldDesert, burst: worldBurst };

  const CAMS = {
    ident: {
      logo: (t, u) => frame([0, 0, 4.2 - 0.8 * u], [0, 0, 0], 40, t, 0),
      endcard: (t, u) => frame([0, 0.4, 5 + u], [0, 0, 0], 42, t, 0)
    },
    flat: {
      bedNight: (t, u) => frame([0.2, 1.9, 1.2 - 0.3 * u], [-2.1, 0.7, -2], 50, t, 0.4),
      blanket: (t, u) => frame([-0.9, 1.3, -0.5], [-2.1, 0.75, -1.7], 50, t, 0.8),
      wake: (t, u, F) => frame([0.6, 1.3, -0.1], V3.add(F.vladik.head, [0, 0.1, 0]), 48, t),
      clap: (t, u, F) => frame([-0.85, 1.45, -0.5], V3.add(F.felix.hips, [-0.3, 0.4, 0]), 50, t, 0.5),
      sofa: (t, u, F) => frame([8.4, 1.3, 1.2 - 0.3 * u], V3.add(F.vladik.head, [0, 0.1, 0]), 48, t),
      fridge: (t, u, F) => frame([16.4, 1.6, -0.1], [14.9, 1.1, -2.2], 52, t),
      wcDoor: (t, u, F) => frame([16.4, 1.5, 0.6], [19.1, 1.3, -2.4], 54, t),
      faceSad: (t, u, F) => frame(V3.add(head(F, 'vladik', 0), [0.12, 0.05, 0.85]), V3.add(head(F, 'vladik', 0), [0, 0.18, 0]), 46, t),
      window: (t, u, F) => frame([2.2, 1.6, -0.1], [1.2, 1.6, -3], 48, t),
      stare: (t, u, F) => frame(V3.add(head(F, 'vladik', 0), [0, 0.02, 0.5 - 0.15 * u]), head(F, 'vladik', 0), 40, t, 0.2),
      runWc: (t, u, F) => frame([F.vladik.hips[0] - 2.4, 1.3, 1.2], [19.3, 1.1, -2.6], 58, t, 1.2),
      pc: (t, u, F) => frame([23.4, 1.5, 0.4], [25, 1.0, -2.2], 50, t),
      monitor: (t, u) => frame([25.05, 1.1, -1.6 - 0.2 * u], [25, 1.05, -2.6], 44, t, 0.3),
      gasCloud: (t, u) => frame([8.2, 1.6, 3.2 - 0.4 * u], [8, 1.1, -1], 56, t),
      skuf: (t, u, F) => frame([8.5, 1.3, 0.9], V3.add(F.ozon.hips, [0, 0.4, 0]), 48, t),
      oysters: (t, u, F) => frame([18.3, 1.4, -0.1], V3.add(F.jolly.head, [0, -0.25, 0]), 44, t),
      sunrise: (t, u, F) => frame([0.8, 1.4, 0.6], V3.add(F.vladik.head, [-0.3, 0, -0.5]), 52, t)
    },
    bath: {
      toiletSad: (t, u, F) => frame([0.3, 1.5, 0.6 - 0.2 * u], V3.add(F.vladik.head, [0, 0.1, 0]), 50, t),
      doorSlam: (t, u) => frame([0.2, 1.5, 3], [0, 1.2, 0], 50, t, 0.5),
      row: (t, u) => frame([11.5, 1.6, 3.2], [11.5, 0.9, -2.2], 62, t, 0.5),
      rowClose: (t, u, F) => { const x = 8 + 7 * u; return frame([x, 1.3, 0.2], [x, 1.1, -2.2], 50, t, 0.4); },
      smile: (t, u, F) => frame(V3.add(head(F, 'vladik', 0), [0.1, 0.1, 0.8]), V3.add(head(F, 'vladik', 0), [0, 0.2, 0]), 44, t)
    },
    deep: {
      peeSwim: (t, u, F) => frame(V3.add(F.vladik.head, [1.1, 0.4, -1]), head(F, 'vladik'), 50, t),
      swimHappy: (t, u, F) => frame(V3.add(F.vladik.hips, [3, 1.2, 1.5]), F.vladik.hips, 56, t),
      surface: (t, u, F) => frame(V3.add(F.vladik.hips, [1.2, -2.5, 1]), V3.add(F.vladik.hips, [0, 1, 0]), 60, t, 0.5)
    },
    ring: {
      fartSix: (t, u) => frame([4.8, 2.6, 4.8], [0, 1.6, 0], 50, t, t > 24.3 ? 2 : 0.6),
      entrance: (t, u, F) => frame([1.2, 1.6, F.vladik.hips[2] + 2.4], [0, 2.2, -4], 58, t),
      fightV: (t, u) => frame([5.5 - u, 3, 5], [0, 1.9, 0], 48, t),
      crowdV: (t, u) => frame([0.3, 1.6, 3.9], [0, 1.05, 5.4], 74, t),
      blast: (t, u) => frame([-4.5, 2.4, 3.2], [0.5, 2, 0], 50, t, t > 134.5 ? 2 : 0.6),
      robotFly: (t, u, F) => frame([2.4, 2.4, 5.2], V3.add(F.robot.hips, [0, 0.4, 0]), 58, t, 1.2),
      win: (t, u) => frame([0.4, 2.3, 3.3 - 0.4 * u], [0, 2.2, 0], 50, t)
    },
    vault: {
      gasWalk: (t, u, F) => frame([0.6, 1.4, F.vladik.hips[2] - 4.2], V3.add(F.vladik.hips, [0, 0.5, 0]), 52, t),
      doctors: (t, u) => frame([0.2, 1.6, -8.4 + 0.3 * u], [0, 1.5, -11.2], 50, t),
      tiptoe: (t, u, F) => frame([1.2, 0.8, F.vladik.hips[2] + 3], [0, 1.2, -38], 56, t)
    },
    street: {
      gangsta: (t, u) => frame([3.6, 0.7, 5.5], [0.5, 1.3, 0.8], 52, t),
      gangsta2: (t, u, F) => frame(V3.add(head(F, 'vladik', 0), [0.9, -0.3, 1.8]), V3.add(head(F, 'vladik', 0), [-0.6, -0.4, 0]), 50, t),
      bench: (t, u) => frame([-4.9, 1.4, 2.3], [-7.2, 0.7, 0.2], 54, t, 0.3),
      kart: (t, u, F) => frame(vpos(F, 0, [2.8, 1.5, -4]), vpos(F, 0, [0, 0.9, 0]), 54, t, 1.4),
      kartFront: (t, u, F) => frame(vpos(F, 0, [0.3, 1.4, 5.5]), vpos(F, 0, [0, 1, -3]), 56, t, 1.4),
      vanChoke: (t, u, F) => frame(vpos(F, 1, [3, 1.8, 7]), vpos(F, 1, [0, 1, 0]), 56, t, 1.6),
      kartSide: (t, u, F) => frame(vpos(F, 0, [3.4, 1, 0.5 - u]), vpos(F, 0, [0, 0.9, 0]), 50, t, 1.2)
    },
    store: {
      prices: (t, u) => frame([2.9, 1.7, -8.6], [0, 2.0, -11.0], 58, t),
      candy: (t, u, F) => frame([-3.3, 1.6, -0.6], V3.add(F.bald.hips, [0, 0.5, 0]), 52, t),
      trolley: (t, u, F) => frame([1.2, 1.5, F.vladik.hips[2] - 3.2], V3.add(F.vladik.hips, [0, 0.4, 0]), 52, t),
      thumbs: (t, u, F) => frame(V3.add(head(F, 'vladik', 0), [0.2, -0.1, 1.1]), V3.add(head(F, 'vladik', 0), [0, -0.25, 0]), 46, t),
      euro: (t, u, F) => frame([0.4, 1.4, 4.2], V3.add(F.vladik.hips, [0, 0.6, 0]), 52, t)
    },
    roofs: {
      vsj: (t, u) => { const a = 0.9 + 0.8 * u; return frame([3 + S(a) * 3.2, 11.7, 3 + C(a) * 3.2], [3, 11.3, 3], 54, t, 0.5); },
      yakuza: (t, u, F) => frame([F.vladik.hips[0] - 1.5, 11.6, 3.6], V3.add(F.vladik.hips, [0, 0.3, 0]), 58, t, 1)
    },
    stage: {
      felix: (t, u, F) => frame([80.2, 1.35, 2.2], V3.add(F.felix.hips, [0, 0.4, 0]), 42, t, 0.3),
      danceFriends: (t, u) => frame([-40 + 0.8 * S(u * 2), 1.5, 4.5 - u], [-40, 1.2, -1.6], 52, t),
      danceAll: (t, u) => frame([-40 + 0.8 * S(u * 2), 1.5, 4.5 - u], [-40, 1.2, -1.6], 52, t),
      danceAllWide: (t, u) => frame([-46 + 3 * u, 3.2, 6], [-40, 1.1, -1.6], 54, t, 0.6),
      mega: (t, u) => frame([0, 3.5, 12 - 2 * u], [0, 4.6, -9.5], 62, t, 1.4),
      thinker: (t, u, F) => frame([1.6, 1.4, -2.2], V3.add(F.vladik.hips, [0, 0.35, 0]), 48, t, 0.3),
      thinkerDark: (t, u, F) => frame([0.1, 1.5, -1.6 - 0.4 * u], V3.add(F.vladik.hips, [0, 0.4, 0]), 46, t, 0.2),
      critters: (t, u) => { const a = t * 0.4; return frame([S(a) * 4, 1.4, -5.5 + C(a) * 4], [0, 0.6, -5.5], 54, t); },
      girl: (t, u, F) => frame(V3.add(F.easy.head, [0.3, -0.1, 1.6]), head(F, 'easy', -0.2), 46, t),
      beer: (t, u) => frame([0.2, 1.7, -1.2], [0, 1.6, -5], 56, t),
      flex: (t, u, F) => frame([0.8 * S(u * 3), 1.1, -1.8 - 0.6 * u], [0, 1.5, -5], 52, t),
      thumbsLine: (t, u) => frame([0, 1.5, -0.6], [0, 1.3, -5.2], 60, t)
    },
    dream: {
      granny: (t, u, F) => frame([2.6, 1.35, 1.6], V3.add(F.granny.head, [0, -0.2, 0]), 46, t),
      writhe: (t, u, F) => frame([F.maks.hips[0] + 1.2, 2.2, 2], F.maks.hips, 52, t, 0.8)
    },
    desert: {
      relax: (t, u) => frame([0.2, 1.4, 4.2 - 0.4 * u], [0, 0.9, 0.3], 50, t, 0.4),
      hunter: (t, u, F) => frame([F.hunter.hips[0] - 1.5, 1.2, 4], [1.5, 0.8, 0], 54, t, 0.6),
      toiletJeep: (t, u, F) => frame(vpos(F, 0, [2.2, 2.6, -6]), vpos(F, 0, [0, 1.4, -1]), 54, t, 1.3),
      critterBikes: (t, u) => frame([-6, 0.9, -3], [0, 0.8, -9], 56, t, 1.4),
      gasTrail: (t, u, F) => frame(vpos(F, 0, [-3, 3, -9]), vpos(F, 0, [0, 0.8, -6]), 58, t, 1.4),
      fartJet: (t, u, F) => frame(V3.add(F.vladik.hips, [3.5, 0.6, 2.5]), F.vladik.hips, 56, t, 1.2),
      sunsetRide: (t, u, F) => frame(vpos(F, 0, [0.5, 1.6, -9]), vpos(F, 0, [0, 1.8, 6]), 52, t, 1)
    },
    burst: {
      puk1: (t, u) => frame([0, 1.2, 3.8 - 0.4 * u], [0, 1.1, 0], 50, t, 1.5),
      puk2: (t, u) => frame([0.3, 1.3, 3.6], [0, 1.1, 0], 50, t, 1.5),
      bzdyn: (t, u) => frame([0, 1.2, 3.8 - 0.4 * u], [0, 1.1, 0], 50, t, 1),
      nani: (t, u) => frame([0, 1.5, 2.6 - 0.8 * u], [0, 1.6, 0], 46, t, 0.5),
      pukBig: (t, u) => frame([0, 1.4, 4], [0, 1.1, 0], 54, t, 2),
      mega: (t, u) => frame([0.2, 1.3, 3.8], [0, 1.2, 0], 50, t, 1)
    }
  };

  function stage(t, shot) {
    const b = beatAt(t);
    const world = WORLDS[shot.scene](t, b, shot);
    const focus = { vehicles: world.vehicles };
    world.cast.forEach(a => { focus[a.id] = K.solveFocus(LOOKS[a.look], a.pose); });
    const u = clamp((t - shot.start) / Math.max(0.01, shot.end - shot.start), 0, 1);
    const camera = CAMS[shot.scene][shot.cam](t, u, focus);
    if (shot.grade) camera.grade = shot.grade;
    if (shot.alarm && frac(b) < 0.5) camera.grade = GRADES.alarm;
    return { cast: world.cast, vehicles: world.vehicles, focus, camera, beat: b, shot };
  }

  function toilet(b, x, y, z, ry) {
    const white = [0.95, 0.96, 0.98, 0.08];
    b.push(M4.translate(x, y, z), M4.rotY(ry || 0));
    b.prism(10, 0.13, 0.16, 0, 0.18, 0.22, 0.3, white, { capBottom: true });
    b.at(0, 0.3, 0.05, (c) => c.prism(12, 0.2, 0.26, 0, 0.21, 0.27, 0.13, white, { capTop: false }));
    b.at(0, 0.43, 0.05, (c) => c.prism(12, 0.21, 0.27, 0, 0.2, 0.26, 0.025, [0.2, 0.2, 0.22, 0.05], { capTop: false }));
    b.at(0, 0.44, 0.05, (c) => c.disc(0.16, 12, [0.15, 0.3, 0.45, 0.3], 0.001));
    b.push(M4.translate(0, 0.45, -0.2), M4.rotX(-1.35));
    b.box(0.42, 0.52, 0.03, white, { base: true });
    b.pop();
    b.at(0, 0.62, -0.3, (c) => c.box(0.44, 0.38, 0.17, white));
    b.at(0, 0.82, -0.3, (c) => c.box(0.46, 0.04, 0.19, white));
    b.at(0.12, 0.845, -0.3, (c) => c.box(0.06, 0.015, 0.06, [0.7, 0.72, 0.75, 0.1]));
    b.pop();
    return b;
  }

  function texRain(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1a2440');
    g.addColorStop(1, '#2a3a5a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = rand(71);
    ctx.strokeStyle = 'rgba(160,190,255,0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = r() * h, l = 6 + r() * 14;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + l);
      ctx.stroke();
    }
  }

  function texClock(ctx, w, h) {
    ctx.fillStyle = '#100808';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff3020';
    ctx.font = 'bold 40px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('07:00', w / 2, h / 2 + 2);
  }

  function texRpg(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#3a2a6a');
    g.addColorStop(1, '#d08040');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a1420';
    ctx.fillRect(40, 60, 70, 60);
    ctx.fillRect(50, 40, 16, 22);
    ctx.fillRect(84, 34, 16, 28);
    ctx.fillRect(0, 118, w, 10);
    ctx.fillStyle = '#f2f2f2';
    ctx.beginPath();
    ctx.moveTo(170, 50);
    ctx.lineTo(205, 72);
    ctx.lineTo(205, 108);
    ctx.lineTo(170, 128);
    ctx.lineTo(135, 108);
    ctx.lineTo(135, 72);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c01818';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1', 170, 90);
    ctx.fillStyle = '#101010';
    ctx.fillRect(10, 8, 110, 14);
    ctx.fillStyle = '#e03030';
    ctx.fillRect(12, 10, 4, 10);
  }

  function texTiles(ctx, w, h) {
    texGrid('#8aa8b8', '#e8f2f6', 32)(ctx, w, h);
  }

  function texShelfPacks(ctx, w, h) {
    const r = rand(14);
    const cols = ['#e83a3a', '#f2c21a', '#3a8ae8', '#4fc36a', '#ff8ac0', '#ffffff', '#8a5ad0', '#ff7a1a'];
    ctx.fillStyle = '#8a8a90';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      for (let x = 0; x < w; x += 10 + Math.floor(r() * 8)) {
        ctx.fillStyle = cols[Math.floor(r() * cols.length)];
        const hh = 14 + r() * 14;
        ctx.fillRect(x, y + 30 - hh, 9, hh);
      }
      ctx.fillStyle = '#5a5a60';
      ctx.fillRect(0, y + 29, w, 3);
    }
  }

  function buildFlat(r) {
    const room = new Builder();
    const wall = [0.42, 0.46, 0.58, 0];
    room.quad([-4, 0, -3], [28, 0, -3], [28, 3.2, -3], [-4, 3.2, -3], wall);
    room.quad([-4, 0, 6], [-4, 0, -3], [-4, 3.2, -3], [-4, 3.2, 6], shade(wall, 0.9));
    room.quad([28, 0, -3], [28, 0, 6], [28, 3.2, 6], [28, 3.2, -3], shade(wall, 0.9));
    [4.2, 12.2, 20.2].forEach(x => room.at(x, 1.6, -1.6, (w) => w.box(0.12, 3.2, 2.8, shade(wall, 0.85))));
    room.at(-2.2, 0, -1.9, (bd) => {
      bd.box(1.15, 0.36, 2.2, [0.35, 0.22, 0.14, 0], { base: true });
      bd.at(0, 0.36, 0, (m) => m.box(1.05, 0.18, 2.1, [0.9, 0.9, 0.92, 0], { base: true }));
      bd.at(0, 0.6, -0.85, (m) => m.box(0.7, 0.14, 0.35, [0.95, 0.95, 0.98, 0]));
      bd.at(0, 0.7, -1.1, (m) => m.box(1.15, 0.9, 0.08, [0.3, 0.2, 0.12, 0]));
    });
    room.at(-1.15, 0, -2.6, (n) => n.box(0.45, 0.5, 0.4, [0.35, 0.24, 0.16, 0], { base: true }));
    room.at(-1.15, 0.56, -2.6, (n) => n.box(0.28, 0.12, 0.12, [0.1, 0.1, 0.12, 0]));
    room.at(1.4, 1.65, -2.97, (w) => w.box(1.9, 1.5, 0.05, [0.85, 0.85, 0.88, 0]));
    room.at(1.4, 1.65, -2.9, (w) => { w.box(0.06, 1.4, 0.05, [0.85, 0.85, 0.88, 0]); w.box(1.8, 0.06, 0.05, [0.85, 0.85, 0.88, 0]); });
    room.at(8, 0, -2.2, (s) => {
      s.box(2.3, 0.45, 0.95, [0.45, 0.35, 0.55, 0], { base: true });
      s.at(0, 0.45, -0.38, (bk) => bk.box(2.3, 0.6, 0.25, [0.4, 0.3, 0.5, 0], { base: true }));
      [-1.1, 1.1].forEach(x => s.at(x, 0.45, 0, (a) => a.box(0.2, 0.3, 0.95, [0.4, 0.3, 0.5, 0], { base: true })));
    });
    room.at(8, 0, 1.7, (tv) => { tv.box(1.4, 0.55, 0.45, [0.2, 0.15, 0.12, 0], { base: true }); tv.at(0, 1.0, 0, (sc) => sc.box(1.35, 0.85, 0.1, [0.08, 0.08, 0.1, 0])); });
    room.at(8, 0, -0.9, (tb) => { tb.box(1.0, 0.4, 0.55, [0.5, 0.35, 0.2, 0], { base: true }); [-0.2, 0.1, 0.3].forEach(x => tb.at(x, 0.4, 0.05, (cn) => cn.prism(8, 0.035, 0.035, 0, 0.035, 0.035, 0.12, [0.7, 0.75, 0.8, 0.1]))); });
    room.at(14.8, 0, -2.6, (f) => { f.box(0.8, 1.9, 0.7, [0.92, 0.93, 0.95, 0], { base: true }); f.at(0, 0.95, 0.3, (l) => l.box(0.7, 1.7, 0.08, [1, 1, 0.92, 0.9])); });
    room.at(17.5, 0, -1.2, (tb) => {
      tb.at(0, 0.73, 0, (tp) => tp.box(1.3, 0.05, 0.85, [0.95, 0.95, 0.92, 0]));
      [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]].forEach(([x, z]) => tb.at(x, 0.36, z, (l) => l.box(0.06, 0.72, 0.06, [0.3, 0.2, 0.12, 0])));
      tb.at(0, 0.76, -0.2, (pl) => { pl.prism(12, 0.2, 0.2, 0, 0.2, 0.2, 0.015, [1, 1, 1, 0.05]); for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; pl.at(C(a) * 0.12, 0.02, S(a) * 0.12, (o) => o.ellipsoid(0.05, 0.015, 0.035, 6, 3, [0.6, 0.62, 0.6, 0])); } });
      [-0.45, 0.45].forEach(x => tb.at(x, 0.76, -0.3, (cd) => { cd.prism(6, 0.018, 0.018, 0, 0.018, 0.018, 0.2, [0.95, 0.92, 0.8, 0]); cd.at(0, 0.23, 0, (fl) => fl.box(0.02, 0.05, 0.02, [1, 0.8, 0.3, 1])); }));
    });
    room.at(19.3, 1.02, -2.94, (d) => d.box(0.95, 2.04, 0.06, [0.85, 0.82, 0.75, 0]));
    room.at(25, 0, -2.4, (dk) => {
      dk.at(0, 0.74, 0, (tp) => tp.box(1.5, 0.05, 0.75, [0.3, 0.3, 0.34, 0]));
      [[-0.7, -0.33], [0.7, -0.33], [-0.7, 0.33], [0.7, 0.33]].forEach(([x, z]) => dk.at(x, 0.37, z, (l) => l.box(0.05, 0.74, 0.05, [0.2, 0.2, 0.22, 0])));
      dk.at(0, 1.05, -0.2, (m) => m.box(0.75, 0.48, 0.05, [0.1, 0.1, 0.12, 0]));
      dk.at(0, 0.78, 0.15, (k) => k.box(0.5, 0.03, 0.16, [0.15, 0.15, 0.17, 0]));
    });
    const floor = new Builder();
    floor.quad([-4, 0, 6], [28, 0, 6], [28, 0, -3], [-4, 0, -3], [0.75, 0.55, 0.38, 0], [[0, 0], [12, 0], [12, 3.5], [0, 3.5]]);
    const win = new Builder();
    win.quad([0.5, 0.95, -2.93], [2.3, 0.95, -2.93], [2.3, 2.35, -2.93], [0.5, 2.35, -2.93], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const sunWin = new Builder();
    sunWin.quad([0.5, 0.95, -2.925], [2.3, 0.95, -2.925], [2.3, 2.35, -2.925], [0.5, 2.35, -2.925], [[1, 0.75, 0.4, 1], [1, 0.75, 0.4, 1], [1, 0.9, 0.7, 1], [1, 0.9, 0.7, 1]]);
    const clockFace = new Builder();
    clockFace.quad([-1.27, 0.51, -2.535], [-1.03, 0.51, -2.535], [-1.03, 0.61, -2.535], [-1.27, 0.61, -2.535], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const tvFace = new Builder();
    tvFace.quad([8.64, 0.62, 1.64], [7.36, 0.62, 1.64], [7.36, 1.38, 1.64], [8.64, 1.38, 1.64], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const monFace = new Builder();
    monFace.quad([24.66, 0.85, -2.57], [25.34, 0.85, -2.57], [25.34, 1.25, -2.57], [24.66, 1.25, -2.57], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const wcSign = new Builder();
    wcSign.quad([19.1, 1.5, -2.9], [19.5, 1.5, -2.9], [19.5, 1.8, -2.9], [19.1, 1.8, -2.9], [1, 1, 1, 0.6], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const fridgeDoor = new Builder();
    fridgeDoor.at(0.4, 0.95, 0, (d) => d.box(0.8, 1.88, 0.06, [0.9, 0.91, 0.94, 0]));
    const meshes = { win: r.mesh(win), sunWin: r.mesh(sunWin), clock: r.mesh(clockFace), tv: r.mesh(tvFace), mon: r.mesh(monFace), wc: r.mesh(wcSign), door: r.mesh(fridgeDoor) };
    const tex = {
      wood: r.texture(128, texNoise('#b08058', 5, 0.2)),
      rain: r.texture(128, texRain),
      clock: r.texture(128, texClock, { clamp: true, height: 64 }),
      tv: r.texture(64, texNoise('#8a8a8a', 99, 0.9)),
      rpg: r.texture(256, texRpg, { clamp: true, height: 128 }),
      wc: r.texture(64, texText([{ text: 'WC', font: 'bold 34px Arial' }], '#2a5ad0', '#ffffff', 'bold 30px Arial'), { clamp: true })
    };
    const night = {
      sunDir: V3.norm([0.3, -0.5, -0.8]),
      sunColor: [0.34, 0.37, 0.5],
      ambTop: [0.3, 0.33, 0.46],
      ambBottom: [0.12, 0.12, 0.18],
      fogColor: [0.1, 0.11, 0.16],
      fogNear: 14,
      fogFar: 42,
      points: [{ pos: [8, 1.1, 1.2], color: [0.5, 0.7, 1.2] }, { pos: [-1.1, 1.0, -2.3], color: [0.8, 0.55, 0.35] }]
    };
    const morning = Object.assign({}, night, { sunDir: V3.norm([-0.3, -0.4, 0.86]), sunColor: [1.0, 0.75, 0.5], ambTop: [0.55, 0.5, 0.52], ambBottom: [0.3, 0.25, 0.22], fogColor: [0.4, 0.32, 0.28], points: [{ pos: [1.4, 1.6, -2.4], color: [1.4, 1.0, 0.6] }] });
    const byCam = {
      fridge: Object.assign({}, night, { points: [{ pos: [14.9, 1.2, -1.9], color: [1.4, 1.4, 1.3] }] }),
      pc: Object.assign({}, night, { points: [{ pos: [25, 1.1, -2.1], color: [0.6, 1.0, 1.4] }] }),
      monitor: Object.assign({}, night, { points: [{ pos: [25, 1.1, -2.1], color: [0.6, 1.0, 1.4] }] }),
      oysters: Object.assign({}, night, { points: [{ pos: [17.5, 1.2, -1.4], color: [1.3, 0.9, 0.5] }] })
    };
    return {
      envAt: (t, st) => (st.shot.cam === 'sunrise' ? morning : byCam[st.shot.cam] || night),
      layers: [{ mesh: r.mesh(room) }, { mesh: r.mesh(floor), texture: tex.wood }],
      draw(rr, t, shot) {
        if (shot.cam === 'sunrise') rr.draw(meshes.sunWin, null, { noFog: true });
        else rr.draw(meshes.win, null, { texture: tex.rain, uvScroll: [0, -t * 0.8], noFog: true });
        rr.draw(meshes.clock, null, { texture: tex.clock });
        rr.draw(meshes.tv, null, { texture: tex.tv, uvScroll: [Math.floor(t * 20) * 0.37, Math.floor(t * 20) * 0.53] });
        rr.draw(meshes.mon, null, { texture: tex.rpg });
        rr.draw(meshes.wc, null, { texture: tex.wc });
        const open = shot.cam === 'fridge' ? -1.6 * ease((t - shot.start) / 0.6) : 0;
        rr.draw(meshes.door, M4.chain(M4.translate(14.4, 0, -2.22), M4.rotY(open)));
      },
      shadows: 'blob'
    };
  }

  function buildBath(r) {
    const room = new Builder();
    room.quad([-3, 0, -3], [24, 0, -3], [24, 3, -3], [-3, 3, -3], [1, 1, 1, 0], [[0, 0], [27, 0], [27, 3], [0, 3]]);
    room.quad([-3, 0, 5], [-3, 0, -3], [-3, 3, -3], [-3, 3, 5], [1, 1, 1, 0], [[0, 0], [8, 0], [8, 3], [0, 3]]);
    room.quad([-3, 0, 5], [24, 0, 5], [24, 0, -3], [-3, 0, -3], [0.85, 0.9, 0.95, 0], [[0, 0], [27, 0], [27, 8], [0, 8]]);
    const fixtures = new Builder();
    toilet(fixtures, 0, 0, -2.5, 0);
    [-0.95, 0.95].forEach(x => fixtures.at(x, 1.05, -1.4, (w) => w.box(0.05, 2.1, 3.2, [0.55, 0.7, 0.85, 0])));
    for (let i = 0; i < 6; i++) toilet(fixtures, 8 + i * 1.4, 0, -2.5, 0);
    for (let i = 0; i <= 6; i++) fixtures.at(7.3 + i * 1.4, 0.75, -2.35, (w) => w.box(0.04, 1.3, 1.2, [0.55, 0.7, 0.85, 0]));
    for (let x = -2; x < 23; x += 3) fixtures.at(x, 2.95, 0, (l) => l.box(1.8, 0.06, 0.2, [1, 1, 1, 1]));
    fixtures.at(-2.9, 1.6, 1.5, (m) => m.box(0.04, 0.9, 1.2, [0.7, 0.85, 0.95, 0.5]));
    const door = new Builder();
    door.at(0.45, 1.0, 0, (d) => d.box(0.9, 2.0, 0.05, [0.35, 0.55, 0.8, 0]));
    const doorMesh = r.mesh(door);
    const tiles = r.texture(128, texTiles);
    return {
      env: {
        sunDir: V3.norm([0.2, -0.9, -0.3]),
        sunColor: [0.6, 0.62, 0.62],
        ambTop: [0.6, 0.66, 0.72],
        ambBottom: [0.3, 0.33, 0.36],
        fogColor: [0.75, 0.82, 0.86],
        fogNear: 16,
        fogFar: 42,
        points: [{ pos: [0, 2.6, 0], color: [0.6, 0.6, 0.6] }]
      },
      layers: [{ mesh: r.mesh(room), texture: tiles }, { mesh: r.mesh(fixtures) }],
      draw(rr, t, shot) {
        const close = shot.cam === 'doorSlam' ? -1.5 * (1 - ease((t - shot.start - 0.3) / 0.25)) : -1.5;
        if (shot.cam === 'doorSlam' || shot.cam === 'toiletSad') rr.draw(doorMesh, M4.chain(M4.translate(-0.45, 0, 0.2), M4.rotY(close)));
      },
      shadows: 'blob'
    };
  }

  function buildStore(r) {
    const room = new Builder();
    room.quad([-10, 0, 8], [10, 0, 8], [10, 0, -12], [-10, 0, -12], [0.82, 0.83, 0.82, 0], [[0, 0], [10, 0], [10, 10], [0, 10]]);
    room.quad([-10, 0, -12], [10, 0, -12], [10, 4, -12], [-10, 4, -12], [0.9, 0.92, 0.88, 0]);
    room.quad([-10, 0, 8], [-10, 0, -12], [-10, 4, -12], [-10, 4, 8], [0.88, 0.9, 0.86, 0]);
    room.quad([10, 0, -12], [10, 0, 8], [10, 4, 8], [10, 4, -12], [0.88, 0.9, 0.86, 0]);
    for (let x = -8; x <= 8; x += 4) for (let z = -8; z <= 6; z += 4.5) room.at(x, 3.9, z, (l) => l.box(0.3, 0.06, 3, [1, 1, 1, 1]));
    const shelves = new Builder();
    [-6, -2, 2, 6].forEach(x => {
      shelves.at(x, 0, -3, (s) => {
        s.box(1.2, 2.1, 9, [0.6, 0.6, 0.64, 0], { base: true, uvScale: 0.5, faces: { top: [0.5, 0.5, 0.54, 0] } });
      });
    });
    shelves.at(0, 0, -11.5, (b) => {
      b.box(4, 1.0, 0.8, [0.55, 0.38, 0.22, 0], { base: true });
      for (let i = 0; i < 7; i++) b.at(-1.5 + i * 0.5, 1.08, 0, (l) => l.ellipsoid(0.2, 0.1, 0.13, 7, 4, [0.78, 0.52, 0.25, 0]));
    });
    shelves.at(6, 0, 5.5, (c) => { c.box(2.4, 0.95, 0.9, [0.3, 0.35, 0.5, 0], { base: true }); c.at(0.6, 1.1, 0, (reg) => reg.box(0.4, 0.3, 0.35, [0.2, 0.2, 0.22, 0])); });
    const signs = new Builder();
    signs.quad([-1.3, 2.2, -11.9], [1.3, 2.2, -11.9], [1.3, 3.4, -11.9], [-1.3, 3.4, -11.9], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const brand = new Builder();
    brand.quad([-4, 3.45, -11.95], [4, 3.45, -11.95], [4, 3.95, -11.95], [-4, 3.95, -11.95], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const coin = new Builder();
    coin.push(M4.rotX(PI / 2));
    coin.prism(10, 0.08, 0.08, -0.01, 0.08, 0.08, 0.01, [1, 0.82, 0.25, 0.35], { capBottom: true });
    coin.pop();
    const bill = new Builder();
    bill.box(0.3, 0.005, 0.15, [0.5, 0.8, 0.55, 0.3]);
    const packs = r.texture(128, texShelfPacks);
    const priceTex = r.texture(256, texText([{ text: 'ХЛЕБ', font: 'bold 44px Arial' }, { text: '999 €', font: 'bold 70px Arial' }], '#ffe23a', '#c01818', 'bold 40px Arial'), { clamp: true });
    const brandTex = r.texture(256, texText([{ text: 'СУПЕРМАРКЕТ', font: 'bold 34px Arial' }], '#2fa04a', '#ffffff', 'bold 30px Arial'), { clamp: true, height: 32 });
    const meshes = { signs: r.mesh(signs), brand: r.mesh(brand), coin: r.mesh(coin), bill: r.mesh(bill) };
    return {
      env: {
        sunDir: V3.norm([0.1, -1, 0.15]),
        sunColor: [0.68, 0.7, 0.68],
        ambTop: [0.6, 0.62, 0.6],
        ambBottom: [0.35, 0.35, 0.35],
        fogColor: [0.85, 0.87, 0.85],
        fogNear: 16,
        fogFar: 45
      },
      layers: [{ mesh: r.mesh(room) }, { mesh: r.mesh(shelves), texture: packs }],
      draw(rr, t, shot) {
        rr.draw(meshes.signs, null, { texture: priceTex });
        rr.draw(meshes.brand, null, { texture: brandTex });
        if (shot.cam === 'euro') {
          for (let i = 0; i < 26; i++) {
            const f = frac(t * 0.7 + i * 0.137);
            const x = -1.6 + (i % 7) * 0.5, z = 1.3 + Math.floor(i / 7) * 0.45;
            const m = M4.chain(M4.translate(x, 3.4 - f * 3.4, z), M4.rotY(t * 3 + i), M4.rotX(t * 4 + i));
            rr.draw(i % 3 ? meshes.coin : meshes.bill, m);
          }
        }
      },
      shadows: 'blob'
    };
  }

  const PROP_MAKERS = {
    clapper: (r) => K.PROPS.clapper(r, { lines: [{ text: 'ВЛАДИК В', font: 'bold 20px Arial' }, { text: 'ДЕПРЕССИИ', font: 'bold 20px Arial' }, { text: 'ДУБЛЬ 1', font: 'bold 13px Arial' }], snapAt: bar(4) - 0.05 }),
    rainCloud(r) {
      const b = new Builder();
      [[0, 0, 0, 0.22], [0.18, -0.02, 0.04, 0.17], [-0.19, -0.01, -0.03, 0.18], [0.06, 0.08, -0.06, 0.16], [-0.06, -0.04, 0.12, 0.14]].forEach(([x, y, z, rad]) => b.at(x, y, z, (c) => c.ellipsoid(rad, rad * 0.75, rad, 7, 4, [0.38, 0.4, 0.46, 0.15])));
      const drop = new Builder();
      drop.box(0.012, 0.09, 0.012, [0.55, 0.7, 1, 0.8]);
      const dropMesh = r.mesh(drop);
      return {
        mesh: r.mesh(b),
        extra: (t) => {
          const out = [];
          for (let i = 0; i < 8; i++) {
            const f = frac(t * 1.8 + i * 0.137);
            out.push({ mesh: dropMesh, M: M4.translate(-0.24 + (i % 4) * 0.16, -0.12 - f * 0.9, -0.08 + Math.floor(i / 4) * 0.16) });
          }
          return out;
        }
      };
    },
    cat(r) {
      const b = new Builder();
      const fur = [0.92, 0.55, 0.2, 0];
      b.ellipsoid(0.16, 0.09, 0.09, 8, 4, fur);
      b.at(0.17, 0.06, 0.02, (h) => {
        h.ellipsoid(0.075, 0.07, 0.07, 7, 4, fur);
        [-1, 1].forEach(s => h.at(0.0, 0.07, s * 0.04, (e) => e.prism(3, 0.025, 0.02, 0, 0.004, 0.004, 0.05, fur)));
        [-1, 1].forEach(s => h.at(0.06, 0.015, s * 0.028, (e) => e.box(0.012, 0.018, 0.018, [0.2, 0.6, 0.2, 0.3])));
      });
      b.push(M4.translate(-0.15, 0.04, 0), M4.rotZ(0.9));
      b.prism(5, 0.02, 0.02, 0, 0.015, 0.015, 0.2, fur);
      b.pop();
      return { mesh: r.mesh(b) };
    },
    slateNotVlad(r) {
      const b = new Builder();
      b.box(0.46, 0.3, 0.02, [0.08, 0.08, 0.1, 0]);
      const face = new Builder();
      face.quad([-0.21, -0.13, 0.012], [0.21, -0.13, 0.012], [0.21, 0.13, 0.012], [-0.21, 0.13, 0.012], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      const tex = r.texture(128, texText([{ text: 'НЕ ВЛАД', font: 'bold 26px Arial' }, { text: 'ФЕЛИКС', font: 'bold 14px Arial' }], '#14141a', '#ff5a5a', 'bold 20px Arial'), { clamp: true });
      return { mesh: r.mesh(b), face: r.mesh(face), tex };
    },
    phone(r) {
      const b = new Builder();
      b.box(0.08, 0.15, 0.015, [0.1, 0.1, 0.12, 0]);
      const face = new Builder();
      face.quad([-0.035, -0.065, 0.009], [0.035, -0.065, 0.009], [0.035, 0.065, 0.009], [-0.035, 0.065, 0.009], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      const tex = r.texture(64, texText([{ text: 'ШОК!', font: 'bold 18px Arial' }], '#e8201a', '#ffff40', 'bold 18px Arial'), { clamp: true });
      return { mesh: r.mesh(b), face: r.mesh(face), tex };
    },
    headset(r) {
      const b = new Builder();
      const col = [0.12, 0.12, 0.14, 0];
      for (let i = 0; i <= 8; i++) {
        const a = PI * (i / 8);
        b.at(C(a) * 0.115, 0.03 + S(a) * 0.12, 0, (c) => c.box(0.03, 0.03, 0.03, col));
      }
      [-1, 1].forEach(s => b.at(s * 0.115, 0, 0, (c) => c.box(0.03, 0.07, 0.06, col)));
      b.push(M4.translate(-0.11, -0.03, 0.03), M4.rotY(-1.0));
      b.box(0.01, 0.01, 0.12, col, { base: false });
      b.pop();
      b.at(-0.06, -0.06, 0.08, (m) => m.box(0.025, 0.025, 0.025, [0.9, 0.2, 0.2, 0.5]));
      return { mesh: r.mesh(b) };
    },
    newspaper(r) {
      const b = new Builder();
      b.box(0.5, 0.36, 0.01, [0.9, 0.9, 0.86, 0.05]);
      const face = new Builder();
      face.quad([-0.24, -0.17, 0.006], [0.24, -0.17, 0.006], [0.24, 0.17, 0.006], [-0.24, 0.17, 0.006], [1, 1, 1, 0.2], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      const tex = r.texture(128, (ctx, w, h) => {
        ctx.fillStyle = '#eeeae0';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#222';
        ctx.font = 'bold 18px Times New Roman';
        ctx.textAlign = 'center';
        ctx.fillText('ГАЗЕТА', w / 2, 22);
        ctx.fillRect(8, 30, w - 16, 3);
        for (let y = 40; y < h - 8; y += 7) {
          ctx.fillRect(8, y, 52, 3);
          ctx.fillRect(68, y, 52, 3);
        }
      }, { clamp: true });
      return { mesh: r.mesh(b), face: r.mesh(face), tex };
    },
    beer(r) {
      const b = new Builder();
      b.prism(8, 0.035, 0.035, -0.1, 0.035, 0.035, 0.08, [0.45, 0.25, 0.08, 0.15], { capBottom: true });
      b.at(0, 0.08, 0, (n) => n.prism(8, 0.035, 0.035, 0, 0.014, 0.014, 0.08, [0.45, 0.25, 0.08, 0.15]));
      return { mesh: r.mesh(b) };
    },
    binoculars(r) {
      const b = new Builder();
      [-1, 1].forEach(s => b.at(s * 0.035, 0, 0, (c) => c.push(M4.rotX(PI / 2)).prism(8, 0.025, 0.025, -0.05, 0.03, 0.03, 0.06, [0.12, 0.14, 0.12, 0], { capBottom: true }).pop()));
      return { mesh: r.mesh(b) };
    },
    candyBox(r) {
      const b = new Builder();
      b.box(0.22, 0.14, 0.08, [1, 0.35, 0.65, 0.2]);
      b.at(0, 0, 0.041, (s) => s.box(0.12, 0.05, 0.002, [1, 0.9, 0.2, 0.4]));
      return { mesh: r.mesh(b) };
    },
    wallet(r) {
      const b = new Builder();
      b.box(0.16, 0.1, 0.03, [0.35, 0.2, 0.1, 0]);
      b.at(0, 0.02, 0.016, (s) => s.box(0.1, 0.01, 0.002, [0.1, 0.05, 0.02, 0]));
      return { mesh: r.mesh(b) };
    }
  };

  const EXTRA_VEHICLES = {
    kart(r) {
      const b = new Builder();
      b.at(0, 0.2, 0, (c) => c.box(1.2, 0.14, 2.0, [0.2, 0.2, 0.24, 0], { base: true }));
      b.at(0, 0.35, 1.05, (c) => c.box(1.3, 0.12, 0.12, [0.9, 0.2, 0.2, 0]));
      toilet(b, 0, 0.34, -0.05, 0);
      b.push(M4.translate(0.35, 0.45, -1.05), M4.rotX(PI / 2 + 0.3));
      b.prism(8, 0.07, 0.07, 0, 0.09, 0.09, 0.35, [0.7, 0.7, 0.74, 0.1]);
      b.pop();
      b.at(0, 0.62, 0.75, (c) => c.box(0.6, 0.05, 0.05, [0.2, 0.2, 0.22, 0]));
      b.at(0, 0.45, 0.72, (c) => c.box(0.05, 0.35, 0.05, [0.2, 0.2, 0.22, 0]));
      const w = new Builder();
      w.push(M4.rotZ(PI / 2));
      w.prism(12, 0.25, 0.25, -0.1, 0.25, 0.25, 0.1, [0.08, 0.08, 0.09, 0], { capBottom: true });
      w.pop();
      return { body: r.mesh(b), glow: null, wheel: r.mesh(w), wheels: [[0.62, 0.25, 0.75], [-0.62, 0.25, 0.75], [0.62, 0.25, -0.75], [-0.62, 0.25, -0.75]] };
    },
    trolley(r) {
      const b = new Builder();
      const wire = [0.75, 0.76, 0.8, 0.05];
      b.at(0, 0.8, 0, (c) => c.box(0.6, 0.02, 0.95, wire));
      [[-0.3, 0], [0.3, 0]].forEach(([x]) => b.at(x, 1.05, 0, (c) => c.box(0.02, 0.5, 0.95, wire)));
      [[0, 0.475], [0, -0.475]].forEach(([, z]) => b.at(0, 1.05, z, (c) => c.box(0.6, 0.5, 0.02, wire)));
      for (let y = 0.9; y < 1.3; y += 0.12) b.at(0, y, 0, (c) => { c.box(0.62, 0.012, 0.012, wire); });
      b.at(0, 1.35, -0.55, (c) => c.box(0.6, 0.04, 0.04, [0.9, 0.2, 0.2, 0]));
      [[-0.3, -0.5], [0.3, -0.5]].forEach(([x, z]) => b.at(x, 1.1, z, (c) => c.box(0.02, 0.5, 0.02, wire)));
      [[-0.25, 0.4], [0.25, 0.4], [-0.25, -0.4], [0.25, -0.4]].forEach(([x, z]) => b.at(x, 0.45, z, (c) => c.box(0.02, 0.7, 0.02, wire)));
      const rr = rand(3);
      for (let i = 0; i < 9; i++) b.at(-0.18 + (i % 3) * 0.18, 0.95 + Math.floor(i / 3) * 0.12, -0.25 + rr() * 0.5, (c) => c.box(0.16, 0.1, 0.2, [[1, 0.8, 0.2, 0.2], [0.3, 0.6, 1, 0.2], [1, 0.4, 0.6, 0.2]][i % 3]));
      const w = new Builder();
      w.push(M4.rotZ(PI / 2));
      w.prism(8, 0.06, 0.06, -0.02, 0.06, 0.06, 0.02, [0.15, 0.15, 0.17, 0], { capBottom: true });
      w.pop();
      return { body: r.mesh(b), glow: null, wheel: r.mesh(w), wheels: [[0.25, 0.06, 0.4], [-0.25, 0.06, 0.4], [0.25, 0.06, -0.4], [-0.25, 0.06, -0.4]] };
    }
  };

  function makeProp(id, r) {
    return PROP_MAKERS[id](r);
  }

  function overlay(r) {
    const puff = new Builder();
    puff.ellipsoid(0.5, 0.42, 0.5, 8, 5, [0.5, 0.9, 0.25, 0]);
    const puffMesh = r.mesh(puff);
    const blanket = new Builder();
    blanket.at(0, 0, 0, (b) => b.box(1.12, 0.22, 1.5, [0.35, 0.45, 0.75, 0], { base: true }));
    const blanketMesh = r.mesh(blanket);
    const tb = new Builder();
    toilet(tb, 0, 0, 0, 0);
    const toiletMesh = r.mesh(tb);
    const bench = new Builder();
    bench.at(0, 0.45, 0, (b) => b.box(0.6, 0.06, 2.0, [0.45, 0.3, 0.18, 0]));
    bench.at(-0.28, 0.75, 0, (b) => b.box(0.06, 0.45, 2.0, [0.45, 0.3, 0.18, 0]));
    [[-0.9], [0.9]].forEach(([z]) => bench.at(0, 0.22, z, (b) => b.box(0.5, 0.45, 0.06, [0.15, 0.15, 0.17, 0])));
    const benchMesh = r.mesh(bench);
    const lounge = new Builder();
    lounge.push(M4.translate(1.2, 0.3, 0.2), M4.rotY(-0.3));
    lounge.at(0, 0, 0.3, (b) => b.box(0.6, 0.05, 1.0, [0.2, 0.55, 0.85, 0]));
    lounge.push(M4.translate(0, 0.05, -0.2), M4.rotX(-0.9));
    lounge.box(0.6, 0.05, 0.8, [0.2, 0.55, 0.85, 0], { base: true });
    lounge.pop();
    [[-0.28, 0.7], [0.28, 0.7], [-0.28, -0.2], [0.28, -0.2]].forEach(([x, z]) => lounge.at(x, -0.15, z, (b) => b.box(0.03, 0.3, 0.03, [0.8, 0.8, 0.82, 0])));
    lounge.pop();
    const loungeMesh = r.mesh(lounge);
    const crate = new Builder();
    crate.box(0.6, 0.3, 0.4, [0.8, 0.6, 0.2, 0]);
    for (let i = 0; i < 6; i++) crate.at(-0.2 + (i % 3) * 0.2, 0.2, -0.08 + Math.floor(i / 3) * 0.16, (c) => { c.prism(8, 0.04, 0.04, 0, 0.04, 0.04, 0.2, [0.4, 0.25, 0.08, 0.2]); c.at(0, 0.2, 0, (n) => n.prism(8, 0.04, 0.04, 0, 0.015, 0.015, 0.08, [0.4, 0.25, 0.08, 0.2])); });
    const crateMesh = r.mesh(crate);
    const spot = new Builder();
    spot.push(M4.translate(0, 7, 0), M4.rotX(PI));
    spot.prism(12, 0.3, 0.3, 0, 1.6, 1.6, 7, [1, 0.95, 0.85, 1], { topColor: [0.05, 0.05, 0.05, 1], capTop: false, flat: true });
    spot.pop();
    const spotMesh = r.mesh(spot);
    const wcSign = new Builder();
    wcSign.quad([-0.5, 3.0, -38.9], [0.5, 3.0, -38.9], [0.5, 3.5, -38.9], [-0.5, 3.5, -38.9], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const wcSignMesh = r.mesh(wcSign);
    const wcTex = r.texture(64, texText([{ text: 'WC', font: 'bold 34px Arial' }], '#2a5ad0', '#ffffff', 'bold 30px Arial'), { clamp: true });
    const rays = new Builder();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * PI * 2;
      rays.tri([0, 0, 0], [C(a) * 2.2, S(a) * 2.2, 0], [C(a + 0.2) * 2.2, S(a + 0.2) * 2.2, 0], [[1, 0.95, 0.6, 1], [0, 0, 0, 1], [0, 0, 0, 1]]);
    }
    const raysMesh = r.mesh(rays);
    const glowTex = r.texture(64, texGlow, { clamp: true });
    const gas = (rr, origin, dir, t, n, spread, rate, alpha) => {
      for (let i = 0; i < n; i++) {
        const f = frac(t * rate + i / n);
        const p = V3.add(origin, V3.mul(dir, f));
        const s = 0.35 + f * spread;
        rr.draw(puffMesh, M4.chain(M4.translate(p[0] + 0.3 * S(i * 3.1 + t), p[1] + 0.2 * S(i * 1.7), p[2] + 0.3 * C(i * 2.3)), M4.scale(s)), { flat: [0.55, 0.9, 0.25, alpha * (1 - f)], blend: true });
      }
    };
    return {
      opaque(rr, t, shot, st) {
        const c = shot.cam;
        if (shot.scene === 'flat' && (c === 'bedNight' || c === 'blanket')) rr.draw(blanketMesh, M4.translate(-2.2, 0.55, -1.55));
        if (shot.scene === 'stage' && ['thinker', 'thinkerDark', 'mega'].includes(c)) rr.draw(toiletMesh, M4.translate(0, 0, -4.2));
        if (shot.scene === 'street' && c === 'bench') rr.draw(benchMesh, M4.translate(-7.2, 0.16, 0.3));
        if (shot.scene === 'desert' && c === 'relax') rr.draw(loungeMesh, null);
        if (shot.scene === 'desert' && st.vehicles[0] && st.vehicles[0].kind === 'jeep') rr.draw(toiletMesh, M4.mul(st.vehicles[0].M, M4.translate(0, 0.75, -1.25)));
        if (shot.scene === 'stage' && c === 'beer') rr.draw(crateMesh, M4.translate(0, 4 - 3.4 * ease((t - shot.start) / 1.6) + 0.15, -4.3));
        if (shot.scene === 'vault') rr.draw(wcSignMesh, null, { texture: wcTex });
      },
      blend(rr, t, shot, st) {
        const c = shot.cam;
        const F = st.focus;
        if (c === 'blanket') gas(rr, [-2.2, 0.8, -1.2], [0.8, 1.2, 1.5], t, 8, 1.4, 0.9, 0.5);
        if (c === 'fartSix' && t > 24.1) gas(rr, [0, 2.0, 1.0], [0, 0.4, -3.2], t, 10, 2.5, 1.4, 0.6);
        if (c === 'gasWalk' && F.vladik) gas(rr, V3.add(F.vladik.hips, [0, -0.1, 0.4]), [0, 0.3, 2.5], t, 8, 1.2, 1.1, 0.45);
        if (c === 'gasCloud') gas(rr, [8, 0.8, -1.6], [0, 1, 4], t, 12, 3, 0.35, 0.55);
        if ((c === 'kart' || c === 'kartFront' || c === 'kartSide' || c === 'vanChoke') && st.vehicles[0]) gas(rr, M4.point(st.vehicles[0].M, [0.35, 0.5, -1.4]), [0, 0.6, -9], t, 12, 2.2, 1.5, 0.55);
        if (c === 'blast' && t > shot.start + 1.0) gas(rr, [-0.6, 2.3, 0], [3, 0.3, 0], t, 10, 2.5, 1.3, 0.6);
        if ((c === 'gasTrail' || c === 'toiletJeep') && st.vehicles[0]) gas(rr, M4.point(st.vehicles[0].M, [0, 1.3, -1.6]), [0, 0.8, -12], t, 12, 3, 1.2, 0.5);
        if (c === 'fartJet' && F.vladik) gas(rr, V3.add(F.vladik.hips, [0, 0, -0.4]), [0, -0.2, -8], t, 10, 1.6, 2, 0.6);
        if (c === 'thinker' || c === 'thinkerDark' || c === 'flex') rr.draw(spotMesh, M4.translate(0, 0, c === 'flex' ? -5 : -4.4), { additive: true, alpha: c === 'thinkerDark' ? 0.4 : 0.2 });
        if (c === 'smile' && F.vladik) rr.draw(raysMesh, M4.chain(M4.translate(F.vladik.head[0] - 0.8, F.vladik.head[1] + 0.9, F.vladik.head[2] - 0.6), M4.rotZ(t * 0.5)), { additive: true, alpha: ease((t - shot.start) / 1.5) * 0.8 });
        if (c === 'tiptoe') rr.draw(r.meshCache.vlWcGlow || (r.meshCache.vlWcGlow = r.mesh(new Builder().quad([-1.5, 1.8, -38.8], [1.5, 1.8, -38.8], [1.5, 4.8, -38.8], [-1.5, 4.8, -38.8], [0.6, 0.8, 1, 1]))), null, { additive: true, alpha: 0.5, texture: glowTex });
      }
    };
  }

  const kitBuilders = K.builders;
  const BUILDERS = {
    ident: kitBuilders.ident,
    flat: buildFlat,
    bath: buildBath,
    deep: kitBuilders.deep,
    ring: kitBuilders.ring,
    vault: kitBuilders.vault,
    street: kitBuilders.street,
    store: buildStore,
    roofs: kitBuilders.roofs,
    stage: kitBuilders.stage,
    dream: kitBuilders.dream,
    desert: kitBuilders.desert,
    burst: kitBuilders.burst
  };

  const create = K.makeCreate({
    builders: BUILDERS,
    looks: LOOKS,
    vehicles: Object.assign({}, K.VEHICLES, EXTRA_VEHICLES),
    prop: makeProp,
    stage,
    shotAt,
    fadeAt,
    overlay,
    sceneOpts: {
      stage: { word: 'НАСРАЛ', topWord: 'МЕГА', cube: 0.5 },
      burst: { table: BURSTS },
      street: { speed: (shot) => (['gangsta', 'gangsta2', 'bench'].includes(shot.cam) ? 0 : STREET_SPEED) },
      desert: { speed: desertSpeed, isDusk: (t) => t > 113 && t < 116.3 }
    }
  });

  const clip = {
    id: 'vladik-v-depressii',
    number: 3,
    hidden: false,
    artist: 'Владик в депрессии',
    title: 'Paranoia FunCover',
    originalYear: 2025,
    audio: 'content/clip/Владик в депрессии (Paranoia FunCover).mp3',
    duration: DURATION,
    bpm: BPM,
    poster: 66.8,
    locations: LOCATIONS,
    shots: SHOTS,
    looks: { vladik: LOOKS.vladik, kamya: LOOKS.kamya, maks: LOOKS.maks, lyoha: LOOKS.lyoha, felix: LOOKS.felix, bald: LOOKS.bald },
    shotAt,
    stage,
    fadeAt,
    voiceAt,
    create
  };

  window.P3DVladikKit = { toilet, buildBath };
  window.poligonClips = window.poligonClips || [];
  if (!window.poligonClips.some(c => c.id === clip.id)) window.poligonClips.push(clip);
})();
