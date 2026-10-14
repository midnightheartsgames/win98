(function (H) {
  'use strict';
  const G = H.Gfx;
  const cache = new Map();
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  function brush(g, w, h) {
    const k = w / 100, kh = h / 140;
    const X = x => x * k, Y = y => y * kh;
    const b = {
      g, k, kh,
      sky(stops) { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); },
      poly(col, pts) { g.fillStyle = col; g.beginPath(); g.moveTo(X(pts[0]), Y(pts[1])); for (let i = 2; i < pts.length; i += 2) g.lineTo(X(pts[i]), Y(pts[i + 1])); g.closePath(); g.fill(); },
      ell(col, x, y, rx, ry, rot) { g.fillStyle = col; g.beginPath(); g.ellipse(X(x), Y(y), Math.max(0.3, rx * k), Math.max(0.3, ry * kh), rot || 0, 0, Math.PI * 2); g.fill(); },
      rect(col, x, y, rw, rh) { g.fillStyle = col; g.fillRect(X(x), Y(y), rw * k, rh * kh); },
      line(col, pts, lw) { g.strokeStyle = col; g.lineWidth = Math.max(0.6, lw * k); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(X(pts[0]), Y(pts[1])); for (let i = 2; i < pts.length; i += 2) g.lineTo(X(pts[i]), Y(pts[i + 1])); g.stroke(); },
      ring(col, x, y, rx, ry, lw, rot) { g.strokeStyle = col; g.lineWidth = Math.max(0.6, lw * k); g.beginPath(); g.ellipse(X(x), Y(y), rx * k, ry * kh, rot || 0, 0, Math.PI * 2); g.stroke(); },
      glow(x, y, r, col) { const gr = g.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r * k); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X(x - r), Y(y) - r * k, r * 2 * k, r * 2 * k); },
      stars(n, seed, y0, y1, col) { for (let i = 0; i < n; i++) { g.fillStyle = col || 'rgba(255,255,255,' + (0.4 + 0.6 * G.hash(i, seed, 1)) + ')'; g.fillRect(Math.floor(G.hash(i, seed, 2) * w), Math.floor(Y(y0 + G.hash(seed, i, 3) * (y1 - y0))), 1, 1); } },
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
      figure(look, x, y, hUnits, o) { const s = Math.max(1, hUnits * kh / G.FIG_H); b.sprite(G.figureCanvas(look), x, y, Math.round(G.FIG_W * s), Math.round(G.FIG_H * s), o); },
      cloud(col, x, y, r) { b.ell(col, x, y, r * 1.6, r * 0.7); b.ell(col, x - r * 0.8, y + r * 0.1, r * 0.9, r * 0.6); b.ell(col, x + r * 0.9, y - r * 0.2, r, r * 0.7); }
    };
    return b;
  }

  const look = (base, extra) => Object.assign({}, typeof base === 'string' ? G.lookOf(base, null) : base, extra || {});
  const GIRL = { skin: '#f8e0d4', eye: '#6a8ad0', bangs: 'messy', sides: 'long', back: 'long', crown: 'smooth', body: 'f', coat: 'jacket', collar: 'v', low: 'skirt', acc: [] };

  const SCENES = {
    arrows(b) {
      b.sky(['#081c18', '#12382c', '#1e4a3a']);
      b.stars(26, 3, 0, 70);
      b.glow(56, 70, 50, 'rgba(160,230,190,0.45)');
      b.ell('#0e2c20', 6, 118, 34, 44); b.ell('#1a4a34', 14, 104, 22, 26); b.ell('#2e6a48', 18, 94, 10, 10);
      b.ell('#0e2c20', 96, 36, 26, 36); b.ell('#1a4a34', 90, 30, 16, 18); b.ell('#2e6a48', 86, 24, 8, 8);
      b.cloud('#e8e0c4', 70, 128, 16); b.cloud('#d4ccb0', 24, 134, 12);
      const W = '#f4f0e6', S = '#c8c0b0';
      b.line(W, [62, 82, 72, 96, 78, 104], 3.2); b.line(S, [58, 84, 62, 100, 60, 110], 3); b.line(W, [40, 84, 30, 94, 22, 96], 3.2); b.line(S, [44, 86, 40, 100, 34, 108], 3);
      b.ell(W, 52, 78, 20, 10, -0.35);
      b.ell(S, 48, 84, 14, 5, -0.35);
      b.poly(W, [58, 72, 68, 50, 76, 53, 68, 78]);
      b.ell(W, 74, 48, 7, 4.5, -0.5);
      b.ell('#2a3a34', 76, 47, 1, 1);
      b.line(W, [71, 45, 66, 30, 60, 22], 2.2); b.line(W, [66, 30, 58, 32], 1.8); b.line(W, [64, 26, 68, 18], 1.6);
      b.line(W, [76, 45, 82, 30, 90, 24], 2.2); b.line(W, [82, 30, 90, 34], 1.8); b.line(W, [86, 27, 84, 16], 1.6);
      b.line(W, [32, 74, 26, 70], 2);
      for (let i = 0; i < 6; i++) b.twinkle(20 + G.hash(i, 5, 1) * 70, 20 + G.hash(i, 6, 2) * 60, 2.4, '#fff4c0');
    },
    cornucopia(b) {
      b.sky(['#f6eed8', '#e8ecd4', '#cfe0c0']);
      b.ell('#fffaf0', 62, 30, 36, 24); b.ring('#e8dcc0', 62, 30, 30, 18, 1.4, 0.2); b.ring('#e8dcc0', 62, 30, 22, 12, 1.2, 0.2);
      b.poly('#9ab0c0', [0, 72, 20, 52, 40, 64, 64, 44, 100, 66, 100, 90, 0, 90]);
      b.poly('#6aa060', [0, 84, 30, 70, 60, 80, 100, 68, 100, 110, 0, 110]);
      b.poly('#4a8a4a', [0, 104, 40, 88, 70, 98, 100, 90, 100, 140, 0, 140]);
      b.poly('#2e6a3a', [0, 124, 50, 110, 100, 122, 100, 140, 0, 140]);
      for (const [x0, y0, x1, y1] of [[10, 138, 30, 40], [22, 140, 46, 52], [34, 140, 60, 70]]) {
        b.line('#b88a30', [x0, y0, x1, y1], 1.6);
        for (let i = 0; i < 7; i++) {
          const t = 0.55 + i * 0.065, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
          b.ell('#e8b850', x - 2.6, y, 2.4, 3.6, -0.5); b.ell('#f6d27a', x + 2.6, y - 0.5, 2.4, 3.6, 0.5);
        }
        b.line('#f0d890', [x1, y1, x1 + 2, y1 - 12], 0.7); b.line('#f0d890', [x1, y1, x1 - 5, y1 - 10], 0.7);
      }
    },
    collapsing(b) {
      b.sky(['#ffd870', '#f89a38', '#d8481a', '#8a2a14']);
      b.glow(50, 44, 50, 'rgba(255,240,180,0.7)');
      b.poly('#3a2626', [36, 140, 40, 56, 44, 46, 44, 36, 48, 36, 48, 30, 52, 30, 52, 36, 56, 36, 56, 46, 60, 56, 66, 140]);
      b.poly('#3a2626', [48, 30, 50, 12, 52, 30]);
      b.poly('#1e1414', [52, 36, 56, 36, 56, 46, 60, 56, 66, 140, 54, 140]);
      b.line('#ffb040', [45, 70, 50, 78, 46, 90], 0.8); b.line('#ffb040', [56, 60, 52, 72], 0.8);
      for (let i = 0; i < 9; i++) {
        const x = 26 + i * 6.5, y = 64 + (i % 3) * 14;
        b.poly(i % 2 ? '#ff6a1a' : '#ff8a28', [x - 5, y + 18, x, y - 14 - (i % 4) * 5, x + 5, y + 18]);
        b.poly('#ffd040', [x - 2.4, y + 16, x, y - 2 - (i % 3) * 4, x + 2.4, y + 16]);
      }
      b.cloud('#f4e2c0', 20, 126, 16); b.cloud('#f0d6b0', 80, 124, 18); b.cloud('#fff0d8', 50, 136, 20);
      for (let i = 0; i < 14; i++) b.rect('#ffe080', 10 + G.hash(i, 9, 1) * 80, 10 + G.hash(i, 9, 2) * 70, 1.2, 1.2);
    },
    amber(b) {
      b.sky(['#0a1424', '#12283c', '#1a3448']);
      b.stars(20, 4, 0, 110);
      for (let i = 0; i < 4; i++) b.ring('rgba(70,200,180,0.55)', 50, 68, 34 + i * 8, 40 + i * 9, 1, 0.4 + i * 0.3);
      b.glow(50, 68, 40, 'rgba(255,170,70,0.55)');
      b.ell('#5a3a1e', 50, 70, 25, 31);
      b.ell('#c86a1e', 50, 70, 21, 27);
      b.ell('#f0a040', 48, 66, 14, 18);
      b.ell('#ffe6a8', 46, 62, 6, 9);
      b.ell('#ffffff', 44, 56, 2.2, 3.6);
      b.line('#e8fcff', [18, 30, 26, 44, 20, 48, 30, 64], 1.4); b.line('#6ae0d0', [84, 36, 76, 52, 84, 56, 74, 74], 1.4);
      b.line('#e8fcff', [80, 100, 88, 110, 82, 116], 1.2);
      b.cloud('#e8dcc0', 30, 130, 14); b.cloud('#d4c8ac', 72, 132, 16);
    },
    void(b) {
      b.sky(['#04061a', '#0a1236', '#101e4a']);
      b.stars(40, 7, 0, 140);
      for (let i = 0; i < 6; i++) b.ring(['#1c3a8a', '#2a5ab8', '#4a7ad8', '#8ab0f0', '#c8d8ff', '#ffffff'][i], 44, 46, 30 - i * 3.4, 22 - i * 2.4, 2.4 - i * 0.2, -0.4 + i * 0.12);
      b.ell('#000000', 44, 46, 10, 9);
      b.ring('#f0d080', 44, 46, 12, 10.5, 0.8);
      b.ell('#3a5aa8', 78, 98, 10, 10); b.ell('#6a8ad8', 75, 95, 6, 6);
      b.ell('#8a6ab0', 22, 110, 6, 6); b.ell('#b89ad8', 20, 108, 3, 3);
      b.ell('#c8d8ff', 84, 22, 3, 3);
      b.line('#f0c060', [10, 70, 30, 84, 44, 86], 0.9); b.line('#f0c060', [60, 118, 80, 112, 96, 118], 0.9);
      b.poly('#0e1a44', [0, 124, 30, 116, 60, 124, 100, 114, 100, 140, 0, 140]);
    },
    chorus(b) {
      b.sky(['#120e48', '#2a2280', '#4a3aa0']);
      b.glow(50, 44, 40, 'rgba(255,220,120,0.65)');
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; b.line('#f8d060', [50 + Math.cos(a) * 4, 44 + Math.sin(a) * 4, 50 + Math.cos(a) * (14 + (i % 2) * 8), 44 + Math.sin(a) * (14 + (i % 2) * 8)], 1.1); }
      b.twinkle(50, 44, 8, '#fff4c0');
      const n = 9;
      for (let i = 0; i < n; i++) {
        const a = Math.PI * 0.08 + i * Math.PI * 1.84 / (n - 1), x = 50 - Math.cos(a) * 36, y = 60 + Math.sin(a) * 30;
        b.ell('#f4f0fa', x, y - 7, 2.6, 2.6);
        b.poly('#f4f0fa', [x - 3.4, y + 8, x, y - 4.4, x + 3.4, y + 8]);
        if (i < n - 1) { const a2 = a + Math.PI * 1.84 / (n - 1), x2 = 50 - Math.cos(a2) * 36, y2 = 60 + Math.sin(a2) * 30; b.line('#e0dcf4', [x, y - 1, x2, y2 - 1], 1); }
      }
      b.poly('#2a2a8a', [0, 110, 30, 100, 60, 112, 100, 102, 100, 140, 0, 140]);
      b.poly('#6a5ac8', [0, 124, 40, 116, 70, 126, 100, 118, 100, 140, 0, 140]);
    },
    databank(b) {
      b.sky(['#2a1c12', '#4a3020', '#6a4a2a']);
      for (let s = 0; s < 4; s++) {
        const y = 40 + s * 22;
        b.rect('#3a2414', 4, y, 92, 3);
        for (let i = 0; i < 12; i++) { const x = 6 + i * 7.4, hh = 12 + (i * 7 + s * 3) % 7; b.rect(['#8a2a2a', '#2a4a7a', '#6a5a2a', '#3a6a4a', '#7a4a8a'][(i + s) % 5], x, y - hh, 5.6, hh); b.rect('rgba(255,230,160,0.25)', x, y - hh, 1.2, hh); }
      }
      b.line('#c8a060', [66, 140, 80, 34], 1.6); b.line('#c8a060', [78, 140, 92, 34], 1.6);
      for (let i = 0; i < 9; i++) { const y = 130 - i * 11; b.line('#c8a060', [66 + (130 - y) * 0.132 + 0.6, y, 78 + (130 - y) * 0.132 + 0.6, y], 1.2); }
      b.glow(40, 22, 26, 'rgba(255,220,140,0.6)');
      b.ring('#f0d080', 40, 22, 11, 11, 1.8);
      b.twinkle(40, 22, 10, '#f8e0a0');
      b.cloud('#f0e2c0', 20, 132, 14); b.cloud('#e8d8b0', 64, 136, 16);
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
      b.sky(['#120e16', '#241a20', '#3a2a24']);
      b.glow(26, 36, 40, 'rgba(255,210,130,0.6)');
      b.poly('#4a4a50', [18, 20, 34, 20, 30, 30, 22, 30]); b.rect('#3a3a40', 25, 30, 2, 40);
      b.poly('rgba(255,220,150,0.28)', [18, 30, 34, 30, 64, 100, 0, 100]);
      b.bust(look('serval', { closed: false }), 72, 44, 44, { alpha: 0.7 });
      b.rect('#5a3a2a', 0, 96, 100, 44);
      b.rect('#6a4a34', 0, 96, 100, 4);
      b.poly('#f0e8d8', [30, 92, 72, 88, 76, 100, 34, 104]);
      b.poly('#e0d8c4', [48, 86, 80, 84, 84, 96, 52, 98]);
      b.bust(look('pela', { closed: true }), 48, 80, 44, { rot: 0.35 });
      b.twinkle(86, 20, 3, '#f8e8c0');
    },
    postop(b) {
      b.sky(['#d4e4f0', '#b0c8dc', '#8aa8c8']);
      b.rect('#e8f4ff', 60, 8, 34, 44); b.rect('#a8c0d8', 76, 8, 2, 44); b.rect('#a8c0d8', 60, 29, 34, 2);
      b.rect('#f4f4f8', 42, 88, 58, 22); b.rect('#6a9ad8', 42, 96, 58, 14); b.rect('#c8d4e4', 42, 110, 58, 30);
      b.bust(look(GIRL, { skin: '#f0d8c8', hair: '#5a4a3a', bangs: 'messy', sides: 'short', back: 'short', top: '#dfe8f4', inner: '#f4f4f8', collar: 'v', acc: ['bandage'], closed: true }), 80, 80, 34);
      b.bust(look('natasha', {}), 30, 76, 60);
      b.ell('#8ad06a', 58, 110, 2.6, 5); b.rect('#e8f0f4', 56.5, 100, 3, 6);
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

  function ps1(c) {
    const g = c.getContext('2d'), img = g.getImageData(0, 0, c.width, c.height), d = img.data, w = c.width;
    for (let i = 0; i < d.length; i += 4) {
      const p = i / 4, t = (BAYER[((Math.floor(p / w) & 3) << 2) | (p % w & 3)] / 16 - 0.5) * 8;
      d[i] = Math.max(0, Math.min(255, Math.round((d[i] + t) / 8) * 8));
      d[i + 1] = Math.max(0, Math.min(255, Math.round((d[i + 1] + t) / 8) * 8));
      d[i + 2] = Math.max(0, Math.min(255, Math.round((d[i + 2] + t) / 8) * 8));
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }

  function coneArt(id, w, h) {
    const key = id + '|' + w + 'x' + h;
    let c = cache.get(key);
    if (c) return c;
    c = G.mkCanvas(w, h);
    const g = c.getContext('2d');
    const scene = SCENES[id];
    if (scene) scene(brush(g, w, h));
    else { g.fillStyle = '#20243a'; g.fillRect(0, 0, w, h); }
    ps1(c);
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
    const aw = w - 6, ah = h - 6, sc = opts.scale || 1;
    const art = coneArt(id, Math.round(aw / sc), Math.round(ah / sc));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(art, x + 3, y + 3, aw, ah);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 3, y + 3, aw, 1); ctx.fillRect(x + 3, y + 3, 1, ah);
    if (opts.info !== false && w >= 40) {
      ctx.fillStyle = 'rgba(6,8,20,0.72)'; ctx.fillRect(x + 3, y + h - 3 - 11, aw, 11);
      for (let i = 0; i < rar; i++) { const px = x + 6 + i * 6, py = y + h - 8.5; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px, py - 3); ctx.lineTo(px + 2.5, py); ctx.lineTo(px, py + 3); ctx.lineTo(px - 2.5, py); ctx.fill(); }
      if (d) G.pathIcon(ctx, d.path, x + w - 16, y + 5, 11, '#f2dc9a');
      if (opts.sup) { ctx.font = 'bold 10px Tahoma, Arial, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillStyle = '#000'; ctx.fillText('S' + opts.sup, x + w - 5, y + h - 14); ctx.fillStyle = '#ffe8a0'; ctx.fillText('S' + opts.sup, x + w - 6, y + h - 15); }
    }
    ctx.restore();
  }

  Object.assign(G, { coneArt, drawConeCard, CONE_SCENES: SCENES });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
