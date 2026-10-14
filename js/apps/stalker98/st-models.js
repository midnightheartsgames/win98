/**
 * S.T.A.L.K.E.R. 98 — procedural low-poly models: articulated humans (per faction look) and mutants with procedural poses,
 * first-person weapons with hands, world items, vehicles, buildings details and other props.
 * Conventions: models face +z; in this engine the right-hand side of a model facing +z is -x.
 */
(function (S) {
  'use strict';
  const { M4, Mesh, rgb } = S;
  const sin = Math.sin, cos = Math.cos, PI = Math.PI;

  // ================================================================ human looks
  const LOOKS = {
    rookie: { suit: 0x5a4028, suit2: 0x4a3420, pants: 0x3a4a60, skin: 0xd8a888, head: 'hood', hood: 0x3a3a30, pack: 0x4a4a30 },
    loner: { suit: 0x4e4a30, suit2: 0x3a3a24, pants: 0x3c3a30, skin: 0xd0a080, head: 'hood', hood: 0x40402a, pack: 0x3e3a28 },
    veteran: { suit: 0x4a5a30, suit2: 0x2e3a20, pants: 0x3a4028, skin: 0xc89878, head: 'gasmask', hood: 0x3a4424, pack: 0x3a3a22, vest: 0x2a3020 },
    bandit: { suit: 0x1c1c1c, suit2: 0x101010, pants: 0x283048, skin: 0xd8a888, head: 'cap', hood: 0x151515, stripes: true },
    boss: { suit: 0x2a2018, suit2: 0x1a140e, pants: 0x1a1a1a, skin: 0xd0a080, head: 'bald', coat: true },
    military: { suit: 0x6a6a40, suit2: 0x4e5030, pants: 0x5a5a38, skin: 0xd0a080, head: 'helmet', hood: 0x4a5030, camo: true, vest: 0x3e4228 },
    officer: { suit: 0x5a6040, suit2: 0x40482c, pants: 0x505434, skin: 0xd0a080, head: 'beret', hood: 0x3a2020, camo: true },
    duty: { suit: 0x2a2a2a, suit2: 0x6a1a14, pants: 0x222222, skin: 0xd0a080, head: 'helmet', hood: 0x222222, vest: 0x5a1a14 },
    trader: { suit: 0x6a6050, suit2: 0x504838, pants: 0x303030, skin: 0xe0b090, head: 'bald', fat: true },
    hostage: { suit: 0x5a5040, suit2: 0x40382a, pants: 0x3a3a3a, skin: 0xd8a888, head: 'bare', hair: 0x3a2a1a },
    ecolog: { suit: 0xc0a030, suit2: 0x8a7020, pants: 0xb09028, skin: 0xd8a888, head: 'gasmask', hood: 0xa08020 }
  };

  function buildHead(m, L) {
    const skin = rgb(L.skin), dark = rgb(0x151515), hood = rgb(L.hood || 0x303030);
    m.cbox(0, 0.13, 0, 0.1, 0.12, 0.11, skin);
    m.cbox(0, 0.02, 0.01, 0.06, 0.04, 0.06, skin);
    if (L.head !== 'gasmask') {
      m.cbox(0.045, 0.15, 0.108, 0.018, 0.012, 0.004, dark); m.cbox(-0.045, 0.15, 0.108, 0.018, 0.012, 0.004, dark);
      m.cbox(0, 0.11, 0.115, 0.014, 0.03, 0.012, rgb(L.skin - 0x101010));
      m.cbox(0, 0.065, 0.108, 0.035, 0.006, 0.004, rgb(0x6a3030));
    }
    switch (L.head) {
      case 'hood': m.cbox(0, 0.17, -0.015, 0.125, 0.12, 0.125, hood); m.cbox(0, 0.28, -0.02, 0.1, 0.02, 0.1, hood); m.cbox(0, 0.1, -0.08, 0.13, 0.14, 0.06, hood); break;
      case 'cap': m.cbox(0, 0.245, 0, 0.108, 0.03, 0.115, hood); m.cbox(0, 0.225, 0.13, 0.08, 0.008, 0.05, hood); break;
      case 'helmet': m.sphere(0, 0.19, 0, 0.13, 0.1, 0.14, 8, 4, hood); m.cbox(0, 0.1, 0.02, 0.105, 0.1, 0.1, rgb(0x2a2a24)); m.cbox(0, 0.15, 0.108, 0.07, 0.02, 0.005, skin); break;
      case 'beret': m.cbox(0.02, 0.25, 0, 0.11, 0.03, 0.12, hood); break;
      case 'gasmask': m.cbox(0, 0.15, 0, 0.115, 0.135, 0.12, rgb(0x3a3a34)); m.cbox(0.045, 0.16, 0.118, 0.03, 0.03, 0.01, rgb(0x90a0a0)); m.cbox(-0.045, 0.16, 0.118, 0.03, 0.03, 0.01, rgb(0x90a0a0)); m.cyl(0, 0.03, 0.12, 0.045, 0.04, 0.09, 8, rgb(0x2a2a26)); m.cbox(0, 0.18, -0.03, 0.13, 0.13, 0.11, hood); break;
      case 'bald': m.cbox(0, 0.24, 0, 0.098, 0.02, 0.105, skin); if (L.fat) m.cbox(0, 0.03, 0.04, 0.09, 0.05, 0.07, skin); break;
      case 'bare': m.cbox(0, 0.24, -0.01, 0.105, 0.03, 0.115, rgb(L.hair || 0x302018)); break;
      default: break;
    }
  }
  function humanParts(L) {
    const suit = rgb(L.suit), suit2 = rgb(L.suit2), pants = rgb(L.pants), boot = rgb(0x1a1612), glove = rgb(0x1e1e1c), skin = rgb(L.skin);
    const fat = L.fat ? 1.35 : 1;
    return [
      { n: 'hips', at: [0, 0.93, 0], build: m => { m.cbox(0, 0.04, 0, 0.17 * fat, 0.1, 0.11 * fat, pants); m.cbox(0, 0.1, 0, 0.175 * fat, 0.025, 0.115 * fat, rgb(0x2a2018)); } },
      { n: 'torso', p: 'hips', at: [0, 0.1, 0], build: m => {
        m.cbox(0, 0.28, 0, 0.2 * fat, 0.27, 0.12 * fat, suit);
        m.cbox(0, 0.5, 0, 0.21 * fat, 0.06, 0.13 * fat, suit2);
        if (L.vest) { m.cbox(0, 0.3, 0.01, 0.21 * fat, 0.19, 0.13 * fat, rgb(L.vest)); for (let i = -1; i <= 1; i++) m.cbox(i * 0.08, 0.2, 0.135, 0.035, 0.05, 0.02, rgb(L.vest - 0x080808)); }
        if (L.camo) for (let i = 0; i < 7; i++) m.cbox(((i * 37) % 30 - 15) / 100, 0.1 + ((i * 53) % 40) / 100, 0.123, 0.04, 0.03, 0.004, rgb(i % 2 ? 0x3a3a20 : 0x8a8050));
        if (L.stripes) { m.cbox(0, 0.3, 0.123, 0.012, 0.25, 0.004, rgb(0x505050)); }
        if (L.coat) { m.cbox(0, -0.12, 0, 0.21, 0.2, 0.125, suit); m.cbox(0.1, 0.36, 0.125, 0.06, 0.14, 0.01, rgb(0x0e0a08)); m.cbox(-0.1, 0.36, 0.125, 0.06, 0.14, 0.01, rgb(0x0e0a08)); }
        if (L.pack) { m.cbox(0, 0.3, -0.2, 0.16, 0.2, 0.09, rgb(L.pack)); m.cbox(0, 0.52, -0.2, 0.17, 0.04, 0.07, rgb(0x2a4a2a)); }
        if (L.fat) m.cbox(0, 0.18, 0.08, 0.2, 0.16, 0.08, suit);
      } },
      { n: 'head', p: 'torso', at: [0, 0.57, 0], build: m => buildHead(m, L) },
      { n: 'armUL', p: 'torso', at: [0.25 * fat, 0.5, 0], build: m => m.cbox(0, -0.14, 0, 0.058, 0.15, 0.058, suit) },
      { n: 'armLL', p: 'armUL', at: [0, -0.29, 0], build: m => { m.cbox(0, -0.12, 0, 0.052, 0.13, 0.052, suit); m.cbox(0, -0.28, 0, 0.045, 0.05, 0.04, L.head === 'bald' ? skin : glove); } },
      { n: 'armUR', p: 'torso', at: [-0.25 * fat, 0.5, 0], build: m => m.cbox(0, -0.14, 0, 0.058, 0.15, 0.058, suit) },
      { n: 'armLR', p: 'armUR', at: [0, -0.29, 0], build: m => { m.cbox(0, -0.12, 0, 0.052, 0.13, 0.052, suit); m.cbox(0, -0.28, 0, 0.045, 0.05, 0.04, L.head === 'bald' ? skin : glove); } },
      { n: 'legUL', p: 'hips', at: [0.1, 0, 0], build: m => m.cbox(0, -0.22, 0, 0.075, 0.23, 0.08, pants) },
      { n: 'legLL', p: 'legUL', at: [0, -0.44, 0], build: m => { m.cbox(0, -0.2, 0, 0.066, 0.21, 0.07, pants); m.cbox(0, -0.44, 0.04, 0.07, 0.05, 0.12, boot); } },
      { n: 'legUR', p: 'hips', at: [-0.1, 0, 0], build: m => m.cbox(0, -0.22, 0, 0.075, 0.23, 0.08, pants) },
      { n: 'legLR', p: 'legUR', at: [0, -0.44, 0], build: m => { m.cbox(0, -0.2, 0, 0.066, 0.21, 0.07, pants); m.cbox(0, -0.44, 0.04, 0.07, 0.05, 0.12, boot); } },
      { n: 'gun', p: 'torso', at: [-0.1, 0.36, 0.3], build: () => {} }
    ];
  }
  // a: { walk phase, move 0..1, run 0..1, crouch 0..1, aim 0..1, hold 'rifle'|'pistol'|'none', sit, lie, talk, recoil, t, look (pitch) }
  function humanPose(a) {
    const P = {}, w = a.walk || 0, mv = a.move || 0, run = a.run || 0, cr = a.crouch || 0, aim = a.aim || 0, t = a.t || 0;
    const sw = sin(w) * mv * (0.55 + run * 0.35), knee = Math.max(0, -sin(w + 0.9)) * mv * (0.7 + run * 0.5), knee2 = Math.max(0, sin(w + 0.9)) * mv * (0.7 + run * 0.5);
    const breathe = sin(t * 1.7) * 0.02;
    let hipsY = -Math.abs(sin(w)) * 0.03 * mv - cr * 0.38, lean = run * 0.25 + cr * 0.25;
    P.hips = [0, 0, 0, 0, hipsY, 0];
    P.legUL = [-sw - cr * 1.1, 0, 0]; P.legLL = [knee + cr * 1.9, 0, 0];
    P.legUR = [sw - cr * 1.1, 0, 0]; P.legLR = [knee2 + cr * 1.9, 0, 0];
    P.torso = [lean + breathe, 0, 0];
    P.head = [-lean * 0.8 - (a.look || 0) * 0.6, 0, 0];
    const rec = a.recoil || 0;
    if (a.hold === 'rifle') {
      // right hand on the grip, left hand forward on the handguard
      const up = aim * 0.25 - (1 - aim) * 0.35;
      P.armUR = [-1.1 - up - (a.look || 0) * 0.6 + rec * 0.15, 0.25, 0.2]; P.armLR = [-0.9 + aim * 0.25, 0, 0];
      P.armUL = [-1.35 - up - (a.look || 0) * 0.6 + rec * 0.15, -0.55, -0.1]; P.armLL = [-0.6 + aim * 0.2, 0, 0];
      P.gun = [-(a.look || 0) * 0.6 + rec * 0.1 + (1 - aim) * 0.7, 0, 0, 0, (1 - aim) * -0.12, 0];
    } else if (a.hold === 'pistol') {
      const up = aim;
      P.armUR = [-0.4 - up * 1.1 - (a.look || 0) * 0.6 + rec * 0.2, 0.1, 0.1]; P.armLR = [-0.4 + up * 0.35, 0, 0];
      P.armUL = [-0.3 - up * 1.0 - (a.look || 0) * 0.5, -0.5 * up, -0.1 * up]; P.armLL = [-0.3 + up * 0.2, 0, 0];
      P.gun = [-(a.look || 0) * 0.6 + (1 - up) * 1.1 + rec * 0.2, 0, 0, 0, -0.1 * (1 - up), -0.05 * (1 - up)];
    } else {
      const as = -sw * 0.8;
      P.armUR = [as, 0, 0.08]; P.armLR = [-0.25 - mv * 0.3, 0, 0];
      P.armUL = [-as, 0, -0.08]; P.armLL = [-0.25 - mv * 0.3, 0, 0];
      if (a.talk) { const g = sin(t * 3.1) * 0.3 * a.talk; P.armUR = [-0.5 + g, 0.3, 0.2]; P.armLR = [-1.0 - g, 0, 0]; }
    }
    if (a.sit) {
      const s = a.sit;
      P.hips = [0, 0, 0, 0, -0.52 * s, 0];
      P.legUL = [-1.45 * s, 0, 0.12 * s]; P.legLL = [1.5 * s, 0, 0]; P.legUR = [-1.45 * s, 0, -0.12 * s]; P.legLR = [1.5 * s, 0, 0];
      P.torso = [0.25 * s + breathe, 0, 0];
      if (a.hold === 'none') { P.armUR = [-0.7 * s, 0, 0.1]; P.armLR = [-1.0 * s, 0, 0]; P.armUL = [-0.7 * s, 0, -0.1]; P.armLL = [-1.0 * s, 0, 0]; }
      if (a.guitar) { P.armUR = [-0.6, 0.6, 0.2]; P.armLR = [-1.5, 0, 0]; P.armUL = [-0.9, -0.7, -0.2]; P.armLL = [-0.9 + sin(t * 6) * 0.1, 0, 0]; }
    }
    if (a.lie) {
      const s = a.lie;
      P.hips = [0, 0, 0, 0, -0.8 * s, 0];
      P.legUL = [-1.4 * s, 0, 0.2 * s]; P.legLL = [0.3 * s, 0, 0]; P.legUR = [-1.2 * s, 0, -0.1 * s]; P.legLR = [0.9 * s, 0, 0];
      P.torso = [-0.9 * s + breathe * 3, 0, 0]; P.head = [0.4 * s, 0, 0];
      P.armUR = [-0.3 * s, 0, 0.7 * s]; P.armLR = [-1.3 * s, 0, 0]; P.armUL = [-0.8 * s + sin(t * 1.5) * 0.3 * s, 0, -0.3 * s]; P.armLL = [-1.2 * s, 0, 0];
    }
    if (a.hands) { P.armUR = [-0.2, 0.5, 1.2]; P.armLR = [-1.6, 0, 0]; P.armUL = [-0.2, -0.5, -1.2]; P.armLL = [-1.6, 0, 0]; }
    return P;
  }

  // ================================================================ mutants
  const MODELS = {};
  function dogModel(col, col2, scale, pseudo) {
    const c = rgb(col), c2 = rgb(col2), nose = rgb(0x2a1a1a), teeth = rgb(0xe0d8c0);
    return {
      scale,
      parts: [
        { n: 'body', at: [0, 0.52, 0], build: m => { m.cbox(0, 0, 0, 0.16, 0.16, 0.42, c); m.cbox(0, 0.03, 0.2, 0.18, 0.18, 0.18, c2); if (pseudo) m.cbox(0, 0.17, 0.05, 0.1, 0.05, 0.35, c2); for (let i = 0; i < 5; i++) m.cbox(0.16, -0.02 + i * 0.03, -0.1 + i * 0.08, 0.005, 0.01, 0.03, rgb(0x803030)); } },
        { n: 'head', p: 'body', at: [0, 0.1, 0.42], build: m => { m.cbox(0, 0.02, 0.06, 0.11, 0.1, 0.1, c2); m.cbox(0, -0.02, 0.2, 0.065, 0.06, 0.1, c); m.cbox(0, 0.0, 0.3, 0.03, 0.025, 0.012, nose); m.cbox(0.08, 0.12, 0.02, 0.025, 0.06, 0.02, c); m.cbox(-0.08, 0.12, 0.02, 0.025, 0.06, 0.02, c); if (pseudo) { m.cbox(0.06, 0.05, 0.14, 0.015, 0.012, 0.005, rgb(0xffe060)); m.cbox(-0.06, 0.05, 0.14, 0.015, 0.012, 0.005, rgb(0xffe060)); } } },
        { n: 'jaw', p: 'head', at: [0, -0.07, 0.12], build: m => { m.cbox(0, -0.015, 0.07, 0.055, 0.02, 0.09, c); m.cbox(0, 0.01, 0.12, 0.05, 0.01, 0.04, teeth); } },
        { n: 'legFL', p: 'body', at: [0.1, -0.08, 0.32], build: m => m.cbox(0, -0.2, 0, 0.04, 0.22, 0.045, c) },
        { n: 'legFR', p: 'body', at: [-0.1, -0.08, 0.32], build: m => m.cbox(0, -0.2, 0, 0.04, 0.22, 0.045, c) },
        { n: 'legBL', p: 'body', at: [0.1, -0.08, -0.34], build: m => m.cbox(0, -0.2, 0, 0.045, 0.22, 0.05, c) },
        { n: 'legBR', p: 'body', at: [-0.1, -0.08, -0.34], build: m => m.cbox(0, -0.2, 0, 0.045, 0.22, 0.05, c) },
        { n: 'tail', p: 'body', at: [0, 0.06, -0.42], build: m => m.cbox(0, 0, -0.14, 0.022, 0.022, 0.15, c) }
      ],
      pose(a) {
        const w = a.walk || 0, mv = a.move || 0, run = a.run || 0, st = 0.5 + run * 0.4, P = {};
        const bite = a.attack || 0;
        P.body = [sin(w * 2) * 0.05 * run - (a.leap || 0) * 0.4, 0, 0, 0, Math.abs(sin(w)) * 0.05 * mv, 0];
        P.legFL = [sin(w) * st * mv - (a.leap || 0) * 0.8, 0, 0]; P.legBR = [sin(w) * st * mv + (a.leap || 0) * 0.8, 0, 0];
        P.legFR = [sin(w + (run > 0.5 ? 0.6 : PI)) * st * mv - (a.leap || 0) * 0.8, 0, 0]; P.legBL = [sin(w + (run > 0.5 ? 0.6 : PI)) * st * mv + (a.leap || 0) * 0.8, 0, 0];
        P.head = [-bite * 0.3 + sin((a.t || 0) * 2) * 0.05 + (a.sniff || 0) * 0.5, sin((a.t || 0) * 0.7) * 0.2 * (1 - mv), 0];
        P.jaw = [bite * 0.6 + (a.growl || 0) * 0.2 * (0.5 + 0.5 * sin((a.t || 0) * 30)), 0, 0];
        P.tail = [0.3 + sin((a.t || 0) * 8) * 0.2 * mv, sin((a.t || 0) * 5) * 0.4, 0];
        return P;
      }
    };
  }
  MODELS.dog = dogModel(0x8a6a58, 0x9a7a66, 1.0, false);
  MODELS.pseudodog = dogModel(0x8a7040, 0x6a5430, 1.4, true);
  MODELS.flesh = (() => {
    const c = rgb(0xc89a88), c2 = rgb(0xa87868), eye = rgb(0xe0d0a0), dark = rgb(0x301010);
    return {
      scale: 1,
      parts: [
        { n: 'body', at: [0, 0.75, 0], build: m => { m.sphere(0, 0, 0, 0.5, 0.42, 0.62, 10, 6, c); m.sphere(0.12, 0.2, -0.2, 0.22, 0.18, 0.25, 6, 4, c2); m.sphere(-0.2, 0.12, 0.1, 0.18, 0.16, 0.2, 6, 4, c2); } },
        { n: 'head', p: 'body', at: [0, 0.05, 0.55], build: m => { m.sphere(0, 0, 0.08, 0.26, 0.24, 0.22, 8, 5, c); m.cbox(0, -0.1, 0.26, 0.14, 0.03, 0.03, dark); m.sphere(0.12, 0.12, 0.22, 0.06, 0.06, 0.05, 6, 3, eye); m.sphere(-0.1, 0.16, 0.2, 0.05, 0.05, 0.05, 6, 3, eye); m.sphere(0.02, 0.2, 0.18, 0.045, 0.04, 0.04, 6, 3, eye); } },
        { n: 'legFL', p: 'body', at: [0.3, -0.25, 0.3], build: m => m.cbox(0, -0.2, 0, 0.07, 0.24, 0.07, c2) },
        { n: 'legFR', p: 'body', at: [-0.3, -0.25, 0.3], build: m => m.cbox(0, -0.2, 0, 0.07, 0.24, 0.07, c2) },
        { n: 'legB', p: 'body', at: [0.05, -0.28, -0.4], build: m => m.cbox(0, -0.18, 0, 0.09, 0.22, 0.09, c2) },
        { n: 'legB2', p: 'body', at: [-0.25, -0.28, -0.35], build: m => m.cbox(0, -0.17, 0, 0.06, 0.2, 0.06, c2) }
      ],
      pose(a) {
        const w = a.walk || 0, mv = a.move || 0, P = {};
        P.body = [0, sin(w) * 0.08 * mv, sin(w * 2) * 0.06 * mv, 0, Math.abs(sin(w)) * 0.06 * mv, 0];
        P.legFL = [sin(w) * 0.6 * mv, 0, 0]; P.legFR = [sin(w + PI) * 0.6 * mv, 0, 0]; P.legB = [sin(w + 1) * 0.5 * mv, 0, 0]; P.legB2 = [sin(w + 2.5) * 0.5 * mv, 0, 0.2];
        P.head = [-(a.attack || 0) * 0.5 + sin((a.t || 0) * 1.3) * 0.1, sin((a.t || 0) * 0.9) * 0.2, 0];
        return P;
      }
    };
  })();
  MODELS.boar = (() => {
    const c = rgb(0x4a3a30), c2 = rgb(0x3a2c22), tusk = rgb(0xe8e0c8), sn = rgb(0x6a4a40);
    return {
      scale: 1,
      parts: [
        { n: 'body', at: [0, 0.78, 0], build: m => { m.cbox(0, 0, 0, 0.36, 0.34, 0.7, c); m.cbox(0, 0.1, 0.35, 0.42, 0.38, 0.35, c2); m.cbox(0, 0.42, 0.1, 0.06, 0.08, 0.6, c2); } },
        { n: 'head', p: 'body', at: [0, 0.0, 0.72], build: m => { m.cbox(0, 0, 0.15, 0.24, 0.24, 0.22, c2); m.cbox(0, -0.08, 0.42, 0.13, 0.12, 0.12, c); m.cbox(0, -0.08, 0.55, 0.12, 0.1, 0.02, sn); m.cbox(0.14, -0.1, 0.45, 0.02, 0.1, 0.02, tusk); m.cbox(-0.14, -0.1, 0.45, 0.02, 0.1, 0.02, tusk); m.cbox(0.14, 0.02, 0.48, 0.02, 0.02, 0.06, tusk); m.cbox(-0.14, 0.02, 0.48, 0.02, 0.02, 0.06, tusk); m.cbox(0.1, 0.2, 0.1, 0.04, 0.08, 0.03, c); m.cbox(-0.1, 0.2, 0.1, 0.04, 0.08, 0.03, c); } },
        { n: 'legFL', p: 'body', at: [0.22, -0.28, 0.45], build: m => m.cbox(0, -0.2, 0, 0.08, 0.24, 0.08, c2) },
        { n: 'legFR', p: 'body', at: [-0.22, -0.28, 0.45], build: m => m.cbox(0, -0.2, 0, 0.08, 0.24, 0.08, c2) },
        { n: 'legBL', p: 'body', at: [0.22, -0.28, -0.5], build: m => m.cbox(0, -0.2, 0, 0.08, 0.24, 0.08, c2) },
        { n: 'legBR', p: 'body', at: [-0.22, -0.28, -0.5], build: m => m.cbox(0, -0.2, 0, 0.08, 0.24, 0.08, c2) }
      ],
      pose(a) {
        const w = a.walk || 0, mv = a.move || 0, P = {}, st = 0.45 + (a.run || 0) * 0.3;
        P.body = [0, 0, 0, 0, Math.abs(sin(w)) * 0.05 * mv, 0];
        P.legFL = [sin(w) * st * mv, 0, 0]; P.legBR = [sin(w) * st * mv, 0, 0]; P.legFR = [sin(w + PI) * st * mv, 0, 0]; P.legBL = [sin(w + PI) * st * mv, 0, 0];
        P.head = [0.25 * (a.charge || 0) - (a.attack || 0) * 0.6 + sin((a.t || 0) * 1.1) * 0.05, 0, 0];
        return P;
      }
    };
  })();
  MODELS.bloodsucker = (() => {
    const c = rgb(0x8a6a60), c2 = rgb(0x6a4a44), dark = rgb(0x301818), eye = rgb(0xffe080);
    return {
      scale: 1,
      parts: [
        { n: 'hips', at: [0, 1.0, 0], build: m => m.cbox(0, 0, 0, 0.18, 0.12, 0.12, c2) },
        { n: 'torso', p: 'hips', at: [0, 0.08, 0], build: m => { m.cbox(0, 0.3, 0.05, 0.24, 0.3, 0.15, c); for (let i = 0; i < 4; i++) m.cbox(0, 0.1 + i * 0.12, 0.2, 0.18, 0.02, 0.01, c2); } },
        { n: 'head', p: 'torso', at: [0, 0.62, 0.12], build: m => { m.cbox(0, 0.1, 0.02, 0.1, 0.13, 0.11, c); m.cbox(0.045, 0.15, 0.13, 0.02, 0.012, 0.005, eye); m.cbox(-0.045, 0.15, 0.13, 0.02, 0.012, 0.005, eye); for (let i = 0; i < 4; i++) m.cbox((i - 1.5) * 0.035, -0.07, 0.1, 0.014, 0.1, 0.014, dark); } },
        { n: 'armUL', p: 'torso', at: [0.28, 0.52, 0.05], build: m => m.cbox(0, -0.18, 0, 0.06, 0.2, 0.06, c) },
        { n: 'armLL', p: 'armUL', at: [0, -0.38, 0], build: m => { m.cbox(0, -0.18, 0, 0.05, 0.2, 0.05, c); for (let i = 0; i < 3; i++) m.cbox((i - 1) * 0.03, -0.42, 0.02, 0.01, 0.06, 0.01, dark); } },
        { n: 'armUR', p: 'torso', at: [-0.28, 0.52, 0.05], build: m => m.cbox(0, -0.18, 0, 0.06, 0.2, 0.06, c) },
        { n: 'armLR', p: 'armUR', at: [0, -0.38, 0], build: m => { m.cbox(0, -0.18, 0, 0.05, 0.2, 0.05, c); for (let i = 0; i < 3; i++) m.cbox((i - 1) * 0.03, -0.42, 0.02, 0.01, 0.06, 0.01, dark); } },
        { n: 'legUL', p: 'hips', at: [0.11, 0, 0], build: m => m.cbox(0, -0.24, 0, 0.08, 0.25, 0.08, c) },
        { n: 'legLL', p: 'legUL', at: [0, -0.48, 0], build: m => m.cbox(0, -0.24, 0.03, 0.07, 0.25, 0.08, c) },
        { n: 'legUR', p: 'hips', at: [-0.11, 0, 0], build: m => m.cbox(0, -0.24, 0, 0.08, 0.25, 0.08, c) },
        { n: 'legLR', p: 'legUR', at: [0, -0.48, 0], build: m => m.cbox(0, -0.24, 0.03, 0.07, 0.25, 0.08, c) }
      ],
      pose(a) {
        const w = a.walk || 0, mv = a.move || 0, P = {}, sw = sin(w) * mv * 0.7, atk = a.attack || 0;
        P.hips = [0, 0, 0, 0, -0.1, 0];
        P.torso = [0.5 + mv * 0.2, 0, 0]; P.head = [-0.5, sin((a.t || 0) * 0.8) * 0.3, 0];
        P.legUL = [-sw - 0.3, 0, 0]; P.legLL = [0.5 + Math.max(0, -sin(w)) * mv, 0, 0]; P.legUR = [sw - 0.3, 0, 0]; P.legLR = [0.5 + Math.max(0, sin(w)) * mv, 0, 0];
        P.armUL = [-0.4 + sw * 0.6 - atk * 1.4, 0, -0.2]; P.armLL = [-0.5 + atk * 0.4, 0, 0]; P.armUR = [-0.4 - sw * 0.6 - atk * 1.2, 0, 0.2]; P.armLR = [-0.5 + atk * 0.4, 0, 0];
        return P;
      }
    };
  })();
  const humanCache = {};
  S.humanModel = function (look) {
    if (humanCache[look]) return humanCache[look];
    const L = LOOKS[look] || LOOKS.loner;
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

  // ================================================================ weapons (barrel along -z, grip near origin)
  const METAL = rgb(0x2a2a2c), METAL2 = rgb(0x3c3c3e), WOOD = rgb(0x6a3a1c), WOOD2 = rgb(0x4a2812), BLACK = rgb(0x161616), PLUM = rgb(0x5a2418), ORANGE = rgb(0x7a3a14);
  // cylinder along -z starting at (x, y, z0)
  const barrel = (m, x, y, z0, r0, r1, len, n, c) => m.with(M4.rotX(M4.translate(M4.create(), x, y, z0), -Math.PI / 2), q => q.cyl(0, 0, 0, r0, r1, len, n, c, true));
  const GUNS = {
    knife(m) { m.cbox(0, 0.01, -0.12, 0.006, 0.022, 0.12, rgb(0xb8b8c0)); m.cbox(0, 0.0, 0.03, 0.014, 0.028, 0.05, BLACK); m.cbox(0, 0.01, -0.005, 0.022, 0.034, 0.006, METAL2); },
    pm(m) { m.cbox(0, 0.035, -0.06, 0.014, 0.022, 0.085, METAL); m.cbox(0, 0.01, -0.05, 0.012, 0.012, 0.07, METAL2); m.with(M4.rotX(M4.create(), -0.25), q => q.cbox(0, -0.05, 0.0, 0.013, 0.055, 0.022, rgb(0x3a2a20))); m.cbox(0, -0.01, -0.045, 0.004, 0.018, 0.018, METAL); m.cbox(0, 0.06, -0.14, 0.002, 0.004, 0.003, METAL2); },
    fort(m) { m.cbox(0, 0.036, -0.07, 0.015, 0.024, 0.095, BLACK); m.cbox(0, 0.01, -0.06, 0.013, 0.012, 0.08, METAL); m.with(M4.rotX(M4.create(), -0.22), q => q.cbox(0, -0.055, 0.0, 0.014, 0.06, 0.024, BLACK)); m.cbox(0, 0.062, -0.16, 0.002, 0.004, 0.003, METAL2); },
    obrez(m) { barrel(m, 0.018, 0.03, -0.02, 0.016, 0.016, 0.34, 7, METAL); barrel(m, -0.018, 0.03, -0.02, 0.016, 0.016, 0.34, 7, METAL); m.cbox(0, 0.01, -0.12, 0.03, 0.015, 0.12, WOOD); m.cbox(0, 0.02, 0.04, 0.03, 0.03, 0.06, METAL2); m.with(M4.rotX(M4.create(), -0.5), q => q.cbox(0, -0.07, 0.1, 0.022, 0.07, 0.03, WOOD2)); },
    toz(m) { barrel(m, 0.017, 0.03, -0.02, 0.015, 0.015, 0.62, 7, METAL); barrel(m, -0.017, 0.03, -0.02, 0.015, 0.015, 0.62, 7, METAL); m.cbox(0, 0.012, -0.18, 0.028, 0.014, 0.16, WOOD); m.cbox(0, 0.02, 0.04, 0.03, 0.03, 0.06, METAL2); m.with(M4.rotX(M4.create(), -0.12), q => { q.cbox(0, -0.02, 0.22, 0.024, 0.045, 0.16, WOOD); q.cbox(0, -0.035, 0.4, 0.026, 0.065, 0.03, WOOD2); }); },
    mp5(m) { m.cbox(0, 0.04, -0.02, 0.022, 0.035, 0.16, BLACK); m.cbox(0, 0.03, -0.24, 0.02, 0.025, 0.08, BLACK); barrel(m, 0, 0.04, -0.12, 0.009, 0.009, 0.24, 6, METAL); m.with(M4.rotX(M4.create(), 0.2), q => q.cbox(0, -0.07, -0.06, 0.012, 0.07, 0.018, METAL)); m.with(M4.rotX(M4.create(), -0.3), q => q.cbox(0, -0.05, 0.08, 0.015, 0.05, 0.02, BLACK)); m.cbox(0, 0.045, 0.2, 0.015, 0.02, 0.1, METAL2); m.cbox(0, 0.085, -0.02, 0.006, 0.012, 0.06, BLACK); m.cbox(0, 0.08, -0.25, 0.004, 0.012, 0.006, BLACK); },
    aks74u(m) { m.cbox(0, 0.04, 0, 0.022, 0.035, 0.14, METAL); m.cbox(0, 0.045, -0.2, 0.021, 0.03, 0.07, ORANGE); barrel(m, 0, 0.05, -0.12, 0.009, 0.009, 0.26, 6, METAL); barrel(m, 0, 0.05, -0.36, 0.016, 0.014, 0.07, 7, METAL2); m.with(M4.rotX(M4.create(), 0.35), q => q.cbox(0, -0.07, -0.05, 0.012, 0.075, 0.022, ORANGE)); m.with(M4.rotX(M4.create(), -0.35), q => q.cbox(0, -0.05, 0.07, 0.014, 0.05, 0.02, ORANGE)); m.cbox(0.018, 0.04, 0.22, 0.004, 0.012, 0.1, METAL2); m.cbox(-0.018, 0.04, 0.22, 0.004, 0.012, 0.1, METAL2); m.cbox(0, 0.04, 0.32, 0.022, 0.03, 0.006, METAL2); m.cbox(0, 0.083, 0.05, 0.012, 0.012, 0.012, METAL2); m.cbox(0, 0.085, -0.3, 0.003, 0.012, 0.004, METAL2); },
    ak74(m) { m.cbox(0, 0.04, 0, 0.022, 0.035, 0.16, METAL); m.cbox(0, 0.045, -0.24, 0.021, 0.03, 0.1, PLUM); barrel(m, 0, 0.055, -0.14, 0.009, 0.009, 0.46, 6, METAL); barrel(m, 0, 0.055, -0.58, 0.013, 0.013, 0.06, 7, METAL2); m.with(M4.rotX(M4.create(), 0.35), q => q.cbox(0, -0.075, -0.07, 0.012, 0.08, 0.022, ORANGE)); m.with(M4.rotX(M4.create(), -0.35), q => q.cbox(0, -0.05, 0.07, 0.014, 0.05, 0.02, PLUM)); m.with(M4.rotX(M4.create(), -0.1), q => { q.cbox(0, 0.02, 0.28, 0.022, 0.04, 0.14, PLUM); q.cbox(0, 0.01, 0.42, 0.024, 0.055, 0.012, BLACK); }); m.cbox(0, 0.085, -0.46, 0.003, 0.02, 0.004, METAL2); m.cbox(0, 0.083, -0.08, 0.01, 0.01, 0.02, METAL2); },
    f1(m) { m.sphere(0, 0, 0, 0.03, 0.04, 0.03, 8, 6, rgb(0x3a4a2a)); m.cbox(0, 0.045, 0, 0.01, 0.012, 0.01, METAL2); m.cbox(0.015, 0.03, 0, 0.005, 0.03, 0.01, METAL2); },
    rgd5(m) { m.sphere(0, 0, 0, 0.028, 0.036, 0.028, 8, 6, rgb(0x4a5a3a)); m.cbox(0, 0.04, 0, 0.01, 0.012, 0.01, METAL2); m.cbox(0.014, 0.027, 0, 0.005, 0.028, 0.01, METAL2); },
    bolt(m) { m.cyl(0, -0.02, 0, 0.007, 0.007, 0.05, 6, rgb(0x707070)); m.cyl(0, 0.03, 0, 0.013, 0.013, 0.01, 6, rgb(0x808080)); },
    binoc(m) { barrel(m, 0.035, 0.02, 0.06, 0.025, 0.028, 0.14, 8, BLACK); barrel(m, -0.035, 0.02, 0.06, 0.025, 0.028, 0.14, 8, BLACK); m.cbox(0, 0.02, -0.02, 0.03, 0.012, 0.03, METAL); },
    guitar(m) { m.sphere(0, 0, 0, 0.18, 0.22, 0.05, 10, 4, rgb(0x8a4a1a)); m.cbox(0, 0.4, 0, 0.025, 0.25, 0.012, WOOD2); m.cyl(0, 0.02, 0.04, 0.05, 0.05, 0.01, 10, BLACK); }
  };
  // weapon grip, sight height and muzzle in model space; view offsets in view space
  const VIEW_POS = {
    knife: { hip: [0.2, -0.2, -0.42], aim: [0.2, -0.2, -0.42], muzzle: [0, 0, -0.2] },
    pm: { hip: [0.15, -0.16, -0.42], aim: [0, -0.062, -0.34], muzzle: [0, 0.035, -0.16] },
    fort: { hip: [0.15, -0.16, -0.42], aim: [0, -0.064, -0.34], muzzle: [0, 0.036, -0.18] },
    obrez: { hip: [0.16, -0.19, -0.44], aim: [0, -0.052, -0.34], muzzle: [0, 0.03, -0.37] },
    toz: { hip: [0.16, -0.19, -0.42], aim: [0, -0.052, -0.3], muzzle: [0, 0.03, -0.65] },
    mp5: { hip: [0.16, -0.18, -0.44], aim: [0, -0.088, -0.26], muzzle: [0, 0.04, -0.37] },
    aks74u: { hip: [0.16, -0.18, -0.44], aim: [0, -0.088, -0.24], muzzle: [0, 0.05, -0.42] },
    ak74: { hip: [0.16, -0.19, -0.42], aim: [0, -0.09, -0.22], muzzle: [0, 0.055, -0.62] },
    f1: { hip: [0.17, -0.18, -0.4], aim: [0.17, -0.18, -0.4], muzzle: [0, 0, 0] },
    rgd5: { hip: [0.17, -0.18, -0.4], aim: [0.17, -0.18, -0.4], muzzle: [0, 0, 0] },
    bolt: { hip: [0.17, -0.16, -0.4], aim: [0.17, -0.16, -0.4], muzzle: [0, 0, 0] },
    binoc: { hip: [0, -0.14, -0.3], aim: [0, -0.02, -0.14], muzzle: [0, 0, 0] }
  };
  // first-person hands (sleeve colour from the worn suit) around a weapon
  function viewHands(m, w, sleeve) {
    const sl = rgb(sleeve), gl = rgb(0x1a1a18), sk = rgb(0xc89878);
    const arm = (x, y, z, rx, ry) => m.with(M4.rotY(M4.rotX(M4.translate(M4.create(), x, y, z), rx), ry), q => { q.cbox(0, -0.01, 0.1, 0.034, 0.034, 0.09, sl); q.cbox(0, 0, -0.02, 0.03, 0.026, 0.032, gl); q.cbox(0, 0.012, -0.065, 0.03, 0.015, 0.02, sk); });
    const pist = w === 'pm' || w === 'fort';
    if (w === 'knife' || w === 'f1' || w === 'rgd5' || w === 'bolt') { arm(0, -0.02, 0.04, 0.1, 0.1); return; }
    if (w === 'binoc') { arm(0.06, -0.02, 0.02, 0.2, -0.2); arm(-0.06, -0.02, 0.02, 0.2, 0.2); return; }
    arm(0, -0.03, 0.04, 0.35, 0.05);
    if (pist) arm(-0.03, -0.045, 0.03, 0.4, 0.35);
    else arm(-0.02, 0.0, -0.2, 0.3, 0.35);
  }
  S.GUNS = GUNS; S.VIEW_POS = VIEW_POS;
  S.viewModel = function (w, sleeve) { const m = new Mesh(); (GUNS[w] || GUNS.pm)(m); viewHands(m, w, sleeve); return m; };
  S.gunModel = function (w) { const m = new Mesh(); m.with(M4.rotY(M4.create(), PI), q => (GUNS[w] || GUNS.pm)(q)); return m; };

  // ================================================================ world items
  function itemMesh(id) {
    const D = S.DATA.ITEMS[id], m = new Mesh();
    if (!D) return m.cbox(0, 0.1, 0, 0.1, 0.1, 0.1, [1, 0, 1, 1]);
    const col = D.col ? rgb(parseInt(D.col.slice(1), 16)) : rgb(0x808080);
    switch (D.kind) {
      case 'weapon': if (GUNS[id]) { m.with(M4.scale(M4.rotZ(M4.translate(M4.create(), 0, 0.05, 0), PI / 2), 1.6), q => GUNS[id](q)); } break;
      case 'ammo': m.cbox(0, 0.05, 0, 0.09, 0.05, 0.06, col); m.cbox(0, 0.101, 0, 0.07, 0.002, 0.04, rgb(0xe0d8b0)); break;
      case 'grenade': m.with(M4.translate(M4.create(), 0, 0.05, 0), q => GUNS[id](q)); break;
      case 'med': m.cbox(0, 0.05, 0, 0.1, 0.05, 0.07, id === 'bandage' ? rgb(0xe8e8e0) : id === 'antirad' ? rgb(0x3080c0) : col); if (id !== 'bandage') m.cbox(0, 0.101, 0, 0.03, 0.002, 0.012, rgb(0xffffff)); break;
      case 'food': if (id === 'vodka' || id === 'energy') { m.cyl(0, 0, 0, 0.04, 0.04, 0.2, 8, id === 'vodka' ? rgb(0xc0d8d0) : rgb(0x30a030)); m.cyl(0, 0.2, 0, 0.015, 0.015, 0.06, 6, rgb(0xd0c040)); } else if (id === 'bread') m.sphere(0, 0.05, 0, 0.12, 0.06, 0.07, 8, 4, rgb(0xc08a40)); else if (id === 'sausage') m.cyl(0, 0.04, -0.1, 0.04, 0.04, 0.2, 8, rgb(0xa04040)); else m.cyl(0, 0, 0, 0.05, 0.05, 0.08, 10, rgb(0xa0a0a8)); break;
      case 'suit': m.cbox(0, 0.06, 0, 0.35, 0.06, 0.25, col); m.cbox(0, 0.1, 0.28, 0.12, 0.05, 0.05, col); break;
      case 'art': m.sphere(0, 0.15, 0, 0.1, 0.1, 0.1, 8, 6, col); for (let i = 0; i < 4; i++) m.sphere(Math.cos(i * 1.6) * 0.08, 0.15 + Math.sin(i * 2.1) * 0.06, Math.sin(i * 1.6) * 0.08, 0.04, 0.04, 0.04, 6, 4, col); break;
      case 'part': m.cbox(0, 0.04, 0, 0.12, 0.04, 0.05, col); break;
      case 'quest': case 'misc': if (id === 'guitar') m.with(M4.rotX(M4.translate(M4.create(), 0, 0.06, 0), -PI / 2), q => GUNS.guitar(q)); else m.cbox(0, 0.03, 0, 0.06, 0.03, 0.09, id === 'flash_nimble' ? rgb(0x3060c0) : rgb(0x303838)); break;
      default: m.cbox(0, 0.05, 0, 0.08, 0.05, 0.08, col);
    }
    return m;
  }
  S.itemMesh = itemMesh;

  // ================================================================ props: returns { tex: Mesh } in world space
  const W1 = [1, 1, 1, 1];
  function propMeshes(p) {
    const out = {}, get = t => out[t] || (out[t] = new Mesh());
    const root = M4.rotY(M4.translate(M4.create(), p.x, p.y, p.z), p.rot || 0);
    if (p.s && p.s !== 1) M4.scale(root, p.s);
    const put = (tex, fn) => get(tex).with(root, fn);
    const k = p.kind;
    switch (k) {
      case 'roof': {
        // gable roof around origin at wall top: w along x, d along z
        const w = p.w / 2, d = p.d / 2, rh = p.rh;
        const roofTex = p.tex || 'tin', gable = p.gable || 'planks';
        const r0 = M4.translate(M4.create(), p.x, p.y, p.z);
        if (p.alongX) {
          get(roofTex).with(r0, m => { m.poly4([-w, 0, -d], [w, 0, -d], [w, rh, 0], [-w, rh, 0], W1, [[0, d * 0.5], [w, d * 0.5], [w, 0], [0, 0]].map(q => [q[0], q[1]])); m.poly4([w, 0, d], [-w, 0, d], [-w, rh, 0], [w, rh, 0], W1, [[0, d * 0.5], [w, d * 0.5], [w, 0], [0, 0]]); });
          get(gable).with(r0, m => { m.tri([[w - 0.4, 0, -d + 0.4], [w - 0.4, 0, d - 0.4], [w - 0.4, rh - 0.1, 0]], [1, 0, 0], [[0, 1], [1, 1], [0.5, 0]], W1); m.tri([[-w + 0.4, 0, d - 0.4], [-w + 0.4, 0, -d + 0.4], [-w + 0.4, rh - 0.1, 0]], [-1, 0, 0], [[0, 1], [1, 1], [0.5, 0]], W1); });
        } else {
          get(roofTex).with(r0, m => { m.poly4([w, 0, -d], [w, 0, d], [0, rh, d], [0, rh, -d], W1, [[0, w * 0.5], [d, w * 0.5], [d, 0], [0, 0]]); m.poly4([-w, 0, d], [-w, 0, -d], [0, rh, -d], [0, rh, d], W1, [[0, w * 0.5], [d, w * 0.5], [d, 0], [0, 0]]); });
          get(gable).with(r0, m => { m.tri([[-w + 0.4, 0, d - 0.4], [w - 0.4, 0, d - 0.4], [0, rh - 0.1, d - 0.4]], [0, 0, 1], [[0, 1], [1, 1], [0.5, 0]], W1); m.tri([[w - 0.4, 0, -d + 0.4], [-w + 0.4, 0, -d + 0.4], [0, rh - 0.1, -d + 0.4]], [0, 0, -1], [[0, 1], [1, 1], [0.5, 0]], W1); });
        }
        break;
      }
      case 'fence': {
        const ax = p.ax, az = p.az, bx = p.bx, bz = p.bz, h = p.h, len = Math.hypot(bx - ax, bz - az), n = Math.ceil(len / 3);
        const ft = { concrete: 'fence', wood: 'planks', wire: 'wire' }[p.fkind] || 'fence';
        const m = get(ft);
        for (let i = 0; i < n; i++) {
          const t0 = i / n, t1 = (i + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
          const y0 = p.gy ? p.gy[i] : p.y, y1 = p.gy ? p.gy[i + 1] : p.y;
          const nx = -(z1 - z0), nz = x1 - x0, l = Math.hypot(nx, nz) || 1, seg = len / n;
          m.quad([[x0, y0 - 0.3, z0], [x1, y1 - 0.3, z1], [x1, y1 + h, z1], [x0, y0 + h, z0]], [nx / l, 0, nz / l], [[0, 1], [seg / 3, 1], [seg / 3, 0], [0, 0]], W1);
        }
        break;
      }
      case 'campfire':
        put('wood', m => { for (let i = 0; i < 5; i++) m.with(M4.rotZ(M4.rotY(M4.create(), i * 1.26), 0.5), q => q.cbox(0, 0.25, 0, 0.05, 0.3, 0.05, rgb(0x4a3020))); });
        put('concrete', m => { for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; m.cbox(Math.cos(a) * 0.55, 0.06, Math.sin(a) * 0.55, 0.12, 0.08, 0.1, rgb(0x707070)); } });
        break;
      case 'lamp': put('metal', m => { m.cbox(0, 0.05, 0, 0.12, 0.05, 0.12, rgb(0x303030)); m.cbox(0, -0.08, 0, 0.06, 0.08, 0.06, [1.5, 1.4, 1.0, 0]); }); break;
      case 'car': put('metal', m => {
        const c = rgb(p.col || 0x6a7a8a); m.cbox(0, 0.55, 0, 0.82, 0.3, 2.0, c); m.cbox(0, 1.05, -0.2, 0.75, 0.22, 1.0, c); m.cbox(0, 1.05, -0.2, 0.76, 0.18, 0.95, rgb(0x202830));
        for (const [x, z] of [[0.75, 1.3], [-0.75, 1.3], [0.75, -1.3], [-0.75, -1.3]]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.3, z), PI / 2), q => q.cyl(0, -0.1, 0, 0.3, 0.3, 0.2, 8, rgb(0x1a1a1a)));
        m.cbox(0.5, 0.6, 2.0, 0.12, 0.08, 0.02, rgb(0xc0c0a0)); m.cbox(-0.5, 0.6, 2.0, 0.12, 0.08, 0.02, rgb(0xc0c0a0));
      }); break;
      case 'uaz': put('metal', m => {
        const c = rgb(0x4a5a3a); m.cbox(0, 0.75, 0, 0.92, 0.4, 2.0, c); m.cbox(0, 1.45, -0.4, 0.9, 0.35, 1.4, rgb(0x3e4a30)); m.cbox(0, 1.4, 0.6, 0.88, 0.25, 0.02, rgb(0x203040));
        for (const [x, z] of [[0.85, 1.3], [-0.85, 1.3], [0.85, -1.3], [-0.85, -1.3]]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.4, z), PI / 2), q => q.cyl(0, -0.12, 0, 0.4, 0.4, 0.24, 8, rgb(0x1a1a1a)));
      }); break;
      case 'truck': put('rust', m => {
        const c = rgb(p.col || 0x5a6a4a); m.cbox(0, 1.1, 2.4, 1.2, 0.85, 1.1, c); m.cbox(0, 1.55, 2.9, 1.15, 0.45, 0.6, rgb(0x2a3440)); m.cbox(0, 0.7, -0.9, 1.2, 0.12, 2.6, rgb(0x3a3a34)); m.cbox(1.15, 1.3, -0.9, 0.06, 0.55, 2.6, rgb(0x5a5040)); m.cbox(-1.15, 1.3, -0.9, 0.06, 0.55, 2.6, rgb(0x5a5040)); m.cbox(0, 1.3, -3.45, 1.2, 0.55, 0.06, rgb(0x5a5040));
        for (const [x, z] of [[1.0, 2.6], [-1.0, 2.6], [1.0, -1.4], [-1.0, -1.4], [1.0, -2.6], [-1.0, -2.6]]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.5, z), PI / 2), q => q.cyl(0, -0.15, 0, 0.5, 0.5, 0.3, 8, rgb(0x1a1a1a)));
      }); break;
      case 'bus': put('rust', m => {
        const c = rgb(p.col || 0xb07a30); m.cbox(0, 1.55, 0, 1.25, 1.2, 5.2, c); m.cbox(0, 2.0, 0, 1.27, 0.45, 5.0, rgb(0x283038)); m.cbox(0, 2.8, 0, 1.2, 0.05, 5.1, rgb(0x8a6a40));
        for (const [x, z] of [[1.15, 3.5], [-1.15, 3.5], [1.15, -3.2], [-1.15, -3.2]]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.45, z), PI / 2), q => q.cyl(0, -0.12, 0, 0.45, 0.45, 0.25, 8, rgb(0x1a1a1a)));
      }); break;
      case 'btr': put('metal', m => {
        const c = rgb(0x4e5a3c); m.cbox(0, 1.2, 0, 1.4, 0.6, 3.6, c); m.cbox(0, 1.7, 1.2, 1.2, 0.25, 1.6, c); m.cyl(0, 1.9, -0.3, 0.5, 0.45, 0.4, 10, c); m.cyl(0, 2.1, -0.3, 0.05, 0.05, 1.8, 6, rgb(0x2a2a2a));
        m.with(M4.rotX(M4.translate(M4.create(), 0, 2.15, -0.3), PI / 2), q => q.cyl(0, 0, 0, 0.06, 0.05, 1.6, 6, rgb(0x2a2a2a)));
        for (let i = 0; i < 4; i++) for (const x of [1.3, -1.3]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.55, -2.4 + i * 1.6), PI / 2), q => q.cyl(0, -0.2, 0, 0.55, 0.55, 0.35, 10, rgb(0x1a1a1a)));
      }); break;
      case 'tank': put('rust', m => {
        const c = rgb(0x4a4a34); m.cbox(0, 0.8, 0, 1.8, 0.5, 3.4, c); m.cbox(0, 0.45, 0, 1.9, 0.4, 3.3, rgb(0x2a2a24)); m.cyl(0, 1.3, -0.3, 1.2, 1.0, 0.6, 12, c);
        m.with(M4.rotX(M4.translate(M4.create(), 0, 1.65, 0.3), PI / 2 - 0.1), q => q.cyl(0, 0, 0, 0.1, 0.09, 3.4, 8, c));
      }); break;
      case 'heli': put('rust', m => {
        const c = rgb(0x4e5a44); m.cbox(0, 1.6, 1.2, 1.3, 1.3, 3.2, c); m.cbox(0, 1.9, 4.2, 1.1, 1.0, 0.6, rgb(0x283440)); m.cyl(0, 1.6, -2.0, 0.6, 0.25, 6.0, 8, c, false); m.with(M4.rotX(M4.translate(M4.create(), 0, 1.6, -2.0), -PI / 2), q => q.cyl(0, 0, 0, 0.5, 0.18, 5.5, 8, c, false));
        m.cbox(0, 3.0, 1.0, 0.6, 0.3, 1.4, c); m.cbox(0, 3.35, 1.0, 5.2, 0.04, 0.2, rgb(0x2a2a2a)); m.with(M4.rotY(M4.translate(M4.create(), 0, 3.36, 1.0), 1.2), q => q.cbox(0, 0, 0, 4.4, 0.04, 0.18, rgb(0x2a2a2a)));
        m.cbox(0, 0.3, 1.2, 1.0, 0.3, 2.4, rgb(0x2a2a24));
      }); break;
      case 'tractor': put('rust', m => {
        const c = rgb(0x3a5a8a); m.cbox(0, 1.2, 0.8, 0.6, 0.5, 1.0, c); m.cbox(0, 1.8, -0.6, 0.8, 0.8, 0.7, rgb(0x2a3440));
        m.with(M4.rotZ(M4.translate(M4.create(), 0.85, 0.9, -0.8), PI / 2), q => q.cyl(0, -0.2, 0, 0.9, 0.9, 0.4, 10, rgb(0x1a1a1a))); m.with(M4.rotZ(M4.translate(M4.create(), -0.85, 0.9, -0.8), PI / 2), q => q.cyl(0, -0.2, 0, 0.9, 0.9, 0.4, 10, rgb(0x1a1a1a)));
        m.with(M4.rotZ(M4.translate(M4.create(), 0.7, 0.5, 1.4), PI / 2), q => q.cyl(0, -0.15, 0, 0.5, 0.5, 0.3, 8, rgb(0x1a1a1a))); m.with(M4.rotZ(M4.translate(M4.create(), -0.7, 0.5, 1.4), PI / 2), q => q.cyl(0, -0.15, 0, 0.5, 0.5, 0.3, 8, rgb(0x1a1a1a)));
      }); break;
      case 'wagon': put('rust', m => {
        const c = rgb(p.col || 0x6a3a28); m.cbox(0, 2.3, 0, 1.5, 1.4, 7.0, c); m.cbox(0, 3.75, 0, 1.45, 0.08, 6.9, rgb(0x4a2a1a)); m.cbox(1.51, 2.2, 0, 0.02, 1.1, 1.2, rgb(0x3a2418));
        for (const z of [-5, -3.8, 3.8, 5]) for (const x of [1.0, -1.0]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.45, z), PI / 2), q => q.cyl(0, -0.08, 0, 0.45, 0.45, 0.16, 8, rgb(0x2a2a2a)));
        m.cbox(0, 0.85, 0, 1.3, 0.1, 6.5, rgb(0x2a2a2a));
      }); break;
      case 'cistern': put('rust', m => { const c = rgb(0x3a3a3a); m.with(M4.rotX(M4.translate(M4.create(), 0, 2.2, -5), PI / 2), q => q.cyl(0, 0, 0, 1.4, 1.4, 10, 12, c)); m.cbox(0, 0.85, 0, 1.3, 0.1, 5.5, rgb(0x2a2a2a)); for (const z of [-4, 4]) for (const x of [1, -1]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.45, z), PI / 2), q => q.cyl(0, -0.08, 0, 0.45, 0.45, 0.16, 8, rgb(0x2a2a2a))); }); break;
      case 'pylon': put('metal', m => {
        const c = rgb(0x5a5a58), h = 22;
        for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) m.with(M4.create(), q => { for (let i = 0; i < 8; i++) { const t0 = i / 8, t1 = (i + 1) / 8, r0 = 2.5 * (1 - t0 * 0.8), r1 = 2.5 * (1 - t1 * 0.8); q.poly4([sx * r0, t0 * h, sz * r0], [sx * r1, t1 * h, sz * r1], [sx * r1 + 0.15 * sx, t1 * h, sz * r1], [sx * r0 + 0.15 * sx, t0 * h, sz * r0], c); } });
        m.cbox(0, h - 3, 0, 5, 0.15, 0.2, c); m.cbox(0, h - 6, 0, 4, 0.15, 0.2, c); for (let i = 1; i < 7; i++) m.cbox(0, i * 3, 0, 2.5 * (1 - i / 8 * 0.8), 0.06, 0.06, c);
      }); break;
      case 'pole': put('wood', m => { m.cyl(0, 0, 0, 0.13, 0.1, 8, 6, rgb(0x5a4a3a)); m.cbox(0, 7.5, 0, 0.9, 0.06, 0.06, rgb(0x4a3a2a)); }); break;
      case 'streetlamp': put('metal', m => { m.cyl(0, 0, 0, 0.1, 0.07, 7, 6, rgb(0x505050)); m.cbox(0, 7, 0.6, 0.06, 0.06, 0.7, rgb(0x505050)); m.cbox(0, 6.9, 1.2, 0.15, 0.08, 0.25, rgb(0x303030)); }); break;
      case 'watertower': put('rust', m => { m.cyl(0, 0, 0, 1.2, 1.2, 12, 10, rgb(0x6a4030)); m.cyl(0, 12, 0, 2.6, 2.6, 4, 12, rgb(0x7a4a34)); m.cyl(0, 16, 0, 2.6, 0.2, 1.2, 12, rgb(0x5a3a2a)); }); break;
      case 'barrel': put('rust', m => m.cyl(0, 0, 0, 0.3, 0.3, 0.9, 10, rgb(p.col || 0x3a5a3a))); break;
      case 'barrels': put('rust', m => { m.cyl(0, 0, 0, 0.3, 0.3, 0.9, 10, rgb(0x3a5a3a)); m.cyl(0.65, 0, 0.1, 0.3, 0.3, 0.9, 10, rgb(0x6a3020)); m.cyl(0.3, 0, 0.62, 0.3, 0.3, 0.9, 10, rgb(0x7a7a30)); m.with(M4.rotX(M4.translate(M4.create(), -0.7, 0.3, 0), PI / 2), q => q.cyl(0, -0.45, 0, 0.3, 0.3, 0.9, 10, rgb(0x2a4a5a))); }); break;
      case 'crate': put('planks', m => m.cbox(0, 0.45 * (p.cs || 1), 0, 0.45 * (p.cs || 1), 0.45 * (p.cs || 1), 0.45 * (p.cs || 1), rgb(0x9a8a60))); break;
      case 'crates': put('planks', m => { m.cbox(0, 0.45, 0, 0.45, 0.45, 0.45, rgb(0x9a8a60)); m.cbox(0.95, 0.4, 0.1, 0.4, 0.4, 0.4, rgb(0x8a7a50)); m.cbox(0.4, 1.25, 0.05, 0.38, 0.38, 0.38, rgb(0xa09060)); }); break;
      case 'sandbags': put('cloth', m => { const len = p.len || 3; for (let r = 0; r < 3; r++) for (let i = 0; i < len / 0.6; i++) m.sphere(-len / 2 + 0.3 + i * 0.6 + (r % 2) * 0.3, 0.13 + r * 0.24, 0, 0.32, 0.13, 0.22, 6, 3, rgb(0x8a7a58)); }); break;
      case 'barrier': put('metal', m => { m.cbox(0, 0.5, 0, 0.2, 0.5, 0.2, rgb(0x505050)); m.with(M4.translate(M4.create(), 0, 1.0, 0), q => { for (let i = 0; i < 8; i++) q.cbox(-0.5 - i * 0.6, 0, 0, 0.3, 0.05, 0.05, rgb(i % 2 ? 0xc02020 : 0xe0e0e0)); }); }); break;
      case 'blocks': put('concrete', m => { m.cbox(0, 0.45, 0, 1.0, 0.45, 0.45, rgb(0xa0a098)); }); break;
      case 'pipe': put('rust', m => m.with(M4.rotX(M4.create(), PI / 2), q => q.cyl(0, -(p.len || 8) / 2, -(p.r || 0.5), p.r || 0.5, p.r || 0.5, p.len || 8, 10, rgb(0x6a5040), false))); break;
      case 'tires': put('rust', m => { for (let i = 0; i < 4; i++) m.cyl(0, i * 0.25, 0, 0.45, 0.45, 0.24, 10, rgb(0x1a1a1a)); }); break;
      case 'junk': put('garbage', m => { const r = S.RNG((p.x * 13 + p.z * 7) | 0); for (let i = 0; i < 9; i++) m.with(M4.rotY(M4.translate(M4.create(), r.range(-1.6, 1.6), 0, r.range(-1.6, 1.6)), r() * 6), q => q.cbox(0, 0.2, 0, r.range(0.2, 0.7), r.range(0.1, 0.4), r.range(0.2, 0.7), rgb([0x5a4a3a, 0x3a4a5a, 0x6a6a6a, 0x5a3a2a][i % 4]))); }); break;
      case 'bench': put('planks', m => { m.cbox(0, 0.45, 0, 0.8, 0.04, 0.2, rgb(0x7a5a3a)); m.cbox(0.7, 0.22, 0, 0.05, 0.22, 0.18, rgb(0x4a3a2a)); m.cbox(-0.7, 0.22, 0, 0.05, 0.22, 0.18, rgb(0x4a3a2a)); }); break;
      case 'log': put('bark', m => m.with(M4.rotZ(M4.create(), PI / 2), q => q.cyl(0, -(p.len || 2) / 2, -0.2, 0.2, 0.2, p.len || 2, 7, rgb(0xa09080)))); break;
      case 'table': put('planks', m => { m.cbox(0, 0.78, 0, p.w || 0.8, 0.04, p.d || 0.5, rgb(0x7a5a3a)); for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) m.cbox(x * ((p.w || 0.8) - 0.06), 0.38, z * ((p.d || 0.5) - 0.06), 0.04, 0.38, 0.04, rgb(0x5a4028)); }); break;
      case 'counter': put('planks', m => { m.cbox(0, 0.55, 0, p.w || 1.6, 0.55, 0.35, rgb(0x6a4a2a)); m.cbox(0, 1.12, 0, (p.w || 1.6) + 0.05, 0.03, 0.4, rgb(0x8a6a40)); }); break;
      case 'shelf': put('planks', m => { m.cbox(0, 1.0, 0, 0.9, 1.0, 0.03, rgb(0x5a4028)); for (let i = 0; i < 4; i++) m.cbox(0, 0.1 + i * 0.6, 0.2, 0.9, 0.02, 0.2, rgb(0x6a4a30)); for (let i = 0; i < 9; i++) m.cbox(-0.7 + (i % 5) * 0.35, 0.25 + Math.floor(i / 5) * 0.6, 0.2, 0.1, 0.13, 0.1, rgb([0x4a6a3a, 0xa04030, 0x3a5a8a, 0xc0a040][i % 4])); }); break;
      case 'bed': put('cloth', m => { m.cbox(0, 0.3, 0, 0.45, 0.1, 1.0, rgb(0x5a6a5a)); m.cbox(0, 0.42, 0.75, 0.35, 0.05, 0.2, rgb(0xd0d0c0)); m.cbox(0, 0.1, 0, 0.47, 0.12, 1.02, rgb(0x505050)); }); break;
      case 'stove': put('metal', m => { m.cbox(0, 0.45, 0, 0.35, 0.45, 0.3, rgb(0x3a3a3a)); m.cyl(0.1, 0.9, 0, 0.08, 0.08, 1.8, 6, rgb(0x2a2a2a)); }); break;
      case 'radio': put('metal', m => { m.cbox(0, 0.15, 0, 0.25, 0.15, 0.12, rgb(0x4a3a2a)); m.cbox(0.1, 0.18, 0.121, 0.08, 0.08, 0.002, rgb(0xb0a070)); m.cyl(-0.18, 0.3, 0, 0.005, 0.005, 0.5, 4, rgb(0x999999)); }); break;
      case 'door': put('metal', m => m.cbox(0, 1.05, 0, p.w || 0.6, 1.05, 0.05, rgb(p.col || 0x3a4a3a))); break;
      case 'haystack': put('grass', m => m.sphere(0, 0.8, 0, 1.6, 1.3, 1.6, 8, 5, rgb(0xb0a050))); break;
      case 'well': put('planks', m => { m.cyl(0, 0, 0, 0.8, 0.8, 0.8, 10, rgb(0x6a5a4a)); m.cbox(0.7, 1.2, 0, 0.05, 0.9, 0.05, rgb(0x4a3a2a)); m.cbox(-0.7, 1.2, 0, 0.05, 0.9, 0.05, rgb(0x4a3a2a)); m.cbox(0, 2.1, 0, 0.9, 0.3, 0.6, rgb(0x5a4a30)); }); break;
      case 'antenna': put('metal', m => { m.cyl(0, 0, 0, 0.08, 0.04, p.h || 12, 5, rgb(0x707070)); for (let i = 1; i < 5; i++) m.cbox(0, (p.h || 12) * i / 5, 0, 0.6 - i * 0.1, 0.02, 0.02, rgb(0x707070)); }); break;
      case 'ladder': put('metal', m => { const h = p.h || 4; m.cbox(0.25, h / 2, 0, 0.03, h / 2, 0.03, rgb(0x505050)); m.cbox(-0.25, h / 2, 0, 0.03, h / 2, 0.03, rgb(0x505050)); for (let i = 0; i < h / 0.35; i++) m.cbox(0, 0.2 + i * 0.35, 0, 0.25, 0.015, 0.015, rgb(0x505050)); }); break;
      case 'cross': put('wood', m => { m.cbox(0, 0.8, 0, 0.05, 0.8, 0.05, rgb(0x4a3a2a)); m.cbox(0, 1.2, 0, 0.35, 0.04, 0.04, rgb(0x4a3a2a)); }); break;
      case 'mound': put('garbage', m => { const r = p.r || 6, h = p.h || 3; m.sphere(0, 0, 0, r, h, r * 0.8, 10, 5, rgb(0x6a6050)); }); break;
      case 'bridge': {
        // broken concrete railway bridge deck spanning along z
        put('concrete', m => { const L = p.len || 20; m.cbox(0, 0, 0, 2.6, 0.5, L / 2, rgb(0x8a8a84)); m.cbox(2.5, 0.8, 0, 0.12, 0.3, L / 2, rgb(0x6a6a64)); m.cbox(-2.5, 0.8, 0, 0.12, 0.3, L / 2, rgb(0x6a6a64)); });
        break;
      }
      case 'pillar': put('concrete', m => m.cbox(0, (p.h || 6) / 2, 0, p.w || 1.2, (p.h || 6) / 2, p.d || 1.2, rgb(0x8a8a84))); break;
      case 'bunkerdoor': put('metal', m => { m.cbox(0, 1.1, 0, 0.7, 1.1, 0.08, rgb(0x4a5a4a)); m.cbox(0.45, 1.1, 0.1, 0.05, 0.05, 0.05, rgb(0x999999)); }); break;
      case 'poster': put('sign', m => m.quad([[-0.4, 1.2, 0.02], [0.4, 1.2, 0.02], [0.4, 2.0, 0.02], [-0.4, 2.0, 0.02]], [0, 0, 1], [[0, 1], [1, 1], [1, 0], [0, 0]], W1)); break;
      case 'skeleton': put('cloth', m => { m.cbox(0, 0.08, 0, 0.18, 0.06, 0.35, rgb(0x4a4a3a)); m.cbox(0, 0.1, 0.45, 0.09, 0.08, 0.1, rgb(0xd0c8b0)); m.cbox(0.12, 0.05, -0.6, 0.06, 0.05, 0.3, rgb(0x3a3a3a)); m.cbox(-0.12, 0.05, -0.6, 0.06, 0.05, 0.3, rgb(0x3a3a3a)); }); break;
      default: put('concrete', m => m.cbox(0, 0.5, 0, 0.5, 0.5, 0.5, rgb(0xff00ff)));
    }
    return out;
  }
  S.propMeshes = propMeshes;

  // ================================================================ trees
  // returns { bark: Mesh, leaves_x: Mesh } in world space
  function treeMeshes(t, out) {
    const get = k => out[k] || (out[k] = new Mesh());
    const s = t.s, x = t.x, y = t.y, z = t.z, r = t.rot;
    const tint = 0.85 + ((Math.abs(x * 3.3 + z * 1.7) % 1) * 0.3), lc = [tint, tint, tint * 0.95, 1];
    switch (t.kind) {
      case 'birch': {
        get('birch').cyl(x, y - 0.3, z, 0.16 * s, 0.07 * s, 9 * s, 6, W1, false, 1, 0.3);
        const L = get('leaves');
        for (let i = 0; i < 3; i++) { const cy = y + (4 + i * 1.9) * s, w = (3.6 - i * 0.7) * s; L.cross(x + Math.sin(i * 2 + r) * 0.4, cy, z + Math.cos(i * 2 + r) * 0.4, w, w * 0.95, 3, lc, r + i); }
        break;
      }
      case 'pine': {
        get('bark').cyl(x, y - 0.3, z, 0.24 * s, 0.1 * s, 12 * s, 6, W1, false, 1, 0.3);
        const L = get('pine');
        for (let i = 0; i < 4; i++) { const cy = y + (4.5 + i * 2) * s, w = (4.2 - i * 0.9) * s; L.cross(x, cy, z, w, 2.6 * s, 3, lc, r + i * 0.7); }
        break;
      }
      case 'willow': {
        get('bark').cyl(x, y - 0.3, z, 0.35 * s, 0.2 * s, 5 * s, 6, W1, false, 1, 0.3);
        const L = get('leaves');
        for (let i = 0; i < 4; i++) { const a = r + i * 1.57; L.cross(x + Math.cos(a) * 1.2 * s, y + 3.5 * s, z + Math.sin(a) * 1.2 * s, 4.5 * s, 4.2 * s, 2, [lc[0] * 0.8, lc[1] * 0.9, lc[2] * 0.7, 1], a); }
        break;
      }
      case 'dead': {
        get('bark').cyl(x, y - 0.3, z, 0.22 * s, 0.06 * s, 8 * s, 5, [0.6, 0.6, 0.6, 1], false, 1, 0.3);
        const B = get('bark');
        for (let i = 0; i < 4; i++) B.with(M4.rotZ(M4.rotY(M4.translate(M4.create(), x, y + (3 + i * 1.2) * s, z), r + i * 1.9), 0.9), q => q.cyl(0, 0, 0, 0.07 * s, 0.02 * s, 2.4 * s, 4, [0.55, 0.55, 0.55, 1], false));
        break;
      }
      case 'bush': get('bush').cross(x, y - 0.2, z, 2.8 * s, 1.8 * s, 3, lc, r); break;
      case 'deadbush': get('deadbush').cross(x, y - 0.2, z, 2.4 * s, 1.5 * s, 3, lc, r); break;
      default: break;
    }
  }
  S.treeMeshes = treeMeshes;
  S.LOOKS = LOOKS; S.MODELS = MODELS;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Stalker98 = globalThis.Stalker98 || {});
