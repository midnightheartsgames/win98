(function () {
  const { M4, V3, Builder, shade, rand } = window.P3D;
  const { Figure, restPose } = window.P3DFigure;
  const { texNoise, texGlow, texGrid } = window.P3DParanoiaKit.tex;

  const BPM = 126;
  const BEAT0 = 0.41;
  const BEAT = 60 / BPM;
  const DURATION = 185.78;
  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (x) => { const k = clamp(x, 0, 1); return k * k * (3 - 2 * k); };
  const frac = (x) => x - Math.floor(x);
  const lerp = (a, b, k) => a + (b - a) * k;
  const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const beatAt = (t) => ((t - BEAT0) * BPM) / 60;
  const bang = (b) => { const k = 0.5 + 0.5 * C(PI * 2 * b); return k * k; };
  const inside = (t, a, b) => t >= a && t < b;

  const FW = 512;
  const FH = 288;
  const MAIN = { x: 0, y: 48, w: FW, h: FH };

  const LOCATIONS = [
    { id: 'club', name: 'Вывеска клуба', color: '#e0409c', scene: 'club' },
    { id: 'hud', name: 'Дыня в прицеле', color: '#3a4ad8', scene: 'hud' },
    { id: 'eat', name: 'Обед', color: '#6fdce8', scene: 'eat' },
    { id: 'room', name: 'Тёмная комната', color: '#2a6e70', scene: 'room' },
    { id: 'torii', name: 'Ворота тории', color: '#b8322a', scene: 'torii' },
    { id: 'house', name: 'Дом с фонарями', color: '#d86ab0', scene: 'torii' },
    { id: 'deck', name: 'DJ-пульт', color: '#cfe8f4', scene: 'deck' },
    { id: 'stage', name: 'Сцена и зал из дынь', color: '#4fc49a', scene: 'stage' },
    { id: 'vhs', name: 'Видеокамера', color: '#3f8a4a', scene: 'vhs' },
    { id: 'street', name: 'Ночная улица', color: '#6a4fc8', scene: 'street' },
    { id: 'split', name: 'Фотосессия', color: '#ff4f8f', scene: 'split' },
    { id: 'hall', name: 'Японский зал', color: '#c89a60', scene: 'room' },
    { id: 'title', name: 'Название', color: '#8a8f99', scene: 'title' }
  ];

  const SHOT_LIST = [
    [0, 'club', 'sign', { hud: 'cam' }],
    [2.8, 'hud', 'melon', { hud: 'fs' }],
    [5.04, 'hud', 'split', { hud: 'fs' }],
    [7.16, 'eat', 'grid', { layout: 'eat1' }],
    [15.4, 'room', 'desk', { hud: 'cam' }],
    [21.68, 'torii', 'dolly', { hud: 'cam' }],
    [25.56, 'house', 'door', { hud: 'cam' }],
    [28.56, 'deck', 'strips', { layout: 'strips' }],
    [30.36, 'deck', 'grid', { layout: 'deck1' }],
    [38, 'deck', 'solo'],
    [45.8, 'title', 'rainbow'],
    [46.16, 'stage', 'front'],
    [53.44, 'stage', 'low'],
    [54.08, 'stage', 'sweep'],
    [57.12, 'vhs', 'green', { hud: 'vhs' }],
    [59, 'deck', 'strips', { layout: 'strips' }],
    [60.88, 'stage', 'close'],
    [64.96, 'vhs', 'green', { hud: 'vhs' }],
    [66.76, 'vhs', 'red', { hud: 'vhsRed' }],
    [68.16, 'stage', 'front'],
    [74.4, 'deck', 'grid', { layout: 'deck2' }],
    [76.32, 'split', 'scribble'],
    [76.76, 'street', 'street', { hud: 'cam' }],
    [84.04, 'street', 'towers', { hud: 'cam' }],
    [85.4, 'street', 'lantern', { hud: 'cam' }],
    [89.6, 'deck', 'strips', { layout: 'strips' }],
    [91.52, 'club', 'sign', { hud: 'cam' }],
    [97.25, 'torii', 'dolly', { hud: 'cam' }],
    [101.12, 'house', 'door', { hud: 'cam' }],
    [104.4, 'hud', 'melon', { hud: 'fs' }],
    [106.24, 'hud', 'split', { hud: 'fs' }],
    [106.72, 'club', 'sign', { hud: 'cam' }],
    [109.48, 'hud', 'melon', { hud: 'fs' }],
    [111.72, 'hud', 'split', { hud: 'fs' }],
    [113.96, 'eat', 'grid', { layout: 'eat2' }],
    [122.2, 'room', 'desk', { hud: 'cam' }],
    [128.7, 'torii', 'wobble', { hud: 'cam' }],
    [132, 'torii', 'break', { hud: 'cam' }],
    [134, 'house', 'door', { hud: 'cam' }],
    [136.72, 'title', 'bars'],
    [137.24, 'title', 'fire'],
    [137.6, 'stage', 'front'],
    [144.88, 'stage', 'sweep'],
    [148.56, 'vhs', 'green', { hud: 'vhs' }],
    [150.44, 'deck', 'grid', { layout: 'deck3' }],
    [152.44, 'stage', 'sweep', { rainbow: [152.44, 152.76] }],
    [156.52, 'vhs', 'green', { hud: 'vhs' }],
    [158.44, 'vhs', 'red', { hud: 'vhsRed' }],
    [159.8, 'stage', 'front'],
    [163.52, 'vhs', 'green', { hud: 'vhs' }],
    [165.4, 'vhs', 'red', { hud: 'vhsRed' }],
    [165.84, 'deck', 'strips', { layout: 'strips' }],
    [167.64, 'stage', 'front'],
    [168.2, 'split', 'blue', { hud: 'iso' }],
    [169.2, 'split', 'pink', { hud: 'iso' }],
    [170.2, 'hall', 'party'],
    [180.84, 'deck', 'mix', { layout: 'mix', hud: 'fs' }],
    [182.84, 'title', 'neon']
  ];

  const EMPTY_CAMS = ['sign', 'melon', 'split', 'street', 'towers', 'rainbow', 'bars', 'fire', 'neon'];

  const SHOTS = SHOT_LIST.map(([start, loc, cam, opts], i) => ({
    index: i,
    start,
    end: i + 1 < SHOT_LIST.length ? SHOT_LIST[i + 1][0] : DURATION,
    loc,
    cam,
    scene: LOCATIONS.find(l => l.id === loc).scene,
    layout: (opts && opts.layout) || null,
    hud: (opts && opts.hud) || null,
    rainbow: (opts && opts.rainbow) || null,
    emptyOk: EMPTY_CAMS.includes(cam) && loc !== 'split',
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
    return t > DURATION - 0.6 ? clamp((t - (DURATION - 0.6)) / 0.5, 0, 1) : 0;
  }

  const FX = [
    [0, 0.95, 'whiteIn', { tint: [1, 0.72, 0.95], curve: 0.6 }],
    [2.74, 2.98, 'glitch', { seed: 1 }],
    [4.98, 5.34, 'pixel', {}],
    [6.8, 7.16, 'whiteOut', {}],
    [7.16, 7.28, 'black', {}],
    [13.64, 14.8, 'glitch', { seed: 2, bars: true }],
    [14.8, 15, 'negative', {}],
    [15, 15.28, 'glitch', { seed: 3, heavy: true }],
    [15.28, 15.4, 'black', {}],
    [15.4, 15.62, 'rgb', { amount: 7 }],
    [21.45, 21.8, 'glitch', { seed: 4, red: true }],
    [28.2, 28.56, 'glitch', { seed: 5 }],
    [30.2, 30.5, 'glitch', { seed: 6, streak: true }],
    [43.88, 45.8, 'whiteout', {}],
    [46.16, 47.4, 'whiteIn', { tint: [0.92, 1, 1], hold: 2 }],
    [57.02, 57.22, 'whiteIn', {}],
    [60.88, 62.75, 'whiteIn', { blobs: true, hold: 5 }],
    [66.7, 66.86, 'glitch', { seed: 8 }],
    [68, 68.24, 'glitch', { seed: 9, bars: true }],
    [72.96, 73.12, 'glitch', { seed: 10 }],
    [73.44, 73.62, 'glitch', { seed: 11, red: true }],
    [73.94, 74.3, 'glitch', { seed: 12 }],
    [76.32, 76.46, 'glitch', { seed: 13, rainbow: true }],
    [76.76, 76.92, 'defocus', {}],
    [77.46, 77.58, 'glitch', { seed: 14, heavy: true }],
    [78.08, 78.2, 'glitch', { seed: 15 }],
    [78.8, 78.9, 'glitch', { seed: 16, streak: true }],
    [80.52, 80.62, 'glitch', { seed: 17 }],
    [80.84, 80.94, 'glitch', { seed: 18, white: true }],
    [81.62, 81.74, 'glitch', { seed: 19, blue: true }],
    [84.02, 84.26, 'whiteIn', { tint: [0.8, 0.8, 1] }],
    [89.5, 89.76, 'glitch', { seed: 20, streak: true }],
    [91.52, 91.98, 'defocus', {}],
    [97.25, 97.8, 'dissolve', { cam: 'sign', scene: 'club' }],
    [104.2, 104.52, 'whiteIn', {}],
    [106.6, 106.82, 'glitch', { seed: 21, blue: true }],
    [109.44, 109.62, 'glitch', { seed: 22, streak: true }],
    [111.68, 112.02, 'pixel', {}],
    [113.6, 113.96, 'whiteOut', {}],
    [120.7, 121.2, 'glitch', { seed: 23, bars: true }],
    [121.2, 121.32, 'negative', {}],
    [121.32, 121.72, 'glitch', { seed: 24, heavy: true }],
    [121.72, 121.96, 'glitch', { seed: 25, streak: true, cyan: true }],
    [121.96, 122.2, 'flat', { color: [0, 0.82, 1] }],
    [122.2, 122.42, 'rgb', { amount: 6 }],
    [128.2, 128.7, 'glitch', { seed: 26, bars: true }],
    [134, 136.72, 'jitter', { seed: 27 }],
    [136.72, 136.98, 'glitch', { seed: 28, heavy: true }],
    [137.6, 139, 'whiteIn', { blobs: true, hold: 5 }],
    [148.46, 148.72, 'whiteIn', { streak: true }],
    [156.46, 156.72, 'whiteIn', { streak: true }],
    [159.8, 160.36, 'glitch', { seed: 29, heavy: true }],
    [163.46, 163.7, 'whiteIn', { streak: true }],
    [165.36, 165.5, 'glitch', { seed: 30 }],
    [167.95, 168.22, 'whiteOut', {}],
    [169.1, 169.3, 'glitch', { seed: 31 }],
    [170.2, 170.5, 'whiteIn', {}],
    [177.45, 177.78, 'whiteIn', {}],
    [182.78, 183.05, 'defocus', {}]
  ];

  const HEAD_R = 0.2;
  const GIRL = { hip: 0.075, thigh: 0.17, shin: 0.16, sole: 0.045, shoulder: 0.13, upper: 0.13, fore: 0.12, torso: 0.27, waist: 0.12, chest: 0.145, depth: 0.105, headR: 0.165 };
  const GIRL_SOLVER = { d: GIRL, scale: 1 };
  const LEGS = GIRL.thigh + GIRL.shin + GIRL.sole;

  const LOOK = {
    name: 'DJ Мелон',
    skin: 0xffe6d8,
    hair: 0x1b2029,
    hairDark: 0x12151c,
    hairHi: 0x2c3442,
    earInner: 0xc8ced8,
    shirt: 0xf0f3f8,
    tie: 0x1c1f28,
    coat: 0x28667a,
    coatDark: 0x1b4858,
    coatHi: 0x367d94,
    lining: 0xe8edf2,
    lanyard: 0xebb840,
    tag: 0x4e4a82,
    cord: 0xc82226,
    armor: 0x1e222c,
    metal: 0x9aa2b0,
    gold: 0xdcb042,
    obi: 0x1c2028,
    skirt: 0x161922,
    pleat: 0x585c68,
    tights: 0x343038,
    boot: 0x151820,
    sole: 0x0e1015
  };
  const DRONE_LOOK = { name: 'Дынька' };

  function solveGirl(pose) {
    const m = Figure.prototype.solve.call(GIRL_SOLVER, pose);
    return { head: M4.point(m.head, [0, 0, 0]), hips: M4.point(m.hips, [0, 0, 0]), m };
  }

  const blinkAt = (t, seed) => frac(t * 0.37 + seed * 0.61) < 0.035;

  function base(x, z, ry) {
    const p = restPose();
    p.x = x;
    p.z = z;
    p.ry = ry || 0;
    p.shL = [0.08, 0, 0.14];
    p.shR = [0.08, 0, 0.14];
    p.elL = [0.3, 0, 0];
    p.elR = [0.3, 0, 0];
    p.face = 'calm';
    return p;
  }

  function dj(p, b, t, amp) {
    const a = amp === undefined ? 1 : amp;
    const k = bang(b);
    p.neck = [0.02 + 0.2 * k * a, 0.08 * S(PI * b * 0.5), 0.06 * S(PI * b * 0.25)];
    p.spine = [0.06 + 0.07 * k * a, 0.04 * S(PI * b * 0.5), 0];
    p.hipL = [0.1 * k * a, 0, 0.05];
    p.hipR = [0.1 * k * a, 0, 0.05];
    p.knL = [0.08 + 0.2 * k * a, 0, 0];
    p.knR = [0.08 + 0.2 * k * a, 0, 0];
    const sc = 0.5 + 0.5 * S(t * 8.5);
    p.shR = [lerp(1.05, 0.57, sc), lerp(-0.34, -0.12, sc), lerp(0.78, 0.91, sc)];
    p.elR = [lerp(0.03, 0.62, sc), 0, 0];
    const cue = frac(b / 8);
    const up = cue > 0.8 ? S(PI * (cue - 0.8) * 5) : 0;
    p.shL = [lerp(0.68, 1.44, up), lerp(-0.29, 0.41, up), lerp(0.9, 0.08, up)];
    p.elL = [lerp(0.45, 1.39, up), 0, 0];
    p.face = blinkAt(t, 2) ? 'blink' : 'calm';
    return p;
  }

  function seated(p) {
    p.ground = false;
    p.y = 0.36 - LEGS;
    p.hipL = [1.5, 0, 0.12];
    p.hipR = [1.5, 0, 0.12];
    p.knL = [1.45, 0, 0];
    p.knR = [1.45, 0, 0];
    return p;
  }

  const EAT_DIP = [0.86, -0.23, -0.05, 1.02];
  const EAT_MID = [1.22, -0.13, 0.15, 1.32];
  const EAT_HIGH = [1.82, -0.1, 0.08, 1.11];

  function eating(p, t) {
    const step = Math.floor(t * 6.25) % 4;
    const up = [0, 0.5, 1, 0.5][step];
    p.spine = [0.12, 0, 0];
    p.shL = [0.73, 0.12, -0.61];
    p.elL = [0.6, 0, 0];
    const a = up < 0.5 ? EAT_DIP.map((v, i) => lerp(v, EAT_MID[i], up * 2)) : EAT_MID.map((v, i) => lerp(v, EAT_HIGH[i], (up - 0.5) * 2));
    p.shR = [a[0], a[1], a[2]];
    p.elR = [a[3], 0, 0];
    p.neck = [lerp(0.3, 0.02, up), 0, lerp(0.05, -0.04, up)];
    p.face = up > 0.7 ? 'chew' : up > 0.2 ? 'oh' : 'happy';
    return p;
  }

  function slumped(p) {
    p.spine = [0.3, 0, 0.05];
    p.neck = [0.55, 0.2, 0.25];
    p.shL = [0.45, -0.01, -0.11];
    p.elL = [1.22, 0, 0];
    p.shR = [0.48, 0.01, 0.12];
    p.elR = [1.23, 0, 0];
    p.face = 'sleepy';
    return p;
  }

  function vsign(p, t) {
    p.shR = [2.18, 0.58, 0.09];
    p.elR = [0.83, 0, 0];
    p.shL = [1.84, 0.5, 0.44];
    p.elL = [1.95, 0, 0];
    p.neck = [0.04, -0.12 + 0.05 * S(t * 1.1), 0.22 + 0.04 * S(t * 0.9)];
    p.spine = [0.02, -0.06, 0];
    p.face = blinkAt(t, 3) ? 'blink' : 'open';
    return p;
  }

  function idle(p, b, t) {
    const k = bang(b);
    p.neck = [0.06 + 0.14 * k, 0.1 * S(t * 0.7), 0.08 * S(PI * b * 0.5)];
    p.shL = [0.53, -0.86, 0.1];
    p.elL = [0.05, 0, 0];
    p.shR = [0.53, -0.86, 0.1];
    p.elR = [0.05, 0, 0];
    p.knL = [0.05 + 0.1 * k, 0, 0];
    p.knR = [0.05 + 0.1 * k, 0, 0];
    p.face = blinkAt(t, 1) ? 'blink' : 'calm';
    return p;
  }

  function micPose(p, t) {
    p.shR = [1.35, -0.41, 0.03];
    p.elR = [1.4, 0, 0];
    p.shL = [0.3, 0, 0.2];
    p.elL = [0.6, 0, 0];
    p.neck = [0.02, 0.32, -0.1];
    p.face = frac(beatAt(t)) < 0.5 ? 'sing' : 'calm';
    return p;
  }

  function cheerPose(p, t) {
    p.shR = [2.21, 0.86, -0.2];
    p.elR = [0.56, 0, 0];
    p.shL = [-0.44, -0.48, 0.35];
    p.elL = [0.82, 0, 0];
    p.hipL = [0.5, 0, 0.1];
    p.knL = [1.1, 0, 0];
    p.neck = [0.02, -0.15, 0.15];
    p.spine = [0, 0.1, -0.08];
    p.face = 'wink';
    return p;
  }

  function girl(pose, props) {
    return { id: 'melon', look: 'melon', pose, props: props || [], hidden: false };
  }

  const STICKS = { id: 'sticks', part: 'foreR', at: [0, -0.14, 0.01], rot: [0, 0, 0] };
  const VSIGN = { id: 'vsign', part: 'foreR', at: [0, -0.16, 0], rot: [0, 0, 0] };
  const MIC = { id: 'mic', part: 'foreR', at: [0, -0.13, 0], rot: [PI, 0, 0] };
  const STICK_LIGHT = { id: 'glowstick', part: 'foreR', at: [0, -0.13, 0], rot: [PI, 0, 0] };

  function cam(eye, at, fov, t, shake, roll) {
    const k = shake || 0;
    const w = [(0.02 * S(t * 1.3) + 0.01 * S(t * 2.9)) * k, 0.015 * S(t * 1.7 + 1) * k, 0.01 * S(t * 1.1 + 2) * k];
    const e = V3.add(eye, w);
    const a = V3.add(at, V3.mul(w, 0.6));
    const f = V3.norm(V3.sub(a, e));
    let rt = V3.cross(f, [0, 1, 0]);
    if (V3.len(rt) < 1e-4) rt = [1, 0, 0];
    rt = V3.norm(rt);
    const up0 = V3.cross(rt, f);
    const rl = roll || 0;
    return { eye: e, at: a, fov, up: V3.add(V3.mul(up0, C(rl)), V3.mul(rt, S(rl))) };
  }

  const local = (v, t) => clamp((t - v.start) / Math.max(0.01, v.end - v.start), 0, 1);

  const wide = (c) => Object.assign(c, { near: 0.1, far: 420 });

  function worldClub(t, v) {
    const u = local(v, t);
    return { cast: [], extras: {}, camera: cam([1.5 + 0.25 * u, 2.3 + 0.1 * S(t * 0.8), 4.9 - 0.25 * u], [-0.35 - 0.1 * u, 5.7, 1.3], 60, t, 0.6, 0.2) };
  }

  function worldHud(t, v) {
    const u = t - v.start;
    const split = v.cam === 'split';
    const light = split ? 1 : clamp(0.15 + u / 1.8, 0.15, 1);
    const open = split ? clamp((u - 0.2) / 1.2, 0, 1) : 0;
    const dur = v.end - v.start;
    const fly = split && dur > 1 ? clamp((u - (dur - 0.75)) / 0.6, 0, 1) : 0;
    return { cast: [], extras: { split, light, open, fly, spin: t * 0.55 }, camera: cam([0, 0, 6.2], [0, 0, 0], 38, t, 0.4, 0.03 * S(t * 0.7)) };
  }

  function worldEat(t, v) {
    const p = seated(base(0.02, -0.12, 0));
    if (v.gray) slumped(p); else eating(p, t);
    const tt = v.gray ? v.end : t;
    const bowls = clamp(2 + Math.floor((tt - v.start) / 0.5), 2, v.gray ? 7 : 6);
    return {
      cast: [girl(p, v.gray ? [] : [STICKS])],
      extras: { color: v.color, gray: v.gray, bowls },
      camera: cam([0, 0.92, 3.7], [0, 0.9, -0.1], 14.5, t, 0)
    };
  }

  function worldRoom(t, v) {
    const b = beatAt(t);
    const party = v.cam === 'party';
    const u = local(v, t);
    const p = dj(base(0, -0.85, 0), b, t, party ? 1 : 0.55);
    if (party && frac(b / 2) < 0.3) p.face = 'oh';
    const camera = party
      ? cam([0.2 * S(t * 0.45), 0.8 + 0.05 * S(t * 0.6), 3.3 - 0.3 * u], [0, 1.12, -1.0], 48, t, 0.5)
      : cam([0, 1.12, 2.45 - 0.15 * u], [0, 0.95, -1.2], 50, t, 0.25);
    return { cast: [girl(p)], extras: { party, beat: b }, camera };
  }

  const GATES = 10;
  const GATE_GAP = 2.7;
  const HOUSE_Z = -38;

  function worldTorii(t, v) {
    const u = local(v, t);
    const dur = v.end - v.start;
    const b = beatAt(t);
    const p = idle(base(0, HOUSE_Z + 1.4, 0), b, t);
    let camera;
    if (v.cam === 'door') camera = cam([0.5 - 0.2 * u, 0.55, HOUSE_Z + 7.6 - 2.4 * u], [0, 2.3, HOUSE_Z], 60, t, 0.4, 0.02);
    else if (v.cam === 'break') camera = cam([0.3, 0.48, 1.5 - 6 * u], [0.1, 3.4, -24], 64, t, 0.4, 0.02);
    else {
      const z = 3 - dur * 5.2 * u;
      camera = cam([0.35, 0.42, z], [0.1, 2.1, z - 12], 64, t, 0.5, 0.02);
    }
    wide(camera);
    return { cast: [girl(p)], extras: { wobble: v.cam === 'wobble' ? u : 0, crack: v.cam === 'break' ? u : 0, beat: b, door: v.cam === 'door' }, camera };
  }

  function deckCam(k, t) {
    return cam(mix3([0, 0.98, 2.1], [0, 1.1, 0.78], k), mix3([0, 0.84, 0], [0, 1.06, 0], k), 38, t, 0.2);
  }

  function worldDeck(t, v) {
    const b = beatAt(t);
    const p = dj(base(0, 0, 0), b, t, 1);
    let camera;
    let hue = 0;
    if (v.cam === 'strip') {
      if (t - v.start < 0.12) p.face = 'open';
      camera = cam([0, 1.0, 1.12], [0, 0.93, 0], 52, t, 0.2);
    } else if (v.cam === 'panel') {
      const tt = v.dim ? v.end : t;
      camera = deckCam(ease((tt - v.start) / Math.min(1.8, v.end - v.start)), t);
      if (tt - v.start < 0.15) p.face = 'open';
    } else {
      const k = ease((t - 38) / 6);
      camera = cam(mix3([0, 1.02, 1.55], [0, 1.1, 0.95], k), mix3([0, 0.9, 0], [0, 1.02, 0], k), 40, t, 0.3);
      if (t < 38.35) p.face = 'open';
      hue = t >= 39.12 && t < 40.16 ? 1 : t >= 40.16 && t < 41 ? 2 : t >= 41 && t < 42 ? 3 : 0;
    }
    return { cast: [girl(p)], extras: { hue, bloom: v.cam === 'solo' ? clamp((t - 41.5) / 2.4, 0, 1) : 0 }, camera };
  }

  const STAGE_Y = 0.7;
  const STAGE_CAMS = {
    front: (t, u) => cam([0.3 * S(t * 0.4), 1.25 + 0.08 * S(t * 0.3), 3.5 - 0.35 * u], [0, 1.9, -1.5], 50, t, 0.6, 0.03 * S(t * 0.5)),
    low: (t, u) => cam([-2.5 + 0.4 * u, 0.6, 4.6], [0.3, 2.3, -2], 52, t, 0.6, -0.05),
    sweep: (t, u) => cam(mix3([0.2, 1.25, 3.5], [2.8, 1.15, 2.9], ease(u)), [0, 1.9, -1.5], 50, t, 0.6, 0.04 * ease(u)),
    close: (t, u) => cam([0.35 - 0.15 * u, 1.35, 2.3 - 0.3 * u], [0, 1.65, -1.4], 44, t, 0.5)
  };

  function worldStage(t, v) {
    const b = beatAt(t);
    const u = local(v, t);
    const p = dj(base(0, -1.52, 0), b, t, 1);
    p.lift = STAGE_Y;
    const rainbow = v.rainbow && inside(t, v.rainbow[0], v.rainbow[1]);
    return { cast: [girl(p)], extras: { beat: b, rainbow }, camera: STAGE_CAMS[v.cam](t, u) };
  }

  function worldVhs(t, v) {
    const u = local(v, t);
    const red = v.cam === 'red';
    const p = vsign(base(0, 0, red ? -0.12 : 0.08), t);
    const camera = red
      ? cam([0.1, 1.13, 0.82 - 0.08 * u], [0, 1.1, 0], 38, t, 0.8, 0.12)
      : cam([0.04, 1.0, 1.34 - 0.14 * u], [0, 0.98, 0], 40, t, 0.35);
    return { cast: [girl(p, [VSIGN])], extras: { red }, camera };
  }

  const TOWER_X = 200;
  const LANTERN_X = 400;
  const DOME_ON = [[77.52, 78.12], [78.88, 80], [80.6, 80.92], [81.7, 84.1]];
  const domeOn = (t) => DOME_ON.some(([a, b]) => inside(t, a, b));

  function worldStreet(t, v) {
    const u = local(v, t);
    const b = beatAt(t);
    if (v.cam === 'lantern') {
      const p = idle(base(LANTERN_X, -3.25, 0.2), b, t);
      return { cast: [girl(p)], extras: { dome: true, purple: true }, camera: wide(cam([LANTERN_X - 0.6, 1.0, 1.2], [LANTERN_X + 0.45, 1.3, -3.6], 50, t, 0.3)) };
    }
    if (v.cam === 'towers') {
      return { cast: [], extras: { dome: true }, camera: wide(cam([TOWER_X + 0.2, 0.5, 0.4 * u], [TOWER_X + 1.2 + 1.5 * u, 11 - 8 * ease(u), -20], 66, t, 0.4)) };
    }
    return { cast: [], extras: { dome: domeOn(t) }, camera: wide(cam([0.3 + 0.5 * u, 1.0, 0.6 - 1.6 * u], [-0.6, 6.4, -30], 66, t, 0.3)) };
  }

  function worldSplit(t, v) {
    const u = local(v, t);
    if (v.cam === 'blue') {
      const p = micPose(base(-0.22, 0, 0.35), t);
      return { cast: [girl(p, [MIC])], extras: { kind: 'blue', drone: [0.62, 1.06, -0.15], droneScale: 2.2 }, camera: cam([0.18, 1.1, 1.25 - 0.1 * u], [0.18, 1.06, 0], 38, t, 0.4, 0.04) };
    }
    if (v.cam === 'pink') {
      const p = cheerPose(base(0, 0, -0.2), t);
      return { cast: [girl(p, [STICK_LIGHT])], extras: { kind: 'pink', drone: [0.62, 1.32, -0.3], droneScale: 1.4 }, camera: cam([0, 0.8, 3.3 - 0.15 * u], [0, 0.76, 0], 26, t, 0.4, -0.05) };
    }
    const p = idle(base(0, 0, 0), beatAt(t), t);
    return { cast: [girl(p)], extras: { kind: 'scribble' }, camera: cam([0, 1.0, 5.6], [0, 0.8, 0], 30, t, 0.5) };
  }

  function worldTitle(t, v) {
    return { cast: [], extras: { style: v.cam }, camera: cam([0, 0, 3.4], [0, 0, 0], 40, t, 0) };
  }

  const WORLDS = { club: worldClub, hud: worldHud, eat: worldEat, room: worldRoom, torii: worldTorii, deck: worldDeck, stage: worldStage, vhs: worldVhs, street: worldStreet, split: worldSplit, title: worldTitle };

  const SLOTS = { TL: [0, 0], TR: [1, 0], BL: [0, 1], BR: [1, 1] };
  const cell = (slot) => {
    const [cx, cy] = SLOTS[slot];
    return { x: MAIN.x + (cx * FW) / 2, y: MAIN.y + ((1 - cy) * FH) / 2, w: FW / 2, h: FH / 2 };
  };
  const strip = (i) => ({ x: MAIN.x + (i * FW) / 4, y: MAIN.y, w: FW / 4, h: FH });

  const EAT_COLORS = { cyan: [0.5, 0.92, 0.96], purple: [0.78, 0.63, 0.96], coral: [0.96, 0.46, 0.43], lime: [0.72, 0.95, 0.42] };
  const GRIDS = {
    eat1: [['TL', 7.28, 9.44, 'cyan'], ['TR', 9.44, 11.52, 'purple'], ['BR', 11.52, 13.6, 'coral'], ['BL', 13.6, 15.4, 'lime']],
    eat2: [['TL', 113.96, 116.04, 'cyan'], ['TR', 116.04, 118.12, 'purple'], ['BR', 118.12, 120.16, 'coral'], ['BL', 120.16, 122.2, 'lime']],
    deck1: [['TL', 30.36, 32.44], ['TR', 32.44, 34.28], ['BR', 34.28, 36.12], ['BL', 36.12, 38]],
    deck2: [['TL', 74.4, 76.32], ['TR', 74.88, 76.32], ['BR', 75.36, 76.32], ['BL', 75.84, 76.32]],
    deck3: [['TL', 150.44, 152.44], ['TR', 150.96, 152.44], ['BR', 151.44, 152.44], ['BL', 151.92, 152.44]],
    mix: [['TL', 180.84, 182.84], ['TR', 181.44, 182.84], ['BR', 181.92, 182.84]]
  };

  function viewOf(shot) {
    return { scene: shot.scene, cam: shot.cam, start: shot.start, end: shot.end, rainbow: shot.rainbow };
  }

  function panelsFor(shot, t) {
    const L = shot.layout;
    if (!L) return [{ rect: MAIN, view: viewOf(shot) }];
    if (L === 'strips') {
      const out = [];
      for (let i = 0; i < 4; i++) {
        const s0 = shot.start + i * BEAT;
        if (t < s0) break;
        const dim = i < 3 && t >= s0 + BEAT;
        out.push({ rect: strip(i), view: { scene: 'deck', cam: 'strip', start: s0, end: s0 + BEAT }, dim: dim ? 'dark' : null });
      }
      return out;
    }
    const out = [];
    if (L === 'mix') out.push({ rect: MAIN, view: { scene: 'hud', cam: 'melon', start: shot.start - 2, end: shot.end } });
    const eat = L.startsWith('eat');
    GRIDS[L].forEach(([slot, s0, s1, color]) => {
      if (t < s0) return;
      const done = t >= s1;
      if (eat) out.push({ rect: cell(slot), view: { scene: 'eat', cam: 'eat', start: s0, end: s1, color: EAT_COLORS[color], gray: done } });
      else out.push({ rect: cell(slot), view: { scene: 'deck', cam: 'panel', start: s0, end: s1, dim: done && L === 'deck1' }, dim: done && L === 'deck1' ? 'light' : null });
    });
    return out;
  }

  function primaryView(shot, t) {
    const list = panelsFor(shot, t);
    const live = list.filter(p => !p.dim && !p.view.gray && p.view.scene !== 'hud');
    return (live.length ? live[live.length - 1] : list[list.length - 1] || { view: viewOf(shot) }).view;
  }

  function worldFor(v, t) {
    const st = WORLDS[v.scene](t, v);
    st.cast.forEach(a => {
      const s = solveGirl(a.pose);
      a.m = s.m;
      a.head = s.head;
      a.hips = s.hips;
    });
    return st;
  }

  function stage(t, shot) {
    const v = primaryView(shot, t);
    const st = worldFor(v, t);
    const focus = {};
    st.cast.forEach(a => { focus[a.id] = { head: a.head, hips: a.hips }; });
    return Object.assign(st, { focus, shot, view: v, beat: beatAt(t) });
  }

  function texNet(base, line, seed, cells) {
    return (ctx, w, h) => {
      const g = rand(seed);
      const pts = [];
      for (let i = 0; i < cells; i++) pts.push([g() * w, g() * h]);
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let d1 = 1e9, d2 = 1e9;
          for (let i = 0; i < pts.length; i++) {
            let dx = Math.abs(x - pts[i][0]);
            let dy = Math.abs(y - pts[i][1]);
            if (dx > w / 2) dx = w - dx;
            if (dy > h / 2) dy = h - dy;
            const q = dx * dx + dy * dy;
            if (q < d1) { d2 = d1; d1 = q; } else if (q < d2) d2 = q;
          }
          const e = Math.sqrt(d2) - Math.sqrt(d1);
          const k = e < 1.4 ? 1 : e < 3.4 ? (3.4 - e) / 2 : 0;
          const n = (g() - 0.5) * 16;
          const o = (y * w + x) * 4;
          for (let c = 0; c < 3; c++) d[o + c] = clamp(lerp(base[c], line[c], k) + n, 0, 255);
          d[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
  }

  function texFlesh(ctx, w, h) {
    const cx = w / 2, cy = h / 2, R = w / 2;
    ctx.fillStyle = '#3f7a3a';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.95);
    g.addColorStop(0, '#f4fff0');
    g.addColorStop(0.32, '#d4fae6');
    g.addColorStop(0.76, '#8ce4d0');
    g.addColorStop(0.93, '#66ccb6');
    g.addColorStop(1, '#bfe8a8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.95, 0, PI * 2);
    ctx.fill();
    const q = rand(5);
    ctx.strokeStyle = '#f4fffa';
    ctx.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
      const a = q() * PI * 2, d0 = R * (0.35 + q() * 0.55);
      ctx.beginPath();
      ctx.arc(cx + C(a) * d0 * 0.3, cy + S(a) * d0 * 0.3, d0 * 0.5, a, a + 0.5 + q());
      ctx.stroke();
    }
    ctx.fillStyle = '#f6efd0';
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * PI * 2 + q() * 0.1, d0 = R * (0.16 + q() * 0.1);
      ctx.save();
      ctx.translate(cx + C(a) * d0, cy + S(a) * d0);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 3.5, 0, 0, PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const FACES = ['open', 'blink', 'calm', 'happy', 'chew', 'oh', 'sleepy', 'sing', 'wink'];
  const SKIN_CSS = '#ffe6d8';

  function drawFace(kind) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(255, 145, 160, 0.35)';
      [54, 202].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 160, 15, 7, 0, 0, PI * 2); ctx.fill(); });
      ctx.fillStyle = '#cca090';
      ctx.beginPath();
      ctx.ellipse(128, 154, 1.8, 2.8, 0, 0, PI * 2);
      ctx.fill();
      const eyeY = 120;
      [82, 174].forEach((x, i) => {
        const s = i ? 1 : -1;
        const shut = ['blink', 'happy', 'chew'].includes(kind) || (kind === 'wink' && i === 0);
        if (shut) {
          ctx.strokeStyle = '#14161f';
          ctx.lineWidth = 6.5;
          ctx.beginPath();
          if (kind === 'happy' || kind === 'chew' || kind === 'wink') {
            ctx.moveTo(x - 23, eyeY + 5);
            ctx.quadraticCurveTo(x, eyeY - 15, x + 23, eyeY + 5);
          } else {
            ctx.moveTo(x - 25, eyeY - 1);
            ctx.quadraticCurveTo(x, eyeY + 12, x + 25, eyeY - 1);
          }
          ctx.stroke();
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x + s * 23, eyeY);
          ctx.lineTo(x + s * 31, eyeY - 6);
          ctx.stroke();
          return;
        }
        const topArch = (kind === 'calm' || kind === 'sing') ? -25 : -30;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x - 25, eyeY - 2);
        ctx.quadraticCurveTo(x - s * 2, eyeY + topArch, x + 25, eyeY - 3);
        ctx.quadraticCurveTo(x + 22, eyeY + 26, x, eyeY + 27);
        ctx.quadraticCurveTo(x - 22, eyeY + 26, x - 25, eyeY - 2);
        ctx.closePath();
        ctx.fillStyle = '#fcfbfe';
        ctx.fill();
        ctx.clip();
        const gx = x + (i ? -2 : 2);
        const g = ctx.createLinearGradient(0, eyeY - 22, 0, eyeY + 26);
        g.addColorStop(0, '#38060e');
        g.addColorStop(0.32, '#8e101e');
        g.addColorStop(0.68, '#de2232');
        g.addColorStop(1, '#ff5e68');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(gx, eyeY + 3, 19, 24, 0, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#28050b';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.fillStyle = '#ff7680';
        ctx.beginPath();
        ctx.ellipse(gx, eyeY + 11, 12.5, 9.5, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1c0408';
        ctx.beginPath();
        ctx.ellipse(gx, eyeY + 3, 8.2, 11.5, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(24, 6, 14, 0.34)';
        ctx.fillRect(x - 30, eyeY - 28, 60, 14);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(gx - 6.5, eyeY - 6, 6.2, 7.2, -0.15, 0, PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(gx + 7.5, eyeY + 11.5, 3.2, 0, PI * 2);
        ctx.fill();
        ctx.restore();
        if (kind === 'sleepy') {
          ctx.fillStyle = SKIN_CSS;
          ctx.fillRect(x - 30, eyeY - 34, 60, 31);
          ctx.strokeStyle = '#14161f';
          ctx.lineWidth = 6.5;
          ctx.beginPath();
          ctx.moveTo(x - 25, eyeY - 2);
          ctx.lineTo(x + 25, eyeY - 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#12141c';
          ctx.lineWidth = 7.2;
          ctx.beginPath();
          ctx.moveTo(x - 25, eyeY - 2);
          ctx.quadraticCurveTo(x - s * 2, eyeY + topArch, x + 25, eyeY - 3);
          ctx.stroke();
          ctx.fillStyle = '#12141c';
          ctx.beginPath();
          ctx.moveTo(x + s * 20, eyeY - 7);
          ctx.lineTo(x + s * 32, eyeY - 12);
          ctx.lineTo(x + s * 24, eyeY - 1);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#2e242a';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(x - 14, eyeY + 24);
          ctx.quadraticCurveTo(x, eyeY + 28, x + 14, eyeY + 24);
          ctx.stroke();
        }
      });
      ctx.strokeStyle = '#181c26';
      ctx.lineWidth = 3.6;
      [82, 174].forEach((x, i) => {
        const s = i ? 1 : -1;
        const lift = (kind === 'open' || kind === 'oh') ? -2 : 0;
        ctx.beginPath();
        ctx.moveTo(x - s * 17, 96 + lift);
        ctx.quadraticCurveTo(x, 91 + lift, x + s * 19, 94 + lift);
        ctx.stroke();
      });
      ctx.strokeStyle = '#7a3834';
      ctx.fillStyle = '#8e242c';
      ctx.lineWidth = 3.4;
      const mx = 128, my = 192;
      if (kind === 'oh' || kind === 'sing') {
        ctx.beginPath();
        ctx.ellipse(mx, my + 2, kind === 'sing' ? 9.5 : 7, kind === 'sing' ? 12 : 9, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f27882';
        ctx.beginPath();
        ctx.ellipse(mx, my + 6.5, 5, 3.5, 0, 0, PI * 2);
        ctx.fill();
      } else if (kind === 'happy' || kind === 'wink') {
        ctx.beginPath();
        ctx.moveTo(mx - 12, my - 1);
        ctx.quadraticCurveTo(mx, my + 8, mx + 12, my - 1);
        ctx.stroke();
      } else if (kind === 'chew') {
        ctx.beginPath();
        ctx.moveTo(mx - 12, my);
        ctx.quadraticCurveTo(mx - 6, my + 6.5, mx, my);
        ctx.quadraticCurveTo(mx + 6, my + 6.5, mx + 12, my);
        ctx.stroke();
      } else if (kind === 'sleepy' || kind === 'calm') {
        ctx.beginPath();
        ctx.moveTo(mx - 7.5, my + 1);
        ctx.quadraticCurveTo(mx, my + 3, mx + 7.5, my + 1);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(mx - 9, my);
        ctx.quadraticCurveTo(mx, my + 5.5, mx + 9, my);
        ctx.stroke();
      }
      ctx.restore();
    };
  }

  function drawDroneFace(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1a1a14';
    [44, 84].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 58, 9, 13, 0, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = '#ffffff';
    [44, 84].forEach(x => { ctx.beginPath(); ctx.arc(x - 3, 52, 4, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = '#ff9aa6';
    [26, 102].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 76, 9, 5, 0, 0, PI * 2); ctx.fill(); });
    ctx.strokeStyle = '#1a1a14';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(56, 80);
    ctx.quadraticCurveTo(64, 88, 72, 80);
    ctx.stroke();
  }

  function drawChibiHead(ctx, hx, hy, s) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    [-1, 1].forEach(k => {
      ctx.fillStyle = '#181c28';
      ctx.beginPath();
      ctx.moveTo(hx + k * 10 * s, hy - 38 * s);
      ctx.lineTo(hx + k * 34 * s, hy - 96 * s);
      ctx.lineTo(hx + k * 46 * s, hy - 26 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dce0ec';
      ctx.beginPath();
      ctx.moveTo(hx + k * 16 * s, hy - 38 * s);
      ctx.lineTo(hx + k * 33 * s, hy - 84 * s);
      ctx.lineTo(hx + k * 40 * s, hy - 30 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d8b4bc';
      ctx.beginPath();
      ctx.moveTo(hx + k * 19 * s, hy - 38 * s);
      ctx.lineTo(hx + k * 31 * s, hy - 64 * s);
      ctx.lineTo(hx + k * 37 * s, hy - 32 * s);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = '#181c28';
    ctx.beginPath();
    ctx.arc(hx, hy - 4 * s, 54 * s, 0, PI * 2);
    ctx.fill();
    [-1, 1].forEach(k => {
      ctx.fillStyle = '#181c28';
      ctx.beginPath();
      ctx.moveTo(hx + k * 36 * s, hy - 18 * s);
      ctx.lineTo(hx + k * 54 * s, hy - 10 * s);
      ctx.lineTo(hx + k * 50 * s, hy + 46 * s);
      ctx.lineTo(hx + k * 32 * s, hy + 46 * s);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = '#ffe6d8';
    ctx.beginPath();
    ctx.ellipse(hx, hy + 10 * s, 43 * s, 39 * s, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 145, 160, 0.42)';
    [-25, 25].forEach(dx => {
      ctx.beginPath();
      ctx.ellipse(hx + dx * s, hy + 24 * s, 7 * s, 3.8 * s, 0, 0, PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#181c28';
    ctx.beginPath();
    ctx.arc(hx, hy - 4 * s, 54 * s, PI * 1.04, PI * 1.96);
    ctx.lineTo(hx + 46 * s, hy + 2 * s);
    ctx.lineTo(hx + 16 * s, hy + 3 * s);
    ctx.lineTo(hx + 11 * s, hy - 14 * s);
    ctx.lineTo(hx + 6 * s, hy + 3 * s);
    ctx.lineTo(hx - 46 * s, hy + 2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2e354a';
    ctx.beginPath();
    ctx.ellipse(hx, hy - 22 * s, 34 * s, 6 * s, 0, 0, PI * 2);
    ctx.fill();
    [-1, 1].forEach(k => {
      ctx.fillStyle = '#181c28';
      ctx.beginPath();
      ctx.moveTo(hx + k * 35 * s, hy - 8 * s);
      ctx.lineTo(hx + k * 49 * s, hy - 8 * s);
      ctx.lineTo(hx + k * 46 * s, hy + 44 * s);
      ctx.lineTo(hx + k * 33 * s, hy + 44 * s);
      ctx.lineTo(hx + k * 33 * s, hy + 22 * s);
      ctx.lineTo(hx + k * 37 * s, hy + 22 * s);
      ctx.closePath();
      ctx.fill();
    });
    [-18, 18].forEach((dx, i) => {
      const k = i ? 1 : -1;
      const ex = hx + dx * s, ey = hy + 15 * s;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 9.5 * s, 11.5 * s, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c81d2c';
      ctx.beginPath();
      ctx.ellipse(ex, ey + 1 * s, 7.8 * s, 9.8 * s, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff6470';
      ctx.beginPath();
      ctx.ellipse(ex, ey + 5 * s, 5.5 * s, 4 * s, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#220408';
      ctx.beginPath();
      ctx.arc(ex, ey + 1 * s, 3.8 * s, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 2.8 * s, ey - 3.2 * s, 2.8 * s, 0, PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + 2.8 * s, ey + 4.5 * s, 1.5 * s, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#12141c';
      ctx.lineWidth = 3.2 * s;
      ctx.beginPath();
      ctx.moveTo(ex - 10 * s, ey - 5 * s);
      ctx.quadraticCurveTo(ex, ey - 13 * s, ex + 10 * s, ey - 5 * s);
      ctx.stroke();
      ctx.fillStyle = '#12141c';
      ctx.beginPath();
      ctx.moveTo(ex + k * 8 * s, ey - 7 * s);
      ctx.lineTo(ex + k * 13 * s, ey - 10 * s);
      ctx.lineTo(ex + k * 10 * s, ey - 4 * s);
      ctx.closePath();
      ctx.fill();
    });
    ctx.strokeStyle = '#8e242c';
    ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    ctx.moveTo(hx - 4.5 * s, hy + 34 * s);
    ctx.quadraticCurveTo(hx, hy + 37 * s, hx + 4.5 * s, hy + 34 * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawMelonArt(ctx, x, y, R, seed) {
    ctx.fillStyle = '#e4f4d4';
    ctx.beginPath();
    ctx.arc(x, y, R, 0, PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, R, 0, PI * 2);
    ctx.clip();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    const q = rand(seed);
    for (let i = 0; i < 44; i++) {
      const a = q() * PI * 2, d = q() * R;
      ctx.beginPath();
      ctx.arc(x + C(a) * d, y + S(a) * d, 6 + q() * 9, 0, PI * (0.5 + q()));
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#7a8a5a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, PI * 2);
    ctx.stroke();
  }

  function drawSign(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ff6fd8');
    g.addColorStop(1, '#b0209c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff9ae6';
    for (let y = 6; y < h; y += 12) {
      for (let x = (y / 12) % 2 < 1 ? 0 : 6; x < w; x += 12) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, PI * 2);
        ctx.fill();
      }
    }
    drawMelonArt(ctx, 78, 162, 66, 12);
    drawChibiHead(ctx, 176, 168, 0.92);
    ctx.font = 'bold 30px "Arial Black", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const word = 'NIGHT CLUB';
    for (let i = 0; i < word.length; i++) {
      const a = -PI / 2 + (i - (word.length - 1) / 2) * 0.19;
      ctx.save();
      ctx.translate(128 + C(a) * 150, 196 + S(a) * 150);
      ctx.rotate(a + PI / 2);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#6a0a5a';
      ctx.strokeText(word[i], 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(word[i], 0, 0);
      ctx.restore();
    }
  }

  function osd(ctx, s, x, y, size, color) {
    ctx.font = `bold ${size}px "Courier New", Courier, monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0c0c14';
    ctx.strokeText(s, x, y);
    ctx.fillStyle = color || '#f2f2f2';
    ctx.fillText(s, x, y);
  }

  function battery(ctx, x, y, bars) {
    ctx.fillStyle = '#0c0c14';
    ctx.fillRect(x - 6, y - 2, 42, 17);
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(x, y, 34, 13);
    ctx.fillRect(x - 4, y + 4, 4, 5);
    ctx.fillStyle = '#0c0c14';
    ctx.fillRect(x + 2, y + 2, 30, 9);
    ctx.fillStyle = '#f2f2f2';
    for (let i = 0; i < bars; i++) ctx.fillRect(x + 25 - i * 7, y + 3, 5, 7);
  }

  function drawCamHud(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#17152f';
    ctx.fillRect(0, 0, w, 15);
    ctx.fillRect(0, h - 15, w, 15);
    battery(ctx, 28, 30, 3);
    ctx.fillStyle = '#0c0c14';
    ctx.fillRect(23, 62, 25, 29);
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(25, 64, 21, 25);
    ctx.fillStyle = '#17152f';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', 35.5, 77);
    osd(ctx, '28 MIN', 330, 37, 18);
    osd(ctx, 'T45', 424, 37, 18);
    osd(ctx, 'REC', 452, 79, 18);
    [453, 464].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, 100);
      ctx.lineTo(x + 9, 106);
      ctx.lineTo(x, 112);
      ctx.closePath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0c0c14';
      ctx.stroke();
      ctx.fillStyle = '#f2f2f2';
      ctx.fill();
    });
    osd(ctx, 'AUTO DATE', 388, 254, 18);
    [256, 316].forEach(x => {
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(x - 7, 143, 15, 2);
      ctx.fillRect(x - 1, 137, 2, 14);
    });
  }

  const FS_LINES = ['MELON SCAN', 'CROP 2001-08-15', 'MASS 3.2 KG', 'RIND 9 MM', 'SUGAR 14 BRIX', 'NET 88 %', 'SEEDS 412', '', 'TARGET LOCKED', 'SLICE MODE 2', 'BLADE: SPOON', 'RANGE 1.2 M', '', 'CHILL 4 C', 'JUICE 71 %'];

  function drawFsHud(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const stripes = (y0) => {
      ctx.fillStyle = '#f7e8f4';
      ctx.fillRect(0, y0, w, 12);
      ctx.fillStyle = '#ff5aa8';
      for (let x = -12; x < w + 12; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, y0 + 12);
        ctx.lineTo(x + 6, y0 + 12);
        ctx.lineTo(x + 12, y0);
        ctx.lineTo(x + 6, y0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#2a0a30';
      ctx.fillRect(0, y0 ? y0 - 2 : 12, w, 2);
    };
    stripes(0);
    stripes(h - 12);
    battery(ctx, 64, 30, 4);
    osd(ctx, 'F5.2', 168, 37, 22);
    ctx.fillStyle = '#ff2a2a';
    ctx.beginPath();
    ctx.arc(388, 37, 4, 0, PI * 2);
    ctx.fill();
    osd(ctx, 'REC', 398, 37, 22);
    const column = () => {
      ctx.font = 'bold 8px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      FS_LINES.forEach((s, i) => {
        ctx.fillStyle = i % 4 === 0 ? '#d8c040' : '#3cc8a0';
        ctx.fillText(s, 6, 54 + i * 13);
      });
      ctx.fillStyle = '#3cc8a0';
      ctx.fillRect(6, 150, 88, 1);
      ctx.fillRect(6, 244, 88, 1);
    };
    column();
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    column();
    ctx.restore();
    ctx.fillStyle = '#f2f2f2';
    ctx.beginPath();
    ctx.moveTo(250, 232);
    ctx.lineTo(262, 232);
    ctx.lineTo(262, 240);
    ctx.lineTo(256, 245);
    ctx.lineTo(250, 240);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(255, 250, 2, 8);
  }

  function drawVhsHud(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    osd(ctx, 'CH', 26, 38, 18, '#f0f0e8');
    osd(ctx, '5', 86, 38, 18, '#f0f0e8');
    ctx.fillStyle = '#0c0c14';
    ctx.fillRect(452, 48, 26, 16);
    ctx.fillStyle = '#f0f0e8';
    ctx.fillRect(454, 50, 22, 12);
    ctx.fillStyle = '#0c0c14';
    [459, 471].forEach(x => { ctx.beginPath(); ctx.arc(x, 56, 3, 0, PI * 2); ctx.fill(); });
    osd(ctx, 'COUNT', 30, 232, 16, '#f0f0e8');
    ctx.fillStyle = '#f0f0e8';
    [[32, 14], [52, 6], [64, 14]].forEach(([x, wd]) => ctx.fillRect(x, 246, wd, 3));
  }

  function drawVhsRedHud(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textBaseline = 'middle';
    [['#ff2424', -3, 0], ['#24ff4a', 0, -1], ['#3a64ff', 3, 1]].forEach(([c, o, v]) => {
      ctx.fillStyle = c;
      ctx.fillText('CH  5', 26 + o, 38 + v);
      ctx.fillText('COUNT', 30 + o, 232 + v);
      ctx.fillText('00:00:12:15', 356 + o, 250 + v);
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawIsoHud(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    osd(ctx, '1/180  F5.2', 22, 34, 18);
    ctx.fillStyle = '#ff2a2a';
    ctx.beginPath();
    ctx.arc(440, 34, 4, 0, PI * 2);
    ctx.fill();
    osd(ctx, 'REC', 450, 34, 18);
    osd(ctx, 'ISO  AUTO', 26, 252, 18);
    const cx = 256, cy = 144, bw = 32, bh = 28, L = 12;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      const x = cx + sx * bw, y = cy + sy * bh;
      ctx.fillStyle = '#0c0c14';
      ctx.fillRect(Math.min(x, x - sx * L) - 1, y - 2, L + 2, 4);
      ctx.fillRect(x - 2, Math.min(y, y - sy * L) - 1, 4, L + 2);
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(Math.min(x, x - sx * L), y - 1, L, 2);
      ctx.fillRect(x - 1, Math.min(y, y - sy * L), 2, L);
    });
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(cx - 8, cy - 1, 16, 2);
    ctx.fillRect(cx - 1, cy - 8, 2, 16);
  }

  function drawIsoGrid(ctx, w, h) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a3a3a';
    for (let x = 0; x < w; x += 24) ctx.fillRect(x, 0, 1, h);
    for (let y = 0; y < h; y += 24) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = '#6a6a6a';
    ctx.beginPath();
    ctx.arc(256, 144, 70, 0, PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4a4a4a';
    ctx.stroke();
  }

  const DIGITS = '0123456789:';

  function drawDigits(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < DIGITS.length; i++) {
      const x = i * 20 + 10;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0c0c14';
      ctx.strokeText(DIGITS[i], x, 17);
      ctx.fillStyle = '#f2f2f2';
      ctx.fillText(DIGITS[i], x, 17);
    }
  }

  function drawTitle(style) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      ctx.font = 'bold 66px "Arial Black", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const x = w / 2, y = h / 2 + 2, s = 'Neck Hurts';
      if (style === 'neon') {
        ctx.shadowColor = '#2a5aff';
        ctx.shadowBlur = 22;
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#6a8cff';
        ctx.strokeText(s, x, y);
        ctx.shadowBlur = 6;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#eef2ff';
        ctx.strokeText(s, x, y);
      } else if (style === 'fire') {
        ctx.shadowColor = '#ff5a00';
        ctx.shadowBlur = 20;
        const g = ctx.createLinearGradient(0, y - 30, 0, y + 30);
        g.addColorStop(0, '#ffe860');
        g.addColorStop(0.5, '#ff7a1a');
        g.addColorStop(1, '#e0101a');
        ctx.fillStyle = g;
        ctx.fillText(s, x, y);
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff4c0';
        ctx.strokeText(s, x, y);
      } else {
        ctx.globalCompositeOperation = 'lighter';
        [['#ff2a2a', -5, 0], ['#2aff5a', 0, -2], ['#3a5aff', 5, 2]].forEach(([c, dx, dy]) => {
          ctx.shadowColor = c;
          ctx.shadowBlur = 16;
          ctx.fillStyle = c;
          ctx.fillText(s, x + dx, y + dy);
        });
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(s, x, y);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    };
  }

  function drawNeonWord(ctx, w, h) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.font = 'bold 100px "Arial Black", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#9adfff';
    ctx.strokeText('MELON', w / 2, h / 2 + 4);
    ctx.shadowBlur = 4;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText('MELON', w / 2, h / 2 + 4);
  }

  function drawPoster(kind) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(0, 0, w, h);
      const bg = ['#c8342a', '#2a8a8a', '#f4a040'][kind];
      ctx.fillStyle = bg;
      ctx.fillRect(12, 22, w - 24, h - 44);
      if (kind === 0) {
        ctx.fillStyle = '#5c9a3c';
        ctx.beginPath();
        ctx.arc(64, 150, 44, 0, PI);
        ctx.fill();
        ctx.fillStyle = '#9fe8c8';
        ctx.beginPath();
        ctx.arc(64, 150, 38, 0, PI);
        ctx.fill();
        ctx.fillStyle = '#f6efd0';
        for (let i = 0; i < 7; i++) {
          ctx.beginPath();
          ctx.ellipse(40 + i * 8, 162 + (i % 2) * 6, 2.5, 4, 0, 0, PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(64, 80, 26, 0, PI * 2);
        ctx.fill();
      } else if (kind === 1) {
        ctx.fillStyle = '#141822';
        ctx.beginPath();
        ctx.moveTo(36, 110);
        ctx.lineTo(92, 110);
        ctx.lineTo(96, 202);
        ctx.lineTo(32, 202);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffe6d8';
        ctx.fillRect(80, 138, 11, 38);
        ctx.fillStyle = '#cc1f2a';
        ctx.fillRect(80, 145, 11, 5);
        ctx.fillStyle = '#1a1d28';
        ctx.fillRect(80, 158, 11, 18);
        ctx.fillStyle = '#f5f7fc';
        ctx.beginPath();
        ctx.moveTo(42, 134);
        ctx.lineTo(84, 134);
        ctx.lineTo(82, 174);
        ctx.lineTo(44, 174);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1d6876';
        ctx.beginPath();
        ctx.moveTo(31, 134);
        ctx.lineTo(62, 134);
        ctx.lineTo(58, 178);
        ctx.lineTo(27, 174);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#eef2fa';
        ctx.beginPath();
        ctx.moveTo(34, 156);
        ctx.lineTo(39, 148);
        ctx.lineTo(44, 156);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1c202c';
        ctx.fillRect(61, 135, 6, 36);
        ctx.fillRect(46, 148, 36, 3);
        ctx.strokeStyle = '#f2c830';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(57, 136);
        ctx.lineTo(51, 154);
        ctx.stroke();
        ctx.fillStyle = '#6e4598';
        ctx.fillRect(48, 153, 6, 8);
        ctx.fillStyle = '#181b24';
        ctx.beginPath();
        ctx.moveTo(41, 174);
        ctx.lineTo(87, 174);
        ctx.lineTo(95, 214);
        ctx.lineTo(33, 214);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c4cad6';
        ctx.beginPath();
        ctx.moveTo(44, 178);
        ctx.lineTo(51, 178);
        ctx.lineTo(48, 214);
        ctx.lineTo(39, 214);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#141720';
        ctx.fillRect(42, 168, 44, 11);
        ctx.fillStyle = '#d8dde8';
        ctx.fillRect(59, 170, 10, 7);
        ctx.fillStyle = '#e5b53a';
        ctx.fillRect(62, 177, 4, 12);
        drawChibiHead(ctx, 64, 106, 0.52);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px "MS Gothic", "Meiryo", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ['メ', 'ロ', 'ン'].forEach((ch, i) => ctx.fillText(ch, 64, 64 + i * 42));
        drawMelonArt(ctx, 64, 196, 18, 3);
      }
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(0, 0, w, 8);
      ctx.fillRect(0, h - 8, w, 8);
    };
  }

  function drawTatami(ctx, w, h) {
    ctx.fillStyle = '#b8d2c4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9cbaaa';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = '#34485a';
    ctx.fillRect(0, 0, w, 9);
    ctx.fillRect(0, 0, 9, h);
    ctx.fillStyle = '#8aa6d8';
    for (let x = 4; x < w; x += 10) ctx.fillRect(x, 3, 4, 3);
    for (let y = 4; y < h; y += 10) ctx.fillRect(3, y, 3, 4);
  }

  function drawShoji(ctx, w, h) {
    ctx.fillStyle = '#f4f0e4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4a3422';
    for (let x = 0; x <= w; x += 32) ctx.fillRect(x - 2, 0, 4, h);
    for (let y = 0; y <= h; y += 42) ctx.fillRect(0, y - 2, w, 4);
    ctx.fillRect(0, 0, 6, h);
    ctx.fillRect(w - 6, 0, 6, h);
  }

  function drawBrick(ctx, w, h) {
    ctx.fillStyle = '#5a4a58';
    ctx.fillRect(0, 0, w, h);
    const q = rand(31);
    for (let y = 0; y < h; y += 12) {
      for (let x = (y / 12) % 2 < 1 ? 0 : -12; x < w; x += 24) {
        const k = 0.8 + q() * 0.3;
        ctx.fillStyle = `rgb(${Math.round(160 * k)},${Math.round(84 * k)},${Math.round(78 * k)})`;
        ctx.fillRect(x + 1, y + 1, 22, 10);
      }
    }
    ctx.fillStyle = '#3a4a30';
    for (let i = 0; i < 26; i++) ctx.fillRect(q() * w, q() * h, 2 + q() * 5, 8 + q() * 30);
  }

  function drawGlass(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#7a9ae0');
    g.addColorStop(1, '#2a3a78');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a2240';
    for (let x = 0; x < w; x += 16) ctx.fillRect(x, 0, 2, h);
    for (let y = 0; y < h; y += 10) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = '#b8c8f0';
    ctx.fillRect(22, 0, 8, h);
  }

  function drawHatch(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e4e4e4';
    ctx.lineWidth = 3;
    for (let k = -h; k < w; k += 10) {
      ctx.beginPath();
      ctx.moveTo(k, h);
      ctx.lineTo(k + h, 0);
      ctx.stroke();
    }
  }

  function drawLed(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#7a7a7a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const q = rand(44);
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = q() < 0.5 ? '#ffffff' : '#4a4a4a';
      ctx.fillRect(Math.floor((q() * w) / 4) * 4, Math.floor((q() * h) / 4) * 4, 3, 3);
    }
  }

  function drawBoard(ctx, w, h) {
    ctx.fillStyle = '#16120e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f4f0e0';
    ctx.font = 'bold 40px "MS Gothic", "Meiryo", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('メロン', w / 2, h / 2 + 2);
  }

  function drawNoiseBand(ctx, w, h) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    const q = rand(8);
    for (let i = 0; i < 160; i++) {
      const v = Math.floor(120 + q() * 135);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(q() * w, q() * h, 2 + q() * 18, 1);
    }
  }

  function makeTextures(r) {
    const tx = (size, fn, opts) => r.texture(size, fn, opts);
    const faces = {};
    FACES.forEach(f => { faces[f] = tx(256, drawFace(f), { clamp: true }); });
    return {
      net: tx(256, texNet([196, 214, 190], [250, 255, 246], 11, 64)),
      flesh: tx(256, texFlesh, { clamp: true }),
      glow: tx(64, texGlow, { clamp: true }),
      grid: tx(128, texGrid('#3a5aff', '#0a0e40', 32)),
      faces,
      droneFace: tx(128, drawDroneFace, { clamp: true }),
      sign: tx(256, drawSign, { clamp: true }),
      hud: {
        cam: tx(FW, drawCamHud, { height: FH, clamp: true }),
        fs: tx(FW, drawFsHud, { height: FH, clamp: true }),
        vhs: tx(FW, drawVhsHud, { height: FH, clamp: true }),
        vhsRed: tx(FW, drawVhsRedHud, { height: FH, clamp: true }),
        iso: tx(FW, drawIsoHud, { height: FH, clamp: true })
      },
      isoGrid: tx(FW, drawIsoGrid, { height: FH, clamp: true }),
      digits: tx(220, drawDigits, { height: 32, clamp: true }),
      titles: { rainbow: tx(512, drawTitle('rainbow'), { height: 128, clamp: true }), fire: tx(512, drawTitle('fire'), { height: 128, clamp: true }), neon: tx(512, drawTitle('neon'), { height: 128, clamp: true }) },
      neon: tx(512, drawNeonWord, { height: 128, clamp: true }),
      posters: [0, 1, 2].map(k => tx(128, drawPoster(k), { height: 256, clamp: true })),
      tatami: tx(128, drawTatami),
      shoji: tx(128, drawShoji),
      brick: tx(128, drawBrick),
      glass: tx(128, drawGlass),
      hatch: tx(128, drawHatch),
      led: tx(128, drawLed),
      board: tx(128, drawBoard, { height: 64, clamp: true }),
      noise: tx(128, drawNoiseBand, { height: 32, clamp: true }),
      grass: tx(128, texNoise('#6a9a5a', 17, 0.3)),
      stone: tx(128, texNoise('#9a9aa2', 18, 0.25)),
      asphalt: tx(128, texNoise('#4a4a58', 19, 0.3)),
      wood: tx(128, texNoise('#6a4a36', 20, 0.3)),
      windows: tx(128, window.P3DParanoiaKit.tex.texWindows(21, ['#ffd27a', '#ffe8a8', '#9ad0ff']))
    };
  }

  function spherePatch(b, rx, ry, rz, y0, y1, p0, p1, nu, nv, col, uvs) {
    const pt = (u, v) => {
      const yaw = y0 + (y1 - y0) * u, pit = p0 + (p1 - p0) * v;
      const n = [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
      return { p: [n[0] * rx, n[1] * ry, n[2] * rz], n: V3.norm([n[0] / rx, n[1] / ry, n[2] / rz]) };
    };
    const uv = (u, v) => [u * uvs[0], v * uvs[1]];
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const a = pt(u0, v0), bb = pt(u1, v0), c = pt(u1, v1), d = pt(u0, v1);
        b.quad(a.p, bb.p, c.p, d.p, col, uvs ? [uv(u0, v0), uv(u1, v0), uv(u1, v1), uv(u0, v1)] : null, [a.n, bb.n, c.n, d.n]);
      }
    }
    return b;
  }

  function starFan(b, points, rOut, rIn, z, colIn, colOut) {
    const n = points * 2;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const r0 = i % 2 ? rIn : rOut, r1 = i % 2 ? rOut : rIn;
      b.tri([0, 0, z], [C(a0) * r0, S(a0) * r0, z], [C(a1) * r1, S(a1) * r1, z], [colIn, colOut, colOut], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    }
    return b;
  }

  function discXY(b, x, y, z, rad, n, col, normal) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      b.tri([x, y, z], [x + C(a0) * rad, y + S(a0) * rad, z], [x + C(a1) * rad, y + S(a1) * rad, z], col, [[0.5, 0.5], [0.5 + C(a0) * 0.5, 0.5 + S(a0) * 0.5], [0.5 + C(a1) * 0.5, 0.5 + S(a1) * 0.5]], [normal, normal, normal]);
    }
    return b;
  }

  function billboard(camera, pos, sx, sy) {
    const f = V3.norm(V3.sub(camera.at, camera.eye));
    let rt = V3.cross(f, camera.up || [0, 1, 0]);
    if (V3.len(rt) < 1e-4) rt = [1, 0, 0];
    rt = V3.norm(rt);
    const up = V3.cross(rt, f);
    return new Float32Array([rt[0] * sx, rt[1] * sx, rt[2] * sx, 0, up[0] * sy, up[1] * sy, up[2] * sy, 0, -f[0], -f[1], -f[2], 0, pos[0], pos[1], pos[2], 1]);
  }

  function headPatch(b, rx, ry, rz, y0, y1, p0, p1, nu, nv, col, uvs) {
    const pt = (u, v) => {
      const yaw = y0 + (y1 - y0) * u, pit = p0 + (p1 - p0) * v;
      const sp = S(pit), cp = C(pit), sy = S(yaw), cy = C(yaw);
      const low = sp < 0 ? -sp : 0;
      const tx = 1 - 0.18 * low * low;
      const tz = 1 - 0.1 * low * low;
      const chin = sp < -0.25 && cy > 0 ? 0.05 * (low - 0.25) * cy * cy : 0;
      const n = [sy * cp * tx, sp - chin, cy * cp * tz];
      return { p: [n[0] * rx, n[1] * ry, n[2] * rz], n: V3.norm([sy * cp / rx, sp / ry, cy * cp / rz]) };
    };
    const uv = (u, v) => [u * uvs[0], v * uvs[1]];
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const a = pt(u0, v0), bb = pt(u1, v0), c = pt(u1, v1), d = pt(u0, v1);
        b.quad(a.p, bb.p, c.p, d.p, col, uvs ? [uv(u0, v0), uv(u1, v0), uv(u1, v1), uv(u0, v1)] : null, [a.n, bb.n, c.n, d.n]);
      }
    }
    return b;
  }

  function makeGirl(r, T) {
    const L = LOOK;
    const R = HEAD_R;
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    const HP = (yaw, pit, k) => {
      const sp = S(pit), cp = C(pit), sy = S(yaw), cy = C(yaw);
      const low = sp < 0 ? -sp : 0;
      const tx = 1 - 0.18 * low * low;
      const tz = 1 - 0.1 * low * low;
      const chin = sp < -0.25 && cy > 0 ? 0.05 * (low - 0.25) * cy * cy : 0;
      return [sy * cp * tx * R * 0.88 * k, (sp - chin) * R * 0.94 * k, cy * cp * tz * R * 0.9 * k];
    };
    const HN = (yaw, pit) => V3.norm([S(yaw) * C(pit) / 0.88, S(pit) / 0.94, C(yaw) * C(pit) / 0.9]);
    const buildBoot = (b, side) => {
      b.prism(8, 0.036, 0.038, -GIRL.shin * 0.62, 0.045, 0.047, 0.01, L.tights, { capBottom: true });
      if (side > 0) {
        b.prism(8, 0.041, 0.043, -GIRL.shin * 0.5, 0.042, 0.044, -GIRL.shin * 0.41, L.obi, { capTop: false });
        b.at(0.01, -GIRL.shin * 0.455, 0.042, h => h.box(0.018, 0.016, 0.008, L.metal));
      }
      b.prism(8, 0.041, 0.044, -GIRL.shin, 0.041, 0.043, -GIRL.shin * 0.56, L.boot, { capBottom: true });
      b.prism(8, 0.044, 0.047, -GIRL.shin * 0.68, 0.046, 0.049, -GIRL.shin * 0.54, shade(L.boot, 1.25), { capTop: false });
      if (side < 0) {
        b.at(-0.043, -GIRL.shin * 0.64, 0, h => h.box(0.014, 0.036, 0.034, L.obi));
        b.at(-0.05, -GIRL.shin * 0.64, 0.006, h => h.box(0.006, 0.016, 0.016, L.metal));
      }
      b.at(0, -GIRL.shin - GIRL.sole / 2, 0.022, h => {
        h.box(0.072, GIRL.sole, 0.115, L.boot);
        h.at(0, -0.004, 0.056, s => s.prism(6, 0.026, 0.024, -GIRL.sole / 2, 0.034, 0.032, GIRL.sole / 2 - 0.004, L.boot, { capBottom: true }));
        h.at(0, -GIRL.sole / 2 + 0.006, 0.018, s => s.box(0.074, 0.012, 0.125, L.sole));
        h.at(0, -GIRL.sole / 2 + 0.014, -0.042, s => s.box(0.052, 0.028, 0.036, L.sole));
        h.at(0, -GIRL.sole / 2 + 0.008, 0.078, s => s.box(0.042, 0.008, 0.014, L.metal));
      });
    };
    return {
      T,
      head: mk(b => headPatch(b, R * 0.88, R * 0.94, R * 0.9, -PI, PI, -PI / 2, PI / 2, 16, 12, L.skin)),
      face: mk(b => headPatch(b, R * 0.88 * 1.006, R * 0.94 * 1.006, R * 0.9 * 1.006, -0.92, 0.92, -0.74, 0.42, 10, 8, [1, 1, 1, 0], [1, 1])),
      hair: mk(b => {
        const k = 1.08;
        headPatch(b, R * 0.88 * k, R * 0.96 * k, R * 0.92 * k, -PI, PI, 0.13, PI / 2, 16, 6, L.hair);
        headPatch(b, R * 0.89 * k, R * 0.95 * k, R * 0.92 * k, 0.82, 2 * PI - 0.82, -0.92, 0.24, 12, 6, L.hair);
        headPatch(b, R * 0.89 * k, R * 0.95 * k, R * 0.92 * k, 0.55, 0.86, -0.75, 0.24, 3, 6, L.hair);
        headPatch(b, R * 0.89 * k, R * 0.95 * k, R * 0.92 * k, -0.86, -0.55, -0.75, 0.24, 3, 6, L.hair);
        for (let i = 0; i < 9; i++) {
          const a0 = -0.63 + (1.26 * i) / 9, a1 = a0 + 1.26 / 9;
          const partL = i === 5 ? 0.015 : 0.002;
          const partR = i === 4 ? 0.012 : 0.002;
          const b0 = a0 + partL, b1 = a1 - partR;
          const low = i === 0 || i === 8 ? 0.05 : 0.08 + (i === 4 || i === 5 ? 0.025 : 0);
          const col = i >= 3 && i <= 5 ? L.hairHi : L.hair;
          b.quad(HP(b0, 0.36, 1.088), HP(b1, 0.36, 1.088), HP(b1 * 0.97, low, 1.068), HP(b0 * 0.97, low, 1.068), col, null, [HN(b0, 0.3), HN(b1, 0.3), HN(b1, low), HN(b0, low)]);
        }
        [-1, 1].forEach(s => {
          const x0 = s * R * 0.73, x1 = s * R * 0.85;
          const z0 = R * 0.52, z1 = R * 0.18;
          const nSide = V3.norm([s * 0.85, 0.05, 0.45]);
          b.quad([x0, R * 0.16, z0], [x1, R * 0.16, z1], [x1 * 0.94, -R * 1.04, z1 * 0.9], [x0 * 0.9, -R * 1.04, z0 * 0.86], L.hair, null, [nSide, nSide, nSide, nSide]);
          b.quad([x1, R * 0.16, z1], [x0, R * 0.16, z0], [x0 * 0.9, -R * 1.04, z0 * 0.86], [x1 * 0.94, -R * 1.04, z1 * 0.9], L.hairDark);
          b.push(M4.translate(s * R * 0.74, -R * 0.55, R * 0.02), M4.rotZ(-s * 0.03));
          b.prism(4, 0.018, 0.038, -0.18, 0.026, 0.048, 0.18, L.hair, { phase: PI / 4, capBottom: true });
          b.pop();
          for (let j = 0; j < 4; j++) {
            const a = s * (1.45 + j * 0.42);
            b.push(M4.translate(S(a) * R * 0.88, R * (0.1 - j * 0.02), C(a) * R * 0.94), M4.rotY(a));
            b.box(0.042, 0.034, 0.022, j % 2 ? L.hairHi : L.hair);
            b.pop();
          }
        });
        [-1, 1].forEach(s => b.at(s * 0.022, R * 0.03, -R * 0.97, h => h.box(0.012, 0.038, 0.014, L.gold)));
        b.at(0, -R * 0.55, -R * 0.78, h => h.box(R * 1.42, R * 1.2, 0.07, L.hair));
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * R * 0.37, R * 0.74, -R * 0.04), M4.rotZ(-s * 0.11), M4.rotX(0.05));
          const H = 0.31, W = 0.048, D = 0.032;
          const tip = [0, H, 0.004];
          const fl = [-W, 0, D * 0.45], fr = [W, 0, D * 0.45], bk = [0, 0, -D];
          const ml = [-W * 0.62, H * 0.48, D * 0.35], mr = [W * 0.62, H * 0.48, D * 0.35], mb = [0, H * 0.48, -D * 0.62];
          b.quad(fl, bk, mb, ml, L.hair);
          b.quad(bk, fr, mr, mb, L.hair);
          b.tri(ml, mb, tip, L.hairDark);
          b.tri(mb, mr, tip, L.hairDark);
          const il = [-W * 0.68, 0.015, D * 0.48], ir = [W * 0.68, 0.015, D * 0.48], it = [0, H * 0.84, 0.008];
          b.quad(fl, il, it, tip, L.hairDark);
          b.quad(ir, fr, tip, it, L.hairDark);
          b.tri(il, ir, it, L.earInner);
          b.at(0, 0.035, D * 0.54, h => h.prism(3, 0.028, 0.012, -0.02, 0.004, 0.004, 0.085, 0xe4eaf2));
          b.pop();
        });
      }),
      backHair: mk(b => {
        const d = GIRL;
        b.push(M4.translate(0, d.torso + 0.02, -0.105), M4.rotX(0.08));
        b.box(0.26, 0.34, 0.044, L.hair, { base: false });
        for (let i = -3; i <= 3; i++) {
          const x = i * 0.038;
          const len = 0.47 - Math.abs(i) * 0.02;
          b.push(M4.translate(x, -0.02, -0.008 - (i % 2) * 0.005), M4.rotZ(i * 0.022));
          b.prism(4, 0.03, 0.018, -len * 0.72, 0.034, 0.02, 0, i % 2 ? L.hair : L.hairDark, { phase: PI / 4, capBottom: false });
          b.prism(4, 0.005, 0.004, -len, 0.03, 0.018, -len * 0.72, L.hairDark, { phase: PI / 4, capBottom: true });
          b.pop();
        }
        b.pop();
      }),
      torso: mk(b => {
        const d = GIRL;
        b.prism(10, 0.126, 0.098, -0.09, 0.116, 0.09, 0.095, L.obi, { capTop: false, capBottom: true });
        b.prism(10, 0.13, 0.102, -0.09, 0.128, 0.1, -0.062, shade(L.obi, 0.8), { capTop: false });
        b.prism(10, 0.119, 0.093, 0.072, 0.119, 0.093, 0.096, shade(L.obi, 0.8), { capTop: false });
        b.at(0, 0.036, 0.092, h => {
          h.box(0.066, 0.042, 0.012, L.metal);
          h.at(0, 0, 0.004, c => c.box(0.024, 0.024, 0.008, L.obi));
          [-1, 1].forEach(s => h.at(s * 0.044, 0, -0.002, c => c.box(0.014, 0.046, 0.01, L.metal)));
        });
        b.push(M4.translate(0, -0.045, 0.096), M4.rotZ(-0.18));
        b.box(0.155, 0.016, 0.01, L.tie);
        b.pop();
        b.at(0.046, -0.055, 0.103, h => {
          h.box(0.014, 0.014, 0.01, L.gold);
          h.at(0, -0.034, 0, t => t.prism(6, 0.009, 0.009, -0.028, 0.005, 0.005, 0.028, L.gold, { capBottom: true }));
        });
        b.prism(10, 0.115, 0.09, 0.09, 0.144, 0.116, 0.185, L.shirt, { capTop: false });
        b.prism(10, 0.144, 0.116, 0.185, 0.136, 0.108, 0.22, L.shirt, { capTop: false });
        b.prism(10, 0.136, 0.108, 0.22, 0.076, 0.068, d.torso, L.shirt);
        b.prism(8, 0.056, 0.052, d.torso - 0.01, 0.048, 0.046, d.torso + 0.032, L.shirt, { capTop: false });
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.023, d.torso + 0.004, 0.055), M4.rotZ(s * 0.35));
          b.box(0.026, 0.034, 0.012, L.shirt);
          b.pop();
        });
        b.at(0, d.torso - 0.012, 0.066, h => h.box(0.024, 0.026, 0.016, L.tie));
        b.quad([-0.015, 0.1, 0.108], [0.015, 0.1, 0.108], [0.011, d.torso - 0.016, 0.074], [-0.011, d.torso - 0.016, 0.074], L.tie, null, [[0, 0.15, 1], [0, 0.15, 1], [0, 0.15, 1], [0, 0.15, 1]]);
        b.at(0, 0.202, 0.112, h => h.box(0.132, 0.013, 0.012, L.tie));
        b.push(M4.translate(-0.046, 0.2, 0.108), M4.rotX(-0.18), M4.rotZ(0.06));
        b.box(0.024, 0.125, 0.012, L.lanyard);
        b.at(0, -0.072, 0.003, h => {
          h.box(0.026, 0.042, 0.012, L.tag);
          h.at(0, 0.012, 0.004, c => c.box(0.022, 0.008, 0.006, L.lining));
        });
        b.pop();
        b.push(M4.translate(0.052, 0.235, 0.088), M4.rotZ(-0.5), M4.rotX(-0.22));
        b.box(0.022, 0.095, 0.012, L.lanyard);
        b.pop();
        b.at(-0.092, 0.155, 0.012, h => {
          h.box(0.09, 0.22, 0.192, L.coat);
          h.at(0.034, 0.01, 0.088, c => c.box(0.022, 0.21, 0.022, L.coatHi));
          h.at(-0.005, -0.055, 0.095, c => c.box(0.052, 0.03, 0.012, L.coatDark));
          h.at(0.03, -0.095, 0.095, c => c.box(0.02, 0.022, 0.014, L.metal));
        });
        b.at(0, 0.158, -0.06, h => {
          h.box(0.25, 0.225, 0.088, L.coat);
          h.at(0, -0.1, -0.004, c => c.box(0.255, 0.026, 0.09, L.coatDark));
          h.at(0, 0.02, -0.046, c => c.prism(8, 0.036, 0.036, -0.004, 0.036, 0.036, 0.004, L.lining, { capBottom: true }));
          h.at(0, 0.02, -0.049, c => c.prism(6, 0.02, 0.02, -0.004, 0.02, 0.02, 0.004, L.coatDark, { capBottom: true }));
        });
        b.push(M4.translate(0.115, 0.085, -0.052), M4.rotZ(0.14), M4.rotY(-0.18));
        b.box(0.082, 0.31, 0.078, L.coat);
        b.at(0.004, -0.14, 0, h => h.box(0.085, 0.03, 0.082, L.lining));
        [-0.02, 0.02].forEach(z => b.at(0.043, -0.088, z, h => h.prism(3, 0.017, 0.017, 0, 0.002, 0.002, 0.034, L.lining)));
        b.pop();
        b.at(0, d.torso, 0, h => h.prism(8, 0.033, 0.033, 0, 0.031, 0.031, 0.07, L.skin));
      }),
      hips: mk(b => b.prism(10, 0.124, 0.096, -0.08, 0.118, 0.092, 0.08, L.skirt, { capBottom: true })),
      scabbard: mk(b => {
        b.push(M4.translate(0.132, 0.06, 0.02), M4.rotZ(-0.14), M4.rotY(0.32), M4.rotX(-0.52));
        b.at(0, 0, -0.18, h => h.box(0.022, 0.032, 0.44, L.skirt));
        b.at(0, 0, 0.01, h => h.box(0.026, 0.038, 0.042, L.gold));
        b.at(0, 0.016, -0.04, h => h.box(0.028, 0.022, 0.028, L.metal));
        [-0.04, 0.01].forEach((z, i) => b.at(-0.012, -0.052 - i * 0.01, z, h => {
          h.box(0.008, 0.065, 0.016, L.lining);
          h.at(0, -0.032, 0.005, c => c.box(0.008, 0.032, 0.015, L.lining));
        }));
        b.push(M4.translate(0, 0, 0.04), M4.rotX(PI / 2));
        b.prism(10, 0.04, 0.04, -0.008, 0.04, 0.04, 0.008, L.armor, { capBottom: true });
        b.prism(10, 0.044, 0.044, -0.005, 0.044, 0.044, 0.005, L.metal, { capTop: false });
        b.pop();
        b.at(0, 0.026, 0.04, h => h.box(0.024, 0.026, 0.03, L.gold));
        b.at(0, 0, 0.13, h => {
          h.box(0.02, 0.026, 0.16, L.tie);
          for (let i = -3; i <= 3; i++) h.at(0, 0, i * 0.02, c => c.box(0.022, 0.02, 0.009, L.metal));
        });
        b.at(0, -0.016, 0.22, h => {
          h.box(0.018, 0.044, 0.03, L.armor);
          h.at(0, -0.01, 0, c => c.box(0.02, 0.016, 0.014, L.metal));
        });
        b.pop();
      }),
      skirt: mk(b => {
        const n = 14;
        const y0 = -0.235, y1 = 0.085;
        const r0x = 0.172, r0z = 0.142, r1x = 0.12, r1z = 0.094;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
          const slit = i === 11 || i === 12;
          const rx0 = slit ? r0x * 0.93 : r0x * (i % 2 ? 1.02 : 0.98);
          const rz0 = slit ? r0z * 0.93 : r0z * (i % 2 ? 1.02 : 0.98);
          const col = slit ? L.pleat : (i % 2 ? L.skirt : shade(L.skirt, 1.22));
          const p00 = [S(a0) * rx0, y0, C(a0) * rz0], p10 = [S(a1) * rx0, y0, C(a1) * rz0];
          const p11 = [S(a1) * r1x, y1, C(a1) * r1z], p01 = [S(a0) * r1x, y1, C(a0) * r1z];
          const nm = V3.norm([S((a0 + a1) / 2), 0.18, C((a0 + a1) / 2)]);
          b.quad(p00, p10, p11, p01, col, null, [nm, nm, nm, nm]);
        }
        b.at(-0.112, -0.08, 0.064, h => {
          h.box(0.046, 0.018, 0.034, L.obi);
          h.at(-0.016, 0, 0.014, c => c.box(0.014, 0.02, 0.01, L.metal));
        });
      }),
      upperR: mk(b => {
        b.prism(8, 0.05, 0.05, -GIRL.upper - 0.01, 0.054, 0.054, 0.035, L.coat, { capBottom: true });
        b.at(-0.02, -GIRL.upper * 0.55, -0.01, h => {
          h.box(0.064, GIRL.upper + 0.075, 0.105, L.coat);
          h.at(0, -GIRL.upper * 0.5 - 0.032, 0, c => c.box(0.067, 0.02, 0.108, L.lining));
          [-0.024, 0.022].forEach(z => h.at(-0.033, -0.02, z, c => c.prism(3, 0.016, 0.016, 0, 0.002, 0.002, 0.032, L.lining)));
          [-0.026, 0.026].forEach(z => h.at(-0.01, -GIRL.upper * 0.5 - 0.06, z, c => c.box(0.013, 0.042, 0.015, L.obi)));
        });
      }),
      foreR: mk(b => {
        b.prism(8, 0.058, 0.058, -0.105, 0.048, 0.048, 0.01, L.coat, { capBottom: true });
        b.prism(8, 0.06, 0.06, -0.118, 0.06, 0.06, -0.098, L.lining, { capBottom: true });
        b.at(0, -0.088, 0, h => h.prism(8, 0.059, 0.059, -0.008, 0.059, 0.059, 0.008, L.obi, { capTop: false }));
        b.at(-0.054, -0.088, 0.015, h => h.box(0.012, 0.02, 0.02, L.metal));
        b.at(0, -0.138, 0.004, h => h.ellipsoid(0.033, 0.027, 0.029, 8, 5, L.armor));
        b.at(-0.012, -0.136, 0.018, h => h.box(0.026, 0.028, 0.015, L.metal));
        b.at(0, -0.158, 0.004, h => h.ellipsoid(0.029, 0.023, 0.025, 8, 4, L.skin));
      }),
      upperL: mk(b => {
        b.prism(8, 0.041, 0.041, -GIRL.upper - 0.01, 0.045, 0.045, 0.02, L.skin, { capBottom: true });
        b.prism(8, 0.048, 0.048, -0.025, 0.052, 0.052, 0.035, L.shirt, { capBottom: true });
        b.prism(8, 0.05, 0.05, -0.032, 0.05, 0.05, -0.018, L.tie, { capTop: false });
        [-0.086, -0.07, -0.054].forEach(y => b.prism(8, 0.048, 0.048, y - 0.008, 0.048, 0.048, y + 0.008, L.cord, { capTop: false }));
        b.at(0.046, -0.072, 0.01, h => h.box(0.016, 0.032, 0.02, L.cord));
      }),
      foreL: mk(b => {
        b.prism(8, 0.039, 0.041, -0.112, 0.047, 0.049, 0.012, L.armor, { capBottom: true });
        b.prism(8, 0.049, 0.051, -0.015, 0.049, 0.051, 0.008, L.cord, { capTop: false });
        b.at(0.036, -0.055, 0.008, h => {
          h.box(0.015, 0.07, 0.034, L.metal);
          h.at(0.005, 0, 0, c => c.box(0.008, 0.046, 0.02, L.lining));
        });
        b.at(0, -0.136, 0.004, h => h.ellipsoid(0.032, 0.025, 0.027, 8, 5, L.armor));
        b.at(0, -0.158, 0.004, h => h.ellipsoid(0.028, 0.021, 0.024, 8, 4, L.skin));
      }),
      thighL: mk(b => b.prism(8, 0.043, 0.045, -GIRL.thigh, 0.052, 0.054, 0.01, L.tights, { capBottom: true })),
      thighR: mk(b => {
        b.prism(8, 0.043, 0.045, -GIRL.thigh, 0.052, 0.054, 0.01, L.tights, { capBottom: true });
        b.prism(8, 0.048, 0.05, -0.12, 0.049, 0.051, -0.095, L.obi, { capTop: false });
      }),
      shinL: mk(b => buildBoot(b, 1)),
      shinR: mk(b => buildBoot(b, -1)),
      props: {
        sticks: mk(b => {
          [-1, 1].forEach(s => b.at(s * 0.008, -0.08, 0.01, h => h.box(0.007, 0.2, 0.007, 0x8a5a2a)));
          [-0.012, 0, 0.012].forEach(x => b.at(x, -0.12, 0.014, h => h.box(0.005, 0.1, 0.005, [0.98, 0.92, 0.66, 0.2])));
        }),
        vsign: mk(b => [-1, 1].forEach(s => {
          b.push(M4.rotZ(s * 0.24));
          b.prism(6, 0.015, 0.015, -0.09, 0.016, 0.016, 0, L.skin, { capBottom: true });
          b.pop();
        })),
        mic: mk(b => {
          b.prism(8, 0.018, 0.018, -0.02, 0.024, 0.024, 0.12, 0x222428, { capBottom: true });
          b.at(0, 0.15, 0, h => h.ellipsoid(0.04, 0.045, 0.04, 8, 6, [0.78, 0.8, 0.84, 0.1]));
        }),
        glowstick: mk(b => {
          b.prism(8, 0.016, 0.016, -0.03, 0.016, 0.016, 0.06, 0x2a2a2e, { capBottom: true });
          b.prism(8, 0.022, 0.022, 0.06, 0.02, 0.02, 0.32, [0.55, 1, 0.45, 1]);
        })
      }
    };
  }

  function drawGirl(r, G, a, opts) {
    if (!a || a.hidden) return;
    const m = a.m;
    const o = opts || {};
    const pass = o.flat ? { flat: o.flat } : o.tint ? { tint: o.tint } : {};
    r.draw(G.hips, m.hips, pass);
    if (a.pose.ground !== false) r.draw(G.scabbard, m.hips, pass);
    r.draw(G.skirt, m.skirt, pass);
    r.draw(G.torso, m.torso, pass);
    r.draw(G.backHair, m.torso, pass);
    ['L', 'R'].forEach(s => {
      r.draw(G['upper' + s], m['upper' + s], pass);
      r.draw(G['fore' + s], m['fore' + s], pass);
      r.draw(G['thigh' + s], m['thigh' + s], pass);
      r.draw(G['shin' + s], m['shin' + s], pass);
    });
    r.draw(G.head, m.head, pass);
    r.draw(G.hair, m.head, pass);
    const tex = (t) => (o.flat ? pass : Object.assign({ texture: t }, pass));
    if (!o.flat) r.draw(G.face, m.head, tex(G.T.faces[a.pose.face || 'calm']));
    (a.props || []).forEach(pr => {
      const rot = pr.rot || [0, 0, 0];
      r.draw(G.props[pr.id], M4.chain(m[pr.part], M4.translate(pr.at[0], pr.at[1], pr.at[2]), M4.rotX(rot[0]), M4.rotY(rot[1]), M4.rotZ(rot[2])), pass);
    });
  }

  function makeDrone(r) {
    const body = new Builder();
    spherePatch(body, 0.13, 0.12, 0.13, -PI, PI, -PI / 2, PI / 2, 12, 9, [0.72, 0.94, 0.55, 0.06], [2, 1]);
    const face = new Builder();
    spherePatch(face, 0.1316, 0.1216, 0.1316, -0.75, 0.75, -0.55, 0.45, 6, 5, [1, 1, 1, 0.1], [1, 1]);
    const top = new Builder();
    top.at(0, 0.112, 0, h => h.prism(6, 0.016, 0.016, 0, 0.012, 0.012, 0.06, [0.42, 0.5, 0.26, 0]));
    const rotor = new Builder();
    [0, PI].forEach(a => {
      rotor.push(M4.rotY(a));
      rotor.quad([0, 0, 0], [0.05, 0.006, -0.032], [0.15, 0.01, 0], [0.05, 0.006, 0.032], [0.36, 0.72, 0.26, 0.08], null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      rotor.pop();
    });
    return { body: r.mesh(body), face: r.mesh(face), top: r.mesh(top), rotor: r.mesh(rotor) };
  }

  function drawDrone(r, D, T, pos, scale, t, yaw) {
    const M = M4.chain(M4.translate(pos[0], pos[1], pos[2]), M4.rotY(yaw === undefined ? 0.25 * S(t * 1.3) : yaw), M4.rotZ(0.12 * S(t * 2.1)), M4.scale(scale || 1));
    r.draw(D.body, M, { texture: T.net });
    r.draw(D.face, M, { texture: T.droneFace });
    r.draw(D.top, M);
    r.draw(D.rotor, M4.chain(M, M4.translate(0, 0.172, 0), M4.rotY(t * 24)));
  }

  function makeMelon(r) {
    const body = new Builder();
    spherePatch(body, 1, 0.9, 1, -PI, PI, -PI / 2, PI / 2, 14, 10, [0.9, 0.96, 0.84, 0], [3, 1.5]);
    const stem = new Builder();
    stem.at(0, 0.84, 0, h => h.prism(6, 0.09, 0.09, 0, 0.06, 0.06, 0.2, [0.72, 0.76, 0.56, 0]));
    stem.push(M4.translate(0, 1.02, 0), M4.rotZ(PI / 2));
    stem.prism(6, 0.05, 0.05, -0.32, 0.04, 0.04, 0.32, [0.74, 0.78, 0.58, 0], { capBottom: true });
    stem.pop();
    return { body: r.mesh(body), stem: r.mesh(stem) };
  }

  function crowdSpots(seed, rows, xr, r0, r1, skip) {
    const q = rand(seed);
    const out = [];
    rows.forEach((z, row) => {
      for (let x = -xr + (row % 2) * 0.55; x <= xr; x += 1.1) {
        const p = { x: x + (q() - 0.5) * 0.3, z: z + (q() - 0.5) * 0.35, r: r0 + q() * (r1 - r0), ry: q() * PI * 2, ph: q() };
        if (!skip || !skip(p)) out.push(p);
      }
    });
    return out;
  }

  function drawCrowd(r, Mm, T, spots, b, tint) {
    spots.forEach(s => {
      const hop = 0.07 * s.r * bang(b + s.ph * 0.25);
      const M = M4.chain(M4.translate(s.x, s.r * 0.9 + hop, s.z), M4.rotY(s.ry), M4.rotZ(0.06 * S(b * PI + s.ph * 6)), M4.scale(s.r));
      r.draw(Mm.body, M, { texture: T.net, tint });
      r.draw(Mm.stem, M, { tint });
    });
  }

  function discoMesh(rad) {
    const b = new Builder();
    const q = rand(77);
    const nu = 18, nv = 11;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const y0 = -PI / 2 + (PI * j) / nv, y1 = -PI / 2 + (PI * (j + 1)) / nv;
        const a0 = (PI * 2 * i) / nu, a1 = (PI * 2 * (i + 1)) / nu;
        const P = (a, p) => [S(a) * C(p) * rad, S(p) * rad, C(a) * C(p) * rad];
        const k = 0.45 + q() * 0.55;
        const hot = q() < 0.12;
        b.quad(P(a0, y0), P(a1, y0), P(a1, y1), P(a0, y1), hot ? [1, 0.96, 0.85, 1] : [0.85 * k, 0.8 * k, 0.62 * k, 0.15]);
      }
    }
    return b;
  }

  function toro(b, x, z, s, col) {
    const glow = [1, 0.9, 0.55, 0.9];
    b.push(M4.translate(x, 0, z), M4.scale(s));
    b.box(0.5, 0.12, 0.5, col, { base: true });
    b.at(0, 0.12, 0, p => p.prism(6, 0.09, 0.09, 0, 0.08, 0.08, 0.7, col));
    b.at(0, 0.82, 0, p => p.box(0.42, 0.08, 0.42, col, { base: true }));
    b.at(0, 0.9, 0, p => {
      p.box(0.3, 0.3, 0.3, col, { base: true });
      p.at(0, 0.15, 0, w => w.box(0.16, 0.14, 0.31, glow));
      p.at(0, 0.15, 0, w => w.box(0.31, 0.14, 0.16, glow));
    });
    b.at(0, 1.2, 0, p => p.prism(4, 0.42, 0.42, 0, 0.03, 0.03, 0.26, col, { phase: PI / 4 }));
    b.at(0, 1.48, 0, p => p.ellipsoid(0.05, 0.06, 0.05, 6, 4, col));
    b.pop();
  }

  function skyBox(b, low, mid, top, D) {
    [0, PI / 2, PI, -PI / 2].forEach(a => {
      b.push(M4.rotY(a));
      b.quad([-D, -D * 0.3, D], [D, -D * 0.3, D], [D, D * 0.12, D], [-D, D * 0.12, D], [low, low, mid, mid]);
      b.quad([-D, D * 0.12, D], [D, D * 0.12, D], [D, D * 0.7, D], [-D, D * 0.7, D], [mid, mid, top, top]);
      b.pop();
    });
    b.quad([-D, D * 0.7, D], [D, D * 0.7, D], [D, D * 0.7, -D], [-D, D * 0.7, -D], top);
    return b;
  }

  function melonDome(b, rad, h, col) {
    spherePatch(b, rad, h, rad, -PI, PI, 0, PI / 2, 26, 9, col, [9, 2.4]);
    return b;
  }

  function domeStem(b, rad, h, col) {
    b.at(0, h * 0.96, 0, s => s.prism(8, rad * 0.05, rad * 0.05, 0, rad * 0.04, rad * 0.04, rad * 0.32, col));
    b.push(M4.translate(0, h * 0.96 + rad * 0.3, 0), M4.rotZ(PI / 2 - 0.08));
    b.prism(8, rad * 0.035, rad * 0.035, -rad * 0.5, rad * 0.03, rad * 0.03, rad * 0.5, col, { capBottom: true });
    b.pop();
    return b;
  }

  const PALETTE = [[0.78, 0.52, 1], [1, 0.95, 0.5], [0.42, 0.95, 1], [0.55, 1, 0.62], [1, 0.58, 0.82], [0.48, 0.62, 1]];
  const beatColor = (b, shift) => PALETTE[(((Math.floor(b + (shift || 0)) % 6) + 6) % 6)];

  function mat3mul(a, b) {
    const o = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]);
    return o;
  }

  function colorMatrix(hue, sat) {
    const c = C(hue), s = S(hue), k = sat;
    const H = [
      0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
      0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
      0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072
    ];
    const Sm = [
      0.213 + 0.787 * k, 0.715 - 0.715 * k, 0.072 - 0.072 * k,
      0.213 - 0.213 * k, 0.715 + 0.285 * k, 0.072 - 0.072 * k,
      0.213 - 0.213 * k, 0.715 - 0.715 * k, 0.072 + 0.928 * k
    ];
    const m = mat3mul(Sm, H);
    return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
  }

  function glowAt(r, X, camera, pos, size, alpha, tint) {
    r.draw(X.Q.center, billboard(camera, pos, size, size), { texture: X.T.glow, additive: true, alpha, tint, noFog: true });
  }

  function buildClub(r, X) {
    const T = X.T;
    const wall = new Builder();
    wall.quad([-7, 0, 0], [8, 0, 0], [8, 15, 0], [-7, 15, 0], [0.36, 0.38, 0.62, 0], [[0, 0], [8, 0], [8, 8], [0, 8]]);
    wall.quad([-7, 0, 9], [-7, 0, 0], [-7, 15, 0], [-7, 15, 9], [0.26, 0.26, 0.44, 0], [[0, 0], [5, 0], [5, 8], [0, 8]]);
    const ground = new Builder();
    for (let x = -7; x < 8; x += 3) for (let z = 0; z < 9; z += 3) ground.quad([x, 0, z + 3], [x + 3, 0, z + 3], [x + 3, 0, z], [x, 0, z], [0.22, 0.22, 0.3, 0], [[0, 0], [1.5, 0], [1.5, 1.5], [0, 1.5]]);
    const win = new Builder();
    win.quad([1.3, 3.3, 0.03], [4.7, 3.3, 0.03], [4.7, 8.1, 0.03], [1.3, 8.1, 0.03], [[0.5, 0.3, 0.16, 0.6], [0.5, 0.3, 0.16, 0.6], [0.72, 0.52, 0.3, 0.6], [0.72, 0.52, 0.3, 0.6]]);
    const dark = [0.07, 0.06, 0.09, 0];
    for (let i = 0; i <= 6; i++) win.at(1.3 + (i * 3.4) / 6, 5.7, 0.09, h => h.box(0.09, 4.9, 0.12, dark));
    for (let j = 0; j <= 8; j++) win.at(3, 3.3 + j * 0.6, 0.09, h => h.box(3.5, 0.09, 0.12, dark));
    [2.95, 8.45].forEach(y => win.at(3, y, 0.16, h => h.box(3.9, 0.09, 0.09, [1, 0.42, 0.86, 1])));
    const sign = new Builder();
    sign.box(3.1, 2.7, 0.22, [0.22, 0.08, 0.22, 0]);
    const tube = [1, 0.5, 0.86, 1];
    [1.38, -1.38].forEach(y => sign.at(0, y, 0.14, h => h.box(3.24, 0.12, 0.1, tube)));
    [-1.6, 1.6].forEach(x => sign.at(x, 0, 0.14, h => h.box(0.12, 2.88, 0.1, tube)));
    sign.at(0.4, -2.8, -0.1, h => h.box(0.18, 2.9, 0.18, [0.26, 0.26, 0.32, 0]));
    const face = new Builder();
    face.quad([-1.45, -1.25, 0.12], [1.45, -1.25, 0.12], [1.45, 1.25, 0.12], [-1.45, 1.25, 0.12], [1, 1, 1, 0.6]);
    const SIGN = M4.chain(M4.translate(-0.5, 5.4, 2.2), M4.rotY(0.42), M4.rotZ(0.08), M4.scale(1.15));
    const M = { wall: r.mesh(wall), ground: r.mesh(ground), win: r.mesh(win), sign: r.mesh(sign), face: r.mesh(face) };
    const edge = [[-1.6, 1.38], [0, 1.38], [1.6, 1.38], [-1.6, -1.38], [0, -1.38], [1.6, -1.38], [-1.6, 0], [1.6, 0]].map(([x, y]) => M4.point(SIGN, [x, y, 0.25]));
    return {
      env: { sunDir: V3.norm([0.3, -0.8, -0.5]), sunColor: [0.32, 0.28, 0.52], ambTop: [0.3, 0.26, 0.5], ambBottom: [0.16, 0.1, 0.22], fogColor: [0.06, 0.06, 0.15], fogNear: 25, fogFar: 70, points: [{ pos: [0.8, 5, 3.6], color: [2.4, 0.7, 1.9] }, { pos: [3, 5.6, 1.6], color: [1.3, 0.85, 0.4] }] },
      bloom: 0.35,
      draw(rr, t, st) {
        rr.draw(M.ground, null, { texture: T.asphalt });
        rr.draw(M.wall, null, { texture: T.brick });
        rr.draw(M.win);
        rr.draw(M.sign, SIGN);
        rr.draw(M.face, SIGN, { texture: T.sign });
        edge.forEach(p => glowAt(rr, X, st.camera, p, 1.4, 0.32, [1, 0.45, 0.9]));
        glowAt(rr, X, st.camera, [3, 5.7, 0.6], 6, 0.18, [1, 0.7, 0.35]);
      }
    };
  }

  function buildHud(r, X) {
    const T = X.T;
    const grid = new Builder();
    grid.quad([-11, -7, -4], [11, -7, -4], [11, 7, -4], [-11, 7, -4], [1, 1, 1, 1], [[0, 0], [11, 0], [11, 7], [0, 7]]);
    const gear = new Builder();
    starFan(gear, 12, 2.5, 2.12, -1.75, [0.14, 0.26, 0.72, 1], [0.2, 0.36, 0.86, 1]);
    starFan(gear, 12, 2.3, 1.94, -1.7, [0.03, 0.06, 0.3, 1], [0.08, 0.15, 0.6, 1]);
    const burst = new Builder();
    starFan(burst, 22, 3.8, 1.5, -1.7, [0.9, 0.4, 0.75, 1], [0.5, 0.05, 0.35, 1]);
    const melon = new Builder();
    spherePatch(melon, 1.15, 1.08, 1.15, -PI, PI, -PI / 2, PI / 2, 18, 12, [0.86, 0.95, 1, 0], [3, 1.5]);
    const stem = new Builder();
    stem.at(0, 1.02, 0, h => h.prism(6, 0.1, 0.1, 0, 0.07, 0.07, 0.3, [0.8, 0.86, 0.92, 0]));
    stem.push(M4.translate(0, 1.3, 0), M4.rotZ(PI / 2 - 0.2));
    stem.prism(6, 0.06, 0.06, -0.5, 0.05, 0.05, 0.5, [0.82, 0.88, 0.94, 0], { capBottom: true });
    stem.pop();
    const half = new Builder();
    spherePatch(half, 1.15, 1.08, 1.15, 0, PI, -PI / 2, PI / 2, 9, 12, [0.86, 0.95, 1, 0], [1.5, 1.5]);
    const cap = new Builder();
    for (let i = 0; i < 24; i++) {
      const a0 = (i / 24) * PI * 2, a1 = ((i + 1) / 24) * PI * 2;
      cap.tri([0, 0, 0], [0, S(a0) * 1.08, C(a0) * 1.15], [0, S(a1) * 1.08, C(a1) * 1.15], [1, 1, 1, 0.22], [[0.5, 0.5], [0.5 + C(a0) * 0.5, 0.5 + S(a0) * 0.5], [0.5 + C(a1) * 0.5, 0.5 + S(a1) * 0.5]], [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0]]);
    }
    const shard = new Builder();
    spherePatch(shard, 0.55, 0.55, 0.55, -0.45, 0.45, -0.28, 0.28, 3, 2, [0.9, 1, 0.95, 0.45]);
    const M = { grid: r.mesh(grid), gear: r.mesh(gear), burst: r.mesh(burst), melon: r.mesh(melon), stem: r.mesh(stem), half: r.mesh(half), cap: r.mesh(cap), shard: r.mesh(shard) };
    const SHARDS = [[-2.4, 1.3, 0.4], [2.6, 0.7, -0.3], [-2.7, -1, 0.3], [2.3, -1.4, 0.7], [-1.4, 2, -0.6], [1.7, 1.9, 0.5], [0.3, -2.1, 0.4]];
    return {
      envAt: (t, st) => {
        const L = st.extras.light;
        const A = st.extras.split ? 1.8 : 1;
        return { sunDir: V3.norm([-0.75, -0.3, -0.6]), sunColor: [0.95 * L, 1.0 * L, 1.1 * L], ambTop: [(0.08 + 0.18 * L) * A, (0.12 + 0.22 * L) * A, (0.3 + 0.2 * L) * A], ambBottom: [0.03 * A, 0.05 * A, 0.18 * A], fogColor: [0.02, 0.03, 0.12], fogNear: 40, fogFar: 80 };
      },
      bloom: 0.4,
      draw(rr, t, st) {
        const E = st.extras;
        const pink = E.split;
        rr.draw(M.grid, null, { texture: T.grid, tint: pink ? [0.8, 0.3, 0.7] : [0.42, 0.48, 0.8], uvScroll: [t * 0.04, 0] });
        if (pink) rr.draw(M.burst, M4.chain(M4.rotZ(t * 0.35), M4.scale(1 + 0.1 * bang(beatAt(t)))), { additive: true, alpha: 0.45, noFog: true });
        else rr.draw(M.gear, M4.rotZ(t * 0.12));
        if (!pink) {
          const M0 = M4.chain(M4.rotZ(0.3), M4.rotY(E.spin), M4.rotX(0.18));
          rr.draw(M.melon, M0, { texture: T.net });
          rr.draw(M.stem, M0);
        } else {
          const d = 0.12 + 1.15 * ease(E.open);
          const k = 0.7 * ease(E.open);
          [-1, 1].forEach(s => {
            const M1 = M4.chain(M4.translate(s * d * (1 + E.fly * 1.5), 0.15 * s * E.open, E.fly * 4.5), M4.rotZ(0.3 + s * 0.25 * E.open + E.fly * s), M4.rotY(s > 0 ? k : PI - k), M4.scale(1 + E.fly * 0.6));
            rr.draw(M.half, M1, { texture: T.net });
            rr.draw(M.cap, M1, { texture: T.flesh });
          });
        }
        SHARDS.forEach(([x, y, z], i) => {
          rr.draw(M.shard, M4.chain(M4.translate(x + 0.15 * S(t * 0.9 + i), y + 0.2 * S(t * 0.7 + i * 2), z + (pink ? E.fly * 3 : 0)), M4.rotY(t * (0.6 + i * 0.13) + i), M4.rotX(t * 0.4 + i)));
        });
      }
    };
  }

  function buildEat(r, X) {
    const T = X.T;
    const back = new Builder();
    back.quad([-2.4, -0.4, -0.9], [2.4, -0.4, -0.9], [2.4, 2.4, -0.9], [-2.4, 2.4, -0.9], [1, 1, 1, 0.9], [[0, 0], [5, 0], [5, 3], [0, 3]]);
    const counter = new Builder();
    counter.at(0, 0, 0.12, h => h.box(3.4, 0.5, 0.52, [0.86, 0.8, 0.64, 0.25], { base: true, faces: { top: [0.97, 0.92, 0.76, 0.3] } }));
    const bowl = new Builder();
    bowl.prism(12, 0.045, 0.045, 0, 0.078, 0.078, 0.06, [0.97, 0.97, 0.98, 0.25], { capTop: false, capBottom: true });
    bowl.prism(12, 0.0628, 0.0628, 0.03, 0.0716, 0.0716, 0.046, [0.32, 0.46, 0.88, 0.2], { capTop: false });
    bowl.prism(12, 0.074, 0.074, 0.058, 0.043, 0.043, 0.006, [0.86, 0.88, 0.92, 0.2], { capTop: false });
    const noodles = new Builder();
    noodles.disc(0.068, 12, [0.98, 0.9, 0.58, 0.25], 0.05);
    const dump = new Builder();
    dump.ellipsoid(0.05, 0.036, 0.05, 8, 5, [0.84, 0.6, 0.34, 0.12]);
    dump.at(0, 0.02, 0, h => h.ellipsoid(0.03, 0.02, 0.03, 6, 3, [0.95, 0.78, 0.5, 0.12]));
    const M = { back: r.mesh(back), counter: r.mesh(counter), bowl: r.mesh(bowl), noodles: r.mesh(noodles), dump: r.mesh(dump) };
    const PILE = [[0, 0, 0], [0.1, 0, 0.02], [-0.1, 0, 0.03], [0.05, 0, -0.08], [-0.05, 0, -0.08], [0.15, 0, -0.06], [0.05, 0.05, -0.02], [-0.05, 0.05, -0.01], [0.1, 0.05, -0.05], [0, 0.09, -0.04]];
    return {
      env: { sunDir: V3.norm([0.25, -0.6, -0.8]), sunColor: [0.72, 0.7, 0.68], ambTop: [0.66, 0.66, 0.7], ambBottom: [0.42, 0.4, 0.42], fogColor: [0, 0, 0], fogNear: 40, fogFar: 80 },
      draw(rr, t, st) {
        const E = st.extras;
        rr.draw(M.back, null, { texture: T.hatch, tint: E.color, noFog: true });
        rr.draw(M.counter);
        for (let i = 0; i < E.bowls; i++) rr.draw(M.bowl, M4.chain(M4.translate(-0.64, 0.5 + i * 0.046, 0.14), M4.rotY(i)));
        rr.draw(M.bowl, M4.translate(0.02, 0.5, 0.24));
        if (!E.gray) rr.draw(M.noodles, M4.translate(0.02, 0.5, 0.24));
        PILE.forEach(([x, y, z]) => rr.draw(M.dump, M4.translate(0.62 + x, 0.53 + y, 0.2 + z)));
        drawGirl(rr, X.G, st.cast[0]);
      }
    };
  }

  function buildRoom(r, X) {
    const T = X.T;
    const W = 3.4, Z0 = -3.4, Z1 = 3.8, HT = 2.9;
    const floor = new Builder();
    floor.quad([-W, 0, Z1], [W, 0, Z1], [W, 0, Z0], [-W, 0, Z0], [0.55, 0.78, 0.76, 0], [[0, 0], [3.4, 0], [3.4, 3.6], [0, 3.6]]);
    const shojiQuad = (col) => {
      const b = new Builder();
      b.quad([-W, 0, Z0 + 0.02], [W, 0, Z0 + 0.02], [W, 2.3, Z0 + 0.02], [-W, 2.3, Z0 + 0.02], col, [[0, 0], [4, 0], [4, 1.4], [0, 1.4]]);
      return r.mesh(b);
    };
    const room = new Builder();
    const wood = [0.34, 0.25, 0.2, 0];
    room.quad([-W, 0, Z1], [-W, 0, Z0], [-W, HT, Z0], [-W, HT, Z1], [0.36, 0.35, 0.38, 0]);
    room.quad([W, 0, Z0], [W, 0, Z1], [W, HT, Z1], [W, HT, Z0], [0.36, 0.35, 0.38, 0]);
    room.quad([-W, HT, Z0], [W, HT, Z0], [W, HT, Z1], [-W, HT, Z1], [0.14, 0.12, 0.12, 0]);
    room.quad([-W, 2.3, Z0 + 0.01], [W, 2.3, Z0 + 0.01], [W, HT, Z0 + 0.01], [-W, HT, Z0 + 0.01], [0.3, 0.26, 0.24, 0]);
    [-W + 0.08, -1.7, 0, 1.7, W - 0.08].forEach(x => room.at(x, HT / 2, Z0 + 0.08, h => h.box(0.16, HT, 0.16, wood)));
    [-1, 1.4, Z1 - 0.1].forEach(z => [-W + 0.08, W - 0.08].forEach(x => room.at(x, HT / 2, z, h => h.box(0.16, HT, 0.16, wood))));
    room.at(0, 2.32, Z0 + 0.1, h => h.box(2 * W, 0.16, 0.14, wood));
    [-W + 0.1, W - 0.1].forEach(x => room.at(x, 2.32, (Z0 + Z1) / 2, h => h.box(0.14, 0.16, Z1 - Z0, wood)));
    [-2.2, 0, 2.2].forEach(z => room.at(0, HT - 0.06, z, h => h.box(2 * W, 0.12, 0.14, wood)));
    const table = new Builder();
    table.at(0, 0.62, -0.5, h => h.box(0.84, 0.05, 0.44, [0.16, 0.16, 0.2, 0]));
    [[-0.38, -0.18], [0.38, -0.18], [-0.38, 0.18], [0.38, 0.18]].forEach(([x, z]) => table.at(x, 0.31, -0.5 + z, h => h.box(0.04, 0.62, 0.04, [0.12, 0.12, 0.15, 0])));
    table.at(0, 0.5, -0.29, h => h.box(0.78, 0.18, 0.02, [0.18, 0.18, 0.22, 0]));
    const pad = new Builder();
    pad.at(0, 0.652, -0.48, h => h.box(0.66, 0.018, 0.32, [0.72, 1, 1, 1]));
    const poster = new Builder();
    poster.quad([-0.34, -0.72, 0], [0.34, -0.72, 0], [0.34, 0.72, 0], [-0.34, 0.72, 0], [1, 1, 1, 0.2], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    const litPoster = new Builder();
    litPoster.quad([-0.34, -0.72, 0], [0.34, -0.72, 0], [0.34, 0.72, 0], [-0.34, 0.72, 0], [1, 1, 1, 0.85], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    const panels = new Builder();
    [-1, 1].forEach(s => panels.quad([s * (W - 0.03), 0.2, -2.9], [s * (W - 0.03), 0.2, -1.4], [s * (W - 0.03), 2.2, -1.4], [s * (W - 0.03), 2.2, -2.9], [0.36, 0.52, 0.86, 0.7]));
    const shaft = new Builder();
    shaft.quad([-2.7, HT, -2.8], [-1.7, HT, -2.8], [0.5, 0, -0.2], [-0.5, 0, -0.2], [[0.5, 0.8, 0.8, 1], [0.5, 0.8, 0.8, 1], [0.04, 0.07, 0.07, 1], [0.04, 0.07, 0.07, 1]]);
    const M = { floor: r.mesh(floor), shojiDark: shojiQuad([0.5, 0.62, 0.66, 0.2]), shojiLit: shojiQuad([0.95, 0.9, 0.82, 0.8]), room: r.mesh(room), table: r.mesh(table), pad: r.mesh(pad), poster: r.mesh(poster), litPoster: r.mesh(litPoster), panels: r.mesh(panels), shaft: r.mesh(shaft) };
    const POSTERS = [[0, M4.translate(-1.95, 1.25, Z0 + 0.06), false], [1, M4.translate(1.95, 1.25, Z0 + 0.06), false], [2, M4.chain(M4.translate(W - 0.04, 1.3, -0.4), M4.rotY(-PI / 2)), true], [1, M4.chain(M4.translate(-W + 0.04, 1.3, -0.6), M4.rotY(PI / 2)), false]];
    const SPOTS = crowdSpots(5, [0.25, 0.85, 1.45], 2.9, 0.32, 0.4);
    const DARK = { sunDir: V3.norm([0.55, -0.75, -0.35]), sunColor: [0.22, 0.4, 0.44], ambTop: [0.12, 0.24, 0.26], ambBottom: [0.05, 0.1, 0.11], fogColor: [0.02, 0.04, 0.05], fogNear: 7, fogFar: 18, points: [{ pos: [0, 1.0, -0.2], color: [0.55, 1.1, 1.1] }, { pos: [2.8, 1.4, -0.6], color: [0.7, 0.4, 0.55] }] };
    const PARTY = { sunDir: V3.norm([0.1, -0.5, -0.85]), sunColor: [0.62, 0.62, 0.6], ambTop: [0.36, 0.36, 0.42], ambBottom: [0.18, 0.18, 0.22], fogColor: [0.2, 0.2, 0.24], fogNear: 10, fogFar: 26 };
    return {
      envAt: (t, st) => {
        if (!st.extras.party) return DARK;
        const b = st.extras.beat;
        return Object.assign({}, PARTY, { points: [{ pos: [-1.6, 1.9, 1.2], color: V3.mul(beatColor(b), 0.5) }, { pos: [1.6, 1.9, 1.2], color: V3.mul(beatColor(b, 3), 0.5) }] });
      },
      bloomAt: (st) => (st.extras.party ? 0.5 : 0.3),
      look(t, st, camera) {
        if (st.extras.party) camera.grade = mix3([1, 1, 1], beatColor(st.extras.beat), 0.25).concat([0]);
      },
      draw(rr, t, st) {
        const E = st.extras;
        rr.draw(M.floor, null, { texture: T.tatami });
        rr.draw(E.party ? M.shojiLit : M.shojiDark, null, { texture: T.shoji });
        rr.draw(M.room, null, { texture: T.wood });
        POSTERS.forEach(([k, m, lit]) => rr.draw(lit ? M.litPoster : M.poster, m, { texture: T.posters[k] }));
        rr.draw(M.table);
        rr.draw(M.pad);
        drawGirl(rr, X.G, st.cast[0]);
        if (E.party) {
          rr.draw(M.panels);
          drawCrowd(rr, X.Mm, T, SPOTS, E.beat);
          rr.draw(X.disco, M4.chain(M4.translate(0, 2.4, -0.9), M4.rotY(t * 0.8), M4.scale(0.8)));
          drawDrone(rr, X.D, T, [0.72, 1.55 + 0.05 * S(t * 2.2), -0.7], 1, t);
          for (let i = 0; i < 5; i++) {
            const a = t * 0.8 + i * 1.3;
            if (frac(t * 3 + i * 0.37) < 0.5) glowAt(rr, X, st.camera, [C(a) * 0.4, 2.4 + S(a * 1.7) * 0.32, -0.9 + S(a) * 0.4], 0.3, 0.7, [1, 1, 0.9]);
          }
        } else {
          rr.draw(M.shaft, null, { additive: true, alpha: 0.35, noFog: true });
          glowAt(rr, X, st.camera, [0, 0.72, -0.48], 1.2, 0.25, [0.5, 1, 1]);
        }
      }
    };
  }

  const HOUSE_COLORS = [[0.3, 1, 0.45], [1, 0.3, 0.85], [0.3, 0.9, 1], [1, 0.9, 0.35]];

  function buildTorii(r, X) {
    const T = X.T;
    const RED = [0.74, 0.16, 0.1, 0], BLACK = [0.1, 0.08, 0.09, 0];
    const pillar = new Builder();
    pillar.prism(10, 0.2, 0.2, 0, 0.18, 0.18, 4.1, RED);
    pillar.prism(10, 0.27, 0.27, 0, 0.26, 0.26, 0.34, BLACK);
    pillar.at(0.36, 2.62, 0, h => h.box(0.34, 0.06, 0.06, BLACK));
    pillar.at(0.56, 2.52, 0, h => {
      h.box(0.3, 0.3, 0.3, [0.26, 0.32, 0.3, 0], { base: true });
      h.at(0, 0.15, 0, l => l.box(0.2, 0.17, 0.31, [1, 0.92, 0.55, 0.9]));
      h.at(0, 0.3, 0, l => l.prism(4, 0.3, 0.3, 0, 0.03, 0.03, 0.2, [0.2, 0.4, 0.32, 0], { phase: PI / 4 }));
    });
    const kasagi = new Builder();
    kasagi.box(4.7, 0.26, 0.34, RED);
    kasagi.at(0, 0.19, 0, h => h.box(5.1, 0.13, 0.4, BLACK));
    [-1, 1].forEach(s => {
      kasagi.push(M4.translate(s * 2.7, 0.24, 0), M4.rotZ(s * 0.22));
      kasagi.box(0.46, 0.12, 0.4, BLACK);
      kasagi.pop();
    });
    const nuki = new Builder();
    nuki.box(4.2, 0.19, 0.2, RED);
    nuki.at(0, 0.36, 0, h => h.box(0.26, 0.52, 0.14, RED));
    const ground = new Builder();
    for (let x = -16; x < 16; x += 4) for (let z = -48; z < 12; z += 4) ground.quad([x, 0, z + 4], [x + 4, 0, z + 4], [x + 4, 0, z], [x, 0, z], [0.3, 0.62, 0.34, 0], [[0, 0], [2, 0], [2, 2], [0, 2]]);
    const path = new Builder();
    for (let z = -46; z < 12; z += 2) path.quad([-1.25, 0.015, z + 2], [1.25, 0.015, z + 2], [1.25, 0.015, z], [-1.25, 0.015, z], [0.6, 0.62, 0.7, 0], [[0, 0], [1.2, 0], [1.2, 1], [0, 1]]);
    const fence = new Builder();
    for (let z = -44; z < 10; z += 2) fence.at(4.8, 0.5, z, h => h.box(0.06, 1, 0.06, [0.3, 0.3, 0.36, 0]));
    [1, 0.55].forEach(y => fence.at(4.8, y, -17, h => h.box(0.05, 0.05, 54, [0.3, 0.3, 0.36, 0])));
    const HZ = HOUSE_Z;
    const house = new Builder();
    const wd = [0.32, 0.22, 0.17, 0], wd2 = [0.22, 0.15, 0.11, 0], roofC = [0.24, 0.24, 0.3, 0];
    house.at(0, 0, HZ - 2.2, h => h.box(9.2, 3, 4.4, wd, { base: true }));
    house.at(0, 3, HZ - 2.4, h => h.box(8.2, 2.4, 3.6, wd, { base: true }));
    house.quad([-5.1, 2.85, HZ + 1], [5.1, 2.85, HZ + 1], [5.1, 3.35, HZ - 0.4], [-5.1, 3.35, HZ - 0.4], roofC);
    house.at(0, 2.8, HZ + 1, h => h.box(10.3, 0.1, 0.12, [0.16, 0.16, 0.2, 0]));
    house.at(0, 3.62, HZ - 0.5, h => h.box(8.4, 0.08, 0.1, wd2));
    for (let x = -4; x <= 4; x += 0.5) house.at(x, 3.35, HZ - 0.5, h => h.box(0.05, 0.5, 0.05, wd2));
    house.at(0, 5.4, HZ - 2.4, h => {
      h.push(M4.scale(1.3, 1, 0.62));
      h.prism(4, 4.3, 4.3, 0, 0.8, 0.8, 1.5, roofC, { phase: PI / 4 });
      h.pop();
    });
    [-0.85, 0.85].forEach(x => house.at(x, 1.25, HZ + 0.05, h => h.box(0.14, 2.5, 0.12, wd2)));
    house.at(0, 2.5, HZ + 0.05, h => h.box(1.84, 0.14, 0.12, wd2));
    house.quad([-0.78, 0, HZ + 0.02], [0.78, 0, HZ + 0.02], [0.78, 2.42, HZ + 0.02], [-0.78, 2.42, HZ + 0.02], [0.28, 0.16, 0.1, 0.55]);
    [-1, 1].forEach(s => toro(house, s * 1.75, HZ + 1.5, 1.1, [0.6, 0.6, 0.66, 0]));
    [[-3.6, 1.6], [-4.6, 0.9], [3.8, 1.4], [5, 2]].forEach(([x, z]) => house.at(x, 0.2, HZ + z, h => h.ellipsoid(0.9, 0.55, 0.7, 8, 5, [0.5, 0.3, 0.6, 0])));
    house.at(-7, 0, HZ + 2.5, h => {
      h.box(1.8, 0.7, 3.8, [0.95, 0.5, 0.75, 0.05], { base: true });
      h.at(0, 0.7, -0.2, c => c.box(1.6, 0.5, 2, [0.9, 0.46, 0.72, 0.05], { base: true }));
    });
    const houseWin = new Builder();
    [-3.1, -1.8, 1.8, 3.1].forEach(x => houseWin.quad([x - 0.58, 0.8, HZ + 0.02], [x + 0.58, 0.8, HZ + 0.02], [x + 0.58, 2.35, HZ + 0.02], [x - 0.58, 2.35, HZ + 0.02], [1, 0.84, 0.56, 0.85], [[0, 0], [1, 0], [1, 1.2], [0, 1.2]]));
    [-2.6, -0.9, 0.9, 2.6].forEach(x => houseWin.quad([x - 0.7, 3.7, HZ - 0.59], [x + 0.7, 3.7, HZ - 0.59], [x + 0.7, 5, HZ - 0.59], [x - 0.7, 5, HZ - 0.59], [1, 0.84, 0.56, 0.8], [[0, 0], [1.2, 0], [1.2, 1], [0, 1]]));
    const board = new Builder();
    board.quad([-0.9, 2.62, HZ + 0.12], [0.9, 2.62, HZ + 0.12], [0.9, 3.05, HZ + 0.12], [-0.9, 3.05, HZ + 0.12], [1, 1, 1, 0.3]);
    const lanterns = new Builder();
    [-4.3, -2.3, 2.3, 4.3].forEach(x => lanterns.at(x, 2.35, HZ + 0.8, h => {
      h.ellipsoid(0.24, 0.3, 0.24, 10, 6, [1, 0.5, 0.45, 0.85]);
      h.at(0, 0.28, 0, c => c.prism(8, 0.1, 0.1, 0, 0.1, 0.1, 0.06, [0.15, 0.1, 0.1, 0]));
      h.at(0, -0.34, 0, c => c.prism(8, 0.1, 0.1, 0, 0.1, 0.1, 0.05, [0.15, 0.1, 0.1, 0]));
    }));
    const dome = new Builder();
    melonDome(dome, 58, 48, [0.44, 0.86, 0.96, 0.55]);
    const domeS = new Builder();
    domeStem(domeS, 58, 48, [0.44, 0.7, 0.72, 0.3]);
    const city = new Builder();
    const q = rand(9);
    for (let i = 0; i < 12; i++) {
      const x = -18 - q() * 26, z = -30 - q() * 70, w = 5 + q() * 6, hh = 18 + q() * 30;
      city.at(x, 0, z, c => c.box(w, hh, w, [0.36, 0.4, 0.66, 0.1], { base: true, uvScale: 0.12 }));
    }
    const moon = new Builder();
    discXY(moon, -30, 62, -140, 5, 16, [1, 1, 0.94, 1], [0, 0, 1]);
    const sky = new Builder();
    skyBox(sky, [0.48, 0.44, 0.78, 1], [0.34, 0.3, 0.66, 1], [0.12, 0.12, 0.34, 1], 170);
    const M = { pillar: r.mesh(pillar), kasagi: r.mesh(kasagi), nuki: r.mesh(nuki), ground: r.mesh(ground), path: r.mesh(path), fence: r.mesh(fence), house: r.mesh(house), houseWin: r.mesh(houseWin), board: r.mesh(board), lanterns: r.mesh(lanterns), dome: r.mesh(dome), domeS: r.mesh(domeS), city: r.mesh(city), moon: r.mesh(moon), sky: r.mesh(sky) };
    const DOME = M4.translate(30, -6, -120);
    const PARTS = [[M.pillar, [-1.6, 0, 0], true], [M.pillar, [1.6, 0, 0], false], [M.kasagi, [0, 4.25, 0], false], [M.nuki, [0, 3.45, 0], false]];
    const gateZ = (i) => -2 - i * GATE_GAP;
    function drawGate(rr, i, t, E) {
      const z = gateZ(i);
      const w = E.wobble ? 0.4 + E.wobble : 0;
      const G0 = M4.chain(M4.translate(0, 0, z), M4.rotZ(w * 0.16 * S(t * 3.1 + i * 0.9)), M4.rotX(w * 0.08 * S(t * 2.3 + i)));
      PARTS.forEach(([mesh, off, flip], j) => {
        let Mx = M4.chain(G0, M4.translate(off[0], off[1], off[2]));
        if (E.crack > 0) {
          const k = clamp(E.crack * 1.7 - i * 0.03, 0, 1);
          const g = rand(i * 17 + j * 5 + 3);
          const dx = (g() - 0.5) * 9, dy = 2 + g() * 8, dz = (g() - 0.5) * 6;
          Mx = M4.chain(M4.translate(dx * k, dy * k * k, dz * k), Mx, M4.rotX(k * (g() - 0.5) * 4), M4.rotZ(k * (g() - 0.5) * 4));
        }
        if (flip) Mx = M4.mul(Mx, M4.scale(-1, 1, 1));
        rr.draw(mesh, Mx);
      });
    }
    const ENV = { sunDir: V3.norm([0.4, -0.55, 0.7]), sunColor: [0.45, 0.45, 0.72], ambTop: [0.34, 0.34, 0.56], ambBottom: [0.2, 0.26, 0.24], fogColor: [0.32, 0.3, 0.55], fogNear: 30, fogFar: 140 };
    return {
      envAt: (t, st) => {
        const col = HOUSE_COLORS[((Math.floor(st.extras.beat) % 4) + 4) % 4];
        return Object.assign({}, ENV, { points: [{ pos: [0, 1.4, HZ + 2.2], color: V3.mul(col, 2.2) }, { pos: [0, 2, st.camera.eye[2] - 4], color: V3.mul(col, 0.9) }] });
      },
      bloom: 0.4,
      draw(rr, t, st) {
        const E = st.extras;
        const col = HOUSE_COLORS[((Math.floor(E.beat) % 4) + 4) % 4];
        rr.draw(M.sky, null, { noFog: true });
        rr.draw(M.moon, null, { noFog: true });
        glowAt(rr, X, st.camera, [-30, 62, -139], 34, 0.5, [0.9, 0.9, 1]);
        rr.draw(M.dome, DOME, { texture: T.net, noFog: true });
        rr.draw(M.domeS, DOME, { noFog: true });
        rr.draw(M.city, null, { texture: T.windows });
        rr.draw(M.ground, null, { texture: T.grass });
        rr.draw(M.path, null, { texture: T.stone });
        rr.draw(M.fence);
        rr.draw(M.house);
        rr.draw(M.houseWin, null, { texture: T.shoji });
        rr.draw(M.board, null, { texture: T.board });
        rr.draw(M.lanterns);
        for (let i = 0; i < GATES; i++) drawGate(rr, i, t, E);
        drawGirl(rr, X.G, st.cast[0]);
        rr.draw(X.Q.floor, M4.chain(M4.translate(0, 0.04, HZ + 2.4), M4.scale(7)), { texture: T.glow, additive: true, alpha: 0.55, tint: col, noFog: true });
        const cz = st.camera.eye[2];
        for (let k = 0; k < 3; k++) {
          const pz = Math.floor((cz - 2) / 4) * 4 - k * 4;
          if (pz > HZ + 3) rr.draw(X.Q.floor, M4.chain(M4.translate(0.6 * S(pz), 0.03, pz), M4.scale(2.6)), { texture: T.glow, additive: true, alpha: 0.4, tint: HOUSE_COLORS[(((Math.floor(E.beat) + k) % 4) + 4) % 4], noFog: true });
        }
        if (!E.crack) for (let i = 0; i < GATES; i++) [-1, 1].forEach(s => glowAt(rr, X, st.camera, [s * 2.16, 2.67, gateZ(i)], 0.9, 0.35, [1, 0.9, 0.5]));
        [-4.3, -2.3, 2.3, 4.3].forEach(x => glowAt(rr, X, st.camera, [x, 2.35, HZ + 0.9], 1.4, 0.4, [1, 0.45, 0.4]));
      }
    };
  }

  function buildDeck(r, X) {
    const T = X.T;
    const deck = new Builder();
    deck.at(0, 0.53, 0.27, h => h.box(0.98, 0.1, 0.46, [0.14, 0.16, 0.26, 0]));
    [-0.25, 0.25].forEach(x => deck.at(x, 0.58, 0.27, h => {
      h.prism(18, 0.15, 0.15, 0, 0.15, 0.15, 0.012, [0.22, 0.24, 0.32, 0]);
      h.at(0, 0.012, 0, c => c.prism(12, 0.035, 0.035, 0, 0.035, 0.035, 0.01, [0.86, 0.88, 0.92, 0.3]));
    }));
    deck.at(0, 0.585, 0.38, h => h.box(0.12, 0.012, 0.03, [0.86, 0.88, 0.92, 0.3]));
    [-0.06, 0.06].forEach(x => deck.at(x, 0.585, 0.18, h => h.box(0.02, 0.012, 0.1, [0.5, 0.52, 0.6, 0.2])));
    const rings = new Builder();
    [-0.25, 0.25].forEach(x => {
      const n = 28;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        const P = (a, rr) => [x + S(a) * rr, 0.594, 0.27 + C(a) * rr];
        rings.quad(P(a0, 0.152), P(a1, 0.152), P(a1, 0.172), P(a0, 0.172), [0.25, 0.55, 1, 1], null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      }
    });
    const M = { deck: r.mesh(deck), rings: r.mesh(rings) };
    return {
      env: { sunDir: V3.norm([0.1, -0.6, -0.8]), sunColor: [0.55, 0.52, 0.5], ambTop: [0.68, 0.64, 0.62], ambBottom: [0.44, 0.42, 0.46], fogColor: [0.93, 0.97, 1], fogNear: 40, fogFar: 80, points: [{ pos: [0, 0.62, 0.55], color: [0.06, 0.16, 0.45] }] },
      bloomAt: (st) => 0.2 + st.extras.bloom * 0.8,
      look(t, st, camera) {
        const hue = st.extras.hue;
        if (hue) camera.colorM = colorMatrix([0, 2.3, -2.1, 1.1][hue], 1.25);
      },
      draw(rr, t, st) {
        rr.draw(M.deck);
        rr.draw(M.rings);
        [-0.25, 0.25].forEach(x => rr.draw(X.Q.floor, M4.chain(M4.translate(x, 0.6, 0.27), M4.scale(0.55)), { texture: T.glow, additive: true, alpha: 0.6, tint: [0.3, 0.55, 1], noFog: true }));
        drawGirl(rr, X.G, st.cast[0]);
      }
    };
  }

  function buildStage(r, X) {
    const T = X.T;
    const floor = new Builder();
    for (let x = -9; x < 9; x += 3) for (let z = -1; z < 11; z += 3) floor.quad([x, 0, z + 3], [x + 3, 0, z + 3], [x + 3, 0, z], [x, 0, z], [0.14, 0.16, 0.18, 0]);
    const stageBox = new Builder();
    stageBox.at(0, 0, -1.6, h => h.box(8.6, STAGE_Y, 3.2, [0.1, 0.1, 0.13, 0], { base: true, faces: { top: [0.18, 0.18, 0.22, 0] } }));
    const led = new Builder();
    led.quad([-3.7, STAGE_Y, -3], [3.7, STAGE_Y, -3], [3.7, 3.7, -3], [-3.7, 3.7, -3], [1, 1, 1, 1], [[0, 0], [9, 0], [9, 3.6], [0, 3.6]]);
    const word = new Builder();
    word.quad([-3.2, 1.1, -2.94], [3.2, 1.1, -2.94], [3.2, 2.7, -2.94], [-3.2, 2.7, -2.94], [1, 1, 1, 1]);
    const truss = new Builder();
    const metal = [0.3, 0.32, 0.36, 0.05];
    [-3.95, 3.95].forEach(x => [-2.9, -0.3].forEach(z => truss.at(x, 2.15, z, h => h.box(0.12, 4.3, 0.12, metal))));
    [-2.9, -0.3].forEach(z => truss.at(0, 4.25, z, h => h.box(8, 0.12, 0.12, metal)));
    [-3.95, 3.95].forEach(x => truss.at(x, 4.25, -1.6, h => h.box(0.12, 0.12, 2.7, metal)));
    [-3.95, 3.95].forEach(x => {
      for (let y = 0.4; y < 4.1; y += 0.6) {
        truss.push(M4.translate(x, y + 0.3, -1.6), M4.rotX(0.22));
        truss.box(0.04, 0.04, 2.6, metal);
        truss.pop();
      }
    });
    for (let x = -3.6; x < 3.7; x += 0.6) {
      truss.push(M4.translate(x + 0.3, 4.25, -0.3), M4.rotZ(0.6));
      truss.box(0.04, 0.5, 0.04, metal);
      truss.pop();
    }
    const bulbs = [];
    [-3.78, 3.78].forEach(x => { for (let y = 1; y < 4; y += 0.42) [-2.55, -0.6].forEach(z => bulbs.push([x, y, z])); });
    for (let x = -3.3; x <= 3.31; x += 0.55) bulbs.push([x, 4.08, -0.18]);
    const bulbMesh = new Builder();
    bulbs.forEach(p => bulbMesh.at(p[0], p[1], p[2], h => h.ellipsoid(0.06, 0.06, 0.06, 6, 4, [1, 0.86, 0.42, 1])));
    const spots = new Builder();
    for (let i = 0; i < 6; i++) spots.at(-2.5 + i, 4.05, -0.3, h => h.box(0.2, 0.22, 0.22, [0.14, 0.14, 0.16, 0]));
    const cone = new Builder();
    cone.prism(10, 0.95, 0.95, -5.5, 0.08, 0.08, 0, [0.03, 0.03, 0.03, 1], { topColor: [0.9, 0.9, 0.9, 1], capTop: false, flat: true });
    const table = new Builder();
    table.at(0, STAGE_Y + 0.62, -1.22, h => h.box(1.1, 0.05, 0.46, [0.9, 0.9, 0.92, 0.1]));
    [[-0.5, -0.19], [0.5, -0.19], [-0.5, 0.19], [0.5, 0.19]].forEach(([x, z]) => table.at(x, STAGE_Y + 0.31, -1.22 + z, h => h.box(0.05, 0.62, 0.05, [0.2, 0.2, 0.24, 0])));
    table.at(0, STAGE_Y + 0.66, -1.24, h => h.box(0.8, 0.03, 0.3, [0.75, 1, 0.95, 1]));
    table.at(0, 4.0, -0.2, h => h.box(0.02, 0.5, 0.02, [0.1, 0.1, 0.1, 0]));
    const M = { floor: r.mesh(floor), stageBox: r.mesh(stageBox), led: r.mesh(led), word: r.mesh(word), truss: r.mesh(truss), bulbs: r.mesh(bulbMesh), spots: r.mesh(spots), cone: r.mesh(cone), table: r.mesh(table) };
    const SPOTS = crowdSpots(3, [0.8, 1.9], 4.6, 0.5, 0.62, p => p.z > 1.5 && Math.abs(p.x) < 0.5).concat([{ x: -1.35, z: 2.75, r: 0.6, ry: 1, ph: 0.2 }, { x: 1.4, z: 2.8, r: 0.62, ry: 2, ph: 0.6 }]);
    return {
      envAt: (t, st) => {
        const b = st.extras.beat;
        const c1 = beatColor(b), c2 = beatColor(b, 2);
        return { sunDir: V3.norm([0.1, -0.7, -0.7]), sunColor: V3.mul(mix3(c1, [1, 1, 1], 0.6), 0.62), ambTop: V3.mul(mix3(c1, [1, 1, 1], 0.6), 0.3), ambBottom: [0.08, 0.1, 0.12], fogColor: [0.03, 0.05, 0.07], fogNear: 12, fogFar: 30, points: [{ pos: [-2.2, 2.6, 2.4], color: V3.mul(c2, 0.6) }, { pos: [2.2, 2.4, 1], color: V3.mul(c1, 0.55) }] };
      },
      bloom: 0.38,
      look(t, st, camera) {
        camera.grade = mix3([1, 1, 1], beatColor(st.extras.beat), 0.18).concat([0]);
        if (st.extras.rainbow) camera.colorM = colorMatrix(t * 14, 2.4);
      },
      draw(rr, t, st) {
        const b = st.extras.beat;
        const c = beatColor(b);
        rr.draw(M.floor);
        rr.draw(M.stageBox);
        rr.draw(M.led, null, { texture: T.led, tint: V3.mul(mix3(c, [1, 1, 1], 0.2), 0.36), uvScroll: [0, t * 0.08] });
        rr.draw(M.truss);
        rr.draw(M.bulbs, null, { tint: [1, 0.9 + 0.1 * bang(b), 0.8] });
        rr.draw(M.spots);
        rr.draw(M.table);
        rr.draw(X.disco, M4.chain(M4.translate(0, 3.0, -0.2), M4.rotY(t * 0.9), M4.scale(1.5)));
        drawGirl(rr, X.G, st.cast[0]);
        drawDrone(rr, X.D, T, [0.82, STAGE_Y + 1.28 + 0.05 * S(t * 2.3), -1.45], 1, t);
        drawCrowd(rr, X.Mm, T, SPOTS, b);
        rr.draw(M.word, null, { texture: T.neon, additive: true, alpha: 0.6, tint: mix3(c, [1, 1, 1], 0.45) });
        for (let i = 0; i < 6; i++) {
          rr.draw(M.cone, M4.chain(M4.translate(-2.5 + i, 3.95, -0.3), M4.rotZ(0.5 * S(t * 1.3 + i * 1.1)), M4.rotX(-0.5 + 0.25 * S(t * 0.9 + i))), { additive: true, alpha: 0.16, tint: i % 2 ? c : beatColor(b, 3), noFog: true });
        }
        const pulse = 0.25 + 0.35 * bang(b);
        bulbs.forEach(p => glowAt(rr, X, st.camera, p, 0.5, pulse, [1, 0.8, 0.4]));
        for (let i = 0; i < 6; i++) {
          const a = t * 0.9 + i * 1.05;
          if (frac(t * 2.7 + i * 0.29) < 0.45) glowAt(rr, X, st.camera, [C(a) * 0.7, 3.0 + S(a * 1.9) * 0.5, -0.2 + S(a) * 0.7], 0.5, 0.8, [1, 1, 0.9]);
        }
      }
    };
  }

  function buildVhs(r, X) {
    const T = X.T;
    const back = (lo, hi) => {
      const b = new Builder();
      b.quad([-2.6, -0.6, -1.4], [2.6, -0.6, -1.4], [2.6, 2.6, -1.4], [-2.6, 2.6, -1.4], [lo, lo, hi, hi]);
      return r.mesh(b);
    };
    const M = { green: back([0.08, 0.28, 0.12, 0.75], [0.2, 0.5, 0.26, 0.75]), red: back([0.06, 0, 0, 0.85], [0.26, 0.03, 0.03, 0.85]) };
    const GREEN = { sunDir: V3.norm([-0.3, -0.4, -0.85]), sunColor: [0.75, 0.78, 0.72], ambTop: [0.55, 0.62, 0.55], ambBottom: [0.3, 0.38, 0.3], fogColor: [0.05, 0.2, 0.08], fogNear: 30, fogFar: 60 };
    const REDENV = { sunDir: V3.norm([0.5, -0.3, -0.8]), sunColor: [0.9, 0.6, 0.55], ambTop: [0.46, 0.36, 0.38], ambBottom: [0.2, 0.08, 0.08], fogColor: [0.1, 0, 0], fogNear: 30, fogFar: 60, points: [{ pos: [-0.8, 1.2, 0.4], color: [1.2, 0.2, 0.15] }] };
    return {
      envAt: (t, st) => (st.extras.red ? REDENV : GREEN),
      bloom: 0.25,
      look(t, st, camera) {
        camera.fx = { grain: 0.06, vignette: 0.7, time: frac(t * 7.3) };
      },
      draw(rr, t, st) {
        const red = st.extras.red;
        rr.draw(red ? M.red : M.green, null, { noFog: true });
        if (!red) rr.draw(X.Q.center, M4.chain(M4.translate(0.1, 1.05, -1.38), M4.scale(2.4, 2.4, 1)), { texture: T.glow, additive: true, alpha: 0.35, tint: [0.4, 0.9, 0.45], noFog: true });
        else {
          const g = rand(71);
          for (let i = 0; i < 44; i++) {
            const x = (g() - 0.5) * 2.4, sp = 0.1 + g() * 0.2, ph = g(), z = -1.25 + g() * 0.5;
            rr.draw(X.Q.center, M4.chain(M4.translate(x + 0.05 * S(t + i), 2.2 - frac(t * sp + ph) * 2.8, z), M4.scale(0.03 + g() * 0.03)), { texture: T.glow, additive: true, alpha: 0.9, tint: [1, 0.25, 0.12], noFog: true });
          }
        }
        drawGirl(rr, X.G, st.cast[0]);
      }
    };
  }

  function buildStreet(r, X) {
    const T = X.T;
    const sky = new Builder();
    skyBox(sky, [0.36, 0.3, 0.66, 1], [0.22, 0.2, 0.5, 1], [0.08, 0.08, 0.26, 1], 240);
    const moon = new Builder();
    discXY(moon, 0, 0, 0, 5, 16, [1, 1, 0.94, 1], [0, 0, 1]);
    const ground = new Builder();
    [0, TOWER_X, LANTERN_X].forEach(ox => {
      for (let x = -24; x < 24; x += 4) for (let z = -90; z < 8; z += 4) ground.quad([ox + x, 0, z + 4], [ox + x + 4, 0, z + 4], [ox + x + 4, 0, z], [ox + x, 0, z], [0.36, 0.34, 0.44, 0], [[0, 0], [2, 0], [2, 2], [0, 2]]);
    });
    const q = rand(14);
    const town = new Builder();
    town.at(-4.8, 0, -4, h => h.box(3.2, 8, 8, [0.66, 0.5, 0.46, 0], { base: true }));
    for (let i = 0; i < 20; i++) town.at(-3.16, 0.4 + q() * 6.5, -8 + q() * 8, h => h.ellipsoid(0.06, 0.25 + q() * 0.35, 0.3 + q() * 0.35, 5, 4, [0.3, 0.55, 0.26, 0]));
    for (let i = 0; i < 10; i++) town.at(-24 + i * 5.4, 0, -62 - (i % 3) * 4, h => h.box(4.6, 3 + (i % 4) * 1.4, 4, [0.4, 0.38, 0.5, 0], { base: true }));
    town.at(3.1, 0, -4.2, h => {
      h.prism(6, 0.06, 0.06, 0, 0.05, 0.05, 4.2, [0.2, 0.2, 0.24, 0]);
      h.at(-0.35, 4.15, 0, l => l.box(0.8, 0.08, 0.1, [0.2, 0.2, 0.24, 0]));
      h.at(-0.7, 4.05, 0, l => l.box(0.3, 0.12, 0.2, [1, 0.95, 0.8, 1]));
    });
    const houses = new Builder();
    for (let i = 0; i < 6; i++) houses.at(-8.5, 0, -14 - i * 7, h => h.box(5, 4 + (i % 3) * 1.6, 6, [0.5, 0.48, 0.56, 0.1], { base: true, uvScale: 0.3 }));
    const trees = new Builder();
    [[4.4, -4.2], [8.2, -9], [6.5, -13], [9.5, -17], [4.6, -20], [-3, -26], [2.5, -30], [-6, -34]].forEach(([x, z]) => trees.at(x, 0, z, h => {
      h.prism(6, 0.14, 0.14, 0, 0.1, 0.1, 2.2, [0.3, 0.2, 0.14, 0]);
      for (let k = 0; k < 5; k++) h.at((q() - 0.5) * 1.6, 2.4 + q() * 1.4, (q() - 0.5) * 1.6, c => c.ellipsoid(1.1, 0.9, 1.1, 7, 5, [0.95, 0.5 + q() * 0.1, 0.15, 0.05]));
    }));
    const van = new Builder();
    van.at(3.6, 0.3, -6.5, h => {
      h.box(1.7, 1.5, 3.6, [0.12, 0.22, 0.72, 0.05], { base: true });
      h.at(0, 1.1, 1.81, w => w.box(1.5, 0.45, 0.02, [0.5, 0.7, 0.9, 0.3]));
      h.at(-0.55, 0.3, 1.82, l => l.box(0.26, 0.14, 0.02, [1, 0.95, 0.8, 1]));
      [[-0.86, 1.1], [-0.86, -1.1], [0.86, 1.1], [0.86, -1.1]].forEach(([x, z]) => h.push(M4.translate(x, 0, z), M4.rotZ(PI / 2)).prism(10, 0.28, 0.28, -0.1, 0.28, 0.28, 0.1, [0.08, 0.08, 0.09, 0], { capBottom: true }).pop());
    });
    const towers = new Builder();
    [TOWER_X, LANTERN_X].forEach(ox => [[-4, -26, 7, 42], [4, -30, 8, 50], [11, -24, 6, 36], [-11, -32, 7, 30]].forEach(([dx, z, w, hh]) => towers.at(ox + dx, 0, z, c => c.box(w, hh, w, [0.55, 0.6, 0.78, 0.1], { base: true, uvScale: 0.25 }))));
    const walls = new Builder();
    const brickCol = [0.62, 0.5, 0.86, 0];
    walls.at(TOWER_X, 0, -9, h => h.box(24, 3.2, 1, brickCol, { base: true, uvScale: 0.5 }));
    walls.at(LANTERN_X - 1, 0, -5.1, h => h.box(14, 2.9, 1, brickCol, { base: true, uvScale: 0.5 }));
    walls.at(LANTERN_X + 4.2, 0, -3.4, h => h.box(3, 3.6, 3.4, brickCol, { base: true, uvScale: 0.5 }));
    const rails = new Builder();
    const railCol = [0.22, 0.22, 0.28, 0];
    [[TOWER_X, -9, 3.2, 24], [LANTERN_X - 1, -5.1, 2.9, 14]].forEach(([ox, z, y, len]) => {
      for (let x = -len / 2; x <= len / 2; x += 0.6) rails.at(ox + x, y + 0.55, z, h => h.box(0.04, 1.1, 0.04, railCol));
      [0.55, 1.1].forEach(dy => rails.at(ox, y + dy, z, h => h.box(len, 0.04, 0.04, railCol)));
      for (let x = -len / 2; x <= len / 2; x += 0.2) rails.at(ox + x, y + 0.55, z, h => h.box(0.01, 1.05, 0.01, railCol));
    });
    for (let k = 0; k < 8; k++) walls.at(TOWER_X + 5, 0, -2.2 - k * 0.6, h => h.box(2, 0.4 * (k + 1), 0.6, [0.6, 0.56, 0.66, 0], { base: true }));
    for (let k = 0; k < 7; k++) walls.at(LANTERN_X + 2.2, 0, -1.6 - k * 0.42, h => h.box(1.5, 0.3 * (k + 1), 0.42, [0.6, 0.56, 0.66, 0], { base: true }));
    toro(walls, LANTERN_X + 1.3, -3.3, 1.15, [0.66, 0.62, 0.7, 0]);
    const dome = new Builder();
    melonDome(dome, 60, 48, [0.5, 0.8, 0.86, 0.55]);
    const domeS = new Builder();
    domeStem(domeS, 60, 48, [0.4, 0.66, 0.64, 0.25]);
    const M = { sky: r.mesh(sky), moon: r.mesh(moon), ground: r.mesh(ground), town: r.mesh(town), houses: r.mesh(houses), trees: r.mesh(trees), van: r.mesh(van), towers: r.mesh(towers), walls: r.mesh(walls), rails: r.mesh(rails), dome: r.mesh(dome), domeS: r.mesh(domeS) };
    const NIGHT = { sunDir: V3.norm([-0.5, -0.5, -0.7]), sunColor: [0.4, 0.4, 0.7], ambTop: [0.32, 0.3, 0.55], ambBottom: [0.16, 0.14, 0.24], fogColor: [0.2, 0.18, 0.42], fogNear: 30, fogFar: 170, points: [{ pos: [2.6, 4, -4], color: [1, 0.9, 0.6] }] };
    const DOMEENV = Object.assign({}, NIGHT, { points: [{ pos: [-2.2, 3, -3], color: [0.4, 1.6, 0.6] }, { pos: [2.6, 4, -4], color: [1, 0.9, 0.6] }] });
    const PURPLE = { sunDir: V3.norm([0.4, -0.6, -0.7]), sunColor: [0.6, 0.42, 0.8], ambTop: [0.55, 0.42, 0.72], ambBottom: [0.26, 0.18, 0.36], fogColor: [0.24, 0.16, 0.4], fogNear: 30, fogFar: 120, points: [{ pos: [LANTERN_X + 1.3, 1.6, -2.4], color: [1.6, 1.1, 1.3] }] };
    return {
      envAt: (t, st) => (st.extras.purple ? PURPLE : st.extras.dome ? DOMEENV : NIGHT),
      bloom: 0.35,
      look(t, st, camera) {
        if (st.extras.purple) camera.grade = [0.95, 0.68, 1.15, 0.3];
        camera.fx = { grain: 0.03, vignette: 0.35, time: frac(t * 7.3) };
      },
      draw(rr, t, st) {
        const E = st.extras;
        const ox = st.camera.eye[0] > LANTERN_X - 50 ? LANTERN_X : st.camera.eye[0] > TOWER_X - 50 ? TOWER_X : 0;
        rr.draw(M.sky, M4.translate(ox, 0, 0), { noFog: true });
        rr.draw(M.moon, M4.translate(ox - 36, 58, -120), { noFog: true });
        glowAt(rr, X, st.camera, [ox - 36, 58, -119], 34, 0.55, [0.9, 0.9, 1]);
        if (E.dome) {
          const D = M4.translate(ox + (ox ? 34 : 2), -10, ox ? -80 : -95);
          rr.draw(M.dome, D, { texture: T.net, noFog: true });
          rr.draw(M.domeS, D, { noFog: true });
        }
        rr.draw(M.ground, null, { texture: T.asphalt });
        rr.draw(M.town, null, { texture: T.stone });
        rr.draw(M.houses, null, { texture: T.windows });
        rr.draw(M.trees);
        rr.draw(M.van);
        rr.draw(M.towers, null, { texture: T.glass });
        rr.draw(M.walls, null, { texture: T.brick });
        rr.draw(M.rails);
        drawGirl(rr, X.G, st.cast[0]);
        glowAt(rr, X, st.camera, [2.4, 4.05, -4.2], 2.4, 0.5, [1, 0.9, 0.6]);
        if (E.purple) glowAt(rr, X, st.camera, [LANTERN_X + 1.3, 1.22, -3.3], 1.8, 0.6, [1, 0.8, 0.9]);
      }
    };
  }

  function buildSplit(r, X) {
    const T = X.T;
    const Z = -1.2;
    const blue = new Builder();
    blue.tri([-3, -2, Z], [3, 3, Z], [-3, 3, Z], [0.1, 0.2, 0.95, 1]);
    blue.tri([-3, -2, Z], [3, -2, Z], [3, 3, Z], [0.22, 0.44, 1, 1]);
    blue.quad([-3.1, -2.2, Z + 0.01], [-2.8, -2.4, Z + 0.01], [3.2, 2.6, Z + 0.01], [2.9, 2.8, Z + 0.01], [0.72, 0.86, 1, 1]);
    const pink = new Builder();
    pink.tri([-3, 3, Z], [3, -2, Z], [-3, -2, Z], [0.98, 0.45, 0.76, 1]);
    pink.tri([-3, 3, Z], [3, 3, Z], [3, -2, Z], [0.96, 0.12, 0.16, 1]);
    const grid = new Builder();
    grid.quad([-3, -2, Z + 0.02], [3, -2, Z + 0.02], [3, 3, Z + 0.02], [-3, 3, Z + 0.02], [1.6, 1.4, 1, 1], [[0, 0], [6, 0], [6, 5], [0, 5]]);
    const dark = new Builder();
    dark.quad([-4, -2, -1.5], [4, -2, -1.5], [4, 4, -1.5], [-4, 4, -1.5], [0.12, 0.01, 0.02, 1]);
    const lines = new Builder();
    const q = rand(66);
    for (let i = 0; i < 90; i++) {
      const cx = (q() - 0.5) * 6, cy = q() * 3.4 - 0.6, a = q() * PI, len = 0.4 + q() * 1.6, w = 0.008 + q() * 0.012;
      const dx = (C(a) * len) / 2, dy = (S(a) * len) / 2, nx = -S(a) * w, ny = C(a) * w;
      lines.quad([cx - dx - nx, cy - dy - ny, -1.4], [cx + dx - nx, cy + dy - ny, -1.4], [cx + dx + nx, cy + dy + ny, -1.4], [cx - dx + nx, cy - dy + ny, -1.4], [1, 0.12, 0.14, 1]);
    }
    const M = { blue: r.mesh(blue), pink: r.mesh(pink), grid: r.mesh(grid), dark: r.mesh(dark), lines: r.mesh(lines) };
    return {
      env: { sunDir: V3.norm([-0.4, -0.5, -0.75]), sunColor: [0.8, 0.8, 0.82], ambTop: [0.6, 0.62, 0.7], ambBottom: [0.35, 0.36, 0.42], fogColor: [0, 0, 0], fogNear: 40, fogFar: 80 },
      bloom: 0.3,
      look(t, st, camera) {
        if (st.extras.kind === 'scribble') camera.grade = [1.25, 0.55, 0.55, 0.3];
        else camera.fx = { grain: 0.05, vignette: 0.3, time: frac(t * 7.3) };
      },
      draw(rr, t, st) {
        const E = st.extras;
        if (E.kind === 'blue') rr.draw(M.blue, null, { noFog: true });
        else if (E.kind === 'pink') {
          rr.draw(M.pink, null, { noFog: true });
          rr.draw(M.grid, null, { texture: T.grid, additive: true, alpha: 0.35, noFog: true });
        } else {
          rr.draw(M.dark, null, { noFog: true });
          rr.draw(M.lines, M4.translate(0.05 * S(t * 30), 0, 0), { additive: true, alpha: 0.9, noFog: true });
        }
        drawGirl(rr, X.G, st.cast[0]);
        if (E.drone) drawDrone(rr, X.D, T, E.drone, E.droneScale, t, -0.5);
      }
    };
  }

  function buildTitle(r, X) {
    const T = X.T;
    const quad = new Builder();
    quad.quad([-1.7, -0.425, 0], [1.7, -0.425, 0], [1.7, 0.425, 0], [-1.7, 0.425, 0], [1, 1, 1, 1], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    const bars = new Builder();
    [[-1.4, -0.9, [0.1, 0.9, 0.2]], [-0.9, -0.1, [0.1, 0.95, 1]], [-0.1, 0.06, [0.95, 0.95, 0.95]], [0.06, 1.2, [1, 0.95, 0.1]], [1.2, 1.4, [0.2, 0.2, 1]]].forEach(([y0, y1, c]) => bars.quad([-3, y0, 0], [3, y0, 0], [3, y1, 0], [-3, y1, 0], c.concat([1])));
    const M = { quad: r.mesh(quad), bars: r.mesh(bars) };
    return {
      env: { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0, 0, 0], fogNear: 40, fogFar: 80 },
      bloom: 0.6,
      draw(rr, t, st, v) {
        const style = st.extras.style;
        if (style === 'bars') {
          rr.draw(M.bars, M4.translate(0.2 * S(t * 40), 0, 0), { noFog: true });
          return;
        }
        const u = t - v.start;
        let M0 = M4.ident();
        let alpha = 1;
        if (style === 'neon') {
          const k = clamp(u / 2.9, 0, 1);
          M0 = M4.chain(M4.translate(0.2 * k, 0.1 * k, -3.2 * k), M4.rotY(-0.4 * k), M4.rotX(0.25 * k), M4.rotZ(-0.12 * k));
          alpha = (1 - ease((u - 0.5) / 1.6)) * (frac(t * 13) < 0.1 ? 0.7 : 1);
        } else if (style === 'fire') {
          M0 = M4.scale(1 + 0.02 * S(t * 40));
          rr.draw(M.quad, M4.mul(M4.translate(-0.05, 0, 0), M0), { texture: T.titles.fire, additive: true, alpha: 0.6, tint: [1, 0.1, 0.1], noFog: true });
          rr.draw(M.quad, M4.mul(M4.translate(0.05, 0.01, 0), M0), { texture: T.titles.fire, additive: true, alpha: 0.6, tint: [0.2, 0.3, 1], noFog: true });
        } else {
          M0 = M4.translate(0.03 * S(t * 50), 0, 0);
        }
        rr.draw(M.quad, M0, { texture: T.titles[style], additive: true, alpha, noFog: true, tint: style === 'rainbow' ? [0.6, 0.95, 1.2] : undefined });
      }
    };
  }

  const BUILDERS = { club: buildClub, hud: buildHud, eat: buildEat, room: buildRoom, torii: buildTorii, deck: buildDeck, stage: buildStage, vhs: buildVhs, street: buildStreet, split: buildSplit, title: buildTitle };

  function makeQuads(r) {
    const mk = (fn) => { const b = new Builder(); fn(b); return r.mesh(b); };
    const W1 = [1, 1, 1, 1];
    const N = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];
    return {
      unit: mk(b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], W1, null, N)),
      center: mk(b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], W1, null, N)),
      floor: mk(b => b.quad([-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 0, -0.5], [-0.5, 0, -0.5], W1, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]])),
      disc: mk(b => discXY(b, 0, 0, 0, 0.5, 20, W1, [0, 0, 1])),
      bands: Array.from({ length: 36 }, (_, i) => mk(b => {
        const y0 = (i * FH) / 36, y1 = ((i + 1) * FH) / 36;
        b.quad([0, y0, 0], [FW, y0, 0], [FW, y1, 0], [0, y1, 0], W1, [[0, i / 36], [1, i / 36], [1, (i + 1) / 36], [0, (i + 1) / 36]], N);
      })),
      glyphs: DIGITS.split('').map((ch, i) => mk(b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], W1, [[i / 11, 0], [(i + 1) / 11, 0], [(i + 1) / 11, 1], [i / 11, 1]], N)))
    };
  }

  const pad2 = (n) => String(n).padStart(2, '0');
  const timecode = (sec) => {
    const s = Math.max(0, sec);
    return `00:00:${pad2(Math.floor(s) % 60)}:${pad2(Math.floor(frac(s) * 25))}`;
  };

  function create(r) {
    const T = makeTextures(r);
    const X = { T, G: makeGirl(r, T), D: makeDrone(r), Mm: makeMelon(r), Q: makeQuads(r), disco: r.mesh(discoMesh(0.48)) };
    const sets = {};
    const setFor = (id) => {
      if (!sets[id]) sets[id] = BUILDERS[id](r, X);
      return sets[id];
    };
    const F = { full: r.frameTexture(false), prev: r.frameTexture(false), small: r.frameTexture(false), tiny: r.frameTexture(false), pix: r.frameTexture(true) };
    const OVER_ENV = { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0, 0, 0], fogNear: 1000, fogFar: 2000 };
    const ORTHO = new Float32Array([2 / FW, 0, 0, 0, 0, 2 / FH, 0, 0, 0, 0, -1, 0, -1, -1, 0, 1]);
    const VIEW = M4.ident();
    let polys = 0;
    let bloomLevel = 0;
    const tally = () => { polys += r.polys; r.polys = 0; };
    const over = (colorM, colorAdd) => {
      tally();
      r.begin(OVER_ENV, { proj: ORTHO, view: VIEW, colorM, colorAdd }, MAIN, true);
    };
    const rect = (x, y, w, h, opts) => r.draw(X.Q.unit, M4.chain(M4.translate(x, y, 0), M4.scale(w, h, 1)), Object.assign({ noFog: true }, opts));
    const full = (tex, opts, dx) => rect(dx || 0, 0, FW, FH, Object.assign({ texture: tex }, opts));
    const grab = (tex) => r.grab(tex, MAIN.x, MAIN.y, FW, FH);

    function drawView(p, t) {
      const v = p.view;
      const set = setFor(v.scene);
      const st = worldFor(v, t);
      const camera = Object.assign({}, st.camera);
      if (set.look) set.look(t, st, camera, v);
      if (p.dim) camera.grade = p.dim === 'dark' ? [0.2, 0.32, 0.36, 0.85] : [0.5, 0.64, 0.78, 0.85];
      if (v.gray) camera.grade = [0.42, 0.5, 0.62, 1];
      st.camera = camera;
      tally();
      r.begin(set.envAt ? set.envAt(t, st) : set.env, camera, p.rect);
      set.draw(r, t, st, v);
      bloomLevel = Math.max(bloomLevel, set.bloomAt ? set.bloomAt(st) : set.bloom || 0);
    }

    function bloom(k) {
      if (k <= 0.02) return;
      grab(F.full);
      over([1.9, 0, 0, 0, 1.9, 0, 0, 0, 1.9], [-0.68, -0.68, -0.68]);
      rect(0, 0, 128, 72, { texture: F.full });
      r.grab(F.small, MAIN.x, MAIN.y, 128, 72);
      over();
      rect(0, 0, 32, 18, { texture: F.small });
      r.grab(F.tiny, MAIN.x, MAIN.y, 32, 18);
      full(F.full);
      full(F.small, { additive: true, alpha: Math.min(1, 0.55 * k) });
      for (let left = k; left > 0.02; left -= 1) full(F.tiny, { additive: true, alpha: Math.min(1, left) });
    }

    function blur(k) {
      grab(F.full);
      over();
      rect(0, 0, 128, 72, { texture: F.full });
      r.grab(F.small, MAIN.x, MAIN.y, 128, 72);
      rect(0, 0, 32, 18, { texture: F.small });
      r.grab(F.tiny, MAIN.x, MAIN.y, 32, 18);
      full(F.full);
      full(F.small, { blend: true, alpha: k });
      full(F.tiny, { blend: true, alpha: k * 0.85 });
    }

    function rgb(d) {
      grab(F.full);
      over();
      rect(0, 0, FW, FH, { flat: [0, 0, 0, 1] });
      full(F.full, { additive: true, tint: [1, 0, 0] }, -d);
      full(F.full, { additive: true, tint: [0, 1, 0] });
      full(F.full, { additive: true, tint: [0, 0, 1] }, d);
    }

    function glitch(t, o) {
      grab(F.full);
      over();
      const g = rand(o.seed * 7919 + Math.floor(t * 15) * 31);
      const n = o.heavy ? 16 : 8;
      for (let i = 0; i < n; i++) {
        const band = Math.floor(g() * 36);
        const h = 1 + Math.floor(g() * (o.heavy ? 5 : 3));
        const dx = (g() - 0.5) * (o.heavy ? 200 : 100);
        const tint = o.rainbow ? [[1, 0.3, 0.85], [0.3, 1, 0.9], [1, 1, 0.3]][i % 3] : o.cyan ? [0.4, 1, 1] : o.blue ? [0.45, 0.55, 1.4] : undefined;
        for (let j = 0; j < h && band + j < 36; j++) r.draw(X.Q.bands[band + j], M4.translate(dx, 0, 0), { texture: F.full, noFog: true, tint });
      }
      if (o.bars || o.red) {
        const nb = o.red ? 2 : 3;
        for (let i = 0; i < nb; i++) rect(g() * FW * 0.3, g() * FH, FW * (0.4 + g() * 0.6), 5 + g() * 14, { flat: o.red ? [0.95, 0.04, 0.06, 1] : [g() < 0.5 ? 0 : 0.95, 0.04, g() * 0.9, 1] });
      }
      if (o.streak) for (let i = 0; i < 6; i++) rect(0, g() * FH, FW, 2 + g() * 7, { flat: o.cyan ? [0.3, 0.95, 1, 0.8] : [1, 1, 1, 0.7], blend: true });
      if (o.white) for (let i = 0; i < 5; i++) rect(g() * FW, 0, 4 + g() * 22, FH, { flat: [1, 1, 1, 0.8], blend: true });
      if (o.heavy && g() < 0.5) rgb(6 + g() * 8);
    }

    function negative() {
      grab(F.full);
      over([-1, 0, 0, 0, -1, 0, 0, 0, -1], [1, 1, 1]);
      full(F.full);
    }

    function pixel(n) {
      grab(F.full);
      over();
      const w = Math.max(4, Math.round(FW / n)), h = Math.max(3, Math.round(FH / n));
      rect(0, 0, w, h, { texture: F.full });
      r.grab(F.pix, MAIN.x, MAIN.y, w, h);
      full(F.pix);
    }

    function white(a, tint) {
      over();
      const c = tint || [1, 1, 1];
      rect(0, 0, FW, FH, { flat: [c[0], c[1], c[2], clamp(a, 0, 1)], blend: true });
    }

    function blobs(a, t) {
      const g = rand(91);
      for (let i = 0; i < 8; i++) {
        const x = g() * FW, y = g() * FH, s = 70 + g() * 110;
        r.draw(X.Q.disc, M4.chain(M4.translate(x + 24 * S(t * 2 + i), y, 0), M4.scale(s, s * 0.7, 1)), { flat: [0.3, 0.9, 1, a * 0.55], blend: true, noFog: true });
      }
    }

    function streaks(a, t) {
      const g = rand(Math.floor(t * 20) + 3);
      for (let i = 0; i < 7; i++) rect(0, g() * FH, FW, 3 + g() * 12, { flat: [0.85, 1, 0.9, a * 0.8], blend: true });
    }

    function whiteout(t, k) {
      white(0.3 + 0.4 * k);
      const g = rand(Math.floor(t * 12) * 13 + 5);
      const n = 1 + Math.floor(g() * 3);
      for (let i = 0; i < n; i++) {
        const c = g();
        rect(g() * 180, g() * FH, FW * (0.3 + g() * 0.7), 6 + g() * 22, { flat: c < 0.3 ? [0.95, 0.05, 0.05, 1] : c < 0.5 ? [0.5, 0.5, 0.52, 1] : [0, 0, 0, 1] });
      }
    }

    function flareBoost(t, fx) {
      let extra = 0;
      fx.forEach(([t0, t1, kind]) => {
        const k = clamp((t - t0) / (t1 - t0), 0, 1);
        if (kind === 'whiteIn') extra = Math.max(extra, 1.8 * (1 - k));
        if (kind === 'whiteOut') extra = Math.max(extra, 1.8 * k);
        if (kind === 'whiteout') extra = Math.max(extra, 1.2);
      });
      return extra;
    }

    function post(t, fx) {
      fx.forEach(([t0, t1, kind, o]) => {
        const k = clamp((t - t0) / (t1 - t0), 0, 1);
        if (kind === 'dissolve') {
          over();
          full(F.prev, { blend: true, alpha: 1 - ease(k) });
        } else if (kind === 'glitch') glitch(t, o);
        else if (kind === 'jitter') {
          if (frac(t * 4.2) < 0.2) glitch(t, { seed: o.seed + Math.floor(t * 4.2) });
        } else if (kind === 'rgb') rgb(o.amount * (1 - k));
        else if (kind === 'negative') negative();
        else if (kind === 'pixel') pixel(2 + 22 * S(PI * k));
        else if (kind === 'defocus') blur(1 - k);
        else if (kind === 'whiteIn') {
          white(o.hold ? 1 - Math.pow(k, o.hold) : Math.pow(1 - k, o.curve || 1.4), o.tint);
          if (o.blobs) blobs(1 - k, t);
          if (o.streak) streaks(1 - k, t);
        } else if (kind === 'whiteOut') white(Math.pow(k, 1.3));
        else if (kind === 'whiteout') whiteout(t, k);
        else if (kind === 'black' || kind === 'flat') {
          over();
          rect(0, 0, FW, FH, { flat: (o.color || [0, 0, 0]).concat([1]) });
        }
      });
    }

    function drawTimecode(str, x, top, size) {
      const w = size * 0.6;
      for (let i = 0; i < str.length; i++) {
        const gi = DIGITS.indexOf(str[i]);
        if (gi >= 0) r.draw(X.Q.glyphs[gi], M4.chain(M4.translate(x + i * w, FH - top - size, 0), M4.scale(w, size, 1)), { texture: T.digits, noFog: true });
      }
    }

    function hud(t, shot) {
      const kind = shot.hud;
      if (!kind) return;
      over();
      const tex = T.hud[kind];
      if (kind === 'iso') full(T.isoGrid, { additive: true, alpha: 0.35 });
      if (kind !== 'vhsRed') {
        full(tex, { additive: true, tint: [0.9, 0.12, 0.2], alpha: 0.75 }, -1.5);
        full(tex, { additive: true, tint: [0.12, 0.55, 0.95], alpha: 0.75 }, 1.5);
      }
      full(tex);
      if (kind === 'vhs') {
        drawTimecode(timecode(t - shot.start), 352, 238, 24);
        rect(0, FH * frac(t * 0.21), FW, 10, { texture: T.noise, additive: true, alpha: 0.4 });
      }
      if (kind === 'iso') drawTimecode(timecode(t - shot.start + 1.04), 352, 240, 24);
    }

    return {
      warm() {
        Object.keys(BUILDERS).forEach(setFor);
      },
      render(t) {
        polys = 0;
        r.polys = 0;
        bloomLevel = 0;
        const shot = shotAt(t);
        r.clear([0, 0, 0]);
        const fx = FX.filter(f => t >= f[0] && t < f[1]);
        const dis = fx.find(f => f[2] === 'dissolve');
        if (dis) {
          drawView({ rect: MAIN, view: { scene: dis[3].scene, cam: dis[3].cam, start: dis[0] - 5.7, end: dis[1] } }, t);
          grab(F.prev);
        }
        panelsFor(shot, t).forEach(p => drawView(p, t));
        bloom(bloomLevel + flareBoost(t, fx));
        hud(t, shot);
        post(t, fx);
        tally();
        return { shot, polys: Math.round(polys), fade: fadeAt(t), overlay: null };
      }
    };
  }

  const clip = {
    id: 'neck-hurts',
    number: 5,
    artist: 'DJ Melon',
    title: 'Neck Hurts',
    originalYear: 2025,
    audio: 'content/clip/DJ Melon - Neck Hurts.mp3',
    duration: DURATION,
    bpm: BPM,
    poster: 50.3,
    locations: LOCATIONS,
    shots: SHOTS,
    looks: { melon: LOOK, drone: DRONE_LOOK },
    shotAt,
    stage,
    fadeAt,
    create
  };

  window.poligonClips = window.poligonClips || [];
  if (!window.poligonClips.some(c => c.id === clip.id)) window.poligonClips.push(clip);
})();
