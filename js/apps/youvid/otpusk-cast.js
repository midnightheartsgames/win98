(function () {
  const { M4, V3, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh, spherePatch } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const D = { hipX: 0.13, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.13, neckY: 0.34, shX: 0.24, shY: 0.235, upper: 0.31, fore: 0.27, headY: 0.155, head: 0.11 };

  const LOOK = {
    skin: 0xd9ae9e,
    skinShade: 0xc08a78,
    beard: 0x4f392a,
    polo: 0x6e1c2a,
    poloDark: 0x5a1622,
    leather: 0x17171a,
    leatherHi: 0x2a2a2e,
    fur: 0xa89478,
    furDark: 0x8c7a62,
    stripe: 0x8a1e22,
    pants: 0x45464c,
    shoe: 0x1e1e22,
    sole: 0xd8d8d4,
    beanie: 0x6e6a4c,
    beanieDark: 0x5c5940,
    khakiBag: 0xa8a77a,
    blackBag: 0x141416,
    phone: 0x111114,
    screen: [0.16, 0.17, 0.2, 0.3]
  };

  const OP = { hood: 0x6c6c72, hoodIn: 0x3c3c42, cuff: 0x8a3a8a, skin: 0xe0b4a0, hair: 0x2e241e };

  const CHEST_RINGS = [
    [-0.33, 0.15, 0.12, 0.0],
    [-0.3, 0.23, 0.2, 0.04],
    [-0.25, 0.255, 0.25, 0.08],
    [-0.17, 0.275, 0.28, 0.105],
    [-0.08, 0.28, 0.27, 0.09],
    [0.02, 0.275, 0.235, 0.05],
    [0.12, 0.275, 0.205, 0.02],
    [0.22, 0.275, 0.19, 0.0],
    [0.28, 0.26, 0.185, -0.01],
    [0.33, 0.21, 0.155, -0.02],
    [0.36, 0.14, 0.115, -0.012],
    [0.38, 0.1, 0.09, 0.0]
  ];

  function chestAt(y) {
    for (let i = 0; i < CHEST_RINGS.length - 1; i++) {
      const a = CHEST_RINGS[i], b = CHEST_RINGS[i + 1];
      if (y <= b[0]) {
        const k = clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
        return { rx: lerp(a[1], b[1], k), rz: lerp(a[2], b[2], k), cz: lerp(a[3], b[3], k) };
      }
    }
    const l = CHEST_RINGS[CHEST_RINGS.length - 1];
    return { rx: l[1], rz: l[2], cz: l[3] };
  }

  function buildChest(b) {
    const rings = CHEST_RINGS.map(([y, rx, rz, cz]) => ring(y, rx, rz, cz, y < -0.2 ? LOOK.poloDark : LOOK.polo));
    loft(b, rings, 16, { capBottom: true });
    const zAt = (y) => { const c = chestAt(y); return c.cz + c.rz + 0.004; };
    b.quad([-0.012, 0.18, zAt(0.18)], [0.012, 0.18, zAt(0.18)], [0.012, 0.33, zAt(0.33)], [-0.012, 0.33, zAt(0.33)], LOOK.poloDark);
    [0.21, 0.26, 0.31].forEach(y => b.at(0, y, zAt(y) + 0.002, h => K.discXY(h, 0, 0, 0, 0.008, 6, 0x3a0e16)));
    const cy = 0.35;
    const c = chestAt(cy);
    [-1, 1].forEach(s => {
      b.quad([s * 0.01, cy, c.cz + c.rz], [s * 0.12, cy + 0.01, c.cz + c.rz * 0.6], [s * 0.1, cy + 0.06, c.cz + c.rz * 0.3], [s * 0.01, cy + 0.03, c.cz + c.rz + 0.01], LOOK.polo);
    });
  }

  const JACKET = [
    [-0.42, 0.3, 0.29, 0.03],
    [-0.33, 0.29, 0.28, 0.04],
    [-0.25, 0.285, 0.28, 0.05],
    [-0.17, 0.29, 0.29, 0.06],
    [-0.06, 0.3, 0.29, 0.05],
    [0.05, 0.3, 0.27, 0.04],
    [0.14, 0.305, 0.25, 0.02],
    [0.22, 0.31, 0.23, 0.0],
    [0.28, 0.3, 0.21, -0.01],
    [0.32, 0.26, 0.18, -0.015],
    [0.35, 0.17, 0.13, -0.01]
  ];

  function jacketOpen(y) {
    return lerp(0.78, 0.42, clamp((y + 0.42) / 0.77, 0, 1));
  }

  function jacketPt(r, ang, add) {
    return [S(ang) * (r[1] + add), r[0], r[3] + C(ang) * (r[2] + add)];
  }

  function buildJacket(b) {
    const NU = 18;
    const shell = (add, col, inner) => {
      for (let j = 0; j < JACKET.length - 1; j++) {
        const r0 = JACKET[j], r1 = JACKET[j + 1];
        const o0 = jacketOpen(r0[0]), o1 = jacketOpen(r1[0]);
        for (let i = 0; i < NU; i++) {
          const a = (o, u) => o + (PI * 2 - 2 * o) * u;
          const A = jacketPt(r0, a(o0, i / NU), add), B = jacketPt(r0, a(o0, (i + 1) / NU), add);
          const Cc = jacketPt(r1, a(o1, (i + 1) / NU), add), Dd = jacketPt(r1, a(o1, i / NU), add);
          if (inner) b.quad(B, A, Dd, Cc, col); else b.quad(A, B, Cc, Dd, col);
        }
      }
    };
    shell(0, LOOK.leather, false);
    shell(-0.012, LOOK.fur, true);
    for (let j = 0; j < JACKET.length - 1; j++) {
      const r0 = JACKET[j], r1 = JACKET[j + 1];
      [-1, 1].forEach(s => {
        const e0 = jacketPt(r0, s * jacketOpen(r0[0]), 0.004), e1 = jacketPt(r1, s * jacketOpen(r1[0]), 0.004);
        const w0 = jacketPt(r0, s * (jacketOpen(r0[0]) + 0.22), 0.006), w1 = jacketPt(r1, s * (jacketOpen(r1[0]) + 0.22), 0.006);
        if (s > 0) b.quad(e0, w0, w1, e1, LOOK.fur); else b.quad(w0, e0, e1, w1, LOOK.fur);
      });
    }
    [-1, 1].forEach(s => {
      const r = JACKET[6];
      const ang = s * (jacketOpen(r[0]) + 0.5);
      const p = jacketPt(r, ang, 0.003);
      b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(ang));
      b.quad([-0.05, 0, 0], [0.05, 0, 0], [0.05, 0.008, 0], [-0.05, 0.008, 0], LOOK.stripe);
      b.quad([-0.05, 0.018, 0], [0.05, 0.018, 0], [0.05, 0.026, 0], [-0.05, 0.026, 0], LOOK.stripe);
      b.pop();
    });
    const N = 16;
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N;
      const span = (u) => 1.05 + (PI * 2 - 2.1) * u;
      const a0 = span(u0), a1 = span(u1);
      const inner = (a) => [S(a) * 0.15, 0.35, -0.01 + C(a) * 0.12];
      const mid = (a) => [S(a) * 0.2, 0.365, -0.01 + C(a) * 0.16];
      const outer = (a) => [S(a) * 0.27, 0.3, -0.01 + C(a) * 0.21];
      b.quad(inner(a0), inner(a1), mid(a1), mid(a0), LOOK.fur);
      b.quad(mid(a0), mid(a1), outer(a1), outer(a0), LOOK.furDark);
    }
  }

  function buildStrap(b) {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const k = i / 10;
      const y = lerp(0.36, -0.36, k);
      const c = chestAt(Math.max(-0.3, y));
      const x = lerp(0.16, -0.3, k);
      const front = Math.max(0.05, 1 - (x / Math.max(c.rx, 0.01)) ** 2);
      pts.push([x, y, c.cz + c.rz * Math.sqrt(front) * 1.12 + 0.04]);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], c = pts[i + 1];
      b.quad([a[0] - 0.018, a[1], a[2]], [a[0] + 0.018, a[1], a[2]], [c[0] + 0.018, c[1], c[2]], [c[0] - 0.018, c[1], c[2]], 0x0e0e10);
    }
    const back = [];
    for (let i = 0; i <= 10; i++) {
      const k = i / 10;
      const y = lerp(0.36, -0.36, k);
      const c = chestAt(Math.max(-0.3, y));
      const x = lerp(0.16, -0.3, k);
      const f = Math.max(0.05, 1 - (x / Math.max(c.rx, 0.01)) ** 2);
      back.push([x, y, c.cz - c.rz * Math.sqrt(f) * 1.12 - 0.04]);
    }
    for (let i = 0; i < back.length - 1; i++) {
      const a = back[i], c = back[i + 1];
      b.quad([a[0] + 0.018, a[1], a[2]], [a[0] - 0.018, a[1], a[2]], [c[0] - 0.018, c[1], c[2]], [c[0] + 0.018, c[1], c[2]], 0x0e0e10);
    }
  }

  function buildHipBag(b) {
    b.box(0.2, 0.22, 0.08, LOOK.blackBag);
    b.at(0, 0.06, 0.042, h => h.box(0.18, 0.012, 0.004, 0x3a3a3e));
    b.at(0, -0.02, 0.042, h => h.box(0.12, 0.08, 0.004, 0x202024));
  }

  function buildPelvis(b) {
    const P = LOOK.pants;
    loft(b, [ring(-0.17, 0.17, 0.14, -0.01, P), ring(-0.09, 0.26, 0.22, -0.03, P), ring(-0.01, 0.28, 0.24, -0.02, P), ring(0.04, 0.29, 0.25, 0.0, LOOK.poloDark), ring(0.08, 0.29, 0.25, 0.01, LOOK.poloDark)], 14, { capBottom: true, capTop: true });
  }

  function buildThigh(b) {
    const P = LOOK.pants;
    loft(b, [ring(-D.thigh - 0.02, 0.085, 0.09, 0.0, P), ring(-0.3, 0.112, 0.118, 0.0, P), ring(-0.12, 0.138, 0.144, 0.01, P), ring(0.05, 0.145, 0.145, 0.0, P)], 10, { capBottom: true, capTop: true });
  }

  function buildShin(b) {
    const P = LOOK.pants;
    b.ellipsoid(0.085, 0.08, 0.088, 8, 5, P);
    loft(b, [ring(-D.shin + 0.04, 0.07, 0.072, 0.0, P), ring(-0.3, 0.072, 0.076, 0.0, P), ring(-0.12, 0.08, 0.084, 0.01, P), ring(0.0, 0.082, 0.086, 0.0, P)], 10, { capBottom: true });
  }

  function buildFoot(b) {
    b.at(0, -0.04, 0.02, h => h.ellipsoid(0.055, 0.05, 0.075, 8, 4, LOOK.shoe));
    b.push(M4.translate(0, -0.05, 0.07));
    b.box(0.1, 0.07, 0.24, LOOK.shoe);
    b.at(0, -0.04, 0, h => h.box(0.104, 0.025, 0.25, LOOK.sole));
    b.at(0, 0.0, 0.1, h => h.ellipsoid(0.05, 0.035, 0.05, 7, 3, LOOK.shoe));
    b.pop();
  }

  function buildUpper(b) {
    const L = LOOK.leather;
    b.ellipsoid(0.11, 0.1, 0.11, 8, 5, L);
    loft(b, [ring(-D.upper - 0.01, 0.07, 0.074, 0, L), ring(-0.18, 0.084, 0.088, 0, L), ring(-0.04, 0.098, 0.1, 0, L), ring(0.03, 0.094, 0.096, 0, L)], 10, { capBottom: true });
  }

  function buildFore(b) {
    const L = LOOK.leather;
    b.ellipsoid(0.075, 0.075, 0.075, 8, 5, L);
    loft(b, [ring(-D.fore + 0.02, 0.058, 0.06, 0, L), ring(-0.16, 0.066, 0.069, 0, L), ring(0.0, 0.07, 0.072, 0, L)], 10, { capBottom: true });
    b.at(0, -D.fore + 0.03, 0, h => h.prism(10, 0.06, 0.062, -0.02, 0.058, 0.06, 0.02, LOOK.leatherHi));
  }

  function buildHand(b, side, grip) {
    const sk = LOOK.skin;
    const inward = side === 'L' ? -1 : 1;
    b.at(0, -0.045, 0, h => h.box(0.032, 0.09, 0.088, sk));
    if (grip === 'fist' || grip === 'hold') {
      b.at(inward * 0.012, -0.1, 0.0, h => h.box(0.052, 0.048, 0.082, sk));
    } else if (grip === 'phone') {
      b.at(inward * 0.018, -0.1, 0.0, h => h.box(0.032, 0.052, 0.078, sk));
      b.at(inward * 0.012, -0.05, 0.045, h => h.box(0.03, 0.05, 0.024, sk));
    } else if (grip === 'point') {
      b.at(inward * 0.012, -0.095, -0.012, h => h.box(0.046, 0.042, 0.062, sk));
      b.at(0, -0.125, 0.03, h => h.box(0.022, 0.078, 0.022, sk));
    } else if (grip === 'spread') {
      [-0.03, -0.01, 0.01, 0.03].forEach((z, i) => b.push(M4.translate(0, -0.09, z), M4.rotX((i - 1.5) * 0.18)).at(0, -0.035, 0, h => h.box(0.02, 0.075, 0.018, sk)).pop());
    } else {
      b.at(0, -0.118, 0, h => h.box(0.027, 0.062, 0.082, sk));
      b.at(inward * 0.008, -0.152, 0, h => h.box(0.022, 0.025, 0.074, shade(sk, 0.97)));
    }
    b.push(M4.translate(inward * 0.01, -0.03, 0.05), M4.rotX(-0.5));
    b.at(0, -0.025, 0, h => h.box(0.023, 0.05, 0.023, sk));
    b.pop();
  }

  function buildHead(b) {
    const sk = LOOK.skin, R = D.head;
    b.ellipsoid(R * 1.0, R * 1.06, R * 1.0, 14, 10, sk);
    b.at(0, -R * 0.6, R * 0.26, h => h.ellipsoid(R * 0.9, R * 0.55, R * 0.74, 12, 6, LOOK.beard));
    b.at(0, -R * 0.86, R * 0.02, h => h.ellipsoid(R * 0.76, R * 0.42, R * 0.66, 10, 5, shade(LOOK.beard, 0.92)));
    b.at(0, -R * 1.02, -R * 0.2, h => h.ellipsoid(R * 0.8, R * 0.36, R * 0.62, 10, 5, sk));
    [-1, 1].forEach(s => b.at(s * R * 0.97, -R * 0.06, -R * 0.04, h => h.ellipsoid(R * 0.12, R * 0.24, R * 0.17, 6, 4, shade(sk, 0.86))));
    b.at(0, -R * 0.12, R * 0.98, h => h.ellipsoid(R * 0.18, R * 0.21, R * 0.17, 6, 4, shade(sk, 0.95)));
  }

  function beanieTex(ctx, w, h) {
    ctx.fillStyle = '#6e6a4c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(40,38,26,0.35)';
    for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1.5, h);
    ctx.fillStyle = 'rgba(40,38,26,0.3)';
    ctx.fillRect(0, h * 0.44, w, 3);
    ctx.save();
    ctx.translate(w * 0.5, h * 0.22);
    ctx.strokeStyle = '#d8d4c4';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-12, 7);
    ctx.lineTo(-7, -8);
    ctx.lineTo(-2, 7);
    ctx.moveTo(1, 7);
    ctx.lineTo(6, -8);
    ctx.lineTo(11, 7);
    ctx.moveTo(3, 2);
    ctx.lineTo(9, 2);
    ctx.stroke();
    ctx.restore();
  }

  function buildBeanie(b) {
    const R = D.head;
    const nu = 18, nv = 7;
    const pt = (i, j) => {
      const yaw = -PI + (i / nu) * 2 * PI;
      const lowF = 0.42 - 0.06 * C(yaw);
      const pit = -lowF * 0 + (lowF + (PI / 2 - lowF) * (j / nv));
      const k = 1.05 + (j === 0 ? 0.03 : 0) + 0.015 * S(j * 1.3);
      return [S(yaw) * C(pit) * R * 1.0 * k, S(pit) * R * 1.12 * k + R * 0.05 - (j === 0 ? 0 : 0), C(yaw) * C(pit) * R * k];
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), 0xffffff, [[i / nu, j / nv * 0.5], [(i + 1) / nu, j / nv * 0.5], [(i + 1) / nu, (j + 1) / nv * 0.5], [i / nu, (j + 1) / nv * 0.5]]);
      }
    }
    const cuff = (yaw, pit, k) => [S(yaw) * C(pit) * R * k, S(pit) * R * 1.12 * k + R * 0.05, C(yaw) * C(pit) * R * k];
    for (let i = 0; i < nu; i++) {
      const y0 = -PI + (i / nu) * 2 * PI, y1 = -PI + ((i + 1) / nu) * 2 * PI;
      const l0 = 0.42 - 0.06 * C(y0), l1 = 0.42 - 0.06 * C(y1);
      b.quad(cuff(y0, l0 - 0.03, 1.08), cuff(y1, l1 - 0.03, 1.08), cuff(y1, l1 + 0.42, 1.11), cuff(y0, l0 + 0.42, 1.11), 0xffffff, [[i / nu, 0.55], [(i + 1) / nu, 0.55], [(i + 1) / nu, 1], [i / nu, 1]]);
    }
  }

  const EYES = ['open', 'half', 'shut', 'up', 'side'];
  const MOUTHS = ['shut', 'open', 'wide'];

  function drawFace(eyes, mouth, frown) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(205, 100, 88, 0.2)';
      [62, 194].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 128, 28, 17, 0, 0, PI * 2); ctx.fill(); });
      ctx.fillStyle = 'rgba(96, 70, 50, 0.9)';
      ctx.beginPath();
      ctx.moveTo(2, 116);
      ctx.quadraticCurveTo(26, 166, 72, 174);
      ctx.quadraticCurveTo(104, 166, 128, 170);
      ctx.quadraticCurveTo(152, 166, 184, 174);
      ctx.quadraticCurveTo(230, 166, 254, 116);
      ctx.lineTo(256, 256);
      ctx.lineTo(0, 256);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(84, 60, 42, 0.9)';
      ctx.beginPath();
      ctx.moveTo(90, 186);
      ctx.quadraticCurveTo(128, 170, 166, 186);
      ctx.quadraticCurveTo(128, 181, 90, 186);
      ctx.fill();
      const ey = 78;
      ctx.strokeStyle = '#4a3626';
      ctx.lineWidth = 9;
      [[82, -1], [174, 1]].forEach(([x, s]) => {
        ctx.beginPath();
        if (frown) {
          ctx.moveTo(x - s * 24, ey - 30);
          ctx.quadraticCurveTo(x, ey - 26, x + s * 20, ey - 16);
        } else {
          ctx.moveTo(x - s * 22, ey - 22);
          ctx.quadraticCurveTo(x, ey - 31, x + s * 22, ey - 24);
        }
        ctx.stroke();
      });
      [82, 174].forEach(x => {
        if (eyes === 'shut') {
          ctx.strokeStyle = '#3c2a24';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x - 15, ey + 1);
          ctx.quadraticCurveTo(x, ey + 6, x + 15, ey + 1);
          ctx.stroke();
          return;
        }
        const tall = eyes === 'half' ? 4.5 : eyes === 'up' ? 10 : 8.5;
        const px = eyes === 'side' ? x - 6 : x;
        const py = eyes === 'up' ? ey - 2 : ey + 2;
        ctx.fillStyle = '#efe6e0';
        ctx.beginPath();
        ctx.ellipse(x, ey + 2, 17, tall, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a5e5a';
        ctx.beginPath();
        ctx.arc(px, py + (eyes === 'half' ? 1 : 0), Math.min(7.5, tall + 1), 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#121012';
        ctx.beginPath();
        ctx.arc(px, py, 3.4, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3a2620';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x - 15, ey + 2 - tall * 0.6);
        ctx.quadraticCurveTo(x, ey - tall - 2, x + 15, ey + 2 - tall * 0.6);
        ctx.stroke();
      });
      ctx.fillStyle = 'rgba(150, 92, 80, 0.4)';
      ctx.beginPath();
      ctx.ellipse(128, 134, 15, 6, 0, 0, PI * 2);
      ctx.fill();
      const my = 202;
      ctx.fillStyle = '#3a1a1a';
      ctx.strokeStyle = '#7a4440';
      ctx.lineWidth = 4;
      if (mouth === 'shut') {
        ctx.beginPath();
        ctx.moveTo(106, my);
        ctx.quadraticCurveTo(128, frown ? my - 2 : my + 4, 150, my);
        ctx.stroke();
      } else {
        const hh = mouth === 'wide' ? 16 : 8;
        ctx.beginPath();
        ctx.ellipse(128, my + 2, mouth === 'wide' ? 21 : 16, hh, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e4dcd2';
        ctx.fillRect(115, my - hh + 4, 26, mouth === 'wide' ? 4 : 2.5);
      }
      ctx.restore();
    };
  }

  function opFace(mood) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.fillStyle = 'rgba(120, 84, 66, 0.22)';
      ctx.beginPath();
      ctx.ellipse(128, 205, 70, 46, 0, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3a2a1e';
      ctx.lineWidth = 8;
      [[80, -1], [176, 1]].forEach(([x, s]) => {
        ctx.beginPath();
        ctx.moveTo(x - s * 26, mood === 'shout' ? 46 : 54);
        ctx.quadraticCurveTo(x, 42, x + s * 26, 50);
        ctx.stroke();
      });
      [80, 176].forEach(x => {
        if (mood === 'hug') {
          ctx.strokeStyle = '#3a2a1e';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(x - 18, 80);
          ctx.quadraticCurveTo(x, 88, x + 18, 80);
          ctx.stroke();
          return;
        }
        ctx.fillStyle = '#f2ece6';
        ctx.beginPath();
        ctx.ellipse(x, 80, 18, mood === 'shout' ? 12 : 10, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a6a62';
        ctx.beginPath();
        ctx.arc(x + 4, 79, 7.5, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#141012';
        ctx.beginPath();
        ctx.arc(x + 4, 79, 3.5, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4a3226';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, 80, 18, mood === 'shout' ? 12 : 10, 0, PI, PI * 2);
        ctx.stroke();
      });
      ctx.fillStyle = 'rgba(150, 96, 80, 0.45)';
      ctx.beginPath();
      ctx.moveTo(120, 96);
      ctx.lineTo(112, 136);
      ctx.quadraticCurveTo(128, 146, 144, 136);
      ctx.lineTo(136, 96);
      ctx.fill();
      const my = 182;
      ctx.fillStyle = '#3a1416';
      ctx.strokeStyle = '#9a5a54';
      ctx.lineWidth = 5;
      if (mood === 'grin') {
        ctx.beginPath();
        ctx.moveTo(84, my - 8);
        ctx.quadraticCurveTo(128, my + 30, 172, my - 8);
        ctx.quadraticCurveTo(128, my + 6, 84, my - 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f2eee6';
        ctx.fillRect(100, my - 4, 56, 8);
      } else if (mood === 'shout' || mood === 'hug') {
        ctx.beginPath();
        ctx.ellipse(128, my + 4, mood === 'hug' ? 18 : 30, mood === 'hug' ? 14 : 28, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#c85a62';
        ctx.beginPath();
        ctx.ellipse(128, my + (mood === 'hug' ? 12 : 20), mood === 'hug' ? 10 : 18, mood === 'hug' ? 5 : 9, 0, 0, PI * 2);
        ctx.fill();
      } else if (mood === 'tongue') {
        ctx.beginPath();
        ctx.ellipse(128, my, 26, 16, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#d8606a';
        ctx.beginPath();
        ctx.ellipse(128, my + 20, 18, 24, 0, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a8404a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(128, my + 6);
        ctx.lineTo(128, my + 34);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(96, my);
        ctx.quadraticCurveTo(128, my + 12, 164, my - 8);
        ctx.stroke();
      }
      ctx.restore();
    };
  }

  function buildKhakiBag(b) {
    const col = LOOK.khakiBag;
    const g = rand(5);
    const rings = [[-0.42, 0.13, 0.06], [-0.36, 0.17, 0.09], [-0.2, 0.18, 0.1], [-0.08, 0.15, 0.07], [-0.03, 0.08, 0.035]];
    for (let j = 0; j < rings.length - 1; j++) {
      const a = rings[j], c = rings[j + 1];
      for (let i = 0; i < 10; i++) {
        const u0 = (i / 10) * PI * 2, u1 = ((i + 1) / 10) * PI * 2;
        const w0 = 1 + (g() - 0.5) * 0.12, w1 = 1 + (g() - 0.5) * 0.12;
        b.quad([S(u0) * a[1] * w0, a[0], C(u0) * a[2]], [S(u1) * a[1], a[0], C(u1) * a[2]], [S(u1) * c[1] * w1, c[0], C(u1) * c[2]], [S(u0) * c[1], c[0], C(u0) * c[2]], i % 3 ? col : shade(col, 0.9));
      }
    }
    b.at(0, -0.42, 0, h => h.ellipsoid(0.13, 0.02, 0.06, 8, 2, shade(col, 0.85)));
    [-1, 1].forEach(s => K.tube(b, [[s * 0.06, -0.04, 0], [s * 0.03, 0.0, 0], [0, 0.01, 0]], [0.01, 0.01, 0.01], 4, col));
  }

  function buildBlackBag(b) {
    b.at(0, -0.17, 0, h => h.box(0.26, 0.24, 0.12, LOOK.blackBag));
    b.at(0, -0.06, 0, h => h.box(0.22, 0.03, 0.1, 0x222226));
    [-1, 1].forEach(s => K.tube(b, [[s * 0.08, -0.06, 0], [s * 0.05, 0.0, 0], [0, 0.015, 0]], [0.01, 0.01, 0.01], 4, LOOK.blackBag));
  }

  function buildPhone(b) {
    b.box(0.07, 0.145, 0.011, LOOK.phone);
    b.quad([-0.031, -0.066, 0.0062], [0.031, -0.066, 0.0062], [0.031, 0.066, 0.0062], [-0.031, 0.066, 0.0062], LOOK.screen);
  }

  function buildOpHead(b) {
    const R = 0.105;
    b.ellipsoid(R * 0.95, R * 1.08, R, 12, 8, OP.skin);
    b.at(0, -R * 0.12, R * 0.97, h => h.ellipsoid(R * 0.17, R * 0.22, R * 0.18, 6, 4, shade(OP.skin, 0.94)));
    b.at(0, R * 0.55, R * 0.25, h => h.ellipsoid(R * 0.9, R * 0.4, R * 0.75, 10, 4, OP.hair));
    const nu = 16, nv = 6;
    const pt = (i, j, k) => {
      const yaw = -PI * 0.78 + (i / nu) * PI * 1.56;
      const pit = -0.9 + (j / nv) * (PI / 2 + 0.9);
      return [S(yaw + PI) * C(pit) * R * k, S(pit) * R * 1.25 * k + 0.02, -C(yaw) * C(pit) * R * k * 1.05 - 0.01];
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        b.quad(pt(i, j, 1.45), pt(i + 1, j, 1.45), pt(i + 1, j + 1, 1.45), pt(i, j + 1, 1.45), OP.hood);
        b.quad(pt(i + 1, j, 1.38), pt(i, j, 1.38), pt(i, j + 1, 1.38), pt(i + 1, j + 1, 1.38), OP.hoodIn);
      }
    }
    b.at(0, -0.24, -0.02, h => h.ellipsoid(0.22, 0.1, 0.14, 10, 4, OP.hood));
  }

  function buildOpArm(b) {
    loft(b, [ring(-0.62, 0.042, 0.045, 0, OP.cuff), ring(-0.57, 0.044, 0.047, 0, OP.cuff), ring(-0.565, 0.05, 0.052, 0, OP.hood), ring(-0.3, 0.06, 0.062, 0, OP.hood), ring(0.0, 0.07, 0.07, 0, OP.hood)], 10, { capBottom: false });
    b.push(M4.translate(0, -0.62, 0));
    b.at(0, -0.045, 0, h => h.box(0.03, 0.09, 0.085, OP.skin));
    [-0.03, -0.01, 0.01, 0.03].forEach(z => b.at(0, -0.125, z, h => h.box(0.02, 0.075, 0.018, OP.skin)));
    b.push(M4.translate(-0.012, -0.04, 0.05), M4.rotX(-0.6));
    b.at(0, -0.03, 0, h => h.box(0.022, 0.06, 0.022, OP.skin));
    b.pop();
    b.pop();
  }

  function buildOpFinger(b) {
    loft(b, [ring(-0.62, 0.042, 0.045, 0, OP.cuff), ring(-0.57, 0.044, 0.047, 0, OP.cuff), ring(-0.565, 0.05, 0.052, 0, OP.hood), ring(-0.3, 0.06, 0.062, 0, OP.hood), ring(0.0, 0.07, 0.07, 0, OP.hood)], 10, {});
    b.push(M4.translate(0, -0.62, 0));
    b.at(0, -0.045, 0, h => h.box(0.03, 0.09, 0.085, OP.skin));
    b.at(0.008, -0.1, -0.01, h => h.box(0.046, 0.04, 0.06, OP.skin));
    b.at(0, -0.135, 0.03, h => h.box(0.02, 0.08, 0.02, OP.skin));
    b.pop();
  }

  function buildLeaf(b) {
    const col = 0xd07a2a;
    const pts = [[0, 0], [0.03, 0.03], [0.06, 0.02], [0.05, 0.05], [0.07, 0.08], [0.035, 0.075], [0, 0.11], [-0.035, 0.075], [-0.07, 0.08], [-0.05, 0.05], [-0.06, 0.02], [-0.03, 0.03]];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], c = pts[(i + 1) % pts.length];
      b.tri([0, 0.05, 0], [a[0], a[1], 0], [c[0], c[1], 0], col);
    }
    b.quad([-0.003, -0.04, 0.001], [0.003, -0.04, 0.001], [0.003, 0.05, 0.001], [-0.003, 0.05, 0.001], 0x8a4a1a);
  }

  function buildWalker(b, look) {
    const L = look;
    loft(b, [ring(0.9, 0.17, 0.12, 0, L.coat), ring(1.15, 0.19, 0.13, 0, L.coat), ring(1.42, 0.2, 0.12, 0, L.coat), ring(1.5, 0.08, 0.07, 0, L.skin)], 10, { capBottom: true });
    if (L.skirt) loft(b, [ring(0.55, 0.22, 0.17, 0, L.coat), ring(0.9, 0.17, 0.12, 0, L.coat)], 10, { capBottom: true });
    b.at(0, 1.6, 0, h => h.ellipsoid(0.1, 0.12, 0.1, 10, 6, L.skin));
    b.at(0, 1.67, -0.01, h => h.ellipsoid(0.105, 0.08, 0.105, 10, 4, L.hair));
    [-1, 1].forEach(s => K.tube(b, [[s * 0.21, 1.4, 0], [s * 0.25, 1.12, 0.02], [s * 0.24, 0.88, 0.06]], [0.05, 0.045, 0.04], 6, L.coat));
  }

  function buildLeg(b, col) {
    K.tube(b, [[0, 0, 0], [0, -0.45, 0.02], [0, -0.86, 0]], [0.065, 0.055, 0.045], 6, col);
    b.at(0, -0.88, 0.05, h => h.box(0.09, 0.06, 0.22, 0x1a1a1c));
  }

  function buildPram(b) {
    const c = 0x2a3a5a;
    b.at(0, 0.62, 0, h => h.box(0.5, 0.32, 0.85, c));
    const nu = 8;
    for (let i = 0; i < nu; i++) {
      const a0 = (i / nu) * PI * 0.55, a1 = ((i + 1) / nu) * PI * 0.55;
      b.quad([-0.25, 0.78 + S(a0) * 0.35, -0.42 + C(a0) * 0.35 - 0.35], [0.25, 0.78 + S(a0) * 0.35, -0.42 + C(a0) * 0.35 - 0.35], [0.25, 0.78 + S(a1) * 0.35, -0.42 + C(a1) * 0.35 - 0.35], [-0.25, 0.78 + S(a1) * 0.35, -0.42 + C(a1) * 0.35 - 0.35], shade(c, 0.8));
    }
    [[-0.22, -0.3], [0.22, -0.3], [-0.22, 0.3], [0.22, 0.3]].forEach(([x, z]) => b.push(M4.translate(x, 0.14, z), M4.rotZ(PI / 2)).prism(10, 0.14, 0.14, -0.02, 0.14, 0.14, 0.02, 0x111111, { capBottom: true }).pop());
    K.tube(b, [[0, 0.8, 0.42], [0, 1.0, 0.75]], [0.02, 0.02], 4, 0x333333);
    b.at(0, 1.0, 0.75, h => h.box(0.5, 0.04, 0.04, 0x333333));
  }

  function build(r) {
    const faces = {};
    EYES.forEach(e => MOUTHS.forEach(m => [0, 1].forEach(f => { faces[e + '-' + m + '-' + f] = r.texture(256, drawFace(e, m, f), { clamp: true }); })));
    const opFaces = {};
    ['smirk', 'grin', 'shout', 'tongue', 'hug'].forEach(m => { opFaces[m] = r.texture(256, opFace(m), { clamp: true }); });
    const R = D.head;
    const hands = {};
    ['L', 'R'].forEach(s => ['open', 'fist', 'phone', 'point', 'hold', 'spread'].forEach(gr => { hands[s + gr] = mesh(r, b => buildHand(b, s, gr)); }));
    const WALKERS = {
      pram: { coat: 0xa82a2a, skin: 0xd8b0a0, hair: 0x3a2a20, legs: 0x222226, skirt: true },
      man: { coat: 0x2a2c32, skin: 0xd8b0a0, hair: 0x2a2420, legs: 0x3a3c44 },
      woman: { coat: 0x7a5a6a, skin: 0xd8b0a0, hair: 0x5a3a2a, legs: 0x222226, skirt: true },
      kid: { coat: 0x3a5a8a, skin: 0xd8b0a0, hair: 0x4a3a2a, legs: 0x2a2a30 }
    };
    const walkers = {};
    Object.keys(WALKERS).forEach(k => { walkers[k] = { body: mesh(r, b => buildWalker(b, WALKERS[k])), leg: mesh(r, b => buildLeg(b, WALKERS[k].legs)) }; });
    return {
      faces,
      opFaces,
      beanieTex: r.texture(64, beanieTex),
      chest: mesh(r, buildChest),
      jacket: mesh(r, buildJacket),
      strap: mesh(r, buildStrap),
      hipBag: mesh(r, buildHipBag),
      pelvis: mesh(r, buildPelvis),
      neck: mesh(r, b => loft(b, [ring(-0.08, 0.1, 0.095, 0.01, LOOK.skin), ring(0.1, 0.09, 0.085, 0.02, LOOK.skin)], 10)),
      head: mesh(r, buildHead),
      beanie: mesh(r, buildBeanie),
      face: mesh(r, b => spherePatch(b, R * 1.005, R * 1.065, R * 1.006, -0.95, 0.95, -0.74, 0.42, 10, 8, [1, 1, 1, 0], [1, 1])),
      upper: mesh(r, buildUpper),
      fore: mesh(r, buildFore),
      hands,
      thigh: mesh(r, buildThigh),
      shin: mesh(r, buildShin),
      foot: mesh(r, buildFoot),
      phone: mesh(r, buildPhone),
      khakiBag: mesh(r, buildKhakiBag),
      blackBag: mesh(r, buildBlackBag),
      opHead: mesh(r, buildOpHead),
      opFace: mesh(r, b => spherePatch(b, 0.105 * 0.96, 0.105 * 1.09, 0.105 * 1.01, -0.95, 0.95, -0.74, 0.42, 10, 8, [1, 1, 1, 0], [1, 1])),
      opArm: mesh(r, buildOpArm),
      opFinger: mesh(r, buildOpFinger),
      leaf: mesh(r, buildLeaf),
      bottle: mesh(r, b => { b.prism(8, 0.035, 0.035, 0, 0.035, 0.035, 0.2, [0.7, 0.75, 0.7, 0.2]); b.prism(8, 0.035, 0.035, 0.2, 0.014, 0.014, 0.26, [0.7, 0.75, 0.7, 0.2]); }),
      pram: mesh(r, buildPram),
      walkers
    };
  }

  function faceKey(p) {
    const e = EYES.includes(p.eyes) ? p.eyes : 'open';
    const m = MOUTHS.includes(p.mouth) ? p.mouth : 'shut';
    return e + '-' + m + '-' + (p.frown ? 1 : 0);
  }

  function hangM(at, swing, ry) {
    return M4.chain(M4.translate(at[0], at[1], at[2]), M4.rotY(ry || 0), M4.rotX(swing[0]), M4.rotZ(swing[1]));
  }

  function draw(r, V, m, p, opts) {
    const o = opts || {};
    const pass = o.tint ? { tint: o.tint } : {};
    r.draw(V.pelvis, m.pelvis, pass);
    r.draw(V.chest, m.chest, pass);
    if (p.jacketOff) r.draw(V.jacket, M4.chain(m.chest, M4.translate(-0.05 * p.jacketOff, -0.04 * p.jacketOff, -0.03 * p.jacketOff), M4.rotZ(0.15 * p.jacketOff)), pass);
    else r.draw(V.jacket, m.chest, pass);
    if (p.strap) {
      r.draw(V.strap, m.chest, pass);
      r.draw(V.hipBag, M4.chain(m.pelvis, M4.translate(-0.33, -0.12, 0.04), M4.rotY(-1.3), M4.rotZ(0.1)), pass);
    }
    r.draw(V.neck, m.neck, pass);
    const hm = M4.chain(m.head, M4.translate(0, 0.012, 0.004), M4.scale(1.24, 1.22, 1.18));
    r.draw(V.head, hm, pass);
    r.draw(V.beanie, hm, Object.assign({ texture: V.beanieTex }, pass));
    if (!o.noFace) r.draw(V.face, hm, Object.assign({ texture: V.faces[faceKey(p)] }, pass));
    ['L', 'R'].forEach(s => {
      r.draw(V.upper, m['upper' + s], pass);
      r.draw(V.fore, m['fore' + s], pass);
      const grip = p['g' + s] || 'open';
      r.draw(V.hands[s + grip], m['hand' + s], pass);
      r.draw(V.thigh, m['thigh' + s], pass);
      r.draw(V.shin, m['shin' + s], pass);
      r.draw(V.foot, m['foot' + s], pass);
      const bag = p['bag' + s];
      if (bag) {
        const at = M4.point(m['hand' + s], [0, -0.12, 0]);
        const sw = p['swing' + s] || [0, 0];
        if (bag.includes('khaki')) r.draw(V.khakiBag, hangM(at, sw, p.bagYaw || 0), pass);
        if (bag.includes('black')) r.draw(V.blackBag, hangM([at[0] + 0.04, at[1], at[2] + 0.03], [sw[0] * 0.8, sw[1] * 0.8], (p.bagYaw || 0) + 0.4), pass);
      }
    });
    if (p.phone) {
      const s = p.phone;
      const k = s === 'L' ? 1 : -1;
      r.draw(V.phone, M4.chain(m['hand' + s], M4.translate(-k * 0.035, -0.1, 0.03), M4.rotY(-k * PI / 2), M4.rotX(0.1)), pass);
    }
    if (p.leaf) r.draw(V.leaf, M4.chain(m.chest, M4.translate(0.2, 0.18, 0.3), M4.rotY(0.5), M4.rotZ(0.3)), pass);
  }

  function walkerDraw(r, V, kind, pos, yaw, phase, moving) {
    const w = V.walkers[kind];
    const base = M4.chain(M4.translate(pos[0], 0, pos[2]), M4.rotY(yaw));
    const bob = moving ? Math.abs(S(phase)) * 0.03 : 0;
    r.draw(w.body, M4.mul(base, M4.translate(0, bob, 0)));
    [-1, 1].forEach(s => {
      const sw = moving ? S(phase + (s > 0 ? 0 : PI)) * 0.42 : 0;
      r.draw(w.leg, M4.chain(base, M4.translate(s * 0.09, 0.92 + bob, 0), M4.rotX(-sw)));
    });
    if (kind === 'pram') r.draw(V.pram, M4.chain(base, M4.translate(0, 0, 0.95)));
  }

  function solve(p) {
    return Rig.solve(p, D);
  }

  window.OtpuskCast = { D, LOOK, OP, solve, build, draw, walkerDraw, chestAt };
})();
