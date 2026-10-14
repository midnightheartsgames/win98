(function (F) {
  'use strict';

  const C = F.col;
  const MAT = F.MAT;
  const TAU = Math.PI * 2;
  const S = 2048, PAD = 4;
  const SIZE = { bb: [432, 216], cl: [144, 216], col: [112, 168], ban: [1016, 80], flag: [88, 264], hoard: [504, 64], wall: [224, 336], roof: [504, 96] };

  function lg(x, x0, y0, x1, y1, stops) {
    const g = x.createLinearGradient(x0, y0, x1, y1);
    for (const [o, c] of stops) g.addColorStop(o, c);
    return g;
  }

  function rg(x, cx, cy, r0, r1, stops) {
    const g = x.createRadialGradient(cx, cy, r0, cx, cy, r1);
    for (const [o, c] of stops) g.addColorStop(o, c);
    return g;
  }

  function txt(x, s, cx, cy, o = {}) {
    const size = o.size || 20;
    x.save();
    x.font = `${o.style || 'italic'} ${o.weight || 900} ${size}px ${o.font || "'Arial Black', Arial"}`;
    x.textAlign = o.align || 'center';
    x.textBaseline = 'middle';
    const w = x.measureText(s).width, max = o.maxW || 1e9;
    if (w > max) { x.translate(cx, cy); x.scale(max / w, 1); x.translate(-cx, -cy); }
    if (o.shadow) { x.shadowColor = o.shadow; x.shadowBlur = o.blur || 0; x.shadowOffsetX = o.dx === undefined ? 2 : o.dx; x.shadowOffsetY = o.dy === undefined ? 2 : o.dy; }
    if (o.stroke) { x.lineWidth = o.sw || 4; x.strokeStyle = o.stroke; x.lineJoin = 'round'; x.strokeText(s, cx, cy); }
    x.fillStyle = o.col || '#fff';
    x.fillText(s, cx, cy);
    x.restore();
  }

  function rrect(x, x0, y0, w, h, r) {
    x.beginPath();
    x.moveTo(x0 + r, y0); x.lineTo(x0 + w - r, y0); x.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    x.lineTo(x0 + w, y0 + h - r); x.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    x.lineTo(x0 + r, y0 + h); x.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    x.lineTo(x0, y0 + r); x.quadraticCurveTo(x0, y0, x0 + r, y0); x.closePath();
  }

  function grain(x, w, h, amt, seed) {
    const img = x.getImageData(0, 0, w, h), d = img.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = (j * w + i) * 4, n = (F.hash2(i, j, seed) - 0.5) * amt;
      d[k] = F.clamp(d[k] + n, 0, 255); d[k + 1] = F.clamp(d[k + 1] + n, 0, 255); d[k + 2] = F.clamp(d[k + 2] + n, 0, 255);
    }
    x.putImageData(img, 0, 0);
  }

  function speedLines(x, w, h, col, n, seed) {
    x.save();
    x.strokeStyle = col;
    for (let i = 0; i < n; i++) {
      const y = F.hash2(i, 1, seed) * h, l = w * (0.2 + F.hash2(i, 2, seed) * 0.5), x0 = F.hash2(i, 3, seed) * w;
      x.lineWidth = 1 + F.hash2(i, 4, seed) * 3;
      x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + l, y - l * 0.18); x.stroke();
    }
    x.restore();
  }

  function bottle(x, cx, by, h, glass, liquid, label, text) {
    const w = h * 0.3;
    x.save();
    x.translate(cx, by);
    const path = () => {
      x.beginPath();
      x.moveTo(-w * 0.14, -h); x.lineTo(w * 0.14, -h);
      x.lineTo(w * 0.16, -h * 0.82); x.bezierCurveTo(w * 0.2, -h * 0.66, w * 0.5, -h * 0.6, w * 0.5, -h * 0.42);
      x.bezierCurveTo(w * 0.5, -h * 0.3, w * 0.38, -h * 0.26, w * 0.4, -h * 0.18);
      x.bezierCurveTo(w * 0.44, -h * 0.1, w * 0.5, -h * 0.06, w * 0.46, 0);
      x.lineTo(-w * 0.46, 0);
      x.bezierCurveTo(-w * 0.5, -h * 0.06, -w * 0.44, -h * 0.1, -w * 0.4, -h * 0.18);
      x.bezierCurveTo(-w * 0.38, -h * 0.26, -w * 0.5, -h * 0.3, -w * 0.5, -h * 0.42);
      x.bezierCurveTo(-w * 0.5, -h * 0.6, -w * 0.2, -h * 0.66, -w * 0.16, -h * 0.82);
      x.closePath();
    };
    path();
    x.fillStyle = lg(x, -w * 0.5, 0, w * 0.5, 0, [[0, glass[0]], [0.35, glass[1]], [0.6, liquid], [1, glass[0]]]);
    x.fill();
    x.save(); path(); x.clip();
    x.fillStyle = label; x.fillRect(-w, -h * 0.38, w * 2, h * 0.16);
    txt(x, text, 0, -h * 0.3, { size: h * 0.075, col: '#fff', maxW: w * 0.9 });
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillRect(-w * 0.3, -h * 0.8, w * 0.08, h * 0.76);
    x.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 26; i++) { x.beginPath(); x.arc((F.hash2(i, 1, 3) - 0.5) * w * 0.9, -F.hash2(i, 2, 3) * h * 0.9, 0.8 + F.hash2(i, 3, 3) * 1.8, 0, TAU); x.fill(); }
    x.restore();
    x.fillStyle = '#c8c8c8'; x.fillRect(-w * 0.17, -h * 1.04, w * 0.34, h * 0.05);
    x.restore();
  }

  function cup(x, cx, cy, s, coffee) {
    x.save();
    x.translate(cx, cy);
    x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = s * 0.05; x.lineCap = 'round';
    for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(k * s * 0.28, -s * 0.62); x.bezierCurveTo(k * s * 0.28 - s * 0.18, -s * 0.9, k * s * 0.28 + s * 0.18, -s * 1.05, k * s * 0.28, -s * 1.35); x.stroke(); }
    x.fillStyle = '#f4f1ea'; x.beginPath(); x.ellipse(0, s * 0.42, s * 1.05, s * 0.22, 0, 0, TAU); x.fill();
    x.fillStyle = '#d8d2c4'; x.beginPath(); x.ellipse(0, s * 0.4, s * 0.8, s * 0.13, 0, 0, TAU); x.fill();
    x.fillStyle = lg(x, -s * 0.7, 0, s * 0.7, 0, [[0, '#d8d4cc'], [0.4, '#ffffff'], [1, '#bdb6a8']]);
    x.beginPath(); x.moveTo(-s * 0.7, -s * 0.5); x.lineTo(s * 0.7, -s * 0.5); x.bezierCurveTo(s * 0.68, s * 0.2, s * 0.42, s * 0.4, 0, s * 0.4); x.bezierCurveTo(-s * 0.42, s * 0.4, -s * 0.68, s * 0.2, -s * 0.7, -s * 0.5); x.fill();
    x.strokeStyle = '#e8e4dc'; x.lineWidth = s * 0.13; x.beginPath(); x.arc(s * 0.78, -s * 0.12, s * 0.22, -1.3, 1.5); x.stroke();
    x.fillStyle = coffee; x.beginPath(); x.ellipse(0, -s * 0.5, s * 0.7, s * 0.13, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,230,190,0.35)'; x.beginPath(); x.ellipse(-s * 0.15, -s * 0.52, s * 0.3, s * 0.05, 0, 0, TAU); x.fill();
    x.restore();
  }

  function phone(x, cx, cy, s, body, screen, textCol) {
    x.save();
    x.translate(cx, cy);
    x.fillStyle = '#1a1c1e'; x.fillRect(s * 0.18, -s * 1.28, s * 0.12, s * 0.3);
    rrect(x, -s * 0.36, -s, s * 0.72, s * 2, s * 0.16);
    x.fillStyle = lg(x, -s * 0.36, 0, s * 0.36, 0, [[0, body[0]], [0.5, body[1]], [1, body[0]]]); x.fill();
    rrect(x, -s * 0.25, -s * 0.78, s * 0.5, s * 0.46, s * 0.04); x.fillStyle = screen; x.fill();
    txt(x, 'DZINTARS', 0, -s * 0.62, { size: s * 0.09, col: textCol, maxW: s * 0.44, font: 'Arial', weight: 700, style: 'normal' });
    x.fillStyle = textCol; for (let i = 0; i < 4; i++) x.fillRect(-s * 0.2 + i * s * 0.05, -s * 0.44 - i * s * 0.02, s * 0.03, s * 0.02 + i * s * 0.02);
    x.fillStyle = 'rgba(255,255,255,0.8)';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { rrect(x, -s * 0.24 + c * s * 0.18, -s * 0.12 + r * s * 0.2, s * 0.13, s * 0.12, s * 0.03); x.fill(); }
    x.restore();
  }

  function tyre(x, cx, cy, r) {
    x.save();
    x.translate(cx, cy);
    x.fillStyle = '#141414'; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
    x.fillStyle = '#262626';
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; x.save(); x.rotate(a); x.fillRect(r * 0.84, -r * 0.05, r * 0.16, r * 0.1); x.restore(); }
    x.fillStyle = rg(x, 0, 0, r * 0.2, r * 0.6, [[0, '#e8e8e8'], [0.7, '#9a9ea4'], [1, '#5a5e64']]); x.beginPath(); x.arc(0, 0, r * 0.6, 0, TAU); x.fill();
    x.fillStyle = '#2a2c30';
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; x.beginPath(); x.ellipse(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, r * 0.12, r * 0.07, a, 0, TAU); x.fill(); }
    x.fillStyle = '#d0d4d8'; x.beginPath(); x.arc(0, 0, r * 0.12, 0, TAU); x.fill();
    x.restore();
  }

  function plane(x, cx, cy, s, col) {
    x.save();
    x.translate(cx, cy);
    x.rotate(-0.18);
    x.fillStyle = col;
    x.beginPath(); x.ellipse(0, 0, s, s * 0.11, 0, 0, TAU); x.fill();
    x.beginPath(); x.moveTo(-s * 0.1, 0); x.lineTo(s * 0.25, -s * 0.62); x.lineTo(s * 0.38, -s * 0.62); x.lineTo(s * 0.2, 0); x.fill();
    x.beginPath(); x.moveTo(-s * 0.1, 0); x.lineTo(s * 0.12, s * 0.5); x.lineTo(s * 0.24, s * 0.5); x.lineTo(s * 0.2, 0); x.fill();
    x.beginPath(); x.moveTo(-s * 0.82, 0); x.lineTo(-s * 0.98, -s * 0.34); x.lineTo(-s * 0.86, -s * 0.34); x.lineTo(-s * 0.66, -s * 0.02); x.fill();
    x.fillStyle = 'rgba(40,60,90,0.6)'; for (let i = 0; i < 9; i++) x.fillRect(-s * 0.55 + i * s * 0.1, -s * 0.03, s * 0.04, s * 0.03);
    x.restore();
  }

  function car(x, cx, cy, s, col) {
    x.save();
    x.translate(cx, cy);
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(-s, s * 0.18); x.lineTo(-s * 0.98, -s * 0.06); x.lineTo(-s * 0.6, -s * 0.14); x.lineTo(-s * 0.32, -s * 0.36); x.lineTo(s * 0.24, -s * 0.38);
    x.lineTo(s * 0.56, -s * 0.16); x.lineTo(s * 0.96, -s * 0.08); x.lineTo(s, s * 0.18); x.closePath(); x.fill();
    x.fillStyle = 'rgba(200,225,255,0.75)';
    x.beginPath(); x.moveTo(-s * 0.28, -s * 0.31); x.lineTo(s * 0.2, -s * 0.33); x.lineTo(s * 0.44, -s * 0.16); x.lineTo(-s * 0.5, -s * 0.14); x.closePath(); x.fill();
    for (const wx of [-0.62, 0.62]) { x.fillStyle = '#121212'; x.beginPath(); x.arc(wx * s, s * 0.18, s * 0.19, 0, TAU); x.fill(); x.fillStyle = '#b8bcc0'; x.beginPath(); x.arc(wx * s, s * 0.18, s * 0.09, 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(-s * 0.9, -s * 0.04, s * 1.8, s * 0.03);
    x.restore();
  }

  function waves(x, cx, cy, n, r0, step, col) {
    x.save();
    x.strokeStyle = col; x.lineCap = 'round';
    for (let i = 0; i < n; i++) { x.lineWidth = 3 + i * 0.6; x.globalAlpha = 1 - i / (n + 1); x.beginPath(); x.arc(cx, cy, r0 + i * step, -0.7, 0.7); x.stroke(); x.beginPath(); x.arc(cx, cy, r0 + i * step, Math.PI - 0.7, Math.PI + 0.7); x.stroke(); }
    x.restore();
  }

  function bolt(x, cx, cy, s, col) {
    x.save();
    x.translate(cx, cy);
    x.fillStyle = col;
    x.beginPath(); x.moveTo(s * 0.15, -s); x.lineTo(-s * 0.45, s * 0.1); x.lineTo(-s * 0.02, s * 0.1); x.lineTo(-s * 0.2, s); x.lineTo(s * 0.48, -s * 0.18); x.lineTo(s * 0.06, -s * 0.18); x.closePath(); x.fill();
    x.restore();
  }

  function skyline(x, x0, y0, w, h, col) {
    x.save();
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(x0, y0);
    const pts = [[0, 0.18], [0.06, 0.18], [0.06, 0.32], [0.12, 0.32], [0.14, 0.52], [0.155, 0.95], [0.17, 0.52], [0.19, 0.32], [0.26, 0.3], [0.26, 0.4], [0.3, 0.44], [0.33, 0.66], [0.345, 0.66], [0.36, 0.44], [0.4, 0.4], [0.4, 0.26], [0.47, 0.26], [0.47, 0.36], [0.52, 0.36], [0.535, 0.62], [0.55, 1.0], [0.565, 0.62], [0.58, 0.36], [0.64, 0.34], [0.64, 0.22], [0.72, 0.22], [0.74, 0.48], [0.76, 0.22], [0.84, 0.24], [0.86, 0.46], [0.875, 0.72], [0.89, 0.46], [0.91, 0.26], [1, 0.2]];
    for (const [u, v] of pts) x.lineTo(x0 + u * w, y0 - v * h);
    x.lineTo(x0 + w, y0);
    x.closePath();
    x.fill();
    x.restore();
  }

  function winFlag(x, cx, cy, s) {
    const cols = ['#e8331c', '#3cb44a', '#2f6fd8', '#f7c51a'];
    x.save();
    x.translate(cx, cy);
    for (let k = 0; k < 4; k++) {
      const ox = (k % 2) * s * 0.52, oy = Math.floor(k / 2) * s * 0.52;
      x.fillStyle = cols[k];
      x.beginPath();
      for (let i = 0; i <= 8; i++) { const u = i / 8; x.lineTo(ox + u * s * 0.48 - s * 0.5, oy - s * 0.5 + Math.sin(u * 3 + ox * 0.02) * s * 0.05); }
      for (let i = 8; i >= 0; i--) { const u = i / 8; x.lineTo(ox + u * s * 0.48 - s * 0.5, oy - s * 0.02 + Math.sin(u * 3 + ox * 0.02) * s * 0.05); }
      x.fill();
      x.strokeStyle = '#101010'; x.lineWidth = s * 0.03; x.stroke();
    }
    x.fillStyle = cols[0]; for (let i = 0; i < 3; i++) x.fillRect(-s * (0.62 + i * 0.1), -s * 0.4 + i * s * 0.1, s * 0.06, s * 0.06);
    x.fillStyle = cols[2]; for (let i = 0; i < 3; i++) x.fillRect(-s * (0.62 + i * 0.1), s * 0.1 + i * s * 0.1, s * 0.06, s * 0.06);
    x.restore();
  }

  function tin(x, cx, cy, s) {
    x.save();
    x.translate(cx, cy);
    x.fillStyle = lg(x, -s, 0, s, 0, [[0, '#8a6a1a'], [0.5, '#f4d46a'], [1, '#8a6a1a']]);
    x.beginPath(); x.ellipse(0, 0, s, s * 0.55, 0, 0, TAU); x.fill();
    x.fillStyle = '#e8d8a8'; x.beginPath(); x.ellipse(0, 0, s * 0.86, s * 0.44, 0, 0, TAU); x.fill();
    for (let i = 0; i < 6; i++) {
      const y = -s * 0.3 + i * s * 0.12;
      x.fillStyle = lg(x, -s * 0.7, y, s * 0.7, y, [[0, '#6a4a1c'], [0.5, '#c8a050'], [1, '#6a4a1c']]);
      x.beginPath(); x.ellipse(0, y, s * 0.72, s * 0.07, 0, 0, TAU); x.fill();
      x.fillStyle = '#3a2410'; x.beginPath(); x.moveTo(s * 0.68, y); x.lineTo(s * 0.8, y - s * 0.06); x.lineTo(s * 0.8, y + s * 0.06); x.fill();
    }
    x.restore();
  }

  function horizonLogo(x, cx, cy, s, sub) {
    txt(x, 'HORIZON', cx, cy, { size: s, col: '#fff', stroke: 'rgba(40,0,30,0.55)', sw: s * 0.12, maxW: s * 5.2 });
    if (sub) txt(x, sub, cx, cy + s * 0.72, { size: s * 0.36, col: '#fff', font: 'Arial', weight: 700, maxW: s * 5 });
  }

  function arrow(x, cx, cy, s, dir, col) {
    x.save();
    x.translate(cx, cy);
    x.scale(dir, 1);
    x.fillStyle = col;
    x.beginPath(); x.moveTo(-s, -s * 0.28); x.lineTo(s * 0.2, -s * 0.28); x.lineTo(s * 0.2, -s * 0.62); x.lineTo(s, 0); x.lineTo(s * 0.2, s * 0.62); x.lineTo(s * 0.2, s * 0.28); x.lineTo(-s, s * 0.28); x.closePath(); x.fill();
    x.restore();
  }

  const P = {};

  P.cola = (x, w, h) => {
    x.fillStyle = rg(x, w * 0.35, h * 0.4, 10, w * 0.8, [[0, '#f0242c'], [1, '#86070c']]); x.fillRect(0, 0, w, h);
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(0, h * 0.72); x.bezierCurveTo(w * 0.3, h * 0.52, w * 0.55, h * 0.95, w, h * 0.66); x.lineTo(w, h * 0.78); x.bezierCurveTo(w * 0.55, h * 1.05, w * 0.3, h * 0.62, 0, h * 0.84); x.fill();
    bottle(x, w * 0.82, h * 0.97, h * 0.9, ['#2a0a06', '#7a2a1a'], '#3a1208', '#e0141c', 'BC');
    txt(x, 'BALTIC', w * 0.34, h * 0.24, { size: h * 0.2, col: '#fff', shadow: 'rgba(0,0,0,0.4)', maxW: w * 0.58 });
    txt(x, 'COLA', w * 0.34, h * 0.45, { size: h * 0.26, col: '#fff', shadow: 'rgba(0,0,0,0.4)', maxW: w * 0.58 });
    txt(x, 'Освежает Ригу с 1996 года', w * 0.34, h * 0.63, { size: h * 0.07, col: '#ffe0e0', font: 'Arial', weight: 700, maxW: w * 0.6 });
  };

  P.fm = (x, w, h) => {
    x.fillStyle = lg(x, 0, 0, w, h, [[0, '#0a1c3e'], [1, '#1c4a9a']]); x.fillRect(0, 0, w, h);
    waves(x, w * 0.18, h * 0.5, 5, h * 0.12, h * 0.07, '#ffd23a');
    x.fillStyle = '#ffd23a'; x.beginPath(); x.arc(w * 0.18, h * 0.5, h * 0.06, 0, TAU); x.fill();
    txt(x, 'RĪGA FM', w * 0.62, h * 0.2, { size: h * 0.13, col: '#fff', maxW: w * 0.6 });
    txt(x, '101.5', w * 0.6, h * 0.5, { size: h * 0.36, col: '#ffd23a', font: "Impact, 'Arial Black'", shadow: 'rgba(0,0,0,0.5)', maxW: w * 0.5 });
    txt(x, 'FM', w * 0.9, h * 0.44, { size: h * 0.1, col: '#fff' });
    txt(x, 'Горячие хиты 2000 и 2001 · 24 часа в эфире', w * 0.6, h * 0.8, { size: h * 0.065, col: '#cfe0ff', font: 'Arial', weight: 700, maxW: w * 0.72 });
    x.fillStyle = '#ffd23a'; for (let i = 0; i < 14; i++) { const bh = h * (0.03 + F.hash2(i, 1, 9) * 0.08); x.fillRect(w * 0.36 + i * w * 0.036, h * 0.94 - bh, w * 0.024, bh); }
  };

  P.mobile = (x, w, h) => {
    x.fillStyle = lg(x, 0, 0, w, h, [[0, '#0e5a2a'], [1, '#2aa04a']]); x.fillRect(0, 0, w, h);
    x.fillStyle = rg(x, w * 0.24, h * 0.52, 5, h * 0.6, [[0, 'rgba(255,190,60,0.9)'], [0.5, 'rgba(240,150,30,0.4)'], [1, 'rgba(240,150,30,0)']]); x.fillRect(0, 0, w, h);
    phone(x, w * 0.24, h * 0.55, h * 0.38, ['#2a2e34', '#5a6068'], '#a8d890', '#1a3a1a');
    txt(x, 'DZINTARS', w * 0.66, h * 0.22, { size: h * 0.16, col: '#fff', shadow: 'rgba(0,0,0,0.35)', maxW: w * 0.6 });
    txt(x, 'MOBILE', w * 0.66, h * 0.4, { size: h * 0.14, col: '#ffd23a', maxW: w * 0.6 });
    txt(x, 'GSM без границ', w * 0.66, h * 0.6, { size: h * 0.085, col: '#fff', font: 'Arial', weight: 700 });
    rrect(x, w * 0.46, h * 0.7, w * 0.4, h * 0.18, 6); x.fillStyle = '#ffd23a'; x.fill();
    txt(x, 'Карта «Zvaigzne» — 5 Ls', w * 0.66, h * 0.79, { size: h * 0.065, col: '#0e3a1a', font: 'Arial', weight: 900, style: 'normal', maxW: w * 0.38 });
  };

  P.kafija = (x, w, h) => {
    x.fillStyle = '#f4e6c8'; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(106,42,20,0.08)'; for (let i = 0; i < w; i += 24) x.fillRect(i, 0, 12, h);
    x.fillStyle = rg(x, w * 0.78, h * 0.62, 5, h * 0.7, [[0, '#8a4a24'], [1, '#4a1e0c']]); x.beginPath(); x.arc(w * 0.78, h * 0.62, h * 0.5, 0, TAU); x.fill();
    cup(x, w * 0.78, h * 0.62, h * 0.28, '#3a1a0a');
    txt(x, 'Sprīdītis', w * 0.3, h * 0.3, { size: h * 0.2, col: '#6a2a14', font: 'Georgia, serif', weight: 700, maxW: w * 0.44 });
    txt(x, 'KAFIJA', w * 0.3, h * 0.5, { size: h * 0.12, col: '#a0521e', style: 'normal', maxW: w * 0.44 });
    x.fillStyle = '#6a2a14'; x.fillRect(w * 0.1, h * 0.62, w * 0.4, 2);
    txt(x, 'Утро начинается здесь', w * 0.3, h * 0.74, { size: h * 0.075, col: '#4a1e0c', font: 'Georgia, serif', weight: 700, maxW: w * 0.44 });
  };

  P.banka = (x, w, h) => {
    x.fillStyle = lg(x, 0, 0, 0, h, [[0, '#ffffff'], [1, '#cfe0f0']]); x.fillRect(0, 0, w, h);
    x.fillStyle = '#12306a'; x.fillRect(0, 0, w * 0.34, h);
    x.strokeStyle = '#fff'; x.lineWidth = 5;
    for (let k = 0; k < 3; k++) { x.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20; x.lineTo(w * 0.04 + u * w * 0.26, h * (0.36 + k * 0.1) + Math.sin(u * TAU) * h * 0.03); } x.stroke(); }
    txt(x, 'DAUGAVA', w * 0.17, h * 0.72, { size: h * 0.08, col: '#fff', maxW: w * 0.3 });
    txt(x, 'BANKA', w * 0.17, h * 0.82, { size: h * 0.07, col: '#9ac0ff', maxW: w * 0.3 });
    car(x, w * 0.67, h * 0.56, w * 0.22, '#1e4a9a');
    txt(x, 'Автокредит от 9,9%', w * 0.67, h * 0.2, { size: h * 0.12, col: '#12306a', maxW: w * 0.6 });
    txt(x, 'Новая машина — без очереди', w * 0.67, h * 0.84, { size: h * 0.07, col: '#12306a', font: 'Arial', weight: 700, maxW: w * 0.6 });
  };

  P.net = (x, w, h) => {
    x.fillStyle = lg(x, 0, 0, w, 0, [[0, '#111'], [0.55, '#2a1400'], [1, '#e87a10']]); x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(232,122,16,0.15)'; for (let i = 0; i < h; i += 6) x.fillRect(0, i, w, 2);
    txt(x, '@', w * 0.8, h * 0.52, { size: h * 0.8, col: '#ffb030', font: 'Arial', weight: 900, style: 'normal', shadow: 'rgba(0,0,0,0.6)' });
    txt(x, 'AMBERNET', w * 0.36, h * 0.28, { size: h * 0.17, col: '#fff', maxW: w * 0.62 });
    txt(x, 'Интернет 56K · подключение за 1 день', w * 0.34, h * 0.52, { size: h * 0.075, col: '#ffcf80', font: 'Arial', weight: 700, maxW: w * 0.56 });
    txt(x, 'www.ambernet.lv', w * 0.36, h * 0.74, { size: h * 0.09, col: '#fff', font: "'Courier New', monospace", weight: 700, style: 'normal', maxW: w * 0.6 });
  };

  P.vetra = (x, w, h) => {
    x.fillStyle = lg(x, 0, 0, 0, h, [[0, '#3a3e44'], [1, '#16181a']]); x.fillRect(0, 0, w, h);
    x.save(); x.beginPath(); x.rect(0, 0, w, h * 0.14); x.clip();
    x.fillStyle = '#f2c200'; x.fillRect(0, 0, w, h * 0.14);
    x.fillStyle = '#111'; for (let i = -2; i < 24; i++) { x.beginPath(); x.moveTo(i * 28, 0); x.lineTo(i * 28 + 14, 0); x.lineTo(i * 28 - 2, h * 0.14); x.lineTo(i * 28 - 16, h * 0.14); x.fill(); }
    x.restore();
    x.strokeStyle = 'rgba(180,210,255,0.35)'; x.lineWidth = 1.5;
    for (let i = 0; i < 60; i++) { const px = F.hash2(i, 1, 21) * w, py = h * 0.18 + F.hash2(i, 2, 21) * h * 0.8; x.beginPath(); x.moveTo(px, py); x.lineTo(px - 4, py + 12); x.stroke(); }
    tyre(x, w * 0.8, h * 0.6, h * 0.36);
    txt(x, 'VĒTRA', w * 0.34, h * 0.4, { size: h * 0.26, col: '#f2c200', shadow: 'rgba(0,0,0,0.6)', maxW: w * 0.6 });
    txt(x, 'ШИНЫ, КОТОРЫЕ ДЕРЖАТ ДОРОГУ', w * 0.34, h * 0.64, { size: h * 0.068, col: '#fff', font: 'Arial', weight: 900, maxW: w * 0.62 });
    txt(x, 'в дождь, в ливень и в грозу', w * 0.34, h * 0.76, { size: h * 0.06, col: '#c8d4e0', font: 'Arial', weight: 700, maxW: w * 0.6 });
  };

  const festBg = (x, w, h) => {
    x.fillStyle = lg(x, 0, 0, w, h, [[0, '#e6146e'], [0.55, '#ff6a1a'], [1, '#ffc81e']]); x.fillRect(0, 0, w, h);
    speedLines(x, w, h, 'rgba(255,255,255,0.22)', 24, 5);
  };

  const hzArrow = dir => (x, w, h) => {
    festBg(x, w, h);
    horizonLogo(x, w * 0.4, h * 0.3, h * 0.24, 'FESTIVĀLS · RĪGA 2001');
    txt(x, 'МЕЖАПАРКС', w * 0.4, h * 0.74, { size: h * 0.13, col: '#1a0a14', maxW: w * 0.6 });
    x.fillStyle = 'rgba(255,255,255,0.92)'; rrect(x, w * 0.76, h * 0.2, w * 0.2, h * 0.6, 10); x.fill();
    arrow(x, w * 0.86, h * 0.5, w * 0.075, dir, '#e6146e');
  };
  P.hz_l = hzArrow(-1);
  P.hz_r = hzArrow(1);

  P.hz = (x, w, h) => {
    festBg(x, w, h);
    car(x, w * 0.74, h * 0.62, w * 0.2, '#161618');
    x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillRect(0, h * 0.8, w, 3);
    horizonLogo(x, w * 0.34, h * 0.3, h * 0.24, 'RĪGA 2001');
    txt(x, '27 гонок · 33 машины · финал в Межапарксе', w * 0.5, h * 0.88, { size: h * 0.066, col: '#fff', font: 'Arial', weight: 900, maxW: w * 0.9 });
  };

  P.r800 = (x, w, h) => {
    x.fillStyle = '#f7f4ee'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#9e3039'; x.fillRect(0, 0, w, h * 0.12); x.fillRect(0, h * 0.88, w, h * 0.12);
    skyline(x, w * 0.5, h * 0.88, w * 0.5, h * 0.6, '#9e3039');
    txt(x, 'RĪGAI', w * 0.26, h * 0.34, { size: h * 0.15, col: '#9e3039', font: 'Georgia, serif', maxW: w * 0.44 });
    txt(x, '800', w * 0.26, h * 0.58, { size: h * 0.3, col: '#9e3039', font: 'Georgia, serif', maxW: w * 0.44 });
    txt(x, '1201 — 2001', w * 0.26, h * 0.79, { size: h * 0.08, col: '#3a3a3a', font: 'Georgia, serif', weight: 700, style: 'normal', maxW: w * 0.44 });
  };

  P.wings = (x, w, h) => {
    x.fillStyle = lg(x, 0, 0, 0, h, [[0, '#2a78d8'], [1, '#bfe2ff']]); x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 7; i++) { const cx = F.hash2(i, 1, 33) * w, cy = h * (0.55 + F.hash2(i, 2, 33) * 0.4); for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(cx + k * 14, cy - Math.sin(k) * 6, 12 + (k % 2) * 6, 0, TAU); x.fill(); } }
    plane(x, w * 0.7, h * 0.34, w * 0.2, '#ffffff');
    txt(x, 'BALTIC WINGS', w * 0.3, h * 0.22, { size: h * 0.13, col: '#fff', shadow: 'rgba(0,40,90,0.5)', maxW: w * 0.56 });
    txt(x, 'Rīga — London от 99 Ls', w * 0.3, h * 0.44, { size: h * 0.085, col: '#0a2a5a', font: 'Arial', weight: 900, maxW: w * 0.56 });
    txt(x, 'Rīga — Stockholm от 49 Ls', w * 0.3, h * 0.58, { size: h * 0.085, col: '#0a2a5a', font: 'Arial', weight: 900, maxW: w * 0.56 });
  };

  P.winme = (x, w, h) => {
    x.fillStyle = lg(x, 0, 0, w, h, [[0, '#008080'], [0.6, '#10507a'], [1, '#0a1a4a']]); x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 12; i++) x.fillRect(0, i * h / 12, w, 1);
    winFlag(x, w * 0.8, h * 0.46, h * 0.46);
    txt(x, 'Microslop', w * 0.34, h * 0.24, { size: h * 0.1, col: '#e8f0ff', font: 'Arial', weight: 700, maxW: w * 0.6 });
    txt(x, 'Win Me', w * 0.34, h * 0.46, { size: h * 0.24, col: '#fff', font: "'Trebuchet MS', Arial", shadow: 'rgba(0,0,0,0.5)', maxW: w * 0.6 });
    txt(x, 'Millennium Edition — уже в продаже', w * 0.34, h * 0.72, { size: h * 0.068, col: '#ffe890', font: 'Arial', weight: 700, maxW: w * 0.62 });
  };

  P.zibens = (x, w, h) => {
    x.fillStyle = '#080808'; x.fillRect(0, 0, w, h);
    x.fillStyle = rg(x, w * 0.7, h * 0.5, 4, h * 0.8, [[0, 'rgba(160,255,40,0.5)'], [1, 'rgba(160,255,40,0)']]); x.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) bolt(x, w * (0.5 + i * 0.12), h * (0.35 + (i % 2) * 0.3), h * 0.25, 'rgba(190,255,60,0.35)');
    rrect(x, w * 0.64, h * 0.12, w * 0.18, h * 0.78, 12); x.fillStyle = lg(x, w * 0.64, 0, w * 0.82, 0, [[0, '#4a8a00'], [0.5, '#c8ff3a'], [1, '#3a7000']]); x.fill();
    bolt(x, w * 0.73, h * 0.5, h * 0.24, '#111');
    txt(x, 'ZIBENS', w * 0.3, h * 0.38, { size: h * 0.22, col: '#c8ff3a', shadow: 'rgba(160,255,40,0.8)', blur: 12, dx: 0, dy: 0, maxW: w * 0.54 });
    txt(x, 'ENERGY · Энергия молнии', w * 0.3, h * 0.62, { size: h * 0.075, col: '#fff', font: 'Arial', weight: 900, maxW: w * 0.54 });
  };

  P.kino = (x, w, h) => {
    x.fillStyle = lg(x, 0, 0, 0, h, [[0, '#1a0a3a'], [0.6, '#3a0a4a'], [1, '#0a0a12']]); x.fillRect(0, 0, w, h);
    x.fillStyle = '#16161c'; x.beginPath(); x.moveTo(w * 0.42, h * 0.55); x.lineTo(w * 0.58, h * 0.55); x.lineTo(w, h); x.lineTo(0, h); x.fill();
    x.strokeStyle = '#e8d060'; x.setLineDash([10, 12]); x.lineWidth = 3; x.beginPath(); x.moveTo(w * 0.5, h * 0.56); x.lineTo(w * 0.5, h); x.stroke(); x.setLineDash([]);
    for (const s of [-1, 1]) { x.fillStyle = rg(x, w * 0.5 + s * w * 0.08, h * 0.74, 2, h * 0.3, [[0, 'rgba(255,255,230,1)'], [0.2, 'rgba(255,250,200,0.5)'], [1, 'rgba(255,250,200,0)']]); x.fillRect(0, h * 0.3, w, h * 0.7); }
    txt(x, 'NAKTS ŠOSEJA', w * 0.5, h * 0.2, { size: h * 0.17, col: '#e8f0ff', stroke: '#6a2ad8', sw: 5, maxW: w * 0.9 });
    txt(x, 'НОЧНОЕ ШОССЕ · В КИНО С 13 ИЮЛЯ', w * 0.5, h * 0.38, { size: h * 0.068, col: '#ffcf60', font: 'Arial', weight: 900, maxW: w * 0.9 });
  };

  P.sprot = (x, w, h) => {
    x.fillStyle = lg(x, 0, 0, w, 0, [[0, '#111'], [1, '#2a2008']]); x.fillRect(0, 0, w, h);
    x.strokeStyle = '#d4a830'; x.lineWidth = 4; x.strokeRect(8, 8, w - 16, h - 16);
    tin(x, w * 0.72, h * 0.54, h * 0.36);
    txt(x, 'ZELTA', w * 0.3, h * 0.3, { size: h * 0.15, col: '#f4d46a', font: 'Georgia, serif', maxW: w * 0.5 });
    txt(x, 'ŠPROTES', w * 0.3, h * 0.5, { size: h * 0.15, col: '#f4d46a', font: 'Georgia, serif', maxW: w * 0.5 });
    txt(x, 'Золотые шпроты — вкус Риги', w * 0.3, h * 0.72, { size: h * 0.065, col: '#e8dcc0', font: 'Georgia, serif', weight: 700, maxW: w * 0.5 });
  };

  const portrait = (bg, draw) => (x, w, h) => { bg(x, w, h); draw(x, w, h); };
  P.cl_cola = portrait((x, w, h) => { x.fillStyle = rg(x, w / 2, h * 0.4, 5, h, [[0, '#f0242c'], [1, '#86070c']]); x.fillRect(0, 0, w, h); }, (x, w, h) => {
    bottle(x, w / 2, h * 0.8, h * 0.6, ['#2a0a06', '#7a2a1a'], '#3a1208', '#e0141c', 'BC');
    txt(x, 'BALTIC COLA', w / 2, h * 0.88, { size: w * 0.13, col: '#fff', maxW: w * 0.9 });
    txt(x, 'Ледяная!', w / 2, h * 0.1, { size: w * 0.14, col: '#fff', maxW: w * 0.9 });
  });
  P.cl_kafija = portrait((x, w, h) => { x.fillStyle = '#f4e6c8'; x.fillRect(0, 0, w, h); }, (x, w, h) => {
    cup(x, w / 2, h * 0.52, w * 0.3, '#3a1a0a');
    txt(x, 'Sprīdītis', w / 2, h * 0.14, { size: w * 0.18, col: '#6a2a14', font: 'Georgia, serif', maxW: w * 0.9 });
    txt(x, 'Kafija · 0,35 Ls', w / 2, h * 0.84, { size: w * 0.11, col: '#4a1e0c', font: 'Georgia, serif', weight: 700, maxW: w * 0.9 });
  });
  P.cl_mobile = portrait((x, w, h) => { x.fillStyle = lg(x, 0, 0, 0, h, [[0, '#0e5a2a'], [1, '#2aa04a']]); x.fillRect(0, 0, w, h); }, (x, w, h) => {
    phone(x, w / 2, h * 0.48, h * 0.22, ['#2a2e34', '#5a6068'], '#a8d890', '#1a3a1a');
    txt(x, 'DZINTARS', w / 2, h * 0.84, { size: w * 0.15, col: '#fff', maxW: w * 0.9 });
    txt(x, 'MOBILE', w / 2, h * 0.93, { size: w * 0.12, col: '#ffd23a', maxW: w * 0.9 });
  });
  P.cl_kino = portrait((x, w, h) => { x.fillStyle = lg(x, 0, 0, 0, h, [[0, '#1a0a3a'], [1, '#0a0a12']]); x.fillRect(0, 0, w, h); }, (x, w, h) => {
    for (const s of [-1, 1]) { x.fillStyle = rg(x, w / 2 + s * w * 0.18, h * 0.6, 2, w * 0.5, [[0, 'rgba(255,255,230,1)'], [0.25, 'rgba(255,250,200,0.45)'], [1, 'rgba(255,250,200,0)']]); x.fillRect(0, 0, w, h); }
    txt(x, 'NAKTS', w / 2, h * 0.14, { size: w * 0.2, col: '#e8f0ff', stroke: '#6a2ad8', sw: 3, maxW: w * 0.9 });
    txt(x, 'ŠOSEJA', w / 2, h * 0.26, { size: w * 0.2, col: '#e8f0ff', stroke: '#6a2ad8', sw: 3, maxW: w * 0.9 });
    txt(x, 'С 13 ИЮЛЯ', w / 2, h * 0.9, { size: w * 0.12, col: '#ffcf60', font: 'Arial', maxW: w * 0.9 });
  });
  P.cl_hz = portrait(festBg, (x, w, h) => {
    car(x, w / 2, h * 0.56, w * 0.36, '#161618');
    horizonLogo(x, w / 2, h * 0.18, w * 0.17, 'RĪGA 2001');
    txt(x, 'МЕЖАПАРКС', w / 2, h * 0.86, { size: w * 0.13, col: '#1a0a14', maxW: w * 0.9 });
  });
  P.cl_r800 = portrait((x, w, h) => { x.fillStyle = '#f7f4ee'; x.fillRect(0, 0, w, h); }, (x, w, h) => {
    skyline(x, 0, h * 0.62, w, h * 0.3, '#9e3039');
    x.fillStyle = '#9e3039'; x.fillRect(0, h * 0.62, w, h * 0.38);
    txt(x, 'RĪGAI', w / 2, h * 0.14, { size: w * 0.2, col: '#9e3039', font: 'Georgia, serif', maxW: w * 0.9 });
    txt(x, '800', w / 2, h * 0.76, { size: w * 0.36, col: '#fff', font: 'Georgia, serif', maxW: w * 0.9 });
  });
  P.cl_banka = portrait((x, w, h) => { x.fillStyle = '#12306a'; x.fillRect(0, 0, w, h); }, (x, w, h) => {
    x.strokeStyle = '#fff'; x.lineWidth = 4;
    for (let k = 0; k < 3; k++) { x.beginPath(); for (let i = 0; i <= 16; i++) { const u = i / 16; x.lineTo(w * 0.15 + u * w * 0.7, h * (0.2 + k * 0.07) + Math.sin(u * TAU) * h * 0.025); } x.stroke(); }
    car(x, w / 2, h * 0.55, w * 0.36, '#9ac0ff');
    txt(x, 'DAUGAVA BANKA', w / 2, h * 0.8, { size: w * 0.11, col: '#fff', maxW: w * 0.9 });
    txt(x, 'Кредит 9,9%', w / 2, h * 0.9, { size: w * 0.1, col: '#ffd23a', font: 'Arial', maxW: w * 0.9 });
  });
  P.cl_fm = portrait((x, w, h) => { x.fillStyle = lg(x, 0, 0, 0, h, [[0, '#0a1c3e'], [1, '#1c4a9a']]); x.fillRect(0, 0, w, h); }, (x, w, h) => {
    waves(x, w / 2, h * 0.36, 4, w * 0.1, w * 0.08, '#ffd23a');
    txt(x, '101.5', w / 2, h * 0.66, { size: w * 0.3, col: '#ffd23a', font: "Impact, 'Arial Black'", maxW: w * 0.9 });
    txt(x, 'RĪGA FM', w / 2, h * 0.84, { size: w * 0.15, col: '#fff', maxW: w * 0.9 });
  });

  const poster = (bg, fg, a, b, c) => (x, w, h) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.strokeStyle = fg; x.lineWidth = 2; x.strokeRect(5, 5, w - 10, h - 10);
    txt(x, a, w / 2, h * 0.24, { size: w * 0.17, col: fg, font: 'Georgia, serif', maxW: w * 0.86 });
    txt(x, b, w / 2, h * 0.46, { size: w * 0.13, col: fg, font: 'Georgia, serif', weight: 700, maxW: w * 0.86 });
    x.fillStyle = fg; x.fillRect(w * 0.2, h * 0.58, w * 0.6, 2);
    txt(x, c, w / 2, h * 0.72, { size: w * 0.1, col: fg, font: 'Arial', weight: 700, style: 'normal', maxW: w * 0.86 });
  };
  P.p_opera = poster('#1a1a2a', '#e8c878', 'OPERA', '«Aīda»', '14 · 21 · 28 июля');
  P.p_cirks = poster('#c81e1e', '#ffe060', 'CIRKS', 'Львы и клоуны', 'каждый вечер в 19:00');
  P.p_dzintari = poster('#f4efe0', '#1a3a6a', 'DZINTARI', 'Концерты лета', 'Концертный зал · 2001');
  P.p_hz = (x, w, h) => { festBg(x, w, h); horizonLogo(x, w / 2, h * 0.3, w * 0.18, 'RĪGA 2001'); car(x, w / 2, h * 0.64, w * 0.34, '#161618'); txt(x, 'МЕЖАПАРКС', w / 2, h * 0.86, { size: w * 0.13, col: '#1a0a14', maxW: w * 0.86 }); };
  P.p_kino = poster('#120a24', '#c8b0ff', 'KINO', 'Ночное шоссе', 'С 13 ИЮЛЯ');
  P.p_r800 = poster('#9e3039', '#ffffff', 'RĪGAI 800', 'Праздник города', '17–19 августа');

  const banner = (bg, fg, a, b) => (x, w, h) => {
    if (typeof bg === 'function') bg(x, w, h); else { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
    txt(x, a, w * 0.35, h * 0.52, { size: h * 0.56, col: fg, maxW: w * 0.6 });
    txt(x, b, w * 0.8, h * 0.52, { size: h * 0.36, col: fg, font: 'Arial', weight: 900, maxW: w * 0.36 });
  };
  P.b_hz = banner(festBg, '#fff', 'HORIZON RĪGA 2001', 'ФЕСТИВАЛЬ · МЕЖАПАРКС');
  P.b_r800 = banner((x, w, h) => { x.fillStyle = '#9e3039'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.fillRect(0, h * 0.4, w, h * 0.2); x.fillStyle = '#9e3039'; x.fillRect(w * 0.08, 0, w * 0.54, h); x.fillRect(w * 0.64, 0, w * 0.32, h); }, '#fff', 'RĪGAI 800 · 1201–2001', 'Rīga svin!');
  P.b_jurmala = banner((x, w, h) => { x.fillStyle = lg(x, 0, 0, w, 0, [[0, '#1a6ad8'], [1, '#30c0e8']]); x.fillRect(0, 0, w, h); }, '#ffe860', 'JŪRMALA 2001', 'VASARAS SEZONA');
  P.b_bik = banner((x, w, h) => { for (let i = 0; i < w / 20; i++) { x.fillStyle = i % 2 ? '#111' : '#f4f4f4'; x.fillRect(i * 20, 0, 20, h / 2); x.fillStyle = i % 2 ? '#f4f4f4' : '#111'; x.fillRect(i * 20, h / 2, 20, h / 2); } x.fillStyle = 'rgba(230,20,110,0.92)'; x.fillRect(w * 0.04, h * 0.1, w * 0.92, h * 0.8); }, '#fff', 'BIĶERNIEKI GRAND PRIX', 'HORIZON · 2001');
  P.b_welcome = banner((x, w, h) => { x.fillStyle = '#12306a'; x.fillRect(0, 0, w, h); }, '#fff', 'LAIPNI LŪDZAM RĪGĀ', 'ДОБРО ПОЖАЛОВАТЬ');

  const flag = (top, bot, a, b, fg) => (x, w, h) => {
    x.fillStyle = lg(x, 0, 0, 0, h, [[0, top], [1, bot]]);
    x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0); x.lineTo(w, h); x.lineTo(w / 2, h * 0.9); x.lineTo(0, h); x.closePath(); x.fill();
    x.save(); x.translate(w / 2, h * 0.42); x.rotate(-Math.PI / 2);
    txt(x, a, 0, 0, { size: w * 0.42, col: fg, maxW: h * 0.66 });
    x.restore();
    txt(x, b, w / 2, h * 0.82, { size: w * 0.2, col: fg, font: 'Arial', maxW: w * 0.9 });
  };
  P.f_hz = flag('#e6146e', '#ff7a1a', 'HORIZON', '2001', '#fff');
  P.f_hz2 = flag('#ff7a1a', '#ffc81e', 'HORIZON', 'RĪGA', '#1a0a14');
  P.f_r800 = flag('#9e3039', '#7a1e28', 'RĪGAI 800', '2001', '#fff');
  P.f_jurmala = flag('#1a6ad8', '#30c0e8', 'JŪRMALA', '2001', '#ffe860');

  const hoard = (bg, fg, a, b) => (x, w, h) => {
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(0, 0, w, h * 0.12);
    txt(x, a, w * 0.34, h * 0.54, { size: h * 0.6, col: fg, maxW: w * 0.6 });
    txt(x, b, w * 0.82, h * 0.54, { size: h * 0.32, col: fg, font: 'Arial', weight: 900, maxW: w * 0.3 });
  };
  P.h_cola = hoard('#d0141e', '#fff', 'BALTIC COLA', 'ОСВЕЖАЕТ');
  P.h_vetra = hoard('#f2c200', '#111', 'VĒTRA', 'ШИНЫ');
  P.h_mobile = hoard('#1a7a3a', '#fff', 'DZINTARS MOBILE', 'GSM');
  P.h_fm = hoard('#12305a', '#ffd23a', 'RĪGA FM', '101.5');
  P.h_hz = (x, w, h) => { festBg(x, w, h); txt(x, 'HORIZON', w * 0.5, h * 0.54, { size: h * 0.7, col: '#fff', maxW: w * 0.9 }); };
  P.h_banka = hoard('#ffffff', '#12306a', 'DAUGAVA BANKA', 'КРЕДИТ');
  P.h_net = hoard('#111111', '#ffb030', 'AMBERNET', '@ 56K');
  P.h_zibens = hoard('#080808', '#c8ff3a', 'ZIBENS', 'ENERGY');

  const wall = draw => (x, w, h) => {
    draw(x, w, h);
    x.fillStyle = 'rgba(60,30,20,0.12)';
    for (let r = 0, y = 0; y < h; r++, y += 6) { x.fillRect(0, y, w, 1); for (let k = (r % 2) * 9; k < w; k += 18) x.fillRect(k, y, 1, 6); }
    grain(x, w, h, 26, 71);
  };
  P.w_mobile = wall((x, w, h) => { P.cl_mobile(x, w, h); });
  P.w_cola = wall((x, w, h) => { P.cl_cola(x, w, h); });
  P.w_hz = wall((x, w, h) => { P.cl_hz(x, w, h); });
  P.w_kafija = wall((x, w, h) => { P.cl_kafija(x, w, h); });
  P.w_vetra = wall((x, w, h) => {
    x.fillStyle = lg(x, 0, 0, 0, h, [[0, '#3a3e44'], [1, '#16181a']]); x.fillRect(0, 0, w, h);
    tyre(x, w / 2, h * 0.5, w * 0.38);
    txt(x, 'VĒTRA', w / 2, h * 0.12, { size: w * 0.24, col: '#f2c200', maxW: w * 0.9 });
    txt(x, 'ШИНЫ ДЛЯ ДОЖДЯ', w / 2, h * 0.9, { size: w * 0.1, col: '#fff', font: 'Arial', maxW: w * 0.9 });
  });
  P.w_r800 = wall((x, w, h) => { P.cl_r800(x, w, h); });

  const neon = (col, glow, a) => (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = 'rgba(30,30,34,1)';
    x.fillRect(0, h * 0.08, w, h * 0.06); x.fillRect(0, h * 0.86, w, h * 0.06);
    txt(x, a, w / 2, h * 0.5, { size: h * 0.62, col, shadow: glow, blur: 8, dx: 0, dy: 0, stroke: 'rgba(20,20,24,1)', sw: 3, maxW: w * 0.88 });
  };
  P.r_cola = neon('#ff2a30', 'rgba(255,40,40,0.9)', 'BALTIC COLA');
  P.r_mobile = neon('#40e070', 'rgba(60,255,120,0.9)', 'DZINTARS MOBILE');
  P.r_banka = neon('#5aa0ff', 'rgba(90,160,255,0.9)', 'DAUGAVA BANKA');
  P.r_fm = neon('#ffd23a', 'rgba(255,210,60,0.9)', 'RĪGA FM 101.5');
  P.r_kafija = neon('#ffb070', 'rgba(255,170,100,0.9)', 'SPRĪDĪTIS KAFIJA');

  const FMT_OF = id => id.startsWith('cl_') ? 'cl' : id.startsWith('p_') ? 'col' : id.startsWith('b_') ? 'ban' : id.startsWith('f_') ? 'flag' : id.startsWith('h_') ? 'hoard' : id.startsWith('w_') ? 'wall' : id.startsWith('r_') ? 'roof' : 'bb';
  const ALPHA = new Set(['flag', 'roof']);

  const A = (() => {
    const list = Object.keys(P).map(id => { const [w, h] = SIZE[FMT_OF(id)]; return [id, w, h]; }).sort((a, b) => b[2] - a[2] || b[1] - a[1]);
    const out = {};
    let x = 0, y = 0, row = 0;
    for (const [id, w, h] of list) {
      if (x + w > S) { x = 0; y += row + PAD * 2; row = 0; }
      out[id] = [x + PAD, y + PAD, w, h];
      x += w + PAD * 2;
      row = Math.max(row, h);
    }
    if (y + row + PAD * 2 > S) throw new Error('ad atlas overflow');
    return out;
  })();

  F.Tex.register('adatlas', () => {
    const c = F.Tex.canvas(S, S), x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#808080'; x.fillRect(0, 0, S, S);
    for (const id of Object.keys(P)) {
      const [rx, ry, w, h] = A[id];
      const t = F.Tex.canvas(w, h), tx = t.getContext('2d', { willReadFrequently: true });
      P[id](tx, w, h);
      x.clearRect(rx - PAD, ry - PAD, w + PAD * 2, h + PAD * 2);
      for (const [dx, dy] of [[-PAD, 0], [PAD, 0], [0, -PAD], [0, PAD], [-PAD, -PAD], [PAD, PAD], [-PAD, PAD], [PAD, -PAD]]) x.drawImage(t, rx + dx, ry + dy);
      x.clearRect(rx, ry, w, h);
      x.drawImage(t, rx, ry);
    }
    return c;
  }, { clamp: true });

  function uv(id, u0 = 0, v0 = 0, u1 = 1, v1 = 1) {
    const r = A[id];
    const U = u => (r[0] + 0.5 + (r[2] - 1) * u) / S, V = v => (r[1] + 0.5 + (r[3] - 1) * v) / S;
    return [U(u0), V(v1), U(u1), V(v1), U(u1), V(v0), U(u0), V(v0)];
  }

  const POOL = {
    bb: { fest: ['hz', 'hz', 'cola', 'fm', 'zibens'], city: ['cola', 'fm', 'mobile', 'kafija', 'banka', 'net', 'vetra', 'r800', 'winme', 'zibens', 'kino', 'sprot', 'hz'], port: ['vetra', 'net', 'zibens', 'banka', 'sprot'], air: ['wings', 'wings', 'r800', 'mobile', 'banka'], jurmala: ['kafija', 'cola', 'wings', 'hz', 'sprot'], track: ['vetra', 'zibens', 'hz'], old: ['r800', 'kafija', 'kino'], centre: ['mobile', 'cola', 'kafija', 'net', 'winme', 'kino'] },
    cl: { old: ['cl_r800', 'cl_kafija', 'cl_kino', 'cl_hz'], centre: ['cl_cola', 'cl_mobile', 'cl_kino', 'cl_banka', 'cl_fm', 'cl_hz', 'cl_kafija'], city: ['cl_cola', 'cl_mobile', 'cl_banka', 'cl_fm', 'cl_hz'], fest: ['cl_hz', 'cl_cola', 'cl_fm'], jurmala: ['cl_kafija', 'cl_cola', 'cl_hz'] },
    col: { old: ['p_opera', 'p_r800', 'p_kino', 'p_cirks', 'p_hz'], centre: ['p_opera', 'p_cirks', 'p_kino', 'p_hz', 'p_r800'], jurmala: ['p_dzintari', 'p_dzintari', 'p_hz', 'p_kino'], fest: ['p_hz', 'p_kino', 'p_cirks'], city: ['p_cirks', 'p_kino', 'p_hz'] },
    ban: { fest: ['b_hz'], old: ['b_r800'], jurmala: ['b_jurmala'], track: ['b_bik'], air: ['b_welcome'], city: ['b_welcome', 'b_r800', 'b_hz'], centre: ['b_hz', 'b_r800'] },
    flag: { fest: ['f_hz', 'f_hz2'], old: ['f_r800'], jurmala: ['f_jurmala'] },
    hoard: { track: ['h_cola', 'h_vetra', 'h_mobile', 'h_fm', 'h_hz', 'h_banka', 'h_net', 'h_zibens'] },
    wall: { any: ['w_mobile', 'w_cola', 'w_hz', 'w_kafija', 'w_vetra', 'w_r800'] },
    roof: { any: ['r_cola', 'r_mobile', 'r_banka', 'r_fm', 'r_kafija'] }
  };

  function pick(fmt, theme, seed) {
    const p = POOL[fmt], list = p[theme] || p.city || p.any || Object.values(p)[0];
    return list[Math.floor(F.hash2(seed, 17, 3) * list.length) % list.length];
  }

  const STEEL = C('#72767c'), DARK = C('#34363a'), FRAME = C('#e2e2de'), GRATE = C('#55595e'), GREEN = C('#2e5a44'), GLASS = C('#6e8a96');
  const LIT = a => [255, 255, 255, Math.round(F.clamp(a, 0, 1) * 255)];

  function adQuad(b, a, c, y0, y1, n, id, lit, u0 = 0, u1 = 1, mat = MAT.AD) {
    const rx = n[2], rz = -n[0];
    let L = a, R = c;
    if ((c[0] - a[0]) * rx + (c[1] - a[1]) * rz < 0) { L = c; R = a; }
    b.quad([L[0], y0, L[1]], [R[0], y0, R[1]], [R[0], y1, R[1]], [L[0], y1, L[1]], LIT(lit), mat, uv(id, u0, 0, u1, 1), n);
  }

  function plate(b, a, c, y0, y1, n, col) {
    const rx = n[2], rz = -n[0];
    let L = a, R = c;
    if ((c[0] - a[0]) * rx + (c[1] - a[1]) * rz < 0) { L = c; R = a; }
    b.quad([L[0], y0, L[1]], [R[0], y0, R[1]], [R[0], y1, R[1]], [L[0], y1, L[1]], col, 0, null, n);
  }

  function hquad(b, q, y, up, col) {
    const ux = q[1][0] - q[0][0], uz = q[1][1] - q[0][1], vx = q[3][0] - q[0][0], vz = q[3][1] - q[0][1];
    const r = (uz * vx - ux * vz > 0) === up ? q : [q[0], q[3], q[2], q[1]];
    b.quad(r.map(p => [p[0], y, p[1]])[0], [r[1][0], y, r[1][1]], [r[2][0], y, r[2][1]], [r[3][0], y, r[3][1]], col, 0, null, [0, up ? 1 : -1, 0]);
  }

  function vboard(st, fb, site, ads) {
    const big = site.big, W = big ? 12 : 6, H = big ? 4 : 3, Y = big ? 8.6 : 6.2, a = 0.44, ca = Math.cos(a), sa = Math.sin(a);
    const zV = 1.2, V = [0, zV], lamps = [];
    for (const [k, s] of [[0, -1], [1, 1]]) {
      const E = [s * W * ca, zV - W * sa];
      const n = [-s * sa, 0, -ca];
      adQuad(fb, V, E, Y, Y + H, n, ads[k], 0.95);
      const o = [-n[0] * 0.2, -n[2] * 0.2];
      plate(st, [E[0] + o[0], E[1] + o[1]], [V[0] + o[0], V[1] + o[1]], Y - 0.2, Y + H + 0.2, [-n[0], 0, -n[2]], FRAME);
      for (const y of [Y - 0.2, Y + H + 0.2]) hquad(st, [V, E, [E[0] + o[0], E[1] + o[1]], [V[0] + o[0], V[1] + o[1]]], y, y > Y, y > Y ? FRAME : DARK);
      plate(st, [E[0], E[1]], [E[0] + o[0], E[1] + o[1]], Y - 0.2, Y + H + 0.2, [s * ca, 0, -sa], FRAME);
      const g0 = [V[0] - n[0] * 0.9, V[1] - n[2] * 0.9], g1 = [E[0] - n[0] * 0.9, E[1] - n[2] * 0.9];
      hquad(st, [V, E, g1, g0], Y - 0.4, true, GRATE);
      st.beam([g0[0], Y + 0.55, g0[1]], [g1[0], Y + 0.55, g1[1]], 0.03, STEEL, 0);
      const nl = big ? 4 : 2;
      for (let i = 0; i < nl; i++) {
        const t = (i + 0.5) / nl, lx = V[0] + (E[0] - V[0]) * t, lz = V[1] + (E[1] - V[1]) * t;
        const hx = lx - n[0] * 1.2, hz = lz - n[2] * 1.2;
        st.beam([lx, Y + H + 0.2, lz], [hx, Y + H + 0.62, hz], 0.04, DARK, 0);
        st.box(hx, Y + H + 0.55, hz, 0.2, 0.07, 0.2, C('#f0ecd0'), MAT.LAMP);
        lamps.push([hx, Y + H + 0.45, hz]);
      }
      st.beam([0, Y + H * 0.5, zV + 0.45], [(V[0] + E[0]) / 2 + o[0] * 1.2, Y + H * 0.5, (V[1] + E[1]) / 2 + o[1] * 1.2], 0.12, DARK, 0);
    }
    const legs = big ? [-2.6, 2.6] : [0];
    for (const lx of legs) st.cyl(lx, -0.6, zV + 0.45, big ? 0.32 : 0.36, Y + H * 0.5 + 0.6, 8, STEEL, 0);
    if (big) st.beam([-2.6, Y - 0.6, zV + 0.45], [2.6, Y - 0.6, zV + 0.45], 0.18, STEEL, 0);
    return lamps;
  }

  function trivision(ads) {
    const b = new F.Batch(1024), N = 20, SW = 0.3, W = N * SW, H = 3, Y = 4.3;
    const R = SW / Math.sqrt(3), phi = [-150, -30, 90].map(d => d * Math.PI / 180);
    const order = [0, 2, 1];
    for (let i = 0; i < N; i++) {
      const cx = -W / 2 + (i + 0.5) * SW;
      for (let f = 0; f < 3; f++) {
        const p0 = phi[f], p1 = phi[(f + 1) % 3], m = (p0 + p1) / 2 + (f === 2 ? Math.PI : 0);
        const a = [cx + Math.cos(p0) * R * 0.985, Math.sin(p0) * R * 0.985], c = [cx + Math.cos(p1) * R * 0.985, Math.sin(p1) * R * 0.985];
        adQuad(b, a, c, Y, Y + H, [Math.cos(m), 0, Math.sin(m)], ads[order.indexOf(f)], 0.9, 1 - (i + 1) / N, 1 - i / N, MAT.TRI);
      }
    }
    const fr = (x0, y0, z0, x1, y1, z1) => b.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, FRAME, 0);
    fr(-W / 2 - 0.25, Y - 0.25, -0.25, W / 2 + 0.25, Y, 0.3);
    fr(-W / 2 - 0.25, Y + H, -0.25, W / 2 + 0.25, Y + H + 0.25, 0.3);
    fr(-W / 2 - 0.25, Y, -0.25, -W / 2, Y + H, 0.3);
    fr(W / 2, Y, -0.25, W / 2 + 0.25, Y + H, 0.3);
    b.box(0, Y + H / 2, 0.32, W / 2, H / 2, 0.02, DARK, 0);
    b.cyl(0, 0, 0.55, 0.3, Y, 8, STEEL, 0);
    b.beam([0, Y - 0.2, 0.55], [0, Y + 1, 0.34], 0.12, DARK, 0);
    const lamps = [];
    for (const x of [-2, 0, 2]) {
      b.beam([x, Y + H + 0.25, 0], [x, Y + H + 0.6, -0.9], 0.04, DARK, 0);
      b.box(x, Y + H + 0.55, -0.95, 0.18, 0.06, 0.16, C('#f0ecd0'), MAT.LAMP);
      lamps.push([x, Y + H + 0.45, -0.95]);
    }
    return { batch: b, lamps };
  }

  function shelter(st, fb, ad) {
    for (const [x, z] of [[-2, 0.65], [2, 0.65], [-2, -0.55], [2, -0.55]]) st.box(x, 1.25, z, 0.05, 1.25, 0.05, DARK, 0);
    st.box(0, 2.55, 0.05, 2.25, 0.07, 0.85, C('#d0d4d6'), 0, { side: C('#1e5aa8') });
    st.box(0, 2.45, -0.78, 2.25, 0.1, 0.03, C('#1e5aa8'), 0);
    plate(st, [-2, 0.66], [2, 0.66], 0.15, 2.4, [0, 0, -1], GLASS);
    plate(st, [2, 0.68], [-2, 0.68], 0.15, 2.4, [0, 0, 1], GLASS);
    plate(st, [2, -0.5], [2, 0.6], 0.15, 2.4, [1, 0, 0], GLASS);
    plate(st, [2.02, 0.6], [2.02, -0.5], 0.15, 2.4, [-1, 0, 0], GLASS);
    st.box(0, 0.45, 0.42, 1.5, 0.04, 0.18, C('#8a5a30'), 0);
    st.box(0, 0.22, 0.42, 1.4, 0.2, 0.05, DARK, 0);
    st.box(-2, 1.3, 0.05, 0.1, 1.05, 0.66, DARK, 0);
    adQuad(fb, [-2.11, -0.55], [-2.11, 0.62], 0.35, 2.2, [-1, 0, 0], ad, 1);
    adQuad(fb, [-1.89, -0.55], [-1.89, 0.62], 0.35, 2.2, [1, 0, 0], ad, 1);
    st.box(2.3, 2.9, -0.7, 0.2, 0.2, 0.02, C('#1e5aa8'), 0);
    st.cyl(2.3, 0, -0.7, 0.04, 2.7, 4, STEEL, 0);
  }

  function citylight(st, fb, ad, adB) {
    st.box(0, 1.28, 0, 0.66, 0.98, 0.12, C('#2a2c30'), 0);
    for (const x of [-0.45, 0.45]) st.box(x, 0.16, 0, 0.06, 0.16, 0.06, C('#2a2c30'), 0);
    adQuad(fb, [-0.6, -0.125], [0.6, -0.125], 0.36, 2.2, [0, 0, -1], ad, 1);
    adQuad(fb, [-0.6, 0.125], [0.6, 0.125], 0.36, 2.2, [0, 0, 1], adB, 1);
  }

  function column(st, fb, ads) {
    const r = 0.62, n = 12;
    st.cyl(0, 0, 0, r + 0.08, 0.34, n, GREEN, 0);
    st.cyl(0, 2.36, 0, r + 0.06, 0.26, n, GREEN, 0);
    st.cone(0, 2.62, 0, r + 0.1, 0.62, n, GREEN, 0);
    st.box(0, 3.3, 0, 0.07, 0.1, 0.07, C('#c8a040'), MAT.TRIM);
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, am = (a0 + a1) / 2, k = Math.floor(i / 4);
      adQuad(fb, [Math.cos(a0) * r, Math.sin(a0) * r], [Math.cos(a1) * r, Math.sin(a1) * r], 0.34, 2.36, [Math.cos(am), 0, Math.sin(am)], ads[k], 0.25, 1 - (i % 4 + 1) / 4, 1 - (i % 4) / 4);
    }
  }

  function span(st, fb, site, ad) {
    const w = site.w, H = Math.min(1.5, (w - 0.8) / 12.8), y0 = 5.9;
    for (const s of [-1, 1]) {
      st.cyl(s * w / 2, 0, 0, 0.13, 8.2, 6, STEEL, 0);
      st.beam([s * w / 2, 8, 0], [s * (w / 2 - 0.4), y0 + H, 0], 0.015, DARK, 0);
      st.beam([s * w / 2, y0 + 0.2, 0], [s * (w / 2 - 0.4), y0, 0], 0.015, DARK, 0);
    }
    const a = [-w / 2 + 0.4, 0], c = [w / 2 - 0.4, 0];
    adQuad(fb, a, c, y0, y0 + H, [0, 0, -1], ad, 0.5);
    adQuad(fb, [a[0], 0.02], [c[0], 0.02], y0, y0 + H, [0, 0, 1], ad, 0.5);
  }

  function hoarding(st, fb, ad, adB) {
    for (const x of [-3.8, 0, 3.8]) st.box(x, 0.7, 0.08, 0.05, 0.7, 0.05, DARK, 0);
    adQuad(fb, [-4, -0.01], [4, -0.01], 0.3, 1.36, [0, 0, -1], ad, 0.6);
    adQuad(fb, [-4, 0.04], [4, 0.04], 0.3, 1.36, [0, 0, 1], adB, 0.6);
  }

  function roofSign(st, fb, site, ad) {
    const w = site.w, h = w / 5.33, y0 = 1.3;
    const posts = Math.max(2, Math.round(w / 3));
    for (let i = 0; i <= posts; i++) {
      const x = -w / 2 + w * i / posts;
      st.beam([x, 0, 0.1], [x, y0 + h, 0.1], 0.06, STEEL, 0);
      st.beam([x, 0, 1.4], [x, y0 + h * 0.8, 0.12], 0.05, STEEL, 0);
      if (i < posts) st.beam([x, y0 * 0.5, 0.1], [-w / 2 + w * (i + 1) / posts, y0 + h * 0.6, 0.1], 0.035, STEEL, 0);
    }
    st.beam([-w / 2, y0 - 0.05, 0.1], [w / 2, y0 - 0.05, 0.1], 0.06, STEEL, 0);
    st.beam([-w / 2, y0 + h, 0.1], [w / 2, y0 + h, 0.1], 0.05, STEEL, 0);
    adQuad(fb, [-w / 2, 0], [w / 2, 0], y0, y0 + h, [0, 0, -1], ad, 1);
  }

  function flagPair(fb, ad) {
    adQuad(fb, [0, -0.16], [0, -0.92], 4.2, 6.4, [-1, 0, 0], ad, 0.15);
    adQuad(fb, [0.01, -0.92], [0.01, -0.16], 4.2, 6.4, [1, 0, 0], ad, 0.15);
  }

  function flagBrackets(b) {
    for (const y of [4.25, 6.35]) b.beam([0, y, -0.1], [0, y, -0.96], 0.025, DARK, 0);
  }

  F.Ads = { P, regions: A, size: S, uv, pick, POOL, SIZE, FMT_OF, ALPHA, adQuad, plate, vboard, trivision, shelter, citylight, column, span, hoarding, roofSign, flagPair, flagBrackets };
})(globalThis.Forza = globalThis.Forza || {});
