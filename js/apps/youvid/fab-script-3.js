(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Pose = window.FabPose;
  const Cast = window.FabCast;
  const A = window.FabScript1;
  const { cam, talk, armed, moved } = A;
  const World = window.FabWorld;
  const NZ = World.NZ, LZ = World.LZ, GZ = World.GZ, ZONES = World.ZONES;

  const SHOTS = [];
  const at = (t0, fn) => SHOTS.push([t0, fn]);

  const zp = (o, x, y, z) => [o[0] + x, y, o[2] + z];
  const zcam = (o, eye, look, fov, opts) => cam(zp(o, eye[0], eye[1], eye[2]), zp(o, look[0], look[1], look[2]), fov, opts);
  const zpose = (o, pose) => moved(pose, [o[0], 0, o[2]]);
  const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

  function headCam(a, off, fov, o) {
    const opts = o || {};
    const m = Cast.solve(a.cls, a.pose);
    const h = opts.chest ? m.pts.chest : m.pts.head;
    return cam(V3.add(h, off), V3.add(h, opts.look || [0, 0, 0]), fov, opts);
  }

  function faceCam(a, d, u, sd, fov, o) {
    const opts = o || {};
    const m = Cast.solve(a.cls, a.pose);
    const H = m.head;
    const f = V3.norm([H[8], 0, H[10]]);
    const rt = [f[2], 0, -f[0]];
    const h = opts.chest ? m.pts.chest : m.pts.head;
    const eye = V3.add(h, [f[0] * d + rt[0] * sd, u, f[2] * d + rt[2] * sd]);
    const look = V3.add(h, [rt[0] * (opts.ls || 0), opts.lu || 0, rt[2] * (opts.ls || 0)]);
    return cam(eye, look, fov, opts);
  }

  function man(look, pose, o) {
    return Object.assign({ cls: 'man', team: 'red', look, pose }, o || {});
  }

  function sil(a) {
    return Object.assign(a, { drawOpts: { flat: [0.025, 0.02, 0.015, 1] }, shadow: false });
  }

  function lerp3(a, b, k) {
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  }

  function checkShot(idx, lt, dur, o) {
    const opts = o || {};
    return { set: null, bg: [0.96, 0.96, 0.94], cards: [{ live: 'checklist', u: idx + clamp(lt / dur, 0, 0.999), alpha: opts.alpha }] };
  }

  function moonShot(lt, o) {
    const opts = o || {};
    const s = 330 + lt * 26;
    const shake = S(lt * 40) * 2;
    return {
      set: null,
      bg: [0.1, 0.16, 0.85],
      cards: [
        { tex: 'moonSky', x: -40 - lt * 10, y: -40 - lt * 6, w: 1040 + lt * 20, h: 620 + lt * 12, rot: lt * 0.02 },
        { tex: 'moonDisc', x: 480 - s / 2 + shake, y: 270 - s / 2 + (opts.dy || 0), w: s, h: s, rot: S(lt * 1.3) * 0.05 }
      ],
      post: { zoom: 0.3, flash: clamp(0.5 - lt * 2, 0, 1) }
    };
  }

  const SKY = (() => {
    const g = rand(33);
    return [...Array(9)].map((_, i) => ({ tex: ['skyHeadA', 'skyHeadB', 'skyHeadC'][i % 3], x: (g() - 0.5) * 70, y: 15 + g() * 9, z: (g() - 0.5) * 70, sp: 0.2 + g() * 0.4, s: 2.2 + g() * 1.6 }));
  })();

  function sky(o, t) {
    return SKY.map(h => ({ kind: 'sprite', tex: h.tex, p: zp(o, h.x + t * h.sp, h.y + S(t * 0.4 + h.x) * 0.4, h.z), s: h.s, tint: [0.65, 0.65, 0.75] }));
  }

  function night(o, t, extra) {
    const st = Object.assign({ set: 'night', env: 'night', grade: [0.86, 0.9, 1.05, 0.08], vignette: 0.35 }, extra);
    st.fx = sky(o, t).concat(extra.fx || []);
    return st;
  }

  const TV0 = 483.565;

  function tv(t, st) {
    st.cards = (st.cards || []).concat([{ live: 'stopwatch', u: t - TV0, top: true }]);
    st.post = Object.assign({ tv: 1 }, st.post || {});
    return st;
  }

  function game(zone, t, extra) {
    return tv(t, Object.assign({ set: 'game', env: zone === 'roof' ? 'gameNight' : 'game', grade: [0.86, 0.95, 0.98, 0.62], vignette: 0.7, grain: 0.05 }, extra));
  }

  function agentRun(o, x, z, yaw, lt, rate, opts) {
    return man('agent', zpose(o, Pose.run('man', x, z, yaw, lt * (rate || 1.7), opts || {})), { face: { mouth: 'shut', brows: 'angry' } });
  }

  function interCard(right) {
    return { tex: 'intermission', x: right ? 182 : -298, y: -101, w: 768, h: 432 };
  }

  at(480, (lt) => ({ set: null, bg: [0, 0, 0], cards: [interCard(lt < 0.95)] }));

  at(482.0, (lt) => {
    const k = ease(ramp(lt, 1.2, 1.68));
    const s = lerp(1, 0.36, k);
    const cx = lerp(480, 846, k), cy = lerp(270, 492, k);
    return { set: null, bg: [0, 0, 0], cards: [{ tex: 'sw0', x: cx - 480 * s, y: cy - 270 * s, w: 960 * s, h: 540 * s, rot: S(k * PI) * -0.18 }] };
  });

  at(483.683, (lt, t) => {
    const k = ramp(t, 484.6, 485.2);
    return tv(t, { set: null, bg: [0, 0, 0], cards: [{ tex: 'dashA', x: -lt * 6, y: -lt * 3, w: 960 + lt * 12, h: 540 + lt * 7 }, { tex: 'dashB', alpha: k > 0 ? k : undefined, x: -lt * 6, y: -lt * 3, w: k > 0 ? 960 + lt * 12 : 0, h: 540 + lt * 7 }] });
  });

  at(486.919, (lt, t) => {
    const o = GZ.roof;
    const ag = man('agent', zpose(o, Pose.supine('man', 0.5, 2, 1.9, { nk: [0.4, 0.3, 0] })), { face: { eyes: 'shut', mouth: 'open', open: 0.3 } });
    return game('roof', t, {
      camera: zcam(o, [-1.6 + lt * 0.2, 1.4, 4.2], [0.4, 0.3, 2.0], 52),
      actors: [ag],
      cards: [{ tex: 'missionFailed', alpha: ramp(lt, 0.15, 0.4) || undefined }]
    });
  });

  at(488.388, (lt, t) => {
    const o = GZ.roof;
    const pose = Pose.stand('man', 3, 3, PI + 0.5, { hR: [0.0, 0.3, 0.55], hL: [0.05, 0.28, 0.5], nk: [0.05, 0, 0] });
    const ag = man('agent', zpose(o, pose), { itemR: 'pistol', grips: { R: 'grip', L: 'grip' } });
    const m = Cast.solve('man', ag.pose);
    const muzzle = M4.point(M4.mul(m.handR, M4.chain(M4.translate(0, -0.07, 0.02), M4.rotX(-PI / 2 + 0.3))), [0, 0, 0.25]);
    return game('roof', t, {
      camera: zcam(o, [4.4, 1.75, 4.6], [-3, 1.2, -6], 58),
      actors: [ag],
      fx: [{ kind: 'tracer', a: muzzle, b: zp(o, -8, 2.5, -14), u: lt }],
      cards: [{ tex: 'gauge' }]
    });
  });

  at(490.623, (lt, t) => {
    const o = GZ.hall;
    const push = ease(ramp(lt, 0, 1.2));
    const ag = man('agent', zpose(o, Pose.stand('man', -5.2 + push * 0.3, -5.4, 0.9, { sp: [0.25, 0.2, 0], hR: [-0.1, 0.25, 0.4], hL: [0.25, 0.1, 0.45] })), { grips: { L: 'fist', R: 'fist' }, face: { mouth: 'teeth', brows: 'angry' } });
    const gd = man('guard', zpose(o, Pose.stand('man', -4.3 + push * 0.5, -4.8, -2.3, { sp: [-0.3 - push * 0.2, -0.2, 0.1], hR: [-0.3, 0.3, 0.3], hL: [0.3, 0.2, 0.2] })), { face: { mouth: 'o', eyes: 'wide' } });
    return game('hall', t, { camera: zcam(o, [-3.0, 1.6, -2.8], [-5.2, 1.2, -6.2], 56, { shake: 0.03, shakeT: lt * 6 }), actors: [ag, gd] });
  });

  at(491.891, (lt, t) => {
    const o = GZ.stair;
    const wr = S(lt * 5) * 0.12;
    const ag = man('agent', zpose(o, Pose.stand('man', -0.2, 6.2, PI, { y: 4.2, sp: [0.35, wr, 0], hR: [-0.15, 0.2, 0.42], hL: [0.25, 0.15, 0.42] })), { grips: { L: 'fist', R: 'grip' }, face: { mouth: 'teeth', brows: 'angry' } });
    const gd = man('guard2', zpose(o, Pose.crouch('man', 0.2, 5.4, 0.2, { y: 3.9, sp: [0.55, -wr, 0], hR: [-0.25, 0.25, 0.3], hL: [0.25, 0.3, 0.3] })), { face: { mouth: 'scream', open: 0.8 } });
    const camA = lt < 1.1;
    return game('stair', t, {
      camera: camA ? zcam(o, [-1.2, 4.0, 2.2], [0, 4.8, 6.2], 60) : zcam(o, [1.0, 5.7, 8.2], [0, 4.9, 5.7], 50),
      actors: [ag, gd]
    });
  });

  at(494.26, (lt, t) => {
    const o = GZ.stair;
    const k = clamp(lt / 3.3, 0, 1);
    const z = lerp(0.2, 5.6, k);
    const y = clamp((z - 1) / 0.4 + 1, 0, 14) * 0.3;
    const ag = agentRun(o, -0.3, z, 0, lt, 1.9, { y });
    return game('stair', t, {
      camera: zcam(o, [-0.3, y + 1.9, z - 2.4], [-0.3, y + 1.5, z + 3], 62),
      actors: [ag],
      cards: [{ live: 'gameTimer', u: 169 - lt }, { tex: 'checkpoint', alpha: lt < 1.4 ? 1 : 0.001 }]
    });
  });

  at(497.597, (lt, t) => {
    const o = GZ.corridor;
    const z = -2 - lt * 4.6;
    const ag = agentRun(o, 0.1, z, PI, lt, 2.2);
    return game('corridor', t, {
      camera: zcam(o, [0.4, 1.9, z + 2.6], [0, 1.4, z - 4], 60, { shake: 0.02, shakeT: lt * 9 }),
      actors: [ag],
      cards: [{ live: 'gameTimer', u: 146.5 - lt }, { tex: 'redFrame', alpha: 0.45 + S(lt * 5) * 0.15 }],
      fx: [{ kind: 'tracer', a: zp(o, -1.6, 1.6, z + 6), b: zp(o, 1.0, 1.8, z - 10), u: lt }]
    });
  });

  at(500.666, (lt, t) => {
    const k = ramp(lt, 1.1, 1.5);
    const s = 1 + lt * 0.05;
    return tv(t, { set: null, bg: [0.05, 0.08, 0.12], cards: [{ tex: 'gameTitle', x: 480 - 480 * s, y: 270 - 270 * s, w: 960 * s, h: 540 * s }, { tex: 'resumeText', alpha: k > 0 ? k : undefined, w: k > 0 ? 960 : 0 }] });
  });

  const CIVS = (() => {
    const g = rand(51);
    return [...Array(12)].map((_, i) => ({ look: 'civ' + (1 + (i % 6)), x: (g() - 0.5) * 11, z: -14 + g() * 26, yaw: g() < 0.5 ? 0 : PI, ph: g(), sp: 0.8 + g() * 0.6 }));
  })();

  at(503.069, (lt, t) => {
    const o = GZ.mall;
    const crowd = CIVS.map(c => man(c.look, zpose(o, Pose.run('man', c.x, c.z + (c.yaw ? -1 : 1) * lt * c.sp, c.yaw, lt * 0.9 + c.ph, { stride: 0.18, lean: 0.05, bob: 0.3 }))));
    const ag = man('agent', zpose(o, Pose.run('man', -0.6, -2 - lt * 1.3, PI, lt * 1.1, { stride: 0.2, lean: 0.06 })), { face: { brows: 'angry' } });
    return game('mall', t, { camera: zcam(o, [0.6, 3.6, 4.0 - lt * 1.2], [-0.5, 1.2, -6 - lt * 1.2], 58), actors: [ag].concat(crowd) });
  });

  at(505.204, (lt, t) => {
    const o = GZ.roof;
    const gd = man('guard', zpose(o, Pose.stand('man', -6 + lt * 0.4, -10, 0.4, {})), {});
    const st = game('roof', t, {
      camera: zcam(o, [8, 2.2, 8], [-6 + lt * 0.3, 1.4, -10], 9),
      actors: [gd],
      cards: [{ tex: 'scope' }]
    });
    st.grade = [0.55, 0.85, 0.6, 1];
    st.colorAdd = [0.04, 0.1, 0.04];
    return st;
  });

  at(507.306, (lt, t) => {
    const o = GZ.roof;
    const ag = man('agent', zpose(o, Pose.crouch('man', 2 + lt * 0.4, -4, -1.2, { nk: [-0.1, 0.3, 0] })), { face: { brows: 'angry' } });
    return game('roof', t, { camera: zcam(o, [5, 1.4, -1], [1.5, 1.0, -4.5], 50), actors: [ag] });
  });

  at(508.174, (lt, t) => {
    const o = GZ.garage;
    const ag = agentRun(o, -6 + lt * 5.4, 6, PI / 2, lt, 2.2);
    return game('garage', t, { camera: zcam(o, [-9, 1.6, 9.5], [-4 + lt * 5, 1.2, 5.5], 60), actors: [ag] });
  });

  at(508.875, (lt, t) => {
    const o = GZ.garage;
    const sw = S(lt * 3) * 0.3;
    const ag = man('agent', zpose(o, Pose.stand('man', -0.4 + sw * 0.4, -3.6, PI / 2, { sp: [0.4, 0.2, 0], hR: [-0.15, 0.25, 0.45], hL: [0.25, 0.25, 0.45] })), { grips: { L: 'fist', R: 'fist' } });
    const gd = man('guard2', zpose(o, Pose.stand('man', 0.5 + sw * 0.4, -3.8, -PI / 2, { sp: [0.3, -0.2, 0.1], hR: [-0.3, 0.3, 0.35], hL: [0.3, 0.2, 0.3] })), {});
    return game('garage', t, { camera: zcam(o, [-1.2 + lt * 0.2, 12, -1.0], [0, 0, -3.8], 40, { roll: 0.6 + lt * 0.05 }), actors: [ag, gd] });
  });

  at(512.478, (lt, t) => {
    const o = GZ.raid;
    const tr = [-0.6, 0.6, 1.8].map((x, i) => {
      const a = man('trooper', zpose(o, Pose.run('man', x, 3.5 - lt * 1.5 - i * 0.9, PI, lt * 1.6 + i * 0.3, { stride: 0.22 })), { gun: 'rifle', gunOpts: { pitch: -0.1 } });
      return armed(a);
    });
    return game('raid', t, { camera: zcam(o, [-3.5, 1.6, -3.5], [0.6, 1.3, 2.5], 60), actors: tr });
  });

  at(513.713, (lt) => ({ set: null, bg: [0, 0, 0], cards: lt < 2.6 ? [{ tex: 'sw30' }] : [] }));

  at(517.316, (lt) => {
    const k = ease(ramp(lt, 0, 0.32));
    const lx = lerp(620, 230, k), ly = lerp(-160, 30, k);
    return {
      set: null,
      bg: [0, 0, 0],
      cards: [
        { tex: 'logo', x: lx, y: ly, w: 780 * lerp(0.8, 1, k), h: 585 * lerp(0.8, 1, k), rot: lerp(-0.2, 0, k) },
        { tex: 'previously', x: lx - 225, y: ly - 10, w: 360, h: 135, rot: lerp(-0.2, -0.04, k) }
      ]
    };
  });

  at(519.052, (lt) => ({ set: null, bg: [0, 0, 0], cards: lt < 0.2 ? [{ tex: 'bumpA' }] : lt < 0.5 ? [{ tex: 'bumpB' }] : [] }));

  at(519.852, (lt) => {
    const pulse = [0, 0.08, 0.14, 0.17, 0.5].reduce((a, p) => a + clamp(1 - Math.abs(lt - p) * 14, 0, 1), 0);
    return {
      set: null,
      bg: lt < 0.25 ? [0.82, 0.62, 0.3] : [0.04, 0.08, 0.04],
      cards: lt >= 0.25 ? [{ tex: 'streaks', tint: [0.3, 1.0, 0.5], additive: true, alpha: 0.8 }] : [{ tex: 'warpHaze', tint: [1.0, 0.8, 0.45], alpha: 0.7 }],
      post: { flash: clamp(pulse, 0, 1) }
    };
  });

  const BRIDGE = [-7.2, -5.6, -4.4, -3.1, -1.4, 0.2, 1.6, 3.4, 4.6, 6.2, 7.8];
  const BRIDGE_CLS = ['heavy', 'soldier', 'scout', 'pyro', 'demo', 'medic', 'heavy', 'engineer', 'sniper', 'soldier', 'spy'];

  at(520.62, (lt, t) => {
    const g = rand(9);
    const fx = [...Array(46)].map((_, i) => {
      const p = [(g() - 0.5) * 26, -1 + g() * 9, (g() - 0.5) * 10 - 2];
      const tw = 0.5 + 0.5 * S(t * (4 + g() * 5) + i);
      return { kind: 'glow', p, s: 0.35 + g() * 0.4, col: [1, 1, 0.95], alpha: 0.9 * tw };
    });
    const actors = BRIDGE.map((x, i) => sil({ cls: BRIDGE_CLS[i], team: 'red', pose: Pose.stand(BRIDGE_CLS[i], x, 0, 0.3 * (i % 3 - 1), {}) }));
    return {
      set: 'recap',
      env: 'recap',
      camera: cam([lerp(-3, 3, lt / 2.4), 0.6, 9], [lerp(-1.5, 1.5, lt / 2.4), 1.2, 0], 58),
      actors,
      fx,
      envOver: { fogColor: [1, 0.92, 0.75], fogNear: 10, fogFar: 60 },
      grade: [1.25, 1.08, 0.82, 0.35],
      colorAdd: [0.22, 0.17, 0.08],
      vignette: 0.5,
      post: { flash: clamp(0.6 - lt * 2, 0, 1) }
    };
  });

  function sepiaKart(lt, t, extra) {
    return Object.assign({ set: 'kart', envOver: { fogColor: [0.42, 0.27, 0.1], fogNear: 12, fogFar: 70 }, grade: [1.05, 0.74, 0.42, 1], colorAdd: [0.02, 0.0, -0.02], vignette: 1.1, grain: 0.03 }, extra);
  }

  at(523.022, (lt, t) => {
    const o = ZONES.coin;
    const crowd = [-3.4, -2.2, -1.0, 1.0, 2.3, 3.5].map((x, i) => sil({ cls: ['heavy', 'soldier', 'pyro', 'demo', 'scout', 'sniper'][i], team: 'red', pose: zpose(o, Pose.stand(['heavy', 'soldier', 'pyro', 'demo', 'scout', 'sniper'][i], x, 3.5 - Math.abs(x) * 0.3, PI, {})) }));
    const fade = ramp(lt, 1.0, 1.35);
    const st = sepiaKart(lt, t, {
      camera: zcam(o, [0, 1.3, 10 - lt * 0.4], [0, 2.4, 0], 58),
      actors: crowd,
      fx: [{ kind: 'sprite', tex: 'impBody', p: zp(o, 0, 2.4, 4.5), s: [3.2, 3.2], tint: [0.02, 0.02, 0.02] }]
    });
    if (fade > 0) st.cards = [{ tex: 'evilEyes', alpha: fade < 1 ? fade : undefined }];
    return st;
  });

  at(525.391, (lt) => {
    const k = ramp(lt, 0, 0.25);
    const s = 1 + lt * 0.08;
    return {
      set: null,
      bg: [0.9, 0.85, 0.7],
      cards: [{ tex: 'moonHands', x: 480 - 480 * s, y: 270 - 270 * s, w: 960 * s, h: 540 * s }],
      post: { flash: 1 - k, zoom: 0.4 }
    };
  });

  at(527.794, (lt, t) => {
    const o = ZONES.coin;
    const sw = S(t * 6);
    const hv = sil({ cls: 'heavy', team: 'red', pose: zpose(o, Pose.stand('heavy', -1.2, 2.2, 0.9, { sp: [0.2, sw * 0.4, 0], hR: [-0.3, 0.3 + sw * 0.2, 0.5], hL: [0.4, 0.2, 0.4] })) });
    const sc = sil({ cls: 'scout', team: 'red', gun: 'bat', pose: zpose(o, Pose.stand('scout', 0.2, 2.4, -2.0, { sp: [-0.2, -sw * 0.3, 0], hR: [-0.2, 0.5, 0.2] })) });
    const so = sil({ cls: 'soldier', team: 'red', pose: zpose(o, Pose.run('soldier', 2.4 - lt * 0.8, 1.8, -1.4, t * 1.5, {})) });
    const pr = sil({ cls: 'pyro', team: 'red', pose: zpose(o, Pose.stand('pyro', -3.2, 1.4, 1.2, { sp: [0.3, 0, 0], hR: [-0.1, 0.4, 0.4] })) });
    return sepiaKart(lt, t, { camera: zcam(o, [-0.4 + lt * 0.4, 1.2, 7.5], [0.2, 1.8, 0], 62, { shake: 0.02, shakeT: t }), actors: [hv, sc, so, pr] });
  });

  at(530.363, (lt) => {
    const k = ramp(lt, 1.85, 2.1);
    const s = 1 + lt * 0.03;
    const box = { x: 480 - 480 * s, y: 270 - 270 * s, w: 960 * s, h: 540 * s };
    return { set: null, bg: [0, 0, 0], cards: [Object.assign({ tex: 'impSil' }, box), Object.assign({ tex: 'impSip', alpha: k > 0 ? k : undefined }, box, { w: k > 0 ? box.w : 0 })] };
  });

  at(533.066, (lt) => {
    const s = 1.08 + lt * 0.02;
    return { set: null, bg: [0, 0, 0], cards: [{ tex: 'scroll', x: 480 - 480 * s - lt * 8, y: 270 - 270 * s + S(lt * 2) * 6, w: 960 * s, h: 540 * s, rot: S(lt * 0.8) * 0.02 }] };
  });

  at(537.87, (lt) => ({ set: null, bg: [0.85, 0.6, 0.25], cards: [{ tex: 'impSil2', alpha: 0.5 }], post: { flash: clamp(1 - Math.abs(lt - 0.3) * 4, 0, 1) } }));

  at(538.838, (lt) => {
    const s = 1.1 - lt * 0.03;
    return { set: null, bg: [0, 0, 0], cards: [{ tex: 'impSil2', x: 480 - 480 * s, y: 270 - 270 * s, w: 960 * s, h: 540 * s }], post: { flash: clamp(0.8 - lt * 4, 0, 1) } };
  });

  at(540.706, (lt) => {
    const s = 1.04 + lt * 0.03;
    return { set: null, bg: [0, 0, 0], cards: [{ tex: 'impFace', x: 480 - 480 * s, y: 270 - 270 * s, w: 960 * s, h: 540 * s }] };
  });

  const CO = NZ.cones;
  const HAY = [4, 0, 3];
  const SOL = [3.2, 1.6];

  function bluSoldier(pose, o) {
    return Object.assign({ cls: 'soldier', team: 'blu', pose }, o || {});
  }

  function hooded(pose, o) {
    return man('assassin', pose, Object.assign({ grips: { L: 'open', R: 'open' } }, o || {}));
  }

  function bodyArc(lt) {
    const k = clamp((lt - 3.2) / 1.0, 0, 1);
    if (k >= 1) return Pose.supine('scout', 3.8, -4.0, -0.6, {});
    const p = [2.6 + k * 1.2, 0.5 + S(k * PI) * 2.8, -4.6 + k * 0.6];
    return Pose.airborne('scout', p, [S(k * 5), C(k * 5), 0.2], [0, -0.2, 1], {});
  }

  at(541.774, (lt, t) => {
    const blown = lt > 3.2;
    const body = blown ? { cls: 'scout', team: 'blu', pose: zpose(CO, bodyArc(lt)), shadow: false } : { cls: 'scout', team: 'blu', pose: zpose(CO, Pose.supine('scout', 2.6, -4.6, -1.2, {})), face: { eyes: 'shut' } };
    const fx = lt > 3.1 && lt < 5 ? [{ kind: 'boom', p: zp(CO, 2.6, 0.5, -4.6), s: 1.8, u: lt - 3.1, dur: 1.0 }] : [];
    if (lt > 3.1 && lt < 4.2) fx.push({ kind: 'blood', p: zp(CO, 2.6, 0.6, -4.5), u: lt - 3.1, n: 18, s: 1.2 });
    return night(CO, t, {
      camera: zcam(CO, [-1.2 + lt * 0.15, 0.45, -1.2], [1.0 + lt * 0.2, 1.6, -6.5], 64, { shake: lt > 3.1 && lt < 3.8 ? 0.06 : 0, shakeT: lt * 20 }),
      actors: [body],
      fx
    });
  });

  at(546.846, (lt, t) => night(CO, t, {
    camera: zcam(CO, [-2 + lt * 0.2, 7, 2.5], [4, 2.6, -7], 64),
    props: [{ kind: 'haystack', at: zp(CO, HAY[0], 0, HAY[2]), s: 1.3 }]
  }));

  at(548.848, (lt, t) => {
    const so = bluSoldier(zpose(CO, Pose.stand('soldier', SOL[0], SOL[1] - 1.2, 2.4, { nk: [-0.3 - lt * 0.03, 0.2, 0], hR: [-0.25, -0.2, 0.15] })), { face: { eyes: 'wide', brows: 'sad', mouth: 'frown' } });
    return night(CO, t, {
      camera: faceCam(so, 0.7, -0.08, 0.25, 52, { lu: 0.04 }),
      actors: [so],
      props: [{ kind: 'haystack', at: zp(CO, HAY[0], 0, HAY[2]), s: 1.3 }]
    });
  });

  function leap(lt) {
    const k = clamp((lt - 0.5) / 1.8, 0, 1);
    const p0 = [9, 9.2 + 1.0, -3], p1 = [HAY[0], 0.5, HAY[2]];
    const p = [lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k * k) + S(k * PI) * 1.2, lerp(p0[2], p1[2], k)];
    if (lt < 0.5) return Pose.stand('man', 9.2, -3.4, -2.2, { y: 9.2, hR: [-0.3, 0.6, 0.2], hL: [0.3, 0.6, 0.2] });
    return Pose.airborne('man', p, [0.5, 0.8, -0.3], [-0.6, -0.2, 0.6], { hR: [-0.35, 0.45, 0.2], hL: [0.35, 0.45, 0.2] });
  }

  at(551.884, (lt, t) => {
    const ho = hooded(zpose(CO, leap(lt)), { face: { mouth: 'scream', open: 0.8 } });
    const m = Cast.solve('man', ho.pose);
    const plank = { kind: 'fencePlank', M: M4.chain(M4.translate(...V3.mul(V3.add(m.pts.wristL, m.pts.wristR), 0.5)), M4.rotZ(PI / 2), M4.translate(0, -0.6, 0)) };
    const hp = m.pts.head;
    return night(CO, t, {
      camera: cam(V3.add(hp, [-2.6, 0.2, 2.8]), V3.add(hp, [0.4, -0.3, -0.4]), 60),
      actors: [ho],
      props: [plank, { kind: 'haystack', at: zp(CO, HAY[0], 0, HAY[2]), s: 1.3 }]
    });
  });

  at(554.02, (lt, t) => {
    const puff = lt > 0.3 && lt < 2.2 ? [{ kind: 'smoke', p: zp(CO, HAY[0], 0.4, HAY[2]), s: 1.2, n: 14, u: lt - 0.3, dur: 1.6, col: [0.9, 0.78, 0.45] }] : [];
    const ho = lt > 0.3 ? [] : [hooded(zpose(CO, Pose.airborne('man', [HAY[0] + 0.6, 2.4 - lt * 6, HAY[2] - 0.8], [0.5, 0.8, -0.3], [-0.6, -0.2, 0.6], {})))];
    return night(CO, t, {
      camera: zcam(CO, [HAY[0] - 2.2, 1.5, HAY[2] + 4.2], [HAY[0] + 1.5, 0.3, HAY[2] - 3.5], 60),
      actors: ho.concat([{ cls: 'scout', team: 'blu', pose: zpose(CO, Pose.supine('scout', 7.5, -1.2, -2.0, {})), face: { eyes: 'shut' } }]),
      props: [{ kind: 'haystack', at: zp(CO, HAY[0], 0, HAY[2]), s: 1.3 }, { kind: 'cone', at: zp(CO, 6, 0, 0.5), s: 1.4 }, { kind: 'cone', at: zp(CO, 7, 0, 1.6), s: 1.4 }],
      fx: puff
    });
  });

  function proneHood(x, z, yaw, reach, o) {
    const d = Cast.D.man;
    return Pose.prone('man', x, z, yaw, Object.assign({ nk: [-1.15, 0, 0], tilt: 0.3, hR: [-(d.shX + 0.15), 0.6 + (reach || 0) * 0.3, 0.15], hL: [d.shX + 0.15, 0.55, 0.15] }, o || {}));
  }

  function proneSol(x, z, yaw) {
    const d = Cast.D.soldier;
    return Pose.prone('soldier', x, z, yaw, { nk: [-1.1, 0, 0], tilt: 0.3, hR: [-(d.shX - 0.05), 0.35, 0.3], hL: [d.shX - 0.05, 0.35, 0.3] });
  }

  function proneCam(a, d, h, sd, fov, o) {
    const m = Cast.solve(a.cls, a.pose);
    const hd = m.pts.head, pv = m.pts.pelvis;
    const dir = V3.norm([hd[0] - pv[0], 0, hd[2] - pv[2]]);
    const side = [dir[2], 0, -dir[0]];
    const eye = V3.add(hd, V3.add(V3.mul(dir, d), V3.add([0, h, 0], V3.mul(side, sd))));
    const look = (o && o.at) || V3.add(hd, (o && o.look) || [0, -0.03, 0]);
    return cam(eye, look, fov, o);
  }

  const SOLC = [2, 1];
  const HOODC = [1.2, 6];

  const solC = (face) => bluSoldier(zpose(CO, proneSol(SOLC[0], SOLC[1], 0)), { face });
  const hoodC = (face, reach) => hooded(zpose(CO, proneHood(HOODC[0], HOODC[1], PI, reach || 0)), { face });

  at(556.189, (lt, t) => {
    const ho = hoodC({ eyes: 'half' });
    const so = solC({ eyes: 'wide' });
    return night(CO, t, {
      camera: proneCam(so, -0.5, 0.2, 0.35, 56, { at: zp(CO, HOODC[0] + 0.3, 0.2, HOODC[1]) }),
      actors: [ho, so],
      props: [{ kind: 'haystack', at: zp(CO, HAY[0], 0, HAY[2]), s: 1.3 }]
    });
  });

  const solClose = (lt, t, face) => {
    const so = solC(face);
    return night(CO, t, { camera: proneCam(so, 0.62, -0.03, 0.12, 46, { look: [0, 0.01, 0] }), actors: [so] });
  };

  const hoodClose = (lt, t, face, o) => {
    const ho = hoodC(face, (o && o.reach) || 0);
    return night(CO, t, { camera: proneCam(ho, (o && o.d) || 0.6, 0.06, (o && o.sd) || 0.05, (o && o.fov) || 44), actors: [ho] });
  };

  at(558.391, (lt, t) => solClose(lt, t, { eyes: 'wide', brows: 'sad', mouth: 'frown' }));
  at(559.358, (lt, t) => solClose(lt, t, talk(t, 1.2, { eyes: 'wide', brows: 'up' })));
  at(561.26, (lt, t) => hoodClose(lt, t, { eyes: 'crazy', brows: 'up', mouth: 'o' }, { d: 0.62 }));
  at(562.795, (lt, t) => solClose(lt, t, { eyes: 'half', brows: 'angry', mouth: 'frown' }));
  at(564.363, (lt, t) => hoodClose(lt, t, { eyes: 'crazy', brows: 'up', mouth: 'scream', open: 1 }, { d: 0.42, fov: 42 }));

  const LH = [0.3, 7.2];
  const LS = [-2.6, 7.2];

  at(566.666, (lt, t) => {
    const hit = lt > 1.7;
    const kb = clamp((lt - 1.7) / 0.5, 0, 1);
    const ho = hooded(zpose(CO, proneHood(LH[0] - (hit ? 0.3 : 0), LH[1], -PI / 2, hit ? 1 : 0)), { face: { eyes: 'crazy', mouth: hit ? 'grin' : 'teeth' }, itemL: hit ? 'hiddenBlade' : undefined });
    let sp = proneSol(LS[0], LS[1], PI / 2);
    if (hit) sp = kb < 1 ? Pose.airborne('soldier', [LS[0] - kb * 1.5, 0.45 + S(kb * PI) * 0.8, LS[1] + kb * 0.2], [-0.9, 0.3, 0.1], [-0.2, 0.6, -0.7], {}) : Pose.supine('soldier', LS[0] - 1.5, LS[1] + 0.2, -PI / 2, {});
    const so = bluSoldier(zpose(CO, sp), { face: { eyes: hit ? 'shut' : 'wide', mouth: hit ? 'scream' : 'frown', open: 1 } });
    const fx = hit && lt < 2.6 ? [{ kind: 'blood', p: zp(CO, LS[0] + 0.2, 0.4, LS[1]), u: lt - 1.7, n: 20, s: 1.0, dir: [-0.8, 0.3, 0] }] : [];
    return night(CO, t, {
      camera: zcam(CO, [-1.1, 0.38, 4.7], [-1.1, 0.5, 9], 62),
      actors: [ho, so],
      props: [{ kind: 'cone', at: zp(CO, -1.5, 0, 6.8), s: 1.3 }, { kind: 'cone', at: zp(CO, -0.8, 0, 7.5), s: 1.3 }],
      fx
    });
  });

  at(569.836, (lt, t) => {
    const ho = hooded(zpose(CO, proneHood(LH[0] - 0.3, LH[1], -PI / 2, 1)), { face: { eyes: 'half', mouth: 'smirk' }, itemL: 'hiddenBlade' });
    const so = bluSoldier(zpose(CO, Pose.supine('soldier', LS[0] - 1.5, LS[1] + 0.2, -PI / 2, {})), { face: { eyes: 'shut', mouth: 'o' } });
    return night(CO, t, {
      camera: zcam(CO, [-1.6, 0.45, 6.4], [-0.3, 0.35, 7.2], 58),
      actors: [ho, so],
      props: [{ kind: 'cone', at: zp(CO, -1.5, 0, 6.8), s: 1.3 }, { kind: 'cone', at: zp(CO, -0.8, 0, 7.5), s: 1.3 }]
    });
  });

  at(571.871, (lt, t) => hoodClose(lt, t, { eyes: 'half', brows: 'raise', mouth: 'smirk' }, { d: 0.45, sd: -0.1, fov: 40 }));

  function spyLying(x, z, yaw) {
    const d = Cast.D.spy;
    return Pose.prone('spy', x, z, yaw, { nk: [-1.0, 0.1, 0], hR: [-(d.shX - 0.05), 0.5, 0.3], hL: [d.shX - 0.05, 0.4, 0.3], tilt: 0.45 });
  }

  function engiMaskProp(a) {
    const m = Cast.solve(a.cls, a.pose);
    return { kind: 'sign', tex: 'engiMask', M: M4.chain(m.head, M4.translate(0, 0.0, Cast.HEAD[a.cls].rz + 0.03), M4.scale(0.3, 0.3, 1)) };
  }

  const SPYPOS = [-1.6, 8.2];

  at(572.738, (lt, t) => {
    const sp = { cls: 'spy', team: 'red', pose: zpose(CO, spyLying(SPYPOS[0], SPYPOS[1], PI * 0.95)), itemR: 'photo', grips: { R: 'grip' }, face: talk(t, 1) };
    return night(CO, t, { camera: proneCam(sp, 0.9, -0.05, 0.1, 48, { look: [0, -0.12, 0] }), actors: [sp], props: [engiMaskProp(sp)] });
  });

  at(575.508, (lt, t) => hoodClose(lt, t, talk(t, 1.2, { eyes: 'half', brows: 'angry' }), { d: 0.75, sd: 0.12, fov: 46 }));

  at(577.477, (lt, t) => {
    const sp = { cls: 'spy', team: 'red', pose: zpose(CO, spyLying(SPYPOS[0], SPYPOS[1], PI * 0.95)), itemR: 'photo', grips: { R: 'grip' }, face: talk(t, 1, { brows: 'up' }) };
    return night(CO, t, { camera: proneCam(sp, 0.85, -0.05, 0.12, 48, { look: [0, -0.14, 0] }), actors: [sp], props: lt < 0.4 ? [engiMaskProp(sp)] : [] });
  });

  at(580.213, () => ({ set: null, bg: [0, 0, 0] }));

  const PEN = LZ.pen;

  function penCrew(t) {
    return [
      { cls: 'scout', team: 'red', pose: Pose.sitFloor('scout', PEN[0] - 1.8, PEN[2] - 1.4, 0.6, { hR: [-0.1, 0.6, 0.2], hL: [0.1, 0.6, 0.2], nk: [0.3, 0, 0] }), face: { eyes: 'shut', mouth: 'frown' } },
      { cls: 'scout', team: 'blu', pose: Pose.supine('scout', PEN[0] + 0.4, PEN[2] + 0.6, 2.2, {}), face: { eyes: 'shut' } },
      { cls: 'heavy', team: 'red', pose: Pose.sitFloor('heavy', PEN[0] + 1.6, PEN[2] - 1.5, -0.6, {}), face: { brows: 'sad', mouth: 'frown' } },
      { cls: 'soldier', team: 'blu', pose: Pose.prone('soldier', PEN[0] - 1.2, PEN[2] + 1.4, 1.2, {}), face: { eyes: 'shut' } }
    ];
  }

  function lair(t, extra) {
    return Object.assign({ set: 'lair', env: 'lair', grade: [0.95, 1.0, 1.1, 0], vignette: 0.4 }, extra);
  }

  at(581.347, (lt, t) => {
    const fall = clamp((lt - 2.6) / 0.6, 0, 1);
    const spy = { cls: 'spy', team: 'red', pose: fall < 1 ? Pose.airborne('spy', [PEN[0] + 0.6, lerp(5, 0.3, fall * fall), PEN[2] - 0.4], [0.2, 0.9, 0.3], [0, -0.3, 1], {}) : Pose.supine('spy', PEN[0] + 0.6, PEN[2] - 0.4, 1.0, {}), face: { eyes: 'wide', mouth: 'scream', open: 0.8 } };
    return lair(t, {
      camera: cam([PEN[0] - 2.6, 4.6, PEN[2] + 2.4], [PEN[0] + 0.6, 0, PEN[2] - 0.6], 60, { roll: -0.2 }),
      actors: penCrew(t).concat(lt > 2.6 ? [spy] : []),
      props: [{ kind: 'boardGame', tex: 'boardGame', at: [PEN[0] - 0.1, 0, PEN[2] + 0.2], yaw: 0.4, s: 1.6 }]
    });
  });

  const DESK = LZ.desk;

  function deskSpy(t, o) {
    const d = Cast.D.spy;
    const pose = Pose.stand('spy', DESK[0], DESK[2] - 0.75, 0, { dy: -0.45, sp: [0.1, 0, 0], hR: [-(d.shX + 0.1), 0.05, 0.42], hL: [d.shX + 0.12, 0.05, 0.42], nk: [0.05, S(t * 0.8) * 0.1, 0] });
    if (o && o.wave) pose.hL = [d.shX + 0.25, 0.55 + S(t * 9) * 0.06, 0.25];
    return { cls: 'spy', team: 'blu', pose, face: talk(t, 1, { brows: 'flat' }), grips: { L: o && o.wave ? 'open' : 'relax' } };
  }

  function deskProps() {
    return [
      { kind: 'deskLair', at: [DESK[0], 0, DESK[2]], yaw: 0 },
      { kind: 'whiteboard', tex: 'doodle', at: [DESK[0] + 0.4, 2.4, DESK[2] - 3.4], yaw: 0, s: 1.4 },
      { kind: 'crate', at: [DESK[0] + 2.6, 0, DESK[2] - 1.2], yaw: 0.3 }
    ];
  }

  function hoodHall(t, o) {
    const d = Cast.D.man;
    const pose = Pose.stand('man', -3.8, -1.6, -2.4, Object.assign({ hR: [-(d.shX + 0.25), -0.05, -0.05], hL: [d.shX + 0.25, -0.05, -0.05], eR: [-1, 0, -0.4], eL: [1, 0, -0.4] }, o || {}));
    return hooded(pose, { face: talk(t, 1.2, { brows: 'angry', eyes: 'half' }), grips: { L: 'fist', R: 'fist' } });
  }

  at(584.984, (lt, t) => {
    const ho = hoodHall(t, { hR: [-0.3, 0.3, 0.35], eR: undefined });
    ho.grips = { L: 'fist', R: 'open' };
    return lair(t, { camera: faceCam(ho, 1.3, 0.2, 0.2, 50, { chest: true, lu: 0.15 }), actors: [ho] });
  });

  at(586.119, (lt, t) => {
    const sp = deskSpy(t, { wave: true });
    return lair(t, { camera: faceCam(sp, 0.78, -0.05, 0.12, 50, { lu: -0.12 }), actors: [sp], props: deskProps() });
  });

  at(588.321, (lt, t) => {
    const ho = hoodHall(t);
    return lair(t, { camera: faceCam(ho, 0.8, 0.1, -0.1, 52, { chest: true, lu: 0.12 }), actors: [ho] });
  });

  at(590.223, (lt, t) => {
    const sp = deskSpy(t);
    return lair(t, { camera: faceCam(sp, 1.5, 0.05, -0.1, 50, { lu: -0.22 }), actors: [sp], props: deskProps() });
  });

  at(592.258, (lt, t, dur) => checkShot(0, lt, dur));
  at(593.326, (lt) => moonShot(lt));

  const RX = NZ.redExt;

  function redNight(t, extra) {
    return Object.assign({ set: 'night', env: 'redNight', grade: [0.95, 0.92, 1.0, 0.05], vignette: 0.35 }, extra, { fx: sky(RX, t).concat(extra.fx || []) });
  }

  const HEAVY_IN = [-2.0, -1.8];
  const SCOUT_IN = [-0.8, -1.6];
  const PILLAR = [4, 5];

  function heavyIn(t, o) {
    const pose = Pose.stand('heavy', HEAVY_IN[0], HEAVY_IN[1], 0.1, Object.assign({ nk: [0.05, 0, 0] }, o || {}));
    return { cls: 'heavy', team: 'red', pose: zpose(RX, pose), face: talk(t, 1) };
  }

  function scoutIn(t, o) {
    const pose = Pose.stand('scout', SCOUT_IN[0], SCOUT_IN[1], -0.2, Object.assign({}, o || {}));
    return { cls: 'scout', team: 'red', pose: zpose(RX, pose), face: talk(t, 1, { brows: 'up' }) };
  }

  function engiHide(t, peek) {
    const pose = Pose.crouch('engineer', PILLAR[0] + 0.15 - peek * 0.35, PILLAR[1] + 0.7, PI - 0.3, { nk: [-0.1, -0.3 * peek, 0] });
    return { cls: 'engineer', team: 'blu', pose: zpose(RX, pose), face: { eyes: 'wide', mouth: 'teeth' } };
  }

  function rxProps() {
    return [
      { kind: 'yellowPillar', at: zp(RX, PILLAR[0], 0, PILLAR[1]) },
      { kind: 'tyre', at: zp(RX, PILLAR[0] + 2.4, 0, PILLAR[1] + 1.2), yaw: 0.4 },
      { kind: 'towelRack', at: zp(RX, 5.9, 0, -3.2), yaw: -PI / 2 }
    ];
  }

  at(594.327, (lt, t) => redNight(t, {
    camera: zcam(RX, [8.5, 1.5, 8.5], [1.0, 1.4, 1.5], 60),
    actors: [heavyIn(t), engiHide(t, clamp(S(lt * 0.9), 0, 1))],
    props: rxProps()
  }));

  at(600.433, (lt, t) => {
    const hv = heavyIn(t, { hR: [-0.3, 0.45, 0.35], hL: [0.3, 0.45, 0.35] });
    hv.face = { eyes: 'shut', brows: 'angry', mouth: 'teeth' };
    hv.pose = zpose(RX, Pose.stand('heavy', 4.6, -3.0, PI / 2 - 0.3, { nk: [0.1, 0, 0], hR: [-0.2, 0.5, 0.35], hL: [0.2, 0.5, 0.35] }));
    const m = Cast.solve('heavy', hv.pose);
    return redNight(t, {
      camera: faceCam(hv, 0.42, 0.0, -0.12, 50, { ls: -0.08 }),
      actors: [hv],
      props: rxProps(),
      fx: [{ kind: 'spray', p: V3.add(m.pts.head, [0.0, 0.18, 0.0]), u: lt, col: [0.75, 0.88, 1.0] }, { kind: 'spray', p: V3.add(m.pts.head, [-0.1, 0.1, 0.12]), u: lt + 0.3, col: [0.75, 0.88, 1.0] }]
    });
  });

  at(606.772, (lt, t) => {
    const sc = scoutIn(t, { hR: [-0.1, 0.4, 0.5] });
    sc.grips = { R: 'point' };
    return redNight(t, {
      camera: zcam(RX, [-1.9, 1.9, -3.4], [3.5, 0.6, 6], 58),
      actors: [heavyIn(t), sc, engiHide(t, 0.6)],
      props: rxProps()
    });
  });

  at(609.408, (lt, t) => {
    const sc = scoutIn(t, { hR: [-0.15, 0.25, 0.5], sp: [0.2, 0.2 * S(t * 9), 0] });
    sc.grips = { R: 'point' };
    sc.face = { mouth: 'scream', open: 0.7 + 0.3 * S(t * 12), eyes: 'crazy' };
    const hv = heavyIn(t, { sp: [0.1, 0.1 * S(t * 7), 0] });
    hv.face = { mouth: 'grin', open: 0.6 + 0.3 * S(t * 9), eyes: 'half' };
    return redNight(t, { camera: faceCam(hv, 0.5, -0.02, 0.28, 54, { ls: 0.45 }), actors: [hv, sc], props: rxProps() });
  });

  const SENTRY = [-0.9, 2.6];

  at(613.212, (lt, t) => redNight(t, {
    camera: zcam(RX, [-3.2, 1.1, 5.4], [-0.4, 1.2, 1.0], 56),
    actors: [heavyIn(t), scoutIn(t)],
    props: rxProps().concat([{ kind: 'sentry3', at: zp(RX, SENTRY[0], 0, SENTRY[1]), yaw: -PI / 2 + 0.3, s: 1.4 }])
  }));

  at(618.384, (lt, t) => {
    const hv = heavyIn(t);
    hv.face = { eyes: 'wide', brows: 'up', mouth: 'o' };
    const sc = scoutIn(t);
    sc.face = { eyes: 'half', brows: 'angry', mouth: 'smirk' };
    return redNight(t, { camera: faceCam(hv, 0.5, -0.02, 0.28, 54, { ls: 0.45 }), actors: [hv, sc], props: rxProps() });
  });

  function samLean(t, down) {
    const pose = Pose.stand('man', SENTRY[0] + 0.9, SENTRY[1] + 0.6, -PI / 2 - 0.4, { sp: [0.4, 0, 0], hR: [-0.3, -0.1, 0.45], hL: [0.25, 0.2, 0.4] });
    return man('sam', zpose(RX, pose), { hat: down ? 'nvgDown' : 'nvgUp', face: { eyes: 'half', mouth: 'shut' } });
  }

  function sentryProp() {
    return { kind: 'sentry3', at: zp(RX, SENTRY[0], 0, SENTRY[1]), yaw: -PI / 2 + 0.3, s: 1.4 };
  }

  at(619.952, (lt, t) => redNight(t, {
    camera: zcam(RX, [1.5, 1.6, 4.6], [-1.0, 1.3, 2.4], 56),
    actors: [heavyIn(t), scoutIn(t), samLean(t, lt > 1.6)],
    props: rxProps().concat([sentryProp()])
  }));

  function samClose(t, lt) {
    const sm = samLean(t, true);
    const m = Cast.solve('man', sm.pose);
    const glow = [-1, 1, 0].map(k => ({ kind: 'glow', p: M4.point(m.head, [k * 0.04, 0.03 + (k === 0 ? 0.03 : 0), 0.16]), s: 0.06, col: [0.4, 1, 0.5], alpha: 0.7 }));
    return { sm, glow };
  }

  at(622.688, (lt, t) => {
    const { sm, glow } = samClose(t, lt);
    return redNight(t, { camera: faceCam(sm, 0.66, 0.03, -0.12, 46, { lu: -0.03 }), actors: [sm], props: rxProps().concat([sentryProp()]), fx: glow });
  });

  at(623.456, (lt, t) => {
    const sc = scoutIn(t);
    sc.face = { eyes: 'angry', brows: 'angry', mouth: 'teeth' };
    return redNight(t, { camera: faceCam(sc, 0.38, 0.0, 0.03, 50), actors: [sc], props: rxProps() });
  });

  at(624.857, (lt, t) => {
    const { sm, glow } = samClose(t, lt);
    return redNight(t, { camera: faceCam(sm, 0.42, 0.02, 0.04, 42), actors: [sm], props: rxProps().concat([sentryProp()]), fx: glow });
  });

  at(626.325, (lt, t) => {
    const pose = Pose.crouch('man', SENTRY[0], SENTRY[1], -PI / 2, { y: 1.0, depth: 0.55, hR: [-0.3, -0.3, 0.3], hL: [0.3, -0.3, 0.3] });
    const sm = man('sam', zpose(RX, pose), { hat: 'nvgDown', grips: { L: 'fist', R: 'fist' } });
    const hv = heavyIn(t);
    hv.face = { eyes: 'wide', mouth: 'o' };
    return redNight(t, {
      camera: zcam(RX, [-3.2, 1.5, 5.0], [-0.8, 1.3, 1.5], 56),
      actors: [hv, scoutIn(t), sm],
      props: rxProps().concat([sentryProp()]),
      fx: [{ kind: 'sparks', p: zp(RX, SENTRY[0], 1.1, SENTRY[1]), u: lt, n: 12 }]
    });
  });

  at(628.06, (lt, t) => redNight(t, {
    camera: zcam(RX, [-3.8, 1.4, 6.0], [-1.2, 1.4, -1.0], 52, { shake: clamp(0.12 - lt * 0.04, 0, 0.12), shakeT: lt * 25 }),
    actors: [],
    props: rxProps(),
    fx: [
      { kind: 'boom', p: zp(RX, -1.4, 1.2, -1.6), s: 2.4, u: lt, dur: 1.4 },
      { kind: 'fire', p: zp(RX, -1.4, 0.2, -1.8), w: 2.4, d: 1.4, h: 2.2, s: 0.9, u: lt, n: 18 },
      { kind: 'smoke', p: zp(RX, -1.4, 1.6, -1.4), s: 1.8, u: lt, dur: 3.2, col: [0.2, 0.18, 0.16], alpha: 0.85 },
      { kind: 'shards', p: zp(RX, -1.2, 1.8, 0.1), u: Math.min(lt, 1.4), s: 4 }
    ],
    post: { flash: clamp(0.9 - lt * 3, 0, 1) }
  }));

  at(631.13, (lt, t) => {
    const hv = heavyIn(t);
    hv.face = { eyes: 'wide', brows: 'up', mouth: 'o' };
    const sc = scoutIn(t, { hR: [-0.1, 0.35, 0.5] });
    sc.face = { eyes: 'wide', brows: 'up', mouth: 'o' };
    sc.grips = { R: 'point' };
    return redNight(t, { camera: faceCam(hv, 0.5, -0.02, 0.28, 54, { ls: 0.45 }), actors: [hv, sc], props: rxProps() });
  });

  const BN = NZ.banner;

  function banner(t, extra) {
    return night(BN, t, extra);
  }

  at(632.765, (lt, t) => {
    const pose = Pose.stand('man', 1, 4, 0.2, { dy: -0.28, hR: [-0.15, 0.25, 0.5], hL: [0.25, 0.2, 0.45] });
    pose.fLw = [1.9, 0.62, 4];
    pose.fRw = [0.1, 0.62, 4];
    const sm = man('sam', zpose(BN, pose), { hat: 'nvgDown', itemR: 'pistol', grips: { R: 'grip', L: 'grip' } });
    const m = Cast.solve('man', sm.pose);
    return banner(t, {
      camera: zcam(BN, [0.4, 0.95, 7.0], [1, 1.0, 3.5], 60),
      actors: [sm],
      props: [{ kind: 'cone', at: zp(BN, 1.9, 0, 4), s: 1.3 }, { kind: 'cone', at: zp(BN, 0.1, 0, 4), s: 1.3 }],
      fx: [{ kind: 'muzzle', p: M4.point(m.handR, [0, -0.05, 0.3]), u: lt, s: 0.25 }]
    });
  });

  at(633.799, (lt, t) => ({
    set: 'red',
    camera: cam([-2.3, 0.5, -4.0], [-5.8, 1.3, -4.0], 64),
    actors: [{ cls: 'scout', team: 'red', pose: Pose.supine('scout', -3.9, -4.0, -PI / 2, {}), face: { eyes: 'shut', mouth: 'o' } }]
  }));

  at(635.268, (lt, t, dur) => checkShot(1, lt, dur));
  at(636.736, (lt) => moonShot(lt));

  const KN = [2, 2];

  function knight(t, o) {
    const pose = Pose.stand('man', KN[0], KN[1], (o && o.yaw) || 0, Object.assign({}, o || {}));
    return man('knight', zpose(BN, pose), { itemR: 'longsword', grips: { R: 'grip', L: (o && o.gripL) || 'relax' } });
  }

  function dragon(t) {
    const a = t * 1.3;
    const p = zp(BN, S(a) * 7, 7.4 + S(t * 2.6) * 0.6, -7 + C(a) * 2.5);
    const yaw = a + PI / 2;
    const flap = S(t * 14) * 0.7;
    const base = M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw), M4.scale(2.2, 2.2, 2.2));
    return [
      { kind: 'dragonBody', M: base },
      { kind: 'dragonWing', M: M4.chain(base, M4.translate(0.08, 0.1, 0.05), M4.rotZ(flap)) },
      { kind: 'dragonWing', M: M4.chain(base, M4.translate(-0.08, 0.1, 0.05), M4.scale(-1, 1, 1), M4.rotZ(flap)) }
    ];
  }

  const BEANIE = [1, -9];

  function beanie(t, o) {
    const pose = Pose.stand('man', BEANIE[0], BEANIE[1], 0.3, Object.assign({ nk: [-0.3, 0.2, 0] }, o || {}));
    return man('beanie', zpose(BN, pose), { face: { eyes: 'half' } });
  }

  at(638.004, (lt, t) => {
    const kn = knight(t, { hL: [0.15, 0.45, 0.55], yaw: 0.1 });
    kn.grips.L = 'point';
    return banner(t, { camera: faceCam(kn, 1.35, -0.25, -0.2, 54, { chest: true, lu: 0.1 }), actors: [kn] });
  });

  at(639.071, (lt, t) => {
    const kn = knight(t, { hR: [-0.25, 0.55, 0.35], hL: [0.35, -0.1, 0.2], yaw: -0.4 });
    return banner(t, { camera: zcam(BN, [2.6, 1.2, 4.6], [2, 2.0, 2], 56), actors: [kn], props: dragon(t) });
  });

  at(640.806, (lt, t) => banner(t, {
    camera: zcam(BN, [-6, 1.4, 6], [0, 6.5, -7], 62),
    actors: [beanie(t)],
    props: dragon(t)
  }));

  at(641.3, (lt, t) => {
    const kn = knight(t, { hR: [-0.1, 0.75, 0.25], hL: [0.3, 0.0, 0.3], yaw: 0.3 });
    return banner(t, { camera: faceCam(kn, 1.1, -0.75, 0.35, 62, { chest: true, lu: 0.35 }), actors: [kn] });
  });

  at(642.775, (lt, t) => {
    const kn = knight(t, { hR: [-0.15, 0.65, 0.3], hL: [0.3, 0.1, 0.3], yaw: 0.6 });
    return banner(t, { camera: faceCam(kn, 1.4, -0.6, 0.4, 60, { chest: true, lu: 0.3 }), actors: [kn], props: dragon(t) });
  });

  at(644.21, (lt, t) => banner(t, { camera: zcam(BN, [4, 2.2, 8], [0, 7, -7], 56), actors: [beanie(t)], props: dragon(t) }));

  at(645.211, (lt, t) => {
    const kn = knight(t, { hR: [-0.3, 0.5, 0.25], yaw: -0.2 });
    return banner(t, { camera: zcam(BN, [-1.0, 1.2, 4.8], [1.8, 2.2, 1.6], 50), actors: [kn, beanie(t)], props: dragon(t) });
  });

  at(646.779, (lt, t) => {
    const kn = knight(t, { hR: [-0.2, 0.6, 0.4], hL: [0.3, -0.1, 0.15], yaw: 0.2 });
    return banner(t, { camera: faceCam(kn, 0.95, 0.15, 0.3, 52, { chest: true, lu: 0.12 }), actors: [kn], props: dragon(t) });
  });

  at(648.581, (lt, t) => {
    const kn = knight(t, { hR: [-0.2, 0.75, 0.2], yaw: 0.0 });
    return banner(t, { camera: faceCam(kn, 0.95, 0.0, 0.1, 50, { lu: -0.1 }), actors: [kn] });
  });

  at(649.649, (lt, t) => {
    const kn = knight(t, { hR: [-0.15, 0.85, 0.15], hL: [0.25, 0.3, 0.6], yaw: PI });
    kn.grips.L = 'open';
    const k = clamp((lt - 0.25) / 1.2, 0, 1);
    const from = zp(BN, KN[0] + 0.3, 1.6, KN[1] - 0.6), to = zp(BN, BEANIE[0], 1.2, BEANIE[1]);
    const ball = lerp3(from, to, k);
    const fx = lt > 0.25 && k < 1 ? [{ kind: 'glow', p: ball, s: 1.6, col: [1, 0.6, 0.2], alpha: 0.8 }, { kind: 'fire', p: ball, w: 0.3, d: 0.3, h: 0.5, s: 0.7, u: lt, n: 10, dir: [0, 0.3, 1] }] : [];
    if (k >= 1) fx.push({ kind: 'boom', p: to, s: 1.4, u: lt - 1.45, dur: 0.8 });
    return banner(t, { camera: zcam(BN, [KN[0] + 0.8, 1.9, KN[1] + 1.8], [BEANIE[0], 1.0, BEANIE[1]], 54), actors: [kn, beanie(t)], fx });
  });

  at(651.517, (lt, t) => {
    const hunch = beanie(t, { sp: [0.5, 0, 0], nk: [-0.2, 0, 0], hR: [-0.25, -0.05, 0.3], hL: [0.25, -0.05, 0.3] });
    hunch.face = { eyes: 'shut', mouth: 'frown' };
    const k = clamp((lt - 1.2) / 2.2, 0, 1);
    const kx = lerp(KN[0], BEANIE[0] - 0.2, k), kz = lerp(KN[1], BEANIE[1] + 1.2, k);
    const kn = man('knight', zpose(BN, k < 1 ? Pose.run('man', kx, kz, PI + 0.1, lt * 1.8, { hR: [-0.2, 0.6, 0.2] }) : Pose.stand('man', kx, kz, PI, { hR: [-0.1, 0.35, 0.55], hL: [0.1, 0.3, 0.55], sp: [0.3, 0, 0] })), { itemR: 'longsword', grips: { R: 'grip' } });
    const actors = [hunch, kn];
    const props = [];
    if (lt > 3.6) {
      const m = Cast.solve('man', hunch.pose);
      props.push({ kind: 'longsword', M: M4.chain(M4.translate(...m.pts.head), M4.rotX(0.3), M4.translate(0, 0, -0.5)) });
      kn.itemR = undefined;
    }
    return banner(t, { camera: faceCam(hunch, 1.15, -0.05, 0.1, 56, { chest: true, lu: 0.0 }), actors, props });
  });

  const SPYD = [9.6, 6.5];

  function danceSpy(t, flat) {
    const kick = S(t * 6);
    const pose = flat ? Pose.supine('spy', SPYD[0], SPYD[1], PI / 2, {}) : Pose.stand('spy', SPYD[0], SPYD[1], -PI / 2 + 0.5, { liftL: Math.max(0, kick) * 0.5, liftR: Math.max(0, -kick) * 0.4, fl: kick * 0.4, hR: [-0.45, 0.25 + kick * 0.15, 0.1], hL: [0.45, 0.25 - kick * 0.15, 0.1] });
    return { cls: 'spy', team: 'blu', pose: zpose(BN, pose), hat: flat ? 'none' : 'hatstack', face: { mouth: flat ? 'o' : 'grin', eyes: flat ? 'crazy' : 'half' } };
  }

  at(655.855, (lt, t) => {
    const fly = clamp(lt / 0.9, 0, 1);
    const so = man('beanie', zpose(BN, Pose.airborne('man', [BEANIE[0] + 2 + fly * 5, 0.6 + S(fly * PI) * 2.2, BEANIE[1] + 4 + fly * 7], [S(fly * 6), C(fly * 6), 0], [0, 0, 1], {})), {});
    const k = ease(ramp(lt, 0.6, 1.6));
    const eye = lerp3(zp(BN, BEANIE[0] + 4, 1.6, BEANIE[1] + 9), zp(BN, 7.6, 1.0, 8.8), k);
    const look = lerp3(zp(BN, BEANIE[0] + 6, 1.2, BEANIE[1] + 9), zp(BN, SPYD[0] + 1, 1.6, SPYD[1]), k);
    const flat = lt > 5.0;
    const actors = fly < 1 ? [so] : [];
    actors.push(danceSpy(t, flat));
    const props = [];
    if (flat) [['hatTall', 0.6, 0.4], ['hatWitch', -0.5, 0.8], ['hatBrim', 0.9, -0.5], ['hatSkull', -0.3, -0.7]].forEach(([kind, dx, dz]) => props.push({ kind, at: zp(BN, SPYD[0] + dx, 0.02, SPYD[1] + dz), yaw: dx * 3, roll: 1.2 }));
    const fx = lt > 4.6 && lt < 6.4 ? [{ kind: 'smoke', p: zp(BN, SPYD[0] - 2 + clamp((lt - 4.6) * 4, 0, 2), 0.8, SPYD[1]), s: 2.2, n: 16, u: lt - 4.6, dur: 1.8, col: [0.86, 0.82, 0.72] }] : [];
    return banner(t, { camera: cam(eye, look, 56), actors, props, fx });
  });

  at(662.228, (lt, t) => {
    const ho = hooded(zpose(BN, Pose.stand('man', -2, 6, -2.6, { hR: [-0.13, 0.44, 0.14], nk: [0.1, 0, 0] })), { face: { eyes: 'shut', brows: 'sad', mouth: 'open', open: 0.5 } });
    return banner(t, { camera: faceCam(ho, 0.52, 0.0, 0.15, 50, { ls: 0.02 }), actors: [ho] });
  });

  const PILE = [-11.5, 7];
  const PILE_CLS = ['heavy', 'soldier', 'scout', 'pyro', 'demo', 'medic', 'engineer'];

  function pile(t, standing) {
    const g = rand(12);
    return PILE_CLS.map((cls, i) => {
      const a = (i / PILE_CLS.length) * PI * 2;
      const r = standing ? 2.2 : 0.4 + g() * 0.6;
      const x = PILE[0] + S(a) * r, z = PILE[1] + C(a) * r;
      const team = i % 2 ? 'blu' : 'red';
      if (standing) return { cls, team, pose: zpose(BN, Pose.stand(cls, x, z, a + PI, { nk: [0.3, 0, 0] })), face: { mouth: 'o' } };
      const sw = S(t * (5 + i) + i);
      return { cls, team, pose: zpose(BN, Pose.airborne(cls, [x, 0.35 + g() * 0.7 + Math.abs(sw) * 0.15, z], [S(a + sw * 0.4), 0.4 + g() * 0.6, C(a)], [C(a), -0.4, -S(a)], { hR: [-0.3, 0.4 + sw * 0.2, 0.3], hL: [0.3, 0.3 - sw * 0.2, 0.3] })), face: { mouth: 'scream', open: 0.8, eyes: 'crazy' }, grips: { L: 'fist', R: 'fist' }, shadow: false };
    });
  }

  at(664.397, (lt, t) => {
    const ho = hooded(zpose(BN, Pose.stand('man', -7, 9.5, PI + 0.6, { hR: [-0.1, 0.62, 0.2] })), { face: { eyes: 'half' } });
    return banner(t, {
      camera: (() => { const m = Cast.solve('man', ho.pose); const H = m.head; const rt = V3.norm([H[0], H[1], H[2]]); const e = V3.add(m.pts.head, V3.add(V3.mul(rt, 0.3), [0, 0.06, 0])); return cam(e, zp(BN, PILE[0], 0.9, PILE[1]), 56); })(),
      actors: [ho].concat(pile(t, false)),
      props: [{ kind: 'tyre', at: zp(BN, PILE[0] + 1.6, 0, PILE[1] + 1.8), s: 1.6 }]
    });
  });

  at(666.532, (lt, t) => {
    const ho = hooded(zpose(BN, Pose.stand('man', -2, 6, -2.4, { hR: [-0.05, 0.42, 0.22], hL: [0.25, -0.12, 0.1] })), { itemR: 'walkie', grips: { R: 'grip', L: 'relax' }, face: talk(t, 1.3, { brows: 'angry', eyes: 'half' }) });
    return banner(t, { camera: faceCam(ho, 0.68, 0.0, 0.18, 50, { ls: 0.02 }), actors: [ho] });
  });

  at(668.467, (lt, t) => banner(t, {
    camera: zcam(BN, [PILE[0] + 2.8, 1.0, PILE[1] + 3.0], [PILE[0], 0.8, PILE[1]], 58),
    actors: pile(t, lt > 0.9),
    props: [{ kind: 'tyre', at: zp(BN, PILE[0] + 1.6, 0, PILE[1] + 1.8), s: 1.6 }]
  }));

  const ST = NZ.stage;

  at(670.036, (lt, t) => {
    const pose = Pose.stand('man', 0, -1.6, 0, { y: 1.0, hR: [-0.25, 0.95, 0.15], hL: [0.25, 0.95, 0.15] });
    const ho = hooded(zpose(ST, pose), { face: { mouth: 'grin', open: 0.6 } });
    const m = Cast.solve('man', ho.pose);
    const mid = V3.mul(V3.add(m.pts.wristL, m.pts.wristR), 0.5);
    return {
      set: 'night',
      env: 'night',
      envOver: { ambTop: [0.5, 0.55, 0.75] },
      camera: zcam(ST, [0, 2.1 + lt * 0.05, 0.4 - lt * 0.15], [0, 2.95, -1.6], 58),
      actors: [ho],
      props: [{ kind: 'sign', tex: 'freeHats', M: M4.chain(M4.translate(mid[0], mid[1] + 0.35, mid[2] + 0.06), M4.scale(1.5, 0.75, 1)) }, { kind: 'lightCone', at: zp(ST, -3, 9.4, -1), roll: 0.35, opts: { additive: true, alpha: 0.08 } }, { kind: 'lightCone', at: zp(ST, 3, 9.4, -1), roll: -0.35, opts: { additive: true, alpha: 0.08 } }],
      fx: [{ kind: 'glow', p: zp(ST, 0, 9.4, -1), s: 4, col: [1, 1, 1], alpha: 0.6 }],
      vignette: 0.45
    };
  });

  at(671.704, (lt, t, dur) => checkShot(2, lt, dur));

  at(672.805, (lt, t) => {
    const ho = hooded(zpose(LZ.hall, Pose.stand('man', -1.3, 3.2, -0.35, { hR: [-0.3, 0.6, 0.1] })), { face: { mouth: 'smile', eyes: 'half' } });
    const wave = clamp(lt / 0.5, 0, 1);
    return lair(t, {
      camera: zcam(LZ.hall, [-1.85, 1.55, 4.15], [-1.9, 1.5, 3.2], 56),
      actors: [ho],
      fx: [{ kind: 'sprite', tex: 'impBody', p: [-2.5, 1.2 + S(lt * 6) * 0.03, 3.3], s: [1.15, 1.15] }].concat(Math.abs(lt - 0.5) < 0.12 ? [{ kind: 'glow', p: [-1.9, 1.75, 3.5], s: 0.9 * wave, col: [1, 0.15, 0.1], alpha: 0.9 }] : [])
    });
  });

  at(679.345, (lt, t, dur) => checkShot(3, lt, dur));

  const SN = NZ.street;

  function sniperStreet(lt, t) {
    const hit = lt > 4.6;
    const k = clamp((lt - 4.6) / 0.6, 0, 1);
    const sn = hit ? { cls: 'sniper', team: 'red', pose: zpose(SN, Pose.airborne('sniper', [2 - k * 0.8, 0.5 + S(k * PI) * 0.8, 1.5 - k * 0.6], [-0.6, 0.6, 0.2], [0, -0.3, 1], {})), face: { eyes: 'crazy', mouth: 'scream', open: 1 }, shadow: false } : armed({ cls: 'sniper', team: 'red', gun: 'rifle', pose: zpose(SN, Pose.stand('sniper', 2, 1.5, -PI / 2, {})), face: { eyes: 'half' } });
    const runK = clamp((lt - 2.4) / 2.2, 0, 1);
    const dr = man('drake', zpose(SN, runK < 1 ? Pose.run('man', lerp(9, 2.8, runK), lerp(4, 1.6, runK), -PI / 2 - 0.3, lt * 1.9, {}) : Pose.stand('man', 2.8, 1.6, -PI / 2, { sp: [0.3, 0, 0], hR: [-0.2, 0.3, 0.45] })), { grips: { R: 'fist' }, face: { brows: 'angry', mouth: 'teeth' } });
    return { sn, dr };
  }

  at(673.805, (lt, t) => {
    const { sn, dr } = sniperStreet(lt, t);
    return night(SN, t, { camera: zcam(SN, [0.4, 1.65, 3.6], [2.6, 1.45, 1.2], 58), actors: lt > 2.3 ? [sn, dr] : [sn] });
  });

  const RED = { set: 'red' };

  at(680.813, (lt, t) => {
    const fr = man('frank', Pose.run('man', -1.0 - lt * 0.8, 2.5 - lt * 1.6, -2.68, lt * 1.2, { stride: 0.2 }), { itemR: 'camera', grips: { R: 'grip' } });
    return Object.assign({}, RED, { camera: cam([0.4, 1.75, 4.4], [-3.5, 1.2, -3.0], 56), actors: [fr] });
  });

  at(681.747, (lt, t) => {
    const fr = man('frank', Pose.stand('man', -2.2, -1.2, 0.3, { hR: [-0.06, 0.55, 0.38], hL: [0.12, 0.5, 0.38], nk: [0.05, 0, 0] }), { itemR: 'camera', grips: { R: 'grip', L: 'grip' }, face: { mouth: 'grin', open: 0.6, eyes: 'half' } });
    return Object.assign({}, RED, { camera: faceCam(fr, 0.95, -0.05, 0.1, 52, { lu: -0.08 }), actors: [fr], post: { flash: lt > 0.65 ? clamp((lt - 0.65) * 8, 0, 1) : 0 } });
  });

  at(682.481, () => ({ set: null, bg: [1, 1, 1] }));

  at(682.982, (lt, t) => {
    const sc = { cls: 'scout', team: 'red', pose: Pose.stand('scout', 1.8, -2.4, -0.4, { nk: [0.1, 0.2, 0] }), face: { eyes: 'crazy', brows: 'up', mouth: lt > 1.6 ? 'smirk' : 'shut' } };
    return Object.assign({}, RED, { camera: headCam(sc, [-0.15, -0.02, 0.62], 48, { look: [0, -0.04, 0] }), actors: [sc], cards: [{ tex: 'photoScore', x: 0, y: 0, w: 960, h: 540 }], post: { flash: clamp(0.6 - lt * 3, 0, 1) } });
  });

  at(686.052, (lt, t, dur) => checkShot(4, lt, dur));

  const LG = NZ.ledge;
  const SODA = [3, -1.5];

  function sodaSol(t, o) {
    const d = Cast.D.soldier;
    const pose = Pose.sitFloor('soldier', SODA[0], SODA[1], PI * 0.5 + 0.4, { y: 1.7, hR: [-0.06, 0.38, 0.28], hL: [d.shX, -0.25, 0.05] });
    pose.fLw[1] = 1.78;
    pose.fRw[1] = 1.78;
    return Object.assign({ cls: 'soldier', team: 'blu', pose: zpose(LG, pose), itemR: 'sodaCup', grips: { R: 'grip' }, face: { eyes: 'half', mouth: 'o' } }, o || {});
  }

  function ledgeProps() {
    return [{ kind: 'rocket', at: zp(LG, SODA[0] - 0.8, 1.82, SODA[1] + 0.6), yaw: 0.2, roll: PI / 2 }];
  }

  at(687.52, (lt, t) => night(LG, t, {
    camera: faceCam(sodaSol(t), 1.15, 0.1, 0.35, 56, { chest: true, lu: -0.12 }),
    actors: [sodaSol(t)],
    props: ledgeProps()
  }));

  function thugCrawl(lt) {
    const k = clamp(lt / 6.0, 0, 1);
    const x = lerp(-5, SODA[0] - 1.1, k);
    const d = Cast.D.man;
    const ph = lt * 1.6;
    return Pose.prone('man', x, SODA[1] - 0.6, PI / 2, { y: 1.7, nk: [-1.1, 0, 0], tilt: 0.3, hR: [-(d.shX + 0.1), 0.45 + S(ph * PI * 2) * 0.12, 0.25], hL: [d.shX + 0.1, 0.45 - S(ph * PI * 2) * 0.12, 0.25] });
  }

  at(689.922, (lt, t) => {
    const loom = lt > 6.8;
    const thPose = loom ? Pose.stand('man', SODA[0] - 0.9, SODA[1] - 0.4, PI / 2 + 0.3, { y: 1.7, sp: [0.45, 0, 0], hR: [-0.2, 0.2, 0.55], hL: [0.25, 0.25, 0.5], nk: [-0.2, 0, 0] }) : thugCrawl(lt);
    const th = man('thug', zpose(LG, thPose), { eyewear: 'shades', face: { mouth: 'grin', open: 0.5, eyes: 'half' }, grips: { L: 'open', R: 'open' } });
    const so = sodaSol(t, { face: { eyes: loom ? 'wide' : 'half', mouth: 'o' } });
    let camera;
    if (lt < 2.8) camera = proneCam(th, 0.75, 0.02, 0.35, 56);
    else if (lt < 6.8) camera = zcam(LG, [SODA[0] + 2.2, 2.4, SODA[1] + 2.6], [lerp(-3, SODA[0] - 1, (lt - 2.8) / 4), 1.9, SODA[1] - 0.5], 58);
    else camera = zcam(LG, [SODA[0] + 0.5, 1.95, SODA[1] + 0.9], [SODA[0] - 0.6, 2.5, SODA[1] - 0.4], 70);
    return night(LG, t, { camera, actors: [th, so], props: ledgeProps() });
  });

  at(698.431, (lt, t, dur) => checkShot(5, lt, dur));

  const CR = NZ.corner;

  function engiLights(t, o) {
    const pose = Pose.stand('engineer', -3.5, -1.5, PI / 2 + 0.5, Object.assign({ hR: [-0.25, 0.35, 0.35] }, o || {}));
    return { cls: 'engineer', team: 'blu', pose: zpose(CR, pose), hat: 'hardlights', eyewear: 'shades', itemR: 'wrench', grips: { R: 'grip' }, face: talk(t, 1, { mouth: 'teeth' }) };
  }

  const CORNER = [7.5, -2.6];

  function cornerSpy(t) {
    const d = Cast.D.spy;
    const pose = Pose.stand('spy', CORNER[0], CORNER[1], -PI / 2 - 0.4, { hR: [-(d.shX + 0.02), -0.05, -0.05], eR: [-1, 0, -0.5], nk: [0, 0.3, 0], fl: 0.1, liftL: 0.02 });
    return { cls: 'spy', team: 'red', pose: zpose(CR, pose), face: { mouth: 'smirk', eyes: 'half' } };
  }

  function drakeCorner(t, o) {
    const pose = Pose.stand('man', CORNER[0], CORNER[1] + 0.4, -PI / 2 - 0.3, Object.assign({ hL: [0.2, -0.1, 0.0] }, o || {}));
    return man('drake', zpose(CR, pose), { itemR: o && o.aim ? 'pistol' : undefined, grips: { R: o && o.aim ? 'grip' : 'relax' }, face: { eyes: 'half', mouth: 'smirk' } });
  }

  function corner(t, extra) {
    return night(CR, t, Object.assign({ envOver: { ambTop: [0.55, 0.6, 0.72], ambBottom: [0.3, 0.3, 0.36] } }, extra));
  }

  at(699.899, (lt, t) => {
    const en = engiLights(t, { nk: [0, -0.4 + S(lt * 0.7) * 0.2, 0] });
    return corner(t, { camera: zcam(CR, [-6.2, 1.2, 0.6], [-3.2, 2.4, -3.6], 66), actors: [en] });
  });

  at(705.137, (lt, t) => {
    const en = engiLights(t);
    en.pose = zpose(CR, Pose.stand('engineer', CORNER[0] - 2.4, CORNER[1] + 1.6, PI / 2 + 0.6, { hR: [-0.25, 0.35, 0.35] }));
    return corner(t, { camera: zcam(CR, [CORNER[0] - 2.75, 1.5, CORNER[1] + 2.1], [CORNER[0], 1.25, CORNER[1]], 56), actors: [en, cornerSpy(t)], post: { flash: clamp(1 - lt * 1.6, 0, 1) } });
  });

  at(706.072, (lt, t) => {
    const en = engiLights(t);
    en.face = { mouth: 'teeth', brows: 'angry', eyes: 'half' };
    return corner(t, { camera: headCam(en, [0.75, -0.1, 0.5], 50, { look: [0, -0.15, 0] }), actors: [en] });
  });

  at(706.572, (lt, t) => {
    const actors = [];
    const props = [];
    if (lt < 2.6) actors.push(cornerSpy(t));
    else props.push({ kind: 'knife', at: zp(CR, CORNER[0] - 0.3, 0.03, CORNER[1] + 0.4), yaw: 0.6, roll: PI / 2 });
    if (lt > 3.2) actors.push(drakeCorner(t));
    return corner(t, {
      camera: zcam(CR, [CORNER[0] - 1.5, 1.25, CORNER[1] + 1.5], [CORNER[0], 1.15, CORNER[1]], 56),
      actors,
      props,
      post: { flash: clamp(1 - Math.abs(lt - 2.6) * 6, 0, 1) }
    });
  });

  at(711.01, (lt, t) => {
    const en = engiLights(t);
    en.face = { mouth: 'grin', open: 0.5, eyes: 'half' };
    return corner(t, { camera: headCam(en, [0.85, -0.15, 0.4], 54, { look: [0, -0.2, 0] }), actors: [en] });
  });

  at(712.011, (lt, t) => {
    const en = engiLights(t, { hR: [-0.25, 0.1, 0.3] });
    en.pose = zpose(CR, Pose.stand('engineer', 5.4, -1.0, PI / 2, { hR: [-0.25, 0.1, 0.3] }));
    const aim = lt > 2.2;
    const dr = drakeCorner(t, aim ? { aim: true, hR: [-0.05, 0.42, 0.55] } : {});
    return corner(t, { camera: zcam(CR, [5.0, 1.3, 0.2], [6.5, 1.25, -1.8], 56), actors: [en, dr] });
  });

  const PILE_LAIR = (() => {
    const g = rand(71);
    const kinds = ['heavy', 'scout', 'soldier', 'pyro', 'demo', 'medic', 'engineer', 'sniper', 'spy', 'scout', 'soldier', 'heavy'];
    return kinds.map((cls, i) => ({ cls, team: i % 2 ? 'blu' : 'red', x: PEN[0] - 2.2 + g() * 4.4, z: PEN[2] - 1.8 + g() * 3.6, yaw: g() * PI * 2, sup: g() < 0.5 }));
  })();

  function penPile() {
    return PILE_LAIR.map(p => ({ cls: p.cls, team: p.team, pose: p.sup ? Pose.supine(p.cls, p.x, p.z, p.yaw, {}) : Pose.prone(p.cls, p.x, p.z, p.yaw, {}), face: { eyes: 'shut' } }));
  }

  at(715.047, (lt, t) => {
    const items = [[0, 6], [0.868, 7], [1.569, 8], [2.67, 9], [3.37, 10]];
    let idx = 6, t0 = 0, t1 = 0.868;
    items.forEach(([s, i], j) => {
      if (lt >= s) {
        idx = i;
        t0 = s;
        t1 = j < items.length - 1 ? items[j + 1][0] : 4.95;
      }
    });
    const u = idx + clamp((lt - t0) / (t1 - t0), 0, 0.999);
    const mix = ramp(lt, 3.5, 3.9) - ramp(lt, 4.35, 4.7) * 0.6;
    if (lt < 3.5) return { set: null, bg: [0.96, 0.96, 0.94], cards: [{ live: 'checklist', u }] };
    return lair(t, {
      camera: cam([PEN[0] - 3.0, 3.4, PEN[2] + 3.2], [PEN[0] + 0.2, 0.3, PEN[2] - 0.2], 60),
      actors: penPile(),
      cards: [{ live: 'checklist', u, alpha: clamp(1 - mix, 0.001, 0.999) }]
    });
  });

  SHOTS.sort((a, b) => a[0] - b[0]);

  window.FabScript3 = { FROM: 480, TO: 720, SHOTS, penPile, lair, checkShot, moonShot, night, sky, faceCam, proneCam, man, hooded, sil, lerp3, zp, zcam, zpose, ramp, bluSoldier };
})();
