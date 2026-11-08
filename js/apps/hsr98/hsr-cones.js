(function (H) {
  'use strict';
  const G = H.Gfx;
  const cache = new Map();
  const SS = 4, GRID_W = 160;

  function brush(back, w, h, fore) {
    let g = back;
    const k = w / 100, kh = h / 140;
    const X = x => x * k, Y = y => y * kh;
    const b = {
      g, k, kh, used: false,
      front() { g = fore; b.g = fore; b.used = true; },
      sky(stops) { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); },
      poly(col, pts) { g.fillStyle = col; g.beginPath(); g.moveTo(X(pts[0]), Y(pts[1])); for (let i = 2; i < pts.length; i += 2) g.lineTo(X(pts[i]), Y(pts[i + 1])); g.closePath(); g.fill(); },
      ell(col, x, y, rx, ry, rot) { g.fillStyle = col; g.beginPath(); g.ellipse(X(x), Y(y), Math.max(0.3, rx * k), Math.max(0.3, ry * kh), rot || 0, 0, Math.PI * 2); g.fill(); },
      rect(col, x, y, rw, rh) { g.fillStyle = col; g.fillRect(X(x), Y(y), rw * k, rh * kh); },
      line(col, pts, lw) { g.strokeStyle = col; g.lineWidth = Math.max(0.6, lw * k); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(X(pts[0]), Y(pts[1])); for (let i = 2; i < pts.length; i += 2) g.lineTo(X(pts[i]), Y(pts[i + 1])); g.stroke(); },
      ring(col, x, y, rx, ry, lw, rot) { g.strokeStyle = col; g.lineWidth = Math.max(0.6, lw * k); g.beginPath(); g.ellipse(X(x), Y(y), rx * k, ry * kh, rot || 0, 0, Math.PI * 2); g.stroke(); },
      glow(x, y, r, col) { const gr = g.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r * k); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X(x - r), Y(y) - r * k, r * 2 * k, r * 2 * k); },
      stars(n, seed, y0, y1, col) { for (let i = 0; i < n; i++) { g.fillStyle = col || G.mix('#000000', '#ffffff', 0.4 + 0.6 * G.hash(i, seed, 1)); g.fillRect(Math.floor(G.hash(i, seed, 2) * w / SS) * SS, Math.floor(Y(y0 + G.hash(seed, i, 3) * (y1 - y0)) / SS) * SS, SS, SS); } },
      twinkle(x, y, r, col) { b.poly(col, [x, y - r, x + r * 0.25, y - r * 0.25, x + r, y, x + r * 0.25, y + r * 0.25, x, y + r, x - r * 0.25, y + r * 0.25, x - r, y, x - r * 0.25, y - r * 0.25]); },
      sprite(cv, x, y, sw, sh, o = {}) {
        g.save();
        g.imageSmoothingEnabled = false;
        if (o.alpha != null) g.globalAlpha = o.alpha;
        g.translate(Math.round(X(x)), Math.round(Y(y)));
        if (o.rot) g.rotate(o.rot);
        if (o.flip) g.scale(-1, 1);
        g.drawImage(cv, Math.round(-sw / 2), Math.round(-sh / 2), sw, sh);
        g.restore();
      },
      bust(look, x, y, size, o) { const s = Math.max(12, Math.round(size * k)); b.sprite(G.bustCanvas(look, s), x, y, s, s, o); },
      limb(pts, w, base, hi, edge) {
        b.line(edge, pts, w + 0.9);
        b.line(base, pts, w);
        if (hi) b.line(hi, pts.map((v, i) => v + (i % 2 ? -w * 0.22 : -w * 0.18)).slice(0, -2), w * 0.35);
      },
      finger(pts, w, C, nail) {
        const n = pts.length / 2;
        for (let i = 0; i < n - 1; i++) b.limb(pts.slice(i * 2, i * 2 + 4), w * (1 - 0.16 * i), C[0], C[1], C[2]);
        if (nail) { const x = pts[pts.length - 2], y = pts[pts.length - 1]; b.ell(nail, x, y, w * 0.32, w * 0.3); }
      },
      bustAt(x, y, size, bx, by) { return [x - size / 2 + bx * size / 64, y - size / 2 + by * size / 64]; },
      eye(look, x, y, w, o = {}) {
        const P = G.paletteOf(look), h = w * 0.82, lid = o.lid || 0, sd = o.side || 1;
        b.ell(P.skin, x, y + h * 0.22, w * 0.8, h * 0.95);
        if (o.closed) { b.line(P.hairDk, [x - w * 0.55, y, x, y + h * 0.18, x + w * 0.55, y - h * 0.02], w * 0.12); return; }
        b.ell('#fbf8f6', x, y + h * 0.08, w * 0.5, h * 0.42);
        b.ell(P.eyeDk, x + sd * w * 0.04, y + h * 0.06, w * 0.3, h * 0.44);
        b.ell(P.eye, x + sd * w * 0.04, y + h * 0.14, w * 0.25, h * 0.34);
        b.ell(P.eye2, x + sd * w * 0.04, y + h * 0.28, w * 0.18, h * 0.16);
        b.ell(P.eyeDk, x + sd * w * 0.04, y + h * 0.02, w * 0.1, h * 0.16);
        b.rect('#ffffff', x - sd * w * 0.12 - w * 0.06, y - h * 0.16, w * 0.12, h * 0.14);
        b.rect('#ffffff', x + sd * w * 0.14, y + h * 0.22, w * 0.06, w * 0.06);
        const top = y - h * 0.32 + lid * h * 0.36;
        if (lid) b.poly(P.skinSh, [x - w * 0.56, top - h * 0.2, x + w * 0.56, top - h * 0.2, x + w * 0.56, top, x - w * 0.56, top]);
        b.poly(o.lash || '#1e1418', [x - w * 0.56, top + h * 0.06, x - w * 0.3, top - h * 0.06, x + w * 0.1, top - h * 0.1, x + w * 0.5, top - h * 0.02, x + sd * w * 0.68, top - h * 0.16, x + w * 0.56, top + h * 0.08, x + w * 0.1, top + h * 0.04, x - w * 0.36, top + h * 0.08]);
        b.line(P.skinDk, [x - w * 0.36, y + h * 0.5, x + w * 0.36, y + h * 0.48], w * 0.05);
      },
      figure(look, x, y, hUnits, o) { const s = Math.max(1, hUnits * kh / G.FIG_H); b.sprite(G.figureCanvas(look), x, y, Math.round(G.FIG_W * s), Math.round(G.FIG_H * s), o); },
      shape(col, edge, pts, lw) { b.poly(col, pts); b.line(edge, pts.concat(pts[0], pts[1]), lw || 0.8); },
      cloud(col, x, y, r) { b.ell(col, x, y, r * 1.6, r * 0.7); b.ell(col, x - r * 0.8, y + r * 0.1, r * 0.9, r * 0.6); b.ell(col, x + r * 0.9, y - r * 0.2, r, r * 0.7); }
    };
    return b;
  }

  const look = (base, extra) => Object.assign({}, typeof base === 'string' ? G.lookOf(base, null) : base, extra || {});
  const GIRL = { skin: '#f8e0d4', eye: '#6a8ad0', bangs: 'messy', sides: 'long', back: 'long', crown: 'smooth', body: 'f', coat: 'jacket', collar: 'v', low: 'skirt', acc: [] };

  const SCENES = {
    arrows(b) {
      b.sky(['#080c0a', '#101814', '#18221c']);
      for (const [x, y, r] of [[8, 14, 16], [24, 8, 12], [4, 40, 14], [20, 30, 10], [12, 62, 11], [34, 18, 8]]) { b.ell('#0c1410', x, y, r, r * 0.8); b.ell('#121c16', x + r * 0.2, y - r * 0.2, r * 0.6, r * 0.45); }
      for (let i = 0; i < 9; i++) b.ell(i % 3 ? '#6a2a1c' : '#a8502a', 4 + G.hash(i, 7, 1) * 30, 8 + G.hash(i, 7, 2) * 50, 0.7, 0.7);
      b.ell('#6a5a2a', 50, 84, 48, 26); b.ell('#c8a440', 50, 83, 45, 23); b.ell('#e2c25a', 51, 81, 38, 18); b.ell('#f0d878', 53, 78, 26, 11);
      for (let i = 0; i < 14; i++) b.rect('#d8b44c', 14 + G.hash(i, 9, 1) * 72, 66 + G.hash(i, 9, 2) * 30, 1.2, 0.8);
      b.ell('#24686a', 42, 104, 54, 17); b.ell('#2e8482', 40, 101, 46, 11); b.ell('#3e9a94', 36, 99, 30, 6);
      for (let i = 0; i < 10; i++) { const y = 96 + G.hash(i, 11, 1) * 14, x = 6 + G.hash(i, 11, 2) * 72; b.line('#5ab0a8', [x, y, x + 6 + G.hash(i, 11, 3) * 6, y], 0.6); }
      b.poly('#18241a', [0, 112, 18, 104, 40, 110, 62, 104, 84, 110, 100, 104, 100, 140, 0, 140]);
      b.poly('#223222', [0, 124, 26, 116, 52, 124, 76, 116, 100, 122, 100, 140, 0, 140]);
      for (let i = 0; i < 26; i++) { const x = G.hash(i, 13, 1) * 100, y = 108 + G.hash(i, 13, 2) * 32; b.line(i % 2 ? '#3a4c34' : '#2e3e2a', [x - 2, y + 1.5, x - 0.5, y - 1.5, x + 0.5, y + 1.2, x + 2, y - 1], 0.6); }
      b.line('#2a2218', [95, 140, 91, 104, 87, 76, 81, 56, 77, 36], 3.2); b.line('#4a3a26', [94, 140, 90, 104, 86, 76, 80, 56, 76, 36], 1.4);
      b.line('#2a2218', [86, 76, 97, 63], 2); b.line('#2a2218', [82, 60, 70, 50], 1.8); b.line('#2a2218', [90, 100, 99, 92], 1.6);
      const arc = (x, y, rx, ry) => { const pts = []; for (let t = 0; t <= 16; t++) { const a = Math.PI + Math.PI * t / 16; pts.push(x + Math.cos(a) * rx, y + Math.sin(a) * ry); } return pts; };
      const pine = (x, y, r) => {
        b.poly('#b89a54', arc(x, y + 0.8, r + 1.2, r * 0.72 + 1.2));
        b.poly('#e0c878', arc(x - r * 0.1, y - 0.2, r + 0.6, r * 0.72 + 0.6));
        b.poly('#22382a', arc(x, y, r, r * 0.72));
        for (let q = 1; q <= 3; q++) b.line(q === 1 ? '#5a7c50' : '#3e5e40', arc(x, y - r * 0.08 * q, r * (1 - q * 0.22), r * 0.72 * (1 - q * 0.24)), 0.8);
        for (let n = 0; n < Math.round(r * 1.4); n++) {
          const a = Math.PI * (1.08 + 0.84 * G.hash(n, r, 1)), d = 0.35 + 0.55 * G.hash(n, r, 2), nx = x + Math.cos(a) * r * d, ny = y + Math.sin(a) * r * 0.72 * d;
          b.line('#2e4a34', [nx, ny, nx + 1, ny + 1.2], 0.5);
        }
        b.rect('#142016', x - r, y - 0.4, r * 2, 1.4);
        for (let n = -3; n <= 3; n++) b.ell('#1a2c20', x + n * r * 0.28, y + 0.8, r * 0.15, r * 0.11);
      };
      for (const [x, y, r] of [[72, 22, 18], [94, 32, 13], [58, 38, 10], [90, 56, 14], [99, 78, 9], [10, 112, 15], [27, 122, 9]]) { pine(x, y, r); if (r > 12) pine(x + r * 0.15, y - r * 0.5, r * 0.6); }
      b.ell('#2a4488', 88, 92, 6, 3.4); b.ell('#3a58a0', 93, 88, 9, 6); b.ell('#4a6cb8', 92, 86, 6, 3.6);
      b.line('#8aa8e8', [86, 88, 90, 84, 96, 85, 97, 89, 93, 91, 91, 88], 0.7);
      b.front();
      const C = '#f6ecd8', L = '#fffaf0', S = '#d2c2a0', D = '#a8946e', E = '#6a5640', GO = '#e8c860';
      const g = b.g, cx = 50 * b.k, cy = 84 * b.kh;
      g.save(); g.translate(cx, cy); g.scale(1.14, 1.14); g.translate(-cx, -cy);
      b.line(D, [42, 82, 40, 92, 41, 102, 38, 118], 4); b.line(D, [62, 84, 66, 98, 62, 114], 4);
      b.line(S, [42, 82, 40, 92, 41, 102, 38, 118], 2.2); b.line(S, [62, 84, 66, 98, 62, 114], 2.2);
      b.poly(C, [38, 58, 46, 52, 56, 64, 66, 66, 70, 74, 68, 84, 58, 88, 44, 88, 38, 78]);
      b.poly(S, [40, 80, 46, 86, 58, 86, 66, 82, 68, 84, 58, 88, 44, 88, 38, 78]);
      b.poly(L, [46, 54, 56, 64, 66, 66, 68, 69, 56, 66, 47, 57]);
      b.line(E, [46, 70, 52, 76, 60, 76], 0.6); b.line(E, [60, 70, 64, 76], 0.5); b.line(S, [42, 66, 44, 76], 0.9);
      b.line(C, [47, 84, 48, 94, 50, 102, 48, 120], 4.6); b.line(C, [66, 82, 72, 96, 70, 116], 4.6);
      b.line(S, [49, 86, 50, 94, 51, 102, 49, 118], 1.2); b.line(S, [68, 84, 73, 96, 71, 114], 1.2);
      b.line(E, [46, 94, 49, 95], 0.5); b.line(E, [70, 96, 73, 97], 0.5);
      for (const [x, y] of [[38, 119], [48, 121], [62, 115], [70, 117]]) { b.rect(GO, x - 2.4, y - 2, 4.8, 1); b.rect('#3a2c20', x - 2.2, y - 1, 4.4, 2.4); }
      b.poly(C, [36, 46, 42, 38, 50, 38, 58, 44, 60, 49, 54, 50, 50, 52, 44, 58, 38, 60, 34, 54]);
      b.poly(S, [44, 50, 54, 50, 50, 52, 44, 58, 40, 58]);
      b.poly(L, [42, 40, 50, 39, 56, 44, 48, 42]);
      b.poly(C, [40, 40, 36, 32, 44, 38]); b.poly(S, [40, 39, 38, 34, 42, 38]);
      b.poly('#fbf4e4', [45, 41, 50, 41, 70, 10]);
      for (let n = 0; n < 7; n++) { const t = 0.12 + n * 0.12, x = 47.5 + 22.5 * t, y = 41 - 31 * t, wd = 2.4 * (1 - t); b.line(D, [x - wd, y + 0.4, x + wd * 0.6, y - 0.8], 0.45); }
      const lock = (x0, y0, qx, qy, x1, y1, w, wave) => {
        const top = [], bot = [], mid = [];
        for (let i = 0; i <= 14; i++) {
          const t = i / 14, u = 1 - t;
          const x = u * u * x0 + 2 * u * t * qx + t * t * x1, y = u * u * y0 + 2 * u * t * qy + t * t * y1;
          const dx = 2 * u * (qx - x0) + 2 * t * (x1 - qx), dy = 2 * u * (qy - y0) + 2 * t * (y1 - qy), l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
          const sway = Math.sin(t * Math.PI * 1.6) * wave, r = w * Math.pow(u, 0.75) * (0.55 + 0.45 * Math.sin(Math.min(1, t * 3) * Math.PI / 2));
          const cx = x + nx * sway, cy = y + ny * sway;
          top.push([cx + nx * r, cy + ny * r]); bot.push([cx - nx * r, cy - ny * r]); mid.push([cx, cy]);
        }
        const flat = list => list.flat();
        b.poly(C, flat(top.concat(bot.slice().reverse())));
        b.poly(S, flat(mid.concat(bot.slice().reverse())));
        b.line(L, flat(top.slice(1, 10).map(([x, y], i) => [(x + mid[i + 1][0]) / 2, (y + mid[i + 1][1]) / 2])), 0.45);
      };
      for (const m of [[45, 64, 38, 72, 40, 85, 3.8, 1.2], [42, 60, 33, 68, 30, 80, 4.2, -1.4], [40, 56, 29, 62, 24, 73, 4.4, 1.6], [40, 51, 27, 55, 17, 64, 4.8, -1.8], [41, 46, 28, 45, 15, 53, 5, 2], [43, 42, 31, 37, 20, 43, 4.4, 1.6], [45, 39, 36, 30, 27, 31, 3.4, 1.2], [47, 38, 42, 31, 39, 25, 2.6, 0.8]]) lock(...m);
      for (const m of [[68, 79, 78, 82, 84, 90, 3, 1], [69, 75, 82, 70, 91, 75, 3.4, -1.2], [67, 71, 76, 61, 88, 58, 3.8, 1.4]]) lock(...m);
      g.restore();
      const spear = (x0, y0, x1, y1) => {
        const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, px = -uy, py = ux;
        const bx = x1 - ux * 13, by = y1 - uy * 13;
        b.line('#5a4836', [x0, y0, bx, by], 2.8); b.line('#9a8462', [x0 + px * 0.4, y0 + py * 0.4, bx + px * 0.4, by + py * 0.4], 1);
        for (let n = 1; n <= 2; n++) { const qx = bx - ux * n * 3, qy = by - uy * n * 3; b.line(GO, [qx - px * 1.6, qy - py * 1.6, qx + px * 1.6, qy + py * 1.6], 0.8); }
        b.poly(C, [x1, y1, bx + px * 4.8, by + py * 4.8, bx - ux * 3, by - uy * 3, bx - px * 4.8, by - py * 4.8]);
        b.poly(S, [x1, y1, bx - ux * 3, by - uy * 3, bx - px * 4.8, by - py * 4.8]);
        b.line(D, [x1 - ux * 1.5, y1 - uy * 1.5, bx - ux * 2, by - uy * 2], 0.5);
      };
      spear(-6, 98, 26, 86); spear(26, 150, 34, 118); spear(106, 108, 84, 96); spear(80, 150, 70, 120); spear(-4, 130, 18, 116);
      for (const [x, y] of [[10, 40], [18, 128], [72, 130]]) { b.ell('#5a78c8', x, y, 3.4, 2.8); b.ell('#8aa8e8', x, y, 2.6, 2.1); b.ell('#e8f0ff', x - 0.3, y - 0.3, 1.4, 1.1); }
    },
    cornucopia(b) {
      const g = b.g, K = b.k, KH = b.kh, OX = 60, OY = 74, RX = 44, RY = 58;
      const ellPts = (x, y, rx, ry, a0, a1, n) => { const pts = []; for (let t = 0; t <= n; t++) { const a = a0 + (a1 - a0) * t / n; pts.push(x + Math.cos(a) * rx, y + Math.sin(a) * ry); } return pts; };
      b.sky(['#e6d0a2', '#ead6aa', '#dcc08c']);
      for (let i = 0; i < 46; i++) { const x = G.hash(i, 21, 1) * 104; b.line(i % 2 ? '#d6be8e' : '#c8ac7a', [x, 0, x - 6, 30 + G.hash(i, 21, 2) * 50], 0.5); }
      b.poly('#b07c38', [0, 0, 30, 0, 22, 14, 10, 34, 0, 50]);
      for (let i = 0; i < 40; i++) b.rect(i % 2 ? '#c8944a' : '#8a5a26', G.hash(i, 23, 1) * 26, G.hash(i, 23, 2) * 44, 0.8, 0.8);
      for (let i = 0; i < 11; i++) { const t = i / 10, x = 84 + t * 15, y = 1 + t * 46; b.poly(i % 2 ? '#5a3a1e' : '#2e1c0e', [x, y - 2.4, x + 1.9, y, x, y + 2.4, x - 1.9, y]); }
      g.save(); g.beginPath(); g.ellipse(OX * K, OY * KH, RX * K, RY * KH, -0.18, 0, Math.PI * 2); g.clip();
      b.rect('#f4ead0', 0, 0, 100, 140);
      for (let i = 0; i < 34; i++) { const x = 18 + G.hash(i, 25, 1) * 82; b.line('#e6d8b6', [x, 14, x - 1, 40 + G.hash(i, 25, 2) * 12], 0.45); }
      b.poly('#d4dae0', [18, 62, 34, 50, 48, 54, 62, 40, 76, 44, 90, 30, 104, 36, 104, 80, 18, 80]);
      b.poly('#9aaabe', [18, 68, 32, 58, 46, 60, 58, 50, 70, 52, 82, 42, 94, 46, 104, 40, 104, 86, 18, 86]);
      for (const [x0, y0, n, sh] of [[46, 52, 14, 0], [60, 46, 12, 1]]) for (let i = 0; i < n; i++) { const x = x0 + i * 3.6, y = y0 - i * 1.2 + (i % 2) * 0.8; b.ell(sh ? '#5a76a0' : '#7088ac', x, y, 2.5, 2.1); b.line('#f6f8fc', [x - 0.7, y - 0.2, x, y - 1.5, x + 0.7, y - 0.2], 0.45); }
      b.poly('#b4ccb6', [18, 82, 36, 70, 56, 74, 76, 64, 104, 70, 104, 96, 18, 96]);
      b.poly('#eef4e2', [24, 92, 38, 78, 52, 82, 64, 76, 68, 100, 28, 104]);
      for (let i = 0; i < 7; i++) { const y = 84 + i * 3.2; b.line(i % 2 ? '#d4e4c0' : '#b8d0a0', [30 + i, y, 50 - i * 0.6, y + 1], 0.6); }
      b.poly('#7a6a3a', [74, 60, 90, 50, 104, 52, 104, 96, 84, 100, 78, 82]);
      for (let i = 0; i < 6; i++) { const y = 56 + i * 6.4; b.poly(i % 2 ? '#7a9a48' : '#90b058', [76 + i * 0.6, y, 92, y - 4, 104, y - 3, 104, y + 2, 92, y + 1, 78 + i * 0.6, y + 4]); b.line('#4a3a20', [78 + i * 0.6, y + 4, 92, y + 1, 104, y + 2], 0.6); }
      b.line('#a8d4e8', [58, 68, 54, 76, 60, 84, 52, 94, 48, 106], 1.3); b.line('#e8f6fc', [58, 68, 54, 76, 60, 84, 52, 94], 0.5);
      b.poly('#8ab46a', [104, 74, 88, 90, 72, 100, 58, 112, 50, 132, 60, 140, 104, 140]);
      b.poly('#6a9c50', [104, 88, 90, 100, 76, 110, 66, 124, 64, 140, 104, 140]);
      b.poly('#4e8040', [104, 102, 92, 112, 82, 124, 78, 140, 104, 140]);
      for (let i = 0; i < 26; i++) { const x = 60 + G.hash(i, 27, 1) * 44, y = 96 + G.hash(i, 27, 2) * 44; b.line(i % 3 ? '#3e6e34' : '#a8cc80', [x, y, x - 1.6, y + 2.4], 0.55); }
      g.restore();
      for (const [a0, a1, d, w] of [[-2.2, 0.4, 0, 1.8], [0.5, 1.6, 0, 1.4], [1.7, 3.6, 0, 1.6], [-1.6, -0.2, 2.6, 0.7], [0.9, 2.4, -2.4, 0.6]]) b.line('#fffaf0', ellPts(OX, OY, RX + d, RY + d * 1.3, a0, a1, 18).map((v, i) => v), w);
      b.poly('#1a3436', [0, 92, 10, 90, 22, 100, 34, 116, 46, 130, 54, 140, 0, 140]);
      b.poly('#264a46', [0, 102, 12, 100, 24, 112, 34, 126, 40, 140, 0, 140]);
      for (let i = 0; i < 16; i++) { const x = 1 + i * 3, y = 94 + i * 3; b.poly(i % 2 ? '#3a6a5a' : '#2e5a4c', [x, y + 5, x + 1.6, y - 5, x + 3, y + 5]); }
      b.poly('#e0a03c', [40, 140, 56, 126, 74, 117, 92, 108, 104, 102, 104, 140]);
      b.poly('#c0822a', [60, 140, 76, 127, 90, 121, 104, 118, 104, 140]);
      b.line('#fffaf0', [38, 140, 54, 126, 72, 117, 90, 108, 104, 102], 1.2);
      b.front();
      const ear = (x0, y0, x1, y1, n, sz, bend) => {
        const pt = t => { const u = 1 - t, qx = (x0 + x1) / 2 + bend, qy = (y0 + y1) / 2; return [u * u * x0 + 2 * u * t * qx + t * t * x1, u * u * y0 + 2 * u * t * qy + t * t * y1]; };
        const stem = []; for (let t = 0; t <= 10; t++) stem.push(...pt(t / 10));
        b.line('#a8701e', stem, 1.6);
        for (let i = n - 1; i >= 0; i--) {
          const t = 0.34 + 0.6 * i / (n - 1), [cx, cy] = pt(t), [nx2, ny2] = pt(Math.min(1, t + 0.02));
          const dl = Math.hypot(nx2 - cx, ny2 - cy) || 1, ux = (nx2 - cx) / dl, uy = (ny2 - cy) / dl, px = -uy, py = ux, s = sz * (1 - 0.3 * i / (n - 1));
          for (const side of [-1, 1]) {
            const ox = px * side * s * 1.35, oy = py * side * s * 1.35;
            const arm = [cx, cy, cx + ox + ux * s * 0.7, cy + oy + uy * s * 0.7, cx + ox + ux * s * 1.6, cy + oy + uy * s * 1.6, cx + ux * s * 1.05, cy + uy * s * 1.05];
            b.poly(side < 0 ? '#e09a30' : '#f0b848', arm);
            b.poly(side < 0 ? '#f4c460' : '#fcd878', [cx + ux * s * 0.3, cy + uy * s * 0.3, cx + ox * 0.7 + ux * s * 0.9, cy + oy * 0.7 + uy * s * 0.9, cx + ox * 0.9 + ux * s * 1.4, cy + oy * 0.9 + uy * s * 1.4, cx + ux * s * 0.8, cy + uy * s * 0.8]);
          }
        }
        const [tx, ty] = pt(1), [bx, by] = pt(0.97), l = Math.hypot(tx - bx, ty - by) || 1;
        b.line('#f8dc84', [tx, ty, tx + (tx - bx) / l * 7, ty + (ty - by) / l * 7], 0.9);
      };
      ear(30, 122, 62, 72, 6, 4.8, -5); ear(16, 124, 56, 46, 8, 5.9, -7); ear(2, 124, 44, 26, 9, 6.6, -8);
      ear(106, 140, 94, 72, 7, 5.4, -4);
      for (let i = 0; i < 6; i++) b.line(i % 2 ? '#d89a34' : '#b47820', [i * 4 - 2, 140, 6 + i * 5, 116 - i], 1.2);
    },
    collapsing(b) {
      const tongue = (x0, y0, qx, qy, x1, y1, w, wave, col) => {
        const L = [], R = [];
        for (let i = 0; i <= 16; i++) {
          const t = i / 16, u = 1 - t;
          const x = u * u * x0 + 2 * u * t * qx + t * t * x1, y = u * u * y0 + 2 * u * t * qy + t * t * y1;
          const dx = 2 * u * (qx - x0) + 2 * t * (x1 - qx), dy = 2 * u * (qy - y0) + 2 * t * (y1 - qy), l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
          const sw = Math.sin(t * Math.PI * 2.2) * wave * (0.4 + t), r = w * Math.pow(u, 0.85) * (0.75 + 0.25 * Math.sin(Math.min(1, t * 4) * Math.PI / 2)) * (1 + 0.16 * Math.sin(t * Math.PI * 9 + w));
          L.push([x + nx * (sw + r), y + ny * (sw + r)]); R.push([x + nx * (sw - r), y + ny * (sw - r)]);
        }
        b.poly(col, L.concat(R.reverse()).flat());
      };
      const blaze = (pts, ax, ay) => {
        const at = k => pts.map((v, i) => (i % 2 ? ay + (v - ay) * k : ax + (v - ax) * k));
        [[1.07, '#4a100a'], [1, '#b8301a'], [0.84, '#e05a1e'], [0.66, '#f08a2a'], [0.48, '#f6b23c'], [0.3, '#fcd868'], [0.14, '#fff2c0']].forEach(([k, col]) => b.poly(col, at(k)));
      };
      const BIG = [58, 94, 55, 80, 59, 72, 56, 62, 60, 54, 58, 44, 63, 36, 61, 26, 67, 31, 69, 40, 73, 33, 76, 24, 78, 30, 76, 38, 80, 44, 84, 38, 88, 44, 85, 52, 90, 58, 93, 66, 89, 72, 94, 80, 88, 86, 86, 96, 76, 100, 66, 99];
      const LEFT = [42, 86, 38, 80, 34, 82, 30, 76, 32, 70, 28, 64, 33, 66, 34, 60, 38, 64, 40, 58, 42, 66, 44, 74, 46, 82];
      const BASE = [48, 110, 50, 102, 53, 104, 55, 96, 58, 102, 61, 98, 63, 106, 60, 112];
      const clouds = list => {
        for (const [x, y, r] of list) b.ell('#c8442a', x, y, r + 0.8, r * 0.8 + 0.8);
        for (const [x, y, r] of list) b.ell('#9c845e', x, y + r * 0.12, r, r * 0.76);
        for (const [x, y, r] of list) b.ell('#c8b48c', x - r * 0.12, y - r * 0.12, r * 0.84, r * 0.6);
        for (const [x, y, r, hl] of list) if (hl) { b.ell('#e8dab4', x - r * 0.25, y - r * 0.3, r * 0.55, r * 0.34); b.ell('#fbf0d0', x - r * 0.35, y - r * 0.42, r * 0.26, r * 0.14); }
      };
      const curl = (x, y, r) => { const pts = []; for (let t = 0; t <= 24; t++) { const a = t / 24 * Math.PI * 3.2, rr = r * (1 - t / 30); pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.75); } b.line('#fff2cc', pts, 0.7); };
      b.sky(['#1c1410', '#281c16', '#20160f']);
      for (let i = 0; i < 110; i++) b.rect(i % 3 ? '#3a2a20' : '#100a08', G.hash(i, 31, 1) * 100, G.hash(i, 31, 2) * 140, 0.6, 0.6);
      b.ell('#b85a1a', 54, 50, 48, 46); b.ell('#e88e28', 54, 49, 46, 44);
      for (let i = 0; i < 220; i++) { const a = G.hash(i, 33, 1) * Math.PI * 2, r = Math.sqrt(G.hash(i, 33, 2)) * 45; b.rect(r < 30 ? '#f8c050' : i % 2 ? '#f4a838' : '#c8681c', 54 + Math.cos(a) * r, 49 + Math.sin(a) * r * 0.96, 0.6, 0.6); }
      b.ell('#f2a838', 50, 46, 32, 30);
      for (let i = 0; i < 160; i++) { const a = G.hash(i, 37, 1) * Math.PI * 2, r = Math.sqrt(G.hash(i, 37, 2)) * 30; b.rect(i % 3 ? '#f8c458' : '#e8902a', 50 + Math.cos(a) * r, 46 + Math.sin(a) * r, 0.6, 0.6); }
      for (const [x, y] of [[18, 26], [40, 20], [72, 60]]) b.poly('#3a1a10', [x, y, x + 2.4, y - 0.8, x + 1, y + 0.8]);
      tongue(56, 6, 76, -2, 100, 8, 3.4, 1.4, '#6a1610'); tongue(70, 10, 86, 16, 94, 30, 2.6, -1.2, '#7a1c12');
      b.ell('#f8d070', 68, 62, 16, 24); b.ell('#fce8a0', 64, 66, 9, 15); b.ell('#fff6d0', 62, 68, 4, 8);
      b.front();
      const T = '#463630', TL = '#6a5248', TD = '#2a201c', GL = '#f8e8a0';
      const tilt = y => (96 - y) * -0.14;
      const tw = (pts) => pts.map((v, i) => (i % 2 ? v : v + tilt(pts[i + 1])));
      blaze(BIG, 70, 92); blaze(LEFT, 40, 84);
      for (const h of [[80, 52, 84, 48, 86, 56, 82, 60], [74, 40, 77, 36, 77, 46], [86, 72, 90, 70, 89, 78], [64, 46, 66, 42, 66, 52]]) { b.poly('#4a100a', h); b.poly('#a82a16', h.map((v, i) => v + (i % 2 ? 0.8 : 0.5))); }
      b.poly('#36261f', [18, 140, 26, 118, 36, 100, 42, 90, 62, 90, 66, 104, 74, 120, 82, 140]);
      b.poly('#4a362c', [28, 140, 34, 120, 42, 102, 52, 94, 54, 114, 48, 140]);
      for (let i = 0; i < 10; i++) { const x = 34 + i * 4; b.line('#22180f', [x, 98 + (i % 3) * 4, x - 3 + G.hash(i, 35, 1) * 6, 138], 0.5); }
      b.poly(T, tw([42, 94, 41, 36, 57, 33, 60, 92]));
      b.poly(TL, tw([41, 36, 46, 35, 47, 94, 42, 94]));
      b.poly(TD, tw([55, 34, 57, 33, 60, 92, 57, 93]));
      b.poly(T, tw([37, 36, 36, 26, 61, 23, 61, 33]));
      for (let i = 0; i < 6; i++) { const x = 36 + i * 4.4; b.poly(i % 2 ? T : TL, tw([x, 26, x, 21, x + 2.6, 21, x + 2.6, 26])); }
      b.poly(TD, tw([37, 34, 61, 31, 61, 33, 37, 36]));
      for (const [x, y] of [[41, 27], [47, 26.4], [53, 25.8]]) { b.poly('#140e0a', tw([x, y, x + 2.4, y, x + 2.4, y + 4, x, y + 4])); b.poly('#f8b850', tw([x + 0.5, y + 2.4, x + 1.9, y + 2.4, x + 1.9, y + 3.4, x + 0.5, y + 3.4])); }
      for (const [x, y] of [[46, 48], [50, 60], [44, 70]]) b.poly('#140e0a', tw([x, y, x + 1.8, y, x + 1.8, y + 3, x, y + 3]));
      b.line(TD, [44 + tilt(22), 22, 30, 2], 1.3);
      tongue(31, 4, 38, 4, 46, 12, 3, 1.2, '#2a1612');
      b.poly(GL, tw([57, 46, 60, 42, 60, 54, 56, 58, 59, 66, 55, 72, 53, 62]));
      b.poly('#fcf6d0', tw([57.5, 50, 59, 48, 58.5, 56, 56, 60]));
      b.poly(GL, tw([47, 80, 52, 77, 55, 85, 50, 88]));
      for (const [x, y] of [[62, 40], [64, 52], [60, 86]]) b.poly(T, tw([x, y, x + 3, y + 1, x + 1, y + 3]));
      blaze(BASE, 56, 110);
      clouds([[2, 120, 13, 1], [16, 108, 10, 1], [28, 122, 11], [12, 134, 12], [34, 136, 10], [0, 98, 8, 1], [26, 140, 10]]);
      clouds([[72, 130, 11, 1], [86, 118, 12, 1], [98, 108, 9, 1], [92, 134, 13], [100, 126, 10], [62, 140, 10]]);
      curl(14, 114, 4); curl(84, 124, 5); curl(4, 98, 3);
      b.line('#fff4d0', [0, 100, 12, 96, 24, 98, 34, 108, 46, 118, 62, 124, 80, 124, 96, 116], 1);
      b.line('#f0e0b8', [6, 140, 22, 130, 40, 126, 54, 132], 0.8);
      b.line('#f8d070', [0, 128, 4, 140], 1.6);
    },
    amber(b) {
      const K = b.k, KH = b.kh;
      const ribbon = (x0, y0, qx, qy, x1, y1, w, col) => {
        const L = [], R = [];
        for (let i = 0; i <= 18; i++) {
          const t = i / 18, u = 1 - t, x = u * u * x0 + 2 * u * t * qx + t * t * x1, y = u * u * y0 + 2 * u * t * qy + t * t * y1;
          const dx = 2 * u * (qx - x0) + 2 * t * (x1 - qx), dy = 2 * u * (qy - y0) + 2 * t * (y1 - qy), l = Math.hypot(dx, dy) || 1, r = w * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.85));
          L.push([x - dy / l * r, y + dx / l * r]); R.push([x + dy / l * r, y - dx / l * r]);
        }
        b.poly(col, L.concat(R.reverse()).flat());
        return L;
      };
      const bolt = (pts, w) => { b.line('#7a68c8', pts, w + 1.2); b.line('#c8bcff', pts, w); b.line('#f4f0ff', pts, w * 0.35); };
      b.sky(['#161a26', '#1c2030', '#181c28']);
      for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) { const x = c * 30 - (r % 2) * 15, y = 18 + r * 18; b.line('#121520', [x, y, x + 15, y - 8, x + 30, y], 4); }
      for (let i = 0; i < 160; i++) b.rect(i % 4 ? '#2c3244' : '#4a5268', G.hash(i, 51, 1) * 100, G.hash(i, 51, 2) * 140, 0.6, 0.6);
      b.poly('#b89c74', [0, 0, 6, 0, 4, 40, 2, 90, 6, 140, 0, 140]);
      ribbon(-4, 4, 30, 2, 36, 24, 4, '#3ac0b0'); ribbon(-2, 14, 24, 40, 16, 78, 4.4, '#4ad8c4');
      ribbon(-2, 60, 8, 86, 32, 134, 4.6, '#3ac0b0'); ribbon(104, 24, 86, 70, 94, 120, 5, '#4ad8c4'); ribbon(104, 92, 92, 118, 68, 142, 4, '#3ac0b0');
      for (const pts of [[8, 30, 12, 50], [94, 70, 92, 90], [14, 96, 20, 112]]) b.line('#e8fff8', pts, 0.6);
      b.front();
      for (const pts of [[40, -2, 34, 8, 42, 12, 36, 22, 46, 26, 44, 36], [60, -2, 66, 8, 58, 14, 66, 22, 58, 30, 60, 38], [80, -2, 88, 8, 80, 12, 86, 20, 74, 28, 70, 34], [22, -2, 18, 8, 26, 12, 22, 20, 30, 24]]) {
        b.line('#4a4a56', pts, 5.6); b.line('#c8c8d2', pts, 4.2); b.line('#f4f4f8', pts.map((v, i) => v + (i % 2 ? 0 : -0.8)), 1.8);
      }
      bolt([36, 18, 32, 26, 38, 30, 34, 38, 42, 44, 40, 50], 1.2);
      bolt([22, 92, 28, 100, 22, 106, 30, 114, 24, 124, 34, 140], 1.4);
      bolt([36, 104, 40, 112, 36, 118, 42, 126], 0.9);
      const g = b.g;
      g.save(); g.translate(52 * K, 64 * KH); g.rotate(0.72); g.translate(-52 * K, -64 * KH);
      const GEM = [14, 62, 22, 50, 38, 44, 60, 43, 80, 48, 90, 60, 88, 72, 76, 82, 52, 85, 30, 81, 18, 73];
      b.poly('#2a3a40', GEM.map((v, i) => (i % 2 ? 64 + (v - 64) * 1.06 : 52 + (v - 52) * 1.05)));
      b.poly('#9ab8b8', GEM);
      b.poly('#d8ecec', [14, 62, 22, 50, 38, 44, 60, 43, 50, 48, 36, 51, 24, 58]);
      b.poly('#5a7a80', [90, 60, 88, 72, 76, 82, 52, 85, 66, 79, 80, 71]);
      b.poly('#7a9a9e', [18, 73, 30, 81, 52, 85, 34, 78]);
      for (const [x0, y0, x1, y1] of [[22, 50, 30, 56], [38, 44, 42, 52], [60, 43, 60, 49], [80, 48, 74, 54], [90, 60, 82, 62], [88, 72, 80, 70], [76, 82, 70, 76], [52, 85, 52, 79], [30, 81, 36, 76], [18, 73, 26, 70], [14, 62, 22, 62]]) b.line('#5a7478', [x0, y0, x1, y1], 0.6);
      b.ell('#5a3420', 58, 64, 27, 15);
      b.ell('#8a522a', 58, 63, 24, 13);
      b.ell('#b06a32', 60, 63, 18, 10);
      b.poly('#7aa8a8', [26, 56, 38, 50, 40, 62, 34, 74, 26, 70]); b.poly('#a8d0cc', [30, 56, 38, 52, 36, 60, 30, 64]); b.poly('#5a8a8a', [36, 66, 42, 60, 44, 72, 38, 78]);
      b.ell('#e8b448', 59, 64, 11, 6.4);
      b.ell('#b06a32', 62, 62.4, 8.4, 4.6);
      b.ell('#f8d870', 56, 66, 4, 2.2);
      for (const [x0, y0, x1, y1] of [[40, 54, 50, 50], [44, 76, 56, 78], [70, 52, 80, 58]]) b.line('#d89a48', [x0, y0, x1, y1], 0.6);
      b.poly('#fce890', [44, 56, 52, 54, 48, 60]);
      for (let i = 0; i < 24; i++) { const a = G.hash(i, 53, 1) * Math.PI * 2, r = 6 + G.hash(i, 53, 2) * 18; b.rect(i % 2 ? '#e8b048' : '#7a4422', 52 + Math.cos(a) * r, 64 + Math.sin(a) * r * 0.66, 0.7, 0.7); }
      g.restore();
      for (const [x, y, r] of [[78, 132, 10], [92, 124, 9], [64, 140, 9], [100, 138, 10]]) b.ell('#8a7456', x, y, r + 0.7, r * 0.7 + 0.7);
      for (const [x, y, r] of [[78, 132, 10], [92, 124, 9], [64, 140, 9], [100, 138, 10]]) b.ell('#d8c49a', x, y, r, r * 0.7);
      for (const [x, y, r] of [[78, 132, 10], [92, 124, 9], [100, 138, 10]]) b.ell('#f2e6c4', x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.3);
    },
    void(b) {
      const HX = 50, HY = 30, HR = 17;
      const planet = (x, y, r, a, c, rim) => { b.ell(rim || '#0a0c18', x, y, r + 0.6, r * 0.96 + 0.6); b.ell(a, x, y, r, r * 0.96); b.ell(c, x - r * 0.3, y - r * 0.3, r * 0.55, r * 0.5); };
      b.sky(['#080c20', '#0c1430', '#0a1028']);
      for (let i = 0; i < 120; i++) b.rect(i % 5 ? '#2a3a6a' : '#c8d4f0', G.hash(i, 61, 1) * 100, G.hash(i, 61, 2) * 140, 0.6, 0.6);
      const strand = (k, n, col, w, spin, r0) => {
        const pts = [];
        for (let i = 0; i <= 40; i++) {
          const t = i / 40, r = r0 * (1 - t) + HR * t, a = k + t * spin;
          pts.push(HX + Math.cos(a) * r * 0.92, HY + Math.sin(a) * r * 1.28);
        }
        b.line(col, pts, w);
      };
      const COLS = ['#121a3e', '#18244e', '#1e2e62', '#263a78', '#30488e', '#3e58a2', '#22346c', '#5a70b0'];
      for (let i = 0; i < 40; i++) strand(G.hash(i, 63, 1) * Math.PI * 2, 0, COLS[i % 8], 2 + G.hash(i, 63, 2) * 4, 2.4 + G.hash(i, 63, 3) * 1.4, 60 + G.hash(i, 63, 4) * 50);
      for (let i = 0; i < 7; i++) strand(G.hash(i, 65, 1) * Math.PI * 2, 0, i % 2 ? '#c8ccd8' : '#7a88b4', 0.6, 2.2 + G.hash(i, 65, 2), 40 + G.hash(i, 65, 3) * 30);
      b.ell('#e8e4d8', HX, HY, HR + 1.4, (HR + 1.4) * 1.1); b.ell('#4a5488', HX + 0.8, HY - 0.6, HR + 0.4, (HR + 0.4) * 1.1);
      b.ell('#020308', HX + 1.4, HY - 0.4, HR - 0.8, (HR - 0.8) * 1.1);
      b.ell('#221c28', HX - 4, HY + 10, 7, 6); b.ell('#5a4a58', HX - 5, HY + 9, 5, 4); b.ell('#8a7482', HX - 6, HY + 8, 2.4, 1.8);
      for (let i = 0; i < 11; i++) { const a = Math.PI * (0.3 + i * 0.08); b.rect('#fffaf0', HX + Math.cos(a) * (HR + 0.6) - 0.5, HY + Math.sin(a) * (HR + 0.6) * 1.1 - 0.5, 1.4, 0.8); }
      b.front();
      planet(14, 10, 9, '#26345e', '#3c5088', '#4a64b0');
      b.ell('#6a8ae0', 86, 38, 7, 7); planet(86, 38, 5.6, '#b8d4f8', '#f0f8ff', '#8aa8e8');
      b.ell('#c8e0ff', 10, 52, 2, 2); b.ell('#ffffff', 10, 52, 1, 1); b.ell('#e8f0ff', 56, 8, 1.6, 1.2);
      b.ell('#e0a840', 6, 96, 21, 20); b.ell('#f4d070', 9, 95, 18, 17);
      planet(2, 98, 20, '#6a4222', '#9a6a34', '#3a2412');
      for (let i = 0; i < 5; i++) b.line(i % 2 ? '#f4d070' : '#d89a38', [20 + i * 2, 84 + i * 3, 28 + i * 2, 86 + i * 2.6, 34 + i * 1.6, 92 + i * 2], 0.8);
      planet(38, 104, 6, '#1e2440', '#323c60', '#6a74a8');
      for (const [x, y] of [[30, 116], [26, 124], [22, 130]]) b.ell('#8a94b8', x, y, 1.6, 2.6);
      b.ell('#e0a840', 98, 94, 11, 10.6); planet(100, 96, 10, '#0e1020', '#1a1e34', '#3a2a14');
      b.ell('#c8902c', 78, 129, 30, 29); b.ell('#f0c860', 76, 127, 28, 27);
      planet(80, 132, 28, '#0c0e1c', '#161a30', '#3a2a14');
      for (let i = 0; i < 6; i++) { const a = Math.PI * (1.1 + i * 0.07); b.line(i % 2 ? '#fce08a' : '#e0a840', [80 + Math.cos(a) * 29, 132 + Math.sin(a) * 28, 80 + Math.cos(a) * 33 - 2, 132 + Math.sin(a) * 31 - 4], 1); }
      b.ell('#c8d8ff', 70, 122, 2.2, 3.6); b.ell('#ffffff', 70, 121, 1, 1.8);
      b.poly('#e8ecf8', [2, 138, 10, 128, 6, 138]);
    },
    chorus(b) {
      const SX = 50, SY = 50;
      const wave = (y0, amp, col, ph) => { const pts = [0, 140]; for (let i = 0; i <= 20; i++) { const x = i * 5; pts.push(x, y0 + Math.sin(i * 0.5 + ph) * amp + (x - 50) * (x - 50) * 0.006); } pts.push(100, 140); b.poly(col, pts); };
      b.sky(['#1a1630', '#262246', '#2a3266']);
      for (let i = 0; i < 26; i++) { const a = -Math.PI + i * Math.PI / 25; b.line('#2e4a8a', [50 + Math.cos(a) * 52, 64 + Math.sin(a) * 70, 50 + Math.cos(a) * 62, 64 + Math.sin(a) * 82], 1.2); }
      b.ring('#b8963c', 50, 64, 49, 66, 1.4);
      b.ell('#14122a', 50, 64, 48, 65);
      for (let i = 0; i < 180; i++) { const a = G.hash(i, 71, 1) * Math.PI * 2, r = Math.sqrt(G.hash(i, 71, 2)) * 40; b.rect(r < 22 ? '#8a6a30' : '#3a3050', SX + Math.cos(a) * r, SY + Math.sin(a) * r * 1.1, 0.6, 0.6); }
      b.ell('#5a4428', SX, SY, 22, 24); b.ell('#8a6a34', SX, SY, 14, 15); b.ell('#c09848', SX, SY, 7, 8);
      for (let i = 0; i < 28; i++) { const a = G.hash(i, 73, 1) * Math.PI * 2, r0 = 6, r1 = 18 + G.hash(i, 73, 2) * 26; b.line(i % 2 ? '#d8b456' : '#a88434', [SX + Math.cos(a) * r0, SY + Math.sin(a) * r0, SX + Math.cos(a) * r1, SY + Math.sin(a) * r1], 0.5); }
      const side = (x0, w, col, ph) => { const L = [], R = []; for (let i = 0; i <= 20; i++) { const y = 140 - i * 4, sw = Math.sin(i * 0.45 + ph) * 3; L.push(x0 + sw - w * (1 - i / 26), y); R.unshift(x0 + sw + w * (1 - i / 26), y); } b.poly(col, L.concat(R)); };
      for (const [x0, w, col, ph] of [[-6, 22, '#2a3478', 0], [106, 22, '#2a3478', 1], [6, 14, '#4a5ab0', 0.6], [94, 14, '#4a5ab0', 1.8], [16, 9, '#7a98d8', 1.2], [84, 9, '#7a98d8', 2.6], [26, 6, '#a8c0ec', 2], [74, 6, '#a8c0ec', 0.4]]) side(x0, w, col, ph);
      b.poly('#3a4aa0', [20, 140, 34, 112, 44, 100, 56, 100, 66, 112, 80, 140]);
      b.poly('#6a84d0', [30, 140, 40, 116, 48, 106, 52, 106, 60, 116, 70, 140]);
      b.ell('#c8d0f0', 50, 134, 10, 12); b.ell('#e8ecfa', 50, 136, 6, 8);
      b.front();
      const star = (len, w, a0, col) => { for (let i = 0; i < 4; i++) { const a = a0 + i * Math.PI / 2, ux = Math.cos(a), uy = Math.sin(a); b.poly(col, [SX, SY, SX + (ux * 0.4 - uy) * w, SY + (uy * 0.4 + ux) * w, SX + ux * len, SY + uy * len * 1.1, SX + (ux * 0.4 + uy) * w, SY + (uy * 0.4 - ux) * w]); } };
      star(38, 3.4, -Math.PI / 2, '#b08a34'); star(24, 2.6, -Math.PI / 4, '#c89c40');
      star(30, 2.2, -Math.PI / 2, '#f0c860'); star(18, 1.8, -Math.PI / 4, '#f4d070');
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.2; b.poly('#fce890', [SX, SY, SX + Math.cos(a) * 6, SY + Math.sin(a) * 6, SX + Math.cos(a + 0.5) * 4, SY + Math.sin(a + 0.5) * 4]); }
      b.ell('#5a4428', SX, SY, 1.6, 1.6);
      const W = '#eceaf8', WS = '#b8b8dc', WD = '#8a88c0';
      const heart = [];
      for (let i = 0; i <= 60; i++) { const t = Math.PI * 2 * i / 60, x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); heart.push(50 + x * 2.4 + Math.sin(i * 0.9) * 0.8, 58 - y * 2.6); }
      b.line(WD, heart, 2.4); b.line(W, heart, 1.4);
      const dancer = (x, y, rot, s, flip, legs) => {
        const g = b.g; g.save(); g.translate(x * b.k, y * b.kh); g.rotate(rot); g.scale(flip ? -s : s, s);
        const P = pts => b.poly(W, pts), S = pts => b.poly(WS, pts);
        P([-1.6, 0, 1.6, 0, 2.4, 8, 1, 14, 3.2, 24, 1.2, 24, 0, 16, -1.2, 24, -3.2, 24, -1, 14, -2.4, 8]);
        S([0.5, 1, 1.6, 0, 2.4, 8, 1, 14, 3.2, 24, 1.2, 24, 0.6, 15]);
        if (legs) { P([-1.6, 22, 1.6, 22, 2.4, 40, 0.4, 60, -0.4, 60, -2.4, 40]); S([0.4, 24, 1.6, 22, 2.4, 40, 0.4, 60]); }
        P([-1.6, 2, -6, -1, -10, -4, -10.6, -2.6, -6, 1.6, -2.2, 6]); P([1.6, 2, 6, -1, 10, -4, 10.6, -2.6, 6, 1.6, 2.2, 6]);
        b.ell(W, 0, -3, 2.8, 3); b.ell(WS, 0.9, -2.4, 1.4, 2);
        b.poly('#f8f6ff', [-2.2, -5, -0.6, -10, 0.4, -8, 1.6, -13, 2.2, -5, 0, -3.6]); b.poly('#d8d4f0', [0.4, -8, 1.6, -13, 2.2, -5, 0.6, -5]);
        g.restore();
      };
      dancer(16, 40, -0.5, 1.05, true); dancer(38, 26, -0.25, 0.95); dancer(70, 28, 0.35, 0.95, true); dancer(86, 54, 0.5, 1.05); dancer(16, 70, -0.9, 1, true); dancer(82, 80, 0.75, 1); dancer(50, 88, 0, 1.25, false, true);
    },
    databank(b) {
      const WOOD = '#8a6e4a', WL = '#b09468', WD = '#4a3a2a';
      b.sky(['#3a3026', '#2e2820', '#262018']);
      for (let i = 0; i < 160; i++) b.rect(i % 3 ? '#4a3e30' : '#1e1812', G.hash(i, 81, 1) * 100, G.hash(i, 81, 2) * 140, 0.7, 0.7);
      b.poly('#1e3a42', [28, 54, 86, 44, 86, 108, 28, 118]);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const x = 30 + c * 7 + (r % 2) * 3.5, y = 56 + r * 8 - c * 1.3; b.poly('#2a4e58', [x, y - 2.4, x + 2, y, x, y + 2.4, x - 2, y]); }
      const book = (x, y, w, h, col, tilt) => {
        b.poly(G.dark(col, 0.5), [x, y + tilt, x + w, y, x + w, y + h, x, y + h + tilt]);
        b.poly(col, [x + 0.4, y + tilt + 0.4, x + w - 0.8, y + 0.4, x + w - 0.8, y + h - 0.4, x + 0.4, y + h + tilt - 0.4]);
        b.poly(G.mix(col, '#ffffff', 0.25), [x + 0.6, y + tilt + 0.6, x + 1.6, y + 0.5 + tilt * 0.8, x + 1.6, y + h + tilt * 0.8 - 0.6, x + 0.6, y + h + tilt - 0.6]);
        const cx = x + w / 2, cy = y + h * 0.42 + tilt / 2;
        b.poly('#d8b46a', [cx, cy - 2.6, cx + 1, cy, cx, cy + 2.6, cx - 1, cy]);
        b.rect('#c8a058', x + 1, y + h * 0.15 + tilt * 0.8, w - 2, 0.6);
      };
      const shelf = (y0, books) => {
        let x = 30;
        for (const [w, h, col, tilt] of books) { book(x, y0 - h + (x - 30) * 0.2, w, h, col, tilt || 0); x += w + 0.4; }
        b.poly(WD, [26, y0 + 0.4, 90, y0 + 13.4, 90, y0 + 17, 26, y0 + 4]);
        b.poly(WL, [26, y0 - 0.6, 90, y0 + 12.4, 90, y0 + 13.4, 26, y0 + 0.4]);
      };
      shelf(44, [[9, 22, '#6a2a24', -0.6], [8, 24, '#8a3a2c'], [9, 23, '#7a5a3a'], [8, 21, '#5a2420'], [9, 24, '#9a4a34'], [8, 22, '#6a4a32'], [9, 23, '#7a2e28']]);
      shelf(84, [[10, 30, '#8a2e26'], [10, 29, '#8a6a46', 0.6], [3, 4, '#1e3a42'], [10, 27, '#5a3428'], [10, 29, '#6a2a26'], [10, 28, '#7a4430'], [10, 29, '#5a2624']]);
      shelf(124, [[10, 26, '#5a3a2a'], [10, 28, '#6a2824'], [10, 27, '#7a4a32'], [10, 26, '#8a3a2c'], [10, 27, '#5a2a24'], [10, 28, '#6a4a30']]);
      for (let r = 0; r < 4; r++) { const y = 30 + r * 30; b.poly('#2a2218', [0, y, 22, y + 2, 22, y + 4, 0, y + 3]); for (let i = 0; i < 4; i++) b.poly(i % 2 ? '#3a2018' : '#2e2420', [1 + i * 5, y - 20, 5 + i * 5, y - 20, 5 + i * 5, y + 1, 1 + i * 5, y + 1]); }
      b.poly(WOOD, [22, 0, 30, 0, 30, 140, 22, 140]); b.poly(WL, [22, 0, 24, 0, 24, 140, 22, 140]); b.poly(WD, [28, 0, 30, 0, 30, 140, 28, 140]);
      b.poly(WOOD, [86, 0, 94, 0, 94, 140, 86, 140]); b.poly(WL, [86, 0, 88, 0, 88, 140, 86, 140]); b.poly(WD, [92, 0, 94, 0, 94, 140, 92, 140]);
      b.poly(WD, [0, 18, 100, 6, 100, 10, 0, 22]); b.poly(WL, [0, 17, 100, 5, 100, 6, 0, 18]);
      b.ell('#e8e0c8', 34, 4, 9, 3); b.ell('#fffaf0', 34, 4, 5, 1.8);
      b.line(WD, [86, 24, 88, 40], 1); b.ell('#9a8a6a', 86, 22, 6, 3.6); b.ell('#e8e4d4', 86, 24, 4.4, 1.6);
      b.front();
      const ladder = (x0, y0, x1, y1, w, n) => {
        const dx = x1 - x0, dy = y1 - y0;
        b.line('#3a2e22', [x0, y0, x1, y1], 2); b.line('#3a2e22', [x0 + w, y0, x1 + w, y1], 2);
        b.line('#e0d4b4', [x0, y0, x1, y1], 1.1); b.line('#e0d4b4', [x0 + w, y0, x1 + w, y1], 1.1);
        for (let i = 1; i < n; i++) { const t = i / n, x = x0 + dx * t, y = y0 + dy * t; b.line('#e8dcbc', [x, y, x + w, y - 0.6], 0.9); }
      };
      ladder(8, 22, 24, 112, 8, 13); ladder(48, 112, 52, 140, 7, 5);
      const S = '#f0c858', SL = '#fce68c', SD = '#b88a2c';
      const sx = 50, sy = 24, lens = (dx, rx) => { const pts = []; for (let t = 0; t <= 20; t++) { const a = -Math.PI / 2 + Math.PI * t / 20; pts.push(sx + dx * Math.cos(a) * rx, sy + Math.sin(a) * 22); } return pts; };
      const star4 = (x, y, r, col) => b.poly(col, [x, y - r, x + r * 0.28, y - r * 0.28, x + r, y, x + r * 0.28, y + r * 0.28, x, y + r, x - r * 0.28, y + r * 0.28, x - r, y, x - r * 0.28, y - r * 0.28]);
      for (let i = 0; i < 22; i++) { const a = Math.PI * (1.1 + i * 0.037); b.line(S, [sx + Math.cos(a) * 14, sy + 4 + Math.sin(a) * 14, sx + Math.cos(a) * 20, sy + 4 + Math.sin(a) * 20], 0.6); }
      b.line(SD, [-2, sy, 102, sy], 2); b.line(S, [-2, sy - 0.4, 102, sy - 0.4], 1.1);
      star4(4, sy, 5, S); star4(96, sy, 5, S);
      for (const d of [-1, 1]) { b.line(SD, lens(d, 30), 3); b.line(S, lens(d, 30), 1.8); b.line(SL, lens(d, 30).map((v, i) => (i % 2 ? v : v - d * 0.6)), 0.5); }
      for (const [x, y] of [[sx - 22, sy - 15], [sx + 22, sy - 15], [sx - 22, sy + 15], [sx + 22, sy + 15]]) star4(x, y, 5, S);
      star4(sx - 15, sy, 6, S); star4(sx + 15, sy, 6, S);
      b.poly('#6a4a1c', [sx, sy - 13, sx + 4, sy, sx, sy + 13, sx - 4, sy]); star4(sx, sy, 12, S); b.poly(SL, [sx, sy - 10, sx + 1, sy, sx, sy + 6]);
      const bk = sy + 22;
      for (const d of [-1, 1]) {
        const page = [sx, bk + 6];
        for (let t = 0; t <= 10; t++) { const x = sx + d * 24 * t / 10; page.push(x, bk + 4 - 9 * Math.pow(t / 10, 1.6) - 2 * Math.sin(Math.PI * t / 10)); }
        for (let t = 10; t >= 0; t--) { const x = sx + d * 24 * t / 10; page.push(x, bk + 8 - 7 * Math.pow(t / 10, 1.6) - 1 * Math.sin(Math.PI * t / 10)); }
        b.poly(SD, page.map((v, i) => v + (i % 2 ? 1 : 0))); b.poly(S, page);
        for (let k = 1; k <= 2; k++) b.line(SL, [sx + d * 3, bk + 3.6 + k * 1.2, sx + d * 12, bk - 0.6 + k * 1.4, sx + d * 22, bk - 0.8 + k * 1.2], 0.45);
      }
      b.line(SD, [sx, bk + 2, sx, bk + 9], 0.8);
      const flow = (pts, col) => b.poly(col, pts);
      flow([0, 90, 6, 104, 16, 114, 28, 120, 40, 124, 52, 132, 58, 140, 0, 140], '#e8a830');
      flow([0, 96, 7, 108, 18, 116, 30, 122, 44, 128, 52, 140, 0, 140], '#fbf2dc');
      flow([0, 118, 12, 124, 24, 128, 36, 134, 40, 140, 0, 140], '#d8c4a0');
      flow([100, 74, 96, 96, 86, 116, 74, 126, 62, 134, 56, 140, 100, 140], '#e8a830');
      flow([100, 82, 96, 102, 88, 120, 76, 130, 62, 140, 100, 140], '#fbf2dc');
      flow([100, 112, 92, 124, 82, 132, 76, 140, 100, 140], '#c8b08a');
      b.line('#e8a830', [0, 112, 10, 118, 22, 124, 36, 130], 0.8); b.line('#a88a5a', [4, 126, 14, 130, 26, 134], 0.6); b.line('#a88a5a', [96, 118, 88, 128, 80, 134], 0.6);
    },
    trend(b) {
      b.sky(['#12143a', '#2a2260', '#3a2a6a']);
      for (let i = 0; i < 6; i++) b.rect('rgba(120,200,255,0.12)', 6 + i * 16, 10 + (i % 2) * 8, 8, 30);
      b.bust(look(GIRL, { hair: '#eceaf2', streak: '#d83040', streakSide: 'l', eye: '#d84060', bangs: 'swept', sides: 'long', back: 'shoulder', top: '#2a2438', trim: '#d83040', inner: '#f0eef4', collar: 'v', acc: ['earring:#e0b040'] }), 36, 54, 60);
      b.glow(64, 100, 34, 'rgba(120,220,255,0.6)');
      b.ell('rgba(160,240,255,0.55)', 64, 100, 20, 20);
      b.ring('#c8f8ff', 64, 100, 20, 20, 1);
      b.ring('#c8f8ff', 64, 100, 20, 7, 0.8); b.ring('#c8f8ff', 64, 100, 8, 20, 0.8); b.ring('#c8f8ff', 64, 100, 15, 20, 0.6);
      b.ell('#ffe0a0', 62, 94, 3, 2);
      b.poly('#80d8ff', [44, 124, 84, 124, 76, 132, 52, 132]);
      b.line('#f8d060', [84, 20, 90, 30], 1); b.twinkle(90, 30, 3, '#fff0b0');
    },
    swordplay(b) {
      b.sky(['#5a2a14', '#a05a2a', '#e8a060']);
      b.poly('rgba(255,230,170,0.35)', [60, 0, 90, 0, 60, 140, 20, 140]);
      b.bust(look(GIRL, { hair: '#6a4030', eye: '#8a5a3a', bangs: 'swept', back: 'long', top: '#e8c040', trim: '#8a4ab0', inner: '#f4eee4', collar: 'v', acc: ['bow:#8a4ab0'] }), 46, 60, 66);
      b.poly('#d8dce8', [52, 108, 88, 70, 90, 72, 55, 111]);
      b.poly('#f4f6ff', [88, 70, 94, 64, 90, 72]);
      b.rect('#c89a40', 49, 106, 8, 3); b.rect('#6a3a20', 46, 108, 4, 8);
      b.twinkle(84, 66, 4, '#ffffff');
    },
    underthesky(b) {
      b.sky(['#4aa0e8', '#8ac8f4', '#d8f0ff']);
      b.cloud('#ffffff', 22, 22, 12); b.cloud('#f4faff', 76, 34, 10);
      b.poly('#6ab04a', [0, 96, 50, 88, 100, 94, 100, 140, 0, 140]);
      b.poly('#4a9040', [0, 118, 60, 110, 100, 116, 100, 140, 0, 140]);
      for (let i = 0; i < 26; i++) { const x = G.hash(i, 3, 3) * 100, y = 98 + G.hash(3, i, 4) * 40; b.ell('#ffffff', x, y, 2, 1.6); b.ell('#f0c830', x, y, 0.8, 0.8); }
      const a = look(GIRL, { hair: '#eef0f6', eye: '#d85a8a', bangs: 'messy', sides: 'long', back: 'long', top: '#f4f4fa', trim: '#e8b0c0', inner: '#ffffff', collar: 'bare', coat: 'dress', acc: [] });
      const c = look(GIRL, { hair: '#e6e8f2', eye: '#7aa0d8', bangs: 'blunt', sides: 'short', back: 'shoulder', top: '#f4f4fa', trim: '#a0c0e8', inner: '#ffffff', collar: 'bare', coat: 'dress', acc: [] });
      b.bust(a, 62, 76, 56);
      b.bust(c, 30, 88, 44);
      for (const [x, y, r] of [[62, 54, 13], [30, 72, 10]]) for (let i = 0; i < 7; i++) { const t = Math.PI * (1.05 + i * 0.15); b.ell(['#ff8aa8', '#ffe070', '#ffffff', '#ffb0d0'][i % 4], x + Math.cos(t) * r, y + Math.sin(t) * r * 0.5, 2.2, 2); }
    },
    geniuses(b) {
      b.sky(['#3a2014', '#6a3a22', '#a0683a']);
      b.rect('rgba(255,220,160,0.3)', 60, 8, 32, 40); b.rect('#5a3020', 75, 8, 2, 40); b.rect('#5a3020', 60, 27, 32, 2);
      b.bust(look('herta', { acc: [], closed: true }), 30, 58, 50);
      b.bust(look(GIRL, { hair: '#2a2230', eye: '#6ac0b0', bangs: 'parted', back: 'long', top: '#f0f4f0', trim: '#6ac0b0', inner: '#f8fafa', collar: 'high', acc: ['clip:#6ac0b0'] }), 70, 60, 50);
      b.ell('#5a2e1a', 50, 124, 56, 20);
      b.ell('#6a3a22', 50, 120, 52, 16);
      b.ell('#f4f0ea', 40, 116, 16, 5);
      for (const [x, y] of [[34, 112], [40, 110], [46, 112], [37, 116], [44, 116]]) { b.ell('#6ab040', x, y, 3.4, 3); b.ell('#9ad870', x - 1, y - 1, 1.4, 1.2); }
      b.ell('#f4f4f8', 72, 114, 5, 3); b.rect('#f4f4f8', 67, 108, 10, 6); b.ell('#c87a3a', 72, 108.5, 4.2, 1.2);
    },
    memories(b) {
      b.sky(['#2a1a10', '#4a3020', '#7a5234']);
      b.glow(70, 20, 40, 'rgba(255,220,160,0.45)');
      b.poly('#6a4a30', [0, 96, 100, 90, 100, 140, 0, 140]);
      b.poly('#8a6440', [0, 96, 100, 90, 100, 94, 0, 100]);
      b.poly('#c8a060', [22, 30, 74, 24, 80, 96, 28, 102]);
      b.poly('#e8d8b8', [26, 34, 71, 29, 76, 91, 31, 97]);
      b.poly('#c8aa80', [30, 38, 68, 34, 72, 86, 34, 91]);
      const sep = { skin: '#e8cca8', eye: '#6a4a30', inner: '#e0c8a0' };
      b.bust(look('cocolia', Object.assign({ hair: '#d8c49c', top: '#8a6a48', trim: '#c8aa80', acc: [] }, sep)), 58, 62, 34);
      b.bust(look('bronya', Object.assign({ hair: '#c8b8a0', top: '#a88a64', trim: '#c8aa80', acc: [] }, sep)), 42, 72, 24);
      b.poly('rgba(90,60,30,0.25)', [30, 38, 68, 34, 72, 86, 34, 91]);
    },
    goodnight(b) {
      const Q = (c, p) => b.poly(c, p), L = (c, p, w) => b.line(c, p, w), g = b.g;
      b.sky(['#120e18', '#1e1824', '#2e2430']);
      b.glow(76, 30, 46, 'rgba(255,214,150,0.35)');
      Q('#3a2c2a', [0, 96, 100, 84, 100, 140, 0, 140]);
      Q('#d8c4a6', [8, 104, 56, 92, 70, 122, 22, 136]); Q('#eadcc2', [44, 98, 96, 90, 100, 118, 56, 128]);
      for (let i = 0; i < 7; i++) { L('#a89074', [14 + i * 1.6, 108 + i * 3.6, 50 + i * 1.6, 98 + i * 3.6], 0.45); L('#b8a084', [52 + i, 101 + i * 3.2, 90 + i, 94 + i * 3.2], 0.45); }
      for (let i = 0; i < 7; i++) { const y = 64 + i * 4.6; Q(i % 2 ? '#7a7e8e' : '#9a9eae', [0, y, 14, y - 2, 15, y + 1.6, 0, y + 3.6]); }
      b.front();
      const H1 = '#2e2440', H2 = '#4c3e5e', H3 = '#7a6a92', H4 = '#a898bc';
      const SK = '#f6e0d4', SS = '#e2bcb0', SH = '#fff2ea';
      Q('#2a2228', [6, 98, 30, 84, 62, 82, 92, 92, 98, 104, 70, 112, 30, 112]);
      Q('#3c3238', [12, 98, 32, 88, 60, 86, 86, 94, 66, 102, 32, 104]);
      L('#c8a048', [20, 101, 40, 94, 62, 93], 0.8);
      Q('#e8e2d6', [56, 70, 74, 62, 90, 70, 96, 90, 86, 96, 66, 88]); Q('#c8c0b2', [66, 88, 86, 96, 96, 90, 92, 98, 70, 96]);
      L('#d8b050', [70, 64, 78, 82, 84, 94], 0.9);
      Q(H1, [16, 50, 22, 30, 36, 18, 54, 16, 70, 24, 80, 38, 82, 56, 76, 74, 66, 86, 50, 90, 34, 88, 22, 78, 16, 64]);
      Q(H2, [22, 46, 28, 30, 40, 22, 56, 21, 68, 28, 74, 40, 70, 44, 58, 36, 44, 34, 32, 40]);
      for (const [x0, y0, x1, y1] of [[30, 30, 22, 54], [42, 24, 36, 44], [56, 22, 58, 40], [66, 28, 72, 46]]) L(H3, [x0, y0, (x0 + x1) / 2 + 1, (y0 + y1) / 2, x1, y1], 0.8);
      L(H4, [36, 26, 48, 22, 60, 24], 0.8);
      const fx = 50, fy = 64;
      g.save(); g.translate(fx * b.k, fy * b.kh); g.rotate(-0.22); g.translate(-fx * b.k, -fy * b.kh);
      Q(SK, [30, 50, 70, 50, 72, 64, 66, 78, 56, 86, 44, 86, 34, 78, 28, 64]);
      Q(SS, [30, 50, 36, 50, 34, 66, 40, 80, 34, 78, 28, 64]);
      Q(SH, [56, 56, 68, 55, 68, 66, 60, 66]);
      const lid = (x, d) => {
        L('#2a1820', [x - 6 * d, 62, x - 2 * d, 65, x + 3 * d, 65.4, x + 6 * d, 63.4], 1);
        for (const t of [0.2, 0.45, 0.7, 0.92]) { const lx = x - 6 * d + 12 * d * t, ly = 62 + Math.sin(t * Math.PI) * 3.2; L('#2a1820', [lx, ly, lx - d * 0.4, ly + 1.6], 0.5); }
        L('#c0928a', [x - 4 * d, 58.6, x + 3 * d, 57.6], 0.6);
      };
      lid(40, 1); lid(60, -1);
      b.ell('#f2a8a0', 36, 70, 4, 1.8); b.ell('#f2a8a0', 64, 70, 4, 1.8);
      L('#c8888a', [47, 76, 50, 77.4, 53, 76.6], 0.7); L('#d8a8a4', [50, 69, 50.6, 71], 0.5);
      Q(H2, [26, 54, 28, 42, 40, 37, 50, 39, 60, 37, 72, 42, 74, 54, 70, 50, 67, 57, 63, 51, 57, 56, 52, 50, 47, 57, 42, 51, 37, 58, 32, 51]);
      for (const [x0, y0, x1, y1] of [[40, 40, 38, 52], [50, 40, 50, 54], [60, 40, 62, 52]]) L(H3, [x0, y0, x1, y1], 0.6);
      g.restore();
      Q(H1, [18, 56, 26, 52, 28, 70, 24, 86, 18, 80]); Q(H1, [74, 50, 82, 54, 84, 72, 78, 84, 74, 70]);
      L('#d8dce8', [70, 40, 76, 36], 1.1); b.rect('#f8f8fc', 74.6, 36.2, 1.4, 1.4);
      L('#8a6a2a', [28, 22, 29, 36, 28, 44], 2.4); L('#e8c868', [28, 22, 29, 36, 28, 44], 1.3); Q('#3ac0d0', [25.6, 19, 30, 18, 31, 23, 26.6, 24]); Q('#e8c868', [27, 44, 30, 44, 28.6, 48]);
      Q('#5ac0b0', [44, 86, 54, 84, 49, 92]); Q('#3a9a8c', [49, 86, 54, 84, 50.6, 90]);
      Q('#8a1a26', [62, 0, 100, 0, 100, 60, 92, 48, 84, 28, 74, 14]);
      Q('#b8283a', [68, 0, 100, 0, 100, 50, 92, 40, 86, 22, 78, 10]);
      for (let i = 0; i < 4; i++) { const y = 8 + i * 10; L('#e0b860', [80 + i * 2, y, 86 + i * 2, y + 4, 92 + i * 2, y], 0.6); b.rect('#f0d070', 85.4 + i * 2, y + 4.4, 1.4, 1.4); }
      const SKN = ['#e8c4b4', '#fce4d8', '#9a6a5e'];
      Q(SKN[2], [64, 26, 74, 22, 82, 26, 80, 34, 72, 36, 66, 32]); Q(SKN[0], [65, 26.6, 74, 23, 81, 27, 79, 33.6, 72, 35, 67, 31.6]); Q(SKN[1], [68, 26, 74, 24, 78, 27, 72, 29]);
      b.finger([67, 31, 63, 35, 60, 39], 2.6, SKN, '#7a6aa0'); b.finger([71, 34, 68, 39, 66, 43], 2.6, SKN, '#7a6aa0'); b.finger([75, 35, 73, 40, 72, 44], 2.5, SKN, '#7a6aa0'); b.finger([79, 33, 79, 38, 79, 42], 2.3, SKN, '#7a6aa0');
      b.finger([66, 27, 61, 27, 58, 30], 2.6, SKN, '#7a6aa0');
      Q('#d8d6e4', [78, 18, 100, 6, 100, 28, 84, 30]); L('#a8a6b8', [82, 20, 98, 12], 0.6);
      b.ring('#e0e0e8', 30, 120, 7, 5, 1); b.ring('#e0e0e8', 48, 118, 7, 5, 1); L('#d0d0d8', [37, 119.6, 41, 119], 0.9); L('#d0d0d8', [55, 117, 62, 112], 0.8);
      b.ell('#fbf6ee', 28, 118, 2.4, 1.2); b.ell('#fbf6ee', 46, 116, 2.4, 1.2);
      L('#1e3050', [64, 124, 92, 112], 2.2); L('#4a6a9a', [64, 124, 92, 112], 1.4); L('#a8c4e8', [64, 123.4, 90, 112.4], 0.4);
    },
    postop(b) {
      const Q = (c, p) => b.poly(c, p), L = (c, p, w) => b.line(c, p, w);
      b.sky(['#5e8890', '#9cc0c4', '#c4dcdc']);
      Q('#e8f2f2', [22, 0, 78, 0, 74, 40, 70, 70, 30, 70, 26, 40]); Q('#f8fcfc', [34, 0, 64, 0, 60, 30, 38, 30]);
      Q('#2c5a64', [0, 0, 18, 0, 22, 30, 16, 70, 0, 80]); Q('#3e7682', [8, 0, 16, 0, 18, 30, 12, 60, 6, 66]);
      Q('#2c5a64', [82, 0, 100, 0, 100, 60, 86, 40]); Q('#4a8a96', [88, 0, 96, 0, 98, 30, 90, 24]);
      L('#1e3a44', [4, 0, 10, 20, 6, 46], 1.6); L('#1e3a44', [96, 0, 90, 18, 94, 40], 1.8); L('#30484e', [78, 0, 84, 10, 88, 6], 1.2);
      Q('#b8c8cc', [0, 96, 50, 104, 100, 96, 100, 140, 0, 140]);
      b.front();
      const HD = '#24485e', HM = '#33637e', HL = '#4f8aa8', HH = '#7cb6ce', SK = '#f6e2d8', SS = '#e4c2b6', SD = '#c89a92';
      const CW = '#eef0f4', CS = '#cdd2dc', CD = '#9aa2b4', GL = '#6a8ac4', GH = '#9ab8e2', GD = '#4a64a0';
      Q(HD, [24, 14, 30, 4, 44, 0, 58, 2, 68, 10, 72, 24, 70, 40, 66, 50, 60, 46, 56, 36, 38, 36, 34, 48, 30, 58, 26, 52, 24, 36]);
      Q(HM, [26, 18, 32, 8, 44, 3, 56, 5, 64, 12, 66, 24, 62, 30, 56, 24, 36, 24, 30, 30, 28, 40]);
      Q(HD, [30, 40, 32, 56, 28, 62, 34, 58, 36, 46]);
      Q(HL, [27, 36, 26, 50, 29, 60, 31, 52, 30, 40]); Q(HH, [27, 50, 28, 58, 30, 56]);
      Q(HL, [64, 30, 68, 42, 66, 50, 63, 44]);
      Q(SK, [34, 22, 56, 22, 57, 34, 54, 40, 47, 45, 40, 42, 35, 34]);
      Q(SS, [34, 22, 37, 22, 37, 34, 40, 41, 35, 34]);
      Q(HM, [32, 22, 36, 14, 44, 10, 52, 11, 58, 16, 59, 24, 56, 29, 54, 23, 52, 30, 49, 22, 46, 31, 43, 22, 40, 30, 38, 23, 35, 31, 32, 30]);
      for (const [x0, y0, x1, y1] of [[44, 10, 46, 31], [38, 13, 38, 23], [52, 12, 53, 26], [56, 16, 56, 29]]) L(HD, [x0, y0, x1, y1], 0.6);
      L(HH, [36, 12, 44, 8, 52, 9], 0.8); L(HL, [40, 14, 44, 20], 0.6); L(HL, [50, 13, 53, 20], 0.6);
      const eye = (x, y, flip) => {
        Q('#fbf6f4', [x - 3.6, y + 0.2, x + 3.6, y - 0.2, x + 3, y + 2.4, x - 3, y + 2.4]);
        b.ell('#5a1020', x + flip * 0.2, y + 1.2, 2.1, 1.9); b.ell('#c8283a', x + flip * 0.2, y + 1.4, 1.7, 1.5); b.ell('#f07080', x + flip * 0.2, y + 2.2, 1.1, 0.6);
        b.ell('#3a0a14', x + flip * 0.2, y + 1, 0.7, 0.9); b.rect('#ffffff', x - 1.2 + flip * 0.2, y + 0.2, 0.8, 0.8);
        Q('#e0b8ae', [x - 3.8, y - 1.6, x + 3.8, y - 2, x + 3.6, y + 0.1, x - 3.6, y + 0.4]);
        L('#2a1418', [x - 3.8 * flip, y + 0.6, x, y - 0.1, x + 3.8 * flip, y - 0.3, x + 4.6 * flip, y - 1.2], 0.9);
        L(SD, [x - 2.6, y + 3.1, x + 2.6, y + 2.9], 0.4);
      };
      eye(39, 29.5, -1); eye(52, 29, 1);
      L('#4a2a30', [37, 26.2, 42, 25.6], 0.5); L('#4a2a30', [49, 25.4, 54, 26], 0.5);
      Q('#f4f6f8', [35, 32.5, 57, 32, 56, 39, 51, 43.5, 46, 45, 41, 43, 36, 39]);
      Q('#d4d8e0', [48, 32.2, 57, 32, 56, 39, 51, 43.5, 47, 44.8]);
      for (const y of [35, 38, 41]) L('#c0c6d0', [38, y, 54, y - 0.2], 0.35);
      L('#d8dce4', [35, 33, 33, 30], 0.5); L('#d8dce4', [57, 32.2, 59, 29], 0.5);
      Q('#1e1a1c', [40, 43, 54, 42, 55, 52, 40, 52]); Q('#2e2a2c', [40, 43, 46, 44.6, 46, 52, 40, 52]);
      for (const y of [46, 49]) L('#3e3a3c', [40, y, 55, y - 0.4], 0.35);
      b.ring('#9aa0a8', 46.6, 49, 1.2, 1.2, 0.6);
      Q(CS, [20, 56, 30, 50, 40, 50, 47, 56, 56, 50, 70, 48, 78, 52, 80, 62, 78, 80, 74, 96, 66, 104, 40, 108, 22, 106, 16, 90]);
      Q(CW, [22, 58, 32, 52, 40, 52, 46, 60, 46, 88, 30, 98, 18, 90]);
      Q(CW, [48, 60, 56, 52, 68, 50, 76, 54, 76, 66, 74, 84, 68, 90, 52, 90]);
      Q('#1a1618', [40, 52, 47, 56, 54, 52, 52, 66, 42, 66]);
      Q(CD, [46, 66, 48, 90, 46, 92, 44, 66]);
      L(CD, [26, 70, 30, 96], 0.6); L(CD, [74, 60, 70, 88], 0.6);
      Q(CW, [30, 86, 72, 84, 72, 89, 30, 92]); L(CD, [30, 92, 72, 89], 0.5); Q('#b8bec8', [58, 85, 63, 85, 63, 90, 58, 90]);
      b.ring('#5a5e68', 28, 90, 1.6, 2.4, 0.7); Q('#f6f8fa', [37, 67, 44, 66.6, 44, 68.6, 37, 69]);
      L('#2a2a30', [42, 52, 47.6, 58, 53, 52], 0.6);
      b.ell('#6a8a2a', 47.6, 61, 4.2, 4.4); b.ell('#a8d440', 47.4, 61.4, 3.6, 3.8); b.ell('#d8f480', 46.4, 59.8, 1.4, 1.6);
      Q('#a8d440', [45, 64, 50, 64, 47.6, 70]); b.rect('#3a3a3a', 46.6, 56.2, 2, 1.4); L('#ffffff', [45, 60, 45.6, 58.6], 0.4);
      Q('#a8203a', [10, 66, 26, 60, 32, 66, 28, 74, 14, 76]);
      Q('#c8283c', [12, 66, 0, 60, -2, 72, 4, 74, 0, 84, 10, 78, 16, 76]); Q('#e04c5c', [10, 67, 2, 63, 1, 70, 8, 72]);
      Q('#8a1a2c', [4, 74, 0, 84, 8, 80]); L('#701428', [14, 68, 26, 64], 0.5);
      Q(CS, [68, 50, 78, 54, 80, 68, 74, 80, 62, 82, 58, 76, 68, 72, 70, 62]); Q(CW, [70, 52, 77, 56, 77, 68, 72, 76, 64, 78, 68, 70]); L(CD, [70, 54, 74, 66, 70, 74], 0.5);
      const hand = (pts, hi, fing) => { Q(GD, pts.map((v, i) => v + (i % 2 ? 0.4 : 0.3))); Q(GL, pts); Q(GH, hi); for (const f of fing) { L(GD, f, 2); L(GL, f, 1.3); } };
      hand([42, 72, 52, 70, 60, 74, 62, 80, 54, 82, 46, 80], [46, 72, 52, 71, 56, 74, 50, 75], [[44, 74, 38, 75], [44, 76, 37, 77.6], [45, 78, 39, 80], [47, 80, 42, 82.4]]);
      L('#9aa0aa', [36, 75, 30, 73, 26, 72], 1); b.ell('#e4e8ee', 24, 71.6, 2.8, 2); b.ell('#a8b0bc', 24, 71.6, 1.4, 1); L('#7a8290', [36, 75, 40, 78, 44, 86, 46, 96], 0.8);
      Q('#f0d4c6', [0, 92, 22, 94, 40, 98, 40, 104, 22, 102, 0, 102]); Q('#dab6a8', [0, 99, 22, 100, 40, 103, 40, 104, 22, 102, 0, 102]);
      Q('#efe8dc', [16, 92.6, 30, 95, 30, 103, 16, 101.6]); for (const x of [19, 23, 27]) L('#c8bcac', [x, 93.4, x - 0.6, 102], 0.5);
      Q(CS, [6, 76, 22, 80, 24, 96, 10, 98, 4, 88]); Q(CW, [8, 78, 20, 82, 20, 94, 10, 95]);
      hand([4, 94, 14, 92, 20, 96, 18, 104, 8, 106, 2, 102], [6, 95, 12, 93.6, 16, 96, 10, 98], [[16, 98, 24, 96], [17, 100, 26, 99], [16, 103, 24, 103], [12, 105, 18, 107]]);
      Q(CW, [0, 106, 20, 104, 44, 110, 64, 114, 60, 140, 0, 140]); Q(CS, [0, 120, 20, 116, 40, 122, 50, 140, 0, 140]); L(CD, [10, 110, 30, 116, 42, 128], 0.6);
      Q('#2a1e18', [74, 62, 84, 54, 96, 52, 100, 54, 100, 108, 92, 104, 86, 96, 80, 84]);
      Q('#4a362a', [80, 62, 88, 56, 98, 56, 100, 62, 94, 64, 86, 68]);
      for (const [x0, y0, x1, y1] of [[84, 58, 80, 80], [90, 57, 92, 100], [96, 58, 98, 104], [88, 60, 86, 92]]) L('#5a4434', [x0, y0, (x0 + x1) / 2 + 1.4, (y0 + y1) / 2, x1, y1], 0.7);
      Q('#f4dccc', [84, 66, 96, 64, 99, 70, 99, 84, 92, 88, 86, 84, 83, 76]);
      Q('#e4c4b4', [92, 64, 96, 64, 99, 70, 99, 84, 94, 86]);
      Q('#3a2a22', [84, 66, 90, 62, 97, 63, 94, 68, 88, 70, 85, 72]);
      L('#3a2420', [86, 74.6, 89, 75.6, 92, 75], 0.6); L('#3a2420', [87, 72.6, 91, 72.4], 0.4);
      Q('#eef2f6', [82, 78, 92, 76, 96, 82, 92, 90, 84, 90, 80, 84]); Q('#c8d0da', [82, 84, 92, 82, 92, 90, 84, 90]);
      b.ell('#ffffff', 85, 79.6, 2, 1.2); L('#e8ecf0', [92, 77, 99, 72], 0.6); L('#e8ecf0', [94, 86, 100, 88], 0.6);
      Q('#1a1416', [86, 92, 100, 88, 100, 104, 90, 104]);
      const hose = []; for (let t = 0; t <= 24; t++) { const u = t / 24; hose.push(81 - u * 14 + Math.sin(u * 3) * 2, 86 + u * 16); }
      L('#3a3c50', hose, 3); for (let i = 0; i < 24; i += 2) L('#6a6e88', [hose[i * 2] - 1.4, hose[i * 2 + 1], hose[i * 2] + 1.4, hose[i * 2 + 1] + 0.4], 0.6);
      Q('#141012', [58, 106, 72, 100, 100, 102, 100, 140, 64, 140]); Q('#2a2226', [66, 110, 80, 104, 100, 106, 100, 112, 78, 112]); Q('#221c1a', [60, 106, 72, 102, 84, 104, 70, 112]);
      Q('#8a959c', [72, 98, 86, 97, 88, 122, 72, 123]); Q('#2a3426', [73, 108, 87, 107, 87, 122, 73, 122]); Q('#c4d0d4', [73, 99, 76, 99, 76, 121, 73, 121]);
      Q('#3a3a40', [71.6, 95, 86.6, 94.6, 86.8, 98, 71.8, 98.4]);
      for (const [x, y, r] of [[77, 112, 1.8], [81, 109, 2.2], [84, 114, 1.4]]) { L('#e8e0a8', [x, y + 6, x, y + 1], 0.6); b.ell('#fce890', x, y, r, r * 0.6); b.ell('#ffffff', x - r * 0.3, y - 0.2, r * 0.4, r * 0.25); }
      Q('#4a2c16', [60, 118, 68, 118, 68, 132, 60, 132]); Q('#d8c8a8', [60, 122, 68, 122, 68, 126, 60, 126]); Q('#2a1a10', [59.6, 116, 68.4, 116, 68.4, 118.4, 59.6, 118.4]);
      Q('#4a2c16', [74, 128, 84, 125, 86, 132, 76, 136]); Q('#2a1a10', [84, 125, 86, 124.4, 88, 131, 86, 132]);
    },
    milkyway(b) {
      b.sky(['#06081e', '#12143a', '#2a1a4a']);
      b.stars(60, 11, 0, 140);
      b.poly('rgba(140,140,220,0.35)', [0, 110, 100, 20, 100, 50, 0, 140]);
      b.poly('rgba(200,190,255,0.3)', [0, 118, 100, 30, 100, 40, 0, 128]);
      for (let i = 0; i < 30; i++) { const t = G.hash(i, 4, 4); b.rect('#ffffff', t * 100, 120 - t * 90 + G.hash(4, i, 5) * 16 - 8, 0.9, 0.9); }
      b.figure(G.lookOf('himeko', null), 50, 72, 118, { rot: -0.18 });
      b.line('rgba(210,40,50,0.8)', [40, 22, 26, 16, 14, 24], 3);
      b.twinkle(84, 16, 4, '#fff4d0'); b.twinkle(14, 60, 3, '#ffffff');
    },
    butthebattle(b) {
      b.sky(['#6a7898', '#aab8d0', '#dde4ee']);
      b.rect('#8a94a8', 4, 24, 20, 90); b.rect('#9aa4b8', 6, 20, 16, 6); b.rect('#7a8498', 76, 16, 22, 100); b.rect('#9aa4b8', 74, 12, 26, 6);
      for (let i = 0; i < 4; i++) { b.rect('#c8d0e0', 9, 32 + i * 18, 4, 8); b.rect('#c8d0e0', 82, 26 + i * 20, 4, 9); b.rect('#c8d0e0', 90, 26 + i * 20, 4, 9); }
      b.poly('#eef2f8', [0, 116, 100, 108, 100, 140, 0, 140]);
      b.line('#2a2a34', [26, 100, 74, 36], 2.4); b.line('#4a4a58', [66, 48, 76, 34], 1.2);
      b.figure(G.lookOf('bronya', null), 50, 134, 124);
      for (let i = 0; i < 30; i++) b.rect('#ffffff', G.hash(i, 2, 8) * 100, G.hash(8, i, 2) * 140, 1, 1);
    },
    moment(b) {
      b.sky(['#0e1a4a', '#1e3a8a', '#4a6ad0']);
      for (let i = 0; i < 14; i++) { const y = G.hash(i, 7, 7) * 140; b.line('rgba(200,230,255,0.5)', [0, y, 100, y - 30], 0.7); }
      b.figure(G.lookOf('gepard', null), 46, 134, 126);
      b.poly('#a8e0ff', [58, 60, 80, 40, 92, 56, 84, 96, 64, 104]);
      b.poly('#e0f6ff', [62, 62, 80, 44, 84, 58, 70, 74]);
      b.poly('#6ab0e8', [84, 96, 92, 56, 94, 80]);
      b.twinkle(78, 50, 6, '#ffffff');
      b.line('#f0d070', [30, 30, 38, 22], 1); b.twinkle(38, 22, 3, '#fff0b0');
    },
    mirror(b) {
      b.sky(['#24080e', '#561420', '#1c3838']);
      b.poly('rgba(40,120,120,0.55)', [56, 0, 100, 0, 100, 74, 78, 44]);
      b.poly('rgba(160,24,36,0.65)', [0, 84, 34, 70, 26, 140, 0, 140]);
      b.glow(60, 50, 44, 'rgba(255,206,120,0.5)');
      b.ell('#8a6224', 60, 50, 31, 35);
      b.ell('#e2b860', 60, 50, 28.5, 32.5);
      b.ell('#4a3020', 60, 50, 25.5, 29.5);
      b.glow(60, 46, 26, 'rgba(255,224,160,0.45)');
      b.bust(look('ruanmei', { closed: true }), 62, 52, 44, { alpha: 0.7, flip: true });
      b.ring('rgba(255,236,170,0.8)', 60, 50, 27, 31, 0.8);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; b.ell('#f2d27a', 60 + Math.cos(a) * 30, 50 + Math.sin(a) * 34, 1.6, 1.6); }
      b.bust(look('ruanmei'), 34, 96, 66);
      const flower = (x, y, r) => { for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4 - 0.3; b.ell('#fbf6ee', x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, r * 0.75); } b.ell('#f0c040', x, y, r * 0.35, r * 0.35); };
      flower(16, 22, 3.2); flower(28, 12, 2.4); flower(88, 92, 3.4); flower(80, 108, 2.4); flower(70, 128, 2.8); flower(10, 70, 2.2);
      for (let i = 0; i < 9; i++) b.ell(i % 2 ? '#fbf8f2' : '#d8ccc8', 52 + i * 3.6, 118 - Math.sin(i / 8 * Math.PI) * 6, 1.3, 1.3);
      b.twinkle(86, 20, 3.4, '#fff0c0');
    },
    night(b) {
      b.sky(['#03051a', '#0a1446', '#1c2c7a']);
      b.stars(44, 17, 0, 96);
      b.glow(80, 20, 24, 'rgba(180,200,255,0.45)');
      b.ell('#eef2ff', 80, 20, 8, 8); b.ell('#c8d4f4', 82, 18, 2.4, 2);
      b.poly('#081038', [0, 106, 28, 98, 62, 104, 100, 96, 100, 140, 0, 140]);
      for (let i = 0; i < 22; i++) {
        const x = G.hash(i, 31, 2) * 100, y = 104 + G.hash(32, i, 3) * 34;
        b.ell(i % 3 ? '#4a7af0' : '#7aa8ff', x, y, 2.4, 1.3); b.ell('#cfe4ff', x, y - 0.3, 0.7, 0.5);
      }
      b.glow(46, 70, 34, 'rgba(150,110,255,0.35)');
      b.line('#d8c8ff', [70, 24, 88, 96], 1.4);
      b.poly('#b8a0ff', [70, 24, 56, 18, 46, 24, 58, 22, 68, 28]);
      b.figure(look('seele'), 46, 74, 122);
      const fly = (x, y, s, col) => { b.poly(col, [x, y, x - 4 * s, y - 3.5 * s, x - 3.2 * s, y + 1.4 * s]); b.poly(col, [x, y, x + 4 * s, y - 3.5 * s, x + 3.2 * s, y + 1.4 * s]); b.glow(x, y, 5 * s, 'rgba(200,160,255,0.45)'); };
      fly(18, 40, 1.2, '#c8a8ff'); fly(84, 56, 1, '#e0c8ff'); fly(26, 92, 0.9, '#b890ff'); fly(76, 80, 0.8, '#d8b8ff'); fly(12, 120, 1.1, '#a888ff');
    },
    shrine(b) {
      b.sky(['#0a1222', '#1a2a46', '#4a5a7a']);
      b.glow(50, 46, 46, 'rgba(120,200,255,0.25)');
      b.poly('#2a3450', [0, 92, 30, 70, 54, 84, 78, 64, 100, 80, 100, 140, 0, 140]);
      b.rect('#b8242e', 14, 30, 72, 5); b.poly('#d03038', [8, 26, 92, 26, 88, 31, 12, 31]); b.rect('#1a1a22', 6, 24, 88, 2.4);
      b.rect('#b8242e', 22, 35, 5, 70); b.rect('#b8242e', 73, 35, 5, 70); b.rect('#b8242e', 18, 44, 64, 3.4);
      b.rect('#8a1a22', 22, 35, 1.4, 70); b.rect('#8a1a22', 73, 35, 1.4, 70);
      b.poly('#eef4fc', [0, 112, 50, 104, 100, 112, 100, 140, 0, 140]);
      b.poly('#d4e2f2', [0, 120, 40, 114, 100, 122, 100, 140, 0, 140]);
      b.ell('#eef4fc', 24.5, 105, 5, 1.6); b.ell('#eef4fc', 75.5, 105, 5, 1.6);
      b.figure(look('miyabi'), 50, 108, 104);
      b.line('#2a2a34', [62, 112, 92, 96], 2.6); b.line('#c8ccd8', [62, 112, 66, 110], 2.6); b.rect('#d8b050', 64, 109.6, 2, 2);
      for (const [x, y, s] of [[14, 60, 1], [86, 50, 0.8], [30, 20, 0.7]]) { b.glow(x, y, 9 * s, 'rgba(90,180,255,0.6)'); b.poly('#a8e0ff', [x, y - 7 * s, x + 3 * s, y, x, y + 3 * s, x - 3 * s, y]); b.ell('#ffffff', x, y, 1 * s, 1.4 * s); }
      for (let i = 0; i < 46; i++) b.rect('#ffffff', G.hash(i, 6, 1) * 100, G.hash(6, i, 2) * 140, 0.9, 0.9);
    },
    weaver(b) {
      b.sky(['#120a22', '#2a1a46', '#5a2a5a']);
      b.stars(30, 23, 0, 80);
      b.glow(50, 50, 44, 'rgba(170,120,255,0.35)');
      b.ring('#c8b0ff', 50, 50, 34, 34, 2.4); b.ring('#6a4aa8', 50, 50, 30, 30, 1);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; b.rect(i % 3 ? '#a890e0' : '#f0e0ff', 50 + Math.sin(a) * 31 - 0.8, 50 - Math.cos(a) * 31 - 0.8, 1.6, 1.6); }
      b.line('#f0e0ff', [50, 50, 50, 26], 1.6); b.line('#f0e0ff', [50, 50, 66, 58], 2.2);
      b.ell('#f4f0ff', 78, 18, 8, 8); b.ell('#2a1a46', 82, 16, 7, 7);
      for (let i = 0; i < 5; i++) b.line('rgba(200,170,255,0.45)', [0, 70 + i * 9, 30, 64 + i * 7, 70, 76 + i * 6, 100, 66 + i * 8], 0.6);
      b.rect('#1a1222', 0, 112, 100, 28);
      b.line('#c8ccd8', [10, 128, 70, 18], 1.6); b.poly('#e8eef8', [70, 18, 76, 6, 73, 20]); b.rect('#60e0ff', 32, 87, 3, 3);
      b.bust(look('yanagi'), 56, 96, 58);
      for (const [x, y] of [[20, 30], [86, 74], [16, 104]]) { b.line('#ffe060', [x, y, x + 3, y + 4, x + 1, y + 5, x + 4, y + 10], 0.8); }
    },
    lethe(b) {
      b.sky(['#12020a', '#3a0614', '#14040c']);
      b.glow(56, 52, 50, 'rgba(255,60,90,0.35)');
      for (let i = 0; i < 9; i++) {
        const x = 30 + i * 7.4, top = 18 + Math.abs(i - 4) * 6;
        b.rect('#5a3a14', x, top, 5, 90 - top);
        b.rect('#d8a848', x + 0.8, top, 2, 90 - top);
        b.ell('#2a1a0a', x + 2.5, top + 2, 2.2, 1.6);
      }
      b.poly('#0c0206', [0, 96, 100, 90, 100, 140, 0, 140]);
      b.poly('#2a0a14', [0, 104, 100, 98, 100, 106, 0, 112]);
      for (let i = 0; i < 6; i++) b.line('rgba(255,120,150,0.35)', [0, 112 + i * 5, 50, 108 + i * 5.5, 100, 110 + i * 5], 0.6);
      b.bust(look('phrolova'), 34, 84, 62);
      const lily = (x, y, r, col) => { for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55; b.line(col, [x, y, x + Math.cos(a - 0.3) * r * 0.7, y + Math.sin(a - 0.3) * r * 0.7, x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a + 0.9) * r * 0.8, y + Math.sin(a + 0.9) * r * 0.8], 1.3); } for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.42; b.line('#ffb8c8', [x, y, x + Math.cos(a) * r * 1.4, y + Math.sin(a) * r * 1.4], 0.4); } };
      b.line('#5a0c18', [62, 96, 80, 34], 1.6);
      b.glow(80, 32, 16, 'rgba(255,40,80,0.6)');
      lily(80, 32, 10, '#ff2a4a');
      lily(14, 124, 6, '#e01e3c'); lily(88, 120, 7, '#ff3a58'); lily(56, 130, 5, '#c81830');
      for (const [x, y, r] of [[18, 20, 0.4], [70, 70, -0.3], [90, 56, 0.8], [42, 30, -0.6]]) { b.g.save(); b.g.translate(x * b.k, y * b.kh); b.g.rotate(r); b.g.fillStyle = 'rgba(220,240,255,0.55)'; b.g.beginPath(); b.g.moveTo(0, -6 * b.kh); b.g.lineTo(3 * b.k, 3 * b.kh); b.g.lineTo(-2 * b.k, 5 * b.kh); b.g.fill(); b.g.restore(); }
      for (let i = 0; i < 14; i++) b.ell(i % 2 ? '#ff3a5a' : '#b81830', G.hash(i, 81, 2) * 100, G.hash(81, i, 3) * 120, 1.2, 0.7, G.hash(i, 82, 1) * 3);
    },
    lullaby(b) {
      b.sky(['#04040c', '#140a14', '#2a1008']);
      b.stars(30, 41, 0, 60);
      b.ell('#f2ead0', 82, 18, 7, 7); b.ell('#140a14', 85, 16, 6, 6);
      b.poly('#0a0608', [0, 90, 12, 76, 26, 82, 40, 70, 58, 80, 74, 68, 88, 78, 100, 72, 100, 140, 0, 140]);
      b.glow(54, 104, 34, 'rgba(255,130,40,0.55)');
      const fx = 54, fy = 108;
      for (let i = 0; i < 5; i++) b.poly(i % 2 ? '#ffb040' : '#ff5a1a', [fx - 8 + i * 4 - 2.6, fy, fx - 8 + i * 4, fy - 12 - (i % 3) * 4, fx - 8 + i * 4 + 2.6, fy]);
      b.rect('#3a2418', fx - 10, fy, 20, 2.4);
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (0.15 + i * 0.12), x = fx + Math.cos(a) * 30, y = 122 - Math.sin(a) * 6;
        b.ell('#f0ece4', x, y, 4, 2.8); b.ell('#f0ece4', x + 3, y - 2, 1.8, 1.6); b.rect('#3a3436', x - 2.6, y + 2, 0.9, 2.4); b.rect('#3a3436', x + 1.8, y + 2, 0.9, 2.4);
      }
      b.ell('#141014', 30, 128, 5.4, 3.6); b.ell('#141014', 34, 125, 2.4, 2.2); b.ell('#ffd040', 34.6, 124.6, 0.5, 0.5);
      b.rect('#141014', 27, 131, 1, 3); b.rect('#141014', 32, 131, 1, 3);
      b.bust(look('scar'), 32, 48, 58);
      for (const [x, y, r] of [[74, 120, 0.4], [82, 116, -0.2], [90, 122, 0.25]]) { b.g.save(); b.g.translate(x * b.k, y * b.kh); b.g.rotate(r); b.g.fillStyle = '#1a181c'; b.g.fillRect(-1 * b.k, -10 * b.kh, 2 * b.k, 10 * b.kh); b.g.fillStyle = '#c8242e'; b.g.fillRect(-1.2 * b.k, -1 * b.kh, 2.4 * b.k, 3 * b.kh); b.g.restore(); }
      for (let i = 0; i < 16; i++) { const y = 100 - G.hash(i, 91, 2) * 90; b.rect(i % 2 ? '#ffb060' : '#ff6a20', fx - 14 + G.hash(91, i, 3) * 28, y, 0.9, 0.9); }
    },
    patience(b) {
      b.sky(['#0a040c', '#26081c', '#4a0e26']);
      b.rect('#14060e', 0, 0, 100, 140);
      b.poly('#3a0c1e', [62, 0, 100, 0, 100, 140, 70, 140]);
      b.glow(82, 40, 40, 'rgba(255,90,140,0.4)');
      b.rect('#c8284a', 74, 6, 22, 64); b.rect('#ff6a8a', 76, 8, 18, 60); b.rect('#3a0c1e', 84, 6, 2, 64); b.rect('#3a0c1e', 74, 36, 22, 2);
      for (let i = 0; i < 6; i++) b.line('rgba(240,220,255,0.35)', [0, 6 + i * 4, 30 + i * 10, 0], 0.4);
      for (let i = 0; i < 5; i++) b.line('rgba(240,220,255,0.3)', [12 + i * 8, 0, 4 + i * 14, 40 + i * 6], 0.4);
      b.ring('rgba(240,220,255,0.3)', 14, 14, 10, 10, 0.4); b.ring('rgba(240,220,255,0.3)', 14, 14, 18, 18, 0.4);
      b.ell('#1a0812', 78, 118, 24, 6);
      b.poly('#0a0408', [64, 140, 70, 98, 80, 90, 92, 98, 98, 140]);
      b.ell('#0a0408', 81, 84, 7, 8);
      b.line('#ffe0f0', [70, 96, 66, 92], 0.6);
      b.figure(look('kafka'), 34, 76, 116);
      b.glow(40, 30, 14, 'rgba(255,150,210,0.35)');
      for (const [x, y] of [[22, 40], [58, 22], [52, 54], [12, 92]]) b.line('#d890ff', [x, y, x + 3, y + 4, x + 1, y + 5, x + 4, y + 10], 0.8);
      b.line('rgba(255,210,240,0.55)', [46, 46, 70, 96], 0.5);
      b.twinkle(64, 12, 2.2, '#ffd8f0');
    },
    rain(b) {
      b.sky(['#04061a', '#0e1840', '#1e1c4a']);
      for (let i = 0; i < 10; i++) { const x = i * 11 - 2, h = 30 + G.hash(i, 4, 7) * 50; b.rect('#0a0e26', x, 100 - h, 10, h); for (let j = 0; j < 6; j++) if (G.hash(i, j, 8) > 0.5) b.rect(j % 2 ? 'rgba(122,106,240,0.8)' : 'rgba(80,220,255,0.7)', x + 2 + (j % 3) * 2.4, 104 - h + j * 6, 1.4, 1.4); }
      b.glow(50, 80, 46, 'rgba(110,100,255,0.35)');
      b.rect('#12142e', 0, 100, 100, 40);
      for (let i = 0; i < 7; i++) b.rect('rgba(160,200,255,0.25)', 6 + i * 14, 104 + (i % 3) * 8, 10, 0.8);
      b.rect('rgba(10,16,48,0.85)', 8, 18, 30, 20); b.rect('#7a6af0', 8, 18, 30, 3.4); b.rect('rgba(160,200,255,0.8)', 10, 24, 22, 1); b.rect('rgba(160,200,255,0.6)', 10, 27, 16, 1); b.rect('rgba(160,200,255,0.6)', 10, 30, 19, 1);
      b.rect('rgba(10,16,48,0.85)', 66, 50, 28, 18); b.rect('#50dcff', 66, 50, 28, 3.4); b.rect('rgba(160,200,255,0.7)', 68, 56, 20, 1); b.rect('rgba(160,200,255,0.5)', 68, 59, 14, 1);
      b.figure(look('silverwolf'), 50, 104, 98);
      b.ell('rgba(170,200,255,0.25)', 50, 122, 18, 3);
      for (let i = 0; i < 70; i++) { const x = G.hash(i, 31, 4) * 104 - 2, y = G.hash(31, i, 5) * 136; b.line('rgba(190,210,255,0.55)', [x, y, x - 1.2, y + 7], 0.4); }
      b.twinkle(84, 14, 2.4, '#c8e8ff');
    },
    unreachable(b) {
      b.sky(['#10040a', '#4a0c12', '#a8281e']);
      b.glow(64, 40, 40, 'rgba(255,90,60,0.55)');
      b.ell('#e04a36', 64, 40, 16, 16); b.ell('#f26a48', 61, 37, 12, 12);
      b.poly('#2a0a0e', [0, 96, 18, 88, 36, 94, 58, 86, 80, 92, 100, 88, 100, 140, 0, 140]);
      b.poly('#14060a', [0, 112, 30, 106, 64, 110, 100, 104, 100, 140, 0, 140]);
      const sword = (x, y, h, r, tassel) => {
        b.g.save(); b.g.translate(x * b.k, y * b.kh); b.g.rotate(r);
        b.g.fillStyle = '#5a5662'; b.g.fillRect(-0.9 * b.k, -h * b.kh, 1.8 * b.k, h * b.kh);
        b.g.fillStyle = '#a8a4b0'; b.g.fillRect(-0.9 * b.k, -h * b.kh, 0.6 * b.k, h * b.kh);
        b.g.fillStyle = '#1a1418'; b.g.fillRect(-3.4 * b.k, -h * b.kh - 1.4 * b.kh, 6.8 * b.k, 1.4 * b.kh);
        b.g.fillStyle = '#2a2026'; b.g.fillRect(-0.9 * b.k, -h * b.kh - 6 * b.kh, 1.8 * b.k, 4.6 * b.kh);
        if (tassel) { b.g.fillStyle = '#c8302a'; b.g.fillRect(-0.5 * b.k, -h * b.kh - 4 * b.kh, 1 * b.k, 8 * b.kh); }
        b.g.restore();
      };
      for (let i = 0; i < 9; i++) sword(6 + i * 11 + G.hash(i, 3, 5) * 5, 112 + G.hash(i, 4, 5) * 8, 14 + G.hash(i, 5, 5) * 12, (G.hash(i, 6, 5) - 0.5) * 0.6, i % 3 === 0);
      b.figure(look('blade'), 40, 92, 104, { flip: true });
      sword(74, 128, 30, 0.12, true);
      for (let i = 0; i < 24; i++) b.rect(i % 3 ? '#ff7a5a' : '#ffd8c8', G.hash(i, 81, 2) * 100, G.hash(81, i, 3) * 100, 1, 0.6);
    },
    truth(b) {
      b.sky(['#2a2408', '#6a5a14', '#c8a830']);
      b.glow(50, 70, 60, 'rgba(255,230,120,0.45)');
      b.rect('#1a1606', 0, 104, 100, 36);
      for (let r = 5; r >= 1; r--) b.ell(r % 2 ? '#c8242e' : '#1a1606', 50, 120, r * 9, r * 2.6);
      b.rect('#2a2a2e', 6, 46, 30, 26); b.rect('#3a3a40', 8, 48, 26, 20);
      for (let i = 0; i < 18; i++) b.rect(G.hash(i, 7, 3) > 0.5 ? '#f0e070' : '#8a8050', 9 + G.hash(i, 8, 3) * 24, 49 + G.hash(8, i, 3) * 18, 1.6, 0.6);
      b.ell('rgba(20,16,4,0.8)', 21, 60, 5, 7); b.ell('rgba(20,16,4,0.8)', 21, 52, 3, 3);
      b.ell('#ffd040', 20, 51.6, 0.5, 0.5); b.ell('#ffd040', 22, 51.6, 0.5, 0.5);
      b.rect('#1e1e22', 12, 72, 3, 10); b.rect('#1e1e22', 27, 72, 3, 10);
      b.figure(look('yu'), 62, 104, 104);
      b.line('#d8dce4', [74, 66, 90, 40], 1.2);
      b.rect('#f4ecd0', 78, 12, 16, 24); b.rect('#2a2a6a', 79.4, 13.4, 13.2, 21.2); b.ell('#f0d050', 86, 22, 3.4, 3.4); b.rect('#f4ecd0', 84.6, 30, 2.8, 2);
      for (let i = 0; i < 40; i++) b.rect('rgba(255,240,170,0.35)', G.hash(i, 51, 2) * 100, G.hash(51, i, 3) * 104, 2.4, 0.8);
      b.twinkle(86, 10, 2.2, '#fff4c0');
    },
    thread(b) {
      b.sky(['#0c0a12', '#1e1626', '#2e2030']);
      for (let i = 0; i < 6; i++) { const x = i * 17; b.rect('#24181a', x, 10, 15, 70); for (let j = 0; j < 4; j++) b.rect(['#c8243a', '#3a6ac8', '#e8d070', '#f2ece0', '#6ac87a'][(i + j) % 5], x + 1.4, 14 + j * 16, 12, 12); }
      b.glow(60, 20, 26, 'rgba(255,220,150,0.5)');
      b.poly('#d8c070', [54, 4, 66, 4, 70, 14, 50, 14]);
      b.rect('#3a2418', 0, 92, 100, 48); b.rect('#5a3a26', 0, 92, 100, 3);
      b.bust(look('kanji'), 38, 40, 66);
      b.ell('#f4f0ec', 70, 98, 10, 9); b.ell('#f4f0ec', 64, 86, 3, 8, -0.2); b.ell('#f4f0ec', 75, 86, 3, 8, 0.2);
      b.ell('#ffb0c0', 64, 87, 1.2, 4.4, -0.2); b.ell('#ffb0c0', 75, 87, 1.2, 4.4, 0.2);
      b.ell('#1e1e22', 67, 96, 0.9, 0.9); b.ell('#1e1e22', 73, 96, 0.9, 0.9); b.ell('#ff8aa0', 70, 99, 1, 0.7);
      for (let i = 0; i < 5; i++) b.line('#c8243a', [62 + i * 4, 106, 64 + i * 4, 104], 0.6);
      b.line('rgba(240,240,250,0.9)', [52, 70, 60, 84, 80, 76, 94, 90], 0.4);
      b.line('#d8dce4', [92, 88, 97, 94], 0.8);
      for (let i = 0; i < 8; i++) b.rect('rgba(255,230,180,0.5)', 44 + G.hash(i, 61, 2) * 50, 20 + G.hash(61, i, 3) * 60, 0.8, 0.8);
    },
    junesday(b) {
      b.sky(['#2a1a3a', '#c85a3a', '#f0b060']);
      b.glow(78, 40, 30, 'rgba(255,220,140,0.5)');
      b.rect('#5a4a52', 0, 60, 100, 6);
      for (let i = 0; i < 6; i++) b.rect('#3a2e36', 4 + i * 17, 46 - G.hash(i, 2, 7) * 12, 12, 20 + G.hash(i, 2, 7) * 12);
      b.rect('#f2ece0', 8, 12, 44, 16); b.rect('#c8242e', 8, 12, 44, 3); b.rect('#c8242e', 8, 25, 44, 3);
      for (let i = 0; i < 5; i++) b.rect('#c8242e', 12 + i * 8, 17, 5, 6);
      b.line('#3a3036', [14, 28, 14, 60], 1); b.line('#3a3036', [46, 28, 46, 60], 1);
      b.rect('#8a8a92', 0, 66, 100, 74); b.rect('#a4a4ac', 0, 66, 100, 2);
      for (let i = 0; i < 6; i++) b.line('rgba(60,60,70,0.4)', [i * 20, 66, i * 20 - 14, 140], 0.6);
      b.poly('#c8242e', [60, 66, 92, 66, 84, 58, 68, 58]); b.poly('#f2ece0', [68, 58, 76, 66, 84, 58]);
      b.line('#d8d8dc', [76, 66, 76, 98], 1);
      b.ell('#f2ece0', 76, 98, 14, 3); b.rect('#d8d8dc', 75, 98, 2, 14);
      b.rect('#e85a2a', 70, 92, 4, 6); b.rect('#f0d070', 80, 93, 5, 5);
      b.figure(look('yosuke'), 32, 112, 92);
      for (let i = 0; i < 4; i++) b.line('rgba(255,180,120,0.7)', [16 + i * 3, 42 - i * 4, 20 + i * 3, 40 - i * 4], 0.6);
      for (let i = 0; i < 18; i++) b.rect('rgba(255,240,200,0.5)', G.hash(i, 91, 2) * 100, G.hash(91, i, 3) * 60, 0.8, 0.8);
      b.twinkle(60, 30, 2, '#fff0c0');
    },
    dragontrial(b) {
      b.sky(['#0a1a12', '#1e4a2a', '#5a8a3a']);
      b.glow(50, 60, 46, 'rgba(200,240,120,0.4)');
      b.rect('#2a1a10', 6, 10, 30, 42); b.rect('#e8d070', 8, 12, 26, 38);
      b.line('#c8242e', [12, 44, 16, 30, 24, 36, 20, 22, 30, 18], 2.4);
      b.ell('#c8242e', 30, 17, 2.4, 1.8); b.ell('#1a1a1e', 30.6, 16.4, 0.5, 0.5);
      b.rect('#1a1a1e', 10, 46, 22, 2);
      b.rect('#3a5a2a', 0, 104, 100, 36); b.rect('#5a7a3a', 0, 104, 100, 2);
      for (let i = 0; i < 14; i++) b.line('#6a8a3a', [G.hash(i, 3, 4) * 100, 106 + G.hash(4, i, 3) * 30, G.hash(i, 3, 4) * 100 + 1, 103 + G.hash(4, i, 3) * 30], 0.6);
      b.figure(look('chie'), 58, 108, 96, { rot: -0.12 });
      for (let i = 0; i < 5; i++) b.line('rgba(220,255,160,0.75)', [72 + i * 2, 70 + i * 5, 94, 62 + i * 6], 0.8);
      b.ell('#f2f2ee', 18, 120, 11, 4); b.ell('#8a3a1e', 18, 118, 8, 3); b.line('#c8603a', [12, 118, 24, 118], 0.6);
      for (let i = 0; i < 3; i++) b.line('rgba(255,255,255,0.5)', [14 + i * 4, 112, 13 + i * 4, 106], 0.5);
      for (let i = 0; i < 16; i++) b.rect('rgba(230,255,190,0.5)', G.hash(i, 92, 2) * 100, G.hash(92, i, 3) * 100, 0.9, 0.9);
      b.twinkle(84, 20, 2.2, '#f0ffd0');
    },
    amagiinn(b) {
      b.sky(['#06040e', '#1a0c22', '#3a1424']);
      b.stars(30, 17, 0, 50);
      b.ell('#f2e8d0', 82, 16, 6, 6); b.ell('#1a0c22', 84, 14, 5, 5);
      b.poly('#1a1014', [0, 42, 50, 24, 100, 42, 100, 50, 0, 50]);
      b.rect('#3a2418', 4, 50, 92, 52);
      for (let i = 0; i < 5; i++) { b.rect('#f0c878', 8 + i * 18, 58, 12, 16); b.line('#3a2418', [14 + i * 18, 58, 14 + i * 18, 74], 0.6); b.line('#3a2418', [8 + i * 18, 66, 20 + i * 18, 66], 0.6); }
      b.rect('#2a1810', 40, 80, 20, 22); b.rect('#c8242e', 42, 80, 16, 4);
      for (const x of [26, 74]) { b.line('#1a1014', [x, 76, x, 80], 0.6); b.ell('#e85a2a', x, 84, 3.4, 4.4); b.rect('#1a1014', x - 2, 79.4, 4, 1); b.rect('#1a1014', x - 2, 88, 4, 1); b.glow(x, 84, 10, 'rgba(255,140,60,0.35)'); }
      b.rect('#2a1c1a', 0, 102, 100, 38); b.rect('#4a3028', 0, 102, 100, 1.4);
      b.figure(look('yukiko'), 50, 132, 92);
      b.poly('#c8242e', [62, 96, 74, 90, 74, 102]); b.line('#e8c040', [62, 96, 74, 90], 0.5);
      for (let i = 0; i < 8; i++) b.ell(i % 2 ? '#ff9a3a' : '#ffd060', 68 + G.hash(i, 5, 6) * 26, 70 + G.hash(6, i, 5) * 30, 1, 1.6);
      for (let i = 0; i < 22; i++) b.ell('rgba(255,190,210,0.8)', G.hash(i, 93, 2) * 100, G.hash(93, i, 3) * 130, 1, 0.6, G.hash(i, 94, 1) * 3);
    },
    affection(b) {
      b.sky(['#12061a', '#3a0c3a', '#6a1450']);
      b.poly('rgba(255,210,240,0.22)', [20, 0, 30, 0, 60, 120, 20, 120]);
      b.poly('rgba(255,210,240,0.22)', [70, 0, 80, 0, 80, 120, 40, 120]);
      b.ell('#2a1430', 86, 26, 10, 10); b.ell('#4a2a50', 86, 26, 7, 7); b.line('#4a2a50', [86, 26, 94, 14], 0.8);
      b.rect('#1a0a1e', 0, 108, 100, 32); b.rect('#ff6ab0', 0, 108, 100, 1.2);
      for (let i = 0; i < 10; i++) b.ell(i % 2 ? '#ffd040' : '#ff8ac8', 5 + i * 10, 114, 2, 1.4);
      b.glow(50, 70, 36, 'rgba(255,140,200,0.4)');
      b.figure(look('rise'), 50, 108, 98);
      b.line('#e8e8f0', [60, 58, 62, 66], 0.8); b.ell('#2a2a32', 59.6, 57, 1.4, 1.6);
      const heart = (x, y, s, col) => { b.ell(col, x - s * 0.5, y, s * 0.6, s * 0.6); b.ell(col, x + s * 0.5, y, s * 0.6, s * 0.6); b.poly(col, [x - s * 1.08, y + s * 0.15, x + s * 1.08, y + s * 0.15, x, y + s * 1.4]); };
      for (const [x, y, s] of [[16, 30, 3], [26, 60, 2], [78, 52, 2.6], [70, 14, 2], [12, 84, 2.2]]) heart(x, y, s, 'rgba(255,120,190,0.8)');
      for (let i = 0; i < 20; i++) b.rect('rgba(255,230,250,0.6)', G.hash(i, 71, 2) * 100, G.hash(71, i, 3) * 100, 0.9, 0.9);
      b.twinkle(30, 18, 2.2, '#ffe0f4');
    },
    masquerade(b) {
      b.sky(['#0e0812', '#2a1426', '#4a1a2a']);
      b.glow(50, 26, 30, 'rgba(255,220,150,0.45)');
      b.ell('#d8b050', 50, 16, 14, 4); for (let i = 0; i < 7; i++) { b.line('#d8b050', [40 + i * 3.4, 18, 40 + i * 3.4, 24], 0.6); b.ell('#fff0c0', 40 + i * 3.4, 25, 1, 1.4); }
      b.poly('#1a0c14', [0, 100, 100, 100, 100, 140, 0, 140]);
      for (let x = 0; x < 100; x += 10) for (let y = 100; y < 140; y += 10) if (((x + y) / 10) % 2) b.rect('#2a1420', x, y, 10, 10);
      for (const [x, s] of [[24, 1], [74, -1]]) { b.ell('#140a10', x, 70, 9, 22); b.ell('#140a10', x, 44, 5, 6); b.poly('#140a10', [x - 10, 84, x + 10, 84, x + 16 * s, 100, x - 6 * s, 100]); }
      b.ell('#f4eef0', 50, 62, 18, 9);
      b.ell('#2a0a14', 42, 61, 5, 2.6, 0.2); b.ell('#2a0a14', 58, 61, 5, 2.6, -0.2);
      b.poly('#d8b050', [32, 62, 36, 56, 40, 58]); b.poly('#d8b050', [68, 62, 64, 56, 60, 58]);
      b.line('#c8243a', [66, 56, 76, 34, 72, 28, 78, 22], 1.6); b.line('#ff6a7a', [70, 46, 80, 30], 0.8);
      b.line('#c8243a', [32, 64, 20, 90, 26, 110], 1.2);
      for (let i = 0; i < 10; i++) b.twinkle(G.hash(i, 71, 2) * 100, G.hash(71, i, 3) * 96, 1.6, '#fff0c8');
    },
    chunchunmaru(b) {
      b.sky(['#0e1a2a', '#22405a', '#d88a5a']);
      b.glow(70, 92, 44, 'rgba(255,170,110,0.45)');
      b.ell('#ffd8a0', 70, 96, 9, 9);
      for (const [x, w, h] of [[0, 18, 26], [16, 14, 34], [28, 20, 22], [46, 16, 30], [60, 22, 24], [80, 20, 32]]) {
        b.rect('#1a2232', x, 112 - h, w, h + 30);
        b.poly('#24304a', [x - 2, 112 - h, x + w / 2, 104 - h, x + w + 2, 112 - h]);
        b.rect('#e8b860', x + w * 0.3, 118 - h, 2.4, 3); b.rect('#e8b860', x + w * 0.62, 124 - h, 2.4, 3);
      }
      b.poly('#121826', [0, 126, 100, 120, 100, 140, 0, 140]);
      b.figure(look('kazuma'), 38, 104, 104);
      b.g.save(); b.g.translate(72 * b.k, 128 * b.kh); b.g.rotate(0.22);
      b.g.fillStyle = '#3a2a22'; b.g.fillRect(-1.3 * b.k, -14 * b.kh, 2.6 * b.k, 14 * b.kh);
      for (let i = 0; i < 5; i++) { b.g.fillStyle = '#a88a6a'; b.g.fillRect(-1.3 * b.k, (-12.4 + i * 2.6) * b.kh, 2.6 * b.k, 0.9 * b.kh); }
      b.g.fillStyle = '#d8b050'; b.g.fillRect(-3.8 * b.k, -16.4 * b.kh, 7.6 * b.k, 2.4 * b.kh);
      b.g.fillStyle = '#c8ccd8'; b.g.fillRect(-1.2 * b.k, -66 * b.kh, 2.4 * b.k, 49.6 * b.kh);
      b.g.fillStyle = '#f4f6fc'; b.g.fillRect(-1.2 * b.k, -66 * b.kh, 0.8 * b.k, 49.6 * b.kh);
      b.g.beginPath(); b.g.moveTo(-1.2 * b.k, -66 * b.kh); b.g.lineTo(1.2 * b.k, -66 * b.kh); b.g.lineTo(-1.2 * b.k, -70 * b.kh); b.g.fill();
      b.g.restore();
      b.glow(87, 64, 9, 'rgba(255,255,255,0.55)'); b.twinkle(87, 64, 3.6, '#ffffff');
      for (let i = 0; i < 7; i++) b.twinkle(10 + G.hash(i, 31, 1) * 80, 8 + G.hash(i, 32, 2) * 50, 1.8, '#fff4d0');
    },
    hagoromo(b) {
      b.sky(['#f4f0d8', '#a8d8f4', '#3a78c0']);
      b.g.globalAlpha = 0.25;
      for (let i = 0; i < 6; i++) { const x = 8 + i * 17; b.poly('#fffbe8', [x - 3, 0, x + 3, 0, x + 12, 140, x - 12, 140]); }
      b.g.globalAlpha = 1;
      b.poly('#5aa0d8', [0, 112, 100, 108, 100, 140, 0, 140]);
      b.poly('#8ac8ec', [0, 118, 100, 114, 100, 122, 0, 126]);
      for (let i = 0; i < 5; i++) b.ell('#d8f0ff', 14 + i * 18, 124 + (i % 2) * 6, 6, 1.2);
      const ribbon = (y0, amp, ph, col, a, lw) => { const pts = []; for (let x = -4; x <= 104; x += 3) pts.push(x, y0 + Math.sin(x * 0.07 + ph) * amp - x * 0.12); b.g.globalAlpha = a; b.line(col, pts, lw); b.g.globalAlpha = 1; };
      ribbon(44, 7, 0.4, '#c8a0e0', 0.5, 6);
      b.figure(look('aqua'), 50, 92, 104);
      ribbon(92, 8, 2.2, '#d8b0f0', 0.55, 6);
      ribbon(112, 5, 4.1, '#e8c8f8', 0.4, 4);
      for (const [x, y] of [[14, 70], [86, 64], [24, 30], [78, 24]]) { b.ell('#e8f8ff', x, y, 2.4, 3.4); b.ell('#ffffff', x - 0.6, y - 1, 0.8, 1); }
      for (let i = 0; i < 8; i++) b.twinkle(8 + G.hash(i, 41, 1) * 84, 10 + G.hash(i, 42, 2) * 90, 2, '#ffffff');
    },
    manastaff(b) {
      b.sky(['#0a0612', '#2a0c1c', '#6a1a1e']);
      b.stars(30, 9, 0, 70);
      b.glow(30, 96, 34, 'rgba(255,120,60,0.5)');
      b.poly('#1a0a10', [0, 104, 22, 96, 40, 100, 62, 92, 100, 98, 100, 140, 0, 140]);
      b.rect('#120610', 22, 84, 14, 14); b.rect('#120610', 24, 78, 3, 6); b.rect('#120610', 31, 80, 3, 4);
      for (let i = 0; i < 3; i++) { b.ring(i % 2 ? '#ff6a5a' : '#ffb070', 64, 34 + i * 10, 26 - i * 5, 6 - i, 1.2); }
      b.figure(look('megumin', { acc: G.lookOf('megumin', null).acc.filter(a => !a.startsWith('mstaff')) }), 30, 118, 60);
      b.line('#6a3a1e', [66, 138, 70, 40], 4.4);
      b.line('#b06a32', [65.4, 138, 69.4, 40], 3);
      b.line('#f2e6d8', [67, 100, 67.6, 86], 4);
      for (const y of [56, 62]) b.line('#e8b440', [67, 112 - y + 6, 72, 112 - y + 4], 2);
      b.line('#b06a32', [70, 40, 66, 28, 72, 18, 80, 22, 80, 30], 3.4);
      b.glow(73, 30, 18, 'rgba(255,60,80,0.7)');
      b.ell('#8a1020', 73, 30, 6, 6); b.ell('#e0304a', 73, 30, 5, 5); b.ell('#ffd0d8', 71, 28, 1.6, 1.6);
      for (let i = 0; i < 4; i++) { const x = 52 + i * 12, y = 70 + (i % 2) * 14; b.poly('#e04a6a', [x, y - 4, x + 2.4, y, x, y + 4, x - 2.4, y]); b.ell('#ffd8e0', x - 0.6, y - 1, 0.6, 0.9); }
      for (let i = 0; i < 20; i++) b.rect(i % 2 ? '#ff8a5a' : '#ffd0a0', G.hash(i, 51, 1) * 100, 60 + G.hash(51, i, 2) * 60, 0.9, 0.9);
    },
    adamantite(b) {
      b.sky(['#5aa0e0', '#a8d4f4', '#e8f4f8']);
      b.cloud('#ffffff', 22, 22, 9); b.cloud('#f4f8fc', 80, 34, 7);
      b.poly('#6aa84a', [0, 100, 100, 94, 100, 140, 0, 140]);
      b.poly('#5a9a3a', [0, 116, 100, 110, 100, 140, 0, 140]);
      b.rect('#c8b890', 0, 84, 100, 12); for (let x = 2; x < 100; x += 8) b.rect('#a89870', x, 84, 4, 4);
      b.figure(look('darkness'), 48, 100, 104);
      b.line('#c8ccd8', [74, 136, 76, 92], 2.6); b.line('#f4f6fc', [73.6, 136, 75.6, 92], 0.8); b.rect('#d8b050', 70.6, 90, 9.6, 2.4); b.rect('#3a2a30', 74.4, 80, 2.4, 10);
      const cab = (x, y, r) => { b.ell('#3a7a2a', x, y, r, r * 0.9); b.ell('#6ab84a', x - r * 0.15, y - r * 0.15, r * 0.8, r * 0.7); b.ell('#a8e07a', x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.3); b.line('#3a7a2a', [x - r * 0.6, y, x + r * 0.5, y - r * 0.2], 0.8); };
      for (const [x, y, r] of [[88, 52, 5], [12, 60, 4], [84, 76, 4.4], [20, 40, 3.4], [94, 30, 3]]) cab(x, y, r);
      for (const [x, y] of [[62, 54], [36, 50]]) { b.glow(x, y, 8, 'rgba(255,255,255,0.8)'); b.twinkle(x, y, 3.4, '#ffffff'); }
      for (const [x, y] of [[30, 34], [66, 30]]) { b.ell('#ff7ab8', x - 1, y, 1.4, 1.4); b.ell('#ff7ab8', x + 1, y, 1.4, 1.4); b.poly('#ff7ab8', [x - 2.4, y + 0.4, x + 2.4, y + 0.4, x, y + 3]); }
    },
    sword_rumor(b) {
      b.sky(['#0e1426', '#1a2438', '#3a4a68']);
      b.stars(20, 13, 0, 60);
      b.ell('#f4f0dc', 78, 22, 9, 9); b.ell('#1a2438', 82, 19, 8, 8);
      b.poly('#2a3450', [0, 80, 14, 56, 24, 70, 36, 50, 50, 64, 66, 46, 80, 62, 100, 52, 100, 96, 0, 96]);
      b.poly('#eef2f8', [0, 104, 100, 96, 100, 140, 0, 140]);
      b.poly('#d0d8e4', [0, 118, 100, 112, 100, 140, 0, 140]);
      b.poly('#c8ccd8', [48, 30, 54, 30, 54, 108, 51, 116, 48, 108]);
      b.poly('#f4f6ff', [48, 30, 51, 30, 51, 108, 48, 108]);
      b.rect('#c89a40', 42, 24, 18, 4); b.rect('#6a3a20', 49, 12, 4, 13); b.ell('#e8c060', 51, 11, 3, 3);
      for (let i = 0; i < 8; i++) {
        const x = 12 + G.hash(i, 3, 9) * 76, y = 36 + G.hash(9, i, 3) * 60, r = (G.hash(i, i, 2) - 0.5) * 1.4;
        b.g.save(); b.g.translate(x * b.k, y * b.kh); b.g.rotate(r); b.g.fillStyle = '#f2ecdc'; b.g.fillRect(-4 * b.k, -5 * b.kh, 8 * b.k, 10 * b.kh);
        b.g.fillStyle = '#8a8478'; for (let j = 0; j < 3; j++) b.g.fillRect(-3 * b.k, (-3 + j * 2.4) * b.kh, 6 * b.k, 0.6 * b.kh); b.g.restore();
      }
    }
  };

  const pix = new Map();
  function pixOf(id) {
    const src = H.CONE_PIX && H.CONE_PIX[id];
    if (!src || typeof Image === 'undefined') return null;
    let im = pix.get(id);
    if (!im) {
      im = new Image();
      im.onload = () => { for (const k of [...cache.keys()]) if (k.startsWith(id + '|')) cache.delete(k); };
      im.src = src;
      pix.set(id, im);
    }
    return im.complete && im.naturalWidth ? im : null;
  }

  function pixArt(im, w, h) {
    const c = G.mkCanvas(w, h), g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (w >= im.naturalWidth) { g.drawImage(im, 0, 0, w, h); return c; }
    g.putImageData(crispShrink(im, w, h), 0, 0);
    return c;
  }

  function crispShrink(im, w, h) {
    const SW = im.naturalWidth, SH = im.naturalHeight, sc = G.mkCanvas(SW, SH), sg = sc.getContext('2d');
    sg.drawImage(im, 0, 0);
    const s = sg.getImageData(0, 0, SW, SH).data, fx = SW / w, fy = SH / h;
    const span = (o, f, n) => { const a = o * f, b = a + f; return [a, b, Math.floor(a), Math.min(n, Math.ceil(b))]; };
    const avg = new Float32Array(w * h * 3);
    for (let y = 0; y < h; y++) {
      const [ya, yb, y0, y1] = span(y, fy, SH);
      for (let x = 0; x < w; x++) {
        const [xa, xb, x0, x1] = span(x, fx, SW);
        let r = 0, gg = 0, bb = 0, t = 0;
        for (let sy = y0; sy < y1; sy++) {
          const wy = Math.min(yb, sy + 1) - Math.max(ya, sy);
          for (let sx = x0; sx < x1; sx++) {
            const k = wy * (Math.min(xb, sx + 1) - Math.max(xa, sx)), i = (sy * SW + sx) * 4;
            r += s[i] * k; gg += s[i + 1] * k; bb += s[i + 2] * k; t += k;
          }
        }
        const o = (y * w + x) * 3;
        avg[o] = r / t; avg[o + 1] = gg / t; avg[o + 2] = bb / t;
      }
    }
    const out = new ImageData(w, h), d = out.data;
    for (let y = 0; y < h; y++) {
      const [, , y0, y1] = span(y, fy, SH);
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 3, tgt = [0, 0, 0];
        let n = 0;
        for (let ny = Math.max(0, y - 1); ny <= Math.min(h - 1, y + 1); ny++) for (let nx = Math.max(0, x - 1); nx <= Math.min(w - 1, x + 1); nx++) {
          const q = (ny * w + nx) * 3;
          tgt[0] += avg[q]; tgt[1] += avg[q + 1]; tgt[2] += avg[q + 2]; n++;
        }
        for (let ch = 0; ch < 3; ch++) tgt[ch] = avg[o + ch] + 0.6 * (avg[o + ch] - tgt[ch] / n);
        const [, , x0, x1] = span(x, fx, SW);
        let best = 0, bestD = Infinity;
        for (let sy = y0; sy < y1; sy++) for (let sx = x0; sx < x1; sx++) {
          const i = (sy * SW + sx) * 4, dr = s[i] - tgt[0], dg = s[i + 1] - tgt[1], db = s[i + 2] - tgt[2], dd = dr * dr + dg * dg + db * db;
          if (dd < bestD) { bestD = dd; best = i; }
        }
        const p = (y * w + x) * 4;
        d[p] = s[best]; d[p + 1] = s[best + 1]; d[p + 2] = s[best + 2]; d[p + 3] = 255;
      }
    }
    return out;
  }

  function coneArt(id, w, h) {
    const key = id + '|' + w + 'x' + h;
    let c = cache.get(key);
    if (c) return c;
    const im = pixOf(id);
    if (im) { c = pixArt(im, w, h); cache.set(key, c); return c; }
    const px = Math.max(1, Math.round(w / GRID_W)), gw = Math.ceil(w / px), gh = Math.ceil(h / px);
    const back = G.mkCanvas(gw * SS, gh * SS), fore = G.mkCanvas(gw * SS, gh * SS);
    const b = brush(back.getContext('2d'), gw * SS, gh * SS, fore.getContext('2d'));
    const scene = SCENES[id];
    if (scene) scene(b); else b.sky(['#20243a', '#20243a']);
    const pix = G.mkCanvas(gw, gh), pg = pix.getContext('2d');
    pg.drawImage(G.downsample(back, gw, gh, false), 0, 0);
    if (b.used) pg.drawImage(G.downsample(fore, gw, gh, true), 0, 0);
    c = G.mkCanvas(w, h);
    const cg = c.getContext('2d');
    cg.imageSmoothingEnabled = false;
    cg.drawImage(pix, 0, 0, gw * px, gh * px);
    cache.set(key, c);
    return c;
  }

  function drawConeCard(ctx, id, x, y, w, h, opts = {}) {
    const d = H.CONES[id], rar = d ? d.rarity : 3, col = G.RARITY[rar];
    x = Math.round(x); y = Math.round(y);
    ctx.save();
    if (opts.tilt) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(opts.tilt); ctx.translate(-x - w / 2, -y - h / 2); }
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x + 3, y + 3, w, h);
    ctx.fillStyle = G.dark(col, 0.45); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = '#0a0c18'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    const aw = w - 6, ah = h - 6, hasLvl = opts.lvl != null;
    const art = coneArt(id, aw, ah);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(art, x + 3, y + 3, aw, ah);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 3, y + 3, aw, 1); ctx.fillRect(x + 3, y + 3, 1, ah);
    if (opts.info !== false && w >= 40) {
      if (hasLvl) {
        ctx.fillStyle = 'rgba(6,8,20,0.82)'; ctx.fillRect(x + 3, y + h - 14, aw, 11);
        ctx.font = 'bold 8px Tahoma, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#f1ead8'; ctx.fillText((H.isEn && H.isEn() ? 'Lv. ' : 'ур. ') + opts.lvl, x + w / 2, y + h - 13);
        const span = (rar - 1) * 6, sx0 = x + w / 2 - span / 2, py = y + h - 17.5;
        for (let i = 0; i < rar; i++) {
          const px = sx0 + i * 6;
          ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.beginPath(); ctx.moveTo(px, py - 2.5); ctx.lineTo(px + 2.5, py + 1); ctx.lineTo(px, py + 4); ctx.lineTo(px - 2.5, py + 1); ctx.fill();
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px, py - 3); ctx.lineTo(px + 2.5, py); ctx.lineTo(px, py + 3); ctx.lineTo(px - 2.5, py); ctx.fill();
        }
      } else {
        ctx.fillStyle = 'rgba(6,8,20,0.72)'; ctx.fillRect(x + 3, y + h - 3 - 11, aw, 11);
        for (let i = 0; i < rar; i++) { const px = x + 6 + i * 6, py = y + h - 8.5; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px, py - 3); ctx.lineTo(px + 2.5, py); ctx.lineTo(px, py + 3); ctx.lineTo(px - 2.5, py); ctx.fill(); }
      }
      if (d) G.pathIcon(ctx, d.path, x + w - 15, y + 4, 11, '#f2dc9a');
      if (opts.supBadge && G.supBadge) G.supBadge(ctx, x + 4, y + 12, opts.sup || 1, 5.5);
      else if (opts.sup) { ctx.font = 'bold 10px Tahoma, Arial, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillStyle = '#000'; ctx.fillText('S' + opts.sup, x + w - 5, y + h - 14); ctx.fillStyle = '#ffe8a0'; ctx.fillText('S' + opts.sup, x + w - 6, y + h - 15); }
      if (opts.lock && G.lockIcon) G.lockIcon(ctx, x + w - 15, y + h - (hasLvl ? 30 : 26), true, { badge: true, r: 5.5 });
    }
    if (opts.selected) {
      ctx.strokeStyle = '#f4f0e4';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.lineWidth = 1;
      if (G.minusBadge) G.minusBadge(ctx, x - 3, y - 3, 5.5);
    }
    ctx.restore();
  }

  Object.assign(G, { coneArt, drawConeCard, CONE_SCENES: SCENES });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
