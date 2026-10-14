(function (S) {
  'use strict';
  const { M4, Mesh, rgb } = S;
  const sin = Math.sin, cos = Math.cos, PI = Math.PI;

  const LOOKS = {
    heer: { tunic: 0x5e6450, tunic2: 0x4a5040, pants: 0x585c4c, skin: 0xd8a888, head: 'm35', helmet: 0x4e5446, boots: 'jack', belt: 0x1a1612, pouches: true },
    smock: { tunic: 0x6a6848, tunic2: 0x4a4a34, pants: 0x585c4c, skin: 0xd0a080, head: 'm35', helmet: 0x5a5a44, boots: 'jack', belt: 0x1a1612, camo: true, pouches: true },
    officer: { tunic: 0x626a58, tunic2: 0x3a4a3a, pants: 0x4a4e44, skin: 0xe0b090, head: 'visor', cap: 0x5a6250, band: 0x2a3a2a, boots: 'jack', belt: 0x3a2418, strap: true, collar: 0x2a3a2a },
    ss: { tunic: 0x222226, tunic2: 0x141418, pants: 0x1c1c20, skin: 0xd8a888, head: 'm35', helmet: 0x26262a, boots: 'jack', belt: 0x101010, armband: true, pouches: true },
    stahl: { tunic: 0x1c1c20, tunic2: 0x101014, pants: 0x18181c, skin: 0xd8b098, head: 'visor', cap: 0x1a1a1e, band: 0x0a0a0c, boots: 'jack', belt: 0x0a0a0a, strap: true, coat: true, collar: 0x0a0a0a, armband: true },
    sniper: { tunic: 0x5a6048, tunic2: 0x4a5040, pants: 0x585c4c, skin: 0xd0a080, head: 'fieldcap', cap: 0x4e5646, boots: 'jack', belt: 0x1a1612, camo: true },
    navy: { tunic: 0x1e2436, tunic2: 0x141a28, pants: 0x1e2436, skin: 0xd8a888, head: 'sailor', cap: 0x16182a, boots: 'shoe', belt: 0x101010, collar: 0x2a3a6a },
    worker: { tunic: 0x6a5a44, tunic2: 0x4a3e30, pants: 0x3a3a3c, skin: 0xd8a888, head: 'flat', cap: 0x3a3430, boots: 'shoe', belt: 0x2a2018, apron: true },
    agent: { tunic: 0x4a3a2c, tunic2: 0x3a2c20, pants: 0x2e2a28, skin: 0xd8a888, head: 'fedora', cap: 0x2a2420, boots: 'shoe', belt: 0x1a1612, coat: true },
    pow: { tunic: 0x6e6448, tunic2: 0x5a5038, pants: 0x5a5440, skin: 0xd8a888, head: 'bare', hair: 0x4a3420, boots: 'shoe', belt: 0x3a3020 },
    oss: { tunic: 0x5a5a3a, tunic2: 0x4a4a30, pants: 0x5a5438, skin: 0xd8a888, head: 'm1', helmet: 0x4a5034, boots: 'jack', belt: 0x5a5030 }
  };

  function buildHead(m, L) {
    const skin = rgb(L.skin), dark = rgb(0x151515);
    m.cbox(0, 0.13, 0, 0.1, 0.12, 0.11, skin);
    m.cbox(0, 0.02, 0.01, 0.06, 0.04, 0.06, skin);
    m.cbox(0.045, 0.15, 0.108, 0.018, 0.012, 0.004, dark); m.cbox(-0.045, 0.15, 0.108, 0.018, 0.012, 0.004, dark);
    m.cbox(0, 0.11, 0.115, 0.014, 0.03, 0.012, rgb(Math.max(0, L.skin - 0x101010)));
    m.cbox(0, 0.065, 0.108, 0.035, 0.006, 0.004, rgb(0x7a3a30));
    const cap = rgb(L.cap || 0x303030);
    switch (L.head) {
      case 'visor': m.cbox(0, 0.245, 0, 0.11, 0.035, 0.115, cap); m.cbox(0, 0.3, 0.02, 0.13, 0.03, 0.14, cap); m.cbox(0, 0.245, 0.005, 0.113, 0.012, 0.118, rgb(L.band)); m.cbox(0, 0.225, 0.13, 0.085, 0.008, 0.045, dark); m.cbox(0, 0.3, 0.155, 0.02, 0.015, 0.01, rgb(0xc0b070)); break;
      case 'fieldcap': m.cbox(0, 0.25, -0.005, 0.105, 0.04, 0.115, cap); m.cbox(0, 0.225, 0.13, 0.08, 0.006, 0.04, cap); break;
      case 'sailor': m.cbox(0, 0.245, 0, 0.112, 0.035, 0.118, cap); m.cbox(0, 0.23, -0.12, 0.02, 0.06, 0.01, cap); break;
      case 'flat': m.cbox(0, 0.245, 0.01, 0.112, 0.028, 0.12, cap); m.cbox(0, 0.23, 0.12, 0.09, 0.008, 0.05, cap); break;
      case 'fedora': m.cbox(0, 0.28, 0, 0.1, 0.06, 0.105, cap); m.cbox(0, 0.23, 0, 0.16, 0.008, 0.17, cap); m.cbox(0, 0.245, 0, 0.102, 0.012, 0.107, rgb(0x101010)); break;
      case 'bare': m.cbox(0, 0.24, -0.01, 0.105, 0.03, 0.115, rgb(L.hair || 0x302018)); break;
      default: m.cbox(0, 0.23, -0.01, 0.102, 0.02, 0.112, rgb(0x3a2a1a));
    }
  }
  function buildHelmet(m, L) {
    const c = rgb(L.helmet || 0x4e5446);
    if (L.head === 'm35') {
      m.sphere(0, 0.2, -0.005, 0.135, 0.105, 0.145, 10, 5, c);
      m.cyl(0, 0.13, -0.005, 0.15, 0.13, 0.05, 10, c, false);
      m.cbox(0, 0.13, -0.08, 0.16, 0.05, 0.08, c);
    } else if (L.head === 'm1') {
      m.sphere(0, 0.2, 0, 0.14, 0.11, 0.15, 10, 5, c);
      m.cyl(0, 0.15, 0, 0.165, 0.155, 0.015, 10, c, false);
      m.cbox(0, 0.05, 0.05, 0.1, 0.006, 0.006, rgb(0x3a3020));
    }
  }
  function humanParts(L) {
    const tunic = rgb(L.tunic), tunic2 = rgb(L.tunic2), pants = rgb(L.pants), boot = rgb(0x141210), belt = rgb(L.belt || 0x1a1612), skin = rgb(L.skin);
    const helm = L.head === 'm35' || L.head === 'm1';
    return [
      { n: 'hips', at: [0, 0.93, 0], build: m => { m.cbox(0, 0.04, 0, 0.17, 0.1, 0.11, pants); m.cbox(0, 0.1, 0, 0.18, 0.03, 0.12, belt); if (L.coat) m.cbox(0, -0.12, 0, 0.19, 0.14, 0.13, tunic); if (L.apron) m.cbox(0, -0.05, 0.115, 0.15, 0.2, 0.01, rgb(0x5a4a30)); } },
      { n: 'torso', p: 'hips', at: [0, 0.1, 0], build: m => {
        m.cbox(0, 0.28, 0, 0.2, 0.27, 0.12, tunic);
        m.cbox(0, 0.5, 0, 0.21, 0.06, 0.13, tunic2);
        m.cbox(0, 0.02, 0, 0.205, 0.035, 0.125, belt);
        m.cbox(0, 0.05, 0.126, 0.03, 0.025, 0.004, rgb(0x8a8a80));
        for (let i = 0; i < 4; i++) m.cbox(0, 0.12 + i * 0.1, 0.123, 0.012, 0.012, 0.003, rgb(0x8a8a70));
        if (L.collar) { m.cbox(0.06, 0.55, 0.11, 0.04, 0.03, 0.02, rgb(L.collar)); m.cbox(-0.06, 0.55, 0.11, 0.04, 0.03, 0.02, rgb(L.collar)); }
        if (L.pouches) for (const x of [0.12, 0.06, -0.06, -0.12]) m.cbox(x, 0.06, 0.13, 0.025, 0.04, 0.02, rgb(0x2a2418));
        if (L.strap) m.with(M4.rotZ(M4.translate(M4.create(), 0, 0.3, 0.123), 0.55), q => q.cbox(0, 0, 0, 0.02, 0.3, 0.004, belt));
        if (L.camo) for (let i = 0; i < 9; i++) m.cbox(((i * 37) % 32 - 16) / 100, 0.08 + ((i * 53) % 42) / 100, 0.123, 0.045, 0.03, 0.004, rgb(i % 3 === 0 ? 0x3a4028 : i % 3 === 1 ? 0x8a7a50 : 0x5a3a28));
        if (L.armband) { m.cbox(0.215, 0.38, 0, 0.012, 0.035, 0.065, rgb(0xa02020)); }
        if (L.coat) { m.cbox(0.08, 0.3, 0.125, 0.07, 0.24, 0.006, tunic2); m.cbox(-0.08, 0.3, 0.125, 0.07, 0.24, 0.006, tunic2); }
        m.cbox(0, 0.3, -0.17, 0.13, 0.12, 0.05, rgb(0x3a3428));
        if (!L.coat && L.head !== 'visor') m.cyl(0.12, 0.02, -0.12, 0.035, 0.035, 0.1, 6, rgb(0x5a5a4a));
      } },
      { n: 'head', p: 'torso', at: [0, 0.57, 0], build: m => buildHead(m, L) },
      { n: 'helmet', p: 'head', at: [0, 0, 0], build: m => { if (helm) buildHelmet(m, L); } },
      { n: 'armUL', p: 'torso', at: [0.25, 0.5, 0], build: m => { m.cbox(0, -0.14, 0, 0.058, 0.15, 0.058, tunic); if (L.armband) m.cbox(0, -0.08, 0, 0.06, 0.03, 0.06, rgb(0xa02020)); } },
      { n: 'armLL', p: 'armUL', at: [0, -0.29, 0], build: m => { m.cbox(0, -0.12, 0, 0.052, 0.13, 0.052, tunic); m.cbox(0, -0.28, 0, 0.045, 0.05, 0.04, skin); } },
      { n: 'armUR', p: 'torso', at: [-0.25, 0.5, 0], build: m => m.cbox(0, -0.14, 0, 0.058, 0.15, 0.058, tunic) },
      { n: 'armLR', p: 'armUR', at: [0, -0.29, 0], build: m => { m.cbox(0, -0.12, 0, 0.052, 0.13, 0.052, tunic); m.cbox(0, -0.28, 0, 0.045, 0.05, 0.04, skin); } },
      { n: 'legUL', p: 'hips', at: [0.1, 0, 0], build: m => m.cbox(0, -0.22, 0, 0.075, 0.23, 0.08, pants) },
      { n: 'legLL', p: 'legUL', at: [0, -0.44, 0], build: m => { m.cbox(0, -0.2, 0, 0.066, 0.21, 0.07, pants); if (L.boots === 'jack') m.cbox(0, -0.26, 0, 0.072, 0.18, 0.076, boot); m.cbox(0, -0.44, 0.04, 0.07, 0.05, 0.12, boot); } },
      { n: 'legUR', p: 'hips', at: [-0.1, 0, 0], build: m => m.cbox(0, -0.22, 0, 0.075, 0.23, 0.08, pants) },
      { n: 'legLR', p: 'legUR', at: [0, -0.44, 0], build: m => { m.cbox(0, -0.2, 0, 0.066, 0.21, 0.07, pants); if (L.boots === 'jack') m.cbox(0, -0.26, 0, 0.072, 0.18, 0.076, boot); m.cbox(0, -0.44, 0.04, 0.07, 0.05, 0.12, boot); } },
      { n: 'gun', p: 'torso', at: [-0.1, 0.36, 0.3], build: () => {} }
    ];
  }
  function humanPose(a) {
    const P = {}, w = a.walk || 0, mv = a.move || 0, run = a.run || 0, cr = a.crouch || 0, aim = a.aim || 0, t = a.t || 0, look = a.look || 0;
    const sw = sin(w) * mv * (0.55 + run * 0.35), knee = Math.max(0, -sin(w + 0.9)) * mv * (0.7 + run * 0.5), knee2 = Math.max(0, sin(w + 0.9)) * mv * (0.7 + run * 0.5);
    const breathe = sin(t * 1.7) * 0.02, lean = run * 0.25 + cr * 0.25;
    P.hips = [0, 0, 0, 0, -Math.abs(sin(w)) * 0.03 * mv - cr * 0.38, 0];
    P.legUL = [-sw - cr * 1.1, 0, 0]; P.legLL = [knee + cr * 1.9, 0, 0];
    P.legUR = [sw - cr * 1.1, 0, 0]; P.legLR = [knee2 + cr * 1.9, 0, 0];
    P.torso = [lean + breathe, 0, 0];
    P.head = [-lean * 0.8 - look * 0.6, 0, 0];
    const rec = a.recoil || 0;
    if (a.hold === 'rifle' || a.hold === 'heavy') {
      const up = aim * 0.25 - (1 - aim) * 0.35;
      P.armUR = [-1.1 - up - look * 0.6 + rec * 0.15, 0.25, 0.2]; P.armLR = [-0.9 + aim * 0.25, 0, 0];
      P.armUL = [-1.35 - up - look * 0.6 + rec * 0.15, -0.55, -0.1]; P.armLL = [-0.6 + aim * 0.2, 0, 0];
      P.gun = [-look * 0.6 + rec * 0.1 + (1 - aim) * 0.7, 0, 0, 0, (1 - aim) * -0.12, 0];
      if (a.hold === 'heavy') { P.gun = [-look * 0.6, 0, 0, 0.05, 0.12, -0.05]; P.armUR = [-0.9 - look * 0.6, 0.25, 0.2]; P.armUL = [-1.3 - look * 0.6, -0.5, -0.1]; }
    } else if (a.hold === 'pistol') {
      const up = aim;
      P.armUR = [-0.4 - up * 1.1 - look * 0.6 + rec * 0.2, 0.1, 0.1]; P.armLR = [-0.4 + up * 0.35, 0, 0];
      P.armUL = [-0.3 - up * 1.0 - look * 0.5, -0.5 * up, -0.1 * up]; P.armLL = [-0.3 + up * 0.2, 0, 0];
      P.gun = [-look * 0.6 + (1 - up) * 1.1 + rec * 0.2, 0, 0, 0, -0.1 * (1 - up), -0.05 * (1 - up)];
    } else {
      const as = -sw * 0.8;
      P.armUR = [as, 0, 0.08]; P.armLR = [-0.25 - mv * 0.3, 0, 0];
      P.armUL = [-as, 0, -0.08]; P.armLL = [-0.25 - mv * 0.3, 0, 0];
      if (a.behind) { P.armUR = [0.35, 0, 0.25]; P.armLR = [-1.2, 0, 0]; P.armUL = [0.35, 0, -0.25]; P.armLL = [-1.2, 0, 0]; }
    }
    if (a.throwing) { const k = a.throwing; P.armUR = [-2.6 * k + 1.2 * (1 - k), 0.2, 0.2]; P.armLR = [-0.8 * k, 0, 0]; P.torso = [lean - 0.3 * k, 0.3 * k, 0]; }
    if (a.papers) { P.armUR = [-1.2, 0.1, 0.1]; P.armLR = [-0.6, 0, 0]; }
    if (a.surrender) { const s = a.surrender; P.armUR = [-2.9 * s, 0, 0.35 * s]; P.armLR = [-0.4 * s, 0, 0]; P.armUL = [-2.9 * s, 0, -0.35 * s]; P.armLL = [-0.4 * s, 0, 0]; }
    if (a.flinch) { P.torso[0] -= a.flinch * 0.4; P.head[0] += a.flinch * 0.3; }
    if (a.sit) {
      const s = a.sit;
      P.hips = [0, 0, 0, 0, -0.52 * s, 0];
      P.legUL = [-1.45 * s, 0, 0.12 * s]; P.legLL = [1.5 * s, 0, 0]; P.legUR = [-1.45 * s, 0, -0.12 * s]; P.legLR = [1.5 * s, 0, 0];
      P.torso = [0.25 * s + breathe, 0, 0];
    }
    return P;
  }

  const MODELS = {};
  MODELS.dog = (() => {
    const c = rgb(0x1a1612), c2 = rgb(0x8a5a2a), nose = rgb(0x0a0a0a), teeth = rgb(0xe0d8c0);
    return {
      scale: 1.05,
      parts: [
        { n: 'body', at: [0, 0.55, 0], build: m => { m.cbox(0, 0, 0, 0.14, 0.15, 0.4, c); m.cbox(0, 0.02, 0.2, 0.16, 0.17, 0.17, c); m.cbox(0, -0.12, 0.2, 0.1, 0.04, 0.14, c2); m.cbox(0, 0.1, 0.38, 0.12, 0.03, 0.05, rgb(0x5a3a1a)); } },
        { n: 'head', p: 'body', at: [0, 0.12, 0.42], build: m => { m.cbox(0, 0.02, 0.06, 0.09, 0.09, 0.09, c); m.cbox(0, -0.02, 0.2, 0.055, 0.055, 0.1, c2); m.cbox(0, 0.0, 0.3, 0.03, 0.025, 0.012, nose); m.cbox(0.06, 0.16, 0.02, 0.02, 0.08, 0.02, c); m.cbox(-0.06, 0.16, 0.02, 0.02, 0.08, 0.02, c); m.cbox(0.045, 0.05, 0.14, 0.012, 0.01, 0.005, c2); m.cbox(-0.045, 0.05, 0.14, 0.012, 0.01, 0.005, c2); } },
        { n: 'jaw', p: 'head', at: [0, -0.07, 0.12], build: m => { m.cbox(0, -0.015, 0.07, 0.05, 0.02, 0.09, c2); m.cbox(0, 0.01, 0.12, 0.045, 0.01, 0.04, teeth); } },
        { n: 'legFL', p: 'body', at: [0.09, -0.08, 0.3], build: m => { m.cbox(0, -0.2, 0, 0.035, 0.22, 0.04, c); m.cbox(0, -0.38, 0.02, 0.036, 0.04, 0.05, c2); } },
        { n: 'legFR', p: 'body', at: [-0.09, -0.08, 0.3], build: m => { m.cbox(0, -0.2, 0, 0.035, 0.22, 0.04, c); m.cbox(0, -0.38, 0.02, 0.036, 0.04, 0.05, c2); } },
        { n: 'legBL', p: 'body', at: [0.09, -0.08, -0.32], build: m => { m.cbox(0, -0.2, 0, 0.04, 0.22, 0.05, c); m.cbox(0, -0.38, 0.02, 0.036, 0.04, 0.05, c2); } },
        { n: 'legBR', p: 'body', at: [-0.09, -0.08, -0.32], build: m => { m.cbox(0, -0.2, 0, 0.04, 0.22, 0.05, c); m.cbox(0, -0.38, 0.02, 0.036, 0.04, 0.05, c2); } },
        { n: 'tail', p: 'body', at: [0, 0.1, -0.4], build: m => m.cbox(0, 0.04, -0.03, 0.02, 0.02, 0.05, c) }
      ],
      pose(a) {
        const w = a.walk || 0, mv = a.move || 0, run = a.run || 0, st = 0.5 + run * 0.4, P = {};
        const bite = a.attack || 0, leap = a.leap || 0;
        P.body = [sin(w * 2) * 0.05 * run - leap * 0.4, 0, 0, 0, Math.abs(sin(w)) * 0.05 * mv, 0];
        P.legFL = [sin(w) * st * mv - leap * 0.8, 0, 0]; P.legBR = [sin(w) * st * mv + leap * 0.8, 0, 0];
        P.legFR = [sin(w + (run > 0.5 ? 0.6 : PI)) * st * mv - leap * 0.8, 0, 0]; P.legBL = [sin(w + (run > 0.5 ? 0.6 : PI)) * st * mv + leap * 0.8, 0, 0];
        P.head = [-bite * 0.3 + sin((a.t || 0) * 2) * 0.05, sin((a.t || 0) * 0.7) * 0.2 * (1 - mv), 0];
        P.jaw = [bite * 0.6 + (a.growl || 0) * 0.2 * (0.5 + 0.5 * sin((a.t || 0) * 30)), 0, 0];
        P.tail = [0.3, sin((a.t || 0) * 9) * 0.5 * (0.3 + mv), 0];
        return P;
      }
    };
  })();
  MODELS.tank = (() => {
    const c = rgb(0x8a8060), c2 = rgb(0x6a6248), dk = rgb(0x2a2a24), tr = rgb(0x1e1c18);
    return {
      scale: 1,
      parts: [
        { n: 'hull', at: [0, 0, 0], build: m => {
          m.cbox(0, 1.05, 0, 1.55, 0.5, 3.1, c); m.cbox(0, 0.55, 0, 1.25, 0.3, 3.0, c2);
          for (const x of [1.65, -1.65]) { m.cbox(x, 0.62, 0, 0.3, 0.55, 3.2, tr); for (let i = 0; i < 8; i++) m.with(M4.rotZ(M4.translate(M4.create(), x * 0.93, 0.5, -2.7 + i * 0.77), PI / 2), q => q.cyl(0, -0.2, 0, 0.4, 0.4, 0.4, 10, dk)); }
          m.cbox(0, 1.3, 2.9, 1.5, 0.3, 0.25, c); m.cbox(0.5, 1.6, 2.6, 0.2, 0.08, 0.1, dk); m.cbox(-0.8, 1.58, 2.3, 0.15, 0.06, 0.15, dk);
          m.cbox(0, 1.56, -2.6, 0.7, 0.05, 0.4, dk); m.cbox(0.9, 1.1, -3.15, 0.2, 0.2, 0.08, dk); m.cbox(-0.9, 1.1, -3.15, 0.2, 0.2, 0.08, dk);
          for (const z of [-1.2, 0.2]) m.cbox(1.56, 1.2, z, 0.02, 0.18, 0.5, rgb(0xd8d8d0));
          m.cbox(1.575, 1.2, -0.5, 0.012, 0.22, 0.05, dk); m.cbox(1.575, 1.2, -0.5, 0.012, 0.05, 0.22, dk);
        } },
        { n: 'turret', p: 'hull', at: [0, 1.55, -0.2], build: m => { m.cbox(0, 0.45, 0, 1.15, 0.45, 1.3, c); m.cbox(0, 0.45, 1.3, 0.75, 0.38, 0.2, c2); m.cyl(-0.5, 0.9, -0.6, 0.35, 0.33, 0.28, 10, c2); m.cbox(0, 0.4, -1.35, 0.9, 0.3, 0.12, dk); } },
        { n: 'gun', p: 'turret', at: [0, 0.5, 1.4], build: m => { m.with(M4.rotX(M4.create(), PI / 2), q => q.cyl(0, 0, 0, 0.11, 0.1, 4.2, 8, c2)); m.with(M4.rotX(M4.translate(M4.create(), 0, 0, 4.1), PI / 2), q => q.cyl(0, 0, 0, 0.18, 0.18, 0.4, 8, dk)); } }
      ],
      pose(a) { return { turret: [0, a.turret || 0, 0], gun: [-(a.elev || 0), 0, 0] }; }
    };
  })();
  const humanCache = {};
  S.humanModel = function (look) {
    if (humanCache[look]) return humanCache[look];
    const L = LOOKS[look] || LOOKS.heer;
    return (humanCache[look] = { scale: 1, parts: humanParts(L), pose: humanPose, look: L });
  };
  S.poseMatrices = function (model, root, a) {
    const pose = model.pose(a) || {}, out = {};
    for (const part of model.parts) {
      const parent = part.p ? out[part.p] : root, m = M4.copy(M4.create(), parent), r = pose[part.n];
      M4.translate(m, part.at[0], part.at[1], part.at[2]);
      if (r) { if (r[3] || r[4] || r[5]) M4.translate(m, r[3] || 0, r[4] || 0, r[5] || 0); M4.rotY(m, r[1]); M4.rotX(m, r[0]); M4.rotZ(m, r[2]); }
      out[part.n] = m;
    }
    return out;
  };

  const METAL = rgb(0x2a2a2c), METAL2 = rgb(0x44444a), BLUE = rgb(0x1e2026), WOOD = rgb(0x6a3a1c), WOOD2 = rgb(0x4a2812), BLACK = rgb(0x141414), OLIVE = rgb(0x4a5234), DGREY = rgb(0x3a3c36);
  const barrel = (m, x, y, z0, r0, r1, len, n, c) => m.with(M4.rotX(M4.translate(M4.create(), x, y, z0), -Math.PI / 2), q => q.cyl(0, 0, 0, r0, r1, len, n, c, true));
  const angled = (m, a, fn) => m.with(M4.rotX(M4.create(), a), fn);
  const GUNS = {
    colt(m) { m.cbox(0, 0.036, -0.06, 0.014, 0.022, 0.09, BLUE); m.cbox(0, 0.012, -0.05, 0.012, 0.012, 0.075, METAL); angled(m, -0.22, q => q.cbox(0, -0.05, 0.005, 0.014, 0.058, 0.024, WOOD2)); m.cbox(0, -0.008, -0.045, 0.004, 0.02, 0.02, BLUE); m.cbox(0, 0.06, -0.14, 0.002, 0.005, 0.003, METAL2); m.cbox(0, 0.06, 0.02, 0.006, 0.006, 0.003, METAL2); },
    silenced(m) { GUNS.colt(m); barrel(m, 0, 0.034, -0.15, 0.02, 0.02, 0.17, 8, BLACK); },
    p38(m) { m.cbox(0, 0.036, -0.07, 0.013, 0.02, 0.1, BLACK); m.cbox(0, 0.036, -0.18, 0.008, 0.01, 0.02, BLACK); m.cbox(0, 0.012, -0.05, 0.012, 0.012, 0.075, METAL); angled(m, -0.25, q => q.cbox(0, -0.05, 0.005, 0.014, 0.058, 0.024, BLACK)); m.cbox(0, -0.008, -0.045, 0.004, 0.02, 0.02, BLACK); m.cbox(0, 0.06, -0.16, 0.002, 0.005, 0.003, METAL2); },
    thompson(m) { m.cbox(0, 0.04, -0.02, 0.022, 0.034, 0.15, BLUE); barrel(m, 0, 0.045, -0.17, 0.011, 0.011, 0.2, 6, METAL); m.cbox(0, 0.028, -0.22, 0.02, 0.018, 0.05, WOOD); m.cbox(0, -0.05, -0.07, 0.013, 0.06, 0.02, BLACK); angled(m, -0.35, q => q.cbox(0, -0.05, 0.07, 0.014, 0.05, 0.02, WOOD2)); m.cbox(0, 0.02, 0.23, 0.02, 0.035, 0.12, WOOD); m.cbox(0, 0.0, 0.34, 0.022, 0.055, 0.012, WOOD2); m.cbox(0, 0.083, 0.08, 0.008, 0.012, 0.012, METAL2); m.cbox(0, 0.08, -0.34, 0.003, 0.01, 0.004, METAL2); m.cbox(0.024, 0.05, -0.02, 0.004, 0.006, 0.02, METAL2); },
    mp40(m) { m.cbox(0, 0.04, -0.02, 0.018, 0.028, 0.14, BLACK); barrel(m, 0, 0.042, -0.16, 0.01, 0.01, 0.2, 6, METAL); m.cbox(0, -0.07, -0.08, 0.012, 0.09, 0.018, BLACK); angled(m, -0.3, q => q.cbox(0, -0.05, 0.08, 0.013, 0.05, 0.018, rgb(0x3a2a20))); m.cbox(0.02, 0.02, 0.17, 0.004, 0.006, 0.12, METAL); m.cbox(-0.02, 0.02, 0.17, 0.004, 0.006, 0.12, METAL); m.cbox(0, 0.01, 0.29, 0.024, 0.03, 0.008, METAL); m.cbox(0, 0.075, 0.05, 0.006, 0.01, 0.01, METAL2); m.cbox(0, 0.07, -0.34, 0.003, 0.012, 0.004, METAL2); m.cbox(0, 0.02, -0.34, 0.012, 0.012, 0.012, BLACK); },
    stg44(m) { m.cbox(0, 0.045, -0.02, 0.02, 0.035, 0.17, METAL); m.cbox(0, 0.04, -0.24, 0.018, 0.028, 0.08, METAL2); barrel(m, 0, 0.05, -0.2, 0.009, 0.009, 0.25, 6, METAL); angled(m, 0.22, q => q.cbox(0, -0.085, -0.1, 0.012, 0.085, 0.024, METAL)); angled(m, -0.35, q => q.cbox(0, -0.05, 0.1, 0.013, 0.05, 0.02, WOOD2)); m.cbox(0, 0.03, 0.27, 0.02, 0.04, 0.13, WOOD); m.cbox(0, 0.083, -0.3, 0.003, 0.012, 0.004, METAL2); m.cbox(0, 0.083, 0.05, 0.008, 0.01, 0.02, METAL2); },
    garand(m) { m.cbox(0, 0.025, -0.16, 0.022, 0.03, 0.26, WOOD); m.cbox(0, 0.058, -0.2, 0.016, 0.014, 0.18, WOOD2); barrel(m, 0, 0.05, -0.38, 0.009, 0.009, 0.3, 6, METAL); m.cbox(0, 0.045, 0.03, 0.02, 0.028, 0.08, METAL); m.cbox(0, 0.01, 0.24, 0.022, 0.04, 0.16, WOOD); m.cbox(0, 0.0, 0.4, 0.024, 0.06, 0.012, WOOD2); angled(m, -0.4, q => q.cbox(0, -0.035, 0.1, 0.016, 0.04, 0.02, WOOD)); m.cbox(0, 0.08, 0.09, 0.008, 0.012, 0.01, METAL2); m.cbox(0, 0.075, -0.64, 0.003, 0.014, 0.004, METAL2); m.cbox(0.02, 0.05, -0.1, 0.004, 0.004, 0.08, METAL); },
    kar98(m) { m.cbox(0, 0.02, -0.18, 0.02, 0.028, 0.3, WOOD); barrel(m, 0, 0.048, -0.42, 0.009, 0.008, 0.34, 6, METAL); m.cbox(0, 0.046, 0.02, 0.016, 0.022, 0.1, METAL); m.cbox(-0.03, 0.05, 0.07, 0.022, 0.006, 0.006, METAL2); m.cbox(-0.05, 0.05, 0.07, 0.009, 0.009, 0.009, METAL2); m.cbox(0, 0.0, 0.25, 0.02, 0.038, 0.16, WOOD); m.cbox(0, -0.01, 0.41, 0.022, 0.058, 0.012, WOOD2); angled(m, -0.4, q => q.cbox(0, -0.035, 0.09, 0.015, 0.035, 0.02, WOOD)); m.cbox(0, 0.07, -0.72, 0.003, 0.014, 0.004, METAL2); m.cbox(0, 0.064, -0.1, 0.008, 0.008, 0.01, METAL2); },
    kar98s(m) { GUNS.kar98(m); barrel(m, 0, 0.1, 0.12, 0.018, 0.018, 0.26, 8, BLACK); barrel(m, 0, 0.1, -0.14, 0.022, 0.024, 0.04, 8, BLACK); m.cbox(0, 0.075, 0.0, 0.008, 0.02, 0.01, BLACK); m.cbox(0, 0.075, -0.08, 0.008, 0.02, 0.01, BLACK); },
    bar(m) { m.cbox(0, 0.045, -0.02, 0.024, 0.036, 0.16, METAL); m.cbox(0, 0.03, -0.24, 0.022, 0.03, 0.08, WOOD); barrel(m, 0, 0.05, -0.22, 0.012, 0.012, 0.42, 6, METAL); m.cbox(0, -0.04, -0.05, 0.016, 0.05, 0.04, BLACK); angled(m, -0.35, q => q.cbox(0, -0.05, 0.09, 0.014, 0.05, 0.02, WOOD2)); m.cbox(0, 0.02, 0.25, 0.022, 0.04, 0.14, WOOD); m.cbox(0, 0.005, 0.39, 0.024, 0.058, 0.012, WOOD2); m.cbox(0, 0.083, 0.08, 0.008, 0.012, 0.012, METAL2); m.cbox(0, 0.08, -0.62, 0.003, 0.012, 0.004, METAL2); },
    springfield(m) { GUNS.kar98(m); barrel(m, 0, 0.1, 0.12, 0.017, 0.017, 0.28, 8, BLACK); barrel(m, 0, 0.1, -0.16, 0.022, 0.025, 0.04, 8, BLACK); m.cbox(0, 0.075, 0.0, 0.008, 0.02, 0.01, BLACK); m.cbox(0, 0.075, -0.1, 0.008, 0.02, 0.01, BLACK); },
    bazooka(m) { barrel(m, 0, 0.06, 0.55, 0.045, 0.045, 1.35, 10, OLIVE); barrel(m, 0, 0.06, -0.8, 0.055, 0.055, 0.06, 10, DGREY); barrel(m, 0, 0.06, 0.55, 0.05, 0.05, 0.08, 10, DGREY); m.cbox(0, -0.03, -0.05, 0.014, 0.06, 0.02, WOOD2); m.cbox(0, -0.03, -0.3, 0.014, 0.06, 0.02, WOOD2); m.cbox(0, 0.0, 0.25, 0.03, 0.05, 0.12, WOOD); m.cbox(0.05, 0.1, -0.35, 0.012, 0.03, 0.02, METAL2); },
    panzerschreck(m) { barrel(m, 0, 0.06, 0.6, 0.05, 0.05, 1.4, 10, rgb(0x5a5a44)); m.cbox(0.02, 0.1, -0.2, 0.18, 0.2, 0.01, rgb(0x5a5a44)); m.cbox(0, -0.03, -0.05, 0.014, 0.06, 0.02, METAL); m.cbox(0, -0.03, -0.35, 0.014, 0.06, 0.02, METAL); },
    grenade(m) { m.sphere(0, 0, 0, 0.03, 0.042, 0.03, 8, 6, rgb(0x4a5234)); for (let i = 0; i < 3; i++) m.cbox(0, -0.025 + i * 0.025, 0, 0.032, 0.003, 0.032, rgb(0x3a4228)); m.cbox(0, 0.048, 0, 0.012, 0.012, 0.012, METAL2); m.cbox(0.016, 0.03, 0, 0.005, 0.034, 0.01, METAL2); m.cyl(-0.02, 0.05, 0, 0.008, 0.008, 0.003, 6, METAL2); },
    stick(m) { m.cyl(0, 0.06, 0, 0.032, 0.032, 0.08, 8, rgb(0x4a5040)); m.cyl(0, -0.14, 0, 0.013, 0.013, 0.2, 6, WOOD); m.cyl(0, -0.15, 0, 0.015, 0.015, 0.012, 6, METAL2); },
    papers(m) { m.cbox(0.06, 0.02, 0, 0.06, 0.08, 0.004, rgb(0x6a6a5a)); m.cbox(-0.06, 0.02, 0, 0.06, 0.08, 0.004, rgb(0xd8d0b8)); m.cbox(0.06, 0.05, 0.005, 0.03, 0.02, 0.002, rgb(0x2a2a2a)); for (let i = 0; i < 5; i++) m.cbox(-0.06, 0.07 - i * 0.025, 0.005, 0.045, 0.004, 0.002, rgb(0x3a3a3a)); m.cbox(-0.03, -0.03, 0.005, 0.016, 0.016, 0.002, rgb(0x8a2a2a)); },
    mg42(m) { m.cbox(0, 0.05, -0.05, 0.03, 0.04, 0.2, BLACK); barrel(m, 0, 0.055, -0.25, 0.025, 0.025, 0.4, 8, METAL); barrel(m, 0, 0.055, -0.65, 0.012, 0.012, 0.12, 6, METAL); m.cbox(0, 0.02, 0.25, 0.022, 0.035, 0.12, BLACK); angled(m, -0.3, q => q.cbox(0, -0.05, 0.1, 0.014, 0.05, 0.02, BLACK)); m.cbox(0.05, 0.02, -0.05, 0.03, 0.05, 0.05, rgb(0x5a5a44)); m.with(M4.rotX(M4.translate(M4.create(), 0.06, 0.03, -0.55), 0.8), q => q.cbox(0, -0.15, 0, 0.006, 0.15, 0.006, METAL)); m.with(M4.rotX(M4.translate(M4.create(), -0.06, 0.03, -0.55), 0.8), q => q.cbox(0, -0.15, 0, 0.006, 0.15, 0.006, METAL)); },
    rocket(m) { barrel(m, 0, 0, 0.25, 0.03, 0.03, 0.3, 8, OLIVE); m.with(M4.rotX(M4.translate(M4.create(), 0, 0, -0.05), -PI / 2), q => q.cyl(0, 0, 0, 0.03, 0.005, 0.12, 8, OLIVE)); m.cbox(0, 0, 0.27, 0.05, 0.003, 0.03, OLIVE); m.cbox(0, 0, 0.27, 0.003, 0.05, 0.03, OLIVE); },
    shell(m) { barrel(m, 0, 0, 0.2, 0.05, 0.05, 0.3, 8, rgb(0x8a7040)); m.with(M4.rotX(M4.translate(M4.create(), 0, 0, -0.1), -PI / 2), q => q.cyl(0, 0, 0, 0.05, 0.01, 0.12, 8, rgb(0x5a5a5a))); }
  };
  const VIEW_POS = {
    colt: { hip: [0.14, -0.17, -0.47], aim: [0, -0.066, -0.42], muzzle: [0, 0.036, -0.16] },
    silenced: { hip: [0.14, -0.17, -0.47], aim: [0, -0.066, -0.42], muzzle: [0, 0.034, -0.33] },
    p38: { hip: [0.14, -0.17, -0.47], aim: [0, -0.066, -0.42], muzzle: [0, 0.036, -0.19] },
    thompson: { hip: [0.15, -0.2, -0.5], aim: [0, -0.086, -0.3], muzzle: [0, 0.045, -0.38] },
    mp40: { hip: [0.15, -0.2, -0.5], aim: [0, -0.078, -0.3], muzzle: [0, 0.042, -0.37] },
    stg44: { hip: [0.15, -0.21, -0.5], aim: [0, -0.086, -0.28], muzzle: [0, 0.05, -0.46] },
    garand: { hip: [0.15, -0.21, -0.48], aim: [0, -0.084, -0.26], muzzle: [0, 0.05, -0.68] },
    kar98: { hip: [0.15, -0.21, -0.48], aim: [0, -0.078, -0.26], muzzle: [0, 0.048, -0.76] },
    kar98s: { hip: [0.15, -0.21, -0.48], aim: [0, -0.1, -0.16], muzzle: [0, 0.048, -0.76] },
    bar: { hip: [0.15, -0.22, -0.48], aim: [0, -0.088, -0.28], muzzle: [0, 0.05, -0.64] },
    springfield: { hip: [0.15, -0.21, -0.48], aim: [0, -0.1, -0.16], muzzle: [0, 0.048, -0.76] },
    bazooka: { hip: [0.2, -0.14, -0.3], aim: [0.07, -0.1, -0.2], muzzle: [0, 0.06, -0.8] },
    panzerschreck: { hip: [0.2, -0.14, -0.3], aim: [0.07, -0.1, -0.2], muzzle: [0, 0.06, -0.8] },
    grenade: { hip: [0.17, -0.18, -0.4], aim: [0.17, -0.18, -0.4], muzzle: [0, 0, 0] },
    stick: { hip: [0.17, -0.14, -0.4], aim: [0.17, -0.14, -0.4], muzzle: [0, 0, 0] },
    papers: { hip: [0.06, -0.2, -0.5], aim: [0.02, -0.11, -0.42], muzzle: [0, 0, 0] }
  };
  function viewHands(m, w, sleeve) {
    const sl = rgb(sleeve), sk = rgb(0xd0a080), cuff = rgb(0x4a4630);
    const arm = (x, y, z, rx, ry) => m.with(M4.rotY(M4.rotX(M4.translate(M4.create(), x, y, z), rx), ry), q => { q.cbox(0, -0.01, 0.1, 0.036, 0.036, 0.09, sl); q.cbox(0, -0.01, 0.015, 0.037, 0.037, 0.012, cuff); q.cbox(0, 0, -0.03, 0.03, 0.026, 0.035, sk); q.cbox(0, 0.012, -0.07, 0.03, 0.014, 0.02, sk); });
    const pist = w === 'colt' || w === 'p38' || w === 'silenced';
    if (w === 'grenade' || w === 'stick') { arm(0, -0.02, 0.04, 0.1, 0.1); return; }
    if (w === 'papers') { arm(0.08, -0.03, 0.06, 0.2, -0.2); arm(-0.08, -0.03, 0.06, 0.2, 0.2); return; }
    if (w === 'bazooka' || w === 'panzerschreck') { arm(0, -0.06, -0.02, 0.3, 0.05); arm(-0.02, -0.06, -0.28, 0.25, 0.3); return; }
    arm(0, -0.03, 0.04, 0.35, 0.05);
    if (pist) arm(-0.03, -0.045, 0.03, 0.4, 0.35);
    else arm(-0.02, 0.0, -0.2, 0.3, 0.35);
  }
  S.GUNS = GUNS; S.VIEW_POS = VIEW_POS;
  S.viewModel = function (w, sleeve) { const m = new Mesh(); (GUNS[w] || GUNS.colt)(m); viewHands(m, w, sleeve); return m; };
  S.gunModel = function (w) { const m = new Mesh(); m.with(M4.rotY(M4.create(), PI), q => (GUNS[w] || GUNS.colt)(q)); return m; };

  function pickupMesh(id) {
    const m = new Mesh();
    if (S.DATA.WEAPONS[id]) { m.with(M4.scale(M4.rotZ(M4.translate(M4.create(), 0, 0.05, 0), PI / 2), 1.5), q => (GUNS[id] || GUNS.colt)(q)); return m; }
    switch (id) {
      case 'canteen': m.cyl(0, 0, 0, 0.08, 0.08, 0.2, 10, rgb(0x5a6040)); m.cyl(0, 0.2, 0, 0.02, 0.02, 0.04, 6, rgb(0x2a2a2a)); break;
      case 'medkit': m.cbox(0, 0.08, 0, 0.18, 0.08, 0.12, rgb(0xe8e8e0)); m.cbox(0, 0.161, 0, 0.1, 0.002, 0.03, rgb(0xc02020)); m.cbox(0, 0.161, 0, 0.03, 0.002, 0.1, rgb(0xc02020)); break;
      case 'surgeon': m.cbox(0, 0.12, 0, 0.26, 0.12, 0.16, rgb(0x5a6040)); m.cbox(0, 0.241, 0, 0.12, 0.002, 0.04, rgb(0xe8e8e0)); m.cbox(0, 0.241, 0, 0.04, 0.002, 0.12, rgb(0xe8e8e0)); m.cbox(0, 0.26, 0, 0.06, 0.02, 0.02, rgb(0x2a2a2a)); break;
      case 'documents': case 'maps': m.cbox(0, 0.02, 0, 0.16, 0.02, 0.22, rgb(id === 'maps' ? 0x8a7a50 : 0x6a5a40)); m.cbox(0, 0.041, 0.05, 0.1, 0.001, 0.05, rgb(0xc02020)); break;
      case 'codebook': m.cbox(0, 0.03, 0, 0.12, 0.03, 0.17, rgb(0x1a1a1a)); m.cbox(0, 0.061, 0, 0.05, 0.001, 0.05, rgb(0xa0a0a0)); break;
      case 'plans': m.with(M4.rotZ(M4.translate(M4.create(), 0, 0.05, 0), PI / 2), q => q.cyl(0, -0.25, 0, 0.05, 0.05, 0.5, 8, rgb(0x5a7ab0))); break;
      case 'key': case 'cellkey': m.cbox(0, 0.01, 0, 0.06, 0.01, 0.015, rgb(0xb09040)); m.cyl(0.07, 0, 0, 0.03, 0.03, 0.015, 8, rgb(0xb09040)); break;
      case 'charges': for (let i = 0; i < 3; i++) m.cyl(-0.06 + i * 0.06, 0, 0, 0.03, 0.03, 0.2, 8, rgb(0xa06030)); m.cbox(0, 0.1, 0, 0.1, 0.02, 0.035, rgb(0x2a2a2a)); break;
      default: {
        const P = S.DATA.PICKUPS[id], col = P && P.ammo && /rocket/.test(P.ammo) ? 0x5a6040 : 0x4a5234;
        if (P && (P.ammo === 'grenade' || P.ammo === 'stick')) { for (let i = 0; i < 2; i++) m.with(M4.translate(M4.create(), -0.05 + i * 0.1, 0.05, 0), q => GUNS[P.ammo](q)); break; }
        m.cbox(0, 0.07, 0, 0.14, 0.07, 0.09, rgb(col)); m.cbox(0, 0.141, 0, 0.1, 0.002, 0.05, rgb(0xd8c870)); m.cbox(0, 0.15, 0, 0.03, 0.01, 0.06, rgb(0x2a2a2a));
      }
    }
    return m;
  }
  S.pickupMesh = pickupMesh;

  function targetMesh(kind) {
    const m = new Mesh();
    switch (kind) {
      case 'flak88': {
        const c = rgb(0x7a7658), d = rgb(0x3a3a30);
        m.cbox(0, 0.3, 0, 0.5, 0.25, 3.2, d); m.cbox(0, 0.3, 0, 3.2, 0.25, 0.5, d);
        for (const [x, z] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) m.cbox(x, 0.08, z, 0.35, 0.08, 0.35, d);
        m.cbox(0, 1.0, 0, 0.8, 0.5, 1.0, c); m.cbox(0, 1.6, 0.6, 1.1, 0.7, 0.04, c);
        m.with(M4.rotX(M4.translate(M4.create(), 0, 1.35, 0.2), PI / 2 - 0.45), q => { q.cyl(0, 0, 0, 0.12, 0.1, 5.4, 8, c); q.cyl(0, 5.2, 0, 0.14, 0.14, 0.3, 8, d); });
        m.cyl(0.4, 1.3, -0.5, 0.18, 0.18, 0.5, 8, d); m.cyl(-0.4, 1.3, -0.5, 0.18, 0.18, 0.5, 8, d);
        break;
      }
      case 'uboat': {
        const c = rgb(0x5a6068), d = rgb(0x3a3e44), r = rgb(0x5a2a22);
        m.with(M4.rotX(M4.translate(M4.create(), 0, 1.6, -30), PI / 2), q => { q.cyl(0, 0, 0, 0.3, 3.0, 8, 12, c, false); q.cyl(0, 8, 0, 3.0, 3.0, 40, 12, c, false); q.cyl(0, 48, 0, 3.0, 0.4, 12, 12, c, false); });
        m.cbox(0, 0.3, 0, 2.6, 0.9, 30, r);
        m.cbox(0, 4.55, 0, 1.2, 0.08, 24, d);
        m.cbox(0, 5.8, -1, 1.2, 1.4, 3.5, c); m.cbox(0, 7.25, -1.6, 1.3, 0.1, 2.6, d); m.cyl(0, 7.2, 0.2, 0.08, 0.08, 2.5, 6, d); m.cyl(0.4, 7.2, -0.3, 0.06, 0.06, 1.8, 6, d);
        m.cbox(0, 5, 8, 0.25, 0.4, 0.6, d); m.with(M4.rotX(M4.translate(M4.create(), 0, 5.3, 8.5), PI / 2), q => q.cyl(0, 0, 0, 0.08, 0.08, 2.4, 6, d));
        m.cbox(0, 3.2, 3.01, 0.02, 0.35, 1.6, rgb(0xd0d0c8));
        break;
      }
      case 'v2': {
        const w = rgb(0xd8d8d0), b = rgb(0x1a1a1a), p = rgb(0x5a5a50);
        m.cbox(0, 0.6, 0, 2.2, 0.6, 2.2, p); m.cbox(0, 1.25, 0, 1.6, 0.05, 1.6, rgb(0x3a3a34));
        const seg = (y0, h, r0, r1, col) => m.cyl(0, y0, 0, r0, r1, h, 12, col, true);
        seg(1.4, 2, 0.8, 0.83, w); seg(3.4, 2, 0.83, 0.83, b); seg(5.4, 2, 0.83, 0.83, w); seg(7.4, 2, 0.83, 0.7, b); seg(9.4, 2.5, 0.7, 0.4, w); seg(11.9, 1.6, 0.4, 0.02, b);
        for (let i = 0; i < 4; i++) m.with(M4.rotY(M4.create(), i * PI / 2 + PI / 4), q => q.poly4([0.6, 1.4, 0], [1.6, 1.4, 0], [1.2, 3.2, 0], [0.7, 3.8, 0], i % 2 ? b : w));
        for (let i = 0; i < 4; i++) m.with(M4.rotY(M4.create(), i * PI / 2 + PI / 4), q => q.cbox(1.8, 3, 0, 0.12, 3, 0.12, rgb(0x6a5a3a)));
        break;
      }
      case 'radio': {
        m.cbox(0, 0.4, 0, 0.9, 0.04, 0.5, rgb(0x6a4a2a)); for (const [x, z] of [[0.8, 0.4], [-0.8, 0.4], [0.8, -0.4], [-0.8, -0.4]]) m.cbox(x, 0.2, z, 0.04, 0.2, 0.04, rgb(0x4a3020));
        m.cbox(0, 0.72, -0.1, 0.55, 0.28, 0.25, rgb(0x4a5040)); m.cbox(-0.2, 0.75, 0.152, 0.14, 0.12, 0.004, rgb(0x1a1a1a)); for (let i = 0; i < 4; i++) m.cyl(0.1 + i * 0.1, 0.65, 0.16, 0.025, 0.025, 0.02, 6, rgb(0xb0a070));
        m.cyl(0.4, 1.0, -0.2, 0.01, 0.01, 1.8, 4, rgb(0x9a9a9a)); m.cbox(0.2, 0.46, 0.25, 0.06, 0.02, 0.12, rgb(0x1a1a1a));
        break;
      }
      case 'cells': {
        for (let i = 0; i < 6; i++) { m.cyl(-3.75 + i * 1.5, 0, 0, 0.55, 0.55, 2.2, 10, rgb(0x6a7a7a)); m.cyl(-3.75 + i * 1.5, 2.2, 0, 0.58, 0.3, 0.3, 10, rgb(0x4a5454)); m.cyl(-3.75 + i * 1.5, 2.5, 0, 0.06, 0.06, 1.2, 6, rgb(0x8a6a3a)); }
        m.cbox(0, 3.6, 0, 4.4, 0.08, 0.1, rgb(0x8a6a3a)); m.cbox(0, 0.05, 0, 4.6, 0.05, 0.8, rgb(0x3a3a3a));
        break;
      }
      case 'fuel': {
        for (let i = 0; i < 3; i++) { m.with(M4.rotX(M4.translate(M4.create(), -2.6 + i * 2.6, 1.3, -3), PI / 2), q => q.cyl(0, 0, 0, 1.1, 1.1, 6, 12, rgb(0x5a6048))); m.cbox(-2.6 + i * 2.6, 0.2, -2, 0.9, 0.2, 0.2, rgb(0x3a3a34)); m.cbox(-2.6 + i * 2.6, 0.2, 2, 0.9, 0.2, 0.2, rgb(0x3a3a34)); m.cbox(-2.6 + i * 2.6, 2.4, 0, 0.3, 0.1, 0.3, rgb(0xa02020)); }
        break;
      }
      case 'depot': {
        const r = S.RNG(77);
        for (let i = 0; i < 14; i++) { const x = r.range(-2, 2), z = r.range(-1.5, 1.5), y = Math.floor(i / 6) * 0.5; m.with(M4.rotY(M4.translate(M4.create(), x, y, z), r() * 0.4), q => q.cbox(0, 0.25, 0, 0.45, 0.25, 0.3, rgb(i % 2 ? 0x5a6040 : 0x6a5a3a))); }
        break;
      }
      default: m.cbox(0, 0.5, 0, 0.5, 0.5, 0.5, rgb(0xff00ff));
    }
    return m;
  }
  S.targetMesh = targetMesh;
  S.TARGET_R = { flak88: 3.2, uboat: 4, v2: 2.2, radio: 1, cells: 4.5, fuel: 4, depot: 2.5 };

  const W1 = [1, 1, 1, 1];
  function propMeshes(p) {
    const out = {}, get = t => out[t] || (out[t] = new Mesh());
    const root = M4.rotY(M4.translate(M4.create(), p.x, p.y, p.z), p.rot || 0);
    if (p.s && p.s !== 1) M4.scale(root, p.s);
    const put = (tex, fn) => get(tex).with(root, fn);
    switch (p.kind) {
      case 'roof': {
        const w = p.w / 2, d = p.d / 2, rh = p.rh, roofTex = p.tex || 'rooftile', gable = p.gable || 'plaster';
        const r0 = M4.translate(M4.create(), p.x, p.y, p.z);
        if (p.alongX) {
          get(roofTex).with(r0, m => { m.poly4([-w, 0, -d], [w, 0, -d], [w, rh, 0], [-w, rh, 0], W1, [[0, d * 0.5], [w, d * 0.5], [w, 0], [0, 0]]); m.poly4([w, 0, d], [-w, 0, d], [-w, rh, 0], [w, rh, 0], W1, [[0, d * 0.5], [w, d * 0.5], [w, 0], [0, 0]]); });
          get(gable).with(r0, m => { m.tri([[w - 0.4, 0, -d + 0.4], [w - 0.4, 0, d - 0.4], [w - 0.4, rh - 0.1, 0]], [1, 0, 0], [[0, 1], [1, 1], [0.5, 0]], W1); m.tri([[-w + 0.4, 0, d - 0.4], [-w + 0.4, 0, -d + 0.4], [-w + 0.4, rh - 0.1, 0]], [-1, 0, 0], [[0, 1], [1, 1], [0.5, 0]], W1); });
        } else {
          get(roofTex).with(r0, m => { m.poly4([w, 0, -d], [w, 0, d], [0, rh, d], [0, rh, -d], W1, [[0, w * 0.5], [d, w * 0.5], [d, 0], [0, 0]]); m.poly4([-w, 0, d], [-w, 0, -d], [0, rh, -d], [0, rh, d], W1, [[0, w * 0.5], [d, w * 0.5], [d, 0], [0, 0]]); });
          get(gable).with(r0, m => { m.tri([[-w + 0.4, 0, d - 0.4], [w - 0.4, 0, d - 0.4], [0, rh - 0.1, d - 0.4]], [0, 0, 1], [[0, 1], [1, 1], [0.5, 0]], W1); m.tri([[w - 0.4, 0, -d + 0.4], [-w + 0.4, 0, -d + 0.4], [0, rh - 0.1, -d + 0.4]], [0, 0, -1], [[0, 1], [1, 1], [0.5, 0]], W1); });
        }
        break;
      }
      case 'fence': {
        const ax = p.ax, az = p.az, bx = p.bx, bz = p.bz, h = p.h, len = Math.hypot(bx - ax, bz - az), n = Math.ceil(len / 3), m = get(p.tex || 'stone');
        for (let i = 0; i < n; i++) {
          const t0 = i / n, t1 = (i + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
          const y0 = p.gy ? p.gy[i] : p.y, y1 = p.gy ? p.gy[i + 1] : p.y;
          const nx = -(z1 - z0), nz = x1 - x0, l = Math.hypot(nx, nz) || 1, seg = len / n, ox = nx / l * p.t / 2, oz = nz / l * p.t / 2;
          m.quad([[x0 + ox, y0 - 0.3, z0 + oz], [x1 + ox, y1 - 0.3, z1 + oz], [x1 + ox, y1 + h, z1 + oz], [x0 + ox, y0 + h, z0 + oz]], [nx / l, 0, nz / l], [[0, 1], [seg / 3, 1], [seg / 3, 0], [0, 0]], W1);
          m.quad([[x1 - ox, y1 - 0.3, z1 - oz], [x0 - ox, y0 - 0.3, z0 - oz], [x0 - ox, y0 + h, z0 - oz], [x1 - ox, y1 + h, z1 - oz]], [-nx / l, 0, -nz / l], [[0, 1], [seg / 3, 1], [seg / 3, 0], [0, 0]], W1);
          if (p.t > 0.2) m.quad([[x0 - ox, y0 + h, z0 - oz], [x0 + ox, y0 + h, z0 + oz], [x1 + ox, y1 + h, z1 + oz], [x1 - ox, y1 + h, z1 - oz]], [0, 1, 0], [[0, 0], [0.2, 0], [0.2, seg / 3], [0, seg / 3]], W1);
        }
        break;
      }
      case 'lamp': put('metal', m => { m.cbox(0, 0.05, 0, 0.14, 0.05, 0.14, rgb(0x303030)); m.cbox(0, -0.1, 0, 0.07, 0.09, 0.07, [1.6, 1.45, 1.0, 0]); }); break;
      case 'lantern': put('metal', m => { m.cbox(0, 0, 0, 0.1, 0.14, 0.1, rgb(0x2a2a2a)); m.cbox(0, 0, 0, 0.07, 0.1, 0.07, [1.6, 1.3, 0.8, 0]); m.cbox(0, 0.2, -0.25, 0.02, 0.02, 0.28, rgb(0x2a2a2a)); }); break;
      case 'streetlamp': put('metal', m => { m.cyl(0, 0, 0, 0.1, 0.07, 4.2, 8, rgb(0x2a2a2a)); m.cbox(0, 4.3, 0, 0.18, 0.1, 0.18, rgb(0x2a2a2a)); m.cbox(0, 4.12, 0, 0.12, 0.1, 0.12, [1.6, 1.4, 0.9, 0]); }); break;
      case 'truck': put('metal', m => {
        const c = rgb(p.col || 0x4e5440); m.cbox(0, 1.1, 2.4, 1.1, 0.7, 1.0, c); m.cbox(0, 1.55, 2.3, 1.05, 0.45, 0.55, c); m.cbox(0, 1.6, 2.86, 0.9, 0.3, 0.02, rgb(0x203040)); m.cbox(0, 0.8, 3.3, 0.9, 0.35, 0.3, c);
        m.cbox(0, 0.75, -0.9, 1.15, 0.1, 2.4, rgb(0x3a3a30)); m.cbox(0, 1.8, -0.9, 1.2, 1.0, 2.4, rgb(0x5a5a44)); m.cbox(0, 2.8, -0.9, 1.15, 0.05, 2.35, rgb(0x4a4a38));
        for (const [x, z] of [[1.0, 2.6], [-1.0, 2.6], [1.0, -1.4], [-1.0, -1.4], [1.0, -2.5], [-1.0, -2.5]]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.5, z), PI / 2), q => q.cyl(0, -0.14, 0, 0.48, 0.48, 0.28, 10, rgb(0x1a1a1a)));
      }); break;
      case 'kubel': put('metal', m => {
        const c = rgb(0x6a6a50); m.cbox(0, 0.7, 0, 0.8, 0.3, 1.9, c); m.cbox(0, 1.0, -0.5, 0.78, 0.05, 1.0, c); m.cbox(0, 1.15, 0.7, 0.75, 0.2, 0.02, rgb(0x203040));
        for (const [x, z] of [[0.75, 1.3], [-0.75, 1.3], [0.75, -1.3], [-0.75, -1.3]]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.35, z), PI / 2), q => q.cyl(0, -0.1, 0, 0.35, 0.35, 0.2, 10, rgb(0x1a1a1a)));
      }); break;
      case 'halftrack': put('metal', m => {
        const c = rgb(0x6e6a4e); m.cbox(0, 1.2, -0.3, 1.1, 0.7, 2.4, c); m.cbox(0, 1.1, 2.3, 0.8, 0.45, 0.8, c); m.cbox(0, 1.05, -0.3, 0.9, 0.05, 2.2, rgb(0x3a3a30));
        for (const x of [1.0, -1.0]) m.cbox(x, 0.45, -0.9, 0.22, 0.45, 1.8, rgb(0x1e1c18));
        for (const x of [0.85, -0.85]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.45, 2.4), PI / 2), q => q.cyl(0, -0.12, 0, 0.45, 0.45, 0.24, 10, rgb(0x1a1a1a)));
      }); break;
      case 'wreck': put('rust', m => { m.cbox(0, 0.9, 1.5, 1.1, 0.6, 1.1, rgb(0x2a2420)); m.cbox(0, 0.6, -1, 1.1, 0.2, 2.2, rgb(0x2a2420)); m.with(M4.rotZ(M4.translate(M4.create(), 0.4, 1.5, -1), 0.4), q => q.cbox(0, 0, 0, 0.9, 0.05, 1.8, rgb(0x3a3028))); }); break;
      case 'car': put('metal', m => { const c = rgb(p.col || 0x1a1a1e); m.cbox(0, 0.65, 0, 0.85, 0.3, 2.1, c); m.cbox(0, 1.1, -0.3, 0.75, 0.25, 1.0, c); m.cbox(0, 1.1, -0.3, 0.76, 0.18, 0.9, rgb(0x203040)); for (const [x, z] of [[0.8, 1.4], [-0.8, 1.4], [0.8, -1.4], [-0.8, -1.4]]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.38, z), PI / 2), q => q.cyl(0, -0.1, 0, 0.38, 0.38, 0.2, 10, rgb(0x1a1a1a))); m.cbox(0.6, 0.55, 2.1, 0.12, 0.1, 0.05, rgb(0xd8d0a0)); m.cbox(-0.6, 0.55, 2.1, 0.12, 0.1, 0.05, rgb(0xd8d0a0)); }); break;
      case 'wagon': put('planks', m => {
        const c = rgb(p.col || 0x5a3a28); m.cbox(0, 2.2, 0, 1.5, 1.3, 6.5, c); m.cbox(0, 3.55, 0, 1.45, 0.08, 6.4, rgb(0x3a2a1a)); m.cbox(1.51, 2.1, 0, 0.02, 1.0, 1.2, rgb(0x2a1a10)); m.cbox(-1.51, 2.1, 0, 0.02, 1.0, 1.2, rgb(0x2a1a10));
        for (const z of [-4.8, -3.6, 3.6, 4.8]) for (const x of [1.0, -1.0]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.45, z), PI / 2), q => q.cyl(0, -0.08, 0, 0.45, 0.45, 0.16, 8, rgb(0x2a2a2a)));
        m.cbox(0, 0.85, 0, 1.3, 0.1, 6.2, rgb(0x2a2a2a));
      }); break;
      case 'barrel': put('rust', m => m.cyl(0, 0, 0, 0.3, 0.3, 0.9, 10, rgb(p.col || 0x3a4a3a))); break;
      case 'barrels': put('rust', m => { m.cyl(0, 0, 0, 0.3, 0.3, 0.9, 10, rgb(0x3a4a3a)); m.cyl(0.65, 0, 0.1, 0.3, 0.3, 0.9, 10, rgb(0x5a3020)); m.cyl(0.3, 0, 0.62, 0.3, 0.3, 0.9, 10, rgb(0x5a5a30)); }); break;
      case 'crate': put('crate', m => m.cbox(0, 0.45 * (p.cs || 1), 0, 0.45 * (p.cs || 1), 0.45 * (p.cs || 1), 0.45 * (p.cs || 1), W1)); break;
      case 'crates': put('crate', m => { m.cbox(0, 0.45, 0, 0.45, 0.45, 0.45, W1); m.cbox(0.95, 0.4, 0.1, 0.4, 0.4, 0.4, rgb(0xe0e0d0)); m.cbox(0.4, 1.25, 0.05, 0.38, 0.38, 0.38, rgb(0xf0f0e0)); }); break;
      case 'table': put('planks', m => { m.cbox(0, 0.78, 0, p.w || 0.8, 0.04, p.d || 0.5, rgb(0x7a5a3a)); for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) m.cbox(x * ((p.w || 0.8) - 0.06), 0.38, z * ((p.d || 0.5) - 0.06), 0.04, 0.38, 0.04, rgb(0x5a4028)); if (p.papers) for (let i = 0; i < 3; i++) m.with(M4.rotY(M4.translate(M4.create(), -0.3 + i * 0.3, 0.83, 0), i * 0.4), q => q.cbox(0, 0, 0, 0.1, 0.004, 0.14, rgb(0xe0d8c0))); }); break;
      case 'chair': put('planks', m => { m.cbox(0, 0.45, 0, 0.22, 0.03, 0.22, rgb(0x6a4a2a)); for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) m.cbox(x * 0.19, 0.22, z * 0.19, 0.025, 0.22, 0.025, rgb(0x5a4028)); m.cbox(0, 0.75, -0.2, 0.22, 0.28, 0.025, rgb(0x6a4a2a)); }); break;
      case 'desk': put('planks', m => { m.cbox(0, 0.75, 0, 0.8, 0.04, 0.45, rgb(0x5a3a20)); m.cbox(0.55, 0.37, 0, 0.24, 0.37, 0.42, rgb(0x4a3018)); m.cbox(-0.72, 0.37, 0, 0.04, 0.37, 0.42, rgb(0x4a3018)); m.cbox(0.2, 0.8, 0.1, 0.15, 0.01, 0.2, rgb(0xe0d8c0)); m.cyl(-0.4, 0.79, -0.2, 0.06, 0.03, 0.25, 6, rgb(0x2a4a2a)); m.cbox(-0.4, 1.04, -0.15, 0.1, 0.04, 0.06, [1.4, 1.3, 0.8, 0]); }); break;
      case 'bed': put('cloth', m => { m.cbox(0, 0.4, 0, 0.45, 0.08, 1.0, rgb(0x6a6a5a)); m.cbox(0, 0.5, 0.75, 0.35, 0.05, 0.2, rgb(0xd0d0c0)); m.cbox(0, 0.2, 0, 0.47, 0.2, 1.02, rgb(0x3a3a3a)); if (p.bunk) { m.cbox(0, 1.5, 0, 0.45, 0.08, 1.0, rgb(0x6a6a5a)); m.cbox(0.45, 0.9, 0.98, 0.03, 0.9, 0.03, rgb(0x3a3a3a)); m.cbox(-0.45, 0.9, 0.98, 0.03, 0.9, 0.03, rgb(0x3a3a3a)); m.cbox(0.45, 0.9, -0.98, 0.03, 0.9, 0.03, rgb(0x3a3a3a)); m.cbox(-0.45, 0.9, -0.98, 0.03, 0.9, 0.03, rgb(0x3a3a3a)); } }); break;
      case 'shelf': put('planks', m => { m.cbox(0, 1.0, 0, 0.9, 1.0, 0.03, rgb(0x5a4028)); for (let i = 0; i < 4; i++) m.cbox(0, 0.1 + i * 0.6, 0.2, 0.9, 0.02, 0.2, rgb(0x6a4a30)); for (let i = 0; i < 12; i++) m.cbox(-0.75 + (i % 6) * 0.3, 0.25 + Math.floor(i / 6) * 0.6, 0.2, 0.06, 0.14, 0.1, rgb([0x5a2a1a, 0x2a3a5a, 0x3a4a2a, 0x6a5a3a][i % 4])); }); break;
      case 'locker': put('metal', m => { m.cbox(0, 0.95, 0, 0.4, 0.95, 0.25, rgb(0x5a6050)); m.cbox(0, 0.95, 0.252, 0.005, 0.9, 0.002, rgb(0x2a2a2a)); }); break;
      case 'stove': put('metal', m => { m.cbox(0, 0.45, 0, 0.35, 0.45, 0.3, rgb(0x2a2a2a)); m.cyl(0.1, 0.9, 0, 0.08, 0.08, 2.2, 6, rgb(0x2a2a2a)); m.cbox(0, 0.35, 0.301, 0.15, 0.1, 0.005, [1.4, 0.6, 0.2, 0]); }); break;
      case 'radio': put('metal', m => { m.cbox(0, 0.15, 0, 0.25, 0.15, 0.12, rgb(0x4a3a2a)); m.cbox(0.1, 0.18, 0.121, 0.08, 0.08, 0.002, rgb(0xb0a070)); }); break;
      case 'haystack': put('hay', m => m.sphere(0, 0.8, 0, 1.6, 1.3, 1.6, 8, 5, W1)); break;
      case 'well': put('stone', m => { m.cyl(0, 0, 0, 0.9, 0.9, 0.9, 12, W1); m.cbox(0.75, 1.3, 0, 0.06, 0.9, 0.06, rgb(0x5a4a3a)); m.cbox(-0.75, 1.3, 0, 0.06, 0.9, 0.06, rgb(0x5a4a3a)); m.cbox(0, 2.2, 0, 1.0, 0.25, 0.7, rgb(0x6a4a30)); }); break;
      case 'cart': put('planks', m => { m.cbox(0, 0.9, 0, 0.8, 0.3, 1.3, rgb(0x6a5030)); for (const x of [0.9, -0.9]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.6, 0), PI / 2), q => q.cyl(0, -0.05, 0, 0.6, 0.6, 0.1, 10, rgb(0x4a3a20))); m.cbox(0, 0.8, 2.0, 0.05, 0.05, 0.8, rgb(0x5a4028)); }); break;
      case 'bench': put('planks', m => { m.cbox(0, 0.45, 0, 0.9, 0.04, 0.2, rgb(0x7a5a3a)); m.cbox(0.8, 0.22, 0, 0.05, 0.22, 0.18, rgb(0x4a3a2a)); m.cbox(-0.8, 0.22, 0, 0.05, 0.22, 0.18, rgb(0x4a3a2a)); }); break;
      case 'banner': put('banner', m => { const h = p.h || 4, w = p.w || 1.4; m.quad([[w / 2, 0, 0.03], [-w / 2, 0, 0.03], [-w / 2, h, 0.03], [w / 2, h, 0.03]], [0, 0, 1], [[1, 1], [0, 1], [0, 0], [1, 0]], W1); }); break;
      case 'poster': put('poster', m => m.quad([[0.4, 1.1, 0.02], [-0.4, 1.1, 0.02], [-0.4, 2.1, 0.02], [0.4, 2.1, 0.02]], [0, 0, 1], [[1, 1], [0, 1], [0, 0], [1, 0]], W1)); break;
      case 'mapboard': put('mapboard', m => { m.quad([[0.9, 1.0, 0.03], [-0.9, 1.0, 0.03], [-0.9, 2.2, 0.03], [0.9, 2.2, 0.03]], [0, 0, 1], [[1, 1], [0, 1], [0, 0], [1, 0]], W1); }); break;
      case 'hedgehog': put('metal', m => { const c = rgb(0x3a3a34); for (const [a, b] of [[0, 0.7], [PI / 2, 0.7], [0, -0.7]]) m.with(M4.rotZ(M4.rotY(M4.translate(M4.create(), 0, 0.7, 0), a), b), q => q.cbox(0, 0, 0, 0.08, 1.0, 0.05, c)); }); break;
      case 'wirecoil': put('wire', m => { const len = p.len || 4; m.cross(0, 0, 0, len, 0.9, 2, W1, 0); }); break;
      case 'tower': put('planks', m => { const h = p.h || 6; for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) m.cbox(x * 1.3, h / 2, z * 1.3, 0.1, h / 2, 0.1, rgb(0x5a4028)); m.cbox(0, h, 0, 1.6, 0.08, 1.6, rgb(0x6a4a30)); for (const [x, z, w, d] of [[0, 1.55, 1.6, 0.05], [0, -1.55, 1.6, 0.05], [1.55, 0, 0.05, 1.6], [-1.55, 0, 0.05, 1.6]]) m.cbox(x, h + 0.55, z, w, 0.5, d, rgb(0x6a4a30)); for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) m.cbox(x * 1.5, h + 1.4, z * 1.5, 0.06, 1.4, 0.06, rgb(0x5a4028)); m.cbox(0, h + 2.9, 0, 1.9, 0.1, 1.9, rgb(0x4a4a3a)); }); break;
      case 'searchlight': put('metal', m => { m.cyl(0, 0, 0, 0.3, 0.2, 0.8, 8, rgb(0x3a3a34)); m.with(M4.rotX(M4.translate(M4.create(), 0, 1.0, 0), PI / 2 - 0.3), q => q.cyl(0, -0.3, 0, 0.35, 0.35, 0.6, 10, rgb(0x3a3a34))); m.with(M4.rotX(M4.translate(M4.create(), 0, 1.0, 0), PI / 2 - 0.3), q => q.cyl(0, 0.31, 0, 0.3, 0.3, 0.01, 10, [1.8, 1.7, 1.4, 0])); }); break;
      case 'tent': put('canvas', m => { const w = 2.2, d = 3, h = 2.2; m.poly4([-w, 0, -d], [0, h, -d], [0, h, d], [-w, 0, d], W1); m.poly4([0, h, -d], [w, 0, -d], [w, 0, d], [0, h, d], W1); m.tri([[-w, 0, d], [0, h, d], [w, 0, d]], [0, 0, 1], [[0, 1], [0.5, 0], [1, 1]], W1); m.tri([[w, 0, -d], [0, h, -d], [-w, 0, -d]], [0, 0, -1], [[0, 1], [0.5, 0], [1, 1]], W1); }); break;
      case 'crane': put('rust', m => { const h = p.h || 14; m.cbox(0, h / 2, 0, 0.5, h / 2, 0.5, rgb(0x6a5a3a)); m.cbox(0, h, 4, 0.35, 0.35, 7, rgb(0x6a5a3a)); m.cbox(0, h - 3, 10, 0.02, 3, 0.02, rgb(0x2a2a2a)); m.cbox(0, h - 6.2, 10, 0.3, 0.2, 0.3, rgb(0x2a2a2a)); }); break;
      case 'bollard': put('metal', m => { m.cyl(0, 0, 0, 0.2, 0.2, 0.5, 8, rgb(0x2a2a2a)); m.cyl(0, 0.5, 0, 0.28, 0.28, 0.08, 8, rgb(0x2a2a2a)); }); break;
      case 'pipes': put('rust', m => { const len = p.len || 10; for (let i = 0; i < 3; i++) m.with(M4.rotX(M4.translate(M4.create(), -0.5 + i * 0.5, p.py || 3, -len / 2), PI / 2), q => q.cyl(0, 0, 0, 0.18, 0.18, len, 8, rgb(0x6a5a4a), false)); }); break;
      case 'bell': put('stone', m => { const h = p.h || 16; m.cbox(0, h / 2, 0, 2.2, h / 2, 2.2, W1); m.cbox(0, h + 0.2, 0, 2.4, 0.2, 2.4, W1); }); get('rooftile').with(root, m => m.pyramid(0, (p.h || 16) + 0.4, 0, 2.5, 5, W1, 3)); break;
      case 'cross': put('stone', m => { m.cbox(0, 0.6, 0, 0.06, 0.6, 0.06, rgb(0x8a8a84)); m.cbox(0, 0.9, 0, 0.3, 0.06, 0.06, rgb(0x8a8a84)); }); break;
      case 'grave': put('stone', m => { m.cbox(0, 0.45, 0, 0.35, 0.45, 0.08, rgb(0x9a9a94)); m.cbox(0, 0.05, 0.6, 0.4, 0.05, 0.7, rgb(0x5a5040)); }); break;
      case 'lockerrow': put('metal', m => { for (let i = 0; i < (p.n || 4); i++) m.cbox(i * 0.82, 0.95, 0, 0.4, 0.95, 0.25, rgb(0x5a6050)); }); break;
      case 'mgnest': put('sandbag', m => { for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4; m.cbox(Math.sin(a) * 1.5, 0.5, Math.cos(a) * 1.5, 0.4, 0.5, 0.3, W1); } }); break;
      case 'torpedo': put('metal', m => m.with(M4.rotX(M4.translate(M4.create(), 0, 0.4, -3.5), PI / 2), q => { q.cyl(0, 0, 0, 0.27, 0.27, 6.5, 10, rgb(0x5a5a5a)); q.cyl(0, 6.5, 0, 0.27, 0.05, 0.5, 10, rgb(0x6a4a2a)); })); break;
      case 'rocketcart': put('metal', m => { m.cbox(0, 0.5, 0, 1.2, 0.08, 6, rgb(0x4a4a40)); for (const z of [-5, 5]) for (const x of [1, -1]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.3, z), PI / 2), q => q.cyl(0, -0.05, 0, 0.3, 0.3, 0.1, 8, rgb(0x2a2a2a))); m.with(M4.rotX(M4.translate(M4.create(), 0, 1.4, -5.5), PI / 2), q => { q.cyl(0, 0, 0, 0.83, 0.83, 9, 12, rgb(0xc8c8c0)); q.cyl(0, 9, 0, 0.83, 0.1, 3, 12, rgb(0x1a1a1a)); }); }); break;
      case 'antenna': put('metal', m => { const h = p.h || 8; m.cyl(0, 0, 0, 0.06, 0.03, h, 5, rgb(0x707070)); for (let i = 1; i < 5; i++) m.cbox(0, h * i / 5, 0, 0.5 - i * 0.08, 0.015, 0.015, rgb(0x707070)); }); break;
      case 'lamppost': put('metal', m => { m.cyl(0, 0, 0, 0.08, 0.06, 3.6, 6, rgb(0x2a2a2a)); m.cbox(0, 3.7, 0, 0.14, 0.14, 0.14, rgb(0x2a2a2a)); m.cbox(0, 3.62, 0, 0.1, 0.1, 0.1, [1.6, 1.4, 0.9, 0]); }); break;
      default: put('stone', m => m.cbox(0, 0.5, 0, 0.5, 0.5, 0.5, rgb(0xff00ff)));
    }
    return out;
  }
  S.propMeshes = propMeshes;

  function treeMeshes(t, out) {
    const get = k => out[k] || (out[k] = new Mesh());
    const s = t.s, x = t.x, y = t.y, z = t.z, r = t.rot;
    const tint = 0.85 + ((Math.abs(x * 3.3 + z * 1.7) % 1) * 0.3), lc = [tint, tint, tint * 0.95, 1];
    switch (t.kind) {
      case 'oak': {
        get('bark').cyl(x, y - 0.3, z, 0.32 * s, 0.16 * s, 6 * s, 7, W1, false, 1, 0.3);
        const L = get('leaves');
        for (let i = 0; i < 4; i++) { const a = r + i * 1.6; L.cross(x + Math.cos(a) * 0.9 * s, y + (3.6 + (i % 2) * 1.2) * s, z + Math.sin(a) * 0.9 * s, 4.4 * s, 3.8 * s, 2, lc, a); }
        L.cross(x, y + 5.2 * s, z, 3.6 * s, 3 * s, 3, lc, r);
        break;
      }
      case 'birch': {
        get('birch').cyl(x, y - 0.3, z, 0.16 * s, 0.07 * s, 9 * s, 6, W1, false, 1, 0.3);
        const L = get('leaves');
        for (let i = 0; i < 3; i++) { const cy = y + (4 + i * 1.9) * s, w = (3.6 - i * 0.7) * s; L.cross(x + Math.sin(i * 2 + r) * 0.4, cy, z + Math.cos(i * 2 + r) * 0.4, w, w * 0.95, 3, lc, r + i); }
        break;
      }
      case 'pine': case 'snowpine': {
        get('bark').cyl(x, y - 0.3, z, 0.24 * s, 0.1 * s, 12 * s, 6, W1, false, 1, 0.3);
        const L = get(t.kind === 'snowpine' ? 'snowpine' : 'pine');
        for (let i = 0; i < 4; i++) { const cy = y + (3.5 + i * 2) * s, w = (4.6 - i * 0.95) * s; L.cross(x, cy, z, w, 2.8 * s, 3, lc, r + i * 0.7); }
        break;
      }
      case 'dead': {
        get('bark').cyl(x, y - 0.3, z, 0.22 * s, 0.06 * s, 8 * s, 5, [0.6, 0.6, 0.6, 1], false, 1, 0.3);
        const B = get('bark');
        for (let i = 0; i < 4; i++) B.with(M4.rotZ(M4.rotY(M4.translate(M4.create(), x, y + (3 + i * 1.2) * s, z), r + i * 1.9), 0.9), q => q.cyl(0, 0, 0, 0.07 * s, 0.02 * s, 2.4 * s, 4, [0.55, 0.55, 0.55, 1], false));
        break;
      }
      case 'bush': get('bush').cross(x, y - 0.2, z, 2.8 * s, 1.8 * s, 3, lc, r); break;
      default: break;
    }
  }
  S.treeMeshes = treeMeshes;
  S.LOOKS = LOOKS; S.MODELS = MODELS;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Moh98 = globalThis.Moh98 || {});
