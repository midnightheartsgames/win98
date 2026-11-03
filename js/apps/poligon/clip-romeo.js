(function () {
  const { M4, V3, Builder } = window.P3D;
  const { restPose } = window.P3DFigure;
  const Cast = window.P3DCccCast;
  const GK = window.P3DGodKnowsCast;
  const RC = window.P3DRomeoCast;

  const BPM = 170;
  const BEAT0 = 0.241;
  const BEAT = 60 / BPM;
  const STEP = BEAT * 2;
  const DURATION = 280.38;
  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const smooth = (x) => { const k = clamp(x, 0, 1); return k * k * (3 - 2 * k); };
  const frac = (x) => x - Math.floor(x);
  const hash = (i, k) => frac(S(i * 127.1 + (k || 0) * 311.7) * 43758.5453);
  const beatAt = (t) => (t - BEAT0) / STEP;
  const bob = (t, lag) => 0.5 + 0.5 * C(2 * PI * (beatAt(t) - (lag === undefined ? 0.06 : lag)));
  const mixV = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const addV = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

  const LOCATIONS = [
    { id: 'rose', name: 'Витраж-часы', color: '#c050c8', scene: 'tower' },
    { id: 'clock', name: 'У циферблата', color: '#7a78b8', scene: 'tower' },
    { id: 'close', name: 'Крупные планы', color: '#2cc4b8', scene: 'tower' },
    { id: 'platform', name: 'Площадка', color: '#8a8aa0', scene: 'tower' },
    { id: 'town', name: 'Город', color: '#e0a040', scene: 'tower' }
  ];

  const SHOT_LIST = [
    [0, 'rose', 'glassOpen'], [1.134, 'clock', 'turnIn'], [6.973, 'clock', 'handUp'], [11.344, 'close', 'preview'], [12.479, 'town', 'title'],
    [18.618, 'platform', 'brideWide'], [21.288, 'clock', 'brideStaff'], [23.256, 'close', 'bowClose'], [23.523, 'close', 'corsage'], [23.79, 'close', 'roseFace'],
    [24.09, 'clock', 'brideSing'], [29.462, 'platform', 'shaftSide'], [31.932, 'clock', 'brideSway'], [35.235, 'platform', 'shaftWide'], [38.271, 'close', 'skirtLow'],
    [41.141, 'close', 'shh'], [43.376, 'clock', 'pointSky'], [46.346, 'rose', 'roseWide1'], [49.282, 'clock', 'pointSide'], [50.55, 'clock', 'raiseSwap'],
    [51.751, 'close', 'blackProfile'], [54.621, 'platform', 'blackWide'], [55.488, 'close', 'eyesShut'], [56.222, 'close', 'legsTurn'], [57.657, 'platform', 'highWide'],
    [60.093, 'clock', 'blackDance'], [62.996, 'clock', 'blackSing'], [64.631, 'clock', 'blackSing2'], [66.566, 'clock', 'blackReach'], [69.035, 'rose', 'roseWide2'],
    [70.036, 'clock', 'swapDance'], [71.75, 'platform', 'railWide'], [72.505, 'clock', 'sleekUp'], [74.307, 'close', 'sleekTilt'], [76.109, 'close', 'sleekShut'],
    [77.911, 'clock', 'sleekStaff'], [81.715, 'clock', 'appendUp'], [84.417, 'close', 'appendBack'], [87.12, 'clock', 'appendDance'], [90.423, 'clock', 'wandSwap'],
    [93.426, 'close', 'suitClose'], [96.062, 'rose', 'pullBack'], [98.15, 'town', 'townPan'], [105.25, 'platform', 'suitWalk'], [107.574, 'clock', 'suitWand'],
    [109.542, 'close', 'flashLegs'], [109.709, 'close', 'santaFlash1'], [109.976, 'close', 'santaFlash2'], [110.276, 'clock', 'santaSing'], [115.649, 'platform', 'santaSide'],
    [118.118, 'clock', 'santaTurn'], [121.421, 'platform', 'santaShaft'], [124.457, 'close', 'santaLegs'], [127.327, 'close', 'santaClose'], [129.562, 'clock', 'santaReach'],
    [132.532, 'rose', 'roseWide3'], [135.468, 'clock', 'santaPoint'], [136.736, 'clock', 'raiseSwap2'], [137.937, 'close', 'dressProfile'], [140.807, 'platform', 'dressSpin'],
    [141.675, 'close', 'dressShut'], [142.409, 'close', 'dressHip'], [143.843, 'platform', 'dressSteps'], [146.279, 'clock', 'dressWalk'], [149.182, 'clock', 'dressSing'],
    [150.817, 'clock', 'dressSing2'], [152.786, 'clock', 'dressReach'], [155.255, 'rose', 'roseWide4'], [156.256, 'rose', 'gothWide'], [157.95, 'platform', 'gothRail'],
    [158.725, 'close', 'gothCuffs'], [160.527, 'close', 'gothLow'], [162.328, 'close', 'gothShut'], [164.13, 'clock', 'gothSwap'], [167.901, 'clock', 'punkPose'],
    [170.637, 'close', 'punkHips'], [173.339, 'clock', 'punkWand'], [176.643, 'clock', 'punkSwap'], [179.646, 'close', 'gothClose'], [182.282, 'rose', 'gothPull'],
    [184.95, 'town', 'spire1'], [185.485, 'town', 'houses'], [188.221, 'platform', 'farSide'], [190.49, 'platform', 'kneelSwap'], [194.127, 'platform', 'kneelHigh'],
    [196.029, 'clock', 'kneelIvy'], [201.935, 'close', 'kneelMic'], [204.437, 'platform', 'kneelSil'], [207.607, 'close', 'kneelLow'], [210.677, 'clock', 'mintKnee'],
    [213.279, 'platform', 'mintDance'], [217.617, 'rose', 'towerWide'], [218.918, 'rose', 'roseHit'], [219.319, 'clock', 'spreadHit'], [219.686, 'clock', 'mintSpread'],
    [221.588, 'clock', 'mintHold'], [222.6, 'town', 'houseFlash'], [222.75, 'town', 'spireFlash'], [222.922, 'clock', 'appendBack2'], [224.324, 'clock', 'appendReach'],
    [226.659, 'clock', 'appendPose'], [229.963, 'close', 'appendTilt'], [232.465, 'clock', 'appendSwap'], [235.301, 'platform', 'punkStomp'], [237.837, 'clock', 'punkSing'],
    [241.174, 'platform', 'punkWide'], [243.843, 'clock', 'punkSwap2'], [246.98, 'clock', 'scarletWave'], [248.982, 'close', 'scarletKick'], [252.352, 'platform', 'scarletWide'],
    [254.554, 'clock', 'scarletWhip'], [255.855, 'clock', 'scarletPoint'], [258.191, 'clock', 'skyTilt'], [263.963, 'clock', 'scarletUp'], [265.965, 'close', 'scarletClose'],
    [268.868, 'platform', 'topSpin'], [272.972, 'close', 'backLook'], [274.407, 'rose', 'finale']
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

  const CUT_TIMES = new Set(SHOT_LIST.map(s => s[0]));

  const COSTUMES = [
    [0, 'mikuScarlet'], [11.344, 'mikuSundress'], [12.479, 'mikuScarlet'], [18.618, 'mikuBride'], [51.1, 'mikuBlack'], [70.6, 'mikuSleek'],
    [80.3, 'mikuAppend'], [91.6, 'mikuSuit'], [109.709, 'mikuSanta'], [137.15, 'mikuSundress'], [155.9, 'mikuGothic'], [167.0, 'mikuPunk'],
    [178.1, 'mikuGothic'], [190.9, 'mikuMint'], [222.922, 'mikuAppend'], [234.75, 'mikuPunk'], [246.2, 'mikuScarlet']
  ];
  const MIX = 0.42;
  const dissolves = COSTUMES.filter(([t], i) => i > 0 && !CUT_TIMES.has(t)).map(([t]) => t);

  function costumeAt(t) {
    let i = 0;
    while (i + 1 < COSTUMES.length) {
      const [tn] = COSTUMES[i + 1];
      if (t >= (CUT_TIMES.has(tn) ? tn : tn - MIX / 2)) i++; else break;
    }
    const [t0, form] = COSTUMES[i];
    if (i > 0 && !CUT_TIMES.has(t0)) {
      const k = span(t, t0 - MIX / 2, t0 + MIX / 2);
      if (k < 1) return { form, prev: COSTUMES[i - 1][1], mix: smooth(k) };
    }
    return { form, prev: null, mix: 1 };
  }

  const fadeAt = (t) => smooth(span(t, 277.3, 278.0));

  const VOICE = '000000000000bge600jwytswumpttsutmruuvvuuutuvvuspnrsqrrrqppsvvtvxxwxxxxxxvursvsjsuopuurtvrsutsttrjnrpqtrld69vzzxwvruvrqtvvvvurxzzzzxunsvvusntxwvsmftwvvvtrqqnmtvvvvwwvtotyywxyvuyzzwrmswwvuussvwxwuqowyxtpppsrksvvvuuuttssrrrsrrssrplknmgbksvvtssqsvsdsvtssqknrrppoinstrrsspmke10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000mushmtrpwwrtxvptuqrrpmsuqruxywolkeiouwvurpnvwqlosqossl0hlqrnfgkktvrhrurrrqppporssstutuvwurstwxwvvurqwwonrsqomf000fnnhlprqwxrsyzyyyxtlifd5000emopnlpsqoqnruttsokmuxxwtqgrxyxxxwsqneddlsvuuuutrstttttsttttttsrssqplf860000000000000lponklomkwzzwuroqqoqqmhvxqosstttspkdiuxxxwuqxysnllepttqk09uvnnsuquywspssppolhjorsojsuuvxxupofsyyxxwrsxwtsurpttph00nronmpqpvyutyzyyyywsql700000grriipqortqpuvtsrnhptuurgnuwvvvvutsqsutrstuwvutsrtsqrtuuuutrl700014lvwsrsrrturoyztvzzzzzvquuuyyxxywtwvrquuswwmsvvutsrsurrwwtturrwwpluxutxxuxzxwwvtusowzzzzxtwytmsrglsrowzyssuqsvutvwupehptuuuurqtuspoiiqsnfmnqttttusstrhqurntuoqvsiwyyywvpswvuvrhswtlsrhuwqrvutttqhqsqqrstsrpnoqpnlmnnmjb0000000000gqrrutptvrtwuoongstooopnrsnrxyyzzzzzysqtuvxyuuyzzyvtxzwsyzzyusqtwuqsrmvzytwzzzvlntvwyzxxxvruxumpsnlpqqvwvwvslsursvvtl3hsuusqojjqrpqpnprrrrplnrstuurpsvrc00sxvsuwwxwussssqwzyvtpntwwvtn9rwxvq8mrrsrprlwzyqvvnruqltvqtyzxsmlswvspsuuuutuuussssohbba8960000000000000000000000fottmrvvuurjmtvututstrkmnhnstsuwxvrtrsvsquvuvxxywsqtvvurnhpsonuuuvusmsuouyyxxupuxtowxqvytrvxxwxxuttqrvvuvwtpxzzwj5lwyutuutrprsrrqtvsohmrvusslpptupquutvwripsrqtsoh41txtkmqqpoppoojqtrpliklmnpqnnsuvtqutrutquyzzxywrsrqxzzug5qxzzyuqnrrmtvuwxuoottsvvpqxxtprsqonpuvrtxwstwvtuskrutuurkrusprrquwusuvvvutqvzwwzzyzzzxwvqvywvywouyzzyyuuyzxxyxxxtltvusrsruwvuutssqqrssstutpghruttruvrsvtuzypsrpqvxurttsrrrsspnppptxxrsuurmmmmjfqutroj9qtsrsrjqtstvyzxwwqlrqovzyqb8syzxwvtqsvttuuttqpsxxrtxxvssquwqrvvtsqkrvwxywrlsuvuqiqvvuuuustuuwxutxyyyyyxwwwwvsppquwwwwtrrqqmfhf74000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009lrsqortqftwuuupmuwpqwvrtuqpxyyzyvrrvvxyyxtnmorqqvvoowxwq00koopsrksvttuurtyworsporpdrvvvuohuwvwwxywqmlpphtxunxyuo234bbjnqppxwhqwwvutspi700000004tvojrrlpsqnsssspmqrprtusoqsrrrrrolkoqnlstsrqqqqpqrssssssrppqpoppomi4000009b710000000gpropssrruuuvusqomorqqsrkrwwvusttqjgwzxxyxupqqmpsropppl0kqtsqturtuppvvkptqhuu9muvvwwutusptxxwwwwxxxuwwnqttsrrqmb0nrqoloooxyruzzxxyyxvrlb00000fttkiqtrsutqvvttrohptuuslmvwvuvvussrsutqtvutssssssstutsrqrsspjeda30ivxtorrqstplqqnrutsrqmotstyzyxwusuuontwuvxtswvtttplstsyzyxspntumjrtswyvszzzr20msrkuzyyzzvsusnuxuswtivxttwuonqorvvtodbowywvqdpwxqsvskrsooppqsstuvsiwzusywluwspqnhuwusqpmuxurnc8svrouwtrtttuvuurjeuxunkmmmmnnnmlkkljikifd90000000000mvyuqvvrsvurtrhvyyzzxvttqtxxurrqrvvsrttpwxqtwvuvqfpvtrxywxyvsvulksvvvwsouvuuvtpqrqvxwutrpuurpvwnkpoluxstxvmsvrrvvsmchmsusrrrqsrhsupnoonmkfkrttuutrsush33gvwqouwusqppoppwywusrrtuutrqpqttqj2jttttvxruwqrutrsurjophqtttssoquvuqrsssssttsrqqpmifd931000000000000000000000000ovvqqvyxyyvqvxsuvptwtksuofnrstvwtosrturqtusuyyxse6rwuouurrttrstuuslgrsqtvvuutpoxzxvustvuquwvwxwtqplntusstsouxxwpbjuvmqxywwuqrvwsrutqh3iuussqsqttqruulrupgprrrturk53rwufjmlmommomnoqrqnlnmnpqnlossutqtqptrorwyyxwuoqqmtxwpd0owyvoeckvwpqtsssstrqtsssmpusqsrppqtttttuusltxxxyvmsvuutvvrpooqrrtxvmtwxzzxstzzuppommkrwxvuusuwxxvtvwtkorssrvxwxwqktxxthjquwusssssqqrtuututpe0guvtsturtwvuuurxyuquwtqrpjf71qwxvutnqtpnqrqqqqqojfpttrl40twtrtwtruqdrwurqqpnsrouzxnbbqxywwvvtstptyzyxtoqvvpsxwsqrqtvsotsfqrkqutsrsssuwxxvvuuuuvwuspqrtvuuvvttuvvuutssststutqoqqrqonjdda46413688689886897666bdccec8425630000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000794550mvywowzzvhlovyxwvttutnswvsrqlrwtpvxvtroouxwutqiuxurststrnmvwtstuwwtirwwvutpswwtvxxwtomtvspjfiom0nvxwvvwwvtqj000000suplvxtl43juwtuuusrrqrtsrrqnrxvhsvutttqtvomssnlqoiuxwwwxwvttuvvvvqcrwxun82nuvqtxywspnqtutrssod0lsvwvvwwvo0000000hswtowyxue0juwvtpnptuqqyzyxuoswvrvwtstsqoqo2004rvsruvti10mstopvtl600swwurhkqttstvvtqkcqttttstrm3hrtrqpqpnib0000000ottttusl0josuurd06wzxvzzzxwsluwtuvtssttqqojqrkruspuxyxvpgrtrtwwvvusqssrstootrmuvuvwwstxyzxvrmijowxvtspmqpmsutttsrtvvusrttuuutrrsuxxxywqrvvuvwuuvvtutrvxwwwvqjpuvurtttuuuwwvvvuuvusrrrrssqrsssrrqne300000000000000000qwxwwteuzzxxvstyyszzrrvsrxxsouurxzxwwvwwwsouwuwzzzveewzulsttyyvtxzyzyyvzzwvzzzrprvvpivzzzzxtwxwwxwvvuuvyyyxwwvuvupdbmwxuwxvuvvtsuvuvwwvtpmuuuuwysxzwtxyuvyurvvtuxxwqabryzzwoevywsuuotyzxuqoprrrrodpuvsuyvtvtsuvwvuusorsqzzzs52uyyyxwuqtusvyyxuqnrxxtyzusvwuwxuqwyuvxtuxvpvzwtxwuwzzzwjdwzwjwystwsrzzzzzzvyzwwzzzxnaotusqnewyqrwyzzytnwzzyzzzwqpswxvqdotwxwwwxywsqsuvtwxxthprstzzwrmtvomwywvvurtusuwxum55qtnlrtttvtntwusssqponsxxtod9rvtmpttuxwuvvtttrmuvrrtvtn76mvxvvvusturtvutpntvvssyxsstrnvxrswwsuwvrpsrvwsrttnyzzzue9tywuurjtzztwyyyxvswxswzyyywnqvutvspuvrsvxyyxwtuusvyyyxwwuuvup50owxtvxwvvwtruuuuvwvtqkuwuuxyuyzvuxxsvzvotusuwwvoaostspnhcqrrtsusuyxwutpvzzxuskrvutwxuuwtrtvxxwurpssrzzvk66txxxwsrtwvuvuuutuuuvxvuvuusnowwpouvruvpsxxwwtrtxyxtlfryzyyxuosuttvuuxyzyxwwwxxwxwwvwwwwxxvuuvtmf8520000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
  const VOICE_LV = Array.from(VOICE, ch => parseInt(ch, 36) / 35);

  function voiceAt(t) {
    const f = t * 20;
    const i = Math.floor(f);
    if (i < 0 || i >= VOICE_LV.length) return 0;
    const a = VOICE_LV[i], b = VOICE_LV[i + 1] || 0;
    return a + (b - a) * (f - i);
  }

  const SINGING = [[0.6, 13.6], [24.3, 98.0], [110.4, 184.1], [196.7, 223.7], [224.3, 263.1]];
  const singing = (t) => SINGING.some(([a, b]) => t >= a && t <= b);

  function mouthFor(role, t) {
    if (role !== 'miku' || !singing(t)) return 0;
    return clamp((voiceAt(t) - 0.15) / 0.7, 0, 1);
  }

  const ENERGY = [[0, 0.45], [13.5, 0.55], [24.4, 0.6], [46.1, 0.72], [57.3, 0.78], [70.6, 1], [97.8, 0.6], [110.5, 0.65], [143.5, 0.75], [156.8, 1], [184, 0.5], [190.5, 0.3], [210.5, 0.6], [217.6, 0.85], [224.4, 1], [263, 0.7], [274.4, 0.4]];
  function energyAt(t) {
    let i = 0;
    while (i + 1 < ENERGY.length && ENERGY[i + 1][0] <= t) i++;
    const next = ENERGY[i + 1];
    if (!next) return ENERGY[i][1];
    return lerp(ENERGY[i][1], next[1], smooth(span(t, next[0] - 0.8, next[0])));
  }

  const CHARACTERS = {
    miku: { name: 'Хацунэ Мику' }
  };

  const ARMS = {
    micMouth: { abs: [0.04, 0.31, 0.2], mic: 'mouth' },
    micStaff: { abs: [0.21, 0.08, 0.1], mic: 'staff' },
    micLow: { a: [0.18, 0.05, 0.42, 0.12], mic: 'low' },
    micOut: { a: [1.2, 0.3, 0.8, 0.05], mic: 'wand' },
    micOut2: { a: [1.0, 0.2, 1.0, 0.08], mic: 'wand' },
    micForward: { a: [1.45, 0.05, 0.25, 0.05], mic: 'wand' },
    micCross: { abs: [0.14, 0.1, 0.18], mic: 'cross' },
    down: { a: [0.08, 0, 0.12, 0.12] },
    relax: { a: [0.2, 0.15, 0.22, 0.42] },
    swingFwd: { a: [0.45, 0.05, 0.12, 0.5] },
    swingBack: { a: [-0.32, 0, 0.12, 0.3] },
    swingIn: { a: [0.62, -0.45, 0.12, 1.35] },
    swingOut: { a: [0.42, 0.55, 0.35, 1.15] },
    up: { a: [2.95, 0.05, 0.12, 0.06] },
    upWave: { a: [2.6, 0.2, 0.42, 0.4], wig: [0, 0, 0.2, 0.25] },
    skyPoint: { a: [2.2, 0.15, 0.55, 0.05] },
    side: { a: [0.1, 0, 1.42, 0.03] },
    sideHigh: { a: [0.35, 0, 1.9, 0.05] },
    spread: { a: [0.15, 0, 1.3, 0.1] },
    reach: { a: [1.25, 0.15, 0.7, 0.06] },
    offer: { a: [1.0, 0.7, 0.35, 0.55] },
    point: { a: [1.5, 0.18, 0.05, 0.05] },
    point2: { a: [1.42, 0.22, 0.08, 0.12] },
    pointDown: { a: [0.75, 0.3, 0.12, 0.05] },
    byHead: { ik: [0.2, 0.62, 0.06], wig: [0, 0.15, 0.08, 0.2] },
    chest: { ik: [0.03, 0.27, 0.16] },
    lips: { ik: [0.0, 0.5, 0.15] },
    hip: { ik: [0.15, 0.03, 0.02] },
    skirt: { ik: [0.18, -0.06, 0.07] },
    behindHead: { ik: [0.1, 0.68, -0.07] },
    rodCross: { abs: [-0.06, 0.38, 0.22] },
    rodBelow: { abs: [0.0, 0.17, 0.23] }
  };

  const LEG_L = {
    stand: { hipL: [0.03, 0, 0.05], knL: [0.05, 0, 0], hipR: [0.03, 0, 0.05], knR: [0.05, 0, 0] },
    rest: { hipL: [0.16, 0.12, -0.02], knL: [0.34, 0, 0], hipR: [0.02, 0, 0.07], knR: [0.02, 0, 0] },
    apart: { hipL: [0.02, 0, 0.17], knL: [0.04, 0, 0], hipR: [0.02, 0, 0.17], knR: [0.04, 0, 0] },
    tap: { hipL: [0.1, 0, 0.3], knL: [0.14, 0, 0], hipR: [0.06, 0, 0.0], knR: [0.14, 0, 0] },
    walk: { hipL: [0.32, 0, 0.04], knL: [0.12, 0, 0], hipR: [-0.2, 0, 0.04], knR: [0.32, 0, 0] },
    kick: { hipL: [1.05, 0, 0.06], knL: [0.2, 0, 0], hipR: [0.05, 0, 0.05], knR: [0.08, 0, 0] },
    knee: { hipL: [1.15, 0, 0.1], knL: [1.5, 0, 0], hipR: [0.05, 0, 0.05], knR: [0.08, 0, 0] },
    kneel: { hipL: [0.95, 0.05, 0.2], knL: [2.5, 0, 0], hipR: [0.95, 0.05, 0.2], knR: [2.5, 0, 0] },
    kneelUp: { hipL: [1.5, 0, 0.12], knL: [1.5, 0, 0], hipR: [0.0, 0, 0.1], knR: [1.7, 0, 0] }
  };

  const LEGS = {};
  Object.keys(LEG_L).forEach(k => {
    const v = LEG_L[k];
    LEGS[k + 'L'] = v;
    LEGS[k + 'R'] = { hipL: v.hipR, knL: v.knR, hipR: v.hipL, knR: v.knL };
  });
  ['stand', 'apart', 'kneel'].forEach(k => { LEGS[k] = LEG_L[k]; });

  const MOVES = {
    idle: { len: 4, still: true, keys: [[0, { L: 'micStaff', R: 'down', legs: 'stand' }]] },
    backReach: { len: 4, keys: [[0, { L: 'micStaff', R: 'skyPoint', legs: 'restL', nod: -0.2 }], [2, { L: 'micStaff', R: 'sideHigh', legs: 'restL', nod: -0.15 }]] },
    open: { len: 4, keys: [[0, { L: 'micOut', R: 'spread', legs: 'apart', nod: -0.1, eyes: 'happy' }], [2, { L: 'micOut2', R: 'spread', legs: 'apart', nod: -0.06, lean: -0.04, eyes: 'happy' }]] },
    singSway: { len: 4, keys: [[0, { L: 'micMouth', R: 'relax', legs: 'restL', tilt: 0.1, roll: 0.04 }], [2, { L: 'micMouth', R: 'relax', legs: 'restR', tilt: -0.08, roll: -0.04 }]] },
    singShut: { len: 4, keys: [[0, { L: 'micMouth', R: 'relax', legs: 'restL', tilt: 0.1, roll: 0.04, eyes: 'shut' }], [2, { L: 'micMouth', R: 'chest', legs: 'restR', tilt: -0.08, roll: -0.04, eyes: 'shut' }]] },
    singHand: { len: 2, keys: [[0, { L: 'micMouth', R: 'byHead', legs: 'restL', tilt: 0.08 }], [1, { L: 'micMouth', R: 'byHead', legs: 'restL', tilt: 0.02 }]] },
    singUp: { len: 4, keys: [[0, { L: 'micMouth', R: 'up', legs: 'restL', nod: -0.12 }], [2, { L: 'micMouth', R: 'upWave', legs: 'restL', nod: -0.08 }]] },
    singReach: { len: 4, keys: [[0, { L: 'micMouth', R: 'side', legs: 'restR', tilt: -0.08, turn: -0.2 }], [2, { L: 'micMouth', R: 'sideHigh', legs: 'restR', tilt: -0.12, turn: -0.3 }]] },
    singOffer: { len: 4, keys: [[0, { L: 'micMouth', R: 'offer', legs: 'restL', tilt: 0.06 }], [2, { L: 'micMouth', R: 'reach', legs: 'restR', tilt: -0.06 }]] },
    singChest: { len: 4, keys: [[0, { L: 'micMouth', R: 'chest', legs: 'restL', tilt: 0.1, eyes: 'happy' }], [2, { L: 'micMouth', R: 'chest', legs: 'restR', tilt: -0.06, eyes: 'happy' }]] },
    singPoint: { len: 2, keys: [[0, { L: 'micMouth', R: 'point', legs: 'restL', lean: 0.05 }], [1, { L: 'micMouth', R: 'point2', legs: 'restL', lean: 0.07 }]] },
    singFlute: { len: 4, keys: [[0, { L: 'micMouth', R: 'rodBelow', legs: 'restL', tilt: 0.08 }], [2, { L: 'micMouth', R: 'rodBelow', legs: 'restR', tilt: -0.06 }]] },
    shh: { len: 4, keys: [[0, { L: 'micStaff', R: 'lips', legs: 'restL', tilt: 0.12, eyes: 'wink', mood: 'rest' }]] },
    staffSway: { len: 4, keys: [[0, { L: 'micStaff', R: 'hip', legs: 'restL', tilt: 0.08, roll: 0.05 }], [2, { L: 'micStaff', R: 'hip', legs: 'restR', tilt: -0.08, roll: -0.05 }]] },
    staffSteps: { len: 2, keys: [[0, { L: 'micStaff', R: 'swingOut', legs: 'tapL', dx: -0.07, roll: 0.05 }], [1, { L: 'micStaff', R: 'swingIn', legs: 'tapR', dx: 0.07, roll: -0.05 }]] },
    steps: { len: 2, keys: [[0, { L: 'micLow', R: 'swingOut', legs: 'tapL', dx: -0.08, roll: 0.06, tilt: 0.06 }], [1, { L: 'micLow', R: 'swingIn', legs: 'tapR', dx: 0.08, roll: -0.06, tilt: -0.06 }]] },
    wandOut: { len: 4, keys: [[0, { L: 'micOut', R: 'hip', legs: 'apart', turn: 0.3 }], [2, { L: 'micOut2', R: 'hip', legs: 'apart', turn: 0.25 }]] },
    wandFwd: { len: 4, keys: [[0, { L: 'micForward', R: 'hip', legs: 'restL', lean: 0.04 }], [2, { L: 'micForward', R: 'hip', legs: 'restR', lean: 0.02 }]] },
    cross: { len: 4, keys: [[0, { L: 'micCross', R: 'rodCross', legs: 'restL', tilt: 0.08 }], [2, { L: 'micCross', R: 'rodCross', legs: 'restR', tilt: -0.08 }]] },
    skirtTwirl: { len: 2, keys: [[0, { L: 'micStaff', R: 'skirt', legs: 'restL', eyes: 'happy' }]] },
    spinOpen: { len: 2, keys: [[0, { L: 'micStaff', R: 'spread', legs: 'stand', nod: -0.08, eyes: 'happy' }]] },
    hipTurn: { len: 2, keys: [[0, { L: 'micStaff', R: 'hip', legs: 'restL', roll: 0.06 }]] },
    punkPose: { len: 4, keys: [[0, { L: 'micStaff', R: 'behindHead', legs: 'restR', roll: -0.08, tilt: 0.14 }], [2, { L: 'micStaff', R: 'behindHead', legs: 'restR', roll: -0.05, tilt: 0.08 }]] },
    kick: { len: 2, keys: [[0, { L: 'micStaff', R: 'spread', legs: 'kickR', lean: -0.04 }], [1, { L: 'micStaff', R: 'spread', legs: 'stand' }]] },
    walk: { len: 1, walk: true, keys: [[0, { L: 'micStaff', R: 'swingFwd', legs: 'walkL' }], [0.5, { L: 'micStaff', R: 'swingBack', legs: 'walkR' }]] },
    kneelDown: { len: 4, still: true, xf: 1.1, keys: [[0, { L: 'micLow', R: 'relax', legs: 'kneel', lean: 0.32, nod: 0.3, eyes: 'shut', mood: 'rest' }]] },
    kneel: { len: 4, still: true, keys: [[0, { L: 'micMouth', R: 'chest', legs: 'kneel', lean: 0.12, nod: 0.12, tilt: 0.06 }], [2, { L: 'micMouth', R: 'chest', legs: 'kneel', lean: 0.1, nod: 0.08, tilt: -0.06 }]] },
    kneelReach: { len: 4, still: true, keys: [[0, { L: 'micMouth', R: 'skyPoint', legs: 'kneel', nod: -0.25 }]] },
    kneelUp: { len: 4, still: true, xf: 0.9, keys: [[0, { L: 'micStaff', R: 'relax', legs: 'kneelUpL', lean: 0.15 }]] },
    kneeLift: { len: 2, keys: [[0, { L: 'micMouth', R: 'offer', legs: 'kneeL' }], [1, { L: 'micMouth', R: 'relax', legs: 'stand' }]] },
    swayOpen: { len: 4, keys: [[0, { L: 'micOut', R: 'side', legs: 'restL', tilt: 0.1, eyes: 'happy' }], [2, { L: 'micOut', R: 'side', legs: 'restR', tilt: -0.1, eyes: 'happy' }]] },
    lookUp: { len: 4, still: true, keys: [[0, { L: 'micLow', R: 'skyPoint', legs: 'restL', nod: -0.45, lean: -0.08 }]] }
  };

  const CHOREO = [
    [0, 'idle'], [1.13, 'backReach'], [3.9, 'open'], [6.9, 'singHand'], [10.6, 'singSway'], [11.3, 'singUp'], [12.5, 'staffSway'],
    [18.6, 'walk'], [20.3, 'staffSway'], [21.25, 'cross'], [23.2, 'singUp'], [23.75, 'singChest'], [24.05, 'singSway'],
    [25.7, 'singHand'], [27.6, 'singSway'], [29.4, 'staffSway'], [31.9, 'singSway'], [33.9, 'singReach'], [35.2, 'staffSteps'],
    [38.25, 'skirtTwirl'], [41.1, 'shh'], [42.5, 'singSway'], [43.35, 'singReach'], [46.3, 'walk'], [48.9, 'staffSway'],
    [49.25, 'singReach'], [50.5, 'singUp'], [51.7, 'singSway'], [54.6, 'staffSway'], [55.45, 'singShut'], [56.2, 'hipTurn'],
    [57.6, 'staffSteps'], [60.05, 'steps'], [62.95, 'singSway'], [64.6, 'singOffer'], [66.5, 'singReach'], [69.0, 'staffSteps'],
    [70.0, 'wandOut'], [71.7, 'staffSteps'], [72.45, 'singUp'], [73.9, 'singSway'], [76.05, 'singShut'], [77.85, 'cross'],
    [79.6, 'singSway'], [81.65, 'singUp'], [83.2, 'singSway'], [84.4, 'staffSteps'], [87.1, 'steps'], [88.3, 'singChest'],
    [90.4, 'wandFwd'], [93.4, 'singFlute'], [96.0, 'walk'], [98.1, 'staffSway'], [105.2, 'walk'], [107.3, 'staffSway'], [107.5, 'wandFwd'],
    [109.5, 'singOffer'], [111.9, 'singHand'], [113.6, 'singSway'], [115.6, 'staffSway'], [118.1, 'singUp'], [119.35, 'spinOpen'],
    [120.6, 'singSway'], [121.4, 'walk'], [123.3, 'staffSway'], [124.4, 'kick'], [127.3, 'shh'], [128.6, 'singSway'],
    [129.5, 'singReach'], [132.5, 'staffSteps'], [135.4, 'singPoint'], [136.7, 'singUp'], [137.9, 'singSway'], [140.75, 'spinOpen'],
    [141.65, 'singShut'], [142.4, 'hipTurn'], [143.8, 'steps'], [146.2, 'walk'], [148.8, 'staffSway'], [149.15, 'singSway'],
    [150.8, 'singOffer'], [152.75, 'singReach'], [155.2, 'staffSteps'], [156.2, 'steps'], [157.9, 'staffSway'], [158.7, 'singUp'],
    [160.5, 'hipTurn'], [161.9, 'singSway'], [162.3, 'singShut'], [164.1, 'singOffer'], [167.85, 'punkPose'], [170.6, 'staffSteps'],
    [173.3, 'wandOut'], [176.6, 'steps'], [179.6, 'singChest'], [181.0, 'singSway'], [182.25, 'staffSteps'], [184.9, 'staffSway'],
    [188.2, 'walk'], [190.15, 'staffSway'], [190.6, 'kneelDown'], [194.1, 'kneel'], [199.0, 'kneelReach'], [201.9, 'kneel'],
    [204.4, 'kneelReach'], [207.6, 'kneel'], [210.6, 'kneelUp'], [211.7, 'kneeLift'], [213.25, 'steps'], [217.55, 'staffSteps'],
    [218.9, 'open'], [219.3, 'swayOpen'], [220.9, 'singChest'], [221.55, 'singSway'], [222.9, 'singSway'], [224.3, 'singReach'],
    [226.6, 'singOffer'], [229.9, 'staffSway'], [232.4, 'singSway'], [235.25, 'kick'], [237.8, 'singSway'], [239.4, 'singChest'],
    [241.1, 'steps'], [243.8, 'singOffer'], [246.95, 'singHand'], [248.3, 'singReach'], [248.95, 'kick'], [250.5, 'singReach'],
    [252.3, 'steps'], [254.5, 'spinOpen'], [255.8, 'singPoint'], [256.6, 'wandOut'], [258.15, 'singSway'], [260.6, 'singReach'],
    [263.9, 'singUp'], [265.0, 'singHand'], [265.95, 'singSway'], [268.8, 'spinOpen'], [272.9, 'lookUp'], [274.4, 'singOffer'],
    [275.3, 'staffSway'], [276.0, 'walk']
  ];

  const PATH = [
    [0, 0, -0.6, PI], [3.5, 0, -0.6, PI], [4.9, 0, -0.6, 0],
    [18.617, 0, -0.6, 0], [18.618, 1.0, -1.5, -0.73], [20.4, 0.15, -0.55, -0.6], [21.0, 0.15, -0.55, 0], [21.287, 0.15, -0.55, 0], [21.288, 0, -0.6, 0],
    [38.6, 0, -0.6, 0], [39.9, 0, -0.6, PI * 2], [41.14, 0, -0.6, PI * 2], [41.141, 0, -0.6, 0],
    [46.345, 0, -0.6, 0], [46.346, 1.3, -0.9, -1.3], [48.9, -0.5, -0.4, -1.3], [49.281, -0.5, -0.4, -0.9], [49.282, 0, -0.6, 0],
    [56.35, 0, -0.6, 0], [57.45, 0, -0.6, -PI * 2], [57.656, 0, -0.6, -PI * 2], [57.657, 0, -0.6, 0],
    [96.061, 0, -0.6, 0], [96.062, -0.7, -0.3, 2.18], [98.0, 0.6, -1.2, 2.18], [98.149, 0.6, -1.2, 2.18], [98.15, 0, -0.6, 0],
    [105.249, 0, -0.6, 0], [105.25, -1.3, -1.1, 1.2], [107.2, 0, -0.6, 1.2], [107.573, 0, -0.6, 0.6], [107.574, 0, -0.6, 0],
    [119.4, 0, -0.6, 0], [120.6, 0, -0.6, PI * 2], [121.42, 0, -0.6, PI * 2], [121.421, 1.4, -1.2, -1.11], [123.3, 0.2, -0.6, -1.11], [124.1, 0.2, -0.6, 0], [124.456, 0.2, -0.6, 0], [124.457, 0, -0.6, 0],
    [140.85, 0, -0.6, 0], [141.65, 0, -0.6, PI * 2], [141.674, 0, -0.6, PI * 2], [141.675, 0, -0.6, 0],
    [142.5, 0, -0.6, 0], [143.6, 0, -0.6, -PI * 2], [143.842, 0, -0.6, -PI * 2], [143.843, 0, -0.6, 0],
    [146.278, 0, -0.6, 0], [146.279, -1.1, -1.0, 1.23], [148.7, 0.3, -0.5, 1.23], [149.181, 0.3, -0.5, 0.6], [149.182, 0, -0.6, 0],
    [160.65, 0, -0.6, 0], [161.85, 0, -0.6, PI * 2], [162.327, 0, -0.6, PI * 2], [162.328, 0, -0.6, 0],
    [173.45, 0, -0.6, 0], [174.9, 0, -0.6, PI * 2], [176.642, 0, -0.6, PI * 2], [176.643, 0, -0.6, 0],
    [188.22, 0, -0.6, 0], [188.221, 1.1, -1.4, -0.94], [190.1, 0, -0.6, -0.94], [190.48, 0, -0.6, 0],
    [254.6, 0, -0.6, 0], [255.6, 0, -0.6, PI * 2], [255.854, 0, -0.6, PI * 2], [255.855, 0, -0.6, 0],
    [268.95, 0, -0.6, 0], [272.85, 0, -0.6, PI * 4], [272.971, 0, -0.6, PI * 4], [272.972, 0, -0.6, 0],
    [275.3, 0, -0.6, 0], [276.1, 0, -0.6, PI], [278.2, 0, -2.4, PI]
  ];
  const JUMPS = PATH.filter((p, i) => i > 0 && p[0] - PATH[i - 1][0] < 0.05).map(p => p[0]);

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

  function lastJump(t) {
    let j = 0;
    JUMPS.forEach(x => { if (x <= t && x > j) j = x; });
    return j;
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
        armCache[key] = GK.ik('mikuScarlet', side, target, A.hint);
      }
      base = armCache[key];
    }
    if (!A.wig) return base;
    const w = S(2 * PI * 2 * b + (side === 'L' ? 0 : 1.3));
    return base.map((v, i) => v + A.wig[i] * w);
  }

  function keyPose(k, b) {
    const L = armOf(k.L || 'micStaff', 'L', b), R2 = armOf(k.R || 'down', 'R', b);
    const lg = LEGS[k.legs || 'stand'];
    const mic = {};
    mic[ARMS[k.L || 'micStaff'].mic || 'low'] = 1;
    return {
      shL: [L[0], L[1], L[2]], elL: [L[3], 0, 0], shR: [R2[0], R2[1], R2[2]], elR: [R2[3], 0, 0],
      hipL: lg.hipL, knL: lg.knL, hipR: lg.hipR, knR: lg.knR,
      spine: [k.lean || 0, k.twist || 0, k.roll || 0], neck: [k.nod || 0, k.turn || 0, k.tilt || 0],
      dx: k.dx || 0, eyes: k.eyes || 'open', mood: k.mood || 'smile', mic
    };
  }

  const FIELDS = ['shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR', 'spine', 'neck'];

  function mixPose(a, b, w) {
    const o = {};
    FIELDS.forEach(f => { o[f] = mixV(a[f], b[f], w); });
    o.dx = lerp(a.dx, b.dx, w);
    o.eyes = w < 0.5 ? a.eyes : b.eyes;
    o.mood = w < 0.5 ? a.mood : b.mood;
    o.mic = {};
    Object.keys(a.mic).forEach(k => { o.mic[k] = (o.mic[k] || 0) + a.mic[k] * (1 - w); });
    Object.keys(b.mic).forEach(k => { o.mic[k] = (o.mic[k] || 0) + b.mic[k] * w; });
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
    const xf = MOVES[name].xf || XF;
    if (i > 0 && t - t0 < xf) return mixPose(poseAt(i - 1, t), cur, smooth((t - t0) / xf));
    return cur;
  }

  function danceAt(t) {
    const i = choreoIndex(t);
    return { pose: poseAt(i, t), move: CHOREO[i][1] };
  }

  const blinkAt = (t) => frac(t / 3.3 + 0.21) < 0.035;

  function faceAt(t, d) {
    const tt = Math.floor(t * 12) / 12;
    let eyes = d.eyes;
    if (eyes === 'open' && blinkAt(tt)) eyes = 'shut';
    let mouth = d.mood;
    if (singing(tt)) {
      const v = voiceAt(tt);
      if (v > 0.82) mouth = eyes === 'happy' || eyes === 'shut' ? 'belt' : 'beam';
      else if (v > 0.5) mouth = 'sing';
      else if (v > 0.2) mouth = 'say';
    }
    return eyes + '|' + mouth;
  }

  function poseCore(t) {
    const root = rootAt(t);
    const d = danceAt(t);
    const p = restPose();
    const P = d.pose;
    const M = MOVES[d.move];
    const e = M.still ? 0.15 : energyAt(t);
    const bo = bob(t);
    FIELDS.forEach(f => { p[f] = P[f].slice(); });
    if (!M.walk) {
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
    p.face = faceAt(t, P);
    p.mic = P.mic;
    return { pose: p, move: d.move };
  }

  function solveActor(a) {
    const m = Cast.solve('mikuScarlet', a.pose);
    a.m = m;
    a.head = M4.point(m.head, [0, 0, 0]);
    a.hips = M4.point(m.hips, [0, 0, 0]);
    a.root = [a.pose.x, 0, a.pose.z];
    return a;
  }

  function mikuAt(t) {
    const c = poseCore(t);
    return solveActor({ id: 'miku', form: costumeAt(t).form, look: 'miku', pose: c.pose, hidden: false, props: [], move: c.move });
  }

  const MIC_LEN = RC.MIC_LEN;
  const handPoint = (m, side) => M4.point(m['fore' + side], [0, -Cast.HER.fore - 0.035, 0.004]);

  function micEnds(mode, grip, m) {
    if (mode === 'mouth') {
      const rose = M4.point(m.head, [0, -0.13, 0.19]);
      const dir = V3.norm(V3.sub(rose, grip));
      return { bottom: V3.sub(rose, V3.mul(dir, MIC_LEN)), top: rose };
    }
    if (mode === 'staff' || mode === 'low') {
      const side = V3.norm(M4.dir(m.hips, [1, 0, 0])), fwd = V3.norm(M4.dir(m.hips, [0, 0, 1]));
      const out = mode === 'staff' ? [0.05, 0.03] : [0.3, 0.18];
      const foot = V3.add(grip, V3.add(V3.mul(side, out[0]), V3.mul(fwd, out[1])));
      const bottom = [foot[0], 0.02, foot[2]];
      const dir = V3.norm(V3.sub(grip, bottom));
      return { bottom, top: V3.add(bottom, V3.mul(dir, MIC_LEN)) };
    }
    if (mode === 'cross') {
      const dir = V3.norm(M4.dir(m.torso, [-0.55, 0.8, 0.12]));
      return { bottom: V3.sub(grip, V3.mul(dir, MIC_LEN * 0.6)), top: V3.add(grip, V3.mul(dir, MIC_LEN * 0.4)) };
    }
    const dir = V3.norm(M4.dir(m.foreL, [0, -1, 0]));
    return { bottom: V3.sub(grip, V3.mul(dir, MIC_LEN * 0.16)), top: V3.add(grip, V3.mul(dir, MIC_LEN * 0.84)) };
  }

  function micOf(a) {
    const grip = handPoint(a.m, 'L');
    let bottom = [0, 0, 0], top = [0, 0, 0], sum = 0;
    Object.keys(a.pose.mic).forEach(mode => {
      const w = a.pose.mic[mode];
      if (w <= 1e-4) return;
      const e = micEnds(mode, grip, a.m);
      bottom = V3.add(bottom, V3.mul(e.bottom, w));
      top = V3.add(top, V3.mul(e.top, w));
      sum += w;
    });
    bottom = V3.mul(bottom, 1 / sum);
    top = V3.mul(top, 1 / sum);
    const dir = V3.norm(V3.sub(top, bottom));
    const mid = V3.mul(V3.add(bottom, top), 0.5);
    return { bottom: V3.sub(mid, V3.mul(dir, MIC_LEN / 2)), top: V3.add(mid, V3.mul(dir, MIC_LEN / 2)), dir, grip };
  }

  const TAIL_N = 14;
  const TAIL_LAG = 0.04;

  function tailsOf(t, a) {
    const segL = RC.TAIL.len / TAIL_N;
    const t0 = Math.max(0, lastJump(t));
    const ms = [];
    for (let k = 0; k <= TAIL_N; k++) {
      const tk = Math.max(t0, t - k * TAIL_LAG);
      ms.push(k === 0 || tk === t ? a.m : Cast.solve('mikuScarlet', poseCore(tk).pose));
    }
    const ryNow = rootAt(t).ry, ryPast = rootAt(Math.max(t0, t - 0.06)).ry;
    const spin = clamp(Math.abs(ryNow - ryPast) / Math.max(1e-3, Math.min(0.06, t - t0)) * 0.11, 0, 0.85);
    const lat = V3.norm(M4.dir(a.m.torso, [1, 0, 0]));
    const neck = M4.point(a.m.torso, [0, 0.42, 0]);
    const waist = M4.point(a.m.hips, [0, -0.02, 0]);
    const hem = M4.point(a.m.hips, [0, -0.36, 0]);
    return [1, -1].map(s => {
      const anchorLocal = Cast.headPoint(s * RC.TAIL.yaw, RC.TAIL.pit, RC.TAIL.k);
      const raw = ms.map((m, k) => {
        const A = M4.point(m.head, anchorLocal);
        const back = V3.norm(M4.dir(m.torso, [0, 0, -1]));
        const side = V3.norm(M4.dir(m.torso, [s, 0, 0]));
        const axis = M4.point(m.torso, [0, 0, 0]);
        let radial = V3.sub(A, axis);
        radial = V3.norm([radial[0], 0, radial[2]]);
        const dir = V3.norm(V3.add(V3.add([0, -1, 0], V3.mul(back, 0.3)), V3.add(V3.mul(side, 0.12), V3.mul(radial, spin * 1.3))));
        return V3.add(A, V3.mul(dir, k * segL));
      });
      const pts = [raw[0]];
      for (let k = 1; k <= TAIL_N; k++) {
        const d = V3.sub(raw[k], raw[k - 1]);
        let p = V3.add(pts[k - 1], V3.mul(V3.norm(d), segL));
        p = pushOut(p, neck, waist, 0.15);
        p = pushOut(p, waist, hem, 0.15, 0.27);
        if (p[1] < 0.012) p[1] = 0.012;
        pts.push(p);
      }
      return pts;
    }).concat([lat]);
  }

  function pushOut(p, a, b, r0, r1) {
    const ab = V3.sub(b, a);
    const k = clamp(V3.dot(V3.sub(p, a), ab) / Math.max(1e-6, V3.dot(ab, ab)), 0, 1);
    const q = V3.add(a, V3.mul(ab, k));
    const r = r1 === undefined ? r0 : lerp(r0, r1, k);
    const d = V3.sub(p, q);
    const len = V3.len(d);
    if (len >= r || len < 1e-6) return p;
    return V3.add(q, V3.mul(d, r / len));
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
  const faceCam = (m, yaw, dist, dy) => addV(m.head, [S(m.pose.ry + yaw) * dist, dy, C(m.pose.ry + yaw) * dist]);
  const ROSE = { glass: 1 };

  const WORLDS = {
    glassOpen(t, u) {
      return view(drift([0.15, 3.55, 2.6], [0.05, 3.6, 2.0], u), [0, 3.7, -4.7], 52, { glass: lerp(0.45, 1, smooth(span(t, 0.22, 0.45))) });
    },
    turnIn(t, u, m) {
      return view(drift(rel(m, [-0.7, 1.15, 2.4]), rel(m, [-0.25, 1.25, 1.75]), u), rel(m, [0, 1.12, 0]), 40);
    },
    handUp(t, u, m) {
      return view(drift(near(m, [0.12, -0.16, 1.5]), near(m, [0.08, -0.14, 1.35]), u), near(m, [0, -0.22, 0]), 38);
    },
    preview(t, u, m) {
      return view(near(m, [-0.28, -0.4, 0.78]), near(m, [0, 0.02, 0]), 42);
    },
    title(t, u) {
      return view(drift([-3.2, 4.2, 19], [-2.6, 4.0, 18], u), [0.5, 0.4, -2], 44, { glass: 1, title: smooth(span(t, 12.7, 13.4)) * (1 - smooth(span(t, 18.0, 18.55))) });
    },
    brideWide(t, u, m) {
      return view([2.4, 1.85, 6.2], rel(m, [0, 1.0, 0]), 40, { glass: 0.8 });
    },
    brideStaff(t, u, m) {
      return view(near(m, [-0.6, -0.55, 1.2]), near(m, [0, -0.35, 0]), 40);
    },
    bowClose(t, u, m) {
      return view(rel(m, [-0.42, 0.78, 0.62]), rel(m, [-0.1, 0.88, 0]), 36);
    },
    corsage(t, u, m) {
      return view(near(m, [0.48, -0.32, 0.48]), near(m, [0.05, -0.28, 0]), 38);
    },
    roseFace(t, u, m) {
      return view(near(m, [0.5, 0.0, 0.62]), near(m, [0.04, -0.03, 0.06]), 36);
    },
    brideSing(t, u, m) {
      return view(drift(rel(m, [0.2, 1.15, 2.8]), rel(m, [0.1, 1.2, 2.4]), u), rel(m, [0, 1.05, 0]), 40);
    },
    shaftSide(t, u, m) {
      return view(rel(m, [2.6, 1.0, 1.9]), rel(m, [-0.5, 1.2, -0.5]), 42, { shaft: 1 });
    },
    brideSway(t, u, m) {
      return view(rel(m, [-0.3, 1.2, 2.1]), rel(m, [0, 1.15, 0]), 38);
    },
    shaftWide(t, u, m) {
      return view(drift([-2.2, 0.65, 4.4], [-1.9, 0.7, 4.0], u), rel(m, [0, 1.3, 0]), 44, { shaft: 1, glass: 0.8 });
    },
    skirtLow(t, u, m) {
      return view(rel(m, [0.6, 0.45, 0.9]), rel(m, [0, 0.75, 0]), 40);
    },
    shh(t, u, m) {
      return view(near(m, [0.15, -0.08, 0.8]), near(m, [0, -0.12, 0]), 36);
    },
    pointSky(t, u, m) {
      return view(near(m, [0.62, -0.72, 1.45]), near(m, [-0.3, 0.1, 0]), 40);
    },
    roseWide1(t, u) {
      return view(drift([1.6, 2.2, 8.6], [1.2, 2.1, 8.2], u), [0, 2.6, -3.5], 46, ROSE);
    },
    pointSide(t, u, m) {
      return view(rel(m, [0.4, 1.3, 1.9]), rel(m, [-0.25, 1.2, 0]), 40);
    },
    raiseSwap(t, u, m) {
      return view(rel(m, [0, 1.0, 3.2]), rel(m, [0, 1.25, 0]), 40);
    },
    blackProfile(t, u, m) {
      return view(drift(faceCam(m, -0.75, 0.92, -0.06), faceCam(m, -0.68, 0.86, -0.06), u), near(m, [0, -0.08, 0]), 38);
    },
    blackWide(t, u, m) {
      return view(rel(m, [0.3, 1.0, 4.5]), rel(m, [0, 1.2, 0]), 42);
    },
    eyesShut(t, u, m) {
      return view(near(m, [-0.12, -0.05, 0.7]), near(m, [0, -0.08, 0]), 36);
    },
    legsTurn(t, u, m) {
      return view(rel(m, [-0.6, 0.35, 1.0]), rel(m, [0, 0.7, 0]), 42);
    },
    highWide(t, u, m) {
      return view(drift(rel(m, [-1.2, 3.6, 3.4]), rel(m, [-0.9, 3.4, 3.2]), u), rel(m, [0, 0.4, -0.3]), 44);
    },
    blackDance(t, u, m) {
      return view(rel(m, [0.5, 1.1, 3.4]), rel(m, [0, 1.0, 0]), 40);
    },
    blackSing(t, u, m) {
      return view(rel(m, [0.35, 1.3, 1.7]), rel(m, [0, 1.25, 0]), 38);
    },
    blackSing2(t, u, m) {
      return view(near(m, [-0.5, -0.2, 1.3]), near(m, [0, -0.28, 0]), 38);
    },
    blackReach(t, u, m) {
      return view(rel(m, [-0.3, 1.2, 2.3]), rel(m, [-0.2, 1.15, 0]), 40);
    },
    roseWide2(t, u) {
      return view(drift([-0.8, 1.2, 9.5], [-0.6, 1.3, 9.1], u), [0, 2.4, -3.5], 44, ROSE);
    },
    swapDance(t, u, m) {
      return view(rel(m, [0, 1.1, 3.6]), rel(m, [0, 1.1, 0]), 40);
    },
    railWide(t, u, m) {
      return view([4.75, 1.45, 2.6], rel(m, [0, 1.0, 0]), 40);
    },
    sleekUp(t, u, m) {
      return view(near(m, [0.55, -0.45, 1.2]), near(m, [0, -0.15, 0]), 40);
    },
    sleekTilt(t, u, m) {
      return view(rel(m, [0.3, 0.7, 1.2]), drift(rel(m, [0, 0.55, 0]), near(m, [0, -0.15, 0]), u), 40);
    },
    sleekShut(t, u, m) {
      return view(faceCam(m, 0.45, 0.75, -0.05), near(m, [0, -0.08, 0]), 36);
    },
    sleekStaff(t, u, m) {
      return view(rel(m, [-0.9, 1.2, 2.6]), rel(m, [0, 1.15, 0]), 40);
    },
    appendUp(t, u, m) {
      return view(rel(m, [0.25, 1.15, 2.2]), rel(m, [0, 1.3, 0]), 40);
    },
    appendBack(t, u, m) {
      return view(rel(m, [0.4, 0.55, -1.3]), rel(m, [0, 0.85, 0]), 42);
    },
    appendDance(t, u, m) {
      return view(drift(rel(m, [-1.0, 1.0, 3.2]), rel(m, [-0.4, 1.2, 1.6]), u), rel(m, [0, 1.15, 0]), 40);
    },
    wandSwap(t, u, m) {
      return view(rel(m, [0.2, 1.1, 3.0]), rel(m, [0, 1.1, 0]), 40);
    },
    suitClose(t, u, m) {
      return view(faceCam(m, 0.5, 0.95, -0.12), near(m, [0, -0.12, 0]), 38);
    },
    pullBack(t, u, m) {
      return view(path3([rel(m, [0.2, 1.2, 2.2]), rel(m, [0.3, 1.6, 4.5]), [0.5, 2.6, 9.0]], u), path3([rel(m, [0, 1.1, 0]), rel(m, [0, 1.5, -1]), [0, 2.8, -3.5]], u), 42, { glass: lerp(0.6, 1, u) });
    },
    townPan(t, u) {
      return view(drift([-4.4, 2.3, 7.4], [-4.0, 1.9, 8.6], u), path3([[-8.6, 1.6, -1.2], [-10.8, 0.9, 5.6], [-8.4, -0.4, 12.8]], u), 46, { glass: 1, beams: 1 });
    },
    suitWalk(t, u, m) {
      return view([0.8, 1.5, 6.5], rel(m, [0, 1.2, 0]), 40);
    },
    suitWand(t, u, m) {
      return view(near(m, [0.7, -0.5, 1.3]), near(m, [0, -0.3, 0]), 40);
    },
    flashLegs(t, u, m) {
      return view(rel(m, [0.2, 0.7, 0.9]), rel(m, [0, 0.8, 0]), 40);
    },
    santaFlash1(t, u, m) {
      return view(near(m, [-0.35, -0.3, 0.6]), near(m, [0, -0.32, 0]), 38);
    },
    santaFlash2(t, u, m) {
      return view(near(m, [0.4, -0.05, 0.6]), near(m, [0.1, -0.1, 0.1]), 38);
    },
    santaSing(t, u, m) {
      return view(drift(rel(m, [0.2, 1.1, 2.9]), rel(m, [0.1, 1.15, 2.5]), u), rel(m, [0, 1.05, 0]), 40);
    },
    santaSide(t, u, m) {
      return view(rel(m, [-2.4, 0.9, 2.2]), rel(m, [0.6, 1.3, -0.4]), 42);
    },
    santaTurn(t, u, m) {
      return view(rel(m, [0.3, 1.1, 3.0]), rel(m, [0, 1.1, 0]), 40);
    },
    santaShaft(t, u, m) {
      return view([3.2, 1.2, 4.6], rel(m, [0, 1.0, 0]), 42, { shaft: 1 });
    },
    santaLegs(t, u, m) {
      return view(rel(m, [0.5, 0.45, 1.1]), rel(m, [0, 0.65, 0]), 42);
    },
    santaClose(t, u, m) {
      return view(near(m, [-0.2, -0.12, 0.85]), near(m, [0, -0.15, 0]), 38);
    },
    santaReach(t, u, m) {
      return view(near(m, [0.7, -0.4, 1.3]), near(m, [-0.2, -0.1, 0]), 40);
    },
    roseWide3(t, u) {
      return view(drift([4.5, 3.0, 7.5], [4.1, 2.9, 7.1], u), [0, 2.0, -3], 46, ROSE);
    },
    santaPoint(t, u, m) {
      return view(rel(m, [0.2, 1.3, 1.9]), rel(m, [0, 1.25, 0]), 38);
    },
    raiseSwap2(t, u, m) {
      return view(rel(m, [0, 1.0, 3.3]), rel(m, [0, 1.25, 0]), 40);
    },
    dressProfile(t, u, m) {
      return view(faceCam(m, -1.0, 1.0, -0.15), near(m, [0, -0.15, 0]), 40);
    },
    dressSpin(t, u, m) {
      return view(rel(m, [0.4, 1.0, 3.6]), rel(m, [0, 0.9, 0]), 40);
    },
    dressShut(t, u, m) {
      return view(near(m, [0.12, -0.04, 0.7]), near(m, [0, -0.08, 0]), 36);
    },
    dressHip(t, u, m) {
      return view(rel(m, [-0.5, 0.5, 0.9]), rel(m, [0, 0.85, 0]), 42);
    },
    dressSteps(t, u, m) {
      return view(rel(m, [1.2, 1.9, 3.4]), rel(m, [0, 0.8, 0]), 40);
    },
    dressWalk(t, u, m) {
      return view(rel(m, [0.6, 1.2, 2.8]), rel(m, [0, 1.0, 0]), 40);
    },
    dressSing(t, u, m) {
      return view(near(m, [-0.25, -0.15, 1.05]), near(m, [0, -0.2, 0]), 38);
    },
    dressSing2(t, u, m) {
      return view(near(m, [0.3, -0.2, 1.1]), near(m, [0, -0.22, 0]), 38);
    },
    dressReach(t, u, m) {
      return view(rel(m, [0.1, 1.2, 2.2]), rel(m, [-0.2, 1.1, 0]), 40);
    },
    roseWide4(t, u) {
      return view(drift([0, 2.8, 12], [0, 2.8, 11.4], u), [0, 2.6, -3.5], 44, ROSE);
    },
    gothWide(t, u) {
      return view(drift([-2.5, 1.4, 6.8], [-2.2, 1.45, 6.4], u), [0, 2.0, -3], 44, ROSE);
    },
    gothRail(t, u, m) {
      return view([4.6, 1.3, 1.0], rel(m, [0, 1.0, 0]), 40);
    },
    gothCuffs(t, u, m) {
      return view(near(m, [-0.45, -0.3, 0.9]), near(m, [0, -0.15, 0]), 40);
    },
    gothLow(t, u, m) {
      return view(rel(m, [0.5, 0.5, 1.0]), rel(m, [0, 0.8, 0]), 42);
    },
    gothShut(t, u, m) {
      return view(near(m, [0.25, -0.05, 0.75]), near(m, [0, -0.08, 0]), 36);
    },
    gothSwap(t, u, m) {
      return view(rel(m, [0.3, 1.2, 2.2]), rel(m, [0, 1.15, 0]), 40);
    },
    punkPose(t, u, m) {
      return view(rel(m, [-0.5, 1.25, 1.9]), rel(m, [0, 1.2, 0]), 40);
    },
    punkHips(t, u, m) {
      return view(rel(m, [0.25, 0.85, 0.75]), rel(m, [0, 0.9, 0]), 42);
    },
    punkWand(t, u, m) {
      return view(rel(m, [0.6, 1.1, 3.0]), rel(m, [0, 1.05, 0]), 40);
    },
    punkSwap(t, u, m) {
      return view(rel(m, [-0.2, 1.1, 3.0]), rel(m, [0, 1.1, 0]), 40);
    },
    gothClose(t, u, m) {
      return view(near(m, [-0.35, -0.1, 0.8]), near(m, [0, -0.12, 0]), 38);
    },
    gothPull(t, u, m) {
      return view(path3([rel(m, [0.3, 1.2, 2.2]), rel(m, [0.2, 1.8, 6]), [0, 3.0, 12]], u), path3([rel(m, [0, 1.1, 0]), rel(m, [0, 1.8, -1.5]), [0, 3.0, -3.5]], u), 42, { glass: lerp(0.6, 1, u) });
    },
    spire1(t, u) {
      return view(drift([0, 6.5, 9], [0.4, 6.7, 8.8], u), [0, 9.6, -4.8], 40, ROSE);
    },
    houses(t, u) {
      return view(drift([-6, 1.5, 9], [-5.6, 1.4, 9.2], u), drift([-11, 2.5, 2], [-11.5, 2.3, 4], u), 42, { glass: 1, beams: 1 });
    },
    farSide(t, u, m) {
      return view([-5.8, 1.8, 3.5], [0.5, 1.4, -1.5], 44, ROSE);
    },
    kneelSwap(t, u, m) {
      return view(rel(m, [0.4, 0.75, 1.9]), rel(m, [0, 0.75, 0]), 40);
    },
    kneelHigh(t, u, m) {
      return view(rel(m, [-1.6, 3.4, 2.6]), rel(m, [0, 0.3, 0]), 44);
    },
    kneelIvy(t, u, m) {
      return view(drift(rel(m, [-0.6, 1.0, 1.9]), rel(m, [-0.45, 1.05, 1.7]), u), rel(m, [0, 0.85, 0]), 40);
    },
    kneelMic(t, u, m) {
      return view(near(m, [0.55, -0.12, 0.85]), near(m, [0, -0.2, 0]), 40);
    },
    kneelSil(t, u, m) {
      return view(rel(m, [-1.4, 1.0, 2.2]), rel(m, [0, 0.8, 0]), 42);
    },
    kneelLow(t, u, m) {
      return view(near(m, [0.3, -0.35, 0.6]), near(m, [0, -0.35, 0]), 40);
    },
    mintKnee(t, u, m) {
      return view(rel(m, [0.3, 1.0, 2.6]), rel(m, [0, 0.95, 0]), 40);
    },
    mintDance(t, u, m) {
      return view(rel(m, [-0.8, 1.3, 4.0]), rel(m, [0, 1.0, 0]), 42);
    },
    towerWide(t, u) {
      return view(drift([0, 1.0, 16], [0, 1.1, 15.4], u), [0, 1.8, -3], 42, { glass: 1, beams: 1 });
    },
    roseHit(t, u) {
      return view([0, 1.6, 7], [0, 2.2, -3], 44, ROSE);
    },
    spreadHit(t, u, m) {
      return view(rel(m, [0, 1.25, 2.2]), rel(m, [0, 1.2, 0]), 40);
    },
    mintSpread(t, u, m) {
      return view(rel(m, [0.2, 1.3, 1.7]), rel(m, [0, 1.25, 0]), 40);
    },
    mintHold(t, u, m) {
      return view(rel(m, [0.6, 1.0, 2.6]), rel(m, [0, 1.1, 0]), 40);
    },
    houseFlash(t, u) {
      return view([-6, 0.5, 6], [-11, 1.5, 0], 42, { glass: 1, beams: 1 });
    },
    spireFlash(t, u) {
      return view([3, 7, 10], [0, 9.6, -4.8], 40, ROSE);
    },
    appendBack2(t, u, m) {
      return view(rel(m, [-0.3, 1.2, 2.0]), rel(m, [0, 1.15, 0]), 40);
    },
    appendReach(t, u, m) {
      return view(near(m, [0.3, -0.25, 1.1]), near(m, [-0.1, -0.2, 0]), 40);
    },
    appendPose(t, u, m) {
      return view(drift(rel(m, [0.4, 1.0, 3.4]), rel(m, [0.2, 1.2, 1.9]), u), rel(m, [0, 1.15, 0]), 40);
    },
    appendTilt(t, u, m) {
      return view(rel(m, [0.35, 0.55, 0.9]), drift(rel(m, [0, 0.65, 0]), near(m, [0, -0.1, 0]), u), 40);
    },
    appendSwap(t, u, m) {
      return view(rel(m, [0.1, 1.2, 2.2]), rel(m, [0, 1.15, 0]), 40);
    },
    punkStomp(t, u, m) {
      return view(path3([rel(m, [0.3, 0.4, 1.0]), rel(m, [0.4, 0.7, 2.2]), rel(m, [0.5, 1.0, 3.6])], u), path3([rel(m, [0, 0.4, 0]), rel(m, [0, 0.8, 0]), rel(m, [0, 1.05, 0])], u), 42);
    },
    punkSing(t, u, m) {
      return view(rel(m, [-0.2, 1.3, 1.8]), rel(m, [0, 1.25, 0]), 38);
    },
    punkWide(t, u, m) {
      return view([0.6, 2.4, 7.5], rel(m, [0, 0.9, 0]), 42, { glass: 0.9 });
    },
    punkSwap2(t, u, m) {
      return view(near(m, [0.5, -0.4, 1.3]), near(m, [0, -0.2, 0]), 40);
    },
    scarletWave(t, u, m) {
      return view(rel(m, [0, 1.25, 1.9]), rel(m, [0, 1.2, 0]), 40);
    },
    scarletKick(t, u, m) {
      return view(rel(m, [0.4, 0.5, 1.2]), drift(rel(m, [0, 0.55, 0]), near(m, [0, -0.2, 0]), span(u, 0.35, 0.8)), 40);
    },
    scarletWide(t, u, m) {
      return view(rel(m, [0.2, 1.0, 4.4]), rel(m, [0, 1.1, 0]), 42);
    },
    scarletWhip(t, u, m) {
      return view(near(m, [-0.3, -0.2, 1.1]), near(m, [0, -0.2, 0]), 40);
    },
    scarletPoint(t, u, m) {
      return view(rel(m, [0.8, 1.2, 3.4]), rel(m, [0, 1.3, 0]), 40);
    },
    skyTilt(t, u, m) {
      const k = smooth(span(t, 261.4, 263.9));
      return view(drift(rel(m, [0.3, 1.2, 2.0]), rel(m, [0.5, 1.0, 2.4]), k), drift(rel(m, [0, 1.2, 0]), [1.6, 6.5, -3.0], k), 40, { glass: lerp(0.6, 1, k) });
    },
    scarletUp(t, u, m) {
      return view(rel(m, [0.1, 1.2, 2.0]), rel(m, [0, 1.25, 0]), 40);
    },
    scarletClose(t, u, m) {
      return view(near(m, [0.25, -0.25, 0.8]), near(m, [0, -0.05, 0]), 38);
    },
    topSpin(t, u, m) {
      return view(rel(m, [0, 5.6, 0.25]), rel(m, [0, 0, 0]), 46, { upv: [0, 0, -1] });
    },
    backLook(t, u, m) {
      return view(drift(near(m, [0.28, -0.04, -0.85]), near(m, [0.22, 0.0, -0.75]), u), near(m, [0, 0.45, 1.5]), 42);
    },
    finale(t, u) {
      return view(drift([0.3, 1.3, 7.5], [0.3, 1.5, 8.2], u), [0, 1.8, -3], 44, ROSE);
    }
  };

  function cam(w) {
    return { eye: w.eye, at: w.at, fov: w.fov, up: w.upv || [0, 1, 0], near: 0.05, far: 240 };
  }

  function worldFor(t, shot) {
    const u = span(t, shot.start, shot.end);
    const miku = mikuAt(t);
    const w = WORLDS[shot.cam](t, u, miku, shot);
    return Object.assign({ glass: 0.3, shaft: 0, beams: 0.6, title: 0 }, w, { scene: shot.scene, cast: [miku], camera: cam(w), miku, costume: costumeAt(t) });
  }

  function stage(t, shot) {
    const sh = shot || shotAt(t);
    const st = worldFor(t, sh);
    const focus = {};
    st.cast.forEach(a => { focus[a.id] = { head: a.head, hips: a.hips }; });
    return Object.assign(st, { focus, shot: sh, beat: beatAt(t), mic: micOf(st.miku) });
  }

  const NY = [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]];
  const NZ = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];
  const FLOOR_R = 4.6;
  const RIM_R = 4.98;
  const RIM_H = 0.32;
  const WALL_Z = -4.95;
  const CLOCK = [0, 3.72, -4.72];
  const DIAL = { glass: 2.22, band: 3.02, ring: 3.42, num: 2.66 };
  const STONE = 0x6c6880;
  const STONE_DARK = 0x3a3648;
  const SLATE = 0x2a2c3c;
  const IRON = 0x1c1a22;
  const LEAF = [0x2a5a32, 0x3a6a3a, 0x24482a, 0x31603a];
  const NUMS = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

  function bar(b, x0, y0, x1, y1, th, depth, col) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    b.push(M4.translate((x0 + x1) / 2, (y0 + y1) / 2, depth / 2), M4.rotZ(-Math.atan2(x1 - x0, y1 - y0)));
    b.box(th, len, depth, col);
    b.pop();
  }

  function numeral(b, str, h, col) {
    const W = { I: 0.22, V: 0.58, X: 0.58 };
    const gap = 0.07;
    const total = Array.from(str).reduce((s, ch) => s + W[ch] * h, 0) + gap * h * (str.length - 1);
    let x = -total / 2;
    const th = 0.12 * h, depth = 0.13;
    Array.from(str).forEach(ch => {
      const cw = W[ch] * h, cx = x + cw / 2;
      if (ch === 'I') {
        bar(b, cx, -h / 2, cx, h / 2, th, depth, col);
        b.at(cx, h / 2 - th * 0.35, depth / 2, (c) => c.box(cw, th * 0.7, depth, col));
        b.at(cx, -h / 2 + th * 0.35, depth / 2, (c) => c.box(cw, th * 0.7, depth, col));
      } else if (ch === 'V') {
        bar(b, cx - cw * 0.42, h / 2, cx, -h / 2, th, depth, col);
        bar(b, cx + cw * 0.42, h / 2, cx, -h / 2, th * 0.7, depth, col);
      } else {
        bar(b, cx - cw * 0.42, h / 2, cx + cw * 0.42, -h / 2, th, depth, col);
        bar(b, cx + cw * 0.42, h / 2, cx - cw * 0.42, -h / 2, th * 0.7, depth, col);
      }
      x += cw + gap * h;
    });
  }

  function annulus(b, r0, r1, z, n, col, a0, a1) {
    const A0 = a0 === undefined ? 0 : a0, A1 = a1 === undefined ? PI * 2 : a1;
    for (let i = 0; i < n; i++) {
      const u0 = lerp(A0, A1, i / n), u1 = lerp(A0, A1, (i + 1) / n);
      b.quad([S(u0) * r0, C(u0) * r0, z], [S(u1) * r0, C(u1) * r0, z], [S(u1) * r1, C(u1) * r1, z], [S(u0) * r1, C(u0) * r1, z], col, null, NZ);
    }
  }

  function tube(b, r, z0, z1, n, col, inward) {
    for (let i = 0; i < n; i++) {
      const u0 = (i / n) * PI * 2, u1 = ((i + 1) / n) * PI * 2;
      const s = inward ? -1 : 1;
      const n0 = [S(u0) * s, C(u0) * s, 0], n1 = [S(u1) * s, C(u1) * s, 0];
      b.quad([S(u0) * r, C(u0) * r, z0], [S(u1) * r, C(u1) * r, z0], [S(u1) * r, C(u1) * r, z1], [S(u0) * r, C(u0) * r, z1], col, null, [n0, n1, n1, n0]);
    }
  }

  function buildClock(b) {
    b.push(M4.translate(CLOCK[0], CLOCK[1], CLOCK[2]));
    annulus(b, DIAL.band, DIAL.ring, 0.24, 48, STONE);
    tube(b, DIAL.ring, 0, 0.24, 48, STONE_DARK);
    tube(b, DIAL.band, 0.03, 0.24, 48, STONE_DARK, true);
    annulus(b, DIAL.glass + 0.12, DIAL.band, 0.03, 48, 0x36324a);
    annulus(b, DIAL.glass, DIAL.glass + 0.12, 0.12, 40, 0x4a465c);
    tube(b, DIAL.glass + 0.12, 0.03, 0.12, 40, STONE_DARK);
    tube(b, DIAL.glass, 0.0, 0.12, 40, STONE_DARK, true);
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * PI * 2;
      const big = i % 5 === 0;
      b.push(M4.rotZ(-a), M4.translate(0, DIAL.band - (big ? 0.1 : 0.06), 0.05));
      b.box(big ? 0.05 : 0.025, big ? 0.14 : 0.07, 0.03, 0xb8b0c8);
      b.pop();
    }
    NUMS.forEach((str, i) => {
      b.push(M4.rotZ(-(i / 12) * PI * 2), M4.translate(0, DIAL.num, 0.03));
      numeral(b, str, 0.6, 0x9a94b0);
      b.pop();
    });
    b.at(0, 0, 0.14, (h) => {
      h.push(M4.rotX(PI / 2));
      h.prism(16, 0.26, 0.26, 0, 0.2, 0.2, 0.06, IRON);
      h.pop();
    });
    b.pop();
  }

  function glassDisc(b) {
    const n = 40, R0 = DIAL.glass;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      for (let j = 0; j < 3; j++) {
        const r0 = (R0 * j) / 3, r1 = (R0 * (j + 1)) / 3;
        const p = (a, r) => [CLOCK[0] + S(a) * r, CLOCK[1] + C(a) * r, CLOCK[2] + 0.04];
        const uv = (a, r) => [0.5 + (S(a) * r) / (2 * R0), 0.5 + (C(a) * r) / (2 * R0)];
        b.quad(p(a0, r0), p(a1, r0), p(a1, r1), p(a0, r1), [1, 1, 1, 0.96], [uv(a0, r0), uv(a1, r0), uv(a1, r1), uv(a0, r1)], NZ);
      }
    }
  }

  function clockHand(len, w) {
    return (b) => {
      b.at(0, len * 0.42, 0, (h) => h.box(w * 0.42, len * 1.0, 0.035, IRON));
      b.push(M4.translate(0, len * 0.9, 0), M4.rotZ(PI / 4));
      b.box(w * 1.3, w * 1.3, 0.035, IRON);
      b.pop();
      b.at(0, -len * 0.08, 0, (h) => {
        h.push(M4.rotX(PI / 2));
        h.prism(10, w * 0.9, w * 0.9, -0.018, w * 0.9, w * 0.9, 0.018, IRON, { capBottom: true });
        h.pop();
      });
      b.at(0, len * 0.55, 0, (h) => {
        h.push(M4.rotX(PI / 2));
        h.prism(10, w * 0.7, w * 0.7, -0.018, w * 0.7, w * 0.7, 0.018, IRON, { capBottom: true });
        h.prism(10, w * 0.45, w * 0.45, -0.02, w * 0.45, w * 0.45, 0.02, 0x4a4658);
        h.pop();
      });
    };
  }

  function wallTiles(b, x0, x1, y0, y1, z, step) {
    for (let x = x0; x < x1 - 1e-6; x += step) {
      for (let y = y0; y < y1 - 1e-6; y += step) {
        const xa = x, xb = Math.min(x1, x + step), ya = y, yb = Math.min(y1, y + step);
        b.quad([xa, ya, z], [xb, ya, z], [xb, yb, z], [xa, yb, z], [1, 1, 1, 0], [[xa / 1.6, ya / 1.6], [xb / 1.6, ya / 1.6], [xb / 1.6, yb / 1.6], [xa / 1.6, yb / 1.6]], NZ);
      }
    }
  }

  function buildWall(b) {
    wallTiles(b, -6.8, 6.8, -1.0, 8.6, WALL_Z, 1.6);
  }

  function buildTower(b) {
    const n = 40;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const n0 = [S(a0), 0, C(a0)], n1 = [S(a1), 0, C(a1)];
      b.quad([S(a0) * RIM_R, -0.62, C(a0) * RIM_R], [S(a1) * RIM_R, -0.62, C(a1) * RIM_R], [S(a1) * RIM_R, RIM_H, C(a1) * RIM_R], [S(a0) * RIM_R, RIM_H, C(a0) * RIM_R], STONE, null, [n0, n1, n1, n0]);
      b.quad([S(a0) * FLOOR_R, RIM_H, C(a0) * FLOOR_R], [S(a1) * FLOOR_R, RIM_H, C(a1) * FLOOR_R], [S(a1) * RIM_R, RIM_H, C(a1) * RIM_R], [S(a0) * RIM_R, RIM_H, C(a0) * RIM_R], 0x7c7890, null, NY);
      b.quad([S(a0) * FLOOR_R, 0, C(a0) * FLOOR_R], [S(a1) * FLOOR_R, 0, C(a1) * FLOOR_R], [S(a1) * FLOOR_R, RIM_H, C(a1) * FLOOR_R], [S(a0) * FLOOR_R, RIM_H, C(a0) * FLOOR_R], STONE_DARK, null, [V3.mul(n0, -1), V3.mul(n1, -1), V3.mul(n1, -1), V3.mul(n0, -1)]);
      const r2 = RIM_R + 0.18;
      b.quad([S(a0) * r2, -0.95, C(a0) * r2], [S(a1) * r2, -0.95, C(a1) * r2], [S(a1) * r2, -0.62, C(a1) * r2], [S(a0) * r2, -0.62, C(a0) * r2], 0x5a566c, null, [n0, n1, n1, n0]);
      b.quad([S(a0) * RIM_R, -0.62, C(a0) * RIM_R], [S(a1) * RIM_R, -0.62, C(a1) * RIM_R], [S(a1) * r2, -0.62, C(a1) * r2], [S(a0) * r2, -0.62, C(a0) * r2], 0x5a566c, null, NY);
      for (let k = 0; k < 4; k++) {
        const ya = -0.95 - k * 4.5, yb = ya - 4.5;
        b.quad([S(a0) * RIM_R, yb, C(a0) * RIM_R], [S(a1) * RIM_R, yb, C(a1) * RIM_R], [S(a1) * RIM_R, ya, C(a1) * RIM_R], [S(a0) * RIM_R, ya, C(a0) * RIM_R], 0x4e4a60, null, [n0, n1, n1, n0]);
      }
    }
    [-1, 1].forEach(s => {
      b.at(s * 4.05, 0, -4.35, (h) => {
        h.box(0.95, 0.45, 0.95, 0x77738a, { base: true });
        h.prism(16, 0.31, 0.31, 0.45, 0.28, 0.28, 7.2, 0x8a86a0, { capTop: false });
        h.at(0, 7.2, 0, (c) => c.box(0.9, 0.35, 0.9, 0x77738a, { base: true }));
        h.at(0, 7.55, 0, (c) => c.box(1.1, 0.2, 1.1, 0x625e76, { base: true }));
      });
      b.at(s * 6.15, 3.8, WALL_Z + 0.3, (h) => h.box(0.9, 9.6, 0.6, 0x5e5a72));
      b.at(s * 5.1, 6.3, WALL_Z + 0.06, (h) => h.box(1.25, 2.3, 0.12, 0x4a465c));
    });
    b.at(0, 8.75, WALL_Z + 0.25, (h) => h.box(14.2, 0.35, 0.8, 0x625e76));
    const gz = WALL_Z + 0.05;
    b.tri([-7.1, 8.92, gz], [7.1, 8.92, gz], [0, 11.8, gz], 0x58546c, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    [-1, 1].forEach(s => {
      b.quad([0, 11.95, gz + 0.35], [s * 7.4, 8.85, gz + 0.35], [s * 7.4, 8.85, gz - 4.5], [0, 11.95, gz - 4.5], SLATE, null, [[s * 0.7, 0.7, 0], [s * 0.7, 0.7, 0], [s * 0.7, 0.7, 0], [s * 0.7, 0.7, 0]]);
    });
    b.at(0, 11.6, gz - 1.2, (h) => {
      h.prism(8, 0.7, 0.7, 0, 0.7, 0.7, 1.2, 0x58546c, { capTop: false });
      h.prism(8, 0.85, 0.85, 1.2, 0.03, 0.03, 4.4, SLATE);
      h.at(0, 4.5, 0, (c) => c.ellipsoid(0.08, 0.12, 0.08, 6, 4, 0x8a7a40));
    });
  }

  function buildFloor(b) {
    const rings = [0, 0.8, 1.6, 2.4, 3.2, 3.9, FLOOR_R];
    const n = 32;
    for (let j = 0; j < rings.length - 1; j++) {
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        const p = (a, r) => [S(a) * r, 0, C(a) * r];
        const uv = (a, r) => [0.5 + (S(a) * r) / (2 * FLOOR_R), 0.5 + (C(a) * r) / (2 * FLOOR_R)];
        b.quad(p(a0, rings[j]), p(a0, rings[j + 1]), p(a1, rings[j + 1]), p(a1, rings[j]), [1, 1, 1, 0], [uv(a0, rings[j]), uv(a0, rings[j + 1]), uv(a1, rings[j + 1]), uv(a1, rings[j])], NY);
      }
    }
  }

  const RAILS = [[0.42, 1.95], [-1.95, -0.42]];

  function buildRailing(b) {
    const r = 4.8;
    RAILS.forEach(([a0, a1]) => {
      const n = Math.round((Math.abs(a1 - a0) * r) / 0.17);
      let prev = null;
      for (let i = 0; i <= n; i++) {
        const a = lerp(a0, a1, i / n);
        const x = S(a) * r, z = C(a) * r;
        b.at(x, RIM_H, z, (h) => {
          h.box(0.028, 1.02, 0.028, IRON, { base: true });
          h.at(0, 1.02, 0, (c) => c.prism(4, 0.022, 0.022, 0, 0.002, 0.002, 0.08, IRON, { phase: PI / 4 }));
        });
        if (prev) {
          [0.12, 0.92].forEach(y => {
            const mx = (x + prev[0]) / 2, mz = (z + prev[1]) / 2;
            const len = Math.hypot(x - prev[0], z - prev[1]);
            b.push(M4.translate(mx, RIM_H + y, mz), M4.rotY(Math.atan2(x - prev[0], z - prev[1])));
            b.box(0.026, 0.035, len + 0.01, IRON);
            b.pop();
          });
          if (i % 3 === 0) {
            const mx = (x + prev[0]) / 2, mz = (z + prev[1]) / 2;
            b.push(M4.translate(mx, RIM_H + 0.62, mz), M4.rotY(Math.atan2(x - prev[0], z - prev[1])), M4.rotX(PI / 2));
            b.prism(8, 0.07, 0.07, -0.006, 0.07, 0.07, 0.006, IRON, { capTop: false });
            b.pop();
          }
        }
        prev = [x, z];
      }
    });
  }

  function leaf(b, p, size, a, tilt, col) {
    b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(a), M4.rotX(tilt));
    b.quad([0, 0, 0], [size * 0.45, size * 0.5, 0], [0, size, 0], [-size * 0.45, size * 0.5, 0], col, null, NZ);
    b.pop();
  }

  function buildIvy(b) {
    let k = 0;
    RAILS.forEach(([a0, a1]) => {
      for (let i = 0; i < 160; i++) {
        k++;
        const a = lerp(a0, a1, hash(k, 3));
        const y = RIM_H + Math.pow(hash(k, 5), 1.6) * 1.0;
        const r = 4.8 + (hash(k, 7) - 0.5) * 0.08;
        if (hash(k, 11) > 0.55 && y > RIM_H + 0.5) continue;
        leaf(b, [S(a) * r, y, C(a) * r], 0.07 + hash(k, 13) * 0.05, a + (hash(k, 17) - 0.5) * 2, (hash(k, 19) - 0.5) * 1.4, LEAF[k % 4]);
      }
    });
    for (let i = 0; i < 260; i++) {
      k++;
      const s = hash(k, 2) > 0.5 ? 1 : -1;
      const x = s * (3.4 + hash(k, 3) * 3.2);
      const y = -0.6 + Math.pow(hash(k, 5), 1.8) * 5.5;
      leaf(b, [x, y, WALL_Z + 0.04 + hash(k, 7) * 0.08], 0.09 + hash(k, 9) * 0.07, (hash(k, 11) - 0.5) * 0.8, (hash(k, 13) - 0.5) * 0.6, LEAF[k % 4]);
    }
    for (let i = 0; i < 120; i++) {
      k++;
      const a = (hash(k, 2) - 0.5) * 2 * 2.6;
      if (Math.abs(a) < 0.3) continue;
      const r = RIM_R + 0.01;
      leaf(b, [S(a) * r, -0.6 + hash(k, 3) * 0.9, C(a) * r], 0.08 + hash(k, 5) * 0.05, a, (hash(k, 7) - 0.5) * 0.8, LEAF[k % 4]);
    }
  }

  const HOUSES = [
    [-10.6, -1.4, 5.2, 5, 3.6, 3.0, 0], [-12.4, 6.2, 6, 5, 1.4, 2.6, 0], [-9.6, 13.2, 5, 6, -1.4, 2.4, 1],
    [10.8, -2.6, 5, 6, 2.6, 3.2, 1], [13.2, 6.0, 6, 5, 0.4, 2.6, 0], [8.6, 14.8, 5, 5, -2.2, 2.2, 0],
    [-3.8, 20.5, 6, 5, -4.0, 2.4, 0], [4.4, 22, 5, 6, -3.4, 2.4, 1], [-18, -7, 6, 6, 0.6, 3.0, 1],
    [18.4, -8.4, 6, 6, 1.6, 3.0, 0], [-22, 10.5, 7, 6, -2.0, 3.0, 0], [22.6, 12.2, 7, 6, -1.0, 3.0, 1],
    [-14.5, 22, 6, 6, -3.6, 2.8, 0], [15, 24, 6, 6, -3.0, 2.8, 0], [-27, -2, 7, 7, -1.0, 3.2, 1], [27, 2, 7, 7, -1.5, 3.2, 0]
  ];
  const TOWN_FLOOR = -16;

  function houseFrame(h) {
    const [x, z] = h;
    return M4.chain(M4.translate(x, 0, z), M4.rotY(Math.atan2(-x, -z)));
  }

  function buildTown(b) {
    HOUSES.forEach((h, i) => {
      const [, , w, d, top, roof, spire] = h;
      const wall = i % 3 === 0 ? 0x4a465a : i % 3 === 1 ? 0x403c50 : 0x48445a;
      b.push(houseFrame(h));
      [-1, 1].forEach(s => {
        b.quad([s * (w / 2 + 0.25), top - 0.1, -d / 2 - 0.25], [s * (w / 2 + 0.25), top - 0.1, d / 2 + 0.25], [0, top + roof, d / 2 + 0.25], [0, top + roof, -d / 2 - 0.25], SLATE, null, [[s * 0.75, 0.66, 0], [s * 0.75, 0.66, 0], [s * 0.75, 0.66, 0], [s * 0.75, 0.66, 0]]);
      });
      if (spire) {
        b.at(w * 0.28, top + roof * 0.4, d * 0.1, (c) => {
          c.prism(8, 0.75, 0.75, 0, 0.75, 0.75, 1.2, wall, { capTop: false });
          c.prism(8, 0.9, 0.9, 1.2, 0.02, 0.02, 4.6, SLATE);
        });
      }
      b.at(-w * 0.3, top + roof * 0.55, -d * 0.2, (c) => c.box(0.4, 1.2, 0.4, 0x38344a, { base: true }));
      b.pop();
    });
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * PI * 2 + hash(i, 1) * 0.1;
      const r = 48 + hash(i, 2) * 22;
      const w = 6 + hash(i, 3) * 10, top = -8 + hash(i, 4) * 10;
      b.push(M4.translate(S(a) * r, 0, C(a) * r), M4.rotY(a));
      b.at(0, (TOWN_FLOOR + top) / 2, 0, (c) => c.box(w, top - TOWN_FLOOR, 6, 0x24222e));
      if (hash(i, 5) > 0.5) b.at(0, top, 0, (c) => c.prism(6, w * 0.3, 2.5, 0, 0.05, 0.05, 3 + hash(i, 6) * 4, 0x1e1c26));
      b.pop();
    }
    b.quad([-160, TOWN_FLOOR, 160], [160, TOWN_FLOOR, 160], [160, TOWN_FLOOR, -160], [-160, TOWN_FLOOR, -160], 0x14141c, null, NY);
  }

  function buildHouseWalls(b) {
    HOUSES.forEach((h, i) => {
      const [, , w, d, top, roof] = h;
      const wall = i % 3 === 0 ? 0xa29eb4 : i % 3 === 1 ? 0x928ea6 : 0x9a96ae;
      b.push(houseFrame(h));
      b.at(0, (TOWN_FLOOR + top) / 2, 0, (c) => c.box(w, top - TOWN_FLOOR, d, wall, { uvScale: 0.625 }));
      [-1, 1].forEach(s => b.tri([-w / 2, top, s * d / 2], [w / 2, top, s * d / 2], [0, top + roof, s * d / 2], wall, [[0, 0], [w * 0.625, 0], [w * 0.31, roof * 0.625]], [[0, 0, s], [0, 0, s], [0, 0, s]]));
      b.at(0, top - 0.05, d / 2 + 0.05, (c) => c.box(w + 0.2, 0.18, 0.12, wall, { uvScale: 0.625 }));
      b.pop();
    });
  }

  function buildLitPanes(b) {
    HOUSES.forEach((h, i) => {
      const [, , w, d, top] = h;
      b.push(houseFrame(h));
      [top - 1.5, top - 3.6, top - 5.7].forEach((y, row) => {
        if (row === 2 && i % 2) return;
        [-1, 1].forEach(s => {
          if (hash(i * 7 + row, s + 3) < 0.18) return;
          const x = s * w * 0.22;
          b.quad([x - 0.38, y - 0.75, d / 2 + 0.03], [x + 0.38, y - 0.75, d / 2 + 0.03], [x + 0.38, y + 0.75, d / 2 + 0.03], [x - 0.38, y + 0.75, d / 2 + 0.03], [1, 1, 1, 0.96], [[0, 0], [1, 0], [1, 1], [0, 1]], NZ);
        });
      });
      b.pop();
    });
    for (let i = 0; i < 60; i++) {
      const a = hash(i, 21) * PI * 2;
      const r = 47 + hash(i, 22) * 20;
      const y = -10 + hash(i, 23) * 9;
      b.push(M4.translate(S(a) * r, y, C(a) * r), M4.rotY(a + PI));
      b.quad([-0.35, -0.6, 0], [0.35, -0.6, 0], [0.35, 0.6, 0], [-0.35, 0.6, 0], [1, 1, 1, 0.96], [[0, 0], [1, 0], [1, 1], [0, 1]], NZ);
      b.pop();
    }
  }

  function buildPurplePanes(b) {
    const quad = (x, y, z, w, h) => b.quad([x - w / 2, y - h / 2, z], [x + w / 2, y - h / 2, z], [x + w / 2, y + h / 2, z], [x - w / 2, y + h / 2, z], [1, 1, 1, 0.97], [[0, 0], [1, 0], [1, 1], [0, 1]], NZ);
    [-1, 1].forEach(s => {
      quad(s * 5.1, 6.3, WALL_Z + 0.13, 1.0, 2.0);
      quad(s * 2.6, 9.6, WALL_Z + 0.08, 0.55, 1.0);
    });
    quad(0, 10.45, WALL_Z + 0.08, 0.6, 0.95);
  }

  const BUNTING = [[[-6.6, 8.3, -4.6], [-15.5, 4.6, 9.0], 1.6], [[6.6, 8.3, -4.6], [16.5, 5.2, 8.0], 1.5], [[-11, 6.4, 13], [11, 6.8, 15], 2.2]];

  function buildBunting(b) {
    BUNTING.forEach(([p0, p1, sag], j) => {
      const len = V3.len(V3.sub(p1, p0));
      const n = Math.round(len / 0.7);
      const at = (u) => { const p = mixV(p0, p1, u); p[1] -= sag * 4 * u * (1 - u); return p; };
      for (let i = 0; i < n; i++) {
        const a = at(i / n), c = at((i + 1) / n);
        b.quad([a[0], a[1] - 0.012, a[2]], [c[0], c[1] - 0.012, c[2]], [c[0], c[1] + 0.012, c[2]], [a[0], a[1] + 0.012, a[2]], IRON, null, NZ);
        const m = at((i + 0.5) / n);
        const dir = V3.norm(V3.sub(c, a));
        const w = 0.22;
        const col = [0x8a7a2a, 0x6a5a1e, 0x9a3a2a][(i + j) % 3];
        b.tri(V3.sub(m, V3.mul(dir, w)), V3.add(m, V3.mul(dir, w)), [m[0], m[1] - 0.42, m[2]], col);
      }
    });
  }

  function buildDome(b) {
    const R0 = 200, nu = 32, nv = 10;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const a0 = (i / nu) * PI * 2, a1 = ((i + 1) / nu) * PI * 2;
        const e0 = lerp(-0.25, PI / 2, j / nv), e1 = lerp(-0.25, PI / 2, (j + 1) / nv);
        const p = (a, e) => [S(a) * C(e) * R0, S(e) * R0 - 30, C(a) * C(e) * R0];
        const uv = (a, e, ii) => [(ii / nu) * 3, (e + 0.25) / (PI / 2 + 0.25)];
        b.quad(p(a0, e0), p(a1, e0), p(a1, e1), p(a0, e1), [1, 1, 1, 0.98], [uv(a0, e0, i), uv(a1, e0, i + 1), uv(a1, e1, i + 1), uv(a0, e1, i)], NZ);
      }
    }
  }

  const BEAMS = [
    { at: [-6.8, -13, 1.6], dir: [0.16, 1, -0.12], len: 36, w: 0.9, a: 0.1, sway: 0.04, ph: 0.3, near: true },
    { at: [-22, -15, 18], dir: [0.1, 1, 0.05], len: 80, w: 2.6, a: 0.11, sway: 0.25, ph: 1.1 },
    { at: [18, -15, 24], dir: [-0.15, 1, 0], len: 80, w: 2.6, a: 0.11, sway: 0.2, ph: 2.3 },
    { at: [-30, -15, -6], dir: [0.2, 1, 0.1], len: 80, w: 2.6, a: 0.09, sway: 0.3, ph: 3.2 },
    { at: [28, -15, -10], dir: [-0.2, 1, 0.1], len: 80, w: 2.6, a: 0.09, sway: 0.28, ph: 4.4 }
  ];

  function texBrick(ctx, w, h) {
    ctx.fillStyle = '#3e3a4c';
    ctx.fillRect(0, 0, w, h);
    const bw = 64, bh = 32;
    let s = 5;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let row = 0; row < h / bh; row++) {
      for (let col = -1; col <= w / bw; col++) {
        const x = col * bw + (row % 2 ? bw / 2 : 0), y = row * bh;
        const v = 96 + rnd() * 30;
        ctx.fillStyle = `rgb(${Math.round(v * 0.92)},${Math.round(v * 0.9)},${Math.round(v * 1.08)})`;
        ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x + 2, y + 2, bw - 4, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let k = 0; k < 5; k++) ctx.fillRect(x + 4 + rnd() * (bw - 10), y + 4 + rnd() * (bh - 10), 3, 2);
      }
    }
  }

  function texFloor(ctx, w, h) {
    ctx.fillStyle = '#4a4660';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R0 = w / 2;
    const rings = [0, 0.17, 0.35, 0.52, 0.69, 0.85, 1.0];
    const counts = [1, 8, 14, 20, 26, 34];
    let s = 9;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    ctx.strokeStyle = '#2e2a3c';
    ctx.lineWidth = 3;
    for (let k = 0; k < counts.length; k++) {
      const r0 = rings[k] * R0, r1 = rings[k + 1] * R0, n = counts[k];
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2 + k * 0.3, a1 = ((i + 1) / n) * PI * 2 + k * 0.3;
        const v = (k === counts.length - 1 ? 86 : 104) + rnd() * 24;
        ctx.fillStyle = `rgb(${Math.round(v * 0.9)},${Math.round(v * 0.92)},${Math.round(v * 1.02)})`;
        ctx.beginPath();
        if (r0 === 0) ctx.arc(cx, cy, r1, 0, PI * 2);
        else {
          ctx.arc(cx, cy, r1, a0, a1);
          ctx.arc(cx, cy, r0, a1, a0, true);
          ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.strokeStyle = '#2a2638';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
  }

  function texGlass(ctx, w, h) {
    const cx = w / 2, cy = h / 2, R0 = w / 2;
    const cols = ['#f052b8', '#b044f0', '#7448f0', '#e888dc', '#5468f0', '#c8a0ff', '#d040a8', '#8c58ff', '#4a8cf0'];
    let s = 11;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    ctx.fillStyle = '#2a0a3a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#12061a';
    ctx.lineWidth = 6;
    const ring = (r0, r1, n, off) => {
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2 + off, a1 = ((i + 1) / n) * PI * 2 + off;
        ctx.beginPath();
        ctx.arc(cx, cy, r1, a0, a1);
        ctx.arc(cx, cy, r0, a1, a0, true);
        ctx.closePath();
        ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
        ctx.fill();
        ctx.stroke();
      }
    };
    ring(R0 * 0.8, R0 * 0.99, 32, 0);
    ring(R0 * 0.52, R0 * 0.8, 16, PI / 16);
    ring(R0 * 0.3, R0 * 0.52, 12, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i * PI) / 4;
      ctx.beginPath();
      ctx.arc(cx + C(a) * R0 * 0.41, cy + S(a) * R0 * 0.41, R0 * 0.15, 0, PI * 2);
      ctx.fillStyle = cols[(i * 3) % cols.length];
      ctx.fill();
      ctx.stroke();
    }
    ring(R0 * 0.1, R0 * 0.3, 8, PI / 8);
    ctx.beginPath();
    ctx.arc(cx, cy, R0 * 0.1, 0, PI * 2);
    ctx.fillStyle = '#ffd6f2';
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 4;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + C(a) * R0 * 0.1, cy + S(a) * R0 * 0.1);
      ctx.lineTo(cx + C(a) * R0 * 0.99, cy + S(a) * R0 * 0.99);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R0);
    g.addColorStop(0, 'rgba(255,230,250,0.45)');
    g.addColorStop(0.6, 'rgba(255,120,220,0.12)');
    g.addColorStop(1, 'rgba(40,0,60,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function texSky(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#05061a');
    g.addColorStop(0.55, '#0e1434');
    g.addColorStop(0.85, '#1e2650');
    g.addColorStop(1, '#2c3262');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    let s = 3;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 900; i++) {
      const x = rnd() * w, y = Math.pow(rnd(), 1.3) * h * 0.86, k = rnd();
      ctx.fillStyle = k > 0.85 ? '#ffffff' : k > 0.5 ? '#c8d4ff' : '#8890c0';
      const sz = k > 0.93 ? 2 : 1;
      ctx.fillRect(x, y, sz, sz);
    }
    for (let i = 0; i < 26; i++) {
      const x = rnd() * w, y = h * (0.78 + rnd() * 0.18), r = 30 + rnd() * 70;
      ctx.fillStyle = 'rgba(120,130,190,0.07)';
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.25, 0, 0, PI * 2);
      ctx.fill();
    }
  }

  function archPath(ctx, w, h, pad) {
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(pad, w / 2);
    ctx.arc(w / 2, w / 2, w / 2 - pad, PI, 0);
    ctx.lineTo(w - pad, h - pad);
    ctx.closePath();
  }

  function texWin(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    archPath(ctx, w, h, 4);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffe8a8');
    g.addColorStop(1, '#ff9a3c');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#3a2410';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w / 2, 10);
    ctx.lineTo(w / 2, h - 4);
    ctx.moveTo(4, h * 0.56);
    ctx.lineTo(w - 4, h * 0.56);
    ctx.stroke();
  }

  function texPurple(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    archPath(ctx, w, h, 3);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffb4ff');
    g.addColorStop(0.5, '#e05cf4');
    g.addColorStop(1, '#7a22d8');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#1e0a26';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2, 6);
    ctx.lineTo(w / 2, h - 3);
    for (let y = h * 0.42; y < h; y += h * 0.18) {
      ctx.moveTo(3, y);
      ctx.lineTo(w - 3, y);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, w / 2, w * 0.2, 0, PI * 2);
    ctx.stroke();
  }

  function texSpark(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.3);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8f8ff';
    [[1, 0.06], [0.06, 1]].forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, (w / 2) * sx, (h / 2) * sy, 0, 0, PI * 2);
      ctx.fill();
    });
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

  function drawRose(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#2e5a2a';
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, r * 0.9);
    ctx.quadraticCurveTo(r * 0.4, r * 1.6, r * 1.6, r * 1.3);
    ctx.stroke();
    ctx.fillStyle = '#2e6a32';
    [[r * 0.7, r * 1.45, 0.5], [r * 1.25, r * 1.3, -0.3]].forEach(([lx, ly, a]) => {
      ctx.beginPath();
      ctx.ellipse(lx, ly, r * 0.32, r * 0.14, a, 0, PI * 2);
      ctx.fill();
    });
    const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#ff9ac8');
    g.addColorStop(0.6, '#e8306e');
    g.addColorStop(1, '#8a0c34');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a0420';
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    for (let a = 0; a < PI * 7; a += 0.2) {
      const rr = r * (0.08 + (a / (PI * 7)) * 0.86);
      ctx.lineTo(C(a) * rr, S(a) * rr);
    }
    ctx.stroke();
    ctx.restore();
  }

  function texTitle(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    drawRose(ctx, 120, 118, 74);
    ctx.font = `bold ${Math.round(h * 0.33)}px "Yu Mincho", "MS Mincho", "Hiragino Mincho ProN", serif`;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#26040f';
    ctx.strokeText('ロミオとシンデレラ', 230, 118);
    const g = ctx.createLinearGradient(0, 60, 0, 170);
    g.addColorStop(0, '#ffd4e6');
    g.addColorStop(0.5, '#ff5c9e');
    g.addColorStop(1, '#c4164e');
    ctx.fillStyle = g;
    ctx.fillText('ロミオとシンデレラ', 230, 118);
    ctx.font = `italic bold ${Math.round(h * 0.15)}px Georgia, "Times New Roman", serif`;
    ctx.lineWidth = 6;
    ctx.strokeText('doriko', 150, 214);
    ctx.fillStyle = '#ff86b8';
    ctx.fillText('doriko', 150, 214);
  }

  const FW = 512;
  const MAIN = { x: 0, y: 48, w: FW, h: 288 };
  const OVER_ENV = { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0, 0, 0], fogNear: 1000, fogFar: 2000, points: [] };
  const FOG = [0.05, 0.06, 0.13];

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

  function clockAngles(t) {
    const k = clamp(t / 277.6, 0, 1);
    const min = 52 + 8 * k;
    return { minute: (min / 60) * PI * 2, hour: ((11 + min / 60) / 12) * PI * 2 };
  }

  function sparkAt(t) {
    let best = 0, at = 0;
    dissolves.forEach(tc => {
      const k = Math.exp(-Math.pow((t - tc) / 0.32, 2));
      if (k > best) { best = k; at = tc; }
    });
    return { k: best, at };
  }

  function create(r) {
    const X = Cast.makeCast(r);
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    const T = {
      brick: r.texture(256, texBrick),
      floor: r.texture(512, texFloor, { clamp: true }),
      glass: r.texture(512, texGlass, { clamp: true }),
      sky: r.texture(1024, texSky, { height: 512 }),
      win: r.texture(64, texWin, { height: 128, clamp: true }),
      purple: r.texture(64, texPurple, { height: 128, clamp: true }),
      spark: r.texture(64, texSpark, { clamp: true }),
      glow: r.texture(64, texGlow, { clamp: true }),
      title: r.texture(1024, texTitle, { height: 256, clamp: true })
    };
    const M = {
      tower: mk(buildTower), wall: mk(buildWall), clock: mk(buildClock), glass: mk(glassDisc), floor: mk(buildFloor), rail: mk(buildRailing), ivy: mk(buildIvy),
      town: mk(buildTown), houses: mk(buildHouseWalls), panes: mk(buildLitPanes), purple: mk(buildPurplePanes), bunting: mk(buildBunting), sky: mk(buildDome),
      minute: mk(clockHand(2.0, 0.085)), hour: mk(clockHand(1.35, 0.12)), mic: mk(RC.micMesh)
    };
    const Q = {
      unit: mk(b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], null, NZ)),
      sprite: mk(b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], NZ)),
      beam: mk(b => b.prism(14, 0.16, 0.16, 0, 1, 1, 1, [1, 1, 1, 1], { capTop: false, topColor: [0, 0, 0, 1] }))
    };
    const tails = { vbo: r.gl.createBuffer(), count: 0 };

    function uploadTails(b) {
      const gl = r.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, tails.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(b.data), gl.DYNAMIC_DRAW);
      tails.count = b.count;
    }

    function keyDir(cm) {
      const f = V3.norm(V3.sub(cm.at, cm.eye));
      let rt = V3.cross(f, [0, 1, 0]);
      if (V3.len(rt) < 1e-3) rt = [1, 0, 0];
      rt = V3.norm(rt);
      return V3.norm(V3.add(V3.add(V3.mul(f, 0.6), V3.mul(rt, 0.45)), [0, -0.62, 0]));
    }

    function envFor(st) {
      const g = st.glass;
      const m = st.miku;
      return {
        sunDir: keyDir(st.camera), sunColor: [0.76, 0.75, 0.84], ambTop: [0.34, 0.36, 0.47], ambBottom: [0.17, 0.17, 0.25],
        fogColor: FOG, fogNear: 30, fogFar: 160,
        points: [{ pos: [0, 3.4, -3.8], color: [1.0 * g, 0.4 * g, 1.0 * g] }, { pos: [m.root[0] + 0.6, 2.6, m.root[2] + 1.8], color: [0.32, 0.3, 0.38] }]
      };
    }

    const SHADOW = M4.planarShadow(V3.norm([0.3, -1, 0.42]), 0.004);
    const SHADOW_PASS = { flat: [0.03, 0.02, 0.07, 0.4], shadow: true };

    function drawMiku(st, form) {
      const a = Object.assign({}, st.miku, { form });
      const spec = Cast.FORMS[form];
      const mic = st.mic;
      const micM = M4.chain(M4.translate(mic.bottom[0], mic.bottom[1], mic.bottom[2]), alignY(mic.dir));
      let tailMesh = null;
      if (spec.tails) {
        const b = new Builder();
        const [left, right, lat] = st.tails;
        const H = RC.HAIRS[spec.tails.hair];
        RC.tailMesh(b, left, lat, H);
        RC.tailMesh(b, right, lat, H);
        uploadTails(b);
        tailMesh = tails;
      }
      Cast.drawActor(r, X, a, { pre: SHADOW, flat: SHADOW_PASS.flat, shadow: true });
      if (tailMesh) r.draw(tailMesh, SHADOW, SHADOW_PASS);
      r.draw(M.mic, M4.mul(SHADOW, micM), SHADOW_PASS);
      Cast.drawActor(r, X, a);
      if (tailMesh) r.draw(tailMesh, null, {});
      r.draw(M.mic, micM, {});
    }

    function drawSet(st, t) {
      const g = st.glass;
      r.draw(M.sky, null, { texture: T.sky, noFog: true });
      r.draw(M.town, null, {});
      r.draw(M.houses, null, { texture: T.brick });
      r.draw(M.panes, null, { texture: T.win, tint: [1, 0.92, 0.8] });
      r.draw(M.bunting, null, {});
      r.draw(M.tower, null, {});
      r.draw(M.wall, null, { texture: T.brick });
      r.draw(M.floor, null, { texture: T.floor });
      r.draw(M.clock, null, {});
      r.draw(M.glass, null, { texture: T.glass, tint: [lerp(0.16, 1, g), lerp(0.14, 1, g), lerp(0.22, 1, g)] });
      r.draw(M.purple, null, { texture: T.purple, tint: [0.95, 0.9, 1] });
      const ang = clockAngles(t);
      r.draw(M.hour, M4.chain(M4.translate(CLOCK[0], CLOCK[1], CLOCK[2] + 0.2), M4.rotZ(-ang.hour)), {});
      r.draw(M.minute, M4.chain(M4.translate(CLOCK[0], CLOCK[1], CLOCK[2] + 0.24), M4.rotZ(-ang.minute)), {});
      r.draw(M.rail, null, {});
      r.draw(M.ivy, null, {});
    }

    function drawGlows(st, t) {
      const cm = st.camera;
      const bb = billboard(cm);
      BEAMS.forEach(bm => {
        const sw = S(t * 0.22 + bm.ph) * bm.sway;
        const dir = V3.norm([bm.dir[0] + sw, bm.dir[1], bm.dir[2] + C(t * 0.17 + bm.ph) * bm.sway * 0.6]);
        const a = bm.near ? bm.a * (0.6 + 1.4 * st.shaft) : bm.a * (0.5 + 0.5 * st.beams);
        const Mb = M4.chain(M4.translate(bm.at[0], bm.at[1], bm.at[2]), alignY(dir), M4.scale(bm.w, bm.len, bm.w));
        r.draw(Q.beam, Mb, { additive: true, noFog: true, alpha: a, tint: [0.72, 0.8, 1] });
      });
      const sp = sparkAt(t);
      if (sp.k > 0.02) {
        const m = st.miku;
        for (let i = 0; i < 22; i++) {
          const a = i * 2.39996 + (t - sp.at) * 1.6;
          const rr = 0.28 + hash(i, 3) * 0.32;
          const y = 0.15 + hash(i, 5) * 1.55;
          const tw = 0.5 + 0.5 * S(t * 23 + i * 1.7);
          const p = [m.root[0] + S(a) * rr, y + (t - sp.at) * 0.3, m.root[2] + C(a) * rr];
          r.draw(Q.sprite, M4.chain(M4.translate(p[0], p[1], p[2]), bb, M4.scale(0.07 + 0.09 * tw)), { texture: T.spark, additive: true, noFog: true, alpha: sp.k * (0.6 + 0.4 * tw), tint: [1, 0.85, 1] });
        }
      }
      const g = st.glass;
      r.draw(Q.sprite, M4.chain(M4.translate(CLOCK[0], CLOCK[1], CLOCK[2] + 0.3), bb, M4.scale(7.2)), { texture: T.glow, additive: true, noFog: true, alpha: 0.16 * g, tint: [1, 0.45, 0.95] });
      const mic = st.mic;
      r.draw(Q.sprite, M4.chain(M4.translate(mic.top[0], mic.top[1], mic.top[2]), bb, M4.scale(0.2)), { texture: T.glow, additive: true, noFog: true, alpha: 0.32, tint: [1, 0.4, 0.75] });
    }

    let polys = 0;
    const tally = () => { polys += r.polys; r.polys = 0; };
    const F = { full: r.frameTexture(), small: r.frameTexture(), tiny: r.frameTexture(), mix: r.frameTexture() };
    const ORTHO_MAIN = new Float32Array([2 / MAIN.w, 0, 0, 0, 0, 2 / MAIN.h, 0, 0, 0, 0, -1, 0, -1, -1, 0, 1]);
    const inMain = (colorM, colorAdd) => {
      tally();
      r.begin(OVER_ENV, { proj: ORTHO_MAIN, view: M4.ident(), colorM, colorAdd }, MAIN, true);
    };
    const rect = (x, y, w, h, opts) => r.draw(Q.unit, M4.chain(M4.translate(x, y, 0), M4.scale(w, h, 1)), Object.assign({ noFog: true }, opts));

    function bloom() {
      const gain = 2.2, cut = -1.15, k = 0.5;
      r.grab(F.full, MAIN.x, MAIN.y, MAIN.w, MAIN.h);
      inMain(new Float32Array([gain, 0, 0, 0, gain, 0, 0, 0, gain]), [cut, cut, cut]);
      rect(0, 0, 128, 72, { texture: F.full });
      r.grab(F.small, MAIN.x, MAIN.y, 128, 72);
      inMain();
      rect(0, 0, 32, 18, { texture: F.small });
      r.grab(F.tiny, MAIN.x, MAIN.y, 32, 18);
      rect(0, 0, MAIN.w, MAIN.h, { texture: F.full });
      rect(0, 0, MAIN.w, MAIN.h, { texture: F.small, additive: true, alpha: 0.6 * k });
      rect(0, 0, MAIN.w, MAIN.h, { texture: F.tiny, additive: true, alpha: k });
    }

    function frame(st, t, form) {
      r.clear([0, 0, 0]);
      r.begin(envFor(st), st.camera, MAIN);
      drawSet(st, t);
      drawMiku(st, form);
      drawGlows(st, t);
      bloom();
    }

    function titleCard(st) {
      if (st.title <= 0.01) return;
      inMain();
      rect(20, 150, 470, 117.5, { texture: T.title, blend: true, alpha: st.title });
    }

    return {
      warm() {
        Object.keys(ARMS).forEach(n => { if (!ARMS[n].a) { armOf(n, 'L', 0); armOf(n, 'R', 0); } });
        Object.keys(RC.FORMS).forEach(f => X.form(f));
      },
      render(t) {
        polys = 0;
        r.polys = 0;
        const shot = shotAt(t);
        const st = stage(t, shot);
        st.tails = tailsOf(t, st.miku);
        const cos = st.costume;
        if (cos.prev) {
          frame(st, t, cos.prev);
          tally();
          r.grab(F.mix, MAIN.x, MAIN.y, MAIN.w, MAIN.h);
          frame(st, t, cos.form);
          inMain();
          rect(0, 0, MAIN.w, MAIN.h, { texture: F.mix, blend: true, alpha: 1 - cos.mix });
        } else {
          frame(st, t, cos.form);
        }
        titleCard(st);
        tally();
        return { shot, polys: Math.round(polys), fade: fadeAt(t), overlay: null };
      }
    };
  }

  const clip = {
    id: 'romeo-and-cinderella',
    number: 12,
    artist: 'Хацунэ Мику',
    title: 'Romeo and Cinderella',
    originalYear: 2011,
    audio: 'content/clip/Hatsune Miku - Romeo and Cinderella.mp3',
    duration: DURATION,
    bpm: BPM,
    beat0: BEAT0,
    poster: 8.6,
    locations: LOCATIONS,
    shots: SHOTS,
    looks: CHARACTERS,
    shotAt,
    stage,
    fadeAt,
    voiceAt,
    mouthFor,
    energyAt,
    rootAt,
    costumeAt,
    tailsAt: (t) => tailsOf(t, mikuAt(t)),
    moveAt: (t) => danceAt(t).move,
    costumes: COSTUMES,
    create
  };

  window.poligonClips = window.poligonClips || [];
  if (!window.poligonClips.some(c => c.id === clip.id)) window.poligonClips.push(clip);
})();
