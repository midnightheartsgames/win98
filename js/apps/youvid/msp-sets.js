(function () {
  const { M4, rgb, Builder } = window.P3D;
  const K = window.YouVidKit;
  const { PI } = K;
  const { boxT, wallZ, wallX, floorY } = window.MscSets;

  const WALL = { spec: [0.04, 4], rim: 0.25 };
  const METAL = { spec: [0.35, 16], rim: 0.4 };
  const GLOW = { spec: [0, 1], rim: 0 };

  function newLists(keys) {
    const o = {};
    keys.forEach(k => { o[k] = new Builder(); });
    return o;
  }

  function finish(r, list) {
    const out = {};
    Object.keys(list).forEach(k => {
      if (list[k].count) out[k] = r.mesh(list[k]);
    });
    return out;
  }

  function wallHoles(b, a0, a1, y0, y1, fixed, axis, facing, holes, col, tile) {
    const as = [a0, a1], ys = [y0, y1];
    holes.forEach(h => { as.push(h[0], h[1]); ys.push(h[2], h[3]); });
    const ua = [...new Set(as)].sort((p, q) => p - q), uy = [...new Set(ys)].sort((p, q) => p - q);
    for (let i = 0; i < ua.length - 1; i++) {
      for (let j = 0; j < uy.length - 1; j++) {
        const ca = (ua[i] + ua[i + 1]) / 2, cy = (uy[j] + uy[j + 1]) / 2;
        if (holes.some(h => ca > h[0] && ca < h[1] && cy > h[2] && cy < h[3])) continue;
        if (axis === 'z') wallZ(b, ua[i], ua[i + 1], uy[j], uy[j + 1], fixed, facing, col, tile);
        else wallX(b, ua[i], ua[i + 1], uy[j], uy[j + 1], fixed, facing, col, tile);
      }
    }
  }

  function texQuadZ(b, cx, cy, z, w, h, facing, col) {
    const n = [0, 0, facing];
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    if (facing > 0) b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    else b.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], col, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
  }

  function texQuadX(b, cz, cy, x, w, h, facing, col) {
    const n = [facing, 0, 0];
    const z0 = cz - w / 2, z1 = cz + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    if (facing > 0) b.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], col, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    else b.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], col, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
  }

  function pipe(b, from, to, r, col, sides) {
    K.tube(b, [from, to], [r, r], sides || 8, col);
  }

  function coneLamp(b, glow, x, y, z, r) {
    const R = r || 0.3;
    b.at(x, y, z, h => {
      h.at(0, 0.5, 0, q => q.box(0.02, 1.0, 0.02, 0x2a2a2a));
      h.prism(18, R, R, -0.02, R * 0.18, R * 0.18, R * 0.7, 0x2e3236, { capBottom: false });
    });
    glow.at(x, y - 0.015, z, h => h.prism(18, R * 0.92, R * 0.92, 0, R * 0.92, R * 0.92, 0.004, rgb(0xfff6e0, 1)));
  }

  function barrel(b, x, z, col) {
    b.at(x, 0, z, h => {
      h.prism(16, 0.3, 0.3, 0, 0.3, 0.3, 0.9, col, { capTop: true });
      [0.2, 0.7].forEach(y => h.prism(16, 0.31, 0.31, y - 0.02, 0.31, 0.31, y + 0.02, 0x2a2a2a));
    });
  }

  function buildAlarm(r) {
    const L = newLists(['concrete', 'dark', 'metal', 'glow', 'signA', 'signB', 'signC', 'board', 'console', 'plate']);
    wallZ(L.concrete, -6, 6, 0, 5, 0, 1, 0xd8d8d2, [2.5, 2.5]);
    floorY(L.dark, -6, 0, 6, 6, 0, 0x2e3034);
    pipe(L.metal, [-6, 3.6, 0.08], [6, 3.6, 0.08], 0.05, 0x6a6e72);
    pipe(L.metal, [-6, 3.75, 0.08], [6, 3.75, 0.08], 0.03, 0x6a6e72);
    pipe(L.metal, [0, 2.1, 0.05], [0, 3.6, 0.05], 0.018, 0x5a5e62);
    [['signA', -1.7], ['signB', 0.1], ['signC', 1.9]].forEach(([k, x]) => {
      L.metal.at(x, 1.62, 0.06, h => h.box(1.56, 0.42, 0.12, 0x3a3e42));
      texQuadZ(L[k], x, 1.62, 0.1205, 1.46, 0.34, 1, rgb(0xffffff, 0.85));
      L.dark.at(x, 1.85, 0.08, h => h.box(1.5, 0.03, 0.18, 0x55595e));
    });
    L.dark.at(30, 0, -0.5, h => h.box(9, 5, 0.4, 0x202428, { base: true }));
    texQuadZ(L.board, 30, 2.4, -0.29, 7.2, 3.2, 1, rgb(0xffffff, 0.75));
    floorY(L.dark, 24, -1, 36, 8, 0, 0x1e2024);
    L.metal.at(30, 0, 1.6, h => h.box(6.4, 0.85, 1.0, 0x30343a, { base: true }));
    L.console.at(30, 0.86, 1.6, h => { h.push(M4.rotX(-0.35)); texQuadZ(h, 0, 0, 0, 6.2, 0.6, 1, rgb(0xffffff, 0.5)); h.pop(); });
    return finish(r, L);
  }

  function buildStairs(r) {
    const L = newLists(['concrete', 'dark', 'metal', 'stairs', 'glow', 'wall']);
    const W = 1.05;
    floorY(L.concrete, -W, -3, W, 0, 3.0, 0x9a9a94, [2, 2]);
    for (let i = 0; i < 15; i++) {
      const y = 3.0 - i * 0.2, z = i * 0.3;
      boxT(L.stairs, 0, y - 0.2, z + 0.15, W * 2, 0.2, 0.3, 0xa8a8a2, [2.1, 0.2], { bottom: true, back: true });
    }
    floorY(L.concrete, -W, 4.5, W, 14, 0, 0x8a8a84, [2, 2]);
    [-1, 1].forEach(s => {
      wallX(L.wall, -3, 14, -0.5, 6.5, s * W, -s, 0xd0d0ca, [2.5, 2.5]);
      pipe(L.metal, [s * (W - 0.08), 3.9, -2], [s * (W - 0.08), 0.9, 4.5], 0.03, 0x6a6e72);
      [0, 2.5, 5, 7.5].forEach(z => {
        L.dark.at(s * (W - 0.03), 4.2 - Math.min(z, 4.5) * 0.66, z, h => h.box(0.06, 0.16, 0.36, 0x3a3e42));
        L.glow.at(s * (W - 0.065), 4.2 - Math.min(z, 4.5) * 0.66, z, h => h.box(0.02, 0.1, 0.3, rgb(0x6ab8f0, 1)));
      });
    });
    wallZ(L.wall, -W, W, 0, 6.5, -3, 1, 0xd0d0ca, [2.5, 2.5]);
    floorY(L.dark, -W, -3, W, 14, 6.5, 0x3a3c40, null, true);
    [4.03, 4.4].forEach(y => [-1.55, -0.85].forEach(z => L.metal.at(-W, y, z, h => {
      h.at(0.015, 0, 0, q => q.box(0.03, 0.1, 0.06, 0x1e2022));
      h.at(0.08, -0.01, 0, q => q.box(0.13, 0.025, 0.03, 0x1e2022));
      h.at(0.14, 0.02, 0, q => q.box(0.025, 0.06, 0.03, 0x1e2022));
    })));
    return finish(r, L);
  }

  const DOOR_X = 0, ROOM = { x0: 0, x1: 8, z0: -3.5, z1: 3.5, h: 3.2 };
  const TABLE = [4.0, 0, 0.6];

  function buildBase(r) {
    const L = newLists(['wall', 'dark', 'metal', 'tiles', 'glow', 'map', 'poster', 'notice', 'cabinet', 'doorSign', 'keypad', 'trim', 'lights', 'desk']);
    const zc = 1.25, hh = 3.0;
    floorY(L.tiles, -26, -zc, DOOR_X, zc, 0, 0x7a7c78, [1.2, 1.2]);
    wallZ(L.wall, -26, DOOR_X, 0, hh, -zc, 1, 0xffffff, [2.4, hh]);
    wallZ(L.wall, -26, DOOR_X, 0, hh, zc, -1, 0xffffff, [2.4, hh]);
    floorY(L.dark, -26, -zc, DOOR_X, zc, hh, 0x4a4c50, null, true);
    for (let x = -24; x < -1; x += 4) {
      L.glow.at(x, hh - 0.02, 0, h => h.box(1.2, 0.03, 0.3, rgb(0xeef4ff, 1)));
      L.dark.at(x, hh - 0.01, 0, h => h.box(1.3, 0.02, 0.4, 0x8a8c90));
    }
    [-21, -15, -9].forEach(x => {
      L.dark.at(x, 0, -zc + 0.04, h => h.box(1.0, 2.2, 0.08, 0x5c666e, { base: true }));
      L.dark.at(x, 1.45, -zc + 0.09, h => h.box(0.5, 0.5, 0.02, 0x8aa0b0));
    });
    [-18, -6].forEach(x => {
      L.dark.at(x, 0, zc - 0.04, h => h.box(1.0, 2.2, 0.08, 0x5c666e, { base: true }));
    });
    L.metal.at(-3.2, 0.9, -zc + 0.12, h => h.prism(12, 0.08, 0.08, 0, 0.08, 0.08, 0.5, 0xb02a22));
    L.metal.at(-12.2, 0.9, zc - 0.12, h => h.prism(12, 0.08, 0.08, 0, 0.08, 0.08, 0.5, 0xb02a22));
    const R = ROOM;
    floorY(L.tiles, R.x0, R.z0, R.x1, R.z1, 0, 0x6a6c68, [1.2, 1.2]);
    floorY(L.dark, R.x0, R.z0, R.x1, R.z1, R.h, 0x2a2c30, null, true);
    wallHoles(L.wall, R.z0, R.z1, 0, R.h, R.x0, 'x', 1, [[-0.5, 0.5, 0, 2.1]], 0xffffff, [2.4, R.h]);
    wallHoles(L.wall, -zc, zc, 0, hh, DOOR_X - 0.001, 'x', -1, [[-0.5, 0.5, 0, 2.1]], 0xffffff, [2.4, hh]);
    floorY(L.dark, DOOR_X - 0.05, -0.5, DOOR_X + 0.05, 0.5, 2.1, 0x4a4e52, null, true);
    [-0.53, 0.53].forEach(z => L.trim.at(DOOR_X, 1.05, z, h => h.box(0.14, 2.2, 0.06, 0x5c646a)));
    wallZ(L.wall, R.x0, R.x1, 0, R.h, R.z0, 1, 0xffffff, [2.4, R.h]);
    wallX(L.wall, R.z0, R.z1, 0, R.h, R.x1, -1, 0xffffff, [2.4, R.h]);
    wallZ(L.dark, R.x0, R.x1, 0, R.h, R.z1, -1, 0x2e3236);
    texQuadZ(L.map, 4.0, 2.05, R.z1 - 0.02, 7.0, 2.3, -1, rgb(0xffffff, 0.3));
    L.metal.at(4.0, 0, R.z1 - 0.45, h => h.box(7.4, 0.95, 0.8, 0x3a3e44, { base: true }));
    L.dark.at(4.0, 0.95, R.z1 - 0.45, h => h.box(7.5, 0.04, 0.85, 0x5a5e64));
    [1.6, 3.2, 4.8, 6.4].forEach(x => coneLamp(L.dark, L.glow, x, 2.35, R.z1 - 0.9, 0.3));
    [[2.2, 0.6], [5.8, 0.6]].forEach(([x, z]) => coneLamp(L.dark, L.glow, x, 2.45, z, 0.32));
    [2.0, 2.55, 3.1].forEach(x => L.cabinet.at(x, 0, R.z0 + 0.32, h => {
      h.at(0, 0.66, 0, q => q.box(0.5, 1.32, 0.6, 0xd8d4c8, { faces: { front: null } }));
      texQuadZ(h, 0, 0.66, 0.301, 0.5, 1.32, 1, 0xffffff);
    }));
    texQuadZ(L.poster, 4.6, 1.75, R.z0 + 0.01, 0.6, 0.9, 1, 0xffffff);
    texQuadZ(L.notice, 5.5, 1.7, R.z0 + 0.01, 0.5, 0.75, 1, 0xffffff);
    L.dark.at(0.38, 0, 1.3, h => h.box(0.7, 1.8, 0.8, 0xe2ded2, { base: true }));
    L.glow.at(0.735, 1.25, 1.3, h => h.box(0.01, 0.85, 0.66, rgb(0xf2ecd8, 0.85)));
    for (let i = 0; i < 5; i++) L.dark.at(0.742, 0.95 + i * 0.15, 1.3, h => h.box(0.01, 0.02, 0.6, 0x8a8478));
    L.dark.at(0.745, 0.42, 1.3, h => h.box(0.01, 0.18, 0.58, 0xc84a3a));
    L.dark.at(0.38, 0, -1.25, h => h.box(0.6, 1.4, 0.7, 0xd8d4c8, { base: true }));
    L.metal.at(0.15, 0.95, -0.8, h => h.prism(12, 0.08, 0.08, 0, 0.08, 0.08, 0.5, 0xb02a22));
    L.metal.at(1.2, 0.95, R.z0 + 0.1, h => h.prism(12, 0.08, 0.08, 0, 0.08, 0.08, 0.5, 0xb02a22));
    L.dark.at(7.5, 0, -1.2, h => h.prism(12, 0.15, 0.15, 0, 0.15, 0.15, 0.55, 0x3a3a3a));
    L.dark.at(7.5, 0.55, -0.8, h => h.ellipsoid(0.32, 0.4, 0.32, 10, 8, 0x3a6a3a));
    L.dark.at(7.6, 0, 1.4, h => h.box(0.5, 1.9, 1.8, 0x5a6268, { base: true }));
    L.trim.at(R.x1 - 0.02, 0, 0, h => h.box(0.04, 0.12, R.z1 - R.z0, 0x2a4a62, { base: true }));
    const [tx, , tz] = TABLE;
    L.desk.at(tx, 0.73, tz, h => h.box(2.0, 0.025, 1.0, 0xe2ded2, { base: true }));
    L.trim.at(tx, 0.69, tz, h => h.box(1.96, 0.04, 0.96, 0x4a5056, { base: true }));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => L.trim.at(tx + x * 0.92, 0, tz + z * 0.42, h => h.box(0.06, 0.7, 0.06, 0x4a5056, { base: true })));
    L.trim.at(tx, 0.55, tz - 0.46, h => h.box(1.84, 0.14, 0.02, 0x4a5056, { base: true }));
    return finish(r, L);
  }

  function buildSentry(r) {
    const L = newLists(['concrete', 'dark', 'metal', 'hazard', 'glow', 'keepClosed', 'keepOut', 'yellow', 'door']);
    floorY(L.concrete, -6, -6, 6, 6, 0, 0x6e6e6a, [2, 2]);
    wallZ(L.dark, -6, 6, 0, 4, -4, 1, 0x3e4248);
    wallX(L.dark, -6, 6, 0, 4, -5, 1, 0x3a3e44);
    wallX(L.dark, -6, 6, 0, 4, 5, -1, 0x3a3e44);
    floorY(L.dark, -6, -6, 6, 6, 4, 0x1e2024, null, true);
    wallZ(L.hazard, -6, 6, 0, 0.3, -3.98, 1, 0xffffff, [1.2, 0.3]);
    barrel(L.yellow, -2.2, -3.2, 0xd8b030);
    barrel(L.yellow, -1.5, -3.4, 0xd8b030);
    barrel(L.yellow, 2.6, -3.3, 0xd8b030);
    coneLamp(L.dark, L.glow, 0, 3.3, -0.4, 0.34);
    coneLamp(L.dark, L.glow, 3.4, 3.3, 1.5, 0.3);
    L.door.at(-3.6, 0, -3.95, h => h.box(1.2, 2.3, 0.08, 0x55595e, { base: true }));
    texQuadZ(L.keepClosed, -2.6, 1.6, -3.94, 0.5, 0.75, 1, 0xffffff);
    texQuadX(L.keepOut, 1.0, 1.7, -4.98, 0.6, 0.9, 1, 0xffffff);
    L.dark.at(-3.6, 2.4, -3.9, h => h.box(1.4, 0.15, 0.2, 0x2a2c30));
    L.glow.at(-3.6, 1.1, -4.0, h => h.box(1.0, 2.1, 0.02, rgb(0xfff0d0, 1)));
    wallZ(L.dark, -12, -6, 0, 3, -8, 1, 0x30343a);
    return finish(r, L);
  }

  function buildHut(r) {
    const L = newLists(['planks', 'dark', 'glow', 'paper', 'metal']);
    floorY(L.planks, -3, -2.5, 3, 2.5, 0, 0xc0a080, [1.5, 1.5]);
    wallHoles(L.planks, -3, 3, 0, 2.6, -2.5, 'z', 1, [[-1.6, -0.6, 1.0, 1.9], [0.8, 1.8, 1.0, 1.9]], 0xd0b090, [1.5, 1.5]);
    [-1.1, 1.3].forEach(x => {
      for (let i = 0; i < 7; i++) L.dark.at(x, 1.06 + i * 0.13, -2.47, h => h.box(1.0, 0.045, 0.02, 0x3a2a1a));
    });
    wallHoles(L.planks, -2.5, 2.5, 0, 2.6, 3, 'x', -1, [[-0.6, 0.4, 0.9, 1.9]], 0xc8a888, [1.5, 1.5]);
    wallX(L.planks, -2.5, 2.5, 0, 2.6, -3, 1, 0xc8a888, [1.5, 1.5]);
    wallZ(L.planks, -3, 3, 0, 2.6, 2.5, -1, 0xd0b090, [1.5, 1.5]);
    for (let i = 0; i < 7; i++) L.dark.at(-3 + i, 2.6, 0, h => h.box(0.12, 0.14, 5.0, 0x4a3420));
    floorY(L.planks, -3, -2.5, 3, 2.5, 2.74, 0x8a6a4a, [1.5, 1.5], true);
    L.glow.at(-1.1, 1.45, -2.56, h => h.box(1.0, 0.9, 0.02, rgb(0xfff4dc, 1)));
    L.glow.at(1.3, 1.45, -2.56, h => h.box(1.0, 0.9, 0.02, rgb(0xfff4dc, 1)));
    L.glow.at(3.06, 1.4, -0.1, h => h.box(0.02, 1.0, 1.0, rgb(0xfff4dc, 1)));
    L.dark.at(0.6, 0, 1.2, h => {
      h.at(0, 0.74, 0, q => q.box(1.4, 0.05, 0.8, 0x6a4a2c));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => h.at(x * 0.62, 0.36, z * 0.34, q => q.box(0.05, 0.72, 0.05, 0x5a3c22)));
    });
    [[0.3, 1.1, 0.2], [0.75, 1.3, -0.3], [1.0, 1.05, 0.5]].forEach(([x, z, a]) => L.paper.at(x, 0.768, z, h => { h.push(M4.rotY(a), M4.rotX(-PI / 2)); texQuadZ(h, 0, 0, 0, 0.3, 0.4, 1, 0xffffff); h.pop(); }));
    L.dark.at(-2.2, 0, 1.6, h => h.box(0.5, 0.45, 0.5, 0x5a3c22, { base: true }));
    L.metal.at(-2.7, 0, -1.6, h => { h.push(M4.rotX(0.15)); h.box(0.06, 1.25, 0.08, 0x3a2a1a, { base: true }); h.pop(); });
    return finish(r, L);
  }

  function buildMedic(r) {
    const L = newLists(['concrete', 'dark', 'metal', 'tiles', 'glow', 'restricted', 'intel', 'crate', 'wall']);
    floorY(L.tiles, -5, -4, 5, 4, 0, 0x3c4a46, [1.0, 1.0]);
    wallZ(L.wall, -5, 5, 0, 3.5, -2, 1, 0xffffff, [2.4, 3.5]);
    wallX(L.dark, -4, 4, 0, 3.5, -3, 1, 0x3a4044);
    wallX(L.dark, -4, 4, 0, 3.5, 3, -1, 0x3a4044);
    floorY(L.dark, -5, -4, 5, 4, 3.5, 0x1e2224, null, true);
    L.metal.at(1.6, 0, -1.9, h => h.box(1.6, 2.6, 0.3, 0x5a6064, { base: true }));
    L.metal.at(1.6, 1.3, -1.74, h => { h.push(M4.rotX(PI / 2)); h.prism(24, 0.6, 0.6, 0, 0.6, 0.6, 0.08, 0x7a8288); h.pop(); });
    L.metal.at(1.6, 1.3, -1.64, h => { h.push(M4.rotX(PI / 2)); h.prism(16, 0.12, 0.12, 0, 0.12, 0.12, 0.08, 0x4a5054); h.pop(); });
    texQuadZ(L.restricted, -0.6, 2.2, -1.99, 0.9, 0.45, 1, 0xffffff);
    texQuadX(L.intel, 1.0, 1.9, 2.99, 1.2, 0.3, -1, 0xffffff);
    coneLamp(L.dark, L.glow, 0, 3.0, 0, 0.32);
    coneLamp(L.dark, L.glow, 2.4, 3.0, 1.5, 0.28);
    L.crate.at(-0.8, 2.4, 0.4, h => h.box(0.7, 0.6, 0.7, 0xffffff, { base: true }));
    pipe(L.metal, [-0.8, 3.0, 0.4], [-0.8, 3.5, 0.4], 0.012, 0x9a8a62, 6);
    L.dark.at(-1.6, 0.25, 0.9, h => { h.push(M4.rotZ(0.8)); h.prism(10, 0.06, 0.06, 0, 0.06, 0.06, 0.28, 0x5a5e62); h.pop(); });
    return finish(r, L);
  }

  function build(r) {
    return { alarm: buildAlarm(r), stairs: buildStairs(r), base: buildBase(r), sentry: buildSentry(r), hut: buildHut(r), medic: buildMedic(r) };
  }

  const SIGN = { spec: [0, 1], rim: 0 };
  const LOOKS = {
    alarm: {
      concrete: ['concrete', WALL], dark: [null, WALL], metal: [null, METAL], glow: [null, GLOW], signA: ['signA', SIGN], signB: ['signB', SIGN], signC: ['signC', SIGN],
      board: ['board', SIGN], console: ['console', SIGN], plate: [null, METAL]
    },
    stairs: { concrete: ['concrete', WALL], dark: [null, WALL], metal: [null, METAL], stairs: ['stairs', WALL], glow: [null, GLOW], wall: ['concrete', WALL] },
    base: {
      wall: ['bluWall', WALL], dark: [null, WALL], metal: [null, METAL], tiles: ['tiles', WALL], glow: [null, GLOW], map: ['map', { spec: [0.05, 6], rim: 0.1 }],
      poster: ['poster', WALL], notice: ['notice', WALL], cabinet: ['cabinet', WALL], doorSign: ['doorSign', WALL], keypad: ['keypad', SIGN], trim: [null, METAL], lights: [null, GLOW],
      desk: [null, { spec: [0.25, 14], rim: 0.3 }]
    },
    sentry: {
      concrete: ['concrete', WALL], dark: ['darkWall', WALL], metal: [null, METAL], hazard: ['hazard', WALL], glow: [null, GLOW], keepClosed: ['keepClosed', WALL], keepOut: ['keepOut', WALL],
      yellow: [null, METAL], door: ['metal', METAL]
    },
    hut: { planks: ['planks', WALL], dark: [null, WALL], glow: [null, GLOW], paper: ['paper', WALL], metal: [null, METAL] },
    medic: {
      concrete: ['concrete', WALL], dark: ['darkWall', WALL], metal: ['metal', METAL], tiles: ['tiles', WALL], glow: [null, GLOW], restricted: ['restricted', WALL], intel: ['intel', SIGN],
      crate: ['crate', WALL], wall: ['concrete', WALL]
    }
  };

  function draw(fx, W, name, T, opts) {
    const o = opts || {};
    const set = W[name];
    const look = LOOKS[name];
    Object.keys(set).forEach(k => {
      if (o.skip && o.skip.includes(k)) return;
      if (o.only && !o.only.includes(k)) return;
      const [tex, mat] = look[k];
      const pass = Object.assign({}, mat);
      if (tex) pass.texture = T(tex);
      if (o.tint) pass.tint = o.tint;
      if (o.glow !== undefined && k === 'glow') pass.tint = o.glow;
      fx.draw(set[k], null, pass);
    });
  }

  const DOOR_REST = M4.chain(M4.translate(DOOR_X + 0.03, 1.05, 0), M4.rotY(PI / 2));

  function keypadM(doorM) {
    return M4.chain(doorM || DOOR_REST, M4.translate(-0.3, 0.33, -0.035), M4.rotY(PI));
  }

  function keyPoint(u, v) {
    return M4.point(keypadM(), [(u - 0.5) * 0.075, (v - 0.5) * 0.1, 0.0112]);
  }

  window.MspSets = { build, draw, ROOM, TABLE, DOOR_X, DOOR_REST, keypadM, keyPoint, texQuadZ, texQuadX };
})();
