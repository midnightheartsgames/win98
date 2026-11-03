(function () {
  const { M4, V3, shade, rand, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh, tube } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const D = { hipX: 0.13, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.13, neckY: 0.33, shX: 0.23, shY: 0.235, upper: 0.3, fore: 0.27, headY: 0.155, head: 0.112 };
  const R = D.head;

  const LOOK = {
    skin: 0xe2b8a4,
    skinShade: 0xc8988a,
    hair: 0x1c1714,
    hairHi: 0x2e2620,
    brow: '#1e1612',
    pants: 0x26262a,
    shoe: 0x18181b,
    phones: 0x16161a,
    phonesHi: 0x34343a,
    cushion: 0x0e0e10,
    cable: 0x0c0c0e
  };

  const SHIRTS = {
    grey: { col: 0x8e8e92, ink: '#5a5a60' },
    white: { col: 0xe9e9eb, ink: '#2a2a2e' },
    black: { col: 0x1b1b1e, ink: '#d8d8dc' },
    bulka: { col: 0x19191c, ink: '#e4e4e8' }
  };

  const FACE = { Y0: -1.0, Y1: 1.0, P0: -1.15, P1: 0.45 };

  function headDir(yaw, pit) {
    return [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
  }

  function headPt(yaw, pit, k) {
    const n = headDir(yaw, pit);
    const low = Math.max(0, -n[1]);
    const front = Math.max(0, n[2]);
    const x = n[0] * R * 0.95 * (1 + 0.13 * low * (1 - 0.75 * low));
    const y = n[1] * R * (n[1] > 0 ? 1.04 : 1.12);
    const z = n[2] * R * (n[2] > 0 ? 1.0 + 0.24 * low * front * front : 0.93);
    const s = k || 1;
    return [x * s, y * s, z * s];
  }

  function headNormal(yaw, pit) {
    const e = 0.01;
    const a = headPt(yaw - e, pit), b = headPt(yaw + e, pit), c = headPt(yaw, pit - e), d = headPt(yaw, pit + e);
    const n = V3.norm(V3.cross(V3.sub(b, a), V3.sub(d, c)));
    const p = headPt(yaw, pit);
    return V3.dot(n, p) < 0 ? V3.mul(n, -1) : n;
  }

  function headPatch(b, y0, y1, p0, p1, nu, nv, k, col, uvFn) {
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const ya = y0 + (y1 - y0) * (i / nu), yb = y0 + (y1 - y0) * ((i + 1) / nu);
        const pa = p0 + (p1 - p0) * (j / nv), pb = p0 + (p1 - p0) * ((j + 1) / nv);
        const kk = typeof k === 'function' ? k : () => k;
        const v = [[ya, pa], [yb, pa], [yb, pb], [ya, pb]];
        const pts = v.map(([y, p]) => headPt(y, p, kk(y, p)));
        const ns = v.map(([y, p]) => headNormal(y, p));
        const cols = typeof col === 'function' ? v.map(([y, p]) => rgb(col(y, p))) : col;
        b.quad(pts[0], pts[1], pts[2], pts[3], cols, uvFn ? v.map(([y, p]) => uvFn(y, p)) : null, ns);
      }
    }
  }

  function buildHead(b) {
    headPatch(b, -PI, PI, -PI / 2, PI / 2, 20, 14, 1, (y, p) => {
      const n = headDir(y, p);
      return n[1] < -0.7 ? shade(LOOK.skin, 0.9) : LOOK.skin;
    });
    b.at(0, -R * 0.2, R * 1.0, h => h.ellipsoid(R * 0.11, R * 0.19, R * 0.12, 7, 5, shade(LOOK.skin, 0.97)));
    [-1, 1].forEach(s => b.at(s * R * 0.075, -R * 0.33, R * 1.01, h => h.ellipsoid(R * 0.055, R * 0.045, R * 0.05, 5, 4, shade(LOOK.skin, 0.94))));
  }

  function hairline(yaw) {
    const a = Math.abs(yaw);
    if (a < 0.55) return 0.8 - 0.06 * (a / 0.55);
    if (a < 1.1) return 0.74 - 0.3 * ((a - 0.55) / 0.55);
    if (a < 1.8) return 0.44 - 0.36 * ((a - 1.1) / 0.7);
    return 0.08 - 0.5 * clamp((a - 1.8) / 0.9, 0, 1);
  }

  function hairScale(yaw, pit) {
    const top = clamp((pit - 0.2) / 1.1, 0, 1);
    const front = Math.max(0, C(yaw));
    const quiff = front * clamp(1 - Math.abs(pit - 0.95) / 0.3, 0, 1) * 0.09;
    return 1.03 + 0.045 * top + quiff;
  }

  function buildHair(b) {
    const nu = 28, nv = 9, g = rand(41);
    for (let i = 0; i < nu; i++) {
      const ya = -PI + (2 * PI * i) / nu, yb = -PI + (2 * PI * (i + 1)) / nu;
      const ha = hairline(ya), hb = hairline(yb);
      for (let j = 0; j < nv; j++) {
        const ka = j / nv, kb = (j + 1) / nv;
        const p = (y, h, k) => h + (PI / 2 - h) * k;
        const v = [[ya, p(ya, ha, ka)], [yb, p(yb, hb, ka)], [yb, p(yb, hb, kb)], [ya, p(ya, ha, kb)]];
        const pts = v.map(([y, pp]) => headPt(y, pp, hairScale(y, pp)));
        const ns = v.map(([y, pp]) => headNormal(y, pp));
        const col = j >= nv - 3 && (i % 7 === 2) ? LOOK.hairHi : LOOK.hair;
        b.quad(pts[0], pts[1], pts[2], pts[3], col, null, ns);
      }
      const e0 = headPt(ya, ha, hairScale(ya, ha)), e1 = headPt(yb, hb, hairScale(yb, hb));
      const i0 = headPt(ya, ha - 0.04, 1.0), i1 = headPt(yb, hb - 0.04, 1.0);
      b.quad(i0, i1, e1, e0, shade(LOOK.hair, 0.8));
    }
    for (let i = 0; i < 16; i++) {
      const yaw = -0.7 + g() * 1.4;
      const pit = 0.8 + g() * 0.25;
      const p = headPt(yaw, pit, hairScale(yaw, pit));
      b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw), M4.rotX(-1.15 - g() * 0.4), M4.rotZ((g() - 0.5) * 0.6));
      b.prism(4, 0.016 + g() * 0.008, 0.009, 0, 0.003, 0.003, 0.026 + g() * 0.018, g() < 0.4 ? LOOK.hairHi : LOOK.hair);
      b.pop();
    }
  }

  function cupCenter(s) {
    const p = headPt(s * PI / 2, -0.06, 1.0);
    return [p[0] + s * 0.024, p[1], p[2] - R * 0.06];
  }

  function buildPhones(b) {
    [-1, 1].forEach(s => {
      const c = cupCenter(s);
      b.push(M4.translate(c[0], c[1], c[2]));
      b.at(s * 0.012, 0, 0, h => h.ellipsoid(0.024, 0.064, 0.054, 12, 7, LOOK.phones));
      b.at(-s * 0.012, 0, 0, h => h.ellipsoid(0.02, 0.06, 0.05, 12, 6, LOOK.cushion));
      b.at(s * 0.03, 0, 0, h => h.ellipsoid(0.008, 0.04, 0.034, 10, 4, LOOK.phonesHi));
      b.pop();
      const top = [c[0] + s * 0.004, c[1] + 0.06, c[2]];
      const mid = [c[0] + s * 0.002, c[1] + 0.085, c[2] - 0.004];
      tube(b, [top, mid], [0.009, 0.008], 6, LOOK.phonesHi);
    });
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const a = -1.2 + (2.4 * i) / 16;
      pts.push([S(a) * R * 1.17, C(a) * R * 1.2 - R * 0.0 + (Math.abs(a) > 1.0 ? -(Math.abs(a) - 1.0) * 0.08 : 0), -R * 0.14]);
    }
    const cupTopY = cupCenter(1)[1] + 0.085;
    pts[0][1] = Math.max(pts[0][1], cupTopY);
    pts[16][1] = Math.max(pts[16][1], cupTopY);
    tube(b, pts, pts.map(() => 0.011), 6, LOOK.phones);
    const pad = pts.slice(4, 13).map(p => [p[0] * 0.985, p[1] * 0.985 - 0.006, p[2]]);
    tube(b, pad, pad.map(() => 0.014), 6, LOOK.cushion);
  }

  const CHEST_RINGS = [
    [-0.3, 0.17, 0.14, 0.02],
    [-0.22, 0.225, 0.19, 0.05],
    [-0.12, 0.25, 0.215, 0.07],
    [-0.02, 0.255, 0.21, 0.06],
    [0.08, 0.255, 0.19, 0.035],
    [0.17, 0.262, 0.17, 0.015],
    [0.25, 0.262, 0.16, 0.0],
    [0.3, 0.245, 0.15, -0.008],
    [0.322, 0.19, 0.12, -0.02],
    [0.342, 0.12, 0.088, -0.024],
    [0.352, 0.08, 0.07, -0.018]
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
    loft(b, CHEST_RINGS.map(([y, rx, rz, cz]) => ring(y, rx, rz, cz, 0xffffff)), 18, { capBottom: true });
    const N = 14;
    for (let i = 0; i < N; i++) {
      const span = (u) => -PI * 0.62 + PI * 1.24 * u;
      const a0 = span(i / N), a1 = span((i + 1) / N);
      const inner = (a) => [S(a) * 0.072, 0.35, -0.012 + C(a) * 0.066];
      const outer = (a) => [S(a) * 0.095, 0.34, -0.012 + C(a) * 0.084];
      b.quad(inner(a0), inner(a1), outer(a1), outer(a0), 0xd8d8d8);
    }
  }

  function buildPrintPatch(b) {
    const y0 = -0.12, y1 = 0.31, a0 = -1.25, a1 = 1.25, nu = 14, nv = 8;
    const pt = (u, v) => {
      const y = y0 + (y1 - y0) * v;
      const c = chestAt(y);
      const a = a0 + (a1 - a0) * u;
      return [S(a) * c.rx * 1.01, y, c.cz + C(a) * c.rz * 1.01];
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const am = a0 + (a1 - a0) * (u0 + u1) / 2;
        const n = V3.norm([S(am), 0, C(am)]);
        b.quad(pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1), [1, 1, 1, 0], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [n, n, n, n]);
      }
    }
  }

  function printTex(kind) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const ink = SHIRTS[kind].ink;
      const at = (u, v) => [u * w, (1 - v) * h];
      if (kind === 'white' || kind === 'black') {
        const [x, y] = at(0.63, 0.72);
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = kind === 'white' ? '#1e1e22' : '#e6e6ea';
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.075, h * 0.07, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = kind === 'white' ? '#f4f4f6' : '#141416';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.round(h * 0.052)}px Arial, sans-serif`;
        ctx.fillText('BedBoom', 0, 1);
        ctx.restore();
      } else if (kind === 'bulka') {
        const [x, y] = at(0.66, 0.6);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.32);
        ctx.fillStyle = ink;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `italic 900 ${Math.round(h * 0.13)}px Impact, Arial Black, sans-serif`;
        ctx.fillText('BULKA', 0, 0);
        ctx.fillRect(-w * 0.14, h * 0.07, w * 0.28, h * 0.018);
        ctx.restore();
      } else {
        const [x, y] = at(0.7, 0.18);
        ctx.strokeStyle = ink;
        ctx.fillStyle = ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, h * 0.035, 0, PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x, y, h * 0.07, h * 0.018, -0.35, 0, PI * 2);
        ctx.stroke();
      }
    };
  }

  function buildPelvis(b) {
    const P = LOOK.pants;
    loft(b, [ring(-0.17, 0.15, 0.12, -0.01, P), ring(-0.09, 0.2, 0.16, -0.01, P), ring(-0.01, 0.215, 0.17, 0.0, P), ring(0.07, 0.205, 0.165, 0.01, P)], 14, { capBottom: true, capTop: true });
  }

  function buildThigh(b) {
    const P = LOOK.pants;
    loft(b, [ring(-D.thigh - 0.02, 0.07, 0.075, 0, P), ring(-0.3, 0.095, 0.1, 0, P), ring(-0.12, 0.115, 0.12, 0.005, P), ring(0.05, 0.12, 0.12, 0, P)], 10, { capBottom: true, capTop: true });
  }

  function buildShin(b) {
    const P = LOOK.pants;
    b.ellipsoid(0.074, 0.07, 0.078, 8, 5, P);
    loft(b, [ring(-D.shin + 0.02, 0.058, 0.06, 0, P), ring(-0.3, 0.066, 0.07, 0, P), ring(-0.12, 0.072, 0.076, 0.005, P), ring(0, 0.074, 0.078, 0, P)], 10, { capBottom: true });
  }

  function buildFoot(b) {
    const F = LOOK.shoe;
    b.at(0, -0.04, 0, h => h.ellipsoid(0.05, 0.045, 0.055, 7, 4, F));
    b.push(M4.translate(0, -0.065, 0.06));
    b.box(0.095, 0.06, 0.2, F);
    b.pop();
  }

  function buildSleeve(b) {
    const W = 0xffffff;
    b.ellipsoid(0.078, 0.076, 0.078, 9, 5, W);
    loft(b, [ring(-0.15, 0.072, 0.075, 0, W), ring(-0.06, 0.078, 0.08, 0, W), ring(0.03, 0.075, 0.077, 0, W)], 10, { capBottom: true });
  }

  function buildUpperSkin(b) {
    const Sk = LOOK.skin;
    loft(b, [ring(-D.upper - 0.01, 0.05, 0.053, 0, Sk), ring(-0.2, 0.06, 0.062, 0, Sk), ring(-0.13, 0.064, 0.066, 0, Sk)], 10, { capBottom: true });
  }

  function buildFore(b) {
    const Sk = LOOK.skin;
    b.ellipsoid(0.052, 0.052, 0.052, 8, 5, Sk);
    loft(b, [ring(-D.fore + 0.005, 0.035, 0.038, 0, Sk), ring(-0.17, 0.045, 0.048, 0, Sk), ring(0, 0.05, 0.052, 0, Sk)], 10, { capBottom: true });
  }

  function buildHand(b, side, grip) {
    const sk = LOOK.skin;
    const inward = side === 'L' ? -1 : 1;
    b.at(0, -0.042, 0, h => h.box(0.03, 0.08, 0.078, sk));
    if (grip === 'fist') {
      b.at(inward * 0.014, -0.09, 0.004, h => h.box(0.05, 0.046, 0.076, sk));
      b.at(inward * 0.03, -0.072, 0.03, h => h.box(0.02, 0.04, 0.022, shade(sk, 0.96)));
    } else if (grip === 'claw') {
      b.push(M4.translate(0, -0.088, 0.0), M4.rotZ(inward * 0.55));
      b.at(0, -0.024, 0, h => h.box(0.024, 0.05, 0.072, sk));
      b.at(inward * 0.01, -0.052, 0, h => h.box(0.02, 0.022, 0.066, shade(sk, 0.96)));
      b.pop();
    } else {
      b.at(0, -0.104, 0, h => h.box(0.024, 0.058, 0.074, sk));
      b.at(0, -0.138, 0, h => h.box(0.02, 0.022, 0.066, shade(sk, 0.97)));
    }
    b.push(M4.translate(inward * 0.012, -0.03, 0.046), M4.rotX(grip === 'fist' ? -0.2 : -0.55));
    b.at(0, -0.024, 0, h => h.box(0.021, 0.048, 0.021, sk));
    b.pop();
  }

  const EYES = ['open', 'wide', 'squint', 'shut', 'half', 'down'];
  const BROWS = ['flat', 'up', 'furrow', 'sad'];
  const MOUTHS = ['shut', 'talk', 'open', 'teeth', 'round', 'smile', 'grin'];
  const GAZES = { c: [0, 0], m: [0, 2.5], l: [-4.5, 0], r: [4.5, 0], d: [0, 4.5] };

  function faceUV(yaw, pit) {
    return [(yaw - FACE.Y0) / (FACE.Y1 - FACE.Y0), (pit - FACE.P0) / (FACE.P1 - FACE.P0)];
  }

  function blob(ctx, x, y, rx, ry, col, alpha) {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, 1);
    gr.addColorStop(0, `rgba(${col},${alpha})`);
    gr.addColorStop(1, `rgba(${col},0)`);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    ctx.translate(-x, -y);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function paintSkin(ctx) {
    const base = LOOK.skin;
    const rgbStr = (k) => [(base >> 16) & 255, (base >> 8) & 255, base & 255].map(v => Math.round(v * k)).join(',');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, `rgb(${rgbStr(1)})`);
    grad.addColorStop(0.78, `rgb(${rgbStr(1)})`);
    grad.addColorStop(1, `rgb(${rgbStr(0.9)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    const shadow = '150,96,84';
    blob(ctx, 80, 58, 32, 21, shadow, 0.34);
    blob(ctx, 176, 58, 32, 21, shadow, 0.34);
    blob(ctx, 140, 104, 9, 20, shadow, 0.35);
    blob(ctx, 128, 127, 16, 6, shadow, 0.4);
    blob(ctx, 128, 174, 20, 7, shadow, 0.3);
    blob(ctx, 196, 128, 34, 46, shadow, 0.18);
    blob(ctx, 128, 214, 70, 22, shadow, 0.22);
    blob(ctx, 74, 112, 22, 18, '250,214,198', 0.25);
    blob(ctx, 118, 96, 7, 16, '250,214,198', 0.3);
  }

  function drawFace(key) {
    const [eyes, brows, mouth, gaze] = key.split('|');
    return (ctx, w, h) => {
      ctx.save();
      ctx.scale(w / 256, h / 256);
      paintSkin(ctx);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const ey = 60, mx = 128, my = 153;
      const g = GAZES[gaze] || GAZES.c;
      [[80, -1], [176, 1]].forEach(([x, s]) => {
        let outer = 36, inner = 38, arch = -7;
        if (brows === 'up') { outer = 28; inner = 29; arch = -10; }
        if (brows === 'furrow') { outer = 30; inner = 47; arch = -3; }
        if (brows === 'sad') { outer = 40; inner = 28; arch = -5; }
        if (eyes === 'wide') { outer -= 3; inner -= 3; }
        ctx.strokeStyle = LOOK.brow;
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.moveTo(x + s * 27, outer);
        ctx.quadraticCurveTo(x + s * 4, Math.min(outer, inner) + arch, x - s * 22, inner);
        ctx.stroke();
        if (brows === 'furrow') {
          ctx.strokeStyle = 'rgba(120,70,56,0.55)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(128 - s * 7, 40);
          ctx.lineTo(128 - s * 5, 54);
          ctx.stroke();
        }
        if (eyes === 'shut' || eyes === 'down' || eyes === 'squint') {
          ctx.strokeStyle = '#2a1a16';
          ctx.lineWidth = eyes === 'squint' ? 4.5 : 3.5;
          ctx.beginPath();
          const sag = eyes === 'shut' ? 5 : eyes === 'down' ? 3 : -3;
          ctx.moveTo(x - 20, ey + 1);
          ctx.quadraticCurveTo(x, ey + sag + 1, x + 20, ey + 1);
          ctx.stroke();
          if (eyes === 'squint') {
            ctx.strokeStyle = 'rgba(110,64,52,0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + s * 18, ey + 3);
            ctx.lineTo(x + s * 25, ey + 8);
            ctx.stroke();
          }
          return;
        }
        const ry = { wide: 10.5, open: 7.8, half: 5 }[eyes] || 7.8;
        ctx.fillStyle = '#f1e9e2';
        ctx.beginPath();
        ctx.ellipse(x, ey, 19, ry, 0, 0, PI * 2);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x, ey, 19, ry, 0, 0, PI * 2);
        ctx.clip();
        ctx.fillStyle = '#3a2618';
        ctx.beginPath();
        ctx.arc(x + g[0], ey + g[1] + (eyes === 'half' ? 1.5 : 0), 7.6, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0c0807';
        ctx.beginPath();
        ctx.arc(x + g[0], ey + g[1] + (eyes === 'half' ? 1.5 : 0), 3.2, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(x + g[0] + 1.5, ey + g[1] - 3.5, 2.2, 2.2);
        if (eyes === 'half') {
          ctx.fillStyle = '#c99c8a';
          ctx.fillRect(x - 20, ey - ry - 1, 40, ry * 0.9);
        }
        ctx.restore();
        ctx.strokeStyle = '#2a1a16';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(x - 20, ey + 1);
        ctx.quadraticCurveTo(x, ey - ry - 3, x + 20, ey + 1);
        ctx.stroke();
      });
      ctx.fillStyle = 'rgba(150,96,82,0.45)';
      ctx.beginPath();
      ctx.ellipse(128, 120, 11, 4, 0, 0, PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#8a4c48';
      ctx.fillStyle = '#3a1414';
      if (mouth === 'shut') {
        ctx.beginPath();
        ctx.moveTo(mx - 25, my);
        ctx.quadraticCurveTo(mx, my + 3, mx + 25, my);
        ctx.stroke();
      } else if (mouth === 'smile' || mouth === 'grin') {
        ctx.beginPath();
        ctx.moveTo(mx - 27, my - 6);
        ctx.quadraticCurveTo(mx, my + (mouth === 'grin' ? 20 : 12), mx + 27, my - 6);
        if (mouth === 'grin') {
          ctx.quadraticCurveTo(mx, my + 2, mx - 27, my - 6);
          ctx.fill();
          ctx.fillStyle = '#ece4dc';
          ctx.fillRect(mx - 17, my - 3, 34, 5);
        }
        ctx.stroke();
      } else if (mouth === 'teeth') {
        ctx.beginPath();
        ctx.moveTo(mx - 38, my - 1);
        ctx.quadraticCurveTo(mx, my - 15, mx + 38, my - 1);
        ctx.quadraticCurveTo(mx, my + 24, mx - 38, my - 1);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ece4dc';
        ctx.beginPath();
        ctx.moveTo(mx - 31, my - 3);
        ctx.quadraticCurveTo(mx, my - 13, mx + 31, my - 3);
        ctx.lineTo(mx + 28, my + 3);
        ctx.quadraticCurveTo(mx, my - 4, mx - 28, my + 3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(mx - 25, my + 7);
        ctx.quadraticCurveTo(mx, my + 2, mx + 25, my + 7);
        ctx.lineTo(mx + 21, my + 12);
        ctx.quadraticCurveTo(mx, my + 9, mx - 21, my + 12);
        ctx.closePath();
        ctx.fill();
      } else {
        const sz = { talk: [18, 9], open: [33, 27], round: [14, 16] }[mouth] || [18, 9];
        ctx.beginPath();
        ctx.ellipse(mx, my + sz[1] * 0.35, sz[0], sz[1], 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        if (mouth !== 'round') {
          ctx.fillStyle = '#ece4dc';
          ctx.fillRect(mx - sz[0] * 0.7, my + sz[1] * 0.35 - sz[1] + 2, sz[0] * 1.4, Math.max(2.5, sz[1] * 0.28));
        }
        if (mouth === 'open') {
          ctx.fillStyle = '#9a4a4a';
          ctx.beginPath();
          ctx.ellipse(mx, my + sz[1] * 0.9, sz[0] * 0.6, sz[1] * 0.35, 0, 0, PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };
  }

  function faceKey(f) {
    const e = EYES.includes(f.eyes) ? f.eyes : 'open';
    const b = BROWS.includes(f.brows) ? f.brows : 'flat';
    const m = MOUTHS.includes(f.mouth) ? f.mouth : 'shut';
    const g = GAZES[f.gaze] ? f.gaze : 'm';
    return [e, b, m, g].join('|');
  }

  function build(r) {
    const faces = {};
    const faceTex = (key) => {
      if (!faces[key]) faces[key] = r.texture(256, drawFace(key), { clamp: true });
      return faces[key];
    };
    const hands = {};
    ['L', 'R'].forEach(s => ['open', 'fist', 'claw'].forEach(g => { hands[s + g] = mesh(r, b => buildHand(b, s, g)); }));
    const prints = {};
    Object.keys(SHIRTS).forEach(k => { prints[k] = r.texture(512, printTex(k), { height: 256, clamp: true }); });
    return {
      faceTex,
      prints,
      head: mesh(r, buildHead),
      hair: mesh(r, buildHair),
      face: mesh(r, b => headPatch(b, FACE.Y0, FACE.Y1, FACE.P0, FACE.P1, 16, 14, 1.006, [1, 1, 1, 0], faceUV)),
      phones: mesh(r, buildPhones),
      chest: mesh(r, buildChest),
      printPatch: mesh(r, buildPrintPatch),
      neck: mesh(r, b => loft(b, [ring(-0.06, 0.095, 0.09, 0.012, LOOK.skin), ring(0.1, 0.082, 0.078, 0.022, LOOK.skin)], 10)),
      pelvis: mesh(r, buildPelvis),
      thigh: mesh(r, buildThigh),
      shin: mesh(r, buildShin),
      foot: mesh(r, buildFoot),
      sleeve: mesh(r, buildSleeve),
      upperSkin: mesh(r, buildUpperSkin),
      fore: mesh(r, buildFore),
      hands,
      segment: mesh(r, b => b.prism(5, 0.0045, 0.0045, -1, 0.0045, 0.0045, 0, LOOK.cable))
    };
  }

  function solve(p) {
    return Rig.solve(p, D);
  }

  function rgbOf(hex) {
    return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
  }

  function phonesMatrix(m, p) {
    if (p.phones === 'hand') {
      const hand = m['hand' + (p.phonesHand || 'R')];
      return M4.chain(hand, M4.translate(0, -0.13, 0.02), M4.rotX(PI / 2), M4.rotZ(PI / 2), M4.translate(0, -R * 0.9, 0));
    }
    if (p.phones === 'neck') return M4.chain(m.neck, M4.translate(0, -0.02, 0.03), M4.rotX(1.35), M4.translate(0, -0.06, 0));
    return m.head;
  }

  function cablePoints(m, p, phonesM) {
    const start = M4.point(phonesM, [cupCenter(1)[0], cupCenter(1)[1] - 0.06, cupCenter(1)[2]]);
    const end = M4.point(m.pelvis, [0.12, -0.02, 0.2]);
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      const sag = S(k * PI) * 0.06;
      pts.push([start[0] + (end[0] - start[0]) * k, start[1] + (end[1] - start[1]) * k - sag, start[2] + (end[2] - start[2]) * k + S(k * PI) * 0.05]);
    }
    return pts;
  }

  function draw(r, V, m, p) {
    const shirt = SHIRTS[p.shirt] || SHIRTS.grey;
    const tint = { tint: rgbOf(shirt.col) };
    r.draw(V.pelvis, m.pelvis);
    r.draw(V.chest, m.chest, tint);
    r.draw(V.printPatch, m.chest, { texture: V.prints[p.shirt] || V.prints.grey });
    r.draw(V.neck, m.neck);
    r.draw(V.head, m.head);
    r.draw(V.hair, m.head);
    r.draw(V.face, m.head, { texture: V.faceTex(faceKey(p)) });
    const phonesM = phonesMatrix(m, p);
    if (p.phones !== 'off') r.draw(V.phones, phonesM);
    ['L', 'R'].forEach(s => {
      r.draw(V.sleeve, m['upper' + s], tint);
      r.draw(V.upperSkin, m['upper' + s]);
      r.draw(V.fore, m['fore' + s]);
      r.draw(V.hands[s + (p['g' + s] || 'open')], m['hand' + s]);
      if (!p.noLegs) {
        r.draw(V.thigh, m['thigh' + s]);
        r.draw(V.shin, m['shin' + s]);
        r.draw(V.foot, m['foot' + s]);
      }
    });
    if (p.phones !== 'off' && p.cable !== false) {
      const pts = cablePoints(m, p, phonesM);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const len = V3.len(V3.sub(b, a));
        if (len < 1e-4) continue;
        r.draw(V.segment, M4.mul(Rig.boneM(a, b, [0, 0, 1]), M4.scale(1, len, 1)));
      }
    }
  }

  window.SiegaCast = { D, LOOK, SHIRTS, EYES, BROWS, MOUTHS, GAZES, solve, build, draw, faceKey, headPt, cupCenter, phonesMatrix };
})();
