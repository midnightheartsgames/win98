(function () {
  const { M4, V3, shade, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, mesh } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const DIMS = {
    host: { hipX: 0.13, hipY: -0.05, thigh: 0.45, shin: 0.45, chestY: 0.13, neckY: 0.34, shX: 0.24, shY: 0.235, upper: 0.3, fore: 0.27, headY: 0.15, head: 0.118 },
    waiter: { hipX: 0.1, hipY: -0.05, thigh: 0.47, shin: 0.46, chestY: 0.12, neckY: 0.31, shX: 0.2, shY: 0.215, upper: 0.3, fore: 0.27, headY: 0.14, head: 0.1 },
    actor: { hipX: 0.12, hipY: -0.05, thigh: 0.45, shin: 0.44, chestY: 0.12, neckY: 0.33, shX: 0.23, shY: 0.225, upper: 0.3, fore: 0.27, headY: 0.145, head: 0.108 },
    nose: { hipX: 0.12, hipY: -0.05, thigh: 0.42, shin: 0.42, chestY: 0.12, neckY: 0.32, shX: 0.23, shY: 0.22, upper: 0.29, fore: 0.26, headY: 0.14, head: 0.11 },
    driver: { hipX: 0.13, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.13, neckY: 0.34, shX: 0.25, shY: 0.24, upper: 0.31, fore: 0.28, headY: 0.15, head: 0.115 },
    radar: { hipX: 0.11, hipY: -0.05, thigh: 0.47, shin: 0.46, chestY: 0.12, neckY: 0.315, shX: 0.215, shY: 0.22, upper: 0.3, fore: 0.27, headY: 0.14, head: 0.105 },
    lady: { hipX: 0.12, hipY: -0.05, thigh: 0.42, shin: 0.41, chestY: 0.11, neckY: 0.3, shX: 0.205, shY: 0.205, upper: 0.28, fore: 0.25, headY: 0.13, head: 0.1 },
    guy: { hipX: 0.12, hipY: -0.05, thigh: 0.45, shin: 0.44, chestY: 0.12, neckY: 0.32, shX: 0.22, shY: 0.22, upper: 0.3, fore: 0.27, headY: 0.14, head: 0.11 }
  };

  const RINGS = {
    heavy: [[-0.2, 0.25, 0.19, 0.03], [-0.1, 0.285, 0.23, 0.06], [0.0, 0.3, 0.24, 0.065], [0.1, 0.305, 0.23, 0.05], [0.19, 0.31, 0.21, 0.025], [0.27, 0.315, 0.185, 0.0], [0.32, 0.29, 0.16, -0.012], [0.35, 0.2, 0.12, -0.012], [0.37, 0.1, 0.088, 0.0]],
    mid: [[-0.2, 0.2, 0.15, 0.015], [-0.08, 0.215, 0.16, 0.025], [0.05, 0.225, 0.162, 0.022], [0.16, 0.235, 0.15, 0.01], [0.25, 0.228, 0.135, 0.0], [0.31, 0.175, 0.112, -0.01], [0.345, 0.095, 0.08, 0.0]],
    slim: [[-0.2, 0.155, 0.115, 0.0], [-0.08, 0.162, 0.115, 0.0], [0.05, 0.178, 0.118, 0.005], [0.16, 0.2, 0.124, 0.0], [0.24, 0.205, 0.116, -0.005], [0.29, 0.165, 0.1, -0.01], [0.32, 0.09, 0.072, 0.0]]
  };

  const LADIES = [
    { hair: 0xe6d49a, top: 0x8ad6cc },
    { hair: 0xe8e6e2, top: 0xc8202c },
    { hair: 0xd6cec4, top: 0x2aa47c },
    { hair: 0xf2f0ec, top: 0xc8c0e8 },
    { hair: 0xb89a7a, top: 0xd8402a }
  ];

  const PEOPLE = {
    host: {
      body: 'heavy', skin: 0xe2a88e, hair: 0x5a3820, hairHi: 0x7a5232, style: 'pomp', glasses: 0xc8a050, brow: '#3e2414', iris: '#4a3626', cheek: 'rgba(214, 110, 96, 0.35)', shape: { w: 0.93, top: 1.04, bot: 1.24, jaw: 0.26, chin: 0.3 },
      top: 0x3a8a8a, lapel: 0x2c7070, shirt: 0xf2f0ee, tie: 'tie', pants: 0x22242a, shoe: 0x141416, jacket: true, watch: true,
      eyes: ['open', 'wide', 'half', 'shut', 'side'], mouths: ['shut', 'open', 'wide', 'chew', 'o', 'smile']
    },
    waiter: {
      body: 'slim', skin: 0xd6a486, hair: 0x141012, style: 'curly', visor: true, brow: '#1a1210', iris: '#2a1c14', mustache: 'rgba(20, 14, 12, 0.95)',
      top: 0x24402e, vest: true, shirt: 0xf4f4f2, sleeve: 0x141416, tieCol: 0x101012, pants: 0x121214, shoe: 0x0c0c0e,
      eyes: ['open', 'half', 'side'], mouths: ['shut', 'open', 'smile']
    },
    actor: {
      body: 'mid', skin: 0xcdb2a2, hair: 0x2a221c, hairHi: 0x3a3028, style: 'slick', brow: '#2a1e16', iris: '#3a3028', shape: { w: 0.9, top: 1.05, bot: 1.25, jaw: 0.22, chin: 0.3 },
      top: 0x26262c, lapel: 0x1c1c22, shirt: 0xf0f0f0, tie: 'stripes', pants: 0x26262c, shoe: 0x101012, jacket: true,
      eyes: ['open', 'side'], mouths: ['shut']
    },
    nose: {
      body: 'heavy', skin: 0xf2eee8, brow: '#141414', iris: '#1a1a1a', patches: true, beak: 0xc89660,
      top: 0x4a3226, coat: 0x4a3226, scarf: 0xc41c1c, cap: 0x1c1c22, capBand: 0x3a1414, mitten: 0xc41c1c, pants: 0x2a2a2a, shoe: 0x1a1a1a,
      eyes: ['open', 'shut'], mouths: ['shut', 'open']
    },
    driver: {
      body: 'heavy', skin: 0xc89276, beanie: 0x18181a, brow: '#2a1e16', iris: '#2a1e16', mustache: 'rgba(52, 36, 26, 0.95)', cheek: 'rgba(170, 80, 64, 0.3)',
      top: 0x2a2a2c, leather: true, pants: 0x1e1e22, shoe: 0x121214,
      eyes: ['open', 'half', 'wide'], mouths: ['shut', 'open', 'wide']
    },
    radar: {
      body: 'slim', skin: 0xf0c8b0, hair: 0xd8642a, hairHi: 0xe87a3a, style: 'spiky', brow: '#b85a2a', iris: '#4a6a7a', freckles: true,
      top: 0xf4f4f2, shirtOnly: true, tieCol: 0x6a1414, pants: 0x121214, shoe: 0x0c0c0e, headset: true,
      eyes: ['open', 'wide', 'half'], mouths: ['shut', 'open', 'wide', 'chew', 'o']
    },
    lady: {
      body: 'mid', skin: 0xe2b8a4, hair: 0xe6d49a, style: 'bob', brow: '#7a6a5a', iris: '#4a5a6a', lips: '#b8505a',
      top: 0x8ad6cc, pants: 0x3a4a6a, shoe: 0x1a1a1a,
      eyes: ['open', 'half'], mouths: ['shut', 'open']
    },
    guy: {
      body: 'mid', skin: 0xd8a888, hair: 0x1a1410, hairHi: 0x2a2018, style: 'short', brow: '#1a1410', iris: '#2a1c14', cheek: 'rgba(170, 90, 70, 0.2)',
      top: 0x3a3a40, pants: 0x1e1e22, shoe: 0x121214,
      eyes: ['open', 'wide'], mouths: ['shut', 'open', 'wide']
    }
  };

  function surfaceAt(kind, y) {
    const R = RINGS[kind];
    for (let i = 0; i < R.length - 1; i++) {
      const a = R[i], b = R[i + 1];
      if (y <= b[0]) {
        const k = clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
        return { rx: a[1] + (b[1] - a[1]) * k, rz: a[2] + (b[2] - a[2]) * k, cz: a[3] + (b[3] - a[3]) * k };
      }
    }
    const l = R[R.length - 1];
    return { rx: l[1], rz: l[2], cz: l[3] };
  }

  function onSurface(kind, a, y, lift) {
    const s = surfaceAt(kind, y);
    const k = 1 + (lift || 0);
    return [S(a) * s.rx * k, y, s.cz + C(a) * s.rz * k];
  }

  function surfaceBand(b, kind, y0, y1, a0f, a1f, lift, col, nv, nu) {
    const pt = (u, v) => {
      const y = y0 + (y1 - y0) * v;
      const a = a0f(y) + (a1f(y) - a0f(y)) * u;
      return onSurface(kind, a, y, lift);
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const yy = y0 + (y1 - y0) * (v0 + v1) / 2;
        const am = a0f(yy) + (a1f(yy) - a0f(yy)) * (u0 + u1) / 2;
        const n = V3.norm([S(am), 0, C(am)]);
        b.quad(pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1), col, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [n, n, n, n]);
      }
    }
  }

  function vOpen(top, bottom, half) {
    return (y) => half * clamp((y - bottom) / (top - bottom), 0, 1);
  }

  function buildTorso(b, P) {
    const R = RINGS[P.body];
    const n = R.length;
    const top = P.vest ? P.shirt : P.top;
    loft(b, R.map(([y, rx, rz, cz], i) => ring(y, rx, rz, cz, i === n - 1 ? (P.coat ? P.scarf : P.shirt || P.skin) : top)), 16, { capBottom: true });
    if (P.leather) {
      [-0.12, 0.05, 0.2].forEach(y => {
        const s = surfaceAt(P.body, y);
        b.at(0, y, s.cz, h => loft(h, [ring(-0.006, s.rx * 1.01, s.rz * 1.01, 0, shade(P.top, 0.7)), ring(0.006, s.rx * 1.01, s.rz * 1.01, 0, shade(P.top, 0.7))], 16));
      });
      const pts = [];
      for (let y = R[0][0]; y < R[n - 2][0]; y += 0.04) pts.push(onSurface(P.body, 0.06, y, 0.012));
      K.tube(b, pts, pts.map(() => 0.005), 4, 0x6a6a6a);
    }
    if (P.coat) {
      b.at(0, 0.31, -0.01, h => h.ellipsoid(0.17, 0.07, 0.15, 12, 6, P.scarf));
      K.tube(b, [[0.06, 0.3, 0.12], [0.1, 0.18, 0.2], [0.1, 0.0, 0.22], [0.08, -0.16, 0.2]], [0.045, 0.05, 0.05, 0.04], 6, P.scarf);
      K.tube(b, [[-0.04, 0.3, 0.13], [-0.08, 0.2, 0.21], [-0.12, 0.06, 0.24]], [0.04, 0.045, 0.04], 6, shade(P.scarf, 0.9));
    }
  }

  function buildFront(b, P) {
    const kind = P.body;
    const R = RINGS[kind];
    const yTop = R[R.length - 2][0] + 0.005;
    if (P.jacket || P.vest) {
      const yV = P.vest ? 0.02 : -0.06;
      const half = P.vest ? 0.34 : 0.27;
      const ao = vOpen(yTop, yV, half);
      surfaceBand(b, kind, yV, yTop, y => -ao(y), y => ao(y), 0.012, P.shirt, 4, 4);
      if (P.jacket) {
        surfaceBand(b, kind, yV, yTop, y => ao(y), y => ao(y) + 0.2, 0.016, P.lapel, 4, 1);
        surfaceBand(b, kind, yV, yTop, y => -ao(y) - 0.2, y => -ao(y), 0.016, P.lapel, 4, 1);
        [-0.12, -0.2].forEach(y => b.at(...onSurface(kind, 0.03, y, 0.02), h => h.ellipsoid(0.01, 0.01, 0.006, 5, 3, 0x1a1a1a)));
      }
    } else if (P.shirtOnly) {
      [0.18, 0.08, -0.02, -0.12].forEach(y => b.at(...onSurface(kind, 0, y, 0.01), h => h.ellipsoid(0.007, 0.007, 0.004, 5, 3, 0xd8d8d0)));
    }
    if (P.jacket || P.vest || P.shirtOnly) {
      const k = P.body === 'heavy' ? 1.16 : P.body === 'slim' ? 0.9 : 1.0;
      const s = surfaceAt(kind, yTop);
      b.at(0, yTop + 0.01, s.cz + 0.01, h => loft(h, [ring(-0.012, 0.088 * k, 0.082 * k, 0, P.shirt || P.top), ring(0.035, 0.078 * k, 0.074 * k, 0, P.shirt || P.top)], 14));
    }
  }

  function buildTie(b, P) {
    const kind = P.body;
    const R = RINGS[kind];
    const yTop = R[R.length - 2][0] + 0.01;
    const yEnd = P.jacket ? -0.17 : P.vest ? 0.04 : -0.1;
    const half = (y) => (0.026 + 0.03 * clamp((yTop - y) / (yTop - yEnd), 0, 1)) / surfaceAt(kind, y).rx;
    surfaceBand(b, kind, yEnd, yTop - 0.02, y => -half(y), y => half(y), 0.02, [1, 1, 1, 0.1], 6, 2);
    const knot = onSurface(kind, 0, yTop - 0.012, 0.025);
    b.at(knot[0], knot[1], knot[2], h => h.ellipsoid(0.022, 0.02, 0.012, 6, 4, [1, 1, 1, 0.1]));
  }

  function buildVest(b, P) {
    const kind = P.body;
    const ao = vOpen(0.27, 0.02, 0.34);
    surfaceBand(b, kind, -0.2, 0.27, y => ao(y), y => 2 * PI - ao(y), 0.008, [1, 1, 1, 0.05], 6, 16);
  }

  function buildPelvis(b, P) {
    const w = P.body === 'heavy' ? 1.22 : P.body === 'slim' ? 0.84 : 1.0;
    const col = P.vest ? P.pants : P.jacket || P.leather ? P.top : P.pants;
    loft(b, [ring(-0.17, 0.15 * w, 0.12 * w, -0.01, P.pants), ring(-0.09, 0.19 * w, 0.15 * w, -0.01, P.pants), ring(0.02, 0.2 * w, 0.16 * w, 0.0, col), ring(0.09, 0.2 * w, 0.16 * w, 0.01, col)], 14, { capBottom: true, capTop: true });
    if (P.coat) loft(b, [ring(-0.62, 0.3 * w, 0.27 * w, 0.02, P.coat), ring(-0.3, 0.25 * w, 0.21 * w, 0.02, P.coat), ring(0.0, 0.21 * w, 0.17 * w, 0.0, P.coat), ring(0.09, 0.2 * w, 0.16 * w, 0.01, P.coat)], 14);
  }

  function buildUpper(b, D, P, k) {
    const col = P.vest ? P.shirt : P.sleeve || P.top;
    b.at(0, -0.02, 0, h => h.ellipsoid(0.07 * k, 0.066 * k, 0.072 * k, 8, 5, P.vest ? P.shirt : P.top));
    loft(b, [ring(-D.upper - 0.01, 0.058 * k, 0.06 * k, 0, col), ring(-0.18, 0.07 * k, 0.072 * k, 0, col), ring(-0.04, 0.08 * k, 0.082 * k, 0, P.vest ? P.shirt : col), ring(0.03, 0.076 * k, 0.078 * k, 0, P.vest ? P.shirt : P.top)], 10, { capBottom: true });
  }

  function buildFore(b, D, P, k) {
    const col = P.sleeve || P.top;
    b.ellipsoid(0.06 * k, 0.06 * k, 0.06 * k, 8, 5, col);
    loft(b, [ring(-D.fore + 0.005, 0.044 * k, 0.047 * k, 0, col), ring(-0.16, 0.054 * k, 0.057 * k, 0, col), ring(0.0, 0.058 * k, 0.06 * k, 0, col)], 10, { capBottom: true });
    const cuff = P.jacket ? P.shirt : P.shirtOnly ? P.top : shade(col, 0.8);
    b.at(0, -D.fore + 0.02, 0, h => h.prism(10, 0.046 * k, 0.048 * k, -0.025, 0.045 * k, 0.047 * k, 0.02, cuff));
    if (P.watch) b.at(0, -D.fore + 0.04, 0, h => h.prism(10, 0.05 * k, 0.052 * k, -0.012, 0.05 * k, 0.052 * k, 0.012, 0x3a2a1a));
  }

  function buildHand(b, col, side, grip, k) {
    const inward = side === 'L' ? -1 : 1;
    b.at(0, -0.045 * k, 0, h => h.box(0.032 * k, 0.09 * k, 0.088 * k, col));
    if (grip === 'fist' || grip === 'hold') {
      b.at(inward * 0.012 * k, -0.1 * k, 0, h => h.box(0.052 * k, 0.046 * k, 0.082 * k, col));
    } else if (grip === 'point' || grip === 'gun') {
      b.at(inward * 0.012 * k, -0.095 * k, -0.012 * k, h => h.box(0.046 * k, 0.04 * k, 0.062 * k, col));
      b.at(0, -0.125 * k, 0.03 * k, h => h.box(0.022 * k, 0.08 * k, 0.022 * k, col));
      if (grip === 'gun') {
        b.push(M4.translate(inward * 0.01 * k, -0.04 * k, 0.05 * k), M4.rotX(-1.2));
        b.at(0, -0.03 * k, 0, h => h.box(0.022 * k, 0.055 * k, 0.022 * k, col));
        b.pop();
        return;
      }
    } else if (grip === 'thumb') {
      b.at(inward * 0.012 * k, -0.1 * k, 0, h => h.box(0.052 * k, 0.046 * k, 0.082 * k, col));
      b.push(M4.translate(0, -0.06 * k, 0.05 * k), M4.rotX(-1.4));
      b.at(0, -0.035 * k, 0, h => h.box(0.024 * k, 0.065 * k, 0.024 * k, col));
      b.pop();
      return;
    } else if (grip === 'open' || grip === 'spread') {
      const n = grip === 'spread' ? 4 : 1;
      if (n === 1) b.at(0, -0.125 * k, 0, h => h.box(0.022 * k, 0.075 * k, 0.084 * k, col));
      else [-0.03, -0.01, 0.01, 0.03].forEach((z, i) => {
        b.push(M4.translate(0, -0.09 * k, z * k), M4.rotX((i - 1.5) * 0.18));
        b.at(0, -0.035 * k, 0, h => h.box(0.02 * k, 0.07 * k, 0.016 * k, col));
        b.pop();
      });
    } else {
      b.push(M4.translate(0, -0.09 * k, 0), M4.rotZ(-inward * 0.35));
      b.at(0, -0.032 * k, 0, h => h.box(0.026 * k, 0.065 * k, 0.082 * k, col));
      b.pop();
    }
    b.push(M4.translate(inward * 0.012 * k, -0.03 * k, 0.05 * k), M4.rotX(-0.5));
    b.at(0, -0.025 * k, 0, h => h.box(0.022 * k, 0.05 * k, 0.022 * k, col));
    b.pop();
  }

  function buildThigh(b, D, P, k) {
    const col = P.pants;
    loft(b, [ring(-D.thigh - 0.02, 0.08 * k, 0.082 * k, 0, col), ring(-0.3, 0.092 * k, 0.096 * k, 0, col), ring(-0.12, 0.108 * k, 0.112 * k, 0.005, col), ring(0.05, 0.115 * k, 0.115 * k, 0, col)], 10, { capBottom: true, capTop: true });
  }

  function buildShin(b, D, P, k) {
    const col = P.pants;
    b.ellipsoid(0.066 * k, 0.064 * k, 0.07 * k, 8, 5, col);
    loft(b, [ring(-D.shin + 0.02, 0.048 * k, 0.05 * k, 0, col), ring(-0.3, 0.056 * k, 0.062 * k, 0, col), ring(0, 0.066 * k, 0.07 * k, 0, col)], 10, { capBottom: true });
  }

  function buildFoot(b, P) {
    b.at(0, -0.04, 0, h => h.ellipsoid(0.048, 0.042, 0.052, 7, 4, P.shoe));
    b.at(0, -0.065, 0.06, h => h.box(0.095, 0.055, 0.22, P.shoe));
  }

  const FACE = { Y0: -1.0, Y1: 1.0, P0: -1.15, P1: 0.45 };
  const SHAPE = { w: 0.95, top: 1.04, bot: 1.12, jaw: 0.13, chin: 0.24, back: 0.93 };

  function headDir(yaw, pit) {
    return [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
  }

  function headPt(P, R, yaw, pit, k) {
    const sh = P.shape;
    const n = headDir(yaw, pit);
    const low = Math.max(0, -n[1]);
    const front = Math.max(0, n[2]);
    const x = n[0] * R * sh.w * (1 + sh.jaw * low * (1 - 0.75 * low));
    const y = n[1] * R * (n[1] > 0 ? sh.top : sh.bot);
    const z = n[2] * R * (n[2] > 0 ? 1.0 + sh.chin * low * front * front : sh.back);
    const s = k || 1;
    return [x * s, y * s, z * s];
  }

  function headNormal(P, R, yaw, pit) {
    const e = 0.01;
    const a = headPt(P, R, yaw - e, pit), b = headPt(P, R, yaw + e, pit), c = headPt(P, R, yaw, pit - e), d = headPt(P, R, yaw, pit + e);
    const n = V3.norm(V3.cross(V3.sub(b, a), V3.sub(d, c)));
    return V3.dot(n, headPt(P, R, yaw, pit)) < 0 ? V3.mul(n, -1) : n;
  }

  function headPatch(b, P, R, y0, y1, p0, p1, nu, nv, k, col, uvFn) {
    const kk = typeof k === 'function' ? k : () => k;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const ya = y0 + (y1 - y0) * (i / nu), yb = y0 + (y1 - y0) * ((i + 1) / nu);
        const pa = p0 + (p1 - p0) * (j / nv), pb = p0 + (p1 - p0) * ((j + 1) / nv);
        const v = [[ya, pa], [yb, pa], [yb, pb], [ya, pb]];
        const pts = v.map(([y, p]) => headPt(P, R, y, p, kk(y, p)));
        const ns = v.map(([y, p]) => headNormal(P, R, y, p));
        const cols = typeof col === 'function' ? v.map(([y, p]) => rgb(col(y, p))) : col;
        b.quad(pts[0], pts[1], pts[2], pts[3], cols, uvFn ? v.map(([y, p]) => uvFn(y, p)) : null, ns);
      }
    }
  }

  function buildHead(b, P, R) {
    const sk = P.skin;
    headPatch(b, P, R, -PI, PI, -PI / 2, PI / 2, 22, 14, 1, (y, p) => (headDir(y, p)[1] < -0.75 ? shade(sk, 0.86) : sk));
    [-1, 1].forEach(s => {
      const e = headPt(P, R, s * PI / 2, -0.12, 0.98);
      b.at(e[0], e[1], e[2], h => h.ellipsoid(R * 0.13, R * 0.25, R * 0.17, 6, 4, shade(sk, 0.86)));
    });
    const n = headPt(P, R, 0, -0.22, 1.0);
    if (P.beak) {
      b.push(M4.translate(n[0], n[1], n[2] - R * 0.08), M4.rotX(PI / 2 + 0.12));
      b.prism(8, R * 0.14, R * 0.13, 0, R * 0.012, R * 0.012, R * 3.3, P.beak, { capBottom: true });
      b.pop();
    } else {
      b.at(n[0], n[1] + R * 0.02, n[2] + R * 0.02, h => h.ellipsoid(R * 0.12, R * 0.2, R * 0.13, 7, 5, shade(sk, 0.97)));
      [-1, 1].forEach(s => b.at(n[0] + s * R * 0.08, n[1] - R * 0.12, n[2], h => h.ellipsoid(R * 0.06, R * 0.05, R * 0.06, 5, 4, shade(sk, 0.93))));
    }
  }

  const HAIR = {
    pomp: {
      line: (a) => a < 0.45 ? 0.74 - 0.1 * a : a < 1.2 ? 0.7 - 0.62 * (a - 0.45) / 0.75 : a < 1.9 ? 0.08 - 0.28 * (a - 1.2) / 0.7 : -0.2 - 0.25 * clamp((a - 1.9) / 0.9, 0, 1),
      scale: (yaw, pit) => {
        const top = clamp((pit - 0.25) / 1.0, 0, 1);
        const front = Math.max(0, C(yaw - 0.3));
        const quiff = front * clamp(1 - Math.abs(pit - 0.85) / 0.55, 0, 1) * 0.5;
        const side = Math.abs(S(yaw)) * clamp((pit + 0.25) / 0.6, 0, 1) * clamp((1.35 - pit) / 0.7, 0, 1) * 0.24;
        const back = Math.max(0, -C(yaw)) * clamp((pit + 0.3) / 0.8, 0, 1) * 0.1;
        return 1.05 + 0.3 * top + quiff + side + back;
      }
    },
    slick: { line: (a) => a < 0.6 ? 0.72 : a < 1.4 ? 0.72 - 0.42 * (a - 0.6) / 0.8 : 0.3 - 0.5 * clamp((a - 1.4) / 1.0, 0, 1), scale: (yaw, pit) => 1.035 + 0.04 * clamp(pit, 0, 1) },
    short: { line: (a) => a < 0.6 ? 0.78 : a < 1.4 ? 0.78 - 0.5 * (a - 0.6) / 0.8 : 0.28 - 0.55 * clamp((a - 1.4) / 1.0, 0, 1), scale: () => 1.03 },
    bob: { line: (a) => a < 0.55 ? 0.6 : a < 1.3 ? 0.6 - 1.1 * (a - 0.55) / 0.75 : -0.5 - 0.15 * clamp((a - 1.3) / 1.0, 0, 1), scale: (yaw, pit) => 1.1 + 0.08 * clamp(pit, 0, 1) + 0.08 * Math.abs(S(yaw)) * clamp(0.6 - pit, 0, 1) },
    curly: { line: (a) => a < 0.6 ? 0.62 : a < 1.4 ? 0.62 - 0.6 * (a - 0.6) / 0.8 : 0.02 - 0.4 * clamp((a - 1.4) / 1.0, 0, 1), scale: (yaw, pit) => 1.14 + 0.05 * S(yaw * 7) * S(pit * 6) },
    spiky: { line: (a) => a < 0.6 ? 0.68 : a < 1.4 ? 0.68 - 0.48 * (a - 0.6) / 0.8 : 0.2 - 0.45 * clamp((a - 1.4) / 1.0, 0, 1), scale: () => 1.07 },
    beanie: { line: (a) => a < 0.8 ? 0.36 : a < 1.6 ? 0.36 - 0.36 * (a - 0.8) / 0.8 : 0.0 - 0.3 * clamp((a - 1.6) / 1.0, 0, 1), scale: (yaw, pit) => 1.1 + 0.06 * clamp(pit, 0, 1) }
  };

  function hairShell(b, P, R, spec, col, hi, inner) {
    const nu = 30, nv = 9;
    for (let i = 0; i < nu; i++) {
      const ya = -PI + (2 * PI * i) / nu, yb = -PI + (2 * PI * (i + 1)) / nu;
      const ha = spec.line(Math.abs(ya)), hb = spec.line(Math.abs(yb));
      for (let j = 0; j < nv; j++) {
        const ka = j / nv, kb = (j + 1) / nv;
        const p = (h, k) => h + (PI / 2 - h) * k;
        const v = [[ya, p(ha, ka)], [yb, p(hb, ka)], [yb, p(hb, kb)], [ya, p(ha, kb)]];
        const pts = v.map(([y, pp]) => headPt(P, R, y, pp, spec.scale(y, pp)));
        const ns = v.map(([y, pp]) => headNormal(P, R, y, pp));
        b.quad(pts[0], pts[1], pts[2], pts[3], (i * 3 + j) % 7 === 0 ? hi : col, null, ns);
      }
      const e0 = headPt(P, R, ya, ha, spec.scale(ya, ha)), e1 = headPt(P, R, yb, hb, spec.scale(yb, hb));
      const i0 = headPt(P, R, ya, ha - 0.05, 1.0), i1 = headPt(P, R, yb, hb - 0.05, 1.0);
      b.quad(i0, i1, e1, e0, inner || shade(col, 0.75));
    }
  }

  function buildHair(b, P, R) {
    const H = P.hair, Hi = P.hairHi || shade(P.hair, 1.18);
    const spec = HAIR[P.style];
    hairShell(b, P, R, spec, H, Hi);
    if (P.style === 'pomp') {
      const crest = [];
      for (let i = 0; i <= 10; i++) {
        const yaw = -0.7 + i * 0.14;
        crest.push(headPt(P, R, yaw, 0.92, spec.scale(yaw, 0.92) + 0.02));
      }
      K.tube(b, crest, crest.map((p, i) => R * (0.05 + 0.07 * S((i / 10) * PI))), 6, Hi);
    } else if (P.style === 'curly') {
      for (let i = 0; i < 40; i++) {
        const yaw = -PI + ((i * 0.618) % 1) * 2 * PI;
        const pit = spec.line(Math.abs(yaw)) + 0.12 + ((i * 0.382) % 1) * 1.2;
        const p = headPt(P, R, yaw, Math.min(pit, 1.45), spec.scale(yaw, pit) + 0.02);
        b.at(p[0], p[1], p[2], h => h.ellipsoid(R * 0.17, R * 0.14, R * 0.17, 6, 4, i % 3 ? H : 0x2a201a));
      }
    } else if (P.style === 'spiky') {
      for (let i = 0; i < 46; i++) {
        const yaw = -PI + ((i * 0.618) % 1) * 2 * PI;
        const pit = spec.line(Math.abs(yaw)) + 0.08 + ((i * 0.382) % 1) * 1.3;
        const base = headPt(P, R, yaw, Math.min(pit, 1.45), 1.04);
        const dir = V3.norm(V3.add(headDir(yaw, pit), [0, 0.4, Math.abs(yaw) < 0.8 ? 0.25 : -0.1]));
        const len = R * (0.4 + ((i * 0.77) % 1) * 0.5);
        K.tube(b, [base, V3.add(base, V3.mul(dir, len))], [R * 0.14, R * 0.012], 5, i % 3 ? H : Hi);
      }
    }
  }

  function ringAt(P, R, pit, k, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(headPt(P, R, -PI + (2 * PI * i) / n, pit, k));
    return pts;
  }

  function buildHeadwear(b, P, R) {
    if (P.visor) {
      const band = ringAt(P, R, 0.52, 1.16, 24);
      K.tube(b, band, band.map(() => R * 0.11), 4, 0xf8f8f6);
      const f = headPt(P, R, 0, 0.5, 1.2);
      b.push(M4.translate(f[0], f[1], f[2] + R * 0.25), M4.rotX(0.28));
      b.ellipsoid(R * 0.95, R * 0.05, R * 0.6, 14, 3, 0xf8f8f6);
      b.pop();
    }
    if (P.beanie) {
      hairShell(b, P, R, HAIR.beanie, P.beanie, shade(P.beanie, 1.35), shade(P.beanie, 0.6));
      const band = [];
      for (let i = 0; i <= 24; i++) {
        const yaw = -PI + (2 * PI * i) / 24;
        band.push(headPt(P, R, yaw, HAIR.beanie.line(Math.abs(yaw)) + 0.12, 1.16));
      }
      K.tube(b, band, band.map(() => R * 0.13), 5, shade(P.beanie, 1.25));
    }
    if (P.cap) {
      const band = ringAt(P, R, 0.55, 1.08, 20);
      K.tube(b, band, band.map(() => R * 0.12), 5, P.capBand);
      b.at(0, R * 0.62, -R * 0.08, h => h.prism(16, R * 0.96, R * 1.0, 0, R * 1.15, R * 1.2, R * 0.5, P.cap, { capBottom: true }));
      const f = headPt(P, R, 0, 0.5, 1.12);
      b.push(M4.translate(f[0], f[1], f[2] + R * 0.18), M4.rotX(0.42));
      b.ellipsoid(R * 0.78, R * 0.04, R * 0.42, 10, 3, 0x0e0e10);
      b.pop();
    }
    if (P.headset) {
      [-1, 1].forEach(s => b.at(s * R * 1.0, -R * 1.6, R * 0.25, h => {
        h.push(M4.rotZ(s * 0.3));
        h.ellipsoid(R * 0.3, R * 0.42, R * 0.42, 10, 6, 0xe8e6e0);
        h.pop();
      }));
      K.tube(b, [[-R * 1.05, -R * 1.5, R * 0.3], [-R * 0.6, -R * 1.85, R * 0.9], [R * 0.6, -R * 1.85, R * 0.9], [R * 1.05, -R * 1.5, R * 0.3]], [R * 0.08, R * 0.08, R * 0.08, R * 0.08], 6, 0xd8d6d0);
      K.tube(b, [[R * 1.0, -R * 1.7, R * 0.4], [R * 0.6, -R * 2.6, R * 1.1], [R * 0.2, -R * 3.6, R * 1.3]], [R * 0.03, R * 0.03, R * 0.03], 4, 0x2a2a2a);
    }
  }

  function eyePoint(P, R, s) {
    return headPt(P, R, s * 0.34, 0.1, 1.0);
  }

  function buildGlasses(b, P, R) {
    const col = P.glasses;
    [-1, 1].forEach(s => {
      const c = eyePoint(P, R, s);
      const cz = c[2] + R * 0.12;
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * PI * 2;
        const rx = R * 0.4, ry = R * (S(a) < 0 ? 0.38 : 0.3);
        const outer = s * C(a) > 0 ? C(a) * C(a) : 0;
        pts.push([c[0] + C(a) * rx, c[1] + R * 0.02 + S(a) * ry, cz - outer * R * 0.08]);
      }
      K.tube(b, pts, pts.map(() => R * 0.024), 4, col);
      const ear = headPt(P, R, s * 1.5, 0.12, 1.05);
      K.tube(b, [[c[0] + s * R * 0.4, c[1] + R * 0.12, cz - R * 0.08], [ear[0] + s * R * 0.04, ear[1], ear[2] + R * 0.3], ear], [R * 0.02, R * 0.02, R * 0.02], 4, col);
    });
    const l = eyePoint(P, R, -1), r = eyePoint(P, R, 1);
    const z = Math.max(l[2], r[2]) + R * 0.12;
    K.tube(b, [[l[0] + R * 0.36, l[1] + R * 0.24, z], [0, l[1] + R * 0.28, z + R * 0.02], [r[0] - R * 0.36, r[1] + R * 0.24, z]], [R * 0.02, R * 0.02, R * 0.02], 4, col);
  }

  function buildLenses(b, P, R) {
    [-1, 1].forEach(s => {
      const c = eyePoint(P, R, s);
      K.discXY(b, c[0], c[1] + R * 0.02, c[2] + R * 0.11, R * 0.36, 16, [0.85, 0.9, 1.0, 1]);
    });
  }

  function faceUv(y, p) {
    return [(y - FACE.Y0) / (FACE.Y1 - FACE.Y0), (p - FACE.P0) / (FACE.P1 - FACE.P0)];
  }

  function drawFace(P, eyes, mouth) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const ey = 57;
      const EX = [84, 172];
      if (P.patches) {
        ctx.fillStyle = '#121212';
        EX.forEach((x, i) => {
          ctx.beginPath();
          ctx.ellipse(x, ey + 2, 30, 30, (i ? 1 : -1) * 0.3, 0, PI * 2);
          ctx.fill();
        });
      }
      if (P.cheek) {
        ctx.fillStyle = P.cheek;
        [62, 194].forEach(x => {
          ctx.beginPath();
          ctx.ellipse(x, 118, 24, 18, 0, 0, PI * 2);
          ctx.fill();
        });
      }
      if (P.freckles) {
        ctx.fillStyle = 'rgba(190, 110, 70, 0.6)';
        for (let i = 0; i < 30; i++) {
          const x = 66 + ((i * 53) % 124), y = 86 + ((i * 29) % 36);
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, PI * 2);
          ctx.fill();
        }
      }
      if (!P.patches) {
        ctx.strokeStyle = P.brow;
        ctx.lineWidth = 8;
        EX.forEach((x, i) => {
          const s = i ? 1 : -1;
          const lift = eyes === 'wide' ? -9 : eyes === 'half' ? 4 : 0;
          ctx.beginPath();
          ctx.moveTo(x - s * 22, ey - 24 + lift);
          ctx.quadraticCurveTo(x, ey - 38 + lift, x + s * 24, ey - 28 + lift);
          ctx.stroke();
        });
      }
      EX.forEach(x => {
        if (eyes === 'shut') {
          ctx.strokeStyle = P.patches ? '#f0f0f0' : '#2a1c16';
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(x - 15, ey + 1);
          ctx.quadraticCurveTo(x, ey + 8, x + 15, ey + 1);
          ctx.stroke();
          return;
        }
        const big = P.bigEyes ? 1.15 : 1;
        const tall = (eyes === 'wide' ? 14 : eyes === 'half' ? 6 : 10) * big;
        ctx.fillStyle = '#f4eee8';
        ctx.beginPath();
        ctx.ellipse(x, ey + 2, 16 * big, tall, 0, 0, PI * 2);
        ctx.fill();
        const dx = eyes === 'side' ? -8 : 0;
        ctx.fillStyle = P.iris;
        ctx.beginPath();
        ctx.ellipse(x + dx, ey + 2, 7, Math.min(8.5, tall), 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0e0a0a';
        ctx.beginPath();
        ctx.ellipse(x + dx, ey + 2, 3, 3.6, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(x + dx + 2.5, ey - 1.5, 1.6, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = P.patches ? '#000000' : '#2e1e18';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 17, ey + 2 - tall * 0.5);
        ctx.quadraticCurveTo(x, ey - tall - 3, x + 17, ey + 2 - tall * 0.5);
        ctx.stroke();
        if (!P.patches) {
          ctx.strokeStyle = 'rgba(120, 70, 56, 0.45)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - 13, ey + tall + 5);
          ctx.quadraticCurveTo(x, ey + tall + 9, x + 13, ey + tall + 5);
          ctx.stroke();
        }
      });
      if (P.mustache) {
        ctx.fillStyle = P.mustache;
        ctx.beginPath();
        ctx.moveTo(90, 152);
        ctx.quadraticCurveTo(104, 124, 128, 132);
        ctx.quadraticCurveTo(152, 124, 166, 152);
        ctx.quadraticCurveTo(148, 142, 128, 144);
        ctx.quadraticCurveTo(108, 142, 90, 152);
        ctx.fill();
      }
      const my = 162;
      ctx.fillStyle = '#3c1414';
      ctx.strokeStyle = P.lips || '#8a4038';
      ctx.lineWidth = 5;
      if (mouth === 'shut') {
        ctx.beginPath();
        ctx.moveTo(104, my);
        ctx.quadraticCurveTo(128, my + 4, 152, my);
        ctx.stroke();
      } else if (mouth === 'chew') {
        ctx.fillStyle = 'rgba(200, 110, 96, 0.3)';
        [70, 186].forEach(x => {
          ctx.beginPath();
          ctx.ellipse(x, 146, 28, 22, 0, 0, PI * 2);
          ctx.fill();
        });
        ctx.beginPath();
        ctx.moveTo(112, my + 2);
        ctx.quadraticCurveTo(128, my - 8, 144, my + 2);
        ctx.quadraticCurveTo(128, my + 10, 112, my + 2);
        ctx.stroke();
      } else if (mouth === 'smile') {
        ctx.beginPath();
        ctx.moveTo(96, my - 8);
        ctx.quadraticCurveTo(128, my + 30, 160, my - 8);
        ctx.quadraticCurveTo(128, my + 8, 96, my - 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ece4da';
        ctx.fillRect(108, my - 4, 40, 7);
      } else if (mouth === 'o') {
        ctx.beginPath();
        ctx.ellipse(128, my + 4, 11, 16, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        const hh = mouth === 'wide' ? 22 : 12;
        ctx.beginPath();
        ctx.ellipse(128, my + 4, mouth === 'wide' ? 22 : 17, hh, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e8e0d6';
        ctx.fillRect(113, my - hh + 6, 30, 5);
        if (mouth === 'wide') {
          ctx.fillStyle = '#b84a4a';
          ctx.beginPath();
          ctx.ellipse(128, my + hh - 2, 13, 7, 0, 0, PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };
  }

  function tieTex(kind) {
    return (ctx, w, h) => {
      if (kind === 'stripes') {
        ctx.fillStyle = '#3a3a40';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#c8c8cc';
        ctx.lineWidth = w * 0.08;
        for (let i = -4; i < 8; i++) {
          ctx.beginPath();
          ctx.moveTo(i * w * 0.3, 0);
          ctx.lineTo(i * w * 0.3 + w, h);
          ctx.stroke();
        }
        return;
      }
      window.KalamArt.TEX.tie(ctx, w, h);
    };
  }

  function buildPerson(r, who, look) {
    const P = Object.assign({}, PEOPLE[who], look || {});
    P.shape = Object.assign({}, SHAPE, P.shape || {});
    const D = DIMS[who];
    const R = D.head;
    const k = P.body === 'heavy' ? 1.16 : P.body === 'slim' ? 0.9 : 1.0;
    const faces = {};
    const fs = who === 'host' || who === 'radar' ? 256 : 128;
    P.eyes.forEach(e => P.mouths.forEach(mo => { faces[e + '-' + mo] = r.texture(fs, drawFace(P, e, mo), { clamp: true }); }));
    const handCol = P.mitten || P.skin;
    const hands = {};
    ['L', 'R'].forEach(s => ['relax', 'open', 'spread', 'fist', 'hold', 'point', 'gun', 'thumb'].forEach(gr => { hands[s + gr] = mesh(r, b => buildHand(b, handCol, s, gr, k)); }));
    const out = {
      P, D, faces, hands,
      torso: mesh(r, b => buildTorso(b, P)),
      front: mesh(r, b => buildFront(b, P)),
      tie: P.tie || P.tieCol ? mesh(r, b => buildTie(b, P)) : null,
      tieTex: P.tie ? r.texture(64, tieTex(P.tie), { height: 128 }) : null,
      vest: P.vest ? mesh(r, b => buildVest(b, P)) : null,
      pelvis: mesh(r, b => buildPelvis(b, P)),
      upper: mesh(r, b => buildUpper(b, D, P, k)),
      fore: mesh(r, b => buildFore(b, D, P, k)),
      thigh: mesh(r, b => buildThigh(b, D, P, k)),
      shin: mesh(r, b => buildShin(b, D, P, k)),
      foot: mesh(r, b => buildFoot(b, P)),
      neck: mesh(r, b => loft(b, [ring(-0.06, 0.07 * k, 0.065 * k, 0, P.skin), ring(0.1, 0.065 * k, 0.06 * k, 0.01, P.skin)], 10)),
      head: mesh(r, b => buildHead(b, P, R)),
      hair: P.hair && P.style ? mesh(r, b => buildHair(b, P, R)) : null,
      wear: mesh(r, b => buildHeadwear(b, P, R)),
      glasses: P.glasses ? mesh(r, b => buildGlasses(b, P, R)) : null,
      lenses: P.glasses ? mesh(r, b => buildLenses(b, P, R)) : null,
      face: mesh(r, b => headPatch(b, P, R, FACE.Y0, FACE.Y1, FACE.P0, FACE.P1, 14, 12, 1.006, [1, 1, 1, 0], faceUv))
    };
    if (P.vest) out.vestTex = r.texture(128, window.KalamArt.TEX.tartan);
    return out;
  }

  function build(r) {
    const out = {};
    Object.keys(PEOPLE).forEach(who => { if (who !== 'lady') out[who] = buildPerson(r, who); });
    out.ladies = LADIES.map(l => buildPerson(r, 'lady', l));
    out.pen = mesh(r, b => {
      b.push(M4.rotX(PI / 2));
      b.prism(6, 0.005, 0.005, 0, 0.005, 0.005, 0.13, 0x1a2a6a, { capBottom: true });
      b.pop();
    });
    out.pad = mesh(r, b => {
      b.box(0.17, 0.008, 0.24, 0x1e5a2a);
      b.at(0, 0.006, 0, h => h.box(0.15, 0.004, 0.22, 0xf2f2ee));
    });
    out.bun = mesh(r, b => b.ellipsoid(0.055, 0.04, 0.05, 10, 6, 0xc8862a));
    out.pizza = mesh(r, b => {
      b.box(0.1, 0.012, 0.12, 0xd06a2a);
      b.at(0, 0.008, 0, h => h.box(0.09, 0.006, 0.1, 0xc84a2a));
    });
    return out;
  }

  function solve(who, pose) {
    const D = DIMS[who];
    const yaw = pose.yaw || 0;
    const lean = pose.lean || 0;
    const roll = pose.roll || 0;
    const cy = C(yaw), sy = S(yaw);
    const fwd = pose.fwd || [sy, 0, cy];
    const up = pose.up || V3.norm([sy * S(lean) + cy * S(roll), C(lean) * C(roll), cy * S(lean) - sy * S(roll)]);
    return Rig.solve(Object.assign({}, pose, { p: pose.pos || [0, 0.95, 0], fwd, up }), D);
  }

  function draw(r, V, m, pose, opts) {
    const o = opts || {};
    const pass = o.flat ? { flat: o.flat } : o.alpha !== undefined ? { blend: true, alpha: o.alpha } : {};
    const tint = o.tint ? { tint: o.tint } : {};
    const with_ = (extra) => Object.assign({}, extra, pass, tint);
    const P = V.P;
    r.draw(V.pelvis, m.pelvis, with_());
    r.draw(V.torso, m.chest, with_());
    r.draw(V.front, m.chest, with_());
    if (V.vest) r.draw(V.vest, m.chest, with_({ texture: V.vestTex }));
    if (V.tie) r.draw(V.tie, m.chest, with_(V.tieTex ? { texture: V.tieTex } : { tint: rgb(P.tieCol).slice(0, 3) }));
    r.draw(V.neck, m.neck, with_());
    if (!pose.noHead) {
      r.draw(V.head, m.head, with_());
      if (!o.flat) {
        const e = P.eyes.includes(pose.eyes) ? pose.eyes : P.eyes[0];
        const mo = P.mouths.includes(pose.mouth) ? pose.mouth : P.mouths[0];
        r.draw(V.face, m.head, with_({ texture: V.faces[e + '-' + mo] }));
      }
      if (V.hair) r.draw(V.hair, m.head, with_());
      r.draw(V.wear, m.head, with_());
      if (V.glasses) {
        r.draw(V.glasses, m.head, with_());
        if (!o.flat) r.draw(V.lenses, m.head, { blend: true, alpha: 0.14 });
      }
    }
    ['L', 'R'].forEach(s => {
      r.draw(V.upper, m['upper' + s], with_());
      r.draw(V.fore, m['fore' + s], with_());
      const gr = pose['g' + s] || 'relax';
      r.draw(V.hands[s + gr] || V.hands[s + 'relax'], m['hand' + s], with_());
      if (!pose.noLegs) {
        r.draw(V.thigh, m['thigh' + s], with_());
        r.draw(V.shin, m['shin' + s], with_());
        r.draw(V.foot, m['foot' + s], with_());
      }
    });
  }

  window.KalamCast = { DIMS, PEOPLE, LADIES, RINGS, build, solve, draw, drawFace };
})();
