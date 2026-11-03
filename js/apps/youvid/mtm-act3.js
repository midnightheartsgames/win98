(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Sh = window.MedShots;
  const Props = window.MedProps;
  const Sets = window.MedSets;
  const Medic = window.MeetMedic;
  const Scout = window.MeetScout;
  const Demo = window.MeetDemoman;
  const Eng = window.MeetEngineer;
  const HeavyProps = window.MeetProps;
  const MscShots = window.MscShots;
  const FP = window.FabPose;
  const A2 = window.MedAct2;
  const { seg, spline, X, HX, SX, DX, medicFace, heavyFace, scoutFace, demoFace, medicState, heavyState, scoutState, demoState, cam, ENV } = Sh;

  const VH = Sets.valleyH;
  const PILE = [2.0, 0, 9.0];
  const PILE_H = 1.35;

  function vground(x, z) {
    return [x, VH(x, z), z];
  }

  function valley(st) {
    return Object.assign({ kind: '3d', set: 'valley', env: ENV.battle }, st);
  }

  function handOn(G0, local, fingersL, palmL, pose) {
    const G = HeavyProps.gunM(G0);
    const pos = M4.point(G, local);
    const fingers = V3.norm(M4.dir(G, fingersL));
    const palm = V3.norm(M4.dir(G, palmL));
    const wrist = V3.sub(pos, V3.mul(fingers, 0.075));
    return { target: V3.add(wrist, V3.mul(palm, -0.035)), fingers, palm, pose };
  }

  function heavyGun(t, o) {
    const g = o.at;
    const p = [g[0], (g[1] || 0) + 1.02, g[2]];
    const kick = o.fire ? S(t * 47) * 0.006 + S(t * 31) * 0.004 : 0;
    const G = M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(o.yaw || 0), M4.translate(-0.14, -0.06 + kick, 0.72), M4.rotY(-PI / 2 + (o.aim || 0)), M4.rotZ(o.tilt === undefined ? 0.05 : o.tilt));
    const pose = MscShots.heavyBody({ p, yaw: o.yaw || 0, sp: [o.lean === undefined ? 0.18 : o.lean, o.twist || 0, 0], nk: o.nk || [0, 0, 0], legs: o.legs || 'stand', spread: 0.08 });
    if (o.walk) {
      const ph = o.walk * PI * 2;
      const { fwd, side } = Sh.axes(o.yaw || 0);
      [['L', 1], ['R', -1]].forEach(([s, k]) => {
        const f = V3.add(V3.add([p[0], g[1] || 0, p[2]], V3.mul(side, k * 0.22)), V3.mul(fwd, S(ph) * k * 0.25));
        pose['f' + s + 'w'] = [f[0], (g[1] || 0) + 0.075 + Math.max(0, C(ph) * k) * 0.12, f[2]];
      });
    }
    const hR = handOn(G, [-0.56, 0.08, 0.07], [0, -1, 0.15], [0, 0, -1], 'grip');
    const hL = handOn(G, [-0.36, 0.28, 0], [0.2, -0.6, 1], [0, -1, 0.2], 'grip');
    return heavyState(pose, { L: hL, R: hR }, {
      gun: { M: G, spin: o.fire ? t * 40 : 0 }, metal: o.metal || 0, eyes: o.eyes || 0, team: 'red',
      face: heavyFace(t, o.expr || HX.stern, o.faceExtra)
    });
  }

  function muzzleFx(h, t, extra) {
    const g = HeavyProps.gunGrips(h.gun.M);
    const out = { flashes: [{ p: g.muzzle, s: 0.55 }], tracers: [] };
    for (let i = 0; i < 3; i++) {
      const k = ((t * 7 + i / 3) % 1);
      const a = V3.add(g.muzzle, V3.mul(g.axis, 1 + k * 12));
      out.tracers.push({ a, b: V3.add(a, V3.mul(g.axis, 2.2)), w: 0.035 });
    }
    return Object.assign(out, extra || {});
  }

  function medicGun(t, o) {
    const pose = o.walk !== undefined
      ? Sh.medWalk({ at: o.at, yaw: o.yaw || 0, phase: o.walk, lean: 0.12, nk: o.nk })
      : Sh.medStand({ at: o.at, yaw: o.yaw || 0, sp: o.sp || [0.14, 0, 0], nk: o.nk || [0, 0, 0], spread: o.spread === undefined ? 0.12 : o.spread });
    const ch = Sh.chestOf(Medic, pose);
    const G = M4.chain(ch, M4.translate(-0.07, -0.12 + (o.raise || 0), 0.36), M4.rotY(o.aimYaw || 0), M4.rotX(-(o.aimPitch || 0)));
    const R = Sh.gripHand(Props.grip('medigun', 'R', G), 0.04);
    const L = Sh.gripHand(Props.grip('medigun', 'L', G), 0.04);
    return medicState(pose, { L, R }, {
      outfit: 'coat', gun: G, flare: o.flare || 0, pack: { meter: o.meter === undefined ? 0.3 : o.meter, lit: !!o.lit },
      face: medicFace(t, o.expr || X.stern, o.faceExtra)
    });
  }

  function nozzle(md) {
    return M4.point(md.gun, [0, 0, 0.31]);
  }

  function healBeam(md, target, uber) {
    return { a: nozzle(md), b: target, w: uber ? 0.08 : 0.05, col: uber ? [1, 0.25, 0.15] : [1, 0.3, 0.24], wob: 0.12 };
  }

  const BLU_MIX = ['soldier', 'heavy', 'scout', 'pyro', 'demo', 'soldier', 'medic', 'scout', 'soldier', 'heavy', 'spy', 'sniper', 'pyro', 'soldier', 'demo', 'engineer'];
  const GUNS = { soldier: 'rocket', heavy: 'minigun', pyro: 'flamer', demo: 'grenade', medic: 'medigun', engineer: 'shotgun' };

  function bluCrowd(t, o) {
    const g = rand(o.seed || 61);
    const out = [];
    for (let i = 0; i < (o.n || 12); i++) {
      const cls = BLU_MIX[i % BLU_MIX.length];
      const x = o.x0 + (g() - 0.5) * o.w;
      const z0 = o.z0 + g() * o.d;
      const speed = 3.2 + g() * 1.2;
      const z = z0 + (t - o.t0) * speed * (o.dir || 1);
      const yaw = (o.dir || 1) > 0 ? 0 : PI;
      const a = { cls, team: 'blu', pose: FP.run(cls, x, z, yaw + (g() - 0.5) * 0.3, t * 1.7 + i * 0.37, {}) };
      a.pose.p[1] += VH(x, z);
      ['fLw', 'fRw'].forEach(k => { if (a.pose[k]) a.pose[k][1] += VH(x, z); });
      if (GUNS[cls] && cls !== 'medic') {
        a.gun = GUNS[cls];
        Object.assign(a.pose, FP.aimGun(cls, a.gun));
        a.gunM = FP.aimGun(cls, a.gun).gunM;
      }
      if (o.die && g() < o.die.p) {
        const td = o.die.t + g() * o.die.spread;
        if (t > td) {
          const u = t - td;
          const vx = (g() - 0.5) * 3, vz = -(2 + g() * 2) * (o.dir || 1), vy = 4 + g() * 3;
          if (u < 1.0) {
            const pp = [x + vx * u, Math.max(0.3, 0.9 + vy * u - 6.8 * u * u) + VH(x, z), z + vz * u];
            const spin = u * 7;
            a.pose = FP.airborne(cls, pp, [S(spin) * 0.8, C(spin), 0.3], [0, -0.2, 1]);
          } else {
            a.pose = FP.supine(cls, x + vx, z + vz, yaw);
          }
          a.gun = null;
        }
      }
      out.push(a);
    }
    return out;
  }

  function shotGlove(t) {
    const u = seg(t, 132.84, 133.92);
    const pose = Sh.medStand({ at: [-1.6, 0, 0.6], yaw: PI / 2, sp: [0.05, 0, 0] });
    const ch = Sh.chestOf(Medic, pose);
    const snap = ease(seg(t, 132.95, 133.35));
    const hp = M4.point(ch, [-0.12, 0.25, 0.42 + snap * 0.06]);
    const hands = { R: Sh.hand(hp, M4.dir(ch, [0.2, 0.6 + snap * 0.2, 0.8]), M4.dir(ch, [0.6, -0.3, 0.6]), snap < 0.5 ? 'fist' : 'open') };
    const md = medicState(pose, hands, { outfit: 'lab', blood: 0, face: medicFace(t, X.stern) });
    const eye = V3.add(hp, [0.35 - u * 0.1, 0.08, 0.22]);
    return A2.lab({ shot: 'glove', env: ENV.labDark, camera: cam(eye, V3.add(hp, [0, 0.02, 0]), 40), medic: md, heavy: null });
  }

  function shotCoat(t) {
    const u = seg(t, 133.92, 134.64);
    const pose = Sh.medWalk({ at: [-1.6 + u * 0.4, 0, 0.6], yaw: PI / 2, phase: u * 0.6, lean: 0.05 });
    const md = medicState(pose, null, { outfit: 'coat', flare: 1 - u * 0.6, pack: { meter: 0.05 }, face: medicFace(t, X.stern) });
    const knee = md.m.pts.kneeR;
    return A2.lab({ shot: 'coat', env: ENV.labDark, camera: cam(V3.add(knee, [0.35, -0.25, 0.75]), V3.add(knee, [0, 0.1, 0]), 50), medic: md });
  }

  function shotMedigunGrab(t) {
    const u = seg(t, 134.64, 136.43);
    const md = medicGun(t, { at: [-1.2, 0, 0.6], yaw: PI / 2 + 0.3, raise: 0.1 * u, expr: X.stern, meter: 0.05 });
    const G = md.gun;
    const n = M4.point(G, [0, 0, 0.15]);
    const eye = V3.lerp(M4.point(G, [0.35, 0.18, -0.15]), M4.point(G, [0.3, 0.05, 0.4]), ease(u));
    return A2.lab({ shot: 'medigunGrab', env: ENV.labDark, camera: cam(eye, n, 44), medic: md });
  }

  function shotDoor(t) {
    const open = ease(seg(t, 138.0, 138.513));
    const light = seg(t, 137.9, 138.4);
    return {
      shot: 'door', kind: '3d', set: 'door', env: ENV.door, camera: cam([0, 1.45, 3.4], [0, 1.45, 0], 46), setOpts: { doorOpen: open * 0.35 },
      glows: light > 0 ? [{ p: [0, 1.45, -0.3], s: 2.5 * light, a: light, tint: [1, 1, 1] }] : []
    };
  }

  function doveSwarm(t, center, n, seed) {
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = g() * PI * 2, r = 0.6 + g() * 1.8, sp = 0.5 + g() * 0.8;
      const ang = a + t * sp;
      const p = V3.add(center, [C(ang) * r, 0.5 + g() * 2.2 + S(t * 2 + i) * 0.2, S(ang) * r * 0.6]);
      out.push({ M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(-ang)), flap: S(t * 30 + i * 2) * 0.9 });
    }
    return out;
  }

  function shotReveal(t) {
    const u = seg(t, 138.513, 144.102);
    const walk = Math.min(1, u * 1.6);
    const md = medicGun(t, { at: [0, 0, lerp(-1.6, 0.4, walk)], yaw: 0, walk: walk < 1 ? t * 0.9 : undefined, expr: X.stern, flare: 0.6 + 0.4 * S(t * 3), meter: 0.1 });
    const doves = doveSwarm(t, [0, 0, 0.3], 9, 21);
    return {
      shot: 'reveal', kind: '3d', set: 'fog', env: ENV.fog, camera: cam([0.1, 1.1, 3.1], [0, 1.15, 0], 44), medic: md, doves,
      glows: [{ p: [0, 1.6, -3.5], s: 6, a: 0.6, tint: [0.85, 0.9, 1] }], white: 0.5 * (1 - seg(t, 138.513, 139.2))
    };
  }

  function shotPose(t) {
    const md = medicGun(t, { at: [0, 0, 0.4], yaw: -0.2, expr: X.stern, flare: 0.3, meter: 0.1, nk: [0.05, 0.1, 0] });
    const head = Sh.headPos(md);
    const heavy = t > 145.6 ? heavyGun(t, { at: [0.75, 0, -0.9 + (t - 145.6) * 0.9], yaw: -0.3, expr: HX.stern }) : null;
    return {
      shot: 'pose', kind: '3d', set: 'fog', env: ENV.fog, camera: cam(V3.add(head, [0.12, -0.6, 1.25]), V3.add(head, [0.05, -0.32, 0]), 42), medic: md, heavy
    };
  }

  const BASE_OUT = [6, -9.5];

  function shotOverShoulder(t) {
    const u = seg(t, 146.521, 149.107);
    const at = vground(BASE_OUT[0], BASE_OUT[1]);
    const md = medicGun(t, { at, yaw: 0.15, expr: X.stern, meter: 0.15 });
    const hp = vground(BASE_OUT[0] + 0.6, BASE_OUT[1] + 2.5 + u * 4.5);
    const h = heavyGun(t, { at: hp, yaw: 0.1, walk: t * 1.1, expr: HX.stern });
    const head = Sh.headPos(md);
    const booms = [{ p: vground(4, 6), u: (u * 1.8) % 1, s: 2.4, seed: 31 }, { p: vground(10, 10), u: (u * 1.8 + 0.5) % 1, s: 2.0, seed: 32 }];
    return valley({
      shot: 'overShoulder', camera: cam(V3.add(head, [-0.35, 0.05, -0.7]), V3.add(head, [0.8, -0.6, 6]), 50), medic: md, heavy: h, booms,
      actors: bluCrowd(t, { t0: 146.5, x0: 6, w: 10, z0: 18, d: 8, n: 8, dir: -1, seed: 71 })
    });
  }

  const DEMO_SPOT = [8.5, 2.5];

  function demoStand(t, o) {
    const at = vground(DEMO_SPOT[0], DEMO_SPOT[1]);
    const pose = Sh.poseStand(Demo.D, { at, yaw: o.yaw === undefined ? PI - 0.4 : o.yaw, sp: o.sp || [0.2, 0, 0], nk: o.nk || [0, 0, 0] });
    const ch = Sh.chestOf(Demo, pose);
    const L = M4.chain(ch, M4.translate(0.0, -0.05, 0.38), M4.rotY(0.1));
    const hands = {
      R: Sh.hand(M4.point(L, [-0.05, -0.1, -0.12]), M4.dir(L, [0.3, -0.2, 0.8]), M4.dir(L, [1, 0, 0]), 'grip'),
      L: Sh.hand(M4.point(L, [0.06, -0.04, 0.2]), M4.dir(L, [-0.3, -0.3, 0.8]), M4.dir(L, [-1, 0, 0]), 'grip')
    };
    return demoState(pose, hands, { launcher: L, face: demoFace(t, o.expr || DX.shout, o.faceExtra) });
  }

  function shotDemoYell(t) {
    const dm = demoStand(t, { expr: DX.shout, nk: [-0.25, 0.1, 0] });
    const head = Sh.headPos(dm);
    const flash = seg(t, 149.107, 149.4);
    return valley({ shot: 'demoYell', camera: Sh.shaken(cam(M4.point(dm.m.head, [0.15, -0.1, 0.9]), V3.add(head, [0, -0.15, 0]), 44), t, 0.02, 9), demo: dm, wash: [1, 0.85, 0.3, 0.55 * (1 - flash)] });
  }

  function shotDemoBoom(t) {
    const dm = demoStand(t, { expr: DX.hurt });
    const head = Sh.headPos(dm);
    const u = seg(t, 151.15, 151.53);
    return valley({
      shot: 'demoBoom', camera: cam(V3.add(head, [-0.8, 0.2, -1.6]), head, 50), demo: dm, booms: [{ p: V3.add(head, [0.2, -0.8, -0.4]), u: u * 0.6, s: 2.6, seed: 41 }],
      wash: [1, 0.8, 0.25, 0.8 * (1 - u)]
    });
  }

  function shotMedicGrim(t) {
    const md = medicGun(t, { at: vground(BASE_OUT[0], BASE_OUT[1] + 1.5), yaw: 0.6, expr: X.stern, meter: 0.2, nk: [0.05, -0.15, 0] });
    return valley({ shot: 'medicGrim', env: ENV.grey, camera: A2.faceCam(md, [0.04, -0.06, 0.6], [0, -0.04, 0.03], 40, 0), medic: md, set: 'fog' });
  }

  function shotFallen(t) {
    const at = vground(DEMO_SPOT[0], DEMO_SPOT[1] + 1.0);
    const fall = seg(t, 152.28, 152.9);
    const pose = fall < 1 ? Sh.poseAir(Demo.D, { p: V3.add(at, [0, 0.5 * (1 - fall) + 0.3, 0]), up: [0.3, 1 - fall * 0.8, fall], fwd: [0, -fall, 1], tuck: 0.3 }) : Sh.poseSupine(Demo.D, { at, yaw: 0.3, nk: [0.4, -0.6, 0] });
    const dm = demoState(pose, null, { face: demoFace(t, DX.hurt) });
    const c = M4.point(dm.m.chest, [0, 0, 0]);
    return valley({ shot: 'fallen', camera: cam(V3.add(c, [1.1, 0.5, 1.4]), c, 44), demo: dm, dust: [{ p: c, u: fall, s: 1.0, a: 0.6 }] });
  }

  function shotMedicLook(t) {
    const turn = ease(seg(t, 154.9, 156.0));
    const md = medicGun(t, { at: vground(BASE_OUT[0], BASE_OUT[1] + 1.5), yaw: 0.6 - turn * 1.2, expr: X.focus, meter: 0.25, nk: [0, 0.3 - turn * 0.5, 0] });
    const eye = M4.point(md.m.head, [0.08 - turn * 0.2, -0.04, 0.55]);
    return valley({ shot: 'medicLook', env: ENV.grey, set: 'fog', camera: cam(eye, M4.point(md.m.head, [0, -0.05 - turn * 0.25, 0]), 42), medic: md, blur: 0.3 });
  }

  function demoUp(t) {
    const at = vground(DEMO_SPOT[0], DEMO_SPOT[1] + 1.0);
    const up = ease(seg(t, 160.5, 162.4));
    if (up <= 0) return demoState(Sh.poseSupine(Demo.D, { at, yaw: 0.3, nk: [0.4, -0.6, 0] }), null, { face: demoFace(t, DX.hurt) });
    const st = demoStand(t, { yaw: PI - 0.6, expr: up > 0.8 ? DX.laugh : DX.hurt, sp: [lerp(1.1, 0.2, up), 0, 0] });
    return st;
  }

  function shotHeal1(t) {
    const md = medicGun(t, { at: vground(BASE_OUT[0], BASE_OUT[1] + 1.5), yaw: 0.5, expr: X.focus, meter: 0.3, aimPitch: 0.1, raise: 0.05 });
    const target = vground(DEMO_SPOT[0], DEMO_SPOT[1] + 1.0);
    const fire = seg(t, 158.6, 158.9);
    return valley({
      shot: 'heal1', camera: cam(M4.point(md.m.chest, [0.35, 0.55, 1.6]), M4.point(md.m.chest, [0.0, 0.35, 0.2]), 44), medic: md,
      beams: fire > 0 ? [healBeam(md, V3.add(target, [0, 0.4, 0]), false)] : []
    });
  }

  function shotBeamDemo(t) {
    const dm = demoUp(t);
    const md = medicGun(t, { at: vground(BASE_OUT[0], BASE_OUT[1] + 1.5), yaw: 0.5, expr: X.focus, meter: 0.35, aimPitch: 0.1 });
    const c = M4.point(dm.m.chest, [0, 0.2, 0]);
    return valley({ shot: 'beamDemo', camera: cam(V3.add(c, [1.6, 0.6, 2.2]), V3.add(c, [-0.3, 0, 0]), 44), demo: dm, medic: md, beams: [healBeam(md, c, false)] });
  }

  function shotHealing(t) {
    const md = medicGun(t, { at: vground(BASE_OUT[0], BASE_OUT[1] + 1.5), yaw: 0.9, expr: X.focus, meter: 0.4, aimPitch: 0.05, flare: 0.3 });
    const target = vground(DEMO_SPOT[0] + 1, DEMO_SPOT[1] + 2.0);
    return valley({ shot: 'healing', camera: cam(M4.point(md.m.chest, [-0.6, 0.3, 1.8]), M4.point(md.m.chest, [0, 0.25, 0.2]), 46), medic: md, beams: [healBeam(md, V3.add(target, [0, 1.0, 0]), false)] });
  }

  const TUNNEL = [6, -12.6];

  function scoutRunState(t, from, to, t0, t1, expr) {
    const k = seg(t, t0, t1);
    const p = V3.lerp(from, to, k);
    const d = V3.sub(to, from);
    const yaw = Math.atan2(d[0], d[2]);
    const pose = Sh.poseRun(Scout.D, { at: vground(p[0], p[2]), yaw, phase: t * 2.2, lean: 0.35 });
    return scoutState(pose, null, { face: scoutFace(t, expr || SX.grin) });
  }

  function shotScoutHeal(t) {
    const md = medicGun(t, { at: vground(BASE_OUT[0] - 1.5, BASE_OUT[1] + 1.2), yaw: 0.2, expr: X.focus, meter: 0.45 });
    const sc = scoutRunState(t, [TUNNEL[0] + 1.5, 0, TUNNEL[1] + 1.2], [TUNNEL[0] + 1.8, 0, TUNNEL[1] + 1.6], 166.0, 169.5, t < 167.5 ? SX.happy : SX.grin);
    const head = Sh.headPos(sc);
    const push = ease(seg(t, 166.5, 167.2));
    const eye = V3.lerp(V3.add(head, [2.6, 0.4, 4.2]), M4.point(sc.m.head, [0.05, 0.02, 0.62]), push);
    const look = V3.lerp(V3.add(head, [0, -0.5, 0]), head, push);
    return valley({ shot: 'scoutHeal', camera: cam(eye, look, 42), scout: sc, medic: md, beams: [healBeam(md, M4.point(sc.m.chest, [0, 0.2, 0]), false)] });
  }

  function shotScoutRun(t) {
    const sc = scoutRunState(t, [TUNNEL[0] + 1.8, 0, TUNNEL[1] + 1.6], [TUNNEL[0] + 4, 0, TUNNEL[1] + 6], 169.46, 170.5, SX.grin);
    const c = M4.point(sc.m.chest, [0, 0, 0]);
    return valley({ shot: 'scoutRun', camera: cam(V3.add(c, [-2.5, 0.4, 1.5]), c, 46), scout: sc, blur: 0.2 });
  }

  function shotScoutFlex(t) {
    const at = vground(TUNNEL[0] + 4, TUNNEL[1] + 6);
    const pose = Sh.poseStand(Scout.D, { at, yaw: -0.6, sp: [-0.15, 0.3, 0] });
    const ch = Sh.chestOf(Scout, pose);
    const hands = {
      R: Sh.hand(M4.point(ch, [-0.3, 0.5, 0.1]), M4.dir(ch, [0.1, 1, 0]), M4.dir(ch, [0, 0, 1]), 'fist'),
      L: Sh.hand(M4.point(ch, [0.4, 0.15, 0.15]), M4.dir(ch, [1, 0.2, 0.2]), M4.dir(ch, [0, -1, 0]), 'open')
    };
    const sc = scoutState(pose, hands, { face: scoutFace(t, SX.grin) });
    const c = M4.point(sc.m.chest, [0, 0.3, 0]);
    return valley({ shot: 'scoutFlex', camera: cam(V3.add(c, [-0.6, -0.4, 1.6]), c, 46), scout: sc });
  }

  const HEAVY_SPOT = [5.4, -5.5];

  function shotScoutGib(t) {
    const u = seg(t, 171.38, 172.13);
    const h = heavyGun(t, { at: vground(HEAVY_SPOT[0], HEAVY_SPOT[1]), yaw: 0.2, fire: true, expr: HX.stern });
    const g = HeavyProps.gunGrips(h.gun.M);
    const sc = scoutState(Sh.poseAir(Scout.D, { p: V3.add(g.muzzle, [lerp(-1.5, 2.5, u), 0.6 + S(u * PI) * 0.5, lerp(2.5, 1.0, u)]), up: [S(u * 8), C(u * 8), 0.3], fwd: [1, 0, 0.2], tuck: 0.2 }), null, { face: scoutFace(t, SX.scream) });
    return valley({
      shot: 'scoutGib', camera: cam(V3.add(g.drum, [-0.6, 0.25, 0.9]), V3.add(g.muzzle, [0.5, 0.3, 1.5]), 50), heavy: h, scout: sc,
      booms: [{ p: V3.add(g.muzzle, [0.2, 0.6, 1.8]), u: u * 0.8, s: 1.8, seed: 51 }], wash: [1, 0.75, 0.3, 0.45 * (1 - u)]
    });
  }

  function shotHeavyAngry(t) {
    const h = heavyGun(t, { at: vground(HEAVY_SPOT[0], HEAVY_SPOT[1]), yaw: 0.2, expr: HX.roar, faceExtra: { jaw: 0.3 } });
    return valley({ shot: 'heavyAngry', camera: A2.faceCam(h, [0.15, -0.05, 0.75], [0, -0.05, 0.03], 40, 0), heavy: h, blur: 0.35 });
  }

  function shotBluSoldier(t) {
    const at = vground(HEAVY_SPOT[0] - 1.0, HEAVY_SPOT[1] + 7);
    const sol = { cls: 'soldier', team: 'blu', pose: FP.stand('soldier', at[0], at[2], PI + 0.3, { y: at[1] }), gun: 'rocket' };
    Object.assign(sol.pose, FP.aimGun('soldier', 'rocket'));
    sol.gunM = FP.aimGun('soldier', 'rocket').gunM;
    const sc = scoutRunState(t, [at[0] + 3, 0, at[2] - 2.5], [at[0] + 0.6, 0, at[2] - 0.6], 172.67, 174.0, SX.yell);
    const hit = seg(t, 173.9, 174.59);
    return valley({
      shot: 'bluSoldier', camera: cam(V3.add(at, [1.6, 1.1, -2.6]), V3.add(at, [0, 1.1, 0]), 46), actors: [sol], scout: hit > 0 ? null : sc,
      booms: hit > 0 ? [{ p: V3.add(at, [0.6, 1.0, -0.7]), u: hit, s: 1.6, seed: 61 }] : [], set: 'valley'
    });
  }

  function shotHeavyProfile(t) {
    const h = heavyGun(t, { at: vground(HEAVY_SPOT[0], HEAVY_SPOT[1]), yaw: 0.2, expr: HX.stern });
    return valley({ shot: 'heavyProfile', camera: A2.faceCam(h, [-0.45, 0.0, 0.42], [0.1, -0.02, 0.2], 42, 0), heavy: h, booms: [{ p: vground(4, 12), u: seg(t, 174.6, 175.4), s: 2.5, seed: 62 }] });
  }

  function shotFeet(t) {
    const actors = bluCrowd(t, { t0: 175.4, x0: 5.5, w: 2.4, z0: 1.4, d: 1.6, n: 6, dir: -1, seed: 73 });
    return valley({ shot: 'feet', camera: cam(vground(5.5, -1.2).map((v, i) => v + [0, 0.3, 0][i]), vground(5.5, 2.0).map((v, i) => v + [0, 0.45, 0][i]), 60), actors, blur: 0.25, dust: [{ p: vground(5.5, 0.5), u: (t * 1.5) % 1, s: 1.2, a: 0.5 }] });
  }

  function shotBluCharge(t) {
    const actors = bluCrowd(t, { t0: 176.5, x0: 5.5, w: 5, z0: 2.0, d: 6, n: 14, dir: -1, seed: 74 });
    return valley({ shot: 'bluCharge', camera: Sh.shaken(cam(vground(5.5, -2.5).map((v, i) => v + [0, 1.2, 0][i]), vground(5.5, 4).map((v, i) => v + [0, 1.0, 0][i]), 44), t, 0.03, 11), actors });
  }

  function shotHeavyShout(t) {
    const h = heavyGun(t, { at: vground(HEAVY_SPOT[0], HEAVY_SPOT[1]), yaw: 0.2, expr: HX.roar });
    return valley({ shot: 'heavyShout', camera: A2.faceCam(h, [-0.5, 0.02, 0.35], [0.1, -0.02, 0.15], 42, 0), heavy: h });
  }

  function shotHeavyGrin(t) {
    const flash = 1 - seg(t, 178.01, 178.45);
    const h = heavyGun(t, { at: vground(HEAVY_SPOT[0], HEAVY_SPOT[1]), yaw: 0.2, expr: t < 179.4 ? HX.grin : HX.oh, nk: [0, -0.35, 0] });
    const cf = t < 178.45 ? A2.faceCam(h, [-0.45, 0.02, 0.42], [0.1, -0.02, 0.15], 42, 0) : A2.faceCam(h, [-0.08, 0.02, 0.66], [0, -0.03, 0.03], 40, 0);
    return valley({ shot: 'heavyGrin', camera: cf, heavy: h, wash: [1, 0.6, 0.15, 0.7 * flash], actors: bluCrowd(t, { t0: 176.5, x0: 5.5, w: 5, z0: 2.0, d: 6, n: 8, dir: -1, seed: 74 }) });
  }

  const MED_SPOT2 = [3.6, -7.0];

  function shotNoIdea(t) {
    const md = medicGun(t, { at: vground(MED_SPOT2[0], MED_SPOT2[1]), yaw: 0.45, expr: t < 180.2 ? X.grin : t < 182.4 ? X.mad : X.gleeful, meter: lerp(0.6, 0.95, seg(t, 179.6, 183.1)), nk: [-0.2 * seg(t, 180.8, 181.6), -0.25, 0], faceExtra: { look: t > 180.8 ? [0, 0.35] : [-0.2, 0] } });
    return valley({ shot: 'noIdea', camera: A2.faceCam(md, [0.3, -0.22, 0.42], [0.0, -0.06, 0.03], 40, 0), medic: md, set: 'fog', env: ENV.grey });
  }

  function packM(md) {
    return M4.mul(md.m.chest, M4.translate(0, 0.02, -0.22));
  }

  function shotMeter(t) {
    const level = lerp(0.62, 1.0, ease(seg(t, 183.2, 184.2)));
    const lit = t > 184.3;
    const md = medicGun(t, { at: vground(MED_SPOT2[0], MED_SPOT2[1]), yaw: 0.45, expr: X.mad, meter: level, lit });
    const P = packM(md);
    const box = M4.chain(P, M4.translate(0.19, 0.26, 0.0), M4.rotY(PI / 2));
    const face = M4.point(box, [0, 0, 0.03]);
    const n = V3.norm(M4.dir(box, [0, 0, 1]));
    const zoom = ease(seg(t, 183.1, 184.6));
    return valley({ shot: 'meter', set: 'fog', env: ENV.door, camera: cam(V3.add(face, V3.mul(n, lerp(0.32, 0.18, zoom))), V3.add(face, [0, -0.01 * zoom, 0]), 40), medic: md, glows: lit ? [{ p: M4.point(box, [0, -0.035, 0.04]), s: 0.12, a: 0.8, tint: [1, 0.55, 0.2] }] : [] });
  }

  function shotPackGlow(t) {
    const md = medicGun(t, { at: vground(MED_SPOT2[0], MED_SPOT2[1]), yaw: 0.45, expr: X.mad, meter: 1, lit: true, nk: [0, 0.4, 0] });
    const P = packM(md);
    const bulb = M4.point(P, [0, 0.12, -0.09]);
    const u = seg(t, 184.643, 186.937);
    return valley({
      shot: 'packGlow', set: 'fog', env: ENV.grey, camera: cam(M4.point(P, [0.62 - u * 0.12, 0.32, -0.32]), M4.point(P, [-0.05, 0.3, 0.05]), 46), medic: md,
      glows: [{ p: bulb, s: 0.35 + 0.1 * S(t * 9), a: 0.95, tint: [1, 0.5, 0.18] }, { p: M4.point(P, [0.1, 0.62, 0]), s: 0.2, a: 0.6, tint: [1, 0.6, 0.2] }, { p: M4.point(P, [-0.1, 0.62, 0]), s: 0.2, a: 0.6, tint: [1, 0.6, 0.2] }]
    });
  }

  function shotAim(t) {
    const raise = ease(seg(t, 186.94, 187.6));
    const md = medicGun(t, { at: vground(MED_SPOT2[0], MED_SPOT2[1]), yaw: 0.45, expr: X.mad, meter: 1, lit: true, raise: 0.1 * raise, aimPitch: -0.1 * raise });
    const c = M4.point(md.m.chest, [0, 0.25, 0]);
    return valley({ shot: 'aim', set: 'fog', env: ENV.grey, camera: cam(M4.point(md.m.chest, [-0.25, 0.3, 0.95]), c, 46), medic: md, glows: [{ p: M4.point(packM(md), [0, 0.12, -0.09]), s: 0.4, a: 0.9, tint: [1, 0.5, 0.18] }] });
  }

  function shotUberFlash(t) {
    const md = medicGun(t, { at: vground(MED_SPOT2[0], MED_SPOT2[1]), yaw: 0.45, expr: X.mad, meter: 1, lit: true, raise: 0.1, aimPitch: 0.1 });
    const u = seg(t, 188.104, 189.314);
    const target = V3.add(vground(HEAVY_SPOT[0], HEAVY_SPOT[1]), [0, 1.3, 0]);
    return valley({
      shot: 'uberFlash', set: 'fog', env: ENV.door, camera: cam(M4.point(md.m.chest, [1.4, 0.3, 2.2]), M4.point(md.m.chest, [0.4, 0.2, 0.8]), 46), medic: md,
      beams: [healBeam(md, target, true)], wash: [1, 0.4, 0.3, 0.85 * (1 - seg(u, 0, 0.25))]
    });
  }

  function shotHeavyReady(t) {
    const h = heavyGun(t, { at: vground(HEAVY_SPOT[0], HEAVY_SPOT[1]), yaw: 0.2, expr: HX.stern, nk: [0, 0.2, 0] });
    const whip = seg(t, 189.75, 189.98);
    return valley({ shot: 'heavyReady', camera: A2.faceCam(h, [0.25 + whip * 0.6, -0.08, 0.7], [0, -0.06, 0.03], 40, 0), heavy: h, blur: whip * 0.6 });
  }

  function shotBeamCar(t) {
    const h = heavyGun(t, { at: vground(HEAVY_SPOT[0], HEAVY_SPOT[1]), yaw: 0.2, expr: HX.stern });
    const md = medicGun(t, { at: vground(MED_SPOT2[0], MED_SPOT2[1]), yaw: 0.45, expr: X.mad, meter: 1, lit: true, aimPitch: 0.05 });
    const c = M4.point(h.m.chest, [0, 0.25, 0]);
    return valley({ shot: 'beamCar', camera: cam(V3.add(c, [-2.6, 0.2, 2.8]), V3.add(c, [0.5, 0, -0.5]), 48), heavy: h, medic: md, beams: [healBeam(md, c, true)], blur: 0.15 });
  }

  const HANGAR = [0, 14.5];

  function hangar(st) {
    return Object.assign({ kind: '3d', set: 'hangar', env: ENV.hangar }, st);
  }

  function uberPair(t, o) {
    const hp = [HANGAR[0] + 0.6 + (o.dx || 0), 0, HANGAR[1] + (o.dz || 0)];
    const h = heavyGun(t, { at: hp, yaw: o.yaw === undefined ? 0 : o.yaw, fire: o.fire, metal: o.metal || 0, eyes: o.eyes || 0, expr: o.hexpr || HX.roar, walk: o.walk });
    const md = medicGun(t, { at: [hp[0] - 1.3, 0, hp[2] - 1.6], yaw: 0.4 + (o.yaw || 0), expr: o.mexpr || X.mad, meter: 1, lit: true, aimPitch: 0.05, flare: 0.4 });
    const c = M4.point(h.m.chest, [0, 0.25, 0]);
    return { h, md, c, beam: healBeam(md, c, true) };
  }

  function shotCrackle(t) {
    const { h, md, c, beam } = uberPair(t, { hexpr: HX.scream });
    const flash = seg(t, 191.9, 192.23);
    return hangar({ shot: 'crackle', camera: cam(V3.add(c, [-0.9, 0.1, 2.0]), V3.add(c, [-0.35, -0.1, 0]), 46), heavy: h, medic: md, beams: [beam], zaps: [{ p: c, r: 0.45, n: 6, w: 0.015, seed: 7 }], white: flash * 0.9 });
  }

  function shotHeartUber(t) {
    return {
      shot: 'heartUber', kind: '3d', set: 'fog', env: ENV.labRed, camera: cam([0.03, 0.2, 0.2], [0.02, 0.16, 0], 46),
      hearts: [{ M: M4.chain(M4.translate(0, 0, 0), M4.rotY(0.6)), big: true, beat: t * 3, uber: 1, uberM: M4.translate(0.02, 0.16, 0), glow: 1.5 + 0.5 * S(t * 14) }],
      glows: [{ p: [0, 0.1, 0], s: 0.6, a: 0.8, tint: [1, 0.3, 0.15] }], zaps: [{ p: [0, 0.12, 0.05], r: 0.25, n: 5, seed: 17 }], wash: [0.7, 0.05, 0.02, 0.35]
    };
  }

  function shotHeavyEyes(t) {
    const k = seg(t, 193.8, 194.5);
    const { h, md, beam } = uberPair(t, { metal: k, eyes: seg(t, 193.75, 194.0), hexpr: k < 0.5 ? HX.grin : HX.roar });
    h.face = heavyFace(t, k < 0.5 ? HX.grin : HX.roar, { jaw: k * 0.9 });
    return hangar({ shot: 'heavyEyes', env: k > 0.5 ? ENV.labRed : ENV.hangar, camera: A2.faceCam(h, [0.1, -0.15, 0.75], [0, -0.05, 0.03], 42, 0), heavy: h, medic: md, beams: [beam], zaps: [{ p: Sh.headPos(h), r: 0.35, n: 3, seed: 19 }] });
  }

  function shotMedicLaugh(t) {
    const { h, md } = uberPair(t, { metal: 1, eyes: 1, yaw: 0, fire: false });
    md.face = medicFace(t, X.laugh, { jaw: 0.4 + 0.35 * Math.abs(S(t * 11)) });
    const fire = seg(t, 195.8, 196.1);
    return hangar({
      shot: 'medicLaugh', camera: A2.faceCam(md, [-0.22, -0.22, 0.58], [0.05, -0.16, 0.03], 44, 0), heavy: h, medic: md,
      beams: [healBeam(md, M4.point(h.m.chest, [0, 0.25, 0]), true)], glows: fire > 0 ? [{ p: nozzle(md), s: 0.5, a: fire, tint: [1, 0.6, 0.2] }] : []
    });
  }

  function shotPairFire(t) {
    const { h, md, beam } = uberPair(t, { metal: 1, eyes: 1, fire: true, hexpr: HX.roar });
    return Object.assign(hangar({ shot: 'pairFire', camera: cam([HANGAR[0] + 0.1, 1.15, HANGAR[1] + 3.3], [HANGAR[0] - 0.25, 1.3, HANGAR[1] - 0.5], 46), heavy: h, medic: md, beams: [beam] }), muzzleFx(h, t));
  }

  function shotWhite() {
    return { shot: 'white', kind: '3d', set: 'fog', env: ENV.fog, camera: cam([0, 1, 3], [0, 1, 0], 40), white: 1 };
  }

  function shotBlast(t) {
    const u = seg(t, 197.614, 199.031);
    const rays = 1 - seg(u, 0, 0.25);
    const smoke = [];
    const g = rand(81);
    for (let i = 0; i < 26; i++) smoke.push({ p: [(g() - 0.5) * 5, 1 + (g() - 0.5) * 3, -0.5 - g() * 3], s: 2.8 + g() * 2.4, a: 0.92, rot: i + u * 2, tint: [0.4 + g() * 0.08, 0.39 + g() * 0.08, 0.38 + g() * 0.08] });
    return {
      shot: 'blast', kind: '3d', set: 'fog', env: Object.assign({}, ENV.fog, { clear: [0.38, 0.37, 0.36], fogCol: [0.38, 0.37, 0.36] }), camera: cam([0, 1, 3], [0, 1, 0], 50),
      smoke, flashes: rays > 0 ? [{ p: [0, 1, -1], s: 6 * rays }] : [], wash: [1, 0.6, 0.3, 0.5 * rays]
    };
  }

  function shotEyesSmoke(t) {
    const u = seg(t, 199.031, 199.866);
    const emerge = ease(seg(u, 0.45, 1));
    const h = heavyGun(t, { at: [0, 0, lerp(-2.2, -0.6, emerge)], yaw: 0, metal: 1, eyes: 1, expr: HX.roar, walk: t });
    const smoke = [];
    const g = rand(83);
    for (let i = 0; i < 12; i++) smoke.push({ p: [(g() - 0.5) * 5, 0.8 + g() * 1.8, -0.5 + g() * 1.5 - emerge * 1.2], s: 2.2 + g() * 1.5, a: 0.8 * (1 - emerge * 0.6), rot: i, tint: [0.42, 0.41, 0.4] });
    return { shot: 'eyesSmoke', kind: '3d', set: 'fog', env: Object.assign({}, ENV.hangar, { clear: [0.38, 0.37, 0.36] }), camera: cam([0, 1.75, 1.8], Sh.headPos(h), 44), heavy: h, smoke };
  }

  function shotFlashY(t) {
    const u = seg(t, 199.866, 200.2);
    const h = heavyGun(t, { at: [0, 0, -0.6], yaw: 0, metal: 1, eyes: 1, expr: HX.roar, fire: true });
    return Object.assign({ shot: 'flashY', kind: '3d', set: 'fog', env: ENV.hangar, camera: cam([0.4, 1.5, 1.6], Sh.headPos(h), 46), heavy: h, wash: [1, 0.8, 0.35, 0.85 - u * 0.3] }, muzzleFx(h, t));
  }

  const STRIPES = [14, 10];

  function engSniper(t, scared) {
    const eAt = [STRIPES[0] - 0.45, 0, STRIPES[1] + 0.7];
    const pose = Sh.poseStand(Eng.D, { at: eAt, yaw: -0.5, sp: [0.12, 0, 0], nk: [0, -0.5, 0] });
    const ch = Sh.chestOf(Eng, pose);
    const G = M4.chain(ch, M4.translate(-0.05, 0.0, 0.3), M4.rotY(-0.4));
    const hands = {
      R: Sh.hand(M4.point(G, [-0.04, -0.06, -0.12]), M4.dir(G, [1, -0.2, 0.3]), M4.dir(G, [0, 0, -1]), 'grip'),
      L: Sh.hand(M4.point(G, [0.05, -0.02, 0.2]), M4.dir(G, [-1, -0.3, 0.2]), M4.dir(G, [0, -1, 0]), 'grip')
    };
    const engineer = Sh.engState(pose, hands, { face: { wide: scared ? 0.6 : 0.3, frown: 0.5, press: scared ? 0 : 0.3, jaw: scared ? 0.3 : 0.05 } });
    const sAt = [STRIPES[0] + 0.45, STRIPES[1] + 0.6];
    const sniper = { cls: 'sniper', team: 'red', pose: FP.stand('sniper', sAt[0], sAt[1], -0.6, { nk: [scared ? 0.15 : 0, -0.4, 0] }), itemR: 'rifle', face: { jaw: scared ? 0.6 : 0.1 } };
    sniper.pose.hR = [-0.2, 0.2, 0.25];
    sniper.pose.hL = [0.25, 0.05, 0.3];
    return { engineer, sniper, gunM: G };
  }

  function shotEngSniper(t) {
    const scared = t > 200.7;
    const { engineer, sniper, gunM } = engSniper(t, scared);
    return valley({
      shot: 'engSniper', set: 'stripes', env: ENV.sunset, camera: cam([STRIPES[0] - 0.6, 1.35, STRIPES[1] + 3.2], [STRIPES[0] + 0.1, 1.4, STRIPES[1] + 0.5], 42),
      engineer, actors: [sniper], items: [{ kind: 'fabGun', gun: 'shotgun', M: gunM }], wash: [1, 0.5, 0.2, 0.18]
    });
  }

  function shotAdvance(t) {
    const u = seg(t, 201.2, 205.83);
    const { h, md, beam } = uberPair(t, { metal: 1, eyes: 1, fire: u < 0.55, dz: -u * 2.5, walk: t * 0.9, yaw: 0.6 });
    const c = M4.point(h.m.chest, [0, 0.2, 0]);
    const eye = spline([[0, V3.add(c, [-1.6, -0.75, 2.9])], [0.5, V3.add(c, [-0.4, -0.85, 2.6])], [1, V3.add(c, [1.6, -0.6, 2.2])]])(u);
    const look = spline([[0, V3.add(c, [0, 0.1, 0])], [0.6, V3.add(c, [0, -0.4, 0])], [1, V3.add(c, [-0.6, -0.3, 0])]])(u);
    const extra = u < 0.55 ? muzzleFx(h, t) : {};
    return Object.assign(valley({ shot: 'advance', env: ENV.sunset, camera: cam(eye, look, 50), heavy: h, medic: md, beams: [beam], set: 'stripes' }), extra);
  }

  function shotMow(t) {
    const { h, md, beam } = uberPair(t, { metal: 1, eyes: 1, fire: true });
    const actors = bluCrowd(t, { t0: 205.83, x0: HANGAR[0], w: 9, z0: HANGAR[1] + 4, d: 6, n: 14, dir: -1, seed: 91, die: { p: 0.85, t: 206.2, spread: 2.2 } });
    const c = M4.point(h.m.chest, [0, 0, 0]);
    return Object.assign(hangar({ shot: 'mow', camera: cam(V3.add(c, [-0.9, 0.1, -1.6]), V3.add(c, [0.6, -0.2, 4]), 50), heavy: h, medic: md, beams: [beam], actors }), muzzleFx(h, t));
  }

  function shotBluFall(t) {
    const u = seg(t, 208.29, 211.29);
    const actors = bluCrowd(t, { t0: 205.83, x0: HANGAR[0], w: 9, z0: HANGAR[1] + 4, d: 6, n: 14, dir: -1, seed: 91, die: { p: 0.85, t: 206.2, spread: 2.2 } });
    const { h, md } = uberPair(t, { metal: 1, eyes: 1, fire: true });
    return Object.assign(hangar({
      shot: 'bluFall', camera: cam([HANGAR[0] - 1.5, 0.9, HANGAR[1] + 5.5], [HANGAR[0], 0.9, HANGAR[1] + 2], 48), heavy: h, medic: md, actors,
      white: seg(t, 210.9, 211.29) * 0.8, dust: [{ p: [HANGAR[0], 0.5, HANGAR[1] + 4], u: (u * 1.3) % 1, s: 2.5, a: 0.5 }]
    }), muzzleFx(h, t));
  }

  const PILE_BODIES = (() => {
    const g = rand(97);
    const out = [];
    for (let i = 0; i < 26; i++) {
      const a = g() * PI * 2, r = Math.sqrt(g()) * 2.6;
      const x = PILE[0] + C(a) * r, z = PILE[2] + S(a) * r * 0.8;
      const y = PILE_H * Math.max(0, 1 - (r / 2.7) * (r / 2.7)) + 0.0;
      out.push({ cls: BLU_MIX[i % BLU_MIX.length], x, z, y, yaw: g() * PI * 2, prone: g() < 0.5 });
    }
    return out;
  })();

  function pileActors() {
    return PILE_BODIES.map(b => {
      const pose = b.prone ? FP.prone(b.cls, b.x, b.z, b.yaw, { y: b.y }) : FP.supine(b.cls, b.x, b.z, b.yaw, { y: b.y });
      return { cls: b.cls, team: 'blu', pose };
    });
  }

  function pileState(t, o) {
    const top = [PILE[0] - 0.2, PILE_H - 0.05, PILE[2] - 0.2];
    const h = heavyGun(t, { at: [PILE[0] + 1.6, 0.55, PILE[2] + 0.2], yaw: o.hyaw === undefined ? 0.4 : o.hyaw, metal: 1, eyes: 1, fire: o.fire !== false, expr: HX.roar });
    const md = medicGun(t, { at: top, yaw: o.myaw === undefined ? 0.7 : o.myaw, expr: X.mad, meter: 1, lit: true, raise: o.raise || 0, aimPitch: o.pitch || 0.25, flare: 0.5 + 0.3 * S(t * 2.5) });
    const mound = { kind: 'rock', i: 1, M: M4.chain(M4.translate(PILE[0], -0.35, PILE[2]), M4.scale(2.3, PILE_H * 0.95, 1.8)) };
    return { h, md, mound, beam: healBeam(md, M4.point(h.m.chest, [0, 0.25, 0]), true) };
  }

  function pile(st) {
    return Object.assign({ kind: '3d', set: 'valley', env: ENV.sunset, actors: pileActors() }, st);
  }

  function shotPileFire(t) {
    const { h, md, mound, beam } = pileState(t, {});
    const c = M4.point(h.m.chest, [0, 0, 0]);
    return Object.assign(pile({ shot: 'pileFire', camera: cam(V3.add(c, [-1.4, 0.5, 2.2]), V3.add(c, [0.4, 0.1, 0]), 46), heavy: h, medic: md, items: [mound], beams: [beam] }), muzzleFx(h, t));
  }

  function shotPileMedic(t) {
    const { h, md, mound, beam } = pileState(t, {});
    const c = M4.point(md.m.chest, [0, 0, 0]);
    return Object.assign(pile({ shot: 'pileMedic', camera: cam(V3.add(c, [-0.5, -0.4, 2.0]), V3.add(c, [0.6, 0.0, 0]), 48), heavy: h, medic: md, items: [mound], beams: [beam] }), muzzleFx(h, t));
  }

  function shotBoots(t) {
    const step = ease(seg(t, 213.4, 214.0));
    const { h, md, mound, beam } = pileState(t, {});
    const f = md.m.pts.ankleR;
    return pile({ shot: 'boots', camera: cam(V3.add(f, [0.85, 0.45, 1.25]), V3.add(f, [0, -0.25 + step * 0.1, 0]), 44), heavy: h, medic: md, items: [mound], beams: [beam] });
  }

  function shotSummit(t) {
    const u = seg(t, 214.34, 218.84);
    const { h, md, mound, beam } = pileState(t, { raise: 0.25, pitch: -0.35 });
    const eye = V3.lerp([PILE[0] + 0.7, 0.55, PILE[2] + 5.4], [PILE[0] + 0.6, 0.6, PILE[2] + 4.8], u);
    const doves = doveSwarm(t, [PILE[0], PILE_H + 1.5, PILE[2] - 2], 7, 33);
    return Object.assign(pile({
      shot: 'summit', camera: cam(eye, [PILE[0] + 0.3, 1.95, PILE[2]], 42), heavy: h, medic: md, items: [mound], beams: [beam], doves,
      glows: [{ p: [PILE[0], 6, PILE[2] - 30], s: 46, a: 0.95, tint: [1, 0.86, 0.55] }, { p: [PILE[0] + 1, 3, PILE[2] - 12], s: 14, a: 0.6, tint: [1, 0.7, 0.35] }]
    }), muzzleFx(h, t));
  }

  window.MedAct3 = {
    shotGlove, shotCoat, shotMedigunGrab, shotDoor, shotReveal, shotPose, shotOverShoulder, shotDemoYell, shotDemoBoom, shotMedicGrim, shotFallen, shotMedicLook,
    shotHeal1, shotBeamDemo, shotHealing, shotScoutHeal, shotScoutRun, shotScoutFlex, shotScoutGib, shotHeavyAngry, shotBluSoldier, shotHeavyProfile, shotFeet,
    shotBluCharge, shotHeavyShout, shotHeavyGrin, shotNoIdea, shotMeter, shotPackGlow, shotAim, shotUberFlash, shotHeavyReady, shotBeamCar, shotCrackle,
    shotHeartUber, shotHeavyEyes, shotMedicLaugh, shotPairFire, shotWhite, shotBlast, shotEyesSmoke, shotFlashY, shotEngSniper, shotAdvance, shotMow,
    shotBluFall, shotPileFire, shotPileMedic, shotBoots, shotSummit, medicGun, heavyGun
  };
})();
