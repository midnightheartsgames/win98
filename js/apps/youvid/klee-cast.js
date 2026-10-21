(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;
  const F = window.KleeFaces;

  const D = {
    hipX: 0.055, hipY: -0.035, thigh: 0.19, shin: 0.19,
    chestY: 0.095, neckY: 0.135, shX: 0.085, shY: 0.09,
    upper: 0.12, fore: 0.11, headY: 0.11, head: 0.145
  };

  const COL = {
    skin: 0xffd6c2,
    skinShade: 0xf0c4b0,
    hair: 0xfdf0d8,
    hairShade: 0xf2dcc4,
    hairTip: 0xf6d2bc,
    visor: 0x4a2c22,
    visorEdge: 0x2e1a14,
    clover: 0xf4dcae,
    lens: 0xf0b25a,
    feather: 0xe8eef4,
    red: 0xc42822,
    redDark: 0x8e1a12,
    cream: 0xfff1e2,
    brown: 0x6e4028,
    brownDark: 0x3c241a,
    boot: 0x5c3a2a,
    gold: 0xe6b450,
    black: 0x2a1c18,
    gem: 0xff3a24,
    navy: 0x1f2d63,
    navyLight: 0x34499a,
    navyDark: 0x141c40,
    jeanHair: 0xdca95c,
    jeanHairLight: 0xf2cd86,
    jeanHairDark: 0xb88848,
    stelleHair: 0x9c9ca4,
    stelleHairLight: 0xbcbcc4,
    stelleHairDark: 0x74747e,
    stelleSkin: 0xfde2d6,
    coat: 0x222228,
    coatLining: 0xf2b72a,
    cuff: 0x5e5e66,
    shirt: 0xf6f6f8,
    skirt: 0x26262c,
    beltGrey: 0x4a4a52,
    strap: 0x8a3a30,
    bootBlack: 0x1e1a1c,
    navyTrim: 0x6aa8dc,
    suit: 0x2a2238,
    belt: 0x3a2418,
    glove: 0x1c1c24,
    goldDark: 0xb08030,
    white: 0xf6f2ee,
    cyan: 0x40e0e8
  };

  function boxAt(b, pos, size, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.box(size[0], size[1], size[2], col);
    if (rotM) b.pop();
    b.pop();
  }

  function ellAt(b, pos, rx, ry, rz, col, seg, rings, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.ellipsoid(rx, ry, rz, seg || 10, rings || 8, col);
    if (rotM) b.pop();
    b.pop();
  }

  function cap(b, R, sc, y0, y1, p0, p1, col, nu, nv) {
    K.spherePatch(b, R * sc, R * sc * 0.9, R * sc * 0.96, y0, y1, p0, p1, nu || 14, nv || 8, col, [1, 1]);
  }

  function headPt(R, shape, yaw, pit, inf) {
    const cx = S(yaw) * C(pit), cy = S(pit), cz = C(yaw) * C(pit);
    let x = cx * R, y = cy * R * 0.92, z = cz * R * 0.96;
    if (cy < 0) {
      const q = -cy;
      x *= 1 - shape.jaw * q * q;
      z *= z > 0 ? 1 - shape.chinIn * q * q : 1 - 0.3 * q * q;
      y *= 1 + shape.chinDrop * q;
    }
    if (z < 0) z *= shape.back;
    return [x * inf, y * inf, z * inf];
  }

  function headPatch(b, R, shape, inf, y0, y1, p0, p1, nu, nv, col, uvs) {
    const e = 0.002;
    const vert = (yaw, pit) => {
      const p = headPt(R, shape, yaw, pit, inf);
      const dy = V3.sub(headPt(R, shape, yaw + e, pit, inf), headPt(R, shape, yaw - e, pit, inf));
      const dp = V3.sub(headPt(R, shape, yaw, Math.min(pit + e, PI / 2), inf), headPt(R, shape, yaw, Math.max(pit - e, -PI / 2), inf));
      const n = V3.cross(dy, dp);
      return { p, n: V3.len(n) > 1e-9 ? V3.norm(n) : V3.norm(p) };
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const yA = lerp(y0, y1, u0), yB = lerp(y0, y1, u1), pA = lerp(p0, p1, v0), pB = lerp(p0, p1, v1);
        const a = vert(yA, pA), bb = vert(yB, pA), c = vert(yB, pB), d = vert(yA, pB);
        b.quad(a.p, bb.p, c.p, d.p, col, uvs ? [[u0 * uvs[0], v0 * uvs[1]], [u1 * uvs[0], v0 * uvs[1]], [u1 * uvs[0], v1 * uvs[1]], [u0 * uvs[0], v1 * uvs[1]]] : null, [a.n, bb.n, c.n, d.n]);
      }
    }
  }

  function strand(b, R, shape, s) {
    const rows = s.rows || 6;
    const pts = [];
    for (let j = 0; j <= rows; j++) {
      const v = j / rows;
      const pit = lerp(s.top, s.tip, v);
      const yc = s.yaw + (s.curl || 0) * v * v;
      const hw = s.w * Math.pow(1 - v, s.taper || 0.8) + 0.004;
      const inf = s.inf + (s.lift || 0) * v * v;
      pts.push([headPt(R, shape, yc - hw, pit, inf), headPt(R, shape, yc + hw, pit, inf), lerp(0, 1, v)]);
    }
    const ca = rgb(s.col), cb = rgb(s.tipCol || s.col);
    const mixC = (k) => [lerp(ca[0], cb[0], k), lerp(ca[1], cb[1], k), lerp(ca[2], cb[2], k), 1];
    for (let j = 0; j < rows; j++) {
      const [a0, a1, k0] = pts[j], [b0, b1, k1] = pts[j + 1];
      const n0 = V3.norm(V3.add(a0, a1)), n1 = V3.norm(V3.add(b0, b1));
      b.quad(a0, a1, b1, b0, [mixC(k0), mixC(k0), mixC(k1), mixC(k1)], null, [n0, n0, n1, n1]);
    }
  }

  const KLEE_SHAPE = { jaw: 0.34, chinIn: 0.12, chinDrop: 0.1, back: 1.04 };
  const BUST_SHAPE = { jaw: 0.42, chinIn: 0.08, chinDrop: 0.22, back: 1.02 };

  function headBase(R, skin, shape) {
    return b => headPatch(b, R, shape || KLEE_SHAPE, 1, -PI, PI, -PI / 2, PI / 2, 24, 16, skin);
  }

  function facePatch(R, patch, nu, nv, shape) {
    return b => headPatch(b, R, shape || KLEE_SHAPE, 1.006, patch[0], patch[1], patch[2], patch[3], nu, nv, [1, 1, 1, 0.05], [1, 1]);
  }

  function kleeHair(R) {
    const H = KLEE_SHAPE;
    return b => {
      headPatch(b, R, H, 1.05, -PI, PI, 0.55, PI / 2, 22, 5, COL.hair);
      headPatch(b, R, H, 1.05, 0.95, PI * 2 - 0.95, -1.05, 0.6, 16, 9, COL.hair);
      const bangs = [
        [-0.78, 0.2, 0.86, 0.06, -0.16, COL.hairShade],
        [-0.48, 0.2, 0.86, 0.02, -0.1, COL.hair],
        [-0.2, 0.17, 0.86, 0.1, 0.05, COL.hair],
        [0.06, 0.18, 0.86, 0.03, 0.08, COL.hairShade],
        [0.34, 0.2, 0.86, 0.07, 0.12, COL.hair],
        [0.64, 0.2, 0.86, 0.05, 0.16, COL.hairShade]
      ];
      bangs.forEach(([yaw, w, top, tip, curl, col]) => strand(b, R, H, { yaw, w, top, tip, curl, col, tipCol: COL.hairTip, inf: 1.07, lift: 0.025 }));
      [-1, 1].forEach(s => {
        strand(b, R, H, { yaw: s * 1.0, w: 0.2, top: 0.7, tip: -0.95, curl: s * 0.12, col: COL.hair, tipCol: COL.hairTip, inf: 1.07, lift: 0.08, rows: 8 });
        strand(b, R, H, { yaw: s * 1.28, w: 0.22, top: 0.6, tip: -0.75, curl: s * 0.1, col: COL.hairShade, tipCol: COL.hairTip, inf: 1.08, lift: 0.1, rows: 8 });
        const tail = [
          [s * R * 0.82, -R * 0.42, -R * 0.42],
          [s * R * 1.12, -R * 0.66, -R * 0.4],
          [s * R * 1.3, -R * 0.98, -R * 0.3],
          [s * R * 1.32, -R * 1.3, -R * 0.2],
          [s * R * 1.18, -R * 1.52, -R * 0.12]
        ];
        K.tube(b, tail, [R * 0.2, R * 0.3, R * 0.32, R * 0.24, R * 0.04], 9, COL.hair);
        K.tube(b, [[s * R * 0.78, -R * 0.36, -R * 0.44], [s * R * 0.9, -R * 0.42, -R * 0.42]], [R * 0.13, R * 0.15], 8, COL.red);
      });
      const crescent = [];
      for (let i = 0; i <= 8; i++) {
        const a = lerp(0.5, 5.2, i / 8);
        crescent.push([-R * 1.0 + C(a) * R * 0.32, R * 1.22 + S(a) * R * 0.32, R * 0.15]);
      }
      K.tube(b, crescent, crescent.map((p, i) => R * (0.012 + 0.06 * S((i / 8) * PI))), 5, COL.hair);
    };
  }

  function kleeHat(R) {
    return b => {
      b.push(M4.translate(R * 0.04, R * 0.62, -R * 0.1), M4.rotZ(0.16), M4.rotX(-0.2));
      loft(b, [
        ring(-R * 0.141, R * 0.9, R * 0.86, 0, COL.redDark),
        ring(-R * 0.14, R * 1.16, R * 1.1, 0, COL.gold),
        ring(-R * 0.1, R * 1.2, R * 1.14, 0, COL.red),
        ring(R * 0.1, R * 1.34, R * 1.26, 0, COL.red),
        ring(R * 0.36, R * 1.3, R * 1.22, 0, COL.red),
        ring(R * 0.6, R * 1.1, R * 1.04, 0, COL.red),
        ring(R * 0.8, R * 0.74, R * 0.7, 0, COL.red),
        ring(R * 0.9, R * 0.32, R * 0.3, 0, COL.red),
        ring(R * 0.93, R * 0.05, R * 0.05, 0, COL.red)
      ], 22, { capBottom: true, capTop: true });
      const arc = 12;
      for (let i = 0; i < arc; i++) {
        const a0 = lerp(-0.85, 0.85, i / arc), a1 = lerp(-0.85, 0.85, (i + 1) / arc);
        const e0 = 1 - Math.abs(a0) * 0.35, e1 = 1 - Math.abs(a1) * 0.35;
        const P = (a, rad, dy) => [S(a) * rad, -R * 0.12 + dy, C(a) * rad];
        b.quad(P(a0, R * 1.1, 0), P(a1, R * 1.1, 0), P(a1, R * (1.1 + 0.5 * e1), -R * 0.12 * e1), P(a0, R * (1.1 + 0.5 * e0), -R * 0.12 * e0), [rgb(COL.visor), rgb(COL.visor), rgb(COL.visorEdge), rgb(COL.visorEdge)]);
        b.quad(P(a0, R * 1.1, -R * 0.05), P(a0, R * (1.1 + 0.5 * e0), -R * 0.16 * e0), P(a1, R * (1.1 + 0.5 * e1), -R * 0.16 * e1), P(a1, R * 1.1, -R * 0.05), rgb(COL.black));
      }
      b.push(M4.rotY(-0.42), M4.translate(0, R * 0.36, R * 1.24), M4.rotX(-0.2));
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => ellAt(b, [dx * R * 0.085, dy * R * 0.085, 0], R * 0.085, R * 0.085, R * 0.02, COL.clover, 8, 4));
      b.pop();
      b.push(M4.translate(R * 1.26, R * 0.06, -R * 0.02), M4.rotZ(-0.16));
      K.tube(b, [[-R * 0.1, 0, 0], [R * 0.16, 0, 0]], [R * 0.4, R * 0.4], 16, COL.brown);
      K.tube(b, [[R * 0.15, 0, 0], [R * 0.22, 0, 0]], [R * 0.36, R * 0.33], 16, COL.gold);
      ellAt(b, [R * 0.2, 0, 0], R * 0.02, R * 0.27, R * 0.27, COL.lens, 12, 6);
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dy, dz]) => ellAt(b, [R * 0.225, dy * R * 0.075, dz * R * 0.075], R * 0.006, R * 0.07, R * 0.07, COL.clover, 6, 4));
      [[0.35, 1.0, -0.15], [0.55, 0.9, -0.35], [0.75, 0.75, -0.55], [0.95, 0.55, -0.7]].forEach(([ang, len, back], i) => {
        b.push(M4.translate(R * 0.05, R * 0.3, -R * 0.15 - i * R * 0.04), M4.rotX(back), M4.rotZ(-ang));
        K.tube(b, [[0, 0, 0], [0, R * len * 0.6, 0], [0, R * len, -R * 0.08]], [R * 0.09, R * 0.07, R * 0.005], 5, i % 2 ? COL.white : COL.feather);
        b.pop();
      });
      b.pop();
      b.pop();
    };
  }

  function kleeEars(R) {
    return b => {
      [-1, 1].forEach(s => {
        K.tube(b, [[s * R * 0.86, -R * 0.12, -R * 0.06], [s * R * 1.25, -R * 0.08, -R * 0.12], [s * R * 1.62, R * 0.02, -R * 0.2]], [R * 0.15, R * 0.09, R * 0.012], 7, COL.skin);
      });
    };
  }

  function kleeTorso() {
    return b => {
      loft(b, [
        ring(-0.095, 0.082, 0.062, 0, COL.red),
        ring(-0.01, 0.086, 0.064, 0, COL.red),
        ring(0.08, 0.098, 0.066, 0, COL.red),
        ring(0.115, 0.07, 0.05, 0, COL.cream),
        ring(0.15, 0.04, 0.036, 0, COL.skin)
      ], 14, { hard: true, capTop: true, capBottom: true });
      boxAt(b, [0, 0.0, 0.066], [0.012, 0.17, 0.008], COL.redDark);
      boxAt(b, [0, 0.105, 0.06], [0.1, 0.03, 0.03], COL.cream);
      ellAt(b, [-0.018, 0.075, 0.07], 0.02, 0.012, 0.008, COL.white, 6, 4, M4.rotZ(0.4));
      ellAt(b, [0.018, 0.075, 0.07], 0.02, 0.012, 0.008, COL.white, 6, 4, M4.rotZ(-0.4));

      boxAt(b, [0, -0.035, 0.066], [0.09, 0.012, 0.012], COL.brownDark);
      ellAt(b, [0, 0.12, 0.052], 0.056, 0.026, 0.046, COL.cream, 8, 5);
      ellAt(b, [0.045, -0.02, 0.068], 0.022, 0.026, 0.008, COL.gold, 7, 5);
    };
  }

  function kleePelvis() {
    return b => {
      loft(b, [
        ring(-0.11, 0.17, 0.15, 0, COL.cream),
        ring(-0.095, 0.158, 0.138, 0, COL.red),
        ring(-0.03, 0.125, 0.105, 0, COL.red),
        ring(0.035, 0.092, 0.072, 0, COL.red)
      ], 16, { hard: true, capTop: true, capBottom: false });
      loft(b, [
        ring(-0.16, 0.115, 0.1, 0, COL.cream),
        ring(-0.08, 0.1, 0.085, 0, COL.cream),
        ring(0.0, 0.085, 0.07, 0, COL.cream)
      ], 14, { hard: true, capBottom: true });
      boxAt(b, [0, -0.08, 0.15], [0.07, 0.07, 0.004], COL.cream);
    };
  }

  function kleeUpper() {
    return b => {
      loft(b, [
        ring(-D.upper, 0.034, 0.034, 0, COL.red),
        ring(0, 0.04, 0.04, 0, COL.red)
      ], 10, { hard: true, capTop: true, capBottom: true });
    };
  }

  function kleeFore() {
    return b => {
      const len = D.fore;
      loft(b, [
        ring(-len, 0.028, 0.027, 0, COL.brownDark),
        ring(-len * 0.7, 0.032, 0.031, 0, COL.brown),
        ring(-len * 0.66, 0.042, 0.04, 0, COL.cream),
        ring(-len * 0.3, 0.04, 0.038, 0, COL.cream),
        ring(0, 0.036, 0.035, 0, COL.red)
      ], 10, { hard: true, capTop: true, capBottom: true });
    };
  }

  function kleeHand() {
    return b => {
      boxAt(b, [0, -0.022, 0], [0.04, 0.044, 0.026], COL.brownDark);
      [-0.013, -0.004, 0.005, 0.014].forEach(ox => {
        K.tube(b, [[ox, -0.04, 0.002], [ox, -0.072, 0.006]], [0.0085, 0.0065], 5, COL.skin);
      });
    };
  }

  function kleeThigh() {
    return b => {
      loft(b, [
        ring(-D.thigh, 0.034, 0.034, 0, COL.skin),
        ring(-D.thigh * 0.4, 0.04, 0.04, 0, COL.skin),
        ring(0, 0.048, 0.048, 0, COL.skin)
      ], 10, { hard: true, capTop: true, capBottom: true });
    };
  }

  function kleeShin() {
    return b => {
      const len = D.shin;
      loft(b, [
        ring(-len, 0.036, 0.036, 0, COL.boot),
        ring(-len * 0.4, 0.04, 0.04, 0, COL.boot),
        ring(-len * 0.38, 0.042, 0.042, 0, COL.white),
        ring(-len * 0.1, 0.04, 0.04, 0, COL.white),
        ring(0, 0.038, 0.038, 0, COL.skin)
      ], 10, { hard: true, capTop: true, capBottom: true });
      boxAt(b, [0, -len * 0.4, 0.04], [0.05, 0.02, 0.02], COL.brownDark);
      ellAt(b, [0, -len * 0.4, 0.05], 0.016, 0.016, 0.01, COL.gold, 6, 4);
    };
  }

  function kleeFoot() {
    return b => {
      boxAt(b, [0, -0.032, 0.035], [0.072, 0.05, 0.13], COL.boot);
      boxAt(b, [0, -0.062, 0.04], [0.076, 0.014, 0.14], COL.black);
    };
  }

  function kleePack() {
    return b => {
      boxAt(b, [0, 0.0, -0.105], [0.2, 0.24, 0.1], COL.brown);
      boxAt(b, [0, 0.1, -0.115], [0.21, 0.07, 0.11], COL.brownDark);
      boxAt(b, [0, 0.0, -0.158], [0.12, 0.1, 0.012], COL.redDark);
      ellAt(b, [0, 0.0, -0.166], 0.03, 0.03, 0.012, [1, 0.3, 0.2, 0.9], 8, 5);
      boxAt(b, [0, 0.02, -0.16], [0.2, 0.025, 0.01], COL.gold);
      [-1, 1].forEach(s => {
        boxAt(b, [s * 0.075, 0.05, 0.02], [0.022, 0.2, 0.14], COL.brownDark);
        boxAt(b, [s * 0.13, -0.06, -0.1], [0.05, 0.1, 0.07], COL.brown);
      });
      ellAt(b, [0.12, -0.14, -0.1], 0.045, 0.05, 0.04, COL.cream, 8, 6);
      ellAt(b, [0.115, -0.1, -0.1], 0.012, 0.045, 0.01, COL.cream, 5, 4, M4.rotZ(0.4));
      ellAt(b, [0.15, -0.1, -0.1], 0.012, 0.045, 0.01, COL.cream, 5, 4, M4.rotZ(-0.2));
    };
  }

  function bustHead(R, skin) {
    return headBase(R, skin, BUST_SHAPE);
  }

  function jeanHair(R) {
    const H = BUST_SHAPE;
    return b => {
      headPatch(b, R, H, 1.06, -PI, PI, 0.5, PI / 2, 22, 5, COL.jeanHair);
      headPatch(b, R, H, 1.06, 1.0, PI * 2 - 1.0, -1.15, 0.6, 16, 9, COL.jeanHair);
      const bangs = [
        [-0.85, 0.22, 0.9, 0.0, 0.2, COL.jeanHair],
        [-0.5, 0.2, 0.92, 0.12, 0.28, COL.jeanHairLight],
        [-0.2, 0.18, 0.95, 0.02, 0.22, COL.jeanHair],
        [-0.05, 0.1, 0.9, -0.15, 0.3, COL.jeanHairLight],
        [0.12, 0.16, 0.95, 0.0, 0.18, COL.jeanHairLight],
        [0.42, 0.2, 0.92, 0.14, 0.14, COL.jeanHair],
        [0.72, 0.2, 0.9, 0.05, 0.1, COL.jeanHairLight]
      ];
      bangs.forEach(([yaw, w, top, tip, curl, col]) => strand(b, R, H, { yaw, w, top, tip, curl, col, tipCol: COL.jeanHairDark, inf: 1.08, lift: 0.03 }));
      [-1, 1].forEach(s => {
        strand(b, R, H, { yaw: s * 1.05, w: 0.24, top: 0.7, tip: -1.1, curl: s * 0.1, col: COL.jeanHair, tipCol: COL.jeanHairDark, inf: 1.1, lift: 0.22, rows: 8 });
        strand(b, R, H, { yaw: s * 1.45, w: 0.3, top: 0.6, tip: -1.2, curl: s * 0.15, col: COL.jeanHairLight, tipCol: COL.jeanHairDark, inf: 1.12, lift: 0.3, rows: 8 });
        const lock = [];
        for (let i = 0; i <= 8; i++) {
          const v = i / 8;
          lock.push([s * R * (1.2 + 0.15 * S(v * PI * 3)), -R * (0.5 + v * 2.8), R * (0.15 - v * 0.25)]);
        }
        K.tube(b, lock, lock.map((p, i) => R * (0.3 - (i / 8) * 0.24)), 8, COL.jeanHair);
      });
      const tail = [[0, R * 0.75, -R * 0.75], [0, R * 1.05, -R * 1.15], [0, R * 0.6, -R * 1.6], [R * 0.05, -R * 0.6, -R * 1.75], [0, -R * 1.9, -R * 1.6], [-R * 0.05, -R * 3.0, -R * 1.4]];
      K.tube(b, tail, [R * 0.28, R * 0.36, R * 0.42, R * 0.4, R * 0.3, R * 0.04], 9, COL.jeanHair);
      ellAt(b, [0, R * 0.95, -R * 0.95], R * 0.22, R * 0.14, R * 0.12, COL.navyDark, 8, 5);
      [-1, 1].forEach(s => ellAt(b, [s * R * 0.22, R * 0.98, -R * 0.98], R * 0.2, R * 0.1, R * 0.05, COL.navy, 8, 5, M4.rotZ(s * 0.4)));
    };
  }

  function hairCurtain(b, R, s) {
    const ca = rgb(s.col), cl = rgb(s.light), ct = rgb(s.tipCol);
    const mixC = (c, k) => [lerp(c[0], ct[0], k), lerp(c[1], ct[1], k), lerp(c[2], ct[2], k), 1];
    const rows = 7;
    for (let i = 0; i < s.cols; i++) {
      const a0 = lerp(s.a0, s.a1, i / s.cols), a1 = lerp(s.a0, s.a1, (i + 1) / s.cols);
      const am = (a0 + a1) / 2, hw = (a1 - a0) * 0.62;
      const len = s.len * (0.8 + 0.2 * Math.abs(S(i * 2.3 + 0.7)));
      const out = i % 2 ? 0.035 : 0;
      const base = i % 2 ? cl : ca;
      let prev = null;
      for (let j = 0; j <= rows; j++) {
        const v = j / rows;
        const y = s.y0 - v * len;
        const rad = R * (s.r0 + s.flare * S(v * PI * 0.7) + out);
        const w = hw * (1 - Math.pow(v, 2.5) * 0.9);
        const P = a => [S(a) * rad, y, C(a) * rad];
        const cur = { l: P(am - w), r: P(am + w), c: mixC(base, v * v), n: [S(am), 0.2, C(am)] };
        if (prev) b.quad(prev.l, prev.r, cur.r, cur.l, [prev.c, prev.c, cur.c, cur.c], null, [prev.n, prev.n, cur.n, cur.n]);
        prev = cur;
      }
    }
  }

  function stelleHair(R) {
    const H = BUST_SHAPE;
    return b => {
      headPatch(b, R, H, 1.06, -PI, PI, 0.42, PI / 2, 22, 5, COL.stelleHair);
      headPatch(b, R, H, 1.07, 0.85, PI * 2 - 0.85, -1.25, 0.6, 16, 9, COL.stelleHair);
      const bangs = [
        [-0.88, 0.22, 0.95, -0.12, -0.22, COL.stelleHairLight],
        [-0.58, 0.2, 0.95, 0.08, -0.16, COL.stelleHair],
        [-0.3, 0.18, 0.95, 0.04, -0.1, COL.stelleHairLight],
        [-0.04, 0.09, 0.9, -0.24, 0.03, COL.stelleHair],
        [0.18, 0.17, 0.95, 0.08, 0.12, COL.stelleHairLight],
        [0.46, 0.2, 0.95, 0.12, 0.18, COL.stelleHair],
        [0.78, 0.22, 0.95, -0.08, 0.24, COL.stelleHairLight]
      ];
      bangs.forEach(([yaw, w, top, tip, curl, col]) => strand(b, R, H, { yaw, w, top, tip, curl, col, tipCol: COL.stelleHairDark, inf: 1.08, lift: 0.05, taper: 1.1 }));
      [-1, 1].forEach(s => {
        strand(b, R, H, { yaw: s * 1.12, w: 0.22, top: 0.75, tip: -0.6, curl: s * 0.12, col: COL.stelleHair, tipCol: COL.stelleHairDark, inf: 1.08, lift: 0.1, rows: 7 });
        const side = s > 0 ? [0.8, 1.45] : [-1.45, -0.8];
        hairCurtain(b, R, { a0: side[0], a1: side[1], cols: 3, y0: -R * 0.05, len: R * 2.5, r0: 1.04, flare: 0.22, col: COL.stelleHair, light: COL.stelleHairLight, tipCol: COL.stelleHairDark });
      });
      hairCurtain(b, R, { a0: PI - 1.3, a1: PI + 1.3, cols: 13, y0: R * 0.35, len: R * 3.7, r0: 1.05, flare: 0.36, col: COL.stelleHair, light: COL.stelleHairLight, tipCol: COL.stelleHairDark });
      [[2.2, 0.45, 1.2, 0.2], [-2.3, 0.3, 1.2, 0.2], [2.9, 0.7, 1.18, 0.2]].forEach(([yaw, pit, reach, w]) => {
        const root = headPt(R, H, yaw, pit, 0.92);
        const tip = headPt(R, H, yaw + 0.3, pit - 0.2, reach + 0.12);
        K.tube(b, [root, tip], [R * w, R * 0.01], 6, COL.stelleHairLight);
      });
    };
  }

  function standingCollar(b, y0, y1, r0, r1, a0, a1, outer, inner) {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const u0 = lerp(a0, a1, i / n), u1 = lerp(a0, a1, (i + 1) / n);
      const P = (a, y, r) => [S(a) * r, y, C(a) * r];
      b.quad(P(u0, y0, r0), P(u1, y0, r0), P(u1, y1, r1), P(u0, y1, r1), outer);
      b.quad(P(u0, y0, r0 * 0.94), P(u0, y1, r1 * 0.94), P(u1, y1, r1 * 0.94), P(u1, y0, r0 * 0.94), inner);
    }
  }

  function jeanBody() {
    return b => {
      loft(b, [
        ring(-0.42, 0.13, 0.085, 0, COL.suit),
        ring(-0.16, 0.14, 0.09, 0, COL.suit),
        ring(-0.02, 0.15, 0.085, 0, COL.suit),
        ring(0.04, 0.05, 0.045, 0, COL.skin),
        ring(0.13, 0.042, 0.042, 0, COL.skin)
      ], 16, { hard: true, capTop: true, capBottom: true });
      b.tri([-0.045, -0.02, 0.088], [0.045, -0.02, 0.088], [0, -0.09, 0.094], COL.skin);
      ellAt(b, [-0.033, -0.1, 0.07], 0.045, 0.04, 0.03, COL.suit, 10, 6);
      ellAt(b, [0.033, -0.1, 0.07], 0.045, 0.04, 0.03, COL.suit, 10, 6);
      [-1, 1].forEach(s => {
        ellAt(b, [s * 0.16, -0.01, -0.005], 0.075, 0.06, 0.08, COL.navy, 10, 6);
        K.tube(b, [[s * 0.18, -0.02, 0], [s * 0.21, -0.42, 0.01]], [0.065, 0.06], 10, COL.navy);
        b.push(M4.translate(s * 0.115, -0.2, 0.072), M4.rotZ(s * 0.12));
        boxAt(b, [0, 0, 0], [0.07, 0.42, 0.03], COL.navy);
        boxAt(b, [-s * 0.035, 0, 0.012], [0.012, 0.42, 0.012], COL.navyTrim);
        [0.12, 0.04, -0.04, -0.12].forEach(y => ellAt(b, [s * 0.012, y, 0.018], 0.009, 0.009, 0.006, COL.gold, 6, 4));
        b.pop();
      });
      standingCollar(b, -0.02, 0.17, 0.12, 0.17, PI - 1.75, PI + 1.75, COL.navy, COL.navyTrim);
      ellAt(b, [0, 0.05, 0.042], 0.035, 0.022, 0.025, COL.white, 8, 5);
      b.tri([-0.05, 0.05, 0.05], [0.05, 0.05, 0.05], [0, -0.03, 0.07], COL.white);
      b.tri([-0.05, 0.03, 0.06], [0, 0.0, 0.07], [-0.03, -0.06, 0.06], 0xdfe4ee);
      b.tri([0.05, 0.03, 0.06], [0, 0.0, 0.07], [0.03, -0.06, 0.06], 0xdfe4ee);
      ellAt(b, [0, 0.025, 0.07], 0.011, 0.014, 0.008, COL.cyan, 8, 5);
      b.push(M4.translate(-0.17, 0.035, 0.0), M4.rotZ(0.35));
      ellAt(b, [0, 0, 0], 0.07, 0.022, 0.075, COL.brown, 10, 4);
      ellAt(b, [0, 0.012, 0.03], 0.02, 0.02, 0.01, COL.gold, 6, 4);
      for (let i = 0; i < 6; i++) K.tube(b, [[-0.06 + i * 0.024, -0.01, 0.05], [-0.06 + i * 0.024, -0.05, 0.055]], [0.006, 0.004], 4, COL.gold);
      b.pop();
    };
  }

  const SD = {
    hipX: 0.085, hipY: -0.06, thigh: 0.42, shin: 0.41,
    chestY: 0.2, neckY: 0.21, shX: 0.14, shY: 0.145,
    upper: 0.26, fore: 0.24, headY: 0.12, head: 0.112
  };

  function stelleTorso() {
    return b => {
      loft(b, [
        ring(-0.22, 0.112, 0.078, 0, COL.shirt),
        ring(-0.12, 0.1, 0.072, 0, COL.shirt),
        ring(0.0, 0.12, 0.088, 0.008, COL.shirt),
        ring(0.1, 0.126, 0.084, 0, COL.shirt),
        ring(0.165, 0.1, 0.07, 0, COL.shirt),
        ring(0.19, 0.054, 0.052, 0.006, COL.shirt),
        ring(0.235, 0.05, 0.048, 0.006, COL.shirt)
      ], 16, { capTop: true });
      const J = [
        ring(-0.25, 0.134, 0.1, 0, COL.coat),
        ring(-0.12, 0.118, 0.088, 0, COL.coat),
        ring(0.0, 0.134, 0.1, 0, COL.coat),
        ring(0.1, 0.14, 0.096, 0, COL.coat),
        ring(0.17, 0.116, 0.084, 0, COL.coat)
      ];
      partialLoft(b, J, 0.6, PI * 2 - 0.6, 18);
      const lining = J.map(r => ring(r.y, r.rx + 0.003, r.rz + 0.003, 0, COL.coatLining));
      partialLoft(b, lining, 0.5, 0.68, 1);
      partialLoft(b, lining, PI * 2 - 0.68, PI * 2 - 0.5, 1);
      const tails = [ring(-0.24, 0.138, 0.102, 0, COL.coat), ring(-0.42, 0.2, 0.16, 0, COL.coat), ring(-0.62, 0.23, 0.18, 0, COL.coat)];
      partialLoft(b, tails, 1.25, PI * 2 - 1.25, 14);
      partialLoft(b, tails.map(r => ring(r.y, r.rx - 0.005, r.rz - 0.005, 0, COL.coatLining)), 1.25, PI * 2 - 1.25, 14);
      [-1, 1].forEach(s => ellAt(b, [s * 0.13, 0.135, -0.005], 0.055, 0.04, 0.06, COL.coat, 10, 6));
      b.push(M4.translate(0.075, 0.08, 0.102), M4.rotX(-0.25));
      [[0, 0.03], [0.02, -0.005], [-0.012, -0.03]].forEach(([dx, dy]) => ellAt(b, [dx, dy, 0], 0.01, 0.016, 0.005, COL.gold, 6, 4, M4.rotZ(0.6)));
      boxAt(b, [0.03, 0.0, 0], [0.006, 0.07, 0.006], COL.gold);
      b.pop();
    };
  }

  function stellePelvis() {
    return b => {
      loft(b, [
        ring(0.12, 0.11, 0.08, 0, COL.skirt),
        ring(0.04, 0.13, 0.096, 0, COL.skirt),
        ring(-0.08, 0.158, 0.12, 0, COL.skirt),
        ring(-0.19, 0.178, 0.138, 0, COL.skirt)
      ], 18, { hard: true });
      partialLoft(b, [ring(0.04, 0.133, 0.099, 0, COL.coatLining), ring(-0.08, 0.161, 0.123, 0, COL.coatLining), ring(-0.19, 0.181, 0.141, 0, COL.coatLining)], 1.36, 1.5, 1);
      loft(b, [ring(0.09, 0.124, 0.09, 0, COL.beltGrey), ring(0.055, 0.132, 0.098, 0, COL.beltGrey)], 18, { hard: true });
      K.tube(b, [[0.1, 0.06, 0.09], [0.0, 0.035, 0.112], [-0.11, 0.0, 0.1]], [0.008, 0.009, 0.008], 6, COL.strap);
      ellAt(b, [-0.145, -0.02, 0.075], 0.026, 0.026, 0.008, COL.gold, 10, 5, M4.rotY(-0.9));
      K.tube(b, [[-0.13, 0.05, 0.085], [-0.15, 0.01, 0.09]], [0.003, 0.003], 4, COL.gold);
    };
  }

  function stelleUpper() {
    return b => {
      loft(b, [
        ring(-SD.upper, 0.046, 0.046, 0, COL.coat),
        ring(-SD.upper * 0.4, 0.05, 0.05, 0, COL.coat),
        ring(-0.02, 0.048, 0.048, 0, COL.coat),
        ring(0.01, 0.03, 0.03, 0, COL.coat)
      ], 10, { capTop: true, capBottom: true });
    };
  }

  function stelleFore() {
    return b => {
      loft(b, [
        ring(-SD.fore, 0.03, 0.03, 0, COL.glove),
        ring(-0.205, 0.035, 0.035, 0, COL.glove),
        ring(-0.2, 0.037, 0.037, 0, COL.coatLining),
        ring(-0.188, 0.037, 0.037, 0, COL.glove),
        ring(-0.175, 0.034, 0.034, 0, COL.glove),
        ring(-0.172, 0.031, 0.031, 0, COL.stelleSkin),
        ring(-0.066, 0.037, 0.037, 0, COL.stelleSkin),
        ring(-0.064, 0.054, 0.054, 0, COL.cuff),
        ring(0, 0.056, 0.056, 0, COL.cuff)
      ], 10, { hard: true, capTop: true, capBottom: true });
    };
  }

  function stelleHand() {
    return b => {
      boxAt(b, [0, -0.034, 0], [0.056, 0.066, 0.03], COL.glove);
      [-0.019, -0.006, 0.007, 0.02].forEach((ox, i) => {
        K.tube(b, [[ox, -0.064, 0.002], [ox, -0.1 + Math.abs(i - 1.5) * 0.008, 0.008]], [0.008, 0.007], 5, COL.glove);
      });
      K.tube(b, [[0.026, -0.03, 0.01], [0.04, -0.06, 0.024]], [0.009, 0.007], 5, COL.glove);
    };
  }

  function stelleThigh() {
    return b => {
      loft(b, [
        ring(-SD.thigh, 0.045, 0.045, 0, COL.stelleSkin),
        ring(-SD.thigh * 0.5, 0.058, 0.058, 0, COL.stelleSkin),
        ring(0, 0.074, 0.074, 0, COL.stelleSkin)
      ], 12, { capTop: true });
      ellAt(b, [0, -SD.thigh, 0], 0.046, 0.05, 0.046, COL.stelleSkin, 10, 6);
    };
  }

  function stelleShin() {
    return b => {
      const len = SD.shin;
      loft(b, [
        ring(-len, 0.04, 0.042, 0, COL.bootBlack),
        ring(-0.29, 0.043, 0.045, 0, COL.bootBlack),
        ring(-0.288, 0.035, 0.035, 0, COL.stelleSkin),
        ring(-0.14, 0.048, 0.05, -0.006, COL.stelleSkin),
        ring(0, 0.046, 0.046, 0, COL.stelleSkin)
      ], 12, { hard: true, capBottom: true });
    };
  }

  function stelleFoot() {
    return b => {
      boxAt(b, [0, -0.03, 0.045], [0.068, 0.05, 0.15], COL.bootBlack);
      boxAt(b, [0, -0.058, 0.065], [0.07, 0.012, 0.12], COL.black);
      boxAt(b, [0, -0.055, -0.02], [0.05, 0.04, 0.045], COL.black);
    };
  }

  function partialLoft(b, rings, a0, a1, sides) {
    const P = (r, a) => [S(a) * r.rx, r.y, C(a) * r.rz];
    for (let j = 0; j < rings.length - 1; j++) {
      const r0 = rings[j], r1 = rings[j + 1];
      for (let i = 0; i < sides; i++) {
        const u0 = lerp(a0, a1, i / sides), u1 = lerp(a0, a1, (i + 1) / sides);
        const n0 = [S(u0), 0, C(u0)], n1 = [S(u1), 0, C(u1)];
        b.quad(P(r0, u0), P(r0, u1), P(r1, u1), P(r1, u0), r0.col, null, [n0, n1, n1, n0]);
      }
    }
  }

  function jeanLegs() {
    return b => {
      [-1, 1].forEach(s => {
        K.tube(b, [[s * 0.09, 1.0, 0], [s * 0.1, 0.55, 0.01], [s * 0.1, 0.42, 0.0]], [0.075, 0.06, 0.055], 10, COL.white);
        K.tube(b, [[s * 0.1, 0.44, 0.0], [s * 0.1, 0.05, -0.01], [s * 0.1, 0.0, 0.05]], [0.06, 0.05, 0.05], 10, COL.navyDark);
      });
      loft(b, [
        ring(1.0, 0.17, 0.12, 0, COL.navy),
        ring(1.1, 0.16, 0.11, 0, COL.belt),
        ring(1.16, 0.15, 0.1, 0, COL.navy),
        ring(1.5, 0.17, 0.11, 0, COL.navy)
      ], 16, { hard: true, capTop: true });
      partialLoft(b, [
        ring(1.08, 0.175, 0.125, 0, COL.navy),
        ring(0.7, 0.24, 0.18, 0, COL.navy),
        ring(0.4, 0.3, 0.24, 0, COL.navy),
        ring(0.32, 0.31, 0.25, 0, COL.navyTrim)
      ], 0.9, PI * 2 - 0.9, 20);
      for (let i = 0; i < 18; i++) {
        const a = lerp(1.05, PI * 2 - 1.05, (i + 0.5) / 18);
        b.push(M4.rotY(a));
        b.tri([0, 0.34, 0.258], [-0.035, 0.5, 0.235], [0.035, 0.5, 0.235], i % 2 ? COL.gold : COL.goldDark);
        b.pop();
      }
      [-1, 1].forEach(s => {
        b.push(M4.rotY(s * 0.95));
        boxAt(b, [0, 0.7, 0.2], [0.05, 0.75, 0.012], COL.white, M4.rotX(-0.18));
        b.pop();
      });
      [0.0, 0.7, -0.7, 1.6].forEach((a, i) => {
        b.push(M4.rotY(a));
        ellAt(b, [0, 1.1, 0.16], 0.016, 0.016, 0.01, i ? COL.gold : COL.cyan, 6, 4);
        b.pop();
      });
      b.push(M4.translate(0.2, 1.02, 0.06));
      K.tube(b, [[0, 0.08, 0], [0, -0.06, 0.01]], [0.01, 0.01], 4, COL.gold);
      ellAt(b, [0, -0.12, 0.012], 0.05, 0.07, 0.03, COL.gold, 10, 6);
      ellAt(b, [0, -0.12, 0.03], 0.038, 0.056, 0.02, COL.cyan, 10, 6);
      b.pop();
      const sh = [0.27, 1.45, 0.0], el = [0.33, 1.15, 0.06], wr = [0.42, 0.9, 0.1];
      K.tube(b, [sh, el], [0.07, 0.06], 10, COL.white);
      K.tube(b, [el, wr], [0.055, 0.045], 10, COL.navyTrim);
      K.tube(b, [el, [lerp(el[0], wr[0], 0.5), lerp(el[1], wr[1], 0.5), lerp(el[2], wr[2], 0.5)]], [0.06, 0.05], 10, COL.navy);
      ellAt(b, [wr[0] + 0.02, wr[1] - 0.05, wr[2]], 0.04, 0.06, 0.025, COL.glove, 8, 5);
      for (let i = 0; i < 4; i++) K.tube(b, [[wr[0] + 0.01 + i * 0.016, wr[1] - 0.09, wr[2] + 0.01], [wr[0] + 0.03 + i * 0.025, wr[1] - 0.16, wr[2] + 0.02]], [0.009, 0.007], 4, COL.glove);
      K.tube(b, [[wr[0] - 0.02, wr[1] - 0.06, wr[2] + 0.02], [wr[0] - 0.05, wr[1] - 0.1, wr[2] + 0.04]], [0.01, 0.008], 4, COL.glove);
    };
  }

  function build(r) {
    const R = D.head;
    const tex = (style, eyeStates, mouthStates) => {
      const eyes = {};
      eyeStates.forEach(s => { eyes[s] = r.texture(512, F.drawEyes(style, s), { height: 256, clamp: true }); });
      const mouths = {};
      mouthStates.forEach(s => { mouths[s] = r.texture(256, F.drawMouth(style, s), { height: 128, clamp: true }); });
      return { eyes, mouths };
    };
    const eyeAll = ['open', 'wide', 'half', 'happy', 'shut', 'wink'];
    const mouthAll = ['smile', 'grin', 'talk', 'open', 'wide', 'o', 'laugh', 'shut'];
    const kleeT = tex('klee', eyeAll, mouthAll);
    const jeanT = tex('jean', ['open', 'half', 'shut'], ['shut', 'talk', 'open', 'smile']);
    const stelleT = tex('stelle', ['open', 'half', 'shut', 'happy'], ['shut', 'smile', 'talk', 'open']);
    const BR = 0.108;
    const mk = (fn) => K.mesh(r, fn);
    return {
      klee: {
        eyes: kleeT.eyes,
        mouths: kleeT.mouths,
        head: mk(headBase(R, COL.skin)),
        eyePatch: mk(facePatch(R, F.EYE_PATCH, 18, 10)),
        mouthPatch: mk(facePatch(R, F.MOUTH_PATCH, 12, 8)),
        hair: mk(kleeHair(R)),
        hat: mk(kleeHat(R)),
        ears: mk(kleeEars(R)),
        torso: mk(kleeTorso()),
        pelvis: mk(kleePelvis()),
        upper: mk(kleeUpper()),
        fore: mk(kleeFore()),
        hand: mk(kleeHand()),
        thigh: mk(kleeThigh()),
        shin: mk(kleeShin()),
        foot: mk(kleeFoot()),
        pack: mk(kleePack())
      },
      jean: {
        eyes: jeanT.eyes,
        mouths: jeanT.mouths,
        head: mk(bustHead(BR, COL.skin)),
        eyePatch: mk(facePatch(BR, F.EYE_PATCH, 16, 10, BUST_SHAPE)),
        mouthPatch: mk(facePatch(BR, F.MOUTH_PATCH, 10, 6, BUST_SHAPE)),
        hair: mk(jeanHair(BR)),
        body: mk(jeanBody()),
        legs: mk(jeanLegs())
      },
      stelle: {
        eyes: stelleT.eyes,
        mouths: stelleT.mouths,
        head: mk(bustHead(SD.head, COL.stelleSkin)),
        eyePatch: mk(facePatch(SD.head, F.EYE_PATCH, 16, 10, BUST_SHAPE)),
        mouthPatch: mk(facePatch(SD.head, F.MOUTH_PATCH, 10, 6, BUST_SHAPE)),
        hair: mk(stelleHair(SD.head)),
        torso: mk(stelleTorso()),
        pelvis: mk(stellePelvis()),
        upper: mk(stelleUpper()),
        fore: mk(stelleFore()),
        hand: mk(stelleHand()),
        thigh: mk(stelleThigh()),
        shin: mk(stelleShin()),
        foot: mk(stelleFoot())
      },
      BR
    };
  }

  function solveKlee(pose) {
    const yaw = pose.yaw || 0;
    const lean = pose.lean || 0;
    const roll = pose.roll || 0;
    const fwd = [S(yaw), -lean, C(yaw)];
    const up = [S(roll) * C(yaw), C(roll), -S(roll) * S(yaw)];
    const p = Object.assign({
      hL: [0.13, -0.13, 0.03],
      hR: [-0.13, -0.13, 0.03],
      eL: [0.5, -0.2, -0.7],
      eR: [-0.5, -0.2, -0.7],
      fL: [0.06, -0.405, 0.02],
      fR: [-0.06, -0.405, 0.02],
      kL: [0.04, 0, 1],
      kR: [-0.04, 0, 1]
    }, pose, { p: pose.pos || [0, 0.48, 0], fwd, up });
    return Rig.solve(p, D);
  }

  function drawKlee(r, V, pose, opts) {
    const o = opts || {};
    const sc = pose.scale || 1;
    const m = solveKlee(pose);
    const at = (mm) => (sc === 1 ? mm : M4.chain(M4.translate(pose.pos[0], 0, pose.pos[2]), M4.scale(sc, sc, sc), M4.translate(-pose.pos[0], 0, -pose.pos[2]), mm));
    const draw = (mesh, mm, extra) => r.draw(mesh, at(mm), Object.assign({}, o.draw, extra));
    const k = V.klee;
    draw(k.pelvis, m.pelvis);
    draw(k.torso, m.chest);
    draw(k.pack, m.chest);
    draw(k.upper, m.upperL);
    draw(k.upper, m.upperR);
    draw(k.fore, m.foreL);
    draw(k.fore, m.foreR);
    draw(k.hand, m.handL);
    draw(k.hand, m.handR);
    draw(k.thigh, m.thighL);
    draw(k.thigh, m.thighR);
    draw(k.shin, m.shinL);
    draw(k.shin, m.shinR);
    draw(k.foot, m.footL);
    draw(k.foot, m.footR);
    draw(k.head, m.head);
    draw(k.eyePatch, m.head, { texture: k.eyes[pose.eyes] || k.eyes.open });
    draw(k.mouthPatch, m.head, { texture: k.mouths[pose.mouth] || k.mouths.smile });
    draw(k.hair, m.head);
    draw(k.hat, m.head);
    draw(k.ears, m.head);
    return m;
  }

  function solveStelle(pose) {
    const yaw = pose.yaw || 0;
    const roll = pose.roll || 0;
    const fwd = [S(yaw), 0, C(yaw)];
    const up = [S(roll) * C(yaw), C(roll), -S(roll) * S(yaw)];
    const base = pose.base || [pose.pos[0], 0, pose.pos[2]];
    const foot = (local) => [base[0] + C(yaw) * local[0] + S(yaw) * local[2], 0.07, base[2] - S(yaw) * local[0] + C(yaw) * local[2]];
    const p = Object.assign({
      hL: [0.19, -0.3, 0.04],
      hR: [-0.19, -0.3, 0.04],
      eL: [0.5, -0.2, -0.7],
      eR: [-0.5, -0.2, -0.7],
      kL: [0.05, 0, 1],
      kR: [-0.05, 0, 1]
    }, pose, {
      p: pose.pos,
      fwd,
      up,
      fLw: foot(pose.footL || [0.1, 0, 0.02]),
      fRw: foot(pose.footR || [-0.1, 0, 0.02])
    });
    return Rig.solve(p, SD);
  }

  function drawStelle(r, V, pose) {
    const m = solveStelle(pose);
    const v = V.stelle;
    r.draw(v.pelvis, m.pelvis);
    r.draw(v.torso, m.chest);
    ['L', 'R'].forEach(s => {
      r.draw(v.upper, m['upper' + s]);
      r.draw(v.fore, m['fore' + s]);
      r.draw(v.hand, m['hand' + s]);
      r.draw(v.thigh, m['thigh' + s]);
      r.draw(v.shin, m['shin' + s]);
      r.draw(v.foot, m['foot' + s]);
    });
    r.draw(v.head, m.head);
    r.draw(v.eyePatch, m.head, { texture: v.eyes[pose.eyes] || v.eyes.open });
    r.draw(v.mouthPatch, m.head, { texture: v.mouths[pose.mouth] || v.mouths.shut });
    r.draw(v.hair, m.head);
    return m;
  }

  function bustMatrix(pose, sc) {
    return M4.chain(
      M4.translate(pose.pos[0], pose.pos[1], pose.pos[2]),
      M4.rotY(pose.yaw || 0),
      M4.rotZ(pose.roll || 0),
      M4.scale(sc, sc, sc)
    );
  }

  function drawBust(r, V, kind, pose) {
    const v = V[kind];
    const sc = pose.scale || 1;
    const base = bustMatrix(pose, sc);
    const headM = M4.chain(base, M4.translate(0, 0.17, 0.01), M4.rotY(pose.headYaw || 0), M4.rotX(pose.pitch || 0), M4.rotZ(pose.tilt || 0));
    r.draw(v.body, base);
    r.draw(v.head, headM);
    r.draw(v.eyePatch, headM, { texture: v.eyes[pose.eyes] || v.eyes.open });
    r.draw(v.mouthPatch, headM, { texture: v.mouths[pose.mouth] || v.mouths.shut });
    r.draw(v.hair, headM);
  }

  function drawJeanLegs(r, V, pose) {
    r.draw(V.jean.legs, M4.chain(M4.translate(pose.pos[0], pose.pos[1], pose.pos[2]), M4.rotY(pose.yaw || 0), M4.scale(pose.scale || 1, pose.scale || 1, pose.scale || 1)));
  }

  function runPose(t, rate, amp) {
    const ph = t * rate;
    const a = S(ph), lift = Math.max(0, C(ph)), liftB = Math.max(0, -C(ph));
    const k = amp === undefined ? 1 : amp;
    return {
      fL: [0.06, -0.405 + lift * 0.1 * k, a * 0.16 * k + 0.02],
      fR: [-0.06, -0.405 + liftB * 0.1 * k, -a * 0.16 * k + 0.02],
      kL: [0.04, 0, 1],
      kR: [-0.04, 0, 1],
      hL: [0.15, -0.1, -a * 0.08 * k + 0.04],
      hR: [-0.15, -0.1, a * 0.08 * k + 0.04],
      eL: [0.6, -0.3, -0.7],
      eR: [-0.6, -0.3, -0.7],
      bob: Math.abs(C(ph)) * 0.025 * k
    };
  }

  function standPose(t) {
    return {
      hL: [0.13, -0.12, 0.03 + S(t * 2) * 0.01],
      hR: [-0.13, -0.12, 0.03 + S(t * 2 + 1) * 0.01],
      bob: S(t * 2.2) * 0.004
    };
  }

  function jumpPose(t) {
    const flail = S(t * 6) * 0.03;
    return {
      hL: [0.3, 0.1 + flail, 0.02],
      hR: [-0.3, 0.1 - flail, 0.02],
      eL: [0.7, 0.4, -0.3],
      eR: [-0.7, 0.4, -0.3],
      fL: [0.07, -0.3, -0.1],
      fR: [-0.07, -0.3, 0.12],
      kL: [0.06, -0.3, 1],
      kR: [-0.06, -0.3, 1],
      bob: 0
    };
  }

  window.KleeCast = { D, SD, COL, build, solveKlee, drawKlee, solveStelle, drawStelle, drawBust, drawJeanLegs, runPose, standPose, jumpPose };
})();
