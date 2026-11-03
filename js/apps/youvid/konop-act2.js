(function () {
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const { V3, rand } = window.P3D;
  const Sh = window.KonopShots;
  const Fx = window.KonopFx;
  const Cast = window.KonopCast;
  const { blank, cam, at, blinkAt, runner, walker } = Sh;

  const ramp = (t, a, b) => ease((t - a) / (b - a));

  function aquaGrass(t) {
    const tt = t - 27.902;
    const laugh = t > 29.35;
    const turn = ramp(t, 27.95, 28.5);
    const pose = {
      pos: [0, 0.27, 0], yaw: -0.55 + turn * 0.25, lean: -0.12, sp: [-0.05, 0.1, 0.06],
      nk: [laugh ? -0.12 : 0.06, lerp(-0.2, 0.35, turn), laugh ? 0.15 : 0.08], gaze: [0.2, 0.1],
      eyes: laugh ? 'shut' : blinkAt(t, [28.9]) ? 'shut' : 'open', mouth: laugh ? 'happy' : 'smile', blush: laugh,
      fLw: [-0.45, 0.07, 0.3], kLw: [-0.25, 0.2, 0.45], fRw: [-0.38, 0.07, 0.05], kRw: [-0.1, 0.18, 0.3],
      hLw: [0.22, 0.12, -0.2], eLw: [0.3, 0.3, -0.4], hRw: [-0.22, 0.12, -0.26], eRw: [-0.3, 0.3, -0.45]
    };
    return blank({
      env: 'bright', set: 'meadow', world: { ground: 'grass' },
      camera: cam([-0.2 - tt * 0.015, 0.98, 0.6], [-0.06, 0.76, 0], 44),
      cast: [{ who: 'aqua', pose }],
      sprites: Fx.field(2701, 18, [0, 0.4, 0], [3, 1.2, 2], tt, { rise: 0.04, size: 0.04, kind: 'glow', color: [0.6, 1, 0.8], alpha: 0.35, twinkle: true }),
      grade: [1.0, 1.04, 0.98, 0]
    });
  }

  function barn(t) {
    const tt = t - 30.28;
    const up = ramp(t, 30.6, 31.0);
    const kaz = at('kazumaJ', -0.45, -4.5, { yaw: 0.6, nk: [0, 0.4, 0], mouth: 'flat' });
    const aqua = up < 0.5
      ? { pos: [0.4, 0.3, -4.4], yaw: -0.8, lean: 0.1, eyes: 'open', mouth: 'open', fLw: [0.25, 0.07, -4.2], kLw: [0.35, 0.25, -4.0], fRw: [0.55, 0.07, -4.2], kRw: [0.6, 0.25, -4.0], hL: [0.18, -0.2, 0.15], hR: [-0.18, -0.2, 0.15] }
      : at('aqua', 0.4, -4.4, { yaw: -0.7, eyes: 'open', mouth: 'open', hL: [0.4, 0.05, 0.15], eL: [0.6, 0, -0.4], hR: [-0.4, 0.05, 0.15], eR: [-0.6, 0, -0.4] });
    return blank({
      env: 'day', set: 'barn',
      camera: cam([3.6 - tt * 0.25, 1.6, 8.5], [-1.4 - tt * 0.25, 2.9, -8], 46),
      cast: [{ who: 'kazumaJ', pose: kaz }, { who: 'aqua', pose: aqua }]
    });
  }

  function kazumaKnife(t) {
    const tt = t - 31.906;
    const ph = tt * 2.4 * PI * 2;
    const pose = runner('kazumaJ', -tt * 2.2, 0, -PI / 2 + 0.35, ph, {
      lean: 0.45, sp: [0.25, 0.25, 0], nk: [-0.25, -0.2, 0], eyes: 'open', mouth: 'grit',
      hR: [-0.1, -0.02, 0.42], eR: [-0.5, -0.4, -0.4], hL: [0.25, -0.15, -0.2],
      props: [{ kind: 'dagger', hand: 'R', dir: [-0.9, 0.15, 0.3] }]
    });
    const cx = -tt * 2.2;
    return blank({
      env: 'bright', set: 'meadow', world: { ground: 'grass' },
      camera: cam([cx + 0.45, 1.35, 1.35], [cx - 0.1, 0.62, 0], 52),
      cast: [{ who: 'kazumaJ', pose }],
      lines: Fx.field(3191, 10, [cx, 0.6, 0.2], [3, 1.2, 1.5], tt, { size: 0.02 }).map(s => ({ a: s.p, b: [s.p[0] + 0.9, s.p[1], s.p[2]], w: 0.012, color: [0.85, 1, 0.9], alpha: 0.35, tex: 'streakTex' }))
    });
  }

  function aquaStaff(t) {
    const tt = t - 32.574;
    const hopY = Math.sin(clamp(tt / 0.62, 0, 1) * PI) * 0.35;
    const pose = {
      pos: [0, Cast.standY('aqua', 0.9) + hopY, 0], yaw: 0.7, lean: 0.15, sp: [0.1, -0.2, 0.05], nk: [0.1, -0.2, 0],
      eyes: 'open', mouth: 'smile',
      fL: [0.12, -0.55, 0.35], kL: [0.1, 0.4, 1], fR: [-0.08, -0.62, -0.35], kR: [-0.05, 0.2, 1],
      hL: [0.32, 0.0, 0.25], eL: [0.6, -0.3, -0.4], hR: [-0.3, -0.05, 0.1], eR: [-0.6, -0.2, -0.4],
      props: [{ kind: 'staffAqua', hand: 'L', dir: [0.35, 0.55, 0.75] }]
    };
    const m = Cast.solve('aqua', pose);
    const ribbons = [-1, 1].map(sd => {
      const base = V3.add(m.pts.chest, [0.0, 0.12, -0.12]);
      const pts = [];
      for (let i = 0; i < 12; i++) pts.push([base[0] - 0.14 * i + sd * 0.04 * i, base[1] - 0.06 * i + S(tt * 9 + i * 0.7 + sd) * 0.08, base[2] - 0.08 * i + sd * 0.1 * i]);
      return { pts, w: 0.12, color: [1, 0.55, 0.82], alpha: 0.8 };
    });
    return blank({
      env: 'bright', set: 'meadow', world: { ground: 'grass' },
      camera: cam([0.55, 1.95, 1.15], [0.0, 0.95, 0], 50),
      cast: [{ who: 'aqua', pose }],
      ribbons,
      sprites: Fx.field(3257, 14, [0, 0.3, 0], [2, 0.8, 2], tt, { rise: 0.1, size: 0.05, kind: 'glow', color: [0.6, 0.9, 1], alpha: 0.5 })
    });
  }

  function trollChase(t) {
    const tt = t - 33.199;
    const ph = tt * 3.0 * PI * 2;
    const kaz = runner('kazumaJ', 0.25, 0.9 + tt * 0.9, 0.15, ph, {
      lean: 0.2, nk: [-0.15, 0, 0], eyes: 'shock', mouth: 'scream',
      hR: [-0.45, 0.25, 0.1], eR: [-0.6, 0.2, -0.3], hL: [0.5, 0.0, 0.3], eL: [0.6, 0.2, -0.3],
      props: [{ kind: 'dagger', hand: 'R', dir: [-0.6, 0.6, 0.4] }]
    });
    const owls = [[-1.6, 1.5, 0.6], [1.6, 1.0, 1.4], [1.2, 2.4, -1.2], [-0.9, 0.5, 2.3]].map((p, i) => ({ kind: 'owl', pos: [p[0] + S(tt * 3 + i) * 0.2, p[1] + S(tt * 5 + i) * 0.1, p[2]], yaw: PI + (i - 1.5) * 0.4, flap: tt * 18 + i, scale: 1.5 }));
    const ghosts = [[-3.5, 3.6, -6], [-2.6, 4.4, -7], [-4.2, 4.8, -8]].map((p, i) => ({ kind: 'ghost', pos: p, yaw: 0.3, wob: tt * 4 + i, scale: 1.8 }));
    const rabbits = [[-2.6, 0.2, 0.2], [2.4, 0.5, -1.4], [-3.4, 0.4, -2.5]].map(p => ({ kind: 'rabbit', pos: p, yaw: 0.4, scale: 1.4 }));
    return blank({
      env: 'forest', set: 'forest',
      camera: cam([0.7, 1.05, 3.1], [-0.25, 1.35, 0], 58, { up: [0.22, 0.97, 0] }),
      cast: [{ who: 'kazumaJ', pose: kaz }],
      foes: [{ kind: 'troll', pos: [-1.0, 0, -0.5 + tt * 1.2], yaw: 0.25, swing: S(tt * 7), step: tt * 9, roar: 1, scale: 1.3 }].concat(owls, ghosts, rabbits),
      grade: [1.02, 1.0, 0.96, 0]
    });
  }

  function lyingField(t) {
    const tt = t - 33.908;
    const aqua = Sh.lieDown('aqua', -0.6, 0, 1.2, { faceUp: true, eyes: 'sleep', mouth: 'open', hLw: [-0.2, 0.08, -0.6], hRw: [-1.1, 0.08, 0.5] });
    const kaz = Sh.lieDown('kazumaJ', 0.7, 0.1, -2.0, { eyes: 'shut', mouth: 'flat', hLw: [0.35, 0.08, 0.6], hRw: [1.2, 0.08, -0.3] });
    return blank({
      env: 'day', set: 'goldField',
      camera: cam([0.1 + tt * 0.1, 3.4, 0.5], [0.05, 0, 0], 44, { up: [0.3, 0, -1] }),
      cast: [{ who: 'aqua', pose: aqua }, { who: 'kazumaJ', pose: kaz }],
      grade: [1.08, 1.0, 0.88, 0], colorAdd: [0.04, 0.02, 0]
    });
  }

  function mugs(hand, side) {
    return [0, 1, 2].map(i => ({ kind: 'mug', hand, off: [side * 0.02, -0.02 + (i % 2) * 0.01, (i - 1) * 0.11], dir: [0, 1, 0], up: [side, 0, 0] }));
  }

  function guildWaitress(t) {
    const tt = t - 34.659;
    const ph = tt * 1.7 * PI * 2;
    const x = 0.55 - tt * 0.75;
    const w = walker('waitress', x, 1.45, -0.55, ph, {
      nk: [0.05, 0.25, 0], eyes: 'open', mouth: 'smile',
      hL: [0.27, -0.06, 0.24], eL: [0.6, -0.5, -0.4], hR: [-0.27, -0.06, 0.24], eR: [-0.6, -0.5, -0.4]
    });
    w.props = mugs('L', 1).concat(mugs('R', -1));
    const meg = {
      pos: [-1.9, 0.62, -0.2], yaw: 0.5, lean: 0.1, eyes: 'shut', mouth: 'happy', hat: true, cloak: true,
      fLw: [-1.8, 0.07, 0.2], kLw: [-1.8, 0.5, 0.25], fRw: [-2.05, 0.07, 0.15], kRw: [-2.05, 0.5, 0.2],
      hLw: [-1.72, 0.86, 0.22], hRw: [-1.98, 0.86, 0.2]
    };
    const camX = lerp(0.5, -0.8, ease(clamp(tt / 1.5, 0, 1)));
    return blank({
      env: 'guild', set: 'guild',
      camera: cam([camX + 0.02, 1.1, 2.2], [camX - 0.1, 1.06, 1.3], 54),
      cast: [{ who: 'waitress', pose: w }, { who: 'megumin', pose: meg }],
      grade: [1.08, 0.98, 0.86, 0]
    });
  }

  function meguminEat(t) {
    const chew = t > 36.33;
    const bob = chew ? S((t - 36.33) * 16) * 0.01 : 0;
    const pose = at('megumin', 0, 0, {
      yaw: 0.15, nk: [0.08 + bob, -0.1, 0.0], eyes: chew ? 'shut' : 'wide', mouth: chew ? 'smile' : 'open', hat: true, cloak: true, blush: chew,
      hLw: [0.05, 1.1 + bob, 0.18], eLw: [0.3, 0.85, 0.05], hRw: [-0.09, 1.1 + bob, 0.16], eRw: [-0.35, 0.85, 0.05],
      props: [{ kind: 'bread', pos: [-0.02, 1.13 + bob, 0.18], dir: [1, 0.1, 0.2], s: 1.5 }]
    });
    const crumbs = [[0.07, 1.31, 0.1], [-0.06, 1.33, 0.1], [0.05, 1.27, 0.11]].map(p => ({ kind: 'glow', p, size: 0.006, color: [0.9, 0.7, 0.4], alpha: 1 }));
    return blank({
      env: 'guild', set: 'guild',
      camera: cam([0.2, 1.16, 0.66], [0.0, 1.2, 0], 44),
      cast: [{ who: 'megumin', pose }],
      sprites: crumbs,
      grade: [1.06, 0.98, 0.88, 0]
    });
  }

  function darknessStreet(t) {
    const tt = t - 37.203;
    const tilt = ease(clamp(tt / 0.9, 0, 1));
    const pose = at('darkness', 0, 0, {
      yaw: -0.35, nk: [0.12, 0.2, 0], gaze: [0.2, 0.3], eyes: 'open', mouth: 'smile',
      hRw: [-0.24, 1.0, 0.25], eRw: [-0.45, 0.9, -0.1], hL: [0.24, -0.2, 0.08],
      props: [{ kind: 'greatsword', hand: 'R', dir: [0.05, -1, 0.12] }]
    });
    const people = [['crowdA', -3.2, -7.5], ['crowdB', -2.5, -9.0], ['guildman', -4.0, -11.0]].map(([who, x, z]) => ({ who, pose: at(who, x, z, { yaw: 0.4 }) }));
    return blank({
      env: 'day', set: 'street',
      camera: cam([0.42, 0.62, 1.15], [0.02, lerp(0.95, 1.5, tilt), 0], 54),
      cast: [{ who: 'darkness', pose }].concat(people)
    });
  }

  function castleDance(t) {
    const tt = t - 38.663;
    const ph = tt * 1.6 * PI * 2;
    const kick = 0.5 + 0.5 * S(tt * 4.5);
    const aqua = at('aqua', -0.6, 1.2, {
      yaw: 0.6, lean: -0.05, nk: [-0.1, -0.3, 0.1], eyes: 'open', mouth: 'happy',
      hLw: [-0.05, 1.42, 1.45], eLw: [-0.3, 1.3, 1.2], hRw: [-1.3, 1.1, 1.35], eRw: [-1.0, 1.0, 1.0],
      fR: [-0.1, -0.6, 0.35 + kick * 0.25], kR: [-0.05, 0.4, 1]
    });
    aqua.pos[1] += kick * 0.03;
    const back = [['megumin', 0.0, -1.0, { hat: true, cloak: true, props: [{ kind: 'staffMeg', hand: 'R', dir: [0.05, 1, 0.1] }] }], ['kazumaJ', 0.9, -1.4, {}], ['darkness', 1.8, -1.1, {}]];
    const cast = [{ who: 'aqua', pose: aqua }].concat(back.map(([who, x, z, o], i) => ({ who, pose: walker(who, x, z + tt * 0.6, 0, ph + i, Object.assign({ eyes: 'open', mouth: 'smile' }, o)) })));
    return blank({
      env: 'day', set: 'castle',
      camera: cam([0.1, 1.0, 3.7], [0.35, 1.45, 0], 48),
      cast
    });
  }

  function dungeon(t) {
    const tt = t - 40.039;
    const aqua = at('aqua', 0.75, 1.6, {
      yaw: -0.2, lean: 0.12, nk: [0.0, 0.0, 0.1], eyes: 'cry', mouth: 'scream',
      hLw: [1.05, 1.35, 2.2], eLw: [1.2, 1.1, 1.7], hRw: [0.45, 1.25, 2.25], eRw: [0.3, 1.0, 1.8]
    });
    const kaz = at('kazumaJ', -0.2, 0.6, {
      yaw: -0.5, lean: 0.1, eyes: 'shock', mouth: 'open', nk: [0, 0.4, 0],
      hRw: [-0.6, 1.0, 0.8], eRw: [-0.5, 1.0, 0.4], props: [{ kind: 'dagger', hand: 'R', dir: [-0.6, 0.7, 0.2] }]
    });
    const dark = at('darkness', -1.0, -0.4, { yaw: 0.4, eyes: 'open', mouth: 'smile', blush: true, props: [{ kind: 'greatsword', hand: 'R', dir: [0.3, 0.9, 0.2] }] });
    const meg = Sh.lieDown('megumin', -1.5, 1.4, 1.6, { hat: false, cloak: true, eyes: 'shut', mouth: 'flat', hLw: [-1.0, 0.08, 1.7], hRw: [-1.0, 0.08, 1.1] });
    return blank({
      env: 'dungeon', set: 'dungeon',
      camera: cam([0.35, 1.2, 3.9], [-0.3, 1.25, 0], 52),
      cast: [{ who: 'darkness', pose: dark }, { who: 'kazumaJ', pose: kaz }, { who: 'aqua', pose: aqua }, { who: 'megumin', pose: meg }],
      foes: [{ kind: 'mino', pos: [-2.4, 0, -2.4], yaw: 0.55, raise: 0.8 + S(tt * 4) * 0.2, roar: 0.5 + 0.5 * S(tt * 8) }],
      sprites: [[-4, 3.7, -5.1], [4, 3.7, -5.1]].map(p => ({ kind: 'fire', p, size: 0.22, sy: 1.6, color: [1, 0.7, 0.3], alpha: 0.8 }))
    });
  }

  function campfire(t) {
    const tt = t - 41.165;
    const sleeper = (who, x, z, h, o) => Sh.lieDown(who, x, z, h, Object.assign({ eyes: 'sleep', mouth: 'flat' }, o || {}));
    const kaz = { pos: [0.9, 0.3, -1.3], yaw: -2.4, lean: 0.15, eyes: 'half', mouth: 'flat', fLw: [0.6, 0.07, -0.9], kLw: [0.5, 0.45, -0.95], fRw: [0.85, 0.07, -0.85], kRw: [0.8, 0.45, -0.75], hLw: [0.55, 0.5, -0.95], hRw: [0.8, 0.5, -0.8] };
    const dark = { pos: [-1.0, 0.3, -1.2], yaw: 2.4, lean: 0.1, eyes: 'sleep', mouth: 'flat', fLw: [-0.7, 0.07, -0.8], kLw: [-0.62, 0.45, -0.85], fRw: [-0.9, 0.07, -0.7], kRw: [-0.85, 0.45, -0.65], hLw: [-0.7, 0.5, -0.85], hRw: [-0.9, 0.5, -0.75] };
    const flick = 1 + S(tt * 23) * 0.1 + S(tt * 37) * 0.06;
    const shadows = [[-3.5, -4.5, 0.4], [3.2, -4.8, -0.3], [-5.0, -1.5, 1.2], [5.0, -1.0, -1.1], [-4.0, 3.0, 2.2]].map(([x, z, yaw], i) => ({ kind: 'shadow', pos: [x, (Math.hypot(x, z) - 6) * 0.2, z], yaw, scale: 1.1 + (i % 2) * 0.3 }));
    return blank({
      env: 'camp', set: 'camp',
      camera: cam([0.2, 4.2, 3.4], [0, 0, -0.3], 50),
      cast: [
        { who: 'megumin', pose: sleeper('megumin', -1.1, 0.6, -0.4, { hat: false, cloak: true }) },
        { who: 'aqua', pose: sleeper('aqua', 1.2, 0.5, 0.6, { faceUp: true }) },
        { who: 'kazumaJ', pose: kaz }, { who: 'darkness', pose: dark }
      ],
      foes: shadows,
      sprites: [
        { kind: 'fire', p: [0, 0.35, 0], size: 0.4 * flick, sy: 1.4, color: [1, 0.75, 0.3], alpha: 1 },
        { kind: 'fire', p: [0.1, 0.3, 0.05], size: 0.3 * flick, sy: 1.6, color: [1, 0.5, 0.2], alpha: 0.9 },
        { kind: 'glow', p: [0, 0.3, 0], size: 1.6 * flick, color: [1, 0.55, 0.2], alpha: 0.45 }
      ].concat(Fx.field(4117, 12, [0, 0.4, 0], [0.8, 2, 0.8], tt, { rise: 0.6, size: 0.02, kind: 'glow', color: [1, 0.6, 0.2] }))
    });
  }

  function lake(t) {
    const tt = t - 41.916;
    const slip = ramp(t, 42.1, 42.9);
    const aqua = {
      pos: [-2.6 + slip * 0.2, Cast.standY('aqua', 0.92) - slip * 0.5, 0.6], yaw: 0.9, lean: 0.4 + slip * 0.4, roll: -slip * 0.3,
      eyes: slip > 0.4 ? 'terror' : 'open', mouth: slip > 0.4 ? 'scream' : 'smile', nk: [-0.1, 0, 0],
      fL: [0.1, -0.7, 0.4 + slip * 0.3], kL: [0.1, 0.3, 1], fR: [-0.1, -0.5, -0.4 - slip * 0.3], kR: [-0.1, 0.4, 1],
      hL: [0.45, 0.1, 0.25], eL: [0.6, -0.2, -0.3], hR: [-0.45, 0.25, 0.1], eR: [-0.6, 0, -0.3]
    };
    const splash = clamp((t - 42.85) / 0.6, 0, 1);
    const cast = [
      { who: 'aqua', pose: aqua },
      { who: 'megumin', pose: at('megumin', 0.2, -2.0, { yaw: 0.6, dy: 0.04, hat: true, cloak: true, eyes: 'open', mouth: 'open', props: [{ kind: 'staffMeg', hand: 'R', dir: [0.1, 1, 0] }] }) },
      { who: 'kazumaJ', pose: at('kazumaJ', 0.55, -1.2, { yaw: 0.2, dy: 0.04, lean: 0.1, eyes: 'open', mouth: 'open' }) },
      { who: 'darkness', pose: at('darkness', 2.6, -0.2, { yaw: -0.35, dy: 0.04, eyes: 'open', mouth: 'smile', hL: [0.12, -0.1, 0.12], hR: [-0.12, -0.1, 0.12] }) }
    ];
    const drops = splash > 0 ? Fx.burst(4211, 30, [-2.6, 0, 0.9], 1.6, splash, { kind: 'puff', size: 0.35, up: true, ys: 1.5, grow: true, color: [0.95, 0.98, 1] }) : [];
    return blank({
      env: 'day', set: 'lake',
      camera: cam([-0.5, 1.0, 4.6], [-0.7, 0.85, 0], 46),
      cast, sprites: drops.concat(Fx.field(4223, 10, [-1, 0.2, 1], [5, 0.6, 2], tt, { rise: 0.15, size: 0.06, kind: 'bubble', alpha: 0.5 }))
    });
  }

  function sunset(t) {
    const tt = t - 43.543;
    const ph = tt * 1.4 * PI * 2;
    const kaz = walker('kazumaJ', -1.4 - tt * 0.5, 0.2, -PI / 2 + 0.3, ph, {
      lean: 0.25, nk: [-0.05, 0.4, 0], eyes: 'half', mouth: 'flat',
      hL: [0.22, -0.32, -0.18], eL: [0.4, 0, -1], hR: [-0.22, -0.32, -0.18], eR: [-0.4, 0, -1]
    });
    const km = Cast.solve('kazumaJ', kaz);
    const back = V3.add(km.pts.chest, [0.05, 0.05, -0.12]);
    const meg = {
      pos: [back[0] + 0.12, back[1] - 0.1, back[2] - 0.2], yaw: -PI / 2 + 0.3, lean: 0.3, hat: true, cloak: true, eyes: 'sleep', mouth: 'flat',
      fLw: [back[0] - 0.05, back[1] - 0.55, back[2] + 0.18], kLw: [back[0] - 0.2, back[1] - 0.25, back[2] + 0.2], fRw: [back[0] - 0.05, back[1] - 0.55, back[2] - 0.32], kRw: [back[0] - 0.2, back[1] - 0.25, back[2] - 0.32],
      hLw: [km.pts.chest[0] - 0.1, km.pts.chest[1] + 0.05, km.pts.chest[2] + 0.12], hRw: [km.pts.chest[0] - 0.1, km.pts.chest[1] + 0.05, km.pts.chest[2] - 0.12]
    };
    return blank({
      env: 'sunset', set: 'sunset',
      camera: cam([-0.4, 0.95, 3.4], [-0.8, 1.15, 0], 48),
      cast: [
        { who: 'kazumaJ', pose: kaz }, { who: 'megumin', pose: meg },
        { who: 'aqua', pose: walker('aqua', 0.8 - tt * 0.4, -0.8, -PI / 2 + 0.6, ph + 1, { eyes: 'sleep', mouth: 'flat', lean: 0.1, hL: [0.1, 0.05, 0.25], hR: [-0.1, 0.05, 0.25] }) },
        { who: 'darkness', pose: walker('darkness', 1.6 - tt * 0.4, -1.0, -PI / 2 + 0.4, ph + 2, { eyes: 'shut', mouth: 'smile', hR: [-0.15, 0.2, 0.25] }) }
      ],
      grade: [1.05, 0.95, 0.95, 0]
    });
  }

  function footstep(t) {
    const tt = t - 44.335;
    const down = ease(clamp(tt / 0.35, 0, 1));
    const pose = at('aqua', 0, 0, {
      yaw: -0.3, dy: 0.0, fR: [-0.08, -0.7 + (1 - down) * 0.12, 0.25], kR: [-0.1, 0, 1], fL: [0.08, -0.82, -0.2], kL: [0.05, 0, 1]
    });
    const ring = clamp((tt - 0.3) / 0.45, 0, 1);
    const rip = [];
    if (ring > 0) {
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * PI * 2;
        [0.25, 0.5].forEach((rr, k) => rip.push({ kind: 'glow', p: [-0.08 + C(a) * rr * (ring + k * 0.3), 0.02, 0.25 + S(a) * rr * (ring + k * 0.3) * 0.7], size: 0.03, color: [0.7, 0.85, 1], alpha: (1 - ring) * 0.7 }));
      }
    }
    return blank({
      env: 'stage', set: 'stage',
      camera: cam([0.35, 0.28, 1.2], [-0.05, 0.2, 0.2], 40),
      cast: [{ who: 'aqua', pose }],
      sprites: rip
    });
  }

  function aquaDancePose(tt) {
    const spin = tt * 1.6;
    const jump = Math.max(0, S((tt - 1.3) * 3.4)) * (tt > 1.3 && tt < 2.25 ? 1 : 0);
    const x = lerp(-1.2, 1.4, ease(clamp(tt / 1.3, 0, 1)));
    const yaw = tt < 1.3 ? 1.4 : -1.0 + S(tt * 2) * 0.4;
    const arm = S(tt * 3.5);
    return at('aqua', x, 0, {
      yaw, dy: jump * 0.25, lean: -0.05, eyes: 'open', mouth: 'smile', nk: [-0.05, 0.2, 0.05],
      hL: [0.55, 0.15 + arm * 0.1, 0.1], eL: [0.5, 0.2, -0.4], hR: [-0.5, 0.25 - arm * 0.1, 0.2], eR: [-0.5, 0.2, -0.4],
      fL: [0.08, -0.8 + jump * 0.2, 0.0], kL: [0.05, 0, 1], fR: [-0.1, -0.55 - (1 - jump) * 0.2, -0.3], kR: [-0.05, 0.6, 1]
    });
  }

  function waterDance(t) {
    const tt = t - 45.086;
    const pose = aquaDancePose(tt);
    const m = Cast.solve('aqua', pose);
    const trail = [];
    for (let i = 0; i < 26; i++) {
      const lag = i * 0.03;
      const p0 = Cast.solve('aqua', aquaDancePose(Math.max(0, tt - lag))).pts.wristR;
      trail.push({ kind: 'bubble', p: [p0[0] - i * 0.04, p0[1] + S(i * 1.7) * 0.05, p0[2] + C(i * 2.3) * 0.05], size: 0.03 + (i % 3) * 0.015, alpha: 1 - i / 26 });
    }
    const cubes = [[-2.2, 2.4, -1.5, 0.35], [-1.6, 1.4, -2.5, 0.12], [2.2, 0.15, 0.6, 0.14], [1.4, 0.1, -0.5, 0.08]].map(([x, y, z, s], i) => ({ p: [x, y + S(tt * 1.5 + i) * 0.05, z], s, ry: tt * 0.6 + i, rx: 0.4 + tt * 0.3 }));
    const streak = tt > 0.3 && tt < 1.2 ? [{ a: [-2, 0.5, 0.5], b: [lerp(-2, 2, (tt - 0.3) / 0.9), 1.0, 0.3], w: 0.03, color: [0.6, 1, 0.9], alpha: 0.8, tex: 'streakTex' }] : [];
    return blank({
      env: 'stage', set: 'stage', world: { t },
      camera: cam([0.2, 1.05, 3.3], [0.2, 0.92, 0], 46),
      cast: [{ who: 'aqua', pose }],
      cubes, lines: streak,
      sprites: trail.concat(Fx.field(4501, 30, [0, 0.2, -1], [6, 3, 4], tt, { size: 0.015, kind: 'spark', color: [0.6, 0.8, 1], twinkle: true, alpha: 0.7 })),
      vignette: 0.3
    });
  }

  function aquaSpin(t) {
    const tt = t - 48.756;
    const step = Math.floor(tt / 0.083);
    const ang = [0.9, 2.2, 3.0, -1.2, -1.0, -0.9, -0.85, -0.8, -0.75, -0.7][Math.min(step, 9)];
    const pose = at('aqua', 0, 0, {
      yaw: 0, nk: [0.05, 0.1, 0.05], eyes: step > 3 ? 'half' : 'open', mouth: step > 3 ? 'smile' : 'open',
      hLw: [0.08, 1.15, 0.22], hRw: [-0.06, 1.12, 0.24], eL: [0.4, -0.3, -0.5], eR: [-0.4, -0.3, -0.5]
    });
    const d = 0.75;
    const eye = [S(ang) * d, 1.42, C(ang) * d];
    const bub = Fx.field(4871, 26, [0, 1.1, 0], [1.2, 0.8, 1.2], tt, { rise: 0.2, size: 0.03, kind: 'bubble', alpha: 0.8 });
    return blank({ env: 'stage', set: 'stage', camera: cam(eye, [0, 1.36, 0], 42), cast: [{ who: 'aqua', pose }], sprites: bub, vignette: 0.3 });
  }

  function aquaArms(t) {
    const tt = t - 49.507;
    const open = ease(clamp(tt / 0.15, 0, 1));
    const pose = at('aqua', 0, 0, {
      yaw: 0.35, nk: [-0.05, -0.2, 0], eyes: 'half', mouth: 'smile',
      hL: [lerp(0.3, 0.72, open), 0.25, 0.12], eL: [0.5, 0, -0.4], hR: [lerp(-0.3, -0.72, open), 0.25, 0.18], eR: [-0.5, 0, -0.4]
    });
    const k = clamp((tt - 0.12) / 0.35, 0, 1);
    const bubbles = Fx.burst(4951, 60, [-0.7, 1.2, 0.3], 1.4, k, { kind: 'bubble', size: 0.12, grow: true, zs: 2.2, alpha: 0.9 }).map(b => Object.assign(b, { p: [b.p[0], b.p[1], b.p[2] + k * 1.2] }));
    return blank({ env: 'stage', set: 'stage', camera: cam([-0.35, 1.3, 1.9], [-0.1, 1.2, 0], 44), cast: [{ who: 'aqua', pose }], sprites: bubbles, vignette: 0.3 });
  }

  function chestPose(t) {
    const press = ease(clamp((t - 50.8) / 0.5, 0, 1));
    return at('kazumaJ', 0, 0, {
      yaw: 0, nk: [0.1, 0, 0], eyes: 'shut', mouth: 'flat',
      hRw: [lerp(-0.25, -0.04, press), lerp(0.85, 1.14, press), lerp(0.3, 0.17, press)], eRw: [-0.3, 0.95, 0.1], wR: [0.5, 0, 0.2],
      hL: [0.2, -0.25, 0.03]
    });
  }

  function bubbleChest(t) {
    const tt = t - 50.0;
    const clear = ease(clamp(tt / 0.7, 0, 1));
    const g = rand(5003);
    const bubbles = [];
    for (let i = 0; i < 46; i++) {
      const a = g() * PI * 2, rr = g() * 0.5;
      bubbles.push({ kind: 'bubble', p: [C(a) * rr * (1 + clear * 1.5), 1.1 + S(a) * rr * 0.6 * (1 + clear * 1.5), 0.25 + g() * 0.1], size: (0.05 + g() * 0.1) * (1 - clear * 0.6), alpha: (1 - clear) * 0.9 });
    }
    return blank({ env: 'day', set: 'none', bg: [0.05, 0.06, 0.08], camera: cam([0, 1.13, 0.5], [0, 1.11, 0], 36), cast: [{ who: 'kazumaJ', pose: chestPose(t) }], sprites: bubbles, vignette: 0.2 });
  }

  function chestHand(t) {
    const tt = t - 51.175;
    const glow = ramp(t, 51.9, 52.9);
    return blank({
      env: 'day', set: 'none', bg: [0.08, 0.08, 0.1],
      camera: cam([0.02, 1.13, 0.5 - tt * 0.02], [0, 1.11, 0], 36),
      cast: [{ who: 'kazumaJ', pose: chestPose(t) }],
      sprites: [{ kind: 'glow', p: [0, 1.1, 0.2], size: 0.1 + glow * 0.9, color: [1, 0.8, 0.5], alpha: glow }],
      flash: glow * 0.55, flashColor: [1, 0.85, 0.6], vignette: 0.2
    });
  }

  window.KonopAct2 = { aquaGrass, barn, kazumaKnife, aquaStaff, trollChase, lyingField, guildWaitress, meguminEat, darknessStreet, castleDance, dungeon, campfire, lake, sunset, footstep, waterDance, aquaSpin, aquaArms, bubbleChest, chestHand };
})();
