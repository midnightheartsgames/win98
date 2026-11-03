(function () {
  const { M4, V3, Builder, rgb, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C } = K;
  const Art = window.FabArt;
  const Cast = window.FabCast;

  const N_UP = [0, 1, 0];

  function groups() {
    const g = {};
    return {
      b(key) {
        if (!g[key]) g[key] = new Builder();
        return g[key];
      },
      done(r, extra) {
        return Object.entries(g).filter(([, b]) => b.count).map(([key, b]) => Object.assign({ mesh: r.mesh(b), tex: key === 'none' ? null : key.split('#')[0], key }, (extra || {})[key] || {}));
      }
    };
  }

  function floor(b, x0, z0, x1, z1, y, col, uv) {
    const u = uv || 0;
    const nx = Math.max(1, Math.ceil((x1 - x0) / 10)), nz = Math.max(1, Math.ceil((z1 - z0) / 10));
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const a0 = x0 + (x1 - x0) * i / nx, a1 = x0 + (x1 - x0) * (i + 1) / nx;
        const c0 = z0 + (z1 - z0) * j / nz, c1 = z0 + (z1 - z0) * (j + 1) / nz;
        b.quad([a0, y, c1], [a1, y, c1], [a1, y, c0], [a0, y, c0], col, u ? [[a0 * u, c1 * u], [a1 * u, c1 * u], [a1 * u, c0 * u], [a0 * u, c0 * u]] : null, [N_UP, N_UP, N_UP, N_UP]);
      }
    }
  }

  function ceil(b, x0, z0, x1, z1, y, col) {
    const n = [0, -1, 0];
    b.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], col, null, [n, n, n, n]);
  }

  function wall(b, a, c, y0, y1, col, uv) {
    const d = V3.sub(c, a);
    const len = Math.hypot(d[0], d[2]);
    const n = V3.norm([-d[2], 0, d[0]]);
    const uvs = uv ? (Array.isArray(uv) ? [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]] : [[0, y0 * uv], [len * uv, y0 * uv], [len * uv, y1 * uv], [0, y1 * uv]]) : null;
    b.quad([a[0], y0, a[2]], [c[0], y0, c[2]], [c[0], y1, c[2]], [a[0], y1, a[2]], col, uvs, [n, n, n, n]);
  }

  function block(b, x, y, z, sx, sy, sz, col, uv) {
    b.at(x, y, z, h => h.box(sx, sy, sz, col, uv ? { uvScale: uv } : {}));
  }

  function texBox(b, x, y, z, sx, sy, sz, col) {
    b.at(x, y, z, h => {
      const X = sx / 2, Y = sy / 2, Z = sz / 2;
      const one = [[0, 0], [1, 0], [1, 1], [0, 1]];
      h.quad([-X, -Y, Z], [X, -Y, Z], [X, Y, Z], [-X, Y, Z], col, one);
      h.quad([X, -Y, -Z], [-X, -Y, -Z], [-X, Y, -Z], [X, Y, -Z], col, one);
      h.quad([X, -Y, Z], [X, -Y, -Z], [X, Y, -Z], [X, Y, Z], col, one);
      h.quad([-X, -Y, -Z], [-X, -Y, Z], [-X, Y, Z], [-X, Y, -Z], col, one);
      h.quad([-X, Y, Z], [X, Y, Z], [X, Y, -Z], [-X, Y, -Z], col, one);
      h.quad([-X, -Y, -Z], [X, -Y, -Z], [X, -Y, Z], [-X, -Y, Z], col, one);
    });
  }

  function panel(b, x, y, z, w, h, yaw, col) {
    b.at(x, y, z, q => {
      q.push(M4.rotY(yaw));
      q.quad([-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], col || 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      q.pop();
    });
  }

  function cylinderHill(b, x, z, rad, hgt, seed) {
    const sides = 20;
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * PI * 2, a1 = ((i + 1) / sides) * PI * 2;
      const p0 = [x + S(a0) * rad, z + C(a0) * rad], p1 = [x + S(a1) * rad, z + C(a1) * rad];
      const n0 = [S(a0), 0, C(a0)], n1 = [S(a1), 0, C(a1)];
      const u0 = (i / sides) * rad * 0.8, u1 = ((i + 1) / sides) * rad * 0.8;
      b.quad([p0[0], 0, p0[1]], [p1[0], 0, p1[1]], [p1[0], hgt, p1[1]], [p0[0], hgt, p0[1]], 0xffffff, [[u0, 0], [u1, 0], [u1, hgt * 0.4], [u0, hgt * 0.4]], [n0, n1, n1, n0]);
    }
    const rings = 6;
    for (let j = 0; j < rings; j++) {
      const t0 = (j / rings) * PI / 2, t1 = ((j + 1) / rings) * PI / 2;
      for (let i = 0; i < sides; i++) {
        const a0 = (i / sides) * PI * 2, a1 = ((i + 1) / sides) * PI * 2;
        const pt = (a, t) => [x + S(a) * C(t) * rad, hgt + S(t) * rad, z + C(a) * C(t) * rad];
        const nn = (a, t) => [S(a) * C(t), S(t), C(a) * C(t)];
        const uv = (a, t) => [(a / (PI * 2)) * rad * 4.8, hgt * 0.4 + t * rad * 0.8];
        b.quad(pt(a0, t0), pt(a1, t0), pt(a1, t1), pt(a0, t1), 0xffffff, [uv(a0, t0), uv(a1, t0), uv(a1, t1), uv(a0, t1)], [nn(a0, t0), nn(a1, t0), nn(a1, t1), nn(a0, t1)]);
      }
    }
  }

  function cone(b, x, z, s) {
    b.at(x, 0, z, h => {
      h.push(M4.scale(s || 1, s || 1, s || 1));
      h.box(0.4, 0.03, 0.4, 0xe0602a, { base: true });
      h.at(0, 0.03, 0, q => q.prism(12, 0.13, 0.13, 0, 0.025, 0.025, 0.55, 0xf06a2c));
      h.at(0, 0.24, 0, q => q.prism(12, 0.088, 0.088, 0, 0.07, 0.07, 0.09, 0xf2f0ea, { capTop: false }));
      h.pop();
    });
  }

  const ZONES = { ambush: [-48, 0, -14], mush: [52, 0, -46], coin: [-52, 0, 32], gtr: [56, 0, 52], lessons: [66, 0, 4] };

  function buildZones(G, none) {
    const zp = (z, x, y, zz) => [ZONES[z][0] + x, y, ZONES[z][2] + zz];
    const grassAt = (z, x0, z0, x1, z1) => floor(G.b('grass#z'), ZONES[z][0] + x0, ZONES[z][2] + z0, ZONES[z][0] + x1, ZONES[z][2] + z1, 0.012, 0xffffff, 0.5);
    grassAt('ambush', -10, -10, 10, 8);
    let p = zp('ambush', 5, 3.4, -9.5);
    panel(G.b('spyCheck'), p[0], p[1], p[2] + 0.12, 7.6, 4.3, 0);
    block(none, p[0], p[1], p[2], 8.0, 4.7, 0.2, 0x1a1a1a);
    [-3.2, 3.2].forEach(dx => block(none, p[0] + dx, 0.6, p[2], 0.3, 1.2, 0.3, 0x2a2a2a));
    p = zp('ambush', -1.5, 1.4, -6);
    panel(G.b('xed#za'), p[0], p[1], p[2] + 0.05, 1.8, 0.9, 0);
    [-0.7, 0.7].forEach(dx => block(none, p[0] + dx, 0.5, p[2] - 0.02, 0.08, 1.0, 0.08, 0x3a2a1c));
    p = zp('ambush', -8, 6, -12);
    panel(G.b('hills#za'), p[0], p[1], p[2], 24, 12, 0.3);
    grassAt('mush', -10, -10, 10, 10);
    p = zp('mush', -6, 1.5, -3);
    block(G.b('redStuds#zm'), p[0], p[1], p[2], 3, 3, 3, 0xffffff, 0.25);
    p = zp('mush', 2.5, 1.5, -6);
    block(none, p[0], p[1], p[2], 4.5, 3, 1, 0xe2c82a);
    p = zp('mush', -1.6, 3.3, -6.4);
    panel(G.b('comic#zm'), p[0], p[1], p[2], 4.4, 3.4, 0);
    block(none, p[0], p[1], p[2] - 0.08, 4.6, 3.6, 0.1, 0x1a1a1a);
    grassAt('coin', -9, -3, 9, 9);
    p = zp('coin', 0, 3.4, -3.2);
    block(G.b('coins'), p[0], p[1], p[2], 16, 3.8, 0.4, 0xffffff, 0.25);
    p = zp('coin', 0, 0.75, -3.2);
    block(G.b('redStuds#zc'), p[0], p[1], p[2], 16.02, 1.5, 0.42, 0xffffff, 0.25);
    p = zp('coin', -2, 6.9, -3.05);
    panel(G.b('comic#zc'), p[0], p[1], p[2], 5.6, 3.6, 0);
    block(none, p[0], p[1], p[2] - 0.1, 5.8, 3.8, 0.1, 0x1a1a1a);
    p = zp('coin', 13, 2.2, -3.2);
    block(none, p[0], p[1], p[2], 8, 4.4, 0.4, 0xd8402a);
    block(none, p[0], 4.6, p[2] + 0.4, 8.2, 0.4, 1.2, 0xb8301e);
    panel(G.b('shutterWood'), p[0], 1.4, p[2] + 0.22, 3.6, 2.8, 0);
    panel(G.b('resupply#zc'), p[0], 3.25, p[2] + 0.23, 2.0, 0.5, 0);
    texBox(G.b('qblock#zc'), p[0] - 2.6, 3.6, p[2] + 0.8, 1.0, 1.0, 1.0, 0xffffff);
    floor(G.b('grass#zc2'), p[0] - 4, p[2], p[0] + 4, p[2] + 6, 0.013, 0xffffff, 0.5);
    grassAt('gtr', -10, -8, 12, 10);
    p = zp('gtr', 0, 4.3, -2.6);
    panel(G.b('cinema'), p[0], p[1], p[2] + 0.12, 7.2, 4.05, 0);
    block(none, p[0], p[1], p[2], 7.6, 4.4, 0.2, 0x141414);
    [-3.4, 3.4].forEach(dx => {
      block(none, p[0] + dx, 1.05, p[2], 0.25, 2.1, 0.25, 0x2a2a2a);
      for (let i = 0; i < 4; i++) block(none, p[0] + dx, 0.25 + i * 0.5, p[2] + 0.15, 0.04, 0.04, 0.5, 0x3a3a3a);
    });
  }

  function buildKart(r) {
    const G = groups();
    const none = G.b('none');
    floor(none, -160, -160, 160, 160, 0, 0xd8cb98);
    floor(G.b('grass'), -6, -9, 12, 9, 0.012, 0xffffff, 0.5);
    floor(G.b('grass'), -6, 9, 40, 20, 0.012, 0xffffff, 0.5);
    floor(G.b('grass'), 14, -24, 40, -12, 0.012, 0xffffff, 0.5);
    floor(G.b('grass'), -40, 22, -8, 40, 0.012, 0xffffff, 0.5);
    [[-5.4, -8.5, -4.6, 8.5]].forEach(([x0, z0, x1, z1]) => block(none, (x0 + x1) / 2, 0.15, (z0 + z1) / 2, x1 - x0, 0.3, z1 - z0, 0x9cc8e8));
    block(none, -1.5, 0.12, 9.6, 15, 0.24, 0.5, 0x9cc8e8);
    block(none, 3.5, 0.2, -9.4, 18, 0.4, 0.5, 0x9cc8e8);
    const blu = G.b('blueWall');
    block(blu, -10, 3, -12, 8, 6, 8, 0x8cbce4);
    const bx = -6, z0 = -14, z1 = 14;
    wall(none, [bx, 0, z1], [bx, 0, 5.0], 0, 6, 0x88b8e2);
    wall(none, [bx, 0, -1.0], [bx, 0, -1.4], 0, 6, 0x88b8e2);
    wall(none, [bx, 0, -5.6], [bx, 0, z0], 0, 6, 0x88b8e2);
    wall(none, [bx, 0, 5.0], [bx, 0, -1.0], 3.4, 6, 0x88b8e2);
    wall(none, [bx, 0, -1.4], [bx, 0, -5.6], 3.4, 6, 0x88b8e2);
    block(none, bx - 0.05, 6.1, 0, 0.5, 0.25, 28.4, 0x6a9ccc);
    wall(none, [bx - 18, 0, z0], [bx, 0, z0], 0, 6, 0x7aaad6);
    wall(none, [bx, 0, z1], [bx - 18, 0, z1], 0, 6, 0x7aaad6);
    wall(none, [bx - 18, 0, z1], [bx - 18, 0, z0], 0, 6, 0x6c9ac6);
    floor(none, bx - 18, z0, bx, z1, 0.008, 0x2c4a7c);
    ceil(none, bx - 18, z0, bx, z1, 6, 0x5a7aa8);
    wall(G.b('garage'), [bx + 0.06, 0, -1.4], [bx + 0.06, 0, -5.6], 0.0, 3.4, 0xffffff, [0, 0, 1, 6]);
    panel(G.b('resupply'), bx + 0.1, 3.7, 2.0, 2.2, 0.55, PI / 2);
    panel(G.b('resupply'), bx + 0.1, 3.9, -3.5, 2.6, 0.62, PI / 2);
    [[-1.5, -3.2], [1.0, -1.0], [3.2, -4.4], [5.5, 2.6], [8.5, -1.5], [10.2, 4.0]].forEach(([x, z]) => cone(none, x, z, 1));
    G.b('xed');
    panel(G.b('xed'), 3.0, 1.2, -8.8, 1.6, 0.8, 0);
    block(none, 2.4, 0.4, -8.85, 0.08, 0.8, 0.08, 0x3a2a1c);
    block(none, 3.6, 0.4, -8.85, 0.08, 0.8, 0.08, 0x3a2a1c);
    panel(G.b('hills#near'), 2, 7, -16, 34, 14, 0);
    [[2, -7.8, 1.8], [-2.6, 8.2, 1.2], [6.5, 8.4, 1.6]].forEach(([x, z, w]) => block(none, x, 0.2, z, w, 0.4, 0.5, 0xc82a20));
    const hillsB = G.b('hills');
    const R = 90;
    for (let i = 0; i < 24; i++) {
      const a0 = (i / 24) * PI * 2, a1 = ((i + 1) / 24) * PI * 2;
      const p0 = [S(a0) * R, 0, C(a0) * R], p1 = [S(a1) * R, 0, C(a1) * R];
      const n = V3.norm([-(p0[0] + p1[0]), 0, -(p0[2] + p1[2])]);
      hillsB.quad(p0, p1, [p1[0], 30, p1[2]], [p0[0], 30, p0[2]], 0xffffff, [[i * 0.5, 0], [(i + 1) * 0.5, 0], [(i + 1) * 0.5, 1], [i * 0.5, 1]], [n, n, n, n]);
    }
    const near = G.b('hills#near');
    [[40, 30, 40, 16, 1.6], [-60, 10, 30, 14, 2.2]].forEach(([x, z, w, h, yaw]) => panel(near, x, h / 2, z, w, h, yaw));
    const dome = G.b('grass#hill');
    cylinderHill(dome, 26, -42, 9, 14, 1);
    cylinderHill(dome, -34, 44, 8, 10, 2);
    cylinderHill(dome, 52, 18, 7, 16, 3);
    const redB = G.b('redStuds');
    block(redB, 34, 4, -2, 14, 8, 12, 0xffffff, 0.25);
    wall(G.b('garage#red'), [26.94, 0, -0.6], [26.94, 0, -3.4], 0, 2.6, 0xffffff, [0, 0, 1, 5]);
    panel(G.b('resupplyRed'), 26.9, 3.0, -2.0, 2.0, 0.5, -PI / 2);
    block(G.b('redStuds#b'), 12, 0.6, 16, 8, 1.2, 1.6, 0xffffff, 0.25);
    const rb = G.b('stripes');
    block(rb, 24, 2.2, 12, 16, 4.4, 6, 0xffffff, 0.12);
    block(G.b('glass'), 24, 5.4, 12, 15.2, 2, 5.2, 0xffffff);
    block(none, 16, 1.1, 2, 6, 2.2, 5, 0xa8d4ee);
    [[18, 3.5, 6], [21, 3.5, 6], [27, 3.5, 7.5], [30, 3.5, 7.5]].forEach(([x, y, z]) => {
      texBox(G.b('qblock'), x, y, z, 1.4, 1.4, 1.4, 0xffffff);
      block(none, x, y / 2 - 0.35, z, 0.2, y - 0.7, 0.2, 0x2a2a2a);
    });
    [[19.5, 3.4, 6.2, 'posterGirls'], [28.5, 3.4, 7.7, 'posterRacer']].forEach(([x, y, z, k]) => panel(G.b(k), x, y, z, 1.4, 2.1, 0));
    const gate = G.b('none');
    block(gate, -4, 3.5, 26, 0.6, 7, 0.6, 0x222222);
    block(gate, 16, 3.5, 26, 0.6, 7, 0.6, 0x222222);
    panel(G.b('cakeway'), 6, 6.2, 26.31, 20, 2.2, 0);
    panel(G.b('cakeway'), 6, 6.2, 25.69, 20, 2.2, PI);
    block(gate, 6, 6.2, 26, 20.2, 2.3, 0.5, 0x161616);
    for (let i = 0; i < 6; i++) block(G.b('lights'), -4 + (i % 2) * 20, 4.6 + Math.floor(i / 2) * 0.5, 25.6, 0.3, 0.3, 0.1, rgb(0xff3a2a, 0.9));
    [[-2, 0.7], [3.5, 0.6], [9.0, 0.7], [14.0, 0.6]].forEach(([x]) => panel(G.b('posterHero#gate'), x, 2.2, 25.6, 2.6, 3.4, PI));
    const barrier = G.b('noU');
    [[-14, 34], [2, 34], [18, 34], [34, 34]].forEach(([x, z]) => {
      panel(barrier, x, 0.6, z, 14, 1.2, PI);
      panel(barrier, x, 0.6, z + 0.3, 14, 1.2, 0);
      block(none, x, 0.6, z + 0.15, 14, 1.2, 0.28, 0x1c1c1c);
    });
    [[18, 1.3, 15.05, 0], [40, 1.0, 4.0, -PI / 2]].forEach(([x, y, z, yaw]) => panel(G.b('mph'), x, y, z, 2.4, 1.0, yaw));
    const grid = G.b('rainbow');
    block(grid, -24, 4, -30, 16, 8, 1, 0xffffff, 0.5);
    wall(none, [-40, 0, -46], [-8, 0, -46], 0, 30, 0x3c5458);
    block(G.b('rainbow#void'), -4, 4, -44, 8, 8, 1, 0xffffff, 0.5);
    block(G.b('redStuds#void'), -20.5, 2, -43.5, 4, 4, 4, 0xffffff, 0.25);
    floor(G.b('grass#void'), -24, -46, 0, -42.5, 0.012, 0xffffff, 0.5);
    const bb = G.b('none');
    block(bb, 14, 3.2, -14, 6.2, 4.6, 0.4, 0x141414);
    panel(G.b('posterHero'), 14, 3.2, -13.78, 5.6, 4.0, 0);
    block(bb, 14, 0.6, -14, 0.3, 1.2, 0.3, 0x2a2a2a);
    buildZones(G, none);
    buildLessons(G, none);
    return G.done(r, { glass: { blend: true, alpha: 0.55, shine: true }, lights: {} });
  }

  function octWindow(G, none, x, y, z, w, h, yaw, glass) {
    none.at(x, y, z, q => {
      q.push(M4.rotY(yaw));
      q.box(w + 0.24, h + 0.24, 0.06, 0x3a1410);
      q.pop();
    });
    G.b(glass).at(x, y, z, q => {
      q.push(M4.rotY(yaw));
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2 + PI / 8;
        pts.push([C(a) * w / 2 / C(PI / 8), S(a) * h / 2 / C(PI / 8), 0.04]);
      }
      const n = [0, 0, 1];
      for (let i = 0; i < 8; i++) q.tri([0, 0, 0.04], pts[i], pts[(i + 1) % 8], rgb(0x2f7a22, 0.45), [[0.5, 0.5], [0.5 + C((i / 8) * PI * 2) * 0.5, 0.5 + S((i / 8) * PI * 2) * 0.5], [0.5 + C(((i + 1) / 8) * PI * 2) * 0.5, 0.5 + S(((i + 1) / 8) * PI * 2) * 0.5]], [n, n, n]);
      q.pop();
    });
  }

  function lockers(none, x0, x1, z, yaw, col, inner) {
    const n = Math.round(Math.abs(x1 - x0) / 0.95);
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * (x1 - x0) / n;
      none.at(0, 0, 0, q => {
        q.push(M4.rotY(yaw));
        q.at(x, 1.05, z, e => e.box(0.92, 2.1, 0.6, col));
        q.at(x, 1.05, z + 0.29, e => e.box(0.84, 2.0, 0.02, inner));
        q.at(x, 1.55, z + 0.1, e => e.box(0.7, 0.04, 0.45, shade(col, 1.3)));
        q.at(x - 0.2, 1.25, z + 0.18, e => e.box(0.05, 0.12, 0.05, 0x8a8a8a));
        q.pop();
      });
    }
  }

  function buildRed(r) {
    const G = groups();
    const none = G.b('none');
    const W = 7, Dp = 6, Hh = 4.2;
    floor(none, -W, -Dp, W, Dp, 0, 0x6a2620);
    ceil(none, -W, -Dp, W, Dp, Hh, 0xc84438);
    wall(none, [-W, 0, -Dp], [W, 0, -Dp], 0, Hh, 0xd23c2e);
    wall(none, [W, 0, Dp], [-W, 0, Dp], 0, Hh, 0xd23c2e);
    wall(none, [-W, 0, Dp], [-W, 0, -Dp], 0, Hh, 0xc8362a);
    wall(none, [W, 0, -Dp], [W, 0, Dp], 0, Hh, 0xc8362a);
    block(none, 0, 0.06, -Dp + 0.03, 2 * W, 0.12, 0.06, 0x3a1410);
    for (let i = 0; i < 4; i++) block(G.b('lightsW'), -4.5 + i * 3, Hh - 0.05, 0, 1.6, 0.06, 0.3, rgb(0xfff4e0, 0.95));
    [-3.6, 0, 3.6].forEach(x => octWindow(G, none, x, 2.3, -Dp + 0.04, 2.0, 1.5, 0, 'window'));
    lockers(none, -5, 2, -(W - 0.35), -PI / 2, 0x3a2418, 0x241208);
    lockers(none, -6.5, -2.2, -(Dp - 0.35), PI, 0x3a2418, 0x241208);
    panel(G.b('chalkboard'), -0.4, 2.0, Dp - 0.04, 2.6, 1.3, PI);
    octWindow(G, none, -4.6, 2.3, Dp - 0.04, 1.8, 1.4, PI, 'window');
    block(none, -W + 0.06, 1.25, 0.6, 0.08, 2.5, 2.2, 0xd8d4cc);
    block(none, -W + 0.1, 1.25, 0.6, 0.04, 2.4, 0.04, 0x8a8a8a);
    [0.05, 1.15].forEach(z => panel(G.b('medic'), -W + 0.12, 1.6, z, 0.36, 0.36, PI / 2));
    texBox(G.b('qblock'), -W + 0.3, 2.6, 2.7, 0.5, 1.1, 1.1, 0xffffff);
    wall(G.b('garage'), [-W + 0.07, 0, -2.8], [-W + 0.07, 0, -5.2], 0, 2.8, 0xffffff, [0, 0, 1, 5]);
    panel(G.b('exit'), -W + 0.12, 3.15, -4.0, 0.8, 0.26, PI / 2);
    block(none, W - 0.4, 1.2, 4.5, 0.6, 2.4, 1.0, 0x8a2a22);
    return G.done(r, { window: {}, lightsW: {} });
  }

  function buildBlu(r) {
    const G = groups();
    const none = G.b('none');
    const W = 8, Dp = 7, Hh = 4;
    floor(none, -W, -Dp, W, Dp, 0, 0x34508a);
    ceil(none, -W, -Dp, W, Dp, Hh, 0x6a8ac0);
    wall(none, [-W, 0, -Dp], [W, 0, -Dp], 0, Hh, 0x5a7ab0);
    wall(none, [W, 0, Dp], [-W, 0, Dp], 0, Hh, 0x5a7ab0);
    wall(none, [-W, 0, Dp], [-W, 0, -Dp], 0, Hh, 0x5272a8);
    wall(none, [W, 0, -Dp], [W, 0, Dp], 0, Hh, 0x5272a8);
    for (let i = 0; i < 4; i++) block(G.b('lightsW'), -5 + i * 3.3, Hh - 0.05, 0, 1.6, 0.06, 0.3, rgb(0xf4f8ff, 0.95));
    for (let i = 0; i < 7; i++) {
      const x = -7.2 + i * 1.0;
      block(none, x, 1.0, -6.7, 0.9, 2.0, 0.55, 0x2a3242);
      block(none, x, 1.5, -6.5, 0.6, 0.04, 0.4, 0x3a4458);
    }
    block(none, 4.5, 1.1, -6.6, 1.4, 2.2, 0.7, 0xb8bcc2);
    block(none, 4.5, 1.1, -6.24, 0.04, 2.0, 0.02, 0x8a8e94);
    [[-3.2, 6.96], [3.2, 6.96]].forEach(([x, z]) => {
      block(G.b('rainbow'), x, 2.4, z, 2.6, 1.4, 0.04, 0xffffff, 0.8);
      block(none, x, 2.4, z - 0.02, 2.8, 1.6, 0.02, 0x2a3a5a);
    });
    block(G.b('grass#win'), 7.96, 2.4, 1.5, 0.04, 1.4, 2.6, 0xffffff, 0.8);
    const tables = [[-3.5, 0.5], [0.5, 2.5], [2.8, -1.8], [-1.2, -3.0], [5.2, 3.2]];
    tables.forEach(([x, z]) => {
      none.at(x, 0, z, h => {
        h.at(0, 0.36, 0, q => q.prism(6, 0.06, 0.06, 0, 0.06, 0.06, 0.36, 0x2a2a2a));
        h.at(0, 0.0, 0, q => q.prism(10, 0.3, 0.3, 0, 0.3, 0.3, 0.04, 0x2a2a2a));
        h.at(0, 0.62, 0, q => q.prism(18, 0.78, 0.78, 0, 0.78, 0.78, 0.14, 0xb02a2a, { capBottom: true }));
        h.at(0, 0.76, 0, q => q.prism(18, 0.78, 0.78, -0.002, 0.78, 0.78, 0.0, 0xc8302e));
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * PI * 2 + 0.4;
          h.at(S(a) * 0.5, 0.765, C(a) * 0.5, q => {
            q.prism(14, 0.12, 0.12, 0, 0.14, 0.14, 0.015, 0xf2f0ea);
            q.at(0.13, 0.008, 0, w => w.box(0.02, 0.006, 0.18, 0xc8ccd0));
          });
          h.at(S(a) * 1.05, 0, C(a) * 1.05, q => {
            q.push(M4.rotY(a));
            q.at(0, 0.45, 0, w => w.box(0.42, 0.05, 0.42, 0x3a2418));
            q.at(0, 0.8, 0.2, w => w.box(0.42, 0.7, 0.05, 0x3a2418));
            [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a1, b1]) => q.at(a1, 0.22, b1, w => w.box(0.04, 0.44, 0.04, 0x2a1810)));
            q.pop();
          });
        }
        h.at(0, 0.84, 0, q => q.prism(8, 0.02, 0.02, 0, 0.015, 0.015, 0.16, 0x2a2a2a));
      });
    });
    return G.done(r, { lightsW: {} });
  }

  function shed(G, none, x, z, w, h, d, yaw, o) {
    const pl = G.b('planks');
    pl.at(x, 0, z, q => {
      q.push(M4.rotY(yaw || 0));
      q.box(w, h, d, 0xffffff, { base: true, uvScale: 0.35 });
      q.pop();
    });
    none.at(x, 0, z, q => {
      q.push(M4.rotY(yaw || 0));
      q.at(0, h + 0.25, 0, e => { e.push(M4.rotZ(0.12)); e.box(w + 0.8, 0.12, d + 0.8, 0x6a6e72); e.pop(); });
      if (o && o.door) q.at(o.door[0], o.door[2] / 2, d / 2 + 0.02, e => e.box(o.door[1], o.door[2], 0.04, 0x1c1610));
      q.pop();
    });
  }

  function buildDust(r) {
    const G = groups();
    const none = G.b('none');
    floor(G.b('gravel'), -140, -140, 140, 140, 0, 0xffffff, 0.25);
    const g = rand(9);
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * PI * 2;
      const rr = 46 + g() * 25;
      const x = S(a) * rr, z = C(a) * rr;
      none.at(x, 0, z, h => h.prism(6, 9 + g() * 10, 9 + g() * 10, 0, 3 + g() * 4, 3 + g() * 4, 9 + g() * 18, shade(0xa88a62, 0.75 + g() * 0.3)));
    }
    for (let i = 0; i < 14; i++) {
      const x = -30 + g() * 60, z = -30 + g() * 60;
      if (Math.abs(x) < 9 && Math.abs(z) < 9) continue;
      none.at(x, 0, z, h => h.prism(5, 1.2 + g() * 2, 1.2 + g() * 2, 0, 0.2, 0.2, 0.8 + g() * 1.2, shade(0x9a8462, 0.8 + g() * 0.2)));
    }
    shed(G, none, -6, -8, 8, 4.5, 6, 0, { door: [0, 3.2, 3.2] });
    shed(G, none, 7, -10, 9, 5.5, 7, 0.2, { door: [-1.5, 2.2, 2.6] });
    shed(G, none, 12, 5, 6, 4, 8, -1.3, { door: [1, 2.2, 2.4] });
    shed(G, none, -12, 6, 7, 6, 7, 1.2, {});
    panel(G.b('pointA'), -6, 3.6, -4.95, 1.2, 1.2, 0);
    panel(G.b('pointB'), 12.6 + 3.9, 3.0, 5.6, 1.2, 1.2, -1.3 + PI / 2);
    panel(G.b('pointC'), 7.2, 4.7, -6.45, 1.3, 1.3, 0.2);
    for (let i = 0; i < 9; i++) {
      const x = -16 + i * 3.2;
      block(none, x, 1.1, 14, 0.14, 2.2, 0.14, 0x4a3a2a);
      block(none, x + 1.6, 1.9, 14, 3.2, 0.03, 0.03, 0x3a3a3a);
      block(none, x + 1.6, 1.4, 14, 3.2, 0.03, 0.03, 0x3a3a3a);
    }
    const bridge = G.b('none');
    block(bridge, 0, 6.5, 22, 22, 0.6, 3, 0x5a4632);
    block(bridge, -10, 3.2, 22, 0.6, 6.4, 0.6, 0x3a2e22);
    block(bridge, 10, 3.2, 22, 0.6, 6.4, 0.6, 0x3a2e22);
    panel(G.b('trespass'), 0, 6.5, 20.48, 10, 1.1, PI);
    for (let i = 0; i < 6; i++) {
      block(none, -20 + i * 8, 4, -18, 0.25, 8, 0.25, 0x4a3a2a);
      block(none, -20 + i * 8, 7.6, -18, 1.6, 0.12, 0.12, 0x4a3a2a);
    }
    const pl = G.b('planks');
    const hx0 = 16, hx1 = 26, hz0 = -32, hz1 = -20, hh = 4.5;
    wall(pl, [hx0, 0, hz0], [hx1, 0, hz0], 0, hh, 0xffffff, 0.35);
    wall(pl, [hx0, 0, hz1], [hx0, 0, hz0], 0, hh, 0xffffff, 0.35);
    wall(pl, [hx1, 0, hz0], [hx1, 0, hz1], 0, hh, 0xffffff, 0.35);
    wall(pl, [hx0, 0, hz1], [17, 0, hz1], 0, hh, 0xffffff, 0.35);
    wall(pl, [23, 0, hz1], [24, 0, hz1], 0, hh, 0xffffff, 0.35);
    wall(pl, [25.4, 0, hz1], [hx1, 0, hz1], 0, hh, 0xffffff, 0.35);
    wall(pl, [17, 0, hz1], [23, 0, hz1], 3.6, hh, 0xffffff, 0.35);
    wall(pl, [24, 0, hz1], [25.4, 0, hz1], 2.4, hh, 0xffffff, 0.35);
    floor(none, hx0, hz0, hx1, hz1, 0.01, 0x3a2e24);
    ceil(none, hx0, hz0, hx1, hz1, hh, 0x2a221c);
    block(none, 20, 0.45, hz1 + 0.05, 6, 0.06, 0.12, 0x2a2a2a);
    none.at(20, 3.9, -25, h => {
      h.prism(10, 0.04, 0.04, 0.0, 0.25, 0.25, -0.18, 0x3a3a3a, { capTop: false });
      h.at(0, -0.2, 0, q => q.ellipsoid(0.07, 0.07, 0.07, 6, 4, rgb(0xfff2c8, 1)));
      h.at(0, 0.3, 0, q => q.box(0.01, 0.6, 0.01, 0x222222));
    });
    panel(G.b('watch'), 21, 3.2, hz0 + 0.05, 2.2, 0.5, 0);
    panel(G.b('resupply'), hx0 + 0.05, 2.6, -26, 1.8, 0.45, PI / 2);
    [[-27, -7], [-27, 7], [-31, 0]].forEach(([x, z]) => none.at(x, 0, z, h => h.prism(10, 4, 4, 0, 0.3, 0.3, 2.6, 0x8a7a5a)));
    block(none, -23, 0.7, 0, 0.18, 0.18, 22, 0x5a4632);
    block(none, -23, 0.35, 0, 0.12, 0.12, 22, 0x4a3a2a);
    for (let i = -5; i <= 5; i++) block(none, -23, 0.45, i * 2, 0.16, 0.9, 0.16, 0x4a3a2a);
    return G.done(r, {});
  }

  function buildBoard(r) {
    const G = groups();
    const none = G.b('none');
    floor(none, -20, -20, 20, 20, 0, 0x4e2c28);
    wall(none, [-20, 0, -0.6], [20, 0, -0.6], 0, 12, 0x5c3430);
    return G.done(r, {});
  }

  function buildDark(r) {
    const G = groups();
    const none = G.b('none');
    floor(none, -30, -30, 30, 30, 0, 0x141210);
    block(none, 0, 0.25, 0, 0.7, 0.5, 0.5, 0x3a2a1c);
    return G.done(r, {});
  }

  function ceilTex(b, x0, z0, x1, z1, y, col, uv) {
    const n = [0, -1, 0];
    const nx = Math.max(1, Math.ceil((x1 - x0) / 10)), nz = Math.max(1, Math.ceil((z1 - z0) / 10));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const a0 = x0 + (x1 - x0) * i / nx, a1 = x0 + (x1 - x0) * (i + 1) / nx;
      const c0 = z0 + (z1 - z0) * j / nz, c1 = z0 + (z1 - z0) * (j + 1) / nz;
      b.quad([a0, y, c0], [a1, y, c0], [a1, y, c1], [a0, y, c1], col, [[a0 * uv, c0 * uv], [a1 * uv, c0 * uv], [a1 * uv, c1 * uv], [a0 * uv, c1 * uv]], [n, n, n, n]);
    }
  }

  function room(b, x0, z0, x1, z1, h, col, uv) {
    wall(b, [x0, 0, z0], [x1, 0, z0], 0, h, col, uv);
    wall(b, [x1, 0, z0], [x1, 0, z1], 0, h, shade(col, 0.92), uv);
    wall(b, [x1, 0, z1], [x0, 0, z1], 0, h, col, uv);
    wall(b, [x0, 0, z1], [x0, 0, z0], 0, h, shade(col, 0.92), uv);
  }

  function eyeBlock(none, x, y, z, s, col) {
    block(none, x, y, z, s, s, s, col || 0xf2c82a);
    [-0.18, 0.18].forEach(dx => block(none, x + dx * s, y + 0.05 * s, z + s / 2 + 0.01, 0.07 * s, 0.32 * s, 0.02, 0x141414));
  }

  function truss(none, x, z, h) {
    [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].forEach(([a, c]) => block(none, x + a, h / 2, z + c, 0.08, h, 0.08, 0x1a1a1a));
    for (let y = 0.5; y < h; y += 1) {
      block(none, x, y, z - 0.25, 0.5, 0.05, 0.05, 0x1a1a1a);
      block(none, x, y, z + 0.25, 0.5, 0.05, 0.05, 0x1a1a1a);
      block(none, x - 0.25, y, z, 0.05, 0.05, 0.5, 0x1a1a1a);
      block(none, x + 0.25, y, z, 0.05, 0.05, 0.5, 0x1a1a1a);
    }
  }

  function framed(G, none, key, x, y, z, w, h, yaw) {
    panel(G.b(key), x + S(yaw) * 0.04, y, z + C(yaw) * 0.04, w, h, yaw);
    none.at(x, y, z, q => {
      q.push(M4.rotY(yaw));
      q.box(w + 0.2, h + 0.2, 0.06, 0x141414);
      q.pop();
    });
  }

  function plankFence(b, x0, z0, x1, z1, seed) {
    const g = rand(seed);
    const len = Math.hypot(x1 - x0, z1 - z0);
    const yaw = Math.atan2(x1 - x0, z1 - z0) - PI / 2;
    const n = Math.round(len / 0.3);
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n;
      const x = lerpN(x0, x1, k), z = lerpN(z0, z1, k);
      const hgt = 1.3 + g() * 0.6;
      b.at(x, 0, z, q => {
        q.push(M4.rotY(yaw));
        q.push(M4.rotZ((g() - 0.5) * 0.35));
        q.push(M4.rotX((g() - 0.5) * 0.2));
        q.at(0, hgt / 2, 0, e => e.box(0.26, hgt, 0.05, shade(0xffffff, 0.8 + g() * 0.25), { uvScale: 0.6 }));
        q.pop();
        q.pop();
        q.pop();
      });
    }
  }

  function lerpN(a, b, k) {
    return a + (b - a) * k;
  }

  const NZ = { cones: [0, 0, 0], banner: [120, 0, 0], stage: [0, 0, 120], street: [-120, 0, 0], ledge: [0, 0, -120], corner: [-120, 0, -120], redExt: [120, 0, 120], bluExt: [-120, 0, 120], workshop: [120, 0, -120], poster: [240, 0, 0], resup: [-240, 0, 0], finale: [0, 0, 240] };

  function buildNight(r) {
    const G = groups();
    const none = G.b('none');
    const big = 320;
    for (let i = -big; i < big; i += 20) for (let j = -big; j < big; j += 20) none.quad([i, 0, j + 20], [i + 20, 0, j + 20], [i + 20, 0, j], [i, 0, j], 0xb2a98c, null, [N_UP, N_UP, N_UP, N_UP]);
    let O = NZ.cones;
    const P = (x, y, z) => [O[0] + x, y, O[2] + z];
    let p = P(0, 2.6, -7);
    block(G.b('rainbow#n1'), p[0], p[1], p[2], 22, 5.2, 1, 0xffffff, 0.2);
    [['comic#n1', -6], ['posterHero#n1', 0], ['comic#n1b', 6]].forEach(([k, x]) => {
      p = P(x, 3.9, -6.46);
      panel(G.b(k), p[0], p[1], p[2], 3.6, 2.4, 0);
    });
    [[-1.6, -4.4], [0.3, -5.5], [1.4, -3.6]].forEach(([x, z]) => cone(none, O[0] + x, O[2] + z, 1.5));
    p = P(9, 4.6, -3);
    block(G.b('rainbow#nt'), p[0], p[1], p[2], 4, 9.2, 4, 0xffffff, 0.2);
    p = P(9, 0.9, 1.4);
    block(none, p[0], p[1], p[2], 5, 1.8, 2.6, rgb(0x2a7aff, 0.75));
    floor(G.b('grass#n'), O[0] - 14, O[2] - 6.4, O[0] + 16, O[2] - 2.4, 0.012, 0xffffff, 0.5);
    p = P(1, 0.15, -2.25);
    block(G.b('pinkZig'), p[0], p[1], p[2], 30, 0.3, 0.3, 0xffffff, 0.5);
    block(none, O[0], 1.0, O[2] + 14.3, 34, 2, 0.6, 0x5a5a4a);
    wall(G.b('zigzag'), [O[0] + 17, 0, O[2] + 13.98], [O[0] - 17, 0, O[2] + 13.98], 0, 2, 0xffffff, [0, 0, 8.5, 1]);
    for (let i = 0; i < 9; i++) {
      const x = -14 + i * 3.5;
      if (i % 3 === 1) eyeBlock(none, O[0] + x, 2.6, O[2] + 14, 1.2);
      else texBox(G.b('qblock#n'), O[0] + x, 2.5, O[2] + 14, 1.0, 1.0, 1.0, 0xffffff);
    }
    block(none, O[0] - 3, 2.6, O[2] + 14.2, 1.6, 1.2, 1.2, 0xe86aa8);
    [['posterGirls#n', -11], ['comic#n2', -6], ['posterRacer#n', -1.5], ['posterMoon#n', 3], ['comic#n3', 8], ['posterHero#n2', 12.5]].forEach(([k, x]) => {
      p = P(x, 4.6, 14.9);
      panel(G.b(k), p[0], p[1], p[2], 3.4, 2.3, PI);
      block(none, p[0], p[1], p[2] + 0.06, 3.6, 2.5, 0.1, 0x141414);
    });
    p = P(-4, 7.5, 18);
    panel(G.b('hills#n'), p[0], p[1], p[2], 40, 12, PI);
    const dome = G.b('grass#nh');
    cylinderHill(dome, O[0] - 16, O[2] + 24, 6, 7, 1);
    cylinderHill(dome, O[0] + 14, O[2] + 26, 7, 9, 2);
    cylinderHill(dome, O[0] - 12, O[2] - 16, 6, 8, 3);
    cylinderHill(dome, O[0] + 20, O[2] - 14, 5, 6, 4);

    O = NZ.banner;
    for (let i = -2; i <= 2; i++) block(none, O[0] + i * 5, 0.012, O[2] + 4, 0.15, 0.02, 10, 0xe8e8e0);
    block(none, O[0], 0.012, O[2] - 1, 24, 0.02, 0.15, 0xe8e8e0);
    panel(G.b('hills#nb'), O[0], 4, O[2] - 16, 44, 8, 0);
    wall(none, [O[0] - 22, 0, O[2] - 16.2], [O[0] + 22, 0, O[2] - 16.2], 0, 2, 0xd8d2b4);
    [[-6, -12.5], [3, -13], [9, -12]].forEach(([x, z]) => {
      none.at(O[0] + x, 0, O[2] + z, h => {
        h.prism(14, 0.6, 0.6, 0, 0.6, 0.6, 2.2, 0x2a9a2a);
        h.at(0, 2.2, 0, q => q.prism(14, 0.75, 0.75, 0, 0.75, 0.75, 0.6, 0x3ab83a, { capBottom: true }));
      });
    });
    eyeBlock(none, O[0] - 2, 0.9, O[2] - 12.5, 1.8);
    eyeBlock(none, O[0] + 6, 0.8, O[2] - 11.5, 1.6);
    block(none, O[0] + 12, 0.8, O[2] - 12, 1.6, 1.6, 1.6, 0xd8402a);
    [['comic#nb', -12], ['skyHeadA#nb', -9.5], ['posterHero#nb', -7], ['posterGirls#nb', 0], ['comic#nb2', 13], ['posterMoon#nb', 16]].forEach(([k, x]) => {
      panel(G.b(k), O[0] + x, 1.0, O[2] - 13.9, 2.2, 1.7, 0);
      block(none, O[0] + x, 1.0, O[2] - 14.0, 2.3, 1.8, 0.1, 0x141414);
    });
    truss(none, O[0] - 9, O[2] - 7, 9.5);
    truss(none, O[0] + 9, O[2] - 7, 9.5);
    panel(G.b('xenon'), O[0], 7.6, O[2] - 6.9, 18, 3.4, 0);
    panel(G.b('xenon'), O[0], 7.6, O[2] - 7.1, 18, 3.4, PI);
    block(none, O[0], 7.6, O[2] - 7, 18.1, 3.5, 0.12, 0x1a1a1a);
    p = [O[0] - 14, 3.4, O[2] - 3];
    panel(G.b('versusBlu'), p[0] + S(0.5) * 0.09, p[1], p[2] + C(0.5) * 0.09, 7, 2.6, 0.5);
    none.at(p[0], p[1], p[2], q => { q.push(M4.rotY(0.5)); q.box(7.3, 2.9, 0.15, 0x1a1a1a); q.pop(); });
    truss(none, p[0], p[2] - 0.6, 2.2);
    p = [O[0] + 13, 4.2, O[2] + 6];
    panel(G.b('redBill'), p[0] - 0.1, p[1], p[2], 6, 3.4, -PI / 2);
    block(none, p[0], p[1], p[2], 0.15, 3.6, 6.2, 0x1a1a1a);
    [-2.5, 2.5].forEach(dz => block(none, p[0] + 0.2, 1.3, p[2] + dz, 0.2, 2.6, 0.2, 0x1a1a1a));
    truss(none, O[0] + 15, O[2] + 1, 12);
    p = [O[0] + 7, 4.4, O[2] - 10];
    panel(G.b('doodle#nb'), p[0], p[1], p[2] + 0.1, 5.4, 3.4, 0);
    block(none, p[0], p[1], p[2], 5.6, 3.6, 0.15, 0x1a1a1a);
    block(none, p[0], 1.35, p[2], 0.25, 2.7, 0.25, 0x1a1a1a);
    block(G.b('darkStuds#nb'), O[0] - 15, 1.6, O[2] + 7, 3.2, 3.2, 3.2, 0xffffff, 0.5);
    cylinderHill(G.b('grass#nbh'), O[0] + 4, O[2] - 24, 7, 8, 5);
    cylinderHill(G.b('grass#nbh'), O[0] + 20, O[2] + 10, 6, 7, 6);

    O = NZ.stage;
    block(none, O[0], 0.5, O[2], 14, 1, 8, 0x1a1c24);
    floor(G.b('rainbow#ns'), O[0] - 7, O[2] - 4, O[0] + 7, O[2] + 4, 1.01, 0xffffff, 0.35);
    wall(G.b('blueTiles#ns'), [O[0] - 9, 0, O[2] - 4], [O[0] + 9, 0, O[2] - 4], 1, 9, rgb(0xb8d0ff, 0.55), 0.35);
    [-1, 1].forEach(k => {
      const x = O[0] + k * 5.6;
      block(none, x, 3.2, O[2] + 1.5, 0.08, 4.4, 0.08, 0x2a2a2a);
      panel(G.b('flagBlue'), x - k * 0.9, 4.5, O[2] + 1.5, 1.8, 1.4, k > 0 ? 0.4 : -0.4);
      panel(G.b('flagBlue'), x - k * 0.9, 4.5, O[2] + 1.48, 1.8, 1.4, PI + (k > 0 ? 0.4 : -0.4));
    });
    block(none, O[0], 9.5, O[2] - 1, 16, 0.3, 0.3, 0x2a2a2a);

    O = NZ.street;
    floor(none, O[0] - 30, O[2] - 3, O[0] + 30, O[2] + 3, 0.01, 0x55565a);
    for (let i = -6; i <= 6; i++) block(none, O[0] + i * 5, 0.02, O[2], 2.2, 0.02, 0.15, 0xe8e2b0);
    floor(G.b('grass#nst'), O[0] - 30, O[2] + 3, O[0] + 30, O[2] + 5, 0.012, 0xffffff, 0.5);
    floor(G.b('grass#nst'), O[0] - 30, O[2] - 5, O[0] + 30, O[2] - 3, 0.012, 0xffffff, 0.5);
    block(none, O[0], 2.5, O[2] - 6, 60, 5, 0.6, 0x2a2a2e);
    [['posterHero#ns1', -20], ['comic#ns1', -15], ['skyHeadB#ns', -11], ['posterRacer#ns', -6], ['posterGirls#ns', -1], ['comic#ns2', 4], ['posterMoon#ns', 9], ['posterHero#ns2', 14]].forEach(([k, x], i) => {
      panel(G.b(k), O[0] + x, 2.4 + (i % 2) * 0.3, O[2] - 5.68, 3.8, 3.0, 0);
    });
    [-18, -8, 2, 12, 20].forEach((x, i) => eyeBlock(none, O[0] + x, 5.8, O[2] - 6, 1.4, i % 2 ? 0xe86aa8 : 0xf2c82a));
    cylinderHill(G.b('grass#nsh'), O[0] + 2, O[2] - 14, 6, 7, 7);
    block(none, O[0] + 28, 2.5, O[2] + 7, 0.6, 5, 4, 0x2a2a2e);

    O = NZ.ledge;
    floor(G.b('stripes#nl'), O[0] - 20, O[2] - 4, O[0] + 20, O[2] + 12, 0.01, 0xffffff, 0.12);
    block(G.b('stripes#nlb'), O[0], 0.85, O[2] - 1.5, 30, 1.7, 3, 0xffffff, 0.2);
    floor(G.b('grass#nl'), O[0] - 15, O[2] - 3, O[0] + 15, O[2], 1.71, 0xffffff, 0.5);
    panel(G.b('hills#nl'), O[0], 5.5, O[2] - 10, 40, 10, 0);
    wall(none, [O[0] - 20, 0, O[2] - 10.1], [O[0] + 20, 0, O[2] - 10.1], 0, 1.5, 0xd8d2b4);
    p = [O[0] + 5, 3.4, O[2] - 7];
    panel(G.b('doodle#nl'), p[0], p[1], p[2] + 0.1, 4.4, 2.8, 0);
    block(none, p[0], p[1], p[2], 4.6, 3.0, 0.15, 0x1a1a1a);
    cylinderHill(G.b('grass#nlh'), O[0] - 9, O[2] - 14, 5, 7, 8);
    block(none, O[0] + 2, 0.6, O[2] + 3.5, 4, 1.2, 1.6, 0xc8261e);
    [0.3, 0.9].forEach(y => block(none, O[0] + 2, y, O[2] + 4.31, 4.02, 0.06, 0.02, 0x141414));

    O = NZ.corner;
    floor(G.b('stripes#nco'), O[0] - 10, O[2] - 4, O[0] + 12, O[2] + 10, 0.01, 0xffffff, 0.15);
    wall(G.b('redStuds#nco'), [O[0] - 10, 0, O[2] - 4], [O[0], 0, O[2] - 4], 0, 7, 0xffffff, 0.5);
    wall(none, [O[0], 0, O[2] - 4], [O[0] + 10, 0, O[2] - 4], 0, 7, 0x8ab8d4);
    wall(G.b('rainbow#nco'), [O[0] + 10, 0, O[2] - 4], [O[0] + 10, 0, O[2] + 10], 0, 7, 0xffffff, 0.3);
    wall(none, [O[0] - 10, 0, O[2] + 10], [O[0] - 10, 0, O[2] - 4], 0, 7, 0x8ab8d4);
    none.at(O[0] - 5, 6.1, O[2] - 3.2, q => {
      q.push(M4.rotX(0.5));
      q.box(10, 2.4, 0.1, 0x1a1a1a);
      q.pop();
    });
    G.b('spiral').at(O[0] - 5, 6.1, O[2] - 3.13, q => {
      q.push(M4.rotX(0.5));
      q.quad([-5, -1.2, 0], [5, -1.2, 0], [5, 1.2, 0], [-5, 1.2, 0], 0xffffff, [[0, 0], [4, 0], [4, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      q.pop();
    });
    panel(G.b('omega'), O[0] - 4.5, 3.2, O[2] - 3.92, 2.6, 1.0, 0);
    framed(G, none, 'comic#nco', O[0] + 1.6, 3.2, O[2] - 3.94, 1.8, 2.4, 0);

    O = NZ.redExt;
    const bx0 = O[0] - 6, bx1 = O[0] + 6, bz0 = O[2] - 8, bz1 = O[2], bh = 3.8;
    floor(none, bx0, bz0, bx1, bz1, 0.01, 0x6a2620);
    ceil(none, bx0, bz0, bx1, bz1, bh, 0xc84438);
    floor(none, bx0 - 0.3, bz0 - 0.3, bx1 + 0.3, bz1 + 0.15, bh + 0.4, 0x8a2a1e);
    wall(none, [bx0, 0, bz0], [bx1, 0, bz0], 0, bh, 0xd23c2e);
    wall(none, [bx1, 0, bz0], [bx1, 0, bz1], 0, bh, 0xc8362a);
    wall(none, [bx0, 0, bz1], [bx0, 0, bz0], 0, bh, 0xc8362a);
    wall(none, [bx1 + 0.3, 0, bz0 - 0.3], [bx0 - 0.3, 0, bz0 - 0.3], 0, bh + 0.4, 0xb8301e);
    wall(none, [bx0 - 0.3, 0, bz0 - 0.3], [bx0 - 0.3, 0, bz1], 0, bh + 0.4, 0xa82a1a);
    wall(none, [bx1 + 0.3, 0, bz1], [bx1 + 0.3, 0, bz0 - 0.3], 0, bh + 0.4, 0xa82a1a);
    block(none, O[0], bh + 0.2, bz1, 12.6, 0.4, 0.3, 0xb8301e);
    block(none, O[0], 0.25, bz1, 12.6, 0.5, 0.3, 0xb8301e);
    block(G.b('pinkZig#rx'), O[0], 0.12, bz1 + 0.3, 12.6, 0.24, 0.3, 0xffffff, 0.6);
    for (let i = 0; i <= 4; i++) block(none, bx0 + i * 3, bh / 2, bz1, 0.12, bh, 0.12, 0x1a1a1a);
    block(G.b('glassRx'), O[0], 2.15, bz1, 12, 3.3, 0.04, 0xffffff);
    for (let i = 0; i < 3; i++) block(G.b('lightsW'), O[0] - 3 + i * 3, bh - 0.05, O[2] - 4, 1.6, 0.06, 0.3, rgb(0xfff4e0, 0.95));
    lockers(none, bx0 + 0.6, bx0 + 6.4, bz0 + 0.35, 0, 0x3a2418, 0x241208);
    panel(G.b('chalkboard#rx'), bx0 + 0.05, 2.0, O[2] - 4.5, 2.6, 1.3, PI / 2);
    block(none, bx1 - 1.0, 1.1, bz0 + 0.5, 1.4, 2.2, 0.7, 0xe8e6e0);
    [-0.35, 0.35].forEach(dx => panel(G.b('medic#rx'), bx1 - 1.0 + dx, 1.6, bz0 + 0.86, 0.4, 0.4, 0));
    floor(G.b('grass#rx'), O[0] - 16, bz1 + 0.5, O[0] + 16, O[2] + 16, 0.012, 0xffffff, 0.5);
    floor(G.b('grass#rx2'), bx1 + 0.3, O[2] - 12, O[0] + 16, bz1 + 0.5, 0.012, 0xffffff, 0.5);
    panel(G.b('hills#rx'), O[0] + 16, 3.5, O[2] + 4, 26, 7, -PI / 2);
    wall(none, [O[0] + 16.1, 0, O[2] - 9], [O[0] + 16.1, 0, O[2] + 17], 0, 1.4, 0xd8d2b4);
    cylinderHill(G.b('grass#rxh'), O[0] - 14, O[2] + 18, 6, 7, 9);
    cylinderHill(G.b('grass#rxh'), O[0] + 24, O[2] - 6, 6, 8, 10);
    buildNightExtra(G, none);
    return G.done(r, { glassRx: { blend: true, alpha: 0.18, shine: true }, lightsW: {} });
  }

  const LZ = { pen: [9, 0, 3], desk: [-8, 0, -5], hall: [0, 0, 0] };

  function buildLair(r) {
    const G = groups();
    const none = G.b('none');
    const X = 16, Z = 11, H = 7.5;
    floor(G.b('blueTiles#lf'), -X, -Z, X, Z, 0, rgb(0xb8ccff, 0.3), 0.3);
    ceilTex(G.b('blueTiles#lc'), -X, -Z, X, Z, H, rgb(0x8aa8ff, 0.45), 0.3);
    room(none, -X, -Z, X, Z, H, 0xe8e2c4);
    [[0, -Z + 0.05, 0], [0, Z - 0.05, PI], [-X + 0.05, 0, PI / 2], [X - 0.05, 0, -PI / 2]].forEach(([x, z, yaw], i) => {
      const len = i < 2 ? 2 * X : 2 * Z;
      panel(G.b('hills#l' + i), x, 3.2, z, len, 6.4, yaw);
    });
    [-Z + 0.08, Z - 0.08].forEach((z, i) => block(G.b('pinkZig#l'), 0, 0.3, z, 2 * X, 0.6, 0.06, 0xffffff, 0.5));
    for (let i = 0; i < 4; i++) [-6.5, 6.5].forEach(z => block(G.b('darkStuds#l'), -12 + i * 8, H / 2, z, 1.2, H, 1.2, 0xffffff, 0.5));
    framed(G, none, 'comic#l', -5, 3.4, -Z + 0.12, 3.2, 2.2, 0);
    framed(G, none, 'skyHeadC#l', 4, 3.6, -Z + 0.12, 2.0, 2.0, 0);
    [[-11, 0.5, -8.5], [-10, 0.5, -8.5], [-10.5, 1.5, -8.5]].forEach(([x, y, z]) => texBox(G.b('qblock#l'), x, y, z, 1, 1, 1, 0xffffff));
    const pen = LZ.pen;
    const pl = G.b('planks#pen');
    plankFence(pl, pen[0] - 3, pen[2] - 2.6, pen[0] + 3, pen[2] - 2.6, 11);
    plankFence(pl, pen[0] + 3, pen[2] - 2.6, pen[0] + 3, pen[2] + 2.6, 12);
    plankFence(pl, pen[0] + 3, pen[2] + 2.6, pen[0] - 3, pen[2] + 2.6, 13);
    plankFence(pl, pen[0] - 3, pen[2] + 2.6, pen[0] - 3, pen[2] - 2.6, 14);
    block(none, 0, H - 0.06, 0, 2, 0.08, 0.4, rgb(0xd8e8ff, 1));
    return G.done(r, {});
  }

  const GZ = { hall: [0, 0, 0], stair: [70, 0, 0], corridor: [-70, 0, 0], roof: [0, 0, 70], mall: [0, 0, -70], garage: [70, 0, 70], raid: [-70, 0, 70] };

  function buildGame(r) {
    const G = groups();
    const none = G.b('none');
    let O = GZ.hall;
    floor(G.b('marble'), O[0] - 10, O[2] - 8, O[0] + 10, O[2] + 8, 0, 0xffffff, 0.5);
    room(none, O[0] - 10, O[2] - 8, O[0] + 10, O[2] + 8, 6, 0xc8bea8);
    ceil(none, O[0] - 10, O[2] - 8, O[0] + 10, O[2] + 8, 6, 0xd8d0c0);
    [-5, 5].forEach(x => [-4, 4].forEach(z => none.at(O[0] + x, 0, O[2] + z, h => h.prism(14, 0.45, 0.45, 0, 0.45, 0.45, 6, 0xe0d8c8))));
    panel(G.b('flagFake'), O[0] - 7, 3.2, O[2] - 7.9, 2.4, 3.2, 0);
    block(none, O[0] - 7, 3.2, O[2] - 7.95, 2.6, 3.4, 0.04, 0x8a7a5a);
    [-2, 2].forEach(x => block(none, O[0] + x, 1.3, O[2] - 7.95, 1.6, 2.6, 0.1, 0x5a3a22));
    O = GZ.stair;
    room(none, O[0] - 3, O[2] - 2, O[0] + 3, O[2] + 14, 12, 0xa8aca8);
    for (let i = 0; i < 14; i++) block(none, O[0], (i + 1) * 0.15, O[2] + 1 + i * 0.4, 3, (i + 1) * 0.3, 0.4, shade(0x8a8a86, 0.9 + (i % 2) * 0.1));
    for (let i = 0; i < 14; i += 2) block(none, O[0] + 1.45, (i + 1) * 0.3 + 0.5, O[2] + 1 + i * 0.4, 0.05, 1.0, 0.05, 0x2a2a2a);
    none.at(O[0] + 1.45, 3.25, O[2] + 3.8, q => { q.push(M4.rotX(-0.6435)); q.box(0.06, 0.06, 7, 0x2a2a2a); q.pop(); });
    block(none, O[0], 4.1, O[2] + 10.15, 6, 0.2, 7.5, 0x8a8a86);
    panel(G.b('winGrid'), O[0], 6.0, O[2] + 13.9, 2.6, 2.2, PI);
    block(G.b('lightsW'), O[0], 11.9, O[2] + 6, 0.8, 0.06, 0.3, rgb(0xffffff, 1));
    O = GZ.corridor;
    floor(none, O[0] - 2.5, O[2] - 30, O[0] + 2.5, O[2] + 2, 0, 0x6a5a4a);
    wall(none, [O[0] - 2.5, 0, O[2] + 2], [O[0] - 2.5, 0, O[2] - 30], 0, 4, 0xc8b89a);
    wall(none, [O[0] + 2.5, 0, O[2] - 30], [O[0] + 2.5, 0, O[2] + 2], 0, 4, 0xc8b89a);
    wall(none, [O[0] - 2.5, 0, O[2] - 30], [O[0] + 2.5, 0, O[2] - 30], 0, 4, 0xa89a7a);
    for (let z = 0; z > -30; z -= 4) {
      block(none, O[0], 4.1, O[2] + z, 5, 0.4, 0.4, 0xd8d0c0);
      [-2.3, 2.3].forEach(x => block(none, O[0] + x, 2, O[2] + z, 0.4, 4, 0.4, 0xd8d0c0));
      block(G.b('lightsW'), O[0], 4.3, O[2] + z - 2, 0.5, 0.06, 0.5, rgb(0xfff4e0, 1));
    }
    ceil(none, O[0] - 2.5, O[2] - 30, O[0] + 2.5, O[2] + 2, 4.4, 0xb8ad98);
    [[-2, -6], [2, -14], [-2, -22]].forEach(([x, z]) => none.at(O[0] + x, 0, O[2] + z, h => {
      h.prism(10, 0.25, 0.25, 0, 0.3, 0.3, 0.5, 0x8a4a2a);
      h.at(0, 0.9, 0, q => q.ellipsoid(0.45, 0.5, 0.45, 8, 6, 0x2a5a2a));
    }));
    O = GZ.roof;
    floor(none, O[0] - 14, O[2] - 14, O[0] + 14, O[2] + 14, 0, 0x3a3c40);
    [[-14, 0, 0.1, 28], [14, 0, 0.1, 28], [0, -14, 28, 0.1], [0, 14, 28, 0.1]].forEach(([x, z, w, d]) => block(none, O[0] + x, 0.5, O[2] + z, w + 0.4, 1, d + 0.4, 0x5a5c60));
    [[-6, -6], [4, -8], [7, 5], [-8, 6]].forEach(([x, z]) => block(none, O[0] + x, 0.8, O[2] + z, 2, 1.6, 1.4, 0x6a6e72));
    [0, PI / 2, PI, -PI / 2].forEach(yaw => panel(G.b('skyline'), O[0] - S(yaw) * 40, 10, O[2] - C(yaw) * 40, 90, 24, yaw));
    O = GZ.mall;
    floor(G.b('marble#m'), O[0] - 8, O[2] - 20, O[0] + 8, O[2] + 20, 0, 0xffffff, 0.4);
    wall(G.b('shops'), [O[0] - 8, 0, O[2] + 20], [O[0] - 8, 0, O[2] - 20], 0, 5, 0xffffff, [0, 0, 4, 1]);
    wall(G.b('shops'), [O[0] + 8, 0, O[2] - 20], [O[0] + 8, 0, O[2] + 20], 0, 5, 0xffffff, [0, 0, 4, 1]);
    ceil(none, O[0] - 8, O[2] - 20, O[0] + 8, O[2] + 20, 7, 0xe8e8e4);
    for (let z = -16; z <= 16; z += 8) block(G.b('lightsW'), O[0], 6.9, O[2] + z, 6, 0.06, 0.5, rgb(0xffffff, 1));
    O = GZ.garage;
    floor(none, O[0] - 16, O[2] - 16, O[0] + 16, O[2] + 16, 0, 0x7a7c80);
    for (let x = -12; x <= 12; x += 8) for (let z = -12; z <= 12; z += 8) block(none, O[0] + x, 2, O[2] + z, 0.8, 4, 0.8, 0x9a9ca0);
    for (let x = -14; x <= 14; x += 3) block(none, O[0] + x, 0.01, O[2] + 2, 0.12, 0.02, 4, 0xe8e2b0);
    block(none, O[0], 0.25, O[2] - 4, 32, 0.5, 0.6, 0x8a8c90);
    O = GZ.raid;
    floor(none, O[0] - 6, O[2] - 5, O[0] + 6, O[2] + 5, 0, 0x5a4e40);
    room(none, O[0] - 6, O[2] - 5, O[0] + 6, O[2] + 5, 3.4, 0x9a9488);
    ceil(none, O[0] - 6, O[2] - 5, O[0] + 6, O[2] + 5, 3.4, 0xb8b0a4);
    block(none, O[0] + 2, 0.45, O[2] - 3, 2.4, 0.9, 1.2, 0x4a3a2a);
    block(G.b('lightsW'), O[0], 3.35, O[2], 1.2, 0.06, 0.3, rgb(0xfff4e0, 1));
    return G.done(r, { lightsW: {} });
  }

  function buildRecap(r) {
    const G = groups();
    const none = G.b('none');
    floor(G.b('blueTiles#rf'), -60, -60, 60, 60, -9, rgb(0xa8c8ff, 0.6), 0.25);
    block(G.b('brick'), 0, -0.35, 0, 40, 0.7, 3, 0xffffff, 0.6);
    [-1.4, 1.4].forEach(z => block(G.b('brick#r'), 0, 0.25, z, 40, 0.5, 0.2, 0xffffff, 0.6));
    [-12, 0, 12].forEach(x => block(G.b('brick#p'), x, -5, 0, 1.6, 9, 1.6, 0xffffff, 0.6));
    cylinderHill(G.b('grass#rc'), 8, -10, 5, 0.5, 11);
    cylinderHill(G.b('grass#rc'), -14, -16, 6, 1, 12);
    return G.done(r, {});
  }

  function octPane(G, key, x, y, z, w, h, yaw, col) {
    G.b(key).at(x, y, z, q => {
      q.push(M4.rotY(yaw));
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2 + PI / 8;
        pts.push([C(a) * w / 2 / C(PI / 8), S(a) * h / 2 / C(PI / 8), 0.04]);
      }
      const n = [0, 0, 1];
      const uv = p => [0.5 + p[0] / w, 0.5 + p[1] / h];
      for (let i = 0; i < 8; i++) q.tri([0, 0, 0.04], pts[i], pts[(i + 1) % 8], col, [[0.5, 0.5], uv(pts[i]), uv(pts[(i + 1) % 8])], [n, n, n]);
      q.pop();
    });
  }

  function buildBluLock(r) {
    const G = groups();
    const none = G.b('none');
    const W = 7, Dp = 6, Hh = 4.2;
    floor(none, -W, -Dp, W, Dp, 0, 0x3a5288);
    ceil(none, -W, -Dp, W, Dp, Hh, 0x7a98c8);
    wall(none, [-W, 0, -Dp], [W, 0, -Dp], 0, Hh, 0x5a7ab0);
    wall(none, [W, 0, Dp], [-W, 0, Dp], 0, Hh, 0x5a7ab0);
    wall(none, [-W, 0, Dp], [-W, 0, -Dp], 0, Hh, 0x5272a8);
    wall(none, [W, 0, -Dp], [W, 0, Dp], 0, Hh, 0x5272a8);
    block(none, 0, 0.06, -Dp + 0.03, 2 * W, 0.12, 0.06, 0x1e2a44);
    for (let i = 0; i < 4; i++) block(G.b('lightsW'), -4.5 + i * 3, Hh - 0.05, 0, 1.6, 0.06, 0.3, rgb(0xf4f8ff, 0.95));
    lockers(none, -6.4, -0.6, -(Dp - 0.35), 0, 0x3a2a1c, 0x22160c);
    panel(G.b('chalkboard#bl'), 3.0, 2.2, -Dp + 0.04, 2.6, 1.3, 0);
    block(none, 3.0, 2.2, -Dp + 0.02, 2.8, 1.5, 0.03, 0x6a5a4a);
    none.at(-W + 0.04, 2.3, 1.2, q => {
      q.push(M4.rotY(PI / 2));
      q.box(2.24, 1.74, 0.06, 0x1e2a44);
      q.pop();
    });
    octPane(G, 'rainbow#bl', -W + 0.07, 2.3, 1.2, 2.0, 1.5, PI / 2, rgb(0xffffff, 0.5));
    block(none, W - 0.06, 1.25, -3.6, 0.08, 2.5, 2.2, 0xd8d4cc);
    return G.done(r, { lightsW: {} });
  }

  function buildNightExtra(G, none) {
    let O = NZ.bluExt;
    const wz = O[2] - 4;
    block(none, O[0], 3.2, wz - 3, 30, 6.4, 6, 0x4a7ac8);
    block(none, O[0], 6.5, wz - 0.1, 30.4, 0.3, 0.6, 0x3a5a98);
    block(none, O[0] + 3, 1.6, wz + 0.02, 3.2, 3.2, 0.04, 0x10203a);
    [[1.4, 0], [4.6, 0]].forEach(([dx]) => block(G.b('lightsW'), O[0] + dx, 1.7, wz + 0.06, 0.08, 3.4, 0.08, rgb(0x8ad8ff, 1)));
    block(G.b('lightsW'), O[0] + 3, 3.3, wz + 0.06, 3.3, 0.08, 0.08, rgb(0x8ad8ff, 1));
    wall(G.b('garage#be'), [O[0] - 8, 0, wz + 0.04], [O[0] - 4, 0, wz + 0.04], 0, 3.4, 0xffffff, [0, 0, 1, 6]);
    block(none, O[0] - 6, 3.6, wz + 0.25, 4.4, 0.45, 0.45, 0x8a8e94);
    floor(G.b('grass#be'), O[0] - 16, wz, O[0] + 16, O[2] + 10, 0.012, 0xffffff, 0.5);
    block(none, O[0] + 9, 0.5, O[2] + 1, 1.2, 1.0, 1.2, 0x5ab8e8);
    cylinderHill(G.b('grass#beh'), O[0] - 14, O[2] + 16, 6, 7, 21);
    O = NZ.workshop;
    floor(none, O[0] - 8, O[2] - 8, O[0] + 8, O[2] + 8, 0.01, 0x2a2622);
    wall(G.b('grassDark#ws'), [O[0] - 8, 0, O[2] - 4], [O[0] + 8, 0, O[2] - 4], 0, 6, 0xffffff, 0.5);
    wall(G.b('grassDark#ws2'), [O[0] - 4, 0, O[2] + 8], [O[0] - 4, 0, O[2] - 4], 0, 6, 0xffffff, 0.5);
    panel(G.b('hills#ws'), O[0] + 1, 3, O[2] - 3.95, 14, 6, 0);
    block(none, O[0] + 1.2, 0.45, O[2] - 2.6, 2.2, 0.9, 1.0, 0x3a2a1c);
    block(none, O[0] + 1.2, 0.92, O[2] - 2.6, 2.3, 0.05, 1.1, 0x4a3828);
    O = NZ.poster;
    floor(G.b('grass#np'), O[0] - 12, O[2] - 8, O[0] + 12, O[2] + 6, 0.012, 0xffffff, 0.5);
    panel(G.b('bigFace'), O[0], 4.2, O[2] - 5.7, 8, 7, 0);
    block(none, O[0], 4.2, O[2] - 5.85, 8.3, 7.3, 0.2, 0x141014);
    eyeBlock(none, O[0] - 2.8, 0.8, O[2] - 3.6, 1.6);
    for (let i = 0; i < 5; i++) {
      const cols = [0xc8261e, 0x7a3ab8, 0xe86aa8, 0x3a8ad8, 0xc8261e];
      block(none, O[0] + 4 + i * 0.5, 0.15 + i * 0.3, O[2], 0.5, 0.3 + i * 0.6, 6, cols[i]);
    }
    panel(G.b('hills#np'), O[0], 5, O[2] - 9, 30, 10, 0);
    cylinderHill(G.b('grass#nph'), O[0] - 9, O[2] - 11, 5, 7, 22);
    cylinderHill(G.b('grass#nph'), O[0] + 10, O[2] - 12, 6, 9, 23);
    O = NZ.resup;
    block(none, O[0] - 4.5, 2.4, O[2] - 6, 5, 4.8, 0.4, 0x2a8a8a);
    block(none, O[0] + 4.5, 2.4, O[2] - 6, 5, 4.8, 0.4, 0x2a8a8a);
    block(none, O[0], 4.0, O[2] - 6, 4, 1.6, 0.4, 0x2a8a8a);
    block(none, O[0], 5.0, O[2] - 6, 14.4, 0.4, 0.8, 0x1e6a6a);
    floor(none, O[0] - 2, O[2] - 12, O[0] + 2, O[2] - 6, 0.02, 0x9a9ca0);
    wall(none, [O[0] - 2, 0, O[2] - 12], [O[0] + 2, 0, O[2] - 12], 0, 3, 0xd8dce4);
    wall(none, [O[0] - 2, 0, O[2] - 6], [O[0] - 2, 0, O[2] - 12], 0, 3, 0xc8ccd4);
    wall(none, [O[0] + 2, 0, O[2] - 12], [O[0] + 2, 0, O[2] - 6], 0, 3, 0xc8ccd4);
    ceil(none, O[0] - 2, O[2] - 12, O[0] + 2, O[2] - 6, 3, 0xe8ecf2);
    block(G.b('lightsW'), O[0], 2.95, O[2] - 9, 1.6, 0.06, 0.3, rgb(0xffffff, 1));
    octPane(G, 'rainbow#rs', O[0], 1.7, O[2] - 11.95, 1.4, 1.1, 0, rgb(0xffffff, 0.6));
    panel(G.b('resupplyBlue'), O[0], 3.85, O[2] - 5.78, 2.4, 0.55, 0);
    floor(G.b('grass#rsg'), O[0] - 10, O[2] - 5.8, O[0] + 10, O[2] + 8, 0.012, 0xffffff, 0.5);
    block(G.b('rainbow#rsb'), O[0] - 11, 3, O[2] - 2, 4, 6, 6, 0xffffff, 0.2);
    O = NZ.finale;
    for (let i = -6; i < 6; i++) for (let j = -4; j < 4; j++) {
      const cols = [0xd8262a, 0xf06a1a, 0xf6c81a, 0x3cb832, 0x2a8ad8, 0x6a3ab8, 0xd83a9a];
      block(none, O[0] + i + 0.5, 0.06, O[2] + j + 0.5, 0.92, 0.12, 0.92, rgb(cols[(i + j + 12) % cols.length], 0.85));
    }
    floor(none, O[0] - 6.2, O[2] - 4.2, O[0] + 6.2, O[2] + 4.2, 0.005, 0x101010);
    block(none, O[0], 0.5, O[2] - 5.5, 10, 1.0, 2.6, 0xc8261e);
    block(none, O[0], 3.5, O[2] - 9, 30, 7, 0.4, 0x3ab83a);
    panel(G.b('coins#fn'), O[0], 4.0, O[2] - 8.78, 24, 6, 0);
    cylinderHill(G.b('grass#fnh'), O[0] - 13, O[2] - 6, 5, 8, 24);
    cylinderHill(G.b('grass#fnh'), O[0] + 13, O[2] - 6, 5, 7, 25);
  }

  function buildLessons(G, none) {
    const o = ZONES.lessons;
    const p = (x, y, z) => [o[0] + x, y, o[2] + z];
    let q = p(0, 4.5, -6);
    block(G.b('rainbow#ls'), q[0], q[1], q[2], 16, 9, 1, 0xffffff, 0.2);
    q = p(-12, 2.2, -6.2);
    block(none, q[0], q[1], q[2], 8, 2.6, 0.3, 0x2a2a2e);
    [['skyHeadA#ls', -14.8], ['posterHero#ls', -13.2], ['skyHeadB#ls', -11.6], ['comic#ls', -10.0], ['skyHeadC#ls', -8.6]].forEach(([k, x]) => panel(G.b(k), o[0] + x, 2.3, o[2] - 6.03, 1.4, 1.6, 0));
    [-15, -12, -9].forEach((x, i) => eyeBlock(none, o[0] + x, 4.2, o[2] - 6.2, 1.4, i === 1 ? 0xe86aa8 : 0xf2c82a));
    none.at(o[0] + 9.5, 0, o[2] - 5, h => {
      h.prism(14, 0.6, 0.6, 0, 0.6, 0.6, 2.4, 0x2a9a2a);
      h.at(0, 2.4, 0, e => e.prism(14, 0.75, 0.75, 0, 0.75, 0.75, 0.6, 0x3ab83a, { capBottom: true }));
    });
    cylinderHill(G.b('grass#lsh'), o[0] + 14, o[2] - 12, 7, 8, 26);
    floor(G.b('grass#ls'), o[0] - 20, o[2] - 22, o[0] + 20, o[2] - 7, 0.012, 0xffffff, 0.5);
    q = p(-18, 4, 10);
    panel(G.b('posterHero#ls2'), q[0], q[1], q[2], 4.4, 3.4, PI / 2);
    block(none, q[0] - 0.12, q[1], q[2], 0.2, 3.6, 4.6, 0x141414);
    [[-17.6, 7.5], [-17.6, 12.5]].forEach(([x, z]) => texBox(G.b('qblock#ls'), o[0] + x, 1.2, o[2] + z, 1.1, 1.1, 1.1, 0xffffff));
  }

  const BUILD = { kart: buildKart, red: buildRed, blu: buildBlu, dust: buildDust, dark: buildDark, board: buildBoard, night: buildNight, lair: buildLair, game: buildGame, recap: buildRecap, bluLock: buildBluLock };

  function build(r) {
    return { r, sets: {}, tex: {} };
  }

  function ensure(W, name) {
    if (!W.sets[name]) W.sets[name] = BUILD[name](W.r);
    return W.sets[name];
  }

  function draw(r, W, name, opts) {
    const o = opts || {};
    const items = ensure(W, name);
    const late = [];
    items.forEach(it => {
      if (it.blend) { late.push(it); return; }
      const pass = { texture: it.tex && Art.DRAW[it.tex] ? Art.tex(r, W.tex, it.tex) : null };
      if (o.tint) pass.tint = o.tint;
      r.draw(it.mesh, null, pass);
    });
    late.forEach(it => r.draw(it.mesh, null, { texture: it.tex && Art.DRAW[it.tex] ? Art.tex(r, W.tex, it.tex) : null, blend: true, alpha: it.alpha || 0.5, tint: it.tex === 'glass' ? [0.6, 0.9, 1.1] : undefined }));
  }

  function warm(r, W, names) {
    (names || Object.keys(BUILD)).forEach(n => ensure(W, n));
  }

  window.FabWorld = { build, draw, warm, cone, BUILD, ZONES, NZ, LZ, GZ };
})();
