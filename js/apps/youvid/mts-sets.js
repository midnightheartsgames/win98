(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C } = K;
  const Art = window.MtsArt;

  const N_Y = [0, 1, 0];

  function plane(b, x0, z0, x1, z1, y, col, ru, rv) {
    b.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col, [[0, 0], [ru, 0], [ru, rv || ru], [0, rv || ru]], [N_Y, N_Y, N_Y, N_Y]);
  }

  function texBox(b, cx, cy, cz, w, h, d, col, rep) {
    const x = w / 2, y = h / 2, z = d / 2;
    const k = rep || 0.5;
    const uv = (a, c) => [[0, 0], [a * k, 0], [a * k, c * k], [0, c * k]];
    b.quad([cx - x, cy - y, cz + z], [cx + x, cy - y, cz + z], [cx + x, cy + y, cz + z], [cx - x, cy + y, cz + z], col, uv(w, h), [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    b.quad([cx + x, cy - y, cz - z], [cx - x, cy - y, cz - z], [cx - x, cy + y, cz - z], [cx + x, cy + y, cz - z], col, uv(w, h), [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
    b.quad([cx + x, cy - y, cz + z], [cx + x, cy - y, cz - z], [cx + x, cy + y, cz - z], [cx + x, cy + y, cz + z], col, uv(d, h), [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
    b.quad([cx - x, cy - y, cz - z], [cx - x, cy - y, cz + z], [cx - x, cy + y, cz + z], [cx - x, cy + y, cz - z], col, uv(d, h), [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]]);
  }

  function shed(b, roofB, x, z, w, d, h, yaw, rh) {
    b.push(M4.translate(x, 0, z), M4.rotY(yaw || 0));
    texBox(b, 0, h / 2, 0, w, h, d, 0xffffff, 0.45);
    b.tri([-w / 2, h, d / 2], [-w / 2, h, -d / 2], [-w / 2, h + rh, 0], 0xffffff, [[0, 0], [d * 0.45, 0], [d * 0.22, rh * 0.45]]);
    b.tri([w / 2, h, -d / 2], [w / 2, h, d / 2], [w / 2, h + rh, 0], 0xffffff, [[0, 0], [d * 0.45, 0], [d * 0.22, rh * 0.45]]);
    b.pop();
    roofB.push(M4.translate(x, 0, z), M4.rotY(yaw || 0));
    const p = (sx, sz) => [sx * (w / 2 + 0.25), h - 0.05, sz * (d / 2 + 0.3)];
    roofB.quad(p(-1, 1), p(1, 1), [w / 2 + 0.25, h + rh, 0], [-w / 2 - 0.25, h + rh, 0], 0x6e5446);
    roofB.quad(p(1, -1), p(-1, -1), [-w / 2 - 0.25, h + rh, 0], [w / 2 + 0.25, h + rh, 0], 0x5e463a);
    roofB.pop();
  }

  function cylinderY(b, x, z, r, y0, y1, col, sides) {
    b.at(x, 0, z, h => h.prism(sides || 18, r, r, y0, r, r, y1, col, { capTop: false }));
  }

  function silo(b, x, z, r, h, col, capCol) {
    cylinderY(b, x, z, r, 0, h, col, 22);
    b.at(x, h, z, q => q.ellipsoid(r * 1.02, r * 0.45, r * 1.02, 22, 6, capCol || col));
  }

  function cyclone(b, x, z, s) {
    const k = s || 1;
    b.push(M4.translate(x, 0, z), M4.scale(k, k, k));
    [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([lx, lz]) => b.at(lx, 1.6, lz, q => q.box(0.12, 3.2, 0.12, 0x5a5650)));
    b.prism(16, 0.15, 0.15, 3.0, 1.0, 1.0, 4.4, 0x9a968c, { capTop: false });
    b.prism(16, 1.0, 1.0, 4.4, 1.0, 1.0, 6.6, 0xa6a196, { capTop: false });
    b.at(0, 6.6, 0, q => q.ellipsoid(1.02, 0.35, 1.02, 16, 5, 0x8e8a80));
    b.at(0.6, 6.9, 0, q => q.prism(10, 0.3, 0.3, 0, 0.3, 0.3, 1.2, 0x8e8a80));
    for (let i = 0; i < 4; i++) b.at(0, 4.6 + i * 0.5, 0, q => q.prism(16, 1.03, 1.03, -0.03, 1.03, 1.03, 0.03, 0x6e6a62));
    b.pop();
  }

  function truss(b, a, c, w, col) {
    const d = V3.sub(c, a);
    const len = V3.len(d);
    const yaw = Math.atan2(d[0], d[2]);
    const pitch = -Math.asin(d[1] / len);
    b.push(M4.translate(a[0], a[1], a[2]), M4.rotY(yaw), M4.rotX(pitch));
    [[-w / 2, 0], [w / 2, 0], [-w / 2, 0.9], [w / 2, 0.9]].forEach(([x, y]) => b.at(x, y, len / 2, q => q.box(0.12, 0.12, len, col)));
    const n = Math.max(2, Math.round(len / 1.4));
    for (let i = 0; i <= n; i++) {
      const z = (i / n) * len;
      [-w / 2, w / 2].forEach(x => b.at(x, 0.45, z, q => q.box(0.08, 0.9, 0.08, col)));
      b.at(0, 0.9, z, q => q.box(w, 0.08, 0.08, col));
      if (i < n) [-w / 2, w / 2].forEach(x => {
        b.push(M4.translate(x, 0.45, z + len / n / 2), M4.rotX(Math.atan2(0.9, len / n)));
        b.box(0.05, 0.05, Math.hypot(0.9, len / n), col);
        b.pop();
      });
    }
    b.at(0, 1.05, len / 2, q => q.box(w + 0.3, 0.2, len, 0x4a4038));
    b.pop();
  }

  function pipeX(b, x0, x1, y, z, r, col) {
    b.push(M4.translate(0, y, z), M4.rotZ(PI / 2));
    b.prism(16, r, r, -x1, r, r, -x0, col, { capTop: true, capBottom: true });
    b.pop();
  }

  function pipeZ(b, z0, z1, y, x, r, col) {
    b.push(M4.translate(x, y, 0), M4.rotX(PI / 2));
    b.prism(16, r, r, z0, r, r, z1, col, { capTop: true, capBottom: true });
    b.pop();
  }

  function fence(b, a, c, h, col, rails) {
    const d = V3.sub(c, a);
    const len = Math.hypot(d[0], d[2]);
    const n = Math.max(1, Math.round(len / 2.2));
    for (let i = 0; i <= n; i++) {
      const p = V3.lerp(a, c, i / n);
      b.at(p[0], p[1] + h / 2, p[2], q => q.box(0.14, h, 0.14, col));
    }
    const yaw = Math.atan2(d[0], d[2]);
    const pitch = -Math.atan2(d[1], len);
    (rails || [0.45, 0.85]).forEach(f => {
      const m = V3.lerp(a, c, 0.5);
      b.push(M4.translate(m[0], m[1] + h * f, m[2]), M4.rotY(yaw), M4.rotX(pitch));
      b.box(0.05, 0.1, Math.hypot(len, d[1]), col);
      b.pop();
    });
  }

  function cypress(b, x, z, h, g) {
    b.at(x, 0.4, z, q => q.box(0.2, 0.8, 0.2, 0x3a2c22));
    b.at(x, h * 0.55, z, q => q.ellipsoid(h * 0.14, h * 0.5, h * 0.14, 10, 8, g() < 0.5 ? 0x5c6e3a : 0x667a42));
  }

  function pole(b, x, z, h) {
    b.at(x, h / 2, z, q => q.box(0.2, h, 0.2, 0x4a3a30));
    b.at(x, h - 0.5, z, q => q.box(1.6, 0.12, 0.12, 0x4a3a30));
  }

  function deadTree(b, x, z, h, g, col) {
    const branch = (p, dir, len, rad, depth) => {
      const q = V3.add(p, V3.mul(dir, len));
      K.tube(b, [p, q], [rad, rad * 0.7], 6, col);
      if (depth <= 0) return;
      for (let i = 0; i < 2; i++) {
        const a = g() * PI * 2;
        const nd = V3.norm(V3.add(dir, [C(a) * 0.7, 0.45 + g() * 0.3, S(a) * 0.7]));
        branch(q, nd, len * (0.6 + g() * 0.2), rad * 0.62, depth - 1);
      }
    };
    branch([x, 0, z], [0.06, 1, 0], h * 0.48, 0.22, 3);
  }

  function tufts(b, g, n, area, hgt, yAt) {
    for (let i = 0; i < n; i++) {
      const x = area[0] + g() * (area[2] - area[0]);
      const z = area[1] + g() * (area[3] - area[1]);
      const y = yAt ? yAt(x, z) : 0;
      const h = hgt * (0.55 + g() * 0.6), w = h * (0.9 + g() * 0.5);
      const a = g() * PI;
      for (let k = 0; k < 2; k++) {
        const ang = a + k * PI / 2;
        const dx = C(ang) * w / 2, dz = S(ang) * w / 2;
        const n0 = [-S(ang), 0.6, C(ang)];
        b.quad([x - dx, y - 0.02, z - dz], [x + dx, y - 0.02, z + dz], [x + dx, y + h, z + dz], [x - dx, y + h, z - dz], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [n0, n0, n0, n0]);
      }
    }
  }

  function skyDome(b, R, tex) {
    const n = 28, rows = 8;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < n; i++) {
        const pt = (ii, jj) => {
          const a = (ii / n) * PI * 2, e = (jj / rows) * PI / 2 - 0.12;
          return [S(a) * C(e) * R, S(e) * R, C(a) * C(e) * R];
        };
        const v = (jj) => jj / rows;
        b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), rgb(0xffffff, 1), [[0.5, v(j)], [0.5, v(j)], [0.5, v(j + 1)], [0.5, v(j + 1)]]);
      }
    }
  }

  const FARM = {
    pyro: [42, 0, -38],
    crates: [30, 0, -46],
    hill: [90, 0, 30],
    drill: [-40, 0, 0],
    alley: [-24, 0, 14],
    balcony: [-32, 0, 34],
    field: [6, 0, 30],
    yard2: [24, 0, -6],
    pipe: [-10, 0, -32],
    bridge: [-26, 0, -30],
    platform: [-12, 0, -60],
    spy: [-26, 0, -62]
  };

  function hillY(x, z) {
    const lx = x - FARM.hill[0];
    const k = 1 / (1 + Math.exp(-(lx - 1.5) / 2.2));
    return 5.2 * k * (1 - 0.15 * Math.sin((z - FARM.hill[2]) * 0.12));
  }

  function buildFarm(r) {
    const mk = (fn) => K.mesh(r, fn);
    const g = rand(301);
    const out = {};
    out.ground = mk(b => plane(b, -140, -140, 140, 140, 0, 0xffffff, 48));
    out.hill = mk(b => {
      const [hx, , hz] = FARM.hill;
      const nx = 24, nz = 12;
      const pt = (i, j) => {
        const x = hx - 14 + (i / nx) * 36, z = hz - 40 + (j / nz) * 60;
        return [x, hillY(x, z), z];
      };
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < nz; j++) {
          const a = pt(i, j), bb = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
          const n = V3.norm(V3.cross(V3.sub(d, a), V3.sub(bb, a)));
          b.quad(a, d, c, bb, 0xffffff, [[a[0] * 0.25, a[2] * 0.25], [d[0] * 0.25, d[2] * 0.25], [c[0] * 0.25, c[2] * 0.25], [bb[0] * 0.25, bb[2] * 0.25]], [n, n, n, n]);
        }
      }
    });
    out.corrugated = mk(b => {
      const roofs = new (window.P3D.Builder)();
      shed(b, roofs, FARM.pyro[0] + 1, FARM.pyro[2] + 6, 12, 7, 5.5, 0.15, 1.2);
      shed(b, roofs, FARM.crates[0] + 2, FARM.crates[2] + 6.5, 16, 8, 7, 0.1, 1.5);
      shed(b, roofs, FARM.drill[0], FARM.drill[2], 12, 9, 6, PI / 2, 1.4);
      shed(b, roofs, 26, 52, 14, 9, 6.5, -0.05, 1.6);
      shed(b, roofs, FARM.alley[0] - 6, FARM.alley[2] + 4, 7, 10, 5, 0.02, 1.2);
      shed(b, roofs, FARM.alley[0] + 7, FARM.alley[2] + 8, 8, 6, 4.4, -0.1, 1.0);
      shed(b, roofs, FARM.yard2[0] + 10, FARM.yard2[2] - 8, 9, 6, 5, -0.05, 1.2);
      out.roofs = r.mesh(roofs);
    });
    out.wood = mk(b => {
      const roofs = new (window.P3D.Builder)();
      shed(b, roofs, FARM.balcony[0], FARM.balcony[2] + 3, 10, 7, 7, 0.0, 1.6);
      shed(b, roofs, FARM.yard2[0] + 1.5, FARM.yard2[2] - 7, 11, 5, 4.4, 0.0, 1.0);
      shed(b, roofs, FARM.pipe[0] + 6.2, FARM.pipe[2] + 2, 10, 6, 6, 0.0, 1.4);
      shed(b, roofs, FARM.spy[0], FARM.spy[2] - 3, 9, 5, 5, 0.0, 1.2);
      shed(b, roofs, FARM.bridge[0] - 7, FARM.bridge[2], 6, 14, 6, 0.0, 1.2);
      shed(b, roofs, -22, 72, 16, 12, 12, -0.12, 4);
      out.roofs2 = r.mesh(roofs);
      b.push(M4.translate(FARM.balcony[0], 0, FARM.balcony[2] - 0.6));
      b.at(0, 3.2, 0, q => q.box(10, 0.18, 1.6, 0xffffff));
      for (let i = 0; i < 6; i++) b.at(-4.6 + i * 1.84, 1.6, -0.7, q => q.box(0.18, 3.2, 0.18, 0xffffff));
      for (let i = 0; i < 13; i++) b.at(-4.8 + i * 0.8, 3.75, -0.75, q => q.box(0.06, 1.0, 0.06, 0xffffff));
      b.at(0, 4.25, -0.75, q => q.box(10, 0.1, 0.1, 0xffffff));
      b.pop();
    });
    out.metal = mk(b => {
      cyclone(b, FARM.crates[0] + 6, FARM.crates[2] + 3, 1.1);
      truss(b, [FARM.crates[0] - 2.6, 2.6, FARM.crates[2] + 1.5], [FARM.crates[0] - 9, 9.5, FARM.crates[2] - 8], 2.2, 0x3e3632);
      [[FARM.crates[0] - 4.6, FARM.crates[2] - 1.2, 4.6], [FARM.crates[0] - 7, FARM.crates[2] - 4.6, 7.3]].forEach(([x, z, h]) => b.at(x, h / 2, z, q => q.box(0.25, h, 0.25, 0x3e3632)));
      truss(b, [-9, 2.5, 52], [-21, 13, 65], 2.4, 0x3e3632);
      pipeX(b, -30, 70, 3.4, 60, 0.45, 0x4a4440);
      for (let x = -28; x <= 68; x += 8) b.at(x, 1.7, 60, q => q.box(0.2, 3.4, 0.2, 0x3a3430));
      pipeZ(b, FARM.pipe[2] - 8, FARM.pipe[2] + 10, 0.75, FARM.pipe[0], 0.75, 0x5a504a);
      for (let z = FARM.pipe[2] - 6; z <= FARM.pipe[2] + 8; z += 4) b.at(FARM.pipe[0], 0.2, z, q => q.box(1.6, 0.4, 0.3, 0x3a3430));
      pipeZ(b, FARM.bridge[2] - 10, FARM.bridge[2] + 10, 1.3, FARM.bridge[0] + 6, 1.1, 0x6a625a);
      b.push(M4.translate(FARM.bridge[0], 2.6, FARM.bridge[2]));
      b.box(4, 0.25, 16, 0x4a4440);
      [-1.9, 1.9].forEach(x => {
        b.at(x, 0.65, 0, q => q.box(0.08, 0.08, 16, 0x6a5a40));
        for (let z = -7.5; z <= 7.5; z += 1.5) b.at(x, 0.35, z, q => q.box(0.06, 0.7, 0.06, 0x6a5a40));
      });
      [[-1.8, -7], [1.8, -7], [-1.8, 7], [1.8, 7]].forEach(([x, z]) => b.at(x, -1.3, z, q => q.box(0.25, 2.6, 0.25, 0x3a3430)));
      b.pop();
      b.push(M4.translate(FARM.platform[0], 0, FARM.platform[2]));
      b.prism(28, 3.2, 3.2, 0, 3.2, 3.2, 0.35, 0x6a665e);
      b.prism(28, 3.25, 3.25, 0.0, 3.25, 3.25, 0.12, 0x2a2826, { capTop: false });
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * PI * 2;
        if (i % 2) b.at(S(a) * 3.15, 0.36, C(a) * 3.15, q => { q.push(M4.rotY(a)); q.box(0.4, 0.01, 0.12, 0xd8b42a); q.pop(); });
      }
      b.pop();
      b.push(M4.translate(FARM.spy[0] + 3, 0, FARM.spy[2] - 0.3));
      for (let i = 0; i < 7; i++) b.at(0, 0.18 + i * 0.36, -i * 0.45, q => q.box(1.4, 0.08, 0.45, 0x8a8478));
      b.pop();
      [[FARM.field[0] - 4, FARM.field[2] + 45, 9], [FARM.field[0] - 12, FARM.field[2] + 48, 11]].forEach(([x, z, h]) => cylinderY(b, x, z, 3.2, 0, h, 0xffffff, 22));
      cyclone(b, 14, 56, 1.4);
      [[FARM.pyro[0] - 6, FARM.pyro[2] + 4], [FARM.drill[0] + 2, FARM.drill[2] + 16]].forEach(([x, z]) => pole(b, x, z, 8));
      for (let i = 0; i < 5; i++) pole(b, -20 + i * 18, 40 + (i % 2) * 6, 9);
    });
    out.siloCaps = mk(b => {
      [[FARM.field[0] - 4, FARM.field[2] + 45, 9], [FARM.field[0] - 12, FARM.field[2] + 48, 11]].forEach(([x, z, h]) => b.at(x, h, z, q => q.ellipsoid(3.25, 1.2, 3.25, 22, 6, 0x8e8478)));
    });
    out.crates = mk(b => {
      const [cx, , cz] = FARM.crates;
      [[0, 0.75, 0, 1.5], [1.6, 0.75, 0.2, 1.5], [0.8, 2.25, 0.1, 1.5], [-1.5, 0.6, 0.6, 1.2]].forEach(([x, y, z, s]) => b.at(cx + x, y, cz + z, q => q.box(s, s, s, 0xffffff, { uvScale: 1 / s })));
      [[FARM.yard2[0] - 4, 0.45, FARM.yard2[2] - 4.5, 0.9], [-30, 0.5, 20, 1.0], [-18, 0.45, -58, 0.9]].forEach(([x, y, z, s]) => b.at(x, y, z, q => q.box(s, s, s, 0xffffff, { uvScale: 1 / s })));
    });
    out.dyn = mk(b => {
      const [cx, , cz] = FARM.crates;
      b.push(M4.translate(cx + 2.9, 0.75, cz + 0.4), M4.rotY(-0.5));
      b.box(1.5, 1.5, 1.5, 0xffffff, { uvScale: 1 / 1.5 });
      b.pop();
    });
    out.fences = mk(b => {
      const [hx, , hz] = FARM.hill;
      for (let x = hx - 12; x < hx + 12; x += 2.4) fence(b, [x, hillY(x, hz - 2), hz - 2], [x + 2.4, hillY(x + 2.4, hz - 2), hz - 2], 1.1, 0x6a5a4a);
      fence(b, [FARM.yard2[0] - 9, 0, FARM.yard2[2] - 3.6], [FARM.yard2[0] - 3, 0, FARM.yard2[2] - 3.6], 1.3, 0x5a4a3a);
      fence(b, [-40, 0, 40], [-20, 0, 40], 1.1, 0x5a4a3a);
      fence(b, [FARM.platform[0] - 8, 0, FARM.platform[2] + 5], [FARM.platform[0] + 8, 0, FARM.platform[2] + 5], 1.2, 0x5a4a3a);
    });
    out.trees = mk(b => {
      for (let i = 0; i < 12; i++) cypress(b, -24 + i * 7 + g() * 2, 84 + g() * 6, 8 + g() * 4, g);
      const [hx, , hz] = FARM.hill;
      deadTree(b, hx - 8, hz - 4, 10, g, 0x3a2c24);
      deadTree(b, -46, 30, 9, g, 0x3a2c24);
    });
    out.tufts = mk(b => {
      tufts(b, g, 1600, [-20, 10, 50, 50], 0.6);
      tufts(b, g, 420, [FARM.hill[0] - 10, FARM.hill[2] - 8, FARM.hill[0] + 14, FARM.hill[2] + 10], 0.7, hillY);
      tufts(b, g, 160, [FARM.alley[0] - 6, FARM.alley[2] - 6, FARM.alley[0] + 8, FARM.alley[2] + 8], 0.6);
      tufts(b, g, 120, [FARM.crates[0] - 6, FARM.crates[2] - 8, FARM.crates[0] + 8, FARM.crates[2] + 2], 0.6);
      tufts(b, g, 150, [FARM.yard2[0] - 12, FARM.yard2[2] - 4, FARM.yard2[0] + 8, FARM.yard2[2] + 4], 0.45);
    });
    out.sky = mk(b => skyDome(b, 220));
    out.signs = {
      blu: mk(b => {
        b.push(M4.translate(FARM.crates[0] + 1, 8.7, FARM.crates[2] + 2.3), M4.rotY(0.1));
        b.quad([-3, 0, 0], [3, 0, 0], [3, 2.25, 0], [-3, 2.25, 0], 0xffffff, [[1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
        b.pop();
        b.push(M4.translate(FARM.pyro[0] + 1, 7.4, FARM.pyro[2] + 2.4), M4.rotY(0.15));
        b.quad([-2.4, 0, 0], [2.4, 0, 0], [2.4, 1.8, 0], [-2.4, 1.8, 0], 0xffffff, [[1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
        b.pop();
      }),
      bluBack: mk(b => {
        b.at(FARM.crates[0] + 1, 8.7 + 1.1, FARM.crates[2] + 2.4, q => { q.push(M4.rotY(0.1)); q.box(6.2, 2.4, 0.12, 0x2a2826); q.pop(); });
        b.at(FARM.pyro[0] + 1, 7.4 + 0.9, FARM.pyro[2] + 2.5, q => { q.push(M4.rotY(0.15)); q.box(5.0, 2.0, 0.12, 0x2a2826); q.pop(); });
        [[FARM.crates[0] - 1, FARM.crates[2] + 2.5], [FARM.crates[0] + 3, FARM.crates[2] + 2.5]].forEach(([x, z]) => b.at(x, 8.1, z, q => q.box(0.12, 1.4, 0.12, 0x2a2826)));
      }),
      drill: mk(b => {
        b.push(M4.translate(FARM.drill[0] + 4.52, 4.4, FARM.drill[2] - 2.6), M4.rotY(PI / 2));
        b.quad([-2.2, 0, 0], [2.2, 0, 0], [2.2, 0.75, 0], [-2.2, 0.75, 0], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        b.pop();
      }),
      drillDoor: mk(b => {
        b.push(M4.translate(FARM.drill[0] + 4.53, 0, FARM.drill[2] + 1.2), M4.rotY(PI / 2));
        b.quad([-1.4, 0, 0], [1.4, 0, 0], [1.4, 3.0, 0], [-1.4, 3.0, 0], 0x1c1612, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        b.pop();
        b.at(FARM.drill[0] + 4.7, 3.1, FARM.drill[2] + 1.2, q => q.box(0.25, 0.2, 3.2, 0x3a2e26));
        b.at(FARM.drill[0] + 4.7, 1.5, FARM.drill[2] - 0.3, q => q.box(0.25, 3.2, 0.2, 0x3a2e26));
        b.at(FARM.drill[0] + 4.7, 1.5, FARM.drill[2] + 2.7, q => q.box(0.25, 3.2, 0.2, 0x3a2e26));
      }),
      noSmoking: mk(b => {
        b.push(M4.translate(FARM.spy[0] - 1.2, 1.6, FARM.spy[2] - 0.47));
        b.quad([-0.45, 0, 0], [0.45, 0, 0], [0.45, 1.1, 0], [-0.45, 1.1, 0], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        b.pop();
      }),
      three: mk(b => {
        b.push(M4.translate(29, 3.4, 52 - 4.52));
        b.quad([-0.5, 0, 0], [0.5, 0, 0], [0.5, 1.0, 0], [-0.5, 1.0, 0], 0xffffff, [[1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
        b.pop();
        b.at(23, 1.6, 52 - 4.53, q => q.box(4.4, 3.2, 0.02, 0x2a201a));
      }),
      silo: mk(b => {
        [[FARM.field[0] - 4, FARM.field[2] + 45, 9], [FARM.field[0] - 12, FARM.field[2] + 48, 11]].forEach(([x, z, h]) => {
          const n = 22;
          for (let i = 0; i < n; i++) {
            const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
            const R = 3.22;
            b.quad([x + S(a0) * R, 0, z + C(a0) * R], [x + S(a1) * R, 0, z + C(a1) * R], [x + S(a1) * R, h, z + C(a1) * R], [x + S(a0) * R, h, z + C(a0) * R], 0xffffff, [[i / n * 2, 0], [(i + 1) / n * 2, 0], [(i + 1) / n * 2, 1], [i / n * 2, 1]], [[S(a0), 0, C(a0)], [S(a1), 0, C(a1)], [S(a1), 0, C(a1)], [S(a0), 0, C(a0)]]);
          }
        });
      })
    };
    return out;
  }

  const YARD = { gateZ: 0, gateTop: 1.32, wallZ: 7.5 };

  function buildYard(r) {
    const mk = (fn) => K.mesh(r, fn);
    const g = rand(401);
    const out = {};
    out.ground = mk(b => plane(b, -60, -80, 60, 30, 0, 0xffffff, 26));
    out.wall = mk(b => {
      b.quad([-12, 0, YARD.wallZ], [12, 0, YARD.wallZ], [12, 6, YARD.wallZ], [-12, 6, YARD.wallZ], 0xffffff, [[1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
    });
    out.barn = mk(b => {
      b.at(-15, 3, YARD.wallZ + 2, q => texBox(q, 0, 0, 0, 7, 6, 6, 0xffffff, 0.45));
      b.at(15, 3, YARD.wallZ + 1, q => texBox(q, 0, 0, 0, 7, 6, 6, 0xffffff, 0.45));
      b.at(-5.2, 1.6, YARD.wallZ - 0.02, q => q.box(2.4, 3.2, 0.04, 0x1d1714));
      b.at(-5.2, 3.3, YARD.wallZ - 0.06, q => q.box(2.8, 0.18, 0.12, 0x3a2c24));
      [-1, 1].forEach(s => b.at(-5.2 + s * 1.3, 1.6, YARD.wallZ - 0.06, q => q.box(0.18, 3.3, 0.12, 0x3a2c24)));
      b.at(4.5, 2.6, YARD.wallZ - 0.02, q => q.box(1.2, 0.9, 0.04, 0x1d1714));
      b.at(0, 6.2, YARD.wallZ + 2.5, q => q.box(24.6, 0.4, 5.6, 0x4a3a32));
      b.at(-15, 6.6, YARD.wallZ + 2, q => q.box(7.4, 0.5, 6.4, 0x5e463a));
      b.at(15, 6.6, YARD.wallZ + 1, q => q.box(7.4, 0.5, 6.4, 0x5e463a));
    });
    out.posts = mk(b => {
      fence(b, [-9, 0, 4.2], [9, 0, 4.2], 1.25, 0x4e4038, [0.55, 0.9]);
      fence(b, [-14, 0, -2.5], [-3.1, 0, -0.2], 1.2, 0x6a5a48);
      fence(b, [3.1, 0, -0.2], [14, 0, -2.5], 1.2, 0x6a5a48);
    });
    out.gate = mk(b => {
      const t = YARD.gateTop;
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 1.48, 0, 0));
        texBox(b, 0, 0.66, 0, 2.86, 0.22, 0.09, 0xffffff, 0.8);
        texBox(b, 0, t - 0.1, 0, 2.86, 0.2, 0.09, 0xffffff, 0.8);
        texBox(b, 0, 0.18, 0, 2.86, 0.2, 0.09, 0xffffff, 0.8);
        [-1.32, 1.32].forEach(x => texBox(b, x, t / 2, 0.01, 0.2, t, 0.1, 0xffffff, 0.8));
        b.push(M4.translate(0, 0.66, 0.06), M4.rotZ(s * 0.41));
        texBox(b, 0, 0, 0, 2.9, 0.16, 0.05, 0xffffff, 0.8);
        b.pop();
        b.push(M4.translate(0, 0.66, 0.06), M4.rotZ(-s * 0.41));
        texBox(b, 0, 0, 0, 2.9, 0.16, 0.05, 0xffffff, 0.8);
        b.pop();
        b.pop();
      });
      [-3.05, 3.05].forEach(x => texBox(b, x, 0.85, 0, 0.26, 1.7, 0.26, 0xffffff, 0.8));
    });
    out.gateBits = mk(b => {
      for (let i = 0; i < 6; i++) b.at(0.05, 0.62 - i * 0.07, 0.1, q => { q.push(M4.rotY(i % 2 ? PI / 2 : 0)); q.box(0.05, 0.075, 0.016, 0x2a2622); q.pop(); });
      b.at(-0.02, 0.88, 0.08, q => q.ellipsoid(0.025, 0.025, 0.025, 8, 5, 0xd0ccc4));
      b.at(1.2, 1.0, 0.07, q => q.box(0.03, 0.18, 0.03, 0x3a3634));
    });
    out.blood = mk(b => {
      const t = YARD.gateTop;
      [[0, 1]].forEach(([, sgn]) => {
        b.quad([-2.95, t - 0.4, sgn * 0.052], [2.95, t - 0.4, sgn * 0.052], [2.95, t + 0.002, sgn * 0.052], [-2.95, t + 0.002, sgn * 0.052], 0xffffff, sgn > 0 ? [[0, 0], [5, 0], [5, 1], [0, 1]] : [[5, 0], [0, 0], [0, 1], [5, 1]], [[0, 0, sgn], [0, 0, sgn], [0, 0, sgn], [0, 0, sgn]]);
      });
    });
    out.field = mk(b => {
      for (let i = 0; i < 6; i++) {
        const z = -14 - i * 7;
        b.quad([-60, 0, z], [60, 0, z], [60, 1.9 + i * 0.1, z], [-60, 1.9 + i * 0.1, z], 0xffffff, [[0, 0], [12, 0], [12, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }
    });
    out.windmill = mk(b => {
      b.push(M4.translate(-9, 0, -34));
      [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach(([x, z]) => {
        const top = [x * 0.2, 9, z * 0.2];
        K.tube(b, [[x, 0, z], top], [0.07, 0.05], 4, 0x6a625a);
      });
      for (let i = 1; i < 5; i++) b.at(0, i * 1.9, 0, q => q.box(1.9 - i * 0.34, 0.06, 1.9 - i * 0.34, 0x6a625a));
      b.at(0, 9.3, 0.3, q => {
        for (let k = 0; k < 14; k++) {
          q.push(M4.rotZ((k / 14) * PI * 2));
          q.at(0, 0.85, 0, h => h.box(0.12, 1.5, 0.02, 0x8a847a));
          q.pop();
        }
      });
      b.at(0, 9.3, -0.6, q => q.box(0.08, 0.7, 1.4, 0x8a847a));
      b.pop();
      pole(b, 9, -30, 8);
      pole(b, 22, -26, 8);
      for (let i = 0; i < 6; i++) cypress(b, -40 + i * 15 + g() * 4, -60 - g() * 10, 7 + g() * 3, g);
    });
    out.tufts = mk(b => {
      tufts(b, g, 260, [-20, -12, 20, -1.5], 0.5);
      tufts(b, g, 120, [-12, 1.5, 12, 6.5], 0.25);
    });
    out.sky = mk(b => skyDome(b, 200));
    return out;
  }

  function buildLineup(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      wall: mk(b => b.quad([-6, 0, -1.6], [6, 0, -1.6], [6, 5, -1.6], [-6, 5, -1.6], 0xa29d95, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      floor: mk(b => plane(b, -6, -2, 6, 4, 0, 0x45423f, 1)),
      bits: mk(b => {
        b.at(3.1, 2.85, -1.5, q => q.ellipsoid(0.22, 0.22, 0.11, 14, 8, 0xb02a22));
        b.at(3.1, 2.85, -1.43, q => q.ellipsoid(0.1, 0.1, 0.06, 10, 6, 0xd8a03a));
        b.at(3.25, 0.95, -1.56, q => q.box(0.42, 0.24, 0.06, 0xd6d2c8));
        [3.15, 3.35].forEach(x => b.at(x, 0.95, -1.52, q => q.ellipsoid(0.06, 0.06, 0.02, 8, 4, 0x2a2a2a)));
        b.at(-3.2, 1.55, -1.54, q => q.box(0.36, 0.4, 0.08, 0xd6d2c8));
        b.at(-3.2, 1.55, -1.49, q => q.ellipsoid(0.12, 0.12, 0.02, 10, 4, 0x9a968e));
        b.at(0, 0.03, -1.55, q => q.box(12, 0.06, 0.08, 0x2e2c2a));
      })
    };
  }

  function build(r) {
    return { farm: buildFarm(r), yard: buildYard(r), lineup: buildLineup(r), tex: {} };
  }

  const WALL_MAT = { spec: [0.03, 4], rim: 0.15 };
  const GRASS_MAT = { spec: [0, 1], rim: 0.1 };

  function drawGate(fx, W) {
    const T = (k) => Art.tex(fx.r, W.tex, k);
    const Y = W.yard;
    fx.draw(Y.gate, null, Object.assign({ texture: T('gate') }, WALL_MAT));
    fx.draw(Y.gateBits, null, { spec: [0.4, 18], rim: 0.3 });
    fx.draw(Y.blood, null, { texture: T('blood'), spec: [0.6, 30], rim: 0.2 });
  }

  function draw(fx, W, name, opts) {
    const o = opts || {};
    const T = (k) => Art.tex(fx.r, W.tex, k);
    if (name === 'farm') {
      const F = W.farm;
      fx.draw(F.sky, null, { texture: T('sky'), noFog: true });
      fx.draw(F.ground, null, Object.assign({ texture: T('dirt') }, WALL_MAT));
      fx.draw(F.hill, null, Object.assign({ texture: T('dirt'), tint: [1.05, 0.95, 0.8] }, WALL_MAT));
      fx.draw(F.corrugated, null, Object.assign({ texture: T('corrugated') }, WALL_MAT));
      fx.draw(F.wood, null, Object.assign({ texture: T('woodPlanks') }, WALL_MAT));
      fx.draw(F.roofs, null, WALL_MAT);
      fx.draw(F.roofs2, null, WALL_MAT);
      fx.draw(F.metal, null, { spec: [0.15, 10], rim: 0.3 });
      fx.draw(F.siloCaps, null, { spec: [0.15, 10], rim: 0.3 });
      fx.draw(F.signs.silo, null, Object.assign({ texture: T('siloLogo') }, WALL_MAT));
      fx.draw(F.crates, null, Object.assign({ texture: T('crate') }, WALL_MAT));
      fx.draw(F.dyn, null, Object.assign({ texture: T('dynamite') }, WALL_MAT));
      fx.draw(F.fences, null, WALL_MAT);
      fx.draw(F.trees, null, { spec: [0.02, 3], rim: 0.35 });
      fx.draw(F.signs.bluBack, null, WALL_MAT);
      fx.draw(F.signs.blu, null, Object.assign({ texture: T('bluSign') }, WALL_MAT));
      fx.draw(F.signs.drill, null, Object.assign({ texture: T('drill') }, WALL_MAT));
      fx.draw(F.signs.drillDoor, null, WALL_MAT);
      fx.draw(F.signs.noSmoking, null, Object.assign({ texture: T('noSmoking') }, WALL_MAT));
      fx.draw(F.signs.three, null, Object.assign({ texture: T('number3') }, WALL_MAT));
      fx.draw(F.tufts, null, Object.assign({ texture: T('tuft') }, GRASS_MAT));
    } else if (name === 'yard') {
      const Y = W.yard;
      fx.draw(Y.sky, null, { texture: T('sky'), noFog: true });
      fx.draw(Y.ground, null, Object.assign({ texture: T('dirt') }, WALL_MAT));
      fx.draw(Y.field, null, Object.assign({ texture: T('corn') }, WALL_MAT));
      fx.draw(Y.windmill, null, { spec: [0.05, 4], rim: 0.3 });
      fx.draw(Y.wall, null, Object.assign({ texture: T('barnWall') }, WALL_MAT));
      fx.draw(Y.barn, null, Object.assign({ texture: T('darkPlanks') }, WALL_MAT));
      fx.draw(Y.posts, null, WALL_MAT);
      fx.draw(Y.tufts, null, Object.assign({ texture: T('tuft') }, GRASS_MAT));
      if (!o.noGate) drawGate(fx, W);
    } else if (name === 'lineup') {
      const L = W.lineup;
      fx.draw(L.wall, null, WALL_MAT);
      fx.draw(L.floor, null, WALL_MAT);
      fx.draw(L.bits, null, { spec: [0.3, 16], rim: 0.4 });
    }
  }

  window.MtsSets = { build, draw, drawGate, FARM, YARD, hillY };
})();
