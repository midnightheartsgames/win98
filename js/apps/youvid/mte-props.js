(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, clamp } = K;

  const G = {
    dark: 0x3a3c3a, mid: 0x5c605c, light: 0x868a84, red: 0xb8352a, redDk: 0x7e2a22, wood: 0x4a2412, binding: 0xe0cfa6, peg: 0xc4c8cc,
    box: 0xc23a2c, latch: 0x8a8c88, glass: 0x3e220c, wrench: 0x3c3e3c, stock: 0x6a3e22, truck: 0x4a5662, chrome: 0xa8aeb4, tire: 0x1e1c1c
  };

  function cyl(b, axis, from, to, r, col, sides, opts) {
    const d = V3.sub(to, from);
    const len = V3.len(d);
    const y = V3.mul(d, 1 / len);
    let x = V3.cross(y, Math.abs(y[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]);
    x = V3.norm(x);
    const z = V3.cross(x, y);
    const M = new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, from[0], from[1], from[2], 1]);
    b.push(M);
    const r1 = Array.isArray(r) ? r[1] : r, r0 = Array.isArray(r) ? r[0] : r;
    b.prism(sides || 12, r0, r0, 0, r1, r1, len, col, Object.assign({ capBottom: true }, opts || {}));
    b.pop();
    return b;
  }

  function GUITAR_HW(x) {
    const T = [[-0.27, 0.0], [-0.266, 0.06], [-0.255, 0.105], [-0.23, 0.148], [-0.18, 0.176], [-0.11, 0.19], [-0.05, 0.185], [0.0, 0.168], [0.035, 0.148],
      [0.065, 0.138], [0.095, 0.142], [0.135, 0.15], [0.17, 0.144], [0.2, 0.124], [0.218, 0.09], [0.226, 0.05], [0.23, 0.0]];
    if (x <= T[0][0]) return 0;
    for (let i = 0; i < T.length - 1; i++) {
      if (x <= T[i + 1][0]) {
        const k = (x - T[i][0]) / (T[i + 1][0] - T[i][0]);
        const e = k * k * (3 - 2 * k);
        return lerp(T[i][1], T[i + 1][1], e);
      }
    }
    return 0;
  }

  const GB = { x0: -0.27, x1: 0.23, depth: 0.1, neck0: 0.205, nut: 0.6, head: 0.79 };

  function buildGuitarTop(b) {
    const N = 48;
    const uv = (x, y) => [(x - GB.x0) / (GB.x1 - GB.x0), (y + 0.25) / 0.5];
    const n = [0, 0, 1];
    for (let i = 0; i < N; i++) {
      const xa = lerp(GB.x0, GB.x1, i / N), xb = lerp(GB.x0, GB.x1, (i + 1) / N);
      const ha = GUITAR_HW(xa), hb = GUITAR_HW(xb);
      b.quad([xa, -ha, 0], [xb, -hb, 0], [xb, hb, 0], [xa, ha, 0], 0xffffff, [uv(xa, -ha), uv(xb, -hb), uv(xb, hb), uv(xa, ha)], [n, n, n, n]);
    }
    return b;
  }

  function buildGuitarBody(b) {
    const N = 48;
    const z0 = -GB.depth;
    const nb = [0, 0, -1];
    const outline = [];
    for (let i = 0; i <= N; i++) {
      const x = lerp(GB.x0, GB.x1, i / N);
      outline.push([x, GUITAR_HW(x)]);
    }
    for (let i = 0; i < N; i++) {
      const [xa, ha] = outline[i], [xb, hb] = outline[i + 1];
      b.quad([xa, ha, z0], [xb, hb, z0], [xb, -hb, z0], [xa, -ha, z0], 0x5a2e16, null, [nb, nb, nb, nb]);
      [1, -1].forEach(s => {
        const dx = xb - xa, dh = hb - ha;
        const nrm = V3.norm([-dh, s * dx, 0]);
        const wood = rgb(G.wood);
        b.quad([xa, s * ha, 0], [xb, s * hb, 0], [xb, s * hb, z0], [xa, s * ha, z0], [wood, wood, wood, wood], null, [nrm, nrm, nrm, nrm]);
      });
    }
    const edge = 0.006;
    for (let i = 0; i < N; i++) {
      const [xa, ha] = outline[i], [xb, hb] = outline[i + 1];
      [1, -1].forEach(s => {
        const a0 = [xa, s * ha, -edge], b0 = [xb, s * hb, -edge], a1 = [xa, s * ha, 0.0004], b1 = [xb, s * hb, 0.0004];
        const out = V3.norm([0, s, 0]);
        if (s > 0) b.quad(a0, b0, b1, a1, G.binding, null, [out, out, out, out]);
        else b.quad(b0, a0, a1, b1, G.binding, null, [out, out, out, out]);
      });
    }
    b.at(-0.135, 0, 0.004, h => h.box(0.03, 0.15, 0.008, 0x1e100a));
    b.at(-0.13, 0, 0.011, h => h.box(0.004, 0.11, 0.006, 0xefe6cf));
    return b;
  }

  function buildGuitarNeck(b) {
    const L = GB.nut - GB.neck0;
    b.push(M4.translate(GB.neck0, 0, 0));
    for (let i = 0; i < 8; i++) {
      const xa = (i / 8) * L, xb = ((i + 1) / 8) * L;
      const wa = lerp(0.027, 0.023, i / 8), wb = lerp(0.027, 0.023, (i + 1) / 8);
      for (let k = 0; k < 8; k++) {
        const a0 = PI + (k / 8) * PI, a1 = PI + ((k + 1) / 8) * PI;
        const p = (x, w, a) => [x, C(a) * w, 0.006 + S(a) * 0.024];
        const nn = (a) => V3.norm([0, C(a), S(a)]);
        b.quad(p(xa, wa, a0), p(xb, wb, a0), p(xb, wb, a1), p(xa, wa, a1), 0x6a3a1c, null, [nn(a0), nn(a0), nn(a1), nn(a1)]);
      }
    }
    b.pop();
    b.at(GB.nut + 0.002, 0, 0.012, h => h.box(0.006, 0.048, 0.01, 0xe8e0cc));
    b.push(M4.translate(GB.nut + 0.005, 0, 0.004), M4.rotY(0.12));
    b.at(0.095, 0, 0, h => h.box(0.19, 0.075, 0.02, 0x5a3016));
    [-1, 1].forEach(s => {
      b.at(0.1, s * 0.014, 0.0105, h => h.box(0.14, 0.014, 0.002, 0x120a06));
      for (let i = 0; i < 3; i++) {
        const x = 0.05 + i * 0.045;
        b.at(x, s * 0.0375, 0, h => {
          h.push(M4.rotX(PI / 2));
          h.prism(8, 0.004, 0.004, s > 0 ? 0 : -0.026, 0.004, 0.004, s > 0 ? 0.026 : 0, G.peg);
          h.pop();
        });
        b.at(x, s * 0.068, 0, h => h.box(0.018, 0.012, 0.022, G.peg));
      }
    });
    b.pop();
    return b;
  }

  function buildFretboard(b) {
    const L = GB.nut - GB.neck0 + 0.06;
    const x0 = GB.neck0 - 0.06;
    const n = [0, 0, 1];
    b.quad([x0, -0.028, 0.012], [x0 + L, -0.0235, 0.012], [x0 + L, 0.0235, 0.012], [x0, 0.028, 0.012], 0xffffff, [[1, 0], [0, 0], [0, 1], [1, 1]], [n, n, n, n]);
    b.quad([x0, -0.028, 0.006], [x0 + L, -0.0235, 0.006], [x0 + L, -0.0235, 0.012], [x0, -0.028, 0.012], 0x1a100a, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    b.quad([x0 + L, 0.0235, 0.006], [x0, 0.028, 0.006], [x0, 0.028, 0.012], [x0 + L, 0.0235, 0.012], 0x1a100a, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    return b;
  }

  function buildStrings(b) {
    for (let i = 0; i < 6; i++) {
      const k = (i - 2.5) / 2.5;
      const a = [-0.13, k * 0.026, 0.014], z = [GB.nut, k * 0.019, 0.0175];
      const w = 0.0006 + (5 - i) * 0.00016;
      b.quad([a[0], a[1] - w, a[2]], [z[0], z[1] - w, z[2]], [z[0], z[1] + w, z[2]], [a[0], a[1] + w, a[2]], rgb(0xd8d4c8, 0.2), null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    }
    return b;
  }

  const S1 = { hub: 0.46, col: 0.7, pivot: 0.17 };
  const S2 = { hub: 0.52, col: 0.78, pivot: 0.2 };

  function tripod(b, hub, reach, knee, legW, col) {
    [0.8, -0.8, PI].forEach(a => {
      const dir = [S(a), 0, C(a)];
      const h0 = [dir[0] * 0.05, hub, dir[2] * 0.05];
      const k = [dir[0] * reach * 0.62, knee, dir[2] * reach * 0.62];
      const f = [dir[0] * reach, 0.04, dir[2] * reach];
      K.tube(b, [h0, k], [legW, legW * 0.9], 6, col);
      K.tube(b, [k, f], [legW * 0.9, legW * 0.75], 6, col);
      b.at(k[0], k[1], k[2], h => h.ellipsoid(legW * 1.4, legW * 1.4, legW * 1.4, 8, 5, G.dark));
      b.push(M4.translate(f[0], 0.02, f[2]), M4.rotY(a));
      b.box(legW * 3.2, 0.04, legW * 4, G.dark);
      b.pop();
    });
    b.at(0, hub, 0, h => h.ellipsoid(0.07, 0.06, 0.07, 10, 6, G.dark));
  }

  function buildSentry1Base(b) {
    tripod(b, S1.hub, 0.42, 0.3, 0.024, G.mid);
    cyl(b, 0, [0, S1.hub - 0.04, 0], [0, S1.col, 0], 0.042, G.dark, 12);
    cyl(b, 0, [0, S1.col - 0.02, 0], [0, S1.col + 0.01, 0], 0.075, G.mid, 14);
    return b;
  }

  function buildSentry1Yoke(b) {
    [-1, 1].forEach(s => b.at(s * 0.155, 0.1, 0, h => h.box(0.024, 0.2, 0.15, G.dark)));
    b.at(0, 0.02, 0, h => h.box(0.33, 0.04, 0.16, G.dark));
    return b;
  }

  function hexBolt(b, x, s, r) {
    b.at(x, 0, 0, h => {
      h.push(M4.rotZ(-s * PI / 2));
      h.prism(6, r, r, 0, r, r, 0.03, G.mid, { capBottom: true });
      h.prism(14, r * 0.55, r * 0.55, 0.03, r * 0.5, r * 0.5, 0.045, G.dark);
      h.pop();
    });
  }

  function buildSentry1Gun(b) {
    b.at(0, 0.01, -0.05, h => h.box(0.26, 0.24, 0.46, G.dark, { faces: { left: G.red, right: G.red } }));
    b.at(0, 0.135, -0.05, h => h.box(0.24, 0.02, 0.4, G.mid));
    b.at(0, 0.01, 0.185, h => h.box(0.22, 0.2, 0.012, 0x2a2c2a));
    [-1, 1].forEach(s => hexBolt(b, s * 0.13, s, 0.06));
    cyl(b, 0, [0, -0.01, 0.18], [0, -0.01, 0.42], 0.042, G.dark, 14);
    cyl(b, 0, [0, -0.01, 0.4], [0, -0.01, 0.5], 0.056, 0x2e302e, 14);
    cyl(b, 0, [0, -0.01, 0.46], [0, -0.01, 0.468], 0.062, G.mid, 14);
    b.at(0, -0.01, 0.501, h => K.discXY(h, 0, 0, 0, 0.034, 12, rgb(0x0a0a0a, 0.5)));
    b.at(-0.075, 0.07, 0.195, h => h.ellipsoid(0.018, 0.018, 0.01, 8, 5, rgb(0xff3020, 0.9)));
    b.at(0, -0.04, -0.33, h => h.box(0.18, 0.13, 0.1, G.mid));
    b.at(0, 0.03, -0.33, h => h.box(0.12, 0.02, 0.06, G.dark));
    return b;
  }

  function buildSentry2Base(b) {
    tripod(b, S2.hub, 0.5, 0.34, 0.03, G.mid);
    cyl(b, 0, [0, S2.hub - 0.04, 0], [0, S2.col, 0], 0.05, G.dark, 12);
    cyl(b, 0, [0, S2.col - 0.02, 0], [0, S2.col + 0.012, 0], 0.09, G.mid, 14);
    return b;
  }

  function buildSentry2Yoke(b) {
    [-1, 1].forEach(s => b.at(s * 0.17, 0.12, 0, h => h.box(0.03, 0.24, 0.17, G.dark)));
    b.at(0, 0.02, 0, h => h.box(0.37, 0.04, 0.18, G.dark));
    return b;
  }

  function beltLoop(b, s) {
    const pts = [];
    for (let i = 0; i <= 22; i++) {
      const f = i / 22;
      const a = f * PI * 1.25;
      pts.push([s * (0.12 + f * 0.17), -0.06 - S(a) * 0.32, -0.2 - S(a * 0.8) * 0.18 + f * 0.12]);
    }
    K.tube(b, pts, pts.map(() => 0.034), 6, 0x6e6a5a);
    pts.forEach((p, i) => { if (i % 2 === 0) b.at(p[0], p[1], p[2], h => h.box(0.08, 0.025, 0.025, 0x8c8670)); });
  }

  function buildSentry2Gun(b, rockets, paint) {
    b.at(0, 0.0, -0.02, h => h.box(0.3, 0.26, 0.42, paint || G.red, { faces: { top: G.mid } }));
    b.at(0, 0.0, 0.2, h => h.box(0.26, 0.2, 0.02, G.dark));
    b.at(0, 0.15, -0.02, h => h.box(0.18, 0.05, 0.3, G.dark));
    [-1, 1].forEach(s => hexBolt(b, s * 0.15, s, 0.07));
    [-1, 1].forEach(s => {
      cyl(b, 0, [s * 0.27, 0.02, -0.12], [s * 0.27, 0.02, 0.3], 0.075, G.dark, 14);
      cyl(b, 0, [s * 0.27, 0.02, 0.0], [s * 0.27, 0.02, 0.06], 0.085, G.mid, 14);
      b.at(s * 0.21, 0.02, 0.0, h => h.box(0.06, 0.06, 0.18, G.dark));
      beltLoop(b, s);
    });
    if (rockets) {
      b.at(0, 0.26, -0.02, h => h.box(0.26, 0.16, 0.34, paint || G.red, { faces: { front: G.dark } }));
      for (let i = 0; i < 4; i++) {
        const x = (i % 2 ? 1 : -1) * 0.06, y = 0.26 + (i < 2 ? 0.04 : -0.04);
        cyl(b, 0, [x, y, 0.1], [x, y, 0.16], 0.03, G.mid, 10);
        b.at(x, y, 0.161, h => K.discXY(h, 0, 0, 0, 0.022, 10, rgb(0x0a0a0a, 0.5)));
      }
      b.at(0, 0.36, -0.02, h => h.box(0.06, 0.04, 0.2, G.dark));
    }
    return b;
  }

  function buildBarrels(b) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2;
      cyl(b, 0, [S(a) * 0.032, C(a) * 0.032, 0.0], [S(a) * 0.032, C(a) * 0.032, 0.3], 0.011, 0x2a2c2a, 6);
    }
    cyl(b, 0, [0, 0, 0.24], [0, 0, 0.27], 0.05, G.mid, 12);
    return b;
  }

  function buildToolbox(b) {
    const W = 0.8, H = 0.34, Dp = 0.42;
    b.at(0, H / 2, 0, h => h.box(W, H, Dp, 0xffffff, { faces: { front: null } }));
    b.at(0, H + 0.03, 0, h => h.box(W + 0.024, 0.06, Dp + 0.024, 0xffffff));
    b.at(0, H + 0.064, 0, h => h.box(W - 0.02, 0.012, Dp - 0.02, 0xc8b8b4));
    return b;
  }

  function buildToolboxHandle(b) {
    const H = 0.34;
    [-1, 1].forEach(s => {
      b.at(s * 0.17, H + 0.085, 0, h => h.box(0.07, 0.04, 0.09, G.latch));
      b.at(s * 0.17, H + 0.085, 0, h => h.box(0.03, 0.05, 0.1, 0x5a5c58));
    });
    const arc = [];
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * PI;
      arc.push([-C(a) * 0.15, H + 0.1 + S(a) * 0.1 * (0.8 + 0.2 * S(a)), 0]);
    }
    K.tube(b, arc, arc.map(() => 0.016), 8, 0x6e706c);
    return b;
  }

  function buildToolboxFront(b) {
    const W = 0.8, H = 0.34, Dp = 0.42;
    const n = [0, 0, 1];
    b.quad([-W / 2, 0, Dp / 2 + 0.001], [W / 2, 0, Dp / 2 + 0.001], [W / 2, H, Dp / 2 + 0.001], [-W / 2, H, Dp / 2 + 0.001], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    return b;
  }

  function buildToolboxLatch(b) {
    const Dp = 0.42, H = 0.34;
    const loop = [[-0.045, H - 0.11, 0], [-0.05, H - 0.02, 0], [-0.035, H + 0.04, 0], [0.035, H + 0.04, 0], [0.05, H - 0.02, 0], [0.045, H - 0.11, 0], [-0.045, H - 0.11, 0]];
    b.push(M4.translate(0, 0, Dp / 2 + 0.016));
    K.tube(b, loop, loop.map(() => 0.009), 6, G.latch);
    b.at(0, H - 0.06, 0.0, h => h.box(0.07, 0.09, 0.012, 0x7a7c78));
    b.at(0, H + 0.035, 0.002, h => h.box(0.09, 0.03, 0.016, G.latch));
    b.pop();
    [-1, 1].forEach(s => b.at(s * 0.36, H + 0.015, Dp / 2 + 0.012, h => h.box(0.04, 0.05, 0.016, 0x7a7c78)));
    return b;
  }

  function buildCrate(b) {
    const W = 0.62, H = 0.52, Dp = 0.5;
    const quadUV = (a, bb, c, d, n) => b.quad(a, bb, c, d, 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    const x = W / 2, z = Dp / 2;
    quadUV([-x, 0, z], [x, 0, z], [x, H, z], [-x, H, z], [0, 0, 1]);
    quadUV([x, 0, -z], [-x, 0, -z], [-x, H, -z], [x, H, -z], [0, 0, -1]);
    quadUV([x, 0, z], [x, 0, -z], [x, H, -z], [x, H, z], [1, 0, 0]);
    quadUV([-x, 0, -z], [-x, 0, z], [-x, H, z], [-x, H, -z], [-1, 0, 0]);
    quadUV([-x, H, z], [x, H, z], [x, H, -z], [-x, H, -z], [0, 1, 0]);
    return b;
  }

  function buildCounter(b) {
    const W = 0.3, H = 0.22, Dp = 0.13;
    b.at(0, H / 2, 0, h => h.box(W, H, Dp, G.red));
    b.at(0, H * 0.7, Dp / 2 + 0.002, h => h.box(W * 0.86, H * 0.32, 0.004, 0x141210));
    b.at(0, H * 0.27, Dp / 2 + 0.002, h => h.box(W * 0.88, H * 0.36, 0.004, 0x2a2826));
    [-1, 1].forEach(s => b.at(s * (W / 2 - 0.012), H / 2, Dp / 2 + 0.004, h => h.box(0.02, H, 0.008, G.redDk)));
    b.at(0, H + 0.03, 0, h => h.box(W * 0.6, 0.016, 0.022, G.redDk));
    [-1, 1].forEach(s => b.at(s * W * 0.3, H + 0.014, 0, h => h.box(0.02, 0.03, 0.022, G.redDk)));
    const cable = (pts) => K.tube(b, pts, pts.map(() => 0.008), 5, 0xa82a22);
    cable([[-0.1, 0.05, -Dp / 2], [-0.16, 0.0, -Dp / 2 - 0.05], [-0.22, -0.25, -0.08], [-0.25, -0.5, 0.05]]);
    cable([[0.05, 0.04, -Dp / 2], [0.0, -0.05, -Dp / 2 - 0.08], [-0.12, -0.3, -0.2], [-0.2, -0.52, -0.1]]);
    return b;
  }

  function buildCounterPlate(b) {
    const W = 0.3, H = 0.22, Dp = 0.13;
    const n = [0, 0, 1];
    const x0 = -W * 0.42, x1 = W * 0.42, y0 = H * 0.11, y1 = H * 0.43, z = Dp / 2 + 0.0045;
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    return b;
  }

  function buildDigit(b) {
    const n = [0, 0, 1];
    const w = 0.024, h = 0.032;
    b.quad([-w, -h, 0], [w, -h, 0], [w, h, 0], [-w, h, 0], rgb(0xffffff, 0.25), [[0, 0], [1, 0], [1, 1 / 11], [0, 1 / 11]], [n, n, n, n]);
    return b;
  }

  function buildBottle(b) {
    const prof = [[0, 0.0], [0.031, 0.0], [0.033, 0.01], [0.033, 0.15], [0.03, 0.17], [0.018, 0.195], [0.013, 0.21], [0.0125, 0.245], [0.015, 0.248], [0.015, 0.255], [0, 0.257]];
    const sides = 14;
    for (let j = 0; j < prof.length - 1; j++) {
      const [r0, y0] = prof[j], [r1, y1] = prof[j + 1];
      for (let i = 0; i < sides; i++) {
        const a0 = (i / sides) * PI * 2, a1 = ((i + 1) / sides) * PI * 2;
        const p = (r, y, a) => [S(a) * r, y, C(a) * r];
        const nn = (a) => V3.norm([S(a), (r0 - r1) / Math.max(1e-4, y1 - y0) * 0.5, C(a)]);
        b.quad(p(r0, y0, a0), p(r0, y0, a1), p(r1, y1, a1), p(r1, y1, a0), G.glass, null, [nn(a0), nn(a1), nn(a1), nn(a0)]);
      }
    }
    return b;
  }

  function buildLabel(b) {
    const sides = 10;
    for (let i = 0; i < sides; i++) {
      const a0 = -1.1 + (i / sides) * 2.2, a1 = -1.1 + ((i + 1) / sides) * 2.2;
      const r = 0.0335;
      const p = (a, y) => [S(a) * r, y, C(a) * r];
      const n0 = [S(a0), 0, C(a0)], n1 = [S(a1), 0, C(a1)];
      b.quad(p(a0, 0.045), p(a1, 0.045), p(a1, 0.125), p(a0, 0.125), 0xffffff, [[i / sides, 0], [(i + 1) / sides, 0], [(i + 1) / sides, 1], [i / sides, 1]], [n0, n1, n1, n0]);
    }
    return b;
  }

  function buildWrench(b) {
    b.at(0, 0.2, 0, h => h.box(0.034, 0.42, 0.022, G.wrench));
    b.at(0, 0.06, 0, h => h.box(0.042, 0.12, 0.028, 0x2a2a2a));
    b.at(0.0, 0.44, 0, h => h.box(0.075, 0.07, 0.034, G.wrench));
    b.at(0.055, 0.5, 0, h => h.box(0.03, 0.14, 0.034, G.wrench));
    b.at(-0.03, 0.53, 0, h => h.box(0.1, 0.035, 0.034, G.wrench));
    b.at(-0.075, 0.555, 0, h => h.box(0.03, 0.07, 0.034, G.wrench));
    cyl(b, 0, [-0.02, 0.38, 0], [-0.02, 0.47, 0], 0.016, 0x2a2a2a, 10);
    for (let i = 0; i < 6; i++) b.at(-0.02, 0.39 + i * 0.014, 0, h => h.prism(10, 0.019, 0.019, -0.003, 0.019, 0.019, 0.003, 0x4a4a4a));
    return b;
  }

  function buildShotgun(b) {
    b.at(0, 0.12, 0, h => h.box(0.045, 0.24, 0.035, G.stock));
    b.at(0, 0.27, 0, h => h.box(0.04, 0.1, 0.04, 0x2a2a2a));
    cyl(b, 0, [0, 0.3, 0.008], [0, 0.95, 0.008], 0.012, 0x2a2a2a, 8);
    cyl(b, 0, [0, 0.33, -0.012], [0, 0.82, -0.012], 0.011, 0x2a2a2a, 8);
    b.at(0, 0.55, -0.012, h => h.box(0.032, 0.16, 0.03, G.stock));
    return b;
  }

  const TR = { wheelR: 0.46, frontX: 1.5, rearX: -2.1, halfW: 0.86 };

  function wheel(b, x, z) {
    b.push(M4.translate(x, TR.wheelR, z), M4.rotX(PI / 2));
    b.prism(18, TR.wheelR, TR.wheelR, -0.13, TR.wheelR, TR.wheelR, 0.13, G.tire, { capBottom: true });
    b.prism(18, TR.wheelR * 0.66, TR.wheelR * 0.66, 0.131, TR.wheelR * 0.66, TR.wheelR * 0.66, 0.135, 0x8c867c);
    b.prism(16, TR.wheelR * 0.42, TR.wheelR * 0.42, 0.135, TR.wheelR * 0.36, TR.wheelR * 0.36, 0.16, 0x3a4048);
    b.prism(12, TR.wheelR * 0.12, TR.wheelR * 0.12, 0.16, TR.wheelR * 0.1, TR.wheelR * 0.1, 0.18, G.chrome);
    b.pop();
  }

  function fender(b, x, z, len, col) {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI, a1 = ((i + 1) / n) * PI;
      const R = TR.wheelR + 0.1;
      const p = (a, dz) => [x + C(a) * R * len, TR.wheelR + S(a) * R * 0.85, z + dz];
      const nn = (a) => V3.norm([C(a), S(a), 0]);
      b.quad(p(a1, -0.17), p(a0, -0.17), p(a0, 0.17), p(a1, 0.17), col, null, [nn(a1), nn(a0), nn(a0), nn(a1)]);
      b.quad(p(a0, 0.17), p(a1, 0.17), [x + C(a1) * (R - 0.05) * len, TR.wheelR + S(a1) * (R - 0.05) * 0.85, z + 0.17], [x + C(a0) * (R - 0.05) * len, TR.wheelR + S(a0) * (R - 0.05) * 0.85, z + 0.17], col, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    }
  }

  function buildTruckPaint(b) {
    const col = 0xffffff;
    const opts = { uvScale: 1.2 };
    b.at(-0.2, 1.0, 0, h => h.box(1.5, 0.8, TR.halfW * 2, col, opts));
    b.at(0.75, 1.12, 0, h => h.box(1.4, 0.5, 1.02, col, opts));
    b.at(0.75, 1.38, 0, h => h.box(1.36, 0.06, 0.92, col, opts));
    fender(b, TR.frontX, TR.halfW - 0.05, 1.05, col);
    fender(b, TR.frontX, -TR.halfW + 0.05, 1.05, col);
    b.at(1.48, 0.5, TR.halfW - 0.05, h => h.box(0.9, 0.08, 0.34, col, opts));
    b.at(1.48, 0.5, -TR.halfW + 0.05, h => h.box(0.9, 0.08, 0.34, col, opts));
    return b;
  }

  function buildTruckCab(b) {
    const col = 0xffffff;
    const opts = { uvScale: 1.2 };
    const hw = TR.halfW - 0.04;
    b.at(-0.28, 1.7, 0, h => h.box(1.24, 0.62, hw * 2, col, opts));
    b.at(-0.28, 2.04, 0, h => h.box(1.22, 0.06, hw * 2 - 0.2, col, opts));
    [-1, 1].forEach(s => {
      b.push(M4.translate(-0.28, 2.0, s * (hw - 0.1)), M4.rotZ(PI / 2));
      b.prism(10, 0.1, 0.1, -0.61, 0.1, 0.1, 0.61, col, { capBottom: true });
      b.pop();
    });
    return b;
  }

  function buildTruckGlass(b) {
    const g = rgb(0x14181e, 0.0), hi = rgb(0x3a4252, 0.08);
    [-1, 1].forEach(s => {
      const z = s * (TR.halfW - 0.034);
      const n = [0, 0, s];
      const q = [[-0.82, 1.45, z], [0.18, 1.45, z], [0.18, 1.95, z], [-0.72, 1.95, z]];
      if (s > 0) b.quad(q[0], q[1], q[2], q[3], [g, g, hi, hi], null, [n, n, n, n]);
      else b.quad(q[1], q[0], q[3], q[2], [g, g, hi, hi], null, [n, n, n, n]);
    });
    const nf = [1, 0, 0];
    b.quad([0.346, 1.45, TR.halfW - 0.12], [0.346, 1.45, -TR.halfW + 0.12], [0.346, 1.96, -TR.halfW + 0.12], [0.346, 1.96, TR.halfW - 0.12], [g, g, hi, hi], null, [nf, nf, nf, nf]);
    return b;
  }

  function buildTruckDark(b) {
    wheel(b, TR.frontX, TR.halfW - 0.08);
    wheel(b, TR.frontX, -TR.halfW + 0.08);
    wheel(b, TR.rearX, TR.halfW - 0.08);
    wheel(b, TR.rearX, -TR.halfW + 0.08);
    wheel(b, TR.rearX - 0.62, TR.halfW - 0.08);
    wheel(b, TR.rearX - 0.62, -TR.halfW + 0.08);
    b.at(-1.2, 0.62, 0, h => h.box(4.6, 0.18, 1.2, 0x2a2826));
    b.at(1.47, 1.1, 0, h => h.box(0.04, 0.5, 0.86, 0x2a2c30));
    for (let i = 0; i < 9; i++) b.at(1.495, 1.1, -0.36 + i * 0.09, h => h.box(0.02, 0.46, 0.03, G.chrome));
    [-1, 1].forEach(s => {
      b.at(1.62, 1.12, s * 0.62, h => { h.push(M4.rotZ(PI / 2)); h.prism(14, 0.1, 0.1, -0.06, 0.1, 0.1, 0.06, G.chrome, { capBottom: true }); h.pop(); });
      b.at(1.69, 1.12, s * 0.62, h => { h.push(M4.rotZ(-PI / 2)); K.discXY(h, 0, 0, 0, 0.08, 12, rgb(0xe8e0b0, 0.4)); h.pop(); });
    });
    b.at(1.82, 0.62, 0, h => h.box(0.12, 0.12, 1.9, G.chrome));
    [1.1, 0.9, 0.7].forEach((x, i) => b.at(x - i * 0.0, 1.24, TR.halfW * 0.6 + 0.001, h => h.box(0.3, 0.02, 0.01, 0x2a2c30)));
    b.at(-0.15, 1.28, TR.halfW + 0.005, h => h.box(0.16, 0.03, 0.03, G.chrome));
    return b;
  }

  function buildTruckBed(b) {
    const x0 = -3.9, x1 = -1.0, y0 = 1.0;
    b.at((x0 + x1) / 2, y0 - 0.1, 0, h => h.box(x1 - x0, 0.2, TR.halfW * 2 + 0.1, 0x4a3628));
    const posts = 7;
    [-1, 1].forEach(s => {
      for (let i = 0; i < posts; i++) {
        const x = lerp(x0 + 0.06, x1 - 0.06, i / (posts - 1));
        b.at(x, y0 + 0.5, s * (TR.halfW + 0.02), h => h.box(0.09, 1.0, 0.07, 0x4e3a2c));
      }
      [0.25, 0.55, 0.85].forEach(y => b.at((x0 + x1) / 2, y0 + y, s * (TR.halfW + 0.07), h => h.box(x1 - x0, 0.12, 0.04, 0x5a4434)));
    });
    [0.25, 0.55, 0.85].forEach(y => b.at(x0 - 0.04, y0 + y, 0, h => h.box(0.04, 0.12, TR.halfW * 2 + 0.1, 0x5a4434)));
    return b;
  }

  function buildLockers(b) {
    const g = rand(7);
    const items = [[-3.45, 0, -0.3, 0.8, 0.45, 0.55, 0.1], [-2.6, 0, -0.35, 0.9, 0.42, 0.6, -0.1], [-1.8, 0, -0.3, 0.8, 0.5, 0.55, 0.05], [-1.45, 0, 0.3, 0.6, 0.38, 0.5, 0.2],
      [-3.3, 0.45, 0.1, 0.8, 0.36, 0.5, -0.15], [-2.4, 0.42, 0.0, 1.0, 0.4, 0.55, 0.12], [-1.6, 0.5, -0.2, 0.7, 0.34, 0.5, -0.05], [-2.9, 0.82, -0.1, 0.9, 0.34, 0.5, 0.3],
      [-2.0, 0.84, 0.15, 0.7, 0.3, 0.45, -0.2], [-2.5, 1.15, 0.0, 0.8, 0.3, 0.5, 0.1], [-3.55, 0.0, 0.45, 0.6, 0.4, 0.4, 0.0], [-1.4, 0.38, -0.25, 0.6, 0.3, 0.5, 0.1]];
    items.forEach(([x, y, z, w, h, d, yaw]) => {
      b.push(M4.translate(x, 1.0 + y + h / 2, z), M4.rotY(yaw), M4.rotZ((g() - 0.5) * 0.08));
      b.box(w, h, d, 0xffffff, { uvScale: 1.6 });
      b.at(0, h / 2 + 0.015, 0, q => q.box(w * 0.3, 0.03, 0.04, 0x2a2c2c));
      b.pop();
    });
    return b;
  }

  function buildSign(b) {
    b.at(0, 0.6, 0, h => h.box(0.08, 1.2, 0.06, 0x5a4434));
    const n = [0, 0, 1];
    b.quad([-0.42, 0.62, 0.035], [0.42, 0.62, 0.035], [0.42, 1.04, 0.035], [-0.42, 1.04, 0.035], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    b.at(0, 0.83, 0.02, h => h.box(0.86, 0.44, 0.03, 0x6a5444));
    return b;
  }

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      guitarTop: mk(buildGuitarTop),
      guitarBody: mk(buildGuitarBody),
      guitarNeck: mk(buildGuitarNeck),
      fretboard: mk(buildFretboard),
      strings: mk(buildStrings),
      s1Base: mk(buildSentry1Base),
      s1Yoke: mk(buildSentry1Yoke),
      s1Gun: mk(buildSentry1Gun),
      s2Base: mk(buildSentry2Base),
      s2Yoke: mk(buildSentry2Yoke),
      s2Gun: mk(b => buildSentry2Gun(b, false)),
      s3Gun: mk(b => buildSentry2Gun(b, true)),
      s2GunBlu: mk(b => buildSentry2Gun(b, false, 0x4f7ea4)),
      s3GunBlu: mk(b => buildSentry2Gun(b, true, 0x4f7ea4)),
      barrels: mk(buildBarrels),
      toolbox: mk(buildToolbox),
      toolboxFront: mk(buildToolboxFront),
      toolboxLatch: mk(buildToolboxLatch),
      toolboxHandle: mk(buildToolboxHandle),
      crate: mk(buildCrate),
      counter: mk(buildCounter),
      counterPlate: mk(buildCounterPlate),
      digit: mk(buildDigit),
      bottle: mk(buildBottle),
      label: mk(buildLabel),
      wrench: mk(buildWrench),
      shotgun: mk(buildShotgun),
      truckPaint: mk(buildTruckPaint),
      truckCab: mk(buildTruckCab),
      truckGlass: mk(buildTruckGlass),
      truckDark: mk(buildTruckDark),
      truckBed: mk(buildTruckBed),
      lockers: mk(buildLockers),
      sign: mk(buildSign)
    };
  }

  const METAL = { spec: [0.35, 18], rim: 0.6 };
  const PAINT = { spec: [0.25, 14], rim: 0.5 };

  const SENTRY_SCALE = { 1: 1.35, 2: 1.45, 3: 1.45 };

  function sentryFrames(level, M0, st) {
    const L = level === 1 ? S1 : S2;
    const M = M4.mul(M0, M4.scale(SENTRY_SCALE[level], SENTRY_SCALE[level], SENTRY_SCALE[level]));
    const yaw = M4.chain(M, M4.translate(0, L.col + 0.01, 0), M4.rotY(st.yaw || 0));
    const gun = M4.chain(yaw, M4.translate(0, L.pivot, 0), M4.rotX(-(st.pitch || 0)), M4.translate(0, 0, -(st.kick || 0)));
    return { yaw, gun };
  }

  function drawSentry(fx, P, level, M, st, T) {
    const s = st || {};
    const F = sentryFrames(level, M, s);
    const base = M4.mul(M, M4.scale(SENTRY_SCALE[level], SENTRY_SCALE[level], SENTRY_SCALE[level]));
    const metal = Object.assign({ texture: T('metal') }, METAL, s.tint ? { tint: s.tint } : {});
    if (level === 1) {
      fx.draw(P.s1Base, base, metal);
      fx.draw(P.s1Yoke, F.yaw, metal);
      fx.draw(P.s1Gun, F.gun, metal);
    } else {
      fx.draw(P.s2Base, base, metal);
      fx.draw(P.s2Yoke, F.yaw, metal);
      fx.draw(level === 3 ? (s.team === 'blu' ? P.s3GunBlu : P.s3Gun) : s.team === 'blu' ? P.s2GunBlu : P.s2Gun, F.gun, metal);
      [-1, 1].forEach(k => fx.draw(P.barrels, M4.chain(F.gun, M4.translate(k * 0.27, 0.02, 0.28), M4.rotZ((s.spin || 0) * k)), metal));
    }
    return F;
  }

  function sentryMuzzles(level, M, st) {
    const F = sentryFrames(level, M, st || {});
    if (level === 1) return [{ p: M4.point(F.gun, [0, -0.01, 0.53]), dir: V3.norm(M4.dir(F.gun, [0, 0, 1])) }];
    const out = [-1, 1].map(k => ({ p: M4.point(F.gun, [k * 0.27, 0.02, 0.6]), dir: V3.norm(M4.dir(F.gun, [0, 0, 1])) }));
    if (level === 3) out.rocket = { p: M4.point(F.gun, [0, 0.26, 0.2]), dir: V3.norm(M4.dir(F.gun, [0, 0, 1])) };
    return out;
  }

  function drawGuitar(fx, P, M, T, tint) {
    const t = tint ? { tint } : {};
    fx.draw(P.guitarTop, M, Object.assign({ texture: T('guitarTop'), spec: [0.3, 18], rim: 0.4, tint: [0.56, 0.5, 0.46] }, t));
    fx.draw(P.guitarBody, M, Object.assign({ spec: [0.4, 18], rim: 0.5 }, t));
    fx.draw(P.guitarNeck, M, Object.assign({ spec: [0.3, 14], rim: 0.5 }, t));
    fx.draw(P.fretboard, M, Object.assign({ texture: T('fretboard'), spec: [0.2, 10], rim: 0.3 }, t));
    fx.draw(P.strings, M, Object.assign({ spec: [1.0, 40], rim: 0.2 }, t));
  }

  function guitarPoint(M, local) {
    return M4.point(M, local);
  }

  function drawCounter(fx, P, M, value, T) {
    fx.draw(P.counter, M, PAINT);
    fx.draw(P.counterPlate, M, Object.assign({ texture: T('plate') }, PAINT));
    const v = Math.max(0, value);
    const digits = [];
    for (let i = 0; i < 5; i++) {
      const place = Math.pow(10, i);
      const whole = Math.floor(v / place) % 10;
      const carry = i === 0 ? v % 1 : (Math.floor(v) % place === place - 1 ? v % 1 : 0);
      digits.push(whole + carry);
    }
    digits.forEach((d, i) => {
      const x = 0.096 - i * 0.048;
      fx.draw(P.digit, M4.chain(M, M4.translate(x, 0.154, 0.0685)), { texture: T('digits'), uvScroll: [0, d / 11], spec: [0.2, 10], rim: 0.1 });
    });
  }

  function drawToolbox(fx, P, M, T, handle) {
    fx.draw(P.toolbox, M, Object.assign({ texture: T('toolPaint') }, PAINT));
    fx.draw(P.toolboxFront, M, Object.assign({ texture: T('toolFront') }, PAINT));
    fx.draw(P.toolboxLatch, M, METAL);
    if (handle) fx.draw(P.toolboxHandle, M, METAL);
  }

  function drawBottle(fx, P, M, T) {
    fx.draw(P.bottle, M, { spec: [1.2, 50], rim: 0.9 });
    fx.draw(P.label, M, { texture: T('label'), spec: [0.1, 6], rim: 0.3 });
  }

  function drawTruck(fx, P, M, T) {
    const paint = Object.assign({ texture: T('truck'), tint: [0.34, 0.38, 0.45], spec: [0.18, 12], rim: 0.35 });
    fx.draw(P.truckPaint, M, paint);
    fx.draw(P.truckCab, M, paint);
    fx.draw(P.truckGlass, M, { spec: [0.6, 40], rim: 0.2 });
    fx.draw(P.truckDark, M, METAL);
    fx.draw(P.truckBed, M, Object.assign({ texture: T('rust') }, PAINT, { tint: [0.82, 0.68, 0.58] }));
    fx.draw(P.lockers, M, Object.assign({ texture: T('lockers') }, PAINT));
  }

  window.EngProps = { build, drawSentry, sentryMuzzles, sentryFrames, drawGuitar, guitarPoint, drawCounter, drawToolbox, drawBottle, drawTruck, GB, S1, S2, TR, METAL, PAINT };
})();
