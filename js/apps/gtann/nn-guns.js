(function (N) {
  'use strict';

  const T = n => N.TEX[n];
  const WL = () => T('white');
  const C = {
    blk: [46, 47, 50, 255], dark: [30, 30, 32, 255], blued: [58, 60, 68, 255], steel: [184, 184, 190, 255], silver: [170, 168, 160, 255],
    wood: [128, 80, 44, 255], wood2: [104, 62, 34, 255], plum: [96, 40, 30, 255], bak: [74, 46, 32, 255], lam: [112, 70, 42, 255],
    olive: [78, 88, 58, 255], olive2: [62, 72, 46, 255], brass: [204, 164, 72, 255], poly: [38, 38, 40, 255], glass: [74, 96, 62, 255], rag: [210, 200, 180, 255]
  };

  const solid = (mb, x0, y0, z0, x1, y1, z1, c) => mb.box(x0, y0, z0, x1, y1, z1, { layer: WL(), c, bottom: true });
  const zcone = (mb, x, y, z0, z1, r0, r1, n, c) => {
    const base = mb.nv;
    mb.ensure((n + 1) * 2 + 2, n * 12);
    const dn = (r0 - r1) / Math.max(1e-4, Math.abs(z1 - z0)) * Math.sign(z1 - z0);
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2, cx = Math.cos(a), cy = Math.sin(a), l = Math.hypot(1, dn);
      mb.v(x + cx * r0, y + cy * r0, z0, cx / l, cy / l, dn / l, i / n, 0, c, WL(), 0);
      mb.v(x + cx * r1, y + cy * r1, z1, cx / l, cy / l, dn / l, i / n, 1, c, WL(), 0);
    }
    for (let i = 0; i < n; i++) { const a = base + i * 2; mb.tri(a, a + 2, a + 3); mb.tri(a, a + 3, a + 1); }
    for (const [z, b] of [[z0, 0], [z1, 1]]) {
      const c0 = mb.v(x, y, z, 0, 0, z === Math.max(z0, z1) ? 1 : -1, 0.5, 0.5, c, WL(), 0);
      for (let i = 0; i < n; i++) mb.tri(c0, base + i * 2 + b, base + (i + 1) * 2 + b);
    }
  };
  const zcyl = (mb, x, y, z0, z1, r, n, c) => zcone(mb, x, y, z0, z1, r, r, n, c);
  const tbox = (mb, hx, za, ya0, ya1, zb, yb0, yb1, c) => {
    const P = [[-hx, ya0, za], [hx, ya0, za], [hx, ya1, za], [-hx, ya1, za], [-hx, yb0, zb], [hx, yb0, zb], [hx, yb1, zb], [-hx, yb1, zb]];
    const F = [[0, 1, 2, 3, [0, 0, Math.sign(za - zb) || -1]], [5, 4, 7, 6, [0, 0, Math.sign(zb - za) || 1]], [4, 0, 3, 7, [-1, 0, 0]], [1, 5, 6, 2, [1, 0, 0]], [3, 2, 6, 7, [0, 1, 0]], [4, 5, 1, 0, [0, -1, 0]]];
    for (const f of F) mb.quad([].concat(P[f[0]], P[f[1]], P[f[2]], P[f[3]]), f[4], [0, 0, 1, 0, 1, 1, 0, 1], c, WL(), 0);
  };
  const yring = (mb, rings, n, c) => {
    const base = mb.nv;
    for (let j = 0; j < rings.length; j++) for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2;
      const col = typeof c === 'function' ? c(i, j) : c;
      mb.v(Math.cos(a) * rings[j][1], rings[j][0], Math.sin(a) * rings[j][1], Math.cos(a), 0, Math.sin(a), i / n, j / rings.length, col, WL(), 0);
    }
    for (let j = 0; j + 1 < rings.length; j++) for (let i = 0; i < n; i++) { const a = base + j * (n + 1) + i, b = a + n + 1; mb.tri(a, b, b + 1); mb.tri(a, b + 1, a + 1); }
  };

  const WGRIP = {
    pm: { lh: [-0.032, -0.03, 0.004], mag: [0, -0.07, 0.008], tip: [0, 0.0515, -0.125], slide: [0, 0.055, 0.01], grip: 'pistol', support: 'cup', aim: 'pistol', len: 0.17 },
    rsh12: { lh: [-0.034, -0.035, 0.006], tip: [0, 0.025, -0.25], cyl: [-0.018, 0.012, -0.07], drum: [0, 0.045, -0.105], moves: { drum: 'cyl' }, grip: 'pistol', support: 'cup', aim: 'pistol', len: 0.32 },
    shotgun: { lh: [0, 0.03, -0.32], pump: [0, 0.035, -0.32], port: [0, 0.0, -0.12], tip: [0, 0.068, -0.86], moves: { lh: 'pump' }, grip: 'wrist', support: 'under', aim: 'shoulder', stock: 0.38, len: 1.3 },
    toz34: { lh: [0, -0.005, -0.3], brk: [0, 0.012, -0.13], breech: [0, 0.046, -0.14], tip: [0, 0.058, -0.86], moves: { lh: 'brk', breech: 'brk' }, grip: 'wrist', support: 'under', aim: 'shoulder', stock: 0.36, len: 1.25 },
    kiparis: { lh: [0, -0.085, -0.058], mag: [0, 0.0, -0.06], ch: [0.022, 0.04, -0.12], tip: [0, 0.035, -0.26], grip: 'pistol', support: 'mag', aim: 'chest', carry: 'low', len: 0.32 },
    bizon: { lh: [0, -0.01, -0.24], mag: [0, 0.03, -0.08], ch: [0.032, 0.075, -0.06], tip: [0, 0.06, -0.42], grip: 'rifle', support: 'under', aim: 'shoulder', stock: 0.3, len: 0.75 },
    ak: { lh: [0, 0.035, -0.31], mag: [0, 0.03, -0.1], ch: [0.034, 0.085, -0.07], tip: [0, 0.065, -0.68], grip: 'rifle', support: 'under', aim: 'shoulder', stock: 0.355, len: 1.1 },
    sks: { lh: [0, 0.0, -0.3], clip: [0, 0.092, -0.03], port: [0, 0.092, -0.03], ch: [0.032, 0.07, 0.02], tip: [0, 0.05, -0.6], grip: 'wrist', support: 'under', aim: 'shoulder', stock: 0.33, len: 1.02 },
    svd: { lh: [0, 0.045, -0.36], mag: [0, 0.03, -0.11], ch: [0.034, 0.075, -0.08], tip: [0, 0.065, -1.07], grip: 'rifle', support: 'under', aim: 'shoulder', stock: 0.38, len: 1.5 },
    vss: { lh: [0, 0.035, -0.26], mag: [0, 0.03, -0.09], ch: [0.032, 0.07, -0.06], tip: [0, 0.06, -0.53], grip: 'rifle', support: 'under', aim: 'shoulder', stock: 0.33, len: 0.92 },
    pkm: { lh: [0, 0.0, -0.3], mag: [0.07, -0.02, -0.1], cover: [0, 0.112, -0.2], lid: [0, 0.118, 0.04], moves: { lid: 'cover' }, top: [0, 0.125, -0.08], ch: [0.036, 0.05, -0.15], tip: [0, 0.06, -0.95], grip: 'rifle', support: 'under', aim: 'shoulder', carry: 'hip', stock: 0.36, len: 1.4 },
    rpg7: { lh: [0, 0.052, -0.13], mag: [0, 0.09, -0.42], muzzle: [0, 0.09, -0.42], rear: [0, 0.09, 0.53], tip: [0, 0.09, -0.42], grip: 'pistol', support: 'under', aim: 'launcher', carry: 'shoulder', len: 1.25 },
    izh38: { lh: [0, -0.008, -0.19], brk: [0, 0.042, -0.3], breech: [0, 0.046, -0.312], end: [0, 0.03, -0.66], tip: [0, 0.047, -0.79], moves: { breech: 'brk', end: 'brk' }, grip: 'wrist', support: 'under', aim: 'shoulder', stock: 0.34, len: 1.02 }
  };
  N.WGRIP = WGRIP;

  const part = (name, kind, at, build, o) => {
    const mb = new N.MB(64);
    build(mb);
    return Object.assign({ name, kind, at, mb }, o || {});
  };

  const warhead = (mb, z0) => {
    zcone(mb, 0, 0, z0 + 0.04, z0 - 0.06, 0.017, 0.017, 8, C.olive2);
    zcone(mb, 0, 0, z0 - 0.06, z0 - 0.1, 0.026, 0.043, 10, C.olive);
    zcyl(mb, 0, 0, z0 - 0.1, z0 - 0.2, 0.043, 10, C.olive);
    zcone(mb, 0, 0, z0 - 0.2, z0 - 0.3, 0.043, 0.012, 10, C.olive);
    zcyl(mb, 0, 0, z0 - 0.3, z0 - 0.34, 0.008, 6, C.steel);
  };

  const BUILD = {
    pm(mb, G) {
      solid(mb, -0.0145, 0.035, -0.125, 0.0145, 0.068, 0.035, [58, 60, 64, 255]);
      solid(mb, -0.013, 0.02, -0.105, 0.013, 0.036, -0.03, C.blk);
      solid(mb, -0.004, -0.004, -0.06, 0.004, 0.02, -0.012, C.blk);
      solid(mb, -0.016, -0.07, -0.015, 0.016, 0.035, 0.03, C.bak);
      solid(mb, -0.005, 0.04, 0.035, 0.005, 0.062, 0.046, C.blk);
      return [part('mag', 'mag', G.mag, m => { solid(m, -0.012, -0.012, -0.013, 0.012, 0.09, 0.013, [64, 64, 68, 255]); solid(m, -0.013, -0.014, -0.015, 0.013, -0.004, 0.015, C.dark); })];
    },
    rsh12(mb, G) {
      solid(mb, -0.018, -0.088, -0.012, 0.018, 0.016, 0.036, C.poly);
      solid(mb, -0.02, 0.0, -0.075, 0.02, 0.012, 0.045, C.blk);
      solid(mb, -0.012, 0.075, -0.115, 0.012, 0.088, 0.03, C.blk);
      solid(mb, -0.02, 0.012, 0.0, 0.02, 0.08, 0.045, C.blk);
      solid(mb, -0.017, 0.006, -0.24, 0.017, 0.058, -0.105, C.blk);
      zcyl(mb, 0, 0.025, -0.255, -0.24, 0.011, 8, C.dark);
      solid(mb, -0.004, -0.008, -0.05, 0.004, 0.012, -0.01, C.blk);
      solid(mb, -0.005, 0.08, 0.03, 0.005, 0.1, 0.05, C.blk);
      solid(mb, -0.003, 0.058, -0.235, 0.003, 0.072, -0.22, C.blk);
      return [part('cyl', 'rot', G.cyl, m => {
        const ox = -G.cyl[0], oy = 0.045 - G.cyl[1];
        zcyl(m, ox, oy, -0.035, 0.035, 0.031, 10, C.blued);
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + Math.PI / 2; zcyl(m, ox + Math.cos(a) * 0.019, oy + Math.sin(a) * 0.019, -0.036, -0.03, 0.0065, 6, C.brass); }
        solid(m, -0.004, -0.004, -0.03, 0.004, oy, 0.03, C.blk);
      }, { axis: 'z', max: 1.25 })];
    },
    shotgun(mb, G) {
      solid(mb, -0.022, 0.02, -0.2, 0.022, 0.085, 0.0, C.blk);
      solid(mb, -0.004, -0.012, -0.09, 0.004, 0.02, -0.03, C.blk);
      zcyl(mb, 0, 0.068, -0.86, -0.2, 0.011, 8, C.blk);
      zcyl(mb, 0, 0.035, -0.72, -0.2, 0.0105, 8, C.blk);
      tbox(mb, 0.018, 0, -0.012, 0.072, 0.12, -0.03, 0.06, C.wood);
      tbox(mb, 0.021, 0.12, -0.035, 0.062, 0.42, -0.095, 0.072, C.wood);
      solid(mb, -0.022, -0.1, 0.42, 0.022, 0.075, 0.44, C.dark);
      return [part('pump', 'slide', G.pump, m => {
        solid(m, -0.026, -0.022, -0.1, 0.026, 0.02, 0.1, C.wood);
        for (let z = -0.08; z < 0.09; z += 0.04) solid(m, -0.0265, -0.012, z, 0.0265, 0.012, z + 0.012, [90, 55, 30, 255]);
      }, { dir: [0, 0, 1], max: 0.09 })];
    },
    toz34(mb, G) {
      solid(mb, -0.023, -0.005, -0.15, 0.023, 0.072, -0.02, C.silver);
      solid(mb, -0.0235, 0.01, -0.13, 0.0235, 0.06, -0.05, [150, 150, 140, 255]);
      solid(mb, -0.004, -0.02, -0.09, 0.004, 0.0, -0.025, C.blk);
      tbox(mb, 0.019, -0.02, -0.012, 0.066, 0.1, -0.03, 0.058, C.wood);
      tbox(mb, 0.021, 0.1, -0.035, 0.06, 0.4, -0.1, 0.07, C.wood);
      solid(mb, -0.022, -0.105, 0.4, 0.022, 0.075, 0.42, C.dark);
      solid(mb, -0.004, 0.066, 0.0, 0.004, 0.08, 0.02, C.blk);
      return [part('brk', 'rot', G.brk, m => {
        const oy = -G.brk[1], oz = -G.brk[2];
        zcyl(m, 0, 0.058 + oy, -0.86 + oz, -0.14 + oz, 0.0105, 8, C.blued);
        zcyl(m, 0, 0.034 + oy, -0.86 + oz, -0.14 + oz, 0.0105, 8, C.blued);
        solid(m, -0.004, 0.068 + oy, -0.84 + oz, 0.004, 0.074 + oy, -0.16 + oz, C.blk);
        solid(m, -0.012, 0.03 + oy, -0.86 + oz, 0.012, 0.062 + oy, -0.84 + oz, C.blk);
        solid(m, -0.021, 0.0 + oy, -0.42 + oz, 0.021, 0.03 + oy, -0.17 + oz, C.wood);
        solid(m, -0.0055, 0.074 + oy, -0.86 + oz, 0.0055, 0.08 + oy, -0.85 + oz, C.brass);
      }, { axis: 'x', max: -0.62 })];
    },
    kiparis(mb, G) {
      solid(mb, -0.016, 0.0, -0.205, 0.016, 0.056, 0.06, C.blk);
      zcyl(mb, 0, 0.035, -0.255, -0.2, 0.008, 8, C.dark);
      solid(mb, -0.015, -0.088, -0.005, 0.015, 0.0, 0.032, C.poly);
      solid(mb, -0.004, -0.024, -0.05, 0.004, 0.0, -0.005, C.blk);
      solid(mb, -0.012, 0.056, -0.185, -0.008, 0.066, 0.06, C.dark);
      solid(mb, 0.008, 0.056, -0.185, 0.012, 0.066, 0.06, C.dark);
      solid(mb, -0.015, 0.056, -0.205, 0.015, 0.098, -0.185, C.dark);
      solid(mb, -0.004, 0.056, -0.2, 0.004, 0.068, -0.19, C.blk);
      return [part('mag', 'mag', G.mag, m => solid(m, -0.0115, -0.165, -0.016, 0.0115, 0.0, 0.016, C.blued))];
    },
    bizon(mb, G) {
      solid(mb, -0.02, 0.03, -0.155, 0.02, 0.092, 0.08, C.blk);
      solid(mb, -0.016, -0.085, -0.015, 0.016, 0.03, 0.03, C.poly);
      solid(mb, -0.004, 0.0, -0.07, 0.004, 0.03, -0.015, C.blk);
      zcyl(mb, 0, 0.06, -0.38, -0.155, 0.0095, 8, C.blk);
      zcyl(mb, 0, 0.06, -0.42, -0.38, 0.014, 8, C.dark);
      solid(mb, -0.006, 0.06, -0.37, 0.006, 0.105, -0.35, C.blk);
      solid(mb, -0.018, 0.092, -0.12, 0.018, 0.102, 0.08, [52, 53, 56, 255]);
      solid(mb, 0.016, 0.0, 0.08, 0.024, 0.08, 0.36, C.dark);
      solid(mb, 0.016, -0.06, 0.32, 0.024, 0.08, 0.36, C.dark);
      solid(mb, 0.012, -0.065, 0.09, 0.024, -0.055, 0.34, C.dark);
      return [part('mag', 'mag', G.mag, m => {
        zcyl(m, 0, -0.035, -0.3, 0.0, 0.034, 10, C.poly);
        zcyl(m, 0, -0.035, -0.305, -0.3, 0.03, 10, C.dark);
      })];
    },
    ak(mb, G) {
      solid(mb, -0.016, -0.085, -0.015, 0.016, 0.03, 0.03, C.plum);
      solid(mb, -0.021, 0.03, -0.16, 0.021, 0.095, 0.1, C.blk);
      solid(mb, -0.019, 0.095, -0.12, 0.019, 0.108, 0.1, [54, 55, 58, 255]);
      solid(mb, -0.012, 0.095, -0.2, 0.012, 0.12, -0.15, C.blk);
      solid(mb, -0.004, 0.0, -0.07, 0.004, 0.03, -0.015, C.blk);
      solid(mb, -0.024, 0.03, -0.42, 0.024, 0.08, -0.2, C.plum);
      solid(mb, -0.018, 0.085, -0.4, 0.018, 0.112, -0.2, C.plum);
      zcyl(mb, 0, 0.065, -0.62, -0.42, 0.009, 8, C.blk);
      solid(mb, -0.012, 0.06, -0.47, 0.012, 0.1, -0.42, C.blk);
      solid(mb, -0.006, 0.065, -0.6, 0.006, 0.115, -0.57, C.blk);
      zcyl(mb, 0, 0.065, -0.68, -0.62, 0.013, 8, C.blk);
      tbox(mb, 0.02, 0.1, 0.0, 0.085, 0.4, -0.07, 0.065, C.plum);
      solid(mb, -0.021, -0.075, 0.4, 0.021, 0.068, 0.415, C.dark);
      return [part('mag', 'mag', G.mag, m => { solid(m, -0.013, -0.1, -0.03, 0.013, 0.0, 0.035, [134, 64, 28, 255]); solid(m, -0.013, -0.19, -0.075, 0.013, -0.1, 0.002, [134, 64, 28, 255]); })];
    },
    sks(mb, G) {
      solid(mb, -0.024, 0.0, -0.42, 0.024, 0.056, -0.05, C.wood);
      tbox(mb, 0.02, -0.06, -0.01, 0.06, 0.06, -0.025, 0.055, C.wood);
      tbox(mb, 0.021, 0.06, -0.03, 0.056, 0.38, -0.1, 0.07, C.wood);
      solid(mb, -0.022, -0.105, 0.37, 0.022, 0.072, 0.385, C.dark);
      solid(mb, -0.019, 0.04, -0.13, 0.019, 0.088, 0.06, C.blued);
      solid(mb, -0.018, 0.056, -0.4, 0.018, 0.076, -0.13, C.wood2);
      zcyl(mb, 0, 0.05, -0.6, -0.4, 0.0085, 8, C.blued);
      zcyl(mb, 0, 0.075, -0.42, -0.13, 0.0065, 6, C.blued);
      solid(mb, -0.006, 0.05, -0.565, 0.006, 0.098, -0.545, C.blued);
      solid(mb, -0.016, -0.03, -0.1, 0.016, 0.04, -0.04, C.blued);
      solid(mb, -0.004, -0.04, -0.04, 0.004, 0.0, 0.0, C.blued);
      solid(mb, -0.004, 0.022, -0.6, 0.004, 0.036, -0.33, C.steel);
      solid(mb, 0.019, 0.06, 0.005, 0.042, 0.074, 0.03, C.blued);
      return [part('clip', 'mag', G.clip, m => {
        solid(m, -0.0065, -0.002, -0.026, 0.0065, 0.006, 0.026, [150, 150, 150, 255]);
        for (let i = 0; i < 5; i++) solid(m, -0.005, 0.006, -0.024 + i * 0.0105, 0.005, 0.058, -0.016 + i * 0.0105, C.brass);
      }, { hidden: true })];
    },
    svd(mb, G) {
      solid(mb, -0.016, -0.09, -0.015, 0.016, 0.03, 0.035, C.wood);
      solid(mb, -0.021, 0.03, -0.2, 0.021, 0.095, 0.08, C.blk);
      solid(mb, -0.026, 0.035, -0.5, 0.026, 0.088, -0.2, C.wood);
      zcyl(mb, 0, 0.065, -1.0, -0.5, 0.0095, 8, C.blk);
      zcyl(mb, 0, 0.065, -1.07, -1.0, 0.012, 8, C.blk);
      zcyl(mb, -0.008, 0.155, -0.24, 0.04, 0.019, 10, [36, 36, 38, 255]);
      zcyl(mb, -0.008, 0.155, -0.28, -0.24, 0.024, 10, [36, 36, 38, 255]);
      zcyl(mb, -0.008, 0.155, 0.04, 0.1, 0.022, 10, [18, 18, 18, 255]);
      solid(mb, -0.02, 0.095, -0.16, 0.006, 0.14, -0.04, C.blk);
      tbox(mb, 0.018, 0.08, 0.02, 0.07, 0.42, 0.02, 0.07, C.wood);
      tbox(mb, 0.016, 0.03, -0.09, -0.06, 0.42, -0.09, -0.06, C.wood);
      solid(mb, -0.02, -0.1, 0.4, 0.02, 0.075, 0.44, C.wood);
      solid(mb, -0.017, 0.07, 0.14, 0.017, 0.1, 0.3, [96, 62, 36, 255]);
      return [part('mag', 'mag', G.mag, m => solid(m, -0.013, -0.13, -0.035, 0.013, 0.0, 0.03, [40, 40, 42, 255]))];
    },
    vss(mb, G) {
      solid(mb, -0.016, -0.088, -0.015, 0.016, 0.03, 0.035, C.wood);
      solid(mb, -0.02, 0.03, -0.15, 0.02, 0.09, 0.06, C.blk);
      solid(mb, -0.026, 0.034, -0.33, 0.026, 0.086, -0.15, C.poly);
      zcyl(mb, 0, 0.06, -0.53, -0.33, 0.022, 12, [44, 46, 48, 255]);
      zcyl(mb, 0, 0.06, -0.535, -0.53, 0.018, 12, C.dark);
      zcyl(mb, -0.008, 0.145, -0.17, 0.03, 0.018, 10, [36, 36, 38, 255]);
      zcyl(mb, -0.008, 0.145, -0.2, -0.17, 0.022, 10, [36, 36, 38, 255]);
      zcyl(mb, -0.008, 0.145, 0.03, 0.08, 0.021, 10, C.dark);
      solid(mb, -0.02, 0.09, -0.12, 0.006, 0.13, -0.02, C.blk);
      tbox(mb, 0.018, 0.06, 0.03, 0.08, 0.36, 0.02, 0.07, C.wood);
      tbox(mb, 0.016, 0.03, -0.088, -0.06, 0.36, -0.09, -0.06, C.wood);
      solid(mb, -0.02, -0.1, 0.34, 0.02, 0.075, 0.38, C.wood);
      return [part('mag', 'mag', G.mag, m => solid(m, -0.013, -0.11, -0.03, 0.013, 0.0, 0.03, [40, 40, 42, 255]))];
    },
    pkm(mb, G) {
      solid(mb, -0.03, 0.02, -0.22, 0.03, 0.1, 0.08, C.blk);
      zcyl(mb, 0, 0.06, -0.9, -0.22, 0.012, 8, C.blk);
      zcone(mb, 0, 0.06, -0.95, -0.9, 0.017, 0.014, 8, C.dark);
      zcyl(mb, 0, 0.035, -0.62, -0.22, 0.008, 6, C.blk);
      solid(mb, -0.006, 0.06, -0.86, 0.006, 0.11, -0.83, C.blk);
      solid(mb, -0.012, 0.075, -0.46, 0.012, 0.13, -0.44, C.blk);
      solid(mb, -0.012, 0.12, -0.46, 0.012, 0.13, -0.36, C.lam);
      solid(mb, -0.012, 0.075, -0.38, 0.012, 0.13, -0.36, C.blk);
      solid(mb, -0.014, 0.012, -0.76, -0.006, 0.022, -0.46, C.blk);
      solid(mb, 0.006, 0.012, -0.76, 0.014, 0.022, -0.46, C.blk);
      solid(mb, -0.017, -0.09, -0.01, 0.017, 0.02, 0.035, C.lam);
      solid(mb, -0.004, -0.01, -0.06, 0.004, 0.02, -0.01, C.blk);
      tbox(mb, 0.02, 0.08, 0.03, 0.09, 0.42, 0.03, 0.07, C.lam);
      tbox(mb, 0.018, 0.035, -0.09, -0.06, 0.42, -0.1, -0.07, C.lam);
      solid(mb, -0.022, -0.11, 0.4, 0.022, 0.075, 0.43, C.lam);
      solid(mb, 0.03, 0.02, -0.17, 0.045, 0.05, -0.04, C.dark);
      return [
        part('cover', 'rot', G.cover, m => solid(m, -0.031, -0.012, 0.0, 0.031, 0.006, 0.26, [54, 55, 58, 255]), { axis: 'x', max: -1.25 }),
        part('mag', 'mag', G.mag, m => {
          solid(m, -0.04, -0.16, -0.07, 0.04, 0.0, 0.07, C.olive);
          solid(m, -0.041, -0.03, -0.072, 0.041, -0.02, 0.072, C.olive2);
          for (let i = 0; i < 6; i++) solid(m, -0.044, 0.0 + i * 0.012, -0.01, -0.03, 0.009 + i * 0.012, 0.01, C.brass);
        })
      ];
    },
    rpg7(mb, G) {
      zcyl(mb, 0, 0.09, -0.42, 0.45, 0.02, 10, [58, 62, 54, 255]);
      zcone(mb, 0, 0.09, 0.45, 0.53, 0.022, 0.036, 10, C.dark);
      zcyl(mb, 0, 0.09, -0.17, 0.09, 0.032, 10, C.wood);
      solid(mb, -0.016, -0.08, -0.005, 0.016, 0.07, 0.035, C.poly);
      solid(mb, -0.004, -0.02, -0.05, 0.004, 0.07, -0.005, C.blk);
      solid(mb, -0.016, -0.06, 0.2, 0.016, 0.07, 0.24, C.poly);
      solid(mb, -0.062, 0.1, -0.08, -0.03, 0.142, 0.02, C.dark);
      zcyl(mb, -0.046, 0.121, 0.02, 0.05, 0.014, 8, C.dark);
      solid(mb, -0.004, 0.11, -0.4, 0.004, 0.13, -0.38, C.blk);
      return [part('mag', 'mag', G.mag, m => warhead(m, 0))];
    },
    izh38(mb, G) {
      const beech = [176, 120, 70, 255], beech2 = [150, 98, 56, 255];
      zcyl(mb, 0, 0.045, -0.3, 0.035, 0.0175, 10, C.blued);
      zcone(mb, 0, 0.045, 0.035, 0.06, 0.0175, 0.012, 10, C.blued);
      solid(mb, -0.004, 0.058, -0.075, 0.004, 0.072, -0.052, C.blk);
      solid(mb, -0.009, 0.068, -0.07, 0.009, 0.074, -0.06, C.blk);
      solid(mb, -0.0175, 0.022, -0.31, 0.0175, 0.05, -0.29, C.blk);
      tbox(mb, 0.018, -0.29, 0.0, 0.032, -0.06, -0.006, 0.036, beech);
      tbox(mb, 0.017, -0.06, -0.012, 0.03, 0.08, -0.05, 0.038, beech);
      tbox(mb, 0.019, 0.08, -0.05, 0.05, 0.36, -0.11, 0.062, beech);
      solid(mb, -0.02, -0.112, 0.36, 0.02, 0.064, 0.375, C.dark);
      solid(mb, -0.004, -0.03, -0.04, 0.004, 0.0, -0.034, C.blk);
      solid(mb, -0.0035, -0.026, -0.04, 0.0035, -0.022, 0.01, C.blk);
      solid(mb, -0.0035, -0.026, 0.006, 0.0035, 0.0, 0.01, C.blk);
      solid(mb, -0.0025, -0.016, -0.022, 0.0025, 0.0, -0.016, C.steel);
      return [part('brk', 'rot', G.brk, m => {
        const oy = -G.brk[1], oz = -G.brk[2];
        solid(m, -0.0115, 0.026 + oy, -0.335 + oz, 0.0115, 0.058 + oy, -0.3 + oz, C.blk);
        zcone(m, 0, 0.047 + oy, -0.79 + oz, -0.335 + oz, 0.0085, 0.0105, 8, C.blued);
        zcyl(m, 0, 0.047 + oy, -0.795 + oz, -0.78 + oz, 0.0102, 8, C.blk);
        solid(m, -0.0055, 0.056 + oy, -0.79 + oz, 0.0055, 0.068 + oy, -0.772 + oz, C.blk);
        solid(m, -0.0015, 0.062 + oy, -0.786 + oz, 0.0015, 0.07 + oy, -0.778 + oz, C.steel);
        zcyl(m, 0, 0.047 + oy, -0.313 + oz, -0.311 + oz, 0.0035, 6, C.steel);
      }, { axis: 'x', max: -1.3 })];
    },
    knife(mb) {
      solid(mb, -0.011, -0.014, -0.05, 0.011, 0.014, 0.06, C.dark);
      solid(mb, -0.013, -0.016, -0.062, 0.013, 0.022, -0.05, C.steel);
      tbox(mb, 0.0025, -0.062, -0.012, 0.018, -0.23, 0.0, 0.004, C.steel);
      return [];
    },
    knuckles(mb) {
      solid(mb, -0.022, -0.012, -0.046, 0.022, 0.012, 0.046, [192, 172, 112, 255]);
      return [];
    },
    grenade(mb) {
      const rr = [[-0.045, 0.016], [-0.035, 0.028], [-0.012, 0.032], [0.012, 0.032], [0.035, 0.026], [0.045, 0.014]];
      yring(mb, rr, 8, (i, j) => { const k = (i + j) % 2 ? 0.88 : 1; return [Math.round(76 * k), Math.round(92 * k), Math.round(52 * k), 255]; });
      solid(mb, -0.008, 0.045, -0.008, 0.008, 0.07, 0.008, [150, 150, 150, 255]);
      solid(mb, 0.008, -0.02, -0.006, 0.016, 0.07, 0.006, [130, 130, 125, 255]);
      return [];
    },
    molotov(mb) {
      const m = new N.MB(96);
      yring(m, [[-0.07, 0.0], [-0.07, 0.034], [0.06, 0.034], [0.085, 0.022], [0.1, 0.013], [0.14, 0.013], [0.14, 0.0]], 10, C.glass);
      solid(m, -0.012, 0.13, -0.012, 0.012, 0.17, 0.012, C.rag);
      solid(m, -0.004, 0.06, 0.012, 0.004, 0.15, 0.024, C.rag);
      const F = m.f, I8 = m.i8;
      for (let i = 0; i < m.nv; i++) {
        const o = i * 8, b = i * 32;
        const y = F[o + 1], z = F[o + 2];
        F[o + 1] = z;
        F[o + 2] = -y;
        const ny = I8[b + 13], nz = I8[b + 14];
        I8[b + 13] = nz;
        I8[b + 14] = -ny;
      }
      mb.append(m, 0, 0, 0, 0, 1);
      return [];
    }
  };

  const GUNS = {};
  const gun = id => {
    if (GUNS[id]) return GUNS[id];
    const mb = new N.MB(256);
    const parts = BUILD[id] ? BUILD[id](mb, WGRIP[id] || {}) : [];
    GUNS[id] = { mb, parts };
    return GUNS[id];
  };

  let ROCKET = null;
  const rocketMesh = () => {
    if (ROCKET) return ROCKET;
    const mb = new N.MB(256);
    warhead(mb, 0);
    zcyl(mb, 0, 0, 0.02, 0.36, 0.019, 8, [70, 74, 62, 255]);
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2 + Math.PI / 4, cx = Math.cos(a), cy = Math.sin(a);
      mb.quad([cx * 0.019, cy * 0.019, 0.27, cx * 0.07, cy * 0.07, 0.3, cx * 0.07, cy * 0.07, 0.38, cx * 0.019, cy * 0.019, 0.37], [-cy, cx, 0], [0, 0, 1, 0, 1, 1, 0, 1], C.dark, WL(), 0);
    }
    ROCKET = mb;
    return mb;
  };

  Object.assign(N.Models, {
    weapon: id => gun(id).mb,
    wparts: id => gun(id).parts,
    mag: id => { const p = gun(id).parts.find(q => q.kind === 'mag'); return p ? p.mb : null; },
    pump: id => { const p = gun(id).parts.find(q => q.name === 'pump'); return p ? p.mb : null; },
    proj: type => (type === 'rocket' ? rocketMesh() : gun(type === 'molotov' ? 'molotov' : 'grenade').mb)
  });

  const FXP = N.FX.prototype;
  FXP.brass = function (x, y, z, rx, rz, floor, big) {
    this.add({ x, y, z, vx: rx * (1.6 + Math.random()) + (Math.random() - 0.5) * 0.4, vy: 1.4 + Math.random() * 1.2, vz: rz * (1.6 + Math.random()) + (Math.random() - 0.5) * 0.4, t: 0, life: 1.1, s0: big ? 0.07 : 0.05, s1: big ? 0.06 : 0.04, cell: 11, col: [214, 172, 80], a: 1, grav: true, lit: true, floor: floor + 0.02, rot: Math.random() * 6 });
  };
  FXP.backblast = function (x, y, z, dx, dy, dz) {
    for (let i = 0; i < 14; i++) {
      const s = 4 + Math.random() * 7;
      this.add({ x, y, z, vx: dx * s + (Math.random() - 0.5) * 2.5, vy: dy * s + (Math.random() - 0.5) * 1.5, vz: dz * s + (Math.random() - 0.5) * 2.5, t: 0, life: 1.2 + Math.random(), s0: 0.4, s1: 2.2, cell: 1, col: [205, 200, 190], a: 0.55, rot: Math.random() * 6, drag: 2.5, lit: true });
    }
    for (let i = 0; i < 4; i++) this.add({ x: x + dx * 0.3, y: y + dy * 0.3, z: z + dz * 0.3, vx: dx * 7 + (Math.random() - 0.5) * 3, vy: dy * 7 + (Math.random() - 0.5) * 2, vz: dz * 7 + (Math.random() - 0.5) * 3, t: 0, life: 0.09 + Math.random() * 0.05, s0: 0.45, s1: 0.2, cell: 2, col: [255, 214, 160], a: 0.85, add: true, drag: 6, rot: Math.random() * 6 });
    this.flashes.push({ x, y, z, t: 0, life: 0.12, r: 10, col: [1, 0.75, 0.4], i: 2 });
  };
  FXP.trail = function (x, y, z, dx, dy, dz, step) {
    const n = Math.max(1, Math.min(5, Math.ceil((step || 0.5) / 0.5)));
    for (let i = 0; i < n; i++) {
      const b = 0.4 + (step || 0) * i / n;
      this.add({ x: x - dx * b, y: y - dy * b, z: z - dz * b, vx: (Math.random() - 0.5) * 0.4, vy: 0.2 + Math.random() * 0.3, vz: (Math.random() - 0.5) * 0.4, t: 0, life: 2.2 + Math.random() * 1.4, s0: 0.35, s1: 1.8, cell: 1, col: [222, 220, 214], a: 0.6, rot: Math.random() * 6, drag: 0.6, lit: true });
    }
    this.add({ x: x - dx * 0.38, y: y - dy * 0.38, z: z - dz * 0.38, vx: -dx * 3, vy: -dy * 3, vz: -dz * 3, t: 0, life: 0.08, s0: 0.45, s1: 0.2, cell: 2, col: [255, 210, 150], a: 1, add: true });
  };
  FXP.molotov = function (x, y, z) {
    for (let i = 0; i < 10; i++) this.add({ x, y, z, vx: (Math.random() - 0.5) * 5, vy: 1 + Math.random() * 3, vz: (Math.random() - 0.5) * 5, t: 0, life: 0.5 + Math.random() * 0.3, s0: 0.1, s1: 0.04, cell: 11, col: [200, 230, 210], a: 0.9, add: true, grav: true, floor: y - 0.3 });
    for (let i = 0; i < 8; i++) { const a = Math.random() * 6.28, s = 1 + Math.random() * 3; this.add({ x, y: y + 0.3, z, vx: Math.cos(a) * s, vy: 1.5 + Math.random() * 2, vz: Math.sin(a) * s, t: 0, life: 0.45 + Math.random() * 0.3, s0: 1.2, s1: 0.5, cell: 2, col: [255, 200, 120], a: 1, add: true, drag: 3, rot: Math.random() * 6 }); }
    this.balls.push({ x, y: y + 0.5, z, size: 1.6, t: 0, life: 0.9, seed: Math.random(), rise: 1.2 });
    this.flashes.push({ x, y: y + 1, z, t: 0, life: 0.5, r: 12, col: [1, 0.55, 0.2], i: 2 });
  };
  FXP.flameLick = function (x, y, z, s) {
    this.add({ x: x + (Math.random() - 0.5) * s, y, z: z + (Math.random() - 0.5) * s, vx: (Math.random() - 0.5) * 0.4, vy: 1.6 + Math.random(), vz: (Math.random() - 0.5) * 0.4, t: 0, life: 0.35 + Math.random() * 0.25, s0: 0.35 + Math.min(0.5, s * 0.15) + Math.random() * 0.2, s1: 0.12, cell: 2, col: [255, 190, 110], a: 1, add: true, rot: Math.random() * 6 });
  };
  FXP.steam = function (x, y, z) {
    for (let i = 0; i < 8; i++) this.add({ x: x + (Math.random() - 0.5) * 0.5, y, z: z + (Math.random() - 0.5) * 0.5, vx: (Math.random() - 0.5) * 0.6, vy: 1 + Math.random(), vz: (Math.random() - 0.5) * 0.6, t: 0, life: 1.2 + Math.random(), s0: 0.4, s1: 1.6, cell: 1, col: [230, 232, 236], a: 0.45, rot: Math.random() * 6, lit: true });
  };

  const basisMat = (o, dx, dy, dz, x, y, z, spin) => {
    let fx = -dx, fy = -dy, fz = -dz;
    const ux0 = Math.abs(fy) > 0.95 ? 1 : 0, uy0 = Math.abs(fy) > 0.95 ? 0 : 1;
    let rx = uy0 * fz - 0 * fy, ry = 0 * fx - ux0 * fz, rz = ux0 * fy - uy0 * fx;
    const rl = Math.hypot(rx, ry, rz) || 1;
    rx /= rl; ry /= rl; rz /= rl;
    let ux = fy * rz - fz * ry, uy = fz * rx - fx * rz, uz = fx * ry - fy * rx;
    const c = Math.cos(spin), s = Math.sin(spin);
    const Rx = rx * c + ux * s, Ry = ry * c + uy * s, Rz = rz * c + uz * s;
    ux = ux * c - rx * s; uy = uy * c - ry * s; uz = uz * c - rz * s;
    o[0] = Rx; o[1] = ux; o[2] = fx;
    o[3] = Ry; o[4] = uy; o[5] = fy;
    o[6] = Rz; o[7] = uz; o[8] = fz;
    o[9] = x; o[10] = y; o[11] = z;
    return o;
  };

  const AIM = {
    arc: [255, 232, 140], fireArc: [255, 160, 70], zone: [255, 196, 60], fire: [255, 120, 40],
    lethal: [255, 60, 40], warn: [255, 30, 30], wet: [120, 180, 255], hurt: [255, 190, 60]
  };
  const AIM_STEP = 0.6, AIM_SKIP = 0.7, AIM_FLOW = 1.4, AIM_DOT = 0.05, AIM_LINE = 0.03, RING_STEP = 0.55;
  const rgba = (c, a) => [c[0], c[1], c[2], Math.round(N.clamp(a, 0, 1) * 255)];

  const aimArc = (S, plan, eye, col, Rv, Uv, t) => {
    const pts = plan.pts, n = pts.length / 3, land = plan.landed < 0 ? n : plan.landed;
    const lit = rgba(col, 1), dim = rgba(col, 0.55), line = rgba(col, 0.6), lineDim = rgba(col, 0.3);
    let run = 0, next = (t * AIM_FLOW) % AIM_STEP + AIM_SKIP;
    for (let i = 1; i < n; i++) {
      const o = i * 3, ax = pts[o - 3], ay = pts[o - 2], az = pts[o - 1], dx = pts[o] - ax, dy = pts[o + 1] - ay, dz = pts[o + 2] - az;
      const L = Math.hypot(dx, dy, dz);
      if (L < 1e-4) continue;
      if (run + L > AIM_SKIP) {
        const d = Math.hypot(ax - eye[0], ay - eye[1], az - eye[2]);
        S.beam([ax, ay, az], [pts[o], pts[o + 1], pts[o + 2]], Math.max(0.12, d * AIM_LINE), 3, i > land ? lineDim : line, eye);
      }
      while (next <= run + L) {
        const k = (next - run) / L, x = ax + dx * k, y = ay + dy * k, z = az + dz * k;
        const d = Math.hypot(x - eye[0], y - eye[1], z - eye[2]);
        S.bill(x, y, z, N.clamp(d * AIM_DOT, 0.4, 3.5), 11, i > land ? dim : lit, Rv, Uv);
        next += AIM_STEP;
      }
      run += L;
    }
  };

  const aimRing = (R, yAt, x, z, r, col, a, wall) => {
    const n = Math.max(16, Math.ceil(Math.PI * 2 * r / RING_STEP));
    const dot = rgba(col, a), side = rgba(col, a * 0.45);
    let px = x + r, pz = z, py = yAt(px, pz);
    for (let i = 1; i <= n; i++) {
      const u = i / n * Math.PI * 2, qx = x + Math.cos(u) * r, qz = z + Math.sin(u) * r, qy = yAt(qx, qz);
      R.sprites.ground(px, py + 0.06, pz, 0.5, 0.5, 0, 11, dot);
      if (wall) R.addSprites.quad([px, py + wall, pz], [qx, qy + wall, qz], [qx, qy + 0.02, qz], [px, py + 0.02, pz], 12, side);
      px = qx; pz = qz; py = qy;
    }
  };

  N.Guns = {
    aim(scene, W, t, Rv, Uv) {
      const pl = W.player, plan = pl.throwPlan;
      if (!(pl.charging > 0) || !plan || pl.veh || pl.dead || !N.WEAPONS[pl.weapon].throw) return;
      const R = scene.r, city = scene.city, eye = scene.camPos, GT = N.GT;
      const fire = plan.kind === 'molotov', gy = plan.ground, blink = Math.floor(t * 5) % 2 === 0;
      const yAt = (x, z) => {
        if (plan.wet) return gy;
        let y = city.groundY(x, z, gy + 1);
        if (city.ground(x, z) === GT.WATER) { const wa = city.waterAt(x, z); if (wa) y = Math.max(y, wa.level); }
        return Math.abs(y - gy) < 1.5 ? y : gy;
      };
      aimArc(R.sprites, plan, eye, fire ? AIM.fireArc : AIM.arc, Rv, Uv, t);
      const hops = plan.hops;
      for (let i = 0; i < hops.length; i += 3) {
        const hx = hops[i], hy = hops[i + 1], hz = hops[i + 2], fy = yAt(hx, hz);
        if (hy - fy < 0.4) R.sprites.ground(hx, fy + 0.05, hz, 0.34, 0.34, 0, 8, rgba(AIM.arc, 0.7));
        else R.sprites.bill(hx, hy, hz, 0.5, 8, rgba(AIM.arc, 0.7), Rv, Uv);
      }
      const zone = plan.fizzle ? AIM.wet : plan.self && blink ? AIM.warn : fire ? AIM.fire : AIM.zone;
      const pulse = 0.8 + 0.2 * Math.sin(t * 6);
      R.sprites.ground(plan.x, gy + 0.05, plan.z, plan.radius, plan.radius, 0, 0, rgba(zone, plan.fizzle ? 0.12 : 0.2));
      aimRing(R, yAt, plan.x, plan.z, plan.radius, zone, 0.85 * pulse, plan.fizzle ? 0 : 0.75);
      if (plan.lethal > 0.3) aimRing(R, yAt, plan.x, plan.z, plan.lethal, AIM.lethal, 0.8, 0);
      R.sprites.ground(plan.x, gy + 0.07, plan.z, 0.55 * pulse, 0.55 * pulse, t, 8, rgba(zone, 0.95));
      for (const h of plan.hits) {
        const e = h.e;
        if (e === pl || e.dead) continue;
        const top = e.kind === 'veh' ? e.y + e.spec.shape.H + 0.9 : e.y + 2.2;
        const d = Math.hypot(e.x - eye[0], top - eye[1], e.z - eye[2]);
        R.sprites.bill(e.x, top + Math.sin(t * 6 + e.id) * 0.08, e.z, N.clamp(d * 0.03, 0.45, 1.3), 13, rgba(h.kill ? AIM.lethal : AIM.hurt, 0.92), Rv, Uv);
      }
    },
    draw(scene, W, fx, lights, Rv, Uv, vis, t) {
      const R = scene.r, M3 = N.M3, FT = N.FXT, WHITE = [255, 255, 255, 255];
      for (const g of W.projs) {
        if (!vis(g.x, g.z, 2)) continue;
        if (g.type === 'shell') {
          const sp = Math.hypot(g.vx, g.vy, g.vz) || 1;
          R.addSprites.bill(g.x, g.y, g.z, 0.7, 0, [255, 226, 170, 255], Rv, Uv);
          R.addSprites.bill(g.x - g.vx / sp * 0.9, g.y - g.vy / sp * 0.9, g.z - g.vz / sp * 0.9, 0.5, 0, [255, 170, 90, 170], Rv, Uv);
          if (lights.length < N.MAX_LIGHTS - 1) lights.push({ x: g.x, y: g.y, z: g.z, r: 7, c: [1.5, 1.1, 0.6] });
          continue;
        }
        if (g.type === 'rocket') {
          R.dyn.add(rocketMesh(), basisMat(new Float32Array(12), g.dx, g.dy, g.dz, g.x, g.y, g.z, g.rot), null);
          R.addSprites.bill(g.x - g.dx * 0.42, g.y - g.dy * 0.42, g.z - g.dz * 0.42, 1.1, 0, [255, 210, 150, 255], Rv, Uv);
          if (lights.length < N.MAX_LIGHTS - 1) lights.push({ x: g.x, y: g.y, z: g.z, r: 9, c: [1.6, 1.0, 0.5] });
          continue;
        }
        const M = M3.euler(g.rot, g.rot * 0.7, 0, g.x, g.y, g.z);
        R.dyn.add(N.Models.proj(g.type), M, null);
        if (g.type === 'molotov') {
          const k = 0.8 + 0.2 * Math.sin(t * 40 + g.id);
          R.fxq.bill(g.x, g.y + 0.05, g.z, 0.13 * k, 0.24 * k, FT.FLAME, 0, (g.id * 0.37) % 1, WHITE, Rv, [0, 1, 0], 0, true);
        }
      }
      for (const f of W.fires || []) {
        if (!vis(f.x, f.z, f.r + 2)) continue;
        const r = f.cur || f.r * 0.4, n = Math.max(3, Math.round(r * 3));
        for (let i = 0; i < n; i++) {
          const a = i * 2.39996 + f.id, d = r * Math.sqrt((i + 0.5) / n) * 0.85;
          const x = f.x + Math.cos(a) * d, z = f.z + Math.sin(a) * d;
          const h = (0.55 + 0.45 * Math.sin(t * (2.3 + (i % 3) * 0.7) + i * 1.7)) * (0.6 + r * 0.25) * (1 - d / (r + 0.5) * 0.5);
          R.fxq.bill(x, f.y, z, 0.32 + h * 0.35, h, FT.FLAME, 0, ((f.id * 7 + i) * 0.137) % 1, WHITE, Rv, [0, 1, 0], 0, true);
        }
        R.sprites.ground(f.x, f.y + 0.03, f.z, r + 0.4, r + 0.4, f.id, 10, [30, 24, 20, 200]);
        if (lights.length < N.MAX_LIGHTS - 1) lights.push({ x: f.x, y: f.y + 1.2, z: f.z, r: 6 + r * 2.5, c: [1.7 + 0.3 * Math.sin(t * 13 + f.id), 0.75, 0.25] });
      }
      for (const p of W.peds) {
        if (!(p.burn > 0) || p.veh || !vis(p.x, p.z, 1.5)) continue;
        const k = Math.min(1, p.burn / 1.5);
        for (let i = 0; i < 3; i++) {
          const h = (0.5 + 0.35 * Math.sin(t * 9 + i * 2.1 + p.id)) * k;
          const lie = p.dead || p.state === 'down';
          R.fxq.bill(p.x + (lie ? Math.cos(i * 2.1) * 0.5 : 0), p.y + (lie ? 0.05 : 0.2 + i * 0.45), p.z + (lie ? Math.sin(i * 2.1) * 0.5 : 0), 0.3 * k, h, FT.FLAME, 0, ((p.id + i) * 0.31) % 1, WHITE, Rv, [0, 1, 0], 0, true);
        }
        if (lights.length < N.MAX_LIGHTS - 1) lights.push({ x: p.x, y: p.y + 1.2, z: p.z, r: 7, c: [1.5, 0.7, 0.25] });
      }
    },
    held(scene, p, wpn, t) {
      if (p.weapon !== 'molotov' || !wpn) return;
      const x = wpn[2] * -0.17 + wpn[9], y = wpn[5] * -0.17 + wpn[10], z = wpn[8] * -0.17 + wpn[11];
      const k = 0.8 + 0.2 * Math.sin(t * 37 + p.id);
      scene.r.fxq.bill(x, y, z, 0.07 * k, 0.16 * k, N.FXT.FLAME, 0, (p.id * 0.29) % 1, [255, 255, 255, 255], scene.R, [0, 1, 0], 0, true);
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
