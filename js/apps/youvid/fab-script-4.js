(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Pose = window.FabPose;
  const Cast = window.FabCast;
  const A = window.FabScript1;
  const B = window.FabScript3;
  const { cam, talk, armed } = A;
  const { penPile, lair, checkShot, night, faceCam, proneCam, man, hooded, sil, lerp3, zp, zcam, zpose, ramp } = B;
  const World = window.FabWorld;
  const NZ = World.NZ, LZ = World.LZ, ZONES = World.ZONES;

  const SHOTS = [];
  const at = (t0, fn) => SHOTS.push([t0, fn]);

  const SEPIA = { grade: [1.25, 0.95, 0.6, 1], colorAdd: [0.04, 0.02, -0.02], vignette: 0.9, grain: 0.05 };
  const TEAL = { grade: [0.62, 1.1, 1.15, 0.65], colorAdd: [0.0, 0.04, 0.06], vignette: 0.7 };
  const BLUE = { grade: [0.5, 0.68, 1.5, 0.8], colorAdd: [0.0, 0.02, 0.1], vignette: 0.8 };
  const BLUE_HERO = { tint: [0.35, 0.45, 1.6] };
  const NORMAL = { vignette: 0.4 };
  const MOONY = { grade: [0.85, 0.85, 1.25, 0.3], vignette: 0.6 };

  function hero(pose, o) {
    return Object.assign({ cls: 'engineer', team: 'blu', hat: 'cowboy', robot: true, grips: { L: 'relax', R: 'relax' }, face: { mouth: 'shut', brows: 'angry', beard: true }, pose }, o || {});
  }

  function pulse(lt, list, w) {
    return clamp(list.reduce((a, p) => a + clamp(1 - Math.abs(lt - p) * (w || 10), 0, 1), 0), 0, 1);
  }

  function beamM(p, d, len, wid) {
    const y = V3.norm(V3.mul(d, -1));
    let x = V3.cross(y, [0, 0, 1]);
    if (V3.len(x) < 1e-3) x = [1, 0, 0];
    x = V3.norm(x);
    const z = V3.cross(x, y);
    const sy = len / 7;
    return new Float32Array([x[0] * wid, x[1] * wid, x[2] * wid, 0, y[0] * sy, y[1] * sy, y[2] * sy, 0, z[0] * wid, z[1] * wid, z[2] * wid, 0, p[0], p[1], p[2], 1]);
  }

  function moon(c, R, yaw, t, o) {
    const opts = o || {};
    const M = M4.chain(M4.translate(c[0], c[1], c[2]), M4.rotY(yaw), M4.rotX(opts.pitch || 0), M4.scale(R, R, R));
    const props = [{ kind: 'moon', tex: 'moonFace', M, opts: { noFog: true } }];
    const eyes = [[-0.64, 0.25, 0.73], [0.62, 0.19, 0.75]];
    const fx = eyes.map((e, i) => ({ kind: 'glow', p: M4.point(M, V3.mul(e, 1.02)), s: R * (i ? 0.16 : 0.2), col: [1, 0.45, 0.15], alpha: 0.75 }));
    if (opts.ring) fx.unshift({ kind: 'sprite', tex: 'moonRing', p: M4.point(M, [0, 0, -0.3]), s: R * 3.6, additive: true, alpha: 0.9, spin: t * 0.2 });
    if (opts.beams) eyes.forEach(e => {
      const p = M4.point(M, V3.mul(e, 1.02));
      const d = V3.norm(V3.sub(p, c));
      props.push({ kind: 'lightCone', M: beamM(p, d, R * 6, R * 0.25), opts: { additive: true, alpha: 0.16 * opts.beams } });
    });
    return { props, fx };
  }

  function withMoon(st, m) {
    st.props = (st.props || []).concat(m.props);
    st.fx = (st.fx || []).concat(m.fx);
    return st;
  }

  const PEN = LZ.pen;

  at(720, (lt, t) => {
    const items = [[0, 10], [0.12, 11], [1.1, 12], [2.1, 13], [3.9, 14], [5.0, 15]];
    let idx = 10, t0 = 0, t1 = 0.12;
    items.forEach(([s, i], j) => {
      if (lt >= s) {
        idx = i;
        t0 = s;
        t1 = j < items.length - 1 ? items[j + 1][0] : 6.69;
      }
    });
    return lair(t, {
      camera: cam([PEN[0] - 3.0, 3.4, PEN[2] + 3.2], [PEN[0] + 0.2, 0.3, PEN[2] - 0.2], 60),
      actors: penPile(),
      cards: [{ live: 'checklist', u: idx + clamp((lt - t0) / (t1 - t0), 0, 0.999), alpha: 0.62 }]
    });
  });

  at(726.692, (lt, t) => {
    const iris = lt > 0.6;
    return lair(t, {
      camera: cam([PEN[0] - 3.0 + lt * 0.1, 3.4, PEN[2] + 3.2], [PEN[0] + 0.2, 0.3, PEN[2] - 0.2], iris ? 48 : 60),
      actors: penPile(),
      cards: iris ? [{ tex: 'iris' }] : []
    });
  });

  const WS = NZ.workshop;

  function heroRig(t, o) {
    const pose = Pose.stand('engineer', 1.0, -1.4, PI, Object.assign({ hR: [-0.12, 0.42, 0.32], hL: [0.14, 0.42, 0.32], nk: [0.05, 0, 0] }, o || {}));
    return hero(zpose(WS, pose), { grips: { L: 'grip', R: 'grip' } });
  }

  function workshop(t, extra) {
    return night(WS, t, Object.assign({ envOver: { points: [{ pos: zp(WS, 2.1, 1.6, -2.4), color: [1.4, 1.15, 0.75] }], ambTop: [0.28, 0.32, 0.3] }, vignette: 0.6 }, extra));
  }

  function wsProps(h) {
    const m = Cast.solve('engineer', h.pose);
    const eye = m.pts.head;
    return [
      { kind: 'deskLamp', at: zp(WS, 2.0, 0.95, -2.5), yaw: -0.4, s: 1.2 },
      { kind: 'sentry3', at: zp(WS, -2.4, 0, -2.6), yaw: 0.6, s: 1.3 },
      { kind: 'camera', M: M4.chain(M4.translate(eye[0] + 0.17, eye[1] - 0.02, eye[2] - 0.25), M4.rotY(PI), M4.scale(2.0, 2.0, 2.0)) }
    ];
  }

  at(728.4, (lt, t) => {
    const h = heroRig(t);
    return workshop(t, { camera: faceCam(h, 0.9, 0.0, 0.25, 44, { lu: -0.03, ls: 0.08 }), actors: [h], props: wsProps(h) });
  });

  at(730.5, (lt, t) => {
    const h = heroRig(t, { hR: [-0.25, -0.2, 0.1], hL: [0.25, -0.2, 0.1] });
    return workshop(t, { camera: faceCam(h, 0.6, 0.0, -0.15, 46, { lu: -0.04 }), actors: [h], props: wsProps(h).slice(0, 2) });
  });

  at(732.6, (lt, t) => {
    const h = heroRig(t, { hR: [-0.25, -0.2, 0.1], hL: [0.25, -0.2, 0.1] });
    const photo = lt < 1.6 ? 'photoKill' : 'photoHeavy';
    const k = lt < 1.6 ? ramp(lt, 0, 0.3) : ramp(lt, 1.6, 1.9);
    return workshop(t, {
      camera: faceCam(h, 0.7, 0.05, 0.0, 46, { lu: -0.02 }),
      actors: [h],
      props: wsProps(h).slice(0, 2),
      cards: [{ tex: photo, x: 220 + lt * 6, y: 110, w: 520, h: 390, rot: lt < 1.6 ? -0.03 : 0.12, alpha: 0.35 + 0.5 * k }, { tex: 'fireFlicker', additive: true, alpha: 0.28 * ramp(lt, 1.4, 2.2) }]
    });
  });

  at(736.335, (lt) => ({ set: null, bg: [0.02, 0.01, 0.0], cards: [{ tex: 'fireFlicker', additive: true, alpha: 0.5 }, { tex: 'glitch', additive: true, alpha: 0.25 * ramp(lt, 1.4, 2.0) }] }));

  const HALL = [0, 0, 0];

  function helmeted(cls, x, z, yaw, o) {
    const opts = o || {};
    const pose = opts.sit ? Pose.sitFloor(cls, x, z, yaw, {}) : Pose.stand(cls, x, z, yaw, { nk: opts.nk || [0.05, 0, 0] });
    return { cls, team: opts.team || 'red', hat: 'ctlHelmet', pose, face: { eyes: 'half', mouth: opts.mouth || 'shut', open: opts.open || 0 } };
  }

  at(738.5, (lt, t) => {
    const a = helmeted('heavy', -6, 3, PI / 2 + 0.3, {});
    return lair(t, {
      camera: faceCam(a, 0.3, 0.0, -0.5, 44, { ls: 0.02 }),
      actors: [a],
      cards: [{ tex: 'glitch', additive: true, alpha: 0.18 + 0.12 * S(lt * 9) }],
      vignette: 0.7
    });
  });

  at(741.574, (lt, t) => {
    const a = helmeted('heavy', -6, 3, PI / 2, {});
    const b = helmeted('heavy', -4.8, 3.3, PI / 2, {});
    return lair(t, { camera: cam([-3.9, 1.85, 3.7], [-6.2, 1.7, 3.0], 42), actors: [a, b], cards: [{ tex: 'glitch', additive: true, alpha: 0.12 }] });
  });

  const PRESS = [-2, 1];

  function pressHeavy(t, k) {
    const pose = Pose.sitFloor('heavy', PRESS[0], PRESS[1], 0.4, { nk: [-0.25 * k, 0, 0], hR: [-0.4, 0.0, 0.25], hL: [0.4, 0.0, 0.25] });
    return { cls: 'heavy', team: 'blu', hat: 'fedoraPress', pose, face: { eyes: k > 0.5 ? 'wide' : 'half', brows: k > 0.5 ? 'up' : 'flat', mouth: k > 0.5 ? 'o' : 'shut' } };
  }

  function robot(lt) {
    const y = lerp(7.2, 3.0, ease(clamp((lt - 2.4) / 4.6, 0, 1)));
    const p = [PRESS[0] + 0.4, y, PRESS[1] + 0.6];
    const M = M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(-2.4), M4.scale(1.4, 1.4, 1.4));
    return { M, p };
  }

  at(744.543, (lt, t) => {
    const hv = pressHeavy(t, ramp(lt, 2.5, 4));
    const rb = robot(lt);
    const k = clamp((lt - 7.0) / 1.2, 0, 1);
    const helmetM = M4.chain(M4.translate(rb.p[0] - 0.1 * (1 - k), rb.p[1] - 1.2 - k * 0.4, rb.p[2] - 0.2), M4.rotY(0.4), M4.scale(1.1, 1.1, 1.1));
    const props = [{ kind: 'robotSpider', tex: 'caution', M: rb.M }, { kind: 'ctlHelmet', M: helmetM }];
    if (k >= 1) {
      hv.hat = 'ctlHelmet';
      props.pop();
    }
    const camEye = lt < 2.6 ? [PRESS[0] + 0.9, 1.3, PRESS[1] + 1.6] : [PRESS[0] + 1.8, 1.0, PRESS[1] + 2.8];
    return lair(t, { camera: cam(camEye, [PRESS[0] + 0.2, lt < 2.6 ? 1.0 : 1.8, PRESS[1]], 56), actors: [hv], props });
  });

  at(753.3, (lt, t) => {
    const hv = { cls: 'heavy', team: 'blu', hat: 'ctlHelmet', pose: Pose.prone('heavy', PRESS[0], PRESS[1], 1.2, { nk: [-0.5, 0, 0], tilt: 0.2 }), face: { eyes: 'shut' } };
    return lair(t, { camera: proneCam(hv, 0.7, -0.08, 0.3, 50), actors: [hv], props: [{ kind: 'fedora', at: [PRESS[0] - 0.6, 0.02, PRESS[1] + 0.9], yaw: 0.8, roll: 0.3 }] });
  });

  at(754.186, (lt, t) => {
    const k = ramp(lt, 0.2, 1.4);
    return lair(t, { camera: cam([1, 1.6, 6], [2, 0.4, 1], 60), actors: [], post: { flash: 1 - k } });
  });

  const ROWS = (() => {
    const g = rand(5);
    const list = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) list.push({ cls: g() < 0.6 ? 'heavy' : ['soldier', 'demo', 'pyro'][Math.floor(g() * 3)], x: -8 + j * 1.5, z: -4 + i * 1.5, sit: true });
    return list;
  })();

  function rows() {
    return ROWS.map(r => helmeted(r.cls, r.x, r.z, 0, { sit: true }));
  }

  at(755.688, (lt, t) => {
    const lying = { cls: 'heavy', team: 'red', hat: 'ctlHelmet', pose: Pose.prone('heavy', 2.5, 2.0, -0.6, {}), face: { eyes: 'shut' } };
    const sitters = [helmeted('heavy', 4.2, 1.0, -1.2, { sit: true }), helmeted('heavy', 3.6, 3.4, -2.0, { sit: true })];
    const k = ease(clamp(lt / 6, 0, 1));
    return lair(t, {
      camera: cam(lerp3([0.5, 1.5, 5.5], [5.5, 1.5, 4.2], k), lerp3([2.4, 0.4, 1.6], [3.6, 1.2, 2.0], k), 56),
      actors: [lying].concat(sitters),
      props: [{ kind: 'whiteboard', tex: 'doodle', at: [6, 2.2, -4], yaw: -0.6, s: 1.4 }]
    });
  });

  at(761.727, (lt, t) => {
    const a = helmeted('heavy', -1, 2, 0.4, {});
    if (lt < 1.5) return lair(t, { camera: cam([-6.5, 1.6, 6], [-6.5, 1.2, 1], 50), actors: [], cards: [{ tex: 'impHand', x: -60 + lt * 20, y: 0, w: 1020, h: 573 }] });
    if (lt < 3.3) return lair(t, { camera: cam([-9.5, 1.7, 3], [-2, 1.0, -1.5], 52), actors: rows() });
    if (lt < 4.5) return lair(t, { camera: faceCam(a, 0.6, 0.0, 0.0, 44), actors: [a] });
    return lair(t, { camera: cam([-6.5, 1.6, 6], [-6.5, 1.2, 1], 50), actors: [], cards: [{ tex: 'impSnarl', x: 140, y: 30, w: 520, h: 520 }] });
  });

  at(767.366, (lt, t) => {
    const a = helmeted('heavy', 0.6, 2.0, -0.8, {});
    const hearts = lt > 2.25;
    return lair(t, {
      camera: cam([-0.6, 1.75, 4.2], [0.6, 1.7, 2.0], 50),
      actors: [a],
      cards: [{ tex: hearts ? 'impHearts' : 'impBulge', x: 60 + S(lt * 8) * (hearts ? 0 : 6), y: 50, w: 480, h: 480 }],
      fx: []
    });
  });

  const CO = NZ.cones;

  at(771.937, (lt, t) => {
    const h = hero(zpose(CO, Pose.stand('engineer', 0, 8, PI, {})), { face: { brows: 'angry', mouth: 'frown', beard: true } });
    return night(CO, t, Object.assign({ camera: faceCam(h, 0.32, 0.0, 0.0, 44), actors: [h], cards: [{ tex: 'scratches', alpha: 0.6 }] }, SEPIA));
  });

  at(773.172, (lt) => ({ set: null, bg: [0.96, 0.95, 0.92], post: { flash: pulse(lt, [0.1, 0.4, 0.7, 1.0, 1.3, 1.7, 2.0, 2.3], 6) * 0.3 } }));

  at(775.708, (lt, t) => {
    const h = hero(zpose(CO, Pose.stand('engineer', 2, 6, 2.6, { hR: [-0.2, 0.2, 0.35] })), { gun: 'guitar', itemR: 'walkie', grips: { R: 'grip', L: 'grip' } });
    return night(CO, t, Object.assign({ camera: zcam(CO, [2.25, 2.7, 6.3], [2, 0, 6], 60, { roll: 0.3 }), actors: [armed(h)], post: { flash: clamp(0.85 - lt * 0.6, 0, 1) } }, SEPIA));
  });

  at(776.9, (lt, t) => night(CO, t, Object.assign({ camera: zcam(CO, [3, 1.2, 9], [2, 0.8, 2], 56), props: [{ kind: 'sentry3', at: zp(CO, 2, 0, 4), yaw: 0.4, s: 1.4 }], post: { flash: 0.55 } }, SEPIA)));

  at(777.6, (lt, t) => {
    const victim = { cls: 'engineer', team: 'blu', pose: zpose(CO, Pose.run('engineer', 3 + lt * 1.5, 6.5, PI / 2, lt * 2, {})), face: { mouth: 'o' } };
    const muzzle = zp(CO, 0.6, 0.8, 4);
    return night(CO, t, Object.assign({
      camera: zcam(CO, [2.2, 4.2, 6.2], [2.2, 0, 5.2], 60, { roll: -0.4 }),
      actors: [victim],
      props: [{ kind: 'sentry3', at: zp(CO, 0.4, 0, 4), yaw: 1.2, s: 1.4 }],
      fx: [{ kind: 'tracer', a: muzzle, b: zp(CO, 3 + lt * 1.5, 1.2, 6.5), u: lt }, { kind: 'smoke', p: zp(CO, 0.5, 1.5, 4), s: 0.6, u: lt, dur: 1.5, col: [0.6, 0.6, 0.6] }]
    }, TEAL));
  });

  at(778.3, (lt, t) => {
    const h = hero(zpose(NZ.poster, Pose.stand('engineer', 0, -2, 0.3, { hR: [-0.1, 0.25, 0.5] })), { itemR: 'blaster', grips: { R: 'grip' } });
    const m = Cast.solve('engineer', h.pose);
    return night(NZ.poster, t, Object.assign({ camera: faceCam(h, 1.0, 0.1, -0.5, 60, { chest: true }), actors: [h], fx: [{ kind: 'muzzle', p: M4.point(m.handR, [0, 0, 0.45]), u: lt, s: 0.4 }] }, TEAL));
  });

  at(779.2, (lt, t) => {
    const k = lt * 4;
    const pose = Pose.airborne('engineer', zp(NZ.poster, -1, 1.2, -1), [S(k), C(k), 0.2], [0, -0.2, 1], {});
    return night(NZ.poster, t, Object.assign({ camera: zcam(NZ.poster, [-1, 3.2, -1.3], [-1, 0, -1], 60, { roll: lt * 2 }), actors: [hero(pose, { face: { mouth: 'scream', open: 1 } })] }, TEAL));
  });

  at(779.9, (lt, t) => withMoon(night(CO, t, Object.assign({ camera: zcam(CO, [0, 1.2, 12], [8, 18, -30], 60) }, MOONY)), moon(zp(CO, 14, 30, -60), 22, -0.2, t, { ring: true })));

  at(781.5, (lt, t) => {
    const h = hero(zpose(CO, Pose.stand('engineer', 1, 7, PI + 0.3, { nk: [-0.2, 0, 0] })), {});
    return night(CO, t, Object.assign({ camera: faceCam(h, 0.6, -0.1, 0.3, 50, { chest: true, lu: 0.25 }), actors: [h] }, TEAL));
  });

  at(782.6, (lt, t) => {
    const L = NZ.ledge;
    const a = helmeted('heavy', -2.5, 4, 0.3, { mouth: 'scream', open: 1 });
    a.pose = zpose(L, a.pose);
    const march = [0, 1, 2, 3].map(i => ({ cls: ['soldier', 'heavy', 'demo', 'soldier'][i], team: 'red', pose: zpose(L, Pose.run(['soldier', 'heavy', 'demo', 'soldier'][i], -6 + i * 1.1 + lt, 2.6, PI / 2, lt * 1.6 + i * 0.25, { stride: 0.2 })) }));
    return night(L, t, Object.assign({ camera: faceCam(a, 0.55, 0.0, 0.35, 60, { ls: -0.65 }), actors: [a].concat(march), post: { flash: pulse(lt, [0.8], 6) } }, TEAL));
  });

  at(783.4, (lt) => ({ set: null, bg: [0.95, 0.96, 1.0], post: { flash: pulse(lt, [0.0, 0.3], 6) } }));

  at(784.65, (lt) => ({ set: null, bg: [0, 0, 0], cards: [{ tex: 'bulletHole' }, { tex: 'glitch', additive: true, alpha: 0.2 }] }));

  at(785.6, (lt, t) => {
    const p = zp(CO, 2, 9 - lt * 3, 4);
    const pose = Pose.airborne('engineer', p, [S(lt * 3), C(lt * 3), 0.3], [0, -0.3, 1], { hR: [-0.5, 0.4, 0.2], hL: [0.5, 0.3, 0.2] });
    const fx = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * PI * 2;
      fx.push({ kind: 'fire', p: V3.add(p, [C(a) * 2.2, -1.2 + S(a) * 0.4, S(a) * 2.2]), w: 0.6, d: 0.6, h: 1.4, s: 1.2, u: lt + i * 0.1, n: 8 });
    }
    return night(CO, t, { camera: cam(V3.add(p, [0.5, 4.2, 2.5]), p, 62), actors: [hero(pose, { face: { mouth: 'scream', open: 1 } })], fx, colorAdd: [0.1, 0.03, 0] });
  });

  at(787.0, (lt, t) => {
    const p = zp(CO, 2 + lt * 2, 12 - lt * 2, 6);
    const pose = Pose.airborne('engineer', p, [0.6, 0.6, 0.3], [0, -0.6, 0.6], { hR: [-0.55, 0.35, 0.1], hL: [0.55, 0.35, 0.1] });
    return night(CO, t, { camera: cam(V3.add(p, [-3, -0.5, 3]), p, 58), actors: [hero(pose, {})], post: { flash: pulse(lt, [1.5], 4) * 0.8 } });
  });

  at(788.9, (lt, t) => {
    const h = hero(zpose(CO, Pose.stand('engineer', 0, 10, 0, { nk: [0.1, 0, 0] })), { face: { brows: 'angry', mouth: 'frown', beard: true } });
    const st = night(CO, t, Object.assign({ camera: faceCam(h, 1.3, 0.05, 0, 50, { chest: true, lu: 0.25 }), actors: [h] }, MOONY));
    return withMoon(st, moon(zp(CO, 0, 4, -2), 4.5, PI * 0.0, t, { ring: true }));
  });

  at(790.0, (lt, t) => {
    const L = NZ.ledge;
    const so = { cls: 'soldier', team: 'red', hat: 'ctlHelmet', pose: zpose(L, Pose.airborne('soldier', [2, 2.2 - lt, -1.5], [0.5, 0.5, 0.2], [0, -0.4, 1], {})), shadow: false };
    return night(L, t, { camera: zcam(L, [3.6, 2.2, 1.6], [2, 1.9, -1.5], 58), actors: [so], fx: [{ kind: 'blood', p: zp(L, 2, 2.4, -1.5), u: lt, n: 30, s: 1.6, size: 0.18 }] });
  });

  function lineup(t, o) {
    return [['heavy', -1.2], ['sniper', 0], ['soldier', 1.2]].map(([cls, x]) => ({ cls, team: 'blu', pose: Pose.stand(cls, x, -1.5, 0, {}), face: { eyes: 'half', mouth: 'shut' } }));
  }

  function bluRoom(t, extra) {
    return Object.assign({ set: 'bluLock', env: 'bluLock' }, extra);
  }

  at(791.0, (lt, t) => bluRoom(t, { camera: cam([0.3, 1.5, 2.8], [0, 1.3, -1.5], 54), actors: lineup(t), props: [{ kind: 'towelRack', at: [6.9, 0, -2.6], yaw: -PI / 2 }] }));

  at(792.224, (lt, t) => {
    const h = hero(zpose(NZ.poster, Pose.stand('engineer', 1, 0, 0, { hR: [-0.1, 0.42, 0.62] })), { itemR: 'revolver', grips: { R: 'grip' }, face: { mouth: 'grin', open: 0.5, beard: true }, drawOpts: BLUE_HERO });
    return night(NZ.poster, t, Object.assign({ camera: faceCam(h, 0.62, 0.0, -0.25, 60, { lu: -0.1, ls: -0.08 }), actors: [h] }, NORMAL));
  });

  at(794.06, (lt, t) => {
    const L = NZ.ledge;
    const dead = { cls: 'soldier', team: 'red', hat: 'ctlHelmet', pose: zpose(L, Pose.supine('soldier', 1, 0, 1.2, { y: 1.7 })), face: { eyes: 'shut' } };
    return night(L, t, Object.assign({ camera: zcam(L, [4, 2.6, 3.5], [1, 1.8, -1], 58), actors: [dead], fx: [{ kind: 'boom', p: zp(L, 2.2, 2.2, -1.2), s: 2.4, u: lt, dur: 1.2 }], post: { flash: clamp(0.6 - lt, 0, 1) } }, NORMAL));
  });

  at(795.628, (lt, t) => bluRoom(t, { camera: cam([0.3, 1.5, 2.8], [0, 1.3, -1.5], 54), actors: lineup(t), props: [{ kind: 'towelRack', at: [6.9, 0, -2.6], yaw: -PI / 2 }] }));

  at(797.196, (lt, t) => {
    const O = NZ.poster;
    const g = rand(3);
    const mercs = [0, 1, 2, 3].map(i => helmeted(['heavy', 'soldier', 'heavy', 'demo'][i], 4.2 + i * 0.5, -1.5 + g() * 3, -PI / 2, {}));
    mercs.forEach((m, i) => { m.pose = zpose(O, Pose.stand(m.cls, 4.2 + i * 0.5, -1.5 + i * 0.8, -PI / 2, { y: 0.3 + i * 0.6 })); });
    const handM = M4.chain(M4.translate(O[0] + 0.4, 1.35, O[2] + 3.6), M4.rotY(PI * 0.82), M4.rotX(-0.1));
    return night(O, t, Object.assign({
      camera: zcam(O, [0.2, 1.6, 4.2], [5, 1.6, -0.5], 62, { shake: 0.04, shakeT: lt * 30 }),
      actors: mercs,
      props: [{ kind: 'revolver', M: M4.chain(handM, M4.scale(1.5, 1.5, 1.5)) }],
      fx: [{ kind: 'muzzle', p: M4.point(handM, [0, 0.05, 0.5]), u: lt, s: 0.4 }, { kind: 'tracer', a: M4.point(handM, [0, 0.05, 0.5]), b: zp(O, 5, 1.5, -0.5), u: lt }]
    }, NORMAL));
  });

  const PO = NZ.poster;

  at(799.165, (lt, t) => {
    const point = lt > 1.6;
    const wound = lt > 3.2;
    const pose = Pose.crouch('man', -1.5, -2.6, 0.2, { depth: 0.3, hR: point ? [-0.35, 0.3, 0.45] : [-0.25, -0.2, 0.1] });
    const ho = hooded(zpose(PO, pose), { face: wound ? { eyes: 'half', mouth: 'open', open: 0.4 } : point ? talk(t, 1.2, { brows: 'up' }) : { mouth: 'o', eyes: 'crazy' }, grips: { R: point ? 'point' : 'relax' } });
    const st = night(PO, t, Object.assign({ camera: faceCam(ho, 1.05, 0.3, -0.25, 54, { chest: true, ls: 0.15, lu: 0.2 }), actors: lt < 4.4 ? [ho] : [] }, NORMAL));
    if (wound && lt < 4.4) {
      const m = Cast.solve('man', ho.pose);
      st.fx = st.fx.concat([{ kind: 'blood', p: V3.add(m.pts.head, [0, 0.08, 0]), u: lt - 3.2, n: 10, s: 0.4 }]);
    }
    return st;
  });

  at(804.3, (lt, t) => {
    const p = zp(CO, -2 + lt * 3, 12, 2);
    const pose = Pose.airborne('engineer', p, [0, 0.2, 1], [0, -1, 0.1], { hR: [-0.7, 0.2, 0.1], hL: [0.7, 0.2, 0.1] });
    const h = hero(pose, { itemR: 'revolver', grips: { R: 'grip' }, drawOpts: BLUE_HERO });
    const m = Cast.solve('engineer', pose);
    return night(CO, t, Object.assign({
      camera: cam(V3.add(p, [-0.8, 0.5, 1.7]), V3.add(p, [0.4, 0, 0]), 58),
      actors: [h],
      fx: [{ kind: 'sprite', tex: 'skyHeadB', p: V3.add(p, [-2.6 + lt * 0.4, 1.2, -1]), s: 1.4 }, { kind: 'muzzle', p: M4.point(m.handR, [0, 0, 0.4]), u: lt, s: lt > 1.6 && lt < 1.8 ? 0.6 : 0.001 }],
      props: [{ kind: 'cask', at: V3.add(p, [1.4 - lt * 0.3, -0.8, -0.5]), roll: 1.2, s: 0.5 }]
    }, NORMAL));
  });

  at(807.0, (lt, t) => night(PO, t, Object.assign({
    camera: zcam(PO, [4, 1.3, 3.5], [0.5, 1.8, -4], 60, { shake: clamp(0.1 - lt * 0.05, 0, 0.1), shakeT: lt * 30 }),
    fx: [{ kind: 'boom', p: zp(PO, 1.0, 1.0, -2.5), s: 3.6, u: lt, dur: 1.4 }]
  }, NORMAL)));

  const BE = NZ.bluExt;

  at(808.6, (lt, t) => {
    const pose = Pose.stand('man', 3.2, -3.4, PI + 0.1, { hR: [-0.05, 0.3, 0.45], hL: [0.1, 0.25, 0.4] });
    const sm = man('sam', zpose(BE, pose), { hat: 'nvgDown', grips: { R: 'grip', L: 'grip' } });
    return night(BE, t, Object.assign({
      camera: zcam(BE, [-0.4, 1.5, -1.7], [4.5, 1.3, -3.7], 54),
      actors: [sm],
      props: [{ kind: 'cone', at: zp(BE, 6.5, 0, 0), s: 1.3 }, { kind: 'cone', at: zp(BE, 8.4, 0, -1.4), s: 1.3 }],
      fx: [{ kind: 'sparks', p: zp(BE, 3.2, 1.4, -3.9), u: lt, n: 14 }, { kind: 'glow', p: zp(BE, 3.2, 1.4, -3.9), s: 0.4, col: [1, 0.85, 0.5], alpha: 0.7 }]
    }, NORMAL));
  });

  at(812.8, (lt, t) => {
    const k = clamp(lt / 0.6, 0, 1);
    const sm = man('sam', zpose(BE, Pose.airborne('man', [3.4 + k * 0.6, 0.5 + (1 - k) * 0.6, -3.0 + k * 0.5], [0.2, 0.7, 0.3], [0, -0.4, 1], {})), { hat: 'nvgDown', shadow: false });
    const at2 = { cls: 'scout', team: 'blu', pose: zpose(BE, Pose.airborne('scout', [3.0 + k * 1.2, 0.6, -2.4 + k * 0.4], [0.3, 0.5, 0.3], [0, -0.5, 1], {})), face: { mouth: 'scream', open: 1 }, shadow: false };
    return night(BE, t, Object.assign({ camera: zcam(BE, [-0.4, 1.4, -1.6], [4.0, 0.8, -3.2], 54, { shake: 0.04, shakeT: lt * 20 }), actors: [sm, at2] }, NORMAL));
  });

  at(814.547, (lt, t) => {
    const hv = { cls: 'heavy', team: 'blu', pose: zpose(BE, Pose.stand('heavy', -6, -3.2, 0, { hR: [-0.1, 0.62, 0.15], hL: [0.12, 0.6, 0.12], nk: [0.25, 0, 0] })), face: { eyes: 'shut', brows: 'sad', mouth: 'frown' }, grips: { L: 'open', R: 'open' } };
    return night(BE, t, { camera: zcam(BE, [-5.4, 0.6, -2.3], [-6, 2.0, -3.3], 70), actors: [hv] });
  });

  const SEAT = [[-4.4, 0.2, 0.5], [-3.0, -0.6, 0.2], [-1.5, 0.4, -0.3], [-4.9, 1.8, 0.8], [0.2, -0.4, -0.6]];

  function seated(t, extra) {
    const list = SEAT.map(([x, z, yaw], i) => ({ cls: 'engineer', team: 'blu', eyewear: 'shades', pose: Pose.sitFloor('engineer', x, z, yaw, {}), face: { eyes: 'half', mouth: 'shut' } }));
    const medic = { cls: 'medic', team: 'blu', pose: Pose.prone('medic', 2.2, 1.4, -0.4, { nk: [-1.0, 0, 0], tilt: 0.35, hR: [-0.12, 0.45, 0.3], hL: [0.12, 0.45, 0.3] }), face: { eyes: 'half' } };
    return list.concat([medic]).concat(extra || []);
  }

  function laptopProp() {
    return { kind: 'laptop', tex: 'laptopScreen', at: [2.75, 0, 0.95], yaw: PI - 0.4 };
  }

  at(815.948, (lt, t) => bluRoom(t, { camera: cam([3.6, 1.6, 3.6], [-1.5, 0.4, -0.6], 58), actors: seated(t), props: [laptopProp(), { kind: 'guitar', at: [-3.4, 1.55, -5.3], roll: 0.15 }] }));

  at(818.751, (lt, t) => {
    if (lt < 3.3) {
      const st = night(CO, t, Object.assign({ camera: cam(zp(CO, -2.4, 9.6, 6.5), zp(CO, -3.6, 9.4, -1.4), 34 - lt * 2) }, MOONY));
      return withMoon(st, moon(zp(CO, 0, 8, -6), 6, 0.0, t, { ring: true }));
    }
    const k = ramp(lt, 3.3, 4.2);
    return bluRoom(t, { camera: cam([-0.6, 0.7, 1.2], [-4, 0.7, -0.8], 60), actors: seated(t), props: [laptopProp(), { kind: 'guitar', at: [-3.4, 1.55, -5.3], roll: 0.15 }], post: { flash: (1 - k) * 0.5 } });
  });

  at(825.4, (lt, t) => {
    const md = { cls: 'medic', team: 'blu', pose: Pose.crouch('medic', -1.7, 1.1, 1.0, { nk: [0.1, 0.2, 0], depth: 0.5 }), face: { eyes: 'wide', mouth: 'o' } };
    return bluRoom(t, { camera: cam([-0.6, 0.7, 1.2], [-4, 0.7, -0.8], 60), actors: seated(t).concat([md]), props: [laptopProp()] });
  });

  function baldHero(pose, o) {
    return hero(pose, Object.assign({ hat: 'goggles', face: { mouth: 'shut', brows: 'angry', beard: true } }, o || {}));
  }

  at(826.3, (lt, t) => {
    const k = ease(clamp(lt / 1.0, 0, 1));
    const h = baldHero(Pose.blend(Pose.sitFloor('engineer', -2.0, 0.4, 0, {}), Pose.stand('engineer', -2.0, 0.4, 0, {}), k));
    return bluRoom(t, { camera: cam([-2.0, 1.0, 4.5], [-2.0, 1.2, 0], 58), actors: seated(t).concat([h]), post: { flash: 0.6 * S(clamp(lt / 1.1, 0, 1) * PI) } });
  });

  function crowd(t, lift) {
    const g = rand(17);
    const kinds = [['engineer', 'blu'], ['heavy', 'blu'], ['scout', 'blu'], ['soldier', 'blu'], ['engineer', 'blu'], ['medic', 'blu'], ['engineer', 'blu'], ['sniper', 'blu']];
    return kinds.map(([cls, team], i) => {
      const th = -2.3 + (i / (kinds.length - 1)) * 4.6;
      const x = -2.0 + S(th) * 0.95, z = 0.4 - C(th) * 0.95;
      const up = lift ? 0.3 + 0.2 * S(t * 6 + i) : 0;
      const pose = Pose.stand(cls, x, z, Math.atan2(-2.0 - x, 0.4 - z), { nk: [-0.5, 0, 0], hR: [-0.15, 0.6 + up, 0.35], hL: [0.15, 0.6 + up, 0.35] });
      return { cls, team, eyewear: cls === 'engineer' ? 'shades' : undefined, pose, face: { mouth: 'scream', open: 0.6 + 0.4 * S(t * 7 + i), eyes: 'wide' }, grips: { L: 'open', R: 'open' } };
    });
  }

  at(827.393, (lt, t) => {
    const k = ease(clamp((lt - 1.2) / 1.0, 0, 1));
    const p = [-2.0, lerp(1.0, 2.1, k), 0.4];
    const h = baldHero(k > 0 ? Pose.airborne('engineer', p, [0, 0.4, -1], [0, 1, 0], { hR: [-0.7, 0.25, 0.0], hL: [0.7, 0.25, 0.0] }) : Pose.stand('engineer', -2.0, 0.4, 0, { hR: [-0.6, 0.35, 0.1], hL: [0.6, 0.35, 0.1] }), { grips: { L: 'open', R: 'open' } });
    return bluRoom(t, { camera: cam([-2.0, 0.85, 1.75], [-2.0, 1.95, 0.2], 72), actors: crowd(t, k > 0).concat([h]) });
  });

  at(830.93, (lt, t) => {
    const st = night(CO, t, Object.assign({ camera: zcam(CO, [0, 0.8, 2], [0, 14, -20], 64) }, MOONY));
    return withMoon(st, moon(zp(CO, 0, 16, -24), 7, 0.0, t, { ring: true, pitch: 0.4 }));
  });

  at(831.997, (lt, t) => {
    const p = [-2.0, 2.1, 0.4];
    const h = baldHero(Pose.airborne('engineer', p, [0, 0.4, -1], [0, 1, 0], { hR: [-0.7, 0.25, 0.0], hL: [0.7, 0.25, 0.0] }), { grips: { L: 'open', R: 'open' } });
    return bluRoom(t, { camera: cam([-2.0, 4.0, 0.45], [-2.0, 0, 0.4], 64, { roll: lt * 0.2 }), actors: crowd(t, true).concat([h]), post: { black: ramp(lt, 2.2, 2.5) } });
  });

  at(834.4, (lt) => ({ set: null, bg: [0, 0, 0] }));

  const SPK = [[6.5, -3.5], [6.5, -2.2], [6.5, -0.9]];

  function speakers() {
    const list = [];
    SPK.forEach(([x, z]) => [0, 1.2].forEach(y => list.push({ kind: 'speaker', at: [x, y, z], yaw: -PI / 2 })));
    return list;
  }

  function rocker(t, o) {
    const pose = Pose.stand('engineer', 4.8, -2.2, PI / 2, Object.assign({ spread: 0.18 }, o || {}));
    return armed(baldHero(pose, Object.assign({ gun: 'eguitar', gunOpts: { hROff: [0, S(t * 14) * 0.04, 0.01] }, grips: { L: 'grip', R: 'open' }, face: { mouth: 'grin', open: 0.6, beard: true } }, {})));
  }

  at(836.535, (lt, t) => {
    const h = rocker(t);
    if (lt < 0.8) return bluRoom(t, { camera: faceCam(h, 0.8, -0.3, 0.2, 54, { chest: true, lu: -0.25 }), actors: [h], props: speakers() });
    return bluRoom(t, { camera: cam([6.0, 1.0, -0.9 + 0.75], [6.8, 0.88, -0.9], 40), actors: [], props: speakers() });
  });

  at(838.2, (lt, t) => bluRoom(t, { camera: cam([1.2, 1.4, -2.2], [5.6, 1.3, -2.2], 56), actors: [rocker(t)], props: speakers() }));

  const RS = NZ.resup;

  at(840.339, (lt, t) => night(RS, t, {
    camera: zcam(RS, [1.6, 1.3, 1.8], [0, 2.0, -6], 58),
    props: [{ kind: 'cone', at: zp(RS, 1.6, 0, -3.2), s: 1.4 }],
    fx: [{ kind: 'smoke', p: zp(RS, 0, 1.2, -6.8), s: 1.4, n: 10, u: (lt % 3) + 0.5, dur: 3.5, col: [0.5, 0.5, 0.52], alpha: 0.7 }]
  }));

  const LIE = [0.6, -2.4];

  function lyingHero(t, hat, face) {
    const pose = Pose.prone('engineer', LIE[0], LIE[1], 0.5, { nk: [-1.0, 0, 0], tilt: 0.3 });
    return hero(zpose(RS, pose), { hat: hat ? 'cowboy' : 'goggles', face: face || { mouth: 'shut', eyes: 'half', beard: true } });
  }

  function sniperOver(t, reach) {
    const pose = Pose.stand('sniper', LIE[0] - 0.4, LIE[1] + 0.9, PI - 0.3, { sp: [0.45, 0, 0], hR: [-0.1, -0.1 - reach * 0.3, 0.55 + reach * 0.15] });
    return { cls: 'sniper', team: 'blu', eyewear: 'glasses', pose: zpose(RS, pose), face: talk(t, 1, { brows: 'up' }) };
  }

  at(842.2, (lt, t) => {
    const h = lyingHero(t, false);
    return night(RS, t, { camera: proneCam(h, 1.4, -0.1, 0.4, 56), actors: [h], fx: [{ kind: 'smoke', p: zp(RS, 0, 1.2, -6.8), s: 1.2, n: 8, u: lt + 1, dur: 3.5, col: [0.5, 0.5, 0.52], alpha: 0.6 }] });
  });

  at(843.3, (lt, t) => {
    const k = ease(clamp(lt / 1.4, 0, 1));
    const h = lyingHero(t, k >= 1);
    const m = Cast.solve('engineer', h.pose);
    const hatP = V3.add(m.pts.head, [0.0, 0.18 + (1 - k) * 0.6, -0.25 * (1 - k)]);
    const props = k < 1 ? [{ kind: 'cowboyHat', at: hatP, yaw: 0.5, s: 1.0 }] : [];
    return night(RS, t, { camera: proneCam(h, 0.75, 0.05, -0.2, 54), actors: [h, sniperOver(t, k)], props });
  });

  at(845.2, (lt, t) => {
    const h = lyingHero(t, true, { mouth: 'smile', eyes: 'half', beard: true });
    return night(RS, t, { camera: proneCam(h, 0.42, 0.04, 0.1, 50), actors: [h], grade: [1.0, 0.98, 0.95, 0.35] });
  });

  at(846.2, (lt, t) => {
    const h = lyingHero(t, true);
    return night(RS, t, { camera: zcam(RS, [LIE[0] + 0.5, 0.3, LIE[1] - 0.1], [LIE[0] - 0.4, 1.5, LIE[1] + 0.9], 66), actors: [h, sniperOver(t, 1)] });
  });

  at(849.348, (lt, t) => {
    const st = night(CO, t, Object.assign({ camera: zcam(CO, [-4, 1.2, 14], [6, 14, -16], 60) }, BLUE));
    return withMoon(st, moon(zp(CO, 10, 24 - lt * 1.5, -30), 16, -0.3, t, { ring: true, beams: 1, pitch: 0.2 }));
  });

  function lassoHero(t, o) {
    const pose = Pose.stand('engineer', 0, 6, PI, Object.assign({ hR: [-0.3, 0.55, 0.2] }, o || {}));
    return hero(zpose(CO, pose), { itemR: 'lasso', grips: { R: 'grip' } });
  }

  at(852.2, (lt, t) => {
    const h = lassoHero(t);
    const m = Cast.solve('engineer', h.pose);
    const st = night(CO, t, Object.assign({ camera: cam(V3.add(m.pts.wristR, [0.6, -0.3, 0.9]), V3.add(m.pts.wristR, [-0.2, 1.4, -2]), 58), actors: [h] }, BLUE));
    return withMoon(st, moon(zp(CO, 2, 22, -24), 12, -0.1, t, { pitch: 0.3 }));
  });

  at(853.4, (lt, t) => {
    const h = lassoHero(t, { hR: [-0.35, 0.7, 0.1] });
    const st = night(CO, t, Object.assign({ camera: zcam(CO, [0.3, 1.3, 8.2], [1, 8, -10], 58), actors: [h] }, BLUE));
    return withMoon(st, moon(zp(CO, 2, 22, -24), 12, -0.1, t, { pitch: 0.3 }));
  });

  const LG = NZ.ledge;

  at(855.2, (lt, t) => {
    const k = clamp(lt / 1.0, 0, 1);
    const pose = Pose.airborne('engineer', zp(LG, -1 + k * 2, 1.0 + S(k * PI) * 1.4, 4), [0.2, 1, 0.1], [0.6, 0, -0.8], {});
    return night(LG, t, Object.assign({ camera: zcam(LG, [0, 1.2, 8.5], [0, 1.5, 4], 50), actors: [armed(hero(pose, { gun: 'guitar', grips: { L: 'grip', R: 'open' } }))] }, BLUE));
  });

  at(856.2, (lt, t) => {
    const k = clamp(lt / 1.4, 0, 1);
    const pose = Pose.airborne('engineer', zp(LG, 1 + k * 3, 1.6 - k * 0.8, 5.5), [0.4, 0.3, 0.6], [1, -0.2, 0], {});
    return night(LG, t, Object.assign({ camera: zcam(LG, [1.4, 0.5, 8.4], [3, 1, 6.4], 56), actors: [hero(pose, { itemR: 'lasso', grips: { R: 'grip' } })], props: [{ kind: 'cask', tex: 'flammable', at: zp(LG, 1.5, 0.3, 7.2), roll: PI / 2, yaw: 0.4 }] }, BLUE));
  });

  function guitarProp(p, roll, yaw) {
    return { kind: 'guitar', at: p, roll: roll || PI / 2, yaw: yaw || 0 };
  }

  at(857.6, (lt, t) => night(LG, t, Object.assign({ camera: zcam(LG, [4.75, 0.35, 8.0], [4.3, 0.08, 7.4], 54), props: [guitarProp(zp(LG, 4.3, 0.06, 7.4), PI / 2, 0.6)] }, BLUE)));

  at(860.025, (lt, t) => {
    const k = clamp(lt / 1.2, 0, 1);
    return night(LG, t, Object.assign({
      camera: zcam(LG, [4.8, 0.45, 8.2], [4.3, 0.2, 7.4], 56, { shake: 0.06 * (1 - k), shakeT: lt * 30 }),
      props: [{ kind: 'guitarHalfA', at: zp(LG, 4.1 - k * 0.6, 0.06 + S(k * PI) * 0.4, 7.5), roll: PI / 2, yaw: 0.6 + k * 2 }, { kind: 'guitarHalfB', at: zp(LG, 4.5 + k * 0.7, 0.06 + S(k * PI) * 0.5, 7.3), roll: PI / 2, yaw: 0.6 - k * 1.5 }],
      fx: lt < 0.6 ? [{ kind: 'shards', p: zp(LG, 4.3, 0.3, 7.4), u: lt, s: 2, n: 14 }] : []
    }, BLUE));
  });

  at(861.4, (lt, t) => {
    const k = clamp(lt / 1.6, 0, 1);
    const pose = Pose.airborne('engineer', zp(LG, 2.5, 1.0 - k * 0.4, 6.5), [-0.2, 1, -0.4 - k * 0.6], [0, 0.4, 1], { hR: [-0.5, 0.5, 0.3], hL: [0.5, 0.4, 0.3] });
    return night(LG, t, Object.assign({ camera: zcam(LG, [3.1, 1.1, 7.8], [2.5, 1.0, 6.5], 56), actors: [hero(pose, { face: { mouth: 'scream', open: 1, eyes: 'shut', beard: true }, grips: { L: 'open', R: 'open' } })] }, BLUE));
  });

  at(863.162, (lt, t) => night(LG, t, Object.assign({ camera: zcam(LG, [3.7, 1.25, 8.3], [3.7, 0, 7.4], 58), props: [{ kind: 'guitarHalfA', at: zp(LG, 2.8, 0.06, 7.0), roll: PI / 2, yaw: 2.2 }, { kind: 'guitarHalfB', at: zp(LG, 4.6, 0.06, 7.8), roll: PI / 2, yaw: -0.6 }] }, BLUE)));

  at(866.298, (lt, t) => {
    const k = ramp(lt, 1.5, 3.5);
    return night(LG, t, Object.assign({
      camera: zcam(LG, [3.0, 0.6, 9.0 - k], [3.6, 0.1, 7.6], 56),
      actors: [sil({ cls: 'soldier', team: 'red', pose: zpose(LG, Pose.stand('soldier', 6, 9.5, -2.4, {})) }), sil({ cls: 'heavy', team: 'red', pose: zpose(LG, Pose.stand('heavy', 7.2, 8.6, -2.2, {})) })],
      props: [{ kind: 'robotHand', at: zp(LG, 3.6, 0.02, 7.6), yaw: 0.8, s: 1.3 }],
      post: { black: 0.35 * (1 - k) }
    }, BLUE));
  });

  at(873.072, (lt, t) => {
    const st = night(CO, t, Object.assign({ camera: zcam(CO, [-6, 1.4, 16], [9, 9, -3], 58) }, BLUE));
    return withMoon(st, moon(zp(CO, 10, 16 - lt * 0.8, -12), 9, -0.5, t, { ring: true, beams: 0.6, pitch: 0.2 }));
  });

  const FN = NZ.finale;

  function finale(t, extra) {
    return night(FN, t, Object.assign({ envOver: { ambTop: [0.45, 0.42, 0.5], points: [{ pos: zp(FN, 0, 1.5, 0), color: [1.4, 0.7, 0.3] }] } }, extra));
  }

  at(875.941, (lt, t) => {
    const k = lt > 1.36;
    const h = hero(zpose(FN, Pose.run('engineer', -1 + lt * 0.3, 2.5 - lt * 0.4, PI, lt * 1.2, { stride: 0.2 })), { gun: 'shotgun', grips: { L: 'grip', R: 'grip' } });
    return finale(t, { camera: zcam(FN, [0.6, 1.6, 6.5], [-0.5, 1.4, 0], 56), actors: k ? [armed(h)] : [], cards: [{ tex: k ? 'impBulge' : 'impSmirk', x: -40, y: -40, w: 740, h: 740 }] });
  });

  at(878.677, (lt, t) => night(NZ.banner, t, { camera: zcam(NZ.banner, [-3, 2, 14], [0, 6, -6], 56), cards: [{ tex: 'impSly', x: 300, y: 120, w: 360, h: 360 }] }));

  at(879.4, (lt, t) => {
    const h = hero(zpose(CO, Pose.stand('engineer', 0, 8, PI, {})), {});
    return night(CO, t, Object.assign({ camera: faceCam(h, 0.24 - lt * 0.01, 0.03, 0.0, 44, { lu: 0.03 }), actors: [h], cards: [{ tex: 'scratches', alpha: 0.5 }] }, SEPIA));
  });

  at(883.249, (lt, t) => finale(t, { camera: zcam(FN, [0, 1.4, 6], [0, 1.2, -2], 56), cards: [{ tex: 'impSly', x: -60 - lt * 10, y: -170 - lt * 6, w: 1080 + lt * 20, h: 1080 + lt * 20 }] }));

  at(887.086, (lt, t) => {
    const st = night(FN, t, Object.assign({ camera: zcam(FN, [0, 1.4, 12], [0, 12, -6], 62) }, BLUE));
    return withMoon(st, moon(zp(FN, 0, 18 - lt * 3, -14), 8, 0, t, { beams: 1, ring: true, pitch: 0.4 }));
  });

  function seatedPlayer(t, gun) {
    const pose = Pose.stand('engineer', 0, -0.6, 0, { dy: -0.42, sp: [0.12, 0, 0], nk: [0.15, 0, 0] });
    pose.fLw = V3.add(pose.fLw, [0, 0, 0.3]);
    pose.fRw = V3.add(pose.fRw, [0, 0, 0.26]);
    return armed(hero(zpose(FN, pose), { gun: gun || 'guitar', gunOpts: { hROff: [0, A.strum(t, 2.6), 0.01] }, grips: { L: 'grip', R: 'open' }, face: { mouth: 'smirk', beard: true } }));
  }

  function spotlights(n, t) {
    const list = [];
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 3;
      list.push({ kind: 'lightCone', at: zp(FN, x, 9, -1), roll: S(t * 0.7 + i) * 0.3 - x * 0.04, opts: { additive: true, alpha: 0.12 } });
    }
    return list;
  }

  at(889.0, (lt, t) => finale(t, { camera: zcam(FN, [0, 1.25, 3.0], [0, 1.0, -0.6], 52), actors: [seatedPlayer(t)], props: [{ kind: 'chair', at: zp(FN, 0, 0, -0.85), yaw: 0 }], fx: [{ kind: 'glow', p: zp(FN, 0, 0.2, -0.4), s: 4, col: [1, 0.55, 0.15], alpha: 0.5 }] }));

  function halftoneShot(st, lt) {
    return Object.assign(st, { grade: [1.35, 1.35, 1.35, 1], colorAdd: [-0.12, -0.12, -0.12], vignette: 0.5, cards: (st.cards || []).concat([{ tex: 'halftone', alpha: 0.5 }]) });
  }

  at(892.0, (lt, t) => {
    const h = seatedPlayer(t, 'eguitar2');
    const m = Cast.solve('engineer', h.pose);
    const tgt = lt < 1.8 ? m.pts.wristR : m.pts.wristL;
    return halftoneShot(finale(t, { camera: cam(V3.add(tgt, [0.35, 0.15, 0.55]), tgt, 46), actors: [h], props: [{ kind: 'chair', at: zp(FN, 0, 0, -0.85) }], post: { flash: pulse(lt, [0.5, 1.4, 2.6], 8) * 0.5 } }), lt);
  });

  at(895.628, (lt, t) => finale(t, { camera: zcam(FN, [0, 2.0, 4.4], [0, 2.2, -1], 56), actors: [seatedPlayer(t, 'eguitar2')], props: [{ kind: 'chair', at: zp(FN, 0, 0, -0.85) }].concat(spotlights(1, t)), envOver: { ambTop: [0.06, 0.06, 0.07], ambBottom: [0.02, 0.02, 0.03], points: [] }, post: { flash: pulse(lt, [2.4], 6) * 0.4 } }));

  function jumper(t, k) {
    const pose = Pose.airborne('engineer', zp(FN, 0, 1.3 + S(k * PI) * 0.8, 0.5), [0, 1, 0.1], [0, 0, 1], { fL: [0.25, -0.6, 0.3], fR: [-0.25, -0.7, -0.2] });
    return armed(hero(pose, { gun: 'eguitar2', grips: { L: 'grip', R: 'open' }, face: { mouth: 'grin', open: 0.7, beard: true } }));
  }

  at(898.497, (lt, t) => finale(t, { camera: zcam(FN, [0, 1.6, 4.8], [0, 1.4, -1], 60), actors: [jumper(t, ramp(lt, 0.4, 1.1))], props: spotlights(5, t) }));

  at(900.2, (lt, t) => halftoneShot(finale(t, { camera: zcam(FN, [0, 1.6, 9], [0, 2.2, -4], 56), actors: [sil(jumper(t, 0))], props: spotlights(3, t), post: { black: ramp(lt, 0.7, 0.83) } }), lt));

  at(901.4, (lt, t) => finale(t, { camera: zcam(FN, [0.8, 1.9, 2.6], [0, 2.2, 0.5], 56), actors: [jumper(t, 0.5)], grade: [1.6, 1.5, 1.4, 0.4], colorAdd: [0.35, 0.33, 0.3], post: { flash: pulse(lt, [0.4, 1.4, 2.2], 6) * 0.6 } }));

  at(903.869, (lt, t) => finale(t, { camera: zcam(FN, [0, 1.4, 6], [0, 1.2, -2], 56), cards: [{ tex: 'impCry', x: 40 + S(lt * 20) * 4, y: -60, w: 760, h: 760 }] }));

  at(905.471, (lt, t) => finale(t, { camera: zcam(FN, [2, 1.3, 4.4], [0, 1.2, 0], 54), actors: [jumper(t, 0.3)], grade: [1.7, 1.6, 1.5, 0.5], colorAdd: [0.45, 0.42, 0.4], post: { flash: pulse(lt, [0.95, 1.05, 1.15, 1.25, 1.35], 12) } }));

  at(906.905, (lt, t) => finale(t, { camera: zcam(FN, [-3, 4, 6], [0, 0, 0], 60, { roll: 0.5 + lt * 0.1 }), actors: [jumper(t, 0.2)], grade: [1.6, 1.6, 1.6, 0.2], colorAdd: [0.5, 0.5, 0.5] }));

  at(908.2, () => ({ set: null, bg: [0.97, 0.97, 0.97] }));

  at(909.2, (lt, t) => Object.assign(halftoneShot(night(CO, t, { camera: zcam(CO, [2, 1.6, 10], [0, 2, 14], 60) }), lt), { colorAdd: [0.32, 0.32, 0.32] }));

  at(910.476, (lt, t) => {
    const pose = Pose.stand('engineer', 0, 0, 0, { dy: -0.45, sp: [0.3, 0, 0] });
    return halftoneShot(finale(t, { camera: zcam(FN, [1.6, 1.0, 3.2], [0, 1.0, 0], 56), actors: [armed(hero(zpose(FN, pose), { gun: 'eguitar2', grips: { L: 'grip', R: 'open' } }))], props: spotlights(3, t) }), lt);
  });

  at(912.478, () => ({ set: null, bg: [0, 0, 0] }));

  at(912.711, (lt, t) => {
    const h = seatedPlayer(t, 'eguitar2');
    const m = Cast.solve('engineer', h.pose);
    return halftoneShot(finale(t, { camera: cam(V3.add(m.pts.wristR, [0.3, 0.1, 0.45]), m.pts.wristR, 44), actors: [h], props: [{ kind: 'chair', at: zp(FN, 0, 0, -0.85) }] }), lt);
  });

  at(914.18, (lt, t) => {
    const st = Object.assign(halftoneShot(night(FN, t, { camera: zcam(FN, [0, 1, 10], [0, 9, -8], 56) }), lt), { colorAdd: [0.22, 0.22, 0.22] });
    return withMoon(st, moon(zp(FN, 0, 12, -12), 6, 0, t, { pitch: 0.3 }));
  });

  at(915.781, (lt, t) => {
    const st = night(FN, t, { camera: zcam(FN, [0, 1, 8], [0, 9, -8], 56), grade: [1.1, 1.1, 1.15, 0.85], colorAdd: [0.08, 0.08, 0.1], post: { flash: pulse(lt, [0.1, 0.4, 0.8], 8) * 0.6 } });
    return withMoon(st, moon(zp(FN, 0, 11, -10), 5.5, 0, t, { beams: 1.4, pitch: 0.3 }));
  });

  at(916.782, (lt, t) => {
    const k = ramp(lt, 0.5, 3.2);
    const c = zp(FN, 0, 11 + k * 4, -10 - k * 6);
    const st = night(FN, t, { camera: zcam(FN, [0, 1, 8], [0, 10, -10], 58), grade: [1.05, 1.0, 1.15, 0.6] });
    withMoon(st, moon(c, 5.5 * (1 - k * 0.8), lt * 2, t, { beams: 1.2, pitch: 0.3 }));
    st.fx = st.fx.concat([
      { kind: 'sprite', tex: 'purpleEnergy', p: V3.add(c, [0, 0, 1]), s: 16 * (1 - k * 0.5), additive: true, alpha: 0.9, spin: lt * 2 },
      { kind: 'sprite', tex: 'blackHole', p: V3.add(c, [0, 0, -2]), s: 10 * k + 0.01, spin: -lt }
    ]);
    st.fx = st.fx.concat(['skyHeadA', 'skyHeadB', 'skyHeadC'].map((tx, i) => ({ kind: 'sprite', tex: tx, p: zp(FN, -3 + i * 3, 2.6 + S(t + i) * 0.2, -1), s: 1.2 })));
    return st;
  });

  at(919.652, (lt, t) => {
    const st = night(FN, t, { camera: zcam(FN, [0, 1, 8], [0, 12, -12], 58), post: { flash: pulse(lt, [0.6], 3) } });
    st.fx = st.fx.concat([{ kind: 'sprite', tex: 'blackHole', p: zp(FN, 0, 15, -16), s: 10 * (1 - lt), spin: -lt * 3 }, { kind: 'sprite', tex: 'purpleEnergy', p: zp(FN, 0, 15, -15), s: 6 * (1 - lt) + 0.01, additive: true, alpha: 0.8 }]);
    return st;
  });

  at(920.0, (lt, t) => {
    const h = seatedPlayer(t, 'eguitar2');
    return finale(t, { camera: zcam(FN, [1.0, 1.0, 1.4], [0, 1.2, -0.6], 56), actors: [h], props: [{ kind: 'chair', at: zp(FN, 0, 0, -0.85) }], fx: [{ kind: 'sprite', tex: 'impSmirk', p: zp(FN, -1.2, 1.6 + clamp(lt * 4, 0, 1) * 0.6, -1.4), s: [1.3, 1.3] }], post: { flash: ramp(lt, 0.42, 0.486) } });
  });

  at(920.486, () => ({ set: null, bg: [0.97, 0.97, 0.97] }));

  const LS = ZONES.lessons;

  function audience(t) {
    return [
      { cls: 'scout', team: 'blu', pose: Pose.sitFloor('scout', -2.5, 1.5, PI, { splay: 0.6 }), face: { mouth: 'shut' } },
      { cls: 'scout', team: 'red', pose: Pose.sitFloor('scout', -0.8, 2.2, PI - 0.2, { splay: 0.6 }), face: { mouth: 'shut' } },
      { cls: 'spy', team: 'blu', pose: Pose.sitFloor('spy', 1.2, 2.0, PI + 0.2, {}), face: { mouth: 'smirk' } },
      { cls: 'pyro', team: 'red', pose: Pose.sitFloor('pyro', 2.8, 1.2, PI + 0.4, {}) },
      { cls: 'sniper', team: 'red', pose: Pose.sitFloor('sniper', 3.6, 2.6, PI + 0.3, {}), face: { mouth: 'shut' } }
    ].map(a => Object.assign(a, { pose: zpose(LS, a.pose) }));
  }

  const HC = [-1.2, -3.8];
  const VC = [1.0, -3.6];

  function sitOnCrate(cls, x, z, yaw, t, gun, face, extra) {
    const pose = Pose.stand(cls, x, z, yaw, { dy: -0.38, sp: [0.12, 0, 0], nk: [0.12, 0, 0] });
    const fwd = [S(yaw), 0, C(yaw)];
    pose.fLw = V3.add(pose.fLw, V3.mul(fwd, 0.32));
    pose.fRw = V3.add(pose.fRw, V3.mul(fwd, 0.28));
    return armed(Object.assign({ cls, team: cls === 'heavy' ? 'red' : 'blu', gun, gunOpts: { hROff: [0, A.strum(t, 2.2), 0.01] }, grips: { L: 'grip', R: 'open' }, face, pose: zpose(LS, pose) }, extra || {}));
  }

  function lessonCast(t) {
    const h = sitOnCrate('engineer', HC[0], HC[1], 0.35, t, 'guitar', { mouth: 'smile', beard: true }, { hat: 'cowboy', robot: true });
    const v = sitOnCrate('heavy', VC[0], VC[1], -0.35, t, 'guitar', { brows: 'angry', mouth: 'frown' });
    return [h, v];
  }

  function lessonProps() {
    return [
      { kind: 'crate', at: zp(LS, HC[0], 0, HC[1] - 0.1), yaw: 0.35 },
      { kind: 'crate', at: zp(LS, VC[0], 0, VC[1] - 0.1), yaw: -0.35 },
      { kind: 'crate', at: zp(LS, -2.6, 0, -2.6), yaw: 0.2 },
      { kind: 'sign', tex: 'lessons', M: M4.chain(M4.translate(LS[0] - 2.6 + 0.05, 0.27, LS[2] - 2.6 + 0.27), M4.rotY(0.2), M4.scale(0.66, 0.42, 1)) },
      { kind: 'lasso', at: zp(LS, HC[0] + 0.4, 0.03, HC[1] + 0.5), pitch: PI / 2 },
      { kind: 'mushroomRed', at: zp(LS, -4, 0, 14), s: 0.45 }
    ];
  }

  function day(t, extra) {
    return Object.assign({ set: 'kart', env: 'kart' }, extra);
  }

  at(929.0, (lt, t) => {
    if (lt < 3.5) return { set: null, bg: [0.97, 0.97, 0.97], cards: lt < 2.0 ? [{ tex: 'someTime', alpha: clamp(Math.min(lt + 0.1, 2.0 - lt) * 4, 0.001, 0.999) }] : [] };
    const keys = [3.5, 6.5, 8.6, 10.2, 12.5, 15.2];
    const path = [[-1, 6, 26], [-3.5, 2.6, 19], [-1.2, 1.6, 15.8], [-4.8, 1.05, 4.6], [-1.5, 1.3, 6.2], [2.4, 1.6, 6.0]];
    const look = [[-4, 0.6, 14], [-4, 0.6, 14], [-3, 0.4, 11], [-1.8, 0.55, 1.8], [-1, 0.8, -1], [-0.4, 1.0, -3.4]];
    let seg = 0;
    while (seg < keys.length - 2 && lt >= keys[seg + 1]) seg++;
    const f = ease(clamp((lt - keys[seg]) / (keys[seg + 1] - keys[seg]), 0, 1));
    const eye = lerp3(path[seg], path[seg + 1], f), lk = lerp3(look[seg], look[seg + 1], f);
    const bloom = clamp(1 - (lt - 3.5) / 2.5, 0, 1);
    return day(t, {
      camera: cam(zp(LS, eye[0], eye[1], eye[2]), zp(LS, lk[0], lk[1], lk[2]), 58),
      actors: audience(t).concat(lessonCast(t)),
      props: lessonProps(),
      grade: [1 + bloom * 0.6, 1 + bloom * 0.6, 1 + bloom * 0.6, 0],
      colorAdd: [bloom * 0.45, bloom * 0.45, bloom * 0.45],
      post: { flash: bloom * 0.5 }
    });
  });

  at(944.176, (lt, t) => {
    const [h, v] = lessonCast(t);
    return day(t, { camera: cam(zp(LS, -2.42, 0.34, -1.85), zp(LS, -2.58, 0.27, -2.4), 42), actors: [h, v], props: lessonProps() });
  });

  at(947.613, (lt, t) => {
    const aud = audience(t);
    return day(t, { camera: cam(zp(LS, -2.75, 1.1, 2.15), zp(LS, 0, 1.0, -3.6), 52), actors: aud.concat(lessonCast(t)), props: lessonProps() });
  });

  at(952.051, (lt, t) => {
    const [h, v] = lessonCast(t);
    v.face = { brows: 'angry', mouth: 'frown', eyes: 'half' };
    return day(t, { camera: cam(zp(LS, 0.15, 1.15, -1.6), zp(LS, -0.1, 1.0, -3.7), 54), actors: [h, v], props: lessonProps() });
  });

  at(957.323, (lt, t) => {
    const [h, v] = lessonCast(t);
    return day(t, { camera: cam(zp(LS, 1.6, 1.5, -4.4), zp(LS, 0.4, 0.6, 2.0), 56), actors: audience(t).concat([h, v]), props: lessonProps() });
  });

  at(958.858, (lt, t) => {
    const [h, v] = lessonCast(t);
    const m = Cast.solve('heavy', v.pose);
    return day(t, { camera: cam(V3.add(m.pts.wristR, [0.25, 0.3, 0.5]), m.pts.wristR, 46), actors: [h, v], props: lessonProps() });
  });

  SHOTS.sort((a, b) => a[0] - b[0]);

  window.FabScript4 = { FROM: 720, TO: 960, SHOTS, hero, audience, lessonCast, lessonProps, day };
})();
