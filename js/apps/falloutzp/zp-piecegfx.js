(function (Z) {
  'use strict';

  const M = k => Z.MAT[k];
  const M4 = Z.M4;
  const SIGN_LAYER0 = 40;
  const SIGN_SHEETS = 8;

  const T = (mb, c) => mb.setTint(c[0], c[1], c[2], 255);
  const use = (mb, mat, tint) => { mb.setMat(M(mat), 0, 0); T(mb, tint || [128, 128, 128]); };
  const norm = n => { const L = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / L, n[1] / L, n[2] / L]; };
  const facing = (a, b, c, n) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    return (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2];
  };
  const quadF = (mb, pts, n, uv) => {
    const nn = norm(n);
    if (facing(pts[0], pts[1], pts[2], nn) < 0) mb.quad([pts[3], pts[2], pts[1], pts[0]], nn, [uv[3], uv[2], uv[1], uv[0]]);
    else mb.quad(pts, nn, uv);
  };
  const quad2 = (mb, pts, n, uv) => { quadF(mb, pts, n, uv); quadF(mb, pts, [-n[0], -n[1], -n[2]], uv); };
  const triF = (mb, a, b, c, n, ua, ub, uc) => {
    const nn = norm(n);
    const i0 = mb.v(a[0], a[1], a[2], nn[0], nn[1], nn[2], ua[0], ua[1]);
    const i1 = mb.v(b[0], b[1], b[2], nn[0], nn[1], nn[2], ub[0], ub[1]);
    const i2 = mb.v(c[0], c[1], c[2], nn[0], nn[1], nn[2], uc[0], uc[1]);
    if (facing(a, b, c, nn) < 0) mb.tri(i0, i2, i1); else mb.tri(i0, i1, i2);
  };
  const wallSeg = (mb, x0, z0, x1, z1, y0, y1, uvs) => { const L = Math.hypot(x1 - x0, z1 - z0); if (L > 0.01) mb.wall(x0, z0, x1, z1, y0, y1, 0, L * uvs, y0 * uvs, y1 * uvs, false); };
  const boxAt = (mb, mat, tint, x, y, z, sx, sy, sz, yaw, uvs = 0.5) => { use(mb, mat, tint); mb.box(x, y, z, sx, sy, sz, yaw || 0, uvs); };
  const local = (mb, x, y, z, yaw, fn) => { const s0 = mb.n; fn(); mb.transformFrom(s0, M4.trs(x, y, z, -(yaw || 0), 0, 0)); };
  const segYaw = p => Math.atan2(p.z2 - p.z, p.x2 - p.x);
  const segLen = p => Math.hypot(p.x2 - p.x, p.z2 - p.z);

  Z.SIGNS = Z.SIGNS || [];
  Z.signIndex = text => { let i = Z.SIGNS.indexOf(text); if (i < 0) { i = Z.SIGNS.length; Z.SIGNS.push(text); } return i; };
  const SIGN_STYLE = { '!': ['#a8231a', '#f2ead8', '#e8e2d0'], '^': ['#e8e2d0', '#202020', '#333333'], '~': ['#6a4a2c', '#f2e2c0', '#d8c8a0'], '*': ['#1c1c1c', '#ffb642', '#ffb642'] };
  Z.signCanvas = sheet => {
    const c = Z.mkCanvas(256, 256), g = c.getContext('2d');
    for (let row = 0; row < 4; row++) {
      const text = Z.SIGNS[sheet * 4 + row], y = row * 64;
      if (!text) { g.fillStyle = '#333'; g.fillRect(0, y, 256, 64); continue; }
      const st = SIGN_STYLE[text[0]] || ['#24407a', '#f2ead8', '#e8e2d0'];
      const t = SIGN_STYLE[text[0]] ? text.slice(1) : text;
      g.fillStyle = st[0]; g.fillRect(0, y, 256, 64);
      g.strokeStyle = st[2]; g.lineWidth = 3; g.strokeRect(3, y + 3, 250, 58);
      g.fillStyle = st[1];
      let fs = 34;
      g.font = 'bold ' + fs + 'px Arial, sans-serif';
      while (g.measureText(t).width > 236 && fs > 10) { fs -= 2; g.font = 'bold ' + fs + 'px Arial, sans-serif'; }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(t, 128, y + 33);
      const img = g.getImageData(0, y, 256, 64), d = img.data;
      for (let k = 0; k < d.length; k += 4) { const n = 0.82 + Z.hash2(k >> 2, row, sheet) * 0.18; d[k] *= n; d[k + 1] *= n; d[k + 2] *= n; }
      g.putImageData(img, 0, y);
    }
    return c;
  };

  Z.Scene.prototype.uploadSigns = function () {
    const gl = this.r.gl;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.r.faceTex);
    const sheets = Math.min(SIGN_SHEETS, Math.ceil(Z.SIGNS.length / 4));
    for (let s = 0; s < sheets; s++) gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, SIGN_LAYER0 + s, 256, 256, 1, gl.RGBA, gl.UNSIGNED_BYTE, Z.signCanvas(s));
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  };

  const signQuad = (mb, text, w, h) => {
    const i = Z.signIndex(text), sheet = Math.min(SIGN_SHEETS - 1, Math.floor(i / 4)), row = i % 4;
    mb.setMat(Z.FACE_BASE + SIGN_LAYER0 + sheet, 0, 0); mb.setTint(128, 128, 128, 255);
    const v0 = row * 0.25 + 0.004, v1 = row * 0.25 + 0.246;
    quadF(mb, [[-w / 2, 0, 0], [-w / 2, h, 0], [w / 2, h, 0], [w / 2, 0, 0]], [0, 0, -1], [[1, v1], [1, v0], [0, v0], [0, v1]]);
  };

  const gable = (mb, hw, hd, h, rh, e, roofMat, roofTint, wallMat, wallTint) => {
    use(mb, roofMat, roofTint);
    const w = hw * 2 + e * 2;
    quad2(mb, [[-hw - e, h - 0.12, -hd - e], [-hw - e, h + rh, 0], [hw + e, h + rh, 0], [hw + e, h - 0.12, -hd - e]], [0, hd + e, -rh], [[0, 0], [0, 1.5], [w * 0.5, 1.5], [w * 0.5, 0]]);
    quad2(mb, [[hw + e, h - 0.12, hd + e], [hw + e, h + rh, 0], [-hw - e, h + rh, 0], [-hw - e, h - 0.12, hd + e]], [0, hd + e, rh], [[0, 0], [0, 1.5], [w * 0.5, 1.5], [w * 0.5, 0]]);
    use(mb, wallMat, wallTint);
    for (const s of [-1, 1]) triF(mb, [s * hw, h, -hd], [s * hw, h, hd], [s * hw, h + rh, 0], [s, 0, 0], [0, h * 0.5], [hd, h * 0.5], [hd * 0.5, (h + rh) * 0.5]);
  };

  const shack = (mb, p) => {
    const [w, h, d] = p.size || [5, 2.8, 4];
    const hw = w / 2, hd = d / 2, wm = p.mat || 'wood', wt = p.tint || [128, 128, 128];
    boxAt(mb, 'concrete', [110, 108, 104], 0, -0.7, 0, w + 0.12, 0.85, d + 0.12);
    use(mb, wm, wt);
    const dx = p.doorX || 0;
    if (p.door !== false) {
      wallSeg(mb, -hw, -hd, dx - 0.55, -hd, 0, h, 0.5);
      wallSeg(mb, dx + 0.55, -hd, hw, -hd, 0, h, 0.5);
      wallSeg(mb, dx - 0.55, -hd, dx + 0.55, -hd, 2.1, h, 0.5);
      if (!p.door) boxAt(mb, 'wood', p.doorTint || [96, 74, 52], dx, 0, -hd + 0.03, 1.1, 2.1, 0.06);
    } else wallSeg(mb, -hw, -hd, hw, -hd, 0, h, 0.5);
    use(mb, wm, wt);
    wallSeg(mb, hw, -hd, hw, hd, 0, h, 0.5);
    wallSeg(mb, hw, hd, -hw, hd, 0, h, 0.5);
    wallSeg(mb, -hw, hd, -hw, -hd, 0, h, 0.5);
    if (p.windows !== false) for (const s of [-1, 1]) {
      const wx = dx + s * Math.min(hw * 0.55, 1.6 + hw * 0.2);
      if (Math.abs(wx) > hw - 0.5) continue;
      boxAt(mb, 'glass', [60, 70, 80], wx, 1.0, -hd - 0.03, 0.9, 0.9, 0.04);
      boxAt(mb, 'wood', p.frameTint || [210, 205, 190], wx, 0.92, -hd - 0.05, 1.05, 0.08, 0.08);
      if (p.shutters) for (const k of [-1, 1]) boxAt(mb, 'wood', p.shutters, wx + k * 0.62, 0.98, -hd - 0.05, 0.3, 0.95, 0.04);
    }
    gable(mb, hw, hd, h, Math.min(2.2, d * 0.35), 0.35, p.roof || 'roofTin', p.roofTint, wm, wt);
    if (p.sign) local(mb, dx, 2.25, -hd - 0.07, 0, () => signQuad(mb, p.sign, Math.min(w * 0.85, 3.4), 0.6));
    if (p.chimney) boxAt(mb, 'brickRed', [128, 128, 128], hw * 0.45, h, hd * 0.3, 0.5, Math.min(2.2, d * 0.35) + 0.9, 0.5);
    if (p.porch) { boxAt(mb, 'wood', [120, 100, 80], dx, -0.2, -hd - 0.9, 2.2, 0.3, 1.6); for (const s of [-1, 1]) boxAt(mb, 'wood', [110, 90, 70], dx + s * 1.0, 0.1, -hd - 1.6, 0.12, 2.2, 0.12); boxAt(mb, 'roofTin', [120, 120, 120], dx, 2.3, -hd - 0.9, 2.5, 0.08, 1.9); }
  };

  const hut = (mb, p) => {
    const [w, h, d] = p.size || [8, 2.8, 5];
    const hw = w / 2, hd = d / 2, wm = p.mat || 'plasterWhite', wt = p.tint || [150, 150, 146];
    boxAt(mb, 'brickRed', [120, 90, 80], 0, -0.7, 0, w + 0.1, 0.95, d + 0.1);
    use(mb, wm, wt);
    wallSeg(mb, -hw, -hd, -0.6, -hd, 0, h, 0.5);
    wallSeg(mb, 0.6, -hd, hw, -hd, 0, h, 0.5);
    wallSeg(mb, -0.6, -hd, 0.6, -hd, 2.05, h, 0.5);
    wallSeg(mb, hw, -hd, hw, hd, 0, h, 0.5);
    wallSeg(mb, hw, hd, -hw, hd, 0, h, 0.5);
    wallSeg(mb, -hw, hd, -hw, -hd, 0, h, 0.5);
    if (!p.door) boxAt(mb, 'wood', [100, 76, 54], 0, 0, -hd + 0.03, 1.2, 2.05, 0.06);
    for (const s of [-1, 1]) {
      const wx = s * hw * 0.55;
      boxAt(mb, 'glass', [60, 70, 80], wx, 0.95, -hd - 0.03, 0.8, 0.8, 0.04);
      for (const k of [-1, 1]) boxAt(mb, 'wood', p.shutters || [60, 90, 140], wx + k * 0.56, 0.9, -hd - 0.05, 0.3, 0.9, 0.04);
    }
    const rh = Math.max(1.6, d * 0.55), e = 0.6, rx = hw * 0.45;
    use(mb, p.roof || 'thatch', p.roofTint || [128, 128, 128]);
    quad2(mb, [[-hw - e, h - 0.3, -hd - e], [-rx, h + rh, 0], [rx, h + rh, 0], [hw + e, h - 0.3, -hd - e]], [0, hd + e, -rh], [[0, 0], [0.4, 1.6], [w * 0.35, 1.6], [w * 0.45, 0]]);
    quad2(mb, [[hw + e, h - 0.3, hd + e], [rx, h + rh, 0], [-rx, h + rh, 0], [-hw - e, h - 0.3, hd + e]], [0, hd + e, rh], [[0, 0], [0.4, 1.6], [w * 0.35, 1.6], [w * 0.45, 0]]);
    for (const s of [-1, 1]) {
      const a = [s * (hw + e), h - 0.3, -hd - e], b = [s * (hw + e), h - 0.3, hd + e], c = [s * rx, h + rh, 0];
      triF(mb, a, b, c, [s * rh, hw + e - rx, 0], [0, 0], [d * 0.45, 0], [d * 0.22, 1.6]);
      triF(mb, a, c, b, [-s * rh, -(hw + e - rx), 0], [0, 0], [d * 0.22, 1.6], [d * 0.45, 0]);
    }
    if (p.sign) local(mb, 0, 2.3, -hd - 0.08, 0, () => signQuad(mb, p.sign, Math.min(w * 0.7, 3.2), 0.6));
  };

  const church = mb => {
    boxAt(mb, 'logs', null, 0, -0.5, 0, 7, 7.5, 10);
    boxAt(mb, 'logs', null, 0, -0.5, -6.5, 4, 5.5, 3);
    for (let k = 0; k < 3; k++) {
      const s = 6.4 - k * 1.8, y = 7 + k * 2.2;
      use(mb, 'roofTin', [80, 120, 100]);
      mb.cyl(0, y, 0, s * 0.62, s * 0.3, 2.2, 8, 0.5, true);
      use(mb, 'logs');
      mb.cyl(0, y + 2.2, 0, s * 0.3, s * 0.3, 0.6, 8, 0.5, false);
    }
    use(mb, 'bronze', [210, 180, 90]);
    mb.cyl(0, 13.8, 0, 0.75, 0.05, 1.8, 8, 0.5, true);
    boxAt(mb, 'bronze', [210, 180, 90], 0, 15.4, 0, 0.08, 1.4, 0.08);
    boxAt(mb, 'bronze', [210, 180, 90], 0, 16.2, 0, 0.6, 0.08, 0.08);
    for (const x of [-2.2, 2.2]) { use(mb, 'roofTin', [80, 120, 100]); mb.cyl(x, 7, 3.6, 1.2, 0.08, 2.4, 8, 0.5, true); }
    use(mb, 'roofTin', [80, 120, 100]);
    mb.cyl(0, 5, -6.5, 2.6, 0.1, 1.6, 4, 0.5, true);
    boxAt(mb, 'wood', [100, 76, 54], 0, 0, -8.03, 1.4, 2.4, 0.06);
  };

  const tower = (mb, p) => {
    const h = p.h || 8;
    use(mb, 'logs');
    for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]]) mb.cyl(x, -0.3, z, 0.18, 0.16, h + 2.4, 6, 0.5, false);
    boxAt(mb, 'wood', [128, 110, 90], 0, h - 0.2, 0, 4, 0.2, 4);
    for (const [x, z, w, d] of [[0, -2, 4, 0.12], [0, 2, 4, 0.12], [-2, 0, 0.12, 4], [2, 0, 0.12, 4]]) boxAt(mb, 'logs', null, x, h, z, w, 1.1, d);
    use(mb, 'thatch');
    mb.cyl(0, h + 2.1, 0, 3.0, 0.1, 1.9, 4, 0.5, true);
    for (let k = 0; k < 4; k++) boxAt(mb, 'logs', null, 0, k * 2, 1.9, 1.6, 0.12, 0.12);
  };

  const B = {
    box(mb, p) { boxAt(mb, p.mat || 'concrete', p.tint, 0, 0, 0, p.size[0], p.size[1], p.size[2], 0, p.uvs || 0.5); },
    cyl(mb, p) { use(mb, p.mat || 'concrete', p.tint); mb.cyl(0, 0, 0, p.r || 0.5, p.r1 === undefined ? p.r || 0.5 : p.r1, p.h || 3, p.sides || 10, 0.5, true); },
    shack, hut, church, tower,
    stall(mb, p) {
      boxAt(mb, 'wood', [140, 116, 86], 0, 0, 0, 2.6, 0.95, 1.2);
      for (const [x, z] of [[-1.25, -0.55], [1.25, -0.55], [-1.25, 0.55], [1.25, 0.55]]) boxAt(mb, 'wood', [100, 80, 60], x, 0.95, z, 0.08, 1.45, 0.08);
      use(mb, 'awning', p.tint);
      quad2(mb, [[-1.4, 2.25, -0.95], [-1.4, 2.5, 0.7], [1.4, 2.5, 0.7], [1.4, 2.25, -0.95]], [0, 1, -0.15], [[0, 0], [0, 1], [2, 1], [2, 0]]);
      const goods = p.goods || [[180, 140, 90], [200, 80, 50], [120, 150, 80], [210, 200, 120], [150, 100, 70]];
      for (let i = 0; i < 5; i++) boxAt(mb, 'cloth', goods[i % goods.length], -1 + i * 0.5, 0.95, -0.1, 0.36, 0.16 + (i % 3) * 0.08, 0.36);
      if (p.sign) local(mb, 0, 1.95, -0.98, 0, () => signQuad(mb, p.sign, 2.4, 0.32));
    },
    kiosk(mb, p) {
      boxAt(mb, 'paintGreen', p.tint || [80, 110, 120], 0, 0, 0, 2.6, 0.9, 2.2);
      boxAt(mb, 'glass', [70, 80, 90], 0, 0.9, 0, 2.5, 1.4, 2.1);
      boxAt(mb, 'paintGreen', p.tint || [80, 110, 120], 0, 2.3, 0, 2.8, 0.36, 2.4);
      if (p.sign) local(mb, 0, 2.3, -1.22, 0, () => signQuad(mb, p.sign, 2.6, 0.36));
    },
    busstop(mb, p) {
      boxAt(mb, 'concrete', [150, 150, 150], 0, 0, 0.6, 3, 2.5, 0.15);
      boxAt(mb, 'concrete', [150, 150, 150], 0, 2.5, 0, 3.2, 0.15, 1.4);
      for (const x of [-1.45, 1.45]) boxAt(mb, 'concrete', [150, 150, 150], x, 0, 0, 0.12, 2.5, 1.3);
      boxAt(mb, 'wood', [130, 100, 70], 0, 0.45, 0.35, 2.6, 0.08, 0.4);
      if (p.sign) local(mb, 0, 2.66, -0.71, 0, () => signQuad(mb, p.sign, 3, 0.5));
    },
    wall(mb, p) { boxAt(mb, p.mat || 'brickRed', p.tint, (p.x2 - p.x) / 2, -0.3, (p.z2 - p.z) / 2, segLen(p), (p.h || 2.5) + 0.3, p.thick || 0.3, segYaw(p), 0.5); },
    fence(mb, p) {
      const L = segLen(p), yaw = segYaw(p), h = p.h || 2;
      boxAt(mb, p.mat || 'corrugated', p.tint, (p.x2 - p.x) / 2, -0.1, (p.z2 - p.z) / 2, L, h + 0.1, 0.06, yaw, 0.5);
      const n = Math.max(1, Math.ceil(L / 3));
      for (let i = 0; i <= n; i++) { const t = i / n; boxAt(mb, 'wood', [100, 80, 60], (p.x2 - p.x) * t, -0.2, (p.z2 - p.z) * t, 0.1, h + 0.35, 0.1, yaw); }
    },
    picket(mb, p) {
      const L = segLen(p), yaw = segYaw(p), n = Math.max(1, Math.round(L / 0.22)), h = p.h || 1.2;
      for (const y of [0.3, h - 0.3]) boxAt(mb, 'wood', p.tint || [120, 100, 76], (p.x2 - p.x) / 2, y, (p.z2 - p.z) / 2, L, 0.08, 0.04, yaw);
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; boxAt(mb, 'wood', p.tint || [130, 110, 84], (p.x2 - p.x) * t, -0.1, (p.z2 - p.z) * t, 0.1, h + 0.1 + (i % 2) * 0.05, 0.03, yaw); }
    },
    palisade(mb, p) {
      const L = segLen(p), h = p.h || 3.6, n = Math.max(1, Math.round(L / 0.32));
      use(mb, 'logs', p.tint);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, x = (p.x2 - p.x) * t, z = (p.z2 - p.z) * t, hh = h + Z.hash2(i, 7, 1) * 0.4;
        mb.cyl(x, -0.4, z, 0.16, 0.16, hh + 0.1, 5, 0.5, false);
        mb.cyl(x, hh - 0.3, z, 0.16, 0.0, 0.4, 5, 0.5, false);
      }
    },
    ruinwall(mb, p) {
      const L = segLen(p), n = Math.max(1, Math.round(L / 1.5)), yaw = segYaw(p);
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; const h = (p.h || 3) * (0.35 + Z.hash2(i, 3, Math.round(p.x)) * 0.65); boxAt(mb, p.mat || 'brickRed', p.tint, (p.x2 - p.x) * t, -0.3, (p.z2 - p.z) * t, L / n + 0.05, h + 0.3, p.thick || 0.5, yaw, 0.5); }
    },
    sandbags(mb, p) { boxAt(mb, 'sandbag', null, (p.x2 - p.x) / 2, -0.1, (p.z2 - p.z) / 2, segLen(p), (p.h || 1.1) + 0.1, 0.9, segYaw(p), 0.6); },
    block(mb) { boxAt(mb, 'concrete', [140, 140, 136], 0, -0.05, 0, 2.0, 0.95, 0.8); boxAt(mb, 'paintRed', [200, 200, 196], 0, 0.45, -0.41, 1.6, 0.18, 0.01); },
    hedgehog(mb) { use(mb, 'rust'); for (let k = 0; k < 3; k++) { const s0 = mb.n; mb.box(0, -0.9, -0.08, 0.16, 1.8, 0.16, 0, 0.5); mb.transformFrom(s0, M4.mul(M4.trs(0, 0.7, 0, k * Math.PI / 3, 0, 0), M4.trs(0, 0, 0, 0, 0, 0.95))); } },
    wire(mb, p) {
      const L = segLen(p), n = Math.max(2, Math.ceil(L / 0.5));
      use(mb, 'metalGrey', [90, 90, 90]);
      for (let i = 0; i < n; i++) { const t = i / n, s0 = mb.n; mb.cyl(0, 0, 0, 0.015, 0.015, 1.6, 3, 0.5, false); mb.transformFrom(s0, M4.trs((p.x2 - p.x) * t, 0.45 + Math.sin(i) * 0.1, (p.z2 - p.z) * t, i * 0.9, 1.2, 0.3)); }
    },
    wreck(mb, p) { Z.Props.car(mb, p.model || 'zaz', p.tint); },
    lamp(mb, p) {
      use(mb, 'concrete', [140, 140, 136]);
      mb.cyl(0, -0.2, 0, 0.14, 0.09, 7.2, 6, 0.5, false);
      boxAt(mb, 'concrete', [140, 140, 136], 0.8, 6.9, 0, 1.6, 0.1, 0.1);
      boxAt(mb, p.lit ? 'glow' : 'metalGrey', p.lit ? [255, 220, 160] : [90, 90, 90], 1.55, 6.75, 0, 0.5, 0.15, 0.25);
    },
    tank(mb) {
      boxAt(mb, 'granite', null, 0, -0.3, 0, 3.6, 2.1, 7.2);
      boxAt(mb, 'paintGreen', [70, 90, 60], 0, 1.8, 0, 3.0, 1.0, 6.2);
      boxAt(mb, 'rubber', [50, 50, 50], -1.4, 1.75, 0, 0.6, 0.8, 6.4);
      boxAt(mb, 'rubber', [50, 50, 50], 1.4, 1.75, 0, 0.6, 0.8, 6.4);
      use(mb, 'paintGreen', [70, 90, 60]);
      mb.cyl(0, 2.8, 0.4, 1.2, 1.0, 0.8, 10, 0.5, true);
      const s0 = mb.n; mb.cyl(0, 0, 0, 0.09, 0.09, 4.2, 6, 0.5, true); mb.transformFrom(s0, M4.trs(0, 3.25, 0.2, 0, -Math.PI / 2 + 0.08, 0));
      boxAt(mb, 'paintRed', [200, 40, 30], 1.51, 2.1, 0.4, 0.02, 0.4, 0.4);
    },
    statue(mb, p) {
      const h = (p.size && p.size[1]) || 6, b = h * 0.4, mat = p.mat || 'bronze', tint = p.tint || [128, 128, 128];
      boxAt(mb, 'granite', [128, 120, 116], 0, -0.3, 0, 3, b + 0.3, 3);
      use(mb, mat, tint);
      mb.cyl(-0.18, b, 0, 0.18, 0.15, h * 0.28, 6, 0.5, false);
      mb.cyl(0.18, b, 0, 0.18, 0.15, h * 0.28, 6, 0.5, false);
      mb.cyl(0, b + h * 0.02, 0, p.coat ? 0.75 : 0.5, 0.55, h * 0.3, 10, 0.5, false);
      mb.cyl(0, b + h * 0.32, 0, 0.55, 0.62, h * 0.24, 8, 0.5, true);
      mb.cyl(0, b + h * 0.56, 0, 0.14, 0.12, h * 0.05, 6, 0.5, false);
      const hr = h * 0.075;
      mb.cyl(0, b + h * 0.6, 0, hr, hr * 0.8, hr * 1.8, 8, 0.5, true);
      let s0 = mb.n; mb.cyl(0, 0, 0, 0.12, 0.1, h * 0.28, 6, 0.5, true); mb.transformFrom(s0, M4.trs(0.55, b + h * 0.52, -0.2, 0.4, 0, -2.2));
      s0 = mb.n; mb.cyl(0, 0, 0, 0.12, 0.1, h * 0.26, 6, 0.5, true); mb.transformFrom(s0, M4.trs(-0.6, b + h * 0.56, 0, 0, 0, Math.PI - 0.15));
      if (p.sign) local(mb, 0, b * 0.35, -1.53, 0, () => signQuad(mb, p.sign, 2.6, 0.5));
    },
    tent(mb, p) {
      const [w, h, d] = p.size || [3, 2.2, 4];
      use(mb, 'canvas', p.tint);
      quad2(mb, [[-w / 2, 0, -d / 2], [0, h, -d / 2], [0, h, d / 2], [-w / 2, 0, d / 2]], [-h, w / 2, 0], [[0, 0], [0, 1], [2, 1], [2, 0]]);
      quad2(mb, [[w / 2, 0, d / 2], [0, h, d / 2], [0, h, -d / 2], [w / 2, 0, -d / 2]], [h, w / 2, 0], [[0, 0], [0, 1], [2, 1], [2, 0]]);
      triF(mb, [-w / 2, 0, d / 2], [w / 2, 0, d / 2], [0, h, d / 2], [0, 0, 1], [0, 0], [1, 0], [0.5, 1]);
      triF(mb, [-w / 2, 0, d / 2], [w / 2, 0, d / 2], [0, h, d / 2], [0, 0, -1], [0, 0], [1, 0], [0.5, 1]);
    },
    pole(mb, p) {
      const h = p.h || 8;
      use(mb, 'metalGrey', [110, 110, 110]);
      mb.cyl(0, -0.2, 0, 0.07, 0.05, h + 0.2, 6, 0.5, true);
      use(mb, p.flag || 'paintRed', p.flagTint || [200, 40, 30]);
      quad2(mb, [[0.05, h - 1.6, 0], [0.05, h - 0.2, 0], [2.1, h - 0.3, 0.2], [2.1, h - 1.5, 0.2]], [0, 0, -1], [[0, 0], [0, 1], [1, 1], [1, 0]]);
    },
    sign(mb, p) {
      const w = p.w || 3, h = p.hh || 0.6, y0 = p.y0 === undefined ? 1.4 : p.y0;
      if (p.posts !== false) for (const s of [-1, 1]) boxAt(mb, 'metalGrey', [90, 90, 90], s * w * 0.42, -0.2, 0.05, 0.08, y0 + h + 0.2, 0.08);
      local(mb, 0, y0, 0, 0, () => {
        signQuad(mb, p.text, w, h);
        use(mb, 'metalGrey', [80, 80, 80]);
        quadF(mb, [[w / 2, 0, 0.02], [w / 2, h, 0.02], [-w / 2, h, 0.02], [-w / 2, 0, 0.02]], [0, 0, 1], [[0, 0], [0, 1], [1, 1], [1, 0]]);
      });
    },
    banner(mb, p) {
      const w = p.w || 6, h = p.hh || 1, y0 = p.y0 || 3;
      use(mb, 'metalGrey', [90, 90, 90]);
      for (const s of [-1, 1]) mb.cyl(s * w / 2, -0.2, 0, 0.06, 0.06, y0 + h + 0.4, 5, 0.5, true);
      local(mb, 0, y0, 0, 0, () => signQuad(mb, p.text, w, h));
      local(mb, 0, y0, 0.01, Math.PI, () => signQuad(mb, p.text, w, h));
    },
    pear(mb) {
      use(mb, 'bark', [110, 100, 90]);
      mb.cyl(0, -0.4, 0, 0.75, 0.5, 4.2, 10, 0.4, false);
      for (let i = 0; i < 6; i++) { const s0 = mb.n; mb.cyl(0, 0, 0, 0.32, 0.08, 4.4, 6, 0.4, false); mb.transformFrom(s0, M4.mul(M4.trs(0, 3.4 + (i % 3) * 0.4, 0, i * 1.05, 0, 0), M4.trs(0, 0, 0, 0, 0, -0.65 - (i % 2) * 0.25))); }
      crown(mb, 34, 2, 0.6, 5.5, 0.5, 3.2, [140, 150, 120]);
      use(mb, 'paintRed', [210, 190, 80]);
      for (let i = 0; i < 26; i++) { const a = i * 1.9, r = 1.5 + (i % 4) * 0.8; mb.box(Math.cos(a) * r, 4.6 + (i % 5) * 0.55, Math.sin(a) * r, 0.14, 0.18, 0.14, a, 1); }
    },
    bigoak(mb, p) {
      use(mb, 'bark', [90, 86, 80]);
      mb.cyl(0, -0.5, 0, 1.4, 0.9, 6, 12, 0.3, false);
      for (let i = 0; i < 7; i++) { const s0 = mb.n; mb.cyl(0, 0, 0, 0.5, 0.12, 7 + (i % 3), 6, 0.4, false); mb.transformFrom(s0, M4.mul(M4.trs(0, 4.5 + (i % 3) * 0.6, 0, i * 0.9, 0, 0), M4.trs(0, 0, 0, 0, 0, -0.75 - (i % 2) * 0.3))); }
      if (!p.dead) crown(mb, 40, 3, 1.0, 8, 0.8, 4.5, [128, 140, 110]);
    },
    tree(mb, p) { Z.Build.treeCache = Z.Build.treeCache || Z.Build.treeTemplates(); const s0 = mb.n; mb.append(Z.Build.treeCache[p.sp || 'oak']); mb.transformFrom(s0, M4.trs(0, 0, 0, 0, 0, 0, p.s || 1)); },
    stone(mb, p) {
      use(mb, p.mat || 'granite', p.tint || [128, 124, 118]);
      const h = p.h || 2.2, w = p.w || 0.8;
      mb.box(0, -0.3, 0, w, h + 0.3, w * 0.45, 0, 0.5);
      if (p.baba) mb.cyl(0, h, 0, w * 0.4, w * 0.32, w * 0.6, 8, 0.5, true);
    },
    rubble(mb, p) { const R = Z.rng(Math.round(p.x * 13 + p.z * 7)); use(mb, 'debris', p.tint); const s = p.size || [3, 1.2, 3]; for (let i = 0; i < 7; i++) mb.box((R() - 0.5) * s[0], -0.2, (R() - 0.5) * s[2], 0.6 + R() * s[0] * 0.4, 0.3 + R() * s[1], 0.6 + R() * s[2] * 0.4, R() * 3, 0.5); },
    pier(mb, p) {
      const L = segLen(p), yaw = segYaw(p), w = p.w || 2.4, dy = p.deckY === undefined ? 0.6 : p.deckY;
      boxAt(mb, 'wood', [128, 116, 100], (p.x2 - p.x) / 2, dy - 0.15, (p.z2 - p.z) / 2, L, 0.15, w, yaw, 0.5);
      const n = Math.max(1, Math.ceil(L / 3));
      for (let i = 0; i <= n; i++) for (const s of [-1, 1]) { const t = i / n; boxAt(mb, 'logs', [100, 90, 80], (p.x2 - p.x) * t - Math.sin(yaw) * s * w * 0.45, -3, (p.z2 - p.z) * t + Math.cos(yaw) * s * w * 0.45, 0.2, dy + 3, 0.2, 0, 0.5); }
    },
    boat(mb, p) { boxAt(mb, 'wood', p.tint || [120, 90, 60], 0, -0.2, 0, 1.4, 0.7, 4.2); boxAt(mb, 'wood', [90, 70, 50], 0, 0.1, 0, 1.2, 0.42, 3.8); },
    hydrofoil(mb) {
      boxAt(mb, 'robotPaint', [200, 196, 186], 0, 0, 0, 5, 2.2, 26, 0, 0.3);
      boxAt(mb, 'glass', [60, 70, 80], 0, 2.2, -2, 4.4, 1.6, 18, 0, 0.3);
      boxAt(mb, 'robotPaint', [200, 196, 186], 0, 3.8, -2, 4.6, 0.2, 18.5, 0, 0.3);
      boxAt(mb, 'paintRed', [190, 40, 30], 0, 1.6, 0, 5.05, 0.2, 26.05, 0, 0.3);
      boxAt(mb, 'rust', null, 0, -0.6, -9, 6, 0.15, 1.2);
      boxAt(mb, 'rust', null, 0, -0.6, 8, 6, 0.15, 1.2);
      local(mb, 2.54, 2.6, -6, Math.PI / 2, () => signQuad(mb, '^РАКЕТА-77', 5, 0.7));
    },
    container(mb, p) { boxAt(mb, 'corrugated', p.tint || [150, 90, 70], 0, -0.1, 0, 2.4, 2.7, 6); },
    pylon(mb) {
      use(mb, 'metalGrey', [100, 104, 104]);
      for (const [x, z] of [[-2, -2], [2, -2], [2, 2], [-2, 2]]) { const s0 = mb.n; mb.cyl(0, 0, 0, 0.12, 0.08, 26, 4, 0.5, false); mb.transformFrom(s0, M4.mul(M4.trs(x, -0.3, z, 0, 0, 0), M4.trs(0, 0, 0, Math.atan2(x, z), -0.07, 0))); }
      for (const y of [18, 22, 25]) boxAt(mb, 'metalGrey', [100, 104, 104], 0, y, 0, 12 - (y - 18) * 0.6, 0.25, 0.4);
    },
    chimney(mb, p) { const r = p.r || 2, h = p.h || 40; use(mb, 'brickRed'); mb.cyl(0, -0.5, 0, r, r * 0.6, h + 0.5, 12, 0.3, false); for (let k = 0; k < 3; k++) { use(mb, 'paintRed', k % 2 ? [220, 220, 220] : [190, 50, 40]); mb.cyl(0, h - 4 - k * 2, 0, r * 0.66, r * 0.64, 2, 12, 0.3, false); } },
    cistern(mb, p) { use(mb, 'rust'); mb.cyl(0, -0.3, 0, p.r || 3, p.r || 3, (p.h || 6) + 0.3, 14, 0.3, true); },
    haystack(mb) { use(mb, 'thatch', [160, 150, 110]); mb.cyl(0, -0.2, 0, 2, 0.4, 3.2, 10, 0.4, true); },
    well(mb) {
      use(mb, 'logs'); mb.cyl(0, -0.2, 0, 0.8, 0.8, 1.0, 8, 0.5, false);
      for (const x of [-0.75, 0.75]) boxAt(mb, 'wood', [110, 90, 70], x, 0, 0, 0.12, 2.1, 0.12);
      boxAt(mb, 'logs', null, 0, 1.75, 0, 1.6, 0.18, 0.18);
      use(mb, 'roofTin', [100, 110, 100]);
      quad2(mb, [[-0.9, 2.0, -0.7], [-0.9, 2.5, 0], [0.9, 2.5, 0], [0.9, 2.0, -0.7]], [0, 1, -0.7], [[0, 0], [0, 1], [1, 1], [1, 0]]);
      quad2(mb, [[0.9, 2.0, 0.7], [0.9, 2.5, 0], [-0.9, 2.5, 0], [-0.9, 2.0, 0.7]], [0, 1, 0.7], [[0, 0], [0, 1], [1, 1], [1, 0]]);
    },
    prop(mb, p) { const f = Z.Props.P[p.prop] || Z.Props.OBJ[p.prop]; if (f) f(mb, p); },
    bench(mb) { boxAt(mb, 'wood', [130, 100, 70], 0, 0.42, 0, 1.8, 0.06, 0.45); boxAt(mb, 'wood', [130, 100, 70], 0, 0.5, 0.22, 1.8, 0.4, 0.05); for (const x of [-0.8, 0.8]) boxAt(mb, 'concrete', [140, 140, 140], x, -0.1, 0, 0.12, 0.52, 0.4); },
    crossbar(mb, p) { const w = p.w || 4; boxAt(mb, 'paintRed', [200, 200, 200], 0, 0.9, 0, w, 0.12, 0.12); for (let k = 0; k < 4; k++) boxAt(mb, 'paintRed', [200, 40, 30], -w / 2 + w * (k + 0.5) / 4, 0.895, 0, w / 8, 0.13, 0.13); boxAt(mb, 'metalGrey', [100, 100, 100], -w / 2, -0.1, 0, 0.3, 1.1, 0.3); },
    booth(mb, p) { boxAt(mb, 'paintGreen', p.tint || [90, 110, 90], 0, -0.1, 0, 2, 2.6, 2); boxAt(mb, 'glass', [70, 80, 90], 0, 1.2, -1.02, 1.6, 0.9, 0.04); boxAt(mb, 'roofTin', [110, 110, 110], 0, 2.5, 0, 2.4, 0.12, 2.4); if (p.sign) local(mb, 0, 2.62, -1.21, 0, () => signQuad(mb, p.sign, 2.4, 0.4)); },
    gate() {},
    deck(mb, p) {
      const w = p.w || 10, thick = p.thick || 1.2, oy = p.y || 0;
      const dx = p.x2 - p.x, dz = p.z2 - p.z, L = Math.hypot(dx, dz), lx = -dz / L, lz = dx / L;
      const P = (t, s, yo) => [dx * t + lx * s * w / 2, Z.lerp(p.y0, p.y1, t) + (p.camber ? Math.sin(t * Math.PI) * p.camber : 0) + yo - oy, dz * t + lz * s * w / 2];
      const n = Math.max(2, Math.ceil(L / 6));
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        const a = P(t0, -1, 0), b = P(t1, -1, 0), c = P(t1, 1, 0), d = P(t0, 1, 0);
        use(mb, p.mat || 'asphalt', [120, 120, 120]);
        quadF(mb, [a, b, c, d], [0, 1, 0], [[0, t0 * L / 4], [0, t1 * L / 4], [w / 4, t1 * L / 4], [w / 4, t0 * L / 4]]);
        use(mb, 'concrete', [130, 128, 124]);
        const a2 = P(t0, -1, -thick), b2 = P(t1, -1, -thick), c2 = P(t1, 1, -thick), d2 = P(t0, 1, -thick);
        quadF(mb, [a2, b2, c2, d2], [0, -1, 0], [[0, 0], [0, 1], [1, 1], [1, 0]]);
        quadF(mb, [a, b, b2, a2], [-lx, 0, -lz], [[0, 0], [1, 0], [1, 0.3], [0, 0.3]]);
        quadF(mb, [c, d, d2, c2], [lx, 0, lz], [[0, 0], [1, 0], [1, 0.3], [0, 0.3]]);
        if (p.rail !== false) for (const s of [-1, 1]) {
          const r0 = P(t0, s * 0.97, 0), r1 = P(t1, s * 0.97, 0), len = Math.hypot(r1[0] - r0[0], r1[1] - r0[1], r1[2] - r0[2]);
          use(mb, 'metalGrey', [110, 110, 110]);
          const s0 = mb.n;
          mb.box(0, 0.85, 0, 0.1, 0.1, len, 0, 0.5);
          mb.box(0, 0, -len / 2, 0.08, 0.95, 0.08, 0, 0.5);
          mb.transformFrom(s0, M4.trs((r0[0] + r1[0]) / 2, (r0[1] + r1[1]) / 2, (r0[2] + r1[2]) / 2, Math.atan2(r1[0] - r0[0], r1[2] - r0[2]), -Math.atan2(r1[1] - r0[1], Math.hypot(r1[0] - r0[0], r1[2] - r0[2])), 0));
        }
      }
      for (const t of p.piers || []) {
        const c = P(t, 0, -thick), gy = p.groundAt ? p.groundAt(p.x + dx * t, p.z + dz * t) : -6;
        const bot = Math.min(gy, 0) - oy - 1;
        boxAt(mb, 'concrete', [128, 126, 120], c[0], bot, c[2], w * 0.75, c[1] - bot, 2.2, Math.atan2(dz, dx), 0.3);
      }
    },
    arch(mb, p) {
      const dx = p.x2 - p.x, dz = p.z2 - p.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, lx = -uz, lz = ux;
      const rise = p.rise || 24, w = p.w || 10, base = p.base || 0, top = p.top || 16, oy = p.y || 0, n = 28;
      for (const s of [-1, 1]) {
        let prev = null;
        for (let i = 0; i <= n; i++) {
          const t = i / n, y = base + rise * 4 * t * (1 - t) - oy;
          const pos = [ux * L * t + lx * s * w * 0.45, y, uz * L * t + lz * s * w * 0.45];
          if (prev) {
            const seg = Math.hypot(pos[0] - prev[0], pos[1] - prev[1], pos[2] - prev[2]);
            use(mb, 'concrete', [150, 146, 138]);
            const s0 = mb.n;
            mb.box(0, -0.7, (seg + 0.1) / 2, 1.6, 1.4, seg + 0.1, 0, 0.3);
            mb.transformFrom(s0, M4.trs(prev[0], prev[1], prev[2], Math.atan2(ux, uz), -Math.atan2(pos[1] - prev[1], Math.hypot(pos[0] - prev[0], pos[2] - prev[2])), 0));
            if (i % 2 === 0 && y + oy < top - 1.5) boxAt(mb, 'concrete', [150, 146, 138], pos[0], y, pos[2], 0.45, top - (y + oy), 0.45);
          }
          prev = pos;
        }
      }
    },
    dam(mb, p) {
      const pts = p.pts, w = 18, crest = p.crest || 34;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), yaw = Math.atan2(dz, dx);
        const nb = Math.max(1, Math.round(L / 9));
        for (let k = 0; k < nb; k++) {
          const t = (k + 0.5) / nb, cx = a[0] + dx * t - p.x, cz = a[1] + dz * t - p.z;
          boxAt(mb, 'concrete', [150, 148, 142], cx, -10, cz, L / nb - 2.6, crest + 4, w, yaw, 0.15);
          boxAt(mb, 'concrete', [135, 133, 128], cx, crest - 6, cz, L / nb + 0.4, 6, w + 2, yaw, 0.15);
          boxAt(mb, 'concrete', [120, 118, 112], cx - Math.sin(yaw) * (w / 2 + 3), -10, cz + Math.cos(yaw) * (w / 2 + 3), 2.4, crest - 2, 6, yaw, 0.15);
        }
        boxAt(mb, 'asphalt', [110, 110, 110], (a[0] + b[0]) / 2 - p.x, crest, (a[1] + b[1]) / 2 - p.z, L + 1, 0.3, w - 2, yaw, 0.25);
      }
      for (let i = 0; i < pts.length; i += 2) { const q = pts[i]; boxAt(mb, 'metalGrey', [110, 100, 70], q[0] - p.x, crest, q[1] - p.z, 6, 16, 4, 0, 0.3); boxAt(mb, 'metalGrey', [110, 100, 70], q[0] - p.x, crest + 16, q[1] - p.z, 14, 1.5, 4, 0, 0.3); }
      if (p.sign) { const a = pts[0], b = pts[pts.length - 1]; local(mb, (a[0] + b[0]) / 2 - p.x, crest - 5, (a[1] + b[1]) / 2 - p.z + w / 2 + 1.2, Math.PI, () => signQuad(mb, p.sign, 40, 4.5)); }
    }
  };

  function crown(mb, n, r0, rStep, y0, yStep, sz, tint) {
    mb.setMat(Z.LEAF_BASE + Z.FOLIAGE.oak, 0, 0); mb.setTint(tint[0], tint[1], tint[2], 255);
    for (let i = 0; i < n; i++) {
      const a = i * 2.4, r = r0 + (i % 5) * rStep, y = y0 + (i % 7) * yStep, c = Math.cos(a), s = Math.sin(a), cx = c * r, cz = s * r;
      const P = [[cx - c * sz / 2, y - sz / 2, cz - s * sz / 2], [cx - c * sz / 2, y + sz / 2, cz - s * sz / 2], [cx + c * sz / 2, y + sz / 2, cz + s * sz / 2], [cx + c * sz / 2, y - sz / 2, cz + s * sz / 2]];
      mb.quad(P, [-s * 0.3, 0.9, c * 0.3], [[0, 1], [0, 0], [1, 0], [1, 1]]);
      mb.quad([P[3], P[2], P[1], P[0]], [s * 0.3, 0.9, -c * 0.3], [[1, 1], [1, 0], [0, 0], [0, 1]]);
    }
  }

  const SEGMENT = { wall: 1, fence: 1, picket: 1, palisade: 1, ruinwall: 1, sandbags: 1, wire: 1, pier: 1, deck: 1, arch: 1, dam: 1 };
  Z.PieceGfx = B;
  Z.buildPieceMesh = (mb, p) => {
    const f = B[p.kind];
    if (!f) return;
    const s0 = mb.n;
    f(mb, p);
    if (SEGMENT[p.kind]) mb.transformFrom(s0, M4.trs(p.x, p.y || 0, p.z, 0, 0, 0));
    else mb.transformFrom(s0, M4.trs(p.x, p.y || 0, p.z, -(p.yaw || 0), 0, 0, p.scale || 1));
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
