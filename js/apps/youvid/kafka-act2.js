(function () {
  const { V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, ease, frac } = K;
  const Cast = window.KafkaCast;
  const Fx = window.KafkaFx;
  const { seg, mix3, look, blank, card, blink, kafka, walking, running, guard, lyingGuard, pinkLasers, muzzle } = window.KafkaShots;

  const CORR_Z = -12;

  function darkFight(t) {
    const s = blank('hall', 'hallDark');
    const k = seg(t, 37.15, 37.75);
    const swing = ease(k);
    s.guards.push(guard(0.4, -1.6, -2.4, 'port', t, { sp: [0.3, -0.6 + swing * 1.2, 0.2], hR: mix3([-0.3, 0.3, 0.1], [-0.1, -0.1, 0.5], swing) }));
    s.guards.push(guard(-1.3, -3.4, 0.6, 'aim', t));
    s.camera = look([1.05, 1.45, -0.45], [-0.3, 1.35, -2.6], 52, 0.15);
    s.lines = pinkLasers(61, 12, t, [[-4, 4], [0.5, 3], [-6, 1]], 0.03);
    return s;
  }

  function pinkPetalFlash(t) {
    const s = card([1, 0.78, 0.9]);
    s.kind = 'scene';
    s.env = 'studio';
    s.camera = look([0, 1, 2], [0, 1, -2], 40);
    s.petals = Fx.burst(71, 40, [0, 1, -1.4], 2.4, t - 37.75 + 0.3, { scale: 0.08, speed: 3 });
    s.petalFlat = [0.85, 0.06, 0.22, 1];
    s.flash = 0.35;
    s.flashColor = [1, 0.9, 1];
    return s;
  }

  function bwFall(t) {
    const s = blank('hall', 'bw');
    s.bw = true;
    const k = seg(t, 37.95, 39.35);
    s.kafka = kafka(0.2, -5.0, 0, { hL: [0.5, 0.25, 0.2], hR: [-0.55, 0.3, 0.15], handL: 'open', handR: 'open', eyes: 'half' });
    const m = Cast.solveKafka(s.kafka);
    const fall = (x, z, yaw, t0, side) => {
      const f = ease(seg(t, t0, t0 + 0.9));
      return guard(x, z, yaw, 'port', t, { pos: [x + side * f * 0.3, lerp(1.02, 0.3, f), z], roll: side * f * 1.3, lean: -f * 0.4, rifle: f < 0.4 });
    };
    s.guards.push(fall(-2.6, -2.4, 0.9, 37.95, -1), fall(2.8, -3.2, -0.9, 38.1, 1), fall(-1.4, -6.8, 0.4, 38.3, -1), fall(3.6, -6.0, -0.5, 38.2, 1));
    s.guards.push(lyingGuard(-3.6, -4.6, 1.2, true), lyingGuard(1.6, -1.6, -2.0, false));
    s.camera = look([lerp(-0.6, -0.3, k), 0.8, 2.6], [0.2, 1.3, -5.0], 50);
    s.floorTint = [0.42, 0.42, 0.42];
    s.cones.push({ p: [0.2, 0, -5.0], h: 9, r: 0.9, color: [1, 0.2, 0.45], alpha: 0.6 });
    ['L', 'R'].forEach((sd, i) => {
      const w = m.pts['wrist' + sd];
      s.guards.slice(0, 4).forEach((g, j) => {
        if ((i + j) % 2) return;
        s.lines.push({ a: w, b: [g.pos[0], g.pos[1] + 0.3, g.pos[2]], w: 0.012, color: [1, 1, 1], alpha: 0.9 });
      });
    });
    for (let i = 0; i < 6; i++) {
      const a = i * 1.7 + t * 0.6;
      s.lines.push({ a: [S(a) * 4, 0.4 + i * 0.4, -3 + C(a) * 2], b: [S(a + 2) * 5, 2.6 - i * 0.3, -4 + C(a + 2) * 3], w: 0.015, color: [1, 1, 1], alpha: 0.7 });
    }
    s.petals = Fx.petalField(77, 30, [0.2, 0.3, -3.8], [6, 3, 5], t, { scale: 0.07, fall: 0.5 });
    s.lamps = 0.3;
    return s;
  }

  function inkFlower(t) {
    const s = card([0.02, 0.01, 0.02]);
    const k = seg(t, 39.35, 40.75);
    s.backdrop.push({ tex: 'blotRed', scale: 0.85 + k * 0.25, rot: k * 0.1 });
    s.front.push({ tex: 'inkEdges', scale: 1.1 - k * 0.08 });
    s.fade = 1 - seg(t, 40.45, 40.75) * 0.7;
    return s;
  }

  function lyingPose() {
    return kafka(0, 0, 0, {
      pos: [0, 0.16, 0],
      lean: -PI / 2,
      fLw: [0.14, 0.08, 0.92],
      fRw: [-0.2, 0.08, 0.78],
      kL: [0.1, 0.4, 1],
      kR: [-0.1, 0.5, 1],
      hL: [0.5, 0.28, 0.06],
      hR: [-0.46, 0.4, 0.04],
      eL: [0.5, 0.2, -0.5],
      eR: [-0.5, 0.2, -0.5],
      handL: 'open',
      handR: 'open',
      eyes: 'half'
    });
  }

  function lyingTop(t) {
    const s = blank('none', 'redRoom');
    const k = seg(t, 40.75, 41.8);
    s.bg = [0.03, 0.0, 0.02];
    s.backdrop.push({ tex: 'blotSplash', scale: 1.9 + k * 0.1, rot: 0.5 + k * 0.25, w: 0.5625, h: 1, tint: [0.55, 0.32, 0.4] });
    s.kafka = lyingPose();
    const roll = 0.6 + k * 0.25;
    s.camera = { eye: [0, 2.6 - k * 0.3, -0.1], at: [0, 0, -0.1], fov: 40, up: [S(roll), 0, -C(roll)] };
    s.fade = 0.25 + 0.75 * seg(t, 40.75, 41.1);
    return s;
  }

  function faceSideways(t) {
    const s = blank('none', 'redRoom');
    const k = seg(t, 41.8, 42.98);
    s.bg = [0.06, 0.0, 0.03];
    s.backdrop.push({ tex: 'blotSplash', scale: 1.6, rot: 1.2, tint: [0.5, 0.3, 0.36] });
    s.kafka = kafka(0, 0, 0.3, { eyes: 'open', glow: 0.8, mouth: 'flat', nk: [0.05, 0.2, 0] });
    const m = Cast.solveKafka(s.kafka);
    const h = m.pts.head;
    s.camera = look([h[0] + 0.15, h[1] + 0.02, h[2] + 0.42 - k * 0.04], [h[0] + 0.02, h[1] - 0.02, h[2]], 40, -1.25);
    s.fade = seg(t, 41.8, 42.05);
    return s;
  }

  function kaleidoFace(t) {
    const s = faceSideways(t - 1.2);
    s.kaleido = 2;
    s.grade = [1.35, 0.62, 1.12, 0.25];
    s.fade = 1;
    s.zoomBlur = 0.04;
    return s;
  }

  function redWindowStand(t) {
    const s = blank('hall', 'redRoom');
    const k = seg(t, 43.38, 46.0);
    s.windowGlow = [1.0, 0.18, 0.3];
    s.lamps = 0.2;
    s.kafka = kafka(0, -12.6, 0, {
      pos: [0, 3.6, -12.6], base: [0, 2.6, -12.6], ground: 2.7,
      hL: [0.22, -0.3, 0.06], hR: [-0.2, -0.3, 0.08], eyes: 'half', mouth: 'smile', glow: 0.5,
      footL: [0.11, 0, 0.04], footR: [-0.1, 0, -0.02]
    });
    const m = Cast.solveKafka(s.kafka);
    const chest = m.pts.chest;
    const glow = ease(seg(t, 44.1, 44.9));
    if (glow > 0) {
      s.sprites.push({ p: V3.add(chest, [0, -0.06, 0.16]), size: 0.08 + glow * 0.12, kind: 'spider', color: [1, 0.6, 1], alpha: glow });
      s.sprites.push({ p: V3.add(chest, [0, -0.06, 0.17]), size: 0.2 + glow * 0.35, kind: 'halo', color: [0.9, 0.3, 0.9], alpha: glow * 0.7 });
    }
    if (t < 44.75) {
      s.camera = look([lerp(0.1, 0.03, k), 2.72, -11.35 + k * 0.1], [0, 3.55, -12.6], 52);
    } else {
      const kk = seg(t, 44.75, 46.0);
      s.camera = look([0.3, 2.75, -9.9 + kk * 0.15], [0, 3.5, -12.6], 52);
      s.fg.push(guard(-0.9, -10.7, PI - 0.4, 'aim', t, { pos: [-0.9, 3.62, -10.7], base: [-0.9, 2.6, -10.7], ground: 2.68 }));
      s.fg.push(guard(1.15, -10.9, PI + 0.5, 'aim', t + 1, { pos: [1.15, 3.62, -10.9], base: [1.15, 2.6, -10.9], ground: 2.68 }));
      if (kk > 0.5) s.lines.push(...Fx.lightning(Math.floor(t * 14), V3.add(chest, [0, 0, 0.18]), [-0.9, 3.9, -10.8], 7, 0.18, 0.02, [0.9, 0.4, 1.0]));
    }
    s.flash = 0.6 * seg(t, 45.8, 46.0);
    s.flashColor = [1, 0.85, 1];
    return s;
  }

  function whiteBlast(t) {
    const s = card([1, 0.97, 0.9]);
    const k = seg(t, 46.0, 46.4);
    s.front.push({ tex: 'star', scale: 1.4 + k * 1.5, additive: true, tint: [1, 0.85, 0.5], w: 0.5625, h: 1 });
    s.front.push({ tex: 'halo', scale: 2.2, additive: true, tint: [1, 0.6, 0.3], alpha: 0.6, w: 0.5625, h: 1 });
    s.flash = 0.3 * (1 - k);
    return s;
  }

  function smokeRoom(t) {
    const s = blank('hall', 'smoke');
    const k = seg(t, 46.4, 48.75);
    s.lamps = 0.1;
    s.guards.push(lyingGuard(-1.4, -4.0, 0.8, true), lyingGuard(1.2, -5.6, -2.2, false), lyingGuard(-2.6, -7.0, 2.6, true), lyingGuard(2.6, -3.2, 1.5, false));
    s.camera = look([0.4, 0.55 + k * 0.1, 0.6], [0, 0.7, -6], 50);
    for (let i = 0; i < 14; i++) {
      const a = i * 2.39;
      s.smokes.push({ p: [S(a) * 3.2 + S(t * 0.3 + i) * 0.3, 0.4 + (i % 4) * 0.5, -2.5 - (i % 6) * 1.1], size: 1.6, kind: 'smoke', color: [0.5, 0.45, 0.55], alpha: 0.5 });
    }
    for (let i = 0; i < 18; i++) {
      const a = i * 1.7;
      const y = frac(0.1 * t + i * 0.13) * 2.5;
      s.sprites.push({ p: [S(a) * 2.5, y, -2 - (i % 5) * 0.9], size: 0.025, kind: 'star', color: [1, 0.6, 0.3], alpha: 0.8 });
    }
    if (t > 46.8 && t < 48.0) {
      const sd = Math.floor(t * 16);
      s.lines.push(...Fx.lightning(sd, [-1.6, 0.05, -1.5], [0.6, 0.05, -3.4], 8, 0.25, 0.025, [0.75, 0.3, 1.0]));
      s.lines.push(...Fx.lightning(sd + 7, [1.2, 0.05, -2.0], [2.4, 0.05, -4.2], 6, 0.2, 0.02, [0.75, 0.3, 1.0]));
    }
    s.fade = 0.55 + 0.45 * seg(t, 46.4, 46.8);
    return s;
  }

  function nightClose(t) {
    const s = blank('none', 'night');
    s.bg = [0.03, 0.02, 0.05];
    const k = seg(t, 48.75, 49.48);
    s.kafka = kafka(0, 0, 0.2, { eyes: 'half', mouth: 'smile', nk: [0.32 - k * 0.1, 0.1, 0] });
    const m = Cast.solveKafka(s.kafka);
    const h = m.pts.head;
    s.camera = look([h[0] - 0.08, h[1] - 0.08, h[2] + 0.52], [h[0], h[1] - 0.06, h[2]], 40);
    return s;
  }

  function katanaFace(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 49.48, 50.18);
    s.kafka = kafka(0, CORR_Z, 0, { eyes: 'open', glow: 0.55, mouth: 'smirk', nk: [-0.05, 0.12, 0.05], hR: [-0.24, 0.02, 0.3], eR: [-0.6, -0.8, 0.2], handR: 'grip' });
    const m = Cast.solveKafka(s.kafka);
    const h = m.pts.head;
    s.katana = { p: V3.add(m.pts.wristR, [0, 0.03, 0.03]), dir: [0.02, 1, 0.04], up: [0, 0, 1] };
    s.camera = look([h[0] - 0.02, h[1] - 0.08, h[2] + 0.62 - k * 0.05], [h[0] - 0.08, h[1] - 0.1, h[2]], 44);
    s.sprites.push({ p: V3.add(m.pts.wristR, [0, 0.55, 0.04]), size: 0.18, kind: 'halo', color: [0.9, 0.85, 1], alpha: 0.5 });
    return s;
  }

  function guardClose(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 50.18, 51.05);
    const g = guard(0.3, CORR_Z, 0.3, 'aim', t);
    s.guards.push(g, guard(-0.8, CORR_Z - 2.4, 0.1, 'port', t));
    const m = Cast.solveGuard(g);
    s.camera = look(V3.add(m.pts.chest, [-0.1, 0.25, 1.0 - k * 0.1]), V3.add(m.pts.chest, [0.08, 0.02, 0]), 48, -0.12);
    if (t > 50.95) {
      s.flash = 0.6;
      s.flashColor = [0.8, 0.4, 1];
      s.shards = Fx.crystalBurst(83, 14, V3.add(m.pts.chest, [0, 0.2, 0.6]), 0.6, 1, 2.6);
    }
    return s;
  }

  function guardFire(t) {
    const s = blank('corridor', 'corridor');
    const g = guard(-0.3, CORR_Z, 0.5, 'aim', t);
    s.guards.push(g);
    const m = Cast.solveGuard(g);
    const muz = V3.add(m.pts.wristR, V3.mul(g.aimDir, 1.0));
    s.sprites.push(...muzzle(muz, t, 18, 0.35, [1, 0.7, 0.3]));
    s.lines.push({ a: muz, b: V3.add(muz, V3.mul(g.aimDir, 5)), w: 0.04, color: [1, 0.65, 0.25], alpha: 1 });
    s.camera = look(V3.add(m.pts.chest, [1.2, 0.1, 0.6]), V3.add(m.pts.chest, [-0.2, 0.1, 0.4]), 48, 0.2);
    return s;
  }

  function clockShot(t, t0, t1, numeral, target, eye) {
    const s = blank('clock', 'clock');
    const k = seg(t, t0, t1);
    s.clockRot = (numeral / 24) * PI * 2;
    s.handAngle = s.clockRot - ((numeral - 0.6 + k * 0.9) / 24) * PI * 2;
    s.minuteAngle = s.clockRot - (t * 0.8);
    s.camera = look(V3.add(eye, [k * 0.1, 0, -k * 0.15]), target, 36, 0.12 - k * 0.08);
    s.vignette = 0.35;
    return s;
  }

  function clock1(t) {
    return clockShot(t, 51.38, 51.98, 11.5, [0.15, 1.5, 0], [0.5, 1.05, 1.15]);
  }

  function smokeWalk(t) {
    const s = blank('corridor', 'smokeDark');
    s.kafka = walking(t - 51.98, 0, CORR_Z - 3.6, 0, 0.9, { eyes: 'half', propR: 'smg', hR: [-0.18, -0.25, 0.12] });
    s.camera = look([0.2, 1.3, CORR_Z + 2.5], [0, 1.2, CORR_Z - 4], 40);
    for (let i = 0; i < 10; i++) s.smokes.push({ p: [S(i * 2.1) * 1.4, 0.3 + (i % 3) * 0.4, CORR_Z - 1 - (i % 5) * 1.2], size: 1.4, kind: 'smoke', color: [0.55, 0.48, 0.62], alpha: 0.55 });
    return s;
  }

  function slashArc(center, r0, a0, a1, color, width) {
    const out = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const p0 = a0 + (a1 - a0) * (i / n), p1 = a0 + (a1 - a0) * ((i + 1) / n);
      out.push({ a: [center[0] + C(p0) * r0, center[1] + S(p0) * r0, center[2]], b: [center[0] + C(p1) * r0, center[1] + S(p1) * r0, center[2]], w: width * (0.4 + 0.6 * S((i + 0.5) / n * PI)), color, alpha: 1 });
    }
    return out;
  }

  function guardSlash(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 52.42, 52.95);
    s.guards.push(guard(-0.5, CORR_Z + 1.2, PI - 0.7, 'port', t, { sp: [0.2, 0.6 - k * 1.2, 0.1] }));
    s.kafka = kafka(0.4, CORR_Z - 1.6, 0.2, { eyes: 'open', hR: [-0.3, 0.1, 0.35], propR: 'smg' });
    s.camera = look([0.9, 1.25, CORR_Z + 3.6], [0, 1.3, CORR_Z - 1], 46);
    s.lines = slashArc([-0.4, 1.3, CORR_Z + 1.6], 0.9, 2.6 - k * 2.2, 1.0 - k * 2.2, [1, 0.55, 0.15], 0.07);
    return s;
  }

  function kafkaShoots(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 52.95, 53.35);
    s.kafka = kafka(0.7, CORR_Z, -PI * 0.5 - 0.1, { hR: [-0.06, 0.15, 0.52], eR: [-0.6, -0.5, -0.1], propR: 'smg', eyes: 'open', mouth: 'smirk' });
    const g = guard(-0.9, CORR_Z - 0.2, PI * 0.5, 'port', t, { roll: k * 0.3 });
    s.guards.push(g);
    const m = Cast.solveKafka(s.kafka);
    const muz = V3.add(m.pts.wristR, V3.mul(V3.norm(V3.sub(m.pts.wristR, m.pts.elbowR)), 0.32));
    s.sprites.push(...muzzle(muz, t, 20, 0.16));
    s.sprites.push({ p: [-0.85, 1.4, CORR_Z - 0.2], size: 0.35, kind: 'star', color: [0.8, 0.85, 1], alpha: 1, roll: t * 4 });
    s.petals = Fx.burst(91, 22, [-0.85, 1.3, CORR_Z - 0.2], 1.0, k * 0.8 + 0.1, { scale: 0.05 });
    s.camera = look([0.4, 1.2, CORR_Z + 2.6], [-0.1, 1.3, CORR_Z - 0.4], 46);
    return s;
  }

  function guardFront(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 53.35, 53.88);
    s.guards.push(guard(0.55, CORR_Z + 2.0, PI + 0.25, 'aim', t));
    s.kafka = running(t - 53.35, -0.7, CORR_Z - 1.0 + k * 0.3, PI * 0.4, 1.2, { eyes: 'open' });
    s.lines.push({ a: [0.3, 0.05, CORR_Z + 1.2], b: [-0.3, 0.05, CORR_Z - 2], w: 0.05, color: [1, 0.5, 0.2], alpha: 0.8 });
    s.camera = look([1.05, 1.5, CORR_Z + 3.6], [-0.2, 1.2, CORR_Z - 1.0], 50);
    return s;
  }

  function kafkaJump(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 53.88, 54.38);
    const air = S(k * PI) * 0.45;
    s.kafka = kafka(lerp(0.9, -0.1, k), CORR_Z, -PI * 0.5, { pos: [lerp(0.9, -0.1, k), 1.0 + air, CORR_Z], lean: 0.5, roll: 0.3, fLw: [lerp(0.4, -0.6, k), 1.0 + air, CORR_Z + 0.1], kL: [0, 0.5, 1], fR: [-0.1, -0.5, -0.3], hR: [-0.3, 0.3, 0.2], hL: [0.3, 0.3, 0.1], eyes: 'open' });
    s.guards.push(guard(-0.9, CORR_Z - 0.3, PI * 0.5, 'port', t, { roll: k * 0.25 }));
    s.camera = look([0.3, 1.5, CORR_Z + 3.0], [0, 1.4, CORR_Z], 46, 0.18);
    if (t > 54.38) {
      s.flash = 0.85;
      s.flashColor = [1, 0.85, 0.95];
      s.zoomBlur = 0.2;
    }
    return s;
  }

  function clock2(t) {
    return clockShot(t, 54.58, 55.12, 10, [-0.1, 1.45, 0], [-0.55, 1.05, 1.2]);
  }

  function smgCorridor(t) {
    const s = blank('corridor', 'corridor');
    s.kafka = kafka(0.3, CORR_Z, -PI * 0.5 + 0.2, { hR: [-0.08, 0.16, 0.52], eR: [-0.5, -0.6, -0.2], propR: 'smg', hL: [0.15, -0.1, 0.25], eyes: 'open', mouth: 'smirk' });
    const m = Cast.solveKafka(s.kafka);
    const dir = V3.norm(V3.sub(m.pts.wristR, m.pts.elbowR));
    const muz = V3.add(m.pts.wristR, V3.mul(dir, 0.32));
    s.sprites.push(...muzzle(muz, t, 22, 0.15));
    s.lines.push({ a: muz, b: V3.add(muz, V3.mul(dir, 4)), w: 0.015, color: [1, 0.85, 0.5], alpha: frac(t * 22) < 0.5 ? 0.9 : 0 });
    s.camera = look([-0.5, 1.35, CORR_Z + 1.9], [0.1, 1.3, CORR_Z - 0.2], 44);
    return s;
  }

  function closeFight(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 55.75, 56.38);
    s.kafka = kafka(0.2, CORR_Z, -PI * 0.5 - 0.3, { sp: [0.35, 0.2, 0], lean: 0.2, hR: [-0.25, 0.2, 0.4], hL: [0.2, 0.25, 0.35], fL: [0.12, -0.7, 0.4], eyes: 'open' });
    s.guards.push(guard(-0.55, CORR_Z - 0.1, PI * 0.5, 'port', t, { lean: 0.35 + k * 0.2, sp: [0.4, 0, 0] }));
    s.camera = look([0.6, 1.5, CORR_Z + 1.6], [-0.1, 1.15, CORR_Z], 46, -0.1);
    s.petals = Fx.petalField(97, 10, [0, 0.6, CORR_Z], [2, 1.5, 1.5], t, { scale: 0.05 });
    return s;
  }

  function corridorGun(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 56.38, 57.2);
    s.kafka = kafka(0, CORR_Z, lerp(0.6, -0.4, ease(k)), { hR: [-0.12, 0.05, 0.3], propR: 'smg', hL: [0.18, -0.2, 0.1], eyes: blink(t), nk: [0, 0.2 - k * 0.4, 0] });
    s.guards.push(lyingGuard(0.8, CORR_Z - 2, 0.5, true));
    s.camera = look([-0.7, 1.55, CORR_Z + 1.55], [0.1, 1.3, CORR_Z], 44);
    s.petals = Fx.petalField(101, 14, [0, 0.4, CORR_Z + 0.5], [2.6, 2.4, 2.4], t, { scale: 0.05 });
    return s;
  }

  function backClose(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 57.2, 57.75);
    s.kafka = kafka(0, CORR_Z, PI + 0.3, { hR: [-0.1, 0.05, 0.4], propR: 'smg', eyes: 'open' });
    const m = Cast.solveKafka(s.kafka);
    s.camera = look(V3.add(m.pts.chest, [0.2, 0.12, 0.72 - k * 0.1]), V3.add(m.pts.chest, [0.0, 0.04, 0]), 44, 0.1);
    return s;
  }

  function orangeSlash(t) {
    const s = blank('corridor', 'night');
    const k = seg(t, 57.75, 57.98);
    s.camera = look([0, 1.4, CORR_Z + 3], [0, 1.4, CORR_Z], 46);
    s.lines = slashArc([0.2, 1.0, CORR_Z + 1.2], 1.1, 2.9 - k * 1.8, 1.6 - k * 1.8, [1, 0.6, 0.2], 0.12);
    s.fade = 0.7;
    return s;
  }

  function sparksShoot(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 57.98, 58.38);
    s.kafka = kafka(0.5, CORR_Z, -PI * 0.5 - 0.25, { hR: [-0.06, 0.15, 0.52], propR: 'smg', eyes: 'open' });
    const g = guard(-0.6, CORR_Z - 0.3, PI * 0.5, 'port', t);
    s.guards.push(g);
    const hit = [-0.55, 1.45, CORR_Z - 0.1];
    s.sprites.push({ p: hit, size: 0.5 + k * 0.3, kind: 'star', color: [1, 0.8, 0.45], alpha: 1, roll: k * 2 });
    s.sprites.push({ p: hit, size: 0.9, kind: 'halo', color: [1, 0.5, 0.2], alpha: 0.6 });
    for (let i = 0; i < 12; i++) {
      const a = i * 0.52 + k;
      s.lines.push({ a: hit, b: V3.add(hit, [C(a) * (0.3 + k * 0.5), S(a) * (0.3 + k * 0.5), 0.1]), w: 0.012, color: [1, 0.8, 0.4], alpha: 1 - k * 0.5 });
    }
    s.lines.push({ a: [0.7, 1.4, CORR_Z + 0.2], b: hit, w: 0.03, color: [0.7, 0.4, 1], alpha: 0.9 });
    s.camera = look([0.2, 1.4, CORR_Z + 2.4], [-0.2, 1.4, CORR_Z], 48, -0.1);
    return s;
  }

  function corridorDark(t) {
    const s = blank('corridor', 'night');
    s.kafka = kafka(0.1, CORR_Z - 6, 0.2, { eyes: 'open', propR: 'smg', hR: [-0.2, -0.2, 0.15] });
    s.guards.push(guard(-0.6, CORR_Z - 4.4, PI + 0.3, 'aim', t));
    s.camera = look([0.4, 1.6, CORR_Z + 2], [0, 1.2, CORR_Z - 6], 40);
    s.lampTint = [0.5, 0.4, 0.6];
    return s;
  }

  function smgClose(t) {
    const s = blank('corridor', 'corridor');
    s.kafka = kafka(0.2, CORR_Z, -PI * 0.5, { hR: [-0.06, 0.15, 0.52], propR: 'smg', eyes: 'open', mouth: 'smirk' });
    const m = Cast.solveKafka(s.kafka);
    const w = m.pts.wristR;
    const dir = V3.norm(V3.sub(w, m.pts.elbowR));
    const muz = V3.add(w, V3.mul(dir, 0.33));
    s.sprites.push(...muzzle(muz, t, 24, 0.12));
    s.camera = look(V3.add(w, [0.32, 0.12, 0.62]), V3.add(w, [0.18, 0.08, -0.05]), 44);
    return s;
  }

  function rifleClose(t) {
    const s = blank('corridor', 'corridor');
    const g = guard(0, CORR_Z, 0.9, 'aim', t);
    s.guards.push(g);
    const m = Cast.solveGuard(g);
    s.camera = look(V3.add(m.pts.wristR, [-0.1, 0.35, 0.6]), V3.add(m.pts.wristR, [0.2, 0, 0.3]), 40, 0.5);
    return s;
  }

  function slashFlash(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 59.38, 59.98);
    s.kafka = kafka(0.3, CORR_Z, -PI * 0.5 - 0.2, { sp: [0.25, 0.4 - k * 0.8, 0], hR: mix3([-0.4, 0.3, 0.2], [0.3, -0.1, 0.4], k), propR: 'katana', dirR: [-0.6, 0.4 - k, -0.4], eyes: 'open' });
    s.guards.push(guard(-0.7, CORR_Z - 0.2, PI * 0.5, 'port', t, { lean: k * 0.4 }));
    const hit = [-0.4, 1.4, CORR_Z];
    s.sprites.push({ p: hit, size: 0.4 + k * 0.4, kind: 'star', color: [0.75, 0.85, 1], alpha: 1 - k * 0.5, roll: k });
    s.lines.push({ a: [0.8, 1.9 - k * 0.6, CORR_Z + 0.2], b: [-1.2, 0.9 - k * 0.4, CORR_Z - 0.2], w: 0.05, color: [0.6, 0.75, 1], alpha: 1 - k });
    s.petals = Fx.burst(107, 18, hit, 0.9, k * 0.7 + 0.1, { scale: 0.05 });
    s.camera = look([0.6, 1.3, CORR_Z + 2.2], [-0.1, 1.35, CORR_Z], 48);
    return s;
  }

  function topDodge(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 59.98, 61.05);
    const bend = ease(seg(t, 59.98, 60.5));
    s.kafka = kafka(0, CORR_Z, 0.4, { pos: [0, 1.0 - bend * 0.25, CORR_Z], lean: -bend * 1.0, sp: [-bend * 0.4, 0, 0], hL: [0.45, 0.25, -0.1], hR: [-0.5, 0.2, -0.1], propR: 'smg', footL: [0.18, 0, 0.3], footR: [-0.16, 0, 0.18], eyes: 'open' });
    s.guards.push(guard(0.9, CORR_Z + 0.9, PI + 0.6, 'aim', t), guard(-1.0, CORR_Z - 0.8, 0.9, 'aim', t + 1));
    s.camera = { eye: [0.1, 3.9, CORR_Z + 0.2], at: [0, 0.6, CORR_Z], fov: 46, up: [S(1.0 + k * 0.3), 0, -C(1.0 + k * 0.3)] };
    s.petals = Fx.petalField(111, 26, [0, 0.0, CORR_Z], [3, 2.4, 3], t, { scale: 0.05, fall: 0.3 });
    s.lines.push({ a: [1.2, 1.3, CORR_Z + 1.2], b: [-1.6, 1.2, CORR_Z - 1.2], w: 0.03, color: [1, 0.6, 0.3], alpha: frac(t * 6) < 0.5 ? 0.9 : 0 });
    return s;
  }

  function upsideDown(t) {
    const s = blank('corridor', 'corridor');
    const k = seg(t, 61.05, 61.62);
    s.kafka = kafka(0, CORR_Z, 0, { hL: [0.45, 0.15, 0.3], hR: [-0.45, 0.15, 0.3], propL: 'smg', propR: 'smg', eyes: 'open', mouth: 'smirk' });
    const m = Cast.solveKafka(s.kafka);
    ['L', 'R'].forEach(sd => {
      const w = m.pts['wrist' + sd];
      const dir = V3.norm(V3.sub(w, m.pts['elbow' + sd]));
      s.sprites.push(...muzzle(V3.add(w, V3.mul(dir, 0.32)), t + (sd === 'L' ? 0.03 : 0), 20, 0.14));
    });
    s.camera = look([0.1, 1.15, CORR_Z + 1.5 - k * 0.2], [0, 1.25, CORR_Z], 48, PI - 0.15);
    s.petals = Fx.petalField(117, 14, [0, 0.4, CORR_Z + 0.4], [2.4, 2.2, 1.6], t, { scale: 0.05 });
    if (t > 61.62) {
      s.flash = 0.9;
      s.flashColor = [1, 0.95, 1];
    }
    return s;
  }

  function clock3(t) {
    const s = clockShot(t, 61.78, 62.42, 2, [-0.35, 1.25, 0], [-0.75, 0.95, 0.65]);
    s.camera.fov = 30;
    return s;
  }

  window.KafkaAct2 = { darkFight, pinkPetalFlash, bwFall, inkFlower, lyingTop, faceSideways, kaleidoFace, redWindowStand, whiteBlast, smokeRoom, nightClose, katanaFace, guardClose, guardFire, clock1, smokeWalk, guardSlash, kafkaShoots, guardFront, kafkaJump, clock2, smgCorridor, closeFight, corridorGun, backClose, orangeSlash, sparksShoot, corridorDark, smgClose, rifleClose, slashFlash, topDodge, upsideDown, clock3 };
})();
