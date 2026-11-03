(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Sh = window.MpyShots;
  const Pyro = window.MeetPyro;
  const Heads = window.MpyHeads;
  const Props = window.MpyProps;
  const FP = window.FabPose;
  const HeavyScript = window.MeetScript;
  const EngScript = window.EngScript;
  const { seg, spline, cam, ENV, standPose, walkPose, runPose, pyroState, holding, hipFlamer, chestOf, hand, headPos, heavyBody, heavyState, scoutState, heavyFace, scoutFace, spyFace, screamJaw, soldierJaw, frameAt, shake } = Sh;

  function burnFires(p, w, h, n, seed, extra) {
    return Object.assign({ p, w, h, n: n || 12, seed: seed || 1, s: Math.max(0.4, h * 0.45), d: 0.6 }, extra || {});
  }

  function shotTitle(t) {
    const fade = 1 - seg(t, 1.1, 2.35);
    const k = seg(t, 4.85, 6.17);
    const burn = k > 0 ? { x: 420, y: 262, r: lerp(14, 820, Math.pow(k, 4.2)) } : null;
    return { shot: 'title', kind: 'card', cards: [{ tex: 'title', alpha: 1 }], burn, dark: fade };
  }

  function walkerAt(t) {
    const z = lerp(2.4, -2.6, seg(t, 6.17, 11.18));
    const at = [0.5, 0, z];
    const phase = (2.4 - z) / 1.3;
    const pose = walkPose({ at, yaw: PI + 0.04, phase, stride: 0.33, lean: 0.06 });
    const ch = chestOf(pose);
    const G = M4.chain(ch, M4.translate(-0.3, -0.38, 0.06), M4.rotY(0.1), M4.rotX(0.95));
    return holding(pose, G, 'flamer', { L: hand(M4.point(ch, [0.3, -0.32, 0.08 + S(phase * PI * 2) * 0.15]), M4.dir(ch, [0.1, -1, 0.1]), M4.dir(ch, [-1, 0, 0]), 'relax'), eL: [0.7, -0.4, -0.3] });
  }

  function shotWalk(t) {
    const st = walkerAt(t);
    const u = t - 6.172;
    const eye = [-0.2 + u * 0.01, 0.2, -1.25];
    const wipe = 1 - seg(t, 6.17, 6.5);
    const fires = [burnFires([1.6, 0, 4.5], 0.8, 0.5, 8, 3), burnFires([-2.4, 0, 7], 1.2, 0.6, 10, 4), burnFires([3.5, 0, 12], 2, 1.2, 12, 5), burnFires([-6, 0, 18], 3, 2, 14, 6)];
    if (wipe > 0) fires.push(Object.assign(burnFires([0.2, 0.05, -0.2], 1.6, 0.9, 16, 9), { a: wipe * 0.8, s: 0.7 }));
    return {
      shot: 'walk', kind: '3d', set: 'desert', env: ENV.silhouette, camera: cam(eye, [0.3, 0.5, 4], 38), pyro: st,
      props: [{ kind: 'glasses', M: M4.chain(M4.translate(-0.12, 0.012, 0.9), M4.rotY(0.5), M4.rotX(-PI / 2 + 0.12)) }, { kind: 'debris', M: M4.translate(0.4, 0, 3.4) }, { kind: 'debris', M: M4.chain(M4.translate(-1.6, 0, 6), M4.rotY(1.2)) }],
      fires, embers: [{ p: [0.5, 0.1, 2.5], w: 6, h: 3.5, d: 6, n: 40 }], white: wipe * 0.2, whiteCol: [1, 0.7, 0.35, 1]
    };
  }

  const ROOM_CHAIR = [0, 0, -0.6];

  function seatedHeavy(t) {
    const p = [ROOM_CHAIR[0], 0.78, ROOM_CHAIR[2]];
    const nkY = spline([[11.2, 0.25], [14.2, 0.3], [15.6, 0.15], [16.5, 0.05], [17.2, -1.2], [18.2, -1.3], [19.9, -1.2]])(t);
    const shiver = t > 16.6 && t < 17.4 ? S(t * 70) * 0.04 : 0;
    const pose = heavyBody({ p, yaw: 1.25, sp: [0.08, -0.05 + shiver, 0], nk: [lerp(-0.05, 0.12, seg(t, 16.6, 17.4)), nkY, shiver * 0.5], legs: 'sit', eL: [0.9, -0.8, 0.1], eR: [-0.9, -0.8, 0.1] });
    const ch = window.MeetHeavy.solve(pose).chest;
    const L = hand(M4.point(ch, [0.22, -0.18, 0.42]), M4.dir(ch, [0.0, -0.5, 1]), M4.dir(ch, [-1, 0, 0]), 'relax');
    const R = hand(M4.point(ch, [-0.22, -0.2, 0.42]), M4.dir(ch, [0.0, -0.5, 1]), M4.dir(ch, [1, 0, 0]), 'relax');
    return heavyState(pose, { L, R });
  }

  function shotHeavy(t) {
    const st = seatedHeavy(t);
    const h = M4.point(st.m.head, [0, 0, 0]);
    const drift = seg(t, 11.18, 19.98);
    const eye = V3.add(h, [-0.56 + drift * 0.05, -0.04, 0.6]);
    const scared = { browInUp: 0.85, browUp: 0.2, frown: 0.45, lidU: 0.7, lidL: 0.3 };
    return {
      shot: 'heavy', kind: '3d', set: 'room', env: Object.assign({}, ENV.room, { points: [{ pos: V3.add(h, [-0.5, 0.1, 0.9]), col: [0.5, 0.48, 0.46], k: 1.2 }] }), camera: cam(eye, V3.add(h, [0.45, -0.2, -0.75]), 42), heavy: st, heavyFace: heavyFace(t, scared),
      props: [{ kind: 'plant', M: M4.chain(M4.translate(1.25, 0, -1.6), M4.scale(1.6, 1.6, 1.6)) }, { kind: 'chair', M: M4.chain(M4.translate(ROOM_CHAIR[0], 0, ROOM_CHAIR[2]), M4.rotY(1.25)) }]
    };
  }

  function shotStreet(t) {
    const pose = standPose({ at: [0.25, 0, 0.35], yaw: -0.15, sp: [0.04, 0, 0], nk: [0.05, -0.08, 0] });
    const G = hipFlamer(pose, { pitch: -0.2, yaw: 0.1 });
    const st = holding(pose, G, 'flamer');
    const u = t - 19.978;
    const run = u < 0.55 ? null : Sh.seg(t, 20.5, 24.4);
    const actors = [];
    if (u < 0.55) actors.push({ cls: 'scout', team: 'blu', pose: FP.stand('scout', -5.25, 18.2, PI / 2 - 0.3, { hR: [-0.2, 0.25, 0.3], eR: [-0.8, -0.3, 0.2] }) });
    else {
      const p0 = [-5.1, 0, 18.2], p1 = [2.6, 0, 27];
      const k = ease(run);
      const p = V3.lerp(p0, p1, k);
      const yaw = Math.atan2(p1[0] - p0[0], p1[2] - p0[2]);
      actors.push({ cls: 'scout', team: 'blu', pose: FP.run('scout', p[0], p[2], yaw, t * 2.4, {}) });
    }
    const doorK = 1 - seg(t, 20.4, 21.2) * 0.8;
    return {
      shot: 'street', kind: '3d', set: 'street', env: ENV.street, camera: cam([-0.12, 1.62, -0.55], [-1.8, 1.3, 16], 40), pyro: st, actors,
      props: [{ kind: 'barnDoor', M: M4.chain(M4.translate(-5.98, 0, 18.2), M4.rotY(PI / 2), M4.scale(1, 1, doorK)) }],
      glows: [{ p: [-5.7, 1.5, 18.2], s: 5, a: 0.55 * doorK + 0.15, tint: [1, 0.85, 0.6] }], smoke: [{ p: [0, 0.2, 22], w: 14, h: 4, s: 4, n: 8, a: 0.35, rate: 0.05, tint: [1, 0.8, 0.6] }],
      blur: 0.1
    };
  }

  const SCOUT_SEAT = [0.12, 0.0, -0.5];

  function seatedScout(t) {
    const p = [SCOUT_SEAT[0], 0.66, SCOUT_SEAT[2]];
    const look = spline([[24.48, -0.2], [25.4, 0.15], [26.3, -0.1], [27.0, 0.5], [27.6, -0.4], [28.3, 0.35], [28.9, 0.1], [29.6, 0.05], [30.9, 0.0]])(t);
    const tilt = spline([[24.48, 0.1], [26, 0.05], [27.5, -0.1], [29.4, 0.25], [30.9, 0.35]])(t);
    const pose = { p, fwd: [S(-0.75), 0, C(-0.75)], up: [0, 1, 0], sp: [0.18, look * 0.3, 0], nk: [tilt, look, 0], eL: [0.7, -0.5, -0.2], eR: [-0.7, -0.5, -0.2] };
    const fwd = pose.fwd, side = [C(-0.75), 0, -S(-0.75)];
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const hip = V3.add(p, V3.mul(side, k * 0.12));
      pose['f' + s + 'w'] = [hip[0] + fwd[0] * 0.5 + side[0] * k * 0.08, 0.08, hip[2] + fwd[2] * 0.5 + side[2] * k * 0.08];
      pose['k' + s + 'w'] = V3.add(hip, [fwd[0] * 1.5 + side[0] * k * 0.3, 0.6, fwd[2] * 1.5 + side[2] * k * 0.3]);
    });
    const ch = window.MeetScout.solve(pose).chest;
    let R, L;
    if (t < 26.3) {
      const wv = S(t * 9) * 0.05;
      R = hand(M4.point(ch, [-0.06 + wv, 0.32, 0.36]), M4.dir(ch, [0.05, 1, 0.15]), M4.dir(ch, [0, 0, 1]), 'open');
      L = hand(M4.point(ch, [0.22, -0.25, 0.25]), M4.dir(ch, [0, -1, 0.4]), M4.dir(ch, [-1, 0, 0]), 'relax');
    } else if (t < 29.2) {
      R = hand(M4.point(ch, [-0.2, -0.22, 0.3]), M4.dir(ch, [0, -1, 0.5]), M4.dir(ch, [1, 0, 0]), 'relax');
      L = hand(M4.point(ch, [0.2, -0.22, 0.3]), M4.dir(ch, [0, -1, 0.5]), M4.dir(ch, [-1, 0, 0]), 'relax');
    } else {
      const tug = S(t * 14) * 0.02;
      R = hand(M4.point(ch, [-0.02, 0.24 + tug, 0.2]), M4.dir(ch, [0.4, 0.3, -0.6]), M4.dir(ch, [0.5, -0.5, -0.6]), 'grip');
      L = hand(M4.point(ch, [0.06, 0.18 - tug, 0.22]), M4.dir(ch, [-0.4, 0.3, -0.6]), M4.dir(ch, [-0.5, -0.5, -0.6]), 'claw');
    }
    return scoutState(pose, { L, R });
  }

  function shotScout(t) {
    const st = seatedScout(t);
    const h = window.MeetScout.headPoint(st.m, [0, 0, 0]);
    const eye = V3.add(h, [-0.12, -0.1, 0.62]);
    const ex = t < 26.3 ? { browDown: 0.3, frown: 0.2, wide: 0.3 } : t < 29.2 ? { browInUp: 0.6, browUp: 0.4, lidU: 0.85, frown: 0.25 } : { browDown: 0.5, sneer: 0.3, frown: 0.3, wide: 0.4 };
    return {
      shot: 'scout', kind: '3d', set: 'room', env: Object.assign({}, ENV.room, { points: [{ pos: [0.7, 1.4, 0.5], col: [0.62, 0.6, 0.58], k: 0.8 }] }), camera: cam(eye, V3.add(h, [0.12, -0.17, 0]), 44),
      scout: st, scoutFace: scoutFace(t, ex), props: [{ kind: 'plant', M: M4.chain(M4.translate(-1.1, 0, -2.0), M4.scale(1.4, 1.4, 1.4)) }, { kind: 'chair', M: M4.chain(M4.translate(SCOUT_SEAT[0], 0, SCOUT_SEAT[2]), M4.rotY(-0.75)) }]
    };
  }

  function shotBolt(t) {
    const k = seg(t, 30.905, 31.447);
    const p = [SCOUT_SEAT[0] - k * 0.6, 0.66 + k * 0.5, SCOUT_SEAT[2] + k * 0.9];
    const pose = { p, fwd: V3.norm([-0.6, 0.1, 1]), up: [0, 1, 0], sp: [0.4, 0.3, 0], nk: [-0.2, 0.2, 0], fLw: [p[0] + 0.1, 0.3, p[2] - 0.2], kLw: [p[0], 1, p[2] + 1], fRw: [p[0] - 0.1, 0.1, p[2] - 0.3], kRw: [p[0], 1, p[2] + 1] };
    const ch = window.MeetScout.solve(pose).chest;
    const R = hand(M4.point(ch, [-0.35, 0.3, 0.35]), M4.dir(ch, [-0.3, 0.5, 1]), M4.dir(ch, [0, -1, 0]), 'fist');
    const L = hand(M4.point(ch, [0.35, -0.1, -0.1]), M4.dir(ch, [0.3, -0.5, -1]), M4.dir(ch, [0, 1, 0]), 'fist');
    const st = scoutState(pose, { L, R });
    return {
      shot: 'bolt', kind: '3d', set: 'room', env: Object.assign({}, ENV.room, { key: { dir: [0.3, -0.3, -1], col: [1.3, 1.25, 1.2] }, ambTop: [0.3, 0.3, 0.32] }), camera: cam(V3.add(p, [0.1, 0.34, 0.34]), V3.add(p, [0, 0.28, 0]), 54, -k * 0.3),
      scout: st, scoutFace: scoutFace(t, { browUp: 0.9, lidU: 0.95, wide: 0.6, jaw: 0.5 }), blur: 0.55 + k * 0.3
    };
  }

  function shotTumble(t) {
    const k = seg(t, 31.447, 32.365);
    const eye = [lerp(-0.2, 0.2, k), lerp(1.1, 0.25, ease(k)), lerp(0.6, 0.2, k)];
    const at = [lerp(0.2, 0.9, k), lerp(1.2, 0.2, k), -2.0];
    return {
      shot: 'tumble', kind: '3d', set: 'room', env: ENV.room, camera: cam(eye, at, 55, k * 2.4 + S(k * 9) * 0.3),
      props: [{ kind: 'plant', M: M4.chain(M4.translate(-1.25, 0, -1.45), M4.scale(1.5, 1.5, 1.5)) }, { kind: 'chair', M: M4.chain(M4.translate(SCOUT_SEAT[0], 0.1 * k, SCOUT_SEAT[2]), M4.rotY(-0.75), M4.rotZ(k * 1.4)) }],
      blur: 0.85
    };
  }

  function shotSpyHide(t) {
    const H = M4.chain(M4.translate(-0.25, 1.62, -1.25), M4.rotY(0.55), M4.rotX(0.08));
    const bust = M4.chain(M4.translate(-0.26, 1.48, -1.3), M4.rotY(0.4));
    return {
      shot: 'spyhide', kind: '3d', set: 'doorway', env: ENV.door, camera: cam([0.05, 1.55, -0.2], [-0.25, 1.6, -1.25], 40),
      guests: [{ kind: 'spy', team: 'blu', H, bust, face: { lidU: 0.85, browUp: 0.6, look: [0.35, 0] } }],
      glows: [{ p: [0.6, 1.4, -1.35], s: 2.2, a: 0.5, tint: [1, 0.8, 0.5] }]
    };
  }

  function shotPilot(t) {
    const u = t - 32.532;
    const slide = ease(seg(t, 32.53, 34.2));
    const G = M4.chain(M4.translate(lerp(-1.1, -0.55, slide), 1.08, -0.2), M4.rotY(PI / 2 - 0.08), M4.rotX(0.05));
    const muzzle = M4.point(G, [0, 0.1, 1.02]);
    const pilot = M4.point(G, [0, 0.015, 1.03]);
    const k = seg(t, 33.0, 36.4);
    const eye = V3.add(pilot, [lerp(-0.55, -0.05, ease(k)), lerp(0.12, 0.06, k), lerp(0.75, 0.42, ease(k))]);
    const at = V3.add(V3.lerp(M4.point(G, [0, 0.1, 0.55]), muzzle, ease(k)), [0, -0.02, 0]);
    const dark = Math.max(seg(t, 36.4, 37.04), 0);
    return {
      shot: 'pilot', kind: '3d', set: 'doorway', env: ENV.door, camera: cam(eye, at, lerp(42, 34, k)), props: [{ kind: 'flamer', M: G }], pilots: [{ p: V3.add(pilot, [0, 0.012, 0]), s: 0.085 }],
      glows: [{ p: [0.6, 1.4, -1.35], s: 2.2, a: 0.3, tint: [1, 0.8, 0.5] }], dark, blur: 0.08 + u * 0
    };
  }

  function shotSpy(t) {
    const u = t - 37.04;
    const nod = spline([[37.0, 0.0], [38.7, 0.04], [40.4, -0.03], [42.0, 0.05], [42.9, 0.02]])(t);
    const H = M4.chain(M4.translate(-0.12, 1.62, 0), M4.rotY(PI / 2 - 0.12 + S(u * 0.6) * 0.02), M4.rotX(nod));
    const bust = M4.chain(M4.translate(-0.16, 1.47, -0.02), M4.rotY(PI / 2 - 0.3));
    const handP = [0.2, 1.34 + S(u * 0.9) * 0.01, 0.06];
    const glove = M4.chain(M4.translate(handP[0], handP[1], handP[2]), M4.rotY(-0.5), M4.rotX(PI), M4.rotZ(0.1), M4.scale(0.95, 0.95, 0.95));
    const tip = [handP[0] - 0.005, handP[1] + 0.2, handP[2] + 0.01];
    const cigM = M4.chain(M4.translate(tip[0], tip[1] - 0.08, tip[2]), M4.rotX(-PI / 2));
    const fadeIn = 1 - seg(t, 37.12, 37.8);
    const smoke = [{ p: [tip[0], tip[1] + 0.02, tip[2]], w: 0.03, h: 0.5, s: 0.09, n: 7, a: 0.22, rate: 0.12, drift: 0.05, d: 0.03, noFog: true, tint: [2.4, 2.4, 2.5] }];
    return {
      shot: 'spy', kind: '3d', set: 'spyroom', env: ENV.spy, camera: cam([0.07, 1.58, 0.64], [0.04, 1.56, 0], 33),
      guests: [{ kind: 'spy', team: 'red', H, bust, face: spyFace(t, {}), glove, glovePose: 'hold' }],
      props: [{ kind: 'cig', M: cigM }], glows: [{ p: tip, s: 0.06, a: 0.9, tint: [1, 0.45, 0.15] }], smoke, dark: fadeIn
    };
  }

  function infernoPyro(t, o) {
    const pose = standPose({ at: o.at, yaw: o.yaw, sp: o.sp || [0.12, 0, 0], nk: o.nk || [-0.2, 0, 0], spread: 0.12, fL: [0, 0.18], fR: [0, -0.12] });
    const G = hipFlamer(pose, { pitch: o.pitch || 0, yaw: o.gunYaw || 0.05, y: -0.1 });
    return holding(pose, G, 'flamer');
  }

  function streamFrom(st, len, grow) {
    const G = st.weapon.M;
    return { from: M4.point(G, [0, 0.1, 1.05]), dir: M4.dir(G, [0, 0, 1]), len, grow: grow === undefined ? 1 : grow };
  }

  function shotNozzle(t) {
    const st = infernoPyro(t, { at: [0, 0, 0], yaw: PI / 2, pitch: 0.1, nk: [-0.1, 0.3, 0] });
    const G = st.weapon.M;
    const tipP = M4.point(G, [0, 0.1, 0.75]);
    const g = seg(t, 42.95, 43.4);
    const glare = seg(t, 43.71, 44.29);
    return {
      shot: 'nozzle', kind: '3d', set: 'inferno', env: ENV.fire, camera: cam(V3.add(tipP, [-0.55, -0.12, 0.55]), V3.add(tipP, [0.35, 0.05, 0]), 40), pyro: st,
      streams: [Object.assign(streamFrom(st, 3.2, g), { width: 1.3 })], fires: [burnFires([4, 0, 3], 4, 3, 16, 31)], white: glare * 0.75, whiteCol: [1, 0.85, 0.55, 1]
    };
  }

  function shotInferno(t) {
    const u = t - 44.294;
    const st = infernoPyro(t, { at: [-0.6, 0, 3.0], yaw: 0.35 + S(u * 1.2) * 0.1, pitch: 0.55, nk: [-0.35, 0, 0], sp: [0.0, 0.1, 0] });
    const fires = [];
    for (let i = 0; i < 9; i++) fires.push(burnFires([-6 + i * 1.6, 0, 8 + (i % 3) * 1.5], 1.6, 3 + (i % 4), 22, 40 + i, { smoke: i % 3 === 0, s: 0.9 + (i % 3) * 0.3 }));
    fires.push(burnFires([3, 2, 9], 4, 5, 18, 61));
    return {
      shot: 'inferno', kind: '3d', set: 'inferno', env: ENV.fire, camera: cam([0.2 - u * 0.04, 0.8, 0.65], [-0.4, 2.0, 5], 50), pyro: st,
      streams: [Object.assign(streamFrom(st, 4.2), { width: 1.4 })], fires, embers: [{ p: [0, 0.5, 6], w: 14, h: 8, n: 60 }], smoke: [{ p: [0, 6, 12], w: 14, h: 10, s: 6, n: 8, a: 0.5 }]
    };
  }

  function shotTurn(t) {
    const u = t - 47.13;
    const turn = ease(seg(t, 47.4, 48.6));
    const pose = standPose({ at: [0, 0, 0], yaw: lerp(1.2, 0.55, turn), sp: [0.1, 0.35, 0], nk: [-0.05, lerp(0.4, -0.25, turn), lerp(0, -0.12, seg(t, 48.6, 49.4))] });
    const G = hipFlamer(pose, { pitch: -0.25, yaw: 0.7, x: -0.05, y: -0.02, z: 0.3 });
    const st = holding(pose, G, 'flamer');
    const lens = Pyro.lensWorld(st.m, 1);
    const push = ease(seg(t, 49.15, 50.58));
    const h = headPos(st, [0, 0, 0]);
    const eye0 = V3.add(h, [-0.25, -0.3, 1.5]);
    const eye1 = V3.add(lens.c, V3.mul(lens.n, 0.06));
    const eye = V3.lerp(eye0, eye1, push * push);
    const at = V3.lerp(V3.add(h, [-0.12, -0.32, 0]), lens.c, push);
    return {
      shot: 'turn', kind: '3d', set: 'inferno', env: ENV.fireFront, camera: cam(eye, at, lerp(40, 34, push)), pyro: st,
      fires: [burnFires([-2.5, 0, -3], 2.4, 2.6, 16, 71), burnFires([2.4, 0, -3.5], 3, 3, 16, 72), burnFires([0, 0, -6], 5, 4, 18, 73)], embers: [{ p: [0, 0.5, -1], w: 5, h: 3, n: 40 }],
      white: u < 0.04 ? 0.8 : 0, whiteCol: [1, 0.8, 0.5, 1], blurFar: 0.9, fxFirst: true
    };
  }

  function shotLensGlow(t) {
    const k = seg(t, 52.0, 53.26);
    const e = k * k;
    const w = 30 + e * 460;
    const y = lerp(96, 270, e);
    return { shot: 'glowIn', kind: 'card', cards: [], sweeps: [{ x: lerp(462, 236, e), y, w, h: w, a: 0.35 + k * 0.65 }, { x: lerp(498, 724, e), y, w, h: w, a: 0.35 + k * 0.65 }] };
  }

  function fireArena(seed, extra) {
    const fires = [];
    for (let i = 0; i < 8; i++) fires.push(burnFires([-5 + i * 1.4, 0, 3 + (i % 3)], 1.4, 2 + (i % 3), 12, seed + i, extra));
    return fires;
  }

  function shotRealAxe(t) {
    const u = t - 75.742;
    const swing = ease(seg(t, 75.78, 76.25));
    const pose = standPose({ at: [0.6, 0, 0], yaw: -PI / 2 - 0.2, sp: [lerp(-0.2, 0.5, swing), lerp(-0.5, 0.4, swing), 0], nk: [0.1, 0, 0], spread: 0.15 });
    const ch = chestOf(pose);
    const G = M4.chain(ch, M4.translate(lerp(-0.25, -0.05, swing), lerp(0.55, -0.05, swing), lerp(-0.1, 0.45, swing)), M4.rotX(lerp(-0.6, 2.0, swing)));
    const st = holding(pose, G, 'axe');
    st.opts = { tint: [0.24, 0.2, 0.19] };
    const hp = heavyBody({ p: [-0.55, 0.95, 0.1], yaw: PI / 2 - 0.3, sp: [0.45, 0, 0.2], nk: [0.3, 0, 0], legs: { fLw: [-0.4, 0.075, -0.1], fRw: [-0.7, 0.075, 0.3], kLw: [0.5, 0.6, -0.1], kRw: [0.5, 0.6, 0.3] }, hL: [0.3, 0.2, 0.3], hR: [-0.3, 0.3, 0.3] });
    return {
      shot: 'realaxe', kind: '3d', set: 'inferno', env: Object.assign({}, ENV.backlit, { key: { dir: [0, -0.25, -1], col: [0.8, 0.48, 0.24] }, points: [], ambTop: [0.035, 0.025, 0.02], ambBot: [0.03, 0.02, 0.015], rim: [1.6, 0.8, 0.3] }), camera: cam([0.1, 1.25, 3.0], [0, 1.25, 0], 44), pyro: st, heavy: heavyState(hp, null, { team: 'blu', opts: { tint: [0.24, 0.2, 0.19] } }), heavyFace: heavyFace(t, { browInUp: 1, wide: 0.8, jaw: 0.8 }),
      fires: fireArena(80, { smoke: true }).map(f => Object.assign(f, { p: [f.p[0], f.p[1], -f.p[2] + 1] })).concat([burnFires([-0.6, 0.4, 0.1], 0.9, 1.5, 12, 88), burnFires([0, 0, -2.5], 6, 3.5, 30, 89)]), white: u < 0.05 ? 0.4 : 0, blur: 0.15
    };
  }

  function shotRealFlare(t) {
    const u = t - 83.499;
    const pose = standPose({ at: [0.8, 0, 0], yaw: -PI / 2 + 0.25, sp: [0.05, -0.3, 0], nk: [-0.05, 0.25, 0], spread: 0.12 });
    const ch = chestOf(pose);
    const G = M4.chain(ch, M4.translate(-0.15, 0.25, 0.6), M4.rotY(-0.3), M4.rotX(-0.35));
    const st = holding(pose, G, 'flare', { L: hand(M4.point(ch, [0.3, -0.25, 0.1]), M4.dir(ch, [0, -1, 0]), M4.dir(ch, [-1, 0, 0]), 'fist') });
    st.opts = { tint: [0.24, 0.2, 0.19] };
    const recoil = ease(seg(t, 83.5, 84.4));
    const sc = FP.stand('scout', -0.9 - recoil * 0.4, 0.2, PI / 2 - 0.4, { sp: [-0.3 - recoil * 0.3, 0.3, 0.2], nk: [-0.5, 0, 0], hL: [0.25, 0.45, 0.25], hR: [-0.25, 0.5, 0.2], eL: [0.8, 0.2, 0], eR: [-0.8, 0.2, 0] });
    return {
      shot: 'realflare', kind: '3d', set: 'inferno', env: Object.assign({}, ENV.backlit, { key: { dir: [0, -0.25, -1], col: [0.8, 0.48, 0.24] }, points: [], ambTop: [0.035, 0.025, 0.02], ambBot: [0.03, 0.02, 0.015], rim: [1.6, 0.8, 0.3] }), camera: cam([0, 1.3, 3.4], [-0.05, 1.3, 0], 42), pyro: st, actors: [{ cls: 'scout', team: 'blu', pose: sc, tint: [0.2, 0.17, 0.16] }],
      fires: fireArena(90, { smoke: true }).map(f => Object.assign(f, { p: [f.p[0], f.p[1], -f.p[2] + 1] })).concat([burnFires([-1.0, 0.6, 0.2], 0.5, 1.4, 12, 98), burnFires([0, 0, -2.5], 6, 3.5, 30, 99)]), streams: u < 0.25 ? [{ from: M4.point(G, [0, 0.05, 0.25]), dir: M4.dir(G, [0, 0, 1]), len: 1.6 * seg(t, 83.5, 83.75), width: 0.3, n: 10 }] : [], blur: 0.12
    };
  }

  function shotRealMedic(t) {
    const u = t - 91.591;
    const H = M4.chain(M4.translate(0.0 + S(u * 2) * 0.01, 1.62, -0.05), M4.rotY(0.25 + S(u * 1.5) * 0.08), M4.rotX(0.12));
    const bust = M4.chain(M4.translate(0.0, 1.47, -0.08), M4.rotY(0.2));
    return {
      shot: 'realmedic', kind: '3d', set: 'interior', env: ENV.shedIn, camera: cam([0.36, 1.56, 0.62], [0.02, 1.56, -0.05], 38), guests: [{ kind: 'medic', team: 'blu', H, bust, face: { lidU: 0.9, browUp: 0.8, browInUp: 0.6, jaw: 0.15, look: [0.3, 0] } }],
      sprites: [{ M: M4.chain(M4.translate(0.34, 1.4, 0.18), M4.rotY(0.25), M4.scale(0.36, 2.8, 1)), tex: 'shedWood', lit: true, fog: true, tint: [0.5, 0.45, 0.4] }, { M: M4.chain(M4.translate(-0.32, 1.4, 0.2), M4.rotY(0.25), M4.scale(0.36, 2.8, 1)), tex: 'shedWood', lit: true, fog: true, tint: [0.5, 0.45, 0.4] }],
      glows: [{ p: [0.05, 1.55, 0.3], s: 0.6, a: 0.12, tint: [1, 0.7, 0.4] }]
    };
  }

  function shotRealShed(t) {
    const u = t - 93.426;
    const pose = standPose({ at: [-1.3, 0, 2.2], yaw: 0.6, sp: [0.15, 0.1, 0], nk: [-0.1, 0, 0] });
    const G = hipFlamer(pose, { pitch: 0.05 });
    const st = holding(pose, G, 'flamer');
    st.opts = { tint: [0.3, 0.25, 0.23] };
    const grow = seg(t, 93.6, 94.2);
    return {
      shot: 'realshed', kind: '3d', set: 'shed', env: ENV.backlit, camera: cam([-1.75, 1.5, 3.4], [0.35, 1.2, 0.9], 44), pyro: st,
      streams: [Object.assign(streamFrom(st, 2.4, grow), { width: 1.2 })], fires: [burnFires([0.3, 0.2, 1.1], 1.0 + grow, 1.2 + grow * 1.5, 18, 101, { smoke: true })]
    };
  }

  function interiorFires(seed) {
    return [burnFires([-3, 0, -3], 3, 2.6, 16, seed), burnFires([2.5, 0, -2.8], 2.4, 2.4, 14, seed + 1), burnFires([-4.5, 0, 1], 1.5, 2.8, 14, seed + 2, { smoke: true }), burnFires([3.6, 0, 1.5], 1.4, 2.2, 12, seed + 3)];
  }

  function lyingDemo(t, reach) {
    const p = [0.45, 0.32, 0.1];
    const pose = { p, fwd: V3.norm([-0.25, -0.92, 0.3]), up: V3.norm([-0.9, 0.3, 0.25]), sp: [-0.3, 0.2, 0], nk: [-0.6, 0.3, 0], fLw: [1.3, 0.075, 0.2], fRw: [1.25, 0.075, -0.25], kLw: [1, 0.8, 1], kRw: [1, 0.8, -1] };
    const ch = window.MeetDemoman.solve(pose).chest;
    const shake = S(t * 40) * 0.02;
    const R = hand(V3.add(M4.point(ch, [-0.1, 0.55, 0.45]), [0, reach + shake, 0]), [0, 1, 0.1], [0.3, 0, 1], 'open');
    const L = hand([0.15, 0.08, 0.4], [-0.5, 0, 0.6], [0, -1, 0], 'claw');
    const p2 = Object.assign({}, pose, { hRw: R.target, hLw: L.target, eR: [-0.8, -0.3, 0], eL: [0.8, -0.3, 0] });
    const m = window.MeetDemoman.solve(p2);
    return { m, hands: { R: { pose: 'open', M: window.MeetDemoman.handBasis(m.pts.wristR, R.fingers, R.palm) }, L: { pose: 'claw', M: window.MeetDemoman.handBasis(m.pts.wristL, L.fingers, L.palm) } } };
  }

  function shotRealDemo(t) {
    const u = t - 107.982;
    const reach = seg(t, 108.3, 108.9) * 0.15;
    const d = lyingDemo(t, reach);
    const face = { smileL: 0, smileR: 0, wide: 0.9, round: 0.2, frown: 0.5, browUp: 0.9, jaw: screamJaw(t, 0.55), lidU: 0.9 };
    const sol = FP.stand('soldier', 0.9, -1.9, 0.6, { hL: [0.25, 0.4, 0.3], hR: [-0.25, 0.45, 0.3] });
    return {
      shot: 'realdemo', kind: '3d', set: 'interior', env: ENV.interior, camera: cam([-1.25, 0.48, 0.95], [0.5, 0.85, -0.9], 46), demo: Object.assign(d, { face, opts: {}, team: 'blu' }),
      actors: [{ cls: 'soldier', team: 'blu', pose: sol }], fires: interiorFires(111).concat([burnFires([0.9, 0.5, -1.9], 0.6, 1.4, 12, 119)]), embers: [{ p: [0, 0.5, -1], w: 6, h: 3, n: 40 }],
      blur: u < 0.17 ? 0.8 : 0.1
    };
  }

  function shotRealSniper(t) {
    const u = t - 109.442;
    const p = [lerp(-0.4, 0.4, seg(t, 109.44, 110.07)), 0, lerp(-0.2, 0.9, seg(t, 109.44, 110.07))];
    const pose = FP.run('sniper', p[0], p[2], 0.7, t * 2.2, { hL: [0.3, 0.45, 0.2], hR: [-0.25, 0.55, 0.15] });
    return {
      shot: 'realsniper', kind: '3d', set: 'interior', env: ENV.interior, camera: cam([1.1, 1.2, 2.9], [0.1, 1.3, 0.2], 40),
      actors: [{ cls: 'sniper', team: 'blu', pose, hat: 'none', headScale: 0.001, tint: [0.72, 0.85, 1.15], guestHead: 'sniper', guestFace: { jaw: screamJaw(t, 0.6), browUp: 0.9, wide: 0.8, lidU: 0.95 } }],
      fires: interiorFires(121).concat([burnFires([p[0], 1.1, p[2] - 0.2], 0.5, 0.9, 12, 129)]), blur: u > 0.33 ? 0.7 : 0.12
    };
  }

  function shotRealFall(t) {
    const u = t - 110.068;
    if (t < 110.65) {
      return { shot: 'realfall', kind: '3d', set: 'interior', env: ENV.interior, camera: cam([0.5, 1.6 - u, 1.5], [0, 1.0, -1], 55, u * 2), fires: interiorFires(131), blur: 0.9, white: t > 110.61 ? 0.5 : 0 };
    }
    const hp = heavyBody({ p: [0, 0.42, 0], yaw: 0.3, up: V3.norm([0, 0.4, -1]), fwd: V3.norm([0.2, -0.9, -0.4]), sp: [-0.4, 0, 0], nk: [-0.9, 0, 0], legs: { fLw: [0.2, 0.075, -1.2], fRw: [-0.3, 0.075, -1.1], kLw: [0, 1, -1], kRw: [0, 1, -1] }, hL: [0.3, 0.6, 0.6], hR: [-0.4, 0.1, 0.5] });
    return {
      shot: 'realfall', kind: '3d', set: 'interior', env: ENV.interior, camera: cam([0.35, 0.95, -1.9], [0, 0.65, 0], 44), heavy: heavyState(hp, null, { team: 'blu' }), heavyFace: heavyFace(t, { browInUp: 1, wide: 0.9, jaw: screamJaw(t, 0.6) }),
      fires: interiorFires(141), blur: 0.2
    };
  }

  function shotRealCrawl(t) {
    const u = t - 110.943;
    const x = lerp(0.2, -0.2, seg(t, 110.94, 112.32));
    const pose = FP.prone ? FP.prone('sniper', x, 0, -PI / 2, { t: u }) : FP.stand('sniper', x, 0, -PI / 2, {});
    return {
      shot: 'realcrawl', kind: '3d', set: 'interior', env: ENV.interior, camera: cam([0.2, 0.55, 1.6], [0, 0.3, 0], 46),
      actors: [{ cls: 'sniper', team: 'blu', pose, headScale: 0.001, guestHead: 'sniper', guestFace: { jaw: screamJaw(t, 0.4), browInUp: 0.9, lidU: 0.6 } }], fires: interiorFires(151), embers: [{ p: [0, 0.3, 0], w: 4, h: 2, n: 30 }]
    };
  }

  function shotRealJar(t) {
    const u = t - 112.32;
    const H = M4.chain(M4.translate(0.05, 0.32, 0), M4.rotY(-0.9), M4.rotX(-0.25), M4.rotZ(-0.35 + S(u * 1.3) * 0.04));
    const bust = M4.chain(M4.translate(0.22, 0.2, -0.05), M4.rotY(-0.9), M4.rotZ(-1.2));
    return {
      shot: 'realjar', kind: '3d', set: 'interior', env: ENV.interior, camera: cam([-0.42, 0.46, 0.78], [0.1, 0.3, 0], 40),
      guests: [{ kind: 'sniper', team: 'blu', H, bust, face: { jaw: 0.25 + screamJaw(t, 0) * 0.4, browInUp: 1, browUp: 0.4, lidU: 0.75, look: [-0.2, 0.25] } }],
      fires: [burnFires([-1.6, 0, -1.4], 1.2, 1.6, 14, 161), burnFires([1.0, 0, -1.8], 1.4, 1.8, 14, 162)]
    };
  }

  function shotRealTank(t) {
    const u = t - 114.489;
    const pose = standPose({ at: [0, 0, 0], yaw: PI + 0.1, sp: [0.25, 0, 0], nk: [-0.25, 0, 0], spread: 0.14 });
    const G = hipFlamer(pose, { pitch: -0.25, yaw: -0.05, y: -0.06, z: 0.3 });
    const st = holding(pose, G, 'flamer');
    const muzzle = M4.point(G, [0, 0.1, 1.02]);
    const k = ease(seg(t, 114.53, 116.4));
    const eye = V3.add(muzzle, [lerp(-0.25, 0.05, k), lerp(-0.55, -0.04, k), lerp(-0.4, -0.3, k)]);
    const at = V3.lerp(headPos(st, [0, -0.5, 0]), muzzle, k * 0.7);
    return {
      shot: 'realtank', kind: '3d', set: 'interior', env: ENV.interior, camera: cam(eye, at, lerp(60, 40, k)), pyro: st, pilots: [{ p: M4.point(G, [0, 0.015, 1.04]), s: 0.05 }],
      fires: interiorFires(171), embers: [{ p: [0, 0.5, 0], w: 5, h: 3, n: 40 }], streams: t > 116.4 ? [Object.assign(streamFrom(st, 2.5, seg(t, 116.4, 116.53)), { width: 1.5 })] : []
    };
  }

  function shotRealWhite(t) {
    return { shot: 'realwhite', kind: 'card', cards: [], white: 1, whiteCol: [1, 0.97, 0.84, 1] };
  }

  function shotRealMask(t) {
    const u = t - 116.699;
    const tilt = spline([[116.7, 0.0], [117.2, 0.25], [117.8, 0.42], [118.7, 0.5]])(t);
    const pose = standPose({ at: [0, 0, 0], yaw: PI - 0.4, sp: [0.05, 0, 0], nk: [-0.05, 0.1, tilt] });
    const G = hipFlamer(pose, {});
    const st = holding(pose, G, 'flamer');
    const h = headPos(st, [0, 0, 0]);
    return {
      shot: 'realmask', kind: '3d', set: 'interior', env: Object.assign({}, ENV.interior, { key: { dir: [0.4, -0.2, 0.9], col: [1.8, 1.0, 0.45] } }), camera: cam(V3.add(h, [-0.18, -0.02, -0.5]), V3.add(h, [0, -0.04, 0]), 34), pyro: st,
      fires: [burnFires([1.2, 0.5, 1.5], 2.5, 2.5, 16, 181), burnFires([-1.5, 0.5, 2.2], 2.5, 2.5, 16, 182)], blurMid: 0.0, blur: 0.06, white: u < 0.1 ? 0.6 * (1 - u / 0.1) : 0, whiteCol: [1, 0.8, 0.4, 1], lensTint: [1.6, 1.0, 0.6]
    };
  }

  function lineupPyro(t) {
    const pose = standPose({ at: [-2.75, 0, 0.25], yaw: 0.35, sp: [0.06, 0.2, 0], nk: [-0.05, -0.15, 0.12] });
    const G = hipFlamer(pose, { pitch: -0.12, yaw: 0.5, y: -0.05, z: 0.3 });
    return holding(pose, G, 'flamer');
  }

  function lineupBase(t) {
    const es = EngScript.stage(79.5);
    const actors = (es.actors || []).filter(a => a.cls !== 'pyro' && a.cls !== 'engineer');
    return { es, actors };
  }

  function shotLineup(t, which) {
    const { es, actors } = lineupBase(t);
    const py = lineupPyro(t);
    const h = headPos(py, [0, 0, 0]);
    let camera, logo = null, blur = 0.1;
    if (which === 'endLens') {
      const lens = Pyro.lensWorld(py.m, 1);
      const k = seg(t, 118.7, 119.41);
      camera = cam(V3.add(lens.c, V3.mul(lens.n, lerp(0.05, 0.11, k))), V3.add(lens.c, [-0.02, 0, 0]), 40);
      blur = 0.3;
    } else if (which === 'endA') {
      camera = cam(V3.add(h, [0.12, -0.03, 0.55]), V3.add(h, [-0.03, -0.04, 0]), 34);
      blur = 0.35;
    } else if (which === 'endB') {
      camera = cam(V3.add(h, [0.55, -0.25, 1.2]), V3.add(h, [0.42, -0.25, 0]), 40);
      blur = 0.2;
    } else if (which === 'endC') {
      camera = cam([-1.45, 0.95, 1.7], [-1.35, 1.25, 0.1], 50);
      const flip = ease(seg(t, 120.95, 121.2));
      logo = { flip, y: (1 - flip) * -0.15, emblem: 0, emblemFly: false };
    } else {
      camera = cam([0.35, 1.25, 3.3], [0.35, 1.35, 0], 50);
      const fly = clamp((t - 121.996) / 0.2, 0, 1);
      logo = { flip: 1, y: 0, emblem: t < 121.996 ? 0 : fly, emblemFly: t >= 121.996 && t < 122.2 };
    }
    return {
      shot: which, kind: 'lineup', env: es.env, camera, heavy: es.heavy, heavyFace: es.heavyFace, actors, pyro: py,
      engineer: es.eng ? { m: es.eng.m, hands: es.eng.hands, face: es.face, wrench: es.eng.wrench } : null, logo, blur
    };
  }

  function soldierState(t, o) {
    const S0 = window.MeetSoldier;
    const pose = standPose({ at: o.at, yaw: o.yaw, sp: o.sp, nk: o.nk });
    pose.p[1] += 0.03;
    const ch = S0.solve(pose).chest;
    const L = hand(M4.point(ch, [0.06, 0.12, 0.38]), M4.dir(ch, [-0.6, 0.2, 0.6]), M4.dir(ch, [0, 1, 0.2]), 'hold');
    const R = hand(M4.point(ch, [-0.06, 0.1, 0.36]), M4.dir(ch, [0.6, 0.2, 0.6]), M4.dir(ch, [0, 1, 0.2]), 'hold');
    const p2 = Object.assign({}, pose, { hLw: L.target, hRw: R.target, eL: [0.6, -0.6, 0.1], eR: [-0.6, -0.6, 0.1] });
    const m = S0.solve(p2);
    return { m, hands: { L: { pose: 'hold', M: S0.handBasis(m.pts.wristL, L.fingers, L.palm) }, R: { pose: 'hold', M: S0.handBasis(m.pts.wristR, R.fingers, R.palm) } }, chest: ch };
  }

  function corpses() {
    return [[-1.6, 2.0, 0.4, 'heavy'], [1.4, 3.2, -1.2, 'scout'], [-2.4, 5.5, 2.2, 'medic'], [2.2, 6.5, 1.0, 'engineer'], [-0.9, 7.6, -0.6, 'sniper']].map(([x, z, yaw, cls], i) => ({
      cls, team: 'blu', pose: (i % 2 ? FP.supine : FP.prone)(cls, x, z, yaw, {}), tint: [0.32, 0.28, 0.26]
    }));
  }

  function shotEpilogueReal(t) {
    const u = t - 128.0;
    const fall = seg(t, 131.6, 132.4);
    const sol = soldierState(t, { at: [0, 0, 0], yaw: PI, sp: [0.25 + fall * 0.5, 0, 0], nk: [-0.35 - fall * 0.3, 0, 0] });
    const lit = Object.assign({}, ENV.street, { points: [{ pos: [-0.9, 1.4, -1.6], col: [1.4, 0.75, 0.35], k: 0.6 }] });
    const head = window.MeetSoldier.headPoint(sol.m, [0, 0, 0]);
    const helmet = t < 131.6 ? null : (() => {
      const k = seg(t, 131.6, 132.6);
      const roll = seg(t, 132.6, 136);
      const p = [lerp(head[0], 0.1, k) + roll * 0.06, Math.max(0.09, lerp(head[1] + 0.05, 0.09, k * k)), lerp(head[2], -0.55, k) - roll * 0.05];
      return { M: M4.chain(M4.translate(p[0], p[1] + 0.06 * k, p[2]), M4.rotY(0.6), M4.rotZ(PI / 2 * k + S(roll * 9) * 0.3 * (1 - roll)), M4.rotX(-0.25 * k)) };
    })();
    let camera;
    if (t < 131.7) {
      const k = seg(t, 128.0, 131.6);
      camera = cam(V3.add(head, [0.05, lerp(-0.32, -0.25, k), lerp(-0.95, -1.5, k)]), V3.add(head, [0, -0.25, 0]), lerp(44, 40, k));
    } else {
      const k = ease(seg(t, 131.7, 133.2));
      camera = cam([lerp(0.3, 0.05, k), lerp(1.0, 0.26, k), lerp(-1.5, -1.15, k)], [0.1, lerp(0.8, 0.45, k), 12], lerp(42, 48, k));
    }
    const walker = (() => {
      const z = lerp(9, 18, seg(t, 128, 138.5));
      const pose = walkPose({ at: [0.6, 0, z], yaw: 0.05, phase: z / 1.3 });
      const G = M4.chain(chestOf(pose), M4.translate(-0.3, -0.38, 0.06), M4.rotY(0.1), M4.rotX(0.95));
      return holding(pose, G, 'flamer');
    })();
    const props = (helmet ? [{ kind: 'helmet', M: helmet.M }] : []).concat(t < 131.7 ? [{ kind: 'charred', M: M4.translate(...M4.point(sol.chest, [0, 0.1, 0.4])) }] : []);
    return {
      shot: 'epilogue', kind: '3d', set: 'streetBurnt', env: lit, camera, pyro: walker,
      soldier: { m: sol.m, hands: sol.hands, team: 'blu', face: { smile: 0, frown: 0.4, wide: 0.3, round: 0.5, jaw: soldierJaw(t) }, opts: { noHelmet: !!helmet, noLegs: t > 131.7 } }, helmetProp: helmet,
      props, fires: [burnFires([-6, 0, 6], 2, 2.5, 14, 191, { smoke: true }), burnFires([6.2, 0, 10], 2, 3, 14, 192, { smoke: true }), burnFires([-6, 0, 16], 2, 2, 12, 193), burnFires([6, 0, 22], 3, 3, 14, 194, { smoke: true })],
      embers: [{ p: [0, 0.5, 4], w: 10, h: 6, n: 50 }], smoke: [{ p: [0, 4, 20], w: 16, h: 14, s: 7, n: 8, a: 0.4 }, { p: M4.point(sol.chest, [0, 0.12, 0.42]), w: 0.15, h: 0.9, s: 0.25, n: 6, a: 0.35, rate: 0.2, drift: 0.1, d: 0.1, tint: [1.6, 1.5, 1.4] }],
      actors: corpses(),
      fade: seg(t, 136.5, 138.45), burnt: true, smokeHands: M4.point(sol.chest, [0, 0.12, 0.4])
    };
  }

  function shotSfm(t) {
    const k = seg(t, 141.0, 143.6);
    const fadeIn = seg(t, 140.98, 141.3);
    const out = seg(t, 147.1, 147.72);
    return {
      shot: 'sfm', kind: 'card', cards: [{ tex: 'sfm', alpha: fadeIn * (1 - out) }], sweep: k < 1 ? { x: lerp(300, 760, k), y: 300, w: lerp(300, 520, S(k * PI)), h: lerp(300, 520, S(k * PI)), a: S(k * PI) * 0.9 * (1 - out) } : null
    };
  }

  window.MpyReal = {
    shotTitle, shotWalk, shotHeavy, shotStreet, shotScout, shotBolt, shotTumble, shotSpyHide, shotPilot, shotSpy, shotNozzle, shotInferno, shotTurn, shotLensGlow,
    shotRealAxe, shotRealFlare, shotRealMedic, shotRealShed, shotRealDemo, shotRealSniper, shotRealFall, shotRealCrawl, shotRealJar, shotRealTank, shotRealWhite, shotRealMask,
    shotLineup, shotEpilogueReal, shotSfm, burnFires
  };
})();
