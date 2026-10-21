(function () {
  const { M4, V3, Builder, shade, rgb } = window.P3D;
  const { Figure, restPose, DIM } = window.P3DFigure;
  const Cast = window.P3DCccCast;

  const BPM = 130;
  const BEAT0 = 0.026;
  const DURATION = 180.77;
  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const beat = (n) => BEAT0 + (n * 60) / BPM;
  const beatAt = (t) => ((t - BEAT0) * BPM) / 60;

  const LOCATIONS = [
    { id: 'void', name: 'Темнота', color: '#2a1840', scene: 'void' },
    { id: 'bus', name: 'Автобус', color: '#e8b020', scene: 'bus' },
    { id: 'expo', name: 'Кон снаружи', color: '#6aa040', scene: 'expo' },
    { id: 'room', name: 'Номер 302', color: '#a87848', scene: 'room' },
    { id: 'hall', name: 'Коридоры', color: '#4878c0', scene: 'hall' },
    { id: 'sheet', name: 'Листы персонажей', color: '#f0b8d8', scene: 'sheet' },
    { id: 'memory', name: 'Воспоминания', color: '#c8a070', scene: 'memory' },
    { id: 'disco', name: 'Дискотека', color: '#b020c0', scene: 'disco' },
    { id: 'ship', name: 'Корабль Авии', color: '#60c8f0', scene: 'ship' },
    { id: 'stage', name: 'Концерт', color: '#e03838', scene: 'stage' }
  ];

  const SHOT_LIST = [
    [0, 'void', 'click'], [4, 'void', 'shadows'], [8, 'void', 'turn'], [11, 'void', 'spots'], [20, 'void', 'eyes'], [24, 'void', 'lineup'],
    [32, 'bus', 'aisle'], [40, 'bus', 'amanda'], [44, 'bus', 'badge'], [48, 'bus', 'makoto'], [52, 'bus', 'glare'], [56, 'expo', 'road'], [60, 'expo', 'arrive'],
    [64, 'room', 'costumes'], [68, 'room', 'gorilla'], [72, 'room', 'knock'], [76, 'room', 'elevator'], [80, 'hall', 'crowd'], [84, 'hall', 'call'], [88, 'expo', 'sky'], [92, 'expo', 'lean'],
    [96, 'sheet', 'amandaSheet'], [103, 'sheet', 'makotoSheet'], [111, 'sheet', 'talleahSheet'], [119, 'sheet', 'panels'],
    [128, 'expo', 'bow'], [132, 'expo', 'cuffs'], [136, 'hall', 'escort'], [140, 'hall', 'onlookers'], [144, 'hall', 'corner'], [148, 'hall', 'redflash'], [152, 'hall', 'standoff'], [156, 'hall', 'ceiling'],
    [160, 'memory', 'starroad'], [168, 'hall', 'moths'], [176, 'hall', 'burst'], [180, 'hall', 'blush'], [184, 'expo', 'bench'],
    [192, 'hall', 'sinister'], [196, 'hall', 'shootout'], [200, 'memory', 'vault'], [204, 'memory', 'portal'], [208, 'disco', 'dance'], [216, 'disco', 'tandem'], [220, 'disco', 'gone'], [223, 'hall', 'alone'],
    [224, 'room', 'hands'], [228, 'room', 'stare'], [232, 'room', 'gynoid'], [236, 'room', 'holo'], [240, 'room', 'phase'], [248, 'ship', 'hangar'],
    [256, 'ship', 'tube'], [264, 'ship', 'hug'], [268, 'hall', 'door'], [272, 'hall', 'scan'], [280, 'hall', 'standee'], [284, 'hall', 'salute'],
    [288, 'room', 'corners'], [296, 'room', 'started'], [300, 'room', 'bed'], [304, 'room', 'lower'], [312, 'hall', 'run'],
    [320, 'stage', 'reveal'], [324, 'stage', 'cheer'], [328, 'stage', 'beams'], [332, 'stage', 'fireworks'], [336, 'stage', 'walk'], [344, 'stage', 'reach'], [348, 'stage', 'crane'],
    [352, 'room', 'night'], [357, 'void', 'three'], [365, 'void', 'one'], [373, 'void', 'photo'], [376, 'room', 'coda']
  ];

  const EMPTY_CAMS = ['click', 'road', 'arrive', 'gynoid', 'costumes', 'gorilla', 'sky', 'hands', 'stare', 'night', 'coda'];

  const STARTS = SHOT_LIST.map(([n]) => (n === 0 ? 0 : beat(n)));
  const SHOTS = SHOT_LIST.map(([n, loc, cam], i) => ({
    index: i,
    beat: n,
    start: STARTS[i],
    end: i + 1 < STARTS.length ? STARTS[i + 1] : DURATION,
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

  const VOICE = '000000000000000000000000000000000000000000000000000000000000000dzzlmzyxywxyxxwwvuvwwsjlkvvvvwxxyyxrmkmxzzzzyxyywwwwxxwvwwvuvuvtvwuwxsrssrpprroppnmjnnpsrrttstttsussutsuututstrsprpqqqpqqqrrqpnnlljlllihkjihdeeeuxwvrvxwyvttpkrtutuuvvwwvsoruuuusrrqrrpiejxyxyyyxxwwwwwvuvtsuspojijhgfeecqzzzrkywwwuvvokvvwwvyzvyxtvurvxvussmikjutuwwvvvrwvnjijiijvwvtsrroljhfedijfauxxxuvwxwuwvvqottttvvvsrxxwvrlllouuvwwvkkmsrgfgxzzywuqnntxvvvwwuuolmjdegdfehecvzzxtuvuuvvuuuusttmvxvvxwvwvxywwxxwwwvtrmnnwvvvvvwunsvwvuvuttpjjffjkjgyxvvkxwvkrwwuvuvtlprtsnuvshsvtsswyxwssmkjlxwwvuponqyxyxvvuvwvtrlmwzzyvxxxxwwwyywsmnkkliidccdcaaalzxxvvtolkvzzzxyxwyxwxyzyyyywsoonyyyxyywwwxxtooxxwwvvumnruvwwwvsrlhfcedefbjzzzyvsolnxzxxyxwxzxwxxsyzyxvrmmszzyzyxyysuxwpowwuxywvxyywxxvyxwwxrpoplihgxzzzyvrmnwzyxyzzwzyyyxwpxzzzvuporyyyyxwxwxyywontvvuxwvsmpxxwvvuropmhhfeeeezzzzztoomqzzzyyyxyxvvrnvzzyxurnlszzyzzyzxxxwrmtxvuuuttrmfgfehmvwxxuttuuutnrvvxxvuriisuwutuvwwmlkgmustuuuvwuvtvuuyzyyzwvvvxyyxwvnmjklhftvpgryyxzzzxzzwyzxzzwsqtzywxxxupmuwyyxvvvvvwwwxyyyytmmjuyyxxyxxvrlkkjiihftzyzyxwwurwzzxwvuuuvxyyxxwpotutvsswvvwwxxwyywwwwzzzzvwwstxxxyxyvutollkwzwvtutphlwvsvwvvuruzywxwnkkmzzzywqnmjwxpjnzxwxxwwwxwrnoxvusvusmmuyyzyxwspjmnlicbb9654456787mzzyzwvqnlwzzxyyxyzyxyysyzzzxpmnjnzzxxxxxywtpmmuxxxwwolmntrrwuusnlhffiifccszzzyutnlszzxxzxxxyvvtnryzywtnmktzxyyxvvwvxyxqtvvvxyvvvvuuvvwxwwvsokjiihiiszzzyvqmnmvzyywwyyxvvtppzzxwtonmwzzxyyyyxsywqltstvvvtqmltxwvxxusrmjihhggfdvzzzyvplnyzwxyyyyywwvtnwzyywomlnyzyyzyyxyyxwrnwxywwwxusoikkggpsmevwwvuroxywrmkrvtibpwvvrleqwvsurtvsgiqwyyyywqnlqssrggeedswuuuuvpjghjhizylmosvurldsxxwwxwvvnmkruyywrkruvutsuvsjlpxxyzwlkkmstlivukgkvwvvsklgfdgfekwwwvwxvtnrummtywwvlkiiozzzzzxuvrwxwtrwvvvvzzwumopnnxwyxxtpnmswxwwvvvvwmmmijjc9brwulwwuutuutsuuuwwvvxyxxvootxxqovskinzzzzzxvqmtxyxuvwwtvwvuwxxwuqusrrswvtmvuihwwtvvvqljrwvrhelnjgzzyysvlhluxtsrttqkvwwqlkjlsxwxxxwxwvplljhwzyqtwvvyxwqpkltwwwwvrwxtjjjxvljjituttslmssnicpzyyxvvvsnvwusuwwvvvuwwpmnghfddc4a87mvspgwxxvyyxoqqwxwwzyzxwwwwwvvvomuzyzzxxxxxuompzxyxxwxxsxzzzzzxxxxrmlllmhisvvonvwvtwwwvttrhjjtwwwuxwqluvuvwwurktvvxxwxxwvyyzzvoonlyyyyzzxywwwwwvuuvsrplkmigffnzzyzwqklnwyyyyxxxwwyxqowzzywqllnyyxxxwxwtuwsmqvwyxutnklvwtuvutrkgcccbaa96lyzzyvrmlnzzyyyzwwxwuunryyxvtlkjoyzxxxuxxwyxtmvwwuxywoyyxwxxxvuutnkjggdgfexxyyvsnklszzxyyyxxwvuqmnwzzxsnlkpyzyyyxxxtswunluvvwvvoklqwuvuuqnmpjdfecccauzzyxsmkkpzzyzzxxxxvvsnszzzxxvsnqyxyzwxxwyxxnovwxvvusrqjiigcfmuuvxwxxwxwwwvyyyxxxvwqwyyyywuttrwwuwxwwwwwwyxxxusvxyyzzyposzxwxwwvtihihiknjg8lxwvvuoqouwxwxwwmjuxyxvvwvvttsqotrmgtxxxvrlwyxxyyxxwspowzyyyxwqlklkkjzzzzzyxrlswwqtyxyyvwrnluzzzyvtonqqsspyzzzywxxxxyyyyvvuttvtttwyxynlkjjtyumjxxwxvvvvwzzypqwxuozxuwwxywxxxzyxvuomrzzwvonlitzzyzzyyyvvpklljjiewyywpwyyyxywmltxwwxxyuxwwvqlmywwutrigrxwwwvvtpvzzxrkiikkyyxwxvvvqnmmmjkmmgixxxxwxyzyywwtvxwwxxxxqsyxxxmlmknyxyyvqkonvuiimzzzzyuqlmwyxywyywwvqpmggighghgbbtywuuvwwwxxxxwvvumrzyxyxwwxxyyxxwxxwutmkkvyxxxxwxvnvwxxxwvwwqnljhjjievxxvszzpntwxwvwxwmqwwvsxyulhywxonzzyxwmooqzxxwtnppuxyxvwxxwxxsqnuyzzzzwxxwwxwyxuspmklkljdfgfbcbemzzyyxnmmityyyyyxxzwwwsonzyyvpnmkwywwxwxxvvutkmxyvxvvrknouuvvvvstqjgfhfbe9mzyyxxtnlmwyxxxxywyxwwvsyxyxumkjkvzxyyxvxxwxuoqxwvwywsvvuwxwvwvwwpklkjggfikyyyyysnmmxyxxxxwxxyvsnpwyzxssonmxyxyywvywuwulrvwwwwwwmmrwwvutrsqmkhiifgifrzzyxxrlmlvzyyyxxyyxwuqlzyxvtpmlqzyyzxyyyyyxspuvvwwvvvuutsppohgjjedbdd99894343000000000000000000000000000000000000000000iuvvvrttknwvtsrtrhiitvuuusuvtsrsljljigegd988cc8883410000000000004llg8nnoonnoonropofglmkkqpnmijimopoqrrqprrqrrqrqqqppnqqpnoonooommnnnomkkjiiwxsmtyxpjuwyyvsvvvuwwswwuuvuuuuutpmlmililjkb9caaff88acd8967743610000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
  const VOICE_LV = Array.from(VOICE, ch => parseInt(ch, 36) / 35);

  function voiceAt(t) {
    const f = t * 20;
    const i = Math.floor(f);
    if (i < 0 || i >= VOICE_LV.length) return 0;
    const a = VOICE_LV[i], b = VOICE_LV[i + 1] || 0;
    return a + (b - a) * (f - i);
  }

  function mouthFor(role, t) {
    if (role !== 'trio') return 0;
    return shotAt(t).cam === 'walk' ? voiceAt(t) : 0;
  }

  const CHARACTERS = {
    amanda: { name: 'Аманда Миллер' },
    makoto: { name: 'Макото Майн' },
    talleah: { name: 'Таллея из Авии' },
    gynoid: { name: 'Гиноиды' },
    jacob: { name: 'Джейкоб Кирби' }
  };

  const SOLVERS = {};
  Object.keys(Cast.FORMS).concat(['gynoid']).forEach(k => { SOLVERS[k] = Cast.solver(k); });
  const DEFAULT_FACE = { amanda: 'scowl', makoto: 'smug', talleah: 'happy' };

  function pose(x, z, ry) {
    const p = restPose();
    p.x = x;
    p.z = z;
    p.ry = ry || 0;
    return p;
  }

  function walking(p, t, k) {
    const w = S(t * 7.5);
    p.hipL = [0.45 * w * k, 0, 0];
    p.hipR = [-0.45 * w * k, 0, 0];
    p.knL = [Math.max(0, -w) * 0.7 * k, 0, 0];
    p.knR = [Math.max(0, w) * 0.7 * k, 0, 0];
    p.shL = [-0.4 * w * k, 0, 0.1];
    p.shR = [0.4 * w * k, 0, 0.1];
    return p;
  }

  function seated(p) {
    p.hipL = [1.45, 0, 0.06];
    p.hipR = [1.45, 0, 0.06];
    p.knL = [1.45, 0, 0];
    p.knR = [1.45, 0, 0];
    p.elL = [0.6, 0, 0];
    p.elR = [0.6, 0, 0];
    return p;
  }

  function aiming(p, side) {
    p['sh' + side] = [1.5, 0, 0.05];
    p['el' + side] = [0.05, 0, 0];
    return p;
  }

  function actor(id, form, p) {
    const spec = Cast.FORMS[form];
    if (spec && !p.face) p.face = DEFAULT_FACE[spec.person];
    return { id, form, look: form, pose: p, hidden: false };
  }

  const who = (id, form, x, z, ry) => actor(id, form, pose(x, z, ry));
  const CASUAL = ['amandaCasual', 'makotoSchool', 'talleahSuit'];
  const gyn = (i, x, z, ry) => who('g' + i, 'gynoid', x, z, ry);
  const view = (eye, at, fov, extra) => Object.assign({ eye, at, fov: fov || 45 }, extra || {});

  const ARM = {
    crossR: [0.183, -1.332, 0.475, 1.605],
    crossL: [0.117, -1.468, 0.467, 1.548],
    hipR: [-0.686, -1.327, 0.038, 1.594],
    glassesR: [1.151, -0.535, 0.139, 2.127],
    saluteR: [2.184, 1.151, 0.452, 1.885],
    cheekR: [1.173, -0.411, 0.211, 2.381],
    fingerCheekR: [1.028, -0.613, 0.164, 2.289],
    chestR: [3.106, 2.128, 2.779, 2.27],
    phoneR: [1.294, -0.548, 0.24, 2.457],
    reachR: [1.452, -0.291, 1.389, 0],
    wandUpR: [2.945, 0.202, 0.136, 0],
    beckonR: [0.609, -0.14, 0.271, 1.665],
    mouthR: [1.045, -0.566, 0.374, 2.166],
    thumbR: [0.511, -0.24, 0.319, 1.673],
    cameraR: [-1.877, 2.992, 2.778, 1.921],
    cameraL: [-1.877, 2.992, 2.778, 1.921],
    clapR: [0.505, -0.552, 0.501, 1.645],
    clapL: [0.505, -0.552, 0.501, 1.645],
    snapR: [1.62, 0.801, 0.316, 1.929],
    saluteG: [2.258, 1.188, 0.423, 1.786],
    deviceR: [0.326, -0.495, 0.238, 1.497],
    deviceL: [0.326, -0.495, 0.238, 1.497]
  };

  function arm(p, side, key, k) {
    const v = ARM[key];
    const w = k === undefined ? 1 : clamp(k, 0, 1);
    const sh = p['sh' + side], el = p['el' + side];
    p['sh' + side] = [lerp(sh[0], v[0], w), lerp(sh[1], v[1], w), lerp(sh[2], v[2], w)];
    p['el' + side] = [lerp(el[0], v[3], w), 0, 0];
    return p;
  }

  const crossArms = (p, k) => arm(arm(p, 'R', 'crossR', k), 'L', 'crossL', k);
  const smooth = (x) => { const k = clamp(x, 0, 1); return k * k * (3 - 2 * k); };
  const frac = (x) => x - Math.floor(x);
  const pulseAt = (t, a, b) => S(PI * span(t, a, b));
  const breathe = (p, t, seed) => {
    p.spine = [0.02 * S(t * 1.7 + seed), 0.03 * S(t * 0.6 + seed), 0];
    p.neck = [0.03 * S(t * 1.1 + seed * 2), 0.06 * S(t * 0.5 + seed), 0];
    p.hair = 0.04 * S(t * 1.3 + seed);
    return p;
  };

  const SPOT_COL = { amanda: [0.35, 1.0, 0.45], makoto: [1.0, 0.25, 0.3], talleah: [0.35, 0.55, 1.0], white: [1.0, 0.97, 0.9] };
  const EYE_COL = { amanda: [0.3, 1.0, 0.45], makoto: [0.6, 0.5, 1.0], talleah: [0.35, 0.6, 1.0] };
  const ROW = { amanda: -1.2, makoto: 0, talleah: 1.2 };
  const NAMES = ['amanda', 'makoto', 'talleah'];

  function lineGirl(id, form, x, t, seed) {
    const a = actor(id, form, breathe(pose(x, 0, 0), t, seed));
    return a;
  }

  function sil(a, rim, eyes) {
    a.sil = rim || [0.5, 0.5, 0.6];
    if (eyes) a.glow = eyes;
    return a;
  }

  const VOID_EYE = [0, 1.45, 4.8];
  const VOID_AT = [0, 1.0, 0];

  const WORLDS = {
    click(t) {
      const on = t > 0.85 ? (t < 1.05 ? (S(t * 90) > 0 ? 1 : 0.2) : 1) : 0;
      return view([0, 3.4, 5.5], [0, 0, 0.3], 40, { cast: [], light: { spots: [{ x: 0, z: 0, col: SPOT_COL.white, k: on, r: 1.2 }], dust: on } });
    },
    shadows(t, u) {
      const sx = lerp(-1.2, 1.2, u);
      const cast = NAMES.map((id, i) => {
        const x = lerp(-4.5, 4.5, clamp(u * 1.7 - i * 0.32, 0, 1));
        const p = walking(pose(x, 0.15 * i - 0.15, PI / 2), t * 1.8, 1.6);
        p.spine = [0.25, 0, 0];
        return sil(actor(id, CASUAL[i], p), [0.2, 0.2, 0.25]);
      });
      return view([0, 3.0, 5.2], [sx * 0.4, 0.3, 0], 42, { cast, light: { spots: [{ x: sx, z: 0, col: SPOT_COL.white, k: 1, r: 1.3 }] } });
    },
    turn(t, u) {
      const cast = NAMES.map((id, i) => sil(lineGirl(id, CASUAL[i], ROW[id], t, i), [0.9, 0.9, 0.95]));
      const glare = smooth(span(t, 3.9, 4.5));
      const reveal = smooth(span(t, 4.55, 5.1));
      return view(VOID_EYE, VOID_AT, 42, {
        cast,
        light: { spots: [{ x: 0, z: lerp(0, 3.5, glare), col: SPOT_COL.white, k: 1, r: 1.2, tilt: glare }], backdrop: reveal > 0 ? 1 : 0 },
        fx: { white: reveal > 0 ? 1 - 0.75 * reveal : glare }
      });
    },
    spots(t) {
      const b = beatAt(t);
      const idx = (Math.floor(b) - 11 + 300) % 3;
      const pulse = 1 - 0.35 * frac(b);
      const cast = NAMES.map((id, i) => {
        const a = lineGirl(id, CASUAL[i], ROW[id], t, i);
        if (i !== idx) sil(a, [0.25, 0.25, 0.3]);
        else a.pose.neck = [0, 0.15 * S(t * 2), 0];
        return a;
      });
      const id = NAMES[idx];
      return view(VOID_EYE, VOID_AT, 42, { cast, light: { spots: [{ x: ROW[id], z: 0, col: SPOT_COL[id], k: pulse, r: 0.85, lit: true }] } });
    },
    eyes(t) {
      const b = beatAt(t);
      const cast = NAMES.map((id, i) => {
        const a = lineGirl(id, CASUAL[i], ROW[id], t, i);
        a.pose.neck = [0, 0, 0];
        a.pose.spine = [0, 0, 0];
        a.pose.blink = Math.floor(b) % 3 === i && frac(b) < 0.3 ? 1 : 0;
        a.pose.face = 'calm';
        return a;
      });
      return view(VOID_EYE, VOID_AT, 42, { cast, panels: NAMES.map((id, i) => ({ id, rect: { x: 0, y: (2 - i) * 128 + 1, w: 512, h: 126 } })), light: { flatLit: true } });
    },
    lineup(t) {
      const b = beatAt(t);
      const cast = NAMES.map((id, i) => lineGirl(id, CASUAL[i], ROW[id], t, i));
      const [am, mk, tl] = cast;
      crossArms(am.pose, span(b, 25, 25.5));
      am.pose.face = 'scowl';
      const g = span(b, 26, 26.4) - span(b, 27.2, 27.6);
      arm(mk.pose, 'R', 'glassesR', g);
      mk.pose.face = b > 26.8 ? 'wink' : 'smug';
      arm(tl.pose, 'R', 'hipR', span(b, 27, 27.4));
      tl.pose.face = 'happy';
      const swing = smooth(span(t, 12.95, 14.6));
      return view(VOID_EYE, VOID_AT, 42, {
        cast,
        light: { spots: NAMES.map(id => ({ x: ROW[id], z: lerp(0, 3.5, swing), col: SPOT_COL[id], k: 1, r: 0.85, lit: true, tilt: swing })) },
        fx: { white: smooth(span(t, 13.6, 14.75)) }
      });
    },
    three(t) {
      const cast = NAMES.map((id, i) => sil(lineGirl(id, CASUAL[i], ROW[id], t, i), [0.22, 0.2, 0.3], EYE_COL[id]));
      return view([0, 1.45, 4.4], VOID_AT, 42, { cast, light: { spots: [{ x: 0, z: -1.2, col: [0.4, 0.38, 0.5], k: 0.6, r: 2.4 }] } });
    },
    one(t) {
      const b = beatAt(t);
      const local = b - 365;
      const hop = local < 4 ? Math.floor(local) : 4 + Math.floor((local - 4) * 2);
      const merge = smooth(span(b, 371.5, 372.6));
      const xs = { amanda: lerp(-1.2, -0.42, merge), makoto: 0, talleah: lerp(1.2, 0.42, merge) };
      const lit = NAMES[hop % 3];
      const cast = NAMES.map((id, i) => {
        const a = lineGirl(id, CASUAL[i], xs[id], t, i);
        if (merge > 0.5) {
          a.pose.ry = id === 'amanda' ? 0.25 : id === 'talleah' ? -0.25 : 0;
          a.pose.x += (id === 'makoto' ? 0 : 0.03 * S(t * 23 + i));
        } else if (id !== lit) sil(a, [0.25, 0.22, 0.3], EYE_COL[id]);
        return a;
      });
      crossArms(cast[0].pose, merge);
      const spots = merge > 0.02
        ? [{ x: 0, z: 0, col: SPOT_COL.white, k: merge, r: lerp(0.85, 1.1, merge), lit: true }].concat(merge < 1 ? [{ x: xs[lit] * (1 - merge), z: 0, col: SPOT_COL[lit], k: 1 - merge, r: 0.85, lit: true }] : [])
        : [{ x: xs[lit], z: 0, col: SPOT_COL[lit], k: 1 - 0.3 * frac(local * (local < 4 ? 1 : 2)), r: 0.85, lit: true }];
      return view([0, 1.45, 4.4], VOID_AT, 42, { cast, light: { spots } });
    },
    photo(t) {
      const ft = Math.min(t, 172.35);
      const cast = [lineGirl('amanda', 'amandaCasual', -0.42, ft, 0), lineGirl('makoto', 'makotoSchool', 0, ft, 1), lineGirl('talleah', 'talleahSuit', 0.42, ft, 2)];
      cast[0].pose.ry = 0.25;
      cast[2].pose.ry = -0.25;
      crossArms(cast[0].pose, 1);
      cast[0].pose.face = 'scowl';
      arm(cast[1].pose, 'R', 'fingerCheekR', 1);
      cast[1].pose.face = 'wink';
      arm(cast[2].pose, 'R', 'saluteR', 1);
      cast[2].pose.face = 'grin';
      return view([0, 1.42, 3.0], [0, 1.22, 0], 40, { cast, light: { spots: [{ x: 0, z: 0, col: SPOT_COL.white, k: 1, r: 1.1, lit: true }] }, fx: { flash: 1 - smooth(span(t, 172.2, 172.5)), polaroid: smooth(span(t, 172.3, 172.6)) } });
    }
  };

  const BUS_EYE = [0, 1.22, -5.42];
  const BACK_Z = -5.52;
  const STUDENTS = [
    ['s0', 'crowd2', -0.85, -4.3, 1], ['s1', 'crowd11', -0.55, -3.25, 1], ['s2', 'crowd7', -0.85, -2.2, 1], ['s3', 'crowd9', -0.55, -1.15, 1],
    ['s4', 'crowd3', 0.85, -4.3, -1], ['s5', 'crowd8', 0.55, -3.25, -1], ['s6', 'crowd6', 0.85, -2.2, -1], ['s7', 'crowd0', 0.55, -1.15, -1],
    ['s8', 'crowd12', 0.85, 0.95, -1], ['s9', 'crowd1', -0.85, 0.95, 1]
  ];

  function sitBlend(p, k) {
    const q = seated(pose(0, 0, 0));
    ['hipL', 'hipR', 'knL', 'knR', 'elL', 'elR'].forEach(j => { p[j] = p[j].map((v, i) => lerp(v, q[j][i], k)); });
    return p;
  }

  function students(t, glance) {
    const b = beatAt(t);
    return STUDENTS.map(([id, form, x, z, side], i) => {
      const p = seated(pose(x, z, 0));
      const g = glance ? Math.pow(Math.max(0, C(PI * (b % 2))), 6) : 0;
      p.neck = [0.05, side * (0.15 + 0.9 * g), 0];
      p.spine = [0.03 * S(t * 3 + i), 0, 0.02 * S(t * 2.3)];
      return actor(id, form, p);
    });
  }

  const sway = (t) => [0.015 * S(t * 2.7), 0.01 * S(t * 4.1), 0];
  const busEye = (t, dx, dy) => { const s = sway(t); return [BUS_EYE[0] + s[0] + (dx || 0), BUS_EYE[1] + s[1] + (dy || 0), BUS_EYE[2]]; };
  const look = (eye, yaw, pitch, dist) => [eye[0] + S(yaw) * C(pitch) * dist, eye[1] + S(pitch) * dist, eye[2] + C(yaw) * C(pitch) * dist];

  function amandaSeat(t, k, face) {
    const p = sitBlend(pose(-0.56, BACK_Z, 0), k);
    p.face = face || 'scowl';
    breathe(p, t, 0);
    return actor('amanda', 'amandaCasual', p);
  }

  function makotoSeat(t, lean, face) {
    const p = seated(pose(0.5, BACK_Z, -0.55 * lean));
    p.spine = [0.05, -0.25 * lean, 0.3 * lean];
    p.neck = [0.12, -0.75 * lean, 0.2 * lean];
    p.face = face || 'happy';
    arm(p, 'L', 'crossL', 0.5 * lean);
    return actor('makoto', 'makotoSchool', p);
  }

  const LAWN = [12, -6];
  const lawnPos = (dx, dz) => [LAWN[0] + dx, LAWN[1] + dz];

  Object.assign(WORLDS, {
    aisle(t) {
      const eye = busEye(t);
      return view(eye, look(eye, 0, -0.06, 6), 62, { cast: students(t, true), light: { bus: 1 } });
    },
    amanda(t) {
      const walk = smooth(span(t, 18.49, 19.25));
      const sit = smooth(span(t, 19.3, 19.7));
      const side = smooth(span(t, 19.2, 19.45));
      const p = sitBlend(walking(pose(lerp(0, -0.56, side), lerp(-2.4, BACK_Z, walk * 0.85 + side * 0.15), lerp(PI, 0, side)), t, (1 - side) * 0.9), sit);
      p.face = 'scowl';
      if (t > 19.75) {
        arm(p, 'L', 'reachR', smooth(span(t, 19.75, 20.0)));
        p.neck = [0, 0.55, 0];
        p.face = 'smug';
      }
      const eye = busEye(t);
      const yaw = lerp(-0.05, -1.3, smooth(span(t, 19.05, 19.6)));
      return view(eye, look(eye, yaw, -0.08, 3), 64, { cast: [actor('amanda', 'amandaCasual', p)].concat(students(t, false).slice(0, 4)), props: { backpack: [-0.68, 0.55, -4.35, t > 18.85 ? 0 : 1 - span(t, 18.49, 18.85)] }, light: { bus: 1 } });
    },
    badge(t) {
      const eye = busEye(t);
      const lift = smooth(span(t, 20.33, 20.9));
      const am = amandaSeat(t, 1, t > 21.1 ? 'smug' : 'scowl');
      am.pose.neck = [0.05, 0.55, 0];
      return view(eye, look(eye, -0.95, -0.18, 3), 64, {
        cast: [am],
        pov: [{ side: 'R', sleeve: 0x8a8e96, hand: 0xf2d2b6, prop: 'badge', at: [0.08, lerp(-0.5, -0.26, lift), -0.16], rot: [lerp(0.2, 0.55, lift), 0.35, 0], propTilt: -0.6 }],
        sparkle: { pos: [-0.66, 0.6, -4.32], k: pulseAt(t, 20.4, 21.4), col: [1, 0.45, 0.75] },
        props: { backpack: [-0.68, 0.55, -4.35, 0] },
        light: { bus: 1 }
      });
    },
    makoto(t) {
      const eye = busEye(t);
      const slide = smooth(span(t, 22.18, 22.9));
      const lean = smooth(span(t, 23.0, 23.5));
      const mk = makotoSeat(t, 0.25 + lean * 0.6, lean > 0.5 ? 'happy' : 'smug');
      mk.pose.x = lerp(1.15, 0.55, slide);
      const e2 = [eye[0] - 0.22, eye[1], eye[2] - 0.05];
      return view(e2, look(e2, lerp(1.0, 1.4, slide), -0.28, 3), 58, {
        cast: [mk],
        led: { id: 'makoto', on: frac(t * 2.2) < 0.5 },
        light: { bus: 1 }
      });
    },
    glare(t) {
      const eye = busEye(t, 0.08);
      const am = amandaSeat(t, 1, 'angry');
      am.pose.neck = [0.08, 0.35, 0];
      crossArms(am.pose, smooth(span(t, 24.1, 24.5)));
      const mk = makotoSeat(t, 1, 'happy');
      return view(eye, look(eye, -1.3, -0.1, 3), 64, { cast: [am, mk], led: { id: 'makoto', on: frac(t * 2.2) < 0.5 }, light: { bus: 1 } });
    },
    road(t, u) {
      const bx = lerp(30, 9, u);
      return view([bx - 9, 2.6, 19], [bx - 2, 1.8, 6], 46, {
        cast: [], bus: { x: bx, door: 0 },
        scanner: { x: bx + lerp(4, -5, u), z: 8, k: smooth(span(u, 0.1, 0.3)) * (1 - smooth(span(u, 0.8, 1))) },
        light: { expo: 1 }
      });
    },
    arrive(t, u) {
      const stop = smooth(span(t, 27.72, 28.55));
      const bx = lerp(7, 0.6, stop);
      const door = smooth(span(t, 28.6, 28.95));
      const cast = ['s0', 's1', 's2', 's3'].map((id, i) => {
        const k = span(t, 28.85 + i * 0.16, 29.6 + i * 0.16);
        const p = walking(pose(-3.7 + i * 0.25, lerp(6.4, 3.4, k), PI), t + i, k > 0 && k < 1 ? 1 : 0);
        const a = actor(id, ['crowd2', 'crowd3', 'crowd9', 'crowd6'][i], p);
        a.hidden = k <= 0;
        return a;
      }).concat([actor('amanda', 'amandaCasual', walking(pose(-4.4, lerp(6.6, 4.0, span(t, 29.05, 29.56)), PI), t, t > 29.05 ? 1 : 0))].map(a => { a.hidden = t < 29.05; return a; }));
      return view([-10.5, 2.5, -2.4], [-2.6, 2.1, 5.6], 52, { cast, bus: { x: bx, door }, light: { expo: 1 } });
    },
    sky(t) {
      const eye = [LAWN[0], 0.24, LAWN[1]];
      return view(eye, [LAWN[0] + 0.3, 10, LAWN[1] - 1.2], 62, { up: [0, 0, -1], cast: [], light: { expo: 1, clouds: 1 }, fx: { lids: smooth(span(t, 41.6, 42.45)) } });
    },
    lean(t) {
      const eye = [LAWN[0], 0.24, LAWN[1]];
      const [x, z] = lawnPos(0, -0.62);
      const p = pose(x, z, 0);
      const bend = smooth(span(t, 42.49, 42.9));
      p.hipL = [-0.25 * bend, 0, 0.08];
      p.hipR = [-0.25 * bend, 0, 0.08];
      p.spine = [1.15 * bend, 0, 0];
      p.neck = [0.55 * bend, 0, 0];
      p.face = t > 43.2 ? 'pathos' : 'awe';
      p.hair = 0.6 * bend;
      const g1 = who('g1', 'gynoid', x - 0.75, z + 0.3, 0.3);
      const g2 = who('g2', 'gynoid', x + 0.75, z + 0.3, -0.3);
      g1.pose.neck = [0.6, 0, 0];
      g2.pose.neck = [0.6, 0, 0];
      return view(eye, [LAWN[0], 2.4, LAWN[1] - 0.45], 66, { up: [0, 0, -1], cast: [actor('talleah', 'talleahSuit', p), g1, g2], light: { expo: 1, clouds: 1 }, fx: { lids: 1 - smooth(span(t, 42.49, 42.8)) } });
    },
    bow(t) {
      const [tx, tz] = lawnPos(0, -3);
      const tl = pose(tx, tz, 0);
      arm(tl, 'R', 'chestR', smooth(span(t, 59.1, 59.5)));
      const bowK = Math.sin(PI * span(t, 59.6, 60.4));
      tl.spine = [0.35 * bowK, 0, 0];
      tl.neck = [0.2 * bowK, 0, 0];
      tl.face = 'happy';
      const jb = pose(tx, tz + 1.8, PI);
      jb.neck = [0, 0.1, 0];
      return view([tx - 0.8, 1.75, tz + 3.4], [tx, 1.2, tz], 44, {
        cast: [actor('talleah', 'talleahSuit', tl), who('g1', 'gynoid', tx - 0.9, tz - 0.7, 0), who('g2', 'gynoid', tx + 0.9, tz - 0.7, 0), actor('jacob', 'jacobHelmet', jb)],
        light: { expo: 1 }
      });
    },
    cuffs(t) {
      const [tx, tz] = lawnPos(0, -3);
      const jb = pose(tx, tz + 1.8, PI);
      const back = smooth(span(t, 60.95, 61.4));
      jb.shL = [-0.45 * back, 0.35 * back, 0.12];
      jb.shR = [-0.45 * back, 0.35 * back, 0.12];
      jb.elL = [1.35 * back, 0, 0];
      jb.elR = [1.35 * back, 0, 0];
      jb.cape = 0.55 * back + 0.08 * S(t * 3);
      const j = actor('jacob', 'jacobHelmet', jb);
      if (t > 61.5) j.props = [{ id: 'cuffs', part: 'foreR', at: [0, -0.2, 0], rot: [0, 0, 0] }, { id: 'cuffs', part: 'foreL', at: [0, -0.2, 0], rot: [0, 0, 0] }];
      const gp = pose(tx + 0.55, tz + 2.1, -PI / 2);
      arm(gp, 'R', 'reachR', 1);
      gp.hatch = smooth(span(t, 61.7, 62.2));
      return view([tx + 0.7, 1.0, tz + 3.0], [tx, 0.95, tz + 1.85], 46, {
        cast: [j, actor('g1', 'gynoid', gp), who('talleah', 'talleahSuit', tx - 0.5, tz + 0.1, 0.4)],
        light: { expo: 1 }
      });
    },
    bench(t) {
      const am = seated(pose(13.72, -7.95, 0));
      am.spine = [0.1, 0.1, -0.3];
      am.neck = [0.25, 0.2, -0.35];
      am.face = 'sleep';
      am.noMask = true;
      const slip = smooth(span(t, 86.2, 86.9));
      am.shL = [lerp(0.4, 0.05, slip), 0, lerp(0.1, 0.3, slip)];
      am.elL = [lerp(1.2, 0.2, slip), 0, 0];
      const jb = seated(pose(14.32, -7.95, 0));
      jb.spine = [0.08, 0, 0.05];
      jb.neck = [0.1, -0.45, 0];
      const grab = smooth(span(t, 86.7, 87.2));
      jb.shR = [lerp(0.2, 0.4, grab), 0, lerp(0.1, 0.45, grab)];
      jb.elR = [lerp(0.8, 0.6, grab), 0, 0];
      const tilt = smooth(span(t, 86.1, 86.9));
      return view([13.3, lerp(1.02, 0.85, tilt), -6.95], [13.85, lerp(1.0, 0.62, tilt), -7.95], 26, { cast: [actor('amanda', 'amandaLantern', am), actor('jacob', 'jacobHoodie', jb)], light: { expo: 1 } });
    }
  });

  const DOOR_HINGE = [2.47, 2.5];
  const GORILLA = [0, 1.75, -2.44];
  const HELMET_BED = [0.95, 0.7, -1.25];
  const SHIELD_BED = [1.55, 0.63, -1.05];
  const STAND = 1.62;
  const sleeveHoodie = { sleeve: 0x8a8e96, hand: 0xf2d2b6 };
  const sleeveRed = { sleeve: 0xb02028, hand: 0xd02838 };
  const roomCam = (eye, at, fov, extra) => view(eye, at, fov, Object.assign({ light: { room: 1 } }, extra));

  function amandaCorner(t, form, near) {
    const k = near || 0;
    const p = pose(lerp(-2.15, -1.4, k), lerp(-0.35, 0.4, k), lerp(0.95, 0.7, k));
    breathe(p, t, 0);
    arm(p, 'R', 'reachR', 1);
    p.face = 'angry';
    const a = actor('amanda', form || 'amandaPink', p);
    if (a.form === 'amandaPink') a.props = [{ id: 'scepter', part: 'foreR', at: [0, -0.22, 0.02], rot: [0, 0, 0] }];
    return a;
  }

  function talleahCorner(t, armed, near) {
    const k = near || 0;
    const p = pose(lerp(2.05, 1.35, k), lerp(-0.9, 0.1, k), lerp(-1.05, -0.75, k));
    breathe(p, t, 2);
    aiming(p, 'R');
    p.face = 'angry';
    const a = actor('talleah', 'talleahRanger', p);
    if (armed !== false) a.props = [{ id: 'blaster', part: 'foreR', at: [0, -0.22, 0.02], rot: [0, 0, 0] }];
    return a;
  }

  function gynoidCorner(i, t, near) {
    const k = near || 0;
    const p = pose(lerp(2.45, 1.95, k) - i * 0.45, lerp(-1.7, -0.5, k) + i * 0.25, -0.75);
    aiming(p, 'R');
    return actor('g' + (i + 1), 'gynoid', p);
  }

  Object.assign(WORLDS, {
    costumes(t) {
      const b = beatAt(t);
      const side = Math.floor(b) % 2;
      const yaw = lerp(2.75, 2.45, smooth(side ? frac(b) * 3 : 1 - Math.min(1, frac(b) * 3)));
      const eye = [0.45, STAND, 0.25];
      return roomCam(eye, look(eye, yaw, -0.62, 2), 56, { cast: [], room: { mood: 'morning', costumes: true, door: 0 } });
    },
    gorilla(t) {
      const grab = smooth(span(t, 31.41, 31.95));
      const whip = smooth(span(t, 32.0, 32.45));
      const eye = [0.45, STAND, 0.25];
      const yawBed = 2.6;
      const yawWall = PI;
      const at = whip > 0 ? look(eye, lerp(yawBed, yawWall, whip), lerp(-0.62, 0.05, whip), 2) : look(eye, yawBed, -0.62, 2);
      return roomCam(eye, at, 56, {
        cast: [],
        room: { mood: 'morning', costumes: grab < 0.99, helmetTaken: grab > 0.99, door: 0 },
        pov: whip < 0.6 ? [Object.assign({ side: 'R', at: [lerp(0.2, 0.12, grab), lerp(-0.3, -0.36, grab), -0.12], rot: [lerp(0.3, -0.35, grab), 0.15, 0], prop: grab > 0.99 ? 'helmetProp' : null }, sleeveHoodie)] : null
      });
    },
    knock(t) {
      const open = 1.55 * smooth(span(t, 33.3, 33.75));
      const p = pose(2.0, 3.05, PI);
      crossArms(p, 1);
      p.knR = [0.25 + 0.25 * Math.max(0, S(t * 12)), 0, 0];
      p.hipR = [0.12 + 0.12 * Math.max(0, S(t * 12)), 0, 0];
      p.face = 'scowl';
      breathe(p, t, 0);
      const eye = [1.1, STAND, 0.6];
      return roomCam(eye, [2.0, 1.4, 2.6], 52, { cast: [actor('amanda', 'amandaLantern', p)], room: { mood: 'morning', door: open, helmetTaken: true } });
    },
    elevator(t, u) {
      const p = walking(pose(lerp(2.6, 6.2, u), 3.6, PI / 2), t, 1);
      p.face = 'scowl';
      const run = smooth(u);
      const eye = [2.0, STAND + 0.03 * S(t * 15), lerp(1.7, 2.9, run)];
      const grab = smooth(span(t, 35.3, 35.8));
      return roomCam(eye, [6.5, 1.35, 3.6], 58, {
        cast: [actor('amanda', 'amandaLantern', p)],
        room: { mood: 'morning', door: 1.55, helmetTaken: true },
        pov: [Object.assign({ side: 'R', at: [0.18, lerp(-0.45, -0.3, grab), -0.12], rot: [0.25, 0.25, 0], prop: 'keycard', propTilt: -0.4 }, sleeveRed)]
      });
    },

    hands(t) {
      const b = beatAt(t);
      const which = Math.floor(b) % 2;
      const k = 1 - 0.6 * frac(b);
      const eye = [0.2, 1.45, 0.65];
      return roomCam(eye, look(eye, PI + 0.1, -0.5, 2), 56, {
        cast: [],
        room: { mood: 'day', door: 0, helmetTaken: true },
        pov: [
          Object.assign({ side: 'L', at: [-0.13, -0.27, -0.14], rot: [0.45, -0.15, 0], prop: 'letter', propTilt: -0.9, bright: which === 0 ? 1 + 0.8 * k : 0.6 }, sleeveHoodie),
          Object.assign({ side: 'R', at: [0.13, -0.27, -0.14], rot: [0.45, 0.15, 0], prop: 'phone', propTilt: -0.9, bright: which === 1 ? 1 + 0.8 * k : 0.6 }, sleeveHoodie)
        ]
      });
    },
    stare(t) {
      const drop = smooth(span(t, 105.26, 105.8));
      const eye = [0.2, 1.5, 0.65];
      return roomCam(eye, look(eye, PI, lerp(-0.5, 0.1, smooth(span(t, 105.4, 106.0))), 2), 50, {
        cast: [],
        room: { mood: 'day', door: 0, helmetTaken: true },
        pov: drop < 0.95 ? [
          Object.assign({ side: 'L', at: [-0.13, lerp(-0.27, -0.6, drop), -0.14], rot: [0.45, -0.15, 0], prop: 'letter', propTilt: -0.9 }, sleeveHoodie),
          Object.assign({ side: 'R', at: [0.13, lerp(-0.27, -0.6, drop), -0.14], rot: [0.45, 0.15, 0], prop: 'phone', propTilt: -0.9 }, sleeveHoodie)
        ] : null
      });
    },
    gynoid(t) {
      const appear = smooth(span(t, 107.3, 107.75));
      const turn = smooth(span(t, 108.25, 108.55));
      const g = pose(0.95, 1.55, PI * 0.8);
      g.neck = [0.1, 0, 0];
      const a = actor('g1', 'gynoid', g);
      a.hidden = appear < 0.05;
      const eye = [1.15, 1.5, 0.25];
      const at = turn > 0 ? look(eye, lerp(PI / 2 + 0.05, -0.2, turn), lerp(-0.05, 0.05, turn), 2) : look(eye, PI / 2 + 0.05, -0.05, 2);
      return roomCam(eye, at, 54, { cast: [a], mirror: turn < 0.3, room: { mood: 'day', door: 0, helmetTaken: true }, sparkle: { pos: [0.95, 1.2, 1.55], k: pulseAt(t, 107.2, 107.9), col: [0.4, 0.7, 1] } });
    },
    holo(t) {
      const g = pose(0.95, 1.55, PI * 0.8);
      g.hatch = smooth(span(t, 109.0, 109.4));
      const a = actor('g1', 'gynoid', g);
      const hp = pose(0, 0, 0);
      arm(hp, 'R', 'wandUpR', 1);
      hp.shR = [hp.shR[0] + 0.25 * S(t * 18), hp.shR[1], hp.shR[2]];
      hp.face = 'angry';
      const holo = actor('holo', 'amandaPink', hp);
      holo.props = [{ id: 'scepter', part: 'foreR', at: [0, -0.22, 0.02], rot: [0, 0, 0] }];
      holo.holo = g.hatch;
      const eye = [1.0, 1.42, 0.55];
      return roomCam(eye, [0.92, 1.45, 1.45], 46, { cast: [a, holo], room: { mood: 'day', door: 0, helmetTaken: true } });
    },
    phase(t) {
      const g = pose(0.95, 1.2, PI * 0.85);
      arm(g, 'R', 'reachR', smooth(span(t, 110.8, 111.3)));
      const eye = [1.05, 1.5, 0.3];
      const k = smooth(span(t, 111.6, 113.8));
      return roomCam(eye, [0.95, 1.2, 1.2], 56, {
        cast: [actor('g1', 'gynoid', g)],
        room: { mood: 'day', door: 0, helmetTaken: true },
        pov: [Object.assign({ side: 'R', at: [0.16, -0.3, -0.16], rot: [0.3, 0.2, 0] }, sleeveHoodie)],
        fx: { phase: k }
      });
    },
    corners(t) {
      const open = smooth(span(t, 132.95, 133.4));
      const eye = [2.0, STAND, lerp(2.9, 2.2, smooth(span(t, 133.0, 134.0)))];
      return roomCam(eye, [0, 1.35, -1.2], 58, { cast: [amandaCorner(t), talleahCorner(t), gynoidCorner(0, t), gynoidCorner(1, t)], room: { mood: 'evening', door: lerp(0, 1.55, open), helmetTaken: true } });
    },

    started(t) {
      const n = smooth(span(t, 136.64, 137.6));
      const am = amandaCorner(t, 'amandaPink', n);
      const tl = talleahCorner(t, true, n);
      const k = smooth(span(t, 136.64, 137.0));
      const eye = [0.1, STAND, 2.3];
      am.pose.ry = lerp(am.pose.ry, Math.atan2(eye[0] - am.pose.x, eye[2] - am.pose.z), k);
      tl.pose.ry = lerp(tl.pose.ry, Math.atan2(eye[0] - tl.pose.x, eye[2] - tl.pose.z), k);
      am.pose.face = tl.pose.face = 'angry';
      return roomCam(eye, [0, 1.25, -0.6], 68, { cast: [am, tl, gynoidCorner(0, t, n), gynoidCorner(1, t, n)], room: { mood: 'evening', door: 1.55, helmetTaken: true } });
    },


    bed(t) {
      const k = smooth(span(t, 138.49, 139.3));
      const eye = [lerp(-0.6, -0.95, k), lerp(STAND, 0.82, k), lerp(-0.1, -1.45, k)];
      const at = [lerp(-0.4, -0.95, k), lerp(1.4, 2.6, k), lerp(1.8, -1.55, k)];
      return roomCam(eye, at, 60, { cast: [amandaCorner(t, 'amandaPink', 1), talleahCorner(t, true, 1)], up: k > 0.5 ? [0, 0, -1] : [0, 1, 0], room: { mood: 'evening', door: 1.55, helmetTaken: true } });
    },

    lower(t) {
      const flip = t > 141.3;
      const am = amandaCorner(t, flip ? 'amandaCasual' : 'amandaPink', 1);
      const tl = talleahCorner(t, t < 141.9, 1);
      const k = smooth(span(t, 140.5, 141.1));
      am.pose.ry = PI - 0.45;
      tl.pose.ry = PI + 0.45;
      arm(am.pose, 'R', 'reachR', 1 - k);
      tl.pose.shR = [lerp(1.5, 0.1, k), 0, 0.08];
      tl.pose.elR = [lerp(0.05, 0.2, k), 0, 0];
      am.pose.face = flip ? 'shy' : 'angry';
      tl.pose.face = t > 142.2 ? 'shy' : 'angry';
      const eye = [0, lerp(0.95, 1.18, smooth(span(t, 140.33, 140.9))), -1.75];
      return roomCam(eye, [0, 1.25, 1.2], 74, {
        cast: [am, tl, gynoidCorner(0, t, 1), gynoidCorner(1, t, 1)],
        room: { mood: 'evening', door: 1.55, helmetTaken: true },
        fx: { flashPink: Math.max(pulseAt(t, 141.0, 141.25), pulseAt(t, 141.25, 141.5)) },
        sparkle: { pos: [tl.pose.x - 0.3, 1.2, tl.pose.z + 0.25], k: pulseAt(t, 141.7, 142.1), col: [0.3, 0.6, 1] }
      });
    },
    night(t) {
      const k = smooth(span(t, 162.49, 163.3));
      const eye = [lerp(1.0, 1.2, k), lerp(STAND, 0.8, k), lerp(0.8, -0.95, k)];
      return roomCam(eye, [lerp(0.4, 0.55, k), lerp(1.4, 2.6, k), lerp(-1.0, -1.7, k)], 62, { cast: [], up: k > 0.5 ? [0, 0, -1] : [0, 1, 0], room: { mood: 'night', door: 0, helmetTaken: true } });
    },
    coda(t) {
      const eye = [0.9, 1.45, 0.75];
      const look2 = smooth(span(t, 175.0, 175.6));
      return roomCam(eye, [0.6, lerp(0.95, 1.3, smooth(span(t, 174.0, 175.4))), -1.6], 50, {
        cast: [],
        room: { mood: 'night', door: 0, helmetTaken: true, polaroid: true, gorillaLook: look2 < 0.5 ? 'photo' : 'camera', gorillaBlink: span(t, 176.2, 176.5) > 0 && span(t, 176.2, 176.5) < 1, gorillaGlint: pulseAt(t, 174.0, 175.0) },
        fx: { title: smooth(span(t, 176.8, 178.0)), dark: smooth(span(t, 177.6, 180.6)) * 0.85 }
      });
    }
  });

  const TAL = [-0.2, -6.2];
  const MAK = [0.6, -9.6];
  const AMA = [-0.4, -3.6];
  const STANDEE = [2.8, -18.3];
  const KITTEN = [4.6, -16.6];
  const hash = (i, k) => frac(S(i * 127.1 + k * 311.7) * 43758.5453);

  function people(n, box, seed, t, opts) {
    const o = opts || {};
    const out = [];
    for (let i = 0; out.length < n && i < n * 8; i++) {
      const x = lerp(box[0], box[1], hash(i, seed)), z = lerp(box[2], box[3], hash(i, seed + 7));
      if (o.avoid && x > o.avoid[0] && x < o.avoid[1] && z > o.avoid[2] && z < o.avoid[3]) continue;
      if (out.some(a => Math.hypot(a.pose.x - x, a.pose.z - z) < 0.75)) continue;
      const ry = o.look ? Math.atan2(o.look[0] - x, o.look[1] - z) + (hash(i, seed + 9) - 0.5) * 0.5 : hash(i, seed + 3) * PI * 2;
      const p = pose(x, z, ry);
      const k = out.length;
      breathe(p, t, k + seed);
      if (o.mode === 'clap') {
        const c = 0.5 + 0.5 * S(t * 15 + k * 1.7);
        arm(p, 'R', 'clapR', 0.78 + 0.22 * c);
        arm(p, 'L', 'clapL', 0.78 + 0.22 * c);
        p.face = 'grin';
      } else if (o.mode === 'watch') {
        p.face = k % 3 ? 'surprised' : 'calm';
      } else {
        p.face = ['calm', 'happy', 'grin', 'calm'][k % 4];
        p.shL = [0.1 + 0.12 * S(t * 2 + k), 0, 0.12];
      }
      out.push(actor('c' + k, 'crowd' + ((k + seed) % Cast.CROWD_COUNT), p));
    }
    return out;
  }

  const behindBack = (p, k) => {
    p.shL = [-0.45 * k, 0.35 * k, 0.12];
    p.shR = [-0.45 * k, 0.35 * k, 0.12];
    p.elL = [1.35 * k, 0, 0];
    p.elR = [1.35 * k, 0, 0];
    return p;
  };
  const cuffed = (a) => { a.props = [{ id: 'cuffs', part: 'foreR', at: [0, -0.2, 0] }, { id: 'cuffs', part: 'foreL', at: [0, -0.2, 0] }]; return a; };
  const holding = (a, id) => { a.props = [{ id, part: 'foreR', at: [0, -0.22, 0.02] }]; return a; };
  function fallen(p, k) {
    p.ground = false;
    p.pivot = 0;
    p.y = 0.12 * k;
    p.rx = -1.45 * k;
    p.shL = [lerp(p.shL[0], 2.2, k), 0, lerp(p.shL[2], 0.6, k)];
    p.shR = [lerp(p.shR[0], 2.2, k), 0, lerp(p.shR[2], 0.6, k)];
    return p;
  }
  function floorSit(p, crawl) {
    p.hipL = [1.45, 0, 0.12];
    p.hipR = [1.45, 0, 0.12];
    p.knL = [0.35 + 0.4 * Math.max(0, S(crawl)), 0, 0];
    p.knR = [0.35 + 0.4 * Math.max(0, -S(crawl)), 0, 0];
    p.spine = [-0.18, 0, 0.05 * S(crawl)];
    return behindBack(p, 1);
  }
  function robot(p, b, i) {
    const step = (Math.floor(b) + i) % 4;
    const A = [[[0, 0, 1.5], 1.57, [0, 0, 1.5], 0], [[1.57, 0, 0.1], 1.57, [0, 0, 1.5], 1.57], [[0, 0, 1.5], 0, [1.57, 0, 0.1], 1.57], [[1.57, 0, 0.1], 0, [1.57, 0, 0.1], 0]][step];
    p.shR = A[0]; p.elR = [A[1], 0, 0]; p.shL = A[2]; p.elL = [A[3], 0, 0];
    p.neck = [0, step % 2 ? 0.4 : -0.4, 0];
    p.knL = [step === 1 ? 0.3 : 0, 0, 0];
    p.knR = [step === 3 ? 0.3 : 0, 0, 0];
    return p;
  }
  function escortGroup(t, zT, opts) {
    const o = opts || {};
    const walkK = o.walk === undefined ? 1 : o.walk;
    const tl = walking(pose(TAL[0], zT, PI), t, walkK);
    const jz = zT + (o.jz === undefined ? 0.95 : o.jz);
    const jb = behindBack(walking(pose(0.95, jz, PI), t + 0.2, walkK * 0.8), 1);
    const g1 = walking(pose(0.35, jz + 0.1, PI), t + 0.4, walkK);
    const g2 = walking(pose(1.55, jz + 0.15, PI), t + 0.1, walkK);
    g1.shL = [0.35, 0, 0.35];
    g2.shR = [0.35, 0, 0.35];
    return {
      tl: holding(actor('talleah', 'talleahSuit', tl), 'blaster'),
      jb: cuffed(actor('jacob', 'jacobHelmet', jb)),
      g1: actor('g1', 'gynoid', g1),
      g2: actor('g2', 'gynoid', g2)
    };
  }
  const flashIn = (t, at, len) => (t >= at && t < at + len ? 1 - (t - at) / len : 0);
  const hallView = (eye, at, fov, extra) => view(eye, at, fov, Object.assign({ hall: { mood: 'day' } }, extra));

  Object.assign(WORLDS, {
    crowd(t, u) {
      const z = lerp(3.0, 5.6, u);
      const am = walking(pose(-0.3, z + 0.5, 0), t, 1);
      am.face = 'scowl';
      am.shL = [-0.6, 0, 0.22];
      am.elL = [0.15, 0, 0];
      const jb = walking(pose(0.42, z - 0.45, -0.05), t + 0.25, 1);
      jb.shR = [0.75, 0, 0.12];
      const queue = [0.4, 1.3, 2.2, 3.1].map((qz, i) => {
        const p = pose(-2.75, qz, -PI / 2);
        breathe(p, t, i + 40);
        return actor('q' + i, 'crowd' + ((i * 4 + 2) % Cast.CROWD_COUNT), p);
      });
      const cast = [actor('amanda', 'amandaLantern', am), actor('jacob', 'jacobHelmet', jb)]
        .concat(people(11, [-5.2, 5.2, -9, 4.5], 3, t, { avoid: [-3.4, 1.6, -1, 9] }))
        .concat(queue);
      return hallView([1.15, 1.5, z + 4.0], [0, 1.2, z - 0.6], 52, { cast });
    },
    call(t) {
      const p = pose(0.1, 6.9, PI);
      const ring = span(t, 38.8, 39.4);
      if (t < 39.9) {
        arm(p, 'R', 'phoneR', smooth(ring * 3));
        p.face = t < 39.4 ? 'angry' : 'sad';
        p.neck = [0.1, 0.25, 0.12];
      } else if (t < 40.25) {
        p.shL = [2.6, 0, 0.35 + 0.3 * S(t * 22)];
        p.elL = [0.35, 0, 0];
        p.face = 'sad';
      } else {
        const k = t - 40.25;
        walking(p, t * 1.6, 1.3);
        p.ry = lerp(PI, 0.4, smooth(k * 4));
        p.x = 0.1 + k * 1.2;
        p.z = 6.9 + k * 3.2;
        p.spine = [0.25, 0, 0];
        p.face = 'sad';
      }
      const a = actor('amanda', 'amandaLantern', p);
      if (t < 39.9) a.props = [{ id: 'phone', part: 'foreR', at: [0, -0.24, 0.03], rot: [0, 0, 0] }];
      const cast = [a].concat(people(10, [-5.2, 5.2, 9, 17], 5, t, {}));
      return hallView([0.38, 1.62, 5.35], [0.1, 1.45, 6.9], 50, { cast });
    },
    escort(t, u) {
      const zT = lerp(8.4, 5.4, u);
      const G = escortGroup(t, zT);
      const point = smooth(span(t, 63.15, 63.45));
      G.tl.pose.shL = [lerp(G.tl.pose.shL[0], 1.35, point), 0, lerp(0.1, 0.8, point)];
      G.tl.pose.elL = [0.1, 0, 0];
      G.tl.pose.face = point > 0.5 ? 'awe' : 'happy';
      G.tl.pose.neck = [0, -0.5 * point, 0];
      const b = beatAt(t);
      const dancers = [['d1', 'crowd4', -3.3, 5.0], ['d2', 'crowd5', -3.9, 5.9]].map(([id, f, x, z], i) => actor(id, f, robot(pose(x, z, PI / 2), b, i * 2)));
      const pair = [['j1', 'crowd6', 3.3, 4.4, -PI / 2], ['j2', 'crowd7', 3.9, 5.2, -PI / 2]].map(([id, f, x, z, ry], i) => {
        const p = pose(x, z, ry);
        breathe(p, t, i);
        p.shR = [2.4, 0, 0.4];
        p.elR = [0.3, 0, 0];
        p.face = 'grin';
        return actor(id, f, p);
      });
      const cast = [G.tl, G.jb, G.g1, G.g2].concat(dancers, pair, people(6, [-5.2, 5.2, 9, 16], 9, t, {}));
      return hallView([2.4, 1.6, zT - 3.6], [0.1, 1.25, zT + 0.2], 62, { cast });
    },
    onlookers(t, u) {
      const zT = lerp(5.2, 2.4, u);
      const G = escortGroup(t, zT);
      const o1 = pose(2.7, 0.9, -1.2);
      arm(o1, 'R', 'cameraR', 1);
      arm(o1, 'L', 'cameraL', 1);
      o1.face = 'grin';
      const o2 = pose(3.4, 2.6, -1.35);
      arm(o2, 'R', 'thumbR', smooth(span(t, 65.3, 65.6)));
      o2.face = 'happy';
      const cam1 = actor('o1', 'crowd9', o1);
      cam1.props = [{ id: 'camera', part: 'foreR', at: [0.03, -0.27, 0.06], rot: [0, 0, 0] }];
      const cast = [G.tl, G.jb, G.g1, G.g2, cam1, actor('o2', 'crowd11', o2)].concat(people(6, [2.0, 5.3, -4, 7], 13, t, { look: [0.4, zT], avoid: [2.1, 4.0, 0.2, 3.4] }));
      const fl = Math.max(flashIn(t, 65.08, 0.18), flashIn(t, 65.99, 0.18));
      return hallView([-3.7, 1.45, 1.4], [1.6, 1.3, 3.2], 56, { cast, flashAt: fl > 0 ? { actor: 'o1', k: fl } : null, fx: { flash: fl * 0.35 } });
    },
    corner(t) {
      const walk = 1 - smooth(span(t, 66.8, 67.1));
      const zT = lerp(-4.6, TAL[1], smooth(span(t, 66.49, 67.05)));
      const G = escortGroup(t, zT, { walk, jz: lerp(0.95, -0.55, smooth(span(t, 66.6, 67.4))) });
      const aim = smooth(span(t, 67.25, 67.55));
      G.tl.pose.shR = [lerp(G.tl.pose.shR[0], 1.5, aim), 0, 0.05];
      G.tl.pose.elR = [lerp(0.1, 0.05, aim), 0, 0];
      G.tl.pose.face = aim > 0.5 ? 'angry' : 'surprised';
      const mk = smooth(span(t, 66.49, 67.35));
      const mp = walking(pose(lerp(3.6, MAK[0], mk), MAK[1], lerp(-PI / 2, 0, smooth(span(t, 66.9, 67.4)))), t, 1 - smooth(span(t, 67.2, 67.4)));
      mp.face = t < 67.25 ? 'calm' : t < 67.7 ? 'surprised' : 'smug';
      return hallView([0.75, 1.74, -4.9], [0.35, 1.3, -9.6], 50, { cast: [G.tl, G.jb, G.g1, G.g2, actor('makoto', 'makotoSchool', mp)] });
    },
    redflash(t) {
      const G = escortGroup(t, TAL[1], { walk: 0, jz: -0.55 });
      aiming(G.tl.pose, 'R');
      G.tl.pose.face = 'surprised';
      const snap = smooth(span(t, 68.33, 68.7));
      const cat = t >= 68.79;
      const mp = pose(MAK[0], MAK[1], 0.08);
      if (!cat) {
        arm(mp, 'R', 'snapR', snap);
        mp.face = 'sly';
      } else {
        aiming(mp, 'R');
        mp.ry = t < 69.5 ? -0.12 : 0.18;
        mp.face = 'sly';
      }
      const mko = actor('makoto', cat ? 'makotoCat' : 'makotoSchool', mp);
      if (cat) holding(mko, 'pistol');
      const f1 = smooth(span(t, 69.28, 69.62)), f2 = smooth(span(t, 69.74, 70.08));
      if (f1 > 0) fallen(G.g1.pose, f1);
      if (f2 > 0) fallen(G.g2.pose, f2);
      if (t > 69.95) floorSit(G.jb.pose, 0);
      const bolts = [];
      if (t > 69.2 && t < 69.36) bolts.push({ from: 'makoto', to: 'g1', col: [1, 0.15, 0.3] });
      if (t > 69.66 && t < 69.82) bolts.push({ from: 'makoto', to: 'g2', col: [1, 0.15, 0.3] });
      const smoke = [];
      if (t > 69.3) smoke.push({ actor: 'g1', t0: 69.3, col: [1, 0.45, 0.75] });
      if (t > 69.76) smoke.push({ actor: 'g2', t0: 69.76, col: [1, 0.45, 0.75] });
      return hallView([-4.6, 1.6, -6.4], [0.4, 1.15, -7.3], 50, {
        cast: [G.tl, G.jb, G.g1, G.g2, mko], bolts, smoke,
        fx: { flashCol: [1, 0.12, 0.2, flashIn(t, 68.79, 0.32) * 0.9 + (bolts.length ? 0.25 : 0)] }
      });
    },
    standoff(t, u) {
      const tl = holding(actor('talleah', 'talleahSuit', aiming(pose(TAL[0], TAL[1], PI), 'R')), 'blaster');
      tl.pose.face = 'angry';
      const mk = holding(actor('makoto', 'makotoCat', aiming(pose(MAK[0], MAK[1], 0.06), 'R')), 'pistol');
      mk.pose.face = 'sly';
      const g1 = actor('g1', 'gynoid', fallen(pose(0.35, -6.65, PI), 1));
      const g2 = actor('g2', 'gynoid', fallen(pose(1.55, -6.6, PI), 1));
      const crawl = smooth(u);
      const jb = cuffed(actor('jacob', 'jacobHelmet', floorSit(pose(lerp(0.95, 1.0, crawl), lerp(-7.6, -5.9, crawl), PI + 0.3), t * 9)));
      const ring = people(14, [-5.3, 5.3, -14.5, -1.8], 21, t, { look: [0.3, -7.9], avoid: [-1.8, 2.6, -11, -4.2], mode: 'watch' });
      return hallView([4.6, 3.2, -4.4], [0.35, 0.7, -7.7], 54, { cast: [tl, mk, g1, g2, jb].concat(ring) });
    },
    ceiling(t) {
      const up = smooth(span(t, 72.03, 72.33));
      const tp = pose(TAL[0], TAL[1], PI);
      tp.shR = [lerp(1.5, 2.75, up), 0, 0.1];
      tp.elR = [0.05, 0, 0];
      tp.face = 'angry';
      const tl = holding(actor('talleah', 'talleahSuit', tp), 'blaster');
      const mk = holding(actor('makoto', 'makotoCat', aiming(pose(MAK[0], MAK[1], 0.06), 'R')), 'pistol');
      mk.pose.face = 'surprised';
      const g1 = actor('g1', 'gynoid', fallen(pose(0.35, -6.65, PI), 1));
      const g2 = actor('g2', 'gynoid', fallen(pose(1.55, -6.6, PI), 1));
      const jb = cuffed(actor('jacob', 'jacobHelmet', floorSit(pose(1.0, -5.9, PI + 0.3), 0)));
      const run = smooth(span(t, 72.85, 73.4));
      const ap = walking(pose(lerp(-1.9, AMA[0], run), lerp(-0.6, AMA[1] + 0.4, run), PI - 0.3 * (1 - run)), t * 1.5, 1.2 * (1 - smooth(span(t, 73.3, 73.45))));
      if (t > 73.42) arm(ap, 'R', 'mouthR', smooth(span(t, 73.42, 73.6)));
      ap.face = 'surprised';
      const am = actor('amanda', 'amandaLantern', ap);
      am.hidden = t < 72.85;
      const crowdK = t > 72.6 ? 'clap' : 'watch';
      const ring = people(12, [-5.3, 5.3, -14.5, -1.8], 21, t, { look: [0.3, -7.9], avoid: [-2.6, 2.6, -11, -1.5], mode: crowdK });
      const bolts = t > 72.33 && t < 72.48 ? [{ from: 'talleah', to: [-0.5, 3.4, -7.4], col: [0.35, 0.6, 1] }] : [];
      const pan = smooth(span(t, 72.8, 73.25));
      const eye = [2.4, 1.0, -4.6];
      return hallView(eye, look(eye, lerp(-2.34, -1.11, pan), lerp(0.54, 0.13, pan), 3), 60, {
        cast: [tl, mk, g1, g2, jb, am].concat(ring), bolts,
        fire: t > 72.4 ? { pos: [-0.5, 3.39, -7.4], k: smooth(span(t, 72.4, 72.8)) } : null,
        fx: { flashCol: [0.4, 0.6, 1, flashIn(t, 72.35, 0.25) * 0.5] }
      });
    },
    moths(t) {
      const step = smooth(span(t, 77.56, 77.95));
      const p = pose(AMA[0], lerp(AMA[1] + 0.4, AMA[1], step), PI);
      p.face = t < 78.4 ? 'sad' : 'pathos';
      if (t > 78.0) {
        const ph = (t - 78.0) * 3.4;
        const k = smooth(span(t, 78.0, 78.4));
        p.shR = [lerp(0.1, 1.4 + 1.1 * S(ph), k), 0, lerp(0.1, 0.55 + 0.55 * C(ph), k)];
        p.shL = [lerp(0.1, 1.4 + 1.1 * S(ph + PI), k), 0, lerp(0.1, 0.55 + 0.55 * C(ph + PI), k)];
        p.elR = [0.35, 0, 0];
        p.elL = [0.35, 0, 0];
        p.spine = [-0.05 + 0.06 * S(ph), 0.12 * S(ph * 0.5), 0];
        p.hipL = [0.1 * S(ph), 0, 0.05];
      }
      const am = actor('amanda', 'amandaLantern', p);
      const back = people(12, [-5.2, 5.2, -1.4, 5], 31, t, { look: [AMA[0], AMA[1]], mode: 'watch' });
      const push = smooth(span(t, 77.56, 81.26));
      const glowK = smooth(span(t, 78.2, 81.0));
      return hallView([lerp(1.25, 0.7, push), 1.35, lerp(-5.9, -5.2, push)], [AMA[0], 1.15, AMA[1] + 0.2], 52, {
        cast: [am].concat(back),
        moths: { center: [AMA[0], 1.0, AMA[1]], k: smooth(span(t, 78.2, 79.6)), hearts: smooth(span(t, 79.3, 80.2)), cocoon: smooth(span(t, 80.15, 81.0)), burst: 0 },
        points: [{ pos: [AMA[0], 1.4, AMA[1] - 0.8], color: [1.6 * glowK, 0.5 * glowK, 1.0 * glowK] }],
        fx: { flashCol: [1, 0.6, 0.85, smooth(span(t, 80.6, 81.26)) * 0.55] }
      });
    },
    burst(t) {
      const k = smooth(span(t, 81.26, 81.9));
      const p = pose(AMA[0], AMA[1], PI);
      arm(p, 'R', 'wandUpR', 1);
      p.shL = [0.35, 0, 1.15];
      p.elL = [0.2, 0, 0];
      p.spine = [-0.12, 0, 0.06];
      p.neck = [-0.15, 0, 0];
      p.knL = [0.35, 0, 0];
      p.hipL = [0.2, 0, 0.1];
      p.lift = 0.3 * (1 - k);
      p.hair = 0.5 * (1 - k) + 0.08 * S(t * 4);
      p.face = 'pathos';
      const am = holding(actor('amanda', 'amandaPink', p), 'scepter');
      const back = people(12, [-5.2, 5.2, -1.4, 5], 31, t, { look: [AMA[0], AMA[1]], mode: 'watch' });
      return hallView([lerp(1.0, 0.7, k), 0.72, lerp(-5.9, -5.6, k)], [AMA[0], 1.35, AMA[1]], 52, {
        cast: [am].concat(back),
        moths: { center: [AMA[0], 1.0, AMA[1]], k: 0, hearts: 0, cocoon: 0, burst: span(t, 81.26, 82.4) },
        points: [{ pos: [AMA[0], 1.6, AMA[1] - 0.8], color: [1.5 * (1 - k * 0.6), 0.5, 1.0 * (1 - k * 0.6)] }],
        fx: { flashCol: [1, 0.7, 0.9, (1 - k) * 0.85] }
      });
    },
    blush(t) {
      const p = pose(AMA[0], AMA[1], PI);
      p.hair = 0.06 * S(t * 3);
      if (t < 83.75) p.face = 'shy';
      else if (t < 84.15) p.face = 'angry';
      else p.face = 'grin';
      p.shL = [0.25, 0, 0.18];
      if (t < 84.15) arm(p, 'R', 'cheekR', smooth(span(t, 83.1, 83.4)) * (1 - smooth(span(t, 83.9, 84.1))));
      arm(p, 'R', 'thumbR', smooth(span(t, 84.15, 84.4)));
      p.neck = [0.12 * (1 - smooth(span(t, 84.4, 84.6))), 0, 0];
      const am = actor('amanda', 'amandaPink', p);
      const back = people(10, [-5.2, 5.2, -1.4, 5], 31, t, { look: [AMA[0], AMA[1]], mode: 'watch' });
      return hallView([0.05, 1.5, -4.85], [AMA[0], 1.42, AMA[1]], 40, { cast: [am].concat(back) });
    },
    sinister(t) {
      const turn = smooth(span(t, 88.64, 89.05));
      const tp = aiming(pose(TAL[0], TAL[1], lerp(PI, 0.1, turn)), 'R');
      tp.face = 'angry';
      const tl = holding(actor('talleah', 'talleahSuit', tp), 'blaster');
      const mp = aiming(pose(MAK[0], MAK[1], 0.06), 'R');
      mp.face = t < 89.2 ? 'smug' : 'sly';
      const mk = holding(actor('makoto', 'makotoCat', mp), 'pistol');
      const ap = pose(AMA[0], AMA[1], PI);
      arm(ap, 'R', 'reachR', 1);
      ap.face = 'angry';
      const am = holding(actor('amanda', 'amandaPink', ap), 'scepter');
      const g1 = actor('g1', 'gynoid', fallen(pose(0.35, -6.65, PI), 1));
      const push = smooth(span(t, 89.1, 90.49));
      return hallView([lerp(2.7, 1.75, push), 1.5, lerp(-7.6, -8.7, push)], [lerp(-0.1, MAK[0], push), lerp(1.4, 1.5, push), lerp(-7.9, MAK[1], push)], lerp(62, 40, push), { cast: [tl, mk, am, g1] });
    },
    shootout(t) {
      const tp = pose(TAL[0], TAL[1], t < 90.75 ? 0.1 : PI);
      const fall = smooth(span(t, 91.38, 91.8));
      aiming(tp, 'R');
      tp.face = fall > 0 ? 'surprised' : 'angry';
      if (fall > 0) fallen(tp, fall);
      const tl = holding(actor('talleah', 'talleahSuit', tp), 'blaster');
      const mk = holding(actor('makoto', 'makotoCat', aiming(pose(MAK[0], MAK[1], 0.06), 'R')), 'pistol');
      mk.pose.face = 'sly';
      const rush = smooth(span(t, 91.8, 92.33));
      const ap = walking(pose(lerp(AMA[0], -0.3, rush), lerp(AMA[1], -4.6, rush), PI), t * 1.5, rush > 0 && rush < 1 ? 1.2 : 0);
      ap.face = rush > 0 ? 'sad' : 'surprised';
      const am = holding(actor('amanda', 'amandaPink', ap), 'scepter');
      const bolts = [];
      const red = [90.58, 90.98, 91.3], blue = [90.8, 91.15];
      red.forEach(a => { if (t > a && t < a + 0.12) bolts.push({ from: 'makoto', to: 'talleah', col: [1, 0.15, 0.3] }); });
      blue.forEach(a => { if (t > a && t < a + 0.12) bolts.push({ from: 'talleah', to: 'makoto', col: [0.35, 0.6, 1] }); });
      const redK = Math.max(...red.map(a => flashIn(t, a, 0.2)));
      const blueK = Math.max(...blue.map(a => flashIn(t, a, 0.2)));
      const wall = pulseAt(t, 91.22, 91.62);
      const ring = people(12, [-5.3, -1.6, -13, -1.6], 41, t, { look: [0.2, -7], mode: t > 91.6 ? 'clap' : 'watch' });
      return hallView([4.7, 1.7, -6.7], [-0.4, 1.15, -6.7], 60, {
        cast: [tl, mk, am].concat(ring), bolts,
        fx: { flashCol: redK + wall > blueK ? [1, 0.15, 0.25, Math.min(0.8, redK * 0.55 + wall * 0.78)] : [0.35, 0.55, 1, blueK * 0.55] }
      });
    },
    alone(t) {
      const p = pose(0, 14, 0);
      arm(p, 'R', 'deviceR', 1);
      arm(p, 'L', 'deviceL', 1);
      p.neck = [0.45, 0, 0];
      p.face = 'blank';
      const mk = actor('makoto', 'makotoCat', p);
      mk.props = [{ id: 'device', part: 'foreR', at: [0.05, -0.26, 0.05], rot: [0, 0, 0] }];
      return view([0.55, 1.45, 15.5], [0, 1.25, 14], 46, { cast: [mk], hall: { mood: 'dark' }, points: [{ pos: [0.1, 1.2, 14.4], color: [0.5, 0.15, 0.3] }] });
    },
    door(t) {
      const open = smooth(span(t, 124.72, 125.1));
      const aside = smooth(span(t, 124.6, 124.85));
      const tp = pose(lerp(5.2, 4.8, aside), lerp(-14.0, -14.85, aside), lerp(PI / 2, -0.78, smooth(span(t, 124.9, 125.2))));
      if (t < 124.6) {
        const b = beatAt(t);
        const g = Math.floor(b * 2) % 3;
        tp.shR = [[2.6, 0, 0.3], [1.2, 0, 1.2], [1.6, 0, 0.1]][g];
        tp.shL = [[1.2, 0, 1.2], [2.6, 0, 0.3], [0.4, 0, 0.6]][g];
        tp.elR = [0.6, 0, 0];
        tp.elL = [0.6, 0, 0];
        tp.lift = 0.14 * Math.max(0, S(PI * b * 2));
        tp.face = g === 2 ? 'surprised' : 'angry';
      } else if (t < 125.0) {
        tp.face = 'surprised';
      } else {
        tp.shR = [2.9, 0, 0.4];
        tp.shL = [2.9, 0, 0.4];
        tp.elR = [0.3, 0, 0];
        tp.elL = [0.3, 0, 0];
        tp.face = 'awe';
        tp.lift = 0.12 * Math.max(0, S(PI * (t - 125.0) * 4));
      }
      const reach = smooth(span(t, 124.1, 124.7));
      const pan = smooth(span(t, 124.95, 125.25));
      const eye = [lerp(3.9, 4.85, reach), 1.62, lerp(-12.6, -13.15, reach)];
      const at0 = [lerp(5.4, 5.9, reach), lerp(1.2, 1.05, reach), lerp(-14.2, -13.8, reach)];
      const at = [lerp(at0[0], 4.8, pan), lerp(at0[1], 1.4, pan), lerp(at0[2], -14.85, pan)];
      const back = smooth(span(t, 124.95, 125.2));
      return hallView(eye, at, 54, {
        cast: [actor('talleah', 'talleahSuit', tp)],
        pov: back < 1 ? [Object.assign({ side: 'L', at: [-0.12, lerp(-0.45, -0.22, reach) - 0.3 * back, -0.2], rot: [lerp(0.2, 0.6, reach), -0.2, 0] }, sleeveHoodie)] : null,
        sideDoor: open * 1.25
      });
    },
    scan(t) {
      const b = beatAt(t);
      const swaps = [[273, 'talleahKnight'], [275, 'talleahWitch'], [277, 'talleahRanger']];
      let form = 'talleahSuit';
      let ring = null;
      swaps.forEach(([at, f]) => {
        const k = (b - at) / 0.7;
        if (k >= 0.5) form = f;
        if (k > 0 && k < 1) ring = { actor: 'talleah', k };
      });
      const flick = smooth(span(t, 128.3, 128.6));
      const tp = pose(3.0, -15.4, lerp(-PI / 2, PI / 2 + 0.75, flick));
      breathe(tp, t, 2);
      tp.face = ring ? 'awe' : 'happy';
      if (flick > 0.5) {
        arm(tp, 'R', 'reachR', smooth(span(t, 128.55, 128.75)) * (1 - smooth(span(t, 128.95, 129.15))));
        tp.face = 'grin';
      }
      const walkers = [['knight', 'crowd0', 125.3], ['witch', 'crowd1', 126.2], ['ranger', 'rangerFan', 127.1]].map(([id, f, t0]) => {
        const k = (t - t0) / 2.3;
        const p = walking(pose(0.7, lerp(-11.2, -19.5, k), PI), t, 1);
        const a = actor(id, f, p);
        a.hidden = k < 0 || k > 1;
        return a;
      });
      const beam = swaps.map(([at], i) => ({ i, k: (b - at + 0.6) / 0.6 })).find(x => x.k > 0 && x.k < 1);
      const nose = flick > 0.5 ? pulseAt(t, 128.72, 129.2) : 0;
      return hallView([-0.7, 1.45, -12.0], [3.2, 1.15, -15.8], 52, {
        cast: [actor('talleah', form, tp)].concat(walkers),
        scanRing: ring, scanBeam: beam ? { from: 'talleah', to: walkers[beam.i].id } : null,
        kitten: nose,
        points: ring ? [{ pos: [3.0, 1.4, -14.8], color: [0.4, 0.7, 1.4] }] : null
      });
    },
    standee(t) {
      const walk = 1 - smooth(span(t, 129.6, 129.72));
      const back = smooth(span(t, 129.72, 129.9));
      const tp = walking(pose(lerp(2.0, 2.5, smooth(span(t, 129.26, 129.72))) - 0.1 * back, lerp(-16.4, -17.55, smooth(span(t, 129.26, 129.72))) + 0.35 * back, PI - 0.25), t, walk);
      tp.face = 'happy';
      if (t > 129.72 && t < 130.5) {
        aiming(tp, 'R');
        tp.face = 'angry';
        tp.lift = 0.1 * pulseAt(t, 129.72, 129.95);
      } else if (t >= 130.5) {
        tp.shR = [1.85, 0, 0.12];
        tp.elR = [0.55 + 0.25 * Math.max(0, S((t - 130.5) * 18)), 0, 0];
        tp.face = 'happy';
      }
      const tl = actor('talleah', 'talleahRanger', tp);
      if (t > 129.72 && t < 130.5) holding(tl, 'blaster');
      const tilt = t < 129.7 ? 0 : -0.32 * Math.exp(-(t - 129.7) * 2.2) * C((t - 129.7) * 11);
      return hallView([0.35, 1.45, -15.0], [2.6, 1.25, -17.8], 50, { cast: [tl], standee: tilt });
    },
    salute(t) {
      const turn = smooth(span(t, 131.1, 131.45));
      const eye = [1.15, 1.45, -14.75];
      const tp = pose(2.5, -17.4, lerp(PI - 0.25, Math.atan2(eye[0] - 2.5, eye[2] + 17.4), turn));
      arm(tp, 'R', 'saluteR', smooth(span(t, 131.45, 131.75)));
      tp.face = 'grin';
      const gs = [[1.55, -17.9], [3.45, -17.8]].map(([x, z], i) => {
        const p = pose(x, z, Math.atan2(eye[0] - x, eye[2] - z));
        arm(p, 'R', 'saluteG', smooth(span(t, 131.85 + i * 0.12, 132.15 + i * 0.12)));
        return actor('g' + (i + 1), 'gynoid', p);
      });
      return hallView(eye, [2.5, 1.3, -17.5], 46, { cast: [actor('talleah', 'talleahRanger', tp)].concat(gs) });
    },
    run(t, u) {
      const zJ = lerp(-6.0, -18.4, smooth(u * 1.05));
      const jp = walking(pose(0.15 * S(t * 5), zJ, PI), t * 1.6, 1.45);
      jp.spine = [0.3, 0, 0];
      const jb = actor('jacob', 'jacobHoodie', jp);
      const b = beatAt(t);
      const COLS = [[1, 0.45, 0.75], [1, 0.25, 0.3], [0.35, 0.55, 1]];
      const glow = COLS[Math.floor(b) % 3].map(v => v * (1 - 0.5 * frac(b)));
      const open = smooth(span(t, 147.26, 147.56));
      return view([0.35, 1.55, zJ + 2.5], [0, 1.25, zJ - 3.5], 54, {
        cast: [jb], hall: { mood: 'night' },
        mainDoors: { open, glow },
        points: [{ pos: [0, 0.4, -19.2], color: glow.map(v => v * 1.4) }],
        fx: { white: smooth(span(t, 147.42, 147.72)) * 0.9 }
      });
    }
  });

  const VAULT = [60, 0, 0];
  const vp = (dx, dz) => [VAULT[0] + dx, VAULT[2] + dz];
  const SEPIA = [1.12, 0.96, 0.72, 0.55];
  const DANCER_LOOKS = [
    { size: 'm', skin: 0x5a4a44, hair: 0x141018, hairStyle: 'short', top: 0x1a1a2e, legs: 0x101018, shoes: 0x0a0a0a },
    { size: 'f', skin: 0x6a5450, hair: 0x2a1020, hairStyle: 'bob', top: 0x2a1438, legs: 0x141018, shoes: 0x0a0a0a },
    { size: 'f', skin: 0x5e4a46, hair: 0x101016, hairStyle: 'long', top: 0x101a2a, dress: 0x16102a, legs: 0x101018, shoes: 0x0a0a0a },
    { size: 'm', skin: 0x544640, hair: 0x2a1a10, hairStyle: 'spiky', top: 0x221a28, legs: 0x141418, shoes: 0x0a0a0a },
    { size: 'm', skin: 0x5a4a44, hair: 0x101010, hairStyle: 'cap', hat: 0x2a1030, top: 0x14141e, legs: 0x101018, shoes: 0x0a0a0a },
    { size: 'f', skin: 0x6a5450, hair: 0x3a1430, hairStyle: 'ears', earInner: 0x5a2a4a, top: 0x1e1028, legs: 0x141018, shoes: 0x0a0a0a }
  ];
  DANCER_LOOKS.forEach((l, i) => { SOLVERS['dancer' + i] = { d: DIM[l.size], scale: 1 }; });
  const STICKS = [[0.3, 1, 0.4], [1, 0.3, 0.8], [0.3, 0.7, 1], [1, 0.8, 0.2], null, [0.6, 0.4, 1], null];
  const BEAT_COLS = [[1, 0.25, 0.6], [0.3, 0.5, 1], [0.6, 0.25, 1], [1, 0.45, 0.2]];

  function clubMove(p, b, k, amt) {
    const a = amt === undefined ? 1 : amt;
    const s = S(PI * (b + k * 0.37));
    const as = Math.abs(s);
    p.lift = 0.05 * as * a;
    p.knL = [0.28 * as * a, 0, 0];
    p.knR = [0.28 * as * a, 0, 0];
    p.hipL = [0.12 * as * a, 0, 0.06];
    p.hipR = [0.12 * as * a, 0, 0.06];
    p.neck = [0.15 * s * a, 0, 0];
    p.spine = [0.08 * as * a, 0, 0.05 * s * a];
    const up = k % 3;
    if (up === 0) {
      p.shR = [2.7 + 0.25 * s, 0, 0.3];
      p.elR = [0.2, 0, 0];
      p.shL = [0.6, 0, 0.3];
      p.elL = [1.2, 0, 0];
    } else if (up === 1) {
      p.shR = [2.6, 0, 0.6 + 0.25 * s];
      p.shL = [2.6, 0, 0.6 - 0.25 * s];
      p.elR = [0.25, 0, 0];
      p.elL = [0.25, 0, 0];
    } else {
      const m = Math.max(0, s);
      p.shR = [1.6 + 0.9 * m, 0, 0.2];
      p.elR = [1.4 - 1.0 * m, 0, 0];
      p.shL = [0.35, 0, 0.2];
      p.elL = [1.2, 0, 0];
    }
    return p;
  }

  function dancers(n, box, seed, t, opts) {
    const o = opts || {};
    const b = beatAt(t);
    const out = [];
    for (let i = 0; out.length < n && i < n * 8; i++) {
      let x = lerp(box[0], box[1], hash(i, seed)), z = lerp(box[2], box[3], hash(i, seed + 5));
      if (o.avoid && x > o.avoid[0] && x < o.avoid[1] && z > o.avoid[2] && z < o.avoid[3]) continue;
      if (out.some(a => Math.hypot(a.pose.x - x, a.pose.z - z) < 0.8)) continue;
      if (o.close) {
        x = lerp(x, o.close[0], o.close[2] * 0.45);
        z = lerp(z, o.close[1], o.close[2] * 0.45);
      }
      const k = out.length;
      const p = clubMove(pose(x, z, hash(i, seed + 2) * PI * 2), b, k);
      const a = actor('dn' + k, 'dancer' + (k % DANCER_LOOKS.length), p);
      a.base = true;
      a.stick = STICKS[k % STICKS.length];
      out.push(a);
    }
    return out;
  }

  function makotoClub(p, b, t, amt) {
    const a = amt === undefined ? 1 : amt;
    const sw = S(PI * b);
    p.spine = [0.05, 0.18 * S(PI * b * 0.5) * a, 0.14 * sw * a];
    p.hipL = [0.16 * Math.max(0, sw) * a, 0, 0.08];
    p.hipR = [0.16 * Math.max(0, -sw) * a, 0, 0.08];
    p.knL = [0.32 * Math.max(0, sw) * a, 0, 0];
    p.knR = [0.32 * Math.max(0, -sw) * a, 0, 0];
    p.shR = [2.3 + 0.4 * sw * a, 0, 0.35 + 0.3 * C(PI * b)];
    p.elR = [0.6, 0, 0];
    p.shL = [1.3 + 0.6 * S(PI * b + 1) * a, 0, 0.5];
    p.elL = [1.0, 0, 0];
    p.hair = 0.3 * sw * a;
    p.neck = [0.05, 0.25 * S(PI * b * 0.5) * a, 0.1 * sw * a];
    p.lift = 0.04 * Math.abs(sw) * a;
    return p;
  }

  const discoLights = (t) => {
    const b = beatAt(t);
    const c = BEAT_COLS[Math.floor(b) % 4];
    return [
      { pos: [2.4 * S(t * 1.3), 3.0, -1 + 2 * C(t * 1.1)], color: c.map(v => v * 1.6) },
      { pos: [-2.2, 2.4, 1.8], color: BEAT_COLS[(Math.floor(b) + 2) % 4].map(v => v * 1.1) }
    ];
  };
  const strobe = (t) => {
    const f = frac(beatAt(t));
    return f > 0.5 && f < 0.58 ? 0.16 : 0;
  };
  const discoView = (eye, at, fov, extra) => view(eye, at, fov, Object.assign({ disco: true, points: null }, extra));

  Object.assign(WORLDS, {
    starroad(t, u) {
      const ka = pose(-0.25, 0.3, 0.2);
      ka.neck = [-0.5, 0.1, 0];
      ka.face = 'awe';
      ka.shL = [0.3, 0, 0.45];
      ka.elL = [0.2, 0, 0];
      breathe(ka, t, 3);
      ka.neck = [-0.5, 0.1 + 0.15 * S(t * 0.8), 0];
      const kj = pose(0.32, 0.38, -0.25);
      kj.shR = [0.3, 0, 0.45];
      kj.elR = [0.2, 0, 0];
      kj.neck = [-0.1, -0.35, 0];
      const adults = [[-1.6, -1.0, 0.35, 0], [1.4, -0.7, -0.4, 1], [0.1, -2.2, 0.2, 2], [-2.6, 0.4, 1.2, 3], [2.5, 0.6, -1.4, 4]].map(([x, z, ry, i]) => {
        const p = pose(x, z, ry);
        breathe(p, t, i + 10);
        if (i === 0) {
          p.shR = [2.8, 0, 0.2];
          p.elR = [0.15, 0, 0];
        }
        if (i === 2) walking(p, t, 0.6);
        if (i === 2) p.x = 0.1 + (t - 75.7) * 0.5;
        return actor('ad' + i, 'silver', p);
      });
      return view([lerp(0.95, 0.6, u), 0.78, lerp(2.3, 2.0, u)], [0, 1.25, -0.8], 52, {
        cast: [actor('kidA', 'kidAmanda', ka), actor('kidJ', 'kidJacob', kj)].concat(adults),
        memory: 'con', grade: SEPIA, film: { grain: 0.1, vignette: 0.75 },
        points: [{ pos: [0, 3.4, 0.8], color: [0.9, 0.75, 0.5] }]
      });
    },
    vault(t) {
      const [tx, tz] = vp(-1.3, 1.3);
      const turn = smooth(span(t, 93.0, 93.35));
      const tp = pose(tx, tz, lerp(0, -1.37, turn));
      breathe(tp, t, 1);
      tp.face = turn > 0.5 ? 'surprised' : 'calm';
      if (turn > 0.5) aiming(tp, 'R');
      const sneak = smooth(span(t, 92.33, 92.8));
      const [mx0, mz0] = vp(0.6, -2.6), [mx1, mz1] = vp(0.75, -0.55);
      const mp = walking(pose(lerp(mx0, mx1, sneak), lerp(mz0, mz1, sneak), -0.23), t, (1 - smooth(span(t, 92.7, 92.8))) * 0.7);
      mp.spine = [0.3 * (1 - smooth(span(t, 93.2, 93.5))), 0, 0];
      mp.knL = [0.35, 0, 0];
      mp.knR = [0.35, 0, 0];
      mp.face = 'sly';
      const throwK = span(t, 92.78, 92.95);
      if (throwK > 0 && throwK < 1) {
        mp.shR = [lerp(-0.4, 2.2, throwK), 0, 0.4];
        mp.elR = [0.3, 0, 0];
      }
      const take = smooth(span(t, 93.3, 93.6));
      if (t > 93.25) {
        mp.ry = lerp(-0.23, -1.4, take);
        arm(mp, 'L', 'deviceL', 1);
        mp.shL = [lerp(1.4, 1.1, take), 0, lerp(0.1, 0.25, take)];
        mp.elL = [lerp(0.1, 1.1, smooth(span(t, 93.6, 93.9))), 0, 0];
        mp.face = t > 93.7 ? 'wink' : 'sly';
      }
      const ok = span(t, 92.85, 93.3);
      const s0 = [VAULT[0] + 0.9, 1.4, VAULT[2] - 0.5], s1 = [VAULT[0] - 2.8, 0.15, VAULT[2] + 1.6];
      const orb = ok > 0 && ok < 1 ? [lerp(s0[0], s1[0], ok), lerp(s0[1], s1[1], ok) + 1.4 * S(PI * ok), lerp(s0[2], s1[2], ok)] : null;
      const land = t > 93.3 ? Math.exp(-(t - 93.3) * 2) : 0;
      return view([VAULT[0] + 3.0, 1.6, VAULT[2] + 2.0], [VAULT[0] - 0.6, 1.0, VAULT[2] - 0.3], 58, {
        cast: [actor('talleah', 'talleahSuit', tp), actor('makoto', 'makotoCat', mp)],
        memory: 'vault', grade: [1.05, 0.95, 1.12, 0.15],
        treasure: { at: t > 93.6 ? 'makoto' : 'pedestal' },
        orb: orb ? { pos: orb } : null,
        landing: land > 0.02 ? { pos: s1, k: land } : null,
        points: land > 0.02 ? [{ pos: [s1[0], 0.8, s1[2]], color: [2.2 * land, 0.3 * land, 0.4 * land] }] : [{ pos: [VAULT[0], 1.6, VAULT[2]], color: [0.9, 0.7, 1.2] }]
      });
    },
    portal(t) {
      const [mx, mz] = vp(1.0, -0.4);
      const eye = [VAULT[0] + 3.3, 1.5, VAULT[2] - 1.0];
      const back = smooth(span(t, 95.35, 95.75));
      const ry = Math.atan2(eye[0] - mx, eye[2] - mz);
      const ringPos = [mx - S(ry) * 1.05, 1.05, mz - C(ry) * 1.05];
      const mp = pose(lerp(mx, ringPos[0], back * 0.9), lerp(mz, ringPos[2], back * 0.9), ry);
      arm(mp, 'R', 'deviceR', 1);
      mp.shL = [0.55, 0, 0.3];
      mp.elL = [0.9, 0, 0];
      const press = pulseAt(t, 94.82, 95.02);
      mp.elR = [mp.elR[0] + 0.25 * press, 0, 0];
      mp.face = t > 94.3 && t < 94.75 ? 'wink' : 'sly';
      mp.hair = 0.35 * smooth(span(t, 95.0, 95.4));
      const mk = actor('makoto', 'makotoCat', mp);
      mk.props = [{ id: 'device', part: 'foreR', at: [0.05, -0.26, 0.05], rot: [0, 0, 0] }];
      mk.hidden = t > 95.78;
      const [tx, tz] = vp(-1.3, 1.3);
      const tp = pose(tx, tz, lerp(-1.37, 1.3, smooth(span(t, 95.45, 95.85))));
      aiming(tp, 'R');
      tp.face = 'surprised';
      const open = smooth(span(t, 94.95, 95.3)) * (1 - smooth(span(t, 95.75, 96.0)));
      return view(eye, [lerp(mx, ringPos[0], 0.35), 1.35, lerp(mz, ringPos[2], 0.35)], 46, {
        cast: [mk, actor('talleah', 'talleahSuit', tp)],
        memory: 'vault', grade: [1.05, 0.95, 1.12, 0.15],
        treasure: t <= 95.78 ? { at: 'makoto' } : null,
        portal: open > 0.01 ? { pos: ringPos, ry, k: open } : null,
        points: [{ pos: [ringPos[0], 1.2, ringPos[2] + 0.3], color: [2.0 * open + 0.3, 0.3 * open + 0.2, 0.8 * open + 0.4] }]
      });
    },
    dance(t) {
      const b = beatAt(t);
      const mp = makotoClub(pose(0, -1.0, 0), b, t, 1);
      mp.face = 'smug';
      const beck = smooth(span(t, 98.55, 98.8));
      if (beck > 0) {
        arm(mp, 'R', 'beckonR', beck);
        mp.elR = [mp.elR[0] + 0.35 * Math.max(0, S(t * 16)), 0, 0];
        mp.face = 'wink';
      }
      const cast = [actor('makoto', 'makotoCat', mp)].concat(dancers(14, [-5.5, 5.5, -6.2, 1.6], 7, t, { avoid: [-1.0, 1.0, -2.0, 4] }));
      return discoView([0.25 * S(t * 0.7), 1.55, 2.4], [0, 1.2, -1.0], 52, { cast, points: discoLights(t), fx: { white: strobe(t) } });
    },
    tandem(t, u) {
      const b = beatAt(t);
      const C0 = [0, 1.55, 1.0];
      const th = lerp(-0.3, PI * 1.55, smooth(u));
      const rad = lerp(0.95, 0.55, smooth(span(t, 100.9, 101.4)));
      const mp = makotoClub(pose(C0[0] + S(th) * rad, C0[2] - C(th) * rad, 0), b, t, 0.8);
      mp.ry = Math.atan2(C0[0] - mp.x, C0[2] - mp.z);
      mp.face = t > 101.0 ? 'wink' : 'smug';
      if (t > 101.0) {
        mp.spine = [0.15, 0, 0.2];
        mp.neck = [0.2, 0.3, 0.25];
      }
      const yaw = PI - th - 0.12;
      const cast = [actor('makoto', 'makotoCat', mp)].concat(dancers(12, [-5.5, 5.5, -6.2, 5.5], 11, t, { avoid: [-1.5, 1.5, -0.8, 2.6] }));
      return discoView(C0, look(C0, yaw, -0.08, 2), 58, { cast, points: discoLights(t), fx: { white: strobe(t) } });
    },
    gone(t) {
      const b = beatAt(t);
      const go = smooth(span(t, 101.56, 102.2));
      const mp = walking(pose(lerp(0.2, -1.4, go), lerp(0.2, -3.0, go), lerp(0, PI + 0.4, smooth(span(t, 101.56, 101.8)))), t, 1);
      mp.face = 'smug';
      const mk = actor('makoto', 'makotoCat', mp);
      mk.hidden = t > 102.25;
      const eye = [0, 1.55, 1.6];
      const yaw = PI + 0.3 * go + 0.55 * S((t - 101.56) * 5.2) * smooth(span(t, 101.95, 102.3));
      const cast = [mk].concat(dancers(16, [-5.5, 5.5, -6.2, 0.6], 13, t, { avoid: [-0.8, 0.8, -0.5, 4], close: [-1.2, -2.6, go] }));
      return discoView(eye, look(eye, yaw, -0.06, 2), 58, { cast, points: discoLights(t), fx: { white: strobe(t) } });
    }
  });

  const TUBE = [0, -16.5];
  function typing(p, t, i) {
    p.shR = [1.25, 0, 0.12 + 0.05 * S(t * 20 + i)];
    p.elR = [0.9 + 0.15 * S(t * 17 + i), 0, 0];
    p.shL = [1.25, 0, 0.12];
    p.elL = [0.9 + 0.15 * S(t * 19 + i * 2), 0, 0];
    p.neck = [0.15, 0.1 * S(t * 0.8 + i), 0];
    return p;
  }
  function medStaff(t) {
    return [[-3.2, -14.2, -PI / 2], [3.2, -17.0, PI / 2]].map(([x, z, ry], i) => actor('gm' + i, 'gynoid', typing(pose(x, z, ry), t, i + 7)));
  }

  Object.assign(WORLDS, {
    hangar(t, u) {
      const cast = [];
      for (let i = 0; i < 5; i++) {
        const x = -6 + ((t * 1.1 + i * 1.6) % 12);
        const p = walking(pose(x, 1.4 + (i % 2) * 0.35, PI / 2), t + i * 0.2, 1);
        arm(p, 'R', 'reachR', 0.8);
        p.shL = p.shR.slice();
        p.elL = p.elR.slice();
        const a = actor('ga' + i, 'gynoid', p);
        a.props = [{ id: 'crate', part: 'torso', at: [0, 0.2, 0.34] }];
        cast.push(a);
      }
      [-2, 1, 4, 7, -0.5].forEach((z, i) => cast.push(actor('gb' + i, 'gynoid', typing(pose(-6.85, z, -PI / 2), t, i))));
      for (let i = 0; i < 5; i++) cast.push(actor('gc' + i, 'gynoid', walking(pose(2.0 + i * 0.8, lerp(-7.0, -3.2, u), 0), t, 1)));
      const k = smooth(u);
      const eye = [lerp(3.2, 0.5, k), lerp(2.4, 1.7, k), lerp(9.0, -4.2, k)];
      return view(eye, [lerp(-0.8, 0, k), lerp(1.3, 1.6, k), lerp(0, -12, k)], 54, { cast, iris: smooth(span(t, 117.85, 118.18)) });
    },
    tube(t, u) {
      const p = pose(TUBE[0], TUBE[1], 0);
      p.ground = false;
      p.y = 0.55 + 0.05 * S(t * 1.2);
      p.shL = [0.2, 0, 0.35 + 0.06 * S(t)];
      p.shR = [0.2, 0, 0.35 + 0.06 * S(t + 1)];
      p.elL = [0.4, 0, 0];
      p.elR = [0.4, 0, 0];
      p.hipL = [0.12, 0, 0.05];
      p.knL = [0.25, 0, 0];
      p.knR = [0.1, 0, 0];
      p.hair = 0.3 * S(t * 0.9);
      p.neck = [0.08 * S(t * 0.7), 0, t > 120.9 ? 0.22 : 0];
      p.face = t < 120.45 ? 'sleep' : t < 120.62 ? 'calm' : 'surprised';
      p.blink = t > 121.3 && t < 121.42 ? 1 : 0;
      const k = smooth(u);
      return view([lerp(0.25, 0.1, k), lerp(1.5, 1.62, k), lerp(-12.9, -14.4, k)], [0, 1.55, TUBE[1]], 50, {
        cast: [actor('talleah', 'talleahSuit', p)].concat(medStaff(t)),
        medbay: true, tubeState: { liquid: 1, glass: 0 },
        points: [{ pos: [0, 1.6, TUBE[1] + 1.1], color: [0.3, 1.0, 0.6] }]
      });
    },
    hug(t) {
      const walk = smooth(span(t, 121.87, 122.6));
      const rush = smooth(span(t, 122.8, 123.05));
      const p = walking(pose(lerp(0, 0.24, rush), lerp(lerp(-15.6, -14.5, walk), -13.66, rush), 0), t, (walk > 0 && walk < 1 ? 0.7 : 0) + (rush > 0 && rush < 1 ? 1.2 : 0));
      if (t < 122.55) {
        p.shR = [2.9, 0, 0.35];
        p.shL = [2.9, 0, 0.35];
        p.elR = [0.5, 0, 0];
        p.elL = [0.5, 0, 0];
        p.spine = [-0.12, 0, 0];
        p.face = 'yawn';
      } else if (t < 122.8) {
        p.face = 'surprised';
      } else {
        const wrap = smooth(span(t, 123.0, 123.2));
        p.shR = [lerp(1.4, 1.55, wrap), 0, lerp(1.0, 0.3, wrap)];
        p.shL = [lerp(1.4, 1.55, wrap), 0, lerp(1.0, 0.3, wrap)];
        p.elR = [lerp(0.2, 0.9, wrap), 0, 0];
        p.elL = [lerp(0.2, 0.9, wrap), 0, 0];
        p.neck = [0.1, -0.2 * wrap, -0.25 * wrap];
        p.face = 'happy';
      }
      const sq = smooth(span(t, 123.0, 123.15));
      const eye = [0.02 * S(t * 61) * sq, 1.62 + 0.015 * S(t * 47) * sq, -13.25];
      return view(eye, [lerp(0, 0.35, rush), 1.45, -16], 54, {
        cast: [actor('talleah', 'talleahSuit', p)].concat(medStaff(t)),
        medbay: true, tubeState: { liquid: 0, glass: 1 },
        fx: { squeeze: sq * (0.85 + 0.15 * S(t * 20)) }
      });
    }
  });

  const STAGE_Y = 1.2;
  const BEAM_MEET = [0, 5.6, -7.2];

  function concertTrio(t, mode) {
    const b = beatAt(t);
    const am = pose(-1.7, -7.4, 0.25);
    const mk = pose(0, -8.0, 0);
    const tl = pose(1.7, -7.4, -0.25);
    [am, mk, tl].forEach((p, i) => {
      p.lift = STAGE_Y;
      breathe(p, t, i);
      p.hair = 0.25 * S(t * 2.2 + i);
    });
    const up = mode === 'fire' ? 1 : 0;
    arm(am, 'R', up ? 'wandUpR' : 'reachR', 1);
    aiming(mk, 'R');
    aiming(tl, 'R');
    if (up) {
      mk.shR = [2.2, 0, 0.1];
      tl.shR = [2.2, 0, 0.1];
      mk.ry = 0.25;
      tl.ry = -0.55;
      am.ry = 0.45;
    } else {
      mk.lift += 0.03 * Math.abs(S(PI * b));
    }
    am.face = 'pathos';
    mk.face = 'sly';
    tl.face = 'angry';
    const g = [[2.9, -8.2, -0.3], [3.6, -7.6, -0.4]].map(([x, z, ry], i) => {
      const p = aiming(pose(x, z, ry), 'R');
      p.lift = STAGE_Y;
      return actor('g' + (i + 1), 'gynoid', p);
    });
    return [holding(actor('amanda', 'amandaPink', am), 'scepter'), holding(actor('makoto', 'makotoCat', mk), 'pistol'), holding(actor('talleah', 'talleahSuit', tl), 'blaster')].concat(g);
  }

  function audience(n, box, seed, t, opts) {
    const o = opts || {};
    const b = beatAt(t);
    return dancers(n, box, seed, t, o).map((a, k) => {
      const p = a.pose;
      p.ry = Math.atan2((o.face || [0, -8])[0] - p.x, (o.face || [0, -8])[1] - p.z) + (hash(k, seed + 4) - 0.5) * 0.4;
      if (o.mode === 'cheer') {
        const s = Math.abs(S(PI * (b + k * 0.13)));
        p.shR = [2.7, 0, 0.35 + 0.3 * s];
        p.shL = [2.7, 0, 0.35 + 0.3 * s];
        p.elR = [0.2, 0, 0];
        p.elL = [0.2, 0, 0];
        p.lift = 0.12 * s;
      }
      return a;
    });
  }

  const concertView = (eye, at, fov, extra) => view(eye, at, fov, Object.assign({ concert: true }, extra));
  const concertLights = (t) => {
    const b = beatAt(t);
    return [
      { pos: [0, 4.5, -5.6], color: BEAT_COLS[Math.floor(b) % 4].map(v => v * 1.5) },
      { pos: [0, 3, 3], color: [0.4, 0.35, 0.55] }
    ];
  };

  Object.assign(WORLDS, {
    reveal(t, u) {
      const cast = concertTrio(t, 'aim').concat(audience(28, [-9, 9, -3.6, 7], 61, t, { avoid: [-1.2, 1.2, 4, 12] }));
      const k = smooth(u);
      return concertView([lerp(0.6, 0, k), lerp(3.4, 3.0, k), lerp(10, 8.6, k)], [0, 2.4, -7.5], 46, { cast, points: concertLights(t) });
    },
    cheer(t) {
      const cast = audience(32, [-9, 9, -3.6, 8], 67, t, { mode: 'cheer', face: [0, -8] });
      return concertView([0.3 * S(t), 3.0, -6.6], [0, 1.2, 4], 58, { cast, points: concertLights(t), fx: { white: strobe(t) } });
    },
    beams(t) {
      const cast = concertTrio(t, 'fire').concat(audience(20, [-9, 9, -3.6, 6], 61, t, { mode: 'cheer', avoid: [-1.6, 1.6, 3, 12] }));
      const on = t > 151.75;
      const meet = smooth(span(t, 151.75, 152.4));
      const bolts = on ? ['amanda', 'makoto', 'talleah'].map((id, i) => ({ from: id, to: BEAM_MEET, col: [[1, 0.4, 0.75], [1, 0.15, 0.25], [0.35, 0.55, 1]][i], grow: meet })) : [];
      return concertView([0, 2.0, 5.8], [0, 4.0, -7.2], 52, {
        cast, bolts, points: concertLights(t),
        orbs: on ? [{ pos: BEAM_MEET, k: meet * (1 + 0.15 * S(t * 30)) }] : null,
        fx: { white: smooth(span(t, 153.0, 153.26)) * 0.8 }
      });
    },
    fireworks(t) {
      const cast = audience(30, [-9, 9, -4, 5], 71, t, { mode: 'cheer', face: [0, -8] });
      const bursts = [[153.26, BEAM_MEET, [1, 0.4, 0.75]], [153.5, [-3, 6.4, -6], [1, 0.15, 0.25]], [153.75, [3, 6.2, -6.4], [0.35, 0.55, 1]], [154.2, [0, 7, -5], [1, 0.9, 0.5]], [154.5, [-4.5, 6.6, -4], [0.35, 0.55, 1]], [154.75, [4.2, 6.8, -4.2], [1, 0.4, 0.75]]];
      return concertView([0, 1.6, 6.2], [0, 5.0, -5.5], 60, {
        cast, points: concertLights(t),
        fireworks: bursts.filter(([t0]) => t >= t0).map(([t0, pos, col]) => ({ age: t - t0, pos, col })),
        confetti: smooth(span(t, 153.3, 153.8)),
        fx: { white: Math.max(0, 0.6 - (t - 153.26) * 3) }
      });
    },
    walk(t, u) {
      const z = lerp(-4.2, 2.4, smooth(u));
      const v = voiceAt(t);
      const girls = [['amanda', 'amandaPink', -1.0, 0.18], ['makoto', 'makotoCat', 0, 0], ['talleah', 'talleahSuit', 1.0, -0.18]].map(([id, f, x, ry], i) => {
        const p = walking(pose(x, z + (i === 1 ? -0.35 : 0), ry), t + i * 0.3, 1);
        p.hair = 0.45 + 0.15 * S(t * 3 + i);
        p.face = v > 0.45 ? 'sing' : ['shy', 'sly', 'happy'][i];
        return actor(id, f, p);
      });
      holding(girls[0], 'scepter');
      const part = smooth(span(t, 155.1, 156.4));
      const crowdA = audience(26, [-9, 9, -3, 9], 79, t, { mode: 'cheer', face: [0, z], avoid: [-1.4 - 1.6 * part, 1.4 + 1.6 * part, -12, 12] });
      return concertView([0.2, 1.55, 5.4], [0, 1.45, lerp(-3, 1.2, smooth(u))], 50, { cast: girls.concat(crowdA), points: concertLights(t), confetti: 1 });
    },
    reach(t) {
      const k = smooth(span(t, 158.85, 159.35));
      const girls = [['amanda', 'amandaPink', -0.55, 0.35], ['makoto', 'makotoCat', 0, 0], ['talleah', 'talleahSuit', 0.55, -0.35]].map(([id, f, x, ry], i) => {
        const p = pose(x, 3.15 - (i === 1 ? 0.15 : 0), ry);
        arm(p, 'R', 'reachR', k);
        p.shR = [p.shR[0] + 0.15 * k, p.shR[1], p.shR[2]];
        p.face = ['shy', 'wink', 'grin'][i];
        p.hair = 0.2 * S(t * 2 + i);
        return actor(id, f, p);
      });
      const crowdA = audience(14, [-9, 9, -4, 2], 83, t, { mode: 'cheer', face: [0, 3] });
      return concertView([0, 1.5, 4.25], [0, 1.4, 2.6], 60, { cast: girls.concat(crowdA), points: concertLights(t), confetti: 1 });
    },
    crane(t, u) {
      const k = smooth(u);
      const cast = concertTrio(t, 'aim').concat(audience(32, [-9.5, 9.5, -3.8, 9], 89, t, { mode: 'cheer' }));
      return concertView([0, lerp(3.2, 11, k), lerp(9, 13, k)], [0, lerp(1.6, 0.6, k), lerp(-3, -2, k)], 56, { cast, points: concertLights(t), confetti: 1 });
    }
  });

  const SWATCH = {
    amanda: [[0.95, 0.96, 0.99], [0.19, 0.25, 0.35], [0.51, 0.63, 0.76], [0.89, 0.39, 0.59], [0.77, 0.53, 0.24]],
    makoto: [[0.95, 0.96, 0.96], [0.72, 0.21, 0.25], [0.45, 0.26, 0.24], [0.43, 0.09, 0.23], [0.98, 0.16, 0.58]],
    talleah: [[0.74, 0.84, 0.95], [0.88, 0.92, 0.98], [0.09, 0.21, 0.36], [0.4, 0.57, 0.77], [0.89, 0.9, 0.98]]
  };
  const sheetView = (eye, at, fov, extra) => view(eye, at, fov, Object.assign({ sheet: true }, extra));

  Object.assign(WORLDS, {
    amandaSheet(t, u) {
      const wk = span(t, 44.95, 45.95);
      const p = pose(0, 0, lerp(-0.45, 0.55, smooth(u)));
      p.face = t < 45.45 ? 'scowl' : t < 45.95 ? 'pathos' : 'shy';
      if (t < 45.45) crossArms(p, 1);
      else {
        arm(p, 'R', 'cheekR', smooth(span(t, 46.0, 46.3)));
        p.shL = [0.25, 0, 0.2];
      }
      p.hair = 0.3 * smooth(span(t, 45.45, 46.2)) * (1 - smooth(span(t, 46.4, 47.2)));
      const a = actor('amanda', t < 45.45 ? 'amandaCasual' : 'amandaPink', p);
      if (t >= 45.45) holding(a, 'scepter');
      return sheetView([0, 1.0, 3.9], [0, 0.92, 0], 38, {
        cast: [a],
        scanRing: wk > 0 && wk < 1 ? { actor: 'amanda', k: 1 - wk, col: [1, 0.4, 0.75] } : null,
        moths: t > 45.6 ? { center: [0, 1.0, 0], k: 0, hearts: smooth(span(t, 45.6, 46.2)) * 0.6, cocoon: 0, burst: 0 } : null,
        swatches: SWATCH.amanda
      });
    },
    makotoSheet(t, u) {
      const cat = t >= 48.49;
      const p = pose(0, 0, cat ? 0 : -0.25);
      if (!cat) {
        arm(p, 'R', t < 48.1 ? 'glassesR' : 'snapR', t < 48.1 ? pulseAt(t, 47.6, 48.05) : smooth(span(t, 48.1, 48.4)));
        p.face = 'smug';
      } else {
        aiming(p, 'R');
        p.shR = [1.45, 0.05, 0.12];
        p.face = t > 49.9 ? 'wink' : 'sly';
        p.hair = 0.25 * (1 - smooth(span(t, 48.5, 49.3)));
      }
      const a = actor('makoto', cat ? 'makotoCat' : 'makotoSchool', p);
      if (cat) holding(a, 'pistol');
      const k = smooth(span(t, 48.6, 51.2));
      return sheetView([lerp(0.1, 0.25, k), lerp(1.0, 1.3, k), lerp(3.9, 2.4, k)], [0, lerp(0.92, 1.2, k), 0], 38, {
        cast: [a], swatches: SWATCH.makoto,
        fx: { flashCol: [1, 0.12, 0.2, flashIn(t, 48.49, 0.35) * 0.9] }
      });
    },
    talleahSheet(t, u) {
      const p = pose(0, 0, 0);
      p.face = t < 52.6 ? 'calm' : 'happy';
      p.hair = 0.08 * S(t * 2);
      const b = beatAt(t);
      const g = [[-1.1, 113], [1.1, 115]].map(([x, at], i) => {
        const a = gyn(i + 1, x, -0.3, 0);
        a.hidden = b < at;
        return a;
      });
      const k = smooth(u);
      const pop = Math.max(flashIn(t, beat(113), 0.3), flashIn(t, beat(115), 0.3));
      return sheetView([0, lerp(1.61, 1.0, k), lerp(0.62, 4.6, k)], [0, lerp(1.6, 0.95, k), 0], 40, {
        cast: [actor('talleah', 'talleahSuit', p)].concat(g),
        swatches: SWATCH.talleah,
        sparkle: pop > 0 ? { pos: [b < 115 ? -1.1 : 1.1, 1.0, -0.3], k: pop, col: [0.4, 0.7, 1] } : null
      });
    },
    panels(t) {
      const forms = [['amanda', 'amandaPink', 'amandaCasual', -6], ['makoto', 'makotoCat', 'makotoSchool', 0], ['talleah', 'talleahSuit', 'talleahSuit', 6]];
      const cast = forms.map(([id, f1, f2, x], i) => {
        const flipped = t >= 57.95 + i * 0.12 + 0.18;
        const p = pose(x, 0, 0.15 * S(t + i));
        p.face = ['shy', 'smug', 'happy'][i];
        if (!flipped) {
          if (i === 0) arm(p, 'R', 'wandUpR', 1);
          else aiming(p, 'R');
        }
        breathe(p, t, i);
        const a = actor(id, flipped ? f2 : f1, p);
        if (!flipped) holding(a, ['scepter', 'pistol', 'blaster'][i]);
        return a;
      });
      const panels = forms.map(([id, , , x], i) => {
        const ph = span(t, 57.95 + i * 0.12, 58.31 + i * 0.12);
        const k = Math.abs(C(PI * ph));
        const w = 156 * Math.max(0.02, k), cx = 88 + i * 168;
        return { id, rect: { x: Math.round(cx - w / 2), y: 52, w: Math.max(2, Math.round(w)), h: 300 }, cam: [[x, 1.0, 3.7], [x, 0.9, 0], 34] };
      });
      return sheetView([0, 1.1, 5.2], [0, 0.95, 0], 42, { cast, panels, pageBg: [0.94, 0.93, 0.97], swatchRow: forms.map(([id]) => SWATCH[id]) });
    }
  });


  function cam(eye, at, fov, up) {
    return { eye, at, fov, up: up || [0, 1, 0], near: 0.05, far: 160 };
  }

  function solveActor(a) {
    const m = Figure.prototype.solve.call(SOLVERS[a.form], a.pose);
    a.m = m;
    a.head = M4.point(m.head, [0, 0, 0]);
    a.hips = M4.point(m.hips, [0, 0, 0]);
    return a;
  }

  function worldFor(t, shot) {
    const u = span(t, shot.start, shot.end);
    const w = WORLDS[shot.cam](t, u, shot);
    const cast = w.cast;
    cast.forEach(solveActor);
    const camera = cam(w.eye, w.at, w.fov, w.up);
    if (w.grade) camera.grade = w.grade;
    if (w.film) camera.fx = Object.assign({ time: t }, w.film);
    return Object.assign({}, w, { scene: shot.scene, cast, camera, light: w.light || {}, fx: w.fx || {}, panels: w.panels || null, props: w.props || {} });
  }

  function stage(t, shot) {
    const sh = shot || shotAt(t);
    const st = worldFor(t, sh);
    const focus = {};
    st.cast.forEach(a => { focus[a.id] = { head: a.head, hips: a.hips }; });
    return Object.assign(st, { focus, shot: sh, beat: beatAt(t) });
  }

  function tiles(b, x0, z0, x1, z1, n, colA, colB) {
    const dx = (x1 - x0) / n, dz = (z1 - z0) / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const xa = x0 + i * dx, za = z0 + j * dz;
        b.quad([xa, 0, za + dz], [xa + dx, 0, za + dz], [xa + dx, 0, za], [xa, 0, za], (i + j) % 2 ? colA : colB);
      }
    }
  }

  function room(b, w, h, d, floor, wall, ceil) {
    tiles(b, -w / 2, -d / 2, w / 2, d / 2, 6, floor, shade(floor, 0.92));
    b.at(0, h, 0, (c) => c.box(w, 0.02, d, ceil));
    b.at(0, h / 2, -d / 2, (c) => c.box(w, h, 0.02, wall));
    b.at(0, h / 2, d / 2, (c) => c.box(w, h, 0.02, shade(wall, 0.9)));
    b.at(-w / 2, h / 2, 0, (c) => c.box(0.02, h, d, shade(wall, 0.85)));
    b.at(w / 2, h / 2, 0, (c) => c.box(0.02, h, d, shade(wall, 0.95)));
  }

  const BUILD = {
    void(b) {
      tiles(b, -15, -15, 15, 15, 10, 0x15121c, 0x18141f);
    },
    bus(b) {
      const W = 1.27, L0 = -6.1, L1 = 7.2, H = 2.15;
      tiles(b, -W, L0, W, L1, 8, 0x3a3e46, 0x40444c);
      b.at(0, 0.004, 0, (c) => c.box(0.5, 0.004, L1 - L0, 0x2a2c32));
      b.at(0, H, 0.55, (c) => c.box(W * 2, 0.03, L1 - L0, 0xe6e2d6));
      [-0.5, 0.5].forEach(x => b.at(x, H - 0.02, 0.55, (c) => c.box(0.16, 0.02, L1 - L0 - 1, [1, 0.98, 0.9, 0.9])));
      b.at(0, H / 2, L0, (c) => c.box(W * 2, H, 0.04, 0xd8d0bc));
      b.at(0, 1.45, L0 + 0.03, (c) => c.box(1.6, 0.5, 0.02, [0.62, 0.78, 0.92, 0.75]));
      b.at(0, 0.55, L1, (c) => c.box(W * 2, 1.1, 0.04, 0xd8d0bc));
      b.at(0, 1.6, L1 + 0.02, (c) => c.box(W * 2, 1.0, 0.02, [0.7, 0.84, 0.96, 0.85]));
      [-1, 1].forEach(s => {
        const x = s * W;
        b.at(x, 0.5, 0.55, (c) => c.box(0.04, 1.0, L1 - L0, 0xd8d0bc));
        b.at(x, 1.92, 0.55, (c) => c.box(0.04, 0.46, L1 - L0, 0xd8d0bc));
        for (let z = L0 + 0.5; z < L1; z += 1.1) b.at(x, 1.33, z, (c) => c.box(0.05, 0.66, 0.12, 0xb8b2a0));
        b.at(x - s * 0.02, 1.0, 0.55, (c) => c.box(0.03, 0.04, L1 - L0, 0x8a8678));
      });
      const seat = (x, z, w) => {
        b.at(x, 0, z, (c) => {
          c.at(0, 0.2, 0, (d) => d.box(w, 0.4, 0.42, 0x2a3a3a, { base: false }));
          c.at(0, 0.42, 0, (d) => d.box(w, 0.08, 0.44, 0x356a66));
          c.at(0, 0.64, -0.2, (d) => d.box(w, 0.46, 0.1, 0x356a66));
          c.at(0, 0.87, -0.2, (d) => d.prism(10, w / 2, 0.05, 0, w / 2 * 0.98, 0.05, 0.03, 0x3f7a74));
          c.at(0, 0.64, -0.26, (d) => d.box(w * 0.98, 0.44, 0.02, 0x2c5a56));
        });
      };
      for (let z = -4.3; z < 6.5; z += 1.05) [-0.72, 0.72].forEach(x => seat(x, z, 0.95));
      seat(0, -5.6, 2.45);
      b.at(-0.5, 0.04, 6.6, (c) => c.box(0.8, 0.08, 0.6, 0x1a1a1a));
      b.at(-0.6, 0.9, 6.4, (c) => c.prism(14, 0.22, 0.22, -0.02, 0.22, 0.22, 0.02, 0x1a1a1a));
    },
    expo(b) {
      tiles(b, -60, -30, 60, 50, 20, 0x686a6e, 0x6e7074);
      b.at(0, 0.006, 8, (c) => c.box(120, 0.004, 7, 0x404246));
      for (let x = -58; x < 60; x += 4) b.at(x, 0.012, 8, (c) => c.box(2, 0.004, 0.12, 0xf0e8a0));
      [[-40, -4], [-40, 14], [10, 14], [-20, 22], [20, 24]].forEach(([x0, z0]) => {
        for (let i = 0; i < 12; i++) b.at(x0 + i * 2.6, 0.012, z0, (c) => c.box(0.1, 0.004, 4.6, 0xe8e8e0));
      });
      tiles(b, 8, -16, 26, -1, 6, 0x4f8a34, 0x58943c);
      tiles(b, -3, -18, 3, 4, 4, 0xb8b0a0, 0xc0b8a8);
      b.at(0, 4.5, -20.5, (c) => c.box(40, 9, 1, 0xd8c8a8));
      b.at(0, 0, -17.5, (c) => {
        c.at(0, 3.2, 0, (d) => d.box(8, 0.3, 5, 0xb0a490));
        [-3.6, 3.6].forEach(x => c.at(x, 1.6, 2.2, (d) => d.prism(10, 0.18, 0.18, -1.6, 0.18, 0.18, 1.6, 0xd8d0c0)));
        c.at(0, 1.4, -2.48, (d) => d.box(4, 2.8, 0.04, [0.3, 0.42, 0.55, 0.3]));
      });
      [-3.2, 3.2].forEach(x => b.at(x, 2.3, 1.2, (c) => c.box(0.5, 4.6, 0.5, 0x8a8a90)));
      b.at(0, 4.85, 1.2, (c) => c.box(7.0, 0.5, 0.5, 0x8a8a90));
      [-4.6, 4.6].forEach((x, i) => b.at(x, 0, 0.2, (c) => {
        c.box(1.2, 0.5, 2.2, 0xa8a49a, { base: true });
        c.push(M4.rotY(i ? -PI / 2 : PI / 2));
        c.at(0, 0.5, -0.4, (d) => d.box(0.8, 0.6, 1.4, 0xb8b4aa, { base: true }));
        c.at(0, 1.25, 0.25, (d) => d.ellipsoid(0.5, 0.48, 0.42, 10, 6, 0xb0aca2));
        c.at(0, 1.25, 0.55, (d) => d.ellipsoid(0.28, 0.26, 0.26, 8, 5, 0xc0bcb2));
        c.at(0, 1.18, 0.78, (d) => d.box(0.18, 0.12, 0.08, 0xa09c92));
        [-0.18, 0.18].forEach(z => c.at(z, 0.55, 0.45, (d) => d.box(0.18, 0.5, 0.2, 0xb8b4aa, { base: true })));
        c.pop();
      }));
      b.at(-11, 0, -8, (c) => {
        [[0, 1.2, 0, 2.2], [-1.6, 0.8, 0.5, 1.5], [1.7, 0.9, 0.4, 1.6], [0.2, 2.6, -0.4, 1.4], [-0.8, 2.0, 0, 1.2]].forEach(([x, y, z, rr]) => c.at(x, y, z, (d) => d.ellipsoid(rr, rr * 0.8, rr * 0.9, 8, 5, 0x7a7068, { flat: true })));
        c.at(0, 0.15, 2.4, (d) => d.prism(16, 3.2, 1.6, -0.15, 3.2, 1.6, 0.15, 0x8a8478));
        c.at(0, 0.31, 2.4, (d) => d.prism(16, 3.0, 1.45, 0, 3.0, 1.45, 0.01, [0.3, 0.6, 0.8, 0.4]));
      });
      const palm = (x, z, h, seed) => b.at(x, 0, z, (c) => {
        for (let i = 0; i < 6; i++) c.at(0.04 * S(i + seed), (i * h) / 6, 0, (d) => d.prism(7, 0.17 - i * 0.012, 0.17 - i * 0.012, 0, 0.15 - i * 0.012, 0.15 - i * 0.012, h / 6, i % 2 ? 0x8a6a48 : 0x7a5a3a));
        for (let k = 0; k < 7; k++) {
          c.push(M4.translate(0, h, 0), M4.rotY((k / 7) * PI * 2 + seed), M4.rotX(0.5 + (k % 2) * 0.3));
          c.quad([-0.22, 0, 0], [0.22, 0, 0], [0.05, 0, 1.8], [-0.05, 0, 1.8], k % 2 ? 0x3a8a3a : 0x2f7a32, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
          c.pop();
        }
      });
      [[-14, 3], [-18, -2], [8, 3], [14, 3], [20, 3], [-20, 3], [-26, 13], [-14, 13], [-2, 13], [10, 13], [22, 13], [-6, -12], [6, -12], [10, -3], [24, -6]].forEach(([x, z], i) => palm(x, z, 5 + (i % 3), i));
      b.at(14, 0, -8, (c) => {
        c.at(0, 0.42, 0, (d) => d.box(1.9, 0.06, 0.45, 0x8a5a32));
        c.at(0, 0.75, -0.2, (d) => d.box(1.9, 0.4, 0.05, 0x8a5a32));
        [-0.85, 0.85].forEach(x => c.at(x, 0.21, 0, (d) => d.box(0.08, 0.42, 0.4, 0x2a2a2a)));
      });
      [[18, -12], [21, -4], [10, -14]].forEach(([x, z], i) => b.at(x, 0, z, (c) => {
        c.prism(7, 0.16, 0.16, 0, 0.13, 0.13, 2.2, 0x6a4a30);
        c.at(0, 3.0, 0, (d) => d.ellipsoid(1.4, 1.3, 1.4, 9, 6, i % 2 ? 0x3a7a30 : 0x2f6a2a));
      }));
    },
    room(b) {
      const W = 3, D = 2.5, H = 2.6, WALL = 0xd8c8a0;
      tiles(b, -W, -D, W, D, 6, 0x8a6a4a, 0x82623f);
      b.at(0, H, 0, (c) => c.box(W * 2, 0.02, D * 2, 0xeee6d6));
      b.at(0, H / 2, -D, (c) => c.box(W * 2, H, 0.02, WALL));
      b.at(-W, H / 2, 0, (c) => c.box(0.02, H, D * 2, shade(WALL, 0.9)));
      b.at(W, H / 2, 0, (c) => c.box(0.02, H, D * 2, shade(WALL, 0.95)));
      b.at(-0.76, H / 2, D, (c) => c.box(4.48, H, 0.02, shade(WALL, 0.92)));
      b.at(2.76, H / 2, D, (c) => c.box(0.48, H, 0.02, shade(WALL, 0.92)));
      b.at(2.0, 2.35, D, (c) => c.box(1.05, 0.5, 0.02, shade(WALL, 0.92)));
      [1.48, 2.52].forEach(x => b.at(x, 1.05, D - 0.02, (c) => c.box(0.06, 2.1, 0.06, 0xf0ece0)));
      b.at(2.0, 2.12, D - 0.02, (c) => c.box(1.1, 0.06, 0.06, 0xf0ece0));
      b.at(0, 0.05, -D + 0.01, (c) => c.box(W * 2, 0.1, 0.02, 0x6a4a2a));
      [-1.2, 1.2].forEach(x => b.at(x, 0, -1.45, (c) => {
        c.at(0, 0.2, 0, (d) => d.box(1.4, 0.4, 2.0, 0x5a3a24, { base: false }));
        c.at(0, 0.47, 0.05, (d) => d.box(1.36, 0.16, 1.9, 0xf2eee6));
        c.at(0, 0.57, 0.3, (d) => d.box(1.42, 0.06, 1.45, 0x8a2a3a));
        c.at(0, 0.6, 0.3, (d) => d.box(1.38, 0.02, 0.2, 0xc8a050));
        c.at(0, 0.6, -0.78, (d) => d.box(0.9, 0.14, 0.32, 0xfafaf4));
        c.at(0, 0.75, -0.97, (d) => d.box(1.4, 0.7, 0.08, 0x5a3a24));
      }));
      b.at(0, 0, -2.2, (c) => {
        c.at(0, 0.3, 0, (d) => d.box(0.5, 0.6, 0.45, 0x5a3a24));
        c.at(0, 0.62, 0, (d) => d.prism(10, 0.08, 0.08, 0, 0.05, 0.05, 0.3, 0xc8b890));
        c.at(0, 0.98, 0, (d) => d.prism(10, 0.16, 0.16, -0.05, 0.1, 0.1, 0.12, [1, 0.92, 0.75, 0.6]));
      });
      b.at(2.72, 0, 0.2, (c) => {
        c.at(0, 0.4, 0, (d) => d.box(0.5, 0.8, 1.5, 0x5a3a24));
        c.at(-0.18, 0.4, 0, (d) => d.box(0.02, 0.3, 1.3, 0x6a4a30));
        c.at(0.02, 1.15, 0, (d) => d.box(0.12, 0.6, 0.85, 0x1a1a1e));
        c.at(0.1, 0.83, 0, (d) => d.box(0.2, 0.06, 0.3, 0x2a2a2e));
      });
      b.at(-W + 0.02, 1.45, -0.2, (c) => {
        c.box(0.03, 1.3, 1.6, 0xe8e4dc);
        c.at(0.02, 0, 0, (d) => d.box(0.02, 1.2, 1.5, [0.55, 0.62, 0.7, 0.4]));
      });
      [-1, 1].forEach(sz => b.at(-W + 0.08, 1.4, -0.2 + sz * 1.0, (c) => c.box(0.06, 1.9, 0.5, 0x7a2a2a)));
      b.at(-W + 0.06, 2.4, -0.2, (c) => c.box(0.04, 0.06, 2.6, 0x3a2a1a));
      b.at(0, H - 0.05, 0.3, (c) => c.prism(14, 0.3, 0.3, -0.06, 0.25, 0.25, 0, [1, 0.97, 0.88, 0.85]));
      b.at(-2.2, 0, 1.6, (c) => {
        c.at(0, 0.38, 0, (d) => d.box(0.9, 0.76, 0.6, 0x5a3a24));
        c.at(0, 0.45, 0.45, (d) => d.box(0.45, 0.06, 0.45, 0x3a2a1a));
      });
      tiles(b, -6, 2.5, 8, 4.6, 4, 0x8a2030, 0x7a1a28);
      b.at(1.0, 2.6, 3.55, (c) => c.box(14, 0.02, 2.1, 0xeee6d6));
      b.at(1.0, 1.3, 4.6, (c) => c.box(14, 2.6, 0.02, 0xd8cdb4));
      [-2.5, 5.5].forEach(x => b.at(x, 1.05, 4.58, (c) => c.box(0.95, 2.1, 0.03, 0x6a4a2a)));
      [-6, 8].forEach(x => b.at(x, 1.3, 3.55, (c) => c.box(0.02, 2.6, 2.1, 0xd0c4aa)));
      b.at(7.95, 1.1, 3.55, (c) => c.box(0.03, 2.2, 1.4, 0xa8acb4));
    },
    hall(b) {
      const W = 6, L = 20, H = 3.4, WALL = 0xb8bcc8;
      b.at(0, H, 0, (c) => c.box(W * 2, 0.02, L * 2, 0xd8dce4));
      for (let z = -L + 2; z < L; z += 4) for (let x = -4.5; x <= 4.5; x += 3) {
        if (Math.abs(x + 0) < 0.1 && Math.abs(z + 6) < 0.1) continue;
        b.at(x, H - 0.012, z, (c) => c.box(1.2, 0.01, 1.2, [1, 1, 0.96, 0.92]));
      }
      for (let z = -L; z <= L; z += 2) b.at(0, H - 0.008, z, (c) => c.box(W * 2, 0.012, 0.04, 0xa8acb6));
      const wall = (s, z0, z1) => {
        const zc = (z0 + z1) / 2, len = z1 - z0;
        b.at(s * W, H / 2, zc, (c) => c.box(0.04, H, len, shade(WALL, s < 0 ? 0.88 : 0.96)));
        b.at(s * (W - 0.03), 0.45, zc, (c) => c.box(0.03, 0.9, len, 0x5a6478));
        b.at(s * (W - 0.035), 0.92, zc, (c) => c.box(0.03, 0.05, len, 0xd0d4dc));
      };
      wall(-1, -L, L);
      wall(1, -L, -14.5);
      wall(1, -13.5, L);
      b.at(W, 2.75, -14, (c) => c.box(0.04, 1.3, 1.0, shade(WALL, 0.96)));
      b.at(W - 0.02, 1.05, -14, (c) => c.box(0.02, 2.24, 1.14, 0xe8e4dc));
      b.at(W + 0.6, 1.05, -14, (c) => c.box(1.2, 2.1, 1.0, [1, 0.94, 0.8, 0.9]));
      b.at(-3.6, H / 2, -L, (c) => c.box(4.8, H, 0.04, WALL));
      b.at(3.6, H / 2, -L, (c) => c.box(4.8, H, 0.04, WALL));
      b.at(0, 3.0, -L, (c) => c.box(2.4, 0.8, 0.04, WALL));
      b.at(0, 1.3, -L - 0.6, (c) => c.box(2.4, 2.6, 0.04, [1, 0.96, 0.98, 1]));
      [-1, 1].forEach(s => b.at(s * 1.25, 1.3, -L + 0.03, (c) => c.box(0.1, 2.7, 0.06, 0xe8e4dc)));
      b.at(0, 2.65, -L + 0.03, (c) => c.box(2.6, 0.1, 0.06, 0xe8e4dc));
      b.at(0, H / 2, L, (c) => c.box(W * 2, H, 0.04, shade(WALL, 0.9)));
      [-16, -8, 0, 8, 16].forEach(z => [-1, 1].forEach(s => {
        b.at(s * (W - 0.02), 1.08, z, (c) => c.box(0.02, 2.24, 1.14, 0xe8e4dc));
        b.at(s * (W - 0.045), 1.05, z, (c) => c.box(0.04, 2.1, 0.96, 0x7a5a42));
        b.at(s * (W - 0.075), 1.0, z + 0.36, (c) => c.box(0.04, 0.04, 0.14, 0xc8a040));
      }));
      [-10, 0, 10].forEach(z => [-3.4, 3.4].forEach(x => {
        b.at(x, H / 2, z, (c) => c.box(0.5, H, 0.5, 0xc8ccd4));
        b.at(x, 0.08, z, (c) => c.box(0.56, 0.16, 0.56, 0x5a6478));
      }));
      b.at(-3.6, 0, 2.2, (c) => {
        c.box(0.9, 1.0, 3.6, 0x3a4458, { base: true });
        c.at(0, 1.02, 0, (d) => d.box(1.0, 0.04, 3.7, 0xe0e0e8));
        c.at(0.46, 0.55, 0, (d) => d.box(0.02, 0.5, 3.4, 0xc02040));
        [-1.2, 0, 1.2].forEach(z => c.at(-0.1, 1.2, z, (d) => d.box(0.3, 0.3, 0.04, 0x2a2a30)));
      });
      [[-2.2, 0.0], [-2.2, 4.4]].forEach(([x, z]) => b.at(x, 0, z, (c) => {
        c.prism(8, 0.03, 0.03, 0, 0.03, 0.03, 0.95, 0xc8ccd4);
        c.prism(8, 0.12, 0.12, 0, 0.12, 0.12, 0.03, 0x3a3a40);
      }));
      b.at(-2.2, 0.85, 2.2, (c) => c.box(0.03, 0.04, 4.4, 0xc02040));
    },
    stage(b) {
      const W = 14, H = 10;
      tiles(b, -W, -12, W, 12, 8, 0x16141c, 0x1a1820);
      b.at(0, H, 0, (c) => c.box(W * 2, 0.04, 24, 0x0c0a10));
      [-1, 1].forEach(s => b.at(s * W, H / 2, 0, (c) => c.box(0.04, H, 24, 0x120e18)));
      b.at(0, H / 2, -12, (c) => c.box(W * 2, H, 0.04, 0x0e0c14));
      b.at(0, H / 2, 12, (c) => c.box(W * 2, H, 0.04, 0x120e18));
      b.at(0, 0, -8.6, (c) => {
        c.box(13, STAGE_Y, 5.2, 0x22222c, { base: true });
        c.at(0, STAGE_Y + 0.01, 0, (d) => d.box(13, 0.02, 5.2, 0x2e2e3a));
        c.at(0, STAGE_Y, 2.6, (d) => d.box(13, 0.06, 0.06, [1, 0.4, 0.8, 1]));
        [-2.4, 2.4].forEach(x => c.at(x, 0.15, 2.85, (d) => d.box(1.2, 0.3, 0.6, 0x1a1a22)));
      });
      b.at(0, 5.0, -11.0, (c) => c.box(12.4, 6.4, 0.2, 0x08080c));
      [[-6.8, -10.4], [6.8, -10.4], [-6.8, -6.2], [6.8, -6.2]].forEach(([x, z]) => b.at(x, 0, z, (c) => {
        for (let k = 0; k < 4; k++) c.at(k < 2 ? -0.15 : 0.15, 4, k % 2 ? -0.15 : 0.15, (d) => d.box(0.05, 8, 0.05, 0x8a8a92));
        for (let y = 0.5; y < 8; y += 0.6) c.at(0, y, 0, (d) => d.box(0.3, 0.03, 0.3, 0x6a6a72));
      }));
      [-10.4, -6.2].forEach(z => b.at(0, 8, z, (c) => c.box(13.9, 0.3, 0.3, 0x7a7a82)));
      [-1, 1].forEach(s => b.at(s * 8.2, 0, -7.8, (c) => {
        c.box(1.4, 3.4, 1.2, 0x121216, { base: true });
        [0.7, 1.7, 2.7].forEach(y => c.at(0, y, 0.61, (d) => {
          d.push(M4.rotX(PI / 2));
          d.prism(14, 0.42, 0.42, -0.01, 0.3, 0.3, 0.04, 0x26262e);
          d.pop();
        }));
      }));
      b.at(0, 0.55, -5.4, (c) => c.box(13, 1.1, 0.08, 0x3a3a44));
    },
    sheet(b) {
      tiles(b, -8, -8, 8, 8, 8, 0xf4f2f8, 0xeeeaf4);
      b.at(0, 4, -3, (c) => c.box(16, 8, 0.05, 0xf6f4fa));
      b.at(0, 0.004, 0, (c) => c.disc(0.8, 24, 0xe8d8ec));
    },
    memory(b) {
      tiles(b, -9, -9, 9, 7, 9, 0x8a5a3a, 0x7e5236);
      b.at(0, 2.6, -8, (c) => c.box(18, 5.2, 0.1, 0x6a5a48));
      [-9, 9].forEach(x => b.at(x, 2.6, -1, (c) => c.box(0.1, 5.2, 16, 0x5e5040)));
      b.at(0, 5.2, -1, (c) => c.box(18, 0.04, 16, 0x3a3028));
      [-5.5, -1.8, 1.8, 5.5].forEach((x, i) => b.at(x, 0, -6.6, (c) => {
        c.at(0, 1.2, 0, (d) => d.box(3.2, 2.4, 0.08, [0xc8a050, 0x5a8aa0, 0xb05040, 0x6a9a5a][i]));
        c.at(0, 2.5, 0.05, (d) => d.box(3.3, 0.3, 0.12, 0xe8dcc0));
        c.at(0, 0.4, 0.7, (d) => d.box(2.6, 0.8, 0.6, 0xd8d0c0));
        c.at(0, 0.82, 0.7, (d) => d.box(2.7, 0.04, 0.7, 0xf0e8d8));
      }));
      for (let k = 0; k < 24; k++) {
        const x = -8.6 + k * 0.75;
        const y = 4.1 - 0.35 * S((k / 23) * PI);
        b.at(x, y, -3, (c) => c.prism(3, 0.18, 0.02, -0.32, 0.01, 0.01, 0, [0xd04030, 0xe0b030, 0x3a7ac0, 0x4a9a4a][k % 4], { phase: PI }));
      }
      b.at(0, 4.1, -3, (c) => c.box(18, 0.015, 0.015, 0x2a2018));
      b.at(-3.4, 0, -3.8, (c) => {
        c.prism(12, 0.38, 0.38, 0, 0.38, 0.38, 2.6, 0xe0dcd8);
        c.at(0, 2.6, 0, (d) => d.prism(12, 0.38, 0.38, 0, 0.01, 0.01, 0.9, 0xc03030));
        [0, 1, 2].forEach(i => {
          c.push(M4.rotY((i / 3) * PI * 2));
          c.at(0, 0.35, 0.38, (d) => d.box(0.04, 0.7, 0.5, 0xc03030));
          c.pop();
        });
        c.at(0, 1.8, 0.37, (d) => d.ellipsoid(0.16, 0.16, 0.04, 10, 5, [0.6, 0.85, 1, 0.5]));
      });
      b.at(3.6, 3.5, -3.8, (c) => {
        c.ellipsoid(0.6, 0.6, 0.6, 14, 9, 0x6a9ad8);
        c.push(M4.rotZ(0.35));
        c.prism(20, 1.05, 1.05, -0.01, 1.05, 1.05, 0.01, 0xe8c070, { capBottom: true });
        c.pop();
        c.at(0, 0.9, 0, (d) => d.box(0.01, 1.2, 0.01, 0x2a2018));
      });
      const V = 60;
      b.at(V, 0, 0, (c) => {
        c.prism(28, 7, 7, -0.1, 7, 7, 0, 0x2a2238);
        c.prism(28, 1.7, 1.7, 0, 1.6, 1.6, 0.12, 0x6a5a88);
        c.prism(8, 0.34, 0.34, 0.12, 0.26, 0.26, 0.95, 0xd8d0f0);
        c.at(0, 0.95, 0, (d) => d.prism(8, 0.4, 0.4, 0, 0.4, 0.4, 0.06, 0xc8a0f0));
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * PI * 2 + 0.2;
          c.at(Math.cos(a) * 4.6, 0, Math.sin(a) * 4.6, (d) => {
            d.prism(8, 0.24, 0.24, 0, 0.2, 0.2, 3.4, 0xc8bce0);
            d.at(0, 3.4, 0, (e) => e.prism(8, 0.34, 0.34, 0, 0.34, 0.34, 0.2, 0xe0d4f4));
            d.at(0, 3.62, 0, (e) => e.ellipsoid(0.12, 0.12, 0.12, 6, 4, [0.8, 0.6, 1, 1]));
          });
        }
        c.ellipsoid(34, 34, 34, 22, 12, 0x2a1050, {
          colorAt: (p) => {
            const h = clamp(p[1] / 34, -0.1, 1);
            const k = Math.pow(clamp(h * 1.6, 0, 1), 0.7);
            return [lerp(0.86, 0.16, k), lerp(0.46, 0.06, k), lerp(0.78, 0.36, k), 1];
          }
        });
        for (let k = 0; k < 48; k++) {
          const a = k * 2.399, h = 0.25 + frac(k * 0.618) * 0.7;
          const rr = 32 * Math.sqrt(1 - h * h);
          c.at(Math.cos(a) * rr, h * 32, Math.sin(a) * rr, (d) => d.box(0.18, 0.18, 0.18, [1, 0.95, 1, 1]));
        }
        c.at(-12, 15, -24, (d) => d.ellipsoid(2.6, 2.6, 2.6, 12, 8, [0.95, 0.85, 1, 1]));
        c.at(11, 19, -25, (d) => d.ellipsoid(1.3, 1.3, 1.3, 10, 6, [1, 0.8, 0.9, 1]));
      });
    },
    disco(b) {
      const W = 8, H = 5;
      b.at(0, H, 0, (c) => c.box(W * 2, 0.04, W * 2, 0x0e0814));
      [-1, 1].forEach(s => b.at(s * W, H / 2, 0, (c) => c.box(0.04, H, W * 2, 0x140c1c)));
      b.at(0, H / 2, -W, (c) => c.box(W * 2, H, 0.04, 0x140c1c));
      b.at(0, H / 2, W, (c) => c.box(W * 2, H, 0.04, 0x120a18));
      tiles(b, -W, -W, W, W, 8, 0x0e0a14, 0x120c18);
      b.at(0, 0, -7.0, (c) => {
        c.box(3.2, 1.1, 1.0, 0x1a1a22, { base: true });
        c.at(0, 1.12, 0, (d) => d.box(3.3, 0.05, 1.1, 0x2a2a34));
        [-0.7, 0.7].forEach(x => c.at(x, 1.17, 0.1, (d) => d.prism(14, 0.22, 0.22, 0, 0.22, 0.22, 0.03, 0x3a3a44)));
        [-2.4, 2.4].forEach(x => c.at(x, 0, 0.1, (d) => {
          d.box(0.9, 2.0, 0.7, 0x16161c, { base: true });
          [0.55, 1.45].forEach(y => d.at(0, y, 0.36, (e) => {
            e.push(M4.rotX(PI / 2));
            e.prism(14, 0.28, 0.28, -0.01, 0.2, 0.2, 0.03, 0x2a2a30);
            e.pop();
          }));
        }));
      });
      [-5, 5].forEach(x => b.at(x, 4.6, 0, (c) => c.box(0.15, 0.15, 16, 0x5a5a62)));
      [-6, 6].forEach(z => b.at(0, 4.6, z, (c) => c.box(10, 0.15, 0.15, 0x5a5a62)));
      b.at(0, 4.4, 0, (c) => c.box(0.02, 0.6, 0.02, 0x8a8a90));
    },
    ship(b) {
      const W = 8, H = 6, Z0 = -12, Z1 = 12, WALL = 0xe8eef8, LINE = [0.45, 0.8, 1, 1];
      for (let i = 0; i < 8; i++) for (let j = 0; j < 12; j++) {
        b.quad([-W + i * 2, 0, Z0 + (j + 1) * 2], [-W + (i + 1) * 2, 0, Z0 + (j + 1) * 2], [-W + (i + 1) * 2, 0, Z0 + j * 2], [-W + i * 2, 0, Z0 + j * 2], (i + j) % 2 ? 0xd4dce8 : 0xdce4ee);
      }
      for (let i = 0; i <= 8; i++) b.at(-W + i * 2, 0.004, 0, (c) => c.box(0.03, 0.006, Z1 - Z0, [0.4, 0.75, 1, 0.8]));
      b.at(0, H, 0, (c) => c.box(W * 2, 0.04, Z1 - Z0, 0xf0f4fa));
      [-4, 0, 4].forEach(x => b.at(x, H - 0.03, 0, (c) => c.box(0.5, 0.03, Z1 - Z0 - 2, [0.9, 0.96, 1, 1])));
      [-1, 1].forEach(s => {
        b.at(s * W, H / 2, 0, (c) => c.box(0.04, H, Z1 - Z0, shade(WALL, s < 0 ? 0.92 : 0.97)));
        [1.2, 3.4].forEach(y => b.at(s * (W - 0.03), y, 0, (c) => c.box(0.02, 0.05, Z1 - Z0, LINE)));
        for (let z = Z0 + 3; z < Z1; z += 4) b.at(s * (W - 0.15), H / 2, z, (c) => c.box(0.3, H, 0.4, 0xd0d8e8));
      });
      b.at(0, H / 2, Z1, (c) => c.box(W * 2, H, 0.04, 0xdde4f0));
      const hc = [0, 1.6], hr = 1.45;
      const angs = [];
      for (let i = 0; i < 32; i++) angs.push((i / 32) * PI * 2);
      [[W, H], [-W, H], [-W, 0], [W, 0]].forEach(([x, y]) => angs.push((Math.atan2(y - hc[1], x - hc[0]) + PI * 2) % (PI * 2)));
      angs.sort((a, c) => a - c);
      const edge = (a) => {
        const dx = Math.cos(a), dy = Math.sin(a);
        const tx = dx > 0 ? (W - hc[0]) / dx : dx < 0 ? (-W - hc[0]) / dx : 1e9;
        const ty = dy > 0 ? (H - hc[1]) / dy : dy < 0 ? (0 - hc[1]) / dy : 1e9;
        const k = Math.min(tx, ty);
        return [hc[0] + dx * k, hc[1] + dy * k];
      };
      for (let i = 0; i < angs.length; i++) {
        const a0 = angs[i], a1 = angs[(i + 1) % angs.length] + (i === angs.length - 1 ? PI * 2 : 0);
        const p0 = [hc[0] + Math.cos(a0) * hr, hc[1] + Math.sin(a0) * hr], p1 = [hc[0] + Math.cos(a1) * hr, hc[1] + Math.sin(a1) * hr];
        const o0 = edge(a0), o1 = edge(a1);
        b.quad([p0[0], p0[1], Z0], [o0[0], o0[1], Z0], [o1[0], o1[1], Z0], [p1[0], p1[1], Z0], 0xd8e0ee, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }
      b.at(hc[0], hc[1], Z0 + 0.02, (c) => {
        c.push(M4.rotX(PI / 2));
        c.prism(28, hr + 0.18, hr + 0.18, -0.05, hr + 0.18, hr + 0.18, 0.05, 0xb8c4dc, { capTop: false });
        c.prism(28, hr + 0.04, hr + 0.04, -0.06, hr + 0.04, hr + 0.04, 0.06, LINE, { capTop: false });
        c.pop();
      });
      b.at(-3.2, 0, 4.5, (c) => {
        c.at(0, 1.2, 0, (d) => d.ellipsoid(1.2, 0.8, 3.0, 14, 8, 0xf0f2f8));
        c.at(0, 1.55, 1.4, (d) => d.ellipsoid(0.62, 0.42, 0.9, 10, 6, [0.12, 0.2, 0.4, 0.3]));
        [-1, 1].forEach(s => c.at(s * 1.6, 1.0, -0.6, (d) => d.box(1.8, 0.1, 1.6, 0xd8e0ee)));
        c.at(0, 1.25, -2.9, (d) => d.prism(10, 0.5, 0.5, -0.2, 0.4, 0.4, 0.2, [0.4, 0.75, 1, 1]));
        c.at(0, 1.2, 0, (d) => d.box(2.42, 0.08, 4.2, 0x3a6ad0));
        [-0.8, 0.8].forEach(x => [-1.6, 1.6].forEach(z => c.at(x, 0.2, z, (d) => d.prism(6, 0.06, 0.06, 0, 0.06, 0.06, 0.5, 0x8a90a0))));
      });
      [[5.2, 6.5], [6.1, 6.5], [5.65, 6.5, 1], [5.2, 8.2], [6.1, 8.2]].forEach(([x, z, up]) => b.at(x, up ? 0.62 : 0.31, z, (c) => {
        c.box(0.8, 0.6, 0.8, 0xe8ecf6);
        c.at(0, 0, 0.402, (d) => d.box(0.6, 0.04, 0.004, LINE));
      }));
      [-2, 1, 4, 7].forEach(z => b.at(-W + 0.45, 0, z, (c) => {
        c.box(0.6, 1.0, 1.2, 0xc8d0e0, { base: true });
        c.at(0.1, 1.35, 0, (d) => d.box(0.06, 0.6, 1.0, [0.25, 0.55, 0.9, 0.9]));
      }));
      const M0 = -20, MW = 4, MH = 3.6;
      b.at(0, 0.002, (Z0 + M0) / 2, (c) => c.box(MW * 2, 0.004, Z0 - M0, 0xc8d4e4));
      b.at(0, MH, (Z0 + M0) / 2, (c) => c.box(MW * 2, 0.04, Z0 - M0, 0xe8eef8));
      b.at(0, MH / 2, M0, (c) => c.box(MW * 2, MH, 0.04, 0xdde6f2));
      [-1, 1].forEach(s => {
        b.at(s * MW, MH / 2, (Z0 + M0) / 2, (c) => c.box(0.04, MH, Z0 - M0, 0xe0e8f4));
        b.at(s * (MW - 0.03), 1.0, (Z0 + M0) / 2, (c) => c.box(0.02, 0.04, Z0 - M0, LINE));
        [-14.2, -17.0, -19.0].forEach(z => b.at(s * (MW - 0.35), 0, z, (c) => {
          c.box(0.6, 1.0, 1.0, 0xc8d0e0, { base: true });
          c.at(-s * 0.05, 1.3, 0, (d) => d.box(0.05, 0.55, 0.85, [0.3, 0.8, 0.6, 0.9]));
        }));
      });
      b.at(0, 0, -16.5, (c) => {
        c.prism(20, 0.9, 0.9, 0, 0.85, 0.85, 0.3, 0x5a6478);
        c.prism(20, 0.78, 0.78, 0.3, 0.78, 0.78, 0.36, [0.4, 0.9, 0.6, 1]);
        c.at(0, 2.9, 0, (d) => {
          d.prism(20, 0.85, 0.85, 0, 0.9, 0.9, 0.3, 0x5a6478);
          d.prism(20, 0.78, 0.78, -0.04, 0.78, 0.78, 0, [0.4, 0.9, 0.6, 1]);
        });
        [-0.45, 0.45].forEach(x => c.at(x, 3.2, 0, (d) => d.prism(8, 0.08, 0.08, 0, 0.08, 0.08, 0.4, 0x8a94a8)));
      });
    }
  };

  const BUS_BODY = (b) => {
    const Y = 0xf2b81a, K = 0x1a1a1a, G = [0.16, 0.22, 0.3, 0.25];
    b.at(0.6, 1.75, 0, (c) => c.box(9.6, 2.3, 2.5, Y));
    b.at(-4.85, 1.05, 0, (c) => c.box(1.3, 1.1, 2.3, Y));
    b.at(-5.55, 0.65, 0, (c) => c.box(0.12, 0.3, 2.45, K));
    b.at(5.45, 0.75, 0, (c) => c.box(0.1, 0.3, 2.45, K));
    b.at(0.6, 2.93, 0, (c) => c.box(9.5, 0.06, 2.35, 0xf6f2e2));
    b.at(-4.21, 2.3, 0, (c) => c.box(0.03, 0.75, 2.2, G));
    [-1, 1].forEach(z => {
      for (let i = 0; i < 8; i++) if (!(z < 0 && i === 0)) b.at(-3.3 + i * 1.08, 2.28, z * 1.26, (c) => c.box(0.92, 0.66, 0.03, G));
      [1.25, 1.62].forEach(y => b.at(0.6, y, z * 1.265, (c) => c.box(9.6, 0.07, 0.02, K)));
      [-3.3, 3.4].forEach(x => b.at(x, 0.5, z * 1.12, (c) => {
        c.push(M4.rotX(PI / 2));
        c.prism(12, 0.5, 0.5, -0.17, 0.5, 0.5, 0.17, K, { capBottom: true });
        c.prism(8, 0.22, 0.22, -0.18, 0.22, 0.22, 0.18, 0x8a8e96, { capBottom: true });
        c.pop();
      }));
    });
    [-0.8, 0.8].forEach(z => b.at(-5.52, 1.05, z, (c) => c.box(0.04, 0.16, 0.24, [1, 0.95, 0.8, 1])));
    [-1, 1].forEach(z => b.at(-4.15, 2.95, z * 0.9, (c) => c.box(0.12, 0.1, 0.2, [1, 0.5, 0.2, 1])));
  };
  const BUS_DOOR = (b) => {
    [0, 1].forEach(i => b.at(i * 0.42 - 0.21, 0, 0, (c) => {
      c.box(0.4, 1.85, 0.03, 0xe0b018);
      c.at(0, 0.28, 0.018, (d) => d.box(0.32, 0.9, 0.004, [0.16, 0.22, 0.3, 0.25]));
    }));
  };

  const SCENE_ENV = {
    void: { sunColor: [0.9, 0.88, 0.85], ambTop: [0.12, 0.1, 0.16], ambBottom: [0.04, 0.03, 0.06], fog: [0, 0, 0] },
    bus: { sunColor: [1.0, 0.92, 0.8], ambTop: [0.4, 0.38, 0.36], ambBottom: [0.2, 0.18, 0.16], fog: [0.8, 0.85, 0.9] },
    expo: { sunColor: [1.05, 1.0, 0.92], ambTop: [0.46, 0.5, 0.6], ambBottom: [0.24, 0.24, 0.22], fog: [0.62, 0.78, 0.96], far: 170 },
    room: { sunColor: [1.0, 0.94, 0.84], ambTop: [0.38, 0.34, 0.3], ambBottom: [0.18, 0.15, 0.12], fog: [0.2, 0.18, 0.15] },
    hall: { sunColor: [0.95, 0.97, 1.0], ambTop: [0.4, 0.42, 0.48], ambBottom: [0.18, 0.18, 0.22], fog: [0.6, 0.62, 0.7] },
    stage: { sunColor: [0.8, 0.7, 0.95], ambTop: [0.14, 0.1, 0.2], ambBottom: [0.05, 0.03, 0.08], fog: [0.03, 0.02, 0.06] },
    sheet: { sunColor: [0.85, 0.85, 0.88], ambTop: [0.55, 0.55, 0.6], ambBottom: [0.4, 0.38, 0.45], fog: [0.95, 0.94, 0.97] },
    memory: { sunColor: [1.0, 0.85, 0.65], ambTop: [0.38, 0.3, 0.22], ambBottom: [0.16, 0.12, 0.08], fog: [0.3, 0.24, 0.16] },
    disco: { sunColor: [0.75, 0.4, 0.9], ambTop: [0.12, 0.06, 0.16], ambBottom: [0.04, 0.02, 0.06], fog: [0.04, 0.01, 0.06] },
    ship: { sunColor: [0.85, 0.9, 0.98], ambTop: [0.36, 0.4, 0.48], ambBottom: [0.18, 0.2, 0.26], fog: [0.85, 0.9, 0.98] }
  };

  const FW = 512;
  const FH = 384;
  const OVER_ENV = { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0, 0, 0], fogNear: 1000, fogFar: 2000, points: [] };
  const ORTHO = new Float32Array([2 / FW, 0, 0, 0, 0, 2 / FH, 0, 0, 0, 0, -1, 0, -1, -1, 0, 1]);

  function texGlow(ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, '#8a8a8a');
    g.addColorStop(0.85, '#202020');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function create(r) {
    const X = Cast.makeCast(r);
    const T = { glow: r.texture(128, texGlow, { clamp: true }) };
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    const Q = {
      unit: mk(b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      floor: mk(b => b.quad([-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 0, -0.5], [-0.5, 0, -0.5], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]])),
      cone: mk(b => b.prism(18, 1, 1, 0, 0.06, 0.06, 1, [0.05, 0.05, 0.05, 1], { topColor: [0.9, 0.9, 0.9, 1], capTop: false })),
      eye: mk(b => b.ellipsoid(0.022, 0.012, 0.004, 8, 4, [1, 1, 1, 1])),
      eyeHalo: mk(b => b.ellipsoid(0.05, 0.03, 0.004, 10, 4, [0.35, 0.35, 0.35, 1])),
      mote: mk(b => b.box(0.012, 0.012, 0.012, [1, 1, 1, 1]))
    };
    const sets = {};
    const setFor = (id) => {
      if (!sets[id]) {
        const b = new Builder();
        BUILD[id](b);
        sets[id] = r.mesh(b);
      }
      return sets[id];
    };
    const busMesh = mk(BUS_BODY);
    const doorMesh = mk(BUS_DOOR);
    const tex = (w, h, fn) => r.texture(w, fn, { height: h });
    T.banner = tex(512, 64, (ctx, w, h) => {
      ctx.fillStyle = '#c81e3c';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffd640';
      ctx.fillRect(0, 0, w, 5);
      ctx.fillRect(0, h - 5, w, 5);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CON-TON \u00d7 CAPE CITY', w / 2, h / 2 + 2);
    });
    T.facade = tex(256, 128, (ctx, w, h) => {
      ctx.fillStyle = '#d8c8a8';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < 3; y++) for (let x = 0; x < 6; x++) {
        ctx.fillStyle = '#3a5a7a';
        ctx.fillRect(x * 42 + 8, y * 42 + 8, 28, 26);
        ctx.fillStyle = '#8ab0d0';
        ctx.fillRect(x * 42 + 10, y * 42 + 10, 10, 8);
      }
    });
    T.water = tex(64, 128, (ctx, w, h) => {
      ctx.fillStyle = '#5a9ac8';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = i % 2 ? '#d8f0ff' : '#8ac8f0';
        ctx.fillRect((i * 13) % w, (i * 29) % h, 2 + (i % 3), 18 + (i % 5) * 6);
      }
    });
    const texQuad = (x0, y0, z0, x1, y1, z1, us, vs, n) => mk(b => b.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], [1, 1, 1, 0], [[0, 0], [us, 0], [us, vs], [0, vs]], [n, n, n, n]));
    const X2 = {
      bannerF: texQuad(-3.0, 3.75, 1.47, 3.0, 4.55, 1.47, 1, 1, [0, 0, 1]),
      bannerB: texQuad(3.0, 3.75, 0.93, -3.0, 4.55, 0.93, 1, 1, [0, 0, -1]),
      facade: texQuad(-20, 0, -19.98, 20, 9, -19.98, 8, 2, [0, 0, 1]),
      water: mk(b => b.quad([-11.8, 0.32, -6.2], [-10.2, 0.32, -6.2], [-10.4, 3.1, -8.2], [-11.6, 3.1, -8.2], [1, 1, 1, 0.5], [[0, 0], [1, 0], [1, 2], [0, 2]], [[0, 0.5, 1], [0, 0.5, 1], [0, 0.5, 1], [0, 0.5, 1]])),
      backpack: mk(b => {
        b.box(0.32, 0.4, 0.18, 0x3a4a6a);
        b.at(0, -0.06, 0.1, (c) => c.box(0.24, 0.18, 0.05, 0x2e3c58));
        b.at(0, 0.1, 0.095, (c) => c.box(0.26, 0.02, 0.02, [0.95, 0.5, 0.75, 0.5]));
      }),
      pole: mk(b => {
        b.prism(6, 0.08, 0.08, 0, 0.06, 0.06, 6, 0x6a6c70);
        b.at(0, 6, -0.6, (c) => c.box(0.2, 0.12, 1.2, 0x5a5c60));
      }),
      palm: mk(b => {
        b.prism(6, 0.16, 0.16, 0, 0.12, 0.12, 5.5, 0x7a5a3a);
        b.at(0, 5.6, 0, (c) => c.ellipsoid(1.5, 0.5, 1.5, 8, 4, 0x2f7a32));
      }),
      car: mk(b => {
        b.at(0, 0.45, 0, (c) => c.box(1.7, 0.6, 4.0, 0x8a2a2a));
        b.at(0, 0.95, -0.2, (c) => c.box(1.5, 0.5, 2.0, [0.3, 0.38, 0.45, 0.2]));
      }),
      outside: mk(b => {
        tiles(b, 1.3, -40, 30, 40, 4, 0x707276, 0x76787c);
        tiles(b, -30, -40, -1.3, 40, 4, 0x707276, 0x76787c);
      }),
      cloud: mk(b => b.quad([-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]])),
      spark: mk(b => b.ellipsoid(0.04, 0.04, 0.04, 6, 4, [1, 1, 1, 1]))
    };
    const CARS = [0x8a2a2a, 0x2a4a8a, 0xd0d0d0, 0x2a6a3a];

    T.gorilla = r.texture(128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h * 0.45, 5, w / 2, h * 0.5, w * 0.6);
      g.addColorStop(0, '#a89a6a');
      g.addColorStop(1, '#5a5a38');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3a3430';
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.86, w * 0.48, h * 0.28, 0, 0, PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.44, w * 0.32, h * 0.3, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a7a68';
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.5, w * 0.21, h * 0.2, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a201c';
      ctx.fillRect(w * 0.27, h * 0.33, w * 0.46, h * 0.06);
      [0.4, 0.6].forEach(x => { ctx.beginPath(); ctx.ellipse(w * x, h * 0.42, 9, 7, 0, 0, PI * 2); ctx.fill(); });
      ctx.fillStyle = '#1a1210';
      [0.46, 0.54].forEach(x => { ctx.beginPath(); ctx.ellipse(w * x, h * 0.55, 4, 3, 0, 0, PI * 2); ctx.fill(); });
      ctx.strokeStyle = '#1a1210';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.4, h * 0.64);
      ctx.quadraticCurveTo(w / 2, h * 0.67, w * 0.6, h * 0.64);
      ctx.stroke();
    }, { height: 160, clamp: true });
    T.plate = r.texture(64, (ctx, w, h) => {
      ctx.fillStyle = '#c8a040';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2a1a0a';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('302', w / 2, h / 2 + 1);
    }, { height: 32 });
    T.title = r.texture(512, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ffffff';
      [['COSPLAY', '#f0489a', 28], ['CONVENTION', '#d02040', 64], ['CRISIS', '#3a7ae0', 102]].forEach(([txt, col, y]) => {
        ctx.font = 'bold 38px Georgia, serif';
        ctx.strokeText(txt, w / 2, y);
        ctx.fillStyle = col;
        ctx.fillText(txt, w / 2, y);
      });
    }, { height: 128 });
    T.mirror = r.frameTexture(false);
    T.photo = r.frameTexture(false);
    let photoReady = false;
    const RX = {
      frame: mk(b => {
        b.box(0.78, 0.96, 0.05, 0x8a6a2a);
        b.at(0, 0, 0.026, (c) => c.box(0.7, 0.88, 0.01, 0x6a4a1a));
      }),
      painting: texQuad(-0.31, -0.39, 0.032, 0.31, 0.39, 0.032, 1, 1, [0, 0, 1]),
      eyeWhite: mk(b => b.ellipsoid(0.03, 0.022, 0.006, 10, 4, [0.92, 0.9, 0.84, 0.3])),
      pupil: mk(b => b.ellipsoid(0.013, 0.013, 0.004, 8, 4, [0.08, 0.05, 0.03, 0])),
      lid: mk(b => b.ellipsoid(0.032, 0.024, 0.006, 10, 4, 0x3a3428)),
      door: mk(b => {
        b.at(-0.47, 1.04, 0, (c) => c.box(0.94, 2.08, 0.05, 0x7a5434));
        b.at(-0.85, 1.0, 0.04, (c) => c.box(0.04, 0.12, 0.04, 0xc8a040));
        b.at(-0.85, 1.0, -0.04, (c) => c.box(0.04, 0.12, 0.04, 0xc8a040));
      }),
      plate: texQuad(-0.11, -0.055, 0, 0.11, 0.055, 0, 1, 1, [0, 0, 1]),
      tv: mk(b => b.quad([2.675, 0.88, 0.4], [2.675, 0.88, -0.4], [2.675, 1.42, -0.4], [2.675, 1.42, 0.4], [1, 1, 1, 0.6], [[1, 0], [0, 0], [0, 1], [1, 1]], [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]])),
      cape: mk(b => b.quad([0.55, 0.62, -0.6], [1.75, 0.62, -0.6], [1.6, 0.625, -1.5], [0.7, 0.625, -1.5], 0x5a2a7a, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]])),
      windowGlow: mk(b => b.quad([-2.955, 0.85, 0.6], [-2.955, 0.85, -1.0], [-2.955, 2.05, -1.0], [-2.955, 2.05, 0.6], [1, 1, 1, 1], null, [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]])),
      polaroid: mk(b => b.box(0.24, 0.006, 0.28, 0xf6f4ee)),
      photo: mk(b => b.quad([-0.105, 0.004, 0.105], [0.105, 0.004, 0.105], [0.105, 0.004, -0.085], [-0.105, 0.004, -0.085], [1, 1, 1, 0.5], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]))
    };
    const WINDOW_TINT = { morning: [1.0, 0.85, 0.6], day: [0.9, 0.95, 1.0], evening: [0.9, 0.45, 0.35], night: [0.08, 0.12, 0.3] };

    function drawRoom(st, t) {
      const R = st.room || {};
      const mood = R.mood || 'day';
      r.draw(RX.windowGlow, null, { additive: true, alpha: mood === 'night' ? 0.5 : 0.35, tint: WINDOW_TINT[mood], noFog: true });
      const G = M4.translate(GORILLA[0], GORILLA[1], GORILLA[2]);
      r.draw(RX.frame, G, {});
      r.draw(RX.painting, G, { texture: T.gorilla });
      const target = R.gorillaLook === 'photo' ? [0.95, 0.6, -1.05] : st.camera.eye;
      [-1, 1].forEach(sx => {
        const ep = [GORILLA[0] + sx * 0.06, GORILLA[1] + 0.045, GORILLA[2] + 0.04];
        const d = V3.norm(V3.sub(target, ep));
        const E = M4.translate(ep[0], ep[1], ep[2]);
        r.draw(RX.eyeWhite, E, {});
        if (R.gorillaBlink) r.draw(RX.lid, M4.mul(E, M4.translate(0, 0, 0.003)), {});
        else r.draw(RX.pupil, M4.mul(E, M4.translate(clamp(d[0], -0.8, 0.8) * 0.014, clamp(d[1], -0.8, 0.8) * 0.009, 0.004)), {});
        if (R.gorillaGlint > 0.01) r.draw(X2.spark, M4.mul(E, M4.chain(M4.translate(0.008, 0.008, 0.01), M4.scale(0.25 * R.gorillaGlint))), { additive: true, tint: [1, 1, 0.9], noFog: true });
      });
      const D0 = M4.chain(M4.translate(DOOR_HINGE[0], 0, DOOR_HINGE[1]), M4.rotY(-(R.door || 0)));
      r.draw(RX.door, D0, {});
      r.draw(RX.plate, M4.mul(D0, M4.translate(-0.47, 1.62, 0.03)), { texture: T.plate });
      r.draw(RX.tv, null, st.mirror ? { texture: T.mirror, tint: [0.45, 0.48, 0.55] } : { tint: [0.06, 0.06, 0.08] });
      if (!R.helmetTaken || R.costumes) {
        r.draw(RX.cape, null, {});
        if (!R.helmetTaken) r.draw(X.prop('helmetProp'), M4.chain(M4.translate(HELMET_BED[0], HELMET_BED[1], HELMET_BED[2]), M4.rotY(0.4)), {});
        r.draw(X.prop('shield'), M4.chain(M4.translate(SHIELD_BED[0], SHIELD_BED[1], SHIELD_BED[2]), M4.rotX(-PI / 2), M4.scale(0.9)), {});
      }
      if (R.polaroid) {
        const P0 = M4.chain(M4.translate(0.95, 0.6, -1.05), M4.rotY(0.35));
        r.draw(RX.polaroid, P0, {});
        r.draw(RX.photo, P0, { texture: T.photo });
      }
    }

    T.carpet = r.texture(128, (ctx, w, h) => {
      ctx.fillStyle = '#26345a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2e3e68';
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) ctx.fillRect(x * 32, y * 32, 32, 32);
      ctx.strokeStyle = '#c89a3a';
      ctx.lineWidth = 3;
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
        const cx = x * 64 + 32, cy = y * 64 + 32;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 18);
        ctx.lineTo(cx + 18, cy);
        ctx.lineTo(cx, cy + 18);
        ctx.lineTo(cx - 18, cy);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = '#a8283c';
        ctx.fillRect(cx - 4, cy - 4, 8, 8);
      }
    });
    T.posters = r.texture(512, (ctx, w, h) => {
      const P = 128;
      let g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#f8a040');
      g.addColorStop(1, '#c03050');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, P, h);
      ctx.fillStyle = '#ffe080';
      ctx.beginPath();
      ctx.arc(64, 112, 34, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a1028';
      ctx.fillRect(0, 140, P, 36);
      ctx.beginPath();
      ctx.moveTo(52, 140);
      ctx.lineTo(36, 82);
      ctx.lineTo(64, 70);
      ctx.lineTo(92, 82);
      ctx.lineTo(76, 140);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(64, 58, 12, 0, PI * 2);
      ctx.fill();
      ctx.fillRect(70, 26, 9, 34);
      ctx.fillStyle = '#1a3a7a';
      ctx.fillRect(P, 0, P, h);
      ctx.fillStyle = '#c8ccd8';
      ctx.fillRect(P + 24, 40, 80, 70);
      ctx.fillStyle = '#ff3040';
      ctx.fillRect(P + 36, 62, 22, 12);
      ctx.fillRect(P + 70, 62, 22, 12);
      ctx.fillStyle = '#8a8e9a';
      ctx.fillRect(P + 44, 92, 40, 8);
      ctx.fillRect(P + 60, 20, 8, 20);
      ctx.fillRect(P + 20, 116, 88, 44);
      g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#ffc8e0');
      g.addColorStop(1, '#f06aa0');
      ctx.fillStyle = g;
      ctx.fillRect(P * 2, 0, P, h);
      ctx.fillStyle = '#ffffff';
      [[30, 66], [98, 66]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.ellipse(P * 2 + x, y, 26, 12, x < 64 ? -0.4 : 0.4, 0, PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#e8204a';
      ctx.beginPath();
      ctx.moveTo(P * 2 + 64, 120);
      ctx.bezierCurveTo(P * 2 + 20, 90, P * 2 + 34, 50, P * 2 + 64, 72);
      ctx.bezierCurveTo(P * 2 + 94, 50, P * 2 + 108, 90, P * 2 + 64, 120);
      ctx.fill();
      ctx.fillStyle = '#fff6a0';
      [[22, 30], [110, 140], [100, 24], [26, 150]].forEach(([x, y]) => ctx.fillRect(P * 2 + x, y, 5, 5));
      ctx.fillStyle = '#0a0a1e';
      ctx.fillRect(P * 3, 0, P, h);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 30; i++) ctx.fillRect(P * 3 + (i * 37) % P, (i * 53) % h, 2, 2);
      ctx.fillStyle = '#d0703a';
      ctx.beginPath();
      ctx.arc(P * 3 + 84, 120, 30, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f0c080';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(P * 3 + 84, 120, 48, 10, -0.3, 0, PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#d8dce8';
      ctx.beginPath();
      ctx.moveTo(P * 3 + 40, 30);
      ctx.lineTo(P * 3 + 56, 80);
      ctx.lineTo(P * 3 + 24, 80);
      ctx.fill();
      ctx.fillStyle = '#ff8a30';
      ctx.fillRect(P * 3 + 32, 80, 16, 14);
    }, { height: 176, clamp: true });
    T.villain = r.texture(128, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#4a1a5a';
      ctx.beginPath();
      ctx.moveTo(30, 60);
      ctx.lineTo(98, 60);
      ctx.lineTo(120, 248);
      ctx.lineTo(8, 248);
      ctx.fill();
      ctx.fillStyle = '#2a2a34';
      ctx.fillRect(42, 64, 44, 110);
      ctx.fillRect(44, 172, 16, 76);
      ctx.fillRect(68, 172, 16, 76);
      ctx.fillStyle = '#5a5a6a';
      ctx.fillRect(36, 96, 56, 22);
      ctx.fillStyle = '#3a3a48';
      ctx.beginPath();
      ctx.arc(64, 40, 22, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a8a9a';
      [[-1, 40], [1, 40]].forEach(([s]) => {
        ctx.beginPath();
        ctx.moveTo(64 + s * 14, 26);
        ctx.lineTo(64 + s * 36, 0);
        ctx.lineTo(64 + s * 22, 30);
        ctx.fill();
      });
      ctx.fillStyle = '#ff2030';
      ctx.fillRect(52, 36, 9, 5);
      ctx.fillRect(67, 36, 9, 5);
      ctx.fillStyle = '#d02030';
      ctx.fillRect(56, 50, 16, 3);
    }, { height: 256 });
    T.flame = r.texture(32, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.4, '#80b8ff');
        g.addColorStop(1, '#2040c0');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(4 + i * 9, 0);
        ctx.quadraticCurveTo(w / 2, h * 0.9, 8 + i * 8, h);
        ctx.quadraticCurveTo(w / 2 + 4, h * 0.5, 14 + i * 9, 0);
        ctx.fill();
      }
    }, { height: 64 });
    const wallQuad = (b, x, zc, yc, ww, hh, nx, u0, u1) => {
      const z0 = nx > 0 ? zc + ww / 2 : zc - ww / 2, z1 = nx > 0 ? zc - ww / 2 : zc + ww / 2;
      b.quad([x, yc - hh / 2, z0], [x, yc - hh / 2, z1], [x, yc + hh / 2, z1], [x, yc + hh / 2, z0], [1, 1, 1, 0.15], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]], [[nx, 0, 0], [nx, 0, 0], [nx, 0, 0], [nx, 0, 0]]);
    };
    const heartShape = (b, col) => {
      const pts = [];
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * PI * 2;
        pts.push([(16 * Math.pow(S(a), 3)) / 17, (13 * C(a) - 5 * C(2 * a) - 2 * C(3 * a) - C(4 * a)) / 17 + 0.2]);
      }
      for (let i = 0; i < pts.length; i++) {
        const p0 = pts[i], p1 = pts[(i + 1) % pts.length];
        b.tri([0, 0, 0], [p1[0], p1[1], 0], [p0[0], p0[1], 0], col, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }
    };
    const HX6 = {
      carpet: mk(b => b.quad([-6, 0.003, 20], [6, 0.003, 20], [6, 0.003, -20], [-6, 0.003, -20], [1, 1, 1, 0], [[0, 0], [6, 0], [6, 20], [0, 20]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]])),
      posters: mk(b => {
        [[-12, 0], [-4, 1], [4, 2], [12, 3]].forEach(([z, k]) => wallQuad(b, -5.965, z, 1.75, 0.8, 1.1, 1, k / 4, (k + 1) / 4));
        [[-17.2, 2], [-4, 3], [4, 0], [12, 1]].forEach(([z, k]) => wallQuad(b, 5.965, z, 1.75, 0.8, 1.1, -1, k / 4, (k + 1) / 4));
      }),
      sideDoor: mk(b => {
        b.at(0, 1.04, 0.47, (c) => c.box(0.04, 2.08, 0.94, 0x7a5a42));
        b.at(-0.04, 1.0, 0.8, (c) => c.box(0.05, 0.04, 0.16, 0xc8a040));
        b.at(-0.03, 1.0, 0.86, (c) => c.box(0.03, 0.08, 0.04, 0xc8a040));
      }),
      leaf: mk(b => {
        b.at(0.6, 1.3, 0, (c) => c.box(1.2, 2.6, 0.06, 0x5a3a2a));
        b.at(0.6, 1.75, 0.035, (c) => c.box(0.6, 0.5, 0.01, [0.9, 0.8, 0.6, 0.8]));
        b.at(1.08, 1.1, 0.06, (c) => c.box(0.04, 0.3, 0.04, 0xc8a040));
      }),
      standee: mk(b => {
        b.quad([-0.45, 0.06, 0], [0.45, 0.06, 0], [0.45, 1.96, 0], [-0.45, 1.96, 0], [1, 1, 1, 0.2], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        b.at(0, 0.03, -0.1, (c) => c.box(0.5, 0.06, 0.3, 0x3a2a1a));
        b.at(0, 0.6, -0.12, (c) => c.box(0.05, 1.0, 0.04, 0x8a6a4a));
      }),
      kittenBody: mk(b => {
        const P = 0xff9ac8, L = 0xffd6e8;
        b.at(0, 0.5, 0, (c) => c.ellipsoid(0.55, 0.5, 0.48, 12, 8, P));
        b.at(0, 0.48, 0.38, (c) => c.ellipsoid(0.34, 0.32, 0.12, 10, 6, L));
        [-1, 1].forEach(s => b.at(s * 0.25, 0.09, 0.36, (c) => c.ellipsoid(0.16, 0.1, 0.2, 8, 5, L)));
        [-1, 1].forEach(s => b.at(s * 0.4, 0.55, 0.28, (c) => c.ellipsoid(0.12, 0.22, 0.12, 8, 5, P)));
        for (let i = 0; i < 5; i++) b.at(0.3 + i * 0.07, 0.15 + i * 0.13, -0.42 - i * 0.04, (c) => c.ellipsoid(0.08, 0.08, 0.08, 6, 4, P));
      }),
      kittenHead: mk(b => {
        const P = 0xff9ac8, L = 0xffd6e8;
        b.at(0, 0.32, 0, (c) => c.ellipsoid(0.46, 0.38, 0.4, 12, 8, P));
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.26, 0.6, -0.02), M4.rotZ(-s * 0.35));
          b.prism(3, 0.13, 0.08, 0, 0.01, 0.01, 0.22, P, { phase: PI, capBottom: true });
          b.at(0, 0.02, 0.04, (c) => c.prism(3, 0.08, 0.03, 0, 0.005, 0.005, 0.15, 0xff6aa8, { phase: PI }));
          b.pop();
          b.at(s * 0.15, 0.37, 0.355, (c) => c.ellipsoid(0.06, 0.08, 0.025, 8, 5, 0x1a1218));
          b.at(s * 0.13, 0.4, 0.375, (c) => c.ellipsoid(0.02, 0.025, 0.01, 6, 3, [1, 1, 1, 0.6]));
          [0.2, 0.24].forEach(y => b.at(s * 0.28, y, 0.3, (c) => c.box(0.18, 0.008, 0.008, 0x8a4a6a)));
        });
        b.at(0, 0.21, 0.37, (c) => c.ellipsoid(0.14, 0.09, 0.06, 8, 5, L));
        b.at(0, 0.27, 0.425, (c) => c.ellipsoid(0.045, 0.035, 0.03, 8, 4, 0xff4a8a));
      }),
      heart: mk(b => heartShape(b, [1, 1, 1, 1])),
      sprite: mk(b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      beam: mk(b => b.prism(8, 1, 1, 0, 1, 1, 1, [1, 1, 1, 1], { capBottom: true })),
      ring: mk(b => b.prism(20, 1, 1, -0.5, 1, 1, 0.5, [1, 1, 1, 1], { capTop: false }))
    };

    function billboard(camera, pos, sx, sy) {
      const f = V3.norm(V3.sub(camera.at, camera.eye));
      let rt = V3.cross(f, camera.up || [0, 1, 0]);
      if (V3.len(rt) < 1e-4) rt = [1, 0, 0];
      rt = V3.norm(rt);
      const up = V3.cross(rt, f);
      const sy2 = sy === undefined ? sx : sy;
      return new Float32Array([rt[0] * sx, rt[1] * sx, rt[2] * sx, 0, up[0] * sy2, up[1] * sy2, up[2] * sy2, 0, -f[0], -f[1], -f[2], 0, pos[0], pos[1], pos[2], 1]);
    }

    function beamM(a, b, rad) {
      const d = V3.sub(b, a);
      const len = V3.len(d) || 1e-3;
      const y = V3.mul(d, 1 / len);
      let x = V3.cross(y, [0, 1, 0]);
      if (V3.len(x) < 1e-3) x = V3.cross(y, [1, 0, 0]);
      x = V3.norm(x);
      const z = V3.cross(x, y);
      return new Float32Array([x[0] * rad, x[1] * rad, x[2] * rad, 0, y[0] * len, y[1] * len, y[2] * len, 0, z[0] * rad, z[1] * rad, z[2] * rad, 0, a[0], a[1], a[2], 1]);
    }

    const findA = (st, id) => st.cast.find(x => x.id === id && !x.hidden);
    const muzzle = (a) => M4.point(a.m.foreR, [0, -0.4, 0.02]);
    const chest = (a) => (a.form === 'gynoid' ? M4.point(a.m.torso, [0, 0.27, 0.12]) : M4.point(a.m.torso, [0, 0.25, 0.08]));
    const glowSprite = (st, pos, s, col, alpha) => r.draw(HX6.sprite, billboard(st.camera, pos, s), { texture: T.glow, additive: true, tint: col, alpha: alpha === undefined ? 1 : alpha, noFog: true });

    function drawHall(st, t) {
      r.draw(HX6.carpet, null, { texture: T.carpet });
      r.draw(HX6.posters, null, { texture: T.posters });
      r.draw(HX6.sideDoor, M4.chain(M4.translate(5.955, 0, -14.47), M4.rotY(-(st.sideDoor || 0))), {});
      const md = st.mainDoors || { open: 0, glow: [0.6, 0.5, 0.7] };
      r.draw(HX6.leaf, M4.chain(M4.translate(-1.2, 0, -19.95), M4.rotY(-md.open * 1.4)), {});
      r.draw(HX6.leaf, M4.chain(M4.translate(1.2, 0, -19.95), M4.rotY(md.open * 1.4), M4.scale(-1, 1, 1)), {});
      r.draw(Q.floor, M4.chain(M4.translate(0, 0.006, -19.3), M4.scale(3.4, 1, 1.8)), { texture: T.glow, additive: true, tint: md.glow, noFog: true });
      r.draw(HX6.standee, M4.chain(M4.translate(STANDEE[0], 0, STANDEE[1]), M4.rotX(st.standee || 0)), { texture: T.villain });
      const KB = M4.chain(M4.translate(KITTEN[0], 0, KITTEN[1]), M4.rotY(-PI / 2 - 0.3));
      r.draw(HX6.kittenBody, KB, {});
      const wob = st.kitten || 0;
      r.draw(HX6.kittenHead, M4.chain(KB, M4.translate(0, 0.92, 0), M4.rotZ(0.18 * wob * S(t * 26)), M4.rotX(-0.12 * wob)), {});
      if (st.fire && st.fire.k > 0.01) {
        const F = st.fire;
        r.draw(Q.floor, M4.chain(M4.translate(F.pos[0], F.pos[1] - 0.006, F.pos[2]), M4.scale(1.6 * F.k, 1, 1.6 * F.k)), { texture: T.glow, additive: true, tint: [0.4, 0.65, 1.2], noFog: true });
        for (let i = 0; i < 7; i++) {
          const a = i * 0.9 + 0.3;
          const rr = 0.15 + (i % 3) * 0.16;
          const fl = 0.8 + 0.25 * S(t * 17 + i * 2);
          const pos = [F.pos[0] + Math.cos(a) * rr, F.pos[1] - 0.22 * F.k * fl, F.pos[2] + Math.sin(a) * rr];
          r.draw(HX6.sprite, billboard(st.camera, pos, 0.22 * F.k, -0.46 * F.k * fl), { texture: T.flame, additive: true, tint: [0.6, 0.8, 1], uvScroll: [0, t * 2 + i], noFog: true });
        }
        for (let i = 0; i < 4; i++) {
          const k = frac(t * 0.9 + i * 0.27);
          glowSprite(st, [F.pos[0] + (i - 1.5) * 0.18, F.pos[1] - k * 3.2, F.pos[2] + (i % 2) * 0.2], 0.08, [0.4, 0.6, 1], 1 - k);
        }
      }
    }

    function drawFx(st, t) {
      (st.bolts || []).forEach(bl => {
        const fa = typeof bl.from === 'string' ? findA(st, bl.from) : null;
        const ta = typeof bl.to === 'string' ? findA(st, bl.to) : null;
        const a = fa ? muzzle(fa) : bl.from;
        const b0 = ta ? chest(ta) : bl.to;
        const b = bl.grow === undefined || !a || !b0 ? b0 : V3.add(a, V3.mul(V3.sub(b0, a), bl.grow));
        if (!a || !b || !a.length || !b.length) return;
        r.draw(HX6.beam, beamM(a, b, 0.035), { additive: true, tint: bl.col, noFog: true });
        r.draw(HX6.beam, beamM(a, b, 0.012), { additive: true, tint: [1, 1, 1], noFog: true });
        glowSprite(st, b, 0.45, bl.col);
        glowSprite(st, a, 0.25, bl.col);
      });
      (st.smoke || []).forEach(sm => {
        const a = findA(st, sm.actor);
        if (!a) return;
        const c = chest(a);
        for (let i = 0; i < 7; i++) {
          const age = t - sm.t0 - i * 0.1;
          if (age < 0) continue;
          const pos = [c[0] + S(i * 2.1) * 0.08, c[1] + age * 0.55, c[2] + C(i * 2.1) * 0.08];
          glowSprite(st, pos, 0.12 + age * 0.3, sm.col, Math.exp(-age * 0.9) * 0.8);
        }
      });
      if (st.flashAt) {
        const a = findA(st, st.flashAt.actor);
        if (a) glowSprite(st, M4.point(a.m.foreR, [0.03, -0.3, 0.14]), 0.6 * st.flashAt.k, [1, 1, 1]);
      }
      if (st.moths) {
        const M = st.moths, c = M.center;
        for (let i = 0; i < 56; i++) {
          if (i / 56 > M.k) continue;
          const ph = i * 0.618;
          const life = frac(t * 0.55 + ph);
          const rr = 1.5 * (1 - life) + 0.2;
          const ang = ph * 9 + life * 7 + t * 1.5;
          const pos = [c[0] + Math.cos(ang) * rr, c[1] - 0.7 + frac(i * 0.37) * 1.6 + 0.2 * S(t * 3 + i), c[2] + Math.sin(ang) * rr];
          glowSprite(st, pos, 0.07 + 0.04 * S(t * 9 + i), [1, 0.45, 0.8]);
        }
        for (let i = 0; i < 18; i++) {
          if (i / 18 > M.hearts) continue;
          const ph = i * 0.73;
          const life = frac(t * 0.7 + ph);
          const rr = 1.1 * (1 - life) + 0.3;
          const ang = -ph * 7 - life * 6 - t * 2;
          const pos = [c[0] + Math.cos(ang) * rr, c[1] - 0.5 + frac(i * 0.29) * 1.4, c[2] + Math.sin(ang) * rr];
          r.draw(HX6.heart, billboard(st.camera, pos, 0.09), { additive: true, tint: [1, 0.35, 0.65], noFog: true });
        }
        if (M.cocoon > 0.01) {
          const toCam = V3.norm(V3.sub(st.camera.eye, c));
          const pos = V3.add([c[0], c[1] - 0.05, c[2]], V3.mul(toCam, 0.35));
          const pul = 1 + 0.05 * S(t * 14);
          r.draw(HX6.heart, billboard(st.camera, pos, 1.05 * M.cocoon * pul), { additive: true, tint: [1, 0.4, 0.75].map(v => v * (0.5 + 0.5 * M.cocoon)), noFog: true });
          r.draw(HX6.heart, billboard(st.camera, V3.add(pos, V3.mul(toCam, 0.02)), 0.75 * M.cocoon * pul), { additive: true, tint: [0.9, 0.7, 0.85], noFog: true });
        }
        if (M.burst > 0 && M.burst < 1) {
          for (let i = 0; i < 22; i++) {
            const ang = i * 2.399, el = (frac(i * 0.41) - 0.4) * 1.6;
            const d = M.burst * (2.2 + frac(i * 0.7));
            const pos = [c[0] + Math.cos(ang) * d * C(el), c[1] + 0.1 + S(el) * d, c[2] + Math.sin(ang) * d * C(el)];
            r.draw(HX6.heart, billboard(st.camera, pos, 0.14 * (1 - M.burst)), { additive: true, tint: [1, 0.5, 0.8], noFog: true });
          }
        }
      }
      if (st.scanBeam) {
        const a = findA(st, st.scanBeam.from), b = findA(st, st.scanBeam.to);
        if (a && b) {
          const h = M4.point(a.m.head, [0.05, 0.02, 0.1]);
          r.draw(HX6.beam, beamM(h, chest(b), 0.012), { additive: true, tint: [0.4, 0.7, 1], noFog: true });
        }
      }
      if (st.scanRing) {
        const a = findA(st, st.scanRing.actor);
        if (a) {
          const hp = a.hips;
          const y = lerp(a.head[1] + 0.2, 0.02, st.scanRing.k);
          const M = M4.chain(M4.translate(hp[0], y, hp[2]), M4.scale(0.36, 0.035, 0.36));
          r.draw(HX6.ring, M, { additive: true, tint: st.scanRing.col || [0.35, 0.65, 1.2], noFog: true });
          r.draw(HX6.ring, M4.chain(M4.translate(hp[0], y, hp[2]), M4.scale(0.4, 0.01, 0.4)), { additive: true, tint: [1, 1, 1], noFog: true });
        }
      }
    }

    const baseFigs = {};
    const baseFig = (form) => baseFigs[form] || (baseFigs[form] = new Figure(r, DANCER_LOOKS[+form.slice(6)], DANCER_LOOKS[+form.slice(6)].size));
    const X7 = {
      gem: mk(b => b.ellipsoid(1, 1.5, 1, 4, 2, [0.95, 0.85, 1, 1], { flat: true })),
      ball: mk(b => b.ellipsoid(0.42, 0.42, 0.42, 14, 10, 0xc8c8d0, { flat: true, colorAt: (p) => { const k = frac(S(p[0] * 91 + p[1] * 37 + p[2] * 53) * 437.5); return [0.55 + 0.45 * k, 0.55 + 0.45 * k, 0.6 + 0.4 * k, 0.45]; } }))
    };

    function drawDisco(st, t) {
      const b = beatAt(t);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
        const c = BEAT_COLS[(i + j + Math.floor(b)) % 4];
        const on = (i * 3 + j * 5 + Math.floor(b * 2)) % 3 === 0 ? 1 : 0.25;
        r.draw(Q.floor, M4.chain(M4.translate(-3.0 + i * 1.2, 0.006, -3.6 + j * 1.2), M4.scale(1.12, 1, 1.12)), { tint: c.map(v => v * 0.55 * on) });
      }
      r.draw(X7.ball, M4.chain(M4.translate(0, 3.9, 0), M4.rotY(t * 0.9)), {});
      for (let k = 0; k < 4; k++) {
        const src = [k < 2 ? -5 : 5, 4.5, k % 2 ? -6 : 6];
        const tgt = [2.6 * S(t * (0.7 + k * 0.13) + k * 1.7), 0, -1 + 2.8 * C(t * (0.6 + k * 0.11) + k)];
        r.draw(Q.cone, beamM(tgt, src, 0.7), { additive: true, alpha: 0.2, tint: BEAT_COLS[(k + Math.floor(b)) % 4], noFog: true });
        r.draw(Q.floor, M4.chain(M4.translate(tgt[0], 0.012, tgt[2]), M4.scale(1.5, 1, 1.5)), { texture: T.glow, additive: true, tint: BEAT_COLS[(k + Math.floor(b)) % 4].map(v => v * 0.7), noFog: true });
      }
      for (let k = 0; k < 18; k++) {
        const a = k * 2.399 + t * 0.9;
        const rr = 1.5 + (k % 5) * 1.1;
        r.draw(Q.floor, M4.chain(M4.translate(Math.cos(a) * rr, 0.014, Math.sin(a) * rr), M4.scale(0.22, 1, 0.22)), { texture: T.glow, additive: true, tint: [0.9, 0.9, 1], noFog: true });
      }
    }

    function drawMemoryFx(st, t) {
      if (st.treasure) {
        let pos = null;
        if (st.treasure.at === 'pedestal') pos = [VAULT[0], 1.18, VAULT[2]];
        else {
          const a = findA(st, st.treasure.at);
          if (a) pos = M4.point(a.m.foreL, [0, -0.29, 0.04]);
        }
        if (pos) {
          r.draw(X7.gem, M4.chain(M4.translate(pos[0], pos[1], pos[2]), M4.rotY(t * 2), M4.scale(0.06)), {});
          glowSprite(st, pos, 0.45 + 0.05 * S(t * 7), [0.8, 0.55, 1]);
          glowSprite(st, pos, 0.3, [1, 1, 1]);
        } else if (st.treasure.at === 'pedestal') glowSprite(st, [VAULT[0], 1.1, VAULT[2]], 0.3, [0.4, 0.3, 0.6]);
      }
      if (st.orb) {
        glowSprite(st, st.orb.pos, 0.35, [1, 0.15, 0.25]);
        glowSprite(st, st.orb.pos, 0.12, [1, 0.9, 0.9]);
      }
      if (st.landing) glowSprite(st, [st.landing.pos[0], 0.4, st.landing.pos[2]], 2.2 * st.landing.k, [1, 0.2, 0.3]);
      if (st.portal) {
        const P = st.portal;
        const M = M4.chain(M4.translate(P.pos[0], P.pos[1], P.pos[2]), M4.rotY(P.ry), M4.rotX(PI / 2));
        r.draw(HX6.ring, M4.mul(M, M4.scale(0.95 * P.k, 0.06, 0.95 * P.k)), { additive: true, tint: [1, 0.25, 0.55], noFog: true });
        r.draw(HX6.ring, M4.mul(M, M4.scale(0.88 * P.k, 0.02, 0.88 * P.k)), { additive: true, tint: [1, 0.85, 0.95], noFog: true });
        glowSprite(st, P.pos, 2.0 * P.k, [0.6, 0.1, 0.4]);
        for (let i = 0; i < 16; i++) {
          const a = i * 0.39 + t * 5;
          const rr = 0.95 * P.k * (0.3 + 0.7 * frac(i * 0.37 + t * 0.8));
          const lp = M4.point(M, [Math.cos(a) * rr, 0, Math.sin(a) * rr]);
          glowSprite(st, lp, 0.12, [1, 0.4, 0.8]);
        }
      }
    }

    function drawSticks(st) {
      st.cast.forEach(a => {
        if (!a.stick || a.hidden) return;
        const d = DIM[DANCER_LOOKS[+a.form.slice(6)].size];
        const h = M4.point(a.m.foreR, [0, -d.fore - 0.06, 0.02]);
        const tip = M4.point(a.m.foreR, [0, -d.fore - 0.32, 0.02]);
        r.draw(HX6.beam, beamM(h, tip, 0.022), { additive: true, tint: a.stick, noFog: true });
        glowSprite(st, tip, 0.18, a.stick);
      });
    }

    const X8 = {
      blade: mk(b => {
        const pts = [];
        for (let i = 0; i <= 6; i++) {
          const a = (i / 6) * (PI / 3);
          pts.push([Math.cos(a) * 1.55, Math.sin(a) * 1.55]);
        }
        for (let i = 0; i < 6; i++) b.tri([0, 0, 0], [pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0], i % 2 ? 0x9aa8c2 : 0xa8b4cc, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        b.quad([0, 0, 0.004], [1.5, 0, 0.004], [1.5, 0.05, 0.004], [0, 0.05, 0.004], [0.4, 0.75, 1, 1], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }),
      liquid: mk(b => b.prism(24, 0.76, 0.76, 0.36, 0.76, 0.76, 2.86, [1, 1, 1, 1])),
      glass: mk(b => {
        b.prism(24, 0.8, 0.8, 0.36, 0.8, 0.8, 2.88, [0.85, 0.95, 1, 0.6], { capTop: false });
        [0.4, 2.1].forEach(a => b.at(Math.sin(a) * 0.805, 1.6, Math.cos(a) * 0.805, (c) => c.box(0.03, 2.4, 0.03, [1, 1, 1, 1])));
      })
    };

    function drawShip(st, t) {
      const k = st.iris || 0;
      for (let i = 0; i < 6; i++) {
        const bis = (i + 0.5) * (PI / 3);
        r.draw(X8.blade, M4.chain(M4.translate(Math.cos(bis) * 1.7 * k, 1.6 + Math.sin(bis) * 1.7 * k, -12.03), M4.rotZ(i * (PI / 3) + k * 0.5)), {});
      }
      if (k > 0.05) r.draw(Q.floor, M4.chain(M4.translate(0, 1.6, -12.1), M4.rotX(PI / 2), M4.scale(2.6 * k, 1, 2.6 * k)), { texture: T.glow, additive: true, tint: [0.4, 0.9, 0.6], noFog: true });
    }

    function drawTube(st, t) {
      const ts = st.tubeState;
      const B = M4.translate(TUBE[0], 0, TUBE[1]);
      if (ts.liquid > 0) {
        r.draw(X8.liquid, B, { additive: true, alpha: 0.5 * ts.liquid, tint: [0.25, 0.85, 0.45], noFog: true });
        for (let i = 0; i < 16; i++) {
          const y = 0.45 + frac(t * 0.35 + i * 0.137) * 2.35;
          const a = i * 2.1 + t * 0.6;
          glowSprite(st, [TUBE[0] + Math.cos(a) * 0.5 * frac(i * 0.61), y, TUBE[1] + Math.sin(a) * 0.5 * frac(i * 0.61)], 0.07, [0.6, 1, 0.8], 0.8);
        }
      }
      r.draw(X8.glass, M4.mul(B, M4.translate(0, 2.6 * (ts.glass || 0), 0)), { blend: true, alpha: 0.22, noFog: true });
    }

    T.screen = r.texture(256, (ctx, w, h) => {
      ctx.fillStyle = '#100818';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f0489a';
      ctx.beginPath();
      ctx.moveTo(60, 120);
      ctx.bezierCurveTo(20, 90, 30, 50, 60, 72);
      ctx.bezierCurveTo(90, 50, 100, 90, 60, 120);
      ctx.fill();
      ctx.fillStyle = '#e02040';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * PI * 2 - PI / 2, rr = i % 2 ? 16 : 38;
        ctx.lineTo(128 + Math.cos(a) * rr, 80 + Math.sin(a) * rr);
      }
      ctx.fill();
      ctx.fillStyle = '#3a7ae0';
      ctx.beginPath();
      ctx.arc(196, 86, 30, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a0c8ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(196, 86, 46, 10, -0.3, 0, PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) ctx.fillRect((i * 53) % w, (i * 37) % h, 2, 2);
    }, { height: 160, clamp: true });
    const X9 = {
      screen: mk(b => b.quad([-6, 2.0, -10.7], [6, 2.0, -10.7], [6, 7.8, -10.7], [-6, 7.8, -10.7], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      head: mk(b => {
        b.box(0.3, 0.3, 0.3, 0x2a2a30);
        b.at(0, -0.16, 0, (c) => c.prism(10, 0.12, 0.12, -0.02, 0.12, 0.12, 0, [1, 1, 1, 1]));
      })
    };

    function drawConcert(st, t) {
      const b = beatAt(t);
      const pulse = 0.65 + 0.35 * Math.abs(C(PI * b));
      r.draw(X9.screen, null, { texture: T.screen, tint: [pulse, pulse, pulse] });
      for (let k = 0; k < 8; k++) {
        const src = [-5.6 + k * 1.6, 7.75, k % 2 ? -10.4 : -6.2];
        r.draw(X9.head, M4.translate(src[0], src[1], src[2]), {});
        const tgt = [src[0] * 0.6 + 4 * S(t * (0.6 + k * 0.07) + k), 0, 1.5 + 5 * C(t * (0.5 + k * 0.09) + k * 0.7)];
        const col = BEAT_COLS[(k + Math.floor(b)) % 4];
        r.draw(Q.cone, beamM(tgt, src, 0.9), { additive: true, alpha: 0.16, tint: col, noFog: true });
        r.draw(Q.floor, M4.chain(M4.translate(tgt[0], 0.012, tgt[2]), M4.scale(1.8, 1, 1.8)), { texture: T.glow, additive: true, tint: col.map(v => v * 0.6), noFog: true });
      }
    }

    function drawConcertFx(st, t) {
      (st.orbs || []).forEach(o => {
        glowSprite(st, o.pos, 1.6 * o.k, [1, 0.7, 0.9]);
        glowSprite(st, o.pos, 0.6 * o.k, [1, 1, 1]);
      });
      (st.fireworks || []).forEach(fw => {
        const a = fw.age;
        if (a > 1.6) return;
        const fade = 1 - a / 1.6;
        for (let i = 0; i < 26; i++) {
          const th = i * 2.399, ph = Math.acos(1 - 2 * frac(i * 0.618 + 0.3));
          const d = [S(ph) * Math.cos(th), C(ph), S(ph) * Math.sin(th)];
          const sp = 2.6 * (1 - Math.exp(-a * 3));
          const pos = [fw.pos[0] + d[0] * sp, fw.pos[1] + d[1] * sp - 0.9 * a * a, fw.pos[2] + d[2] * sp];
          glowSprite(st, pos, 0.45 * fade + 0.08, fw.col, fade);
        }
        if (a < 0.25) glowSprite(st, fw.pos, 3.0 * (1 - a * 4), fw.col);
      });
      if (st.confetti > 0.01) {
        for (let i = 0; i < 70; i++) {
          if (i / 70 > st.confetti) continue;
          const x = -8 + frac(i * 0.618) * 16, z = -6 + frac(i * 0.382) * 13;
          const y = 8.5 - frac(t * 0.18 + i * 0.137) * 8.5;
          const col = BEAT_COLS[i % 4];
          r.draw(HX6.sprite, M4.chain(M4.translate(x + 0.3 * S(t * 2 + i), y, z), M4.rotY(t * 3 + i), M4.rotX(t * 4 + i), M4.scale(0.08, 0.05, 1)), { flat: [col[0], col[1], col[2], 1] });
        }
      }
    }

    T.grid = r.texture(128, (ctx, w, h) => {
      ctx.fillStyle = '#f6f4fa';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#dcd8e8';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 128; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i + 0.5, 0);
        ctx.lineTo(i + 0.5, h);
        ctx.moveTo(0, i + 0.5);
        ctx.lineTo(w, i + 0.5);
        ctx.stroke();
      }
    });
    const X10 = { grid: mk(b => b.quad([-9, 0, -2.8], [9, 0, -2.8], [9, 8, -2.8], [-9, 8, -2.8], [1, 1, 1, 0.6], [[0, 0], [9, 0], [9, 4], [0, 4]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])) };

    function drawExtras(st, t) {
      if (st.scene === 'sheet') r.draw(X10.grid, null, { texture: T.grid });
      if (st.scene === 'stage') drawConcert(st, t);
      if (st.scene === 'ship') drawShip(st, t);
      if (st.scene === 'disco') drawDisco(st, t);
      if (st.scene === 'room') drawRoom(st, t);
      if (st.scene === 'hall') drawHall(st, t);
      if (st.scene === 'bus') {
        r.draw(X2.outside, null, {});
        for (let k = 0; k < 16; k++) {
          const side = k % 2 ? 1 : -1;
          const z = ((k * 5.3 - t * 9) % 40 + 40) % 40 - 12;
          const x = side * (2.6 + (k % 3) * 2.2);
          if (k % 4 === 0) r.draw(X2.palm, M4.translate(x, 0, z), {});
          else if (k % 4 === 1) r.draw(X2.pole, M4.translate(x, 0, z), {});
          else r.draw(X2.car, M4.translate(x + side * 1.5, 0, z), { tint: rgb(CARS[k % 4]).slice(0, 3).map(v => v / 0.54) });
        }
      }
      if (st.scene === 'expo') {
        r.draw(X2.facade, null, { texture: T.facade });
        r.draw(X2.bannerF, null, { texture: T.banner });
        r.draw(X2.bannerB, null, { texture: T.banner });
        r.draw(X2.water, null, { texture: T.water, uvScroll: [0, t * 0.9] });
        if (st.bus) {
          const B = M4.translate(st.bus.x, 0, 8);
          r.draw(busMesh, B, {});
          const open = st.bus.door || 0;
          r.draw(doorMesh, M4.chain(B, M4.translate(-3.68 - open * 0.1, 0.95, -1.27 - open * 0.25), M4.rotY(open * 1.2)), {});
        }
        if (st.scanner && st.scanner.k > 0.01) {
          const sc = st.scanner;
          r.draw(Q.cone, M4.chain(M4.translate(sc.x, 0, sc.z), M4.scale(1.8, 30, 1.8)), { additive: true, alpha: 0.35 * sc.k, tint: [0.3, 0.55, 1.0], noFog: true });
          r.draw(Q.floor, M4.chain(M4.translate(sc.x, 3.0, sc.z), M4.scale(4.2, 1, 4.2)), { texture: T.glow, additive: true, tint: [0.3 * sc.k, 0.6 * sc.k, 1.0 * sc.k], noFog: true });
        }
        if (st.light.clouds) {
          for (let k = 0; k < 9; k++) {
            const x = LAWN[0] + ((k * 7.3 + t * 0.6) % 40) - 20, z = LAWN[1] + ((k * 11.7) % 30) - 15;
            r.draw(X2.cloud, M4.chain(M4.translate(x, 26 + (k % 3) * 3, z), M4.scale(5 + (k % 4) * 2, 1, 3 + (k % 3) * 1.5)), { texture: T.glow, additive: true, alpha: 0.85, noFog: true });
          }
        }
      }
      if (st.props.backpack) {
        const [x, y, z, fly] = st.props.backpack;
        r.draw(X2.backpack, M4.chain(M4.translate(x + fly * 0.6, y + fly * 0.5, z + fly * 0.4), M4.rotY(0.3 + fly * 2), M4.rotX(-0.25)), {});
      }
    }

    function drawAfterCast(st, t) {
      drawFx(st, t);
      drawMemoryFx(st, t);
      if (st.tubeState) drawTube(st, t);
      drawConcertFx(st, t);
      drawSticks(st);
      if (st.sparkle && st.sparkle.k > 0.01) {
        const sp = st.sparkle;
        [0, 1, 2].forEach(i => r.draw(X2.spark, M4.chain(M4.translate(sp.pos[0] + 0.03 * i, sp.pos[1] + 0.06 * i * sp.k, sp.pos[2]), M4.scale(0.6 + sp.k * (1 - i * 0.3))), { additive: true, tint: sp.col, noFog: true }));
      }
      if (st.led && st.led.on) {
        const a = st.cast.find(x => x.id === st.led.id);
        if (a) r.draw(X2.spark, M4.chain(a.m.foreL, M4.translate(0, -0.17, 0.035), M4.scale(0.35)), { additive: true, tint: [1, 0.1, 0.12], noFog: true });
      }
      if (st.pov) Cast.drawPov(r, X, st.camera, st.pov);
    }

    let polys = 0;
    const tally = () => { polys += r.polys; r.polys = 0; };
    const over = () => {
      tally();
      r.begin(OVER_ENV, { proj: ORTHO, view: M4.ident() }, { x: 0, y: 0, w: FW, h: FH }, true);
    };
    const rect = (x, y, w, h, opts) => r.draw(Q.unit, M4.chain(M4.translate(x, y, 0), M4.scale(w, h, 1)), Object.assign({ noFog: true }, opts));

    function envFor(st) {
      const e = SCENE_ENV[st.scene];
      const cm = st.camera;
      const f = V3.norm(V3.sub(cm.at, cm.eye));
      let rt = V3.cross(f, [0, 1, 0]);
      if (V3.len(rt) < 1e-3) rt = [1, 0, 0];
      rt = V3.norm(rt);
      const sunDir = V3.norm(V3.add(V3.add(V3.mul(f, 0.55), V3.mul(rt, 0.5)), [0, -0.7, 0]));
      const env = { sunDir, sunColor: e.sunColor.slice(), ambTop: e.ambTop.slice(), ambBottom: e.ambBottom.slice(), fogColor: e.fog.slice(), fogNear: e.far ? 60 : 30, fogFar: e.far || 90, points: [] };
      if (st.scene === 'expo') env.sunDir = V3.norm([-0.45, -0.75, -0.35]);
      const L = st.light;
      if (st.scene === 'room') {
        const mood = (st.room || {}).mood || 'day';
        const M = {
          morning: [[1.0, 0.9, 0.76], [0.42, 0.38, 0.34], [0.2, 0.17, 0.14]],
          day: [[0.98, 0.96, 0.92], [0.45, 0.43, 0.42], [0.22, 0.2, 0.18]],
          evening: [[0.62, 0.5, 0.55], [0.24, 0.19, 0.22], [0.1, 0.08, 0.09]],
          night: [[0.2, 0.26, 0.45], [0.09, 0.1, 0.16], [0.03, 0.03, 0.05]]
        }[mood];
        env.sunColor = M[0];
        env.ambTop = M[1];
        env.ambBottom = M[2];
        if (mood === 'night') env.fogColor = [0.02, 0.02, 0.04];
        if (mood === 'evening') env.points.push({ pos: [0, 1.15, -2.0], color: [1.1, 0.75, 0.4] }, { pos: [0, 2.3, 0.3], color: [0.9, 0.8, 0.6] });
        if (mood === 'night') env.points.push({ pos: [-2.4, 1.6, -0.2], color: [0.35, 0.3, 0.45] });
      }
      if (st.scene === 'ship' && st.medbay) {
        env.sunColor = [0.85, 1.0, 0.95];
        env.ambTop = [0.36, 0.46, 0.42];
        env.ambBottom = [0.14, 0.2, 0.18];
      }
      if (st.scene === 'memory') {
        if (st.memory === 'vault') {
          env.sunColor = [0.8, 0.66, 0.95];
          env.ambTop = [0.36, 0.26, 0.48];
          env.ambBottom = [0.12, 0.08, 0.18];
          env.fogColor = [0.3, 0.14, 0.36];
          env.fogNear = 40;
          env.fogFar = 120;
        } else {
          env.sunColor = [1.0, 0.88, 0.7];
          env.ambTop = [0.46, 0.38, 0.3];
          env.ambBottom = [0.2, 0.16, 0.12];
          env.fogColor = [0.35, 0.28, 0.2];
        }
      }
      if (st.scene === 'hall') {
        const mood = (st.hall || {}).mood || 'day';
        if (mood === 'dark') {
          env.sunColor = [0.3, 0.32, 0.45];
          env.ambTop = [0.1, 0.11, 0.16];
          env.ambBottom = [0.04, 0.04, 0.07];
          env.fogColor = [0.02, 0.02, 0.05];
          env.fogNear = 3;
          env.fogFar = 14;
        } else if (mood === 'night') {
          env.sunColor = [0.55, 0.5, 0.6];
          env.ambTop = [0.2, 0.18, 0.24];
          env.ambBottom = [0.08, 0.07, 0.1];
          env.fogColor = [0.05, 0.04, 0.08];
          env.fogNear = 8;
          env.fogFar = 30;
        }
      }
      if (st.scene === 'void') {
        const lit = (L.spots || []).filter(sp => sp.lit && sp.k > 0.05);
        if (L.flatLit) {
          env.sunColor = [0.7, 0.68, 0.66];
          env.ambTop = [0.5, 0.48, 0.5];
          env.ambBottom = [0.3, 0.28, 0.3];
        } else if (lit.length) {
          const k = Math.max(...lit.map(sp => sp.k));
          const c = lit.length > 1 ? [1, 0.97, 0.94] : lit[0].col;
          env.sunColor = c.map(v => 0.3 + (0.5 + v * 0.5) * 0.35 * k);
          env.ambTop = [0.28, 0.26, 0.3];
          env.ambBottom = [0.1, 0.09, 0.12];
          lit.slice(0, 2).forEach(sp => env.points.push({ pos: [sp.x, 2.2, sp.z + 1.0], color: sp.col.map(v => (0.55 + v * 0.45) * 1.3 * sp.k) }));
        }
      }
      (st.points || []).forEach(pt => { if (env.points.length < 2) env.points.push(pt); });
      return env;
    }

    function drawSpots(st, t) {
      const L = st.light;
      (L.spots || []).forEach(sp => {
        if (sp.k <= 0.01) return;
        const col = sp.col.map(v => v * sp.k);
        r.draw(Q.floor, M4.chain(M4.translate(sp.x, 0.006, sp.z), M4.scale(sp.r * 2.6, 1, sp.r * 2.6)), { texture: T.glow, additive: true, tint: col, noFog: true });
        const tilt = sp.tilt || 0;
        r.draw(Q.cone, M4.chain(M4.translate(sp.x, 6.5, 0), M4.rotX(-tilt * 1.15), M4.translate(0, -6.5, sp.z * (1 - tilt)), M4.scale(sp.r, 6.5, sp.r)), { additive: true, alpha: 0.22, tint: col, noFog: true });
      });
      if (L.dust) {
        for (let i = 0; i < 26; i++) {
          const a = i * 2.4, rr = 0.2 + (i % 5) * 0.2;
          const y = ((i * 0.37 + t * 0.08) % 1) * 3.2;
          r.draw(Q.mote, M4.translate(Math.cos(a + t * 0.2) * rr, y, Math.sin(a + t * 0.2) * rr), { additive: true, alpha: 0.6 * L.dust, tint: [0.9, 0.88, 0.8], noFog: true });
        }
      }
    }

    function drawCast(st) {
      st.cast.forEach(a => {
        if (a.hidden) return;
        if (a.base) {
          const f = baseFig(a.form);
          f.matrices = a.m;
          f.pose = a.pose;
          f.draw();
          return;
        }
        if (a.holo !== undefined) {
          const g = st.cast.find(x => x.form === 'gynoid');
          if (!g || a.holo < 0.05) return;
          const c = M4.point(g.m.torso, [0, 0.27, 0.32]);
          const pre = M4.chain(M4.translate(c[0], c[1] - 0.02, c[2]), M4.scale(0.17 * a.holo), M4.rotY(g.pose.ry));
          Cast.drawActor(r, X, a, { flat: [1, 0.45, 0.8, 0.55], pre });
          return;
        }
        if (a.sil) {
          const c = a.hips;
          const pre = M4.chain(M4.translate(c[0], c[1], c[2]), M4.scale(1.03), M4.translate(-c[0], -c[1], -c[2]));
          Cast.drawActor(r, X, a, { flat: [a.sil[0], a.sil[1], a.sil[2], 0.55], pre });
          Cast.drawActor(r, X, a, { flat: [0.015, 0.015, 0.02, 1] });
          if (a.glow) {
            [-1, 1].forEach(sx => {
              const M = M4.chain(a.m.head, M4.translate(sx * 0.04, -0.017, 0.134));
              r.draw(Q.eyeHalo, M, { additive: true, tint: a.glow, noFog: true });
              r.draw(Q.eye, M, { additive: true, tint: a.glow.map(v => Math.min(1, v + 0.3)), noFog: true });
            });
          }
          return;
        }
        Cast.drawActor(r, X, a);
      });
    }

    function drawWorld(st, t, camera, rect0) {
      const env = envFor(st);
      const L = st.light;
      if (L.backdrop) env.fogColor = [0.96, 0.95, 0.98];
      r.begin(env, camera, rect0 || { x: 0, y: 0, w: FW, h: FH });
      if (!L.backdrop) {
        r.draw(setFor(st.scene), null, {});
        drawExtras(st, t);
        if (st.scene === 'void') drawSpots(st, t);
      }
      drawCast(st);
      drawAfterCast(st, t);
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
        if (st.mirror) {
          const m = st.camera;
          const mc = Object.assign({}, m, { eye: [2 * 2.675 - m.eye[0], m.eye[1], m.eye[2]], at: [2 * 2.675 - m.at[0], m.at[1], m.at[2]], fov: 50 });
          r.clear([0, 0, 0]);
          r.begin(envFor(st), mc, { x: 0, y: 0, w: 128, h: 96 });
          drawCast(st);
          r.grab(T.mirror, 0, 0, 128, 96);
        }
        if (st.room && st.room.polaroid && !photoReady) {
          const ps = worldFor(172.8, shotAt(172.8));
          r.clear([0, 0, 0]);
          drawWorld(ps, 172.8, ps.camera, { x: 0, y: 0, w: 256, h: 192 });
          r.grab(T.photo, 0, 0, 256, 192);
          photoReady = true;
        }
        r.clear(st.panels ? (st.pageBg || [0, 0, 0]) : (st.room && st.room.mood === 'night' ? [0.02, 0.02, 0.04] : SCENE_ENV[st.scene].fog));
        if (st.panels) {
          st.panels.forEach(pn => {
            if (pn.cam) {
              drawWorld(st, t, cam(pn.cam[0], pn.cam[1], pn.cam[2]), pn.rect);
              return;
            }
            const a = st.cast.find(x => x.id === pn.id);
            const h = M4.point(a.m.head, [0, -0.015, 0.1]);
            drawWorld(st, t, cam([h[0], h[1] + 0.005, h[2] + 0.42], h, 9), pn.rect);
          });
        } else {
          drawWorld(st, t, st.camera);
        }
        const chip = (x, y, c) => {
          rect(x - 1, y - 1, 20, 20, { flat: [0.25, 0.25, 0.3, 1] });
          rect(x, y, 18, 18, { flat: [c[0], c[1], c[2], 1] });
        };
        if (st.swatches) {
          over();
          st.swatches.forEach((c, i) => chip(FW - 34, FH - 60 - i * 26, c));
        }
        if (st.swatchRow) {
          over();
          st.swatchRow.forEach((row, k) => row.forEach((c, i) => chip(18 + k * 168 + i * 26, 22, c)));
        }
        const F = st.fx;
        if (F.white > 0.003) {
          over();
          rect(0, 0, FW, FH, { flat: [1, 0.99, 0.97, clamp(F.white, 0, 1)], blend: true });
        }
        if (F.flash > 0.003) {
          over();
          rect(0, 0, FW, FH, { flat: [1, 1, 1, clamp(F.flash, 0, 1)], blend: true });
        }
        if (F.flashCol && F.flashCol[3] > 0.003) {
          over();
          rect(0, 0, FW, FH, { flat: [F.flashCol[0], F.flashCol[1], F.flashCol[2], clamp(F.flashCol[3], 0, 1)], blend: true });
        }
        if (F.flashPink > 0.003) {
          over();
          rect(0, 0, FW, FH, { flat: [1, 0.45, 0.75, clamp(F.flashPink, 0, 1) * 0.8], blend: true });
        }
        if (F.phase > 0.003) {
          over();
          rect(0, 0, FW, FH, { flat: [0, 0, 0.02, clamp(F.phase * 1.15, 0, 1)], blend: true });
          for (let i = 0; i < 70; i++) {
            const appear = (i * 0.618) % 1;
            if (appear > F.phase * 1.3) continue;
            const x = ((i * 97.3 + t * 40 * (i % 3 - 1)) % FW + FW) % FW, y = (i * 53.7) % FH;
            const sz = 2 + (i % 4) * 2;
            rect(x, y, sz, sz, { flat: [0.4, 0.7, 1, 0.9], blend: true });
          }
        }
        if (F.dark > 0.003) {
          over();
          rect(0, 0, FW, FH, { flat: [0, 0, 0, clamp(F.dark, 0, 1)], blend: true });
        }
        if (F.title > 0.003) {
          over();
          rect(64, 150, 384, 96, { texture: T.title, alpha: clamp(F.title, 0, 1), blend: true });
        }
        if (F.squeeze > 0.003) {
          over();
          const sw = FW * 0.12 * clamp(F.squeeze, 0, 1), sh = FH * 0.1 * clamp(F.squeeze, 0, 1);
          rect(0, 0, sw, FH, { flat: [0, 0, 0, 1] });
          rect(FW - sw, 0, sw, FH, { flat: [0, 0, 0, 1] });
          rect(0, 0, FW, sh, { flat: [0, 0, 0, 1] });
          rect(0, FH - sh, FW, sh, { flat: [0, 0, 0, 1] });
        }
        if (F.lids > 0.003) {
          over();
          const hh = (FH / 2) * clamp(F.lids, 0, 1);
          rect(0, FH - hh, FW, hh, { flat: [0, 0, 0, 1] });
          rect(0, 0, FW, hh, { flat: [0, 0, 0, 1] });
        }
        if (F.polaroid > 0.003) {
          over();
          const k = clamp(F.polaroid, 0, 1);
          const col = { flat: [0.97, 0.96, 0.92, k], blend: true };
          rect(0, 0, FW, 64, col);
          rect(0, FH - 22, FW, 22, col);
          rect(0, 64, 22, FH - 86, col);
          rect(FW - 22, 64, 22, FH - 86, col);
        }
        tally();
        return { shot, polys: Math.round(polys), fade: fadeAt(t), overlay: null };
      }
    };
  }

  const clip = {
    id: 'cosplay-convention-crisis',
    number: 7,
    artist: 'Cosplay Convention Crisis',
    title: 'You Gotta Choose',
    originalYear: 2021,
    audio: 'content/clip/Cosplay Convention Crisis.mp3',
    duration: DURATION,
    bpm: BPM,
    beat0: BEAT0,
    poster: 57.5,
    locations: LOCATIONS,
    shots: SHOTS,
    looks: CHARACTERS,
    shotAt,
    stage,
    fadeAt,
    voiceAt,
    mouthFor,
    create
  };

  window.poligonClips = window.poligonClips || [];
  if (!window.poligonClips.some(c => c.id === clip.id)) window.poligonClips.push(clip);
})();
