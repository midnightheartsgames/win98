(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const DIMS = {
    nagatoro: { hipX: 0.075, hipY: -0.04, thigh: 0.39, shin: 0.37, chestY: 0.1, neckY: 0.225, shX: 0.128, shY: 0.165, upper: 0.225, fore: 0.2, headY: 0.125, head: 0.124 },
    senpai: { hipX: 0.085, hipY: -0.042, thigh: 0.43, shin: 0.42, chestY: 0.112, neckY: 0.255, shX: 0.15, shY: 0.18, upper: 0.25, fore: 0.225, headY: 0.13, head: 0.126 },
    gamo: { hipX: 0.072, hipY: -0.038, thigh: 0.37, shin: 0.355, chestY: 0.096, neckY: 0.215, shX: 0.124, shY: 0.16, upper: 0.215, fore: 0.192, headY: 0.122, head: 0.122 },
    yoshi: { hipX: 0.076, hipY: -0.04, thigh: 0.4, shin: 0.38, chestY: 0.102, neckY: 0.228, shX: 0.13, shY: 0.168, upper: 0.228, fore: 0.204, headY: 0.125, head: 0.123 },
    sakura: { hipX: 0.074, hipY: -0.04, thigh: 0.385, shin: 0.37, chestY: 0.1, neckY: 0.222, shX: 0.127, shY: 0.164, upper: 0.222, fore: 0.2, headY: 0.124, head: 0.122 }
  };

  const CHARS = {
    nagatoro: {
      dim: DIMS.nagatoro, skin: 0xc98a5e, hair: 0x262433, hairHi: 0x3c3a52, brow: '#1c1820', lash: '#000000',
      eye: '#b8424a', eyeDark: '#4a1018', eyeLight: '#f0a090', shirt: 0xf6f6f2, shirtShade: 0xe4e4ea, skirt: 0x2c3866,
      sock: 0xf4f4f4, shoe: 0xf0f0f2, sole: 0xc4c4cc, clip: 0xf0f0f6, fang: true, female: true
    },
    senpai: {
      dim: DIMS.senpai, skin: 0xf4e0cc, hair: 0x1e1d24, hairHi: 0x34323e, brow: '#16141a', lash: '#000000',
      eye: '#4a4450', eyeDark: '#141218', eyeLight: '#8a8494', shirt: 0xf6f6f6, shirtShade: 0xe2e4ea, pants: 0x262830,
      shoe: 0x1c1c22, sole: 0x101014, belt: 0x2a2220, glasses: 0x060608, male: true
    },
    gamo: {
      dim: DIMS.gamo, skin: 0xc4855a, hair: 0x8a5a34, hairHi: 0xa87448, brow: '#4a2a18', lash: '#000000',
      eye: '#a83a34', eyeDark: '#401010', eyeLight: '#f09a84', shirt: 0xf6f6f2, shirtShade: 0xe4e4ea, skirt: 0x2c3866,
      sock: 0xf4f4f4, shoe: 0x5a3a28, sole: 0x2a1a12, clip: 0xf04a7a, fang: true, female: true
    },
    yoshi: {
      dim: DIMS.yoshi, skin: 0xc4855a, hair: 0x5a3020, hairHi: 0x74402c, brow: '#2a160e', lash: '#000000',
      eye: '#8a3a2a', eyeDark: '#301008', eyeLight: '#e8907a', shirt: 0xf6f6f2, shirtShade: 0xe4e4ea, skirt: 0x2c3866,
      sock: 0xf4f4f4, shoe: 0x5a3a28, sole: 0x2a1a12, clip: 0xf0c040, fang: true, female: true
    },
    sakura: {
      dim: DIMS.sakura, skin: 0xf6dccc, hair: 0xe2bc98, hairHi: 0xf2d4b4, brow: '#a07858', lash: '#000000',
      eye: '#8a5a7a', eyeDark: '#3a1a30', eyeLight: '#e0a8c8', shirt: 0xf6f6f2, shirtShade: 0xe4e4ea, skirt: 0x2c3866,
      sock: 0xf4f4f4, shoe: 0x5a3a28, sole: 0x2a1a12, clip: 0xf0a0c0, female: true
    }
  };

  const FACE = [-1.25, 1.25, -1.25, 0.6];
  const FACE_W = 512;
  const FACE_H = 384;

  function hex(c) {
    return '#' + c.toString(16).padStart(6, '0');
  }

  function fmap(w, h) {
    const [y0, y1, p0, p1] = FACE;
    return {
      x: (yaw) => ((yaw - y0) / (y1 - y0)) * w,
      y: (pit) => (1 - (pit - p0) / (p1 - p0)) * h,
      kx: w / (y1 - y0),
      ky: h / (p1 - p0)
    };
  }

  function headPoint(R, yaw, pit) {
    const front = clamp(C(yaw), 0, 1);
    const t = clamp((-pit - 0.2) / 1.15, 0, 1);
    const jaw = t * t * (3 - 2 * t);
    const sx = R * (0.94 - 0.5 * jaw * (0.45 + 0.55 * front));
    const sy = R * (0.95 + 0.16 * jaw * front);
    const sz = R * (0.9 + 0.06 * front * (1 - jaw) - 0.16 * (1 - front) * jaw + 0.05 * clamp(-C(yaw), 0, 1) * (1 - jaw));
    return [S(yaw) * C(pit) * sx, S(pit) * sy, C(yaw) * C(pit) * sz];
  }

  function hp(R, yaw, pit, sc) {
    const p = headPoint(R, yaw, pit);
    const k = sc || 1;
    return [p[0] * k, p[1] * k, p[2] * k];
  }

  function headGrid(b, R, y0, y1, p0, p1, nu, nv, col, sc, uv) {
    const P = (u, v) => hp(R, y0 + (y1 - y0) * u, p0 + (p1 - p0) * v, sc);
    const N = (u, v) => {
      const e = 0.01;
      let n = V3.cross(V3.sub(P(u + e, v), P(u - e, v)), V3.sub(P(u, v + e), P(u, v - e)));
      if (V3.len(n) < 1e-9) n = V3.norm(P(u, v));
      return V3.norm(n);
    };
    const c = uv ? [1, 1, 1, 0] : rgb(col);
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const q = [[i / nu, j / nv], [(i + 1) / nu, j / nv], [(i + 1) / nu, (j + 1) / nv], [i / nu, (j + 1) / nv]];
        b.quad(P(...q[0]), P(...q[1]), P(...q[2]), P(...q[3]), c, uv ? q : null, q.map(([u, v]) => N(u, v)));
      }
    }
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
    const path = spline(pts, opt.per || 4);
    const n = path.length;
    const c0 = rgb(col), c1 = rgb(opt.tip || col);
    const sides = opt.sides || 6;
    const center = opt.center || [0, 0, 0];
    const rings = path.map((p, i) => {
      const s = i / (n - 1);
      const T = V3.norm(V3.sub(path[Math.min(n - 1, i + 1)], path[Math.max(0, i - 1)]));
      let O = opt.out ? opt.out(p, s) : V3.sub(p, center);
      O = V3.sub(O, V3.mul(T, V3.dot(O, T)));
      O = V3.len(O) < 1e-6 ? V3.norm(V3.cross(T, [1, 0, 0])) : V3.norm(O);
      const side = V3.norm(V3.cross(T, O));
      const taper = opt.blunt ? 1 - s * 0.5 : Math.pow(1 - s, opt.taper || 0.85);
      const swell = opt.swell ? 1 + opt.swell * S(PI * s) : 1;
      const root = opt.rootW !== undefined ? lerp(opt.rootW, 1, Math.min(1, s * 4)) : 1;
      const wd = Math.max(0.0008, w * taper * swell * root);
      const th = Math.max(0.0006, t * (1 - s * 0.6));
      const cc = [lerp(c0[0], c1[0], s), lerp(c0[1], c1[1], s), lerp(c0[2], c1[2], s), opt.glow || 0];
      const verts = [];
      for (let k = 0; k < sides; k++) {
        const ang = (k / sides) * PI * 2;
        verts.push({
          p: V3.add(p, V3.add(V3.mul(side, C(ang) * wd), V3.mul(O, S(ang) * th))),
          n: V3.norm(V3.add(V3.mul(side, C(ang) * th), V3.mul(O, S(ang) * wd)))
        });
      }
      return { verts, col: cc };
    });
    for (let i = 0; i < n - 1; i++) {
      const A = rings[i], B = rings[i + 1];
      for (let k = 0; k < sides; k++) {
        const k1 = (k + 1) % sides;
        b.quad(A.verts[k].p, A.verts[k1].p, B.verts[k1].p, B.verts[k].p, [A.col, A.col, B.col, B.col], null, [A.verts[k].n, A.verts[k1].n, B.verts[k1].n, B.verts[k].n]);
      }
    }
  }

  function capGrid(b, R, sc, lowFront, lowBack, col, gap) {
    const nu = 28, nv = 9;
    const g = gap || 0;
    const pLow = (yaw) => lerp(lowFront, lowBack, Math.pow((1 - C(yaw)) / 2, 0.8));
    const P = (u, v) => {
      const yaw = -PI + 2 * PI * u;
      return hp(R, yaw, lerp(pLow(yaw), PI / 2 - 0.02, v), sc + g * S(PI * v));
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const q = [[i / nu, j / nv], [(i + 1) / nu, j / nv], [(i + 1) / nu, (j + 1) / nv], [i / nu, (j + 1) / nv]];
        const ps = q.map(([u, v]) => P(u, v));
        b.quad(ps[0], ps[1], ps[2], ps[3], col, null, ps.map(p => V3.norm(p)));
      }
    }
  }

  function ellAt(b, pos, rx, ry, rz, seg, rings, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.ellipsoid(rx, ry, rz, seg, rings, col);
    if (rotM) b.pop();
    b.pop();
  }

  function boxAt(b, pos, size, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.box(size[0], size[1], size[2], col);
    if (rotM) b.pop();
    b.pop();
  }

  function bangs(b, R, cfg, list, sc) {
    const k = sc || 1;
    list.forEach(([yaw, len, w, curl, rootPit]) => {
      const root = hp(R, yaw * 0.3, rootPit || 1.12, 1.0 * k);
      const mid = hp(R, yaw * 0.8 + curl * 0.12, 0.62, 1.085 * k);
      const low = hp(R, yaw + curl * 0.22, lerp(0.4, 0.04, len), 1.07 * k);
      const tip = hp(R, yaw + curl * 0.36, lerp(0.34, -0.14, len), 1.04 * k);
      lock(b, [root, mid, low, tip], w * 1.35, 0.008, cfg.hair, { tip: cfg.hair, taper: 1.15, rootW: 1.3, out: (p) => p });
    });
  }

  function hairNagatoro(b, R, cfg) {
    capGrid(b, R, 1.055, 0.55, -1.0, cfg.hair);
    bangs(b, R, cfg, [
      [-0.86, 0.75, 0.034, -0.3], [-0.62, 0.95, 0.04, -0.2], [-0.4, 1.0, 0.04, -0.12], [-0.2, 0.98, 0.034, -0.05],
      [-0.04, 1.06, 0.03, 0.02], [0.12, 0.95, 0.036, 0.08], [0.3, 1.02, 0.04, 0.14], [0.5, 0.96, 0.04, 0.2],
      [0.7, 0.86, 0.038, 0.28], [0.9, 0.7, 0.032, 0.36]
    ]);
    lock(b, [hp(R, -1.0, 0.7, 1.03), hp(R, -1.22, 0.15, 1.1), hp(R, -1.45, -0.35, 1.12), [-R * 1.0, -R * 1.2, -R * 0.15], [-R * 0.95, -R * 2.3, -R * 0.2]], 0.05, 0.016, cfg.hair, { taper: 1.1 });
    lock(b, [hp(R, 1.0, 0.75, 1.03), hp(R, 1.12, 0.1, 1.12), [R * 1.02, -R * 0.75, R * 0.38], [R * 0.98, -R * 1.9, R * 0.36], [R * 0.9, -R * 3.0, R * 0.42]], 0.05, 0.016, cfg.hair, { taper: 1.05 });
    lock(b, [hp(R, 1.25, 0.6, 1.03), hp(R, 1.38, -0.1, 1.12), [R * 1.05, -R * 0.9, R * 0.12], [R * 1.0, -R * 2.2, R * 0.08]], 0.055, 0.016, cfg.hair, { taper: 1.0 });
    lock(b, [hp(R, -0.98, 0.68, 1.03), hp(R, -1.1, 0.08, 1.11), [-R * 1.0, -R * 0.7, R * 0.3], [-R * 0.96, -R * 1.5, R * 0.3]], 0.034, 0.012, cfg.hair, { taper: 1.2 });
    for (let i = 0; i < 9; i++) {
      const yaw = PI + (i - 4) * 0.3;
      lock(b, [hp(R, yaw, 0.85, 1.0), hp(R, yaw, 0.0, 1.1), hp(R, yaw, -0.75, 1.12), [S(yaw) * R * 0.85, -R * 1.5, C(yaw) * R * 1.0]], 0.06, 0.018, cfg.hair, { blunt: true });
    }
    [0, 1].forEach(i => boxAt(b, hp(R, -0.72 - i * 0.12, 0.52 - i * 0.02, 1.1), [0.006, 0.042, 0.005], cfg.clip, M4.chain(M4.rotY(-0.75), M4.rotZ(-0.12))));
  }

  function hairNagatoroBack(b, cfg) {
    for (let i = 0; i < 9; i++) {
      const x = (i - 4) * 0.034;
      const z = -0.07 - (1 - Math.abs(i - 4) / 4) * 0.03;
      lock(b, [[x * 0.8, 0.34, z + 0.01], [x, 0.16, z - 0.014], [x * 1.12, -0.06, z - 0.006], [x * 1.16, -0.26, z + 0.004], [x * 1.08, -0.4, z + 0.016]], 0.046, 0.016, cfg.hair, { center: [0, 0, 0.02], out: () => [0, 0, -1], taper: 1.25 });
    }
  }

  function hairSenpai(b, R, cfg) {
    capGrid(b, R, 1.06, 0.5, -0.7, cfg.hair, 0.04);
    [[-0.9, 0.62, 0.04, -0.5], [-0.62, 0.8, 0.045, -0.3], [-0.36, 0.88, 0.046, -0.1], [-0.1, 0.92, 0.046, 0.1], [0.16, 0.9, 0.046, 0.25], [0.42, 0.84, 0.045, 0.4], [0.7, 0.7, 0.042, 0.55], [0.95, 0.55, 0.038, 0.6]].forEach(([yaw, len, w, curl]) => {
      lock(b, [hp(R, yaw * 0.4, 1.05, 1.03), hp(R, yaw * 0.85 + curl * 0.1, 0.55, 1.13), hp(R, yaw + curl * 0.3, lerp(0.38, 0.06, len), 1.1), hp(R, yaw + curl * 0.42, lerp(0.32, -0.02, len), 1.07)], w, 0.015, cfg.hair, { taper: 1.0, rootW: 1.4 });
    });
    for (let i = 0; i < 14; i++) {
      const yaw = (i / 14) * PI * 2 + 0.2;
      if (C(yaw) > 0.5) continue;
      const pit = 0.2 + (i % 3) * 0.16;
      const base = hp(R, yaw, pit, 1.05);
      const out = V3.norm(base);
      const tip = V3.add(V3.add(base, V3.mul(out, R * 0.3)), [0, -R * 0.32, 0]);
      lock(b, [hp(R, yaw, pit + 0.32, 1.02), base, tip], 0.05, 0.016, cfg.hair, { taper: 1.0 });
    }
    [-1, 1].forEach(s => {
      lock(b, [hp(R, s * 1.2, 0.5, 1.03), hp(R, s * 1.32, -0.15, 1.1), hp(R, s * 1.28, -0.5, 1.07)], 0.044, 0.013, cfg.hair, { taper: 1.0 });
    });
    lock(b, [hp(R, 0.3, 1.35, 1.0), [R * 0.12, R * 1.22, -R * 0.1], [-R * 0.05, R * 1.42, -R * 0.32]], 0.02, 0.009, cfg.hair, {});
  }

  function hairGamo(b, R, cfg) {
    capGrid(b, R, 1.055, 0.55, -0.6, cfg.hair);
    bangs(b, R, cfg, [[-0.8, 0.7, 0.04, -0.2], [-0.5, 0.9, 0.044, -0.1], [-0.2, 0.95, 0.044, 0], [0.1, 0.92, 0.044, 0.1], [0.4, 0.9, 0.044, 0.15], [0.7, 0.75, 0.04, 0.25]]);
    [-1, 1].forEach(s => {
      const root = [s * R * 0.92, R * 0.55, -R * 0.2];
      ellAt(b, root, 0.026, 0.026, 0.026, 8, 6, cfg.clip);
      for (let k = 0; k < 2; k++) {
        lock(b, [root, [s * R * (1.18 + k * 0.06), R * (0.45 - k * 0.08), -R * (0.32 + k * 0.06)], [s * R * (1.3 + k * 0.06), R * (0.05 - k * 0.1), -R * (0.36 + k * 0.06)], [s * R * (1.26 + k * 0.04), -R * (0.38 + k * 0.08), -R * 0.32]], 0.032, 0.016, cfg.hair, { taper: 0.9 });
      }
      lock(b, [hp(R, s * 1.05, 0.55, 1.03), hp(R, s * 1.15, -0.05, 1.1), hp(R, s * 1.1, -0.55, 1.08)], 0.04, 0.012, cfg.hair, { taper: 1.1 });
    });
    for (let i = 0; i < 9; i++) {
      const yaw = PI + (i - 4) * 0.32;
      lock(b, [hp(R, yaw, 0.8, 1.0), hp(R, yaw, 0.0, 1.08), hp(R, yaw, -0.55, 1.06)], 0.06, 0.016, cfg.hair, { blunt: true });
    }
  }

  function hairYoshi(b, R, cfg) {
    capGrid(b, R, 1.055, 0.55, -1.0, cfg.hair);
    bangs(b, R, cfg, [[-0.85, 0.85, 0.04, -0.4], [-0.6, 1.0, 0.044, -0.3], [-0.36, 1.05, 0.044, -0.25], [-0.12, 1.0, 0.04, -0.2], [0.14, 0.9, 0.044, 0.3], [0.42, 0.85, 0.044, 0.4], [0.7, 0.75, 0.04, 0.45]]);
    [-1, 1].forEach(s => {
      lock(b, [hp(R, s * 1.02, 0.7, 1.03), hp(R, s * 1.14, 0.08, 1.12), [s * R * 1.04, -R * 0.8, R * 0.32], [s * R * 1.0, -R * 2.0, R * 0.3], [s * R * 0.92, -R * 2.9, R * 0.36]], 0.052, 0.016, cfg.hair, { taper: 1.0, swell: 0.2 });
    });
    for (let i = 0; i < 9; i++) {
      const yaw = PI + (i - 4) * 0.3;
      lock(b, [hp(R, yaw, 0.85, 1.0), hp(R, yaw, 0.0, 1.12), hp(R, yaw, -0.75, 1.14), [S(yaw) * R * 0.9, -R * 1.5, C(yaw) * R * 1.05]], 0.065, 0.02, cfg.hair, { blunt: true, swell: 0.25 });
    }
  }

  function hairSakura(b, R, cfg) {
    capGrid(b, R, 1.06, 0.6, -0.9, cfg.hair);
    bangs(b, R, cfg, [[-0.8, 0.6, 0.044, -0.5], [-0.5, 0.75, 0.048, -0.4], [-0.2, 0.7, 0.046, -0.3], [0.15, 0.78, 0.048, 0.35], [0.45, 0.72, 0.046, 0.45], [0.75, 0.62, 0.042, 0.5]]);
    [-1, 1].forEach(s => {
      for (let k = 0; k < 2; k++) {
        const y0 = s * (1.05 + k * 0.3);
        lock(b, [hp(R, y0, 0.6, 1.03), hp(R, y0 + s * 0.12, -0.05, 1.14), [s * R * (1.1 + k * 0.05), -R * 0.7, R * (0.25 - k * 0.3)], [s * R * (1.18 + k * 0.05), -R * 1.3, R * (0.15 - k * 0.3)], [s * R * (1.05 + k * 0.06), -R * 1.8, R * (0.2 - k * 0.3)]], 0.05, 0.02, cfg.hair, { taper: 0.9, swell: 0.35 });
      }
    });
    for (let i = 0; i < 9; i++) {
      const yaw = PI + (i - 4) * 0.3;
      lock(b, [hp(R, yaw, 0.85, 1.0), hp(R, yaw, 0.0, 1.13), hp(R, yaw, -0.7, 1.16), [S(yaw) * R * 0.95, -R * 1.5, C(yaw) * R * 1.1]], 0.065, 0.022, cfg.hair, { blunt: true, swell: 0.35 });
    }
    boxAt(b, hp(R, 0.72, 0.5, 1.1), [0.006, 0.036, 0.005], cfg.clip, M4.chain(M4.rotY(0.75), M4.rotZ(0.15)));
  }

  function hairLongBack(b, cfg, len, width) {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * width;
      const z = -0.072 - (1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2)) * 0.028;
      lock(b, [[x * 0.8, 0.34, z + 0.01], [x, 0.16, z - 0.014], [x * 1.1, -0.04, z - 0.006], [x * 1.12, 0.34 - len, z + 0.012]], width * 1.35, 0.016, cfg.hair, { center: [0, 0, 0.02], out: () => [0, 0, -1], taper: 1.2, swell: 0.15 });
    }
  }

  const HAIR = {
    nagatoro: { head: hairNagatoro, back: (b, cfg) => hairNagatoroBack(b, cfg) },
    senpai: { head: hairSenpai },
    gamo: { head: hairGamo },
    yoshi: { head: hairYoshi, back: (b, cfg) => hairLongBack(b, cfg, 0.62, 0.036) },
    sakura: { head: hairSakura, back: (b, cfg) => hairLongBack(b, cfg, 0.48, 0.034) }
  };

  function eyeShape(ctx, m, cx, cy, rw, rh, outer, st) {
    ctx.beginPath();
    const top = st.top === undefined ? 1 : st.top;
    const bot = st.bot === undefined ? 1 : st.bot;
    ctx.moveTo(cx - outer * rw, cy + rh * 0.15);
    ctx.bezierCurveTo(cx - outer * rw * 0.6, cy - rh * top * 1.05, cx + outer * rw * 0.5, cy - rh * top * 1.15, cx + outer * rw * 1.05, cy - rh * top * 0.55);
    ctx.bezierCurveTo(cx + outer * rw * 1.0, cy + rh * bot * 0.4, cx + outer * rw * 0.4, cy + rh * bot * 1.0, cx - outer * rw * 0.2, cy + rh * bot * 0.95);
    ctx.quadraticCurveTo(cx - outer * rw * 0.8, cy + rh * bot * 0.8, cx - outer * rw, cy + rh * 0.15);
    ctx.closePath();
  }

  function drawEye(ctx, m, cfg, side, state, f) {
    const male = cfg.male;
    const outer = side;
    const cx = m.x(side * (male ? 0.35 : 0.38));
    const cy = m.y(male ? -0.16 : -0.19);
    const rw = (male ? 0.18 : 0.25) * m.kx;
    const rh = (male ? 0.13 : 0.215) * m.ky;
    const gx = f.gaze ? f.gaze[0] : 0, gy = f.gaze ? f.gaze[1] : 0;
    const lash = cfg.lash;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (state === 'shut' || state === 'calm' || state === 'squeeze') {
      ctx.strokeStyle = lash;
      ctx.lineWidth = (male ? 0.024 : 0.03) * m.ky;
      ctx.beginPath();
      if (state === 'shut') {
        ctx.moveTo(cx - rw * 0.9, cy + rh * 0.2);
        ctx.quadraticCurveTo(cx, cy - rh * 0.75, cx + rw * 0.9, cy + rh * 0.2);
      } else if (state === 'calm') {
        ctx.moveTo(cx - rw * 0.9, cy - rh * 0.05);
        ctx.quadraticCurveTo(cx, cy + rh * 0.6, cx + rw * 0.9, cy - rh * 0.05);
        ctx.moveTo(cx + outer * rw * 0.9, cy - rh * 0.05);
        ctx.lineTo(cx + outer * rw * 1.15, cy - rh * 0.3);
      } else {
        ctx.moveTo(cx + outer * rw * 0.9, cy - rh * 0.55);
        ctx.lineTo(cx - outer * rw * 0.5, cy + rh * 0.05);
        ctx.lineTo(cx + outer * rw * 0.9, cy + rh * 0.55);
      }
      ctx.stroke();
      return;
    }
    if (state === 'creep') {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = lash;
      ctx.lineWidth = 0.02 * m.ky;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rw * 1.1, rh * 0.85, 0, 0, PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#dadada';
      ctx.beginPath();
      ctx.ellipse(cx + gx * rw * 0.3, cy + rh * 0.05, rw * 0.16, rh * 0.18, 0, 0, PI * 2);
      ctx.fill();
      return;
    }
    const big = state === 'wide' || state === 'dot';
    const sc = big ? 1.12 : 1;
    const st = { top: 1, bot: 1 };
    if (state === 'smug') st.top = 0.42;
    if (state === 'half') st.top = 0.5;
    if (state === 'glare') { st.top = 0.5; st.bot = 0.55; }
    if (state === 'soft') st.top = 0.8;
    ctx.save();
    eyeShape(ctx, m, cx, cy, rw * sc, rh * sc, outer, st);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    const pScale = state === 'dot' ? 0.32 : state === 'wide' ? 0.62 : 1;
    const ix = cx + gx * rw * 0.35;
    const iy = cy + gy * rh * 0.3 + rh * 0.12;
    const irx = rw * (male ? 0.5 : 0.58) * pScale, iry = rh * (male ? 0.78 : 0.9) * pScale;
    if (state === 'glow') {
      ctx.fillStyle = '#e2e2e2';
      ctx.beginPath();
      ctx.ellipse(ix, iy, irx, iry, 0, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.012 * m.ky;
      ctx.stroke();
    } else {
      const ig = ctx.createLinearGradient(0, iy - iry, 0, iy + iry);
      ig.addColorStop(0, cfg.eyeDark);
      ig.addColorStop(0.55, cfg.eye);
      ig.addColorStop(1, cfg.eyeLight);
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.ellipse(ix, iy, irx, iry, 0, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.012 * m.ky;
      ctx.stroke();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(ix, iy - iry * 0.05, irx * (state === 'dot' ? 0.7 : 0.4), iry * (state === 'dot' ? 0.7 : 0.45), 0, 0, PI * 2);
      ctx.fill();
      if (state !== 'dot') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ix - irx * 0.32 * outer, iy - iry * 0.4, irx * 0.32, iry * 0.24, 0, 0, PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ix + irx * 0.3 * outer, iy + iry * 0.42, irx * 0.14, iry * 0.11, 0, 0, PI * 2);
        ctx.fill();
      }
    }
    if (st.top < 1) {
      ctx.fillStyle = hex(cfg.skin);
      ctx.beginPath();
      ctx.moveTo(cx - rw * 1.3, cy - rh * 2);
      ctx.lineTo(cx + rw * 1.3, cy - rh * 2);
      const lidIn = cy - rh * st.top * (state === 'glare' ? 0.2 : 0.55);
      const lidOut = cy - rh * st.top * (state === 'smug' ? 0.95 : 0.7);
      ctx.lineTo(cx + outer * rw * 1.3, outer > 0 ? lidOut : lidIn);
      ctx.lineTo(cx - outer * rw * 1.3, outer > 0 ? lidIn : lidOut);
      ctx.closePath();
      ctx.fill();
    }
    if (st.bot < 1) {
      ctx.fillStyle = hex(cfg.skin);
      ctx.fillRect(cx - rw * 1.3, cy + rh * st.bot * 0.75, rw * 2.6, rh * 2);
    }
    ctx.restore();
    ctx.strokeStyle = lash;
    ctx.fillStyle = lash;
    const lw = (male ? 0.022 : 0.034) * m.ky;
    ctx.lineWidth = lw;
    ctx.beginPath();
    if (st.top < 1) {
      const lidIn = cy - rh * st.top * (state === 'glare' ? 0.2 : 0.55);
      const lidOut = cy - rh * st.top * (state === 'smug' ? 0.95 : 0.7);
      ctx.moveTo(cx - outer * rw * 1.0, lidIn + rh * 0.1);
      ctx.lineTo(cx + outer * rw * 1.08, lidOut);
    } else {
      ctx.moveTo(cx - outer * rw * sc, cy + rh * 0.15);
      ctx.bezierCurveTo(cx - outer * rw * 0.6 * sc, cy - rh * 1.05 * sc, cx + outer * rw * 0.5 * sc, cy - rh * 1.15 * sc, cx + outer * rw * 1.05 * sc, cy - rh * 0.55 * sc);
    }
    ctx.stroke();
    if (!male) {
      const ox = cx + outer * rw * 1.05 * sc;
      const oy = st.top < 1 ? cy - rh * st.top * (state === 'smug' ? 0.95 : 0.7) : cy - rh * 0.55 * sc;
      ctx.beginPath();
      ctx.moveTo(ox - outer * rw * 0.25, oy - rh * 0.05);
      ctx.lineTo(ox + outer * rw * 0.22, oy - rh * 0.32);
      ctx.lineTo(ox + outer * rw * 0.05, oy + rh * 0.1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.lineWidth = lw * 0.45;
    ctx.beginPath();
    ctx.moveTo(cx + outer * rw * 0.95 * sc, cy + rh * 0.35);
    ctx.quadraticCurveTo(cx + outer * rw * 0.5, cy + rh * (st.bot < 1 ? st.bot * 0.75 : 0.95) * sc, cx - outer * rw * 0.1, cy + rh * (st.bot < 1 ? st.bot * 0.75 : 0.95) * sc);
    ctx.stroke();
    if (state === 'teary') {
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.01 * m.ky;
      for (let k = 0; k < 2; k++) {
        ctx.beginPath();
        ctx.ellipse(cx + (k - 0.5) * rw * 0.7, cy + rh * 1.25 + k * rh * 0.5, rw * 0.13, rh * 0.28, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  function drawBrow(ctx, m, cfg, side, mode) {
    const male = cfg.male;
    const cx = m.x(side * (male ? 0.35 : 0.38));
    const by = m.y(male ? 0.07 : 0.1);
    const w = (male ? 0.2 : 0.19) * m.kx;
    const outer = side;
    ctx.strokeStyle = cfg.brow;
    ctx.lineCap = 'round';
    ctx.lineWidth = (male ? 0.03 : 0.02) * m.ky;
    ctx.beginPath();
    if (mode === 'angry' || mode === 'devil') {
      ctx.moveTo(cx - outer * w * 0.8, by - 0.02 * m.ky);
      ctx.lineTo(cx + outer * w * 0.9, by + 0.06 * m.ky);
    } else if (mode === 'worry') {
      ctx.moveTo(cx - outer * w * 0.8, by + 0.06 * m.ky);
      ctx.quadraticCurveTo(cx, by + 0.03 * m.ky, cx + outer * w * 0.9, by - 0.02 * m.ky);
    } else if (mode === 'up') {
      ctx.moveTo(cx - outer * w * 0.8, by + 0.06 * m.ky);
      ctx.quadraticCurveTo(cx, by + 0.11 * m.ky, cx + outer * w * 0.9, by + 0.05 * m.ky);
    } else if (mode === 'smug') {
      const k = side < 0 ? 0.05 : -0.01;
      ctx.moveTo(cx - outer * w * 0.8, by + k * m.ky);
      ctx.quadraticCurveTo(cx, by + (k + 0.05) * m.ky, cx + outer * w * 0.9, by + (k + 0.02) * m.ky);
    } else {
      ctx.moveTo(cx - outer * w * 0.8, by + 0.01 * m.ky);
      ctx.quadraticCurveTo(cx, by + 0.05 * m.ky, cx + outer * w * 0.9, by + 0.015 * m.ky);
    }
    ctx.stroke();
  }

  function drawMouth(ctx, m, cfg, state, f) {
    const cx = m.x(f.mouthX || 0);
    const my = m.y(cfg.male ? -0.66 : -0.7);
    const hw = (cfg.male ? 0.17 : 0.2) * m.kx;
    const line = '#000000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = line;
    const lw = 0.016 * m.ky;
    ctx.lineWidth = lw;
    const fang = (x, y, s, down) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x, y + (down ? s * 1.6 : -s * 1.6));
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = lw * 0.6;
      ctx.stroke();
      ctx.lineWidth = lw;
    };
    if (state === 'grin' || state === 'laugh' || state === 'yell' || state === 'open') {
      const wide = state === 'grin' ? 1.25 : state === 'laugh' ? 0.95 : state === 'yell' ? 0.85 : 0.42;
      const deep = state === 'grin' ? 0.15 : state === 'laugh' ? 0.24 : state === 'yell' ? 0.26 : 0.14;
      ctx.beginPath();
      ctx.moveTo(cx - hw * wide, my - 0.02 * m.ky);
      ctx.quadraticCurveTo(cx, my + 0.01 * m.ky, cx + hw * wide, my - 0.02 * m.ky);
      ctx.quadraticCurveTo(cx + hw * wide * 0.7, my + deep * m.ky, cx, my + deep * m.ky);
      ctx.quadraticCurveTo(cx - hw * wide * 0.7, my + deep * m.ky, cx - hw * wide, my - 0.02 * m.ky);
      ctx.closePath();
      ctx.fillStyle = state === 'grin' ? '#ffffff' : '#3a1418';
      ctx.fill();
      ctx.save();
      ctx.clip();
      if (state === 'grin') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = lw * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - hw * wide, my + deep * 0.45 * m.ky);
        ctx.quadraticCurveTo(cx, my + deep * 0.65 * m.ky, cx + hw * wide, my + deep * 0.45 * m.ky);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - hw, my - 0.05 * m.ky, hw * 2, (state === 'open' ? 0.035 : 0.045) * m.ky);
        ctx.fillStyle = '#c8606a';
        ctx.beginPath();
        ctx.ellipse(cx, my + deep * m.ky, hw * wide * 0.55, deep * 0.45 * m.ky, 0, 0, PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.stroke();
      if (cfg.fang && state !== 'yell') {
        const fy = state === 'grin' ? my - 0.005 * m.ky : my + 0.02 * m.ky;
        fang(cx + hw * wide * 0.55, fy, 0.025 * m.kx, true);
        if (state === 'grin') fang(cx - hw * wide * 0.55, fy, 0.022 * m.kx, true);
      }
      return;
    }
    if (state === 'grit') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.85, my - 0.03 * m.ky);
      ctx.lineTo(cx + hw * 0.85, my - 0.035 * m.ky);
      ctx.lineTo(cx + hw * 0.7, my + 0.05 * m.ky);
      ctx.lineTo(cx - hw * 0.7, my + 0.045 * m.ky);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = lw * 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.8, my + 0.008 * m.ky);
      ctx.lineTo(cx + hw * 0.8, my + 0.005 * m.ky);
      for (let k = -3; k <= 3; k++) {
        ctx.moveTo(cx + k * hw * 0.22, my - 0.03 * m.ky);
        ctx.lineTo(cx + k * hw * 0.2, my + 0.045 * m.ky);
      }
      ctx.stroke();
      return;
    }
    if (state === 'cat') {
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.4, my - 0.01 * m.ky);
      ctx.quadraticCurveTo(cx - hw * 0.2, my + 0.05 * m.ky, cx, my);
      ctx.quadraticCurveTo(cx + hw * 0.2, my + 0.05 * m.ky, cx + hw * 0.4, my - 0.01 * m.ky);
      ctx.stroke();
      return;
    }
    if (state === 'kiss') {
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.06, my - 0.03 * m.ky);
      ctx.quadraticCurveTo(cx + hw * 0.18, my - 0.015 * m.ky, cx, my);
      ctx.quadraticCurveTo(cx + hw * 0.18, my + 0.015 * m.ky, cx - hw * 0.06, my + 0.03 * m.ky);
      ctx.stroke();
      return;
    }
    if (state === 'tongue') {
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.4, my);
      ctx.quadraticCurveTo(cx, my + 0.02 * m.ky, cx + hw * 0.4, my);
      ctx.stroke();
      ctx.fillStyle = '#d8707a';
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.18, my + 0.008 * m.ky);
      ctx.quadraticCurveTo(cx - hw * 0.2, my + 0.09 * m.ky, cx, my + 0.09 * m.ky);
      ctx.quadraticCurveTo(cx + hw * 0.2, my + 0.09 * m.ky, cx + hw * 0.18, my + 0.008 * m.ky);
      ctx.fill();
      ctx.stroke();
      return;
    }
    ctx.beginPath();
    if (state === 'smile' || state === 'fang') {
      ctx.moveTo(cx - hw * 0.5, my - 0.015 * m.ky);
      ctx.quadraticCurveTo(cx, my + 0.05 * m.ky, cx + hw * 0.5, my - 0.015 * m.ky);
    } else if (state === 'smirk') {
      ctx.moveTo(cx - hw * 0.45, my + 0.01 * m.ky);
      ctx.quadraticCurveTo(cx + hw * 0.1, my + 0.03 * m.ky, cx + hw * 0.55, my - 0.03 * m.ky);
    } else if (state === 'frown') {
      ctx.moveTo(cx - hw * 0.4, my + 0.025 * m.ky);
      ctx.quadraticCurveTo(cx, my - 0.03 * m.ky, cx + hw * 0.4, my + 0.025 * m.ky);
    } else if (state === 'wavy') {
      ctx.moveTo(cx - hw * 0.5, my);
      for (let k = 1; k <= 6; k++) ctx.lineTo(cx - hw * 0.5 + (hw * k) / 6, my + (k % 2 ? -0.02 : 0.02) * m.ky);
    } else if (state === 'o') {
      ctx.ellipse(cx, my + 0.01 * m.ky, hw * 0.16, 0.035 * m.ky, 0, 0, PI * 2);
    } else {
      ctx.moveTo(cx - hw * 0.35, my);
      ctx.lineTo(cx + hw * 0.35, my);
    }
    ctx.stroke();
    if (state === 'fang' || (state === 'smirk' && cfg.fang)) fang(cx + hw * 0.3, my + 0.012 * m.ky, 0.02 * m.kx, true);
  }

  function drawFace(ctx, w, h, cfg, f) {
    const m = fmap(w, h);
    ctx.fillStyle = hex(cfg.skin);
    ctx.fillRect(0, 0, w, h);
    if (f.shade) {
      const g = ctx.createLinearGradient(0, m.y(0.6), 0, m.y(-0.5));
      g.addColorStop(0, 'rgba(20,10,30,0.95)');
      g.addColorStop(1, 'rgba(20,10,30,0.15)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    const blush = f.blush || 0;
    if (blush > 0) {
      [-1, 1].forEach(sd => {
        const cx = m.x(sd * 0.5), cy = m.y(-0.44);
        ctx.fillStyle = `rgba(150,40,60,${0.25 * blush})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 0.18 * m.kx, 0.08 * m.ky, 0, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(60,10,20,${0.85 * blush})`;
        ctx.lineWidth = 0.012 * m.ky;
        for (let k = -3; k <= 3; k++) {
          ctx.beginPath();
          ctx.moveTo(cx + k * 0.04 * m.kx - 0.02 * m.kx, cy + 0.045 * m.ky);
          ctx.lineTo(cx + k * 0.04 * m.kx + 0.02 * m.kx, cy - 0.045 * m.ky);
          ctx.stroke();
        }
      });
    }
    if (f.circles) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.012 * m.ky;
      [-1, 1].forEach(sd => {
        ctx.beginPath();
        ctx.ellipse(m.x(sd * 0.5), m.y(-0.45), 0.07 * m.kx, 0.06 * m.ky, 0, 0, PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(m.x(sd * 0.5), m.y(-0.45), 0.035 * m.kx, 0.03 * m.ky, 0, 0, PI * 2);
        ctx.stroke();
      });
    }
    const eyes = Array.isArray(f.eyes) ? f.eyes : [f.eyes || 'open', f.eyes || 'open'];
    const brows = f.brows || 'normal';
    [-1, 1].forEach((sd, i) => {
      if (!f.noBrows) drawBrow(ctx, m, cfg, sd, brows);
      drawEye(ctx, m, cfg, sd, eyes[i], f);
    });
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = 'rgba(70,20,30,0.7)';
    ctx.lineWidth = 0.01 * m.ky;
    ctx.beginPath();
    ctx.ellipse(m.x(0), m.y(-0.45), 0.014 * m.kx, 0.01 * m.ky, 0, 0, PI * 2);
    ctx.fill();
    drawMouth(ctx, m, cfg, f.mouth || 'smile', f);
    if (f.vein) {
      const vx = m.x(0.58), vy = m.y(0.22), vr = 0.07 * m.kx;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.02 * m.kx;
      [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([qx, qy]) => {
        ctx.beginPath();
        ctx.moveTo(vx + qx * vr * 0.25, vy + qy * vr);
        ctx.quadraticCurveTo(vx + qx * vr * 0.3, vy + qy * vr * 0.3, vx + qx * vr, vy + qy * vr * 0.25);
        ctx.stroke();
      });
    }
    if (f.sweat) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.01 * m.ky;
      ctx.beginPath();
      const sx = m.x(-0.78), sy = m.y(0.1);
      ctx.moveTo(sx, sy - 0.08 * m.ky);
      ctx.quadraticCurveTo(sx + 0.05 * m.kx, sy + 0.02 * m.ky, sx, sy + 0.04 * m.ky);
      ctx.quadraticCurveTo(sx - 0.05 * m.kx, sy + 0.02 * m.ky, sx, sy - 0.08 * m.ky);
      ctx.fill();
      ctx.stroke();
    }
    if (f.tears) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      [-1, 1].forEach(sd => {
        ctx.beginPath();
        ctx.moveTo(m.x(sd * 0.3), m.y(-0.24));
        ctx.quadraticCurveTo(m.x(sd * 0.38), m.y(-0.5), m.x(sd * 0.3), m.y(-0.8));
        ctx.lineTo(m.x(sd * 0.24), m.y(-0.8));
        ctx.quadraticCurveTo(m.x(sd * 0.3), m.y(-0.5), m.x(sd * 0.24), m.y(-0.24));
        ctx.fill();
      });
    }
    if (f.whiskers) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.02 * m.ky;
      [-1, 1].forEach(sd => {
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(m.x(sd * 0.36), m.y(-0.36 - k * 0.07));
          ctx.lineTo(m.x(sd * 0.72), m.y(-0.3 - k * 0.11));
          ctx.stroke();
        }
      });
      ctx.beginPath();
      ctx.moveTo(m.x(-0.05), m.y(-0.4));
      ctx.lineTo(m.x(0.05), m.y(-0.4));
      ctx.lineTo(m.x(0), m.y(-0.46));
      ctx.closePath();
      ctx.stroke();
    }
  }

  function lensTex(state) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const box = (x0) => {
        if (state === 'glare' || state === 'blank') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x0 + 2, 2, w / 2 - 4, h - 4);
          ctx.fillStyle = '#d0d4dc';
          for (let k = 0; k < 3; k++) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x0 + 2, 2, w / 2 - 4, h - 4);
            ctx.clip();
            ctx.translate(x0 + w * 0.1 + k * w * 0.12, 0);
            ctx.rotate(0.5);
            ctx.fillRect(0, -h, w * 0.03, h * 3);
            ctx.restore();
          }
        } else if (state === 'spiral') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x0 + 2, 2, w / 2 - 4, h - 4);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = h * 0.045;
          ctx.beginPath();
          const cx = x0 + w / 4, cy = h / 2;
          for (let a = 0; a < PI * 7; a += 0.2) {
            const rr = (a / (PI * 7)) * h * 0.42;
            const x = cx + C(a) * rr, y = cy + S(a) * rr;
            if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        } else if (state === 'pink' || state === 'green') {
          ctx.fillStyle = state === 'pink' ? '#e8609a' : '#40d0a0';
          ctx.fillRect(x0 + 2, 2, w / 2 - 4, h - 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x0 + w * 0.08, h * 0.2, w * 0.06, h * 0.18);
        } else if (state === 'hearts' || state === 'stars') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x0 + 2, 2, w / 2 - 4, h - 4);
          ctx.fillStyle = '#000000';
          const cx = x0 + w / 4, cy = h / 2, rr = h * 0.32;
          ctx.beginPath();
          if (state === 'hearts') {
            ctx.moveTo(cx, cy + rr);
            ctx.bezierCurveTo(cx - rr * 1.6, cy - rr * 0.2, cx - rr * 0.6, cy - rr * 1.3, cx, cy - rr * 0.4);
            ctx.bezierCurveTo(cx + rr * 0.6, cy - rr * 1.3, cx + rr * 1.6, cy - rr * 0.2, cx, cy + rr);
          } else {
            for (let k = 0; k < 10; k++) {
              const a = -PI / 2 + (k * PI) / 5, q = k % 2 ? rr * 0.45 : rr;
              ctx.lineTo(cx + C(a) * q, cy + S(a) * q);
            }
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.save();
          ctx.translate(x0 + w * 0.32, h * 0.25);
          ctx.rotate(0.6);
          ctx.fillRect(0, 0, w * 0.025, h * 0.4);
          ctx.fillRect(w * 0.04, 0, w * 0.012, h * 0.3);
          ctx.restore();
        }
      };
      box(0);
      box(w / 2);
    };
  }

  function bands(len, list, rFn, sides) {
    const rings = [];
    list.forEach(([f, col], i) => {
      rings.push(ring(-len * f, rFn(f), rFn(f) * 0.94, 0, col));
      const next = list[i + 1];
      if (next) rings.push(ring(-len * (next[0] - 0.0001), rFn(next[0]), rFn(next[0]) * 0.94, 0, col));
    });
    rings.push(ring(-len, rFn(1), rFn(1) * 0.94, 0, list[list.length - 1][1]));
    return { rings: rings.reverse(), sides: sides || 10 };
  }

  function limbMesh(r, len, list, rFn, capCol) {
    return K.mesh(r, b => {
      const { rings, sides } = bands(len, list, rFn);
      loft(b, rings, sides, { capTop: true, capBottom: true });
      if (capCol !== undefined) ellAt(b, [0, 0, 0], rFn(0) * 1.04, rFn(0) * 1.04, rFn(0) * 1.04, 10, 6, capCol);
    });
  }

  const FINGERS = {
    relaxed: [[0.35, 0.3], [0.45, 0.35], [0.5, 0.4], [0.55, 0.45], [0.3, 0.2]],
    open: [[0.05, 0.05], [0.05, 0.05], [0.05, 0.05], [0.05, 0.05], [0.15, 0.1]],
    spread: [[0.02, 0.02], [0.02, 0.02], [0.02, 0.02], [0.02, 0.02], [0.05, 0.05]],
    fist: [[1.5, 1.4], [1.55, 1.45], [1.6, 1.45], [1.6, 1.45], [0.8, 0.6]],
    point: [[0.02, 0.02], [1.55, 1.45], [1.6, 1.45], [1.6, 1.45], [0.7, 0.5]],
    claw: [[0.5, 1.1], [0.5, 1.15], [0.5, 1.15], [0.5, 1.1], [0.4, 0.5]],
    peace: [[0.02, 0.02], [0.02, 0.02], [1.6, 1.45], [1.6, 1.45], [0.8, 0.6]],
    pinch: [[0.7, 0.6], [0.8, 0.7], [0.9, 0.8], [1.0, 0.9], [0.9, 0.4]],
    cup: [[0.4, 0.5], [0.45, 0.55], [0.5, 0.6], [0.55, 0.6], [0.5, 0.3]]
  };
  const SPREAD = { spread: 0.22, claw: 0.2, peace: 0.12, open: 0.04 };

  function handMesh(r, col, side, pose) {
    return K.mesh(r, b => {
      const k = side;
      const curls = FINGERS[pose];
      const fan = SPREAD[pose] || 0.05;
      ellAt(b, [0, -0.035, 0.002], 0.018, 0.038, 0.034, 8, 6, col);
      const fingerLens = [[0.026, 0.02], [0.03, 0.022], [0.028, 0.021], [0.022, 0.017]];
      for (let i = 0; i < 4; i++) {
        const z = (1.5 - i) * 0.017;
        const [c1, c2] = curls[i];
        const [l1, l2] = fingerLens[i];
        const a = (i - 1.5) * fan;
        b.push(M4.translate(0, -0.068, z), M4.rotX(a), M4.rotZ(-k * c1));
        K.tube(b, [[0, 0, 0], [0, -l1, 0]], [0.0085, 0.0075], 6, col);
        b.push(M4.translate(0, -l1, 0), M4.rotZ(-k * c2));
        K.tube(b, [[0, 0, 0], [0, -l2, 0]], [0.0075, 0.006], 6, col);
        ellAt(b, [0, -l2, 0], 0.006, 0.006, 0.006, 6, 4, col);
        b.pop();
        b.pop();
      }
      const [t1, t2] = curls[4];
      b.push(M4.translate(-k * 0.008, -0.02, 0.03), M4.rotX(-0.9 + t1 * 0.6), M4.rotZ(k * 0.35 - k * t1 * 0.4));
      K.tube(b, [[0, 0, 0], [0, -0.028, 0]], [0.01, 0.0085], 6, col);
      b.push(M4.translate(0, -0.028, 0), M4.rotZ(-k * t2));
      K.tube(b, [[0, 0, 0], [0, -0.022, 0]], [0.0085, 0.007], 6, col);
      ellAt(b, [0, -0.022, 0], 0.007, 0.007, 0.007, 6, 4, col);
      b.pop();
      b.pop();
    });
  }

  function footMesh(r, col, sole, len, sockCol) {
    return K.mesh(r, b => {
      const L = len || 0.16;
      loft(b, [
        ring(-0.072, 0.034, L * 0.36, L * 0.32, sole),
        ring(-0.062, 0.036, L * 0.38, L * 0.32, col),
        ring(-0.025, 0.036, L * 0.24, L * 0.14, col),
        ring(0.0, 0.036, 0.036, 0, sockCol || col)
      ], 10, { capTop: true, capBottom: true, hard: true });
    });
  }

  function torsoRings(cfg) {
    if (cfg.male) {
      return [
        { y: -0.12, rx: 0.118, rz: 0.08 }, { y: -0.04, rx: 0.112, rz: 0.075 }, { y: 0.05, rx: 0.12, rz: 0.078 },
        { y: 0.13, rx: 0.13, rz: 0.08 }, { y: 0.2, rx: 0.148, rz: 0.075 }, { y: 0.235, rx: 0.11, rz: 0.062 }, { y: 0.255, rx: 0.05, rz: 0.045 }
      ];
    }
    return [
      { y: -0.115, rx: 0.118, rz: 0.088 }, { y: -0.05, rx: 0.1, rz: 0.074 }, { y: 0.03, rx: 0.102, rz: 0.076 },
      { y: 0.1, rx: 0.112, rz: 0.084 }, { y: 0.17, rx: 0.124, rz: 0.074 }, { y: 0.205, rx: 0.104, rz: 0.062 }, { y: 0.225, rx: 0.048, rz: 0.044 }
    ];
  }

  const INK = 0x08080c;

  function shirtLines(b, male) {
    const w = 0.0024;
    const line = (pts) => K.tube(b, pts, pts.map(() => w), 5, INK);
    if (male) {
      [-1, 1].forEach(s => line([[s * 0.062, 0.233, 0.048], [s * 0.03, 0.212, 0.07], [0, 0.192, 0.084]]));
      line([[0, 0.192, 0.084], [0, 0.13, 0.085], [0, 0.05, 0.083], [0, -0.04, 0.08], [0, -0.115, 0.085]]);
      line([[0.035, 0.145, 0.083], [0.085, 0.145, 0.07], [0.085, 0.09, 0.072], [0.035, 0.09, 0.083], [0.035, 0.145, 0.083]]);
      [0.15, 0.08, 0.01, -0.06].forEach(y => line([[-0.008, y, 0.086], [0.008, y, 0.086]]));
      return;
    }
    [-1, 1].forEach(s => line([[s * 0.062, 0.2, 0.054], [s * 0.03, 0.168, 0.074], [0, 0.128, 0.087]]));
    line([[0, 0.128, 0.087], [0, 0.07, 0.087], [0, 0.0, 0.08], [0, -0.06, 0.079], [0, -0.11, 0.092]]);
    [-1, 1].forEach(s => line([[s * 0.075, 0.115, 0.07], [s * 0.04, 0.06, 0.085]]));
  }

  function torsoMesh(r, cfg) {
    return K.mesh(r, b => {
      const rs = torsoRings(cfg);
      loft(b, rs.map(q => ring(q.y, q.rx, q.rz, 0, q.y > (cfg.male ? 0.25 : 0.22) ? cfg.skin : cfg.shirt)), 16, { capTop: true, capBottom: true });
      const top = rs[rs.length - 2].y;
      K.tube(b, [[0, top - 0.02, 0.0], [0, top + 0.1, 0.012]], [0.036, 0.034], 10, cfg.skin);
      if (cfg.male) {
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.03, top - 0.01, 0.048), M4.rotY(s * 0.4), M4.rotZ(s * 0.5));
          b.box(0.036, 0.016, 0.006, cfg.shirt);
          b.pop();
        });
        shirtLines(b, true);
      } else {
        b.push(M4.translate(0, top - 0.045, 0.066), M4.rotX(-0.32));
        b.quad([-0.032, 0.04, 0], [0.032, 0.04, 0], [0, -0.03, 0.002], [0, -0.03, 0.002], cfg.skin, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        b.pop();
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.034, top - 0.04, 0.06), M4.rotY(s * 0.5), M4.rotZ(s * 0.75));
          b.box(0.042, 0.018, 0.006, cfg.shirt);
          b.pop();
        });
        shirtLines(b, false);
      }
    });
  }

  function pelvisMesh(r, cfg) {
    return K.mesh(r, b => {
      if (cfg.male) {
        loft(b, [ring(-0.12, 0.12, 0.088, 0, cfg.pants), ring(0.0, 0.118, 0.086, 0, cfg.pants), ring(0.03, 0.118, 0.086, 0, cfg.belt), ring(0.045, 0.116, 0.084, 0, cfg.belt)], 14, { capTop: true, capBottom: true, hard: true });
        return;
      }
      const n = 24;
      const rad = (i, y) => {
        const pleat = i % 2 ? 1.04 : 0.97;
        const k = clamp((0.03 - y) / 0.27, 0, 1);
        return { rx: lerp(0.105, 0.2, k) * lerp(1, pleat, k), rz: lerp(0.082, 0.17, k) * lerp(1, pleat, k) };
      };
      const ys = [0.03, -0.06, -0.15, -0.24];
      for (let j = 0; j < ys.length - 1; j++) {
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
          const P = (a, y, ii) => { const q = rad(ii, y); return [S(a) * q.rx, y, C(a) * q.rz]; };
          const p00 = P(a0, ys[j], i), p10 = P(a1, ys[j], i + 1), p11 = P(a1, ys[j + 1], i + 1), p01 = P(a0, ys[j + 1], i);
          const nn = V3.norm([S((a0 + a1) / 2), 0.3, C((a0 + a1) / 2)]);
          b.quad(p00, p10, p11, p01, cfg.skirt, null, [nn, nn, nn, nn]);
        }
      }
      loft(b, [ring(-0.02, 0.098, 0.076, 0, cfg.skin), ring(0.04, 0.1, 0.078, 0, cfg.skin)], 12, { capTop: true });
    });
  }

  function build(r) {
    const V = {};
    Object.keys(CHARS).forEach(who => {
      const cfg = CHARS[who];
      const D = cfg.dim;
      const R = D.head;
      const v = {};
      v.skull = K.mesh(r, b => {
        headGrid(b, R, -PI, PI, -PI / 2 + 0.02, PI / 2 - 0.02, 28, 16, cfg.skin, 0.985, false);
        [-1, 1].forEach(s => ellAt(b, hp(R, s * 1.5, -0.12, 0.98), 0.016, 0.03, 0.012, 8, 6, cfg.skin, M4.rotY(s * 0.3)));
      });
      v.face = K.mesh(r, b => headGrid(b, R, FACE[0], FACE[1], FACE[2], FACE[3], 26, 20, 0xffffff, 1.0, true));
      v.hair = K.mesh(r, b => HAIR[who].head(b, R, cfg));
      if (HAIR[who].back) v.hairBack = K.mesh(r, b => HAIR[who].back(b, cfg));
      v.torso = torsoMesh(r, cfg);
      v.pelvis = pelvisMesh(r, cfg);
      const sleeve = cfg.shirt;
      v.upper = limbMesh(r, D.upper, cfg.male ? [[0, sleeve]] : [[0, sleeve], [0.6, INK], [0.625, cfg.shirtShade], [0.7, cfg.skin]], (f) => lerp(cfg.male ? 0.046 : 0.042, cfg.male ? 0.038 : 0.031, f) * (cfg.male || f < 0.7 ? 1.08 : 1), sleeve);
      v.fore = limbMesh(r, D.fore, cfg.male ? [[0, cfg.shirt], [0.86, INK], [0.88, cfg.shirtShade], [0.95, cfg.skin]] : [[0, cfg.skin]], (f) => lerp(cfg.male ? 0.038 : 0.03, cfg.male ? 0.033 : 0.022, f), cfg.male ? cfg.shirt : cfg.skin);
      if (cfg.male) {
        v.thigh = limbMesh(r, D.thigh, [[0, cfg.pants]], (f) => lerp(0.07, 0.054, f), cfg.pants);
        v.shin = limbMesh(r, D.shin, [[0, cfg.pants]], (f) => lerp(0.052, 0.046, f), cfg.pants);
        v.foot = footMesh(r, cfg.shoe, cfg.sole, 0.19, cfg.pants);
      } else {
        v.thigh = limbMesh(r, D.thigh, [[0, cfg.skin]], (f) => lerp(0.066, 0.044, f), cfg.skin);
        v.shin = limbMesh(r, D.shin, [[0, cfg.skin], [0.82, cfg.sock]], (f) => (0.04 + 0.009 * S(PI * Math.min(1, f / 0.55)) - 0.012 * f) * (f > 0.82 ? 1.06 : 1), cfg.skin);
        v.foot = footMesh(r, cfg.shoe, cfg.sole, 0.16, cfg.sock);
      }
      v.hands = {};
      Object.keys(FINGERS).forEach(pose => {
        v.hands[pose] = { L: handMesh(r, cfg.skin, 1, pose), R: handMesh(r, cfg.skin, -1, pose) };
      });
      if (who === 'senpai' || who === 'nagatoro') {
        v.glasses = K.mesh(r, b => {
          const z = R * 0.96;
          const col = cfg.glasses || 0x060608;
          [-1, 1].forEach(s => {
            const cx = s * R * 0.32, cy = -R * 0.15;
            const w = R * 0.42, h = R * 0.27, t = 0.0035;
            boxAt(b, [cx, cy + h / 2, z], [w, t, t], col);
            boxAt(b, [cx, cy - h / 2, z], [w, t, t], col);
            boxAt(b, [cx - w / 2, cy, z], [t, h, t], col);
            boxAt(b, [cx + w / 2, cy, z], [t, h, t], col);
            K.tube(b, [[s * (R * 0.32 + w / 2), cy + h * 0.3, z], [s * R * 0.9, cy + h * 0.25, R * 0.25], [s * R * 0.92, cy + h * 0.2, -R * 0.2]], [t * 0.6, t * 0.6, t * 0.6], 4, col);
          });
          boxAt(b, [0, -R * 0.12, z + 0.002], [R * 0.22 - R * 0.0, 0.003, 0.003], col);
        });
        v.lens = K.mesh(r, b => {
          const z = R * 0.965;
          const n = [0, 0, 1];
          const cy = -R * 0.15, w = R * 0.42, h = R * 0.27;
          b.quad([-R * 0.32 - w / 2, cy - h / 2, z], [R * 0.32 + w / 2, cy - h / 2, z], [R * 0.32 + w / 2, cy + h / 2, z], [-R * 0.32 - w / 2, cy + h / 2, z], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
        });
      }
      V[who] = v;
    });
    V.faceTex = {};
    V.lensTex = {};
    V.r = r;
    return V;
  }

  function faceKey(f) {
    return JSON.stringify([f.eyes, f.mouth, f.brows, f.blush, f.gaze, f.vein, f.sweat, f.tears, f.whiskers, f.circles, f.shade, f.noBrows, f.mouthX]);
  }

  function faceTexture(V, who, f, hi) {
    const key = who + (hi ? ':hi:' : ':') + faceKey(f);
    if (!V.faceTex[key]) {
      const cfg = CHARS[who];
      const sc = hi ? 2 : 1;
      V.faceTex[key] = V.r.texture(FACE_W * sc, (ctx, w, h) => drawFace(ctx, w, h, cfg, f), { height: FACE_H * sc, clamp: true });
    }
    return V.faceTex[key];
  }

  function lensTexture(V, state) {
    if (!V.lensTex[state]) V.lensTex[state] = V.r.texture(256, lensTex(state), { height: 64, clamp: true });
    return V.lensTex[state];
  }

  function poseFrame(p) {
    const out = Object.assign({}, p);
    if (p.yaw !== undefined && !p.fwd) out.fwd = [S(p.yaw), 0, C(p.yaw)];
    return out;
  }

  function solve(who, pose) {
    return Rig.solve(poseFrame(pose), CHARS[who].dim);
  }

  function partOpts(opts, extra) {
    if (opts && opts.flat) return { flat: opts.flat };
    return extra || {};
  }

  function drawChar(r, V, who, m, pose, opts) {
    const v = V[who];
    const o = opts || {};
    const face = pose.face || {};
    const flat = o.flat;
    const sc = pose.scale || 1;
    const S4 = sc === 1 ? null : M4.scale(sc, sc, sc);
    const at = (mat) => (S4 ? M4.chain(M4.translate(m.pts.pelvis[0] * (1 - sc), m.pts.pelvis[1] * (1 - sc), m.pts.pelvis[2] * (1 - sc)), S4, mat) : mat);
    const hide = pose.hide || {};
    if (!hide.head) {
      r.draw(v.skull, at(m.head), partOpts(o));
      r.draw(v.face, at(m.head), flat ? { flat } : { texture: faceTexture(V, who, face, pose.hiFace) });
      r.draw(v.hair, at(pose.hairScale ? M4.chain(m.head, M4.scale(pose.hairScale[0], pose.hairScale[1], pose.hairScale[2])) : m.head), partOpts(o));
      if (v.glasses && (who === 'senpai' ? pose.glasses !== false : pose.glasses)) {
        r.draw(v.glasses, at(m.head), partOpts(o));
        const ls = pose.lens || 'clear';
        if (!flat) r.draw(v.lens, at(m.head), { texture: lensTexture(V, ls) });
        else if (ls !== 'clear') r.draw(v.lens, at(m.head), { flat });
      }
    }
    if (v.hairBack && !hide.hairBack) r.draw(v.hairBack, at(m.chest), partOpts(o));
    if (hide.body) return;
    if (!hide.torso) r.draw(v.torso, at(m.chest), partOpts(o));
    if (!hide.pelvis) r.draw(v.pelvis, at(m.pelvis), partOpts(o));
    ['L', 'R'].forEach(s => {
      if (!hide['arm' + s]) {
        if (!hide.upper) r.draw(v.upper, at(m['upper' + s]), partOpts(o));
        r.draw(v.fore, at(m['fore' + s]), partOpts(o));
        const hp2 = pose['hand' + s] || 'relaxed';
        r.draw(v.hands[hp2][s], at(m['hand' + s]), partOpts(o));
      }
      if (!hide.legs) {
        r.draw(v.thigh, at(m['thigh' + s]), partOpts(o));
        r.draw(v.shin, at(m['shin' + s]), partOpts(o));
        r.draw(v.foot, at(m['foot' + s]), partOpts(o));
      }
    });
  }

  window.NagCast = { DIMS, CHARS, build, solve, drawChar, faceTexture, hp };
})();
