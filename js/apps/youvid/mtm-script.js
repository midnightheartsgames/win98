(function () {
  const { clamp } = window.YouVidKit;
  const Sh = window.MedShots;
  const A1 = window.MedAct1;
  const A2 = window.MedAct2;
  const A3 = window.MedAct3;
  const A4 = window.MedAct4;

  const black = () => ({ shot: 'black', kind: 'black' });
  const title = () => ({ shot: 'title', kind: 'card', cards: [{ tex: 'title', alpha: 1 }] });

  const SHOTS = [
    [0, 'dusk', A1.shotDusk],
    [6.381, 'flung', A1.shotFlung],
    [7.257, 'demoRun', A1.shotDemoRun],
    [8.716, 'flash', A1.shotFlash],
    [8.8, 'tumble', A1.shotTumble],
    [10.009, 'crawl', A1.shotCrawl],
    [13.68, 'crawlWide', A1.shotCrawlWide],
    [14.765, 'boom', A1.shotBoom],
    [17.13, 'deadScout', A1.shotDeadScout],
    [18.894, 'title', title],
    [23.065, 'window', A2.shotWindow],
    [32.699, 'laughWide', A2.shotLaughWide],
    [37.996, 'heartTalk', A2.shotHeartTalk],
    [48.048, 'uberDevice', A2.shotUberDevice],
    [49.841, 'attach', A2.shotAttach],
    [55.389, 'doves1', A2.shotDoves1],
    [56.974, 'bloody', A2.shotBloody],
    [62.229, 'fridgeOpen', A2.shotFridgeOpen],
    [63.605, 'fridgeIn', A2.shotFridgeIn],
    [66.441, 'fridgeClose', A2.shotFridgeClose],
    [66.775, 'bigHeart', A2.shotBigHeart],
    [70.279, 'heartCU', A2.shotHeartCU],
    [74.324, 'implant', A2.shotImplant],
    [78.37, 'heavyCU1', A2.shotHeavyCU1],
    [79.913, 'gauge', A2.shotGauge],
    [80.914, 'medicCU1', A2.shotMedicCU1],
    [82.124, 'doves2', A2.shotDoves2],
    [83.375, 'medicCU2', A2.shotMedicCU2],
    [85.711, 'holdHeart', A2.shotHoldHeart],
    [89.715, 'heavyCU2', A2.shotHeavyCU2],
    [92.009, 'lean', A2.shotLean],
    [99.433, 'heavyScream', A2.shotHeavyScream],
    [100.434, 'baby', A2.shotBaby],
    [105.939, 'doveShoulder', A2.shotDoveShoulder],
    [107.524, 'doveCU', A2.shotDoveCU],
    [108.734, 'grabGun', A2.shotGrabGun],
    [110.777, 'beamBlast', A2.shotBeamBlast],
    [111.528, 'heavyCU3', A2.shotHeavyCU3],
    [112.321, 'beamPOV', A2.shotBeamPOV],
    [113.78, 'chestGlow', A2.shotChestGlow],
    [119.661, 'heal', A2.shotHeal],
    [125.625, 'handshake', A2.shotHandshake],
    [129.379, 'medicCU3', A2.shotMedicCU3],
    [132.341, 'black', black],
    [132.841, 'glove', A3.shotGlove],
    [133.925, 'coat', A3.shotCoat],
    [134.635, 'medigunGrab', A3.shotMedigunGrab],
    [136.428, 'door', A3.shotDoor],
    [138.513, 'reveal', A3.shotReveal],
    [144.102, 'pose', A3.shotPose],
    [146.521, 'overShoulder', A3.shotOverShoulder],
    [149.107, 'demoYell', A3.shotDemoYell],
    [151.15, 'demoBoom', A3.shotDemoBoom],
    [151.526, 'medicGrim', A3.shotMedicGrim],
    [152.277, 'fallen', A3.shotFallen],
    [154.029, 'medicLook', A3.shotMedicLook],
    [156.782, 'heal1', A3.shotHeal1],
    [159.826, 'beamDemo', A3.shotBeamDemo],
    [163.621, 'healing', A3.shotHealing],
    [166.166, 'scoutHeal', A3.shotScoutHeal],
    [169.46, 'scoutRun', A3.shotScoutRun],
    [170.504, 'scoutFlex', A3.shotScoutFlex],
    [171.379, 'scoutGib', A3.shotScoutGib],
    [172.13, 'heavyAngry', A3.shotHeavyAngry],
    [172.672, 'bluSoldier', A3.shotBluSoldier],
    [174.59, 'heavyProfile', A3.shotHeavyProfile],
    [175.467, 'feet', A3.shotFeet],
    [176.51, 'bluCharge', A3.shotBluCharge],
    [177.761, 'heavyShout', A3.shotHeavyShout],
    [178.011, 'heavyGrin', A3.shotHeavyGrin],
    [179.596, 'noIdea', A3.shotNoIdea],
    [183.1, 'meter', A3.shotMeter],
    [184.643, 'packGlow', A3.shotPackGlow],
    [186.937, 'aim', A3.shotAim],
    [188.104, 'uberFlash', A3.shotUberFlash],
    [189.314, 'heavyReady', A3.shotHeavyReady],
    [189.981, 'beamCar', A3.shotBeamCar],
    [190.899, 'crackle', A3.shotCrackle],
    [192.234, 'heartUber', A3.shotHeartUber],
    [193.694, 'heavyEyes', A3.shotHeavyEyes],
    [194.945, 'medicLaugh', A3.shotMedicLaugh],
    [196.738, 'pairFire', A3.shotPairFire],
    [197.489, 'white', A3.shotWhite],
    [197.614, 'blast', A3.shotBlast],
    [199.031, 'eyesSmoke', A3.shotEyesSmoke],
    [199.866, 'flashY', A3.shotFlashY],
    [200.2, 'engSniper', A3.shotEngSniper],
    [201.201, 'advance', A3.shotAdvance],
    [205.831, 'mow', A3.shotMow],
    [208.291, 'bluFall', A3.shotBluFall],
    [211.294, 'pileFire', A3.shotPileFire],
    [212.295, 'pileMedic', A3.shotPileMedic],
    [213.296, 'boots', A3.shotBoots],
    [214.339, 'summit', A3.shotSummit],
    [218.844, 'endA', t => A4.shotLineup(t, 'endA')],
    [219.719, 'endB', t => A4.shotLineup(t, 'endB')],
    [220.345, 'endC', t => A4.shotLineup(t, 'endC')],
    [220.971, 'logoA', t => A4.shotLineup(t, 'logoA')],
    [221.638, 'logoB', t => A4.shotLineup(t, 'logoB')],
    [224.391, 'waiting', A4.shotWaiting],
    [230.856, 'doors', A4.shotDoors],
    [232.607, 'scoutGlow', A4.shotScoutGlow],
    [237.696, 'cards', A4.shotCards]
  ];

  const CUTS = SHOTS.map(s => s[0]);

  function stage(t) {
    const tt = clamp(t, 0, Sh.DURATION - 0.001);
    let i = 0;
    while (i < SHOTS.length - 1 && tt >= SHOTS[i + 1][0]) i++;
    return SHOTS[i][2](tt);
  }

  function voiceAt(t) {
    return Sh.jawV(t);
  }

  window.MedScript = { ID: Sh.ID, DURATION: Sh.DURATION, CUTS, SHOTS, LINEUP_SHIFT: A4.LINEUP_SHIFT, stage, voiceAt, X: Sh.X };
})();
