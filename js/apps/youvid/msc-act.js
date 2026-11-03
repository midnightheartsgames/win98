(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Props = window.MscProps;
  const Sol = window.MeetSoldier;
  const SolProps = window.MtsProps;
  const FP = window.FabPose;
  const Fab = window.FabCast;
  const Sh = window.MscShots;
  const { seg, spline, track, X, scoutFace, scoutState, crouchPose, runPose, airPose, hand, gripHand, cam, shake, blu, red, runner, ENV, headPos } = Sh;

  function doorY(t) {
    return 1.9 * ease(seg(t, 3.3, 5.9));
  }

  function holdGun(pose, local, rot) {
    const ch = Sh.chestOf(pose);
    const r = rot || [0, 0, 0];
    return M4.chain(ch, M4.translate(local[0], local[1], local[2]), M4.rotY(r[1]), M4.rotX(r[0]), M4.rotZ(r[2]));
  }

  function gunHands(G, both) {
    const out = { R: gripHand(Props.grip('scatter', 'R', G), 0.07) };
    if (both) out.L = gripHand(Props.grip('scatter', 'L', G), 0.07);
    return out;
  }

  function armed(pose, local, rot, both, extra) {
    const G = holdGun(pose, local, rot);
    const hands = gunHands(G, both);
    if (!both && extra && extra.handL) hands.L = extra.handL;
    return scoutState(pose, hands, Object.assign({ gun: G }, extra || {}));
  }

  function soldier(pose, launcherAt, launcherRot) {
    const ch = Sol.solve(pose).chest;
    const r = launcherRot || [0, 0, 0];
    const G = M4.chain(ch, M4.translate(launcherAt[0], launcherAt[1], launcherAt[2]), M4.rotY(r[1]), M4.rotX(r[0]), M4.rotZ(r[2]));
    const hands = {};
    ['L', 'R'].forEach(s => {
      const g = SolProps.grip('launcher', s, G);
      const wrist = V3.sub(g.pos, V3.mul(g.fingers, 0.09));
      hands[s] = { target: V3.add(wrist, V3.mul(g.palm, -0.028)), fingers: g.fingers, palm: g.palm, pose: g.pose };
    });
    const p = Object.assign({}, pose, { hLw: hands.L.target, hRw: hands.R.target });
    const m = Sol.solve(p);
    const hm = {};
    ['L', 'R'].forEach(s => { hm[s] = { pose: hands[s].pose, M: Sol.handBasis(m.pts['wrist' + s], hands[s].fingers, hands[s].palm) }; });
    return { m, hands: hm, launcher: G };
  }

  function soldierCrouch(at, yaw, nk) {
    const fwd = [S(yaw), 0, C(yaw)], side = [C(yaw), 0, -S(yaw)];
    const p = [at[0], 0.7, at[2]];
    const pose = { p, fwd, up: [0, 1, 0], sp: [0.5, 0, 0], nk: nk || [-0.35, 0, 0], eL: [0.7, -0.4, 0.3], eR: [-0.7, -0.4, 0.3] };
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const f = V3.add(at, V3.add(V3.mul(side, k * 0.2), V3.mul(fwd, k > 0 ? 0.28 : -0.12)));
      pose['f' + s + 'w'] = [f[0], 0.075, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 2 + side[0] * k * 0.5, 1.0, fwd[2] * 2 + side[2] * k * 0.5]);
    });
    return soldier(pose, [-0.16, 0.36, 0.26], [-1.35, 0.45, 0]);
  }

  const DOOR_SCOUT = [-0.34, 0, -0.42];

  function doorScout(t, o) {
    const nk = o && o.nk ? o.nk : [-0.45, 0.55, 0.04];
    const pose = crouchPose({ at: DOOR_SCOUT, yaw: 0.2, depth: 0.74, sp: [0.72, 0.12, 0], nk: [nk[0] - 0.3, nk[1], nk[2]], eR: [-0.8, -0.2, 0.3], eL: [0.8, -0.3, 0.3] });
    const lift = o && o.lift ? o.lift : 0;
    return armed(pose, [0.08, -0.22 + lift * 0.12, 0.3], [-0.6 - lift * 0.25, PI / 2 - 0.15, -0.05], true);
  }

  const DOOR_FACE = track([[0, X.focus], [11.9, X.smirk], [12.6, X.sly, 0.4], [13.3, X.grit, 0.2]]);

  function teamInside(t) {
    return [
      red('demo', FP.crouch('demo', -1.5, -1.3, 0.1, { depth: 0.45 }), { gun: 'grenade' }),
      red('pyro', FP.crouch('pyro', -0.6, -2.3, 0.0, { depth: 0.4 }), { gun: 'flamer' }),
      red('heavy', FP.crouch('heavy', 1.4, -2.2, -0.1, { depth: 0.35 }), { gun: 'minigun' })
    ].map(a => {
      if (a.gun) {
        const g = FP.aimGun(a.cls, a.gun);
        Object.assign(a.pose, { hR: g.hR, hL: g.hL });
        a.gunM = g.gunM;
      }
      return a;
    });
  }

  function shotDoor(t) {
    const sol = soldierCrouch([-3.05, 0, -0.7], 0.15, [-0.3, 0.25, 0]);
    return {
      shot: 'door', kind: '3d', set: 'base', inside: true, env: ENV.respawn, envOut: ENV.glare,
      camera: cam(V3.add([0.6, 0.42, -4.2], shake(t, 0.004, 2)), [-0.95, 1.15, 0], 40),
      door: doorY(t), sol, solFace: { lidU: 0.5 }, fade: 1 - seg(t, 1.6, 2.8)
    };
  }

  function shotCrouch(t) {
    const u = t - 5.124;
    const at = spline([[0, [-0.05, 1.75, -0.4]], [0.45, [-0.02, 1.0, -0.45]], [1.75, [0.0, 0.98, -0.45]]])(u);
    const sc = doorScout(t, { nk: [-0.45, spline([[0, 0.3], [0.6, 0.6], [1.75, 0.68]])(u), 0.04] });
    const sol = soldierCrouch([0.35, 0, -0.9], -0.1, [-0.15, -0.35, 0]);
    return {
      shot: 'crouch', kind: '3d', set: 'base', env: ENV.front, camera: cam(V3.add([-0.1, 0.95, 0.62], shake(t, 0.003, 3)), at, 54),
      door: doorY(t), scout: sc, face: scoutFace(t, Object.assign({ look: [0.35, 0.05] }, DOOR_FACE(t))), sol, solFace: { lidU: 0.5 }, solTint: [0.5, 0.46, 0.46]
    };
  }

  function sniperActor(t) {
    const pose = FP.stand('sniper', 6.25, 25.0, PI - 0.12, {});
    pose.p[1] += 2.4;
    pose.fLw[1] += 2.4;
    pose.fRw[1] += 2.4;
    const g = FP.aimGun('sniper', 'rifle', { pitch: -0.08 });
    Object.assign(pose, { hR: g.hR, hL: g.hL, nk: [0.1, 0, 0] });
    return blu('sniper', pose, { gun: 'rifle', gunM: g.gunM });
  }

  function upstairs(cls, x, z, yaw, y, extra) {
    const pose = FP.stand(cls, x, z, yaw, extra || {});
    pose.p[1] += y;
    pose.fLw[1] += y;
    pose.fRw[1] += y;
    return pose;
  }

  function facadeActors(t) {
    const out = [sniperActor(t)];
    const eng = upstairs('engineer', 0.55, 25.2, PI / 2 + 0.6, 2.6, { hR: [-0.18, 0.12, 0.28], eR: [-0.6, -0.5, -0.2] });
    out.push(blu('engineer', eng, { itemR: 'wrenchSteel' }));
    const spy = upstairs('spy', 1.6, 25.4, -PI / 2 - 0.5, 2.6, { hL: [0.25, -0.05, 0.05], hR: [-0.18, 0.1, 0.22] });
    out.push(blu('spy', spy, { itemR: 'revolver' }));
    const med = upstairs('medic', -4.2, 25.0, PI + 0.2, 2.6, {});
    out.push(blu('medic', med, {}));
    const jump = seg(t, 9.85, 10.35);
    if (t > 9.6) {
      const x = -9.6, z = 22.6;
      let y;
      if (jump < 1) y = lerp(1.4, 7.3, Math.sin(jump * PI * 0.62) / Math.sin(PI * 0.62));
      else y = 7.0;
      const pose = jump < 1 ? FP.airborne('soldier', [x, y + 0.95, z], [-0.05, 1, 0.1], [0, 0, -1], {}) : FP.crouch('soldier', x + (t - 10.35) * 0.6, z, PI + 0.4, { y: 7.0, depth: 0.3 });
      const a = blu('soldier', pose, { gun: 'rocket' });
      const g = FP.aimGun('soldier', 'rocket');
      Object.assign(a.pose, { hR: g.hR, hL: g.hL });
      a.gunM = g.gunM;
      out.push(a);
    }
    const walk = (cls, x0, x1, z, t0, extra) => {
      const k = t - t0;
      const pose = FP.run(cls, lerp(x0, x1, clamp(k / 4, 0, 1)), z, PI / 2, t * 1.1, { stride: 0.18, bob: 0.4, lean: 0.05, y: 1.6 });
      return blu(cls, pose, extra);
    };
    out.push(walk('heavy', -17.5, -14.2, 15.0, 9.8, { gun: 'minigun' }));
    out.push(walk('engineer', -18.8, -15.6, 15.4, 9.8, {}));
    out.push(walk('medic', -24.5, -22.0, 15.2, 9.8, { gun: 'medigun' }));
    out.forEach(a => {
      if (a.gun && !a.gunM) {
        const g = FP.aimGun(a.cls, a.gun);
        Object.assign(a.pose, { hR: g.hR, hL: g.hL });
        a.gunM = g.gunM;
      }
    });
    return out;
  }

  function sentryOnLedge(t) {
    return { kind: 'sentry', M: M4.chain(M4.translate(-5.6, 7.0, 23.0), M4.rotY(PI), M4.scale(1.4, 1.4, 1.4)), st: { yaw: S(t * 0.9) * 0.6, pitch: 0.12 } };
  }

  function shotEnemies(t) {
    const at = spline([[6.874, [6.4, 3.55, 24]], [7.6, [4.3, 3.75, 24]], [8.05, [1.6, 3.6, 24]], [8.8, [-0.1, 3.75, 24]], [9.05, [-2.4, 4.0, 24]], [9.3, [-3.9, 5.9, 24]],
      [9.8, [-5.8, 7.2, 24]], [10.3, [-8.3, 6.9, 24]], [10.8, [-11.6, 3.6, 21]], [11.749, [-15.8, 2.7, 17]]])(t);
    return {
      shot: 'enemies', kind: '3d', set: 'base', env: ENV.outdoor, camera: cam([0.3, 1.15, -0.2], at, t < 10.6 ? 10.5 : lerp(10.5, 20, seg(t, 10.6, 11.3))),
      actors: facadeActors(t), props: [sentryOnLedge(t)]
    };
  }

  function shotGrin(t) {
    const lift = seg(t, 13.2, 13.62);
    const sc = doorScout(t, { nk: [-0.45, 0.32 - lift * 0.15, 0.05], lift });
    const h = headPos(sc);
    const sol = soldierCrouch([0.35, 0, -0.9], -0.1, [-0.15, -0.35, 0]);
    const drift = seg(t, 11.749, 13.666);
    return {
      shot: 'grin', kind: '3d', set: 'base', env: ENV.front, door: 1.4,
      camera: cam(V3.add(h, [0.05 - drift * 0.02, 0.03, 0.74 + drift * 0.03]), V3.add(h, [0.03, -0.07, 0]), 34, -0.06),
      scout: sc, face: scoutFace(t, Object.assign({ look: [0.45, 0.02] }, DOOR_FACE(t))), sol, solFace: { lidU: 0.5 }, solTint: [0.4, 0.36, 0.36], blur: 0.4
    };
  }

  function teamOut(t) {
    return [
      runner('soldier', 'red', [0.3, 0, -2.2], [1.2, 0, 3.4], 13.67, 14.5, t),
      runner('demo', 'red', [-0.4, 0, -2.4], [-0.6, 0, 3.0], 13.85, 14.87, t),
      runner('pyro', 'red', [0.9, 0, -2.3], [1.6, 0, 2.2], 14.15, 14.87, t)
    ];
  }

  function shotOut(t) {
    const k = seg(t, 13.95, 14.87);
    const p = V3.lerp([0.6, 0, -1.6], [0.3, 0, 3.8], k);
    const pose = runPose({ at: p, yaw: -0.05, phase: t * 1.9, lean: 0.4 });
    const sc = armed(pose, [-0.22, -0.18, 0.28], [0.25, 0.05, 0], false, { handL: null });
    return {
      shot: 'out', kind: '3d', set: 'base', inside: true, env: ENV.respawn, envOut: ENV.glare, door: 1.65,
      camera: cam([0.9, 0.22, -2.5], [0.1, 1.0, 3.0], 52), scout: sc, face: scoutFace(t, X.grit), actors: teamOut(t)
    };
  }

  function shotCharge(t) {
    const u = t - 14.874;
    const z = lerp(0.6, 7.6, u / 1.46);
    const pose = runPose({ at: [0.35, 0, z], yaw: 0.02, phase: t * 1.85, lean: 0.45, nk: [-0.2, 0.0, 0.0] });
    const sc = armed(pose, [-0.22, -0.2, 0.3], [0.3, 0.05, 0], false);
    const h = headPos(sc);
    const eye = u < 0.33 ? V3.add(h, [0.25, -0.05, 0.55]) : V3.add(h, [0.05 + S(u * 2) * 0.03, -0.1, 0.62 - u * 0.04]);
    const face = u < 1.0 ? X.grit : X.yell;
    const actors = t > 15.8 ? [runner('heavy', 'red', [-1.8, 0, 2.0], [-1.4, 0, 5.0], 15.8, 16.4, t), runner('soldier', 'red', [1.9, 0, 1.0], [2.2, 0, 4.4], 15.7, 16.4, t)] : [];
    return {
      shot: 'charge', kind: '3d', set: 'base', env: ENV.yard, camera: cam(V3.add(eye, shake(t, 0.03, 5)), V3.add(h, [0, -0.12, 0]), 46), scout: sc,
      face: scoutFace(t, face), actors, blur: u < 0.33 ? 0.7 : 0.25, dark: u < 0.33 ? 0.6 * (1 - u / 0.33) : 0
    };
  }

  function shotEngie(t) {
    const u = t - 16.333;
    const swing = Math.abs(S(u * 9));
    const eng = FP.crouch('engineer', -2.0, 21.35, -PI / 2 - 0.25, { depth: 0.35, hR: [-0.16, 0.32 - swing * 0.35, 0.25 + swing * 0.15], eR: [-0.6, -0.4, -0.3] });
    const turn = ease(seg(t, 16.55, 17.0));
    const sentry = { kind: 'sentry', M: M4.chain(M4.translate(-2.95, 0, 21.3), M4.rotY(lerp(-1.2, -PI + 0.28, turn)), M4.scale(1.4, 1.4, 1.4)), st: { yaw: 0, pitch: lerp(0.05, 0.12, turn), build: 1 } };
    const push = ease(seg(t, 16.5, 16.9));
    const eye = V3.lerp([-3.75, 0.95, 19.5], [-3.35, 0.82, 19.95], push);
    const at = V3.lerp([-2.45, 0.72, 21.4], [-2.95, 0.66, 21.3], push);
    return {
      shot: 'engie', kind: '3d', set: 'base', env: ENV.outdoor, camera: cam(V3.add(eye, shake(t, 0.006, 6)), at, lerp(46, 36, push)),
      actors: [blu('engineer', eng, { itemR: 'wrenchSteel' })], props: [sentry]
    };
  }

  function shotFeet(t) {
    const u = t - 17.374;
    const camZ = lerp(9.5, 15.5, u / 1.71);
    const scoutK = seg(t, 17.6, 19.083);
    const p = [lerp(-0.5, 0.2, scoutK), 0, lerp(camZ - 0.6, camZ + 5.5, scoutK)];
    const pose = runPose({ at: p, yaw: 0.05, phase: t * 1.9, lean: 0.35 });
    const sc = armed(pose, [-0.22, -0.2, 0.3], [0.3, 0.05, 0], false);
    const actors = [
      runner('soldier', 'red', [-1.6, 0, camZ + 1.5], [-1.8, 0, camZ + 9], 17.37, 19.1, t),
      runner('demo', 'red', [1.4, 0, camZ + 2.2], [1.6, 0, camZ + 9.5], 17.37, 19.1, t),
      runner('engineer', 'red', [0.4, 0, camZ + 4.5], [0.7, 0, camZ + 10], 17.37, 19.1, t)
    ];
    const hits = [];
    for (let i = 0; i < 7; i++) {
      const t0 = 17.45 + i * 0.23;
      if (t > t0 && t < t0 + 0.5) hits.push({ p: [-1.5 + ((i * 37) % 30) / 10, 0.02, camZ + 1.2 + ((i * 13) % 20) / 10], u: (t - t0) / 0.5 });
    }
    return {
      shot: 'feet', kind: '3d', set: 'base', env: ENV.outdoor, camera: cam(V3.add([0.05, 0.16, camZ], shake(t, 0.02, 7)), [0.2, 0.55, camZ + 8], 50, 0.03),
      scout: sc, face: scoutFace(t, X.grit), actors, dust: hits,
      tracers: [0, 1, 2].map(i => ({ a: [3 + i, 3.5, camZ + 14], b: [-1 + i * 0.6, 0.0, camZ + 1.4 + frac(t * 2.5 + i / 3) * 2], k: frac(t * 2.5 + i / 3) }))
    };
  }

  function yardRun(t, z0, z1, t0, t1, x, extra) {
    const k = seg(t, t0, t1);
    const z = lerp(z0, z1, k);
    const pose = runPose(Object.assign({ at: [x, 0, z], yaw: 0, phase: t * 1.9, lean: 0.42 }, extra || {}));
    return armed(pose, [-0.22, -0.2, 0.3], [0.3, 0.05, 0], false);
  }

  function shotPillar(t) {
    const sc = yardRun(t, 1.4, 8.0, 19.0, 19.75, 1.0);
    const yaw = spline([[19.083, 0.1], [19.3, 0.6], [19.708, 1.2]])(t);
    const eye = [-1.4, 0.72, 4.2];
    const at = V3.add(eye, [S(PI / 2 + yaw * 0.25) * 4, 0.1, C(PI / 2 + yaw * 0.25) * 4 + yaw * 2.2]);
    return {
      shot: 'pillar', kind: '3d', set: 'yard', env: ENV.yard, camera: cam(eye, at, 48), scout: sc, face: scoutFace(t, X.grit),
      dark: seg(t, 19.32, 19.42) * (1 - seg(t, 19.58, 19.7)), blur: 0.15
    };
  }

  function shotTrack(t) {
    const sc = yardRun(t, 16.0, 20.2, 19.708, 20.541, -1.5);
    const z = sc.m.pts.pelvis[2];
    return {
      shot: 'track', kind: '3d', set: 'yard', env: ENV.yard, camera: cam(V3.add([1.6, 0.45, z - 0.3], shake(t, 0.01, 8)), [-1.5, 1.0, z - 0.15], 44), scout: sc,
      face: scoutFace(t, X.grit), blur: 0.3
    };
  }

  function shotYard(t) {
    const sc = yardRun(t, -6.0, 6.5, 20.541, 21.791, -1.3, { lean: 0.38 });
    const tracers = [0, 1, 2, 3].map(i => {
      const ph = frac(t * 2.1 + i / 4);
      const a = [-12 + i * 2, 1.2, -40];
      return { a: V3.lerp(a, [-1.5 + i * 0.4, 1.0, 6.0], ph), b: V3.lerp(a, [-1.5 + i * 0.4, 1.0, 6.0], Math.min(1, ph + 0.12)), k: ph };
    });
    return {
      shot: 'yard', kind: '3d', set: 'yard', env: ENV.yard, camera: cam(V3.add([0.6, 0.7, 13.5], shake(t, 0.008, 9)), [-0.9, 1.0, -2.0], 34), scout: sc,
      face: scoutFace(t, X.grit), tracers
    };
  }

  function shotClose(t) {
    const sc = yardRun(t, 6.5, 12.0, 21.791, 22.874, -1.2);
    const h = headPos(sc);
    const u = seg(t, 21.791, 22.874);
    const eye = V3.add(h, [1.3 - u * 0.4, -0.3, 0.9 - u * 0.6]);
    return {
      shot: 'close', kind: '3d', set: 'yard', env: ENV.yard, camera: cam(V3.add(eye, shake(t, 0.02, 10)), V3.add(h, [0, -0.25, 0.1]), 52), scout: sc,
      face: scoutFace(t, X.grit), blur: 0.35
    };
  }

  function shotRoof(t) {
    const u = seg(t, 22.874, 24.124);
    const start = [7.8, 5.35, 23.2], end = [-0.2, 2.0, 31.5];
    const along = V3.lerp(start, end, u);
    const arc = S(u * PI) * 2.6 + S(seg(u, 0.4, 1) * PI) * 1.2;
    const p = [along[0], along[1] + arc + 0.9, along[2]];
    const tuck = 0.3 + 0.5 * S(u * PI * 2) * S(u * PI * 2);
    const pose = airPose({ p, fwd: [-0.65, -0.1, 0.75], up: [-0.1, 1, -0.15], tuck, sp: [0.4, 0, 0.1] });
    const sc = armed(pose, [-0.22, -0.18, 0.3], [0.2, 0.05, 0], false);
    return {
      shot: 'roof', kind: '3d', set: 'yard', env: ENV.yard, camera: cam([3.4, 1.1, 20.0], V3.lerp([6.6, 5.8, 24.6], [3.2, 7.6, 28.0], ease(u)), 44, -0.18), scout: sc,
      face: scoutFace(t, X.yell)
    };
  }

  function shotRocket(t) {
    const sc = yardRun(t, 14.0, 22.0, 24.124, 25.874, 2.9);
    const h = headPos(sc);
    const u = t - 24.124;
    const whip = seg(t, 24.95, 25.2);
    const eye = V3.add(h, [-1.6, -0.35, 0.35]);
    const at = V3.add(h, [lerp(0, 2.5, whip), -0.2, lerp(0.1, 1.5, whip)]);
    const rk = clamp(u / 0.55, 0, 1.6);
    const rocket = { from: [7.5, 1.4, h[2] + 6], to: [4.2, 1.1, h[2] - 3], k: rk, i: 2 };
    const boom = t > 24.6 ? [{ p: [4.4, 1.0, h[2] - 0.6], u: t - 24.6, s: 2.2 }] : [];
    const actors = t > 25.15 ? [runner('soldier', 'blu', [5.2, 0, h[2] + 3.0], [5.0, 0, h[2] + 1.0], 25.15, 25.874, t)] : [];
    return {
      shot: 'rocket', kind: '3d', set: 'yard', env: ENV.yard, camera: cam(V3.add(eye, shake(t, 0.015, 11)), at, 50), scout: sc, face: scoutFace(t, X.grit),
      rockets: [rocket], booms: boom, actors, blur: 0.3 + whip * 0.5
    };
  }

  function hallScout(t) {
    const k = seg(t, 25.874, 27.458);
    const z = lerp(-2.6, 1.6, k);
    const jump = seg(t, 26.45, 27.35);
    const y = S(jump * PI) * 0.75;
    const turn = ease(seg(t, 26.6, 26.85)) * (1 - ease(seg(t, 27.25, 27.45)));
    if (jump > 0 && jump < 1) {
      const pose = airPose({ p: [0.2 + jump * 0.6, 1.0 + y, z], fwd: [S(-turn * 2.2), 0, C(-turn * 2.2)], tuck: 0.4 + jump * 0.3, sp: [0.25, 0, 0] });
      const sc = armed(pose, [-0.18, 0.18, 0.4], [0.35 + turn * 0.3, 0.1, 0], true);
      return sc;
    }
    const pose = runPose({ at: [0.2 + jump * 0.6, 0, z], yaw: 0, phase: t * 1.9, lean: 0.4 });
    return armed(pose, [-0.22, -0.2, 0.3], [0.3, 0.05, 0], false);
  }

  function shotHall(t) {
    const sc = hallScout(t);
    const fire = t > 26.8 && t < 27.3 ? 1 - frac((t - 26.8) * 5) : 0;
    const sol = blu('soldier', FP.stand('soldier', 0.4, -9.4, 0.15, {}), { gun: 'rocket' });
    const g = FP.aimGun('soldier', 'rocket');
    Object.assign(sol.pose, { hR: g.hR, hL: g.hL });
    sol.gunM = g.gunM;
    if (t > 27.1) {
      const q = t - 27.1;
      sol.pose = FP.airborne('soldier', [0.4, 0.9 + q * 1.2, -9.6 - q], [0.2, 0.8, -0.6], [0, -0.3, 1], {});
    }
    const muzzle = sc.gun ? Props.muzzle(sc.gun) : null;
    return {
      shot: 'hall', kind: '3d', set: 'hall', env: ENV.hall, camera: cam(V3.add([2.5, 0.5, 3.3], shake(t, 0.01, 12)), [-0.5, 1.5, -4.0], 52), scout: sc,
      face: scoutFace(t, t > 26.6 ? X.yell : X.grit), actors: [sol],
      flashes: fire > 0.2 && muzzle ? [{ p: V3.add(muzzle.p, V3.mul(muzzle.d, 0.1)), s: 0.5 * fire }] : [],
      tracers: fire > 0.2 && muzzle ? [{ a: muzzle.p, b: [0.4, 1.0, -9.3], k: 0.5 }] : []
    };
  }

  function shotBlast(t) {
    const u = t - 27.458;
    const path = spline([[0, [-2.6, 0, -3.8]], [0.8, [-0.4, 0, -2.4]], [1.6, [2.0, 0, 0.4]], [2.2, [3.6, 0, 2.6]], [2.666, [4.2, 0, 4.6]]])(u);
    const ahead = spline([[0, [-1.4, 0, -3.2]], [0.8, [0.8, 0, -1.4]], [1.6, [3.0, 0, 1.6]], [2.2, [4.0, 0, 4.0]], [2.666, [4.4, 0, 6.0]]])(u);
    const dir = V3.norm(V3.sub(ahead, path));
    const yaw = Math.atan2(dir[0], dir[2]);
    const pose = runPose({ at: path, yaw, phase: t * 1.9, lean: 0.42 });
    const aim = seg(t, 29.1, 29.3) * (1 - seg(t, 29.55, 29.7));
    const sc = armed(pose, aim > 0 ? [-0.16, 0.08, 0.38] : [-0.22, -0.2, 0.3], aim > 0 ? [0.05, -0.15, 0] : [0.3, 0.05, 0], aim > 0.5);
    const h = headPos(sc);
    let eye, at, fov = 48;
    if (u < 1.05) {
      eye = [-3.2, 0.9, -0.2];
      at = V3.add(h, [0, -0.2, 0]);
    } else if (u < 1.8) {
      eye = V3.add(h, [-1.1, -0.25, 0.6]);
      at = V3.add(h, [0.3, -0.3, 0.4]);
      fov = 52;
    } else {
      eye = V3.add(h, [-0.8, -0.45, 0.2 + (u - 1.8) * 0.6]);
      at = V3.add(h, [1.6, -0.6, 2.0]);
      fov = 56;
    }
    const boom = u < 1.0 ? [{ p: [-2.1, 1.1, -2.3], u: u + 0.12, s: 1.2 }] : [];
    const fire = t > 29.2 && t < 29.5 ? 1 - frac((t - 29.2) * 6) : 0;
    const muzzle = Props.muzzle(sc.gun);
    const victims = [
      blu(t < 29.3 ? 'scout' : 'scout', t < 29.3 ? FP.run('scout', lerp(5.5, 4.8, seg(t, 28.3, 29.3)), 6.0, PI + 0.4, t * 1.7) : FP.supine('scout', 4.6, 5.4, 2.4)),
      blu('pyro', FP.prone('pyro', 3.4, 7.2, 1.2)),
      blu('demo', FP.stand('demo', 1.0, 10.5, PI, {}))
    ];
    return {
      shot: 'blast', kind: '3d', set: 'hall', env: ENV.hall, camera: cam(V3.add(eye, shake(t, 0.015, 13)), at, fov), scout: sc, face: scoutFace(t, u < 1.6 ? X.grit : X.yell),
      actors: victims, booms: boom, flashes: fire > 0.2 ? [{ p: V3.add(muzzle.p, V3.mul(muzzle.d, 0.1)), s: 0.45 * fire }] : [],
      sparks: t > 29.25 && t < 29.6 ? [{ p: [4.7, 1.0, 5.8], u: (t - 29.25) / 0.35 }] : [], blur: u > 1.8 ? 0.5 : 0.2
    };
  }

  function shotLedge(t) {
    const glimpse = (t > 30.4 && t < 30.64) || (t > 30.9 && t < 31.06);
    const k = t < 30.7 ? seg(t, 30.4, 30.64) : seg(t, 30.9, 31.06);
    const x = t < 30.7 ? lerp(-7.6, -5.4, k) : lerp(-5.0, -3.6, k);
    const pose = runPose({ at: [x, 3.73, 11.2], yaw: PI / 2, phase: t * 2, lean: 0.4 });
    const sc = armed(pose, [-0.22, -0.2, 0.3], [0.3, 0.05, 0], false);
    const eye = [-1.4, 1.2, 5.6];
    const at = glimpse ? [x + 0.4, 4.4, 11.0] : V3.add(eye, [S(t * 9) * 2, -0.6, 2]);
    return {
      shot: 'ledge', kind: '3d', set: 'hall', env: ENV.dark, camera: cam(eye, at, glimpse ? 36 : 60), scout: glimpse ? sc : null, face: scoutFace(t, X.grit),
      blur: glimpse ? 0.2 : 0.9, dark: glimpse ? 0.2 : 0.75
    };
  }

  window.MscAct = { doorY, holdGun, armed, soldier, soldierCrouch, shotDoor, shotCrouch, shotEnemies, shotGrin, shotOut, shotCharge, shotEngie, shotFeet, shotPillar, shotTrack, shotYard, shotClose, shotRoof, shotRocket, shotHall, shotBlast, shotLedge };
})();
