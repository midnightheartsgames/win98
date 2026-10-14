(function (X) {
  'use strict';
  const P = X.PROPS = X.PROPS || {};
  const F = X.F;
  const PROP = F.SOLID | F.SHOT | F.SIGHT;

  P.crate = (B, o) => {
    const s = o.s || 1, m = o.mat || 'crate';
    B.box(-s / 2, 0, -s / 2, s / 2, s, s / 2, m, { flags: o.walk === false ? PROP : F.WALL });
  };
  P.crates = (B, o) => {
    const n = o.n || 3;
    P.crate(B, { s: 1.1 });
    if (n > 1) B.at(1.15, 0, 0.1, 0.2, () => P.crate(B, { s: 1 }));
    if (n > 2) B.at(0.5, 1.1, 0, -0.15, () => P.crate(B, { s: 0.9 }));
    if (n > 3) B.at(-0.2, 0, 1.2, 0.1, () => P.crate(B, { s: 1.0 }));
  };
  P.barrel = (B, o) => { B.cyl(0, 0, 0, 0.3, 0.92, o.mat || 'barrel_blue', { sides: 12 }); };
  P.pallet = (B, o) => { B.box(-0.6, 0, -0.5, 0.6, 0.15, 0.5, 'wood_light', { flags: F.WALL }); };
  P.bench = (B, o) => {
    const l = o.len || 2, m = o.mat || 'wood';
    B.box(-l / 2, 0.42, -0.22, l / 2, 0.5, 0.22, m, { flags: PROP });
    B.vbox(-l / 2, 0.55, 0.16, l / 2, 0.95, 0.22, m);
    for (const x of [-l / 2 + 0.15, l / 2 - 0.15]) B.vbox(x - 0.04, 0, -0.2, x + 0.04, 0.42, 0.2, 'metal_dark');
  };
  P.table = (B, o) => {
    const w = o.w || 1.4, d = o.d || 0.8, h = o.h || 0.76, m = o.mat || 'wood';
    B.box(-w / 2, h - 0.05, -d / 2, w / 2, h, d / 2, m, { flags: PROP });
    for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) for (const z of [-d / 2 + 0.06, d / 2 - 0.06]) B.vbox(x - 0.03, 0, z - 0.03, x + 0.03, h - 0.05, z + 0.03, o.leg || m);
    B.clip(-w / 2, 0, -d / 2, w / 2, h - 0.05, d / 2, F.SOLID);
  };
  P.round_table = (B, o) => {
    const r = o.r || 0.5, h = o.h || 0.74;
    B.cyl(0, h - 0.04, 0, r, 0.04, o.mat || 'wood', { solid: false, sides: 12 });
    B.cyl(0, 0, 0, 0.05, h - 0.04, 'metal_dark', { solid: false, sides: 6 });
    B.cyl(0, 0, 0, 0.25, 0.03, 'metal_dark', { solid: false, sides: 8 });
    B.box(-r * 0.7, 0, -r * 0.7, r * 0.7, h, r * 0.7, null, { vis: false, flags: PROP });
  };
  P.stool = (B, o) => {
    B.cyl(0, 0.62, 0, 0.19, 0.08, o.mat || 'leather_red', { solid: false, sides: 10 });
    B.cyl(0, 0, 0, 0.04, 0.62, 'chrome', { solid: false, sides: 6 });
    B.box(-0.15, 0, -0.15, 0.15, 0.62, 0.15, null, { vis: false, flags: PROP });
  };
  P.chair = (B, o) => {
    const m = o.mat || 'wood';
    B.box(-0.22, 0.42, -0.22, 0.22, 0.47, 0.22, m, { flags: PROP });
    B.vbox(-0.22, 0.47, 0.17, 0.22, 0.95, 0.22, m);
    for (const x of [-0.19, 0.19]) for (const z of [-0.19, 0.19]) B.vbox(x - 0.025, 0, z - 0.025, x + 0.025, 0.42, z + 0.025, m);
    B.clip(-0.2, 0, -0.2, 0.2, 0.42, 0.2, F.SOLID);
  };
  P.desk = (B, o) => {
    const w = o.w || 1.6, d = o.d || 0.8, m = o.mat || 'wood';
    B.box(-w / 2, 0.72, -d / 2, w / 2, 0.77, d / 2, m, { flags: PROP });
    B.vbox(-w / 2, 0, -d / 2, -w / 2 + 0.45, 0.72, d / 2, m);
    B.vbox(w / 2 - 0.04, 0, -d / 2, w / 2, 0.72, d / 2, m);
    B.vbox(-w / 2, 0.3, d / 2 - 0.04, w / 2, 0.72, d / 2, m);
    B.clip(-w / 2, 0, -d / 2, w / 2, 0.72, d / 2, F.SOLID | F.SHOT);
    if (o.pc) P.computer(B, o);
    if (o.papers !== false) B.vbox(0.1, 0.77, -0.2, 0.45, 0.785, 0.1, 'paper');
    if (o.lamp) B.at(-w / 2 + 0.25, 0.77, -d / 2 + 0.2, 0, () => P.desk_lamp(B, {}));
  };
  P.computer = (B, o) => {
    B.vbox(-0.25, 0.77, -0.05, 0.15, 0.85, 0.3, 'plastic');
    B.vbox(-0.22, 0.85, 0.0, 0.12, 1.18, 0.3, 'plastic');
    B.quad([[-0.2, 0.88, -0.001], [0.1, 0.88, -0.001], [0.1, 1.15, -0.001], [-0.2, 1.15, -0.001]].map(q => [q[0], q[1], q[2]]), 'screen', { emit: true, noG: true });
    B.vbox(-0.3, 0.77, -0.35, 0.15, 0.79, -0.18, 'plastic');
  };
  P.desk_lamp = (B, o) => {
    B.cyl(0, 0, 0, 0.08, 0.02, 'metal_green', { solid: false, sides: 8 });
    B.cyl(0, 0.02, 0, 0.012, 0.3, 'metal_dark', { solid: false, sides: 5 });
    B.cyl(0, 0.3, 0, 0.12, 0.1, 'metal_green', { solid: false, sides: 10, r2: 0.05 });
  };
  P.counter = (B, o) => {
    const l = o.len || 3, m = o.mat || 'wood_dark', top = o.top || 'marble';
    B.box(-l / 2, 0, -0.35, l / 2, 1.0, 0.35, m, { top, flags: PROP });
    B.vbox(-l / 2 - 0.03, 1.0, -0.4, l / 2 + 0.03, 1.06, 0.4, top);
  };
  P.shelf = (B, o) => {
    const w = o.w || 1.8, h = o.h || 2, d = o.d || 0.45, m = o.mat || 'wood';
    B.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, null, { vis: false, flags: PROP });
    B.vbox(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.03, m);
    for (const x of [-w / 2, w / 2 - 0.04]) B.vbox(x, 0, -d / 2, x + 0.04, h, d / 2, m);
    const n = Math.max(2, Math.round(h / 0.45));
    for (let i = 0; i <= n; i++) {
      const y = i * (h - 0.03) / n;
      B.vbox(-w / 2, y, -d / 2, w / 2, y + 0.03, d / 2, m);
      if (i < n && o.fill) B.vbox(-w / 2 + 0.06, y + 0.03, -d / 2 + 0.05, w / 2 - 0.06, y + (h / n) * 0.72, d / 2 - 0.05, o.fill);
    }
  };
  P.bookshelf = (B, o) => P.shelf(B, Object.assign({ fill: 'books', mat: 'wood_dark' }, o));
  P.locker = (B, o) => {
    const n = o.n || 3;
    for (let i = 0; i < n; i++) B.box(-n * 0.25 + i * 0.5, 0, -0.25, -n * 0.25 + (i + 1) * 0.5 - 0.02, 1.9, 0.25, o.mat || 'locker', { flags: PROP });
  };
  P.cabinet = (B, o) => { B.box(-0.4, 0, -0.3, 0.4, o.h || 1.3, 0.3, o.mat || 'filing', { flags: PROP }); };
  P.safe = (B, o) => {
    B.box(-0.45, 0, -0.4, 0.45, 1.0, 0.4, 'metal_dark', { flags: PROP });
    B.cyl(0, 0.55, -0.41, 0.09, 0.02, 'chrome', { solid: false, sides: 10 });
  };
  P.bed = (B, o) => {
    B.box(-0.45, 0, -1, 0.45, 0.45, 1, o.frame || 'metal_grey', { flags: PROP });
    B.vbox(-0.43, 0.45, -0.98, 0.43, 0.58, 0.98, o.mat || 'fabric');
    B.vbox(-0.35, 0.58, 0.6, 0.35, 0.68, 0.95, 'white');
  };
  P.bunk = (B, o) => {
    P.bed(B, o);
    for (const x of [-0.45, 0.41]) for (const z of [-1, 0.96]) B.vbox(x, 0, z, x + 0.04, 1.9, z + 0.04, 'metal_grey');
    B.vbox(-0.45, 1.4, -1, 0.45, 1.5, 1, 'metal_grey');
    B.vbox(-0.43, 1.5, -0.98, 0.43, 1.62, 0.98, o.mat || 'fabric');
  };
  P.toilet = (B, o) => {
    B.box(-0.2, 0, -0.1, 0.2, 0.42, 0.35, 'porcelain', { flags: PROP });
    B.vbox(-0.22, 0.42, 0.25, 0.22, 0.8, 0.4, 'porcelain');
  };
  P.sink = (B, o) => { B.vbox(-0.3, 0.75, -0.02, 0.3, 0.9, 0.4, 'porcelain'); B.vbox(-0.05, 0, 0.3, 0.05, 0.75, 0.38, 'porcelain'); };
  P.sofa = (B, o) => {
    const l = o.len || 2, m = o.mat || 'leather';
    B.box(-l / 2, 0, -0.45, l / 2, 0.45, 0.45, m, { flags: PROP });
    B.vbox(-l / 2, 0.45, 0.25, l / 2, 0.95, 0.45, m);
    B.vbox(-l / 2, 0.45, -0.45, -l / 2 + 0.18, 0.7, 0.45, m);
    B.vbox(l / 2 - 0.18, 0.45, -0.45, l / 2, 0.7, 0.45, m);
  };
  P.armchair = (B, o) => P.sofa(B, Object.assign({ len: 0.95 }, o));
  P.tv = (B, o) => {
    B.box(-0.35, 0, -0.3, 0.35, 0.6, 0.3, 'wood_dark', { flags: PROP });
    B.vbox(-0.3, 0.6, -0.25, 0.3, 1.05, 0.25, 'plastic');
    B.quad([[-0.24, 0.66, -0.252], [0.2, 0.66, -0.252], [0.2, 0.98, -0.252], [-0.24, 0.98, -0.252]], 'screen', { emit: true, noG: true });
  };
  P.plant = (B, o) => {
    B.cyl(0, 0, 0, 0.22, 0.45, 'terracotta', { sides: 8, r2: 0.28 });
    B.sphere(0, 0.85, 0, 0.42, 'leaves', { sy: 1.1 });
  };
  P.trash = (B, o) => { B.cyl(0, 0, 0, 0.26, 0.85, o.mat || 'metal_green', { sides: 10 }); };
  P.cooler = (B, o) => {
    B.box(-0.18, 0, -0.18, 0.18, 1.0, 0.18, 'plastic', { flags: PROP });
    B.cyl(0, 1.0, 0, 0.16, 0.4, 'water_bottle', { solid: false, sides: 8 });
  };
  P.lamp_post = (B, o) => {
    const h = o.h || 4.2;
    B.cyl(0, 0, 0, 0.09, h, o.mat || 'metal_dark', { sides: 8 });
    B.cyl(0, 0, 0, 0.16, 0.5, o.mat || 'metal_dark', { solid: false, sides: 8 });
    B.vbox(-0.05, h - 0.1, -0.05, 0.05, h, 0.7, o.mat || 'metal_dark');
    B.cyl(0, h - 0.25, 0.65, 0.22, 0.2, o.mat || 'metal_dark', { solid: false, sides: 8, r2: 0.05 });
    if (o.light !== false) B.light(0, h - 0.3, 0.65, o.color || [1, 0.78, 0.45], o.r || 9, { bulbR: 0.1, id: o.id });
  };
  P.hydrant = (B, o) => {
    B.cyl(0, 0, 0, 0.14, 0.6, 'red_paint', { sides: 8 });
    B.sphere(0, 0.62, 0, 0.14, 'red_paint', {});
  };
  P.phonebooth = (B, o) => {
    B.box(-0.5, 0, -0.5, 0.5, 0.1, 0.5, 'metal_grey', { flags: F.WALL });
    for (const [x0, x1, z0, z1] of [[-0.5, -0.44, -0.5, 0.5], [0.44, 0.5, -0.5, 0.5], [-0.5, 0.5, 0.44, 0.5]]) B.box(x0, 0.1, z0, x1, 2.3, z1, 'metal_blue', { flags: PROP });
    B.vbox(-0.5, 2.3, -0.5, 0.5, 2.5, 0.5, 'metal_blue');
    B.sign('PHONE', 0, 2.4, -0.505, 0.8, 0.16, 0, { bg: '#f0f0e8', fg: '#1a3a8a', font: 'sans', emit: true });
    B.vbox(-0.2, 1.2, 0.3, 0.2, 1.6, 0.44, 'metal_dark');
  };
  P.newsstand = (B, o) => {
    B.box(-1, 0, -0.6, 1, 1.1, 0.6, 'wood_green', { flags: PROP });
    B.vbox(-1.1, 2.2, -0.9, 1.1, 2.3, 0.7, 'wood_green');
    for (const x of [-1, 0.96]) B.vbox(x, 1.1, 0.5, x + 0.04, 2.2, 0.6, 'wood_green');
    B.vbox(-0.9, 1.1, -0.55, 0.9, 1.14, 0.2, 'newspapers');
  };
  P.mailbox = (B, o) => { B.box(-0.25, 0, -0.25, 0.25, 1.1, 0.25, 'metal_blue', { flags: PROP }); B.cyl(0, 1.1, 0, 0.25, 0.01, 'metal_blue', { solid: false }); };
  P.car = (B, o) => {
    const c = o.mat || 'car_red';
    B.box(-0.95, 0.35, -2.3, 0.95, 1.05, 2.3, c, { flags: F.WALL });
    B.vbox(-0.85, 1.05, -1.1, 0.85, 1.55, 1.0, c);
    B.vbox(-0.86, 1.1, -1.05, 0.86, 1.5, 0.95, 'car_glass');
    B.vbox(-0.95, 0.5, -2.34, 0.95, 0.66, -2.28, 'chrome');
    B.vbox(-0.95, 0.5, 2.28, 0.95, 0.66, 2.34, 'chrome');
    for (const x of [-0.9, 0.9]) for (const z of [-1.5, 1.5]) B.hcyl(x, 0.35, z, 0.35, 0.22, Math.PI / 2, 'tire', { sides: 10 });
    B.vbox(-0.7, 0.8, -2.31, -0.45, 0.95, -2.29, 'headlight', { emit: true });
    B.vbox(0.45, 0.8, -2.31, 0.7, 0.95, -2.29, 'headlight', { emit: true });
  };
  P.van = (B, o) => {
    const c = o.mat || 'car_white';
    B.box(-1.05, 0.4, -2.8, 1.05, 2.4, 2.8, c, { flags: F.WALL });
    B.vbox(-1.06, 1.5, -2.6, 1.06, 2.1, -1.5, 'car_glass');
    for (const x of [-1, 1]) for (const z of [-1.9, 1.9]) B.hcyl(x, 0.4, z, 0.4, 0.25, Math.PI / 2, 'tire', { sides: 10 });
  };
  P.truck = (B, o) => {
    const c = o.mat || 'metal_green';
    B.box(-1.2, 0.6, -4, 1.2, 1.3, 3.5, 'metal_dark', { flags: F.WALL });
    B.box(-1.2, 1.3, -4, 1.2, 3.0, -2.2, c, { flags: F.WALL });
    B.vbox(-1.21, 2.1, -4.01, 1.21, 2.8, -3.2, 'car_glass');
    B.box(-1.25, 1.3, -2.1, 1.25, 3.4, 3.5, o.cargo || 'canvas_green', { flags: F.WALL });
    for (const x of [-1.1, 1.1]) for (const z of [-3, 0.8, 2.6]) B.hcyl(x, 0.55, z, 0.55, 0.35, Math.PI / 2, 'tire', { sides: 10 });
  };
  P.jeep = (B, o) => {
    const c = o.mat || 'metal_green';
    B.box(-0.9, 0.45, -2, 0.9, 1.2, 2, c, { flags: F.WALL });
    B.vbox(-0.85, 1.2, -0.7, 0.85, 1.25, 1.8, c);
    B.vbox(-0.85, 1.25, -0.75, 0.85, 1.75, -0.7, 'car_glass');
    for (const x of [-0.85, 0.85]) for (const z of [-1.3, 1.3]) B.hcyl(x, 0.42, z, 0.42, 0.3, Math.PI / 2, 'tire', { sides: 10 });
  };
  P.umbrella = (B, o) => {
    B.cyl(0, 0, 0, 0.03, 2.2, 'white', { solid: false, sides: 5 });
    B.cyl(0, 1.9, 0, 1.25, 0.45, o.mat || 'stripes', { solid: false, sides: 10, r2: 0.02 });
  };
  P.deckchair = (B, o) => {
    const m = o.mat || 'stripes';
    B.quad([[-0.3, 0.3, -0.6], [0.3, 0.3, -0.6], [0.3, 0.3, 0.25], [-0.3, 0.3, 0.25]], m, { two: true });
    B.quad([[-0.3, 0.3, 0.25], [0.3, 0.3, 0.25], [0.3, 0.95, 0.6], [-0.3, 0.95, 0.6]], m, { two: true });
    for (const x of [-0.32, 0.3]) { B.vbox(x, 0, -0.6, x + 0.03, 0.32, -0.55, 'wood_light'); B.vbox(x, 0, 0.55, x + 0.03, 0.98, 0.6, 'wood_light'); }
    B.clip(-0.3, 0, -0.6, 0.3, 0.3, 0.6, F.SOLID);
  };
  P.lifebuoy = (B, o) => {
    B.vbox(-0.05, 0, -0.05, 0.05, 1.6, 0.05, 'wood');
    B.cyl(0, 1.2, -0.08, 0.3, 0.08, 'buoy', { solid: false, sides: 12 });
  };
  P.railing = (B, o) => {
    const l = o.len || 3, h = o.h || 1.05, m = o.mat || 'wood_light';
    B.box(-l / 2, h - 0.08, -0.06, l / 2, h, 0.06, m, { flags: F.SOLID | F.SHOT });
    B.vbox(-l / 2, h * 0.5, -0.03, l / 2, h * 0.5 + 0.05, 0.03, m);
    const n = Math.max(1, Math.round(l / 1.5));
    for (let i = 0; i <= n; i++) { const x = -l / 2 + l * i / n; B.vbox(x - 0.05, 0, -0.05, x + 0.05, h, 0.05, m); }
    B.clip(-l / 2, 0, -0.05, l / 2, h, 0.05, F.SOLID);
  };
  P.post_rail = (B, o) => {
    const l = o.len || 3, h = o.h || 1.0, m = o.mat || 'metal_dark';
    B.hcyl(0, h, 0, 0.035, l, Math.PI / 2, m, { sides: 6 });
    B.hcyl(0, h * 0.55, 0, 0.025, l, Math.PI / 2, m, { sides: 6 });
    const n = Math.max(1, Math.round(l / 2));
    for (let i = 0; i <= n; i++) B.cyl(-l / 2 + l * i / n, 0, 0, 0.04, h, m, { solid: false, sides: 6 });
    B.clip(-l / 2, 0, -0.05, l / 2, h, 0.05, F.SOLID);
  };
  P.container = (B, o) => {
    const m = o.mat || 'container_red', l = o.len || 6.1;
    B.box(-1.22, 0, -l / 2, 1.22, 2.6, l / 2, m, { flags: F.WALL, top: 'container_top' });
    if (o.doors) B.vbox(-1.2, 0.05, l / 2, 1.2, 2.55, l / 2 + 0.02, 'container_door');
  };
  P.sandbags = (B, o) => {
    const l = o.len || 3;
    for (let i = 0; i < 3; i++) B.box(-l / 2 + i * 0.1, i * 0.25, -0.3, l / 2 - i * 0.1, (i + 1) * 0.25, 0.3, 'sandbag', { flags: F.WALL });
  };
  P.jersey = (B, o) => { B.box(-1.5, 0, -0.3, 1.5, 0.8, 0.3, 'concrete', { flags: F.WALL }); };
  P.tent = (B, o) => {
    B.roof(-2, -2.5, 2, 2.5, 0, 2.4, 'z', 'canvas_green', { over: 0.2, gable: false, solid: false });
    B.box(-1.8, 0, -2.4, 1.8, 1.4, 2.4, null, { vis: false, flags: PROP });
  };
  P.generator = (B, o) => {
    B.box(-1, 0, -0.7, 1, 1.4, 0.7, 'metal_green', { flags: F.WALL });
    B.cyl(0.6, 1.4, 0.2, 0.08, 0.6, 'metal_dark', { solid: false, sides: 6 });
    B.vbox(-0.8, 0.4, -0.72, 0.4, 1.1, -0.7, 'hazard');
  };
  P.fuel_tank = (B, o) => {
    B.hcyl(0, 1.2, 0, 1.1, 4, 0, o.mat || 'metal_grey', { sides: 14, solid: true });
    for (const z of [-1.4, 1.4]) B.vbox(-0.9, 0, z - 0.15, 0.9, 0.5, z + 0.15, 'concrete');
  };
  P.searchlight = (B, o) => {
    B.cyl(0, 0, 0, 0.1, 0.9, 'metal_dark', { solid: false, sides: 6 });
    B.hcyl(0, 1.1, 0, 0.35, 0.6, 0, 'metal_grey', { sides: 12 });
    B.quad([[-0.3, 0.8, -0.31], [0.3, 0.8, -0.31], [0.3, 1.4, -0.31], [-0.3, 1.4, -0.31]], 'bulb', { emit: true, noG: true });
  };
  P.watchtower = (B, o) => {
    const h = o.h || 6;
    for (const x of [-1.6, 1.6]) for (const z of [-1.6, 1.6]) B.cyl(x, 0, z, 0.15, h, 'wood_dark', { sides: 6 });
    B.box(-2, h, -2, 2, h + 0.2, 2, 'planks', { flags: F.WALL });
    for (const [x0, z0, x1, z1] of [[-2, -2, 2, -1.9], [-2, 1.9, 2, 2], [-2, -2, -1.9, 2], [1.9, -2, 2, 2]]) B.box(x0, h + 0.2, z0, x1, h + 1.2, z1, 'planks_v', { flags: F.SOLID | F.SHOT });
    for (const x of [-1.95, 1.85]) for (const z of [-1.95, 1.85]) B.vbox(x, h + 1.2, z, x + 0.1, h + 2.6, z + 0.1, 'wood_dark');
    B.roof(-2.1, -2.1, 2.1, 2.1, h + 2.6, 0.9, 'x', o.roof || 'shingles', { over: 0.3, gable: false, solid: false });
    B.ladder(0, 1.6, 0, h + 0.2, 0, 0.7, {});
    if (o.light) B.at(0, h + 1.2, -1.9, 0, () => P.searchlight(B, {}));
  };
  P.pine_log = (B, o) => { B.hcyl(0, 0.3, 0, 0.3, o.len || 4, o.yaw || 0, 'bark', { sides: 8, solid: true }); };
  P.antenna = (B, o) => {
    const h = o.h || 12;
    B.cyl(0, 0, 0, 0.35, h, 'metal_red', { sides: 4, r2: 0.05 });
    B.cyl(0, 0, 0, 0.5, 0.3, 'concrete', { sides: 4 });
  };
  P.radar = (B, o) => {
    B.cyl(0, 0, 0, 0.6, 3, 'metal_grey', { sides: 8 });
    B.at(0, 3.5, 0, o.yaw || 0, () => {
      B.quad([[-2.4, -1.2, 0], [2.4, -1.2, 0], [2.0, 1.4, -0.9], [-2.0, 1.4, -0.9]], 'metal_grey', { two: true });
    });
  };
  P.oil_drum_fire = (B, o) => {
    B.cyl(0, 0, 0, 0.3, 0.9, 'metal_rust', { sides: 10 });
    B.light(0, 1.3, 0, [1, 0.55, 0.2], 7, { flicker: 1, bulbR: 0.01 });
  };
  P.fireplace = (B, o) => {
    B.box(-1.2, 0, -0.5, 1.2, 1.3, 0.5, 'stone', { flags: F.WALL });
    B.box(-1.4, 1.3, -0.6, 1.4, 1.45, 0.6, 'wood_dark', { flags: F.WALL });
    B.box(-0.9, 1.45, -0.3, 0.9, 3.4, 0.5, 'stone', { flags: F.WALL });
    B.vbox(-0.7, 0.05, -0.51, 0.7, 0.95, -0.49, 'soot');
    B.light(0, 0.4, -0.7, [1, 0.5, 0.2], 7, { flicker: 1, bulbR: 0.2 });
  };
  P.trophy = (B, o) => {
    B.vbox(-0.25, 0, -0.05, 0.25, 0.35, 0, 'wood_dark');
    B.sphere(0, 0.15, -0.25, 0.2, 'fur', { sy: 1.2 });
    B.cyl(-0.18, 0.3, -0.2, 0.02, 0.5, 'bone', { solid: false, sides: 4, r2: 0.01 });
    B.cyl(0.18, 0.3, -0.2, 0.02, 0.5, 'bone', { solid: false, sides: 4, r2: 0.01 });
  };
  P.mine_cart = (B, o) => {
    B.box(-0.6, 0.35, -0.9, 0.6, 1.25, 0.9, 'metal_rust', { flags: F.WALL });
    for (const x of [-0.55, 0.55]) for (const z of [-0.6, 0.6]) B.hcyl(x, 0.25, z, 0.22, 0.1, Math.PI / 2, 'metal_dark', { sides: 8 });
  };
  P.rails = (B, o) => {
    const l = o.len || 6;
    for (const x of [-0.5, 0.5]) B.vbox(x - 0.04, 0, -l / 2, x + 0.04, 0.1, l / 2, 'metal_dark');
    for (let z = -l / 2 + 0.3; z < l / 2; z += 0.7) B.vbox(-0.75, 0, z - 0.1, 0.75, 0.06, z + 0.1, 'wood_dark');
  };
  P.mine_frame = (B, o) => {
    const w = o.w || 3.2, h = o.h || 3;
    for (const x of [-w / 2, w / 2 - 0.25]) B.box(x, 0, -0.12, x + 0.25, h, 0.12, 'beam', { flags: PROP });
    B.box(-w / 2, h - 0.25, -0.15, w / 2, h, 0.15, 'beam', { flags: PROP });
  };
  P.lantern = (B, o) => {
    B.cyl(0, 0, 0, 0.08, 0.22, 'metal_dark', { solid: false, sides: 6 });
    B.light(0, 0.12, 0, o.color || [1, 0.7, 0.35], o.r || 6, { flicker: o.flicker === undefined ? 0.4 : o.flicker, bulbR: 0.06 });
  };
  P.ceiling_light = (B, o) => {
    B.vbox(-0.6, -0.08, -0.15, 0.6, 0, 0.15, 'light_panel', { emit: true });
    if (o.light !== false) B.light(0, -0.3, 0, o.color || [0.9, 0.95, 1], o.r || 8, { bulb: false, id: o.id });
  };
  P.alarm_box = (B, o) => { B.vbox(-0.15, -0.2, -0.06, 0.15, 0.2, 0, 'alarm_red'); };
  P.pylon = (B, o) => {
    const h = o.h || 20;
    B.cyl(-1.2, 0, 0, 0.3, h, 'metal_grey', { sides: 6, r2: 0.18 });
    B.cyl(1.2, 0, 0, 0.3, h, 'metal_grey', { sides: 6, r2: 0.18 });
    B.vbox(-3.5, h, -0.4, 3.5, h + 0.6, 0.4, 'metal_grey');
    for (let y = 3; y < h; y += 4) B.vbox(-1.2, y, -0.1, 1.2, y + 0.2, 0.1, 'metal_grey');
    for (const x of [-3, 3]) B.hcyl(x, h + 0.75, 0, 0.35, 0.3, 0, 'metal_dark', { sides: 10 });
    B.cyl(0, 0, 0, 2.2, 0.8, 'concrete', { sides: 6 });
  };
  P.cell_bars = (B, o) => {
    const l = o.len || 3, h = o.h || 2.6;
    for (let x = -l / 2 + 0.06; x <= l / 2; x += 0.14) B.cyl(x, 0, 0, 0.018, h, 'bars', { solid: false, sides: 4 });
    B.vbox(-l / 2, h - 0.08, -0.04, l / 2, h, 0.04, 'bars');
    B.vbox(-l / 2, 1.1, -0.03, l / 2, 1.16, 0.03, 'bars');
    B.box(-l / 2, 0, -0.04, l / 2, h, 0.04, null, { vis: false, flags: F.SOLID | F.WALK });
  };
  P.helipad = (B, o) => {
    B.cyl(0, 0, 0, 7, 0.08, 'helipad', { sides: 24, solid: false });
  };
  P.boat = (B, o) => {
    const l = o.len || 6, m = o.mat || 'boat_white';
    B.box(-1.1, 0, -l / 2 + 0.8, 1.1, 1.0, l / 2, m, { flags: F.WALL });
    B.quad([[-1.1, 1.0, -l / 2 + 0.8], [1.1, 1.0, -l / 2 + 0.8], [0, 1.0, -l / 2]], m, { two: true });
    B.quad([[-1.1, 0, -l / 2 + 0.8], [0, 0.3, -l / 2], [0, 1.0, -l / 2], [-1.1, 1.0, -l / 2 + 0.8]], m, { two: true });
    B.quad([[1.1, 0, -l / 2 + 0.8], [1.1, 1.0, -l / 2 + 0.8], [0, 1.0, -l / 2], [0, 0.3, -l / 2]], m, { two: true });
    if (o.cabin) { B.box(-0.9, 1.0, -0.5, 0.9, 2.2, 1.2, m, { flags: F.WALL }); B.vbox(-0.91, 1.6, -0.52, 0.91, 2.0, 0.9, 'car_glass'); }
  };
  P.rowboat = (B, o) => {
    B.box(-0.65, 0, -1.7, 0.65, 0.55, 1.7, 'wood', { flags: F.SOLID | F.SHOT });
    B.vbox(-0.55, 0.2, -1.6, 0.55, 0.25, 1.6, 'wood_dark');
  };
  P.ticket_booth = (B, o) => {
    B.box(-1, 0, -1, 1, 2.5, 1, 'siding_white', { flags: F.WALL });
    B.vbox(-1.2, 2.5, -1.2, 1.2, 2.7, 1.2, 'red_paint');
  };
  P.telescope = (B, o) => {
    B.cyl(0, 0, 0, 0.06, 1.1, 'metal_green', { sides: 6 });
    B.hcyl(0, 1.25, 0, 0.13, 0.55, 0, 'metal_green', { sides: 8 });
    B.clip(-0.15, 0, -0.15, 0.15, 1.3, 0.15, F.SOLID);
  };
  P.sign_post = (B, o) => {
    B.cyl(0, 0, 0, 0.05, o.h || 2.4, 'metal_grey', { solid: false, sides: 5 });
    B.sign(o.text || 'SIGN', 0, (o.h || 2.4) - 0.3, -0.06, o.w || 1.2, o.sh || 0.5, 0, Object.assign({ two: true }, o.style || {}));
  };
  P.column = (B, o) => {
    const h = o.h || 6, r = o.r || 0.45, m = o.mat || 'stone_white';
    B.box(-r - 0.12, 0, -r - 0.12, r + 0.12, 0.35, r + 0.12, m, { flags: F.WALL });
    B.cyl(0, 0.35, 0, r, h - 0.8, m, { sides: 14, r2: r * 0.9 });
    B.box(-r - 0.15, h - 0.45, -r - 0.15, r + 0.15, h, r + 0.15, m, { flags: F.WALL });
  };
  P.rope_post = (B, o) => {
    B.cyl(0, 0, 0, 0.14, 0.05, 'brass', { solid: false, sides: 8 });
    B.cyl(0, 0.05, 0, 0.03, 0.9, 'brass', { solid: false, sides: 6 });
    B.sphere(0, 0.97, 0, 0.05, 'brass');
    if (o.len) B.hcyl(o.len / 2, 0.85, 0, 0.025, o.len, Math.PI / 2, 'velvet', { sides: 6 });
    B.clip(-0.1, 0, -0.1, 0.1, 1, 0.1, F.SOLID);
  };
  P.teller = (B, o) => {
    const l = o.len || 4;
    B.box(-l / 2, 0, -0.4, l / 2, 1.1, 0.4, 'wood_dark', { top: 'marble', flags: F.WALL });
    for (let x = -l / 2; x <= l / 2 + 0.01; x += l / Math.max(1, Math.round(l / 2))) B.vbox(x - 0.04, 1.1, -0.05, x + 0.04, 2.3, 0.05, 'brass');
    B.glass(-l / 2, 1.3, -0.02, l / 2, 2.25, 0.02, 'glass');
    B.vbox(-l / 2, 2.25, -0.06, l / 2, 2.35, 0.06, 'brass');
  };
  P.clock = (B, o) => {
    B.cyl(0, 0, 0, o.r || 0.5, 0.08, 'clock_face', { solid: false, sides: 18 });
  };
  P.deposit_wall = (B, o) => {
    const w = o.w || 6, h = o.h || 2.6;
    B.box(-w / 2, 0, -0.3, w / 2, h, 0.3, 'deposit', { flags: F.WALL });
  };
  P.vault_door = (B, o) => {
    B.hcyl(0, 1.3, 0, 1.3, 0.5, 0, 'vault_steel', { sides: 20, solid: false });
    B.hcyl(0, 1.3, -0.3, 0.35, 0.12, 0, 'chrome', { sides: 10, solid: false });
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; B.vbox(Math.cos(a) * 0.5 - 0.04, 1.3 + Math.sin(a) * 0.5 - 0.04, -0.4, Math.cos(a) * 0.5 + 0.04, 1.3 + Math.sin(a) * 0.5 + 0.04, -0.3, 'chrome'); }
    B.box(-1.3, 0, -0.25, 1.3, 2.6, 0.25, null, { vis: false, flags: F.WALL });
  };
  P.hvac = (B, o) => {
    B.box(-1.2, 0, -0.8, 1.2, 1.3, 0.8, 'metal_grey', { flags: F.WALL });
    B.cyl(0.4, 1.3, 0, 0.45, 0.2, 'metal_dark', { solid: false, sides: 12 });
    B.vbox(-1.21, 0.2, -0.6, -1.2, 1.1, 0.6, 'vent');
  };
  P.water_tower = (B, o) => {
    for (const x of [-1.3, 1.3]) for (const z of [-1.3, 1.3]) B.cyl(x, 0, z, 0.12, 3.2, 'metal_dark', { sides: 6 });
    B.box(-1.6, 3.2, -1.6, 1.6, 3.35, 1.6, 'planks', { flags: F.WALL });
    B.cyl(0, 3.35, 0, 1.7, 3.2, 'barrel_wood', { sides: 16 });
    B.cyl(0, 6.55, 0, 1.8, 1.0, 'shingles', { solid: false, sides: 16, r2: 0.05 });
  };
  P.skylight = (B, o) => {
    const w = o.w || 3, d = o.d || 2;
    B.box(-w / 2, 0, -d / 2, w / 2, 0.4, d / 2, 'metal_grey', { flags: F.WALL, top: 'metal_grey' });
    B.glass(-w / 2 + 0.1, 0.4, -d / 2 + 0.1, w / 2 - 0.1, 0.45, d / 2 - 0.1, 'glass');
  };
  P.police_car = (B, o) => {
    P.car(B, { mat: 'car_police' });
    B.vbox(-0.45, 1.55, -0.2, 0.45, 1.72, 0.2, 'siren_bar', { emit: true });
  };
  P.fire_escape = (B, o) => {
    const h = o.h || 12, w = o.w || 3;
    for (let y = 3; y < h - 0.5; y += 3.5) {
      B.box(-w / 2, y - 0.08, 0, w / 2 - 1.0, y, 1.2, 'grate', { flags: F.WALL });
      B.vbox(-w / 2, y, 1.15, w / 2 - 1.0, y + 1, 1.2, 'metal_dark');
    }
    B.ladder(w / 2 - 0.5, 0.95, 0, h, 0, 0.6, {});
  };
  P.bollard = (B, o) => {
    B.cyl(0, 0, 0, 0.22, 0.6, 'metal_dark', { sides: 8 });
    B.cyl(0, 0.6, 0, 0.3, 0.1, 'metal_dark', { solid: false, sides: 8 });
  };
  P.forklift = (B, o) => {
    B.box(-0.7, 0.3, -1.1, 0.7, 1.4, 1.0, 'yellow_paint', { flags: F.WALL });
    B.vbox(-0.6, 1.4, -0.2, 0.6, 2.3, 0.9, 'metal_dark');
    B.vbox(-0.55, 2.2, -0.25, 0.55, 2.3, 0.95, 'yellow_paint');
    for (const x of [-0.5, 0.5]) B.vbox(x - 0.05, 0, -1.4, x + 0.05, 2.6, -1.2, 'metal_dark');
    for (const x of [-0.4, 0.4]) B.vbox(x - 0.07, 0.1, -2.4, x + 0.07, 0.16, -1.2, 'metal_dark');
    for (const x of [-0.7, 0.7]) for (const z of [-0.7, 0.6]) B.hcyl(x, 0.3, z, 0.3, 0.2, Math.PI / 2, 'tire', { sides: 10 });
  };
  P.crane = (B, o) => {
    const h = o.h || 16;
    for (const x of [-2, 2]) for (const z of [-2, 2]) B.box(x - 0.25, 0, z - 0.25, x + 0.25, h, z + 0.25, 'metal_red', { flags: F.WALL });
    for (let y = 3; y < h; y += 3.2) { B.vbox(-2, y, -2.15, 2, y + 0.2, -1.95, 'metal_red'); B.vbox(-2, y, 1.95, 2, y + 0.2, 2.15, 'metal_red'); B.vbox(-2.15, y, -2, -1.95, y + 0.2, 2, 'metal_red'); }
    B.box(-2.4, h, -2.4, 2.4, h + 0.3, 2.4, 'grate', { flags: F.WALL });
    B.box(-1.8, h + 0.3, -1.8, 1.8, h + 2.8, -1.7, 'metal_yellow', { flags: F.SOLID | F.SHOT | F.SIGHT });
    B.box(-1.8, h + 0.3, 1.7, 0.1, h + 2.8, 1.8, 'metal_yellow', { flags: F.SOLID | F.SHOT | F.SIGHT });
    B.box(1.5, h + 0.3, 1.7, 1.8, h + 2.8, 1.8, 'metal_yellow', { flags: F.SOLID | F.SHOT | F.SIGHT });
    B.box(0.1, h + 2.3, 1.7, 1.5, h + 2.8, 1.8, 'metal_yellow', { flags: F.SOLID | F.SHOT | F.SIGHT });
    B.box(1.7, h + 0.3, -1.8, 1.8, h + 2.8, 1.8, 'metal_yellow', { flags: F.SOLID | F.SHOT | F.SIGHT });
    B.box(-1.8, h + 0.3, -1.8, -1.7, h + 1.1, 1.8, 'metal_yellow', { flags: F.SOLID | F.SHOT });
    B.glass(-1.8, h + 1.1, -1.75, -1.72, h + 2.6, 1.75, 'glass');
    B.box(-1.9, h + 2.8, -1.9, 1.9, h + 3.0, 1.9, 'metal_yellow', { flags: F.WALL });
    B.box(-1.2, h + 3.0, -1.2, 26, h + 4.4, 1.2, 'metal_red', { flags: F.SOLID | F.SHOT | F.SIGHT, yaw: 0 });
    B.box(-9, h + 3.0, -1.3, -1.2, h + 5.2, 1.3, 'concrete', { flags: F.WALL });
    B.cyl(20, h - 6, 0, 0.04, 9, 'metal_dark', { solid: false, sides: 4 });
    B.box(19.4, h - 6.6, -0.6, 20.6, h - 6, 0.6, 'metal_dark', { flags: F.SOLID | F.SHOT });
    B.ladder(0.8, 2.3, 0, h + 0.3, 0, 0.7, {});
  };
  P.stretch_fence = (B, o) => {
    B.fence(-o.len / 2, 0, o.len / 2, 0, 0, o.h || 2.4, {});
  };
})(globalThis.XIII = globalThis.XIII || {});
