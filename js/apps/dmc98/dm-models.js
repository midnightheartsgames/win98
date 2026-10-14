(function (S) {
  'use strict';
  const { M4, rgb, clamp, lerp } = S;
  const PI = Math.PI, sin = Math.sin, cos = Math.cos;
  const G = (hex) => { const c = rgb(hex); c[3] = 0; return c; };

  const LOOKS = {
    nero: { coat: 0x283450, coat2: 0x1c2438, inner: 0x7a1a1a, shirt: 0x6a6a74, pants: 0x1c1c24, boots: 0x2a2018, skin: 0xe2bca2, hair: 0xdcdce8, hairStyle: 'nero', devil: true, coatLen: 0.62, sword: 'redqueen', gun: 'bluerose', sheath: 'redqueen' },
    dante: { coat: 0x961212, coat2: 0x6a0c0c, inner: 0x1a1a1a, shirt: 0x202020, pants: 0x3a3030, boots: 0x2a1810, skin: 0xe0b89c, hair: 0xf0f0f4, hairStyle: 'dante', coatLen: 0.72, sword: 'rebellion', gun: 'ivory', sheath: 'rebellion' },
    credo: { coat: 0xe6e6ea, coat2: 0xc8c8d0, inner: 0x2a4a9a, shirt: 0x2a4a9a, pants: 0xd8d8de, boots: 0x3a3a44, skin: 0xe0b89c, hair: 0x6a4a2a, hairStyle: 'short', coatLen: 0.5, sword: 'knight' },
    knight: { coat: 0xd8d8e0, coat2: 0xb8b8c4, inner: 0x2a4a9a, shirt: 0x2a4a9a, pants: 0xc8c8d0, boots: 0x3a3a44, skin: 0xe0b89c, hair: 0x4a3a2a, hairStyle: 'helmet', coatLen: 0.3, sword: 'knight' },
    kyrie: { coat: 0xeae6de, coat2: 0xd0ccc4, inner: 0x3a5aa0, shirt: 0xeae6de, pants: 0xeae6de, boots: 0x6a5a4a, skin: 0xf2cab4, hair: 0x8a4424, hairStyle: 'kyrie', dress: true, coatLen: 0 },
    sanctus: { coat: 0xf0e8d4, coat2: 0xd4b050, inner: 0xd4b050, shirt: 0xf0e8d4, pants: 0xf0e8d4, boots: 0x8a7040, skin: 0xd8b49c, hair: 0xf4f4f4, hairStyle: 'mitre', dress: true, beard: true, coatLen: 0 },
    agnusY: { coat: 0x2c2238, coat2: 0x1c1628, inner: 0x5a4a70, shirt: 0x3a2e48, pants: 0x2c2238, boots: 0x1a1420, skin: 0xd6c6b6, hair: 0xd6c6b6, hairStyle: 'bald', dress: true, glasses: true, coatLen: 0, sword: 'yamato' },
    agnus: { coat: 0x2c2238, coat2: 0x1c1628, inner: 0x5a4a70, shirt: 0x3a2e48, pants: 0x2c2238, boots: 0x1a1420, skin: 0xd6c6b6, hair: 0xd6c6b6, hairStyle: 'bald', dress: true, glasses: true, coatLen: 0 }
  };

  function hair(m, L) {
    const h = rgb(L.hair);
    switch (L.hairStyle) {
      case 'nero': m.cbox(0, 0.23, -0.01, 0.115, 0.05, 0.12, h); m.cbox(0, 0.17, -0.1, 0.11, 0.1, 0.035, h); for (let i = -2; i <= 2; i++) m.cbox(i * 0.042, 0.2 - Math.abs(i) * 0.01, 0.105, 0.022, 0.05, 0.02, h); m.cbox(0.1, 0.15, 0, 0.022, 0.08, 0.09, h); m.cbox(-0.1, 0.15, 0, 0.022, 0.08, 0.09, h); break;
      case 'dante': m.cbox(0, 0.23, -0.01, 0.12, 0.05, 0.125, h); m.cbox(0, 0.12, -0.11, 0.115, 0.14, 0.035, h); for (let i = -2; i <= 2; i++) m.cbox(i * 0.045, 0.16, 0.108, 0.024, 0.08, 0.02, h); m.cbox(0.105, 0.1, 0, 0.025, 0.14, 0.1, h); m.cbox(-0.105, 0.1, 0, 0.025, 0.14, 0.1, h); break;
      case 'kyrie': m.cbox(0, 0.23, -0.01, 0.118, 0.05, 0.125, h); m.cbox(0, 0.05, -0.1, 0.12, 0.22, 0.04, h); m.cbox(0.105, 0.08, -0.01, 0.028, 0.2, 0.1, h); m.cbox(-0.105, 0.08, -0.01, 0.028, 0.2, 0.1, h); m.cbox(0, 0.2, 0.1, 0.1, 0.04, 0.02, h); break;
      case 'short': m.cbox(0, 0.23, -0.01, 0.112, 0.04, 0.12, h); m.cbox(0, 0.15, -0.1, 0.108, 0.08, 0.03, h); break;
      case 'mitre': m.cbox(0, 0.3, 0, 0.1, 0.12, 0.08, rgb(0xf0e8d4)); m.cbox(0, 0.3, 0.082, 0.02, 0.12, 0.005, rgb(0xd4b050)); m.pyramid(0, 0.42, 0, 0.1, 0.12, rgb(0xf0e8d4)); break;
      case 'helmet': m.sphere(0, 0.17, 0, 0.13, 0.13, 0.14, 8, 5, rgb(0xd0d0d8)); m.cbox(0, 0.12, 0.12, 0.08, 0.012, 0.01, rgb(0x202028)); break;
      default: break;
    }
  }
  function head(m, L) {
    const skin = rgb(L.skin), dark = rgb(0x141414);
    m.cbox(0, 0.13, 0, 0.1, 0.12, 0.105, skin);
    m.cbox(0, 0.03, 0.02, 0.065, 0.04, 0.07, skin);
    m.cbox(0.042, 0.15, 0.104, 0.02, 0.012, 0.004, dark); m.cbox(-0.042, 0.15, 0.104, 0.02, 0.012, 0.004, dark);
    m.cbox(0, 0.115, 0.11, 0.013, 0.028, 0.012, skin);
    m.cbox(0, 0.07, 0.103, 0.03, 0.006, 0.004, rgb(0x8a4a40));
    if (L.glasses) { m.cbox(0.042, 0.15, 0.11, 0.032, 0.022, 0.004, rgb(0xd0d8e0)); m.cbox(-0.042, 0.15, 0.11, 0.032, 0.022, 0.004, rgb(0xd0d8e0)); }
    if (L.beard) m.cbox(0, 0.03, 0.08, 0.075, 0.07, 0.04, rgb(0xf0f0f0));
    hair(m, L);
  }
  function weapon(m, kind) {
    const steel = rgb(0xc4c6ce), dark = rgb(0x1a1a1e);
    switch (kind) {
      case 'redqueen':
        m.cbox(0, 0.02, 0, 0.03, 0.1, 0.03, dark);
        m.cbox(0, -0.12, 0.02, 0.06, 0.08, 0.1, rgb(0x8a1010)); m.cbox(0, -0.12, -0.07, 0.04, 0.05, 0.04, rgb(0x3a3a3e));
        m.cbox(0, -0.2, 0.02, 0.1, 0.03, 0.14, rgb(0x2a2a2e));
        m.cbox(0, -0.72, 0.03, 0.022, 0.5, 0.085, steel); m.cbox(0, -0.72, 0.1, 0.012, 0.5, 0.02, rgb(0xe8e8f0));
        m.cbox(0, -1.26, 0.03, 0.02, 0.04, 0.06, steel); m.cbox(0, -0.5, -0.05, 0.03, 0.1, 0.03, rgb(0x8a1010));
        break;
      case 'rebellion':
        m.cbox(0, 0.02, 0, 0.028, 0.12, 0.028, rgb(0x3a2a20)); m.cbox(0, -0.14, 0, 0.05, 0.05, 0.13, rgb(0x707078)); m.sphere(0, -0.16, 0, 0.05, 0.05, 0.05, 6, 4, rgb(0xd8d8d0));
        m.cbox(0, -0.78, 0, 0.02, 0.6, 0.075, steel); m.cbox(0, -1.42, 0, 0.018, 0.05, 0.04, steel);
        break;
      case 'knight':
        m.cbox(0, 0.02, 0, 0.025, 0.1, 0.025, rgb(0x2a3a6a)); m.cbox(0, -0.1, 0, 0.03, 0.02, 0.16, rgb(0xd0b050));
        m.cbox(0, -0.6, 0, 0.015, 0.48, 0.05, steel); break;
      case 'bluerose':
        m.cbox(0, -0.02, 0.04, 0.025, 0.05, 0.03, dark); m.cbox(0, -0.1, 0.02, 0.04, 0.05, 0.05, rgb(0x5a6a8a));
        m.cbox(0, -0.2, 0.035, 0.022, 0.09, 0.022, rgb(0x6a7a9a)); m.cbox(0, -0.2, -0.005, 0.022, 0.09, 0.022, rgb(0x6a7a9a)); break;
      case 'ivory': case 'ebony':
        m.cbox(0, -0.02, 0.03, 0.022, 0.05, 0.03, dark); m.cbox(0, -0.14, 0.015, 0.02, 0.12, 0.04, kind === 'ivory' ? rgb(0xd8d8d0) : rgb(0x202024)); break;
      case 'yamato':
        m.cbox(0, 0.02, 0, 0.022, 0.12, 0.022, rgb(0x1a1a2a)); m.cbox(0, -0.12, 0, 0.04, 0.008, 0.04, rgb(0xb09040));
        m.cbox(0, -0.72, 0.006, 0.008, 0.58, 0.03, rgb(0xe0e4f0)); break;
      default: break;
    }
  }
  function humanParts(L) {
    const coat = rgb(L.coat), coat2 = rgb(L.coat2), inner = rgb(L.inner), shirt = rgb(L.shirt), pants = rgb(L.pants), boots = rgb(L.boots), skin = rgb(L.skin);
    const dress = !!L.dress, dev = !!L.devil;
    const armCol = dev ? rgb(0x4a1812) : coat;
    const glow = G(0x3aa0ff), glowR = G(0xff4a20);
    const parts = [
      { n: 'hips', at: [0, 0.98, 0], build: m => { m.cbox(0, 0.03, 0, 0.16, 0.1, 0.1, pants); m.cbox(0, 0.1, 0, 0.165, 0.025, 0.105, rgb(0x3a2a1a)); if (dress) m.cyl(0, -0.86, 0, 0.36, 0.17, 0.95, 10, coat); } },
      { n: 'torso', p: 'hips', at: [0, 0.1, 0], build: m => {
        m.cbox(0, 0.26, 0, 0.18, 0.26, 0.11, dress ? coat : shirt);
        m.cbox(0, 0.48, 0, 0.21, 0.07, 0.125, coat);
        if (!dress) { m.cbox(0.11, 0.25, 0.1, 0.075, 0.25, 0.02, coat); m.cbox(-0.11, 0.25, 0.1, 0.075, 0.25, 0.02, coat); m.cbox(0, 0.25, -0.115, 0.18, 0.26, 0.012, coat2); m.cbox(0, 0.5, -0.14, 0.14, 0.06, 0.03, inner); }
        else { m.cbox(0, 0.36, 0.113, 0.06, 0.14, 0.004, inner); m.cbox(0, 0.02, 0, 0.19, 0.03, 0.12, inner); }
      } },
      { n: 'head', p: 'torso', at: [0, 0.56, 0], build: m => head(m, L) },
      { n: 'armUR', p: 'torso', at: [-0.235, 0.48, 0], build: m => { m.cbox(0, -0.14, 0, 0.06, 0.15, 0.06, armCol); if (dev) { m.cbox(0, -0.1, 0.061, 0.012, 0.1, 0.002, glow); m.cbox(-0.061, -0.18, 0, 0.002, 0.08, 0.012, glowR); } } },
      { n: 'armLR', p: 'armUR', at: [0, -0.29, 0], build: m => { m.cbox(0, -0.13, 0, dev ? 0.062 : 0.052, 0.14, dev ? 0.062 : 0.052, armCol); if (dev) { m.cbox(0, -0.12, 0.063, 0.014, 0.12, 0.002, glow); m.cbox(0.063, -0.15, 0, 0.002, 0.09, 0.014, glow); m.cbox(0, -0.29, 0, 0.065, 0.045, 0.06, rgb(0x5a1c14)); m.cbox(0, -0.29, 0.061, 0.03, 0.02, 0.002, glowR); } else m.cbox(0, -0.29, 0, 0.045, 0.045, 0.04, skin); } },
      { n: 'handR', p: 'armLR', at: [0, -0.3, 0], build: m => { if (L.sword) weapon(m, L.sword); } },
      { n: 'armUL', p: 'torso', at: [0.235, 0.48, 0], build: m => m.cbox(0, -0.14, 0, 0.06, 0.15, 0.06, coat) },
      { n: 'armLL', p: 'armUL', at: [0, -0.29, 0], build: m => { m.cbox(0, -0.12, 0, 0.052, 0.13, 0.052, dress ? coat : inner); m.cbox(0, -0.28, 0, 0.045, 0.045, 0.04, skin); } },
      { n: 'handL', p: 'armLL', at: [0, -0.3, 0], build: m => { if (L.gun) weapon(m, L.gun); } },
      { n: 'legUR', p: 'hips', at: [-0.095, -0.02, 0], build: m => { if (!dress) m.cbox(0, -0.22, 0, 0.074, 0.23, 0.08, pants); } },
      { n: 'legLR', p: 'legUR', at: [0, -0.44, 0], build: m => { if (!dress) m.cbox(0, -0.2, 0, 0.066, 0.21, 0.07, pants); m.cbox(0, -0.3, 0, 0.07, 0.15, 0.075, boots); m.cbox(0, -0.46, 0.05, 0.068, 0.04, 0.12, boots); } },
      { n: 'legUL', p: 'hips', at: [0.095, -0.02, 0], build: m => { if (!dress) m.cbox(0, -0.22, 0, 0.074, 0.23, 0.08, pants); } },
      { n: 'legLL', p: 'legUL', at: [0, -0.44, 0], build: m => { if (!dress) m.cbox(0, -0.2, 0, 0.066, 0.21, 0.07, pants); m.cbox(0, -0.3, 0, 0.07, 0.15, 0.075, boots); m.cbox(0, -0.46, 0.05, 0.068, 0.04, 0.12, boots); } },
      { n: 'coat', p: 'hips', at: [0, 0.08, -0.06], build: m => { if (L.coatLen > 0) { const l = L.coatLen; m.cbox(0.1, -l / 2, -0.06, 0.09, l / 2, 0.02, coat); m.cbox(-0.1, -l / 2, -0.06, 0.09, l / 2, 0.02, coat); m.cbox(0.19, -l / 2 + 0.05, 0.05, 0.02, l / 2 - 0.05, 0.1, coat2); m.cbox(-0.19, -l / 2 + 0.05, 0.05, 0.02, l / 2 - 0.05, 0.1, coat2); } } }
    ];
    if (L.sheath) parts.push({ n: 'sheath', p: 'torso', at: [0.06, 0.56, -0.19], build: m => m.with(M4.rotY(M4.rotZ(M4.create(), 0.45), PI / 2), q => weapon(q, L.sheath)) });
    return parts;
  }

  function scarecrowParts(leg, big) {
    const sack = rgb(big ? 0x6e5838 : 0x86704e), dark = rgb(0x3a2e1e), rope = rgb(0x5a4a30), blade = rgb(0xa8a8ae), rust = rgb(0x7a4a30), eye = G(0xffc040);
    return [
      { n: 'hips', at: [0, 0.9, 0], build: m => { m.cbox(0, 0.02, 0, 0.14, 0.12, 0.1, sack); m.cbox(0, 0.1, 0, 0.15, 0.02, 0.11, rope); } },
      { n: 'torso', p: 'hips', at: [0, 0.1, 0], build: m => { m.cbox(0, 0.26, 0.02, big ? 0.3 : 0.2, 0.28, big ? 0.26 : 0.15, sack); m.cbox(0, 0.3, 0.16, 0.012, 0.22, 0.01, dark); m.cbox(0, 0.42, 0, 0.21, 0.02, 0.16, rope); m.cbox(0, 0.14, 0, 0.2, 0.02, 0.155, rope); } },
      { n: 'head', p: 'torso', at: [0, 0.55, 0.04], build: m => { m.cbox(0, 0.12, 0, 0.12, 0.14, 0.12, sack); m.cbox(0, 0.26, 0, 0.05, 0.03, 0.05, rope); m.cbox(0.045, 0.14, 0.121, 0.02, 0.02, 0.003, eye); m.cbox(-0.045, 0.14, 0.121, 0.02, 0.02, 0.003, eye); for (let i = -2; i <= 2; i++) m.cbox(i * 0.025, 0.06, 0.122, 0.004, 0.02, 0.002, dark); } },
      { n: 'armUR', p: 'torso', at: [-0.22, 0.46, 0], build: m => m.cbox(0, -0.15, 0, 0.05, 0.16, 0.05, sack) },
      { n: 'armLR', p: 'armUR', at: [0, -0.3, 0], build: m => { if (leg) { m.cbox(0, -0.14, 0, 0.045, 0.15, 0.045, sack); return; } m.cbox(0, -0.05, 0, 0.05, 0.06, 0.05, rope); m.with(M4.rotX(M4.create(), 0.25), q => { q.cbox(0, -0.45, 0.04, 0.015, 0.42, 0.08, blade); q.cbox(0, -0.45, -0.03, 0.02, 0.4, 0.02, rust); }); } },
      { n: 'handR', p: 'armLR', at: [0, -0.3, 0], build: () => {} },
      { n: 'armUL', p: 'torso', at: [0.22, 0.46, 0], build: m => m.cbox(0, -0.15, 0, 0.05, 0.16, 0.05, sack) },
      { n: 'armLL', p: 'armUL', at: [0, -0.3, 0], build: m => { if (big) { m.with(M4.rotX(M4.create(), 0.25), q => q.cbox(0, -0.45, 0.04, 0.015, 0.42, 0.08, blade)); return; } m.cbox(0, -0.14, 0, 0.045, 0.15, 0.045, sack); } },
      { n: 'handL', p: 'armLL', at: [0, -0.3, 0], build: () => {} },
      { n: 'legUR', p: 'hips', at: [-0.09, -0.02, 0], build: m => m.cbox(0, -0.21, 0, 0.06, 0.22, 0.06, sack) },
      { n: 'legLR', p: 'legUR', at: [0, -0.42, 0], build: m => { if (leg) { m.cbox(0, -0.1, 0, 0.05, 0.1, 0.05, sack); m.cbox(0, -0.3, 0.1, 0.015, 0.2, 0.1, blade); } else { m.cbox(0, -0.2, 0, 0.055, 0.21, 0.055, sack); m.cbox(0, -0.43, 0.04, 0.06, 0.04, 0.1, dark); } } },
      { n: 'legUL', p: 'hips', at: [0.09, -0.02, 0], build: m => m.cbox(0, -0.21, 0, 0.06, 0.22, 0.06, sack) },
      { n: 'legLL', p: 'legUL', at: [0, -0.42, 0], build: m => { if (leg) { m.cbox(0, -0.1, 0, 0.05, 0.1, 0.05, sack); m.cbox(0, -0.3, 0.1, 0.015, 0.2, 0.1, blade); } else { m.cbox(0, -0.2, 0, 0.055, 0.21, 0.055, sack); m.cbox(0, -0.43, 0.04, 0.06, 0.04, 0.1, dark); } } },
      { n: 'coat', p: 'hips', at: [0, 0, 0], build: m => { for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; m.cbox(sin(a) * 0.14, -0.14, cos(a) * 0.1, 0.035, 0.12, 0.012, sack); } } }
    ];
  }

  function frostParts() {
    const body = rgb(0x86aac4), dark = rgb(0x4a6a86), ice = G(0xbfe8ff), claw = rgb(0xe8f8ff), eye = G(0x40f0ff);
    return [
      { n: 'hips', at: [0, 1.05, 0], build: m => m.cbox(0, 0.02, 0, 0.15, 0.11, 0.11, dark) },
      { n: 'torso', p: 'hips', at: [0, 0.1, 0], build: m => { m.cbox(0, 0.28, 0, 0.19, 0.3, 0.13, body); m.cbox(0, 0.32, 0.12, 0.12, 0.18, 0.02, rgb(0xa8c8e0)); for (let i = 0; i < 4; i++) m.with(M4.rotX(M4.translate(M4.create(), (i % 2 ? 0.08 : -0.08), 0.25 + i * 0.1, -0.14), -0.6), q => q.pyramid(0, 0, 0, 0.05, 0.28, ice)); } },
      { n: 'head', p: 'torso', at: [0, 0.6, 0.02], build: m => { m.cbox(0, 0.1, 0.03, 0.09, 0.1, 0.13, body); m.cbox(0.04, 0.12, 0.16, 0.02, 0.012, 0.004, eye); m.cbox(-0.04, 0.12, 0.16, 0.02, 0.012, 0.004, eye); m.with(M4.rotX(M4.translate(M4.create(), 0, 0.18, -0.02), -1.1), q => q.pyramid(0, 0, 0, 0.06, 0.42, ice)); } },
      { n: 'armUR', p: 'torso', at: [-0.24, 0.5, 0], build: m => m.cbox(0, -0.16, 0, 0.055, 0.17, 0.055, body) },
      { n: 'armLR', p: 'armUR', at: [0, -0.32, 0], build: m => { m.cbox(0, -0.15, 0, 0.05, 0.16, 0.05, body); for (const x of [-0.03, 0, 0.03]) m.cbox(x, -0.4, 0.02, 0.008, 0.12, 0.012, claw); } },
      { n: 'handR', p: 'armLR', at: [0, -0.3, 0], build: () => {} },
      { n: 'armUL', p: 'torso', at: [0.24, 0.5, 0], build: m => m.cbox(0, -0.16, 0, 0.055, 0.17, 0.055, body) },
      { n: 'armLL', p: 'armUL', at: [0, -0.32, 0], build: m => { m.cbox(0, -0.15, 0, 0.05, 0.16, 0.05, body); for (const x of [-0.03, 0, 0.03]) m.cbox(x, -0.4, 0.02, 0.008, 0.12, 0.012, claw); } },
      { n: 'handL', p: 'armLL', at: [0, -0.3, 0], build: () => {} },
      { n: 'legUR', p: 'hips', at: [-0.09, -0.02, 0], build: m => m.cbox(0, -0.24, 0, 0.07, 0.25, 0.07, body) },
      { n: 'legLR', p: 'legUR', at: [0, -0.48, 0], build: m => { m.cbox(0, -0.24, -0.04, 0.055, 0.26, 0.055, body); m.cbox(0, -0.52, 0.06, 0.06, 0.03, 0.13, dark); } },
      { n: 'legUL', p: 'hips', at: [0.09, -0.02, 0], build: m => m.cbox(0, -0.24, 0, 0.07, 0.25, 0.07, body) },
      { n: 'legLL', p: 'legUL', at: [0, -0.48, 0], build: m => { m.cbox(0, -0.24, -0.04, 0.055, 0.26, 0.055, body); m.cbox(0, -0.52, 0.06, 0.06, 0.03, 0.13, dark); } },
      { n: 'coat', p: 'hips', at: [0, 0, -0.1], build: m => { m.cbox(0, -0.05, -0.3, 0.05, 0.05, 0.3, body); m.cbox(0, -0.1, -0.75, 0.035, 0.035, 0.2, dark); m.pyramid(0, -0.08, -0.95, 0.04, 0.12, ice); } }
    ];
  }

  function angeloParts(credo) {
    const arm = rgb(credo ? 0xf2f2f8 : 0xe4e4ec), gold = rgb(0xd8b858), dark = rgb(0x2a2a3a), glow = G(credo ? 0xffe0a0 : 0x5aa0ff), steel = rgb(0xd0d4e0);
    return [
      { n: 'hips', at: [0, 1.1, 0], build: m => { m.cbox(0, 0.02, 0, 0.17, 0.12, 0.12, arm); m.cbox(0, -0.18, 0.1, 0.12, 0.14, 0.02, gold); m.cbox(0.13, -0.16, 0, 0.06, 0.16, 0.12, arm); m.cbox(-0.13, -0.16, 0, 0.06, 0.16, 0.12, arm); } },
      { n: 'torso', p: 'hips', at: [0, 0.1, 0], build: m => { m.cbox(0, 0.28, 0, 0.23, 0.3, 0.15, arm); m.cbox(0, 0.32, 0.152, 0.07, 0.18, 0.004, glow); m.cbox(0, 0.55, 0, 0.27, 0.05, 0.17, gold); m.cbox(0.3, 0.55, 0, 0.1, 0.07, 0.16, arm); m.cbox(-0.3, 0.55, 0, 0.1, 0.07, 0.16, arm); if (credo) { m.cbox(0, 0.3, -0.16, 0.1, 0.1, 0.02, gold); } } },
      { n: 'head', p: 'torso', at: [0, 0.6, 0], build: m => { m.cbox(0, 0.14, 0, 0.11, 0.14, 0.12, arm); m.cbox(0, 0.12, 0.121, 0.08, 0.015, 0.003, glow); m.cbox(0, 0.3, -0.02, 0.02, 0.06, 0.12, gold); if (credo) { m.with(M4.rotX(M4.translate(M4.create(), 0, 0.26, -0.06), -0.8), q => q.pyramid(0, 0, 0, 0.04, 0.35, gold)); } } },
      { n: 'armUR', p: 'torso', at: [-0.3, 0.5, 0], build: m => m.cbox(0, -0.15, 0, 0.07, 0.17, 0.07, arm) },
      { n: 'armLR', p: 'armUR', at: [0, -0.32, 0], build: m => { m.cbox(0, -0.14, 0, 0.065, 0.15, 0.065, arm); m.cbox(0, -0.3, 0, 0.055, 0.05, 0.055, dark); } },
      { n: 'handR', p: 'armLR', at: [0, -0.31, 0], build: m => { m.cbox(0, 0.3, 0, 0.022, 0.5, 0.022, steel); m.cbox(0, -0.1, 0, 0.022, 0.1, 0.022, gold); m.cbox(0, -0.55, 0, 0.012, 0.35, 0.06, steel); m.cbox(0, -0.2, 0, 0.1, 0.02, 0.03, gold); } },
      { n: 'armUL', p: 'torso', at: [0.3, 0.5, 0], build: m => m.cbox(0, -0.15, 0, 0.07, 0.17, 0.07, arm) },
      { n: 'armLL', p: 'armUL', at: [0, -0.32, 0], build: m => { m.cbox(0, -0.14, 0, 0.065, 0.15, 0.065, arm); m.cbox(0, -0.3, 0, 0.055, 0.05, 0.055, dark); } },
      { n: 'handL', p: 'armLL', at: [0, -0.2, 0.08], build: m => { m.cbox(0, -0.05, 0.05, 0.3, 0.42, 0.03, arm); m.cbox(0, -0.05, 0.085, 0.24, 0.35, 0.004, gold); m.cbox(0, -0.05, 0.09, 0.04, 0.25, 0.004, glow); } },
      { n: 'legUR', p: 'hips', at: [-0.1, -0.04, 0], build: m => m.cbox(0, -0.24, 0, 0.08, 0.26, 0.085, arm) },
      { n: 'legLR', p: 'legUR', at: [0, -0.5, 0], build: m => { m.cbox(0, -0.22, 0, 0.07, 0.24, 0.075, arm); m.cbox(0, -0.5, 0.06, 0.075, 0.05, 0.14, gold); } },
      { n: 'legUL', p: 'hips', at: [0.1, -0.04, 0], build: m => m.cbox(0, -0.24, 0, 0.08, 0.26, 0.085, arm) },
      { n: 'legLL', p: 'legUL', at: [0, -0.5, 0], build: m => { m.cbox(0, -0.22, 0, 0.07, 0.24, 0.075, arm); m.cbox(0, -0.5, 0.06, 0.075, 0.05, 0.14, gold); } },
      { n: 'coat', p: 'torso', at: [0, 0.45, -0.16], build: m => { if (credo) { for (const s of [-1, 1]) m.with(M4.rotZ(M4.rotY(M4.translate(M4.create(), s * 0.12, 0, 0), s * -0.5), s * 0.4), q => { q.cbox(s * 0.35, 0.1, -0.05, 0.35, 0.08, 0.02, rgb(0xeef2ff)); for (let i = 0; i < 5; i++) q.cbox(s * (0.15 + i * 0.12), -0.15 - i * 0.05, -0.05, 0.06, 0.25 + i * 0.03, 0.015, rgb(0xe0e8ff)); }); } else { for (const s of [-1, 1]) m.cbox(s * 0.14, 0.05, -0.02, 0.06, 0.2, 0.04, gold); } } }
    ];
  }

  function assaultParts() {
    const sc = rgb(0x4e5e42), belly = rgb(0x8a8a62), dark = rgb(0x2a3222), bone = rgb(0x8a7a5a), eye = G(0xffe040), claw = rgb(0xd8d0b8);
    return [
      { n: 'hips', at: [0, 0.85, 0], build: m => m.cbox(0, 0, 0, 0.15, 0.11, 0.12, sc) },
      { n: 'torso', p: 'hips', at: [0, 0.08, 0], build: m => { m.cbox(0, 0.22, 0.04, 0.19, 0.25, 0.15, sc); m.cbox(0, 0.2, 0.18, 0.12, 0.2, 0.02, belly); for (let i = 0; i < 5; i++) m.cbox(0, 0.1 + i * 0.09, -0.15, 0.03, 0.03, 0.03, bone); } },
      { n: 'head', p: 'torso', at: [0, 0.48, 0.12], build: m => { m.cbox(0, 0.05, 0.1, 0.09, 0.08, 0.17, sc); m.cbox(0, -0.02, 0.2, 0.075, 0.03, 0.1, belly); m.cbox(0.06, 0.09, 0.2, 0.016, 0.012, 0.01, eye); m.cbox(-0.06, 0.09, 0.2, 0.016, 0.012, 0.01, eye); m.cbox(0, 0.14, -0.02, 0.02, 0.04, 0.12, bone); } },
      { n: 'armUR', p: 'torso', at: [-0.22, 0.4, 0.04], build: m => m.cbox(0, -0.13, 0, 0.05, 0.14, 0.05, sc) },
      { n: 'armLR', p: 'armUR', at: [0, -0.27, 0], build: m => { m.cbox(0, -0.12, 0, 0.045, 0.13, 0.045, sc); for (const x of [-0.025, 0.025]) m.cbox(x, -0.33, 0.03, 0.008, 0.1, 0.012, claw); } },
      { n: 'handR', p: 'armLR', at: [0, -0.3, 0], build: () => {} },
      { n: 'armUL', p: 'torso', at: [0.22, 0.4, 0.04], build: m => m.cbox(0, -0.13, 0, 0.05, 0.14, 0.05, sc) },
      { n: 'armLL', p: 'armUL', at: [0, -0.27, 0], build: m => { m.cbox(0, -0.12, 0, 0.045, 0.13, 0.045, sc); m.cbox(0.06, -0.14, 0.02, 0.02, 0.22, 0.14, bone); m.cbox(0.075, -0.14, 0.02, 0.004, 0.16, 0.1, dark); } },
      { n: 'handL', p: 'armLL', at: [0, -0.3, 0], build: () => {} },
      { n: 'legUR', p: 'hips', at: [-0.1, -0.02, 0], build: m => m.cbox(0, -0.18, 0.04, 0.07, 0.2, 0.08, sc) },
      { n: 'legLR', p: 'legUR', at: [0, -0.38, 0.06], build: m => { m.cbox(0, -0.18, -0.06, 0.05, 0.2, 0.05, sc); m.cbox(0, -0.42, 0.04, 0.06, 0.03, 0.13, dark); } },
      { n: 'legUL', p: 'hips', at: [0.1, -0.02, 0], build: m => m.cbox(0, -0.18, 0.04, 0.07, 0.2, 0.08, sc) },
      { n: 'legLL', p: 'legUL', at: [0, -0.38, 0.06], build: m => { m.cbox(0, -0.18, -0.06, 0.05, 0.2, 0.05, sc); m.cbox(0, -0.42, 0.04, 0.06, 0.03, 0.13, dark); } },
      { n: 'coat', p: 'hips', at: [0, 0, -0.1], build: m => { m.cbox(0, -0.05, -0.3, 0.06, 0.05, 0.3, sc); m.cbox(0, -0.12, -0.75, 0.04, 0.035, 0.2, dark); } }
    ];
  }

  function mephistoParts() {
    const cloak = rgb(0x18121e), cl2 = rgb(0x2a1e30), bone = rgb(0x4a4050), core = G(0xff6a20), claw = rgb(0xc8c0b0), eye = G(0xff3020);
    return [
      { n: 'hips', at: [0, 1.2, 0], build: m => { m.cbox(0, 0, 0, 0.1, 0.1, 0.08, bone); for (let i = 0; i < 4; i++) m.cbox(0, -0.18 - i * 0.12, -0.02, 0.03, 0.05, 0.03, bone); } },
      { n: 'torso', p: 'hips', at: [0, 0.06, 0], build: m => { m.cbox(0, 0.25, 0, 0.16, 0.24, 0.11, bone); m.sphere(0, 0.28, 0.08, 0.09, 0.09, 0.06, 6, 4, core); } },
      { n: 'head', p: 'torso', at: [0, 0.52, 0.04], build: m => { m.cbox(0, 0.1, 0.04, 0.08, 0.1, 0.12, bone); m.cbox(0.035, 0.1, 0.161, 0.02, 0.014, 0.004, eye); m.cbox(-0.035, 0.1, 0.161, 0.02, 0.014, 0.004, eye); } },
      { n: 'armUR', p: 'torso', at: [-0.2, 0.44, 0], build: m => m.cbox(0, -0.16, 0, 0.035, 0.17, 0.035, bone) },
      { n: 'armLR', p: 'armUR', at: [0, -0.33, 0], build: m => { m.cbox(0, -0.14, 0, 0.03, 0.15, 0.03, bone); for (const x of [-0.04, 0, 0.04]) m.cbox(x, -0.42, 0.02, 0.01, 0.16, 0.012, claw); } },
      { n: 'handR', p: 'armLR', at: [0, -0.3, 0], build: () => {} },
      { n: 'armUL', p: 'torso', at: [0.2, 0.44, 0], build: m => m.cbox(0, -0.16, 0, 0.035, 0.17, 0.035, bone) },
      { n: 'armLL', p: 'armUL', at: [0, -0.33, 0], build: m => { m.cbox(0, -0.14, 0, 0.03, 0.15, 0.03, bone); for (const x of [-0.04, 0, 0.04]) m.cbox(x, -0.42, 0.02, 0.01, 0.16, 0.012, claw); } },
      { n: 'handL', p: 'armLL', at: [0, -0.3, 0], build: () => {} },
      { n: 'coat', p: 'torso', at: [0, 0.62, 0], build: m => { m.cyl(0, -1.35, 0, 0.55, 0.12, 1.4, 9, cloak, false); m.cyl(0, -1.35, 0, 0.5, 0.1, 1.3, 9, cl2, false); m.sphere(0, 0.05, -0.02, 0.18, 0.18, 0.2, 7, 4, cloak); for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; m.pyramid(sin(a) * 0.5, -1.35, cos(a) * 0.5, 0.1, -0.35, cloak); } } }
    ];
  }

  function gladiusParts() {
    const blade = G(0x9ad0ff), hilt = rgb(0x3a5aa0), gold = rgb(0xd0b060);
    return [{ n: 'hips', at: [0, 0, 0], build: m => { m.cbox(0, 0, 0.35, 0.012, 0.06, 0.45, blade); m.cbox(0, 0, -0.12, 0.02, 0.12, 0.03, gold); m.cbox(0, 0, -0.25, 0.02, 0.02, 0.12, hilt); m.cbox(0.04, 0, 0, 0.004, 0.14, 0.2, blade); m.cbox(-0.04, 0, 0, 0.004, 0.14, 0.2, blade); } }];
  }

  function berialParts() {
    const body = rgb(0x3a1a12), dark = rgb(0x1a0c08), lava = G(0xff5a14), lava2 = G(0xffa030), horn = rgb(0x2a2420), blade = rgb(0x4a2a1c);
    const leg = (n, at) => [
      { n: n + 'U', p: 'body', at, build: m => { m.cbox(0, -0.55, 0, 0.26, 0.6, 0.28, body); m.cbox(0, -0.55, 0.27, 0.06, 0.4, 0.02, lava); } },
      { n: n + 'L', p: n + 'U', at: [0, -1.1, 0], build: m => { m.cbox(0, -0.55, 0, 0.18, 0.6, 0.2, dark); m.cbox(0, -1.12, 0.05, 0.24, 0.1, 0.3, horn); } }
    ];
    return [
      { n: 'body', at: [0, 2.3, 0], build: m => { m.cbox(0, 0, 0, 0.95, 0.7, 1.8, body); m.cbox(0, 0.1, 0, 0.7, 0.2, 1.6, lava); m.cbox(0, 0.62, 0, 0.6, 0.12, 1.5, dark); m.cbox(0, 0.3, -1.9, 0.2, 0.2, 0.4, dark); for (let i = 0; i < 5; i++) m.pyramid(0, 0.7, -1.2 + i * 0.5, 0.18, 0.5, lava2); } },
      ...leg('fl', [0.6, -0.4, 1.3]), ...leg('fr', [-0.6, -0.4, 1.3]), ...leg('bl', [0.6, -0.4, -1.3]), ...leg('br', [-0.6, -0.4, -1.3]),
      { n: 'torso', p: 'body', at: [0, 0.6, 1.25], build: m => { m.cbox(0, 0.9, 0, 0.75, 0.95, 0.5, body); m.cbox(0, 1.0, 0.45, 0.45, 0.55, 0.06, lava); m.cbox(0, 1.8, 0, 0.95, 0.2, 0.55, dark); } },
      { n: 'head', p: 'torso', at: [0, 2, 0.1], build: m => { m.cbox(0, 0.35, 0.1, 0.35, 0.4, 0.4, dark); m.cbox(0.16, 0.42, 0.51, 0.08, 0.05, 0.004, lava2); m.cbox(-0.16, 0.42, 0.51, 0.08, 0.05, 0.004, lava2); m.cbox(0, 0.15, 0.51, 0.2, 0.06, 0.004, lava); for (const s of [-1, 1]) m.with(M4.rotZ(M4.translate(M4.create(), s * 0.3, 0.65, 0), s * -0.7), q => q.pyramid(0, 0, 0, 0.1, 0.9, horn)); for (let i = 0; i < 6; i++) m.pyramid((i - 2.5) * 0.12, 0.72, -0.2, 0.1, 0.6 + (i % 2) * 0.3, lava2); } },
      { n: 'armUR', p: 'torso', at: [-0.95, 1.6, 0], build: m => m.cbox(0, -0.5, 0, 0.26, 0.55, 0.26, body) },
      { n: 'armLR', p: 'armUR', at: [0, -1.05, 0], build: m => { m.cbox(0, -0.45, 0, 0.22, 0.5, 0.22, dark); m.cbox(0, -0.45, 0.22, 0.05, 0.4, 0.01, lava); } },
      { n: 'handR', p: 'armLR', at: [0, -1, 0], build: m => { m.cbox(0, 0, 0, 0.12, 0.2, 0.12, dark); m.cbox(0, -1.8, 0.05, 0.08, 1.8, 0.4, blade); m.cbox(0, -1.8, 0.46, 0.03, 1.7, 0.05, lava2); m.cbox(0, -0.1, 0, 0.35, 0.08, 0.2, horn); } },
      { n: 'armUL', p: 'torso', at: [0.95, 1.6, 0], build: m => m.cbox(0, -0.5, 0, 0.26, 0.55, 0.26, body) },
      { n: 'armLL', p: 'armUL', at: [0, -1.05, 0], build: m => { m.cbox(0, -0.45, 0, 0.22, 0.5, 0.22, dark); for (const x of [-0.12, 0, 0.12]) m.cbox(x, -1.05, 0.1, 0.04, 0.2, 0.05, horn); } }
    ];
  }

  function baelParts() {
    const skin = rgb(0x9cb6c8), belly = rgb(0xd8e2ea), dark = rgb(0x5a7086), mouth = rgb(0x5a1a24), lure = G(0xe8d8ff), lure2 = G(0xa878ff), eye = G(0xffe060), ice = G(0xc8f0ff);
    const leg = (n, at, s) => [{ n: n, p: 'body', at, build: m => { m.cbox(s * 0.3, -0.3, 0, 0.45, 0.55, 0.5, skin); m.cbox(s * 0.35, -0.95, 0.25, 0.45, 0.15, 0.65, dark); } }];
    return [
      { n: 'body', at: [0, 1.6, 0], build: m => { m.sphere(0, 0.3, 0, 2.4, 1.5, 2.8, 12, 7, skin); m.sphere(0, -0.3, 0.6, 2.1, 1.0, 2.2, 10, 5, belly); for (let i = 0; i < 8; i++) m.pyramid(sin(i) * 1.2, 1.6, -1.5 + i * 0.35, 0.18, 0.5, ice); } },
      { n: 'head', p: 'body', at: [0, 0.6, 2.2], build: m => { m.sphere(0, 0.2, 0.4, 1.6, 0.8, 1.2, 10, 5, skin); m.sphere(0.9, 0.85, 0.3, 0.3, 0.3, 0.3, 6, 4, eye); m.sphere(-0.9, 0.85, 0.3, 0.3, 0.3, 0.3, 6, 4, eye); m.cbox(0, -0.2, 0.9, 1.3, 0.1, 0.6, mouth); } },
      { n: 'jaw', p: 'head', at: [0, -0.25, 0.2], build: m => { m.sphere(0, -0.15, 0.4, 1.5, 0.45, 1.1, 10, 4, belly); m.cbox(0, 0.1, 0.7, 1.2, 0.08, 0.6, mouth); } },
      ...leg('legFL', [1.5, -0.6, 1.4], 1), ...leg('legFR', [-1.5, -0.6, 1.4], -1), ...leg('legBL', [1.7, -0.5, -1.4], 1), ...leg('legBR', [-1.7, -0.5, -1.4], -1),
      { n: 'antL', p: 'body', at: [0.8, 1.6, 0.5], build: m => { m.cbox(0, 0.9, 0, 0.07, 0.95, 0.07, dark); m.cbox(0, 1.9, 0.4, 0.06, 0.06, 0.45, dark); } },
      { n: 'lureL', p: 'antL', at: [0, 1.85, 0.9], build: m => { m.sphere(0, -0.35, 0, 0.22, 0.3, 0.2, 6, 5, lure); m.cyl(0, -1.05, 0, 0.3, 0.08, 0.7, 7, lure2, false); m.sphere(0, -0.02, 0, 0.12, 0.12, 0.12, 5, 4, lure); } },
      { n: 'antR', p: 'body', at: [-0.8, 1.6, 0.5], build: m => { m.cbox(0, 0.9, 0, 0.07, 0.95, 0.07, dark); m.cbox(0, 1.9, 0.4, 0.06, 0.06, 0.45, dark); } },
      { n: 'lureR', p: 'antR', at: [0, 1.85, 0.9], build: m => { m.sphere(0, -0.35, 0, 0.22, 0.3, 0.2, 6, 5, lure); m.cyl(0, -1.05, 0, 0.3, 0.08, 0.7, 7, lure2, false); m.sphere(0, -0.02, 0, 0.12, 0.12, 0.12, 5, 4, lure); } }
    ];
  }

  const MODELS = {};
  function model(key) {
    if (MODELS[key]) return MODELS[key];
    let parts, fam = 'hum', scale = 1;
    if (LOOKS[key]) parts = humanParts(LOOKS[key]);
    else switch (key) {
      case 'scarecrow': parts = scarecrowParts(false, false); fam = 'scare'; break;
      case 'scarecrowLeg': parts = scarecrowParts(true, false); fam = 'scare'; break;
      case 'mega': parts = scarecrowParts(false, true); fam = 'scare'; scale = 1.55; break;
      case 'frost': parts = frostParts(); fam = 'frost'; break;
      case 'angelo': parts = angeloParts(false); fam = 'angelo'; break;
      case 'credoAngelo': parts = angeloParts(true); fam = 'angelo'; scale = 1.08; break;
      case 'assault': parts = assaultParts(); fam = 'assault'; break;
      case 'mephisto': parts = mephistoParts(); fam = 'meph'; break;
      case 'gladius': parts = gladiusParts(); fam = 'gladius'; break;
      case 'berial': parts = berialParts(); fam = 'berial'; break;
      case 'bael': parts = baelParts(); fam = 'bael'; break;
      default: parts = humanParts(LOOKS.knight);
    }
    return (MODELS[key] = { key, parts, fam, scale });
  }

  const KEY = { t: 'torso', hd: 'head', ur: 'armUR', lr: 'armLR', hr: 'handR', ul: 'armUL', ll: 'armLL', hl: 'handL', tr: 'legUR', sr: 'legLR', tl: 'legUL', sl: 'legLL', c: 'coat' };
  function P(o) { const r = {}; for (const k in o) r[KEY[k] || k] = o[k]; return r; }
  const HP = {
    stand: P({ t: [0.02, 0, 0], ur: [0.05, 0, -0.1], lr: [-0.2, 0, 0], hr: [0.2, 0, 0], ul: [0.05, 0, 0.1], ll: [-0.2, 0, 0], sr: [0.05, 0, 0], sl: [0.05, 0, 0] }),
    guard: P({ t: [0.14, -0.25, 0], hd: [-0.05, 0.2, 0], ur: [-0.45, 0.3, -0.35], lr: [-0.6, 0, 0], hr: [-0.2, 0, 0], ul: [-0.25, 0, 0.3], ll: [-0.7, 0, 0], tr: [-0.3, 0, 0.05], sr: [0.4, 0, 0], tl: [0.25, 0, -0.05], sl: [0.25, 0, 0], y: -0.06 }),
    windR: P({ t: [0.1, -0.75, 0], hd: [0, 0.6, 0], ur: [-1.1, -0.2, -1.2], lr: [-0.7, 0, 0], hr: [-0.2, 0, 0], ul: [-0.4, 0, 0.5], ll: [-0.8, 0, 0], tr: [-0.4, 0, 0], sr: [0.5, 0, 0], tl: [0.3, 0, 0], sl: [0.2, 0, 0], y: -0.08 }),
    followL: P({ t: [0.2, 0.75, 0], hd: [0, -0.5, 0], ur: [-1.45, -0.9, 0.5], lr: [-0.15, 0, 0], hr: [-0.2, 0, 0], ul: [0.1, 0, 0.6], ll: [-0.5, 0, 0], tr: [-0.5, 0, 0], sr: [0.6, 0, 0], tl: [0.4, 0, 0], sl: [0.3, 0, 0], y: -0.12 }),
    followR: P({ t: [0.2, -0.8, 0], hd: [0, 0.55, 0], ur: [-1.5, 0.4, -1.1], lr: [-0.1, 0, 0], hr: [0, 0, 0], ul: [-0.3, 0, 0.4], ll: [-0.7, 0, 0], tr: [-0.5, 0, 0], sr: [0.6, 0, 0], tl: [0.4, 0, 0], sl: [0.3, 0, 0], y: -0.12 }),
    overhead: P({ t: [-0.25, -0.2, 0], hd: [0.2, 0, 0], ur: [-2.9, 0, -0.2], lr: [-0.7, 0, 0], hr: [-0.3, 0, 0], ul: [-2.2, 0, 0.3], ll: [-0.9, 0, 0], tr: [-0.2, 0, 0], sr: [0.2, 0, 0], tl: [0.1, 0, 0], sl: [0.1, 0, 0] }),
    chop: P({ t: [0.55, 0.15, 0], hd: [-0.4, 0, 0], ur: [-1.0, 0, 0.1], lr: [-0.1, 0, 0], hr: [0.2, 0, 0], ul: [-0.6, 0, 0.3], ll: [-0.4, 0, 0], tr: [-0.7, 0, 0], sr: [0.8, 0, 0], tl: [0.5, 0, 0], sl: [0.4, 0, 0], y: -0.22 }),
    spinOut: P({ t: [0.2, 0, 0], hd: [0, 0, 0], ur: [-1.5, 0, -1.3], lr: [0, 0, 0], hr: [0.1, 0, 0], ul: [-0.8, 0, 1.2], ll: [-0.3, 0, 0], tr: [-0.4, 0, 0.1], sr: [0.5, 0, 0], tl: [0.3, 0, -0.1], sl: [0.3, 0, 0], y: -0.14 }),
    thrust: P({ t: [0.3, -0.35, 0], hd: [-0.2, 0.35, 0], ur: [-1.55, 0, -0.1], lr: [0, 0, 0], hr: [0, 0, 0], ul: [-0.3, 0, 0.5], ll: [-0.8, 0, 0], tr: [-0.7, 0, 0], sr: [0.6, 0, 0], tl: [0.5, 0, 0], sl: [0.1, 0, 0], y: -0.14 }),
    pull: P({ t: [0.1, -0.3, 0], hd: [0, 0.3, 0], ur: [-0.8, 0, -0.3], lr: [-1.4, 0, 0], hr: [0.3, 0, 0], ul: [-0.3, 0, 0.5], ll: [-0.8, 0, 0], tr: [-0.3, 0, 0], sr: [0.4, 0, 0], tl: [0.2, 0, 0], sl: [0.2, 0, 0], y: -0.08 }),
    low: P({ t: [0.35, 0.3, 0], hd: [-0.2, -0.2, 0], ur: [-0.1, 0.3, 0.3], lr: [-0.2, 0, 0], hr: [-0.8, 0, 0], ul: [-0.4, 0, 0.4], ll: [-0.6, 0, 0], tr: [-0.9, 0, 0], sr: [1.1, 0, 0], tl: [0.4, 0, 0], sl: [0.8, 0, 0], y: -0.3 }),
    high: P({ t: [-0.3, -0.3, 0], hd: [0.3, 0.2, 0], ur: [-2.9, 0, -0.4], lr: [-0.1, 0, 0], hr: [0.2, 0, 0], ul: [-0.5, 0, 0.8], ll: [-0.4, 0, 0], tr: [-0.3, 0, 0], sr: [0.3, 0, 0], tl: [0.2, 0, 0], sl: [0.1, 0, 0], y: 0.05 }),
    lunge: P({ t: [0.6, -0.3, 0], hd: [-0.45, 0.3, 0], ur: [-1.6, 0, -0.1], lr: [0, 0, 0], hr: [0, 0, 0], ul: [0.6, 0, 0.4], ll: [-0.3, 0, 0], tr: [-1.1, 0, 0], sr: [0.3, 0, 0], tl: [0.7, 0, 0], sl: [0.6, 0, 0], y: -0.3, c: [0.9, 0, 0] }),
    backstep: P({ t: [-0.2, -0.2, 0], hd: [0.2, 0.2, 0], ur: [-0.6, 0, -0.6], lr: [-0.8, 0, 0], hr: [0.4, 0, 0], ul: [-0.2, 0, 0.6], ll: [-0.6, 0, 0], tr: [0.3, 0, 0], sr: [0.5, 0, 0], tl: [-0.6, 0, 0], sl: [0.6, 0, 0], y: -0.1, c: [-0.4, 0, 0] }),
    tuck: P({ t: [0.2, 0, 0], ur: [-0.6, 0, -0.5], lr: [-1, 0, 0], hr: [0.3, 0, 0], ul: [-0.6, 0, 0.5], ll: [-1, 0, 0], tr: [-1.2, 0, 0], sr: [1.6, 0, 0], tl: [-0.9, 0, 0], sl: [1.7, 0, 0], y: 0.2, c: [0.6, 0, 0] }),
    plunge: P({ t: [0.3, 0, 0], hd: [-0.4, 0, 0], ur: [-2.6, 0, -0.1], lr: [-0.3, 0, 0], hr: [-1.9, 0, 0], ul: [-2.5, 0, 0.1], ll: [-0.4, 0, 0], tr: [-0.8, 0, 0], sr: [1.4, 0, 0], tl: [-0.4, 0, 0], sl: [1.2, 0, 0], y: 0.1, c: [-0.8, 0, 0] }),
    planted: P({ t: [0.8, 0, 0], hd: [-0.5, 0, 0], ur: [-0.9, 0, -0.1], lr: [0, 0, 0], hr: [-0.9, 0, 0], ul: [-0.9, 0, 0.1], ll: [0, 0, 0], tr: [-1.4, 0, 0], sr: [1.8, 0, 0], tl: [-0.2, 0, 0], sl: [1.9, 0, 0], y: -0.55, c: [1.1, 0, 0] }),
    aim: P({ t: [0.05, 0.45, 0], hd: [0, -0.35, 0], ur: [0.1, 0, -0.25], lr: [-0.5, 0, 0], hr: [0.4, 0, 0], ul: [-1.55, 0.2, 0.05], ll: [0, 0, 0], hl: [0, 0, 0], tr: [-0.2, 0, 0], sr: [0.3, 0, 0], tl: [0.2, 0, 0], sl: [0.1, 0, 0], y: -0.04 }),
    recoil: P({ t: [-0.05, 0.45, 0], hd: [0.1, -0.35, 0], ur: [0.1, 0, -0.25], lr: [-0.5, 0, 0], hr: [0.4, 0, 0], ul: [-2.0, 0.2, 0.05], ll: [-0.3, 0, 0], tr: [-0.2, 0, 0], sr: [0.3, 0, 0], tl: [0.2, 0, 0], sl: [0.1, 0, 0], y: -0.04 }),
    reach: P({ t: [0.2, -0.45, 0], hd: [-0.1, 0.4, 0], ur: [-1.6, 0.1, -0.1], lr: [0, 0, 0], hr: [0, 0, 0], ul: [-0.2, 0, 0.5], ll: [-0.6, 0, 0], tr: [-0.4, 0, 0], sr: [0.4, 0, 0], tl: [0.3, 0, 0], sl: [0.2, 0, 0], y: -0.08 }),
    grabUp: P({ t: [-0.15, 0, 0], hd: [0.3, 0, 0], ur: [-2.9, 0, -0.2], lr: [-0.3, 0, 0], hr: [0, 0, 0], ul: [-0.4, 0, 0.6], ll: [-0.7, 0, 0], tr: [-0.2, 0, 0], sr: [0.3, 0, 0], tl: [0.1, 0, 0], sl: [0.1, 0, 0], y: 0 }),
    slam: P({ t: [0.75, 0, 0], hd: [-0.5, 0, 0], ur: [-0.7, 0, -0.1], lr: [0, 0, 0], hr: [0, 0, 0], ul: [-0.2, 0, 0.6], ll: [-0.5, 0, 0], tr: [-1.0, 0, 0], sr: [1.2, 0, 0], tl: [0.4, 0, 0], sl: [0.8, 0, 0], y: -0.35, c: [0.9, 0, 0] }),
    punch: P({ t: [0.3, -0.6, 0], hd: [-0.1, 0.5, 0], ur: [-1.6, 0, 0], lr: [0, 0, 0], hr: [0, 0, 0], ul: [-0.4, 0, 0.5], ll: [-1.2, 0, 0], tr: [-0.6, 0, 0], sr: [0.4, 0, 0], tl: [0.5, 0, 0], sl: [0.3, 0, 0], y: -0.15 }),
    hurt: P({ t: [-0.4, 0.1, 0], hd: [0.4, 0, 0], ur: [0.4, 0, -0.5], lr: [-0.6, 0, 0], ul: [0.4, 0, 0.5], ll: [-0.6, 0, 0], tr: [0.2, 0, 0], sr: [0.3, 0, 0], tl: [-0.3, 0, 0], sl: [0.4, 0, 0], y: -0.05 }),
    fly: P({ t: [-0.6, 0, 0], hd: [0.5, 0, 0], ur: [-0.4, 0, -1], lr: [-0.3, 0, 0], ul: [-0.4, 0, 1], ll: [-0.3, 0, 0], tr: [-0.5, 0, 0], sr: [0.8, 0, 0], tl: [0.2, 0, 0], sl: [0.4, 0, 0], root: [-1.2, 0, 0] }),
    down: P({ t: [0, 0, 0], hd: [0.2, 0.3, 0], ur: [0.2, 0, -0.8], lr: [-0.2, 0, 0], ul: [0.1, 0, 0.9], ll: [-0.3, 0, 0], tr: [0.1, 0, 0.1], sr: [0.2, 0, 0], tl: [-0.1, 0, -0.1], sl: [0.4, 0, 0], root: [-1.5, 0, 0], y: -0.78 }),
    kneel: P({ t: [0.35, 0, 0], hd: [-0.2, 0, 0], ur: [0.3, 0, -0.2], lr: [-0.8, 0, 0], ul: [-0.2, 0, 0.3], ll: [-1.2, 0, 0], tr: [-1.5, 0, 0], sr: [1.5, 0, 0], tl: [0.1, 0, 0], sl: [1.9, 0, 0], y: -0.5 }),
    taunt: P({ t: [-0.1, 0.2, 0], hd: [0.15, -0.2, 0], ur: [-0.2, 0, -0.3], lr: [-0.4, 0, 0], hr: [0.3, 0, 0], ul: [-1.6, 0.8, 0.3], ll: [-1.6, 0, 0], tr: [0, 0, 0.1], sr: [0.05, 0, 0], tl: [0, 0, -0.1], sl: [0.05, 0, 0] }),
    roar: P({ t: [-0.4, 0, 0], hd: [0.5, 0, 0], ur: [-0.6, 0, -1.2], lr: [-0.9, 0, 0], ul: [-0.6, 0, 1.2], ll: [-0.9, 0, 0], tr: [-0.2, 0, 0.2], sr: [0.3, 0, 0], tl: [-0.2, 0, -0.2], sl: [0.3, 0, 0], y: -0.08 }),
    talk: P({ t: [0.02, 0, 0], hd: [0.05, 0, 0], ur: [-0.1, 0, -0.15], lr: [-0.5, 0, 0], ul: [-0.3, 0.3, 0.1], ll: [-1.1, 0, 0], sr: [0.05, 0, 0], sl: [0.05, 0, 0] }),
    point: P({ t: [0, 0.2, 0], hd: [0, -0.1, 0], ur: [-1.5, 0, -0.1], lr: [0, 0, 0], ul: [0.1, 0, 0.1], ll: [-0.2, 0, 0], sr: [0.05, 0, 0], sl: [0.05, 0, 0] }),
    pray: P({ t: [0.15, 0, 0], hd: [0.3, 0, 0], ur: [-0.9, 0, 0.4], lr: [-1.4, 0, 0], ul: [-0.9, 0, -0.4], ll: [-1.4, 0, 0], sr: [0.05, 0, 0], sl: [0.05, 0, 0] }),
    sing: P({ t: [-0.08, 0, 0], hd: [-0.25, 0, 0], ur: [-0.5, 0, 0.2], lr: [-1.3, 0, 0], ul: [-0.5, 0, -0.2], ll: [-1.3, 0, 0], sr: [0.05, 0, 0], sl: [0.05, 0, 0] }),
    arms: P({ t: [0, 0, 0], hd: [0.05, 0, 0], ur: [-0.5, 0, 0.5], lr: [-1.6, 0, 0], ul: [-0.5, 0, -0.5], ll: [-1.6, 0, 0], tr: [0, 0, 0.08], tl: [0, 0, -0.08], sr: [0.02, 0, 0], sl: [0.02, 0, 0] }),
    sit: P({ t: [0.05, 0, 0], ur: [-0.4, 0, -0.1], lr: [-0.6, 0, 0], ul: [-0.4, 0, 0.1], ll: [-0.6, 0, 0], tr: [-1.5, 0, 0.1], sr: [1.5, 0, 0], tl: [-1.5, 0, -0.1], sl: [1.5, 0, 0], y: -0.45 }),
    stabbed: P({ t: [0.5, 0, 0], hd: [0.3, 0, 0], ur: [-0.3, 0, -0.9], lr: [-0.5, 0, 0], ul: [-1.2, 0, 0.3], ll: [-0.8, 0, 0], tr: [-0.4, 0, 0], sr: [1.2, 0, 0], tl: [0.1, 0, 0], sl: [1.6, 0, 0], y: -0.42 }),
    hang: P({ t: [-0.1, 0, 0], hd: [0.3, 0, 0], ur: [-3.0, 0, -0.1], lr: [0, 0, 0], ul: [-0.3, 0, 0.5], ll: [-0.3, 0, 0], tr: [-0.4, 0, 0], sr: [0.6, 0, 0], tl: [0.2, 0, 0], sl: [0.4, 0, 0], c: [-0.3, 0, 0] }),
    carry: P({ t: [0.1, 0, 0], ur: [-1.1, 0, 0.2], lr: [-0.6, 0, 0], ul: [-1.1, 0, -0.2], ll: [-0.6, 0, 0], sr: [0.05, 0, 0], sl: [0.05, 0, 0] })
  };

  function mix(a, b, t) {
    if (t <= 0) return a; if (t >= 1) return b;
    const r = {};
    for (const k in a) { const va = a[k], vb = b[k]; if (typeof va === 'number') r[k] = lerp(va, vb == null ? 0 : vb, t); else r[k] = vb ? [lerp(va[0], vb[0], t), lerp(va[1], vb[1], t), lerp(va[2], vb[2], t)] : [va[0] * (1 - t), va[1] * (1 - t), va[2] * (1 - t)]; }
    for (const k in b) if (!(k in a)) { const vb = b[k]; r[k] = typeof vb === 'number' ? vb * t : [vb[0] * t, vb[1] * t, vb[2] * t]; }
    return r;
  }
  const ease = t => t * t * (3 - 2 * t);
  function keys(list, lib) {
    const L = list.map(([t, p, x]) => [t, typeof p === 'string' ? lib[p] : p, x]);
    return (u) => {
      u = clamp(u, 0, 1);
      let i = 0; while (i < L.length - 1 && u > L[i + 1][0]) i++;
      const a = L[i], b = L[Math.min(i + 1, L.length - 1)];
      const t = b[0] > a[0] ? ease((u - a[0]) / (b[0] - a[0])) : 1;
      const r = mix(a[1], b[1], t);
      const sa = a[2] || 0, sb = b[2] == null ? sa : b[2], spin = lerp(sa, sb, t);
      if (spin) { const rr = r.root || [0, 0, 0]; r.root = [rr[0], rr[1] + spin, rr[2]]; }
      return r;
    };
  }
  function addPose(a, b) { const r = Object.assign({}, a); for (const k in b) { const v = b[k]; if (typeof v === 'number') r[k] = (r[k] || 0) + v; else { const o = r[k] || [0, 0, 0]; r[k] = [o[0] + v[0], o[1] + v[1], o[2] + v[2]]; } } return r; }

  const HA = {
    a1: keys([[0, 'guard'], [0.18, 'windR'], [0.45, 'followL'], [1, 'guard']], HP),
    a2: keys([[0, 'followL'], [0.2, 'followL'], [0.45, 'followR'], [1, 'guard']], HP),
    a3: keys([[0, 'guard'], [0.25, 'overhead'], [0.45, 'chop'], [1, 'guard']], HP),
    a4: keys([[0, 'guard'], [0.2, 'windR', 0], [0.45, 'spinOut', -PI * 2], [0.7, 'followL', -PI * 2], [1, 'guard', -PI * 2]], HP),
    b3: keys([[0, 'pull'], [0.1, 'thrust'], [0.18, 'pull'], [0.26, 'thrust'], [0.34, 'pull'], [0.42, 'thrust'], [0.5, 'pull'], [0.58, 'thrust'], [0.66, 'pull'], [0.74, 'thrust'], [1, 'guard']], HP),
    b4: keys([[0, 'guard'], [0.2, 'low'], [0.42, 'high'], [1, 'guard']], HP),
    streak: keys([[0, 'guard'], [0.15, 'windR'], [0.35, 'lunge'], [0.55, 'followL'], [1, 'guard']], HP),
    highroller: keys([[0, 'guard'], [0.2, 'low'], [0.4, 'high'], [1, 'guard']], HP),
    shuffle: keys([[0, 'guard'], [0.25, 'backstep'], [0.45, 'lunge'], [0.62, 'followR'], [1, 'guard']], HP),
    air1: keys([[0, 'tuck'], [0.2, 'windR'], [0.5, 'followL'], [1, 'tuck']], HP),
    air2: keys([[0, 'followL'], [0.2, 'followL'], [0.5, 'followR'], [1, 'tuck']], HP),
    air3: keys([[0, 'tuck'], [0.3, 'overhead'], [0.5, 'chop'], [1, 'tuck']], HP),
    roulette: keys([[0, 'tuck'], [0.1, 'spinOut', 0], [0.9, 'spinOut', -PI * 6], [1, 'tuck', -PI * 6]], HP),
    split: keys([[0, 'tuck'], [0.3, 'plunge'], [1, 'plunge']], HP),
    splitLand: keys([[0, 'planted'], [0.6, 'planted'], [1, 'guard']], HP),
    calibur: keys([[0, 'tuck'], [0.25, 'lunge'], [0.7, 'lunge'], [1, 'tuck']], HP),
    shoot: keys([[0, 'aim'], [0.1, 'recoil'], [0.4, 'aim'], [0.5, 'recoil'], [1, 'aim']], HP),
    charge: keys([[0, 'aim'], [1, 'aim']], HP),
    snatch: keys([[0, 'guard'], [0.25, 'reach'], [0.65, 'reach'], [1, 'pull']], HP),
    buster: keys([[0, 'reach'], [0.12, 'reach'], [0.4, 'grabUp'], [0.62, 'slam'], [1, 'guard']], HP),
    busterAir: keys([[0, 'reach'], [0.3, 'grabUp'], [0.7, 'slam'], [1, 'tuck']], HP),
    punch: keys([[0, 'reach'], [0.35, 'pull'], [0.55, 'punch'], [1, 'guard']], HP),
    roll: keys([[0, 'tuck', 0], [1, 'tuck', 0]], HP),
    hurt: keys([[0, 'hurt'], [1, 'guard']], HP),
    knock: keys([[0, 'fly'], [1, 'fly']], HP),
    down: keys([[0, 'down'], [1, 'down']], HP),
    getup: keys([[0, 'down'], [0.5, 'kneel'], [1, 'guard']], HP),
    taunt: keys([[0, 'stand'], [0.2, 'taunt'], [0.8, 'taunt'], [1, 'stand']], HP),
    dt: keys([[0, 'guard'], [0.3, 'roar'], [0.8, 'roar'], [1, 'guard']], HP),
    hellbound: keys([[0, 'reach'], [0.3, 'hang'], [1, 'hang']], HP),
    hop: keys([[0, 'tuck'], [1, 'tuck']], HP),
    dead: keys([[0, 'hurt'], [0.4, 'kneel'], [1, 'down']], HP),
    slashE: keys([[0, 'guard'], [0.3, 'windR'], [0.55, 'followL'], [1, 'guard']], HP),
    overE: keys([[0, 'guard'], [0.35, 'overhead'], [0.55, 'chop'], [1, 'guard']], HP),
    thrustE: keys([[0, 'guard'], [0.35, 'pull'], [0.55, 'lunge'], [1, 'guard']], HP),
    shieldE: keys([[0, 'guard'], [1, 'guard']], HP),
    spearThrow: keys([[0, 'guard'], [0.4, 'high'], [0.6, 'thrust'], [1, 'guard']], HP),
    stinger: keys([[0, 'guard'], [0.2, 'pull'], [0.4, 'lunge'], [0.85, 'lunge'], [1, 'guard']], HP),
    helm: keys([[0, 'tuck'], [0.3, 'overhead'], [0.6, 'chop'], [1, 'guard']], HP),
    gunsE: keys([[0, 'aim'], [0.25, 'recoil'], [0.5, 'aim'], [0.75, 'recoil'], [1, 'aim']], HP)
  };
  S.HPOSE = HP; S.HANIM = HA;

  function locomotion(a, t) {
    const sp = a.moveK || 0, ph = a.phase || 0;
    if (a.air != null ? a.air : a.ground === false) {
      const up = a.vy > 0;
      return mix(HP.guard, up ? P({ t: [0.1, 0, 0], ur: [-0.5, 0, -0.5], lr: [-0.9, 0, 0], ul: [-0.6, 0, 0.6], ll: [-0.9, 0, 0], tr: [-0.9, 0, 0], sr: [1.2, 0, 0], tl: [-0.2, 0, 0], sl: [0.6, 0, 0], c: [-0.6, 0, 0] }) : P({ t: [0, 0, 0], ur: [-0.3, 0, -0.9], lr: [-0.5, 0, 0], ul: [-0.3, 0, 0.9], ll: [-0.5, 0, 0], tr: [-0.4, 0, 0], sr: [0.6, 0, 0], tl: [0.1, 0, 0], sl: [0.3, 0, 0], c: [-1.1, 0, 0] }), 1);
    }
    const base = a.combat ? HP.guard : HP.stand;
    const breath = sin(t * 2.2) * 0.03;
    const idle = addPose(base, P({ t: [breath, 0, 0], hd: [-breath, 0, 0] }));
    if (sp < 0.05) return idle;
    const s = sin(ph), c = cos(ph), k = Math.min(1, sp);
    const run = P({
      t: [0.28 * k, s * 0.12, 0], hd: [-0.2 * k, -s * 0.1, 0],
      ur: [a.combat ? -0.3 : 0.4 * c, 0, -0.25], lr: [-0.9, 0, 0], hr: [0.7, 0, 0],
      ul: [-0.8 * c * k, 0, 0.15], ll: [-1.1 * k, 0, 0],
      tr: [-0.9 * s * k - 0.1, 0, 0], sr: [(0.9 + 0.8 * Math.max(0, -c)) * k, 0, 0],
      tl: [0.9 * s * k - 0.1, 0, 0], sl: [(0.9 + 0.8 * Math.max(0, c)) * k, 0, 0],
      y: -0.06 * k + Math.abs(c) * 0.06 * k, c: [0.7 * k, 0, 0]
    });
    return mix(idle, run, Math.min(1, sp * 1.5));
  }

  function humanPose(a) {
    const t = a.t || 0;
    if (a.pose && HP[a.pose]) {
      let p = HP[a.pose];
      if (a.pose === 'talk') p = addPose(p, P({ hd: [sin(t * 5) * 0.04, sin(t * 1.3) * 0.1, 0], ul: [sin(t * 3) * 0.15, 0, 0] }));
      if (a.pose === 'sing') p = addPose(p, P({ hd: [sin(t * 1.5) * 0.08, 0, sin(t * 0.8) * 0.06], t: [0, sin(t * 0.7) * 0.05, 0] }));
      return a.walk ? mix(p, locomotion(a, t), 0.6) : p;
    }
    if (a.anim && HA[a.anim]) return HA[a.anim](a.animU || 0);
    return locomotion(a, t);
  }

  function scarePose(a) {
    const t = a.t || 0, u = a.animU || 0;
    let p = humanPose(Object.assign({}, a, { anim: null }));
    p = addPose(p, P({ t: [0.35 + sin(t * 3) * 0.08, sin(t * 2.3) * 0.15, sin(t * 1.7) * 0.12], hd: [0.2, sin(t * 2.7) * 0.3, sin(t * 3.3) * 0.25] }));
    switch (a.anim) {
      case 'attack': return mix(p, u < 0.5 ? HP.overhead : HP.chop, u < 0.15 ? u / 0.15 : u < 0.5 ? 1 : 1 - (u - 0.6) * 2.5);
      case 'spin': return addPose(mix(p, HP.spinOut, Math.min(1, u * 4)), { root: [0, -u * PI * 4, 0] });
      case 'kick': return addPose(mix(p, P({ t: [-0.3, 0, 0], tr: [-1.9, 0, 0], sr: [0.1, 0, 0], tl: [0.3, 0, 0], sl: [0.3, 0, 0] }), Math.sin(u * PI)), {});
      case 'roll': return addPose(HP.tuck, { root: [u * PI * 4, 0, 0], y: 0.2 });
      default: return humanPose(a);
    }
  }

  function beastPose(a) {
    const t = a.t || 0, u = a.animU || 0, ph = a.phase || 0, k = Math.min(1, a.moveK || 0);
    if (a.anim && HA[a.anim]) return HA[a.anim](u);
    let p = locomotion(Object.assign({}, a, { combat: true }), t);
    if (a.m && a.m.fam === 'assault') p = addPose(p, P({ t: [0.35, 0, 0], hd: [-0.3, 0, 0], tr: [-0.4, 0, 0], sr: [0.7, 0, 0], tl: [-0.4, 0, 0], sl: [0.7, 0, 0], y: -0.12, c: [0.2 + sin(t * 3) * 0.1, sin(t * 2) * 0.3, 0] }));
    if (a.m && a.m.fam === 'frost') p = addPose(p, P({ t: [0.15, 0, 0], c: [0.1, sin(t * 2.5) * 0.4, 0], ur: [-0.3, 0, -0.2], ul: [-0.3, 0, 0.2] }));
    if (a.m && a.m.fam === 'meph') p = addPose(p, P({ t: [0.1 + sin(t * 2) * 0.05, 0, 0], ur: [-0.5 + sin(t * 3) * 0.2, 0, -0.4], ul: [-0.5 + sin(t * 3 + 1) * 0.2, 0, 0.4], y: sin(t * 2.4) * 0.12 }));
    switch (a.anim) {
      case 'pounce': return addPose(HP.tuck, { root: [-0.6, 0, 0] });
      case 'claw': return mix(p, u < 0.5 ? HP.windR : HP.followL, Math.sin(u * PI));
      case 'claw2': return mix(p, u < 0.5 ? HP.followL : HP.followR, Math.sin(u * PI));
      case 'block': return mix(p, P({ t: [0.3, 0.3, 0], ul: [-1.4, 0, 0.3], ll: [-1.3, 0, 0], ur: [-0.3, 0, -0.3], y: -0.15 }), 1);
      case 'spit': return mix(p, HP.roar, Math.sin(u * PI));
      case 'cocoon': return mix(HP.kneel, HP.pray, 0.5);
      case 'swoop': return addPose(mix(p, HP.windR, 0.5), { root: [0.5, 0, 0] });
      default: return p;
    }
  }

  function berialPose(a) {
    const t = a.t || 0, u = a.animU || 0, ph = a.phase || 0, k = Math.min(1, a.moveK || 0);
    const s = sin(ph) * k * 0.5, c = cos(ph) * k * 0.5;
    const p = { flU: [s, 0, 0], flL: [Math.max(0, -c), 0, 0], brU: [s, 0, 0], brL: [Math.max(0, c), 0, 0], frU: [-s, 0, 0], frL: [Math.max(0, c), 0, 0], blU: [-s, 0, 0], blL: [Math.max(0, -c), 0, 0], torso: [sin(t * 1.5) * 0.04, 0, 0], head: [0.1, sin(t * 0.8) * 0.15, 0], armUR: [-0.3, 0, -0.3], armLR: [-0.6, 0, 0], handR: [0.4, 0, 0], armUL: [-0.2, 0, 0.3], armLL: [-0.5, 0, 0], body: [0, 0, 0] };
    switch (a.anim) {
      case 'swing': { const w = u < 0.4 ? u / 0.4 : 1; p.armUR = u < 0.4 ? [-2.4 * w, 0, -0.5 - w * 0.6] : [lerp(-2.4, -0.6, Math.min(1, (u - 0.4) * 4)), 0, lerp(-1.1, 0.8, Math.min(1, (u - 0.4) * 4))]; p.torso = [0.2, u < 0.4 ? -0.4 * w : lerp(-0.4, 0.5, Math.min(1, (u - 0.4) * 4)), 0]; break; }
      case 'stomp': { const w = Math.sin(u * PI); p.body = [-0.5 * w, 0, 0]; p.flU = [-1.2 * w, 0, 0]; p.frU = [-1.2 * w, 0, 0]; p.flL = [1 * w, 0, 0]; p.frL = [1 * w, 0, 0]; break; }
      case 'roar': p.head = [-0.6, 0, 0]; p.torso = [-0.3, 0, 0]; p.armUR = [-0.8, 0, -1.2]; p.armUL = [-0.8, 0, 1.2]; break;
      case 'cast': p.armUL = [-2.6, 0, 0.4]; p.armLL = [-0.3, 0, 0]; p.head = [-0.3, 0, 0]; break;
      case 'stun': p.torso = [0.6, 0, 0.2]; p.head = [0.6, 0, 0]; p.body = [0.25, 0, 0.12]; p.flU = [0.9, 0, 0]; p.flL = [1.4, 0, 0]; p.frU = [0.9, 0, 0]; p.frL = [1.4, 0, 0]; p.rootY = -0.9; break;
      case 'dead': p.body = [0.35, 0, 0.5]; p.torso = [0.9, 0, 0.3]; p.head = [0.7, 0, 0]; p.rootY = -1.4; break;
      default: break;
    }
    return p;
  }

  function baelPose(a) {
    const t = a.t || 0, u = a.animU || 0, k = Math.min(1, a.moveK || 0), ph = a.phase || 0;
    const p = { body: [sin(t * 1.2) * 0.03, 0, sin(ph) * 0.05 * k], head: [0, 0, 0], jaw: [0.05 + sin(t * 1.6) * 0.04, 0, 0], antL: [0.2 + sin(t * 1.3) * 0.15, 0, -0.2 + sin(t) * 0.1], antR: [0.2 + sin(t * 1.3 + 1) * 0.15, 0, 0.2 - sin(t) * 0.1], lureL: [0, 0, 0], lureR: [0, 0, 0], legFL: [sin(ph) * 0.4 * k, 0, 0], legFR: [-sin(ph) * 0.4 * k, 0, 0], legBL: [-sin(ph) * 0.4 * k, 0, 0], legBR: [sin(ph) * 0.4 * k, 0, 0] };
    switch (a.anim) {
      case 'breath': p.jaw = [0.7 * Math.sin(Math.min(1, u * 1.3) * PI), 0, 0]; p.head = [-0.2, 0, 0]; break;
      case 'tongue': p.jaw = [0.8 * Math.sin(u * PI), 0, 0]; p.head = [0.15, 0, 0]; break;
      case 'jump': p.body = [-0.3 * Math.sin(u * PI), 0, 0]; p.legFL = [-0.8, 0, 0]; p.legFR = [-0.8, 0, 0]; p.legBL = [0.8, 0, 0]; p.legBR = [0.8, 0, 0]; break;
      case 'lure': p.antL = [-0.9, 0, -0.4]; p.antR = [-0.9, 0, 0.4]; p.jaw = [0.2, 0, 0]; break;
      case 'stun': p.body = [0.25, 0, 0.1]; p.head = [0.5, 0, 0]; p.jaw = [0.6, 0, 0]; p.antL = [1.2, 0, -0.5]; p.antR = [1.2, 0, 0.5]; p.rootY = -0.6; break;
      case 'burrow': p.rootY = -u * 4.5; break;
      case 'rise': p.rootY = -(1 - u) * 4.5; p.jaw = [0.6 * Math.sin(u * PI), 0, 0]; break;
      case 'dead': p.body = [0.4, 0, 0.6]; p.rootY = -1; p.jaw = [0.8, 0, 0]; break;
      default: break;
    }
    return p;
  }

  function pose(a) {
    const m = a.m;
    switch (m.fam) {
      case 'hum': case 'angelo': return humanPose(a);
      case 'scare': return scarePose(a);
      case 'frost': case 'assault': case 'meph': return beastPose(a);
      case 'berial': return berialPose(a);
      case 'bael': return baelPose(a);
      default: return { hips: [0, 0, sin((a.t || 0) * 8) * 0.2] };
    }
  }

  function poseMatrices(m, base, p) {
    const out = {};
    for (const part of m.parts) {
      const par = part.p ? out[part.p] : base, mm = M4.copy(M4.create(), par);
      M4.translate(mm, part.at[0], part.at[1], part.at[2]);
      if (!part.p) {
        if (p.y) M4.translate(mm, 0, p.y, 0);
        if (p.rootY) M4.translate(mm, 0, p.rootY, 0);
        const r = p.root; if (r) { M4.rotY(mm, r[1]); M4.rotX(mm, r[0]); M4.rotZ(mm, r[2]); }
      }
      const r = p[part.n]; if (r) { M4.rotY(mm, r[1] || 0); M4.rotX(mm, r[0] || 0); M4.rotZ(mm, r[2] || 0); }
      out[part.n] = mm;
    }
    return out;
  }

  S.LOOKS = LOOKS; S.model = model; S.pose = pose; S.poseMatrices = poseMatrices; S.mixPose = mix; S.P = P;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
