(function (N) {
  'use strict';

  const K = N.KIND;
  const T = n => N.TEX[n];
  const rgb = N.rgb;
  const W = [255, 255, 255, 255];
  const GREY = [150, 150, 150, 255];
  const DARK = [70, 70, 72, 255];

  const M = {};

  M.lamp = (mb, p) => {
    const conc = [190, 188, 180, 255];
    if (p.park) {
      mb.box(-0.07, 0, -0.07, 0.07, 3.6, 0.07, { layer: T('darkmetal'), c: [60, 60, 60, 255] });
      mb.cyl(0, 0, 3.6, 4.1, 0.26, 0.26, 8, { layer: T('lampglow'), kind: K.NIGHT, uWrap: 1, cap: true });
      return;
    }
    mb.box(-0.13, 0, -0.13, 0.13, 8.4, 0.13, { layer: T('concrete'), us: 1, vs: 3, c: conc });
    const arms = p.median ? [-1, 1] : [1];
    for (const a of arms) {
      mb.box(-0.06, 8.2, a > 0 ? -2.2 : 0, 0.06, 8.32, a > 0 ? 0 : 2.2, { layer: T('darkmetal'), c: [90, 90, 90, 255] });
      const z = a > 0 ? -2.3 : 2.3;
      mb.box(-0.22, 7.95, z - 0.45, 0.22, 8.25, z + 0.45, { side: { layer: T('darkmetal'), c: [70, 70, 70, 255] }, top: { layer: T('darkmetal'), c: [70, 70, 70, 255] } });
      mb.flat(-0.18, z - 0.4, 0.18, z + 0.4, 7.94, { layer: T('lampglow'), kind: K.NIGHT, down: true, uv: [0, 0, 1, 0, 1, 1, 0, 1] });
    }
  };

  const ball = (mb, x, y, z, r, o) => {
    const seg = 10, ring = 6;
    mb.ensure((seg + 1) * (ring + 1), seg * ring * 6);
    const base = mb.nv;
    for (let j = 0; j <= ring; j++) {
      const t = j / ring * Math.PI, sy = Math.cos(t), sr = Math.sin(t);
      for (let i = 0; i <= seg; i++) {
        const a = i / seg * Math.PI * 2, nx = Math.cos(a) * sr, nz = Math.sin(a) * sr;
        mb.v(x + nx * r, y + sy * r, z + nz * r, nx, sy, nz, i / seg, j / ring, o.c || W, o.layer, o.kind || 0);
      }
    }
    for (let j = 0; j < ring; j++) for (let i = 0; i < seg; i++) {
      const a = base + j * (seg + 1) + i, b = a + seg + 1;
      mb.tri(a, b, a + 1);
      mb.tri(a + 1, b, b + 1);
    }
  };

  M.globelamp = mb => {
    const iron = { layer: T('darkmetal'), c: [46, 48, 50, 255] };
    mb.cyl(0, 0, 0, 0.55, 0.2, 0.15, 8, iron);
    mb.cyl(0, 0, 0.55, 3.95, 0.075, 0.06, 8, iron);
    mb.box(-0.64, 3.9, -0.035, 0.64, 3.97, 0.035, iron);
    for (const x of [-0.6, 0.6]) {
      mb.cyl(x, 0, 3.97, 4.06, 0.05, 0.09, 6, iron);
      ball(mb, x, 4.29, 0, 0.25, { layer: T('lampglow'), kind: K.NIGHT, c: [255, 250, 238, 255] });
    }
  };

  M.trafficlight = (mb, p) => {
    mb.box(-0.07, 0, -0.07, 0.07, 3.3, 0.07, { layer: T('darkmetal'), c: [60, 60, 60, 255] });
    mb.box(-0.18, 2.5, -0.18, 0.18, 3.6, 0.18, { layer: T('darkmetal'), c: [40, 40, 40, 255] });
  };

  M.kiosk = (mb, p, atlas) => {
    mb.box(-1.5, 0, -1.5, 1.5, 2.5, 1.5, { side: { layer: T('plaster'), us: 3, vs: 2.5, c: [220, 220, 210, 255] }, top: { layer: T('tar'), us: 3 } });
    mb.wall(1.5, -1.51, -1.5, -1.51, 0.1, 2.5, { layer: T('kiosk'), kind: K.FACADE, us: 3, vs: 2.4, v0: 0 });
    mb.box(-1.7, 2.5, -1.8, 1.7, 2.62, 1.7, { layer: T('metal'), us: 2, vs: 2 });
    const uv = atlas.map['shop|' + p.text];
    if (uv) N.signFace(mb, 0, 2.93, -1.62, 0, -1, 3.0, 0.54, uv, K.SIGN, DARK);
  };

  M.busstop = (mb, p, atlas) => {
    for (const x of [-2, 2]) mb.box(x - 0.05, 0, 0.2, x + 0.05, 2.5, 0.3, { layer: T('darkmetal'), c: [80, 90, 110, 255] });
    mb.box(-2.2, 0.1, 0.35, 2.2, 2.4, 0.45, { layer: T('glass'), kind: K.FACADE, us: 2.2, vs: 2.3 });
    mb.box(-2.4, 2.5, -1.2, 2.4, 2.64, 0.6, { side: { layer: T('darkmetal'), c: [60, 90, 150, 255] }, top: { layer: T('metal'), us: 2 } });
    mb.box(-1.5, 0.45, 0, 1.5, 0.52, 0.34, { layer: T('plank'), us: 1, vs: 1 });
    const uv = atlas.map['shop|ОСТАНОВКА'];
    if (uv) N.signFace(mb, 0, 2.83, -1.22, 0, -1, 2.4, 0.34, uv, K.SIGN, DARK);
  };

  M.bench = mb => {
    const wood = { layer: T('plank'), us: 1, vs: 1, c: [204, 160, 108, 255] }, iron = { layer: T('darkmetal'), c: [44, 44, 46, 255] };
    for (const z of [-0.2, 0]) mb.box(-0.85, 0.42, z, 0.85, 0.47, z + 0.18, wood);
    for (const y of [0.55, 0.73]) mb.box(-0.85, y, 0.18, 0.85, y + 0.15, 0.225, wood);
    for (const x of [-0.72, 0.72]) {
      mb.box(x - 0.025, 0, -0.2, x + 0.025, 0.42, -0.14, Object.assign({ noTop: true }, iron));
      mb.box(x - 0.025, 0, 0.14, x + 0.025, 0.9, 0.2, Object.assign({ noTop: true }, iron));
    }
  };

  M.urn = mb => {
    mb.cyl(0, 0, 0, 0.62, 0.24, 0.2, 8, { layer: T('concrete'), us: 1, vs: 1, c: [196, 192, 184, 255] });
    mb.cyl(0, 0, 0.62, 0.7, 0.26, 0.26, 8, { layer: T('concrete'), us: 1, vs: 1, c: [176, 172, 164, 255], cap: true, capC: [44, 42, 40, 255] });
  };

  const BIN_PAINT = [[62, 112, 70, 255], [118, 124, 128, 255], [54, 88, 136, 255]];
  M.bin = (mb, p) => {
    const c = BIN_PAINT[p.tone || 0], dark = [c[0] * 0.62 | 0, c[1] * 0.62 | 0, c[2] * 0.62 | 0, 255], L = T('white');
    const b0 = [0.55, 0.36], b1 = [0.62, 0.42], y0 = 0.14, y1 = 1.08;
    const side = (ax, az, bx, bz, cx, cz, dx, dz, nx, nz) => mb.quad([ax, y0, az, bx, y0, bz, cx, y1, cz, dx, y1, dz], [nx, 0.1, nz], [0, 1, 1, 1, 1, 0, 0, 0], c, L, 0);
    side(-b0[0], -b0[1], b0[0], -b0[1], b1[0], -b1[1], -b1[0], -b1[1], 0, -1);
    side(b0[0], b0[1], -b0[0], b0[1], -b1[0], b1[1], b1[0], b1[1], 0, 1);
    side(-b0[0], b0[1], -b0[0], -b0[1], -b1[0], -b1[1], -b1[0], b1[1], -1, 0);
    side(b0[0], -b0[1], b0[0], b0[1], b1[0], b1[1], b1[0], -b1[1], 1, 0);
    mb.flat(-b0[0], -b0[1], b0[0], b0[1], y0, { layer: L, c: dark, down: true });
    mb.box(-0.64, 1.04, -0.44, 0.64, 1.1, 0.44, { layer: L, c: dark, noTop: true });
    mb.flat(-0.6, -0.4, 0.6, 0.4, 0.98, { layer: T('tar'), c: [70, 64, 56, 255] });
    for (const z of [-0.28, 0.28]) mb.box(-0.5, 0, z - 0.04, 0.5, 0.14, z + 0.04, { layer: T('tire'), c: [40, 40, 40, 255], noTop: true });
    mb.box(-0.48, 0.95, -0.32, -0.06, 1.32, 0.1, { layer: T('cloth'), c: [34, 34, 36, 255] });
    mb.box(0, 0.95, -0.08, 0.42, 1.27, 0.32, { layer: T('cloth'), c: [70, 86, 104, 255] });
    mb.box(-0.3, 0.98, 0.14, -0.08, 1.12, 0.34, { layer: T('kiosk'), c: [200, 190, 160, 255] });
  };

  M.binpad = (mb, p) => {
    const w = (p.w || 3) / 2;
    mb.box(-w, -0.04, -0.9, w, 0.05, 0.9, { layer: T('concrete'), us: 2, vs: 2, c: [190, 186, 178, 255] });
  };

  M.crate = (mb, p) => {
    const wood = { layer: T('plank'), us: 0.5, vs: 0.5, c: [214, 176, 120, 255] };
    for (const z of [-0.2, 0.18]) for (const [ya, yb] of [[0.03, 0.13], [0.17, 0.29]]) mb.box(-0.3, ya, z, 0.3, yb, z + 0.02, wood);
    for (const x of [-0.3, 0.28]) mb.box(x, 0, -0.18, x + 0.02, 0.3, 0.18, wood);
    mb.box(-0.28, 0, -0.18, 0.28, 0.025, 0.18, wood);
    const f = p.fruit ? N.rgb(p.fruit) : [200, 40, 30, 255], g = [f[0] * 0.78 | 0, f[1] * 0.78 | 0, f[2] * 0.78 | 0, 255];
    for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) mb.cyl(-0.18 + i * 0.18, -0.07 + k * 0.14, 0.19, 0.27, 0.075, 0.065, 6, { layer: T('white'), c: (i + k) % 2 ? f : g, cap: true });
  };

  const BARREL_PAINT = ['#2c4e86', '#9a2a22', '#6e4a2a', '#4e5a3a'];
  M.barrel = (mb, p) => {
    const c = N.rgb(BARREL_PAINT[p.tone || 0]), rim = [c[0] * 0.7 | 0, c[1] * 0.7 | 0, c[2] * 0.7 | 0, 255];
    mb.cyl(0, 0, 0, 0.88, 0.28, 0.28, 12, { layer: T('rust'), us: 1, vs: 1, c, cap: true, capC: rim });
    for (const y of [0.02, 0.3, 0.58, 0.85]) mb.cyl(0, 0, y, y + 0.03, 0.29, 0.29, 12, { layer: T('metal'), c: rim });
  };

  M.fence = (mb, p) => {
    const w = p.w / 2, h = p.h || 1.8;
    mb.wall(-w, 0, w, 0, 0.04, h, { layer: T('metalfence'), kind: K.DECAL, us: 2.5, vs: h, v0: 0 });
  };

  const PICKET_PAINT = [[132, 168, 118, 255], [126, 150, 186, 255], [196, 182, 150, 255], [170, 120, 84, 255]];
  M.picket = (mb, p) => {
    const w = p.w / 2, h = p.h || 1.25, c = PICKET_PAINT[p.tone || 0];
    const o = { layer: T('picket'), kind: K.DECAL, us: 1.2, vs: h, v0: 0, c };
    for (const [a, b] of [[-w, 0], [0, w]]) mb.wall(a, 0, b, 0, 0.05, h, Object.assign({ u0: (a + w) / 1.2 }, o));
  };

  const RAIL_PAINT = [[[230, 230, 226, 255], [196, 40, 36, 255]], [[64, 104, 74, 255], [64, 104, 74, 255]]];
  M.rail = (mb, p) => {
    const w = p.w / 2, [a, b] = RAIL_PAINT[p.tone || 0];
    const tube = (x0, y0, z0, x1, y1, z1, c) => mb.box(x0, y0, z0, x1, y1, z1, { layer: T('white'), c });
    tube(-w, 0.95, -0.025, w, 1.0, 0.025, a);
    tube(-w - 0.03, 0, -0.03, -w + 0.03, 1.04, 0.03, b);
    mb.wall(-w, 0, w, 0, 0.18, 0.96, { layer: T('railing'), kind: K.DECAL, us: 0.6, vs: 0.78, v0: 0, c: a });
  };

  const RED = [204, 30, 30], WHITE3 = [250, 250, 248], BLUE = [36, 86, 176], INK = [20, 20, 22];
  const SIGN_ART = {
    main: [['poly', 0, [[0, 0.37], [0.37, 0], [0, -0.37], [-0.37, 0]], WHITE3], ['poly', 0.002, [[0, 0.26], [0.26, 0], [0, -0.26], [-0.26, 0]], [246, 196, 30]]],
    yield: [['poly', 0, [[-0.38, 0.3], [0.38, 0.3], [0, -0.36]], RED], ['poly', 0.002, [[-0.27, 0.24], [0.27, 0.24], [0, -0.22]], WHITE3]],
    stop: [['ngon', 0, 8, 0.34, RED], ['ngon', 0.002, 8, 0.3, WHITE3], ['ngon', 0.004, 8, 0.27, RED], ['rect', 0.006, -0.18, -0.05, 0.18, 0.05, WHITE3]],
    noentry: [['ngon', 0, 16, 0.32, RED], ['rect', 0.002, -0.24, -0.06, 0.24, 0.06, WHITE3]],
    cross: [
      ['rect', 0, -0.32, -0.32, 0.32, 0.32, BLUE], ['poly', 0.002, [[-0.27, -0.22], [0.27, -0.22], [0, 0.27]], WHITE3],
      ['rect', 0.004, -0.025, -0.04, 0.03, 0.1, INK], ['ngon', 0.004, 8, 0.035, INK, 0.005, 0.15],
      ['rect', 0.004, -0.06, -0.19, -0.015, -0.04, INK], ['rect', 0.004, 0.02, -0.19, 0.065, -0.04, INK],
      ['rect', 0.004, -0.2, -0.21, -0.14, -0.17, INK], ['rect', 0.004, 0.12, -0.21, 0.18, -0.17, INK]
    ],
    bus: [
      ['rect', 0, -0.32, -0.32, 0.32, 0.32, BLUE], ['rect', 0.002, -0.25, -0.25, 0.25, 0.25, WHITE3],
      ['rect', 0.004, -0.19, -0.08, 0.19, 0.12, INK], ['ngon', 0.004, 8, 0.045, INK, -0.11, -0.1], ['ngon', 0.004, 8, 0.045, INK, 0.11, -0.1],
      ['rect', 0.006, -0.15, 0.03, 0.15, 0.09, [220, 230, 240]]
    ]
  };
  const DOUBLE = { cross: true, bus: true };

  const signShape = (mb, art, cy, z, nz) => {
    const L = T('white'), mir = nz > 0 ? -1 : 1;
    for (const a of art) {
      let pts, col;
      if (a[0] === 'poly') { pts = a[2]; col = a[3]; }
      else if (a[0] === 'rect') { pts = [[a[2], a[3]], [a[4], a[3]], [a[4], a[5]], [a[2], a[5]]]; col = a[6]; }
      else {
        pts = [];
        const cx = a[5] || 0, ccy = a[6] || 0;
        for (let i = 0; i < a[2]; i++) { const t = (i + 0.5) / a[2] * Math.PI * 2; pts.push([cx + Math.cos(t) * a[3], ccy + Math.sin(t) * a[3]]); }
        col = a[4];
      }
      const c = [col[0], col[1], col[2], 255], zz = z + a[1] * nz;
      mb.ensure(pts.length, (pts.length - 2) * 3);
      const base = mb.nv;
      for (const [x, y] of pts) mb.v(x * mir, cy + y, zz, 0, 0, nz, 0.5, 0.5, c, L, 0);
      for (let k = 1; k + 1 < pts.length; k++) mb.tri(base, base + k, base + k + 1);
    }
  };

  M.sign = (mb, p) => {
    const art = SIGN_ART[p.sign] || SIGN_ART.main, cy = 2.29;
    mb.cyl(0, 0, 0, 2.62, 0.035, 0.032, 6, { layer: T('metal'), c: [150, 154, 156, 255], cap: true });
    signShape(mb, art, cy, -0.045, -1);
    if (DOUBLE[p.sign]) signShape(mb, art, cy, -0.035, 1);
    else mb.quad([-0.36, cy - 0.37, -0.034, 0.36, cy - 0.37, -0.034, 0.36, cy + 0.37, -0.034, -0.36, cy + 0.37, -0.034], [0, 0, 1], [0, 1, 1, 1, 1, 0, 0, 0], [118, 122, 124, 255], T('metal'), 0);
    mb.box(-0.05, cy - 0.06, -0.034, 0.05, cy + 0.06, -0.02, { layer: T('metal'), c: [110, 112, 114, 255] });
  };

  M.playground = mb => {
    const c = [200, 60, 50, 255], y = [230, 190, 50, 255];
    for (const s of [-1, 1]) {
      mb.box(-6.5 + s * 1.2 - 0.06, 0, -1.3, -6.5 + s * 1.2 + 0.06, 2.3, -1.2, { layer: T('white'), c });
      mb.box(-6.5 + s * 1.2 - 0.06, 0, 1.2, -6.5 + s * 1.2 + 0.06, 2.3, 1.3, { layer: T('white'), c });
    }
    mb.box(-7.8, 2.2, -1.3, -5.2, 2.3, 1.3, { layer: T('white'), c: y });
    mb.box(-6.8, 0.5, -0.3, -6.2, 0.56, 0.3, { layer: T('plank') });
    mb.box(3, 0, -4, 3.8, 1.8, -3.2, { layer: T('white'), c: y });
    mb.quad([3, 1.8, -3.2, 3.8, 1.8, -3.2, 3.8, 0.1, 0, 3, 0.1, 0], [0, 0.8, 0.6], [0, 0, 1, 0, 1, 1, 0, 1], [200, 200, 210, 255], T('metal'), 0);
    for (const [x0, z0, x1, z1] of [[-7, -6, 7, -5.8], [-7, 5.8, 7, 6], [-7, -6, -6.8, 6], [6.8, -6, 7, 6]]) mb.box(x0, 0, z0, x1, 0.3, z1, { layer: T('plank') });
  };

  M.goal = mb => {
    const w = [240, 240, 240, 255];
    mb.box(-3.66, 0, -0.06, -3.54, 2.44, 0.06, { layer: T('white'), c: w });
    mb.box(3.54, 0, -0.06, 3.66, 2.44, 0.06, { layer: T('white'), c: w });
    mb.box(-3.66, 2.38, -0.06, 3.66, 2.5, 0.06, { layer: T('white'), c: w });
  };

  M.pitchlines = (mb, p) => {
    const w = p.w / 2, l = p.l / 2, t = 0.12;
    const c = [240, 240, 240, 255];
    const L = (x0, z0, x1, z1) => mb.flat(x0, z0, x1, z1, 0.18, { layer: T('white'), c, uv: [0, 0, 1, 0, 1, 1, 0, 1] });
    L(-w, -l, w, -l + t); L(-w, l - t, w, l); L(-w, -l, -w + t, l); L(w - t, -l, w, l); L(-w, -t / 2, w, t / 2);
    for (const s of [-1, 1]) { L(-20, s * l - (s > 0 ? 16.5 : 0), -20 + t, s * l + (s > 0 ? 0 : 16.5)); L(20 - t, s * l - (s > 0 ? 16.5 : 0), 20, s * l + (s > 0 ? 0 : 16.5)); L(-20, s * (l - 16.5) - t / 2, 20, s * (l - 16.5) + t / 2); }
  };

  M.flowerbed = mb => {
    mb.cyl(0, 0, 0, 0.5, 3, 3, 12, { layer: T('granite'), us: 2, vs: 1, cap: true, capLayer: T('flowers') });
  };

  M.monument = (mb, p) => {
    const b = [70, 76, 72, 255];
    const L = T('darkmetal');
    const G = T('granite');
    if (p.kind === 'bust') {
      mb.box(-0.5, 0, -0.5, 0.5, 1.9, 0.5, { layer: G, us: 1, vs: 1 });
      mb.box(-0.44, 1.9, -0.26, 0.44, 2.36, 0.26, { layer: L, c: b });
      mb.box(-0.18, 2.36, -0.2, 0.18, 2.84, 0.2, { layer: L, c: b });
      return;
    }
    if (p.kind === 'stele') {
      mb.box(-1.5, 0, -1.5, 1.5, 0.6, 1.5, { layer: G, us: 2, vs: 2 });
      mb.cyl(0, 0, 0.6, 9, 1.0, 0.45, 4, { layer: G, us: 2, vs: 3 });
      mb.box(-0.35, 9, -0.35, 0.35, 9.7, 0.35, { layer: T('white'), c: [200, 40, 40, 255] });
      return;
    }
    if (p.kind === 'cannon') {
      mb.box(-1.2, 0, -2, 1.2, 1.2, 2, { layer: G, us: 2, vs: 2 });
      const g = [72, 88, 66, 255];
      mb.box(-0.8, 1.2, -0.4, 0.8, 1.9, 0.9, { layer: L, c: g });
      mb.box(-0.14, 1.75, -3.4, 0.14, 2.05, -0.2, { layer: L, c: g });
      mb.box(-0.9, 1.9, -0.9, 0.9, 2.9, -0.8, { layer: L, c: g });
      for (const x of [-0.95, 0.85]) mb.box(x, 1.2, -0.2, x + 0.1, 2.1, 0.7, { layer: L, c: [40, 40, 40, 255] });
      return;
    }
    if (p.kind === 'pobeda') {
      mb.box(-1.5, 0, -3, 1.5, 1.6, 3, { layer: G, us: 2, vs: 2 });
      const c = [58, 74, 66, 255];
      mb.box(-0.86, 1.95, -2.35, 0.86, 2.5, 2.4, { layer: T('metal'), us: 2, vs: 1, c });
      mb.box(-0.78, 2.5, -1.0, 0.78, 3.1, 1.3, { layer: T('metal'), us: 2, vs: 1, c });
      mb.box(-0.8, 2.52, -1.02, 0.8, 3.0, -0.98, { layer: T('carglass'), kind: K.GLASS, us: 1, vs: 1 });
      for (const [x, z] of [[-0.9, -1.45], [0.62, -1.45], [-0.9, 1.5], [0.62, 1.5]]) mb.box(x, 1.6, z - 0.34, x + 0.28, 2.28, z + 0.34, { layer: L, c: [30, 30, 30, 255] });
      return;
    }
    mb.box(-1.6, 0, -1.6, 1.6, 3.2, 1.6, { layer: G, us: 2, vs: 2 });
    if (p.kind === 'lenin') {
      mb.box(-0.55, 3.2, -0.35, 0.55, 5.9, 0.35, { layer: L, c: b });
      mb.box(-0.7, 5.2, -0.4, 0.7, 6.6, 0.4, { layer: L, c: b });
      mb.box(-0.26, 6.6, -0.26, 0.26, 7.2, 0.26, { layer: L, c: b });
      mb.box(0.6, 6.2, -1.3, 0.85, 6.45, -0.2, { layer: L, c: b });
      mb.box(-0.9, 5.4, -0.2, -0.65, 6.3, 0.2, { layer: L, c: b });
    } else {
      mb.box(-0.5, 3.2, -0.3, 0.5, 5.6, 0.3, { layer: L, c: b });
      mb.box(-0.65, 5.1, -0.35, 0.65, 6.4, 0.35, { layer: L, c: b });
      mb.box(-0.24, 6.4, -0.24, 0.24, 7, 0.24, { layer: L, c: b });
      mb.box(0.55, 6.2, -0.2, 0.8, 8.4, 0.05, { layer: L, c: b });
      mb.box(0.3, 8.2, -0.6, 1.4, 8.8, 0.05, { layer: L, c: b });
    }
  };

  M.column = (mb, p) => { mb.cyl(0, 0, 0, p.h || 14, 0.7, 0.62, 10, { layer: T('plaster'), us: 1, vs: 3, c: [250, 244, 232, 255] }); };

  M.portico = (mb, p) => {
    const hw = p.w / 2;
    mb.box(-p.d / 2, p.h, -hw, p.d / 2, p.h + 2.2, hw, { side: { layer: T('dk'), us: 5, vs: 9, c: [250, 244, 232, 255] }, top: { layer: T('roofmetal'), us: 4 } });
    const c = [250, 244, 232, 255];
    mb.quad([p.d / 2 + 0.02, p.h + 2.2, -hw, p.d / 2 + 0.02, p.h + 2.2, hw, p.d / 2 + 0.02, p.h + 6, 0, p.d / 2 + 0.02, p.h + 6, 0], [1, 0, 0], [0, 1, 4, 1, 2, 0, 2, 0], c, T('plaster'), 0);
    mb.quad([-p.d / 2, p.h + 2.2, -hw, p.d / 2, p.h + 2.2, -hw, p.d / 2, p.h + 6, 0, -p.d / 2, p.h + 6, 0], [0, 0.7, -0.7], [0, 0, 2, 0, 2, 6, 0, 6], W, T('roofmetal'), 0);
    mb.quad([p.d / 2, p.h + 2.2, hw, -p.d / 2, p.h + 2.2, hw, -p.d / 2, p.h + 6, 0, p.d / 2, p.h + 6, 0], [0, 0.7, 0.7], [0, 0, 2, 0, 2, 6, 0, 6], W, T('roofmetal'), 0);
  };

  M.chimney = (mb, p) => {
    const h = p.h || 70;
    mb.cyl(0, 0, 0, h, 3.4, 2.0, 12, { layer: T('chimney'), us: 3, vs: h / 7, uWrap: 3 });
    mb.cyl(0, 0, h, h + 1.2, 2.3, 2.3, 12, { layer: T('darkmetal'), c: [60, 60, 60, 255], cap: true, capC: [20, 20, 20, 255] });
    for (let y = h * 0.3; y < h; y += h * 0.3) mb.cyl(0, 0, y, y + 0.4, 3.4 - (y / h) * 1.4 + 0.25, 3.4 - (y / h) * 1.4 + 0.25, 12, { layer: T('darkmetal'), c: [80, 80, 80, 255] });
    mb.box(-0.3, h + 1.2, -0.3, 0.3, h + 1.8, 0.3, { layer: T('lampglow'), kind: K.EMIT, c: [255, 60, 60, 255] });
  };

  M.watertower = mb => {
    mb.cyl(0, 0, 0, 18, 2.2, 2.0, 10, { layer: T('brick5'), us: 3, vs: 3 });
    mb.cyl(0, 0, 18, 24, 3.8, 4.6, 12, { layer: T('metal'), us: 3, vs: 3, cap: true, capLayer: T('roofmetal') });
    mb.cyl(0, 0, 24, 26.5, 4.6, 0.3, 12, { layer: T('roofmetal'), us: 3, vs: 3 });
  };

  M.crane = (mb, p) => {
    const h = p.h || 40;
    const c = [220, 180, 60, 255];
    if (p.portal) {
      for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) mb.box(x - 0.35, 0, z - 0.35, x + 0.35, 9, z + 0.35, { layer: T('cranepaint'), us: 1, vs: 3, c });
      mb.box(-4.6, 9, -4.6, 4.6, 10.4, 4.6, { layer: T('cranepaint'), us: 3, vs: 3, c });
      mb.box(-2, 10.4, -2.5, 2.5, 14.5, 2.5, { side: { layer: T('booth'), us: 3, vs: 3 }, top: { layer: T('tar') } });
      mb.box(-0.7, 10.4, -0.7, 0.7, h - 4, 0.7, { layer: T('cranepaint'), us: 1, vs: 3, c });
      mb.quad([0.4, 14, -0.3, 0.4, 14, 0.3, 0.4, h, -24, 0.4, h - 0.6, -24], [1, 0, 0], [0, 0, 1, 0, 1, 8, 0, 8], c, T('cranepaint'), 0);
      mb.box(-0.4, h - 1.2, -26, 0.4, h, -3, { layer: T('cranepaint'), us: 1, vs: 3, c });
      mb.box(-0.04, 4, -25.2, 0.04, h - 1.2, -25.1, { layer: T('darkmetal'), c: [30, 30, 30, 255] });
      return;
    }
    mb.box(-1, 0, -1, 1, h, 1, { layer: T('cranepaint'), us: 1, vs: 2, c });
    for (let y = 2; y < h; y += 3) mb.box(-1.05, y, -1.05, 1.05, y + 0.15, 1.05, { layer: T('darkmetal'), c: [120, 100, 40, 255] });
    mb.box(-1.2, h, -1.2, 1.2, h + 2.6, 1.2, { side: { layer: T('booth'), us: 2.4, vs: 2.6 }, top: { layer: T('cranepaint'), c } });
    mb.box(-0.6, h + 2.6, -42, 0.6, h + 3.6, 12, { layer: T('cranepaint'), us: 1, vs: 3, c });
    mb.box(-1.5, h + 1.6, 8, 1.5, h + 3.6, 12, { layer: T('concrete'), us: 2, vs: 2 });
    mb.box(-0.3, h + 3.6, -0.3, 0.3, h + 9, 0.3, { layer: T('cranepaint'), us: 1, vs: 2, c });
    mb.box(-0.03, h * 0.4, -30.1, 0.03, h + 2.6, -30, { layer: T('darkmetal'), c: [30, 30, 30, 255] });
    mb.box(-0.8, h * 0.4 - 1.5, -30.8, 0.8, h * 0.4, -29.2, { layer: T('concrete'), us: 2, vs: 2 });
    mb.box(-0.2, h + 9, -0.2, 0.2, h + 9.4, 0.2, { layer: T('lampglow'), kind: K.EMIT, c: [255, 60, 60, 255] });
  };

  M.ferris = (mb, p) => {
    const r = p.r || 20, cy = (p.h || 44) - r - 2;
    const c = [230, 230, 235, 255];
    const seg = 32;
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      for (const x of [-0.8, 0.8]) {
        for (const [ri, ro] of [[r - 0.35, r], [r * 0.55 - 0.2, r * 0.55]]) {
          mb.quad([x, cy + Math.cos(a0) * ri, Math.sin(a0) * ri, x, cy + Math.cos(a1) * ri, Math.sin(a1) * ri, x, cy + Math.cos(a1) * ro, Math.sin(a1) * ro, x, cy + Math.cos(a0) * ro, Math.sin(a0) * ro], [x > 0 ? 1 : -1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], c, T('white'), K.NIGHT);
        }
      }
      if (i % 2 === 0) mb.box(-0.8, cy + Math.cos(a0) * r - 0.06, Math.sin(a0) * r - 0.06, 0.8, cy + Math.cos(a0) * r + 0.06, Math.sin(a0) * r + 0.06, { layer: T('white'), c: [200, 200, 205, 255] });
    }
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      const y = cy + Math.cos(a) * r, z = Math.sin(a) * r;
      mb.quad([0, cy - 0.1, 0, 0, cy + 0.1, 0, 0, y + 0.1, z, 0, y - 0.1, z], [1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], [200, 200, 205, 255], T('white'), 0);
      const col = rgb(['#c83a2a', '#2a6ac8', '#e8c83a', '#3a9a5a'][i % 4]);
      mb.box(-0.9, y - 2.4, z - 0.9, 0.9, y - 0.6, z + 0.9, { side: { layer: T('booth'), us: 1.8, vs: 1.8, c: col }, top: { layer: T('white'), c: col } });
    }
    for (const s of [-1, 1]) {
      mb.quad([s * 1.2, cy, -0.3, s * 1.2, cy, 0.3, s * 3, 0, 8, s * 3, 0, 7.2], [s, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], [160, 160, 170, 255], T('darkmetal'), 0);
      mb.quad([s * 1.2, cy, -0.3, s * 1.2, cy, 0.3, s * 3, 0, -7.2, s * 3, 0, -8], [s, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], [160, 160, 170, 255], T('darkmetal'), 0);
    }
    mb.cyl(0, 0, cy - 0.8, cy + 0.8, 1.2, 1.2, 8, { layer: T('darkmetal'), c: [150, 150, 150, 255] });
  };

  M.carousel = mb => {
    mb.cyl(0, 0, 0, 0.6, 5, 5, 16, { layer: T('plank'), us: 2, vs: 1, cap: true, capLayer: T('plank') });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; mb.box(Math.cos(a) * 4.2 - 0.05, 0.6, Math.sin(a) * 4.2 - 0.05, Math.cos(a) * 4.2 + 0.05, 3.6, Math.sin(a) * 4.2 + 0.05, { layer: T('white'), c: [230, 190, 60, 255] }); }
    mb.cyl(0, 0, 3.6, 5.4, 5.4, 0.3, 16, { layer: T('fabric'), us: 2, vs: 2, c: [230, 80, 80, 255] });
  };

  M.stage = mb => {
    mb.box(-8, 0, -5, 8, 1.4, 5, { side: { layer: T('plaster'), us: 4, vs: 2 }, top: { layer: T('deck'), us: 3 } });
    mb.box(-8, 1.4, 4.6, 8, 7, 5, { layer: T('plaster'), us: 4, vs: 4, c: [230, 225, 215, 255] });
    for (let i = 0; i <= 10; i++) {
      const a = i / 10 * Math.PI;
      const a2 = (i + 1) / 10 * Math.PI;
      if (i === 10) break;
      mb.quad([Math.cos(a) * 8, 1.4 + Math.sin(a) * 6.5, -5, Math.cos(a2) * 8, 1.4 + Math.sin(a2) * 6.5, -5, Math.cos(a2) * 8, 1.4 + Math.sin(a2) * 6.5, 5, Math.cos(a) * 8, 1.4 + Math.sin(a) * 6.5, 5], [Math.cos(a), Math.sin(a), 0], [0, 0, 1, 0, 1, 3, 0, 3], [235, 235, 235, 255], T('plaster'), 0);
    }
  };

  M.metro = (mb, p, atlas) => {
    const f = p.face || 1;
    mb.box(-1.4, 0, -3, 1.4, 3, 3, { side: { layer: T('glass'), kind: K.FACADE, us: 1.5, vs: 3 }, top: { layer: T('tar') } });
    mb.box(-1.8, 3, -3.4, 1.8, 3.3, 3.4, { layer: T('plaster'), us: 3, vs: 3, c: [230, 225, 215, 255] });
    mb.wall(f * 1.41, f * 0.8, f * 1.41, -f * 0.8, 0, 2.3, { layer: T('tar'), us: 1.6, vs: 2.3, c: [40, 40, 44, 255] });
    for (const z of [-0.85, 0.85]) mb.box(f * 1.36 - 0.05, 0, z - 0.05, f * 1.36 + 0.05, 2.4, z + 0.05, { layer: T('darkmetal'), c: [70, 72, 76, 255] });
    mb.box(f * 1.36 - 0.05, 2.3, -0.9, f * 1.36 + 0.05, 2.4, 0.9, { layer: T('darkmetal'), c: [70, 72, 76, 255] });
    const uv = atlas && atlas.map['msign|ВХОД'];
    if (uv) N.signFace(mb, f * 1.47, 2.62, 0, f, 0, 1.1, 0.3, uv, K.SIGN, DARK);
  };

  M.billboard = mb => {
    const steel = { layer: T('darkmetal'), c: [90, 90, 90, 255] };
    for (const x of [-2.6, 2.6]) mb.box(x - 0.15, 0, 0.1, x + 0.15, 3.8, 0.4, steel);
    mb.box(-4.1, 3.6, 0.05, 4.1, 6.9, 0.25, { layer: T('metal'), us: 2, vs: 2 });
    mb.box(-4.1, 3.4, -0.6, 4.1, 3.46, 0.05, { side: { layer: T('metal'), us: 2, vs: 1, c: [128, 130, 132, 255] }, top: { layer: T('metal'), us: 1, c: [150, 152, 154, 255] } });
    mb.box(-4.1, 3.84, -0.62, 4.1, 3.88, -0.58, steel);
    for (let k = 0; k <= 4; k++) mb.box(-4.1 + k * 2.05 - 0.02, 3.46, -0.62, -4.1 + k * 2.05 + 0.02, 3.84, -0.58, steel);
    for (const x of [-2.9, 0, 2.9]) {
      mb.box(x - 0.03, 6.86, -1.0, x + 0.03, 6.92, 0.05, steel);
      mb.box(x - 0.34, 6.8, -1.16, x + 0.34, 6.98, -0.9, { layer: T('darkmetal'), c: [70, 70, 72, 255] });
      mb.flat(x - 0.3, -1.13, x + 0.3, -0.93, 6.79, { layer: T('lampglow'), kind: K.NIGHT, down: true, uv: [0, 0, 1, 0, 1, 1, 0, 1] });
    }
  };

  M.gaipost = (mb, p, atlas) => {
    mb.box(-2, 0, -2, 2, 3, 2, { side: { layer: T('booth'), us: 2, vs: 3 }, top: { layer: T('tar'), us: 2 } });
    mb.box(-2.3, 3, -2.3, 2.3, 3.2, 2.3, { layer: T('white'), c: [40, 70, 150, 255] });
    const uv = atlas.map['shop|ГИБДД'];
    if (uv) N.signFace(mb, 0, 3.6, -2.35, 0, -1, 3.2, 0.6, uv, K.SIGN, DARK);
  };

  M.gate = (mb, p) => {
    const hw = (p.w || 6) / 2;
    for (const x of [-hw - 0.2, hw]) mb.box(x, 0, -0.2, x + 0.2, 2.8, 0.2, { layer: T('brick5'), us: 1, vs: 2 });
    if (p.open) {
      mb.box(-hw, 0.1, 0, -hw + 0.08, 2.4, hw * 0.9, { layer: T('metal'), us: 2, vs: 2, c: [90, 120, 90, 255] });
      mb.box(hw - 0.08, 0.1, 0, hw, 2.4, hw * 0.9, { layer: T('metal'), us: 2, vs: 2, c: [90, 120, 90, 255] });
    }
  };

  M.debarkader = (mb, p) => {
    const hw = p.w / 2, hl = p.l / 2;
    mb.box(-hw, -2.2, -hl, hw, 0.1, hl, { side: { layer: T('hullpaint'), us: 4, vs: 2.3 }, top: { layer: T('deck'), us: 3 } });
    mb.box(-hw + 6, 0.1, -hl + 8, hw - 5, 3.2, hl - 8, { side: { layer: T('wood'), kind: K.FACADE, us: 4, vs: 3.2 }, top: { layer: T('roofgreen'), us: 3 } });
    mb.box(-hw + 5.5, 3.2, -hl + 7.5, hw - 4.5, 3.4, hl - 7.5, { layer: T('white'), c: [240, 240, 240, 255] });
    mb.box(-hw + 9, 3.4, -4, hw - 8, 5.4, 4, { side: { layer: T('wood'), kind: K.FACADE, us: 4, vs: 2 }, top: { layer: T('roofgreen'), us: 3 } });
    mb.box(-hw - 0.8, 0.9, -2, -hw, 1.0, 2, { layer: T('deck'), us: 2 });
    mb.box(-0.06, 5.4, -0.06, 0.06, 9, 0.06, { layer: T('white'), c: [240, 240, 240, 255] });
  };

  M.boat = (mb, p) => {
    const l = (p.l || 18) / 2;
    mb.box(-2.4, -1.6, -l, 2.4, 0.5, l, { side: { layer: T('hullpaint'), us: 4, vs: 2 }, top: { layer: T('deck'), us: 2 } });
    mb.box(-1.8, 0.5, -l * 0.5, 1.8, 2.6, l * 0.4, { side: { layer: T('booth'), us: 3, vs: 2.1 }, top: { layer: T('white'), c: [230, 230, 230, 255] } });
  };

  M.barge = (mb, p) => {
    const l = p.l / 2, w = p.w / 2;
    mb.box(-w, -2.4, -l, w, 1.2, l, { side: { layer: T('rust'), us: 6, vs: 3 }, top: { layer: T('darkmetal'), us: 4 } });
    for (let i = 0; i < 6; i++) mb.box(-w + 2, 1.2, -l + 6 + i * 10, w - 2, 3.8, -l + 12 + i * 10, { side: { layer: T('container'), us: 6, vs: 2.6, c: rgb(['#c83a2a', '#2a5aa8', '#3a8a4a'][i % 3]) }, top: { layer: T('container'), c: rgb(['#c83a2a', '#2a5aa8', '#3a8a4a'][i % 3]) } });
    mb.box(-w + 1, 1.2, l - 8, w - 1, 6, l - 2, { side: { layer: T('booth'), us: 3, vs: 2.4 }, top: { layer: T('white'), c: [220, 220, 220, 255] } });
  };

  M.pipes = (mb, p) => {
    const dx = p.x1 - p.x0, dz = p.z1 - p.z0;
    const L = Math.hypot(dx, dz);
    const ux = dx / L, uz = dz / L;
    const cx = (p.x0 + p.x1) / 2, cz = (p.z0 + p.z1) / 2;
    for (let s = -L / 2; s < L / 2; s += 8) mb.box(ux * s - 0.15, 0, uz * s - 0.15, ux * s + 0.15, 1.6, uz * s + 0.15, { layer: T('concrete'), us: 1, vs: 1 });
    for (const o of [-0.5, 0.5]) {
      const ox = -uz * o, oz = ux * o;
      mb.box(Math.min(-ux * L / 2, ux * L / 2) + ox - 0.35, 1.6, Math.min(-uz * L / 2, uz * L / 2) + oz - 0.35, Math.max(-ux * L / 2, ux * L / 2) + ox + 0.35, 2.3, Math.max(-uz * L / 2, uz * L / 2) + oz + 0.35, { layer: T('metal'), us: 3, vs: 1, c: [200, 200, 200, 255] });
    }
  };

  M.wreck = mb => {
    const c = [60, 50, 44, 255];
    mb.box(-0.8, 0.2, -2, 0.8, 0.9, 2, { layer: T('wreck'), us: 2, vs: 1, c });
    mb.box(-0.7, 0.9, -0.9, 0.7, 1.35, 0.8, { layer: T('wreck'), us: 2, vs: 1, c });
  };

  M.slabs = mb => { for (let i = 0; i < 5; i++) mb.box(-3 + i * 0.05, i * 0.28, -1.5, 3 - i * 0.05, i * 0.28 + 0.26, 1.5, { layer: T('concrete'), us: 3, vs: 3 }); };

  M.trailer = mb => {
    mb.box(-4, 0.4, -3, 4, 3.2, 3, { side: { layer: T('metal'), us: 3, vs: 3, c: [120, 150, 120, 255] }, top: { layer: T('metal'), us: 3 } });
    mb.wall(-2, -3.01, 1, -3.01, 1.4, 2.5, { layer: T('booth'), kind: K.FACADE, us: 3, vs: 1.1, v0: 0.4 });
  };

  M.ramp = () => { };

  M.roofbox = mb => { mb.box(-2, 0, -2, 2, 2.6, 2, { side: { layer: T('plaster'), us: 3, vs: 3 }, top: { layer: T('tar') } }); };

  M.canopy = (mb, p) => {
    const w = (p.w || 4) / 2;
    mb.box(-w, 2.95, -1.8, w, 3.12, 0, { side: { layer: T(p.neon ? 'club' : 'plaster'), us: 2, vs: 2 }, top: { layer: T('tar') } });
    if (p.neon) mb.box(-w, 3.05, -1.85, w, 3.12, -1.75, { layer: T('lampglow'), kind: K.EMIT, c: [255, 80, 220, 255] });
    for (const x of [-w + 0.2, w - 0.2]) mb.box(x - 0.06, 0, -1.7, x + 0.06, 2.95, -1.58, { layer: T('darkmetal'), c: DARK });
    mb.flat(-w + 0.3, -1.6, w - 0.3, -0.2, 2.93, { layer: T('lampglow'), kind: K.NIGHT, down: true, uv: [0, 0, 1, 0, 1, 1, 0, 1] });
    if (p.door) door(mb, 0.05, 0);
  };

  const door = (mb, y0, z) => {
    mb.box(-1.1, y0, z - 0.08, 1.1, y0 + 2.7, z, { layer: T('darkmetal'), c: [58, 50, 42, 255] });
    mb.wall(0.95, z - 0.09, -0.95, z - 0.09, y0, y0 + 2.15, { layer: T('dkglass'), kind: K.FACADE, us: 1.9, vs: 2.15, v0: 0 });
    mb.wall(0.95, z - 0.09, -0.95, z - 0.09, y0 + 2.25, y0 + 2.6, { layer: T('dkglass'), kind: K.FACADE, us: 1.9, vs: 0.35, v0: 0 });
  };

  M.porch = (mb, p) => {
    const w = (p.w || 3) / 2 + 0.8;
    const gran = { side: { layer: T('granite'), us: 1.5, vs: 1, c: [150, 146, 142, 255] }, top: { layer: T('granite'), us: 1.5, c: [172, 168, 162, 255] } };
    for (let k = 0; k < 3; k++) mb.box(-w, -0.2, -2.6 + k * 0.4, w, 0.15 * (k + 1), 0, gran);
    door(mb, 0.45, 0);
    const cream = [246, 238, 220, 255];
    for (const s of [-1, 1]) {
      mb.cyl(s * (w - 0.35), -2.9, 0, 3.0, 0.24, 0.2, 10, { layer: T('stucco'), us: 0.6, vs: 3, c: cream });
      mb.box(s * (w - 0.35) - 0.3, 0, -3.2, s * (w - 0.35) + 0.3, 0.3, -2.6, { layer: T('granite'), us: 1, vs: 1, c: [150, 146, 142, 255] });
      mb.box(s * 1.45 - 0.12, 2.1, -0.22, s * 1.45 + 0.12, 2.45, -0.02, { layer: T('lampglow'), kind: K.NIGHT, c: [255, 246, 220, 255] });
    }
    mb.box(-w - 0.3, 3.0, -3.4, w + 0.3, 3.32, 0, { side: { layer: T('stucco'), us: 2, vs: 1, c: cream }, top: { layer: T('tar'), us: 2 } });
    mb.flat(-w + 0.2, -3.1, w - 0.2, -0.3, 2.99, { layer: T('lampglow'), kind: K.NIGHT, down: true, uv: [0, 0, 1, 0, 1, 1, 0, 1] });
  };

  M.canopy2 = (mb, p) => {
    const w = (p.w || 8) / 2;
    for (const [x, z] of [[-w, -3], [w, -3], [-w, 3], [w, 3]]) mb.box(x - 0.08, 0, z - 0.08, x + 0.08, 3, z + 0.08, { layer: T('darkmetal'), c: DARK });
    mb.box(-w - 0.5, 3, -3.5, w + 0.5, 3.15, 3.5, { layer: T('metal'), us: 3, vs: 3 });
    mb.box(-1.5, 0, -1, 1.5, 0.9, 1, { side: { layer: T('plank'), us: 1, vs: 1 }, top: { layer: T('plank') } });
  };

  M.flag = mb => {
    mb.box(-0.05, 0, -0.05, 0.05, 9, 0.05, { layer: T('white'), c: [200, 200, 200, 255] });
    const cols = [[240, 240, 240, 255], [40, 70, 170, 255], [200, 40, 40, 255]];
    for (let i = 0; i < 3; i++) mb.quad([0.05, 8.6 - i * 0.5, 0, 2.4, 8.6 - i * 0.5, 0, 2.4, 8.1 - i * 0.5, 0, 0.05, 8.1 - i * 0.5, 0], [0, 0, 1], [0, 0, 1, 0, 1, 1, 0, 1], cols[i], T('white'), 0);
  };

  M.lampmast = (mb, p) => {
    const h = p.h || 16;
    mb.box(-0.2, 0, -0.2, 0.2, h, 0.2, { layer: T('darkmetal'), c: [110, 110, 110, 255] });
    mb.box(-1.4, h, -0.4, 1.4, h + 0.9, 0.4, { layer: T('darkmetal'), c: [80, 80, 80, 255] });
    mb.flat(-1.3, -0.35, 1.3, 0.35, h - 0.01, { layer: T('lampglow'), kind: K.NIGHT, down: true, uv: [0, 0, 1, 0, 1, 1, 0, 1] });
  };

  M.floodlight = (mb, p) => {
    const h = p.h || 34;
    mb.cyl(0, 0, 0, h, 0.8, 0.4, 6, { layer: T('darkmetal'), c: [140, 140, 140, 255], us: 2, vs: 4 });
    mb.box(-2.6, h, -0.4, 2.6, h + 3.4, 0.4, { layer: T('darkmetal'), c: [90, 90, 90, 255] });
    mb.wall(2.6, 0.41, -2.6, 0.41, h + 0.2, h + 3.2, { layer: T('lampglow'), kind: K.NIGHT, us: 5.2, vs: 3, v0: 0 });
  };

  M.podezd = (mb, p) => {
    mb.box(-0.95, 2.45, -1.1, 0.95, 2.6, 0, { side: { layer: T('concrete'), us: 2, vs: 2 }, top: { layer: T('tar') } });
    mb.quad([0.62, 0.1, -0.05, -0.62, 0.1, -0.05, -0.62, 2.25, -0.05, 0.62, 2.25, -0.05], [0, 0, -1], [0, 1, 1, 1, 1, 0, 0, 0], p.marked ? [230, 80, 170, 255] : [110, 80, 60, 255], T('darkmetal'), 0);
    mb.box(-0.12, 2.28, -0.24, 0.12, 2.44, -0.04, { layer: T('lampglow'), kind: K.NIGHT });
    mb.box(-1, 0, -1.3, 1, 0.14, 0, { layer: T('concrete'), us: 2, vs: 2 });
  };

  M.tent = (mb, p) => {
    const c = rgb(p.c || '#c83030');
    for (const [x, z] of [[-2.8, -2.8], [2.8, -2.8], [-2.8, 2.8], [2.8, 2.8]]) mb.box(x - 0.05, 0, z - 0.05, x + 0.05, 2.3, z + 0.05, { layer: T('darkmetal'), c: DARK });
    const L = T('fabric');
    const top = 3.1;
    const tri = (a, b, n) => mb.quad([a[0], 2.3, a[1], b[0], 2.3, b[1], 0, top, 0, 0, top, 0], n, [0, 1, 1, 1, 0.5, 0, 0.5, 0], c, L, 0);
    tri([-3, -3], [3, -3], [0, 0.5, -0.8]);
    tri([3, -3], [3, 3], [0.8, 0.5, 0]);
    tri([3, 3], [-3, 3], [0, 0.5, 0.8]);
    tri([-3, 3], [-3, -3], [-0.8, 0.5, 0]);
    mb.box(-2.8, 0, -2.8, 2.8, 0.9, -2.2, { layer: T('plank'), us: 2, vs: 1 });
  };

  M.phone = mb => {
    mb.box(-0.5, 0, -0.5, 0.5, 2.25, 0.5, { side: { layer: T('glass'), kind: K.FACADE, us: 1, vs: 2.25 }, top: { layer: T('metal'), us: 1 } });
    mb.box(-0.56, 2.25, -0.56, 0.56, 2.42, 0.56, { layer: T('white'), c: [186, 44, 40, 255] });
    mb.box(-0.3, 1.1, 0.36, 0.3, 1.7, 0.48, { layer: T('darkmetal'), c: [60, 60, 64, 255] });
  };

  M.pier = (mb, p) => {
    const hl = (p.l || 18) / 2, hw = (p.w || 4) / 2;
    mb.box(-hw, -0.3, -hl, hw, 0.1, hl, { side: { layer: T('plank'), us: 2, vs: 1 }, top: { layer: T('deck'), us: 2 } });
    for (let z = -hl + 1; z <= hl - 0.5; z += 3) for (const x of [-hw + 0.25, hw - 0.25]) {
      mb.box(x - 0.13, -3.2, z - 0.13, x + 0.13, -0.3, z + 0.13, { layer: T('trunk'), us: 1, vs: 2 });
      mb.box(x - 0.05, 0.1, z - 0.05, x + 0.05, 1.05, z + 0.05, { layer: T('darkmetal'), c: [90, 90, 90, 255] });
    }
    for (const x of [-hw + 0.25, hw - 0.25]) mb.box(x - 0.04, 0.98, -hl + 1, x + 0.04, 1.06, hl - 0.5, { layer: T('darkmetal'), c: [90, 90, 90, 255] });
  };

  M.gangway = (mb, p) => {
    const hl = (p.l || 10) / 2;
    mb.box(-1.1, -0.12, -hl, 1.1, 0.12, hl, { side: { layer: T('metal'), us: 2, vs: 1 }, top: { layer: T('deck'), us: 2 } });
    for (const x of [-1.05, 1.05]) {
      for (let z = -hl + 0.4; z <= hl - 0.3; z += 1.6) mb.box(x - 0.03, 0.12, z - 0.03, x + 0.03, 1.1, z + 0.03, { layer: T('white'), c: [220, 220, 220, 255] });
      mb.box(x - 0.04, 1.04, -hl + 0.4, x + 0.04, 1.1, hl - 0.3, { layer: T('white'), c: [220, 220, 220, 255] });
    }
  };

  M.barrier = (mb, p) => {
    const w = (p.w || 6) / 2;
    mb.box(-w - 0.3, 0, -0.3, -w + 0.3, 1.1, 0.3, { layer: T('concrete'), us: 1, vs: 1 });
    mb.box(-w + 0.2, 0.95, -0.06, w, 1.08, 0.06, { layer: T('barrier'), us: 1.2, vs: 0.4 });
  };

  const PANELS = ['fence', 'picket', 'rail'];
  const BIG = { ferrisbase: [12, 20], tir: [7, 5], autodrom: [14, 6], dancefloor: [13, 7], swings: [10, 9], waltz: [9, 3], carousel: [8, 4], pkoarch: [8, 6], attrgate: [5, 8] };
  const SCRATCH = new N.MB(256);
  const DEBRIS = new Map();
  const DEBRIS_LOOK = { urn: { layer: T('concrete'), us: 0.5, vs: 0.5, c: [190, 186, 178, 255] }, crate: { layer: T('plank'), us: 0.5, vs: 0.5, c: [214, 176, 120, 255] } };
  const LIT = new Set([K.NIGHT, K.LAMP, K.EMIT]);

  const meshOf = (geo, p, cache) => {
    if (PANELS.includes(p.type)) {
      SCRATCH.nv = 0;
      SCRATCH.ni = 0;
      M[p.type](SCRATCH, p, geo.atlas);
      return SCRATCH;
    }
    const unique = ['kiosk', 'pipes', 'tent', 'pitchlines', 'portico', 'debarkader', 'barge', 'boat', 'pier', 'gangway'];
    const key = unique.includes(p.type) ? null : [p.type, p.h, p.w, p.park, p.median, p.marked, p.neon, p.kind, p.open, p.portal, p.door, p.tone, p.sign, p.fruit, p.face, p.r, p.l, p.d, p.hl, p.hw, p.big, p.hub].join('|');
    let mesh = key && cache ? cache.get(key) : null;
    if (!mesh) {
      mesh = new N.MB(256);
      M[p.type](mesh, p, geo.atlas);
      if (key && cache) cache.set(key, mesh);
    }
    return mesh;
  };

  const owner = (pieces, x, y, z) => {
    let best = -1, bv = Infinity, near = -1, nd = Infinity;
    pieces.forEach((pc, k) => {
      for (const b of pc.boxes) {
        const m = 0.03;
        const vol = (b.x1 - b.x0) * (b.y1 - b.y0) * (b.z1 - b.z0);
        if (x >= b.x0 - m && x <= b.x1 + m && y >= b.y0 - m && y <= b.y1 + m && z >= b.z0 - m && z <= b.z1 + m && vol < bv) { bv = vol; best = k; }
        const d = Math.hypot(x - (b.x0 + b.x1) / 2, y - (b.y0 + b.y1) / 2, z - (b.z0 + b.z1) / 2);
        if (d < nd) { nd = d; near = k; }
      }
    });
    return best >= 0 ? best : near;
  };

  const unlit = mb => {
    for (let i = 0; i < mb.nv; i++) {
      const b = i * 32;
      if (!LIT.has(mb.u8[b + 29])) continue;
      mb.u8[b + 29] = 0;
      mb.u8[b + 24] = mb.u8[b + 24] * 0.45 | 0; mb.u8[b + 25] = mb.u8[b + 25] * 0.45 | 0; mb.u8[b + 26] = mb.u8[b + 26] * 0.45 | 0;
    }
    return mb;
  };

  const DENT_EDGE = 0.2;
  const dentVertex = (mb, i) => {
    const o = i * 8, b = i * 32;
    return { x: mb.f[o], y: mb.f[o + 1], z: mb.f[o + 2], nx: mb.i8[b + 12], ny: mb.i8[b + 13], nz: mb.i8[b + 14], u: mb.f[o + 4], v: mb.f[o + 5], tail: mb.u8.slice(b + 24, b + 32) };
  };
  const dentMid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, nx: (a.nx + b.nx) / 2, ny: (a.ny + b.ny) / 2, nz: (a.nz + b.nz) / 2, u: (a.u + b.u) / 2, v: (a.v + b.v) / 2, tail: a.tail });
  const dentNear = (dents, a, b, c) => {
    const x0 = Math.min(a.x, b.x, c.x), x1 = Math.max(a.x, b.x, c.x), y0 = Math.min(a.y, b.y, c.y), y1 = Math.max(a.y, b.y, c.y), z0 = Math.min(a.z, b.z, c.z), z1 = Math.max(a.z, b.z, c.z);
    return dents.some(q => q.x > x0 - q.r && q.x < x1 + q.r && q.y > y0 - q.r && q.y < y1 + q.r && q.z > z0 - q.r && q.z < z1 + q.r);
  };
  const dentMove = (dents, p) => {
    let dx = 0, dy = 0, dz = 0;
    for (const q of dents) {
      const d2 = (p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2, r2 = q.r * q.r;
      if (d2 >= r2) continue;
      const k = (1 - d2 / r2) ** 2 * q.d;
      dx += q.dx * k; dy += q.dy * k; dz += q.dz * k;
    }
    return dx || dy || dz ? { x: p.x + dx, y: p.y + dy, z: p.z + dz } : null;
  };
  const dentMesh = (base, dents, reuse) => {
    const tris = [];
    const split = (a, b, c, depth) => {
      const ab = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z), bc = Math.hypot(b.x - c.x, b.y - c.y, b.z - c.z), ca = Math.hypot(c.x - a.x, c.y - a.y, c.z - a.z);
      const m = Math.max(ab, bc, ca);
      if (m <= DENT_EDGE || depth > 7 || !dentNear(dents, a, b, c)) { tris.push(a, b, c); return; }
      if (m === ab) { const q = dentMid(a, b); split(a, q, c, depth + 1); split(q, b, c, depth + 1); }
      else if (m === bc) { const q = dentMid(b, c); split(a, b, q, depth + 1); split(a, q, c, depth + 1); }
      else { const q = dentMid(c, a); split(a, b, q, depth + 1); split(q, b, c, depth + 1); }
    };
    for (let i = 0; i < base.ni; i += 3) split(dentVertex(base, base.idx[i]), dentVertex(base, base.idx[i + 1]), dentVertex(base, base.idx[i + 2]), 0);
    const mb = reuse || new N.MB(tris.length);
    mb.nv = 0;
    mb.ni = 0;
    mb.ensure(tris.length, tris.length);
    for (let i = 0; i < tris.length; i += 3) {
      const P = [tris[i], tris[i + 1], tris[i + 2]], Q = P.map(p => dentMove(dents, p));
      let fn = null;
      if (Q[0] || Q[1] || Q[2]) {
        const A = Q[0] || P[0], B = Q[1] || P[1], Cc = Q[2] || P[2];
        const ux = B.x - A.x, uy = B.y - A.y, uz = B.z - A.z, vx = Cc.x - A.x, vy = Cc.y - A.y, vz = Cc.z - A.z;
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const L = Math.hypot(nx, ny, nz);
        if (L > 1e-9) {
          nx /= L; ny /= L; nz /= L;
          if (nx * (P[0].nx + P[1].nx + P[2].nx) + ny * (P[0].ny + P[1].ny + P[2].ny) + nz * (P[0].nz + P[1].nz + P[2].nz) < 0) { nx = -nx; ny = -ny; nz = -nz; }
          fn = [nx * 127, ny * 127, nz * 127];
        }
      }
      for (let k = 0; k < 3; k++) {
        const p = P[k], q = Q[k] || p, n = mb.nv++, o = n * 8, b = n * 32;
        mb.f[o] = q.x; mb.f[o + 1] = q.y; mb.f[o + 2] = q.z;
        const nn = fn || [p.nx, p.ny, p.nz], L = Math.hypot(nn[0], nn[1], nn[2]) || 1;
        mb.i8[b + 12] = Math.round(nn[0] / L * 127); mb.i8[b + 13] = Math.round(nn[1] / L * 127); mb.i8[b + 14] = Math.round(nn[2] / L * 127); mb.i8[b + 15] = 0;
        mb.f[o + 4] = p.u; mb.f[o + 5] = p.v;
        mb.u8.set(p.tail, b + 24);
        mb.idx[mb.ni++] = n;
      }
    }
    return mb;
  };

  N.Props = {
    M,
    PANELS,
    dentMesh,

    place(geo, ch, p, gy, cache) {
      if (!M[p.type]) return;
      const mesh = meshOf(geo, p, cache);
      let y = gy + (p.lift || 0);
      if (p.type === 'debarkader' || p.type === 'boat' || p.type === 'barge' || p.type === 'pier' || p.type === 'gangway') y = 0;
      if (p.type === 'pipes') { ch.mb.append(mesh, (p.x0 + p.x1) / 2, gy, (p.z0 + p.z1) / 2, 0); geo.grow(ch, Math.min(p.x0, p.x1), Math.min(p.z0, p.z1), Math.max(p.x0, p.x1), Math.max(p.z0, p.z1), 3); return; }
      const v0 = ch.mb.nv;
      ch.mb.append(mesh, p.x, y, p.z, p.rot || 0);
      if (p.brk) geo.brkVerts.set(p, { ch, v0, v1: ch.mb.nv, y });
      const big = BIG[p.type];
      const r = big ? big[0] : p.type === 'crane' ? 45 : p.type === 'ferris' ? 24 : p.type === 'debarkader' || p.type === 'barge' ? 40 : p.type === 'gazportal' ? 26 : p.type === 'parkgate' ? 18 : p.type === 'fountain' ? Math.max(8, (p.l ? p.l / 2 : p.r || 0) + 2) : 6;
      const top = big ? big[1] : p.type === 'chimney' || p.type === 'crane' ? (p.h || 40) + 12 : p.type === 'ferris' ? 46 : p.type === 'floodlight' ? 40 : p.type === 'parkgate' || p.type === 'gazportal' ? 20 : 10;
      geo.grow(ch, p.x - r, p.z - r, p.x + r, p.z + r, y + top);
      if (p.type === 'lamp') {
        const fx = Math.sin(p.rot || 0), fz = -Math.cos(p.rot || 0);
        if (p.park) geo.lamps.push({ x: p.x, y: gy + 3.9, z: p.z, park: true, p });
        else {
          geo.lamps.push({ x: p.x + fx * 2.3, y: gy + 7.9, z: p.z + fz * 2.3, p });
          if (p.median) geo.lamps.push({ x: p.x - fx * 2.3, y: gy + 7.9, z: p.z - fz * 2.3, p });
        }
      }
      if (p.type === 'globelamp') geo.lamps.push({ x: p.x, y: gy + 4.3, z: p.z, park: true, p });
      if (p.type === 'trafficlight') { p.gy = gy; geo.tlights.push(p); }
    },

    rebuild(geo, p, y) {
      const out = new N.MB(256);
      out.append(meshOf(geo, p, null), p.x, y, p.z, p.rot || 0);
      return out;
    },

    debris(geo, b) {
      const base = this.debrisBase(geo, b);
      if (!b.dents || !b.dents.length) return base;
      if (b.dentMesh && b.dentMeshVer === b.dentVer) return b.dentMesh;
      b.dentMesh = dentMesh(base, b.dents, b.dentMesh);
      b.dentMeshVer = b.dentVer;
      return b.dentMesh;
    },

    debrisBase(geo, b) {
      const p = b.rec.p, key = b.key + '|' + b.mesh + '|' + [p.tone, p.sign, p.fruit].join('|');
      let mb = DEBRIS.get(key);
      if (mb) return mb;
      mb = new N.MB(256);
      if (b.mesh === 'box') {
        const look = DEBRIS_LOOK[p.type] || { layer: T('metal') };
        for (const q of b.sh.boxes) mb.box(q.x0, q.y0, q.z0, q.x1, q.y1, q.z1, look);
      } else {
        const full = new N.MB(256);
        M[p.type](full, p, geo.atlas);
        if (b.part < 0) mb.append(full, 0, 0, 0, 0);
        else {
          const pieces = N.Debris.piecesOf(b.rec);
          for (let i = 0; i < full.ni; i += 3) {
            const a = full.idx[i], c = full.idx[i + 1], d = full.idx[i + 2], F = full.f;
            const x = (F[a * 8] + F[c * 8] + F[d * 8]) / 3, y = (F[a * 8 + 1] + F[c * 8 + 1] + F[d * 8 + 1]) / 3, z = (F[a * 8 + 2] + F[c * 8 + 2] + F[d * 8 + 2]) / 3;
            if (owner(pieces, x, y, z) !== b.part) continue;
            mb.ensure(3, 3);
            const base = mb.nv;
            for (const v of [a, c, d]) { mb.u8.set(full.u8.subarray(v * 32, v * 32 + 32), mb.nv * 32); mb.nv++; }
            mb.tri(base, base + 1, base + 2);
          }
        }
      }
      unlit(mb);
      DEBRIS.set(key, mb);
      return mb;
    }
  };

  N.EXTRA_SIGNS = [{ style: 'shop', text: 'ОСТАНОВКА', w: 2.4, h: 0.34 }, { style: 'shop', text: 'ГИБДД', w: 3.2, h: 0.6 }].concat(N.KIOSKS.map(t => ({ style: 'shop', text: t, w: 3.0, h: 0.54 })));

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
