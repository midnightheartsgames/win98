(function (Z) {
  'use strict';

  const M = k => Z.MAT[k];
  const T = (mb, c) => mb.setTint(c[0], c[1], c[2], 255);
  const RIG1 = new Z.RigDef([{ name: 'root', pos: [0, 0, 0] }]);
  const steel = [62, 64, 68], dark = [44, 46, 50], wood = [128, 128, 128], blk = [36, 36, 38], brass = [176, 150, 96], bake = [104, 58, 34];
  const tone = (mb, mat, tint) => { mb.setMat(M(mat), 0, 0); T(mb, tint); };
  const orient = (mb, i0) => {
    const P = mb.pos, N = mb.nrm;
    for (let t = i0; t < mb.idx.length; t += 3) {
      const a = mb.idx[t], b = mb.idx[t + 1], c = mb.idx[t + 2];
      const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
      const wx = P[c * 3] - P[a * 3], wy = P[c * 3 + 1] - P[a * 3 + 1], wz = P[c * 3 + 2] - P[a * 3 + 2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      if (nx * N[a * 3] + ny * N[a * 3 + 1] + nz * N[a * 3 + 2] < 0) { mb.idx[t + 1] = c; mb.idx[t + 2] = b; }
    }
  };
  const slab = (mb, mat, tint, w, pts, x = 0) => {
    tone(mb, mat, tint);
    const P = [];
    for (let i = 0; i < pts.length; i += 2) P.push([pts[i], pts[i + 1]]);
    let area = 0;
    for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; area += p[0] * q[1] - q[0] * p[1]; }
    const sg = area >= 0 ? 1 : -1, h = w / 2, i0 = mb.idx.length, tris = Z.earcut(P);
    for (const sx of [-1, 1]) {
      const b = mb.n;
      for (const [z, y] of P) mb.v(x + sx * h, y, z, sx, 0, 0, z * 6, y * 6);
      for (let i = 0; i < tris.length; i += 3) mb.idx.push(b + tris[i], b + tris[i + 1], b + tris[i + 2]);
    }
    for (let i = 0; i < P.length; i++) {
      const [z0, y0] = P[i], [z1, y1] = P[(i + 1) % P.length];
      const L = Math.hypot(z1 - z0, y1 - y0) || 1, nz = (y1 - y0) / L * sg, ny = -(z1 - z0) / L * sg;
      const b = mb.n;
      mb.v(x - h, y0, z0, 0, ny, nz, 0, 0); mb.v(x + h, y0, z0, 0, ny, nz, w * 6, 0); mb.v(x + h, y1, z1, 0, ny, nz, w * 6, L * 6); mb.v(x - h, y1, z1, 0, ny, nz, 0, L * 6);
      mb.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    orient(mb, i0);
  };
  const bar = (mb, mat, tint, w, th, pts, x = 0) => {
    for (let i = 0; i + 3 < pts.length; i += 2) {
      const z0 = pts[i], y0 = pts[i + 1], z1 = pts[i + 2], y1 = pts[i + 3], L = Math.hypot(z1 - z0, y1 - y0) || 1;
      const oz = -(y1 - y0) / L * th / 2, oy = (z1 - z0) / L * th / 2, ez = (z1 - z0) / L * th * 0.4, ey = (y1 - y0) / L * th * 0.4;
      slab(mb, mat, tint, w, [z0 - ez + oz, y0 - ey + oy, z1 + ez + oz, y1 + ey + oy, z1 + ez - oz, y1 + ey - oy, z0 - ez - oz, y0 - ey - oy], x);
    }
  };
  const tube = (mb, mat, tint, y, z0, z1, r0, r1, o = {}) => { tone(mb, mat, tint); Z.MODEL_KIT.tubeAlong(mb, [[o.x || 0, y, z0], [o.x || 0, o.y1 === undefined ? y : o.y1, z1]], [r0, r1 === undefined ? r0 : r1], { b: 'root', sides: o.sides || 10, capA: o.capA !== false, capB: o.capB !== false, ref: [0, 1, 0], loft: o.double ? { double: true } : undefined }); };
  const bore = (mb, y, z, r, x = 0) => tube(mb, 'rubber', [10, 10, 10], y, z + 0.001, z - 0.0005, r, r, { x, sides: 8 });
  const part = (mb, name, fn) => { const v0 = mb.n, i0 = mb.idx.length; fn(); (mb.parts || (mb.parts = {}))[name] = [v0, mb.n, i0, mb.idx.length]; };
  const pistolBody = (mb, d, o) => {
    const L = o.len, top = o.top, bot = o.bot, rear = o.rear, sc = o.slide || blk;
    part(mb, 'slide', () => {
      slab(mb, 'gunMetal', sc, o.w, [rear, bot, rear, top - 0.004, rear - 0.006, top, -L + 0.008, top, -L, top - 0.007, -L, bot]);
      for (let i = 0; i < 6; i++) slab(mb, 'gunMetal', dark, o.w + 0.002, [rear - 0.006 - i * 0.005, bot + 0.006, rear - 0.006 - i * 0.005, top - 0.006, rear - 0.008 - i * 0.005, top - 0.006, rear - 0.008 - i * 0.005, bot + 0.006]);
      slab(mb, 'gunMetal', sc, 0.006, [-L + 0.012, top, -L + 0.012, top + 0.006, -L + 0.004, top + 0.006, -L + 0.004, top]);
      slab(mb, 'gunMetal', sc, 0.012, [rear - 0.004, top, rear - 0.004, top + 0.005, rear - 0.012, top + 0.005, rear - 0.012, top]);
      bore(mb, (top + bot) / 2 + 0.003, -L, 0.0045);
    });
    slab(mb, 'gunMetal', o.frame || dark, o.w - 0.002, [rear - 0.004, bot, -L + 0.012, bot, -L + 0.012, bot - 0.008, -0.07, bot - 0.012, 0.0, bot - 0.012, rear - 0.004, bot - 0.006]);
    bar(mb, 'gunMetal', o.frame || dark, 0.012, 0.005, [-0.004, bot - 0.01, -0.006, bot - 0.03, -0.03, bot - 0.038, -0.058, bot - 0.034, -0.062, bot - 0.012]);
    slab(mb, 'gunMetal', dark, 0.006, [-0.026, bot - 0.012, -0.03, bot - 0.03, -0.024, bot - 0.03, -0.02, bot - 0.012]);
    slab(mb, 'gunMetal', o.frame || dark, o.w - 0.002, [rear + 0.002, bot - 0.004, -0.008, bot - 0.004, -0.014, bot - 0.06, -0.012, -0.04, rear + 0.004, -0.044, rear + 0.008, -0.02]);
    slab(mb, o.gripMat || 'bakelite', o.grip || bake, o.w + 0.004, [rear - 0.002, bot - 0.012, -0.006, bot - 0.012, -0.011, -0.036, rear + 0.002, -0.038, rear + 0.005, -0.02]);
    if (o.star) { tone(mb, 'paintRed', o.star); Z.MODEL_KIT.blob(mb, 'root', [o.w / 2 + 0.003, (bot - 0.012 - 0.036) / 2, rear - 0.012], [0.002, 0.007, 0.007], 6, 4); Z.MODEL_KIT.blob(mb, 'root', [-o.w / 2 - 0.003, (bot - 0.012 - 0.036) / 2, rear - 0.012], [0.002, 0.007, 0.007], 6, 4); }
    slab(mb, 'gunMetal', dark, 0.008, [rear + 0.004, top - 0.008, rear + 0.012, top - 0.002, rear + 0.014, top - 0.008, rear + 0.002, top - 0.02]);
  };

  const G = {
    fists: { grip: [0, 0, 0], build: () => {} },
    kastet: { build: mb => {
      tone(mb, 'metalGrey', [170, 150, 96]);
      for (let i = 0; i < 4; i++) Z.MODEL_KIT.tubeAlong(mb, Array.from({ length: 11 }, (_, k) => { const a = k / 10 * Math.PI * 2; return [-0.033 + i * 0.022, 0.045 + Math.sin(a) * 0.01, Math.cos(a) * 0.012]; }), [0.0042], { b: 'root', sides: 6, capB: false });
      slab(mb, 'metalGrey', [170, 150, 96], 0.086, [0.014, 0.03, 0.014, 0.036, -0.014, 0.036, -0.014, 0.03]);
      slab(mb, 'metalGrey', [170, 150, 96], 0.05, [0.018, 0.0, 0.01, 0.03, -0.01, 0.03, -0.018, 0.0, -0.006, -0.012, 0.006, -0.012]);
    } },
    glove: { build: mb => {
      tone(mb, 'robotPaint', [120, 110, 90]);
      mb.loft([[0.1, 0.05, 0.05], [0.04, 0.062, 0.062], [-0.06, 0.066, 0.058], [-0.12, 0.058, 0.05]].map(r => ({ c: [0, 0.01, r[0]], rx: r[1], f: r[2], bk: r[2] })), { b: 'root', sides: 12, U: [0, 1, 0], V: [1, 0, 0], n: 3, capA: true, capB: true });
      for (let i = 0; i < 4; i++) tube(mb, 'metalGrey', steel, 0.05, -0.04, -0.13, 0.009, 0.008, { x: -0.04 + i * 0.027 });
      tube(mb, 'metalGrey', [180, 150, 90], 0.07, 0.08, -0.06, 0.012, 0.012, { x: 0.03 });
      tube(mb, 'metalGrey', [180, 150, 90], 0.07, 0.08, -0.06, 0.012, 0.012, { x: -0.03 });
      tone(mb, 'glow', [255, 150, 60]);
      mb.box(0.0, 0.07, 0.02, 0.03, 0.01, 0.04, 0, 3);
    } },
    knife: { fore: null, build: mb => {
      for (let i = 0; i < 6; i++) tube(mb, i % 2 ? 'leather' : 'gunWood', i % 2 ? [90, 70, 50] : [150, 120, 90], 0.012, 0.058 - i * 0.017, 0.042 - i * 0.017, 0.0135, 0.0135, { sides: 9 });
      tube(mb, 'metalGrey', steel, 0.012, 0.064, 0.058, 0.012, 0.013, { sides: 9 });
      slab(mb, 'metalGrey', steel, 0.05, [-0.04, -0.004, -0.04, 0.03, -0.046, 0.03, -0.046, -0.004]);
      slab(mb, 'metalGrey', [190, 194, 200], 0.004, [-0.046, 0.002, -0.046, 0.024, -0.14, 0.022, -0.185, 0.013, -0.165, 0.004, -0.11, 0.0]);
      slab(mb, 'metalGrey', [120, 124, 130], 0.0045, [-0.046, 0.016, -0.046, 0.024, -0.14, 0.022, -0.17, 0.016, -0.14, 0.017]);
    } },
    shovel: { build: mb => {
      tube(mb, 'gunWood', wood, 0, 0.14, -0.33, 0.017, 0.016, { sides: 9 });
      tube(mb, 'gunWood', wood, 0, 0.16, 0.13, 0.02, 0.02, { sides: 9 });
      slab(mb, 'paintGreen', [80, 96, 70], 0.014, [-0.31, -0.01, -0.31, 0.01, -0.34, 0.012, -0.34, -0.012]);
      slab(mb, 'paintGreen', [86, 100, 74], 0.004, [-0.33, -0.075, -0.33, 0.075, -0.49, 0.072, -0.52, 0.04, -0.54, 0.0, -0.52, -0.04, -0.49, -0.072]);
      slab(mb, 'paintGreen', [70, 86, 62], 0.008, [-0.33, -0.01, -0.33, 0.01, -0.48, 0.006, -0.48, -0.006]);
    } },
    crowbar: { build: mb => {
      tone(mb, 'rust', [120, 70, 50]);
      Z.MODEL_KIT.tubeAlong(mb, [[0, -0.01, 0.12], [0, 0, 0.0], [0, 0, -0.5], [0, 0.02, -0.56], [0, 0.07, -0.585], [0, 0.1, -0.575]], [0.012, 0.012, 0.012, 0.011, 0.009, 0.006], { b: 'root', sides: 6, ref: [0, 1, 0] });
      tone(mb, 'rust', [120, 70, 50]);
      Z.MODEL_KIT.tubeAlong(mb, [[0, -0.01, 0.12], [0, -0.025, 0.15], [0, -0.03, 0.17]], [0.012, 0.009, 0.004], { b: 'root', sides: 6, ref: [0, 1, 0] });
    } },
    rebar: { build: mb => {
      tone(mb, 'rust', [110, 80, 64]);
      const pts = [], rr = [];
      for (let k = 0; k <= 20; k++) { pts.push([0, 0, 0.08 - k * 0.035]); rr.push(k % 2 ? 0.0115 : 0.0095); }
      Z.MODEL_KIT.tubeAlong(mb, pts, rr, { b: 'root', sides: 6, ref: [0, 1, 0] });
      tone(mb, 'concrete', [140, 136, 128]);
      Z.MODEL_KIT.blob(mb, 'root', [0.006, 0.01, -0.63], [0.06, 0.05, 0.07], 8, 6);
      Z.MODEL_KIT.blob(mb, 'root', [-0.02, -0.02, -0.6], [0.04, 0.035, 0.05], 7, 5);
    } },
    axe: { build: mb => {
      tone(mb, 'gunWood', wood);
      Z.MODEL_KIT.tubeAlong(mb, [[0, -0.01, 0.12], [0, 0.0, -0.1], [0, 0.0, -0.35], [0, 0.012, -0.52]], [0.019, 0.016, 0.016, 0.018], { b: 'root', sides: 9, ref: [0, 1, 0] });
      slab(mb, 'metalGrey', steel, 0.022, [-0.44, 0.03, -0.44, -0.012, -0.5, -0.02, -0.53, -0.012, -0.53, 0.03, -0.5, 0.034]);
      slab(mb, 'metalGrey', steel, 0.012, [-0.44, 0.03, -0.44, 0.12, -0.455, 0.15, -0.53, 0.155, -0.53, 0.03]);
      slab(mb, 'metalGrey', [200, 204, 210], 0.004, [-0.445, 0.12, -0.455, 0.15, -0.535, 0.158, -0.535, 0.12]);
    } },
    sabre: { build: mb => {
      tone(mb, 'leather', [58, 40, 30]);
      Z.MODEL_KIT.tubeAlong(mb, [[0, -0.004, 0.1], [0, 0.0, 0.04], [0, 0.002, -0.05]], [0.016, 0.014, 0.016], { b: 'root', sides: 9, ref: [0, 1, 0] });
      tone(mb, 'metalGrey', brass);
      Z.MODEL_KIT.tubeAlong(mb, [[0, -0.006, 0.1], [0, -0.02, 0.125], [0, -0.034, 0.13]], [0.017, 0.016, 0.008], { b: 'root', sides: 9, ref: [0, 1, 0] });
      tube(mb, 'metalGrey', brass, 0.002, -0.048, -0.062, 0.017, 0.012, { sides: 9 });
      const pts = [];
      for (let k = 0; k <= 12; k++) { const t = k / 12, z = -0.06 - t * 0.78, y = 0.004 + t * t * 0.07; pts.push([z, y]); }
      const up = pts.map(([z, y], k) => [z, y + 0.024 * (1 - Math.pow(k / 12, 3))]);
      const poly = [];
      for (const [z, y] of pts) poly.push(z, y);
      for (let k = up.length - 1; k >= 0; k--) poly.push(up[k][0], up[k][1]);
      slab(mb, 'metalGrey', [200, 204, 212], 0.004, poly);
      bar(mb, 'metalGrey', [110, 114, 122], 0.0056, 0.004, up.slice(0, 11).flat());
    } },
    sledge: { build: mb => {
      tone(mb, 'gunWood', wood);
      Z.MODEL_KIT.tubeAlong(mb, [[0, 0, 0.22], [0, 0, -0.62]], [0.021, 0.018], { b: 'root', sides: 9, ref: [0, 1, 0] });
      slab(mb, 'metalGrey', dark, 0.085, [-0.58, -0.04, -0.58, 0.11, -0.59, 0.12, -0.65, 0.12, -0.66, 0.11, -0.66, -0.04, -0.65, -0.05, -0.59, -0.05]);
      slab(mb, 'metalGrey', [140, 142, 146], 0.075, [-0.585, 0.12, -0.585, 0.128, -0.655, 0.128, -0.655, 0.12]);
      slab(mb, 'metalGrey', [140, 142, 146], 0.075, [-0.585, -0.05, -0.585, -0.058, -0.655, -0.058, -0.655, -0.05]);
    } },
    pm: { fore: [0.0, -0.01, 0.0], muzzle: [0, 0.075, -0.16], build: mb => pistolBody(mb, null, { len: 0.152, top: 0.101, bot: 0.07, rear: 0.026, w: 0.026, star: [190, 40, 30] }) },
    tt: { fore: [0.0, -0.01, 0.0], muzzle: [0, 0.08, -0.19], build: (mb, d) => {
      const ch = d && d.chrome;
      pistolBody(mb, d, { len: 0.18, top: 0.107, bot: 0.074, rear: 0.026, w: 0.027, slide: ch ? [200, 204, 210] : blk, frame: ch ? [180, 184, 190] : dark, grip: ch ? [236, 232, 246] : [70, 44, 30], gripMat: ch ? 'marble' : 'bakelite', star: [200, 40, 30] });
    } },
    nagan: { fore: [0.0, -0.01, 0.0], muzzle: [0, 0.085, -0.22], build: mb => {
      tube(mb, 'gunMetal', blk, 0.088, -0.04, -0.222, 0.0095, 0.0085, { sides: 8 });
      bore(mb, 0.088, -0.222, 0.004);
      slab(mb, 'gunMetal', blk, 0.004, [-0.205, 0.096, -0.205, 0.104, -0.215, 0.104, -0.218, 0.096]);
      part(mb, 'cyl', () => {
        tube(mb, 'gunMetal', dark, 0.077, 0.0, -0.046, 0.022, 0.022, { sides: 14 });
        for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; tube(mb, 'gunMetal', [20, 20, 22], 0.077 + Math.sin(a) * 0.022, -0.006, -0.04, 0.0035, 0.0035, { x: Math.cos(a) * 0.022, sides: 5 }); }
        for (let i = 0; i < 7; i++) { const a = (i + 0.5) / 7 * Math.PI * 2; tube(mb, 'gunMetal', [30, 30, 32], 0.077 + Math.sin(a) * 0.0225, -0.012, -0.034, 0.0022, 0.0022, { x: Math.cos(a) * 0.0225, sides: 4 }); }
      });
      slab(mb, 'gunMetal', blk, 0.022, [0.03, 0.098, 0.03, 0.106, -0.05, 0.103, -0.05, 0.096, 0.004, 0.098]);
      slab(mb, 'gunMetal', blk, 0.024, [0.03, 0.05, 0.03, 0.098, 0.004, 0.098, 0.004, 0.055, -0.05, 0.055, -0.05, 0.05]);
      bar(mb, 'gunMetal', blk, 0.01, 0.005, [-0.004, 0.05, -0.008, 0.028, -0.03, 0.022, -0.046, 0.034, -0.048, 0.05]);
      slab(mb, 'gunMetal', dark, 0.006, [-0.018, 0.05, -0.024, 0.03, -0.018, 0.03, -0.014, 0.05]);
      slab(mb, 'gunWood', [100, 80, 60], 0.03, [0.028, 0.052, 0.006, 0.05, 0.012, 0.01, 0.022, -0.04, 0.046, -0.046, 0.054, -0.03, 0.05, 0.0, 0.038, 0.04]);
      slab(mb, 'gunMetal', blk, 0.008, [0.03, 0.1, 0.044, 0.112, 0.046, 0.106, 0.036, 0.094]);
    } },
    obrez: { fore: [0, 0.02, -0.18], muzzle: [0, 0.07, -0.42], build: mb => {
      part(mb, 'barrel', () => {
        for (const x of [-0.0135, 0.0135]) { tube(mb, 'gunMetal', blk, 0.072, -0.03, -0.42, 0.0135, 0.0135, { x, sides: 10, capA: true }); bore(mb, 0.072, -0.42, 0.0105, x); bore(mb, 0.072, -0.0295, 0.0105, x); }
        slab(mb, 'gunMetal', blk, 0.004, [-0.03, 0.084, -0.03, 0.09, -0.42, 0.088, -0.42, 0.084]);
        slab(mb, 'gunWood', wood, 0.034, [-0.06, 0.06, -0.06, 0.044, -0.2, 0.046, -0.24, 0.052, -0.24, 0.062]);
      });
      slab(mb, 'gunMetal', dark, 0.036, [0.05, 0.05, 0.05, 0.088, -0.03, 0.09, -0.03, 0.05]);
      slab(mb, 'gunMetal', dark, 0.01, [0.03, 0.088, 0.04, 0.096, 0.05, 0.094, 0.048, 0.086]);
      bar(mb, 'gunMetal', dark, 0.01, 0.005, [0.0, 0.05, -0.002, 0.03, 0.03, 0.028, 0.04, 0.05]);
      slab(mb, 'gunWood', wood, 0.034, [0.05, 0.088, 0.09, 0.07, 0.11, 0.03, 0.1, -0.02, 0.07, -0.02, 0.06, 0.02, 0.05, 0.05]);
    } },
    toz: { fore: [0, 0.03, -0.3], muzzle: [0, 0.07, -0.72], stock: 0.3, build: mb => {
      part(mb, 'barrel', () => {
        for (const x of [-0.0135, 0.0135]) { tube(mb, 'gunMetal', blk, 0.072, -0.03, -0.72, 0.0135, 0.0125, { x, sides: 10, capA: true }); bore(mb, 0.072, -0.72, 0.0098, x); bore(mb, 0.072, -0.0295, 0.0105, x); }
        slab(mb, 'gunMetal', blk, 0.004, [-0.03, 0.084, -0.03, 0.09, -0.72, 0.087, -0.72, 0.083]);
        slab(mb, 'gunWood', wood, 0.036, [-0.06, 0.062, -0.06, 0.042, -0.3, 0.046, -0.34, 0.054, -0.34, 0.064]);
      });
      slab(mb, 'gunMetal', dark, 0.038, [0.06, 0.048, 0.06, 0.09, -0.03, 0.09, -0.03, 0.048]);
      bar(mb, 'gunMetal', dark, 0.01, 0.005, [0.0, 0.048, -0.002, 0.03, 0.03, 0.026, 0.044, 0.048]);
      slab(mb, 'gunWood', wood, 0.036, [0.06, 0.09, 0.14, 0.072, 0.3, 0.07, 0.31, 0.072, 0.31, -0.05, 0.3, -0.052, 0.12, 0.02, 0.07, 0.03, 0.06, 0.048]);
      slab(mb, 'rubber', [40, 34, 30], 0.038, [0.31, 0.072, 0.322, 0.072, 0.322, -0.052, 0.31, -0.05]);
    } },
    mosin: { fore: [0, 0.03, -0.32], muzzle: [0, 0.07, -0.9], stock: 0.32, build: (mb, d) => {
      slab(mb, 'gunWood', wood, 0.04, [0.33, 0.07, 0.33, -0.045, 0.32, -0.048, 0.08, 0.03, 0.03, 0.04, 0.0, 0.05, -0.62, 0.052, -0.64, 0.062, -0.64, 0.074, -0.1, 0.074, 0.03, 0.074, 0.08, 0.064, 0.2, 0.068]);
      slab(mb, 'gunWood', [110, 110, 110], 0.03, [-0.14, 0.074, -0.14, 0.084, -0.6, 0.084, -0.6, 0.074]);
      slab(mb, 'metalGrey', steel, 0.042, [0.335, 0.072, 0.338, 0.072, 0.338, -0.05, 0.335, -0.05]);
      for (const z of [-0.36, -0.58]) slab(mb, 'metalGrey', steel, 0.044, [z + 0.008, 0.05, z + 0.008, 0.088, z - 0.008, 0.088, z - 0.008, 0.05]);
      tube(mb, 'gunMetal', blk, 0.072, 0.03, -0.12, 0.016, 0.016, { sides: 12 });
      tube(mb, 'gunMetal', blk, 0.072, -0.12, -0.9, 0.011, 0.009, { sides: 9 });
      bore(mb, 0.072, -0.9, 0.0045);
      slab(mb, 'gunMetal', blk, 0.004, [-0.875, 0.08, -0.875, 0.095, -0.885, 0.095, -0.888, 0.08]);
      slab(mb, 'gunMetal', blk, 0.02, [-0.13, 0.082, -0.13, 0.092, -0.2, 0.09, -0.2, 0.082]);
      part(mb, 'bolt', () => {
        tone(mb, 'gunMetal', blk);
        Z.MODEL_KIT.tubeAlong(mb, [[0.008, 0.074, 0.02], [0.05, 0.07, 0.022], [0.07, 0.06, 0.024]], [0.006, 0.006, 0.006], { b: 'root', sides: 6 });
        Z.MODEL_KIT.blob(mb, 'root', [0.074, 0.058, 0.024], [0.011, 0.011, 0.011], 7, 5);
      });
      slab(mb, 'gunMetal', dark, 0.026, [0.02, 0.05, -0.08, 0.05, -0.08, 0.03, 0.02, 0.03]);
      bar(mb, 'gunMetal', dark, 0.01, 0.005, [0.06, 0.04, 0.06, 0.02, 0.03, 0.016, 0.022, 0.03]);
      if (d && d.scope) {
        tube(mb, 'gunMetal', blk, 0.128, 0.05, -0.2, 0.0145, 0.0145, { sides: 12 });
        tube(mb, 'gunMetal', blk, 0.128, 0.075, 0.05, 0.019, 0.0145, { sides: 12 });
        tube(mb, 'gunMetal', blk, 0.128, -0.2, -0.225, 0.0145, 0.02, { sides: 12 });
        tone(mb, 'glass', [120, 150, 170]); Z.MODEL_KIT.blob(mb, 'root', [0, 0.128, -0.226], [0.017, 0.017, 0.003], 8, 4);
        slab(mb, 'gunMetal', dark, 0.012, [0.02, 0.088, 0.02, 0.116, 0.0, 0.116, 0.0, 0.088]);
        slab(mb, 'gunMetal', dark, 0.012, [-0.14, 0.088, -0.14, 0.116, -0.16, 0.116, -0.16, 0.088]);
      }
    } },
    sks: { fore: [0, 0.03, -0.3], muzzle: [0, 0.075, -0.78], stock: 0.3, build: mb => {
      slab(mb, 'gunWood', wood, 0.04, [0.31, 0.075, 0.31, -0.045, 0.3, -0.048, 0.08, 0.028, 0.03, 0.04, 0.0, 0.05, -0.48, 0.054, -0.5, 0.064, -0.5, 0.078, 0.03, 0.078, 0.08, 0.068, 0.2, 0.072]);
      slab(mb, 'gunWood', [110, 110, 110], 0.032, [-0.16, 0.098, -0.16, 0.11, -0.42, 0.106, -0.44, 0.098]);
      tube(mb, 'gunMetal', blk, 0.104, -0.42, -0.5, 0.009, 0.009, { sides: 8 });
      slab(mb, 'gunMetal', blk, 0.036, [0.03, 0.078, 0.03, 0.1, -0.16, 0.1, -0.16, 0.078]);
      slab(mb, 'gunMetal', blk, 0.026, [-0.02, 0.054, -0.1, 0.054, -0.095, 0.02, -0.03, 0.02]);
      tube(mb, 'gunMetal', blk, 0.08, -0.16, -0.78, 0.01, 0.0085, { sides: 9 });
      bore(mb, 0.08, -0.78, 0.0042);
      slab(mb, 'gunMetal', blk, 0.016, [-0.5, 0.075, -0.5, 0.115, -0.52, 0.115, -0.52, 0.075]);
      slab(mb, 'metalGrey', steel, 0.006, [-0.5, 0.062, -0.5, 0.072, -0.74, 0.07, -0.76, 0.066, -0.74, 0.062]);
      tone(mb, 'gunMetal', blk); Z.MODEL_KIT.tubeAlong(mb, [[0.012, 0.09, -0.04], [0.04, 0.09, -0.042]], [0.006, 0.006], { b: 'root', sides: 6 });
      bar(mb, 'gunMetal', dark, 0.01, 0.005, [0.05, 0.04, 0.05, 0.02, 0.02, 0.016, 0.012, 0.03]);
    } },
    akm: { fore: [0, 0.03, -0.27], muzzle: [0, 0.08, -0.62], stock: 0.27, mag: [0, -0.02, -0.1], build: mb => {
      slab(mb, 'gunWood', wood, 0.036, [0.02, 0.1, 0.265, 0.083, 0.272, 0.08, 0.272, -0.034, 0.262, -0.04, 0.05, 0.044, 0.02, 0.06]);
      slab(mb, 'metalGrey', steel, 0.038, [0.272, 0.083, 0.28, 0.081, 0.28, -0.04, 0.272, -0.038]);
      slab(mb, 'gunMetal', blk, 0.042, [0.025, 0.058, 0.025, 0.106, -0.255, 0.106, -0.255, 0.058]);
      slab(mb, 'gunMetal', [52, 54, 58], 0.038, [0.02, 0.106, 0.02, 0.113, 0.0, 0.12, -0.2, 0.12, -0.212, 0.106]);
      for (let i = 0; i < 5; i++) slab(mb, 'gunMetal', blk, 0.039, [-0.02 - i * 0.035, 0.12, -0.02 - i * 0.035, 0.122, -0.03 - i * 0.035, 0.122, -0.03 - i * 0.035, 0.12]);
      slab(mb, 'gunMetal', blk, 0.03, [-0.2, 0.106, -0.2, 0.124, -0.255, 0.12, -0.255, 0.106]);
      part(mb, 'bolt', () => slab(mb, 'gunMetal', dark, 0.004, [0.0, 0.074, 0.0, 0.1, -0.06, 0.098, -0.06, 0.092, -0.01, 0.092], 0.022));
      slab(mb, 'bakelite', [120, 64, 34], 0.03, [0.0, 0.058, -0.03, 0.058, -0.025, 0.02, -0.018, -0.03, 0.012, -0.034, 0.018, -0.028, 0.012, 0.02, 0.008, 0.058]);
      bar(mb, 'gunMetal', blk, 0.012, 0.005, [-0.03, 0.058, -0.034, 0.036, -0.074, 0.034, -0.078, 0.058]);
      slab(mb, 'gunMetal', dark, 0.006, [-0.04, 0.058, -0.046, 0.04, -0.04, 0.04, -0.036, 0.058]);
      part(mb, 'mag', () => {
        slab(mb, 'bakelite', [150, 70, 34], 0.028, [-0.078, 0.06, -0.126, 0.06, -0.15, 0.0, -0.18, -0.06, -0.206, -0.114, -0.152, -0.13, -0.13, -0.076, -0.106, -0.02, -0.086, 0.03]);
        for (let i = 0; i < 4; i++) slab(mb, 'bakelite', [120, 56, 28], 0.03, [-0.09 - i * 0.022, 0.02 - i * 0.04, -0.13 - i * 0.022, 0.02 - i * 0.04, -0.132 - i * 0.022, 0.014 - i * 0.04, -0.092 - i * 0.022, 0.014 - i * 0.04]);
      });
      slab(mb, 'gunWood', wood, 0.044, [-0.255, 0.06, -0.255, 0.1, -0.395, 0.098, -0.402, 0.076, -0.392, 0.064]);
      slab(mb, 'gunWood', [112, 112, 112], 0.03, [-0.255, 0.106, -0.255, 0.124, -0.372, 0.122, -0.376, 0.11]);
      tube(mb, 'gunMetal', blk, 0.118, -0.37, -0.44, 0.009, 0.009, { sides: 8 });
      slab(mb, 'gunMetal', blk, 0.024, [-0.425, 0.074, -0.425, 0.128, -0.45, 0.126, -0.45, 0.074]);
      tube(mb, 'gunMetal', blk, 0.085, -0.255, -0.585, 0.0095, 0.0085, { sides: 9 });
      slab(mb, 'gunMetal', blk, 0.02, [-0.535, 0.078, -0.535, 0.118, -0.545, 0.128, -0.553, 0.128, -0.56, 0.094, -0.56, 0.078]);
      tube(mb, 'gunMetal', blk, 0.085, -0.585, -0.622, 0.012, 0.012, { sides: 9 });
      bore(mb, 0.085, -0.622, 0.0045);
      tube(mb, 'metalGrey', steel, 0.05, -0.27, -0.52, 0.003, 0.003, { sides: 5 });
    } },
    ppsh: { fore: [0, 0.02, -0.25], muzzle: [0, 0.08, -0.55], stock: 0.28, build: mb => {
      slab(mb, 'gunWood', wood, 0.038, [0.29, 0.08, 0.29, -0.045, 0.28, -0.05, 0.08, 0.026, 0.03, 0.04, -0.02, 0.045, -0.06, 0.06, -0.06, 0.07, 0.03, 0.074, 0.1, 0.07, 0.2, 0.074]);
      slab(mb, 'metalGrey', steel, 0.04, [0.29, 0.08, 0.298, 0.078, 0.298, -0.047, 0.29, -0.045]);
      tube(mb, 'gunMetal', blk, 0.084, 0.04, -0.07, 0.02, 0.02, { sides: 12 });
      tube(mb, 'gunMetal', blk, 0.084, -0.07, -0.5, 0.021, 0.021, { sides: 12 });
      tone(mb, 'rubber', [12, 12, 12]);
      for (let i = 0; i < 6; i++) for (const a of [0.5, 1.2, -0.5, -1.2]) Z.MODEL_KIT.blob(mb, 'root', [Math.sin(a) * 0.0212, 0.084 + Math.cos(a) * 0.0212, -0.11 - i * 0.06], [0.006, 0.006, 0.011], 5, 4);
      slab(mb, 'gunMetal', blk, 0.044, [-0.5, 0.062, -0.5, 0.106, -0.535, 0.1, -0.53, 0.062]);
      tube(mb, 'gunMetal', blk, 0.084, -0.5, -0.552, 0.007, 0.007, { sides: 8 });
      bore(mb, 0.084, -0.552, 0.004);
      part(mb, 'mag', () => {
        tone(mb, 'gunMetal', blk);
        Z.MODEL_KIT.tubeAlong(mb, [[-0.036, 0.012, -0.11], [0.036, 0.012, -0.11]], [0.07, 0.07], { b: 'root', sides: 18, capA: true });
        slab(mb, 'gunMetal', blk, 0.026, [-0.086, 0.064, -0.086, 0.08, -0.134, 0.08, -0.134, 0.064]);
      });
      slab(mb, 'gunMetal', dark, 0.02, [-0.09, 0.064, -0.09, 0.08, -0.13, 0.08, -0.13, 0.064]);
      bar(mb, 'gunMetal', dark, 0.01, 0.005, [0.0, 0.05, -0.004, 0.028, -0.034, 0.026, -0.042, 0.05]);
      slab(mb, 'gunMetal', dark, 0.006, [-0.014, 0.05, -0.02, 0.032, -0.014, 0.032, -0.01, 0.05]);
    } },
    svd: { fore: [0, 0.03, -0.3], muzzle: [0, 0.08, -0.85], stock: 0.3, build: mb => {
      slab(mb, 'gunWood', wood, 0.036, [0.02, 0.1, 0.29, 0.096, 0.296, 0.092, 0.296, 0.07, 0.12, 0.07, 0.12, 0.08, 0.02, 0.08]);
      slab(mb, 'gunWood', wood, 0.036, [0.296, 0.07, 0.296, -0.04, 0.286, -0.046, 0.25, -0.03, 0.25, 0.07]);
      slab(mb, 'gunWood', wood, 0.032, [0.02, 0.058, 0.02, 0.04, 0.06, -0.035, 0.09, -0.035, 0.07, 0.03, 0.12, 0.07, 0.12, 0.058]);
      slab(mb, 'rubber', [40, 34, 30], 0.036, [0.13, 0.096, 0.25, 0.098, 0.25, 0.104, 0.13, 0.104]);
      slab(mb, 'gunMetal', blk, 0.04, [0.025, 0.058, 0.025, 0.106, -0.25, 0.106, -0.25, 0.058]);
      part(mb, 'mag', () => slab(mb, 'bakelite', [70, 44, 30], 0.028, [-0.075, 0.06, -0.11, 0.06, -0.12, -0.04, -0.085, -0.044]));
      slab(mb, 'gunWood', wood, 0.044, [-0.25, 0.062, -0.25, 0.112, -0.43, 0.108, -0.44, 0.07]);
      for (let i = 0; i < 6; i++) slab(mb, 'gunMetal', blk, 0.046, [-0.27 - i * 0.025, 0.09, -0.27 - i * 0.025, 0.1, -0.282 - i * 0.025, 0.1, -0.282 - i * 0.025, 0.09]);
      tube(mb, 'gunMetal', blk, 0.085, -0.25, -0.81, 0.0095, 0.008, { sides: 9 });
      tube(mb, 'gunMetal', blk, 0.085, -0.81, -0.852, 0.0105, 0.0105, { sides: 9 });
      bore(mb, 0.085, -0.852, 0.0045);
      slab(mb, 'gunMetal', blk, 0.016, [-0.45, 0.08, -0.45, 0.112, -0.47, 0.112, -0.47, 0.08]);
      slab(mb, 'gunMetal', dark, 0.014, [0.0, 0.106, 0.0, 0.122, -0.12, 0.122, -0.12, 0.106]);
      tube(mb, 'gunMetal', blk, 0.138, 0.08, -0.17, 0.016, 0.016, { sides: 12 });
      tube(mb, 'gunMetal', blk, 0.138, 0.105, 0.08, 0.02, 0.016, { sides: 12 });
      tube(mb, 'gunMetal', blk, 0.138, -0.17, -0.2, 0.016, 0.022, { sides: 12 });
      tone(mb, 'glass', [120, 150, 170]); Z.MODEL_KIT.blob(mb, 'root', [0, 0.138, -0.201], [0.019, 0.019, 0.003], 8, 4);
      slab(mb, 'gunMetal', blk, 0.016, [-0.02, 0.122, -0.02, 0.138, -0.09, 0.138, -0.09, 0.122]);
    } },
    molniya: { fore: [0, -0.01, 0], muzzle: [0, 0.09, -0.24], build: mb => {
      tone(mb, 'robotPaint', [150, 150, 130]);
      mb.loft([[0.03, 0.022, 0.024, 0.02], [0.0, 0.03, 0.034, 0.03], [-0.13, 0.03, 0.034, 0.03], [-0.16, 0.022, 0.024, 0.022]].map(r => ({ c: [0, 0.1, r[0]], rx: r[1], f: r[2], bk: r[3] })), { b: 'root', sides: 14, U: [0, 1, 0], V: [1, 0, 0], n: 2.6, capA: true, capB: true });
      for (let i = 0; i < 3; i++) tube(mb, 'metalGrey', [196, 120, 60], 0.1, -0.035 - i * 0.04, -0.052 - i * 0.04, 0.042, 0.042, { sides: 16 });
      tube(mb, 'marble', [220, 216, 200], 0.1, -0.16, -0.2, 0.016, 0.012, { sides: 10 });
      tube(mb, 'metalGrey', [190, 160, 100], 0.1, -0.2, -0.24, 0.006, 0.003, { sides: 6 });
      tone(mb, 'glow', [110, 170, 255]); Z.MODEL_KIT.blob(mb, 'root', [0, 0.1, -0.243], [0.008, 0.008, 0.008], 6, 4);
      Z.MODEL_KIT.blob(mb, 'root', [0, 0.136, -0.02], [0.008, 0.006, 0.014], 6, 4);
      slab(mb, 'bakelite', [100, 54, 30], 0.03, [0.03, 0.07, -0.01, 0.07, -0.012, 0.03, -0.004, -0.03, 0.026, -0.034, 0.034, 0.0]);
      bar(mb, 'gunMetal', dark, 0.01, 0.005, [-0.012, 0.07, -0.016, 0.046, -0.044, 0.044, -0.048, 0.07]);
    } },
    luch: { fore: [0, -0.01, 0], muzzle: [0, 0.09, -0.22], build: mb => {
      tone(mb, 'robotPaint', [176, 176, 166]);
      mb.loft([[0.03, 0.018], [0.0, 0.03], [-0.12, 0.028], [-0.15, 0.02]].map(r => ({ c: [0, 0.09, r[0]], rx: r[1], rz: r[1] })), { b: 'root', sides: 14, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      for (let i = 0; i < 4; i++) slab(mb, 'metalGrey', steel, 0.004, [-0.02 - i * 0.03, 0.06, -0.02 - i * 0.03, 0.124, -0.035 - i * 0.03, 0.124, -0.035 - i * 0.03, 0.06]);
      tube(mb, 'metalGrey', steel, 0.09, -0.15, -0.2, 0.012, 0.012, { sides: 10 });
      tube(mb, 'metalGrey', [190, 170, 120], 0.09, -0.195, -0.225, 0.014, 0.046, { sides: 16, capB: false, double: true });
      tone(mb, 'glow', [255, 140, 70]); Z.MODEL_KIT.blob(mb, 'root', [0, 0.09, -0.205], [0.009, 0.009, 0.009], 6, 4);
      slab(mb, 'bakelite', [70, 44, 30], 0.028, [0.03, 0.065, -0.01, 0.065, -0.012, 0.03, -0.004, -0.032, 0.026, -0.036, 0.034, 0.0]);
      bar(mb, 'gunMetal', dark, 0.01, 0.005, [-0.012, 0.065, -0.016, 0.042, -0.044, 0.04, -0.048, 0.064]);
    } },
    giper: { fore: [0, 0.02, -0.3], muzzle: [0, 0.085, -0.75], stock: 0.25, build: mb => {
      slab(mb, 'bakelite', [86, 48, 28], 0.036, [0.02, 0.1, 0.25, 0.09, 0.256, 0.086, 0.256, -0.03, 0.245, -0.036, 0.05, 0.044, 0.02, 0.06]);
      slab(mb, 'robotPaint', [134, 124, 100], 0.054, [0.025, 0.05, 0.025, 0.124, -0.02, 0.134, -0.42, 0.13, -0.44, 0.1, -0.42, 0.05]);
      slab(mb, 'bakelite', [80, 44, 26], 0.03, [0.0, 0.05, -0.03, 0.05, -0.025, 0.01, -0.018, -0.034, 0.012, -0.038, 0.018, -0.03, 0.012, 0.012]);
      bar(mb, 'gunMetal', dark, 0.012, 0.005, [-0.03, 0.05, -0.034, 0.028, -0.074, 0.026, -0.078, 0.05]);
      tube(mb, 'metalGrey', [190, 170, 120], 0.085, -0.42, -0.7, 0.016, 0.022, { sides: 12 });
      for (let i = 0; i < 5; i++) tube(mb, 'metalGrey', [204, 150, 80], 0.085, -0.46 - i * 0.05, -0.475 - i * 0.05, 0.046, 0.046, { sides: 16 });
      tube(mb, 'metalGrey', [180, 180, 170], 0.085, -0.7, -0.75, 0.024, 0.04, { sides: 16, capB: false, double: true });
      tone(mb, 'glow', [255, 120, 60]);
      mb.box(0.028, 0.104, -0.1, 0.004, 0.018, 0.22, 0, 3);
      Z.MODEL_KIT.blob(mb, 'root', [0, 0.085, -0.735], [0.012, 0.012, 0.012], 6, 4);
      slab(mb, 'robotPaint', [100, 96, 84], 0.04, [-0.12, 0.134, -0.12, 0.15, -0.3, 0.15, -0.3, 0.134]);
    } },
    rivet: { fore: [0, 0, -0.15], muzzle: [0, 0.08, -0.3], build: mb => {
      tone(mb, 'paintRed', [180, 80, 40]);
      mb.loft([[0.03, 0.03], [0.0, 0.045], [-0.2, 0.045], [-0.23, 0.032]].map(r => ({ c: [0, 0.1, r[0]], rx: r[1], rz: r[1] })), { b: 'root', sides: 14, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      tube(mb, 'metalGrey', steel, 0.1, -0.23, -0.3, 0.02, 0.014, { sides: 10 });
      bore(mb, 0.1, -0.3, 0.008);
      slab(mb, 'rubber', [60, 60, 60], 0.034, [0.02, 0.06, -0.03, 0.06, -0.028, 0.02, -0.02, -0.03, 0.012, -0.034, 0.02, -0.02]);
      tone(mb, 'rubber', [50, 50, 50]);
      Z.MODEL_KIT.tubeAlong(mb, [[0.0, -0.03, 0.0], [0.0, -0.07, 0.02], [0.02, -0.12, 0.06]], [0.012, 0.011, 0.011], { b: 'root', sides: 8, capB: false });
      tube(mb, 'metalGrey', steel, 0.14, -0.05, -0.15, 0.014, 0.014, { sides: 10 });
    } },
    f1: { build: mb => {
      tone(mb, 'paintGreen', [96, 116, 74]);
      mb.loft([[0.0, 0.006], [0.012, 0.022], [0.035, 0.03], [0.06, 0.03], [0.083, 0.022], [0.094, 0.01]].map(r => ({ c: [0, r[0], 0], rx: r[1], rz: r[1] })), { b: 'root', sides: 12, capA: true, capB: true, shape: (ph, R, k) => k > 0 && k < 5 ? 0.003 * (Math.cos(ph * 8) > 0.3 ? 1 : 0) : 0 });
      tube(mb, 'metalGrey', steel, 0.092, 0, 0, 0.011, 0.011, { y1: 0.112, sides: 8 });
      slab(mb, 'metalGrey', steel, 0.014, [0.006, 0.108, 0.006, 0.116, -0.012, 0.11, -0.03, 0.02, -0.026, 0.02, -0.006, 0.106]);
      tone(mb, 'metalGrey', brass);
      Z.MODEL_KIT.tubeAlong(mb, Array.from({ length: 13 }, (_, k) => { const a = k / 12 * Math.PI * 2; return [0.016, 0.11 + Math.sin(a) * 0.012, 0.016 + Math.cos(a) * 0.012]; }), [0.0016], { b: 'root', sides: 4, capB: false });
    } },
    rgd: { build: mb => {
      tone(mb, 'paintGreen', [86, 98, 74]);
      mb.loft([[0.0, 0.006], [0.01, 0.022], [0.04, 0.028], [0.07, 0.026], [0.09, 0.018], [0.098, 0.008]].map(r => ({ c: [0, r[0], 0], rx: r[1], rz: r[1] })), { b: 'root', sides: 12, capA: true, capB: true });
      tube(mb, 'metalGrey', steel, 0.096, 0, 0, 0.01, 0.01, { y1: 0.114, sides: 8 });
      slab(mb, 'metalGrey', steel, 0.012, [0.005, 0.11, 0.005, 0.118, -0.012, 0.112, -0.026, 0.03, -0.022, 0.03, -0.005, 0.108]);
      tone(mb, 'metalGrey', brass);
      Z.MODEL_KIT.tubeAlong(mb, Array.from({ length: 13 }, (_, k) => { const a = k / 12 * Math.PI * 2; return [0.014, 0.112 + Math.sin(a) * 0.011, 0.014 + Math.cos(a) * 0.011]; }), [0.0015], { b: 'root', sides: 4, capB: false });
    } },
    molotov: { build: mb => {
      tone(mb, 'glass', [90, 140, 90]);
      mb.loft([[-0.03, 0.034], [0.07, 0.036], [0.09, 0.03], [0.11, 0.015], [0.16, 0.013], [0.17, 0.015]].map(r => ({ c: [0, r[0], 0], rx: r[1], rz: r[1] })), { b: 'root', sides: 12, capA: true, capB: true });
      tone(mb, 'cloth', [200, 190, 160]);
      mb.loft([[0.0, 0.03], [0.05, 0.032]].map(r => ({ c: [0, r[0], 0], rx: r[1] + 0.003, rz: r[1] + 0.003 })), { b: 'root', sides: 12 });
      Z.MODEL_KIT.tubeAlong(mb, [[0, 0.165, 0], [0.008, 0.2, 0.004], [0.004, 0.23, -0.006]], [0.012, 0.01, 0.006], { b: 'root', sides: 6 });
    } },
    tnt: { build: mb => {
      tone(mb, 'paintRed', [200, 190, 150]);
      mb.loft([[-0.05, 0.025], [0.05, 0.025]].map(r => ({ c: [0, 0.04, r[0]], rx: r[1], rz: r[1] })), { b: 'root', sides: 6, U: [0, 1, 0], V: [1, 0, 0], n: 4, capA: true, capB: true });
      tone(mb, 'cloth', [60, 60, 60]);
      Z.MODEL_KIT.tubeAlong(mb, [[0, 0.06, 0.05], [0, 0.08, 0.07], [0.01, 0.09, 0.1]], [0.004], { b: 'root', sides: 4 });
    } },
    mine: { build: mb => {
      tone(mb, 'paintGreen', [80, 96, 70]);
      mb.loft([[0.0, 0.054], [0.035, 0.056], [0.045, 0.05], [0.05, 0.03], [0.058, 0.026]].map(r => ({ c: [0, r[0] - 0.02, 0], rx: r[1], rz: r[1] })), { b: 'root', sides: 16, capA: true, capB: true });
      tone(mb, 'rubber', [50, 54, 46]);
      Z.MODEL_KIT.blob(mb, 'root', [0, 0.04, 0], [0.024, 0.008, 0.024], 10, 5);
    } },
    pmag: { build: mb => {
      slab(mb, 'gunMetal', blk, 0.019, [0.014, 0.0, -0.012, 0.0, -0.016, -0.098, 0.018, -0.1]);
      slab(mb, 'gunMetal', dark, 0.025, [0.021, -0.098, -0.019, -0.096, -0.019, -0.106, 0.023, -0.108]);
      tube(mb, 'metalGrey', brass, 0.004, 0.006, -0.012, 0.0045, 0.0045, { sides: 7 });
      tube(mb, 'metalGrey', [150, 110, 60], 0.004, -0.012, -0.02, 0.0045, 0.002, { sides: 7 });
    } },
    clip: { build: mb => {
      for (let i = 0; i < 5; i++) {
        const y = -i * 0.0105;
        tube(mb, 'metalGrey', brass, y, 0.03, -0.034, 0.0062, 0.0055, { sides: 8, capA: true });
        tube(mb, 'metalGrey', [130, 100, 60], y, -0.034, -0.052, 0.0045, 0.0015, { sides: 8 });
      }
      slab(mb, 'metalGrey', steel, 0.016, [0.034, 0.008, 0.026, 0.008, 0.026, -0.05, 0.034, -0.05]);
    } },
    shell: { build: mb => {
      tube(mb, 'paintRed', [170, 40, 30], 0, 0.0, -0.058, 0.0102, 0.0102, { sides: 10, capB: true });
      tube(mb, 'metalGrey', brass, 0, 0.012, 0.0, 0.0108, 0.0108, { sides: 10, capA: true });
    } },
    round: { build: mb => {
      tube(mb, 'metalGrey', brass, 0, 0.018, -0.012, 0.0048, 0.0042, { sides: 7, capA: true });
      tube(mb, 'metalGrey', [140, 100, 60], 0, -0.012, -0.022, 0.0036, 0.0012, { sides: 7 });
    } },
    cell: { build: mb => {
      tone(mb, 'robotPaint', [70, 90, 120]);
      mb.box(0, -0.05, 0, 0.026, 0.05, 0.018, 0, 1);
      tone(mb, 'metalGrey', [200, 200, 190]);
      mb.box(0, 0.0, 0, 0.022, 0.006, 0.014, 0, 1);
    } },
    holster: { build: mb => {
      slab(mb, 'leather', [92, 58, 34], 0.04, [0.036, 0.113, -0.206, 0.113, -0.232, 0.098, -0.232, 0.046, -0.07, 0.03, 0.0, 0.03, 0.03, 0.05]);
      slab(mb, 'leather', [70, 44, 26], 0.044, [0.04, 0.122, 0.0, 0.124, -0.02, 0.112, 0.04, 0.11]);
    } },
    sheath: { build: mb => {
      slab(mb, 'leather', [80, 54, 34], 0.014, [-0.04, 0.034, -0.196, 0.03, -0.205, 0.012, -0.196, -0.008, -0.04, -0.01]);
    } },
    scabbard: { build: mb => {
      const pts = [];
      for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([-0.055 - t * 0.8, 0.004 + t * t * 0.07]); }
      const poly = [];
      for (const [z, y] of pts) poly.push(z, y - 0.008);
      for (let k = pts.length - 1; k >= 0; k--) poly.push(pts[k][0], pts[k][1] + 0.032 - 0.012 * (k / 10));
      slab(mb, 'leather', [40, 30, 26], 0.012, poly);
      slab(mb, 'metalGrey', brass, 0.014, [-0.055, -0.006, -0.055, 0.038, -0.085, 0.038, -0.085, -0.006]);
      slab(mb, 'metalGrey', brass, 0.014, [-0.82, 0.06, -0.86, 0.062, -0.86, 0.082, -0.82, 0.088]);
    } }
  };
  Z.GUN_MODELS = G;

  const gunMeshes = new Map();
  Z.gunMesh = (model, d) => {
    const key = model + (d && d.chrome ? '|c' : '') + (d && d.scope ? '|s' : '');
    let mb = gunMeshes.get(key);
    if (mb) return mb;
    mb = new Z.SkinBuilder(RIG1);
    (G[model] || G.pm).build(mb, d || {});
    gunMeshes.set(key, mb);
    return mb;
  };

  Z.Scene.prototype.gunVAO = function (wid) {
    this.gunCache = this.gunCache || new Map();
    let m = this.gunCache.get(wid);
    if (m) return m;
    const d = Z.item(wid) || {};
    const mb = Z.gunMesh(d.model || wid, d);
    if (!mb.n) { this.gunCache.set(wid, null); return null; }
    m = this.r.meshVAO(mb.pack());
    m.mb = mb;
    this.gunCache.set(wid, m);
    return m;
  };

  Z.Scene.prototype.modelVAO = function (model) {
    this.modelCache = this.modelCache || new Map();
    let m = this.modelCache.get(model);
    if (m !== undefined) return m;
    const mb = Z.gunMesh(model, {});
    m = mb.n ? this.r.meshVAO(mb.pack()) : null;
    if (m) m.mb = mb;
    this.modelCache.set(model, m);
    return m;
  };

  const PART_M = new Float32Array(16);
  Z.drawGunParts = (gl, p, m, M, parts) => {
    const ranges = [];
    if (parts && m.mb && m.mb.parts) for (const name in parts) { const r = m.mb.parts[name]; if (r && parts[name]) ranges.push([r[2], r[3], parts[name]]); }
    const bytes = m.type === gl.UNSIGNED_INT ? 4 : 2;
    gl.bindVertexArray(m.vao);
    gl.uniformMatrix4fv(p.u.uModel, false, M);
    if (!ranges.length) { gl.drawElements(gl.TRIANGLES, m.count, m.type, 0); return; }
    ranges.sort((a, b) => a[0] - b[0]);
    let at = 0;
    for (const [i0, i1] of ranges) { if (i0 > at) gl.drawElements(gl.TRIANGLES, i0 - at, m.type, at * bytes); at = Math.max(at, i1); }
    if (at < m.count) gl.drawElements(gl.TRIANGLES, m.count - at, m.type, at * bytes);
    for (const [i0, i1, pm] of ranges) {
      if (pm === 'hide') continue;
      Z.M4.mul(M, pm, PART_M);
      gl.uniformMatrix4fv(p.u.uModel, false, PART_M);
      gl.drawElements(gl.TRIANGLES, i1 - i0, m.type, i0 * bytes);
    }
  };

  Z.Scene.prototype.drawHeldList = function (r, list) {
    const gl = r.gl, p = r.prog.world.use();
    r.setEnvUniforms(p);
    r.bindWorldTextures(p);
    gl.uniformMatrix4fv(p.u.uVP, false, r.vp);
    const ex = r.eye[0], ez = r.eye[2];
    for (const a of list) {
      if (a.dead || !a.pose || a.hidden) continue;
      if (a.kind === 'player' && !this.showPlayer) continue;
      if (Math.hypot(a.x - ex, a.z - ez) > 120) continue;
      const ctx = a.animCtx || {};
      if (ctx.gunM && ctx.gunId) {
        const m = this.gunVAO(ctx.gunId);
        if (m) Z.drawGunParts(gl, p, m, ctx.gunM, ctx.parts);
      }
      for (const e of ctx.extras || []) {
        const m = this.modelVAO(e.model);
        if (m) Z.drawGunParts(gl, p, m, e.M, null);
      }
    }
    gl.uniformMatrix4fv(p.u.uModel, false, r.ident);
    gl.bindVertexArray(null);
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
