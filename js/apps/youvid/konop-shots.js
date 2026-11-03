(function () {
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const { M4, V3 } = window.P3D;
  const Cast = window.KonopCast;

  const ID = 'k0n0SuBaOp1';
  const DURATION = 99.52;
  const REPLAY_AT = 89.505;
  const REPLAY_SHIFT = 36.245;

  const ENVS = {
    day: { sunDir: [-0.4, -0.8, -0.45], sunColor: [0.42, 0.4, 0.34], ambTop: [0.76, 0.78, 0.8], ambBottom: [0.56, 0.58, 0.55], fogColor: [0.74, 0.86, 0.96], fogNear: 80, fogFar: 600 },
    bright: { sunDir: [-0.3, -0.8, -0.5], sunColor: [0.4, 0.4, 0.38], ambTop: [0.84, 0.86, 0.9], ambBottom: [0.66, 0.7, 0.72], fogColor: [0.86, 0.93, 1.0], fogNear: 60, fogFar: 400 },
    townNight: { sunDir: [0.3, -0.7, -0.6], sunColor: [0.12, 0.14, 0.26], ambTop: [0.34, 0.4, 0.62], ambBottom: [0.2, 0.22, 0.36], fogColor: [0.12, 0.18, 0.34], fogNear: 300, fogFar: 2200 },
    townDay: { sunDir: [-0.5, -0.7, -0.4], sunColor: [0.44, 0.4, 0.32], ambTop: [0.74, 0.76, 0.8], ambBottom: [0.52, 0.52, 0.5], fogColor: [0.7, 0.8, 0.9], fogNear: 200, fogFar: 1800 },
    dawn: { sunDir: [0.5, -0.4, -0.7], sunColor: [0.1, 0.12, 0.22], ambTop: [0.3, 0.38, 0.6], ambBottom: [0.14, 0.18, 0.3], fogColor: [0.1, 0.16, 0.36], fogNear: 40, fogFar: 260 },
    guild: { sunDir: [-0.4, -0.7, -0.5], sunColor: [0.42, 0.32, 0.22], ambTop: [0.78, 0.66, 0.54], ambBottom: [0.48, 0.36, 0.28], fogColor: [0.32, 0.22, 0.14], fogNear: 14, fogFar: 40, points: [{ pos: [-5, 5, -2], color: [0.5, 0.36, 0.16] }, { pos: [5, 5, -2], color: [0.5, 0.36, 0.16] }] },
    dungeon: { sunDir: [0.2, -0.8, -0.5], sunColor: [0.2, 0.22, 0.32], ambTop: [0.5, 0.52, 0.64], ambBottom: [0.28, 0.28, 0.36], fogColor: [0.04, 0.05, 0.08], fogNear: 6, fogFar: 22, points: [{ pos: [-4, 3.6, -5.2], color: [1.2, 0.6, 0.2] }, { pos: [4, 3.6, -5.2], color: [1.2, 0.6, 0.2] }] },
    camp: { sunDir: [0.2, -0.8, -0.5], sunColor: [0.12, 0.16, 0.3], ambTop: [0.4, 0.46, 0.72], ambBottom: [0.18, 0.2, 0.34], fogColor: [0.04, 0.06, 0.14], fogNear: 10, fogFar: 30, points: [{ pos: [0, 0.6, 0], color: [2.4, 1.2, 0.4] }] },
    sunset: { sunDir: [0.6, -0.25, -0.75], sunColor: [0.56, 0.36, 0.26], ambTop: [0.7, 0.56, 0.62], ambBottom: [0.46, 0.32, 0.3], fogColor: [0.96, 0.78, 0.66], fogNear: 30, fogFar: 160 },
    stage: { sunDir: [0.3, -0.7, -0.6], sunColor: [0.3, 0.34, 0.42], ambTop: [0.72, 0.76, 0.86], ambBottom: [0.36, 0.4, 0.5], fogColor: [0.01, 0.01, 0.02], fogNear: 12, fogFar: 40 },
    waste: { sunDir: [-0.5, -0.75, -0.4], sunColor: [0.44, 0.4, 0.34], ambTop: [0.76, 0.78, 0.82], ambBottom: [0.56, 0.54, 0.5], fogColor: [0.74, 0.8, 0.86], fogNear: 60, fogFar: 260 },
    storm: { sunDir: [0.3, -0.6, -0.7], sunColor: [0.3, 0.16, 0.08], ambTop: [0.32, 0.3, 0.36], ambBottom: [0.2, 0.16, 0.14], fogColor: [0.12, 0.1, 0.12], fogNear: 80, fogFar: 500 },
    night: { sunDir: [0.3, -0.7, -0.6], sunColor: [0.14, 0.18, 0.32], ambTop: [0.36, 0.44, 0.66], ambBottom: [0.16, 0.2, 0.32], fogColor: [0.06, 0.1, 0.22], fogNear: 40, fogFar: 300 },
    shop: { sunDir: [-0.4, -0.6, -0.6], sunColor: [0.5, 0.36, 0.2], ambTop: [0.82, 0.66, 0.48], ambBottom: [0.5, 0.36, 0.24], fogColor: [0.4, 0.26, 0.12], fogNear: 10, fogFar: 30 },
    hall: { sunDir: [0.6, -0.4, -0.5], sunColor: [0.3, 0.6, 1.0], ambTop: [0.3, 0.42, 0.66], ambBottom: [0.1, 0.14, 0.26], fogColor: [0.01, 0.02, 0.05], fogNear: 14, fogFar: 50 },
    forest: { sunDir: [-0.3, -0.8, -0.5], sunColor: [0.44, 0.42, 0.32], ambTop: [0.7, 0.8, 0.74], ambBottom: [0.44, 0.54, 0.44], fogColor: [0.74, 0.86, 0.82], fogNear: 30, fogFar: 140 },
    vista: { sunDir: [-0.4, -0.8, -0.45], sunColor: [0.42, 0.4, 0.34], ambTop: [0.76, 0.78, 0.8], ambBottom: [0.56, 0.58, 0.55], fogColor: [0.78, 0.86, 0.94], fogNear: 400, fogFar: 2600 },
    white: { sunDir: [-0.3, -0.6, -0.7], sunColor: [0.3, 0.3, 0.3], ambTop: [0.86, 0.86, 0.86], ambBottom: [0.66, 0.66, 0.66], fogColor: [1, 1, 1], fogNear: 100, fogFar: 200 }
  };

  const B1 = [['原作', 724, 410, 810, 450], ['暁なつめ', 910, 400, 1124, 464], ['原作イラスト', 625, 522, 865, 562], ['三嶋くろね', 1003, 515, 1257, 570], ['（株式会社KADOKAWA 角川スニーカー文庫刊）', 465, 615, 1415, 665]];
  const B3 = [['製作', 264, 224, 350, 264]].concat(['堀内大示', '武智恒雄', '野口和紀', '北條　真', '南沢道義', '樫村　勉', '篠崎文彦', '河野至孝'].map((n, i) => [n, 352, [334, 410, 484, 560, 636, 712, 788, 862][i] - 26, 568, [334, 410, 484, 560, 636, 712, 788, 862][i] + 26]));

  const CREDITS = [
    { id: 'c1n', t0: 0.95, t1: 1.95, col: '#3ce8de', edge: '#06323e', lines: B1 },
    { id: 'c1d', t0: 1.85, t1: 3.0, col: '#e8b400', edge: '#4a3c00', lines: B1, noGlitch: true },
    { id: 'c2', t0: 3.85, t1: 6.42, col: '#ff9424', edge: '#5a2400', lines: [['企画', 364, 400, 444, 436], ['菊池　剛', 540, 476, 760, 536], ['工藤大丈', 544, 604, 760, 664]] },
    { id: 'c3', t0: 24.95, t1: 27.9, col: '#ff8a1e', edge: '#fff0d8', lines: B3 },
    { id: 'c4', t0: 28.0, t1: 30.27, col: '#d8bc1c', edge: '#3e4a0c', lines: [['シリーズ構成', 210, 264, 480, 316], ['上江洲誠', 490, 360, 704, 416], ['キャラクターデザイン', 200, 560, 644, 604], ['菊田幸一', 486, 656, 700, 708]] },
    { id: 'c5', t0: 30.45, t1: 31.9, col: '#d8b400', edge: '#fff8c8', lines: [['美術監督', 720, 160, 890, 200], ['三宅昌和', 1004, 156, 1220, 208], ['色彩設計', 720, 280, 890, 320], ['吉田沙織', 1004, 276, 1220, 332], ['撮影監督', 720, 400, 890, 440], ['浜尾繁光', 1004, 396, 1220, 452]] },
    { id: 'c6', t0: 34.85, t1: 37.2, col: '#3cc83c', edge: '#f0fff0', lines: [['編集', 1280, 584, 1366, 624], ['木村佳史子', 1400, 660, 1670, 716], ['音響監督', 1296, 810, 1466, 850], ['岩浪美和', 1444, 890, 1660, 944]] },
    { id: 'c7', t0: 38.85, t1: 41.9, col: '#2ec246', edge: '#f0fff0', lines: [['音楽', 1206, 164, 1290, 204], ['甲田雅人', 1352, 230, 1570, 290]] },
    { id: 'c8', t0: 42.45, t1: 44.33, col: '#ff8a20', edge: '#fff4e0', lines: [['音楽プロデューサー', 1214, 574, 1580, 610], ['穴井健太郎', 1400, 652, 1670, 706], ['音楽制作', 1224, 780, 1390, 820], ['日本コロムビア', 1316, 880, 1680, 936]] },
    { id: 'song', t0: 50.55, t1: 52.97, col: '#7ad040', edge: '#f4fff0', lines: [['オープニング主題歌', 810, 290, 1190, 334], ['「fantastic dreamer」', 580, 390, 1370, 460, { latin: true, weight: 'normal' }], ['歌', 896, 500, 944, 550], ['Machico', 1026, 500, 1280, 560, { latin: true, weight: 'normal' }], ['作詞・作曲・編曲', 556, 620, 936, 676], ['園田智也', 1026, 620, 1240, 676], ['（日本コロムビア）', 1040, 720, 1380, 770]] },
    { id: 'c10', t0: 55.15, t1: 57.62, col: '#2ed2a0', edge: '#f0fffa', lines: [['プロデューサー', 636, 846, 930, 896], ['小倉理絵', 1020, 840, 1240, 900]] },
    { id: 'c11', t0: 58.72, t1: 62.27, col: '#3cd04e', edge: '#f0fff0', lines: [['助監督', 1166, 744, 1294, 784], ['吉田俊司', 1370, 846, 1584, 904]] },
    { id: 'c12', t0: 66.42, t1: 67.94, col: '#f0a020', edge: '#fff8e0', lines: [['アニメーションプロデューサー', 1054, 766, 1630, 810], ['浦崎宣光', 1426, 880, 1640, 936]] },
    { id: 'c13', t0: 68.5, t1: 69.99, col: '#a0e040', edge: '#f8fff0', lines: [['アニメーション制作', 1176, 756, 1544, 800], ['スタジオディーン', 1270, 852, 1686, 912]] },
    { id: 'c14', t0: 73.05, t1: 78.99, col: '#30c0f0', edge: '#f0faff', lines: [['監督', 322, 390, 404, 424], ['金崎貴臣', 466, 480, 680, 532]] },
    { id: 'c15', t0: 85.75, t1: 89.5, col: '#5ec22e', edge: '#f8fff0', lines: [['製作', 244, 500, 324, 536], ['このすば製作委員会', 426, 490, 910, 544]] }
  ];

  function creditsAt(t) {
    return CREDITS.filter(c => t >= c.t0 && t < c.t1);
  }

  function armsDown(who) {
    const w = who === 'kazuma' || who === 'kazumaJ' ? 0.21 : 0.19;
    return { hL: [w, -0.25, 0.03], eL: [0.25, 0, -1], hR: [-w, -0.25, 0.03], eR: [-0.25, 0, -1] };
  }

  function stand(who, o) {
    return Object.assign({ pos: [0, Cast.standY(who), 0], yaw: 0, eyes: 'open', mouth: 'smile' }, Cast.standLegs(who), armsDown(who), o || {});
  }

  function at(who, x, z, o) {
    const p = stand(who, o);
    p.pos = [x, p.pos[1] + ((o && o.dy) || 0), z];
    return p;
  }

  function walkLegs(who, phase, stride, lift) {
    const D = Cast.dims(who);
    const L = (D.thigh + D.shin) * 0.985;
    const sw = stride || 0.2, lf = lift || 0.07;
    const s = S(phase), c = C(phase);
    return {
      fL: [0.07, D.hipY - L + Math.max(0, c) * lf, s * sw],
      kL: [0.03, 0, 1],
      fR: [-0.07, D.hipY - L + Math.max(0, -c) * lf, -s * sw],
      kR: [-0.03, 0, 1],
      hL: [0.18, -0.24, -s * 0.12],
      eL: [0.2, 0, -1],
      hR: [-0.18, -0.24, s * 0.12],
      eR: [-0.2, 0, -1]
    };
  }

  function walker(who, x, z, yaw, phase, o) {
    const p = Object.assign({ pos: [x, Cast.standY(who, 0.985) + Math.abs(S(phase)) * 0.012, z], yaw, eyes: 'open', mouth: 'smile' }, walkLegs(who, phase, 0.2), o || {});
    return p;
  }

  function runner(who, x, z, yaw, phase, o) {
    const D = Cast.dims(who);
    const L = (D.thigh + D.shin);
    const s = S(phase), c = C(phase);
    return Object.assign({
      pos: [x, Cast.standY(who, 0.93) + Math.abs(s) * 0.05, z], yaw, lean: 0.3, sp: [0.1, 0, 0],
      fL: [0.07, D.hipY - L * 0.93 + Math.max(0, c) * 0.22, s * 0.38], kL: [0.03, 0.3, 1],
      fR: [-0.07, D.hipY - L * 0.93 + Math.max(0, -c) * 0.22, -s * 0.38], kR: [-0.03, 0.3, 1],
      hL: [0.2, -0.1, -s * 0.22], eL: [0.3, -0.2, -1], hR: [-0.2, -0.1, s * 0.22], eR: [-0.3, -0.2, -1],
      eyes: 'open', mouth: 'open'
    }, o || {});
  }

  function sitGround(who, x, z, yaw, o) {
    const D = Cast.dims(who);
    const cy = C(yaw), sy = S(yaw);
    const fw = (d, side) => [x + sy * d + cy * side, 0.07, z + cy * d - sy * side];
    return Object.assign({
      pos: [x, 0.2, z], yaw, lean: -0.05,
      fLw: fw(0.12, 0.2), kLw: fw(0.3, 0.3), fRw: fw(0.1, -0.22), kRw: fw(0.3, -0.3),
      aL: 0, aR: 0, eyes: 'open', mouth: 'smile'
    }, o || {});
  }

  function lieDown(who, x, z, heading, o) {
    const D = Cast.dims(who);
    const dir = [S(heading), 0, C(heading)];
    const face = (o && o.faceUp) ? [0, 1, 0] : [0, -1, 0];
    const up = dir;
    const fwd = face;
    const hip = [x, 0.14, z];
    const foot = (side) => {
      const sd = [C(heading) * side, 0, -S(heading) * side];
      return V3.add(hip, V3.add(V3.mul(dir, -(D.thigh + D.shin) * 0.95), V3.add(V3.mul(sd, 0.1), [0, -0.05, 0])));
    };
    return Object.assign({
      pos: hip, up, fwd,
      fLw: foot(1), kLw: V3.add(hip, face), fRw: foot(-1), kRw: V3.add(hip, face),
      eyes: 'shut', mouth: 'flat'
    }, o || {});
  }

  function blinkAt(t, list) {
    return list.some(b => t >= b && t < b + 0.12);
  }

  function cam(eye, atp, fov, o) {
    return Object.assign({ eye, at: atp, fov }, o || {});
  }

  function lerpV(a, b, k) {
    return a.map((v, i) => lerp(v, b[i], k));
  }

  function camLerp(a, b, k, fovA, fovB, o) {
    return Object.assign({ eye: lerpV(a.eye, b.eye, k), at: lerpV(a.at, b.at, k), fov: lerp(fovA || a.fov, fovB || b.fov, k) }, o || {});
  }

  function shake(t, amp, seed) {
    return K.wobble(t * 7, amp, seed || 3);
  }

  function blank(o) {
    return Object.assign({
      kind: 'scene', env: 'day', set: 'none', world: {}, camera: cam([0, 1.5, 4], [0, 1.2, 0], 40),
      cast: [], foes: [], sprites: [], lines: [], ribbons: [], circles: [], domes: [], pillars: [], cubes: [],
      backdrop: [], front: [], logo: null, bg: null, flash: 0, flashColor: [1, 1, 1], fade: 1, grade: null, speed: 0
    }, o || {});
  }

  window.KonopShots = { ID, DURATION, REPLAY_AT, REPLAY_SHIFT, ENVS, CREDITS, creditsAt, armsDown, stand, at, walkLegs, walker, runner, sitGround, lieDown, blinkAt, cam, camLerp, lerpV, shake, blank };
})();
