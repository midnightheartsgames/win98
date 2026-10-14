(function (O) {
  'use strict';
  const PI = Math.PI;
  const P = {};

  function blobs(M, n, cx, cy, cz, r, c1, c2, rnd, spread) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * PI * 2, d = rnd() * r * (spread || 0.8), h = (rnd() - 0.4) * r * 0.6;
      const rr = r * (0.45 + rnd() * 0.35);
      M.sphere(cx + Math.cos(a) * d, cy + h, cz + Math.sin(a) * d, rr, rr * 0.8, rr, i % 2 ? c1 : c2, { lat: 4, lon: 6 });
    }
  }

  P.tree_sakura = (M, o, r) => {
    const bark = 0x5a3a2a;
    M.tube([[0, 0, 0], [0.1, 1.4, 0.05], [-0.1, 2.6, -0.1], [0.2, 3.4, 0.1]], 0.2, bark, { seg: 6, r0: 0.26, r1: 0.12 });
    M.tube([[0, 2.2, 0], [0.9, 3.0, 0.3]], 0.1, bark, { seg: 5 });
    M.tube([[0, 2.4, 0], [-0.9, 3.1, -0.4]], 0.1, bark, { seg: 5 });
    blobs(M, 9, 0, 3.7, 0, 1.6, o.c1 || 0xf4a8c4, o.c2 || 0xfac8d8, r, 1);
  };
  P.tree_round = (M, o, r) => {
    M.tube([[0, 0, 0], [0, 2.4, 0]], 0.2, 0x5a4030, { seg: 6, r0: 0.24, r1: 0.14 });
    blobs(M, 7, 0, 3.2, 0, 1.4, o.c1 || 0x4a8a3a, o.c2 || 0x5a9a44, r, 0.9);
  };
  P.tree_olive = (M, o, r) => {
    M.tube([[0, 0, 0], [0.3, 1.0, 0], [0, 1.9, 0.2]], 0.18, 0x6a5a48, { seg: 5, r0: 0.25, r1: 0.12 });
    blobs(M, 6, 0, 2.4, 0.1, 1.2, 0x7a8a60, 0x8a9a70, r, 0.9);
  };
  P.tree_pine = (M, o) => {
    M.cyl(0, 1.2, 0, 0.22, 0.16, 2.4, 6, 0x4a3426);
    for (let i = 0; i < 4; i++) {
      const y = 1.4 + i * 1.0, rr = 1.7 - i * 0.35;
      M.cyl(0, y + 0.6, 0, rr, 0.05, 1.5, 7, o.dark || 0x2a4a34);
      if (o.snow) M.cyl(0, y + 0.95, 0, rr * 0.55, 0.02, 0.8, 7, 0xeef2f8);
    }
  };
  P.tree_palm = (M, o, r) => {
    const h = 7 + (o.h || 0);
    const bend = r() * 0.8 - 0.4;
    const pts = [];
    for (let i = 0; i <= 5; i++) { const f = i / 5; pts.push([Math.sin(f * 1.5) * bend * 1.5, f * h, Math.sin(f * 1.2) * bend]); }
    M.tube(pts, 0.2, 0x8a6a4a, { seg: 6, r0: 0.28, r1: 0.16 });
    const top = pts[pts.length - 1];
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * PI * 2 + r() * 0.3;
      M.at(top[0], top[1], top[2], 0, a, 0);
      M.quad([0, 0, 0.1], [0, 0, -0.1], [2.6, -1.2, -0.35], [2.6, -1.2, 0.35], 0x3a8a34);
      M.quad([0, 0, -0.1], [0, 0, 0.1], [2.6, -1.2, 0.35], [2.6, -1.2, -0.35], 0x2e7a2a);
      M.pop();
    }
    M.sphere(top[0], top[1] - 0.2, top[2], 0.4, 0.4, 0.4, 0x6a5030, { lat: 4, lon: 6 });
  };
  P.bush = (M, o, r) => blobs(M, 4, 0, 0.5, 0, 0.8, o.c1 || 0x4a7a36, o.c2 || 0x5a8a40, r, 0.8);
  P.flower = (M, o, r) => { for (let i = 0; i < 6; i++) M.sphere((r() - 0.5) * 0.8, 0.2, (r() - 0.5) * 0.8, 0.12, 0.1, 0.12, [0xe84a6a, 0xf0d040, 0xf0f0f0][i % 3], { lat: 3, lon: 5 }); M.box(0, 0.08, 0, 1, 0.16, 1, 0x4a7a36); };
  P.lamp = (M, o) => {
    M.cyl(0, 2.1, 0, 0.08, 0.06, 4.2, 6, o.c || 0x2a2e34);
    M.box(0, 0.15, 0, 0.3, 0.3, 0.3, o.c || 0x2a2e34);
    M.sphere(0, 4.25, 0, 0.28, 0.3, 0.28, o.glow || 0xfff0c0, { lat: 4, lon: 6, emit: 1 });
    M.cyl(0, 4.6, 0, 0.3, 0.08, 0.2, 6, o.c || 0x2a2e34);
  };
  P.lamp2 = (M, o) => {
    M.cyl(0, 2.3, 0, 0.09, 0.07, 4.6, 6, o.c || 0x2a2e34);
    M.box(0, 4.3, 0, 1.4, 0.08, 0.08, o.c || 0x2a2e34);
    for (const x of [-0.65, 0.65]) M.sphere(x, 4.1, 0, 0.22, 0.26, 0.22, o.glow || 0xfff0c0, { lat: 4, lon: 6, emit: 1 });
  };
  P.lantern_stone = (M) => {
    M.box(0, 0.1, 0, 0.8, 0.2, 0.8, 0x9a948a);
    M.cyl(0, 0.6, 0, 0.14, 0.14, 0.8, 6, 0xa8a298);
    M.box(0, 1.1, 0, 0.6, 0.2, 0.6, 0xa8a298);
    M.box(0, 1.35, 0, 0.44, 0.3, 0.44, 0xfff0b0, { emit: 0.7 });
    M.cyl(0, 1.62, 0, 0.55, 0.05, 0.28, 4, 0x8a847a, { rot: [0, PI / 4, 0] });
  };
  P.lanterns = (M, o) => {
    const tx = o.to[0], tz = o.to[1], h = o.h || 4, n = o.n || 8;
    M.tube([[0, h, 0], [tx / 2, h - 0.5, tz / 2], [tx, h, tz]], 0.015, 0x2a2a2a, { seg: 3 });
    for (let i = 1; i < n; i++) {
      const f = i / n, sag = Math.sin(f * PI) * 0.5;
      M.sphere(tx * f, h - sag - 0.3, tz * f, 0.22, 0.28, 0.22, o.c || 0xe03a20, { lat: 4, lon: 6, emit: 0.8 });
    }
  };
  P.string = (M, o) => {
    const tx = o.to[0], tz = o.to[1], h = o.h || 4, n = o.n || 12;
    const cols = o.cols || [0xffe080, 0xff8060, 0x80d0ff, 0xa0ff80];
    for (let i = 1; i < n; i++) { const f = i / n, sag = Math.sin(f * PI) * 0.6; M.sphere(tx * f, h - sag, tz * f, 0.09, 0.09, 0.09, cols[i % cols.length], { lat: 3, lon: 4, emit: 1 }); }
  };
  P.papel = (M, o, r) => {
    const tx = o.to[0], tz = o.to[1], h = o.h || 4.5, n = o.n || 14;
    const cols = [0xe83a5a, 0xf0c030, 0x30b0e0, 0x50c050, 0xe070d0, 0xf07030];
    const l = Math.hypot(tx, tz) || 1, ux = tx / l, uz = tz / l;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n, sag = Math.sin(f * PI) * 0.5;
      const x = tx * f, z = tz * f, y = h - sag;
      const c = cols[(i + (r() * 6 | 0)) % cols.length];
      M.quad([x - ux * 0.25, y, z - uz * 0.25], [x + ux * 0.25, y, z + uz * 0.25], [x + ux * 0.22, y - 0.5, z + uz * 0.22], [x - ux * 0.22, y - 0.5, z - uz * 0.22], c);
      M.quad([x + ux * 0.25, y, z + uz * 0.25], [x - ux * 0.25, y, z - uz * 0.25], [x - ux * 0.22, y - 0.5, z - uz * 0.22], [x + ux * 0.22, y - 0.5, z + uz * 0.22], c);
    }
  };
  P.bench = (M) => {
    M.box(0, 0.45, 0, 2, 0.08, 0.5, 0x8a5a34);
    M.box(0, 0.8, -0.22, 2, 0.4, 0.06, 0x8a5a34);
    for (const x of [-0.85, 0.85]) M.box(x, 0.22, 0, 0.08, 0.44, 0.45, 0x2a2a2a);
  };
  P.car = (M, o) => {
    const c = o.c || 0xc03a2a;
    M.box(0, 0.62, 0, 1.9, 0.62, 4.2, c);
    M.box(0, 1.15, -0.2, 1.7, 0.5, 2.2, c, { tx: 0.9, tz: 0.8 });
    M.box(0, 1.15, -0.2, 1.72, 0.36, 2.0, 0x2a3a4a, { tx: 0.9, tz: 0.8 });
    for (const x of [-0.9, 0.9]) for (const z of [-1.35, 1.35]) M.cyl(x, 0.34, z, 0.34, 0.34, 0.25, 8, 0x1a1a1a, { rot: [0, 0, PI / 2] });
    M.box(0, 0.62, 2.11, 1.5, 0.2, 0.02, 0xfff0c0, { emit: 0.6 });
    M.box(0, 0.62, -2.11, 1.5, 0.15, 0.02, 0xd02020, { emit: 0.4 });
  };
  P.bus = (M, o) => {
    const c = o.c || 0xc02020;
    M.box(0, 1.8, 0, 2.5, 3.0, 10, c);
    M.box(0, 1.5, 0, 2.52, 0.7, 9.6, 0x2a3a4a);
    M.box(0, 2.8, 0, 2.52, 0.7, 9.6, 0x2a3a4a);
    for (const z of [-3.5, 3.5]) for (const x of [-1.25, 1.25]) M.cyl(x, 0.5, z, 0.5, 0.5, 0.3, 8, 0x1a1a1a, { rot: [0, 0, PI / 2] });
  };
  P.truck = (M, o) => {
    const c = o.c || 0x6a7a8a;
    M.box(0, 1.6, -0.8, 2.3, 2.2, 4.6, c);
    M.box(0, 1.2, 2.3, 2.2, 1.6, 1.6, o.c2 || 0x3a4a5a);
    M.box(0, 1.5, 3.12, 1.9, 0.6, 0.02, 0x2a3a4a);
    for (const z of [-2.2, 0.4, 2.4]) for (const x of [-1.1, 1.1]) M.cyl(x, 0.45, z, 0.45, 0.45, 0.3, 8, 0x1a1a1a, { rot: [0, 0, PI / 2] });
  };
  P.fountain = (M, o) => {
    M.cyl(0, 0.45, 0, 2.4, 2.5, 0.9, 12, o.c || 0xd8d0c0);
    M.cyl(0, 0.85, 0, 2.1, 2.1, 0.05, 12, 0x3a80b8, { emit: 0.2 });
    M.cyl(0, 1.6, 0, 0.4, 0.5, 1.6, 8, o.c || 0xd8d0c0);
    M.cyl(0, 2.45, 0, 0.9, 0.3, 0.2, 8, o.c || 0xd8d0c0);
  };
  P.statue = (M, o) => {
    const c = o.c || 0x8a7a5a;
    M.box(0, 0.7, 0, 2, 1.4, 2, o.base || 0xc0b8a8);
    M.box(0, 2.1, 0, 0.6, 1.4, 0.4, c);
    M.sphere(0, 3.05, 0, 0.26, 0.3, 0.26, c, { lat: 4, lon: 6 });
    M.box(-0.45, 2.5, 0, 0.2, 0.9, 0.2, c, { rot: [0, 0, -0.9] });
    M.box(0.4, 2.3, 0, 0.18, 0.8, 0.18, c, { rot: [0, 0, 0.3] });
    M.box(0, 1.6, 0, 0.5, 0.4, 0.35, c);
  };
  P.phonebox = (M) => {
    M.box(0, 1.3, 0, 1.1, 2.6, 1.1, 0xc81e1e);
    for (const [x, z, ry] of [[0, 0.56, 0], [0, -0.56, PI], [0.56, 0, PI / 2], [-0.56, 0, -PI / 2]]) M.box(x, 1.5, z, ry ? 0.02 : 0.8, 1.6, ry ? 0.8 : 0.02, 0x9ab8c8);
    M.box(0, 2.45, 0.56, 0.8, 0.2, 0.02, 0x1a1a1a);
    M.box(0, 2.75, 0, 1.2, 0.2, 1.2, 0xc81e1e);
  };
  P.stall = (M, o) => {
    M.box(0, 0.55, 0, 3, 1.1, 1.8, 0x7a5030);
    M.box(0, 1.12, 0, 3.05, 0.06, 1.85, 0xa87a4a);
    for (const x of [-1.45, 1.45]) for (const z of [-0.85, 0.85]) M.cyl(x, 1.6, z, 0.05, 0.05, 2.8, 4, 0x4a3020);
    M.box(0, 2.9, 0, 3.4, 0.08, 2.4, o.c || 0xd83a2a, { rot: [0.12, 0, 0] });
    for (let i = 0; i < 5; i++) M.box(-1.1 + i * 0.55, 1.25, 0.1, 0.35, 0.2, 0.35, [0xf0c040, 0xe05030, 0x70c050, 0xf0f0e0, 0xe08030][i]);
    if (o.lamp) M.sphere(0, 2.6, 1.0, 0.2, 0.25, 0.2, 0xff4020, { emit: 1, lat: 4, lon: 6 });
  };
  P.planter = (M, o, r) => { M.box(0, 0.4, 0, 1.6, 0.8, 1.6, o.c || 0x9a8a78); blobs(M, 4, 0, 1.0, 0, 0.7, 0x4a8a3a, 0x5a9a44, r, 0.6); };
  P.hydrant = (M) => { M.cyl(0, 0.35, 0, 0.16, 0.16, 0.7, 8, 0xc02a20); M.sphere(0, 0.72, 0, 0.16, 0.12, 0.16, 0xc02a20, { lat: 3, lon: 6 }); M.box(0, 0.45, 0, 0.44, 0.1, 0.1, 0xc02a20); };
  P.vending = (M, o) => { M.box(0, 1, 0, 1, 2, 0.8, o.c || 0xc02a2a); M.box(0, 1.2, 0.41, 0.7, 1.2, 0.02, 0xf0f0ff, { emit: 0.8 }); };
  P.rock = (M, o) => {
    const c = o.c || 0x8a8070;
    M.sphere(0, 0.5, 0, 1.2, 0.9, 1.0, c, { lat: 3, lon: 5 });
    M.sphere(0.5, 0.4, 0.3, 0.7, 0.6, 0.6, c, { lat: 3, lon: 5 });
  };
  P.bigrock = (M, o) => {
    const c = o.c || 0x8a7a68;
    M.sphere(0, 1.2, 0, 2.6, 2.2, 2.2, c, { lat: 3, lon: 6 });
    M.sphere(1.2, 0.8, 0.8, 1.6, 1.4, 1.4, c, { lat: 3, lon: 5 });
  };
  P.table = (M, o) => {
    M.cyl(0, 0.75, 0, 0.6, 0.6, 0.06, 10, o.c || 0xe8e0d0);
    M.cyl(0, 0.38, 0, 0.05, 0.05, 0.76, 4, 0x3a3a3a);
    if (o.umbrella) { M.cyl(0, 1.6, 0, 0.03, 0.03, 1.6, 4, 0xe0e0e0); M.cyl(0, 2.4, 0, 1.4, 0.05, 0.5, 8, o.uc || 0x2a6ac8); }
  };
  P.cart = (M, o) => {
    M.box(0, 0.8, 0, 2.2, 0.5, 1.3, o.c || 0x8a5a34);
    for (const x of [-0.9, 0.9]) M.cyl(x, 0.45, 0.7, 0.45, 0.45, 0.1, 10, 0x4a3020, { rot: [0, 0, PI / 2] });
    M.box(0, 1.2, 0, 2, 0.3, 1.1, o.c2 || 0xd8b050);
  };
  P.torii = (M, o) => {
    const c = o.c || 0xc0301e;
    for (const x of [-3, 3]) M.cyl(x, 3, 0, 0.32, 0.32, 6, 8, c);
    M.box(0, 5.2, 0, 7.4, 0.35, 0.45, c);
    M.box(0, 6.1, 0, 8.6, 0.4, 0.6, 0x2a2a2a, { tx: 1.05 });
    M.box(0, 5.65, 0, 0.35, 0.5, 0.35, c);
  };
  P.forklift = (M) => { M.box(0, 0.8, 0, 1.4, 1.0, 2.2, 0xe0b020); M.box(0, 1.8, -0.4, 1.3, 1.0, 1.0, 0x2a2a2a); M.box(0, 1.2, 1.3, 1.0, 2.2, 0.1, 0x5a5a5a); for (const x of [-0.7, 0.7]) for (const z of [-0.7, 0.7]) M.cyl(x, 0.3, z, 0.3, 0.3, 0.2, 8, 0x1a1a1a, { rot: [0, 0, PI / 2] }); };
  P.container = (M, o) => {
    const c = o.c || 0x2a6aa8;
    M.box(0, 1.3, 0, 2.5, 2.6, 6, c);
    for (let i = 0; i < 12; i++) { M.box(1.26, 1.3, -2.75 + i * 0.5, 0.04, 2.4, 0.2, c); M.box(-1.26, 1.3, -2.75 + i * 0.5, 0.04, 2.4, 0.2, c); }
  };
  P.generator = (M) => { M.box(0, 0.8, 0, 2, 1.6, 1.6, 0x5a6a5a); for (let i = 0; i < 5; i++) M.box(1.01, 0.6 + i * 0.2, 0, 0.02, 0.08, 1.2, 0x2a2a2a); M.box(0, 1.65, 0, 0.3, 0.1, 0.3, 0xe0b020); };
  P.bollard = (M, o) => { M.cyl(0, 0.45, 0, 0.14, 0.14, 0.9, 6, o.c || 0x3a3a3a); };
  P.column = (M, o) => {
    const c = o.c || 0xe8e4d8, h = o.h || 6;
    M.box(0, 0.15, 0, 1.1, 0.3, 1.1, c);
    M.cyl(0, h / 2, 0, 0.45, 0.4, h - 0.6, 10, c);
    M.box(0, h - 0.15, 0, 1.1, 0.3, 1.1, c);
  };
  P.brokencol = (M, o) => { const c = o.c || 0xe0dccf; M.box(0, 0.15, 0, 1.1, 0.3, 1.1, c); M.cyl(0, 1.1, 0, 0.45, 0.43, 1.9, 10, c); M.cyl(0.3, 2.1, 0.1, 0.43, 0.2, 0.3, 6, c, { rot: [0.3, 0, 0.2] }); };
  P.pot = (M, o) => { M.sphere(0, 0.45, 0, 0.35, 0.45, 0.35, o.c || 0xc8784a, { lat: 5, lon: 8 }); M.cyl(0, 0.9, 0, 0.14, 0.18, 0.2, 8, o.c || 0xc8784a); };
  P.crate = (M, o) => {
    const c = o.c || 0xa87a48, d = 0x6a4a28;
    M.box(0, 0.6, 0, 1.2, 1.2, 1.2, c);
    for (const [x, z] of [[-0.57, -0.57], [0.57, -0.57], [-0.57, 0.57], [0.57, 0.57]]) M.box(x, 0.6, z, 0.1, 1.22, 0.1, d);
    M.box(0, 1.19, 0, 1.22, 0.06, 1.22, d);
    M.box(0, 0.02, 0, 1.22, 0.06, 1.22, d);
  };
  P.crates = (M, o) => {
    M.with(-0.6, 0, 0, 0, 0.1, 0, () => P.crate(M, o));
    M.with(0.6, 0, 0, 0, -0.05, 0, () => P.crate(M, o));
    M.with(0, 1.2, 0, 0, 0.3, 0, () => P.crate(M, o));
  };
  P.barrel = (M, o) => { M.cyl(0, 0.55, 0, 0.4, 0.4, 1.1, 10, o.c || 0x3a6a8a); M.torus(0, 0.3, 0, 0.4, 0.03, 0x2a2a2a, { seg: 10, seg2: 3 }); M.torus(0, 0.8, 0, 0.4, 0.03, 0x2a2a2a, { seg: 10, seg2: 3 }); };
  P.barrels = (M, o) => { M.with(-0.45, 0, 0, 0, 0, 0, () => P.barrel(M, o)); M.with(0.45, 0, 0.1, 0, 0, 0, () => P.barrel(M, { c: o.c2 || 0xa8402a })); };
  P.awning = (M, o) => { const w = o.w || 3, d = o.d || 1.5, h = o.h || 3; M.quad([-w / 2, h, 0], [w / 2, h, 0], [w / 2, h - 0.6, d], [-w / 2, h - 0.6, d], o.c || 0xc83a2a); M.quad([w / 2, h, 0], [-w / 2, h, 0], [-w / 2, h - 0.6, d], [w / 2, h - 0.6, d], o.c || 0xc83a2a); };
  P.flag = (M, o) => { M.cyl(0, 3, 0, 0.05, 0.05, 6, 4, 0xd0d0d0); M.quad([0, 5.8, 0], [1.6, 5.8, 0], [1.6, 4.8, 0], [0, 4.8, 0], o.c || 0x2a6ac8); M.quad([1.6, 5.8, 0], [0, 5.8, 0], [0, 4.8, 0], [1.6, 4.8, 0], o.c || 0x2a6ac8); };
  P.antenna = (M, o) => {
    const h = o.h || 20;
    for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [0, 0.8]]) M.tube([[x, 0, z], [x * 0.15, h, z * 0.15]], 0.08, 0xd0d0d0, { seg: 4 });
    for (let i = 1; i < 6; i++) M.torus(0, h * i / 6, 0, 0.8 * (1 - i / 6) + 0.1, 0.04, 0xd0d0d0, { seg: 6, seg2: 3 });
    M.sphere(0, h, 0, 0.3, 0.3, 0.3, 0xff3020, { emit: 1, lat: 3, lon: 5 });
  };
  P.dish = (M) => { M.cyl(0, 1.5, 0, 0.3, 0.4, 3, 6, 0xc8c8c8); M.at(0, 3.4, 0, -0.6, 0, 0); M.sphere(0, 0, 0, 2, 0.6, 2, 0xe8e8e8, { half: true, lat: 6, lon: 10 }); M.pop(); };
  P.pagoda_tower = (M, o) => {
    const wall = 0xf0e4c8, roof = 0x5a6478, wood = 0x4a3020;
    M.box(0, 3, 0, 14, 6, 14, 0xa8a090);
    let y = 6, w = 12;
    for (let i = 0; i < 4; i++) {
      M.box(0, y + 2, 0, w, 4, w, wall);
      M.box(0, y + 3.7, 0, w + 0.3, 0.4, w + 0.3, wood);
      M.cyl(0, y + 4.8, 0, w * 0.85, w * 0.35, 1.8, 4, roof, { rot: [0, PI / 4, 0] });
      y += 5.2; w *= 0.78;
    }
    M.cyl(0, y + 1.5, 0, 0.3, 0.1, 3, 6, 0xd8b040);
  };
  P.mech = (M, o) => {
    const c = o.c || 0x6a6e78, d = 0x3a3e46, a = o.a || 0xc03a2a;
    const s = o.big || 1;
    M.at(0, 0, 0, 0, 0, 0, s);
    for (const x of [-2.2, 2.2]) { M.box(x, 3, 0, 1.8, 6, 2, d); M.box(x, 0.5, 0.4, 2.4, 1, 3, c); }
    M.box(0, 7.5, 0, 6.5, 3.5, 4, c);
    M.box(0, 10.5, 0, 7.5, 3, 4.6, c, { tx: 1.1 });
    M.box(0, 10.8, 2.35, 2.5, 1.2, 0.2, 0xffc040, { emit: 0.8 });
    M.box(0, 12.6, 0.4, 2.2, 1.6, 2.2, d);
    M.box(0, 12.6, 1.55, 1.6, 0.4, 0.1, a, { emit: 0.6 });
    for (const x of [-4.6, 4.6]) { M.box(x, 10.5, 0, 2, 2.4, 2.6, c); M.box(x, 7, 0.4, 1.6, 4.5, 1.6, d); M.box(x, 4.4, 0.8, 1.8, 1.6, 2, c); }
    M.box(-2.2, 9, 2.1, 1.4, 1.4, 0.1, a);
    M.pop();
  };
  P.rocket = (M) => {
    M.cyl(0, 14, 0, 2.2, 2.2, 22, 12, 0xf0f0f0);
    M.cyl(0, 27.5, 0, 2.2, 0.2, 5, 12, 0xe86a20);
    for (let i = 0; i < 4; i++) { const a = i * PI / 2; M.box(Math.cos(a) * 2.6, 4, Math.sin(a) * 2.6, 0.2, 5, 1.8, 0xe86a20, { rot: [0, -a, 0] }); }
    M.cyl(0, 2, 0, 1.6, 2.0, 2, 10, 0x4a4a4a);
    for (const [x, z] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) M.box(x, 12, z, 0.6, 24, 0.6, 0xa8a8a8);
    for (let i = 1; i < 6; i++) M.box(0, i * 4.5, -5, 10.6, 0.3, 0.3, 0xa8a8a8);
  };
  P.clocktower = (M) => {
    M.box(0, 12, 0, 6, 24, 6, 0xc8b890);
    M.box(0, 26, 0, 7, 4, 7, 0xb8a880);
    for (const [x, z, ry] of [[0, 3.52, 0], [0, -3.52, PI], [3.52, 0, PI / 2], [-3.52, 0, -PI / 2]]) M.with(x, 26, z, 0, ry, 0, () => M.cyl(0, 0, 0, 1.4, 1.4, 0.1, 12, 0xf8f0d0, { rot: [PI / 2, 0, 0], emit: 0.6 }));
    M.cyl(0, 31, 0, 4.2, 0.2, 6, 4, 0x3a5a4a, { rot: [0, PI / 4, 0] });
  };
  P.building_far = (M, o, r) => {
    const w = o.w || 10, d = o.d || 10, h = o.h || 30, c = o.c || 0x8a8e98;
    M.box(0, h / 2, 0, w, h, d, c);
    if (o.lit) {
      for (let y = 3; y < h - 2; y += 3) for (let x = -w / 2 + 1.5; x < w / 2 - 1; x += 2.2) if (r() < o.lit) M.box(x, y, d / 2 + 0.02, 1, 1.2, 0.02, o.lc || 0xffd890, { emit: 1 });
    }
    if (o.top) M.box(0, h + 1, 0, w * 0.6, 2, d * 0.6, c);
  };
  P.airship = (M, o) => {
    M.sphere(0, 0, 0, 3, 3, 12, o.c || 0xc8ccd8, { lat: 6, lon: 10 });
    M.box(0, -3.2, 0, 2, 1.4, 5, 0x5a5e6a);
    for (let i = 0; i < 4; i++) M.cyl(0, -2.4, -4 + i * 2.6, 0.4, 0.4, 0.1, 8, 0x80d0ff, { rot: [PI / 2, 0, 0], emit: 1 });
    for (const x of [-2.6, 2.6]) M.box(x, 0, -10, 0.2, 3, 3, o.c2 || 0x9aa0b0);
  };
  P.boat = (M, o) => { M.box(0, 0.6, 0, 2.4, 1.2, 6, o.c || 0xf0f0f0, { bx: 0.8, bz: 0.9 }); M.box(0, 1.6, -0.5, 1.6, 1, 2, 0x3a6aa8); M.cyl(0, 3.5, 0.8, 0.08, 0.08, 5, 4, 0xa87a4a); };
  P.umbrella = (M, o) => { M.cyl(0, 1.2, 0, 0.04, 0.04, 2.4, 4, 0xe0e0e0); M.cyl(0, 2.4, 0, 1.6, 0.05, 0.6, 8, o.c || 0x2a6ac8); };
  P.lighthouse = (M) => {
    M.cyl(0, 8, 0, 3.2, 2.2, 16, 12, 0xf2f2ee);
    for (let i = 0; i < 3; i++) M.cyl(0, 3 + i * 5, 0, 3.1 - i * 0.33, 2.9 - i * 0.33, 1.2, 12, 0x3a6ab0);
    M.cyl(0, 17, 0, 2.3, 2.3, 2, 10, 0xfff4b0, { emit: 0.9 });
    M.cyl(0, 18.8, 0, 2.6, 0.3, 1.8, 10, 0xc03a2a);
  };
  P.water_tower = (M) => {
    for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) M.box(x, 6, z, 0.3, 12, 0.3, 0x6a5a4a);
    M.cyl(0, 14.5, 0, 3.2, 3.2, 5, 12, 0x8a7a64);
    M.cyl(0, 17.8, 0, 3.4, 0.2, 1.6, 12, 0x5a4a3a);
  };
  P.sign = (M, o) => { M.cyl(0, 1.5, 0, 0.06, 0.06, 3, 4, 0x6a6a6a); M.box(0, 3.1, 0, o.w || 2, o.h || 0.6, 0.08, o.c || 0x2a6a3a); };
  P.cloud = (M, o, r) => blobs(M, 6, 0, 0, 0, 6, 0xf8f8ff, 0xe8ecf8, r, 1.4);
  P.skyline = (M, o, r) => {
    const n = o.n || 10, rad = o.r || 200, c = o.c || 0x7a7e88;
    for (let i = 0; i < n; i++) {
      const a = (o.a0 || 0) + (i / n) * (o.span || PI * 2);
      const w = 10 + r() * 16, h = (o.h || 40) * (0.5 + r() * 0.9);
      M.with(Math.sin(a) * rad, 0, Math.cos(a) * rad, 0, a, 0, () => P.building_far(M, { w, d: w, h, c, lit: o.lit, lc: o.lc }, r));
    }
  };
  P.onion_tower = (M, o) => {
    const c = o.c || 0xb8483a, d = o.dome || 0x3a8a5a;
    M.box(0, 10, 0, 7, 20, 7, c);
    M.box(0, 21, 0, 5.4, 2, 5.4, 0xe8e0d0);
    M.cyl(0, 25, 0, 2.2, 2.2, 6, 8, c);
    M.sphere(0, 30, 0, 3, 3.4, 3, d, { lat: 6, lon: 10 });
    M.cyl(0, 34, 0, 0.8, 0.05, 2.6, 8, d);
    M.cyl(0, 36.2, 0, 0.12, 0.12, 2, 4, 0xe8c040);
  };
  P.chimney = (M, o) => { M.cyl(0, (o.h || 24) / 2, 0, 1.6, 1.2, o.h || 24, 10, o.c || 0x8a3a2a); M.torus(0, (o.h || 24) - 1, 0, 1.25, 0.2, 0xd8d8d8, { seg: 10, seg2: 3 }); };
  P.neon = (M, o) => { M.box(0, 0, 0, o.w || 2, o.h || 1, 0.1, o.c || 0xff3080, { emit: 1 }); };
  P.trailer = (M, o) => {
    const c = o.c || 0xece4d4, s = o.c2 || 0x3a6ab0;
    M.box(0, 0.45, 0, 2.4, 0.3, 7, 0x3a3a3a);
    M.box(0, 1.75, 0, 2.8, 2.5, 7.6, c);
    for (const x of [-1.41, 1.41]) M.box(x, 1.3, 0, 0.04, 0.3, 7.4, s);
    for (const z of [-2.3, 2.3]) M.box(1.42, 2.1, z, 0.04, 0.8, 1.4, 0x8ab0d0);
    M.box(1.43, 1.55, 0.3, 0.04, 2.1, 0.9, 0x6a4a36);
    M.box(1.44, 2.85, 0.3, 0.02, 0.45, 0.45, 0xffd040, { emit: 0.7 });
    for (const z of [-2.4, 2.4]) M.cyl(0, 0.42, z, 0.42, 0.42, 2.9, 8, 0x1a1a1a, { rot: [0, 0, Math.PI / 2] });
    M.box(0, 3.1, -1.6, 1.1, 0.3, 1.3, 0xb4b4b4);
  };
  P.crane = (M, o) => {
    const c = o.c || 0x2a2a30;
    M.box(0, 0.6, 0, 2, 0.9, 2.6, c);
    for (const [x, z] of [[-0.9, -1.1], [0.9, -1.1], [-0.9, 1.1], [0.9, 1.1]]) M.cyl(x, 0.22, z, 0.22, 0.22, 0.2, 8, 0x111111, { rot: [0, 0, Math.PI / 2] });
    M.cyl(0, 2.1, 0, 0.18, 0.24, 2.4, 6, 0x5a5a62);
    M.with(0, 3.3, 0, -0.32, 0, 0, () => {
      M.box(0, 0, 1.6, 0.28, 0.28, 7.4, 0x6a6a72);
      M.box(0, 0, -2.5, 0.7, 0.7, 1.1, 0x3a3a42);
      M.box(0, -0.35, 5.3, 0.7, 0.6, 1.1, 0x1a1a1e);
      M.cyl(0, -0.35, 5.95, 0.2, 0.26, 0.3, 8, 0x3a3a3a, { rot: [Math.PI / 2, 0, 0] });
      for (const z of [4.9, 5.7]) M.cyl(0, 0.15, z, 0.32, 0.32, 0.1, 10, 0x2a2a2a, { rot: [0, 0, Math.PI / 2] });
    });
  };
  P.spotlight = (M, o) => {
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; M.tube([[0, 1.7, 0], [Math.sin(a) * 0.7, 0, Math.cos(a) * 0.7]], 0.04, 0x2a2a2a, { seg: 4 }); }
    M.with(0, 1.95, 0, o.tilt === undefined ? -0.3 : o.tilt, 0, 0, () => {
      M.cyl(0, 0, 0, 0.42, 0.34, 0.8, 10, 0x2a2a30, { rot: [Math.PI / 2, 0, 0] });
      M.cyl(0, 0, 0.41, 0.38, 0.38, 0.02, 10, 0xfff4d0, { rot: [Math.PI / 2, 0, 0], emit: 1 });
    });
  };
  P.saucer = (M, o) => {
    const c = o.c || 0xb8c0cc;
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3 + 0.5;
      M.tube([[Math.sin(a) * 2.2, 2.7, Math.cos(a) * 2.2], [Math.sin(a) * 3.6, 0, Math.cos(a) * 3.6]], 0.12, 0x6a6e78, { seg: 5 });
      M.cyl(Math.sin(a) * 3.6, 0.08, Math.cos(a) * 3.6, 0.5, 0.5, 0.16, 8, 0x5a5e68);
    }
    M.cyl(0, 2.7, 0, 1.2, 1.6, 0.5, 12, 0x4a4e58);
    M.sphere(0, 3.3, 0, 5.2, 0.9, 5.2, c, { lat: 5, lon: 16 });
    M.torus(0, 3.3, 0, 5.1, 0.12, 0x6ae8ff, { seg: 20, seg2: 3, emit: 1 });
    M.sphere(0, 3.9, 0, 2, 1.4, 2, 0x8ad8ff, { half: true, lat: 5, lon: 12, emit: 0.3 });
  };
  P.cactus = (M, o) => {
    const c = o.c || 0x4a7a3a;
    M.cyl(0, 1.2, 0, 0.3, 0.28, 2.4, 8, c);
    M.sphere(0, 2.4, 0, 0.28, 0.2, 0.28, c, { lat: 3, lon: 8 });
    M.tube([[0.2, 1.1, 0], [0.7, 1.2, 0], [0.7, 1.9, 0]], 0.16, c, { seg: 6 });
    M.tube([[-0.2, 1.4, 0], [-0.6, 1.5, 0], [-0.6, 2.0, 0]], 0.14, c, { seg: 6 });
  };
  P.film_reel = (M, o) => {
    M.with(0, 3.2, 0, 0, 0, 0, () => {
      M.cyl(0, 0, 0, 2.8, 2.8, 0.5, 18, o.c || 0xd8b040, { rot: [Math.PI / 2, 0, 0] });
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; M.cyl(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0, 0.55, 0.55, 0.56, 10, 0x2a2420, { rot: [Math.PI / 2, 0, 0] }); }
      M.cyl(0, 0, 0, 0.4, 0.4, 0.6, 8, 0x2a2420, { rot: [Math.PI / 2, 0, 0] });
    });
    M.box(0, 0.3, 0, 3.6, 0.6, 1.6, 0x5a4a3a);
  };
  P.omnic = (M, o) => {
    const c = o.c || 0x8a9098, d = 0x4a4e56;
    M.box(0, 0.35, 0, 1.2, 0.7, 1.0, d);
    M.box(0, 1.25, -0.1, 1.0, 1.2, 0.7, c);
    M.sphere(0, 2.15, 0, 0.36, 0.34, 0.36, c, { lat: 5, lon: 8 });
    M.box(0, 2.18, 0.3, 0.46, 0.1, 0.06, o.eye || 0x3a6aff, { emit: o.lit ? 1 : 0.2 });
    for (const x of [-0.7, 0.7]) M.tube([[x, 1.7, 0], [x * 1.1, 1.1, 0.3], [x, 0.8, 0.6]], 0.13, d, { seg: 5 });
    M.cyl(0, 1.55, -0.52, 0.16, 0.16, 0.5, 6, 0x5a5e66, { rot: [Math.PI / 2, 0, 0] });
  };
  P.core = (M, o) => {
    const c = o.c || 0x40a8ff;
    M.cyl(0, 0.4, 0, 2.8, 3.0, 0.8, 16, 0x3a3e46);
    M.cyl(0, 5, 0, 1.6, 1.6, 8.4, 14, 0x2a2e36);
    for (let i = 0; i < 4; i++) M.torus(0, 1.8 + i * 2, 0, 1.75, 0.16, c, { seg: 16, seg2: 3, emit: 1 });
    M.cyl(0, 9.6, 0, 2.2, 1.2, 0.8, 14, 0x3a3e46);
    M.sphere(0, 10.4, 0, 0.8, 0.8, 0.8, c, { emit: 1, lat: 4, lon: 8 });
  };
  P.pipes = (M, o) => {
    const len = o.len || 10, c = o.c || 0x5a5e66;
    for (let i = 0; i < 3; i++) M.cyl(0, 0.4 + i * 0.55, 0, 0.22, 0.22, len, 8, i === 1 ? 0x7a5a3a : c, { rot: [Math.PI / 2, 0, 0] });
    for (let z = -len / 2 + 1; z < len / 2; z += 3) M.box(0, 0.9, z, 0.6, 1.8, 0.14, 0x3a3e46);
  };
  O.PROP_MODEL = P;

  O.buildProps = function (map) {
    const M = new O.MB();
    for (const p of map.vis.props) {
      const f = P[p.type];
      if (!f) continue;
      M.at(p.x, p.y, p.z, 0, p.yaw, 0, p.s);
      f(M, p.o || {}, O.rng(O.hash(p.type + p.x + ',' + p.z)));
      M.pop();
    }
    return M.data();
  };

  const D = {};
  D.payload = (M, style) => {
    const dark = 0x3a3e46, metal = 0x8a8e98;
    M.box(0, 0.55, 0, 2.2, 0.5, 3.6, dark);
    for (const x of [-1.05, 1.05]) for (const z of [-1.2, 0, 1.2]) M.cyl(x, 0.4, z, 0.4, 0.4, 0.25, 10, 0x1a1a1a, { rot: [0, 0, PI / 2] });
    M.box(0, 0.9, 0, 2.0, 0.2, 3.4, metal);
    if (style === 'dorado') {
      M.cyl(0, 1.7, 0, 0.8, 0.8, 1.4, 10, 0xe8e8f0);
      for (let i = 0; i < 3; i++) M.torus(0, 1.25 + i * 0.45, 0, 0.82, 0.08, 0xffc830, { seg: 10, seg2: 3, emit: 0.8 });
      M.cyl(0, 2.5, 0, 0.35, 0.6, 0.3, 8, 0xffe070, { emit: 1 });
    } else if (style === 'gibraltar') {
      M.box(0, 1.6, 0.2, 1.6, 1.2, 2.6, 0xf0f0f0, { tx: 0.7, tz: 0.9 });
      M.box(0, 1.5, 1.6, 1.2, 0.8, 0.6, 0xe86a20, { tx: 0.5 });
      for (const x of [-1.1, 1.1]) M.box(x, 1.4, -0.3, 0.8, 0.12, 1.6, 0xf0f0f0);
      M.cyl(0, 1.5, -1.3, 0.35, 0.45, 0.5, 8, 0x3a3e46, { rot: [PI / 2, 0, 0] });
      M.box(0, 2.0, 0.6, 0.8, 0.3, 0.8, 0x60c8ff, { emit: 0.6 });
    } else if (style === 'hollywood') {
      M.box(0, 1.6, -0.3, 1.8, 1.2, 2.4, 0xa8487a);
      M.cyl(0, 2.6, 0.8, 0.12, 0.12, 1.2, 6, 0x2a2a2a);
      M.box(0, 3.2, 1.0, 0.8, 0.5, 1, 0x2a2a2a);
      M.cyl(0, 3.2, 1.55, 0.2, 0.25, 0.2, 8, 0x80c0ff, { rot: [PI / 2, 0, 0], emit: 0.6 });
    } else {
      M.box(0, 1.7, 0, 1.8, 1.4, 2.8, 0x2a2a30);
      for (const z of [-0.8, 0, 0.8]) M.box(0, 2.45, z, 1.2, 0.12, 0.3, 0xff3020, { emit: 1 });
      M.cyl(0, 2.6, 0, 0.5, 0.6, 0.3, 8, 0x5a5e66);
    }
  };
  D.turret = (M, lvl) => {
    const brass = 0xb07a3a, dark = 0x3a3a40;
    for (let i = 0; i < 3; i++) { const a = i * PI * 2 / 3; M.tube([[0, 0.5, 0], [Math.sin(a) * 0.6, 0, Math.cos(a) * 0.6]], 0.05, dark, { seg: 4 }); }
    M.cyl(0, 0.55, 0, 0.18, 0.2, 0.2, 8, dark);
    M.bone(1);
    M.box(0, 0.9, 0, lvl > 1 ? 0.6 : 0.46, 0.4, 0.6, brass);
    M.box(0, 1.12, -0.05, 0.3, 0.12, 0.3, dark);
    M.box(0, 0.95, 0.31, 0.2, 0.08, 0.02, 0xff8a20, { emit: 1 });
    const barrels = lvl > 1 ? [-0.14, 0.14] : [0];
    for (const x of barrels) M.cyl(x, 0.92, 0.55, 0.05, 0.06, 0.5, 6, dark, { rot: [PI / 2, 0, 0] });
    if (lvl > 2) for (const x of [-0.45, 0.45]) M.box(x, 1.05, 0.1, 0.24, 0.3, 0.5, 0x8a3a20);
  };
  D.trap = (M, closed) => {
    M.cyl(0, 0.05, 0, 0.5, 0.5, 0.1, 10, 0x6a6e76);
    for (const side of [-1, 1]) M.box(0, closed ? 0.3 : 0.12, side * (closed ? 0.1 : 0.42), 0.9, closed ? 0.45 : 0.08, 0.06, 0x9aa0a8, { rot: [closed ? side * 0.3 : 0, 0, 0] });
  };
  D.mine = (M) => { M.cyl(0, 0.12, 0, 0.3, 0.26, 0.2, 10, 0x4a4e3a); M.sphere(0, 0.25, 0, 0.1, 0.1, 0.1, 0xff2010, { emit: 1, lat: 3, lon: 5 }); };
  D.venom = (M) => { M.sphere(0, 0.1, 0, 0.2, 0.14, 0.2, 0x4a2a5a, { lat: 4, lon: 6 }); M.sphere(0, 0.18, 0, 0.1, 0.1, 0.1, 0xe050ff, { emit: 1, lat: 3, lon: 5 }); };
  D.field = (M) => { M.cyl(0, 0.2, 0, 0.18, 0.22, 0.4, 8, 0x3a4048); M.cyl(0, 0.45, 0, 0.12, 0.12, 0.1, 8, 0xffe060, { emit: 1 }); };
  D.bubble = (M) => { M.cyl(0, 0.2, 0, 0.25, 0.3, 0.4, 8, 0xd4d8e0); M.sphere(0, 0.5, 0, 0.14, 0.14, 0.14, 0x80d0ff, { emit: 1, lat: 3, lon: 6 }); };
  D.tire = (M) => { M.torus(0, 0.55, 0, 0.42, 0.14, 0x1e1e1e, { rot: [0, 0, PI / 2], seg: 12, seg2: 5 }); M.cyl(0, 0.55, 0, 0.3, 0.3, 0.26, 8, 0x8a7a50, { rot: [0, 0, PI / 2] }); M.sphere(0.15, 0.55, 0, 0.12, 0.12, 0.12, 0xff3010, { emit: 1, lat: 3, lon: 5 }); };
  D.pack = (M) => { M.box(0, 0.2, 0, 0.5, 0.35, 0.4, 0xa87a40); M.box(0, 0.4, 0, 0.3, 0.06, 0.25, 0xe07a20, { emit: 0.5 }); };
  D.scrap = (M) => { for (let i = 0; i < 5; i++) M.box((i % 3 - 1) * 0.2, 0.08 + (i > 2 ? 0.12 : 0), (i % 2 - 0.5) * 0.25, 0.25, 0.1, 0.18, [0x8a8e94, 0xb07a3a, 0x5a5e66][i % 3], { rot: [0, i, 0.2 * i] }); };
  D.health = (M, big) => {
    M.cyl(0, 0.06, 0, big ? 0.7 : 0.5, big ? 0.75 : 0.55, 0.12, 10, 0xd8dce4);
    M.cyl(0, 0.13, 0, big ? 0.6 : 0.4, big ? 0.6 : 0.4, 0.02, 10, big ? 0xffd040 : 0x60ff60, { emit: 0.8 });
    M.bone(1);
    const s = big ? 1.3 : 0.9, c = big ? 0xffe060 : 0x70ff70;
    M.box(0, 0.8, 0, 0.18 * s, 0.6 * s, 0.1 * s, c, { emit: 1 });
    M.box(0, 0.8, 0, 0.6 * s, 0.18 * s, 0.1 * s, c, { emit: 1 });
  };
  D.pedestal = (M) => {
    M.cyl(0, 0.05, 0, 1.12, 1.08, 0.1, 24, 0x2a3140);
    M.cyl(0, 0.11, 0, 1.02, 1.02, 0.02, 24, 0x3c4658);
    M.torus(0, 0.115, 0, 0.96, 0.022, 0xf99e1a, { seg: 32, seg2: 3, emit: 1 });
    M.torus(0, 0.115, 0, 0.62, 0.012, 0x5ab8ff, { seg: 28, seg2: 3, emit: 0.7 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; M.box(Math.sin(a) * 1.1, 0.05, Math.cos(a) * 1.1, 0.05, 0.06, 0.03, 0x9aa6ba, { rot: [0, a, 0] }); }
  };
  D.bomb = (M) => { M.cyl(0, 0, 0, 0.14, 0.14, 0.06, 10, 0xd0d8e0, { rot: [PI / 2, 0, 0] }); M.cyl(0, 0, 0.03, 0.08, 0.08, 0.02, 10, 0x60d0ff, { rot: [PI / 2, 0, 0], emit: 1 }); };
  const IT = {};
  IT.mug = M => {
    M.cyl(0, 0.02, 0.085, 0.048, 0.044, 0.12, 10, 0xc8ccd4, { gloss: 0.7 });
    M.cyl(0, 0.082, 0.085, 0.046, 0.046, 0.016, 10, 0xfff8e8);
    M.cyl(0, 0.02, 0.085, 0.05, 0.05, 0.012, 10, 0x8a8e96, { gloss: 0.6 });
    M.box(0, 0.02, 0.028, 0.016, 0.09, 0.02, 0x9aa0a8, { gloss: 0.6 });
    for (const y of [0.068, -0.028]) M.box(0, y, 0.04, 0.016, 0.016, 0.04, 0x9aa0a8, { gloss: 0.6 });
  };
  IT.teacup = M => {
    M.cyl(0, 0.03, 0.07, 0.028, 0.022, 0.036, 10, 0xf6f2ec, { gloss: 0.6 });
    M.cyl(0, 0.046, 0.07, 0.025, 0.025, 0.004, 10, 0x8a5a2a);
    M.torus(0, 0.03, 0.038, 0.01, 0.003, 0xf6f2ec, { rot: [0, 0, PI / 2], seg: 6, seg2: 3 });
    M.cyl(0, 0.01, 0.07, 0.045, 0.045, 0.005, 12, 0xf6f2ec, { gloss: 0.6 });
    M.box(0.015, 0.03, 0.062, 0.006, 0.01, 0.006, 0xe06a8a);
  };
  IT.medal = M => {
    M.box(-0.012, -0.05, 0.05, 0.014, 0.1, 0.004, 0x3a6ad8, { rot: [0, 0, 0.12] });
    M.box(0.012, -0.05, 0.05, 0.014, 0.1, 0.004, 0x3a6ad8, { rot: [0, 0, -0.12] });
    M.cyl(0, -0.115, 0.05, 0.042, 0.042, 0.01, 14, 0xf0c040, { rot: [PI / 2, 0, 0], gloss: 0.95, emit: 0.15 });
    M.cyl(0, -0.115, 0.056, 0.03, 0.03, 0.004, 12, 0xffe080, { rot: [PI / 2, 0, 0], emit: 0.3 });
  };
  IT.rocket = M => {
    M.cyl(0, -0.08, 0.04, 0.006, 0.006, 0.3, 4, 0xa07848);
    M.cyl(0, 0.17, 0.04, 0.032, 0.032, 0.24, 8, 0xd02a22, { gloss: 0.3 });
    for (const y of [0.1, 0.24]) M.cyl(0, y, 0.04, 0.034, 0.034, 0.02, 8, 0xf0c040);
    M.cyl(0, 0.33, 0.04, 0.034, 0, 0.08, 8, 0xf0c040, { gloss: 0.6 });
    M.cyl(0, 0.04, 0.04, 0.012, 0.004, 0.04, 5, 0xffb040, { emit: 1 });
  };
  IT.sparkler = M => {
    M.cyl(0, 0.12, 0.04, 0.004, 0.004, 0.32, 4, 0x8a8e96);
    M.sphere(0, 0.29, 0.04, 0.03, 0.03, 0.03, 0xfff0a0, { emit: 1, lat: 3, lon: 5 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; M.box(Math.cos(a) * 0.04, 0.29 + Math.sin(a) * 0.04, 0.04, 0.008, 0.05, 0.004, 0xffd060, { rot: [0, 0, a + PI / 2], emit: 1 }); }
  };
  IT.pumpkin = M => {
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; M.sphere(Math.cos(a) * 0.04, 0.1, 0.07 + Math.sin(a) * 0.04, 0.07, 0.085, 0.07, 0xe87a1a, { lat: 4, lon: 7 }); }
    M.cyl(0, 0.19, 0.07, 0.014, 0.01, 0.04, 5, 0x4a6a2a);
    for (const sd of [-1, 1]) M.box(sd * 0.03, 0.12, 0.155, 0.025, 0.02, 0.01, 0xffd040, { rot: [0, 0, sd * 0.4], emit: 1 });
    M.box(0, 0.075, 0.158, 0.06, 0.015, 0.01, 0xffd040, { emit: 1 });
  };
  IT.jar = M => {
    M.cyl(0, 0.03, 0.06, 0.05, 0.05, 0.1, 10, 0xd8a050, { gloss: 0.5 });
    M.cyl(0, 0.03, 0.06, 0.052, 0.052, 0.05, 10, 0xf0e0b0);
    M.cyl(0, 0.088, 0.06, 0.053, 0.053, 0.018, 10, 0xc83a2a, { gloss: 0.4 });
    M.box(0, 0.035, 0.112, 0.04, 0.025, 0.004, 0x8a4a1a);
  };
  IT.fan = M => {
    for (let i = 0; i < 9; i++) { const a = -1.1 + i * 0.275; M.with(0, 0.02, 0.05, 0, 0, a, () => { M.box(0, 0.11, 0, 0.05, 0.2, 0.004, i % 2 ? 0xd02a3a : 0xe84a4a, { tx: 1.6, bx: 0.3 }); M.box(0, 0.2, 0.003, 0.05, 0.012, 0.004, 0xf0c040, { tx: 1.6 }); }); }
    M.cyl(0, 0.02, 0.05, 0.012, 0.012, 0.012, 6, 0x2a1a20, { rot: [PI / 2, 0, 0] });
  };
  IT.parasol = M => {
    M.cyl(0, 0.3, 0.04, 0.008, 0.008, 0.8, 5, 0xf4f2ec);
    M.cyl(0, -0.1, 0.04, 0.014, 0.014, 0.08, 5, 0xc8a040);
    M.cyl(0, 0.68, 0.04, 0.46, 0.02, 0.16, 12, 0xf0a040, { gloss: 0.2 });
    M.cyl(0, 0.6, 0.04, 0.47, 0.46, 0.02, 12, 0xf4f2ec);
    M.cyl(0, 0.78, 0.04, 0.012, 0, 0.06, 5, 0xc8a040);
  };
  IT.lantern = M => {
    M.cyl(0, 0.13, 0.05, 0.08, 0.1, 0.2, 10, 0xffe0a0, { emit: 0.9 });
    M.cyl(0, 0.035, 0.05, 0.06, 0.06, 0.012, 8, 0xc8a040);
    M.sphere(0, 0.05, 0.05, 0.025, 0.02, 0.025, 0xffa020, { emit: 1, lat: 3, lon: 5 });
  };
  IT.drum = M => {
    M.cyl(0, 0.5, 0, 0.34, 0.34, 0.3, 14, 0xf2ecd8, { rot: [0, 0, PI / 2] });
    for (const x of [-0.16, 0.16]) M.cyl(x, 0.5, 0, 0.35, 0.35, 0.03, 14, 0x3a8a3a, { rot: [0, 0, PI / 2], gloss: 0.4 });
    for (const sd of [-1, 1]) { M.tube([[0, 0.2, 0], [sd * 0.25, 0, 0.18]], 0.012, 0x9aa0a8, { seg: 4 }); M.tube([[0, 0.2, 0], [sd * 0.25, 0, -0.18]], 0.012, 0x9aa0a8, { seg: 4 }); }
    M.cyl(0, 0.22, 0, 0.02, 0.02, 0.1, 5, 0x9aa0a8);
  };
  IT.stick = M => { M.cyl(0, 0, 0.18, 0.008, 0.01, 0.3, 5, 0xe8d0a0, { rot: [PI / 2, 0, 0] }); M.sphere(0, 0, 0.33, 0.016, 0.016, 0.016, 0xf4f2ec, { lat: 3, lon: 5 }); };
  IT.bowl = M => {
    M.cyl(0, 0.02, 0.1, 0.1, 0.06, 0.05, 12, 0x3a2a24, { gloss: 0.5 });
    M.cyl(0, 0.046, 0.1, 0.09, 0.09, 0.006, 12, 0xf4f0e0);
    for (let i = 0; i < 5; i++) M.sphere(Math.cos(i * 1.3) * 0.04, 0.055, 0.1 + Math.sin(i * 1.3) * 0.04, 0.018, 0.012, 0.018, 0xe8c070, { lat: 3, lon: 4 });
  };
  IT.orbs = M => {
    for (let i = 0; i < 3; i++) { M.sphere(0, 0.07 + i * 0.12, 0.05, 0.058, 0.058, 0.058, 0xe8e0b8, { lat: 5, lon: 7, gloss: 0.8 }); M.torus(0, 0.07 + i * 0.12, 0.05, 0.06, 0.011, 0xc8a040, { seg: 9, seg2: 3 }); }
  };
  IT.orb = M => { M.sphere(0, 0, 0, 0.058, 0.058, 0.058, 0xe8e0b8, { lat: 5, lon: 7, gloss: 0.8 }); M.torus(0, 0, 0, 0.06, 0.011, 0xc8a040, { seg: 9, seg2: 3 }); };
  IT.sign = M => {
    M.box(0, 0, 0, 0.36, 0.22, 0.012, 0x1a1a1e);
    M.box(0, 0, 0.007, 0.34, 0.2, 0.004, 0x2a2a30);
    for (let i = 0; i < 3; i++) M.box(-0.02 + (i === 1 ? 0.03 : 0), 0.06 - i * 0.055, 0.01, i === 1 ? 0.26 : 0.2, 0.022, 0.003, 0xf0f0f0);
  };
  IT.detonator = M => {
    M.box(0, 0, 0.05, 0.07, 0.12, 0.06, 0xd8a020, { gloss: 0.3 });
    M.cyl(0, 0.07, 0.05, 0.022, 0.022, 0.03, 8, 0xe02018, { emit: 0.6 });
    M.cyl(0.025, 0.12, 0.03, 0.004, 0.004, 0.14, 4, 0x6a6e76);
    M.sphere(0.025, 0.19, 0.03, 0.01, 0.01, 0.01, 0xff3010, { emit: 1, lat: 3, lon: 4 });
  };
  IT.dynamite = M => {
    M.cyl(0, 0, 0.07, 0.016, 0.016, 0.13, 6, 0xc82a1a, { rot: [PI / 2, 0, 0] });
    M.cyl(0, 0, 0.145, 0.003, 0.003, 0.03, 4, 0x3a3a3a, { rot: [PI / 2, 0, 0] });
    M.sphere(0, 0, 0.165, 0.012, 0.012, 0.012, 0xffd040, { emit: 1, lat: 3, lon: 4 });
  };
  IT.spider = M => {
    M.cyl(0, -0.07, 0.07, 0.0015, 0.0015, 0.14, 3, 0xf0f0f0);
    M.sphere(0, -0.15, 0.07, 0.018, 0.016, 0.022, 0x18141e, { lat: 3, lon: 6 });
    M.sphere(0, -0.15, 0.093, 0.011, 0.01, 0.011, 0x18141e, { lat: 3, lon: 5 });
    M.box(0, -0.143, 0.075, 0.006, 0.004, 0.012, 0xd02020, { emit: 0.5 });
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) M.box(sd * 0.025, -0.15, 0.06 + i * 0.01, 0.034, 0.003, 0.003, 0x18141e, { rot: [0, sd * (i - 1.5) * 0.4, sd * 0.3] });
  };
  IT.grenade = M => { M.sphere(0, 0, 0, 0.05, 0.05, 0.05, 0xe08a20, { lat: 5, lon: 7, gloss: 0.4 }); M.torus(0, 0, 0, 0.051, 0.008, 0x4a3a2a, { seg: 9, seg2: 3 }); M.cyl(0, 0.055, 0, 0.008, 0.008, 0.02, 4, 0x6a6e76); };
  IT.can = M => {
    M.cyl(0, 0.03, 0.055, 0.032, 0.032, 0.12, 10, 0xd83a2a, { gloss: 0.7 });
    M.cyl(0, 0.03, 0.055, 0.033, 0.033, 0.03, 10, 0xf0f0f0);
    M.cyl(0, 0.092, 0.055, 0.028, 0.028, 0.006, 10, 0xb8bcc4, { gloss: 0.8 });
  };
  IT.crushed = M => { M.cyl(0, 0.03, 0.055, 0.04, 0.036, 0.03, 9, 0xd83a2a, { gloss: 0.7 }); M.box(0, 0.03, 0.055, 0.06, 0.012, 0.05, 0xb8bcc4, { rot: [0.3, 0.4, 0.2] }); };
  IT.turret = M => { D.turret(M, 1); };
  IT.tire = M => { D.tire(M); };
  IT.ribbon = M => {
    for (let i = 0; i < 6; i++) M.box(0, -0.04 - i * 0.05, 0.04 + Math.sin(i) * 0.02, 0.05, 0.05, 0.004, i % 2 ? 0xf04a8a : 0xffc040, { rot: [0.3 * Math.sin(i * 1.7), 0, 0.4 * Math.cos(i)] });
  };
  D.item = (M, name) => (IT[name] || IT.mug)(M);
  O.ITEM_MODEL = IT;
  O.DEPLOY_MODEL = D;

  O.buildDeployModel = function (kind, arg) {
    const M = new O.MB();
    M.gloss = 0.3;
    (D[kind] || D.pack)(M, arg);
    return M.data();
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
