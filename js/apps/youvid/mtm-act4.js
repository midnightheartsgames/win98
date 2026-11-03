(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Sh = window.MedShots;
  const Props = window.MedProps;
  const Medic = window.MeetMedic;
  const Scout = window.MeetScout;
  const Demo = window.MeetDemoman;
  const Eng = window.MeetEngineer;
  const Fab = window.FabCast;
  const FP = window.FabPose;
  const HeavyScript = window.MeetScript;
  const A2 = window.MedAct2;
  const { seg, spline, X, SX, DX, medicFace, scoutFace, demoFace, medicState, scoutState, demoState, cam, ENV } = Sh;

  const LINEUP_SHIFT = -138.594;

  function lineupMedic(t) {
    const pose = Sh.medStand({ at: [3.35, 0, 0.05], yaw: -0.35, sp: [0.06, -0.1, 0], nk: [-0.1, 0.12, 0.06], spread: 0.1 });
    const ch = Sh.chestOf(Medic, pose);
    const saw = M4.chain(ch, M4.translate(0.32, 0.5, 0.18), M4.rotZ(-0.25), M4.rotY(-0.4));
    const g = Props.grip('saw', 'L', saw);
    const hands = {
      L: Sh.gripHand(g, 0.03),
      R: Sh.hand(M4.point(ch, [-0.22, -0.18, 0.18]), M4.dir(ch, [0.1, -1, 0.2]), M4.dir(ch, [0.8, 0, 0.3]), 'relax')
    };
    return medicState(pose, hands, { outfit: 'coat', saw, pack: { meter: 0.2 }, face: medicFace(t, X.mad, { jaw: 0.08, look: [0.15, 0.05] }) });
  }

  function lineupDemo(t) {
    const pose = Sh.poseStand(Demo.D, { at: [2.55, 0, 0.45], yaw: -0.3, sp: [0.12, 0.1, 0] });
    const ch = Sh.chestOf(Demo, pose);
    const L = M4.chain(ch, M4.translate(0.0, -0.06, 0.36), M4.rotY(0.25), M4.rotX(-0.15));
    const hands = {
      R: Sh.hand(M4.point(L, [-0.05, -0.1, -0.12]), M4.dir(L, [0.3, -0.2, 0.8]), M4.dir(L, [1, 0, 0]), 'grip'),
      L: Sh.hand(M4.point(L, [0.06, -0.04, 0.2]), M4.dir(L, [-0.3, -0.3, 0.8]), M4.dir(L, [-1, 0, 0]), 'grip')
    };
    return demoState(pose, hands, { launcher: L, face: demoFace(t, DX.laugh) });
  }

  function shotLineup(t, which) {
    const hs = HeavyScript.stage(clamp(t + LINEUP_SHIFT, 80.51, 85.4));
    const md = lineupMedic(t);
    const dm = lineupDemo(t);
    let camera = hs.camera;
    if (which === 'endA') camera = A2.faceCam(md, [-0.24, -0.02, 0.3], [0.0, -0.03, 0.03], 40, 0);
    else if (which === 'endB') camera = A2.faceCam(md, [-0.18, -0.25, 0.95], [0.08, -0.22, 0.03], 40, 0);
    else if (which === 'endC') camera = cam(V3.add(Sh.headPos(dm), [-0.35, 0.05, 1.05]), V3.add(Sh.headPos(dm), [0.35, 0.12, 0]), 44);
    const actors = (hs.actors || []).filter(a => a.cls !== 'medic' && a.cls !== 'demo');
    return {
      shot: which, kind: 'lineup', env: hs.env, camera, heavy: Object.assign({}, hs.heavy, { face: hs.face }), actors, medic: md, demo: dm, logo: hs.logo || null,
      blur: which === 'endA' ? 0.45 : which === 'endB' ? 0.3 : which === 'endC' ? 0.12 : 0
    };
  }

  const SEATS = {
    pyro: [-2.75, -2.95, 0], engineer: [-1.35, -2.95, 0], sniper: [-3.95, -2.95, 0], spy: [-2.05, -1.05, PI], demo: [0.45, -0.95, PI + 0.3], heavy: [3.2, -2.9, -0.4]
  };

  function chairItem(x, z, yaw) {
    return { kind: 'chair', M: M4.chain(M4.translate(x, 0, z), M4.rotY(yaw)) };
  }

  function sitActor(cls, seat, o) {
    const pose = Sh.poseSit(Fab.D[cls], { at: [seat[0], 0, seat[1]], yaw: seat[2], sp: (o && o.sp) || [0.12, 0, 0], nk: (o && o.nk) || [0, 0, 0], hL: o && o.hL, hR: o && o.hR });
    return Object.assign({ cls, team: 'red', pose }, (o && o.extra) || {});
  }

  function waitingCast(t) {
    const actors = [];
    actors.push(sitActor('pyro', SEATS.pyro, { sp: [0.35, 0, 0], nk: [0.3, 0, 0], hL: [0.18, 0.05, 0.32], hR: [-0.18, 0.05, 0.32] }));
    actors.push(sitActor('sniper', SEATS.sniper, { sp: [0.05, 0, 0], nk: [0.1, 0.3, 0], hL: [0.25, -0.2, 0.25], hR: [-0.25, -0.22, 0.25] }));
    actors.push(sitActor('spy', SEATS.spy, { sp: [0.1, 0, 0], nk: [0.05, -0.2, 0] }));
    const sol = { cls: 'soldier', team: 'red', pose: FP.stand('soldier', -3.25, -2.45, 0, {}) };
    sol.pose.hL = [0.3, -0.3, 0.02];
    sol.pose.hR = [-0.3, -0.3, 0.02];
    actors.push(sol);
    const items = [chairItem(SEATS.pyro[0], SEATS.pyro[1] - 0.05, 0), chairItem(SEATS.engineer[0], SEATS.engineer[1] - 0.05, 0), chairItem(SEATS.sniper[0], SEATS.sniper[1] - 0.05, 0),
      chairItem(SEATS.spy[0], SEATS.spy[1] + 0.05, PI), chairItem(SEATS.demo[0], SEATS.demo[1] + 0.05, PI + 0.3), chairItem(-0.2, -2.95, 0), chairItem(2.4, -2.95, 0)];
    const pyroCh = Fab.solve('pyro', actors[0].pose).chest;
    items.push({ kind: 'magazine', M: M4.chain(pyroCh, M4.translate(0, 0.08, 0.36), M4.rotX(-0.6), M4.scale(0.32, 0.24, 1)) });
    const ePose = Sh.poseSit(Eng.D, { at: [SEATS.engineer[0], 0, SEATS.engineer[1]], yaw: 0.15, sp: [0.12, 0, 0], nk: [0.25, 0.1, 0] });
    const ePel = Eng.solve(ePose).pelvis;
    const guitar = M4.chain(ePel, M4.translate(0.02, 0.12, 0.22), M4.rotY(-0.3), M4.rotZ(0.45), M4.rotX(-0.15));
    const strum = S(t * 9) * 0.03;
    const eHands = {
      R: Sh.hand(M4.point(guitar, [0.02, 0.0 + strum, 0.08]), M4.dir(guitar, [0, -1, 0.2]), M4.dir(guitar, [0, 0, -1]), 'relax'),
      L: Sh.hand(M4.point(guitar, [-0.42, 0.02, 0.06]), M4.dir(guitar, [0.2, 0.3, -0.8]), M4.dir(guitar, [1, 0, 0]), 'claw')
    };
    const engineer = Sh.engState(ePose, eHands, { guitar, face: { smileL: 0.3, smileR: 0.25, jaw: 0.05 } });
    const dPose = Sh.poseSit(Demo.D, { at: [SEATS.demo[0], 0, SEATS.demo[1]], yaw: SEATS.demo[2], sp: [0.05, 0, 0], nk: [-0.15, 0, 0] });
    const dCh = Sh.chestOf(Demo, dPose);
    const drink = seg(t, 230.95, 231.6) * (1 - seg(t, 232.4, 233.0));
    const bottle = M4.chain(dCh, M4.translate(-0.12, 0.25 + drink * 0.35, 0.3 - drink * 0.15), M4.rotX(-0.3 - drink * 1.6));
    const demo = demoState(dPose, { R: Sh.hand(M4.point(bottle, [0, 0.05, 0]), M4.dir(bottle, [1, 0.2, 0]), M4.dir(bottle, [0, 0, -1]), 'grip') }, { bottle, face: demoFace(t, drink > 0.5 ? DX.laugh : { lidU: 0.5 }) });
    return { actors, items, engineer, demo };
  }

  function waiting(st, t) {
    const cast = waitingCast(t);
    return Object.assign({
      kind: '3d', set: 'waiting', env: ENV.waiting, actors: cast.actors, items: cast.items, engineer: cast.engineer, demo: cast.demo,
      setOpts: { serving: t > 228.9 ? 2 : 1, doorsOpen: 0 }
    }, st);
  }

  function shotWaiting(t) {
    const u = seg(t, 224.391, 230.856);
    const eye = spline([[0, [-1.5, 1.2, 0.6]], [0.5, [-2.6, 1.3, 0.4]], [1, [-3.5, 1.25, 0.6]]])(ease(u));
    const at = spline([[0, [-1.9, 1.0, -3.2]], [0.5, [-3.1, 1.2, -3.0]], [1, [-4.0, 1.4, -3.2]]])(ease(u));
    return waiting({ shot: 'waiting', camera: cam(eye, at, 50) }, t);
  }

  function scoutWalk(t) {
    const k = ease(seg(t, 230.95, 232.4));
    const at = [1.2, 0, lerp(-3.9, -2.6, k)];
    const pose = Sh.poseStand(Scout.D, { at, yaw: 0, sp: [-0.1, 0, 0], nk: [-0.2, 0, 0] });
    const ch = Sh.chestOf(Scout, pose);
    const wide = k > 0.3;
    const hands = wide ? {
      L: Sh.hand(M4.point(ch, [0.62, 0.38, 0.02]), M4.dir(ch, [1, 0.2, 0]), M4.dir(ch, [0, 0, 1]), 'open'),
      R: Sh.hand(M4.point(ch, [-0.62, 0.38, 0.02]), M4.dir(ch, [-1, 0.2, 0]), M4.dir(ch, [0, 0, 1]), 'open')
    } : null;
    return scoutState(pose, hands, { face: scoutFace(t, SX.happy) });
  }

  function shotDoors(t) {
    const open = ease(seg(t, 230.86, 231.3));
    const st = waiting({ shot: 'doors', camera: cam([1.15, 1.05, 0.9], [1.2, 1.3, -3.4], 50) }, t);
    st.setOpts = Object.assign({}, st.setOpts, { doorsOpen: open });
    st.scout = scoutWalk(t);
    st.glows = [{ p: [1.2, 2.55, -3.3], s: 0.5, a: 0.5, tint: [1, 0.4, 0.3] }];
    return st;
  }

  function shotScoutGlow(t) {
    const pose = Sh.poseStand(Scout.D, { at: [0.6, 0, 0.9], yaw: 0.1, sp: [-0.08, 0, 0], nk: [-0.1, 0, 0] });
    const ch = Sh.chestOf(Scout, pose);
    const hug = ease(seg(t, 233.0, 233.8));
    const heart = M4.point(ch, [0.06, 0.28, 0.13]);
    const handsWide = {
      L: Sh.hand(M4.point(ch, [0.62, 0.38, 0.02]), M4.dir(ch, [1, 0.2, 0]), M4.dir(ch, [0, 0, 1]), 'open'),
      R: Sh.hand(M4.point(ch, [-0.62, 0.38, 0.02]), M4.dir(ch, [-1, 0.2, 0]), M4.dir(ch, [0, 0, 1]), 'open')
    };
    const handsHug = {
      L: Sh.hand(V3.add(heart, [0.07, 0.0, 0.1]), M4.dir(ch, [-0.8, 0.3, 0.2]), M4.dir(ch, [0, 0, -1]), 'flat'),
      R: Sh.hand(V3.add(heart, [-0.1, -0.02, 0.1]), M4.dir(ch, [0.8, 0.3, 0.2]), M4.dir(ch, [0, 0, -1]), 'flat')
    };
    const hands = hug < 0.5 ? handsWide : handsHug;
    const sc = scoutState(pose, hands, { face: scoutFace(t, hug < 0.5 ? SX.happy : SX.blissful) });
    const head = Sh.headPos(sc);
    const glow = 0.5 + 0.3 * S(t * 6);
    return A2.lab({
      shot: 'scoutGlow', camera: cam(V3.add(head, [0.05, -0.26, 0.92]), V3.add(head, [0, -0.28, 0]), 44), scout: sc, heavy: null, table: null,
      glows: [{ p: V3.add(heart, [0, 0, 0.12]), s: 0.22, a: glow, tint: [1, 0.3, 0.2] }], doves: []
    });
  }

  function shotCards(t) {
    if (t < 239.8) return { shot: 'cards', kind: 'black' };
    if (t < 241.8) return { shot: 'cards', kind: 'card', cards: [{ tex: 'quote1', alpha: seg(t, 239.8, 240.5) }] };
    if (t < 243.05) return { shot: 'cards', kind: 'card', cards: [{ tex: 'quote1', alpha: 1 }, { tex: 'quote2', alpha: seg(t, 241.8, 242.3) }] };
    if (t < 244.744) return { shot: 'cards', kind: 'card', cards: [{ tex: 'quote2', alpha: 1 }, { tex: 'quote3', alpha: seg(t, 243.05, 243.3) }] };
    if (t < 247.83) return { shot: 'f2p', kind: 'card', cards: [{ tex: 'f2p', alpha: 1 }, { tex: 'f2pUrl', alpha: seg(t, 246.0, 246.5) }] };
    return { shot: 'f2p', kind: 'black' };
  }

  window.MedAct4 = { LINEUP_SHIFT, shotLineup, shotWaiting, shotDoors, shotScoutGlow, shotCards };
})();
