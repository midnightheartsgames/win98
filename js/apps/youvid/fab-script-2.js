(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Pose = window.FabPose;
  const Cast = window.FabCast;
  const A = window.FabScript1;
  const { cam, talk, guitarist, engiHero, armed, moved, kartHeavy } = A;
  const ZONES = window.FabWorld.ZONES;

  const SHOTS = [];
  const at = (t0, fn) => SHOTS.push([t0, fn]);

  function zp(zone, x, y, z) {
    const o = ZONES[zone];
    return [o[0] + x, y, o[2] + z];
  }

  function zcam(zone, eye, look, fov, o) {
    return cam(zp(zone, eye[0], eye[1], eye[2]), zp(zone, look[0], look[1], look[2]), fov, o);
  }

  function zpose(zone, pose) {
    const o = ZONES[zone];
    return moved(pose, [o[0], 0, o[2]]);
  }

  function zprop(zone, kind, x, y, z, o) {
    return Object.assign({ kind, at: zp(zone, x, y, z) }, o || {});
  }

  function headCam(a, off, fov, o) {
    const opts = o || {};
    const m = Cast.solve(a.cls, a.pose);
    const h = opts.chest ? m.pts.chest : m.pts.head;
    return cam(V3.add(h, off), V3.add(h, opts.look || [0, 0, 0]), fov, opts);
  }

  function sub(word) {
    return { tex: 'sub_' + word, x: 280, y: 440, w: 400, h: 50 };
  }

  const ROAD = { red: [24, 0, 7.6], blu: [24, 0, 5] };

  at(241.274, (lt, t) => {
    const kh = kartHeavy(ROAD.red[0], ROAD.red[2], PI, t, { face: { mouth: 'o', eyes: 'wide', brows: 'up' } });
    return {
      set: 'kart',
      camera: cam([24.3, 1.3, 6.1], [24.0, 1.15, 7.5], 50),
      actors: [kh.actor],
      props: [kh.prop]
    };
  });

  at(241.674, (lt, t) => {
    const kh = kartHeavy(ROAD.red[0], ROAD.red[2], PI, t, { face: talk(t, 1.2, { brows: 'up' }) });
    return {
      set: 'kart',
      camera: cam([24.05, 1.28, 6.75], [24.0, 1.24, 7.45], 46),
      actors: [kh.actor],
      props: [kh.prop],
      cards: [sub('sandwich')]
    };
  });

  at(242.442, (lt, t) => {
    const k = clamp(lt / 0.8, 0, 1);
    const p = [24, 1.2 + S(k * PI) * 1.6, lerp(7.6, 3.2, k)];
    const pose = Pose.airborne('heavy', p, [0, 0.6, 0.8], [0, 0.8, -0.6], { hL: [0.5, 0.3, 0.2], hR: [-0.5, 0.3, 0.2] });
    const M = M4.chain(M4.translate(24.2, 0.6 + S(k * PI) * 1.2, lerp(7.2, 3.8, k)), M4.rotX(-k * 2.4), M4.rotZ(k * 0.8));
    return {
      set: 'kart',
      camera: cam([24.3, 0.3, 4.4], [24.0, 3.2, 5.8], 78, { shake: 0.08, shakeT: lt * 20 }),
      actors: k < 1 ? [{ cls: 'heavy', team: 'red', grips: { L: 'open', R: 'open' }, face: { mouth: 'scream', open: 1 }, pose }] : [],
      props: [{ kind: 'kart', M }],
      post: { zoom: 0.8 }
    };
  });

  at(243.276, (lt, t) => {
    const k = clamp(lt / 2.2, 0, 1);
    const bounce = Math.abs(S(lt * 7)) * 0.6 * (1 - k);
    return {
      set: 'kart',
      camera: cam([lerp(18, 20, k), lerp(0.35, 1.4, k), lerp(-2, -6, k)], [lerp(21, 24, k), 0.5, lerp(2, 6, k)], 60),
      props: [
        { kind: 'tyre', at: [lerp(22.5, 21.2, k), bounce, lerp(1.0, -1.5, k)], yaw: lt * 3, roll: lt * 2 },
        { kind: 'jeep', at: [29, 0, 6], yaw: 1.4 },
        { kind: 'carRed', at: [17, 0, 8], yaw: -0.3 },
        { kind: 'kart', at: [24.5, 0.2, 3.2], yaw: 2.2, roll: PI }
      ]
    };
  });

  at(246.412, (lt, t) => {
    const hv = Pose.supine('heavy', 24.2, 3.6, -1.9, {});
    return {
      set: 'kart',
      camera: cam([22.2, 0.35, 1.6], [23.8, 0.3, 3.4], 62),
      actors: [{ cls: 'heavy', team: 'red', face: { eyes: 'shut', mouth: 'open', open: 0.3 }, pose: hv }],
      props: [{ kind: 'kart', at: [23.4, 0.45, 3.0], yaw: 2.2 + lt * 0.2, roll: PI }]
    };
  });

  function ambushBase(t) {
    return [
      zprop('ambush', 'blueWall', -6.5, 0, -1.5, { yaw: PI / 2 }),
      zprop('ambush', 'yellowWall', 1.6, 0, -0.4),
      zprop('ambush', 'van', -7.5, 0, -8.5, { yaw: PI / 2, tex: 'vanSide' }),
      zprop('ambush', 'cone', 2.3, 0, 3.4, { s: 2.2 }),
      zprop('ambush', 'cone', -2.4, 0, -4.2),
      zprop('ambush', 'cone', 4.8, 0, -5.6)
    ];
  }

  at(248.348, (lt, t) => {
    const actors = [];
    const props = ambushBase(t);
    const fx = [];
    if (t < 251.0) {
      const peek = 0.5 + 0.5 * S(lt * 2.5);
      const py = Pose.crouch('pyro', 1.9 + peek * 0.25, 2.5, PI - 0.4, { depth: 0.35 });
      actors.push(armed({ cls: 'pyro', team: 'blu', gun: 'flamer', pose: zpose('ambush', py) }));
    } else if (t < 251.55) {
      actors.push(armed({ cls: 'pyro', team: 'blu', gun: 'flamer', pose: zpose('ambush', Pose.run('pyro', lerp(1.6, 0.4, (t - 251) / 0.55), 1.4, -PI / 2, t * 1.6, {})) }));
    }
    if (t > 249.9 && t < 252.2) {
      const k = (t - 249.9) / 2.3;
      const kh = kartHeavy(ZONES.ambush[0] + lerp(-9, 9, k), ZONES.ambush[2] + 1.2, PI / 2, t, { face: { mouth: 'grin', open: 0.6 } });
      actors.push(kh.actor);
      props.push(kh.prop);
    }
    if (t > 251.5) fx.push({ kind: 'blood', p: zp('ambush', 0.3, 0.9, 1.4), u: t - 251.5, s: 1.4, n: 26, size: 0.3, dur: 1.2 });
    return {
      set: 'kart',
      camera: zcam('ambush', [3.2, 0.55, 6.6], [-1.2, 1.4, -6], 56),
      actors,
      props,
      fx
    };
  });

  at(253.3, (lt, t) => {
    const so = Pose.stand('soldier', -5.85, -0.4, PI / 2, { sp: [-0.05, 0, 0], nk: [0.1, 0.4, 0] });
    so.hL = [0.08, 0.62, 0.12];
    const a = { cls: 'soldier', team: 'blu', grips: { L: 'open' }, face: { eyes: 'wide', mouth: 'shut' }, pose: zpose('ambush', so) };
    return {
      set: 'kart',
      camera: headCam(a, [1.15, -0.5, 0.95], 54, { look: [0, -0.2, 0] }),
      actors: [a],
      props: ambushBase(t)
    };
  });

  function lyingSoldier(t, o) {
    const so = Pose.prone('soldier', -3.8, 1.0, 0.15, { nk: [-0.7, -0.2, 0] });
    so.hR = [-0.3, 0.36, 0.08];
    so.hL = [0.28, 0.36, 0.08];
    return Object.assign({ cls: 'soldier', team: 'blu', pose: zpose('ambush', so) }, o || {});
  }

  function sittingEngi(t, o) {
    const en = Pose.sitFloor('engineer', 1.7, 0.4, 0.15, { splay: 0.2 });
    en.fLw = V3.add(en.fLw, [0, 0, -0.35]);
    en.fRw = V3.add(en.fRw, [0, 0, -0.35]);
    en.kL = [0.2, 1, 0.5];
    en.kR = [-0.2, 1, 0.5];
    en.hL = [0.2, 0.0, 0.45];
    en.hR = [-0.2, 0.0, 0.45];
    return Object.assign({ cls: 'engineer', team: 'blu', hat: 'hardhat', eyewear: 'shades', face: { mouth: 'shut' }, pose: zpose('ambush', en) }, o || {});
  }

  function lyingScout() {
    return { cls: 'scout', team: 'blu', face: { mouth: 'grin', eyes: 'half' }, pose: zpose('ambush', Pose.supine('scout', -2.4, 1.6, 2.6, {})) };
  }

  function wideAmbush(t) {
    return {
      set: 'kart',
      camera: zcam('ambush', [-0.4, 1.1, 5.4], [-1.2, 0.45, -0.2], 56),
      actors: [lyingSoldier(t), lyingScout(), sittingEngi(t)],
      props: ambushBase(t)
    };
  }

  at(255.388, (lt, t) => wideAmbush(t));

  at(257.69, (lt, t) => {
    const so = lyingSoldier(t, { face: talk(t, 0.8, { eyes: 'wide' }) });
    return {
      set: 'kart',
      camera: headCam(so, [0.3, 0.1, 0.85], 50, { look: [0.05, -0.05, 0] }),
      actors: [so, lyingScout()],
      props: ambushBase(t)
    };
  });

  function banana(t) {
    const e = sittingEngi(t, { face: talk(t, 1, { mouth: 'shut' }) });
    if (t > 262.9) {
      e.pose.hR = [-0.2, 0.4, 0.12];
      e.itemR = 'banana';
      e.grips = { R: 'grip' };
    }
    return e;
  }

  at(261.06, (lt, t) => {
    const e = banana(t);
    return { set: 'kart', camera: headCam(e, [0.2, -0.05, 0.85], 50, { look: [0, -0.12, 0] }), actors: [e], props: ambushBase(t) };
  });

  at(264.063, (lt, t) => {
    const so = lyingSoldier(t, { face: { mouth: 'scream', open: 1, eyes: 'wide' }, itemL: 'boot', grips: { L: 'grip' } });
    so.pose.hL = [0.12, 0.62, 0.1];
    return {
      set: 'kart',
      camera: headCam(so, [0.3, 0.1, 0.85], 50, { look: [0.05, -0.05, 0] }),
      actors: [so],
      props: ambushBase(t)
    };
  });

  at(265.198, (lt, t) => {
    const e = banana(t);
    return { set: 'kart', camera: headCam(e, [0.2, -0.05, 0.85], 50, { look: [0, -0.12, 0] }), actors: [e], props: ambushBase(t) };
  });

  at(266.866, (lt, t) => {
    const st = wideAmbush(t);
    st.actors[2] = banana(t);
    return st;
  });

  at(269.636, (lt, t) => ({
    set: 'kart',
    camera: zcam('ambush', [3.4, 0.2, 2.6], [1.6, 1.0, 0.3], 70, { roll: -0.15 }),
    actors: [banana(t)],
    props: ambushBase(t)
  }));

  at(271.037, (lt, t) => {
    const so = lyingSoldier(t, { face: t > 274 ? { mouth: 'scream', open: 1, eyes: 'wide' } : { mouth: 'shut', eyes: 'half' } });
    if (t > 275.2) so.pose.hR = [-0.25, 0.7, 0.3];
    const actors = [so];
    const fx = [];
    if (t < 272.47) actors.push(banana(t));
    else {
      const k = clamp((t - 272.47) / 0.9, 0, 1);
      const p = zp('ambush', lerp(1.7, 3.8, k), 0.5 + S(k * PI) * 1.4, lerp(0.4, 1.6, k));
      actors.push({ cls: 'engineer', team: 'blu', hat: 'hardhat', eyewear: 'shades', face: { eyes: 'shut', mouth: 'open', open: 0.5 }, pose: k < 1 ? Pose.airborne('engineer', p, [1, 0.6, 0], [0, 0.3, 1], {}) : zpose('ambush', Pose.supine('engineer', 3.8, 1.6, 1.2, {})) });
      fx.push({ kind: 'blood', p: zp('ambush', 1.8, 1.0, 0.4), u: t - 272.47, s: 1.0, n: 20, size: 0.24 });
    }
    return {
      set: 'kart',
      camera: headCam(so, [0.45, 0.12, 0.85], 54, { look: [0.45, -0.05, -0.4] }),
      actors,
      props: ambushBase(t),
      fx
    };
  });

  function mushBase() {
    return [
      zprop('mush', 'mushroomRed', 0, 0, 0),
      zprop('mush', 'mushroomGreen', 5, 0, -1.6)
    ];
  }

  function capSniper(t) {
    const sn = Pose.prone('sniper', 0.4, 0.6, -2.4, { y: 3.72, nk: [-0.9, 0, 0] });
    const g = Cast.twoHanded('rifle', { pitch: 1.1 });
    sn.hR = [-0.12, 0.4, 0.05];
    sn.hL = [0.12, 0.62, 0.0];
    return { cls: 'sniper', team: 'red', eyewear: 'aviators', gun: 'rifle', gunOpts: { pitch: 1.2, off: [0, 0.35, -0.12] }, pose: zpose('mush', sn) };
  }

  at(278.178, (lt, t) => {
    const k = ease(clamp(lt / 0.8, 0, 1));
    const sn = capSniper(t);
    const hc = headCam(sn, [-0.9, 0.35, 1.0], 50, { look: [0.3, -0.15, -0.3] });
    return {
      set: 'kart',
      camera: k < 1 ? cam(V3.add(hc.eye, [lerp(-8, 0, k), 0, 0]), V3.add(hc.at, [lerp(-6, 0, k), 0, 0]), 50) : hc,
      actors: [sn],
      props: mushBase(),
      post: { zoom: lt < 0.7 ? 1.2 : 0 }
    };
  });

  at(280.98, (lt, t) => {
    const sn = Pose.stand('sniper', 5, -1.6, PI - 0.4, { y: 4.05, nk: [0.1, 0, 0] });
    return {
      set: 'kart',
      camera: zcam('mush', [2.6, 0.6, 4.6], [4.8, 4.2, -1.4], 60),
      actors: [armed({ cls: 'sniper', team: 'red', eyewear: 'aviators', gun: 'rifle', pose: zpose('mush', sn) }), capSniper(t)],
      props: mushBase()
    };
  });

  at(282.348, (lt, t) => ({
    set: 'kart',
    camera: cam([22, 4, -4], [18, 1, 12], 14),
    cards: [{ tex: 'scope', alpha: 1 }],
    grade: [1.0, 0.9, 0.7, 0.3],
    post: { zoom: 0.5 }
  }));

  at(283.316, (lt, t) => {
    const k = clamp(lt / 0.4, 0, 1);
    return {
      set: 'kart',
      camera: zcam('mush', [-3.8, 1.2, 5], [-6, 3.2, -3], 56, { roll: 0.3 }),
      actors: [{ cls: 'sniper', team: 'red', pose: Pose.airborne('sniper', zp('mush', -6, 3.4 - k * 0.8, -2.4), [0.4, 1, 0.3], [0, 0, 1], {}) }],
      post: { flash: 1 - k }
    };
  });

  at(283.716, (lt, t) => ({
    set: 'kart',
    camera: cam([14, 3.2, -4], [25, 3, 12], 60, { roll: 0.45 })
  }));

  at(284.484, (lt, t) => ({
    set: 'kart',
    camera: cam([10.5 + lt * 0.4, 2.2, -6], [24, 4, 12], 58),
    props: [{ kind: 'beam', at: [17, 0, 6] }],
    fx: [{ kind: 'glow', p: [17, 9, 6], s: 3, col: [0.8, 0.9, 1], alpha: 0.5 }]
  }));

  function deadSniper(o) {
    const sn = Pose.supine('sniper', 1.0, 3.2, 1.5, { nk: [0.25, 0.3, 0] });
    sn.hR = [-0.5, -0.05, 0.1];
    return Object.assign({ cls: 'sniper', team: 'red', hat: 'none', eyewear: 'aviators', face: { eyes: 'half', mouth: 'shut' }, pose: zpose('mush', sn) }, o || {});
  }

  function pool(k) {
    return zprop('mush', 'pool', 1.0, 0.016, 3.0, { s: 0.4 + k * 0.9 });
  }

  at(286.486, (lt, t) => ({
    set: 'kart',
    camera: headCam(deadSniper(), [1.6, 0.45, 1.3], 54, { chest: true, look: [-0.2, -0.1, 0] }),
    actors: [deadSniper()],
    props: mushBase().concat([pool(clamp(lt / 4, 0, 1)), zprop('mush', 'rifle', 1.6, 0.06, 3.6, { yaw: 0.4, roll: PI / 2 })]),
    fx: lt > 1.4 && lt < 2.6 ? [{ kind: 'blood', p: zp('mush', 1.0, 1.4, 3.2), u: lt - 1.4, s: 0.3, n: 10, dir: [0, -1, 0] }] : []
  }));

  at(291.291, (lt, t) => ({
    set: 'kart',
    camera: zcam('mush', [1.2, 5.5, 3.6], [1.0, 0, 3.1], 50, { roll: 0.2 }),
    actors: [deadSniper()],
    props: [pool(1), zprop('mush', 'rifle', 1.6, 0.06, 3.6, { yaw: 0.4, roll: PI / 2 })]
  }));

  at(294.427, (lt, t) => {
    const so = Pose.stand('soldier', 1.6, 3.1, -PI / 2 - 0.3, {});
    return {
      set: 'kart',
      camera: zcam('mush', [0.7, 0.35, 3.15], [1.9, 0.5, 3.1], 64),
      actors: [deadSniper(), { cls: 'soldier', team: 'blu', pose: zpose('mush', so) }],
      props: [pool(1), zprop('mush', 'rifle', 1.3, 0.12, 3.2, { yaw: 1.4, roll: PI / 2 })]
    };
  });

  at(296.029, (lt, t) => ({
    set: 'kart',
    camera: headCam(deadSniper(), [-0.5, 0.38, 0.04], 48, { look: [0, -0.02, 0] }),
    actors: [deadSniper({ face: { eyes: 'open', mouth: 'shut' } })],
    props: [pool(1)]
  }));

  at(298.298, (lt, t) => {
    const so = Pose.stand('soldier', 1.7, 3.0, -PI / 2 - 0.25, { sp: [0.1, 0, 0], nk: [0.4, 0, 0] });
    so.hL = [-0.08, 0.05, 0.3];
    so.hR = [0.08, 0.02, 0.3];
    if (t > 300.5) so.hR = [-0.2, 0.25, 0.4];
    return {
      set: 'kart',
      camera: zcam('mush', [1.05, 0.22, 3.2], [1.7, 1.6, 3.0], 64, { roll: 0.3 }),
      actors: [{ cls: 'soldier', team: 'blu', face: talk(t), pose: zpose('mush', so), itemR: t > 300.5 ? 'photo' : undefined, grips: { L: 'fist', R: 'grip' } }],
      colorAdd: [0.18, 0.2, 0.22],
      fx: [{ kind: 'glow', p: zp('mush', 2.0, 3.5, 3.0), s: 3.5, col: [1, 0.4, 0.3], alpha: 0.35 }]
    };
  });

  at(301.935, (lt, t) => ({
    set: 'kart',
    camera: headCam(deadSniper(), [0.35, 0.75, -0.45], 50, { chest: true, look: [0, 0, 0.05] }),
    actors: [deadSniper({ face: t > 303.8 ? talk(t, 1, { mouth: 'smile' }) : { eyes: 'open' } })],
    props: [pool(1), zprop('mush', 'paper', 1.0, 0.36, 3.05, { tex: 'polaroid', sc: [0.11, 0.14, 1], pitch: -PI / 2 + 0.2, yaw: 1.5 })]
  }));

  at(306.306, (lt, t) => ({
    set: 'kart',
    camera: zcam('mush', [1.0, 4.2, 3.4], [1.0, 0, 3.1], 50, { roll: -0.6 }),
    actors: [deadSniper(), { cls: 'soldier', team: 'blu', pose: zpose('mush', Pose.stand('soldier', 1.9, 2.6, -PI / 2, {})) }],
    props: [pool(1), zprop('mush', 'paper', 0.6, 0.02, 3.8, { tex: 'polaroid', sc: [0.12, 0.15, 1], pitch: -PI / 2, yaw: 0.6 })]
  }));

  at(309.175, (lt, t) => {
    const actors = [{ cls: 'sniper', team: 'red', eyewear: 'aviators', pose: Pose.supine('sniper', 22.6, -1.2, 0.4, {}) }];
    const fx = [];
    if (t < 315.4) actors.push({ cls: 'soldier', team: 'blu', pose: Pose.stand('soldier', 23.4, 2.6, PI + 0.3, {}) });
    else if (t < 316.4) actors.push({ cls: 'soldier', team: 'blu', pose: Pose.airborne('soldier', [23.4, 1.2 + (t - 315.4) * 1.5, 2.6 - (t - 315.4) * 2], [0, 0.6, -0.8], [0, 0.8, 0.6], {}) });
    else actors.push({ cls: 'soldier', team: 'blu', pose: Pose.supine('soldier', 23.2, 0.4, 0.2, {}) });
    if (t > 312.8) {
      const k = clamp((t - 312.8) / 6.5, 0, 1);
      const hv = t < 319.4 ? Pose.run('heavy', lerp(25, 23.4, k), lerp(11, 0.2, k), PI, t * 1.1, { stride: 0.24 }) : Pose.crouch('heavy', 23.0, -0.6, PI - 0.6, {});
      actors.push(armed({ cls: 'heavy', team: 'red', gun: 'minigun', face: talk(t, 1.2), pose: hv }));
      if (t > 314.8 && t < 316.3) fx.push({ kind: 'muzzle', p: [lerp(25, 23.4, k), 1.0, lerp(11, 0.2, k) - 0.8], s: 0.8, u: t });
    }
    return {
      set: 'kart',
      camera: cam([21.4, 1.3, -6.4], [23.8, 1.8, 9], 56),
      actors,
      props: [{ kind: 'redBlock', at: [19.4, 0, -2.6] }, { kind: 'greenBlock', at: [28.6, 0, -2.4] }],
      hud: t > 317.5 && t < 322.2 ? { bubbles: [{ screen: [40, 400], kind: 'alert', size: 34 }] } : null
    };
  });

  const VO = [-9, 0, -38];
  const vo = (p) => V3.add(p, VO);

  function lightsFloor(t) {
    return { kind: 'lightsCoil', at: vo([0.4, 0.02, 0.6]) };
  }

  at(323.756, (lt, t) => {
    const en = Pose.prone('engineer', 0.6, -0.6, -1.0, { nk: [-1.2, 0, 0], tilt: 0.2 });
    en.hR = [-0.2, 0.4, 0.12];
    en.hL = [0.3, 0.38, 0.12];
    return {
      set: 'kart',
      camera: cam(vo([-3.2, 1.5, 4.5]), vo([0.6, 0.6, -0.8]), 54),
      actors: [{ cls: 'engineer', team: 'blu', hat: 'none', eyewear: 'goggles', itemR: 'wrench', grips: { R: 'grip' }, face: { mouth: 'shut' }, pose: moved(en, VO) }],
      props: [lightsFloor(t)]
    };
  });

  at(331.564, (lt, t) => {
    const en = Pose.stand('engineer', 0, 0, 0, { nk: [0.05, 0, 0] });
    const lift = clamp(lt / 1.2, 0, 1);
    en.hL = [0.2, 0.55 + lift * 0.08, 0.1];
    en.hR = [-0.2, 0.55 + lift * 0.08, 0.1];
    return {
      set: 'kart',
      camera: cam(vo([0.05, 1.55, 1.45]), vo([0, 1.45, 0]), 46),
      actors: [{ cls: 'engineer', team: 'blu', hat: lt > 1.3 ? 'lights' : 'none', eyewear: lt > 1.3 ? undefined : 'goggles', grips: { L: 'open', R: 'open' }, face: { mouth: 'grin', open: 0.3 }, pose: moved(en, VO) }],
      props: lt <= 1.3 ? [{ kind: 'lightsCoil', at: vo([0, 1.95 - (1 - lift) * 0.4, 0.05]), s: 0.7 }] : []
    };
  });

  at(333.4, (lt, t) => {
    const en = Pose.stand('engineer', 0, 0, 0.2, {});
    en.hR = [-0.3, 0.3, 0.42];
    return {
      set: 'kart',
      camera: cam(vo([0.55, 1.42, 1.2]), vo([-0.1, 1.45, 0]), 50),
      actors: [{ cls: 'engineer', team: 'blu', hat: 'lights', itemR: 'wrench', grips: { R: 'grip' }, face: talk(t, 1.2, { mouth: 'open', open: 0.6 }), pose: moved(en, VO) }]
    };
  });

  at(338.838, (lt, t) => {
    const k = clamp(lt / 1.6, 0, 1);
    const ang = k * PI * 1.6;
    const p = vo([lerp(-2.4, 2.2, k), 0.6 + S(k * PI) * 2.4, lerp(-1, -2.4, k)]);
    return {
      set: 'kart',
      camera: cam(vo([-0.5, 1.0, 5.5]), vo([0.5, 1.4, -2]), 54),
      actors: [{ cls: 'engineer', team: 'blu', hat: 'lights', pose: k < 1 ? Pose.airborne('engineer', p, [S(ang), C(ang), 0], [0, 0, 1], {}) : moved(Pose.supine('engineer', 2.2, -2.4, 1.0, {}), VO) }]
    };
  });

  at(341.941, (lt, t) => {
    const sp = Pose.stand('spy', 0, 0, -PI / 2 + 0.1, { sp: [0.05, 0, 0] });
    sp.hR = [-0.08, 0.3, 0.55];
    sp.hL = [0.08, 0.26, 0.48];
    const a = { cls: 'spy', team: 'red', itemR: 'revolver', grips: { R: 'grip', L: 'grip' }, face: { mouth: 'smirk' }, pose: moved(sp, [25.6, 0, -5.5]) };
    return {
      set: 'kart',
      camera: headCam(a, [-0.95, -0.05, 0.12], 50, { look: [0, -0.2, 0] }),
      actors: [a],
      fx: [{ kind: 'smoke', p: [24.8, 1.8, -5.4], u: lt, s: 0.25, dur: 3, n: 6, alpha: 0.5 }],
      cards: [{ tex: 'killcam', x: 520, y: 400, w: 430, h: 81 }]
    };
  });

  function leanHeavy(t) {
    const hv = Pose.stand('heavy', 0, -2.55, 0, { sp: [-0.12, 0, 0], nk: [0.12, 0, 0], spread: -0.05 });
    hv.fLw = V3.add(hv.fLw, [-0.32, 0, 0.18]);
    hv.hL = [-0.08, 0.06, 0.32];
    hv.hR = [0.08, 0.1, 0.32];
    return { cls: 'heavy', team: 'blu', grips: { L: 'fist', R: 'fist' }, face: { mouth: 'shut', eyes: 'half' }, pose: zpose('coin', hv) };
  }

  at(345.211, (lt, t) => {
    const actors = [leanHeavy(t)];
    if (t > 350.8 && t < 351.6) actors.push({ cls: 'scout', team: 'blu', pose: Pose.airborne('scout', zp('coin', lerp(-3, 1, (t - 350.8) / 0.8), 2.4, -1.5), [0, 1, 0], [1, 0, 0], {}) });
    if (t > 353.9) {
      const k = clamp((t - 353.9) / 0.6, 0, 1);
      actors.push(armed({ cls: 'medic', team: 'blu', gun: 'medigun', pose: zpose('coin', Pose.supine('medic', lerp(-6, -1.8, k), 0.4, -PI / 2 - 0.2, {})) }));
    }
    return {
      set: 'kart',
      camera: zcam('coin', [0.1, 1.2, 3.4], [0, 1.25, -2], 46),
      actors
    };
  });

  function upsideMedic(x, z, yaw) {
    const pose = Pose.airborne('medic', zp('coin', x, 0.95, z), [0, -1, 0.15], [S(yaw), 0, C(yaw)], { hL: [0.3, -0.25, 0.1], hR: [-0.3, -0.25, 0.1], fL: [0.14, -0.86, 0.05], fR: [-0.14, -0.86, 0.05] });
    return armed({ cls: 'medic', team: 'blu', gun: 'medigun', face: { mouth: 'o', eyes: 'wide' }, pose });
  }

  at(355.788, (lt, t) => ({
    set: 'kart',
    camera: zcam('coin', [-1.0, 0.7, 2.2], [-1.8, 0.35, 0.4], 52),
    actors: [armed({ cls: 'medic', team: 'blu', gun: 'medigun', gunOpts: { pitch: -1.2 }, face: { mouth: 'shut', eyes: 'half' }, pose: zpose('coin', Pose.supine('medic', -1.8, 0.4, -PI / 2 - 0.2, {})) })]
  }));

  function grabHeavy(t, o) {
    const hv = Pose.stand('heavy', -0.6, 0.2, -PI / 2 + 0.3, { sp: [0.2, 0, 0] });
    hv.hL = [0.2, 0.0, 0.5];
    hv.hR = [-0.2, 0.0, 0.5];
    return Object.assign({ cls: 'heavy', team: 'blu', grips: { L: 'grip', R: 'grip' }, face: { mouth: 'grin', open: 0.5 }, pose: zpose('coin', hv) }, o || {});
  }

  at(357.123, (lt, t) => ({
    set: 'kart',
    camera: zcam('coin', [0.4, 1.3, 5.0], [-0.6, 1.0, -1], 50),
    actors: [grabHeavy(t), upsideMedic(-1.25, 0.45, PI / 2)]
  }));

  at(357.857, (lt, t) => {
    const h = grabHeavy(t, { face: talk(t, 1.2, { mouth: 'grin' }) });
    return { set: 'kart', camera: headCam(h, [-0.85, 0.05, 0.55], 50, { look: [-0.2, -0.1, 0] }), actors: [h, upsideMedic(-1.25, 0.45, PI / 2)] };
  });

  at(359.993, (lt, t) => {
    const h = grabHeavy(t);
    h.pose.hR = [-0.35, 0.45, 0.35];
    h.grips = { L: 'grip', R: 'point' };
    return {
      set: 'kart',
      camera: headCam(h, [-1.7, -0.5, 0.7], 52, { look: [0, -0.2, 0] }),
      actors: [h, upsideMedic(-1.25, 0.45, PI / 2)]
    };
  });

  at(361.094, (lt, t) => ({
    set: 'kart',
    camera: zcam('coin', [1.6, 1.5, 3.6], [-0.6, 1.2, -0.4], 50, { roll: 0.15 }),
    actors: [grabHeavy(t), upsideMedic(-1.25, 0.45, PI / 2)]
  }));

  function garageDuo(t, o) {
    const opts = o || {};
    const hv = Pose.stand('heavy', 12.4, -1.6, -PI / 2 + 0.2, { sp: [0.15, 0, 0] });
    hv.hL = opts.hL || [0.35, 0.3, 0.45];
    hv.hR = opts.hR || [-0.3, -0.2, 0.2];
    const md = Pose.stand('medic', 11.4, -1.5, PI / 2 - 0.2, { y: opts.lift || 0 });
    return [
      { cls: 'heavy', team: 'blu', grips: { L: 'grip', R: opts.point ? 'point' : 'fist' }, face: opts.hface || talk(t, 1.2, { mouth: 'grin' }), pose: zpose('coin', hv) },
      armed({ cls: 'medic', team: 'blu', gun: 'medigun', face: opts.mface || { mouth: 'shut' }, pose: zpose('coin', md) })
    ];
  }

  at(362.695, (lt, t) => {
    const h = garageDuo(t, { hface: { mouth: 'grin', open: 1, eyes: 'shut' } })[0];
    return { set: 'kart', camera: headCam(h, [-0.7, -0.05, 0.45], 50, { roll: 0.3 }), actors: [h] };
  });

  at(363.496, (lt, t) => ({
    set: 'kart',
    camera: zcam('coin', [11.9, 1.3, 2.6], [11.9, 1.3, -1.6], 50),
    actors: garageDuo(t, { lift: 0.15 + S(lt * 3) * 0.05 })
  }));

  at(365.965, (lt, t) => ({
    set: 'kart',
    camera: zcam('coin', [11.9, 1.75, -0.6], [11.9, 1.72, -1.55], 44),
    actors: garageDuo(t, { mface: talk(t, 1, { mouth: 'shut' }) })
  }));

  at(367.867, (lt, t) => ({
    set: 'kart',
    camera: zcam('coin', [11.9, 1.75, -0.6], [11.9, 1.72, -1.55], 44),
    actors: garageDuo(t, { hface: { mouth: 'scream', open: 1 } }),
    fx: [{ kind: 'spray', p: zp('coin', 12.0, 1.72, -1.55), u: lt }]
  }));

  at(369.135, (lt, t) => ({
    set: 'kart',
    camera: zcam('coin', [11.9, 1.3, 2.6], [11.9, 1.3, -1.6], 50),
    actors: garageDuo(t, { point: true, hR: [-0.6, 0.45, 0.3], hface: talk(t, 1.2, { brows: 'angry' }) }).map((a, i) => (i === 1 ? Object.assign(a, { pose: Object.assign({}, a.pose, { p: V3.add(a.pose.p, [-clamp(lt, 0, 0.6), 0, 0]) }) }) : a))
  }));

  at(371.137, (lt, t) => {
    const actors = [];
    if (t > 373.4) actors.push({ cls: 'heavy', team: 'blu', pose: Pose.run('heavy', lerp(5.5, 8.5, (t - 373.4) / 0.9), 16.5, PI / 2, t, { stride: 0.2 }) });
    return {
      set: 'kart',
      camera: cam([10.5, 1.5, 9.5], [6, 2.6, 26], 54),
      actors,
      props: [{ kind: 'tyre', at: [8.6, 0, 17.6] }],
      cards: [{ tex: 'redFrame' }]
    };
  });

  function bluHeavyClose(t, face) {
    const hv = Pose.stand('heavy', 22.2, 2.5, PI, { nk: [0.05, 0.15, 0] });
    return { cls: 'heavy', team: 'blu', grips: { L: 'fist', R: 'fist' }, face, pose: hv };
  }

  at(374.307, (lt, t) => ({
    set: 'kart',
    camera: cam([22.3, 1.75, 1.35], [22.2, 1.7, 2.5], 48),
    actors: [bluHeavyClose(t, talk(t, 1.2, { mouth: 'grin' }))]
  }));

  at(377.01, (lt, t) => ({
    set: 'kart',
    camera: cam([22.3, 1.75, 1.35], [22.2, 1.7, 2.5], 48),
    actors: [bluHeavyClose(t, { mouth: 'grin', open: 1 })],
    post: { flash: 0.8 - lt * 2 }
  }));

  at(377.377, (lt, t) => ({
    set: 'kart',
    camera: cam([22.25, 1.74, 1.85], [22.2, 1.7, 2.5], 42),
    actors: [bluHeavyClose(t, talk(t, 1.2, { mouth: 'grin', eyes: 'crazy', brows: 'angry' }))]
  }));

  function uber(a, k) {
    const glow = Object.assign({}, a, { shadow: false, drawOpts: { additive: true, alpha: 0.55 * k, tint: [0.5, 0.8, 2.0] } });
    a.drawOpts = { tint: [lerp(1, 0.3, k), lerp(1, 0.45, k), lerp(1, 1.6, k)] };
    return [a, glow];
  }

  at(378.911, (lt, t) => {
    const hv = Pose.stand('heavy', 22.2, 2.5, PI, { spread: 0.18 });
    hv.hL = [0.55, -0.1, 0.25];
    hv.hR = [-0.55, -0.1, 0.25];
    const k = clamp((lt - 0.8) / 0.6, 0, 1);
    return {
      set: 'kart',
      camera: cam([22.2, 1.3, -0.6], [22.2, 1.2, 2.5], 54),
      actors: uber({ cls: 'heavy', team: 'blu', grips: { L: 'open', R: 'open' }, face: { mouth: 'teeth', brows: 'angry' }, pose: hv }, k),
      cards: lt > 0.5 && lt < 1.3 ? [{ tex: 'streaks', alpha: 0.9 }] : [],
      post: { flash: lt > 0.5 && lt < 1.3 ? 0.4 : 0 }
    };
  });

  at(383.383, (lt, t) => {
    const k = clamp(1 - (lt - 5) / 1, 0, 1);
    const hv = Pose.stand('heavy', 11.0, 0.6, -PI / 2 - 0.3, { sp: [0.25, 0, 0] });
    hv.hL = [0.2, 0.25, 0.55];
    hv.hR = [-0.2, 0.25, 0.55];
    const actors = uber({ cls: 'heavy', team: 'blu', grips: { L: 'grip', R: 'grip' }, face: { mouth: 'teeth' }, pose: zpose('coin', hv) }, k);
    if (lt < 3.6) {
      const so = Pose.stand('soldier', 10.2, 0.3, PI / 2 - 0.3, { y: 0.25 + S(lt * 12) * 0.05 });
      actors.push(armed({ cls: 'soldier', team: 'red', gun: 'rocket', face: { mouth: 'scream', open: 1 }, pose: zpose('coin', so) }));
    } else if (lt < 4.6) {
      const kk = lt - 3.6;
      actors.push({ cls: 'soldier', team: 'red', pose: Pose.airborne('soldier', zp('coin', 10 - kk * 4, 1.2 + kk * 1.5, 0.3), [-1, 0.5, 0], [0, -0.3, 1], {}) });
    }
    return {
      set: 'kart',
      camera: zcam('coin', [13.6, 1.4, 3.0], [10.6, 1.2, 0.2], 52),
      actors
    };
  });

  at(392.091, (lt, t) => ({
    set: 'kart',
    camera: cam([22.3, 1.75, 1.35], [22.2, 1.72, 2.5], 48),
    actors: [bluHeavyClose(t, talk(t, 1.2, { brows: 'sad', eyes: 'half' }))]
  }));

  at(396.029, (lt, t) => {
    const hv = Pose.stand('heavy', 22.2, 2.5, PI + 0.3, { nk: [0.0, -0.3, 0] });
    hv.hR = [-0.25, 0.1, 0.55];
    const md = Pose.stand('medic', 20.4, 7.0, PI + 0.3, {});
    const actors = [{ cls: 'heavy', team: 'blu', grips: { R: 'open' }, face: { mouth: 'grin', open: 0.3 }, pose: hv }, armed({ cls: 'medic', team: 'blu', gun: 'medigun', face: talk(t), pose: md })];
    if (t > 399) actors.push({ cls: 'scout', team: 'blu', pose: Pose.stand('scout', 20.6, 7.5, PI + 0.3, { hL: [0.25, 0.1, 0.5], hR: [-0.25, 0.1, 0.5] }) });
    const bubbles = [];
    if (t > 396.5 && t < 399.3) bubbles.push({ at: [20.4, 2.5, 7.0], kind: 'alert' });
    if (t > 401.3) bubbles.push({ at: [20.4, 2.5, 7.0], kind: 'curse', size: 60 });
    return {
      set: 'kart',
      camera: cam([22.75, 1.85, 1.45], [21.0, 1.3, 6.5], 58),
      actors,
      props: [{ kind: 'tyre', at: [19.4, 0, 7.6] }, { kind: 'tyre', at: [19.5, 0.64, 7.6] }],
      hud: { bubbles }
    };
  });

  function gtrBase() {
    return [zprop('gtr', 'cube', 0.6, 0, -0.2), zprop('gtr', 'mauve', 7.2, 0, 4.2)];
  }

  at(402.001, (lt, t) => {
    const pose = guitarist('engineer', 'blu', 0.6, 0.2, 0.15, t, { sit: 0.0, rate: 2.4 });
    const o = ZONES.gtr;
    pose.p = V3.add(pose.p, [0, 1.12, 0]);
    pose.fLw = V3.add(pose.fLw, [0, 0.55, 0]);
    pose.fRw = V3.add(pose.fRw, [0, 0.55, 0]);
    return {
      set: 'kart',
      camera: zcam('gtr', [1.5, 2.15, 2.5], [0.6, 2.25, 0.0], 54),
      actors: [engiHero(moved(pose, [o[0], 0, o[2]]), { mouth: 'shut' })],
      props: gtrBase()
    };
  });

  function drapedSniper() {
    const sn = Pose.prone('sniper', 7.2, 3.6, PI / 2 + 0.3, { y: 1.25, nk: [-1.4, 0, 0], tilt: -0.5 });
    sn.hR = [-0.1, 0.5, 0.45];
    sn.hL = [0.3, 0.5, 0.35];
    return { cls: 'sniper', team: 'red', eyewear: 'aviators', face: { eyes: 'shut', mouth: 'open', open: 0.3 }, pose: zpose('gtr', sn) };
  }

  at(404.971, (lt, t) => {
    const fx = [];
    if (t > 406.8 && t < 407.8) fx.push({ kind: 'boom', p: zp('gtr', 9, 1.8, 2.8), u: t - 406.8, s: 1.0, dur: 0.8 });
    if (t > 409.6) fx.push({ kind: 'blood', p: zp('gtr', 6.6, 1.2, 5.4), u: (t - 409.6) % 1.2, s: 0.2, n: 6, dir: [0, -1, 0], size: 0.08 });
    const ds = drapedSniper();
    const actors = [ds];
    if (t > 407.6 && t < 409) actors.push({ cls: 'soldier', team: 'blu', pose: Pose.airborne('soldier', zp('gtr', lerp(12, 4, (t - 407.6) / 1.4), 9, -8), [1, 0.3, 0], [0, 0, 1], {}) });
    return {
      set: 'kart',
      camera: headCam(ds, [1.3, 0.35, 1.6], 52, { look: [-0.4, 0.1, -0.3] }),
      actors,
      props: gtrBase().concat([zprop('gtr', 'bow', 7.4, 1.48, 4.2, { yaw: 0.4, roll: PI / 2 + 0.3 })]),
      fx
    };
  });

  function deadMedic() {
    const md = Pose.supine('medic', 6.4, 6.4, -0.4, {});
    return { cls: 'medic', team: 'red', face: { eyes: 'crazy', mouth: 'open', open: 0.4 }, pose: zpose('gtr', md) };
  }

  function medicArrow() {
    const a = deadMedic();
    const m = Cast.solve('medic', a.pose);
    return { kind: 'arrow', M: M4.chain(M4.translate(m.pts.head[0], m.pts.head[1] + 0.08, m.pts.head[2]), M4.rotY(0.6), M4.rotX(-1.0)) };
  }

  at(412.545, (lt, t) => {
    const actors = [deadMedic()];
    if (t > 414.6 && t < 420.3) {
      const k = clamp((t - 414.6) / 1.6, 0, 1);
      const sp = t < 418.4 ? Pose.crouch('spy', lerp(4.4, 5.4, k), lerp(4.4, 5.6, k), 0.8, { depth: 0.5 }) : Pose.run('spy', lerp(5.4, 3.0, (t - 418.4) / 1.9), 5.6, -PI / 2, t, {});
      if (t > 416.4 && t < 418.4) { sp.hL = [0.1, 0.62, 0.15]; sp.hR = [-0.1, 0.62, 0.15]; }
      actors.push({ cls: 'spy', team: 'blu', grips: { L: 'open', R: 'open' }, face: t > 416 ? { mouth: 'scream', open: 0.8, eyes: 'wide' } : { mouth: 'shut' }, pose: zpose('gtr', sp) });
    }
    return {
      set: 'kart',
      camera: zcam('gtr', [8.4, 0.9, 8.2], [6.0, 0.6, 5.2], 52),
      actors,
      props: gtrBase().concat([medicArrow(), zprop('gtr', 'pool', 6.4, 0.016, 6.6, { s: 0.7 })])
    };
  });

  at(420.92, (lt, t) => {
    const a = deadMedic();
    const m = Cast.solve('medic', a.pose);
    return {
      set: 'kart',
      camera: cam(V3.add(m.pts.head, [0.25, 0.55, 0.1]), m.pts.head, 46, { roll: 0.4 }),
      actors: [a],
      props: [medicArrow(), zprop('gtr', 'pool', 6.4, 0.016, 6.6, { s: 0.7 })]
    };
  });

  const BOARD_CAM = cam([0.2, 1.4, 3.0], [0.0, 1.3, -0.6], 46);

  function pins(t) {
    const list = [];
    if (t > 429.0) list.push({ kind: 'paper', at: [-0.95, 1.75, -0.58], tex: 'pinWas', sc: [1.2, 0.94, 1] });
    if (t > 433.0) list.push({ kind: 'bacon', at: [-0.95, 1.72, -0.54], roll: 0.3 });
    if (t > 435.2) list.push({ kind: 'paper', at: [-0.35, 1.7, -0.56], tex: 'pinCrab', sc: [0.78, 1.04, 1], roll: -0.06 });
    if (t > 437.6) list.push({ kind: 'paper', at: [-0.7, 1.55, -0.53], tex: 'pinSheep', sc: [1.05, 0.82, 1], roll: 0.05 });
    return list;
  }

  at(421.454, (lt, t) => {
    const actors = [];
    if (t < 423.4) {
      const g = Cast.twoHanded('rifle', {});
      const a = Pose.stand('sniper', 0.5, 0.4, -0.6, { sp: [0.2, 0, 0] });
      a.hR = g.hR;
      a.hL = g.hL;
      actors.push({ cls: 'sniper', team: 'red', gun: 'rifle', pose: a });
      actors.push({ cls: 'sniper', team: 'blu', face: { mouth: 'teeth' }, pose: Pose.stand('sniper', 1.1, 0.7, -PI / 2 - 0.5, { sp: [0.3, 0, 0], hL: [0.3, 0.2, 0.4], hR: [-0.2, 0.2, 0.4] }) });
    } else if (t < 426.9) {
      actors.push(armed({ cls: 'sniper', team: 'red', gun: 'rifle', pose: Pose.stand('sniper', 0.3, 0.3, 0.2, {}) }));
    } else if (t < 432.4) {
      const hv = Pose.stand('heavy', lerp(2.6, 0.4, clamp((t - 426.9) / 1.2, 0, 1)), 0.1, -0.9, { sp: [0.15, 0, 0] });
      if (t > 428.4 && t < 429.6) hv.hR = [-0.3, 0.45, 0.6];
      actors.push({ cls: 'heavy', team: 'red', grips: { R: 'open' }, face: talk(t), pose: hv });
    } else if (t < 434.0) {
      const py = Pose.stand('pyro', 0.9, 0.2, -0.7, {});
      if (t > 432.7) py.hR = [-0.25, 0.45, 0.65];
      actors.push({ cls: 'pyro', team: 'blu', grips: { R: 'open' }, pose: py });
    } else if (t < 436.0) {
      const sp = Pose.stand('spy', lerp(-0.4, 0.3, clamp((t - 434) / 0.6, 0, 1)), 0.3, -0.5, {});
      if (t > 434.7) sp.hR = [-0.3, 0.45, 0.6];
      actors.push({ cls: 'spy', team: 'red', grips: { R: 'open' }, face: { mouth: 'smirk' }, pose: sp });
    } else if (t < 438.4) {
      const sc = Pose.stand('scout', 0.9, 0.2, -0.6, {});
      if (t > 437.2) sc.hR = [-0.3, 0.45, 0.6];
      actors.push({ cls: 'scout', team: 'blu', eyewear: 'glasses3d', grips: { R: 'open' }, face: { mouth: 'grin' }, pose: sc });
    } else {
      const k = clamp((t - 438.4) / 1.2, 0, 1);
      const en = Pose.stand('engineer', lerp(-2.4, -0.6, k), 0.8, 0.3, {});
      if (t > 440.2) { en.hR = [-0.05, 0.6, 0.22]; en.nk = [0.25, 0, 0]; }
      actors.push(engiHero(en, { mouth: 'frown' }, { gun: null, grips: { R: 'open' } }));
    }
    const ink = t > 442.3 ? clamp((t - 442.3) / 0.6, 0, 1) : 0;
    return {
      set: 'board',
      env: 'board',
      camera: BOARD_CAM,
      actors,
      props: pins(t),
      cards: ink > 0 ? [{ tex: 'ink', x: 480 - 700 * ink, y: 270 - 700 * ink, w: 1400 * ink, h: 1400 * ink }] : [],
      post: { black: t > 443.0 ? 1 : 0 }
    };
  });

  at(443.81, (lt) => ({
    set: null,
    bg: [0, 0, 0],
    cards: [{ live: 'cartoon', u: Math.round(lt * 24) / 24 }],
    post: { flash: lt > 22.8 && lt < 24.9 ? clamp((lt - 23.6) * 0.8, 0, 0.8) : 0 }
  }));

  at(468.668, (lt, t) => {
    const k = clamp(lt / 2.2, 0, 1);
    const p = zp('gtr', lerp(3, 9, k), 1.6 + S(k * PI) * 2.2, lerp(4, 5, k));
    const ang = k * 4;
    return {
      set: 'kart',
      camera: zcam('gtr', [5, 0.9, 11], [6.4, 2.6, 4], 58, { roll: 0.2 }),
      props: [zprop('gtr', 'mauve', 7.2, 0, 4.2)],
      actors: [{ cls: 'engineer', team: 'blu', hat: 'cowboy', robot: true, face: { mouth: 'scream', open: 1, beard: true }, pose: Pose.airborne('engineer', p, [S(ang), C(ang), 0.2], [0, 0, 1], {}) }],
      grade: [1.2, 0.85, 0.5, 0.6],
      vignette: 0.8,
      post: { zoom: 0.6 }
    };
  });

  at(470.903, (lt, t) => {
    const en = Pose.prone('engineer', 20, 0, -0.9, { nk: [-0.2, 0.4, 0] });
    return {
      set: 'kart',
      camera: cam([20.6, 0.35, 0.9], [19.8, 0.3, -0.1], 52),
      actors: [{ cls: 'engineer', team: 'blu', hat: 'none', eyewear: 'goggles', robot: true, face: { eyes: 'shut', mouth: 'frown', beard: true }, pose: en }],
      props: [{ kind: 'cowboyHat', at: [lerp(20.6, 21.0, clamp(lt, 0, 1)), 0.05 + Math.max(0, 0.6 - lt) * 1.2, 0.2], roll: lt * 2 }],
      grade: [1.2, 0.85, 0.5, 0.6],
      vignette: 0.8
    };
  });

  at(472.005, (lt, t) => ({
    set: 'kart',
    env: 'burn',
    camera: cam([16, 2, -6 + lt], [24, 3, 10], 60),
    cards: [{ tex: 'warpHaze', alpha: 0.85 }],
    grade: [1.2, 0.8, 1.0, 0.3]
  }));

  at(473.94, (lt, t) => ({
    set: 'kart',
    env: 'burn',
    camera: cam([12 + lt * 1.5, 2.4, -4], [24, 2, 12], 62, { roll: S(lt * 3) * 0.1 }),
    fx: [{ kind: 'fire', p: [24, 6.5, 12], u: t, w: 14, d: 4, h: 3.2, s: 1.8, n: 34 }, { kind: 'fire', p: [6, 6.6, 26], u: t + 0.3, w: 18, d: 1, h: 2.4, s: 1.4, n: 24 }],
    grade: [1.3, 0.75, 0.55, 0.2],
    post: { tint: [0.3, 0.05, 0.4, 0.2 + S(lt * 11) * 0.1] }
  }));

  at(476.542, () => ({ set: null, bg: [0, 0, 0] }));

  at(479.55, (lt) => ({ set: null, bg: [0, 0, 0], cards: [{ tex: 'intermission', x: 182, y: -101, w: 768, h: 432, alpha: clamp(lt / 0.2, 0, 1) }] }));

  window.FabScript2 = { FROM: 241.274, TO: 480, SHOTS };
})();
