(function () {
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const { V3, rand } = window.P3D;
  const Sh = window.KonopShots;
  const Fx = window.KonopFx;
  const Cast = window.KonopCast;
  const { blank, cam, at, stand, blinkAt } = Sh;

  const ramp = (t, a, b) => ease((t - a) / (b - a));
  const pulse = (t, c, w) => Math.max(0, 1 - Math.abs(t - c) / w);

  function orbitEye(center, dist, yaw, pitch) {
    return [center[0] + S(yaw) * C(pitch) * dist, center[1] + S(pitch) * dist, center[2] + C(yaw) * C(pitch) * dist];
  }

  function townNight(t) {
    const k = ramp(t, 0, 1.25);
    const yaw = -0.62 + t * 0.06;
    const eye = orbitEye([0, 0, 0], lerp(415, 385, t / 1.3), yaw, 0.74);
    const fl = pulse(t, 1.02, 0.28);
    return blank({
      env: 'townNight', set: 'town', world: { sky: 'skyDawn' },
      camera: cam(eye, [6, 0, -4], 40, { far: 3000 }),
      grade: [0.5 + 0.28 * k, 0.6 + 0.26 * k, 0.92 + 0.12 * k, 0.08],
      front: [
        { tex: 'streak2d', additive: true, x: -0.32, y: -0.18, w: 1.3, h: 0.1, rot: 0.42, alpha: fl * 0.9, tint: [0.7, 0.95, 1.0] },
        { tex: 'glow2d', additive: true, x: -0.42, y: -0.22, w: 0.3, h: 0.5, alpha: fl * 0.7, tint: [0.6, 0.9, 1.0] },
        { tex: 'cross2d', additive: true, x: -0.18, y: -0.08, w: 0.3, h: 0.5, alpha: fl * 0.5 }
      ]
    });
  }

  function castleGate(t) {
    const tt = t - 1.292;
    const day = ramp(t, 1.7, 1.98);
    const eye = [12 - tt * 1.0, 10.5 + tt * 0.4, 33];
    return blank({
      env: day > 0.5 ? 'day' : 'townNight', set: 'gate', world: { sky: 'skyDay', skyTint: [lerp(0.2, 1, day), lerp(0.28, 1, day), lerp(0.58, 1, day)], spin: 0.5 },
      camera: cam(eye, [-3.5, 11.5, 0], 46),
      grade: [lerp(0.42, 1.03, day), lerp(0.5, 1.01, day), lerp(0.86, 1.0, day), 0],
      flash: pulse(t, 1.88, 0.12) * 0.35
    });
  }

  function nightField(t) {
    const tt = t - 3.002;
    const fl = 0.55 + 0.45 * S(tt * 3.0);
    return blank({
      env: 'dawn', set: 'nightField',
      camera: cam([0, 2.4 + tt * 0.25, 14], [3, 4.2 + tt * 0.35, -40], 48, { far: 500 }),
      grade: [0.95, 1.0, 1.1, 0],
      front: [
        { tex: 'glow2d', additive: true, x: -0.06, y: -0.1, w: 0.14, h: 0.25, alpha: 0.35 * fl, tint: [0.7, 0.85, 1] },
        { tex: 'cross2d', additive: true, x: -0.06, y: -0.1, w: 0.12, h: 0.21, alpha: 0.28 * fl },
        { tex: 'streak2d', additive: true, x: -0.06, y: -0.1, w: 0.7, h: 0.03, alpha: 0.22 * fl, tint: [0.7, 0.85, 1] }
      ]
    });
  }

  function streets(t) {
    const tt = t - 4.712;
    const day = ramp(t, 4.76, 5.05);
    const eye = [-104 + tt * 3.2, 44 - tt * 1.2, 112 - tt * 2.0];
    const sweep = clamp((t - 4.85) / 1.4, 0, 1);
    return blank({
      env: day > 0.5 ? 'townDay' : 'townNight', set: 'town', world: { sky: 'skyDay' },
      camera: cam(eye, [eye[0] + 18, 0, eye[2] - 44], 46, { far: 3000 }),
      grade: [lerp(0.4, 1.04, day), lerp(0.46, 1.0, day), lerp(0.8, 0.98, day), 0],
      front: [
        { tex: 'streak2d', additive: true, x: lerp(-0.6, 0.5, sweep), y: lerp(0.3, -0.3, sweep), w: 1.4, h: 0.12, rot: -0.6, alpha: 0.45 * day },
        { tex: 'glow2d', additive: true, x: lerp(-0.5, 0.45, sweep), y: lerp(0.25, -0.25, sweep), w: 0.25, h: 0.45, alpha: 0.4 * day }
      ]
    });
  }

  const CARDS = [
    { t0: 6.422, who: 'kazumaJ', letter: 'letterKo', ring: { x: 0.12, y: -0.45, w: 1.0, rot: 0.3 }, let: { x: 0.2, y: -0.02, w: 0.42, h: 0.78, rot: -0.12 }, eye: [0.02, 1.5, 0.36], at: [0.2, 1.5, 0.0], yaw: PI / 2 - 0.45, fov: 50 },
    { t0: 6.756, who: 'aqua', letter: 'letterNo', ring: { x: -0.42, y: 0.0, w: 1.3, rot: 1.2 }, let: { x: -0.24, y: 0.06, w: 0.46, h: 0.86, rot: 0.05 }, eye: [-0.5, 1.68, -0.1], at: [0.08, 1.62, -0.1], yaw: -2.0, fov: 50 },
    { t0: 7.09, who: 'megumin', letter: 'letterSu', ring: { x: 0.18, y: -0.42, w: 1.05, rot: 2.4 }, let: { x: 0.34, y: 0.22, w: 0.42, h: 0.8, rot: 0.1 }, eye: [0.62, 1.42, 0.35], at: [0.02, 1.5, -0.05], yaw: -1.2, fov: 54, hat: true },
    { t0: 7.423, who: 'darkness', letter: 'letterBa', ring: { x: -0.25, y: -0.12, w: 1.2, rot: -0.6 }, let: { x: -0.26, y: 0.04, w: 0.5, h: 0.92, rot: -0.04 }, eye: [-0.28, 1.6, 0.34], at: [0.0, 1.6, -0.02], yaw: -PI / 2 - 0.2, fov: 48 }
  ];

  function card(t, i) {
    const c = CARDS[i];
    const tt = t - c.t0;
    const z = 1 + tt * 0.25;
    const ring = { tex: 'ring', x: c.ring.x, y: c.ring.y, w: c.ring.w * z, h: c.ring.w * z * 16 / 9, rot: c.ring.rot + tt * 0.35 };
    const letter = { tex: c.letter, x: c.let.x + tt * 0.05, y: c.let.y, w: c.let.w * z, h: c.let.h * z, rot: c.let.rot };
    const pose = at(c.who, 0, 0, { yaw: c.yaw, eyes: 'open', mouth: 'shut', hat: c.hat, cloak: c.hat });
    const eye = [c.eye[0] + tt * 0.06, c.eye[1], c.eye[2]];
    return blank({ env: 'white', bg: [1, 1, 1], set: 'none', backdrop: [ring, letter], cast: [{ who: c.who, pose }], camera: cam(eye, c.at, c.fov), vignette: 0 });
  }

  function kazumaSky(t) {
    const tt = t - 7.757;
    const k = ease(clamp(tt / 0.95, 0, 1));
    const eye = Sh.lerpV([0, 1.72, 4.6], [0.05, 1.56, 1.75], k);
    const atp = Sh.lerpV([0, 1.78, 0], [0.0, 1.4, 0], k);
    const look = ramp(t, 8.2, 8.5);
    const pose = at('kazumaJ', 0, 0, {
      yaw: 0.1, nk: [0.02, lerp(0, 0.35, look), 0], gaze: [lerp(0, -0.8, look), 0], eyes: blinkAt(t, [8.85]) ? 'shut' : 'open', mouth: 'flat',
      hL: [0.2, -0.26, 0.04], hR: [-0.2, -0.26, 0.04]
    });
    return blank({
      env: 'bright', set: 'sky', world: { sky: 'skyBright', spin: 0.3 },
      camera: cam(eye, atp, 30),
      cast: [{ who: 'kazumaJ', pose }]
    });
  }

  function kazumaReach1(t) {
    const tt = t - 9.175;
    const pose = at('kazumaJ', 0, 0, {
      yaw: -0.25, lean: 0.15, sp: [0.15, -0.35, 0.1], nk: [-0.05, 0.25, 0], eyes: 'open', mouth: 'smile', gaze: [-0.4, 0],
      hRw: [-0.62 - tt * 0.4, 1.32, 0.3], eRw: [-0.4, 1.4, -0.3], wR: [0.3, 0, 0], hL: [0.24, -0.2, 0.1]
    });
    return blank({ env: 'bright', set: 'sky', world: { sky: 'skyBright', spin: 0.6 }, camera: cam([0.18, 1.3, 1.25], [-0.12, 1.32, 0], 46), cast: [{ who: 'kazumaJ', pose }] });
  }

  function kazumaReach2(t) {
    const tt = t - 9.342;
    const k = ease(clamp(tt / 0.3, 0, 1));
    const pose = at('kazumaJ', 0, 0, {
      yaw: -0.2, lean: 0.1, sp: [0.1, -0.2, 0.05], nk: [0.0, 0.15, 0], eyes: 'wide', mouth: 'open',
      hRw: [lerp(-0.2, -0.06, k), lerp(1.32, 1.4, k), lerp(0.35, 0.5, k)], eRw: [-0.35, 1.25, 0.2], wR: [1.2, 0, 0], hL: [0.22, -0.24, 0.05]
    });
    return blank({ env: 'bright', set: 'sky', world: { sky: 'skyBright', spin: 0.9 }, camera: cam([0.12, 1.46, 0.95], [0.05, 1.42, 0], 46), cast: [{ who: 'kazumaJ', pose }] });
  }

  function kazumaGlow(t) {
    const tt = t - 9.842;
    const grow = ramp(t, 9.9, 11.9);
    const white = ramp(t, 11.0, 12.05);
    const pose = at('kazumaJ', 0, 0, {
      yaw: 0.12, nk: [0.05, -0.1, 0.05], eyes: t > 10.7 ? 'half' : 'open', mouth: t > 10.4 ? 'smile' : 'flat', gaze: [0.2, -0.4],
      hRw: [-0.07, 1.27, 0.24], eRw: [-0.3, 1.0, 0.1], hL: [0.22, -0.24, 0.05]
    });
    const orb = [-0.06, 1.3, 0.3];
    const sp = Fx.field(911, 46, [0.0, 1.0, -0.2], [2.4, 1.6, 1.4], tt, { rise: 0.05, size: 0.02, kind: 'spark', color: [0.6, 0.95, 1.0], twinkle: true, sway: 0.1 });
    return blank({
      env: 'bright', set: 'sky', world: { sky: 'skyDay', spin: 1.2 },
      camera: cam([0.05 + tt * 0.01, 1.43, 0.8 - tt * 0.05], [0.0, 1.39, 0], 38),
      cast: [{ who: 'kazumaJ', pose }],
      sprites: sp.concat([
        { kind: 'glow', p: orb, size: 0.08 + grow * 0.2, color: [0.3, 0.85, 1.0], alpha: 0.9 },
        { kind: 'glow', p: orb, size: 0.03 + grow * 0.08, color: [1, 1, 1], alpha: 1 },
        { kind: 'spark', p: orb, size: 0.1 + grow * 0.16, color: [0.7, 1, 1], roll: tt * 0.8, alpha: 0.8 }
      ]),
      grade: [0.78 + grow * 0.3, 0.98 + grow * 0.1, 1.12, 0],
      colorAdd: [0.0, 0.03 + grow * 0.08, 0.06 + grow * 0.08],
      flash: white
    });
  }

  function glyphState(g, i, t) {
    const L = Fx.LOGO[i];
    const order = [1, 2, 0, 5, 4, 3, 7, 8, 6, 9, 10][i];
    const t0 = 12.3 + order * 0.16;
    const k = clamp((t - t0) / 0.7, 0, 1);
    const e = 1 - Math.pow(1 - k, 3);
    const rnd = rand(500 + i);
    const ang = rnd() * PI * 2;
    const start = [L.x + C(ang) * 6, L.y + S(ang) * 4, 6 + rnd() * 3];
    const out = clamp((t - (23.35 + order * 0.07)) / 0.9, 0, 1);
    const fly = out * out;
    const p = [lerp(start[0], L.x, e) + (L.x * 0.8 + (rnd() - 0.5) * 2) * fly, lerp(start[1], L.y, e) + (L.y * 0.6 + (rnd() - 0.5)) * fly, lerp(start[2], 0, e) + fly * 11];
    return { key: L.key, p, rx: (1 - e) * (rnd() - 0.5) * 3 + fly * (rnd() - 0.5) * 3, ry: (1 - e) * (rnd() - 0.5) * 4 + fly * (rnd() - 0.5) * 4, rz: (1 - e) * (rnd() - 0.5) * 1.5, s: 1 + (1 - e) * 0.8, alpha: k > 0 ? 1 : 0 };
  }

  function logoShot(t) {
    const sky = ramp(t, 16.2, 17.6);
    const glyphs = Fx.LOGO.map((g, i) => glyphState(g, i, t));
    const drift = ramp(t, 15.0, 23.3);
    const s = lerp(1.12, 1.0, drift);
    const off = [lerp(0.05, 0.0, drift), lerp(0.25, 0.5, drift)];
    glyphs.forEach(g => {
      g.p = [g.p[0] * s + off[0], g.p[1] * s + off[1], g.p[2]];
      g.s *= s;
    });
    const subK = clamp((t - 14.45) / 0.6, 0, 1);
    const subOut = clamp((t - 23.4) / 0.4, 0, 1);
    const sub = { p: [-0.38 * s + off[0], -1.37 * s + off[1], 0], s: s, alpha: subK * (1 - subOut) };
    const feathers = Fx.field(1201, 26, [0, 0, 1], [14, 9, 6], t - 12, { fall: 0.5, size: 0.28, kind: 'feather', spin: 0.8, sway: 0.4, center: true }).map(f => Object.assign(f, { roll: f.roll }));
    const heroes = [
      { who: 'megumin', x: -0.95, o: { hat: true, cloak: true } },
      { who: 'kazumaJ', x: -0.32, o: {} },
      { who: 'aqua', x: 0.3, o: {} },
      { who: 'darkness', x: 0.92, o: {} }
    ].map(h => ({ who: h.who, pose: at(h.who, h.x, 0, Object.assign({ yaw: PI, nk: [-0.35, 0, 0] }, h.o)) }));
    const st = blank({
      env: 'bright', set: sky > 0.001 ? 'sky' : 'none', world: { sky: 'skyBright', spin: 2.2 }, bg: sky > 0.001 ? null : [1, 1, 1],
      camera: cam([0, 1.05, 3.6], [0, 2.85, -4], 40),
      cast: sky > 0.001 ? heroes : [],
      veil: [1, 1, 1, 1 - sky],
      logo: { glyphs, sub, sprites: feathers },
      vignette: 0
    });
    if (t > 24.1) st.flash = 0;
    return st;
  }

  function hill(t) {
    const tilt = ramp(t, 24.62, 25.7);
    const pose = at('kazumaJ', -0.1, 0, { yaw: PI + 0.45, hL: [0.15, -0.2, -0.12], eL: [0.7, 0, -0.1], hR: [-0.15, -0.2, -0.12], eR: [-0.7, 0, -0.1] });
    const aqua = {
      pos: [0.78, 0.26, 0.05], yaw: PI + 0.75, lean: -0.05, nk: [-0.12, 0.1, 0], eyes: 'open', mouth: 'smile',
      fLw: [0.62, 0.07, 0.32], kLw: [0.78, 0.18, 0.5], fRw: [0.98, 0.07, 0.28], kRw: [1.0, 0.18, 0.48],
      hLw: [0.62, 0.32, 0.2], hRw: [0.98, 0.3, 0.16]
    };
    return blank({
      env: 'day', set: 'hill', world: { panoSpin: 0.2 },
      camera: cam([0.42, 0.9, 4.2], Sh.lerpV([0.4, 4.6, -2.0], [0.42, 1.25, 0], tilt), 38, { far: 600 }),
      cast: [{ who: 'kazumaJ', pose }, { who: 'aqua', pose: aqua }]
    });
  }

  window.KonopAct1 = { townNight, castleGate, nightField, streets, card0: (t) => card(t, 0), card1: (t) => card(t, 1), card2: (t) => card(t, 2), card3: (t) => card(t, 3), kazumaSky, kazumaReach1, kazumaReach2, kazumaGlow, logoShot, hill };
})();
