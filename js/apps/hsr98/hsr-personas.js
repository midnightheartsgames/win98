(function (H) {
  'use strict';

  const poly = (g, col, pts) => { g.fillStyle = col; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  const ell = (g, col, x, y, rx, ry, r) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, Math.PI * 2); g.fill(); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const mirror = pts => pts.map((v, i) => (i % 2 ? v : -v));

  const ART = {
    izanagi: {
      name: 'Изанаги', owner: 'yu', col: '#ffd040',
      draw(g, o) {
        const swing = o.swing || 0;
        g.save(); g.strokeStyle = '#f0f0f4'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(1, -100); g.bezierCurveTo(30, -118, 52, -70, 44, -14); g.stroke(); g.restore();
        for (const s of [-1, 1]) {
          poly(g, '#0e0e14', [s * 6, -62, s * 27, -6, s * 19, -3, s * 5, -40]);
          poly(g, '#a8141e', [s * 6, -52, s * 22, -8, s * 16, -6, s * 6, -36]);
          poly(g, '#16161e', [s * 4, -46, s * 9, -46, s * (17 + (s > 0 ? 1 : 0)), -6, s * 13, -6]);
          poly(g, '#c8ccd4', [s * 13, -12, s * 17, -12, s * 20, 2, s * 15, -2]);
          poly(g, '#8a8e9a', [s * 13, -12, s * 15, -12, s * 15, -2]);
        }
        poly(g, '#14141c', [-8, -82, 8, -82, 7, -46, -7, -46]);
        for (const x of [-4.5, -1.5, 1.5, 4.5]) poly(g, '#3a3a46', [x - 0.5, -80, x + 0.5, -80, x + 0.5, -48, x - 0.5, -48]);
        poly(g, '#c8ccd4', [-3, -50, 3, -50, 2, -41, 0, -39, -2, -41]);
        for (let i = 0; i < 8; i++) poly(g, '#d8dce4', [6.6 + i * 0.5, -46 + i * 4.4, 10 + i * 0.5, -46 + i * 4.4, 10 + i * 0.5, -44.4 + i * 4.4, 6.6 + i * 0.5, -44.4 + i * 4.4]);
        for (const s of [-1, 1]) poly(g, '#1a1a22', [s * 4.6, -83, s * 7.4, -92, s * 8.4, -81]);
        poly(g, '#14141c', [-8, -80, -13, -66, -12, -50, -9, -50, -9, -66]);
        poly(g, '#c8ccd4', [-13, -54, -9, -54, -9, -46, -12, -45]);
        g.save(); g.translate(10, -54); g.rotate(1.25 + swing);
        poly(g, '#14141c', [-5, -20, 0, -20, 2, 0, -2, 0]);
        poly(g, '#c8ccd4', [-2, -2, 3, -2, 3, 3, -2, 3]);
        poly(g, '#2a2a32', [-1.4, 0, 1.4, 0, 1.4, 8, -1.4, 8]);
        poly(g, '#5a5a64', [-5, 8, 5, 8, 5, 10, -5, 10]);
        poly(g, '#2a2a34', [-2.2, 10, 2.2, 10, 1.6, 74, -1.6, 70]);
        poly(g, '#e0e4ec', [1, 10, 2.6, 10, 2, 74, 0.8, 72]);
        for (let i = 0; i < 6; i++) poly(g, '#e0e4ec', [-2.2, 18 + i * 9, -4.2, 21 + i * 9, -2.2, 23 + i * 9]);
        g.restore();
        ell(g, '#c8ccd4', 0, -89, 5.2, 7.6);
        ell(g, '#eef0f4', -1.6, -92, 2, 3);
        poly(g, '#14141a', [-5.2, -90, 5.2, -90, 4.4, -84.6, -4.4, -84.6]);
        ell(g, o.eye || '#ffd040', -2.4, -88, 1.4, 0.8);
        ell(g, o.eye || '#ffd040', 2.4, -88, 1.4, 0.8);
        poly(g, '#a8141e', [-4, -82, 4, -82, 3, -80, -3, -80]);
        for (const s of [-1, 1]) poly(g, '#c8ccd4', [s * 1.6, -95, s * 3.4, -96, s * 4.6, -104, s * 2.4, -97]);
      }
    },
    jiraiya: {
      name: 'Джирайя', owner: 'yosuke', col: '#5fe0a8',
      draw(g, o) {
        const T = o.t || 0, flap = Math.sin(T * 9) * 4;
        const star = (x, y, r, rot, col) => { g.save(); g.translate(x, y); g.rotate(rot); poly(g, col, [0, -r, r * 0.26, -r * 0.26, r, 0, r * 0.26, r * 0.26, 0, r, -r * 0.26, r * 0.26, -r, 0, -r * 0.26, -r * 0.26]); ell(g, '#8a8e9a', 0, 0, r * 0.22, r * 0.22); g.restore(); };
        const camo = (pts) => { poly(g, '#6a7a4a', pts); };
        poly(g, '#c8242e', [2, -80, 8, -82, 30 + flap, -74, 38 + flap, -60, 28 + flap * 0.5, -66, 10, -74]);
        poly(g, '#e8303a', [2, -80, 8, -82, 26 + flap, -72, 10, -76]);
        for (const s of [-1, 1]) {
          poly(g, '#eceae4', [s * 2, -46, s * 8, -46, s * 9, -18, s * 4, -18]);
          poly(g, '#eceae4', [s * 4, -18, s * 9, -18, s * 16, 0, s * 4, 0]);
          camo([s * 5, -10, s * 12, -10, s * 16, 0, s * 4, 0]);
          poly(g, '#3a4a2a', [s * 7, -8, s * 10, -8, s * 11, -4, s * 8, -4]);
          poly(g, '#4a5a32', [s * 12, -6, s * 14, -6, s * 15, -2, s * 13, -2]);
          poly(g, '#141414', [s * 12, -1, s * 17, -1, s * 18, 1, s * 12, 1]);
        }
        poly(g, '#eceae4', [-6, -72, 6, -72, 5, -46, -5, -46]);
        for (let i = 0; i < 4; i++) poly(g, '#c8c6c0', [-5, -58 + i * 3, 5, -58 + i * 3, 5, -57.2 + i * 3, -5, -57.2 + i * 3]);
        for (const s of [-1, 1]) {
          poly(g, '#eceae4', [s * 6, -72, s * 10, -73, s * 22, -54, s * 19, -51]);
          camo([s * 18, -56, s * 23, -55, s * 27, -46, s * 22, -44]);
          poly(g, '#3a4a2a', [s * 21, -52, s * 23, -51, s * 24, -48, s * 22, -48]);
          star(s * 26, -44, 8, T * 10 * s, '#f0c020');
        }
        poly(g, '#e8b820', [-24, -86, 24, -86, 0, -54]);
        poly(g, '#c89810', [0, -54, 24, -86, 16, -86]);
        poly(g, '#c8242e', [-13, -86, 13, -86, 0, -68]);
        for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const k = (i + 0.5) / 4, x = s * lerp(13, 0, k), y = lerp(-86, -68, k); poly(g, '#ffffff', [x, y, x - s * 2.6, y - 1.6, x - s * 1.4, y + 2.4]); }
        ell(g, '#c8242e', 0, -84, 5, 2.4);
        ell(g, '#16161a', 0, -91, 7.4, 7);
        for (const s of [-1, 1]) {
          ell(g, '#16161a', s * 6.4, -101, 3.6, 3.4);
          poly(g, '#e8303a', [s * 6.4 - 2.4, -101.6, s * 6.4 + 2.4, -101.6, s * 6.4 + 2.4, -100.4, s * 6.4 - 2.4, -100.4]);
          star(s * 3.4, -91, 3.2, T * 3 * s, o.eye || '#ffd040');
        }
      }
    },
    tomoe: {
      name: 'Томоэ', owner: 'chie', col: '#8adfff',
      draw(g, o) {
        const sw = o.swing || 0, T = o.t || 0, wav = Math.sin(T * 3) * 3;
        poly(g, '#14201c', [-4, -94, 6, -96, 30 + wav, -60, 34 + wav, -40, 22 + wav, -50, 12, -70, 2, -80]);
        poly(g, '#22302a', [2, -92, 8, -94, 24 + wav, -66, 16, -70]);
        for (const s of [-1, 1]) {
          poly(g, '#f0c020', [s * 2, -46, s * 8, -46, s * 7, -22, s * 3, -22]);
          poly(g, '#e8e8e4', [s * 2.6, -22, s * 7.4, -22, s * 7, -2, s * 3, -2]);
          for (let i = 0; i < 5; i++) poly(g, '#8a8a90', [s * 3.4, -19 + i * 3.6, s * 6.6, -19 + i * 3.6, s * 6.6, -18.4 + i * 3.6, s * 3.4, -18.4 + i * 3.6]);
          poly(g, '#e8e8e4', [s * 2, -2, s * 9, -2, s * 9, 1, s * 2, 1]);
        }
        for (const s of [-1, 1]) poly(g, '#16161a', [s * 4, -50, s * 14, -48, s * 17, -24, s * 9, -26]);
        for (const [x, y] of [[-12, -48], [-5, -50], [3, -50], [10, -48]]) { poly(g, '#c8ccd4', [x - 3.6, y, x + 3.6, y, x + 4, y + 13, x - 4, y + 13]); for (let i = 0; i < 3; i++) poly(g, '#5a5e68', [x - 2.4, y + 3 + i * 3.4, x + 2.4, y + 3 + i * 3.4, x + 2.4, y + 4 + i * 3.4, x - 2.4, y + 4 + i * 3.4]); }
        poly(g, '#3a3a40', [-9, -51, 9, -51, 9, -48, -9, -48]);
        poly(g, '#f0c020', [-7, -78, 7, -78, 5, -62, 6, -52, -6, -52, -5, -62]);
        poly(g, '#141414', [-0.5, -78, 0.5, -78, 0.5, -52, -0.5, -52]);
        poly(g, '#c89a10', [3, -76, 7, -78, 5, -62, 4, -60]);
        poly(g, '#f0c020', [-7, -77, -10, -76, -14, -62, -18, -54, -15, -52, -11, -60]);
        ell(g, '#eeeee8', -16, -51, 2.6, 2.6);
        poly(g, '#f0c020', [7, -77, 10, -76, 14, -66, 12, -60, 9, -64]);
        g.save(); g.translate(12, -60); g.rotate(-0.55 + sw);
        poly(g, '#d8a820', [-46, -0.9, 46, -0.9, 46, 0.9, -46, 0.9]);
        for (const s of [-1, 1]) { g.save(); g.scale(s, 1); poly(g, '#ff9a30', [44, -1, 64, -9, 70, -16, 60, -4, 46, 2]); poly(g, '#ffe080', [46, -0.4, 60, -6, 64, -11, 56, -2]); g.restore(); }
        g.restore();
        ell(g, '#eeeee8', 12, -60, 2.4, 2.4);
        poly(g, '#f2f2ec', [-6, -84, 6, -84, 4, -96, 0, -116, -3, -100]);
        poly(g, '#c8c8c0', [0, -116, 4, -96, 6, -84, 2, -84]);
        ell(g, '#141820', 0, -88, 4.6, 3.6);
        ell(g, o.eye || '#3a5ad8', -1.6, -88.6, 1.4, 1);
        ell(g, o.eye || '#3a5ad8', 1.6, -88.6, 1.4, 1);
        poly(g, '#c8242e', [-1.6, -84.6, 1.6, -84.6, 0, -83.6]);
        ell(g, '#141414', 2.2, -101, 1.4, 2);
      }
    },
    sakuya: {
      name: 'Конохана Сакуя', owner: 'yukiko', col: '#ff8ab0',
      draw(g, o) {
        const T = o.t || 0, fl = Math.sin(T * 2.4) * 0.06;
        const flower = (x, y, r) => { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; ell(g, '#e8384a', x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.34, a); } ell(g, '#f0c040', x, y, r * 0.24, r * 0.24); };
        for (const s of [-1, 1]) for (let i = 0; i < 9; i++) {
          const a = -Math.PI / 2 + s * (0.25 + i * 0.2 + fl), len = 46 + Math.sin(i * 1.3) * 8 + (i > 5 ? -8 : 0);
          g.save(); g.translate(s * 5, -68); g.rotate(a + Math.PI / 2);
          poly(g, i % 2 ? '#e8606a' : '#f08a90', [-3, 0, 3, 0, 4, -len * 0.7, 0, -len, -4, -len * 0.7]);
          poly(g, '#ffe4e4', [-2.6, -len * 0.62, 2.6, -len * 0.62, 0, -len + 1]);
          poly(g, '#c8a040', [-0.4, -2, 0.4, -2, 0.4, -len * 0.6, -0.4, -len * 0.6]);
          g.restore();
        }
        for (const s of [-1, 1]) flower(s * 16, -66, 7);
        for (const s of [-1, 1]) {
          poly(g, '#2a1a22', [s * 2, -44, s * 7, -44, s * 6, -26, s * 3, -26]);
          poly(g, '#c8243a', [s * 2.6, -28, s * 6.4, -28, s * 5.6, -2, s * 3.4, -2]);
          poly(g, '#a01a2c', [s * 3.4, -2, s * 5.6, -2, s * 4.6, 2]);
        }
        for (let i = 0; i < 6; i++) poly(g, i % 2 ? '#e8e8e4' : '#f8f8f4', [-10 + i * 3.4, -48, -6.6 + i * 3.4, -48, -6 + i * 3.6, -38, -10.6 + i * 3.6, -38]);
        poly(g, '#d8384a', [-6, -76, 6, -76, 5, -60, 6, -48, -6, -48, -5, -60]);
        poly(g, '#f2dcd2', [-3, -76, 3, -76, 0, -68]);
        poly(g, '#f8e8e0', [-1.6, -66, 1.6, -66, 0, -62]);
        poly(g, '#c8a040', [-6, -50, 6, -50, 6, -48, -6, -48]);
        for (const s of [-1, 1]) {
          poly(g, '#f0e0d8', [s * 6, -75, s * 9, -75, s * 15, -56, s * 12, -54]);
          poly(g, '#d8384a', [s * 6, -76, s * 10, -76, s * 10, -72, s * 6, -71]);
          ell(g, '#f0e0d8', s * 13.6, -54, 1.8, 2);
        }
        ell(g, '#d8384a', 0, -86, 5.6, 6.8);
        poly(g, '#d8384a', [-2.4, -82, 2.4, -82, 0, -74]);
        poly(g, '#a01a2c', [0, -82, 2.4, -82, 0, -74]);
        poly(g, '#2a1218', [-4.6, -88, 4.6, -88, 4, -84.6, -4, -84.6]);
        ell(g, o.eye || '#ffd040', -2, -86.4, 1, 0.7); ell(g, o.eye || '#ffd040', 2, -86.4, 1, 0.7);
        poly(g, '#d8384a', [-2, -92, 2, -92, 0, -98]);
        flower(4.6, -91, 3.4);
      }
    },
    mikazuchi: {
      name: 'Такэ-Микадзути', owner: 'kanji', col: '#ffd040',
      draw(g, o) {
        const sw = o.swing || 0, BODY = '#3a3446', SH = '#5e566e', BONE = '#ecebe4';
        const bone = (x0, y0, x1, y1, w) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w; poly(g, BONE, [x0 + nx, y0 + ny, x1 + nx, y1 + ny, x1 - nx, y1 - ny, x0 - nx, y0 - ny]); ell(g, BONE, x0, y0, w * 1.6, w * 1.6); ell(g, BONE, x1, y1, w * 1.6, w * 1.6); };
        for (const s of [-1, 1]) {
          poly(g, BODY, [s * 5, -44, s * 15, -44, s * 15, -4, s * 6, -4]);
          poly(g, SH, [s * 5, -44, s * 8, -44, s * 8, -4, s * 6, -4]);
          ell(g, BODY, s * 10, -26, 6.4, 4);
          bone(s * 10, -40, s * 10, -28, 1); bone(s * 10, -22, s * 10, -8, 1);
          poly(g, '#1a1820', [s * 4, -4, s * 16, -4, s * 17, 0, s * 3, 0]);
        }
        poly(g, BODY, [-12, -52, 12, -52, 13, -44, -13, -44]);
        poly(g, '#8a8690', [-12, -50, 12, -50, 12, -47, -12, -47]);
        ell(g, BODY, 0, -68, 17, 16);
        ell(g, SH, -6, -72, 8, 8);
        bone(0, -82, 0, -54, 1.2);
        for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { g.strokeStyle = BONE; g.lineWidth = 1.8; g.beginPath(); g.moveTo(0, -78 + i * 5.4); g.quadraticCurveTo(s * 10, -82 + i * 5.4, s * 12, -74 + i * 5.4); g.stroke(); }
        for (const s of [-1, 1]) {
          ell(g, BODY, s * 22, -76, 9, 8);
          ell(g, SH, s * 20, -79, 4, 3);
          bone(s * 22, -76, s * 22, -76, 1.6);
        }
        poly(g, BODY, [-26, -70, -18, -70, -19, -46, -27, -46]);
        poly(g, '#c8242e', [-25, -50, -20, -50, -20, -48, -25, -48]);
        poly(g, '#3a5ad8', [-25, -47, -20, -47, -20, -45, -25, -45]);
        ell(g, BODY, -23, -42, 5, 4);
        ell(g, BONE, -23, -34, 4.4, 5.2);
        bone(-22.6, -66, -22.6, -52, 0.9);
        g.save(); g.translate(22, -68); g.rotate(-0.25 + sw);
        poly(g, BODY, [-4, 0, 4, 0, 4, 18, -4, 18]);
        poly(g, '#c8242e', [-3.6, 14, 3.6, 14, 3.6, 16, -3.6, 16]);
        bone(0, 2, 0, 12, 0.9);
        ell(g, BONE, 0, 24, 5, 5.6);
        g.translate(0, 24);
        poly(g, '#e8b820', [-4, 6, 6, -14, 0, -14, 10, -42, -4, -16, 2, -16, -8, 6]);
        poly(g, '#fff0a0', [-2, 0, 4, -13, 1, -13, 7, -34, -1, -15]);
        g.restore();
        poly(g, BODY, [-4, -86, 4, -86, 4, -82, -4, -82]);
        ell(g, BONE, 0, -91, 5.2, 5.6);
        poly(g, BONE, [-3, -87, 3, -87, 2.6, -84, -2.6, -84]);
        ell(g, '#16141a', -2, -92, 1.6, 1.8); ell(g, '#16141a', 2, -92, 1.6, 1.8);
        ell(g, o.eye || '#ffd040', -2, -92, 0.7, 0.7); ell(g, o.eye || '#ffd040', 2, -92, 0.7, 0.7);
        poly(g, '#16141a', [-0.6, -89.6, 0.6, -89.6, 0, -88.4]);
        for (let i = 0; i < 4; i++) poly(g, '#16141a', [-2.2 + i * 1.3, -86.6, -1.6 + i * 1.3, -86.6, -1.6 + i * 1.3, -84.6, -2.2 + i * 1.3, -84.6]);
      }
    },
    himiko: {
      name: 'Химико', owner: 'rise', col: '#ffd850',
      draw(g, o) {
        const sp = Math.sin((o.t || 0) * 1.5) * 0.08;
        g.save(); g.strokeStyle = '#d8b050'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(26, -2); g.lineTo(-24, -112); g.stroke(); g.restore();
        poly(g, '#e8e0c8', [-6, -70, 6, -70, 9, -44, 14, -10, 30, -2, 34, 2, -14, 2, -12, -14, -9, -44]);
        poly(g, '#c8bea4', [4, -60, 6, -60, 11, -8, 8, -8]);
        poly(g, '#c8bea4', [-4, -40, -2, -40, -6, 0, -8, 0]);
        poly(g, '#f6f0dc', [-5, -68, -1, -68, -4, -30, -7, -30]);
        poly(g, '#141418', [-6, -70, -8, -68, -14, -50, -10, -40, -6, -44, -9, -52]);
        poly(g, '#d8b050', [-14, -42, -6, -42, -7, -38, -13, -38]);
        poly(g, '#f0d070', [-12, -44, -8, -44, -9, -42, -11, -42]);
        poly(g, '#141418', [6, -70, 9, -68, 12, -78, 14, -82, 11, -84, 8, -76]);
        ell(g, '#141418', 12.6, -82.6, 1.8, 1.8);
        for (const x of [-3, 0, 3]) poly(g, '#f6f6f2', [x - 0.6, -82, x + 0.6, -82, x + 0.8, -54, x - 0.8, -54]);
        poly(g, '#141418', [-2, -74, 2, -74, 2, -70, -2, -70]);
        ell(g, '#141418', 0, -80, 4, 5);
        poly(g, '#d8b050', [-5, -84, 5, -84, 4.6, -80, -4.6, -80]);
        poly(g, '#c8242e', [-1, -84, 1, -84, 1, -81, -1, -81]);
        g.save(); g.strokeStyle = '#d8b050'; g.lineWidth = 0.9;
        for (const [x0, x1] of [[-4, -16], [0, -8], [4, 2]]) { g.beginPath(); g.moveTo(x0, -84); g.lineTo(x1, -100); g.stroke(); }
        g.restore();
        g.save(); g.translate(-8, -104); g.rotate(-0.35 + sp);
        ell(g, '#c8c4b8', 0, 1.4, 22, 6);
        ell(g, '#f6f4ee', 0, 0, 21, 5.4);
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; g.strokeStyle = '#c8242e'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 20, -Math.sin(a) * 5); g.stroke(); }
        ell(g, o.eye || '#ffd850', 0, -0.6, 2, 1.2);
        g.restore();
      }
    }
  };

  const ring = (g, col, w, x, y, r) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); };
  const halo = (g, t, col, y, r, n) => { ring(g, col, 2, 0, y, r); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + t * 0.4; poly(g, col, [Math.cos(a) * r, y + Math.sin(a) * r, Math.cos(a + 0.08) * (r + 9), y + Math.sin(a + 0.08) * (r + 9), Math.cos(a + 0.16) * r, y + Math.sin(a + 0.16) * r]); } };

  const AWAKE = {
    okami: { name: 'Изанаги-но-Оками', base: 'izanagi', owner: 'yu', col: '#ffffff', paint: ['#f0f0f8', 0.62], eye: '#ff3a3a',
      back(g, o) { halo(g, o.t || 0, '#ffd850', -88, 22, 12); ring(g, 'rgba(255,240,180,0.6)', 1, 0, -88, 30); } },
    susanoo: { name: 'Сусаноо', base: 'jiraiya', owner: 'yosuke', col: '#ff6a3a', paint: ['#3a1a1a', 0.55], eye: '#ff7a3a',
      back(g, o) { const t = o.t || 0; g.save(); g.translate(0, -60); g.rotate(t * 3); ring(g, '#c8242e', 5, 0, 0, 40); for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); poly(g, '#e8e8f0', [38, -3, 52, 0, 38, 3]); } g.restore(); for (let i = 0; i < 7; i++) poly(g, i % 2 ? '#ff8a3a' : '#ffd040', [-12 + i * 4, -94, -10 + i * 4, -112 - (i % 3) * 6, -8 + i * 4, -94]); } },
    suzuka: { name: 'Судзука Гонгэн', base: 'tomoe', owner: 'chie', col: '#ff4a3a', paint: ['#d8302a', 0.5], eye: '#ffd040',
      back(g, o) { const t = o.t || 0; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.4 + Math.sin(t * 2) * 0.05; poly(g, '#d8b050', [0, -60, Math.cos(a) * 54, -60 + Math.sin(a) * 54, Math.cos(a + 0.12) * 50, -60 + Math.sin(a + 0.12) * 50]); } } },
    amaterasu: { name: 'Аматэрасу', base: 'sakuya', owner: 'yukiko', col: '#ffd040', paint: ['#ffd878', 0.5], eye: '#c8241e',
      back(g, o) { const t = o.t || 0; g.fillStyle = 'rgba(255,200,80,0.5)'; g.beginPath(); g.arc(0, -78, 30, 0, Math.PI * 2); g.fill(); halo(g, t, '#ff8a20', -78, 34, 16); } },
    rokuten: { name: 'Рокутэн Мао', base: 'mikazuchi', owner: 'kanji', col: '#ff3a2a', paint: ['#8a1018', 0.55], eye: '#ffe040',
      back(g, o) { const t = o.t || 0; for (let i = 0; i < 9; i++) { const a = -Math.PI + i * Math.PI / 8, r = 46 + Math.sin(t * 6 + i) * 4; poly(g, i % 2 ? '#ff6a1a' : '#ffd040', [Math.cos(a) * 20, -66 + Math.sin(a) * 20, Math.cos(a + 0.1) * r, -66 + Math.sin(a + 0.1) * r, Math.cos(a + 0.2) * 20, -66 + Math.sin(a + 0.2) * 20]); } } },
    kanzeon: { name: 'Кандзэон', base: 'himiko', owner: 'rise', col: '#ffe080', paint: ['#ffe8a0', 0.45], eye: '#ff5a9a',
      back(g, o) { const t = o.t || 0; halo(g, t, '#ffd850', -96, 26, 10); for (let i = 0; i < 8; i++) { const a = Math.PI * (0.15 + i * 0.1); ell(g, 'rgba(255,200,220,0.8)', Math.cos(a) * 26, -2 - Math.sin(a) * 8, 8, 4, a); ell(g, 'rgba(255,200,220,0.8)', -Math.cos(a) * 26, -2 - Math.sin(a) * 8, 8, 4, -a); } } }
  };

  function layer(base, o, fill, a, mode) {
    const cv = layer.buf || (layer.buf = H.Gfx.mkCanvas(240, 240)), c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, 240, 240);
    c.translate(120, 230); c.scale(2, 2); base.draw(c, o);
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = mode; c.globalAlpha = a; c.fillStyle = fill; c.fillRect(0, 0, 240, 240);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    return cv;
  }

  function draw(g, id, x, y, h, o = {}) {
    const P = ART[id] || AWAKE[id];
    if (!P || h <= 0) return;
    g.save();
    if (o.a != null) g.globalAlpha = Math.max(0, Math.min(1, o.a));
    g.translate(x, y);
    const s = h / 100;
    g.scale(o.flip ? -s : s, s);
    const oo = P.base ? Object.assign({ eye: P.eye }, o) : o;
    if (P.back && !o.tint) P.back(g, oo);
    const base = P.base ? ART[P.base] : P;
    if (o.tint) g.drawImage(layer(base, oo, o.tint, 1, 'source-in'), -60, -115, 120, 120);
    else if (P.paint) g.drawImage(layer(base, oo, P.paint[0], P.paint[1], 'source-atop'), -60, -115, 120, 120);
    else P.draw(g, o);
    g.restore();
  }

  H.Personas = { ART, AWAKE, draw, has: id => !!(ART[id] || AWAKE[id]), awakeOf: owner => Object.keys(AWAKE).find(k => AWAKE[k].owner === owner), baseOf: owner => Object.keys(ART).find(k => ART[k].owner === owner) };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
