(function () {
  const { M4, V3, Builder, shade, rand } = window.P3D;
  const K = window.P3DParanoiaKit;
  const VK = window.P3DVladikKit;
  const { base, bounce, sneak, sit, swim } = K.moves;
  const { frame, head } = K.cams;
  const { texNoise, texText, texGlow } = K.tex;

  const BPM = 70;
  const BEAT0 = 0.504;
  const DURATION = 257.6;
  const VOICE = '000g0klf00a065mga2480fupd89e367iddbhaisus646qfefvnnlzuqntyrnjznrqzlomlejmij400000005000400gulhhufhuznqi9meeepec8kc1d0qalsk07ozuucphggfyll7r42coz780000083300bkc7i282112hylj5h50ivzcn188acomegfgkplqlkh5awnsp002460nw008b00qzc7tw81gdu3000vyz4pqb9tmh6p8a0gl7j6eb00bl20jcfemtz00pqpg30022i2008a0grqjqrze9gja8lxljfpt00jnjzuq6500egg20000057kydhag5m7nopkazuqezq6hea1mumcrtnecqiqjtc0000uwq0jsqwihnkain3buiwr1uvzzvfkmic80c104100p087djnm00hfddlsp7lmms0asz0edc9zze95hb0oe953s68407040v9c0060025frghnwmeld70ynpuz0g0zzrkysvdoceu0tqptwotutpkl0d730oz0ihmi98ot207859t0zolpr0ba0700ilpvc7l3flh0eie05375p00oimkelirzaneltdo7i1g540tgpor4470a000zpjniw9079fa0ncicrbdmgjhpbi0wlzkr0rqkc0l5602b00q20682dd0oouunjlnqof0iz9kbvcf42b00zn500xjlaqthur0po8ih00u7korwwfc8000xl9cgg900vqbfs9bdpdzinafaq7s2000f9z00ilbd0604add9h4a0abror0bdlh48f29zfjf4ctbii0zrve20xjd0df68ce8g8jlbmjipogl4p3kfp9i4ssozhd9jkd9t585000p0e552rgf980ypezckatns7zibmm00000030o2f7vr5dqxsm2mho0zkddcmg12a7itrhhps0000bdglha80zbf9y80fjp0siurrqmpmbjrh9ozh7c9f70055ray0jd007mljcilb04ed040znnqvnz7jrpjau0hc39oj6cnjbeikfrn00zzrz0nbcjsw67e03luqtwi0007ptsbqmbjqo00voeinz00fnznqqfd0biih8hle00gbj96bbazz000gbkgl6a0vkg0lyce625hbj9kjk0zkgoal6f6ca90008oxz0ekl0qpg6kymb0kdr0f6faqd9cg0600ppv6mwg0zhwu9lqnczozdmn7g3c900e0yjij0uo78rwmqj0ckw960j03bvohohw7thxzwupdhaflfofcer825q3nemm0l0a010b000zrvc0zkicsolfmsom0zquciph0lifh0n212zyk0upfpjz7i4p0ta20rfsm0p5kn8ii7c8xyd0w786h6vhpzc90jbnjn90f9c000z107k4yrlhewlnlunzhajggfgutr90830052700og280000sqp0ttuyvgimbzkf1i0nfmgivuzrhpr7a22000l0h82r3z580zjtodjrh8gto4hina00g0i0ogejf000yodd1glv1njijrri9z780rczd8j8gfa0ra804h90qqt8g65n7g0zb6k2e88pi7b0z810wfcn00bh9ggfi604b10zdfef80q4g0nzuowna9p2fmoo02shv00exci20j8oi7930200heaizuuwmswwvwxyrqvpup99kqok61000ca201a000jb8izt03auroohc0pyijeiisz2610007hiisb0000d982kztstpmmlwzdh2d7o090i4817dszihkpjkilmge8ba0nr7b3t346s0956002rd392d060d30020009jfyzznnqqnlldlmwpoghjj9jhj006180010003b65azpdacaa8pcb8lf98aj7400000mk44fhzzjnpnrll3jvniikitzrnlnbgf8220000000f874bea50f743jb40xhb97adgjjcfxzrwzxuq5wqh00xmorhqzzidljgggmvjbbbkluk70000000b083ph7e0z40pzuljfhmktwjimkdi803d0csa94i0zx4000b2wwgo37zgfhyea7qd669xab0z564s00000bttyi747875q6cq39h6vd00jg7c2k002701jz45c0nprkthvabj72z3b9rdgdnka80b60bu020446ali57028a4vb00n9c5z98abako45000w20072z0k030vhddwzuymhcdhedfeld9f4s605tfc09300pp900bcj7076aecagzaa7oh0rjdyek0000zfg5ua0039hicd70opnrni9rspxzmfiruqpurh004sljgeknllnjjuysjigjlba1000wohaglmjiidbdg85000056fadwc4840000krqtn9eihhfzzlliiejfm8adxrscsroq8nel6p968tpkqklb50000030200zivjselkzrelbuggbztnlbb22104574da9697102wk86axb40zrca9zqpkjzog97da546mlifb9igca9ywmge9431553rskihecdghfedcahowvvtmhabbba4022000000';
  const VOICE_LV = Array.from(VOICE, ch => parseInt(ch, 36) / 35);
  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (x) => { const k = clamp(x, 0, 1); return k * k * (3 - 2 * k); };
  const inWin = (t, a, b) => t >= a && t < b;
  const frac = (x) => x - Math.floor(x);
  const beatAt = (t) => ((t - BEAT0) * BPM) / 60;
  const hash = (n) => frac(S(n * 127.1) * 43758.5453);

  const LOCATIONS = [
    { id: 'ident', name: 'Заставка', color: '#8a8f99', scene: 'ident' },
    { id: 'hangar', name: 'Ангар', color: '#7a98b8', scene: 'hangar' },
    { id: 'room', name: 'Квартира', color: '#c89a5a', scene: 'room' },
    { id: 'garden', name: 'Сад камней', color: '#e8e2d4', scene: 'garden' },
    { id: 'bath', name: 'Туалет', color: '#6ab0a0', scene: 'bath' },
    { id: 'school', name: 'Дорога в школу', color: '#8e3fd6', scene: 'street' },
    { id: 'burst', name: 'Вспышки', color: '#c01818', scene: 'burst' }
  ];

  const GRADES = {
    cold: [0.82, 0.97, 1.18, 0.62],
    sepia: [1.28, 1.0, 0.7, 0.55],
    dusk: [1.08, 0.82, 0.92, 0.5],
    garden: [1.1, 1.0, 0.94, -0.35],
    bath: [0.82, 1.05, 0.95, 0.5],
    night: [0.9, 0.9, 1.15, 0.45],
    ident: [1, 1, 1, 0],
    burst: [1, 1, 1, 0]
  };

  const SHOT_LIST = [
    [0, 'ident', 'logo'], [2.2, 'room', 'dawnWide'], [5, 'room', 'flowerMacro'], [7.4, 'hangar', 'singerBack'],
    [9.1, 'hangar', 'bandHit', { strobe: true }], [10.3, 'room', 'doorOpen'], [11.8, 'hangar', 'faceFish'], [13.2, 'room', 'walkIn'],
    [16.7, 'room', 'windowLook'], [18.4, 'room', 'sillMacro'], [21.9, 'hangar', 'faceFish2'], [23.3, 'room', 'roachMacro'],
    [26.4, 'hangar', 'gtrA'], [28.7, 'room', 'stare'], [31, 'burst', 'gokiburi'],
    [33.8, 'room', 'slipperRaise'], [35.6, 'hangar', 'faceScream'], [37.4, 'room', 'slam'], [38.5, 'burst', 'shi'],
    [39.4, 'room', 'splatMacro'], [42.7, 'hangar', 'drums'], [45, 'room', 'smear'], [47.9, 'hangar', 'faceFish'],
    [50, 'room', 'smearWide'], [52.9, 'room', 'mop'], [55, 'hangar', 'bandWide'], [56, 'room', 'mopClose'],
    [58.3, 'room', 'smear'], [60.5, 'hangar', 'gtrB'], [61.8, 'room', 'mopClose'], [63.3, 'hangar', 'faceScream'],
    [65.6, 'garden', 'deadGiant'], [67.3, 'hangar', 'bandHit', { strobe: true }], [69.2, 'garden', 'flowerGiant'], [70.5, 'hangar', 'faceFish'],
    [72.2, 'garden', 'deadClose'], [74.4, 'burst', 'gokiburi2'], [75.2, 'hangar', 'bandWide'], [77, 'garden', 'singerSand'],
    [80.1, 'hangar', 'faceScream'], [82.2, 'garden', 'deadTop'], [83.2, 'hangar', 'bandHit', { strobe: true }], [85, 'garden', 'flowerGiant'],
    [87.7, 'room', 'doorOpen', { grade: 'dusk' }], [89.5, 'hangar', 'gtrA'], [90.7, 'room', 'windowLook', { grade: 'dusk' }],
    [92.7, 'room', 'sillMacro', { grade: 'dusk' }], [95.4, 'room', 'wormDrunk', { grade: 'dusk' }], [98.1, 'hangar', 'faceFish'],
    [101.2, 'room', 'wormCensor', { grade: 'dusk' }], [102.6, 'burst', 'censor'], [103.3, 'room', 'wormCensor', { grade: 'dusk' }],
    [106.2, 'hangar', 'bass'], [107.2, 'room', 'slipperSwing', { grade: 'dusk' }], [109.9, 'room', 'wormDead', { grade: 'dusk' }],
    [111.5, 'hangar', 'drums'], [113.2, 'burst', 'shi2'], [114.5, 'bath', 'flush'], [116.7, 'bath', 'flushMacro'],
    [118.7, 'hangar', 'faceFish2'], [120.1, 'bath', 'talk'],
    [123.3, 'garden', 'wormGiant'], [125.1, 'hangar', 'bandHit', { strobe: true }], [125.8, 'garden', 'wormOrbit'], [128.2, 'hangar', 'faceFish'],
    [130.3, 'burst', 'mimizu'], [131, 'garden', 'wormLow'], [133.7, 'room', 'flowerMacro', { grade: 'dusk' }], [135.8, 'hangar', 'gtrB'],
    [138.1, 'garden', 'wormLimp'], [140.7, 'burst', 'shi3'], [141.5, 'hangar', 'faceScream'], [144.9, 'garden', 'wormGoat'],
    [147, 'hangar', 'bandWide'], [149.2, 'garden', 'wormTalk'], [151.2, 'hangar', 'faceFish2'], [153, 'burst', 'baka'],
    [154, 'garden', 'wormTalk'],
    [156.8, 'room', 'bugsSill'], [158.2, 'hangar', 'bandWide'], [160, 'room', 'bugsBed'], [162.6, 'room', 'bugsDesk'],
    [165.1, 'hangar', 'singerBack'], [166.7, 'school', 'walk', { grade: 'night' }], [168.5, 'school', 'walkSide', { grade: 'night' }],
    [170.9, 'bath', 'toiletRow'], [173.2, 'bath', 'toiletRowClose'], [175.1, 'hangar', 'soloA', { strobe: true }], [177, 'hangar', 'soloB', { strobe: true }],
    [179, 'hangar', 'drums', { strobe: true }], [180.5, 'hangar', 'faceFish'], [183, 'room', 'dinner'], [185.4, 'room', 'dinnerClose'],
    [187.1, 'hangar', 'singerBack'], [190.1, 'room', 'dinnerWide'], [192.7, 'room', 'hug'], [194.5, 'hangar', 'faceFish2'],
    [196.3, 'garden', 'loveGarden'], [198.5, 'garden', 'loveOrbit'],
    [200.7, 'room', 'doorInvite'], [202.6, 'hangar', 'faceFish'], [204.3, 'room', 'gentlemen'], [206.3, 'room', 'gentlemenClose'],
    [208.5, 'hangar', 'bandWide'], [210, 'room', 'doorInvite'], [213.4, 'garden', 'parade'], [216, 'hangar', 'bandHit', { strobe: true }],
    [218, 'garden', 'paradeLow'], [221.8, 'hangar', 'faceScream'], [223.5, 'room', 'gentlemen'], [226.6, 'hangar', 'bandWide'],
    [230.1, 'hangar', 'singerBack'], [232.7, 'room', 'flowerMacro'], [235.3, 'hangar', 'faceFish'], [238.7, 'hangar', 'chaos', { strobe: true }],
    [240.5, 'burst', 'gokiburi3'], [241.3, 'garden', 'swarm'], [243.3, 'hangar', 'chaos', { strobe: true }], [244.5, 'burst', 'mimizu2'],
    [245.3, 'garden', 'swarmTop'], [247.4, 'hangar', 'chaos', { strobe: true }], [248.7, 'room', 'finalSill'], [252.3, 'ident', 'endcard']
  ];

  const DEFAULT_GRADE = { hangar: 'cold', room: 'sepia', garden: 'garden', bath: 'bath', school: 'night', ident: 'ident', burst: 'burst' };

  const SHOTS = SHOT_LIST.map(([start, loc, cam, opts], i) => ({
    index: i,
    start,
    end: i + 1 < SHOT_LIST.length ? SHOT_LIST[i + 1][0] : DURATION,
    loc,
    cam,
    scene: LOCATIONS.find(l => l.id === loc).scene,
    grade: GRADES[(opts && opts.grade) || DEFAULT_GRADE[loc]],
    strobe: !!(opts && opts.strobe),
    emptyOk: cam === 'flowerMacro',
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
    if (t < 8.8 || t > 256.2) return 0;
    const f = t * 10;
    const i = Math.floor(f);
    const a = VOICE_LV[i] || 0, b = VOICE_LV[i + 1] || 0;
    return Math.pow(a + (b - a) * (f - i), 0.8);
  }

  function fadeAt(t) {
    if (t < 1.2) return 1 - t / 1.2;
    if (t > 253.5) return clamp((t - 253.5) / 4, 0, 1);
    return 0;
  }

  const LOOKS = {
    singer: { skin: 0xf2e6e0, hair: 0x0c0c10, hairStyle: 'spiky', top: 0x141416, collar: 0x9a9aa0, cuffs: 0x2a2a2e, shirtFront: 0x3a0a0e, legs: 0x101012, shoes: 0x0a0a0a, eyes: 0xb8c0c8, makeup: true, lips: [0.05, 0.03, 0.05, 0] },
    gtrA: { skin: 0xf0dcd0, hair: 0xe8e0c8, hairStyle: 'long', top: 0x1a1a1e, coat: 0x1a1a1e, collar: 0x5a5a60, legs: 0x151518, shoes: 0x0a0a0a, makeup: true, eyes: 0x8a9aa8 },
    gtrB: { skin: 0xf0d8c8, hair: 0xa81a1a, hairStyle: 'bob', top: 0xe4e4e4, collar: 0x151515, cuffs: 0x151515, legs: 0x121214, shoes: 0x0a0a0a, makeup: true, eyes: 0x6a5a4a },
    bassist: { skin: 0xe8d0c0, hair: 0x2a1a14, hairStyle: 'long', top: 0x2a1a14, collar: 0x9a9aa0, legs: 0x121214, shoes: 0x0a0a0a, makeup: true, eyes: 0x5a4a3a },
    drummer: { skin: 0xecd4c4, hair: 0x0c0c0c, hairStyle: 'crop', top: 0x0f0f10, bareArms: true, shortSleeves: true, legs: 0x121214, shoes: 0x0a0a0a, eyes: 0x4a3a2a }
  };

  function member(id, pose, t, extra) {
    if (!pose.mouth) pose.mouth = extra && extra.sings ? voiceAt(t) : 0;
    pose.blink = frac(t * 0.29 + id.length * 0.11) < 0.03 ? 1 : 0;
    return Object.assign({ id, look: id === 'narrator' ? 'singer' : id, pose, hidden: false }, extra || {});
  }

  function headbang(p, b, amp = 1) {
    const hit = Math.pow(Math.abs(S(PI * b)), 2);
    p.neck = [0.6 * hit * amp - 0.15, 0.1 * S(PI * b * 0.5), 0];
    p.spine = [0.25 + 0.25 * hit * amp, 0, 0.05 * S(PI * b * 0.5)];
    p.knL = [0.35, 0, 0];
    p.knR = [0.35, 0, 0];
    p.hipL = [0.3, 0, 0.25];
    p.hipR = [0.3, 0, 0.25];
    return p;
  }

  function singAtMic(p, b, scream) {
    headbang(p, b, scream ? 0.5 : 0.8);
    p.shL = [1.35, 0.55, 0.05];
    p.elL = [1.3, 0, 0];
    p.shR = [1.35, 0.55, 0.05];
    p.elR = [1.3, 0, 0];
    if (scream) {
      p.spine = [0.55, 0.1 * S(PI * b), 0];
      p.neck = [-0.45, 0, 0];
      p.mouth = 1;
    }
    return p;
  }

  function guitarist(p, b, t) {
    headbang(p, b, 1);
    p.shL = [1.0, 0.1, 0.55];
    p.elL = [1.35, 0.4, 0];
    p.shR = [0.55, 0.65, 0.15];
    p.elR = [1.3 + 0.35 * S(t * 18), 0, 0];
    return p;
  }

  function drummer(p, b, t) {
    const s = sit(p, 0.95, false);
    const k = S(t * 14), q = S(t * 14 + PI);
    s.shL = [1.0 + 0.4 * k, 0.4, 0.3];
    s.elL = [1.0 - 0.3 * k, 0, 0];
    s.shR = [1.0 + 0.4 * q, 0.4, 0.3];
    s.elR = [1.0 - 0.3 * q, 0, 0];
    s.neck = [0.3 * Math.abs(S(PI * b)), 0, 0];
    s.spine = [0.2, 0.1 * k, 0];
    return s;
  }

  function band(t, b, shot) {
    const cast = [];
    const scream = ['faceScream', 'chaos'].includes(shot.cam);
    const singer = singAtMic(base(0, 1.0, 0), b, scream);
    if (shot.cam === 'singerBack') {
      singer.shL = [0.2, 0, 0.1];
      singer.shR = [0.2, 0, 0.1];
      singer.elL = [0.2, 0, 0];
      singer.elR = [0.2, 0, 0];
      singer.neck = [0.4, 0, 0];
      singer.spine = [0.1, 0, 0];
    }
    if (shot.cam === 'chaos') {
      singer.rz = 0.25 * S(t * 7);
      singer.shL = [2.6, 0, 0.8 + 0.4 * S(t * 11)];
      singer.shR = [2.6, 0, 0.8 + 0.4 * S(t * 13)];
      singer.elL = [0.4, 0, 0];
      singer.elR = [0.4, 0, 0];
    }
    cast.push(member('singer', singer, t, { sings: true }));
    cast.push(member('gtrA', guitarist(base(-2.6, 0, 0.2), b, t), t, { props: [{ id: 'guitarWhite', part: 'torso', at: [0, 0.12, 0.2] }] }));
    cast.push(member('gtrB', guitarist(base(2.6, 0, 0.2), b + 0.3, t + 0.4), t, { props: [{ id: 'guitarRed', part: 'torso', at: [0, 0.12, 0.2] }] }));
    cast.push(member('bassist', guitarist(base(-1.4, 0, -1.6), b + 0.6, t + 0.9), t, { props: [{ id: 'bassBlack', part: 'torso', at: [0, 0.1, 0.2] }] }));
    cast.push(member('drummer', drummer(base(0, -3.9, 0), b, t), t));
    return { cast, vehicles: [], bugs: [] };
  }

  function worldIdent() {
    return { cast: [], vehicles: [], bugs: [] };
  }

  const SILL = { x: 1.8, y: 1.0, z: -3.8 };
  const POT = [1.45, 1.0, -3.82];

  function narratorWalk(p, b) {
    const s = S(PI * b * 2);
    p.hipL = [0.35 * s, 0, 0.05];
    p.hipR = [-0.35 * s, 0, 0.05];
    p.knL = [0.1 + 0.4 * Math.max(0, -s), 0, 0];
    p.knR = [0.1 + 0.4 * Math.max(0, s), 0, 0];
    p.shL = [-0.3 * s, 0, 0.12];
    p.shR = [0.3 * s, 0, 0.12];
    p.spine = [0.15, 0, 0];
    p.neck = [0.2, 0, 0];
    return p;
  }

  function roach(x, y, z, ry, scale, state) {
    return Object.assign({ kind: 'roach', pos: [x, y, z], ry, scale }, state || {});
  }

  function worm(x, y, z, ry, scale, state) {
    return Object.assign({ kind: 'worm', pos: [x, y, z], ry, scale }, state || {});
  }

  function worldRoom(t, b, shot) {
    const c = shot.cam;
    const cast = [];
    const bugs = [];
    const u = clamp((t - shot.start) / Math.max(0.01, shot.end - shot.start), 0, 1);
    const verse2 = t > 86 && t < 123;
    const verse3 = t > 156;
    const sillRoach = !verse2 && !verse3 && t < 37.4;
    const squashed = t >= 37.4 && t < 86;
    if (sillRoach) bugs.push(roach(SILL.x + 0.12, SILL.y + 0.005, SILL.z + 0.02, -0.6, 0.07, { alive: true }));
    if (squashed && t < 45) bugs.push(roach(SILL.x + 0.12, SILL.y + 0.004, SILL.z + 0.02, -0.6, 0.07, { squash: true }));
    if (verse2) {
      const dead = t >= 109.9;
      if (t < 114.5) bugs.push(worm(SILL.x + 0.14, SILL.y + 0.005, SILL.z + 0.03, -0.9, 0.06, { drunk: !dead, dead, censor: c === 'wormCensor' }));
    }
    if (verse3 || c === 'finalSill') {
      const n = c === 'finalSill' ? 1 : 3;
      for (let i = 0; i < n; i++) {
        bugs.push(roach(SILL.x + 0.25 + i * 0.12, SILL.y + 0.005, SILL.z + 0.05, -0.4 - i * 0.5, 0.06, { alive: true }));
        bugs.push(worm(SILL.x - 0.05 - i * 0.14, SILL.y + 0.005, SILL.z + 0.06, 0.8, 0.05, { happy: true }));
      }
    }
    let p = base(-3.2, 1.8, PI / 2);
    let props = [];
    let hidden = false;
    if (c === 'dawnWide' || c === 'flowerMacro' || c === 'sillMacro' || c === 'roachMacro' || c === 'wormDrunk' || c === 'finalSill' || c === 'bugsSill') hidden = c !== 'sillMacro';
    if (c === 'doorOpen') {
      p = narratorWalk(base(-3.4 + 0.9 * (t - shot.start), 1.9, PI / 2), b);
    } else if (c === 'walkIn') {
      p = narratorWalk(base(-2 + 1.0 * (t - shot.start), 1.2 - 0.6 * (t - shot.start), 2.4), b);
    } else if (c === 'windowLook' || c === 'stare' || c === 'sillMacro') {
      p = base(1.75, -2.9, PI);
      p.spine = [0.3, 0, 0];
      p.neck = [0.45, 0, 0];
      p.shL = [0.3, 0, 0.1];
      p.shR = [0.3, 0, 0.1];
      if (c === 'stare') { p.neck = [0.35, 0, 0]; p.mouth = 0.3; }
    } else if (c === 'slipperRaise' || c === 'slam' || c === 'slipperSwing') {
      p = base(1.75, -2.9, PI);
      const k = c === 'slam' ? 1 - ease((t - shot.start) / 0.25) : ease((t - shot.start) / 0.8);
      p.spine = [0.2 + (c === 'slam' ? 0.5 * (1 - k) : 0), 0, 0];
      p.shR = [1.4 + 1.4 * k, 0.2, 0.2];
      p.elR = [0.3 + 0.9 * k, 0, 0];
      p.shL = [0.7, 0.3, 0.2];
      p.elL = [0.8, 0, 0];
      p.neck = [0.3, 0, 0];
      p.mouth = c === 'slam' ? 1 : 0.4;
      props = [{ id: 'slipper', part: 'foreR', at: [0, -0.3, 0.05] }];
    } else if (c === 'smear' || c === 'smearWide') {
      p = base(1.4 + 0.3 * S(t * 4), -2.3, PI);
      p.hipR = [0.5 + 0.3 * S(t * 8), 0, 0.2];
      p.knR = [0.3, 0, 0];
      p.spine = [0.3, 0, 0];
      p.neck = [0.5, 0, 0];
      p.shL = [0.4, 0, 0.5];
      p.shR = [0.4, 0, 0.5];
    } else if (c === 'mop' || c === 'mopClose') {
      p = base(1.2 + 0.4 * S(t * 2.5), -1.8, PI + 0.3);
      p.spine = [0.35, 0.3 * S(t * 2.5), 0];
      p.shL = [1.0, 0.5, 0.1];
      p.elL = [0.8, 0, 0];
      p.shR = [0.8, 0.5, 0.1];
      p.elR = [0.6, 0, 0];
      p.knL = [0.3, 0, 0];
      p.knR = [0.3, 0, 0];
      p.hipL = [0.25, 0, 0.2];
      p.hipR = [0.25, 0, 0.2];
      props = [{ id: 'mop', part: 'foreR', at: [0, -0.3, 0.05] }];
    } else if (c === 'bugsBed') {
      p = base(-3, -2.4, 0);
      p.ground = false;
      p.pivot = 0.93;
      p.rx = -PI / 2;
      p.y = 0.62 - 0.93;
      p.shL = [2.8, 0, 0.3];
      p.elL = [2.2, 0, 0];
      p.mouth = 0.2;
      bugs.push(roach(-2.7, 0.62, -1.8, 0.4, 0.18, { alive: true }), worm(-3.35, 0.63, -1.6, 1.4, 0.15, { happy: true }), roach(-3.1, 0.64, -1.2, -0.8, 0.14, { alive: true }));
    } else if (c === 'bugsDesk') {
      p = sit(base(4.4, -2.7, PI), 0.5, true);
      p.spine = [0.3, 0, 0];
      bugs.push(roach(4.2, 0.76, -3.3, 0.9, 0.12, { alive: true }), worm(4.7, 0.76, -3.25, -0.4, 0.12, { happy: true, hat: true }));
    } else if (c === 'dinner' || c === 'dinnerClose' || c === 'dinnerWide' || c === 'hug') {
      p = sit(base(0.5, 2.35, PI), 0.5, false);
      const k = frac(b);
      p.shR = [1.2 + 0.2 * S(PI * k), 0.2, 0.2];
      p.elR = [0.6, 0, 0];
      p.shL = [0.8, 0.3, 0.1];
      p.elL = [1.0, 0, 0];
      p.mouth = 0.3 + 0.3 * S(t * 3);
      props = [{ id: 'fork', part: 'foreR', at: [0, -0.32, 0.06] }];
      bugs.push(roach(-0.5, 0.55, 1.5, PI / 2, 0.9, { upright: true, alive: true, hat: c === 'dinnerWide' }), worm(1.55, 0.55, 1.4, -PI / 2, 0.8, { upright: true, happy: true, hat: c === 'dinnerWide' }), roach(0.5, 0.55, 0.55, 0, 0.85, { upright: true, alive: true }));
      if (c === 'hug') {
        p = base(-0.2, 1.4, -PI / 2 - 0.3);
        p.shL = [1.5, 0.9, 0.3];
        p.elL = [1.2, 0, 0];
        p.shR = [1.5, 0.9, 0.3];
        p.elR = [1.2, 0, 0];
        p.spine = [0.1, 0, 0];
        p.neck = [0.1, 0.4, 0.2];
        p.mouth = 0.2;
      }
    } else if (c === 'doorInvite' || c === 'gentlemen' || c === 'gentlemenClose') {
      p = base(-3.2, 2.2, PI / 2);
      const k = S(2 * PI * b);
      p.shR = [1.4, -0.3, 0.9];
      p.elR = [0.9 + 0.5 * k, 0, 0];
      p.shL = [0.4, 0, 0.3];
      p.neck = [0, 0.4, 0];
      p.mouth = voiceAt(t);
      for (let i = 0; i < 4; i++) {
        const bow = c === 'gentlemen' || c === 'gentlemenClose' ? 0.5 * Math.max(0, S(2 * PI * b + i)) : 0;
        if (i % 2) bugs.push(worm(-1.8 + i * 0.9, 0, 2.2 + (i % 2) * 0.3, -PI / 2, 0.8, { upright: true, happy: true, hat: true, bow }));
        else bugs.push(roach(-1.8 + i * 0.9, 0, 2.2 + (i % 2) * 0.3, -PI / 2, 0.85, { upright: true, alive: true, hat: true, bow }));
      }
    } else if (c === 'wormCensor' || c === 'wormDead' || c === 'finalSill' || c === 'bugsSill') {
      p = base(-3.2, 1.8, PI / 2);
      hidden = true;
    }
    cast.push(member('narrator', p, t, { hidden, props, sings: ['doorInvite', 'gentlemen'].includes(c) }));
    return { cast, vehicles: [], bugs };
  }

  function worldGarden(t, b, shot) {
    const c = shot.cam;
    const cast = [];
    const bugs = [];
    const chorus1 = t < 100;
    if (chorus1) bugs.push(roach(0, 0.35, -1.5, 0.5, 2.6, { dead: true, twitch: true }));
    if (t > 120 && t < 160) {
      const limp = c === 'wormLimp';
      bugs.push(worm(0, 0, -1.2, 0.3, 2.4, { dance: !limp, dead: limp, horns: c === 'wormGoat', talk: c === 'wormTalk' }));
    }
    if (c === 'loveGarden' || c === 'loveOrbit') {
      bugs.push(roach(-1.4, 0, -0.6, 0.6, 1.0, { upright: true, alive: true }), worm(1.3, 0, -0.5, -0.6, 0.95, { upright: true, happy: true }));
    }
    if (c === 'parade' || c === 'paradeLow') {
      for (let i = 0; i < 8; i++) {
        const x = -6 + ((t - shot.start) * 1.6 + i * 1.5) % 12;
        if (i % 2) bugs.push(worm(x, 0, 0.5 + (i % 3) * 0.4, PI / 2, 0.7, { upright: true, happy: true, hat: true }));
        else bugs.push(roach(x, 0, 0.5 + (i % 3) * 0.4, PI / 2, 0.75, { upright: true, alive: true, hat: true }));
      }
    }
    if (c === 'swarm' || c === 'swarmTop') {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * PI * 2 + t * (0.9 + (i % 3) * 0.3);
        const r = 2 + (i % 4) * 0.6;
        const pos = [C(a) * r, 0, S(a) * r - 1];
        if (i % 2) bugs.push(worm(pos[0], 0, pos[2], -a, 0.7, { dance: true }));
        else bugs.push(roach(pos[0], 0, pos[2], -a + PI / 2, 0.8, { alive: true }));
      }
    }
    if (['singerSand', 'flowerGiant', 'loveGarden', 'loveOrbit', 'swarm', 'swarmTop'].includes(c)) {
      const p = base(0, 1.6, 0);
      if (c === 'singerSand') {
        p.knL = [1.8, 0, 0];
        p.knR = [1.8, 0, 0];
        p.hipL = [0.3, 0, 0.2];
        p.hipR = [0.3, 0, 0.2];
        p.spine = [-0.3, 0, 0];
        p.neck = [-0.6, 0, 0];
        p.shL = [0.6, 0, 1.3];
        p.shR = [0.6, 0, 1.3];
        p.mouth = 1;
      } else if (c === 'flowerGiant') {
        p.z = 2.2;
        p.ry = PI;
        p.shL = [0.4, 0, 1.4];
        p.shR = [0.4, 0, 1.4];
        p.neck = [-0.5, 0, 0];
      } else if (c === 'swarm' || c === 'swarmTop') {
        p.z = -1;
        p.shL = [2.7, 0, 0.9];
        p.shR = [2.7, 0, 0.9];
        p.rz = 0.2 * S(t * 5);
        p.neck = [-0.4, 0.3 * S(t * 3), 0];
      } else {
        p.z = -0.2;
        bounce(p, b, 0.4);
        p.shL = [1.2, 0.9, 0.4];
        p.shR = [1.2, 0.9, 0.4];
      }
      cast.push(member('singer', p, t, { sings: true }));
    }
    return { cast, vehicles: [], bugs };
  }

  function worldBath(t, b, shot) {
    const c = shot.cam;
    const cast = [];
    const bugs = [];
    if (c === 'toiletRow' || c === 'toiletRowClose') {
      const p = sit(base(8, -2.25, 0), 0.47, false);
      p.shL = [1.0, 0.45, 0.1];
      p.elL = [0.9, 0, 0];
      p.shR = [1.0, 0.45, 0.1];
      p.elR = [0.9, 0, 0];
      cast.push(member('narrator', p, t, { sings: true }));
      bugs.push(roach(9.4, 0.47, -2.3, 0, 0.55, { upright: true, alive: true }), worm(10.8, 0.47, -2.3, 0, 0.5, { upright: true, happy: true }), roach(12.2, 0.47, -2.3, 0, 0.5, { upright: true, alive: true }));
      return { cast, vehicles: [], bugs };
    }
    const p = base(0, -1.55, PI);
    p.spine = [0.75, 0, 0];
    p.neck = [0.3, 0, 0];
    p.knL = [0.3, 0, 0];
    p.knR = [0.3, 0, 0];
    p.hipL = [0.2, 0, 0.2];
    p.hipR = [0.2, 0, 0.2];
    p.shR = [1.5, 0.2, 0.2];
    p.elR = [0.6, 0, 0];
    p.shL = [0.9, 0.3, 0.2];
    p.elL = [0.6, 0, 0];
    if (c === 'talk') {
      p.mouth = voiceAt(t);
      p.shR = [0.8, 0.4, 0.3];
      p.elR = [1.2 + 0.3 * S(t * 5), 0, 0];
    }
    cast.push(member('narrator', p, t, { hidden: c === 'flushMacro' }));
    if (c !== 'talk') bugs.push(worm(0, 0.36, -2.45, t * 6, 0.05, { dead: true, swirl: t - shot.start }));
    return { cast, vehicles: [], bugs };
  }

  function worldSchool(t, b, shot) {
    const p = narratorWalk(base(1.6, 1.5 - 1.1 * (t - shot.start), PI), b);
    p.shL = [0.4, 0.3, 0.2];
    p.shR = [0.2, 0, 0.12];
    const cast = [member('narrator', p, t, { props: [{ id: 'backpack', part: 'torso', at: [0, 0.3, -0.2] }] })];
    const z = 1.5 - 1.1 * (t - shot.start);
    const bugs = [
      roach(2.5, 0, z + 0.3, PI + 0.2 * S(t * 3), 0.8, { upright: true, alive: true, walk: true }),
      worm(0.7, 0, z + 0.2, PI, 0.75, { upright: true, happy: true, walk: true })
    ];
    return { cast, vehicles: [], bugs };
  }

  const BURSTS = {
    gokiburi: { bg: [0.02, 0.02, 0.02], a: [0.75, 0.04, 0.04], b: [0.02, 0.02, 0.02], text: 'ゴキブリ', textSize: 58 },
    gokiburi2: { bg: [0.7, 0.02, 0.04], a: [0.02, 0.02, 0.02], b: [0.95, 0.9, 0.85], text: 'ゴキブリ', textSize: 58, lines: true },
    gokiburi3: { bg: [0.95, 0.92, 0.88], a: [0.6, 0.02, 0.04], b: [0.02, 0.02, 0.02], text: 'ゴキブリ', textSize: 58, textColor: '#c01818', lines: true },
    shi: { bg: [0.95, 0.94, 0.9], a: [0.02, 0.02, 0.02], b: [0.7, 0.02, 0.04], text: '死', textSize: 110, textColor: '#101010' },
    shi2: { bg: [0.02, 0.02, 0.02], a: [0.95, 0.95, 0.95], b: [0.02, 0.02, 0.02], text: '死', textSize: 110 },
    shi3: { bg: [0.7, 0.02, 0.04], a: [0.02, 0.02, 0.02], b: [0.7, 0.02, 0.04], text: '死', textSize: 110 },
    censor: { bg: [0.02, 0.02, 0.02], a: [0.3, 0.3, 0.32], b: [0.02, 0.02, 0.02], text: 'ЦЕНЗУРА', textSize: 40 },
    mimizu: { bg: [0.5, 0.02, 0.1], a: [0.95, 0.5, 0.6], b: [0.02, 0.02, 0.02], text: 'ミミズ', textSize: 64, lines: true },
    mimizu2: { bg: [0.02, 0.02, 0.02], a: [0.95, 0.5, 0.6], b: [0.5, 0.02, 0.1], text: 'ミミズ', textSize: 64, lines: true },
    baka: { bg: [0.95, 0.85, 0.2], a: [0.02, 0.02, 0.02], b: [0.7, 0.02, 0.04], text: 'バカ', textSize: 80, textColor: '#e01818' }
  };

  function worldBurst(t, b, shot) {
    const p = singAtMic(base(0, 0, 0), b, true);
    p.shL = [2.6, 0.2, 0.9];
    p.shR = [2.6, 0.2, 0.9];
    p.elL = [0.3, 0, 0];
    p.elR = [0.3, 0, 0];
    return { cast: [Object.assign(member('singer', p, t), { silhouette: true })], vehicles: [], bugs: [] };
  }

  const WORLDS = { ident: worldIdent, hangar: band, room: worldRoom, garden: worldGarden, bath: worldBath, street: worldSchool, burst: worldBurst };

  const sill = (dx, dy, dz) => [SILL.x + dx, SILL.y + dy, SILL.z + dz];

  const CAMS = {
    ident: {
      logo: (t, u) => frame([0, 0, 4.2 - 0.8 * u], [0, 0, 0], 40, t, 0),
      endcard: (t, u) => frame([0, 0.4, 5 + u], [0, 0, 0], 42, t, 0)
    },
    hangar: {
      singerBack: (t, u, F) => frame([0.3, 1.7, -1.4 + 0.4 * u], V3.add(F.singer.head, [0, -0.1, 0]), 60, t, 0.4),
      bandHit: (t, u) => frame([4 - 2 * u, 2.2, 6.5], [0, 1.3, -1], 64, t, 2.2),
      faceFish: (t, u, F) => frame(V3.add(head(F, 'singer', 0), [0.12 * S(t), 0.1, 0.38]), head(F, 'singer', -0.02), 82, t, 1.6),
      faceFish2: (t, u, F) => frame(V3.add(head(F, 'singer', 0), [-0.3, -0.12, 0.3]), head(F, 'singer', 0), 84, t, 1.8),
      faceScream: (t, u, F) => frame(V3.add(head(F, 'singer', 0), [0.05, 0.35, 0.3]), head(F, 'singer', -0.05), 86, t, 2.4),
      gtrA: (t, u, F) => frame(V3.add(F.gtrA.hips, [1.2, 0.7, 1.4]), V3.add(F.gtrA.hips, [0, 0.4, 0]), 62, t, 1.4),
      gtrB: (t, u, F) => frame(V3.add(F.gtrB.hips, [-1.1, 0.4, 1.3]), V3.add(F.gtrB.hips, [0, 0.5, 0]), 62, t, 1.4),
      bass: (t, u, F) => frame(V3.add(F.bassist.hips, [0.9, 0.2, 1.5]), V3.add(F.bassist.hips, [0, 0.4, 0]), 62, t, 1.4),
      drums: (t, u, F) => frame([1.4, 2.4, -1.8], V3.add(F.drummer.hips, [0, 0.2, 0]), 66, t, 1.6),
      bandWide: (t, u) => { const a = -0.5 + u; return frame([S(a) * 7, 2.6, C(a) * 7], [0, 1.2, -1], 56, t, 0.8); },
      soloA: (t, u, F) => frame(V3.add(F.gtrA.hips, [0.6, -0.4, 0.9]), V3.add(F.gtrA.hips, [0, 0.6, 0]), 78, t, 2),
      soloB: (t, u, F) => frame(V3.add(F.gtrB.hips, [-0.5, 1.4, 0.8]), V3.add(F.gtrB.hips, [0, 0.2, 0]), 78, t, 2),
      chaos: (t, u, F) => frame(V3.add(head(F, 'singer', 0), [0.8 * S(t * 3), 0.2 + 0.3 * S(t * 5), 0.9]), head(F, 'singer', 0), 88, t, 3.5)
    },
    room: {
      dawnWide: (t, u) => frame([-2.4 + 0.6 * u, 1.9, 3.2], [1.5, 1.1, -3.5], 58, t, 0.3),
      flowerMacro: (t, u) => frame(sill(-0.3 + 0.1 * u, 0.18, 0.55 - 0.1 * u), [POT[0], POT[1] + 0.25, POT[2]], 40, t, 0.15),
      doorOpen: (t, u, F) => frame([0.5, 1.5, 3.5], V3.add(F.narrator.hips, [0, 0.6, 0]), 56, t, 0.6),
      walkIn: (t, u, F) => frame([-2.8, 1.6, 3], V3.add(F.narrator.head, [0, -0.1, 0]), 50, t, 0.6),
      windowLook: (t, u, F) => frame([0.6, 1.9, -1.7], V3.add(F.narrator.head, [0.3, -0.4, -0.6]), 58, t, 0.4),
      sillMacro: (t, u, F) => frame(sill(-0.1, 0.09, 0.32), sill(0.1, 0.02, 0), 48, t, 0.2),
      roachMacro: (t, u) => frame(sill(0.2, 0.05, 0.14), sill(0.12, 0.02, 0.02), 44, t, 0.1),
      stare: (t, u, F) => frame(V3.add(head(F, 'narrator', 0), [0.05, -0.05, -0.32]), head(F, 'narrator', 0), 80, t, 0.6),
      slipperRaise: (t, u, F) => frame(sill(-0.2, 0.05, 0.45), V3.add(F.narrator.head, [0, 0.35, 0]), 74, t, 0.8),
      slam: (t, u) => frame(sill(0.35, 0.12, 0.35), sill(0.1, 0, 0), 60, t, 2.6),
      splatMacro: (t, u) => frame(sill(0.12, 0.2 - 0.05 * u, 0.2), sill(0.12, 0, 0.02), 50, t, 0.3),
      smear: (t, u, F) => frame(V3.add(F.narrator.hips, [0.8, -0.4, 1.0]), V3.add(F.narrator.hips, [0, -0.8, -0.2]), 62, t, 0.8),
      smearWide: (t, u) => frame([3.4, 2.2, 0.5], [1.4, 0.2, -2.3], 58, t, 0.6),
      mop: (t, u) => frame([-1.2, 2.0, 1.2], [1.3, 0.4, -2.0], 58, t, 0.5),
      mopClose: (t, u, F) => frame(V3.add(F.narrator.hips, [-0.6, 0.3, 1.2]), V3.add(F.narrator.hips, [0.2, -0.5, -0.8]), 62, t, 0.6),
      wormDrunk: (t, u) => frame(sill(0.3, 0.06, 0.2), sill(0.14, 0.03, 0.03), 44, t, 0.4),
      wormCensor: (t, u) => frame(sill(0.05, 0.08, 0.28), sill(0.14, 0.03, 0.03), 46, t, 0.6),
      slipperSwing: (t, u, F) => frame(sill(-0.3, 0.1, 0.45), V3.add(F.narrator.head, [0, 0.3, 0]), 72, t, 1.2),
      wormDead: (t, u) => frame(sill(0.14, 0.2, 0.12), sill(0.14, 0, 0.03), 46, t, 0.2),
      bugsSill: (t, u) => frame(sill(0.1, 0.15, 0.55 - 0.15 * u), sill(0.1, 0.05, 0), 44, t, 0.2),
      bugsBed: (t, u) => frame([-1.6, 1.4, -0.4], [-3, 0.6, -1.9], 56, t, 0.4),
      bugsDesk: (t, u) => frame([3.7, 1.25, -2.2], [4.45, 0.85, -3.3], 52, t, 0.4),
      dinner: (t, u) => frame([2.4, 1.6, 3.4], [0.5, 0.9, 1.5], 56, t, 0.4),
      dinnerClose: (t, u, F) => frame(V3.add(F.narrator.head, [0.3, 0.05, -1.1]), head(F, 'narrator', -0.05), 50, t, 0.5),
      dinnerWide: (t, u) => { const a = 0.6 + 0.6 * u; return frame([0.5 + S(a) * 3.4, 2.2, 1.5 + C(a) * 3.4], [0.5, 0.8, 1.5], 56, t, 0.4); },
      hug: (t, u, F) => frame(V3.add(F.narrator.hips, [1.4, 0.8, 1.2]), V3.add(F.narrator.hips, [-0.5, 0.6, 0]), 54, t, 0.5),
      doorInvite: (t, u, F) => frame([-1.4, 1.5, 3.8], V3.add(F.narrator.head, [0, -0.2, 0]), 56, t, 0.5),
      gentlemen: (t, u) => frame([1.8, 1.2, 4.2], [-0.5, 0.8, 2.2], 58, t, 0.5),
      gentlemenClose: (t, u) => frame([-0.6, 1.0, 3.6], [-0.9, 0.9, 2.3], 50, t, 0.5),
      finalSill: (t, u) => frame(sill(-0.05, 0.12 + 0.1 * u, 0.5 + 0.4 * u), sill(0.1, 0.05, 0), 42, t, 0.15)
    },
    garden: {
      deadGiant: (t, u) => frame([5 - 1.5 * u, 2.4, 5], [0, 0.6, -1.5], 58, t, 0.6),
      flowerGiant: (t, u) => frame([0.6, 0.5, 5.2], [0, 3.2, -5], 70, t, 0.8),
      deadClose: (t, u) => frame([1.6, 1.2, 0.4], [0, 0.8, -1.5], 56, t, 1.2),
      singerSand: (t, u, F) => { const a = t * 0.6; return frame(V3.add(F.singer.hips, [S(a) * 2.2, 0.8, C(a) * 2.2]), V3.add(F.singer.hips, [0, 0.4, 0]), 60, t, 1); },
      deadTop: (t, u) => frame([0.01, 8 - 2 * u, 0.5], [0, 0, -1.5], 60, t, 0.4, [0, 0, -1]),
      wormGiant: (t, u) => frame([3.5, 1.8, 3.5], [0, 1, -1.2], 58, t, 0.8),
      wormOrbit: (t, u) => { const a = t * 0.8; return frame([S(a) * 4.5, 1.6, -1.2 + C(a) * 4.5], [0, 1.2, -1.2], 58, t, 0.8); },
      wormLow: (t, u) => frame([0.6, 0.2, 2.4], [0, 2, -1.2], 76, t, 1),
      wormLimp: (t, u) => frame([2.2, 3, 1.6], [0, 0.3, -1.2], 56, t, 0.4),
      wormGoat: (t, u) => frame([0.5, 2.2, 1.6], [0, 1.9, -1.2], 56, t, 0.8),
      wormTalk: (t, u) => frame([-0.8, 2.1, 1.4], [0, 2, -1.2], 54, t, 0.6),
      loveGarden: (t, u) => frame([0.3, 1.6, 4.4 - 0.6 * u], [0, 1.1, -0.4], 56, t, 0.4),
      loveOrbit: (t, u) => { const a = 0.4 + t * 0.4; return frame([S(a) * 4, 2, -0.3 + C(a) * 4], [0, 1, -0.4], 56, t, 0.5); },
      parade: (t, u) => frame([0, 1.6, 6], [0, 0.8, 0.8], 60, t, 0.5),
      paradeLow: (t, u) => frame([-3, 0.25, 3], [0, 0.8, 0.8], 70, t, 0.8),
      swarm: (t, u, F) => frame(V3.add(F.singer.hips, [2.5 * S(t), 1.2, 3.2]), V3.add(F.singer.hips, [0, 0.8, 0]), 70, t, 2),
      swarmTop: (t, u) => frame([0.01, 9, -0.5], [0, 0, -1], 64, t, 1.2, [0, 0, -1])
    },
    bath: {
      flush: (t, u, F) => frame([0.45, 1.9, 0.1], [0, 0.45, -2.4], 58, t, 0.6),
      flushMacro: (t, u) => frame([0.02, 0.95, -2.2], [0, 0.35, -2.45], 58, t, 0.3, [0, 0, -1]),
      talk: (t, u, F) => frame([-0.55, 1.5, 0.15], V3.add(F.narrator.head, [0, -0.1, 0]), 60, t, 0.6),
      toiletRow: (t, u) => frame([10.1, 1.6, 2.6], [10.1, 0.9, -2.2], 62, t, 0.4),
      toiletRowClose: (t, u) => { const x = 8 + 4.2 * u; return frame([x, 1.2, 0.3], [x, 1.0, -2.2], 52, t, 0.4); }
    },
    street: {
      walk: (t, u, F) => frame([1.2, 1.7, F.narrator.hips[2] + 3.6], V3.add(F.narrator.hips, [1.2, 0.9, -4]), 58, t, 0.8),
      walkSide: (t, u, F) => frame([5, 1.2, F.narrator.hips[2] - 0.5], V3.add(F.narrator.hips, [0, 0.4, 0]), 58, t, 0.8)
    },
    burst: Object.fromEntries(Object.keys(BURSTS).map(k => [k, (t, u) => frame([0, 1.3, 3.8 - 0.6 * u], [0, 1.2, 0], 52, t, 2)]))
  };

  function bugFocus(bug, i) {
    const s = bug.scale;
    const up = bug.upright ? 1.0 * s : 0.15 * s;
    return { head: V3.add(bug.pos, [0, up, 0]), hips: bug.pos };
  }

  function stage(t, shot) {
    const b = beatAt(t);
    const world = WORLDS[shot.scene](t, b, shot);
    const focus = { vehicles: world.vehicles };
    world.cast.forEach(a => { focus[a.id] = K.solveFocus(LOOKS[a.look], a.pose); });
    (world.bugs || []).forEach((bug, i) => { focus['bug' + i] = bugFocus(bug, i); });
    const u = clamp((t - shot.start) / Math.max(0.01, shot.end - shot.start), 0, 1);
    const camera = CAMS[shot.scene][shot.cam](t, u, focus);
    const flick = 1 + 0.06 * (hash(Math.floor(t * 12)) - 0.5);
    const g = shot.grade || [1, 1, 1, 0];
    camera.grade = [g[0] * flick, g[1] * flick, g[2] * flick, g[3]];
    if (shot.strobe && frac(b * 4) < 0.16) camera.grade = hash(Math.floor(b * 4)) < 0.5 ? [2.4, 2.4, 2.4, 1] : [2.2, 0.35, 0.35, 0.3];
    camera.fx = { grain: shot.scene === 'ident' ? 0.05 : 0.13, vignette: 1.1, time: frac(t * 7.3) };
    return { cast: world.cast, vehicles: world.vehicles, bugs: world.bugs || [], focus, camera, beat: b, shot };
  }

  function buildHangar(r) {
    const room = new Builder();
    const concrete = [0.5, 0.52, 0.55, 0];
    room.quad([-14, 0, 12], [14, 0, 12], [14, 0, -10], [-14, 0, -10], [0.42, 0.44, 0.47, 0], [[0, 0], [14, 0], [14, 11], [0, 11]]);
    room.quad([-14, 0, -10], [14, 0, -10], [14, 8, -10], [-14, 8, -10], concrete, [[0, 0], [14, 0], [14, 4], [0, 4]]);
    room.quad([-14, 0, 12], [-14, 0, -10], [-14, 8, -10], [-14, 8, 12], shade(concrete, 0.9), [[0, 0], [11, 0], [11, 4], [0, 4]]);
    room.quad([14, 0, -10], [14, 0, 12], [14, 8, 12], [14, 8, -10], shade(concrete, 0.9), [[0, 0], [11, 0], [11, 4], [0, 4]]);
    for (let x = -12; x <= 12; x += 6) room.at(x, 4, -9.4, (p) => p.box(1, 8, 1, shade(concrete, 0.85)));
    const rigs = new Builder();
    for (let z = -9; z <= 10; z += 4) rigs.at(0, 7.6, z, (b) => b.box(28, 0.4, 0.3, [0.2, 0.2, 0.22, 0]));
    rigs.at(0, 0, -3.9, (d) => {
      d.box(4, 0.4, 3, [0.12, 0.12, 0.14, 0], { base: true });
      d.at(0, 0.62, 0.8, (k) => k.push(M4.rotX(PI / 2)).prism(14, 0.32, 0.32, -0.25, 0.32, 0.32, 0.25, [0.5, 0.05, 0.08, 0], { capBottom: true }).pop());
      [[-0.5, 1.0, 0.6], [0.5, 1.0, 0.6], [0.9, 0.75, 0.2]].forEach(([x, y, z]) => d.at(x, y, z, (tm) => tm.prism(12, 0.17, 0.17, -0.1, 0.17, 0.17, 0.1, [0.5, 0.05, 0.08, 0], { capBottom: true })));
      [[-1.1, 1.5, 0.7], [1.2, 1.6, 0.6], [0.2, 1.8, -0.2]].forEach(([x, y, z]) => {
        d.at(x, 0.4, z, (s) => s.prism(6, 0.015, 0.015, 0, 0.015, 0.015, y - 0.4, [0.6, 0.6, 0.62, 0]));
        d.at(x, y, z, (cy) => cy.prism(14, 0.35, 0.35, 0, 0.3, 0.3, 0.015, [0.85, 0.7, 0.3, 0.15]));
      });
      d.at(0, 0.4, -0.5, (st) => st.prism(8, 0.18, 0.18, 0, 0.16, 0.16, 0.55, [0.08, 0.08, 0.09, 0]));
    });
    [[-4.2, 0.9], [4.2, 0.9], [-4.2, -2], [4.2, -2]].forEach(([x, z]) => rigs.at(x, 0, z, (a) => { a.box(1.1, 1.3, 0.7, [0.1, 0.1, 0.11, 0], { base: true }); a.at(0, 0.65, 0.36, (g) => g.box(0.9, 1.0, 0.01, [0.22, 0.22, 0.24, 0])); }));
    rigs.at(0, 0, 1.35, (m) => {
      m.prism(10, 0.14, 0.14, 0, 0.12, 0.12, 0.03, [0.15, 0.15, 0.17, 0]);
      m.prism(6, 0.012, 0.012, 0.03, 0.012, 0.012, 1.55, [0.6, 0.6, 0.64, 0]);
      m.at(0, 1.6, 0, (h) => h.ellipsoid(0.03, 0.06, 0.03, 8, 5, [0.3, 0.3, 0.33, 0.1]));
    });
    [[-3, 2], [2.5, 3], [0.5, -0.5], [-1, 5], [4, 6]].forEach(([x, z]) => rigs.quad([x - 1.2, 0.005, z + 0.8], [x + 1.2, 0.005, z + 0.8], [x + 1.2, 0.005, z - 0.8], [x - 1.2, 0.005, z - 0.8], [0.55, 0.62, 0.72, 0.35]));
    const bulbs = new Builder();
    [[0, 3.2, 1.0], [-2.6, 3.6, 0.2], [2.6, 3.6, 0.2], [0, 4.2, -3.9], [-1.4, 3.8, -1.6]].forEach(([x, y, z]) => {
      bulbs.at(x, y, z, (b) => b.ellipsoid(0.07, 0.09, 0.07, 6, 4, [1, 0.85, 0.6, 1]));
      bulbs.at(x, (y + 7.6) / 2, z, (b) => b.box(0.01, 7.6 - y, 0.01, [0.1, 0.1, 0.1, 0]));
    });
    const cones = new Builder();
    [[-2.6, 0.2], [2.6, 0.2], [0, 1.0], [0, -3.9]].forEach(([x, z]) => cones.push(M4.translate(x, 7.5, z), M4.rotX(PI)).prism(10, 0.3, 0.3, 0, 1.3, 1.3, 7.5, [0.7, 0.85, 1, 1], { topColor: [0.02, 0.02, 0.03, 1], capTop: false, flat: true }).pop());
    const concreteTex = r.texture(128, texNoise('#9a9ea4', 61, 0.35));
    return {
      env: {
        sunDir: V3.norm([0.25, -0.8, -0.5]),
        sunColor: [0.55, 0.6, 0.7],
        ambTop: [0.3, 0.34, 0.4],
        ambBottom: [0.1, 0.11, 0.13],
        fogColor: [0.1, 0.12, 0.15],
        fogNear: 6,
        fogFar: 30,
        points: [{ pos: [0, 3.0, 1.2], color: [1.3, 1.0, 0.7] }, { pos: [0, 3.5, -3.6], color: [0.6, 0.75, 1.0] }]
      },
      layers: [{ mesh: r.mesh(room), texture: concreteTex }, { mesh: r.mesh(rigs) }, { mesh: r.mesh(bulbs) }],
      glows: [{ mesh: r.mesh(cones), opts: { additive: true, alpha: 0.12 } }],
      shadows: 'blob'
    };
  }

  function buildRoom(r) {
    const room = new Builder();
    const wall = [0.62, 0.55, 0.46, 0];
    room.quad([-4, 0, -4], [6, 0, -4], [6, 3, -4], [-4, 3, -4], wall);
    room.quad([-4, 0, 4], [-4, 0, -4], [-4, 3, -4], [-4, 3, 4], shade(wall, 0.9));
    room.quad([6, 0, -4], [6, 0, 4], [6, 3, 4], [6, 3, -4], shade(wall, 0.92));
    room.at(-3.97, 1.02, 2.2, (d) => d.box(0.06, 2.04, 0.95, [0.35, 0.22, 0.14, 0]));
    room.at(-3.9, 1.0, 2.55, (d) => d.box(0.05, 0.06, 0.06, [0.8, 0.7, 0.3, 0.2]));
    room.at(SILL.x, SILL.y - 0.03, SILL.z + 0.05, (s) => s.box(1.9, 0.05, 0.36, [0.85, 0.82, 0.76, 0]));
    room.at(SILL.x, 1.65, -3.97, (w) => { w.box(1.9, 1.35, 0.05, [0.8, 0.78, 0.72, 0]); });
    [-0.8, 0.8].forEach(dx => room.at(SILL.x + dx, 1.7, -3.85, (cu) => cu.box(0.4, 1.5, 0.05, [0.92, 0.88, 0.8, 0.15])));
    room.at(POT[0], POT[1], POT[2], (p) => {
      p.prism(8, 0.05, 0.05, 0, 0.07, 0.07, 0.12, [0.7, 0.35, 0.2, 0], { capBottom: true });
      p.at(0, 0.115, 0, (soil) => soil.disc(0.065, 8, [0.2, 0.12, 0.08, 0], 0));
      p.prism(5, 0.006, 0.006, 0.12, 0.005, 0.005, 0.34, [0.2, 0.5, 0.2, 0]);
      [0.2, -0.6].forEach((a, i) => p.push(M4.translate(0, 0.2 + i * 0.05, 0), M4.rotY(a), M4.rotZ(0.9)).box(0.09, 0.005, 0.035, [0.25, 0.55, 0.22, 0]).pop());
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * PI * 2;
        p.push(M4.translate(C(a) * 0.03, 0.35, S(a) * 0.03), M4.rotY(-a), M4.rotZ(0.5));
        p.ellipsoid(0.04, 0.012, 0.025, 6, 3, [0.85, 0.05, 0.08, 0.2]);
        p.pop();
      }
      p.at(0, 0.355, 0, (cn) => cn.ellipsoid(0.018, 0.015, 0.018, 6, 3, [0.95, 0.8, 0.2, 0.2]));
    });
    room.at(-3, 0, -2.5, (bd) => {
      bd.box(1.2, 0.36, 2.1, [0.25, 0.18, 0.14, 0], { base: true });
      bd.at(0, 0.36, 0, (m) => m.box(1.1, 0.2, 2.0, [0.55, 0.5, 0.48, 0], { base: true }));
      bd.at(0, 0.6, -0.8, (m) => m.box(0.7, 0.12, 0.3, [0.75, 0.72, 0.68, 0]));
    });
    room.at(4.4, 0, -3.3, (dk) => {
      dk.at(0, 0.73, 0, (tp) => tp.box(1.5, 0.05, 0.7, [0.3, 0.22, 0.16, 0]));
      [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]].forEach(([x, z]) => dk.at(x, 0.36, z, (l) => l.box(0.05, 0.72, 0.05, [0.2, 0.15, 0.1, 0])));
      dk.at(-0.3, 0.98, -0.1, (tv) => tv.box(0.55, 0.45, 0.45, [0.2, 0.2, 0.22, 0]));
    });
    room.at(0.5, 0, 1.5, (tb) => {
      tb.at(0, 0.73, 0, (tp) => tp.box(1.6, 0.05, 1.1, [0.78, 0.74, 0.66, 0]));
      [[-0.7, -0.45], [0.7, -0.45], [-0.7, 0.45], [0.7, 0.45]].forEach(([x, z]) => tb.at(x, 0.36, z, (l) => l.box(0.05, 0.72, 0.05, [0.25, 0.18, 0.12, 0])));
      [[-0.45, 0], [0.45, -0.1], [0, -0.35], [0, 0.4]].forEach(([x, z]) => tb.at(x, 0.76, z, (pl) => pl.prism(12, 0.12, 0.12, 0, 0.12, 0.12, 0.01, [0.92, 0.92, 0.9, 0.05])));
      [[-0.2, 0.1], [0.25, 0.2]].forEach(([x, z]) => tb.at(x, 0.76, z, (cd) => { cd.prism(6, 0.015, 0.015, 0, 0.015, 0.015, 0.22, [0.9, 0.88, 0.8, 0]); cd.at(0, 0.25, 0, (fl) => fl.box(0.02, 0.05, 0.02, [1, 0.75, 0.3, 1])); }));
    });
    [[0.5, 2.35], [-0.5, 1.5], [1.55, 1.4], [0.5, 0.55]].forEach(([x, z]) => room.at(x, 0, z, (ch) => { ch.box(0.45, 0.45, 0.45, [0.3, 0.2, 0.14, 0], { base: true, faces: { top: [0.35, 0.24, 0.16, 0] } }); }));
    const floor = new Builder();
    floor.quad([-4, 0, 4], [6, 0, 4], [6, 0, -4], [-4, 0, -4], [0.72, 0.52, 0.34, 0], [[0, 0], [4, 0], [4, 3.2], [0, 3.2]]);
    const pane = new Builder();
    pane.quad([SILL.x - 0.85, 1.05, -3.93], [SILL.x + 0.85, 1.05, -3.93], [SILL.x + 0.85, 2.25, -3.93], [SILL.x - 0.85, 2.25, -3.93], [[1, 0.9, 0.7, 1], [1, 0.9, 0.7, 1], [0.95, 0.95, 0.9, 1], [0.95, 0.95, 0.9, 1]]);
    pane.at(SILL.x, 1.65, -3.92, (f) => { f.box(0.05, 1.25, 0.03, [0.3, 0.26, 0.22, 0]); f.box(1.72, 0.05, 0.03, [0.3, 0.26, 0.22, 0]); });
    const tvFace = new Builder();
    tvFace.quad([4.35, 0.8, -3.07], [3.87, 0.8, -3.07], [3.87, 1.16, -3.07], [4.35, 1.16, -3.07], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const smear = new Builder();
    const rr = rand(12);
    for (let i = 0; i < 18; i++) {
      const a = rr() * PI * 2, d = rr() * 0.9;
      smear.at(1.3 + C(a) * d, 0.004, -2.4 + S(a) * d * 0.6, (s) => s.ellipsoid(0.08 + rr() * 0.15, 0.002, 0.04 + rr() * 0.06, 6, 2, [0.35, 0.4, 0.1, 0.15]));
    }
    const bucket = new Builder();
    bucket.at(2.2, 0, -1.4, (b) => { b.prism(10, 0.14, 0.14, 0, 0.17, 0.17, 0.3, [0.3, 0.45, 0.75, 0], { capBottom: true, capTop: false }); b.at(0, 0.27, 0, (w) => w.disc(0.16, 10, [0.45, 0.5, 0.4, 0.2], 0)); });
    const meshes = { pane: r.mesh(pane), tv: r.mesh(tvFace), smear: r.mesh(smear), bucket: r.mesh(bucket) };
    const woodTex = r.texture(128, texNoise('#a07a52', 4, 0.25));
    const tvTex = r.texture(64, texNoise('#7a7a7a', 8, 0.9));
    const env = {
      sunDir: V3.norm([0.2, -0.5, 0.85]),
      sunColor: [1.0, 0.85, 0.6],
      ambTop: [0.45, 0.38, 0.32],
      ambBottom: [0.18, 0.14, 0.12],
      fogColor: [0.25, 0.2, 0.16],
      fogNear: 8,
      fogFar: 26,
      points: [{ pos: [SILL.x, 1.6, -3.2], color: [1.2, 1.0, 0.7] }, { pos: [0.5, 1.4, 1.5], color: [0.9, 0.6, 0.35] }]
    };
    return {
      env,
      layers: [{ mesh: r.mesh(room) }, { mesh: r.mesh(floor), texture: woodTex }],
      draw(rr2, t) {
        rr2.draw(meshes.pane, null, { noFog: true });
        rr2.draw(meshes.tv, null, { texture: tvTex, uvScroll: [Math.floor(t * 18) * 0.37, Math.floor(t * 18) * 0.61] });
        if (t >= 39 && t < 62.2) rr2.draw(meshes.smear, null);
        if (t >= 52 && t < 66) rr2.draw(meshes.bucket, null);
      },
      shadows: 'blob'
    };
  }

  function texRipples(ctx, w, h) {
    ctx.fillStyle = '#ece6d8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(120,110,95,0.55)';
    ctx.lineWidth = 3;
    for (let y = 4; y < h; y += 12) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) ctx.lineTo(x, y + 2.5 * S((x / w) * PI * 4));
      ctx.stroke();
    }
  }

  function buildGarden(r) {
    const ground = new Builder();
    const tile = 4;
    for (let x = -28; x < 28; x += tile) {
      for (let z = -28; z < 28; z += tile) {
        ground.quad([x, 0, z + tile], [x + tile, 0, z + tile], [x + tile, 0, z], [x, 0, z], [1, 1, 1, 0], [[x / 4, (z + tile) / 4], [(x + tile) / 4, (z + tile) / 4], [(x + tile) / 4, z / 4], [x / 4, z / 4]]);
      }
    }
    const stones = new Builder();
    [[-4, -3, 1.2], [3.5, -4.5, 0.9], [-2.5, 3, 0.7], [4.5, 2, 1.1], [-6, 0.5, 0.8], [1.5, -8, 1.4]].forEach(([x, z, s]) => {
      stones.at(x, 0, z, (b) => b.ellipsoid(s, s * 0.45, s * 0.9, 9, 5, [0.1, 0.1, 0.11, 0]));
      for (let k = 1; k <= 3; k++) stones.at(x, 0.004, z, (b) => b.prism(24, s * (1 + k * 0.45), s * (0.9 + k * 0.45), 0, s * (1 + k * 0.45) + 0.05, s * (0.9 + k * 0.45) + 0.05, 0.005, [0.6, 0.56, 0.5, 0], { capTop: false }));
    });
    const flower = new Builder();
    flower.at(0, 0, -6, (f) => {
      f.prism(6, 0.14, 0.14, 0, 0.1, 0.1, 5.2, [0.18, 0.42, 0.16, 0]);
      [[1.6, 0.5], [2.6, -0.8]].forEach(([y, a]) => f.push(M4.translate(0, y, 0), M4.rotY(a), M4.rotZ(0.8)).ellipsoid(1.0, 0.05, 0.35, 8, 3, [0.2, 0.5, 0.18, 0]).pop());
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * PI * 2;
        f.push(M4.translate(C(a) * 0.6, 5.2, S(a) * 0.6), M4.rotY(-a), M4.rotZ(0.45));
        f.ellipsoid(1.1, 0.12, 0.6, 8, 4, [0.85, 0.03, 0.06, 0.25]);
        f.pop();
      }
      f.at(0, 5.3, 0, (c) => c.ellipsoid(0.45, 0.3, 0.45, 8, 4, [0.95, 0.75, 0.15, 0.3]));
    });
    const sandTex = r.texture(128, texRipples);
    return {
      env: {
        sunDir: V3.norm([0.35, -0.7, -0.45]),
        sunColor: [1.2, 0.95, 0.7],
        ambTop: [0.5, 0.45, 0.42],
        ambBottom: [0.3, 0.26, 0.22],
        fogColor: [0.06, 0.02, 0.02],
        fogNear: 14,
        fogFar: 42
      },
      layers: [{ mesh: r.mesh(ground), texture: sandTex }, { mesh: r.mesh(stones) }, { mesh: r.mesh(flower) }],
      shadows: 'blob'
    };
  }

  function bathBuilder(r) {
    return VK.buildBath(r);
  }

  const PROP_MAKERS = {
    guitarWhite: (r) => guitarProp(r, [0.92, 0.92, 0.94, 0.05], false),
    guitarRed: (r) => guitarProp(r, [0.7, 0.04, 0.06, 0.05], false),
    bassBlack: (r) => guitarProp(r, [0.08, 0.08, 0.09, 0.05], true),
    slipper(r) {
      const b = new Builder();
      b.box(0.11, 0.025, 0.28, [0.55, 0.2, 0.25, 0]);
      b.at(0, 0.03, 0.05, (s) => s.box(0.11, 0.035, 0.08, [0.7, 0.3, 0.35, 0]));
      return { mesh: r.mesh(b) };
    },
    mop(r) {
      const b = new Builder();
      b.at(0, -0.3, 0, (s) => s.box(0.03, 1.4, 0.03, [0.6, 0.45, 0.3, 0]));
      b.at(0, -1.0, 0, (h) => h.box(0.3, 0.06, 0.12, [0.85, 0.85, 0.8, 0]));
      return { mesh: r.mesh(b) };
    },
    fork(r) {
      const b = new Builder();
      b.box(0.012, 0.012, 0.18, [0.8, 0.8, 0.84, 0.1]);
      return { mesh: r.mesh(b) };
    },
    backpack(r) {
      const b = new Builder();
      b.box(0.34, 0.42, 0.16, [0.25, 0.12, 0.12, 0]);
      b.at(0, -0.08, -0.09, (p) => p.box(0.26, 0.18, 0.04, [0.2, 0.1, 0.1, 0]));
      return { mesh: r.mesh(b) };
    }
  };

  function guitarProp(r, color, bass) {
    const b = new Builder();
    b.push(M4.rotZ(-0.95));
    b.ellipsoid(0.17, 0.2, 0.045, 8, 4, color);
    b.at(0.05, -0.12, 0, (lo) => lo.ellipsoid(0.13, 0.13, 0.044, 8, 4, color));
    b.at(0, 0.2 + (bass ? 0.36 : 0.28), 0.01, (n) => n.box(0.045, bass ? 0.75 : 0.58, 0.03, [0.2, 0.12, 0.08, 0]));
    b.at(0, 0.2 + (bass ? 0.78 : 0.62), 0.01, (hd) => hd.box(0.07, 0.12, 0.03, shade(color, 0.7)));
    b.at(0, -0.02, 0.046, (p) => p.box(0.05, 0.14, 0.004, [0.1, 0.1, 0.1, 0]));
    b.pop();
    return { mesh: r.mesh(b) };
  }

  function makeProp(id, r) {
    return PROP_MAKERS[id](r);
  }

  function overlay(r) {
    const roachBody = new Builder();
    const brown = [0.36, 0.17, 0.06, 0.12];
    roachBody.at(0, 0.12, -0.05, (b) => b.ellipsoid(0.28, 0.12, 0.5, 10, 5, brown));
    roachBody.at(0, 0.2, -0.1, (b) => b.ellipsoid(0.26, 0.05, 0.44, 8, 3, shade(brown, 1.25)));
    roachBody.at(0, 0.14, 0.42, (b) => b.ellipsoid(0.22, 0.08, 0.14, 8, 4, shade(brown, 0.75)));
    roachBody.at(0, 0.12, 0.56, (b) => b.ellipsoid(0.1, 0.08, 0.08, 6, 4, shade(brown, 0.6)));
    [-1, 1].forEach(s => roachBody.at(s * 0.05, 0.16, 0.62, (e) => e.box(0.03, 0.03, 0.02, [0.02, 0.02, 0.02, 0])));
    const leg = new Builder();
    leg.at(0.2, 0, 0, (l) => l.box(0.4, 0.025, 0.025, shade(brown, 0.7)));
    leg.push(M4.translate(0.4, 0, 0), M4.rotZ(-0.8));
    leg.at(0.15, 0, 0, (l) => l.box(0.3, 0.02, 0.02, shade(brown, 0.7)));
    leg.pop();
    const antenna = new Builder();
    antenna.at(0, 0, 0.45, (a) => a.box(0.012, 0.012, 0.9, shade(brown, 0.6)));
    const seg = new Builder();
    seg.ellipsoid(0.12, 0.1, 0.12, 8, 5, [0.92, 0.5, 0.55, 0.12]);
    const wormHead = new Builder();
    wormHead.ellipsoid(0.13, 0.12, 0.13, 8, 5, [0.95, 0.55, 0.6, 0.12]);
    [-1, 1].forEach(s => wormHead.at(s * 0.05, 0.04, 0.11, (e) => e.box(0.035, 0.035, 0.02, [0.02, 0.02, 0.02, 0])));
    const xEyes = new Builder();
    [-1, 1].forEach(s => [0.7, -0.7].forEach(a => xEyes.push(M4.translate(s * 0.05, 0.04, 0.125), M4.rotZ(a)).box(0.06, 0.012, 0.01, [0.02, 0.02, 0.02, 0]).pop()));
    const mouth = new Builder();
    mouth.box(0.06, 0.02, 0.01, [0.2, 0.02, 0.05, 0]);
    const hat = new Builder();
    hat.prism(12, 0.16, 0.16, 0, 0.16, 0.16, 0.012, [0.05, 0.05, 0.06, 0], { capBottom: true });
    hat.prism(12, 0.095, 0.095, 0, 0.09, 0.09, 0.16, [0.05, 0.05, 0.06, 0]);
    hat.at(0, 0.02, 0, (bd) => bd.prism(12, 0.097, 0.097, 0, 0.097, 0.097, 0.03, [0.6, 0.05, 0.08, 0], { capTop: false }));
    const horns = new Builder();
    [-1, 1].forEach(s => horns.push(M4.translate(s * 0.07, 0.08, 0), M4.rotZ(-s * 0.5)).prism(5, 0.025, 0.025, 0, 0.004, 0.004, 0.16, [0.8, 0.78, 0.7, 0.1]).pop());
    const bottle = new Builder();
    bottle.prism(8, 0.05, 0.05, 0, 0.05, 0.05, 0.16, [0.25, 0.55, 0.3, 0.3], { capBottom: true });
    bottle.at(0, 0.16, 0, (n) => n.prism(8, 0.05, 0.05, 0, 0.018, 0.018, 0.08, [0.25, 0.55, 0.3, 0.3]));
    const splat = new Builder();
    const rs = rand(5);
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * PI * 2, a1 = ((i + 1) / 16) * PI * 2;
      const r0 = 0.6 + rs() * 0.8, r1 = 0.6 + rs() * 0.8;
      splat.tri([0, 0, 0], [C(a0) * r0, 0, S(a0) * r0], [C(a1) * r1, 0, S(a1) * r1], [0.5, 0.58, 0.12, 0.2]);
    }
    const censorBar = new Builder();
    censorBar.quad([-0.5, -0.14, 0], [0.5, -0.14, 0], [0.5, 0.14, 0], [-0.5, 0.14, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const censorTex = r.texture(128, texText([{ text: 'ЦЕНЗУРА', font: 'bold 22px Arial' }], '#050505', '#f2f2f2', 'bold 22px Arial'), { clamp: true, height: 32 });
    const vortex = new Builder();
    for (let i = 0; i < 24; i++) {
      const a = i * 0.55, rad = 0.02 + i * 0.006;
      vortex.quad([C(a) * rad, 0, S(a) * rad], [C(a + 0.4) * (rad + 0.006), 0, S(a + 0.4) * (rad + 0.006)], [C(a + 0.4) * (rad + 0.02), 0, S(a + 0.4) * (rad + 0.02)], [C(a) * (rad + 0.014), 0, S(a) * (rad + 0.014)], [0.5, 0.8, 0.9, 1]);
    }
    const school = new Builder();
    school.quad([4.4, 3.2, -14], [9.4, 3.2, -14], [9.4, 4.4, -14], [4.4, 4.4, -14], [1, 1, 1, 0.8], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    school.at(6.9, 1.6, -14.05, (p) => p.box(0.1, 3.2, 0.1, [0.3, 0.3, 0.32, 0]));
    const schoolTex = r.texture(256, texText([{ text: 'ШКОЛА №13', font: 'bold 44px Arial' }], '#1a2a4a', '#f2f2f2', 'bold 40px Arial'), { clamp: true, height: 64 });
    const M = { school: r.mesh(school), roachBody: r.mesh(roachBody), leg: r.mesh(leg), antenna: r.mesh(antenna), seg: r.mesh(seg), wormHead: r.mesh(wormHead), xEyes: r.mesh(xEyes), mouth: r.mesh(mouth), hat: r.mesh(hat), horns: r.mesh(horns), bottle: r.mesh(bottle), splat: r.mesh(splat), censor: r.mesh(censorBar), vortex: r.mesh(vortex) };

    function drawRoach(rr, bug, t) {
      const s = bug.scale;
      const bowRx = bug.bow ? -bug.bow : 0;
      let root = M4.chain(M4.translate(bug.pos[0], bug.pos[1], bug.pos[2]), M4.rotY(bug.ry));
      if (bug.upright) root = M4.chain(root, M4.translate(0, 0.35 * s, 0), M4.rotX(-1.25 + bowRx), M4.translate(0, 0, -0.1 * s));
      if (bug.dead) root = M4.chain(root, M4.translate(0, 0.25 * s, 0), M4.rotZ(PI));
      if (bug.walk) root = M4.mul(root, M4.translate(0, 0.03 * s * Math.abs(S(t * 8)), 0));
      const squash = bug.squash ? M4.scale(1.3, 0.12, 1.2) : M4.ident();
      const body = M4.chain(root, M4.scale(s), squash);
      if (bug.squash) rr.draw(M.splat, M4.chain(M4.translate(bug.pos[0], bug.pos[1] + 0.001, bug.pos[2]), M4.scale(s * 0.9)));
      rr.draw(M.roachBody, body);
      const alive = bug.alive || bug.twitch;
      [-1, 1].forEach(side => [0.25, 0, -0.25].forEach((z, i) => {
        const swing = alive ? 0.4 * S(t * (bug.twitch ? 30 : 18) + i * 2 + side) : 0;
        const lift = bug.dead ? 0.6 + (bug.twitch ? 0.3 * S(t * 25 + i) : 0) : 0;
        const legM = M4.chain(body, M4.translate(side * 0.2, 0.08, z), M4.rotY(side > 0 ? swing : PI - swing), M4.rotZ(-0.3 - lift));
        rr.draw(M.leg, legM);
      }));
      [-1, 1].forEach(side => rr.draw(M.antenna, M4.chain(body, M4.translate(side * 0.04, 0.18, 0.6), M4.rotY(side * (0.35 + 0.15 * S(t * 6 + side))), M4.rotX(-0.35 + 0.1 * S(t * 4)))));
      if (bug.hat) rr.draw(M.hat, M4.chain(body, M4.translate(0, 0.2, 0.5)));
    }

    function drawWorm(rr, bug, t) {
      const s = bug.scale;
      const n = 10;
      let root = M4.chain(M4.translate(bug.pos[0], bug.pos[1], bug.pos[2]), M4.rotY(bug.ry));
      if (bug.swirl !== undefined) root = M4.chain(root, M4.translate(0, -0.12 * clamp(bug.swirl / 2, 0, 1), 0), M4.rotY(bug.swirl * 8));
      const pts = [];
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1);
        let x = 0, y = 0.1, z = -i * 0.17;
        if (bug.upright) {
          const bend = bug.bow ? bug.bow * k * k : 0;
          y = 0.1 + (1 - k) * 1.2;
          z = -k * 0.35 - bend * 0.6;
          x = 0.08 * S(t * 3 + i * 0.7);
          if (i > n * 0.6) { y = 0.1; z = -0.35 - (i - n * 0.6) * 0.17; }
        } else if (bug.dance) {
          y = 0.1 + (1 - k) * (0.9 + 0.3 * S(t * 4));
          x = 0.35 * S(t * 5 + i * 0.6) * k + 0.25 * S(t * 3) * (1 - k);
          z = -k * 0.8;
        } else if (bug.drunk || bug.happy) {
          x = 0.12 * S(t * (bug.drunk ? 2.5 : 4) + i * 0.8);
          y = 0.1 + (i === 0 ? 0.12 + 0.05 * S(t * 3) : 0);
        } else if (bug.dead) {
          x = 0.05 * S(i * 1.3);
        }
        if (bug.censor) x += 0.06 * S(t * 30);
        pts.push([x, y, z]);
      }
      pts.forEach((p, i) => {
        const m = M4.chain(root, M4.scale(s), M4.translate(p[0], p[1], p[2]));
        rr.draw(i === 0 ? M.wormHead : M.seg, i === 0 ? M4.mul(m, M4.rotY(bug.upright ? 0 : 0)) : m);
      });
      const headM = M4.chain(root, M4.scale(s), M4.translate(pts[0][0], pts[0][1], pts[0][2]));
      if (bug.dead) rr.draw(M.xEyes, headM);
      if (bug.talk || bug.drunk) rr.draw(M.mouth, M4.chain(headM, M4.translate(0, -0.03, 0.125), M4.scale(1, 1 + 2 * Math.abs(S(t * (bug.talk ? 14 : 5))), 1)));
      if (bug.hat) rr.draw(M.hat, M4.chain(headM, M4.translate(0, 0.1, 0), M4.scale(0.8)));
      if (bug.horns) rr.draw(M.horns, headM);
      if (bug.drunk) rr.draw(M.bottle, M4.chain(root, M4.scale(s), M4.translate(0.2, 0.05, -0.15), M4.rotZ(-0.4 + 0.2 * S(t * 2.5))));
    }

    return {
      opaque(rr, t, shot, st) {
        (st.bugs || []).forEach(bug => {
          if (bug.kind === 'roach') drawRoach(rr, bug, t);
          else drawWorm(rr, bug, t);
        });
        if (shot.scene === 'bath' && (shot.cam === 'flush' || shot.cam === 'flushMacro')) rr.draw(M.vortex, M4.chain(M4.translate(0, 0.37, -2.45), M4.rotY(-t * 6)), { additive: true, alpha: 0.6 });
        if (shot.scene === 'street') rr.draw(M.school, null, { texture: schoolTex, noFog: true });
      },
      blend(rr, t, shot, st) {
        const eye = st.camera.eye;
        (st.bugs || []).forEach(bug => {
          if (!bug.censor) return;
          const p = V3.add(bug.pos, [0, 0.03, -0.02]);
          const yaw = Math.atan2(eye[0] - p[0], eye[2] - p[2]);
          rr.draw(M.censor, M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw), M4.scale(bug.scale * 1.6)), { texture: censorTex, noFog: true });
        });
      }
    };
  }

  const kitBuilders = K.builders;
  const BUILDERS = {
    ident: kitBuilders.ident,
    hangar: buildHangar,
    room: buildRoom,
    garden: buildGarden,
    bath: bathBuilder,
    street: kitBuilders.street,
    burst: kitBuilders.burst
  };

  const create = K.makeCreate({
    builders: BUILDERS,
    looks: LOOKS,
    vehicles: K.VEHICLES,
    prop: makeProp,
    stage,
    shotAt,
    fadeAt,
    overlay,
    sceneOpts: {
      burst: { table: BURSTS },
      street: { speed: () => 0 }
    }
  });

  const clip = {
    id: 'tarakan-i-chervyachok',
    number: 4,
    hidden: false,
    artist: 'Таракан и червячок',
    title: 'visual-kei версия',
    originalYear: 2025,
    audio: 'content/clip/Таракан и червячок.mp3',
    duration: DURATION,
    bpm: BPM,
    poster: 66.5,
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
