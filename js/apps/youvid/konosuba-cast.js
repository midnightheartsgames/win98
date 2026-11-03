(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const DIMS = {
    aqua: { hipX: 0.08, hipY: -0.04, thigh: 0.4, shin: 0.39, chestY: 0.105, neckY: 0.235, shX: 0.135, shY: 0.17, upper: 0.23, fore: 0.21, headY: 0.122, head: 0.122 },
    megumin: { hipX: 0.074, hipY: -0.038, thigh: 0.36, shin: 0.35, chestY: 0.098, neckY: 0.22, shX: 0.125, shY: 0.158, upper: 0.21, fore: 0.19, headY: 0.12, head: 0.12 },
    darkness: { hipX: 0.084, hipY: -0.04, thigh: 0.43, shin: 0.41, chestY: 0.11, neckY: 0.25, shX: 0.142, shY: 0.18, upper: 0.245, fore: 0.225, headY: 0.124, head: 0.122 },
    kazuma: { hipX: 0.086, hipY: -0.042, thigh: 0.41, shin: 0.4, chestY: 0.112, neckY: 0.25, shX: 0.155, shY: 0.178, upper: 0.24, fore: 0.22, headY: 0.126, head: 0.124 }
  };

  const CHARS = {
    aqua: {
      dim: DIMS.aqua, skin: 0xfde6da, hair: 0x9cd8f4, hairMid: 0x7cc2ec, hairTip: 0x6aa6e0, brow: 0x5a8cc4,
      eye: '#3a92e0', eyeDark: '#1a4c9c', eyeLight: '#a8e6ff', lash: '#1e2a4a',
      top: 0x2a54b0, topDark: 0x1e3c86, trim: 0xf6f8fc, gold: 0xe8c45a, sleeve: 0xf6f8fc, band: 0x2a54b0,
      skirt: 0x2a54b0, petticoat: 0xf2f0f8, boot: 0x24489c, sole: 0x1a2c5c
    },
    megumin: {
      dim: DIMS.megumin, skin: 0xfde4d8, hair: 0x4a2e2a, hairMid: 0x3c2422, hairTip: 0x301c1c, brow: 0x3a2220,
      eye: '#d82c3c', eyeDark: '#7a1020', eyeLight: '#ff9aa0', lash: '#2a1416',
      top: 0xc62a30, topDark: 0x9c1c24, trim: 0xf2a42c, gold: 0xf2a42c, sleeve: 0xc62a30, band: 0x2a2224,
      skirt: 0xc62a30, stocking: 0x26222a, bandage: 0xf4f0ea, boot: 0xe0562c, cuff: 0x5a3026, sole: 0x3a2018
    },
    darkness: {
      dim: DIMS.darkness, skin: 0xfde6da, hair: 0xfae58a, hairMid: 0xf2d470, hairTip: 0xe6c05a, brow: 0xc8a048,
      eye: '#3a86d0', eyeDark: '#1a3c7c', eyeLight: '#a6dcff', lash: '#2a2420',
      top: 0x2a282e, armor: 0xf6e8ea, armorShade: 0xe6cad2, orange: 0xf2a038, gold: 0xe8b848, ribbon: 0xc8202c,
      sleeve: 0x2a282e, glove: 0x2c2a30, leg: 0x2a282e, greave: 0xe8e2e6, sole: 0x4a464c
    },
    kazuma: {
      dim: DIMS.kazuma, male: true, skin: 0xf8dcc8, hair: 0x7a5034, hairMid: 0x684228, hairTip: 0x583620, brow: 0x5a3820,
      eye: '#3a9068', eyeDark: '#1a4a34', eyeLight: '#a6e8c6', lash: '#2a1e18',
      top: 0xf2f0ea, topDark: 0xd8d4cc, sleeve: 0xb4b6bc, cape: 0x2c7a5e, capeDark: 0x1e5a44, capeIn: 0x283a4c, gold: 0xe6b84a,
      belt: 0x6a4428, pants: 0x383c48, boot: 0x6a4428, cuff: 0x3a2a20, sole: 0x2a1c14
    }
  };

  const EYE_PATCH = [-0.95, 0.95, -0.44, 0.26];
  const MOUTH_PATCH = [-0.7, 0.7, -0.95, -0.4];

  function boxAt(b, pos, size, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.box(size[0], size[1], size[2], col);
    if (rotM) b.pop();
    b.pop();
  }

  function ellAt(b, pos, rx, ry, rz, seg, rings, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.ellipsoid(rx, ry, rz, seg, rings, col);
    if (rotM) b.pop();
    b.pop();
  }

  function hex(c) {
    return '#' + c.toString(16).padStart(6, '0');
  }

  function patchMap(patch, w, h) {
    const [y0, y1, p0, p1] = patch;
    return {
      x: (yaw) => ((yaw - y0) / (y1 - y0)) * w,
      y: (pit) => (1 - (pit - p0) / (p1 - p0)) * h,
      kx: w / (y1 - y0),
      ky: h / (p1 - p0)
    };
  }

  function headPoint(R, yaw, pit) {
    const n = [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
    const low = clamp((-pit - 0.05) / 1.25, 0, 1);
    const front = clamp(C(yaw), 0, 1);
    const back = clamp(-C(yaw), 0, 1);
    const f4 = front * front * front * front;
    const cheek = 0.05 * front * Math.exp(-((pit + 0.25) ** 2) / 0.06);
    const sx = R * 0.95 * (1 - 0.46 * Math.pow(low, 1.4) + cheek);
    const sy = R * 0.93 * (1 - 0.04 * low);
    const sz = R * 0.9 * (1 + 0.08 * f4 * low * (1 - low) * 2 - 0.12 * (1 - front) * low + 0.06 * back * (1 - low));
    return [n[0] * sx, n[1] * sy, n[2] * sz];
  }

  function headGrid(b, R, y0, y1, p0, p1, nu, nv, colAt, scale, uv) {
    const sc = scale || 1;
    const P = (u, v) => {
      const yaw = y0 + (y1 - y0) * u, pit = p0 + (p1 - p0) * v;
      const p = headPoint(R, yaw, pit);
      return [p[0] * sc, p[1] * sc, p[2] * sc];
    };
    const N = (u, v) => {
      const e = 0.01;
      let n = V3.cross(V3.sub(P(u + e, v), P(u - e, v)), V3.sub(P(u, v + e), P(u, v - e)));
      if (V3.len(n) < 1e-9) n = V3.norm(P(u, v));
      return V3.norm(n);
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const pts = [[i / nu, j / nv], [(i + 1) / nu, j / nv], [(i + 1) / nu, (j + 1) / nv], [i / nu, (j + 1) / nv]];
        const cols = pts.map(([u, v]) => (uv ? [1, 1, 1, 0] : rgb(colAt ? colAt(y0 + (y1 - y0) * u, p0 + (p1 - p0) * v) : 0xfce4d6)));
        b.quad(P(...pts[0]), P(...pts[1]), P(...pts[2]), P(...pts[3]), cols, uv ? pts : null, pts.map(([u, v]) => N(u, v)));
      }
    }
  }

  function hp(R, yaw, pit, sc) {
    const p = headPoint(R, yaw, pit);
    return [p[0] * sc, p[1] * sc, p[2] * sc];
  }

  function spline(pts, per) {
    if (pts.length < 3) {
      const out = [];
      for (let i = 0; i <= per; i++) out.push(V3.lerp(pts[0], pts[1], i / per));
      return out;
    }
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        out.push([0, 1, 2].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  function lock(b, pts, w, t, col, o) {
    const opt = o || {};
    const center = opt.center || [0, 0, 0];
    const path = spline(pts, opt.per || 4);
    const n = path.length;
    const c0 = rgb(col), c1 = rgb(opt.tip || col);
    const sides = opt.sides || 6;
    const rings = path.map((p, i) => {
      const s = i / (n - 1);
      const a = path[Math.min(n - 1, i + 1)], bq = path[Math.max(0, i - 1)];
      const T = V3.norm(V3.sub(a, bq));
      let O = opt.out ? opt.out(p, s) : V3.sub(p, center);
      O = V3.sub(O, V3.mul(T, V3.dot(O, T)));
      O = V3.len(O) < 1e-6 ? V3.norm(V3.cross(T, [1, 0, 0])) : V3.norm(O);
      const side = V3.norm(V3.cross(T, O));
      const taper = opt.blunt ? 1 - s * 0.55 : Math.pow(1 - s, opt.taper || 0.85);
      const swell = opt.swell ? 1 + opt.swell * S(PI * s) : 1;
      const wd = Math.max(0.0008, w * taper * swell * (opt.rootW !== undefined ? lerp(opt.rootW, 1, Math.min(1, s * 4)) : 1));
      const th = Math.max(0.0006, t * (1 - s * 0.6));
      const col4 = [lerp(c0[0], c1[0], s), lerp(c0[1], c1[1], s), lerp(c0[2], c1[2], s), opt.glow || 0];
      const verts = [];
      for (let k = 0; k < sides; k++) {
        const ang = (k / sides) * PI * 2;
        verts.push({
          p: V3.add(p, V3.add(V3.mul(side, C(ang) * wd), V3.mul(O, S(ang) * th))),
          n: V3.norm(V3.add(V3.mul(side, C(ang) * th), V3.mul(O, S(ang) * wd)))
        });
      }
      return { verts, col: col4 };
    });
    for (let i = 0; i < n - 1; i++) {
      const A = rings[i], B = rings[i + 1];
      for (let k = 0; k < sides; k++) {
        const k1 = (k + 1) % sides;
        b.quad(A.verts[k].p, A.verts[k1].p, B.verts[k1].p, B.verts[k].p, [A.col, A.col, B.col, B.col], null, [A.verts[k].n, A.verts[k1].n, B.verts[k1].n, B.verts[k].n]);
      }
    }
    return b;
  }

  function capGrid(b, R, sc, lowFront, lowBack, col, colAt) {
    const nu = 24, nv = 9;
    const pLow = (yaw) => lerp(lowFront, lowBack, Math.pow((1 - C(yaw)) / 2, 0.8));
    const P = (u, v) => {
      const yaw = -PI + 2 * PI * u;
      const pit = lerp(pLow(yaw), PI / 2 - 0.01, v);
      return hp(R, yaw, pit, sc);
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const q = [[i / nu, j / nv], [(i + 1) / nu, j / nv], [(i + 1) / nu, (j + 1) / nv], [i / nu, (j + 1) / nv]];
        const ps = q.map(([u, v]) => P(u, v));
        const cols = q.map(([u, v]) => rgb(colAt ? colAt(u, v) : col));
        const ns = ps.map(p => V3.norm(p));
        b.quad(ps[0], ps[1], ps[2], ps[3], cols, null, ns);
      }
    }
  }

  function bangs(b, R, cfg, list) {
    list.forEach(([yaw, len, w, curl]) => {
      const root = hp(R, yaw * 0.35, 1.05, 1.0);
      const mid = hp(R, yaw * 0.8 + curl * 0.15, 0.6, 1.09);
      const low = hp(R, yaw + curl * 0.25, lerp(0.35, 0.05, len), 1.07);
      const tip = hp(R, yaw + curl * 0.4, lerp(0.3, -0.05, len), 1.03);
      lock(b, [root, mid, low, tip], w, 0.012, cfg.hair, { tip: cfg.hairMid, taper: 1.1, rootW: 1.4 });
    });
  }

  function aquaHair(b, R, cfg) {
    capGrid(b, R, 1.05, 0.5, -0.85, cfg.hair, (u, v) => (v < 0.3 ? cfg.hairMid : cfg.hair));
    bangs(b, R, cfg, [[-0.78, 0.7, 0.04, -0.4], [-0.52, 0.85, 0.042, -0.2], [-0.24, 0.95, 0.04, 0.1], [0.04, 0.9, 0.04, 0.2], [0.3, 0.95, 0.042, 0.1], [0.56, 0.8, 0.04, 0.3], [0.8, 0.65, 0.038, 0.4]]);
    [-1, 1].forEach(s => {
      lock(b, [hp(R, s * 1.0, 0.75, 1.02), hp(R, s * 1.12, 0.1, 1.12), [s * R * 1.0, -R * 0.8, R * 0.42], [s * R * 0.98, -R * 1.9, R * 0.38], [s * R * 0.9, -R * 2.9, R * 0.46]], 0.042, 0.014, cfg.hair, { tip: cfg.hairTip, taper: 1.0 });
      lock(b, [hp(R, s * 1.35, 0.6, 1.02), hp(R, s * 1.45, -0.1, 1.1), [s * R * 1.05, -R * 0.9, R * 0.05], [s * R * 1.0, -R * 1.8, -R * 0.05]], 0.05, 0.016, cfg.hairMid, { tip: cfg.hairTip });
    });
    for (let i = 0; i < 9; i++) {
      const yaw = PI + (i - 4) * 0.28;
      lock(b, [hp(R, yaw, 0.9, 1.0), hp(R, yaw, 0.0, 1.1), hp(R, yaw, -0.7, 1.12), [S(yaw) * R * 0.8, -R * 1.7, C(yaw) * R * 0.95]], 0.06, 0.018, cfg.hair, { tip: cfg.hairMid, blunt: true });
    }
    const loopC = [R * 0.42, R * 1.05, -R * 0.12];
    const loopPts = [];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * PI * 2 - PI / 2;
      loopPts.push([loopC[0] + C(a) * R * 0.05, loopC[1] + R * 0.38 + S(a) * R * 0.42, loopC[2] + C(a) * R * 0.42]);
    }
    lock(b, loopPts, 0.034, 0.02, cfg.hair, { blunt: true, center: [loopC[0], loopC[1] + R * 0.38, loopC[2]], out: (p) => [0, p[1] - loopC[1] - R * 0.38, p[2] - loopC[2]] });
    lock(b, [[R * 0.38, R * 0.95, -R * 0.35], [R * 0.75, R * 1.15, -R * 0.75], [R * 1.05, R * 0.8, -R * 0.95], [R * 1.15, R * 0.3, -R * 0.85]], 0.03, 0.012, cfg.hairMid, { tip: cfg.hairTip });
    ellAt(b, [R * 0.38, R * 0.98, R * 0.08], 0.032, 0.032, 0.032, 10, 8, rgb(0x2a62d0, 0.15));
    ellAt(b, [R * 0.33, R * 0.9, R * 0.3], 0.014, 0.014, 0.014, 8, 6, cfg.gold);
  }

  function aquaHairBack(b, cfg) {
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * 0.042;
      const z = -0.085 - (1 - Math.abs(i - 3) / 3) * 0.035;
      lock(b, [[x * 0.8, 0.31, z + 0.01], [x, 0.12, z - 0.012], [x * 1.12, -0.12, z - 0.004], [x * 1.18, -0.36, z + 0.005], [x * 1.1, -0.52, z + 0.02]], 0.05, 0.016, cfg.hair, { tip: cfg.hairTip, center: [0, 0, 0.02], out: () => [0, 0, -1], taper: 1.2 });
    }
  }

  function meguminHair(b, R, cfg) {
    capGrid(b, R, 1.06, 0.5, -0.95, cfg.hair, (u, v) => (v < 0.35 ? cfg.hairMid : cfg.hair));
    bangs(b, R, cfg, [[-0.72, 0.85, 0.04, -0.1], [-0.46, 1.0, 0.042, 0], [-0.2, 1.0, 0.04, 0.05], [0.06, 1.0, 0.042, 0.0], [0.32, 1.0, 0.04, 0.05], [0.58, 0.95, 0.042, 0.1], [0.82, 0.8, 0.036, 0.15]]);
    [-1, 1].forEach(s => {
      lock(b, [hp(R, s * 1.02, 0.6, 1.02), hp(R, s * 1.15, 0.0, 1.1), [s * R * 0.98, -R * 0.9, R * 0.3], [s * R * 0.92, -R * 1.9, R * 0.32], [s * R * 0.86, -R * 2.6, R * 0.4]], 0.036, 0.012, cfg.hair, { tip: cfg.hairMid, taper: 1.2 });
    });
    for (let i = 0; i < 11; i++) {
      const yaw = PI + (i - 5) * 0.3;
      lock(b, [hp(R, yaw, 0.85, 1.0), hp(R, yaw, 0.0, 1.12), hp(R, yaw, -0.6, 1.16), hp(R, yaw * 1.0, -0.95, 1.12)], 0.05, 0.016, cfg.hair, { tip: cfg.hairMid, taper: 0.9 });
    }
  }

  function darknessHair(b, R, cfg) {
    capGrid(b, R, 1.05, 0.5, -0.5, cfg.hair, (u, v) => (v < 0.25 ? cfg.hairMid : cfg.hair));
    bangs(b, R, cfg, [[-0.8, 0.7, 0.04, -0.3], [-0.52, 0.85, 0.042, -0.25], [-0.26, 0.95, 0.04, -0.15], [0.0, 0.92, 0.04, 0.1], [0.28, 0.95, 0.042, 0.2], [0.55, 0.85, 0.04, 0.3], [0.8, 0.7, 0.036, 0.35]]);
    [-1, 1].forEach(s => {
      lock(b, [hp(R, s * 1.0, 0.7, 1.02), hp(R, s * 1.12, 0.05, 1.12), [s * R * 1.02, -R * 0.9, R * 0.42], [s * R * 1.0, -R * 2.0, R * 0.42], [s * R * 0.92, -R * 3.0, R * 0.5]], 0.04, 0.013, cfg.hair, { tip: cfg.hairTip, taper: 1.1 });
      lock(b, [hp(R, s * 1.4, 0.55, 1.02), hp(R, s * 1.5, -0.2, 1.1), [s * R * 1.0, -R * 1.0, -R * 0.1]], 0.05, 0.015, cfg.hairMid, { tip: cfg.hairTip });
      [0.65, -0.65].forEach(rz => boxAt(b, [s * R * 0.74, R * 0.58, R * 0.66], [0.07, 0.016, 0.012], rgb(0xd8303a, 0.2), M4.chain(M4.rotY(s * 0.75), M4.rotZ(rz))));
    });
    for (let i = 0; i < 7; i++) {
      const yaw = PI + (i - 3) * 0.32;
      lock(b, [hp(R, yaw, 0.9, 1.0), hp(R, yaw, 0.1, 1.08), hp(R, yaw, -0.45, 1.06)], 0.06, 0.016, cfg.hair, { tip: cfg.hairMid, blunt: true });
    }
    ellAt(b, [0, R * 0.62, -R * 0.92], 0.034, 0.03, 0.026, 8, 6, cfg.hairMid);
    lock(b, [[0, R * 0.7, -R * 0.95], [0, R * 0.95, -R * 1.25], [0, R * 0.55, -R * 1.6], [0, -R * 0.6, -R * 1.7], [0, -R * 1.9, -R * 1.55], [0, -R * 3.1, -R * 1.4]], 0.075, 0.03, cfg.hair, { tip: cfg.hairTip, swell: 0.3, center: [0, 0, -R * 0.5] });
  }

  function kazumaHair(b, R, cfg) {
    capGrid(b, R, 1.06, 0.55, -0.6, cfg.hair, (u, v) => (v < 0.3 ? cfg.hairMid : cfg.hair));
    [[-0.7, 0.6, 0.042, -0.6], [-0.4, 0.75, 0.045, -0.35], [-0.1, 0.8, 0.045, 0.2], [0.22, 0.78, 0.045, 0.45], [0.55, 0.65, 0.042, 0.6]].forEach(([yaw, len, w, curl]) => {
      lock(b, [hp(R, yaw * 0.4, 1.0, 1.02), hp(R, yaw * 0.8 + curl * 0.1, 0.55, 1.12), hp(R, yaw + curl * 0.35, lerp(0.4, 0.12, len), 1.09)], w, 0.014, cfg.hair, { tip: cfg.hairMid, taper: 1.0, rootW: 1.3 });
    });
    for (let i = 0; i < 12; i++) {
      const yaw = (i / 12) * PI * 2 + 0.3;
      if (C(yaw) > 0.55) continue;
      const pit = 0.35 + (i % 3) * 0.12;
      const base = hp(R, yaw, pit, 1.03);
      const out = V3.norm(base);
      const tip = V3.add(V3.add(base, V3.mul(out, R * 0.42)), [0, -R * 0.28, 0]);
      lock(b, [hp(R, yaw, pit + 0.3, 1.0), base, tip], 0.045, 0.015, cfg.hair, { tip: cfg.hairMid, taper: 1.0 });
    }
    [-1, 1].forEach(s => {
      lock(b, [hp(R, s * 1.15, 0.5, 1.02), hp(R, s * 1.25, -0.1, 1.1), hp(R, s * 1.2, -0.45, 1.08)], 0.04, 0.012, cfg.hairMid, { tip: cfg.hairTip });
    });
    lock(b, [hp(R, 0.2, 1.3, 1.0), [R * 0.05, R * 1.25, -R * 0.15], [-R * 0.1, R * 1.5, -R * 0.35], [-R * 0.05, R * 1.42, -R * 0.62]], 0.022, 0.01, cfg.hair, { tip: cfg.hairMid });
  }

  function eyeState(cfg, state, gaze, blush) {
    return (ctx, w, h) => {
      const m = patchMap(EYE_PATCH, w, h);
      ctx.fillStyle = hex(cfg.skin);
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const gx = gaze ? gaze[0] : 0, gy = gaze ? gaze[1] : 0;

      if (state === 'terror') {
        const sg = ctx.createLinearGradient(0, m.y(0.02), 0, m.y(-0.4));
        sg.addColorStop(0, 'rgba(104,84,140,0.7)');
        sg.addColorStop(1, 'rgba(104,84,140,0.0)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, w, h);
      }
      if (state === 'annoyed') {
        const vx = m.x(0.62), vy = m.y(0.2), vr = 0.07 * m.kx;
        ctx.strokeStyle = '#d0283a';
        ctx.lineWidth = 0.018 * m.kx;
        [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([qx, qy]) => {
          ctx.beginPath();
          ctx.moveTo(vx + qx * vr * 0.25, vy + qy * vr);
          ctx.quadraticCurveTo(vx + qx * vr * 0.3, vy + qy * vr * 0.3, vx + qx * vr, vy + qy * vr * 0.25);
          ctx.stroke();
        });
      }
      if (blush || (!cfg.male && state !== 'terror')) {
        [-1, 1].forEach(sd => {
          const cx = m.x(sd * 0.48), cy = m.y(-0.3);
          const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, 0.2 * m.kx);
          g.addColorStop(0, blush ? 'rgba(240,110,120,0.55)' : 'rgba(246,150,150,0.22)');
          g.addColorStop(1, 'rgba(246,150,150,0)');
          ctx.fillStyle = g;
          ctx.fillRect(cx - 0.22 * m.kx, cy - 0.15 * m.ky, 0.44 * m.kx, 0.3 * m.ky);
          if (blush) {
            ctx.strokeStyle = 'rgba(214,70,90,0.7)';
            ctx.lineWidth = 0.008 * m.kx;
            for (let k = -2; k <= 2; k++) {
              ctx.beginPath();
              ctx.moveTo(cx + k * 0.04 * m.kx - 0.02 * m.kx, cy + 0.05 * m.ky);
              ctx.lineTo(cx + k * 0.04 * m.kx + 0.02 * m.kx, cy - 0.05 * m.ky);
              ctx.stroke();
            }
          }
        });
      }

      const ey = m.y(-0.1);
      const rw = (cfg.male ? 0.2 : 0.22) * m.kx;
      const rh = (cfg.male ? 0.15 : 0.17) * m.ky;
      [-1, 1].forEach(sd => {
        const cx = m.x(sd * 0.36);
        const outer = sd;
        ctx.strokeStyle = hex(cfg.brow);
        ctx.lineWidth = 0.022 * m.ky;
        ctx.beginPath();
        const lid = state === 'half' || state === 'annoyed';
        const raised = state === 'terror' || state === 'worry' || state === 'cry';
        const by = m.y(raised ? 0.2 : lid ? 0.12 : 0.15);
        if (raised) {
          ctx.moveTo(cx - outer * rw * 0.8, by - 0.05 * m.ky);
          ctx.quadraticCurveTo(cx, by - 0.02 * m.ky, cx + outer * rw * 0.95, by + 0.04 * m.ky);
        } else if (state === 'annoyed') {
          ctx.lineWidth = 0.03 * m.ky;
          ctx.moveTo(cx - outer * rw * 0.85, by + 0.06 * m.ky);
          ctx.lineTo(cx + outer * rw * 0.95, by - 0.035 * m.ky);
        } else if (state === 'half') {
          ctx.moveTo(cx - outer * rw * 0.85, by + 0.01 * m.ky);
          ctx.lineTo(cx + outer * rw * 0.95, by - 0.005 * m.ky);
        } else {
          ctx.moveTo(cx - outer * rw * 0.85, by + 0.02 * m.ky);
          ctx.quadraticCurveTo(cx, by - 0.035 * m.ky, cx + outer * rw * 0.95, by + 0.015 * m.ky);
        }
        ctx.stroke();

        const lash = cfg.lash;
        if (state === 'cry') {
          const tg = ctx.createLinearGradient(0, ey, 0, h);
          tg.addColorStop(0, 'rgba(120,200,255,0.95)');
          tg.addColorStop(1, 'rgba(170,226,255,0.75)');
          ctx.fillStyle = tg;
          [-0.55, 0.45].forEach(k => {
            const tx = cx + outer * rw * k;
            ctx.beginPath();
            ctx.moveTo(tx - 0.035 * m.kx, ey);
            ctx.quadraticCurveTo(tx - 0.05 * m.kx, ey + (h - ey) * 0.6, tx - 0.03 * m.kx, h);
            ctx.lineTo(tx + 0.045 * m.kx, h);
            ctx.quadraticCurveTo(tx + 0.05 * m.kx, ey + (h - ey) * 0.5, tx + 0.035 * m.kx, ey);
            ctx.closePath();
            ctx.fill();
          });
          ctx.strokeStyle = lash;
          ctx.lineWidth = 0.036 * m.ky;
          ctx.beginPath();
          ctx.moveTo(cx - rw * 0.9, ey + 0.01 * m.ky);
          ctx.lineTo(cx - rw * 0.3, ey - 0.05 * m.ky);
          ctx.lineTo(cx + rw * 0.3, ey + 0.01 * m.ky);
          ctx.lineTo(cx + rw * 0.9, ey - 0.05 * m.ky);
          ctx.stroke();
          return;
        }
        if (state === 'shut' || state === 'sleep') {
          ctx.strokeStyle = lash;
          ctx.lineWidth = 0.034 * m.ky;
          ctx.beginPath();
          if (state === 'shut') {
            ctx.moveTo(cx - rw * 0.85, ey + 0.03 * m.ky);
            ctx.quadraticCurveTo(cx, ey - 0.09 * m.ky, cx + rw * 0.85, ey + 0.03 * m.ky);
          } else {
            ctx.moveTo(cx - rw * 0.85, ey - 0.01 * m.ky);
            ctx.quadraticCurveTo(cx, ey + 0.07 * m.ky, cx + rw * 0.85, ey - 0.01 * m.ky);
            ctx.lineWidth = 0.018 * m.ky;
            ctx.moveTo(cx + outer * rw * 0.85, ey - 0.01 * m.ky);
            ctx.lineTo(cx + outer * rw * 1.05, ey - 0.05 * m.ky);
          }
          ctx.stroke();
          return;
        }

        const big = state === 'wide' || state === 'terror' || state === 'shock';
        const er = big ? 1.12 : 1;
        const top = lid ? ey - rh * (state === 'annoyed' ? -0.05 : 0.05) : ey - rh * 0.95 * er;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, ey, rw * 0.9, rh * er, 0, 0, PI * 2);
        ctx.clip();
        if (lid) {
          ctx.beginPath();
          ctx.rect(cx - rw, top, rw * 2, rh * 2);
          ctx.clip();
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - rw, ey - rh * 1.3, rw * 2, rh * 2.6);
        const pScale = state === 'terror' ? 0.58 : state === 'shock' ? 0.7 : state === 'wide' ? 0.86 : 1;
        const ix = cx + gx * rw * 0.32;
        const iy = ey + gy * rh * 0.25 + rh * 0.08;
        const irx = rw * 0.6 * pScale, iry = rh * 0.86 * pScale;
        const ig = ctx.createLinearGradient(0, iy - iry, 0, iy + iry);
        ig.addColorStop(0, cfg.eyeDark);
        ig.addColorStop(0.5, cfg.eye);
        ig.addColorStop(1, cfg.eyeLight);
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.ellipse(ix, iy, irx, iry, 0, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = cfg.eyeDark;
        ctx.lineWidth = 0.012 * m.ky;
        ctx.stroke();
        ctx.fillStyle = '#16101a';
        ctx.beginPath();
        ctx.ellipse(ix, iy - iry * 0.05, irx * 0.42, iry * 0.48, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.ellipse(ix - irx * 0.35 * outer, iy - iry * 0.42, irx * 0.3, iry * 0.22, 0, 0, PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ix + irx * 0.3 * outer, iy + iry * 0.45, irx * 0.14, iry * 0.1, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(80,100,140,0.18)';
        ctx.fillRect(cx - rw, ey - rh * 1.3, rw * 2, rh * 0.5);
        ctx.restore();

        ctx.strokeStyle = lash;
        ctx.fillStyle = lash;
        ctx.lineWidth = 0.04 * m.ky;
        ctx.beginPath();
        if (lid) {
          ctx.moveTo(cx - outer * rw * 0.95, top + 0.004 * m.ky);
          ctx.lineTo(cx + outer * rw * 1.0, top - 0.005 * m.ky);
        } else {
          ctx.moveTo(cx - outer * rw * 0.9, ey - rh * 0.35 * er);
          ctx.quadraticCurveTo(cx - outer * rw * 0.2, ey - rh * 1.18 * er, cx + outer * rw * 0.95, ey - rh * 0.72 * er);
        }
        ctx.stroke();
        ctx.beginPath();
        const fx = cx + outer * rw * 0.95, fy = lid ? top : ey - rh * 0.72 * er;
        ctx.moveTo(fx, fy - 0.02 * m.ky);
        ctx.lineTo(fx + outer * 0.08 * m.kx, fy + 0.03 * m.ky);
        ctx.lineTo(fx - outer * 0.02 * m.kx, fy + 0.035 * m.ky);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 0.014 * m.ky;
        ctx.beginPath();
        ctx.moveTo(cx + outer * rw * 0.15, ey + rh * 0.95 * er);
        ctx.quadraticCurveTo(cx + outer * rw * 0.6, ey + rh * 0.85 * er, cx + outer * rw * 0.88, ey + rh * 0.4 * er);
        ctx.stroke();
        if (state === 'terror') {
          ctx.fillStyle = 'rgba(200,230,255,0.9)';
          ctx.beginPath();
          ctx.ellipse(cx + outer * rw * 0.6, ey - rh * 1.5, 0.02 * m.kx, 0.03 * m.ky, 0, 0, PI * 2);
          ctx.fill();
        }
      });
    };
  }

  function mouthState(cfg, state) {
    return (ctx, w, h) => {
      const m = patchMap(MOUTH_PATCH, w, h);
      ctx.fillStyle = hex(cfg.skin);
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const cx = m.x(0);
      const my = m.y(-0.66);
      const hw = 0.11 * m.kx;
      ctx.strokeStyle = 'rgba(176,110,96,0.7)';
      ctx.lineWidth = 0.01 * m.ky;
      ctx.beginPath();
      ctx.moveTo(cx + 0.012 * m.kx, m.y(-0.45));
      ctx.lineTo(cx, m.y(-0.49));
      ctx.stroke();
      const line = '#7a3030';
      if (state === 'scream' || state === 'open' || state === 'happy') {
        const mw = state === 'scream' ? hw * 2.8 : state === 'happy' ? hw * 0.95 : hw * 0.7;
        const mh = state === 'scream' ? 0.36 * m.ky : state === 'happy' ? 0.1 * m.ky : 0.07 * m.ky;
        ctx.fillStyle = '#8a2c34';
        ctx.beginPath();
        if (state === 'scream') {
          ctx.moveTo(cx - mw * 0.85, my - mh * 0.55);
          ctx.lineTo(cx + mw * 0.85, my - mh * 0.55);
          ctx.lineTo(cx + mw * 0.6, my + mh * 0.75);
          ctx.quadraticCurveTo(cx, my + mh * 0.95, cx - mw * 0.6, my + mh * 0.75);
        } else {
          ctx.moveTo(cx - mw, my - mh * 0.35);
          ctx.quadraticCurveTo(cx, my - mh * 0.15, cx + mw, my - mh * 0.35);
          ctx.quadraticCurveTo(cx + mw * 0.5, my + mh * 1.1, cx, my + mh * 1.1);
          ctx.quadraticCurveTo(cx - mw * 0.5, my + mh * 1.1, cx - mw, my - mh * 0.35);
        }
        ctx.closePath();
        ctx.fill();
        ctx.save();
        ctx.clip();
        if (state === 'scream') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cx - mw, my - mh * 0.6, mw * 2, mh * 0.28);
        }
        ctx.fillStyle = '#e8737a';
        ctx.beginPath();
        ctx.ellipse(cx, my + mh * 0.85, mw * 0.6, mh * 0.45, 0, 0, PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }
      if (state === 'o') {
        ctx.fillStyle = '#8a2c34';
        ctx.beginPath();
        ctx.ellipse(cx, my, hw * 0.28, 0.045 * m.ky, 0, 0, PI * 2);
        ctx.fill();
        return;
      }
      if (state === 'grit') {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = line;
        ctx.lineWidth = 0.012 * m.ky;
        ctx.beginPath();
        ctx.moveTo(cx - hw * 0.75, my - 0.02 * m.ky);
        ctx.lineTo(cx + hw * 0.75, my - 0.03 * m.ky);
        ctx.lineTo(cx + hw * 0.6, my + 0.035 * m.ky);
        ctx.lineTo(cx - hw * 0.6, my + 0.03 * m.ky);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - hw * 0.68, my + 0.005 * m.ky);
        ctx.lineTo(cx + hw * 0.68, my);
        ctx.stroke();
        return;
      }
      ctx.strokeStyle = line;
      ctx.lineWidth = 0.016 * m.ky;
      ctx.beginPath();
      if (state === 'shut') {
        ctx.moveTo(cx - hw * 0.4, my);
        ctx.lineTo(cx + hw * 0.4, my);
      } else if (state === 'smirk') {
        ctx.moveTo(cx - hw * 0.45, my + 0.008 * m.ky);
        ctx.quadraticCurveTo(cx + hw * 0.1, my + 0.012 * m.ky, cx + hw * 0.5, my - 0.02 * m.ky);
      } else if (state === 'flat') {
        ctx.moveTo(cx - hw * 0.5, my);
        ctx.quadraticCurveTo(cx - hw * 0.25, my - 0.025 * m.ky, cx, my);
        ctx.quadraticCurveTo(cx + hw * 0.25, my + 0.025 * m.ky, cx + hw * 0.5, my);
      } else if (state === 'pout') {
        ctx.moveTo(cx - hw * 0.35, my + 0.01 * m.ky);
        ctx.quadraticCurveTo(cx, my - 0.03 * m.ky, cx + hw * 0.35, my + 0.01 * m.ky);
      } else {
        ctx.moveTo(cx - hw * 0.5, my - 0.01 * m.ky);
        ctx.quadraticCurveTo(cx, my + 0.04 * m.ky, cx + hw * 0.5, my - 0.01 * m.ky);
      }
      ctx.stroke();
    };
  }

  function bands(len, list, rFn, sides) {
    const rings = [];
    list.forEach(([f, col], i) => {
      const y = -len * f;
      rings.push(ring(y, rFn(f), rFn(f) * 0.96, 0, col));
      const next = list[i + 1];
      if (next) rings.push(ring(-len * (next[0] - 0.0001), rFn(next[0]), rFn(next[0]) * 0.96, 0, col));
    });
    rings.push(ring(-len, rFn(1), rFn(1) * 0.96, 0, list[list.length - 1][1]));
    return { rings: rings.reverse(), sides: sides || 9 };
  }

  function limbMesh(r, len, list, rFn, cap) {
    return K.mesh(r, b => {
      const { rings, sides } = bands(len, list, rFn);
      loft(b, rings, sides, { capTop: true, capBottom: true });
      if (cap) ellAt(b, [0, 0, 0], rFn(0) * 1.05, rFn(0) * 1.05, rFn(0) * 1.05, 9, 6, list[0][1]);
    });
  }

  function handMesh(r, col) {
    return K.mesh(r, b => {
      ellAt(b, [0, -0.03, 0.002], 0.03, 0.036, 0.016, 9, 6, col);
      ellAt(b, [0, -0.064, 0.004], 0.028, 0.026, 0.013, 8, 5, col);
      ellAt(b, [0.026, -0.03, 0.014], 0.011, 0.024, 0.011, 6, 4, col, M4.rotZ(-0.5));
    });
  }

  function footMesh(r, col, sole, len) {
    return K.mesh(r, b => {
      const L = len || 0.15;
      loft(b, [
        ring(-0.072, 0.03, L * 0.36, L * 0.32, sole),
        ring(-0.064, 0.032, L * 0.38, L * 0.32, col),
        ring(-0.03, 0.036, L * 0.2, L * 0.12, col),
        ring(0.0, 0.034, 0.034, 0, col)
      ], 10, { capTop: true, capBottom: true, hard: true });
    });
  }

  function torsoRings(cfg, who) {
    const fem = !cfg.male;
    const shoulderW = who === 'kazuma' ? 0.15 : who === 'darkness' ? 0.13 : 0.12;
    return [
      { y: -0.105, rx: fem ? 0.112 : 0.118, rz: 0.08 },
      { y: -0.04, rx: fem ? 0.092 : 0.11, rz: 0.07 },
      { y: 0.04, rx: fem ? 0.096 : 0.118, rz: 0.074 },
      { y: 0.12, rx: fem ? 0.108 : 0.13, rz: 0.08 },
      { y: 0.19, rx: shoulderW, rz: 0.074 },
      { y: 0.225, rx: shoulderW * 0.72, rz: 0.06 },
      { y: 0.25, rx: 0.045, rz: 0.042 }
    ];
  }

  function torsoMesh(r, who, cfg) {
    const colAt = {
      aqua: (y) => (y > 0.24 ? cfg.skin : y > 0.2 ? cfg.trim : cfg.top),
      megumin: (y) => (y > 0.21 ? cfg.skin : y > 0.17 ? cfg.trim : cfg.top),
      darkness: () => cfg.top,
      kazuma: (y) => (y > 0.235 ? cfg.skin : cfg.top)
    }[who];
    return K.mesh(r, b => {
      const rs = torsoRings(cfg, who);
      loft(b, rs.map(q => ring(q.y, q.rx, q.rz, 0, colAt(q.y))), 14, { capTop: true, capBottom: true, hard: true });
      K.tube(b, [[0, 0.22, 0.004], [0, 0.31, 0.012]], [0.034, 0.032], 8, cfg.skin);
      if (who === 'aqua') {
        [-1, 1].forEach(s => ellAt(b, [s * 0.046, 0.115, 0.05], 0.054, 0.05, 0.045, 10, 8, cfg.top));
        boxAt(b, [0, 0.04, 0.075], [0.016, 0.18, 0.012], cfg.trim);
        K.tube(b, [[-0.06, 0.205, 0.06], [0, 0.18, 0.082], [0.06, 0.205, 0.06]], [0.012, 0.012, 0.012], 6, cfg.trim);
        K.tube(b, [[0, 0.255, 0.0], [0, 0.29, 0.005]], [0.042, 0.04], 10, 0x2c2c5a);
        [-1, 1].forEach(s => {
          ellAt(b, [s * 0.036, 0.205, 0.082], 0.034, 0.022, 0.012, 8, 6, rgb(0x5cd090, 0.12), M4.rotZ(s * 0.25));
          K.tube(b, [[s * 0.012, 0.198, 0.085], [s * 0.03, 0.16, 0.085], [s * 0.04, 0.14, 0.08]], [0.008, 0.007, 0.004], 5, 0x5cd090);
        });
        ellAt(b, [0, 0.202, 0.094], 0.014, 0.014, 0.01, 8, 6, rgb(0x3a7ae0, 0.3));
        boxAt(b, [0, -0.095, 0.0], [0.2, 0.02, 0.15], cfg.gold);
      } else if (who === 'megumin') {
        [-1, 1].forEach(s => ellAt(b, [s * 0.04, 0.11, 0.046], 0.044, 0.04, 0.036, 9, 7, cfg.top));
        K.tube(b, [[-0.13, 0.19, -0.01], [-0.08, 0.172, 0.068], [0, 0.15, 0.085], [0.08, 0.172, 0.068], [0.13, 0.19, -0.01]], [0.016, 0.016, 0.016, 0.016, 0.016], 6, cfg.trim);
        K.tube(b, [[0, 0.26, 0.0], [0, 0.285, 0.003]], [0.038, 0.037], 10, 0x221c20);
        boxAt(b, [0, 0.27, 0.038], [0.02, 0.016, 0.008], 0xc8ccd2);
        [0.13, 0.09, 0.05].forEach(y => {
          boxAt(b, [0, y, 0.083], [0.03, 0.005, 0.004], 0x2a1c1e, M4.rotZ(0.6));
          boxAt(b, [0, y, 0.083], [0.03, 0.005, 0.004], 0x2a1c1e, M4.rotZ(-0.6));
        });
      } else if (who === 'darkness') {
        [-1, 1].forEach(s => {
          ellAt(b, [s * 0.05, 0.11, 0.058], 0.068, 0.062, 0.056, 12, 9, cfg.orange);
          ellAt(b, [s * 0.052, 0.112, 0.064], 0.062, 0.058, 0.054, 12, 9, cfg.armor);
        });
        boxAt(b, [0, 0.08, 0.1], [0.026, 0.04, 0.012], cfg.orange, M4.rotZ(PI / 4));
        K.tube(b, [[0, 0.24, 0.0], [0, 0.3, 0.004]], [0.044, 0.04], 10, cfg.top);
        [-1, 1].forEach(s => ellAt(b, [s * 0.022, 0.235, 0.05], 0.024, 0.014, 0.01, 8, 5, rgb(cfg.ribbon, 0.15), M4.rotZ(s * 0.3)));
        K.tube(b, [[-0.006, 0.23, 0.055], [-0.014, 0.19, 0.06]], [0.006, 0.004], 5, cfg.ribbon);
        K.tube(b, [[0.006, 0.23, 0.055], [0.016, 0.19, 0.06]], [0.006, 0.004], 5, cfg.ribbon);
        loft(b, [ring(-0.105, 0.116, 0.084, 0, cfg.orange), ring(-0.03, 0.098, 0.074, 0, cfg.orange), ring(-0.02, 0.1, 0.076, 0, cfg.armor), ring(0.02, 0.1, 0.075, 0, cfg.armor)], 14, { hard: true });
        boxAt(b, [0, -0.1, 0.0], [0.24, 0.026, 0.18], 0x2a2226);
      } else if (who === 'kazuma') {
        [0.17, 0.13, 0.09].forEach(y => {
          boxAt(b, [0, y, 0.083], [0.032, 0.005, 0.004], 0x2a2420, M4.rotZ(0.6));
          boxAt(b, [0, y, 0.083], [0.032, 0.005, 0.004], 0x2a2420, M4.rotZ(-0.6));
        });
        boxAt(b, [0, -0.085, 0.0], [0.25, 0.026, 0.17], cfg.belt);
        boxAt(b, [0, -0.085, 0.084], [0.04, 0.032, 0.008], cfg.gold);
        boxAt(b, [0, -0.085, 0.088], [0.024, 0.018, 0.006], cfg.belt);
      }
    });
  }

  function pelvisMesh(r, who, cfg) {
    return K.mesh(r, b => {
      if (who === 'aqua') {
        loft(b, [ring(-0.2, 0.2, 0.17, 0, cfg.petticoat), ring(-0.185, 0.2, 0.17, 0, cfg.gold), ring(-0.168, 0.196, 0.166, 0, cfg.skirt), ring(-0.06, 0.15, 0.12, 0, cfg.skirt), ring(0.03, 0.112, 0.082, 0, cfg.skirt)], 16, { hard: true, capTop: true });
        loft(b, [ring(-0.215, 0.185, 0.155, 0, cfg.petticoat), ring(-0.19, 0.185, 0.155, 0, cfg.petticoat)], 16, {});
      } else if (who === 'megumin') {
        loft(b, [ring(-0.18, 0.17, 0.145, 0, cfg.skirt), ring(-0.05, 0.13, 0.11, 0, cfg.skirt), ring(0.02, 0.1, 0.078, 0, cfg.skirt)], 16, { hard: true, capTop: true });
        const n = 14;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2, a1 = ((i + 0.5) / n) * PI * 2, a2 = ((i + 1) / n) * PI * 2;
          const P = (a, y, k) => [S(a) * 0.172 * k, y, C(a) * 0.147 * k];
          b.tri(P(a0, -0.178, 1.01), P(a2, -0.178, 1.01), P(a1, -0.13, 0.975), rgb(cfg.trim));
        }
        loft(b, [ring(-0.18, 0.172, 0.147, 0, cfg.trim), ring(-0.168, 0.168, 0.143, 0, cfg.trim)], 16, {});
        boxAt(b, [0, 0.0, 0.0], [0.21, 0.03, 0.17], 0x262022);
        boxAt(b, [0, 0.0, 0.086], [0.042, 0.036, 0.006], 0xc8ccd4);
        boxAt(b, [0, 0.0, 0.09], [0.028, 0.022, 0.004], 0x262022);
      } else if (who === 'darkness') {
        loft(b, [ring(-0.13, 0.15, 0.12, 0, 0x2a282e), ring(0.03, 0.115, 0.088, 0, 0x2a282e)], 14, { capTop: true, capBottom: true });
        [[0, 0.1], [PI, 0.1]].forEach(([a, z]) => {
          b.push(M4.rotY(a));
          b.push(M4.translate(0, -0.02, z), M4.rotX(0.06));
          boxAt(b, [0, -0.33, 0], [0.2, 0.68, 0.012], cfg.armor);
          boxAt(b, [0, -0.33, 0.008], [0.08, 0.66, 0.008], cfg.orange);
          boxAt(b, [0, -0.67, 0.006], [0.2, 0.022, 0.014], cfg.orange);
          b.pop();
          b.pop();
        });
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.13, -0.02, 0), M4.rotZ(s * 0.06));
          boxAt(b, [0, -0.3, 0], [0.012, 0.6, 0.14], cfg.armorShade);
          b.pop();
        });
      } else {
        loft(b, [ring(-0.13, 0.145, 0.115, 0, cfg.top), ring(-0.11, 0.143, 0.113, 0, cfg.top), ring(0.03, 0.12, 0.088, 0, cfg.top)], 14, { hard: true, capTop: true });
        loft(b, [ring(-0.1, 0.11, 0.08, 0, cfg.pants), ring(0.0, 0.11, 0.08, 0, cfg.pants)], 12, { capBottom: true });
      }
    });
  }

  function capeMesh(r, who, cfg) {
    return K.mesh(r, b => {
      const isK = who === 'kazuma';
      const col = isK ? cfg.cape : 0x262024;
      const lining = isK ? cfg.capeDark : 0x5a1e24;
      const edge = isK ? cfg.gold : 0xf2a42c;
      const bottom = isK ? -0.4 : -0.62;
      const rows = [
        { y: 0.235, rx: isK ? 0.13 : 0.11, rz: 0.075 },
        { y: 0.18, rx: isK ? 0.19 : 0.16, rz: 0.1 },
        { y: 0.05, rx: isK ? 0.2 : 0.17, rz: 0.115 },
        { y: bottom * 0.5, rx: isK ? 0.21 : 0.19, rz: 0.13 },
        { y: bottom, rx: isK ? 0.23 : 0.22, rz: 0.15 }
      ];
      const n = 16, open = isK ? 0.55 : 0.75;
      for (let j = 0; j < rows.length - 1; j++) {
        const A = rows[j], B = rows[j + 1];
        for (let i = 0; i < n; i++) {
          const a0 = open + (i / n) * (2 * PI - 2 * open), a1 = open + ((i + 1) / n) * (2 * PI - 2 * open);
          const P = (q, a) => [S(a) * q.rx, q.y, C(a) * q.rz - 0.01];
          const nr = (a) => V3.norm([S(a), 0.15, C(a)]);
          b.quad(P(A, a0), P(A, a1), P(B, a1), P(B, a0), col, null, [nr(a0), nr(a1), nr(a1), nr(a0)]);
          const Pi = (q, a) => [S(a) * q.rx * 0.97, q.y, C(a) * q.rz * 0.97 - 0.01];
          b.quad(Pi(A, a1), Pi(A, a0), Pi(B, a0), Pi(B, a1), lining, null, [V3.mul(nr(a1), -1), V3.mul(nr(a0), -1), V3.mul(nr(a0), -1), V3.mul(nr(a1), -1)]);
        }
        [open, 2 * PI - open].forEach(a => {
          K.tube(b, [[S(a) * A.rx, A.y, C(a) * A.rz - 0.01], [S(a) * B.rx, B.y, C(a) * B.rz - 0.01]], [0.008, 0.008], 4, edge);
        });
      }
      const last = rows[rows.length - 1];
      const hem = [];
      for (let i = 0; i <= n; i++) {
        const a = open + (i / n) * (2 * PI - 2 * open);
        hem.push([S(a) * last.rx, last.y, C(a) * last.rz - 0.01]);
      }
      K.tube(b, hem, hem.map(() => 0.009), 4, edge);
      if (isK) {
        const col2 = cfg.capeIn;
        for (let i = 0; i < 10; i++) {
          const a0 = 0.9 + (i / 10) * (2 * PI - 1.8), a1 = 0.9 + ((i + 1) / 10) * (2 * PI - 1.8);
          const P = (a, y, k) => [S(a) * 0.07 * k, y, C(a) * 0.062 * k];
          b.quad(P(a0, 0.235, 1.3), P(a1, 0.235, 1.3), P(a1, 0.33, 1.25), P(a0, 0.33, 1.25), col2);
        }
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.07, 0.2, 0.075), M4.rotY(s * 0.4));
          boxAt(b, [0, 0, 0], [0.05, 0.11, 0.008], cfg.cape);
          boxAt(b, [0, -0.04, 0.005], [0.054, 0.012, 0.006], cfg.gold);
          b.pop();
        });
        boxAt(b, [0, 0.215, 0.09], [0.024, 0.024, 0.01], rgb(0x2a8a6a, 0.2), M4.rotZ(PI / 4));
      }
    });
  }

  function hatMesh(r) {
    return K.mesh(r, b => {
      b.push(M4.translate(0, 0.075, -0.005), M4.rotX(-0.12));
      b.prism(22, 0.29, 0.29, 0, 0.13, 0.125, 0.025, 0x3e2620, { capTop: true, capBottom: true });
      loft(b, [ring(-0.004, 0.295, 0.295, 0, 0xf2a42c), ring(0.004, 0.295, 0.295, 0, 0xf2a42c)], 22, {});
      loft(b, [ring(0.02, 0.135, 0.13, 0, 0xc8322c), ring(0.1, 0.12, 0.115, 0, 0xc8322c), ring(0.1, 0.12, 0.115, 0, 0xf2a42c), ring(0.112, 0.116, 0.112, 0, 0xf2a42c)], 16, { hard: true });
      [-0.6, 0, 0.6].forEach(a => {
        b.push(M4.rotY(a));
        ellAt(b, [0, 0.062, 0.128], 0.024, 0.024, 0.006, 10, 6, rgb(0xf2a42c, 0.2));
        boxAt(b, [0, 0.062, 0.133], [0.03, 0.006, 0.004], 0x8a2222, M4.rotZ(0.78));
        boxAt(b, [0, 0.062, 0.133], [0.03, 0.006, 0.004], 0x8a2222, M4.rotZ(-0.78));
        b.pop();
      });
      K.tube(b, [[0, 0.11, 0], [0.0, 0.2, -0.01], [0.01, 0.28, -0.04], [0.05, 0.33, -0.1], [0.11, 0.33, -0.15]], [0.116, 0.08, 0.05, 0.026, 0.006], 14, 0x3e2620);
      K.tube(b, [[0.12, 0.05, 0.02], [0.17, 0.0, 0.02], [0.2, -0.06, 0.03]], [0.004, 0.004, 0.004], 4, 0x3a2a20);
      ellAt(b, [0.2, -0.085, 0.03], 0.018, 0.03, 0.01, 8, 6, rgb(0xf6c03a, 0.35));
      ellAt(b, [0.2, -0.09, 0.035], 0.01, 0.018, 0.008, 6, 5, rgb(0xf27a2a, 0.35));
      b.pop();
    });
  }

  function darknessShoulders(r, cfg) {
    return {
      pauldron: K.mesh(r, b => {
        ellAt(b, [0, 0.0, 0], 0.07, 0.05, 0.065, 10, 7, cfg.armor);
        ellAt(b, [0, -0.04, 0], 0.074, 0.03, 0.068, 10, 5, cfg.armorShade);
      }),
      wing: K.mesh(r, b => {
        [[0, 0.11, 0.0], [0.02, 0.085, 0.4], [0.04, 0.06, 0.8]].forEach(([dz, len, rz]) => {
          b.push(M4.translate(0, 0.02, -0.02 - dz), M4.rotZ(-0.2 - rz), M4.rotY(-0.3));
          ellAt(b, [len * 0.5, 0, 0], len * 0.55, 0.022, 0.008, 8, 5, rgb(0xfaf6f4, 0.2));
          b.pop();
        });
      })
    };
  }

  function limbSet(r, who, cfg) {
    const D = cfg.dim;
    const up = (f) => lerp(0.037, 0.031, f);
    const fo = (f) => lerp(0.031, 0.025, f) + (f > 0.85 ? 0.004 : 0);
    const th = (f) => lerp(0.066, 0.046, f);
    const sh = (f) => 0.046 - 0.012 * f + 0.008 * S(PI * Math.min(1, f * 1.6)) * (f < 0.6 ? 1 : 0);
    let L = {};
    if (who === 'aqua') {
      const legs = [[0, cfg.skin], [0.42, cfg.trim], [0.52, cfg.boot]];
      L = {
        upperL: limbMesh(r, D.upper, [[0, cfg.skin], [0.34, cfg.sleeve]], up, true),
        foreL: limbMesh(r, D.fore, [[0, cfg.sleeve], [0.18, cfg.band], [0.26, cfg.sleeve], [0.82, cfg.band], [0.92, cfg.gold]], (f) => fo(f) + f * 0.008),
        thighL: limbMesh(r, D.thigh, legs, th, true),
        shinL: limbMesh(r, D.shin, [[0, cfg.boot]], sh),
        foot: footMesh(r, cfg.boot, cfg.sole, 0.14),
        hand: handMesh(r, cfg.skin)
      };
    } else if (who === 'megumin') {
      L = {
        upperL: limbMesh(r, D.upper, [[0, cfg.skin], [0.22, cfg.sleeve]], up, true),
        foreL: limbMesh(r, D.fore, [[0, cfg.sleeve], [0.86, cfg.trim]], (f) => fo(f) + f * 0.006),
        thighL: limbMesh(r, D.thigh, [[0, cfg.skin], [0.32, cfg.stocking]], th, true),
        thighR: limbMesh(r, D.thigh, [[0, cfg.skin], [0.3, cfg.bandage], [0.4, cfg.skin], [0.46, cfg.bandage], [0.6, cfg.skin], [0.66, cfg.bandage]], th, true),
        shinL: limbMesh(r, D.shin, [[0, cfg.stocking], [0.48, cfg.cuff], [0.56, cfg.boot]], sh),
        shinR: limbMesh(r, D.shin, [[0, cfg.bandage], [0.48, cfg.cuff], [0.56, cfg.boot]], sh),
        foot: footMesh(r, cfg.boot, cfg.sole, 0.13),
        hand: handMesh(r, cfg.skin)
      };
    } else if (who === 'darkness') {
      L = {
        upperL: limbMesh(r, D.upper, [[0, cfg.sleeve]], up, true),
        foreL: limbMesh(r, D.fore, [[0, cfg.sleeve], [0.12, cfg.orange], [0.3, cfg.armor], [0.38, cfg.orange], [0.62, cfg.armor], [0.7, cfg.orange]], (f) => fo(f) + 0.008),
        thighL: limbMesh(r, D.thigh, [[0, cfg.leg]], th, true),
        shinL: limbMesh(r, D.shin, [[0, cfg.leg], [0.25, cfg.greave]], (f) => sh(f) + 0.004),
        foot: footMesh(r, cfg.greave, cfg.sole, 0.15),
        hand: handMesh(r, cfg.glove)
      };
    } else {
      L = {
        upperL: limbMesh(r, D.upper, [[0, cfg.sleeve]], (f) => up(f) + 0.004, true),
        foreL: limbMesh(r, D.fore, [[0, cfg.sleeve], [0.88, cfg.topDark]], (f) => fo(f) + 0.003),
        thighL: limbMesh(r, D.thigh, [[0, cfg.pants]], (f) => th(f) + 0.004, true),
        shinL: limbMesh(r, D.shin, [[0, cfg.pants], [0.4, cfg.cuff], [0.48, cfg.boot]], (f) => sh(f) + 0.004),
        foot: footMesh(r, cfg.boot, cfg.sole, 0.16),
        hand: handMesh(r, cfg.skin)
      };
    }
    L.upperR = L.upperR || L.upperL;
    L.foreR = L.foreR || L.foreL;
    L.thighR = L.thighR || L.thighL;
    L.shinR = L.shinR || L.shinL;
    return L;
  }

  function buildChar(r, who, cfg) {
    const R = cfg.dim.head;
    const eyes = new Map(), mouths = new Map();
    const hair = {
      aqua: (b) => aquaHair(b, R, cfg),
      megumin: (b) => meguminHair(b, R, cfg),
      darkness: (b) => darknessHair(b, R, cfg),
      kazuma: (b) => kazumaHair(b, R, cfg)
    }[who];
    const out = {
      cfg,
      eyeTex(state, gaze, blush) {
        const g = gaze ? [Math.round(gaze[0] * 4) / 4, Math.round(gaze[1] * 4) / 4] : [0, 0];
        const key = state + ':' + g.join(',') + ':' + (blush ? 1 : 0);
        if (!eyes.has(key)) eyes.set(key, r.texture(512, eyeState(cfg, state, g, blush), { height: 256, clamp: true }));
        return eyes.get(key);
      },
      mouthTex(state) {
        if (!mouths.has(state)) mouths.set(state, r.texture(256, mouthState(cfg, state), { height: 256, clamp: true }));
        return mouths.get(state);
      },
      mHead: K.mesh(r, b => headGrid(b, R, -PI, PI, -PI / 2 + 0.02, PI / 2 - 0.02, 24, 16, (yaw, pit) => (pit > 0.4 || Math.abs(yaw) > 1.5 ? cfg.hair : cfg.skin))),
      mEyePatch: K.mesh(r, b => headGrid(b, R, EYE_PATCH[0], EYE_PATCH[1], EYE_PATCH[2], EYE_PATCH[3], 16, 8, null, 1.004, true)),
      mMouthPatch: K.mesh(r, b => headGrid(b, R, MOUTH_PATCH[0], MOUTH_PATCH[1], MOUTH_PATCH[2], MOUTH_PATCH[3], 12, 8, null, 1.004, true)),
      mHair: K.mesh(r, hair),
      mHairBack: who === 'aqua' ? K.mesh(r, b => aquaHairBack(b, cfg)) : null,
      mHat: who === 'megumin' ? hatMesh(r) : null,
      mTorso: torsoMesh(r, who, cfg),
      mPelvis: pelvisMesh(r, who, cfg),
      mCape: who === 'kazuma' || who === 'megumin' ? capeMesh(r, who, cfg) : null,
      extras: who === 'darkness' ? darknessShoulders(r, cfg) : null,
      limbs: limbSet(r, who, cfg)
    };
    return out;
  }

  function build(r) {
    const chars = {};
    Object.keys(CHARS).forEach(k => {
      chars[k] = buildChar(r, k, CHARS[k]);
    });
    return { chars };
  }

  function legLength(who) {
    const D = (CHARS[who] || CHARS.aqua).dim;
    return D.thigh + D.shin;
  }

  function standY(who, bend) {
    const D = (CHARS[who] || CHARS.aqua).dim;
    return 0.07 + (D.thigh + D.shin) * (bend || 0.995) - D.hipY;
  }

  function standLegs(who, spread, bend) {
    const D = (CHARS[who] || CHARS.aqua).dim;
    const L = (D.thigh + D.shin) * (bend || 0.995);
    const w = spread === undefined ? 0.075 : spread;
    return {
      fL: [w, D.hipY - L, 0.01],
      kL: [0.04, 0, 1],
      fR: [-w, D.hipY - L, 0.01],
      kR: [-0.04, 0, 1]
    };
  }

  function solve(who, pose) {
    const cfg = CHARS[who] || CHARS.aqua;
    const yaw = pose.yaw || 0;
    const lean = pose.lean || 0;
    const roll = pose.roll || 0;
    const cy = C(yaw), sy = S(yaw);
    const fwd = pose.fwd || [sy, 0, cy];
    const up = pose.up || V3.norm([S(roll) * cy + sy * lean, C(roll), -S(roll) * sy + cy * lean]);
    return Rig.solve(Object.assign({}, pose, { p: pose.pos || [0, standY(who), 0], fwd, up }), cfg.dim);
  }

  function drawChar(r, V, who, m, pose) {
    const P = V.chars[who] || V.chars.aqua;
    const L = P.limbs;
    r.draw(P.mPelvis, m.pelvis);
    r.draw(P.mTorso, m.chest);
    if (P.mCape && (who === 'kazuma' || pose.cloak)) r.draw(P.mCape, m.chest);
    if (P.mHairBack) r.draw(P.mHairBack, m.chest);
    r.draw(L.upperL, m.upperL);
    r.draw(L.upperR, m.upperR);
    r.draw(L.foreL, m.foreL);
    r.draw(L.foreR, m.foreR);
    r.draw(L.hand, m.handL);
    r.draw(L.hand, M4.mul(m.handR, M4.scale(-1, 1, 1)));
    r.draw(L.thighL, m.thighL);
    r.draw(L.thighR, m.thighR);
    r.draw(L.shinL, m.shinL);
    r.draw(L.shinR, m.shinR);
    r.draw(L.foot, m.footL);
    r.draw(L.foot, m.footR);
    if (P.extras) {
      r.draw(P.extras.pauldron, M4.chain(m.chest, M4.translate(0.15, 0.2, -0.005), M4.rotZ(-0.35)));
      r.draw(P.extras.wing, M4.chain(m.chest, M4.translate(-0.15, 0.2, -0.01), M4.rotY(PI)));
    }
    r.draw(P.mHead, m.head);
    r.draw(P.mEyePatch, m.head, { texture: P.eyeTex(pose.eyes || 'open', pose.gaze, pose.blush) });
    r.draw(P.mMouthPatch, m.head, { texture: P.mouthTex(pose.mouth || 'smile') });
    r.draw(P.mHair, m.head);
    if (P.mHat && pose.hat) r.draw(P.mHat, m.head);
  }

  window.KonosubaCast = {
    CHARS, DIMS, build, solve, drawChar, standY, standLegs, legLength,
    EYE_PATCH, MOUTH_PATCH, boxAt, ellAt, hex, headGrid, hp, lock, capGrid, bangs, eyeState, mouthState, limbMesh, handMesh, footMesh
  };
})();
