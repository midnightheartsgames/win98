(function () {
  const K = window.YouVidKit;
  const { clamp } = K;
  const Sh = window.MspShots;
  const { X } = Sh;

  const black = () => ({ shot: 'black', kind: 'black' });

  const A = window.MspAct1;
  const B = window.MspAct2;
  const C3 = window.MspAct3;
  const D4 = window.MspAct4;

  const SHOTS = [
    [0, 'black', black],
    [0.583, 'bell', A.bellShot],
    [1.542, 'signs', A.signsShot],
    [3.875, 'board', A.boardShot],
    [5.625, 'rack', A.rackShot],
    [6.792, 'legs', A.legsShot],
    [8.375, 'jump', A.jumpShot],
    [9.5, 'whip', A.whipShot],
    [9.875, 'charge', A.chargeShot],
    [11.875, 'whip2', A.whip2Shot],
    [12.542, 'side', A.sideShot],
    [15.792, 'keypad', A.keypadShot],
    [17.917, 'door', A.doorShot],
    [19.625, 'heavyRun', A.heavyRunShot],
    [20.708, 'heavyYell', A.heavyYellShot],
    [20.917, 'shoulder', A.shoulderShot],
    [21.667, 'burst', A.burstShot],
    [23.75, 'relief', A.reliefShot],
    [28.417, 'spyDoor', A.spyDoorShot],
    [30.917, 'title', A.titleShot],
    [34.041, 'spyLow', A.spyLowShot],
    [36.541, 'spyWalk', B.spyWalkShot],
    [47.541, 'throw', B.throwShot],
    [47.916, 'knife', B.knifeShot],
    [50.416, 'scoutSeat', B.scoutSeatShot],
    [58.416, 'faceOff', B.faceOffShot],
    [65.041, 'pass', B.passShot],
    [66.916, 'trio', B.trioShot],
    [68.666, 'mapTurn', B.mapTurnShot],
    [73.791, 'toss', B.tossShot],
    [73.916, 'photosTable', B.photosTableShot],
    [75.082, 'photo', B.photoCardShot],
    [77.457, 'trioTable', B.trioTableShot],
    [79.291, 'spyTalk', B.spyTalkShot],
    [86.291, 'scoutAngry', B.scoutAngryShot],
    [87.666, 'photosLaugh', B.photosLaughShot],
    [90.416, 'lighter', B.lighterShot],
    [92.957, 'mapBack', B.mapBackShot],
    [95.791, 'shadow', C3.shadowShot],
    [96.917, 'corridorRed', C3.corridorRedShot],
    [98.792, 'sentry', C3.sentryShot],
    [100.458, 'sapper', C3.sapperShot],
    [101.583, 'sapped', C3.sappedShot],
    [102.292, 'boom', C3.boomShot],
    [102.417, 'sentryDead', C3.sentryDeadShot],
    [104.083, 'sign', C3.signShot],
    [104.542, 'engie', C3.engieShot],
    [105.667, 'gun', C3.gunShot],
    [106.25, 'shotFlash', C3.shotFlashShot],
    [106.375, 'colleagues', C3.colleaguesShot],
    [109.3, 'hutWindow', C3.hutWindowShot],
    [110.292, 'hutIn', C3.hutInShot],
    [112.042, 'sniperTurn', C3.sniperTurnShot],
    [112.583, 'hutTable', C3.hutTableShot],
    [113.292, 'spyHut', C3.spyHutShot],
    [115.042, 'sniperClose', C3.sniperCloseShot],
    [116.625, 'fight', C3.fightShot],
    [118.167, 'stab', C3.stabShot],
    [119.167, 'grapple', C3.grappleShot],
    [120.583, 'spyHutWide', C3.spyHutWideShot],
    [121.75, 'anyone', C3.anyoneShot],
    [125.62, 'medicFight', C3.medicFightShot],
    [126.875, 'grab', C3.grabShot],
    [127.458, 'morph', C3.morphShot],
    [129.75, 'medicFace', C3.medicFaceShot],
    [131.25, 'fall', C3.fallShot],
    [131.958, 'topDown', C3.topDownShot],
    [134.333, 'fakeMedic', C3.fakeMedicShot],
    [137.958, 'thisRoom', C3.thisRoomShot],
    [142.75, 'headshot', C3.headshotShot],
    [143.5, 'after', D4.afterShot],
    [150.45, 'wait', D4.waitShot],
    [159.041, 'seeRed', D4.seeRedShot],
    [163.249, 'wide', D4.wideShot],
    [165.041, 'knifeHand', D4.knifeHandShot],
    [167.624, 'reveal', D4.revealShot],
    [173.041, 'endA', t => D4.lineupShot(t, 'endA')],
    [173.666, 'endB', t => D4.lineupShot(t, 'endB')],
    [174.291, 'endC', t => D4.lineupShot(t, 'endC')],
    [174.916, 'logoA', t => D4.lineupShot(t, 'logoA')],
    [175.541, 'logoB', t => D4.lineupShot(t, 'logoB')],
    [177.976, 'epilogue', D4.epilogueShot],
    [191.0, 'black', black],
    [192.54, 'retail', D4.cardsShot]
  ];

  const CUTS = SHOTS.map(s => s[0]);

  function stage(t) {
    const tt = clamp(t, 0, Sh.DURATION - 0.001);
    let i = 0;
    while (i < SHOTS.length - 1 && tt >= SHOTS[i + 1][0]) i++;
    return SHOTS[i][2](tt);
  }

  function voiceAt(t) {
    return Math.max(Sh.spyV(t), Sh.redV(t));
  }

  window.MspScript = { ID: Sh.ID, DURATION: Sh.DURATION, CUTS, SHOTS, stage, voiceAt, X, black };
})();
