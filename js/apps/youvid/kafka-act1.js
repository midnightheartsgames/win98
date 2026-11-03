(function () {
  const { V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Cast = window.KafkaCast;
  const Fx = window.KafkaFx;
  const { seg, mix3, look, blank, card, blink, kafka, walking, guard, pinkLasers, muzzle } = window.KafkaShots;

  function studioIntro(t) {
    const s = card([0, 0, 0]);
    const k = seg(t, 0, 0.45);
    s.front.push({ tex: 'studio', scale: lerp(1.12, 1, ease(k)), alpha: k < 1 ? clamp(k * 3, 0, 1) : 1 });
    s.flash = t < 0.5 ? 0.6 * (1 - seg(t, 0.15, 0.5)) * seg(t, 0, 0.15) : 0;
    s.flashColor = [0.6, 0.85, 1];
    s.chroma = t < 0.5 ? 3 * (1 - k) : 0;
    return s;
  }

  function armPose(t, k) {
    return kafka(0.6, 2.4, PI, {
      hR: mix3([-0.1, 0.06, 0.46], [-0.06, 0.1, 0.5], k),
      eR: [-0.6, -0.5, -0.2],
      handR: 'point',
      hL: [0.2, -0.3, 0.05],
      wR: [0.2, 0, S(t * 1.3) * 0.05],
      nk: [0.1, 0.2, 0]
    });
  }

  function threadFrom(m, len, t) {
    const dir = V3.norm(V3.sub(m.pts.wristR, m.pts.elbowR));
    const tip = V3.add(m.pts.wristR, V3.mul(dir, 0.12));
    const end = V3.add(tip, V3.mul(V3.norm(V3.add(dir, [0, -0.15, 0])), len));
    return { tip, end };
  }

  function handGlow(t) {
    const s = blank('hall', 'hallBlue');
    const k = seg(t, 2.45, 5.95);
    s.kafka = armPose(t, k);
    const m = Cast.solveKafka(s.kafka);
    const th = threadFrom(m, 1.6, t);
    const w = m.pts.wristR;
    s.camera = look(V3.add(w, [lerp(0.5, 0.44, k), lerp(0.2, 0.16, k), lerp(0.16, 0.1, k)]), V3.add(w, [-0.16, -0.05, -0.2]), 42);
    s.lines.push({ a: th.tip, b: th.end, w: 0.006, color: [0.8, 0.4, 1.0], alpha: 0.9 });
    s.sprites.push({ p: th.tip, size: 0.03 + 0.006 * S(t * 9), kind: 'halo', color: [0.9, 0.5, 1.0], alpha: 1 });
    s.sprites.push({ p: th.tip, size: 0.012, kind: 'star', color: [1, 0.85, 1], alpha: 1 });
    s.lamps = 0.8;
    if (t < 2.75) s.front.push({ tex: 'studio', scale: 1, alpha: 1 - seg(t, 2.45, 2.75) });
    s.fade = seg(t, 2.45, 3.1) * 0.6 + 0.1;
    return s;
  }

  function guardsHall(t) {
    const s = blank('hall', 'hallBlue');
    const k = seg(t, 5.95, 8.35);
    const swing = ease(seg(t, 7.6, 8.1));
    s.guards.push(guard(-5.7, -2.4, 0.75 - swing * 0.6, swing > 0.5 ? 'low' : 'port', t, swing > 0.1 ? { hR: mix3([-0.16, -0.22, 0.16], [-0.2, -0.14, 0.2], swing), hL: mix3([0.17, 0.08, 0.3], [0.05, -0.1, 0.42], swing) } : {}));
    s.guards.push(guard(-7.7, -6.6, 0.4, 'port', t + 1));
    s.camera = look([lerp(-4.85, -4.78, k), 0.3, lerp(-1.0, -1.12, k)], [lerp(-6.1, -6.0, k), 2.05, -3.3], 50);
    s.cones.push({ p: [-6.6, 0, -6.5], h: 8.5, r: 1.6, tilt: -0.35, color: [0.45, 0.55, 0.95], alpha: 0.22 });
    return s;
  }

  function handGlow2(t) {
    const s = blank('hall', 'hallBlue');
    const k = seg(t, 8.35, 10.62);
    s.kafka = armPose(t, 0.6 + k * 0.4);
    s.kafka.hR = mix3([-0.12, 0.0, 0.48], [-0.08, 0.03, 0.5], k);
    const m = Cast.solveKafka(s.kafka);
    const th = threadFrom(m, 1.4, t);
    const w = m.pts.wristR;
    s.camera = look(V3.add(w, [lerp(0.46, 0.4, k), 0.36, 0.22]), V3.add(w, [-0.2, -0.1, -0.22]), 40);
    s.lines.push({ a: th.tip, b: th.end, w: 0.005, color: [0.6, 0.4, 1.0], alpha: 0.85 });
    s.sprites.push({ p: th.tip, size: 0.026, kind: 'halo', color: [0.7, 0.5, 1.0], alpha: 1 });
    s.fade = 0.45;
    return s;
  }

  function chandelierGuard(t) {
    const s = blank('hall', 'hallBlue');
    const k = seg(t, 10.62, 14.25);
    s.guards.push(guard(0.9, -2.5, 0.12, 'port', t));
    s.chandelier = [0.55, 3.55, -3.6];
    s.camera = look([lerp(0.45, 0.6, k), 1.1, lerp(1.7, 1.45, k)], [0.85, 2.35, -2.5], 48);
    s.cones.push({ p: [1.0, 0, -2.6], h: 6.2, r: 1.4, tilt: -0.25, color: [0.6, 0.72, 1.0], alpha: 0.35 });
    const pass = seg(t, 11.4, 14.2);
    if (pass > 0) {
      const cam = s.camera.eye;
      s.kafka = walking(t - 11.4, cam[0] - 0.62 + pass * 0.2, cam[2] - 0.6, PI * 0.5 + 0.25, 0.25, { eyes: 'half' });
    }
    s.flash = 0.25 * seg(t, 14.0, 14.25);
    s.flashColor = [0.3, 0.3, 0.6];
    return s;
  }

  function darkRibbon(t) {
    const s = blank('hall', 'hallDark');
    const k = seg(t, 14.25, 14.8);
    s.camera = look([2.0, 1.4, 3.0], [2.4, 1.3, -2], 40);
    s.petals.push({ p: [lerp(3.4, 1.6, k), 1.5 + k * 0.1, 1.6], rx: 0.6, ry: 1.2 + k * 2, rz: k * 3, s: 0.5 });
    s.fade = 0.55;
    return s;
  }

  const MONTAGE = [
    [14.8, 'petalsWhite'], [14.9, 'blotRed'], [15.0, 'redGlow'], [15.1, 'blotWhite'], [15.5, 'magenta'], [15.6, 'vy'],
    [15.7, 'words'], [15.8, 'blotInkQ'], [15.9, 'magentaFlakes'], [16.0, 'emblemDark'], [16.1, 'magentaFlakes'], [16.2, 'crystal'],
    [16.4, 'eyeShape'], [16.5, 'eyeDim'], [16.6, 'spiral'], [16.8, 'dark'], [17.0, 'silhouette'], [17.1, 'kafkaGrey'],
    [17.2, 'whitePetals'], [17.3, 'pinkPetals'], [17.7, 'blotDarkQ'], [18.0, 'blotInk'], [18.1, 'magenta'], [18.2, 'seeQ'], [18.5, 'flare']
  ];

  function montage(t) {
    let cur = MONTAGE[0];
    MONTAGE.forEach(m => { if (t >= m[0]) cur = m; });
    const kind = cur[1];
    const local = t - cur[0];
    const s = card([0, 0, 0]);
    const zoom = 1 + local * 0.18;
    const full = (tex, extra) => s.backdrop.push(Object.assign({ tex, scale: zoom }, extra || {}));
    if (kind === 'petalsWhite') { s.bg = [0.96, 0.95, 0.96]; s.kind = 'scene'; s.petals = Fx.petalField(3, 5, [0, 0.9, -2.4], [1.6, 1.2, 0.2], local, { scale: 0.32 }); s.petalFlat = [0.1, 0.02, 0.05, 1]; }
    else if (kind === 'blotRed') full('blotDark');
    else if (kind === 'redGlow') full('blotRed');
    else if (kind === 'blotWhite') full('blotWhite', { scale: 1.02 + local * 0.08 });
    else if (kind === 'magenta') s.bg = [0.77, 0.07, 0.37];
    else if (kind === 'vy') full('wordsVy');
    else if (kind === 'words') full('words');
    else if (kind === 'blotInkQ') { full('blotInk'); s.front.push({ tex: 'qWhat', scale: 0.7, y: 0.0 }); }
    else if (kind === 'magentaFlakes' || kind === 'pinkPetals') { s.bg = kind === 'pinkPetals' ? [0.42, 0.04, 0.2] : [0.77, 0.07, 0.37]; s.kind = 'scene'; s.petals = Fx.petalField(kind === 'pinkPetals' ? 9 : 5, 18, [0, 0.2, -2.6], [3.6, 2.2, 0.6], local + 1, { scale: 0.12, fall: 0.6 }); s.petalFlat = kind === 'pinkPetals' ? [0.9, 0.1, 0.32, 1] : [0.12, 0.02, 0.06, 1]; }
    else if (kind === 'emblemDark') full('emblemDark');
    else if (kind === 'crystal') full('crystal', { scale: 1 + local * 0.5 });
    else if (kind === 'eyeShape') full('eyeShape');
    else if (kind === 'eyeDim') full('eyeShape', { alpha: 0.35 });
    else if (kind === 'spiral') full('spiral', { rot: -local * 9 });
    else if (kind === 'dark') s.bg = [0.03, 0.02, 0.05];
    else if (kind === 'silhouette' || kind === 'kafkaGrey') {
      s.kind = 'scene';
      s.bg = kind === 'silhouette' ? [0.72, 0.08, 0.34] : [0.08, 0.06, 0.1];
      s.env = 'studio';
      s.kafka = kafka(0, 0, 0.6, { hL: [0.55, 0.2, 0.2], hR: [-0.6, -0.05, 0.1], eyes: 'half' });
      s.kafkaFlat = kind === 'silhouette' ? [0.25, 0.02, 0.1, 1] : null;
      s.bw = kind === 'kafkaGrey';
      s.camera = look([0.6, 1.3, 2.4], [0, 1.15, 0], 40);
      s.petals = Fx.petalField(13, 22, [0, 0.4, 0.3], [2.4, 1.8, 1.2], local + 2, { scale: 0.08 });
      s.petalFlat = [0.85, 0.06, 0.2, 1];
    }
    else if (kind === 'whitePetals') { s.bg = [0.97, 0.92, 0.95]; s.kind = 'scene'; s.petals = Fx.petalField(21, 16, [0, 0.4, -2.4], [3.4, 2.0, 0.6], local + 3, { scale: 0.14 }); s.petalFlat = [0.85, 0.06, 0.24, 1]; }
    else if (kind === 'blotDarkQ') { full('blotDark', { scale: 1.1 }); s.front.push({ tex: 'qWhat', scale: 0.62, alpha: 0.9 }); }
    else if (kind === 'blotInk') full('blotInk');
    else if (kind === 'seeQ') { full('blotDark', { alpha: 0.35 }); s.front.push({ tex: 'qSee', scale: 0.55 + local * 0.2, additive: true }); }
    else if (kind === 'flare') { s.front.push({ tex: 'flare', scale: 1, x: lerp(0.2, -0.15, seg(t, 18.5, 18.75)), w: 0.7, h: 0.08, additive: true, tint: [0.35, 0.75, 1.0] }); }
    if (s.kind === 'scene' && !s.kafka) s.camera = look([0, 1.0, 2.0], [0, 1.0, -2.4], 40);
    s.chroma = local < 0.04 ? 2 : 0;
    return s;
  }

  function theaterProfile(t) {
    const s = blank('hall', 'hallWarm');
    const k = seg(t, 18.75, 20.15);
    const lift = ease(seg(t, 19.15, 19.7));
    s.kafka = kafka(-7.6, 0.6, PI * 0.5 + 0.55, {
      hR: mix3([-0.02, 0.16, 0.3], [-0.01, 0.24, 0.3], lift),
      eR: [-0.3, -0.9, 0.2],
      hL: [0.12, -0.05, 0.25],
      handR: 'grip',
      nk: [0.12, -0.05, 0],
      eyes: lift > 0.5 ? 'half' : blink(t),
      mouth: 'smile'
    });
    const m = Cast.solveKafka(s.kafka);
    const glowP = V3.add(m.pts.wristR, V3.mul(V3.norm(V3.sub(m.pts.wristR, m.pts.elbowR)), 0.08));
    s.sprites.push({ p: glowP, size: 0.06 + 0.02 * lift, kind: 'halo', color: [0.75, 0.9, 1.0], alpha: 1 });
    s.sprites.push({ p: glowP, size: 0.03, kind: 'star', color: [1, 1, 1], alpha: lift });
    const head = m.pts.head;
    s.camera = look([head[0] + 0.06, head[1] - 0.06 + k * 0.02, head[2] - lerp(0.72, 0.66, k)], [head[0] + 0.12, head[1] - 0.17, head[2]], 40);
    s.petals = [{ p: [head[0] - 0.1, head[1] + 0.2 - k * 0.6, head[2] + 0.3], rx: t * 3, ry: 1, rz: t * 2, s: 0.05 }];
    s.lamps = 1.2;
    return s;
  }

  function pinkDoor(t) {
    const s = blank('hall', 'hallPink');
    s.kafka = kafka(-8.1, 3.5, PI * 0.5, { hL: [0.2, -0.3, 0.05], hR: [-0.17, -0.22, 0.04], eR: [-1, 0, -0.3], eyes: 'half' });
    s.camera = look([-5.6, 1.4, 3.3], [-8.4, 1.4, 3.5], 42);
    s.petals = [{ p: [-6.5, 1.35, 3.1], rx: t * 4, ry: 0.4, rz: t * 3, s: 0.12 }];
    s.flash = 0.45;
    s.flashColor = [1, 0.5, 0.75];
    return s;
  }

  function petalWhip(t) {
    const s = blank('hall', 'hallPink');
    const k = seg(t, 20.35, 21.05);
    s.camera = look([-7.4, 1.6, 1.8], [-9, 1.6, 2.9], 44, 0.25);
    s.petals = [{ p: [lerp(-7.9, -8.6, k), 1.55 - k * 0.2, lerp(2.2, 2.9, k)], rx: 0.4 + k * 2, ry: 1.2, rz: k * 4, s: 0.45 }];
    s.fade = 0.8 - k * 0.3;
    return s;
  }

  function corridorGuards(t) {
    const s = blank('hall', 'hallBlue');
    const k = seg(t, 21.05, 21.95);
    s.guards.push(guard(-7.7, -5.4, 0.9, 'aim', t));
    s.guards.push(guard(-7.2, -2.8, 2.1, 'aim', t + 0.5));
    s.camera = look([-7.45, 0.6, lerp(-1.2, -1.4, k)], [-7.5, 1.3, -4.6], 46, 0.06);
    s.petals = [{ p: [-7.0, 1.7 - k * 0.3, -2.4], rx: k * 5, ry: 0.7, rz: k * 3, s: 0.22 }];
    return s;
  }

  function stairGuards(t) {
    const s = blank('hall', 'hallBlue');
    const k = seg(t, 21.95, 24.42);
    const step = (z) => clamp((-5.4 - z) / 5.6, 0, 1) * 2.6;
    [[-1.3, -5.0, 0.2], [0.5, -6.2, -0.1], [1.7, -4.4, -0.3]].forEach(([x, z0, yaw], i) => {
      const z = z0 + k * 0.5;
      const y = step(z);
      s.guards.push(guard(x, z, yaw, i === 1 ? 'aim' : 'walk', t + i, { pos: [x, 1.02 + y, z], base: [x, y, z], ground: y + 0.08 }));
    });
    s.camera = look([2.2, 0.32, lerp(1.7, 1.5, k)], [-0.4, 1.3, -5.2], 32);
    if (t > 24.32) {
      s.chroma = 6;
      s.flash = 0.3;
      s.flashColor = [0.8, 0.3, 0.9];
    }
    return s;
  }

  function eyesGlow(t) {
    const s = blank('none', 'psy');
    const k = seg(t, 24.42, 25.8);
    s.backdrop.push({ tex: 'blotPsy', scale: 1.1 + k * 0.1, tint: [0.45, 0.42, 0.55] });
    const raise = ease(seg(t, 24.42, 24.75));
    s.kafka = kafka(0, 0, 0, {
      hL: mix3([0.2, -0.2, 0.2], [0.27, 0.16, 0.25], raise),
      hR: mix3([-0.2, -0.2, 0.2], [-0.27, 0.16, 0.25], raise),
      eL: [0.6, -0.8, 0],
      eR: [-0.6, -0.8, 0],
      handL: 'open',
      handR: 'open',
      wL: [-0.5, 0, 0.3],
      wR: [-0.5, 0, 0.3],
      eyes: 'open',
      glow: 0.6 + 0.4 * raise,
      mouth: 'smile'
    });
    const m = Cast.solveKafka(s.kafka);
    s.camera = look([0, m.pts.head[1] - 0.16, 0.82 - k * 0.08], [0, m.pts.head[1] - 0.12, 0], 40);
    ['L', 'R'].forEach((sd, i) => {
      const w = m.pts['wrist' + sd];
      const hand = V3.add(w, [0, 0.07, 0.02]);
      s.sprites.push({ p: hand, size: 0.09, kind: 'halo', color: [1, 0.3, 0.75], alpha: 1 });
      for (let j = 0; j < 5; j++) {
        const a = (i ? -1 : 1) * (0.2 + j * 0.25) + (i ? PI : 0);
        const end = V3.add(hand, [C(a) * 3 * (i ? 1 : 1), S(a * 0.6) * 1.2 + 0.4, -0.6 + j * 0.1]);
        s.lines.push({ a: hand, b: V3.lerp(hand, end, raise), w: 0.012, color: [1, 0.25, 0.7], alpha: 1 });
      }
    });
    if (t < 24.52) { s.chroma = 8; s.flash = 0.5; s.flashColor = [0.7, 0.2, 0.8]; }
    if (t > 25.7) { s.flash = seg(t, 25.7, 25.8) * 0.8; s.flashColor = [1, 0.3, 0.7]; s.zoomBlur = 0.1; }
    return s;
  }

  function poster(t) {
    const s = blank('none', 'poster');
    const k = seg(t, 25.8, 28.45);
    const zin = ease(seg(t, 25.8, 26.3));
    s.backdrop.push({ tex: 'posterBack', scale: lerp(1.35, 1.0, zin) + k * 0.03 });
    s.kafka = kafka(0, 0, 0, {
      hL: [0.62, 0.12, 0.08],
      hR: [-0.62, 0.12, 0.08],
      eL: [0.3, -1, 0],
      eR: [-0.3, -1, 0],
      handL: 'open',
      handR: 'open',
      eyes: 'half',
      mouth: 'smile',
      footL: [0.1, 0, 0.0],
      footR: [-0.1, 0, 0.0]
    });
    s.camera = look([0, 1.28, lerp(3.2, 2.45, zin) - k * 0.08], [0, 1.22, 0], 30);
    s.front.push({ tex: 'posterName', scale: 0.62, y: -0.2, additive: true, alpha: 0.85 + 0.15 * S(t * 18) });
    s.lines = pinkLasers(41, 10, t, [[-3, 3], [0.2, 2.6], [-0.6, -0.2]], 0.02, 0.7);
    if (t < 26.0) { s.flash = 0.7 * (1 - seg(t, 25.8, 26.0)); s.flashColor = [1, 0.4, 0.8]; s.chroma = 5; }
    s.fade = 1 - seg(t, 28.15, 28.45);
    return s;
  }

  function blackDip(t) {
    const s = card(t > 28.75 ? [0.12, 0.0, 0.04] : [0, 0, 0]);
    return s;
  }

  function stairsGlasses(t) {
    const s = blank('hall', 'stairsWhite');
    const k = seg(t, 28.95, 29.98);
    const up = ease(seg(t, 29.0, 29.35)) * (1 - ease(seg(t, 29.55, 29.9)));
    s.kafka = kafka(0, -5.6, 0, {
      pos: [0, 1.0 + 0.2, -5.6],
      base: [0, 0.2, -5.6],
      ground: 0.3,
      hR: mix3([-0.2, 0.1, 0.32], [-0.02, 0.3, 0.2], up),
      eR: [-0.6, -0.8, 0.2],
      wR: [-0.9, 0, 0.3],
      handR: 'open',
      hL: [0.18, -0.25, 0.08],
      eyes: up > 0.5 ? 'half' : 'open',
      mouth: 'smirk',
      nk: [0.05, 0.15, 0.05]
    });
    const m = Cast.solveKafka(s.kafka);
    const h = m.pts.head;
    s.camera = look([h[0] - 0.14, h[1] - 0.14, h[2] + lerp(0.72, 0.64, k)], [h[0], h[1] - 0.12, h[2]], 40, -0.05);
    const w = m.pts.wristR;
    s.lines.push({ a: V3.add(w, [-3, 0.6, 0.2]), b: V3.add(w, [3, -0.4, -0.2]), w: 0.018, color: [1, 0.25, 0.75], alpha: 1 });
    s.lines.push({ a: V3.add(w, [-3, -1.1, -0.6]), b: V3.add(w, [3, 0.4, -0.8]), w: 0.014, color: [1, 0.25, 0.75], alpha: 0.9 });
    s.sprites.push({ p: V3.add(w, [0, 0.08, 0.02]), size: 0.08, kind: 'halo', color: [1, 0.3, 0.8], alpha: 1 });
    s.lamps = 0;
    s.grade = [1.02, 1.0, 1.04, 0.05];
    return s;
  }

  const HALL_BOX = [[-7, 7], [0.4, 3.4], [-9, 2]];

  function laserHallGuards(t) {
    return [
      guard(-3.4, -2.2, 0.9, 'aim', t),
      guard(-2.0, -5.0, 0.4, 'aim', t + 0.3),
      guard(2.6, -3.6, -0.8, 'aim', t + 0.6),
      guard(4.0, -1.0, -1.3, 'low', t + 0.2),
      guard(1.2, -7.4, 0.1, 'aim', t + 0.9, { pos: [1.2, 1.02 + 0.9, -7.4], base: [1.2, 0.9, -7.4], ground: 0.98 }),
      guard(-4.8, -6.6, 0.6, 'port', t + 0.1)
    ];
  }

  function laserHall(t) {
    const s = blank('hall', 'hallPink');
    const k = seg(t, 29.98, 32.42);
    s.guards = laserHallGuards(t);
    const spin = t * 2.2;
    s.kafka = kafka(0.2, -2.6, spin, { hL: [0.55, 0.15, 0.1], hR: [-0.55, 0.05, 0.1], propR: 'smg', propL: 'smg', sp: [0.1, 0, 0.1], eyes: 'half' });
    s.lines = pinkLasers(7, 16, t, HALL_BOX, 0.03);
    s.guards.forEach((g, i) => {
      if (g.aimDir && frac(t * 2.5 + i * 0.37) < 0.3) {
        const m = Cast.solveGuard(g);
        const muz = V3.add(m.pts.wristR, V3.mul(g.aimDir, 1.0));
        s.sprites.push(...muzzle(muz, t + i, 14, 0.18));
        s.lines.push({ a: muz, b: V3.add(muz, V3.mul(g.aimDir, 3)), w: 0.02, color: [1, 0.75, 0.3], alpha: 0.8 });
      }
    });
    s.camera = look([lerp(-2.4, -1.8, k), lerp(0.8, 0.95, k), 1.6], [0.6, 1.7, -5.5], 52);
    s.floorTint = [0.55, 0.5, 0.58];
    if (t >= 31.78 && t < 31.98) {
      s.flash = 0.75;
      s.flashColor = [1, 0.92, 0.96];
      s.chroma = 9;
    } else if (t >= 31.98) {
      s.camera = look([-1.0, 1.1, 1.0], [0.8, 1.7, -6.0], 50);
      s.grade = [1.15, 1.05, 1.15, 0];
    }
    return s;
  }

  function guardAimDark(t) {
    const s = blank('hall', 'hallDark');
    const k = seg(t, 32.42, 33.0);
    const g = guard(-1.0, -1.2, 0.2, 'aim', t);
    s.guards.push(g);
    const m = Cast.solveGuard(g);
    s.camera = look(V3.add(m.pts.chest, [0.45, 0.25, -0.55]), V3.add(m.pts.chest, [-0.6, 0.0, 2.0]), 50);
    if (k > 0.35) s.sprites.push(...muzzle(V3.add(m.pts.wristR, V3.mul(g.aimDir, 1.0)), t, 16, 0.25));
    s.lines = pinkLasers(12, 8, t, [[-4, 3], [0.6, 2.6], [-1, 4]], 0.02, 0.7);
    s.fade = 0.5 + k * 0.4;
    return s;
  }

  function overShoulder(t) {
    const s = blank('hall', 'hallPink');
    s.kafka = kafka(0.3, -3.6, -0.6, { eyes: 'half', hR: [-0.2, -0.2, 0.2], propR: 'smg' });
    const g = guard(-0.9, -1.4, 2.2, 'aim', t);
    s.guards.push(g);
    const m = Cast.solveKafka(s.kafka);
    s.camera = look(V3.add(m.pts.head, [-1.25, -0.05, 1.5]), V3.add(m.pts.head, [0, -0.15, 0]), 34);
    s.lines = pinkLasers(14, 10, t, [[-4, 4], [0.6, 2.8], [-6, -2]], 0.02, 0.8);
    return s;
  }

  function armorClose(t) {
    const s = blank('hall', 'hallDark');
    const k = seg(t, 33.3, 33.78);
    const g = guard(0, -2, 0.4 + k * 0.3, 'port', t);
    s.guards.push(g);
    const m = Cast.solveGuard(g);
    s.camera = look(V3.add(m.pts.chest, [0.55, 0.1, 0.55]), V3.add(m.pts.chest, [-0.1, 0.05, 0]), 44, 0.4);
    return s;
  }

  function profileLasers(t) {
    const s = blank('hall', 'hallPink');
    const k = seg(t, 33.78, 36.48);
    s.kafka = kafka(-2.0, -4.0, PI * 0.5 - 0.55, { eyes: t > 34.6 ? 'open' : 'half', mouth: 'smile', nk: [0.04, 0.06, 0], hR: [-0.18, -0.22, 0.12], hL: [0.15, -0.1, 0.25], handL: 'point' });
    const m = Cast.solveKafka(s.kafka);
    const h = m.pts.head;
    s.camera = look([h[0] - 0.12, h[1] - 0.04, h[2] + 0.64 - k * 0.04], [h[0] + 0.12, h[1] - 0.1, h[2]], 40);
    s.lines = pinkLasers(19, 14, t, [[-5, 1], [0.4, 3.2], [-8, -4.5]], 0.025);
    const shot = seg(t, 34.25, 34.6);
    if (shot > 0 && t < 35.3) {
      const from = [h[0] + 3, h[1] - 0.25, h[2] - 0.6];
      const hit = [h[0] + 0.34, h[1] - 0.3, h[2] + 0.04];
      s.lines.push({ a: from, b: V3.lerp(from, hit, shot), w: 0.02, color: [1, 0.8, 0.3], alpha: 1 });
      if (t > 34.55) {
        const sp = seg(t, 34.55, 35.3);
        s.sprites.push({ p: hit, size: 0.12 + sp * 0.1, kind: 'star', color: [1, 0.85, 0.4], alpha: 1 - sp, roll: t * 5 });
        s.sprites.push({ p: hit, size: 0.22, kind: 'halo', color: [1, 0.6, 0.2], alpha: 0.8 * (1 - sp) });
        for (let i = 0; i < 6; i++) {
          const a = i * 1.1 + t * 3;
          s.lines.push({ a: hit, b: V3.add(hit, [0.15 + 0.1 * C(a), 0.12 * S(a), -0.05]), w: 0.008, color: [1, 0.85, 0.4], alpha: 1 - sp });
        }
      }
    }
    if (t > 35.35) s.petals = Fx.burst(31, 26, [h[0] + 0.1, h[1] - 0.25, h[2] + 0.1], 0.7, t - 35.35, { scale: 0.05, speed: 2.4 });
    if (t > 36.15) s.fg.push(guard(h[0] + 0.6, h[2] + 0.6, -PI * 0.5, 'port', t));
    return s;
  }

  function corridorBack(t) {
    const s = blank('hall', 'hallWarm');
    const k = seg(t, 36.48, 37.15);
    const raise = ease(seg(t, 36.5, 36.75)) * (1 - ease(seg(t, 36.9, 37.1)));
    s.kafka = kafka(-7.7, -3.6, PI, { hL: mix3([0.2, -0.3, 0.05], [0.64, 0.12, 0.1], raise), eL: [0.8, -0.2, -0.3], handL: 'open', eyes: 'half', nk: [0, 0.4 * raise, 0] });
    s.camera = look([-7.65, 1.25, -0.8 - k * 0.2], [-7.7, 1.15, -4.6], 40);
    s.petals = Fx.petalField(51, 26, [-7.7, 0.0, -4.6], [1.6, 0.02, 3.2], 0, { scale: 0.05, fall: 0 }).map(p => Object.assign(p, { p: [p.p[0], 0.01, p.p[2]], rx: -PI / 2 + 0.1 }));
    s.lamps = 1.3;
    return s;
  }

  window.KafkaAct1 = { studioIntro, handGlow, guardsHall, handGlow2, chandelierGuard, darkRibbon, montage, theaterProfile, pinkDoor, petalWhip, corridorGuards, stairGuards, eyesGlow, poster, blackDip, stairsGlasses, laserHall, guardAimDark, overShoulder, armorClose, profileLasers, corridorBack };
})();
