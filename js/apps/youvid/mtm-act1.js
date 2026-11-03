(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Sh = window.MedShots;
  const Sets = window.MedSets;
  const Scout = window.MeetScout;
  const Demo = window.MeetDemoman;
  const FP = window.FabPose;
  const { seg, spline, SX, DX, scoutFace, demoFace, scoutState, demoState, cam, ENV } = Sh;

  const H = Sets.ridgeH;
  const TREE = [2.6, -6.3];
  const CROW = [0.75, -5.2];
  const SUN = [0.6, 6, -80];

  function ground(x, z) {
    return [x, H(x, z), z];
  }

  function field(st) {
    return Object.assign({ kind: '3d', set: 'ridge', env: ENV.dusk }, st);
  }

  function sunGlow(extra) {
    return [{ p: SUN, s: 70, a: 0.55, tint: [1, 0.85, 0.5] }].concat(extra || []);
  }

  function crowAt(t) {
    const hop = seg(t, 3.4, 3.7);
    const fly = seg(t, 5.1, 6.4);
    const base = ground(CROW[0], CROW[1]);
    const p = V3.add(base, [-fly * 2.5, 0.95 + S(hop * PI) * 0.12 + fly * 2.2, fly * 1.5]);
    return { kind: 'crow', M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(0.9 + fly * 0.8), M4.scale(2.2, 2.2, 2.2)) };
  }

  function perchRock() {
    const p = ground(CROW[0], CROW[1]);
    return { kind: 'rock', i: 2, M: M4.chain(M4.translate(p[0], p[1] + 0.1, p[2]), M4.rotY(0.6), M4.scale(0.9, 1.0, 0.8)) };
  }

  function treeItem() {
    const p = ground(TREE[0], TREE[1]);
    return { kind: 'tree', M: M4.chain(M4.translate(p[0], p[1] - 0.1, p[2]), M4.rotY(0.4), M4.scale(1.3, 1.3, 1.3)) };
  }

  function flung(t) {
    const k = seg(t, 5.55, 7.25);
    const p = [lerp(-2.4, 2.6, k), 1.8 + S(k * PI) * 1.8, lerp(-6.4, -3.6, k)];
    const spin = k * 4.5;
    return {
      cls: 'soldier', team: 'red',
      pose: FP.airborne('soldier', p, [S(spin), C(spin), 0.2], [0.3, -0.4, 1], { hL: [0.5, 0.35, 0.2], hR: [-0.45, 0.4, 0.1] })
    };
  }

  function boomBehind(t) {
    const u = seg(t, 4.9, 6.6);
    if (u <= 0) return [];
    return [{ p: [1.2, 1.5, -9.5], u, s: 5.5, seed: 4 }];
  }

  function shotDusk(t) {
    const k = ease(seg(t, 0, 6.38));
    const eye = V3.lerp([-0.3, 0.75, -0.6], [0.0, 0.95, -1.5], k);
    const flash = seg(t, 4.95, 5.5) * (1 - seg(t, 5.9, 6.38) * 0.5);
    const actors = t > 5.55 ? [flung(t)] : [];
    return field({
      shot: 'dusk', camera: cam(eye, [0.9, 1.7, -5.5], 44), items: [treeItem(), perchRock(), crowAt(t)], actors, actorOpts: { tint: [0.35, 0.3, 0.3] },
      glows: sunGlow([{ p: [1.2, 3, -12], s: 30 * flash, a: flash, tint: [1, 0.95, 0.8] }]), booms: boomBehind(t), fade: 1 - seg(t, 0.2, 1.3)
    });
  }

  function shotFlung(t) {
    const flash = 1 - seg(t, 6.4, 7.25) * 0.6;
    return field({
      shot: 'flung', camera: cam([0.5, 1.3, -1.2], [0.9, 2.7, -5.2], 46), items: [treeItem()], actors: [flung(t)], actorOpts: { tint: [0.3, 0.27, 0.27] },
      glows: sunGlow([{ p: [1.2, 3, -12], s: 26, a: flash, tint: [1, 0.95, 0.8] }]), booms: boomBehind(t)
    });
  }

  function shotDemoRun(t) {
    const u = t - 7.257;
    const at = [lerp(2.0, -0.4, u / 1.46), 0, lerp(-1.5, -0.6, u / 1.46)];
    at[1] = H(at[0], at[2]);
    const ph = u * 1.7;
    const pose = Sh.poseRun(Demo.D, { at, yaw: -1.2, phase: ph, lean: 0.38, hL: [Demo.D.shX + 0.04, 0.08 + 0.1 * S(ph * PI * 2), 0.18 - 0.2 * S(ph * PI * 2)], hR: [-(Demo.D.shX + 0.04), 0.08 - 0.1 * S(ph * PI * 2), 0.18 + 0.2 * S(ph * PI * 2)] });
    const dm = demoState(pose, null, { face: demoFace(t, DX.charge) });
    const head = M4.point(dm.m.head, [0, 0, 0]);
    const eye = V3.add(head, [-0.75, -0.08, 0.62]);
    const boom = seg(t, 8.45, 8.72);
    return field({
      shot: 'demoRun', camera: Sh.shaken(cam(eye, V3.add(head, [0.1, -0.15, 0]), 44), t, 0.02, 3), demo: dm,
      booms: boom > 0 ? [{ p: V3.add(head, [-0.6, -0.6, -0.3]), u: boom * 0.3, s: 1.6, seed: 8 }] : [], glows: sunGlow(), white: boom * 0.4
    });
  }

  function shotFlash() {
    return field({ shot: 'flash', camera: cam([0, 1.5, 2], [0, 1.4, -4], 50), wash: [1, 0.55, 0.2, 0.92] });
  }

  function shotTumble(t) {
    const u = seg(t, 8.8, 10.0);
    const fly = seg(t, 8.8, 9.35);
    const p0 = [1.6, 1.8, -1.6], p1 = [0.2, 0.3, -0.4];
    let pose;
    if (fly < 1) {
      const p = V3.lerp(p0, p1, fly);
      p[1] += S(fly * PI) * 0.6;
      const spin = fly * 5;
      pose = Sh.poseAir(Scout.D, { p, up: [S(spin), C(spin), 0.1], fwd: [0.2, -0.3, 1], tuck: 0.6 });
    } else {
      const k = seg(t, 9.35, 10.0);
      pose = Sh.poseSupine(Scout.D, { at: [lerp(0.2, -0.5, k), H(-0.2, -0.3), lerp(-0.4, -0.2, k)], yaw: -1.4 + k * 0.8, h: 0.16 + S(k * PI) * 0.15, nk: [0.3, 0.4, 0] });
    }
    const sc = scoutState(pose, null, { face: scoutFace(t, SX.scream) });
    const c = M4.point(sc.m.chest, [0, 0, 0]);
    return field({
      shot: 'tumble', camera: Sh.shaken(cam(V3.add(c, [-0.6, 0.6, 2.4]), c, 50), t, 0.06, 5), scout: sc,
      dust: [{ p: V3.add(c, [0.2, -0.2, 0]), u: (u * 1.6) % 1, s: 0.6, a: 0.7 }, { p: V3.add(c, [-0.3, -0.25, 0.2]), u: (u * 1.6 + 0.4) % 1, s: 0.8, a: 0.6 }],
      blur: 0.45
    });
  }

  const CRAWL_AT = [0.0, 0, 0.2];

  function crawlState(t, speed) {
    const at = [CRAWL_AT[0] - (t - 10.0) * speed, 0, CRAWL_AT[2]];
    at[1] = H(at[0], at[2]);
    const pose = Sh.poseCrawl(Scout.D, { at, yaw: -PI / 2, phase: t * 0.9, hipH: 0.5, nk: [-0.6, 0, 0] });
    return { at, sc: scoutState(pose, null) };
  }

  function bombs(t, from, to, t0, t1) {
    const items = [];
    const glows = [];
    for (let i = 0; i < 3; i++) {
      const k = seg(t, t0 + i * 0.08, t1 + i * 0.08);
      if (k <= 0 || k >= 1) continue;
      const a = V3.add(from, [i * 0.5 - 0.5, i * 0.3, 0]);
      const b = V3.add(to, [i * 0.7 - 0.7, 0, i * 0.4]);
      const p = V3.lerp(a, b, k);
      p[1] += S(k * PI) * 0.8;
      items.push({ kind: 'bomb', M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotX(t * 9 + i), M4.scale(1.3, 1.3, 1.3)) });
      glows.push({ p: V3.add(p, [0.02, 0.18, 0]), s: 0.35, a: 0.9, tint: [1, 0.6, 0.25] });
    }
    return { items, glows };
  }

  function shotCrawl(t) {
    const { at, sc } = crawlState(t, 0.18);
    sc.face = scoutFace(t, t < 12.6 ? SX.yell : SX.scream, { look: t > 12.8 ? [0.3, 0.3] : [0, -0.1] });
    const head = M4.point(sc.m.head, [0, 0, 0]);
    const back = seg(t, 12.9, 13.3);
    const eye = back > 0 ? V3.add(head, [0.42, 0.16, 0.28]) : V3.add(head, [0.45, -0.05, 0.85]);
    const look = back > 0 ? V3.add(head, [-1.6, 0.35, -0.9]) : V3.add(head, [0.45, -0.1, 0]);
    const b = bombs(t, [-3.2, 2.6, -1.6], [at[0], at[1], at[2]], 12.6, 15.4);
    return field({
      shot: 'crawl', camera: Sh.shaken(cam(eye, look, back > 0 ? 50 : 46), t, 0.01, 7), scout: sc, items: b.items, glows: sunGlow(b.glows),
      dust: [{ p: V3.add(at, [0, 0.05, 0]), u: (t * 1.3) % 1, s: 0.3, a: 0.5 }]
    });
  }

  function shotCrawlWide(t) {
    const { at, sc } = crawlState(t, 0.18);
    sc.face = scoutFace(t, SX.scream, { look: [0.2, 0.4] });
    const head = M4.point(sc.m.head, [0, 0, 0]);
    const push = ease(seg(t, 14.45, 14.76));
    const wide = V3.add(at, [1.5, 1.6, 4.2]);
    const close = M4.point(sc.m.head, [0.0, 0.06, 0.5]);
    const eye = V3.lerp(wide, close, push);
    const look = V3.lerp(V3.add(at, [0, 0.4, 0]), head, push);
    const b = bombs(t, [-3.2, 2.6, -1.6], [at[0], at[1], at[2]], 12.6, 15.4);
    return field({ shot: 'crawlWide', camera: cam(eye, look, lerp(44, 36, push)), scout: sc, items: b.items, glows: sunGlow(b.glows) });
  }

  function shotBoom(t) {
    const u = seg(t, 15.05, 17.1);
    const at = [CRAWL_AT[0] - 5.0 * 0.18, 0, CRAWL_AT[2]];
    at[1] = H(at[0], at[2]);
    const b = bombs(t, [-3.2, 2.6, -1.6], at, 12.6, 15.4);
    const booms = t > 15.05 ? [{ p: V3.add(at, [0, 0.5, 0]), u: Math.min(1, u * 1.3), s: 3.2, seed: 12 }, { p: V3.add(at, [0.8, 0.4, -0.6]), u: Math.min(1, (u - 0.08) * 1.3), s: 2.4, seed: 13 }] : [];
    const throwK = seg(t, 16.3, 17.12);
    const sc = throwK > 0 ? scoutState(Sh.poseAir(Scout.D, { p: V3.add(at, [lerp(0, 3.4, throwK), 0.8 + S(throwK * PI) * 2.2, lerp(0, 5.2, throwK)]), up: [S(throwK * 6), C(throwK * 6), 0.2], fwd: [0, 0, 1], tuck: 0.4 }), null, { face: scoutFace(t, SX.scream) }) : null;
    const debris = [];
    if (u > 0) {
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4;
        const k = Math.min(1, u * 1.4);
        const p = V3.add(at, [C(a) * k * 3, 0.5 + k * (2.5 + (i % 3)) - k * k * 3, S(a) * k * 2]);
        debris.push({ kind: 'rock', i: i % 4, M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(a + t * 4), M4.scale(0.12, 0.12, 0.12)) });
      }
    }
    return field({
      shot: 'boom', camera: cam(V3.add(at, [2.6, 1.6, 6.2]), V3.add(at, [0, 1.0, 0]), 42), items: b.items.concat(debris), scout: sc, booms, glows: sunGlow(b.glows),
      dust: u > 0 ? [{ p: V3.add(at, [0, 0.3, 0]), u: u, s: 3.5, a: 0.8, tint: [0.3, 0.27, 0.25] }] : []
    });
  }

  function shotDeadScout(t) {
    const at = [0.0, 0, 0.5];
    at[1] = H(at[0], at[2]);
    const pose = Sh.poseSupine(Scout.D, { at, yaw: PI / 2, nk: [0.3, 0.75, 0.15] });
    const sc = scoutState(pose, null, { face: scoutFace(t, SX.dead, { blink: 0.85 }) });
    const head = M4.point(sc.m.head, [0, 0, 0]);
    const walk = ease(seg(t, 17.3, 17.9));
    const dp = V3.add(head, [lerp(0.65, 0.18, walk), -0.12, 0.2]);
    const dove = { M: M4.chain(M4.translate(dp[0], dp[1], dp[2]), M4.rotY(-PI / 2 + 0.4 + 0.2 * S(t * 3)), M4.rotX(-0.1 + 0.15 * S(t * 2))) };
    const eye = M4.point(sc.m.head, [0.06, 0.06, 0.44]);
    return field({
      shot: 'deadScout', env: ENV.dusk, camera: cam(eye, M4.point(sc.m.head, [0.02, 0.0, 0.03]), 46), scout: sc, doves: [dove], crack: 0.75, glows: sunGlow()
    });
  }

  window.MedAct1 = { shotDusk, shotFlung, shotDemoRun, shotFlash, shotTumble, shotCrawl, shotCrawlWide, shotBoom, shotDeadScout };
})();
