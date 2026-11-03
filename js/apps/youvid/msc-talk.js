(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Props = window.MscProps;
  const FP = window.FabPose;
  const Heavy = window.MeetHeavy;
  const HeavyScript = window.MeetScript;
  const Sh = window.MscShots;
  const { seg, spline, track, X, HX, scoutFace, heavyFace, scoutState, standPose, crouchPose, runPose, airPose, hand, gripHand, cam, shake, gestureAt, withGesture, heavyBody, heavyState, headPos, ENV, blendHand } = Sh;

  const SPOT = [0.5, 0, 2.55];
  const LINEUP_SHIFT = 10.294;

  function talkPose(t, o) {
    const sway = S(t * 1.3) * 0.012 + (o.sway || 0);
    return standPose({ at: o.at || SPOT, yaw: o.yaw || 0, sp: o.sp || [0.12, 0, 0], nk: o.nk || [0, 0, 0], sway, spread: o.spread, fL: o.fL, fR: o.fR, drop: o.drop });
  }

  function talkState(t, o, keys) {
    const pose = talkPose(t, o);
    const chest = Sh.chestOf(pose);
    const g = gestureAt(chest, keys, t);
    return withGesture(pose, chest, g);
  }

  const NK = spline([
    [34.2, [-0.05, -0.3, 0.0]], [35.2, [-0.05, -0.1, 0.0]], [35.8, [-0.25, 0.05, 0.08]], [36.4, [-0.3, 0.1, 0.1]], [36.9, [0.05, 0.0, -0.05]], [37.4, [0.08, -0.1, -0.12]],
    [38.0, [0.0, 0.05, 0.08]], [38.6, [0.05, 0.15, 0.12]], [39.2, [-0.05, -0.1, -0.06]], [39.8, [0.08, 0.2, 0.15]], [40.33, [0.05, 0.15, 0.1]],
    [44.5, [-0.1, 0.2, 0.2]], [45.0, [-0.05, 0.1, 0.25]], [45.6, [-0.2, 0.15, 0.22]], [46.2, [-0.12, 0.25, 0.18]], [46.87, [-0.1, 0.2, 0.15]],
    [49.12, [0.1, -0.15, 0.1]], [49.6, [0.0, 0.05, 0.15]], [50.2, [0.05, 0.0, -0.1]], [50.8, [-0.05, 0.1, 0.12]], [51.42, [0.0, 0.0, 0.05]],
    [53.33, [-0.05, 0.85, 0.05]], [54.3, [0.0, 0.9, 0.1]], [55.0, [-0.05, 0.8, 0.05]], [55.7, [0.0, 0.7, 0.0]],
    [57.42, [0.05, 0.1, 0.12]], [58.0, [-0.05, -0.05, 0.08]], [58.75, [0.0, 0.1, -0.05]],
    [59.0, [0.05, 0.05, -0.05]], [59.6, [-0.05, -0.1, 0.05]], [60.3, [0.08, 0.1, -0.08]], [61.0, [0.0, -0.05, 0.06]], [61.6, [0.1, 0.12, 0.1]], [62.29, [0.05, 0.1, 0.05]],
    [62.4, [0.15, -0.05, 0.1]], [63.0, [0.2, -0.1, 0.05]], [63.46, [0.2, -0.05, 0.08]],
    [64.17, [-0.05, 0.0, 0.0]], [64.6, [0.0, 0.1, 0.1]], [65.1, [-0.2, 0.0, 0.0]], [65.37, [-0.15, 0.0, 0.0]],
    [65.87, [0.0, 0.1, 0.15]], [66.3, [0.1, -0.05, 0.05]], [66.7, [0.05, 0.3, 0.12]], [67.1, [0.12, 0.0, -0.05]], [67.42, [0.1, 0.0, 0.0]],
    [69.33, [-0.55, 0.0, 0.0]], [69.7, [-0.4, 0.05, 0.05]], [70.21, [-0.15, 0.05, 0.05]]
  ]);

  const FACE = track([
    [34.2, X.cocky], [35.7, X.huh, 0.3], [36.9, X.talk], [37.4, X.huh], [38.1, X.cocky], [39.3, X.huh], [40.0, X.cocky],
    [43.2, X.cocky], [44.5, X.grin], [45.2, X.cocky], [45.6, X.huh], [46.3, X.cocky],
    [49.1, X.bigGrin], [49.5, X.cocky], [50.2, X.grit], [50.5, X.huh], [51.0, X.cocky],
    [51.4, X.laugh], [53.33, X.admire, 0.3], [55.1, X.grin], [57.42, X.talk], [57.8, X.huh], [58.2, X.sly],
    [58.75, X.wideEye, 0.15], [59.3, X.talk], [60.3, X.cocky], [61.4, X.talk], [61.7, X.huh], [62.29, X.sly], [62.7, X.angry, 0.2], [63.2, X.grit],
    [64.17, X.wideEye, 0.1], [64.45, X.grit, 0.15], [64.9, X.shout], [65.87, X.huh, 0.15], [66.3, X.cocky], [66.8, X.wideEye], [67.15, X.pout],
    [67.42, X.yell], [69.33, X.shout, 0.1], [69.75, X.bigGrin, 0.3], [70.21, X.bigGrin]
  ]);

  function face(t, extra) {
    return scoutFace(t, Object.assign({}, FACE(t), extra || {}));
  }

  function posterCam(t) {
    const whip = seg(t, 31.416, 31.56);
    const push = ease(seg(t, 36.8, 40.3));
    const eye = V3.lerp([0.15, 1.05, 4.75], [0.3, 1.05, 4.6], push);
    const base = V3.lerp([0.1, 1.82, 0], [0.25, 1.8, 0], push);
    const at = whip < 1 ? V3.add(base, [lerp(-6, 0, ease(whip)), 0, lerp(2.5, 0, ease(whip))]) : base;
    return cam(eye, at, 27);
  }

  const WALK = [2.2, 0, 2.6];

  function shotPoster(t) {
    const camera = posterCam(t);
    if (t < 34.15) return { shot: 'poster', kind: '3d', set: 'locker', env: ENV.locker, camera, blur: t < 31.56 ? 0.8 : 0 };
    const walk = seg(t, 34.15, 35.25);
    const at = V3.lerp(WALK, SPOT, ease(walk));
    let st;
    if (walk < 1) {
      const pose = runPose({ at, yaw: -PI / 2 + ease(walk) * PI / 2 * 0.8, phase: t * 1.1, lean: 0.06, stride: 0.22 });
      st = scoutState(pose, null);
    } else {
      st = talkState(t, { at: SPOT, nk: NK(t) }, [[35.25, 'down'], [35.55, 'pray', 0.25], [36.2, 'prayUp', 0.35], [36.9, 'shrug', 0.25], [37.8, 'shrugLow', 0.2], [38.1, 'down', 0.3], [39.2, 'loose', 0.25], [39.6, 'shrugLow', 0.25], [40.0, 'loose', 0.25]]);
    }
    return { shot: 'poster', kind: '3d', set: 'locker', env: ENV.locker, camera, scout: st, face: face(t) };
  }

  function sandwichM(st) {
    const L = st.m.pts.wristL, R = st.m.pts.wristR;
    const c = V3.lerp(L, R, 0.5);
    const across = V3.norm(V3.sub(L, R));
    const fwd = V3.norm(V3.cross(across, [0, 1, 0]));
    const up = V3.norm(V3.cross(fwd, across));
    const o = V3.add(V3.add(c, V3.mul(fwd, 0.06)), V3.mul(up, -0.05));
    return new Float32Array([across[0], across[1], across[2], 0, up[0], up[1], up[2], 0, fwd[0], fwd[1], fwd[2], 0, o[0], o[1], o[2], 1]);
  }

  const SEAT = [0.5, 0.86, 9.55];

  function heavyEating(t) {
    const yaw = PI;
    const chew = Math.abs(S(t * 6.5)) * 0.25;
    const look = ease(seg(t, 42.8, 43.25));
    const pose = heavyBody({ p: SEAT, yaw, legs: 'sit', sp: [0.22 - look * 0.12, 0.05, 0], nk: [lerp(0.15, -0.35, look), lerp(0.05, -0.35, look), lerp(0, -0.1, look)] });
    const ch = Heavy.solve(pose).chest;
    const bite = seg(t, 40.33, 40.8);
    const mouth = M4.point(ch, [0, 0.68 - look * 0.1, 0.32 - bite * 0.05]);
    const c = V3.add(mouth, [0, -0.2 - look * 0.12, -0.08]);
    const hL = hand(V3.add(c, [-0.14, -0.06, 0.06]), [0.3, 0.45, -0.85], [0.9, 0, 0.2], 'claw');
    const hR = hand(V3.add(c, [0.14, -0.06, 0.06]), [-0.3, 0.45, -0.85], [-0.9, 0, 0.2], 'claw');
    const st = heavyState(pose, { L: hL, R: hR });
    st.sandwich = M4.mul(sandwichM(st), M4.scale(1.5, 1.5, 1.5));
    const f = look > 0.3 ? HX.surprise : (bite < 1 ? HX.bite : Object.assign({}, HX.chew, { jaw: 0.15 + chew }));
    return { st, face: heavyFace(t, Object.assign({ look: [lerp(0, 0.35, look), lerp(-0.1, 0.25, look)] }, f)) };
  }

  function shotHeavy(t) {
    const H = heavyEating(t);
    const pop = ease(seg(t, 42.85, 43.25));
    const scoutAt = [-0.55, lerp(0.4, 1.5, pop), 10.75];
    const pose = crouchPose({ at: scoutAt, yaw: PI - 0.35, depth: 0.62, nk: [-0.2, -0.1, 0.05] });
    const ch = Sh.chestOf(pose);
    const batM = M4.chain(ch, M4.translate(-0.22, 0.18, 0.18), M4.rotX(-0.35), M4.rotZ(0.25));
    const g = Props.grip('bat', 'R', batM);
    const sc = scoutState(pose, { R: gripHand(g, 0.06), L: hand(M4.point(ch, [0.24, -0.08, 0.32]), M4.dir(ch, [0, -0.5, 1]), M4.dir(ch, [-1, 0, 0]), 'rest') }, { bat: batM });
    const sway = shake(t, 0.004, 21);
    return {
      shot: 'heavy', kind: '3d', set: 'lot', env: ENV.lot, camera: cam(V3.add([0.62, 1.38, 8.72], sway), [0.42, 1.82, 9.6], 46, 0.05), heavy: H.st, heavyFace: H.face,
      scout: t > 42.85 ? sc : null, face: face(t, { look: [0.1, -0.3] }), props: [{ kind: 'sandwich', M: H.st.sandwich }], blur: 0.15, blurScout: true
    };
  }

  function shotTalk1(t) {
    const st = talkState(t, { nk: NK(t) }, [[44.5, 'explain'], [44.95, 'claws', 0.2], [45.4, 'down', 0.35], [46.3, 'loose', 0.3]]);
    const h = headPos(st);
    const u = seg(t, 44.5, 46.87);
    return { shot: 'talk1', kind: '3d', set: 'locker', env: ENV.locker, camera: cam(V3.add(h, [-0.1 + u * 0.05, 0.02, 0.74]), V3.add(h, [-0.03, 0.0, 0]), 34), scout: st, face: face(t), blur: 0.35 };
  }

  function shotTalk2(t) {
    const st = talkState(t, { nk: NK(t) }, [[49.12, 'present'], [49.5, 'explain', 0.2], [50.0, 'pointMe', 0.2], [50.25, 'fists', 0.15], [50.5, 'shrug', 0.2], [51.0, 'shrugLow', 0.25]]);
    const h = headPos(st);
    return { shot: 'talk2', kind: '3d', set: 'locker', env: ENV.locker, camera: cam(V3.add(h, [0.05, -0.22, 1.05]), V3.add(h, [0.0, -0.24, 0]), 38), scout: st, face: face(t), blur: 0.3 };
  }

  function shotTalk3(t) {
    const bob = S((t - 53.33) * 5) * 0.03;
    const st = talkState(t, { nk: NK(t), sp: [0.08 + bob, 0.1, -0.05], yaw: 0 }, [[53.33, 'flex']]);
    const h = headPos(st);
    return { shot: 'talk3', kind: '3d', set: 'locker', env: ENV.locker, camera: cam(V3.add(h, [0.08, -0.12, 0.85]), V3.add(h, [-0.06, -0.14, 0]), 38), scout: st, face: face(t, { look: [0.45, 0.1] }), blur: 0.3 };
  }

  function shotTalk4(t) {
    const st = talkState(t, { nk: NK(t) }, [[57.42, 'count'], [57.9, 'explain', 0.25], [58.2, 'pointYou', 0.25]]);
    const h = headPos(st);
    return { shot: 'talk4', kind: '3d', set: 'locker', env: ENV.locker, camera: cam(V3.add(h, [0.06, 0.02, 0.62]), V3.add(h, [0.0, 0.0, 0]), 34), scout: st, face: face(t), blur: 0.45 };
  }

  function shotTalk5(t) {
    const st = talkState(t, { nk: NK(t), at: [-0.1, 0, 2.55] }, [[58.75, 'thumbs'], [59.6, 'pointMe', 0.2], [60.2, 'pointYou', 0.25], [61.0, 'loose', 0.3], [61.6, 'shrugLow', 0.2]]);
    const h = headPos(st);
    return { shot: 'talk5', kind: '3d', set: 'locker', env: ENV.locker, camera: cam(V3.add(h, [0.1, -0.26, 1.12]), V3.add(h, [0.04, -0.3, 0]), 38), scout: st, face: face(t), blur: 0.25 };
  }

  function shotTalk6(t) {
    const lean = ease(seg(t, 62.29, 62.7));
    const nk = NK(t);
    const st = talkState(t, { nk: [nk[0] - lean * 0.8, nk[1], nk[2]], sp: [0.12 + lean * 0.3, -0.1, 0.05] }, [[62.29, 'loose'], [62.45, 'reach', 0.2], [62.9, 'pointYou', 0.2]]);
    const h = headPos(st);
    return { shot: 'talk6', kind: '3d', set: 'locker', env: ENV.locker, camera: cam(V3.add(h, [-0.06, -0.02, 0.66 - lean * 0.04]), V3.add(h, [0.06, -0.06, 0]), 44, -0.3), scout: st, face: face(t), blur: 0.5 };
  }

  function shotTalk7(t) {
    const st = talkState(t, { nk: NK(t) }, [[64.17, 'claws'], [64.45, 'shrugLow', 0.15], [64.75, 'shrug', 0.15], [65.05, 'claws', 0.15]]);
    const h = headPos(st);
    return { shot: 'talk7', kind: '3d', set: 'locker', env: ENV.locker, camera: cam(V3.add(h, [0.2, -0.14, 0.9]), V3.add(h, [0.02, -0.16, 0]), 36), scout: st, face: face(t), blur: 0.35 };
  }

  function shotTalk8(t) {
    const st = talkState(t, { nk: NK(t), at: [0.3, 0, 2.55] }, [[65.87, 'temple'], [66.15, 'pointYou', 0.15], [66.6, 'reach', 0.2], [67.0, 'shrugLow', 0.2]]);
    const h = headPos(st);
    return { shot: 'talk8', kind: '3d', set: 'locker', env: ENV.locker, camera: cam(V3.add(h, [-0.15, -0.2, 0.95]), V3.add(h, [0.02, -0.2, 0]), 36), scout: st, face: face(t), blur: 0.35 };
  }

  function shotArms(t) {
    const st = talkState(t, { nk: NK(t), sp: [-0.1, 0, 0] }, [[69.33, 'loose'], [69.45, 'wide', 0.15]]);
    const h = headPos(st);
    const whip = seg(t, 69.333, 69.46);
    const at = V3.add(h, [lerp(0.6, 0, ease(whip)), lerp(-0.6, -0.2, ease(whip)), 0]);
    return { shot: 'arms', kind: '3d', set: 'locker', env: ENV.locker, camera: cam(V3.add(h, [0.05, -0.62, 0.95]), at, 48), scout: st, face: face(t), blur: whip < 1 ? 0.7 : 0.25 };
  }

  const FIGHT = { heavy: [-0.15, 0, 3.9], scout: [0.85, 0, 2.9] };

  function heavyStand(at, yaw, o) {
    const pose = heavyBody(Object.assign({ p: [at[0], 1.02 - (o && o.drop || 0), at[2]], yaw, legs: 'stand' }, o || {}));
    return pose;
  }

  function fist(chest, local, side) {
    const k = side === 'L' ? 1 : -1;
    return hand(M4.point(chest, local), M4.dir(chest, [0, 0.2, 1]), M4.dir(chest, [-k, 0, 0]), 'fist');
  }

  function shotFight1(t) {
    const u = t - 46.874;
    const yawH = Math.atan2(FIGHT.scout[0] - FIGHT.heavy[0], FIGHT.scout[2] - FIGHT.heavy[2]);
    const swing = ease(seg(u, 0.0, 0.35));
    const bend = ease(seg(u, 0.3, 0.6)) * (1 - ease(seg(u, 0.8, 1.1))) * 0.5 + ease(seg(u, 1.4, 1.7)) * (1 - ease(seg(u, 1.95, 2.25)));
    const hpose = heavyStand(FIGHT.heavy, yawH + swing * 0.5 - bend * 0.2, { sp: [0.15 + bend * 0.85, swing * -0.5, 0], nk: [bend * -0.4, 0.2, 0], drop: bend * 0.12 });
    const hch = Heavy.solve(hpose).chest;
    const punchR = hand(M4.point(hch, [lerp(-0.4, 0.15, swing), 0.4 + swing * 0.05, lerp(0.2, 0.8, swing)]), M4.dir(hch, [0.3, 0, 1]), M4.dir(hch, [1, 0, 0]), 'fist');
    const guardL = bend > 0.6 ? hand(M4.point(hch, [0.15, 0.0, 0.4]), M4.dir(hch, [0, -0.6, 1]), M4.dir(hch, [0, 0, -1]), 'fist') : hand(M4.point(hch, [0.3, 0.3, 0.45]), M4.dir(hch, [0, 0.3, 1]), M4.dir(hch, [-1, 0, 0]), 'fist');
    const hState = heavyState(hpose, { L: guardL, R: bend > 0.6 ? hand(M4.point(hch, [-0.15, 0.0, 0.4]), M4.dir(hch, [0, -0.6, 1]), M4.dir(hch, [0, 0, -1]), 'fist') : punchR });
    const route = spline([[0, FIGHT.scout], [0.25, [0.8, 0, 2.8]], [0.6, [0.2, 0, 2.6]], [1.0, [-0.9, 0, 3.0]], [1.3, [-1.0, 0, 3.6]], [1.6, [-0.6, 0, 3.3]], [2.0, [0.6, 0, 3.0]], [2.25, [0.7, 0, 3.1]]])(u);
    const duck = ease(seg(u, 0.1, 0.3)) * (1 - ease(seg(u, 0.5, 0.7)));
    const yawS = Math.atan2(FIGHT.heavy[0] - route[0], FIGHT.heavy[2] - route[2]);
    const spos = standPose({ at: route, yaw: yawS, sp: [0.2 + duck * 0.6, 0, 0], nk: [-duck * 0.4, 0, 0], drop: duck * 0.3, spread: 0.12 });
    const sch = Sh.chestOf(spos);
    const jab = u > 1.2 && u < 1.6 ? ease(seg(u, 1.2, 1.35)) * (1 - ease(seg(u, 1.45, 1.6))) : 0;
    const sc = scoutState(spos, { L: fist(sch, [0.12, 0.3, 0.32 + jab * 0.3], 'L'), R: fist(sch, [-0.14, 0.25, 0.25], 'R') });
    const close = ease(seg(u, 1.95, 2.25));
    const hh = headPos(hState);
    const eye = V3.lerp([0.95, 1.3, 1.55], V3.add(hh, [0.7, -0.15, -1.1]), close);
    const at = V3.lerp([-0.05, 1.2, 3.5], V3.add(hh, [0.3, -0.15, 0]), close);
    const hf = u < 0.4 ? HX.angry : u < 1.3 ? HX.roar : u < 1.95 ? HX.hurt : HX.smirk;
    return {
      shot: 'fight1', kind: '3d', set: 'lot', env: ENV.lot, camera: cam(V3.add(eye, shake(t, 0.012, 22)), at, 46), heavy: hState, heavyFace: heavyFace(t, hf),
      scout: sc, face: face(t, u < 1.9 ? X.grit : X.laugh), blur: 0.1
    };
  }

  function shotChoke(t) {
    const thrash = S((t - 51.416) * 7) * 0.05;
    const H = [0.5, 0, 3.5];
    const hpose = heavyStand(H, PI + thrash, { sp: [-0.12, thrash, 0], nk: [-0.35, 0, thrash], spread: 0.08, eL: [0.95, 0.15, -0.25], eR: [-0.95, 0.15, -0.25] });
    const hm = Heavy.solve(hpose);
    const neck = M4.point(hm.chest, [0, 0.63, 0.12]);
    const across = V3.norm(M4.dir(hm.chest, [1, 0, 0]));
    const fwd = V3.norm(M4.dir(hm.chest, [0, 0, 1]));
    const batAt = (s) => V3.add(neck, V3.mul(across, s));
    const hState = heavyState(hpose, {
      L: hand(V3.add(batAt(0.16), [0, -0.05, 0]), V3.add(V3.mul(fwd, -0.8), [0, 0.6, 0]), V3.mul(across, -1), 'grip'),
      R: hand(V3.add(batAt(-0.16), [0, -0.05, 0]), V3.add(V3.mul(fwd, -0.8), [0, 0.6, 0]), across, 'grip')
    });
    const back = M4.point(hm.chest, [-0.05, 0.05, -0.45]);
    const hh0 = M4.point(hm.head, [0, 0, 0]);
    const spos = Sh.placeHead(airPose({ p: back, fwd, up: [0, 1, 0], sp: [0.35, 0, 0], nk: [-0.25, -0.35, 0.15], tuck: 0.8 }), V3.add(hh0, V3.add(V3.mul(across, -0.33), V3.add([0, 0.1, 0], V3.mul(fwd, -0.06)))));
    const sc = scoutState(spos, {
      L: hand(V3.sub(batAt(0.34), V3.mul(fwd, 0.04)), V3.mul(across, -1), fwd, 'grip'),
      R: hand(V3.sub(batAt(-0.34), V3.mul(fwd, 0.04)), across, fwd, 'grip')
    }, { bat: Sh.alongM(batAt(-0.45), across, fwd) });
    return {
      shot: 'choke', kind: '3d', set: 'lot', env: ENV.lot, camera: cam(V3.add([0.55, 1.35, 2.55], shake(t, 0.02, 23)), [0.45, 1.98, 3.55], 60, 0.08), heavy: hState,
      heavyFace: heavyFace(t, HX.choke), scout: sc, face: face(t, X.laugh)
    };
  }

  function shotNoogie(t) {
    const rub = S((t - 55.708) * 14);
    const H = [0.5, 0, 3.5];
    const hpose = heavyStand(H, PI - 0.1, { sp: [0.3, -0.25, 0], nk: [-0.15, 0.25, -0.05], spread: 0.12 });
    const hm = Heavy.solve(hpose);
    const target = V3.add(M4.point(hm.chest, [0.28, 0.12, 0.62]), [shake(t, 0.01, 31)[0], 0, 0]);
    const yaw = PI + 0.35;
    const base = standPose({ at: [target[0] - 0.3, 0, target[2] + 0.35], yaw, sp: [0.62, 0.1, -0.15], nk: [-0.55, -0.15, 0.3], drop: 0.22, spread: 0.2 });
    const spos = Sh.placeHead(base, target);
    const sm = Sh.scoutState(spos, null).m;
    const sh = M4.point(sm.head, [0, 0.11, 0]);
    const hState = heavyState(hpose, {
      L: hand(V3.add(sh, [0.16, -0.16, -0.1]), [-0.8, -0.1, -0.5], [0, 1, 0], 'grip'),
      R: hand(V3.add(sh, [rub * 0.04, 0.12, 0.0]), [0.2, -0.7, 0.6], [0, -1, 0], 'fist')
    });
    const sch = sm.chest;
    const sc = scoutState(spos, { L: hand(M4.point(sch, [0.18, 0.42, 0.35]), M4.dir(sch, [0, 1, 0.4]), M4.dir(sch, [0, 0, 1]), 'claw'), R: hand(M4.point(sch, [-0.25, 0.15, 0.35]), M4.dir(sch, [0, -0.4, 1]), M4.dir(sch, [1, 0, 0]), 'claw') });
    const eye = V3.add(target, [-0.1, 0.06, -0.66]);
    return {
      shot: 'noogie', kind: '3d', set: 'lot', env: ENV.lot, camera: cam(V3.add(eye, shake(t, 0.012, 24)), V3.add(target, [0.02, 0.12, 0.1]), 52, -0.05), heavy: hState,
      heavyFace: heavyFace(t, HX.roar), scout: sc, face: face(t, Object.assign({}, X.pain, { look: [0.35, 0.1] })), blur: 0.2
    };
  }

  function shotFight2(t) {
    const u = t - 63.458;
    const swing = ease(seg(u, 0.05, 0.3));
    const H = [-0.05, 0, 3.6];
    const hit = ease(seg(u, 0.28, 0.45));
    const hpose = heavyStand(H, PI / 2, { sp: [0.35 + hit * 0.6, 0, 0], nk: [-0.2 - hit * 0.3, 0, 0], drop: hit * 0.15 });
    const hch = Heavy.solve(hpose).chest;
    const hState = heavyState(hpose, { L: hand(M4.point(hch, [0.12, -0.02, 0.38]), M4.dir(hch, [0, -0.6, 1]), M4.dir(hch, [0, 0, -1]), 'fist'), R: hand(M4.point(hch, [-0.12, -0.02, 0.38]), M4.dir(hch, [0, -0.6, 1]), M4.dir(hch, [0, 0, -1]), 'fist') });
    const spos = standPose({ at: [1.2, 0, 3.6], yaw: -PI / 2, sp: [0.25, lerp(-0.9, 0.7, swing), 0], nk: [0, lerp(0.7, -0.4, swing), 0], spread: 0.18 });
    const ch = Sh.chestOf(spos);
    const ang = lerp(-1.7, 0.6, swing);
    const handAt = M4.point(ch, [S(ang) * 0.45 - 0.05, 0.12, C(ang) * 0.45]);
    const batDir = V3.norm(M4.dir(ch, [S(ang + 0.2), 0.05, C(ang + 0.2)]));
    const bat = Sh.alongM(handAt, batDir, [0, 1, 0]);
    const gR = Props.grip('bat', 'R', bat), gL = Props.grip('bat', 'L', bat);
    const sc = scoutState(spos, { R: gripHand(gR, 0.06), L: gripHand(gL, 0.06) }, { bat });
    return {
      shot: 'fight2', kind: '3d', set: 'lot', env: ENV.lot, camera: cam(V3.add([0.55, 1.1, 1.75], shake(t, 0.02, 25)), [0.55, 1.0, 3.6], 50), heavy: hState,
      heavyFace: heavyFace(t, hit > 0.5 ? HX.hurt : HX.angry), scout: sc, face: face(t, X.yell), blur: 0.15
    };
  }

  function shotFight3(t) {
    const u = t - 65.374;
    const H = [-0.1, 0, 3.6];
    const hpose = heavyStand(H, PI / 2 + 0.3, { sp: [0.95, 0, 0], nk: [-0.5, 0, 0], drop: 0.2 });
    const hch = Heavy.solve(hpose).chest;
    const hState = heavyState(hpose, { L: hand(M4.point(hch, [0.12, -0.1, 0.35]), M4.dir(hch, [0, -0.7, 1]), M4.dir(hch, [0, 0, -1]), 'fist'), R: hand(M4.point(hch, [-0.12, -0.1, 0.35]), M4.dir(hch, [0, -0.7, 1]), M4.dir(hch, [0, 0, -1]), 'fist') });
    const hop = Math.abs(S(u * 11)) * 0.12;
    const spos = standPose({ at: [lerp(1.4, 1.0, u * 2), hop, lerp(3.3, 3.9, u * 2)], yaw: -PI / 2 + 0.2, sp: [0.3, 0.2 * S(u * 11), 0], nk: [-0.1, 0, 0], spread: 0.18, liftL: hop, liftR: hop });
    const sch = Sh.chestOf(spos);
    const jab = Math.max(0, S(u * 22));
    const sc = scoutState(spos, { L: fist(sch, [0.12, 0.32, 0.3 + jab * 0.25], 'L'), R: fist(sch, [-0.12, 0.3, 0.3 + (1 - jab) * 0.25], 'R') });
    return {
      shot: 'fight3', kind: '3d', set: 'lot', env: ENV.lot, camera: cam([0.6, 1.15, 0.4], [0.6, 1.0, 3.8], 42), heavy: hState, heavyFace: heavyFace(t, HX.hurt),
      scout: sc, face: face(t, X.laugh), blur: 0.1
    };
  }

  function koHeavy(p, yaw, prone) {
    const dir = [S(yaw), 0, C(yaw)];
    const side = [C(yaw), 0, -S(yaw)];
    const legs = 0.86;
    const pose = { p, fwd: prone ? [0, -1, 0] : [0, 1, 0], up: V3.norm([dir[0], 0.08, dir[2]]), sp: [0, 0, 0], nk: prone ? [-1.15, 0.2, 0.55] : [0.15, 0.35, 0.1], eL: [0.6, 0, 0.6], eR: [-0.6, 0, 0.6] };
    const sgn = prone ? 1 : -1;
    pose.fLw = V3.add(V3.add(p, V3.mul(dir, -legs)), V3.mul(side, sgn * 0.3));
    pose.fRw = V3.add(V3.add(p, V3.mul(dir, -legs)), V3.mul(side, -sgn * 0.3));
    pose.fLw[1] = 0.1;
    pose.fRw[1] = 0.1;
    pose.kL = [0.3, 0, 1];
    pose.kR = [-0.3, 0, 1];
    pose.hL = [0.62, -0.05, 0.25];
    pose.hR = [-0.62, 0.0, 0.3];
    return pose;
  }

  function shotDown(t) {
    const u = t - 67.416;
    const hpose = koHeavy([0.6, 0.28, 3.6], PI + 0.3, true);
    const hState = heavyState(hpose, null);
    const runK = seg(t, 67.42, 67.8);
    let sc;
    if (t < 67.8) {
      const pose = runPose({ at: V3.lerp([-3.6, 0, 4.4], [-2.7, 0, 5.4], runK), yaw: 0.9, phase: t * 1.9, lean: 0.35 });
      sc = scoutState(pose, null);
    } else {
      const j = seg(t, 67.8, 69.0);
      const y = j < 0.5 ? lerp(0, 2.65, Math.sin(j * PI)) : lerp(2.65, 5.25, seg(j, 0.5, 1)) + Math.sin(seg(j, 0.5, 1) * PI) * 0.8;
      const pose = airPose({ p: [lerp(-2.7, -2.4, j), y + 1.0, lerp(5.4, 5.8, j)], fwd: [0.2, 0, 1], up: [0, 1, 0.2], tuck: 0.5 + 0.4 * S(j * PI * 2), hL: [0.15, 0.45, 0.25], hR: [-0.15, 0.45, 0.25] });
      sc = scoutState(pose, null);
    }
    const sandwich = M4.chain(M4.translate(0.15, 0.0, 2.85), M4.rotY(0.6));
    return {
      shot: 'down', kind: '3d', set: 'lot', env: ENV.lot, camera: cam([0.45, 0.32, 2.15], [-0.4, 1.3, 5.4], 48), heavy: hState, heavyFace: heavyFace(t, HX.ko),
      scout: sc, face: face(t, X.yell), props: [{ kind: 'sandwich', M: sandwich }], blur: 0.1, blurHeavyFirst: true
    };
  }

  function lineupScout(t) {
    const pose = standPose({ at: [0.98, 0, 0.78], yaw: -0.32, sp: [0.18, 0.15, 0.04], nk: [-0.12, 0.05, 0.05], spread: 0.1, fL: [0.03, 0.12] });
    const ch = Sh.chestOf(pose);
    const bat = M4.chain(ch, M4.translate(-0.1, 0.18, 0.32), M4.rotX(-0.9), M4.rotZ(0.4));
    const g = Props.grip('bat', 'R', bat);
    return scoutState(pose, { R: gripHand(g, 0.06), L: hand(M4.point(ch, [0.24, -0.1, 0.2]), M4.dir(ch, [-0.1, -1, 0.3]), M4.dir(ch, [-1, 0, 0]), 'fist') }, { bat });
  }

  function shotLineup(t, which) {
    const hs = HeavyScript.stage(t + LINEUP_SHIFT);
    const st = lineupScout(t);
    const h = headPos(st);
    let camera = hs.camera;
    if (which === 'endA') camera = cam(V3.add(h, [-0.05, -0.04, 0.42]), V3.add(h, [-0.03, -0.03, 0]), 32);
    else if (which === 'endB') camera = cam(V3.add(h, [-0.18, -0.25, 1.2]), V3.add(h, [-0.12, -0.3, 0]), 38);
    else if (which === 'endC') camera = cam(V3.add(h, [-0.55, -0.65, 2.2]), V3.add(h, [-0.45, -0.55, 0]), 48);
    const actors = (hs.actors || []).filter(a => a.cls !== 'scout');
    return {
      shot: which, kind: 'lineup', env: hs.env, camera, heavy: hs.heavy, heavyFace: hs.face, actors, scout: st, face: face(70.4, X.bigGrin), logo: hs.logo || null,
      blur: which === 'endA' ? 0.45 : which === 'endB' ? 0.25 : 0.1
    };
  }

  function shotEpilogue(t) {
    const u = t - 77.083;
    const hpose = koHeavy([0.6, 0.27, 1.9], -PI / 2, false);
    const hState = heavyState(hpose, null);
    const hm = hState.m;
    const belly = M4.point(hm.chest, [0, 0.05, 0.32]);
    const pose = crouchPose({ at: [belly[0] + 0.05, belly[1] - 0.05, belly[2] + 0.05], yaw: 0.05, depth: 1.0, sp: [0.55, 0, 0], nk: [-0.5, 0.04, 0.02], spread: 0.16, eL: [0.9, -0.3, 0.2], eR: [-0.9, -0.3, 0.2] });
    const ch = Sh.chestOf(pose);
    const legs = Sh.scoutState(pose, null).m.pts;
    const knees = V3.lerp(legs.kneeL, legs.kneeR, 0.5);
    const at = V3.add(knees, [0, 0.03, 0.14]);
    const sm = M4.chain(M4.translate(at[0], at[1], at[2]), M4.rotY(0.1), M4.rotX(0.5));
    const sc = scoutState(pose, {
      L: hand(M4.point(sm, [0.1, 0.05, -0.02]), M4.dir(sm, [-0.2, 0.2, 1]), M4.dir(sm, [-1, 0, 0]), 'hold'),
      R: hand(M4.point(sm, [-0.1, 0.05, -0.02]), M4.dir(sm, [0.2, 0.2, 1]), M4.dir(sm, [1, 0, 0]), 'hold')
    });
    const k = ease(seg(t, 77.3, 84.9));
    const target = V3.lerp(headPos(sc, [0, -0.33, 0]), V3.add(belly, [0, 0.35, 0]), k);
    const eye = V3.lerp(V3.add(headPos(sc), [0.1, 0.08, 1.6]), V3.add(belly, [0.25, 0.62, 3.4]), k);
    const f = scoutFace(t, Object.assign({}, X.tight, { look: [0, 0.02], browUp: 0.15 + 0.15 * S(u * 0.8) }));
    return {
      shot: 'epilogue', kind: '3d', set: 'lot', env: ENV.lot, camera: cam(eye, target, lerp(34, 40, k)), heavy: hState, heavyFace: heavyFace(t, HX.ko),
      scout: sc, face: f, props: [{ kind: 'sandwich', M: sm }], fade: 1 - seg(t, 77.083, 77.75), blur: 0.15
    };
  }

  function shotCards(t) {
    if (t < 88.0) return { shot: 'retail', kind: 'card', cards: [{ tex: 'retail', alpha: 1 }] };
    if (t < 88.5) return { shot: 'boxes', kind: 'card', cards: [{ tex: 'retail', alpha: 1 }, { tex: 'boxes', alpha: seg(t, 88.0, 88.5) }] };
    if (t < 91.0) return { shot: 'boxes', kind: 'card', cards: [{ tex: 'boxes', alpha: 1 }] };
    if (t < 91.46) return { shot: 'valve', kind: 'card', cards: [{ tex: 'boxes', alpha: 1 }, { tex: 'valve', alpha: seg(t, 91.0, 91.46) }] };
    return { shot: 'valve', kind: 'card', cards: [{ tex: 'valve', alpha: 1 }] };
  }

  window.MscTalk = {
    SPOT, LINEUP_SHIFT, shotPoster, shotHeavy, shotTalk1, shotTalk2, shotTalk3, shotTalk4, shotTalk5, shotTalk6, shotTalk7, shotTalk8, shotArms,
    shotFight1, shotChoke, shotNoogie, shotFight2, shotFight3, shotDown, shotLineup, shotEpilogue, shotCards, FACE
  };
})();
