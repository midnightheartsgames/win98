(function (Z) {
  'use strict';

  const FACE_BASE = 192;
  const M = k => Z.MAT[k];
  const TAU = Math.PI * 2;
  const SKIN_UV = [0.035, 0.8];

  Z.HUMAN_RIG = new Z.RigDef([
    { name: 'hips', pos: [0, 0.95, 0] },
    { name: 'spine', parent: 'hips', pos: [0, 1.08, 0] },
    { name: 'chest', parent: 'spine', pos: [0, 1.28, 0] },
    { name: 'neck', parent: 'chest', pos: [0, 1.5, 0] },
    { name: 'head', parent: 'neck', pos: [0, 1.6, 0] },
    { name: 'jaw', parent: 'head', pos: [0, 1.668, 0.012] },
    { name: 'luarm', parent: 'chest', pos: [-0.19, 1.45, 0] },
    { name: 'lfarm', parent: 'luarm', pos: [-0.19, 1.17, 0] },
    { name: 'lhand', parent: 'lfarm', pos: [-0.19, 0.92, 0] },
    { name: 'ruarm', parent: 'chest', pos: [0.19, 1.45, 0] },
    { name: 'rfarm', parent: 'ruarm', pos: [0.19, 1.17, 0] },
    { name: 'rhand', parent: 'rfarm', pos: [0.19, 0.92, 0] },
    { name: 'lfing', parent: 'lhand', pos: [-0.19, 0.866, 0] },
    { name: 'ltip', parent: 'lfing', pos: [-0.18, 0.828, 0] },
    { name: 'lthumb', parent: 'lhand', pos: [-0.1875, 0.9235, -0.0156] },
    { name: 'rfing', parent: 'rhand', pos: [0.19, 0.866, 0] },
    { name: 'rtip', parent: 'rfing', pos: [0.18, 0.828, 0] },
    { name: 'rthumb', parent: 'rhand', pos: [0.1875, 0.9235, -0.0156] },
    { name: 'lthigh', parent: 'hips', pos: [-0.095, 0.92, 0] },
    { name: 'lshin', parent: 'lthigh', pos: [-0.095, 0.5, 0] },
    { name: 'lfoot', parent: 'lshin', pos: [-0.095, 0.08, 0] },
    { name: 'rthigh', parent: 'hips', pos: [0.095, 0.92, 0] },
    { name: 'rshin', parent: 'rthigh', pos: [0.095, 0.5, 0] },
    { name: 'rfoot', parent: 'rshin', pos: [0.095, 0.08, 0] }
  ]);

  const SKINS = Z.LOOK_POOL.SKINS;
  const HC = [0, 1.69, 0.004];
  const H_TOP = 0.115, H_BOT = -0.119, SE = 2.3;
  const HEAD_LV = [
    [0.115, 0.000, 0.000, 0.000], [0.110, 0.030, 0.028, 0.035], [0.098, 0.055, 0.052, 0.064], [0.080, 0.070, 0.072, 0.084],
    [0.058, 0.077, 0.086, 0.095], [0.035, 0.079, 0.093, 0.099], [0.015, 0.079, 0.095, 0.099], [-0.005, 0.078, 0.093, 0.096],
    [-0.025, 0.076, 0.092, 0.090], [-0.045, 0.071, 0.093, 0.080], [-0.062, 0.065, 0.092, 0.068], [-0.080, 0.057, 0.088, 0.052],
    [-0.096, 0.046, 0.084, 0.034], [-0.108, 0.032, 0.078, 0.016], [-0.116, 0.016, 0.066, 0.004], [-0.119, 0.000, 0.044, 0.000]
  ];
  const sstep = (a, b, x) => { const t = Z.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const G2 = (x, y, cx, cy, rx, ry) => Math.exp(-((x - cx) * (x - cx) / (rx * rx) + (y - cy) * (y - cy) / (ry * ry)));
  const cr = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);

  const headLevel = (dy, fem) => {
    const L = HEAD_LV, n = L.length;
    let i = 0;
    while (i < n - 2 && dy < L[i + 1][0]) i++;
    const t = Z.clamp((L[i][0] - dy) / (L[i][0] - L[i + 1][0]), 0, 1);
    const at = k => L[Z.clamp(k, 0, n - 1)];
    const v = c => Math.max(0, cr(at(i - 1)[c], at(i)[c], at(i + 1)[c], at(i + 2)[c], t));
    let w = v(1), f = v(2), b = v(3);
    if (fem) { w *= 0.95 * (dy < -0.04 ? 1 - Math.min(1, (-0.04 - dy) / 0.07) * 0.07 : 1); f *= 0.965; b *= 0.97; }
    return { w, f, b };
  };

  const NOSE = [[0.016, 0, 0.006], [0.004, 0.004, 0.0065], [-0.012, 0.011, 0.0078], [-0.028, 0.019, 0.0102], [-0.036, 0.0165, 0.0118], [-0.043, 0.007, 0.011], [-0.05, 0, 0.008]];
  const noseAt = (x, dy, k) => {
    if (dy > NOSE[0][0] || dy < NOSE[NOSE.length - 1][0]) return 0;
    let i = 0;
    while (dy < NOSE[i + 1][0]) i++;
    const t = (NOSE[i][0] - dy) / (NOSE[i][0] - NOSE[i + 1][0]);
    const prot = Z.lerp(NOSE[i][1], NOSE[i + 1][1], t), hw = Z.lerp(NOSE[i][2], NOSE[i + 1][2], t);
    const q = Math.abs(x) / hw;
    return q >= 1 ? 0 : prot * k * Math.pow(1 - q * q, 1.4);
  };
  const faceBump = (x, dy, front, fem) => {
    const ax = Math.abs(x);
    let d = noseAt(x, dy, fem ? 0.8 : 1);
    d += 0.0055 * (fem ? 0.8 : 1) * G2(ax, dy, 0.0125, -0.037, 0.0055, 0.0055);
    d += 0.0045 * (fem ? 0.55 : 1) * G2(ax, dy, 0, 0.024, 0.05, 0.0065);
    d -= 0.0065 * G2(ax, dy, 0.033, 0.006, 0.016, 0.011);
    d += 0.0034 * G2(ax, dy, 0.033, 0.004, 0.009, 0.006);
    d += 0.004 * G2(ax, dy, 0.049, -0.02, 0.016, 0.014);
    d += (fem ? 0.0048 : 0.0036) * G2(ax, dy, 0, -0.054, 0.021, 0.0042);
    d += (fem ? 0.0055 : 0.0042) * G2(ax, dy, 0, -0.067, 0.018, 0.005);
    d -= 0.0022 * G2(ax, dy, 0, -0.0605, 0.023, 0.0017);
    d -= 0.002 * G2(ax, dy, 0, -0.078, 0.02, 0.0055);
    d += (fem ? 0.0035 : 0.0062) * G2(ax, dy, 0, -0.101, 0.019, 0.012);
    return d * Math.min(1, front * 1.4);
  };

  const headPoint = (ph, dy, fem) => {
    const L = headLevel(dy, fem), sp = Math.sin(ph), cp = Math.cos(ph), ex = 2 / SE;
    const x = Math.sign(sp) * Math.pow(Math.abs(sp), ex) * L.w;
    const zf = Math.sign(cp) * Math.pow(Math.abs(cp), ex) * (cp >= 0 ? L.f : L.b);
    const r = Math.hypot(x, zf);
    const bump = cp > 0 ? faceBump(x, dy, cp, fem) : 0;
    const k = r > 1e-6 ? (r + bump) / r : 1;
    return [HC[0] + x * k, HC[1] + dy, HC[2] - zf * k];
  };
  const headNormal = (ph, dy, fem) => {
    const a = headPoint(ph - 0.004, dy, fem), b = headPoint(ph + 0.004, dy, fem), c = headPoint(ph, dy + 0.0015, fem), d = headPoint(ph, dy - 0.0015, fem);
    const tp = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ty = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
    let n = [ty[1] * tp[2] - ty[2] * tp[1], ty[2] * tp[0] - ty[0] * tp[2], ty[0] * tp[1] - ty[1] * tp[0]];
    let L = Math.hypot(n[0], n[1], n[2]);
    if (L < 1e-9) { const p = headPoint(ph, dy, fem); n = [p[0] - HC[0], p[1] - HC[1] + 0.02, p[2] - HC[2]]; L = Math.hypot(n[0], n[1], n[2]) || 1; }
    return [n[0] / L, n[1] / L, n[2] / L];
  };
  const uvOf = (ph, dy) => [0.5 + 0.5 * Math.sign(ph) * Math.pow(Math.min(1, Math.abs(ph) / Math.PI), 0.62), (H_TOP - dy) / (H_TOP - H_BOT)];
  const uvAtPos = (x, y, z) => uvOf(Math.atan2(x - HC[0], -(z - HC[2])), y - HC[1]);
  const facePx = (x, dy, fem, S) => {
    const L = headLevel(dy, fem), q = Z.clamp(Math.abs(x) / Math.max(0.01, L.w), 0, 1);
    const uv = uvOf(Math.sign(x) * Math.asin(Math.pow(q, SE / 2)), dy);
    return [uv[0] * S, uv[1] * S];
  };
  const jawWeight = (ph, dy) => sstep(-0.056, -0.074, dy) * sstep(0, 0.5, Math.cos(ph));

  const rgbs = (a, k = 1, al = 1) => 'rgba(' + Math.round(Z.clamp(a[0] * k, 0, 255)) + ',' + Math.round(Z.clamp(a[1] * k, 0, 255)) + ',' + Math.round(Z.clamp(a[2] * k, 0, 255)) + ',' + al + ')';

  Z.faceCanvas = (look, S = 256) => {
    const c = Z.mkCanvas(S, S), g = c.getContext('2d');
    const fem = look.sex === 'f', sk = (look.skin || SKINS[0]).map(v => v * 0.96), hc = look.hairCol || [60, 45, 30];
    const R = Z.rng(look.faceSeed || 7);
    const age = look.age || 0.4;
    g.fillStyle = rgbs(sk);
    g.fillRect(0, 0, S, S);
    const img = g.getImageData(0, 0, S, S), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = 0.97 + Z.hash2(i >> 2 & (S - 1), i >> 2 >> Math.log2(S), look.faceSeed || 1) * 0.05;
      d[i] *= n; d[i + 1] *= n; d[i + 2] *= n;
    }
    g.putImageData(img, 0, 0);
    const P = (x, dy) => facePx(x, dy, fem, S);
    const span = (x, dy, rx, ry) => { const p = P(x, dy); return [p, Math.max(0.5, Math.abs(P(x + rx, dy)[0] - P(x - rx, dy)[0]) / 2), Math.max(0.5, Math.abs(P(x, dy - ry)[1] - P(x, dy + ry)[1]) / 2)]; };
    const soft = (x, dy, rx, ry, col, al) => {
      const [p, sx, sy] = span(x, dy, rx, ry);
      g.save(); g.translate(p[0], p[1]); g.scale(1, sy / sx);
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, sx);
      grd.addColorStop(0, rgbs(col, 1, al)); grd.addColorStop(1, rgbs(col, 1, 0));
      g.fillStyle = grd; g.beginPath(); g.arc(0, 0, sx, 0, TAU); g.fill(); g.restore();
    };
    const ell = (x, dy, rx, ry, col) => { const [p, sx, sy] = span(x, dy, rx, ry); g.fillStyle = col; g.beginPath(); g.ellipse(p[0], p[1], sx, sy, 0, 0, TAU); g.fill(); };
    const path = (pts, col, w) => { g.strokeStyle = col; g.lineWidth = Math.max(0.6, w * S * 4.5); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, i) => { const p = P(q[0], q[1]); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke(); };
    const shade = [sk[0] * 0.7, sk[1] * 0.6, sk[2] * 0.58], warm = [Math.min(255, sk[0] * 1.06 + 12), sk[1] * 0.8, sk[2] * 0.78];
    for (const s of [-1, 1]) {
      soft(s * 0.034, 0.009, 0.022, 0.015, shade, 0.42);
      soft(s * 0.012, -0.022, 0.0065, 0.017, shade, 0.3);
      soft(s * 0.046, -0.036, 0.022, 0.018, warm, fem ? 0.4 : 0.22);
      soft(s * 0.062, -0.088, 0.02, 0.03, shade, 0.22);
      soft(s * 0.077, -0.004, 0.012, 0.03, shade, 0.35);
      soft(s * 0.058, 0.01, 0.012, 0.03, shade, 0.12);
    }
    soft(0, -0.047, 0.012, 0.0035, shade, 0.5);
    soft(0, -0.077, 0.016, 0.0055, shade, 0.32);
    soft(0, -0.031, 0.008, 0.007, warm, 0.25);
    soft(0, 0.05, 0.04, 0.03, sk.map(v => Math.min(255, v * 1.12)), 0.2);
    soft(0, -0.112, 0.03, 0.012, shade, 0.3);
    const male = !fem;
    if (male) {
      const beardy = look.beard === 'stubble' || look.beard === 'full' || look.beard === 'cossack' || look.beard === 'mustache';
      const dens = look.beard === 'stubble' ? 0.42 : beardy ? 0.16 : 0.07;
      const bimg = g.getImageData(0, 0, S, S), bd = bimg.data;
      for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
        const v = py / S, dy = H_TOP - v * (H_TOP - H_BOT);
        if (dy > 0.005 || dy < -0.125) continue;
        const u = px / S - 0.5;
        const ph = Math.sign(u) * Math.pow(Math.min(1, Math.abs(u) * 2), 1 / 0.62) * Math.PI, aph = Math.abs(ph);
        if (aph > 1.6) continue;
        const L = headLevel(dy, false), ax = Math.pow(Math.abs(Math.sin(Math.min(aph, Math.PI / 2))), 2 / SE) * L.w;
        const line = Z.lerp(-0.047, -0.008, sstep(0.012, 0.072, ax)) - sstep(1.1, 1.5, aph) * 0.03;
        let k = sstep(line + 0.006, line - 0.01, dy) * (1 - sstep(1.2, 1.6, aph));
        k *= 1 - G2(ax, dy, 0, -0.064, 0.028, 0.008) * 0.95;
        k *= 1 - G2(ax, dy, 0, -0.04, 0.012, 0.006);
        if (k <= 0.01) continue;
        k *= dens * (0.62 + 0.38 * Z.hash2(px, py, 31));
        const i = (py * S + px) * 4;
        bd[i] = Z.lerp(bd[i], hc[0] * 0.55 + 10, k); bd[i + 1] = Z.lerp(bd[i + 1], hc[1] * 0.55 + 12, k); bd[i + 2] = Z.lerp(bd[i + 2], hc[2] * 0.6 + 18, k);
      }
      g.putImageData(bimg, 0, 0);
    }
    if (look.hair === 'bald' || look.hair === 'chub') {
      const top = look.hair === 'chub' ? 0.12 : 0.05;
      for (let i = 0; i < 9; i++) soft((i - 4) * 0.022, 0.09, 0.03, 0.03, hc, look.hair === 'chub' ? 0.12 : 0.05);
      soft(0, 0.11, 0.09, 0.02, hc, top);
    }
    const eyeC = look.eyes || [80, 90, 100];
    for (const s of [-1, 1]) {
      const ex = s * 0.033, ey = 0.004;
      soft(ex, ey + 0.009, 0.014, 0.005, shade, 0.5);
      ell(ex, ey, 0.0118, 0.0054, '#ebe5da');
      soft(ex - s * 0.008, ey, 0.004, 0.005, [150, 140, 130], 0.4);
      ell(ex, ey + 0.0003, 0.0055, 0.0053, rgbs(eyeC, 0.75));
      ell(ex, ey + 0.0003, 0.0042, 0.0042, rgbs(eyeC));
      ell(ex, ey + 0.0003, 0.0021, 0.0021, '#0c0806');
      const hp = P(ex - 0.0016, ey + 0.0018);
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(hp[0] - S / 256, hp[1] - S / 256, S / 128, S / 128);
      path([[ex - s * 0.0125, ey - 0.0005], [ex - s * 0.006, ey + 0.0052], [ex + s * 0.004, ey + 0.0058], [ex + s * 0.0125, ey + 0.0008]], 'rgba(28,18,14,0.95)', fem ? 0.0016 : 0.0011);
      if (fem) path([[ex + s * 0.0118, ey + 0.001], [ex + s * 0.0158, ey + 0.0042]], 'rgba(20,12,10,0.9)', 0.001);
      path([[ex - s * 0.011, ey - 0.0018], [ex, ey - 0.0058], [ex + s * 0.011, ey - 0.0022]], rgbs(shade, 0.95, 0.55), 0.0007);
      path([[ex - s * 0.012, ey + 0.0105], [ex, ey + 0.0128], [ex + s * 0.012, ey + 0.0098]], rgbs(shade, 1, 0.45), 0.0008);
      const bw = (fem ? 0.0016 : 0.0024) + (look.brows || 0.6) * (fem ? 0.0008 : 0.0016);
      const by = ey + (fem ? 0.019 : 0.017);
      path([[s * 0.016, by - 0.001], [s * 0.026, by + 0.0035], [s * 0.038, by + (fem ? 0.005 : 0.0038)], [s * 0.049, by + 0.0005]], rgbs(hc, 0.85), bw);
      ell(s * 0.0086, -0.0425, 0.0038, 0.0021, rgbs(shade, 0.55, 0.85));
    }
    const lipK = fem ? Z.lerp(0.75, 0.4, sstep(0.4, 0.8, age)) : 0;
    const lip = fem ? [Z.lerp(sk[0] * 0.9, 196, lipK), Z.lerp(sk[1] * 0.62, 70, lipK), Z.lerp(sk[2] * 0.6, 72, lipK)] : [sk[0] * 0.86, sk[1] * 0.64, sk[2] * 0.62];
    g.fillStyle = rgbs(lip);
    const lp = q => P(q[0], q[1]);
    const lipPoly = pts => { g.beginPath(); pts.forEach((q, i) => { const p = lp(q); if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); g.fill(); };
    const lw = fem ? 0.0225 : 0.0235;
    lipPoly([[-lw, -0.0605], [-0.012, -0.0565], [-0.004, -0.0545], [0, -0.0555], [0.004, -0.0545], [0.012, -0.0565], [lw, -0.0605], [0.01, -0.0612], [-0.01, -0.0612]]);
    g.fillStyle = rgbs(lip, 1.04);
    lipPoly([[-lw, -0.0605], [-0.01, -0.0615], [0.01, -0.0615], [lw, -0.0605], [0.014, -0.0668], [0, fem ? -0.0705 : -0.069], [-0.014, -0.0668]]);
    soft(0, -0.0655, 0.009, 0.0025, [255, 240, 230], 0.18);
    path([[-lw, -0.0604], [-0.008, -0.0611], [0, -0.0607], [0.008, -0.0611], [lw, -0.0604]], 'rgba(60,25,20,0.85)', 0.0009);
    path([[-0.0035, -0.0465], [-0.004, -0.054]], rgbs(shade, 0.95, 0.35), 0.0008);
    path([[0.0035, -0.0465], [0.004, -0.054]], rgbs(shade, 0.95, 0.35), 0.0008);
    if (age > 0.55) {
      const a = Z.clamp((age - 0.55) * 2.2, 0, 1);
      for (let i = 0; i < 3; i++) path([[-0.03, 0.045 + i * 0.008], [0, 0.047 + i * 0.008], [0.03, 0.045 + i * 0.008]], rgbs(shade, 1, 0.35 * a), 0.0008);
      for (const s of [-1, 1]) {
        path([[s * 0.013, -0.04], [s * 0.022, -0.052], [s * 0.026, -0.066]], rgbs(shade, 1, 0.5 * a), 0.0011);
        path([[s * 0.047, 0.008], [s * 0.053, 0.002]], rgbs(shade, 1, 0.4 * a), 0.0007);
        path([[s * 0.047, 0.0], [s * 0.052, -0.006]], rgbs(shade, 1, 0.4 * a), 0.0007);
        soft(s * 0.033, -0.009, 0.012, 0.004, shade, 0.3 * a);
      }
    }
    if (look.scar) path([[0.045, 0.03], [0.052, 0.0], [0.056, -0.03]], rgbs(sk, 0.66), 0.0016);
    if (look.grime) for (let i = 0; i < 26; i++) soft((R() - 0.5) * 0.12, (R() - 0.6) * 0.2, 0.004 + R() * 0.012, 0.004 + R() * 0.01, [60, 50, 40], 0.4);
    if (look.ghoulish) for (let i = 0; i < 22; i++) soft((R() - 0.5) * 0.13, (R() - 0.55) * 0.2, 0.005 + R() * 0.012, 0.004 + R() * 0.01, R() < 0.5 ? [130, 60, 50] : [90, 100, 60], 0.6);
    return c;
  };

  Z.facePortrait = (look, S = 220) => {
    const src = Z.faceCanvas(look, 512), c = Z.mkCanvas(S, S), g = c.getContext('2d');
    g.drawImage(src, 512 * 0.26, 512 * 0.12, 512 * 0.48, 512 * 0.86, S * 0.08, 0, S * 0.84, S);
    return c;
  };

  const MATK = { cloth: 1, quilt: 1.14, leather: 1.05, rubber: 1.9, fur: 1.1, stripes: 1, skin: 0.88, metalGrey: 1.45, robotPaint: 1.1, slag: 1, glass: 1, paintRed: 1, gunMetal: 2.4, bakelite: 1.8, canvas: 1.55, glow: 0.5, fishskin: 2.4, soil: 2.2, paintGreen: 1.9, feathers: 1.02, blank: 1, marble: 1, chitinStripes: 1 };
  const paint = (mb, mat, c) => {
    const k = 0.64 * (MATK[mat] || 1);
    mb.setMat(M(mat), 0, 0);
    mb.setTint(Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k), 255);
  };
  const setUV = (mb, uv) => (v0, v1) => { for (let i = v0; i < v1; i++) { mb.uv[i * 2] = uv[0]; mb.uv[i * 2 + 1] = uv[1]; } };
  const orientOut = (mb, v0, i0, center) => {
    const P = mb.pos;
    for (let t = i0; t < mb.idx.length; t += 3) {
      const a = mb.idx[t], b = mb.idx[t + 1], c = mb.idx[t + 2];
      if (a < v0) continue;
      const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
      const wx = P[c * 3] - P[a * 3], wy = P[c * 3 + 1] - P[a * 3 + 1], wz = P[c * 3 + 2] - P[a * 3 + 2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      const cx = (P[a * 3] + P[b * 3] + P[c * 3]) / 3 - center[0], cy = (P[a * 3 + 1] + P[b * 3 + 1] + P[c * 3 + 1]) / 3 - center[1], cz = (P[a * 3 + 2] + P[b * 3 + 2] + P[c * 3 + 2]) / 3 - center[2];
      if (nx * cx + ny * cy + nz * cz < 0) { mb.idx[t + 1] = c; mb.idx[t + 2] = b; }
    }
  };
  const blob = (mb, bone, c, r, seg = 8, ring = 6) => {
    const v0 = mb.n, i0 = mb.idx.length;
    mb.ellipsoid(bone, c, r, seg, ring);
    orientOut(mb, v0, i0, c);
    return v0;
  };
  const tubeAlong = (mb, pts, radii, o = {}) => {
    const rings = [];
    let ref = o.ref || [0, 0, -1];
    for (let k = 0; k < pts.length; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
      let A = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const L = Math.hypot(A[0], A[1], A[2]) || 1;
      A = [A[0] / L, A[1] / L, A[2] / L];
      let d = ref[0] * A[0] + ref[1] * A[1] + ref[2] * A[2];
      let U = [ref[0] - A[0] * d, ref[1] - A[1] * d, ref[2] - A[2] * d];
      if (Math.hypot(U[0], U[1], U[2]) < 1e-4) { ref = Math.abs(A[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; d = ref[0] * A[0] + ref[1] * A[1] + ref[2] * A[2]; U = [ref[0] - A[0] * d, ref[1] - A[1] * d, ref[2] - A[2] * d]; }
      const ul = Math.hypot(U[0], U[1], U[2]);
      U = [U[0] / ul, U[1] / ul, U[2] / ul];
      ref = U;
      const V = [A[1] * U[2] - A[2] * U[1], A[2] * U[0] - A[0] * U[2], A[0] * U[1] - A[1] * U[0]];
      const r = radii[Math.min(k, radii.length - 1)];
      const bw = o.bones ? o.bones[Math.min(k, o.bones.length - 1)] : [o.b];
      rings.push({ c: pts[k], rx: r, rz: r, U, V, b: bw[0], b2: bw[1], w: bw[2] || 0 });
    }
    const U0 = rings[0].U, V0 = rings[0].V;
    return mb.loft(rings, Object.assign({ sides: o.sides || 6, U: U0, V: V0, capA: o.capA, capB: o.capB !== false, post: o.post }, o.loft || {}));
  };

  const TORSO_M = [
    [1.505, 0.068, 0.058, 0.064, 'chest', 'neck', 0.35], [1.478, 0.128, 0.080, 0.088, 'chest'], [1.448, 0.166, 0.102, 0.098, 'chest'],
    [1.405, 0.178, 0.113, 0.104, 'chest'], [1.335, 0.174, 0.117, 0.104, 'chest'], [1.255, 0.160, 0.108, 0.099, 'chest', 'spine', 0.45],
    [1.175, 0.147, 0.101, 0.094, 'spine'], [1.105, 0.145, 0.100, 0.094, 'spine', 'hips', 0.35], [1.035, 0.151, 0.100, 0.099, 'hips', 'spine', 0.3],
    [0.965, 0.163, 0.099, 0.108, 'hips'], [0.895, 0.160, 0.094, 0.114, 'hips'], [0.845, 0.128, 0.080, 0.090, 'hips'], [0.812, 0.055, 0.040, 0.045, 'hips']
  ];
  const TORSO_F = [
    [1.500, 0.060, 0.052, 0.058, 'chest', 'neck', 0.35], [1.474, 0.115, 0.074, 0.080, 'chest'], [1.446, 0.152, 0.094, 0.090, 'chest'],
    [1.400, 0.158, 0.106, 0.095, 'chest'], [1.335, 0.152, 0.112, 0.094, 'chest'], [1.260, 0.137, 0.094, 0.090, 'chest', 'spine', 0.45],
    [1.185, 0.124, 0.085, 0.084, 'spine'], [1.110, 0.128, 0.086, 0.088, 'spine', 'hips', 0.35], [1.035, 0.152, 0.094, 0.100, 'hips', 'spine', 0.3],
    [0.965, 0.172, 0.098, 0.118, 'hips'], [0.895, 0.168, 0.094, 0.122, 'hips'], [0.845, 0.132, 0.080, 0.095, 'hips'], [0.812, 0.056, 0.040, 0.046, 'hips']
  ];
  const ARM = [
    [1.47, -0.038, 0.044, 'uarm', 'chest', 0.55], [1.45, -0.006, 0.05, 'uarm', 'chest', 0.3], [1.4, 0.003, 0.0495, 'uarm'], [1.32, 0.004, 0.045, 'uarm'],
    [1.235, 0.002, 0.041, 'uarm'], [1.17, 0, 0.037, 'uarm', 'farm', 0.5], [1.115, 0, 0.0395, 'farm'], [1.04, 0, 0.035, 'farm'],
    [0.975, 0, 0.0275, 'farm'], [0.935, 0, 0.0235, 'farm', 'hand', 0.35], [0.925, 0, 0.0232, 'hand', 'farm', 0.4]
  ];
  const LEG = [
    [0.985, 0.55, 0.080, 'thigh', 'hips', 0.6], [0.9, 1, 0.088, 'thigh', 'hips', 0.2], [0.77, 1, 0.076, 'thigh'], [0.63, 1, 0.062, 'thigh'],
    [0.525, 1, 0.052, 'thigh', 'shin', 0.5], [0.45, 1, 0.053, 'shin'], [0.36, 1, 0.054, 'shin'], [0.25, 1, 0.043, 'shin'],
    [0.135, 1, 0.033, 'shin', 'foot', 0.25], [0.1, 1, 0.032, 'shin', 'foot', 0.4]
  ];
  const FOOT = [[0.058, 0.052, 0.04, 0.029], [0.025, 0.07, 0.06, 0.036], [-0.035, 0.058, 0.05, 0.04], [-0.1, 0.042, 0.036, 0.044], [-0.16, 0.032, 0.026, 0.04], [-0.198, 0.026, 0.016, 0.024]];

  const rowsBetween = (rows, y0, y1, make, geo) => {
    const out = [];
    const at = y => {
      let i = 0;
      while (i < rows.length - 2 && y < rows[i + 1][0]) i++;
      const a = rows[i], b = rows[i + 1], t = Z.clamp((a[0] - y) / (a[0] - b[0]), 0, 1);
      const near = t < 0.5 ? a : b;
      const row = near.slice();
      for (let k = 0; k <= geo; k++) row[k] = Z.lerp(a[k], b[k], t);
      row[0] = y;
      return row;
    };
    out.push(make(at(y0)));
    for (const r of rows) if (r[0] < y0 - 0.004 && r[0] > y1 + 0.004) out.push(make(r));
    out.push(make(at(y1)));
    return out;
  };

  const HAND_F = [
    { t: 0.0275, d: 0.083, l: [0.044, 0.026, 0.021], r: 0.0093, sp: 0.06 },
    { t: 0.0092, d: 0.087, l: [0.048, 0.029, 0.022], r: 0.0097, sp: 0 },
    { t: -0.0094, d: 0.084, l: [0.045, 0.027, 0.021], r: 0.0092, sp: -0.05 },
    { t: -0.0265, d: 0.075, l: [0.036, 0.021, 0.019], r: 0.0081, sp: -0.12 }
  ];
  const HAND_PALM = [
    [-0.006, 0.023, 0.015, 0.015, 0], [0.016, 0.031, 0.019, 0.015, 0.003], [0.04, 0.039, 0.017, 0.013, 0.002],
    [0.064, 0.043, 0.0145, 0.012, 0], [0.079, 0.043, 0.0125, 0.011, 0], [0.09, 0.036, 0.009, 0.0085, 0]
  ];
  const HAND_TH = { c: [0.014, 0.003, 0.019], l: [0.04, 0.032, 0.026], r: [0.0128, 0.0112, 0.0098] };
  const HAND_GRASP = [0.081, 0.0125];

  const v3 = {
    add: (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    norm: a => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; },
    rot: (v, n, a) => { const c = Math.cos(a), s = Math.sin(a), x = v3.cross(n, v), d = v3.dot(n, v) * (1 - c); return [v[0] * c + x[0] * s + n[0] * d, v[1] * c + x[1] * s + n[1] * d, v[2] * c + x[2] * s + n[2] * d]; }
  };
  Z.V3 = v3;

  const HAND_POSES = {
    relax: { f: [[0.22, 0.3, 0.18], [0.26, 0.36, 0.2], [0.3, 0.42, 0.22], [0.36, 0.46, 0.24]], s: 1, th: [[0.55, 0.32, 0.77], [0.72, 0.42, 0.55], [0.8, 0.5, 0.33]] },
    open: { f: [[0.04, 0.06, 0.04], [0.04, 0.06, 0.04], [0.05, 0.07, 0.04], [0.06, 0.08, 0.05]], s: 1.5, th: [[0.5, 0.15, 0.85], [0.62, 0.12, 0.77], [0.7, 0.1, 0.7]] },
    flat: { f: [[0.12, 0.16, 0.1], [0.12, 0.16, 0.1], [0.14, 0.18, 0.1], [0.16, 0.2, 0.12]], s: 0.6, th: [[0.62, 0.3, 0.72], [0.78, 0.3, 0.55], [0.86, 0.3, 0.4]] },
    fist: { f: [[1.5, 1.75, 0.85], [1.52, 1.8, 0.9], [1.52, 1.8, 0.9], [1.48, 1.8, 0.9]], s: 0.25, th: [[0.6, 0.45, 0.66], [0.45, 0.85, -0.27], [0.1, 0.75, -0.65]] },
    pinch: { f: [[0.55, 0.9, 0.5], [0.95, 1.3, 0.7], [1.15, 1.5, 0.8], [1.25, 1.6, 0.8]], s: 0.4, th: [[0.62, 0.45, 0.64], [0.78, 0.55, 0.12], [0.82, 0.45, -0.25]] }
  };
  for (const k in HAND_POSES) HAND_POSES[k].key = k;
  Z.HAND_POSES = HAND_POSES;

  const wrapCache = new Map();
  Z.handWrap = (R, o = {}) => {
    const key = R.toFixed(4) + (o.trig ? 't' : '') + (o.open ? 'o' : '') + (o.thumb || '');
    if (wrapCache.has(key)) return wrapCache.get(key);
    const f = [];
    const dc = HAND_GRASP[0], pc = HAND_GRASP[1] + R;
    HAND_F.forEach((F, fi) => {
      const rho = R + F.r * 1.05, K = [F.d, 0];
      const E = th => [K[0] + F.l[0] * Math.cos(th), K[1] + F.l[0] * Math.sin(th)];
      const fx = th => { const e = E(th); return (e[0] - dc) * (e[0] - dc) + (e[1] - pc) * (e[1] - pc) - rho * rho; };
      let th1 = null, best = 0, bv = Infinity;
      for (let th = 0; th <= 2.2; th += 0.02) {
        const v = fx(th);
        if (v < bv) { bv = v; best = th; }
        if (v < 0 && th1 === null) { let a = th - 0.02, b = th; for (let i = 0; i < 20; i++) { const m = (a + b) / 2; if (fx(m) < 0) b = m; else a = m; } th1 = (a + b) / 2; }
      }
      if (th1 === null) th1 = best;
      const J1 = E(th1);
      let phi = Math.atan2(J1[1] - pc, J1[0] - dc), prev = th1, P = J1;
      const c = [th1];
      for (let k = 1; k < 3; k++) {
        phi += 2 * Math.asin(Math.min(1, F.l[k] / (2 * rho)));
        const Q = [dc + rho * Math.cos(phi), pc + rho * Math.sin(phi)];
        const ang = Math.atan2(Q[1] - P[1], Q[0] - P[0]);
        let dA = ang - prev;
        while (dA < -Math.PI) dA += Math.PI * 2;
        while (dA > Math.PI) dA -= Math.PI * 2;
        c.push(dA);
        prev = ang; P = Q;
      }
      f.push([Z.clamp(c[0], 0, 1.65), Z.clamp(c[1], 0, 1.95), Z.clamp(c[2], 0, 1.3)]);
    });
    if (o.open) for (const c of f) { c[1] *= 0.55; c[2] *= 0.5; }
    if (o.trig) f[0] = [0.42, 0.72, 0.32];
    const tk = Z.clamp((0.05 - R) / 0.032, 0, 1);
    const TH = o.thumb === 'fwd' ? [[0.5, 0.62, 0.6], [0.86, 0.48, 0.16], [0.95, 0.3, -0.02]] : o.thumb === 'side' ? [[0.6, 0.42, 0.68], [0.8, 0.5, 0.33], [0.88, 0.45, 0.15]] : HAND_POSES.relax.th.map((t, i) => t.map((v, j) => Z.lerp(v, HAND_POSES.fist.th[i][j], tk)));
    const pose = { f, s: 0.35, th: TH, key: 'w' + key };
    wrapCache.set(key, pose);
    return pose;
  };

  const blendCache = new Map();
  Z.handBlend = (a, b, t) => {
    const q = Math.round(Z.clamp(t, 0, 1) * 10) / 10;
    if (q <= 0 || a === b) return a;
    if (q >= 1) return b;
    const key = a.key + '>' + b.key + '@' + q;
    let r = blendCache.get(key);
    if (r) return r;
    r = { f: a.f.map((row, i) => row.map((v, j) => Z.lerp(v, b.f[i][j], q))), s: Z.lerp(a.s, b.s, q), th: a.th.map((row, i) => row.map((v, j) => Z.lerp(v, b.th[i][j], q))), key };
    if (blendCache.size > 4000) blendCache.clear();
    blendCache.set(key, r);
    return r;
  };

  Z.buildHand = (mb, o) => {
    const s = o.side, k = o.k || 1, pose = o.pose || HAND_POSES.relax, at = o.at || [0, 0, 0], B = o.bones || {};
    const sides = o.sides || 8, post = o.post, shade = o.shade;
    const Dv = [0, -1, 0], Pv = [-s, 0, 0], Tv = [0, 0, -1];
    const L = (d, p, t) => [at[0] + (-s * p) * k, at[1] - d * k, at[2] - t * k];
    const dir = (d, p, t) => v3.norm([-s * p, -d, -t]);
    const hb = B.hand || 'root';
    const ringTint = m => shade ? [shade[0] * m, shade[1] * m, shade[2] * m] : null;
    const pr = HAND_PALM.map((r, i) => ({ c: L(r[0], 0, r[4]), rx: r[1] * k, f: r[2] * k, bk: r[3] * k, b: hb, b2: i === 0 && B.farm ? B.farm : (i === HAND_PALM.length - 1 && B.fing ? B.fing : null), w: i === 0 && B.farm ? 0.3 : (i === HAND_PALM.length - 1 && B.fing ? 0.25 : 0), tint: ringTint(1) }));
    mb.loft(pr, {
      sides: sides * 2 + 4, U: Pv, V: Tv, n: 2.1, capA: true, capB: true,
      post: (v0, v1) => {
        for (let i = v0; i < v1; i++) {
          const d = (at[1] - mb.pos[i * 3 + 1]) / k, t = -(mb.pos[i * 3 + 2] - at[2]) / k;
          if (d > 0.058) { const dd = Math.max(0, -t / 0.044) * 0.011 * Z.clamp((d - 0.058) / 0.032, 0, 1); mb.pos[i * 3 + 1] += dd * k; }
          const pp = (mb.pos[i * 3] - at[0]) * -s / k;
          if (d < 0.05 && t > 0.01 && pp > 0) mb.pos[i * 3] += -s * 0.004 * Z.clamp((t - 0.01) / 0.02, 0, 1) * Z.clamp(1 - Math.abs(d - 0.022) / 0.03, 0, 1) * k;
          if (pp < -0.004 && d > 0.015) {
            let rel = 0;
            for (const F of HAND_F) { const g = Math.exp(-((t - F.t) * (t - F.t)) / 0.00005); rel += g * (0.0012 * Z.clamp((d - 0.015) / 0.06, 0, 1) + 0.0026 * Math.exp(-((d - 0.08) * (d - 0.08)) / 0.00012)); }
            mb.pos[i * 3] += s * rel * k;
          }
        }
        if (post) post(v0, v1);
      }
    });
    const ring = (c, A, U, rad, b, b2, w, tint, round) => ({ c, rx: rad * (round ? 1 : 1.04), f: rad, bk: rad * (round ? 1 : 0.86), U, V: v3.cross(A, U), b, b2, w, tint });
    const chain = (pts, Nf, ref) => {
      const rings = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)].c, b = pts[Math.min(pts.length - 1, i + 1)].c;
        const A = v3.norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
        let U = Nf ? v3.cross(Nf, A) : null;
        if (!U || Math.hypot(U[0], U[1], U[2]) < 0.2) { let r = ref; let d = v3.dot(r, A); if (Math.abs(d) > 0.95) { r = Tv; d = v3.dot(r, A); } U = [r[0] - A[0] * d, r[1] - A[1] * d, r[2] - A[2] * d]; }
        U = v3.norm(U);
        const P = pts[i];
        rings.push(ring(P.c, A, U, P.r * k, P.b, P.b2, P.w, P.tint, P.round));
      }
      mb.loft(rings, { sides, flip: false, capB: true, n: 2.2, post });
    };
    HAND_F.forEach((F, fi) => {
      const curl = pose.f[fi];
      const base = v3.rot(Dv, Pv, F.sp * (pose.s === undefined ? 1 : pose.s) * s * -1);
      const Nf = v3.norm(v3.cross(base, Pv));
      const d0 = v3.rot(base, Nf, curl[0]), d1 = v3.rot(d0, Nf, curl[1]), d2 = v3.rot(d1, Nf, curl[2]);
      const K = L(F.d, 0, F.t), r = F.r;
      const J1 = v3.add(K, d0, F.l[0] * k), J2 = v3.add(J1, d1, F.l[1] * k), T0 = v3.add(J2, d2, (F.l[2] - r * 0.85) * k);
      const fb = B.fing || hb, tb = B.tip || hb;
      const pts = [
        { c: v3.add(K, base, -0.014 * k), r: r * 1.0, b: hb, tint: ringTint(0.92) },
        { c: K, r: r * 1.12, b: fb, b2: hb, w: 0.35, tint: ringTint(0.86) },
        { c: v3.add(K, d0, F.l[0] * 0.5 * k), r: r * 1.0, b: fb, tint: ringTint(0.97) },
        { c: v3.add(J1, d0, -r * 0.6 * k), r: r * 0.99, b: fb, b2: tb, w: 0.2, tint: ringTint(1) },
        { c: J1, r: r * 1.05, b: tb, b2: fb, w: 0.45, tint: ringTint(0.95) },
        { c: v3.add(J1, d1, r * 0.6 * k), r: r * 0.96, b: tb, tint: ringTint(1) },
        { c: v3.add(J1, d1, F.l[1] * 0.55 * k), r: r * 0.92, b: tb, tint: ringTint(1) },
        { c: v3.add(J2, d1, -r * 0.5 * k), r: r * 0.92, b: tb, tint: ringTint(1) },
        { c: J2, r: r * 0.95, b: tb, tint: ringTint(0.96) },
        { c: v3.add(J2, d2, r * 0.5 * k), r: r * 0.9, b: tb, tint: ringTint(1) },
        { c: T0, r: r * 0.88, b: tb, tint: ringTint(1.02) },
        { c: v3.add(T0, d2, r * 0.45 * k), r: r * 0.74, b: tb, tint: ringTint(1.03) },
        { c: v3.add(T0, d2, r * 0.78 * k), r: r * 0.42, b: tb, tint: ringTint(1.03) },
        { c: v3.add(T0, d2, r * 0.92 * k), r: r * 0.1, b: tb, tint: ringTint(1.03) }
      ];
      chain(pts, Nf, Pv);
    });
    const T = HAND_TH, th = pose.th.map(t => dir(t[0], t[1], t[2]));
    const C0 = L(T.c[0], T.c[1], T.c[2]), J1 = v3.add(C0, th[0], T.l[0] * k), J2 = v3.add(J1, th[1], T.l[1] * k), T0 = v3.add(J2, th[2], (T.l[2] - T.r[2] * 0.85) * k);
    const thb = B.thumb || hb, r2 = T.r[2];
    chain([
      { c: v3.add(C0, th[0], -0.008 * k), r: T.r[0] * 0.9, b: hb, round: 1, tint: ringTint(0.98) },
      { c: C0, r: T.r[0], b: thb, b2: hb, w: 0.5, round: 1, tint: ringTint(1) },
      { c: v3.add(C0, th[0], T.l[0] * 0.5 * k), r: T.r[0] * 1.06, b: thb, round: 1, tint: ringTint(1) },
      { c: v3.add(J1, th[0], -T.r[1] * 0.6 * k), r: T.r[1] * 1.02, b: thb, round: 1, tint: ringTint(1) },
      { c: J1, r: T.r[1] * 1.04, b: thb, tint: ringTint(0.96) },
      { c: v3.add(J1, th[1], T.r[1] * 0.6 * k), r: T.r[1] * 0.98, b: thb, tint: ringTint(1) },
      { c: v3.add(J2, th[1], -r2 * 0.5 * k), r: r2 * 0.98, b: thb, tint: ringTint(1) },
      { c: J2, r: r2 * 1.0, b: thb, tint: ringTint(0.97) },
      { c: v3.add(J2, th[2], r2 * 0.5 * k), r: r2 * 0.95, b: thb, tint: ringTint(1) },
      { c: T0, r: r2 * 0.9, b: thb, tint: ringTint(1.02) },
      { c: v3.add(T0, th[2], r2 * 0.45 * k), r: r2 * 0.75, b: thb, tint: ringTint(1.03) },
      { c: v3.add(T0, th[2], r2 * 0.78 * k), r: r2 * 0.42, b: thb, tint: ringTint(1.03) },
      { c: v3.add(T0, th[2], r2 * 0.92 * k), r: r2 * 0.1, b: thb, tint: ringTint(1.03) }
    ], v3.norm(v3.cross(th[1], Pv)), Pv);
    return mb;
  };

  Z.handBasis = (side, D, P, wrist, k = 1) => {
    const T = v3.cross(D, P).map(v => v * side);
    return {
      D, P, T, wrist, k, side,
      M: new Float32Array([-side * P[0], -side * P[1], -side * P[2], 0, -D[0], -D[1], -D[2], 0, -T[0], -T[1], -T[2], 0, wrist[0], wrist[1], wrist[2], 1])
    };
  };

  Z.graspFrame = (side, C, T, P, R, k = 1, tOff = -0.006) => {
    const D = v3.cross(P, T).map(v => v * side);
    const wrist = [C[0] - (D[0] * HAND_GRASP[0] * k + P[0] * (HAND_GRASP[1] * k + R) + T[0] * tOff * k), C[1] - (D[1] * HAND_GRASP[0] * k + P[1] * (HAND_GRASP[1] * k + R) + T[1] * tOff * k), C[2] - (D[2] * HAND_GRASP[0] * k + P[2] * (HAND_GRASP[1] * k + R) + T[2] * tOff * k)];
    return Z.handBasis(side, D, P, wrist, k);
  };

  const OUTFITS = {
    shirt: { mat: 'cloth', fit: 0.004, hem: 1.05, collar: 'shirt', buttons: 1, belt: [52, 40, 30], legs: 'trousers', feet: 'shoes' },
    vatnik: { mat: 'quilt', fit: 0.024, hem: 0.89, collar: 'stand', buttons: 1, cuffs: 1, legs: 'trousers', feet: 'boots', uvV: 1.25 },
    shinel: { mat: 'cloth', fit: 0.02, skirt: 0.3, flare: 0.22, collar: 'fold', buttons: 2, belt: [70, 46, 28], epaulets: [150, 40, 36], cuffs: 1, legs: 'breeches', feet: 'tall' },
    zhupan: { mat: 'cloth', fit: 0.014, skirt: 0.46, flare: 0.25, collar: 'stand', sash: [170, 40, 40], cuffs: 1, legs: 'sharovary', feet: 'tall', boots: [118, 42, 30] },
    kozhanka: { mat: 'leather', fit: 0.013, hem: 0.92, collar: 'lapel', zip: 1, legs: 'trousers', feet: 'boots' },
    jeans: { mat: 'cloth', fit: 0.009, hem: 0.95, collar: 'shirt', buttons: 1, pockets: 1, legs: 'jeans', feet: 'shoes' },
    bronik: { mat: 'cloth', fit: 0.004, hem: 1.05, collar: 'shirt', vest: [70, 80, 60], belt: [52, 40, 30], legs: 'trousers', feet: 'boots' },
    ozk: { mat: 'rubber', fit: 0.022, hem: 0.86, hood: 1, legs: 'ozk', feet: 'rubber', gloves: [76, 82, 72] },
    labcoat: { mat: 'cloth', fit: 0.004, hem: 1.05, collar: 'shirt', coat: 0.5, under: [150, 160, 172], legs: 'trousers', feet: 'shoes' },
    dress: { mat: 'cloth', fit: 0.003, dress: 0.42, flare: 0.28, collar: 'round', sleeve: 'short', legs: 'bare', feet: 'flats' },
    telnyashka: { mat: 'stripes', fit: 0.003, hem: 1.05, collar: 'round', sleeve: 'rolled', legs: 'flares', feet: 'shoes', uvV: 3.1, raw: 1 },
    workwear: { mat: 'canvas', fit: 0.013, hem: 0.95, collar: 'shirt', pockets: 1, belt: [60, 44, 30], legs: 'trousers', feet: 'boots' },
    tracksuit: { mat: 'cloth', fit: 0.009, hem: 0.98, collar: 'stand', zip: 1, stripes: [235, 235, 230], legs: 'track', feet: 'sneakers' },
    gimn: { mat: 'cloth', fit: 0.009, hem: 0.93, collar: 'stand', buttons: 1, pockets: 1, belt: [72, 48, 28], strap: 1, epaulets: [150, 40, 36], legs: 'breeches', feet: 'tall' },
    rags: { mat: 'cloth', fit: 0.009, hem: 0.88, jag: 1, sleeve: 'torn', patches: 1, legs: 'trousers', feet: 'boots' },
    robe: { mat: 'cloth', fit: 0.013, skirt: 0.12, flare: 0.12, collar: 'stand', sash: [96, 64, 40], legs: 'trousers', feet: 'shoes' },
    bogatyr: { mat: 'robotPaint', fit: 0.05, hem: 0.86, armor: 1, legs: 'armor', feet: 'armor', gloves: [120, 130, 110] }
  };
  Z.OUTFITS = OUTFITS;

  class HumanBuilder {
    constructor(look, faceLayer) {
      this.look = look;
      this.D = Z.HUMAN_RIG;
      this.mb = new Z.SkinBuilder(this.D);
      this.fem = look.sex === 'f';
      this.bw = 1 + ((look.build === undefined ? 0.5 : look.build) - 0.5) * 0.22 + (look.bulk || 0);
      this.face = faceLayer;
      this.O = OUTFITS[look.top] || OUTFITS.shirt;
      this.sx = this.fem ? 0.172 : 0.19;
      this.skin = look.skin || SKINS[0];
      this.tc = look.topCol || [110, 100, 80];
      this.lc = look.legsCol || [60, 58, 54];
      this.bc = this.O.boots || look.boots || [40, 34, 30];
      this.R = Z.rng((look.faceSeed || 5) + 17);
    }
    side(s, name) { return (s < 0 ? 'l' : 'r') + name; }
    skinMat() {
      const mb = this.mb;
      if (this.face === undefined) { paint(mb, 'skin', this.skin); return null; }
      mb.setMat(FACE_BASE + this.face, 0, 0); mb.setTint(128, 128, 128, 255);
      return setUV(mb, SKIN_UV);
    }
    torsoRow(r, fit) {
      const bw = this.bw, bz = 1 + (bw - 1) * 0.8;
      return { c: [0, r[0], 0], rx: r[1] * bw + fit, f: r[2] * bz + fit, bk: r[3] * bz + fit, b: r[4], b2: r[5], w: r[6] || 0, y: r[0] };
    }
    torso(y0, y1, fit) {
      const rows = this.fem ? TORSO_F : TORSO_M;
      return rowsBetween(rows, y0, y1, r => this.torsoRow(r, fit), 3);
    }
    torsoAt(y, fit = 0) { return this.torso(y, y - 0.01, fit)[0]; }
    frontZ(x, y, fit) {
      const r = this.torsoAt(y, fit), q = Z.clamp(Math.abs(x) / r.rx, 0, 0.98);
      return -r.f * Math.pow(1 - Math.pow(q, 2.25), 1 / 2.25);
    }
    bodyShape(fitMul) {
      const fem = this.fem, look = this.look, belly = !fem ? Math.max(0, (look.build || 0) - 0.6) * 0.07 + (look.bulk || 0) * 0.05 : 0;
      const heavy = (this.O.fit || 0) > 0.015 ? 0.4 : 1;
      return (ph, R) => {
        let e = 0;
        const cp = Math.cos(ph);
        if (fem && cp > 0) e += 0.024 * heavy * fitMul * G2(Math.abs(ph), R.y, 0.42, 1.372, 0.36, 0.045);
        if (belly && cp > 0) e += belly * cp * G2(0, R.y, 0, 1.08, 1, 0.1);
        if (cp < 0 && !fem) e += 0.006 * G2(Math.abs(ph), R.y, 2.5, 1.39, 0.45, 0.05);
        return e;
      };
    }
    build() {
      const look = this.look;
      this.head();
      this.body();
      this.arms();
      this.legs();
      this.details();
      if (look.slag) this.slag();
      return { def: this.D, mesh: this.mb, height: 1.8 * (look.height || 1) * (look.scale || 1) };
    }

    head() {
      const mb = this.mb, fem = this.fem, look = this.look;
      const skinPost = this.skinMat();
      mb.loft([
        { c: [0, 1.648, 0.018], rx: 0.056, f: 0.05, bk: 0.056, b: 'head', b2: 'neck', w: 0.5 },
        { c: [0, 1.6, 0.013], rx: 0.06, f: 0.055, bk: 0.06, b: 'neck', b2: 'head', w: 0.15 },
        { c: [0, 1.53, 0.007], rx: 0.063, f: 0.057, bk: 0.064, b: 'neck', b2: 'chest', w: 0.3 },
        { c: [0, 1.46, 0.0], rx: 0.07, f: 0.06, bk: 0.066, b: 'chest' }
      ].map(r => fem ? Object.assign(r, { rx: r.rx * 0.84, f: r.f * 0.86, bk: r.bk * 0.86 }) : r), { sides: 12, post: skinPost || undefined });
      if (look.gasmask || look.hat === 'gasmask') return this.gasmask();
      const faceMat = this.face === undefined ? null : FACE_BASE + this.face;
      if (faceMat === null) paint(mb, 'skin', this.skin); else { mb.setMat(faceMat, 0, 0); mb.setTint(128, 128, 128, 255); }
      const NS = 44, NY = 46, v0 = mb.n, i0 = mb.idx.length;
      const phAt = i => { const t = -1 + 2 * i / NS; return Math.PI * Math.sign(t) * Math.pow(Math.abs(t), 1.3); };
      for (let j = 0; j <= NY; j++) {
        const dy = H_TOP - (H_TOP - H_BOT) * j / NY;
        for (let i = 0; i <= NS; i++) {
          const ph = phAt(i), p = headPoint(ph, dy, fem), jw = jawWeight(ph, dy), uv = uvOf(ph, dy);
          mb.weight('head', jw > 0 ? 'jaw' : null, jw);
          mb.v(p[0], p[1], p[2], 0, 1, 0, uv[0], uv[1]);
        }
      }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NS; i++) {
        const p0 = v0 + j * (NS + 1) + i, q0 = p0 + NS + 1;
        mb.idx.push(p0, p0 + 1, q0, p0 + 1, q0 + 1, q0);
      }
      mb.smoothRange(v0, i0);
      for (const s of [-1, 1]) {
        const L = headLevel(-0.004, fem), e0 = mb.n, ei = mb.idx.length;
        const c = [s * (L.w - 0.001), HC[1] - 0.006, HC[2] + 0.016];
        mb.ellipsoid('head', c, [0.009, fem ? 0.025 : 0.029, 0.016], 8, 7);
        orientOut(mb, e0, ei, c);
        for (let i = e0; i < mb.n; i++) {
          if ((mb.pos[i * 3] - c[0]) * s < 0) mb.pos[i * 3] = c[0] + (mb.pos[i * 3] - c[0]) * 0.4;
          const uv = uvAtPos(mb.pos[i * 3], mb.pos[i * 3 + 1], mb.pos[i * 3 + 2]);
          mb.uv[i * 2] = uv[0]; mb.uv[i * 2 + 1] = uv[1];
        }
        mb.smoothRange(e0, ei);
      }
      this.hair();
      this.beard();
      this.hat();
      if (look.glasses) this.glasses();
    }

    shell(o) {
      const mb = this.mb, fem = this.fem, cols = o.cols || 40, rows = o.rows || 14, v0 = mb.n, i0 = mb.idx.length;
      const a0 = o.a0 === undefined ? -Math.PI : o.a0, a1 = o.a1 === undefined ? Math.PI : o.a1;
      const grid = [];
      for (let i = 0; i <= cols; i++) {
        const ph = a0 + (a1 - a0) * i / cols;
        const top = o.top ? o.top(ph) : H_TOP, bot = o.bot(ph);
        const col = [];
        for (let j = 0; j <= rows; j++) {
          const t = j / rows, dy = Z.lerp(top, bot, t);
          const p = headPoint(ph, dy, fem), n = headNormal(ph, dy, fem), off = o.off(ph, t, dy);
          const jw = o.jaw ? jawWeight(ph, dy) : 0;
          mb.weight('head', jw > 0 ? 'jaw' : null, jw);
          const keep = !o.mask || o.mask(ph, dy, p[0] - HC[0]);
          col.push({ i: mb.v(p[0] + n[0] * off, p[1] + n[1] * off + (o.lift ? o.lift(ph, t) : 0), p[2] + n[2] * off, n[0], n[1], n[2], ph / TAU * 3, t * 1.5), keep });
        }
        grid.push(col);
      }
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const a = grid[i][j], b = grid[i + 1][j], c = grid[i][j + 1], d = grid[i + 1][j + 1];
        if (a.keep && b.keep && c.keep) mb.idx.push(a.i, b.i, c.i);
        if (b.keep && d.keep && c.keep) mb.idx.push(b.i, d.i, c.i);
      }
      mb.smoothRange(v0, i0);
      if (o.double) mb.backfaces(v0, i0);
      return v0;
    }

    hairline(kind) {
      const T = kind === 'long' || kind === 'bun'
        ? [[0, 0.072], [0.5, 0.062], [0.9, 0.034], [1.2, 0.0], [1.45, -0.02], [1.8, -0.05], [2.4, -0.075], [3.15, -0.085]]
        : [[0, 0.064], [0.45, 0.058], [0.78, 0.042], [1.18, -0.016], [1.3, 0.012], [1.45, 0.03], [1.75, 0.026], [2.0, -0.03], [2.5, -0.055], [3.15, -0.064]];
      return ph => {
        const a = Math.abs(ph);
        for (let i = 0; i + 1 < T.length; i++) if (a <= T[i + 1][0]) return Z.lerp(T[i][1], T[i + 1][1], sstep(0, 1, (a - T[i][0]) / (T[i + 1][0] - T[i][0])));
        return T[T.length - 1][1];
      };
    }

    hair() {
      const mb = this.mb, look = this.look, fem = this.fem, hair = look.hair || 'short', hat = look.hat || 'none';
      const hc = look.hairCol || [50, 40, 30];
      const tall = hat === 'ushanka' || hat === 'kaska' || hat === 'papakha' || hat === 'helmBog' || hat === 'kerchief' || this.O.hood;
      if (hair === 'chub') {
        paint(mb, 'fur', hc);
        tubeAlong(mb, [[0, 1.806, -0.012], [-0.022, 1.803, 0.026], [-0.056, 1.778, 0.046], [-0.08, 1.73, 0.034], [-0.09, 1.675, 0.006]], [0.013, 0.012, 0.01, 0.008, 0.005], { b: 'head', sides: 7 });
        return;
      }
      if (hair === 'bald') {
        if ((look.age || 0) < 0.35) return;
        paint(mb, 'fur', hc);
        const hl = this.hairline('short');
        this.shell({ top: ph => Math.abs(ph) > 1.0 ? 0.035 : hl(ph), bot: hl, off: (ph, t) => 0.002 + 0.004 * Math.sin(t * Math.PI), mask: ph => Math.abs(ph) > 1.05, rows: 6 });
        return;
      }
      const kind = fem && (hair === 'long' || hair === 'bun') ? hair : hair === 'long' ? 'long' : 'short';
      const hl = this.hairline(kind === 'short' ? 'short' : kind);
      const vol = kind === 'long' ? 0.011 : kind === 'bun' ? 0.008 : fem ? 0.009 : 0.0075;
      paint(mb, 'fur', hc);
      this.shell({ top: tall ? () => 0.025 : undefined, bot: hl, off: (ph, t) => 0.0018 + vol * Math.pow(1 - Math.pow(t, 3), 0.7) + (tall ? 0 : 0.004 * Math.max(0, Math.cos(ph)) * (1 - t)), rows: tall ? 6 : 14 });
      if (kind === 'long' && hat !== 'kerchief') {
        const end = fem ? 1.4 : 1.55, a = fem ? 1.95 : 1.75;
        const rings = [];
        for (let k = 0; k <= 6; k++) {
          const y = Z.lerp(1.735, end, k / 6), t = k / 6;
          const L = headLevel(Math.max(H_BOT, y - HC[1]), fem);
          const w = Z.lerp(L.w + 0.012, 0.09 * (fem ? 1 : 0.85), sstep(0.25, 1, t)), bk = Z.lerp(L.b + 0.012, fem ? 0.085 : 0.07, sstep(0.25, 1, t));
          rings.push({ c: [0, y, HC[2] + 0.004 + t * 0.01], rx: Math.max(w, 0.07), f: Math.max(w, 0.07), bk: Math.max(bk, 0.065), b: y > 1.6 ? 'head' : y > 1.5 ? 'neck' : 'chest', b2: y > 1.6 ? 'neck' : y > 1.5 ? 'chest' : null, w: y > 1.6 ? sstep(1.7, 1.6, y) * 0.5 : 0.3 });
        }
        mb.loft(rings, { sides: 14, arc: [Math.PI - a, Math.PI + a], double: true, jag: 9, uvU: 3 });
      }
      if (kind === 'bun') blob(mb, 'head', [0, 1.742, 0.112], [0.038, 0.034, 0.032], 9, 7);
    }

    beard() {
      const mb = this.mb, look = this.look, beard = look.beard;
      if (this.fem || !beard || beard === 'none' || beard === 'stubble') return;
      const hc = look.hairCol || [50, 40, 30];
      paint(mb, 'fur', hc.map(v => v * 0.92));
      if (beard === 'full') {
        this.shell({
          a0: -1.62, a1: 1.62, cols: 34, rows: 16, jaw: true,
          top: ph => Math.abs(ph) > 1.1 ? 0.004 : Z.lerp(-0.046, 0.004, sstep(0.45, 1.1, Math.abs(ph))), bot: () => H_BOT,
          off: (ph, t, dy) => 0.004 + 0.006 * t + 0.016 * G2(0, dy, 0, -0.112, 1, 0.025) * Math.max(0, Math.cos(ph)),
          mask: (ph, dy, x) => !(Math.abs(x) < 0.025 && dy > -0.074 && dy < -0.051) && !(Math.abs(x) < 0.012 && dy > -0.05)
        });
      }
      if (beard === 'mustache' || beard === 'full' || beard === 'cossack') {
        const wide = beard === 'cossack' ? 0.034 : 0.029;
        this.shell({ a0: -0.62, a1: 0.62, cols: 18, rows: 4, top: () => -0.043, bot: () => -0.0535, off: (ph, t) => 0.0045 + 0.0015 * Math.sin(t * Math.PI), mask: (ph, dy, x) => Math.abs(x) < wide });
      }
      if (beard === 'cossack') {
        for (const s of [-1, 1]) {
          const p0 = headPoint(s * 0.3, -0.05, false), p1 = headPoint(s * 0.42, -0.08, false), p2 = headPoint(s * 0.45, -0.105, false);
          tubeAlong(mb, [[p0[0], p0[1], p0[2] - 0.005], [p1[0] + s * 0.004, p1[1], p1[2] - 0.006], [p2[0] + s * 0.004, p2[1], p2[2] - 0.004]], [0.0055, 0.004, 0.0022], { b: 'head', sides: 6 });
        }
      }
    }

    hat() {
      const mb = this.mb, look = this.look, hat = look.hat || 'none', fem = this.fem;
      const hcol = look.hatCol;
      if (this.O.hood) {
        paint(mb, 'rubber', this.tc);
        this.shell({ bot: ph => Math.abs(ph) < 0.75 ? 0.05 : H_BOT, off: (ph, t) => 0.014 + 0.006 * t, rows: 16, double: true });
        return;
      }
      if (hat === 'kepka') {
        const col = hcol || [70, 70, 74];
        paint(mb, 'cloth', col);
        const band = ph => Z.lerp(0.05, 0.034, sstep(0, Math.PI, Math.abs(ph)));
        this.shell({ bot: band, off: (ph, t) => 0.011 + 0.012 * Math.max(0, Math.cos(ph)) * Math.sin(t * Math.PI * 0.9) + 0.006 * (1 - t), rows: 10, lift: (ph, t) => 0.006 * (1 - t) * Math.max(0, Math.cos(ph)) });
        this.brim(-1.05, 1.05, band, 0.012, 0.046, -0.012, col, 'cloth');
      } else if (hat === 'ushanka') {
        const col = hcol || [80, 70, 60];
        paint(mb, 'fur', col);
        this.shell({ bot: () => 0.018, off: (ph, t) => 0.016 + 0.014 * t + 0.006 * (1 - t), rows: 10, lift: (ph, t) => 0.008 * (1 - t) });
        this.shell({ a0: -0.95, a1: 0.95, cols: 16, rows: 3, top: () => 0.075, bot: () => 0.018, off: () => 0.036, double: true });
        for (const s of [-1, 1]) blob(mb, 'head', [s * 0.06, 1.81, 0.015], [0.03, 0.022, 0.05], 8, 6);
      } else if (hat === 'kaska') {
        const col = hcol || [90, 104, 70];
        paint(mb, 'metalGrey', col);
        this.shell({ bot: () => 0.02, off: (ph, t) => 0.017 + 0.003 * (1 - t) + 0.016 * Math.pow(t, 4), rows: 10, lift: (ph, t) => -0.006 * Math.pow(t, 3), double: true });
        paint(mb, 'leather', [40, 34, 28]);
        for (const s of [-1, 1]) {
          const a = headPoint(s * 1.5, 0.012, fem), b = headPoint(s * 1.25, -0.06, fem), c = headPoint(s * 0.6, -0.115, fem);
          tubeAlong(mb, [[a[0] + s * 0.016, a[1], a[2]], [b[0] + s * 0.006, b[1], b[2]], [c[0], c[1] - 0.006, c[2] - 0.004], [0, HC[1] - 0.124, HC[2] - 0.05]], [0.003], { b: 'head', sides: 4, capB: false });
        }
      } else if (hat === 'furazhka') {
        const col = hcol || [80, 90, 70];
        const ring = (dy, add) => { const L = headLevel(dy, fem); return { c: [0, HC[1] + dy, HC[2]], rx: L.w + add, f: L.f + add, bk: L.b + add, b: 'head' }; };
        paint(mb, 'paintRed', [200, 50, 40]);
        mb.loft([ring(0.06, 0.014), ring(0.038, 0.014)], { sides: 20 });
        paint(mb, 'cloth', col);
        const top = (dy, add) => { const r = ring(0.062, add); r.c = [0, HC[1] + dy, HC[2] - 0.006]; return r; };
        mb.loft([top(0.059, 0.013), top(0.074, 0.015), top(0.086, 0.04), top(0.097, 0.042), top(0.104, 0.03)], { sides: 22, capB: true });
        this.brim(-0.95, 0.95, () => 0.04, 0.016, 0.05, -0.016, [24, 24, 26], 'leather');
        paint(mb, 'metalGrey', [220, 180, 80]);
        const cp = headPoint(0, 0.05, fem);
        blob(mb, 'head', [0, cp[1], cp[2] - 0.016], [0.008, 0.008, 0.004], 6, 4);
      } else if (hat === 'papakha') {
        const col = hcol || [40, 34, 30];
        const ring = (dy, add) => { const L = headLevel(0.03, fem); return { c: [0, HC[1] + dy, HC[2] - 0.004], rx: L.w + add, f: L.f + add, bk: L.b + add, b: 'head' }; };
        paint(mb, 'fur', col);
        mb.loft([ring(0.168, 0.03), ring(0.12, 0.034), ring(0.07, 0.03), ring(0.026, 0.02)], { sides: 22 });
        paint(mb, 'cloth', [170, 40, 40]);
        mb.loft([ring(0.164, 0.024), ring(0.162, 0.0)], { sides: 22, capB: true });
      } else if (hat === 'kerchief') {
        const col = hcol || [170, 60, 50];
        paint(mb, 'cloth', col);
        this.shell({ bot: ph => { const a = Math.abs(ph); return a < 0.85 ? Z.lerp(0.074, 0.03, sstep(0, 0.85, a)) : Z.lerp(-0.03, -0.11, sstep(0.85, 2.4, a)); }, off: (ph, t) => 0.009 + 0.005 * t, rows: 14, double: true });
        blob(mb, 'head', [0, HC[1] - 0.123, HC[2] - 0.035], [0.018, 0.012, 0.014], 6, 5);
      } else if (hat === 'helmBog') {
        paint(mb, 'robotPaint', [120, 130, 110]);
        blob(mb, 'head', [0, 1.71, 0.0], [0.13, 0.15, 0.15], 14, 10);
        paint(mb, 'glow', [255, 170, 80]);
        mb.boneBox('head', 0, 1.735, -0.142, 0.14, 0.035, 0.03);
      }
    }

    brim(a0, a1, band, inset, out, drop, col, mat) {
      const mb = this.mb, fem = this.fem, v0 = mb.n, i0 = mb.idx.length, n = 14;
      paint(mb, mat, col);
      mb.useBone('head');
      for (let i = 0; i <= n; i++) {
        const ph = a0 + (a1 - a0) * i / n, dy = band(ph), p = headPoint(ph, dy, fem), nn = headNormal(ph, dy, fem);
        const hx = Math.sin(ph), hz = -Math.cos(ph), L = Math.hypot(hx, hz) || 1;
        const k = Math.pow(Math.cos(ph * 0.5 * Math.PI / Math.max(Math.abs(a0), Math.abs(a1))), 0.6);
        const ix = p[0] + nn[0] * inset, iz = p[2] + nn[2] * inset;
        mb.v(ix, p[1], iz, 0, 1, 0, i / n, 0);
        mb.v(ix + hx / L * out * k, p[1] + drop * k, iz + hz / L * out * k, 0, 1, 0, i / n, 1);
      }
      for (let i = 0; i < n; i++) { const a = v0 + i * 2; mb.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      orientOut(mb, v0, i0, [HC[0], HC[1] - 0.5, HC[2]]);
      mb.smoothRange(v0, i0);
      mb.backfaces(v0, i0);
    }

    glasses() {
      const mb = this.mb, fem = this.fem;
      paint(mb, 'bakelite', [40, 28, 20]);
      const pts = s => {
        const out = [];
        for (let k = 0; k <= 12; k++) {
          const a = k / 12 * TAU, x = s * 0.033 + Math.cos(a) * 0.0175, dy = 0.004 + Math.sin(a) * 0.013;
          const L = headLevel(dy, fem);
          out.push([x, HC[1] + dy, HC[2] - (L.f * Math.pow(1 - Math.pow(Math.min(0.95, Math.abs(x) / L.w), SE), 1 / SE)) - 0.011]);
        }
        return out;
      };
      for (const s of [-1, 1]) {
        tubeAlong(mb, pts(s), [0.0022], { b: 'head', sides: 4, capB: false });
        const L = headLevel(0.008, fem), o = pts(s)[0];
        tubeAlong(mb, [o, [s * (L.w + 0.004), HC[1] + 0.009, HC[2] - 0.03], [s * (L.w + 0.006), HC[1] + 0.006, HC[2] + 0.03]], [0.0018], { b: 'head', sides: 4 });
      }
      const a = pts(-1)[6], b = pts(1)[6];
      tubeAlong(mb, [a, [0, HC[1] + 0.012, a[2] - 0.004], b], [0.002], { b: 'head', sides: 4 });
    }

    gasmask() {
      const mb = this.mb, look = this.look, fem = this.fem;
      paint(mb, 'rubber', look.maskCol || [96, 102, 92]);
      this.shell({ bot: () => H_BOT, off: (ph, t) => 0.007 + 0.004 * Math.max(0, Math.cos(ph)) * Math.sin(t * Math.PI), rows: 20, cols: 40 });
      for (const s of [-1, 1]) {
        const p = headPoint(s * 0.4, 0.004, fem), n = headNormal(s * 0.4, 0.004, fem);
        const q = [p[0] + n[0] * 0.02, p[1] + n[1] * 0.02, p[2] + n[2] * 0.02];
        paint(mb, 'metalGrey', [80, 84, 80]);
        tubeAlong(mb, [p, q], [0.023, 0.022], { b: 'head', sides: 12, capB: false });
        paint(mb, 'glass', [150, 160, 160]);
        tubeAlong(mb, [p, [q[0] - n[0] * 0.003, q[1] - n[1] * 0.003, q[2] - n[2] * 0.003]], [0.019], { b: 'head', sides: 12 });
      }
      const m = headPoint(0, -0.07, fem);
      paint(mb, 'metalGrey', [70, 74, 70]);
      const c0 = [m[0], m[1], m[2] - 0.01], c1 = [m[0], m[1] - 0.02, m[2] - 0.045];
      tubeAlong(mb, [c0, c1], [0.024, 0.026], { b: 'head', sides: 10 });
      if (look.gasmask === 'hose') {
        paint(mb, 'rubber', [80, 84, 78]);
        const zc = this.frontZ(0.05, 1.3, this.O.fit || 0) - 0.04;
        const pts = [], radii = [], bones = [];
        for (let k = 0; k <= 10; k++) {
          const t = k / 10;
          pts.push([Z.lerp(c1[0], 0.05, t) + Math.sin(t * Math.PI) * 0.03, Z.lerp(c1[1], 1.36, t), Z.lerp(c1[2], zc, t) - Math.sin(t * Math.PI) * 0.03]);
          radii.push(k % 2 ? 0.016 : 0.019);
          bones.push(t < 0.3 ? ['head'] : t < 0.6 ? ['neck', 'head', 0.3] : ['chest', 'neck', 0.3]);
        }
        tubeAlong(mb, pts, radii, { bones, sides: 8 });
        paint(mb, 'paintGreen', [80, 96, 70]);
        tubeAlong(mb, [[0.05, 1.37, zc], [0.05, 1.2, zc]], [0.052, 0.052], { b: 'chest', sides: 12, capA: true });
      } else {
        paint(mb, 'paintGreen', [86, 100, 76]);
        tubeAlong(mb, [c1, [c1[0], c1[1] - 0.03, c1[2] - 0.07]], [0.04, 0.04], { b: 'head', sides: 12, capA: true });
      }
    }

    body() {
      const mb = this.mb, O = this.O, look = this.look;
      const fit = O.fit || 0, tc = this.tc, lc = this.lc;
      const topMat = O.mat || 'cloth';
      const topTint = O.raw ? [200, 200, 200] : tc;
      const shape = this.bodyShape(1);
      const legMat = O.legs === 'ozk' ? 'rubber' : O.legs === 'armor' ? 'robotPaint' : 'cloth';
      if (O.legs === 'bare') { paint(mb, 'cloth', tc); }
      else paint(mb, legMat, O.legs === 'armor' ? tc : lc);
      mb.loft(this.torso(1.07, 0.812, 0.006 + (O.legs === 'armor' ? 0.03 : 0)), { sides: 18, capB: true, n: 2.2, shape });
      if (O.coat) {
        paint(mb, 'cloth', O.under);
        mb.loft(this.torso(1.505, 1.03, fit), { sides: 20, n: 2.25, shape });
        paint(mb, topMat, topTint);
        mb.loft(this.torso(1.47, 1.03, fit + 0.012), { sides: 20, n: 2.25, shape: this.bodyShape(0.6), arc: [0.3, TAU - 0.3], double: true });
        this.skirt(O.coat, 0.18, topMat, topTint, fit + 0.012, [0.3, TAU - 0.3]);
      } else {
        paint(mb, topMat, topTint);
        const hem = O.skirt ? 1.03 : O.dress ? 1.03 : (O.hem || 1.05);
        const rings = this.torso(1.505, hem, fit);
        rings[rings.length - 1].extra = O.dress || O.skirt ? 0 : 0.008;
        mb.loft(rings, { sides: 20, n: 2.25, uvV: O.uvV || 2, shape: (ph, R, k) => shape(ph, R, k) + (R.extra || 0), jag: O.jag ? 13 : 0 });
        if (O.skirt) this.skirt(O.skirt, O.flare, topMat, topTint, fit);
        if (O.dress) this.skirt(O.dress, O.flare, topMat, topTint, fit);
      }
    }

    skirt(hemY, flare, mat, tint, fit, arc) {
      const mb = this.mb, bw = this.bw;
      const ys = [1.07, 1.0, 0.93, 0.86];
      for (let y = 0.78; y > hemY + 0.02; y -= 0.08) ys.push(y);
      ys.push(hemY);
      const rings = ys.map(y => {
        if (y >= 0.86) { const r = this.torsoAt(y, fit + 0.006); return Object.assign(r, { extra: 0 }); }
        const d = 0.86 - y;
        return { c: [0, y, 0.004], rx: 0.192 * bw + fit + d * flare, f: 0.13 * bw + fit + d * flare * 0.8, bk: 0.142 * bw + fit + d * flare * 0.95, b: 'hips', y };
      });
      paint(mb, mat, tint);
      const D = this.D;
      mb.loft(rings, {
        sides: 22, n: 2.1, arc, double: !!arc, jag: this.O.jag ? 21 : 0,
        post: (v0, v1) => {
          for (let i = v0; i < v1; i++) {
            const y = mb.pos[i * 3 + 1], x = mb.pos[i * 3];
            if (y > 0.95) continue;
            const w = Z.clamp((0.95 - y) / 0.45, 0, 1) * 0.62 * sstep(0, 0.07, Math.abs(x));
            if (w <= 0) continue;
            mb.mat[i * 4 + 1] = D.index[x < 0 ? 'lthigh' : 'rthigh'];
            mb.mat[i * 4 + 2] = Math.round(w * 255);
          }
        }
      });
    }

    armRings(s, y0, y1, off) {
      const k = this.fem ? 0.86 : 1, bw = 1 + (this.bw - 1) * 0.7, sx = this.sx;
      return rowsBetween(ARM, y0, y1, r => {
        const rad = r[2] * k * bw, y = r[0];
        const wrist = sstep(1.04, 0.95, y);
        return { c: [s * (sx + r[1] * k), y, 0], rx: rad * Z.lerp(0.93, 0.76, wrist) + off, f: rad * Z.lerp(1.04, 1.18, wrist) + off, bk: rad * Z.lerp(1.04, 1.12, wrist) + off, b: r[3] === 'chest' ? 'chest' : this.side(s, r[3]), b2: r[4] ? (r[4] === 'chest' ? 'chest' : this.side(s, r[4])) : null, w: r[5] || 0, y };
      }, 2);
    }

    arms() {
      const mb = this.mb, O = this.O;
      const fit = O.fit || 0, tc = O.coat ? this.tc : (O.raw ? [200, 200, 200] : this.tc);
      const sleeve = O.sleeve || 'long';
      const end = sleeve === 'short' ? 1.3 : sleeve === 'rolled' ? 1.1 : sleeve === 'torn' ? 1.2 : 0.955;
      for (const s of [-1, 1]) {
        paint(mb, O.mat || 'cloth', tc);
        const rings = this.armRings(s, 1.47, end, fit * 0.85 + 0.004);
        if (O.cuffs || sleeve === 'rolled') rings[rings.length - 1].extra = 0.006;
        mb.loft(rings, { sides: 12, uvV: O.uvV || 2, shape: (ph, R) => R.extra || 0, jag: sleeve === 'torn' ? 5 + s : 0 });
        if (O.gloves) {
          paint(mb, O.armor ? 'robotPaint' : 'rubber', O.gloves);
          mb.loft(this.armRings(s, end + 0.03, 0.926, 0.004), { sides: 12 });
          this.hand(s, O.armor ? 'robotPaint' : 'rubber', O.gloves);
        } else {
          const post = this.skinMat();
          mb.loft(this.armRings(s, end + 0.025, 0.926, 0), { sides: 12, post: post || undefined });
          this.hand(s);
        }
      }
    }

    hand(s, mat, tint) {
      const post = mat ? (paint(this.mb, mat, tint), null) : this.skinMat();
      Z.buildHand(this.mb, {
        side: s, k: this.fem ? 0.76 : 0.82, at: [s * this.sx, 0.935, 0], sides: 6, post: post || undefined,
        bones: { hand: this.side(s, 'hand'), farm: this.side(s, 'farm'), fing: this.side(s, 'fing'), tip: this.side(s, 'tip'), thumb: this.side(s, 'thumb') }
      });
    }

    legR(type, y, r) {
      if (type === 'bare') return r * 0.93;
      if (type === 'jeans') return r + 0.006;
      if (type === 'track') return r + 0.009;
      if (type === 'sharovary') return y > 0.42 ? r * 1.55 + 0.01 : r + 0.01;
      if (type === 'breeches') return r + 0.008 + 0.034 * G2(0, y, 0, 0.74, 1, 0.08);
      if (type === 'flares') return Math.max(r + 0.01, y < 0.5 ? Z.lerp(0.075, 0.055, (y - 0.1) / 0.4) : 0);
      if (type === 'ozk') return r + 0.02;
      if (type === 'armor') return r + 0.03;
      return Math.max(r + 0.01, y < 0.5 ? 0.05 : 0);
    }

    legRings(s, y0, y1, type, off) {
      const fem = this.fem, bw = 1 + (this.bw - 1) * 0.8, X = (fem ? 0.1 : 0.095) * s;
      return rowsBetween(LEG, y0, y1, r => {
        const y = r[0], rad = this.legR(type, y, r[2] * bw * (fem ? 0.97 : 1)) + off;
        const calf = G2(0, y, 0, 0.37, 1, 0.08);
        return { c: [X * r[1], y, 0.004 * calf], rx: rad * 0.98, f: rad * Z.lerp(1.02, 0.92, calf), bk: rad * Z.lerp(1.08, 1.14, calf), b: this.side(s, r[3]), b2: r[4] ? (r[4] === 'hips' ? 'hips' : this.side(s, r[4])) : null, w: r[5] || 0, y };
      }, 2);
    }

    legs() {
      const mb = this.mb, O = this.O, type = O.legs || 'trousers', feet = O.feet || 'shoes';
      const tall = feet === 'tall' || feet === 'rubber' || feet === 'armor';
      const end = type === 'bare' ? 0.095 : tall ? 0.38 : feet === 'boots' ? 0.135 : 0.105;
      for (const s of [-1, 1]) {
        let post = null;
        if (type === 'bare') post = this.skinMat();
        else paint(mb, type === 'ozk' ? 'rubber' : type === 'armor' ? 'robotPaint' : 'cloth', type === 'armor' ? this.tc : this.lc);
        const rings = this.legRings(s, 0.985, end, type, 0);
        if (!tall && type !== 'bare') rings[rings.length - 1].extra = feet === 'boots' ? 0.012 : 0.004;
        mb.loft(rings, { sides: 12, shape: (ph, R) => R.extra || 0, post: post || undefined, jag: this.O.jag ? 31 + s : 0 });
        if (O.stripes) {
          paint(mb, 'cloth', O.stripes);
          mb.loft(this.legRings(s, 0.95, end + 0.01, type, 0.003), { sides: 4, arc: s > 0 ? [Math.PI / 2 - 0.16, Math.PI / 2 + 0.16] : [-Math.PI / 2 - 0.16, -Math.PI / 2 + 0.16] });
        }
        this.boot(s, feet, tall);
      }
    }

    boot(s, feet, tall) {
      const mb = this.mb, X = (this.fem ? 0.1 : 0.095) * s, bw = 1 + (this.bw - 1) * 0.5;
      const mat = feet === 'rubber' ? 'rubber' : feet === 'armor' ? 'robotPaint' : feet === 'sneakers' ? 'cloth' : 'leather';
      const col = feet === 'rubber' ? this.tc : feet === 'armor' ? this.tc : feet === 'sneakers' ? [200, 200, 192] : feet === 'flats' ? (this.look.boots || [60, 30, 26]) : this.bc;
      paint(mb, mat, col);
      const shin = this.side(s, 'shin'), foot = this.side(s, 'foot');
      const big = feet === 'armor' ? 0.018 : 0;
      if (tall) {
        const R = (y, r) => ({ c: [X, y, 0.003], rx: r * bw + big, f: r * bw * 0.98 + big, bk: r * bw * 1.08 + big, b: shin, b2: y < 0.15 ? foot : null, w: y < 0.15 ? 0.3 : 0 });
        mb.loft([R(0.445, 0.063), R(0.4, 0.06), R(0.33, 0.058), R(0.25, 0.049), R(0.17, 0.044), R(0.1, 0.043)], { sides: 12 });
      } else if (feet === 'boots') {
        const R = (y, r) => ({ c: [X, y, 0.004], rx: r, f: r, bk: r * 1.05, b: shin, b2: foot, w: y < 0.14 ? 0.45 : 0.15 });
        mb.loft([R(0.175, 0.047), R(0.13, 0.044), R(0.095, 0.043)], { sides: 12 });
      }
      const flat = feet === 'flats', k = flat ? 0.82 : feet === 'sneakers' ? 1.04 : 1;
      const rings = FOOT.map((f, i) => ({ c: [X, f[1] * (flat ? 0.78 : 1), f[0] * (flat ? 0.95 : 1)], rx: f[3] * k * (flat && i > 3 ? 0.8 : 1) + big, f: f[2] * (flat ? 0.72 : 1) + big, bk: f[1] * (flat ? 0.78 : 1) - 0.004, b: foot, b2: i < 2 ? shin : null, w: i < 2 ? 0.25 : 0 }));
      mb.loft(rings, { sides: 12, U: [0, 1, 0], V: [1, 0, 0], n: 2.6, capA: true, capB: true, post: (v0, v1) => { for (let i = v0; i < v1; i++) if (mb.pos[i * 3 + 1] < 0.003) mb.pos[i * 3 + 1] = 0.003; } });
      if (feet === 'sneakers' || feet === 'boots' || tall) {
        paint(mb, 'rubber', feet === 'sneakers' ? [230, 228, 220] : [34, 30, 28]);
        mb.loft(FOOT.map((f, i) => ({ c: [X, 0.012, f[0] + (i === 0 ? 0.004 : i === FOOT.length - 1 ? -0.006 : 0)], rx: f[3] * k + 0.003 + big, f: 0.012, bk: 0.009, b: foot })), { sides: 12, U: [0, 1, 0], V: [1, 0, 0], n: 3, capA: true, capB: true });
      }
    }

    details() {
      const mb = this.mb, O = this.O, fit = O.fit || 0, tc = this.tc;
      const dark = tc.map(v => v * 0.72);
      if (O.collar) this.collar(O.collar, O.coat ? O.under : (O.raw ? [210, 210, 210] : tc), O.coat ? 'cloth' : (O.mat === 'stripes' ? 'cloth' : O.mat || 'cloth'), fit);
      if (O.coat) {
        paint(mb, 'cloth', tc);
        mb.loft([{ c: [0, 1.5, 0.004], rx: 0.075, f: 0.068, bk: 0.072, b: 'chest', b2: 'neck', w: 0.3 }, { c: [0, 1.465, 0.0], rx: 0.13, f: 0.112, bk: 0.11, b: 'chest' }, { c: [0, 1.44, 0], rx: 0.16, f: 0.118, bk: 0.112, b: 'chest' }].map(r => Object.assign(r, { rx: r.rx * this.bw + fit + 0.014, f: r.f + fit + 0.014, bk: r.bk + fit + 0.014 })), { sides: 18, arc: [0.5, TAU - 0.5], double: true });
        paint(mb, 'cloth', [200, 200, 205]);
        for (const s of [-1, 1]) mb.boneBox('chest', s * 0.085, 1.39, this.frontZ(0.085, 1.37, fit + 0.012) - 0.004, 0.05, 0.05, 0.006);
      }
      if (O.buttons) {
        const brass = O.buttons === 2 || O.epaulets ? [200, 168, 90] : dark;
        paint(mb, O.buttons === 2 || O.epaulets ? 'metalGrey' : 'leather', brass);
        const xs = O.buttons === 2 ? [-0.05, 0.05] : [0];
        const bottom = O.skirt ? 1.08 : (O.hem || 1.05) + 0.04;
        for (const x of xs) for (let y = 1.43; y > bottom; y -= 0.07) {
          const z = this.frontZ(x, y, fit) - 0.003;
          blob(mb, y > 1.25 ? 'chest' : 'spine', [x, y, z], [0.0065, 0.0065, 0.004], 6, 4);
        }
      }
      if (O.belt) {
        paint(mb, 'leather', O.belt);
        const by = O.skirt ? 1.05 : (O.hem || 1.05) > 1.0 ? 1.06 : 1.07;
        mb.loft(this.torso(by + 0.022, by - 0.018, fit + (O.skirt ? 0.008 : 0.004)), { sides: 20, n: 2.25 });
        paint(mb, 'metalGrey', [190, 170, 110]);
        mb.boneBox('hips', 0, by + 0.019, this.frontZ(0, by, fit) - 0.009, 0.045, 0.036, 0.008);
      }
      if (O.sash) {
        paint(mb, 'cloth', O.sash);
        mb.loft(this.torso(1.13, 0.99, fit + 0.01), { sides: 20, n: 2.25 });
        for (const dz of [-0.03, 0.0]) mb.boneBox('hips', -0.15 * this.bw - fit, 1.0, dz, 0.012, 0.2, 0.05);
      }
      if (O.pockets) {
        paint(mb, O.mat === 'canvas' ? 'canvas' : 'cloth', tc.map(v => v * 0.88));
        for (const s of [-1, 1]) mb.boneBox('chest', s * 0.075, 1.4, this.frontZ(0.075, 1.37, fit) - 0.002, 0.058, 0.062, 0.008);
      }
      if (O.epaulets) {
        paint(mb, 'cloth', O.epaulets);
        for (const s of [-1, 1]) mb.boneBox('chest', s * 0.125 * this.bw, 1.486 + fit, 0, 0.1, 0.008, 0.05);
      }
      if (O.zip) {
        paint(mb, 'metalGrey', [150, 150, 150]);
        const pts = [];
        for (let y = 1.48; y >= (O.hem || 1.0) + 0.01; y -= 0.06) pts.push([0, y, this.frontZ(0, y, fit) - 0.0025]);
        tubeAlong(mb, pts, [0.0032], { bones: pts.map(p => [p[1] > 1.25 ? 'chest' : 'spine']), sides: 4 });
      }
      if (O.strap) {
        paint(mb, 'leather', O.belt || [72, 48, 28]);
        const pts = [];
        for (let k = 0; k <= 8; k++) { const t = k / 8, x = Z.lerp(0.13, -0.12, t), y = Z.lerp(1.47, 1.07, t); pts.push([x, y, this.frontZ(x, y, fit) - 0.004]); }
        tubeAlong(mb, pts, [0.009], { bones: pts.map(p => [p[1] > 1.25 ? 'chest' : 'spine']), sides: 4, loft: { n: 6 } });
      }
      if (O.stripes) {
        paint(mb, 'cloth', O.stripes);
        for (const s of [-1, 1]) mb.loft(this.armRings(s, 1.43, 0.97, fit * 0.85 + 0.007), { sides: 4, arc: s > 0 ? [Math.PI / 2 - 0.2, Math.PI / 2 + 0.2] : [-Math.PI / 2 - 0.2, -Math.PI / 2 + 0.2] });
      }
      if (O.vest) {
        paint(mb, 'cloth', O.vest);
        mb.loft(this.torso(1.475, 1.0, fit + 0.026), { sides: 20, n: 2.4, shape: this.bodyShape(0.3) });
        paint(mb, 'cloth', O.vest.map(v => v * 1.15));
        mb.boneBox('chest', 0, 1.42, this.frontZ(0, 1.3, fit + 0.026) - 0.006, 0.2, 0.22, 0.012);
      }
      if (O.patches) {
        for (let i = 0; i < 4; i++) {
          const R = this.R, x = (R() - 0.5) * 0.2, y = 0.98 + R() * 0.4;
          paint(mb, 'cloth', tc.map(v => v * (0.7 + R() * 0.5)));
          mb.boneBox(y > 1.25 ? 'chest' : 'spine', x, y, this.frontZ(x, y, fit) - 0.002, 0.04 + R() * 0.03, 0.04 + R() * 0.03, 0.005);
        }
      }
      if (O.armor) this.armor();
    }

    collar(kind, col, mat, fit) {
      const mb = this.mb, bw = this.bw, fem = this.fem;
      const R = (y, rx, f, bk, z = 0.004) => ({ c: [0, y, z], rx: rx * (fem ? 0.88 : 1) * Math.sqrt(bw) + fit, f: f * (fem ? 0.88 : 1) + fit, bk: bk * (fem ? 0.88 : 1) + fit, b: 'chest', b2: 'neck', w: y > 1.49 ? 0.4 : 0.15 });
      paint(mb, mat, col);
      if (kind === 'shirt') mb.loft([R(1.468, 0.074, 0.066, 0.07), R(1.51, 0.068, 0.06, 0.066, 0.008), R(1.488, 0.09, 0.08, 0.084, 0.008)], { sides: 16, arc: [0.34, TAU - 0.34], double: true });
      else if (kind === 'stand') mb.loft([R(1.47, 0.074, 0.066, 0.07), R(1.528, 0.068, 0.06, 0.066, 0.009)], { sides: 16, arc: [0.12, TAU - 0.12], double: true });
      else if (kind === 'fold') mb.loft([R(1.512, 0.07, 0.064, 0.068, 0.008), R(1.472, 0.13, 0.112, 0.11), R(1.446, 0.162, 0.12, 0.114)], { sides: 18, arc: [0.42, TAU - 0.42], double: true });
      else if (kind === 'lapel') {
        mb.loft([R(1.512, 0.07, 0.064, 0.068, 0.008), R(1.472, 0.13, 0.112, 0.11), R(1.446, 0.162, 0.12, 0.114)], { sides: 18, arc: [0.36, TAU - 0.36], double: true });
        for (const s of [-1, 1]) {
          const rings = this.torso(1.44, 1.3, fit + 0.005);
          mb.loft(rings, { sides: 3, arc: s > 0 ? [0.08, 0.5] : [-0.5, -0.08], n: 2.25, double: true, post: (v0, v1) => { for (let i = v0; i < v1; i++) { const y = mb.pos[i * 3 + 1], x = mb.pos[i * 3]; const lim = Z.lerp(0.02, 0.085, (y - 1.3) / 0.14); if (Math.abs(x) > lim) mb.pos[i * 3] = Math.sign(x) * lim; } } });
        }
      } else if (kind === 'round') mb.loft([R(1.47, 0.08, 0.072, 0.074), R(1.476, 0.076, 0.068, 0.07)], { sides: 16, double: true });
    }

    armor() {
      const mb = this.mb, tc = this.tc;
      paint(mb, 'robotPaint', tc);
      mb.boneBox('chest', 0, 1.47, this.frontZ(0, 1.32, 0.05) - 0.02, 0.3, 0.3, 0.06);
      for (const s of [-1, 1]) blob(mb, this.side(s, 'uarm'), [s * 0.215, 1.47, 0], [0.105, 0.075, 0.105], 10, 7);
      paint(mb, 'rust', [110, 90, 70]);
      mb.boneBox('chest', 0, 1.44, 0.17, 0.3, 0.32, 0.12);
      paint(mb, 'metalGrey', [70, 74, 72]);
      for (const x of [-0.08, 0.08]) tubeAlong(mb, [[x, 1.45, 0.24], [x, 1.62, 0.24]], [0.025], { b: 'chest', sides: 8 });
    }

    slag() {
      const mb = this.mb, R = Z.rng((this.look.faceSeed || 3) + 101), fit = this.O.fit || 0;
      mb.setMat(M('slag'), 0, 0); mb.setTint(128, 128, 128, 255);
      for (let i = 0; i < 9; i++) {
        const y = 1.12 + R() * 0.34, x = (R() - 0.5) * 0.3, front = R() < 0.6;
        const z = front ? this.frontZ(x, y, fit) + 0.01 : -this.frontZ(x, y, fit) - 0.01;
        blob(mb, y > 1.25 ? 'chest' : 'spine', [x, y, z], [0.05 + R() * 0.04, 0.04 + R() * 0.03, 0.035], 7, 5);
      }
      for (const s of [-1, 1]) blob(mb, this.side(s, 'farm'), [s * this.sx, 1.06, -0.01], [0.05, 0.06, 0.05], 7, 5);
      blob(mb, 'chest', [0.17, 1.47, 0], [0.07, 0.05, 0.07], 7, 5);
    }
  }

  const APPAREL_LOOK = {
    vatnik: { top: 'vatnik', topCol: [62, 64, 66] }, workwear: { top: 'workwear', topCol: [104, 92, 70] }, gimn: { top: 'gimn', topCol: [112, 114, 82] },
    shinel: { top: 'shinel', topCol: [92, 96, 76] }, zhupan: { top: 'zhupan', topCol: [44, 62, 140] }, kozhanka: { top: 'kozhanka', topCol: [32, 28, 26] },
    jeans: { top: 'jeans', topCol: [64, 92, 150], legsCol: [52, 72, 122] }, bronik: { top: 'bronik', topCol: [120, 112, 92] }, ozk: { top: 'ozk', topCol: [84, 96, 74] },
    labcoat: { top: 'labcoat', topCol: [226, 226, 220] }, bogatyr: { top: 'bogatyr', topCol: [120, 130, 110] }, dress: { top: 'dress', topCol: [150, 80, 70] },
    telnyashka: { top: 'telnyashka', legsCol: [30, 34, 60] }, ushanka: { hat: 'ushanka', hatCol: [84, 72, 60] }, kepka: { hat: 'kepka', hatCol: [72, 72, 76] },
    kaska: { hat: 'kaska', hatCol: [88, 102, 70] }, furazhka: { hat: 'furazhka', hatCol: [86, 94, 72] }, papakha: { hat: 'papakha', hatCol: [42, 36, 32] },
    gasmask: { gasmask: true }, helmBog: { hat: 'helmBog' }, glasses: { glasses: true }
  };
  Z.dressedLook = a => {
    if (!a.look) return null;
    const ids = ['body', 'head', 'eyes'].map(k => a.equip && a.equip[k] ? a.equip[k].id : '').join('|');
    if (a._dress && a._dress.ids === ids && a._dress.base === a.look) return a._dress.look;
    const L = Object.assign({}, a.look);
    for (const k of ['body', 'head', 'eyes']) {
      const e = a.equip && a.equip[k], d = e && Z.item(e.id);
      if (d && APPAREL_LOOK[d.model]) Object.assign(L, APPAREL_LOOK[d.model]);
    }
    a._dress = { ids, base: a.look, look: L };
    return L;
  };

  Z.Models = {
    human(look, faceLayer) { return new HumanBuilder(look, faceLayer).build(); }
  };
  Z.MODEL_KIT = { paint, tubeAlong, blob, orientOut };
  Z.FACE_BASE = FACE_BASE;
  Z.SKIN_UV = SKIN_UV;
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
