(function () {
  const { M4, V3, Builder, rand, shade } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, mesh } = K;
  const Art = window.VazArt;

  const ROOM = { x0: -12, x1: 12, z0: -5.6, z1: 8, h: 3.4 };
  const COUNTER = { x0: -0.4, x1: 11, front: -2.55, back: -3.2, top: 0.97, end: [-0.4, -2.875], r: 0.325 };
  const SHELF = { x0: 0.5, x1: 11, z: -5.45, rows: [1.42, 1.86, 2.3] };
  const JUKEBOX = [-2.7, 0, -5.12];
  const STOOLS = [];
  for (let i = 0; i < 13; i++) STOOLS.push([0.25 + i * 0.82, -2.05]);
  [[-0.95, -2.2], [-1.25, -2.85]].forEach(p => STOOLS.push(p));
  const TABLES = {
    girls: { p: [-4.35, -2.55], chairs: [[-0.62, 0.2], [0.62, 0.2]] },
    betty: { p: [-5.9, 0.55], chairs: [[0, -0.55], [0.6, 0.25]], top: 0xe9a6a0 },
    front: { p: [-2.6, 1.5], chairs: [[0.55, 0.3], [-0.5, 0.35]] },
    side: { p: [-7.4, -1.45], chairs: [[0.6, 0], [-0.6, 0]] },
    far: { p: [3.2, 2.9], chairs: [[0.6, 0.1], [-0.6, -0.1]] }
  };
  const BOOTHS = [-5.3, -8.3];
  const COL = {
    wain: 0x5a2b2c,
    wall: 0x5e3534,
    chrome: 0xc9cdd4,
    chromeDark: 0x8a9098,
    pink: 0xe9a39a,
    seat: 0xc0262c,
    seatDark: 0x8e1a20,
    shelf: 0xd3e2ea,
    soffit: 0xbcd3e0,
    tableTop: 0xe8e8ec,
    lamp: [0.98, 0.9, 0.84, 1],
    kick: 0x2c2224
  };
  const JAR_COLS = [0xd8433a, 0xe8b6cf, 0xb79ad8, 0x2c3550, 0x9aa3ad, 0x3a3a44, 0xe7d4e4, 0x6ab07a, 0xd9d0e6, 0x8c5e9e, 0xf0b5b0, 0x50608a];

  function cyl(b, r, y0, y1, sides, col, uv, a0, a1) {
    const s0 = a0 === undefined ? 0 : a0, s1 = a1 === undefined ? PI * 2 : a1;
    for (let i = 0; i < sides; i++) {
      const u0 = i / sides, u1 = (i + 1) / sides;
      const t0 = s0 + (s1 - s0) * u0, t1 = s0 + (s1 - s0) * u1;
      const n0 = [S(t0), 0, C(t0)], n1 = [S(t1), 0, C(t1)];
      b.quad([n0[0] * r, y0, n0[2] * r], [n1[0] * r, y0, n1[2] * r], [n1[0] * r, y1, n1[2] * r], [n0[0] * r, y1, n0[2] * r], col,
        uv ? [[u0 * uv[0], 0], [u1 * uv[0], 0], [u1 * uv[0], uv[1]], [u0 * uv[0], uv[1]]] : null, [n0, n1, n1, n0]);
    }
    return b;
  }

  function grid(b, a, du, dv, nu, nv, col, uvStep) {
    const n = V3.norm(V3.cross(du, dv));
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const p = (u, v) => V3.add(a, V3.add(V3.mul(du, u / nu), V3.mul(dv, v / nv)));
        const uv = (u, v) => [u * uvStep[0] / nu, v * uvStep[1] / nv];
        b.quad(p(i, j), p(i + 1, j), p(i + 1, j + 1), p(i, j + 1), col, [uv(i, j), uv(i + 1, j), uv(i + 1, j + 1), uv(i, j + 1)], [n, n, n, n]);
      }
    }
    return b;
  }

  function buildFloor(b) {
    const w = ROOM.x1 - ROOM.x0, d = ROOM.z1 - ROOM.z0;
    grid(b, [ROOM.x0, 0, ROOM.z1], [w, 0, 0], [0, 0, -d], Math.round(w / 1.1), Math.round(d / 1.1), 0xffffff, [w / 1.1, d / 1.1]);
  }

  function buildWalls(b) {
    const w = ROOM.x1 - ROOM.x0, d = ROOM.z1 - ROOM.z0, mid = (ROOM.x0 + ROOM.x1) / 2;
    grid(b, [ROOM.x0, 0, ROOM.z0], [w, 0, 0], [0, 0.95, 0], 24, 1, COL.wain, [1, 1]);
    grid(b, [ROOM.x0, 2.38, ROOM.z0], [w, 0, 0], [0, ROOM.h - 2.38, 0], 24, 1, COL.wall, [1, 1]);
    b.at(mid, 0.97, ROOM.z0 + 0.06, h => h.box(w, 0.05, 0.14, COL.chrome));
    b.at(mid, 2.37, ROOM.z0 + 0.04, h => h.box(w, 0.05, 0.1, COL.chromeDark));
    grid(b, [ROOM.x0, 0, ROOM.z1], [0, 0, -d], [0, 0.95, 0], 12, 1, COL.wain, [1, 1]);
    grid(b, [ROOM.x0, 2.38, ROOM.z1], [0, 0, -d], [0, ROOM.h - 2.38, 0], 12, 1, COL.wall, [1, 1]);
    grid(b, [ROOM.x0, 0.95, ROOM.z1], [0, 0, -d + 5.1], [0, 1.43, 0], 8, 2, COL.wall, [1, 1]);
    grid(b, [ROOM.x1, 0, ROOM.z0], [0, 0, d], [0, ROOM.h, 0], 12, 3, COL.wall, [1, 1]);
    grid(b, [ROOM.x1, 0, ROOM.z1], [-w, 0, 0], [0, ROOM.h, 0], 24, 3, COL.wall, [1, 1]);
  }

  function buildWindow(b) {
    const x0 = ROOM.x0, x1 = SHELF.x0 + 0.4;
    grid(b, [x0, 0.99, ROOM.z0 + 0.02], [x1 - x0, 0, 0], [0, 1.37, 0], 12, 1, [1, 1, 1, 0.72], [3, 1]);
    grid(b, [ROOM.x0 + 0.02, 0.99, -0.5], [0, 0, ROOM.z0 + 0.5], [0, 1.37, 0], 4, 1, [1, 1, 1, 0.72], [1.2, 1]);
  }

  function buildMullions(b) {
    for (let x = ROOM.x0 + 1.6; x < SHELF.x0 + 0.4; x += 2.2) b.at(x, 1.68, ROOM.z0 + 0.05, h => h.box(0.05, 1.37, 0.06, COL.chromeDark));
  }

  function buildCeiling(b) {
    const w = ROOM.x1 - ROOM.x0, d = ROOM.z1 - ROOM.z0;
    grid(b, [ROOM.x0, ROOM.h, ROOM.z0], [w, 0, 0], [0, 0, d], 12, 7, 0xffffff, [6, 4]);
  }

  const LAMPS = [];
  for (let x = -9; x <= 9; x += 3) for (let z = -3.5; z <= 6; z += 3.2) LAMPS.push([x, z]);

  function buildLamps(b) {
    LAMPS.forEach(([x, z]) => {
      b.at(x, ROOM.h - 0.012, z, h => {
        h.push(M4.rotX(PI));
        h.disc(0.3, 16, COL.lamp);
        h.pop();
      });
      b.at(x, ROOM.h - 0.006, z, h => {
        h.push(M4.rotX(PI));
        h.disc(0.36, 16, [0.62, 0.44, 0.42, 0.6]);
        h.pop();
      });
    });
  }

  function counterOutline(n) {
    const pts = [];
    const [cx, cz] = COUNTER.end;
    for (let i = 0; i <= n; i++) {
      const a = PI * 0.5 + (i / n) * PI;
      pts.push([cx + C(a) * 0 - S(a) * COUNTER.r, cz + C(a) * COUNTER.r]);
    }
    return pts;
  }

  function buildCounterFront(b) {
    const len = COUNTER.x1 - COUNTER.x0;
    grid(b, [COUNTER.x0, 0.12, COUNTER.front], [len, 0, 0], [0, 0.82, 0], Math.round(len), 1, 0xffffff, [len / 0.8, 0.82 / 0.8]);
    const [cx, cz] = COUNTER.end;
    b.push(M4.translate(cx, 0, cz));
    cyl(b, COUNTER.r, 0.12, 0.94, 10, 0xffffff, [(PI * COUNTER.r) / 0.8, 0.82 / 0.8], -PI, 0);
    b.pop();
  }

  function buildCounterBody(b) {
    const len = COUNTER.x1 - COUNTER.x0;
    const midX = (COUNTER.x0 + COUNTER.x1) / 2;
    b.at(midX, 0.06, COUNTER.front - 0.03, h => h.box(len, 0.12, 0.06, COL.kick));
    b.at(midX, COUNTER.top, (COUNTER.front + COUNTER.back) / 2 + 0.04, h => h.box(len, 0.06, COUNTER.front - COUNTER.back + 0.16, COL.pink, { faces: { front: COL.chrome } }));
    b.at(midX, COUNTER.top - 0.045, COUNTER.front + 0.13, h => h.box(len, 0.035, 0.03, COL.chrome));
    const [cx, cz] = COUNTER.end;
    b.at(cx, 0, cz, h => {
      h.prism(10, COUNTER.r + 0.025, COUNTER.r + 0.025, 0, COUNTER.r + 0.025, COUNTER.r + 0.025, 0.12, COL.kick, { capTop: false, phase: PI });
      h.prism(12, COUNTER.r + 0.11, COUNTER.r + 0.11, COUNTER.top - 0.03, COUNTER.r + 0.11, COUNTER.r + 0.11, COUNTER.top + 0.03, COL.pink, { capTop: true });
      h.prism(12, COUNTER.r + 0.115, COUNTER.r + 0.115, COUNTER.top - 0.065, COUNTER.r + 0.115, COUNTER.r + 0.115, COUNTER.top - 0.03, COL.chrome, { capTop: false });
    });
    b.at(midX, 0.45, -4.95, h => h.box(len + 0.6, 0.9, 0.7, 0x8a6e66, { faces: { front: 0xa98e84 } }));
    b.at(midX, 0.93, -4.95, h => h.box(len + 0.6, 0.05, 0.74, COL.pink));
  }

  function buildSamItems(b) {
    const y = COUNTER.top + 0.03, z = COUNTER.front - 0.2;
    b.at(1.28, y, z + 0.02, h => {
      h.prism(10, 0.06, 0.06, 0, 0.075, 0.075, 0.06, 0xd8dade, { capTop: false, capBottom: true });
      h.prism(10, 0.07, 0.07, 0.055, 0.075, 0.075, 0.065, 0x6a6e74, { capTop: true });
    });
    b.at(1.42, y, z, h => {
      h.prism(8, 0.035, 0.035, 0, 0.042, 0.042, 0.13, [0.8, 0.86, 0.9, 0.2], { capTop: false });
      h.prism(8, 0.03, 0.03, 0.003, 0.037, 0.037, 0.09, 0xeef2f4);
    });
    [1.5, 1.56].forEach((x, i) => b.at(x, y, z - 0.05, h => {
      h.prism(8, 0.022, 0.022, 0, 0.022, 0.022, 0.08, [0.85, 0.88, 0.9, 0.2], { capTop: false });
      h.prism(8, 0.024, 0.024, 0.08, 0.016, 0.016, 0.105, 0xc0c4ca);
    }));
    b.at(1.68, y, z - 0.04, h => {
      h.box(0.13, 0.16, 0.08, 0x2a3f8a, { base: true });
      h.at(0, 0.02, 0, k => k.box(0.11, 0.13, 0.085, 0xf4f4f4, { base: true }));
    });
    b.at(1.82, y, z - 0.02, h => {
      h.prism(10, 0.042, 0.042, 0, 0.042, 0.042, 0.12, 0x5a3220, { capTop: true, capBottom: true });
      h.at(0.05, 0.06, 0, k => k.box(0.025, 0.07, 0.015, 0x5a3220));
    });
  }

  function buildCounterItems(b) {
    buildSamItems(b);
    const g = rand(11);
    for (let x = 0.1; x < COUNTER.x1 - 0.3; x += 1.25 + g() * 0.4) {
      if (x > 1.0 && x < 2.1) continue;
      const z = COUNTER.front - 0.28 - g() * 0.12;
      const y = COUNTER.top + 0.03;
      b.at(x, y, z, h => {
        h.box(0.14, 0.13, 0.07, COL.chrome, { base: true });
        h.at(0, 0.02, 0, k => k.box(0.12, 0.1, 0.075, 0xf4f4f4, { base: true }));
      });
      b.at(x + 0.16, y, z + 0.04, h => {
        h.prism(8, 0.035, 0.035, 0, 0.035, 0.035, 0.1, [0.9, 0.92, 0.94, 0.15], { capTop: false });
        h.prism(8, 0.037, 0.037, 0.1, 0.02, 0.02, 0.14, COL.chrome, { capTop: true });
      });
      b.at(x + 0.25, y, z + 0.02, h => {
        h.prism(8, 0.022, 0.022, 0, 0.022, 0.022, 0.07, 0xf0f0f0, { capTop: false });
        h.prism(8, 0.022, 0.022, 0.07, 0.016, 0.016, 0.09, COL.chrome);
      });
      if (g() < 0.5) {
        b.at(x - 0.22, y, z + 0.08, h => {
          h.prism(8, 0.04, 0.04, 0, 0.045, 0.045, 0.13, [0.75, 0.82, 0.86, 0.1], { capTop: false });
          h.prism(8, 0.035, 0.035, 0.002, 0.04, 0.04, 0.09, 0x6b3a28);
        });
      }
    }
  }

  function buildShelves(b) {
    const len = SHELF.x1 - SHELF.x0 + 1.2;
    const mid = (SHELF.x0 + SHELF.x1) / 2 - 0.3;
    SHELF.rows.forEach(y => {
      b.at(mid, y - 0.025, SHELF.z + 0.18, h => h.box(len, 0.05, 0.4, COL.shelf, { faces: { front: 0xeef4f8 } }));
    });
    b.at(mid, 2.86, -4.4, h => h.box(len + 0.4, 0.28, 2.3, COL.soffit, { faces: { bottom: 0xa8c0cf, front: 0xc8dce8 } }));
    b.at(mid, 2.86, -3.2, h => {
      h.push(M4.rotZ(PI / 2));
      h.prism(16, 0.14, 0.14, -len / 2 - 0.2, 0.14, 0.14, len / 2 + 0.2, 0xd4e4ee, { capTop: true, capBottom: true });
      h.pop();
    });
  }

  function jar(b, x, y, z, col, big) {
    const r = big ? 0.13 : 0.1, hgt = big ? 0.3 : 0.24;
    b.at(x, y, z, h => {
      h.prism(10, r * 0.85, r * 0.85, 0, r, r, hgt * 0.25, col, { capTop: false, capBottom: true });
      h.prism(10, r, r, hgt * 0.25, r, r, hgt * 0.7, col, { capTop: false });
      h.prism(10, r, r, hgt * 0.7, r * 0.55, r * 0.55, hgt * 0.85, shade(col, 1.1), { capTop: false });
      h.prism(10, r * 0.6, r * 0.6, hgt * 0.85, r * 0.6, r * 0.6, hgt * 0.92, 0xc8ccd2, { capTop: false });
      h.prism(10, r * 0.6, r * 0.6, hgt * 0.92, r * 0.25, r * 0.25, hgt * 1.0, 0xc8ccd2, { capTop: true });
      h.at(0, hgt * 1.02, 0, k => k.ellipsoid(0.025, 0.02, 0.025, 6, 4, 0xd8dce2));
    });
  }

  function buildJars(b) {
    const g = rand(21);
    SHELF.rows.forEach((y, row) => {
      for (let x = SHELF.x0 + 0.1; x < SHELF.x1; x += 0.3 + g() * 0.1) {
        jar(b, x, y, SHELF.z + 0.2 + (g() - 0.5) * 0.06, JAR_COLS[Math.floor(g() * JAR_COLS.length)], row === 0 ? g() < 0.6 : g() < 0.3);
      }
    });
    for (let x = COUNTER.x0 + 0.6; x < COUNTER.x1; x += 0.55 + g() * 0.4) jar(b, x, 0.955, -4.95 + (g() - 0.5) * 0.2, JAR_COLS[Math.floor(g() * JAR_COLS.length)], g() < 0.5);
  }

  function stool(b, x, z) {
    b.at(x, 0, z, h => {
      h.prism(14, 0.2, 0.2, 0, 0.17, 0.17, 0.04, COL.chrome, { capTop: true });
      for (let i = 0; i < 6; i++) {
        const y0 = 0.04 + i * 0.09;
        h.prism(8, 0.055, 0.055, y0, 0.055, 0.055, y0 + 0.05, i % 2 ? COL.chromeDark : COL.chrome, { capTop: false });
        h.prism(8, 0.05, 0.05, y0 + 0.05, 0.05, 0.05, y0 + 0.09, 0xeeeeee, { capTop: false });
      }
      h.prism(14, 0.16, 0.16, 0.58, 0.2, 0.2, 0.62, COL.chrome, { capTop: false, capBottom: true });
      h.prism(14, 0.205, 0.205, 0.62, 0.205, 0.205, 0.66, 0xe4e6ea, { capTop: false });
      h.prism(14, 0.215, 0.215, 0.66, 0.205, 0.205, 0.71, COL.seat, { capTop: false });
      h.prism(14, 0.205, 0.205, 0.71, 0.15, 0.15, 0.74, shade(COL.seat, 1.15), { capTop: true });
    });
  }

  function chair(b, x, z, yaw) {
    b.push(M4.translate(x, 0, z), M4.rotY(yaw));
    [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([cx, cz]) => {
      b.at(cx, 0, cz, h => h.prism(6, 0.013, 0.013, 0, 0.013, 0.013, 0.44, COL.chrome, { capTop: false }));
    });
    b.at(0, 0.44, 0, h => h.prism(14, 0.21, 0.21, 0, 0.2, 0.2, 0.06, COL.seat, { capTop: true, capBottom: true }));
    const rail = [];
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * PI;
      rail.push([C(a) * 0.17, 0.78 + S(a) * 0.1, -0.19]);
    }
    K.tube(b, [[0.17, 0.48, -0.19]].concat(rail).concat([[-0.17, 0.48, -0.19]]), new Array(13).fill(0.014), 5, COL.chrome);
    b.at(0, 0.7, -0.2, h => h.box(0.28, 0.14, 0.03, COL.seat));
    b.pop();
  }

  function table(b, x, z, top) {
    b.at(x, 0, z, h => {
      h.prism(14, 0.24, 0.24, 0, 0.2, 0.2, 0.03, COL.chrome, { capTop: true });
      h.prism(8, 0.035, 0.035, 0.03, 0.035, 0.035, 0.7, COL.chrome, { capTop: false });
      h.prism(20, 0.42, 0.42, 0.7, 0.42, 0.42, 0.74, top || COL.tableTop, { capTop: true, capBottom: true, topColor: top || 0xf2f2f6 });
      h.prism(20, 0.425, 0.425, 0.695, 0.425, 0.425, 0.745, COL.chrome, { capTop: false });
      h.at(0.08, 0.745, 0.05, k => {
        k.prism(8, 0.04, 0.04, 0, 0.05, 0.05, 0.2, [0.85, 0.9, 0.92, 0.2], { capTop: false });
        k.prism(8, 0.035, 0.035, 0.005, 0.045, 0.045, 0.14, 0xe9d7c0);
        k.at(0.02, 0.1, 0, q => q.prism(4, 0.005, 0.005, 0, 0.005, 0.005, 0.18, 0xf2f2f2));
      });
      h.at(-0.1, 0.745, -0.08, k => {
        k.box(0.1, 0.11, 0.05, COL.chrome, { base: true });
      });
      h.at(-0.02, 0.745, 0.14, k => k.prism(8, 0.06, 0.06, 0, 0.08, 0.08, 0.05, 0xd8dade, { capTop: false, capBottom: true }));
    });
  }

  function booth(b, x) {
    const z = -4.75;
    [-1, 1].forEach(s => {
      b.at(x + s * 0.78, 0, z, h => {
        h.box(0.5, 0.42, 1.25, COL.seatDark, { base: true });
        h.at(0, 0.42, 0, k => k.box(0.52, 0.1, 1.27, COL.seat, { base: true }));
        h.at(s * 0.2, 0.5, 0, k => k.box(0.14, 0.75, 1.27, COL.seat, { base: true }));
        h.at(s * 0.2, 1.25, 0, k => k.box(0.16, 0.05, 1.29, COL.chrome, { base: true }));
      });
    });
    b.at(x, 0, z, h => {
      h.prism(8, 0.05, 0.05, 0, 0.05, 0.05, 0.7, COL.chrome, { capTop: false });
      h.at(0, 0.73, 0, k => k.box(0.95, 0.05, 1.1, COL.tableTop));
    });
  }

  function buildDivider(b) {
    b.at(-1.9, 0, 3.6, h => {
      h.box(2.6, 0.62, 0.32, 0xf0efe9, { base: true });
      h.at(0, 0.62, 0, k => k.box(2.5, 0.08, 0.26, 0x2f5a3a, { base: true }));
      for (let i = 0; i < 9; i++) h.at(-1.1 + i * 0.27, 0.7, (i % 2 ? 0.05 : -0.05), k => k.ellipsoid(0.13, 0.12, 0.1, 6, 4, i % 2 ? 0x3e7a4a : 0x2f6a3e));
    });
  }

  function buildJukeBody(b) {
    b.at(0, 0, 0, h => {
      h.box(0.92, 0.12, 0.6, 0x7c1418, { base: true });
      h.at(0, 0.12, 0, k => k.box(0.86, 0.5, 0.56, 0xc4252b, { base: true, faces: { front: false } }));
      h.at(0, 0.62, 0, k => k.box(0.86, 0.12, 0.56, 0xb31f25, { base: true }));
      h.at(0, 0.74, -0.03, k => k.box(0.78, 0.36, 0.5, 0x8c171c, { base: true, faces: { front: false } }));
      h.at(0, 0.74, 0.17, k => k.box(0.66, 0.05, 0.16, 0xd8d0c8, { base: true }));
      h.push(M4.translate(0, 0.83, 0.2), M4.rotX(-0.55));
      h.box(0.6, 0.14, 0.03, 0xb51e24);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) h.at(-0.2 + i * 0.045, -0.04 + j * 0.04, 0.02, k => k.box(0.032, 0.028, 0.02, 0xf08a2a, { faces: { front: 0xffa040 } }));
      h.at(0.13, 0, 0.018, k => {
        k.box(0.1, 0.12, 0.012, 0xa4a8b0, { faces: { front: 0xc8ccd4 } });
        k.at(0, 0.008, 0.007, q => q.box(0.012, 0.055, 0.004, 0x18181c));
        k.at(0, -0.045, 0.008, q => q.box(0.05, 0.012, 0.004, 0x6a6e76));
      });
      [0.22, 0.26].forEach(x => h.at(x, 0.02, 0.02, k => k.box(0.026, 0.026, 0.02, 0xf08a2a)));
      h.pop();
      h.at(0, 1.1, -0.05, k => k.box(0.78, 0.04, 0.46, 0xc4252b));
    });
    const cy = 1.12, ro = 0.44, ri = 0.33, zf = 0.2, zb = -0.3;
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * PI, a1 = ((i + 1) / 16) * PI;
      const o0 = [C(a0) * ro, cy + S(a0) * ro], o1 = [C(a1) * ro, cy + S(a1) * ro];
      const i0 = [C(a0) * ri, cy + S(a0) * ri], i1 = [C(a1) * ri, cy + S(a1) * ri];
      const col = i % 2 ? 0xc4252b : 0xf4efe8;
      b.quad([o1[0], o1[1], zf], [o0[0], o0[1], zf], [i0[0], i0[1], zf], [i1[0], i1[1], zf], col);
      const n0 = [C(a0), S(a0), 0], n1 = [C(a1), S(a1), 0];
      b.quad([o0[0], o0[1], zb], [o1[0], o1[1], zb], [o1[0], o1[1], zf], [o0[0], o0[1], zf], 0xa01c22, null, [n0, n1, n1, n0]);
      b.quad([i0[0], i0[1], zf - 0.08], [i1[0], i1[1], zf - 0.08], [i1[0], i1[1], zf], [i0[0], i0[1], zf], 0xd8d2cc);
      b.tri([0, cy, zf - 0.08], [C(a1) * ri, cy + S(a1) * ri, zf - 0.08], [C(a0) * ri, cy + S(a0) * ri, zf - 0.08], [0.62, 0.7, 0.78, 0.35]);
    }
    b.at(0, cy + 0.02, zf - 0.18, h => {
      h.push(M4.rotX(PI / 2));
      h.disc(0.17, 18, 0x141016);
      h.pop();
    });
    b.at(-0.12, cy + 0.04, zf - 0.13, h => {
      h.push(M4.rotX(PI / 2));
      h.disc(0.1, 14, 0x1c1a20);
      h.pop();
    });
    b.at(0, 1.58, -0.05, h => h.ellipsoid(0.11, 0.08, 0.06, 8, 5, 0xc4252b));
    [-1, 1].forEach(s => b.at(s * 0.1, 1.6, -0.05, h => h.ellipsoid(0.09, 0.05, 0.05, 6, 4, 0xe03a40)));
  }

  function buildJukeGrille(b) {
    b.quad([-0.38, 0.15, 0.285], [0.38, 0.15, 0.285], [0.38, 0.6, 0.285], [-0.38, 0.6, 0.285], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
  }

  function buildJukeSwirl(b) {
    K.discXY(b, 0, 0.3, 0.292, 0.13, 20, 0xffffff);
  }

  function buildJukePillars(b) {
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.45, 0.12, 0.2));
      cyl(b, 0.07, 0, 1.0, 10, 0xffffff, [1, 3]);
      b.pop();
    });
  }

  function buildShadowBlob(b) {
    b.push(M4.rotX(-PI / 2));
    K.discXY(b, 0, 0, 0, 1, 20, [1, 1, 1, 1]);
    b.pop();
  }

  function buildUnitQuad(b) {
    b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
  }

  function buildStatic(b) {
    buildWalls(b);
    buildMullions(b);
    buildLamps(b);
    buildCounterBody(b);
    buildCounterItems(b);
    buildShelves(b);
    buildJars(b);
    STOOLS.forEach(([x, z]) => stool(b, x, z));
    BOOTHS.forEach(x => booth(b, x));
    Object.values(TABLES).forEach(T => {
      table(b, T.p[0], T.p[1], T.top);
      T.chairs.forEach(([dx, dz]) => chair(b, T.p[0] + dx, T.p[1] + dz, Math.atan2(-dx, -dz)));
    });
    buildDivider(b);
  }

  function build(r) {
    const T = {
      floor: r.texture(128, Art.checker),
      tiles: r.texture(128, Art.counterTiles),
      sky: r.texture(256, Art.sky, { height: 128 }),
      ceiling: r.texture(64, Art.ceiling),
      grille: r.texture(128, Art.grille),
      swirl: r.texture(128, Art.swirl, { clamp: true }),
      stripes: r.texture(64, Art.stripes),
      glow: r.texture(64, Art.glow, { clamp: true }),
      shaft: r.texture(64, Art.shaft, { clamp: true })
    };
    const V = {
      floor: mesh(r, buildFloor),
      window: mesh(r, buildWindow),
      ceiling: mesh(r, buildCeiling),
      counterFront: mesh(r, buildCounterFront),
      statics: mesh(r, buildStatic),
      jukeBody: mesh(r, buildJukeBody),
      jukeGrille: mesh(r, buildJukeGrille),
      jukeSwirl: mesh(r, buildJukeSwirl),
      jukePillars: mesh(r, buildJukePillars),
      blob: mesh(r, buildShadowBlob),
      quad: mesh(r, buildUnitQuad)
    };
    return { T, V };
  }

  function jukeM() {
    return M4.translate(JUKEBOX[0], JUKEBOX[1], JUKEBOX[2]);
  }

  function draw(r, W, st) {
    const { T, V } = W;
    const tint = st.roomTint;
    const o = tint ? { tint } : {};
    r.draw(V.floor, null, Object.assign({ texture: T.floor }, o));
    r.draw(V.statics, null, o);
    r.draw(V.counterFront, null, Object.assign({ texture: T.tiles }, o));
    r.draw(V.ceiling, null, Object.assign({ texture: T.ceiling }, o));
    r.draw(V.window, null, { texture: T.sky, tint: st.windowTint || [1, 1, 1] });
    const jm = jukeM();
    const lit = st.jukeLit || 0;
    r.draw(V.jukeBody, jm, o);
    r.draw(V.jukeGrille, jm, { texture: T.grille, tint: [0.8 + lit * 0.9, 0.8 + lit * 0.7, 0.8 + lit * 0.3] });
    r.draw(V.jukeSwirl, jm, { texture: T.swirl, tint: [1 + lit * 0.6, 1 + lit * 0.4, 1 + lit * 0.4] });
    r.draw(V.jukePillars, jm, { texture: T.stripes, tint: [1 + lit * 0.7, 1 + lit * 0.5, 1 + lit * 0.5] });
  }

  function billboard(cam, p, w, h) {
    const f = V3.norm(V3.sub(cam.eye, p));
    let x = V3.cross([0, 1, 0], f);
    if (V3.len(x) < 1e-4) x = [1, 0, 0];
    x = V3.norm(x);
    const y = V3.cross(f, x);
    return new Float32Array([x[0] * w, x[1] * w, x[2] * w, 0, y[0] * h, y[1] * h, y[2] * h, 0, f[0], f[1], f[2], 0, p[0], p[1], p[2], 1]);
  }

  function beam(cam, a, b, w) {
    const axis = V3.sub(b, a);
    const len = V3.len(axis);
    const y = V3.mul(axis, 1 / len);
    const mid = V3.lerp(a, b, 0.5);
    let x = V3.cross(y, V3.sub(cam.eye, mid));
    if (V3.len(x) < 1e-4) x = [1, 0, 0];
    x = V3.norm(x);
    const z = V3.cross(x, y);
    return new Float32Array([x[0] * w, x[1] * w, x[2] * w, 0, y[0] * len, y[1] * len, y[2] * len, 0, z[0], z[1], z[2], 0, mid[0], mid[1], mid[2], 1]);
  }

  const DUST = (() => {
    const g = rand(77);
    const out = [];
    for (let i = 0; i < 140; i++) out.push([g(), g(), g(), g() * PI * 2, 0.4 + g() * 0.6]);
    return out;
  })();

  function drawFx(r, W, st, cam, t) {
    const { T, V } = W;
    (st.pools || []).forEach(p => {
      const m = M4.chain(M4.translate(p.x, 0.012, p.z), M4.scale(p.r * 1.25, 1, p.r));
      r.draw(V.blob, m, { texture: T.glow, additive: true, alpha: p.a, tint: p.col || [1, 0.92, 0.72], noFog: true });
    });
    (st.shafts || []).forEach(s => {
      r.draw(V.quad, beam(cam, s.from, s.to, s.w), { texture: T.shaft, additive: true, alpha: s.a, tint: s.col || [1, 0.9, 0.7], noFog: true });
    });
    (st.glows || []).forEach(gl => {
      r.draw(V.quad, billboard(cam, gl.p, gl.s, gl.s), { texture: T.glow, additive: true, alpha: gl.a, tint: gl.col || [1, 0.8, 0.6], noFog: true });
    });
    if (st.dust) {
      const d = st.dust;
      const f = V3.norm(V3.sub(cam.at, cam.eye));
      const rt = V3.norm(V3.cross(f, [0, 1, 0]));
      const up = V3.cross(rt, f);
      DUST.forEach(([a, b, c, ph, k]) => {
        const depth = 0.6 + c * d.depth;
        const spread = depth * 0.6;
        const drift = t * 0.05 * k;
        const px = ((a + drift) % 1 - 0.5) * 2 * spread * 1.4;
        const py = (((b + t * 0.02 * k + S(t * 0.7 + ph) * 0.02) % 1) - 0.5) * 2 * spread;
        const p = V3.add(cam.eye, V3.add(V3.mul(f, depth), V3.add(V3.mul(rt, px), V3.mul(up, py))));
        const sz = 0.012 * depth * (0.6 + k * 0.6);
        r.draw(V.quad, billboard(cam, p, sz, sz), { texture: T.glow, additive: true, alpha: d.a * (0.4 + 0.6 * k), tint: d.col || [1, 0.92, 0.75], noFog: true });
      });
    }
  }

  function drawShadow(r, W, x, z, rx, rz, a) {
    r.draw(W.V.blob, M4.chain(M4.translate(x, 0.008, z), M4.scale(rx, 1, rz)), { blend: true, alpha: a, flat: [0.05, 0.04, 0.05, 1], noFog: true });
  }

  window.VazDiner = { ROOM, COUNTER, SHELF, JUKEBOX, STOOLS, TABLES, BOOTHS, LAMPS, build, draw, drawFx, drawShadow, billboard, beam, jukeM, cyl };
})();
