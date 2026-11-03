(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, clamp, lerp, ease } = K;
  const Sh = window.MspShots;
  const SolProps = window.MtsProps;
  const Spy = window.MeetSpy;
  const A1 = window.MspAct1;
  const { X, SX, CX, seg, track, spyFace, scoutFace, soldierFace, heavyFace, standPose, hand, stateOf, chestOf, headPos, gestureAt, withGesture, cam, ENV } = Sh;

  const TOP = 0.755;
  const SPY_MAP = [4.45, 0, 2.42];
  const CORPSE_AT = [3.75, 0, 0.62];

  function corpseOnTable(lift) {
    const k = clamp(lift === undefined ? 0 : lift, 0, 1);
    const p = [CORPSE_AT[0], TOP + 0.13 + k * 0.4, CORPSE_AT[2]];
    const pose = {
      p, fwd: [0, -1, 0.0], up: V3.norm([-1, 0.02 + k * 0.3, 0.1]), sp: [0, 0, 0], nk: [0.25, 0.4, 0],
      fLw: [p[0] + 0.95, TOP + 0.06, p[2] + 0.12], fRw: [p[0] + 0.95, TOP + 0.06, p[2] - 0.1], kL: [0.1, -1, 0], kR: [-0.1, -1, 0],
      hLw: [p[0] - 0.55, TOP + 0.04, p[2] + 0.42], hRw: [p[0] - 0.62, TOP - 0.25, p[2] - 0.45]
    };
    return { cls: 'sniper', team: 'blu', pose };
  }

  function knifeInBack() {
    return M4.chain(M4.translate(CORPSE_AT[0] - 0.12, TOP + 0.31, CORPSE_AT[2] + 0.05), M4.rotZ(-0.45), M4.rotX(-0.2), M4.translate(0, -0.04, 0));
  }

  function knifeInHand(st, side, open) {
    const hm = st.hands[side || 'R'];
    const M = hm && hm.M ? hm.M : st.m['hand' + (side || 'R')];
    return M4.chain(M, M4.translate(0, -0.062, 0.012), M4.rotZ(PI / 2), M4.rotY(PI / 2), M4.translate(0, -0.05, 0));
  }

  function heavyStand(t, at, yaw, expr, look) {
    const pose = standPose('heavy', { at, yaw, sp: [0.06, 0, 0], nk: [0.04, look || 0, 0], spread: 0.1 });
    const ch = chestOf('heavy', pose);
    const G = M4.chain(ch, M4.translate(0.05, -0.36, 0.42), M4.rotY(-PI / 2 - 0.35), M4.rotZ(-0.65));
    return { who: 'heavy', team: 'blu', st: stateOf('heavy', pose, A1.heavyGunHands(G)), gun: { M: G, spin: 0 }, face: heavyFace(t, expr) };
  }

  function soldierStand(t, at, yaw, expr, look) {
    const pose = standPose('soldier', { at, yaw, sp: [0.05, 0, 0], nk: [0.05, look || 0, 0] });
    return A1.soldierHolding(pose, A1.LOW, expr, t);
  }

  function scoutStand(t, at, yaw, keys, expr, extra) {
    const pose = standPose('scout', Object.assign({ at, yaw, sp: [0.06, 0, 0] }, extra || {}));
    const ch = chestOf('scout', pose);
    const g = gestureAt(ch, keys, t);
    const st = withGesture('scout', pose, ch, g);
    return { who: 'scout', team: 'blu', st, face: scoutFace(t, expr) };
  }

  const SPY_GEST = {
    rest: 'loose', present: 'present', explain: 'explain', finger: 'raiseFinger', chest: 'chest', point: 'pointYou', back: 'back'
  };

  function spyStand(t, at, yaw, keys, expr, extra, faceExtra) {
    const pose = standPose('spy', Object.assign({ at, yaw, sp: [0.05, 0, 0] }, extra || {}));
    const ch = chestOf('spy', pose);
    const g = gestureAt(ch, keys, t);
    const st = withGesture('spy', pose, ch, g);
    return { who: 'spy', team: 'blu', st, face: spyFace(t, expr, faceExtra) };
  }

  const WALK_FACE = track([[36.5, X.cold], [39.6, X.talk], [42.4, X.smug], [44.7, X.raise], [45.4, X.stern], [46.3, X.cold]]);

  function spyWalkShot(t) {
    const k = ease(seg(t, 36.541, 38.6));
    const at = [lerp(0.95, 2.0, k), 0, lerp(0.05, 0.08, k)];
    const throwK = seg(t, 47.15, 47.541);
    const r = A1.spyCarrying(t, at, PI / 2 + 0.35 - S(t * 0.7) * 0.08, X.cold, k < 1);
    r.hero.face = spyFace(t, WALK_FACE(t), { look: [t > 42 && t < 44.6 ? -0.3 : 0.25, 0.05] });
    if (throwK > 0) r.corpse.pose.p = V3.add(r.corpse.pose.p, [throwK * 0.5, -throwK * 0.2, -throwK * 0.4]);
    const heavy = heavyStand(t, [1.55, 0, 0.85], PI - 0.75, t < 38 ? { browDown: 0.3 } : { browDown: 0.15, smile: 0.1 }, 0.3);
    const enter = ease(seg(t, 38.3, 39.2));
    const sol = soldierStand(t, [lerp(2.9, 2.45, enter), 0, lerp(1.35, 0.88, enter)], -2.7, t < 38.6 ? SX.calm : SX.proud, 0.2);
    const scout = scoutStand(t, [1.6, 0, -0.75], 0.6, [[36.5, 'down'], [38.1, 'shrug', 0.4], [40.2, 'loose', 0.5], [44.6, 'shrug', 0.35], [45.6, 'down', 0.5]], t > 38.4 && t < 39.6 ? CX.grin : t > 44.6 && t < 45.6 ? CX.huh : CX.cocky, { nk: [0.0, 0.3, 0.05] });
    const cg = A1.corpseGuest(r.corpse);
    return {
      shot: 'spyWalk', kind: '3d', set: 'base', env: ENV.room, camera: cam([3.25, 1.47, 0.28], [1.95, 1.54, 0.02], 38), door: { open: true },
      heroes: [heavy, r.hero, sol, scout].concat(cg.heroes || []), actors: cg.actors || [], props: [{ kind: 'briefcase', M: A1.caseM() }]
    };
  }

  function throwShot(t) {
    const u = seg(t, 47.541, 47.916);
    const blurK = 1 - seg(t, 47.541, 47.64);
    const c = corpseOnTable(1 - u);
    return {
      shot: 'throw', kind: '3d', set: 'base', env: ENV.room, camera: cam([4.5, 1.85, 0.45], [4.32, TOP, 0.62], 46, 0.5), door: { open: true },
      actors: [c], props: [{ kind: 'briefcase', M: A1.caseM() }], motion: blurK * 0.9
    };
  }

  function knifeShot(t) {
    const u = seg(t, 47.916, 50.416);
    const c = corpseOnTable(0);
    return {
      shot: 'knife', kind: '3d', set: 'base', env: ENV.room, camera: cam([3.95 + u * 0.03, 1.38, 0.78], [3.62, TOP + 0.18, 0.66], 34, 0.35), door: { open: true },
      actors: [c], props: [{ kind: 'briefcase', M: A1.caseM() }, { kind: 'knife', M: knifeInBack() }],
      blood: [{ p: [CORPSE_AT[0] - 0.12, TOP + 0.25, CORPSE_AT[2] + 0.06], s: 0.16, a: 0.95 }]
    };
  }

  const SEAT_FACE = track([[50.4, CX.calm], [50.9, CX.huh], [51.7, CX.cocky], [53.2, CX.sly], [54.5, CX.smirk], [55.4, CX.angry], [56.2, CX.cocky], [57.6, CX.tight]]);

  function scoutOverCorpse(t) {
    const lean = 0.36 - ease(seg(t, 50.9, 51.7)) * 0.24;
    const pose = standPose('scout', { at: [3.85, 0, -0.04], yaw: 0.1, sp: [lean + S(t * 1.3) * 0.03, S(t * 0.9) * 0.08, 0], nk: [0.05 - lean * 0.4, S(t * 0.8) * 0.12, 0] });
    const ch = chestOf('scout', pose);
    const pull = seg(t, 50.55, 51.2);
    const keys = [[50.4, 'loose'], [51.7, 'explain', 0.35], [53.2, 'count', 0.3], [54.5, 'explain', 0.3], [55.4, 'pointYou', 0.25], [56.4, 'shrugLow', 0.35], [57.6, 'loose', 0.4]];
    const g = gestureAt(ch, keys.map(k => [k[0], k[1] === 'count' ? 'explain' : k[1] === 'shrugLow' ? 'shrug' : k[1], k[2]]), t);
    const R = pull < 1 ? hand(V3.lerp(V3.add(M4.point(knifeInBack(), [0, 0.1, 0]), [0.02, 0.04, 0]), g.R.target, pull), g.R.fingers, g.R.palm, 'knife') : Object.assign({}, g.R, { pose: 'knife' });
    const st = stateOf('scout', Object.assign({}, pose, { eL: g.elbows.L, eR: g.elbows.R }), { L: g.L, R });
    return { who: 'scout', team: 'blu', st, face: scoutFace(t, SEAT_FACE(t), { look: [0, -0.05] }), pull };
  }

  function scoutSeatShot(t) {
    const sc = scoutOverCorpse(t);
    const knife = sc.pull > 0.2 ? knifeInHand(sc.st, 'R') : knifeInBack();
    const c = corpseOnTable(0);
    const h = headPos(sc.st);
    return {
      shot: 'scoutSeat', kind: '3d', set: 'base', env: ENV.map, camera: cam([3.92, 1.16, 1.36], V3.add(h, [0, -0.32, 0]), 34), door: { open: true },
      heroes: [sc], actors: [c], props: [{ kind: 'knife', M: knife }, { kind: 'briefcase', M: A1.caseM() }],
      blood: sc.pull > 0.2 ? [{ p: [CORPSE_AT[0] - 0.12, TOP + 0.24, CORPSE_AT[2] + 0.06], s: 0.12, a: 0.9 }] : []
    };
  }

  const OFF_FACE = track([[58.4, X.cold], [59.0, X.talk], [60.2, X.smug], [61.6, X.stern], [62.9, X.scorn], [64.2, X.cold]]);

  function faceOffShot(t) {
    const spy = spyStand(t, [3.95, 0, 1.98], -PI / 2 - 0.55, [[58.4, 'loose'], [59.1, 'present', 0.35], [60.2, 'raiseFinger', 0.3], [61.7, 'chest', 0.35], [62.9, 'explain', 0.3], [64.0, 'loose', 0.4]], OFF_FACE(t), { nk: [0.02, 0.15, 0.02] }, { look: [0.2, 0.0] });
    const sc = scoutStand(t, [3.25, 0, 1.55], PI / 2 + 0.55, [[58.4, 'loose'], [60.0, 'fists', 0.4], [61.5, 'loose', 0.4]], t < 60 ? CX.sly : CX.tight, { nk: [0.0, -0.1, 0] });
    const knife = knifeInHand(sc.st, 'R');
    const heavy = heavyStand(t, [5.1, 0, 3.0], -PI / 2 - 0.25, { browDown: 0.25 }, 0.1);
    const h = headPos(spy.st);
    return {
      shot: 'faceOff', kind: '3d', set: 'base', env: ENV.map, camera: cam([3.15, 1.6, 0.95], V3.add(h, [0, -0.2, 0]), 46), door: { open: true },
      heroes: [heavy, spy, sc], props: [{ kind: 'knife', M: knife }]
    };
  }

  function passShot(t) {
    const u = seg(t, 65.041, 66.916);
    const spy = spyStand(t, [lerp(4.1, 4.5, u), 0, lerp(2.05, 2.35, u)], lerp(-PI / 2 - 0.55, PI - 0.2, ease(u)), [[65.0, 'loose'], [65.5, 'back', 0.6]], X.scorn, { nk: [0.02, 0.2, 0.02] });
    const sc = scoutStand(t, [lerp(3.3, 3.7, u), 0, lerp(1.6, 1.85, u)], PI / 2 + 0.3, [[65, 'loose']], CX.tight, { nk: [0, -0.15, 0] });
    const h = headPos(spy.st);
    return {
      shot: 'pass', kind: '3d', set: 'base', env: ENV.map, camera: cam([3.05, 1.62, 1.05], V3.add(h, [-0.1, -0.25, 0]), 48), door: { open: true },
      heroes: [spy, sc], props: [{ kind: 'knife', M: knifeInHand(sc.st, 'R') }]
    };
  }

  function trioShot(t) {
    const sol = soldierStand(t, [3.0, 0, 1.15], 0.4, SX.calm, -0.2);
    const sc = scoutStand(t, [3.65, 0, 1.6], 0.1, [[66.9, 'loose'], [67.2, 'shrug', 0.4], [68.2, 'loose', 0.4]], CX.cocky, { nk: [0.05, 0, 0] });
    const heavy = heavyStand(t, [4.45, 0, 1.1], -0.35, { browDown: 0.2 }, 0.2);
    return {
      shot: 'trio', kind: '3d', set: 'base', env: ENV.map, camera: cam([3.7, 1.5, 3.1], [3.7, 1.45, 1.2], 50), door: { open: true },
      heroes: [sol, sc, heavy], props: [{ kind: 'knife', M: knifeInHand(sc.st, 'R') }]
    };
  }

  const SCOUT_SPOT = [4.95, 0, 1.2];

  function overScout(sc, target) {
    const sh = headPos(sc.st);
    const view = V3.norm(V3.sub(target, sh));
    const right = V3.norm(V3.cross(view, [0, 1, 0]));
    return V3.add(V3.add(sh, V3.mul(right, 0.26)), V3.add(V3.mul(view, -0.42), [0, -0.05, 0]));
  }

  function scoutBack(t, expr) {
    return scoutStand(t, SCOUT_SPOT, -0.3, [[0, 'loose']], expr || CX.tight, { nk: [0.05, -0.1, 0] });
  }

  function folderInHand(st) {
    const hm = st.hands.L;
    const M = hm && hm.M ? hm.M : st.m.handL;
    return M4.chain(M, M4.translate(0.0, -0.1, 0.03), M4.rotX(PI / 2), M4.rotZ(0.2));
  }

  const MAP_FACE = track([[68.6, X.cold], [70.0, X.raise], [70.7, X.smug], [72.0, X.sly], [73.2, X.smug]]);

  function mapTurnShot(t) {
    const turn = ease(seg(t, 69.4, 70.3));
    const yaw = lerp(0.05, PI - 0.15, turn);
    const keys = [[68.6, 'back'], [69.4, 'loose', 0.6], [70.6, 'present', 0.3], [71.6, 'loose', 0.3], [72.35, 'chest', 0.35]];
    const spy = spyStand(t, SPY_MAP, yaw, keys, MAP_FACE(t), { nk: [0.04, 0, 0] }, { look: [0, 0.05] });
    const props = [];
    if (t > 72.5) {
      const raise = seg(t, 72.5, 73.0);
      const ch = chestOf('spy', spy.st.pose);
      const L = hand(M4.point(ch, [0.15 + raise * 0.05, 0.12 + raise * 0.12, 0.3]), M4.dir(ch, [0, 1, 0.2]), M4.dir(ch, [0, 0, 1]), 'pinch');
      spy.st = stateOf('spy', Object.assign({}, spy.st.pose), { L, R: spy.st.hands.R ? { target: spy.st.pose.hRw, fingers: [0, -1, 0], palm: [1, 0, 0], pose: 'relax' } : undefined });
      props.push({ kind: 'folder', M: M4.chain(folderInHand(spy.st), M4.translate(0, 0, 0.0)) });
    }
    const sc = scoutBack(t, CX.tight);
    const look = V3.add(headPos(spy.st), [0, -0.22, 0]);
    return {
      shot: 'mapTurn', kind: '3d', set: 'base', env: ENV.map, camera: cam(overScout(sc, look), look, 30), door: { open: true },
      heroes: [spy, sc], props
    };
  }

  function tossShot(t) {
    const u = seg(t, 73.791, 73.916);
    const p = V3.lerp([4.3, 1.5, 2.2], [3.95, 1.0, 1.0], u);
    return {
      shot: 'toss', kind: '3d', set: 'base', env: ENV.map, camera: cam([3.7, 1.7, 1.2], [4.1, 1.3, 2.0], 46), door: { open: true },
      props: [{ kind: 'folder', M: M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotX(u * 4), M4.rotZ(u * 2)) }], motion: 0.9
    };
  }

  const PHOTO_SPOTS = [[0.14, 0.05, 0.4, 'photo1'], [-0.12, 0.12, -0.5, 'photo2'], [0.05, -0.14, 0.9, 'photo3'], [0.24, -0.06, -0.2, 'photo4'], [-0.2, -0.1, 1.4, 'photo1'], [-0.05, 0.2, 2.0, 'photo2']];

  function photosOnTable(spread) {
    const base = [4.05, TOP + 0.004, 0.55];
    return PHOTO_SPOTS.map(([dx, dz, a, tex], i) => {
      const k = clamp(spread * 1.4 - i * 0.08, 0, 1);
      return { kind: 'photo', tex, M: M4.chain(M4.translate(base[0] + dx * k, base[1] + i * 0.0008, base[2] + dz * k), M4.rotY(a * k + i * 0.3)) };
    });
  }

  function photosTableShot(t) {
    const u = seg(t, 73.916, 75.082);
    const land = ease(seg(t, 73.916, 74.15));
    const fm = M4.chain(M4.translate(lerp(4.0, 3.92, land), TOP + 0.006 + (1 - land) * 0.25, lerp(0.75, 0.66, land)), M4.rotY(-0.5), M4.rotX((1 - land) * 0.8));
    return {
      shot: 'photosTable', kind: '3d', set: 'base', env: ENV.room, camera: cam([4.0 + u * 0.05, 1.62, 1.0], [4.05, TOP, 0.58], 40, 0.25), door: { open: true },
      props: [{ kind: 'folder', M: fm }].concat(photosOnTable(seg(t, 74.0, 74.6)))
    };
  }

  function photoCardShot(t) {
    const list = [[75.082, 75.207, null], [75.207, 75.791, 'photo1'], [75.791, 75.916, null], [75.916, 76.541, 'photo2'], [76.541, 76.666, null], [76.666, 77.457, 'photo3']];
    const cur = list.find(l => t >= l[0] && t < l[1]) || list[list.length - 1];
    if (!cur[2]) return { shot: 'photoFlash', kind: 'card', cards: [{ tex: 'photo1', zoom: 1.4 }], white: 1 };
    const u = seg(t, cur[0], cur[1]);
    return { shot: 'photo', kind: 'card', cards: [{ tex: cur[2], zoom: 1.32 + u * 0.08 }], white: clamp(1 - u * 6, 0, 1) * 0.8 };
  }

  function teamAtTable(t, lean) {
    const solPose = standPose('soldier', { at: [3.25, 0, -0.05], yaw: 0.25, sp: [0.45, 0.1, 0], nk: [-0.25, -0.1, 0] });
    const sol2 = A1.soldierHolding(solPose, A1.LOW, t > 78 ? SX.laugh : SX.grin, t);
    const scPose = standPose('scout', { at: [4.05, 0, -0.08], yaw: 0, sp: [0.55 * lean + 0.05, 0, 0], nk: [-0.35 * lean, 0, 0], spread: 0.12 });
    const ch = chestOf('scout', scPose);
    const L = hand([4.32, TOP + 0.08, 0.32], [0.3, -1, 0.2], [0, -1, 0], 'open');
    const R = hand([3.78, TOP + 0.08, 0.32], [-0.3, -1, 0.2], [0, -1, 0], 'open');
    const sc = { who: 'scout', team: 'blu', st: stateOf('scout', Object.assign({}, scPose, { eL: [0.8, -0.2, 0.2], eR: [-0.8, -0.2, 0.2] }), lean > 0.3 ? { L, R } : null), face: scoutFace(t, CX.grin) };
    const heavy = heavyStand(t, [4.95, 0, -0.15], -0.3, { smile: 0.5, browUp: 0.2, lidU: 0.45 }, -0.15);
    return [sol2, sc, heavy];
  }

  function trioTableShot(t) {
    const team = teamAtTable(t, 1);
    return {
      shot: 'trioTable', kind: '3d', set: 'base', env: ENV.room, camera: cam([4.05, 1.0, 1.75], [4.05, 1.35, -0.1], 50), door: { open: true },
      heroes: team, props: [{ kind: 'briefcase', M: A1.caseM() }].concat(photosOnTable(1))
    };
  }

  const TALK_FACE = track([[79.3, X.cold], [80.2, X.smug], [81.4, X.stern], [82.4, X.cold], [83.8, X.sly], [85.4, X.smug]]);

  function cigCaseIn(st) {
    const hm = st.hands.R;
    const M = hm && hm.M ? hm.M : st.m.handR;
    return M4.chain(M, M4.translate(0, -0.1, 0.035), M4.rotX(PI / 2), M4.rotY(PI));
  }

  function spyTalkShot(t) {
    const keys = [[79.3, 'loose'], [80.0, 'explain', 0.35], [81.3, 'raiseFinger', 0.3], [82.4, 'explain', 0.3], [83.2, 'chest', 0.35], [84.1, 'present', 0.35]];
    const spy = spyStand(t, SPY_MAP, PI - 0.12, keys, TALK_FACE(t), { nk: [0.06, 0.05, 0.03] }, { look: [0, -0.04] });
    const props = [];
    if (t > 83.6) {
      const ch = chestOf('spy', spy.st.pose);
      const open = seg(t, 84.4, 84.9);
      const R = hand(M4.point(ch, [-0.08, -0.02, 0.36]), M4.dir(ch, [0.2, 0.2, 1]), M4.dir(ch, [0, 1, 0.2]), 'hold');
      const L = hand(M4.point(ch, [0.05, 0.02, 0.36]), M4.dir(ch, [-0.2, 0.2, 1]), M4.dir(ch, [0, 1, 0.2]), open > 0.5 ? 'pinch' : 'relax');
      spy.st = stateOf('spy', Object.assign({}, spy.st.pose, { eL: [0.6, -0.8, 0], eR: [-0.6, -0.8, 0] }), { L, R });
      props.push({ kind: 'cigCase', M: cigCaseIn(spy.st), open: open > 0.5 });
    }
    const sc = scoutBack(t, CX.angry);
    const look = V3.add(headPos(spy.st), [0, -0.3, 0]);
    return {
      shot: 'spyTalk', kind: '3d', set: 'base', env: ENV.map, camera: cam(overScout(sc, look), look, 32), door: { open: true },
      heroes: [spy, sc], props
    };
  }

  function scoutAngryShot(t) {
    const sc = scoutStand(t, [4.0, 0, 1.3], 0.05, [[86.2, 'fists']], CX.angry, { nk: [0.1, 0, 0] });
    const team = teamAtTable(t, 0.2);
    const h = headPos(sc.st);
    return {
      shot: 'scoutAngry', kind: '3d', set: 'base', env: ENV.room, camera: cam(V3.add(h, [0.12, -0.08, 0.75]), V3.add(h, [0, -0.12, 0]), 42), door: { open: true },
      heroes: [sc, team[0], team[2]]
    };
  }

  function holdPhoto(st, side) {
    const hm = st.hands[side];
    const M = hm && hm.M ? hm.M : st.m['hand' + side];
    return M4.chain(M, M4.translate(0, -0.1, 0.02), M4.rotX(-PI / 2), M4.rotZ(PI / 2));
  }

  function photosLaughShot(t) {
    const solPose = standPose('soldier', { at: [3.35, 0, 0.45], yaw: 0.5, sp: [0.12, 0, 0], nk: [0.2, 0.15, 0] });
    const ch = chestOf('soldier', solPose);
    const pL = hand(M4.point(ch, [0.05, 0.05, 0.42]), M4.dir(ch, [0, 0.4, 1]), M4.dir(ch, [0, 0.3, -1]), 'hold');
    const pR = hand(M4.point(ch, [-0.15, 0.0, 0.4]), M4.dir(ch, [0, 0.4, 1]), M4.dir(ch, [0, 0.3, -1]), 'hold');
    const sol = { who: 'soldier', team: 'blu', st: stateOf('soldier', solPose, { L: pL, R: pR }), face: soldierFace(t, SX.laugh) };
    const hPose = standPose('heavy', { at: [4.3, 0, 0.35], yaw: -0.35, sp: [0.1, 0, 0], nk: [0.25, -0.1, 0] });
    const hch = chestOf('heavy', hPose);
    const hL = hand(M4.point(hch, [0.1, 0.05, 0.48]), M4.dir(hch, [0, 0.4, 1]), M4.dir(hch, [0, 0.3, -1]), 'hold');
    const heavy = { who: 'heavy', team: 'blu', st: stateOf('heavy', hPose, { L: hL }), face: heavyFace(t, { smile: 0.75, browUp: 0.3, lidU: 0.4 }) };
    const grab = seg(t, 89.9, 90.4);
    const sc = scoutStand(t, [3.55, 0, 1.05], PI, [[87.6, 'loose'], [89.9, 'reach', 0.3]], CX.angry, { sp: [0.85 - grab * 0.4, 0, 0], nk: [-0.5, 0, 0] });
    return {
      shot: 'photosLaugh', kind: '3d', set: 'base', env: ENV.room, camera: cam([3.8, 1.45, 1.95], [3.85, 1.5, 0.4], 46), door: { open: true },
      heroes: [sol, heavy, sc], props: [{ kind: 'photo', tex: 'photo2', M: holdPhoto(sol.st, 'L') }, { kind: 'photo', tex: 'photo3', M: holdPhoto(heavy.st, 'L') }]
    };
  }

  function lighterShot(t) {
    const light = seg(t, 90.6, 91.0);
    const pose = standPose('spy', { at: SPY_MAP, yaw: PI - 0.3, sp: [0.08, 0, 0], nk: [-0.12 + light * 0.1, 0.05, 0] });
    const ch = chestOf('spy', pose);
    const pre = stateOf('spy', pose, null);
    const mouth = Spy.headPoint(pre.m, [0.03, -0.06, 0.1]);
    const R = hand(V3.add(mouth, M4.dir(ch, [-0.04, -0.06, 0.1])), M4.dir(ch, [0.4, 0.6, 0.5]), M4.dir(ch, [-0.6, 0, 0.6]), 'hold');
    const L = hand(M4.point(ch, [0.2, -0.05, 0.3]), M4.dir(ch, [0, 0.5, 1]), M4.dir(ch, [-1, 0, 0]), 'cig');
    const st = stateOf('spy', Object.assign({}, pose, { eR: [-0.6, -0.8, 0.1], eL: [0.6, -0.8, 0] }), { L, R });
    const spy = { who: 'spy', team: 'blu', st, face: spyFace(t, t < 91.2 ? X.puff : X.cold, { look: [0, -0.1] }), cig: t > 90.7 && t < 92.2 };
    const lighterM = M4.chain(st.hands.R.M, M4.translate(0, -0.07, 0.03));
    const tip = Spy.cigTip(st.m);
    const team = teamAtTable(t, 0.3).map(h => Object.assign({}, h));
    const lit = t > 90.65 && t < 91.6;
    return {
      shot: 'lighter', kind: '3d', set: 'base', env: ENV.map, camera: cam([4.95, 1.3, 1.1], V3.add(headPos(st), [-0.75, -0.42, -0.5]), 50), door: { open: true },
      heroes: [spy].concat(team), props: [{ kind: 'lighter', M: lighterM }],
      glows: lit ? [{ p: V3.add(tip, [0, 0.03, 0]), s: 0.14, a: 0.9, tint: [1, 0.75, 0.35] }] : t > 91.6 ? [{ p: tip, s: 0.04, a: 0.8, tint: [1, 0.5, 0.2] }] : [],
      smoke: t > 91.2 ? [{ p: tip, n: 5, a: 0.3 }] : []
    };
  }

  function mapBackShot(t) {
    const spy = spyStand(t, SPY_MAP, 0.15, [[92.9, 'smoke'], [94.2, 'smokeTalk', 0.5]], X.cold, { nk: [0.0, 0.15, 0] }, { look: [0.1, 0.05] });
    const c = Sh.cigFx(spy.st);
    const h = headPos(spy.st);
    return Object.assign({
      shot: 'mapBack', kind: '3d', set: 'base', env: ENV.map, camera: cam(V3.add(h, [0.38, 0.02, -0.42]), V3.add(h, [-0.25, -0.12, 0.8]), 44), door: { open: true },
      heroes: [spy]
    }, c);
  }

  window.MspAct2 = {
    spyWalkShot, throwShot, knifeShot, scoutSeatShot, faceOffShot, passShot, trioShot, mapTurnShot, tossShot, photosTableShot, photoCardShot, trioTableShot, spyTalkShot,
    scoutAngryShot, photosLaughShot, lighterShot, mapBackShot, corpseOnTable, knifeInBack, knifeInHand, heavyStand, soldierStand, scoutStand, spyStand, teamAtTable,
    photosOnTable, SPY_MAP, SCOUT_SPOT, TOP
  };
})();
