(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Sh = window.MspShots;
  const Sol = window.MeetSoldier;
  const SolProps = window.MtsProps;
  const ScoutProps = window.MscProps;
  const HeavyProps = window.MeetProps;
  const Sets = window.MspSets;
  const FP = window.FabPose;
  const { X, SX, CX, seg, spline, spyFace, scoutFace, soldierFace, heavyFace, standPose, runPose, hand, gripHand, stairY, stateOf, chestOf, headPos, cam, shake, ENV,
    flicker } = Sh;

  const BLUE_FLASH = [0.75, 0.9, 1.3];
  const HALL_FLASH = [0.9, 0.95, 1.12];

  function gunHands(kind, M) {
    return { R: gripHand(SolProps.grip(kind, 'R', M), 0.09, 0.028), L: gripHand(SolProps.grip(kind, 'L', M), 0.09, 0.028) };
  }

  function batOnShoulder(chest) {
    return M4.chain(chest, M4.translate(-0.17, 0.42, -0.04), M4.rotX(-2.35), M4.rotZ(0.25), M4.translate(0, -0.12, 0));
  }

  function scoutWithBat(pose, extraHands) {
    const ch = chestOf('scout', pose);
    const B = batOnShoulder(ch);
    const g = ScoutProps.grip('bat', 'R', B);
    const hands = Object.assign({ R: gripHand(g, 0.04) }, extraHands || {});
    return { st: stateOf('scout', Object.assign({}, pose, { eR: [-0.8, -0.6, 0.2] }), hands), bat: B };
  }

  function soldierHolding(pose, gunLocal, faceExpr, t) {
    const ch = chestOf('soldier', pose);
    const G = M4.mul(ch, gunLocal);
    const st = stateOf('soldier', pose, gunHands('shotgun', G));
    return { who: 'soldier', team: 'blu', st, face: soldierFace(t, faceExpr), gun: G };
  }

  const PORT = M4.chain(M4.translate(-0.07, 0.1, 0.26), M4.rotY(1.1), M4.rotX(-0.95));
  const HANG = M4.chain(M4.translate(-0.24, -0.41, 0.25), M4.rotX(0.45));

  function helmetHold(pose, faceExpr, t) {
    const ch = chestOf('soldier', pose);
    const G = M4.mul(ch, HANG);
    const pre = stateOf('soldier', pose, null);
    const fingers = V3.norm(M4.dir(pre.m.head, [-0.2, -0.35, 1]));
    const top = V3.add(V3.sub(headPos(pre, [0.05, 0.21, 0.0]), V3.mul(fingers, 0.07)), [0, 0.03, 0]);
    const L = hand(top, fingers, [0, -1, 0], 'claw');
    const st = stateOf('soldier', Object.assign({}, pose, { eL: [0.9, 0.35, 0.1] }), { R: gripHand(SolProps.grip('shotgun', 'R', G), 0.09, 0.028), L });
    return { who: 'soldier', team: 'blu', st, face: soldierFace(t, faceExpr), gun: G };
  }
  const LOW = M4.chain(M4.translate(-0.09, 0.2, 0.36), M4.rotY(0.04), M4.rotX(0.05));

  function handOn(M0, local, fingersL, palmL, pose) {
    const M = HeavyProps.gunM(M0);
    const pos = M4.point(M, local);
    const fingers = V3.norm(M4.dir(M, fingersL));
    const palm = V3.norm(M4.dir(M, palmL));
    return { target: V3.add(V3.sub(pos, V3.mul(fingers, 0.075)), V3.mul(palm, -0.035)), fingers, palm, pose };
  }

  function heavyGunHands(G) {
    return { R: handOn(G, [-0.56, 0.08, 0.07], [0, -1, 0.15], [0, 0, -1], 'grip'), L: handOn(G, [-0.36, 0.28, 0], [0.2, -0.6, 1], [0, -1, 0.2], 'grip') };
  }

  function heavyRunState(t, at, yaw, phase) {
    const pose = runPose('heavy', { at, yaw, phase, stride: 0.34, lean: 0.25 });
    const ch = chestOf('heavy', pose);
    const G = M4.chain(ch, M4.translate(0.02, -0.22, 0.48), M4.rotY(-PI / 2 - 0.2), M4.rotZ(-0.25));
    return { who: 'heavy', team: 'blu', st: stateOf('heavy', pose, heavyGunHands(G)), gun: { M: G, spin: 0 } };
  }

  function bellShot(t) {
    const tilt = ease(seg(t, 1.36, 1.542));
    const ring = S(t * 72) * 0.003;
    const eye = V3.lerp([-0.4 + ring, 2.86, 0.6], [-1.2, 2.4, 1.2], tilt);
    const at = V3.lerp([0.0, 2.47, 0.02], [-1.7, 1.7, 0], tilt);
    return {
      shot: 'bell', kind: '3d', set: 'alarm', env: flicker(ENV.alarm, t, 3.2, 0.45, BLUE_FLASH), camera: cam(eye, at, 36, -0.03 + ring),
      props: [{ kind: 'bell', M: M4.translate(0, 2.5, 0.016), swing: S(t * 72) * 0.3 }], motion: tilt * (1 - tilt) * 3
    };
  }

  const SIGN_X = spline([[1.542, -1.72], [1.66, -1.7], [2.29, -1.66], [2.5, 0.08], [2.96, 0.12], [3.25, 1.9], [3.75, 1.94], [3.875, 3.4]]);
  const SIGN_Y = spline([[1.542, 2.4], [1.66, 1.68], [3.875, 1.64]]);

  function signsShot(t) {
    const x = SIGN_X(t), y = SIGN_Y(t);
    const speed = Math.abs(SIGN_X(t + 0.02) - SIGN_X(t - 0.02)) / 0.04 + Math.abs(SIGN_Y(t + 0.02) - SIGN_Y(t - 0.02)) / 0.04;
    const roll = t < 1.75 ? lerp(-0.16, 0, seg(t, 1.66, 1.75)) : 0;
    const dist = t < 2.3 ? lerp(1.42, 1.3, seg(t, 1.66, 2.29)) : t < 3.0 ? 1.25 : 1.22;
    const side = t < 2.3 ? lerp(-0.35, -0.1, seg(t, 1.66, 2.29)) : 0.03;
    return {
      shot: 'signs', kind: '3d', set: 'alarm', env: flicker(ENV.alarm, t, 3.2, 0.45, BLUE_FLASH), camera: cam([x + side, y - 0.08, dist], [x, y, 0], 38, roll),
      motion: clamp(speed / 9, 0, 1)
    };
  }

  function boardShot(t) {
    const u = seg(t, 3.875, 5.625);
    const eye = V3.lerp([30.15, 1.25, 4.6], [30.1, 1.3, 4.1], u);
    const op = FP.stand('engineer', 30.15, 2.45, PI, {});
    const whip = 1 - seg(t, 3.875, 3.96);
    return {
      shot: 'board', kind: '3d', set: 'alarm', env: flicker(ENV.alarm, t, 3.2, 0.5, BLUE_FLASH), camera: cam(eye, [30, 1.95, 0], 52),
      actors: [{ cls: 'engineer', team: 'blu', pose: op, tint: [0.12, 0.13, 0.16] }], motion: whip * 0.8
    };
  }

  const RACK = M4.chain(M4.translate(-0.92, 4.12, -1.2), M4.rotX(0.02));
  const SOL_RACK = [-0.42, 3.0, -2.05];

  function rackShot(t) {
    const grab = ease(seg(t, 5.95, 6.12));
    const pull = ease(seg(t, 6.12, 6.75));
    const yaw = -0.62;
    const pose = standPose('soldier', { at: SOL_RACK, yaw, sp: [0.1, -0.15, 0], nk: [0.05, -0.3, 0] });
    const ch = chestOf('soldier', pose);
    const held = M4.mul(ch, HANG);
    const G = pull > 0 ? M4.chain(M4.translate(lerp(RACK[12], held[12], pull), lerp(RACK[13], held[13], pull) + S(pull * PI) * 0.12, lerp(RACK[14], held[14], pull)), M4.rotY(-pull * 0.9), M4.rotX(-pull * 0.4)) : RACK;
    const gR = gripHand(SolProps.grip('shotgun', 'R', G));
    const rest = hand(M4.point(ch, [-0.32, -0.25, 0.1]), M4.dir(ch, [0, -1, 0.2]), M4.dir(ch, [1, 0, 0]), 'relax');
    const R = { target: V3.lerp(rest.target, gR.target, grab), fingers: gR.fingers, palm: gR.palm, pose: grab > 0.5 ? 'grip' : 'relax' };
    const st = stateOf('soldier', Object.assign({}, pose, { eR: [-0.7, -0.6, 0.3] }), { R });
    return {
      shot: 'rack', kind: '3d', set: 'stairs', env: Object.assign(flicker(ENV.stairs, t, 3.2, 0.25, BLUE_FLASH), { ambTop: [0.62, 0.63, 0.66], ambBot: [0.3, 0.3, 0.32] }), camera: cam([-0.28, 4.3, -0.95], [-0.97, 4.2, -1.2], 46),
      heroes: [{ who: 'soldier', team: 'blu', st, face: soldierFace(t, SX.shout) }], props: [{ kind: 'shotgun', M: G }, { kind: 'launcher', M: M4.chain(M4.translate(-0.9, 4.49, -1.2), M4.rotX(0.02)) }]
    };
  }

  function stairRunner(t, z, phase, yaw) {
    const pose = runPose('soldier', { at: [0.05, stairY(z), z], yaw: yaw === undefined ? 0 : yaw, phase, stride: 0.3, lean: 0.12 });
    return soldierHolding(pose, LOW, SX.shout, t);
  }

  const STAIR_Z = spline([[6.792, -0.6], [7.5, 1.0], [8.375, 2.6]]);

  function legsShot(t) {
    const z = STAIR_Z(t);
    const h = stairRunner(t, z, t * 1.9);
    let eye, at;
    if (t < 7.48) {
      const cz = z + 0.85;
      eye = [0.1, stairY(cz) + 0.18, cz];
      at = [0.05, stairY(z) + 0.5, z];
    } else {
      eye = [0.55, stairY(z - 0.1) + 0.28, z - 0.15];
      at = [0.0, stairY(z) + 0.4, z + 0.1];
    }
    return {
      shot: 'legs', kind: '3d', set: 'stairs', env: flicker(ENV.stairs, t, 3.2, 0.45, BLUE_FLASH), camera: cam(V3.add(eye, shake(t, 0.01, 3)), at, 48),
      heroes: [h], props: [{ kind: 'shotgun', M: h.gun }], motion: 0.15
    };
  }

  function jumpShot(t) {
    const fly = seg(t, 8.375, 8.75);
    const land = seg(t, 8.75, 9.5);
    const z = t < 8.75 ? lerp(3.6, 4.9, fly) : lerp(4.9, 5.15, ease(land));
    const ground = t < 8.75 ? lerp(stairY(3.6), 0, fly) + S(fly * PI) * 0.45 : 0;
    let pose;
    if (t < 8.75) {
      pose = { p: [0.05, ground + 0.95, z], fwd: V3.norm([0, -0.2, 1]), up: V3.norm([0, 1, 0.25]), sp: [0.25, 0, 0], nk: [-0.2, 0, 0] };
      pose.fL = [0.17, -0.62, 0.32];
      pose.fR = [-0.17, -0.82, -0.1];
      pose.kL = [0.1, 0, 1];
      pose.kR = [-0.1, 0, 1];
    } else {
      const crouch = 1 - ease(seg(t, 8.95, 9.5));
      pose = standPose('soldier', { at: [0.05, 0, z], yaw: 0, drop: 0.36 * crouch, sp: [0.45 * crouch + 0.1, 0, 0], nk: [-0.3 * crouch, 0, 0], spread: 0.12 });
    }
    const h = helmetHold(pose, SX.yell, t);
    return {
      shot: 'jump', kind: '3d', set: 'stairs', env: flicker(ENV.stairs, t, 3.2, 0.45, BLUE_FLASH), camera: cam([0.45, 0.95, 6.3], V3.add(headPos(h.st), [0, lerp(-0.45, -0.22, seg(t, 8.6, 9.0)), 0]), lerp(40, 58, seg(t, 8.375, 9.0))),
      heroes: [h], props: [{ kind: 'shotgun', M: h.gun }]
    };
  }

  function whipShot(t) {
    const u = seg(t, 9.5, 9.875);
    const z = lerp(6.2, 7.6, u);
    const pose = runPose('soldier', { at: [0.2, 0, z], yaw: 0.2, phase: t * 1.9, stride: 0.4, lean: 0.3 });
    const h = helmetHold(pose, SX.yell, t);
    return {
      shot: 'whip', kind: '3d', set: 'stairs', env: flicker(ENV.stairs, t, 3.2, 0.45, BLUE_FLASH), camera: cam([-0.35, 1.55, 7.9], V3.lerp([0.3, 1.6, 6.2], [0.6, 1.5, 8.8], u), 44),
      heroes: [h], props: [{ kind: 'shotgun', M: h.gun }], motion: 0.85
    };
  }

  function hallRunner(t, x, z) {
    const pose = runPose('soldier', { at: [x, 0, z], yaw: PI / 2, phase: t * 1.8, stride: 0.42, lean: 0.28 });
    return soldierHolding(pose, PORT, SX.yell, t);
  }

  function chargeShot(t) {
    const x = -16 + (t - 9.875) * 3.0;
    const h = hallRunner(t, x, 0.1);
    const pump = t > 10.85 && t < 11.35 ? S(seg(t, 10.85, 11.35) * PI) * 0.08 : 0;
    if (pump) {
      const ch = chestOf('soldier', h.st.pose);
      const G = M4.mul(ch, PORT);
      const gL = SolProps.grip('shotgun', 'L', G);
      gL.pos = V3.sub(gL.pos, V3.mul(gL.fingers, pump));
      h.st = stateOf('soldier', Object.assign({}, h.st.pose, { hLw: undefined, hRw: undefined }), { R: gripHand(SolProps.grip('shotgun', 'R', G), 0.09, 0.028), L: gripHand(gL, 0.09, 0.028) });
    }
    const wide = t < 10.36;
    const head = headPos(h.st);
    const eye = wide ? [x + 3.4, 1.45, 0.6] : V3.add(head, [1.3, -0.42, 0.26]);
    const at = wide ? [x, 1.25, 0.1] : V3.add(head, [0, -0.32, 0]);
    return {
      shot: 'charge', kind: '3d', set: 'base', door: {}, env: Object.assign(flicker(ENV.hall, t, 3.2, 0.25, HALL_FLASH), wide ? {} : { rim: [0.16, 0.2, 0.26] }), camera: cam(V3.add(eye, shake(t, 0.015, 5)), at, wide ? 44 : 40),
      heroes: [h], props: [{ kind: 'shotgun', M: h.gun }], motion: wide ? 0.1 : 0
    };
  }

  function scoutRun(t, x, z, phase, extra) {
    const pose = runPose('scout', Object.assign({ at: [x, 0, z], yaw: PI / 2, phase, stride: 0.44, lean: 0.3 }, extra || {}));
    const r = scoutWithBat(pose);
    return { who: 'scout', team: 'blu', st: r.st, bat: r.bat };
  }

  function whip2Shot(t) {
    const blurK = 1 - seg(t, 11.875, 12.04);
    const u = seg(t, 12.04, 12.542);
    const sx = lerp(-9.4, -8.3, u);
    const s = scoutRun(t, sx, lerp(-1.0, -0.5, u), t * 2.0);
    s.face = scoutFace(t, CX.calm);
    const solX = -10.1 + (t - 11.875) * 2.6;
    const sol = hallRunner(t, solX, 0.15);
    return {
      shot: 'whip2', kind: '3d', set: 'base', door: {}, env: flicker(ENV.hall, t, 3.2, 0.25, HALL_FLASH), camera: cam([solX - 1.6, 1.5, 0.75], [sx + 2.5, 1.35, -0.3], 44),
      heroes: [sol, s], props: [{ kind: 'shotgun', M: sol.gun }, { kind: 'bat', M: s.bat }], motion: blurK
    };
  }

  function sideShot(t) {
    const x = -8.6 + (t - 12.542) * 2.25;
    const push = t > 13.75 && t < 14.45 ? S(seg(t, 13.75, 14.45) * PI) : 0;
    const sc = scoutRun(t, x + 0.15, -0.45 - push * 0.15, t * 2.0 + 0.3, { nk: [-0.2, -0.35 - push * 0.5, push * 0.4] });
    sc.face = scoutFace(t, push > 0.2 ? CX.pain : CX.cocky);
    const pose = runPose('soldier', { at: [x - 0.15, 0, 0.32], yaw: PI / 2, phase: t * 1.8, stride: 0.42, lean: 0.25 });
    let sol;
    if (push > 0) {
      const ch = chestOf('soldier', pose);
      const G = M4.mul(ch, LOW);
      const scoutHead = headPos(sc.st);
      const L = hand(V3.lerp(M4.point(ch, [0.3, -0.1, 0.25]), V3.add(scoutHead, [0.05, 0, 0.08]), push), [0.3, 0.6, -1], [0, 0, -1], 'open');
      const st = stateOf('soldier', Object.assign({}, pose, { eL: [0.9, -0.2, 0.2] }), { R: gripHand(SolProps.grip('shotgun', 'R', G)), L });
      sol = { who: 'soldier', team: 'blu', st, face: soldierFace(t, SX.shout), gun: G };
    } else {
      sol = soldierHolding(pose, LOW, SX.shout, t);
    }
    const sh = headPos(sc.st);
    let eye, at;
    if (t < 13.75) {
      eye = V3.add(sh, [0.62, 0.02, -0.3]);
      at = V3.add(sh, [0, -0.04, 0.12]);
    } else {
      const mid = V3.lerp(sh, headPos(sol.st), 0.5);
      eye = V3.add(mid, [1.55, -0.05, -0.15]);
      at = V3.add(mid, [0, -0.15, 0]);
    }
    return {
      shot: 'side', kind: '3d', set: 'base', door: {}, env: flicker(ENV.hall, t, 3.2, 0.25, HALL_FLASH), camera: cam(V3.add(eye, shake(t, 0.012, 7)), at, 44),
      heroes: [sol, sc], props: [{ kind: 'shotgun', M: sol.gun }, { kind: 'bat', M: sc.bat }]
    };
  }

  const KEY1 = Sets.keyPoint(0.23, 0.83);
  const PRESSES = [16.04, 16.26, 16.58, 17.72];

  function pressDepth(t) {
    let d = 0;
    PRESSES.forEach(p => { d = Math.max(d, 1 - Math.abs(t - p) / 0.1); });
    return clamp(d, 0, 1);
  }

  function keypadPose(t) {
    const pose = standPose('soldier', { at: [-0.72, 0, 0.05], yaw: PI / 2 + 0.1, sp: [0.12, 0.25, 0], nk: [0.05, -0.1, 0] });
    const ch = chestOf('soldier', pose);
    const G = M4.chain(ch, M4.translate(0.18, 0.05, 0.3), M4.rotY(0.5), M4.rotX(0.35));
    const d = pressDepth(t);
    const tip = V3.add(KEY1, [-0.035 * (1 - d) - 0.004, 0.01 * (1 - d), 0]);
    const f = V3.norm([1, -0.05, 0.12]);
    const R = hand(V3.sub(tip, V3.mul(f, 0.17)), f, [0, -1, 0], 'poke');
    const st = stateOf('soldier', Object.assign({}, pose, { eR: [-0.6, -0.7, -0.2] }), { R, L: gripHand(SolProps.grip('shotgun', 'L', G), 0.09, 0.028) });
    return { who: 'soldier', team: 'blu', st, face: soldierFace(t, SX.shout), gun: G };
  }

  function keypadShot(t) {
    const h = keypadPose(t);
    return {
      shot: 'keypad', kind: '3d', set: 'base', env: flicker(ENV.hall, t, 3.2, 0.2, HALL_FLASH), camera: cam([-0.3, 1.42, 0.56], [-0.01, 1.36, 0.27], 32), door: {},
      heroes: [h], props: [{ kind: 'shotgun', M: h.gun }]
    };
  }

  function doorScout(t, turn) {
    const pose = standPose('scout', { at: [-1.1, 0, -0.62], yaw: PI / 2 + 0.25 - (turn || 0) * 2.6, sp: [0.05, 0, 0], nk: [0, 0.2, 0] });
    const r = scoutWithBat(pose);
    return { who: 'scout', team: 'blu', st: r.st, bat: r.bat, face: scoutFace(t, turn ? CX.wideEye : CX.calm) };
  }

  function doorShot(t) {
    const pose = standPose('soldier', { at: [-0.95, 0, 0.12], yaw: PI / 2 + 0.15, sp: [0.12, 0.2, 0], nk: [0.05, -0.15, 0] });
    const ch = chestOf('soldier', pose);
    const G = M4.chain(ch, M4.translate(0.18, 0.05, 0.3), M4.rotY(0.5), M4.rotX(0.35));
    const R = hand(M4.point(ch, [-0.2, 0.25, 0.55]), M4.dir(ch, [0.1, 0.3, 1]), M4.dir(ch, [0, -1, 0.2]), 'poke');
    const sol = { who: 'soldier', team: 'blu', st: stateOf('soldier', Object.assign({}, pose, { eR: [-0.6, -0.7, -0.2] }), { R, L: gripHand(SolProps.grip('shotgun', 'L', G), 0.09, 0.028) }), face: soldierFace(t, SX.yell), gun: G };
    const sc = doorScout(t, 0);
    sc.face = scoutFace(t, CX.huh);
    return {
      shot: 'door', kind: '3d', set: 'base', env: flicker(ENV.hall, t, 3.2, 0.2, HALL_FLASH), camera: cam([-0.1, 1.45, -0.18], [-1.0, 1.42, -0.2], 62), door: {},
      heroes: [sol, sc], props: [{ kind: 'shotgun', M: sol.gun }, { kind: 'bat', M: sc.bat }]
    };
  }

  function heavyX(t) {
    return t < 20.708 ? lerp(-13.5, -6.3, seg(t, 19.625, 20.708)) : lerp(-6.3, -1.2, seg(t, 20.708, 21.667));
  }

  function heavyRunShot(t) {
    const h = heavyRunState(t, [heavyX(t), 0, 0.05], PI / 2, t * 1.5);
    h.face = heavyFace(t, { browDown: 0.8, sneer: 0.4, wide: 0.5, jaw: 0.35 });
    return {
      shot: 'heavyRun', kind: '3d', set: 'base', env: flicker(ENV.hall, t, 3.2, 0.25, HALL_FLASH), camera: cam(V3.add([heavyX(t) + 2.6, 1.3, 0.6], shake(t, 0.02, 9)), [heavyX(t), 1.35, 0.0], 46), door: {},
      heroes: [h], props: [], motion: 1 - seg(t, 19.625, 19.71)
    };
  }

  function heavyYellShot(t) {
    const h = heavyRunState(t, [heavyX(t), 0, 0.05], PI / 2, t * 1.5);
    h.face = heavyFace(t, { browDown: 1, sneer: 0.5, wide: 0.75, jaw: 0.6 });
    const head = headPos(h.st);
    return {
      shot: 'heavyYell', kind: '3d', set: 'base', door: {}, env: flicker(ENV.hall, t, 3.2, 0.25, HALL_FLASH), camera: cam(V3.add(head, [0.75, -0.08, 0.28]), V3.add(head, [0, -0.06, 0]), 42),
      heroes: [h], motion: 0.4
    };
  }

  function shoulderShot(t) {
    const h = heavyRunState(t, [heavyX(t), 0, 0.05], PI / 2, t * 1.5);
    h.face = heavyFace(t, { browDown: 1, sneer: 0.5, wide: 0.75, jaw: 0.6 });
    const head = headPos(h.st);
    const turn = ease(seg(t, 21.0, 21.4));
    const solPose = standPose('soldier', { at: [-0.72, 0, 0.05], yaw: PI / 2 + 0.1 - turn * 2.4, sp: [0.12, 0, 0], nk: [0.05, 0.2, 0] });
    const sol = soldierHolding(solPose, LOW, turn > 0.5 ? SX.grimace : SX.shout, t);
    const sc = doorScout(t, turn);
    return {
      shot: 'shoulder', kind: '3d', set: 'base', env: flicker(ENV.hall, t, 3.2, 0.25, HALL_FLASH), camera: cam(V3.add(V3.add(head, [-0.62, 0.12, 0.45]), shake(t, 0.025, 11)), [0, 1.3, 0.1], 46), door: {},
      heroes: [h, sol, sc], props: [{ kind: 'shotgun', M: sol.gun }, { kind: 'bat', M: sc.bat }]
    };
  }

  function burstShot(t) {
    const u = t - 21.667;
    const boom = seg(t, 21.875, 22.4);
    const doorM = boom > 0
      ? M4.chain(M4.translate(lerp(0.03, 2.2, boom), 1.05 + S(boom * PI) * 0.5 - boom * 0.6, lerp(0, 0.4, boom)), M4.rotY(-0.5 * boom), M4.rotZ(-1.35 * boom), M4.rotX(0.3 * boom))
      : M4.chain(M4.translate(0.03, 1.05, 0), M4.rotY(PI / 2));
    const debris = boom > 0 && boom < 1 ? [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
      const a = i * 0.8 + 0.3;
      const p = [0.2 + boom * (1.5 + (i % 3) * 0.6), 1.0 + C(a) * 0.6 + S(boom * PI) * 0.6 - boom * boom * 0.8, S(a) * 0.6 + (i % 2 ? 0.3 : -0.3) * boom];
      return { M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotX(a + boom * 6), M4.rotZ(a * 2 + boom * 5)), big: i % 3 === 0 };
    }) : [];
    const heroes = [];
    const props = [];
    if (t > 21.95) {
      const k = seg(t, 21.95, 23.0);
      const hx = lerp(-0.6, 2.2, ease(k));
      const h = heavyRunState(t, [hx, 0, 0.0], PI / 2, t * 1.5);
      h.face = heavyFace(t, { browDown: 1, sneer: 0.5, wide: 0.75, jaw: 0.55 });
      heroes.push(h);
      const fall = seg(t, 22.1, 23.0);
      const solPose = { p: [lerp(0.2, 2.9, ease(fall)), lerp(1.0, 0.25, fall * fall) + S(fall * PI) * 0.35, 0.45], fwd: V3.norm([0.4, -fall * 0.8, -1]), up: V3.norm([1, 0.8 - fall * 0.7, 0.1]), sp: [0.3, 0, 0.2], nk: [-0.4, 0, 0] };
      solPose.fL = [0.17, -0.7, 0.3];
      solPose.fR = [-0.17, -0.6, -0.3];
      solPose.hL = [0.5, 0.2, 0.2];
      solPose.hR = [-0.5, 0.35, 0.1];
      heroes.push({ who: 'soldier', team: 'blu', st: stateOf('soldier', solPose, null), face: soldierFace(t, SX.grimace) });
      const scPose = { p: [lerp(0.0, 3.4, ease(fall)), lerp(1.0, 0.22, fall) + S(fall * PI) * 0.45, -0.45], fwd: V3.norm([0.3, -fall, 1]), up: V3.norm([1, 0.9 - fall * 0.8, -0.1]), sp: [0.2, 0, -0.2], nk: [-0.3, 0, 0] };
      scPose.fL = [0.12, -0.6, -0.3];
      scPose.fR = [-0.12, -0.75, 0.3];
      scPose.hL = [0.45, 0.3, 0.1];
      scPose.hR = [-0.45, 0.2, 0.2];
      heroes.push({ who: 'scout', team: 'blu', st: stateOf('scout', scPose, null), face: scoutFace(t, CX.pain) });
    }
    const eye = t < 22.6 ? [1.75, 1.32, 0.42] : V3.lerp([1.75, 1.32, 0.42], [3.4, 0.55, 1.4], seg(t, 22.6, 23.2));
    const at = t < 22.6 ? [0.1, 1.2, 0.0] : V3.lerp([0.1, 1.2, 0.0], [2.2, 0.6, 0.0], seg(t, 22.6, 23.2));
    return {
      shot: 'burst', kind: '3d', set: 'base', env: ENV.room, setOpts: {}, camera: cam(V3.add(eye, shake(t, boom > 0 ? 0.06 : 0.005, 13)), at, 50, u > 0.9 ? S(u * 9) * 0.1 : 0),
      heroes, props, door: { M: doorM, debris }, motion: t > 22.25 ? 0.55 : boom > 0 ? 0.3 : 0
    };
  }

  const CASE_AT = [4.25, 0.755, 0.62];

  function caseM() {
    return M4.chain(M4.translate(CASE_AT[0], CASE_AT[1], CASE_AT[2]), M4.rotY(0.15));
  }

  function heavyAtTable(t, look) {
    const pose = standPose('heavy', { at: [3.25, 0, -0.35], yaw: 0.55 + (look || 0), sp: [0.08, 0, 0], nk: [0.05, -(look || 0) * 0.6, 0], spread: 0.1 });
    const ch = chestOf('heavy', pose);
    const G = M4.chain(ch, M4.translate(0.05, -0.32, 0.45), M4.rotY(-PI / 2 - 0.3), M4.rotZ(-0.55));
    return { who: 'heavy', team: 'blu', st: stateOf('heavy', pose, heavyGunHands(G)), gun: { M: G, spin: 0 } };
  }

  function leanScout(t, slide) {
    const k = ease(slide);
    const at = [lerp(6.4, 4.95, k), 0, lerp(1.2, 0.72, k)];
    const pose = standPose('scout', { at, yaw: -PI / 2 + 0.25, sp: [lerp(0.2, 0.95, k), 0.15, 0.05], nk: [lerp(-0.1, -0.45, k), 0.35, 0.1], drop: 0.08 * k, spread: 0.12 });
    const ch = chestOf('scout', pose);
    const cm = caseM();
    const L = hand(M4.point(cm, [0.12, 0.13, -0.05]), M4.dir(cm, [-1, 0, -0.3]), [0, -1, 0], 'flat');
    const R = hand(M4.point(cm, [0.15, 0.12, 0.13]), M4.dir(cm, [-1, 0, 0.3]), [0, -1, 0], 'relax');
    const rest = { L: hand(M4.point(ch, [0.3, -0.1, 0.3]), [0, -1, 0.3], [-1, 0, 0], 'relax'), R: hand(M4.point(ch, [-0.3, -0.1, 0.3]), [0, -1, 0.3], [1, 0, 0], 'relax') };
    const hands = k > 0.4 ? { L, R } : rest;
    return { who: 'scout', team: 'blu', st: stateOf('scout', Object.assign({}, pose, { eL: [0.4, -0.6, 0.6], eR: [-0.4, -0.6, 0.6] }), hands) };
  }

  function reliefShot(t) {
    const look = t < 24.6 ? S((t - 23.75) * 3) * 0.4 : lerp(0.3, 0.0, seg(t, 24.6, 25.4));
    const h = heavyAtTable(t, look);
    h.face = heavyFace(t, t < 25.2 ? { browDown: 0.6, sneer: 0.2, wide: 0.3, jaw: 0.2 } : { browInUp: 0.3, smile: 0.45, lidU: 0.45 });
    const sc = leanScout(t, seg(t, 24.35, 25.0));
    sc.face = scoutFace(t, t > 25.1 ? (t > 27.3 ? CX.cocky : CX.grin) : CX.calm, { look: [0.25, 0.1] });
    return {
      shot: 'relief', kind: '3d', set: 'base', env: ENV.room, camera: cam([4.62, 0.98, 1.4], [3.85, 1.28, 0.15], 50), door: { open: true },
      heroes: [h, sc], props: [{ kind: 'briefcase', M: caseM() }]
    };
  }

  function corpseGuest(a) {
    if (!Sh.heroOf('sniper')) return { actors: [a] };
    return { heroes: [{ who: 'sniper', team: 'blu', st: stateOf('sniper', a.pose, null), face: Sh.guestFace({ lidU: 0.05, lidL: 0.3, jaw: 0.25, browInUp: 0.3 }) }] };
  }

  function carryCorpse(st) {
    const m = st.m;
    const sh = m.pts.shoulderL;
    const fwd = V3.norm(M4.dir(m.chest, [0, 0, 1]));
    const left = V3.norm(M4.dir(m.chest, [1, 0, 0]));
    const p = V3.add(sh, V3.add(V3.mul(fwd, -0.02), [0, 0.12, 0]));
    const up = V3.norm(V3.add(V3.mul(fwd, -0.45), [0, -1, 0]));
    const pose = {
      p, fwd, up, sp: [0.25, 0, 0], nk: [0.5, 0, 0],
      fLw: V3.add(p, V3.add(V3.add(V3.mul(fwd, 0.2), V3.mul(left, 0.05)), [0, -0.86, 0])), fRw: V3.add(p, V3.add(V3.add(V3.mul(fwd, 0.24), V3.mul(left, -0.08)), [0, -0.82, 0])),
      kLw: V3.add(p, V3.add(V3.mul(fwd, 0.9), [0, -0.4, 0])), kRw: V3.add(p, V3.add(V3.mul(fwd, 0.9), [0, -0.4, 0])),
      hLw: V3.add(p, V3.add(V3.mul(fwd, -0.42), V3.add(V3.mul(left, 0.12), [0, -0.9, 0]))), hRw: V3.add(p, V3.add(V3.mul(fwd, -0.44), V3.add(V3.mul(left, -0.12), [0, -0.88, 0])))
    };
    return { cls: 'sniper', team: 'blu', pose };
  }

  function spyCarrying(t, at, yaw, expr, walk) {
    const ph = walk ? t * 0.9 : 0;
    const pose = standPose('spy', { at, yaw, sp: [0.06, 0.05 + S(ph * PI * 2) * 0.03, -0.03], nk: [0.02, -0.15, 0.04], fL: walk ? [0, S(ph * PI * 2) * 0.18] : [0, 0], fR: walk ? [0, -S(ph * PI * 2) * 0.18] : [0, 0] });
    const ch = chestOf('spy', pose);
    const pre = stateOf('spy', pose, null);
    const corpse = carryCorpse(pre);
    const knee = V3.lerp(corpse.pose.p, corpse.pose.fLw, 0.4);
    const L = hand(V3.add(knee, M4.dir(ch, [0.02, -0.02, 0.07])), M4.dir(ch, [-0.2, 0.1, -1]), M4.dir(ch, [-1, 0, 0]), 'hold');
    const R = hand(M4.point(ch, [-0.27, -0.33, 0.04]), M4.dir(ch, [0, -1, 0.1]), M4.dir(ch, [1, 0, 0]), 'relax');
    const st = stateOf('spy', Object.assign({}, pose, { eL: [0.6, -0.8, 0.2] }), { L, R });
    return { hero: { who: 'spy', team: 'blu', st, face: spyFace(t, expr) }, corpse };
  }

  function spyDoorShot(t) {
    const r = spyCarrying(t, [0.32, 0, 0.0], PI / 2 - 0.15, X.calm, false);
    r.hero.face = spyFace(t, X.cold, { look: [0.15, 0.05] });
    const whip = 1 - seg(t, 28.417, 28.6);
    const c = corpseGuest(r.corpse);
    return {
      shot: 'spyDoor', kind: '3d', set: 'base', env: ENV.room, camera: cam([1.12, 1.22, 0.42], V3.lerp([3.2, 1.4, -0.2], [0.32, 1.52, 0.02], 1 - whip * whip), 46),
      heroes: [r.hero].concat(c.heroes || []), actors: c.actors || [], door: { open: true }, motion: whip * 0.9
    };
  }

  function titleShot(t) {
    const u = seg(t, 30.917, 34.041);
    return { shot: 'title', kind: 'card', cards: [{ tex: 'title', zoom: 1 + u * 0.03 }] };
  }

  function spyLowShot(t) {
    const u = seg(t, 34.041, 36.541);
    const r = spyCarrying(t, [lerp(0.55, 1.05, u), 0, lerp(0.0, 0.12, u)], PI / 2 - 0.25, X.cold, true);
    r.hero.face = spyFace(t, X.cold, { look: [0.25, 0.12] });
    const h = headPos(r.hero.st);
    const c = corpseGuest(r.corpse);
    return {
      shot: 'spyLow', kind: '3d', set: 'base', env: ENV.room, camera: cam(V3.add(h, [0.62, -0.42, 0.26]), V3.add(h, [0, -0.14, 0.05]), 40, 0.12),
      heroes: [r.hero].concat(c.heroes || []), actors: c.actors || [], door: { open: true }
    };
  }

  window.MspAct1 = {
    bellShot, signsShot, boardShot, rackShot, legsShot, jumpShot, whipShot, chargeShot, whip2Shot, sideShot, keypadShot, doorShot, heavyRunShot, heavyYellShot, shoulderShot,
    burstShot, reliefShot, spyDoorShot, titleShot, spyLowShot, spyCarrying, carryCorpse, corpseGuest, helmetHold, caseM, heavyAtTable, leanScout, CASE_AT, scoutWithBat, soldierHolding, heavyRunState, heavyGunHands, gunHands, PORT, LOW
  };
})();
