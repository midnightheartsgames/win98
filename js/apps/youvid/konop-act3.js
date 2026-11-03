(function () {
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const { V3, rand } = window.P3D;
  const Sh = window.KonopShots;
  const Fx = window.KonopFx;
  const Cast = window.KonopCast;
  const { blank, cam, at, blinkAt, runner, walker } = Sh;

  const ramp = (t, a, b) => ease((t - a) / (b - a));
  const hop = (t, t0, d, h) => (t > t0 && t < t0 + d ? S(((t - t0) / d) * PI) * h : 0);

  function sparkSky(seed, tt, center, size, n, col) {
    return Fx.field(seed, n || 70, center, size, tt, { size: 0.03, kind: 'spark', color: col || [1, 1, 1], twinkle: true, sway: 0.2, drift: [0.15, 0, 0] });
  }

  function aquaSkyBack(t) {
    const tt = t - 52.969;
    const pose = at('aqua', 0.6, 0, { yaw: PI - 0.4, nk: [-0.2, 0.1, 0], hL: [0.3, -0.1, -0.05], hR: [-0.3, -0.1, -0.05] });
    return blank({
      env: 'bright', set: 'sky', world: { sky: 'skyBright', spin: 0.8 },
      camera: cam([-0.35, 1.3, 3.0], [0.05, 1.45, 0], 44),
      cast: [{ who: 'aqua', pose }],
      sprites: sparkSky(5301, tt, [0, 1.5, -1], [7, 4, 4], 90),
      grade: [1.06, 1.06, 1.08, 0]
    });
  }

  function aquaShout(t) {
    const shout = t > 53.63;
    const pose = at('aqua', 0, 0, {
      yaw: -0.35, lean: -0.08, nk: [shout ? -0.15 : 0.05, -0.15, shout ? 0.05 : 0.2], eyes: shout ? 'open' : 'shut', mouth: shout ? 'scream' : 'smile',
      hL: shout ? [0.7, 0.35, -0.05] : [0.3, 0.0, 0.1], eL: [0.6, 0, -0.4], hR: shout ? [-0.7, 0.35, -0.05] : [-0.3, 0.0, 0.1], eR: [-0.6, 0, -0.4]
    });
    return blank({
      env: 'bright', set: 'sky', world: { sky: 'skyBright', spin: 1.6 },
      camera: cam([-0.4, 1.38, 0.9], [-0.05, 1.32, 0], 50),
      cast: [{ who: 'aqua', pose }],
      sprites: sparkSky(5361, t - 53.553, [0, 1.3, -0.5], [3, 2, 2], 50)
    });
  }

  function dagger(t) {
    const tt = t - 53.97;
    const up = ease(clamp(tt / 0.3, 0, 1));
    const pose = at('kazuma', 0, 0, {
      yaw: PI - 0.3, nk: [-0.4, 0, 0],
      hRw: [-0.25, lerp(1.4, 1.95, up), 0.15], eRw: [-0.5, 1.4, 0.2],
      props: [{ kind: 'dagger', hand: 'R', dir: [0.15, 1, -0.2] }]
    });
    return blank({
      env: 'bright', set: 'sky', world: { sky: 'skyDay', spin: 2.4 },
      camera: cam([-0.32, 1.28, 0.42], [-0.2, 2.0, -0.12], 62),
      cast: [{ who: 'kazuma', pose }],
      sprites: sparkSky(5397, tt, [0, 2.2, -1], [3, 2, 2], 40)
    });
  }

  function kazumaPoint(t) {
    const tt = t - 54.387;
    const pose = at('kazuma', 0, 0, {
      yaw: 0.35, lean: 0.06, nk: [0, -0.3, 0], eyes: 'open', mouth: 'open', gaze: [0.4, 0],
      hLw: [0.78, 1.25, 0.55], eLw: [0.5, 1.2, 0.1], wL: [0, 0, 0],
      hR: [-0.18, -0.12, 0.12], eR: [-0.5, 0, -0.5],
      props: [{ kind: 'sword', hand: 'R', dir: [0.15, -1, 0.35] }]
    });
    return blank({
      env: 'waste', set: 'waste',
      camera: cam([-0.15, 1.3, 1.55 - tt * 0.15], [0.12, 1.15, 0], 46),
      cast: [{ who: 'kazuma', pose }],
      sprites: Fx.field(5439, 16, [0, 0.6, 0], [5, 2, 3], tt, { size: 0.03, kind: 'glow', color: [1, 0.7, 0.3], rise: 0.2, alpha: 0.6 })
    });
  }

  function smallRocks(seed, n, center, spread) {
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < n; i++) out.push({ kind: 'rockSmall', pos: [center[0] + (g() - 0.5) * spread[0], 0, center[2] + (g() - 0.5) * spread[1]], yaw: (g() - 0.5) * 1.2, scale: 0.9 + g() * 0.6 });
    return out;
  }

  function golem(t) {
    const tt = t - 55.096;
    const dark = at('darkness', -1.5, 0.4, { yaw: PI + 0.5, lean: 0.1, eyes: 'open', mouth: 'open', hRw: [-1.3, 1.7, 0.2], eRw: [-1.6, 1.3, 0.3], props: [{ kind: 'greatsword', hand: 'R', dir: [0.3, 0.9, -0.2] }] });
    const kaz = runner('kazuma', 0.0, -0.3 - tt * 0.6, PI, tt * 2.6 * PI * 2, { eyes: 'open', mouth: 'open' });
    const aqua = at('aqua', 1.25, 0.2, { yaw: PI - 0.4, lean: -0.05, hL: [0.5, 0.2, -0.1], hR: [-0.5, 0.2, -0.1] });
    const aura = Fx.field(5509, 60, [-1.5, 1.0, 0.4], [1.2, 2, 0.8], tt, { size: 0.025, kind: 'spark', color: [1, 0.8, 0.3], rise: 0.4, twinkle: true });
    const fire = [0, 1, 2].map(i => ({ kind: 'fire', p: [2.55, 1.8 + i * 0.12, 0.6], size: 0.16 + i * 0.03, sy: 1.6, color: [1, 0.6, 0.2], alpha: 0.9 }));
    return blank({
      env: 'waste', set: 'waste', world: { sky: 'skyDay' },
      camera: cam([0.35, 0.6, 4.4], [0.0, 2.8, -4], 60),
      cast: [{ who: 'darkness', pose: dark }, { who: 'kazuma', pose: kaz }, { who: 'aqua', pose: aqua }],
      foes: [{ kind: 'golem', pos: [0, 0, -7.5], yaw: 0, scale: 1.15 }].concat(smallRocks(5511, 9, [0, 0, -2.2], [7, 3])),
      sprites: aura.concat(fire, [{ kind: 'glow', p: [2.55, 2.0, 0.6], size: 0.7, color: [1, 0.5, 0.2], alpha: 0.6 }])
    });
  }

  function golemHead(t) {
    const tt = t - 56.18;
    return blank({
      env: 'waste', set: 'sky', world: { sky: 'skyDay', spin: 0.4 },
      camera: cam([-0.6 + tt * 0.6, -1.2, 4.2 - tt * 0.6], [0.2, 0.4, 0], 50),
      foes: [{ kind: 'golemHead', pos: [0, 0, 0], yaw: 0.2, scale: 1.0 }],
      speed: tt > 0.3 ? (tt - 0.3) * 2.5 : 0, speedRot: 0.8
    });
  }

  function darknessCharge(t) {
    const tt = t - 56.681;
    const d = [1.8, 1.05, 0.62, 0.36][Math.min(3, Math.floor(tt / 0.104))];
    const pose = at('darkness', 0, 0, {
      yaw: 0.45, lean: 0.08, sp: [0.05, -0.2, 0], nk: [-0.12, -0.25, 0.05], eyes: 'open', mouth: 'scream', gaze: [-0.3, 0],
      hRw: [-0.45, 1.6, -0.2], eRw: [-0.6, 1.3, -0.2], hLw: [-0.25, 1.55, -0.15],
      props: [{ kind: 'greatsword', hand: 'R', dir: [0.4, 0.9, -0.3] }]
    });
    return blank({
      env: 'waste', set: 'waste',
      camera: cam([-0.1 * d, 1.42, d + 0.12], [0.08, 1.42, 0.12], 46),
      cast: [{ who: 'darkness', pose }],
      speed: 0.4, speedRot: 0
    });
  }

  function darknessSwing(t) {
    const tt = t - 57.098;
    const phase = tt < 0.083 ? 0 : tt < 0.2 ? 1 : 2;
    const swing = ease(clamp((tt - 0.08) / 0.3, 0, 1));
    const pose = at('darkness', 0, 0, {
      yaw: phase === 0 ? -0.9 : 2.4, lean: 0.2, sp: [0.1, lerp(0.6, -0.8, swing), 0], nk: [0, phase === 0 ? 0.3 : -0.2, 0], eyes: 'open', mouth: phase === 0 ? 'scream' : 'grit',
      hRw: phase === 0 ? [-0.3, 1.5, 0.2] : V3.add([0, 1.35, 0], [lerp(-0.5, 0.6, swing), lerp(0.3, -0.1, swing), lerp(-0.4, 0.5, swing)]), eRw: [0, 1.3, -0.3],
      props: [{ kind: 'greatsword', hand: 'R', dir: [lerp(-0.3, 1, swing), lerp(0.8, -0.1, swing), lerp(-0.5, 0.5, swing)] }]
    });
    const red = t > 57.26 && t < 57.31 ? 0.55 : 0;
    const eye = phase === 0 ? [-0.55, 1.5, 0.55] : [-1.1, 1.0, -1.3];
    return blank({
      env: 'waste', set: 'waste',
      camera: cam(eye, [0, 1.35, 0], phase === 0 ? 44 : 52),
      cast: [{ who: 'darkness', pose }],
      foes: phase === 2 ? [{ kind: 'debris', pos: [-1.0, 1.4, -0.9], scale: 1.3, yaw: 0.5 }] : [],
      lines: phase === 2 ? [{ a: [-1.2, 1.8, 0.6], b: [1.2, 0.8, -0.4], w: 0.12, color: [1, 0.6, 0.9], alpha: 0.9, tex: 'streakTex' }] : [],
      flash: red, flashColor: [1, 0.15, 0.1]
    });
  }

  function darknessMiss(t) {
    const tt = t - 57.682;
    const swing = ease(clamp(tt / 0.4, 0, 1));
    const pose = at('darkness', 0.4, 0, {
      yaw: -0.6, lean: 0.25, sp: [0.1, lerp(-0.6, 0.7, swing), 0], eyes: 'open', mouth: 'grit',
      hRw: V3.add([0.4, 1.3, 0], [lerp(0.6, -0.6, swing), lerp(0.4, 0.0, swing), lerp(0.3, 0.5, swing)]), eRw: [0.6, 1.2, -0.3],
      props: [{ kind: 'greatsword', hand: 'R', dir: [lerp(0.7, -1, swing), lerp(0.6, -0.2, swing), lerp(0.2, 0.5, swing)] }]
    });
    const arc = [];
    for (let i = 0; i < 8; i++) {
      const a0 = lerp(0.3, -2.4, i / 8 * swing), a1 = lerp(0.3, -2.4, (i + 1) / 8 * swing);
      arc.push({ a: [0.4 + C(a0) * 1.3, 1.3 + S(a0) * 0.5, 0.3], b: [0.4 + C(a1) * 1.3, 1.3 + S(a1) * 0.5, 0.3], w: 0.08, color: [1, 0.9, 1], alpha: 0.85, tex: 'streakTex' });
    }
    return blank({
      env: 'waste', set: 'waste',
      camera: cam([-0.9 + tt * 0.4, 1.5, 2.6], [0.3, 1.35, 0], 52),
      cast: [{ who: 'darkness', pose }],
      foes: [{ kind: 'debris', pos: [-1.3, 2.3 - tt * 0.3, 1.2], scale: 2.2, yaw: tt }],
      lines: arc,
      sprites: Fx.burst(5771, 18, [0.4, 1.2, 0.3], 1.2, clamp(tt / 0.6, 0, 1), { kind: 'glow', size: 0.04, color: [1, 0.6, 0.2], fade: true })
    });
  }

  function rockComic(t) {
    const tt = t - 58.683;
    const jump = hop(t, 58.75, 0.7, 0.55) + hop(t, 59.9, 0.6, 0.45) + hop(t, 60.75, 0.75, 0.6);
    const flail = S(tt * 9);
    const glow = ramp(t, 61.3, 62.2);
    const kaz = at('kazuma', 0.25, 0.4, {
      yaw: -0.35, dy: jump, lean: -0.1, nk: [-0.2, 0.3, 0.1], eyes: 'shock', mouth: 'scream',
      hRw: [0.05, 2.0 + jump, 0.4], eRw: [-0.2, 1.6 + jump, 0.4], hL: [0.45, 0.1 + flail * 0.1, 0.2], eL: [0.6, 0, -0.3],
      fL: [0.1, -0.6 - (jump > 0.1 ? 0 : 0.2), 0.25], kL: [0.1, 0.3, 1], fR: [-0.08, -0.75, -0.15], kR: [-0.05, 0, 1],
      props: [{ kind: 'sword', hand: 'R', dir: [-0.15, 1, -0.1] }]
    });
    const aqua = at('aqua', 2.0, -1.2, { yaw: -0.3, eyes: 'shut', mouth: 'happy', dy: hop(frac(tt * 1.6), 0, 0.5, 0.1), hL: [0.2, 0.62, 0.05], eL: [0.4, 0.3, -0.2], hR: [-0.2, 0.62, 0.05], eR: [-0.4, 0.3, -0.2] });
    return blank({
      env: 'waste', set: 'waste',
      camera: cam([0.1, 1.15, 4.6], [0.2, 1.05, 0], 46),
      cast: [{ who: 'kazuma', pose: kaz }, { who: 'aqua', pose: aqua }],
      foes: [{ kind: 'rockBig', pos: [-1.35, 0, 0.2], yaw: 0.25, scale: 1.15, glow }, { kind: 'rockSmall', pos: [1.0, 0, -0.3], yaw: -0.3, scale: 1.6 }].concat(smallRocks(5869, 6, [1.6, 0, -1.8], [4, 2])),
      sprites: glow > 0 ? [{ kind: 'glow', p: [-1.35, 1.0, 1.0], size: 1.2 * glow, color: [1, 0.9, 0.3], alpha: glow * 0.8 }] : []
    });
  }

  function explosionSmoke(t) {
    const tt = t - 62.27;
    const flash = 1 - ease(clamp(tt / 0.3, 0, 1));
    const k = clamp(tt / 1.0, 0, 1);
    const smoke = Fx.burst(6227, 26, [0, 1.0, -1], 2.4, 0.4 + k * 0.6, { kind: 'smoke', size: 0.9, grow: true, up: true, ys: 0.8, color: [0.5, 0.48, 0.46] });
    const sparks = Fx.burst(6229, 40, [0, 1.0, -1], 4, k, { kind: 'glow', size: 0.06, color: [1, 0.6, 0.2], up: true, grav: 1.0 });
    return blank({
      env: 'waste', set: 'waste',
      camera: cam([0.2, 1.2, 4.8], [0, 1.2, -1], 48),
      sprites: smoke.concat(sparks, [{ kind: 'glow', p: [0, 1, -1], size: 3 * flash + 0.5, color: [1, 0.9, 0.4], alpha: flash }]),
      flash: flash * 0.9, flashColor: [1, 0.95, 0.7]
    });
  }

  function darknessPass(t) {
    const tt = t - 62.75;
    const y = lerp(0.4, 2.6, ease(clamp(tt / 0.6, 0, 1)));
    const pose = {
      pos: [0.15, y, 0], up: [0.35, 0.9, 0.2], fwd: [-0.2, 0.2, 1], eyes: 'open', mouth: 'open', nk: [-0.3, 0.2, 0],
      hLw: [0.6, y + 0.7, 0.1], hRw: [-0.5, y + 0.6, 0.2], fLw: [0.3, y - 0.8, -0.2], fRw: [-0.1, y - 0.85, 0.1]
    };
    return blank({
      env: 'bright', set: 'sky', world: { sky: 'skyDay', spin: 2.4 },
      camera: cam([0.0, 0.9, 1.0], [0.1, 2.4, -0.3], 58),
      cast: [{ who: 'darkness', pose }],
      foes: debrisField(6275, 8, [0, 2.5, -3], [6, 4, 4], tt)
    });
  }

  function darknessBlown(t) {
    const tt = t - 63.354;
    const pose = {
      pos: [0, 1.6 + tt * 1.5, 0], up: [0.6, 0.7, 0.3], fwd: [0, 0.3, 1], eyes: 'shut', mouth: 'scream',
      hLw: [0.5, 2.4 + tt * 1.5, 0.2], hRw: [-0.4, 2.4 + tt * 1.5, 0.3],
      fLw: [-0.6, 0.9 + tt * 1.5, 0.2], fRw: [-0.4, 0.8 + tt * 1.5, -0.2]
    };
    return blank({
      env: 'bright', set: 'sky', world: { sky: 'skyDay', spin: 3.0 },
      camera: cam([0.2, 0.2 + tt, 2.6], [0, 2.0 + tt * 1.5, 0], 56),
      cast: [{ who: 'darkness', pose }],
      foes: [{ kind: 'debris', pos: [0.6, 4.2 + tt * 1.2, -1], scale: 4.5, yaw: tt }],
      speed: 0.8, speedRot: 1.4
    });
  }

  function debrisField(seed, n, center, spread, tt) {
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < n; i++) out.push({ kind: 'debris', pos: [center[0] + (g() - 0.5) * spread[0] + tt * (g() - 0.5) * 2, center[1] + (g() - 0.5) * spread[1] + tt * 1.5, center[2] - g() * spread[2]], yaw: tt * (g() + 0.5) * 2, pitch: tt * g(), scale: 0.3 + g() * 1.6 });
    return out;
  }

  function skyFall(t) {
    const tt = t - 63.688;
    const kaz = {
      pos: [0.4 + tt * 0.3, 1.4 + tt * 0.5, -4], up: [S(tt * 3), C(tt * 3), 0.2], fwd: [0, 0, 1], eyes: 'shock', mouth: 'scream', cloak: true,
      hLw: [1.0, 1.8, -4], hRw: [-0.2, 1.7, -4], fLw: [0.6, 0.6, -4], fRw: [0.2, 0.7, -3.8]
    };
    const darkIn = ramp(t, 63.95, 64.4);
    const dark = { pos: [lerp(4, 1.6, darkIn), 1.7 + tt * 0.4, -4.2], up: [-0.5, 0.8, 0], fwd: [-0.6, 0, 0.7], eyes: 'open', mouth: 'open', hLw: [0.8 + lerp(4, 1.6, darkIn) - 1.6, 2.1, -4], props: [{ kind: 'greatsword', hand: 'R', dir: [1, 0.2, 0] }] };
    return blank({
      env: 'bright', set: 'sky', world: { sky: 'skyDay', spin: 2.6 },
      camera: cam([0, 1.5, 4], [0.4, 1.7, -4], 46),
      cast: [{ who: 'kazuma', pose: kaz }].concat(darkIn > 0 ? [{ who: 'darkness', pose: dark }] : []),
      foes: debrisField(6369, 16, [0, 1.5, -2], [10, 5, 8], tt)
    });
  }

  function darknessFly(t) {
    const tt = t - 64.606;
    const k = tt / 1.584;
    const roll = S(tt * 2.2) * 0.6;
    const dark = {
      pos: [0, 1.6, 0], up: [S(roll), C(roll), 0.1], fwd: [-0.3, 0, 1], eyes: 'open', mouth: k > 0.6 ? 'open' : 'smile', nk: [0, 0.2, 0],
      hLw: [0.5, 1.9, 0.2], hRw: [-0.6, 2.0, -0.2], fLw: [0.3, 0.8, -0.4], fRw: [0.0, 0.9, -0.6],
      props: [{ kind: 'greatsword', hand: 'R', dir: [-0.8, 0.6, -0.2] }]
    };
    const kazIn = ramp(t, 65.5, 65.75);
    const kaz = { pos: [lerp(-2, -0.8, kazIn), 1.4, -0.5], up: [0.4, 0.9, 0], fwd: [0.3, 0, 1], eyes: 'shock', mouth: 'grit', cloak: true, hLw: [0.2, 1.9, -0.3], hRw: [-1.4, 1.6, -0.4] };
    const close = t > 65.93;
    const eye = close ? [-0.95, 1.95, 0.35] : [0.25 + S(tt * 1.5) * 0.2, 1.7, 1.4 - k * 0.4];
    const atp = close ? [-0.8, 1.92, -0.4] : [-0.2 * kazIn, 1.6, 0];
    return blank({
      env: 'bright', set: 'sky', world: { sky: 'skyDay', spin: 2.9 },
      camera: cam(eye, atp, close ? 30 : 46),
      cast: [{ who: 'darkness', pose: dark }].concat(kazIn > 0 ? [{ who: 'kazuma', pose: kaz }] : []),
      foes: debrisField(6461, 10, [0, 1.5, -3], [8, 4, 6], tt)
    });
  }

  function meguminCliff(t) {
    const tt = t - 66.19;
    const pose = at('megumin', 0, 0, {
      yaw: PI + 0.25, hat: true, cloak: true, nk: [-0.1, 0, 0],
      hRw: [-0.3, 1.55, 0.05], eRw: [-0.45, 1.2, 0.15], hL: [0.18, -0.2, 0.05],
      props: [{ kind: 'staffMeg', hand: 'R', dir: [0.15, 1, -0.2] }]
    });
    const dust = Fx.field(6619, 20, [0, -2, -14], [20, 4, 8], tt, { size: 1.6, kind: 'dust', drift: [0.6, 0, 0], alpha: 0.85 });
    return blank({
      env: 'waste', set: 'cliff', world: { sky: 'skyDay' },
      camera: cam([0.9, 1.2, 4.4], [-0.3, 0.9, -6], 46),
      cast: [{ who: 'megumin', pose }],
      sprites: dust
    });
  }

  function meguminFace(t) {
    const pose = at('megumin', 0, 0, { yaw: -0.7, hat: true, cloak: true, nk: [0.1, -0.1, 0], eyes: 'half', mouth: 'flat' });
    return blank({ env: 'waste', set: 'cliff', world: { sky: 'skyDay' }, camera: cam([-0.25, 1.24, 0.42], [0.0, 1.24, 0], 40), cast: [{ who: 'megumin', pose }], grade: [0.9, 0.85, 1.0, 0] });
  }

  function meguminCast(t) {
    const tt = t - 67.275;
    const raise = ease(clamp(tt / 0.4, 0, 1));
    const pose = at('megumin', 0, 0, {
      yaw: -0.5, lean: -0.05, hat: true, cloak: true, nk: [-0.1, -0.2, 0], eyes: 'open', mouth: 'open',
      hRw: [-0.05, lerp(1.2, 1.55, raise), 0.35], hLw: [0.2, lerp(1.1, 1.4, raise), 0.35],
      props: [{ kind: 'staffMeg', hand: 'R', dir: [-0.8, 0.5, 0.2] }]
    });
    const streaks = [];
    const g = rand(6727);
    for (let i = 0; i < 14; i++) {
      const y = 0.2 + g() * 2.2, z = -0.5 - g() * 1.5, len = 1 + g() * 2;
      const x = -2 + frac(g() + tt * 1.5) * 4;
      streaks.push({ a: [x, y, z], b: [x + len, y + len * 0.45, z], w: 0.04 + g() * 0.06, color: [0.5, 0.4, 1.0], alpha: 0.8, tex: 'streakTex' });
    }
    return blank({
      env: 'bright', set: 'sky', world: { sky: 'skyDay', spin: 0.5, skyTint: [0.45, 0.4, 1.0] },
      camera: cam([0.55, 1.15, 1.6], [0.0, 1.2, 0], 50),
      cast: [{ who: 'megumin', pose }],
      lines: streaks,
      sprites: [{ kind: 'glow', p: [-0.6, 1.9, 0.6], size: 0.25, color: [1, 1, 1], alpha: 0.9 }],
      grade: [1.0, 0.9, 1.1, 0]
    });
  }

  function aquaNight(t) {
    const tt = t - 67.942;
    const pose = {
      pos: [0, 0.3, 0], yaw: PI - 0.5, lean: 0.05, eyes: 'open', mouth: 'open',
      fLw: [0.35, 0.07, -0.35], kLw: [0.35, 0.3, -0.5], fRw: [-0.2, 0.07, 0.3], kRw: [-0.4, 0.35, 0.1],
      hLw: [0.25, 0.08, 0.15], hRw: [-0.3, 0.08, 0.2]
    };
    const tw = 0.6 + 0.4 * S(tt * 18);
    return blank({
      env: 'night', set: 'cliff', world: { sky: 'skyNight', pano: 'panoNight', spin: 0.4 },
      camera: cam([-0.55, 0.78, 1.25], [0.5, 0.95, -2.5], 52),
      cast: [{ who: 'aqua', pose }],
      sprites: [{ kind: 'cross', p: [3.6, 3.6, -9], size: 2.4 * tw, color: [1, 1, 1], alpha: 1 }, { kind: 'glow', p: [3.6, 3.6, -9], size: 0.8, color: [0.8, 0.9, 1], alpha: 0.9 }],
      grade: [0.8, 0.9, 1.15, 0]
    });
  }

  function circleStack(k, center, tilt) {
    const out = [];
    for (let i = 0; i < 5; i++) {
      const ki = clamp(k * 1.6 - i * 0.15, 0, 1);
      if (ki <= 0) continue;
      out.push({ p: [center[0], center[1] + i * 14, center[2]], r: (30 - i * 4) * ease(ki), yaw: 0.5, tilt: tilt || 0, spin: k * (i % 2 ? 1 : -1) * 0.8, alpha: ki, color: [1, 0.75, 0.5] });
    }
    return out;
  }

  function circles(t) {
    const tt = t - 68.484;
    const k = clamp(tt / 1.4, 0, 1);
    return blank({
      env: 'storm', set: 'valley',
      camera: cam([-50, 18, 30], [0, 40, -110], 50, { far: 900, up: [0.35, 0.94, 0] }),
      circles: circleStack(k, [0, 18, -110], 0.55).map(c => Object.assign(c, { r: c.r * 1.6 })),
      sprites: Fx.field(6849, 30, [0, 30, -110], [80, 80, 40], tt, { size: 0.8, kind: 'glow', color: [1, 0.6, 0.2], rise: 6, alpha: 0.6 }),
      grade: [1.0, 0.92, 0.85, 0]
    });
  }

  function pillar(t) {
    const tt = t - 69.986;
    return blank({
      env: 'storm', set: 'valley',
      camera: cam([0, 22, 60], [0, 55, -110], 50, { far: 900 }),
      circles: circleStack(1, [0, 18, -110], 0.7).map(c => Object.assign(c, { r: c.r * 1.5 })),
      pillars: [{ p: [0, -10, -110], r: 6 + tt * 10, h: 140, color: [1, 0.8, 0.4], alpha: 0.7 }],
      grade: [1.05, 0.9, 0.8, 0]
    });
  }

  function blast(t) {
    const tt = t - 70.361;
    const k = ease(clamp(tt / 0.6, 0, 1));
    const white = ramp(t, 70.75, 71.1);
    return blank({
      env: 'storm', set: 'valley',
      camera: cam([0, 30, 180], [0, 30, -160], 46, { far: 900 }),
      domes: [{ p: [0, 0, -160], r: 20 + k * 110, squash: 0.85, color: [1, 0.7, 0.25], alpha: 1 }, { p: [0, 0, -160], r: 10 + k * 70, color: [1, 1, 0.8], alpha: 1 }],
      circles: tt < 0.3 ? circleStack(1, [0, 20, -160], 0.7) : [],
      flash: white, flashColor: [1, 0.95, 0.55]
    });
  }

  function aftermath(t) {
    const tt = t - 71.237;
    const clear = ramp(t, 71.3, 72.6);
    const dark = Sh.lieDown('darkness', -2.0, 1.4, -1.0, { eyes: 'shut', mouth: 'flat' });
    const aqua = Sh.lieDown('aqua', -0.6, 0.9, -2.2, { eyes: 'sleep', mouth: 'open' });
    const meg = Sh.lieDown('megumin', 0.9, 1.0, -1.4, { hat: true, cloak: true, eyes: 'shut', mouth: 'flat', props: [{ kind: 'staffMeg', pos: [1.1, 0.06, 1.5], dir: [1, 0.05, -0.6] }] });
    const kaz = Sh.lieDown('kazuma', -1.2, -6.0, 0.8, { eyes: 'shut', mouth: 'flat' });
    return blank({
      env: 'waste', set: 'waste', world: { sky: 'skyDay' },
      camera: cam([0.5, 1.7, 5.6], [-0.6, 0.4, -2], 46),
      cast: [{ who: 'darkness', pose: dark }, { who: 'aqua', pose: aqua }, { who: 'megumin', pose: meg }, { who: 'kazuma', pose: kaz }],
      sprites: Fx.field(7123, 18, [0, 0.5, -3], [16, 3, 10], tt, { size: 2.2, kind: 'dust', drift: [0.4, 0, 0], alpha: 0.55 * (1 - clear * 0.6) }),
      flash: (1 - clear) * 0.35, flashColor: [0.95, 0.9, 0.8]
    });
  }

  function lyingClose(t) {
    const tt = t - 73.072;
    const aquaUp = ramp(t, 73.75, 74.05);
    const darkUp = ramp(t, 74.9, 75.4);
    const meg = Sh.lieDown('megumin', -0.75, 0.55, -1.75, { hat: true, cloak: true, eyes: 'shut', mouth: 'flat' });
    const aqua = aquaUp < 0.05
      ? Sh.lieDown('aqua', 0.1, -0.1, -1.4, { eyes: 'shut', mouth: 'flat' })
      : {
        pos: [0.15, lerp(0.3, 0.5, aquaUp), -0.25], yaw: -0.2, lean: lerp(0.6, -0.05, aquaUp), eyes: 'cry', mouth: 'scream', nk: [-0.25, 0, 0.1],
        fLw: [0.35, 0.07, 0.2], kLw: [0.3, 0.3, 0.3], fRw: [-0.05, 0.07, 0.25], kRw: [-0.05, 0.3, 0.35],
        hLw: [0.55, 0.85, -0.1], eLw: [0.6, 0.6, -0.3], hRw: [-0.28, 0.55, 0.0]
      };
    const dark = darkUp < 0.05
      ? Sh.lieDown('darkness', 1.15, -0.35, -0.9, { eyes: 'shut', mouth: 'flat' })
      : {
        pos: [1.2, lerp(0.25, 0.42, darkUp), -0.45], yaw: -0.55, lean: lerp(0.5, 0.1, darkUp), eyes: 'shut', mouth: 'happy', blush: true,
        fLw: [1.45, 0.07, -0.05], kLw: [1.5, 0.3, 0.05], fRw: [1.05, 0.07, -0.0], kRw: [1.0, 0.3, 0.1],
        hRw: [0.95, 0.85, -0.05], eRw: [1.0, 0.6, -0.3], thumbR: [0, 1, 0], glove: true, hLw: [1.45, 0.3, -0.3]
      };
    return blank({
      env: 'waste', set: 'waste', world: { sky: 'skyDay' },
      camera: cam([0.0, 0.42, 2.7], [0.2, 0.55, 0], 44),
      cast: [{ who: 'megumin', pose: meg }, { who: 'aqua', pose: aqua }, { who: 'darkness', pose: dark }],
      sprites: aquaUp > 0.5 ? Fx.burst(7407, 6, [0.15, 1.2, -0.1], 0.3, frac(tt * 2), { kind: 'glow', size: 0.02, color: [0.7, 0.9, 1], grav: 0.5 }) : []
    });
  }

  function kazumaSmile(t) {
    const tt = t - 76.826;
    const open = t > 77.75;
    const thumb = ramp(t, 77.8, 78.15);
    const pose = at('kazuma', 0, 0, {
      yaw: -0.45, nk: [0.05, open ? -0.15 : -0.3, open ? -0.05 : 0.1], eyes: open ? 'half' : 'shut', mouth: open ? 'smirk' : 'flat', blush: true, gaze: [-0.4, 0],
      hRw: [lerp(-0.25, -0.05, thumb), lerp(0.9, 1.25, thumb), lerp(0.1, 0.38, thumb)], eRw: [-0.35, 1.0, 0.1], thumbR: thumb > 0.5 ? [0, 1, 0] : null
    });
    return blank({
      env: 'waste', set: 'waste', world: { sky: 'skyDay', panoSpin: 1.2 },
      camera: cam([-0.62, 1.4, 1.0], [-0.05, 1.32, 0], 40),
      cast: [{ who: 'kazuma', pose }],
      sprites: Fx.field(7683, 8, [-1, 0.6, -3], [6, 2, 3], tt, { size: 1.6, kind: 'dust', drift: [0.3, 0, 0], alpha: 0.5 })
    });
  }

  function swordSky(t) {
    const tt = t - 78.995;
    const party = [['darkness', 0.0], ['kazuma', 0.8], ['aqua', 1.5], ['megumin', 2.2]].map(([who, x], i) => ({ who, pose: walker(who, x + tt * 0.6, -6, PI / 2, tt * 9 + i, { hat: true, cloak: true }) }));
    return blank({
      env: 'waste', set: 'waste', world: { sky: 'skyDay', panoSpin: 2.0 },
      camera: cam([-3, 3.2, 14], [1, 1.0, -6], 40),
      cast: party,
      lines: [{ a: [-14, 26, -30], b: [-3, -2, -10], w: 1.2, color: [1, 0.95, 0.9], alpha: 0.8, tex: 'streakTex' }],
      sprites: [{ kind: 'glow', p: [-3.2, 0.5, -10], size: 3.5, color: [0.8, 0.85, 1], alpha: 0.7 }]
    });
  }

  function wizShop(t) {
    const tt = t - 79.829;
    return blank({
      env: 'shop', set: 'shopFront',
      camera: cam([-0.5 + tt * 2, 2.8, 6.5], [-0.3 + tt * 2, 2.8, 0], 46),
      sprites: [{ kind: 'glow', p: [-2.0, 2.6, 0.4], size: 2.2, color: [1, 0.8, 0.4], alpha: 0.5 }]
    });
  }

  function wiz(t) {
    const pose = at('wiz', -0.35, -1.5, {
      yaw: 0.1, nk: [0.05, 0.1, 0.12], eyes: 'half', mouth: 'smile',
      hLw: [-0.31, 1.18, -1.26], eLw: [-0.12, 0.98, -1.38], hRw: [-0.4, 1.18, -1.26], eRw: [-0.6, 0.98, -1.38]
    });
    return blank({
      env: 'shop', set: 'shop',
      camera: cam([0.25, 1.3, 0.75], [-0.25, 1.22, -1.5], 42),
      cast: [{ who: 'wiz', pose }],
      sprites: [{ kind: 'glow', p: [0.6, 2.4, -2.2], size: 1.8, color: [1, 0.75, 0.35], alpha: 0.45 }],
      grade: [1.08, 0.98, 0.85, 0]
    });
  }

  function crowd(t) {
    const tt = t - 80.913;
    const raise = ramp(t, 81.25, 81.45);
    const big = at('bigman', 0.7, 1.2, {
      yaw: -0.4, lean: 0.05, eyes: raise > 0.5 ? 'shut' : 'annoyed', mouth: raise > 0.5 ? 'scream' : 'grit', nk: [0.05, -0.2, 0],
      hLw: [lerp(0.2, 0.15, raise), lerp(1.0, 1.7, raise), lerp(1.7, 1.6, raise)], eLw: [0.4, 1.2, 1.5],
      props: [{ kind: 'mug', hand: 'L', dir: [0, 1, 0], up: [1, 0, 0], s: 1.4 }]
    });
    const g = rand(8091);
    const extras = ['crowdA', 'crowdB', 'crowdC', 'crowdD', 'waitressB', 'crowdA', 'crowdD', 'crowdB'].map((who, i) => {
      const x = -2.2 + i * 0.6 + (g() - 0.5) * 0.3, z = -1.0 - (i % 3) * 0.7;
      return { who, pose: at(who, x, z, { yaw: 0.3 * (g() - 0.5), eyes: g() < 0.5 ? 'open' : 'shut', mouth: g() < 0.5 ? 'happy' : 'open', hL: [0.2, 0.35 + g() * 0.3, 0.1], hR: [-0.2, -0.2, 0.05], props: g() < 0.6 ? [{ kind: 'mug', hand: 'L', dir: [0, 1, 0], up: [1, 0, 0] }] : [] }) };
    });
    return blank({
      env: 'guild', set: 'guild',
      camera: cam([0.3, 1.45, 2.6], [-0.1, 1.35, 0], 50),
      cast: [{ who: 'bigman', pose: big }].concat(extras),
      grade: [1.08, 0.98, 0.86, 0]
    });
  }

  function chris(t) {
    const tt = t - 81.664;
    const pose = at('chris', 0.5, 0, { yaw: -0.3, dy: 0.18, eyes: 'open', mouth: 'smile', hL: [0.18, -0.12, 0.05], hR: [-0.2, -0.22, 0.02] });
    const scarf = [];
    for (let i = 0; i < 8; i++) scarf.push([0.5 + 0.1 * i, 2.35 - 0.02 * i + S(tt * 10 + i * 0.8) * 0.04, -0.05 - 0.06 * i]);
    return blank({
      env: 'day', set: 'roof', world: { spin: 0.2 },
      camera: cam([-1.0, 1.3, 2.9], [0.4, 1.9, 0], 48),
      cast: [{ who: 'chris', pose }],
      ribbons: [{ pts: scarf, w: 0.08, color: [0.42, 0.62, 0.24], alpha: 1 }]
    });
  }

  function verdia(t) {
    const tt = t - 82.206;
    const dark = tt < 0.05;
    return blank({
      env: 'hall', set: dark ? 'none' : 'hall', bg: dark ? [0.0, 0.02, 0.05] : null,
      camera: cam([-6 + tt * 3, 2.5, 8], [0, 3.5, -10], 50),
      foes: dark ? [] : [{ kind: 'verdia', pos: [0, 0, -10], yaw: 0.6, scale: 1.4 }],
      grade: [0.8, 0.95, 1.2, 0]
    });
  }

  function mitsurugi(t) {
    const tt = t - 82.957;
    const wave = S(tt * 10);
    const mit = at('mitsurugi', -0.55, 0.6, {
      yaw: 0.4, nk: [0.05, 0.2, 0], eyes: 'half', mouth: 'smirk',
      hRw: [-0.65, 1.55, 0.75], eRw: [-0.95, 1.25, 0.6], hL: [0.2, -0.15, 0.08],
      props: [{ kind: 'gram', hand: 'R', dir: [1, 0.35, -0.2] }]
    });
    const girls = [
      { who: 'clemea', pose: at('clemea', 1.2, -1.6, { yaw: -0.3, eyes: 'shut', mouth: 'happy', hR: [-0.15, 0.6 + wave * 0.05, 0.1], eR: [-0.4, 0.3, -0.2] }) },
      { who: 'fiore', pose: at('fiore', 1.9, -1.9, { yaw: -0.45, eyes: 'open', mouth: 'happy', hL: [0.15, 0.62 - wave * 0.05, 0.05], eL: [0.4, 0.3, -0.2] }) }
    ];
    return blank({
      env: 'day', set: 'sky', world: { sky: 'skyDay', spin: 1.0 },
      camera: cam([-0.05, 1.15, 2.1], [0.2, 1.4, 0], 52),
      cast: [{ who: 'mitsurugi', pose: mit }].concat(girls)
    });
  }

  function waitresses(t) {
    const tt = t - 83.583;
    const trayHand = (x, z) => [{ kind: 'tray', pos: [x, 1.0, z], dir: [0, 0, 1], up: [0, 1, 0] }];
    const cast = [
      { who: 'waitressB', pose: at('waitressB', -0.9, 0.2, { yaw: 0.35, eyes: 'half', mouth: 'smile', hLw: [-0.75, 0.95, 0.5], hRw: [-1.1, 0.95, 0.5], props: [{ kind: 'mug', pos: [-0.75, 0.92, 0.55], dir: [0, 1, 0] }, { kind: 'mug', pos: [-1.05, 0.92, 0.58], dir: [0, 1, 0] }] }) },
      { who: 'waitressC', pose: at('waitressC', -0.1, -0.6, { yaw: 0.1, eyes: 'shut', mouth: 'happy', hRw: [-0.25, 1.75, -0.4], hL: [0.2, -0.1, 0.1], props: [{ kind: 'mug', hand: 'R', dir: [0, 1, 0], up: [1, 0, 0] }] }) },
      { who: 'waitressD', pose: at('waitressD', 0.55, -1.0, { yaw: -0.2, eyes: 'open', mouth: 'smile' }) },
      { who: 'waitressE', pose: at('waitressE', 0.75, 0.55, { yaw: -0.45, eyes: 'half', mouth: 'flat', nk: [0.15, 0.1, 0.1], hLw: [0.75, 0.98, 0.95], hRw: [0.5, 0.98, 0.9], props: trayHand(0.62, 0.98) }) }
    ];
    return blank({
      env: 'guild', set: 'guild',
      camera: cam([0.0, 1.35, 1.9], [0.0, 1.18, 0], 52),
      cast,
      grade: [1.08, 0.98, 0.86, 0]
    });
  }

  function yunyun(t) {
    const tt = t - 84.083;
    const turn = ramp(t, 84.25, 84.55);
    const pose = at('yunyun', 0, 0, { yaw: lerp(PI + 0.4, 0.3, turn), nk: [0, lerp(0, -0.2, turn), 0], eyes: 'open', mouth: 'flat', hL: [0.15, -0.18, 0.12], hR: [-0.15, -0.18, 0.12] });
    return blank({
      env: 'forest', set: 'stream',
      camera: cam([0.35, 1.35, 1.9], [0.0, 1.25, -1], 44),
      cast: [{ who: 'yunyun', pose }],
      sprites: [{ kind: 'glow', p: [1.4, 3.0, -4], size: 2.4, color: [1, 0.95, 0.8], alpha: 0.4 }].concat(Fx.field(8409, 14, [0, 1, -2], [4, 2, 3], tt, { size: 0.03, kind: 'spark', color: [1, 1, 0.9], twinkle: true, alpha: 0.6 }))
    });
  }

  function luna(t) {
    const pose = at('luna', 0.45, 0.9, { yaw: -0.5, nk: [0.1, 0.1, 0.1], eyes: 'open', mouth: 'happy', hL: [0.1, -0.05, 0.22], hR: [-0.1, -0.05, 0.22] });
    const staff = [['guildman', -0.9, -0.6, 0.2], ['staffGirl', 0.2, -1.2, 0.0], ['elfGirl', 0.85, -1.0, -0.3], ['guildman2', 1.4, -1.5, -0.4], ['waitressC', -0.2, -1.6, 0.1]].map(([who, x, z, yaw]) => ({ who, pose: at(who, x, z, { yaw, eyes: 'open', mouth: 'smile' }) }));
    return blank({
      env: 'guild', set: 'guild',
      camera: cam([-0.1, 1.45, 2.0], [0.25, 1.35, 0], 50),
      cast: [{ who: 'luna', pose }].concat(staff),
      grade: [1.04, 0.98, 0.92, 0]
    });
  }

  function finale(t) {
    const tt = t - 85.668;
    const party = [['darkness', 7.0], ['kazuma', 7.55], ['aqua', 8.1], ['megumin', 8.65]].map(([who, x]) => ({ who, pose: at(who, x, 0.4, { yaw: PI + 0.4, hat: true, cloak: true, props: who === 'megumin' ? [{ kind: 'staffMeg', hand: 'L', dir: [0.05, 1, 0] }] : [] }) }));
    return blank({
      env: 'vista', set: 'finale',
      camera: cam([10.2 - tt * 0.08, 1.3, 11.1], [-17.8, -9.1 + tt * 0.15, -28.9], 40, { far: 1500 }),
      cast: party
    });
  }

  window.KonopAct3 = { aquaSkyBack, aquaShout, dagger, kazumaPoint, golem, golemHead, darknessCharge, darknessSwing, darknessMiss, rockComic, explosionSmoke, darknessPass, darknessBlown, skyFall, darknessFly, meguminCliff, meguminFace, meguminCast, aquaNight, circles, pillar, blast, aftermath, lyingClose, kazumaSmile, swordSky, wizShop, wiz, crowd, chris, verdia, mitsurugi, waitresses, yunyun, luna, finale };
})();
