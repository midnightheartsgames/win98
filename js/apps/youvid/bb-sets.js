(function () {
  const { M4, V3, rgb, shade } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const Art = window.BreakArt;

  const FLAT_N = [0, 0, 1];

  function cardMesh(r, lit) {
    const c = lit ? [1, 1, 1, 0] : [1, 1, 1, 1];
    return mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], c, [[0, 0], [1, 0], [1, 1], [0, 1]], [FLAT_N, FLAT_N, FLAT_N, FLAT_N]));
  }

  function cyl(b, x, y, z, r0, r1, h, col, sides, cap) {
    b.at(x, y, z, q => q.prism(sides || 16, r0, r0, 0, r1, r1, h, col, { capBottom: cap !== false, capTop: cap !== false }));
  }

  function hcyl(b, x, y, z, r0, len, col, sides, axis) {
    b.push(M4.translate(x, y, z), axis === 'z' ? M4.rotX(PI / 2) : M4.rotZ(-PI / 2));
    b.prism(sides || 12, r0, r0, -len / 2, r0, r0, len / 2, col, { capBottom: true, capTop: true });
    b.pop();
  }

  function box(b, x, y, z, sx, sy, sz, col) {
    b.at(x, y, z, q => q.box(sx, sy, sz, col));
  }

  function wheel(b, x, y, z, rad, wid, side) {
    b.push(M4.translate(x, y, z), M4.rotZ(PI / 2));
    b.prism(16, rad, rad, -wid / 2, rad, rad, wid / 2, 0x141414, { capBottom: true, capTop: true });
    b.prism(12, rad * 0.55, rad * 0.55, side * wid / 2 - 0.004, rad * 0.55, rad * 0.55, side * wid / 2 + 0.004 * side, 0x8a8a8c, { capBottom: true, capTop: true });
    b.pop();
  }

  function suv(b, col, glass) {
    box(b, 0, 0.78, 0, 1.9, 0.75, 4.6, col);
    box(b, 0, 1.35, -0.25, 1.78, 0.55, 3.2, glass);
    [-0.92, 0.92].forEach(x => box(b, x, 1.35, -0.25, 0.04, 0.42, 3.1, col));
    box(b, 0, 1.64, -0.25, 1.8, 0.06, 3.3, col);
    [[-1.4, 1], [1.45, 1]].forEach(([z]) => [-0.86, 0.86].forEach(x => wheel(b, x, 0.4, z, 0.4, 0.28, Math.sign(x))));
    box(b, -0.8, 1.0, -2.31, 0.18, 0.28, 0.04, 0xa81a14);
    box(b, 0.8, 1.0, -2.31, 0.18, 0.28, 0.04, 0xa81a14);
    box(b, 0, 0.5, -2.32, 1.9, 0.18, 0.06, 0x1a1a1c);
  }

  function sedan(b, col, glass) {
    box(b, 0, 0.62, 0, 1.8, 0.5, 4.5, col);
    b.at(0, 0.87, -0.1, q => q.prism(4, 1.15, 1.6, 0, 0.82, 0.9, 0.45, glass, { phase: PI / 4, capTop: true }));
    box(b, 0, 1.33, -0.1, 1.2, 0.04, 1.3, col);
    [[-1.4], [1.4]].forEach(([z]) => [-0.84, 0.84].forEach(x => wheel(b, x, 0.33, z, 0.33, 0.24, Math.sign(x))));
    [-0.6, 0.6].forEach(x => box(b, x, 0.72, 2.26, 0.35, 0.1, 0.03, 0xe8e8e0));
  }

  function chair(b, col, back) {
    box(b, 0, 0.45, 0, 0.5, 0.06, 0.5, col);
    [-0.22, 0.22].forEach(x => [-0.22, 0.22].forEach(z => box(b, x, 0.22, z, 0.04, 0.45, 0.04, shade(col, 0.8))));
    if (back) {
      box(b, 0, 0.82, -0.23, 0.5, 0.7, 0.05, col);
      for (let i = 0; i < 5; i++) box(b, -0.18 + i * 0.09, 0.82, -0.2, 0.04, 0.6, 0.02, shade(col, 1.15));
    }
  }

  function revolver(b) {
    const m = 0x1a1a1c, wd = 0x4a2a1a;
    box(b, 0, 0, 0.09, 0.022, 0.024, 0.16, m);
    hcyl(b, 0, 0.004, 0.12, 0.009, 0.14, 0x101012, 10, 'z');
    hcyl(b, 0, -0.004, 0.0, 0.022, 0.05, m, 10, 'z');
    box(b, 0, -0.01, -0.035, 0.024, 0.03, 0.05, m);
    b.push(M4.translate(0, -0.06, -0.06), M4.rotX(0.35));
    box(b, 0, 0, 0, 0.026, 0.1, 0.035, wd);
    b.pop();
    box(b, 0, -0.035, 0.0, 0.006, 0.03, 0.03, m);
  }

  function camcorder(b) {
    box(b, 0, 0.06, 0, 0.12, 0.1, 0.26, 0x1a1a1c);
    hcyl(b, 0, 0.07, 0.17, 0.04, 0.1, 0x2a2a2e, 14, 'z');
    hcyl(b, 0, 0.07, 0.22, 0.045, 0.02, 0x101012, 14, 'z');
    box(b, 0.06, 0.1, -0.03, 0.02, 0.05, 0.08, 0x2a2a2e);
    box(b, 0, 0.13, -0.04, 0.05, 0.05, 0.1, 0x101012);
  }

  function bottle(b) {
    const glass = [0.75, 0.82, 0.78, 0];
    b.at(0, 0, 0, q => q.prism(14, 0.04, 0.04, 0, 0.045, 0.045, 0.2, glass, { capBottom: true }));
    b.at(0, 0.2, 0, q => q.prism(14, 0.045, 0.045, 0, 0.015, 0.015, 0.06, glass));
    b.at(0, 0.26, 0, q => q.prism(10, 0.016, 0.016, 0, 0.016, 0.016, 0.04, 0x3a2a1a));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * PI * 2;
      b.push(M4.translate(0, 0.31, 0), M4.rotY(a), M4.rotX(0.7));
      b.ellipsoid(0.012, 0.04, 0.006, 6, 4, 0xd86a2a);
      b.pop();
    }
    b.at(0, 0.33, 0, q => q.ellipsoid(0.02, 0.02, 0.02, 8, 5, 0xe8902a));
  }

  function drum(b, x, z, col) {
    cyl(b, x, 0, z, 0.29, 0.29, 0.88, col, 20);
    [0.02, 0.3, 0.58, 0.86].forEach(y => cyl(b, x, y, z, 0.3, 0.3, 0.025, shade(col, 0.8), 20, false));
  }

  function papasan(b, col) {
    b.at(0, 0.45, 0, q => q.ellipsoid(0.6, 0.28, 0.6, 18, 8, 0x2a2018));
    b.at(0, 0.58, 0, q => q.ellipsoid(0.55, 0.16, 0.55, 18, 6, col));
    cyl(b, 0, 0, 0, 0.32, 0.25, 0.3, 0x2a2018, 16);
  }

  function blindsWindow(b, w, h, slats, col) {
    for (let i = 0; i < slats; i++) {
      const y = -h / 2 + (i + 0.5) * h / slats;
      b.push(M4.translate(0, y, 0), M4.rotX(0.45));
      b.box(w, h / slats * 0.62, 0.004, col);
      b.pop();
    }
  }

  const BUILD = {
    drive(r, A) {
      const ground = mesh(r, b => b.quad([-12, 0, 8], [12, 0, 8], [12, 0, -14], [-12, 0, -14], [1, 1, 1, 0], [[0, 0], [10, 0], [10, 10], [0, 10]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]));
      const car = mesh(r, b => suv(b, 0x2a3446, 0x14181e));
      const wall = A.card(true);
      return (t) => {
        r.draw(ground, null, { texture: A.tex('gravel', 256) });
        r.draw(car, M4.chain(M4.translate(0.9, 0, -1.75), M4.rotY(PI / 2 + 0.12)));
        A.drawCard(wall, A.tex('houseWall', 256), [-2, 1.6, -6], 14, 3.2, 0, 0, 0.9);
        A.drawCard(A.cardAlpha, A.tex('bushes', 256), [-3.2, 0.7, -3.4], 4.4, 1.6, 0.4);
        A.drawCard(A.cardAlpha, A.tex('bushes', 256), [3.4, 0.8, -5.5], 6, 2, 0);
        A.drawCard(A.card(false), A.tex('skyBlue', 64), [0, 6, -9], 30, 8, 0, 0, 1);
      };
    },
    rub(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('wallBrown', 256), cam);
    },
    car(r, A) {
      const body = mesh(r, b => {
        const seat = 0x3a3634, dash = 0x2a2826;
        box(b, -0.38, 0.5, 0.0, 0.52, 0.12, 0.55, seat);
        box(b, 0.38, 0.5, 0.0, 0.52, 0.12, 0.55, seat);
        box(b, -0.38, 0.95, -0.28, 0.5, 0.8, 0.12, seat);
        box(b, 0.38, 0.95, -0.28, 0.5, 0.8, 0.12, seat);
        box(b, -0.38, 1.42, -0.3, 0.26, 0.18, 0.12, seat);
        box(b, 0.38, 1.42, -0.3, 0.26, 0.18, 0.12, seat);
        box(b, 0, 0.85, 0.8, 1.6, 0.3, 0.5, dash);
        box(b, 0, 1.62, 0, 1.6, 0.05, 2.2, 0x6a6660);
        [-0.82, 0.82].forEach(x => box(b, x, 0.7, 0.1, 0.06, 0.55, 1.6, 0x4a4844));
        [-0.82, 0.82].forEach(x => box(b, x, 1.6, -0.6, 0.08, 0.1, 0.12, 0x4a4844));
        box(b, 0.84, 1.25, -0.6, 0.06, 0.75, 0.12, 0x4a4844);
        box(b, -0.84, 1.25, -0.6, 0.06, 0.75, 0.12, 0x4a4844);
      });
      return () => {
        r.draw(body, null);
        A.drawCard(A.card(false), A.tex('suburb', 256), [2.2, 1.3, 0.2], 5, 2.6, -PI / 2, 0, 1);
        A.drawCard(A.card(false), A.tex('suburb', 256), [-2.2, 1.3, 0.2], 5, 2.6, PI / 2, 0, 1);
        A.drawCard(A.card(false), A.tex('suburb', 256), [0, 1.3, -2.4], 5, 2.6, 0, 0, 1);
        A.drawCard(A.card(false), A.tex('suburb', 256), [0, 1.3, 3], 5, 2.6, PI, 0, 1);
      };
    },
    saulOffice(r, A) {
      const room = mesh(r, b => {
        b.quad([-4, 0, 3], [4, 0, 3], [4, 0, -3], [-4, 0, -3], 0x3a2a1e, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
        box(b, 2.4, 0.45, -2.3, 2.4, 0.9, 0.6, 0x3a2c22);
        box(b, 2.4, 0.92, -2.3, 2.5, 0.05, 0.65, 0x6a5a48);
        box(b, 2.9, 1.25, -2.55, 0.5, 0.5, 0.1, 0x1a1a1c);
        box(b, -1.4, 0.38, 1.4, 0.55, 0.06, 0.55, 0x5a4434);
        box(b, -1.4, 0.75, 1.15, 0.55, 0.7, 0.06, 0x6a5040);
        box(b, 1.0, 0.38, 1.7, 0.55, 0.06, 0.55, 0x5a4434);
        box(b, 1.0, 0.75, 1.45, 0.55, 0.7, 0.06, 0x7a6048);
        for (let i = 0; i < 5; i++) box(b, 1.0 - 0.22 + i * 0.11, 0.75, 1.48, 0.05, 0.6, 0.02, 0x8a7058);
        box(b, -2.6, 0.38, -1.0, 1.4, 0.76, 0.7, 0x2a1e16);
        box(b, -2.6, 0.78, -1.0, 1.5, 0.04, 0.8, 0x4a3a2a);
        cyl(b, -1.6, 2.35, -0.6, 0.012, 0.012, 0.6, 0x8a7040, 6);
        cyl(b, -1.6, 2.3, -0.6, 0.25, 0.06, 0.08, 0x8a7040, 12);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * PI * 2;
          b.at(-1.6 + C(a) * 0.3, 2.3, -0.6 + S(a) * 0.3, q => q.ellipsoid(0.045, 0.065, 0.045, 8, 5, [1, 0.92, 0.7, 1]));
        }
      });
      return () => {
        r.draw(room, null);
        A.drawCard(A.card(true), A.tex('officeWall', 256), [0, 1.6, -3], 8, 3.2, 0, 0, 1);
        A.drawCard(A.card(false), A.tex('blindsBright', 128), [1.6, 1.5, -2.95], 1.2, 1.3, 0, 0, 1);
        A.drawCard(A.card(false), A.tex('blindsBright', 128), [3.0, 1.5, -2.95], 0.9, 1.3, 0, 0, 1);
        A.drawCard(A.card(true), A.tex('officeWall', 256), [-4, 1.6, 0], 6, 3.2, PI / 2, 0, 1);
      };
    },
    saulAd(r, A) {
      const cols = mesh(r, b => {
        [-1.15, 1.15].forEach(x => {
          cyl(b, x, 0, -0.9, 0.16, 0.16, 2.8, 0xc8a878, 16);
          box(b, x, 2.82, -0.9, 0.4, 0.08, 0.4, 0xb89868);
        });
        b.at(0, 2.09, -0.95, q => q.prism(24, 0.36, 0.36, 0, 0.36, 0.36, 0.06, 0xb08a50, { capTop: true }));
      });
      return () => {
        A.drawCard(A.card(true), A.tex('parchment', 512), [0.55, 1.62, -1.0], 3.4, 2.4, 0, 0, 0.8);
        r.draw(cols, null);
        A.drawCard(A.card(false), A.tex('roundWin', 64), [0, 2.12, -0.88], 0.62, 0.62, 0, 0, 1);
      };
    },
    lab(r, A) {
      const set = mesh(r, b => {
        cyl(b, -0.9, 0.25, -0.6, 0.62, 0.62, 1.5, 0xb8bcc0, 28);
        b.at(-0.9, 1.75, -0.6, q => q.ellipsoid(0.62, 0.22, 0.62, 24, 6, 0xc8ccd0));
        b.at(-0.9, 0.25, -0.6, q => q.ellipsoid(0.62, 0.2, 0.62, 24, 6, 0xa8acb0));
        [[-0.5, -0.2], [-1.3, -0.2], [-0.9, -1.1]].forEach(([x, z]) => cyl(b, x, 0, z, 0.03, 0.03, 0.3, 0x9a9ea2, 8));
        cyl(b, -0.2, 0.6, -0.6, 0.05, 0.05, 1.5, 0xa0a4a8, 10);
        hcyl(b, -0.55, 1.9, -0.6, 0.045, 0.8, 0xb0b4b8, 10);
        cyl(b, -1.25, 1.9, -0.8, 0.08, 0.08, 0.35, 0xb0b4b8, 10);
        box(b, 0.5, 1.0, -1.6, 1.6, 2.0, 0.5, 0x6a6e78);
        for (let i = 0; i < 4; i++) box(b, 0.0 + i * 0.35, 1.3, -1.34, 0.28, 0.22, 0.02, 0x2a3a5a);
        box(b, 0.5, 0.5, -1.34, 1.4, 0.3, 0.02, 0x4a4e58);
        cyl(b, 1.2, 0, -1.2, 0.04, 0.04, 2.0, 0x8a8e92, 8);
        cyl(b, 0.1, 0, -1.2, 0.04, 0.04, 2.0, 0x8a8e92, 8);
        b.push(M4.translate(1.4, 0, 0.7), M4.rotY(0.6));
        box(b, 0, 0.45, 0, 0.7, 0.9, 1.0, 0xa8acb0);
        box(b, 0, 0.92, 0, 0.75, 0.04, 1.05, 0xc8ccd0);
        b.pop();
        box(b, -1.6, 0.01, 0.6, 0.12, 0.02, 3, 0x2a2a2a);
      });
      return () => {
        r.draw(A.floor, M4.chain(M4.translate(0, 0, 0), M4.scale(8, 1, 8)), { texture: A.tex('labFloor', 256) });
        r.draw(set, null);
        A.drawCard(A.card(true), A.tex('labWall', 256), [0, 2.0, -4], 8, 4, 0, 0, 1);
        A.drawCard(A.card(true), A.tex('labWall', 256), [-4, 2.0, 0], 8, 4, PI / 2, 0, 1);
      };
    },
    house(r, A) {
      const room = mesh(r, b => {
        b.quad([-4, 0, 3], [4, 0, 3], [4, 0, -3], [-4, 0, -3], 0x4a3020, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
        box(b, -1.8, 0.25, -0.6, 1.9, 0.12, 0.8, 0x1a1a1a);
        box(b, -1.8, 0.42, -0.6, 1.9, 0.18, 0.8, 0xb8201a);
        box(b, -1.8, 0.72, -0.95, 1.9, 0.5, 0.15, 0xb8201a);
        b.push(M4.translate(1.4, 0, 0.9));
        papasan(b, 0x2a3048);
        b.pop();
        box(b, 3.2, 1.2, -1.5, 0.6, 2.4, 1.6, 0x7a4a34);
        box(b, 3.0, 0.5, -1.5, 0.3, 0.7, 0.9, 0x1a1210);
        box(b, -3.0, 1.1, -2.0, 0.9, 2.2, 0.06, 0x8a6a48);
      });
      return () => {
        r.draw(room, null);
        A.drawCard(A.card(true), A.tex('houseWall', 256), [0, 1.6, -3], 8, 3.2, 0, 0, 1);
        A.drawCard(A.card(false), A.tex('arch', 128), [0, 1.35, -2.97], 1.5, 2.5, 0, 0, 1);
      };
    },
    rv(r, A) {
      return () => {
        A.drawCard(A.card(false), A.tex('rvWall', 256), [0.3, 1.5, -1.6], 3.4, 2.0, 0, 0, 1);
        A.drawCard(A.card(false), A.tex('beads', 64), [-0.8, 1.5, -0.3], 0.6, 1.8, 0.5, 0, 1);
      };
    },
    warm(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('wallBrown', 128), cam);
    },
    labCeiling(r, A) {
      return () => {
        A.drawCard(A.card(false), A.tex('labWall', 256), [0, 2.2, -2.6], 6, 3.4, 0, 0.35, 1);
      };
    },
    tent(r, A) {
      const set = mesh(r, b => {
        box(b, -0.3, 0.75, 0.6, 1.4, 0.06, 0.7, 0x8a8a8c);
        for (let i = 0; i < 6; i++) b.at(-0.7 + i * 0.16, 0.85, 0.55 + (i % 2) * 0.12, q => q.ellipsoid(0.12, 0.06, 0.1, 8, 4, 0xe0501c));
        cyl(b, 0.25, 0.78, 0.65, 0.1, 0.1, 0.14, 0xe8e8e8, 12);
        cyl(b, 0.6, 0.0, -0.4, 0.3, 0.3, 1.2, 0x9a9ea2, 16);
      });
      return () => {
        r.draw(set, null);
        A.drawCard(A.card(false), A.tex('tentLab', 256), [0, 1.5, -1.6], 4, 2.4, 0, 0, 1);
      };
    },
    dark(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('darkBokeh', 128), cam, o && o.bright !== undefined ? o.bright : 0.35);
    },
    profile(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('profileBg', 128), cam);
    },
    roundRoom(r, A) {
      return () => A.drawCard(A.card(false), A.tex('roundRoom', 256), [0.2, 1.8, -2.2], 4.6, 2.6, 0, 0, 1);
    },
    junk(r, A) {
      const tower = mesh(r, b => {
        for (let i = 0; i < 4; i++) {
          const x = (i % 2) * 0.6, z = Math.floor(i / 2) * 0.6;
          cyl(b, x, 0, z, 0.03, 0.03, 8, 0x6a5a4a, 6);
        }
        for (let y = 0.5; y < 8; y += 0.8) {
          box(b, 0.3, y, 0, 0.6, 0.03, 0.03, 0x6a5a4a);
          box(b, 0.3, y, 0.6, 0.6, 0.03, 0.03, 0x6a5a4a);
        }
        box(b, -0.4, 7.8, 0.3, 2.6, 0.12, 0.12, 0x6a5a4a);
      });
      return () => {
        A.drawCard(A.card(false), A.tex('junkSky', 64), [0, 4, -12], 30, 14, 0, 0, 1);
        r.draw(tower, M4.translate(4.5, 0, -6));
      };
    },
    window(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('windowSoft', 128), cam);
    },
    bedroom(r, A) {
      const frame = mesh(r, b => box(b, -0.95, 1.6, -0.8, 0.12, 2.6, 0.12, 0x5a4a3a));
      return () => {
        A.drawCard(A.card(false), A.tex('wallBeige', 256), [0, 1.6, -1.2], 3.4, 2.4, 0, 0, 1);
        r.draw(frame, null);
      };
    },
    leather(r, A) {
      const seat = mesh(r, b => {
        b.at(0, 0, 0, q => q.ellipsoid(0.5, 0.1, 0.35, 20, 8, 0x5a2a16));
        b.at(0, 0.02, -0.38, q => q.ellipsoid(0.55, 0.3, 0.12, 20, 8, 0x4a2212));
        for (let i = -3; i <= 3; i++) K.tube(b, [[i * 0.12, 0.11, -0.3], [i * 0.12, 0.125, 0.0], [i * 0.12, 0.11, 0.3]], [0.004, 0.004, 0.004], 4, 0x3a1a0c);
      });
      return () => {
        A.drawCard(A.card(false), A.tex('darkBokeh', 64), [0, 0.3, -1.4], 3, 2, 0, 0, 0.25);
        r.draw(seat, null);
      };
    },
    blinds(r, A) {
      const slats = mesh(r, b => blindsWindow(b, 1.6, 1.2, 16, 0xd8d6d0));
      const frame = mesh(r, b => {
        box(b, 0, 0.62, 0.02, 1.7, 0.04, 0.06, 0x4a4a48);
        box(b, 0, -0.62, 0.02, 1.7, 0.04, 0.06, 0x4a4a48);
        box(b, -0.84, 0, 0.02, 0.04, 1.28, 0.06, 0x4a4a48);
        box(b, 0.84, 0, 0.02, 0.04, 1.28, 0.06, 0x4a4a48);
      });
      return () => {
        A.drawCard(A.card(false), A.tex('lot', 256), [0, 0.1, -4.5], 7, 4, 0, 0, 1);
        r.draw(slats, M4.translate(0, 0, 0));
        A.drawCard(A.cardAlpha, A.tex('decal', 512, { height: 256 }), [0, 0.12, 0.04], 1.5, 0.75, 0, 0, 1);
        r.draw(frame, null);
      };
    },
    gunRoom(r, A) {
      const set = mesh(r, b => {
        box(b, 0.9, 1.0, -2.0, 0.9, 2.1, 0.05, 0xd8cdb8);
        box(b, 0.9, 1.0, -1.97, 0.06, 2.1, 0.02, 0x8a7a64);
      });
      return () => {
        A.drawCard(A.card(true), A.tex('wallBeige', 256), [0, 1.4, -2.1], 5, 3, 0, 0, 1);
        r.draw(set, null);
      };
    },
    cards(r, A) {
      const table = mesh(r, b => b.quad([-1, 0, 1], [1, 0, 1], [1, 0, -1], [-1, 0, -1], 0xb89a74, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]));
      const cardsM = mesh(r, b => {
        [[0.05, 0.1, 0.2], [-0.1, 0.05, -0.3], [0.2, -0.1, 0.5], [-0.25, 0.15, 0.1], [0.3, 0.2, -0.2], [0.0, -0.18, 0.9], [-0.35, -0.1, -0.6]].forEach(([x, z, a]) => {
          b.push(M4.translate(x, 0.002, z), M4.rotY(a));
          b.quad([-0.032, 0, 0.045], [0.032, 0, 0.045], [0.032, 0, -0.045], [-0.032, 0, -0.045], [1, 1, 1, 0.2], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
          b.pop();
        });
      });
      return () => {
        r.draw(table, M4.translate(0, 0.75, 0));
        r.draw(cardsM, M4.translate(0, 0.75, 0), { texture: A.tex('cards', 64, { height: 128 }) });
        A.drawCard(A.card(false), A.tex('windowSoft', 128), [0, 1.4, -1.6], 4, 2.4, 0, 0, 1.2);
      };
    },
    hospital(r, A) {
      const bed = mesh(r, b => {
        box(b, 0, 0.55, 0, 1.0, 0.2, 2.0, 0xe8e8ea);
        box(b, 0, 0.9, -0.95, 1.0, 0.7, 0.08, 0xd0d0d2);
        box(b, 0.62, 0.75, 0.3, 0.06, 0.12, 1.2, 0xc8c8cc);
        box(b, -0.1, 0.92, 0.6, 0.9, 0.04, 0.45, 0xc8c2b8);
      });
      return () => {
        A.drawCard(A.card(true), A.tex('hospital', 256), [0, 1.4, -1.1], 4, 2.4, 0, 0, 1);
        r.draw(bed, null);
      };
    },
    desert(r, A) {
      const ground = mesh(r, b => b.quad([-40, 0, 20], [40, 0, 20], [40, 0, -40], [-40, 0, -40], [1, 1, 1, 0], [[0, 0], [20, 0], [20, 20], [0, 20]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]));
      const car = mesh(r, b => sedan(b, 0xe8e8e6, 0x2a3036));
      return () => {
        A.drawCard(A.card(false), A.tex('desert', 512), [0, 3.5, -40], 120, 30, 0, 0, 1);
        r.draw(ground, null, { texture: A.tex('sandTile', 128) });
        r.draw(car, M4.chain(M4.translate(-2.7, 0, -6.6), M4.rotY(1.1)));
      };
    },
    kitchen(r, A) {
      const set = mesh(r, b => {
        box(b, 0, 0.74, 0, 2.0, 0.05, 1.1, 0x3a2418);
        b.push(M4.translate(-0.7, 0, -0.75));
        chair(b, 0xb07a40, true);
        b.pop();
        b.push(M4.translate(0.3, 0, -0.85));
        chair(b, 0xb07a40, true);
        b.pop();
        b.push(M4.translate(0.42, 0.77, -0.02), M4.rotY(-0.5));
        camcorder(b);
        b.pop();
        cyl(b, -0.35, 0.77, 0.25, 0.042, 0.042, 0.11, [1, 1, 1, 0], 14);
        cyl(b, -0.18, 0.77, 0.18, 0.04, 0.04, 0.1, 0x2a2a6a, 14);
      });
      return () => {
        A.drawCard(A.card(true), A.tex('kitchenWall', 256), [0, 1.5, -1.8], 5, 3, 0, 0, 1);
        r.draw(set, null);
        A.drawCard(A.card(true), A.tex('mug', 64, { height: 32 }), [-0.35, 0.83, 0.293], 0.08, 0.07, 0, 0, 1);
      };
    },
    sky(r, A) {
      return (t, o, cam) => A.backdrop(A.tex(o && o.tex || 'skyGrey', 128), cam);
    },
    night(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('nightBlue', 128), cam);
    },
    sand(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('sandWall', 256), cam);
    },
    books(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('bookshelf', 256), cam, 1, 5);
    },
    fence(r, A) {
      const posts = mesh(r, b => {
        for (let i = 0; i < 8; i++) cyl(b, -3 + i * 2.2, 0, -6 - i * 0.6, 0.05, 0.05, 1.3, 0x5a4a3a, 6);
        for (let i = 0; i < 7; i++) K.tube(b, [[-3 + i * 2.2, 1.0, -6 - i * 0.6], [-0.8 + i * 2.2, 1.0, -6.6 - i * 0.6]], [0.006, 0.006], 3, 0x6a6a6a);
      });
      const car = mesh(r, b => sedan(b, 0xd8d8d6, 0x2a3036));
      const ground = mesh(r, b => b.quad([-40, 0, 20], [40, 0, 20], [40, 0, -40], [-40, 0, -40], [1, 1, 1, 0], [[0, 0], [20, 0], [20, 20], [0, 20]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]));
      return () => {
        A.drawCard(A.card(false), A.tex('mountains', 512), [0, 3.5, -40], 120, 30, 0, 0, 1);
        r.draw(ground, null, { texture: A.tex('grassTile', 128) });
        r.draw(posts, null);
        r.draw(car, M4.chain(M4.translate(1.6, 0, -1.6), M4.rotY(-0.4)));
      };
    },
    trees(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('treesRoad', 512), cam);
    },
    brown(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('wallBrown', 256), cam);
    },
    basket(r, A) {
      const set = mesh(r, b => {
        const n = 30;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 1.1 - 0.2, a1 = ((i + 1) / n) * PI * 1.1 - 0.2;
          const p = (a, y) => [C(a) * 0.4, y, -S(a) * 0.3];
          const nrm = [C((a0 + a1) / 2), 0, -S((a0 + a1) / 2)];
          b.quad(p(a0, 0), p(a1, 0), p(a1, 0.35), p(a0, 0.35), [1, 1, 1, 0], [[i / n * 4, 0], [(i + 1) / n * 4, 0], [(i + 1) / n * 4, 1], [i / n * 4, 1]], [nrm, nrm, nrm, nrm]);
        }
        b.push(M4.translate(0.05, 0.12, -0.12), M4.rotZ(0.25), M4.rotX(0.2));
        b.box(0.022, 0.09, 0.012, 0xb81a1a);
        b.at(0, 0.055, 0, q => q.box(0.022, 0.02, 0.012, 0x9a9a9a));
        b.pop();
      });
      return () => {
        A.drawCard(A.card(false), A.tex('nightBlue', 64), [0, 0.2, -1.2], 3, 2, 0, 0, 1);
        r.draw(set, null, { texture: A.tex('basketTile', 128) });
      };
    },
    hall(r, A) {
      const set = mesh(r, b => {
        box(b, -0.9, 1.1, -0.9, 0.9, 2.2, 0.05, 0xe8e6e0);
        for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) box(b, -1.12 + i * 0.22, 1.25 + j * 0.24 - 0.3, -0.87, 0.18, 0.2, 0.01, [0.95, 0.92, 0.85, 0.6]);
      });
      return () => {
        A.drawCard(A.card(true), A.tex('houseWall', 256), [0.6, 1.4, -1.0], 3, 2.8, 0, 0, 1);
        r.draw(set, null);
      };
    },
    bar(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('redBokeh', 256), cam);
    },
    yellow(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('yellowDark', 128), cam);
    },
    blueRoom(r, A) {
      const room = mesh(r, b => {
        b.quad([-4, 0, 3], [4, 0, 3], [4, 0, -3], [-4, 0, -3], 0x2a2420, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
        b.push(M4.translate(0, 0, -1.2));
        papasan(b, 0x2a2a38);
        b.pop();
        box(b, 0, 0.3, -0.2, 1.2, 0.05, 0.6, 0x3a2a20);
        box(b, 0.5, 0.36, -0.2, 0.2, 0.08, 0.15, 0x3a6a3a);
      });
      return () => {
        A.drawCard(A.card(true), A.tex('houseWall', 128), [0, 1.6, -2.6], 6, 3.2, 0, 0, 1);
        r.draw(room, null);
      };
    },
    white(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('whiteRoom', 64), cam);
    },
    terrace(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('garden', 256), cam);
    },
    granite(r, A) {
      return () => A.drawCard(A.card(true), A.tex('digits', 512, { height: 256 }), [0, 0, 0], 1.6, 0.8, 0, -PI / 2, 1);
    },
    mikeCar(r, A) {
      const body = mesh(r, b => {
        const seat = 0x4a1a18, dash = 0x3a1614;
        box(b, -0.4, 0.5, 0.0, 0.55, 0.12, 0.55, seat);
        box(b, 0.4, 0.5, 0.0, 0.55, 0.12, 0.55, seat);
        box(b, -0.4, 0.95, -0.3, 0.52, 0.85, 0.12, seat);
        box(b, -0.4, 1.45, -0.32, 0.28, 0.2, 0.12, seat);
        box(b, 0, 0.9, 0.85, 1.7, 0.3, 0.5, dash);
        box(b, 0, 1.68, 0, 1.7, 0.06, 2.4, 0x5a2420);
        [-0.86, 0.86].forEach(x => box(b, x, 0.7, 0.1, 0.06, 0.6, 1.8, 0x5a1e1a));
        [-0.86, 0.86].forEach(x => box(b, x, 1.3, -0.62, 0.07, 0.8, 0.14, 0x6a2420));
        [-0.84, 0.84].forEach(x => box(b, x, 1.35, 0.95, 0.06, 0.7, 0.08, 0x6a2420));
        box(b, 0, 1.62, 1.02, 1.7, 0.1, 0.08, 0x6a2420);
        b.push(M4.translate(-0.4, 1.0, 0.62), M4.rotX(-0.9));
        b.prism(20, 0.19, 0.19, -0.012, 0.19, 0.19, 0.012, 0x2a1210);
        b.pop();
      });
      const seatR = mesh(r, b => {
        box(b, 0.4, 0.95, -0.3, 0.52, 0.85, 0.12, 0x4a1a18);
        box(b, 0.4, 1.45, -0.32, 0.28, 0.2, 0.12, 0x4a1a18);
      });
      return (t, o) => {
        r.draw(body, null);
        if (!(o && o.noSeat)) r.draw(seatR, null);
        A.drawCard(A.card(false), A.tex('hills', 256), [3.2, 1.3, 0.2], 8, 3.4, -PI / 2, 0, 1);
        A.drawCard(A.card(false), A.tex('hills', 256), [-3.2, 1.3, 0.2], 8, 3.4, PI / 2, 0, 1);
        A.drawCard(A.card(false), A.tex('hills', 256), [0, 1.3, 4.2], 8, 3.4, PI, 0, 1);
        A.drawCard(A.card(false), A.tex('hills', 256), [0, 1.3, -3.6], 8, 3.4, 0, 0, 1);
      };
    },
    gusRoom(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('gusWall', 256), cam);
    },
    readDark(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('warehouseDark', 128), cam);
    },
    ringTable(r, A) {
      const table = mesh(r, b => b.quad([-0.6, 0, 0.4], [0.6, 0, 0.4], [0.6, 0, -0.4], [-0.6, 0, -0.4], 0x8a8a86, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]));
      return () => {
        r.draw(table, null);
        A.drawCard(A.card(true), A.tex('paper', 256, { height: 256 }), [0.05, 0.002, 0.02], 0.24, 0.3, 0.3, -PI / 2, 1);
      };
    },
    shelves(r, A) {
      const set = mesh(r, b => {
        box(b, 0.55, 1.4, 0.4, 0.12, 2.8, 0.12, 0x1a1a1c);
        box(b, 0.4, 1.0, 0.45, 0.06, 2.0, 0.06, 0x2a2a2c);
        box(b, 0.55, 0.5, 0.5, 0.18, 0.3, 0.2, 0xb81a14);
      });
      return () => {
        A.drawCard(A.card(false), A.tex('warehouse', 512), [-0.6, 2.6, -2.8], 4.6, 5.6, 0.5, 0.2, 1);
        A.drawCard(A.card(false), A.tex('warehouse', 512), [2.2, 2.6, -3.4], 4.6, 5.6, -0.6, 0.2, 1);
        r.draw(set, null);
      };
    },
    aztek(r, A) {
      const car = mesh(r, b => {
        const col = 0xc8be9a;
        box(b, 0, 0.75, 0, 1.9, 0.7, 4.4, col);
        box(b, 0, 1.3, -0.4, 1.8, 0.5, 2.8, 0x2a3036);
        box(b, 0, 1.58, -0.4, 1.86, 0.08, 3.0, col);
        [-0.86, 0.86].forEach(x => box(b, x, 1.3, -0.4, 0.06, 0.5, 2.9, col));
        box(b, 0, 0.42, -2.22, 1.9, 0.22, 0.06, 0x5a5a56);
        [-0.7, 0.7].forEach(x => box(b, x, 1.02, -2.23, 0.32, 0.22, 0.04, 0xc81a14));
        [[-1.4], [1.4]].forEach(([z]) => [-0.86, 0.86].forEach(x => wheel(b, x, 0.38, z, 0.38, 0.26, Math.sign(x))));
        b.push(M4.translate(0, 1.3, -2.1), M4.rotX(-1.1));
        b.box(1.7, 0.04, 0.8, col);
        b.pop();
      });
      const ground = mesh(r, b => b.quad([-20, 0, 20], [20, 0, 20], [20, 0, -20], [-20, 0, -20], 0x6a6a64, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]));
      return () => {
        A.drawCard(A.card(false), A.tex('treesSky', 256), [0, 4, -14], 30, 10, 0, 0, 1);
        r.draw(ground, null);
        r.draw(car, M4.rotY(PI));
        A.drawCard(A.card(true), A.tex('plate', 128, { height: 64 }), [0, 0.62, 2.265], 0.3, 0.15, 0, 0, 1);
      };
    },
    drums(r, A) {
      const set = mesh(r, b => {
        drum(b, 0.0, 0.12, 0x8a8e92);
        drum(b, 0.6, 0.1, 0x9a9ea2);
        drum(b, -0.6, 0.15, 0x8a8e92);
        cyl(b, 0.36, 0, 0.45, 0.035, 0.035, 2.6, 0xa0a0a0, 8);
        b.at(0.0, 0.88, 0.12, q => q.ellipsoid(0.29, 0.03, 0.29, 18, 3, 0x9a9ea2));
      });
      return () => {
        A.drawCard(A.card(false), A.tex('warehouseDark', 128), [0, 1.6, -2.4], 5, 3, 0, 0, 1);
        r.draw(set, null);
      };
    },
    greenMachine(r, A) {
      return () => A.drawCard(A.card(true), A.tex('greenMachine', 256), [0, 1.2, -0.8], 2.2, 1.6, 0, 0, 1);
    },
    garlic(r, A) {
      const pan = mesh(r, b => {
        b.at(0, 0, 0, q => q.prism(28, 0.3, 0.3, 0, 0.34, 0.34, 0.06, 0x2a2a2c, { capBottom: true, capTop: false }));
        b.at(0, 0.004, 0, q => q.disc(0.3, 28, 0x8a6a3a, 0.006));
      });
      const clove = mesh(r, b => b.ellipsoid(0.016, 0.012, 0.024, 8, 5, 0xf0e4c0));
      const leaf = mesh(r, b => b.ellipsoid(0.04, 0.004, 0.015, 8, 3, 0x3a6a2a));
      return (t) => {
        r.draw(pan, null);
        for (let i = 0; i < 26; i++) {
          const a = i * 2.4, rr = 0.06 + (i % 7) * 0.035;
          const hop = Math.max(0, S(t * 9 + i * 1.7)) * 0.03 * ((i % 3) === 0 ? 1 : 0.3);
          r.draw(clove, M4.chain(M4.translate(C(a) * rr, 0.02 + hop, S(a) * rr), M4.rotY(a), M4.rotX(hop * 20)));
        }
        for (let i = 0; i < 8; i++) {
          const a = i * 0.8 + 0.3, rr = 0.1 + (i % 4) * 0.05;
          r.draw(leaf, M4.chain(M4.translate(C(a) * rr, 0.018, S(a) * rr), M4.rotY(a * 2)));
        }
      };
    },
    oldMan(r, A) {
      return (t, o, cam) => A.backdrop(A.tex('oldRoom', 128), cam, 1, 3);
    }
  };

  function build(r) {
    const tex = {};
    const cards = { lit: cardMesh(r, true), flat: cardMesh(r, false) };
    const A = {
      tex(name, size, opts) {
        const key = name + ':' + size;
        if (!tex[key]) {
          const o = opts || {};
          const painter = Art.BG[name] || EXTRA[name] || Art[name];
          const hh = o.height || size;
          const pot = (n) => (n & (n - 1)) === 0;
          tex[key] = r.texture(size, painter, { height: hh, clamp: o.clamp || !pot(size) || !pot(hh) });
        }
        return tex[key];
      },
      card(lit) {
        return lit ? cards.lit : cards.flat;
      },
      cardAlpha: cards.lit,
      floor: mesh(r, b => b.quad([-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 0, -0.5], [-0.5, 0, -0.5], [1, 1, 1, 0], [[0, 0], [4, 0], [4, 4], [0, 4]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]])),
      backdrop(t, cam, bright, dist) {
        if (!cam) return;
        const d = dist || 12;
        const fwd = V3.norm(V3.sub(cam.at, cam.eye));
        let right = V3.cross(fwd, [0, 1, 0]);
        right = V3.len(right) < 1e-4 ? [1, 0, 0] : V3.norm(right);
        const up = V3.cross(right, fwd);
        const hh = 2 * d * Math.tan(cam.fov * PI / 360) * 1.35;
        const ww = hh * 16 / 9;
        const c = V3.add(cam.eye, V3.mul(fwd, d));
        const k = bright === undefined ? 1 : bright;
        const m = new Float32Array([right[0] * ww, right[1] * ww, right[2] * ww, 0, up[0] * hh, up[1] * hh, up[2] * hh, 0, -fwd[0], -fwd[1], -fwd[2], 0, c[0], c[1], c[2], 1]);
        r.draw(cards.flat, m, { texture: t, noFog: true, tint: [k, k, k] });
      },
      drawCard(m, t, pos, w, h, ry, rx, bright) {
        const k = bright === undefined ? 1 : bright;
        r.draw(m, M4.chain(M4.translate(pos[0], pos[1], pos[2]), M4.rotY(ry || 0), M4.rotX(rx || 0), M4.scale(w, h, 1)), { texture: t, noFog: true, tint: [k, k, k] });
      }
    };
    const sets = {};
    return {
      A,
      get(key) {
        if (!sets[key]) sets[key] = BUILD[key](r, A);
        return sets[key];
      },
      keys: Object.keys(BUILD)
    };
  }

  const EXTRA = {
    roundWin: (ctx, w, h) => {
      Art.vgrad(ctx, w, h, [[0, '#f8f4e8'], [1, '#e8dcc0']]);
      ctx.strokeStyle = '#8a6a3a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    },
    beads: (ctx, w, h) => {
      ctx.fillStyle = '#2a1a0e';
      ctx.fillRect(0, 0, w, h);
      for (let x = 2; x < w; x += 6) for (let y = 2; y < h; y += 5) {
        ctx.fillStyle = (x + y) % 3 ? 'rgba(200,150,90,0.7)' : 'rgba(120,80,40,0.7)';
        ctx.fillRect(x, y, 3, 3);
      }
    },
    profileBg: (ctx, w, h) => {
      Art.vgrad(ctx, w, h, [[0, '#1e1c18'], [1, '#14120e']]);
      Art.soft(ctx, w * 0.8, h * 0.4, w * 0.3, h * 0.5, 'rgba(120,110,90,A)', 0.4);
    },
    windowSoft: (ctx, w, h) => {
      Art.vgrad(ctx, w, h, [[0, '#d8e4ee'], [0.5, '#eef2f4'], [1, '#c8d0d4']]);
      Art.soft(ctx, w * 0.3, h * 0.5, w * 0.4, h * 0.5, 'rgba(255,255,255,A)', 0.6);
    },
    lot: (ctx, w, h) => {
      const g = window.P3D.rand(107);
      Art.vgrad(ctx, w, h, [[0, '#7aa0d8'], [0.45, '#b8cce0'], [0.5, '#8a8a84'], [1, '#6a6a66']]);
      for (let i = 0; i < 9; i++) {
        const x = g() * w;
        ctx.fillStyle = ['#c81a1a', '#e8e8e8', '#2a2a2e', '#8a9aa8'][i % 4];
        ctx.fillRect(x, h * 0.5, w * 0.12, h * 0.08);
        ctx.fillStyle = 'rgba(40,40,50,0.8)';
        ctx.fillRect(x + w * 0.02, h * 0.46, w * 0.08, h * 0.05);
      }
    },
    sandTile: (ctx, w, h) => {
      const g = window.P3D.rand(109);
      ctx.fillStyle = '#c89a68';
      ctx.fillRect(0, 0, w, h);
      Art.noise(ctx, g, w, h, 3000, 0.25, 2);
    },
    grassTile: (ctx, w, h) => {
      const g = window.P3D.rand(113);
      ctx.fillStyle = '#9a9264';
      ctx.fillRect(0, 0, w, h);
      Art.blobs(ctx, g, 40, 0, 0, w, h, 4, 12, ['rgba(80,90,50,A)', 'rgba(170,150,100,A)'], 0.5);
    },
    mountains: (ctx, w, h) => {
      Art.vgrad(ctx, w, h, [[0, '#c8d0dc'], [0.4, '#d8dadc'], [0.47, '#8a96a8'], [0.52, '#a8a080'], [1, '#9a9264']]);
      ctx.fillStyle = '#6a7690';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      for (let i = 0; i <= 30; i++) ctx.lineTo(i / 30 * w, h * (0.44 - 0.05 * Math.abs(Math.sin(i * 0.5)) - 0.02 * Math.sin(i * 2.1)));
      ctx.lineTo(w, h * 0.5);
      ctx.fill();
    },
    basketTile: (ctx, w, h) => {
      ctx.fillStyle = '#2a5ab8';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#060e24';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse((i + 0.5) * w / 4, h * 0.55, w * 0.07, h * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#3a6ac8';
      ctx.fillRect(0, 0, w, h * 0.1);
    },
    kitchenWall: (ctx, w, h) => {
      Art.vgrad(ctx, w, h, [[0, '#8a7a62'], [1, '#6a5a46']]);
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(w * 0.1, h * 0.15, w * 0.12, h * 0.6);
      ctx.fillStyle = '#c8b898';
      ctx.fillRect(w * 0.6, h * 0.3, w * 0.3, h * 0.3);
      ctx.fillStyle = '#5a3a6a';
      ctx.fillRect(w * 0.72, h * 0.62, w * 0.2, h * 0.06);
    },
    garden: (ctx, w, h) => {
      const g = window.P3D.rand(127);
      Art.vgrad(ctx, w, h, [[0, '#e8d8b8'], [1, '#8a7a4a']]);
      Art.blobs(ctx, g, 70, 0, 0, w, h * 0.9, 12, 40, ['rgba(60,80,30,A)', 'rgba(110,120,50,A)', 'rgba(150,140,80,A)'], 0.6);
    },
    treesSky: (ctx, w, h) => {
      const g = window.P3D.rand(131);
      Art.vgrad(ctx, w, h, [[0, '#4a7ad8'], [0.6, '#8ab0e8'], [1, '#6a8a5a']]);
      Art.blobs(ctx, g, 50, 0, h * 0.55, w, h, 10, 30, ['rgba(40,90,40,A)', 'rgba(70,120,50,A)'], 0.8);
    },
    warehouseDark: (ctx, w, h) => {
      const g = window.P3D.rand(137);
      Art.vgrad(ctx, w, h, [[0, '#0e0e10'], [1, '#1a1a1c']]);
      Art.blobs(ctx, g, 8, 0, 0, w, h * 0.6, 4, 10, ['rgba(255,220,160,A)'], 0.7);
    },
    greenMachine: (ctx, w, h) => {
      Art.vgrad(ctx, w, h, [[0, '#0e2a1a'], [1, '#081a10']]);
      ctx.fillStyle = '#050808';
      ctx.beginPath();
      ctx.ellipse(w * 0.25, h * 0.55, w * 0.22, h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a3a2a';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.fillStyle = '#2a4a6a';
      ctx.fillRect(w * 0.6, h * 0.1, w * 0.3, h * 0.8);
      ctx.fillStyle = '#d8c020';
      ctx.fillRect(w * 0.52, h * 0.3, w * 0.05, h * 0.08);
    }
  };

  window.BreakSets = { build, BUILD, EXTRA, PROPS: { revolver, bottle, camcorder, box, cyl } };
})();
