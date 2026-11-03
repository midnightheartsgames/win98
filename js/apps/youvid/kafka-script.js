(function () {
  const K = window.YouVidKit;
  const { clamp } = K;
  const Sh = window.KafkaShots;
  const A1 = window.KafkaAct1;
  const A2 = window.KafkaAct2;
  const A3 = window.KafkaAct3;

  const SHOTS = [
    [0, 2.45, A1.studioIntro],
    [2.45, 5.95, A1.handGlow],
    [5.95, 8.35, A1.guardsHall],
    [8.35, 10.62, A1.handGlow2],
    [10.62, 14.25, A1.chandelierGuard],
    [14.25, 14.8, A1.darkRibbon],
    [14.8, 18.75, A1.montage],
    [18.75, 20.15, A1.theaterProfile],
    [20.15, 20.35, A1.pinkDoor],
    [20.35, 21.05, A1.petalWhip],
    [21.05, 21.95, A1.corridorGuards],
    [21.95, 24.42, A1.stairGuards],
    [24.42, 25.8, A1.eyesGlow],
    [25.8, 28.45, A1.poster],
    [28.45, 28.95, A1.blackDip],
    [28.95, 29.98, A1.stairsGlasses],
    [29.98, 32.42, A1.laserHall],
    [32.42, 33.0, A1.guardAimDark],
    [33.0, 33.3, A1.overShoulder],
    [33.3, 33.78, A1.armorClose],
    [33.78, 36.48, A1.profileLasers],
    [36.48, 37.15, A1.corridorBack],
    [37.15, 37.75, A2.darkFight],
    [37.75, 37.95, A2.pinkPetalFlash],
    [37.95, 39.35, A2.bwFall],
    [39.35, 40.75, A2.inkFlower],
    [40.75, 41.8, A2.lyingTop],
    [41.8, 42.98, A2.faceSideways],
    [42.98, 43.38, A2.kaleidoFace],
    [43.38, 46.0, A2.redWindowStand],
    [46.0, 46.4, A2.whiteBlast],
    [46.4, 48.75, A2.smokeRoom],
    [48.75, 49.48, A2.nightClose],
    [49.48, 50.18, A2.katanaFace],
    [50.18, 51.05, A2.guardClose],
    [51.05, 51.38, A2.guardFire],
    [51.38, 51.98, A2.clock1],
    [51.98, 52.42, A2.smokeWalk],
    [52.42, 52.95, A2.guardSlash],
    [52.95, 53.35, A2.kafkaShoots],
    [53.35, 53.88, A2.guardFront],
    [53.88, 54.58, A2.kafkaJump],
    [54.58, 55.12, A2.clock2],
    [55.12, 55.75, A2.smgCorridor],
    [55.75, 56.38, A2.closeFight],
    [56.38, 57.2, A2.corridorGun],
    [57.2, 57.75, A2.backClose],
    [57.75, 57.98, A2.orangeSlash],
    [57.98, 58.38, A2.sparksShoot],
    [58.38, 58.78, A2.corridorDark],
    [58.78, 59.18, A2.smgClose],
    [59.18, 59.38, A2.rifleClose],
    [59.38, 59.98, A2.slashFlash],
    [59.98, 61.05, A2.topDodge],
    [61.05, 61.78, A2.upsideDown],
    [61.78, 62.42, A2.clock3],
    [62.42, 64.98, A3.drawKatana],
    [64.98, 67.58, A3.liftDoor],
    [67.58, 69.55, A3.liftTop],
    [69.55, 71.4, A3.legsWalk],
    [71.4, 71.98, A3.pinkStreaks],
    [71.98, 73.18, A3.bwWebCenter],
    [73.18, 74.78, A3.bwWebGuards],
    [74.78, 75.35, A3.bwKaleido],
    [75.35, 75.95, A3.bwTorso],
    [75.95, 76.98, A3.katanaBokeh],
    [76.98, 77.78, A3.redFlares],
    [77.78, 78.85, A3.redRun],
    [78.85, 79.55, A3.katanaLasers],
    [79.55, 79.98, A3.crackFace],
    [79.98, 80.75, A3.gunRaised],
    [80.75, 81.38, A3.laserWeb],
    [81.38, 82.38, A3.legsGuards],
    [82.38, 82.98, A3.handEnergy],
    [82.98, 85.48, A3.helmet],
    [85.48, 86.38, A3.spotlight],
    [86.38, 87.35, A3.screenSmile],
    [87.35, 87.98, A3.entracte],
    [87.98, 88.88, A3.blurFace],
    [88.88, 91.38, A3.ruins],
    [91.38, 92.98, A3.boots],
    [92.98, 93.98, A3.glassesAdjust],
    [93.98, 94.38, A3.surprised],
    [94.38, 95.38, A3.blastHall],
    [95.38, 96.6, A3.terms],
    [96.6, 97.35, A3.endScreen],
    [97.35, 98.15, A3.blackGap],
    [98.15, 100.38, A3.redHallWalk],
    [100.38, 101.18, A3.fallenGuard],
    [101.18, 103.18, A3.coinHand],
    [103.18, 104.18, A3.coinClose],
    [104.18, 107.18, A3.seated],
    [107.18, 108.45, A3.blackGap],
    [108.45, 112.58, A3.umbrella],
    [112.58, 113.95, A3.profileSmile],
    [113.95, 118.45, A3.logo],
    [118.45, Sh.DURATION + 0.01, A3.outro]
  ];

  const CUTS = SHOTS.map(s => s[0]);

  function stage(rawT) {
    const t = clamp(rawT, 0, Sh.DURATION);
    const shot = SHOTS.find(x => t >= x[0] && t < x[1]) || SHOTS[SHOTS.length - 1];
    const s = shot[2](t);
    s.t = t;
    s.voice = Sh.VOICE(t);
    return s;
  }

  window.KafkaScript = { ID: Sh.ID, DURATION: Sh.DURATION, CUTS, VOICE: Sh.VOICE, ENVS: Sh.ENVS, GRADE: Sh.GRADE, LINES: Sh.LINES, SHOTS, stage };
})();
