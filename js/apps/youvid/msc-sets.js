(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp } = K;

  const WALL = { spec: [0.04, 4], rim: 0.25 };
  const METAL = { spec: [0.35, 16], rim: 0.4 };
  const GLOW = { spec: [0, 1], rim: 0, noFog: false };

  function quadT(b, p0, p1, p2, p3, col, tile) {
    const w = V3.len(V3.sub(p1, p0)), h = V3.len(V3.sub(p3, p0));
    const tu = tile ? w / tile[0] : 1, tv = tile ? h / tile[1] : 1;
    const n = V3.norm(V3.cross(V3.sub(p1, p0), V3.sub(p3, p0)));
    b.quad(p0, p1, p2, p3, col, [[0, 0], [tu, 0], [tu, tv], [0, tv]], [n, n, n, n]);
  }

  function wallZ(b, x0, x1, y0, y1, z, facing, col, tile) {
    if (facing > 0) quadT(b, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, tile);
    else quadT(b, [x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], col, tile);
  }

  function wallX(b, z0, z1, y0, y1, x, facing, col, tile) {
    if (facing > 0) quadT(b, [x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], col, tile);
    else quadT(b, [x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], col, tile);
  }

  function floorY(b, x0, z0, x1, z1, y, col, tile, down) {
    if (down) quadT(b, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], col, tile);
    else quadT(b, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col, tile);
  }

  function boxT(b, cx, cy, cz, sx, sy, sz, col, tile, skip) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy, y1 = cy + sy, z0 = cz - sz / 2, z1 = cz + sz / 2;
    const s = skip || {};
    if (!s.front) wallZ(b, x0, x1, y0, y1, z1, 1, col, tile);
    if (!s.back) wallZ(b, x0, x1, y0, y1, z0, -1, col, tile);
    if (!s.right) wallX(b, z0, z1, y0, y1, x1, 1, col, tile);
    if (!s.left) wallX(b, z0, z1, y0, y1, x0, -1, col, tile);
    if (!s.top) floorY(b, x0, z0, x1, z1, y1, col, tile);
    if (!s.bottom) floorY(b, x0, z0, x1, z1, y0, col, tile, true);
  }

  function wallWithHoles(b, x0, x1, y0, y1, z, facing, holes, col, tile) {
    const xs = [x0, x1], ys = [y0, y1];
    holes.forEach(h => { xs.push(h[0], h[1]); ys.push(h[2], h[3]); });
    const ux = [...new Set(xs)].sort((a, c) => a - c), uy = [...new Set(ys)].sort((a, c) => a - c);
    for (let i = 0; i < ux.length - 1; i++) {
      for (let j = 0; j < uy.length - 1; j++) {
        const cx = (ux[i] + ux[i + 1]) / 2, cy = (uy[j] + uy[j + 1]) / 2;
        if (holes.some(h => cx > h[0] && cx < h[1] && cy > h[2] && cy < h[3])) continue;
        const a = ux[i], c = ux[i + 1], lo = uy[j], hi = uy[j + 1];
        const uv = (x, y) => [x / tile[0], y / tile[1]];
        const n = [0, 0, facing];
        if (facing > 0) b.quad([a, lo, z], [c, lo, z], [c, hi, z], [a, hi, z], col, [uv(a, lo), uv(c, lo), uv(c, hi), uv(a, hi)], [n, n, n, n]);
        else b.quad([c, lo, z], [a, lo, z], [a, hi, z], [c, hi, z], col, [uv(-c, lo), uv(-a, lo), uv(-a, hi), uv(-c, hi)], [n, n, n, n]);
      }
    }
  }

  function pipe(b, from, to, r, col, sides) {
    K.tube(b, [from, to], [r, r], sides || 8, col);
  }

  function railing(b, x0, x1, z, y, h, col, posts) {
    pipe(b, [x0, y + h, z], [x1, y + h, z], 0.035, col);
    pipe(b, [x0, y + h * 0.5, z], [x1, y + h * 0.5, z], 0.025, col);
    const n = posts || Math.max(2, Math.round(Math.abs(x1 - x0) / 1.4));
    for (let i = 0; i <= n; i++) {
      const x = lerp(x0, x1, i / n);
      pipe(b, [x, y, z], [x, y + h, z], 0.03, col);
    }
  }

  function lampShade(b, x, y, z, facing) {
    b.at(x, y, z, h => {
      h.at(0, 0.38, -facing * 0.02, q => q.box(0.06, 0.6, 0.06, 0x2e2e32));
      h.at(0, 0.66, facing * 0.14, q => q.box(0.05, 0.05, 0.3, 0x2e2e32));
      h.at(0, 0.0, facing * 0.28, q => q.prism(12, 0.17, 0.17, -0.08, 0.13, 0.13, 0.18, rgb(0xf2ead2, 0.95), { capBottom: true }));
    });
  }

  function hangingLamp(b, x, y, z) {
    b.at(x, y, z, h => {
      h.at(0, 0.3, 0, q => q.box(0.02, 0.6, 0.02, 0x2a2a2a));
      h.prism(16, 0.34, 0.34, -0.04, 0.04, 0.04, 0.16, 0x3a3a3c, { capBottom: false });
      h.at(0, -0.035, 0, q => q.prism(16, 0.3, 0.3, 0, 0.3, 0.3, 0.004, rgb(0xfff4dc, 0.95)));
    });
  }

  function windowRoom(list, x, y, z, w, h, d) {
    const add = (k, fn) => fn(list[k]);
    add('plaster', q => {
      wallZ(q, x - w / 2, x + w / 2, y, y + h, z + d, -1, 0xd8ccb8, [2, 2]);
      wallX(q, z, z + d, y, y + h, x - w / 2, 1, 0xc8bca8, [2, 2]);
      wallX(q, z, z + d, y, y + h, x + w / 2, -1, 0xc8bca8, [2, 2]);
      floorY(q, x - w / 2, z, x + w / 2, z + d, y + h, 0xb0a490, [2, 2], true);
    });
    add('dark', q => {
      floorY(q, x - w / 2, z, x + w / 2, z + d, y, 0x6a5a4a);
      q.at(x, y + h - 0.02, z, r => r.box(w + 0.2, 0.1, 0.12, 0x4a4248));
      q.at(x, y - 0.06, z - 0.05, r => r.box(w + 0.24, 0.12, 0.2, 0x56525a));
      [x - w / 2 - 0.05, x + w / 2 + 0.05].forEach(px => q.at(px, y + h / 2, z, r => r.box(0.1, h + 0.1, 0.12, 0x4a4248)));
    });
    hangingLamp(list.dark, x, y + h - 0.65, z + d * 0.55);
  }

  function bars(b, x0, x1, y0, y1, z, step, col) {
    for (let x = x0; x <= x1 + 1e-6; x += step) b.at(x, (y0 + y1) / 2, z, h => h.box(0.04, y1 - y0, 0.04, col));
  }

  function finish(r, list) {
    const out = {};
    Object.keys(list).forEach(k => {
      const b = list[k];
      if (b.count) out[k] = r.mesh(b);
    });
    return out;
  }

  function newLists(keys) {
    const { Builder } = window.P3D;
    const o = {};
    keys.forEach(k => { o[k] = new Builder(); });
    return o;
  }

  function buildBase(r) {
    const L = newLists(['brick', 'concrete', 'plaster', 'dark', 'metal', 'blueWall', 'warm', 'glow', 'room', 'pool']);
    floorY(L.concrete, -40, 0, 40, 44, 0, 0xa8a49e, [4, 4]);
    floorY(L.room, -6, -8, 6, 0.02, 0, 0x5a544e, null);
    wallX(L.room, -8, 0, 0, 4, -6, 1, 0x3a2622);
    wallX(L.room, -8, 0, 0, 4, 6, -1, 0x3a2622);
    wallZ(L.room, -6, 6, 0, 4, -8, 1, 0x34221e);
    floorY(L.room, -6, -8, 6, 0, 4, 0x2a1c1a, null, true);
    wallWithHoles(L.room, -6, 6, 0, 4, -0.05, -1, [[-2.4, 2.4, 0, 3.0]], 0x3a2824, [4, 4]);
    floorY(L.room, -2.4, -0.05, 2.4, 0.0, 3.0, 0x2a2a2c, null, true);
    wallWithHoles(L.blueWall, -14, 14, 0, 7, 0.0, 1, [[-2.4, 2.4, 0, 3.0]], 0xffffff, [3.5, 3.5]);
    [-2.45, 2.45].forEach(x => L.metal.at(x, 1.55, 0.05, h => h.box(0.1, 3.1, 0.1, 0xb8b8b4)));
    L.metal.at(0, 3.08, 0.05, h => h.box(5.0, 0.16, 0.12, 0x9a9a96));
    [-1.6, 0, 1.6].forEach(x => lampShade(L.glow, x * 2.4, 4.6, 0.0, 1));
    L.metal.at(-4.0, 3.6, 0.03, h => h.box(0.5, 0.5, 0.02, 0x6e2a24));
    L.metal.at(4.2, 1.9, 0.03, h => h.box(0.8, 0.6, 0.02, 0xd8c040));
    wallWithHoles(L.brick, -40, 40, 0, 13, 24, -1, [[4.7, 7.3, 2.4, 4.9], [-0.3, 2.3, 2.6, 5.1], [-5.0, -3.2, 2.6, 5.0], [4.4, 5.6, 9.0, 11.2], [-7.6, -6.0, 9.0, 11.2]], 0xffffff, [3.2, 3.2]);
    windowRoom(L, 6.0, 2.4, 24, 2.6, 2.5, 2.4);
    windowRoom(L, 1.0, 2.6, 24, 2.6, 2.5, 2.4);
    windowRoom(L, -4.1, 2.6, 24, 1.8, 2.4, 2.0);
    [[4.4, 5.6, 9.0, 11.2], [-7.6, -6.0, 9.0, 11.2]].forEach(([a, c, lo, hi]) => {
      L.dark.at((a + c) / 2, (lo + hi) / 2, 24.3, h => h.box(c - a, hi - lo, 0.4, 0x2a2a30));
      bars(L.metal, a + 0.4, c - 0.4, lo, hi, 23.95, 0.4, 0x55555a);
      L.metal.at((a + c) / 2, (lo + hi) / 2, 23.95, h => h.box(c - a, 0.06, 0.06, 0x55555a));
    });
    [3.6, -1.9, -5.6].forEach(x => {
      lampShade(L.glow, x, 5.6, 24, -1);
      L.pool.quad([x + 1.5, 2.6, 23.94], [x - 1.5, 2.6, 23.94], [x - 1.5, 6.2, 23.94], [x + 1.5, 6.2, 23.94], 0xffffff, [[0, 0], [1, 0], [1, 1.25], [0, 1.25]], [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
    });
    L.dark.at(3.6, 4.0, 23.97, h => h.box(1.0, 0.9, 0.06, 0x4a4a52));
    L.dark.at(0, 6.85, 23.0, h => h.box(80, 0.3, 2.0, 0x7e7a84));
    L.dark.at(0, 12.9, 23.7, h => h.box(80, 0.4, 0.6, 0x7e7a84));
    L.metal.at(-12.3, 6.2, 23.9, h => h.box(1.2, 0.5, 0.06, 0x5a86b0));
    floorY(L.concrete, -26, 14, -11, 23.7, 1.6, 0x8c8882, [4, 4]);
    L.dark.at(-18.5, 0.8, 14.0, h => h.box(15, 1.6, 0.2, 0x5a5650));
    railing(L.metal, -26, -11, 14.1, 1.6, 1.0, 0x3a3a3c);
    wallZ(L.warm, -30, -11, 1.6, 9, 23.6, -1, 0xffffff, [3, 3]);
    L.dark.at(-14, 5.0, 23.5, h => h.box(2.2, 2.2, 0.05, 0x8a6a4a));
    [0, 1, 2, 3].forEach(i => L.dark.at(-10.6 + i * 0.35, 0.2 + i * 0.4, 13.0, h => h.box(0.35, 0.4, 2.2, 0x6a6660)));
    L.metal.at(14, 0.55, 18.0, h => h.box(12, 0.3, 2.6, 0x4a4a4e));
    [18, 10].forEach(x => [-1, 1].forEach(s => L.metal.at(x, 0.25, 18.0 + s * 0.9, h => { h.push(M4.rotZ(PI / 2)); h.prism(12, 0.35, 0.35, -0.12, 0.35, 0.35, 0.12, 0x2a2a2c, { capBottom: true }); h.pop(); })));
    [0, 1, 2].forEach(i => L.metal.at(-15 - i * 0.8, 0.4 + (i === 2 ? 0.7 : 0), 6.0 - (i === 2 ? 0.4 : 0), h => { h.push(M4.rotX(PI / 2)); h.prism(16, 0.4, 0.4, -1.2, 0.4, 0.4, 1.2, 0xc8c4bc, { capBottom: true }); h.pop(); }));
    L.dark.at(-4.4, 0.18, 21.6, h => { h.push(M4.rotX(-0.32)); h.box(1.4, 0.06, 2.4, 0x7a5a40); h.pop(); });
    return finish(r, L);
  }

  function buildYard(r) {
    const L = newLists(['brick', 'brickWarm', 'concrete', 'ties', 'dark', 'metal', 'fence', 'yellow', 'container', 'sky']);
    floorY(L.concrete, -40, -60, 40, 60, 0, 0xa09c94, [4, 4]);
    [0, 4.2].forEach(x => {
      floorY(L.ties, x - 1.4, -60, x + 1.4, 60, 0.02, 0xffffff, [2.8, 2.8]);
      [-0.72, 0.72].forEach(dx => L.metal.at(x + dx, 0.09, 0, h => h.box(0.08, 0.14, 120, 0x6a645c)));
    });
    [-1.6, 2.2, 6.0].forEach(x => floorY(L.ties, x - 0.6, -60, x + 0.6, 60, 0.015, 0xb8b0a4, [1.2, 6]));
    wallX(L.fence, -60, 60, 0, 3.2, -3.4, 1, 0xffffff, [1.2, 1.2]);
    wallX(L.fence, -60, 60, 0, 3.2, -3.4, -1, 0xffffff, [1.2, 1.2]);
    for (let z = -60; z <= 60; z += 3) pipe(L.metal, [-3.4, 0, z], [-3.4, 3.3, z], 0.04, 0x8a8a8a, 6);
    pipe(L.metal, [-3.4, 3.25, -60], [-3.4, 3.25, 60], 0.03, 0x8a8a8a, 6);
    wallX(L.brick, -60, 60, 0, 9, -9, 1, 0xffffff, [3.2, 3.2]);
    wallX(L.brickWarm, -60, 60, 0, 14, -16, 1, 0xffffff, [3.2, 3.2]);
    const g = rand(201);
    for (let i = 0; i < 9; i++) {
      const z = -50 + i * 12;
      L.dark.at(-8.95, 3 + g() * 3, z, h => h.box(0.06, 1.4, 1.2, 0x3a3a42));
    }
    [[4.2, -8, 14], [4.2, 9, 14]].forEach(([x, z, len]) => {
      L.container.at(x, 1.15, z, h => h.box(2.8, 2.9, len, 0xffffff, { uvScale: 0.25 }));
      L.dark.at(x, 0.62, z, h => h.box(2.4, 0.5, len * 0.92, 0x26262a));
      [-1, 1].forEach(s => [-1, 1].forEach(e => L.dark.at(x + s * 0.72, 0.42, z + e * (len / 2 - 2), q => { q.push(M4.rotZ(PI / 2)); q.prism(12, 0.36, 0.36, -0.08, 0.36, 0.36, 0.08, 0x2a2a2c, { capBottom: true }); q.pop(); })));
    });
    [[2.25, -14], [2.25, -4], [2.25, 6], [2.25, 16], [-1.9, 2], [-1.9, 12]].forEach(([x, z]) => {
      L.yellow.at(x, 1.4, z, h => h.box(0.32, 2.8, 0.32, 0xe0b02a));
      L.dark.at(x, 0.15, z, h => h.box(0.36, 0.3, 0.36, 0x2a2a2c));
    });
    [[-2.6, 3.4], [-2.6, 4.4], [-2.4, 13.6]].forEach(([x, z], i) => {
      for (let k = 0; k < 3 + (i % 2); k++) L.dark.at(x, 0.12 + k * 0.24, z, h => h.prism(16, 0.42, 0.42, -0.11, 0.42, 0.42, 0.11, k % 2 ? 0x2c2c2e : 0x343436, { capBottom: true }));
    });
    L.dark.at(-1.0, 0.55, -18, h => h.box(1.4, 1.1, 2.2, 0x2a2a2c));
    L.brick.at(9.0, 0, 26, h => h.box(6, 5.2, 9, 0xffffff, { base: true, uvScale: 0.3 }));
    L.metal.at(9.0, 5.25, 26, h => h.box(6.2, 0.2, 9.2, 0x8a3a2a));
    [0.22, 0.42, 0.62, 0.8].forEach(y => pipe(L.metal, [0.95, y, 14], [0.95, y, 24], 0.018, 0x8a8a8e, 8));
    for (let z = 14; z <= 24; z += 2.5) pipe(L.metal, [0.95, 0, z], [0.95, 0.84, z], 0.02, 0x8a8a8e, 6);
    [[-3.48, 2.2, 23.5], [-3.48, 2.2, 27], [-3.48, 2.2, 29]].forEach(([x, y, z]) => L.dark.at(x, y, z, h => h.box(0.04, 1.0, 0.7, 0x2c2c32)));
    L.sky.at(0, 30, 0, h => h.box(400, 120, 400, [1, 1, 1, 1], { faces: { top: null } }));
    return finish(r, L);
  }

  function buildHall(r) {
    const L = newLists(['plaster', 'concrete', 'dark', 'metal', 'yellow', 'loco', 'sign', 'sign2', 'outside', 'glow']);
    floorY(L.concrete, -12, -12, 12, 14, 0, 0x8c8882, [3, 3]);
    wallWithHoles(L.plaster, -12, 12, 0, 8, -10, 1, [[-1.6, 1.6, 0, 3.6]], 0xffffff, [4, 4]);
    wallX(L.plaster, -10, 14, 0, 8, -9, 1, 0xffffff, [4, 4]);
    wallX(L.plaster, -10, 14, 0, 8, 9, -1, 0xffffff, [4, 4]);
    wallZ(L.plaster, -12, 12, 0, 8, 14, -1, 0xffffff, [4, 4]);
    floorY(L.dark, -12, -10, 12, 14, 8, 0x4a4440, null, true);
    floorY(L.outside, -6, -24, 6, -10, 0, 0xc8c4bc, [4, 4]);
    wallZ(L.outside, -8, 8, 0, 9, -22, 1, 0xd8d4cc, [4, 4]);
    for (let i = 0; i < 6; i++) L.yellow.at(-0.6, 0.3 + i * 0.6, -14, h => h.box(1.0, 0.06, 0.06, 0xd8a82a));
    [-1.1, -0.1].forEach(x => L.yellow.at(x, 1.8, -14, h => h.box(0.08, 3.6, 0.08, 0xd8a82a)));
    for (let i = 0; i < 14; i++) {
      const y = 0.25 + i * 0.25, z = -9.5 + i * 0.42;
      L.metal.at(-3.6, y, z, h => h.box(1.2, 0.06, 0.4, 0x4a4a4e));
    }
    L.metal.at(-3.6, 1.85, -6.6, h => { h.push(M4.rotX(-0.54)); h.box(1.24, 0.1, 6.9, 0x3a3a3e); h.pop(); });
    pipe(L.metal, [-3.0, 1.2, -9.5], [-3.0, 4.7, -3.6], 0.03, 0x2a2a2c);
    L.plaster.at(-3.6, 0, -7.0, h => h.box(1.2, 0.9, 6.0, 0xb8a890, { base: true, uvScale: 0.5 }));
    [[-1.6, -1.5], [4, -4], [-4, 4], [4, 4]].forEach(([x, z]) => L.plaster.at(x, 0, z, h => h.box(0.8, 8, 0.8, 0xe8e0d0, { base: true, uvScale: 0.5 })));
    L.sign.at(0, 4.0, -9.97, h => h.box(2.0, 0.5, 0.04, 0xffffff));
    L.sign2.at(5.0, 2.9, 13.95, h => h.box(1.8, 0.45, 0.04, 0xffffff));
    L.dark.at(-8.97, 6.2, 4, h => h.box(0.04, 1.4, 2.4, 0x3a3a40));
    L.loco.at(5.5, 0, 8, h => h.box(3.0, 3.4, 9, 0xffffff, { base: true }));
    L.dark.at(5.5, 0.35, 8, h => h.box(2.6, 0.7, 9.4, 0x26262a));
    L.loco.at(5.5, 3.4, 10.3, h => h.box(2.6, 0.9, 3.6, 0xffffff, { base: true }));
    L.metal.at(5.5, 1.3, 3.4, h => h.box(3.1, 0.12, 0.2, 0x3a3a3c));
    railing(L.metal, 4.0, 7.0, 3.3, 1.2, 0.9, 0x2a2a2c, 3);
    [4.6, 6.4].forEach(x => [5.0, 11.0].forEach(z => L.dark.at(x, 0.42, z, h => { h.push(M4.rotZ(PI / 2)); h.prism(12, 0.42, 0.42, -0.1, 0.42, 0.42, 0.1, 0x1e1e20, { capBottom: true }); h.pop(); })));
    L.dark.at(-6.0, 3.6, 12.0, h => h.box(6.0, 0.25, 4.0, 0x4a4a4e));
    railing(L.metal, -9, -3, 10.0, 3.73, 1.0, 0x2a2a2c);
    [-1.5, 1.5].forEach(x => lampShade(L.glow, x * 3, 6.6, -9.95, 1));
    return finish(r, L);
  }

  function buildLocker(r) {
    const L = newLists(['wall', 'concrete', 'lockers', 'dark', 'wood', 'poster']);
    floorY(L.concrete, -8, -2, 8, 8, 0, 0x8a8680, [3, 3]);
    wallZ(L.wall, -8, 8, 0, 5, 0, 1, 0xffffff, [2.5, 2.5]);
    wallX(L.wall, 0, 8, 0, 5, -8, 1, 0xffffff, [2.5, 2.5]);
    wallX(L.wall, 0, 8, 0, 5, 8, -1, 0xffffff, [2.5, 2.5]);
    floorY(L.dark, -8, 0, 8, 8, 5, 0xd8d4cc, null, true);
    L.lockers.at(-5.3, 0, 0.3, h => h.box(2.4, 2.1, 0.55, 0xffffff, { base: true }));
    L.dark.at(-5.3, 2.12, 0.3, h => h.box(2.44, 0.06, 0.58, 0x8a8c88));
    L.wood.at(-6.9, 0, 0.4, h => h.box(0.36, 5, 0.36, 0x6a4430, { base: true }));
    L.dark.at(-6.6, 0, 1.6, h => h.box(0.9, 0.45, 0.35, 0x5a4a3a, { base: true }));
    L.poster.at(0.1, 1.85, 0.02, h => h.quad([-1.92, -1.08, 0], [1.92, -1.08, 0], [1.92, 1.08, 0], [-1.92, 1.08, 0], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    return finish(r, L);
  }

  function buildLot(r) {
    const L = newLists(['concrete', 'container', 'corrugated', 'fence', 'dark', 'metal', 'brick', 'redLogo', 'sky', 'glow', 'wood']);
    floorY(L.concrete, -40, -40, 40, 40, 0, 0x9a968e, [4, 4]);
    [[-2.5, 6.2], [3.8, 6.2]].forEach(([x, z]) => L.container.at(x, 0, z, h => h.box(6.0, 2.6, 2.5, 0xffffff, { base: true, uvScale: 0.3 })));
    L.container.at(-2.5, 2.62, 6.2, h => h.box(6.0, 2.6, 2.5, 0xd8dce4, { base: true, uvScale: 0.3 }));
    L.corrugated.at(9.5, 0, 4.0, h => h.box(5.0, 5.2, 2.5, 0xffffff, { base: true, uvScale: 0.3 }));
    wallZ(L.corrugated, -30, 30, 0, 10, 14, -1, 0xd0d4dc, [3, 3]);
    L.dark.at(0, 9.8, 13.7, h => h.box(60, 0.4, 0.6, 0x4a4c52));
    [-12, -4, 4, 12].forEach(x => lampShade(L.glow, x, 7.6, 14, -1));
    pipe(L.metal, [-30, 8.6, 13.6], [30, 8.6, 13.6], 0.12, 0x5a5c62, 10);
    pipe(L.metal, [-30, 8.2, 13.6], [30, 8.2, 13.6], 0.09, 0x6a6c72, 10);
    L.wood.at(0.5, 0, 9.65, h => h.box(1.0, 0.62, 0.8, 0x6a5040, { base: true }));
    L.wood.at(-0.65, 0, 11.0, h => h.box(1.3, 1.5, 1.3, 0x5e4636, { base: true }));
    L.wood.at(-0.65, 1.5, 11.0, h => h.box(1.32, 0.04, 1.32, 0x4a3a2c, { base: true }));
    wallZ(L.fence, -24, -1.6, 0, 4.2, -5.0, 1, 0xffffff, [1.2, 1.2]);
    wallZ(L.fence, -24, -1.6, 0, 4.2, -5.0, -1, 0xffffff, [1.2, 1.2]);
    for (let x = -24; x <= -1.6; x += 3) pipe(L.metal, [x, 0, -5.0], [x, 4.3, -5.0], 0.05, 0x7a7a7a, 6);
    pipe(L.metal, [-24, 4.25, -5.0], [-1.6, 4.25, -5.0], 0.035, 0x7a7a7a, 6);
    pipe(L.metal, [-1.6, 0, -5.0], [-1.6, 4.6, -5.0], 0.07, 0x6a6a6a, 6);
    L.container.at(1.5, 0, -6.3, h => h.box(6.0, 2.6, 2.5, 0xa8b8d8, { base: true, uvScale: 0.3 }));
    L.container.at(1.5, 2.62, -6.3, h => h.box(6.0, 2.6, 2.5, 0x98a8c8, { base: true, uvScale: 0.3 }));
    L.dark.at(1.5, 5.3, -5.6, h => h.box(6.4, 0.3, 1.4, 0x3a3c42));
    L.brick.at(-12, 0, -16, h => h.box(14, 9, 8, 0xffffff, { base: true, uvScale: 0.3 }));
    L.brick.at(-26, 0, -12, h => h.box(10, 7, 10, 0xffffff, { base: true, uvScale: 0.3 }));
    L.dark.at(-12, 9.1, -16, h => h.box(14.2, 0.3, 8.2, 0x6a3a2c));
    L.redLogo.at(3.4, 4.3, -5.0, h => h.quad([-0.75, -0.75, 0], [0.75, -0.75, 0], [0.75, 0.75, 0], [-0.75, 0.75, 0], rgb(0xffffff, 0.7), [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    L.sky.at(0, 30, 0, h => h.box(400, 120, 400, [1, 1, 1, 1], { faces: { top: null } }));
    return finish(r, L);
  }

  function build(r) {
    return { base: buildBase(r), yard: buildYard(r), hall: buildHall(r), locker: buildLocker(r), lot: buildLot(r), tex: {} };
  }

  const LOOKS = {
    base: {
      brick: ['brick', WALL], concrete: ['concrete', WALL], plaster: ['plaster', WALL], dark: [null, WALL], metal: [null, METAL], blueWall: ['corrugated', WALL],
      warm: ['brickWarm', WALL], glow: [null, GLOW], room: [null, WALL], pool: ['glow', { additive: true, alpha: 0.32, noFog: true, tint: [1, 0.94, 0.82] }]
    },
    yard: {
      brick: ['brick', WALL], brickWarm: ['brickWarm', WALL], concrete: ['concrete', WALL], ties: ['ties', WALL], dark: [null, WALL], metal: [null, METAL],
      fence: ['fence', Object.assign({ backDark: false }, METAL)], yellow: [null, METAL], container: ['container', WALL], sky: ['sky', { spec: [0, 1], rim: 0, noFog: true }]
    },
    hall: {
      plaster: ['plaster', WALL], concrete: ['concrete', WALL], dark: [null, WALL], metal: [null, METAL], yellow: [null, METAL], loco: [null, METAL],
      sign: ['controlPoint', WALL], sign2: ['watchStep', WALL], outside: ['brickWarm', WALL], glow: [null, GLOW]
    },
    locker: {
      wall: ['wallCream', WALL], concrete: ['concrete', WALL], lockers: ['lockers', METAL], dark: [null, WALL], wood: [null, WALL], poster: ['poster', { spec: [0.05, 6], rim: 0.1 }]
    },
    lot: {
      concrete: ['concrete', WALL], container: ['container', WALL], corrugated: ['corrugated', WALL], fence: ['fence', METAL], dark: [null, WALL], metal: [null, METAL],
      brick: ['brick', WALL], redLogo: ['redLogo', { spec: [0.2, 10], rim: 0 }], sky: ['sky', { spec: [0, 1], rim: 0, noFog: true }], glow: [null, GLOW], wood: [null, WALL]
    }
  };

  const LOCO = 0x8a4a2a;

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
      if (k === 'loco') pass.tint = rgb(LOCO).slice(0, 3);
      if (k === 'yellow') pass.tint = [1, 1, 1];
      if (o.tint) pass.tint = o.tint;
      fx.draw(set[k], null, pass);
    });
  }

  window.MscSets = { build, draw, quadT, boxT, wallZ, wallX, floorY, lampShade };
})();
