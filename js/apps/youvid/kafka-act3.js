(function () {
  const { V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, ease, frac } = K;
  const Cast = window.KafkaCast;
  const Fx = window.KafkaFx;
  const { seg, mix3, look, shake, blank, card, blink, speaking, kafka, walking, running, guard, lyingGuard, pinkLasers, muzzle } = window.KafkaShots;

  const CORR_Z = -12;

  function drawKatana(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 62.42, 64.98);
    const reach = ease(seg(t, 63.0, 63.6));
    const pull = ease(seg(t, 63.7, 64.35));
    const out = ease(seg(t, 64.35, 64.75));
    const base = { pos: [0, 1.0, CORR_Z], yaw: 0.35, base: [0, 0, CORR_Z] };
    const pre = Cast.solveKafka(Object.assign({ hL: [0.16, -0.12, 0.2], eL: [0.8, -0.4, -0.3] }, base));
    const sheathTop = V3.add(pre.pts.wristL, [0, 0.05, 0]);
    const handle = V3.add(sheathTop, [0.02 + pull * 0.3 + out * 0.25, 0.14 + pull * 0.55 - out * 0.35, 0.04 + out * 0.1]);
    s.kafka = kafka(0, CORR_Z, 0.35, {
      hL: [0.16, -0.12, 0.2],
      eL: [0.8, -0.4, -0.3],
      propL: 'sheath',
      dirL: [0.05, -1, 0.12],
      hRw: reach > 0.02 ? V3.lerp(V3.add(pre.pts.wristR, [0, 0, 0.02]), V3.add(handle, [0, -0.05, 0.02]), reach) : undefined,
      hR: [-0.2, -0.3, 0.06],
      eR: [-0.6, -0.4, -0.5],
      handR: reach > 0.5 ? 'grip' : 'open',
      eyes: blink(t, 'half'),
      mouth: 'smile',
      nk: [0.12, -0.15 + out * 0.3, 0]
    });
    const bladeDir = V3.norm(V3.lerp([0.05, -1, 0.12], [0.8, 0.2, 0.55], out));
    s.katana = { p: handle, dir: bladeDir, up: [0, 0, 1] };
    if (out > 0.5) s.sprites.push({ p: V3.add(handle, V3.mul(bladeDir, 0.5)), size: 0.45, kind: 'halo', color: [0.9, 0.85, 1], alpha: (out - 0.5) * 1.2 });
    s.camera = look([lerp(-0.55, -0.48, k), 0.75, CORR_Z + 1.12], [0.05, 1.32, CORR_Z], 46);
    s.petals = Fx.petalField(121, 12, [0, 0.3, CORR_Z + 0.6], [2.4, 2.4, 1.6], t, { scale: 0.05, fall: 0.25 });
    if (t > 64.78) {
      s.flash = 0.8;
      s.flashColor = [1, 0.85, 0.92];
    }
    return s;
  }

  function liftDoor(t) {
    const s = blank('lift', 'lift');
    const k = seg(t, 64.98, 67.35);
    s.needle = lerp(1.25, -1.25, ease(k));
    s.doorOpen = ease(seg(t, 67.2, 67.58));
    s.camera = look([0, lerp(3.75, 3.7, k), lerp(3.0, 2.7, k)], [0, lerp(3.85, 3.75, k), 0], 40);
    s.petals = [{ p: [0.35, lerp(3.4, 0.4, seg(t, 65.0, 66.6)), 0.5], rx: t * 3, ry: 0.5, rz: t * 2, s: 0.06 }];
    if (t > 67.0) {
      const kk = seg(t, 67.0, 67.58);
      s.camera = look([0, lerp(2.2, 1.0, kk), 3.4], [0, lerp(2.2, 0.9, kk), 0], 40);
      s.fade = 1 - 0.6 * seg(t, 67.0, 67.2) + 0.6 * seg(t, 67.3, 67.58);
    }
    return s;
  }

  function liftTop(t) {
    const s = blank('lift', 'liftIn');
    s.noCeiling = true;
    s.doorOpen = 1;
    const k = seg(t, 67.58, 69.55);
    const go = seg(t, 68.9, 69.55);
    s.kafka = kafka(0, -1.1 + go * 1.4, 0, Object.assign({ eyes: 'open', mouth: 'smile', nk: [-0.55 + go * 0.4, 0, 0], propR: 'katana', dirR: [0.35, -0.8, 0.3], hR: [-0.22, -0.18, 0.12] }, go > 0 ? Cast.walkPose(go * 0.6, 7, 0.2, 0.06) : {}));
    s.camera = look([0, lerp(2.55, 2.7, k), lerp(-0.4, -0.3, k)], [0, 0.75, -1.4], 60);
    return s;
  }

  function legsWalk(t) {
    const s = blank('hall', 'hallRed');
    const k = seg(t, 69.55, 71.4);
    s.lamps = 0.4;
    s.kafka = walking(t - 69.55, 1.0, -3.0, -PI * 0.5, 0.75, { eyes: 'open' }, 6.2);
    const p = s.kafka.pos;
    s.camera = look([p[0] - 0.1, 0.2, p[2] + 1.0], [p[0] - 0.1, 0.32, p[2]], 46);
    s.floorTint = [0.4, 0.35, 0.38];
    if (t > 70.9) s.lines = Array.from({ length: 6 }, (_, i) => ({ a: [p[0] - 2 + i * 0.7, 0, p[2] - 0.6], b: [p[0] - 2 + i * 0.7, 3, p[2] - 0.6], w: 0.03, color: [1, 0.25, 0.6], alpha: seg(t, 70.9, 71.4) }));
    return s;
  }

  function pinkStreaks(t) {
    const s = card([0.9, 0.3, 0.6]);
    const k = seg(t, 71.4, 71.98);
    s.streaks = 1;
    s.flash = k < 0.4 ? k * 2.2 : (1 - k) * 1.2;
    s.flashColor = [1, 0.97, 1];
    return s;
  }

  function webScene(t, t0) {
    const s = blank('hall', 'bw');
    s.bw = true;
    s.lamps = 0.2;
    s.floorTint = [0.38, 0.38, 0.38];
    const grow = ease(seg(t, t0, t0 + 0.8));
    s.kafka = kafka(0, -5.6, 0, { hL: [0.5, 0.3, 0.25], hR: [-0.5, 0.3, 0.25], handL: 'open', handR: 'open', eyes: 'half', glow: 0.6 });
    s.shards = Fx.crystalBurst(131, 46, [0, 1.35, -5.4], 3.4, 0.4 + grow * 0.6, 1.4);
    const m = Cast.solveKafka(s.kafka);
    ['L', 'R'].forEach(sd => s.sprites.push({ p: m.pts['wrist' + sd], size: 0.25, kind: 'halo', color: [1, 0.3, 0.6], alpha: 1 }));
    return s;
  }

  function bwWebCenter(t) {
    const s = webScene(t, 71.98);
    const k = seg(t, 71.98, 73.18);
    s.camera = look([0, 1.4, 1.4 - k * 0.4], [0, 1.6, -6], 46);
    if (t < 72.4) {
      s.lines = Array.from({ length: 8 }, (_, i) => ({ a: [-3 + i * 0.85, 0, -5.4], b: [-3 + i * 0.85, 4.5, -5.4], w: 0.05, color: [1, 0.3, 0.65], alpha: 1 - seg(t, 71.98, 72.4) }));
    }
    return s;
  }

  function bwWebGuards(t) {
    const s = webScene(t, 71.98);
    const k = seg(t, 73.18, 74.78);
    s.fg = [guard(-1.6, -1.6, PI + 0.25, 'aim', t), guard(-0.4, -2.3, PI - 0.05, 'aim', t + 0.3), guard(0.9, -1.9, PI - 0.25, 'aim', t + 0.7), guard(2.0, -1.3, PI - 0.45, 'aim', t + 0.2)];
    s.camera = look([lerp(-0.4, -0.2, k), 1.05, 0.3], [0, 1.5, -6], 52);
    if (t > 74.58) { s.chroma = 6; s.flash = 0.3; }
    return s;
  }

  function bwKaleido(t) {
    const s = blank('none', 'bw');
    s.bw = true;
    const k = seg(t, 74.78, 75.35);
    s.backdrop.push({ tex: 'kaleido', rot: k * 0.8, scale: 2.3, w: 0.5625, h: 1 });
    s.kafka = kafka(0, 0, 0, { hL: [0.3, -0.25, 0.15], hR: [-0.3, -0.25, 0.15], propR: 'katana', dirR: [0.2, -0.9, 0.3], eyes: 'half' });
    s.camera = look([0, 1.15, 2.2 - k * 0.3], [0, 1.15, 0], 40);
    s.kaleido = 1;
    return s;
  }

  function bwTorso(t) {
    const s = blank('none', 'bw');
    s.bw = true;
    const k = seg(t, 75.35, 75.95);
    s.backdrop.push({ tex: 'kaleido', rot: -k * 0.6, scale: 2.4, w: 0.5625, h: 1 });
    s.kafka = kafka(0, 0, 0.1, { eyes: 'half', hL: [0.22, -0.3, 0.1], hR: [-0.22, -0.3, 0.1] });
    const m = Cast.solveKafka(s.kafka);
    s.camera = look(V3.add(m.pts.chest, [0.05, 0.02, 0.62 - k * 0.05]), V3.add(m.pts.chest, [0, -0.02, 0]), 44);
    return s;
  }

  function katanaBokeh(t) {
    const s = blank('none', 'psy');
    const k = seg(t, 75.95, 76.98);
    s.backdrop.push({ tex: 'bokeh', scale: 1.1 + k * 0.1 });
    s.katana = { p: [lerp(0.08, -0.05, k), 0, 0], dir: [-1, 0.02, 0.05], up: [0, 1, 0], sheath: { p: [lerp(-0.07, -0.2, k), 0, 0], dir: [-1, 0.02, 0.05] } };
    s.camera = look([0.12, 0.08, 0.42], [0.02, 0, 0], 40, -0.12);
    s.sprites.push({ p: [lerp(-0.3, -0.45, k), 0.005, 0], size: 0.12, kind: 'halo', color: [1, 0.2, 0.4], alpha: 0.8 });
    return s;
  }

  function redFlares(t) {
    const s = card([0.02, 0.0, 0.02]);
    const k = seg(t, 76.98, 77.78);
    if (k < 0.3) s.front.push({ tex: 'flare', w: 0.55, h: 0.1, additive: true, tint: [1, 0.15, 0.35] });
    else if (k < 0.55) s.front.push({ tex: 'flare', w: 0.35, h: 0.08, x: 0.0, additive: true, tint: [1, 0.15, 0.35] }, { tex: 'halo', w: 0.06, h: 0.1, additive: true, tint: [1, 0.2, 0.4] });
    else {
      [-0.12, 0.12].forEach(x => s.front.push({ tex: 'halo', w: 0.05, h: 0.09, x, y: 0.02, additive: true, tint: [1, 0.2, 0.4] }));
      s.front.push({ tex: 'flare', w: 0.8, h: 0.06, y: -0.08, additive: true, tint: [0.9, 0.12, 0.3], alpha: 0.7 });
    }
    return s;
  }

  function redRun(t) {
    const s = blank('hall', 'hallRed');
    const k = seg(t, 77.78, 78.85);
    s.lamps = 0.6;
    s.kafka = running(t - 77.78, 3.0, -4.5, -PI * 0.5, 2.6, { propR: 'katana', dirR: [-0.3, -0.5, -0.8], eyes: 'open' });
    s.camera = look([0.6 - k * 1.8, 0.9, -1.6], [0.6 - k * 2.6, 1.0, -4.5], 46);
    s.floorTint = [0.4, 0.35, 0.38];
    s.lines = pinkLasers(141, 6, t, [[-6, 6], [0.3, 2.4], [-7, -3]], 0.02, 0.6);
    return s;
  }

  function katanaLasers(t) {
    const s = blank('hall', 'hallRed');
    s.lamps = 0.5;
    if (t < 79.0) {
      s.camera = look([0, 1.4, 1.5], [0, 1.4, -2], 40);
      s.lines.push({ a: [-2, 0.6 + (t - 78.85) * 6, -1], b: [2, 2.2 - (t - 78.85) * 4, -1], w: 0.3, color: [1, 0.3, 0.6], alpha: 1 });
      s.flash = 0.55;
      s.flashColor = [1, 0.6, 0.8];
      return s;
    }
    const k = seg(t, 79.0, 79.55);
    s.kafka = kafka(0, -4.0, 0.25, { hR: [-0.05, 0.05, 0.32], hL: [0.1, 0.0, 0.32], propR: 'katana', dirR: [0.9, 0.25, 0.2], eyes: 'open', mouth: 'smirk' });
    s.guards.push(guard(-1.6, -6.4, 0.5, 'aim', t), guard(1.4, -6.8, -0.4, 'aim', t + 0.4), guard(2.6, -5.4, -0.9, 'port', t + 0.2));
    const m = Cast.solveKafka(s.kafka);
    s.camera = look(V3.add(m.pts.chest, [-0.4, 0.05, 1.5 - k * 0.1]), V3.add(m.pts.chest, [0.05, 0.0, 0]), 44);
    s.lines = pinkLasers(151, 9, t, [[-4, 4], [0.6, 2.6], [-7, -3]], 0.03);
    return s;
  }

  function crackFace(t) {
    const s = blank('none', 'side');
    const k = seg(t, 79.55, 79.98);
    s.backdrop.push({ tex: 'cracks', scale: 1.1 + k * 0.05 });
    s.kafka = kafka(0, 0, -0.6, { eyes: 'half', mouth: 'smirk', nk: [0.15, 0.2, -0.12] });
    const m = Cast.solveKafka(s.kafka);
    const h = m.pts.head;
    s.camera = look([h[0] - 0.2, h[1] - 0.04, h[2] + 0.42 - k * 0.03], [h[0] - 0.05, h[1] - 0.06, h[2]], 40, 0.08);
    s.grade = [1.05, 0.98, 1.06, 0.35];
    return s;
  }

  function gunRaised(t) {
    const s = blank('hall', 'hallRed');
    const k = seg(t, 79.98, 80.75);
    s.lamps = 0.5;
    const up = ease(seg(t, 79.98, 80.3));
    s.kafka = kafka(0.4, -3.4, -0.4, { hR: mix3([-0.2, -0.2, 0.15], [-0.12, 0.62, 0.12], up), eR: [-0.8, 0.2, -0.3], propR: 'smg', dirR: [0.1, 1, 0.3], hL: [0.18, -0.2, 0.1], eyes: 'open', mouth: 'smirk', nk: [-0.15, 0.2, 0] });
    s.guards.push(guard(-1.8, -4.8, 0.7, 'aim', t), guard(2.4, -5.6, -0.8, 'aim', t + 0.5), lyingGuard(-0.9, -2.0, 1.4, true));
    s.camera = look([-0.4, 0.55, -0.6 + k * 0.1], [0.3, 1.6, -3.6], 48, -0.06);
    if (t > 80.55) {
      s.flash = seg(t, 80.55, 80.75) * 0.8;
      s.flashColor = [1, 0.75, 0.9];
    }
    return s;
  }

  function laserWeb(t) {
    const s = blank('hall', 'hallRed');
    s.lamps = 0.4;
    if (t < 80.95) {
      s.camera = look([0, 1.3, 1.0], [0, 1.3, -3], 46);
      s.sprites.push({ p: [0, 1.3, -1.0], size: 1.6, kind: 'star', color: [1, 0.6, 0.85], alpha: 1, roll: 0.3 });
      s.flash = 0.6;
      s.flashColor = [1, 0.8, 0.95];
      return s;
    }
    const k = seg(t, 80.95, 81.38);
    s.kafka = kafka(0, -3.6, 0, { hL: [0.5, 0.35, 0.2], hR: [-0.5, 0.35, 0.2], handL: 'open', handR: 'open', eyes: 'open', glow: 0.5 });
    s.lines = Fx.web([0, 1.4, -3.4], [1, 0, 0], [0, 1, 0], 3.2, 14, 6, 0.03, [1, 0.25, 0.65], 0.6 + k * 0.4).map(l => Object.assign(l, { alpha: 1 }));
    s.camera = look([0.3, 1.25, -0.3 - k * 0.2], [0, 1.3, -3.6], 50, 0.05);
    return s;
  }

  function legsGuards(t) {
    const s = blank('hall', 'hallRed');
    const k = seg(t, 81.38, 82.38);
    s.lamps = 0.5;
    s.kafka = walking(t - 81.38, -0.6, -2.4, 0.3, 0.6, { eyes: 'open', propR: 'katana', dirR: [0.2, -0.95, 0.1] }, 5.5);
    s.guards.push(guard(1.5, -4.4, -0.9, 'aim', t), guard(-1.9, -5.0, 0.6, 'aim', t + 0.6), lyingGuard(0.6, -3.6, 2.2, true));
    const p = s.kafka.pos;
    s.camera = look([p[0] - 0.9, 0.25, p[2] + 1.3], [p[0] + 0.2, 0.75, p[2] - 0.6], 50, 0.22);
    if (t > 82.18) { s.zoomBlur = 0.3; s.chroma = 4; }
    return s;
  }

  function handEnergy(t) {
    const s = blank('hall', 'night');
    const k = seg(t, 82.38, 82.98);
    s.lamps = 0;
    s.kafka = kafka(0, -3, -1.2, { hL: [0.3, 0.12, 0.42], eL: [0.6, -0.6, 0], handL: 'open', wL: [-0.6, 0, 0], eyes: 'open' });
    const m = Cast.solveKafka(s.kafka);
    const w = V3.add(m.pts.wristL, [0, 0.06, 0]);
    s.sprites.push({ p: w, size: 0.22, kind: 'halo', color: [0.7, 0.3, 1], alpha: 1 });
    for (let i = 0; i < 3; i++) {
      const rr = 0.07 + i * 0.04;
      const ph = t * 8 + i;
      for (let j = 0; j < 8; j++) {
        const a0 = ph + (j / 8) * PI * 2, a1 = ph + ((j + 0.6) / 8) * PI * 2;
        s.lines.push({ a: V3.add(w, [C(a0) * rr, S(a0) * rr, 0.06]), b: V3.add(w, [C(a1) * rr, S(a1) * rr, 0.06]), w: 0.012, color: [0.8, 0.35, 1], alpha: 1 });
      }
    }
    s.camera = look(V3.add(m.pts.chest, [-0.7, 0.05, 0.7 - k * 0.1]), V3.add(m.pts.chest, [0.15, -0.05, 0.2]), 44);
    return s;
  }

  function helmetShot(t, t0, t1, bgTex, tint, zoom) {
    const s = blank('none', 'redRoom');
    const k = seg(t, t0, t1);
    s.backdrop.push({ tex: bgTex, scale: 1.2 + k * 0.4, rot: k * 0.3, tint });
    const g = guard(0, 0, 0, 'port', t, { rifle: false });
    s.guards.push(g);
    const m = Cast.solveGuard(g);
    const h = m.pts.head;
    s.camera = look([h[0], h[1] + 0.02, h[2] + lerp(zoom[0], zoom[1], ease(k))], [h[0], h[1] - 0.01, h[2]], 40);
    s.zoomBlur = 0.06;
    s.chroma = 2;
    return s;
  }

  function helmet(t) {
    if (t < 83.58) return helmetShot(t, 82.98, 83.58, 'blotRed', [1.3, 0.4, 0.5], [1.1, 0.7]);
    if (t < 84.18) {
      const s = helmetShot(t, 83.58, 84.18, 'blotDark', [0.7, 0.4, 1], [0.5, 0.42]);
      s.env = 'night';
      return s;
    }
    if (t < 84.98) {
      const s = blank('none', 'night');
      const k = seg(t, 84.18, 84.98);
      s.bg = [0.02, 0.03, 0.08];
      s.backdrop.push({ tex: 'blotDark', alpha: 0.5, tint: [0.4, 0.6, 1] });
      s.guards.push(Object.assign(guard(0, 0, 0.3, 'aim', t), { flat: [0.1, 0.16, 0.3, 1] }));
      s.shards = Fx.crystalBurst(161, 40, [0, 1.3, 0], 2.2, 0.3 + k, 2.8).map(x => Object.assign(x, { flat: x.flat[0] > 0.9 ? [0.55, 0.85, 1, 1] : [0.95, 0.55, 0.3, 1] }));
      s.camera = look([0.3, 1.35, 2.4 - k * 0.4], [0, 1.3, 0], 42);
      s.chroma = 5;
      return s;
    }
    const s = helmetShot(t, 84.98, 85.48, 'blotRed', [1.4, 0.3, 0.4], [0.8, 0.95]);
    if (t > 85.38) { s.flash = 0.4; s.flashColor = [1, 0.2, 0.3]; }
    return s;
  }

  function spotlight(t) {
    const s = blank('none', 'spot');
    const k = seg(t, 85.48, 86.38);
    s.bg = [0.01, 0.01, 0.015];
    s.kafka = walking(t - 85.48, 0, -3.5, 0, 0.35, { eyes: 'open', hR: [-0.25, -0.1, 0.25], handR: 'open' });
    s.cones.push({ p: [0, 0, -3.3], h: 6, r: 0.9, color: [1, 0.95, 1], alpha: 0.55 });
    s.camera = look([0, 1.4, 2.4], [0, 1.0, -3.4], 40);
    if (t < 85.62) { s.flash = 0.5; s.flashColor = [0.9, 0.1, 0.2]; s.zoomBlur = 0.2; }
    return s;
  }

  function screenSmile(t) {
    const s = blank('stage', 'stage');
    const k = seg(t, 86.38, 87.35);
    s.invert = true;
    s.kafka = kafka(0, -2.6, 0, { hL: [0.55, 0.05, 0.1], hR: [-0.55, 0.05, 0.1], handL: 'open', handR: 'open', eyes: 'shut' });
    s.camera = look([0, 2.0, lerp(0.4, -0.6, ease(k))], [0, 2.35, -6.5], 52);
    s.zoomBlur = 0.12;
    s.chroma = 3;
    return s;
  }

  function entracte(t) {
    const s = card([1, 0.62, 0.66]);
    const k = seg(t, 87.35, 87.98);
    s.backdrop.push({ tex: 'blotWhite', scale: 1.4 + k, alpha: 0.6, tint: [1, 0.85, 0.6] });
    s.front.push({ tex: 'entracte', scale: 0.55, alpha: seg(t, 87.38, 87.5) * (1 - seg(t, 87.75, 87.9)) });
    s.flash = seg(t, 87.6, 87.98) * 0.9;
    s.flashColor = [1, 0.97, 0.8];
    return s;
  }

  function blurFace(t) {
    const s = blank('none', 'psy');
    const k = seg(t, 87.98, 88.88);
    s.bg = [0.5, 0.06, 0.3];
    const side = t > 88.58;
    s.kafka = kafka(0, 0, side ? -1.3 : 0.25, { eyes: 'open', mouth: 'smile', nk: [0, 0, side ? 0 : 0.15] });
    const m = Cast.solveKafka(s.kafka);
    const h = m.pts.head;
    s.camera = look([h[0] + (side ? -0.05 : 0.05), h[1] - 0.05, h[2] + (side ? 0.5 : 0.36)], [h[0], h[1] - 0.04, h[2]], 40, side ? 0 : -0.25);
    s.zoomBlur = side ? 0 : 0.18;
    s.chroma = side ? 2 : 5;
    if (t > 88.78) { s.flash = 0.85; s.flashColor = [0.2, 0.85, 1]; }
    s.grade = [1.2, 0.7, 1.05, 0.2];
    return s;
  }

  function ruinsKafka(x, z, yaw, extra) {
    return kafka(x, z, yaw, Object.assign({ eyes: 'open', mouth: 'smirk' }, extra));
  }

  function blueLasers(seed, t, n) {
    return Fx.laserGrid(seed, n, [[-8, 8], [0.2, 4], [-10, 2]], t, [0.6, 0.75, 1.0], 0.04).map(l => Object.assign(l, { alpha: 0.9 }));
  }

  function ruins(t) {
    const s = blank('ruins', 'ruins');
    if (t < 89.38) {
      const k = seg(t, 88.88, 89.38);
      s.kafka = ruinsKafka(0.6, -1.2, -0.5, { hR: [-0.32, 0.3, -0.05], hL: [0.3, 0.3, -0.05], propR: 'rifle', dirR: [1, 0.05, -0.2] });
      s.camera = look([-0.6, 0.5, 1.4 - k * 0.2], [0.5, 1.5, -1.4], 48, 0.05);
      s.sprites.push({ p: [1.6, 1.8, -1.5], size: 0.4, kind: 'star', color: [0.7, 0.8, 1], alpha: 1, roll: t * 3 });
      return s;
    }
    if (t < 90.38) {
      const k = seg(t, 89.38, 90.38);
      s.kafka = running(t - 89.38, -1.5, -2.0, PI * 0.5 - 0.2, 1.6, { propR: 'smg', hR: [-0.1, 0.15, 0.5], eyes: 'open' });
      s.lines = blueLasers(171, t, 12);
      s.sprites.push(...muzzle(V3.add(s.kafka.pos, [0.6, 0.5, 0.3]), t, 16, 0.25));
      [[2.2, 0.6, -3.5], [3.8, 0.4, -5.5], [-0.8, 0.5, -6]].forEach((p, i) => {
        const e = frac(t * 1.3 + i * 0.37);
        s.sprites.push({ p, size: 0.6 + e * 1.2, kind: 'halo', color: [1, 0.55, 0.2], alpha: 1 - e });
        s.sprites.push({ p, size: 0.5 + e, kind: 'star', color: [1, 0.85, 0.5], alpha: 1 - e, roll: e * 2 });
      });
      for (let i = 0; i < 8; i++) s.smokes.push({ p: [-2 + i * 0.9, 0.3, -2.5 - (i % 3)], size: 1.3, kind: 'smoke', color: [0.4, 0.45, 0.6], alpha: 0.5 });
      s.camera = look([lerp(-2.8, -1.6, k), 0.9, 2.2], [lerp(0.0, 1.0, k), 1.0, -3.2], 52, 0.12);
      if (t > 90.18) s.camera = look(V3.add(s.kafka.pos, [0.8, 0.4, 1.1]), V3.add(s.kafka.pos, [0, 0.3, 0]), 46, -0.2);
      return s;
    }
    const k = seg(t, 90.38, 91.38);
    s.env = 'ruinsFire';
    s.kafka = ruinsKafka(0, -1.0, 0.4, { eyes: t > 90.9 ? 'half' : 'open', mouth: 'smile', nk: [-0.1, -0.2, 0], hR: [-0.3, 0.05, 0.35], propR: 'smg' });
    const m = Cast.solveKafka(s.kafka);
    const h = m.pts.head;
    s.camera = look([h[0] - 0.25, h[1] - 0.12, h[2] + 0.62 - k * 0.08], [h[0] - 0.02, h[1] - 0.1, h[2]], 42, -0.08);
    s.sprites.push({ p: V3.add(h, [0.9, -0.2, -1.4]), size: 1.6, kind: 'halo', color: [1, 0.5, 0.15], alpha: 0.9 });
    s.lines = blueLasers(181, t, 6);
    if (t > 91.18) { s.zoomBlur = 0.25; s.flash = 0.3; s.flashColor = [1, 0.4, 0.6]; }
    return s;
  }

  function boots(t) {
    const s = blank('ruins', 'ruins');
    const k = seg(t, 91.38, 92.98);
    s.kafka = walking(t - 91.38, 0.05, -1.9, 0.15, 0.24, { eyes: 'open' }, 4.4);
    s.camera = look([-0.12, 0.06, 0.25 - k * 0.1], [0.05, 0.2, -1.2], 52, -0.05);
    s.casings = [];
    for (let i = 0; i < 10; i++) {
      const tt = frac(t * 0.9 + i * 0.1);
      const x = -0.5 + (i % 5) * 0.25, z = -0.4 - Math.floor(i / 5) * 0.3;
      s.casings.push({ p: [x, Math.max(0.012, 1.4 - tt * tt * 5), z], r: tt * 12 + i });
    }
    s.lines = blueLasers(191, t, 5);
    for (let i = 0; i < 6; i++) s.smokes.push({ p: [-1.5 + i * 0.6, 0.15, -1.5], size: 0.9, kind: 'smoke', color: [0.45, 0.5, 0.62], alpha: 0.5 });
    return s;
  }

  function glassesAdjust(t) {
    const s = blank('ruins', 'ruinsFire');
    const k = seg(t, 92.98, 93.98);
    s.kafka = kafka(0, -1, 0.15, { hR: [-0.12, 0.31, 0.12], eR: [-0.3, -1, 0.4], handR: 'point', wR: [0.4, 0, 0], eyes: 'shut', mouth: VOICE_MOUTH(t), nk: [0.08, 0.1, -0.06] });
    const m = Cast.solveKafka(s.kafka);
    const h = m.pts.head;
    s.camera = look([h[0] - 0.08, h[1] - 0.16, h[2] + 0.72 - k * 0.05], [h[0], h[1] - 0.14, h[2]], 42);
    return s;
  }

  function VOICE_MOUTH(t) {
    return speaking(t) === 'smile' ? 'smile' : 'talk';
  }

  function surprised(t) {
    const s = blank('ruins', 'ruinsFire');
    s.kafka = kafka(0, -1, 0.05, { hR: [-0.25, 0.25, 0.3], handR: 'open', eyes: 'wide', mouth: 'o', nk: [-0.05, 0, 0] });
    const m = Cast.solveKafka(s.kafka);
    const h = m.pts.head;
    s.camera = look([h[0] + 0.05, h[1] - 0.18, h[2] + 0.75], [h[0], h[1] - 0.16, h[2]], 42);
    s.sprites.push({ p: V3.add(h, [-0.7, 0.4, -1.2]), size: 0.9, kind: 'halo', color: [1, 0.5, 0.15], alpha: 1 });
    s.sprites.push({ p: V3.add(h, [-0.6, 0.5, -1.1]), size: 0.5, kind: 'star', color: [1, 0.8, 0.4], alpha: 1, roll: t * 4 });
    return s;
  }

  function blastHall(t) {
    const s = blank('warehouse', 'warehouse');
    const k = seg(t, 94.38, 95.38);
    s.noScreen = true;
    s.camera = shake(look([0, 1.6, 4.2], [0, 1.6, -4], 52), t, 0.04);
    for (let i = 0; i < 7; i++) {
      const e = frac(t * 0.9 + i * 0.14);
      const p = [-3 + i, 0.6 + S(i * 2.3) * 0.4, -3 - (i % 3)];
      s.sprites.push({ p, size: 0.8 + e * 1.6, kind: 'halo', color: [1, 0.5, 0.15], alpha: 1 - e });
    }
    const c = [0, 1.4, -4];
    for (let i = 0; i < 26; i++) {
      const a = i * 0.71 + k * 0.4, e = S(i * 1.3) * 0.6;
      s.lines.push({ a: c, b: V3.add(c, [C(a) * C(e) * 7, S(e) * 4, S(a) * 2]), w: 0.05, color: i % 3 ? [0.6, 0.7, 1] : [1, 0.85, 1], alpha: 0.8 });
    }
    s.sprites.push({ p: c, size: 2.4 + k * 1.5, kind: 'star', color: [0.85, 0.9, 1], alpha: 1, roll: k });
    s.sprites.push({ p: V3.add(c, [0.8, -0.6, 0.5]), size: 2.5, kind: 'halo', color: [1, 0.5, 0.15], alpha: 0.8 });
    s.sprites.push({ p: V3.add(c, [-1.4, -0.8, 0.8]), size: 1.8, kind: 'halo', color: [1, 0.6, 0.2], alpha: 0.7 });
    s.chroma = 3;
    if (t > 95.2) { s.flash = seg(t, 95.2, 95.38); s.flashColor = [1, 0.6, 0.3]; }
    return s;
  }

  const TERMS = [
    [95.38, 'grid'], [95.55, 'white'], [95.6, 'cross'], [95.65, 'whiteHall'], [95.7, 'shards'], [95.75, 'orange'],
    [95.8, 'sparks'], [96.18, 'mcguffin'], [96.3, 'burst'], [96.38, 'nonlinear'], [96.45, 'ink'], [96.53, 'oneiric']
  ];

  function terms(t) {
    let cur = TERMS[0];
    TERMS.forEach(x => { if (t >= x[0]) cur = x; });
    const kind = cur[1];
    if (kind === 'grid') {
      const s = card([0.86, 0.84, 0.88]);
      s.front.push({ tex: 'flare', w: 1.4, h: 0.04, y: 0.22, tint: [0, 0, 0] }, { tex: 'flare', w: 0.04, h: 1.4, x: -0.2 });
      s.front.forEach(f => { f.tex = 'halo'; f.tint = [0.05, 0.05, 0.05]; });
      s.flash = 0.2;
      return s;
    }
    if (kind === 'white') return card([1, 1, 1]);
    if (kind === 'cross') {
      const s = card([0.05, 0.02, 0.04]);
      s.front.push({ tex: 'flare', w: 1.2, h: 0.12, additive: true, tint: [1, 0.9, 0.95] }, { tex: 'flare', w: 0.12, h: 1.2, additive: true, tint: [1, 0.9, 0.95], rot: PI / 2 });
      return s;
    }
    if (kind === 'whiteHall') {
      const s = blank('warehouse', 'warehouse');
      s.invert = true;
      s.camera = look([0, 1.6, 3.6], [0, 1.2, -6], 56);
      return s;
    }
    if (kind === 'shards') {
      const s = blank('none', 'night');
      s.bg = [0, 0, 0];
      s.shards = Fx.crystalBurst(201, 30, [0, 0, -3], 2.5, 1, 3).map(x => Object.assign(x, { flat: [0.5, 0.35, 1, 1] }));
      s.camera = look([0, 0, 1], [0, 0, -3], 50);
      return s;
    }
    if (kind === 'orange') {
      const s = card([1, 0.45, 0.1]);
      s.front.push({ tex: 'star', scale: 1.6, w: 0.5625, h: 1, additive: true, tint: [1, 0.9, 0.7] });
      return s;
    }
    if (kind === 'sparks') {
      const s = blank('warehouse', 'warehouse');
      s.camera = look([0, 1.0, 2.4], [0, 1.0, -4], 54);
      for (let i = 0; i < 9; i++) {
        const p = [-2.5 + i * 0.62, 0.8 + S(i * 2.1) * 0.5, -2 - (i % 3) * 0.5];
        s.sprites.push({ p, size: 0.7, kind: 'star', color: [0.8, 0.75, 1], alpha: 1, roll: t * 6 + i });
        s.sprites.push({ p, size: 0.9, kind: 'halo', color: [0.6, 0.4, 1], alpha: 0.7 });
      }
      s.lines = Fx.laserGrid(211, 10, [[-4, 4], [0.2, 3], [-5, -1]], t * 6, [0.9, 0.5, 1], 0.03);
      return s;
    }
    if (kind === 'mcguffin' || kind === 'nonlinear' || kind === 'oneiric') {
      const s = card([0, 0, 0]);
      s.front.push({ tex: kind === 'mcguffin' ? 'cardMcGuffin' : kind === 'nonlinear' ? 'cardNonlinear' : 'cardOneiric', scale: 1.05 - (t - cur[0]) * 0.4 });
      s.chroma = 2;
      return s;
    }
    if (kind === 'burst') {
      const s = card([1, 0.85, 0.9]);
      s.front.push({ tex: 'star', scale: 2.2, w: 0.5625, h: 1, additive: true, tint: [1, 0.3, 0.6] });
      return s;
    }
    const s = card([0.98, 0.96, 0.97]);
    s.front.push({ tex: 'blotHands', scale: 0.9, tint: [0.35, 0.05, 0.12] });
    return s;
  }

  function endScreen(t) {
    const s = blank('warehouse', 'warehouse');
    const k = seg(t, 96.6, 97.35);
    s.env = 'night';
    s.camera = look([0, 2.0, 4.0 - k * 0.3], [0, 2.3, -8], 42);
    s.screenTint = [1, 1, 1];
    s.fade = 1 - seg(t, 96.95, 97.35);
    if (t < 96.7) { s.chroma = 4; s.flash = 0.3; }
    return s;
  }

  function blackGap() {
    return card([0, 0, 0]);
  }

  function redHallWalk(t) {
    const s = blank('hall', 'hallRed');
    const k = seg(t, 98.15, 100.38);
    s.lamps = 0.9;
    s.kafka = walking(t - 98.15, -2.6, -6.2, PI * 0.5 - 0.1, 0.6, { eyes: 'open', hR: [-0.2, -0.28, 0.06] }, 5.6);
    s.guards.push(lyingGuard(1.4, -5.6, 2.2, true), lyingGuard(-4.2, -7.4, 0.8, false), lyingGuard(3.6, -7.0, -1.2, true));
    s.camera = look([lerp(-0.6, -0.2, k), 0.45, 2.8], [-0.6, 1.6, -7], 50);
    s.fade = seg(t, 98.15, 98.75);
    return s;
  }

  function fallenGuard(t) {
    const s = blank('hall', 'hallRed');
    const k = seg(t, 100.38, 101.18);
    s.lamps = 0.6;
    const g = lyingGuard(0, -3, 0.4, true);
    s.guards.push(g);
    const m = Cast.solveGuard(g);
    s.camera = look(V3.add(m.pts.head, [0.42, 0.22, 0.42 - k * 0.05]), V3.add(m.pts.head, [0, 0.02, 0]), 44, 0.3);
    s.sprites.push({ p: V3.add(m.pts.head, [0, 0.13, 0.03]), size: 0.12, kind: 'halo', color: [1, 0.75, 0.35], alpha: 0.8 });
    return s;
  }

  function coinHand(t) {
    const s = blank('none', 'theaterLit');
    const k = seg(t, 101.18, 103.18);
    s.bg = [0.42, 0.02, 0.07];
    s.backdrop.push({ tex: 'blotRed', alpha: 0.45, scale: 1.5, tint: [1, 0.5, 0.5] });
    s.kafka = kafka(0, 0.9, PI, { hR: [-0.12, -0.05, 0.4], eR: [-0.7, -0.6, 0], handR: 'grip', wR: [0.5, 0, 0], eyes: 'open' });
    const m = Cast.solveKafka(s.kafka);
    const w = m.pts.wristR;
    const dir = V3.norm(V3.sub(w, m.pts.elbowR));
    const flip = seg(t, 102.85, 103.18);
    const tip = V3.add(V3.add(w, V3.mul(dir, 0.09)), [0, -0.035, 0]);
    s.coin = { p: V3.add(tip, [0, flip * 0.3, 0]), rx: PI / 2 + flip * 9, ry: 0.3, rz: 0, s: 0.028 };
    s.camera = look(V3.add(tip, [0.2, -0.09, 0.04 - k * 0.03]), V3.add(tip, [0, 0.03, 0.02]), 36, 0.15);
    s.petals = Fx.petalField(221, 8, V3.add(w, [0, -0.6, 0]), [1.4, 1.4, 1.4], t, { scale: 0.04 });
    return s;
  }

  function coinClose(t) {
    const s = blank('none', 'theater');
    const k = seg(t, 103.18, 104.18);
    s.bg = [0.55, 0.02, 0.08];
    s.backdrop.push({ tex: 'blotRed', alpha: 0.5, scale: 1.3 });
    s.coin = { p: [0, 0, 0], rx: k < 0.45 ? 0.2 + k * 0.6 : PI * 0.5 - 0.25 + (k - 0.45) * 2.6, ry: k < 0.45 ? 0 : 0.4, rz: 0, s: lerp(0.8, 1.0, k) };
    s.camera = look([0, 0.05, 1.7], [0, 0, 0], 40);
    if (k > 0.5) s.sprites.push({ p: [-0.45, 0.02, 0.2], size: 0.4, kind: 'halo', color: [0.9, 0.5, 1], alpha: (k - 0.5) });
    return s;
  }

  function seated(t) {
    const s = blank('theater', 'theater');
    const k = seg(t, 104.18, 107.18);
    s.kafka = kafka(0, 0.62, 0, {
      pos: [0, 0.66, 0.62],
      fLw: [-0.02, 0.45, 1.12],
      kLw: [0.05, 0.9, 1.5],
      fRw: [-0.14, 0.1, 1.06],
      hL: [0.12, 0.02, 0.3],
      eL: [0.6, -0.6, 0],
      handL: 'grip',
      hR: [-0.28, 0.2, 0.05],
      propR: 'katana',
      dirR: [0.25, 0.85, -0.3],
      eyes: blink(t, 'half'),
      mouth: VOICE_MOUTH(t),
      nk: [0.12, 0.05, 0]
    });
    const m = Cast.solveKafka(s.kafka);
    s.coin = { p: V3.add(m.pts.wristL, [0, 0.06, 0.05]), rx: 0.3, ry: 0, rz: 0, s: 0.028 };
    s.camera = look([0.15, 0.62, 2.2 - k * 0.15], [0, 1.15, 0.6], 42);
    s.petals = Fx.petalField(231, 16, [0, 0.4, 1.0], [3, 2.6, 1.6], t, { scale: 0.05, fall: 0.25 });
    s.cones.push({ p: [-0.8, 0, -2], h: 8, r: 2.2, tilt: 0.3, color: [1, 0.3, 0.4], alpha: 0.25 });
    s.fade = 1 - seg(t, 106.95, 107.18);
    return s;
  }

  function umbrella(t) {
    const s = blank('hall', 'hallRed');
    s.windowGlow = [1.0, 0.15, 0.22];
    s.lamps = 0.6;
    const base = [0.8, 2.6, -12.4];
    s.kafka = kafka(base[0], base[2], PI, { pos: [base[0], base[1] + 1.0, base[2]], base, ground: base[1] + 0.1, hR: [-0.12, 0.12, 0.2], eR: [-0.7, -0.6, 0], handR: 'grip', eyes: 'open', mouth: 'smile', umbrella: null });
    const m = Cast.solveKafka(s.kafka);
    s.kafka.umbrella = { at: V3.add(m.pts.wristR, [0, 0.0, 0]), yaw: 0, tilt: 0.25 };
    let cam;
    if (t < 110.38) {
      const k = seg(t, 108.45, 110.38);
      cam = look([lerp(-0.4, -0.25, k), 3.75, lerp(-9.2, -9.6, k)], [0.75, 4.1, -13.6], 46);
      s.fade = seg(t, 108.45, 109.2);
    } else if (t < 111.55) {
      const k = seg(t, 110.38, 111.55);
      cam = look([0.2, 3.5, -9.4 - k * 0.2], [0.8, 3.9, -13.4], 44);
    } else {
      const k = seg(t, 111.55, 112.58);
      cam = look(V3.add(m.pts.head, [-0.5, 0.05, 1.3 - k * 0.15]), V3.add(m.pts.head, [0.1, -0.15, -1.2]), 44);
    }
    s.camera = cam;
    if ((t > 110.38 && t < 110.55) || (t > 111.38 && t < 111.55)) {
      s.chroma = 7;
      s.kaleido = 1;
      s.zoomBlur = 0.15;
    }
    return s;
  }

  function profileSmile(t) {
    const s = blank('hall', 'hallRed');
    const k = seg(t, 112.58, 113.95);
    s.windowGlow = [1.0, 0.15, 0.22];
    s.kafka = kafka(0.8, -12.4, PI * 0.5 + 0.55, { pos: [0.8, 3.6, -12.4], base: [0.8, 2.6, -12.4], ground: 2.7, eyes: blink(t, 'half'), mouth: VOICE_MOUTH(t), nk: [0.1, 0.25, 0] });
    const m = Cast.solveKafka(s.kafka);
    const h = m.pts.head;
    s.camera = look([h[0] + 0.1, h[1] - 0.04, h[2] - 0.58 + k * 0.04], [h[0] + 0.03, h[1] - 0.06, h[2]], 40);
    return s;
  }

  function logo(t) {
    const s = card([0, 0, 0]);
    const k = seg(t, 113.95, 114.5);
    s.front.push({ tex: 'hsr', scale: lerp(0.62, 0.55, ease(k)), y: 0.05, alpha: k });
    if (t < 114.6) s.front.push({ tex: 'star', scale: 1.2 * (1 - k) + 0.3, w: 0.5625, h: 1, x: 0.02, y: 0.05, additive: true, tint: [1, 0.4, 0.85], alpha: 1 - k * 0.6 });
    s.front.push({ tex: 'credits', w: 0.62, h: 0.08, y: -0.33, alpha: seg(t, 115.1, 115.6) });
    s.fade = 1 - seg(t, 118.15, 118.45);
    return s;
  }

  function outro(t) {
    const s = card([0, 0, 0]);
    const k = seg(t, 118.45, 118.95);
    s.front.push({ tex: 'studio', scale: lerp(0.85, 0.72, ease(k)), x: -0.26, alpha: k });
    s.chroma = t < 118.9 ? 3 * (1 - k) : 0;
    s.fade = 1 - seg(t, 123.3, 123.78);
    return s;
  }

  window.KafkaAct3 = { drawKatana, liftDoor, liftTop, legsWalk, pinkStreaks, bwWebCenter, bwWebGuards, bwKaleido, bwTorso, katanaBokeh, redFlares, redRun, katanaLasers, crackFace, gunRaised, laserWeb, legsGuards, handEnergy, helmet, spotlight, screenSmile, entracte, blurFace, ruins, boots, glassesAdjust, surprised, blastHall, terms, endScreen, blackGap, redHallWalk, fallenGuard, coinHand, coinClose, seated, umbrella, profileSmile, logo, outro };
})();
