(function () {
  const K = window.YouVidKit;
  const { clamp } = K;
  const A = window.NagArt;
  const Sh = window.NagShots;
  const A1 = window.NagAct1;
  const A2 = window.NagAct2;
  const { NF, SF, seg } = Sh;

  const REPLAY = 41.166;

  const SHOTS = [
    [0, 2.001, A1.intro],
    [2.001, 2.71, A1.ijiranaide],
    [2.71, 4.379, A1.feet],
    [4.379, 5.421, A1.faceTurn],
    [5.421, 6.589, A1.kanaIji],
    [6.589, 7.715, A1.glassesGrin],
    [7.715, 9.05, A1.kanaRanaide],
    [9.05, 10.301, A1.senpaiShock],
    [10.301, 11.636, A1.kanaNagatoro],
    [11.636, 12.679, A1.twoShot],
    [12.679, 13.888, A1.kanaTitle],
    [13.888, 14.806, A1.fireworks],
    [14.806, 15.682, A1.faceFront],
    [15.682, 20.311, A1.collage],
    [20.311, 21.813, A1.greenStand],
    [21.813, 22.981, A1.senpaiFacepalm],
    [22.981, 24.148, A1.senpaiSqueeze],
    [24.148, 25.066, A1.hugReading],
    [25.066, 25.483, A1.senpaiYell],
    [25.483, 25.66, A1.senpaiPush],
    [25.66, 30.405, A1.classroom],
    [30.405, 31.948, A1.sketchbook],
    [31.948, 33.241, A1.nailHand],
    [33.241, 34.742, A1.profileKiss],
    [34.742, 36.202, A1.senpaiPow],
    [36.202, 38.079, A1.chuckle],
    [38.079, 38.663, A1.devilFlash],
    [38.663, 40.665, A1.senpaiGrit],
    [40.665, 40.915, A1.yellLaugh],
    [40.915, 41.249, A1.spiralGlasses],
    [41.249, 43.71, A1.senpaiCry],
    [43.71, 45.044, A1.master],
    [45.044, 47.255, A1.gang],
    [47.255, 47.71, A1.pupupu],
    [47.71, 48.798, A1.pointLaugh],
    [48.798, 51.0, A2.kimo],
    [51.0, 52.093, A2.faceDoodle],
    [52.093, 52.5, A2.jumpUp],
    [52.5, 54.512, A2.kissBlow],
    [54.512, 55.305, A2.senpaiDoki],
    [55.305, 56.347, A2.friends],
    [56.347, 57.432, A2.redSmirk],
    [57.432, 58.641, A2.eyeClose],
    [58.641, 60.977, A2.walkLight],
    [60.977, 62.55, A2.eyesOpen],
    [62.55, 64.105, A2.pastel],
    [64.105, 64.564, A2.dance],
    [64.564, 65.106, A2.bigType('EASY', 'LOVE', '#36e3e8', 1)],
    [65.106, 65.8, A2.easyRows],
    [65.8, 66.441, A2.nightDate],
    [66.441, 67.066, A2.yarashi],
    [67.066, 67.817, A2.annoyed],
    [67.817, 69.736, A2.devilGrin],
    [69.736, 71.029, A2.reading],
    [71.029, 71.946, A2.magazineHold],
    [71.946, 74.282, A2.dreamy],
    [74.282, 75.283, A2.turnBack],
    [75.283, 76.618, A2.doorEye],
    [76.618, 77.368, A2.terror],
    [77.368, 77.994, A2.devilGreen],
    [77.994, 79.412, A2.tackle],
    [79.412, 79.829, A2.kanaCard('イジら', '#1cd52d', '#f64de6', '#4ae85a', {})],
    [79.829, 80.163, A2.kanaCard('ないで', '#9a2efc', '#70f23a', '#b45afc', {})],
    [80.163, 80.455, A2.kanaCard('長瀞', '#f9d504', '#f32cf9', '#fbe44a', { size: 170, ruby: [['なが', 250, 70], ['とろ', 420, 70]] })],
    [80.455, 80.705, A2.kanaCard('さん', '#fb005b', '#b00adf', '#fb3a7a', {})],
    [80.705, 84.417, A2.logoShot],
    [84.417, 85.668, A2.headPat],
    [85.668, 86.836, A2.poke],
    [86.836, 87.629, A2.heartbeat],
    [87.629, 88.296, A2.heartsGrin],
    [88.296, 88.43, A2.bigIjira],
    [88.43, 88.735, A2.bigNaga],
    [88.735, 88.85, A2.bigSan],
    [88.85, 89.964, A2.finale],
    [89.964, Sh.DURATION + 0.01, endCard]
  ];

  const CUTS = SHOTS.map(s => s[0]);

  function shotAt(t) {
    let i = SHOTS.findIndex(x => t >= x[0] && t < x[1]);
    if (i < 0) i = SHOTS.length - 1;
    return i;
  }

  function build(t, i) {
    const [t0, t1, fn] = SHOTS[i];
    const lt = t - t0;
    const s = fn(t, lt, clamp(lt / (t1 - t0), 0, 1)) || {};
    s.t = t;
    s.lt = lt;
    s.k = clamp(lt / (t1 - t0), 0, 1);
    s.f = Math.floor(t * 12 + 1e-6);
    s.shot = i;
    s.layers = s.layers || [];
    s.stamp = i + ':' + Math.floor(t * (s.fps2d || 12) + 1e-6);
    return s;
  }

  function endCard(t, lt) {
    const rt = t - REPLAY;
    const s = build(rt, shotAt(rt));
    s.post = Object.assign({}, s.post || {}, { blur: 2.6 });
    const k = seg(lt, 1.25, 1.85);
    s.over = (ctx) => A.endCard(ctx, 640, 360, k);
    s.overStamp = Math.round(k * 20);
    return s;
  }

  function stage(rawT) {
    const t = clamp(rawT, 0, Sh.DURATION);
    const i = shotAt(t);
    const s = build(t, i);
    if (i === SHOTS.length - 1) s.stamp = 'end:' + s.stamp + ':' + (s.overStamp || 0);
    return s;
  }

  const WARM = [['nagatoro', NF.grin], ['nagatoro', NF.smug], ['nagatoro', NF.laugh], ['nagatoro', NF.soft], ['senpai', SF.flat], ['senpai', SF.shock], ['senpai', SF.yell]];

  window.NagScript = { ID: Sh.ID, DURATION: Sh.DURATION, REPLAY, SHOTS, CUTS, stage, WARM };
})();
