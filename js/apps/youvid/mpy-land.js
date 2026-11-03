(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Sh = window.MpyShots;
  const Pyro = window.MeetPyro;
  const Baby = window.MpyBaby;
  const Sets = window.MpySets;
  const { seg, spline, cam, ENV, standPose, walkPose, runPose, airPose, pyroState, holding, hipFlamer, chestOf, hand, headPos, giggle, frameAt } = Sh;

  const LAND = ENV.land;

  function landPyro(st) {
    return Object.assign(st, { land: true });
  }

  function blowerPyro(o) {
    const pose = standPose({ at: o.at, yaw: o.yaw, sp: o.sp || [0.08, 0.1, 0], nk: o.nk || [-0.05, 0, 0], spread: o.spread === undefined ? 0.12 : o.spread, fL: o.fL || [0, 0.14], fR: o.fR || [0, -0.1], drop: o.drop });
    const G = hipFlamer(pose, { pitch: o.pitch || 0, yaw: o.gunYaw === undefined ? 0.1 : o.gunYaw, y: o.gy === undefined ? -0.06 : o.gy, z: 0.26 });
    return landPyro(holding(pose, G, 'rainblower'));
  }

  function lolliPyro(pose, raise, swing) {
    const ch = chestOf(pose);
    const r = raise === undefined ? 0 : raise;
    const sw = swing || 0;
    const grip = M4.point(ch, [lerp(-0.3, -0.18, r) + sw * 0.25, lerp(-0.1, 0.62, r) - sw * 0.5, lerp(0.25, 0.12, r) + sw * 0.35]);
    const up = V3.norm(M4.dir(ch, [lerp(-0.1, -0.15, r) + sw * 0.6, 1 - sw * 0.6, lerp(0.35, -0.1, r) + sw * 0.8]));
    const side = V3.norm(V3.cross(up, M4.dir(ch, [0, 0, 1])));
    const fwd = V3.cross(side, up);
    const G = new Float32Array([side[0], side[1], side[2], 0, up[0], up[1], up[2], 0, fwd[0], fwd[1], fwd[2], 0, grip[0], grip[1], grip[2], 1]);
    const Gs = M4.mul(G, M4.translate(0, 0.42, 0));
    const R = hand(V3.sub(grip, V3.mul(up, 0.03)), V3.mul(side, -1), fwd, 'grip');
    const L = hand(M4.point(ch, [0.3, -0.2 + r * 0.2, 0.15]), M4.dir(ch, [0.2, -1, 0.3]), M4.dir(ch, [-1, 0, 0]), 'open');
    const p = Object.assign({}, pose, { eR: [-0.7, -0.2, -0.3], eL: [0.7, -0.4, -0.3] });
    return landPyro(pyroState(p, { L, R }, { weapon: { kind: 'lolli', M: M4.mul(Gs, M4.translate(0, -0.42, 0)), key: 'swirl' } }));
  }

  function bob(t, seed, amp) {
    return S(t * 3.1 + seed) * (amp || 0.08);
  }

  function babyAt(kind, t, o) {
    const at = o.at;
    const st = Baby.pose(Object.assign({ t: t + (o.seed || 0), at: [at[0], at[1] + bob(t, o.seed || 0, o.bob), at[2]], kick: 0.25 }, o));
    return { kind, st, face: o.face || giggle(t, o.seed || 0) };
  }

  function flowersAround(cx, cy, cz, n, r, seed, s) {
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = g() * PI * 2, d = Math.sqrt(g()) * r;
      out.push({ p: [cx + C(a) * d, cy + 0.12 + g() * 0.1, cz + S(a) * d], s: (s || 0.28) * (0.7 + g() * 0.6), tex: ['flowerPink', 'flowerBlue', 'flowerWhite'][i % 3], spin: g() * 6, fog: true });
    }
    return out;
  }

  function cloudsAt(list) {
    return list.map(([x, y, z, s]) => ({ p: [x, y, z], s: [s * 2, s], tex: 'landCloud', fog: false }));
  }

  function sparkTrail(pts, t, n, seed, size) {
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < n; i++) {
      const k = frac(g() + t * 0.15);
      const x = k * (pts.length - 1);
      const j = Math.min(pts.length - 2, Math.floor(x));
      const p = V3.lerp(pts[j], pts[j + 1], x - j);
      out.push({ p: V3.add(p, [(g() - 0.5) * 1.6, (g() - 0.3) * 1.4, (g() - 0.5) * 1.6]), s: (size || 0.5) * (0.5 + g()), tint: [[1, 1, 1], [1, 0.8, 0.95], [0.8, 0.95, 1], [1, 1, 0.8]][i % 4] });
    }
    return out;
  }

  function arc(a, b, h, n) {
    const out = [];
    for (let i = 0; i <= (n || 24); i++) {
      const k = i / (n || 24);
      const p = V3.lerp(a, b, k);
      p[1] += S(k * PI) * h;
      out.push(p);
    }
    return out;
  }

  function hillTop() {
    return [0, Sets.valleyH(0, 0), 0];
  }

  function shotLenses(t) {
    const top = hillTop();
    const eye = V3.add(top, [0.05, 1.62, 0.1]);
    const look = V3.add(eye, [0.8, -0.35, 4]);
    const flash = 1 - seg(t, 53.26, 53.36);
    const blowerM = M4.chain(M4.translate(eye[0] - 0.3, eye[1] - 0.36, eye[2] + 0.42), M4.rotY(0.1), M4.rotX(0.25));
    const rb = arc(M4.point(blowerM, [0, 0.1, 1.0]), [-26, 6, 34], 6, 20);
    return {
      shot: 'lenses', kind: '3d', set: 'valley', env: LAND, camera: cam(eye, look, 52), land: true,
      props: [{ kind: 'lolli', M: M4.chain(M4.translate(eye[0] + 0.62, eye[1] - 0.05, eye[2] + 1.0), M4.rotY(-0.4)), key: 'swirlY', R: 0.13 }, { kind: 'lolli', M: M4.chain(M4.translate(eye[0] + 0.78, eye[1] - 0.32, eye[2] + 1.3), M4.rotY(-0.2)), key: 'swirlP', R: 0.1 }],
      weaponProps: [{ kind: 'rainblower', M: blowerM }], rainbows: [{ pts: rb, width: 1.2, alpha: 0.7, grow: seg(t, 53.3, 55.5), taper: true }],
      sprites: flowersAround(eye[0] + 0.55, eye[1] - 0.7, eye[2] + 0.9, 6, 0.35, 3, 0.28).concat(flowersAround(eye[0], eye[1] - 1.55, eye[2] + 2.0, 18, 1.4, 4, 0.3)), sparkles: sparkTrail(rb, t, 16, 4, 0.4), backSprites: cloudsAt([[20, 30, 90, 14], [-30, 34, 110, 18]]),
      lens: { rim: 0.35 }, white: flash * 0.9
    };
  }

  const RB_VALLEY = (t, G) => arc(M4.point(G, [0, 0.1, 1.02]), [-34, 4, 52], 9, 30);

  function shotValley(t) {
    const u = t - 55.888;
    const top = hillTop();
    if (t < 60.15) {
      const swing = spline([[55.9, -0.5], [56.6, 0.1], [57.4, 0.45], [58.5, 0.5], [60.2, 0.4]])(t);
      const st = blowerPyro({ at: top, yaw: -2.5 + swing * 0.45, pitch: 0.22, sp: [0.12, -swing * 0.4, 0], nk: [-0.15, -0.2, 0] });
      const pan = ease(seg(t, 56.4, 59.9));
      const eye = V3.add(top, [lerp(1.7, 1.0, pan), 0.5, lerp(-2.5, -2.3, pan)]);
      const at = V3.lerp(V3.add(top, [-2.3, 1.05, 1.2]), [-24, 4, 34], pan);
      const rb = RB_VALLEY(t, st.weapon.M);
      const hamK = seg(t, 59.72, 60.18);
      const view = V3.norm(V3.sub(at, eye));
      const rightV = V3.norm(V3.cross(view, [0, 1, 0]));
      const hamP = V3.add(eye, V3.add(V3.mul(view, 0.75), V3.add(V3.mul(rightV, lerp(1.5, -1.5, hamK)), [0, 0.3, 0])));
      const nearHam = t > 59.6 ? [{ kind: 'hamster', M: M4.chain(M4.translate(hamP[0], hamP[1], hamP[2]), M4.rotY(Math.atan2(-rightV[0], -rightV[2])), M4.rotX(0.6), M4.scale(0.95, 0.95, 0.95)) }] : [];
      return {
        shot: 'valley', kind: '3d', set: 'valley', env: LAND, camera: cam(eye, at, 46), pyro: st, land: true,
        rainbows: [{ pts: rb, width: 2.2, alpha: 0.75, grow: seg(t, 56.0, 58.6), taper: true, glow: true }], sparkles: sparkTrail(rb, t, 40, 5, 0.9),
        sprites: flowersAround(top[0] + 0.2, top[1] - 0.1, top[2] - 0.6, 26, 1.8, 6, 0.28), backSprites: cloudsAt([[30, 26, 80, 12], [-10, 30, 100, 16], [60, 22, 90, 10]]),
        props: [{ kind: 'hamster', M: M4.chain(M4.translate(14, 12, 26), M4.rotY(-1), M4.scale(1.6, 1.6, 1.6)) }].concat(nearHam)
      };
    }
    const k = ease(seg(t, 61.7, 63.39));
    const eye = [lerp(2.7, 1.2, k), 1.3, -5.6];
    const at = V3.lerp([4.3, 0.85, -1.6], [-2.5, 2.4, 10], k);
    const peek = seg(t, 60.6, 61.0) * (1 - seg(t, 61.5, 61.8));
    const fly = seg(t, 61.9, 63.4);
    const bh = fly > 0 ? V3.lerp([4.0, 2.2, -1.0], [-2.4, 4.0, 14], ease(fly)) : [4.0, lerp(1.45, 2.05, peek), -1.0];
    return {
      shot: 'valley', kind: '3d', set: 'path', env: LAND, camera: cam(eye, at, 46), land: true,
      props: pathProps().concat([{ kind: 'sandwich', M: M4.chain(M4.translate(4.3, 0.2, -2.4), M4.rotY(-0.55), M4.rotX(-0.85), M4.rotZ(-0.1), M4.scale(0.6, 0.6, 0.6)) }]),
      babies: [babyAt('heavy', t, { at: bh, yaw: fly > 0 ? 0.6 : PI, arms: fly > 0 ? { L: [0.9, 0.5, 0.2], R: [-0.9, 0.5, 0.2] } : null, seed: 1 })],
      backSprites: cloudsAt([[10, 20, 60, 10], [-20, 24, 70, 12]]), sprites: flowersAround(-3, 0.1, 4, 20, 4, 9, 0.35)
    };
  }

  function pathProps() {
    const c = (k) => Sets.pathCurve(k);
    const cot = c(0.52);
    const list = [{ kind: 'cottage', M: M4.chain(M4.translate(cot[0] - 4.2, Sets.pathH(cot[0] - 4.2, cot[2]), cot[2]), M4.rotY(0.6)) }];
    [[-3, 9, 'treePink'], [-4.5, 11, 'treeBlue'], [3.5, 14, 'treePurple'], [-6.5, 15, 'treeYellow'], [5, 18, 'treeOrange'], [-2.2, 17, 'treePink']].forEach(([x, z, which]) => list.push({ kind: 'tree', M: M4.translate(x, Sets.pathH(x, z), z), which }));
    return list;
  }

  function shotPath(t) {
    const k = seg(t, 63.396, 65.064);
    const bh = V3.lerp([1.0, 2.3, 7.5], [0.5, 1.55, 1.8], ease(k));
    return {
      shot: 'path', kind: '3d', set: 'path', env: LAND, camera: cam([0.4, 1.2, -1.2], [1.0, 1.9, 8], 44), land: true, props: pathProps(),
      babies: [babyAt('heavy', t, { at: bh, yaw: PI - 0.15, arms: { L: [0.95, 0.4, 0.2], R: [-0.95, 0.4, 0.2] }, seed: 2, face: Object.assign(giggle(t, 2), { jaw: 0.6 }) })],
      sprites: flowersAround(0, 0.05, 2, 26, 5, 11, 0.3), backSprites: cloudsAt([[10, 18, 60, 10], [-14, 22, 70, 12]]), blur: t < 63.44 ? 0.7 : 0
    };
  }

  function hillProps(cx, cy, cz) {
    const list = [{ kind: 'hill', M: M4.chain(M4.translate(cx, cy - 4.4, cz), M4.scale(7, 4.6, 7)) }];
    [[-3.6, 2.4, 1.0, 'swirlY', 1.3], [-2.5, 1.4, 2.2, 'swirl', 0.6], [3.2, 1.9, 1.4, 'swirlR', 0.95], [4.0, 1.1, 2.4, 'swirlG', 0.65], [2.0, 0.8, 3.0, 'swirlY', 0.35], [-1.4, 0.8, 3.2, 'swirlP', 0.35]].forEach(([x, y, z, key, R]) => list.push({ kind: 'lolli', M: M4.chain(M4.translate(cx + x, cy + y, cz + z), M4.rotY(-x * 0.08)), key, R }));
    return list;
  }

  function shotLolliHill(t) {
    const u = t - 65.064;
    const raise = ease(seg(t, 66.2, 66.9));
    const pose = standPose({ at: [0, 0.2, 0], yaw: 0.15 + S(u * 1.2) * 0.1, sp: [0.05, 0.1, 0], nk: [-0.05, 0, 0], spread: 0.18 });
    const st = lolliPyro(pose, raise, 0);
    const ham = (seed, base) => {
      const p = V3.add(base, [S(t * 0.8 + seed) * 0.6, S(t * 1.6 + seed) * 0.3, 0]);
      return { kind: 'hamster', M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(PI + seed), M4.rotZ(S(t * 2 + seed) * 0.2), M4.scale(0.55, 0.55, 0.55)) };
    };
    return {
      shot: 'lollihill', kind: '3d', set: 'hill', env: LAND, camera: cam([0.1, 0.75, 6.4], [0, 1.75, 0], 40), pyro: st, land: true,
      props: hillProps(0, 0.2, 0).concat([ham(1, [-2.6, 3.9, -1]), ham(2, [3.0, 4.4, -2])]), sprites: flowersAround(0, 0.25, 2.6, 22, 1.6, 13, 0.24), backSprites: cloudsAt([[-12, 9, -30, 9], [14, 12, -36, 10]])
    };
  }

  function shotBabyHeavy(t) {
    const u = t - 67.942;
    const cot = Sets.pathCurve(0.52);
    const bh = [cot[0] - 0.7, 1.65 + seg(t, 68.4, 69.27) * 0.6, cot[2] - 4.4];
    return {
      shot: 'babyheavy', kind: '3d', set: 'path', env: LAND, camera: cam([cot[0] + 0.25, 1.35, cot[2] - 7.4], [cot[0] - 1.1, 1.95, cot[2]], 40), land: true, props: pathProps(),
      babies: [babyAt('heavy', t, { at: bh, yaw: PI + 0.2, arms: { L: [0.6, 1, 0.2], R: [-0.6, 1, 0.2] }, seed: 3, face: Object.assign(giggle(t, 3), { browUp: 0.9, browInUp: 0.6, jaw: 0.75 }) })],
      sprites: flowersAround(cot[0], 0.1, cot[2] - 4, 18, 3, 15, 0.3), backSprites: cloudsAt([[20, 22, 60, 12]])
    };
  }

  function meadowProps() {
    const list = [{ kind: 'shell', M: M4.chain(M4.translate(4.2, 1.0, 10), M4.rotY(-PI / 2 + 0.5), M4.scale(1.4, 1.4, 1.4)) }, { kind: 'shell', M: M4.chain(M4.translate(8, 0.75, 14), M4.rotY(-PI / 2 + 0.3)) }, { kind: 'shell', M: M4.chain(M4.translate(1.2, 0.5, 18), M4.rotY(-PI / 2 + 0.6), M4.scale(0.7, 0.7, 0.7)) }];
    [[6.5, 9, 'treeBlue'], [3, 7, 'treePink'], [9, 12, 'treePurple'], [-4, 14, 'treeOrange'], [-7, 18, 'treeYellow'], [-9, 11, 'treePink'], [-12, 24, 'treeBlue'], [12, 22, 'treeOrange'], [-2, 26, 'treePink'], [5, 28, 'treePurple']].forEach(([x, z, which], i) => list.push({ kind: 'tree', M: M4.chain(M4.translate(x, 0, z), M4.scale(1 + (i % 3) * 0.2, 1 + (i % 2) * 0.3, 1 + (i % 3) * 0.2)), which }));
    return list;
  }

  function meadowBase(extra) {
    return Object.assign({ kind: '3d', set: 'meadow', env: LAND, land: true, props: meadowProps(), backSprites: cloudsAt([[-10, 16, 50, 9], [16, 18, 60, 11], [40, 14, 70, 8]]) }, extra);
  }

  function shotMeadow(t) {
    const k = seg(t, 69.277, 73.489);
    const bh = V3.lerp([-3, 2.2, 9], [-10, 2.6, 26], ease(k));
    const run = seg(t, 72.6, 73.49);
    const babies = [babyAt('heavy', t, { at: bh, yaw: -0.6, arms: { L: [0.9, 0.3, 0.3], R: [-0.9, 0.3, 0.3] }, seed: 4, scale: 1 })];
    let pyro = null;
    if (run > 0) {
      const pose = runPose({ at: [lerp(3.5, 1.8, run), 0, lerp(2.0, 4.6, run)], yaw: -0.5, phase: t * 1.9 });
      pyro = lolliPyro(pose, 0.4, 0);
    }
    return meadowBase({ shot: 'meadow', camera: cam([1.2, 1.2, -1.5], [-1.5, 1.7, 12], 46), babies, pyro, sprites: flowersAround(0, 0.05, 4, 24, 5, 17, 0.3), blur: t < 69.32 ? 0.6 : 0 });
  }

  function shotJump(t) {
    const k = seg(t, 73.489, 74.907);
    const p = [lerp(1.6, -1.8, k), 1.0 + S(k * PI) * 1.3, lerp(4.4, 7.5, k)];
    const pose = airPose({ p, fwd: [-0.6, 0.1, 0.8], sp: [0.2, -0.2, 0], tuck: 0.6 });
    const st = lolliPyro(pose, 1, 0);
    const bh = [-10.5, 2.6, 26];
    return meadowBase({ shot: 'jump', camera: cam([0.6, 1.3, -0.5], [-1.2, 2.0, 8], 46), pyro: st, babies: [babyAt('heavy', t, { at: bh, yaw: 0.5, seed: 4 })], sprites: flowersAround(0, 0.05, 4, 24, 5, 17, 0.3), blur: t < 73.53 ? 0.6 : 0 });
  }

  function shotLeap(t) {
    const k = seg(t, 74.907, 75.742);
    const p = [lerp(-1.5, -7.5, k), 1.2 + S(k * PI) * 2.2, lerp(9, 20, k)];
    const pose = airPose({ p, fwd: [-0.5, 0.1, 0.85], sp: [0.25, 0, 0], tuck: 0.5 });
    const st = lolliPyro(pose, 1, 0);
    return meadowBase({ shot: 'leap', camera: cam([1.4, 1.5, 0.5], [-4.0, 2.8, 16], 44), pyro: st, babies: [babyAt('heavy', t, { at: [-10.5, 2.4, 26], yaw: PI - 0.5, seed: 4, arms: { L: [0.7, 0.9, 0.2], R: [-0.7, 0.9, 0.2] } })] });
  }

  function shotBonk(t) {
    const swing = ease(seg(t, 76.5, 76.95));
    const hit = seg(t, 76.9, 78.8);
    const pose = standPose({ at: [0.85, 0, -0.6], yaw: -0.5, sp: [0.15, lerp(-0.4, 0.5, swing), 0], nk: [-0.1, -0.1, 0], spread: 0.15 });
    const st = lolliPyro(pose, lerp(1, 0.2, swing), swing);
    const bh = hit > 0 ? V3.add([0.15, 1.5, 1.25], [-hit * 6, S(hit * PI) * 1.5, hit * 7]) : [0.15, 1.5 + bob(t, 5, 0.05), 1.25];
    const spin = hit * 9;
    return meadowBase({
      shot: 'bonk', camera: cam([0.55, 1.62, -1.15], [-0.2, 1.45, 3.2], 46), pyro: st,
      babies: [babyAt('heavy', t, { at: bh, yaw: PI + 0.6 + spin, roll: hit * 0.8, seed: 5, arms: { L: [0.9, 0.3, 0.3], R: [-0.9, 0.3, 0.3] }, face: hit > 0 ? Object.assign(giggle(t, 5), { jaw: 0.8 }) : giggle(t, 5) })],
      sparkles: hit > 0 && hit < 0.25 ? [{ p: [0.15, 1.7, 1.25], s: 0.9 * (1 - hit * 4) + 0.2 }] : [], blurMid: 0.0, blur: 0.04
    });
  }

  function shotBabyScout(t) {
    const k = seg(t, 78.828, 80.872);
    const p = [lerp(0.3, -0.3, k), 6.95 + bob(t, 6, 0.15), 2.0];
    return {
      shot: 'babyscout', kind: '3d', set: 'valley', env: LAND, camera: cam([0, 7.6, -1.5], [0.4, 5.4, 12], 46), land: true,
      babies: [babyAt('scout', t, { at: p, yaw: PI - 0.3, pitch: 0.2, arms: { L: [0.8, 0.4, 0.3], R: [-0.8, 0.4, 0.3] }, seed: 6 })],
      rainbows: [{ pts: arc([-30, 1, 30], [30, 1, 50], 2, 30), width: 3, alpha: 0.6 }, { pts: arc([-20, 1, 60], [40, 1, 35], 3, 30), width: 2.4, alpha: 0.5 }], backSprites: cloudsAt([[-12, 14, 50, 10], [20, 16, 60, 12]])
    };
  }

  function forestProps() {
    const list = [];
    [[-1.6, 1.5, 'treePink'], [-2.6, 3.5, 'treeOrange'], [1.8, 2.5, 'treePurple'], [3.0, 4.5, 'treePink'], [-0.5, 5, 'treeBlue'], [1.0, 6.5, 'treeYellow']].forEach(([x, z, which], i) => list.push({ kind: 'tree', M: M4.chain(M4.translate(x, 0, z), M4.scale(1.3, 1.5 + (i % 2) * 0.3, 1.3)), which }));
    return list;
  }

  function shotForest(t) {
    const st = blowerPyro({ at: [0.1, 0, 0.5], yaw: PI - 0.1, pitch: -0.1, gunYaw: 0.55, sp: [0.05, 0.25, 0] });
    return Object.assign(meadowBase({ shot: 'forest', camera: cam([0.0, 1.4, -2.2], [0.1, 1.35, 0.5], 46), pyro: st,
      babies: [babyAt('heavy', t, { at: [1.1, 1.75, 1.8], yaw: PI + 0.3, seed: 7, arms: { L: [0.5, 0.9, 0.3], R: [-0.7, 0.2, 0.3] } }), babyAt('scout', t, { at: [-0.8, 2.6, 2.4], yaw: PI - 0.3, seed: 8 })] }), { props: forestProps() });
  }

  function shotScoutClose(t) {
    const u = t - 81.914;
    const pose = standPose({ at: [-0.45, 0, 0.4], yaw: PI - 0.35, sp: [0.05, 0, 0], nk: [-0.1, 0.25, -0.1] });
    const st = lolliPyro(pose, 0.55, 0);
    const bs = babyAt('scout', t, { at: [0.32, 1.22, 0.05], yaw: PI + 0.55, seed: 9, scale: 1.0, face: Object.assign(giggle(t, 9), { jaw: 0.25 + Math.abs(S(u * 6)) * 0.2 }) });
    return Object.assign(meadowBase({ shot: 'scoutclose', camera: cam([-0.15, 1.6, -0.75], [0.0, 1.58, 0.4], 44), pyro: st, babies: [bs] }), { props: forestProps() });
  }

  function shotBubbles(t) {
    const k = seg(t, 84.917, 88.004);
    const p = [lerp(-1.2, 1.4, k), 1.2 + S(k * PI) * 0.5, 2];
    const g = rand(19);
    const bubbles = [];
    for (let i = 0; i < 26; i++) {
      const q = frac(g() + t * 0.08 * (0.5 + g()));
      bubbles.push({ p: [p[0] + (g() - 0.5) * 3, 0.4 + q * 3, p[2] + (g() - 0.5) * 2], s: 0.12 + g() * 0.3, spin: g() * 6 });
    }
    return meadowBase({
      shot: 'bubbles', camera: cam([p[0] - 0.2, 1.4, 0.6], [p[0], 1.3, 2], 46),
      babies: [babyAt('scout', t, { at: p, yaw: PI + k * 8, roll: k * 5, pitch: 0.6, seed: 10 })], bubbles, blur: t < 84.96 ? 0.7 : 0.25
    });
  }

  function giftProps(lid) {
    const list = [{ kind: 'gift', M: M4.translate(0, 0, 0), key: 'giftBlue', w: 1.1, h: 0.9, d: 1.0 }];
    if (lid !== false) list.push({ kind: 'gift', M: M4.chain(M4.translate(0, lid ? 1.05 : 0.9, lid ? 0.62 : 0), M4.rotX(lid ? -1.25 : 0)), key: 'giftBlue', w: 1.18, h: 0.12, d: 1.08, bow: lid ? null : 'yellow' });
    [[-1.4, 0.2, 'giftPurple', 0.7], [1.5, 0.4, 'giftPurple', 0.8], [-1.0, 1.4, 'giftPink', 0.5], [1.1, -0.9, 'giftBlue', 0.5], [-2.2, -0.6, 'giftBlue', 0.6]].forEach(([x, z, key, s]) => list.push({ kind: 'gift', M: M4.chain(M4.translate(x, 0, z), M4.rotY(x)), key, w: s, h: s * 0.8, d: s, bow: 'blue' }));
    list.push({ kind: 'garland', M: M4.chain(M4.translate(0, 3.4, 1.5), M4.scale(0.55, 1, 1)) });
    list.push({ kind: 'tree', M: M4.translate(-3, 0, 3), which: 'treePink' }, { kind: 'tree', M: M4.translate(3.5, 0, 4), which: 'treePurple' });
    return list;
  }

  function shotGift(t) {
    const k = ease(seg(t, 88.0, 88.5));
    return Object.assign(meadowBase({
      shot: 'gift', camera: cam([0.05, 1.3, -2.1], [0, 1.15, 0], 40),
      babies: [babyAt('medic', t, { at: [0, lerp(0.2, 0.5, k), 0], yaw: PI, seed: 11, bob: 0.02, arms: { L: [0.9, 0.6, -0.2], R: [-0.9, 0.6, -0.2] } })]
    }), { props: giftProps(true) });
  }

  function shotWave(t) {
    const u = t - 89.547;
    const pose = standPose({ at: [0.35, 0, 0], yaw: PI - 0.2, sp: [0.05, -0.15, 0], nk: [-0.05, 0.2, -0.1] });
    const ch = chestOf(pose);
    const wave = S(u * 12) * 0.08;
    const L = hand(M4.point(ch, [0.52 + wave, 0.5, 0.26]), M4.dir(ch, [0.3, 1, 0.1]), M4.dir(ch, [0, 0, 1]), 'wave');
    const R = hand(M4.point(ch, [-0.3, -0.25, 0.15]), M4.dir(ch, [0, -1, 0.2]), M4.dir(ch, [1, 0, 0]), 'relax');
    const st = landPyro(pyroState(Object.assign({}, pose, { eL: [0.9, -0.2, -0.3] }), { L, R }));
    return meadowBase({
      shot: 'wave', camera: cam([-0.1, 1.5, -1.25], [0.25, 1.42, 0.2], 46), pyro: st,
      babies: [babyAt('scout', t, { at: [-1.1, 1.8, 0.9], yaw: PI - 0.5, seed: 12 }), babyAt('heavy', t, { at: [1.35, 2.3, 1.4], yaw: PI + 0.4, seed: 13 })]
    });
  }

  function shotGiftBack(t) {
    const pose = standPose({ at: [0, 0, -0.9], yaw: 0, sp: [0.3, 0, 0], nk: [-0.2, 0, 0] });
    const ch = chestOf(pose);
    const L = hand([0.32, 1.0, -0.42], [0.1, -0.3, 1], [0, -1, 0.1], 'flat');
    const R = hand([-0.32, 1.0, -0.42], [-0.1, -0.3, 1], [0, -1, 0.1], 'flat');
    const st = landPyro(pyroState(Object.assign({}, pose, { eL: [0.8, -0.5, -0.2], eR: [-0.8, -0.5, -0.2] }), { L, R }));
    return Object.assign(meadowBase({ shot: 'giftback', camera: cam([-0.55, 1.55, -1.9], [0.15, 1.2, 0.2], 46), pyro: st, blur: t < 90.72 ? 0.7 : 0 }), { props: giftProps(false) });
  }

  function townBase(extra) {
    return Object.assign({ kind: '3d', set: 'town', env: LAND, land: true, backSprites: cloudsAt([[-10, 22, 60, 10], [12, 20, 70, 12]]) }, extra);
  }

  function balloons(t, base, n, seed) {
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < n; i++) {
      const p = V3.add(base, [(g() - 0.5) * 2.4, g() * 1.6 + S(t * 1.3 + i) * 0.1, (g() - 0.5) * 1.2]);
      out.push({ kind: 'balloon', M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.scale(1.6, 1.6, 1.6)), tint: [[1, 0.35, 0.35], [0.4, 0.7, 1], [0.5, 0.9, 0.5], [1, 0.85, 0.3], [0.9, 0.5, 0.9]][i % 5] });
    }
    return out;
  }

  function shotTown(t) {
    const k = seg(t, 95.011, 96.971);
    const pose = walkPose({ at: [0.15, 0, lerp(4.2, 3.2, k)], yaw: PI + 0.1, phase: t * 0.9, stride: 0.3 });
    const G = hipFlamer(pose, { pitch: 0.1, yaw: 0.35, y: -0.04 });
    const st = landPyro(holding(pose, G, 'rainblower'));
    return townBase({
      shot: 'town', camera: cam([0.1, 1.3, 1.2], [0.2, 1.6, 8], 50), pyro: st,
      props: balloons(t, [1.5, 3.0, 5.4], 5, 21).concat([{ kind: 'lolli', M: M4.chain(M4.translate(1.7, 0.25, 2.6), M4.rotX(-1.25)), key: 'swirl', R: 0.5, stick: false }]),
      babies: [babyAt('soldier', t, { at: [1.4, 2.6, 5.5], yaw: PI + 0.4, seed: 22, arms: { L: [0.3, 1, 0.1], R: [-0.4, 1, 0.1] } })], blurFar: 0.0, blur: 0.15
    });
  }

  function shotPlaza(t) {
    const u = t - 96.971;
    const rb = arc([6, 0.6, 3], [1.5, 0.5, 6], 2.2, 16);
    return townBase({
      shot: 'plaza', camera: cam([0.2, 1.6, 0.4], [0.0, 1.9, 8], 50),
      props: [{ kind: 'balloonicorn', M: M4.chain(M4.translate(-1.2, 1.1 + S(u * 1.6) * 0.12, 4.4), M4.rotY(-PI / 2 + 0.5), M4.scale(1.7, 1.7, 1.7)) }],
      babies: [babyAt('engineer', t, { at: [1.6, 2.4, 4.6], yaw: PI + 0.3, seed: 23 }), babyAt('spy', t, { at: [-0.4, 2.2, 6.2], yaw: PI - 0.2, seed: 24, arms: { L: [0.4, 0.9, 0.2], R: [-0.9, 0.2, 0.3] } })],
      rainbows: [{ pts: rb, width: 1.4, alpha: 0.7, grow: 1 }], sparkles: sparkTrail(rb, t, 16, 25, 0.35)
    });
  }

  function shotBridge(t) {
    const u = t - 100.933;
    const st = blowerPyro({ at: [-0.5, 0, 12], yaw: PI + 0.3 + S(u * 0.8) * 0.3, pitch: 0.2, gunYaw: 0.2 });
    const rb = arc(M4.point(st.weapon.M, [0, 0.1, 1.02]), [6 + S(u) * 2, 0.8, 6], 2.5, 18);
    const rb2 = arc(M4.point(st.weapon.M, [0, 0.1, 1.02]), [-7, 1.0, 9 + S(u * 0.7) * 2], 2.2, 18);
    const k = seg(t, 104.0, 107.3);
    return townBase({
      shot: 'bridge', camera: cam([0.9, 1.5, 3.2], [-0.6, 1.6, 12], 46), pyro: st,
      props: [{ kind: 'balloonicorn', M: M4.chain(M4.translate(0.5 - k * 1.5, 1.6 + S(u) * 0.15, 9 - k * 3), M4.rotY(PI / 2 - 0.3), M4.scale(1.3, 1.3, 1.3)) }, { kind: 'gumball', M: M4.chain(M4.translate(1.55, 0.35, 5.2), M4.scale(0.35, 0.35, 0.35)) }],
      babies: [babyAt('soldier', t, { at: [1.45, 0.95, 5.3], yaw: -0.1, seed: 26, scale: 1.1, arms: { L: [0.5, -0.5, 0.6], R: [-0.5, -0.5, 0.6] } }), babyAt('demo', t, { at: [lerp(-2.5, -1.2, k), lerp(2.8, 2.0, k), lerp(10, 7, k)], yaw: PI - 0.2, seed: 27 }), babyAt('spy', t, { at: [3, 3.2, 11], yaw: PI + 0.4, seed: 28 })],
      rainbows: [{ pts: rb, width: 1.0, alpha: 0.75, glow: true }, { pts: rb2, width: 0.9, alpha: 0.7 }], sparkles: sparkTrail(rb, t, 22, 29, 0.4).concat(sparkTrail(rb2, t, 16, 30, 0.35))
    });
  }

  function shotDemoLaugh(t) {
    const u = t - 107.357;
    const flash = t < 107.523 ? 0.85 : 0;
    return townBase({
      shot: 'demolaugh', camera: cam([-0.25, 1.45, 0.55], [-0.45, 1.45, 1.5], 44),
      props: [{ kind: 'balloonicorn', M: M4.chain(M4.translate(0.4, 1.2, 4.2), M4.rotY(PI / 2), M4.scale(1.1, 1.1, 1.1)) }],
      babies: [babyAt('demo', t, { at: [-0.5, 1.08, 1.5], yaw: PI - 0.45, seed: 31, face: { smile: 1, jaw: 0.7 + Math.abs(S(u * 14)) * 0.3, wide: 0.7 } }), babyAt('soldier', t, { at: [0.9, 1.2, 2.6], yaw: PI + 0.3, seed: 32 })],
      white: flash, whiteCol: [1, 0.95, 0.6, 1], blur: 0.35
    });
  }

  function shotEpilogueLand(t) {
    const k = seg(t, 124.207, 127.3);
    const pose = walkPose({ at: [0, 0, lerp(0.6, 1.8, k)], yaw: 0.05, phase: t * 0.85, stride: 0.3 });
    const G = hipFlamer(pose, { pitch: 0.2, yaw: 0.4, y: -0.06 });
    const st = landPyro(holding(pose, G, 'rainblower'));
    const ring = seg(t, 127.25, 128.0);
    const pel = st.m.pts.pelvis;
    const eye = [pel[0] + lerp(0.2, 0.12, k), lerp(1.0, 1.15, k), pel[2] + lerp(-1.05, -1.4, k) - ring * 1.2];
    return {
      shot: 'epiland', kind: '3d', set: 'vista', env: ENV.vista, camera: cam(eye, [0, 1.3, 30], 50), pyro: st, land: true, noFrame: true, dark: t < 124.5 ? 1 - seg(t, 124.207, 124.5) : 0,
      props: [[-14, 2, 30, 4], [16, 3, 40, 5], [6, 1.5, 22, 2], [-30, 4, 60, 9], [34, 5, 70, 8]].map(([x, y, z, s], i) => ({ kind: 'gumball', M: M4.chain(M4.translate(x, y, z), M4.scale(s, s, s)), blue: i % 2 === 1 })),
      ring: ring > 0 ? { k: ring } : null, backSprites: cloudsAt([[-30, 24, 90, 18], [30, 30, 100, 20], [0, 36, 120, 24]])
    };
  }

  window.MpyLand = {
    shotLenses, shotValley, shotPath, shotLolliHill, shotBabyHeavy, shotMeadow, shotJump, shotLeap, shotBonk, shotBabyScout, shotForest, shotScoutClose,
    shotBubbles, shotGift, shotWave, shotGiftBack, shotTown, shotPlaza, shotBridge, shotDemoLaugh, shotEpilogueLand
  };
})();
