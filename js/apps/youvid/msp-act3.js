(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, ease } = K;
  const Sh = window.MspShots;
  const Spy = window.MeetSpy;
  const Props = window.MspProps;
  const FP = window.FabPose;
  const A1 = window.MspAct1;
  const A2 = window.MspAct2;
  const { X, seg, track, spyFace, standPose, walkPose, hand, stateOf, chestOf, headPos, gestureAt, withGesture, cam, shake, ENV } = Sh;

  const SENTRY_AT = [0.6, 0, 0.3];
  const SENTRY_M = M4.chain(M4.translate(SENTRY_AT[0], 0, SENTRY_AT[2]), M4.rotY(-PI / 2));
  const LIGHT_DOOR = [-3.6, 1.1, -4.0];

  function redSpyWalk(t, at, yaw, phase, expr, keys) {
    const pose = phase === null ? standPose('spy', { at, yaw, sp: [0.08, 0, 0], nk: [0.05, 0, 0] }) : walkPose('spy', { at, yaw, phase, stride: 0.26 });
    const ch = chestOf('spy', pose);
    const g = gestureAt(ch, keys || [[0, 'loose']], t);
    const st = withGesture('spy', pose, ch, g);
    return { who: 'spy', team: 'red', st, face: spyFace(t, expr || X.sly, { look: [0.25, 0] }, true) };
  }

  function revolverIn(st, side) {
    const hm = st.hands[side || 'R'];
    const M = hm && hm.M ? hm.M : st.m['hand' + (side || 'R')];
    return M4.chain(M, M4.translate(0, -0.075, 0.02), M4.rotX(PI / 2 - 0.25), M4.translate(0, 0.0, 0.06));
  }

  function spyAiming(t, at, yaw, raise) {
    const pose = standPose('spy', { at, yaw, sp: [0.05, -0.2, 0], nk: [0.02, 0.25, 0] });
    const ch = chestOf('spy', pose);
    const k = raise === undefined ? 1 : raise;
    const target = M4.point(ch, [lerp(-0.25, -0.12, k), lerp(-0.3, 0.32, k), lerp(0.1, 0.55, k)]);
    const fingers = V3.norm(M4.dir(ch, [lerp(0, 0.05, k), lerp(-1, 0.05, k), lerp(0.1, 1, k)]));
    const R = hand(target, fingers, M4.dir(ch, [-1, 0, 0]), 'grip');
    const L = hand(M4.point(ch, [0.27, -0.33, 0.04]), M4.dir(ch, [0.05, -1, 0.1]), M4.dir(ch, [-1, 0, 0.1]), 'relax');
    const st = stateOf('spy', Object.assign({}, pose, { eR: [-0.6, -0.6, -0.3] }), { L, R });
    return { who: 'spy', team: 'red', st, face: spyFace(t, X.cold, { look: [0.1, 0] }, true) };
  }

  function engineerState(t, at, yaw, o) {
    const pose = standPose('engineer', Object.assign({ at, yaw, sp: [0.12, 0, 0], nk: [0.05, 0, 0] }, o || {}));
    const ch = chestOf('engineer', pose);
    const work = o && o.work ? S(t * 9) * 0.04 : 0;
    const R = hand(M4.point(ch, [-0.18, 0.05 + work, 0.42]), M4.dir(ch, [0.2, -0.3, 1]), M4.dir(ch, [-0.2, -1, 0]), 'grip');
    const L = hand(M4.point(ch, [0.2, -0.1, 0.36]), M4.dir(ch, [-0.2, -0.4, 1]), M4.dir(ch, [0, -1, 0]), 'relax');
    const st = stateOf('engineer', Object.assign({}, pose, { eR: [-0.7, -0.6, 0], eL: [0.7, -0.6, 0] }), o && o.hands === false ? null : { L, R });
    return { who: 'engineer', team: 'blu', st, face: Object.assign({ smileL: 0, smileR: 0 }, (o && o.face) || {}) };
  }

  function sentryProp(st) {
    return { kind: 'sentry', level: 3, M: SENTRY_M, st: Object.assign({ team: 'blu' }, st || {}) };
  }

  function shadowShot(t) {
    const u = seg(t, 95.791, 96.917);
    const red = redSpyWalk(t, [lerp(-4.8, -2.9, u), 0, -3.05], PI / 2, t * 0.9, X.sly);
    return {
      shot: 'shadow', kind: '3d', set: 'sentry', env: ENV.sentry, camera: cam([-2.4, 1.6, -0.9], [-3.1, 0.0, -2.2], 46),
      heroes: [red], floorShadow: { heroes: [red], dir: V3.norm([0.35, -0.42, 0.85]), y: 0.006 }, props: [sentryProp()], hideHeroes: true
    };
  }

  function corridorRedShot(t) {
    const u = seg(t, 96.917, 98.792);
    const red = redSpyWalk(t, [lerp(-3.4, -2.6, u), 0, lerp(-3.3, -2.8, u)], 2.4 - u * 0.6, t * 0.6, X.sly, [[96.9, 'loose'], [97.6, 'back', 0.6]]);
    const h = headPos(red.st);
    return {
      shot: 'corridorRed', kind: '3d', set: 'sentry', env: ENV.sentry, camera: cam(V3.add(h, [0.75, -0.15, 0.75]), V3.add(h, [0, -0.25, 0]), 44), heroes: [red], props: [sentryProp()]
    };
  }

  function sentryShot(t) {
    const eng = engineerState(t, [0.3, 0, -0.45], 0.38, { work: true, face: { press: 0.3 } });
    const red = redSpyWalk(t, [lerp(3.2, 2.85, seg(t, 98.79, 100.45)), 0, lerp(1.1, 0.85, seg(t, 98.79, 100.45))], -1.95, null, X.sly);
    return {
      shot: 'sentry', kind: '3d', set: 'sentry', env: ENV.sentry, camera: cam([-1.6, 0.85, 0.5], [0.5, 0.95, 0.15], 50),
      heroes: [eng, red], props: [sentryProp({ yaw: S(t * 0.8) * 0.3 })]
    };
  }

  const SAP_START = [-1.6, 0.03, 1.5];
  const SAP_END = [0.36, 0.42, 0.38];

  function sapperM(t) {
    const slide = ease(seg(t, 100.458, 101.04));
    const jump = ease(seg(t, 101.04, 101.4));
    const floor = V3.lerp(SAP_START, [0.25, 0.03, 0.55], slide);
    const p = V3.lerp(floor, SAP_END, jump);
    return M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(-0.9 + slide * 0.6 + jump * 0.4), M4.rotX(-jump * 1.2), M4.rotZ(slide * 0.3));
  }

  function sapperShot(t) {
    const M = sapperM(t);
    const p = M4.point(M, [0, 0, 0]);
    const on = t > 101.08;
    return {
      shot: 'sapper', kind: '3d', set: 'sentry', env: ENV.sentry, camera: cam(V3.add(p, [-0.35, 0.18, 0.55]), V3.add(p, [0.12, 0.02, -0.1]), 48),
      heroes: [engineerState(t, [-0.35, 0, 0.55], PI / 2 + 0.15, { work: true })], props: [sentryProp(), { kind: 'sapper', M }],
      sparks: on ? [{ p, r: 0.12, n: 10 }] : [], motion: t < 101.04 ? 0.4 : 0
    };
  }

  function sappedShot(t) {
    const M = sapperM(t);
    const p = M4.point(M, [0, 0, 0]);
    const react = ease(seg(t, 101.75, 102.1));
    const eng = engineerState(t, [-0.35, 0, 0.55], PI / 2 + 0.15 + react * 0.4, { sp: [0.12 - react * 0.1, 0, 0], nk: [0.1, -react * 0.5, 0], face: { wide: 0.6 * react, round: 0.4 * react } });
    return {
      shot: 'sapped', kind: '3d', set: 'sentry', env: ENV.sentry, camera: cam([1.15, 1.0, 1.35], [0.4, 0.75, 0.25], 50),
      heroes: [eng], props: [sentryProp({ yaw: S(t * 31) * 0.05, pitch: 0.15 }), { kind: 'sapper', M }],
      sparks: [{ p, r: 0.22, n: 14 }, { p: V3.add(p, [0.1, 0.35, -0.1]), r: 0.18, n: 8 }]
    };
  }

  function boomShot(t) {
    const st = sappedShot(t);
    return Object.assign(st, { shot: 'boom', white: 0.85, whiteCol: [1, 0.62, 0.25, 1] });
  }

  function sentryDeadShot(t) {
    const eng = engineerState(t, [-0.55, 0, 0.75], 0.4, { sp: [0.05, 0, 0], nk: [0.05, 0.4, 0], hands: false, face: { frown: 0.5, wide: 0.3 } });
    const u = seg(t, 102.417, 104.083);
    const red = spyAiming(t, [lerp(2.4, 3.1, u), 0, lerp(-1.4, -2.2, u)], -2.6, 0.7);
    const p = M4.point(sapperM(t), [0, 0, 0]);
    return {
      shot: 'sentryDead', kind: '3d', set: 'sentry', env: ENV.sentry, camera: cam([-1.45, 1.12, 2.0], [1.0, 1.15, -0.8], 48),
      heroes: [eng, red], props: [sentryProp({ pitch: 0.35 }), { kind: 'sapper', M: sapperM(t) }, { kind: 'revolver', M: revolverIn(red.st) }],
      sparks: [{ p, r: 0.15, n: 6 }], smoke: [{ p: V3.add(p, [0, 0.4, 0]), n: 6, a: 0.5, rise: 0.8 }]
    };
  }

  function signShot(t) {
    const black = t > 104.458;
    return {
      shot: 'sign', kind: '3d', set: 'sentry', env: ENV.sentry, camera: cam([-2.5, 1.62, -3.25], [-2.6, 1.6, -3.94], 44), dark: black ? 1 : 0
    };
  }

  function engieShot(t) {
    const u = seg(t, 104.542, 105.667);
    const eng = engineerState(t, [lerp(-1.0, -0.6, u), 0, lerp(-1.6, -0.9, u)], 0.5, { nk: [0.0, S(t * 2.5) * 0.4, 0], hands: false, face: { frown: 0.4 } });
    return {
      shot: 'engie', kind: '3d', set: 'sentry', env: ENV.sentry, camera: cam(V3.add(headPos(eng.st), [0.3, -0.45, 1.25]), V3.add(headPos(eng.st), [0, -0.22, 0]), 44), heroes: [eng], props: [sentryProp({ pitch: 0.35 })]
    };
  }

  function gunShot(t) {
    const red = spyAiming(t, [0.9, 0, 0.9], -2.4, 1);
    const eng = engineerState(t, [-0.6, 0, -0.6], 0.6, { hands: false, face: { frown: 0.3 } });
    const mz = Props.revolverMuzzle(revolverIn(red.st));
    const h = headPos(red.st);
    return {
      shot: 'gun', kind: '3d', set: 'sentry', env: Object.assign({}, ENV.sentry, { ambTop: [0.05, 0.05, 0.06] }), camera: cam(V3.add(h, [0.9, -0.35, -0.55]), V3.add(h, [-0.2, -0.1, 0.0]), 48),
      heroes: [red, eng], props: [{ kind: 'revolver', M: revolverIn(red.st) }], flashes: t > 106.2 ? [{ p: mz.p, s: 0.35 }] : []
    };
  }

  function shotFlashShot(t) {
    return { shot: 'shotFlash', kind: 'card', cards: [{ tex: 'photo1', zoom: 1 }], white: 1, whiteCol: [0.92, 0.88, 0.62, 1] };
  }

  function colleaguesScene(t) {
    const keys = [[106.4, 'loose'], [106.9, 'present', 0.4], [108.0, 'loose', 0.5]];
    const pose = standPose('spy', { at: [3.75, 0, 1.45], yaw: PI + 0.25, sp: [0.35, 0, 0], nk: [-0.2, 0, 0] });
    const ch = chestOf('spy', pose);
    const g = gestureAt(ch, keys, t);
    const st = withGesture('spy', pose, ch, g);
    const spy = { who: 'spy', team: 'blu', st, face: spyFace(t, X.stern, { look: [0, -0.2] }) };
    const tilt = ease(seg(t, 108.2, 108.9));
    const eye = V3.lerp([3.85, 1.45, 0.3], [3.55, 1.15, 0.1], tilt);
    const at = V3.lerp(V3.add(headPos(st), [0, -0.3, 0]), [3.3, A2.TOP + 0.15, 0.62], tilt);
    return {
      shot: 'colleagues', kind: '3d', set: 'base', env: ENV.map, camera: cam(eye, at, 40), door: { open: true },
      heroes: [spy], actors: [A2.corpseOnTable(0)], props: [{ kind: 'briefcase', M: A1.caseM() }]
    };
  }

  const HUT_FADE = 109.3;

  function colleaguesShot(t) {
    const st = colleaguesScene(t);
    if (t > 108.9) {
      st.dissolve = { to: hutWindowScene(t), k: seg(t, 108.9, HUT_FADE) };
    }
    return st;
  }

  function sniperActor(pose, extra) {
    return Object.assign({ cls: 'sniper', team: 'blu', pose, eyewear: 'glasses' }, extra || {});
  }

  function guestScene(cls, pose, fab, face, item) {
    if (!Sh.heroOf(cls)) return { actors: [Object.assign({ cls, team: 'blu', pose, eyewear: 'glasses' }, fab || {})] };
    const st = stateOf(cls, pose, null);
    const out = { heroes: [{ who: cls, team: 'blu', st, face: Sh.guestFace(face) }] };
    if (item) out.props = [{ kind: item, M: M4.chain(st.m.handR, M4.translate(0, -0.075, 0.01), M4.rotX(-PI / 2 + 0.3)) }];
    return out;
  }

  function merge(base, extra) {
    const out = Object.assign({}, base);
    ['heroes', 'actors', 'props'].forEach(k => { if (extra[k]) out[k] = (base[k] || []).concat(extra[k]); });
    return out;
  }

  function hutWindowScene(t) {
    const sn = FP.stand('sniper', -1.0, -1.7, PI + 0.05, { sp: [0.25, 0, 0], nk: [-0.1, 0, 0] });
    const g = FP.aimGun('sniper', 'rifle');
    Object.assign(sn, { hR: g.hR, hL: g.hL });
    const red = redSpyWalk(t, [0.2, 0, -0.6], PI + 0.8, null, X.sly);
    return {
      shot: 'hutWindow', kind: '3d', set: 'hut', env: ENV.hut, camera: cam([-1.15, 1.55, -3.0], [-0.7, 1.45, -0.5], 46),
      actors: [sniperActor(sn, { gun: 'rifle', gunM: g.gunM })], heroes: [red], setOpts: { skip: ['glow'] }, letterbox: 0.12
    };
  }

  function hutWindowShot(t) {
    return hutWindowScene(t);
  }

  function hutInShot(t) {
    const u = seg(t, 110.292, 112.042);
    const sn = FP.stand('sniper', -1.0, -1.7, PI + u * 0.8, { sp: [0.15, 0, 0], nk: [0, 0, 0] });
    return merge({
      shot: 'hutIn', kind: '3d', set: 'hut', env: ENV.hut, camera: cam([-0.15, 1.62, -0.55], [-1.1, 1.42, -2.0], 46), shafts: true, motion: t > 111.5 ? 0.7 : 0
    }, guestScene('sniper', sn, {}, { lidU: 0.45, browDown: 0.2 }));
  }

  function sniperTurnShot(t) {
    const u = seg(t, 112.042, 112.583);
    const sn = FP.stand('sniper', -1.0, -1.7, lerp(-1.4, 0.55, ease(u)), { sp: [0.1, 0, 0], nk: [0.05, -0.2, 0] });
    return merge({
      shot: 'sniperTurn', kind: '3d', set: 'hut', env: ENV.hut, camera: cam([-0.4, 1.72, -0.95], [-1.0, 1.65, -1.7], 48), shafts: true
    }, guestScene('sniper', sn, { face: { eyes: 'wide', brows: 'up', mouth: 'o' } }, { browUp: 0.9, browInUp: 0.4, lidU: 0.95, jaw: 0.3, round: 0.3 }));
  }

  function hutTableShot(t) {
    const red = redSpyWalk(t, [0.6, 0, 1.7], PI + 0.2, null, X.sly, [[0, 'loose']]);
    const ch = chestOf('spy', red.st.pose);
    const slide = seg(t, 112.6, 113.2);
    const L = hand([lerp(0.85, 0.65, slide), A2.TOP - 0.0 + 0.02, 1.25], [0.3, -0.2, -1], [0, -1, 0], 'flat');
    red.st = stateOf('spy', Object.assign({}, red.st.pose, { sp: [0.45, 0, 0] }), { L });
    return {
      shot: 'hutTable', kind: '3d', set: 'hut', env: ENV.hut, camera: cam([0.4, 1.15, 0.85], [0.7, 0.75, 1.2], 44), heroes: [red], shafts: true
    };
  }

  function spyHutShot(t) {
    const red = redSpyWalk(t, [0.4, 0, 0.6], PI / 2 - 0.3, null, X.smug, [[113.3, 'loose'], [113.8, 'chest', 0.5]]);
    const lunge = seg(t, 114.3, 115.0);
    const sn = FP.run('sniper', lerp(-2.2, -0.7, lunge), 0.2, PI / 2 + 0.2, t * 1.5, { lean: 0.4 });
    sn.hR = [-0.1, 0.45, 0.35];
    return {
      shot: 'spyHut', kind: '3d', set: 'hut', env: ENV.hut, camera: cam([2.2, 1.3, 0.3], [0.2, 1.3, 0.5], 38), heroes: [red],
      actors: lunge > 0 ? [sniperActor(sn, { itemR: 'knife' })] : [], shafts: true, motion: lunge > 0 ? 0.35 : 0
    };
  }

  function sniperCloseShot(t) {
    const sn = FP.stand('sniper', -0.6, 0.3, PI / 2 + 0.3, { sp: [0.2, 0, 0], nk: [-0.1, 0.2, 0] });
    sn.hR = [-0.15, 0.4, 0.3];
    const g = guestScene('sniper', sn, { itemR: 'knife', face: { eyes: 'angry', brows: 'angry', mouth: 'teeth' } }, { browDown: 0.95, sneer: 0.55, frown: 0.35, wide: 0.45, lidU: 0.4 }, 'kukri');
    const m = g.heroes ? g.heroes[0].st.m : window.FabCast.solve('sniper', sn);
    const h = M4.point(m.head, [0, 0, 0]);
    return merge({
      shot: 'sniperClose', kind: '3d', set: 'hut', env: ENV.hut, camera: cam(V3.add(h, [0.45, -0.05, -0.38]), V3.add(h, [0, -0.04, 0]), 40), shafts: true
    }, g);
  }

  function fightShot(t) {
    const u = seg(t, 116.625, 118.125);
    const red = redSpyWalk(t, [lerp(0.3, 0.1, u), 0, 0.5], -PI / 2 - 0.2, null, X.angry, [[116.6, 'fists'], [117.4, 'chest', 0.3]]);
    const sn = FP.stand('sniper', -0.45, 0.35, PI / 2 + 0.2, { sp: [0.35, 0.3 * S(t * 6), 0] });
    sn.hR = [-0.2 + S(t * 5) * 0.25, 0.35, 0.4];
    return {
      shot: 'fight', kind: '3d', set: 'hut', env: ENV.hut, camera: cam(V3.add([-0.05, 1.55, 1.55], shake(t, 0.04, 17)), [-0.1, 1.35, 0.4], 50), heroes: [red],
      actors: [sniperActor(sn, { itemR: 'knife' })], shafts: true, motion: 0.3
    };
  }

  function stabShot(t) {
    const sn = FP.stand('sniper', 0.0, 0.4, PI / 2, { sp: [0.5, 0, 0], nk: [-0.3, 0, 0] });
    const red = redSpyWalk(t, [-0.55, 0, 0.42], PI / 2, null, X.angry, [[0, 'fists']]);
    return {
      shot: 'stab', kind: '3d', set: 'hut', env: Object.assign({}, ENV.hut, { ambTop: [0.12, 0.09, 0.07] }), camera: cam([-0.3, 1.25, 1.15], [-0.15, 1.2, 0.4], 46), heroes: [red],
      actors: [sniperActor(sn)], shafts: true, motion: 0.25
    };
  }

  function grappleShot(t) {
    const red = redSpyWalk(t, [-0.4, 0, 0.45], PI / 2 + 0.2, null, X.angry, [[0, 'fists']]);
    const sn = FP.stand('sniper', 0.15, 0.45, -PI / 2, { sp: [0.3, 0, 0] });
    sn.hR = [-0.1, 0.25, 0.4];
    sn.hL = [0.15, 0.2, 0.42];
    return {
      shot: 'grapple', kind: '3d', set: 'hut', env: ENV.hut, camera: cam(V3.add([-0.1, 1.3, 1.05], shake(t, 0.03, 19)), [-0.1, 1.25, 0.45], 42), heroes: [red],
      actors: [sniperActor(sn, { itemR: 'knife' })], shafts: true, motion: 0.4, dark: t > 120.167 && t < 120.583 ? 0.75 : 0
    };
  }

  function spyHutWideShot(t) {
    const red = redSpyWalk(t, [0.2, 0, 0.55], -0.4, null, X.cold, [[0, 'loose']]);
    const body = FP.prone('sniper', -0.6, -0.4, PI / 2 + 0.3, {});
    return {
      shot: 'spyHutWide', kind: '3d', set: 'hut', env: ENV.hut, camera: cam([1.9, 1.05, 2.3], [0.1, 1.2, 0.3], 46), heroes: [red], actors: [sniperActor(body)], shafts: true
    };
  }

  const ANY_FACE = track([[121.75, X.cold], [122.3, X.stern], [123.4, X.angry], [124.6, X.stern]]);

  function anyoneScene(t) {
    const turn = ease(seg(t, 121.75, 122.6));
    const spy = A2.spyStand(t, A2.SPY_MAP, lerp(0.6, PI - 0.1, turn), [[121.7, 'smoke'], [123.3, 'smokePoint', 0.35], [124.6, 'smoke', 0.4]], ANY_FACE(t), { nk: [0.08, 0, 0.05] }, { look: [0.15 * turn, 0.05] });
    const h = headPos(spy.st);
    return Object.assign({
      shot: 'anyone', kind: '3d', set: 'base', env: ENV.map, camera: cam(V3.add(h, [0.3, -0.2, -0.6]), V3.add(h, [0, -0.05, 0]), 40, 0.08), door: { open: true }, heroes: [spy]
    }, Sh.cigFx(spy.st));
  }

  function anyoneShot(t) {
    const st = anyoneScene(t);
    if (t > 125.42) st.dissolve = { to: medicFightScene(t), k: seg(t, 125.42, 125.62) };
    return st;
  }

  function medicFightScene(t) {
    const u = seg(t, 125.5, 126.875);
    const md = FP.stand('medic', lerp(0.6, 0.1, u), 0.2, -PI / 2 - 0.2, { sp: [0.25, 0, 0] });
    md.hR = [-0.15, 0.5 + S(t * 6) * 0.1, 0.35];
    const red = redSpyWalk(t, [-0.65, 0, 0.0], PI / 2 + 0.3, null, X.angry, [[0, 'fists']]);
    return merge({
      shot: 'medicFight', kind: '3d', set: 'medic', env: ENV.medic, camera: cam([0.6, 1.5, 1.7], [-0.2, 1.35, 0.1], 50), heroes: [red], motion: 0.15
    }, guestScene('medic', md, { itemR: 'longsword' }, { browDown: 0.9, sneer: 0.5, wide: 0.6, jaw: 0.4, lidU: 0.5 }, 'saw'));
  }

  function medicFightShot(t) {
    return medicFightScene(t);
  }

  function grabShot(t) {
    const md = FP.stand('medic', 0.05, 0.15, PI / 2 + 0.6, { sp: [-0.25, 0, 0], nk: [-0.6, 0, 0] });
    md.hR = [-0.35, 0.45, 0.1];
    md.hL = [0.35, 0.3, 0.1];
    const red = redSpyWalk(t, [-0.25, 0, -0.18], PI / 2 + 0.4, null, X.angry, [[0, 'fists']]);
    return merge({
      shot: 'grab', kind: '3d', set: 'medic', env: ENV.medic, camera: cam([0.9, 1.25, 1.2], [0.0, 1.55, 0.0], 50), heroes: [red]
    }, guestScene('medic', md, {}, { browUp: 0.9, browInUp: 0.7, lidU: 1, jaw: 0.6, round: 0.3 }));
  }

  function morphShot(t) {
    const k = ease(seg(t, 127.9, 129.0));
    const pose = standPose('spy', { at: [0, 0, 0], yaw: 0.3, sp: [0.05, 0, 0], nk: [0.1, 0.1, -0.15] });
    const st = stateOf('spy', pose, null);
    const h = headPos(st);
    const red = { who: 'spy', team: 'red', st, face: spyFace(t, X.angry, { look: [-0.1, 0.05] }, true) };
    const md = FP.stand('medic', 0, 0, 0.3, { nk: [0.1, 0.1, -0.15] });
    const solveM = Sh.heroOf('medic') ? Sh.heroOf('medic').solve : (p) => window.FabCast.solve('medic', p);
    const mh = M4.point(solveM(md).head, [0, 0, 0]);
    md.p = V3.add(md.p, V3.sub(h, mh));
    const g = guestScene('medic', md, { face: { eyes: 'angry', brows: 'angry', mouth: 'smirk' } }, { browDown: 0.8, sneer: 0.3, smileL: 0.3, lidU: 0.4 });
    return merge({
      shot: 'morph', kind: '3d', set: 'medic', env: ENV.medic, camera: cam(V3.add(h, [0.1, -0.04, 0.42]), V3.add(h, [0, -0.02, 0]), 36, -0.35),
      heroes: k < 0.5 ? [red] : [], white: S(k * PI) * 0.75, whiteCol: [1, 0.55, 0.2, 1]
    }, k >= 0.5 ? g : {});
  }

  function medicFaceShot(t) {
    const md = FP.stand('medic', 0.3, 0.6, PI + 0.3, { sp: [-0.1, 0, 0], nk: [-0.2, 0, 0] });
    const g = guestScene('medic', md, { face: { eyes: 'wide', brows: 'sad', mouth: 'open', open: 0.6 } }, { browUp: 0.9, browInUp: 0.8, lidU: 1, jaw: 0.55, round: 0.35, frown: 0.2 });
    const m = g.heroes ? g.heroes[0].st.m : window.FabCast.solve('medic', md);
    const h = M4.point(m.head, [0, 0, 0]);
    return merge({
      shot: 'medicFace', kind: '3d', set: 'medic', env: Object.assign({}, ENV.medic, { ambTop: [0.1, 0.12, 0.12] }), camera: cam(V3.add(h, [-0.22, 0.02, -0.6]), V3.add(h, [0, 0.02, 0]), 36)
    }, g);
  }

  function fallShot(t) {
    const u = ease(seg(t, 131.25, 131.958));
    const md = FP.stand('medic', 0.2, 0.3, PI / 2, { sp: [-0.3 * u, 0, 0.4 * u], dy: -u * 0.5 });
    return merge({
      shot: 'fall', kind: '3d', set: 'medic', env: ENV.medic, camera: cam([1.4, 1.1, 1.3], [0.2, 1.0, 0.2], 50), motion: 0.25
    }, guestScene('medic', md, {}, { browUp: 0.7, browInUp: 0.8, lidU: 0.6, jaw: 0.5 }));
  }

  function topDownShot(t) {
    const body = FP.supine('medic', -0.2, 0.0, 0.4, {});
    const fake = FP.crouch('medic', 0.45, 0.25, -PI / 2, { depth: 0.6 });
    const u = seg(t, 131.958, 134.333);
    return merge(merge({
      shot: 'topDown', kind: '3d', set: 'medic', env: ENV.medic, camera: { eye: [0.15, 2.7 - u * 0.15, 0.3], at: [0.1, 0, 0.2], fov: 52, up: [0, 0, -1], near: 0.03, far: 60 }
    }, guestScene('medic', body, {}, { lidU: 0.1, jaw: 0.3 })), guestScene('medic', fake, {}, { browDown: 0.5, smileL: 0.3 }));
  }

  const FAKE_FACE = { browDown: 0.55, smileL: 0.65, smileR: 0.2, sneer: 0.2, lidU: 0.35 };

  function glassesHand(H, md, lift) {
    const pre = H.solve(md);
    const lens = H.lensCenters(pre);
    const fwd = V3.norm(M4.dir(pre.head, [0, 0, 1])), up = V3.norm(M4.dir(pre.head, [0, 1, 0])), side = V3.norm(M4.dir(pre.head, [-1, 0, 0]));
    const tip = V3.add(V3.lerp(lens[0], lens[1], 0.5), V3.add(V3.mul(fwd, 0.03), V3.mul(up, 0.02)));
    const wrist = V3.add(tip, V3.add(V3.add(V3.mul(side, 0.1), V3.mul(up, -0.07)), V3.mul(fwd, 0.06)));
    const rest = M4.point(pre.chest, [-0.24, -0.34, 0.06]);
    return hand(V3.lerp(rest, wrist, lift), V3.lerp([0, -1, 0], V3.norm(V3.sub(tip, wrist)), lift), V3.lerp([1, 0, 0], V3.mul(fwd, -1), lift), lift > 0.5 ? 'pinch' : 'relax');
  }

  function fakeMedicShot(t) {
    const md = FP.stand('medic', 0.3, 0.3, PI + 0.4, { sp: [0.05, 0, 0], nk: [0.05, 0.1, 0] });
    const H = Sh.heroOf('medic');
    let g;
    if (H) {
      const lift = ease(seg(t, 134.4, 134.9)) * (1 - ease(seg(t, 137.3, 137.9)));
      const st = stateOf('medic', Object.assign({}, md, { eR: [-1, -0.4, 0.1] }), { R: glassesHand(H, md, lift) });
      g = { heroes: [{ who: 'medic', team: 'blu', st, face: Sh.guestFace(FAKE_FACE) }] };
    } else {
      md.hR = [-0.08, 0.4, 0.22];
      g = guestScene('medic', md, { face: { eyes: 'half', brows: 'angry', mouth: 'smirk' } }, FAKE_FACE);
    }
    const m = g.heroes ? g.heroes[0].st.m : window.FabCast.solve('medic', md);
    const h = M4.point(m.head, [0, 0, 0]);
    const wide = t < 135.6;
    return merge({
      shot: 'fakeMedic', kind: '3d', set: 'medic', env: ENV.medic,
      camera: wide ? cam(V3.add(h, [-0.55, -0.95, -1.75]), V3.add(h, [0, -0.55, 0]), 46) : cam(V3.add(h, [-0.3, 0.0, -0.62]), V3.add(h, [0, -0.05, 0]), 40)
    }, g);
  }

  const ROOM_FACE = track([[137.96, X.stern], [138.7, X.angry], [139.6, X.alarm], [140.4, X.stern], [141.2, X.raise], [141.8, X.alarm]]);

  function thisRoomShot(t) {
    const keys = [[137.9, 'smoke'], [139.3, 'smokePoint', 0.25], [140.6, 'smoke', 0.25], [141.6, 'smokeTalk', 0.3]];
    const spy = A2.spyStand(t, A2.SPY_MAP, PI - 0.1, keys, ROOM_FACE(t), { nk: [0.08, 0, 0] }, { look: [0, 0.03] });
    const h = headPos(spy.st);
    const muzzle = t > 142.62;
    const push = seg(t, 137.96, 142.6) * 0.12;
    return Object.assign({
      shot: 'thisRoom', kind: '3d', set: 'base', env: muzzle ? Object.assign({}, ENV.map, { key: { dir: [0, -0.3, 1], col: [2.2, 1.8, 1.2] } }) : ENV.map,
      camera: cam(V3.add(h, [-0.1, -0.1, -0.86 + push]), V3.add(h, [0, -0.15, 0]), 40), door: { open: true }, heroes: [spy], white: muzzle ? 0.25 : 0, whiteCol: [1, 0.85, 0.5, 1]
    }, Sh.cigFx(spy.st));
  }

  function headshotShot(t) {
    const u = seg(t, 142.75, 143.5);
    const spy = A2.spyStand(t, A2.SPY_MAP, PI - 0.1, [[0, 'loose']], X.shock, { nk: [-0.3 * u, 0, 0], sp: [-0.15 * u, 0, 0] });
    const h = headPos(spy.st);
    const burst = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
      const a = i * 0.7;
      return { p: V3.add(h, [C(a) * 0.12 * (0.3 + u), 0.05 + S(a) * 0.1 * (0.3 + u), 0.05 + u * 0.15]), s: 0.22 + u * 0.35 + (i % 3) * 0.05, spin: a, a: 1 - u * 0.4 };
    });
    return {
      shot: 'headshot', kind: '3d', set: 'base', env: ENV.map, camera: cam(V3.add(h, [0.05, -0.12, -0.78]), V3.add(h, [0, -0.15, 0]), 40), door: { open: true },
      heroes: [Object.assign(spy, { opts: { noHead: true } })], blood: burst
    };
  }

  window.MspAct3 = {
    shadowShot, corridorRedShot, sentryShot, sapperShot, sappedShot, boomShot, sentryDeadShot, signShot, engieShot, gunShot, shotFlashShot, colleaguesShot, hutWindowShot,
    hutInShot, sniperTurnShot, hutTableShot, spyHutShot, sniperCloseShot, fightShot, stabShot, grappleShot, spyHutWideShot, anyoneShot, medicFightShot, grabShot, morphShot,
    medicFaceShot, fallShot, topDownShot, fakeMedicShot, thisRoomShot, headshotShot, redSpyWalk, revolverIn, spyAiming, SENTRY_M
  };
})();
