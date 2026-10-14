(function (Z) {
  'use strict';

  const { tn, tfbm, cellular } = Z.TexNoise;
  const mk = Z.mkCanvas;

  const noiseFill = (g, S, base, amp, scale, seed, x0 = 0, y0 = 0, w = S, h = S) => {
    const img = g.getImageData(x0, y0, w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = tfbm((x0 + x) / S * scale, (y0 + y) / S * scale, scale, 4, seed) - 0.5;
      const fine = tn((x0 + x) / S * 128, (y0 + y) / S * 128, 128, seed + 3) - 0.5;
      const i = (y * w + x) * 4;
      const k = 1 + n * amp + fine * amp * 0.35;
      d[i] = Z.clamp(base[0] * k, 0, 255); d[i + 1] = Z.clamp(base[1] * k, 0, 255); d[i + 2] = Z.clamp(base[2] * k, 0, 255); d[i + 3] = 255;
    }
    g.putImageData(img, x0, y0);
  };
  const modulate = (g, S, fn, x0 = 0, y0 = 0, w = S, h = S) => {
    const img = g.getImageData(x0, y0, w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const o = fn((x0 + x) / S, (y0 + y) / S, d[i], d[i + 1], d[i + 2], d[i + 3]);
      if (!o) continue;
      d[i] = Z.clamp(o[0], 0, 255); d[i + 1] = Z.clamp(o[1], 0, 255); d[i + 2] = Z.clamp(o[2], 0, 255); if (o.length > 3) d[i + 3] = Z.clamp(o[3], 0, 255);
    }
    g.putImageData(img, x0, y0);
  };
  const rgb = c => 'rgb(' + c.map(v => Math.round(Z.clamp(v, 0, 255))).join(',') + ')';
  const rgba = (c, a) => 'rgba(' + c.map(v => Math.round(Z.clamp(v, 0, 255))).join(',') + ',' + a + ')';

  const bricks = (g, x0, y0, w, h, S, col, mortar, bw, bh, seed) => {
    g.fillStyle = rgb(mortar);
    g.fillRect(x0, y0, w, h);
    for (let r = 0; r * bh < h; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let c = -1; c * bw < w + bw; c++) {
        const k = 0.82 + Z.hash2(c, r, seed) * 0.3;
        g.fillStyle = rgb(col.map(v => v * k));
        g.fillRect(x0 + c * bw + off + 1, y0 + r * bh + 1, bw - 2, bh - 2);
      }
    }
  };

  const windowPane = (g, x, y, w, h, variant, frame, opts = {}) => {
    const glass = opts.glass || [34, 44, 52];
    if (variant === 2) {
      g.fillStyle = rgb([22, 18, 16]);
      g.fillRect(x, y, w, h);
      for (let i = 0; i < 4; i++) {
        const py = y + h * (0.12 + i * 0.22);
        g.fillStyle = rgb([118 + i * 6, 92, 64]);
        g.fillRect(x - 3, py, w + 6, h * 0.16);
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(x - 3, py + h * 0.14, w + 6, 2);
      }
      return;
    }
    if (variant === 3) {
      g.fillStyle = rgb([12, 10, 9]);
      g.fillRect(x, y, w, h);
      const grd = g.createRadialGradient(x + w / 2, y - h * 0.1, 2, x + w / 2, y, h * 1.1);
      grd.addColorStop(0, 'rgba(10,8,6,0.85)');
      grd.addColorStop(1, 'rgba(10,8,6,0)');
      g.fillStyle = grd;
      g.fillRect(x - w * 0.6, y - h * 0.9, w * 2.2, h * 1.5);
      return;
    }
    g.fillStyle = rgb(frame);
    g.fillRect(x - 3, y - 3, w + 6, h + 6);
    const panes = opts.panes || [2, 2];
    const pw = (w - (panes[0] - 1) * 3) / panes[0], ph = (h - (panes[1] - 1) * 3) / panes[1];
    for (let i = 0; i < panes[0]; i++) for (let j = 0; j < panes[1]; j++) {
      const px = x + i * (pw + 3), py = y + j * (ph + 3);
      const grd = g.createLinearGradient(px, py, px + pw, py + ph);
      if (variant === 1 && (i + j) % 2 === 0) {
        g.fillStyle = rgb([8, 8, 9]);
        g.fillRect(px, py, pw, ph);
        g.fillStyle = rgba([150, 160, 170], 0.5);
        g.beginPath();
        g.moveTo(px, py); g.lineTo(px + pw * 0.6, py); g.lineTo(px + pw * 0.15, py + ph * 0.7); g.closePath();
        g.fill();
        continue;
      }
      grd.addColorStop(0, rgb(glass.map(v => v * 1.6)));
      grd.addColorStop(0.5, rgb(glass));
      grd.addColorStop(1, rgb(glass.map(v => v * 0.7)));
      g.fillStyle = grd;
      g.fillRect(px, py, pw, ph);
      if (variant === 1) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(px + pw * 0.3, py + ph * 0.2, pw * 0.4, ph * 0.5); }
    }
  };

  const soot = (g, x, y, w, h, a) => {
    const grd = g.createLinearGradient(x, y + h, x, y - h * 0.8);
    grd.addColorStop(0, 'rgba(15,12,10,' + a + ')');
    grd.addColorStop(1, 'rgba(15,12,10,0)');
    g.fillStyle = grd;
    g.fillRect(x - w * 0.15, y - h * 0.8, w * 1.3, h * 1.8);
  };

  const FACADES = {
    stalin(g, S, v, ox, oy) {
      const M = S / 2;
      noiseFill(g, S, [196, 172, 128], 0.18, 6, 101 + v, ox, oy, M, M);
      g.fillStyle = rgba([150, 128, 92], 0.5);
      g.fillRect(ox, oy + M * 0.86, M, M * 0.05);
      g.fillStyle = rgba([226, 208, 168], 0.6);
      g.fillRect(ox, oy + M * 0.83, M, M * 0.03);
      const wx = ox + M * 0.3, wy = oy + M * 0.2, ww = M * 0.4, wh = M * 0.5;
      g.fillStyle = rgb([214, 198, 160]);
      g.fillRect(wx - M * 0.06, wy - M * 0.06, ww + M * 0.12, M * 0.05);
      g.fillRect(wx - M * 0.05, wy + wh + M * 0.02, ww + M * 0.1, M * 0.05);
      g.fillStyle = rgb([176, 150, 110]);
      g.beginPath(); g.moveTo(wx + ww * 0.4, wy - M * 0.06); g.lineTo(wx + ww * 0.5, wy - M * 0.12); g.lineTo(wx + ww * 0.6, wy - M * 0.06); g.fill();
      windowPane(g, wx, wy, ww, wh, v, [232, 226, 210], { panes: [2, 3] });
      if (v === 3) soot(g, wx, wy, ww, wh, 0.75);
    },
    stalinGround(g, S, v, ox, oy) {
      const M = S / 2;
      noiseFill(g, S, [168, 150, 120], 0.2, 6, 111 + v, ox, oy, M, M);
      for (let r = 0; r < 8; r++) { g.fillStyle = rgba([110, 96, 74], 0.55); g.fillRect(ox, oy + r * M / 8, M, 2); }
      const wx = ox + M * 0.14, wy = oy + M * 0.18, ww = M * 0.72, wh = M * 0.6;
      if (v === 0 || v === 1) {
        g.fillStyle = rgb([70, 58, 44]); g.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
        windowPane(g, wx, wy, ww, wh, v, [62, 52, 40], { panes: [3, 2], glass: [40, 52, 58] });
      } else if (v === 2) {
        windowPane(g, wx, wy, ww, wh, 2, [60, 50, 40]);
      } else {
        g.fillStyle = rgb([40, 34, 28]); g.fillRect(wx + ww * 0.25, wy, ww * 0.5, wh + M * 0.2);
        g.fillStyle = rgb([92, 66, 44]); g.fillRect(wx + ww * 0.28, wy + 3, ww * 0.21, wh + M * 0.2 - 3); g.fillRect(wx + ww * 0.51, wy + 3, ww * 0.21, wh + M * 0.2 - 3);
      }
    },
    khrushRed(g, S, v, ox, oy) {
      const M = S / 2;
      bricks(g, ox, oy, M, M, S, [150, 74, 52], [150, 140, 128], M / 8, M / 21, 120 + v);
      const wx = ox + M * 0.26, wy = oy + M * 0.26, ww = M * 0.48, wh = M * 0.46;
      g.fillStyle = rgb([120, 112, 104]); g.fillRect(wx - 4, wy + wh + 2, ww + 8, M * 0.04);
      windowPane(g, wx, wy, ww, wh, v, [214, 210, 200], { panes: [2, 2] });
      if (v === 3) soot(g, wx, wy, ww, wh, 0.8);
    },
    khrushWhite(g, S, v, ox, oy) {
      const M = S / 2;
      bricks(g, ox, oy, M, M, S, [206, 202, 190], [160, 156, 148], M / 8, M / 21, 130 + v);
      const wx = ox + M * 0.26, wy = oy + M * 0.26, ww = M * 0.48, wh = M * 0.46;
      g.fillStyle = rgb([140, 136, 128]); g.fillRect(wx - 4, wy + wh + 2, ww + 8, M * 0.04);
      windowPane(g, wx, wy, ww, wh, v, [190, 150, 110], { panes: [2, 2] });
      if (v === 3) soot(g, wx, wy, ww, wh, 0.8);
    },
    panel(g, S, v, ox, oy) {
      const M = S / 2;
      noiseFill(g, S, [168, 166, 158], 0.16, 5, 141 + v, ox, oy, M, M);
      g.fillStyle = rgba([60, 60, 58], 0.8);
      g.fillRect(ox, oy, M, 3); g.fillRect(ox, oy, 3, M);
      const tiles = (Z.hash2(v, 3, 145) > 0.5);
      if (tiles) for (let y = 0; y < M; y += 8) for (let x = 0; x < M; x += 8) { g.fillStyle = rgba([200 + Z.hash2(x, y, 146) * 30, 196, 184], 0.18); g.fillRect(ox + x + 1, oy + y + 1, 6, 6); }
      const wx = ox + M * 0.2, wy = oy + M * 0.25, ww = M * 0.6, wh = M * 0.44;
      if (v === 2 || v === 0) {
        g.fillStyle = rgb([120, 118, 112]); g.fillRect(wx - M * 0.08, wy + wh * 0.55, ww + M * 0.16, wh * 0.5 + M * 0.06);
        windowPane(g, wx, wy, ww, wh * 0.52, v === 2 ? 1 : 0, [196, 196, 190], { panes: [3, 1] });
        g.fillStyle = rgba([90, 90, 86], 0.9); for (let i = 0; i < 6; i++) g.fillRect(wx - M * 0.06 + i * (ww + M * 0.12) / 5, wy + wh * 0.6, 2, wh * 0.42);
      } else windowPane(g, wx, wy, ww, wh, v === 1 ? 1 : 3, [196, 196, 190], { panes: [2, 2] });
    },
    industrial(g, S, v, ox, oy) {
      const M = S / 2;
      if (v % 2) bricks(g, ox, oy, M, M, S, [120, 82, 64], [96, 88, 80], M / 7, M / 18, 150 + v);
      else noiseFill(g, S, [140, 136, 126], 0.2, 5, 151 + v, ox, oy, M, M);
      const wx = ox + M * 0.08, wy = oy + M * 0.2, ww = M * 0.84, wh = M * 0.55;
      g.fillStyle = rgb([58, 62, 60]); g.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
        const px = wx + i * ww / 6 + 2, py = wy + j * wh / 4 + 2, pw = ww / 6 - 4, ph = wh / 4 - 4;
        const broken = Z.hash2(i + v * 7, j, 152) < (v === 2 ? 0.7 : 0.25);
        g.fillStyle = broken ? rgb([10, 10, 10]) : rgb([70 + j * 6, 84 + j * 6, 82]);
        g.fillRect(px, py, pw, ph);
      }
      if (v === 3) { g.fillStyle = rgb([120, 82, 64]); g.fillRect(wx, wy, ww, wh); bricks(g, wx, wy, ww, wh, S, [104, 74, 60], [80, 76, 70], M / 9, M / 22, 158); }
      modulate(g, S, (u, w, r, gg, b) => { const s = tfbm(u * 6, w * 3, 6, 3, 159) * (w * 2 % 1); return [r * (1 - s * 0.35), gg * (1 - s * 0.35), b * (1 - s * 0.3)]; }, ox, oy, M, M);
    },
    house(g, S, v, ox, oy) {
      const M = S / 2;
      const base = [[226, 222, 206], [176, 196, 214], [226, 206, 150], [208, 214, 196]][v];
      noiseFill(g, S, base, 0.14, 6, 161 + v, ox, oy, M, M);
      modulate(g, S, (u, w, r, gg, b) => { const c = tn(u * 30, w * 30, 30, 162) > 0.82 ? 0.82 : 1; return [r * c, gg * c, b * c]; }, ox, oy, M, M);
      const wx = ox + M * 0.32, wy = oy + M * 0.28, ww = M * 0.36, wh = M * 0.42;
      const trim = v === 1 ? [240, 240, 236] : [70, 110, 170];
      g.fillStyle = rgb(trim);
      g.fillRect(wx - M * 0.07, wy - M * 0.09, ww + M * 0.14, M * 0.07);
      g.beginPath(); g.moveTo(wx - M * 0.07, wy - M * 0.09); g.lineTo(wx + ww / 2, wy - M * 0.17); g.lineTo(wx + ww + M * 0.07, wy - M * 0.09); g.fill();
      g.fillRect(wx - M * 0.07, wy + wh, ww + M * 0.14, M * 0.06);
      g.fillStyle = rgb([92, 128, 80]);
      if (v !== 3) { g.fillRect(wx - M * 0.18, wy, M * 0.12, wh); g.fillRect(wx + ww + M * 0.06, wy, M * 0.12, wh); }
      windowPane(g, wx, wy, ww, wh, v === 3 ? 1 : 0, trim, { panes: [2, 2] });
    },
    modern(g, S, v, ox, oy) {
      const M = S / 2;
      noiseFill(g, S, [206, 204, 196], 0.12, 5, 171 + v, ox, oy, M, M);
      const wx = ox + M * 0.06, wy = oy + M * 0.22, ww = M * 0.88, wh = M * 0.52;
      windowPane(g, wx, wy, ww, wh, v === 3 ? 3 : v === 2 ? 1 : 0, [120, 124, 128], { panes: [3, 2], glass: [44, 58, 68] });
      g.fillStyle = rgba([150, 148, 140], 0.9); g.fillRect(ox, oy + M * 0.8, M, M * 0.04);
    }
  };
  Z.FACADE_KEYS = Object.keys(FACADES);

  const MATS = {
    concrete: g => { noiseFill(g, 256, [150, 148, 142], 0.22, 6, 201); modulate(g, 256, (u, v, r, gg, b) => { const s = Z.smooth(0.55, 0.9, tfbm(u * 3, v * 9, 3, 3, 202)) * 0.3; return [r * (1 - s), gg * (1 - s), b * (1 - s)]; }); },
    brickRed: g => bricks(g, 0, 0, 256, 256, 256, [150, 74, 52], [150, 140, 128], 32, 12, 203),
    brickWhite: g => bricks(g, 0, 0, 256, 256, 256, [206, 202, 190], [160, 156, 148], 32, 12, 204),
    plasterCream: g => noiseFill(g, 256, [196, 172, 128], 0.18, 6, 205),
    plasterWhite: g => noiseFill(g, 256, [214, 212, 204], 0.16, 6, 206),
    panel: g => { noiseFill(g, 256, [168, 166, 158], 0.16, 5, 207); g.fillStyle = 'rgba(60,60,58,0.8)'; g.fillRect(0, 0, 256, 3); g.fillRect(0, 0, 3, 256); },
    asphalt: g => { noiseFill(g, 256, [78, 78, 80], 0.3, 8, 208); modulate(g, 256, (u, v, r, gg, b) => { const [d1, d2] = cellular(u * 6, v * 6, 6, 209); const c = 1 - (1 - Z.smooth(0, 0.03, d2 - d1)) * 0.5; const p = tn(u * 90, v * 90, 90, 210) > 0.9 ? 1.25 : 1; return [r * c * p, gg * c * p, b * c * p]; }); },
    sidewalk: g => { noiseFill(g, 256, [150, 146, 138], 0.18, 6, 211); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(70,68,64,0.7)'; g.fillRect(i * 64, 0, 2, 256); g.fillRect(0, i * 64, 256, 2); } },
    roofFelt: g => { noiseFill(g, 256, [58, 56, 54], 0.35, 7, 212); modulate(g, 256, (u, v, r, gg, b) => { const s = Z.smooth(0.6, 0.85, tfbm(u * 4, v * 4, 4, 3, 213)); return [r + s * 40, gg + s * 38, b + s * 30]; }); },
    roofSlate: g => { noiseFill(g, 256, [150, 150, 142], 0.18, 5, 214); modulate(g, 256, (u, v, r, gg, b) => { const w = 0.85 + 0.15 * Math.sin(u * Math.PI * 2 * 16); const m = tfbm(u * 5, v * 5, 5, 3, 215) > 0.62 ? 0.75 : 1; return [r * w * m, gg * w * m * 1.02, b * w * m * 0.9]; }); },
    roofTin: g => { noiseFill(g, 256, [118, 82, 58], 0.3, 6, 216); modulate(g, 256, (u, v, r, gg, b) => { const w = 0.8 + 0.2 * Math.sin(u * Math.PI * 2 * 12); const p = tfbm(u * 6, v * 6, 6, 3, 217); return [r * w * (0.8 + p * 0.5), gg * w * (0.7 + p * 0.4), b * w * (0.6 + p * 0.3)]; }); },
    wood: g => { noiseFill(g, 256, [124, 94, 64], 0.25, 4, 218); modulate(g, 256, (u, v, r, gg, b) => { const plank = Math.floor(v * 8); const k = 0.82 + Z.hash2(plank, 0, 219) * 0.3; const grain = 0.9 + 0.1 * Math.sin((u * 60 + tn(u * 4, v * 32, 4, 220) * 8)); const seam = (v * 8 % 1) < 0.04 ? 0.5 : 1; return [r * k * grain * seam, gg * k * grain * seam, b * k * grain * seam]; }); },
    rust: g => { noiseFill(g, 256, [120, 70, 44], 0.4, 6, 221); modulate(g, 256, (u, v, r, gg, b) => { const p = tfbm(u * 8, v * 8, 8, 4, 222); return p > 0.6 ? [r * 0.7, gg * 0.65, b * 0.6] : null; }); },
    paintGreen: g => { noiseFill(g, 256, [70, 104, 76], 0.18, 5, 223); modulate(g, 256, (u, v, r, gg, b) => { const p = tfbm(u * 7, v * 7, 7, 4, 224); return p > 0.66 ? [120, 72, 44] : null; }); },
    plasterBlue: g => noiseFill(g, 256, [150, 176, 198], 0.16, 6, 225),
    granite: g => { noiseFill(g, 256, [128, 116, 110], 0.22, 8, 226); modulate(g, 256, (u, v, r, gg, b) => { const s = tn(u * 140, v * 140, 140, 227); return s > 0.86 ? [r * 0.55, gg * 0.55, b * 0.55] : s < 0.08 ? [r * 1.3, gg * 1.25, b * 1.2] : null; }); },
    debris: g => { noiseFill(g, 256, [118, 112, 104], 0.3, 8, 228); modulate(g, 256, (u, v, r, gg, b) => { const [d1, d2] = cellular(u * 10, v * 10, 10, 229); const c = Z.hash2(Math.floor(u * 10), Math.floor(v * 10), 230); const k = 0.7 + (d2 - d1) * 0.8; return c > 0.7 ? [150 * k, 82 * k, 62 * k] : [r * k, gg * k, b * k]; }); },
    bark: g => { noiseFill(g, 256, [86, 72, 58], 0.3, 4, 231); modulate(g, 256, (u, v, r, gg, b) => { const f = 0.75 + 0.25 * Math.abs(Math.sin(u * 40 + tn(u * 6, v * 2, 6, 232) * 6)); return [r * f, gg * f, b * f]; }); },
    gravel: g => { noiseFill(g, 256, [130, 116, 98], 0.25, 8, 233); modulate(g, 256, (u, v, r, gg, b) => { const [d1] = cellular(u * 40, v * 40, 40, 234); return d1 < 0.25 ? [r * 1.15, gg * 1.12, b * 1.1] : [r * 0.85, gg * 0.85, b * 0.85]; }); },
    glass: g => { const grd = g.createLinearGradient(0, 0, 256, 256); grd.addColorStop(0, '#3a4a54'); grd.addColorStop(1, '#141c22'); g.fillStyle = grd; g.fillRect(0, 0, 256, 256); },
    marble: g => { noiseFill(g, 256, [214, 210, 200], 0.08, 4, 235); modulate(g, 256, (u, v, r, gg, b) => { const vein = Math.abs(Math.sin((u + tfbm(u * 3, v * 3, 3, 4, 236) * 1.5) * 12)); return vein < 0.06 ? [r * 0.8, gg * 0.8, b * 0.82] : null; }); },
    railbed: g => { noiseFill(g, 256, [104, 98, 90], 0.3, 10, 237); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgb(76,62,48)'; g.fillRect(0, i * 64 + 8, 256, 26); } },
    paintRed: g => noiseFill(g, 256, [168, 38, 30], 0.14, 5, 238),
    tiles: g => { noiseFill(g, 256, [196, 200, 194], 0.06, 4, 239); for (let i = 0; i < 16; i++) { g.fillStyle = 'rgba(110,110,104,0.7)'; g.fillRect(i * 16, 0, 1, 256); g.fillRect(0, i * 16, 256, 1); } },
    wallpaper: g => { noiseFill(g, 256, [170, 156, 120], 0.08, 4, 240); g.strokeStyle = 'rgba(110,90,60,0.45)'; g.lineWidth = 3; for (let x = 0; x < 256; x += 32) for (let y = 0; y < 256; y += 48) { g.beginPath(); g.moveTo(x + 16, y + 6); g.quadraticCurveTo(x + 28, y + 24, x + 16, y + 42); g.quadraticCurveTo(x + 4, y + 24, x + 16, y + 6); g.stroke(); } modulate(g, 256, (u, v, r, gg, b) => { const s = Z.smooth(0.6, 0.9, tfbm(u * 3, v * 3, 3, 3, 241)); return [r * (1 - s * 0.35), gg * (1 - s * 0.38), b * (1 - s * 0.4)]; }); },
    linoleum: g => { noiseFill(g, 256, [140, 96, 64], 0.12, 5, 242); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) { g.fillStyle = 'rgba(80,50,30,0.25)'; g.fillRect(i * 32, j * 32, 32, 32); } },
    parquet: g => { for (let i = 0; i < 8; i++) for (let j = 0; j < 16; j++) { const k = 0.8 + Z.hash2(i, j, 243) * 0.3; g.fillStyle = rgb([150 * k, 104 * k, 62 * k]); const vertical = (i + Math.floor(j / 2)) % 2; if (vertical) g.fillRect(i * 32 + 1, j * 16 + 1, 15, 15), g.fillRect(i * 32 + 17, j * 16 + 1, 14, 15); else g.fillRect(i * 32 + 1, j * 16 + 1, 30, 7), g.fillRect(i * 32 + 1, j * 16 + 9, 30, 6); } },
    fabric: g => { noiseFill(g, 256, [110, 46, 40], 0.12, 6, 244); modulate(g, 256, (u, v, r, gg, b) => { const w = (Math.floor(u * 128) + Math.floor(v * 128)) % 2 ? 0.92 : 1.05; return [r * w, gg * w, b * w]; }); },
    soil: g => noiseFill(g, 256, [84, 66, 48], 0.3, 8, 245),
    blank: g => { g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, 256, 256); },
    metalGrey: g => { noiseFill(g, 256, [118, 122, 124], 0.14, 6, 246); modulate(g, 256, (u, v, r, gg, b) => { const s = tfbm(u * 6, v * 6, 6, 3, 247); return s > 0.68 ? [r * 0.85 + 30, gg * 0.75, b * 0.6] : null; }); },
    skin: g => { noiseFill(g, 256, [200, 200, 200], 0.06, 8, 248); },
    cloth: g => { noiseFill(g, 256, [196, 196, 196], 0.1, 6, 249); modulate(g, 256, (u, v, r, gg, b) => { const w = ((Math.floor(u * 96) + Math.floor(v * 96)) % 2) ? 0.94 : 1.04; return [r * w, gg * w, b * w]; }); },
    quilt: g => { noiseFill(g, 256, [196, 196, 196], 0.12, 6, 250); modulate(g, 256, (u, v, r, gg, b) => { const q = Math.abs(Math.sin(v * Math.PI * 10)); const k = 0.7 + 0.35 * Math.pow(q, 0.4); return [r * k, gg * k, b * k]; }); },
    leather: g => { noiseFill(g, 256, [200, 200, 200], 0.18, 9, 251); modulate(g, 256, (u, v, r, gg, b) => { const c = tn(u * 60, v * 60, 60, 252) > 0.8 ? 0.85 : 1; return [r * c, gg * c, b * c]; }); },
    stripes: g => { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 16; i++) { g.fillStyle = '#28305a'; g.fillRect(0, i * 16, 256, 7); } modulate(g, 256, (u, v, r, gg, b) => { const n = 0.92 + tn(u * 40, v * 40, 40, 253) * 0.12; return [r * n, gg * n, b * n]; }); },
    rubber: g => { noiseFill(g, 256, [92, 98, 88], 0.1, 6, 254); },
    fur: g => { noiseFill(g, 256, [190, 190, 190], 0.25, 16, 255); modulate(g, 256, (u, v, r, gg, b) => { const s = 0.8 + 0.3 * tn(u * 160, v * 40, 160, 256); return [r * s, gg * s, b * s]; }); },
    chitinStripes: g => { g.fillStyle = '#d8a63a'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 5; i++) { g.fillStyle = '#16120c'; g.fillRect(i * 52 + 8, 0, 20, 256); } modulate(g, 256, (u, v, r, gg, b) => { const n = 0.85 + tfbm(u * 8, v * 8, 8, 3, 257) * 0.3; return [r * n, gg * n, b * n]; }); },
    feathers: g => { noiseFill(g, 256, [226, 224, 216], 0.1, 6, 258); modulate(g, 256, (u, v, r, gg, b) => { const f = 0.88 + 0.12 * Math.abs(Math.sin((u * 3 + v * 9) * Math.PI * 2)); return [r * f, gg * f, b * f]; }); },
    fishskin: g => { noiseFill(g, 256, [86, 92, 74], 0.25, 8, 259); modulate(g, 256, (u, v, r, gg, b) => { const sp = tn(u * 30, v * 30, 30, 260) > 0.72 ? 0.7 : 1; return [r * sp, gg * sp, b * sp]; }); },
    slag: g => { noiseFill(g, 256, [70, 62, 56], 0.35, 7, 261); modulate(g, 256, (u, v, r, gg, b) => { const [d1, d2] = cellular(u * 7, v * 7, 7, 262); const crack = 1 - Z.smooth(0, 0.06, d2 - d1); return crack > 0.3 ? [255 * crack, 120 * crack, 30 * crack] : null; }); },
    robotPaint: g => { noiseFill(g, 256, [170, 172, 160], 0.12, 6, 263); modulate(g, 256, (u, v, r, gg, b) => { const s = tfbm(u * 6, v * 6, 6, 3, 264); const rv = (u * 8 % 1) < 0.02 || (v * 8 % 1) < 0.02 ? 0.7 : 1; return s > 0.7 ? [r * 0.7 + 40, gg * 0.55, b * 0.45] : [r * rv, gg * rv, b * rv]; }); },
    gunMetal: g => { noiseFill(g, 256, [70, 72, 76], 0.12, 10, 265); },
    gunWood: g => { noiseFill(g, 256, [130, 76, 40], 0.18, 4, 266); modulate(g, 256, (u, v, r, gg, b) => { const gr = 0.85 + 0.15 * Math.sin(u * 50 + tn(u * 3, v * 20, 3, 267) * 6); return [r * gr, gg * gr, b * gr]; }); },
    bakelite: g => noiseFill(g, 256, [96, 52, 28], 0.1, 6, 268),
    thatch: g => { noiseFill(g, 256, [150, 124, 72], 0.3, 6, 270); modulate(g, 256, (u, v, r, gg, b) => { const st = 0.75 + 0.35 * tn(u * 120, v * 12, 120, 271); return [r * st, gg * st, b * st]; }); },
    logs: g => { for (let i = 0; i < 8; i++) { const k = 0.8 + Z.hash2(i, 1, 272) * 0.3; const grd = g.createLinearGradient(i * 32, 0, i * 32 + 32, 0); grd.addColorStop(0, rgb([60 * k, 44 * k, 30 * k])); grd.addColorStop(0.5, rgb([130 * k, 100 * k, 70 * k])); grd.addColorStop(1, rgb([60 * k, 44 * k, 30 * k])); g.fillStyle = grd; g.fillRect(i * 32, 0, 32, 256); } modulate(g, 256, (u, v, r, gg, b) => { const n = 0.85 + tn(u * 40, v * 160, 40, 273) * 0.3; return [r * n, gg * n, b * n]; }); },
    canvas: g => { noiseFill(g, 256, [120, 118, 86], 0.15, 6, 274); modulate(g, 256, (u, v, r, gg, b) => { const w = ((Math.floor(u * 128) + Math.floor(v * 128)) % 2) ? 0.95 : 1.03; return [r * w, gg * w, b * w]; }); },
    corrugated: g => { noiseFill(g, 256, [130, 128, 120], 0.25, 6, 275); modulate(g, 256, (u, v, r, gg, b) => { const w = 0.78 + 0.22 * Math.sin(u * Math.PI * 2 * 14); const rs = tfbm(u * 5, v * 5, 5, 3, 276) > 0.6 ? [1.15, 0.8, 0.6] : [1, 1, 1]; return [r * w * rs[0], gg * w * rs[1], b * w * rs[2]]; }); },
    sandbag: g => { g.fillStyle = '#6e6046'; g.fillRect(0, 0, 256, 256); for (let r = 0; r < 4; r++) for (let c = -1; c < 4; c++) { const x = c * 80 + (r % 2) * 40, y = r * 64; const k = 0.85 + Z.hash2(c, r, 277) * 0.25; g.fillStyle = rgb([150 * k, 132 * k, 96 * k]); g.beginPath(); g.ellipse(x + 40, y + 32, 38, 28, 0, 0, Math.PI * 2); g.fill(); } modulate(g, 256, (u, v, r, gg, b) => { const n = 0.9 + tn(u * 64, v * 64, 64, 278) * 0.2; return [r * n, gg * n, b * n]; }); },
    awning: g => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#d8d0c0' : '#b03a2a'; g.fillRect(i * 32, 0, 32, 256); } modulate(g, 256, (u, v, r, gg, b) => { const n = 0.85 + tfbm(u * 4, v * 4, 4, 3, 279) * 0.3; return [r * n, gg * n, b * n]; }); },
    bronze: g => { noiseFill(g, 256, [92, 104, 88], 0.25, 6, 280); modulate(g, 256, (u, v, r, gg, b) => { const s = tfbm(u * 8, v * 8, 8, 3, 281); return s > 0.6 ? [r * 0.8, gg * 1.15, b * 1.05] : [r * 1.05 + 10, gg * 0.95, b * 0.8]; }); },
    concretePanel: g => { noiseFill(g, 256, [160, 156, 148], 0.18, 6, 282); g.fillStyle = 'rgba(70,68,64,0.8)'; g.fillRect(0, 0, 256, 4); g.fillRect(0, 128, 256, 4); g.fillRect(0, 0, 4, 256); g.fillRect(128, 0, 4, 256); },
    glow: g => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); }
  };
  Z.MAT_KEYS = Object.keys(MATS);
  Z.MAT = {};
  Z.MAT_KEYS.forEach((k, i) => { Z.MAT[k] = i; });
  Z.FAC = {};
  Z.FACADE_KEYS.forEach((k, i) => { Z.FAC[k] = i; });

  Z.Tex.facades = (S = 512) => Z.FACADE_KEYS.map(k => {
    const c = mk(S, S), g = c.getContext('2d');
    for (let v = 0; v < 4; v++) FACADES[k](g, S, v, (v % 2) * S / 2, Math.floor(v / 2) * S / 2);
    return c;
  });
  Z.Tex.materials = () => Z.MAT_KEYS.map(k => {
    const c = mk(256, 256), g = c.getContext('2d');
    MATS[k](g);
    return c;
  });

  const LEAVES = {
    oak: { c: [70, 96, 44], c2: [104, 128, 58], n: 70, r: [0.04, 0.08], shape: 'round' },
    poplar: { c: [78, 104, 52], c2: [118, 140, 70], n: 110, r: [0.025, 0.05], shape: 'tall' },
    acacia: { c: [92, 116, 56], c2: [140, 156, 84], n: 120, r: [0.02, 0.045], shape: 'round' },
    pine: { c: [44, 68, 42], c2: [72, 96, 56], n: 160, r: [0.01, 0.02], shape: 'needle' },
    willow: { c: [96, 122, 74], c2: [140, 160, 102], n: 140, r: [0.012, 0.03], shape: 'droop' },
    dry: { c: [96, 84, 50], c2: [128, 112, 64], n: 80, r: [0.03, 0.06], shape: 'round' }
  };
  Z.LEAF_KEYS = Object.keys(LEAVES);
  const paintLeaves = (g, S, L, seed) => {
    g.clearRect(0, 0, S, S);
    const R = Z.rng(seed);
    for (let i = 0; i < L.n * 3; i++) {
      let x, y;
      if (L.shape === 'tall') { x = 0.5 + (R() - 0.5) * 0.55 * (1 - Math.abs(R() - 0.5)); y = 0.06 + R() * 0.9; }
      else if (L.shape === 'droop') { x = R(); y = R() * 0.95; }
      else { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.44; x = 0.5 + Math.cos(a) * r; y = 0.5 + Math.sin(a) * r * 0.9; }
      const rad = (L.r[0] + R() * (L.r[1] - L.r[0])) * S;
      const sh = 0.55 + 0.45 * (1 - y) + (R() - 0.5) * 0.2;
      const col = [Z.lerp(L.c[0], L.c2[0], R()) * sh, Z.lerp(L.c[1], L.c2[1], R()) * sh, Z.lerp(L.c[2], L.c2[2], R()) * sh];
      g.fillStyle = rgb(col);
      if (L.shape === 'needle' || L.shape === 'droop') {
        g.save(); g.translate(x * S, y * S); g.rotate(L.shape === 'droop' ? Math.PI / 2 + (R() - 0.5) * 0.4 : R() * Math.PI);
        g.fillRect(-rad * 1.5, -rad * 0.2, rad * 3, rad * 0.4); g.restore();
      } else {
        g.beginPath(); g.ellipse(x * S, y * S, rad, rad * 0.65, R() * Math.PI, 0, Math.PI * 2); g.fill();
      }
    }
    if (L.shape !== 'needle') {
      g.strokeStyle = 'rgba(70,52,36,0.8)'; g.lineWidth = S * 0.008;
      for (let i = 0; i < 5; i++) { const R2 = Z.rng(seed + i * 9); g.beginPath(); g.moveTo(S * 0.5, S * 0.98); g.quadraticCurveTo(S * (0.3 + R2() * 0.4), S * 0.6, S * (0.15 + R2() * 0.7), S * (0.2 + R2() * 0.4)); g.stroke(); }
    }
  };
  Z.Tex.foliage = (S = 256) => {
    const out = Z.LEAF_KEYS.map((k, i) => { const c = mk(S, S); paintLeaves(c.getContext('2d'), S, LEAVES[k], 300 + i * 13); return c; });
    const grass = mk(S, S), g = grass.getContext('2d');
    g.clearRect(0, 0, S, S);
    const R = Z.rng(377);
    for (let i = 0; i < 90; i++) {
      const x = 0.1 + R() * 0.8, h = 0.45 + R() * 0.5, lean = (R() - 0.5) * 0.35, w = 0.012 + R() * 0.012;
      const col = R() < 0.5 ? [146 + R() * 30, 134 + R() * 20, 76] : [96 + R() * 30, 118 + R() * 20, 56];
      g.fillStyle = rgb(col);
      g.beginPath(); g.moveTo((x - w) * S, S); g.quadraticCurveTo((x + lean * 0.5) * S, (1 - h * 0.5) * S, (x + lean) * S, (1 - h) * S); g.lineTo((x + w) * S, S); g.fill();
    }
    out.push(grass);
    const reed = mk(S, S), r = reed.getContext('2d');
    r.clearRect(0, 0, S, S);
    for (let i = 0; i < 40; i++) {
      const x = 0.1 + R() * 0.8, h = 0.6 + R() * 0.38, lean = (R() - 0.5) * 0.2;
      r.strokeStyle = rgb([120 + R() * 30, 128 + R() * 20, 70]); r.lineWidth = S * 0.012;
      r.beginPath(); r.moveTo(x * S, S); r.quadraticCurveTo((x + lean * 0.5) * S, (1 - h * 0.5) * S, (x + lean) * S, (1 - h) * S); r.stroke();
      if (R() < 0.35) { r.fillStyle = rgb([92, 64, 40]); r.fillRect((x + lean) * S - S * 0.012, (1 - h) * S, S * 0.024, S * 0.08); }
    }
    out.push(reed);
    return out;
  };
  Z.FOLIAGE = {};
  Z.LEAF_KEYS.concat(['grass', 'reed']).forEach((k, i) => { Z.FOLIAGE[k] = i; });
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
