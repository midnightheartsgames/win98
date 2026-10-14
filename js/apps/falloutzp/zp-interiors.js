(function (Z) {
  'use strict';

  Z.INTERIORS = Z.INTERIORS || {};

  Z.PROP_SIZE = {
    table: [1.2, 0.76, 0.8], chair: [0.45, 0.9, 0.45], stool: [0.38, 0.65, 0.38], shelf: [1.0, 1.9, 0.35], wardrobe: [1.1, 2.0, 0.6], tv: [0.6, 0.5, 0.45],
    stove: [0.6, 0.85, 0.6], sink: [0.55, 0.85, 0.45], bathtub: [0.75, 0.6, 1.6], toilet: [0.4, 0.75, 0.6], counter: [2.0, 1.05, 0.6], rack: [1.6, 2.0, 0.5],
    machine: [2.0, 1.6, 1.2], computer: [0.8, 1.9, 0.6], panel: [2.0, 1.3, 0.5], bunk: [0.9, 1.7, 2.0], piano: [1.5, 1.2, 0.6], column: [0.6, 3, 0.6],
    rubble: [1.6, 0.7, 1.6], radiator: [0.9, 0.6, 0.12], lamp: [0.5, 0.2, 0.5], poster: [0.6, 0.85, 0.02], banner: [1.0, 1.8, 0.02], pipe: [0.2, 0.2, 2],
    sacks: [1.0, 0.6, 0.8], boxes: [1.2, 1.0, 0.9], tank: [1.2, 1.6, 1.2], generator: [1.4, 1.2, 0.9], cot: [0.8, 0.45, 1.9], bigtable: [3.0, 0.78, 1.2],
    slot: [0.7, 1.7, 0.6], cardtable: [1.6, 0.78, 1.0], stage: [4, 0.8, 3], seats: [3, 0.9, 0.7], reel: [0.9, 1.9, 0.7], turbine: [4, 3, 4], bar: [3, 1.1, 0.7]
  };
  const NOSOLID = { lamp: 1, poster: 1, banner: 1, radiator: 0, pipe: 1 };

  Z.buildInteriorCell = function (game, id, def) {
    const rows = def.map, H = rows.length, W = Math.max(...rows.map(r => r.length));
    const cw = new Z.CollisionWorld(null);
    const cell = new Z.Cell(id, cw);
    cell.interior = true;
    cell.def = def;
    cell.name = def.name;
    cell.w = W; cell.h = H;
    const at = (c, r) => (rows[r] && rows[r][c]) || ' ';
    const isFloor = ch => ch !== '#' && ch !== 'W' && ch !== ' ' && ch !== 'X';
    cw.addFloor([[0, 0], [W, 0], [W, H], [0, H]], 0, { floor: true });
    for (let r = 0; r < H; r++) {
      let c = 0;
      while (c < W) {
        if (isFloor(at(c, r))) { c++; continue; }
        let e = c;
        while (e < W && !isFloor(at(e, r))) e++;
        let near = false;
        for (let k = c; k < e; k++) for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) if (isFloor(at(k + dc, r + dr))) near = true;
        if (near) cw.addBox((c + e) / 2, r + 0.5, e - c, 1, 0, -1, (def.h || 2.8) + 1, { wall: true });
        c = e;
      }
    }
    cell.marks = {};
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const ch = at(c, r);
      if (ch >= 'A' && ch <= 'Z') cell.marks[ch] = { x: c + 0.5, z: r + 0.5, yaw: (def.marks && def.marks[ch] && def.marks[ch].yaw) || 0 };
    }
    if (def.marks) for (const k in def.marks) if (def.marks[k].at) cell.marks[k] = { x: def.marks[k].at[0] + 0.5, z: def.marks[k].at[1] + 0.5, yaw: def.marks[k].yaw || 0 };
    cell.spawn = cell.marks.A || { x: W / 2, z: H / 2, yaw: 0 };
    const nav = new Z.NavGrid(0, 0, W, H, 1);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) { nav.w[r * W + c] = isFloor(at(c, r)) ? (1 | 8) : 0; nav.h[r * W + c] = 0; }
    cell.props = [];
    for (const p of def.props || []) {
      const sz = p.size || Z.PROP_SIZE[p.kind] || [1, 1, 1];
      const x = p.at[0] + (p.dx === undefined ? 0.5 : p.dx), z = p.at[1] + (p.dz === undefined ? 0.5 : p.dz);
      const pr = Object.assign({}, p, { x, z, y: p.y || 0, size: sz });
      cell.props.push(pr);
      if (!NOSOLID[p.kind] && !p.noCollide) {
        cw.addBox(x, z, sz[0], sz[2], p.yaw || 0, pr.y - 0.05, pr.y + sz[1], { prop: pr });
        const c0 = Math.floor(x - sz[0] / 2 + 0.15), c1 = Math.floor(x + sz[0] / 2 - 0.15), r0 = Math.floor(z - sz[2] / 2 + 0.15), r1 = Math.floor(z + sz[2] / 2 - 0.15);
        if (Math.abs(Math.sin(p.yaw || 0)) < 0.3) for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (r >= 0 && c >= 0 && r < H && c < W) nav.w[r * W + c] = 0;
      }
    }
    cell.nav = nav;
    cell.lights = (def.lights || []).map(l => ({ x: l.at[0] + 0.5, y: l.y || (def.h || 2.8) - 0.3, z: l.at[1] + 0.5, r: l.r || 7, c: l.c || [1.2, 1.05, 0.8], flicker: l.flicker }));
    for (const o of def.objects || []) {
      const x = o.at[0] + (o.dx === undefined ? 0.5 : o.dx), z = o.at[1] + (o.dz === undefined ? 0.5 : o.dz);
      const ob = game.addObject(cell, Object.assign({}, o, { x, z, y: o.y || 0, id: o.id || (id + '_' + o.at.join('_') + '_' + o.type) }));
      if (ob.T.solid || ob.T.cont && !ob.T.wall) {
        const sz = ob.size || ob.T.size;
        const c0 = Math.floor(x - sz[0] / 2 + 0.15), c1 = Math.floor(x + sz[0] / 2 - 0.15), r0 = Math.floor(z - sz[2] / 2 + 0.15), r1 = Math.floor(z + sz[2] / 2 - 0.15);
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (r >= 0 && c >= 0 && r < H && c < W && ob.T.solid) nav.w[r * W + c] = 0;
      }
    }
    cell.amb = def.amb || [0.2, 0.19, 0.17];
    for (const fn of Z.INTERIOR_HOOKS || []) fn(game, cell, def);
    if (def.onBuild) def.onBuild(game, cell);
    return cell;
  };
  Z.INTERIOR_HOOKS = Z.INTERIOR_HOOKS || [];
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
