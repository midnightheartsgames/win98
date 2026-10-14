/**
 * Serious Sam 98 — procedural low-poly models: articulated enemy rigs with poses, first-person weapons,
 * pickups, projectiles and static Egyptian props (columns, obelisks, sphinxes, palms, pyramids...).
 * Produces plain Mesh data (no GL): the renderer uploads it, the tests inspect it.
 */
(function (S) {
  'use strict';
  const { Mesh, M4, rgb } = S;
  const PI = Math.PI, sin = Math.sin, cos = Math.cos;
  const E = (hex) => rgb(hex, 0); // emissive colour (unlit)

  // ================================================================ rig helpers
  // part: { n, p (parent), at: [x,y,z] pivot in parent space, build(mesh) in pivot space }
  const rig = (parts, pose, extra = {}) => Object.assign({ parts, pose }, extra);
  const P = (n, p, at, build) => ({ n, p, at, build });
  const limb = (m, len, w, d, c, y0 = 0) => m.box(-w / 2, -len - y0, -d / 2, w / 2, -y0, d / 2, c);

  // ---------------------------------------------------------------- humanoid (beheaded soldiers, reptiloid, boss)
  function humanoid(o) {
    const sk = rgb(o.skin), sh = rgb(o.shirt), pa = rgb(o.pants), bo = rgb(o.boots || 0x2a2018), H = o.hip || 0.95;
    const parts = [
      P('hips', null, [0, H, 0], m => m.cbox(0, 0, 0, 0.24, 0.1, 0.14, pa)),
      P('legL', 'hips', [-0.13, -0.05, 0], m => limb(m, 0.46, 0.17, 0.19, pa)),
      P('shinL', 'legL', [0, -0.46, 0], m => { limb(m, 0.42, 0.14, 0.16, pa); m.box(-0.08, -0.47, -0.08, 0.08, -0.37, 0.16, bo); }),
      P('legR', 'hips', [0.13, -0.05, 0], m => limb(m, 0.46, 0.17, 0.19, pa)),
      P('shinR', 'legR', [0, -0.46, 0], m => { limb(m, 0.42, 0.14, 0.16, pa); m.box(-0.08, -0.47, -0.08, 0.08, -0.37, 0.16, bo); }),
      P('torso', 'hips', [0, 0.08, 0], m => {
        m.box(-0.27, 0, -0.15, 0.27, 0.56, 0.15, sh); m.box(-0.3, 0.42, -0.16, 0.3, 0.58, 0.16, sh);
        if (o.belt) m.box(-0.28, 0, -0.16, 0.28, 0.08, 0.16, rgb(o.belt));
        if (o.headless) { m.cyl(0, 0.58, 0, 0.09, 0.07, 0.07, 6, rgb(0xa01010)); m.cyl(0, 0.64, 0, 0.06, 0.0, 0.03, 6, rgb(0x600808)); }
      }),
      P('armL', 'torso', [-0.36, 0.52, 0], m => { limb(m, 0.34, 0.12, 0.13, o.sleeves ? sh : sk); limb(m, 0.3, 0.1, 0.11, sk, 0.34); }),
      P('armR', 'torso', [0.36, 0.52, 0], m => {
        limb(m, 0.34, 0.12, 0.13, o.sleeves ? sh : sk); limb(m, 0.3, 0.1, 0.11, sk, 0.34);
        if (o.weapon === 'tube') { m.cyl(0, -0.62, -0.1, 0.08, 0.08, 0.55, 8, rgb(0x3a4030)); m.cyl(0, -0.08, -0.1, 0.05, 0.05, 0.02, 6, E(0xff9020)); }
        if (o.weapon === 'cannon') { m.box(-0.1, -0.72, -0.1, 0.1, -0.5, 0.35, rgb(0x404858)); m.box(-0.06, -0.66, 0.35, 0.06, -0.56, 0.42, E(0xffa030)); }
      }),
      P('handL', 'armL', [0, -0.66, 0], m => { if (o.weapon === 'bombs') { m.sphere(0, -0.08, 0, 0.14, 0.14, 0.14, 8, 6, rgb(0x151515)); m.box(-0.02, 0.04, -0.02, 0.02, 0.1, 0.02, E(0xffc040)); } else m.cbox(0, -0.04, 0, 0.05, 0.05, 0.05, sk); }),
      P('handR', 'armR', [0, -0.66, 0], m => { if (o.weapon === 'bombs') { m.sphere(0, -0.08, 0, 0.14, 0.14, 0.14, 8, 6, rgb(0x151515)); m.box(-0.02, 0.04, -0.02, 0.02, 0.1, 0.02, E(0xffc040)); } else m.cbox(0, -0.04, 0, 0.05, 0.05, 0.05, sk); })
    ];
    if (!o.headless) parts.push(P('head', 'torso', [0, 0.6, 0], o.head || (m => m.cbox(0, 0.16, 0, 0.13, 0.16, 0.14, sk))));
    if (o.tail) parts.push(P('tail', 'hips', [0, 0, -0.12], m => { m.cyl(0, 0, 0, 0.14, 0.04, 1.0, 6, sk).idx; }));
    return parts;
  }
  function humanPose(a, o = {}) {
    const w = a.walk, mv = a.move, s = sin(w), c = cos(w);
    const r = {
      hips: [0, 0, 0, 0, Math.abs(c) * 0.06 * mv, 0],
      legL: [-s * 0.75 * mv, 0, 0], legR: [s * 0.75 * mv, 0, 0],
      shinL: [Math.max(0, s) * 1.0 * mv, 0, 0], shinR: [Math.max(0, -s) * 1.0 * mv, 0, 0],
      torso: [-0.12 * mv, 0, 0], armL: [s * 0.6 * mv, 0, 0.08], armR: [-s * 0.6 * mv, 0, -0.08]
    };
    if (o.bombs) { r.armL = [-2.5 + s * 0.2, 0, 0.25]; r.armR = [-2.5 - s * 0.2, 0, -0.25]; r.torso = [-0.25, 0, 0]; }
    if (o.aim) { const k = Math.max(a.attack, a.aim || 0); r.armR = [-1.5 * k + r.armR[0] * (1 - k) - a.attack * 0.3, 0, -0.08]; }
    if (o.tail) r.tail = [-1.2 + sin(w * 0.5) * 0.15, sin(w) * 0.3, 0];
    return r;
  }

  const MODELS = {};
  MODELS.kamikaze = rig(humanoid({ skin: 0xb08058, shirt: 0x4a5a2a, pants: 0x8a7a50, headless: true, weapon: 'bombs', belt: 0x2a2010 }), a => humanPose(a, { bombs: true }));
  MODELS.rocketeer = rig(humanoid({ skin: 0xb08058, shirt: 0x6a4a2a, pants: 0x5a4a30, headless: true, weapon: 'tube', sleeves: true, belt: 0x201810 }), a => humanPose(a, { aim: true }));
  MODELS.firecracker = rig(humanoid({ skin: 0xb08058, shirt: 0x2a3a7a, pants: 0x303048, headless: true, weapon: 'cannon', sleeves: true, belt: 0xc0a030 }), a => humanPose(a, { aim: true }));
  MODELS.reptiloid = rig(humanoid({
    skin: 0x4a7a3a, shirt: 0x3a6a30, pants: 0x3a5a2a, boots: 0x2a3a20, tail: true, belt: 0x8a6a2a, weapon: 'none', hip: 1.05,
    head: m => { m.cbox(0, 0.16, 0.05, 0.14, 0.15, 0.17, rgb(0x4a7a3a)); m.cbox(0, 0.1, 0.28, 0.09, 0.07, 0.1, rgb(0x4a7a3a)); m.cbox(-0.08, 0.22, 0.2, 0.03, 0.03, 0.02, E(0xffe020)); m.cbox(0.08, 0.22, 0.2, 0.03, 0.03, 0.02, E(0xffe020)); m.cyl(0, 0.3, -0.05, 0.08, 0, 0.25, 5, rgb(0x8a3020)); }
  }), a => { const r = humanPose(a, { tail: true }); const k = a.attack; r.armL = [-1.6 * k + r.armL[0] * (1 - k), 0, 0.1]; r.armR = [-1.6 * k + r.armR[0] * (1 - k), 0, -0.1]; return r; }, { scale: 1.05 });

  // ---------------------------------------------------------------- Gnaar
  MODELS.gnaar = rig([
    P('body', null, [0, 0.95, 0], m => {
      const fur = rgb(0x6a4a5a);
      m.sphere(0, 0, 0, 0.62, 0.6, 0.55, 10, 7, fur);
      m.sphere(0, 0.12, 0.42, 0.24, 0.24, 0.16, 10, 6, rgb(0xf0f0e0));
      m.sphere(0, 0.12, 0.56, 0.1, 0.1, 0.05, 8, 4, E(0x301008));
      m.box(-0.34, -0.3, 0.3, 0.34, -0.06, 0.52, rgb(0x5a0a10));
      for (let i = 0; i < 6; i++) m.box(-0.3 + i * 0.12, -0.14, 0.5, -0.25 + i * 0.12, -0.06, 0.54, rgb(0xf0f0d8));
      m.cyl(-0.35, 0.45, 0, 0.1, 0, 0.3, 5, rgb(0x4a3040)); m.cyl(0.35, 0.45, 0, 0.1, 0, 0.3, 5, rgb(0x4a3040));
    }),
    P('armL', 'body', [-0.58, 0, 0.1], m => { limb(m, 0.55, 0.14, 0.14, rgb(0x5a3a4a)); m.box(-0.1, -0.66, -0.04, 0.1, -0.55, 0.14, rgb(0xe0d0b0)); }),
    P('armR', 'body', [0.58, 0, 0.1], m => { limb(m, 0.55, 0.14, 0.14, rgb(0x5a3a4a)); m.box(-0.1, -0.66, -0.04, 0.1, -0.55, 0.14, rgb(0xe0d0b0)); }),
    P('legL', 'body', [-0.28, -0.45, 0], m => { limb(m, 0.5, 0.2, 0.22, rgb(0x5a3a4a)); m.box(-0.13, -0.56, -0.1, 0.13, -0.48, 0.22, rgb(0x3a2a30)); }),
    P('legR', 'body', [0.28, -0.45, 0], m => { limb(m, 0.5, 0.2, 0.22, rgb(0x5a3a4a)); m.box(-0.13, -0.56, -0.1, 0.13, -0.48, 0.22, rgb(0x3a2a30)); })
  ], a => {
    const s = sin(a.walk), mv = a.move, k = a.attack;
    return { body: [k * 0.5, s * 0.1 * mv, s * 0.12 * mv, 0, Math.abs(cos(a.walk)) * 0.1 * mv, k * 0.3], legL: [-s * 0.8 * mv, 0, 0], legR: [s * 0.8 * mv, 0, 0], armL: [s * 0.7 * mv - k * 1.8, 0, 0.3], armR: [-s * 0.7 * mv - k * 1.8, 0, -0.3] };
  });

  // ---------------------------------------------------------------- Kleer skeleton (four-legged bone centaur)
  const BONE = rgb(0xd8cfb4), BONED = rgb(0xa89c80);
  const boneLeg = (n, p, at) => [P(n, p, at, m => limb(m, 0.6, 0.1, 0.1, BONE)), P(n + 'b', n, [0, -0.6, 0], m => { limb(m, 0.55, 0.08, 0.08, BONE); m.box(-0.08, -0.6, -0.05, 0.08, -0.53, 0.14, BONED); })];
  MODELS.kleer = rig([
    P('pelvis', null, [0, 1.15, 0], m => { m.box(-0.22, -0.1, -0.7, 0.22, 0.1, 0.5, BONE); for (let i = 0; i < 5; i++) m.box(-0.28, -0.14, -0.55 + i * 0.22, 0.28, 0.02, -0.5 + i * 0.22, BONED); }),
    ...boneLeg('fl', 'pelvis', [-0.2, -0.05, 0.4]), ...boneLeg('fr', 'pelvis', [0.2, -0.05, 0.4]),
    ...boneLeg('bl', 'pelvis', [-0.2, -0.05, -0.6]), ...boneLeg('br', 'pelvis', [0.2, -0.05, -0.6]),
    P('spine', 'pelvis', [0, 0.05, 0.45], m => {
      m.box(-0.06, 0, -0.06, 0.06, 0.75, 0.06, BONE);
      for (let i = 0; i < 4; i++) { const y = 0.25 + i * 0.13, w = 0.3 - i * 0.02; m.box(-w, y, -0.12, w, y + 0.05, 0.16, BONE); }
      m.box(-0.36, 0.72, -0.1, 0.36, 0.8, 0.1, BONE);
    }),
    P('skull', 'spine', [0, 0.82, 0.05], m => {
      m.cbox(0, 0.15, 0.05, 0.15, 0.15, 0.18, BONE); m.cbox(0, 0.05, 0.22, 0.1, 0.06, 0.08, BONED);
      m.cbox(-0.07, 0.18, 0.22, 0.04, 0.04, 0.02, E(0xff3010)); m.cbox(0.07, 0.18, 0.22, 0.04, 0.04, 0.02, E(0xff3010));
      m.with(M4.rotZ(M4.translate(M4.create(), -0.12, 0.26, 0), 0.7), q => q.cyl(0, 0, 0, 0.05, 0, 0.35, 5, BONED));
      m.with(M4.rotZ(M4.translate(M4.create(), 0.12, 0.26, 0), -0.7), q => q.cyl(0, 0, 0, 0.05, 0, 0.35, 5, BONED));
    }),
    P('armL', 'spine', [-0.38, 0.74, 0], m => { limb(m, 0.5, 0.07, 0.07, BONE); limb(m, 0.45, 0.06, 0.06, BONE, 0.5); m.box(-0.1, -1.1, -0.02, 0.1, -0.95, 0.15, BONED); }),
    P('armR', 'spine', [0.38, 0.74, 0], m => { limb(m, 0.5, 0.07, 0.07, BONE); limb(m, 0.45, 0.06, 0.06, BONE, 0.5); m.sphere(0, -1.05, 0.05, 0.14, 0.14, 0.14, 8, 5, rgb(0x505050)); })
  ], a => {
    const w = a.walk, mv = a.move, k = a.attack, s = sin(w), c = cos(w);
    return {
      pelvis: [s * 0.08 * mv, 0, 0, 0, Math.abs(c) * 0.25 * mv, 0],
      fl: [-s * 0.9 * mv, 0, 0], fr: [-sin(w + 0.4) * 0.9 * mv, 0, 0], bl: [sin(w) * 0.9 * mv, 0, 0], br: [sin(w + 0.4) * 0.9 * mv, 0, 0],
      flb: [Math.max(0, s) * 0.8 * mv, 0, 0], frb: [Math.max(0, sin(w + 0.4)) * 0.8 * mv, 0, 0], blb: [-Math.max(0, -s) * 0.6 * mv, 0, 0], brb: [-Math.max(0, -sin(w + 0.4)) * 0.6 * mv, 0, 0],
      spine: [-0.1 + k * 0.3, 0, 0], armL: [-0.5 - k * 1.6, 0, 0.2], armR: [-0.5 - k * 1.2 + s * 0.3 * mv, 0, -0.2]
    };
  });

  // ---------------------------------------------------------------- Werebull
  const HIDE = rgb(0x5a3a24), HORN = rgb(0xe8e0c8), PLATE = rgb(0x6a6a70);
  const bullLeg = (n, at) => P(n, 'body', at, m => { limb(m, 1.0, 0.3, 0.32, HIDE); m.box(-0.18, -1.12, -0.18, 0.18, -0.98, 0.2, rgb(0x2a1a10)); });
  MODELS.werebull = rig([
    P('body', null, [0, 1.35, 0], m => {
      m.box(-0.62, -0.5, -1.1, 0.62, 0.5, 1.0, HIDE); m.box(-0.66, 0.1, 0.1, 0.66, 0.78, 1.05, rgb(0x4a2e1c));
      m.box(-0.5, 0.45, -0.9, 0.5, 0.6, 0.0, PLATE); m.box(-0.7, -0.2, 0.2, -0.6, 0.4, 0.9, PLATE); m.box(0.6, -0.2, 0.2, 0.7, 0.4, 0.9, PLATE);
      m.box(-0.05, -0.3, -1.4, 0.05, 0.1, -1.1, HIDE);
    }),
    P('head', 'body', [0, 0.25, 1.0], m => {
      m.box(-0.36, -0.45, 0, 0.36, 0.2, 0.7, HIDE); m.box(-0.28, -0.55, 0.55, 0.28, -0.2, 0.9, rgb(0x3a2418));
      m.cbox(-0.2, 0.02, 0.62, 0.05, 0.05, 0.03, E(0xff2010)); m.cbox(0.2, 0.02, 0.62, 0.05, 0.05, 0.03, E(0xff2010));
      m.with(M4.rotY(M4.rotZ(M4.translate(M4.create(), -0.35, 0.12, 0.4), 1.2), -0.5), q => q.cyl(0, 0, 0, 0.12, 0.0, 0.9, 6, HORN));
      m.with(M4.rotY(M4.rotZ(M4.translate(M4.create(), 0.35, 0.12, 0.4), -1.2), 0.5), q => q.cyl(0, 0, 0, 0.12, 0.0, 0.9, 6, HORN));
    }),
    bullLeg('fl', [-0.4, -0.4, 0.7]), bullLeg('fr', [0.4, -0.4, 0.7]), bullLeg('bl', [-0.4, -0.4, -0.8]), bullLeg('br', [0.4, -0.4, -0.8])
  ], a => {
    const w = a.walk, mv = a.move, s = sin(w), ch = a.charge || 0;
    return { body: [ch * 0.12, 0, 0, 0, Math.abs(cos(w)) * 0.12 * mv, 0], head: [0.25 + ch * 0.35 + a.attack * 0.4, 0, 0], fl: [-s * 0.7 * mv, 0, 0], br: [-s * 0.7 * mv, 0, 0], fr: [s * 0.7 * mv, 0, 0], bl: [s * 0.7 * mv, 0, 0] };
  });

  // ---------------------------------------------------------------- Scythian Witch-Harpy
  const HSK = rgb(0x6a8a6a), WING = rgb(0x3a3a4a);
  const wing = (n, side) => P(n, 'torso', [side * 0.2, 0.45, -0.1], m => {
    m.box(side > 0 ? 0 : -0.8, -0.03, -0.1, side > 0 ? 0.8 : 0, 0.03, 0.3, WING);
    m.box(side > 0 ? 0.3 : -1.4, -0.02, -0.25, side > 0 ? 1.4 : -0.3, 0.02, 0.15, rgb(0x4a4a5a));
  });
  MODELS.harpy = rig([
    P('torso', null, [0, 0.6, 0], m => { m.box(-0.2, 0, -0.12, 0.2, 0.55, 0.12, HSK); m.box(-0.22, 0.2, -0.13, 0.22, 0.4, 0.13, rgb(0x2a2a30)); m.box(-0.14, -0.2, -0.1, 0.14, 0.02, 0.1, rgb(0x2a2a30)); }),
    P('head', 'torso', [0, 0.58, 0], m => { m.cbox(0, 0.12, 0, 0.1, 0.12, 0.11, HSK); m.box(-0.13, 0.05, -0.16, 0.13, 0.28, 0.06, rgb(0x101010)); m.cbox(-0.05, 0.14, 0.11, 0.025, 0.02, 0.01, E(0xff40ff)); m.cbox(0.05, 0.14, 0.11, 0.025, 0.02, 0.01, E(0xff40ff)); }),
    wing('wingL', -1), wing('wingR', 1),
    P('legs', 'torso', [0, -0.18, 0], m => { m.box(-0.12, -0.55, -0.06, -0.02, 0, 0.06, HSK); m.box(0.02, -0.55, -0.06, 0.12, 0, 0.06, HSK); m.box(-0.14, -0.62, -0.04, 0.14, -0.55, 0.14, rgb(0xd0c080)); }),
    P('armL', 'torso', [-0.24, 0.5, 0], m => { limb(m, 0.5, 0.07, 0.07, HSK); m.box(-0.06, -0.62, 0, 0.06, -0.5, 0.12, rgb(0xd0c080)); }),
    P('armR', 'torso', [0.24, 0.5, 0], m => { limb(m, 0.5, 0.07, 0.07, HSK); m.box(-0.06, -0.62, 0, 0.06, -0.5, 0.12, rgb(0xd0c080)); })
  ], a => {
    const f = sin(a.t * 11) * 0.7, k = a.attack;
    return { torso: [0.35 + k * 0.4, 0, 0], wingL: [0, 0, -f], wingR: [0, 0, f], legs: [0.4, 0, 0], armL: [-0.4 - k * 1.5, 0, 0.2], armR: [-0.4 - k * 1.5, 0, -0.2] };
  });

  // ---------------------------------------------------------------- Marsh Hopper
  MODELS.hopper = rig([
    P('body', null, [0, 0.35, 0], m => { m.sphere(0, 0, 0, 0.3, 0.24, 0.36, 8, 6, rgb(0x5a8a2a)); m.sphere(-0.12, 0.2, 0.2, 0.08, 0.08, 0.08, 6, 4, E(0xff4010)); m.sphere(0.12, 0.2, 0.2, 0.08, 0.08, 0.08, 6, 4, E(0xff4010)); m.box(-0.18, -0.1, 0.3, 0.18, -0.02, 0.36, rgb(0x2a1010)); }),
    P('legL', 'body', [-0.25, -0.05, -0.15], m => { m.box(-0.07, -0.3, -0.25, 0.07, 0, 0.05, rgb(0x4a7a22)); m.box(-0.07, -0.34, 0, 0.07, -0.28, 0.25, rgb(0x4a7a22)); }),
    P('legR', 'body', [0.25, -0.05, -0.15], m => { m.box(-0.07, -0.3, -0.25, 0.07, 0, 0.05, rgb(0x4a7a22)); m.box(-0.07, -0.34, 0, 0.07, -0.28, 0.25, rgb(0x4a7a22)); })
  ], a => { const j = a.air || 0; return { body: [-j * 0.4, 0, 0], legL: [j * 0.9, 0, 0], legR: [j * 0.9, 0, 0] }; });

  // ---------------------------------------------------------------- Arachnoid juvenile (mechanical scorpion)
  const ARM = rgb(0x8a6a3a), ARMD = rgb(0x5a4428), GUN = rgb(0x3a3a40);
  const aLegs = [];
  for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {
    const n = `l${i}${sd > 0 ? 'r' : 'l'}`;
    aLegs.push(P(n, 'body', [sd * 0.5, 0, 0.5 - i * 0.35], m => m.box(sd > 0 ? 0 : -0.8, -0.06, -0.06, sd > 0 ? 0.8 : 0, 0.06, 0.06, ARM)));
    aLegs.push(P(n + 'b', n, [sd * 0.8, 0, 0], m => m.box(-0.05, -1.0, -0.05, 0.05, 0, 0.05, ARMD)));
  }
  MODELS.arachnoid = rig([
    P('body', null, [0, 1.0, 0], m => { m.box(-0.55, -0.25, -0.8, 0.55, 0.3, 0.8, ARM); m.box(-0.4, -0.2, 0.8, 0.4, 0.2, 1.15, ARMD); m.cbox(-0.15, 0.05, 1.16, 0.06, 0.05, 0.02, E(0x40ff40)); m.cbox(0.15, 0.05, 1.16, 0.06, 0.05, 0.02, E(0x40ff40)); }),
    ...aLegs,
    P('tail1', 'body', [0, 0.2, -0.8], m => m.box(-0.18, 0, -0.18, 0.18, 0.9, 0.18, ARM)),
    P('tail2', 'tail1', [0, 0.9, 0], m => m.box(-0.15, 0, -0.15, 0.15, 0.8, 0.15, ARMD)),
    P('gun', 'tail2', [0, 0.8, 0], m => { m.box(-0.2, -0.15, -0.3, 0.2, 0.2, 0.3, GUN); m.with(M4.rotX(M4.translate(M4.create(), 0, 0, 0.3), PI / 2), q => { q.cyl(-0.08, 0, 0, 0.05, 0.05, 0.5, 6, GUN); q.cyl(0.08, 0, 0, 0.05, 0.05, 0.5, 6, GUN); }); })
  ], a => {
    const w = a.walk, mv = a.move, r = { body: [0, 0, 0, 0, sin(w * 2) * 0.03 * mv, 0], tail1: [-0.5, 0, 0], tail2: [-1.0, 0, 0], gun: [-1.2 + a.attack * 0.2, 0, 0] };
    for (let i = 0; i < 4; i++) { const ph = w + i * 1.6; r[`l${i}l`] = [0, sin(ph) * 0.4 * mv, -0.35 + Math.max(0, cos(ph)) * 0.3 * mv]; r[`l${i}r`] = [0, -sin(ph + PI) * 0.4 * mv, 0.35 - Math.max(0, cos(ph + PI)) * 0.3 * mv]; r[`l${i}lb`] = [0, 0, 0.35]; r[`l${i}rb`] = [0, 0, -0.35]; }
    return r;
  });

  // ---------------------------------------------------------------- Biomechanoids
  function biomech(col, dark) {
    const C = rgb(col), D = rgb(dark), eye = E(0xff2020);
    const leg = (n, sd) => [
      P(n, 'hips', [sd * 0.45, 0, 0], m => m.box(-0.18, -1.0, -0.2, 0.18, 0.1, 0.2, C)),
      P(n + 'b', n, [0, -1.0, 0], m => { m.box(-0.14, -1.0, -0.14, 0.14, 0.05, 0.14, D); m.box(-0.25, -1.1, -0.2, 0.25, -0.95, 0.45, D); })
    ];
    return [
      P('hips', null, [0, 2.1, 0], m => m.box(-0.55, -0.2, -0.35, 0.55, 0.2, 0.35, D)),
      ...leg('legL', -1), ...leg('legR', 1),
      P('torso', 'hips', [0, 0.2, 0], m => {
        m.box(-0.75, 0, -0.55, 0.75, 1.2, 0.55, C); m.box(-0.5, 0.2, 0.55, 0.5, 0.9, 0.75, D);
        m.box(-0.45, 1.2, -0.35, 0.45, 1.6, 0.4, D); m.cbox(-0.2, 1.42, 0.41, 0.08, 0.05, 0.02, eye); m.cbox(0.2, 1.42, 0.41, 0.08, 0.05, 0.02, eye);
        m.box(-0.3, 1.25, 0.4, 0.3, 1.32, 0.45, rgb(0xd8d0c0));
      }),
      P('gunL', 'torso', [-0.95, 0.75, 0], m => { m.box(-0.25, -0.3, -0.5, 0.25, 0.3, 0.6, D); m.with(M4.rotX(M4.create(), PI / 2), q => q.cyl(0, 0.6, 0, 0.16, 0.16, 0.4, 8, rgb(0x303030))); }),
      P('gunR', 'torso', [0.95, 0.75, 0], m => { m.box(-0.25, -0.3, -0.5, 0.25, 0.3, 0.6, D); m.with(M4.rotX(M4.create(), PI / 2), q => q.cyl(0, 0.6, 0, 0.16, 0.16, 0.4, 8, rgb(0x303030))); })
    ];
  }
  const bioPose = a => { const w = a.walk, mv = a.move, s = sin(w); return { hips: [0, 0, 0, 0, Math.abs(cos(w)) * 0.1 * mv, 0], legL: [-s * 0.5 * mv, 0, 0], legR: [s * 0.5 * mv, 0, 0], legLb: [Math.max(0, s) * 0.6 * mv, 0, 0], legRb: [Math.max(0, -s) * 0.6 * mv, 0, 0], torso: [0, s * 0.1 * mv, 0], gunL: [-a.attack * 0.2, 0, 0], gunR: [-a.attack * 0.2, 0, 0] }; };
  MODELS.biomech = rig(biomech(0x6a7a62, 0x3e4a3a), bioPose, { scale: 1 });
  MODELS.biomajor = rig(biomech(0x8a4a3a, 0x4a2a22), bioPose, { scale: 1.75 });

  // ---------------------------------------------------------------- Lava golem
  const ROCK = rgb(0x4a3a32), LAVA = E(0xff6a10);
  MODELS.golem = rig([
    P('hips', null, [0, 1.3, 0], m => { m.box(-0.7, -0.3, -0.5, 0.7, 0.3, 0.5, ROCK); m.box(-0.3, -0.05, 0.5, 0.3, 0.05, 0.52, LAVA); }),
    P('legL', 'hips', [-0.4, -0.2, 0], m => { m.box(-0.3, -1.1, -0.35, 0.3, 0, 0.35, ROCK); m.box(-0.31, -0.6, -0.1, 0.31, -0.5, 0.1, LAVA); }),
    P('legR', 'hips', [0.4, -0.2, 0], m => { m.box(-0.3, -1.1, -0.35, 0.3, 0, 0.35, ROCK); m.box(-0.31, -0.6, -0.1, 0.31, -0.5, 0.1, LAVA); }),
    P('torso', 'hips', [0, 0.25, 0], m => { m.box(-1.0, 0, -0.7, 1.0, 1.7, 0.7, ROCK); m.box(-0.6, 0.4, 0.7, 0.6, 1.3, 0.72, LAVA); m.box(-1.02, 0.8, -0.2, 1.02, 0.9, 0.2, LAVA); m.box(-0.4, 1.7, -0.4, 0.4, 2.3, 0.4, ROCK); m.cbox(-0.17, 2.05, 0.41, 0.09, 0.06, 0.02, E(0xffe040)); m.cbox(0.17, 2.05, 0.41, 0.09, 0.06, 0.02, E(0xffe040)); }),
    P('armL', 'torso', [-1.25, 1.4, 0], m => { m.box(-0.35, -1.6, -0.35, 0.35, 0.2, 0.35, ROCK); m.sphere(0, -1.8, 0.1, 0.45, 0.4, 0.45, 7, 5, ROCK); m.box(-0.36, -0.9, -0.1, 0.36, -0.8, 0.1, LAVA); }),
    P('armR', 'torso', [1.25, 1.4, 0], m => { m.box(-0.35, -1.6, -0.35, 0.35, 0.2, 0.35, ROCK); m.sphere(0, -1.8, 0.1, 0.45, 0.4, 0.45, 7, 5, ROCK); m.box(-0.36, -0.9, -0.1, 0.36, -0.8, 0.1, LAVA); })
  ], a => { const s = sin(a.walk), mv = a.move, k = a.attack; return { legL: [-s * 0.5 * mv, 0, 0], legR: [s * 0.5 * mv, 0, 0], armL: [s * 0.4 * mv, 0, 0.1], armR: [-s * 0.4 * mv - k * 2.6, 0, -0.1], torso: [0.1, s * 0.08 * mv, 0] }; });

  // ---------------------------------------------------------------- Ugh-Zan III (boss) — built ~2.4 m tall, scaled up
  const UZ = rgb(0x7a4a3a), UZD = rgb(0x4a2a24), UZG = rgb(0xc8a040);
  MODELS.ughzan = rig([
    P('hips', null, [0, 1.05, 0], m => { m.box(-0.35, -0.12, -0.22, 0.35, 0.14, 0.22, UZD); m.box(-0.3, -0.35, 0.15, 0.3, 0.1, 0.25, UZG); }),
    P('legL', 'hips', [-0.22, -0.05, 0], m => limb(m, 0.5, 0.26, 0.28, UZ)), P('shinL', 'legL', [0, -0.5, 0], m => { limb(m, 0.45, 0.22, 0.24, UZD); m.box(-0.16, -0.52, -0.15, 0.16, -0.42, 0.28, UZG); }),
    P('legR', 'hips', [0.22, -0.05, 0], m => limb(m, 0.5, 0.26, 0.28, UZ)), P('shinR', 'legR', [0, -0.5, 0], m => { limb(m, 0.45, 0.22, 0.24, UZD); m.box(-0.16, -0.52, -0.15, 0.16, -0.42, 0.28, UZG); }),
    P('torso', 'hips', [0, 0.1, 0], m => { m.box(-0.45, 0, -0.28, 0.45, 0.85, 0.3, UZ); m.box(-0.55, 0.55, -0.3, 0.55, 0.9, 0.32, UZD); m.box(-0.2, 0.2, 0.3, 0.2, 0.5, 0.33, E(0xff8020)); m.box(-0.35, 0.9, -0.3, 0.35, 1.0, 0.2, UZG); }),
    P('head', 'torso', [0, 0.95, 0.05], m => {
      m.cbox(0, 0.15, 0.05, 0.16, 0.17, 0.17, UZD); m.cbox(0, 0.05, 0.2, 0.12, 0.07, 0.06, UZ);
      m.cbox(-0.07, 0.19, 0.22, 0.04, 0.025, 0.01, E(0xffe020)); m.cbox(0.07, 0.19, 0.22, 0.04, 0.025, 0.01, E(0xffe020));
      for (const [x, rz] of [[-0.12, 0.6], [0.12, -0.6], [-0.08, 0.25], [0.08, -0.25]]) m.with(M4.rotZ(M4.translate(M4.create(), x, 0.28, 0), rz), q => q.cyl(0, 0, 0, 0.05, 0, 0.3, 5, UZG));
    }),
    P('armL', 'torso', [-0.62, 0.78, 0], m => { limb(m, 0.45, 0.2, 0.22, UZ); limb(m, 0.4, 0.18, 0.2, UZD, 0.45); m.box(-0.12, -0.95, -0.1, 0.12, -0.82, 0.14, UZG); }),
    P('armR', 'torso', [0.62, 0.78, 0], m => { limb(m, 0.45, 0.2, 0.22, UZ); m.box(-0.18, -0.95, -0.2, 0.18, -0.4, 0.25, rgb(0x3a3a40)); m.with(M4.rotX(M4.translate(M4.create(), 0, -0.85, 0.2), PI / 2), q => q.cyl(0, 0, 0, 0.12, 0.12, 0.35, 8, rgb(0x2a2a30))); }),
    P('pod', 'torso', [-0.45, 1.0, -0.1], m => { m.box(-0.18, 0, -0.2, 0.18, 0.28, 0.25, UZD); for (let i = 0; i < 3; i++) m.cbox(-0.1 + i * 0.1, 0.14, 0.26, 0.04, 0.04, 0.02, E(0xffa030)); })
  ], a => { const r = humanPose(a); const k = a.attack; r.armR = [-1.5 * Math.max(k, a.aim || 0), 0, -0.1]; r.armL = [-2.2 * (a.stomp || 0) + r.armL[0], 0, 0.15]; r.torso = [0.05 - (a.stomp || 0) * 0.2, 0, 0]; return r; }, { scale: 9.5 });

  // ================================================================ first-person weapons (camera space: -z forward)
  const MET = rgb(0x50545c), MET2 = rgb(0x2e3036), WOOD = rgb(0x7a4a24), BRASS = rgb(0xc8a050), GRIP = rgb(0x3a2418);
  const tube = (m, x, y, z0, len, r, c, n = 8) => m.with(M4.rotX(M4.translate(M4.create(), x, y, z0), -PI / 2), q => q.cyl(0, 0, 0, r, r, len, n, c));
  const VIEW = {
    knife: { body: m => { m.box(-0.02, -0.03, -0.05, 0.02, 0.03, 0.12, GRIP); m.box(-0.05, -0.04, -0.07, 0.05, 0.04, -0.05, BRASS); m.box(-0.008, -0.03, -0.35, 0.008, 0.035, -0.07, rgb(0xd0d4dc)); } },
    colt: { body: m => { tube(m, 0, 0.026, -0.07, 0.25, 0.013, MET, 8); m.box(-0.005, 0.036, -0.32, 0.005, 0.044, -0.07, MET); m.box(-0.018, -0.004, -0.085, 0.018, 0.05, 0.035, MET2); m.box(-0.005, 0.045, 0.025, 0.005, 0.07, 0.045, MET2); m.box(-0.003, -0.04, -0.035, 0.003, -0.004, -0.03, MET2); m.box(-0.003, -0.044, -0.035, 0.003, -0.038, 0.012, MET2); m.with(M4.rotX(M4.translate(M4.create(), 0, 0.0, 0.03), 0.35), q => q.box(-0.017, -0.12, -0.005, 0.017, 0.0, 0.042, WOOD)); m.box(-0.003, 0.044, -0.318, 0.003, 0.057, -0.306, MET2); },
      cyl: m => { tube(m, 0, 0.019, 0.0, 0.075, 0.03, MET, 8); for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; tube(m, cos(a) * 0.017, 0.019 + sin(a) * 0.017, 0.002, 0.079, 0.007, BRASS, 6); } } },
    shotgun: { body: m => { tube(m, 0, 0.03, -0.1, 0.62, 0.022, MET2); tube(m, 0, -0.01, -0.1, 0.5, 0.02, MET); m.box(-0.035, -0.04, -0.1, 0.035, 0.05, 0.12, MET); m.box(-0.03, -0.12, 0.1, 0.03, 0.02, 0.4, WOOD); } , pump: m => m.box(-0.04, -0.045, -0.5, 0.04, 0.02, -0.34, WOOD) },
    dshotgun: { body: m => { tube(m, -0.025, 0.02, -0.12, 0.62, 0.025, MET2); tube(m, 0.025, 0.02, -0.12, 0.62, 0.025, MET2); m.box(-0.055, -0.04, -0.14, 0.055, 0.04, 0.1, MET); m.box(-0.04, -0.14, 0.08, 0.04, 0.02, 0.42, WOOD); m.box(-0.05, -0.05, -0.45, 0.05, -0.01, -0.2, WOOD); } },
    tommy: { body: m => { tube(m, 0, 0.02, -0.14, 0.52, 0.018, MET2); m.box(-0.045, -0.04, -0.3, 0.045, 0.05, 0.08, MET); m.box(-0.05, -0.12, -0.3, 0.05, -0.03, -0.12, WOOD); m.with(M4.rotX(M4.create(), PI / 2), q => q.cyl(0, -0.12, 0.13, 0.09, 0.09, 0.05, 12, MET2)); m.box(-0.035, -0.12, 0.08, 0.035, 0.04, 0.42, WOOD); } },
    minigun: { body: m => { m.box(-0.1, -0.1, -0.1, 0.1, 0.08, 0.25, MET); m.box(-0.03, 0.08, -0.05, 0.03, 0.14, 0.2, MET2); m.box(-0.08, -0.2, 0.1, 0.08, -0.1, 0.2, GRIP); },
      spin: m => { for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; tube(m, cos(a) * 0.05, sin(a) * 0.05, -0.1, 0.62, 0.015, MET2, 6); } m.with(M4.rotX(M4.translate(M4.create(), 0, 0, -0.55), -PI / 2), q => q.cyl(0, 0, 0, 0.085, 0.085, 0.03, 10, MET)); m.with(M4.rotX(M4.translate(M4.create(), 0, 0, -0.2), -PI / 2), q => q.cyl(0, 0, 0, 0.085, 0.085, 0.03, 10, MET)); } },
    rocket: { body: m => { tube(m, 0, 0, -0.05, 0.55, 0.06, rgb(0x5a6a4a), 10); m.box(-0.1, -0.1, -0.05, 0.1, 0.1, 0.2, MET); m.box(-0.03, -0.2, 0.05, 0.03, -0.08, 0.14, GRIP); },
      spin: m => { for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + PI / 4; tube(m, cos(a) * 0.075, sin(a) * 0.075, -0.1, 0.22, 0.035, MET2, 6); } } },
    grenade: { body: m => { tube(m, 0, 0, -0.12, 0.45, 0.055, rgb(0x4a5a3a), 10); m.with(M4.rotX(M4.translate(M4.create(), 0, 0, 0.05), PI / 2), q => q.cyl(0, 0, 0, 0.1, 0.1, 0.1, 10, MET)); m.box(-0.03, -0.18, 0.05, 0.03, -0.06, 0.14, GRIP); m.box(-0.04, -0.1, 0.12, 0.04, 0.0, 0.4, rgb(0x4a4030)); } },
    laser: Object.assign({ body: m => { m.box(-0.1, -0.08, -0.15, 0.1, 0.04, 0.2, rgb(0x5a6068)); m.box(-0.06, -0.18, 0.05, 0.06, -0.08, 0.16, GRIP); m.box(-0.11, -0.03, -0.1, 0.11, 0.02, 0.1, E(0x40ff60)); m.box(-0.085, -0.065, -0.18, 0.085, 0.075, -0.15, MET2); } },
      ...S.DATA.WEAPONS.laser.barrels.map(([x, y], i) => ({ ['barrel' + i]: m => { tube(m, x, y, -0.17, 0.45, 0.02, MET2, 6); tube(m, x, y, -0.2, 0.035, 0.026, MET, 6); tube(m, x, y, -0.59, 0.03, 0.024, MET, 6); tube(m, x, y, -0.615, 0.006, 0.014, E(0x60ff70), 6); } }))),
    cannon: { body: m => { tube(m, 0, 0, -0.05, 0.6, 0.12, rgb(0x3a3028), 12); tube(m, 0, 0, -0.07, 0.08, 0.14, BRASS, 12); m.with(M4.rotX(M4.translate(M4.create(), 0, 0, 0.1), PI / 2), q => q.cyl(0, 0, 0, 0.15, 0.1, 0.12, 12, rgb(0x3a3028))); m.box(-0.12, -0.18, -0.05, 0.12, -0.1, 0.25, WOOD); } }
  };
  // hand position, muzzle point (camera space)
  const VIEW_POS = {
    knife: { at: [0.22, -0.22, -0.4], muzzle: [0, 0, -0.35] }, colt: { at: [0.15, -0.16, -0.36], muzzle: [0, 0.026, -0.33] },
    shotgun: { at: [0.18, -0.2, -0.3], muzzle: [0, 0.03, -0.73] }, dshotgun: { at: [0.18, -0.2, -0.3], muzzle: [0, 0.02, -0.75] },
    tommy: { at: [0.17, -0.2, -0.32], muzzle: [0, 0.02, -0.67] }, minigun: { at: [0.17, -0.2, -0.28], muzzle: [0, 0, -0.73] },
    rocket: { at: [0.18, -0.2, -0.3], muzzle: [0, 0, -0.6] }, grenade: { at: [0.18, -0.21, -0.3], muzzle: [0, 0, -0.58] },
    laser: { at: [0.17, -0.2, -0.32], muzzle: [0, 0.02, -0.62] }, cannon: { at: [0.19, -0.27, -0.4], muzzle: [0, 0, -0.66] }
  };

  // ================================================================ pickups & projectiles (centred at origin, ~0.5 m)
  const mk = fn => { const m = new Mesh(); fn(m); return m; };
  const cross = (m, s, col) => { m.cbox(0, 0, 0, s, s, s * 0.6, rgb(0xf0f0f0)); m.cbox(0, 0, s * 0.62, s * 0.2, s * 0.65, 0.01, col); m.cbox(0, 0, s * 0.62, s * 0.65, s * 0.2, 0.01, col); m.cbox(0, 0, -s * 0.62, s * 0.2, s * 0.65, 0.01, col); m.cbox(0, 0, -s * 0.62, s * 0.65, s * 0.2, 0.01, col); };
  const vest = (m, s, col) => { m.box(-0.3 * s, -0.35 * s, -0.12 * s, 0.3 * s, 0.25 * s, 0.12 * s, col); m.box(-0.3 * s, 0.25 * s, -0.12 * s, -0.12 * s, 0.4 * s, 0.12 * s, col); m.box(0.12 * s, 0.25 * s, -0.12 * s, 0.3 * s, 0.4 * s, 0.12 * s, col); m.box(-0.1 * s, -0.2 * s, 0.121 * s, 0.1 * s, 0.1 * s, 0.13 * s, rgb(0x303030)); };
  const PICKUPS = {
    pill: mk(m => { m.cyl(0, -0.1, 0, 0.07, 0.07, 0.2, 8, E(0x40e0ff)); m.sphere(0, 0.1, 0, 0.07, 0.07, 0.07, 8, 4, E(0x40e0ff)); m.sphere(0, -0.1, 0, 0.07, 0.07, 0.07, 8, 4, E(0xf0f0f0)); }),
    health_s: mk(m => cross(m, 0.12, E(0x20d040))), health_m: mk(m => cross(m, 0.18, E(0x20d040))), health_l: mk(m => cross(m, 0.26, E(0x20d040))),
    health_x: mk(m => { m.sphere(-0.12, 0.08, 0, 0.18, 0.18, 0.16, 10, 6, E(0xff3030)); m.sphere(0.12, 0.08, 0, 0.18, 0.18, 0.16, 10, 6, E(0xff3030)); m.with(M4.rotZ(M4.create(), PI / 4), q => q.cbox(0, -0.1, 0, 0.19, 0.19, 0.15, E(0xff3030))); }),
    shard: mk(m => { m.sphere(0, 0, 0, 0.1, 0.18, 0.1, 4, 2, E(0xffd030)); }),
    armor_m: mk(m => vest(m, 0.8, rgb(0xd8b020))), armor_l: mk(m => vest(m, 1.0, rgb(0xd89020))), armor_x: mk(m => vest(m, 1.25, rgb(0xd86010))),
    a_shells: mk(m => { m.cbox(0, 0, 0, 0.22, 0.12, 0.14, rgb(0xa02020)); for (let i = 0; i < 4; i++) m.cyl(-0.15 + i * 0.1, 0.12, 0, 0.035, 0.035, 0.08, 6, BRASS); }),
    a_bullets: mk(m => { m.cbox(0, 0, 0, 0.22, 0.14, 0.16, rgb(0x4a5a2a)); m.cbox(0, 0.15, 0, 0.18, 0.015, 0.02, BRASS); }),
    a_rockets: mk(m => { m.cbox(0, -0.05, 0, 0.26, 0.1, 0.16, rgb(0x5a4a2a)); for (let i = 0; i < 3; i++) { m.cyl(-0.14 + i * 0.14, 0.05, 0, 0.045, 0.045, 0.14, 8, rgb(0x6a6a50)); m.cyl(-0.14 + i * 0.14, 0.19, 0, 0.045, 0, 0.08, 8, rgb(0xb02020)); } }),
    a_grenades: mk(m => { m.cbox(0, -0.05, 0, 0.24, 0.1, 0.16, rgb(0x4a4a3a)); for (let i = 0; i < 3; i++) m.sphere(-0.14 + i * 0.14, 0.1, 0, 0.065, 0.065, 0.065, 8, 5, rgb(0x3a6a2a)); }),
    a_cells: mk(m => { m.cbox(0, 0, 0, 0.12, 0.2, 0.12, rgb(0x303848)); m.cbox(0, 0, 0, 0.13, 0.12, 0.13, E(0x40ff60)); }),
    a_balls: mk(m => { for (const [x, z] of [[-0.12, -0.1], [0.12, -0.1], [0, 0.1]]) m.sphere(x, 0, z, 0.12, 0.12, 0.12, 10, 6, rgb(0x202020)); m.sphere(0, 0.18, 0, 0.12, 0.12, 0.12, 10, 6, rgb(0x202020)); }),
    serious: mk(m => { for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; m.cbox(cos(a) * 0.28, sin(a) * 0.28, 0, 0.07, 0.07, 0.07, E(0xff40e0)); } m.sphere(0, 0, 0, 0.14, 0.14, 0.14, 8, 6, E(0xffffff)); })
  };
  const PROJ_MODELS = {
    rocket: mk(m => { tube(m, 0, 0, 0.3, 0.45, 0.06, rgb(0x6a6a50)); m.with(M4.rotX(M4.translate(M4.create(), 0, 0, -0.15), -PI / 2), q => q.cyl(0, 0, 0, 0.06, 0, 0.15, 8, rgb(0xb02020))); m.box(-0.15, -0.01, 0.2, 0.15, 0.01, 0.3, rgb(0x404040)); m.box(-0.01, -0.15, 0.2, 0.01, 0.15, 0.3, rgb(0x404040)); m.cbox(0, 0, 0.32, 0.05, 0.05, 0.03, E(0xffe080)); }),
    grenade: mk(m => { m.sphere(0, 0, 0, 0.13, 0.13, 0.16, 8, 6, rgb(0x3a6a2a)); m.cbox(0, 0, 0.15, 0.05, 0.05, 0.03, E(0xff4020)); }),
    ball: mk(m => m.sphere(0, 0, 0, 0.5, 0.5, 0.5, 12, 8, rgb(0x1a1a1a))),
    chainball: mk(m => { m.sphere(0, 0, 0, 0.18, 0.18, 0.18, 8, 6, rgb(0x505050)); for (let i = 0; i < 4; i++) m.cbox(0, 0, 0.2 + i * 0.1, 0.03, 0.03, 0.04, rgb(0x707070)); })
  };

  // ================================================================ static props → { tex: Mesh } in world space
  function propMeshes(p) {
    const out = {}; const get = t => out[t] || (out[t] = new Mesh());
    const T = M4.rotY(M4.translate(M4.create(), p.x, p.y || 0, p.z), p.rot || 0);
    const W = (t, fn) => get(t).with(T, fn);
    const white = rgb(0xffffff), s = p.s || 1;
    switch (p.kind) {
      case 'column': {
        const r = p.r, h = p.h, tint = p.tint ? rgb(p.tint) : white;
        W('block', m => { m.box(-r * 1.3, 0, -r * 1.3, r * 1.3, 0.45, r * 1.3, tint, 2); m.cyl(0, h - 0.95, 0, r, r * 1.55, 0.6, 12, tint, false); m.box(-r * 1.65, h - 0.35, -r * 1.65, r * 1.65, h, r * 1.65, tint, 2); });
        W('column', m => m.cyl(0, 0.45, 0, r * 1.02, r * 0.92, h - 1.4, 12, tint, false, 2, 1 / 4));
        W('gold', m => m.cyl(0, h - 0.4, 0, r * 1.56, r * 1.6, 0.05, 12, rgb(0xffffff), false));
        break;
      }
      case 'obelisk': {
        const h = p.h, r = h * 0.07;
        W('marble', m => m.with(M4.rotY(M4.create(), PI / 4), q => q.cyl(0, 0, 0, r * 1.414, r * 0.9, h * 0.9, 4, white, false, 4, 1 / 3)));
        W('gold', m => m.with(M4.rotY(M4.create(), PI / 4), q => q.cyl(0, h * 0.9, 0, r * 0.9 * 1.0, 0, h * 0.1, 4, white, false)));
        W('block', m => m.box(-r - 0.9, 0, -r - 0.9, r + 0.9, 0.6, r + 0.9, white, 2));
        break;
      }
      case 'sphinx': {
        W('lime', m => m.with(M4.scale(M4.create(), s), q => {
          const c = rgb(0xf0e0c0);
          q.box(-1.7, 0, -5.4, 1.7, 0.8, 5.4, c, 3);
          q.box(-1.3, 0.8, -4.6, 1.3, 2.4, 2.0, c, 3); q.box(-1.1, 2.4, -4.2, 1.1, 2.6, 1.4, c, 3);
          q.box(-1.25, 0.8, 2.0, -0.45, 1.3, 5.2, c, 3); q.box(0.45, 0.8, 2.0, 1.25, 1.3, 5.2, c, 3);
          q.box(-1.0, 0.8, 1.6, 1.0, 3.3, 3.0, c, 3);
          q.box(-0.75, 3.3, 1.9, 0.75, 4.6, 3.1, rgb(0xe8d0a8), 3);
          q.box(-1.05, 2.9, 1.7, -0.7, 4.5, 2.7, rgb(0xd8c090), 3); q.box(0.7, 2.9, 1.7, 1.05, 4.5, 2.7, rgb(0xd8c090), 3);
          q.box(-0.8, 4.5, 1.8, 0.8, 4.9, 2.9, rgb(0xd8c090), 3);
          q.box(-0.18, 3.6, 3.1, 0.18, 4.1, 3.35, c, 3); q.box(-0.25, 2.9, 2.9, 0.25, 3.3, 3.2, rgb(0xa08060), 3);
        }));
        W('gold', m => m.with(M4.scale(M4.create(), s), q => { q.box(-0.1, 4.9, 2.9, 0.1, 5.2, 3.15, white); q.box(-0.45, 3.9, 3.1, -0.2, 4.0, 3.15, white); q.box(0.2, 3.9, 3.1, 0.45, 4.0, 3.15, white); }));
        break;
      }
      case 'statue': {
        W('lime', m => m.with(M4.scale(M4.create(), s), q => {
          const c = rgb(0xe8d8b8);
          q.box(-1.2, 0, -1.2, 1.2, 1.0, 1.2, c, 2); q.box(-0.55, 1.0, -0.35, -0.05, 3.4, 0.35, c, 2); q.box(0.05, 1.0, -0.2, 0.55, 3.4, 0.55, c, 2);
          q.box(-0.65, 3.4, -0.4, 0.65, 5.4, 0.4, c, 2); q.box(-0.9, 4.9, -0.45, 0.9, 5.6, 0.45, c, 2);
          q.box(-0.9, 3.7, -0.3, -0.62, 5.5, 0.3, c, 2); q.box(0.62, 3.7, -0.3, 0.9, 5.5, 0.3, c, 2); q.box(-0.7, 4.4, 0.35, 0.7, 4.7, 0.6, c, 2);
          q.box(-0.4, 5.6, -0.4, 0.4, 6.4, 0.45, c, 2); q.cyl(0, 6.4, 0, 0.42, 0.2, 1.0, 8, rgb(0xf0f0f0));
        }));
        W('gold', m => m.with(M4.scale(M4.create(), s), q => { q.box(-0.65, 3.35, -0.42, 0.65, 3.5, 0.42, white); q.cyl(0, 7.4, 0, 0.18, 0.1, 0.15, 8, white); }));
        break;
      }
      case 'palm': {
        const h = p.h; let x = 0, z = 0; const lean = 0.08 + (Math.abs(p.x * 13.1 + p.z * 7.7) % 1) * 0.1;
        W('palm', m => { for (let i = 0; i < 6; i++) { const y0 = (h * i) / 6, x1 = sin(i * 0.3) * lean * (i + 1); m.cyl(x, y0, z, 0.26 - i * 0.02, 0.24 - i * 0.02, h / 6 + 0.05, 7, white, false, 1, 1 / 1.5); x = x1; } });
        W('leaf', m => {
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * PI * 2, L = 3.2 + (i % 3) * 0.4; let px = x, py = h, pz = 0; const dx = sin(a), dz = cos(a);
            for (let k = 0; k < 4; k++) {
              const t0 = k / 4, t1 = (k + 1) / 4, w0 = 0.55 * sin(PI * (0.2 + t0 * 0.8)), w1 = 0.55 * sin(PI * (0.2 + t1 * 0.8));
              const nx = px + dx * L / 4, nz = pz + dz * L / 4, ny = py + 0.5 - k * 0.55 - k * k * 0.12;
              const ox = dz, oz = -dx, col = rgb(k < 2 ? 0x4a8a2a : 0x3a7a22);
              const ax = nx - px, ay = ny - py, az = nz - pz, sx = oz * ay, sy = ox * az - oz * ax, sz = -ox * ay, sl = Math.hypot(sx, sy, sz) || 1, flip = sy < 0 ? -1 : 1;
              m.quad([[px - ox * w0, py, pz - oz * w0], [px + ox * w0, py, pz + oz * w0], [nx + ox * w1, ny, nz + oz * w1], [nx - ox * w1, ny, nz - oz * w1]], [sx / sl * flip, sy / sl * flip, sz / sl * flip], [[0, t0], [1, t0], [1, t1], [0, t1]], col);
              px = nx; py = ny; pz = nz;
            }
          }
        });
        break;
      }
      case 'rock': {
        W('rock', m => {
          const b = m.count; m.sphere(0, p.h * 0.35, 0, p.s, p.h * 0.65, p.s * 0.8, 7, 5, rgb(0xc0a080));
          for (let i = b; i < m.count; i++) { const k = i * 3, n = S.hash2(i * 7 + (p.x | 0), i * 3 + (p.z | 0), 3) * 0.5 + 0.75; m.pos[k] = p.x + (m.pos[k] - p.x) * n; m.pos[k + 2] = p.z + (m.pos[k + 2] - p.z) * n; m.pos[k + 1] = Math.max(-0.5, (m.pos[k + 1] - (p.y || 0)) * n); }
        });
        break;
      }
      case 'pyramid': {
        W('lime', m => m.pyramid(0, 0, 0, p.half, p.h, p.tint ? rgb(p.tint) : white, 8));
        W('gold', m => { const f = 0.05; m.pyramid(0, p.h * (1 - f) - 0.05, 0, p.half * f + 0.1, p.h * f + 0.2, white); });
        break;
      }
      case 'torch': {
        W('gate', m => { m.box(-0.08, -0.5, -0.08, 0.08, 0.35, 0.08, rgb(0x806040)); m.cyl(0, 0.3, 0, 0.1, 0.22, 0.25, 8, rgb(0x806040)); });
        break;
      }
      case 'brazier': {
        W('gate', m => { m.cyl(0, 0, 0, 0.35, 0.15, 0.9, 8, rgb(0xa08050)); m.cyl(0, 0.9, 0, 0.3, 0.6, 0.35, 10, rgb(0xa08050)); m.cyl(0, 0.0, 0, 0.5, 0.45, 0.1, 10, rgb(0x806040)); });
        break;
      }
      default: break;
    }
    return out;
  }

  S.MODELS = MODELS; S.VIEW = VIEW; S.VIEW_POS = VIEW_POS; S.PICKUPS = PICKUPS; S.PROJ_MODELS = PROJ_MODELS; S.propMeshes = propMeshes;
  // world-space part matrices of a rig for a given pose state (used by the renderer and for gibs)
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
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.SeriousSam98 = globalThis.SeriousSam98 || {});
