(function (S) {
  'use strict';
  const { col, mulCol, mixCol } = S;
  const WHITE = [0.94, 0.94, 0.92], CHROME = [0.78, 0.8, 0.84], BLACK = [0.12, 0.12, 0.14], DARK = [0.26, 0.26, 0.3], GREEN = [0.25, 0.55, 0.22], BRASS = [0.85, 0.7, 0.35];
  const M = {};

  function legs(g, hw, hd, h, r, c, inset) {
    inset = inset === undefined ? 0.05 : inset;
    for (const [x, y] of [[-hw + inset, -hd + inset], [hw - inset, -hd + inset], [-hw + inset, hd - inset], [hw - inset, hd - inset]]) g.box(x - r, y - r, 0, x + r, y + r, h, c, { noTop: false });
  }
  function chairBase(g, C1, C2, seatH, back, o) {
    o = o || {};
    legs(g, 0.22, 0.22, seatH - 0.04, 0.025, C1, 0.04);
    g.box(-0.22, -0.22, seatH - 0.05, 0.22, 0.22, seatH, C2, { cell: o.fabric ? 'fabric' : 'wood' });
    if (back) {
      g.box(-0.22, -0.24, seatH, -0.17, -0.19, seatH + back, C1, { cell: 'wood' });
      g.box(0.17, -0.24, seatH, 0.22, -0.19, seatH + back, C1, { cell: 'wood' });
      g.box(-0.22, -0.24, seatH + back - 0.12, 0.22, -0.19, seatH + back, C1, { cell: 'wood' });
      if (o.slats) for (let i = -1; i <= 1; i++) g.box(i * 0.08 - 0.015, -0.235, seatH, i * 0.08 + 0.015, -0.2, seatH + back - 0.12, C1, { cell: 'wood' });
    }
  }
  M.chair_cheap = (g, o, C1, C2) => chairBase(g, C1, C2, 0.46, 0.44, { fabric: true });
  M.chair_wood = (g, o, C1, C2) => chairBase(g, C1, C2, 0.46, 0.52, { slats: true });
  M.chair_office = (g, o, C1, C2) => {
    g.cyl(0, 0, 0.02, 0.06, 0.24, 0.24, 5, C2, { flat: true });
    g.cyl(0, 0, 0.06, 0.4, 0.03, 0.03, 6, C2);
    g.box(-0.22, -0.22, 0.4, 0.22, 0.22, 0.48, C1, { cell: 'fabric' });
    g.box(-0.2, -0.24, 0.5, 0.2, -0.16, 0.98, C1, { cell: 'fabric' });
  };
  function armchair(g, C1, C2, back, lux) {
    g.box(-0.4, -0.38, 0.06, 0.4, 0.38, 0.3, C1, { cell: 'fabric' });
    g.box(-0.3, -0.25, 0.3, 0.3, 0.36, 0.44, mulCol(C1, 1.08), { cell: 'fabric' });
    g.box(-0.4, -0.4, 0.3, 0.4, -0.2, 0.3 + back, C1, { cell: 'fabric' });
    g.box(-0.42, -0.38, 0.3, -0.3, 0.38, 0.62, mulCol(C1, 0.95), { cell: 'fabric' });
    g.box(0.3, -0.38, 0.3, 0.42, 0.38, 0.62, mulCol(C1, 0.95), { cell: 'fabric' });
    for (const [x, y] of [[-0.35, -0.33], [0.35, -0.33], [-0.35, 0.33], [0.35, 0.33]]) g.cyl(x, y, 0, 0.07, 0.03, 0.03, 5, C2, { flat: true });
    if (lux) { for (let i = 0; i < 4; i++) g.sphere(-0.3 + i * 0.2, -0.36, 0.3 + back - 0.08, 0.02, 0.02, 0.02, 4, 3, BRASS); }
  }
  M.armchair = (g, o, C1, C2) => armchair(g, C1, C2, 0.5, false);
  M.armchair_lux = (g, o, C1, C2) => armchair(g, C1, C2, 0.6, true);
  M.recliner = (g, o, C1, C2) => { armchair(g, C1, C2, 0.62, false); g.box(-0.28, 0.36, 0.14, 0.28, 0.46, 0.34, C1, { cell: 'fabric' }); };
  function sofa(g, w, C1, C2, back, lux, arms) {
    const hw = w / 2 - 0.02;
    g.box(-hw, -0.4, 0.06, hw, 0.4, 0.28, mulCol(C1, 0.9), { cell: 'fabric' });
    const n = Math.round(w);
    for (let i = 0; i < n; i++) {
      const x0 = -hw + 0.12 + i * (2 * hw - 0.24) / n, x1 = -hw + 0.12 + (i + 1) * (2 * hw - 0.24) / n;
      g.box(x0 + 0.01, -0.24, 0.28, x1 - 0.01, 0.38, 0.42, C1, { cell: 'fabric' });
      g.box(x0 + 0.02, -0.38, 0.4, x1 - 0.02, -0.22, 0.4 + back - 0.04, mulCol(C1, 1.04), { cell: 'fabric' });
    }
    g.box(-hw, -0.4, 0.28, hw, -0.3, 0.28 + back, mulCol(C1, 0.92), { cell: 'fabric' });
    if (arms !== false) {
      g.box(-hw, -0.4, 0.28, -hw + 0.13, 0.4, 0.6, mulCol(C1, 0.95), { cell: 'fabric' });
      g.box(hw - 0.13, -0.4, 0.28, hw, 0.4, 0.6, mulCol(C1, 0.95), { cell: 'fabric' });
    }
    for (const [x, y] of [[-hw + 0.06, -0.34], [hw - 0.06, -0.34], [-hw + 0.06, 0.34], [hw - 0.06, 0.34]]) g.cyl(x, y, 0, 0.07, 0.03, lux ? 0.02 : 0.03, 5, C2, { flat: true });
    if (lux) g.box(-hw, 0.38, 0.06, hw, 0.41, 0.12, C2);
  }
  M.loveseat = (g, o, C1, C2) => sofa(g, 2, C1, C2, 0.45, false);
  M.sofa_cheap = (g, o, C1, C2) => sofa(g, 3, C1, C2, 0.42, false);
  M.sofa_mid = (g, o, C1, C2) => sofa(g, 3, C1, C2, 0.48, false);
  M.sofa_lux = (g, o, C1, C2) => sofa(g, 3, C1, C2, 0.56, true);
  M.bench_park = (g, o, C1, C2) => {
    for (const x of [-0.8, 0.8]) { g.box(x - 0.04, -0.2, 0, x + 0.04, 0.2, 0.44, C2); g.box(x - 0.04, -0.26, 0.44, x + 0.04, -0.2, 0.86, C2); }
    for (let i = 0; i < 3; i++) g.box(-0.95, -0.2 + i * 0.13, 0.42, 0.95, -0.12 + i * 0.13, 0.46, C1, { cell: 'wood_h' });
    for (let i = 0; i < 2; i++) g.box(-0.95, -0.27, 0.58 + i * 0.16, 0.95, -0.22, 0.68 + i * 0.16, C1, { cell: 'wood_h' });
  };

  function bed(g, w, d, C1, C2, h, st, lux) {
    const hw = w / 2 - 0.03, hd = d / 2 - 0.03;
    g.box(-hw, -hd, 0.08, hw, hd, h - 0.18, C1, { cell: 'wood' });
    legs(g, hw, hd, 0.1, 0.04, C1, 0.04);
    g.box(-hw + 0.03, -hd + 0.05, h - 0.18, hw - 0.03, hd - 0.03, h, WHITE, { cell: 'fabric' });
    const bump = st && st.woohoo ? 0.14 : 0;
    g.box(-hw + 0.01, -hd + 0.45, h - 0.02, hw - 0.01, hd - 0.01, h + 0.04 + bump, C2, { cell: 'fabric', side: mulCol(C2, 0.9) });
    g.box(-hw + 0.01, -hd + 0.45, h - 0.32, hw - 0.01, -hd + 0.5, h + 0.04 + bump, mulCol(C2, 0.85), { cell: 'fabric' });
    const n = w > 1.5 ? 2 : 1;
    for (let i = 0; i < n; i++) { const x = n === 1 ? 0 : (i ? 0.45 : -0.45); g.box(x - 0.28, -hd + 0.08, h, x + 0.28, -hd + 0.4, h + 0.1, WHITE, { cell: 'fabric' }); }
    g.box(-hw, -hd - 0.02, 0, hw, -hd + 0.06, h + (lux ? 0.9 : 0.55), C1, { cell: 'wood' });
    g.box(-hw, hd - 0.05, 0, hw, hd + 0.02, h + 0.1, C1, { cell: 'wood' });
    if (lux) {
      for (const [x, y] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) g.cyl(x, y, 0, 2.1, 0.04, 0.04, 6, C1, { cell: 'wood' });
      g.box(-hw - 0.04, -hd - 0.04, 2.05, hw + 0.04, hd + 0.04, 2.14, C1, { cell: 'wood' });
      g.box(-hw - 0.02, -hd - 0.02, 1.6, -hw + 0.02, hd + 0.02, 2.05, mulCol(C2, 1.1), { cell: 'fabric' });
      g.box(hw - 0.02, -hd - 0.02, 1.6, hw + 0.02, hd + 0.02, 2.05, mulCol(C2, 1.1), { cell: 'fabric' });
    }
  }
  M.bed_single = (g, o, C1, C2, st) => bed(g, 1, 2, C1, C2, 0.5, st);
  M.bed_single_mid = (g, o, C1, C2, st) => bed(g, 1, 2, C1, C2, 0.52, st);
  M.bed_double = (g, o, C1, C2, st) => bed(g, 2, 2, C1, C2, 0.5, st);
  M.bed_double_mid = (g, o, C1, C2, st) => bed(g, 2, 2, C1, C2, 0.55, st);
  M.bed_double_lux = (g, o, C1, C2, st) => bed(g, 2, 2, C1, C2, 0.6, st, true);
  M.crib = (g, o, C1, C2) => {
    legs(g, 0.42, 0.42, 0.9, 0.03, C1, 0.02);
    g.box(-0.4, -0.4, 0.3, 0.4, 0.4, 0.36, C2, { cell: 'fabric' });
    for (const y of [-0.41, 0.41]) { g.box(-0.42, y - 0.02, 0.86, 0.42, y + 0.02, 0.9, C1); for (let i = -3; i <= 3; i++) g.box(i * 0.12 - 0.01, y - 0.01, 0.36, i * 0.12 + 0.01, y + 0.01, 0.86, C1); }
    for (const x of [-0.41, 0.41]) { g.box(x - 0.02, -0.42, 0.86, x + 0.02, 0.42, 0.9, C1); for (let i = -3; i <= 3; i++) g.box(x - 0.01, i * 0.12 - 0.01, 0.36, x + 0.01, i * 0.12 + 0.01, 0.86, C1); }
  };

  function cabinet(g, C1, C2, h, o) {
    o = o || {};
    g.box(-0.48, -0.44, 0.08, 0.48, 0.42, h - 0.04, C2, { cell: 'wood' });
    g.box(-0.46, -0.4, 0, 0.46, 0.38, 0.08, mulCol(C2, 0.5));
    g.box(-0.5, -0.46, h - 0.05, 0.5, 0.5, h, C1, { cell: o.stone ? 'marble' : null });
    if (!o.noDoors) { g.box(-0.44, 0.42, 0.14, -0.02, 0.44, h - 0.1, mulCol(C2, 1.06), { cell: 'wood' }); g.box(0.02, 0.42, 0.14, 0.44, 0.44, h - 0.1, mulCol(C2, 1.06), { cell: 'wood' }); g.box(-0.08, 0.44, h - 0.3, -0.05, 0.47, h - 0.2, CHROME); g.box(0.05, 0.44, h - 0.3, 0.08, 0.47, h - 0.2, CHROME); }
  }
  M.counter = (g, o, C1, C2) => cabinet(g, C1, C2, 0.9);
  M.counter_granite = (g, o, C1, C2) => cabinet(g, C1, C2, 0.9, { stone: true });
  M.dishwasher = (g, o, C1, C2) => { cabinet(g, C1, C1, 0.9, { noDoors: true }); g.box(-0.44, 0.42, 0.1, 0.44, 0.45, 0.84, C2, { cell: 'metal' }); g.box(-0.3, 0.45, 0.74, 0.3, 0.48, 0.78, BLACK); };
  M.sink_kitchen = (g, o, C1, C2) => { cabinet(g, C1, mulCol(C1, 0.9), 0.9); g.box(-0.36, -0.3, 0.9, 0.36, 0.3, 0.905, CHROME, { top: 'sink_top' }); g.cyl(0, -0.36, 0.9, 1.15, 0.02, 0.02, 5, C2); g.box(-0.02, -0.36, 1.12, 0.02, -0.14, 1.15, C2); };
  function table(g, w, d, h, C1, C2, o) {
    o = o || {};
    const hw = w / 2 - 0.06, hd = d / 2 - 0.06;
    g.box(-hw, -hd, h - 0.05, hw, hd, h, C1, { cell: o.top || 'wood' });
    if (o.pedestal) { g.cyl(0, 0, 0, h - 0.05, 0.06, 0.06, 6, C2); g.cyl(0, 0, 0, 0.04, 0.26, 0.26, 8, C2, { flat: true }); }
    else legs(g, hw, hd, h - 0.05, o.leg || 0.03, C2, 0.05);
    if (o.apron) g.box(-hw + 0.03, -hd + 0.03, h - 0.14, hw - 0.03, hd - 0.03, h - 0.05, C2, { cell: 'wood' });
  }
  M.table_small = (g, o, C1, C2) => table(g, 1, 1, 0.75, C1, C2, { pedestal: true });
  M.table_dining = (g, o, C1, C2) => table(g, 2, 1, 0.75, C1, C2, { apron: true });
  M.table_dining_lux = (g, o, C1, C2) => { table(g, 2, 1, 0.76, C1, C2, { apron: true, leg: 0.05 }); };
  M.table_coffee = (g, o, C1, C2) => { table(g, 2, 1, 0.4, C1, C2, { apron: true }); g.box(-0.8, -0.3, 0.1, 0.8, 0.3, 0.13, mulCol(C1, 0.9), { cell: 'wood' }); };
  M.table_end = (g, o, C1, C2) => { g.box(-0.3, -0.3, 0, 0.3, 0.3, 0.6, C1, { cell: 'wood' }); g.box(-0.26, 0.3, 0.38, 0.26, 0.32, 0.54, C2, { cell: 'wood' }); g.box(-0.04, 0.32, 0.44, 0.04, 0.35, 0.48, BRASS); };
  M.desk = (g, o, C1, C2) => { table(g, 2, 1, 0.75, C1, C2, {}); g.box(0.35, -0.38, 0.1, 0.9, 0.38, 0.7, C2, { cell: 'wood' }); for (let i = 0; i < 3; i++) g.box(0.4, 0.38, 0.14 + i * 0.18, 0.85, 0.4, 0.28 + i * 0.18, mulCol(C2, 1.08), { cell: 'wood' }); };
  M.desk_lux = (g, o, C1, C2) => { g.box(-0.94, -0.4, 0.7, 0.94, 0.42, 0.76, C1, { cell: 'wood' }); g.box(-0.94, -0.38, 0, -0.4, 0.4, 0.7, C1, { cell: 'wood' }); g.box(0.4, -0.38, 0, 0.94, 0.4, 0.7, C1, { cell: 'wood' }); g.box(-0.4, 0.3, 0.3, 0.4, 0.34, 0.7, C1, { cell: 'wood' }); for (const x of [-0.67, 0.67]) for (let i = 0; i < 3; i++) g.box(x - 0.2, 0.4, 0.08 + i * 0.2, x + 0.2, 0.42, 0.24 + i * 0.2, mulCol(C1, 1.1), { cell: 'wood' }); };
  M.dresser = (g, o, C1, C2) => { g.box(-0.45, -0.3, 0.05, 0.45, 0.3, 1.0, C1, { cell: 'wood' }); for (let i = 0; i < 4; i++) { g.box(-0.4, 0.3, 0.1 + i * 0.22, 0.4, 0.32, 0.28 + i * 0.22, mulCol(C1, 1.1), { cell: 'wood' }); g.box(-0.05, 0.32, 0.17 + i * 0.22, 0.05, 0.35, 0.21 + i * 0.22, C2); } };
  function shelf(g, w, C1, C2, h, lux) {
    const hw = w / 2 - 0.04;
    g.box(-hw, -0.34, 0, hw, -0.26, h, C1, { cell: 'wood' });
    g.box(-hw, -0.34, 0, -hw + 0.06, 0.2, h, C1, { cell: 'wood' });
    g.box(hw - 0.06, -0.34, 0, hw, 0.2, h, C1, { cell: 'wood' });
    g.box(-hw, -0.34, h - 0.05, hw, 0.24, h, C1, { cell: 'wood' });
    for (let i = 0; i < 4; i++) g.box(-hw + 0.06, -0.3, 0.05 + i * (h - 0.1) / 4, hw - 0.06, 0.18, 0.08 + i * (h - 0.1) / 4, C1, { cell: 'wood' });
    g.panel(-hw + 0.06, hw - 0.06, 0.08, h - 0.05, 0.1, WHITE, { cell: 'books' });
    if (lux) { g.box(-hw - 0.02, -0.36, h, hw + 0.02, 0.28, h + 0.1, C2); g.box(-hw, 0.2, 0, hw, 0.26, 0.08, C2); }
  }
  M.bookshelf = (g, o, C1, C2) => shelf(g, 1, C1, C2, 1.9, false);
  M.bookshelf_lux = (g, o, C1, C2) => shelf(g, 2, C1, C2, 2.2, true);

  M.fridge = (g, o, C1, C2) => { g.box(-0.42, -0.4, 0.02, 0.42, 0.38, 1.85, C1, { side: mulCol(C1, 0.96) }); g.box(-0.4, 0.38, 1.2, 0.4, 0.42, 1.82, mulCol(C1, 1.03)); g.box(-0.4, 0.38, 0.06, 0.4, 0.42, 1.17, mulCol(C1, 1.03)); g.box(0.28, 0.42, 1.3, 0.32, 0.46, 1.6, C2); g.box(0.28, 0.42, 0.7, 0.32, 0.46, 1.05, C2); };
  M.fridge_lux = (g, o, C1, C2) => { g.box(-0.46, -0.4, 0.02, 0.46, 0.38, 1.95, C1, { cell: 'metal' }); g.box(-0.44, 0.38, 0.06, -0.01, 0.42, 1.92, mulCol(C1, 1.05), { cell: 'metal' }); g.box(0.01, 0.38, 0.06, 0.44, 0.42, 1.92, mulCol(C1, 1.05), { cell: 'metal' }); g.box(-0.06, 0.42, 0.9, -0.03, 0.47, 1.5, C2); g.box(0.03, 0.42, 0.9, 0.06, 0.47, 1.5, C2); g.box(-0.36, 0.42, 1.2, -0.12, 0.44, 1.45, BLACK, { e: 0.3 }); };
  function stove(g, C1, C2, st, lux) {
    g.box(-0.48, -0.44, 0.04, 0.48, 0.44, 0.9, C1, { top: 'stove_top', topc: WHITE });
    g.box(-0.4, 0.44, 0.12, 0.4, 0.46, 0.66, C2, { e: 0 });
    g.box(-0.34, 0.46, 0.2, 0.34, 0.47, 0.56, BLACK, { e: st && st.cooking ? 0.45 : 0 });
    g.box(-0.3, 0.46, 0.66, 0.3, 0.5, 0.7, CHROME);
    g.box(-0.48, -0.46, 0.9, 0.48, -0.36, lux ? 1.2 : 1.05, C2);
    for (let i = 0; i < 4; i++) g.cyl(-0.3 + i * 0.2, 0.44, 0.78, 0.8, 0.03, 0.03, 6, BLACK, { flat: true });
    if (st && st.cooking) { g.cyl(-0.2, -0.18, 0.9, 1.0, 0.13, 0.12, 8, DARK, { top: 'white', topc: [0.9, 0.7, 0.4] }); g.cyl(-0.2, 0.18, 0.9, 0.91, 0.14, 0.14, 8, [1, 0.45, 0.1], { e: 1 }); }
  }
  M.stove = (g, o, C1, C2, st) => stove(g, C1, C2, st, false);
  M.stove_lux = (g, o, C1, C2, st) => stove(g, C1, C2, st, true);
  M.coffee = (g, o, C1, C2) => { const b = 0; g.box(-0.14, -0.1, b, 0.14, 0.14, b + 0.34, C1); g.box(-0.08, 0.14, b + 0.2, 0.08, 0.22, b + 0.3, C1); g.cyl(0, 0.16, b, b + 0.08, 0.05, 0.05, 6, WHITE); g.cyl(0.08, -0.05, b + 0.34, b + 0.38, 0.03, 0.03, 5, C2); };
  M.trash_indoor = (g, o, C1, C2, st) => { g.cyl(0, 0, 0, 0.5, 0.2, 0.22, 10, C1, { cell: 'metal', top: 'white', topc: C2 }); g.cyl(0, 0, 0.5, 0.54, 0.23, 0.2, 10, C2); if (st && st.fill >= 4) g.sphere(0, 0, 0.58, 0.16, 0.16, 0.1, 6, 3, [0.3, 0.28, 0.24]); };
  M.grill = (g, o, C1, C2) => { for (const [x, y] of [[-0.25, -0.25], [0.25, -0.25], [0, 0.28]]) g.beam([x, y, 0], [x * 0.3, y * 0.3, 0.6], 0.02, DARK); g.sphere(0, 0, 0.72, 0.3, 0.3, 0.2, 10, 3, C1, { lat0: Math.PI / 2, lat1: Math.PI }); g.cyl(0, 0, 0.72, 0.74, 0.3, 0.3, 10, C1, { top: 'grill_top', topc: WHITE }); g.sphere(0, -0.02, 0.76, 0.29, 0.29, 0.22, 10, 3, C2, { lat0: 0, lat1: 1.2 }); g.box(-0.04, 0.2, 0.9, 0.04, 0.3, 0.95, BLACK); };
  M.park_grill = M.grill;

  M.toilet = (g, o, C1, C2) => { g.cyl(0, 0.08, 0, 0.38, 0.16, 0.2, 10, C1, { ry0: 0.2, ry1: 0.25 }); g.cyl(0, 0.08, 0.38, 0.42, 0.2, 0.21, 10, mulCol(C1, 1.04), { ry0: 0.26, ry1: 0.26 }); g.box(-0.2, -0.38, 0.35, 0.2, -0.2, 0.78, C1); g.box(-0.21, -0.39, 0.78, 0.21, -0.19, 0.81, mulCol(C1, 1.05)); g.box(0.1, -0.2, 0.7, 0.16, -0.18, 0.73, C2); };
  M.toilet_lux = (g, o, C1, C2) => { M.toilet(g, o, C1, C2); g.box(-0.22, -0.42, 0.81, 0.22, -0.2, 0.86, C2); g.cyl(0, -0.3, 0.86, 0.95, 0.04, 0.02, 6, C2); };
  M.shower = (g, o, C1, C2, st) => {
    g.box(-0.46, -0.46, 0, 0.46, 0.46, 0.12, WHITE);
    g.box(-0.48, -0.48, 0, 0.48, -0.42, 2.1, C1, { cell: 'white' });
    g.box(-0.48, -0.48, 0, -0.42, 0.48, 2.1, C1);
    g.box(0.42, -0.48, 0, 0.48, 0.48, 2.1, C1);
    g.box(-0.48, 0.42, 2.0, 0.48, 0.48, 2.1, C2);
    g.box(-0.48, 0.42, 0, 0.48, 0.48, 0.12, C2);
    g.cyl(0, -0.36, 1.8, 1.86, 0.08, 0.05, 6, C2);
    g.beam([0, -0.44, 1.9], [0, -0.36, 1.84], 0.015, C2);
  };
  M.bathtub = (g, o, C1, C2, st) => {
    g.box(-0.96, -0.46, 0, 0.96, 0.46, 0.5, C1);
    g.box(-0.86, -0.36, 0.5, 0.86, 0.36, 0.505, st && st.water ? [0.55, 0.78, 0.92] : [0.82, 0.84, 0.86], { e: st && st.water ? 0.25 : 0 });
    g.box(-0.96, -0.46, 0.5, 0.96, -0.36, 0.56, mulCol(C1, 1.04)); g.box(-0.96, 0.36, 0.5, 0.96, 0.46, 0.56, mulCol(C1, 1.04));
    g.box(-0.96, -0.36, 0.5, -0.86, 0.36, 0.56, mulCol(C1, 1.04)); g.box(0.86, -0.36, 0.5, 0.96, 0.36, 0.56, mulCol(C1, 1.04));
    g.cyl(-0.9, 0, 0.56, 0.72, 0.02, 0.02, 5, C2); g.box(-0.92, -0.02, 0.7, -0.8, 0.02, 0.73, C2);
  };
  M.sink_bath = (g, o, C1, C2) => { g.cyl(0, 0, 0, 0.7, 0.08, 0.06, 8, C1); g.cyl(0, 0.04, 0.7, 0.86, 0.14, 0.26, 10, C1, { ry0: 0.1, ry1: 0.2, top: 'sink_top', topc: WHITE }); g.cyl(0, -0.16, 0.86, 1.0, 0.015, 0.015, 5, C2); g.box(-0.015, -0.16, 0.97, 0.015, -0.04, 1.0, C2); };
  M.mirror = (g, o, C1, C2) => { const y = -0.46; g.box(-0.34, y, 1.1, 0.34, y + 0.04, 1.9, C2, { cell: 'wood' }); g.box(-0.3, y + 0.04, 1.14, 0.3, y + 0.05, 1.86, C1, { e: 0.35, cell: 'metal' }); };

  function tvSet(g, st, x0, x1, z0, z1, y, C1, frame) {
    g.box(x0 - frame, y - 0.02, z0 - frame, x1 + frame, y + 0.02, z1 + frame, C1);
    const on = st && st.on;
    g.panel(x0, x1, z0, z1, y + 0.025, WHITE, { cell: on ? 'screen_' + ((st.flick || 0) % 4) : 'screen_off', e: on ? 0.9 : 0 });
  }
  M.tv_cheap = (g, o, C1, C2, st) => { legs(g, 0.3, 0.2, 0.45, 0.02, DARK, 0.03); g.box(-0.36, -0.28, 0.45, 0.36, 0.28, 0.98, C1, { cell: 'wood' }); tvSet(g, st, -0.26, 0.2, 0.52, 0.9, 0.28, C1, 0.01); for (let i = 0; i < 3; i++) g.cyl(0.28, 0.29, 0.6 + i * 0.1, 0.62 + i * 0.1, 0.02, 0.02, 5, BLACK); g.beam([0, 0, 0.98], [-0.15, -0.05, 1.3], 0.006, CHROME); g.beam([0, 0, 0.98], [0.15, -0.05, 1.3], 0.006, CHROME); };
  M.tv_mid = (g, o, C1, C2, st) => { g.box(-0.44, -0.34, 0, 0.44, 0.34, 0.5, C2, { cell: 'wood' }); g.box(-0.44, -0.3, 0.5, 0.44, 0.24, 1.22, C1); tvSet(g, st, -0.36, 0.36, 0.58, 1.14, 0.25, C1, 0.02); };
  M.tv_lux = (g, o, C1, C2, st) => { g.box(-0.9, -0.3, 0, 0.9, 0.3, 0.4, C2, { cell: 'metal' }); g.box(-0.1, -0.1, 0.4, 0.1, 0.05, 0.6, C1); g.box(-0.85, -0.06, 0.6, 0.85, 0.04, 1.55, C1); tvSet(g, st, -0.8, 0.8, 0.65, 1.5, 0.045, C1, 0.0); for (const x of [-0.8, 0.8]) g.box(x - 0.08, -0.2, 0.4, x + 0.08, 0, 1.1, BLACK); };
  function computer(g, st, C1, C2, lux) {
    const b = 0;
    g.box(-0.2, -0.24, b, 0.2, 0.08, b + 0.06, C1);
    g.box(-0.22, -0.2, b + 0.06, 0.22, lux ? 0.02 : 0.12, b + 0.42, C1);
    g.panel(-0.18, 0.18, b + 0.1, b + 0.38, lux ? 0.025 : 0.125, WHITE, { cell: st && st.on ? 'pc_screen' : 'screen_off', e: st && st.on ? 0.85 : 0 });
    g.box(-0.24, 0.16, b, 0.24, 0.34, b + 0.02, WHITE, { top: 'keyboard' });
    g.box(0.3, 0.2, b, 0.36, 0.28, b + 0.02, C1);
    if (!lux) g.box(-0.46, -0.3, b, -0.26, 0.2, b + 0.44, C1, { front: C1 });
    else g.box(-0.46, -0.3, b, -0.3, 0.2, b + 0.5, C2);
  }
  M.computer = (g, o, C1, C2, st) => computer(g, st, C1, C2, false);
  M.computer_lux = (g, o, C1, C2, st) => computer(g, st, C1, C2, true);
  M.stereo = (g, o, C1, C2, st) => { g.box(-0.3, -0.18, 0, 0.3, 0.18, 0.3, C1); for (const x of [-0.18, 0.18]) { g.cyl(x, 0.185, 0.15, 0.16, 0.09, 0.09, 10, BLACK, { flat: true }); } g.box(-0.08, 0.18, 0.18, 0.08, 0.19, 0.26, C2, { e: st && st.play ? 0.8 : 0 }); g.box(-0.25, -0.02, 0.3, 0.25, 0.02, 0.33, C2); };
  M.stereo_lux = (g, o, C1, C2, st) => { for (const x of [-0.36, 0.36]) { g.box(x - 0.12, -0.14, 0, x + 0.12, 0.14, 1.0, C1); g.cyl(x, 0.145, 0.3, 0.31, 0.08, 0.08, 10, DARK, { flat: true }); g.cyl(x, 0.145, 0.7, 0.71, 0.06, 0.06, 10, DARK, { flat: true }); } g.box(-0.2, -0.18, 0.1, 0.2, 0.18, 0.5, C2); g.box(-0.14, 0.18, 0.3, 0.14, 0.19, 0.4, BLACK, { e: st && st.play ? 0.9 : 0.2 }); };
  M.alarm_smoke = (g) => { g.cyl(0, -0.44, 2.5, 2.54, 0.09, 0.09, 8, WHITE, { flat: true }); g.cyl(0, -0.44, 2.54, 2.55, 0.02, 0.02, 5, [0.9, 0.1, 0.1], { e: 1 }); };
  M.alarm_burglar = (g) => { g.box(-0.1, -0.48, 1.4, 0.1, -0.44, 1.64, DARK); g.box(-0.06, -0.44, 1.48, 0.06, -0.43, 1.58, [0.2, 0.9, 0.3], { e: 1 }); };

  function shade(g, z0, z1, r0, r1, C1, on) { g.cyl(0, 0, z0, z1, r0, r1, 10, C1, { cell: 'fabric', e: on ? 0.8 : 0, noTop: true }); }
  M.lamp_table = (g, o, C1, C2, st, env) => { const b = 0; g.cyl(0, 0, b, b + 0.05, 0.1, 0.1, 8, C2); g.cyl(0, 0, b + 0.05, b + 0.28, 0.03, 0.03, 6, C2); shade(g, b + 0.26, b + 0.46, 0.17, 0.1, C1, env && env.lampOn); };
  M.lamp_floor = (g, o, C1, C2, st, env) => { g.cyl(0, 0, 0, 0.04, 0.16, 0.16, 8, C2); g.cyl(0, 0, 0.04, 1.4, 0.02, 0.02, 6, C2); shade(g, 1.35, 1.65, 0.24, 0.14, C1, env && env.lampOn); };
  M.lamp_ceiling = (g, o, C1, C2, st, env) => { g.cyl(0, 0, 2.62, 2.95, 0.012, 0.012, 4, C2); g.sphere(0, 0, 2.62, 0.22, 0.22, 0.14, 10, 4, C1, { lat0: Math.PI / 2, lat1: Math.PI, e: env && env.lampOn ? 0.85 : 0 }); g.cyl(0, 0, 2.6, 2.64, 0.24, 0.24, 10, C2, { flat: true }); };
  M.lamp_wall = (g, o, C1, C2, st, env) => { g.box(-0.05, -0.49, 1.7, 0.05, -0.45, 1.9, C2); g.beam([0, -0.47, 1.8], [0, -0.3, 1.86], 0.012, C2); shade(g, 1.86, 2.0, 0.08, 0.1, C1, env && env.lampOn); };
  M.lamp_garden = (g, o, C1, C2, st, env) => { g.cyl(0, 0, 0, 0.1, 0.1, 0.08, 6, C1); g.cyl(0, 0, 0.1, 1.1, 0.03, 0.03, 6, C1); g.box(-0.1, -0.1, 1.1, 0.1, 0.1, 1.3, C2, { e: env && env.lampOn ? 0.9 : 0.1 }); g.cyl(0, 0, 1.3, 1.4, 0.14, 0.02, 4, C1, { flat: true }); };
  M.streetlamp = (g, o, C1, C2, st, env) => { g.cyl(0, 0, 0, 0.2, 0.08, 0.06, 8, C1); g.cyl(0, 0, 0.2, 3.2, 0.04, 0.035, 6, C1); g.beam([0, 0, 3.1], [0.35, 0, 3.3], 0.025, C1); g.sphere(0.35, 0, 3.2, 0.13, 0.13, 0.13, 8, 4, C2, { e: env && env.night ? 1 : 0.15 }); };

  function pot(g, c, h, r) { g.cyl(0, 0, 0, h, r * 0.75, r, 10, c); g.cyl(0, 0, h - 0.03, h - 0.02, r * 0.95, r * 0.95, 10, [0.3, 0.2, 0.12], { flat: true }); }
  M.plant_small = (g, o, C1, C2) => { pot(g, C1, 0.3, 0.16); for (let i = 0; i < 5; i++) g.sphere(Math.cos(i * 1.3) * 0.1, Math.sin(i * 1.3) * 0.1, 0.5 + (i % 3) * 0.12, 0.13, 0.13, 0.11, 6, 4, mulCol(C2, 0.85 + i * 0.05), { cell: 'foliage' }); };
  M.plant_big = (g, o, C1, C2) => { pot(g, C1, 0.45, 0.25); g.cyl(0, 0, 0.45, 1.3, 0.04, 0.03, 5, [0.45, 0.33, 0.2]); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; g.beam([0, 0, 1.3], [Math.cos(a) * 0.55, Math.sin(a) * 0.55, 1.05 + (i % 2) * 0.2], 0.05, mulCol(C2, 0.9 + (i % 3) * 0.08)); } g.sphere(0, 0, 1.35, 0.14, 0.14, 0.12, 6, 3, C2, { cell: 'foliage' }); };
  M.flowers = (g, o, C1, C2) => { const b = 0; g.cyl(0, 0, b, b + 0.22, 0.06, 0.09, 8, C1, { cell: 'metal' }); for (let i = 0; i < 7; i++) { const a = i * 0.9; g.beam([0, 0, b + 0.2], [Math.cos(a) * 0.09, Math.sin(a) * 0.09, b + 0.4], 0.006, GREEN); g.sphere(Math.cos(a) * 0.09, Math.sin(a) * 0.09, b + 0.41, 0.04, 0.04, 0.03, 5, 3, C2); } };
  function frame(g, w, h, z0, C1, cell, depth) { const y = -0.47; g.box(-w / 2, y, z0, w / 2, y + (depth || 0.05), z0 + h, C1, { cell: 'wood' }); g.panel(-w / 2 + 0.05, w / 2 - 0.05, z0 + 0.05, z0 + h - 0.05, y + (depth || 0.05) + 0.003, WHITE, { cell }); }
  M.painting_cheap = (g, o, C1, C2) => frame(g, 0.6, 0.45, 1.35, C1, 'art0_0');
  M.painting_mid = (g, o, C1, C2) => frame(g, 0.7, 0.55, 1.3, C1, 'art1_0');
  M.painting_lux = (g, o, C1, C2) => frame(g, 1.6, 0.9, 1.2, C1, 'art0_1', 0.07);
  M.painting_own = (g, o, C1, C2, st) => frame(g, 0.66, 0.52, 1.32, [0.55, 0.4, 0.25], 'art' + ((st && st.art) || 0) + '_' + (((st && st.seed) || 0) % 2));
  M.sculpture = (g, o, C1, C2) => { g.box(-0.22, -0.22, 0, 0.22, 0.22, 0.9, C2, { cell: 'marble' }); for (let i = 0; i < 5; i++) { const a = i * 0.7; g.beam([Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0.9 + i * 0.18], [Math.cos(a + 1.3) * 0.18, Math.sin(a + 1.3) * 0.18, 1.08 + i * 0.18], 0.06, C1); } g.sphere(0, 0, 1.95, 0.12, 0.12, 0.12, 8, 5, C1); };
  M.rug_small = (g, o, C1, C2) => g.box(-0.95, -0.45, 0.004, 0.95, 0.45, 0.016, mixCol(C1, C2, 0.2), { cell: 'rug_plain' });
  M.rug_big = (g, o, C1, C2) => g.box(-1.45, -0.95, 0.004, 1.45, 0.95, 0.016, C1, { cell: 'rug_persian', top: 'rug_persian' });
  M.clock_grand = (g, o, C1, C2) => { g.box(-0.24, -0.2, 0, 0.24, 0.2, 0.2, C1, { cell: 'wood' }); g.box(-0.18, -0.16, 0.2, 0.18, 0.16, 1.5, C1, { cell: 'wood' }); g.box(-0.1, 0.16, 0.5, 0.1, 0.17, 1.2, [0.2, 0.15, 0.1]); g.cyl(0, 0.17, 0.6, 0.62, 0.06, 0.06, 8, C2, { flat: true }); g.box(-0.24, -0.2, 1.5, 0.24, 0.2, 1.98, C1, { cell: 'wood' }); g.panel(-0.18, 0.18, 1.56, 1.92, 0.205, WHITE, { cell: 'clock' }); g.box(-0.26, -0.22, 1.98, 0.26, 0.22, 2.06, C2); };
  M.aquarium = (g, o, C1, C2) => { g.box(-0.4, -0.28, 0, 0.4, 0.28, 0.7, C1, { cell: 'wood' }); g.box(-0.38, -0.25, 0.7, 0.38, 0.25, 1.2, C2, { e: 0.35 }); g.box(-0.4, -0.27, 1.2, 0.4, 0.27, 1.25, C1); for (let i = 0; i < 4; i++) g.sphere(-0.2 + i * 0.13, 0.252, 0.85 + (i % 2) * 0.15, 0.03, 0.01, 0.02, 5, 3, [0.95, 0.5 + i * 0.1, 0.1], { e: 0.6 }); };
  M.flamingo = (g, o, C1, C2) => { g.beam([0, 0, 0], [0, 0, 0.35], 0.008, C2); g.beam([0.04, 0, 0], [0.03, 0, 0.35], 0.008, C2); g.sphere(0, 0, 0.45, 0.08, 0.14, 0.08, 8, 5, C1); g.beam([0, 0.1, 0.48], [0, 0.14, 0.72], 0.02, C1); g.sphere(0, 0.14, 0.74, 0.04, 0.05, 0.04, 6, 4, C1); g.beam([0, 0.18, 0.74], [0, 0.23, 0.69], 0.012, BLACK); };
  M.bush = (g, o, C1, C2) => { g.sphere(0, 0, 0.34, 0.42, 0.42, 0.36, 10, 6, C1, { cell: 'foliage' }); g.sphere(0.12, -0.1, 0.55, 0.26, 0.26, 0.22, 8, 5, mulCol(C1, 1.1), { cell: 'foliage' }); };
  M.flowerbed = (g, o, C1, C2) => { g.box(-0.45, -0.45, 0, 0.45, 0.45, 0.14, C2, { cell: 'wood', top: 'dirt_plot', topc: [0.9, 0.85, 0.8] }); for (let i = 0; i < 9; i++) { const x = -0.3 + (i % 3) * 0.3, y = -0.3 + Math.floor(i / 3) * 0.3; g.sphere(x, y, 0.24, 0.1, 0.1, 0.1, 6, 3, GREEN, { cell: 'foliage' }); g.sphere(x, y, 0.33, 0.05, 0.05, 0.04, 5, 3, i % 2 ? C1 : WHITE); } };
  M.tree_small = (g, o, C1, C2) => { g.cyl(0, 0, 0, 0.9, 0.06, 0.04, 6, C1, { cell: 'bark' }); g.sphere(0, 0, 1.25, 0.5, 0.5, 0.52, 10, 6, C2, { cell: 'foliage' }); };

  M.chess = (g, o, C1, C2) => {
    table(g, 1, 1, 0.72, C1, C2, { pedestal: true });
    g.panel(-0.3, 0.3, 0, 0, 0, WHITE);
    g.box(-0.3, -0.3, 0.72, 0.3, 0.3, 0.73, WHITE, { top: 'chess', noFront: true });
    for (const x of [-1, 1]) { g.cyl(x, 0, 0, 0.44, 0.04, 0.04, 6, C2); g.cyl(x, 0, 0.42, 0.46, 0.2, 0.2, 10, C1, { cell: 'wood' }); }
    for (let i = 0; i < 6; i++) g.cyl(-0.2 + (i % 3) * 0.2, i < 3 ? -0.22 : 0.22, 0.73, 0.8, 0.02, 0.015, 5, i < 3 ? WHITE : BLACK);
  };
  M.easel = (g, o, C1, C2, st) => {
    g.beam([-0.3, -0.1, 0], [-0.05, -0.05, 1.7], 0.025, C1);
    g.beam([0.3, -0.1, 0], [0.05, -0.05, 1.7], 0.025, C1);
    g.beam([0, -0.45, 0], [0, -0.05, 1.6], 0.025, C1);
    g.box(-0.36, -0.08, 0.72, 0.36, 0.04, 0.76, C1);
    g.box(-0.34, -0.06, 0.76, 0.34, 0.0, 1.46, WHITE);
    if (st && st.work) g.panel(-0.3, 0.3 * Math.min(1, st.work.p * 1.2) * 2 - 0.3, 0.8, 1.42, 0.005, WHITE, { cell: 'art' + ((st.work.by || 0) % 4) + '_0' });
  };
  M.guitar = (g, o, C1, C2) => { g.beam([-0.15, -0.1, 0], [0, 0, 0.5], 0.02, BLACK); g.beam([0.15, -0.1, 0], [0, 0, 0.5], 0.02, BLACK); g.sphere(0, 0.05, 0.3, 0.17, 0.05, 0.19, 10, 5, C1); g.sphere(0, 0.05, 0.55, 0.13, 0.05, 0.13, 10, 5, C1); g.cyl(0, 0.1, 0.42, 0.43, 0.04, 0.04, 8, BLACK, { flat: true }); g.box(-0.025, 0.04, 0.62, 0.025, 0.08, 1.1, C2); g.box(-0.04, 0.03, 1.1, 0.04, 0.08, 1.2, C2); };
  M.telescope = (g, o, C1, C2) => { for (const a of [0, 2.1, 4.2]) g.beam([Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0], [0, 0, 1.0], 0.02, C1); g.cyl(0, 0, 0.98, 1.08, 0.06, 0.06, 6, C1); g.beam([0, -0.35, 1.0], [0, 0.45, 1.5], 0.08, C2); g.beam([0, 0.45, 1.5], [0, 0.52, 1.54], 0.1, C1); };
  M.treadmill = (g, o, C1, C2, st) => { g.box(-0.36, -0.9, 0, 0.36, 0.7, 0.16, C1); g.box(-0.3, -0.86, 0.16, 0.3, 0.66, 0.18, BLACK); for (const x of [-0.33, 0.33]) g.beam([x, 0.6, 0.16], [x * 0.9, 0.7, 1.2], 0.03, C2); g.box(-0.36, 0.62, 1.1, 0.36, 0.8, 1.3, C1); g.box(-0.2, 0.64, 1.3, 0.2, 0.7, 1.42, BLACK, { e: st && st.on ? 0.8 : 0.1 }); };
  M.weights = (g, o, C1, C2) => { g.box(-0.18, -0.8, 0.36, 0.18, 0.4, 0.46, C1, { cell: 'fabric' }); legs(g, 0.18, 0.7, 0.36, 0.03, C2, 0.02); for (const x of [-0.4, 0.4]) g.beam([x, 0.3, 0], [x, 0.3, 1.25], 0.03, C2); g.beam([-0.62, 0.3, 1.05], [0.62, 0.3, 1.05], 0.02, CHROME); for (const x of [-0.55, 0.55]) g.cyl(x, 0.3, 0.85, 1.25, 0.2, 0.2, 10, BLACK, { flat: true }); };
  M.toybox = (g, o, C1, C2) => { g.box(-0.4, -0.3, 0, 0.4, 0.3, 0.45, C1, { cell: 'wood' }); g.box(-0.42, -0.32, 0.45, 0.42, 0.32, 0.5, C2); g.box(-0.3, 0.3, 0.1, -0.1, 0.32, 0.3, [0.9, 0.2, 0.2]); g.box(0.1, 0.3, 0.1, 0.3, 0.32, 0.3, [0.2, 0.5, 0.9]); g.sphere(0.2, -0.1, 0.58, 0.08, 0.08, 0.08, 6, 4, [0.95, 0.8, 0.2]); };
  M.swingset = (g, o, C1, C2) => { for (const x of [-0.9, 0.9]) { g.beam([x, -0.7, 0], [x, 0, 2.2], 0.04, C1); g.beam([x, 0.7, 0], [x, 0, 2.2], 0.04, C1); } g.beam([-0.95, 0, 2.2], [0.95, 0, 2.2], 0.05, C1); for (const x of [-0.5, 0.5]) { g.beam([x - 0.15, 0, 2.2], [x - 0.15, 0, 0.55], 0.008, CHROME); g.beam([x + 0.15, 0, 2.2], [x + 0.15, 0, 0.55], 0.008, CHROME); g.box(x - 0.2, -0.1, 0.5, x + 0.2, 0.1, 0.55, C2); } };
  M.climber = (g, o, C1, C2) => { for (const [x, y] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) g.cyl(x, y, 0, 1.6, 0.05, 0.05, 6, C1); g.box(-0.85, -0.85, 1.0, 0.85, 0.85, 1.08, C2); g.cyl(0, 0, 1.6, 2.2, 1.2, 0.02, 4, C1, { flat: true, a0: Math.PI / 4, a1: Math.PI * 2 + Math.PI / 4 }); g.quad([0.85, -0.5, 1.05], [0.85, 0.5, 1.05], [1.0 + 0.9, 0.5, 0.05], [1.0 + 0.9, -0.5, 0.05], [0.95, 0.8, 0.2]); };
  function stairsModel(g, C1, C2, open) {
    const H = S.WALL_H, n = 12, y0 = -1.5, dy = 3 / n, dz = H / n;
    for (let i = 0; i < n; i++) {
      const y = y0 + i * dy;
      if (open) g.box(-0.44, y, (i + 1) * dz - 0.05, 0.44, y + dy + 0.03, (i + 1) * dz, C1);
      else g.box(-0.46, y, 0, 0.46, y + dy, (i + 1) * dz, C1, { cell: 'wood' });
    }
    if (open) for (const x of [-0.46, 0.46]) g.beam([x, -1.5, 0], [x, 1.5, H], 0.035, C2);
    for (const x of [-0.47, 0.47]) {
      for (const y of [-1.35, 0, 1.35]) { const z = (y - y0) / 3 * H; g.box(x - 0.025, y - 0.025, z, x + 0.025, y + 0.025, z + 0.92, C2); }
      g.beam([x, -1.42, 0.92], [x, 1.42, H + 0.86], 0.03, C2);
    }
    return H + 0.95;
  }
  M.stairs_wood = (g, o, C1, C2) => stairsModel(g, C1, C2, false);
  M.stairs_metal = (g, o, C1, C2) => stairsModel(g, C1, C2, true);
  M.elevator = (g, o, C1, C2, st, env) => {
    const H = S.WALL_H;
    const lv = (o && o.lv) || 0, top = Math.max(lv, (st && st.top) || lv);
    const vis = env && env.maxLv !== undefined ? Math.max(lv, Math.min(top, env.maxLv)) : top;
    const n = vis - lv + 1;
    g.box(-0.48, -0.48, 0, 0.48, 0.48, n * H - 0.04, C1);
    for (let k = 0; k < n; k++) {
      const z = k * H;
      g.box(-0.38, 0.48, z + 0.02, 0.38, 0.5, z + 2.24, C2);
      g.box(-0.34, 0.495, z + 0.05, -0.01, 0.525, z + 2.18, CHROME);
      g.box(0.01, 0.495, z + 0.05, 0.34, 0.525, z + 2.18, CHROME);
      g.box(0.4, 0.48, z + 1.05, 0.46, 0.53, z + 1.22, [0.95, 0.8, 0.3], { e: 0.6 });
      g.box(-0.18, 0.49, z + 2.28, 0.18, 0.525, z + 2.44, [0.12, 0.12, 0.16]);
      g.box(-0.05, 0.52, z + 2.31, 0.05, 0.53, z + 2.41, [1, 0.5, 0.2], { e: 0.9 });
    }
    g.box(-0.5, -0.5, n * H - 0.04, 0.5, 0.5, n * H + 0.06, C2);
    return n * H + 0.06;
  };
  M.pool_ladder = (g, o, C1, C2) => {
    for (const x of [-0.24, 0.24]) {
      g.beam([x, -0.38, -0.75], [x, -0.38, 0.52], 0.028, C2);
      g.beam([x, -0.38, 0.52], [x, -0.5, 0.68], 0.028, C2);
      g.beam([x, -0.5, 0.68], [x, -0.64, 0.62], 0.028, C2);
      g.beam([x, -0.64, 0.62], [x, -0.72, 0.03], 0.028, C2);
    }
    for (const z of [-0.6, -0.35, -0.1]) g.box(-0.24, -0.42, z - 0.025, 0.24, -0.3, z + 0.025, C1);
    return 0.7;
  };
  M.teleporter = (g, o, C1, C2) => { g.cyl(0, 0, 0, 0.12, 0.45, 0.42, 12, C1, { cell: 'metal' }); g.disk(0, 0, 0.121, 0.36, 0.36, 12, C2, { e: 0.9 }); for (let i = 0; i < 3; i++) g.beam([Math.cos(i * 2.1) * 0.4, Math.sin(i * 2.1) * 0.4, 0.1], [Math.cos(i * 2.1) * 0.34, Math.sin(i * 2.1) * 0.34, 2.0], 0.025, C1); g.cyl(0, 0, 1.95, 2.05, 0.42, 0.42, 12, C1, { cell: 'metal' }); };

  M.mailbox = (g, o, C1, C2, st) => { g.box(-0.04, -0.04, 0, 0.04, 0.04, 1.0, [0.4, 0.3, 0.2]); g.box(-0.12, -0.24, 1.0, 0.12, 0.24, 1.18, C1); g.cyl(0, -0.24, 1.18, 1.18, 0.12, 0.12, 8, C1, { a0: 0, a1: Math.PI, noTop: true }); g.sphere(0, 0, 1.18, 0.12, 0.24, 0.1, 8, 3, C1, { lat0: 0, lat1: Math.PI / 2 }); if (st && st.mail) g.box(0.12, -0.05, 1.1, 0.14, 0.02, 1.38, [0.9, 0.15, 0.1]); else g.box(0.12, -0.2, 1.1, 0.14, -0.04, 1.16, [0.9, 0.15, 0.1]); };
  M.trash_can = (g, o, C1, C2) => { g.cyl(0, 0, 0, 0.85, 0.28, 0.3, 10, C1, { cell: 'metal' }); g.cyl(0, 0, 0.85, 0.92, 0.31, 0.3, 10, C2); g.box(-0.08, -0.02, 0.92, 0.08, 0.02, 0.97, C2); };
  M.picnic_table = (g, o, C1, C2) => { g.box(-0.9, -0.4, 0.72, 0.9, 0.4, 0.78, C1, { cell: 'wood_h' }); for (const y of [-0.75, 0.75]) g.box(-0.9, y - 0.15, 0.42, 0.9, y + 0.15, 0.46, C1, { cell: 'wood_h' }); for (const x of [-0.7, 0.7]) { g.beam([x, -0.9, 0], [x, 0.3, 0.74], 0.03, C2); g.beam([x, 0.9, 0], [x, -0.3, 0.74], 0.03, C2); } };
  M.drink_fountain = (g, o, C1, C2) => { g.cyl(0, 0, 0, 0.85, 0.14, 0.12, 8, C1, { cell: 'metal' }); g.cyl(0, 0.05, 0.85, 0.95, 0.2, 0.22, 10, C2, { cell: 'metal' }); g.cyl(0, 0.1, 0.95, 1.0, 0.02, 0.02, 5, C2); };
  M.lifeguard = (g, o, C1, C2) => { for (const [x, y] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) g.beam([x, y, 0], [x * 0.8, y * 0.8, 2.0], 0.05, C1); g.box(-0.6, -0.6, 2.0, 0.6, 0.6, 2.1, C1); g.box(-0.55, -0.55, 2.1, 0.55, -0.45, 2.9, C2); g.box(-0.55, -0.55, 2.1, -0.45, 0.55, 2.9, C1); g.box(0.45, -0.55, 2.1, 0.55, 0.55, 2.9, C1); g.cyl(0, 0, 2.9, 3.3, 0.85, 0.05, 4, C2, { a0: Math.PI / 4, a1: Math.PI * 2.25, flat: true }); for (let i = 0; i < 6; i++) g.box(-0.2, 0.7 + i * 0.12, 0.3 * i + 0.1, 0.2, 0.8 + i * 0.12, 0.3 * i + 0.14, C1); };
  M.tombstone = (g, o, C1, C2) => { g.box(-0.3, -0.12, 0, 0.3, 0.12, 0.08, C2); g.box(-0.22, -0.07, 0.08, 0.22, 0.07, 0.62, C1); g.cyl(0, 0, 0.62, 0.62, 0.22, 0.22, 8, C1, { ry0: 0.07, ry1: 0.07, a0: 0, a1: Math.PI }); g.sphere(0, 0, 0.62, 0.22, 0.07, 0.14, 8, 3, C1, { lat0: 0, lat1: Math.PI / 2 }); g.box(-0.12, 0.071, 0.3, 0.12, 0.075, 0.5, mulCol(C1, 0.7)); };
  M.mausoleum = (g, o, C1, C2) => { g.box(-1.45, -1.45, 0, 1.45, 1.45, 0.25, C2, { cell: 'marble' }); g.box(-1.2, -1.2, 0.25, 1.2, 0.9, 2.4, C1, { cell: 'marble' }); for (const x of [-1.05, -0.45, 0.45, 1.05]) g.cyl(x, 1.15, 0.25, 2.4, 0.1, 0.09, 8, mulCol(C1, 1.1)); g.box(-1.3, -1.3, 2.4, 1.3, 1.35, 2.55, C1, { cell: 'marble' }); g.quad([-1.3, 1.35, 2.55], [1.3, 1.35, 2.55], [0, 1.35, 3.2], [0, 1.35, 3.2], C1); g.quad([1.3, -1.3, 2.55], [-1.3, -1.3, 2.55], [0, -1.3, 3.2], [0, -1.3, 3.2], C1); g.quad([-1.3, -1.3, 2.55], [-1.3, 1.35, 2.55], [0, 1.35, 3.2], [0, -1.3, 3.2], mulCol(C1, 0.9)); g.quad([1.3, 1.35, 2.55], [1.3, -1.3, 2.55], [0, -1.3, 3.2], [0, 1.35, 3.2], mulCol(C1, 0.9)); g.box(-0.4, 0.9, 0.25, 0.4, 0.92, 1.9, [0.15, 0.12, 0.1]); };
  M.fountain = (g, o, C1, C2, st, env) => {
    g.cyl(0, 0, 0, 0.5, 1.45, 1.45, 12, C1, { cell: 'marble', flat: true });
    g.cyl(0, 0, 0.44, 0.46, 1.3, 1.3, 12, C2, { e: 0.25, flat: true });
    g.cyl(0, 0, 0.46, 1.4, 0.35, 0.25, 8, C1, { cell: 'marble' });
    g.cyl(0, 0, 1.4, 1.55, 0.65, 0.7, 10, C1, { cell: 'marble', top: 'white', topc: C2 });
    g.box(-0.2, -0.2, 1.55, 0.2, 0.2, 2.0, [0.4, 0.55, 0.45]);
    const B = [0.35, 0.5, 0.42];
    g.cyl(0, 0, 2.0, 2.9, 0.16, 0.2, 8, B); g.sphere(0, 0, 3.05, 0.14, 0.14, 0.16, 8, 5, B); g.beam([0.12, 0, 2.7], [0.45, 0.1, 3.35], 0.045, B); g.beam([-0.12, 0, 2.7], [-0.22, 0.05, 2.25], 0.045, B);
  };
  M.statue = (g, o, C1, C2) => { g.box(-0.7, -0.7, 0, 0.7, 0.7, 1.4, C2, { cell: 'marble' }); const B = C1; g.cyl(0, 0, 1.4, 2.4, 0.2, 0.24, 8, B); g.sphere(0, 0, 2.6, 0.16, 0.16, 0.18, 8, 5, B); g.beam([0.2, 0, 2.2], [0.55, 0.2, 2.9], 0.05, B); };
  M.lighthouse = (g, o, C1, C2, st, env) => {
    g.cyl(0, 0, 0, 0.3, 1.5, 1.45, 12, [0.6, 0.58, 0.55], { flat: true });
    g.cyl(0, 0, 0.3, 7.5, 1.2, 0.8, 12, WHITE, { cell: 'lh_stripes', flat: false });
    g.cyl(0, 0, 7.5, 7.7, 1.15, 1.15, 12, DARK, { flat: true });
    g.cyl(0, 0, 7.7, 8.6, 0.6, 0.6, 12, [1, 0.95, 0.7], { e: env && env.night ? 1 : 0.3 });
    g.cyl(0, 0, 8.6, 9.3, 0.75, 0.05, 12, C2, { flat: true });
    g.box(-0.3, 1.1, 0.3, 0.3, 1.25, 1.9, [0.3, 0.2, 0.15]);
  };
  M.rock = (g, o, C1, C2) => { g.sphere(0, 0, 0.1, 0.45, 0.4, 0.35, 7, 4, C1, { cell: 'rock', flat: true }); g.sphere(0.2, 0.15, 0.05, 0.25, 0.22, 0.2, 6, 3, C2, { cell: 'rock', flat: true }); };
  M.hydrant = (g, o, C1, C2) => { g.cyl(0, 0, 0, 0.55, 0.1, 0.09, 8, C1); g.sphere(0, 0, 0.55, 0.1, 0.1, 0.08, 8, 3, C1, { lat0: 0, lat1: Math.PI / 2 }); g.beam([-0.16, 0, 0.38], [0.16, 0, 0.38], 0.04, C1); };
  M.parked_car = (g, o, C1, C2) => carModel(g, C1, 'car');
  M.boat = (g, o, C1, C2) => { g.box(-0.4, -0.95, -0.1, 0.4, 0.85, 0.25, C1); g.quad([-0.4, 0.85, 0.25], [0.4, 0.85, 0.25], [0, 1.25, 0.3], [0, 1.25, 0.3], C1); g.quad([-0.4, 0.85, -0.1], [-0.4, 0.85, 0.25], [0, 1.25, 0.3], [0, 1.25, 0.05], mulCol(C1, 0.9)); g.quad([0.4, 0.85, 0.25], [0.4, 0.85, -0.1], [0, 1.25, 0.05], [0, 1.25, 0.3], mulCol(C1, 0.9)); g.box(-0.36, -0.9, 0.2, 0.36, 0.8, 0.24, C2); g.box(-0.3, -0.6, 0.25, 0.3, 0.0, 0.6, WHITE); };

  M.plant_garden = (g, o, C1, C2, st) => {
    g.box(-0.4, -0.4, 0, 0.4, 0.4, 0.08, [0.4, 0.28, 0.18], { top: 'dirt_plot', topc: WHITE });
    if (!st) return;
    const P = S.PLANTS[st.p] || S.PLANTS.tomato;
    const gr = Math.min(1, st.growth || 0);
    const leaf = st.dead ? [0.45, 0.38, 0.2] : st.water < 25 ? [0.5, 0.55, 0.2] : GREEN;
    const fruit = col(P.color);
    if (P.kind === 'tree') {
      g.cyl(0, 0, 0.08, 0.3 + gr * 0.9, 0.04 + gr * 0.04, 0.03, 6, [0.4, 0.28, 0.16], { cell: 'bark' });
      g.sphere(0, 0, 0.5 + gr * 1.0, 0.2 + gr * 0.35, 0.2 + gr * 0.35, 0.2 + gr * 0.32, 8, 5, leaf, { cell: 'foliage' });
      if (gr >= 1 && !st.dead) for (let i = 0; i < 6; i++) g.sphere(Math.cos(i) * 0.4, Math.sin(i) * 0.4, 1.3 + (i % 2) * 0.2, 0.06, 0.06, 0.06, 5, 3, st.p === 'moneytree' ? [0.3, 0.75, 0.3] : fruit);
    } else {
      const h = 0.15 + gr * 0.45;
      for (let i = 0; i < 5; i++) { const a = i * 1.26; g.beam([0, 0, 0.08], [Math.cos(a) * 0.15 * (0.5 + gr), Math.sin(a) * 0.15 * (0.5 + gr), h], 0.012, leaf); g.sphere(Math.cos(a) * 0.15 * (0.5 + gr), Math.sin(a) * 0.15 * (0.5 + gr), h, 0.06 + gr * 0.06, 0.06 + gr * 0.06, 0.04, 5, 3, leaf, { cell: 'foliage' }); }
      if (gr >= 1 && !st.dead) for (let i = 0; i < 4; i++) g.sphere(Math.cos(i * 1.6) * 0.14, Math.sin(i * 1.6) * 0.14, P.kind === 'melon' ? 0.16 : h * 0.8, P.kind === 'melon' ? 0.13 : 0.06, P.kind === 'melon' ? 0.1 : 0.06, P.kind === 'melon' ? 0.09 : 0.06, 6, 4, fruit);
    }
    if (st.weeds > 40) for (let i = 0; i < 3; i++) g.sphere(-0.3 + i * 0.3, 0.3, 0.12, 0.05, 0.05, 0.06, 4, 3, [0.4, 0.55, 0.15]);
  };
  M.collectible = (g, o, C1, C2, st) => {
    const c = st && st.c || '';
    if (c.startsWith('seed:')) { g.sphere(0, 0, 0.05, 0.12, 0.08, 0.05, 6, 3, [0.7, 0.55, 0.3]); g.sphere(0.05, 0.02, 0.1, 0.05, 0.05, 0.05, 5, 3, [0.95, 0.85, 0.3], { e: 0.4 }); return; }
    const d = S.COLLECT[c];
    g.sphere(0, 0, 0.06, 0.16, 0.13, 0.09, 6, 3, [0.5, 0.48, 0.44], { cell: 'rock', flat: true });
    g.sphere(0.05, 0.04, 0.12, 0.07, 0.07, 0.08, 5, 3, d ? col(d.color) : [0.8, 0.2, 0.3], { e: 0.35, flat: true });
  };
  function plateGeo(g, st, dirty, platter) {
    const b = 0;
    const r = platter ? 0.22 : 0.15;
    g.cyl(0, 0, b, b + 0.025, r * 0.85, r, 10, WHITE, { flat: true });
    const fc = st && st.recipe === 'pizza' ? [0.9, 0.6, 0.25] : st && st.recipe === 'salad' ? [0.4, 0.7, 0.3] : st && st.recipe === 'spaghetti' ? [0.9, 0.75, 0.4] : [0.75, 0.45, 0.25];
    if (dirty) { g.disk(0, 0, b + 0.027, r * 0.6, r * 0.5, 7, [0.55, 0.45, 0.3]); return; }
    if (platter && st && st.recipe === 'pizza') { g.box(-0.24, -0.24, b, 0.24, 0.24, b + 0.06, [0.85, 0.8, 0.7]); g.cyl(0, 0, b + 0.06, b + 0.075, 0.2, 0.2, 10, fc, { flat: true }); return; }
    const n = platter ? Math.min(6, (st && st.servings) || 3) : 1;
    for (let i = 0; i < n; i++) g.sphere(n === 1 ? 0 : Math.cos(i) * 0.1, n === 1 ? 0 : Math.sin(i) * 0.1, b + 0.04, 0.08, 0.07, 0.04, 6, 3, fc);
  }
  M.plate = (g, o, C1, C2, st) => plateGeo(g, st, false, false);
  M.platter = (g, o, C1, C2, st) => plateGeo(g, st, false, true);
  M.dirty_plate = (g, o, C1, C2, st) => plateGeo(g, st, true, false);
  M.puddle = (g, o, C1, C2) => { g.disk(0, 0, 0.012, 0.42, 0.34, 10, [0.62, 0.78, 0.92], { e: 0.2 }); g.disk(0.2, 0.15, 0.013, 0.16, 0.12, 8, [0.72, 0.86, 0.96], { e: 0.25 }); };
  M.trash_pile = (g, o, C1, C2) => { for (let i = 0; i < 5; i++) g.sphere(Math.cos(i * 1.7) * 0.22, Math.sin(i * 1.7) * 0.2, 0.06, 0.12, 0.1, 0.08, 5, 3, i % 2 ? [0.3, 0.28, 0.25] : [0.5, 0.42, 0.3], { flat: true }); };
  M.newspaper = (g, o, C1, C2) => g.box(-0.18, -0.12, 0.005, 0.18, 0.12, 0.03, WHITE, { top: 'newspaper' });
  M.fire = () => {};

  function carModel(g, c, kind) {
    const bus = kind === 'bus', truck = kind === 'firetruck', van = kind === 'van';
    const L = bus ? 1.6 : truck ? 1.4 : van ? 1.1 : 0.95, W = bus || truck ? 0.46 : 0.4;
    const body = col(c);
    g.box(-W, -L, 0.18, W, L, 0.55, body, { cell: 'metal' });
    if (bus || van || truck) g.box(-W, -L + (truck ? 0.9 : 0.1), 0.55, W, L - 0.1, bus ? 1.2 : 1.05, body, { cell: 'metal' });
    else { g.box(-W + 0.04, -0.45, 0.55, W - 0.04, 0.35, 0.86, mulCol(body, 0.95)); g.box(-W + 0.05, 0.35, 0.56, W - 0.05, 0.36, 0.83, [0.4, 0.55, 0.7], { e: 0.1 }); g.box(-W + 0.05, -0.46, 0.56, W - 0.05, -0.45, 0.83, [0.4, 0.55, 0.7], { e: 0.1 }); }
    if (bus) for (let i = 0; i < 5; i++) { g.box(W, -L + 0.3 + i * 0.55, 0.7, W + 0.005, -L + 0.7 + i * 0.55, 1.05, [0.35, 0.5, 0.65]); g.box(-W - 0.005, -L + 0.3 + i * 0.55, 0.7, -W, -L + 0.7 + i * 0.55, 1.05, [0.35, 0.5, 0.65]); }
    for (const x of [-W, W]) for (const y of [-L * 0.65, L * 0.65]) g.cyl(x, y, 0.18, 0.19, 0.17, 0.17, 8, BLACK, { flat: true, ry0: 0.17, ry1: 0.17 });
    g.box(-W + 0.05, L, 0.3, -W + 0.15, L + 0.01, 0.4, [1, 1, 0.8], { e: 0.6 });
    g.box(W - 0.15, L, 0.3, W - 0.05, L + 0.01, 0.4, [1, 1, 0.8], { e: 0.6 });
    if (kind === 'police') { g.box(-0.2, -0.1, 0.86, 0, 0.1, 0.93, [0.9, 0.1, 0.1], { e: 1 }); g.box(0, -0.1, 0.86, 0.2, 0.1, 0.93, [0.1, 0.2, 0.95], { e: 1 }); }
    if (kind === 'taxi' || kind === 'carpool') g.box(-0.12, -0.08, 0.86, 0.12, 0.08, 0.96, [0.95, 0.9, 0.5], { e: 0.6 });
    if (kind === 'pizza') g.box(-0.18, -0.2, 0.86, 0.18, 0.2, 1.0, [0.9, 0.2, 0.1]);
    if (truck) { g.box(-W, -L, 0.55, W, -L + 0.85, 0.9, mulCol(body, 0.9)); g.beam([-0.2, -L + 0.2, 1.1], [-0.2, L - 0.4, 1.1], 0.04, CHROME); g.beam([0.2, -L + 0.2, 1.1], [0.2, L - 0.4, 1.1], 0.04, CHROME); }
  }

  function treeModel(g, kind, C1, C2, seed) {
    const r = ((seed * 9301 + 49297) % 233280) / 233280;
    const h = 1 + r * 0.5;
    if (kind === 'tree_pine') {
      g.cyl(0, 0, 0, 1.0 * h, 0.12, 0.09, 6, C1, { cell: 'bark' });
      for (let i = 0; i < 4; i++) g.cyl(0, 0, (0.7 + i * 0.85) * h, (1.9 + i * 0.85) * h, (1.05 - i * 0.22) * h, 0.02, 9, mulCol(C2, 0.9 + i * 0.06), { cell: 'foliage', noTop: true });
      return 4.3 * h;
    }
    if (kind === 'tree_palm') {
      let p = [0, 0, 0];
      for (let i = 0; i < 6; i++) { const q = [Math.sin(i * 0.3) * 0.25, 0, (i + 1) * 0.7 * h]; g.beam(p, q, 0.1 - i * 0.008, C1, { cell: 'bark' }); p = q; }
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2 + r;
        const tip = [p[0] + Math.cos(a) * 1.5, p[1] + Math.sin(a) * 1.5, p[2] - 0.6];
        const mid = [p[0] + Math.cos(a) * 0.8, p[1] + Math.sin(a) * 0.8, p[2] + 0.15];
        const sx = -Math.sin(a) * 0.28, sy = Math.cos(a) * 0.28;
        g.quad([p[0], p[1], p[2] + 0.05], [mid[0] + sx, mid[1] + sy, mid[2]], tip, [mid[0] - sx, mid[1] - sy, mid[2]], mulCol(C2, 0.9 + (i % 3) * 0.07), { cell: 'foliage', n: [0, 0, 1] });
      }
      return p[2] + 0.3;
    }
    g.cyl(0, 0, 0, 1.6 * h, 0.16, 0.11, 7, C1, { cell: 'bark' });
    g.beam([0, 0, 1.2 * h], [0.5, 0.2, 2.1 * h], 0.06, C1, { cell: 'bark' });
    const base = 2.4 * h;
    const blobs = [[0, 0, base + 0.2, 1.25], [0.6, 0.3, base - 0.1, 0.9], [-0.55, 0.25, base, 0.95], [0.1, -0.6, base - 0.05, 0.9], [0.05, 0.1, base + 0.9, 0.85]];
    for (const [x, y, z, s] of blobs) g.sphere(x * h, y * h, z, s * h, s * h, s * 0.85 * h, 10, 6, mulCol(C2, 0.9 + ((x + y) * 0.1)), { cell: 'foliage' });
    return base + 1.7 * h;
  }
  for (const k of ['tree_oak', 'tree_maple', 'tree_pine', 'tree_palm']) M[k] = (g, o, C1, C2) => treeModel(g, k, C1, C2, o.id || 1);

  const RHS = {
    cityhall: { h: 4.6, facade: 'facade_stone', roof: 'dome', color: '#e8e0d0', roofc: '#6a8a9a', cols: true },
    business: { h: 13, facade: 'glass_office', roof: 'flat', color: '#c8d8e8', roofc: '#4a5058' },
    police: { h: 4.2, facade: 'facade_brick', roof: 'flat', color: '#f0f0f0', roofc: '#3a3a44', siren: true },
    hospital: { h: 6.4, facade: 'facade_white', roof: 'flat', color: '#f4f4f4', roofc: '#8a9098', cross: true },
    science: { h: 5, facade: 'facade_concrete', roof: 'flat', color: '#e0e4e8', roofc: '#5a6068', dish: true },
    military: { h: 4.4, facade: 'facade_metal', roof: 'hangar', color: '#a8b09a', roofc: '#6a7458', flag: true },
    stadium: { h: 4.5, facade: 'facade_concrete', roof: 'bowl', color: '#d0d0d0', roofc: '#8a2a2a' },
    theater: { h: 6, facade: 'facade_stone', roof: 'gable', color: '#e8d8c0', roofc: '#6a2a3a', marquee: true },
    bistro: { h: 3.4, facade: 'facade_brick', roof: 'gable', color: '#f0e8e0', roofc: '#3a5a3a', awning: '#2a6a3a' },
    grocery: { h: 3.6, facade: 'facade_white', roof: 'flat', color: '#f0e8d8', roofc: '#c8581c', awning: '#c8481c' },
    bookstore: { h: 3.4, facade: 'facade_brick', roof: 'gable', color: '#e8d8c0', roofc: '#5a3a2a', awning: '#6a3a1a' },
    spa: { h: 3.4, facade: 'facade_white', roof: 'hip', color: '#e8f0f0', roofc: '#5a8a9a', plants: true },
    newspaper: { h: 5, facade: 'facade_stone', roof: 'flat', color: '#e0dcd4', roofc: '#3a3a3a', antenna: true },
    school: { h: 5, facade: 'facade_brick', roof: 'hip', color: '#f0e0d0', roofc: '#5a4a3a', bell: true },
    warehouse: { h: 4.6, facade: 'facade_metal', roof: 'gable', color: '#9a9aa0', roofc: '#6a6a70' }
  };
  function rabbit(g, key, w, d) {
    const R = RHS[key] || RHS.warehouse;
    const hw = w / 2 - 0.1, hd = d / 2 - 0.1, H = R.h;
    const wall = col(R.color), rc = col(R.roofc);
    const nx = Math.max(1, Math.round(hw * 2 / 1.0)), nz = Math.max(1, Math.round(H / 1.1));
    if (key === 'stadium') {
      g.cyl(0, 0, 0, H, hw, hw * 0.98, 20, wall, { cell: 'facade_concrete', ry0: hd, ry1: hd * 0.98, noTop: true });
      g.cyl(0, 0, H - 0.01, H, hw, hw * 0.55, 20, WHITE, { cell: 'seats', ry0: hd, ry1: hd * 0.55, flat: true, noTop: true });
      g.cyl(0, 0, 0.6, 0.61, hw * 0.55, hw * 0.55, 20, [0.3, 0.6, 0.25], { ry0: hd * 0.55, ry1: hd * 0.55 });
      for (const [x, y] of [[-hw * 0.8, -hd * 0.8], [hw * 0.8, -hd * 0.8], [-hw * 0.8, hd * 0.8], [hw * 0.8, hd * 0.8]]) { g.cyl(x, y, 0, H + 3, 0.12, 0.1, 6, DARK); g.box(x - 0.5, y - 0.1, H + 3, x + 0.5, y + 0.1, H + 3.6, WHITE, { e: 0.6 }); }
      g.box(-1.2, hd - 0.05, 0.4, 1.2, hd + 0.2, 1.4, WHITE, { frontCell: 'sign_' + key, front: WHITE, fe: 0.15 });
      g.box(-0.6, hd - 0.1, 0, 0.6, hd + 0.05, 1.6, [0.15, 0.12, 0.1]);
      return H + 3.6;
    }
    g.box(-hw, -hd, 0, hw, hd, 0.3, mulCol(wall, 0.75));
    const uvs = [[0, nz], [nx, nz], [nx, 0], [0, 0]];
    for (const [a, b, n] of [[[-hw, hd], [hw, hd], [0, 1]], [[hw, -hd], [-hw, -hd], [0, -1]], [[hw, hd], [hw, -hd], [1, 0]], [[-hw, -hd], [-hw, hd], [-1, 0]]]) {
      const segs = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.2));
      for (let i = 0; i < segs; i++) for (let j = 0; j < nz; j++) {
        const t0 = i / segs, t1 = (i + 1) / segs;
        const x0 = a[0] + (b[0] - a[0]) * t0, y0 = a[1] + (b[1] - a[1]) * t0, x1 = a[0] + (b[0] - a[0]) * t1, y1 = a[1] + (b[1] - a[1]) * t1;
        const z0 = 0.3 + (H - 0.3) * j / nz, z1 = 0.3 + (H - 0.3) * (j + 1) / nz;
        g.quad([x0, y0, z0], [x1, y1, z0], [x1, y1, z1], [x0, y0, z1], wall, { cell: R.facade, n: [n[0], n[1], 0] });
      }
    }
    g.box(-hw - 0.08, -hd - 0.08, H, hw + 0.08, hd + 0.08, H + 0.18, mulCol(wall, 0.85));
    g.box(-0.55, hd - 0.02, 0.3, 0.55, hd + 0.06, 2.3, [0.2, 0.16, 0.12]);
    g.box(-0.5, hd + 0.06, 0.35, -0.02, hd + 0.08, 2.2, [0.35, 0.45, 0.55], { e: 0.15 });
    g.box(0.02, hd + 0.06, 0.35, 0.5, hd + 0.08, 2.2, [0.35, 0.45, 0.55], { e: 0.15 });
    g.box(-hw * 0.7, hd, H - 1.1, hw * 0.7, hd + 0.12, H - 0.3, WHITE, { frontCell: 'sign_' + key, front: WHITE, fe: 0.2 });
    g.box(-1.1, hd, 0, 1.1, hd + 0.8, 0.3, mulCol(wall, 0.8));
    let top = H + 0.18;
    if (R.roof === 'dome') { g.cyl(0, 0, H + 0.18, H + 1.1, 1.8, 1.7, 14, wall, { cell: 'facade_stone' }); g.sphere(0, 0, H + 1.1, 1.7, 1.7, 1.5, 14, 6, rc, { lat0: 0, lat1: Math.PI / 2 }); g.cyl(0, 0, H + 2.5, H + 3.1, 0.08, 0.02, 6, BRASS); top = H + 3.1; }
    if (R.roof === 'gable' || R.roof === 'hip') {
      const rh = Math.min(hw, hd) * 0.7;
      const ov = 0.35;
      const x0 = -hw - ov, x1 = hw + ov, y0 = -hd - ov, y1 = hd + ov, z = H + 0.18;
      if (hw >= hd) {
        const ins = R.roof === 'hip' ? hd : 0;
        g.quad([x0, y1, z], [x1, y1, z], [x1 - ins, 0, z + rh], [x0 + ins, 0, z + rh], rc, { cell: 'shingles' });
        g.quad([x1, y0, z], [x0, y0, z], [x0 + ins, 0, z + rh], [x1 - ins, 0, z + rh], rc, { cell: 'shingles' });
        g.quad([x0, y0, z], [x0, y1, z], [x0 + ins, 0, z + rh], [x0 + ins, 0, z + rh], R.roof === 'hip' ? rc : wall, { cell: R.roof === 'hip' ? 'shingles' : R.facade });
        g.quad([x1, y1, z], [x1, y0, z], [x1 - ins, 0, z + rh], [x1 - ins, 0, z + rh], R.roof === 'hip' ? rc : wall, { cell: R.roof === 'hip' ? 'shingles' : R.facade });
      } else {
        const ins = R.roof === 'hip' ? hw : 0;
        g.quad([x1, y1, z], [x1, y0, z], [0, y0 + ins, z + rh], [0, y1 - ins, z + rh], rc, { cell: 'shingles' });
        g.quad([x0, y0, z], [x0, y1, z], [0, y1 - ins, z + rh], [0, y0 + ins, z + rh], rc, { cell: 'shingles' });
        g.quad([x0, y1, z], [x1, y1, z], [0, y1 - ins, z + rh], [0, y1 - ins, z + rh], R.roof === 'hip' ? rc : wall, { cell: R.roof === 'hip' ? 'shingles' : R.facade });
        g.quad([x1, y0, z], [x0, y0, z], [0, y0 + ins, z + rh], [0, y0 + ins, z + rh], R.roof === 'hip' ? rc : wall, { cell: R.roof === 'hip' ? 'shingles' : R.facade });
      }
      top = z + rh;
    }
    if (R.roof === 'hangar') { g.cyl(0, 0, H, H + 0.01, hw, hw, 1, rc); for (let i = 0; i < 10; i++) { const a0 = Math.PI * i / 10, a1 = Math.PI * (i + 1) / 10; g.quad([-hw * Math.cos(a0), -hd, H + Math.sin(a0) * 2.2], [-hw * Math.cos(a1), -hd, H + Math.sin(a1) * 2.2], [-hw * Math.cos(a1), hd, H + Math.sin(a1) * 2.2], [-hw * Math.cos(a0), hd, H + Math.sin(a0) * 2.2], rc, { cell: 'facade_metal' }); } top = H + 2.2; }
    if (R.roof === 'flat') { g.box(-hw * 0.4, -hd * 0.4, H + 0.18, -hw * 0.1, -hd * 0.1, H + 0.8, DARK); }
    if (R.cols) { for (let i = 0; i < 6; i++) { const x = -hw * 0.8 + i * hw * 1.6 / 5; g.cyl(x, hd + 0.9, 0.3, H, 0.16, 0.14, 8, WHITE, { cell: 'marble' }); } g.box(-hw * 0.9, hd + 0.4, H - 0.25, hw * 0.9, hd + 1.2, H + 0.2, WHITE, { cell: 'marble' }); g.quad([-hw * 0.9, hd + 1.2, H + 0.2], [hw * 0.9, hd + 1.2, H + 0.2], [0, hd + 1.2, H + 1.2], [0, hd + 1.2, H + 1.2], WHITE, { cell: 'marble' }); }
    if (R.cross) { g.box(-0.7, hd + 0.02, H - 2.4, 0.7, hd + 0.1, H - 1.9, [0.85, 0.1, 0.1], { e: 0.5 }); g.box(-0.25, hd + 0.02, H - 2.85, 0.25, hd + 0.1, H - 1.45, [0.85, 0.1, 0.1], { e: 0.5 }); }
    if (R.siren) { g.box(-0.3, 0, H + 0.18, 0.3, 0.3, H + 0.5, [0.2, 0.3, 0.9], { e: 0.8 }); g.cyl(hw - 0.6, hd - 0.6, H + 0.18, H + 3, 0.04, 0.03, 5, DARK); }
    if (R.dish) { g.cyl(hw * 0.4, 0, H + 0.18, H + 1.2, 0.12, 0.1, 6, DARK); g.sphere(hw * 0.4, 0, H + 1.9, 1.0, 1.0, 0.5, 12, 3, WHITE, { lat0: Math.PI / 2, lat1: Math.PI }); }
    if (R.flag) { g.cyl(hw + 1.2, hd + 0.6, 0, 6, 0.05, 0.04, 6, CHROME); g.quad([hw + 1.2, hd + 0.6, 5.2], [hw + 2.4, hd + 0.6, 5.2], [hw + 2.4, hd + 0.6, 5.95], [hw + 1.2, hd + 0.6, 5.95], [0.35, 0.45, 0.3], { n: [0, 1, 0] }); }
    if (R.marquee) { g.box(-hw * 0.8, hd, 2.3, hw * 0.8, hd + 1.3, 2.9, [0.55, 0.12, 0.25], { e: 0.1 }); for (let i = 0; i < 12; i++) g.sphere(-hw * 0.75 + i * hw * 1.5 / 11, hd + 1.32, 2.6, 0.06, 0.06, 0.06, 5, 3, [1, 0.9, 0.5], { e: 1 }); }
    if (R.awning) { const ac = col(R.awning); g.quad([-hw * 0.95, hd, 2.6], [hw * 0.95, hd, 2.6], [hw * 0.95, hd + 1.0, 2.0], [-hw * 0.95, hd + 1.0, 2.0], ac, { cell: 'fabric' }); }
    if (R.antenna) { g.cyl(-hw * 0.5, -hd * 0.5, H + 0.18, H + 4.5, 0.08, 0.02, 5, [0.8, 0.2, 0.2]); }
    if (R.bell) { g.box(-0.9, -0.9, top - 0.3, 0.9, 0.9, top + 1.4, wall, { cell: 'facade_brick' }); g.cyl(0, 0, top + 1.4, top + 2.6, 1.2, 0.02, 4, rc, { a0: Math.PI / 4, a1: Math.PI * 2.25, flat: true }); g.panel(-0.5, 0.5, top + 0.5, top + 1.2, 0.905, WHITE, { cell: 'clock' }); top += 2.6; }
    if (R.plants) { for (const x of [-hw + 0.4, hw - 0.4]) g.sphere(x, hd + 0.5, 0.5, 0.35, 0.35, 0.45, 8, 5, GREEN, { cell: 'foliage' }); }
    return top;
  }

  function buildObject(g, ob, def, env) {
    const key = def.rabbit ? 'rabbit' : ob.t;
    const C1 = col(ob.col && ob.col[0] || def.col[0]), C2 = col(ob.col && ob.col[1] || def.col[1]);
    if (def.rabbit) return rabbit(g, def.rabbit, def.size[0], def.size[1]);
    const f = M[key];
    if (!f) { g.box(-0.4, -0.4, 0, 0.4, 0.4, 0.8, C1); return 0.8; }
    const r = f(g, ob, C1, C2, ob.st, env);
    return typeof r === 'number' ? r : null;
  }

  Object.assign(S, { MODELS: M, buildObject, carModel, treeModel, RABBIT_STYLE: RHS });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
