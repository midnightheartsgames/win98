(function () {
  const { clamp } = window.YouVidKit;
  const Sh = window.MpyShots;
  const R = window.MpyReal;
  const L = window.MpyLand;

  const black = () => ({ shot: 'black', kind: 'black' });

  const SHOTS = [
    [0, 'title', R.shotTitle],
    [6.172, 'walk', R.shotWalk],
    [11.177, 'heavy', R.shotHeavy],
    [19.978, 'street', R.shotStreet],
    [24.482, 'scout', R.shotScout],
    [30.905, 'bolt', R.shotBolt],
    [31.447, 'tumble', R.shotTumble],
    [32.365, 'spyhide', R.shotSpyHide],
    [32.532, 'pilot', R.shotPilot],
    [37.04, 'spy', R.shotSpy],
    [42.917, 'nozzle', R.shotNozzle],
    [44.294, 'inferno', R.shotInferno],
    [47.13, 'turn', R.shotTurn],
    [50.59, 'black', black],
    [52.0, 'glowIn', R.shotLensGlow],
    [53.261, 'lenses', L.shotLenses],
    [55.888, 'valley', L.shotValley],
    [63.396, 'path', L.shotPath],
    [65.064, 'lollihill', L.shotLolliHill],
    [67.942, 'babyheavy', L.shotBabyHeavy],
    [69.277, 'meadow', L.shotMeadow],
    [73.489, 'jump', L.shotJump],
    [74.907, 'leap', L.shotLeap],
    [75.742, 'realaxe', R.shotRealAxe],
    [76.451, 'bonk', L.shotBonk],
    [78.828, 'babyscout', L.shotBabyScout],
    [80.872, 'forest', L.shotForest],
    [81.914, 'scoutclose', L.shotScoutClose],
    [83.499, 'realflare', R.shotRealFlare],
    [84.917, 'bubbles', L.shotBubbles],
    [88.004, 'gift', L.shotGift],
    [89.547, 'wave', L.shotWave],
    [90.673, 'giftback', L.shotGiftBack],
    [91.591, 'realmedic', R.shotRealMedic],
    [93.426, 'realshed', R.shotRealShed],
    [94.886, 'flash', () => ({ shot: 'flash', kind: 'card', cards: [], white: 1, whiteCol: [1, 0.86, 0.96, 1] })],
    [95.011, 'town', L.shotTown],
    [96.971, 'plaza', L.shotPlaza],
    [100.933, 'bridge', L.shotBridge],
    [107.357, 'demolaugh', L.shotDemoLaugh],
    [107.982, 'realdemo', R.shotRealDemo],
    [109.442, 'realsniper', R.shotRealSniper],
    [110.068, 'realfall', R.shotRealFall],
    [110.943, 'realcrawl', R.shotRealCrawl],
    [112.32, 'realjar', R.shotRealJar],
    [114.489, 'realtank', R.shotRealTank],
    [116.532, 'realwhite', R.shotRealWhite],
    [116.699, 'realmask', R.shotRealMask],
    [118.701, 'endLens', t => R.shotLineup(t, 'endLens')],
    [119.41, 'endA', t => R.shotLineup(t, 'endA')],
    [120.036, 'endB', t => R.shotLineup(t, 'endB')],
    [120.662, 'endC', t => R.shotLineup(t, 'endC')],
    [121.329, 'logo', t => R.shotLineup(t, 'logo')],
    [124.207, 'epiland', L.shotEpilogueLand],
    [128.0, 'epilogue', R.shotEpilogueReal],
    [138.45, 'black', black],
    [140.98, 'sfm', R.shotSfm],
    [147.72, 'black', black]
  ];

  const CUTS = SHOTS.map(s => s[0]);

  function stage(t) {
    const tt = clamp(t, 0, Sh.DURATION - 0.001);
    let i = 0;
    while (i < SHOTS.length - 1 && tt >= SHOTS[i + 1][0]) i++;
    return SHOTS[i][2](tt);
  }

  function voiceAt(t) {
    return Math.max(Sh.heavyV(t), Sh.scoutV(t), Sh.spyV(t));
  }

  window.MpyScript = { ID: Sh.ID, DURATION: Sh.DURATION, CUTS, SHOTS, stage, voiceAt };
})();
