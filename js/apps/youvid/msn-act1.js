(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Props = window.MsnProps;
  const Sniper = window.MeetSniper;
  const FP = window.FabPose;
  const Sh = window.MsnShots;
  const { seg, spline, track, X, HX, sniperFace, heavyFace, standPose, sitPose, sniperState, hand, gripHand, handTrack, heavyState, headPos, cam, shake, blu, ENV } = Sh;

  function fade(t, t0, t1) {
    return 1 - seg(t, t0, t1);
  }

  const VAN_SPEED = 17.4;

  function vanM(t) {
    const zr = -5.4 - VAN_SPEED * (t - 3.6);
    const bump = S(t * 9) * 0.012;
    return M4.chain(M4.translate(2.25, bump, zr - 2.07), M4.rotY(PI));
  }

  function shotRoad(t) {
    const drift = seg(t, 0.75, 4.83);
    const eye = [lerp(0.05, -0.05, drift), 0.17, lerp(0.4, 0.0, drift)];
    const camera = cam(V3.add(eye, t > 2.85 && t < 3.3 ? shake(t * 6, 0.012, 3) : [0, 0, 0]), [-1.1, 0.95, -60], 48);
    const props = t > 2.8 ? [{ kind: 'van', M: vanM(t) }] : [];
    return { shot: 'road', kind: '3d', set: 'road', env: ENV.road, camera, props, fade: fade(t, 0.75, 1.15) };
  }

  const BOBBLE = [0.11, 0, -0.2];

  function bobbleNod(t) {
    const idle = [S(t * 5.1) * 0.03, S(t * 2.3) * 0.02, S(t * 6.3) * 0.025];
    if (t < 8.55) {
      const push = ease(seg(t, 8.38, 8.55));
      return [idle[0] - push * 0.25, idle[1], idle[2] + push * 0.55];
    }
    const u = t - 8.55;
    const env = Math.exp(-u * 1.05);
    return [idle[0] - 0.25 * env * C(u * 13.5), idle[1] + 0.12 * env * S(u * 9), idle[2] + 0.75 * env * C(u * 12.6)];
  }

  function flickHand(t) {
    const k = ease(seg(t, 7.75, 8.35)) * (1 - ease(seg(t, 8.85, 9.9)));
    if (k <= 0.001) return null;
    const rest = [-0.3, 0.02, 0.18];
    const near = [-0.02, 0.17, -0.13];
    const p = V3.lerp(rest, near, k);
    const snap = t > 8.45;
    const M = M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(-0.9), M4.rotZ(-1.15 + (snap ? -0.15 : 0)), M4.rotX(0.25));
    return { M, pose: snap ? 'point' : 'flick' };
  }

  function shotBobble(t) {
    const camera = cam([0.0, 0.22, 0.2], [0.1, 0.14, -0.2], 42);
    const props = [
      { kind: 'bobble', M: M4.chain(M4.translate(BOBBLE[0], BOBBLE[1], BOBBLE[2]), M4.rotY(-0.25)), nod: bobbleNod(t) },
      { kind: 'tray', M: M4.chain(M4.translate(-0.26, 0.0, 0.06), M4.rotY(0.4)) }
    ];
    const h = flickHand(t);
    if (h) props.push({ kind: 'hand', side: 'R', M: h.M, pose: h.pose });
    return { shot: 'bobble', kind: '3d', set: 'dash', env: ENV.dash, camera, props, outsideBlur: 0.95 };
  }

  const SEAT = [0.45, 0.52, 0.1];
  const WHEEL_C = [0.45, 1.0, -0.27];
  const WHEEL_M = M4.chain(M4.translate(WHEEL_C[0], WHEEL_C[1], WHEEL_C[2]), M4.rotX(-0.95), M4.scale(1.15, 1.15, 1.15));

  function wheelM(turn) {
    return M4.chain(WHEEL_M, M4.rotZ(turn || 0));
  }

  function rimGrip(theta, turn, pose) {
    const M = wheelM(turn);
    const r = [C(theta), S(theta), 0];
    const pos = M4.point(M, [C(theta) * 0.19, S(theta) * 0.19, 0.01]);
    const palm = V3.norm(M4.dir(M, [-r[0] * 0.45, -r[1] * 0.45, -1]));
    const fingers = V3.norm(M4.dir(M, [r[0] * 0.8 - S(theta) * 0.2, r[1] * 0.8 + C(theta) * 0.2, -0.35]));
    return gripHand({ pos, fingers, palm, pose: pose || 'wheel' }, 0.045);
  }

  function driverPose(t, o) {
    const bump = S(t * 7.3) * 0.004 + S(t * 3.1) * 0.003;
    const pose = sitPose({ seat: [SEAT[0], SEAT[1] + bump, SEAT[2]], yaw: PI, sp: o.sp || [-0.1, 0, 0], nk: o.nk || [0, 0, 0], foot: 0.62, floor: 0.0, spread: 0.12 });
    pose.eL = [0.6, -0.6, -0.3];
    pose.eR = [-0.6, -0.6, -0.3];
    return pose;
  }

  const DRIVE1_NK = spline([[13.4, [0.0, -0.05, 0.0]], [14.6, [0.02, 0.0, 0.02]], [15.9, [0.0, -0.12, -0.02]], [17.0, [0.05, 0.05, 0.0]], [18.7, [0.02, -0.1, 0.03]],
    [20.0, [0.0, -0.18, 0.0]], [21.8, [0.06, -0.05, 0.02]], [23.2, [0.0, -0.1, 0.0]]]);

  const DRIVE1_FACE = track([[13.4, X.calm], [14.5, X.talk], [16.0, X.wry, 0.3], [18.6, X.explain], [20.7, X.calm], [21.7, X.talk], [22.6, X.wry]]);

  function rightGesture(t, keys) {
    return handTrack(keys, t, 0.35);
  }

  function shotDrive1(t) {
    const turn = S(t * 0.7) * 0.06 + (t > 20 && t < 22.5 ? S((t - 20) * 2.6) * 0.18 : 0);
    const pose = driverPose(t, { nk: DRIVE1_NK(t), sp: [-0.1, -0.04 * S(t * 0.5), 0] });
    const ch = Sh.chestOf(pose);
    const onWheel = rimGrip(0.5, turn);
    const point = hand(M4.point(ch, [-0.24, 0.24, 0.62]), M4.dir(ch, [0.1, 0.15, 1]), M4.dir(ch, [0.3, -1, 0.1]), 'point');
    const wave = hand(M4.point(ch, [-0.3, 0.12, 0.5]), M4.dir(ch, [0.2, 0.4, 1]), M4.dir(ch, [0.6, 0.3, -0.2]), 'open');
    const R = rightGesture(t, [[13.4, onWheel], [16.9, point, 0.45], [17.8, wave, 0.4], [18.6, point, 0.35], [19.3, onWheel, 0.5]]);
    const L = rimGrip(2.55, turn);
    const st = sniperState(pose, { L, R });
    const h = headPos(st);
    const camera = cam(V3.add(V3.add(h, [0.86, -0.06, -0.14]), shake(t, 0.006, 5)), V3.add(h, [0.0, -0.13, -0.28]), 40);
    return {
      shot: 'drive1', kind: '3d', set: 'cab', env: ENV.cab, camera, sniper: st, face: sniperFace(t, DRIVE1_FACE(t), { look: [0.15, -0.05] }),
      props: [{ kind: 'wheel', M: wheelM(turn) }], scroll: t * 0.5, outsideBlur: 0.85
    };
  }

  const MIRROR_SPOT = [0.03, 0, 0.36];

  function mirrorPose(t) {
    const bend = ease(seg(t, 24.95, 25.55)) * (1 - ease(seg(t, 26.45, 27.0)));
    const look = ease(seg(t, 26.9, 27.3));
    const pose = standPose({ at: MIRROR_SPOT, yaw: PI, sp: [0.04 + bend * 0.75, 0, 0], nk: [bend * 0.3, look * -0.32, look * 0.04], spread: 0.08 });
    if (bend > 0) {
      pose.p = V3.add(pose.p, [0, -bend * 0.12, bend * 0.12]);
      ['kLw', 'kRw'].forEach(k => { pose[k] = V3.add(pose[k], [0, -bend * 0.1, -bend * 0.2]); });
    }
    return { pose, bend, look };
  }

  const MIRROR_FACE = track([[23.2, X.brush], [24.95, X.calm], [26.9, X.firm, 0.3], [27.25, X.disgust, 0.3], [28.2, X.grim, 0.4]]);

  function shotMirror(t) {
    const { pose, bend } = mirrorPose(t);
    const ch = Sh.chestOf(pose);
    const head = Sniper.solve(pose).head;
    const mouth = M4.point(head, [0.0, -0.08, 0.1]);
    const brush = S(t * 15) * 0.012;
    const brushing = hand(V3.add(mouth, [-0.02 + brush, -0.03, 0.02]), M4.dir(ch, [0.85, 0.2, -0.2]), M4.dir(ch, [0, -0.2, 1]), 'hold');
    const sink = hand(M4.point(ch, [-0.12, -0.2, 0.42]), M4.dir(ch, [0.3, -1, 0.3]), M4.dir(ch, [0.8, 0, 0.2]), 'hold');
    const wipe = hand(V3.add(mouth, [-0.05, -0.02, 0.05]), M4.dir(ch, [0.9, 0.3, 0.1]), M4.dir(ch, [0, 0, -1]), 'fist');
    const lower = hand(M4.point(ch, [-0.24, -0.3, 0.12]), M4.dir(ch, [0.05, -1, 0.2]), M4.dir(ch, [1, 0, 0.1]), 'hold');
    const R = handTrack([[23.2, brushing], [24.9, sink, 0.45], [26.6, lower, 0.4], [27.15, wipe, 0.3], [27.85, lower, 0.45]], t);
    const L = handTrack([[23.2, hand(M4.point(ch, [0.24, -0.35, 0.06]), M4.dir(ch, [0.05, -1, 0.1]), M4.dir(ch, [-1, 0, 0.1]), 'relax')], [25.0, hand(M4.point(ch, [0.2, -0.25, 0.4]), M4.dir(ch, [0, -1, 0.3]), M4.dir(ch, [-0.6, 0, 0.6]), 'flat'), 0.4], [26.6, hand(M4.point(ch, [0.24, -0.35, 0.06]), M4.dir(ch, [0.05, -1, 0.1]), M4.dir(ch, [-1, 0, 0.1]), 'relax'), 0.4]], t);
    const st = sniperState(pose, { L, R }, { opts: { noHat: true } });
    const hm = st.hands.R.M;
    const brushM = hm ? M4.chain(hm, M4.translate(0.0, -0.075, 0.02), M4.rotZ(PI / 2), M4.rotX(PI / 2), M4.translate(0, -0.06, 0)) : null;
    const push = ease(seg(t, 25.0, 26.7));
    const push2 = ease(seg(t, 26.9, 28.9));
    const close = t >= 26.9;
    const eye = close ? V3.lerp([0.2, 1.7, 0.42], [0.2, 1.69, 0.31], ease(seg(t, 26.9, 28.9))) : V3.lerp([0.74, 1.77, 0.98], [0.3, 1.66, 0.6], push);
    const at = close ? V3.lerp([0.12, 1.67, 0], [0.2, 1.66, 0], ease(seg(t, 26.9, 28.9))) : V3.lerp([-0.14, 1.66, 0], [0.0, 1.62, 0], push);
    const props = [{ kind: 'rifle', M: M4.chain(M4.translate(-0.12, 1.665, 1.69), M4.rotY(PI / 2)), virtual: true }];
    if (brushM && t < 28.0) props.push({ kind: 'toothbrush', M: brushM });
    return {
      shot: 'mirror', kind: '3d', set: 'mirror', env: ENV.mirror, camera: cam(eye, at, 38), sniper: st, face: sniperFace(t, MIRROR_FACE(t), { look: [t > 26.9 ? 0.28 : 0, 0.02] }),
      props, mirror: true, bend, noReal: close
    };
  }

  const FORT = { eye: [0, 1.65, 42] };

  function scopeCam(target, t, fov, kick) {
    const sway = shake(t, 0.035 * fov, 7);
    const k = kick || 0;
    return { eye: FORT.eye, at: V3.add(target, [sway[0], sway[1] + k * 0.6 * fov, 0]), fov, roll: 0, near: 8, far: 300 };
  }

  function recoil(t, shots) {
    let k = 0;
    shots.forEach(s => {
      const u = t - s;
      if (u >= 0 && u < 0.5) k = Math.max(k, Math.exp(-u * 9) * (u < 0.04 ? u / 0.04 : 1));
    });
    return k;
  }

  function blood(p, t0, t, dir, n) {
    const u = t - t0;
    if (u < 0 || u > 0.7) return null;
    return { p, u, dir: dir || [0, 0.3, -1], n: n || 22 };
  }

  const HEAVY_SPOT = [0.25, 0, -18.4];

  function scopeHeavy(t) {
    const hit = t >= 29.45;
    const k = ease(seg(t, 29.45, 29.75));
    const yaw = 0.15 * S(t * 3) + k * 0.25;
    const pose = { p: [HEAVY_SPOT[0], 1.02, HEAVY_SPOT[2]], fwd: [S(-0.05), 0, C(-0.05)], up: [0, 1, 0], sp: [lerp(-0.1, -0.35, k), 0.05, 0], nk: [lerp(-0.28 + 0.06 * S(t * 18), -0.7, k), yaw, lerp(0.05, -0.15, k)], eL: [0.85, -0.75, -0.15], eR: [-0.85, -0.75, -0.15] };
    pose.fLw = [HEAVY_SPOT[0] + 0.22, 0.075, HEAVY_SPOT[2] + 0.05];
    pose.fRw = [HEAVY_SPOT[0] - 0.22, 0.075, HEAVY_SPOT[2] + 0.05];
    pose.kLw = [HEAVY_SPOT[0] + 0.35, 0.6, HEAVY_SPOT[2] + 1.5];
    pose.kRw = [HEAVY_SPOT[0] - 0.35, 0.6, HEAVY_SPOT[2] + 1.5];
    const st = heavyState(pose, null);
    const face = hit ? heavyFace(t, HX.hit) : heavyFace(t, Object.assign({}, HX.laugh, { jaw: 0.55 + 0.25 * Math.abs(S(t * 19)) }));
    return { st, face };
  }

  function demoPath(t) {
    const keys = [[29.9, -1.0], [30.4, -0.2], [30.9, 0.6], [31.3, 1.1], [31.6, 1.6], [31.9, 1.2], [32.4, 0.6], [32.9, 0.3], [33.4, 0.1], [34.1, -0.2], [34.6, -0.45], [35.3, -0.6]];
    return spline(keys)(t);
  }

  function scopeDemo(t) {
    const x = demoPath(t);
    const z = -19.4;
    const v = (demoPath(t + 0.05) - demoPath(t - 0.05)) / 0.1;
    const yaw = v > 0.2 ? PI / 2 : v < -0.2 ? -PI / 2 : 0;
    let pose;
    if (t < 29.9) {
      pose = FP.stand('demo', -0.42, -19.8, 0.2, { hL: [0.28, 0.25, 0.25], hR: [-0.3, -0.2, 0.1] });
    } else if (t < 31.8) {
      pose = FP.run('demo', x, z, yaw, t * 2.2, { lean: 0.35, hL: [0.5, 0.35, 0.2], hR: [-0.5, 0.45, 0.1] });
    } else if (t < 32.9) {
      const k = seg(t, 31.8, 32.9);
      const up = V3.norm([S(k * PI * 2) * 0.8, C(k * PI * 2), 0.2]);
      pose = FP.airborne('demo', [x, 0.55 + S(k * PI) * 0.35, z], up, [0, 0, 1], { tuck: 0.8 });
    } else if (t < 34.6) {
      pose = FP.crouch('demo', x, z, 0.1, { depth: 0.25, hL: [0.15, 0.1, 0.4], hR: [-0.15, 0.0, 0.35] });
    } else {
      const k = seg(t, 34.6, 35.3);
      const up = V3.norm([-S(k * 2.6), C(k * 2.6), -0.3]);
      pose = FP.airborne('demo', [x, 1.0 + S(k * PI) * 0.5, z], up, [0, 0, 1], { tuck: 0.3 });
    }
    const a = { cls: 'demo', team: 'blu', pose };
    if (t < 29.9) a.itemL = 'bottle';
    if (t >= 32.9 && t < 34.6) {
      a.gun = 'grenade';
      const g = FP.aimGun('demo', 'grenade');
      Object.assign(pose, { hR: g.hR, hL: g.hL });
      a.gunM = g.gunM;
    }
    a.face = t > 29.6 ? { eyes: 'wide', brows: 'up', mouth: 'open', open: 0.8 } : {};
    return a;
  }

  const SCOPE_FOV = { heavy: 0.8, demo: 2.0 };

  function shotScope1(t) {
    const H = scopeHeavy(t);
    const demo = scopeDemo(t);
    const k = recoil(t, [29.45, 31.85, 34.62]);
    let target, fov;
    if (t < 29.85) {
      target = V3.add(Sh.headPos(H.st), [0.02, -0.04, 0]);
      fov = lerp(SCOPE_FOV.heavy, SCOPE_FOV.heavy * 1.1, seg(t, 28.9, 29.8));
    } else {
      const dm = window.FabCast.solve('demo', demo.pose);
      const p = M4.point(dm.chest, [0, 0.05, 0]);
      const swing = 1 - ease(seg(t, 29.85, 30.15));
      target = V3.add(p, [-1.2 * swing, 0.1, 0]);
      fov = 2.0;
    }
    const fx = { blood: [] };
    const b1 = blood(V3.add(Sh.headPos(H.st), [0, 0.05, 0]), 29.47, t, [0.3, 0.4, -1], 30);
    if (b1) fx.blood.push(b1);
    const b2 = blood([1.45, 1.2, -19.0], 31.88, t, [-0.6, 0.4, 0.4], 18);
    if (b2) fx.blood.push(b2);
    if (t > 34.6) {
      const dm = window.FabCast.solve('demo', demo.pose);
      const b3 = blood(M4.point(dm.head, [0, 0, 0]), 34.64, t, [0.2, 0.5, -1], 28);
      if (b3) fx.blood.push(b3);
    }
    const actors = t < 29.9 ? [demo] : [demo];
    return {
      shot: 'scope1', kind: '3d', set: 'fort', env: ENV.scope, camera: scopeCam(target, t, fov, k), scope: true,
      heavy: t < 30.2 ? H.st : null, heavyFace: H.face, heavyTeam: 'blu', actors, fx
    };
  }

  function shotNest(t) {
    const pose = sitPose({ seat: [0.25, 0.55, 0.55], yaw: PI + 0.25, sp: [0.25, 0.1, 0], nk: [0.05, -0.1, 0], foot: 0.45, floor: 0 });
    const ch = Sh.chestOf(pose);
    const rifle = M4.chain(M4.translate(...M4.point(ch, [-0.08, 0.38, 0.38])), M4.rotY(PI + 0.38), M4.rotX(0.04));
    const R = gripHand(Props.grip('R', rifle), 0.05);
    const L = gripHand(Props.grip('L', rifle), 0.05);
    const st = sniperState(pose, { L, R }, { rifle });
    const h = headPos(st);
    const camera = cam(V3.add(h, [-0.4, 0.0, 0.55]), V3.add(h, [0.18, -0.2, -3]), 48);
    const booms = [];
    [[36.35, [-6, 1.0, -28.5], 3.2], [36.62, [-3.8, 1.2, -29], 2.6], [36.9, [-1.5, 6.5, -34], 2.2], [37.05, [2.2, 1.0, -29], 2.4]].forEach(([t0, p, s]) => {
      if (t > t0 && t < t0 + 1.2) booms.push({ p, u: t - t0, s });
    });
    return { shot: 'nest', kind: '3d', set: 'nest', env: ENV.nest, envIn: ENV.nestIn, camera, sniper: st, face: sniperFace(t, X.squint), fx: { booms }, inside: true };
  }

  window.MsnAct1 = { shotRoad, shotBobble, shotDrive1, shotMirror, shotScope1, shotNest, driverPose, rimGrip, wheelM, scopeCam, recoil, blood, MIRROR_SPOT, FORT, SEAT };
})();
