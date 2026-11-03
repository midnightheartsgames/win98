(function () {
  const { M4, V3, shade, rand, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const D = { hipX: 0.13, hipY: -0.05, thigh: 0.5, shin: 0.48, chestY: 0.13, neckY: 0.33, shX: 0.235, shY: 0.235, upper: 0.31, fore: 0.27, headY: 0.15, head: 0.105 };
  const R = D.head;

  const LOOK = {
    skin: 0x9c5a38,
    skinDk: 0x7a4428,
    lip: '#8a4a38',
    hair: 0x6e4028,
    hairHi: 0x7a4a2e,
    hairDk: 0x5e3622,
    beard: '#62361f',
    brow: '#6a3e28',
    tee: 0x2c2021,
    teeDk: 0x221819,
    ink: '#6c6458',
    pants: 0x262124,
    pantsHi: 0x342d31,
    slide: 0x161417,
    ink2: '#241a1a'
  };

  const FACE = { Y0: -1.3, Y1: 1.3, P0: -1.5, P1: 0.56 };

  function headDir(yaw, pit) {
    return [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
  }

  function headPt(yaw, pit, k) {
    const n = headDir(yaw, pit);
    const low = Math.max(0, -n[1]);
    const front = Math.max(0, n[2]);
    const jowl = low * (1 - 0.6 * low);
    const x = n[0] * R * 0.98 * (1 + 0.1 * jowl);
    const y = n[1] * R * (n[1] > 0 ? 1.12 : 1.52);
    const z = n[2] * R * (n[2] > 0 ? 1.0 + 0.26 * low * front * front : 0.95);
    const s = k || 1;
    return [x * s, y * s, z * s];
  }

  function headNormal(yaw, pit) {
    const e = 0.01;
    const a = headPt(yaw - e, pit), b = headPt(yaw + e, pit), c = headPt(yaw, pit - e), d = headPt(yaw, pit + e);
    const n = V3.norm(V3.cross(V3.sub(b, a), V3.sub(d, c)));
    return V3.dot(n, headPt(yaw, pit)) < 0 ? V3.mul(n, -1) : n;
  }

  function headPatch(b, y0, y1, p0, p1, nu, nv, k, col, uvFn) {
    const kk = typeof k === 'function' ? k : () => k;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const ya = y0 + (y1 - y0) * (i / nu), yb = y0 + (y1 - y0) * ((i + 1) / nu);
        const pa = p0 + (p1 - p0) * (j / nv), pb = p0 + (p1 - p0) * ((j + 1) / nv);
        const v = [[ya, pa], [yb, pa], [yb, pb], [ya, pb]];
        const pts = v.map(([y, p]) => headPt(y, p, kk(y, p)));
        const ns = v.map(([y, p]) => headNormal(y, p));
        const cols = typeof col === 'function' ? v.map(([y, p]) => rgb(col(y, p))) : col;
        b.quad(pts[0], pts[1], pts[2], pts[3], cols, uvFn ? v.map(([y, p]) => uvFn(y, p)) : null, ns);
      }
    }
  }

  function buildHead(b) {
    headPatch(b, -PI, PI, -PI / 2, PI / 2, 22, 14, 1, (y, p) => (S(p) < -0.75 ? rgb(LOOK.skinDk, 0.25) : rgb(LOOK.skin, 0.25)));
    const nose = headPt(0, -0.26, 1.0);
    const lit = (k) => shade(LOOK.skin, k).slice(0, 3).concat([0.25]);
    b.at(nose[0], nose[1], nose[2] - 0.012, h => h.ellipsoid(R * 0.16, R * 0.22, R * 0.15, 8, 6, lit(0.98)));
    [-1, 1].forEach(s => {
      const w = headPt(s * 0.13, -0.34, 1.0);
      b.at(w[0], w[1], w[2] - 0.01, h => h.ellipsoid(R * 0.075, R * 0.06, R * 0.07, 6, 4, lit(0.95)));
      const e = headPt(s * 1.48, 0.02, 1.0);
      b.push(M4.translate(e[0] + s * 0.006, e[1], e[2] - 0.004), M4.rotY(s * 0.3));
      b.ellipsoid(R * 0.12, R * 0.3, R * 0.2, 7, 5, lit(0.9));
      b.pop();
    });
  }

  function hairline(yaw) {
    const a = Math.abs(yaw);
    if (a < 0.3) return 0.86 + 0.04 * (a / 0.3);
    if (a < 0.75) return 0.9 - 0.2 * ((a - 0.3) / 0.45);
    if (a < 1.25) return 0.7 - 0.42 * ((a - 0.75) / 0.5);
    if (a < 1.9) return 0.28 - 0.3 * ((a - 1.25) / 0.65);
    return -0.02 - 0.34 * clamp((a - 1.9) / 0.9, 0, 1);
  }

  function hairScale(yaw, pit) {
    const top = clamp((pit - 0.3) / 1.0, 0, 1);
    return 1.025 + 0.035 * top;
  }

  function buildHair(b) {
    const nu = 30, nv = 8, g = rand(23);
    for (let i = 0; i < nu; i++) {
      const ya = -PI + (2 * PI * i) / nu, yb = -PI + (2 * PI * (i + 1)) / nu;
      const ha = hairline(ya), hb = hairline(yb);
      for (let j = 0; j < nv; j++) {
        const ka = j / nv, kb = (j + 1) / nv;
        const p = (h, k) => h + (PI / 2 - h) * k;
        const v = [[ya, p(ha, ka)], [yb, p(hb, ka)], [yb, p(hb, kb)], [ya, p(ha, kb)]];
        const pts = v.map(([y, pp]) => headPt(y, pp, hairScale(y, pp)));
        const ns = v.map(([y, pp]) => headNormal(y, pp));
        const col = j === 0 ? LOOK.hairDk : (i + j) % 5 === 0 ? LOOK.hairHi : LOOK.hair;
        b.quad(pts[0], pts[1], pts[2], pts[3], col, null, ns);
      }
      const e0 = headPt(ya, ha, hairScale(ya, ha)), e1 = headPt(yb, hb, hairScale(yb, hb));
      const i0 = headPt(ya, ha - 0.05, 1.0), i1 = headPt(yb, hb - 0.05, 1.0);
      b.quad(i0, i1, e1, e0, shade(LOOK.hairDk, 0.9));
    }
    for (let i = 0; i < 22; i++) {
      const yaw = -0.8 + g() * 1.6;
      const pit = 0.92 + g() * 0.3;
      const p = headPt(yaw, pit, hairScale(yaw, pit));
      b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw), M4.rotX(-1.2 - g() * 0.3), M4.rotZ((g() - 0.5) * 0.7));
      b.prism(4, 0.013 + g() * 0.006, 0.007, 0, 0.003, 0.003, 0.016 + g() * 0.01, g() < 0.35 ? LOOK.hairHi : LOOK.hair);
      b.pop();
    }
  }

  const EYES = ['open', 'half', 'shut', 'down', 'wide', 'squint'];
  const BROWS = ['flat', 'up', 'furrow', 'tilt'];
  const MOUTHS = ['shut', 'talk', 'open', 'wide', 'round', 'smile', 'grin'];
  const GAZES = { c: [0, 0], m: [0, -0.012], l: [-0.035, 0], r: [0.035, 0], d: [0, -0.03], dl: [-0.03, -0.03], dr: [0.03, -0.03] };

  function faceUV(yaw, pit) {
    return [(yaw - FACE.Y0) / (FACE.Y1 - FACE.Y0), (pit - FACE.P0) / (FACE.P1 - FACE.P0)];
  }

  function hexRgb(c) {
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  }

  function blob(ctx, x, y, rx, ry, col, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, `rgba(${col},${alpha})`);
    gr.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function paintSkin(ctx) {
    const [r, g, b] = hexRgb(LOOK.skin);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(FACE.Y0, FACE.P0, FACE.Y1 - FACE.Y0, FACE.P1 - FACE.P0);
    const sh = '120,62,40';
    blob(ctx, -0.36, 0.11, 0.2, 0.09, sh, 0.28);
    blob(ctx, 0.36, 0.11, 0.2, 0.09, sh, 0.28);
    blob(ctx, 0.0, -0.36, 0.14, 0.05, sh, 0.35);
    blob(ctx, -0.11, -0.18, 0.05, 0.14, sh, 0.18);
    blob(ctx, 0.95, -0.2, 0.3, 0.5, sh, 0.22);
    blob(ctx, -0.95, -0.2, 0.3, 0.5, sh, 0.22);
    blob(ctx, -0.5, -0.2, 0.17, 0.12, '214,104,84', 0.26);
    blob(ctx, 0.5, -0.2, 0.17, 0.12, '214,104,84', 0.26);
    blob(ctx, 0.0, 0.45, 0.42, 0.1, '240,190,160', 0.18);
    blob(ctx, 0.05, -0.2, 0.04, 0.1, '246,200,170', 0.3);
  }

  function paintBeard(ctx) {
    ctx.save();
    ctx.filter = 'blur(3px)';
    ctx.fillStyle = LOOK.beard;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(-1.28, 0.02);
    ctx.lineTo(-1.12, 0.02);
    ctx.quadraticCurveTo(-1.0, -0.45, -0.62, -0.72);
    ctx.quadraticCurveTo(-0.3, -0.82, 0, -0.8);
    ctx.quadraticCurveTo(0.3, -0.82, 0.62, -0.72);
    ctx.quadraticCurveTo(1.0, -0.45, 1.12, 0.02);
    ctx.lineTo(1.28, 0.02);
    ctx.lineTo(1.28, -1.5);
    ctx.lineTo(-1.28, -1.5);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(-0.3, -0.5);
    ctx.quadraticCurveTo(-0.52, -0.8, -0.44, -1.04);
    ctx.quadraticCurveTo(0, -1.36, 0.44, -1.04);
    ctx.quadraticCurveTo(0.52, -0.8, 0.3, -0.5);
    ctx.quadraticCurveTo(0.2, -0.62, 0, -0.62);
    ctx.quadraticCurveTo(-0.2, -0.62, -0.3, -0.5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.3, -0.42);
    ctx.quadraticCurveTo(-0.16, -0.37, 0, -0.39);
    ctx.quadraticCurveTo(0.16, -0.37, 0.3, -0.42);
    ctx.quadraticCurveTo(0.34, -0.5, 0.29, -0.55);
    ctx.quadraticCurveTo(0.14, -0.46, 0, -0.47);
    ctx.quadraticCurveTo(-0.14, -0.46, -0.29, -0.55);
    ctx.quadraticCurveTo(-0.34, -0.5, -0.3, -0.42);
    ctx.fill();
    ctx.restore();
    const g = rand(77);
    ctx.fillStyle = 'rgba(40,20,12,0.35)';
    for (let i = 0; i < 900; i++) {
      const x = (g() - 0.5) * 1.0, y = -0.6 - g() * 0.62;
      if (Math.abs(x) > 0.46 - (y + 0.6) * 0.1) continue;
      ctx.fillRect(x, y, 0.008, 0.018);
    }
  }

  function drawEyes(ctx, eyes, gaze) {
    const g = GAZES[gaze] || GAZES.c;
    [[-0.34, -1], [0.34, 1]].forEach(([x, s]) => {
      const y = 0.12;
      if (eyes === 'shut' || eyes === 'down' || eyes === 'squint') {
        ctx.strokeStyle = '#3a1e14';
        ctx.lineWidth = eyes === 'squint' ? 0.022 : 0.016;
        ctx.beginPath();
        const sag = eyes === 'shut' ? -0.025 : eyes === 'down' ? -0.018 : 0.012;
        ctx.moveTo(x - 0.11, y);
        ctx.quadraticCurveTo(x, y + sag, x + 0.11, y);
        ctx.stroke();
        if (eyes === 'down') {
          ctx.fillStyle = 'rgba(240,232,226,0.9)';
          ctx.beginPath();
          ctx.ellipse(x + g[0] * 0.5, y - 0.012, 0.07, 0.012, 0, 0, PI * 2);
          ctx.fill();
        }
        return;
      }
      const ry = { wide: 0.056, open: 0.042, half: 0.025 }[eyes] || 0.042;
      blob(ctx, x, y + 0.02, 0.15, 0.07, '90,44,28', 0.35);
      ctx.fillStyle = '#bca898';
      ctx.beginPath();
      ctx.ellipse(x, y, 0.105, ry, 0, 0, PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x, y, 0.105, ry, 0, 0, PI * 2);
      ctx.clip();
      ctx.fillStyle = '#34404a';
      ctx.beginPath();
      ctx.arc(x + g[0], y + g[1] - (eyes === 'half' ? 0.008 : 0), 0.04, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0e0a0a';
      ctx.beginPath();
      ctx.arc(x + g[0], y + g[1] - (eyes === 'half' ? 0.008 : 0), 0.016, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(x + g[0] + 0.007, y + g[1] + 0.008, 0.01, 0.01);
      ctx.fillStyle = 'rgba(80,40,26,0.45)';
      ctx.fillRect(x - 0.1, y + ry * 0.35, 0.2, ry);
      if (eyes === 'half') {
        ctx.fillStyle = '#94563a';
        ctx.fillRect(x - 0.11, y + ry * 0.1, 0.22, 0.08);
      }
      ctx.restore();
      ctx.strokeStyle = '#4a2a1c';
      ctx.lineWidth = 0.013;
      ctx.beginPath();
      ctx.moveTo(x - 0.1, y - 0.004);
      ctx.quadraticCurveTo(x, y + ry + 0.014, x + 0.1, y - 0.004);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(100,52,34,0.45)';
      ctx.lineWidth = 0.008;
      ctx.beginPath();
      ctx.moveTo(x - 0.08, y - ry - 0.01);
      ctx.quadraticCurveTo(x, y - ry - 0.026, x + 0.08, y - ry - 0.01);
      ctx.stroke();
    });
  }

  function drawBrows(ctx, brows, eyes) {
    [[-0.34, -1], [0.34, 1]].forEach(([x, s]) => {
      let inner = 0.265, outer = 0.26, arch = 0.03;
      if (brows === 'up') { inner = 0.31; outer = 0.295; arch = 0.04; }
      if (brows === 'furrow') { inner = 0.23; outer = 0.275; arch = 0.012; }
      if (brows === 'tilt') { inner = s < 0 ? 0.31 : 0.26; outer = s < 0 ? 0.3 : 0.255; }
      if (eyes === 'wide') { inner += 0.02; outer += 0.02; }
      ctx.strokeStyle = LOOK.brow;
      ctx.lineWidth = 0.032;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - s * 0.15, inner);
      ctx.quadraticCurveTo(x + s * 0.02, Math.max(inner, outer) + arch, x + s * 0.17, outer - 0.02);
      ctx.stroke();
    });
  }

  function drawMouth(ctx, mouth) {
    const mx = 0, my = -0.53;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = LOOK.lip;
    ctx.fillStyle = '#3a1410';
    ctx.lineWidth = 0.016;
    if (mouth === 'shut') {
      ctx.beginPath();
      ctx.moveTo(mx - 0.16, my + 0.004);
      ctx.quadraticCurveTo(mx, my - 0.012, mx + 0.16, my + 0.004);
      ctx.stroke();
      ctx.fillStyle = 'rgba(168,88,74,0.55)';
      ctx.beginPath();
      ctx.ellipse(mx, my - 0.03, 0.1, 0.018, 0, 0, PI * 2);
      ctx.fill();
      return;
    }
    if (mouth === 'smile' || mouth === 'grin') {
      ctx.beginPath();
      ctx.moveTo(mx - 0.19, my + 0.03);
      ctx.quadraticCurveTo(mx, my - (mouth === 'grin' ? 0.1 : 0.05), mx + 0.19, my + 0.03);
      if (mouth === 'grin') {
        ctx.quadraticCurveTo(mx, my - 0.005, mx - 0.19, my + 0.03);
        ctx.fill();
        ctx.fillStyle = '#e8dfd4';
        ctx.fillRect(mx - 0.12, my - 0.02, 0.24, 0.025);
      }
      ctx.stroke();
      return;
    }
    const sz = { talk: [0.12, 0.035], open: [0.14, 0.07], wide: [0.16, 0.1], round: [0.08, 0.07] }[mouth] || [0.12, 0.035];
    ctx.beginPath();
    ctx.ellipse(mx, my - sz[1] * 0.4, sz[0], sz[1], 0, 0, PI * 2);
    ctx.fill();
    ctx.stroke();
    if (mouth !== 'round') {
      ctx.fillStyle = '#e8dfd4';
      ctx.fillRect(mx - sz[0] * 0.65, my - sz[1] * 0.4 + sz[1] - 0.026, sz[0] * 1.3, Math.min(0.03, sz[1] * 0.35));
    }
    if (mouth === 'open' || mouth === 'wide') {
      ctx.fillStyle = '#9a4a44';
      ctx.beginPath();
      ctx.ellipse(mx, my - sz[1] * 1.0, sz[0] * 0.55, sz[1] * 0.35, 0, 0, PI * 2);
      ctx.fill();
    }
  }

  function drawFace(key) {
    const [eyes, brows, mouth, gaze] = key.split('|');
    return (ctx, w, h) => {
      ctx.save();
      ctx.setTransform(w / (FACE.Y1 - FACE.Y0), 0, 0, -h / (FACE.P1 - FACE.P0), -FACE.Y0 * w / (FACE.Y1 - FACE.Y0), FACE.P1 * h / (FACE.P1 - FACE.P0));
      paintSkin(ctx);
      paintBeard(ctx);
      drawBrows(ctx, brows, eyes);
      drawEyes(ctx, eyes, gaze);
      ctx.fillStyle = 'rgba(110,52,36,0.55)';
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.ellipse(s * 0.075, -0.37, 0.032, 0.017, 0, 0, PI * 2);
        ctx.fill();
      });
      drawMouth(ctx, mouth);
      ctx.restore();
    };
  }

  function faceKey(f) {
    const e = EYES.includes(f.eyes) ? f.eyes : 'open';
    const b = BROWS.includes(f.brows) ? f.brows : 'flat';
    const m = MOUTHS.includes(f.mouth) ? f.mouth : 'shut';
    const g = GAZES[f.gaze] ? f.gaze : 'c';
    return [e, b, m, g].join('|');
  }

  const CHEST_RINGS = [
    [-0.33, 0.13, 0.11, 0.0],
    [-0.3, 0.2, 0.17, 0.02],
    [-0.25, 0.25, 0.21, 0.05],
    [-0.17, 0.285, 0.23, 0.07],
    [-0.07, 0.3, 0.245, 0.08],
    [0.04, 0.295, 0.23, 0.06],
    [0.14, 0.28, 0.21, 0.03],
    [0.22, 0.28, 0.19, 0.005],
    [0.28, 0.265, 0.17, -0.01],
    [0.325, 0.215, 0.145, -0.018],
    [0.355, 0.13, 0.11, -0.012],
    [0.375, 0.095, 0.09, 0.0]
  ];
  const WAIST = -0.2;

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
    const rings = [];
    let cut = false;
    CHEST_RINGS.forEach(([y, rx, rz, cz]) => {
      if (!cut && y > WAIST) {
        const c = chestAt(WAIST);
        rings.push(ring(WAIST, c.rx, c.rz, c.cz, LOOK.pants), ring(WAIST, c.rx * 1.03, c.rz * 1.03, c.cz, LOOK.teeDk));
        cut = true;
      }
      rings.push(ring(y, rx, rz, cz, y < WAIST ? LOOK.pants : LOOK.tee));
    });
    loft(b, rings, 16, { capBottom: true, capTop: true, hard: true });
    const N = 14;
    for (let i = 0; i < N; i++) {
      const span = (u) => -PI * 0.6 + PI * 1.2 * u;
      const a0 = span(i / N), a1 = span((i + 1) / N);
      const inner = (a) => [S(a) * 0.098, 0.385, -0.005 + C(a) * 0.09];
      const outer = (a) => [S(a) * 0.13, 0.37, -0.008 + C(a) * 0.115];
      b.quad(inner(a0), inner(a1), outer(a1), outer(a0), LOOK.tee);
    }
  }

  function buildPrintPatch(b) {
    const y0 = 0.06, y1 = 0.32, a0 = -0.95, a1 = 0.95, nu = 14, nv = 8;
    const pt = (u, v) => {
      const y = y0 + (y1 - y0) * v;
      const c = chestAt(y);
      const a = a0 + (a1 - a0) * u;
      return [S(a) * c.rx * 1.012, y, c.cz + C(a) * c.rz * 1.012];
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

  function printTex(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(w / 512, h / 256);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fillStyle = LOOK.ink;
    ctx.beginPath();
    ctx.moveTo(150, 92);
    ctx.bezierCurveTo(180, 58, 250, 46, 300, 56);
    ctx.bezierCurveTo(270, 60, 246, 70, 232, 84);
    ctx.bezierCurveTo(214, 80, 196, 84, 186, 94);
    ctx.bezierCurveTo(176, 90, 162, 90, 150, 92);
    ctx.fill();
    ctx.strokeStyle = LOOK.ink2;
    ctx.lineWidth = 2;
    [[196, 80, 262, 60], [206, 86, 248, 72], [176, 88, 220, 76]].forEach(([x0, y0, x1, y1]) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    });
    ctx.translate(256, 136);
    ctx.rotate(-0.08);
    ctx.font = 'italic bold 100px "Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 6;
    ctx.strokeStyle = LOOK.ink;
    ctx.strokeText('Vladdy', 0, 0);
    ctx.fillStyle = LOOK.ink2;
    ctx.fillText('Vladdy', 0, 0);
    ctx.lineWidth = 2;
    ctx.strokeStyle = LOOK.ink;
    ctx.strokeText('Vladdy', 0, 0);
    ctx.fillStyle = LOOK.ink;
    ctx.beginPath();
    ctx.moveTo(-170, 44);
    ctx.bezierCurveTo(-60, 30, 80, 30, 190, 22);
    ctx.bezierCurveTo(90, 44, -40, 50, -170, 52);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 22px "Times New Roman", serif';
    ctx.fillText('K O M R A D Y   C L U B', 30, 78);
    ctx.font = 'italic 15px "Times New Roman", serif';
    ctx.fillText('for true komrady since 1950', 40, 100);
    ctx.restore();
  }

  function buildPelvis(b) {
    const P = LOOK.pants;
    loft(b, [ring(-0.17, 0.17, 0.14, -0.01, P), ring(-0.09, 0.28, 0.22, -0.03, P), ring(-0.01, 0.31, 0.24, -0.02, P), ring(0.06, 0.31, 0.24, 0.0, P)], 14, { capBottom: true, capTop: true });
  }

  function buildThigh(b, mark) {
    const P = LOOK.pants;
    loft(b, [ring(-D.thigh - 0.02, 0.085, 0.09, 0.0, P), ring(-0.3, 0.115, 0.12, 0.0, P), ring(-0.12, 0.14, 0.145, 0.01, P), ring(0.05, 0.15, 0.15, 0.0, P)], 10, { capBottom: true, capTop: true });
    if (!mark) return;
    b.push(M4.translate(0.118, -0.1, 0.08), M4.rotY(0.95));
    b.tri([-0.02, -0.014, 0.0], [0.02, -0.014, 0.0], [0.0, 0.018, 0.0], [0.86, 0.84, 0.82, 0]);
    b.pop();
  }

  function buildShin(b) {
    const P = LOOK.pants;
    b.ellipsoid(0.085, 0.08, 0.09, 8, 5, P);
    loft(b, [ring(-D.shin + 0.03, 0.07, 0.072, 0.0, LOOK.pantsHi), ring(-D.shin + 0.06, 0.072, 0.075, 0.0, P), ring(-0.3, 0.078, 0.082, 0.0, P), ring(-0.12, 0.084, 0.088, 0.01, P), ring(0.0, 0.086, 0.09, 0.0, P)], 10, { capBottom: true });
  }

  function buildFoot(b) {
    const sk = LOOK.skin;
    b.at(0, -0.035, 0.0, h => h.ellipsoid(0.044, 0.042, 0.048, 7, 4, sk));
    b.push(M4.translate(0, -0.07, 0.06));
    b.box(0.1, 0.022, 0.27, LOOK.slide);
    b.at(0, 0.024, -0.005, h => h.box(0.094, 0.03, 0.1, LOOK.slide));
    b.at(0, 0.026, 0.092, h => h.ellipsoid(0.04, 0.018, 0.045, 7, 3, sk));
    b.pop();
  }

  function buildSleeve(b) {
    const T = LOOK.tee;
    b.ellipsoid(0.092, 0.085, 0.092, 9, 5, T);
    loft(b, [ring(-0.215, 0.09, 0.092, 0, LOOK.teeDk), ring(-0.205, 0.094, 0.096, 0, T), ring(-0.08, 0.1, 0.1, 0, T), ring(0.03, 0.094, 0.094, 0, T)], 10, { capBottom: true });
  }

  function buildUpperSkin(b) {
    loft(b, [ring(-D.upper - 0.01, 0.054, 0.057, 0, [1, 1, 1, 0]), ring(-0.22, 0.064, 0.067, 0, [1, 1, 1, 0]), ring(-0.14, 0.072, 0.074, 0, [1, 1, 1, 0])], 10, { capBottom: true, uv: true });
  }

  function buildFore(b) {
    b.ellipsoid(0.057, 0.057, 0.057, 8, 5, [1, 1, 1, 0]);
    loft(b, [ring(-D.fore + 0.005, 0.037, 0.042, 0, [1, 1, 1, 0]), ring(-0.16, 0.048, 0.051, 0, [1, 1, 1, 0]), ring(0.0, 0.054, 0.056, 0, [1, 1, 1, 0])], 10, { capBottom: true, uv: true });
  }

  function tattooTex(ctx, w, h) {
    ctx.fillStyle = '#9a6a4c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#241814';
    ctx.fillStyle = '#241814';
    ctx.lineCap = 'round';
    const rnd = rand(9);
    for (let k = 0; k < 4; k++) {
      const cx = w * (0.125 + k * 0.25);
      for (let i = 0; i < 5; i++) {
        const y = h * (0.06 + i * 0.19);
        const sw = (rnd() - 0.5) * w * 0.05;
        ctx.lineWidth = w * (0.035 + rnd() * 0.02);
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.11 + sw, y);
        ctx.bezierCurveTo(cx - w * 0.02, y + h * 0.03, cx + w * 0.06, y + h * 0.1, cx + sw, y + h * 0.17);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + w * 0.12, y + h * 0.0);
        ctx.quadraticCurveTo(cx - w * 0.02, y + h * 0.06, cx - w * 0.06, y + h * 0.17);
        ctx.quadraticCurveTo(cx + w * 0.05, y + h * 0.08, cx + w * 0.12, y + h * 0.0);
        ctx.fill();
      }
    }
  }

  function buildHand(b, side, grip) {
    const k = grip === 'spread' || grip === 'open' ? 1.0 : 0.9;
    b.push(M4.scale(k, k, k));
    buildHandShape(b, side, grip);
    b.pop();
  }

  function buildHandShape(b, side, grip) {
    const sk = LOOK.skin;
    const inward = side === 'L' ? -1 : 1;
    b.at(0, -0.045, 0, h => h.box(0.034, 0.09, 0.09, sk));
    if (grip === 'fist') {
      b.at(inward * 0.012, -0.1, 0.0, h => h.box(0.054, 0.048, 0.085, sk));
    } else if (grip === 'spread') {
      [-0.032, -0.011, 0.011, 0.032].forEach((z, i) => {
        b.push(M4.translate(0, -0.088, z), M4.rotX(-(z / 0.032) * 0.32));
        b.at(0, -0.035, 0, h => h.box(0.022, 0.07 - Math.abs(i - 1.5) * 0.006, 0.019, shade(sk, 0.98)));
        b.pop();
      });
    } else if (grip === 'point') {
      b.at(inward * 0.012, -0.098, -0.012, h => h.box(0.048, 0.042, 0.064, sk));
      b.at(0, -0.125, 0.03, h => h.box(0.022, 0.075, 0.022, sk));
    } else if (grip === 'rest') {
      b.at(0, -0.112, 0.004, h => h.box(0.026, 0.05, 0.084, sk));
      b.at(inward * 0.01, -0.145, 0.004, h => h.box(0.022, 0.026, 0.078, shade(sk, 0.96)));
    } else {
      b.at(0, -0.118, 0, h => h.box(0.028, 0.062, 0.084, sk));
      b.at(inward * 0.008, -0.155, 0, h => h.box(0.024, 0.026, 0.076, shade(sk, 0.97)));
    }
    b.push(M4.translate(inward * 0.012, -0.03, 0.052), M4.rotX(grip === 'spread' ? -0.9 : -0.5));
    b.at(0, -0.026, 0, h => h.box(0.024, 0.052, 0.024, sk));
    b.pop();
  }

  function build(r) {
    const faces = {};
    const faceTex = (key) => {
      if (!faces[key]) faces[key] = r.texture(512, drawFace(key), { clamp: true });
      return faces[key];
    };
    const hands = {};
    ['L', 'R'].forEach(s => ['open', 'fist', 'spread', 'point', 'rest'].forEach(g => { hands[s + g] = mesh(r, b => buildHand(b, s, g)); }));
    return {
      faceTex,
      print: r.texture(512, printTex, { height: 256, clamp: true }),
      tattoo: r.texture(128, tattooTex),
      head: mesh(r, buildHead),
      hair: mesh(r, buildHair),
      face: mesh(r, b => headPatch(b, FACE.Y0, FACE.Y1, FACE.P0, FACE.P1, 18, 16, 1.006, [1, 1, 1, 0.3], faceUV)),
      chest: mesh(r, buildChest),
      printPatch: mesh(r, buildPrintPatch),
      neck: mesh(r, b => loft(b, [ring(-0.01, 0.112, 0.105, 0.0, LOOK.skin), ring(0.08, 0.1, 0.096, 0.02, LOOK.skin)], 12)),
      pelvis: mesh(r, buildPelvis),
      thighL: mesh(r, b => buildThigh(b, true)),
      thighR: mesh(r, b => buildThigh(b, false)),
      shin: mesh(r, buildShin),
      foot: mesh(r, buildFoot),
      sleeve: mesh(r, buildSleeve),
      upperSkin: mesh(r, buildUpperSkin),
      fore: mesh(r, buildFore),
      hands
    };
  }

  function solve(p) {
    return Rig.solve(p, D);
  }

  function draw(r, V, m, p, opts) {
    const o = opts || {};
    const pass = o.tint ? { tint: o.tint } : {};
    const skinPass = Object.assign({ texture: V.tattoo }, pass);
    r.draw(V.pelvis, m.pelvis, pass);
    r.draw(V.chest, m.chest, pass);
    r.draw(V.printPatch, m.chest, Object.assign({ texture: V.print }, pass));
    r.draw(V.neck, m.neck, pass);
    r.draw(V.head, m.head, pass);
    r.draw(V.hair, m.head, pass);
    r.draw(V.face, m.head, Object.assign({ texture: V.faceTex(faceKey(p)) }, pass));
    ['L', 'R'].forEach(s => {
      r.draw(V.sleeve, m['upper' + s], pass);
      r.draw(V.upperSkin, m['upper' + s], skinPass);
      r.draw(V.fore, m['fore' + s], skinPass);
      r.draw(V.hands[s + (p['g' + s] || 'open')], m['hand' + s], pass);
      if (!p.noLegs) {
        r.draw(V['thigh' + s], m['thigh' + s], pass);
        r.draw(V.shin, m['shin' + s], pass);
        r.draw(V.foot, m['foot' + s], pass);
      }
    });
  }

  window.MukbangCast = { D, LOOK, EYES, BROWS, MOUTHS, GAZES, solve, build, draw, faceKey, headPt };
})();
