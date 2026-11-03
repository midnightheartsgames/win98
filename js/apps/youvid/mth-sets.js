(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, clamp } = K;
  const Art = window.MeetArt;

  function plane(b, x0, z0, x1, z1, y, col, rep) {
    const u = rep || 1;
    b.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col, [[0, 0], [u, 0], [u, u], [0, u]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
  }

  function wallZ(b, x0, x1, y0, y1, z, col, ru, rv, facing) {
    const n = [0, 0, facing || 1];
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, [[0, 0], [ru, 0], [ru, rv], [0, rv]], [n, n, n, n]);
  }

  function wallX(b, z0, z1, y0, y1, x, col, ru, rv, facing) {
    const n = [facing || 1, 0, 0];
    b.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], col, [[0, 0], [ru, 0], [ru, rv], [0, rv]], [n, n, n, n]);
  }

  function buildWarehouse(r) {
    const mk = (fn) => K.mesh(r, fn);
    const out = {};
    out.floor = mk(b => plane(b, -7, -7, 7, 7, 0, 0x8a7a72, 7));
    out.walls = mk(b => {
      wallZ(b, -7, 7, 0, 6, -2.6, 0xb8a8b0, 6, 2.6, 1);
      wallX(b, -7, 7, 0, 6, -5, 0xa898a0, 5, 2.4, 1);
      wallX(b, -7, 7, 0, 6, 4.4, 0xa898a0, 5, 2.4, -1);
      wallZ(b, -7, 7, 0, 6, 7, 0xa898a0, 6, 2.6, -1);
    });
    out.frame = mk(b => {
      const dark = 0x2e2629, mid = 0x463a3c;
      [-3.4, -1.0, 1.25, 3.5].forEach(x => {
        b.at(x, 2.9, -2.45, q => q.box(0.34, 5.8, 0.3, dark));
        b.at(x, 2.9, -2.29, q => q.box(0.08, 5.8, 0.04, mid));
      });
      b.at(0, 3.25, -2.42, q => q.box(14, 0.26, 0.3, dark));
      b.at(0, 0.9, -2.5, q => q.box(14, 0.08, 0.16, mid));
      for (let i = 0; i < 9; i++) {
        const x = -6 + i * 1.5;
        b.at(x, 5.2, 0, q => q.box(0.22, 0.32, 14, dark));
      }
      for (let i = 0; i < 6; i++) {
        const z = -6 + i * 2.4;
        b.at(0, 4.85, z, q => q.box(14, 0.18, 0.18, dark));
        b.push(M4.translate(0, 4.4, z), M4.rotZ(0.32)).at(-1.6, 0, 0, q => q.box(4.4, 0.14, 0.14, mid)).pop();
        b.push(M4.translate(0, 4.4, z), M4.rotZ(-0.32)).at(1.6, 0, 0, q => q.box(4.4, 0.14, 0.14, mid)).pop();
      }
      b.at(2.55, 1.0, -2.0, q => q.box(1.2, 2.0, 0.8, 0x3a3236));
      b.at(2.55, 2.06, -2.0, q => q.box(1.24, 0.06, 0.84, 0x2a2427));
      b.at(3.4, 0.45, -1.4, q => q.box(0.7, 0.9, 0.7, 0x5a4636));
      b.at(3.2, 1.2, -1.5, q => q.box(0.55, 0.6, 0.55, 0x63503c));
      b.at(-3.6, 0.5, -1.6, q => q.box(1.0, 1.0, 0.8, 0x4c3e34));
      b.at(-2.9, 0.38, -0.6, q => q.box(0.7, 0.76, 0.7, 0x574536));
    });
    out.ceiling = mk(b => {
      wallZ(b, -7, 7, 0, 1, 0, 0x2a2226, 1, 1, -1);
      b.quad([-7, 5.6, -7], [7, 5.6, -7], [7, 5.6, 7], [-7, 5.6, 7], 0x241e21, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    });
    out.skylights = mk(b => {
      for (let i = 0; i < 4; i++) {
        const x0 = -4.2 + i * 1.5, x1 = x0 + 1.1;
        b.quad([x0, 5.55, -5.5], [x1, 5.55, -5.5], [x1, 5.55, 5.5], [x0, 5.55, 5.5], rgb(0xfff2dc, 1), null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
      }
      b.quad([4.38, 1.1, -1.3], [4.38, 1.1, 0.4], [4.38, 3.7, 0.4], [4.38, 3.7, -1.3], rgb(0xf4ead8, 1), null, [[-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0]]);
      for (let i = 1; i < 4; i++) b.at(4.36, 1.1 + i * 0.65, -0.45, q => q.box(0.03, 0.06, 1.7, 0x2a2427));
      for (let i = 1; i < 3; i++) b.at(4.36, 2.4, -1.3 + i * 0.57, q => q.box(0.03, 2.6, 0.06, 0x2a2427));
    });
    out.mapBoard = mk(b => {
      b.push(M4.translate(-1.95, 1.4, -1.25), M4.rotY(0.32));
      b.box(1.18, 0.92, 0.04, 0x2c2628);
      b.at(-0.5, -0.75, 0.04, q => q.box(0.05, 0.9, 0.05, 0x2c2628));
      b.at(0.5, -0.75, 0.04, q => q.box(0.05, 0.9, 0.05, 0x2c2628));
      b.pop();
    });
    out.mapPaper = mk(b => {
      b.push(M4.translate(-1.95, 1.4, -1.25), M4.rotY(0.32));
      b.quad([-0.55, -0.42, 0.022], [0.55, -0.42, 0.022], [0.55, 0.42, 0.022], [-0.55, 0.42, 0.022], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      b.pop();
    });
    out.fans = mk(b => {
      [[-1.55, 2.2, -2.27], [2.15, 2.3, -2.27], [-4.3, 2.4, -2.27]].forEach(([x, y, z]) => {
        b.quad([x - 0.38, y - 0.38, z], [x + 0.38, y - 0.38, z], [x + 0.38, y + 0.38, z], [x - 0.38, y + 0.38, z], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      });
    });
    out.chains = mk(b => {
      [[2.0, -1.7], [2.25, -1.75], [-3.9, -1.9]].forEach(([x, z], ci) => {
        for (let i = 0; i < 30; i++) {
          const y = 5.4 - i * 0.12;
          b.push(M4.translate(x, y, z), M4.rotY(i % 2 ? PI / 2 : 0));
          b.box(0.05, 0.11, 0.015, 0x231e20);
          b.pop();
        }
      });
    });
    out.shaft = mk(b => {
      b.quad([-0.5, 0, 0], [0.5, 0, 0], [0.5, 1, 0], [-0.5, 1, 0], rgb(0xffffff, 1), [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    });
    return out;
  }

  function shedBox(b, x, z, w, d, h, yaw, col, roofCol, opts) {
    const o = opts || {};
    b.push(M4.translate(x, 0, z), M4.rotY(yaw || 0));
    b.at(0, h / 2, 0, q => q.box(w, h, d, col));
    const rh = o.roof === undefined ? 0.9 : o.roof;
    const ridge = [0, h + rh, 0];
    const p = (sx, sz) => [sx * (w / 2 + 0.15), h, sz * (d / 2 + 0.15)];
    b.quad(p(-1, 1), p(1, 1), [w / 2 + 0.15, ridge[1], 0], [-w / 2 - 0.15, ridge[1], 0], roofCol);
    b.quad(p(1, -1), p(-1, -1), [-w / 2 - 0.15, ridge[1], 0], [w / 2 + 0.15, ridge[1], 0], roofCol);
    b.tri([-w / 2, h, d / 2], [-w / 2, h, -d / 2], [-w / 2, h + rh, 0], col);
    b.tri([w / 2, h, -d / 2], [w / 2, h, d / 2], [w / 2, h + rh, 0], col);
    const win = o.windows || 0;
    for (let i = 0; i < win; i++) {
      const wx = -w / 2 + (i + 0.5) * (w / win);
      b.at(wx, h * 0.62, d / 2 + 0.01, q => q.box(0.42, 0.55, 0.02, 0x2a1d18));
      b.at(wx, h * 0.62, d / 2 + 0.02, q => q.box(0.5, 0.04, 0.02, 0xb9a48e));
    }
    if (o.door) b.at(o.door, 0.9, d / 2 + 0.01, q => q.box(0.9, 1.8, 0.02, 0x1d1512));
    b.pop();
  }

  function rockPillar(b, x, z, h, rad, g) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const y0 = (i / n) * h, y1 = ((i + 1) / n) * h;
      const r0 = rad * (1 - 0.18 * (i / n)) * (0.9 + g() * 0.2), r1 = rad * (1 - 0.18 * ((i + 1) / n)) * (0.9 + g() * 0.2);
      b.push(M4.translate(x + (g() - 0.5) * 0.3, 0, z + (g() - 0.5) * 0.3));
      b.prism(9, r0, r0 * 0.9, y0, r1, r1 * 0.9, y1, i % 2 ? 0xc49a72 : 0xb88e68, { capTop: i === n - 1 });
      b.pop();
    }
    b.at(x, h, z, q => q.ellipsoid(rad * 0.85, rad * 0.5, rad * 0.78, 9, 5, 0xcaa47c));
  }

  function deadTree(b, x, z, h, g) {
    const col = 0x3a2a22;
    const branch = (p, dir, len, rad, depth) => {
      const q = V3.add(p, V3.mul(dir, len));
      K.tube(b, [p, q], [rad, rad * 0.7], 5, col);
      if (depth <= 0) return;
      for (let i = 0; i < 3; i++) {
        const a = g() * PI * 2;
        const nd = V3.norm(V3.add(dir, [C(a) * 0.9, 0.35 + g() * 0.3, S(a) * 0.9]));
        branch(q, nd, len * (0.55 + g() * 0.2), rad * 0.6, depth - 1);
      }
    };
    branch([x, 0, z], [0, 1, 0], h * 0.45, 0.09, 3);
  }

  function buildBattle(r) {
    const mk = (fn) => K.mesh(r, fn);
    const g = rand(77);
    const out = {};
    out.ground = mk(b => {
      plane(b, -80, -80, 80, 80, 0, 0xffffff, 26);
    });
    out.trench = mk(b => {
      b.at(0, -0.6, 13, q => q.box(36, 1.2, 4.5, 0x8f7356));
    });
    out.rocks = mk(b => {
      for (let i = 0; i < 26; i++) {
        const a = -1.2 + (i / 25) * 2.6;
        const R = 46 + g() * 8;
        rockPillar(b, S(a) * R, C(a) * R, 7 + g() * 7, 2.2 + g() * 1.6, g);
      }
      for (let i = 0; i < 16; i++) {
        const a = PI - 1.0 + (i / 15) * 2.0;
        const R = 34 + g() * 6;
        rockPillar(b, S(a) * R, C(a) * R, 8 + g() * 6, 2.4 + g() * 1.4, g);
      }
      for (let i = 0; i < 10; i++) {
        rockPillar(b, -30 + g() * 6, -6 + i * 4.5, 6 + g() * 5, 2 + g(), g);
        rockPillar(b, 30 + g() * 6, -6 + i * 4.5, 6 + g() * 5, 2 + g(), g);
      }
    });
    out.wood = mk(b => {
      shedBox(b, -15, 24, 8, 6, 9, 0.35, 0xffffff, 0x9a5236, { windows: 3, roof: 1.6 });
      b.push(M4.translate(-15, 0, 24), M4.rotY(0.35));
      for (let i = 0; i < 6; i++) b.at(-3.5 + i * 1.4, 1.6, 3.2, q => q.box(0.3, 3.2, 0.3, 0x5a4234));
      b.at(0, 3.3, 3.4, q => q.box(8.6, 0.25, 1.0, 0x6a4c3c));
      b.at(4.6, 7.5, 1.5, q => q.box(0.22, 6, 0.22, 0x4d3a2e));
      b.at(5.4, 11.5, 0.5, q => q.box(0.25, 3, 0.25, 0x4d3a2e));
      b.pop();
      shedBox(b, -5, 26, 6, 5, 6, 0.1, 0xffffff, 0x8a4a32, { windows: 2 });
      shedBox(b, 7, 17, 5, 4, 3.2, -0.25, 0xffffff, 0x7a4430, { windows: 1, door: -1.2 });
      shedBox(b, 15, 26, 6, 6, 5, -0.4, 0xffffff, 0x8a4a32, { windows: 2 });
      shedBox(b, -4.2, -5, 6, 5, 5.2, 0.15, 0xffffff, 0x8a4a32, { windows: 2 });
      shedBox(b, 4.5, -6.5, 5, 4.5, 4, -0.2, 0xffffff, 0x7a4430, { windows: 1 });
      shedBox(b, -24, 8, 6, 6, 7, 1.2, 0xffffff, 0x9a5236, { windows: 2 });
      b.push(M4.translate(20, 0, 32));
      [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(([x, z]) => b.at(x, 6, z, q => q.box(0.3, 12, 0.3, 0x5a4234)));
      b.at(0, 12.6, 0, q => q.box(4.2, 1.6, 4.2, 0xffffff));
      b.at(0, 13.8, 0, q => q.prism(4, 3.2, 3.2, 0, 0.2, 0.2, 1.4, 0x8a4a32, { phase: PI / 4 }));
      for (let i = 0; i < 5; i++) b.at(0, 1.5 + i * 2.2, 1.55, q => q.box(3.2, 0.12, 0.12, 0x5a4234));
      b.pop();
    });
    out.platform = mk(b => {
      b.at(0, 2.85, -0.6, q => q.box(3.6, 0.3, 3.2, 0x6a4c3c));
      [[-1.6, 0.8], [1.6, 0.8], [-1.6, -2.0], [1.6, -2.0]].forEach(([x, z]) => b.at(x, 1.4, z, q => q.box(0.28, 2.8, 0.28, 0x4d3a2e)));
      for (let i = 0; i < 4; i++) b.at(-1.6 + i * 1.05, 2.0, 1.0, q => q.box(0.08, 1.6, 0.06, 0x5a4234));
      b.at(0, 1.2, -0.6, q => q.box(3.4, 0.12, 0.12, 0x4d3a2e));
      b.push(M4.translate(0, 3.0, 0.95));
      b.box(3.6, 0.1, 0.12, 0x5a4234);
      b.pop();
      b.at(-3.6, 1.6, -1.2, q => q.box(2.6, 3.2, 3.0, 0xb0886a));
      b.at(3.4, 1.4, -1.6, q => q.box(2.4, 2.8, 3.0, 0xa98262));
    });
    out.poles = mk(b => {
      const poles = [[-8, 6], [2, 4.5], [11, 3], [22, 2]];
      poles.forEach(([x, z]) => {
        b.at(x, 5, z, q => q.box(0.22, 10, 0.22, 0x4a3a30));
        b.at(x, 9.4, z, q => q.box(1.6, 0.14, 0.14, 0x4a3a30));
      });
      for (let i = 0; i < poles.length - 1; i++) {
        [-0.6, 0.6].forEach(dx => {
          const a = [poles[i][0] + dx, 9.5, poles[i][1]], c = [poles[i + 1][0] + dx, 9.5, poles[i + 1][1]];
          const pts = [];
          for (let k = 0; k <= 8; k++) {
            const f = k / 8;
            const p = V3.lerp(a, c, f);
            p[1] -= S(f * PI) * 0.8;
            pts.push(p);
          }
          K.tube(b, pts, pts.map(() => 0.025), 4, 0x1e2226);
        });
      }
    });
    out.trees = mk(b => {
      [[-9, 32, 9], [12, 36, 8], [-26, 20, 7], [26, 14, 8], [-6, -14, 7], [8, -16, 8], [30, 30, 9]].forEach(([x, z, h]) => deadTree(b, x, z, h, g));
    });
    out.sky = mk(b => {
      const n = 24, rows = 6, R = 140;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < n; i++) {
          const pt = (ii, jj) => {
            const a = (ii / n) * PI * 2, e = (jj / rows) * PI / 2 - 0.15;
            return [S(a) * C(e) * R, S(e) * R, C(a) * C(e) * R];
          };
          const col = (jj) => {
            const k = jj / rows;
            return rgb([lerp(0.66, 0.38, k), lerp(0.9, 0.72, k), lerp(0.98, 0.95, k)], 1);
          };
          b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), [col(j), col(j), col(j + 1), col(j + 1)]);
        }
      }
    });
    out.signQuad = mk(b => {
      b.push(M4.translate(-15, 0, 24), M4.rotY(0.35));
      b.quad([-3.2, 6.2, 3.02], [0.8, 6.2, 3.02], [0.8, 7.2, 3.02], [-3.2, 7.2, 3.02], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      b.pop();
    });
    return out;
  }

  function buildLineup(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      wall: mk(b => wallZ(b, -6, 6, 0, 5, -1.6, 0xffffff, 1, 1, 1)),
      floor: mk(b => plane(b, -6, -2, 6, 4, 0, 0x45423f, 1)),
      bits: mk(b => {
        b.at(2.95, 2.75, -1.5, q => q.ellipsoid(0.24, 0.24, 0.12, 14, 8, 0xb02a22));
        b.at(2.95, 2.75, -1.42, q => q.ellipsoid(0.11, 0.11, 0.07, 10, 6, 0xd8a03a));
        b.at(3.2, 0.95, -1.56, q => q.box(0.42, 0.24, 0.06, 0xd6d2c8));
        [3.1, 3.3].forEach(x => b.at(x, 0.95, -1.52, q => q.ellipsoid(0.06, 0.06, 0.02, 8, 4, 0x2a2a2a)));
        b.at(-3.05, 1.55, -1.54, q => q.box(0.36, 0.4, 0.08, 0xd6d2c8));
        b.at(-3.05, 1.55, -1.49, q => q.ellipsoid(0.12, 0.12, 0.02, 10, 4, 0x9a968e));
        b.at(0, 0.03, -1.55, q => q.box(12, 0.06, 0.08, 0x2e2c2a));
      })
    };
  }

  function build(r) {
    return { warehouse: buildWarehouse(r), battle: buildBattle(r), lineup: buildLineup(r), tex: {} };
  }

  const WALL_MAT = { spec: [0.03, 4], rim: 0.15 };

  function draw(fx, W, name, opts) {
    const o = opts || {};
    const T = (k) => Art.tex(fx.r, W.tex, k);
    if (name === 'warehouse') {
      const S0 = W.warehouse;
      fx.draw(S0.floor, null, Object.assign({ texture: T('planks') }, WALL_MAT));
      fx.draw(S0.walls, null, Object.assign({ texture: T('wall') }, WALL_MAT));
      fx.draw(S0.frame, null, WALL_MAT);
      fx.draw(S0.ceiling, null, WALL_MAT);
      fx.draw(S0.skylights, null, { noFog: true });
      fx.draw(S0.mapBoard, null, WALL_MAT);
      fx.draw(S0.mapPaper, null, Object.assign({ texture: T('map') }, WALL_MAT));
      fx.draw(S0.fans, null, Object.assign({ texture: T('fan') }, WALL_MAT));
      fx.draw(S0.chains, null, WALL_MAT);
    } else if (name === 'battle') {
      const B = W.battle;
      fx.draw(B.sky, null, { noFog: true });
      fx.draw(B.ground, null, Object.assign({ texture: T('sand') }, WALL_MAT));
      fx.draw(B.trench, null, WALL_MAT);
      fx.draw(B.rocks, null, Object.assign({ texture: T('rock') }, WALL_MAT));
      fx.draw(B.wood, null, Object.assign({ texture: T('wood') }, WALL_MAT));
      fx.draw(B.platform, null, Object.assign({ texture: T('wood') }, WALL_MAT));
      fx.draw(B.poles, null, WALL_MAT);
      fx.draw(B.trees, null, WALL_MAT);
      fx.draw(B.signQuad, null, Object.assign({ texture: T('sign') }, WALL_MAT));
    } else if (name === 'lineup') {
      const L = W.lineup;
      fx.draw(L.wall, null, Object.assign({ texture: T('lineupWall') }, WALL_MAT));
      fx.draw(L.floor, null, WALL_MAT);
      fx.draw(L.bits, null, { spec: [0.3, 16], rim: 0.4 });
    }
    if (o.shafts) {
      o.shafts.forEach(s => {
        const M = M4.chain(M4.translate(s.p[0], s.p[1], s.p[2]), M4.rotY(s.yaw || 0), M4.rotZ(s.roll || 0), M4.scale(s.w, -s.h, 1));
        fx.draw(W.warehouse.shaft, M, { texture: T('shaft'), additive: true, alpha: s.a || 0.12, noFog: true, tint: s.tint || [1, 0.92, 0.8] });
      });
    }
  }

  window.MeetSets = { build, draw };
})();
