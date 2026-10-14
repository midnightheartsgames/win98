(function (S) {
  'use strict';
  const { M4, Mesh, rgb } = S;
  const PI = Math.PI, sin = Math.sin, cos = Math.cos;
  const W = [1, 1, 1, 1];
  const G = (hex) => { const c = rgb(hex); c[3] = 0; return c; };

  function xf(p) { const m = M4.create(); M4.translate(m, p.x, p.y, p.z); M4.rotY(m, p.rot || 0); M4.scale(m, p.s || 1); return m; }

  const BUILD = {
    organ(q) { for (let i = -7; i <= 7; i++) { const h = 4 + (7 - Math.abs(i)) * 0.55; q('gold').cyl(i * 0.55, 1.2, 0, 0.2, 0.2, h, 6, W, true); } q('wood').cbox(0, 0.6, 0.2, 4.4, 0.6, 0.7, W); q('wood').cbox(0, 1.4, 0.7, 1.5, 0.3, 0.3, W); },
    curtain(q) { for (let i = 0; i < 6; i++) q('curtain').cbox(i * 0.55 - 1.4, 6, 0, 0.3, 6, 0.1 + (i % 2) * 0.08, W); },
    pulpit(q) { q('wood').cbox(0, 0.6, 0, 0.6, 0.6, 0.45, W); q('gold').cbox(0, 1.22, 0, 0.66, 0.04, 0.5, W); q('plain').cbox(0, 0.6, 0.46, 0.2, 0.3, 0.01, rgb(0x9a1a1a)); },
    spardaStatue(q) {
      const c = rgb(0x9a968c);
      q('stone').cbox(0, 0.5, 0, 1.1, 0.5, 1.1, W);
      q('plain').cbox(0, 1.9, 0, 0.35, 0.9, 0.22, c); q('plain').cbox(0, 3.1, 0, 0.5, 0.35, 0.28, c); q('plain').cbox(0, 3.7, 0, 0.18, 0.22, 0.2, c);
      q('plain').cbox(0.25, 3.95, -0.05, 0.05, 0.25, 0.05, c); q('plain').cbox(-0.25, 3.95, -0.05, 0.05, 0.25, 0.05, c);
      for (const s of [-1, 1]) { q('plain').with(M4.rotZ(M4.translate(M4.create(), s * 0.55, 3.3, -0.1), s * -0.3), m => { m.cbox(s * 0.7, 0.4, 0, 0.7, 0.5, 0.04, c); m.cbox(s * 1.1, -0.2, 0, 0.3, 0.6, 0.04, c); }); }
      q('plain').cbox(0.6, 1.8, 0.3, 0.06, 1.4, 0.12, rgb(0x6a665e)); q('plain').cbox(0.6, 3.3, 0.3, 0.3, 0.06, 0.08, rgb(0x6a665e));
      q('plain').cbox(0.18, 1, 0, 0.14, 0.5, 0.18, c); q('plain').cbox(-0.18, 1, 0, 0.14, 0.5, 0.18, c);
    },
    pew(q) { q('wood').cbox(0, 0.45, 0, 5.6, 0.06, 0.32, W); q('wood').cbox(0, 0.75, -0.34, 5.6, 0.34, 0.05, W); for (const x of [-5.4, 0, 5.4]) q('wood').cbox(x, 0.3, 0, 0.12, 0.3, 0.36, W); },
    capital(q) { q('marble').cbox(0, -0.2, 0, 1, 0.2, 1, W); q('marble').cbox(0, -0.05, 0, 1.25, 0.08, 1.25, W); q('marble').cbox(0, 0, 0, 1, 0.01, 1, W); },
    chandelier(q) { q('gold').cyl(0, 0, 0, 1.6, 1.6, 0.12, 12, W, true); q('gold').cyl(0, 0.1, 0, 0.1, 0.1, 3, 6, W, false); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; q('plain').cbox(sin(a) * 1.55, 0.25, cos(a) * 1.55, 0.04, 0.12, 0.04, rgb(0xf0e8d0)); q('glow').cbox(sin(a) * 1.55, 0.42, cos(a) * 1.55, 0.05, 0.07, 0.05, G(0xffd070)); } },
    bigdoor(q) { const w = 3.6; q('door').cbox(0, 3.3, 0, w, 3.3, 0.15, W); q('gold').cbox(0, 3.3, 0.16, 0.08, 3.3, 0.02, W); },
    fountain(q) { q('marble').cyl(0, 0, 0, 3.2, 3.2, 0.8, 16, W, true); q('water').cyl(0, 0.75, 0, 2.9, 2.9, 0.02, 16, [0.7, 0.8, 1, 1], true); q('marble').cyl(0, 0.8, 0, 0.5, 0.35, 2.2, 8, W, true); q('marble').cyl(0, 3, 0, 1.2, 1.2, 0.2, 10, W, true); q('marble').cyl(0, 3.2, 0, 0.25, 0.2, 1.1, 6, W, true); },
    lamp(q) { q('iron').cyl(0, 0, 0, 0.14, 0.09, 4, 6, W, true); q('iron').cbox(0, 4, 0, 0.26, 0.05, 0.26, W); q('glow').cbox(0, 4.3, 0, 0.2, 0.26, 0.2, G(0xffd890)); q('iron').pyramid(0, 4.56, 0, 0.3, 0.3, W); },
    hanglamp(q) { q('iron').cyl(0, 0, 0, 0.03, 0.03, 1.4, 4, W, false); q('iron').cyl(0, -0.3, 0, 0.5, 0.1, 0.3, 8, W, false); q('glow').sphere(0, -0.3, 0, 0.15, 0.15, 0.15, 6, 4, G(0xffd890)); },
    altar(q) { q('marble').cbox(0, 0.5, 0, 1.6, 0.5, 0.8, W); q('curtain').cbox(0, 0.7, 0.81, 1.2, 0.3, 0.01, W); q('gold').cbox(0, 1.02, 0, 1.65, 0.03, 0.85, W); },
    stainwin(q) { q('stained').quad([[-1.4, -3.5, 0], [1.4, -3.5, 0], [1.4, 3.5, 0], [-1.4, 3.5, 0]], [0, 0, 1], [[0, 1], [1, 1], [1, 0], [0, 0]], G(0xffffff)); q('stone').cbox(0, 3.7, 0, 1.6, 0.2, 0.2, W); q('stone').cbox(0, -3.7, 0, 1.6, 0.2, 0.2, W); },
    crane(q) { const y = rgb(0xc8a030); q('metal').cbox(0, 6, 0, 0.5, 6, 0.5, y); q('metal').cbox(0, 12.2, 3, 0.4, 0.4, 7, y); q('metal').cbox(0, 12.2, -1.5, 1.2, 0.8, 1.2, y); q('iron').cyl(0, 6, 8.5, 0.03, 0.03, 6, 4, W, false); q('metal').cbox(0, 5.6, 8.5, 0.6, 0.4, 0.6, rgb(0x5a5a5a)); },
    boat(q) { q('wood').cbox(0, 0.8, 0, 2.2, 0.8, 7, W); q('plain').cbox(0, 1.7, -1, 1.4, 0.8, 2.2, rgb(0xd8d8d0)); q('iron').cyl(0, 2.4, 2, 0.08, 0.08, 4, 5, W, false); },
    minecart(q) { q('metal').cbox(0, 0.7, 0, 0.8, 0.45, 1.2, rgb(0x6a4a30)); for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) q('iron').cyl(x, 0, z, 0.25, 0.25, 0.1, 8, W, true); q('rock').cbox(0, 1.2, 0, 0.7, 0.2, 1.1, W); },
    lantern(q) { q('iron').cbox(0, 0, 0, 0.18, 0.25, 0.18, W); q('glow').cbox(0, 0, 0, 0.12, 0.18, 0.12, G(0xffb050)); },
    globe(q) { q('wood').cyl(0, 0, 0, 0.35, 0.12, 0.9, 6, W, true); q('plain').sphere(0, 1.3, 0, 0.42, 0.42, 0.42, 10, 6, rgb(0x6a8aa0)); q('gold').cyl(0, 0.9, 0, 0.5, 0.5, 0.04, 12, W, false); },
    lectern(q) { q('wood').cyl(0, 0, 0, 0.3, 0.15, 1.1, 6, W, true); q('wood').with(M4.rotX(M4.translate(M4.create(), 0, 1.2, 0), -0.4), m => m.cbox(0, 0, 0, 0.45, 0.04, 0.35, W)); q('plain').with(M4.rotX(M4.translate(M4.create(), 0, 1.25, 0), -0.4), m => m.cbox(0, 0, 0, 0.36, 0.02, 0.26, rgb(0xe8dcc0))); },
    banner(q) { q('banner').quad([[-0.9, -2.6, 0.02], [0.9, -2.6, 0.02], [0.9, 2.6, 0.02], [-0.9, 2.6, 0.02]], [0, 0, 1], [[0, 1], [1, 1], [1, 0], [0, 0]], W); q('gold').cbox(0, 2.65, 0.05, 1.05, 0.05, 0.05, W); },
    torch(q) { q('iron').cbox(0, 0, 0.1, 0.05, 0.25, 0.1, W); q('wood').cbox(0, 0.3, 0.2, 0.05, 0.2, 0.05, W); },
    deadtree(q) { q('bark').cyl(0, 0, 0, 0.35, 0.2, 5, 6, W, false); for (let i = 0; i < 5; i++) q('bark').with(M4.rotZ(M4.rotY(M4.translate(M4.create(), 0, 2.5 + i * 0.5, 0), i * 1.3), 0.9 - (i % 2) * 0.3), m => m.cyl(0, 0, 0, 0.12, 0.03, 2.2 - i * 0.25, 5, W, false)); },
    tank(q) { q('labmetal').cyl(0, 0, 0, 1.1, 1.1, 0.5, 12, W, true); q('labmetal').cyl(0, 4.5, 0, 1.1, 1.1, 0.5, 12, W, true); q('tankglass').cyl(0, 0.5, 0, 1, 1, 4, 12, [0.4, 1, 0.8, 0], false); q('plain').cbox(0, 2.4, 0, 0.25, 0.8, 0.2, rgb(0xd8d8e8)); q('plain').cbox(0, 3.35, 0, 0.12, 0.14, 0.12, rgb(0xd8d8e8)); q('plain').cbox(0, 1.3, 0, 0.18, 0.4, 0.15, rgb(0xc8c8d8)); q('iron').cyl(0, 5, 0, 0.15, 0.15, 3, 6, W, false); },
    console(q) { q('labmetal').cbox(0, 0.6, 0, 0.5, 0.6, 0.9, W); q('labmetal').with(M4.rotX(M4.translate(M4.create(), 0, 1.3, 0.2), -0.6), m => m.cbox(0, 0, 0, 0.45, 0.3, 0.05, W)); q('glow').with(M4.rotX(M4.translate(M4.create(), 0, 1.3, 0.26), -0.6), m => m.cbox(0, 0, 0, 0.38, 0.24, 0.01, G(0x40ff90))); },
    waterfall(q) { q('water').quad([[-12, 0, 0], [12, 0, 0], [12, 60, 0], [-12, 60, 0]], [0, 0, 1], [[0, 6], [3, 6], [3, 0], [0, 0]], [0.8, 0.9, 1, 0]); q('rock').cbox(-16, 30, 2, 4, 30, 6, W); q('rock').cbox(16, 30, 2, 4, 30, 6, W); },
    tree(q, p) {
      const h = 7 * (p.s || 1);
      q('bark').cyl(0, 0, 0, 0.45, 0.28, h * 0.6, 7, W, false);
      for (let i = 0; i < 4; i++) { const y = h * 0.45 + i * 0.9, r = 2.8 - i * 0.55; q('leaves').cyl(0, y, 0, r, r * 0.35, 1.6, 8, W, true); }
    },
    ruinArch(q) { q('stone').cbox(-3.2, 3, 0, 0.6, 3, 0.6, W); q('stone').cbox(3.2, 3, 0, 0.6, 3, 0.6, W); q('stone').cbox(0, 6.4, 0, 3.9, 0.5, 0.65, W); q('stone').cbox(0, 7.1, 0, 1, 0.3, 0.5, W); },
    column(q) { q('stone').cyl(0, 0, 0, 0.55, 0.5, 6, 8, W, true); q('stone').cbox(0, 6.1, 0, 0.8, 0.15, 0.8, W); },
    brokencolumn(q) { q('stone').cyl(0, 0, 0, 0.55, 0.5, 2.4, 8, W, true); q('stone').with(M4.rotZ(M4.translate(M4.create(), 1.6, 0.5, 0.4), 1.5), m => m.cyl(0, 0, 0, 0.5, 0.5, 2.2, 8, W, true)); },
    tablet(q) { q('stone').cbox(0, 0.8, 0, 0.8, 0.8, 0.2, W); q('glow').cbox(0, 1.1, 0.21, 0.55, 0.35, 0.005, G(0x4a8a7a)); },
    angelStatue(q) { const c = rgb(0xb4b0a8); q('stone').cbox(0, 0.3, 0, 0.7, 0.3, 0.7, W); q('plain').cbox(0, 1.4, 0, 0.3, 0.8, 0.22, c); q('plain').cbox(0, 2.5, 0, 0.18, 0.2, 0.18, c); for (const s of [-1, 1]) q('plain').with(M4.rotZ(M4.translate(M4.create(), s * 0.3, 2, -0.2), s * -0.4), m => m.cbox(s * 0.5, 0.3, 0, 0.5, 0.8, 0.04, c)); q('plain').cbox(0.35, 1.8, 0.2, 0.04, 1.2, 0.04, rgb(0x8a867e)); },
    tower(q) { q('castlewall').cbox(0, 20, 0, 5, 20, 5, W); q('castlewall').pyramid(0, 40, 0, 6, 10, W); q('castlewall').cbox(9, 12, 3, 4, 12, 4, W); q('castlewall').pyramid(9, 24, 3, 5, 7, W); q('glow').cbox(0, 30, 5.05, 0.6, 1, 0.01, G(0xffc060)); },
    vase(q) { q('vase').cyl(0, 0, 0, 0.22, 0.35, 0.5, 8, W, true); q('vase').cyl(0, 0.5, 0, 0.35, 0.15, 0.45, 8, W, true); q('vase').cyl(0, 0.95, 0, 0.15, 0.22, 0.2, 8, W, true); },
    candelabra(q) { q('gold').cyl(0, 0, 0, 0.3, 0.06, 1.6, 6, W, true); q('gold').cbox(0, 1.6, 0, 0.5, 0.03, 0.03, W); for (const x of [-0.5, 0, 0.5]) { q('plain').cbox(x, 1.75, 0, 0.03, 0.12, 0.03, rgb(0xf0e8d0)); q('glow').cbox(x, 1.92, 0, 0.03, 0.05, 0.03, G(0xffc060)); } },
    bench(q) { q('wood').cbox(0, 0.45, 0, 1.2, 0.05, 0.3, W); q('wood').cbox(0, 0.75, -0.28, 1.2, 0.2, 0.04, W); for (const x of [-1.05, 1.05]) q('iron').cbox(x, 0.22, 0, 0.05, 0.22, 0.3, W); },
    barrel(q) { q('barrel').cyl(0, 0, 0, 0.42, 0.42, 1.1, 10, W, true); },
    crate(q) { q('crate').cbox(0, 0.5, 0, 0.5, 0.5, 0.5, W); },
    labcrate(q) { q('labmetal').cbox(0, 0.45, 0, 0.55, 0.45, 0.45, W); q('glow').cbox(0, 0.6, 0.46, 0.2, 0.05, 0.005, G(0xffb020)); },
    tombstone(q) { q('stone').cbox(0, 0.6, 0, 0.45, 0.6, 0.12, W); q('stone').cyl(0, 1.2, -0.12, 0.45, 0.45, 0.24, 8, W, false); q('snowtex').cbox(0, 1.25, 0, 0.4, 0.05, 0.13, W); },
    rockpile(q) { q('rock').cbox(0, 0.35, 0, 0.6, 0.35, 0.5, W); q('rock').cbox(0.3, 0.8, 0.1, 0.35, 0.2, 0.3, W); q('rock').cbox(-0.35, 0.2, 0.3, 0.3, 0.2, 0.3, W); }
  };

  function propMeshes(p) {
    const out = {}, m0 = xf(p);
    const q = tex => { if (!out[tex]) { out[tex] = new Mesh(); out[tex].M = m0; } return out[tex]; };
    const f = BUILD[p.kind];
    if (f) f(q, p); else q('plain').cbox(0, 0.5, 0, 0.5, 0.5, 0.5, rgb(0xff00ff));
    for (const k in out) out[k].M = null;
    return out;
  }

  function objectMesh(kind) {
    const m = new Mesh();
    switch (kind) {
      case 'divinity': {
        const st = rgb(0x8a8680), gold = rgb(0xd8b050), glow = G(0x60e0ff);
        m.cbox(0, 0.4, 0, 0.8, 0.4, 0.8, st); m.cbox(0, 1.6, 0, 0.35, 0.8, 0.3, st); m.cbox(0, 2.7, 0, 0.22, 0.25, 0.22, st);
        for (const s of [-1, 1]) m.with(M4.rotZ(M4.translate(M4.create(), s * 0.35, 2.3, -0.1), s * -0.5), q => { q.cbox(s * 0.55, 0.4, 0, 0.55, 0.6, 0.05, st); q.cbox(s * 0.9, -0.1, 0, 0.25, 0.5, 0.05, st); });
        m.with(M4.translate(M4.create(), 0, 2.1, 0.35), q => { q.cbox(0, 0, 0, 0.3, 0.06, 0.06, st); q.sphere(0, 0.1, 0.1, 0.18, 0.18, 0.18, 8, 5, glow); });
        m.cbox(0, 0.82, 0, 0.82, 0.03, 0.82, gold);
        break;
      }
      case 'evilLegacy': { const gold = rgb(0xd8b050); m.cbox(0, 0, 0, 0.25, 0.18, 0.12, gold); m.sphere(0, 0, 0.13, 0.1, 0.1, 0.05, 6, 4, G(0xff3030)); m.cbox(0, 0.22, 0, 0.1, 0.06, 0.08, gold); break; }
      case 'frag': { const c = G(0x3a8aff); m.pyramid(0, 0, 0, 0.18, 0.3, c); m.pyramid(0, 0, 0, 0.18, -0.3, c); break; }
      case 'grip': { m.sphere(0, 0, 0, 0.35, 0.35, 0.35, 8, 6, G(0x3a9aff)); m.cyl(0, -0.05, 0, 0.6, 0.6, 0.1, 10, G(0x2060c0), false); break; }
      case 'switch': { const c = rgb(0x5a6070); m.cbox(0, -0.7, 0, 0.5, 0.7, 0.5, c); m.cyl(0, 0, 0, 0.45, 0.45, 0.6, 8, c, true); m.sphere(0, 0.9, 0, 0.35, 0.35, 0.35, 8, 5, G(0x40a8ff)); for (let i = 0; i < 4; i++) { const a = i * PI / 2; m.cbox(sin(a) * 0.5, 0.3, cos(a) * 0.5, 0.06, 0.3, 0.06, rgb(0x8a8a9a)); } break; }
      case 'switchOff': { const c = rgb(0x4a4a50); m.cbox(0, -0.7, 0, 0.5, 0.7, 0.5, c); m.cyl(0, 0, 0, 0.45, 0.45, 0.6, 8, c, true); m.sphere(0, 0.9, 0, 0.35, 0.35, 0.35, 8, 5, rgb(0x2a3040)); break; }
      case 'gyroMachine': { const c = rgb(0x6a5a44), gold = rgb(0xb89048); m.cbox(0, 1.2, 0, 1, 1.2, 0.6, c); m.cyl(0, 1.2, 0.6, 0.7, 0.7, 0.15, 10, gold, true); m.sphere(0, 1.2, 0.78, 0.25, 0.25, 0.1, 6, 4, G(0x40a0ff)); break; }
      case 'gyro': { const s = rgb(0xc8c8d0), gold = rgb(0xb89048); m.cyl(0, -0.6, 0, 0.18, 0.18, 1.2, 8, gold, true); for (let i = 0; i < 4; i++) m.with(M4.rotY(M4.create(), i * PI / 2), q => { q.cbox(0.55, 0.15, 0, 0.45, 0.04, 0.12, s); q.cbox(0.55, -0.15, 0, 0.45, 0.04, 0.12, s); }); m.sphere(0, 0.62, 0, 0.12, 0.12, 0.12, 6, 4, G(0x40a0ff)); break; }
      case 'socket': { m.cyl(0, 0, 0, 0.9, 0.9, 0.08, 12, rgb(0x5a5040), true); m.cyl(0, 0.08, 0, 0.6, 0.6, 0.02, 12, G(0x3a8aff), true); break; }
      case 'socketOn': { m.cyl(0, 0, 0, 0.9, 0.9, 0.08, 12, rgb(0x5a5040), true); m.cyl(0, 0.08, 0, 0.6, 0.6, 0.02, 12, G(0xffd040), true); break; }
      case 'cannon': { const c = rgb(0x2a2a2e), g = rgb(0x8a6a30); m.cbox(0, 0.5, 0, 0.9, 0.5, 1.2, rgb(0x4a3020)); m.with(M4.rotX(M4.translate(M4.create(), 0, 1.3, 0.2), -1.45), q => q.cyl(0, 0, 0, 0.45, 0.35, 2.2, 10, c, true)); m.cyl(0, 1.3, 0.2, 0.55, 0.55, 0.1, 10, g, false); m.sphere(0, 1.35, 2.35, 0.2, 0.2, 0.05, 6, 4, G(0xff6020)); break; }
      case 'die': { const faces = rgb(0xe8e0d0); m.cbox(0, 0, 0, 0.9, 0.9, 0.9, faces); const pip = G(0xd02020); for (const [x, y, z] of [[0, 0.91, 0], [0.91, 0.3, 0.3], [0.91, -0.3, -0.3], [-0.91, 0.35, 0.35], [-0.91, 0, 0], [-0.91, -0.35, -0.35], [0, -0.91, 0.3], [0, -0.91, -0.3], [0.3, 0.3, 0.91], [-0.3, -0.3, 0.91]]) m.cbox(x, y, z, x ? 0.01 : 0.14, y ? 0.01 : 0.14, z ? 0.01 : 0.14, pip); break; }
      case 'boardsquare': { m.cbox(0, 0.15, 0, 1.45, 0.15, 1.45, W); break; }
      case 'bars': { const c = rgb(0x2a2a30); for (let i = 0; i < 9; i++) m.cbox(-2 + i * 0.5, 2.5, 0, 0.05, 2.5, 0.05, c); m.cbox(0, 0.3, 0, 2.2, 0.08, 0.08, c); m.cbox(0, 4.8, 0, 2.2, 0.08, 0.08, c); break; }
      case 'orb': { m.sphere(0, 0, 0, 0.16, 0.16, 0.16, 6, 4, G(0xff2020)); break; }
      case 'orbGreen': { m.sphere(0, 0, 0, 0.2, 0.2, 0.2, 6, 4, G(0x30ff50)); break; }
      case 'orbWhite': { m.sphere(0, 0, 0, 0.2, 0.2, 0.2, 6, 4, G(0xf0f0ff)); break; }
      case 'orbBig': { m.sphere(0, 0, 0, 0.5, 0.5, 0.5, 8, 6, G(0xff1818)); break; }
      case 'fireball': { m.sphere(0, 0, 0, 0.5, 0.5, 0.5, 8, 5, G(0xff7020)); break; }
      case 'iceSpike': { m.pyramid(0, -0.2, 0, 0.18, 1.1, G(0xc8f0ff)); break; }
      case 'spear': { m.cbox(0, 0, 0, 0.03, 0.03, 1.2, rgb(0xf0f0ff)); m.pyramid(0, 0, 1.3, 0.08, 0.001, G(0xffe0a0)); m.with(M4.rotX(M4.translate(M4.create(), 0, 0, 1.2), PI / 2), q => q.pyramid(0, 0, 0, 0.08, 0.4, G(0xffe0a0))); break; }
      case 'bullet': { m.cbox(0, 0, 0, 0.04, 0.04, 0.35, G(0xfff0a0)); break; }
      case 'cocoon': { m.sphere(0, 1.1, 0, 0.9, 1.3, 0.9, 8, 6, [0.75, 0.92, 1, 1]); break; }
      case 'devil': { const c = G(0x3a6aff); m.sphere(0, 1.9, -0.5, 0.5, 0.6, 0.35, 8, 5, c); m.cbox(0, 1.3, -0.55, 0.5, 0.6, 0.2, c); for (const s of [-1, 1]) { m.with(M4.rotZ(M4.translate(M4.create(), s * 0.55, 1.7, -0.5), s * -0.8), q => q.cbox(s * 0.5, 0, 0, 0.5, 0.12, 0.12, c)); m.with(M4.rotZ(M4.translate(M4.create(), s * 0.25, 2.3, -0.5), s * -0.4), q => q.pyramid(0, 0, 0, 0.08, 0.5, c)); } break; }
      default: m.cbox(0, 0, 0, 0.3, 0.3, 0.3, rgb(0xff00ff));
    }
    return m;
  }

  S.propMeshes = propMeshes; S.objectMesh = objectMesh; S.PROP_BUILD = BUILD;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
