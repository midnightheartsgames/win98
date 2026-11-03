(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;
  const A = window.KafkaArt;

  const KD = {
    hipX: 0.085, hipY: -0.06, thigh: 0.44, shin: 0.43,
    chestY: 0.21, neckY: 0.215, shX: 0.145, shY: 0.15,
    upper: 0.27, fore: 0.25, headY: 0.125, head: 0.112
  };

  const GD = {
    hipX: 0.11, hipY: -0.07, thigh: 0.46, shin: 0.45,
    chestY: 0.24, neckY: 0.27, shX: 0.21, shY: 0.17,
    upper: 0.29, fore: 0.27, headY: 0.13, head: 0.12
  };

  const COL = {
    skin: 0xf6d6cc,
    hair: 0x6b1d4f,
    hairLight: 0x8f2c69,
    hairDark: 0x3e0f2f,
    hairTip: 0x541640,
    shirt: 0xe4e2ee,
    shirtShade: 0xc8c4d8,
    corset: 0x231a22,
    strap: 0x141016,
    ribbon: 0xb02a78,
    gold: 0xc8a060,
    coat: 0x1d161b,
    lining: 0x5a1430,
    glove: 0x5e1838,
    gloveDark: 0x3e0e24,
    shorts: 0x1a1418,
    boot: 0x2c1019,
    heel: 0x140a0e,
    lens: 0x2e0a30,
    frame: 0xd9a0c8,
    blade: [0.93, 0.92, 0.97, 0.35],
    tsuba: 0xbab4c4,
    sheath: 0x18141c,
    silver: 0xd8d4e0,
    smg: 0x2a2630,
    smgLight: 0x6a6070,
    smgAccent: [0.78, 0.2, 0.48, 0.5],
    umbrella: 0x141016,
    navy: 0x272e44,
    navyLight: 0x4c5674,
    navyDark: 0x161a28,
    red: 0xa82038,
    visor: [0.78, 0.58, 0.28, 0.35],
    visorLight: [0.98, 0.8, 0.5, 0.55],
    capBand: 0x101420,
    glove2: 0x1a1c24,
    rifle: 0x1e1c22,
    brass: 0x8a6a3a,
    glow: [1.0, 0.82, 0.25, 1]
  };

  const SHAPE = { jaw: 0.52, chinIn: 0.12, chinDrop: 0.25, back: 1.02 };

  function boxAt(b, pos, size, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.box(size[0], size[1], size[2], col);
    if (rotM) b.pop();
    b.pop();
  }

  function ellAt(b, pos, rx, ry, rz, col, seg, rings, rotM, flat) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.ellipsoid(rx, ry, rz, seg || 10, rings || 8, col, { flat });
    if (rotM) b.pop();
    b.pop();
  }

  function headPt(R, yaw, pit, inf) {
    const cx = S(yaw) * C(pit), cy = S(pit), cz = C(yaw) * C(pit);
    let x = cx * R, y = cy * R * 0.92, z = cz * R * 0.96;
    if (cy < 0) {
      const q = -cy;
      x *= 1 - SHAPE.jaw * q * q;
      z *= z > 0 ? 1 - SHAPE.chinIn * q * q : 1 - 0.3 * q * q;
      y *= 1 + SHAPE.chinDrop * q;
    }
    if (z < 0) z *= SHAPE.back;
    return [x * inf, y * inf, z * inf];
  }

  function headPatch(b, R, inf, y0, y1, p0, p1, nu, nv, col, uvs) {
    const e = 0.002;
    const vert = (yaw, pit) => {
      const p = headPt(R, yaw, pit, inf);
      const dy = V3.sub(headPt(R, yaw + e, pit, inf), headPt(R, yaw - e, pit, inf));
      const dp = V3.sub(headPt(R, yaw, Math.min(pit + e, PI / 2), inf), headPt(R, yaw, Math.max(pit - e, -PI / 2), inf));
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

  function mixCol(a, b, k) {
    const ca = rgb(a), cb = rgb(b);
    return [lerp(ca[0], cb[0], k), lerp(ca[1], cb[1], k), lerp(ca[2], cb[2], k), lerp(ca[3], cb[3], k)];
  }

  function strand(b, R, s) {
    const rows = s.rows || 6;
    const pts = [];
    for (let j = 0; j <= rows; j++) {
      const v = j / rows;
      const pit = lerp(s.top, s.tip, v);
      const yc = s.yaw + (s.curl || 0) * v * v;
      const hw = s.w * Math.pow(1 - v, s.taper || 0.8) + 0.004;
      const inf = s.inf + (s.lift || 0) * v * v;
      pts.push([headPt(R, yc - hw, pit, inf), headPt(R, yc + hw, pit, inf), v]);
    }
    for (let j = 0; j < rows; j++) {
      const [a0, a1, k0] = pts[j], [b0, b1, k1] = pts[j + 1];
      const n0 = V3.norm(V3.add(a0, a1)), n1 = V3.norm(V3.add(b0, b1));
      const c0 = mixCol(s.col, s.tipCol || s.col, k0), c1 = mixCol(s.col, s.tipCol || s.col, k1);
      b.quad(a0, a1, b1, b0, [c0, c0, c1, c1], null, [n0, n0, n1, n1]);
    }
  }

  function ribbon(b, pts, widths, colA, colB, out) {
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i], p1 = pts[i + 1];
      const tan = V3.norm(V3.sub(p1, p0));
      const side = V3.norm(V3.cross(tan, out));
      const k0 = i / (pts.length - 1), k1 = (i + 1) / (pts.length - 1);
      const a0 = V3.add(p0, V3.mul(side, widths[i] / 2)), a1 = V3.sub(p0, V3.mul(side, widths[i] / 2));
      const b0 = V3.add(p1, V3.mul(side, widths[i + 1] / 2)), b1 = V3.sub(p1, V3.mul(side, widths[i + 1] / 2));
      const c0 = mixCol(colA, colB, k0), c1 = mixCol(colA, colB, k1);
      b.quad(a0, a1, b1, b0, [c0, c0, c1, c1], null, [out, out, out, out]);
    }
  }

  function arcLoft(b, rings, a0, a1, sides, uv) {
    const P = (r, a) => [(r.cx || 0) + S(a) * r.rx, r.y, (r.cz || 0) + C(a) * r.rz];
    for (let j = 0; j < rings.length - 1; j++) {
      const r0 = rings[j], r1 = rings[j + 1];
      for (let i = 0; i < sides; i++) {
        const u0 = lerp(a0, a1, i / sides), u1 = lerp(a0, a1, (i + 1) / sides);
        const n0 = [S(u0), 0.15, C(u0)], n1 = [S(u1), 0.15, C(u1)];
        const uvs = uv ? [[i / sides * uv[0], j / (rings.length - 1) * uv[1]], [(i + 1) / sides * uv[0], j / (rings.length - 1) * uv[1]], [(i + 1) / sides * uv[0], (j + 1) / (rings.length - 1) * uv[1]], [i / sides * uv[0], (j + 1) / (rings.length - 1) * uv[1]]] : null;
        b.quad(P(r0, u0), P(r0, u1), P(r1, u1), P(r1, u0), [rgb(r0.col), rgb(r0.col), rgb(r1.col), rgb(r1.col)], uvs, [n0, n1, n1, n0]);
      }
    }
  }

  function outward(pts, center) {
    const n = V3.norm(V3.cross(V3.sub(pts[1], pts[0]), V3.sub(pts[2], pts[0])));
    const mid = V3.mul(pts.reduce((acc, p) => V3.add(acc, p), [0, 0, 0]), 1 / pts.length);
    return V3.dot(n, V3.sub(mid, center)) < 0 ? V3.mul(n, -1) : n;
  }

  function oq(b, pts, col, center) {
    const n = outward(pts, center);
    b.quad(pts[0], pts[1], pts[2], pts[3], col, null, [n, n, n, n]);
  }

  function ot(b, pts, col, center) {
    const n = outward(pts, center);
    b.tri(pts[0], pts[1], pts[2], col, null, [n, n, n]);
  }

  function facetLoft(b, rings, sides, phase) {
    const P = (r, i) => {
      const a = (i / sides) * PI * 2 + (phase || 0);
      return [(r.cx || 0) + S(a) * r.rx, r.y, (r.cz || 0) + C(a) * r.rz];
    };
    for (let j = 0; j < rings.length - 1; j++) {
      const r0 = rings[j], r1 = rings[j + 1];
      const center = [((r0.cx || 0) + (r1.cx || 0)) / 2, (r0.y + r1.y) / 2, ((r0.cz || 0) + (r1.cz || 0)) / 2];
      for (let i = 0; i < sides; i++) {
        const col = (i + j) % 2 ? r0.col : (r0.alt || r0.col);
        oq(b, [P(r0, i), P(r0, i + 1), P(r1, i + 1), P(r1, i)], col, center);
      }
    }
    [[rings[rings.length - 1], rings[rings.length - 2]], [rings[0], rings[1]]].forEach(([cap, next]) => {
      const c = [cap.cx || 0, cap.y, cap.cz || 0];
      const inner = [cap.cx || 0, next.y, cap.cz || 0];
      for (let i = 0; i < sides; i++) ot(b, [c, P(cap, i), P(cap, i + 1)], cap.col, inner);
    });
  }

  function fring(y, rx, rz, col, alt, cz) {
    return { y, rx, rz, col, alt, cz: cz || 0 };
  }

  function kafkaHead(R) {
    return b => {
      headPatch(b, R, 1, -PI, PI, -PI / 2, PI / 2, 24, 16, COL.skin);
    };
  }

  function facePatch(R, patch, nu, nv) {
    return b => headPatch(b, R, 1.006, patch[0], patch[1], patch[2], patch[3], nu, nv, [1, 1, 1, 0.05], [1, 1]);
  }

  function kafkaHair(R) {
    return b => {
      headPatch(b, R, 1.07, -PI, PI, 0.3, PI / 2, 24, 6, COL.hair);
      headPatch(b, R, 1.075, 1.4, PI * 2 - 1.4, -1.25, 0.62, 16, 10, COL.hair);
      headPatch(b, R, 1.072, -1.45, -0.95, 0.05, 0.62, 4, 4, COL.hair);
      headPatch(b, R, 1.072, 0.95, 1.45, 0.05, 0.62, 4, 4, COL.hair);
      const bangs = [
        [-1.14, 0.2, 0.9, -0.55, -0.1, COL.hairDark],
        [-0.92, 0.2, 0.92, -0.2, -0.14, COL.hairLight],
        [-0.68, 0.2, 0.95, 0.06, -0.12, COL.hair],
        [-0.44, 0.19, 0.95, 0.13, -0.08, COL.hairLight],
        [-0.17, 0.12, 0.95, -0.42, 0.04, COL.hairDark],
        [0.05, 0.19, 0.95, 0.14, 0.1, COL.hair],
        [0.29, 0.2, 0.95, 0.12, 0.15, COL.hairLight],
        [0.53, 0.2, 0.95, 0.06, 0.18, COL.hair],
        [0.78, 0.2, 0.92, -0.16, 0.16, COL.hairLight],
        [1.02, 0.2, 0.9, -0.46, 0.1, COL.hairDark]
      ];
      bangs.forEach(([yaw, w, top, tip, curl, col]) => strand(b, R, { yaw, w, top, tip, curl, col, tipCol: COL.hairTip, inf: 1.085, lift: 0.05, taper: 1.0, rows: 7 }));
      [-1, 1].forEach(s => {
        const pts = [], wide = [];
        const n = 8;
        for (let i = 0; i <= n; i++) {
          const k = i / n;
          pts.push([s * R * (1.0 + 0.07 * S(k * PI * 2.4) + k * 0.28), lerp(R * 0.32, -R * 3.5, k), R * (0.32 + 0.22 * k)]);
          wide.push(R * (0.3 + 0.22 * S(Math.min(1, k * 1.4) * PI * 0.5)) * (1 - Math.pow(k, 3) * 0.85));
        }
        ribbon(b, pts, wide, COL.hair, COL.hairTip, [s * 0.45, 0, 1]);
        ribbon(b, pts.map(p => [p[0] + s * R * 0.04, p[1] + R * 0.05, p[2] - R * 0.07]), wide.map(x => x * 0.85), COL.hairDark, COL.hairDark, [s, 0, 0.35]);
      });
      ellAt(b, [0, -R * 0.12, -R * 1.05], R * 0.2, R * 0.16, R * 0.12, COL.hairDark, 8, 5);
      [-1, 1].forEach(s => {
        const c = headPt(R, s * 0.34, 0.78, 1.13);
        const n = V3.norm(c);
        const x = V3.norm(V3.cross([0, 1, 0], n));
        const y = V3.cross(n, x);
        b.push(Rig.basisM(c, x, y, n));
        K.discXY(b, 0, 0, 0.004, R * 0.27, 14, COL.lens);
        K.tube(b, Array.from({ length: 15 }, (_, i) => [C(i / 14 * PI * 2) * R * 0.28, S(i / 14 * PI * 2) * R * 0.28, 0.005]), new Array(15).fill(R * 0.025), 4, COL.frame);
        b.pop();
      });
      K.tube(b, [headPt(R, -0.12, 0.8, 1.15), headPt(R, 0.12, 0.8, 1.15)], [R * 0.02, R * 0.02], 4, COL.frame);
    };
  }

  function kafkaTail() {
    return b => {
      const pts = [[0, 0.35, -0.08], [0, 0.22, -0.15], [0, 0.0, -0.205], [0, -0.25, -0.238], [0.01, -0.48, -0.264], [0.02, -0.66, -0.28]];
      const w = [0.12, 0.16, 0.17, 0.15, 0.1, 0.03];
      ribbon(b, pts, w, COL.hair, COL.hairTip, [0, 0.1, -1]);
      ribbon(b, pts.map(p => [p[0], p[1], p[2] + 0.02]), w.map(x => x * 0.9), COL.hairDark, COL.hairDark, [0, 0.1, -1]);
      ribbon(b, pts.map(p => [p[0] + 0.035, p[1] - 0.02, p[2] - 0.01]), w.map(x => x * 0.55), COL.hairLight, COL.hairTip, [0, 0.1, -1]);
      ribbon(b, pts.map(p => [p[0], p[1], p[2] + 0.01]), w.map(x => x * 0.45), COL.hairDark, COL.hairTip, [1, 0, 0]);
    };
  }

  function kafkaTorso() {
    return b => {
      loft(b, [
        ring(-0.25, 0.112, 0.08, 0, COL.shirt),
        ring(-0.13, 0.098, 0.074, 0, COL.shirt),
        ring(-0.01, 0.112, 0.086, 0.012, COL.shirt),
        ring(0.06, 0.126, 0.108, 0.034, COL.shirt),
        ring(0.12, 0.13, 0.1, 0.026, COL.shirt),
        ring(0.17, 0.118, 0.078, 0, COL.shirtShade),
        ring(0.2, 0.06, 0.056, 0.006, COL.shirt),
        ring(0.25, 0.05, 0.048, 0.008, COL.skin),
        ring(0.3, 0.044, 0.044, 0.01, COL.skin)
      ], 16, { capTop: true, uv: true });
      loft(b, [
        ring(0.19, 0.066, 0.062, 0.008, COL.shirt),
        ring(0.25, 0.062, 0.058, 0.01, COL.shirt)
      ], 14);
      loft(b, [
        ring(-0.27, 0.12, 0.087, 0, COL.corset),
        ring(-0.14, 0.106, 0.081, 0, COL.corset),
        ring(-0.05, 0.116, 0.09, 0.01, COL.corset),
        ring(-0.02, 0.12, 0.096, 0.016, COL.corset)
      ], 16, { hard: true });
      [-1, 1].forEach(s => {
        [-0.21, -0.15, -0.09].forEach(y => ellAt(b, [s * 0.025, y, 0.09 + (y + 0.2) * 0.06], 0.007, 0.007, 0.005, COL.gold, 6, 4));
        K.tube(b, [[s * 0.07, 0.03, 0.112], [s * 0.1, 0.12, 0.072], [s * 0.125, 0.172, -0.02], [s * 0.085, 0.1, -0.092], [s * 0.06, 0.0, -0.088]], [0.014, 0.014, 0.014, 0.014, 0.014], 5, COL.strap);
        b.tri([s * 0.012, 0.215, 0.066], [s * 0.06, 0.2, 0.05], [s * 0.035, 0.17, 0.07], COL.shirt);
        ellAt(b, [s * 0.075, 0.03, 0.118], 0.012, 0.016, 0.006, COL.gold, 6, 4);
      });
      loft(b, [ring(-0.025, 0.122, 0.099, 0.018, COL.strap), ring(0.012, 0.125, 0.104, 0.024, COL.strap)], 16, { hard: true });
      loft(b, [ring(0.118, 0.133, 0.106, 0.026, COL.strap), ring(0.138, 0.131, 0.102, 0.022, COL.strap)], 16, { hard: true });
      K.tube(b, [[0, 0.19, 0.068], [0, 0.1, 0.13], [0, 0.03, 0.128]], [0.004, 0.004, 0.004], 4, COL.shirtShade);
      loft(b, [ring(0.235, 0.052, 0.05, 0.008, COL.strap), ring(0.255, 0.05, 0.048, 0.008, COL.strap)], 12, { hard: true });
      b.push(M4.translate(0.045, -0.04, 0.098));
      b.tri([0, 0, 0], [0.05, 0.025, 0.004], [0.045, -0.025, 0.004], COL.ribbon);
      b.tri([0, 0, 0], [-0.045, 0.02, 0.004], [-0.04, -0.03, 0.004], COL.ribbon);
      K.tube(b, [[0, 0, 0.004], [0.012, -0.09, 0.008]], [0.012, 0.004], 4, COL.ribbon);
      ellAt(b, [0, 0, 0.006], 0.012, 0.012, 0.008, COL.ribbon, 6, 4);
      b.pop();
      K.tube(b, [[0, 0.2, 0.06], [0, 0.17, 0.068]], [0.006, 0.006], 4, COL.strap);
    };
  }

  const COAT_TOP = [ring(0.215, 0.1, 0.088, 0, COL.coat), ring(0.19, 0.165, 0.112, 0, COL.coat), ring(0.15, 0.212, 0.136, 0, COL.coat), ring(0.08, 0.235, 0.15, -0.02, COL.coat)];
  const COAT_LOW = [
    ring(0.08, 0.235, 0.15, -0.02, COL.coat),
    ring(0.0, 0.24, 0.142, -0.04, COL.coat),
    ring(-0.3, 0.26, 0.15, -0.068, COL.coat),
    ring(-0.62, 0.29, 0.17, -0.08, COL.coat),
    ring(-0.95, 0.32, 0.2, -0.08, COL.coat)
  ];

  function kafkaCoat() {
    return b => {
      arcLoft(b, COAT_TOP, 0.8, PI * 2 - 0.8, 18, [3, 0.6]);
      arcLoft(b, COAT_LOW, 1.2, PI * 2 - 1.2, 16, [3, 3]);
    };
  }

  function kafkaCoatPlain() {
    return b => {
      arcLoft(b, COAT_TOP.map(r => ring(r.y, r.rx - 0.008, r.rz - 0.008, r.cz, COL.lining)), 0.8, PI * 2 - 0.8, 18);
      arcLoft(b, COAT_LOW.map(r => ring(r.y, r.rx - 0.008, r.rz - 0.008, r.cz, COL.lining)), 1.2, PI * 2 - 1.2, 16);
      arcLoft(b, [ring(0.17, 0.11, 0.095, 0, COL.coat), ring(0.235, 0.105, 0.095, 0, COL.coat)], PI - 1.3, PI + 1.3, 8);
      [-1, 1].forEach(s => {
        K.tube(b, [[s * 0.19, 0.12, -0.11], [s * 0.21, -0.12, -0.14], [s * 0.22, -0.42, -0.15]], [0.035, 0.042, 0.048], 7, COL.coat);
        K.tube(b, [[s * 0.22, -0.42, -0.15], [s * 0.222, -0.45, -0.15]], [0.048, 0.046], 7, COL.lining);
      });
    };
  }

  function backDecal() {
    return b => b.quad([0.11, -0.12, -0.226], [-0.11, -0.12, -0.226], [-0.12, -0.5, -0.243], [0.12, -0.5, -0.243], [0.91, 0.86, 0.81, 0.3], [[0, 1], [1, 1], [1, 0], [0, 0]]);
  }

  function kafkaPelvis() {
    return b => {
      loft(b, [
        ring(0.15, 0.118, 0.088, 0, COL.shorts),
        ring(0.04, 0.138, 0.1, 0, COL.shorts),
        ring(-0.08, 0.158, 0.114, 0, COL.shorts),
        ring(-0.15, 0.162, 0.118, 0, COL.shorts)
      ], 16, { hard: true, capBottom: true });
      loft(b, [ring(0.09, 0.132, 0.096, 0, COL.strap), ring(0.06, 0.136, 0.099, 0, COL.strap)], 16, { hard: true });
      boxAt(b, [0.0, 0.075, 0.1], [0.03, 0.026, 0.008], COL.gold);
    };
  }

  function kafkaUpper() {
    return b => {
      loft(b, [
        ring(-KD.upper, 0.043, 0.043, 0, COL.shirt),
        ring(-0.15, 0.046, 0.046, 0, COL.shirt),
        ring(-0.03, 0.05, 0.05, 0, COL.shirt),
        ring(0.01, 0.034, 0.034, 0, COL.shirt)
      ], 10, { capTop: true, capBottom: true });
      loft(b, [ring(-0.1, 0.052, 0.052, 0, COL.strap), ring(-0.075, 0.053, 0.053, 0, COL.strap)], 10, { hard: true });
      ellAt(b, [0, -0.088, 0.052], 0.008, 0.01, 0.004, COL.gold, 6, 4);
    };
  }

  function kafkaFore() {
    return b => {
      loft(b, [
        ring(-KD.fore, 0.029, 0.026, 0, COL.glove),
        ring(-0.19, 0.036, 0.034, 0, COL.glove),
        ring(-0.15, 0.047, 0.045, 0, COL.gloveDark),
        ring(-0.148, 0.05, 0.05, 0, COL.shirt),
        ring(-0.1, 0.056, 0.056, 0, COL.shirt),
        ring(-0.04, 0.047, 0.047, 0, COL.shirt),
        ring(0.01, 0.042, 0.042, 0, COL.shirt)
      ], 10, { hard: true, capTop: true, capBottom: true });
    };
  }

  function hand(kind, col) {
    return b => {
      boxAt(b, [0, -0.034, 0], [0.052, 0.064, 0.026], col);
      const curl = kind === 'grip' ? 1 : kind === 'point' ? 0.8 : 0;
      [-0.018, -0.006, 0.006, 0.018].forEach((ox, i) => {
        const c = kind === 'point' && i === 0 ? 0 : curl;
        const len = 0.042 - Math.abs(i - 1.5) * 0.006;
        const mid = [ox, -0.066 - len * (1 - c * 0.5), 0.004 + c * 0.024];
        const tip = [ox, -0.066 - len * (1 - c), 0.004 + c * 0.032];
        K.tube(b, [[ox, -0.062, 0.002], mid, tip], [0.008, 0.007, 0.006], 5, col);
      });
      K.tube(b, [[0.024, -0.028, 0.01], [0.036, -0.054, 0.024 + curl * 0.01]], [0.009, 0.007], 5, col);
    };
  }

  function kafkaThigh() {
    return b => {
      loft(b, [
        ring(-KD.thigh, 0.048, 0.048, 0, [1, 1, 1, 0]),
        ring(-KD.thigh * 0.5, 0.06, 0.062, 0, [1, 1, 1, 0]),
        ring(0, 0.078, 0.078, 0, [1, 1, 1, 0])
      ], 12, { capTop: true, uv: true });
      ellAt(b, [0, -KD.thigh, 0], 0.049, 0.052, 0.05, [1, 1, 1, 0], 10, 6);
    };
  }

  function kafkaShin() {
    return b => {
      loft(b, [
        ring(-0.33, 0.035, 0.037, 0, [1, 1, 1, 0]),
        ring(-0.15, 0.047, 0.05, -0.006, [1, 1, 1, 0]),
        ring(0, 0.046, 0.046, 0, [1, 1, 1, 0])
      ], 12, { uv: true });
    };
  }

  function kafkaBoot() {
    return b => {
      loft(b, [
        ring(-KD.shin, 0.038, 0.044, 0.006, COL.boot),
        ring(-0.36, 0.044, 0.046, 0, COL.boot),
        ring(-0.31, 0.046, 0.048, 0, COL.boot),
        ring(-0.305, 0.05, 0.052, 0, COL.heel)
      ], 12, { hard: true, capBottom: true });
    };
  }

  function kafkaFoot() {
    return b => {
      const c = [0, -0.06, 0.04];
      oq(b, [[-0.03, -0.05, -0.04], [0.03, -0.05, -0.04], [0.032, -0.02, 0.06], [-0.032, -0.02, 0.06]], COL.boot, c);
      oq(b, [[-0.032, -0.02, 0.06], [0.032, -0.02, 0.06], [0.022, -0.075, 0.15], [-0.022, -0.075, 0.15]], COL.boot, c);
      oq(b, [[-0.03, -0.065, -0.04], [-0.022, -0.095, 0.15], [0.022, -0.095, 0.15], [0.03, -0.065, -0.04]], COL.heel, c);
      [-1, 1].forEach(s => {
        oq(b, [[s * 0.03, -0.05, -0.04], [s * 0.032, -0.02, 0.06], [s * 0.022, -0.075, 0.15], [s * 0.022, -0.095, 0.15]], COL.boot, c);
        ot(b, [[s * 0.03, -0.05, -0.04], [s * 0.022, -0.095, 0.15], [s * 0.03, -0.065, -0.04]], COL.boot, c);
      });
      boxAt(b, [0, -0.08, -0.03], [0.026, 0.05, 0.024], COL.heel);
      boxAt(b, [0, -0.03, -0.01], [0.064, 0.05, 0.08], COL.boot);
    };
  }

  function katana() {
    return b => {
      const sides = 8, segs = 4, r0 = 0.016;
      for (let j = 0; j < segs; j++) {
        const z0 = lerp(-0.13, 0.12, j / segs), z1 = lerp(-0.13, 0.12, (j + 1) / segs);
        for (let i = 0; i < sides; i++) {
          const a0 = (i / sides) * PI * 2, a1 = ((i + 1) / sides) * PI * 2;
          const n0 = [C(a0), S(a0), 0], n1 = [C(a1), S(a1), 0];
          b.quad([C(a0) * r0, S(a0) * r0, z0], [C(a1) * r0, S(a1) * r0, z0], [C(a1) * r0, S(a1) * r0, z1], [C(a0) * r0, S(a0) * r0, z1], [1, 1, 1, 0], [[j / segs * 2, i / sides], [j / segs * 2, (i + 1) / sides], [(j + 1) / segs * 2, (i + 1) / sides], [(j + 1) / segs * 2, i / sides]], [n0, n1, n1, n0]);
        }
      }
    };
  }

  function katanaMetal() {
    return b => {
      b.push(M4.translate(0, 0, 0.125));
      K.discXY(b, 0, 0, 0, 0.042, 12, COL.tsuba);
      K.discXY(b, 0, 0, 0.008, 0.042, 12, COL.tsuba);
      b.pop();
      boxAt(b, [0, 0, -0.135], [0.034, 0.034, 0.016], COL.tsuba);
      b.quad([0, 0.012, 0.13], [0, -0.012, 0.13], [0, -0.01, 0.84], [0, 0.014, 0.82], COL.blade);
      b.quad([0.003, 0.012, 0.13], [0.003, 0.014, 0.82], [0.003, -0.01, 0.84], [0.003, -0.012, 0.13], COL.blade);
      b.tri([0, 0.014, 0.82], [0, -0.01, 0.84], [0, 0.0, 0.88], COL.blade);
    };
  }

  function sheath() {
    return b => {
      b.push(M4.rotX(-PI / 2));
      K.tube(b, [[0, 0, 0], [0, 0.76, 0]], [0.019, 0.016], 8, COL.sheath);
      b.pop();
      [0.02, 0.2, 0.74].forEach(z => {
        b.push(M4.translate(0, 0, z), M4.rotX(-PI / 2));
        K.tube(b, [[0, 0, 0], [0, 0.025, 0]], [0.021, 0.021], 8, COL.silver);
        b.pop();
      });
    };
  }

  function smg() {
    return b => {
      boxAt(b, [0, 0.03, 0.06], [0.034, 0.06, 0.24], COL.smg);
      boxAt(b, [0, 0.065, 0.06], [0.026, 0.012, 0.2], COL.smgLight);
      boxAt(b, [0, 0.035, 0.22], [0.02, 0.022, 0.1], COL.smgLight);
      boxAt(b, [0, -0.03, 0.0], [0.028, 0.08, 0.035], COL.smg, M4.rotX(0.25));
      boxAt(b, [0, -0.04, 0.09], [0.022, 0.1, 0.03], COL.smg);
      boxAt(b, [0.018, 0.03, 0.08], [0.004, 0.02, 0.16], COL.smgAccent);
      boxAt(b, [-0.018, 0.03, 0.08], [0.004, 0.02, 0.16], COL.smgAccent);
    };
  }

  function umbrella() {
    return b => {
      K.tube(b, [[0, -0.05, 0], [0, 0.95, 0]], [0.008, 0.008], 5, COL.silver);
      K.tube(b, [[0, -0.05, 0], [0, -0.12, 0.02], [0, -0.13, 0.06], [0, -0.1, 0.08]], [0.012, 0.012, 0.012, 0.012], 5, COL.umbrella);
      const n = 8, rr = 0.58;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2, am = (a0 + a1) / 2;
        const tip = [0, 0.97, 0];
        const p0 = [S(a0) * rr, 0.72, C(a0) * rr], p1 = [S(a1) * rr, 0.72, C(a1) * rr];
        const pm = [S(am) * rr * 0.88, 0.8, C(am) * rr * 0.88];
        b.tri(tip, p0, pm, COL.umbrella);
        b.tri(tip, pm, p1, COL.umbrella);
        K.tube(b, [tip, p0], [0.004, 0.004], 3, COL.silver);
      }
    };
  }

  function coin() {
    return b => {
      b.push(M4.rotX(-PI / 2));
      K.tube(b, [[0, -0.04, 0], [0, 0.04, 0]], [0.5, 0.5], 28, [0.74, 0.72, 0.78, 0.1]);
      b.pop();
    };
  }

  function coinFace(back) {
    return b => K.discXY(b, 0, 0, back ? -0.041 : 0.041, 0.5, 28, [1, 1, 1, 0.15]);
  }

  function guardTorso() {
    return b => {
      facetLoft(b, [
        fring(-0.24, 0.17, 0.12, COL.navyDark),
        fring(-0.1, 0.165, 0.125, COL.navy, COL.navyLight),
        fring(0.06, 0.21, 0.15, COL.navy, COL.navyLight, 0.01),
        fring(0.18, 0.22, 0.14, COL.navy, COL.navyLight),
        fring(0.26, 0.12, 0.09, COL.navyDark)
      ], 7);
      facetLoft(b, [fring(0.24, 0.095, 0.085, COL.navyDark), fring(0.33, 0.09, 0.08, COL.navy, COL.navyLight)], 7);
      b.tri([-0.05, 0.26, 0.105], [0.05, 0.26, 0.105], [0, 0.0, 0.165], COL.red);
      b.tri([0, 0.0, 0.165], [-0.02, -0.08, 0.16], [0.02, -0.08, 0.16], COL.red);
      b.tri([-0.12, 0.2, 0.13], [-0.03, 0.06, 0.168], [-0.15, 0.0, 0.14], COL.navyLight);
      b.tri([0.12, 0.2, 0.13], [0.15, 0.0, 0.14], [0.03, 0.06, 0.168], COL.navyLight);
      [-1, 1].forEach(s => {
        ellAt(b, [s * 0.24, 0.17, 0], 0.13, 0.085, 0.13, s > 0 ? COL.navyLight : COL.navy, 6, 4, M4.rotZ(-s * 0.35), true);
        b.tri([s * 0.13, -0.05, 0.14], [s * 0.17, -0.18, 0.12], [s * 0.1, -0.2, 0.135], COL.red);
      });
      facetLoft(b, [fring(-0.27, 0.175, 0.13, COL.capBand), fring(-0.22, 0.175, 0.13, COL.capBand)], 7);
      boxAt(b, [0, -0.245, 0.13], [0.06, 0.04, 0.012], COL.brass);
    };
  }

  function guardPelvis() {
    return b => {
      facetLoft(b, [fring(0.1, 0.17, 0.125, COL.navyDark), fring(-0.02, 0.19, 0.14, COL.navy, COL.navyLight), fring(-0.2, 0.2, 0.15, COL.navyDark, COL.navy)], 8);
    };
  }

  function guardUpper() {
    return b => facetLoft(b, [fring(-GD.upper, 0.055, 0.055, COL.navy, COL.navyLight), fring(-0.1, 0.068, 0.068, COL.navy, COL.navyLight), fring(0.0, 0.06, 0.06, COL.navyDark)], 6);
  }

  function guardFore() {
    return b => {
      facetLoft(b, [fring(-GD.fore, 0.05, 0.05, COL.glove2), fring(-0.2, 0.07, 0.07, COL.navy, COL.navyLight), fring(-0.06, 0.072, 0.072, COL.navy, COL.navyLight), fring(0.0, 0.058, 0.058, COL.navyDark)], 6);
      facetLoft(b, [fring(-0.14, 0.075, 0.075, COL.red), fring(-0.12, 0.075, 0.075, COL.red)], 6);
    };
  }

  function guardThigh() {
    return b => facetLoft(b, [fring(-GD.thigh, 0.07, 0.072, COL.navyDark), fring(-0.2, 0.088, 0.09, COL.navy, COL.navyLight), fring(0.0, 0.1, 0.1, COL.navy)], 6);
  }

  function guardShin() {
    return b => {
      facetLoft(b, [fring(-GD.shin, 0.06, 0.065, COL.navyDark), fring(-0.2, 0.075, 0.08, COL.navy, COL.navyLight), fring(0.0, 0.07, 0.072, COL.navyDark)], 6);
      ellAt(b, [0, -0.01, 0.06], 0.07, 0.06, 0.05, COL.navyLight, 5, 3, null, true);
    };
  }

  function guardFoot() {
    return b => {
      boxAt(b, [0, -0.04, 0.05], [0.11, 0.08, 0.2], COL.navyDark);
      boxAt(b, [0, -0.075, 0.06], [0.115, 0.02, 0.21], COL.capBand);
    };
  }

  function guardHead() {
    return b => {
      ellAt(b, [0, 0, -0.005], 0.13, 0.135, 0.135, COL.navyDark, 7, 5, null, true);
      const V = [[0, -0.115, 0.108], [-0.1, 0.03, 0.104], [0.1, 0.03, 0.104], [0, 0.05, 0.124], [-0.055, -0.04, 0.12], [0.055, -0.04, 0.12]];
      b.tri(V[1], V[3], V[4], COL.visor);
      b.tri(V[3], V[2], V[5], COL.visorLight);
      b.tri(V[4], V[3], V[5], COL.visorLight);
      b.tri(V[4], V[5], V[0], COL.visor);
      b.tri(V[1], V[4], V[0], COL.visorLight);
      b.tri(V[5], V[2], V[0], COL.visor);
      b.push(M4.translate(0, 0.07, 0.0), M4.rotX(-0.12));
      b.prism(10, 0.135, 0.14, 0, 0.16, 0.165, 0.075, COL.navy, { topColor: COL.navyLight });
      b.prism(10, 0.138, 0.143, -0.002, 0.138, 0.143, 0.028, COL.capBand, { capTop: false });
      b.push(M4.translate(0, 0.0, 0.1), M4.rotX(0.28));
      b.quad([-0.12, 0, 0.0], [0.12, 0, 0.0], [0.09, 0, 0.11], [-0.09, 0, 0.11], COL.capBand);
      b.pop();
      ellAt(b, [0, 0.05, 0.155], 0.025, 0.02, 0.008, COL.brass, 6, 4);
      b.pop();
    };
  }

  function rifle() {
    return b => {
      boxAt(b, [0, 0.02, 0.12], [0.075, 0.13, 0.52], COL.rifle);
      boxAt(b, [0, 0.0, -0.3], [0.06, 0.1, 0.34], COL.rifle, M4.rotX(-0.08));
      boxAt(b, [0, 0.04, 0.58], [0.05, 0.06, 0.42], COL.rifle);
      boxAt(b, [0, 0.1, 0.18], [0.04, 0.03, 0.4], COL.brass);
      boxAt(b, [0, -0.08, 0.18], [0.05, 0.12, 0.08], COL.rifle, M4.rotX(0.2));
      boxAt(b, [0, -0.05, -0.02], [0.045, 0.1, 0.045], COL.rifle, M4.rotX(0.3));
      boxAt(b, [0, 0.04, 0.8], [0.06, 0.07, 0.04], COL.brass);
    };
  }

  function rifleGlow() {
    return b => {
      [-1, 1].forEach(s => {
        const x = s * 0.0385;
        for (let i = 0; i < 6; i++) {
          const z0 = -0.1 + i * 0.075, z1 = z0 + 0.075;
          const y0 = i % 2 ? 0.06 : 0.0, y1 = i % 2 ? 0.0 : 0.06;
          const d = V3.norm([0, y1 - y0, z1 - z0]);
          const n = [s, 0, 0];
          const side = V3.mul(V3.cross(d, n), 0.006);
          b.quad(V3.add([x, y0, z0], side), V3.sub([x, y0, z0], side), V3.sub([x, y1, z1], side), V3.add([x, y1, z1], side), COL.glow, null, [n, n, n, n]);
        }
        b.quad([x, 0.028, -0.2], [x, 0.036, -0.2], [x, 0.036, -0.1], [x, 0.028, -0.1], COL.glow);
      });
    };
  }

  function build(r) {
    const R = KD.head;
    const mk = (fn) => K.mesh(r, fn);
    const tex = (w, h, fn, o) => r.texture(w, fn, Object.assign({ height: h, clamp: true }, o));
    const eyes = {};
    ['open', 'half', 'wide', 'shut'].forEach(s => { eyes[s] = tex(512, 256, A.eyes(s)); });
    const mouths = {};
    ['smile', 'smirk', 'flat', 'talk', 'o'].forEach(s => { mouths[s] = tex(256, 128, A.mouth(s)); });
    return {
      kafka: {
        eyes,
        mouths,
        glowTex: tex(512, 256, A.eyeGlow),
        head: mk(kafkaHead(R)),
        eyePatch: mk(facePatch(R, A.EYE_PATCH, 18, 10)),
        mouthPatch: mk(facePatch(R, A.MOUTH_PATCH, 12, 8)),
        glowPatch: mk(b => headPatch(b, R, 1.01, A.EYE_PATCH[0], A.EYE_PATCH[1], A.EYE_PATCH[2], A.EYE_PATCH[3], 18, 10, [1, 1, 1, 1], [1, 1])),
        hair: mk(kafkaHair(R)),
        tail: mk(kafkaTail()),
        torso: mk(kafkaTorso()),
        coat: mk(kafkaCoat()),
        coatPlain: mk(kafkaCoatPlain()),
        decal: mk(backDecal()),
        pelvis: mk(kafkaPelvis()),
        upper: mk(kafkaUpper()),
        fore: mk(kafkaFore()),
        hand: { open: mk(hand('open', COL.glove)), grip: mk(hand('grip', COL.glove)), point: mk(hand('point', COL.glove)) },
        thigh: mk(kafkaThigh()),
        shin: mk(kafkaShin()),
        boot: mk(kafkaBoot()),
        foot: mk(kafkaFoot()),
        coatTex: r.texture(256, A.webCoat),
        shirtTex: r.texture(128, A.shirt),
        tightsTex: r.texture(128, A.tights),
        decalTex: tex(256, 256, A.backMark)
      },
      props: {
        katana: mk(katana()),
        katanaMetal: mk(katanaMetal()),
        wrapTex: r.texture(128, A.wrap, { height: 32 }),
        sheath: mk(sheath()),
        smg: mk(smg()),
        umbrella: mk(umbrella()),
        coin: mk(coin()),
        coinFront: mk(coinFace(false)),
        coinBack: mk(coinFace(true)),
        coinFaceTex: tex(256, 256, A.coinFace),
        coinBackTex: tex(256, 256, A.coinBack),
        rifle: mk(rifle()),
        rifleGlow: mk(rifleGlow())
      },
      guard: {
        torso: mk(guardTorso()),
        pelvis: mk(guardPelvis()),
        upper: mk(guardUpper()),
        fore: mk(guardFore()),
        hand: mk(hand('grip', COL.glove2)),
        thigh: mk(guardThigh()),
        shin: mk(guardShin()),
        foot: mk(guardFoot()),
        head: mk(guardHead())
      }
    };
  }

  function frameOf(pose) {
    const yaw = pose.yaw || 0;
    const roll = pose.roll || 0;
    const lean = pose.lean || 0;
    const fwd = [S(yaw) * C(lean), -S(lean), C(yaw) * C(lean)];
    const up = [S(roll) * C(yaw) + S(lean) * S(yaw) * C(roll), C(roll) * C(lean), -S(roll) * S(yaw) + S(lean) * C(yaw) * C(roll)];
    return { yaw, fwd, up };
  }

  function solveWith(pose, D, defaults) {
    const f = frameOf(pose);
    const base = pose.base || [pose.pos[0], 0, pose.pos[2]];
    const ground = pose.ground === undefined ? 0.1 : pose.ground;
    const foot = (local) => [base[0] + C(f.yaw) * local[0] + S(f.yaw) * local[2], (local[3] === undefined ? ground : local[3]), base[2] - S(f.yaw) * local[0] + C(f.yaw) * local[2]];
    const p = Object.assign({}, defaults, pose, { p: pose.pos, fwd: f.fwd, up: f.up });
    if (!pose.fLw && !pose.fL) p.fLw = foot(pose.footL || defaults.footL);
    if (!pose.fRw && !pose.fR) p.fRw = foot(pose.footR || defaults.footR);
    return Rig.solve(p, D);
  }

  const KAFKA_DEF = {
    hL: [0.2, -0.32, 0.05],
    hR: [-0.2, -0.32, 0.05],
    eL: [0.5, -0.2, -0.7],
    eR: [-0.5, -0.2, -0.7],
    kL: [0.05, 0, 1],
    kR: [-0.05, 0, 1],
    footL: [0.09, 0, 0.02],
    footR: [-0.09, 0, 0.02]
  };

  const GUARD_DEF = {
    hL: [0.26, -0.34, 0.06],
    hR: [-0.26, -0.34, 0.06],
    eL: [0.6, -0.2, -0.6],
    eR: [-0.6, -0.2, -0.6],
    kL: [0.1, 0, 1],
    kR: [-0.1, 0, 1],
    footL: [0.13, 0, 0.0],
    footR: [-0.13, 0, 0.0]
  };

  function solveKafka(pose) {
    return solveWith(pose, KD, KAFKA_DEF);
  }

  function solveGuard(pose) {
    return solveWith(Object.assign({ ground: 0.08 }, pose), GD, GUARD_DEF);
  }

  function propMatrix(origin, dir, upHint) {
    const z = V3.norm(dir);
    let x = V3.cross(upHint || [0, 1, 0], z);
    if (V3.len(x) < 1e-4) x = [1, 0, 0];
    x = V3.norm(x);
    const y = V3.cross(z, x);
    return Rig.basisM(origin, x, y, z);
  }

  function foreDir(m, s) {
    return V3.norm(V3.sub(m.pts['wrist' + s], m.pts['elbow' + s]));
  }

  function drawProps(r, V, m, pose, o) {
    const P = V.props;
    const extra = o.flat ? { flat: o.flat } : {};
    ['L', 'R'].forEach(s => {
      const kind = pose['prop' + s];
      if (!kind) return;
      const wrist = m.pts['wrist' + s];
      const dir = pose['dir' + s] || foreDir(m, s);
      const up = pose['up' + s] || M4.dir(m.chest, [0, 1, 0]);
      const at = V3.add(wrist, V3.mul(foreDir(m, s), 0.05));
      if (kind === 'smg') r.draw(P.smg, propMatrix(at, dir, up), extra);
      if (kind === 'katana') {
        const km = propMatrix(at, dir, up);
        r.draw(P.katana, km, o.flat ? extra : { texture: P.wrapTex });
        r.draw(P.katanaMetal, km, extra);
      }
      if (kind === 'sheath') r.draw(P.sheath, propMatrix(at, dir, up), extra);
      if (kind === 'rifle') {
        const rm = propMatrix(V3.add(wrist, V3.mul(dir, -0.3)), dir, up);
        r.draw(P.rifle, rm, extra);
        r.draw(P.rifleGlow, rm, o.flat ? extra : { noFog: true });
      }
      if (kind === 'umbrella') r.draw(P.umbrella, propMatrix(at, [0, 0, 1], [0, 1, 0]), extra);
    });
    if (pose.umbrella) r.draw(P.umbrella, M4.chain(M4.translate(pose.umbrella.at[0], pose.umbrella.at[1], pose.umbrella.at[2]), M4.rotY(pose.umbrella.yaw || 0), M4.rotX(pose.umbrella.tilt || 0)), extra);
    if (pose.sheathHip) {
      const at = M4.point(m.pelvis, [0.16, 0.02, 0.06]);
      const dir = M4.dir(m.pelvis, [0.08, -0.45, -0.8]);
      r.draw(P.sheath, propMatrix(at, dir, M4.dir(m.pelvis, [1, 0, 0])), extra);
    }
  }

  function drawKafka(r, V, pose, opts) {
    const o = opts || {};
    const m = solveKafka(pose);
    const k = V.kafka;
    const base = {};
    if (o.flat) base.flat = o.flat;
    if (o.alpha !== undefined) { base.alpha = o.alpha; base.blend = true; }
    if (o.tint) base.tint = o.tint;
    const d = (mesh, mm, extra) => r.draw(mesh, mm, Object.assign({}, base, extra));
    const tex = (t) => (o.flat ? {} : { texture: t });
    d(k.pelvis, m.pelvis);
    d(k.torso, m.chest, tex(k.shirtTex));
    if (!pose.noCoat) {
      d(k.coat, m.chest, tex(k.coatTex));
      d(k.coatPlain, m.chest);
      if (!o.flat) d(k.decal, m.chest, { texture: k.decalTex });
    }
    d(k.tail, m.chest);
    ['L', 'R'].forEach(s => {
      d(k.upper, m['upper' + s]);
      d(k.fore, m['fore' + s]);
      d(k.hand[pose['hand' + s] || (pose['prop' + s] ? 'grip' : 'open')], m['hand' + s]);
      d(k.thigh, m['thigh' + s], tex(k.tightsTex));
      d(k.shin, m['shin' + s], tex(k.tightsTex));
      d(k.boot, m['shin' + s]);
      d(k.foot, m['foot' + s]);
    });
    d(k.head, m.head);
    if (!o.flat) {
      d(k.eyePatch, m.head, { texture: k.eyes[pose.eyes] || k.eyes.open });
      d(k.mouthPatch, m.head, { texture: k.mouths[pose.mouth] || k.mouths.smile });
    }
    d(k.hair, m.head);
    if (pose.glow && !o.flat) r.draw(k.glowPatch, m.head, { texture: k.glowTex, additive: true, alpha: pose.glow, noFog: true });
    drawProps(r, V, m, pose, o);
    return m;
  }

  function drawGuard(r, V, pose, opts) {
    const o = opts || {};
    const m = solveGuard(pose);
    const g = V.guard;
    const base = {};
    if (o.flat) base.flat = o.flat;
    if (o.tint) base.tint = o.tint;
    const d = (mesh, mm) => r.draw(mesh, mm, base);
    d(g.pelvis, m.pelvis);
    d(g.torso, m.chest);
    ['L', 'R'].forEach(s => {
      d(g.upper, m['upper' + s]);
      d(g.fore, m['fore' + s]);
      d(g.hand, m['hand' + s]);
      d(g.thigh, m['thigh' + s]);
      d(g.shin, m['shin' + s]);
      d(g.foot, m['foot' + s]);
    });
    d(g.head, m.head);
    if (pose.rifle !== false) {
      const grip = m.pts.wristR, support = m.pts.wristL;
      const dir = pose.aimDir || V3.norm(V3.sub(support, grip));
      const at = V3.add(grip, V3.mul(dir, -0.05));
      const rm = propMatrix(at, dir, M4.dir(m.chest, [0, 1, 0]));
      r.draw(V.props.rifle, rm, base);
      r.draw(V.props.rifleGlow, rm, o.flat ? base : { noFog: true, tint: pose.glowTint || [1, 1, 1] });
    }
    return m;
  }

  function walkPose(t, rate, stride, lift) {
    const ph = t * rate;
    const a = S(ph);
    const st = stride === undefined ? 0.22 : stride;
    const up = lift === undefined ? 0.08 : lift;
    return {
      footL: [0.09, 0, a * st, 0.1 + Math.max(0, C(ph)) * up],
      footR: [-0.09, 0, -a * st, 0.1 + Math.max(0, -C(ph)) * up],
      hL: [0.2, -0.3, -a * 0.1 + 0.05],
      hR: [-0.2, -0.3, a * 0.1 + 0.05],
      bob: Math.abs(C(ph)) * 0.02
    };
  }

  function runPose(t, rate) {
    const ph = t * rate;
    const a = S(ph);
    return {
      footL: [0.09, 0, a * 0.38, 0.1 + Math.max(0, C(ph)) * 0.22],
      footR: [-0.09, 0, -a * 0.38, 0.1 + Math.max(0, -C(ph)) * 0.22],
      hL: [0.18, -0.12, -a * 0.18 + 0.1],
      hR: [-0.18, -0.12, a * 0.18 + 0.1],
      eL: [0.6, -0.3, -0.6],
      eR: [-0.6, -0.3, -0.6],
      bob: Math.abs(C(ph)) * 0.05
    };
  }

  window.KafkaCast = { KD, GD, COL, build, solveKafka, solveGuard, drawKafka, drawGuard, propMatrix, walkPose, runPose, headPt };
})();
