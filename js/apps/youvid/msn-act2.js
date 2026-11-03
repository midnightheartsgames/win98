(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Props = window.MsnProps;
  const Sniper = window.MeetSniper;
  const Fab = window.FabCast;
  const FP = window.FabPose;
  const Sh = window.MsnShots;
  const A1 = window.MsnAct1;
  const { seg, spline, track, X, sniperFace, standPose, sitPose, sniperState, hand, gripHand, handTrack, headPos, cam, shake, frameAt, ENV } = Sh;

  const BOX_SCALE = M4.scale(1.75, 1.75, 1.5);
  const BOX_M = M4.chain(M4.translate(0.26, 1.36, 0.0), M4.rotY(PI / 2), BOX_SCALE);
  const PHONE_SPOT = [0.86, 0, 0.12];

  function backRifle(ch) {
    const z = V3.norm([0.42, -1, 0]);
    const y = [0, 0, -1];
    const x = V3.cross(y, z);
    const local = new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, -0.02, 0.16, -0.19, 1]);
    return M4.mul(ch, local);
  }

  function handsetFrame(st) {
    const H = st.m.head;
    const mouth = Sniper.headPoint(st.m, [-0.012, -0.1, 0.1]);
    const ear = Sniper.headPoint(st.m, [-0.082, 0.004, 0.0]);
    const y = V3.norm(V3.sub(ear, mouth));
    const toFace = V3.norm(M4.dir(H, [0.7, 0, -0.3]));
    let z = V3.sub(V3.mul(toFace, -1), V3.mul(y, V3.dot(V3.mul(toFace, -1), y)));
    z = V3.norm(z);
    const x = V3.cross(y, z);
    const o = V3.add(mouth, V3.add(V3.mul(z, 0.03), V3.mul(y, -0.01)));
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, o[0], o[1], o[2], 1]);
  }

  const PHONE_NK = spline([[37.5, [0.25, 0.25, -0.05]], [38.6, [0.22, 0.3, -0.08]], [39.4, [0.3, 0.2, -0.04]], [40.0, [0.12, 0.15, 0.0]], [41.0, [0.08, 0.05, 0.05]],
    [42.0, [0.15, 0.2, 0.0]], [43.0, [0.0, 0.1, 0.06]], [44.2, [0.05, 0.25, -0.04]], [45.66, [0.1, 0.15, 0.0]]]);

  const PHONE_FACE = track([[37.5, X.annoyed], [38.6, X.explain, 0.2], [40.1, X.annoyed, 0.25], [41.6, X.explain], [42.7, X.annoyed, 0.2], [44.0, X.explain], [45.2, X.grim]]);

  function phoneState(t) {
    const pose = standPose({ at: PHONE_SPOT, yaw: -PI / 2, sp: [0.1, 0.12, 0], nk: PHONE_NK(t), spread: 0.08, sway: S(t * 1.1) * 0.01 });
    const pre = sniperState(pose, null);
    const HS = handsetFrame(pre);
    const gripPos = M4.point(HS, [0, 0.05, 0.012]);
    const R = gripHand({ pos: gripPos, fingers: V3.norm(M4.dir(HS, [1, -0.55, 0])), palm: V3.norm(M4.dir(HS, [0, 0, -1])), pose: 'phone' }, 0.07);
    const ch = Sh.chestOf(pose);
    pose.eRw = M4.point(ch, [-0.25, -0.35, 0.45]);
    const gest = t > 40.6 && t < 41.6 ? 1 : 0;
    const L = hand(M4.point(ch, [0.26, -0.32 + gest * 0.1, 0.12 + gest * 0.12]), M4.dir(ch, [0.1, -1, 0.3]), M4.dir(ch, [-1, 0, 0.2]), gest ? 'open' : 'relax');
    const st = sniperState(pose, { L, R });
    st.rifle = backRifle(st.m.chest);
    const cordA = M4.point(BOX_M, [0.04, -0.4, 0.05]);
    const cordB = M4.point(HS, [0, -0.025, 0.015]);
    return { st, HS, cord: Props.cordPoints(cordA, cordB, 0.18, 18) };
  }

  function phoneStage(t, shot, camera, extra) {
    const P = phoneState(t);
    return Object.assign({
      shot, kind: '3d', set: 'phone', env: ENV.phone, camera, sniper: P.st, face: sniperFace(t, PHONE_FACE(t), { look: [-0.1, -0.15] }),
      props: [{ kind: 'phoneBox', M: BOX_M, tint: [0.72, 0.68, 0.64] }, { kind: 'handset', M: P.HS }, { kind: 'cord', pts: P.cord }]
    }, extra || {});
  }

  function shotPhoneCU(t) {
    const P = phoneState(t);
    const h = headPos(P.st);
    const mouth = Sniper.headPoint(P.st.m, [0, -0.1, 0.1]);
    const camera = cam(V3.add(mouth, [-0.14, -0.09, 0.33]), V3.add(mouth, [-0.02, 0.03, 0.0]), 44);
    return phoneStage(t, 'phoneCU', camera, { blur: 0.6 });
  }

  function shotPhoneWide(t) {
    const whip = seg(t, 41.95, 42.42);
    if (whip > 0) {
      const P = phoneState(t);
      const h = headPos(P.st);
      const a = ease(whip);
      const camera = cam(V3.lerp([1.3, 1.3, 2.25], V3.add(h, [-0.42, -0.36, 0.78]), a), V3.add(V3.lerp([0.76, 1.25, 0], V3.add(h, [-0.2, -0.3, 0]), a), [S(a * PI) * 1.4, 0, 0]), lerp(36, 40, a));
      return phoneStage(t, 'phoneWide', camera, { blurAll: 0.9 * S(whip * PI) + 0.1, tintAll: [0.9, 0.35, 0.3, S(whip * PI) * 0.5] });
    }
    const drift = seg(t, 39.96, 41.95);
    const camera = cam([lerp(1.3, 1.36, drift), 1.3, 2.25], [0.76, 1.25, 0], 36);
    return phoneStage(t, 'phoneWide', camera, { blur: 0.35 });
  }

  function shotPhoneMed(t) {
    const P = phoneState(t);
    const h = headPos(P.st);
    const drift = seg(t, 42.42, 45.66);
    const camera = cam(V3.add(h, [-0.42 + drift * 0.04, -0.36, 0.78]), V3.add(h, [-0.2, -0.3, 0]), 40);
    return phoneStage(t, 'phoneMed', camera, { blur: 0.45 });
  }

  const DRIVE2_NK = spline([[45.6, [0.02, -0.15, 0.0]], [46.4, [0.0, -0.05, 0.04]], [47.4, [0.05, -0.2, -0.02]], [48.3, [0.0, -0.1, 0.03]], [49.1, [0.02, -0.2, 0.0]]]);
  const DRIVE2_FACE = track([[45.6, X.explain], [46.6, X.talk], [47.6, X.firm], [48.4, X.talk]]);

  function shotDrive2(t) {
    const turn = S(t * 0.8) * 0.05;
    const pose = A1.driverPose(t, { nk: DRIVE2_NK(t), sp: [-0.08, -0.05, 0] });
    const ch = Sh.chestOf(pose);
    const head = Sniper.solve(pose).head;
    const near = M4.point(head, [-0.03, -0.13, 0.19]);
    const bob = S(t * 4.2) * 0.012;
    const R = handTrack([[45.6, hand(V3.add(near, [0.02, bob, 0.0]), M4.dir(ch, [0.1, 1, 0.3]), M4.dir(ch, [0.7, 0, -0.5]), 'claw')],
      [47.3, hand(V3.add(near, [0.05, -0.06 + bob, 0.06]), M4.dir(ch, [0.2, 0.9, 0.4]), M4.dir(ch, [0.5, 0.2, -0.6]), 'open'), 0.3],
      [48.3, hand(V3.add(near, [0.02, bob, 0.0]), M4.dir(ch, [0.1, 1, 0.3]), M4.dir(ch, [0.7, 0, -0.5]), 'claw'), 0.3]], t);
    const L = A1.rimGrip(2.4, turn);
    const st = sniperState(pose, { L, R });
    const h = headPos(st);
    const camera = cam(V3.add(V3.add(h, [0.64, -0.03, -0.3]), shake(t, 0.005, 9)), V3.add(h, [0, -0.08, -0.26]), 38);
    return {
      shot: 'drive2', kind: '3d', set: 'cab', env: ENV.cab, camera, sniper: st, face: sniperFace(t, DRIVE2_FACE(t), { look: [0.18, 0] }),
      props: [{ kind: 'wheel', M: A1.wheelM(turn) }], scroll: t * 0.5, outsideBlur: 0.85
    };
  }

  const LADDER = (i) => [-0.66 * (1 - i * 0.008) + 0.21, 0.3 + i * 0.32, 1.02 - i * 0.012];

  function climbState(t) {
    const y = lerp(5.6, 7.4, seg(t, 49.0, 50.65));
    const ph = (t * 1.6) % 1;
    const rung = (yy) => Math.max(0, Math.round((yy - 0.3) / 0.32));
    const step = Math.sin(ph * PI * 2);
    const base = [-0.45, 0, 1.36];
    const pose = { p: [base[0], y + 1.0, base[2]], fwd: [0, 0, -1], up: [0, 1, 0], sp: [0.1, 0, 0], nk: [-0.35, 0, 0], eL: [0.6, -0.4, 0.2], eR: [-0.6, -0.4, 0.2] };
    const hand0 = LADDER(rung(y + 1.55 + step * 0.16)), hand1 = LADDER(rung(y + 1.55 - step * 0.16));
    const foot0 = LADDER(rung(y + 0.05 - step * 0.16)), foot1 = LADDER(rung(y + 0.05 + step * 0.16));
    const L = hand([hand0[0] - 0.12, hand0[1] - 0.04, hand0[2] + 0.06], [0, 0.2, -1], [0, -1, 0], 'grip');
    const R = hand([hand1[0] + 0.12, hand1[1] - 0.04, hand1[2] + 0.06], [0, 0.2, -1], [0, -1, 0], 'grip');
    pose.fLw = [foot0[0] - 0.1, foot0[1] + 0.07, foot0[2] + 0.1];
    pose.fRw = [foot1[0] + 0.1, foot1[1] + 0.07, foot1[2] + 0.1];
    pose.kLw = V3.add(pose.fLw, [-0.2, 0.6, 1]);
    pose.kRw = V3.add(pose.fRw, [0.2, 0.6, 1]);
    const st = sniperState(pose, { L, R });
    st.rifle = backRifle(st.m.chest);
    return st;
  }

  function shotClimb(t) {
    const st = climbState(t);
    const h = headPos(st);
    const k = ease(seg(t, 49.04, 49.5));
    const eye = V3.lerp(V3.add(h, [0.9, -2.2, 2.0]), [3.5, 2.2, 36], k);
    const at = V3.lerp(V3.add(h, [0, 0.2, 0]), [-0.4, 7.4, 0], k);
    const fov = lerp(50, 33, k);
    const drift = seg(t, 49.5, 50.62);
    return {
      shot: 'climb', kind: '3d', set: 'tower', env: ENV.tower, camera: cam(V3.add(eye, [drift * 0.6, 0, 0]), at, fov), sniper: st, face: sniperFace(t, X.firm),
      blurAll: k < 0.95 ? (1 - k) * 0.9 : 0
    };
  }

  const PERCH_FACE = track([[50.6, X.squint], [51.8, X.talk], [53.4, X.squint], [54.3, X.surprise, 0.15], [54.6, X.grim, 0.2], [55.7, X.squint]]);

  function perchState(t) {
    const turn = ease(seg(t, 54.38, 55.35));
    const yaw = -PI / 2 + turn * PI;
    const fwd = [S(yaw), 0, C(yaw)];
    const side = [C(yaw), 0, -S(yaw)];
    const at = V3.add([-0.55, 0, 0.1], V3.mul(fwd, -turn * 0.0));
    const lift = S(turn * PI) * 0.12;
    const pose = sitPose({ seat: [at[0] - fwd[0] * 0.05, 0.36 + lift, at[2] - fwd[2] * 0.05], yaw, sp: [0.42, -0.12, 0.0], nk: [0.12, 0.2, 0.06], foot: 0.52, floor: 0, spread: 0.2 });
    const pre = Sniper.solve(pose);
    const eyeR = M4.point(pre.head, [-0.034, 0.03, 0.12]);
    const aimDown = -0.08;
    const dir = V3.norm([fwd[0] * C(aimDown), S(aimDown), fwd[2] * C(aimDown)]);
    const swingUp = S(turn * PI) * 0.9;
    const rdir = V3.norm(V3.add(dir, [0, swingUp, 0]));
    const RM = frameAt(V3.sub(V3.add(eyeR, V3.mul(rdir, 0.24)), [0, 0.088 + swingUp * 0.1, 0]), rdir, [0, 1, 0]);
    const rifle = M4.chain(RM, M4.translate(0, 0, -0.1));
    const R = gripHand(Props.grip('R', rifle), 0.05);
    const L = gripHand(Props.grip('L', rifle), 0.05);
    const st = sniperState(pose, { L, R }, { rifle });
    return { st, yaw, turn, side };
  }

  function shotPerch(t) {
    const P = perchState(t);
    const h = headPos(P.st);
    const back = [-S(P.yaw), 0, -C(P.yaw)];
    const eye = V3.add(h, V3.add(V3.mul(back, 0.3), V3.add(V3.mul(P.side, 0.38), [0, -0.12, 0])));
    const fwd = [S(P.yaw), 0, C(P.yaw)];
    const at = V3.add(h, V3.add(V3.mul(fwd, 0.9), V3.add(V3.mul(P.side, -0.22), [0, -0.3, 0])));
    const spin = S(P.turn * PI);
    return {
      shot: 'perch', kind: '3d', set: 'perch', env: ENV.tower, camera: cam(eye, at, 44), sniper: P.st, face: sniperFace(t, PERCH_FACE(t), { look: [0.05, -0.1] }),
      blurAll: spin * 0.85
    };
  }

  const SEAT_HUT = [-0.9, 0.64, 0.2];
  const MUG_AT = [-0.12, 0.6, 0.55];
  const HUT_FACE = track([[56.2, X.calm], [56.8, X.squint, 0.3], [57.9, X.calm], [58.6, X.squint], [59.0, X.calm], [59.5, X.squint], [60.0, X.calm], [60.6, X.squint]]);
  const SIPS = [[56.2, 56.8], [57.85, 58.45], [59.05, 59.45], [60.0, 60.55]];

  function hutState(t) {
    let sip = 0;
    SIPS.forEach(([a, b]) => { sip = Math.max(sip, ease(seg(t, a, a + 0.18)) * (1 - ease(seg(t, b - 0.2, b)))); });
    if (t < 56.4) sip = Math.max(sip, 1 - ease(seg(t, 56.3, 56.8)));
    const lean = t > 58.3 && t < 58.8 ? S(seg(t, 58.3, 58.8) * PI) : 0;
    const pose = sitPose({ seat: SEAT_HUT, yaw: PI / 2, sp: [0.22 + lean * 0.25, -0.05 + lean * 0.3, -lean * 0.1], nk: [0.05 - sip * 0.05, sip * 0.05, 0], foot: 0.5, floor: 0, spread: 0.18 });
    const pre = Sniper.solve(pose);
    const eyeR = M4.point(pre.head, [-0.034, 0.03, 0.12]);
    const dir = V3.norm([1, -0.03, 0.06]);
    const drop = sip * 0.12;
    const RM = frameAt(V3.sub(V3.add(eyeR, V3.mul(dir, 0.22)), [0, 0.088 + drop, 0]), V3.norm(V3.add(dir, [0, -sip * 0.12, 0])), [0, 1, 0]);
    const rifle = M4.chain(RM, M4.translate(0, 0, -0.1));
    const L = gripHand(Props.grip('L', rifle), 0.05);
    const mouth = M4.point(pre.head, [0.0, -0.1, 0.12]);
    const mugHand = hand(V3.add(mouth, [-0.02, -0.06, 0.06]), [0.4, 0.2, -1], [1, 0, 0.2], 'mug');
    const R = sip > 0 ? Sh.blendHand(gripHand(Props.grip('R', rifle), 0.05), mugHand, sip) : gripHand(Props.grip('R', rifle), 0.05);
    const st = sniperState(pose, { L, R }, { rifle });
    let mug = M4.translate(MUG_AT[0], MUG_AT[1], MUG_AT[2]);
    if (sip > 0.02 && st.hands.R.M) {
      const held = M4.chain(st.hands.R.M, M4.translate(-0.02, -0.07, 0.065), M4.rotX(-PI / 2), M4.rotZ(0.2), M4.translate(0, -0.05, 0));
      mug = held.map((v, i) => lerp(mug[i], v, clamp(sip * 1.5, 0, 1)));
    }
    return { st, mug };
  }

  function shotHut(t) {
    const H = hutState(t);
    const h = headPos(H.st);
    const camera = cam([-0.38, 0.76, 0.95], [-0.68, 1.05, 0.2], 56);
    return {
      shot: 'hut', kind: '3d', set: 'hut', setOpts: { outside: true }, env: ENV.hut, camera, sniper: H.st, face: sniperFace(t, HUT_FACE(t), { look: [0.05, -0.05] }),
      props: [
        { kind: 'mug', M: H.mug }, { kind: 'pot', M: M4.chain(M4.translate(0.18, 0.67, 0.3), M4.rotY(0.6), M4.scale(1.3, 1.3, 1.3)) },
        { kind: 'jar', M: M4.translate(-1.5, 0.6, 0.75), fill: 'full' }, { kind: 'jar', M: M4.translate(-1.38, 0.6, 0.88), fill: 'low' }, { kind: 'jar', M: M4.translate(-0.62, 0.6, -1.3), fill: 'empty' },
        { kind: 'clock', M: M4.translate(-1.75, 1.32, -0.6) }
      ],
      shafts: [{ p: [2.6, 1.55, 0.4], dir: [-1, -0.35, 0.05], w: 1.5, h: 0.9, len: 3.5 }]
    };
  }

  const SPY_AT = [0.0, 0, -0.55];

  function spyActor(t) {
    const fall = ease(seg(t, 63.55, 64.32));
    const pose = FP.stand('spy', SPY_AT[0], SPY_AT[2], 0.15, { sp: [lerp(-0.18, 0.9, fall), 0.1, 0.08], nk: [lerp(-0.22, 0.2, fall), 0.2, 0.15], hR: [-0.22, 0.3, 0.32], hL: [0.24, -0.22, 0.26] });
    pose.p = V3.add(pose.p, [0, -fall * 0.5, fall * 0.55]);
    pose.up = V3.norm([0, 1, fall * 0.9]);
    const a = { cls: 'spy', team: 'blu', pose, itemR: 'knife', grips: { R: 'fist', L: 'fist' }, face: { eyes: 'wide', brows: 'up', mouth: 'open', open: 0.25 } };
    return a;
  }

  function shotSpy(t) {
    const spy = spyActor(t);
    const sm = Fab.solve('spy', spy.pose);
    const kukri = M4.chain(sm.chest, M4.translate(0.05, 0.22, 0.12), M4.rotX(-1.15), M4.rotZ(0.35), M4.translate(0, -0.12, 0));
    if (t < 64.32) {
      const head = M4.point(sm.head, [0, 0, 0]);
      const camera = cam([0.22, 1.5, 0.05], V3.add(head, [0.1, -0.14, 0]), 50, -0.08);
      const burn = 1 - seg(t, 61.42, 62.9);
      return {
        shot: 'spy', kind: '3d', set: 'hall', env: ENV.hall, camera, actors: [spy], props: [{ kind: 'kukri', M: kukri, bloody: true }],
        fx: { fire: burn > 0 ? [{ M: sm.chest, u: 1 - burn, s: 1 }] : [], blood: [] }, blurAll: seg(t, 63.95, 64.3) * 0.8
      };
    }
    const walk = seg(t, 64.32, 65.92);
    const z = lerp(-3.3, -2.5, walk);
    const pose = Sh.standPose({ at: [0.05, 0, z], yaw: 0, sp: [0.06, S(t * 4) * 0.05, 0], nk: [0.12, 0, 0], spread: 0.08, fL: [0, S(t * 4) * 0.12], fR: [0, -S(t * 4) * 0.12] });
    const ch = Sh.chestOf(pose);
    const R = hand(M4.point(ch, [-0.27, -0.4, 0.14]), M4.dir(ch, [0.0, -1, 0.35]), M4.dir(ch, [1, 0, 0]), 'grip');
    const L = hand(M4.point(ch, [0.26, -0.38, 0.08]), M4.dir(ch, [0.05, -1, 0.15]), M4.dir(ch, [-1, 0, 0.1]), 'relax');
    const st = sniperState(pose, { L, R });
    if (st.hands.R.M) st.kukri = M4.chain(st.hands.R.M, M4.translate(0, -0.08, 0.02), M4.rotX(-0.5));
    st.bloody = true;
    const camera = cam([0.12, 1.45, 0.05], [0.0, 1.32, -3.0], 46);
    return { shot: 'spy', kind: '3d', set: 'hall', env: ENV.hall, camera, sniper: st, face: sniperFace(t, X.grim), props: [{ kind: 'lamp', M: M4.translate(0, 2.42, -0.7) }] };
  }

  const DRIVE3_NK = spline([[65.9, [0.02, -0.05, 0.0]], [66.8, [0.0, 0.1, 0.03]], [67.9, [0.04, -0.05, -0.02]], [69.5, [0.0, 0.15, 0.0]], [70.6, [0.05, 0.05, 0.03]], [71.2, [0.0, -0.05, 0.0]]]);
  const DRIVE3_FACE = track([[65.9, X.annoyed], [67.0, X.disgust, 0.3], [68.0, X.calm, 0.4], [69.4, X.firm], [70.6, X.wry, 0.3]]);

  function shotDrive3(t) {
    const turn = S(t * 0.6) * 0.07;
    const pose = A1.driverPose(t, { nk: DRIVE3_NK(t), sp: [-0.1, -0.02, 0] });
    const L = A1.rimGrip(2.5, turn);
    const R = A1.rimGrip(0.55, turn);
    const st = sniperState(pose, { L, R });
    const h = headPos(st);
    const camera = cam(V3.add(V3.add(h, [0.68, -0.05, -0.42]), shake(t, 0.006, 11)), V3.add(h, [0, -0.1, -0.24]), 40);
    return {
      shot: 'drive3', kind: '3d', set: 'cab', env: ENV.cab, camera, sniper: st, face: sniperFace(t, DRIVE3_FACE(t), { look: [0.12, 0] }),
      props: [{ kind: 'wheel', M: A1.wheelM(turn) }], scroll: t * 0.5, outsideBlur: 0.85
    };
  }

  function deadSpy() {
    const pose = FP.supine('spy', -0.3, -0.4, PI * 0.96, { nk: [0.3, 0.4, 0], hL: [0.5, -0.1, 0.1], hR: [-0.45, 0.2, 0.0] });
    return { cls: 'spy', team: 'blu', pose, face: { eyes: 'shut', mouth: 'open', open: 0.2 } };
  }

  function shotKukri(t) {
    const turn = ease(seg(t, 71.75, 72.25));
    const pose = Sh.standPose({ at: [0.38, 0, -1.75], yaw: lerp(-PI * 0.65, -PI * 0.2, turn), sp: [0.18, 0, 0], nk: [0.4 - turn * 0.2, 0.05, 0], spread: 0.1 });
    const ch = Sh.chestOf(pose);
    const R = hand(M4.point(ch, [-0.25, -0.34, 0.2]), M4.dir(ch, [0.1, -1, 0.5]), M4.dir(ch, [1, 0, 0]), 'grip');
    const L = hand(M4.point(ch, [0.12, 0.05, 0.3]), M4.dir(ch, [-0.4, 0.2, 1]), M4.dir(ch, [-0.3, -1, 0]), 'rest');
    const st = sniperState(pose, { L, R });
    if (st.hands.R.M) st.kukri = M4.chain(st.hands.R.M, M4.translate(0, -0.08, 0.02), M4.rotX(-0.2));
    st.bloody = true;
    const camera = cam([-0.52, 0.4, -0.15], [0.12, 1.0, -1.95], 56);
    return {
      shot: 'kukri', kind: '3d', set: 'hall', setOpts: { window: true }, env: ENV.hall, camera, sniper: st, face: sniperFace(t, X.grim, { look: [0, -0.3] }), actors: [deadSpy()],
      props: [{ kind: 'rifle', M: M4.chain(M4.translate(-0.78, 0.48, -1.9), M4.rotY(0.1), M4.rotX(-1.35)) }]
    };
  }

  function bluHit(t, t0, a, p, dir) {
    const fx = A1.blood(p, t0, t, dir || [0.2, 0.5, -1], 26);
    return fx;
  }

  function shotScope2(t) {
    const hit = 72.8;
    const fall = ease(seg(t, hit + 0.05, hit + 0.45));
    const medPose = FP.stand('medic', 0.75, -19.3, -1.0, { sp: [0.1 + fall * 0.6, 0, -fall * 0.4], nk: [-0.1 + fall * 0.5, 0, 0] });
    medPose.p = V3.add(medPose.p, [0.1 * fall, -fall * 0.5, 0]);
    const med = { cls: 'medic', team: 'blu', pose: medPose, gun: 'medigun' };
    const g = FP.aimGun('medic', 'medigun', { pitch: -0.15 });
    Object.assign(medPose, { hR: g.hR, hL: g.hL });
    med.gunM = g.gunM;
    const sol = { cls: 'soldier', team: 'blu', pose: FP.crouch('soldier', -0.55, -19.5, 0.5, { depth: 0.45 }), gun: 'rocket' };
    const gs = FP.aimGun('soldier', 'rocket');
    Object.assign(sol.pose, { hR: gs.hR, hL: gs.hL });
    sol.gunM = gs.gunM;
    const mm = Fab.solve('medic', medPose);
    const head = M4.point(mm.head, [0, 0, 0]);
    const muzzle = M4.point(M4.mul(mm.chest, g.gunM), [0, 0, 0.5]);
    const target = M4.point(Fab.solve('soldier', sol.pose).chest, [0, 0.1, 0]);
    const fx = { blood: [], beams: t < hit + 0.05 ? [{ a: muzzle, b: target, t }] : [] };
    const b = bluHit(t, hit, 0, head);
    if (b) fx.blood.push(b);
    const k = A1.recoil(t, [hit]);
    const aim = V3.lerp(V3.add(head, [-0.45, -0.25, 0]), V3.add(head, [0, -0.35, 0]), ease(seg(t, 72.25, 72.75)));
    return { shot: 'scope2', kind: '3d', set: 'fort', env: ENV.scope, camera: A1.scopeCam(aim, t, 1.7, k), scope: true, actors: [med, sol], fx };
  }

  function shotScope3(t) {
    const hit = 74.0;
    const fall = ease(seg(t, hit + 0.05, hit + 0.4));
    const pose = FP.stand('soldier', 4.5, -21.9, 0.35, { sp: [-0.05 - fall * 0.4, 0, fall * 0.3], nk: [fall * -0.5, 0, 0] });
    pose.p = V3.add(pose.p, [0, -fall * 0.3, -fall * 0.3]);
    const sol = { cls: 'soldier', team: 'blu', pose, gun: 'rocket' };
    const gs = FP.aimGun('soldier', 'rocket');
    Object.assign(pose, { hR: gs.hR, hL: gs.hL });
    sol.gunM = gs.gunM;
    const head = M4.point(Fab.solve('soldier', pose).head, [0, 0, 0]);
    const fx = { blood: [] };
    const b = bluHit(t, hit, 0, head);
    if (b) fx.blood.push(b);
    return { shot: 'scope3', kind: '3d', set: 'fort', env: ENV.scope, camera: A1.scopeCam(V3.add(head, [0.05, -0.18, 0]), t, 1.05, A1.recoil(t, [hit])), scope: true, actors: [sol], fx };
  }

  function shotScope4(t) {
    const hit = 75.4;
    const fall = ease(seg(t, hit + 0.05, hit + 0.22));
    const pose = FP.crouch('pyro', -0.35, -19.6, 1.1, { depth: 0.4, sp: [0.3 - fall * 0.5, 0, fall * 0.6], nk: [-0.1 - fall * 0.5, 0, 0] });
    const pyro = { cls: 'pyro', team: 'blu', pose, gun: 'shotgun' };
    const g = FP.aimGun('pyro', 'shotgun');
    Object.assign(pose, { hR: g.hR, hL: g.hL });
    pyro.gunM = g.gunM;
    const head = M4.point(Fab.solve('pyro', pose).head, [0, 0, 0]);
    const fx = { blood: [] };
    const b = bluHit(t, hit, 0, head);
    if (b) fx.blood.push(b);
    return { shot: 'scope4', kind: '3d', set: 'fort', env: ENV.scope, camera: A1.scopeCam(V3.add(head, [0.1, -0.2, 0]), t, 1.05, A1.recoil(t, [hit])), scope: true, actors: [pyro], fx };
  }

  function ledgeState(t, bolt) {
    const pose = sitPose({ seat: [0, 0.32, 0.25], yaw: PI, sp: [0.45, 0.05, 0], nk: [0.25, 0.05, 0], foot: 0.5, floor: 0, spread: 0.24 });
    const pre = Sniper.solve(pose);
    const eyeR = M4.point(pre.head, [-0.034, 0.03, 0.12]);
    const dir = V3.norm([0.05, -0.25, -1]);
    const RM = frameAt(V3.sub(V3.add(eyeR, V3.mul(dir, 0.24)), [0, 0.088, 0]), dir, [0, 1, 0]);
    const rifle = M4.chain(RM, M4.translate(0, 0, -0.1));
    const L = gripHand(Props.grip('L', rifle), 0.05);
    const boltHand = gripHand(Props.grip('bolt', rifle), 0.04);
    const pulled = M4.point(rifle, [-0.06, 0.04, -0.12]);
    const R = bolt > 0 ? Sh.blendHand(gripHand(Props.grip('R', rifle), 0.05), Object.assign({}, boltHand, { target: V3.lerp(boltHand.target, pulled, clamp(bolt * 2 - 1, 0, 1)) }), clamp(bolt * 2, 0, 1)) : gripHand(Props.grip('R', rifle), 0.05);
    return sniperState(pose, { L, R }, { rifle });
  }

  function shotBolt1(t) {
    const bolt = S(seg(t, 73.25, 73.7) * PI);
    const st = ledgeState(t, bolt);
    const sh = st.m.pts.shoulderL;
    const camera = cam(V3.add(sh, [-0.13, 0.07, 0.2]), V3.add(sh, [0.2, -0.3, -1.2]), 48);
    return { shot: 'bolt1', kind: '3d', set: 'ledge', env: ENV.road, camera, sniper: st, face: sniperFace(t, X.squint), blur: 0.7 };
  }

  function shotBolt2(t) {
    const bolt = S(seg(t, 74.42, 74.75) * PI);
    const st = ledgeState(t, bolt);
    const camera = cam(M4.point(st.rifle, [-0.3, 0.13, -0.14]), M4.point(st.rifle, [0, 0.03, 0.0]), 50);
    return { shot: 'bolt2', kind: '3d', set: 'ledge', env: ENV.road, camera, sniper: st, face: sniperFace(t, X.squint), blur: 0.8 };
  }

  const SUN = [-45, 92, -70];

  function shotSun(t) {
    const flick = seg(t, 76.38, 76.5);
    const raise = ease(seg(t, 76.55, 78.2));
    const pose = Sh.standPose({ at: [0, 0, 0], yaw: 0.25, sp: [0.05 + raise * 0.08, -raise * 0.2, 0], nk: [0.15 - raise * 0.25, 0.1 - raise * 0.3, 0], spread: 0.1 });
    const pre = Sniper.solve(pose);
    const ch = pre.chest;
    const eyeR = M4.point(pre.head, [-0.034, 0.03, 0.12]);
    const aim = V3.norm(V3.lerp([0.4, -0.6, 0.6], [0.18, -0.3, 0.95], raise));
    const RMa = frameAt(V3.sub(V3.add(eyeR, V3.mul(aim, 0.24)), [0, 0.088, 0]), aim, [0, 1, 0]);
    const low = M4.chain(ch, M4.translate(0.05, -0.18, 0.28), M4.rotY(0.3), M4.rotX(-0.5));
    const RM = raise < 1 ? low.map((v, i) => lerp(v, RMa[i], raise)) : RMa;
    const rifle = M4.chain(RM, M4.translate(0, 0, -0.1));
    const L = gripHand(Props.grip('L', rifle), 0.05);
    const flickHand = hand(M4.point(ch, [-0.12, 0.24, 0.5]), M4.dir(ch, [0.25, 0.9, 0.2]), M4.dir(ch, [0.4, 0, 1]), flick > 0.5 ? 'flick' : 'pinch');
    const R = raise > 0.05 ? Sh.blendHand(flickHand, gripHand(Props.grip('R', rifle), 0.05), clamp(raise * 1.4, 0, 1)) : flickHand;
    const st = sniperState(pose, { L, R }, { rifle });
    const props = [];
    if (t < 76.42 && st.hands.R.M) props.push({ kind: 'casing', M: M4.chain(st.hands.R.M, M4.translate(0.0, -0.1, 0.03), M4.rotZ(0.9)) });
    else if (t < 77.2) {
      const u = t - 76.42;
      const start = st.hands.R.M ? M4.point(st.hands.R.M, [0, -0.1, 0.03]) : [0, 1.6, 0.3];
      const p = V3.add(start, [-0.6 * u, 1.6 * u - 4.9 * u * u, 0.2 * u]);
      props.push({ kind: 'casing', M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotZ(u * 22), M4.rotX(u * 9)) });
    }
    const h = headPos(st);
    const rest = Sniper.solve(Sh.standPose({ at: [0, 0, 0], yaw: 0.25, sp: [0.05, 0, 0], nk: [0.15, 0.1, 0], spread: 0.1 })).chest;
    const camera = cam(V3.lerp(M4.point(rest, [0.04, 0.02, 0.62]), M4.point(rest, [0.42, -0.4, 1.4]), raise), V3.lerp(M4.point(rest, [-0.06, 0.4, 0.32]), M4.point(rest, [0.0, 0.62, 0.2]), raise), lerp(50, 48, raise), 0.06);
    const fire = t > 78.98 ? clamp((t - 78.98) / 0.05, 0, 1) : 0;
    return {
      shot: 'sun', kind: '3d', set: 'sky', env: ENV.sun, camera, sniper: st, face: sniperFace(t, X.grim, { look: [0.1, -0.2] }), props,
      setOpts: { noon: true }, sun: { p: SUN, s: 26 }, flash: fire > 0 ? { p: Props.muzzle(rifle).p, s: 0.9, a: fire } : null, white: fire * 0.85
    };
  }

  window.MsnAct2 = { shotPhoneCU, shotPhoneWide, shotPhoneMed, shotDrive2, shotClimb, shotPerch, shotHut, shotSpy, shotDrive3, shotKukri, shotScope2, shotScope3, shotScope4, shotBolt1, shotBolt2, shotSun, BOX_M, backRifle, handsetFrame };
})();
