(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Props = window.MsnProps;
  const HeavyScript = window.MeetScript;
  const Sh = window.MsnShots;
  const A1 = window.MsnAct1;
  const A2 = window.MsnAct2;
  const { seg, track, X, sniperFace, standPose, sniperState, hand, gripHand, headPos, cam, ENV } = Sh;

  const LINEUP_SHIFT = -0.289;

  const black = () => ({ shot: 'black', kind: 'black' });

  function title() {
    return { shot: 'title', kind: 'card', cards: [{ tex: 'title', alpha: 1 }] };
  }

  function lineupSniper() {
    const pose = standPose({ at: [0.95, 0, 0.02], yaw: -0.15, sp: [0.06, -0.1, 0.02], nk: [-0.08, 0.06, 0.03], spread: 0.1 });
    const ch = Sh.chestOf(pose);
    const rifle = M4.chain(ch, M4.translate(-0.24, 0.05, 0.22), M4.rotX(-PI / 2 + 0.12), M4.rotZ(0.1), M4.rotY(0.2));
    const R = gripHand(Props.grip('L', rifle), 0.05);
    const L = hand(M4.point(ch, [0.25, -0.36, 0.08]), M4.dir(ch, [0.05, -1, 0.15]), M4.dir(ch, [-1, 0, 0.1]), 'relax');
    return sniperState(pose, { L, R: Object.assign({}, R, { pose: 'grip' }) }, { rifle });
  }

  function shotLineup(t, which) {
    const hs = HeavyScript.stage(Math.min(t + LINEUP_SHIFT, 85.4));
    const st = lineupSniper();
    const h = headPos(st);
    let camera = hs.camera;
    if (which === 'endA') camera = cam(V3.add(h, [0.03, -0.07, 0.42]), V3.add(h, [0.02, -0.02, 0]), 32);
    else if (which === 'endB') camera = cam(V3.add(h, [-0.1, -0.24, 0.72]), V3.add(h, [-0.06, -0.18, 0]), 38);
    else if (which === 'endC') camera = cam(V3.add(h, [-0.28, -0.52, 1.4]), V3.add(h, [-0.12, -0.32, 0]), 50);
    const actors = (hs.actors || []).filter(a => a.cls !== 'sniper');
    return {
      shot: which, kind: 'lineup', env: hs.env, camera, heavy: hs.heavy, heavyFace: hs.face, actors, sniper: st, face: sniperFace(81, X.firm), logo: hs.logo || null,
      blur: which === 'endA' ? 0.45 : which === 'endB' ? 0.25 : 0.1
    };
  }

  const TOWN_BOX = M4.chain(M4.translate(-0.58, 1.36, 0.12), M4.scale(1.6, 2.0, 1.5));
  const EPI_FACE = track([[85.7, X.sad], [87.6, X.hurt, 0.3], [88.4, X.sad, 0.3], [89.9, X.sad]]);

  function shotEpilogue(t) {
    const pose = standPose({ at: [-0.18, 0, 0.46], yaw: -0.12, sp: [0.12, 0.12, -0.06], nk: [0.36 + 0.04 * S(t * 0.7), 0.1, -0.12], spread: 0.1 });
    const pre = sniperState(pose, null);
    const crown = Sh.headPos(pre, [0.0, 0.17, 0.0]);
    const ch = Sh.chestOf(pose);
    const R = hand(V3.add(crown, [-0.06, -0.07, 0.04]), M4.dir(ch, [0.9, 0.15, 0.2]), [0.1, -1, 0.1], 'claw');
    pose.eRw = [-0.5, 1.8, 0.36];
    const ear = Sh.headPos(pre, [0.09, -0.01, 0.0]);
    const L = hand(V3.add(ear, [0.04, -0.07, 0.03]), M4.dir(ch, [-0.2, 1, -0.2]), M4.dir(ch, [-1, 0, -0.2]), 'phone');
    const st = sniperState(pose, { L, R });
    const HS = st.hands.L.M ? M4.chain(st.hands.L.M, M4.translate(0.0, -0.06, 0.05), M4.rotX(0.2), M4.rotZ(0.3), M4.translate(0, -0.1, 0)) : null;
    const h = headPos(st);
    const camera = cam(V3.add(h, [-0.12, 0.0, 0.58]), V3.add(h, [-0.08, -0.22, 0]), 48);
    const props = [{ kind: 'phoneBox', M: TOWN_BOX }];
    if (HS) {
      props.push({ kind: 'handset', M: HS });
      props.push({ kind: 'cord', pts: Props.cordPoints(M4.point(TOWN_BOX, [0.04, -0.4, 0.05]), M4.point(HS, [0, -0.025, 0.015]), 0.25, 18) });
    }
    return { shot: 'epilogue', kind: '3d', set: 'town', env: ENV.town, camera, sniper: st, face: sniperFace(t, EPI_FACE(t), { look: [0.05, -0.3] }), props, blur: 0.5 };
  }

  function shotCards(t) {
    if (t < 93.25) return { shot: 'retail', kind: 'card', cards: [{ tex: 'retail', alpha: 1 }] };
    if (t < 93.77) return { shot: 'boxes', kind: 'card', cards: [{ tex: 'retail', alpha: 1 }, { tex: 'boxes', alpha: seg(t, 93.25, 93.77) }] };
    if (t < 96.25) return { shot: 'boxes', kind: 'card', cards: [{ tex: 'boxes', alpha: 1 }] };
    if (t < 96.77) return { shot: 'valve', kind: 'card', cards: [{ tex: 'boxes', alpha: 1 }, { tex: 'valve', alpha: seg(t, 96.25, 96.77) }] };
    return { shot: 'valve', kind: 'card', cards: [{ tex: 'valve', alpha: 1 }] };
  }

  const SHOTS = [
    [0, 'black', black],
    [0.749, 'road', A1.shotRoad],
    [4.833, 'bobble', A1.shotBobble],
    [10.833, 'title', title],
    [13.416, 'drive1', A1.shotDrive1],
    [23.208, 'mirror', A1.shotMirror],
    [28.916, 'scope1', A1.shotScope1],
    [35.291, 'nest', A1.shotNest],
    [37.499, 'phoneCU', A2.shotPhoneCU],
    [39.958, 'phoneWide', A2.shotPhoneWide],
    [42.42, 'phoneMed', A2.shotPhoneMed],
    [45.666, 'drive2', A2.shotDrive2],
    [49.041, 'climb', A2.shotClimb],
    [50.624, 'perch', A2.shotPerch],
    [56.249, 'hut', A2.shotHut],
    [61.416, 'spy', A2.shotSpy],
    [65.916, 'drive3', A2.shotDrive3],
    [71.208, 'kukri', A2.shotKukri],
    [72.249, 'scope2', A2.shotScope2],
    [73.208, 'bolt1', A2.shotBolt1],
    [73.708, 'scope3', A2.shotScope3],
    [74.416, 'bolt2', A2.shotBolt2],
    [74.749, 'scope4', A2.shotScope4],
    [75.624, 'sun', A2.shotSun],
    [79.291, 'black', black],
    [80.791, 'endA', t => shotLineup(t, 'endA')],
    [81.416, 'endB', t => shotLineup(t, 'endB')],
    [82.041, 'endC', t => shotLineup(t, 'endC')],
    [82.666, 'logoA', t => shotLineup(t, 'logoA')],
    [83.291, 'logoB', t => shotLineup(t, 'logoB')],
    [85.749, 'epilogue', shotEpilogue],
    [90.233, 'retail', shotCards],
    [99.249, 'black', black]
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

  window.MsnScript = { ID: Sh.ID, DURATION: Sh.DURATION, CUTS, SHOTS, LINEUP_SHIFT, stage, voiceAt, X: Sh.X };
})();
