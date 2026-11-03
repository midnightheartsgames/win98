(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Pose = window.FabPose;
  const Cast = window.FabCast;
  const V = window.FabVoice;
  const VOICE = V ? K.envelope(V.ALL, V.RATE) : () => 0;

  const SHOTS = [];
  const at = (t0, fn) => SHOTS.push([t0, fn]);

  function lin(list) {
    return (t) => {
      if (t <= list[0][0]) return list[0][1];
      for (let i = 1; i < list.length; i++) {
        if (t < list[i][0]) {
          const [t0, a] = list[i - 1];
          const [t1, b] = list[i];
          const k = (t - t0) / (t1 - t0);
          return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], k)) : lerp(a, b, k);
        }
      }
      return list[list.length - 1][1];
    };
  }

  function cam(eye, atv, fov, o) {
    return Object.assign({ eye, at: atv, fov: fov || 50 }, o || {});
  }

  function camLin(list) {
    const E = lin(list.map(k => [k[0], k[1]]));
    const A = lin(list.map(k => [k[0], k[2]]));
    const F = lin(list.map(k => [k[0], k[3] || 50]));
    return (t, o) => Object.assign({ eye: E(t), at: A(t), fov: F(t) }, o || {});
  }

  function camEase(list) {
    const E = K.keys(list.map(k => [k[0], k[1]]));
    const A = K.keys(list.map(k => [k[0], k[2]]));
    const F = K.keys(list.map(k => [k[0], k[3] || 50]));
    return (t, o) => Object.assign({ eye: E(t), at: A(t), fov: F(t) }, o || {});
  }

  function talk(t, k, base) {
    const v = VOICE(t) * (k === undefined ? 1 : k);
    return Object.assign({ mouth: v > 0.08 ? 'open' : 'shut', open: v }, base || {});
  }

  function strum(t, rate) {
    const r = rate || 2.2;
    return S(t * PI * 2 * r) * 0.035;
  }

  function guitarist(cls, team, x, z, yaw, t, o) {
    const opts = o || {};
    const pose = Pose.stand(cls, x, z, yaw, { dy: -(opts.sit || 0.38), sp: [0.12, 0, 0], nk: opts.nk || [0.12 + S(t * 3.1) * 0.03, -0.12, 0] });
    const fwd = [S(yaw), 0, C(yaw)];
    pose.fLw = V3.add(pose.fLw, V3.mul(fwd, 0.34));
    pose.fRw = V3.add(pose.fRw, V3.mul(fwd, 0.3));
    const g = Cast.twoHanded('guitar', { hROff: [0, strum(t, opts.rate), 0.01], hLOff: [0, S(t * 1.3) * 0.02, 0] });
    pose.hR = g.hR;
    pose.hL = g.hL;
    return pose;
  }

  function engiHero(pose, face, extra) {
    return Object.assign({ cls: 'engineer', team: 'blu', hat: 'cowboy', robot: true, gun: 'guitar', grips: { L: 'grip', R: 'open' }, face: Object.assign({ mouth: 'smirk', beard: true }, face || {}), pose }, extra || {});
  }

  function armed(a) {
    if (a.gun) {
      const g = Cast.twoHanded(a.gun, a.gunOpts);
      a.pose.hR = g.hR;
      a.pose.hL = g.hL;
    }
    return a;
  }

  function darkStage(t, o) {
    const opts = o || {};
    const pose = guitarist('engineer', 'blu', 0, 0, 0, t, {});
    const push = opts.push || 0;
    const camX = opts.camX || 0;
    return {
      set: 'dark',
      camera: cam([camX + 0.05, 0.9 - push * 0.05, 5.2 - push * 0.6], [camX, 0.8, 0], 30),
      actors: [engiHero(pose, { mouth: 'shut' }, { shadow: false })],
      props: [{ kind: 'crate', at: [0, 0, -0.18] }],
      fx: [{ kind: 'glow', p: [0, 1.0, -1.2], s: 3.2, col: [0.55, 0.48, 0.34], alpha: 0.5 }],
      grade: [0.95, 0.86, 0.7, 0.3],
      vignette: 1.2,
      grain: 0.03
    };
  }

  function card(key, lt, dur, o) {
    const opts = o || {};
    const k = ease(lt / (opts.zoomDur || dur));
    const s = lerp(opts.from || 1.3, opts.to || 1.0, k);
    const w = 960 * s, h = 540 * s;
    const fade = opts.fadeOut ? clamp((lt - (dur - opts.fadeOut)) / opts.fadeOut, 0, 1) : 0;
    return { set: null, bg: [0, 0, 0], cards: [{ tex: key, x: 480 - w / 2, y: 270 - h / 2, w, h }], post: { black: fade + (opts.fadeIn ? clamp(1 - lt / opts.fadeIn, 0, 1) : 0) } };
  }

  function hallRun(cls, team, gun, lt, x, z0, z1, dur, ph) {
    const z = lerp(z0, z1, clamp(lt / dur, 0, 1));
    return armed({ cls, team, gun, pose: Pose.run(cls, x, z, 0, lt * (ph || 1.6), {}) });
  }

  at(0, (lt) => {
    const st = darkStage(lt, { push: lt / 11.7 });
    st.post = { black: clamp(1 - lt / 3, 0, 1) };
    return st;
  });

  at(11.711, (lt, t, dur) => card('presents', lt, dur));

  at(14.548, (lt) => {
    const pose = guitarist('engineer', 'blu', 0, 0, 0, lt + 14.5, { rate: 2.6 });
    const m = Cast.solve('engineer', pose);
    const g = Cast.twoHanded('guitar', {});
    const hole = M4.point(M4.mul(m.chest, g.M), [0.0, 0.1, 0.06]);
    const drift = lt / 2.8;
    return {
      set: 'dark',
      envOver: { points: [{ pos: V3.add(hole, [0.5, 0.6, 0.6]), color: [1.3, 0.95, 0.65] }] },
      camera: cam(V3.add(hole, [0.16 - drift * 0.05, 0.1, 0.3]), V3.add(hole, [-0.05, -0.02 + drift * 0.03, 0]), 40),
      actors: [engiHero(pose, { mouth: 'shut' }, { shadow: false })],
      grade: [1.0, 0.78, 0.58, 0.2],
      vignette: 1.6,
      grain: 0.05,
      post: { zoom: 0.6 }
    };
  });

  at(17.317, (lt, t, dur) => card('production', lt, dur, { fadeOut: 0.6 }));

  at(20.153, (lt) => {
    const st = darkStage(lt + 20, { push: 0.4 });
    if (lt > 2.1) st.post = { black: clamp((lt - 2.1) / 0.6, 0, 0.85) };
    return st;
  });

  at(22.35, (lt) => {
    const st = darkStage(lt + 22, { push: 0.5 });
    st.grade = [0.5, 0.52, 0.3, 0.4];
    st.cards = [{ tex: 'inkWipe', x: -200 + lt * 200, y: -100, w: 1360, h: 740, alpha: 0.85 }];
    st.post = { tint: [0.28, 0.3, 0.12, 0.35] };
    return st;
  });

  function dustLogo(lt, flash) {
    const k = ease(clamp(lt / 0.35, 0, 1));
    const s = lerp(2.6, 1, k);
    const bob = S(lt * 1.4) * 4;
    const w = 660 * s, h = 495 * s;
    const guns = clamp((lt - 1.1) / 0.5, 0, 1);
    const props = [];
    if (guns > 0) {
      props.push({ kind: 'minigun', M: M4.chain(M4.translate(-26.5, 0.55 - (1 - guns) * 0.8, -1.6), M4.rotY(-0.9), M4.rotX(-0.35), M4.scale(1.6, 1.6, 1.6)) });
      props.push({ kind: 'rocket', M: M4.chain(M4.translate(-27.5, 3.2 + (1 - guns) * 0.8, 1.2), M4.rotY(0.3), M4.rotZ(-0.5), M4.scale(1.5, 1.5, 1.5)) });
    }
    return {
      set: 'dust',
      camera: cam([-20, 1.1, 0], [-40, 2.7, 0], 44),
      props,
      cards: [{ tex: 'logo', x: 495 - w / 2, y: 262 - h / 2 + bob, w, h }],
      post: { flash: flash ? clamp(1 - lt / 0.25, 0, 1) : 0 },
      grade: [0.92, 0.9, 0.95, 0.3]
    };
  }

  at(23.056, (lt) => ({
    set: 'dust',
    camera: cam([-20, 1.1, 0], [-40, 3.6, 0], 44),
    post: { flash: 0.6 - lt },
    grade: [0.92, 0.9, 0.95, 0.3]
  }));

  at(23.423, (lt) => dustLogo(lt, true));

  at(28.294, (lt) => {
    const st = dustLogo(lt + 4.9, false);
    st.post = { flash: clamp(lt / 0.25, 0, 1) * 0.85, zoom: 1.5 };
    return st;
  });

  at(28.762, (lt) => {
    const slide = ease(clamp((lt - 0.55) / 0.5, 0, 1));
    return {
      set: 'dust',
      camera: cam([20.6, 1.45, -31.2], [20.4, 1.25, -16], 48),
      actors: [hallRun('soldier', 'blu', 'rocket', lt, 20.2, -27.5, -18.5, 2.5, 1.6), hallRun('heavy', 'blu', null, lt + 0.4, 22.6, -26, -22, 2.5, 1.2)],
      cards: [{ tex: 'starring', x: lerp(-280, 0, slide), y: 340, w: 440, h: 110, rot: -0.3 }],
      post: { flash: clamp(1 - lt / 0.35, 0, 1) },
      grade: [0.95, 0.88, 0.8, 0.2]
    };
  });

  at(31.264, (lt) => {
    const k = clamp(lt / 1.5, 0, 1);
    const p = [lerp(-4, 4, k), 1.2 + S(k * PI) * 4.2, 14 + lerp(-2, 2, k)];
    return {
      set: 'dust',
      camera: cam([lerp(-3, 3, k), 0.6, 8], [p[0] * 0.8, 2.6, 14], 55, { roll: -0.15 + k * 0.3 }),
      actors: [armed({ cls: 'soldier', team: 'blu', gun: 'rocket', pose: Pose.airborne('soldier', p, [0.2, 1, 0], [1, 0, 0.2], {}) })],
      fx: [{ kind: 'smoke', p: [-4, 0.3, 12], u: lt + 0.3, s: 1.4, dur: 2, col: [0.75, 0.68, 0.55], alpha: 0.7 }],
      post: { zoom: 1.0 },
      cards: [{ tex: 'starring', x: 0, y: 340, w: 440, h: 110, rot: -0.3, alpha: clamp(1 - lt / 0.4, 0, 1) }],
      grade: [0.95, 0.9, 0.85, 0.2]
    };
  });

  at(32.766, (lt) => ({
    set: 'dust',
    camera: cam([-4, 1.4, 2], [-6, 2.4, -6], 50, { shake: 0.15, shakeT: lt * 9 }),
    fx: [{ kind: 'boom', p: [-5, 1.2, -4.0], u: lt + 0.1, s: 2.6, dur: 0.7 }],
    actors: [{ cls: 'scout', team: 'blu', pose: Pose.airborne('scout', [-4.4, 1.6 + lt * 3, -3.4], [0.4, 1, 0.2], [0, 0, 1], {}) }],
    post: { flash: clamp(0.5 - lt, 0, 1) },
    grade: [0.95, 0.9, 0.85, 0.2]
  }));

  function heavyHelmet(lt, close) {
    const pose = Pose.stand('heavy', 0, 0, 0, { sp: [0.05, 0, 0], nk: [0.05, 0.1, 0] });
    pose.hR = [-0.05, 0.38, 0.32];
    pose.hL = [0.36, -0.2, 0.15];
    return {
      set: 'dust',
      envOver: { fogColor: [0.18, 0.17, 0.16] },
      camera: cam([0.25, 1.75, close ? 1.05 : 1.6], [0, 1.6, 0], close ? 36 : 40),
      actors: [{ cls: 'heavy', team: 'red', hat: 'horned', itemR: 'sandvich', grips: { R: 'grip' }, face: { mouth: 'open', open: 0.5 + S(lt * 9) * 0.3, eyes: 'half', mask: 0x1c1a1a }, pose }],
      grade: [0.75, 0.68, 0.6, 0.35],
      vignette: 0.8
    };
  }

  at(33.266, (lt) => {
    const st = heavyHelmet(lt, false);
    const k = ease(clamp(lt / 0.6, 0, 1));
    const z = 1400 * (0.75 + k * 1.1);
    st.cards = [{ tex: 'heartMask', x: 480 - z / 2, y: 270 - z / 2, w: z, h: z }];
    return st;
  });

  at(34.3, (lt) => {
    const st = heavyHelmet(lt + 1, true);
    st.post = { flash: lt < 0.34 ? 0.5 * (1 - frac(lt * 10)) : 0 };
    return st;
  });

  at(34.701, (lt, t, dur) => card('sketchHeavy', lt, dur, { from: 1.08, to: 1.0 }));

  at(35.769, (lt) => ({
    set: 'dust',
    camera: cam([24.6, 1.45, -24.5], [24.7, 1.3, -14], 44),
    actors: [hallRun('heavy', 'blu', 'minigun', lt, 24.7, -22.6, -17.5, 1.3, 1.3)],
    fx: [{ kind: 'fire', p: [26, 0.1, -15], u: lt, h: 1.0, s: 0.5, n: 8 }],
    grade: [0.92, 0.85, 0.78, 0.25]
  }));

  at(37.07, () => {
    const pose = Pose.stand('scout', 0, 0, 0.25, { sp: [0.12, 0, 0], nk: [0.02, -0.25, 0] });
    return {
      set: 'dust',
      camera: cam([0.55, 1.55, 1.35], [0.02, 1.42, 0], 42),
      actors: [armed({ cls: 'scout', team: 'red', gun: 'scatter', gunOpts: { pitch: 0.25 }, face: { mouth: 'teeth', eyes: 'angry', brows: 'angry' }, pose })],
      grade: [0.9, 0.85, 0.8, 0.25]
    };
  });

  at(37.37, (lt, t, dur) => card('sketchScout', lt, dur, { from: 1.08, to: 1.0 }));

  at(38.538, (lt) => {
    const pose = Pose.stand('sniper', 19.6, -24.2, PI - 0.4, { nk: [0, 0.3, 0] });
    pose.hR = [-0.12, 0.05, 0.4];
    const crowd = [
      armed({ cls: 'pyro', team: 'red', gun: 'flamer', pose: Pose.run('pyro', 21.6, lerp(-27, -29, lt / 1.8), PI * 0.9, lt * 1.4, {}) }),
      armed({ cls: 'soldier', team: 'red', gun: 'rocket', pose: Pose.run('soldier', 22.8, lerp(-26, -28, lt / 1.8), PI, lt * 1.3 + 0.3, {}) }),
      { cls: 'spy', team: 'blu', pose: Pose.stand('spy', 23.6, -29.5, -2.6, {}) },
      { cls: 'heavy', team: 'red', pose: Pose.stand('heavy', 20.8, -29.8, 0.2, {}) }
    ];
    return {
      set: 'dust',
      camera: cam([18.6, 1.75, -21.8], [22, 1.3, -30], 50, { shake: lt > 1.25 ? 0.1 : 0, shakeT: lt * 12 }),
      actors: [{ cls: 'sniper', team: 'blu', hat: 'hood', itemR: 'pistol', grips: { R: 'grip' }, face: { mouth: 'teeth' }, pose }].concat(crowd),
      fx: lt > 1.3 ? [{ kind: 'boom', p: [22.2, 1.2, -27.5], u: lt - 1.3, s: 2.0, dur: 0.8 }] : [{ kind: 'fire', p: [21.6, 1.2, -27.3], dir: [0, 0.1, -1], u: lt, h: 1.6, s: 0.4, n: 10 }],
      grade: [1, 0.85, 0.7, 0.2]
    };
  });

  at(40.273, (lt, t, dur) => card('sketchSniper', lt, dur, { from: 1.08, to: 1.0 }));

  at(41.408, (lt) => {
    const z = lerp(-2.2, 0.6, lt / 1.4);
    const pose = Pose.run('heavy', 0.3, z, 0.1, lt * 0.9, { stride: 0.18, lean: 0.06, bob: 0.4 });
    pose.hR = [-0.24, -0.1, 0.25];
    pose.hL = [0.24, -0.1, 0.28];
    return {
      set: 'dust',
      camera: cam([0.1, 1.45, 3.3], [0.25, 1.45, -1], 40),
      actors: [{ cls: 'heavy', team: 'red', hat: 'none', eyewear: 'goggles', grips: { L: 'fist', R: 'fist' }, pose }],
      fx: [{ kind: 'smoke', p: [0, 0.2, 1.4], u: lt + 1, s: 2.4, dur: 4, col: [0.6, 0.56, 0.5], alpha: 0.3 }],
      cards: lt < 0.3 ? [{ tex: 'stripesWipe', x: lerp(-960, 960, lt / 0.3), y: 0, w: 960, h: 540 }] : [],
      grade: [0.7, 0.68, 0.66, 0.4]
    };
  });

  at(42.809, (lt) => ({
    set: 'dust',
    camera: cam([-3 + lt * 2, 2.5, 15], [2 + lt * 2, 6.5, 22], 60, { roll: 0.35 }),
    grade: [0.75, 0.75, 0.8, 0.35]
  }));

  at(43.61, (lt) => ({
    set: 'dust',
    camera: cam([10 - lt * 1.5, 2.6, -1], [16, 3.0, 5], 55),
    grade: [0.85, 0.82, 0.8, 0.25]
  }));

  at(44.511, (lt) => ({
    set: 'dust',
    camera: cam([6.1, 1.85, -0.75], [7.3, 3.4, -6.5], 52),
    actors: [armed({ cls: 'soldier', team: 'blu', gun: 'rocket', pose: Pose.stand('soldier', 6.6, -1.9, PI + 0.15, { sp: [0.1, -0.2, 0] }) })],
    fx: lt > 0.3 ? [{ kind: 'boom', p: [7.6, 1.8, -6.6], u: lt - 0.3, s: 1.4, dur: 0.7 }] : [],
    grade: [0.9, 0.85, 0.8, 0.25]
  }));

  at(45.712, (lt) => ({
    set: 'dust',
    camera: cam([6 + lt, 2.2, 4], [7.2, 3.2, -6.5], 50),
    props: [{ kind: 'sentry', at: [5.5, 0, -5], yaw: 0.2 }, { kind: 'sentry', at: [8.8, 0, -5.2], yaw: -0.3 }],
    actors: [{ cls: 'engineer', team: 'red', pose: Pose.stand('engineer', 7.2, -4.8, 0, {}) }],
    grade: [0.9, 0.85, 0.8, 0.25]
  }));

  at(46.212, (lt) => {
    const pan = lerp(-0.4, 0.3, lt / 1.5);
    return {
      set: 'dust',
      camera: cam([0.9 + pan, 1.55, 1.7], [pan * 0.4, 1.35, 0], 44, { roll: 0.05 }),
      props: [{ kind: 'sentry', at: [-1.1, 0, -0.6], yaw: 0.6, s: 1.3 }],
      actors: [
        { cls: 'engineer', team: 'red', itemR: 'wrenchSteel', grips: { R: 'grip' }, face: { mouth: 'grin' }, pose: Pose.stand('engineer', 0, 0, -0.3, { nk: [0, 0.2, 0] }) },
        { cls: 'spy', team: 'red', pose: Pose.stand('spy', 0.9, -1.2, -0.2, {}) }
      ],
      cards: [{ tex: 'peeps', x: 170, y: 250, w: 620, h: 260, rot: -0.1, alpha: ease(clamp(lt / 0.3, 0, 1)) }],
      post: { zoom: 0.6 },
      grade: [0.95, 0.88, 0.8, 0.2]
    };
  });

  at(47.714, (lt) => {
    const k = clamp(lt / 0.67, 0, 1);
    const p = [-5.6, 2.8 - k * k * 1.6, lerp(-3.2, -1.8, k)];
    return {
      set: 'dust',
      camera: cam([-5.4, 2.2, 1.6], [-5.8, 2.2, -4], 50),
      actors: [{ cls: 'heavy', team: 'red', grips: { L: 'fist', R: 'fist' }, pose: Pose.airborne('heavy', p, [0.05, 1, -0.1], [0, 0, -1], { hL: [0.45, 0.25, 0.1], hR: [-0.45, 0.3, 0.1] }) }],
      grade: [0.9, 0.85, 0.8, 0.25]
    };
  });

  at(48.381, (lt) => ({
    set: 'dust',
    camera: cam([18.6, 2.3, -25.0 - lt * 0.3], [16.05, 2.6, -26], 30, { roll: -0.12 }),
    grade: [0.95, 0.92, 0.9, 0.15]
  }));

  at(49.049, (lt) => {
    const gunOpts = { pitch: -0.6, off: [0.04, -0.06, -0.06] };
    const a = armed({ cls: 'scout', team: 'red', gun: 'scatter', gunOpts, grips: { L: 'grip', R: 'grip' }, pose: Pose.stand('scout', 0, 0, 0, { sp: [0.15, 0, 0] }) });
    a.pose.hL = V3.add(a.pose.hL, [0, 0, -0.08 + S(lt * 9) * 0.06]);
    return {
      set: 'dust',
      camera: cam([0.45, 1.25, 0.75], [-0.02, 0.98, 0.25], 40),
      actors: [a],
      grade: [1.0, 0.88, 0.75, 0.15],
      post: { zoom: 0.5 }
    };
  });

  at(50.45, (lt) => {
    const list = [hallRun('soldier', 'blu', 'rocket', lt, 20.2, -13.5, -19, 0.7, 1.6), hallRun('heavy', 'blu', 'minigun', lt, 21.5, -12.8, -17, 0.7, 1.3)];
    list.forEach(a => { a.pose.fwd = [0, 0, -1]; });
    return {
      set: 'dust',
      camera: cam([20.8, 1.4, -10.5], [20.8, 1.4, -24], 48),
      actors: list,
      grade: [0.85, 0.85, 0.9, 0.25]
    };
  });

  at(51.151, (lt) => {
    const st = darkStage(lt + 51, { push: 0.2, camX: 0.95 });
    const a = ease(clamp(lt / 0.5, 0, 1));
    st.cards = [{ tex: 'created', x: lerp(640, 540, a), y: 220, w: 360, h: 140, alpha: a }];
    return st;
  });

  const GUN = { heavy: 'minigun', soldier: 'rocket', pyro: 'flamer', demo: 'grenade', scout: 'scatter', sniper: 'rifle', engineer: 'shotgun', medic: 'medigun', spy: null };

  const TIMER = [
    [55.09, '60', 'red'], [57.12, '59'], [58.12, '58'], [59.12, '57'], [60.12, '56'], [61.12, '55'], [62.12, '54'], [63.12, '53'], [64.12, '52'], [65.12, '51'],
    [66.12, '50'], [67.12, '49'], [68.12, '48'], [69.12, '47'], [70.12, '46'], [71.12, '45'], [72.12, '44'], [73.12, '43'], [74.12, '42'], [75.12, '41'],
    [76.12, 'FISH'], [77.12, '25'], [78.12, '222'], [79.12, '1'], [80.12, '2+2'], [81.12, '-'], [82.12, '4'], [83.12, '.-'], [84.12, '77'], [85.12, '52'],
    [86.12, '3.1459'], [87.12, 'UH'], [88.12, 'PI', 'blu'], [89.12, '69'], [90.12, '-93'], [91.12, '123'], [92.25, 'ABC'], [93.25, '123'], [94.25, 'BABY'],
    [95.25, 'U'], [96.25, '&'], [97.25, 'ME'], [98.25, '<3'], [99.25, 'ASDFG'], [99.5, 'OK', 'red'], [100.5, 'HERE', 'blu'],
    [101.25, 'WE', 'red'], [102.25, 'GO', 'blu'], [103.25, '0', 'red'], [104.14, null]
  ];

  const CHAT = [
    [64.25, 69.4, 'fatbob3092 has left the game (Disconnect by user)'],
    [70.9, 73.74, 'yermom_98lyfe has left the game (Disconnect by user)'],
    [73.74, 76.3, 'RunFromTheGriefers has joined the game']
  ];

  function hud(t, extra) {
    let text = null, team = 'red';
    TIMER.forEach(([t0, tx, tm]) => {
      if (t >= t0) {
        text = tx;
        if (tm) team = tm;
      }
    });
    if (!text) return extra ? Object.assign({}, extra) : null;
    return Object.assign({ timer: text, team, chat: CHAT.filter(c => t >= c[0] && t < c[1]).map(c => c[2]) }, extra || {});
  }

  function crouchSpam(cls, x, z, yaw, t, ph, rate, o) {
    const up = Pose.stand(cls, x, z, yaw, o);
    const down = Pose.crouch(cls, x, z, yaw, o);
    const k = clamp(0.5 + S((t * rate + ph) * PI * 2) * 1.4, 0, 1);
    return Pose.blend(up, down, k);
  }

  const CROWD = (() => {
    const g = window.P3D.rand(42);
    const kinds = ['heavy', 'soldier', 'pyro', 'heavy', 'demo', 'soldier', 'pyro', 'heavy', 'scout', 'soldier', 'demo', 'pyro', 'heavy', 'sniper', 'soldier', 'pyro', 'heavy', 'demo', 'soldier'];
    const list = kinds.map((cls, i) => ({ cls, x: -3.0 + (i % 6) * 1.0 + (g() - 0.5) * 0.45, z: -3.4 + Math.floor(i / 6) * 1.0 + (g() - 0.5) * 0.45, yaw: -1.75 + (g() - 0.5) * 0.7, ph: g(), rate: 1.4 + g() * 1.3 }));
    list.push({ cls: 'heavy', x: 0.4, z: 0.9, yaw: -1.7, ph: 0.3, rate: 1.1 });
    return list;
  })();

  function crowdActors(t, filter) {
    return CROWD.filter((c, i) => !filter || filter(c, i)).map(c => armed({ cls: c.cls, team: 'red', gun: GUN[c.cls], pose: crouchSpam(c.cls, c.x, c.z, c.yaw, t, c.ph, c.rate) }));
  }

  function headOf(c, t) {
    const pose = crouchSpam(c.cls, c.x, c.z, c.yaw, t, c.ph, c.rate);
    const m = Cast.solve(c.cls, pose);
    return V3.add(m.pts.head, [0, 0.42, 0]);
  }

  at(55.088, (lt, t) => {
    const bubbles = [];
    if (t >= 60.5) bubbles.push({ at: headOf(CROWD[6], t), kind: 'medic' });
    if (t >= 63.0) bubbles.push({ at: headOf(CROWD[2], t), kind: 'medic' }, { at: headOf(CROWD[3], t), kind: 'medic' });
    return {
      set: 'red',
      camera: cam([1.0, 1.15, 2.2], [-1.6, 0.95, -6], 80),
      actors: crowdActors(t).concat([armed({ cls: 'medic', team: 'red', gun: 'medigun', pose: Pose.stand('medic', 6.0, -3.6, -1.9, {}) })]),
      hud: hud(t, { bubbles })
    };
  });

  at(67.434, (lt, t) => {
    const a = armed({ cls: 'heavy', team: 'red', gun: 'minigun', pose: Pose.stand('heavy', -4.6, -3.0, -1.97, { sp: [0.12, 0, 0] }) });
    const m = Cast.solve('heavy', a.pose);
    const tip = M4.point(M4.mul(m.chest, Cast.twoHanded('minigun').M), [0, 0, 0.82]);
    const firing = (t > 67.55 && t < 67.75) || (t > 68.05 && t < 68.23);
    return {
      set: 'red',
      camera: cam([-4.15, 1.05, -3.8], [-6.9, 1.15, -3.45], 64),
      actors: [a],
      fx: firing ? [{ kind: 'muzzle', p: tip, s: 0.9, u: t }, { kind: 'smoke', p: tip, u: lt, s: 0.5, dur: 0.6, alpha: 0.6 }] : [],
      hud: hud(t)
    };
  });

  at(68.234, (lt, t) => {
    const fly = Pose.airborne('soldier', [lerp(-1, 2, lt / 1.2), 1.4 + lt * 2.2, lerp(-2, -3.5, lt / 1.2)], [0.3, 1, 0.2], [1, 0, 0], {});
    return {
      set: 'red',
      camera: cam([-4.5, 2.6, -4.6], [3, 0.9, 2.5], 64),
      actors: crowdActors(t, (c, i) => i % 2 === 0).concat([armed({ cls: 'soldier', team: 'red', gun: 'rocket', pose: fly })]),
      fx: [{ kind: 'smoke', p: [-1, 0.2, -2], u: lt + 0.2, s: 1.0, dur: 1.2, col: [0.6, 0.6, 0.6], alpha: 0.6 }],
      hud: hud(t)
    };
  });

  at(69.402, (lt, t) => {
    const k = clamp((t - 69.95) / 0.25, 0, 1);
    const actors = [];
    if (k < 1) {
      const pose = k > 0 ? Pose.airborne('medic', [0.8 + k * 1.6, Cast.standY('medic') + k * k * 3.4, 4.6 - k * 0.6], [0.4, 1, 0], [0, 0, -1], {}) : Pose.stand('medic', 0.8, 4.6, PI, { nk: [0.05, 0.1, 0] });
      actors.push({ cls: 'medic', team: 'red', hat: 'furcap', eyewear: 'glasses', face: { mouth: k > 0 ? 'scream' : 'shut', eyes: k > 0 ? 'wide' : 'open' }, pose });
    }
    if (t > 70.6) actors.push({ cls: 'soldier', team: 'red', pose: Pose.supine('soldier', 2.4, 3.2, 1.2, {}) });
    if (t > 71.3 && t < 72.7) actors.push(armed({ cls: 'scout', team: 'red', gun: 'scatter', pose: Pose.run('scout', lerp(2.6, -0.8, (t - 71.3) / 1.4), 4.2, -PI / 2, (t - 71.3) * 1.8, {}) }));
    return {
      set: 'red',
      camera: cam([0.95, 1.55, 3.05], [0.35, 1.35, 6], 56),
      actors,
      fx: t > 72.95 ? [{ kind: 'boom', p: [-0.6, 0.7, 5.2], u: t - 72.95, s: 0.9, dur: 0.8 }] : [],
      hud: hud(t)
    };
  });

  function scoutLoop(t) {
    const cycles = [[74.8, 75.3, 75.8], [76.8, 77.3, 77.8], [78.3, 78.8, 79.3]];
    const out = { scout: null, corpses: [] };
    cycles.forEach(([a, g, d], i) => {
      if (t >= d) out.corpses.push(i);
      else if (t >= a) out.scout = { t0: a, grab: clamp((t - g) / 0.3, 0, 1), i };
    });
    return out;
  }

  at(73.74, (lt, t) => {
    const L = scoutLoop(t);
    const hv = Pose.stand('heavy', 5.4, -2.1, -2.1, { nk: [0.1, 0, 0] });
    const actors = [];
    if (L.scout) {
      const g = L.scout.grab;
      hv.sp = [0.25 * g, 0, 0];
      hv.hL = [0.32 - 0.22 * g, -0.1 + 0.25 * g, 0.12 + 0.4 * g];
      hv.hR = [-0.32 + 0.22 * g, -0.1 + 0.25 * g, 0.12 + 0.4 * g];
      const sc = Pose.stand('scout', 5.4 - 0.36 * S(2.1), -2.1 - 0.36 * C(2.1), -2.1, { y: g * 0.3, nk: [0.3 * g, 0, 0.2 * g] });
      sc.hL = [0.3, 0.1 + g * 0.3, 0.1];
      sc.hR = [-0.3, 0.1 + g * 0.3, 0.1];
      actors.push({ cls: 'scout', team: 'red', face: { mouth: g > 0.2 ? 'scream' : 'shut', eyes: g > 0.2 ? 'wide' : 'open' }, pose: sc });
    }
    actors.push({ cls: 'heavy', team: 'red', grips: { L: 'fist', R: 'fist' }, face: { mouth: L.scout && L.scout.grab > 0 ? 'teeth' : 'shut', brows: 'angry' }, pose: hv });
    L.corpses.forEach(i => actors.push({ cls: 'scout', team: 'red', pose: Pose.supine('scout', 4.4 - i * 0.35, -0.6 + i * 0.5, 0.6 + i, {}) }));
    actors.push({ cls: 'soldier', team: 'red', pose: Pose.prone('soldier', 3.4, -0.4, 2.2, {}) });
    return {
      set: 'red',
      camera: cam([3.35, 1.45, -3.25], [5.4, 1.25, -2.1], 56),
      actors,
      hud: hud(t)
    };
  });

  at(80.78, (lt, t) => {
    const actors = [armed({ cls: 'heavy', team: 'red', gun: 'minigun', pose: crouchSpam('heavy', -0.6, -1.2, 1.2, t, 0.2, 1.2) })];
    actors.push(armed({ cls: 'scout', team: 'red', gun: 'scatter', pose: Pose.run('scout', lerp(-3, 3, lt / 2.8), 0.6, PI / 2, lt * 1.8, {}) }));
    actors.push({ cls: 'scout', team: 'red', pose: Pose.supine('scout', 1.2, -2.6, 2.4, {}) });
    actors.push(armed({ cls: 'pyro', team: 'red', gun: 'flamer', pose: Pose.stand('pyro', 2.8, -3.8, -2.6, {}) }));
    return {
      set: 'red',
      camera: cam([0.3, 0.7, -4.6], [-0.4, 1.3, 6], 66),
      actors,
      fx: t > 82.4 && t < 83.4 ? [{ kind: 'boom', p: [3.6, 1.2, -2.8], u: t - 82.4, s: 1.6, dur: 0.9 }] : [],
      hud: hud(t)
    };
  });

  at(83.65, (lt, t) => {
    const actors = [];
    const k = clamp((t - 84.3) / 0.6, 0, 1);
    if (t < 85.0) actors.push(armed({ cls: 'soldier', team: 'red', gun: 'rocket', pose: Pose.airborne('soldier', [lerp(-4.6, -6.6, k), 1.1 + S(k * PI) * 0.5, lerp(1.6, 0.6, k)], [-1, 0.3, -0.2], [0, -1, 0], {}) }));
    actors.push(armed({ cls: 'pyro', team: 'red', gun: 'flamer', pose: Pose.stand('pyro', -5.9, 0.2, -PI / 2, {}) }));
    actors.push(armed({ cls: 'heavy', team: 'red', gun: 'minigun', pose: Pose.run('heavy', lerp(-4.4, -6.4, clamp((t - 84.8) / 1.5, 0, 1)), 1.7, -PI / 2, lt * 1.2, { stride: 0.22 }) }));
    actors.push(armed({ cls: 'soldier', team: 'red', gun: 'rocket', pose: Pose.stand('soldier', -2.6, -1.4, -PI / 2 - 0.4, {}) }));
    return {
      set: 'red',
      camera: cam([-3.4, 1.45, 0.75], [-7, 1.4, 0.75], 64),
      actors,
      hud: hud(t)
    };
  });

  at(86.286, (lt, t) => {
    const k = clamp(lt / 1.8, 0, 1);
    const fly = Pose.airborne('soldier', [lerp(21, 15, k), 6.0 + lt * 1.5 - lt * lt * 0.6, lerp(10, 4, k)], [0.6, 0.6, 0.4], [0.3, -0.5, 0.8], {});
    return {
      set: 'kart',
      camera: cam([15.5, 0.5, 1.5], [24, 3.6, 12], 66),
      actors: [armed({ cls: 'soldier', team: 'red', gun: 'rocket', pose: fly })],
      fx: [{ kind: 'shards', p: [21, 6.2, 10], u: lt, s: 4, n: 40 }],
      hud: hud(t)
    };
  });

  at(88.121, (lt, t) => ({
    set: 'blu',
    camera: cam([-3.2, 2.3, 4.6], [-3.2, 2.5, 7.2], 50, { roll: 0.06 }),
    actors: lt > 0.7 && lt < 1.3 ? [{ cls: 'scout', team: 'red', pose: Pose.airborne('scout', [lerp(-6, 0, (lt - 0.7) / 0.6), 2.6, 9], [1, 0.4, 0], [0, 0, -1], {}) }] : [],
    hud: hud(t)
  }));

  function diner(t) {
    const hv = Pose.stand('heavy', -1.45, 3.3, 2.35, { dy: -0.5, sp: [0.2, 0, 0] });
    hv.fLw = [hv.fLw[0] - 0.2, 0.075, hv.fLw[2] + 0.35];
    hv.fRw = [hv.fRw[0] - 0.2, 0.075, hv.fRw[2] + 0.35];
    hv.hL = [0.3, 0.05, 0.4];
    hv.hR = [-0.25, 0.25 + S(t * 3) * 0.05, 0.45];
    const eye = Pose.stand('spy', 0.95, 1.9, -0.7, { dy: -0.48, sp: [0.1, 0, 0] });
    eye.hL = [0.25, 0.0, 0.35];
    eye.hR = [-0.25, 0.0, 0.35];
    return [
      { cls: 'heavy', team: 'blu', grips: { R: 'fist' }, pose: hv, face: talk(t, 0.8) },
      { cls: 'spy', team: 'blu', hat: 'eyeball', pose: eye },
      { cls: 'spy', team: 'blu', pose: Pose.stand('spy', 2.1, 3.6, -2.4, { nk: [0, 0.3, 0] }), itemR: 'knife', grips: { R: 'grip' } },
      { cls: 'soldier', team: 'blu', pose: Pose.stand('soldier', 3.6, -1.0, -2.2, { dy: -0.48 }) },
      { cls: 'demo', team: 'blu', pose: Pose.stand('demo', -2.4, -1.0, 1.6, { dy: -0.46 }) },
      { cls: 'medic', team: 'blu', pose: Pose.stand('medic', 5.6, 1.0, -1.8, {}) },
      { cls: 'engineer', team: 'blu', pose: Pose.stand('engineer', -0.6, -2.2, 0.8, { dy: -0.4 }) }
    ];
  }

  at(89.723, (lt, t) => ({
    set: 'blu',
    camera: cam([-0.4, 1.25, 4.4], [1.0, 1.25, -1.0], 66),
    actors: diner(t),
    props: [{ kind: 'plate', at: [0.25, 0.77, 3.05] }, { kind: 'plate', at: [0.95, 0.77, 2.3] }],
    hud: hud(t)
  }));

  at(95.095, (lt, t) => {
    const k = clamp(lt / 0.95, 0, 1);
    return {
      set: 'blu',
      camera: cam([lerp(0.9, -0.2, k), 1.0, 3.3], [-1.45, 1.3, 2.6], 52),
      actors: diner(t).slice(0, 1),
      props: [{ kind: 'bowl', at: [0.4, 0.78, 3.0], s: 1.4 }],
      hud: hud(t)
    };
  });

  at(96.029, (lt, t) => {
    const hv = Pose.stand('heavy', 0, 0, 0, { dy: -0.5, sp: [0.25, 0, 0], nk: [-0.1, 0, 0] });
    hv.hL = [0.12, 0.42, 0.28];
    hv.hR = [-0.12, 0.42, 0.28];
    return {
      set: 'blu',
      camera: cam([0.2, 1.35, 1.25], [0, 1.2, 0], 46),
      actors: [{ cls: 'heavy', team: 'blu', grips: { L: 'open', R: 'open' }, face: { mouth: 'o', eyes: 'wide', brows: 'up' }, pose: hv }],
      props: [{ kind: 'sandwiches', at: [0.12, 0.8, 0.62] }],
      hud: hud(t)
    };
  });

  at(96.663, (lt, t) => ({
    set: 'blu',
    camera: cam([0.1, 1.35, 1.45], [0.0, 1.25, 0], 50),
    actors: [{ cls: 'spy', team: 'blu', face: { mouth: 'smirk' }, pose: Pose.stand('spy', 0, 0, 0, { dy: -0.05, hL: [0.25, -0.05, 0.3], hR: [-0.25, -0.05, 0.3] }) }],
    props: [{ kind: 'pizza', at: [0.0, 0.82, 0.62] }],
    hud: hud(t)
  }));

  at(97.664, (lt, t) => ({
    set: 'blu',
    camera: cam([0.15, 1.4, 1.35], [0.0, 1.2, 0], 50),
    actors: [
      { cls: 'soldier', team: 'blu', face: talk(t, 1), pose: Pose.stand('soldier', 0, 0, 0, { dy: -0.06, hL: [0.22, -0.02, 0.32], hR: [-0.22, -0.02, 0.32] }) },
      { cls: 'medic', team: 'blu', pose: Pose.stand('medic', -0.75, 0.55, 0.6, { hL: [0.35, 0.2, 0.25] }) }
    ],
    props: [{ kind: 'ration', at: [0.0, 0.92, 0.55], tex: 'ration' }],
    hud: hud(t)
  }));

  const FLIGHT = [
    [99.532, [10, 3.5, 22], [24, 2.5, 13], 70, [16, 2.0, 17], [28, 2.0, 10]],
    [100.467, [4, 6, -2], [22, 2, 12], 70, [8, 4, 4], [24, 3, 14]],
    [101.101, [30, 1.6, 6.3], [30, 4.0, 7.5], 70, [29.5, 1.4, 5.5], [28.6, 4.5, 7.5]],
    [102.302, [10.5, 2.2, -3.2], [17, 0.8, 3], 64, [11.5, 2.0, -2.2], [17.5, 0.9, 3.5]],
    [103.303, [23.4, 1.7, -2.2], [27, 1.6, -2.0], 62, [23.8, 1.65, -2.1], [27, 1.6, -2.0]]
  ];
  FLIGHT.forEach(([t0, e0, a0, fov, e1, a1], i) => at(t0, (lt, t, dur) => {
    const k = clamp(lt / dur, 0, 1);
    return {
      set: 'kart',
      camera: cam(V3.add(e0, V3.mul(V3.sub(e1, e0), k)), V3.add(a0, V3.mul(V3.sub(a1, a0), k)), fov, { roll: i === 3 ? 0.4 : 0 }),
      post: { zoom: 0.8, flash: i === 3 && lt > 0.6 ? clamp((lt - 0.6) * 3, 0, 1) : 0 },
      hud: hud(t),
      cards: i === 4 && lt > 0.7 ? [{ tex: 'scan', alpha: 0.8 }] : []
    };
  }));

  function yardCam() {
    return cam([-4.9, 1.1, 1.2], [1.6, 0.9, -12], 58);
  }

  at(104.137, (lt, t) => {
    const actors = [];
    if (t > 108.7 && t < 110.6) {
      const k = clamp((t - 108.7) / 1.9, 0, 1);
      actors.push({ cls: 'soldier', team: 'blu', pose: Pose.prone('soldier', lerp(-6.4, -5.2, k), -3.4, PI / 2 + S(k * 9) * 0.3, { y: 0.02 }) });
    }
    if (t > 111.7) {
      const k = clamp((t - 111.7) / 2.6, 0, 1);
      actors.push(armed({ cls: 'demo', team: 'blu', gun: 'grenade', pose: k < 0.35 ? Pose.airborne('demo', [-5.6 + k * 2, 1.4 + S(k / 0.35 * PI) * 0.7, -3.4], [0, 1, 0], [1, 0, 0], {}) : Pose.run('demo', -5.0 + k * 1.2, lerp(-3.4, 1.5, k), 0.2, t * 1.6, {}) }));
    }
    return {
      set: 'kart',
      camera: yardCam(),
      actors,
      hud: hud(t)
    };
  });

  at(114.381, (lt, t) => {
    const pose = Pose.stand('sniper', -5.0, -3.5, PI / 2 - 0.15, { nk: [0.05, -0.2, 0] });
    const g = Cast.twoHanded('rifle', { pitch: -1.0, roll: 0.5, off: [0.02, -0.05, -0.08] });
    pose.hR = g.hR;
    pose.hL = g.hL;
    return {
      set: 'kart',
      camera: cam([-3.25, 1.55, -3.3], [-5.0, 1.35, -3.5], 44),
      actors: [{ cls: 'sniper', team: 'blu', gun: 'rifle', gunOpts: { pitch: -1.0, roll: 0.5, off: [0.02, -0.05, -0.08] }, eyewear: 'glasses', face: { mouth: lt > 0.6 ? 'smile' : 'shut' }, pose }],
      post: { black: clamp(1 - lt / 0.25, 0, 1) },
      hud: hud(t)
    };
  });

  at(116.616, (lt, t) => ({
    set: 'kart',
    camera: cam([10, 1.6, 4.5], [24, 2.6, 12], 58),
    hud: hud(t)
  }));

  at(120.387, (lt, t) => ({
    set: 'kart',
    camera: cam([-4.62, 1.83, -3.45], [-5.0, 1.8, -3.5], 40),
    actors: [{ cls: 'sniper', team: 'blu', eyewear: 'glasses', face: { mouth: 'grin', eyes: 'wide' }, pose: Pose.stand('sniper', -5.0, -3.5, PI / 2 - 0.15, {}) }],
    hud: hud(t)
  }));

  at(120.72, (lt) => ({
    set: null,
    bg: [0, 0, 0],
    cards: [{ tex: 'streaks', x: 480 - 600 * (1 + lt), y: 270 - 340 * (1 + lt), w: 1200 * (1 + lt), h: 680 * (1 + lt), alpha: 0.9 }],
    post: { flash: clamp((lt - 0.3) * 3, 0, 0.9) }
  }));

  const ARENA = { gate: [6, 26], barrier: [12, 16] };

  function team(cls, side, x, z, yaw, t, ph, kind) {
    const run = kind === 'run';
    const pose = run ? Pose.run(cls, x, z, yaw, t * 1.5 + ph, {}) : Pose.stand(cls, x, z, yaw, { sp: [0.1, 0, 0] });
    return armed({ cls, team: side, gun: GUN[cls], pose });
  }

  function charge(side, t, list, dir) {
    return list.map(([cls, x, z, ph], i) => {
      const k = t * (cls === 'heavy' ? 1.6 : 3.0);
      return team(cls, side, x + S(dir) * k, z + C(dir) * k, dir, t, ph || i * 0.37, 'run');
    });
  }

  at(121.321, (lt, t) => {
    const hv = Pose.sitFloor('heavy', 0, 0, 0.15, { splay: 0.5 });
    hv.hL = [0.36, -0.42, 0.42];
    hv.hR = [-0.36, -0.42, 0.42];
    hv.nk = [0.05, 0, 0];
    return {
      set: 'kart',
      envOver: { fogNear: 120 },
      camera: cam([0.15, 0.78, 2.25], [0, 0.72, 0], 52),
      actors: [{ cls: 'heavy', team: 'red', hat: 'party', grips: { L: 'open', R: 'open' }, face: t > 122.9 ? { mouth: 'scream', open: 1 } : { mouth: 'shut' }, pose: hv }],
      props: [{ kind: 'studWall', at: [0.6, 0, -0.55], yaw: 0.25 }],
      hud: t > 122.95 ? { bubbles: [{ screen: [492, 120], kind: 'medic', size: 72 }] } : null
    };
  });

  at(123.623, (lt, t) => {
    const hv = Pose.sitFloor('heavy', 0, 0, 0.15, { splay: 0.5 });
    hv.hL = [0.36, -0.42, 0.42];
    hv.hR = [-0.36, -0.42, 0.42];
    hv.nk = [-0.35 * clamp(lt * 4, 0, 1), 0.2, 0.2];
    const m = Cast.solve('heavy', hv);
    return {
      set: 'kart',
      camera: cam([0.15, 0.78, 2.25], [0, 0.72, 0], 52, { shake: lt < 0.3 ? 0.05 : 0, shakeT: lt * 20 }),
      actors: [{ cls: 'heavy', team: 'red', hat: 'party', grips: { L: 'open', R: 'open' }, face: { mouth: 'open', open: 0.6, eyes: 'shut' }, pose: hv }],
      props: [{ kind: 'studWall', at: [0.6, 0, -0.55], yaw: 0.25 }],
      fx: [{ kind: 'blood', p: m.pts.head, u: lt, s: 0.9, n: 22, size: 0.22, dur: 0.9, dir: [0.6, 0.4, -0.4] }]
    };
  });

  at(124.824, (lt, t) => {
    const so = Pose.stand('soldier', -2.2, 1.2, PI - 0.3, { sp: [0.15, 0, 0], nk: [-0.2, 0, 0] });
    so.hL = [0.2, 0.32, 0.38];
    so.hR = [-0.3, 0.1, 0.4];
    return {
      set: 'red',
      envOver: { ambTop: [0.7, 0.45, 0.42] },
      camera: cam([-2.0, 1.55, 0.25], [-2.25, 1.55, 1.2], 50),
      actors: [{ cls: 'soldier', team: 'red', grips: { L: 'open', R: 'fist' }, face: talk(t, 1.2, { brows: 'angry' }), pose: so }],
      grade: [1, 0.55, 0.5, 0.2]
    };
  });

  at(127.293, (lt, t) => {
    const reds = charge('red', lt, [['pyro', -1.5, -3.5, 0], ['heavy', 0.4, -4.2, 0.3], ['pyro', 1.6, -3.0, 0.6], ['soldier', -0.4, -2.6, 0.2], ['heavy', 2.6, -4.6, 0.8]], -PI / 2 + 0.2);
    return {
      set: 'red',
      camera: cam([5.5, 1.7, 4.8], [-1, 1.2, -3], 58),
      actors: reds,
      fx: [{ kind: 'fire', p: [-1.0, 1.1, -3.2], dir: [-0.2, 0.9, 0.3], u: lt, h: 1.6, s: 0.45, n: 12 }, { kind: 'fire', p: [2.0, 1.1, -2.6], dir: [-0.6, 0.6, 0.4], u: lt + 0.3, h: 1.4, s: 0.4, n: 10 }]
    };
  });

  at(128.762, (lt, t) => ({
    set: 'kart',
    camera: cam([4, 0.7, 13.2], [8, 2.2, 26], 60),
    actors: [{ cls: 'scout', team: 'blu', pose: Pose.prone('scout', 6.2, 17.5, 1.2, {}) }],
    fx: [{ kind: 'smoke', p: [6.8, 0.2, 18], u: lt, s: 0.9, dur: 1.5, col: [0.4, 0.4, 0.4], alpha: 0.5 }]
  }));

  at(129.729, (lt, t) => {
    const so = Pose.stand('soldier', 0, 0, -0.2, { sp: [0.1, -0.2, 0], nk: [-0.1, 0.25, 0] });
    so.hL = [0.6, 0.35, 0.45];
    so.hR = [-0.3, -0.15, 0.2];
    const blus = [['heavy', 0.9, -1.4], ['heavy', 1.9, -1.0], ['medic', 1.4, -2.2], ['heavy', 2.8, -1.8], ['soldier', 2.2, -3.0]].map(([cls, x, z], i) => team(cls, 'blu', x, z, -0.5, lt, i * 0.4, 'run'));
    return {
      set: 'kart',
      camera: cam([-0.55, 1.6, 1.05], [1.2, 1.35, -2.2], 50),
      actors: [{ cls: 'soldier', team: 'blu', grips: { L: 'point' }, face: talk(t, 1.2, { brows: 'angry' }), pose: so }].concat(blus.map(a => Object.assign(a, { pose: Object.assign(a.pose, { p: V3.add(a.pose.p, [0, 0, 7 + lt * 2.5]) }) })))
    };
  });

  function gunner(side, x, z, yaw, t, extra) {
    const a = team('heavy', side, x, z, yaw, t, 0, 'stand');
    a.pose.sp = [0.15, 0, 0];
    return Object.assign(a, extra || {});
  }

  function tipOf(a) {
    const m = Cast.solve(a.cls, a.pose);
    return M4.point(M4.mul(m.chest, Cast.twoHanded(a.gun).M), [0, 0, 0.82]);
  }

  const RAPID = [131.164, 131.464, 131.865, 132.165, 132.566, 132.866, 133.27, 134.034, 134.367, 134.734, 135.101, 135.468, 135.835, 136.102, 136.403];
  RAPID.forEach((t0, i) => at(t0, (lt, t) => {
    const kind = i % 3;
    const blu = gunner('blu', 0, 0, 0.15 * (i % 2 ? 1 : -1), t, { face: { mouth: 'scream', open: 1, brows: 'angry' } });
    const flash = frac(t * 14) < 0.5;
    const tip = tipOf(blu);
    const eye = kind === 0 ? [0.95, 1.0, 1.95] : kind === 1 ? [-0.75, 1.05, 1.7] : [0.6, 0.95, 1.45];
    const atv = kind === 0 ? [0, 1.25, 0] : kind === 1 ? [0.15, 1.2, 0] : [0.1, 1.05, 0.35];
    const others = [team('heavy', 'blu', 1.6, -1.2, 0.2, t, 0.3, 'stand'), team('medic', 'blu', -1.5, -1.6, 0.3, t, 0.6, 'stand'), team('scout', 'blu', 2.4, -2.4, -0.2, t, 0.1, 'stand')];
    return {
      set: 'kart',
      camera: cam(V3.add(eye, [0, 0, 12]), V3.add(atv, [0, 0, 12]), 56, { shake: 0.04, shakeT: t * 30 }),
      actors: [blu].concat(others).map(a => Object.assign(a, { pose: Object.assign(a.pose, { p: V3.add(a.pose.p, [0, 0, 12]) }) })),
      fx: flash ? [{ kind: 'muzzle', p: V3.add(tip, [0, 0, 12]), s: 0.5, u: t }] : [],
      post: { flash: i === 4 ? 0.3 : 0 }
    };
  }));

  at(136.703, (lt, t) => {
    const hv = Pose.supine('heavy', 0, 0, 0.4, {});
    const m = Cast.solve('heavy', hv);
    return {
      set: 'kart',
      camera: cam([0.9, 1.3, 1.3], [0, 0.4, 0], 50, { roll: 0.3 }),
      actors: [{ cls: 'heavy', team: 'red', face: { mouth: 'scream', eyes: 'shut' }, pose: hv }],
      fx: [{ kind: 'blood', p: m.pts.chest, u: lt, s: 0.7, n: 16, size: 0.2, dur: 0.8 }],
      grade: [1, 0.6, 0.55, 0.15]
    };
  });

  at(137.67, (lt, t) => ({
    set: 'kart',
    camera: cam([-1.5, 1.5, 4], [3, 1.4, 20], 18),
    actors: [team('heavy', 'red', 3.2, 19.5, PI, t, 0, 'stand')],
    cards: [{ tex: 'scope', alpha: 1 }],
    post: { zoom: 0.6 }
  }));

  at(139.039, (lt, t) => ({
    set: 'kart',
    camera: cam([18, 9 + lt * 2, 2], [22, 2, 12], 60),
    actors: charge('red', lt, [['soldier', 20, 6], ['pyro', 21, 7], ['heavy', 22, 5]], -PI / 2)
  }));

  at(139.439, (lt, t) => {
    const reds = charge('red', lt, [['soldier', 8, 22], ['pyro', 9, 21.5], ['heavy', 10, 22.5], ['scout', 7, 21]], PI + 0.2);
    const blus = charge('blu', lt, [['soldier', 7, 14], ['heavy', 8.5, 13.5], ['scout', 6, 15], ['medic', 9, 13]], 0.1);
    return {
      set: 'kart',
      camera: cam([6 + lt, 14, 10], [8, 0, 19], 58),
      actors: reds.concat(blus)
    };
  });

  at(140.273, (lt, t) => {
    const hv = gunner('blu', 6, 20, 0.2, t, { face: { mouth: 'teeth', brows: 'angry' } });
    const tip = tipOf(hv);
    return {
      set: 'kart',
      camera: cam([7.2, 1.0, 21.8], [5.6, 1.6, 19], 58),
      actors: [hv, team('scout', 'red', 5, 23.4, PI, t, 0, 'run')],
      fx: frac(t * 14) < 0.5 ? [{ kind: 'muzzle', p: tip, s: 0.8, u: t }] : []
    };
  });

  at(141.307, (lt, t) => ({
    set: 'kart',
    camera: cam([0.6, 0.6, 0.9], [0, 1.5, -0.3], 60, { roll: -0.4 }),
    actors: [Object.assign(team('heavy', 'red', 0, 0, PI, t, 0, 'stand'), { pose: Pose.airborne('heavy', [0, 1.3 + lt, -0.2], [0.2, 1, 0.3], [0, 0, -1], {}) })].map(a => Object.assign(a, { gun: null }))
  }));

  at(141.608, (lt, t) => {
    const k = clamp(lt / 1.9, 0, 1);
    return {
      set: 'kart',
      camera: cam([12.5, 1.2, 14.2], [14, 1.6, 17], 62, { roll: 0.3 - k * 0.6 }),
      actors: [
        { cls: 'spy', team: 'red', pose: Pose.airborne('spy', [lerp(13, 15, k), 1.6 + S(k * PI) * 1.2, lerp(16, 17.5, k)], [0.6, 0.6, 0.2], [0, 0.3, -1], {}) },
        armed({ cls: 'pyro', team: 'red', gun: 'flamer', pose: Pose.airborne('pyro', [lerp(15.5, 13.5, k), 1.4 + S(k * PI) * 0.8, 16.5], [-0.5, 0.8, 0.2], [0, 0, -1], {}) })
      ],
      fx: [{ kind: 'boom', p: [14, 1.4, 17], u: lt, s: 1.2, dur: 0.6 }, { kind: 'blood', p: [13.5, 1.8, 16.6], u: lt, s: 1.2, n: 14 }],
      grade: [1, 0.75, 0.65, 0.1]
    };
  });

  at(143.51, (lt, t) => {
    const reds = charge('red', lt * 0.5, [['soldier', 4, 24], ['pyro', 6, 23.5], ['heavy', 8, 24.4], ['demo', 9.5, 23], ['scout', 3, 22.5]], PI + 0.1);
    const blus = charge('blu', lt * 0.5, [['soldier', 4, 19], ['heavy', 6.5, 18.6], ['pyro', 8, 19.2], ['medic', 9.5, 18.5]], 0);
    const fx = [];
    if (lt > 1.0) fx.push({ kind: 'boom', p: [8.5, 1.0, 21.5], u: lt - 1.0, s: 2.2, dur: 0.9 });
    if (lt > 1.4) fx.push({ kind: 'fire', p: [6.5, 0.1, 21.5], u: lt, w: 7, d: 1.4, h: 2.4, s: 1.1, n: 26 });
    return {
      set: 'kart',
      camera: cam([6.5 + lt * 0.3, 1.4, 12.5], [6.5, 2.4, 26], 54, { shake: lt > 1 ? 0.06 : 0, shakeT: t * 20 }),
      actors: reds.concat(blus)
    , fx };
  });

  at(146.413, (lt, t) => {
    const sn = Pose.stand('sniper', 0, 0, 0.3, { nk: [-0.25, 0, 0] });
    sn.hR = [-0.05, 0.36, 0.28];
    sn.hL = [0.3, -0.1, 0.3];
    const flying = charge('red', lt, [['soldier', -3.5, -7, 0], ['scout', -1.5, -9, 0.4]], PI / 2).map(a => Object.assign(a, { pose: Pose.airborne(a.cls, [a.pose.p[0], 1.2 + S(lt * 2) * 0.6, a.pose.p[2]], [1, 0.2, 0], [0, -1, 0], {}) }));
    return {
      set: 'kart',
      camera: cam([6.95, 1.55, 13.05], [6.05, 1.5, 12], 50),
      actors: [{ cls: 'sniper', team: 'red', hat: 'catmask', itemR: 'jar', grips: { R: 'grip' }, pose: sn }].concat(flying).map(a => Object.assign(a, { pose: Object.assign(a.pose, { p: V3.add(a.pose.p, [6, 0, 12]) }) })),
      fx: lt < 0.2 ? [] : []
    };
  });

  at(149.916, (lt, t) => {
    const hv = Pose.supine('heavy', 0, 0, 1.2, {});
    return {
      set: 'kart',
      camera: cam([11.5, 0.7, 16.4], [10, 0.3, 15], 56, { roll: 0.15 }),
      actors: [{ cls: 'heavy', team: 'red', face: { eyes: 'shut', mouth: 'open', open: 0.4 }, pose: Object.assign(hv, { p: V3.add(hv.p, [10, 0, 15]) }) }].map(a => a),
      fx: [{ kind: 'boom', p: [8.5, 1.2, 13.5], u: lt, s: 1.2, dur: 0.7 }, { kind: 'blood', p: [10, 0.6, 15], u: lt, s: 0.8, n: 12 }],
      post: { tint: [0.9, 0.1, 0.05, clamp(0.25 - lt * 0.1, 0, 0.25)] }
    };
  });

  at(152.07, (lt, t) => {
    const k = clamp(lt / 1.0, 0, 1);
    return {
      set: 'kart',
      camera: cam([6, 1.4, 15], [6, 2.6, 26], 52),
      actors: charge('blu', lt * 0.4, [['heavy', 5, 18], ['soldier', 7, 19]], 0),
      cards: [{ tex: 'redFrame', x: -200 + k * 120, y: -120, w: 1360, h: 780, rot: -0.35 + k * 0.2 }],
      post: { zoom: 0.8 }
    };
  });

  function hero(t, o) {
    const opts = o || {};
    const pose = guitarist('engineer', 'blu', -1.5, 19.0, PI - 0.35, t, { rate: 2.4, sit: 0.36 });
    return engiHero(pose, Object.assign({ mouth: 'shut' }, opts.face || {}), { shadow: false });
  }

  at(153.086, (lt, t) => ({
    set: 'kart',
    camera: cam([-1.0 - lt * 0.03, 1.2, 17.9], [-1.55, 1.18, 19.0], 58),
    actors: [hero(t)],
    props: [{ kind: 'crate', at: [-1.5, 0, 19.18], yaw: PI }, { kind: 'fence', at: [-2.2, 0, 19.9] }]
  }));

  at(156.656, (lt, t) => {
    const p = [lerp(-1.2, 1.4, lt / 0.6), 1.4 + S(clamp(lt / 0.6, 0, 1) * PI) * 1.1, 0];
    return {
      set: 'kart',
      camera: cam([0.2, 1.0, 3.2], [0.2, 2.4, -2], 54),
      actors: [{ cls: 'heavy', team: 'blu', grips: { L: 'fist', R: 'fist' }, face: { mouth: 'scream', open: 1, brows: 'angry' }, pose: Pose.airborne('heavy', V3.add(p, [-8, 0, -40]), [0.2, 1, 0], [1, 0, 0.3], { hL: [0.5, 0.4, 0.3], hR: [-0.3, 0.3, 0.6] }) }].map(a => a)
    };
  });

  at(157.32, (lt, t) => ({
    set: 'kart',
    camera: cam([33 - lt, 3.5, -10], [32, 3.0, -8.2], 50, { roll: 0.2 }),
    post: { zoom: 0.5 }
  }));

  at(158.4, (lt, t) => {
    const k = clamp(lt / 0.9, 0, 1);
    return {
      set: 'kart',
      camera: cam([2.5, 1.2, 3.2], [0, 1.3, 0], 56),
      actors: [
        { cls: 'heavy', team: 'red', grips: { L: 'fist', R: 'fist' }, face: { mouth: 'teeth', brows: 'angry' }, pose: Pose.stand('heavy', -0.5, 0, 0.9, { hR: [-0.1, 0.25, 0.6 * k], hL: [0.35, 0.1, 0.3] }) },
        { cls: 'heavy', team: 'blu', grips: { L: 'fist', R: 'fist' }, face: { mouth: 'scream', open: k }, pose: Pose.stand('heavy', 0.7, 0.2, -2.2 + k * 0.4, { sp: [0, 0, -0.3 * k], hL: [0.35, 0.3, 0.3], hR: [-0.35, 0.3, 0.3] }) }
      ].map(a => Object.assign(a, { pose: Object.assign(a.pose, { p: V3.add(a.pose.p, [-8, 0, -40]), fLw: V3.add(a.pose.fLw, [-8, 0, -40]), fRw: V3.add(a.pose.fRw, [-8, 0, -40]) }) }))
    };
  });

  at(159.292, (lt, t) => {
    const k = clamp(lt / 2.7, 0, 1);
    const p = [lerp(-1.4, 0.2, k), 1.6 - k * 0.4, lerp(-3, 0.4, k)];
    return {
      set: 'kart',
      camera: cam([0, 1.5, 1.6], [0, 1.4, -2], 60),
      actors: [{ cls: 'scout', team: 'blu', grips: { L: 'open', R: 'open' }, face: { mouth: 'scream', open: 0.8, eyes: 'wide' }, pose: Pose.airborne('scout', p, [0, 0.4, 1], [0, 1, -0.3], { hL: [0.5, 0.3, 0.2], hR: [-0.5, 0.3, 0.2] }) }],
      post: { zoom: 1.6, flash: 0.35 }
    };
  });

  const LIGHTS = { cls: 'engineer', team: 'blu', hat: 'lights' };
  const VO = [-9, 0, -38];

  function vo(p) {
    return V3.add(p, VO);
  }

  function lightsEngi(pose, face, extra) {
    return Object.assign({}, LIGHTS, { face: Object.assign({ mouth: 'grin' }, face || {}), pose }, extra || {});
  }

  function moved(pose, d) {
    const out = Object.assign({}, pose);
    ['p', 'fLw', 'fRw', 'hLw', 'hRw', 'kLw', 'kRw'].forEach(k => { if (out[k]) out[k] = V3.add(out[k], d); });
    return out;
  }

  at(160.527, (lt, t) => {
    const py = Pose.stand('pyro', 0, 0, 0.6, { nk: [-0.5, 0, 0] });
    const sc = Pose.stand('scout', 0.9, -0.6, -2.4, { nk: [-0.3, 0, 0] });
    sc.hR = [-0.1, 0.55, 0.45];
    return {
      set: 'kart',
      camera: cam(vo([0.3, 0.9, 1.0]), vo([0.6, 2.6, -0.8]), 66, { roll: 0.25 }),
      actors: [
        armed({ cls: 'pyro', team: 'red', gun: 'flamer', pose: moved(py, VO) }),
        { cls: 'scout', team: 'red', itemR: 'shotgun', grips: { R: 'grip' }, pose: moved(sc, VO) }
      ],
      fx: lt > 0.6 ? [{ kind: 'smoke', p: vo([0.8, 2.2, -0.6]), u: lt - 0.6, s: 0.8, dur: 1.2, col: [0.4, 0.42, 0.45], alpha: 0.7 }, { kind: 'muzzle', p: vo([0.75, 2.05, -0.3]), s: 0.4, u: t }] : []
    };
  });

  at(161.995, (lt, t) => {
    const fx = [];
    if (t > 165.3 && t < 165.9) fx.push({ kind: 'smoke', p: [-15.2, 0.6, -41.5], u: t - 165.3, s: 0.5, dur: 0.6, alpha: 0.9 });
    if (t > 165.8) fx.push({ kind: 'boom', p: [-15.4, 1.0, -41.8], u: t - 165.8, s: 0.6, dur: 0.8 });
    const actors = t > 168.3 ? [armed({ cls: 'soldier', team: 'red', gun: 'rocket', pose: Pose.run('soldier', lerp(-12.5, -14, (t - 168.3) / 0.9), -41.5, -PI / 2, t * 1.4, {}) })] : [];
    return {
      set: 'kart',
      camera: cam([-22.5, 1.0, -35.5], [-16.2, 2.0, -45], 58),
      actors,
      fx
    };
  });

  at(169.169, (lt, t) => {
    const fly = Pose.airborne('soldier', [lerp(-1.5, 1.5, lt / 1.5), 1.6 + S(lt * 2) * 0.3, -3.2], [1, 0.4, 0], [0, 0, 1], {});
    return {
      set: 'blu',
      camera: cam([-2.6, 1.6, 3.2], [-0.8, 1.8, 7], 52),
      actors: [
        armed({ cls: 'medic', team: 'blu', gun: 'medigun', pose: Pose.stand('medic', -2.2, 4.4, 0.25, { nk: [0, 0.2, 0] }) }),
        { cls: 'soldier', team: 'red', pose: moved(fly, [0, 0, 11]) }
      ],
      grade: [0.85, 0.8, 1.0, 0.1]
    };
  });

  at(170.67, (lt, t) => {
    const p = vo([lerp(-1, 0.8, lt / 1.8), 1.3 + S(clamp(lt / 1.8, 0, 1) * PI) * 0.8, -0.5]);
    const fx = t > 171.4 && t < 171.9 ? [{ kind: 'muzzle', p: vo([0.9, 1.8, -0.8]), s: 0.6, u: t }] : [];
    return {
      set: 'kart',
      camera: cam(vo([0.3, 1.2, 2.6]), vo([0.0, 1.5, -1]), 56, { roll: -0.2 }),
      actors: [lightsEngi(Pose.airborne('engineer', p, [0.3, 1, 0], [0, -0.2, 1], {}), { mouth: 'scream' })],
      fx
    };
  });

  at(172.4, (lt, t) => {
    const k = clamp(lt / 1.2, 0, 1);
    const pose = k < 1 ? Pose.airborne('engineer', vo([0, 1.6 - k * 0.6, -lt * 0.5]), [0, 1, 0], [0, 0, 1], { hL: [0.55, 0.1, 0.0], hR: [-0.55, 0.1, 0.0], fL: [0.12, -0.6, 0.1], fR: [-0.12, -0.45, 0.3] }) : moved(Pose.stand('engineer', 0, -0.6, 0, { hL: [0.5, 0.05, 0.0], hR: [-0.5, 0.05, 0.0] }), VO);
    return {
      set: 'kart',
      camera: cam(vo([0, 1.1, 5.5]), vo([0, 1.0, -2]), 44),
      actors: [lightsEngi(pose)]
    };
  });

  at(174.9, (lt, t) => {
    const pose = Pose.stand('engineer', 0, 0, 0, { nk: [-0.55 + S(t * 1.3) * 0.08, S(t * 0.9) * 0.3, S(t * 1.1) * 0.15] });
    return {
      set: 'kart',
      camera: cam(vo([0.05, 1.05, 0.75]), vo([0, 1.75, -0.2]), 54),
      actors: [lightsEngi(moved(pose, VO), talk(t, 1.0, { mouth: 'grin' }))]
    };
  });

  at(180.0, (lt, t) => {
    const swing = S(t * PI * 2 * 1.1);
    const pose = Pose.stand('engineer', 0, 0, -PI / 2 + 0.3, { sp: [0.1, 0, 0] });
    pose.hR = [-0.12, 0.35 + swing * 0.28, 0.32];
    pose.hL = [0.3, -0.2, 0.1];
    return {
      set: 'kart',
      camera: cam(vo([-0.2, 1.25, 2.4]), vo([0, 1.15, 0]), 46),
      actors: [lightsEngi(moved(pose, VO), talk(t, 1.0), { itemR: 'wrench', grips: { R: 'grip' } })]
    };
  });

  function proneEngi(t, swing) {
    const pose = Pose.prone('engineer', 0.5, -0.4, -1.03, { nk: [-1.25, 0, 0], tilt: 0.25 });
    pose.hR = [-0.12, 0.42, 0.13 + swing * 0.03];
    pose.hL = [0.3, 0.38, 0.12];
    return moved(pose, VO);
  }

  at(184.584, (lt, t) => {
    const sentry = t > 185.6;
    return {
      set: 'kart',
      camera: cam(vo([-0.2, 0.75, 2.6]), vo([0.4, 0.45, -1.0]), 50),
      actors: [lightsEngi(proneEngi(t, S(t * 9)), talk(t), { itemR: 'wrench', grips: { R: 'grip' } })],
      props: sentry ? [{ kind: 'sentry', at: vo([0.9, 0, -1.6]), yaw: 0.4, s: 1.2 }] : [],
      fx: [{ kind: 'smoke', p: vo([0.9, 0.4, -1.6]), u: lt, s: 1.1, dur: 2.2, alpha: 0.95 }]
    };
  });

  at(187.587, (lt, t) => {
    const firing = t > 189.92 && t < 190.6;
    return {
      set: 'kart',
      camera: cam(vo([-0.75, 0.42, 0.5]), vo([0.0, 0.4, -0.25]), 56),
      actors: [lightsEngi(proneEngi(t, 0), { mouth: 'grin', open: talk(t).open }, { itemR: 'wrench', grips: { R: 'grip' } })],
      props: [{ kind: 'sentry', at: vo([0.9, 0, -1.6]), yaw: 0.4, s: 1.2 }],
      fx: firing && frac(t * 12) < 0.5 ? [{ kind: 'muzzle', p: vo([1.0, 0.65, -1.2]), s: 0.6, u: t }] : [],
      post: { flash: firing ? 0.25 * (frac(t * 12) < 0.5 ? 1 : 0) : 0 }
    };
  });

  at(190.79, (lt, t) => ({
    set: 'kart',
    camera: cam(vo([-0.85, 0.5, 0.55]), vo([-0.1, 0.38, -0.05]), 48),
    actors: [lightsEngi(proneEngi(t, 0), { mouth: 'grin', open: talk(t).open })],
    props: [{ kind: 'sentry', at: vo([0.9, 0, -1.6]), yaw: 0.4, s: 1.2 }]
  }));

  at(194.894, (lt, t) => {
    const cloak = clamp((t - 195.0) / 0.9, 0, 1);
    const shot = t > 199.05;
    const sp = Pose.prone('spy', 1.35, -0.25, -1.2, { nk: [-1.3, -0.2, 0], tilt: 0.35 });
    sp.hR = shot ? [-0.1, 0.5, 0.06] : [-0.25, 0.35, 0.12];
    sp.hL = [0.25, 0.35, 0.12];
    const actors = [];
    if (t < 199.4) actors.push(lightsEngi(proneEngi(t, 0), talk(t, 0.6, { mouth: 'grin' }), { itemR: 'wrench', grips: { R: 'grip' } }));
    actors.push({ cls: 'spy', team: 'red', itemR: 'revolver', grips: { R: 'grip' }, face: talk(t, 1, { mouth: 'smirk' }), pose: moved(sp, VO), drawOpts: cloak < 1 ? { alpha: cloak } : undefined });
    return {
      set: 'kart',
      camera: cam(vo([0.18, 0.5, 1.12]), vo([0.6, 0.42, -0.35]), 54),
      actors,
      props: [{ kind: 'sentry', at: vo([0.9, 0, -1.6]), yaw: 0.4, s: 1.2 }],
      fx: t > 199.0 && t < 199.25 ? [{ kind: 'muzzle', p: vo([0.45, 0.45, 0.1]), s: 0.4, u: t }, { kind: 'smoke', p: vo([0.45, 0.45, 0.1]), u: t - 199.0, s: 0.3, dur: 0.6 }] : []
    };
  });

  const GRIN = { cls: 'scout', team: 'red', hat: 'knit' };

  function grinScout(x, z, yaw, t, o) {
    const pose = Pose.stand('scout', x, z, yaw, { sp: [0.32, 0, 0], nk: [-0.35, 0, 0] });
    const g = Cast.twoHanded('shotgun', { pitch: -0.15, off: [0.0, 0.05, 0.08] });
    pose.hR = g.hR;
    pose.hL = g.hL;
    return Object.assign({}, GRIN, { gun: 'shotgun', gunOpts: { pitch: -0.15, off: [0.0, 0.05, 0.08] }, face: { mouth: 'grin', open: 0.8, eyes: 'crazy' }, pose }, o || {});
  }

  at(200.9, (lt, t) => {
    const a = grinScout(0, 0, 0.4, t);
    const tip = M4.point(M4.mul(Cast.solve('scout', a.pose).chest, Cast.twoHanded('shotgun', a.gunOpts).M), [0, 0.02, 0.5]);
    return {
      set: 'kart',
      camera: cam([3.6, 1.25, 7.4], [3.05, 1.1, 6.0], 54),
      actors: [Object.assign(a, { pose: moved(a.pose, [3, 0, 6]) })],
      fx: lt < 0.35 ? [{ kind: 'muzzle', p: V3.add(tip, [3, 0, 6]), s: 0.7, u: t }] : []
    };
  });

  at(201.95, (lt, t) => {
    const k = clamp(lt / 2.6, 0, 1);
    const actors = [grinScout(0.2, 0.4, -PI / 2 + 0.3, t, { face: { mouth: 'grin', open: 0.6 } })];
    if (t < 205.3) actors.push({ cls: 'heavy', team: 'blu', grips: { L: 'fist', R: 'fist' }, face: { mouth: 'scream', open: 1 }, pose: Pose.airborne('heavy', [-8.6 + k * 1.6, 1.1 + S(clamp(lt / 1.2, 0, 1) * PI) * 0.6, 2.2], [0.2, 1, 0], [1, 0, 0], { hL: [0.45, 0.3, 0.3], hR: [-0.3, 0.2, 0.5] }) });
    else actors.push({ cls: 'heavy', team: 'blu', pose: Pose.supine('heavy', -7.2, 2.0, 0.6, {}) });
    const fx = [];
    [202.4, 203.4, 204.6].forEach(f => { if (t > f && t < f + 0.15) fx.push({ kind: 'muzzle', p: [-0.3, 1.15, 0.5], s: 0.5, u: t }); });
    if (t > 204.6 && t < 205.4) fx.push({ kind: 'blood', p: [-7.0, 1.4, 2.2], u: t - 204.6, s: 0.8, n: 14 });
    return {
      set: 'kart',
      camera: cam([-12.5, 1.5, 3.4], [-1.0, 1.0, 1.0], 60),
      actors,
      props: [{ kind: 'fridge', at: [-10.8, 0, 6.4], yaw: PI / 2 }, { kind: 'billboard', at: [3.4, 0, 2.2], yaw: -PI / 2, tex: 'posterHero' }],
      fx
    };
  });

  at(207.273, (lt, t) => {
    const a = grinScout(0, 0, 0.3, t);
    const actors = [Object.assign(a, { pose: moved(a.pose, [3, 0, 6]) })];
    if (t > 209.3) actors.push({ cls: 'scout', team: 'red', face: { mouth: 'o', eyes: 'wide' }, pose: moved(Pose.stand('scout', -0.55, -0.35, 0.6, { sp: [0.35, 0, 0], nk: [-0.3, 0, 0] }), [3, 0, 6]) });
    return {
      set: 'kart',
      camera: cam([3.25, 1.28, 6.72], [3.0, 1.38, 6.0], 52),
      actors
    };
  });

  at(210.043, (lt, t) => ({
    set: 'kart',
    camera: cam([3.0, 1.5, 6.62], [2.75, 1.5, 6.0], 46),
    actors: [
      { cls: 'scout', team: 'red', face: { mouth: 'o', eyes: 'wide' }, pose: moved(Pose.stand('scout', -0.55, -0.35, 0.6, { sp: [0.3, 0, 0], nk: [-0.3, 0, 0] }), [3, 0, 6]) },
      Object.assign({}, GRIN, { face: { mouth: 'shut', eyes: 'wide' }, pose: moved(Pose.stand('scout', 0.25, -0.2, 0.0, { sp: [0.3, 0, 0], nk: [-0.3, 0, 0] }), [3, 0, 6]) })
    ]
  }));

  at(210.81, (lt, t) => ({
    set: 'kart',
    camera: cam([3.15, 1.5, 6.9], [2.95, 1.55, 6.0], 48),
    actors: [
      { cls: 'scout', team: 'red', face: { mouth: 'o', eyes: 'wide' }, pose: moved(Pose.stand('scout', -0.55, -0.35, 0.6, { sp: [0.3, 0, 0], nk: [-0.3, 0, 0] }), [3, 0, 6]) },
      Object.assign({}, GRIN, { face: { mouth: 'shut', eyes: 'wide' }, pose: moved(Pose.stand('scout', 0.25, -0.2, 0.0, { sp: [0.3, 0, 0], nk: [-0.3, 0, 0] }), [3, 0, 6]) })
    ],
    fx: [{ kind: 'glow', p: [3.2, 1.75, 5.9], s: 2.4, col: [1, 1, 1], alpha: 0.9 }],
    post: { flash: 0.35 }
  }));

  at(212.178, (lt, t) => {
    const a = grinScout(0, 0, 0.3, t, { face: { mouth: 'grin', open: 0.7, eyes: 'crazy', beard: false } });
    const actors = [Object.assign(a, { pose: moved(a.pose, [3, 0, 6]) })];
    actors.push({ cls: 'scout', team: 'red', face: { mouth: 'o', eyes: 'wide' }, pose: moved(Pose.stand('scout', -0.55, -0.35, 0.6, { sp: [0.35, 0, 0], nk: [-0.3, 0, 0] }), [3, 0, 6]) });
    return {
      set: 'kart',
      camera: cam([3.45, 1.32, 7.0], [3.05, 1.42, 6.0], 50),
      actors,
      fx: t > 213.9 && t < 214.6 ? [{ kind: 'blood', p: [2.5, 1.5, 6.4], u: t - 213.9, s: 0.6, n: 10 }, { kind: 'smoke', p: [2.6, 1.5, 6.5], u: t - 213.9, s: 0.4, dur: 0.6 }] : []
    };
  });

  at(214.981, (lt, t) => {
    const pose = Pose.stand('sniper', 16.6, 1.8, -PI / 2 + 0.4, { nk: [0.1, -0.3, 0] });
    const g = Cast.twoHanded('rifle', { pitch: -1.2, roll: 0.3 });
    pose.hR = g.hR;
    pose.hL = g.hL;
    return {
      set: 'kart',
      camera: cam([12.0, 3.4, 4.6], [16.6, 3.6, 1.8], 46),
      actors: [{ cls: 'sniper', team: 'blu', gun: 'rifle', gunOpts: { pitch: -1.2, roll: 0.3 }, pose: moved(pose, [0, 2.2, 0]) }]
    };
  });

  at(216.616, (lt, t) => ({
    set: 'kart',
    camera: cam([12, 1.0 + lt * 0.5, -10], [14, 3.4, -14], 58, { roll: 0.5 + lt * 0.4 })
  }));

  at(217.584, (lt, t) => ({
    set: 'kart',
    camera: cam([4.9, 0.45, -4.3], [6.2, 0.3, -5.8], 44),
    props: [{ kind: 'raygun', at: [5.6, 0.12, -5.1], yaw: 0.6 + lt * 0.25, roll: PI / 2 - 0.2 }]
  }));

  at(221.02, (lt, t) => ({
    set: 'kart',
    camera: cam([0.9, 0.35, 0.9], [0, 0.25, 0], 50),
    props: [{ kind: 'kart', at: [0.2, 0, -0.4], yaw: -1.2 + lt }]
  }));

  function kartHeavy(x, z, yaw, t, o) {
    const opts = o || {};
    const pose = Pose.sitFloor('heavy', 0, 0, 0, { splay: 0.15, y: 0.22 });
    pose.sp = [0.15, 0, 0];
    pose.hL = opts.point ? [0.75, 0.42, 0.35] : [0.22, -0.02, 0.48];
    pose.hR = opts.pointR ? [-0.7, 0.45, 0.45] : [-0.22, -0.02, 0.48];
    pose.fLw = [0.24, 0.2, 0.75];
    pose.fRw = [-0.24, 0.2, 0.75];
    const M = M4.chain(M4.translate(x, opts.y || 0, z), M4.rotY(yaw));
    const tf = (p) => M4.point(M, p);
    pose.p = tf([0, 0.42, -0.08]);
    pose.fwd = M4.dir(M, [0, 0, 1]);
    pose.up = M4.dir(M, [0, 1, 0]);
    pose.fLw = tf(pose.fLw);
    pose.fRw = tf(pose.fRw);
    return {
      actor: { cls: 'heavy', team: 'red', grips: { L: opts.point ? 'point' : 'grip', R: opts.pointR ? 'point' : 'grip' }, face: opts.face || { mouth: 'grin', open: 0.4 }, pose },
      prop: { kind: 'kart', M }
    };
  }

  at(221.354, (lt, t) => {
    const k = clamp(lt / 0.75, 0, 1);
    const actors = [], props = [], fx = [];
    if (t < 222.5) {
      const kh = kartHeavy(lerp(-1.2, -0.15, k), lerp(-6, -1.25, k), 0.12, t, { face: { mouth: 'grin', open: 0.6 } });
      actors.push(kh.actor);
      props.push(kh.prop);
      fx.push({ kind: 'sparks', p: [lerp(-1.2, -0.15, k) + 0.4, 0.1, lerp(-6, -1.25, k) - 0.6], u: lt, n: 12 });
    } else {
      props.push({ kind: 'kart', at: [1.6, 0, 2.2], yaw: 2.4 });
      props.push({ kind: 'thwompBox', at: [0.4, 0, 3.8] });
      if (t > 222.9 && t < 223.6) actors.push({ cls: 'heavy', team: 'red', pose: Pose.run('heavy', lerp(0.8, 3.4, (t - 222.9) / 0.7), 3.4, PI / 2, t * 1.3, {}) });
      if (t > 223.9) fx.push({ kind: 'fire', p: [4.4, 0.05, 3.6], u: t, w: 2.2, d: 0.8, h: 1.6, s: 0.8, n: 20 });
    }
    return {
      set: 'kart',
      camera: t < 222.5 ? cam([0.25, 1.0, 0.25], [-0.25, 0.85, -3], 56) : cam([0.8, 1.2, -1.6], [1.2, 0.6, 4], 58),
      actors,
      props,
      fx
    };
  });

  at(226.126, (lt, t) => {
    const kh = kartHeavy(0, -lt * 1.4, PI, t, { face: { mouth: 'grin', open: 0.3 } });
    return {
      set: 'kart',
      camera: cam([0, 1.2, -1.75 - lt * 1.4], [0, 1.05, -lt * 1.4], 52),
      actors: [kh.actor],
      props: [kh.prop],
      post: { zoom: 0.8 },
      cards: [{ tex: 'raceHud', alpha: 1 }].concat(t > 227.9 ? [{ tex: 'banana', x: 90, y: 80, w: 300, h: 210 }] : [])
    };
  });

  function mopper(t) {
    const pose = Pose.stand('engineer', 6.5, 30.5, PI + 0.3, { sp: [0.25, 0, 0] });
    const sw = S(t * 3.2);
    pose.hR = [-0.08, -0.02, 0.4];
    pose.hL = [0.06, 0.25, 0.32];
    const M = M4.chain(M4.translate(6.5 + sw * 0.25, 1.05, 30.0), M4.rotY(PI + 0.3 + sw * 0.4), M4.rotX(0.95));
    return {
      actor: lightsEngi(pose, { mouth: 'shut' }, { grips: { L: 'grip', R: 'grip' } }),
      props: [{ kind: 'mop', M }, { kind: 'bucket', at: [5.6, 0, 31.4], yaw: 0.3 }]
    };
  }

  at(228.428, (lt, t) => {
    const mp = mopper(t);
    const actors = [mp.actor];
    const props = mp.props.slice();
    if (t > 229.9) {
      const k = clamp((t - 229.9) / 0.8, 0, 1);
      const kh = kartHeavy(lerp(1.0, 4.4, k), lerp(27.0, 29.4, k), 0.9, t, { point: t > 232.9 && t < 234.5, face: talk(t, 1, { mouth: 'grin' }) });
      actors.push(kh.actor);
      props.push(kh.prop);
    }
    if (t > 233.1) props.push({ kind: 'banana', at: [5.7, 0.02, 29.6], yaw: 0.6 });
    return {
      set: 'kart',
      camera: cam([3.7, 0.95, 25.5], [6.0, 1.0, 31.5], 56),
      actors,
      props
    };
  });

  at(236.002, (lt, t) => {
    const kh = kartHeavy(4.4, 29.4, 0.9, t, { point: true, face: talk(t, 1, { mouth: 'grin' }) });
    return {
      set: 'kart',
      camera: cam([6.0, 0.62, 30.9], [4.4, 1.15, 29.4], 54),
      actors: [kh.actor],
      props: [kh.prop]
    };
  });

  at(237.036, (lt, t) => {
    const ang = lt * 2.2;
    const x = 19 + S(ang) * 2.2, z = 9.6 + C(ang) * 1.6;
    const kh = kartHeavy(x, z, ang + PI / 2, t, { pointR: true, face: { mouth: 'grin', open: 0.5 } });
    return {
      set: 'kart',
      camera: cam([15.6, 1.1, 7.2], [x, 0.9, z], 58),
      actors: [kh.actor],
      props: [kh.prop],
      post: { zoom: 0.7 }
    };
  });

  at(239.339, (lt, t) => {
    const hv = Pose.stand('heavy', 0, 0, 0, { nk: [0.05, 0, 0] });
    hv.hL = [0.3, -0.1, 0.25];
    const subs = t < 239.9 ? 'Doo' : t < 240.45 ? 'Doo yooh rhemnmmem' : 'vodka';
    return {
      set: 'kart',
      camera: cam([24.05, 1.68, 6.3], [24, 1.62, 5.0], 48),
      actors: [{ cls: 'heavy', team: 'blu', face: talk(t, 1.2, { mouth: 'grin' }), pose: moved(hv, [24, 0, 5]) }],
      cards: [{ texture: null, tex: 'sub_' + subs.replace(/ /g, '_'), x: 280, y: 440, w: 400, h: 50 }]
    };
  });

  window.FabScript1 = { FROM: 0, TO: 241.274, SHOTS, TIMER, CHAT, GUN, hud, lin, cam, camLin, camEase, talk, strum, guitarist, engiHero, armed, card, moved, kartHeavy, lightsEngi, grinScout, crouchSpam };
})();
