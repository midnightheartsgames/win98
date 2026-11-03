(function () {
  const { M4, V3, Builder, shade, rgb } = window.P3D;
  const { restPose } = window.P3DFigure;
  const Cast = window.P3DCccCast;
  const GK = window.P3DGodKnowsCast;

  const BPM = 149.91;
  const BEAT0 = 0.296;
  const BEAT = 60 / BPM;
  const EIGHTH = BEAT / 2;
  const DURATION = 241.88;
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
  const glide = (t, period, value, time) => {
    const k = (t - BEAT0) / period;
    const i = Math.floor(k);
    return lerp(value(i - 1), value(i), smooth(((k - i) * period) / (time || 0.12)));
  };
  const mixV = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

  const LOCATIONS = [
    { id: 'stage', name: 'Сцена', color: '#e8b040', scene: 'gym' },
    { id: 'gear', name: 'Инструменты', color: '#c8602a', scene: 'gym' },
    { id: 'hall', name: 'Зал', color: '#3a6a7a', scene: 'gym' },
    { id: 'rain', name: 'Дождь', color: '#8aa4aa', scene: 'rain' }
  ];

  const SHOT_LIST = [
    [0, 'stage', 'back'], [1.585, 'gear', 'drumArm'], [3.587, 'stage', 'wide'], [7.758, 'stage', 'yukiLow'], [9.927, 'gear', 'strum'],
    [12.93, 'hall', 'crowdWide'], [14.556, 'stage', 'haruhiFront'], [16.141, 'stage', 'profile'], [28.57, 'hall', 'crowdMid'], [35.953, 'stage', 'profile2'],
    [41.833, 'stage', 'bassAbove'], [48.048, 'stage', 'haruhiTilt'], [51.635, 'stage', 'drummer'], [54.846, 'stage', 'witchFg'], [57.724, 'stage', 'profileWarm'],
    [62.771, 'hall', 'kyon'], [70.237, 'stage', 'haruhiBanner'], [73.824, 'stage', 'yukiProfile'], [77.035, 'hall', 'fists'], [80.122, 'stage', 'profileWarm2'],
    [83.333, 'hall', 'gymWide'], [93.51, 'gear', 'strum2'], [95.929, 'gear', 'bassHands'], [97.931, 'gear', 'cymbal'], [99.891, 'stage', 'profileXcu'],
    [104.688, 'stage', 'shout'], [107.816, 'gear', 'sticks'], [109.067, 'gear', 'strum3'], [109.443, 'stage', 'spotStrip'], [110.569, 'gear', 'bassHands2'],
    [110.777, 'gear', 'toms'], [111.194, 'stage', 'sideFace'], [112.279, 'hall', 'fists2'], [115.365, 'stage', 'lowMic'], [116.074, 'stage', 'profileWarm3'],
    [117.034, 'stage', 'behindCrowd'], [120.078, 'stage', 'yukiGuitarFg'], [123.915, 'stage', 'faceFront'], [124.958, 'stage', 'wing'], [128.378, 'stage', 'drummer2'],
    [129.963, 'stage', 'bassAbove2'], [131.548, 'stage', 'yukiProfile2'], [133.175, 'stage', 'profile3'], [136.303, 'stage', 'haruhiBob'], [140.891, 'stage', 'yukiLow2'],
    [145.729, 'stage', 'bassAbove3'], [148.899, 'stage', 'drummer3'], [151.568, 'stage', 'haruhiStand'], [152.361, 'hall', 'wide2'], [159.743, 'stage', 'haruhiGuitar'],
    [163.914, 'gear', 'bassHands3'], [165.874, 'gear', 'strum4'], [168.835, 'stage', 'haruhiKit'], [172.422, 'gear', 'kick'], [173.507, 'stage', 'smile'],
    [180.931, 'stage', 'smile2'], [183.1, 'hall', 'kyonRow'], [192.1, 'hall', 'arms'], [202.077, 'rain', 'gate'], [210.502, 'rain', 'stalls'],
    [220.095, 'rain', 'gymExt'], [229.73, 'rain', 'school']
  ];

  const EMPTY_CAMS = ['gate', 'gymExt', 'school'];

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
    if (t < 0.4) return 1 - t / 0.4;
    return smooth(span(t, 238.6, 241.6));
  }

  const VOICE = '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000alonpstsogpvwtqttssrqsrrssqsqkijhgfeb8520144523ji0fprmhlkbfpspmrskfnstsssqpojdchllorsvustsrsrmiecc645410000000000000000000000000000lqpqrohepsrpnlipqnopnnpprsog7566740000000002ilinqqrrrsohqtrqrrljorpkjpttsnffpuvtsuvtrvvvuqonhb95100000000000000000000000000000cmpqstspljuvturmpuvwxvtwwqopnhiede86567679a6cnrurjorohhprpppngkpngekoprrqqrrnnmkrssuvuuuvvusojjhd965763000000000000000000000343210hpqprtutsomqqmsurttssuuusljiddggecdb757647achoqjnuvqptqlorttsqjeottqorsrqroiqttvwwuvxxyywxyxupkkhdd9997300100000000000000003003gqvvtstuuvuvvvuphlqstvutuvvqmmlpqmjklic112200ij1equtoqsoopqngotsqruusstuvurstrle9otvwvtrlormhpuvtopoilonomllkhda98653256555305bllnrtqeemrpopoopporssrohfe8388bjlhkrspomlqpgoonpopqqnjhjgisvvvvsqtwwvwxyxuuvuqpsutssuutsttsstsogghb000000hqstuto99qwwvrquxtnrsqqrqtvwsopggpsspopntwuskpuuqlebdnsuvwxwrrvxwtnmoplqvvvvtrusqnhjiepsrrplfdouqepqg9qutsroghptqgpqjlsttsohfjmttsstslnuvsknnlolfnsvupnkddnpnoomljkllnqssrstsl6045584mnfgkprrsssnfqsrqniacqsqplc3eqututsqostuuuvxzyxwvwxvvvphkmjhkliahqtrmha99627cjooqqpqruvsrroi9899eosstvvtrsqmgkpnpspptslehpsrne94fqsrrusikok8ejiedkopqsusqroid544gswwtrmbiqrkgnrssssuvvropsriaquttuvxxtpttrtsojkilpuvtttphoqlkortromlnqrrppppoonlhpvwutttogggehhgpsohorsrqqmjkosuvuqg8lqsrqsqmqsstssrptuvvuvuvvwvqtwtuwwuuxywuttuupmlihhggfentvwxyxqiouxyxxwrloolnmgbluusuvwvvuuvuuuusuvtsvwstvspmmrutststwwvtqrvwtvxurnlmjfeccb751egfdeknnloqnmni8nsspnlfhnsturibailjjkkmmljhihgihihc9961243000000ehhgfmoooppnmmkihnpoolfbnssstqiglqsrssqnorrsqlprqonmonjckokjkmolprkfgikjiijjgdjiafe00000011000009jnonlnqqonlekmghnqrtrjinrsqomkjorqqrtsrrttrqngbkqqprsrqssrrsrqqpmgeb85652200000000000000000002fllkiknpqpnkkmnlhknmmmnolorromqnhkppmmlmnpqpooppkb66200000001001kmf5lokmmmmghooielnmlmllmorsqoqnfnqqof89nqoqtrinssssuuvtvwplqtpjosqeqtsuxwyzzzzzzzwuttxzwxwuvutuvvwvqokikdemsusttsonuwvvwrimuvtrngcjruutvwxyxyyxxyyyxtmgtxvpsvrepuuvuvuvxwwyzzxxxuvvwwxyxwwwwvwwwvuuqjeb4200anrrpnpppqtroqtuuuuuwvoooielnqsqrsvvvxujfpttrqvwtqnnoqsttutusqpgdqvtrtqquvtj9nuvussropuusuvvsmquupfelsptwvxvtuusqmgkjnuwwupleouvpistmhqttsqmhnqpjipm6mtwwtkdipstuutronttrkmpjopjfnuuroolejnmnppnmlkjkmqtuuuusoidcdeb4nphakqsstuqimsttsnh7krsrqplfkqtuuuvvuuvwvuuwxxxwvvuvxxsoqrlgmoi9itwvtqkec9957loorsqortutttqmf554dptstuvurrpcfnplmppsuriaisuqi21akqtttttpenohbnploqpsuvvrptsldb40fswwuqmiotsmnrtvwwutvwvsrtpcmstttuvvvvsopttrkgjemsttttpekpojjqusprroorrpqpmllkfbmsrpruurme8acffequrjosttuqeefrvvwum9mtuuvuuuvvuuwwsjmtvutsstuurlnsuvwxxvvwxvvvvwxxwrlonkedccorroedjqsttsnptuutomqpkenvvuxxwwwxyxxxzzyxxyzzxwwwtmipttuwwuvwvuuvwwvxxwwwvuwwvxxsswusssvvsqrqomkiiihhilmkhhjjjjgdbaehgb5ahjijihjg977dgfbb822000000000000000000000000000000000000000000000249hkjhhhfcbbcbbcca89a99bdhigdbdfedb7779cdcefc9cfffddd735664234000afb447721001be931000004210000000000000000000001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000589a9a978875688658cdc832000000000000000000000000000000000000000000000000000001fjptpdcqtplnrsqppjc9730000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005ilkknmrwwrferuuxvnkswwwsjjiecdnqlc43qvuwxwwwvutqkigfeaprlg9aptuvskdilkggjsvuphkvxwtkfipuutspnmlieb9998gprnhmnosslafhone7kuvsnhijicflmorusj8cceggfhhgfdb73000000bmoopmkhgdddaa7337bdec9bahkjid388ptpkiauzzwljuxwxwusrpnoqsutnhjtwunfhsxwwwuvvvuuvwxxunimwyvngkoonlf001550ivzxpanxzztjpxyyzzxxxxyyxxxvrjsyyvngktvrliihmnkjipuundmqppqnluzzzzxwyyyzyustpnjhiiihgfgijhb899775456a8000000001002466500hpogckuzzumlvyyzzvxzzwnhswxxuouzxqjkjquuxyxxtjkkigaff5qyzvmeuzzvhhhvzuhbszzzqfnwzyomqutssqomkfb56675hruwtldepwwob8fknnjluyysbdyzwncduzzyslnsvwywuusonkda6310000000000000000000000000000004cfe9jswywpbmvzzxlouxzzzvqqrqokqyxpgamsur79ryyxzzywwyzyyywsmeqwvqa7uzzzzwoa8bc7gtwusquxwukcvzyyyyywqnnjfefb54szzvdejuxvusqyzseahnrspknpminlsyzzzzzzzxzzwyxvtspmhgfca45659a960hqtxzzvnpuwvnbiwzzzzyyzzyzzyzztprxxvrimvxwtphrvup0otturetzxpa7szzyyzxzzxyzzzzxsrsxxuoahuyzywqb7898fxzzuifvzwo9gsustparvsj3ltxzzvlpqk76lwyzzyrnpokchuvk868vzyq5lwzzthcjvywzzxxzzyywvvuvwvrlggjjg7hnmwzzztgqxyuifrvuwyxuuvuuvvxvlsvzzzzwluzzxnkszxld7krsmbaqvsnnvzzzzzyzzzyzwtwtnmijsuqk8bqvvtm98342jpvyzyppyzvuuuxzxupjswumepuuqi7owvogapwxywpsyzufbjlloqqstodlquxuj9bqwwvxyyywvwwuturnlie654000000000000243300sxvsnihnnkjclvwqiecdged7luvrqutnghlmmmh831dmlfa25hjgc7aba9888chihe8751005hjgddb714cecddba9500000026400000000003300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
  const VOICE_LV = Array.from(VOICE, ch => parseInt(ch, 36) / 35);

  function voiceAt(t) {
    const f = t * 20;
    const i = Math.floor(f);
    if (i < 0 || i >= VOICE_LV.length) return 0;
    const a = VOICE_LV[i], b = VOICE_LV[i + 1] || 0;
    return a + (b - a) * (f - i);
  }

  const SINGING = [[16.1, 148.9], [160.2, 161.4], [173.9, 236]];
  const singing = (t) => SINGING.some(([a, b]) => t >= a && t <= b);

  function mouthFor(role, t) {
    if (role !== 'haruhi' || !singing(t)) return 0;
    return clamp((voiceAt(t) - 0.15) / 0.7, 0, 1);
  }

  const DRUMS = '00000000400020005020112011221360332033603360316033201320312211603322112031220320303030306070717070703070607130703070707070707070303030727024307130317071307030307070717030713070327170313270337030703070707030703160336070603260706033607060626220607360306063603020332032163232302213203122016033621162313213203322136033220320112211612122112020221130332213220322112031621320336213221222036012221360122203221322112003621322103030303034303030703070303031303070303030313030303030703035307030717070307070703130703130703130302030303030313030223022727266626010000770007232102233203320132023201320032011220120132013221320336213212120133211221320132003203321112033200320302213203362032030230070332013203362132031202212132231203322133033221320332033222002012033221320312032321000000220000000020000000200000002000000000006004002000003000003000003000003010001000003000003100003002003001303003103003103003103003703003303003203003003003303003103003303001303007303203103003303203121003203003103003103003303203103003601003103003203003303203321203213603703203603223221203303201323201103203303203303203603303301201303203301203323301203203301202203203203203203201201203213330201202213206212002222012012000010000000000000000000000000';
  const slotTime = (i) => BEAT0 + i * EIGHTH;
  const drumCode = (i) => (i >= 0 && i < DRUMS.length ? +DRUMS[i] : 0);
  const active = (i) => { for (let k = -4; k <= 4; k++) if (drumCode(i + k)) return true; return false; };
  const HITS_R = [], HITS_L = [], KICKS = [], CRASHES = [];
  for (let i = 0; i < DRUMS.length; i++) {
    const c = drumCode(i);
    if (c & 4) { HITS_R.push({ t: slotTime(i), at: 'crash' }); CRASHES.push(slotTime(i)); } else if (active(i)) HITS_R.push({ t: slotTime(i), at: (c & 2) && (drumCode(i - 1) & 2) ? 'tom1' : 'hat' });
    if (c & 2) HITS_L.push({ t: slotTime(i), at: (drumCode(i + 1) & 2) && (drumCode(i - 1) & 2) ? 'tom2' : 'snare' });
    if (c & 1) KICKS.push(slotTime(i));
  }

  const lastIndex = (arr, t, key) => {
    let lo = 0, hi = arr.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if ((key ? arr[mid][key] : arr[mid]) <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
  };

  const ENERGY = [[0, 0.35], [3.5, 0.6], [16.1, 0.42], [48, 0.62], [62.7, 1], [83.3, 0.55], [99.3, 0.85], [104.6, 1], [143.8, 0.9], [153.2, 0.4], [162, 0.6], [174, 1], [236, 0.2]];
  function energyAt(t) {
    let i = 0;
    while (i + 1 < ENERGY.length && ENERGY[i + 1][0] <= t) i++;
    const [t0, e0] = ENERGY[i];
    const next = ENERGY[i + 1];
    if (!next) return e0;
    return lerp(e0, next[1], smooth(span(t, next[0] - 0.8, next[0])));
  }

  const CHARACTERS = {
    haruhi: { name: 'Харухи Судзумия' },
    yuki: { name: 'Юки Нагато' },
    mizuki: { name: 'Басистка ENOZ' },
    mai: { name: 'Барабанщица ENOZ' },
    kyon: { name: 'Кён' },
    students: { name: 'Зрители' }
  };

  const FLOOR = -1.1;
  const HARUHI = [0, -1.65];
  const YUKI = [-3.8, -1.75];
  const MIZUKI = [3.6, -1.75];
  const MAI = [0.8, -4.46];
  const DX = MAI[0], DZ = -4.3;
  const MIC = [0, 1.33, -1.47];
  const MIC_BASE = [0.3, -1.1];

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

  const blinkAt = (t, seed) => (frac(t / 3.3 + seed * 0.37) < 0.04 ? 1 : 0);

  function singFace(time, mood) {
    const t = Math.floor(time * 12) / 12;
    if (!singing(t)) return mood === 'soft' || mood === 'beam' ? 'smile' : mood === 'grit' ? 'grit' : 'calm';
    const v = voiceAt(t);
    if (mood === 'shout') return v > 0.3 ? 'shout' : 'grit';
    if (v > 0.86) return mood === 'soft' ? 'sing' : mood === 'beam' ? 'beam' : 'belt';
    if (v > 0.52) return mood === 'beam' ? 'beam' : 'sing';
    if (v > 0.2) return 'say';
    return mood === 'soft' || mood === 'beam' ? 'smile' : mood === 'grit' ? 'grit' : 'calm';
  }

  function strumAt(t, rate, amp) {
    const ph = (t - BEAT0) / (EIGHTH / (rate || 1));
    return 0.5 + 0.5 * C(2 * PI * ph) * (amp === undefined ? 1 : amp);
  }

  function haruhi(t, o) {
    const opts = o || {};
    const p = pose(HARUHI[0], HARUHI[1], opts.ry || 0);
    const e = energyAt(t);
    const b = beatAt(t);
    const hit = punch(t);
    p.spine = [0.04 + 0.05 * e * hit, 0.05 * S(b * PI * 0.5), 0.025 * S(b * PI)];
    p.neck = [-0.05 + 0.08 * e * hit + (opts.nod || 0), 0.06 * S(b * PI * 0.25), 0.03 * S(b * PI * 0.5)];
    p.hipL = [0.05 + 0.07 * e * hit, 0, 0.05];
    p.hipR = [0.05 + 0.07 * e * hit, 0, 0.05];
    p.knL = [0.1 + 0.16 * e * hit, 0, 0];
    p.knR = [0.1 + 0.16 * e * hit, 0, 0];
    p.hair = 0.05 * S(b * PI) * e + (opts.whip ? 0.16 * S(t * 11) : 0);
    p.face = opts.face || singFace(t, opts.mood);
    p.blink = opts.face ? 0 : blinkAt(t, 0.1);
    const a = actor('haruhi', 'haruhiBunny', p);
    const fret = glide(t, BEAT * 2, (i) => hash(i, 3) * 0.7 + 0.1);
    const strum = opts.still ? 0.5 : strumAt(t, 1, 0.4 + 0.6 * e);
    a.props.push(GK.play(p, 'haruhiBunny', 'gtrHaruhi', { strum, fret }));
    return a;
  }

  function yuki(t, o) {
    const opts = o || {};
    const p = pose(YUKI[0], YUKI[1], 0.14);
    const b = beatAt(t);
    const solo = smooth(span(t, 140.3, 140.85)) * (1 - smooth(span(t, 159.7, 160.2)));
    p.spine = [0.07, 0.04, 0.01 * S(b * PI)];
    p.neck = [0.24 + 0.02 * bob(t), 0.12, 0.04];
    p.knL = [0.04, 0, 0];
    p.knR = [0.04, 0, 0];
    p.face = 'blank';
    p.blink = blinkAt(t, 0.7);
    const a = actor('yuki', 'yukiWitch', p);
    const run = 0.5 + 0.3 * S(t * 3.1) + 0.12 * S(t * 7.7 + 1.3);
    const fret = lerp(glide(t, BEAT, (i) => 0.2 + 0.5 * hash(i, 5), 0.1), run, solo);
    const strum = lerp(strumAt(t, 1, 0.8), strumAt(t, 2, 0.3), solo);
    a.props.push(GK.play(p, 'yukiWitch', 'gtrYuki', { strum, fret }));
    return a;
  }

  function mizuki(t, o) {
    const p = pose(MIZUKI[0], MIZUKI[1], -0.16);
    const b = beatAt(t);
    const hit = punch(t);
    const e = energyAt(t);
    p.spine = [0.06 + 0.03 * hit * e, -0.05, 0.02 * S(b * PI * 0.5)];
    p.neck = [0.18 + 0.14 * hit * e, -0.08, 0];
    p.knL = [0.08 + 0.08 * hit * e, 0, 0];
    p.knR = [0.08 + 0.08 * hit * e, 0, 0];
    p.face = 'calm';
    p.blink = blinkAt(t, 0.4);
    const a = actor('mizuki', 'mizukiBass', p);
    const fret = glide(t, BEAT * 4, (i) => [0.1, 0.55, 0.35, 0.75][((i % 4) + 4) % 4], 0.15);
    a.props.push(GK.play(p, 'mizukiBass', 'bass', { strum: strumAt(t, 1, 0.5), fret, range: 0.6 }));
    return a;
  }

  const KIT = {
    snare: [DX + 0.08, 0.645, DZ + 0.3],
    hat: [DX + 0.3, 0.82, DZ + 0.28],
    crash: [DX + 0.32, 1.1, DZ + 0.52],
    tom1: [DX + 0.13, 0.86, DZ + 0.44],
    tom2: [DX - 0.15, 0.86, DZ + 0.44],
    floor: [DX - 0.38, 0.63, DZ + 0.26],
    rest: [DX + 0.05, 0.6, DZ + 0.18]
  };

  let maiFrame = null;
  function maiPose() {
    const p = pose(MAI[0], MAI[1], 0);
    p.ground = false;
    p.y = -0.2;
    p.hipL = [1.4, 0, 0.12];
    p.hipR = [1.4, 0, 0.12];
    p.knL = [1.35, 0, 0];
    p.knR = [1.35, 0, 0];
    p.spine = [0.1, 0, 0];
    return p;
  }
  function maiLocal(world) {
    if (!maiFrame) maiFrame = GK.invRigid(Cast.solve('maiDrums', maiPose()).torso);
    return M4.point(maiFrame, world);
  }

  const handFor = (tip, side) => [tip[0] + (side === 'R' ? -0.06 : 0.06), tip[1] + 0.09, tip[2] - 0.2];
  const RAISE = 0.16;
  const STROKE = { hat: 0.06, snare: 0.11, crash: 0.14, tom1: 0.11, tom2: 0.11, floor: 0.11, rest: 0.05 };
  const DRUM_HINT = [0.75, -0.25, 0.3, 1.35];
  const LEAVE = 0.35;

  function stickState(list, t, side) {
    const i = lastIndex(list, t, 't');
    const a = list[i], b = list[i + 1];
    let from = 'rest', to = 'rest', w = 0, lift = 1;
    if (a && b && b.t - a.t <= 0.9) {
      const u = (t - a.t) / (b.t - a.t);
      from = a.at;
      to = b.at;
      w = smooth(u);
      lift = S(PI * u);
    } else if (a && t - a.t < LEAVE) {
      const u = (t - a.t) / LEAVE;
      from = a.at;
      w = smooth(u);
      lift = S((PI / 2) * u);
    } else if (b && b.t - t < LEAVE) {
      const u = (b.t - t) / LEAVE;
      to = b.at;
      w = smooth(1 - u);
      lift = S((PI / 2) * u);
    }
    const height = lerp(STROKE[from], STROKE[to], w) * lift;
    const tip = mixV(KIT[from], KIT[to], w);
    tip[1] += height;
    return { side, from, to, w, height, tip };
  }

  function mai(t, o) {
    const p = maiPose();
    const b = beatAt(t);
    p.neck = [0.12 + 0.12 * punch(t) * energyAt(t), 0.05 * S(b * PI * 0.5), 0];
    const ki = lastIndex(KICKS, t);
    const near = Math.min(ki >= 0 ? t - KICKS[ki] : 9, ki + 1 < KICKS.length ? KICKS[ki + 1] - t : 9);
    p.knR = [1.35 - 0.14 * Math.exp(-Math.pow(near / 0.05, 2)), 0, 0];
    p.face = 'smile';
    p.blink = blinkAt(t, 0.9);
    const a = actor('mai', 'maiDrums', p);
    const sticks = [stickState(HITS_R, t, 'R'), stickState(HITS_L, t, 'L')];
    sticks.forEach(st => {
      const pair = (name) => {
        const low = GK.ik('maiDrums', st.side, maiLocal(handFor(KIT[name], st.side)), DRUM_HINT);
        const high = GK.ik('maiDrums', st.side, maiLocal(handFor([KIT[name][0], KIT[name][1] + RAISE, KIT[name][2]], st.side)), low);
        return GK.mixArm(low, high, clamp(st.height / RAISE, 0, 1));
      };
      GK.applyArm(p, st.side, GK.mixArm(pair(st.from), pair(st.to), st.w));
    });
    a.sticks = sticks;
    return a;
  }

  function band(t, o) {
    const opts = o || {};
    return [haruhi(t, opts.haruhi), yuki(t, opts.yuki), mizuki(t, opts.mizuki), mai(t, opts.mai)];
  }

  const STUDENT_FORMS = ['boyBlack', 'girlTail', 'boyBrown', 'girlLong', 'boyBob', 'girlBob'];

  function cheerPose(p, t, seed, mode, e) {
    const b = beatAt(t);
    const hit = punch(t + seed * 0.05);
    p.neck = [-0.25 + 0.06 * hit, 0.12 * S(seed * 7), 0];
    p.spine = [-0.05, 0.08 * S(seed * 3 + t * 0.3), 0];
    p.knL = [0.06 + 0.14 * hit * e, 0, 0];
    p.knR = [0.06 + 0.14 * hit * e, 0, 0];
    if (mode === 'up') {
      p.shR = [2.6 + 0.2 * hit, 0.1, 0.25];
      p.elR = [0.25 + 0.3 * hit, 0, 0];
      p.shL = [2.5 - 0.15 * hit, 0.1, 0.3];
      p.elL = [0.3, 0, 0];
    } else if (mode === 'fist') {
      p.shR = [2.2 + 0.5 * hit, 0.2, 0.2];
      p.elR = [0.9 - 0.5 * hit, 0, 0];
    } else if (mode === 'wave') {
      p.shR = [2.7, 0.0, 0.35 + 0.35 * S(t * 5 + seed)];
      p.elR = [0.3, 0, 0];
    } else if (mode === 'clap') {
      const c = Math.abs(S(PI * b));
      p.shR = [0.95, -0.55, 0.15 + 0.2 * c];
      p.elR = [1.5, 0, 0];
      p.shL = [0.95, -0.55, 0.15 + 0.2 * c];
      p.elL = [1.5, 0, 0];
    }
    p.lift = FLOOR;
    p.face = mode === 'still' ? 'calm' : hash(seed, 2) > 0.5 ? 'grin' : 'happy';
    p.blink = blinkAt(t, seed);
    return p;
  }

  function students(t, spots, opts) {
    const o = opts || {};
    const e = energyAt(t);
    const loud = energyAt(o.at === undefined ? t : o.at) > 0.8;
    return spots.map(([x, z, ry, mode], i) => {
      const seed = i + (o.seed || 0);
      const m = mode || (loud ? ['up', 'fist', 'wave', 'up', 'clap', 'fist'][(seed * 7) % 6] : ['clap', 'still', 'fist', 'still'][(seed * 5) % 4]);
      const p = cheerPose(pose(x, z, ry === undefined ? PI : ry), t, seed, m, e);
      return actor('s' + i, STUDENT_FORMS[(seed * 5 + 1) % STUDENT_FORMS.length], p);
    });
  }

  function kyonActor(t, x, z, ry, mode) {
    const p = pose(x, z, ry);
    p.lift = FLOOR;
    p.neck = [-0.2, 0, 0];
    p.blink = blinkAt(t, 0.33);
    const a = actor('kyon', 'kyon', p);
    if (mode === 'arms') {
      GK.reach(p, 'kyon', 'R', [0.12, 0.27, 0.15]);
      GK.reach(p, 'kyon', 'L', [-0.12, 0.24, 0.12]);
      p.face = 'smug';
      p.neck = [-0.12, 0.05, 0.04];
      const tap = Math.pow(bob(t, 0.5), 4);
      a.props.push({ id: 'finger', part: 'foreR', at: [0.016, -0.235, 0.03], rot: [-0.9 * tap, 0, 0.2] });
    } else {
      p.face = 'surprised';
      p.shR = [0.1, 0, 0.12];
      p.shL = [0.1, 0, 0.12];
    }
    return a;
  }

  function capeBoy(t, x, z) {
    const p = pose(x, z, PI - 0.15);
    p.lift = FLOOR;
    p.neck = [-0.18, -0.1, 0];
    GK.reach(p, 'capeBoy', 'R', [0.12, 0.27, 0.16]);
    GK.reach(p, 'capeBoy', 'L', [-0.12, 0.24, 0.13]);
    p.face = 'smile';
    p.blink = blinkAt(t, 0.81);
    return actor('cape', 'capeBoy', p);
  }

  const view = (eye, at, fov, extra) => Object.assign({ eye, at, fov: fov || 40 }, extra || {});
  const drift = (a, b, u) => mixV(a, b, smooth(u));
  const shake = (t, k) => [k * (S(t * 7.3) + S(t * 11.9) * 0.5), k * (S(t * 8.7 + 1) + S(t * 13.1) * 0.5), 0];
  const addV = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

  function stageView(t, eye, at, fov, extra, bandOpts) {
    return view(eye, at, fov, Object.assign({ set: 'gym', cast: band(t, bandOpts), light: { mode: 'stage' }, crowd: null }, extra || {}));
  }

  function keyView(t, eye, at, fov, extra, bandOpts) {
    return stageView(t, eye, at, fov, Object.assign({ light: { mode: 'key' } }, extra || {}), bandOpts);
  }

  function hallView(t, eye, at, fov, extra) {
    return view(eye, at, fov, Object.assign({ set: 'gym', light: { mode: 'hall' } }, extra || {}));
  }

  const ROWS_NEAR = [
    [-1.6, 1.7], [-0.6, 1.8], [0.5, 1.65], [1.5, 1.8], [-2.4, 2.4], [-1.1, 2.5], [0.0, 2.45], [1.0, 2.55], [2.1, 2.4],
    [-1.7, 3.2], [-0.5, 3.25], [0.6, 3.2], [1.7, 3.3], [-2.6, 3.1]
  ];

  const WORLDS = {
    back(t, u) {
      return stageView(t, [0.48, 1.42, -0.62], [-0.25, 1.95, -2.9], 44, null, { haruhi: { ry: PI, face: 'calm', still: true } });
    },
    drumArm(t, u) {
      return stageView(t, [0.42, 1.44, -4.9], [1.4, 0.6, 3.0], 46, { light: { mode: 'stage', dim: 0.85 }, crowd: { from: 1.2 } });
    },
    wide(t, u) {
      return stageView(t, drift([0, 0.8, 8.9], [0, 0.8, 8.5], u), [0, 1.22, -2.4], 30, { crowd: { from: 1.2, to: 7.5 }, light: { mode: 'stage', crowdDark: true } });
    },
    yukiLow(t, u) {
      return keyView(t, drift([-3.15, 0.42, -0.62], [-3.25, 0.45, -0.7], u), [-4.0, 1.85, -1.95], 50);
    },
    strum(t, u) {
      return keyView(t, [-3.4, 1.34, -1.06], [-3.86, 0.86, -1.62], 30);
    },
    crowdWide(t, u) {
      return hallView(t, [0.3, 1.85, -0.35], [0, -0.5, 12], 50, { cast: band(t), crowd: { from: 1.2 } });
    },
    haruhiFront(t, u) {
      return keyView(t, [0.1, 1.52, -0.42], [0.05, 1.44, -1.65], 38, null, { haruhi: { mood: 'soft', face: t > 15.25 && t < 15.42 ? 'happy' : 'smile' } });
    },
    profile(t, u) {
      return keyView(t, drift([-0.72, 1.5, -1.0], [-0.66, 1.49, -1.08], u), [1.5, 1.36, -2.3], 32);
    },
    crowdMid(t, u, shot) {
      return hallView(t, drift([0.9, 0.2, 0.75], [0.6, 0.22, 0.75], u), [0.2, 0.2, 6], 42, { cast: students(t, ROWS_NEAR.slice(0, 11).map(([x, z]) => [x, z, PI]), { at: shot.start }).concat(band(t)), crowd: { from: 3.9 } });
    },
    profile2(t, u) {
      return keyView(t, drift([-0.66, 1.48, -1.06], [-0.74, 1.52, -1.0], u), [1.5, 1.38, -2.3], 31);
    },
    bassAbove(t, u) {
      return stageView(t, drift([2.82, 2.6, -0.5], [2.9, 2.55, -0.58], u), [3.7, 0.85, -1.98], 40);
    },
    haruhiTilt(t, u) {
      return keyView(t, [0.8, 1.16, -0.44], [-0.12, 1.66, -1.78], 40, { up: [-0.38, 1, 0] });
    },
    drummer(t, u) {
      return keyView(t, [0.88, 1.3, -2.5], [0.8, 0.98, -4.3], 38);
    },
    witchFg(t, u) {
      return stageView(t, [-4.8, 1.45, -0.82], [0.6, 1.3, -2.15], 36);
    },
    profileWarm(t, u) {
      return keyView(t, drift([0.72, 1.5, -1.02], [0.66, 1.5, -1.08], u), [-1.5, 1.4, -2.3], 30, { light: { mode: 'key', warm: true } });
    },
    kyon(t, u) {
      const cast = [kyonActor(t, -0.55, 3.55, PI - 0.5, 'watch')].concat(students(t, [[-1.4, 3.3, PI, 'up'], [-1.0, 4.3, PI, 'wave'], [-2.1, 3.9, PI, 'fist'], [-0.2, 2.7, PI, 'up'], [-1.9, 2.9, PI, 'clap']], { seed: 3 }));
      return hallView(t, drift([0.3, 0.52, 3.3], [0.24, 0.53, 3.32], u), [-1.6, 0.46, 3.8], 34, { cast: cast.concat(band(t)), crowd: { from: 5.2 } });
    },
    haruhiBanner(t, u) {
      return keyView(t, [0.56, 1.04, -0.58], [-0.05, 1.64, -1.68], 38, { up: [-0.22, 1, 0] });
    },
    yukiProfile(t, u) {
      return keyView(t, [-2.92, 1.52, -1.56], [-6.0, 1.42, -2.0], 30);
    },
    fists(t, u) {
      return hallView(t, drift([0.35, 0.56, 6.7], [0.3, 0.6, 6.4], u), [0.1, 0.95, -2], 40, { cast: students(t, [[-0.9, 5.4, PI, 'fist'], [0.5, 5.3, PI, 'up'], [1.6, 5.6, PI, 'fist'], [-0.1, 4.6, PI, 'up'], [-1.6, 4.8, PI, 'fist'], [1.1, 4.4, PI, 'wave']], { seed: 9 }).concat(band(t)), crowd: { from: 1.2, to: 4.2 } });
    },
    profileWarm2(t, u) {
      return keyView(t, drift([0.7, 1.5, -1.04], [0.64, 1.48, -1.1], u), [-1.5, 1.42, -2.3], 29, { light: { mode: 'key', warm: true } });
    },
    gymWide(t, u) {
      return hallView(t, drift([-8.4, -0.62, 2.2], [-8.0, -0.6, 1.8], u), [3.2, 2.2, -3.4], 50, { cast: band(t), crowd: null, light: { mode: 'hall', stageGlow: true } });
    },
    strum2(t, u) {
      return keyView(t, [-3.36, 1.28, -1.12], [-3.88, 0.88, -1.6], 31);
    },
    bassHands(t, u) {
      return keyView(t, [3.18, 1.28, -1.12], [3.64, 0.86, -1.6], 31);
    },
    cymbal(t, u) {
      return keyView(t, [1.55, 1.42, -3.25], [1.16, 1.18, -3.8], 34);
    },
    profileXcu(t, u) {
      return stageView(t, drift([0.44, 1.5, -1.1], [0.4, 1.49, -1.14], u), [-0.36, 1.46, -2.3], 26, { light: { mode: 'back' } }, { haruhi: { mood: 'grit' } });
    },
    shout(t, u) {
      return keyView(t, addV([0.0, 1.56, -1.12], shake(t, 0.012)), [0, 1.5, -1.65], 30, null, { haruhi: { mood: 'shout', whip: true } });
    },
    sticks(t, u) {
      return keyView(t, [1.22, 1.46, -3.28], [0.9, 0.62, -4.0], 40);
    },
    strum3(t, u) {
      return keyView(t, [-3.3, 1.2, -1.1], [-3.86, 0.86, -1.64], 30);
    },
    spotStrip(t, u) {
      return keyView(t, [0.92, 0.86, -0.62], [-0.05, 1.95, -1.7], 44, { up: [0.18, 1, 0] }, { haruhi: { mood: 'shout' } });
    },
    bassHands2(t, u) {
      return keyView(t, [3.22, 1.22, -1.1], [3.62, 0.88, -1.62], 30);
    },
    toms(t, u) {
      return keyView(t, [0.25, 1.02, -3.08], [0.8, 0.8, -3.85], 40);
    },
    sideFace(t, u) {
      return keyView(t, [0.4, 1.5, -1.14], [-0.02, 1.5, -1.66], 26, null, { haruhi: { mood: 'grit', face: t < 111.5 ? 'sleep' : undefined } });
    },
    fists2(t, u) {
      return hallView(t, drift([-0.3, 0.55, 6.8], [-0.2, 0.58, 6.5], u), [0.2, 0.95, -2], 42, { cast: students(t, [[-0.9, 5.4, PI, 'up'], [0.5, 5.3, PI, 'fist'], [1.6, 5.6, PI, 'up'], [-0.1, 4.6, PI, 'fist'], [-1.6, 4.8, PI, 'wave'], [1.1, 4.4, PI, 'up']], { seed: 15 }).concat(band(t)), crowd: { from: 1.2, to: 4.2 } });
    },
    lowMic(t, u) {
      return keyView(t, [0.72, 1.0, -0.74], [-0.1, 1.62, -1.62], 36, { up: [0.3, 1, 0] });
    },
    profileWarm3(t, u) {
      return keyView(t, [0.68, 1.5, -1.06], [-1.5, 1.42, -2.3], 29, { light: { mode: 'key', warm: true } });
    },
    behindCrowd(t, u) {
      return stageView(t, drift([0.55, 1.74, -3.15], [0.5, 1.72, -3.05], u), [-0.4, 0.7, 5], 46, { light: { mode: 'stage', crowdDark: true }, crowd: { from: 1.2 } });
    },
    yukiGuitarFg(t, u) {
      return keyView(t, [-4.06, 1.12, -1.24], [0.0, 1.1, -1.85], 42);
    },
    faceFront(t, u) {
      return keyView(t, [0.02, 1.53, -1.1], [0, 1.49, -1.65], 28);
    },
    wing(t, u) {
      return stageView(t, drift([6.05, 1.85, -3.45], [5.9, 1.82, -3.3], u), [-1.5, 0.3, 3.0], 46, { light: { mode: 'stage', crowdDark: true }, crowd: { from: 1.2 } });
    },
    drummer2(t, u) {
      return keyView(t, [0.95, 1.32, -2.55], [0.78, 0.98, -4.3], 38);
    },
    bassAbove2(t, u) {
      return stageView(t, [2.86, 2.58, -0.54], [3.7, 0.85, -1.98], 40);
    },
    yukiProfile2(t, u) {
      return keyView(t, [-2.95, 1.5, -1.6], [-6.0, 1.4, -1.98], 30);
    },
    profile3(t, u) {
      return keyView(t, drift([-0.7, 1.5, -1.02], [-0.66, 1.49, -1.08], u), [1.5, 1.37, -2.3], 31);
    },
    haruhiBob(t, u) {
      return keyView(t, drift([0.0, 1.45, -0.6], [0.0, 1.45, -0.7], u), [0, 1.42, -1.65], 30);
    },
    yukiLow2(t, u) {
      return keyView(t, drift([-3.3, 0.5, -0.82], [-3.45, 0.55, -0.78], u), [-3.9, 1.72, -1.88], 46);
    },
    bassAbove3(t, u) {
      return stageView(t, drift([2.9, 2.6, -0.6], [2.8, 2.62, -0.52], u), [3.68, 0.86, -1.98], 40);
    },
    drummer3(t, u) {
      return keyView(t, [0.7, 1.26, -2.5], [0.82, 0.98, -4.3], 38);
    },
    haruhiStand(t, u) {
      return keyView(t, [0.0, 1.32, 0.0], [-0.1, 1.15, -1.6], 34);
    },
    wide2(t, u) {
      const near = students(t, [[-1.2, 7.6, PI, 'wave'], [0.4, 7.4, PI, 'up'], [1.7, 7.7, PI, 'wave'], [-0.4, 6.8, PI, 'up'], [1.0, 6.7, PI, 'wave']], { seed: 21 });
      return hallView(t, drift([0.15, 0.52, 8.6], [0.1, 0.55, 8.3], u), [0, 1.22, -2.2], 33, { cast: near.concat(band(t)), crowd: { from: 1.2, to: 6.4 }, light: { mode: 'hall', stageGlow: true } });
    },
    haruhiGuitar(t, u) {
      return keyView(t, drift([-0.05, 1.34, -0.2], [-0.05, 1.34, -0.3], u), [0.0, 1.25, -1.65], 34, null, { haruhi: { mood: 'soft' } });
    },
    bassHands3(t, u) {
      return keyView(t, [3.2, 1.3, -1.08], [3.62, 0.86, -1.6], 30);
    },
    strum4(t, u) {
      return keyView(t, [-3.38, 1.3, -1.1], [-3.84, 0.86, -1.62], 30);
    },
    haruhiKit(t, u) {
      return stageView(t, [0.25, 1.05, 2.3], [0.3, 0.95, -2.2], 33, null, { haruhi: { mood: 'soft' } });
    },
    kick(t, u) {
      return keyView(t, [0.55, 0.42, -2.62], [0.8, 0.36, -3.68], 46);
    },
    smile(t, u) {
      const wink = t > 176.4 && t < 176.9;
      return keyView(t, drift([0.15, 1.5, -0.96], [0.12, 1.5, -1.0], u), [-0.02, 1.47, -1.65], 30, null, { haruhi: { mood: 'beam', face: wink ? 'wink' : undefined } });
    },
    smile2(t, u) {
      return keyView(t, [0.26, 1.5, -0.86], [0, 1.47, -1.65], 32, null, { haruhi: { mood: 'beam' } });
    },
    kyonRow(t, u) {
      const cast = [kyonActor(t, 0, 3.05, PI, 'arms'), capeBoy(t, 0.78, 3.35)].concat(students(t, [[-0.85, 3.2, PI, 'fist'], [-1.6, 3.6, PI, 'up'], [1.5, 3.7, PI, 'up'], [-0.4, 4.1, PI, 'wave'], [0.4, 4.3, PI, 'fist'], [2.2, 3.4, PI, 'clap'], [-2.3, 3.0, PI, 'fist']], { seed: 30 }));
      return hallView(t, drift([-0.15, 0.42, 1.02], [-0.1, 0.42, 1.1], u), [0.25, 0.32, 3.4], 40, { cast, crowd: { from: 5.0 } });
    },
    arms(t, u) {
      return hallView(t, drift([0.12, 0.2, 2.42], [0.1, 0.19, 2.46], u), [0.0, 0.12, 3.05], 34, { cast: [kyonActor(t, 0, 3.05, PI, 'arms')], crowd: { from: 99 } });
    },
    gate(t, u) {
      return view(drift([1.0, 1.4, 2.0], [0.9, 1.35, 1.6], u), [-0.5, 5.2, -6.0], 50, { set: 'rainGate', cast: [], light: { mode: 'rain' }, up: [0.28, 1, 0] });
    },
    stalls(t, u) {
      const p = (id, form, x, z, ry, face) => { const q = pose(x, z, ry); q.face = face || 'calm'; q.blink = blinkAt(t, x); q.neck = [-0.05, 0, 0]; return actor(id, form, q); };
      const cast = [p('st1', 'stallGirl', -3.6, -1.4, 0.2), p('st2', 'stallLong', -2.4, -1.5, 0.1, 'smile'), p('st3', 'girlTail', -5.0, -1.0, 0.3), p('st4', 'teacher', -0.6, -1.6, -0.1), p('st5', 'boyBlack', 3.4, -3.0, -0.4)];
      return view(drift([2.6, 3.2, 4.0], [2.4, 3.15, 3.8], u), [-3.0, 0.8, -1.6], 46, { set: 'rainStalls', cast, light: { mode: 'rain' }, up: [-0.36, 1, 0] });
    },
    gymExt(t, u) {
      return view(drift([-2.6, 1.3, 11.2], [-2.3, 1.3, 10.8], u), [1.0, 3.2, 0], 46, { set: 'rainGym', cast: [], light: { mode: 'rain' } });
    },
    school(t, u) {
      return view(drift([0, 3.1, 30], [0, 3.0, 29], u), [0, 3.6, -10], 40, { set: 'rainSchool', cast: [], light: { mode: 'rain', far: 110 } });
    }
  };

  function cam(eye, at, fov, up) {
    return { eye, at, fov, up: up || [0, 1, 0], near: 0.05, far: 160 };
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
    const crowd = w.crowd ? Object.assign({ cheer: energyAt(shot.start) > 0.75 }, w.crowd) : null;
    return Object.assign({}, w, { scene: shot.scene, cast, camera, light: w.light || {}, crowd });
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

  function wall(b, x0, y0, x1, y1, z, col, n) {
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, null, [n || [0, 0, 1], n || [0, 0, 1], n || [0, 0, 1], n || [0, 0, 1]]);
  }

  function curtain(b, x0, x1, z, y0, y1, folds, col) {
    const dk = shade(col, 0.62), md = shade(col, 0.85);
    for (let i = 0; i < folds; i++) {
      const xa = lerp(x0, x1, i / folds), xb = lerp(x0, x1, (i + 0.5) / folds), xc = lerp(x0, x1, (i + 1) / folds);
      b.quad([xa, y0, z], [xb, y0, z + 0.09], [xb, y1, z + 0.09], [xa, y1, z], [md, col, col, md], null, [[-0.6, 0, 0.8], [0, 0, 1], [0, 0, 1], [-0.6, 0, 0.8]]);
      b.quad([xb, y0, z + 0.09], [xc, y0, z], [xc, y1, z], [xb, y1, z + 0.09], [col, dk, dk, col], null, [[0, 0, 1], [0.6, 0, 0.8], [0.6, 0, 0.8], [0, 0, 1]]);
    }
  }

  function buildStage(b) {
    const W = 7.2, D = -6.4;
    for (let i = 0; i < 48; i++) {
      const xa = -W + (i * 2 * W) / 48, xb = -W + ((i + 1) * 2 * W) / 48;
      const col = i % 3 === 0 ? 0xd29a46 : i % 3 === 1 ? 0xdca652 : 0xd6a04c;
      [[D, D / 2], [D / 2, 0]].forEach(([za, zb]) => b.quad([xa, 0, zb], [xb, 0, zb], [xb, 0, za], [xa, 0, za], col, null, NY));
    }
    for (let i = 0; i < 12; i++) {
      const xa = -W + (i * 2 * W) / 12, xb = -W + ((i + 1) * 2 * W) / 12;
      wall(b, xa, FLOOR, xb, 0, 0, 0x6a3e20);
      wall(b, xa + 0.06, FLOOR + 0.12, xb - 0.06, -0.12, 0.012, 0x84522c);
      [0.3, 0.7].forEach(k => b.at(lerp(xa, xb, k), -0.55, 0.03, (h) => h.box(0.07, 0.09, 0.02, 0xe8e4dc)));
    }
    b.at(0, -0.03, 0.03, (h) => h.box(W * 2, 0.06, 0.08, 0x4e2e18));
    wall(b, -W - 0.2, 0, W + 0.2, 6.2, D, [0.97, 0.96, 0.91, 0.82]);
    b.at(0, 3.05, D + 0.04, (h) => h.box(W * 2, 0.025, 0.02, [0.78, 0.76, 0.72, 0.6]));
    [-1, 1].forEach(s => {
      b.quad([s * (W + 0.2), 0, D], [s * (W + 0.2), 0, 0.3], [s * (W + 0.2), 6.2, 0.3], [s * (W + 0.2), 6.2, D], 0x241c20, null, [[-s, 0, 0], [-s, 0, 0], [-s, 0, 0], [-s, 0, 0]]);
      curtain(b, s > 0 ? 5.9 : -W, s > 0 ? W : -5.9, 0.02, 0, 5.2, 7, 0x7a1a26);
      [-2.6, -4.6].forEach(z => curtain(b, s > 0 ? 6.0 : -W, s > 0 ? W : -6.0, z, 0, 5.4, 6, 0x6a1620));
      wall(b, s * W, FLOOR, s * 13, 8.6, 0.3, 0x4a3426);
      b.at(s * (W + 0.05), 2.6, 0.32, (h) => h.box(0.12, 5.2, 0.05, 0x6a4a30));
      for (let k = 0; k < 10; k++) b.at(s * 6.95, 1.25 + k * 0.38, -0.32, (h) => h.ellipsoid(0.045, 0.045, 0.045, 6, 4, glow(0xffd070)));
      b.at(s * 6.95, 2.95, -0.36, (h) => h.box(0.12, 3.8, 0.05, 0x2a2224));
    });
    curtain(b, -W, W, 0.16, 4.95, 5.9, 26, 0x7e1c28);
    wall(b, -W, 5.9, W, 8.6, 0.3, 0x4a3426);
    for (let k = 0; k < 18; k++) b.at(-6.2 + k * 0.73, 4.9, 0.02, (h) => h.ellipsoid(0.05, 0.05, 0.05, 6, 4, glow(0xffd070)));
    b.at(0, 4.82, -0.05, (h) => h.box(13, 0.06, 0.06, 0x2a2224));
    b.at(0, 5.3, -1.6, (h) => h.box(13.5, 0.06, 0.06, 0x303034));
    for (let k = 0; k < 22; k++) b.at(-6.3 + k * 0.6, 5.22, -1.52, (h) => h.ellipsoid(0.05, 0.05, 0.05, 6, 4, glow(0xffd070)));
    for (let k = 0; k < 8; k++) {
      b.at(-5.2 + k * 1.5, 5.08, -1.6, (h) => {
        h.prism(10, 0.11, 0.11, -0.2, 0.13, 0.13, 0.05, 0x1e1e22, { capBottom: false });
        h.at(0, -0.2, 0, (c) => c.disc(0.1, 10, glow(0xfff0c8, 0.9), 0));
      });
    }
  }

  function amp(b, x, z, ry) {
    b.push(M4.translate(x, 0, z), M4.rotY(ry || 0));
    b.at(0, 0.21, 0, (h) => h.box(0.52, 0.42, 0.27, 0x26262a));
    b.at(0, 0.18, 0.137, (h) => h.box(0.46, 0.3, 0.004, 0x141416));
    b.at(0, 0.38, 0.137, (h) => h.box(0.46, 0.05, 0.004, 0x3a3a3e));
    for (let k = 0; k < 5; k++) b.at(-0.16 + k * 0.08, 0.38, 0.141, (h) => h.box(0.014, 0.014, 0.006, 0xd8d8d0));
    b.pop();
  }

  function micStand(b) {
    b.push(M4.translate(MIC_BASE[0], 0, MIC_BASE[1]));
    [0, 2.1, 4.2].forEach(a => b.push(M4.rotY(a), M4.rotZ(-1.1)).at(0, 0.11, 0, (h) => h.box(0.012, 0.24, 0.012, 0x18181a)).pop());
    b.at(0, 0.55, 0, (h) => h.prism(8, 0.012, 0.012, -0.45, 0.012, 0.012, 0.42, 0x1e1e20));
    b.pop();
    const top = [MIC_BASE[0], 0.97, MIC_BASE[1]];
    const dir = V3.norm(V3.sub(MIC, top));
    const len = V3.len(V3.sub(MIC, top));
    b.push(M4.translate(top[0], top[1], top[2]), alignY(dir));
    b.at(0, len / 2, 0, (h) => h.box(0.014, len, 0.014, 0x1e1e20));
    b.pop();
    b.push(M4.translate(MIC[0], MIC[1], MIC[2]), M4.rotX(-0.95));
    b.prism(8, 0.014, 0.014, -0.13, 0.018, 0.018, 0, 0x2a2a2e, { capBottom: true });
    b.at(0, 0.028, 0, (h) => h.ellipsoid(0.026, 0.03, 0.026, 10, 6, 0xb8bcc4));
    b.pop();
  }

  function musicStand(b) {
    b.push(M4.translate(-0.62, 0, -1.02), M4.rotY(0.55));
    [0, 2.1, 4.2].forEach(a => b.push(M4.rotY(a), M4.rotZ(-1.15)).at(0, 0.1, 0, (h) => h.box(0.01, 0.22, 0.01, 0x18181a)).pop());
    b.at(0, 0.5, 0, (h) => h.box(0.014, 0.95, 0.014, 0x1e1e20));
    b.push(M4.translate(0, 1.02, 0.02), M4.rotX(-0.95));
    b.box(0.46, 0.3, 0.012, 0x1a1a1c);
    b.at(0, 0.0, 0.008, (h) => h.box(0.38, 0.26, 0.004, [0.96, 0.96, 0.94, 0.3]));
    b.pop();
    b.pop();
  }

  function drum(b, x, y, z, r, h, tiltX, tiltZ, shell) {
    b.push(M4.translate(x, y, z), M4.rotX(tiltX || 0), M4.rotZ(tiltZ || 0));
    b.prism(16, r, r, -h / 2, r, r, h / 2, shell, { capTop: false });
    b.disc(r * 0.98, 16, 0xf0eee6, h / 2 + 0.002);
    b.prism(16, r * 1.03, r * 1.03, h / 2 - 0.018, r * 1.03, r * 1.03, h / 2 + 0.006, 0xc8c8cc, { capTop: false });
    b.prism(16, r * 1.03, r * 1.03, -h / 2 - 0.006, r * 1.03, r * 1.03, -h / 2 + 0.018, 0xc8c8cc, { capTop: false });
    b.pop();
  }

  function pole(b, x, z, h, legs) {
    b.at(x, h / 2, z, (c) => c.box(0.016, h, 0.016, 0xb8b8bc));
    if (legs) [0, 2.1, 4.2].forEach(a => b.push(M4.translate(x, 0, z), M4.rotY(a), M4.rotZ(-1.05)).at(0, 0.11, 0, (c) => c.box(0.012, 0.24, 0.012, 0x9a9aa0)).pop());
  }

  function drumKit(b) {
    const SH = 0x2c2c34;
    b.push(M4.translate(DX, 0.3, DZ + 0.66), M4.rotX(PI / 2));
    b.prism(18, 0.3, 0.3, -0.19, 0.3, 0.3, 0.19, SH, { capTop: false });
    b.disc(0.295, 18, 0xf2f0e8, 0.192);
    b.disc(0.295, 18, 0xe8e6de, -0.192);
    b.prism(18, 0.31, 0.31, 0.17, 0.31, 0.31, 0.2, 0xc8c8cc, { capTop: false });
    b.pop();
    b.at(DX, 0.3, DZ + 0.856, (h) => h.box(0.22, 0.03, 0.002, 0x3a3a40));
    drum(b, DX + 0.15, 0.78, DZ + 0.5, 0.12, 0.16, -0.35, -0.12, SH);
    drum(b, DX - 0.15, 0.78, DZ + 0.5, 0.13, 0.17, -0.35, 0.12, SH);
    drum(b, DX - 0.44, 0.42, DZ + 0.26, 0.17, 0.4, 0, 0, SH);
    [0, 2.1, 4.2].forEach(a => b.at(DX - 0.44 + 0.17 * S(a), 0.1, DZ + 0.26 + 0.17 * C(a), (c) => c.box(0.012, 0.2, 0.012, 0xb8b8bc)));
    drum(b, DX + 0.12, 0.58, DZ + 0.32, 0.15, 0.12, -0.12, 0, 0xc8c8d0);
    pole(b, DX + 0.12, DZ + 0.32, 0.52, true);
    pole(b, DX + 0.42, DZ + 0.3, 0.82, true);
    b.at(DX + 0.42, 0.8, DZ + 0.3, (h) => {
      h.prism(16, 0.17, 0.17, -0.004, 0.02, 0.02, 0.012, 0xd8b050);
      h.at(0, -0.02, 0, (c) => c.prism(16, 0.17, 0.17, 0.004, 0.02, 0.02, -0.012, 0xc8a040));
    });
    pole(b, DX + 0.48, DZ + 0.64, 1.12, true);
    pole(b, DX - 0.56, DZ + 0.52, 1.02, true);
    b.at(DX, 0.26, MAI[1], (h) => {
      h.prism(12, 0.17, 0.17, 0.2, 0.17, 0.17, 0.26, 0x1a1a1e);
      h.at(0, 0.1, 0, (c) => c.box(0.02, 0.2, 0.02, 0xb8b8bc));
    });
    b.at(DX - 0.1, 0.05, DZ + 0.42, (h) => h.box(0.08, 0.04, 0.22, 0x3a3a40));
    b.at(DX + 0.46, 0.04, DZ + 0.3, (h) => h.box(0.08, 0.03, 0.2, 0x3a3a40));
  }

  function cymbalMesh(b, r) {
    b.prism(18, r, r, -0.004, 0.025, 0.025, 0.016, 0xdcb24e, { capTop: true });
    b.prism(18, r, r, -0.004, 0.025, 0.025, -0.01, 0xc49a3a, { capTop: true });
  }

  function cables(b) {
    const lines = [[[-3.6, -1.6], [-3.2, -1.2], [-2.7, -1.0]], [[3.5, -1.6], [3.0, -1.2], [2.5, -1.0]], [[-0.1, -1.6], [-0.6, -1.4], [-1.2, -1.0]], [[0, -1.2], [0.3, -0.6], [1.6, -0.3], [3.0, -0.3]]];
    lines.forEach(pts => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
        const d = V3.norm([z1 - z0, 0, -(x1 - x0)]);
        const w = 0.012;
        b.quad([x0 - d[0] * w, 0.006, z0 - d[2] * w], [x1 - d[0] * w, 0.006, z1 - d[2] * w], [x1 + d[0] * w, 0.006, z1 + d[2] * w], [x0 + d[0] * w, 0.006, z0 + d[2] * w], 0x141414, null, NY);
      }
    });
  }

  function buildHall(b) {
    tiles(b, -13, 0.3, 13, 22, 8, 10, FLOOR, 0x5a4636, 0x54412f);
    [-1, 1].forEach(s => {
      b.quad([s * 13, FLOOR, 22], [s * 13, FLOOR, 0.3], [s * 13, 8.6, 0.3], [s * 13, 8.6, 22], 0x34444c, null, [[-s, 0, 0], [-s, 0, 0], [-s, 0, 0], [-s, 0, 0]]);
      b.quad([s * 12.98, FLOOR, 22], [s * 12.98, FLOOR, 0.3], [s * 12.98, -0.2, 0.3], [s * 12.98, -0.2, 22], 0x5a4030, null, [[-s, 0, 0], [-s, 0, 0], [-s, 0, 0], [-s, 0, 0]]);
      for (let z = 2.5; z < 21; z += 3.2) b.quad([s * 12.96, 4.4, z + 1.1], [s * 12.96, 4.4, z - 1.1], [s * 12.96, 6.6, z - 1.1], [s * 12.96, 6.6, z + 1.1], [0.42, 0.52, 0.6, 0.45], null, [[-s, 0, 0], [-s, 0, 0], [-s, 0, 0], [-s, 0, 0]]);
    });
    wall(b, -13, FLOOR, 13, 8.6, 22, 0x3a4a52, [0, 0, -1]);
    [-4, 4].forEach(x => {
      wall(b, x - 1.1, FLOOR, x + 1.1, 1.3, 21.97, 0x2a5a4a, [0, 0, -1]);
      wall(b, x - 0.03, FLOOR, x + 0.03, 1.3, 21.95, 0x1a3a30, [0, 0, -1]);
      b.at(x, 1.65, 21.95, (h) => h.box(0.5, 0.18, 0.04, glow(0x30d070)));
    });
    for (let x = -10; x <= 10; x += 2.5) wall(b, x - 0.8, 5.2, x + 0.8, 6.4, 21.96, [0.4, 0.5, 0.58, 0.45], [0, 0, -1]);
    b.at(0, 3.6, 21.2, (h) => h.box(26, 0.15, 1.6, 0x2c3a40));
    b.at(0, 4.15, 20.45, (h) => h.box(26, 0.06, 0.06, 0x8a9498));
    wall(b, -13, 8.6, 13, 8.6, 0.3, 0x1e2428);
    b.quad([-13, 8.6, 22], [13, 8.6, 22], [13, 8.6, 0.3], [-13, 8.6, 0.3], 0x1e2428, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    for (let z = 2; z < 22; z += 3) b.at(0, 8.2, z, (h) => h.box(26, 0.3, 0.16, 0x2a3236));
    b.at(0, 6.8, 3.2, (h) => h.box(18, 0.08, 0.08, 0x303438));
    for (let k = 0; k < 7; k++) b.at(-6 + k * 2, 6.6, 3.2, (h) => h.box(0.24, 0.3, 0.3, 0x1a1a1e));
  }

  function buildGym(b) {
    buildStage(b);
    buildHall(b);
    drumKit(b);
    amp(b, -2.6, -0.95, 0.1);
    amp(b, -1.3, -2.7, 0);
    amp(b, 2.55, -0.95, -0.1);
    micStand(b);
    musicStand(b);
    cables(b);
  }

  function crowdRows(r) {
    const rows = [];
    const SKIN = [0xf4dcc8, 0xf0d2bc, 0xf8e2d0, 0xeccab0];
    const HAIRS = [0x221e26, 0x3a2a20, 0x5a3c2a, 0x2c2228, 0x6a4632];
    for (let row = 0; row < 18; row++) {
      const z = 1.3 + row * 0.62;
      const base = new Builder(), arms = new Builder();
      const n = 22 + Math.floor(row * 0.4);
      for (let i = 0; i < n; i++) {
        if (hash(i, row) < 0.14) continue;
        const x = -7.4 + (14.8 * (i + 0.5)) / n + (hash(i, row + 50) - 0.5) * 0.25;
        const zz = z + (hash(i, row + 90) - 0.5) * 0.2;
        const girl = hash(i, row + 7) > 0.5;
        const tall = 0.92 + hash(i, row + 3) * 0.14;
        const skin = SKIN[(i + row) % SKIN.length];
        const hair = HAIRS[Math.floor(hash(i, row + 11) * HAIRS.length)];
        const place = M4.chain(M4.translate(x, FLOOR, zz), M4.rotY(PI + (hash(i, row + 13) - 0.5) * 0.5), M4.scale(tall));
        base.push(place);
        arms.push(place);
        const open = { top: null, bottom: null };
        base.at(0, 0.42, 0, (h) => h.box(0.28, 0.84, 0.2, girl ? 0x5a7090 : 0x404650, { faces: open }));
        base.at(0, 1.1, 0, (h) => h.box(0.36, 0.52, 0.22, girl ? 0xeeeeea : 0x2c4250, { faces: { bottom: null } }));
        if (girl) base.at(0, 1.3, 0, (h) => h.box(0.38, 0.12, 0.23, 0x86aed0, { faces: open }));
        else base.quad([-0.04, 1.25, 0.112], [0.04, 1.25, 0.112], [0.04, 1.35, 0.112], [-0.04, 1.35, 0.112], 0xf0f0ec, null, NZ);
        base.at(0, 1.52, 0, (h) => h.ellipsoid(0.105, 0.125, 0.11, 6, 3, skin));
        base.at(0, 1.58, -0.018, (h) => h.ellipsoid(0.118, 0.1, 0.12, 6, 3, hair));
        if (girl) base.at(0, 1.43, -0.06, (h) => h.box(0.22, 0.2, 0.1, hair, { faces: open }));
        [-1, 1].forEach(s => base.quad([s * 0.04 - 0.011, 1.515, 0.104], [s * 0.04 + 0.011, 1.515, 0.104], [s * 0.04 + 0.011, 1.545, 0.104], [s * 0.04 - 0.011, 1.545, 0.104], 0x1a1210, null, NZ));
        if (hash(i, row + 21) < 0.5) {
          [-1, 1].forEach(s => {
            if (s < 0 || hash(i, row + 33) < 0.5) arms.at(s * 0.2, 1.62, 0.02, (h) => h.box(0.08, 0.55, 0.08, girl ? 0xeeeeea : 0x2c4250));
            if (s < 0 || hash(i, row + 33) < 0.5) arms.at(s * 0.2, 1.93, 0.02, (h) => h.box(0.08, 0.08, 0.08, skin));
          });
        }
        base.pop();
        arms.pop();
      }
      rows.push({ z, base: r.mesh(base), arms: r.mesh(arms), phase: hash(row, 99) });
    }
    return rows;
  }

  function tree(b, x, z, s, col) {
    b.at(x, 0, z, (h) => {
      h.prism(6, 0.14 * s, 0.14 * s, 0, 0.1 * s, 0.1 * s, 2.2 * s, 0x4a3a2c);
      [[0, 2.6, 0, 1.3], [0.6, 2.2, 0.3, 0.9], [-0.5, 2.3, -0.2, 1.0], [0.1, 3.3, 0.1, 0.9]].forEach(([dx, dy, dz, rr]) => h.at(dx * s, dy * s, dz * s, (c) => c.ellipsoid(rr * s, rr * 0.85 * s, rr * s, 8, 5, col || 0x2e4a3e)));
    });
  }

  function building(b, x, z, w, h, d, ry, floors) {
    b.push(M4.translate(x, 0, z), M4.rotY(ry || 0));
    b.at(0, h / 2, 0, (c) => c.box(w, h, d, 0xc4c8c6));
    b.at(0, h + 0.15, 0, (c) => c.box(w + 0.3, 0.3, d + 0.3, 0xa8acaa));
    const nf = floors || 4;
    const cols = Math.floor(w / 2.2);
    for (let f = 0; f < nf; f++) {
      const y = 1.4 + f * (h - 1.6) / nf;
      b.at(0, y - 0.55, d / 2 + 0.06, (c) => c.box(w, 0.14, 0.12, 0xb0b4b2));
      for (let k = 0; k < cols; k++) {
        const xx = -w / 2 + (k + 0.5) * (w / cols);
        b.at(xx, y + 0.35, d / 2 + 0.01, (c) => c.box(w / cols * 0.72, 1.1, 0.02, [0.32, 0.4, 0.44, 0.15]));
      }
    }
    b.pop();
  }

  function rainGround(b, col) {
    tiles(b, -40, -40, 40, 40, 10, 10, 0, col, shade(col, 0.95));
  }

  function buildRainGate(b) {
    rainGround(b, 0x5c666c);
    building(b, 2, -24, 44, 15, 12, 0.18, 4);
    tree(b, -9, -9, 1.5);
    tree(b, -11, -14, 1.7);
    tree(b, 9.5, -9.5, 1.5);
    tree(b, 12, -15, 1.8);
    [-2.6, 2.6].forEach(x => b.at(x, 3.05, -6, (h) => h.prism(8, 0.07, 0.07, -3.05, 0.06, 0.06, 3.05, 0x8a7a5e)));
    b.at(0, 5.35, -6, (h) => h.box(5.6, 1.6, 0.1, 0x2e3e6a));
    for (let i = 0; i < 64; i++) {
      const k = i / 64;
      const per = 2 * (5.7 + 1.7);
      let d = k * per, x, y;
      if (d < 5.7) { x = -2.85 + d; y = 6.2; } else if ((d -= 5.7) < 1.7) { x = 2.85; y = 6.2 - d; } else if ((d -= 1.7) < 5.7) { x = 2.85 - d; y = 4.5; } else { d -= 5.7; x = -2.85; y = 4.5 + d; }
      b.at(x, y, -5.9, (h) => h.ellipsoid(0.13, 0.11, 0.08, 6, 4, i % 3 ? 0xe8a4bc : 0xf4c4d2));
    }
    [[-3.5, -2.2], [3.2, -2.6]].forEach(([x, z]) => {
      b.at(x, 2.4, z, (h) => h.box(3.2, 0.06, 2.4, 0xe8ecec));
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => b.at(x + sx * 1.5, 1.2, z + sz * 1.1, (h) => h.box(0.05, 2.4, 0.05, 0xb0b4b4))));
    });
  }

  function tent(b, x0, x1, z0, z1, h) {
    b.quad([x0, h, z1], [x1, h, z1], [x1, h + 0.5, (z0 + z1) / 2], [x0, h + 0.5, (z0 + z1) / 2], 0xe8eef0);
    b.quad([x0, h + 0.5, (z0 + z1) / 2], [x1, h + 0.5, (z0 + z1) / 2], [x1, h, z0], [x0, h, z0], 0xdce4e6);
    const n = Math.round((x1 - x0) / 0.4);
    for (let i = 0; i < n; i++) {
      const xa = lerp(x0, x1, i / n), xb = lerp(x0, x1, (i + 1) / n), xm = (xa + xb) / 2;
      b.quad([xa, h, z1], [xb, h, z1], [xb, h - 0.18, z1], [xa, h - 0.18, z1], 0xe8eef0, null, NZ);
      b.tri([xa, h - 0.18, z1], [xb, h - 0.18, z1], [xm, h - 0.3, z1], 0xe8eef0, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    }
    [x0, x1].forEach(x => [z0, z1].forEach(z => b.at(x, h / 2, z, (c) => c.box(0.05, h, 0.05, 0xb8bcbe))));
  }

  function buildRainStalls(b) {
    rainGround(b, 0xb6bec2);
    b.at(0, 0.06, 1.2, (h) => h.box(30, 0.12, 0.25, 0x9aa2a6));
    tent(b, -6.5, 1.5, -3.2, -0.2, 2.3);
    [[-5.5, -2.1], [-3.4, -2.3], [-1.3, -2.2], [0.6, -2.4]].forEach(([x, z], i) => {
      b.at(x, 0.4, z, (h) => h.box(1.5, 0.05, 0.7, 0x8a6a4a));
      [-1, 1].forEach(sx => b.at(x + sx * 0.7, 0.2, z, (h) => h.box(0.04, 0.4, 0.6, 0x6a6a6a)));
      b.at(x, 0.52, z, (h) => h.box(0.9, 0.2, 0.5, [0.55, 0.75, 0.9, 0.2]));
      for (let k = 0; k < 4; k++) b.at(x - 0.5 + k * 0.33, 0.5, z + 0.22, (h) => h.box(0.1, 0.14, 0.1, [0xe05050, 0xf0c040, 0x60a0e0, 0x80c060][(k + i) % 4]));
    });
    b.push(M4.translate(-4.4, 0, -0.4), M4.rotY(0.25));
    [-1, 1].forEach(sx => b.at(sx * 0.3, 0.55, -0.1, (h) => h.box(0.04, 1.1, 0.04, 0x8a7a6a)));
    b.at(0, 0.75, 0, (h) => h.box(0.75, 1.0, 0.03, 0xf2f0ea));
    b.pop();
    b.at(4.5, 0.42, -4.5, (h) => h.box(3.2, 0.06, 0.6, 0x7a4a2a));
    [-1.4, 1.4].forEach(dx => b.at(4.5 + dx, 0.2, -4.5, (h) => h.box(0.05, 0.4, 0.5, 0x7a7a7a)));
  }

  function buildRainGym(b) {
    rainGround(b, 0x6a7272);
    b.at(0, 4.5, -6, (h) => h.box(18, 9, 10, 0xb4bcbe));
    b.at(1.5, 3.6, -0.4, (h) => h.box(12, 0.5, 3.0, 0xa8b0b2));
    [-3.4, 6.2].forEach(x => b.at(x, 1.8, 0.8, (h) => h.box(0.4, 3.6, 0.4, 0xa8b0b2)));
    for (let k = 0; k < 4; k++) b.at(-0.6 + k * 1.6, 1.25, -0.98, (h) => {
      h.box(1.4, 2.5, 0.06, 0x2a6a5a);
      h.at(0.5, 0, 0.04, (c) => c.ellipsoid(0.05, 0.05, 0.03, 6, 4, 0xd8d8d0));
      h.at(0, 0.5, 0.035, (c) => c.box(1.0, 0.9, 0.01, [0.3, 0.42, 0.42, 0.2]));
    });
    for (let s = 0; s < 5; s++) b.at(1.4, 0.1 + s * 0.2, 2.6 - s * 0.35, (h) => h.box(8, 0.2, 0.4, 0xbcc4c4));
    [-3.0, 5.8].forEach(x => b.at(x, 0.6, 1.6, (h) => h.box(0.25, 1.2, 2.8, 0xb0b8b8)));
    b.at(-6.5, 1.5, -0.8, (h) => h.box(3.5, 3.0, 2.0, 0xc0c8c8));
    [-7.3, -6.0].forEach(x => b.at(x, 2.0, 0.22, (h) => h.box(0.35, 0.6, 0.02, 0x3a4446)));
    tree(b, -9, 2, 1.6, 0x3a5a48);
    tree(b, 9, 1, 1.5, 0x3a5a48);
    tree(b, 0, -14, 2.2, 0x2a4438);
  }

  function buildRainSchool(b) {
    rainGround(b, 0x5e6a56);
    tiles(b, -30, -2, 30, 30, 6, 6, 0.01, 0x7a7a62, 0x76765e);
    building(b, -9, -16, 26, 13, 11, 0.12, 4);
    building(b, 14, -22, 22, 12, 10, -0.1, 4);
    for (let i = 0; i < 12; i++) tree(b, -20 + i * 3.6, -7 + hash(i, 4) * 2, 1.3 + hash(i, 5) * 0.5);
    b.at(0, 0.6, -3.5, (h) => h.box(50, 1.2, 0.08, 0x8a9690));
    b.push(M4.translate(7, 0, 8), M4.rotY(-0.3));
    [-1.8, 1.8].forEach(x => b.at(x, 1.1, 0, (h) => h.box(0.08, 2.2, 0.08, 0xf2f2f2)));
    b.at(0, 2.2, 0, (h) => h.box(3.7, 0.08, 0.08, 0xf2f2f2));
    b.pop();
  }

  const BUILD = { gym: buildGym, rainGate: buildRainGate, rainStalls: buildRainStalls, rainGym: buildRainGym, rainSchool: buildRainSchool };

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

  function texBanner(ctx, w, h) {
    ctx.fillStyle = '#f2e45a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d8c440';
    ctx.fillRect(0, h - 4, w, 4);
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(h * 0.62)}px "MS Gothic", "Yu Gothic", sans-serif`;
    ctx.fillStyle = '#2a2a1a';
    ctx.fillText('北高祭', w * 0.05, h * 0.54);
    ctx.font = `bold ${Math.round(h * 0.7)}px Arial, sans-serif`;
    ctx.fillStyle = '#e8641e';
    ctx.fillText('THE LIVE', w * 0.4, h * 0.56);
  }

  function texGate(ctx, w, h) {
    ctx.fillStyle = '#2e3e6a';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(h * 0.7)}px "MS Gothic", "Yu Gothic", serif`;
    ctx.fillStyle = '#c03040';
    ctx.fillText('北 高 祭', w / 2, h * 0.54);
  }

  function texDrink(ctx, w, h) {
    ctx.fillStyle = '#f2f0ea';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cols = ['#e86a2a', '#2a8a5a', '#2a6ad0', '#d03a6a'];
    ['ド', 'リ', 'ン', 'ク'].forEach((ch, i) => {
      ctx.font = `bold ${Math.round(h * 0.2)}px "MS Gothic", sans-serif`;
      ctx.fillStyle = cols[i];
      ctx.fillText(ch, w * (0.62 - (i % 2) * 0.12), h * (0.14 + i * 0.22));
    });
    ctx.fillStyle = '#5a9ad8';
    ctx.fillRect(w * 0.12, h * 0.3, w * 0.2, h * 0.3);
  }

  function create(r) {
    const X = Cast.makeCast(r);
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    const T = {
      glow: r.texture(64, texGlow, { clamp: true }),
      banner: r.texture(512, texBanner, { height: 64, clamp: true }),
      gate: r.texture(256, texGate, { height: 64, clamp: true }),
      drink: r.texture(128, texDrink, { clamp: true })
    };
    const texQuad = (x0, y0, x1, y1, n) => mk(b => b.quad([x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [1, 1, 1, n === undefined ? 0.5 : n], [[0, 0], [1, 0], [1, 1], [0, 1]], NZ));
    const Q = {
      unit: mk(b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], null, NZ)),
      sprite: mk(b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], NZ)),
      banner: texQuad(-2.3, -0.33, 2.3, 0.33, 0.62),
      gate: texQuad(-2.6, -0.7, 2.6, 0.7, 0.3),
      drink: texQuad(-0.36, -0.48, 0.36, 0.48, 0.4),
      crash: mk(b => cymbalMesh(b, 0.22)),
      ride: mk(b => cymbalMesh(b, 0.25)),
      stick: mk(b => {
        b.prism(6, 0.0075, 0.0075, 0, 0.0095, 0.0095, 1, 0xd8b880, { capBottom: true });
        b.at(0, 1.0, 0, (h) => h.ellipsoid(0.011, 0.016, 0.011, 6, 4, 0xe8d0a0));
      })
    };
    const sets = {};
    const setFor = (id) => sets[id] || (sets[id] = mk(BUILD[id]));
    let rows = null;
    const crowd = () => rows || (rows = crowdRows(r));

    const BULBS = [];
    for (let k = 0; k < 18; k++) BULBS.push([-6.2 + k * 0.73, 4.9, 0.02]);
    for (let k = 0; k < 22; k++) BULBS.push([-6.3 + k * 0.6, 5.22, -1.52]);
    [-1, 1].forEach(s => { for (let k = 0; k < 10; k++) BULBS.push([s * 6.95, 1.25 + k * 0.38, -0.32]); });

    function envFor(st) {
      const L = st.light;
      const cm = st.camera;
      const f = V3.norm(V3.sub(cm.at, cm.eye));
      let rt = V3.cross(f, [0, 1, 0]);
      if (V3.len(rt) < 1e-3) rt = [1, 0, 0];
      rt = V3.norm(rt);
      const keyDir = V3.norm(V3.add(V3.add(V3.mul(f, 0.6), V3.mul(rt, 0.45)), [0, -0.62, 0]));
      if (L.mode === 'hall') {
        const env = { sunDir: V3.norm([0.15, -0.35, 0.92]), sunColor: [0.78, 0.64, 0.46], ambTop: [0.2, 0.27, 0.32], ambBottom: [0.07, 0.09, 0.12], fogColor: [0.06, 0.09, 0.11], fogNear: 9, fogFar: 34, points: [{ pos: [0, 3.0, -0.6], color: [1.3, 1.05, 0.7] }] };
        if (L.stageGlow) env.points = [{ pos: [0, 2.6, -2.2], color: [2.4, 2.0, 1.4] }, { pos: [-3, 0.4, 2.2], color: [1.2, 0.95, 0.65] }];
        return env;
      }
      if (L.mode === 'rain') {
        return { sunDir: V3.norm([-0.3, -0.9, -0.3]), sunColor: [0.36, 0.42, 0.44], ambTop: [0.55, 0.62, 0.64], ambBottom: [0.3, 0.35, 0.36], fogColor: [0.62, 0.7, 0.72], fogNear: L.far ? 20 : 6, fogFar: L.far || 46, points: [] };
      }
      if (L.mode === 'back') {
        return { sunDir: V3.norm([0.8, -0.25, 0.3]), sunColor: [1.15, 0.98, 0.78], ambTop: [0.36, 0.3, 0.28], ambBottom: [0.18, 0.14, 0.13], fogColor: [0.98, 0.95, 0.88], fogNear: 60, fogFar: 140, points: [] };
      }
      const warm = L.warm ? [1.08, 0.9, 0.66] : [1.0, 0.93, 0.8];
      const env = {
        sunDir: L.mode === 'key' ? keyDir : V3.norm([0.2, -0.62, -0.76]),
        sunColor: warm.map(v => v * (L.dim || 1)),
        ambTop: [0.5, 0.46, 0.42],
        ambBottom: [0.26, 0.21, 0.19],
        fogColor: [0.95, 0.94, 0.9],
        fogNear: 60,
        fogFar: 140,
        points: []
      };
      if (L.crowdDark) env.points.push({ pos: [0, 2.2, 0.4], color: [0.6, 0.5, 0.36] });
      return env;
    }

    function clearColor(st) {
      if (st.light.mode === 'hall') return [0.06, 0.09, 0.11];
      if (st.light.mode === 'rain') return [0.62, 0.7, 0.72];
      return [0.95, 0.94, 0.9];
    }

    function drawCrowd(st, t) {
      const c = st.crowd;
      if (!c) return;
      const e = energyAt(t);
      const hall = st.light.mode === 'hall';
      crowd().forEach(row => {
        if (row.z < (c.from || 0) || row.z > (c.to || 99)) return;
        const hop = bob(t + row.phase * 0.12) * 0.045 * e;
        const M = M4.translate(0, hop, 0);
        const tint = hall ? null : [0.55, 0.52, 0.5];
        r.draw(row.base, M, tint ? { tint } : {});
        if (c.cheer) r.draw(row.arms, M4.translate(0, hop + 0.04 * punch(t + row.phase * 0.1), 0), tint ? { tint } : {});
      });
    }

    function drawStageDynamic(st, t) {
      const ci = lastIndex(CRASHES, t);
      const since = ci >= 0 ? t - CRASHES[ci] : 9;
      const wob = Math.exp(-since * 3.2) * 0.16 * S(since * 26);
      r.draw(Q.crash, M4.chain(M4.translate(DX + 0.48, 1.12, DZ + 0.64), M4.rotX(-0.32 + wob), M4.rotZ(0.12 + wob * 0.5)), {});
      r.draw(Q.ride, M4.chain(M4.translate(DX - 0.56, 1.02, DZ + 0.52), M4.rotX(-0.2), M4.rotZ(-0.15)), {});
      r.draw(Q.banner, M4.chain(M4.translate(0.35, 3.62, -6.34), M4.rotZ(0.04)), { texture: T.banner });
      const cm = st.camera;
      BULBS.forEach(p => {
        const d = V3.len(V3.sub(p, cm.eye));
        if (d > 30) return;
        r.draw(Q.sprite, M4.chain(M4.translate(p[0], p[1], p[2]), billboard(cm), M4.scale(0.32)), { texture: T.glow, additive: true, tint: [1, 0.78, 0.42], noFog: true, alpha: 0.75 });
      });
      st.cast.forEach(a => (a.sticks || []).forEach(sk => {
        if (!sk.hand) return;
        const dir = V3.sub(sk.tip, sk.hand);
        const len = V3.len(dir) + 0.05;
        r.draw(Q.stick, M4.chain(M4.translate(sk.hand[0], sk.hand[1], sk.hand[2]), alignY(V3.norm(dir)), M4.translate(0, -0.05, 0), M4.scale(1, len, 1)), {});
      }));
    }

    function drawRainProps(st, t) {
      if (st.set === 'rainGate') r.draw(Q.gate, M4.chain(M4.translate(0, 5.35, -5.93)), { texture: T.gate });
      if (st.set === 'rainStalls') r.draw(Q.drink, M4.chain(M4.translate(-4.4, 0.75, -0.37), M4.rotY(0.25)), { texture: T.drink });
    }

    let polys = 0;
    const tally = () => { polys += r.polys; r.polys = 0; };
    const over = () => {
      tally();
      r.begin(OVER_ENV, { proj: ORTHO, view: M4.ident() }, { x: 0, y: 0, w: FW, h: FH }, true);
    };
    const rect = (x, y, w, h, opts) => r.draw(Q.unit, M4.chain(M4.translate(x, y, 0), M4.scale(w, h, 1)), Object.assign({ noFog: true }, opts));
    const streak = (x, y, len, ang, alpha) => r.draw(Q.unit, M4.chain(M4.translate(x, y, 0), M4.rotZ(ang), M4.scale(1.2, len, 1)), { noFog: true, flat: [0.92, 0.96, 1, alpha], blend: true });

    function drawRain(t) {
      over();
      for (let i = 0; i < 170; i++) {
        const sp = 520 + hash(i, 1) * 260;
        const y = MAIN.y + MAIN.h - ((hash(i, 2) * MAIN.h + t * sp) % (MAIN.h + 40));
        const x = (hash(i, 3) * (FW + 60) - 30 + (MAIN.y + MAIN.h - y) * 0.12) % FW;
        if (y < MAIN.y || y > MAIN.y + MAIN.h - 20) continue;
        streak(x, y, 14 + hash(i, 4) * 22, 0.12, 0.18 + hash(i, 5) * 0.25);
      }
    }

    function drawWorld(st, t) {
      r.draw(setFor(st.set), null, {});
      if (st.set === 'gym') {
        drawStageDynamic(st, t);
        drawCrowd(st, t);
      } else {
        drawRainProps(st, t);
      }
      st.cast.forEach(a => Cast.drawActor(r, X, a));
    }

    return {
      warm() {
        Object.keys(BUILD).forEach(setFor);
        crowd();
        [8, 20, 40, 60, 80, 130, 145].forEach(t => band(t));
      },
      render(t) {
        polys = 0;
        r.polys = 0;
        const shot = shotAt(t);
        const st = worldFor(t, shot);
        r.clear([0, 0, 0]);
        r.begin(Object.assign(envFor(st), { fogColor: clearColor(st) }), st.camera, MAIN);
        drawWorld(st, t);
        if (st.light.mode === 'rain') drawRain(t);
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
    id: 'god-knows',
    number: 8,
    artist: 'Харухи Судзумия',
    title: 'God knows...',
    originalYear: 2006,
    audio: 'content/clip/Haruhi Suzumiya - God knows.mp3',
    duration: DURATION,
    bpm: BPM,
    beat0: BEAT0,
    poster: 70.8,
    locations: LOCATIONS,
    shots: SHOTS,
    looks: CHARACTERS,
    shotAt,
    stage,
    fadeAt,
    voiceAt,
    mouthFor,
    energyAt,
    create
  };

  window.poligonClips = window.poligonClips || [];
  if (!window.poligonClips.some(c => c.id === clip.id)) window.poligonClips.push(clip);
})();
