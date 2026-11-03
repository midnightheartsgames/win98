(function () {
  const { M4, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh, spherePatch } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const D = { hipX: 0.13, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.13, neckY: 0.34, shX: 0.26, shY: 0.235, upper: 0.31, fore: 0.27, headY: 0.17, head: 0.12 };

  const SKIN = 0xdcae98;

  const OUTFITS = {
    sweater: { top: 0xd8d4cc, sleeve: 0xd8d4cc, cuff: 0xc8c4bc, pants: 0x1c1c22, shoe: 0x1a1a1c, hair: 0x7c5c40, belly: 1.0 },
    hoodie: { top: 0x121216, sleeve: 0x121216, cuff: 0x0e0e12, pants: 0x18181c, shoe: 0x141416, hair: 0x7a5a3c, belly: 0.96 },
    leather: { top: 0x2a8ad8, sleeve: 0x141416, cuff: 0x1c1c20, pants: 0x2c3e62, shoe: 0x1c1c20, hair: 0x5a4430, belly: 0.82 },
    winter: { top: 0x24262c, sleeve: 0x24262c, cuff: 0x1c1e22, pants: 0x1c1d22, shoe: 0x141416, hair: 0x4a3a2c, belly: 1.0 }
  };

  const CHEST_RINGS = [
    [-0.33, 0.13, 0.11, 0.0],
    [-0.3, 0.21, 0.18, 0.02],
    [-0.25, 0.27, 0.22, 0.04],
    [-0.17, 0.32, 0.27, 0.07],
    [-0.06, 0.34, 0.28, 0.085],
    [0.05, 0.345, 0.27, 0.06],
    [0.14, 0.35, 0.245, 0.03],
    [0.22, 0.345, 0.22, 0.0],
    [0.28, 0.32, 0.19, -0.015],
    [0.33, 0.25, 0.155, -0.02],
    [0.36, 0.14, 0.115, -0.012],
    [0.38, 0.1, 0.09, 0.0]
  ];

  function chestAt(y, belly) {
    const k0 = belly === undefined ? 1 : belly;
    for (let i = 0; i < CHEST_RINGS.length - 1; i++) {
      const a = CHEST_RINGS[i], b = CHEST_RINGS[i + 1];
      if (y <= b[0]) {
        const k = clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
        const swell = y < 0.18 ? k0 : 1;
        return { rx: lerp(a[1], b[1], k) * lerp(1, swell, 0.6), rz: lerp(a[2], b[2], k) * swell, cz: lerp(a[3], b[3], k) * swell };
      }
    }
    const l = CHEST_RINGS[CHEST_RINGS.length - 1];
    return { rx: l[1], rz: l[2], cz: l[3] };
  }

  const STRIPES = [
    [0.0, 0.18, '#d8d4cc'],
    [0.18, 0.2, '#4a4e5a'],
    [0.2, 0.235, '#d8d4cc'],
    [0.235, 0.33, '#4c5262'],
    [0.33, 0.345, '#6a2a30'],
    [0.345, 0.37, '#4a3a44'],
    [0.37, 0.385, '#6a2a30'],
    [0.385, 0.45, '#5a6a84'],
    [0.45, 0.5, '#d4d0c8'],
    [0.5, 0.55, '#a8333a'],
    [0.55, 0.6, '#d8d4cc'],
    [0.6, 0.68, '#525868'],
    [0.68, 0.7, '#d8d4cc'],
    [0.7, 0.715, '#8a3038'],
    [0.715, 0.77, '#d6d2ca'],
    [0.77, 0.83, '#62708a'],
    [0.83, 0.9, '#d6d2ca'],
    [0.9, 0.93, '#7a8494'],
    [0.93, 1.0, '#d0ccc4']
  ];

  function sweaterTex(ctx, w, h) {
    STRIPES.forEach(([a, b, col]) => {
      ctx.fillStyle = col;
      ctx.fillRect(0, (1 - b) * h, w, (b - a) * h + 1);
    });
    const g = rand(5);
    for (let i = 0; i < w * h * 0.25; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1, 2);
    }
  }

  function knitTex(base) {
    return (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      const g = rand(9);
      for (let i = 0; i < w * h * 0.3; i++) {
        ctx.fillStyle = g() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1, 2);
      }
    };
  }

  const TORSO_Y0 = -0.33, TORSO_Y1 = 0.38;

  function buildTorso(b, o, textured) {
    const n = 18;
    const rings = [];
    for (let i = 0; i <= n; i++) {
      const y = lerp(TORSO_Y0, TORSO_Y1, i / n);
      const c = chestAt(y, o.belly);
      rings.push(ring(y, c.rx + 0.006, c.rz + 0.006, c.cz, textured ? 0xffffff : o.top));
    }
    loft(b, rings, 16, { capBottom: true, uv: textured });
    if (textured) {
      const c = chestAt(TORSO_Y0, o.belly);
      loft(b, [ring(TORSO_Y0 - 0.05, c.rx - 0.01, c.rz - 0.01, c.cz, o.cuff), ring(TORSO_Y0 + 0.001, c.rx + 0.008, c.rz + 0.008, c.cz, o.cuff)], 16, {});
    }
  }

  function collar(b, col, r0, r1, y0, y1) {
    loft(b, [ring(y0, r0, r0 * 0.88, -0.005, col), ring(y1, r1, r1 * 0.88, -0.005, col)], 14, {});
  }

  function buildHoodRoll(b) {
    const col = 0x0e0e12;
    const N = 16;
    for (let i = 0; i < N; i++) {
      const a0 = 0.7 + (i / N) * (PI * 2 - 1.4), a1 = 0.7 + ((i + 1) / N) * (PI * 2 - 1.4);
      const pt = (a, r, y) => [S(a) * r, y, -0.02 + C(a) * r * 0.85];
      b.quad(pt(a0, 0.13, 0.355), pt(a1, 0.13, 0.355), pt(a1, 0.2, 0.39), pt(a0, 0.2, 0.39), col);
      b.quad(pt(a0, 0.2, 0.39), pt(a1, 0.2, 0.39), pt(a1, 0.27, 0.33), pt(a0, 0.27, 0.33), shade(col, 1.3));
    }
    b.at(0, 0.33, -0.2, h => h.ellipsoid(0.17, 0.09, 0.08, 10, 5, col));
    [-1, 1].forEach(s => b.at(s * 0.07, 0.32, 0.17, h => h.ellipsoid(0.07, 0.05, 0.03, 8, 4, 0x18181e)));
  }

  const JACKET = [
    [-0.44, 0.34, 0.27, 0.04],
    [-0.33, 0.33, 0.27, 0.05],
    [-0.2, 0.33, 0.28, 0.06],
    [-0.06, 0.35, 0.29, 0.06],
    [0.06, 0.36, 0.28, 0.05],
    [0.15, 0.37, 0.26, 0.02],
    [0.23, 0.365, 0.235, 0.0],
    [0.29, 0.34, 0.205, -0.01],
    [0.33, 0.27, 0.175, -0.015],
    [0.37, 0.17, 0.13, -0.01]
  ];

  function buildJacket(b, col, lining, open) {
    const NU = 18;
    const openAt = (y) => lerp(open[0], open[1], clamp((y + 0.44) / 0.8, 0, 1));
    const pt = (r, a, add) => [S(a) * (r[1] + add), r[0], r[3] + C(a) * (r[2] + add)];
    const shell = (add, c, inner) => {
      for (let j = 0; j < JACKET.length - 1; j++) {
        const r0 = JACKET[j], r1 = JACKET[j + 1];
        const o0 = openAt(r0[0]), o1 = openAt(r1[0]);
        for (let i = 0; i < NU; i++) {
          const a = (o, u) => o + (PI * 2 - 2 * o) * u;
          const A = pt(r0, a(o0, i / NU), add), B = pt(r0, a(o0, (i + 1) / NU), add);
          const Cc = pt(r1, a(o1, (i + 1) / NU), add), Dd = pt(r1, a(o1, i / NU), add);
          const cc = i % 5 === 2 ? shade(c, 1.35) : c;
          if (inner) b.quad(B, A, Dd, Cc, c); else b.quad(A, B, Cc, Dd, cc);
        }
      }
    };
    shell(0, col, false);
    shell(-0.01, lining, true);
    [-1, 1].forEach(s => {
      for (let j = 3; j < JACKET.length - 1; j++) {
        const r0 = JACKET[j], r1 = JACKET[j + 1];
        const e0 = pt(r0, s * openAt(r0[0]), 0.004), e1 = pt(r1, s * openAt(r1[0]), 0.004);
        const w0 = pt(r0, s * (openAt(r0[0]) + 0.3), 0.03), w1 = pt(r1, s * (openAt(r1[0]) + 0.3), 0.03);
        if (s > 0) b.quad(e0, w0, w1, e1, shade(col, 1.25)); else b.quad(w0, e0, e1, w1, shade(col, 1.25));
      }
    });
    const N = 14;
    for (let i = 0; i < N; i++) {
      const span = (u) => 0.9 + (PI * 2 - 1.8) * u;
      const a0 = span(i / N), a1 = span((i + 1) / N);
      const inner = (a) => [S(a) * 0.15, 0.34, -0.01 + C(a) * 0.12];
      const outer = (a) => [S(a) * 0.2, 0.44, -0.02 + C(a) * 0.15];
      b.quad(inner(a0), inner(a1), outer(a1), outer(a0), shade(col, 1.15));
    }
  }

  function buildParka(b, o) {
    buildJacket(b, o.top, 0x1a1a1e, [0.05, 0.05]);
    const fur = 0x8c7c68;
    const N = 18;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * PI * 2, a1 = ((i + 1) / N) * PI * 2;
      const pt = (a, r, y, k) => [S(a) * r, y, -0.03 + C(a) * r * k];
      b.quad(pt(a0, 0.16, 0.36, 0.9), pt(a1, 0.16, 0.36, 0.9), pt(a1, 0.27, 0.45, 0.8), pt(a0, 0.27, 0.45, 0.8), fur);
      b.quad(pt(a0, 0.27, 0.45, 0.8), pt(a1, 0.27, 0.45, 0.8), pt(a1, 0.33, 0.34, 0.85), pt(a0, 0.33, 0.34, 0.85), shade(fur, 0.85));
    }
    b.at(0, 0.38, -0.2, h => h.ellipsoid(0.24, 0.16, 0.11, 10, 6, fur));
  }

  function buildPelvis(b, o) {
    const P = o.pants;
    loft(b, [ring(-0.17, 0.17, 0.14, -0.01, P), ring(-0.09, 0.27, 0.215, -0.03, P), ring(-0.01, 0.29, 0.235, -0.02, P), ring(0.05, 0.3, 0.24, 0.0, P), ring(0.09, 0.29, 0.232, 0.01, shade(P, 0.8))], 14, { capBottom: true, capTop: true });
  }

  function buildThigh(b, o) {
    const P = o.pants;
    loft(b, [ring(-D.thigh - 0.02, 0.085, 0.09, 0.0, P), ring(-0.3, 0.112, 0.116, 0.0, P), ring(-0.12, 0.135, 0.14, 0.01, P), ring(0.05, 0.142, 0.142, 0.0, P)], 10, { capBottom: true, capTop: true });
  }

  function buildShin(b, o) {
    const P = o.pants;
    b.ellipsoid(0.085, 0.08, 0.088, 8, 5, P);
    loft(b, [ring(-D.shin + 0.03, 0.075, 0.078, 0.0, P), ring(-0.3, 0.074, 0.078, 0.0, P), ring(-0.12, 0.08, 0.084, 0.01, P), ring(0.0, 0.082, 0.086, 0.0, P)], 10, { capBottom: true });
  }

  function buildFoot(b, o) {
    b.at(0, -0.04, 0.02, h => h.ellipsoid(0.055, 0.05, 0.075, 8, 4, o.shoe));
    b.push(M4.translate(0, -0.05, 0.07));
    b.box(0.1, 0.07, 0.25, o.shoe);
    b.at(0, 0.0, 0.11, h => h.ellipsoid(0.05, 0.035, 0.05, 7, 3, o.shoe));
    b.pop();
  }

  function buildUpper(b, o) {
    b.ellipsoid(0.11, 0.1, 0.11, 8, 5, o.sleeve);
    loft(b, [ring(-D.upper - 0.01, 0.072, 0.076, 0, o.sleeve), ring(-0.18, 0.088, 0.092, 0, o.sleeve), ring(-0.04, 0.1, 0.104, 0, o.sleeve), ring(0.03, 0.096, 0.098, 0, o.sleeve)], 10, { capBottom: true });
  }

  function buildFore(b, o) {
    b.ellipsoid(0.076, 0.076, 0.076, 8, 5, o.sleeve);
    loft(b, [ring(-D.fore + 0.02, 0.058, 0.06, 0, o.sleeve), ring(-0.16, 0.066, 0.069, 0, o.sleeve), ring(0.0, 0.072, 0.074, 0, o.sleeve)], 10, { capBottom: true });
    b.at(0, -D.fore + 0.035, 0, h => h.prism(10, 0.06, 0.062, -0.025, 0.058, 0.06, 0.02, o.cuff));
  }

  function buildHand(b, side, grip) {
    const sk = SKIN;
    const inward = side === 'L' ? -1 : 1;
    b.at(0, -0.045, 0, h => h.box(0.034, 0.09, 0.09, sk));
    if (grip === 'fist') {
      b.at(inward * 0.012, -0.1, 0.0, h => h.box(0.052, 0.05, 0.085, sk));
    } else if (grip === 'pocket') {
      b.at(0, -0.075, 0, h => h.box(0.036, 0.04, 0.09, sk));
    } else if (grip === 'grab') {
      b.at(inward * 0.014, -0.1, 0.0, h => h.box(0.05, 0.05, 0.085, sk));
      b.at(inward * 0.04, -0.085, 0.0, h => h.box(0.02, 0.07, 0.08, sk));
    } else {
      b.at(0, -0.118, 0, h => h.box(0.028, 0.064, 0.084, sk));
      b.at(inward * 0.008, -0.152, 0, h => h.box(0.022, 0.026, 0.074, shade(sk, 0.97)));
    }
    b.push(M4.translate(inward * 0.012, -0.03, 0.05), M4.rotX(-0.5));
    b.at(0, -0.025, 0, h => h.box(0.024, 0.05, 0.024, sk));
    b.pop();
  }

  function buildHead(b, beard) {
    const sk = SKIN, R = D.head;
    b.ellipsoid(R * 1.0, R * 1.08, R * 0.98, 16, 10, sk);
    b.at(0, -R * 0.62, R * 0.2, h => h.ellipsoid(R * 0.86, R * 0.5, R * 0.74, 12, 6, beard ? 0x4a3828 : sk));
    b.at(0, -R * 0.95, -R * 0.05, h => h.ellipsoid(R * 0.8, R * 0.4, R * 0.66, 10, 5, beard ? 0x4a3828 : shade(sk, 0.97)));
    [-1, 1].forEach(s => b.at(s * R * 0.98, -R * 0.08, -R * 0.06, h => h.ellipsoid(R * 0.13, R * 0.25, R * 0.17, 6, 4, shade(sk, 0.88))));
    b.at(0, -R * 0.16, R * 0.95, h => h.ellipsoid(R * 0.15, R * 0.17, R * 0.12, 6, 4, shade(sk, 0.97)));
  }

  function buildHair(b, col) {
    const R = D.head;
    const nu = 18, nv = 6;
    const lower = (yaw) => {
      const a = Math.abs(yaw);
      if (a < 0.95) return 0.62 - 0.08 * C(yaw * 2);
      if (a < 1.75) return 0.32;
      return -0.3;
    };
    const pt = (i, j) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const p0 = lower(yaw);
      const pit = p0 + (PI / 2 - p0) * (j / nv);
      const k = 1.03 + (j > 0 && j < nv ? 0.01 * S(i * 2.3 + j * 1.7) : 0.0);
      return [S(yaw) * C(pit) * R * 1.0 * k, S(pit) * R * 1.08 * k + R * 0.01, C(yaw) * C(pit) * R * 0.98 * k];
    };
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), (i + j) % 3 === 0 ? shade(col, 1.15) : col);
  }

  function buildBeanie(b) {
    const R = D.head;
    const col = 0x1f9a6a;
    const nu = 18, nv = 6;
    const pt = (i, j, k0) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const lowF = 0.38 - 0.08 * C(yaw);
      const pit = lowF + (PI / 2 - lowF) * (j / nv);
      const k = k0 + 0.02 * S(j * 1.3);
      return [S(yaw) * C(pit) * R * k, S(pit) * R * 1.25 * k + R * 0.08, C(yaw) * C(pit) * R * k];
    };
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) b.quad(pt(i, j, 1.1), pt(i + 1, j, 1.1), pt(i + 1, j + 1, 1.1), pt(i, j + 1, 1.1), j % 2 ? col : shade(col, 0.9));
    for (let i = 0; i < nu; i++) {
      const y0 = -PI + (i / nu) * 2 * PI, y1 = -PI + ((i + 1) / nu) * 2 * PI;
      const cuff = (yaw, dp, k) => {
        const l = 0.38 - 0.08 * C(yaw) + dp;
        return [S(yaw) * C(l) * R * k, S(l) * R * 1.25 * k + R * 0.08, C(yaw) * C(l) * R * k];
      };
      b.quad(cuff(y0, -0.05, 1.14), cuff(y1, -0.05, 1.14), cuff(y1, 0.32, 1.16), cuff(y0, 0.32, 1.16), shade(col, 0.82));
    }
  }

  function buildGlasses(b) {
    const R = D.head;
    const z = R * 0.97;
    const lens = (s) => {
      b.push(M4.translate(s * R * 0.4, R * 0.1, z), M4.rotY(s * 0.32));
      const N = 14;
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * PI * 2, a1 = ((i + 1) / N) * PI * 2;
        const e = (a) => [S(a) * R * 0.3 * (S(a) * s > 0 ? 1.05 : 0.95), (C(a) > 0 ? 0.8 : 1.0) * C(a) * R * 0.25, 0];
        b.tri([0, 0, 0.003], e(a0), e(a1), [0.06, 0.06, 0.08, 0.15]);
      }
      b.pop();
    };
    lens(-1);
    lens(1);
    b.quad([-R * 0.14, R * 0.27, z + 0.012], [R * 0.14, R * 0.27, z + 0.012], [R * 0.14, R * 0.25, z + 0.012], [-R * 0.14, R * 0.25, z + 0.012], 0x9a9aa0);
    [-1, 1].forEach(s => b.quad([s * R * 0.72, R * 0.2, R * 0.65], [s * R * 0.72, R * 0.24, R * 0.65], [s * R * 1.0, R * 0.22, -R * 0.2], [s * R * 1.0, R * 0.19, -R * 0.2], 0x8a8a90));
  }

  function drawFace(kind) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(222, 160, 142, 0.85)';
      [64, 192].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 136, 24, 15, 0, 0, PI * 2); ctx.fill(); });
      const ey = 92;
      ctx.strokeStyle = kind === 'beard' ? '#3a2a1e' : '#8a6a50';
      ctx.lineWidth = 6;
      [[84, -1], [172, 1]].forEach(([x, s]) => {
        ctx.beginPath();
        ctx.moveTo(x - s * 22, ey - 20);
        ctx.quadraticCurveTo(x, ey - 28, x + s * 22, ey - 22);
        ctx.stroke();
      });
      [84, 172].forEach(x => {
        ctx.fillStyle = '#efe6e0';
        ctx.beginPath();
        ctx.ellipse(x, ey + 2, 13, 6, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a6670';
        ctx.beginPath();
        ctx.arc(x, ey + 2, 6, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#121012';
        ctx.beginPath();
        ctx.arc(x, ey + 2, 2.6, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5a3c30';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 14, ey + 1);
        ctx.quadraticCurveTo(x, ey - 9, x + 14, ey + 1);
        ctx.stroke();
      });
      ctx.fillStyle = 'rgba(160, 100, 86, 0.6)';
      ctx.beginPath();
      ctx.ellipse(128, 146, 14, 6, 0, 0, PI * 2);
      ctx.fill();
      if (kind === 'beard') {
        ctx.fillStyle = 'rgba(74, 56, 40, 0.95)';
        ctx.beginPath();
        ctx.moveTo(0, 150);
        ctx.quadraticCurveTo(60, 180, 100, 172);
        ctx.quadraticCurveTo(128, 165, 156, 172);
        ctx.quadraticCurveTo(196, 180, 256, 150);
        ctx.lineTo(256, 256);
        ctx.lineTo(0, 256);
        ctx.fill();
      }
      const my = 196;
      ctx.strokeStyle = '#9a5a54';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(104, my);
      ctx.quadraticCurveTo(128, kind === 'smile' ? my + 7 : my + 3, 152, my - (kind === 'smile' ? 2 : 0));
      ctx.stroke();
      ctx.restore();
    };
  }

  const FACES = ['smile', 'plain', 'beard'];

  function build(r) {
    const faces = {};
    FACES.forEach(f => { faces[f] = r.texture(256, drawFace(f), { clamp: true }); });
    const R = D.head;
    const kits = {};
    Object.keys(OUTFITS).forEach(key => {
      const o = OUTFITS[key];
      const hands = {};
      ['L', 'R'].forEach(s => ['open', 'fist', 'pocket', 'grab'].forEach(g => { hands[s + g] = mesh(r, b => buildHand(b, s, g)); }));
      kits[key] = {
        torso: mesh(r, b => buildTorso(b, o, key === 'sweater')),
        extra: mesh(r, b => {
          if (key === 'sweater') collar(b, 0xc8c4bc, 0.14, 0.13, 0.33, 0.39);
          if (key === 'hoodie') buildHoodRoll(b);
          if (key === 'leather') { collar(b, 0x2a8ad8, 0.13, 0.12, 0.33, 0.37); buildJacket(b, 0x18181b, 0x101012, [0.36, 0.26]); }
          if (key === 'winter') buildParka(b, o);
        }),
        pelvis: mesh(r, b => buildPelvis(b, o)),
        thigh: mesh(r, b => buildThigh(b, o)),
        shin: mesh(r, b => buildShin(b, o)),
        foot: mesh(r, b => buildFoot(b, o)),
        upper: mesh(r, b => buildUpper(b, o)),
        fore: mesh(r, b => buildFore(b, o)),
        hair: mesh(r, b => buildHair(b, o.hair)),
        hands
      };
    });
    return {
      faces,
      kits,
      sweater: r.texture(256, sweaterTex),
      knit: r.texture(64, knitTex('#ffffff')),
      neck: mesh(r, b => loft(b, [ring(-0.08, 0.1, 0.095, 0.01, SKIN), ring(0.12, 0.092, 0.088, 0.02, SKIN)], 10)),
      head: mesh(r, b => buildHead(b, false)),
      headBeard: mesh(r, b => buildHead(b, true)),
      face: mesh(r, b => spherePatch(b, R * 1.004, R * 1.084, R * 0.984, -0.95, 0.95, -0.78, 0.46, 12, 9, [1, 1, 1, 0], [1, 1])),
      glasses: mesh(r, buildGlasses),
      beanie: mesh(r, buildBeanie)
    };
  }

  function solve(p) {
    return Rig.solve(p, D);
  }

  function draw(r, V, m0, p) {
    const kit = V.kits[p.outfit];
    const k = p.scale || 1;
    const X = M4.chain(M4.translate(p.p[0], 0, p.p[2]), M4.scale(k, k, k), M4.translate(-p.p[0], 0, -p.p[2]));
    const m = {};
    Object.keys(m0).forEach(key => { if (key !== 'pts') m[key] = M4.mul(X, m0[key]); });
    r.draw(kit.pelvis, m.pelvis);
    r.draw(kit.torso, m.chest, p.outfit === 'sweater' ? { texture: V.sweater } : {});
    r.draw(kit.extra, m.chest);
    r.draw(V.neck, m.neck);
    const hm = m.head;
    r.draw(p.face === 'beard' ? V.headBeard : V.head, hm);
    if (p.beanie) r.draw(V.beanie, hm); else r.draw(kit.hair, hm);
    r.draw(V.face, hm, { texture: V.faces[p.face || 'plain'] });
    if (p.glasses) r.draw(V.glasses, hm);
    ['L', 'R'].forEach(s => {
      r.draw(kit.upper, m['upper' + s]);
      r.draw(kit.fore, m['fore' + s]);
      r.draw(kit.hands[s + (p['g' + s] || 'open')], m['hand' + s]);
      r.draw(kit.thigh, m['thigh' + s]);
      r.draw(kit.shin, m['shin' + s]);
      r.draw(kit.foot, m['foot' + s]);
    });
  }

  window.KartVlad = { D, OUTFITS, solve, build, draw, chestAt };
})();
