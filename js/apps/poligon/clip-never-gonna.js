(function () {
  const { M4, V3, Builder, rgb, shade, cookieMatrix, rand } = window.P3D;
  const { Figure, restPose, DIM } = window.P3DFigure;

  const BPM = 113.63;
  const BEAT0 = 0.254;
  const DURATION = 213.09;
  const VOICE = 'v700us0x0k7ltt44rhvwlgb1k0sj0y90iil00ljhznl80f0fmlzda0kme3mehshkh3l00r0xi0fl4n0idjzflp0f00vjzwqbutehmfjxgag4n00p0oz0f4di0hgizeeh2e03lmezd00lo25meuffi2mm0q30x1ihim00fiznlm30n9wfnzvq0rq00qjvsruk0rlrq0vh5mspijxqrzqrf8k0000z60afm00ng9ukph5t9co3o40o0bp0502ziohdnjkwlzlaqi6p0xsbz97p3l90k0uu2rnb80nfbnibq8c02300x0301g0aipzgfb9znfvf0xbd50kgitmrghm90fcvpsz053nujemqzekfbav0ta0s5ff8pb2ncsyirk0f0i00zedmpm20f80z1b00z7hs6vm0iac30rkdv3ruijyok6rxtqztmh72skflsjk1000qjcqpizm00ioe6zmmpnh00ujdipupsvmuheqsshezwsm010jqokl0tonk3000if0ztgoptgj0ssa0prjthb00m75k04qzvs0c0pcaesrfclhj5apqpqfctevzoupoqek00ywlksyqgpqnbahc1d0z7n0igi0bilyeal0uflyozk0bd0c0qfcsj8v9d0707dv0805m0oolze0o4ze6j00z7d51900sesc3qeka9mf7u9oprd93uezmrg89y0se0z0brnk00lgrpiqf5a0030r509ek10jofzlql1zdkteya5f5e00ordp9gnhgh7lqsl0ho7vfrfpzmhhhv20g0yb0pzlr0q3dujbl0505b0au8gkee0i90z80l0na3p30z940id00xqnbdrjjewkaazzpvzkic0kp62ubhg0000lh9jjul60dwdauulprg40s95gk9xjzlizbqtpze4svv000ddtor80nrnf2a00d6znwpswsh90pr01qkmln00n04qe0jzsxuef0w2rrptf0en3hcumunlzf1wzrerpiiq0kzzcogvr9qhra400e00sqolwo640pra6slmg0300si9hozf00ks04umhjsd00oeeindtmxfazmvztzgjyuo000dlqnna0mrpl0000l0vrrnqknli7rq58rnvib50q67w00hzsuhqr0r6mmlmb0mh7c2sltjjpb0vzukxvjgm0vzypspvsstrvrindm7drql5lj00mesgcb01p0p52x2alsq00njzphoj5g0a40z50kpj30rhovhg90s0sq3z70hpn01ii9xffd5b0040od0go5i0zttzusumrmmuqzqmglbh2c16p70d030000kk0ce9g0lvtzmftewlnyjazgd0gjm4c6v58lbeinxgjodo8kc00d7zk360ljkkmnyd000g00fczpbhhiobhhezg532l00jdzu3ebboc1c0ymfc0f00lhlzeomfqe1j9znknmic6ki0zf182i3070xp0he6a0642ze8h9l46c9zp0000j0184ze5e6nabhetub400a00mcxj5igradimlz9015tgfplzjjkikh0m50t7bc4n22j5zkje33f6a00z9celi00e3yl650bu8pc0te0c9b00oacz0lkvhwc5cxuukzyjh0sgyanhfj0000o72g9hmb00fx0nqdfh8d0zgcbk5pjsefz78jkr71kmqm0040ghgf0xjim4g00d0azrdmvoha0tz50ojndhg00v2e40epmlfm60jcegjk90zf6adoilmizl3mqetkf60w00spii6raetko8050o00zpo8mjf7459z0i9dh0000zg88bod608hu6fhacg7d0zgcdj5jgmeize9okq30mft900b0fgid0wlho4500e4hzljfrhh80ly70tjtdea00z0e908qtqruc0v6rcqje0ykb7bdnmplzfdvsftjnc0y00pvef6veoijq9010k00znsapkg9caiz5ldhi0190ykaghmna45jtbimhgeaa0znd8d4gfifexgcmkqb4ifqf02c6jhfd0yhfj6c00d9bzdcbmjgb7juc0menegb70w8hg8jmnkjof8lekikihcqggilnoopotqmonlomnljpfbmnhhda6555444454443000000000';
  const VOICE_LV = Array.from(VOICE, ch => parseInt(ch, 36) / 35);
  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (x) => { const k = clamp(x, 0, 1); return k * k * (3 - 2 * k); };
  const inWin = (t, a, b) => t >= a && t < b;
  const frac = (x) => x - Math.floor(x);
  const beatAt = (t) => ((t - BEAT0) * BPM) / 60;

  const LOCATIONS = [
    { id: 'studio', name: 'Студия', color: '#b9a8e6', scene: 'studio' },
    { id: 'arcade', name: 'Аркада', color: '#2f55b8', scene: 'arcade' },
    { id: 'yard', name: 'Двор у сетки', color: '#8dc2e8', scene: 'yard' },
    { id: 'loft', name: 'Зал с окнами', color: '#e6a24a', scene: 'loft' },
    { id: 'bar', name: 'Бар', color: '#c23b2e', scene: 'loft' }
  ];

  const SHOT_LIST = [
    [0, 'studio', 'feet'], [2, 'studio', 'hand'], [2.44, 'studio', 'med'], [7.44, 'arcade', 'pullback'],
    [9.44, 'studio', 'girl'], [11.28, 'yard', 'wide'], [15, 'yard', 'woman'], [18.24, 'arcade', 'med'],
    [22.92, 'yard', 'med'], [28.96, 'yard', 'close'], [30.44, 'yard', 'shadow'], [31.08, 'yard', 'med2'],
    [33.2, 'arcade', 'med2'], [37.72, 'yard', 'close'], [38.6, 'yard', 'woman'], [39.6, 'yard', 'womanClose'],
    [40.9, 'yard', 'wide'], [42.32, 'loft', 'wide'], [43.68, 'studio', 'close'], [44.32, 'studio', 'med'],
    [46.2, 'studio', 'close'], [48.04, 'loft', 'trio'], [51.16, 'bar', 'bar'], [53.6, 'loft', 'trioWide'],
    [55.56, 'bar', 'barClose'], [57.08, 'studio', 'med'], [59, 'studio', 'girl'], [60.76, 'arcade', 'close'],
    [72.6, 'loft', 'wide'], [74.56, 'bar', 'barFan'], [76.24, 'loft', 'wide2'], [77.24, 'studio', 'med'],
    [78.32, 'bar', 'bar'], [79.72, 'bar', 'barWide'], [80.24, 'studio', 'close'], [81.3, 'studio', 'girl'],
    [82.4, 'arcade', 'med'], [88.08, 'arcade', 'med2'], [89.44, 'studio', 'med'], [90.08, 'loft', 'wide'],
    [91.48, 'studio', 'close2'], [93.08, 'loft', 'trioWide'], [93.96, 'bar', 'barWide'], [95.72, 'loft', 'side'],
    [96.56, 'loft', 'trio'], [98.08, 'studio', 'close'], [100.08, 'studio', 'med'], [101.4, 'bar', 'barFan'],
    [102.68, 'bar', 'barWide'], [104.24, 'studio', 'close'], [106.44, 'studio', 'girl'], [108.36, 'studio', 'close2'],
    [110.12, 'yard', 'shadow'], [110.76, 'arcade', 'wide'], [112.8, 'arcade', 'close'], [114.76, 'yard', 'womanFace'],
    [117.3, 'yard', 'feet'], [119.84, 'yard', 'man'], [120.72, 'yard', 'wide'], [123.08, 'arcade', 'wide'],
    [124.5, 'arcade', 'med'], [125.92, 'yard', 'close'], [127.2, 'yard', 'jumper'], [128.44, 'yard', 'close2'],
    [130.2, 'yard', 'shadow'], [132.36, 'yard', 'close'], [134.28, 'yard', 'shadow2'], [135.32, 'loft', 'wide'],
    [138.16, 'studio', 'close'], [140.2, 'loft', 'trioWide'], [141.16, 'studio', 'med'], [144, 'arcade', 'close'],
    [144.8, 'arcade', 'flip'], [147.4, 'arcade', 'close2'], [150, 'arcade', 'stroll'], [153, 'arcade', 'close'],
    [156, 'arcade', 'close2'], [159, 'arcade', 'wide'], [162, 'arcade', 'girl'], [165, 'arcade', 'flip2'],
    [168, 'arcade', 'girl'], [171, 'arcade', 'bboy'], [174, 'arcade', 'girlFace'], [176.5, 'arcade', 'close'],
    [179, 'loft', 'micClose'], [180.64, 'loft', 'slide'], [182.68, 'bar', 'barSpin'], [183.96, 'loft', 'trioWide'],
    [186.68, 'studio', 'med'], [188.2, 'studio', 'close'], [189.56, 'arcade', 'wide'], [190.76, 'loft', 'micClose2'],
    [193.08, 'studio', 'close'], [195.24, 'arcade', 'med'], [197.16, 'studio', 'close2'], [199.28, 'arcade', 'close'],
    [200.84, 'studio', 'med'], [203.2, 'arcade', 'close']
  ];

  const SHOTS = SHOT_LIST.map(([start, loc, cam], i) => ({
    index: i,
    start,
    end: i + 1 < SHOT_LIST.length ? SHOT_LIST[i + 1][0] : DURATION,
    loc,
    cam,
    scene: LOCATIONS.find(l => l.id === loc).scene
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
    if (t < 18 || t > 206.5) return 0;
    const f = t * 10;
    const i = Math.floor(f);
    const a = VOICE_LV[i] || 0, b = VOICE_LV[i + 1] || 0;
    return Math.pow(a + (b - a) * (f - i), 0.85);
  }

  function blinkAt(t, seed) {
    return frac(t * 0.29 + seed) < 0.035 ? 1 : 0;
  }

  function fadeAt(t) {
    if (t < 0.6) return 1 - t / 0.6;
    if (t > 205.5) return clamp((t - 205.5) / 6.5, 0, 1);
    return 0;
  }

  const LOOKS = {
    suit: { skin: 0xe8b89a, hair: 0x9a4a22, hairStyle: 'quiff', top: 0x2a2c33, shirtFront: 'stripes', lapels: true, collar: 0xf2f0ea, legs: 0xd8d2c0, shoes: 0x151515, eyes: 0x4a6a88 },
    trench: { skin: 0xe2b294, hair: 0x9a4a22, hairStyle: 'quiff', top: 0xd6caae, coat: 0xd6caae, shirtFront: 0x16161a, collar: 0x16161a, lapels: true, legs: 0x26262c, shoes: 0x111111, eyes: 0x4a6a88 },
    denim: { skin: 0xebbd9c, hair: 0x9a4a22, hairStyle: 'quiff', top: 0x9cc0e0, collar: 0x9cc0e0, legs: 0x86a8d0, shoes: 0x3a3a40, glasses: true, belt: 0x2a2020 },
    girlBlack: { size: 'f', skin: 0xf0c8a8, hair: 0xf0d890, hairStyle: 'long', top: 0x18181c, legs: 0x18181c, shoes: 0x101010, bareArms: true, shortSleeves: true, eyes: 0x3a6a8a },
    girlBob: { size: 'f', skin: 0xf2caa8, hair: 0xe8d8a0, hairStyle: 'bob', top: 0x1c1c22, legs: 0x1c1c22, shoes: 0x101010, bareArms: true, shortSleeves: true, eyes: 0x3a6a8a },
    girlWhite: { size: 'f', skin: 0xf2caa8, hair: 0xf2e0a8, hairStyle: 'bob', top: 0xf4f2ea, dress: 0xf4f2ea, legs: 0xf2caa8, bareLegs: true, shoes: 0xe8e0d0, glasses: true, bareArms: true, shortSleeves: true },
    girlTank: { size: 'f', skin: 0xf0c8a8, hair: 0x6a4424, hairStyle: 'long', top: 0xf4f4f0, legs: 0x6a88b8, shoes: 0xdddddd, bareArms: true, shortSleeves: true, eyes: 0x4a3a2a },
    bartender: { skin: 0x6a4230, hair: 0x1a1210, hairStyle: 'crop', top: 0xf6f6f2, suspenders: 0xd02020, legs: 0x2a2a30, shoes: 0x111111, eyes: 0x2a1a10 },
    bboy: { skin: 0xe6b898, hair: 0xd8c080, hairStyle: 'short', top: 0xf2f2f0, shortSleeves: true, legs: 0x7090c0, shoes: 0xeeeeee },
    jumper: { skin: 0x6a4230, hair: 0x1a1210, hairStyle: 'crop', top: 0xe8e8f0, shirtFront: 'stripes', legs: 0x222228, bareLegs: true, shoes: 0xf0f0f0, eyes: 0x2a1a10 },
    tee: { skin: 0xe8bb9a, hair: 0xd8b870, hairStyle: 'short', top: 0xf6f6f6, shortSleeves: true, legs: 0x333338, belt: 0x111111, shoes: 0x111111, glasses: true }
  };

  function base(x, z, ry) {
    const p = restPose();
    p.x = x;
    p.z = z;
    p.ry = ry || 0;
    return p;
  }

  function croon(p, b, amp = 1) {
    const bounce = 0.5 + 0.5 * C(2 * PI * b);
    const kn = 0.1 + 0.14 * bounce * amp;
    p.knL = [kn, 0, 0];
    p.knR = [kn, 0, 0];
    p.hipL = [kn * 0.5, 0, 0.05];
    p.hipR = [kn * 0.5, 0, 0.05];
    p.spine = [0.05 + 0.03 * bounce, 0.12 * S(PI * b * 0.5) * amp, 0.05 * S(PI * b) * amp];
    p.neck = [0.05 * S(2 * PI * b), -0.12 * S(PI * b * 0.5), 0.05 * S(PI * b)];
    p.shR = [1.0, 0.45, 0.15];
    p.elR = [1.85, 0, 0];
    const g = S(PI * b * 0.5);
    p.shL = [0.3 + 0.45 * Math.max(0, g) * amp, 0.1, 0.22 + 0.3 * Math.abs(S(PI * b)) * amp];
    p.elL = [0.8 + 0.6 * Math.max(0, -g), 0, 0];
    p.rz = 0.02 * S(PI * b);
    return p;
  }

  function groove(p, b, amp = 1) {
    const s = S(PI * b);
    const s2 = S(2 * PI * b);
    p.x += 0.1 * s * amp;
    const kL = 0.2 + 0.3 * Math.max(0, s) * amp;
    const kR = 0.2 + 0.3 * Math.max(0, -s) * amp;
    p.knL = [kL, 0, 0];
    p.knR = [kR, 0, 0];
    p.hipL = [kL * 0.55, 0.1 * s, 0.07];
    p.hipR = [kR * 0.55, -0.1 * s, 0.07];
    p.spine = [0.08, 0.24 * s * amp, -0.05 * s];
    p.neck = [0.1 * Math.abs(s2) - 0.05, -0.2 * s, 0.06 * s];
    p.shL = [0.35 + 0.42 * s * amp, 0.2, 0.3];
    p.shR = [0.35 - 0.42 * s * amp, 0.2, 0.3];
    p.elL = [1.55 + 0.25 * s2, 0.2, 0];
    p.elR = [1.55 - 0.25 * s2, 0.2, 0];
    p.rz = -0.04 * s;
    p.skirtSwing = 0.08 * s;
    return p;
  }

  function walk(p, b) {
    const s = S(PI * b);
    const c = C(PI * b);
    p.hipL = [0.4 * s, 0, 0.03];
    p.hipR = [-0.4 * s, 0, 0.03];
    p.knL = [0.12 + 0.55 * Math.max(0, c), 0, 0];
    p.knR = [0.12 + 0.55 * Math.max(0, -c), 0, 0];
    p.shL = [-0.4 * s, 0, 0.12];
    p.shR = [0.4 * s, 0, 0.12];
    p.elL = [0.35, 0, 0];
    p.elR = [0.35, 0, 0];
    p.spine = [0.04, 0.12 * s, 0];
    p.neck = [0.02, -0.08 * s, 0];
    p.rz = 0.03 * s;
    p.skirtSwing = 0.12 * s;
    return p;
  }

  function stepTouch(p, b, mirror) {
    const k = mirror ? -1 : 1;
    const s = S(PI * b) * k;
    const pL = Math.max(0, s), pR = Math.max(0, -s);
    p.x += 0.2 * s;
    const bounce = 0.5 + 0.5 * C(2 * PI * b);
    p.knL = [0.15 + 0.25 * bounce + 0.2 * pR, 0, 0];
    p.knR = [0.15 + 0.25 * bounce + 0.2 * pL, 0, 0];
    p.hipL = [0.1, 0, 0.12 + 0.15 * pL];
    p.hipR = [0.1, 0, 0.12 + 0.15 * pR];
    p.shL = [1.0 + 1.6 * pL, 0, 0.35];
    p.shR = [1.0 + 1.6 * pR, 0, 0.35];
    p.elL = [1.0 - 0.8 * pL, 0, 0];
    p.elR = [1.0 - 0.8 * pR, 0, 0];
    p.spine = [0.05, 0.15 * s, 0.1 * s];
    p.neck = [0.1 * bounce - 0.05, 0.2 * s, 0];
    p.rz = -0.05 * s;
    return p;
  }

  function hipSway(p, b) {
    const s = S(PI * b);
    const q = S(PI * b * 0.5);
    p.x += 0.06 * s;
    p.rz = 0.07 * s;
    p.knL = [0.2 + 0.2 * Math.max(0, s), 0, 0];
    p.knR = [0.2 + 0.2 * Math.max(0, -s), 0, 0];
    p.hipL = [0.1, 0, 0.1];
    p.hipR = [0.1, 0, 0.1];
    p.spine = [0.02, 0.3 * q, -0.1 * s];
    p.shL = [2.5 + 0.35 * s, 0, 0.35];
    p.elL = [0.7 + 0.3 * q, 0, 0];
    p.shR = [0.6 - 0.4 * s, 0, 0.5 + 0.3 * q];
    p.elR = [0.9, 0, 0];
    p.neck = [-0.1, 0.35 * q, 0.1 * s];
    return p;
  }

  function armsOut(p, k) {
    p.shL = [0.55, 0, 1.2 * k + p.shL[2] * (1 - k)];
    p.shR = [0.55, 0, 1.2 * k + p.shR[2] * (1 - k)];
    p.elL = [0.25, 0, 0];
    p.elR = [0.25, 0, 0];
    p.spine = [-0.08, p.spine[1] * (1 - k), 0];
    p.neck = [-0.25 * k, 0, 0];
    return p;
  }

  function flipCycle(p, b, beats) {
    const q = frac(b / beats);
    if (q < 0.5) return groove(p, b, 1.2);
    if (q < 0.62) {
      const k = ease((q - 0.5) / 0.12);
      p.knL = [1.3 * k, 0, 0];
      p.knR = [1.3 * k, 0, 0];
      p.hipL = [0.8 * k, 0, 0.1];
      p.hipR = [0.8 * k, 0, 0.1];
      p.shL = [-0.6 * k, 0, 0.2];
      p.shR = [-0.6 * k, 0, 0.2];
      p.spine = [0.4 * k, 0, 0];
      return p;
    }
    if (q < 0.86) {
      const f = (q - 0.62) / 0.24;
      const tuck = S(PI * f);
      p.ground = false;
      p.pivot = 1.0;
      p.rx = -2 * PI * ease(f);
      p.y = 1.25 * 4 * f * (1 - f);
      p.hipL = [1.7 * tuck, 0, 0.1];
      p.hipR = [1.7 * tuck, 0, 0.1];
      p.knL = [2.0 * tuck, 0, 0];
      p.knR = [2.0 * tuck, 0, 0];
      p.shL = [2.6 - 1.4 * tuck, 0, 0.3];
      p.shR = [2.6 - 1.4 * tuck, 0, 0.3];
      p.elL = [0.2 + tuck, 0, 0];
      p.elR = [0.2 + tuck, 0, 0];
      return p;
    }
    const k = 1 - ease((q - 0.86) / 0.14);
    p.knL = [1.1 * k, 0, 0];
    p.knR = [1.1 * k, 0, 0];
    p.hipL = [0.7 * k, 0, 0.12];
    p.hipR = [0.7 * k, 0, 0.12];
    p.shL = [1.2 * k, 0, 0.9 * k];
    p.shR = [1.2 * k, 0, 0.9 * k];
    p.spine = [0.3 * k, 0, 0];
    return p;
  }

  function lunge(p, b) {
    const s = S(PI * b * 0.5);
    const a = Math.max(0, s), c = Math.max(0, -s);
    p.hipL = [0.95 * a - 0.35 * c, 0, 0.2];
    p.hipR = [0.95 * c - 0.35 * a, 0, 0.2];
    p.knL = [1.2 * a + 0.15, 0, 0];
    p.knR = [1.2 * c + 0.15, 0, 0];
    p.spine = [0.25 * Math.abs(s), 0.3 * s, 0];
    p.shL = [0.4 + 2.2 * c, 0, 1.2];
    p.shR = [0.4 + 2.2 * a, 0, 1.2];
    p.elL = [0.2, 0, 0];
    p.elR = [0.2, 0, 0];
    p.neck = [-0.2, 0.2 * s, 0];
    return p;
  }

  function polish(p, b) {
    const s4 = S(4 * PI * b), c4 = C(4 * PI * b);
    p.shL = [0.95, 0.5, 0.05];
    p.elL = [1.25, 0, 0];
    p.shR = [0.85 + 0.12 * s4, 0.45, 0.1 + 0.08 * c4];
    p.elR = [1.35 + 0.2 * c4, 0, 0];
    const bounce = 0.5 + 0.5 * C(2 * PI * b);
    p.knL = [0.1 + 0.12 * bounce, 0, 0];
    p.knR = [0.1 + 0.12 * bounce, 0, 0];
    p.hipL = [0.1, 0, 0.05];
    p.hipR = [0.1, 0, 0.05];
    p.spine = [0.15, 0.1 * S(PI * b), 0.04 * S(PI * b)];
    p.neck = [0.12 + 0.08 * S(2 * PI * b), 0.25 * S(PI * b * 0.5), 0.1 * S(PI * b)];
    return p;
  }

  function jumpTuck(p, b) {
    const f = frac(b / 2);
    if (f < 0.25 || f > 0.8) {
      const k = f < 0.25 ? ease(f / 0.25) : 1 - ease((f - 0.8) / 0.2);
      p.knL = [0.9 * k, 0, 0];
      p.knR = [0.9 * k, 0, 0];
      p.hipL = [0.6 * k, 0, 0.1];
      p.hipR = [0.6 * k, 0, 0.1];
      p.shL = [-0.5 * k, 0, 0.2];
      p.shR = [-0.5 * k, 0, 0.2];
      p.spine = [0.3 * k, 0, 0];
      return p;
    }
    const q = (f - 0.25) / 0.55;
    const tuck = S(PI * q);
    p.ground = false;
    p.y = 0.75 * S(PI * q);
    p.hipL = [1.6 * tuck, 0, 0.15];
    p.hipR = [1.6 * tuck, 0, 0.15];
    p.knL = [2.1 * tuck, 0, 0];
    p.knR = [2.1 * tuck, 0, 0];
    p.shL = [1.5, 0, 0.6 + 0.6 * tuck];
    p.shR = [1.5, 0, 0.6 + 0.6 * tuck];
    p.elL = [0.4, 0, 0];
    p.elR = [0.4, 0, 0];
    return p;
  }

  const SOLVERS = {};
  function solveHead(look, pose) {
    const size = look.size || 'm';
    if (!SOLVERS[size]) SOLVERS[size] = { d: DIM[size], scale: 1 };
    const m = Figure.prototype.solve.call(SOLVERS[size], pose);
    return { head: M4.point(m.head, [0, 0, 0]), hips: M4.point(m.hips, [0, 0, 0]), feet: M4.point(m.shinL, [0, -0.45, 0.05]) };
  }

  function castStudio(t, b, shot) {
    const girlCam = shot.cam === 'girl';
    const singer = croon(base(0, 0, 0), b);
    if (inWin(t, 199.28, 203.2)) {
      singer.shL = [1.3, 0, 0.9];
      singer.elL = [0.25, 0, 0];
    }
    singer.mouth = voiceAt(t);
    singer.blink = blinkAt(t, 0.1);
    const girl = hipSway(base(-1.9, -1.2, PI + 0.6 * S(PI * b * 0.25)), b);
    return [
      { id: 'singer', look: 'suit', pose: singer, hidden: girlCam },
      { id: 'girl', look: 'girlBlack', pose: girl, hidden: !girlCam }
    ];
  }

  function castArcade(t, b, shot) {
    const breakTime = inWin(t, 144.8, 179);
    const dancerCam = ['flip', 'flip2', 'girl', 'girlFace', 'bboy'].includes(shot.cam);
    let singer;
    if (inWin(t, 150, 153)) {
      singer = walk(base(-2.4 + 1.3 * (t - 150), 0.2, 1.0), beatAt(t) * 1);
    } else {
      singer = groove(base(0, 0, 0), b, 1.1);
    }
    singer.mouth = voiceAt(t);
    singer.blink = blinkAt(t, 0.4);
    const bboy = shot.cam === 'bboy' ? groove(base(-3.5, -2.3, 0.3), b, 1.4) : flipCycle(base(-3.5, -2.3, 0.2), b, 8);
    const girl = lunge(base(3.0, -1.3, -0.35), b);
    return [
      { id: 'singer', look: 'trench', pose: singer, hidden: dancerCam },
      { id: 'bboy', look: 'bboy', pose: bboy, hidden: !(breakTime || dancerCam) },
      { id: 'girl', look: 'girlTank', pose: girl, hidden: !(breakTime || dancerCam) }
    ];
  }

  function castYard(t, b, shot) {
    const shadowCam = shot.cam === 'shadow' || shot.cam === 'shadow2';
    let singer;
    if (shot.cam === 'feet') {
      const k = t - 117.3;
      singer = walk(base(-1.5 + 0.75 * k, 1.2, PI / 2), b);
    } else {
      singer = groove(base(0, 1.2, 0), b, shadowCam ? 1.5 : 1);
    }
    singer.mouth = voiceAt(t);
    singer.blink = blinkAt(t, 0.7);
    const period = 7;
    const q = frac(t / period);
    const dir = q < 0.5 ? 1 : -1;
    const along = q < 0.5 ? q * 2 : 2 - q * 2;
    const woman = walk(base(9.6 + 3.2 * ease(along), -0.6, dir * PI / 2 * 0.85), beatAt(t));
    if (shot.cam === 'womanFace') {
      woman.ry = 0.3;
      woman.x = 11;
      woman.neck = [-0.55, 0.3 * S(t * 0.8), 0];
      woman.hipL = [0, 0, 0.05];
      woman.hipR = [0, 0, 0.05];
      woman.knL = [0.1, 0, 0];
      woman.knR = [0.1, 0, 0];
      woman.shL = [0.2, 0, 0.1];
      woman.shR = [2.6, 0.3, 0.3];
      woman.elR = [1.8, 0, 0];
    }
    if (shot.cam === 'womanClose') woman.neck = [0.05, 0.8 * S(PI * b * 0.5), 0.1];
    const man = groove(base(9.4, 0.5, -0.3), b, 0.6);
    man.shL = [0.9, 0.5, 0.2];
    man.elL = [1.2 + 0.3 * Math.max(0, S(2 * PI * b)), 0, 0];
    man.shR = [0.9, 0.5, 0.2];
    man.elR = [1.2 + 0.3 * Math.max(0, -S(2 * PI * b)), 0, 0];
    const jumper = jumpTuck(base(-3.2, -0.7, 0.4), b);
    const womanCam = ['woman', 'womanClose', 'womanFace'].includes(shot.cam);
    return [
      { id: 'singer', look: 'denim', pose: singer, hidden: shadowCam || womanCam || shot.cam === 'man', shadow: true },
      { id: 'woman', look: 'girlWhite', pose: woman, hidden: !(womanCam || shot.cam === 'man'), shadow: true },
      { id: 'man', look: 'tee', pose: man, hidden: shot.cam !== 'man', shadow: true },
      { id: 'jumper', look: 'jumper', pose: jumper, hidden: shot.cam !== 'jumper' && shot.cam !== 'wide', shadow: true }
    ];
  }

  function bartenderPose(t, b) {
    const home = base(7.9, -2.2, -PI / 2);
    if (inWin(t, 79.72, 80.24)) {
      const f = (t - 79.72) / 0.52;
      const k = S(PI * f);
      home.ground = false;
      home.y = 0.5 * k;
      home.hipL = [0.2 * k, 0, 1.35 * k];
      home.hipR = [0.2 * k, 0, 1.35 * k];
      home.shL = [0.3, 0, 1.6 * k];
      home.shR = [0.3, 0, 1.6 * k];
      home.elL = [0.1, 0, 0];
      home.elR = [0.1, 0, 0];
      return home;
    }
    if (inWin(t, 102.68, 104.24)) {
      const f = (t - 102.68) / 1.56;
      const tuck = S(PI * f);
      const p = base(7.9 - 1.7 * ease(f), -2.2, -PI / 2);
      p.ground = false;
      p.pivot = 1.0;
      p.rx = 2 * PI * ease(f);
      p.y = 1.35 * S(PI * f);
      p.hipL = [1.4 * tuck, 0, 0.1];
      p.hipR = [1.4 * tuck, 0, 0.1];
      p.knL = [1.6 * tuck, 0, 0];
      p.knR = [1.6 * tuck, 0, 0];
      p.shL = [2.8 * tuck, 0, 0.3];
      p.shR = [2.8 * tuck, 0, 0.3];
      return p;
    }
    if (inWin(t, 180.64, 182.68)) {
      const f = ease((t - 180.64) / 2.04);
      const p = base(6.2 - 1.2 * f, -4.2 + 2.8 * f, -PI / 2 + 0.9);
      p.hipL = [0.15, 0, 0.25];
      p.hipR = [0.15, 0, 0.25];
      p.knL = [1.95, 0, 0];
      p.knR = [1.95, 0, 0];
      p.spine = [-0.5 * f, 0, 0];
      p.neck = [-0.3 * f, 0, 0];
      p.shL = [0.6, 0, 1.4];
      p.shR = [0.6, 0, 1.4];
      p.elL = [0.2, 0, 0];
      p.elR = [0.2, 0, 0];
      return p;
    }
    if (inWin(t, 182.68, 184)) {
      const f = (t - 182.68) / 1.32;
      const p = base(5.2, -1.4, -PI / 2 + 0.9 + 4 * PI * ease(f));
      p.shL = [0.4, 0, 1.4];
      p.shR = [0.4, 0, 1.4];
      p.elL = [0.3, 0, 0];
      p.elR = [0.3, 0, 0];
      p.hipL = [0.5, 0, 0.1];
      p.knL = [0.9, 0, 0];
      p.spine = [0, 0, 0.1];
      return p;
    }
    if (inWin(t, 74, 81) || inWin(t, 93.5, 102)) return groove(home, b, 0.9);
    return polish(home, b);
  }

  function castLoft(t, b, shot) {
    const atMic = ['micClose', 'micClose2', 'trio'].includes(shot.cam);
    const singer = atMic ? croon(base(0, -3.4, 0), b, 0.8) : groove(base(0, -3.6, 0), b, 1);
    if (inWin(t, 96.56, 98.08)) armsOut(singer, ease((t - 96.56) / 0.4));
    singer.mouth = voiceAt(t);
    singer.blink = blinkAt(t, 0.2);
    const left = stepTouch(base(-1.45, -3.9, 0.15), b, false);
    const right = stepTouch(base(1.45, -3.9, -0.15), b, true);
    const barOnly = shot.loc === 'bar';
    return [
      { id: 'singer', look: 'suit', pose: singer, hidden: barOnly },
      { id: 'left', look: 'girlBlack', pose: left, hidden: barOnly },
      { id: 'right', look: 'girlBob', pose: right, hidden: barOnly },
      { id: 'bartender', look: 'bartender', pose: bartenderPose(t, b), hidden: false }
    ];
  }

  const CASTS = { studio: castStudio, arcade: castArcade, yard: castYard, loft: castLoft };

  function wobble(t, k = 1) {
    return [(0.02 * S(t * 1.3) + 0.01 * S(t * 2.9)) * k, 0.015 * S(t * 1.7 + 1) * k, 0.01 * S(t * 1.1 + 2) * k];
  }

  function frame(eye, at, fov, t, shake = 1) {
    const w = wobble(t, shake);
    return { eye: V3.add(eye, w), at: V3.add(at, V3.mul(w, 0.6)), fov };
  }

  const CAMS = {
    studio: {
      feet: (t, u) => frame([0.5, 0.22 + 0.2 * u, 1.45 - 0.2 * u], [0.02, 0.1 + 0.3 * u, 0.1], 40, t, 0.5),
      hand: (t, u, F) => frame([0.45, 1.25, 1.0], V3.add(F.singer.hips, [0.05, 0.3, 0.15]), 38, t),
      med: (t, u, F) => frame([0.35 * S(u * 2 + 0.5), 1.45, 3.3 - 0.4 * u], [F.singer.head[0] * 0.5, 1.25, 0], 38, t),
      close: (t, u, F) => frame([0.12, 1.66, 1.12 - 0.08 * u], V3.add(F.singer.head, [0, -0.06, 0]), 34, t),
      close2: (t, u, F) => frame([0.85, 1.64, 0.9], V3.add(F.singer.head, [0, -0.05, 0]), 34, t),
      girl: (t, u, F) => frame([-0.9 + 0.3 * u, 1.3, 1.3], V3.add(F.girl.hips, [0, 0.35, 0]), 44, t)
    },
    arcade: {
      pullback: (t, u, F) => {
        const k = ease(u);
        return frame([0.2 + 2.5 * k, 1.65 - 0.1 * k, 1.1 + 4.5 * k], V3.lerp(F.singer.head, [0, 1.2, -1], k), 36 + 10 * k, t);
      },
      wide: (t, u) => frame([5.5 - 1.2 * u, 1.7, 7], [0, 1.2, -1.5], 48, t, 0.6),
      med: (t, u, F) => frame([0.9 - 0.5 * u, 1.5, 2.9], [F.singer.hips[0] * 0.6, 1.25, 0], 40, t),
      med2: (t, u, F) => frame([-1.2 + 0.3 * u, 1.4, 2.6], [F.singer.hips[0] * 0.6, 1.3, 0], 40, t),
      close: (t, u, F) => frame([0.3 - 0.25 * u + F.singer.head[0] * 0.6, 1.68, 1.05], V3.add(F.singer.head, [0, -0.06, 0]), 36, t),
      close2: (t, u, F) => frame([-0.5 + F.singer.head[0] * 0.6, 1.62, 1.0], V3.add(F.singer.head, [0, -0.05, 0]), 36, t),
      stroll: (t, u, F) => frame([F.singer.hips[0] + 0.8, 1.5, 3.4], [F.singer.hips[0], 1.2, -0.2], 42, t),
      flip: (t, u, F) => frame([-3.4, 1.2, 2.4], [-3.5, 1.4, -2.4], 46, t),
      flip2: (t, u) => frame([-1.0 - 0.5 * u, 1.0, 3.6], [-3.3, 1.3, -2.2], 44, t),
      girl: (t, u, F) => frame([3.6 - 0.4 * u, 1.1, 1.9], V3.add(F.girl.hips, [0, 0.1, 0]), 46, t),
      bboy: (t, u, F) => frame([-2.9, 1.3, 0.2], V3.add(F.bboy.hips, [0, 0.2, 0]), 44, t),
      girlFace: (t, u, F) => frame(V3.add(F.girl.head, [-0.28, 0.1, 1.2]), V3.add(F.girl.head, [0, -0.04, 0]), 38, t)
    },
    yard: {
      wide: (t, u) => frame([3.2 - 0.6 * u, 1.6, 5.4], [0, 1.0, 0.2], 46, t, 0.6),
      med: (t, u, F) => frame([0.9 + 0.3 * u, 1.45, 3.8], [F.singer.hips[0] * 0.6, 1.2, 1.1], 40, t),
      med2: (t, u, F) => frame([-1.0, 1.5, 3.6], [F.singer.hips[0] * 0.6, 1.25, 1.1], 40, t),
      close: (t, u, F) => frame([0.25 + F.singer.head[0] * 0.6, 1.7, 2.2], V3.add(F.singer.head, [0, -0.06, 0]), 35, t),
      close2: (t, u, F) => frame([-0.45 + F.singer.head[0] * 0.6, 1.64, 2.15], V3.add(F.singer.head, [0, -0.05, 0]), 35, t),
      shadow: (t, u, F) => frame([F.singer.hips[0] + 0.3, 2.9, 1.9], [F.singer.hips[0] + 1.35, 0, 0.1], 50, t, 0.4),
      shadow2: (t, u, F) => frame([F.singer.hips[0] + 2.6, 2.6, 1.4], [F.singer.hips[0] + 1.2, 0, 0.0], 50, t, 0.4),
      feet: (t, u, F) => frame([F.singer.hips[0] + 0.2, 0.35, 2.6], [F.singer.hips[0], 0.18, 1.2], 42, t, 0.5),
      woman: (t, u, F) => frame([F.woman.hips[0] + 0.6, 1.35, 2.2], V3.add(F.woman.hips, [0, 0.35, 0]), 44, t),
      womanClose: (t, u, F) => frame([F.woman.head[0] + 0.3, 1.55, 0.35], V3.add(F.woman.head, [0, -0.05, 0]), 36, t),
      womanFace: (t, u, F) => frame([F.woman.head[0] + 0.25, 1.35, 0.25], V3.add(F.woman.head, [0, 0.02, 0]), 38, t),
      man: (t, u, F) => frame([10.4, 1.4, 2.7], V3.add(F.man.hips, [0, 0.45, 0]), 42, t),
      jumper: (t, u) => frame([-2.6, 1.1, 1.8], [-3.2, 1.0, -0.7], 46, t)
    },
    loft: {
      wide: (t, u) => frame([-3 + 1.4 * u, 3.4, 8.5], [0, 1.0, -4], 50, t, 0.4),
      wide2: (t, u) => frame([3.5, 2.8, 7.5], [-0.5, 1.0, -4], 50, t, 0.4),
      side: (t, u) => frame([-7.2, 2.2, 1 + 0.5 * u], [0, 1.1, -4], 48, t, 0.5),
      trio: (t, u) => frame([0.4, 1.5, -0.2 - 0.5 * u], [0, 1.3, -3.9], 46, t),
      trioWide: (t, u) => frame([1.6 - 0.6 * u, 1.8, 3.2], [0, 1.1, -4], 48, t),
      micClose: (t, u, F) => frame([0.42, 1.7, -2.05], V3.add(F.singer.head, [0, -0.05, 0]), 38, t),
      micClose2: (t, u, F) => frame([-0.55, 1.66, -2.1], V3.add(F.singer.head, [0, -0.05, 0]), 38, t),
      slide: (t, u, F) => frame([2.4, 1.6, 2.6], V3.lerp([4.5, 0.9, -2.5], F.bartender.hips, 0.5), 50, t),
      bar: (t, u, F) => frame([6.0, 1.55, -3.0], V3.add(F.bartender.head, [0, -0.25, 0]), 44, t),
      barClose: (t, u, F) => frame([6.55, 1.62, -2.45], V3.add(F.bartender.head, [0, -0.12, 0]), 38, t),
      barFan: (t, u, F) => frame([6.25, 1.42, -0.95], V3.add(F.bartender.head, [0, -0.2, 0]), 44, t),
      barWide: (t, u, F) => frame([4.1, 1.8, 0.9], V3.lerp([7.4, 1.2, -2.6], F.bartender.hips, 0.4), 48, t, 0.6),
      barSpin: (t, u, F) => frame([3.3, 1.3, 0.4], V3.add(F.bartender.hips, [0, 0.2, 0]), 46, t)
    }
  };

  function stage(t, shot) {
    const b = beatAt(t);
    const cast = CASTS[shot.scene](t, b, shot);
    const focus = {};
    cast.forEach(a => { focus[a.id] = solveHead(LOOKS[a.look], a.pose); });
    const u = clamp((t - shot.start) / Math.max(0.01, shot.end - shot.start), 0, 1);
    const camFn = CAMS[shot.scene][shot.cam];
    const camera = camFn(t, u, focus);
    return { cast, focus, camera, beat: b };
  }

  function texBrick(colors, mortar, rows, cols, seed) {
    return (ctx, w, h) => {
      const r = rand(seed);
      ctx.fillStyle = mortar;
      ctx.fillRect(0, 0, w, h);
      const bh = h / rows, bw = w / cols;
      for (let y = 0; y < rows; y++) {
        for (let x = -1; x < cols; x++) {
          const ox = (y % 2) * bw * 0.5;
          ctx.fillStyle = colors[Math.floor(r() * colors.length)];
          ctx.fillRect(Math.round(x * bw + ox + 1), Math.round(y * bh + 1), Math.round(bw - 2), Math.round(bh - 2));
        }
      }
      for (let i = 0; i < w * h * 0.08; i++) {
        ctx.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
        ctx.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1);
      }
    };
  }

  function texNoise(basecol, seed, amount = 0.14, grain = 1) {
    return (ctx, w, h) => {
      const r = rand(seed);
      ctx.fillStyle = basecol;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < w * h * 0.35; i++) {
        const v = r();
        ctx.fillStyle = v < 0.5 ? `rgba(0,0,0,${amount * r()})` : `rgba(255,255,255,${amount * r()})`;
        ctx.fillRect(Math.floor(r() * w), Math.floor(r() * h), grain, grain);
      }
    };
  }

  function texWood(ctx, w, h) {
    const r = rand(7);
    const planks = 4;
    const pw = w / planks;
    for (let i = 0; i < planks; i++) {
      const tone = 150 + Math.floor(r() * 40);
      ctx.fillStyle = `rgb(${tone + 40},${tone - 10},${tone - 70})`;
      ctx.fillRect(i * pw, 0, pw, h);
      for (let g = 0; g < 14; g++) {
        ctx.fillStyle = `rgba(90,50,20,${0.08 + r() * 0.12})`;
        ctx.fillRect(i * pw + r() * pw, 0, 1, h);
      }
      ctx.fillStyle = 'rgba(40,20,5,0.55)';
      ctx.fillRect(i * pw, 0, 1, h);
      const cut = Math.floor(r() * h);
      ctx.fillRect(i * pw, cut, pw, 1);
    }
  }

  function texChainLink(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(205,208,212,1)';
    ctx.lineWidth = 2;
    const n = 2;
    const s = w / n;
    for (let i = -1; i <= n; i++) {
      ctx.beginPath();
      ctx.moveTo(i * s, 0);
      ctx.lineTo(i * s + h, h);
      ctx.moveTo(i * s + s, 0);
      ctx.lineTo(i * s + s - h, h);
      ctx.stroke();
    }
  }

  function texGothicCookie(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    const m = 14;
    const x0 = m, x1 = w - m, top = 8, spring = h * 0.42, bottom = h - 4;
    const cx = w / 2;
    ctx.beginPath();
    ctx.moveTo(x0, bottom);
    ctx.lineTo(x0, spring);
    ctx.quadraticCurveTo(x0, top + 20, cx, top);
    ctx.quadraticCurveTo(x1, top + 20, x1, spring);
    ctx.lineTo(x1, bottom);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 9;
    const lancets = [x0 + (x1 - x0) / 3, x0 + (2 * (x1 - x0)) / 3];
    lancets.forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, bottom);
      ctx.lineTo(x, spring + 30);
      ctx.stroke();
    });
    ctx.lineWidth = 7;
    [[x0, lancets[0]], [lancets[0], lancets[1]], [lancets[1], x1]].forEach(([a, c]) => {
      const mid = (a + c) / 2;
      ctx.beginPath();
      ctx.moveTo(a, spring + 34);
      ctx.quadraticCurveTo(a, spring - 4, mid, spring - 16);
      ctx.quadraticCurveTo(c, spring - 4, c, spring + 34);
      ctx.stroke();
    });
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, spring - 58, 34, 0, PI * 2);
    ctx.stroke();
    ctx.lineWidth = 5;
    for (let i = 0; i < 4; i++) {
      const a = (i * PI) / 2 + PI / 4;
      ctx.beginPath();
      ctx.arc(cx + C(a) * 15, spring - 58 + S(a) * 15, 13, 0, PI * 2);
      ctx.stroke();
    }
    ctx.lineWidth = 3;
    for (let y = spring + 40; y < bottom; y += 26) {
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
    }
    for (let x = x0 + 21; x < x1; x += 21) {
      ctx.beginPath();
      ctx.moveTo(x, spring + 40);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    const img = ctx.getImageData(0, 0, w, h);
    const src = new Uint8ClampedArray(img.data);
    const rad = 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0, n = 0;
        for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            const xx = (x + dx + w) % w, yy = (y + dy + h) % h;
            sum += src[(yy * w + xx) * 4];
            n++;
          }
        }
        const v = 0.28 * 255 + (sum / n) * 0.72;
        const o = (y * w + x) * 4;
        img.data[o] = img.data[o + 1] = img.data[o + 2] = v;
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function texLeafCookie(ctx, w, h) {
    const r = rand(33);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(40,40,40,0.55)';
    for (let c = 0; c < 26; c++) {
      const cx = r() * w, cy = r() * h;
      const spread = 18 + r() * 30;
      for (let i = 0; i < 14; i++) {
        const x = cx + (r() - 0.5) * spread * 2, y = cy + (r() - 0.5) * spread * 2;
        const rx = 3 + r() * 7, ry = 2 + r() * 4, rot = r() * PI;
        for (let ox = -w; ox <= w; ox += w) {
          for (let oy = -h; oy <= h; oy += h) {
            ctx.beginPath();
            ctx.ellipse(x + ox, y + oy, rx, ry, rot, 0, PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  function uvq(b, pts, col, us, axis) {
    const uv = pts.map(p => axis === 'z' ? [p[2] * us, p[1] * us] : axis === 'y' ? [p[0] * us, p[2] * us] : [p[0] * us, p[1] * us]);
    b.quad(pts[0], pts[1], pts[2], pts[3], col, uv);
  }

  function archWall(b, o) {
    const { x0, x1, z, depth, height, arches, r, spring, col, us } = o;
    const zb = z - depth;
    const seg = 10;
    const edges = [];
    let cursor = x0;
    arches.forEach(cx => {
      edges.push([cursor, cx - r]);
      cursor = cx + r;
    });
    edges.push([cursor, x1]);
    edges.forEach(([a, c]) => {
      if (c - a < 0.001) return;
      uvq(b, [[a, 0, z], [c, 0, z], [c, height, z], [a, height, z]], col, us);
      uvq(b, [[c, 0, zb], [a, 0, zb], [a, height, zb], [c, height, zb]], col, us);
    });
    arches.forEach(cx => {
      const pts = [];
      for (let i = 0; i <= seg; i++) {
        const th = PI - (i / seg) * PI;
        pts.push([cx + r * C(th), spring + r * S(th)]);
      }
      for (let i = 0; i < seg; i++) {
        const p = pts[i], q = pts[i + 1];
        uvq(b, [[p[0], p[1], z], [q[0], q[1], z], [q[0], height, z], [p[0], height, z]], col, us);
        uvq(b, [[q[0], q[1], zb], [p[0], p[1], zb], [p[0], height, zb], [q[0], height, zb]], col, us);
        uvq(b, [[p[0], p[1], zb], [q[0], q[1], zb], [q[0], q[1], z], [p[0], p[1], z]], shade(col, 0.8), us, 'z');
      }
      uvq(b, [[cx - r, 0, z], [cx - r, 0, zb], [cx - r, spring, zb], [cx - r, spring, z]], shade(col, 0.85), us, 'z');
      uvq(b, [[cx + r, 0, zb], [cx + r, 0, z], [cx + r, spring, z], [cx + r, spring, zb]], shade(col, 0.85), us, 'z');
    });
    uvq(b, [[x0, height, z], [x1, height, z], [x1, height, zb], [x0, height, zb]], shade(col, 0.7), us, 'y');
  }

  function micStand(b, x, z, height) {
    b.at(x, 0, z, (m) => {
      m.prism(10, 0.16, 0.16, 0, 0.14, 0.14, 0.03, [0.22, 0.22, 0.25, 0]);
      m.prism(6, 0.013, 0.013, 0.03, 0.013, 0.013, height, [0.7, 0.7, 0.74, 0]);
      m.at(0, height + 0.02, 0, (h) => {
        h.box(0.06, 0.03, 0.03, [0.55, 0.55, 0.58, 0]);
        h.at(0, 0.075, 0, (c) => {
          c.ellipsoid(0.042, 0.075, 0.03, 10, 6, [0.82, 0.82, 0.86, 0.15]);
          for (let i = -3; i <= 3; i++) c.at(0, i * 0.017, 0.029, (g) => g.box(0.07 - Math.abs(i) * 0.008, 0.005, 0.006, [0.25, 0.25, 0.28, 0]));
        });
      });
    });
  }

  function texGlow(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, '#9a9a9a');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function glowQuads(b, x, y, z, size, col) {
    b.quad([x - size, y - size, z], [x + size, y - size, z], [x + size, y + size, z], [x - size, y + size, z], col);
    b.quad([x, y - size, z - size], [x, y - size, z + size], [x, y + size, z + size], [x, y + size, z - size], col);
  }

  function buildStudio(r) {
    const back = new Builder();
    const col = [0.93, 0.9, 0.97, 0];
    const floorCol = [0.9, 0.87, 0.93, 0];
    back.quad([-10, 0, 8], [10, 0, 8], [10, 0, -3], [-10, 0, -3], floorCol);
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const a0 = (i / steps) * (PI / 2), a1 = ((i + 1) / steps) * (PI / 2);
      const p0 = [1.6 - 1.6 * C(a0), -3 - 1.6 * S(a0)], p1 = [1.6 - 1.6 * C(a1), -3 - 1.6 * S(a1)];
      const n0 = V3.norm([0, C(a0), S(a0)]), n1 = V3.norm([0, C(a1), S(a1)]);
      back.quad([-10, p0[0], p0[1]], [10, p0[0], p0[1]], [10, p1[0], p1[1]], [-10, p1[0], p1[1]], [floorCol, floorCol, col, col], null, [n0, n0, n1, n1]);
    }
    back.quad([-10, 1.6, -4.6], [10, 1.6, -4.6], [10, 9, -4.6], [-10, 9, -4.6], col);
    micStand(back, 0, 0.3, 1.45);
    const sun = V3.norm([0.42, -0.36, -0.83]);
    const cookieTex = r.texture(256, texGothicCookie);
    return {
      env: {
        sunDir: sun,
        sunColor: [0.72, 0.7, 0.78],
        ambTop: [0.5, 0.46, 0.66],
        ambBottom: [0.36, 0.33, 0.5],
        fogColor: [0.86, 0.83, 0.95],
        fogNear: 12,
        fogFar: 40,
        cookie: { texture: cookieTex, matrix: cookieMatrix(sun, [0, 1.8, -4.4], 2.3), strength: 1 }
      },
      layers: [{ mesh: r.mesh(back) }],
      shadows: 'blob'
    };
  }

  function buildArcade(r) {
    const wall = new Builder();
    const arches = [-10.5, -7, -3.5, 0, 3.5, 7, 10.5];
    archWall(wall, { x0: -14, x1: 14, z: -4, depth: 0.8, height: 6, arches, r: 1.0, spring: 2.3, col: [0.62, 0.68, 0.9, 0], us: 0.9 });
    const ground = new Builder();
    ground.quad([-30, 0, 12], [30, 0, 12], [30, 0, -4], [-30, 0, -4], [0.42, 0.46, 0.62, 0], [[0, 12], [22, 12], [22, 0], [0, 0]]);
    ground.quad([-30, 0, -4], [30, 0, -4], [30, 0, -14], [-30, 0, -14], [[0.9, 0.62, 0.3, 0.55], [0.9, 0.62, 0.3, 0.55], [0.5, 0.36, 0.3, 0.6], [0.5, 0.36, 0.3, 0.6]], [[0, 4], [22, 4], [22, 0], [0, 0]]);
    const sky = new Builder();
    const gold = [1.0, 0.72, 0.36, 1], dusk = [0.36, 0.3, 0.42, 1];
    sky.quad([-30, 0, -12], [30, 0, -12], [30, 3.2, -12], [-30, 3.2, -12], [gold, gold, [0.95, 0.6, 0.35, 1], [0.95, 0.6, 0.35, 1]]);
    sky.quad([-30, 3.2, -12], [30, 3.2, -12], [30, 10, -12], [-30, 10, -12], [[0.95, 0.6, 0.35, 1], [0.95, 0.6, 0.35, 1], dusk, dusk]);
    const props = new Builder();
    const lampX = 1.75;
    props.at(lampX, 3.1, -3.75, (l) => {
      l.box(0.06, 0.06, 0.45, [0.1, 0.1, 0.12, 0]);
      l.at(0, -0.12, 0.22, (h) => {
        h.box(0.18, 0.1, 0.18, [0.12, 0.12, 0.14, 0]);
        h.at(0, -0.1, 0, (g) => g.ellipsoid(0.07, 0.07, 0.07, 6, 4, [1.0, 0.4, 0.25, 1]));
      });
    });
    props.at(-5.25, 3.1, -3.75, (l) => {
      l.box(0.06, 0.06, 0.45, [0.1, 0.1, 0.12, 0]);
      l.at(0, -0.12, 0.22, (h) => {
        h.box(0.18, 0.1, 0.18, [0.12, 0.12, 0.14, 0]);
        h.at(0, -0.1, 0, (g) => g.ellipsoid(0.07, 0.07, 0.07, 6, 4, [1.0, 0.55, 0.3, 1]));
      });
    });
    const rr = rand(5);
    for (let i = 0; i < 9; i++) {
      const x = -8 + rr() * 16, z = -2 + rr() * 7, s = 0.4 + rr() * 0.9;
      props.quad([x - s, 0.004, z + s * 0.5], [x + s, 0.004, z + s * 0.5], [x + s, 0.004, z - s * 0.5], [x - s, 0.004, z - s * 0.5], [0.28, 0.34, 0.6, 0.3]);
    }
    const glow = new Builder();
    glowQuads(glow, lampX, 2.88, -3.53, 0.45, [1.0, 0.35, 0.2, 1]);
    glowQuads(glow, -5.25, 2.88, -3.53, 0.4, [1.0, 0.5, 0.25, 1]);
    const brick = r.texture(128, texBrick(['#8a96c4', '#7c88b8', '#96a2cc', '#6e7aa8', '#8490c0'], '#525a80', 8, 4, 11));
    const asphalt = r.texture(128, texNoise('#8088a0', 21, 0.25));
    return {
      env: {
        sunDir: V3.norm([0.3, -0.45, -0.84]),
        sunColor: [0.34, 0.44, 0.85],
        ambTop: [0.2, 0.26, 0.52],
        ambBottom: [0.07, 0.09, 0.2],
        fogColor: [0.1, 0.13, 0.3],
        fogNear: 9,
        fogFar: 38,
        points: [
          { pos: [lampX, 2.8, -3.2], color: [1.3, 0.45, 0.25] },
          { pos: [0, 1.6, -5.2], color: [2.2, 1.3, 0.6] }
        ]
      },
      layers: [
        { mesh: r.mesh(wall), texture: brick },
        { mesh: r.mesh(ground), texture: asphalt },
        { mesh: r.mesh(sky), opts: { noFog: true } },
        { mesh: r.mesh(props) }
      ],
      glows: [{ mesh: r.mesh(glow), opts: { additive: true, alpha: 0.8, texture: r.texture(64, texGlow, { clamp: true }) } }],
      shadows: 'blob'
    };
  }

  function buildYard(r) {
    const ground = new Builder();
    ground.quad([-25, 0, 14], [25, 0, 14], [25, 0, -3], [-25, 0, -3], [0.86, 0.84, 0.8, 0], [[0, 17], [50, 17], [50, 0], [0, 0]]);
    const wall = new Builder();
    wall.at(-2, 0, -3.2, (w) => w.box(26, 3.8, 0.4, [0.9, 0.89, 0.86, 0], { base: true }));
    wall.at(-2, 3.8, -3.2, (w) => w.box(26.2, 0.12, 0.5, [0.7, 0.7, 0.7, 0], { base: true }));
    const bricks = new Builder();
    bricks.at(12.5, 0, -1.9, (w) => w.box(9, 4.2, 0.5, [0.97, 0.96, 0.93, 0], { base: true, uvScale: 0.7 }));
    const fenceMesh = new Builder();
    fenceMesh.quad([-12, 0, -1.4], [8, 0, -1.4], [8, 2.5, -1.4], [-12, 2.5, -1.4], [0.85, 0.86, 0.88, 0], [[0, 0], [20 / 0.5, 0], [20 / 0.5, 2.5 / 0.5], [0, 2.5 / 0.5]]);
    const posts = new Builder();
    for (let x = -12; x <= 8; x += 2.5) posts.at(x, 0, -1.4, (p) => p.prism(6, 0.035, 0.035, 0, 0.035, 0.035, 2.6, [0.6, 0.62, 0.65, 0]));
    posts.at(-2, 2.5, -1.4, (p) => p.box(20, 0.05, 0.05, [0.6, 0.62, 0.65, 0]));
    posts.at(12.5, 0, -1.62, (d) => {
      d.at(-2.2, 0, 0, (q) => q.box(1.1, 2.2, 0.06, [0.36, 0.26, 0.18, 0], { base: true }));
      d.at(1.6, 1.3, 0, (q) => q.box(1.6, 1.2, 0.06, [0.25, 0.3, 0.36, 0.1], { base: true }));
      d.at(1.6, 1.88, 0.02, (q) => q.box(0.06, 1.2, 0.06, [0.9, 0.9, 0.9, 0]));
    });
    const sun = V3.norm([0.55, -0.62, -0.56]);
    const leaves = r.texture(256, texLeafCookie);
    const concrete = r.texture(128, texNoise('#c8c4bc', 9, 0.22));
    const brickWhite = r.texture(128, texBrick(['#f4f2ec', '#ecebe4', '#f8f6f0'], '#c8c6c0', 8, 4, 3));
    const link = r.texture(64, texChainLink);
    return {
      env: {
        sunDir: sun,
        sunColor: [0.72, 0.68, 0.58],
        ambTop: [0.52, 0.58, 0.72],
        ambBottom: [0.42, 0.4, 0.38],
        fogColor: [0.78, 0.84, 0.92],
        fogNear: 18,
        fogFar: 70,
        cookie: { texture: leaves, matrix: cookieMatrix(sun, [0, 1, -1.5], 2.6), strength: 0.8 }
      },
      layers: [
        { mesh: r.mesh(ground), texture: concrete },
        { mesh: r.mesh(wall) },
        { mesh: r.mesh(bricks), texture: brickWhite },
        { mesh: r.mesh(posts) },
        { mesh: r.mesh(fenceMesh), texture: link }
      ],
      shadows: 'planar',
      sun
    };
  }

  function table(b, x, z) {
    b.at(x, 0, z, (t) => {
      t.prism(8, 0.22, 0.22, 0, 0.18, 0.18, 0.04, [0.2, 0.14, 0.1, 0]);
      t.prism(6, 0.04, 0.04, 0.04, 0.04, 0.04, 0.72, [0.2, 0.14, 0.1, 0]);
      t.prism(12, 0.55, 0.55, 0.38, 0.47, 0.47, 0.76, [0.96, 0.95, 0.9, 0], { capTop: true });
      [0, PI].forEach((rot, i) => {
        t.push(M4.translate(i ? 0.18 : -0.18, 0.76, i ? -0.05 : 0.08), M4.rotY(rot + 0.4));
        const wood = [0.32, 0.18, 0.1, 0];
        t.prism(8, 0.19, 0.19, 0, 0.19, 0.19, 0.03, wood);
        [[0.13, 0.13], [-0.13, 0.13], [0.13, -0.13], [-0.13, -0.13]].forEach(([lx, lz]) => t.at(lx, 0.03, lz, (l) => l.prism(5, 0.014, 0.014, 0, 0.012, 0.012, 0.44, wood)));
        t.at(0, 0.22, 0, (l) => l.prism(8, 0.15, 0.15, 0, 0.15, 0.15, 0.015, wood, { capTop: false }));
        t.at(0, -0.02, -0.17, (l) => {
          l.at(-0.12, -0.2, 0, (q) => q.box(0.022, 0.4, 0.022, wood));
          l.at(0.12, -0.2, 0, (q) => q.box(0.022, 0.4, 0.022, wood));
          l.at(0, -0.42, 0, (q) => q.box(0.28, 0.05, 0.03, wood));
        });
        t.pop();
      });
    });
  }

  function buildLoft(r) {
    const room = new Builder();
    const wallCol = [0.55, 0.36, 0.28, 0];
    uvq(room, [[-9, 0, -8], [-9, 0, 9], [-9, 7, 9], [-9, 7, -8]], wallCol, 0.8, 'z');
    uvq(room, [[9.2, 0, 9], [9.2, 0, -8], [9.2, 7, -8], [9.2, 7, 9]], wallCol, 0.8, 'z');
    room.quad([-9, 7, -8], [9.2, 7, -8], [9.2, 7, 9], [-9, 7, 9], [0.22, 0.14, 0.1, 0]);
    for (let z = -7; z < 9; z += 2) room.at(0, 6.8, z, (bm) => bm.box(18.2, 0.3, 0.25, [0.18, 0.11, 0.08, 0]));
    const bays = [-6.3, -2.1, 2.1, 6.3];
    const bw = 1.75;
    const winBottom = 0.9, winTop = 5.4, peak = 6.5;
    let prev = -9;
    bays.forEach(cx => {
      uvq(room, [[prev, 0, -8], [cx - bw, 0, -8], [cx - bw, 7, -8], [prev, 7, -8]], wallCol, 0.8);
      prev = cx + bw;
      uvq(room, [[cx - bw, 0, -8], [cx + bw, 0, -8], [cx + bw, winBottom, -8], [cx - bw, winBottom, -8]], wallCol, 0.8);
      room.tri([cx - bw, winTop, -8], [cx - bw, 7, -8], [cx, peak, -8], wallCol);
      room.tri([cx + bw, winTop, -8], [cx, peak, -8], [cx + bw, 7, -8], wallCol);
      room.tri([cx - bw, 7, -8], [cx + bw, 7, -8], [cx, peak, -8], wallCol);
    });
    uvq(room, [[prev, 0, -8], [9.2, 0, -8], [9.2, 7, -8], [prev, 7, -8]], wallCol, 0.8);
    const floor = new Builder();
    floor.quad([-9, 0, 9], [9.2, 0, 9], [9.2, 0, -8], [-9, 0, -8], [0.95, 0.8, 0.62, 0], [[0, 0], [7, 0], [7, 6.8], [0, 6.8]]);
    const glass = new Builder();
    const lo = [1.0, 0.95, 0.86, 1], hi = [1.0, 0.84, 0.86, 1];
    bays.forEach(cx => {
      glass.quad([cx - bw, winBottom, -8.1], [cx + bw, winBottom, -8.1], [cx + bw, winTop, -8.1], [cx - bw, winTop, -8.1], [lo, lo, hi, hi]);
      glass.tri([cx - bw, winTop, -8.1], [cx + bw, winTop, -8.1], [cx, peak, -8.1], [hi, hi, hi]);
      const city = [0.72, 0.62, 0.66, 1];
      const rc = rand(Math.round(cx * 10 + 50));
      for (let x = cx - bw; x < cx + bw - 0.2; x += 0.35) {
        const h = 0.25 + rc() * 0.9;
        glass.quad([x, winBottom, -8.08], [x + 0.33, winBottom, -8.08], [x + 0.33, winBottom + h, -8.08], [x, winBottom + h, -8.08], city);
      }
    });
    const frames = new Builder();
    const fr = [0.24, 0.16, 0.12, 0];
    bays.forEach(cx => {
      for (let i = 0; i <= 6; i++) {
        const x = cx - bw + (i * 2 * bw) / 6;
        const topY = winTop + (peak - winTop) * (1 - Math.abs(x - cx) / bw);
        frames.at(x, (winBottom + topY) / 2, -8.02, (f) => f.box(0.07, topY - winBottom, 0.08, fr));
      }
      for (let y = winBottom; y <= winTop + 0.01; y += (winTop - winBottom) / 6) {
        frames.at(cx, y, -8.02, (f) => f.box(bw * 2, 0.06, 0.08, fr));
      }
      frames.at(cx, (winTop + peak) / 2 - 0.1, -8.01, (f) => f.prism(10, 0.35, 0.02, 0, 0.35, 0.02, 0.06, fr));
    });
    const furn = new Builder();
    [[-5.5, 0.5], [-3, 1.2], [-0.4, 0.8], [2.4, 1.3], [5.0, 0.6], [-6, 3.2], [-3.4, 3.8], [-0.8, 3.4], [1.8, 4.0], [4.4, 3.4], [-4.8, 6], [-2, 6.5], [0.8, 6.2], [3.6, 6.4]].forEach(([x, z]) => table(furn, x, z));
    const wood = [0.3, 0.17, 0.1, 0];
    furn.at(7.2, 0, -3.0, (bar) => {
      bar.box(0.6, 1.08, 5.0, wood, { base: true, faces: { top: [0.42, 0.24, 0.14, 0] } });
      bar.at(-0.31, 0.3, 0, (p) => p.box(0.02, 0.5, 4.8, [0.72, 0.5, 0.38, 0]));
      bar.at(0, 1.08, 0, (top) => top.box(0.72, 0.05, 5.1, [0.22, 0.12, 0.07, 0]));
      bar.at(-0.42, 0.18, 0, (rail) => rail.box(0.04, 0.04, 5.0, [0.85, 0.66, 0.3, 0.1]));
      [[0, 0.4], [0, -0.2]].forEach(([dx, dz]) => bar.at(dx, 1.1, dz, (tap) => {
        tap.prism(8, 0.035, 0.035, 0, 0.035, 0.035, 0.46, [0.55, 0.08, 0.06, 0]);
        tap.at(0, 0.46, 0, (cap) => cap.prism(8, 0.045, 0.045, 0, 0.02, 0.02, 0.06, [0.9, 0.7, 0.3, 0.15]));
        tap.prism(8, 0.05, 0.05, 0, 0.04, 0.04, 0.05, [0.9, 0.7, 0.3, 0.15]);
      }));
      bar.at(0, 1.1, -1.2, (urn) => {
        urn.prism(10, 0.13, 0.13, 0, 0.12, 0.12, 0.42, [0.78, 0.78, 0.82, 0.12]);
        urn.at(0, 0.42, 0, (d) => d.ellipsoid(0.12, 0.07, 0.12, 8, 4, [0.8, 0.8, 0.84, 0.12]));
      });
      bar.at(0, 1.1, 1.7, (fan) => {
        fan.prism(8, 0.1, 0.1, 0, 0.08, 0.08, 0.04, [0.2, 0.22, 0.2, 0]);
        fan.prism(6, 0.015, 0.015, 0.04, 0.015, 0.015, 0.25, [0.3, 0.3, 0.3, 0]);
        fan.push(M4.translate(0, 0.33, 0), M4.rotZ(PI / 2));
        fan.prism(12, 0.17, 0.17, -0.05, 0.17, 0.17, 0.05, [0.72, 0.74, 0.76, 0.1], { capBottom: true });
        fan.pop();
      });
      for (let i = 0; i < 6; i++) bar.at(0.05, 1.1, 0.7 + i * 0.12, (g) => g.prism(8, 0.035, 0.035, 0, 0.04, 0.04, 0.12, [0.82, 0.88, 0.9, 0.35], { capTop: false, capBottom: true }));
    });
    furn.at(9.0, 0, -3.0, (sh) => {
      sh.box(0.35, 1.0, 5.4, wood, { base: true });
      [1.6, 2.1, 2.6].forEach(y => {
        sh.at(-0.05, y, 0, (s) => s.box(0.3, 0.04, 5.4, [0.35, 0.2, 0.12, 0]));
        for (let z = -2.5; z <= 2.5; z += 0.22) sh.at(-0.05, y + 0.02, z, (g) => g.prism(8, 0.04, 0.04, 0, 0.045, 0.045, 0.14, [0.8, 0.86, 0.9, 0.35], { capTop: false }));
      });
    });
    const backWall = new Builder();
    backWall.quad([9.18, 0, 0], [9.18, 0, -6], [9.18, 5, -6], [9.18, 5, 0], [0.98, 0.96, 0.98, 0.55]);
    micStand(furn, 0, -2.95, 1.45);
    const sun = V3.norm([0.12, -0.42, 0.9]);
    const shafts = new Builder();
    bays.forEach(cx => {
      const reach = 5.6 / -sun[1];
      const near = [1.0, 0.86, 0.7, 1], far = [1.0, 0.86, 0.7, 0.25];
      shafts.quad([cx - bw, 5.4, -7.9], [cx + bw, 5.4, -7.9], [cx + bw + sun[0] * reach, 0.02, -7.9 + sun[2] * reach], [cx - bw + sun[0] * reach, 0.02, -7.9 + sun[2] * reach], [near, near, far, far]);
      const reach2 = 2.2 / -sun[1];
      shafts.quad([cx - bw, 2.2, -7.9], [cx + bw, 2.2, -7.9], [cx + bw + sun[0] * reach2, 0.02, -7.9 + sun[2] * reach2], [cx - bw + sun[0] * reach2, 0.02, -7.9 + sun[2] * reach2], [near, near, far, far]);
    });
    const brick = r.texture(128, texBrick(['#b0705a', '#9c604c', '#a86a52', '#8e5644'], '#6a4234', 8, 4, 17));
    const planks = r.texture(128, texWood);
    return {
      env: {
        sunDir: sun,
        sunColor: [0.95, 0.8, 0.62],
        ambTop: [0.62, 0.5, 0.46],
        ambBottom: [0.4, 0.3, 0.24],
        fogColor: [0.96, 0.86, 0.8],
        fogNear: 5,
        fogFar: 34,
        points: [{ pos: [0, 2.5, -1], color: [0.9, 0.7, 0.5] }, { pos: [6.5, 2.4, -2.2], color: [1.2, 1.1, 1.0] }]
      },
      layers: [
        { mesh: r.mesh(room), texture: brick },
        { mesh: r.mesh(floor), texture: planks },
        { mesh: r.mesh(glass), opts: { noFog: true } },
        { mesh: r.mesh(frames) },
        { mesh: r.mesh(furn) },
        { mesh: r.mesh(backWall) }
      ],
      glows: [{ mesh: r.mesh(shafts), opts: { additive: true, alpha: 0.13 } }],
      shadows: 'blob'
    };
  }

  const BUILDERS = { studio: buildStudio, arcade: buildArcade, yard: buildYard, loft: buildLoft };

  function create(renderer) {
    const scenes = {};
    const figures = {};
    const sceneFor = (id) => {
      if (!scenes[id]) scenes[id] = BUILDERS[id](renderer);
      return scenes[id];
    };
    const figureFor = (sceneId, actor) => {
      const key = sceneId + ':' + actor.id;
      if (!figures[key]) {
        const look = LOOKS[actor.look];
        figures[key] = new Figure(renderer, look, look.size || 'm');
      }
      return figures[key];
    };
    return {
      warm() {
        Object.keys(BUILDERS).forEach(sceneFor);
      },
      render(t) {
        const shot = shotAt(t);
        const sc = sceneFor(shot.scene);
        const st = stage(t, shot);
        renderer.begin(sc.env, st.camera);
        sc.layers.forEach(l => renderer.draw(l.mesh, null, Object.assign({ texture: l.texture }, l.opts || {})));
        const active = st.cast.map(a => ({ a, fig: figureFor(shot.scene, a) }));
        active.forEach(({ a, fig }) => {
          fig.solve(a.pose);
          if (!a.hidden) fig.draw();
        });
        active.forEach(({ a, fig }) => {
          if (sc.shadows === 'planar') {
            if (a.shadow && (!a.hidden || shot.cam.startsWith('shadow'))) fig.drawShadow(sc.sun, 0.5);
          } else if (!a.hidden) {
            fig.drawBlob(0.3);
          }
        });
        (sc.glows || []).forEach(l => renderer.draw(l.mesh, null, l.opts));
        return { shot, polys: Math.round(renderer.polys), fade: fadeAt(t) };
      }
    };
  }

  const clip = {
    id: 'never-gonna-give-you-up',
    number: 1,
    artist: 'Rick Astley',
    title: 'Never Gonna Give You Up',
    originalYear: 1987,
    audio: 'content/clip/Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster).mp3',
    duration: DURATION,
    bpm: BPM,
    poster: 48.6,
    locations: LOCATIONS,
    shots: SHOTS,
    looks: LOOKS,
    shotAt,
    stage,
    fadeAt,
    voiceAt,
    create
  };

  window.poligonClips = window.poligonClips || [];
  if (!window.poligonClips.some(c => c.id === clip.id)) window.poligonClips.push(clip);
})();
