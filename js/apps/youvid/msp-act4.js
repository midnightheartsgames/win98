(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, clamp, lerp, ease } = K;
  const Sh = window.MspShots;
  const Spy = window.MeetSpy;
  const SolProps = window.MtsProps;
  const HeavyScript = window.MeetScript;
  const Props = window.MspProps;
  const A1 = window.MspAct1;
  const A2 = window.MspAct2;
  const A3 = window.MspAct3;
  const { X, SX, CX, seg, spyFace, scoutFace, soldierFace, heavyFace, axes, standPose, hand, stateOf, chestOf, headPos, cam, ENV } = Sh;

  const LINEUP_SHIFT = -92.54;
  const BODY_AT = [4.25, 0, 1.68];

  function lyingSpy(t, at, yaw, team) {
    const { fwd, side } = axes(yaw);
    const p = [at[0], 0.14, at[2]];
    const pose = {
      p, fwd: [0, 1, 0], up: fwd, sp: [0, 0.1, 0.05], nk: [0.25, 0.4, 0],
      fLw: V3.add(V3.add(p, V3.mul(fwd, -0.92)), V3.add(V3.mul(side, 0.22), [0, 0.04, 0])), fRw: V3.add(V3.add(p, V3.mul(fwd, -0.88)), V3.add(V3.mul(side, -0.15), [0, 0.04, 0])),
      kLw: V3.add(p, V3.add(V3.mul(fwd, -0.4), [0, 1, 0])), kRw: V3.add(p, V3.add(V3.mul(fwd, -0.4), [0, 1, 0])),
      hLw: V3.add(V3.add(p, V3.mul(fwd, 0.35)), V3.add(V3.mul(side, 0.5), [0, -0.08, 0])), hRw: V3.add(V3.add(p, V3.mul(fwd, 0.05)), V3.add(V3.mul(side, -0.45), [0, -0.08, 0]))
    };
    return { who: 'spy', team: team || 'blu', st: stateOf('spy', pose, null), face: spyFace(t, Object.assign({}, X.shock, { lidU: 0.2 })), opts: { noHead: true } };
  }

  function bloodPool(at, s) {
    return [{ p: [at[0], 0.02, at[2]], s: s || 0.8, spin: 0.4, a: 0.95 }];
  }

  function afterShot(t) {
    const fall = seg(t, 143.5, 144.4);
    const heroes = [];
    if (fall < 1) {
      const spy = A2.spyStand(t, A2.SPY_MAP, PI - 0.1, [[0, 'loose']], X.shock, { sp: [-0.2 - fall * 0.5, 0, 0.1 * fall], drop: fall * 0.6 });
      spy.opts = { noHead: true };
      heroes.push(spy);
    }
    const sol = A2.soldierStand(t, [4.25, 0, 0.9], 0.15, t < 145.8 ? SX.scowl : SX.shout, 0.0);
    const solPose = standPose('soldier', { at: [4.25, 0, 0.9], yaw: 0.15, sp: [0.05, 0, 0], nk: [0.05, 0, 0] });
    const G = M4.chain(chestOf('soldier', solPose), M4.translate(-0.09, 0.2, 0.36), M4.rotY(0.04), M4.rotX(t < 145.0 ? -0.05 : -0.3));
    sol.st = stateOf('soldier', solPose, A1.gunHands('shotgun', G));
    sol.gun = G;
    const recoil = seg(t, 143.5, 144.3);
    const sc = A2.scoutStand(t, [3.35, 0, 1.0], 0.5, [[143.5, 'loose'], [143.9, 'shrug', 0.25], [145.6, 'loose', 0.5]], t < 145.4 ? CX.wideEye : CX.huh, { sp: [-0.2 * recoil, 0, 0], nk: [-0.1, 0, 0] });
    const heavy = A2.heavyStand(t, [5.15, 0, 0.95], -0.35, { browUp: 0.6, browInUp: 0.4, lidU: 0.85, jaw: 0.25 }, -0.1);
    heroes.push(sol, sc, heavy);
    const shell = t > 145.2 && t < 146.2 ? [{ kind: 'shell', M: M4.chain(M4.translate(4.4 + (t - 145.2) * 0.3, 1.5 + (t - 145.2) * 0.8 - (t - 145.2) * (t - 145.2) * 3.5, 1.05), M4.rotZ(t * 12)) }] : [];
    return {
      shot: 'after', kind: '3d', set: 'base', env: ENV.map, camera: cam([4.38, 1.55, 2.62], [4.3, 1.45, 0.9], 52), door: { open: true },
      heroes, props: [{ kind: 'shotgun', M: G }].concat(shell), blood: fall < 1 ? [{ p: V3.add(A2.SPY_MAP, [0, 1.85 - fall * 0.7, -0.12]), s: 0.62, spin: 0.2, a: 0.95 }, { p: V3.add(A2.SPY_MAP, [0.1, 1.5 - fall * 0.5, -0.14]), s: 0.35, spin: 1.2, a: 0.9 }] : []
    };
  }

  function waitShot(t) {
    const body = lyingSpy(t, BODY_AT, PI / 2 - 0.3);
    const step = seg(t, 155.0, 158.4);
    const solPose = standPose('soldier', { at: [lerp(5.6, 4.95, step), 0, lerp(1.6, 1.45, step)], yaw: -PI / 2 - 0.3, sp: [0.25, 0, 0], nk: [-0.2, 0, 0] });
    const G = M4.chain(chestOf('soldier', solPose), M4.translate(-0.12, -0.05, 0.38), M4.rotY(0.1), M4.rotX(0.75));
    const sol = { who: 'soldier', team: 'blu', st: stateOf('soldier', solPose, A1.gunHands('shotgun', G)), face: soldierFace(t, SX.calm), gun: G };
    const first = t < 151.5;
    const camera = first ? cam([3.75, 0.52, 2.38], [4.25, 0.12, 1.65], 50) : cam([3.55, 0.3, 2.45], [4.55, 0.25, 1.4], 52);
    const shells = [0, 1].map(i => ({ kind: 'shell', M: M4.chain(M4.translate(4.0 + i * 0.25, 0.012, 2.4 - i * 0.2), M4.rotZ(PI / 2), M4.rotY(i * 1.2)) }));
    return {
      shot: 'wait', kind: '3d', set: 'base', env: ENV.map, camera, door: { open: true }, heroes: [body, sol], props: [{ kind: 'shotgun', M: G }].concat(shells),
      blood: bloodPool(V3.add(BODY_AT, [0, 0, -0.55]), 0.9).concat([{ p: [3.9, 0.03, 2.5], s: 0.12, a: 0.9 }, { p: [4.6, 0.03, 2.65], s: 0.1, a: 0.9 }]), motion: first ? 0.3 : 0
    };
  }

  function seeRedShot(t) {
    const solPose = standPose('soldier', { at: [3.8, 0, 1.25], yaw: 0.7, sp: [0.35, 0, 0], nk: [-0.25, 0.2, 0] });
    const G = M4.chain(chestOf('soldier', solPose), M4.translate(-0.12, -0.05, 0.38), M4.rotY(0.1), M4.rotX(0.75));
    const sol = { who: 'soldier', team: 'blu', st: stateOf('soldier', solPose, A1.gunHands('shotgun', G)), face: soldierFace(t, t < 160.6 ? SX.grin : SX.pout), gun: G };
    const heavy = A2.heavyStand(t, [4.85, 0, 1.2], -0.6, t < 160.8 ? { browUp: 0.3, smile: 0.2 } : { browDown: 0.5, frown: 0.3 }, 0.35);
    heavy.st = stateOf('heavy', Object.assign({}, heavy.st.pose, { sp: [0.3, 0, 0], nk: [-0.2, 0.3, 0] }), null);
    heavy.gun = null;
    const sc = A2.scoutStand(t, [4.25, 0, -0.4], 0.0, [[0, 'loose']], CX.tight, {});
    return {
      shot: 'seeRed', kind: '3d', set: 'base', env: ENV.map, camera: cam([4.3, 1.55, 2.45], [4.3, 1.45, 0.4], 52), door: { open: true },
      heroes: [sol, heavy, sc], props: [{ kind: 'shotgun', M: G }]
    };
  }

  function wideShot(t) {
    const body = lyingSpy(t, BODY_AT, PI / 2 - 0.3);
    const solPose = standPose('soldier', { at: [3.75, 0, 1.4], yaw: 0.9, sp: [0.55, 0, 0], nk: [-0.3, 0, 0] });
    const G = M4.chain(chestOf('soldier', solPose), M4.translate(-0.12, -0.05, 0.38), M4.rotY(0.1), M4.rotX(0.75));
    const sol = { who: 'soldier', team: 'blu', st: stateOf('soldier', solPose, A1.gunHands('shotgun', G)), face: soldierFace(t, SX.pout), gun: G };
    const hPose = standPose('heavy', { at: [4.95, 0, 1.35], yaw: -0.7, sp: [0.55, 0, 0], nk: [-0.3, 0, 0] });
    const heavy = { who: 'heavy', team: 'blu', st: stateOf('heavy', hPose, null), face: heavyFace(t, { browDown: 0.4, frown: 0.3 }) };
    return {
      shot: 'wide', kind: '3d', set: 'base', env: ENV.map, camera: cam([4.1, 1.3, -0.35], [4.35, 0.95, 2.4], 54), door: { open: true },
      heroes: [body, sol, heavy], props: [{ kind: 'shotgun', M: G }], blood: bloodPool(V3.add(BODY_AT, [0, 0, -0.55]), 0.9).concat([{ p: [4.4, 2.0, 3.46], s: 1.2, a: 0.9 }])
    };
  }

  function knifeHandShot(t) {
    const u = seg(t, 165.041, 167.625);
    const pose = standPose('scout', { at: [4.55, 0, 2.6], yaw: PI / 2 + 0.6, sp: [lerp(0.9, 0.3, u), 0, 0], nk: [-0.4, 0, 0], drop: lerp(0.35, 0.05, u) });
    const ch = chestOf('scout', pose);
    const R = hand(V3.lerp([4.15, 0.12, 2.2], M4.point(ch, [-0.25, 0.1, 0.45]), ease(seg(t, 165.6, 167.0))), [-0.8, 0.2, 0.3], [0, -0.3, 1], 'knife');
    const st = stateOf('scout', pose, { R });
    const knife = A2.knifeInHand(st, 'R');
    const tip = Props.knifeTip(knife, 1);
    return {
      shot: 'knifeHand', kind: '3d', set: 'base', env: ENV.map, camera: cam(V3.add(st.m.pts.wristR, [-0.12, 0.08, -0.55]), st.m.pts.wristR, 40), door: { open: true },
      heroes: [{ who: 'scout', team: 'blu', st, face: scoutFace(t, CX.sly) }], props: [{ kind: 'knife', M: knife }], blood: [{ p: tip, s: 0.05, a: 0.8 }]
    };
  }

  function revealShot(t) {
    const swap = 169.75;
    const solPose = standPose('soldier', { at: [3.95, 0, 1.5], yaw: 0.3, sp: [0.05, 0, 0], nk: [0.05, -0.1, 0] });
    const G = M4.chain(chestOf('soldier', solPose), M4.translate(-0.09, 0.2, 0.36), M4.rotY(0.04), M4.rotX(0.05));
    const sol = { who: 'soldier', team: 'blu', st: stateOf('soldier', solPose, A1.gunHands('shotgun', G)), face: soldierFace(t, t > 171.5 ? SX.grimace : SX.calm), gun: G };
    const heavy = A2.heavyStand(t, [4.75, 0, 1.6], -0.3, t > 171.9 ? { browUp: 0.5, browInUp: 0.4, lidU: 0.8 } : { browDown: 0.35 }, 0.0);
    const heroes = [sol, heavy];
    const props = [{ kind: 'shotgun', M: G }];
    const back = [4.4, 0, 0.35];
    if (t < swap) {
      const sc = A2.scoutStand(t, back, 0.1, [[0, 'loose']], CX.sly, {});
      heroes.push(sc);
      props.push({ kind: 'knife', M: A2.knifeInHand(sc.st, 'R') });
    } else {
      const k = seg(t, swap, 171.2);
      const at = V3.lerp(back, [4.45, 0, 0.95], k);
      const pose = standPose('spy', { at, yaw: 0.05, sp: [0.05, 0, 0], nk: [0.05, 0, 0] });
      const ch = chestOf('spy', pose);
      const raise = ease(seg(t, 171.0, 171.9));
      const R = hand(M4.point(ch, [-0.22, lerp(-0.2, 0.45, raise), lerp(0.2, 0.28, raise)]), M4.dir(ch, [0, 1, 0.2]), M4.dir(ch, [-1, 0, 0]), 'knife');
      const L = hand(M4.point(ch, [0.27, -0.33, 0.05]), M4.dir(ch, [0, -1, 0.1]), M4.dir(ch, [-1, 0, 0.1]), 'relax');
      const st = stateOf('spy', Object.assign({}, pose, { eR: [-0.8, -0.3, -0.2] }), { L, R });
      heroes.push({ who: 'spy', team: 'red', st, face: spyFace(t, t > 171.8 ? X.sly : X.cold, { look: [0.05, -0.05] }, true) });
      props.push({ kind: 'knife', M: A2.knifeInHand(st, 'R') });
    }
    const puff = t > swap - 0.25 && t < swap + 0.6;
    const pc = [4.4, 1.3, 0.4];
    return {
      shot: 'reveal', kind: '3d', set: 'base', env: ENV.map, camera: cam([4.35, 1.62, 2.35], [4.35, 1.55, 0.55], 50), door: { open: true },
      heroes, props, glows: puff ? [{ p: pc, s: 1.2, a: 0.35 * (1 - Math.abs(t - swap) / 0.6), tint: [0.8, 0.75, 0.7] }] : [],
      smoke: puff ? [{ p: [4.4, 0.6, 0.4], n: 10, a: 0.9, rise: 1.4 }] : [], blur: 0.35
    };
  }

  function lineupSpy(t) {
    const pose = standPose('spy', { at: [-1.0, 0, -0.05], yaw: 0.15, sp: [0.05, 0, 0], nk: [-0.05, 0.1, 0.05] });
    const ch = chestOf('spy', pose);
    const R = hand(M4.point(ch, [-0.2, 0.45, 0.12]), M4.dir(ch, [0.05, 1, 0.1]), M4.dir(ch, [-1, 0, 0]), 'grip');
    const L = hand(M4.point(ch, [0.27, -0.33, 0.05]), M4.dir(ch, [0, -1, 0.1]), M4.dir(ch, [-1, 0, 0.1]), 'relax');
    const st = stateOf('spy', Object.assign({}, pose, { eR: [-0.8, -0.5, -0.1] }), { L, R });
    return { who: 'spy', team: 'red', st, face: spyFace(t, X.smug, { look: [0, 0.05] }, true), cig: true };
  }

  function lineupShot(t, which) {
    const hs = HeavyScript.stage(t + LINEUP_SHIFT);
    const spy = lineupSpy(t);
    const h = headPos(spy.st);
    let camera = hs.camera;
    if (which === 'endA') camera = cam(V3.add(h, [0.18, -0.02, 0.42]), V3.add(h, [0, -0.02, 0]), 32);
    else if (which === 'endB') camera = cam(V3.add(h, [0.38, -0.2, 1.1]), V3.add(h, [0.25, -0.15, 0]), 40);
    else if (which === 'endC') camera = cam([-0.5, 1.2, 1.4], [-0.45, 1.55, 0], 56);
    let logo = hs.logo || null;
    if (logo && which === 'logoB') {
      const k = clamp((t - 176.38) / 0.18, 0, 1);
      logo = Object.assign({}, logo, { emblem: t < 176.38 ? 0 : k, emblemFly: t >= 176.38 && t < 176.56 });
    }
    const actors = (hs.actors || []).filter(a => a.cls !== 'spy');
    const heavy = hs.heavy ? { who: 'heavy', team: 'red', st: hs.heavy, face: hs.face, gun: hs.heavy.gun } : null;
    const tip = Spy.cigTip(spy.st.m);
    return {
      shot: which, kind: 'lineup', env: hs.env, camera, heroes: heavy ? [heavy, spy] : [spy], actors, logo,
      props: [{ kind: 'revolver', M: A3.revolverIn(spy.st) }], glows: [{ p: tip, s: 0.03, a: 0.9, tint: [1, 0.5, 0.2] }],
      blur: which === 'endA' ? 0.45 : which === 'endB' ? 0.25 : 0.1
    };
  }

  function epiloguePhotos(t) {
    const u = seg(t, 177.976, 184.6);
    const pose = standPose('spy', { at: [4.0, 0, 1.45], yaw: PI, sp: [0.55, 0, 0], nk: [-0.35, 0, 0] });
    const ch = chestOf('spy', pose);
    const pick = seg(t, 182.6, 184.6);
    const target = V3.lerp([4.05, A2.TOP + 0.05, 0.6], [4.0, A2.TOP + 0.35, 0.9], pick);
    const R = hand(target, [0, -0.6, -1], [0, -1, 0.2], 'pinch');
    const st = stateOf('spy', pose, { R });
    const photos = A2.photosOnTable(1).map((p, i) => (i === 3 ? { kind: 'photo', tex: 'photo3', M: M4.chain(M4.translate(target[0], target[1] - 0.02, target[2] - 0.08), M4.rotX(pick * -0.9), M4.rotY(0.3)) } : p));
    return {
      shot: 'epilogue', kind: '3d', set: 'base', env: Object.assign({}, ENV.map, { ambTop: [0.06, 0.065, 0.07], key: { dir: [0.1, -1, 0.15], col: [0.42, 0.4, 0.36] }, points: [{ pos: [4.05, 1.6, 0.55], col: [0.8, 0.74, 0.62], k: 4 }] }), camera: cam([4.0 + u * 0.12, 1.4, 0.92], [4.05, A2.TOP, 0.55], 38, 0.3 - u * 0.2), door: { open: true },
      heroes: [{ who: 'spy', team: 'red', st, face: spyFace(t, X.smug, {}, true) }], props: photos, fade: 1 - seg(t, 177.976, 178.6)
    };
  }

  function epilogueHold(t) {
    const pose = standPose('spy', { at: [4.0, 0, 1.15], yaw: PI + 0.15, sp: [0.08, 0, 0], nk: [0.05, -0.1, 0] });
    const ch = chestOf('spy', pose);
    const R = hand(M4.point(ch, [-0.06, 0.38, 0.32]), M4.dir(ch, [0.1, 1, 0.1]), M4.dir(ch, [0, 0, 1]), 'pinch');
    const st = stateOf('spy', Object.assign({}, pose, { eR: [-0.6, -0.7, -0.2] }), { R });
    const photoM = M4.chain(st.hands.R.M, M4.translate(0, -0.13, 0.02), M4.rotX(PI / 2), M4.rotZ(PI));
    const tex = 'photo3';
    const leave = seg(t, 190.583, 191.0);
    const face = spyFace(t, t > 187.6 ? X.grin : X.smug, { look: [0, 0.1] }, true);
    const h = headPos(st);
    return {
      shot: 'epilogueHold', kind: '3d', set: 'base', env: ENV.map, camera: cam(V3.add(h, [0.12, -0.28, -0.95]), V3.add(h, [0.02, -0.2, 0]), 42), door: { open: true },
      heroes: [{ who: 'spy', team: 'red', st, face }], props: [{ kind: 'photo', tex, M: photoM }], motion: leave * 0.8, dark: leave
    };
  }

  function epilogueShot(t) {
    return t < 185.4 ? epiloguePhotos(t) : epilogueHold(t);
  }

  function cardsShot(t) {
    if (t < 195.5) return { shot: 'retail', kind: 'card', cards: [{ tex: 'retail' }], dark: 1 - seg(t, 192.54, 193.0) };
    if (t < 195.95) return { shot: 'valve', kind: 'card', cards: [{ tex: 'retail' }, { tex: 'valve', alpha: seg(t, 195.5, 195.95) }] };
    return { shot: 'valve', kind: 'card', cards: [{ tex: 'valve' }], dark: seg(t, 199.0, 199.4) };
  }

  window.MspAct4 = { afterShot, waitShot, seeRedShot, wideShot, knifeHandShot, revealShot, lineupShot, epilogueShot, cardsShot, LINEUP_SHIFT, lyingSpy };
})();
