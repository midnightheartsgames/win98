(function () {
  const { clamp } = window.YouVidKit;
  const Sh = window.MscShots;
  const A = window.MscAct;
  const T = window.MscTalk;

  const black = () => ({ shot: 'black', kind: 'black' });

  const SHOTS = [
    [0, 'black', black],
    [1.583, 'door', A.shotDoor],
    [5.124, 'crouch', A.shotCrouch],
    [6.874, 'enemies', A.shotEnemies],
    [11.749, 'grin', A.shotGrin],
    [13.666, 'out', A.shotOut],
    [14.874, 'charge', A.shotCharge],
    [16.333, 'engie', A.shotEngie],
    [17.374, 'feet', A.shotFeet],
    [19.083, 'pillar', A.shotPillar],
    [19.708, 'track', A.shotTrack],
    [20.541, 'yard', A.shotYard],
    [21.791, 'close', A.shotClose],
    [22.874, 'roof', A.shotRoof],
    [24.124, 'rocket', A.shotRocket],
    [25.874, 'hall', A.shotHall],
    [27.458, 'blast', A.shotBlast],
    [30.124, 'ledge', A.shotLedge],
    [31.416, 'poster', T.shotPoster],
    [40.333, 'heavy', T.shotHeavy],
    [44.499, 'talk1', T.shotTalk1],
    [46.874, 'fight1', T.shotFight1],
    [49.124, 'talk2', T.shotTalk2],
    [51.416, 'choke', T.shotChoke],
    [53.333, 'talk3', T.shotTalk3],
    [55.708, 'noogie', T.shotNoogie],
    [57.416, 'talk4', T.shotTalk4],
    [58.749, 'talk5', T.shotTalk5],
    [62.291, 'talk6', T.shotTalk6],
    [63.458, 'fight2', T.shotFight2],
    [64.166, 'talk7', T.shotTalk7],
    [65.374, 'fight3', T.shotFight3],
    [65.874, 'talk8', T.shotTalk8],
    [67.416, 'down', T.shotDown],
    [69.333, 'arms', T.shotArms],
    [70.208, 'endA', t => T.shotLineup(t, 'endA')],
    [70.833, 'endB', t => T.shotLineup(t, 'endB')],
    [71.458, 'endC', t => T.shotLineup(t, 'endC')],
    [72.083, 'logoA', t => T.shotLineup(t, 'logoA')],
    [72.708, 'logoB', t => T.shotLineup(t, 'logoB')],
    [75.083, 'black', black],
    [77.083, 'epilogue', T.shotEpilogue],
    [84.916, 'retail', T.shotCards],
    [93.916, 'black', black]
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

  window.MscScript = { ID: Sh.ID, DURATION: Sh.DURATION, CUTS, SHOTS, LINEUP_SHIFT: T.LINEUP_SHIFT, stage, voiceAt, X: Sh.X, doorY: A.doorY };
})();
