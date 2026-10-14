(function (P) {
  'use strict';
  const O = P.Orn, A = P.Art;
  const { ell, rrect, poly, finish, limb, INK } = A;
  const TAU = Math.PI * 2;
  const K = 3;
  const COBALT = '#1b3f8f', TURQ = '#2a9aa8', GOLD = '#e8c060';

  function grad(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    return g;
  }

  function radial(ctx, x, y, r, stops) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    return g;
  }

  function roundPoly(ctx, pts, r) {
    const n = pts.length;
    const a = pts[n - 1], b = pts[0];
    ctx.beginPath();
    ctx.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; ctx.arcTo(p[0], p[1], q[0], q[1], r); }
    ctx.closePath();
  }

  function dot(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }

  function seed(ctx, x, y, a, len, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, len, len * 0.45, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function shadowUnder(ctx, x, y, rx, ry) { ell(ctx, x, y, rx, ry, 'rgba(50,25,8,0.24)', null); }

  function plate(ctx, cx, cy, rx, ry) {
    ell(ctx, cx, cy + ry * 0.3, rx, ry, '#142c6c', INK, 1.1);
    ell(ctx, cx, cy, rx, ry, COBALT, INK, 1.1);
    ell(ctx, cx, cy + ry * 0.05, rx * 0.83, ry * 0.78, radial(ctx, cx - rx * 0.35, cy - ry * 0.3, rx * 1.1, ['#fffdf6', '#f1e9d4', '#dcd2bb']), null);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; dot(ctx, cx + Math.cos(a) * rx * 0.915, cy + Math.sin(a) * ry * 0.9, Math.max(0.3, rx * 0.034), i % 2 ? '#ffffff' : '#7fd0d8'); }
    ctx.strokeStyle = TURQ; ctx.lineWidth = Math.max(0.4, ry * 0.12);
    ctx.beginPath(); ctx.ellipse(cx, cy + ry * 0.05, rx * 0.68, ry * 0.62, 0, 0, TAU); ctx.stroke();
  }

  function dome(ctx, cx, by, rx, h) {
    ctx.beginPath();
    ctx.moveTo(cx - rx, by);
    ctx.bezierCurveTo(cx - rx * 1.04, by - h * 0.72, cx - rx * 0.52, by - h, cx, by - h);
    ctx.bezierCurveTo(cx + rx * 0.52, by - h, cx + rx * 1.04, by - h * 0.72, cx + rx, by);
    ctx.bezierCurveTo(cx + rx * 0.62, by + h * 0.2, cx - rx * 0.62, by + h * 0.2, cx - rx, by);
    ctx.closePath();
  }

  function meat(ctx, x, y, w, h, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    rrect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.4, '#7a361a', INK, 0.7);
    ctx.fillStyle = '#b4683c';
    ctx.beginPath(); ctx.ellipse(-w * 0.12, -h * 0.16, w * 0.24, h * 0.16, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function garlic(ctx, x, y, r) {
    ell(ctx, x, y, r, r * 0.9, '#f7efdf', INK, 0.7);
    ctx.strokeStyle = '#cdbd9a'; ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.3, y - r * 0.72); ctx.quadraticCurveTo(x - r * 0.62, y, x - r * 0.28, y + r * 0.78);
    ctx.moveTo(x + r * 0.3, y - r * 0.72); ctx.quadraticCurveTo(x + r * 0.62, y, x + r * 0.28, y + r * 0.78);
    ctx.stroke();
    ell(ctx, x, y - r * 0.92, r * 0.2, r * 0.26, '#a8926a', null);
    dot(ctx, x - r * 0.4, y - r * 0.35, r * 0.16, 'rgba(255,255,255,0.9)');
  }

  function eggHalf(ctx, x, y, r) {
    ell(ctx, x, y, r, r * 0.72, '#fffdf2', INK, 0.6);
    ell(ctx, x + r * 0.06, y + r * 0.03, r * 0.46, r * 0.38, '#f3b21c', null);
  }

  function plovHeap(ctx, cx, by, rx, h, sd, toppings) {
    dome(ctx, cx, by, rx, h);
    ctx.fillStyle = radial(ctx, cx - rx * 0.32, by - h * 0.68, rx * 1.45, ['#fff0bf', '#f5c566', '#e09a42', '#b36c26']);
    ctx.fill();
    ctx.save();
    dome(ctx, cx, by, rx, h);
    ctx.clip();
    const r = P.rng(sd);
    for (let i = 0; i < 90; i++) {
      const x = cx + (r() * 2 - 1) * rx, y = by + 1 - r() * (h + 2);
      seed(ctx, x, y, r() * Math.PI, rx * 0.085, r() < 0.72 ? 'rgba(255,249,228,0.95)' : 'rgba(176,108,34,0.55)');
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const x = cx + (r() * 2 - 1) * rx * 0.86, y = by - r() * h * 0.92, a = r() * Math.PI, l = rx * 0.13;
      ctx.strokeStyle = r() < 0.55 ? '#ef7418' : '#f6b62a';
      ctx.lineWidth = rx * 0.1;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(110,52,8,0.2)';
    ctx.beginPath(); ctx.ellipse(cx + rx * 0.62, by - h * 0.25, rx * 0.55, h * 0.75, 0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,230,0.35)';
    ctx.beginPath(); ctx.ellipse(cx - rx * 0.42, by - h * 0.62, rx * 0.2, h * 0.2, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
    dome(ctx, cx, by, rx, h);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.stroke();
    if (!toppings) return;
    const top = by - h;
    for (let i = 0; i < 6; i++) dot(ctx, cx - rx * 0.62 + i * rx * 0.26, by - h * (0.16 + (i % 2) * 0.18), rx * 0.07, i % 3 ? '#e8bf6c' : '#5a2430');
    meat(ctx, cx + rx * 0.34, top + h * 0.3, rx * 0.36, rx * 0.26, 0.4);
    meat(ctx, cx - rx * 0.46, top + h * 0.5, rx * 0.34, rx * 0.25, -0.5);
    meat(ctx, cx + rx * 0.02, top + h * 0.56, rx * 0.34, rx * 0.25, 0.15);
    meat(ctx, cx + rx * 0.66, top + h * 0.62, rx * 0.3, rx * 0.22, 0.9);
    eggHalf(ctx, cx + rx * 0.3, top + h * 0.8, rx * 0.21);
    garlic(ctx, cx - rx * 0.2, top + h * 0.13, rx * 0.27);
    ctx.lineCap = 'round';
    for (const [dx, dy, a] of [[-0.62, 0.72, 0.5], [0.52, 0.42, -0.7], [-0.2, 0.84, -0.2], [0.72, 0.84, 0.3]]) {
      const x = cx + dx * rx, y = top + dy * h, l = rx * 0.14;
      ctx.strokeStyle = INK; ctx.lineWidth = rx * 0.15;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
      ctx.strokeStyle = dx < 0 ? '#f07418' : '#f7b92e'; ctx.lineWidth = rx * 0.09; ctx.stroke();
    }
  }

  function blob(ctx, cx, cy, rx, ry, sd, k) {
    const r = P.rng(sd), n = 8, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU, f = 1 + (r() - 0.5) * (k || 0.3); pts.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]); }
    ctx.beginPath();
    const l = pts[n - 1];
    ctx.moveTo((l[0] + pts[0][0]) / 2, (l[1] + pts[0][1]) / 2);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    ctx.closePath();
  }

  function pakhta(ctx, x, y, s, col) { O.pakhta(ctx, x, y, s, col || COBALT); }

  function bowlBody(ctx, rx, rimY, depth, footR) {
    ctx.beginPath();
    ctx.moveTo(-rx, rimY);
    ctx.bezierCurveTo(-rx, rimY + depth * 0.75, -footR * 1.3, rimY + depth, 0, rimY + depth);
    ctx.bezierCurveTo(footR * 1.3, rimY + depth, rx, rimY + depth * 0.75, rx, rimY);
    ctx.closePath();
  }

  function tomatoSlice(ctx, x, y, r) {
    ell(ctx, x, y, r, r * 0.62, '#d9281e', '#7a0e0a', 0.6);
    ell(ctx, x, y + r * 0.02, r * 0.74, r * 0.44, '#f25c46', null);
    ctx.fillStyle = '#ffe08a';
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.36, y + Math.sin(a) * r * 0.2, r * 0.13, r * 0.08, a, 0, TAU); ctx.fill(); }
    ell(ctx, x, y, r * 0.16, r * 0.1, '#f7b0a0', null);
  }

  function onionRing(ctx, x, y, r, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.lineWidth = r * 0.5; ctx.strokeStyle = '#a77ab8';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.5, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.lineWidth = r * 0.3; ctx.strokeStyle = '#fbf4fd';
    ctx.stroke();
    ctx.restore();
  }

  function leaf(ctx, x, y, l, a, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(-l, 0); ctx.quadraticCurveTo(0, -l * 0.55, l, 0); ctx.quadraticCurveTo(0, l * 0.55, -l, 0); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = l * 0.12; ctx.beginPath(); ctx.moveTo(-l * 0.8, 0); ctx.lineTo(l * 0.8, 0); ctx.stroke();
    ctx.restore();
  }

  function kosa(ctx) {
    shadowUnder(ctx, 0, 12.8, 10, 2.4);
    ell(ctx, 0, 11.4, 5.8, 1.8, '#d8d0bd', INK, 0.9);
    bowlBody(ctx, 14.5, -1.5, 13, 5.5);
    finish(ctx, grad(ctx, -14, 0, 14, 0, ['#ffffff', '#f3eee2', '#d6cdb8']), INK, 1.1);
    ctx.save();
    bowlBody(ctx, 14.5, -1.5, 13, 5.5);
    ctx.clip();
    ctx.strokeStyle = COBALT; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-15, 1.6); ctx.quadraticCurveTo(0, 5.2, 15, 1.6); ctx.stroke();
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(-15, 3.4); ctx.quadraticCurveTo(0, 7, 15, 3.4); ctx.stroke();
    pakhta(ctx, -5.6, 6.8, 3.6); pakhta(ctx, 3.6, 7.4, 3.2); pakhta(ctx, 11, 5.4, 2.6);
    ctx.restore();
    ell(ctx, 0, -1.5, 14.5, 4.4, '#fbf8f0', INK, 1.1);
    ell(ctx, 0, -1.1, 12.8, 3.3, '#b8b0a0', null);
  }

  function bowlEaten(ctx) {
    kosa(ctx);
    ell(ctx, 0, -0.6, 10.4, 2.2, 'rgba(200,60,40,0.35)', null);
    tomatoSlice(ctx, 3.4, -1, 2.2);
    onionRing(ctx, -3.6, -0.6, 1.8, 0.3);
  }

  function plovEaten(ctx) {
    shadowUnder(ctx, 0, 13.4, 15, 2.6);
    plate(ctx, 0, 6.6, 15.6, 6.6);
    const r = P.rng(5);
    for (let i = 0; i < 30; i++) seed(ctx, (r() * 2 - 1) * 9.4, 6.4 + (r() * 2 - 1) * 3.2, r() * Math.PI, 0.95, r() < 0.8 ? '#f4dc9c' : '#dc9038');
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f07418'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-3.6, 5); ctx.lineTo(-1, 4.1); ctx.moveTo(4, 7.8); ctx.lineTo(6.2, 8.6); ctx.stroke();
    ell(ctx, 1, 6, 4.4, 1.6, 'rgba(210,130,40,0.3)', null);
  }

  function crumbs(ctx) {
    shadowUnder(ctx, 0, 11.4, 12, 2.2);
    ell(ctx, 0, 7.8, 12, 4.8, '#e2dccc', INK, 1);
    ell(ctx, 0, 7.4, 9.6, 3.4, '#fbf8f0', null);
    ctx.strokeStyle = COBALT; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(0, 7.6, 11, 4.2, 0, 0, TAU); ctx.stroke();
    const r = P.rng(9);
    for (let i = 0; i < 12; i++) dot(ctx, (r() * 2 - 1) * 6.6, 7.4 + (r() * 2 - 1) * 2.2, 0.5 + r() * 0.5, r() < 0.6 ? '#d08a36' : '#b8661e');
    poly(ctx, [[2, 6.4], [6.4, 5.4], [5, 8.2]], '#e8a848', INK, 0.6);
  }

  function achichuk(ctx) {
    kosa(ctx);
    ctx.save();
    ctx.beginPath(); ctx.rect(-16, -16, 32, 15.2); ctx.ellipse(0, -1.1, 12.8, 3.3, 0, 0, Math.PI); ctx.clip();
    ctx.beginPath(); ctx.ellipse(0, -2.4, 12.2, 5.6, 0, 0, TAU); ctx.fillStyle = '#b8261c'; ctx.fill();
    ctx.restore();
    const spots = [[-7.5, -2.2, 3.6], [-1.6, -4.4, 3.8], [4.8, -2.4, 3.6], [8.4, -4.4, 2.8], [-4.4, -0.2, 3], [1.8, -0.4, 3.1]];
    for (const [x, y, r] of spots) tomatoSlice(ctx, x, y, r);
    onionRing(ctx, -3.8, -5.2, 2.8, 0.2); onionRing(ctx, 3.6, -5.6, 2.6, -0.3); onionRing(ctx, -8.8, -4.4, 2.2, 0.5); onionRing(ctx, 7.8, -1.4, 2.2, -0.1);
    leaf(ctx, 0.8, -7.4, 2.2, -0.6, '#6a2c7a'); leaf(ctx, -1.2, -6.8, 1.9, 0.9, '#4d8a2a'); leaf(ctx, 2.8, -6.6, 1.6, 0.3, '#8a3a90');
    const r = P.rng(33);
    for (let i = 0; i < 10; i++) dot(ctx, -9 + r() * 18, -5.4 + r() * 5, 0.32, '#1a1010');
  }

  function samsaShape(ctx, s) {
    roundPoly(ctx, [[-14 * s, 8.5 * s], [14 * s, 8.5 * s], [0, -12.5 * s]], 3.4 * s);
  }

  function samsa(ctx) {
    shadowUnder(ctx, 0, 10.4, 14, 2.6);
    ctx.save(); ctx.translate(0, 1.4);
    samsaShape(ctx, 1);
    ctx.fillStyle = '#a95c1c'; ctx.fill();
    ctx.restore();
    samsaShape(ctx, 1);
    ctx.fillStyle = grad(ctx, -6, -12, 6, 9, ['#fbe08e', '#f2b454', '#d98530', '#b9661e']);
    ctx.fill();
    ctx.save();
    samsaShape(ctx, 1);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,248,214,0.55)';
    ctx.beginPath(); ctx.moveTo(-1.4, -10); ctx.quadraticCurveTo(-8.5, 1, -10.5, 6.4); ctx.quadraticCurveTo(-5, 2, -0.2, -6.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(120,52,6,0.28)';
    ctx.beginPath(); ctx.moveTo(1.8, -9); ctx.quadraticCurveTo(9, 2, 12, 8.5); ctx.lineTo(3, 8.5); ctx.quadraticCurveTo(5, 0, 1.8, -9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(150,70,10,0.35)'; ctx.fillRect(-15, 6.2, 30, 3);
    ctx.restore();
    samsaShape(ctx, 1);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.15; ctx.stroke();
    ctx.strokeStyle = '#a8601e'; ctx.lineWidth = 0.7;
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const lx = -12.4 + (0 + 12.4) * t, ly = 7.4 + (-10.6 - 7.4) * t;
      const rx = 12.4 - 12.4 * t;
      ctx.beginPath(); ctx.moveTo(lx + 0.4, ly + 0.4); ctx.lineTo(lx + 1.8, ly + 1.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx - 0.4, ly + 0.4); ctx.lineTo(rx - 1.8, ly + 1.1); ctx.stroke();
    }
    const r = P.rng(21);
    for (let i = 0; i < 16; i++) {
      const v = r(), u = (r() * 2 - 1) * (1 - v) * 0.7;
      const x = u * 12, y = 5 - v * 13;
      if (r() < 0.78) seed(ctx, x, y, r() * Math.PI, 0.75, '#fff6dc');
      else dot(ctx, x, y, 0.42, '#231612');
    }
  }

  function non(ctx) {
    shadowUnder(ctx, 0, 10, 15.5, 3);
    ell(ctx, 0, 3.4, 15.4, 8.2, '#8c4a1a', INK, 1.1);
    ell(ctx, 0, 1.4, 15.4, 8.2, radial(ctx, -4, -2.5, 17, ['#fbd184', '#e8a24c', '#cc7c34', '#a95e22']), INK, 1.1);
    ctx.strokeStyle = 'rgba(255,232,170,0.85)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(0, 1.4, 13.2, 6.5, 0, Math.PI * 1.08, Math.PI * 1.62); ctx.stroke();
    ell(ctx, 0, 2, 9, 4.7, grad(ctx, 0, -2.5, 0, 6.5, ['#f0cd8c', '#f6e0ae', '#e7bf7a']), '#a8682a', 0.8);
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; dot(ctx, Math.cos(a) * 6.6, 2 + Math.sin(a) * 3.35, 0.5, '#8e4c1a'); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ell(ctx, Math.cos(a) * 2.8, 2 + Math.sin(a) * 1.45, 0.9, 0.5, '#9a5620', null); }
    dot(ctx, 0, 2, 0.8, '#7a3a12');
    const r = P.rng(12);
    for (let i = 0; i < 16; i++) {
      const a = r() * TAU, d = Math.sqrt(r());
      const x = Math.cos(a) * d * 7.6, y = 2 + Math.sin(a) * d * 3.9;
      if (r() < 0.6) seed(ctx, x, y, r() * Math.PI, 0.6, '#fff5dc');
      else dot(ctx, x, y, 0.36, '#241612');
    }
  }

  function choynak(ctx, green) {
    const body = green ? ['#ffffff', '#f3f1ea', '#c9ccd6'] : ['#c4623e', '#8a2c18', '#521409'];
    const lid = green ? '#f5f3ec' : '#7a2412';
    ctx.beginPath(); ctx.moveTo(5.8, 1.6); ctx.quadraticCurveTo(11.6, -1.2, 12.8, -8.6); ctx.lineTo(10.6, -9); ctx.quadraticCurveTo(9.8, -3, 5.2, -2.6); ctx.closePath();
    finish(ctx, grad(ctx, 5, -9, 13, 0, [body[0], body[1], body[2]]), INK, 1);
    ell(ctx, 11.7, -8.8, 1.3, 0.6, green ? COBALT : GOLD, INK, 0.6);
    ctx.beginPath(); ctx.moveTo(-7.4, -4.6); ctx.bezierCurveTo(-14.4, -6, -14.4, 5.2, -7.8, 3.4);
    ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke();
    ctx.strokeStyle = green ? '#f3f1ea' : '#8a2c18'; ctx.lineWidth = 1.7; ctx.stroke();
    ell(ctx, 0, 7.4, 5.4, 1.6, green ? '#d8dbe2' : '#4a1208', INK, 0.9);
    ctx.beginPath(); ctx.ellipse(0, -0.4, 9.2, 8.2, 0, 0, TAU);
    ctx.fillStyle = grad(ctx, -9, -6, 9, 6, body); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = green ? COBALT : GOLD; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-9.5, -2.2); ctx.quadraticCurveTo(0, 1.8, 9.5, -2.2); ctx.stroke();
    if (green) { pakhta(ctx, -3.4, 3.4, 4.6); pakhta(ctx, 4.4, 2.6, 3.6); pakhta(ctx, -7.8, -4.6, 2.6, TURQ); }
    else {
      ctx.fillStyle = GOLD;
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(-7.2 + i * 2.4, 3.6 + Math.abs(i - 3) * 0.35, 0.5, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(232,192,96,0.8)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(-8.6, 5.6); ctx.quadraticCurveTo(0, 8.6, 8.6, 5.6); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(-4.4, -3.4, 1.6, 3.2, 0.35, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, -0.4, 9.2, 8.2, 0, 0, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.stroke();
    ell(ctx, 0, -7.6, 4.8, 1.7, lid, INK, 0.9);
    ctx.beginPath(); ctx.ellipse(0, -7.8, 3.6, 2.6, 0, Math.PI, TAU); ctx.closePath();
    finish(ctx, grad(ctx, -3, -10, 3, -8, [green ? '#ffffff' : '#b04a2c', lid]), INK, 0.9);
    ell(ctx, 0, -10.8, 1.4, 1.2, green ? COBALT : GOLD, INK, 0.7);
    if (green) leaf(ctx, 2.6, -11.4, 2.1, -0.5, '#4aa03a');
  }

  function pialaCup(ctx, x, y, s, liquid) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ell(ctx, 0, 3.4, 2.6, 0.9, '#d8d2c4', INK, 0.7);
    ctx.beginPath(); ctx.moveTo(-6, -3); ctx.bezierCurveTo(-5.8, 1.6, -3.2, 3.4, 0, 3.4); ctx.bezierCurveTo(3.2, 3.4, 5.8, 1.6, 6, -3); ctx.closePath();
    finish(ctx, grad(ctx, -6, 0, 6, 0, ['#ffffff', '#f2eee4', '#cfc8b8']), INK, 0.9);
    ctx.save(); ctx.clip(); pakhta(ctx, -1.6, 0.6, 3); ctx.strokeStyle = COBALT; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-6, -1.6); ctx.quadraticCurveTo(0, 0.4, 6, -1.6); ctx.stroke(); ctx.restore();
    ell(ctx, 0, -3, 6, 1.7, '#fbf8f0', INK, 0.8);
    ell(ctx, 0, -2.8, 4.9, 1.15, liquid, null);
    ell(ctx, -1.6, -3.1, 1.6, 0.35, 'rgba(255,255,255,0.55)', null);
    ctx.restore();
  }

  function steamWisp(ctx, x, y, h, a) {
    ctx.strokeStyle = 'rgba(255,255,255,' + (a || 0.85) + ')'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x - 2, y - h * 0.3, x + 2, y - h * 0.6, x, y - h); ctx.stroke();
  }

  function tea(ctx, green) {
    shadowUnder(ctx, -1, 11.6, 13, 2.4);
    ctx.save(); ctx.translate(-3.2, 2.6); ctx.scale(0.9, 0.9); choynak(ctx, green); ctx.restore();
    pialaCup(ctx, 9.6, 7.6, 0.82, green ? '#cdbb4a' : '#a8401a');
    steamWisp(ctx, 8.4, 3.6, 5.2, 0.9);
  }

  function jugPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(-7, -12.2);
    ctx.quadraticCurveTo(-5.8, -9.4, -6.2, -7.4);
    ctx.bezierCurveTo(-11.4, -2.4, -11.6, 9, -8.4, 11);
    ctx.lineTo(8.4, 11);
    ctx.bezierCurveTo(11.6, 9, 11.4, -2.4, 6.2, -7.4);
    ctx.quadraticCurveTo(5.8, -9.4, 7.4, -12.2);
    ctx.closePath();
  }

  function compote(ctx) {
    shadowUnder(ctx, 0, 11.8, 11, 2.2);
    ctx.beginPath(); ctx.moveTo(-6.6, -8.4); ctx.bezierCurveTo(-15, -9, -15.6, 4.6, -9.6, 5.4);
    ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke();
    ctx.strokeStyle = '#e4f2f6'; ctx.lineWidth = 1.7; ctx.stroke();
    jugPath(ctx);
    ctx.fillStyle = 'rgba(224,242,248,0.75)'; ctx.fill();
    ctx.save();
    jugPath(ctx);
    ctx.clip();
    ctx.fillStyle = grad(ctx, 0, -5, 0, 11, ['#f06a82', '#d63656', '#9e1a3a']);
    ctx.fillRect(-12, -4.6, 24, 17);
    ell(ctx, 0, -4.6, 9.4, 1.6, '#f792a4', null);
    ell(ctx, -3.8, 4.4, 2.8, 2.5, '#f39a2a', '#9a4a0a', 0.6);
    ell(ctx, -3.6, 4.2, 1.4, 1.2, '#ffc862', null);
    ell(ctx, 4.2, 0.6, 2.6, 2.3, '#f3a032', '#9a4a0a', 0.6);
    ell(ctx, 4.4, 0.4, 1.2, 1.1, '#ffcc6a', null);
    ell(ctx, 2.8, 7.4, 1.8, 1.8, '#6e0c20', '#3a0610', 0.5);
    dot(ctx, 2.3, 6.9, 0.5, 'rgba(255,255,255,0.8)');
    ell(ctx, -0.8, -1.4, 1.7, 1.7, '#7e1426', '#3a0610', 0.5);
    dot(ctx, -1.3, -1.9, 0.45, 'rgba(255,255,255,0.8)');
    ell(ctx, 6.8, 7.2, 1.5, 1.5, '#7e1426', '#3a0610', 0.5);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.moveTo(-7.4, -6); ctx.quadraticCurveTo(-9.6, 2, -7.2, 9); ctx.lineTo(-5.8, 9); ctx.quadraticCurveTo(-8, 2, -5.8, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(6.4, -2, 1, 7);
    ctx.restore();
    jugPath(ctx);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0.2, -12.2, 7.2, 1.7, 0, 0, TAU); ctx.fillStyle = 'rgba(236,248,252,0.9)'; ctx.fill(); ctx.stroke();
    poly(ctx, [[6.2, -13.2], [10.4, -14.2], [7.6, -11]], '#e4f2f6', INK, 0.9);
  }

  function carrotWhole(ctx, x, y, len, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(0, -len * 0.16); ctx.quadraticCurveTo(len * 0.75, -len * 0.1, len, 0); ctx.quadraticCurveTo(len * 0.75, len * 0.1, 0, len * 0.16); ctx.closePath();
    finish(ctx, grad(ctx, 0, -len * 0.16, 0, len * 0.16, ['#ffb04a', '#f07a1c', '#c2520c']), INK, 0.8);
    ctx.strokeStyle = 'rgba(150,60,8,0.6)'; ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(len * i * 0.22, -len * 0.1); ctx.lineTo(len * i * 0.22 + 1, len * 0.02); ctx.stroke(); }
    ctx.fillStyle = '#3f9a2e';
    for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(0, k * len * 0.05); ctx.quadraticCurveTo(-len * 0.3, k * len * 0.2 - len * 0.05, -len * 0.42, k * len * 0.28); ctx.quadraticCurveTo(-len * 0.24, k * len * 0.1, 0, k * len * 0.05 + len * 0.04); ctx.fill(); }
    ctx.restore();
  }

  function onionHalf(ctx, x, y, r) {
    ell(ctx, x, y, r, r * 0.8, '#f4e6f0', INK, 0.7);
    ctx.strokeStyle = '#c29ad0'; ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x, y + r * 0.1, r * i / 4, r * 0.72 * i / 4, 0, 0, TAU); ctx.stroke(); }
  }

  function veg(ctx) {
    shadowUnder(ctx, 0, 11.8, 12, 2.4);
    bowlBody(ctx, 13.8, 0, 11, 6);
    finish(ctx, grad(ctx, -13, 0, 13, 0, ['#e0a060', '#c07a3a', '#8a4e20']), INK, 1.1);
    ctx.save(); bowlBody(ctx, 13.8, 0, 11, 6); ctx.clip();
    ctx.strokeStyle = 'rgba(90,40,10,0.35)'; ctx.lineWidth = 0.6;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-14, 2.4 + i * 2.2); ctx.quadraticCurveTo(0, 5 + i * 2.2, 14, 2.4 + i * 2.2); ctx.stroke(); }
    ctx.restore();
    ell(ctx, 0, 0, 13.8, 4, '#d69a5c', INK, 1.1);
    ell(ctx, 0, 0.3, 12, 3, '#7a4418', null);
    carrotWhole(ctx, 5.4, -3.8, 11.5, -0.62);
    ctx.save();
    ctx.beginPath(); ctx.rect(-16, -16, 32, 15.8); ctx.ellipse(0, 0.3, 12, 3, 0, 0, Math.PI); ctx.clip();
    const r = P.rng(8);
    ctx.lineCap = 'round';
    for (let i = 0; i < 34; i++) {
      const u = r() * 2 - 1, x = u * 10.5, y = 0.6 - r() * (5.4 - Math.abs(u) * 3.4), a = -0.5 + r() * 1.3, l = 2.4;
      const col = r() < 0.62 ? '#f07418' : '#f7b92e';
      ctx.strokeStyle = '#9a3e08'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 0.9; ctx.stroke();
    }
    ctx.restore();
    onionRing(ctx, -6, -3.2, 2.6, 0.3);
    onionRing(ctx, 0.4, -4.6, 2.4, -0.2);
    onionHalf(ctx, -10.2, -2.6, 2.8);
  }

  function plovFood(ctx) {
    shadowUnder(ctx, 0, 13.4, 15, 2.6);
    plate(ctx, 0, 6.6, 15.6, 6.6);
    plovHeap(ctx, 0, 7.4, 11.6, 16.5, 71, true);
  }

  const FOOD_DRAW = {
    plov: plovFood, achichuk, samsa, non, teaBlack: ctx => tea(ctx, false), teaGreen: ctx => tea(ctx, true), compote, veg
  };
  const FOOD_BASE = { plov: 13, achichuk: 12.6, samsa: 10, non: 11, teaBlack: 11.6, teaGreen: 11.6, compote: 11.6, veg: 11.6 };

  function sprite(key, px, draw, box) {
    const b = box || 32;
    return A.cached('ic|' + key + '|' + px, () => {
      const w = Math.ceil(px * 1.25);
      const c = O.canvas(w * K, w * K);
      const ctx = c.getContext('2d');
      ctx.scale(K, K);
      ctx.translate(w / 2, w / 2);
      ctx.scale(px / b, px / b);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      draw(ctx);
      return { c, w, h: w };
    });
  }

  function put(ctx, s, x, y) { ctx.drawImage(s.c, x - s.w / 2, y - s.h / 2, s.w, s.h); }

  function food(ctx, id, x, y, px) {
    const d = FOOD_DRAW[id];
    if (!d) return;
    put(ctx, sprite('f:' + id, Math.round(px), d), x, y);
  }

  function foodAt(ctx, id, x, y, px) {
    const b = FOOD_BASE[id] || 12;
    food(ctx, id, x, y - b * px / 32, px);
  }

  const LEFTOVER_DRAW = { plov: plovEaten, achichuk: bowlEaten, samsa: crumbs, non: crumbs };

  function leftoverAt(ctx, id, x, y, px) {
    const d = LEFTOVER_DRAW[id];
    if (!d) { foodAt(ctx, id, x, y, px); return; }
    const b = FOOD_BASE[id] || 12;
    put(ctx, sprite('l:' + id, Math.round(px), d), x, y - b * px / 32);
  }

  function hand(ctx) {
    ctx.save(); ctx.rotate(0.12);
    rrect(ctx, -5.2, 7.5, 10.4, 6, 1.5, '#2d5fb8', INK, 1);
    ctx.fillStyle = '#6a9ae0'; ctx.fillRect(-4.4, 8.4, 8.8, 1.2);
    const skin = '#f2c79c', sh = '#d69a6c';
    const finger = (x, y, h, a) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); rrect(ctx, -1.9, -h, 3.8, h + 2, 1.9, skin, INK, 1); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-1.1, -h + 1.2, 0.9, h * 0.6); ctx.restore(); };
    finger(-4.6, -3, 7.5, -0.18); finger(-1.5, -4.2, 9.6, -0.05); finger(1.7, -4, 9.2, 0.07); finger(4.6, -2.6, 7.2, 0.2);
    ctx.beginPath(); ctx.moveTo(-6.2, -3); ctx.quadraticCurveTo(-6.8, 5, -4.5, 8.2); ctx.lineTo(4.8, 8.2); ctx.quadraticCurveTo(7, 4, 6.4, -2.6); ctx.quadraticCurveTo(0, -1.4, -6.2, -3); ctx.closePath();
    finish(ctx, grad(ctx, -6, 0, 6, 0, [skin, skin, sh]), INK, 1);
    ctx.save(); ctx.translate(6.2, 1.8); ctx.rotate(0.9); rrect(ctx, -1.9, -6.8, 3.8, 8, 1.9, skin, INK, 1); ctx.restore();
    ctx.strokeStyle = sh; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-3, 3.4); ctx.quadraticCurveTo(0, 5, 3, 3); ctx.stroke();
    ctx.restore();
  }

  function coinDisc(ctx, x, y, r) {
    ell(ctx, x, y + r * 0.2, r, r * 0.95, '#a86a10', INK, 0.9);
    ell(ctx, x, y, r, r * 0.95, radial(ctx, x - r * 0.35, y - r * 0.4, r * 1.5, ['#fff3a8', '#f5c63a', '#d0901a']), INK, 0.9);
    ell(ctx, x, y, r * 0.7, r * 0.66, null, '#b87a14', Math.max(0.5, r * 0.1));
    ctx.fillStyle = '#b87a14';
    O.star8(ctx, x, y, r * 0.36); ctx.fill();
    ell(ctx, x - r * 0.42, y - r * 0.42, r * 0.2, r * 0.14, 'rgba(255,255,255,0.85)', null);
  }

  function coins(ctx) {
    for (let i = 0; i < 4; i++) {
      ell(ctx, -4, 9 - i * 2.6, 8, 3.2, '#a86a10', INK, 0.9);
      ell(ctx, -4, 8 - i * 2.6, 8, 3.2, '#f2bf36', INK, 0.9);
    }
    ell(ctx, -4, 0.2, 5.6, 2, null, '#c88a18', 0.8);
    coinDisc(ctx, 6, 2.6, 7.4);
  }

  function broom(ctx) {
    ctx.save(); ctx.rotate(-0.55);
    ctx.beginPath(); ctx.moveTo(-2.2, -14); ctx.lineTo(2.2, -14); ctx.lineTo(3, -2); ctx.lineTo(-3, -2); ctx.closePath();
    finish(ctx, grad(ctx, -3, 0, 3, 0, ['#e8c878', '#c8a050', '#9a7430']), INK, 1);
    ctx.beginPath(); ctx.moveTo(-3, -2.5); ctx.lineTo(3, -2.5); ctx.lineTo(8.5, 13); ctx.quadraticCurveTo(0, 15.5, -8.5, 13); ctx.closePath();
    finish(ctx, grad(ctx, -8, 0, 8, 0, ['#f6dc8a', '#e2bc5a', '#b88e36']), INK, 1.1);
    ctx.strokeStyle = 'rgba(120,80,20,0.6)'; ctx.lineWidth = 0.6;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 0.8, -1.5); ctx.lineTo(i * 2.6, 13.4); ctx.stroke(); }
    rrect(ctx, -3.6, -4.2, 7.2, 2.6, 1, '#d8283a', INK, 0.8);
    rrect(ctx, -3, -9.6, 6, 2.2, 1, '#d8283a', INK, 0.8);
    ctx.restore();
  }

  function meatChunk(ctx, cx, cy, rx, ry, sd) {
    blob(ctx, cx, cy, rx, ry, sd, 0.34);
    finish(ctx, radial(ctx, cx - rx * 0.4, cy - ry * 0.5, rx * 2, ['#e2685a', '#b83a2e', '#861e18', '#5a1010']), INK, 1.1);
    ctx.save();
    blob(ctx, cx, cy, rx, ry, sd, 0.34);
    ctx.clip();
    const r = P.rng(sd + 3);
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const y = cy - ry * 0.5 + i * ry * 0.5 + (r() - 0.5) * ry * 0.3;
      ctx.strokeStyle = '#fbeee6'; ctx.lineWidth = ry * 0.16;
      ctx.beginPath(); ctx.moveTo(cx - rx, y); ctx.bezierCurveTo(cx - rx * 0.3, y - ry * 0.3, cx + rx * 0.2, y + ry * 0.3, cx + rx, y - ry * 0.1); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(40,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(cx + rx * 0.5, cy + ry * 0.4, rx * 0.6, ry * 0.5, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ell(ctx, cx - rx * 0.38, cy - ry * 0.46, rx * 0.2, ry * 0.12, 'rgba(255,230,220,0.75)', null);
  }

  function meatGlyph(ctx) {
    shadowUnder(ctx, 0, 11, 13, 2.4);
    ctx.save(); ctx.translate(7, -4); ctx.rotate(0.5);
    rrect(ctx, -2, -11, 4, 15, 2, '#f6eedc', INK, 1);
    ell(ctx, -1.7, -11.4, 2.2, 2, '#f6eedc', INK, 1);
    ell(ctx, 1.7, -11.4, 2.2, 2, '#f6eedc', INK, 1);
    ctx.fillStyle = '#f6eedc'; ctx.fillRect(-1.9, -11.6, 3.8, 3);
    ctx.restore();
    meatChunk(ctx, 2, 1.5, 11, 8.5, 9);
    meatChunk(ctx, -7, 6, 7, 5.4, 4);
  }

  function dough(ctx) {
    shadowUnder(ctx, 0, 10.4, 13, 2.4);
    samsaShape(ctx, 0.92);
    finish(ctx, grad(ctx, 0, -12, 0, 9, ['#fffaf0', '#f4e8cc', '#dcc79a']), INK, 1.1);
    ctx.strokeStyle = '#c8b080'; ctx.lineWidth = 0.7;
    for (let i = 1; i < 6; i++) { const t = i / 6, x = -11.8 + 11.8 * t, y = 7 - 17.6 * t; ctx.beginPath(); ctx.moveTo(x + 0.4, y + 0.4); ctx.lineTo(x + 1.7, y + 1.1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-x - 0.4, y + 0.4); ctx.lineTo(-x - 1.7, y + 1.1); ctx.stroke(); }
    const r = P.rng(2);
    for (let i = 0; i < 12; i++) dot(ctx, -9 + r() * 18, 9 - r() * 4, 0.5, 'rgba(255,255,255,0.9)');
  }

  function knifeShape(ctx, len) {
    const L = len || 1;
    ctx.beginPath(); ctx.moveTo(0, -4.2 * L); ctx.lineTo(28 * L, -4.6 * L); ctx.quadraticCurveTo(36 * L, -4.4 * L, 39 * L, -2.4 * L); ctx.quadraticCurveTo(30 * L, 6.2 * L, 12 * L, 5 * L); ctx.lineTo(0, 4.2 * L); ctx.closePath();
  }

  function pchakKnife(ctx) {
    knifeShape(ctx);
    finish(ctx, grad(ctx, 0, -5, 0, 5, ['#ffffff', '#d8dde4', '#9aa4b0', '#e6eaee']), INK, 1.2);
    ctx.strokeStyle = 'rgba(110,120,136,0.7)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(1, 1.4); ctx.quadraticCurveTo(26, 3.2, 37.4, -2.2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(2, -3.4, 22, 0.9);
    ctx.fillStyle = '#b89030';
    ctx.beginPath(); ctx.arc(7, -0.6, 1.6, 0.6, Math.PI * 1.6); ctx.arc(7.6, -0.9, 1.2, Math.PI * 1.6, 0.6, true); ctx.fill();
    O.star8(ctx, 9.6, -1, 0.9); ctx.fill();
    rrect(ctx, -6, -5.2, 6.4, 10.4, 1.2, grad(ctx, 0, -5, 0, 5, ['#fff2b0', '#d8a838', '#8a6414']), INK, 1);
    ctx.strokeStyle = 'rgba(90,60,10,0.6)'; ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-5 + i * 2, -4.6); ctx.lineTo(-5 + i * 2, 4.6); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-6, -4.6); ctx.lineTo(-25, -5); ctx.quadraticCurveTo(-31.5, -5.4, -33, -1.6); ctx.quadraticCurveTo(-33.4, 3.8, -27.4, 4.6); ctx.lineTo(-6, 4.6); ctx.closePath();
    finish(ctx, grad(ctx, 0, -5, 0, 5, ['#fbf4e2', '#eadcbc', '#b8a47e']), INK, 1.2);
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#c8282e'; ctx.fillRect(-12, -6, 2.4, 12); ctx.fillRect(-22, -6, 2.4, 12);
    ctx.fillStyle = '#2a8a4a'; ctx.fillRect(-17.4, -6, 2.2, 12);
    ctx.fillStyle = '#1a1a22'; ctx.fillRect(-9.2, -6, 0.9, 12); ctx.fillRect(-19.2, -6, 0.9, 12);
    ctx.restore();
    for (const x of [-14.2, -24.4]) { dot(ctx, x, -0.2, 1.1, '#d8a838'); dot(ctx, x - 0.3, -0.5, 0.4, '#fff4c0'); }
  }

  function knifeGlyph(ctx) { ctx.save(); ctx.rotate(-0.55); ctx.translate(-2, 0); ctx.scale(0.44, 0.44); pchakKnife(ctx); ctx.restore(); }

  function kapkir(ctx) {
    ctx.save(); ctx.rotate(-0.75);
    limb(ctx, [[-2, 0], [18, 0]], 2.6, '#a8763e');
    ell(ctx, 18.5, 0, 1.6, 1.8, '#c8a060', INK, 0.8);
    ell(ctx, -8, 0, 7.4, 6.6, grad(ctx, -14, -6, -2, 6, ['#f2f4f6', '#b8c0c8', '#7a8490']), INK, 1.1);
    ctx.fillStyle = '#4a525c';
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; dot(ctx, -8 + Math.cos(a) * 4, Math.sin(a) * 3.6, 0.8, '#4a525c'); }
    dot(ctx, -8, 0, 0.8, '#4a525c');
    ctx.restore();
  }

  function notepad(ctx) {
    ctx.save(); ctx.rotate(-0.1);
    rrect(ctx, -10, -12, 18, 24, 1.6, grad(ctx, 0, -12, 0, 12, ['#fffdf4', '#f0e6cc']), INK, 1.1);
    ctx.strokeStyle = '#8ab0d8'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-7.4, -4 + i * 3.6); ctx.lineTo(5.4, -4 + i * 3.6); ctx.stroke(); }
    ctx.strokeStyle = '#3a4a8a'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-6.6, -5); ctx.lineTo(-2, -5.4); ctx.lineTo(1, -4.6); ctx.moveTo(-6.6, -1.4); ctx.lineTo(3, -1.8); ctx.moveTo(-6.6, 2.2); ctx.lineTo(-1, 2); ctx.stroke();
    for (let i = 0; i < 4; i++) { ell(ctx, -6 + i * 4.2, -12, 1.3, 1.9, null, '#6a6a74', 1); }
    rrect(ctx, -10, -13.2, 18, 3, 1, '#c8322a', INK, 0.8);
    ctx.restore();
    ctx.save(); ctx.translate(8, 2); ctx.rotate(-0.9);
    rrect(ctx, -2, -12, 4, 18, 0.8, '#f2c230', INK, 0.9);
    ctx.fillStyle = '#e88aa0'; ctx.fillRect(-1.6, -12, 3.2, 3);
    poly(ctx, [[-2, 6], [2, 6], [0, 11]], '#f0d8b0', INK, 0.8);
    dot(ctx, 0, 10, 0.7, '#2a2a2a');
    ctx.restore();
  }

  function cloth(ctx) {
    ctx.save(); ctx.rotate(-0.2);
    ctx.beginPath(); ctx.moveTo(-12, -6); ctx.quadraticCurveTo(-2, -10, 12, -6); ctx.quadraticCurveTo(14, 2, 10, 9); ctx.quadraticCurveTo(0, 12, -11, 9); ctx.quadraticCurveTo(-14, 2, -12, -6); ctx.closePath();
    finish(ctx, '#f4f6fa', INK, 1.1);
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(45,86,200,0.55)';
    for (let i = -14; i < 14; i += 5) { ctx.fillRect(i, -12, 2.2, 26); ctx.fillRect(-14, i, 28, 2.2); }
    ctx.fillStyle = 'rgba(0,0,40,0.15)';
    ctx.beginPath(); ctx.moveTo(-12, 3); ctx.quadraticCurveTo(0, 0, 13, 4); ctx.lineTo(13, 12); ctx.lineTo(-12, 12); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(60,60,90,0.5)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-10, 2.6); ctx.quadraticCurveTo(0, -0.4, 12, 3.4); ctx.stroke();
    ctx.restore();
    for (const [x, y] of [[11, -10], [-12, -11], [13, 10]]) { ctx.fillStyle = '#fffbe0'; O.star8(ctx, x, y, 2.2); ctx.fill(); }
  }

  function plateStack(ctx) {
    for (let i = 0; i < 3; i++) { ell(ctx, 0, 8 - i * 3.4, 13 - i * 0.6, 4, '#e8e2d2', INK, 0.9); ell(ctx, 0, 7.4 - i * 3.4, 10 - i * 0.6, 2.8, '#f8f5ec', null); }
    ctx.fillStyle = '#d8a050'; for (let i = 0; i < 6; i++) ctx.fillRect(-6 + i * 2.2, -0.4 + (i % 2), 1.2, 0.8);
    ctx.fillStyle = '#e8641c'; ctx.fillRect(3, -1, 1.8, 0.8);
  }

  function sweat(ctx) {
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(9, 2, 5, 8); ctx.quadraticCurveTo(0, 13, -5, 8); ctx.quadraticCurveTo(-9, 2, 0, -12); ctx.closePath();
    finish(ctx, grad(ctx, 0, -12, 0, 12, ['#e8f6ff', '#8ccaf6', '#3a8ad0']), '#1f5a9a', 1.2);
    ell(ctx, -2.4, 3, 1.4, 2.6, 'rgba(255,255,255,0.85)', null);
  }

  function anger(ctx) {
    ctx.strokeStyle = '#6a0a0a'; ctx.lineWidth = 5.6; ctx.lineCap = 'round';
    const arms = () => { for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(sx * 2.4, sy * 9); ctx.quadraticCurveTo(sx * 2, sy * 2, sx * 9, sy * 2.4); ctx.stroke(); } };
    arms();
    ctx.strokeStyle = '#ff3a2a'; ctx.lineWidth = 3.2;
    arms();
  }

  function sparkle(ctx) {
    ctx.fillStyle = '#fff4a0';
    ctx.strokeStyle = '#c8901a'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(1.6, -1.6, 12, 0); ctx.quadraticCurveTo(1.6, 1.6, 0, 12); ctx.quadraticCurveTo(-1.6, 1.6, -12, 0); ctx.quadraticCurveTo(-1.6, -1.6, 0, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -9); ctx.quadraticCurveTo(8.6, -7.6, 10, -7); ctx.quadraticCurveTo(8.6, -6.4, 8, -5); ctx.quadraticCurveTo(7.4, -6.4, 6, -7); ctx.quadraticCurveTo(7.4, -7.6, 8, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  function riceGlyph(ctx) {
    shadowUnder(ctx, 0, 12, 12, 2.4);
    ctx.beginPath(); ctx.moveTo(-10, -2); ctx.quadraticCurveTo(-12.5, 8, -9, 11.5); ctx.lineTo(9, 11.5); ctx.quadraticCurveTo(12.5, 8, 10, -2); ctx.closePath();
    finish(ctx, grad(ctx, -12, 0, 12, 0, ['#e6cfa0', '#cfae78', '#a08050']), INK, 1.1);
    ctx.strokeStyle = 'rgba(120,90,50,0.45)'; ctx.lineWidth = 0.6;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-10, 2 + i * 2.6); ctx.lineTo(10, 2 + i * 2.6); ctx.stroke(); }
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-8 + i * 3.2, -1); ctx.lineTo(-8 + i * 3.2, 11); ctx.stroke(); }
    ell(ctx, 0, -2, 10.4, 3.4, '#8a6a3a', INK, 1);
    ctx.beginPath(); ctx.ellipse(0, -2.4, 9, 7.4, 0, Math.PI, TAU); ctx.closePath();
    finish(ctx, radial(ctx, -3, -6, 11, ['#ffffff', '#f4eee0', '#d8cfb8']), INK, 1);
    const r = P.rng(4);
    for (let i = 0; i < 26; i++) { const a = Math.PI + r() * Math.PI, d = r(); seed(ctx, Math.cos(a) * d * 8, -2.6 + Math.sin(a) * d * 6.6, r() * Math.PI, 0.9, r() < 0.8 ? '#c8bfa8' : '#b88a3a'); }
    rrect(ctx, -6.2, 3.4, 12.4, 5.4, 1, '#f6ecd0', '#8a6a3a', 0.6);
    ctx.fillStyle = '#6a4a2a'; ctx.font = 'bold 4.4px Tahoma, Verdana, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('РИС', 0, 6.3);
    ctx.textBaseline = 'alphabetic';
  }

  function briefcase(ctx) {
    shadowUnder(ctx, 0, 11, 13, 2.2);
    rrect(ctx, -5, -10.5, 10, 6, 2.4, null, INK, 3.2);
    rrect(ctx, -5, -10.5, 10, 6, 2.4, null, '#6a3a1c', 1.6);
    rrect(ctx, -13, -6, 26, 16, 2.6, grad(ctx, 0, -6, 0, 10, ['#b0703a', '#8a4e22', '#5e3012']), INK, 1.1);
    ctx.fillStyle = 'rgba(40,16,4,0.35)'; ctx.fillRect(-12.2, -0.6, 24.4, 1.2);
    rrect(ctx, -2.8, -2.2, 5.6, 4, 1, GOLD, INK, 0.7);
    rrect(ctx, -10.2, -5.2, 2.4, 3.2, 0.6, '#d8b060', INK, 0.5);
    rrect(ctx, 7.8, -5.2, 2.4, 3.2, 0.6, '#d8b060', INK, 0.5);
    ctx.fillStyle = 'rgba(255,230,190,0.35)'; ctx.fillRect(-11.5, -4.6, 23, 1.2);
  }

  function guests(ctx) {
    const head = (x, y, s, skin, cap) => {
      ctx.beginPath(); ctx.moveTo(x - 8 * s, y + 14 * s); ctx.quadraticCurveTo(x - 8 * s, y + 5 * s, x, y + 5 * s); ctx.quadraticCurveTo(x + 8 * s, y + 5 * s, x + 8 * s, y + 14 * s); ctx.closePath();
      finish(ctx, cap === 'doppi' ? '#3a6ab8' : '#c8384a', INK, 1);
      ell(ctx, x, y, 5.6 * s, 5.8 * s, skin, INK, 1);
      if (cap === 'doppi') {
        poly(ctx, [[x - 5.4 * s, y - 2.4 * s], [x - 4.6 * s, y - 6.8 * s], [x + 4.6 * s, y - 6.8 * s], [x + 5.4 * s, y - 2.4 * s]], '#16161a', INK, 0.9);
        ctx.strokeStyle = '#f4f0e6'; ctx.lineWidth = 0.7 * s;
        ctx.beginPath(); ctx.moveTo(x - 2.8 * s, y - 3 * s); ctx.quadraticCurveTo(x - 1.6 * s, y - 6.4 * s, x, y - 3.4 * s); ctx.moveTo(x + 0.4 * s, y - 3 * s); ctx.quadraticCurveTo(x + 1.8 * s, y - 6.4 * s, x + 3.2 * s, y - 3.4 * s); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(x - 6.4 * s, y + 2 * s); ctx.quadraticCurveTo(x - 7 * s, y - 7.6 * s, x, y - 7.2 * s); ctx.quadraticCurveTo(x + 7 * s, y - 7.6 * s, x + 6.4 * s, y + 2 * s); ctx.quadraticCurveTo(x + 5 * s, y - 3.6 * s, x, y - 4 * s); ctx.quadraticCurveTo(x - 5 * s, y - 3.6 * s, x - 6.4 * s, y + 2 * s); ctx.closePath();
        finish(ctx, '#e8a020', INK, 0.9);
      }
      dot(ctx, x - 1.9 * s, y + 0.4 * s, 0.7 * s, INK); dot(ctx, x + 1.9 * s, y + 0.4 * s, 0.7 * s, INK);
    };
    head(5, -3, 0.9, '#e8b88e', 'scarf');
    head(-4.5, -1, 1, '#c68a5c', 'doppi');
  }

  function doira(ctx) {
    ell(ctx, 0, 1.4, 13, 12.6, '#6a3a18', INK, 1.1);
    ell(ctx, 0, 0, 13, 12.6, grad(ctx, -12, -12, 12, 12, ['#d8a060', '#a8682e', '#7a4418']), INK, 1.1);
    ell(ctx, 0, 0, 10.4, 10, radial(ctx, -3, -3, 13, ['#fff6dc', '#f2dcae', '#d8b880']), INK, 0.9);
    ctx.strokeStyle = 'rgba(160,100,40,0.5)'; ctx.lineWidth = 0.7;
    O.star8(ctx, 0, 0, 5.4); ctx.stroke();
    ell(ctx, 0, 0, 2, 2, '#c8382a', null);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; ell(ctx, Math.cos(a) * 11.8, Math.sin(a) * 11.4, 1.5, 1.5, '#e8e2d0', INK, 0.5); }
  }

  function footprints(ctx) {
    const foot = (x, y, a) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ell(ctx, 0, 0, 2.6, 4.4, 'rgba(255,230,160,0.95)', INK, 0.8); ell(ctx, 0, -6.2, 2, 1.8, 'rgba(255,230,160,0.95)', INK, 0.8); ctx.restore(); };
    foot(-4, 5, -0.2); foot(4, -3, 0.2);
  }

  function kazanMini(ctx) {
    ctx.beginPath(); ctx.moveTo(-13, -3); ctx.bezierCurveTo(-12.4, 8, -6, 11, 0, 11); ctx.bezierCurveTo(6, 11, 12.4, 8, 13, -3); ctx.closePath();
    finish(ctx, grad(ctx, -13, 0, 13, 0, ['#2a2a30', '#5a5a64', '#2a2a30', '#141418']), INK, 1.1);
    rrect(ctx, -16.5, -5, 4.5, 3.4, 1.4, '#34343c', INK, 0.8);
    rrect(ctx, 12, -5, 4.5, 3.4, 1.4, '#34343c', INK, 0.8);
    ell(ctx, 0, -3, 13.6, 4, '#1c1c22', INK, 1.1);
    ell(ctx, 0, -2.6, 11, 2.8, '#f0b24a', null);
    dome(ctx, 0, -1.8, 8.6, 5.5); ctx.fillStyle = '#f6c866'; ctx.fill();
    ell(ctx, -3, -4.6, 1.4, 0.8, '#8a4424', null); ell(ctx, 2.4, -4, 1.4, 0.8, '#8a4424', null);
  }

  function boardMini(ctx) {
    ctx.save(); ctx.rotate(-0.12);
    rrect(ctx, -13, -2, 26, 11, 3, grad(ctx, 0, -2, 0, 9, ['#e8b878', '#c88a4a']), INK, 1.1);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-12, 6.6, 24, 1.6);
    ell(ctx, 10, 1, 1.2, 1.2, '#8a5a2a', null);
    ctx.restore();
    ctx.save(); ctx.translate(-1, -4); ctx.rotate(-0.6);
    ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(11, -2.6); ctx.quadraticCurveTo(15, 0, 11.4, 2); ctx.lineTo(-2, 2); ctx.closePath();
    finish(ctx, grad(ctx, 0, -2, 0, 2, ['#ffffff', '#c8ced8', '#8a929e']), INK, 0.9);
    rrect(ctx, -11, -2.2, 9.6, 4.4, 1.6, '#f0e2c0', INK, 0.9);
    ctx.fillStyle = '#c83a2a'; ctx.fillRect(-9, -2.2, 1.2, 4.4); ctx.fillRect(-5, -2.2, 1.2, 4.4);
    ctx.restore();
    carrotWhole(ctx, -9, 4.4, 9, 0.1);
  }

  function tandoorMini(ctx) {
    ctx.beginPath(); ctx.moveTo(-12, 11); ctx.bezierCurveTo(-14, -2, -9, -12, 0, -12.5); ctx.bezierCurveTo(9, -12, 14, -2, 12, 11); ctx.closePath();
    finish(ctx, radial(ctx, -4, -6, 20, ['#f6d4a4', '#d8a06a', '#a8683a']), INK, 1.1);
    ell(ctx, 0, -10.6, 5.4, 1.9, '#3a1a0c', INK, 0.9);
    ctx.fillStyle = 'rgba(255,190,80,0.8)'; ctx.beginPath(); ctx.ellipse(0, -10.6, 3.6, 1.1, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 6, 5.4, 4.4, 0, Math.PI, TAU); ctx.lineTo(5.4, 10.4); ctx.lineTo(-5.4, 10.4); ctx.closePath();
    finish(ctx, '#4a2210', INK, 0.9);
    ctx.fillStyle = '#ffae3a'; ctx.beginPath(); ctx.moveTo(-3, 10.4); ctx.quadraticCurveTo(-2.4, 5.6, 0, 4.4); ctx.quadraticCurveTo(2.4, 5.6, 3, 10.4); ctx.closePath(); ctx.fill();
  }

  function basketMini(ctx) {
    ctx.beginPath(); ctx.moveTo(-13, -1); ctx.lineTo(13, -1); ctx.lineTo(10, 11); ctx.lineTo(-10, 11); ctx.closePath();
    finish(ctx, '#c8984a', INK, 1.1);
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(90,50,10,0.5)'; ctx.lineWidth = 0.8;
    for (let i = -14; i < 14; i += 3) { ctx.beginPath(); ctx.moveTo(i, -1); ctx.lineTo(i + 2, 11); ctx.stroke(); }
    for (let j = 2; j < 12; j += 3.4) { ctx.beginPath(); ctx.moveTo(-14, j); ctx.lineTo(14, j); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.translate(-4, -3); ctx.scale(0.42, 0.42); samsa(ctx); ctx.restore();
    ctx.save(); ctx.translate(5, -2); ctx.scale(0.4, 0.4); non(ctx); ctx.restore();
    ell(ctx, 0, -1, 13, 2.6, null, INK, 1);
  }

  function passMini(ctx) {
    rrect(ctx, -15, 5, 30, 4, 1.5, '#8a5a2a', INK, 1);
    ctx.save(); ctx.translate(-5, 3.6); ctx.scale(0.5, 0.5); plovFood(ctx); ctx.restore();
    ctx.save(); ctx.translate(7, 2.4); ctx.scale(0.45, 0.45); tea(ctx, true); ctx.restore();
  }

  function binMini(ctx) {
    ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(10, -8); ctx.lineTo(8, 11); ctx.lineTo(-8, 11); ctx.closePath();
    finish(ctx, grad(ctx, -10, 0, 10, 0, ['#8a9098', '#dfe3e8', '#6a7078']), INK, 1.1);
    ell(ctx, 0, -8, 10, 2.6, '#5a6068', INK, 1);
    ctx.strokeStyle = '#5a6068'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-10, -8); ctx.quadraticCurveTo(0, -18, 10, -8); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,60,70,0.4)'; ctx.lineWidth = 0.7;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-9, -3 + i * 4.6); ctx.lineTo(9, -3 + i * 4.6); ctx.stroke(); }
  }

  function tableMini(ctx) {
    limb(ctx, [[-9, 1], [-10, 11]], 2.2, '#7a4a20');
    limb(ctx, [[9, 1], [10, 11]], 2.2, '#7a4a20');
    rrect(ctx, -14, -4, 28, 6, 2, '#c89058', INK, 1);
    ctx.fillStyle = 'rgba(255,240,210,0.4)'; ctx.fillRect(-12, -3.2, 24, 1.2);
  }

  function flower(ctx) {
    ctx.strokeStyle = '#3f8a2e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(-2, 8, 1, 13); ctx.stroke();
    leaf(ctx, -3, 8, 3.4, 0.6, '#4aa03a');
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ell(ctx, Math.cos(a) * 4.8, -3 + Math.sin(a) * 4.8, 3.6, 3.6, '#e83a5a', INK, 0.8); }
    ell(ctx, 0, -3, 3, 3, '#ffd23f', INK, 0.8);
  }

  function lockGlyph(ctx) {
    ctx.strokeStyle = INK; ctx.lineWidth = 4.2;
    ctx.beginPath(); ctx.arc(0, -3, 6, Math.PI, TAU); ctx.lineTo(6, 1); ctx.moveTo(-6, 1); ctx.lineTo(-6, -3); ctx.stroke();
    ctx.strokeStyle = '#a8a8b0'; ctx.lineWidth = 2.2; ctx.stroke();
    rrect(ctx, -9, -0.5, 18, 13, 2.4, grad(ctx, 0, 0, 0, 12, ['#f0cc62', '#c8961e']), INK, 1.1);
    ell(ctx, 0, 4.6, 1.8, 1.8, INK, null);
    ctx.fillStyle = INK; ctx.fillRect(-0.7, 5, 1.4, 4);
  }

  function checkGlyph(ctx) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 6.4;
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-3, 7); ctx.lineTo(10, -8); ctx.stroke();
    ctx.strokeStyle = '#4ac03a'; ctx.lineWidth = 3.8; ctx.stroke();
  }

  function starGlyph(ctx) { A.star(ctx, 0, 0, 13, '#ffd23a', '#6a3a08'); ell(ctx, -3.4, -4, 2.2, 1.4, 'rgba(255,255,255,0.7)', null); }

  function coinGlyph(ctx) { coinDisc(ctx, 0, -0.6, 12); }

  function heartGlyph(ctx) { A.heart(ctx, 0, 0, 10, '#e8384a', 1); }

  function lyaganPlov(ctx) { plovFood(ctx); }

  const GLYPH_DRAW = {
    hand, coins, coin: coinGlyph, broom, meat: meatGlyph, rice: riceGlyph, dough, briefcase, guests, doira, footprints,
    kazan: kazanMini, board: boardMini, tandoor: tandoorMini, basket: basketMini, pass: passMini, bin: binMini, table: tableMini,
    flower, lock: lockGlyph, check: checkGlyph, star: starGlyph, heart: heartGlyph, plov: lyaganPlov,
    knife: knifeGlyph, kapkir, notepad, cloth, plates: plateStack, sweat, anger, sparkle
  };

  function glyph(ctx, id, x, y, px) {
    const d = GLYPH_DRAW[id] || FOOD_DRAW[id];
    if (!d) return;
    put(ctx, sprite('g:' + id, Math.round(px), d), x, y);
  }

  function bootShape(ctx) {
    ctx.beginPath();
    ctx.moveTo(-9, -26);
    ctx.lineTo(8, -26);
    ctx.quadraticCurveTo(9.4, -8, 8.4, 5);
    ctx.quadraticCurveTo(14, 7.4, 20.4, 12.6);
    ctx.quadraticCurveTo(26, 17.4, 22, 21);
    ctx.lineTo(-10.4, 21);
    ctx.quadraticCurveTo(-12.6, 12, -10.4, 1);
    ctx.quadraticCurveTo(-11.2, -12, -9, -26);
    ctx.closePath();
  }

  function boot(ctx, dx, dy, dark) {
    ctx.save(); ctx.translate(dx, dy);
    bootShape(ctx);
    finish(ctx, grad(ctx, -11, 0, 10, 0, dark ? ['#5a3a26', '#3a2216', '#24140c'] : ['#8a5a38', '#5e3a22', '#3a2214']), INK, 1.4);
    ctx.save();
    bootShape(ctx);
    ctx.clip();
    ctx.fillStyle = '#b8282e'; ctx.fillRect(-12, -27, 24, 7.4);
    ctx.fillStyle = GOLD;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-8 + i * 4, -23.4); ctx.lineTo(-6 + i * 4, -25.4); ctx.lineTo(-4 + i * 4, -23.4); ctx.lineTo(-6 + i * 4, -21.4); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#1f4f9f'; ctx.fillRect(-12, -20.2, 24, 1.3);
    ctx.fillStyle = 'rgba(255,230,200,0.22)'; ctx.fillRect(-8.6, -18, 3.2, 26);
    ctx.setLineDash([1.6, 1.4]); ctx.strokeStyle = 'rgba(232,200,150,0.7)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(6.4, -18); ctx.quadraticCurveTo(7.4, -2, 6.8, 5.4); ctx.quadraticCurveTo(13, 8.6, 18.4, 13); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-11.6, 9.4); ctx.quadraticCurveTo(0, 11.4, 9.4, 7.6); ctx.quadraticCurveTo(15, 9.6, 20.4, 12.6); ctx.quadraticCurveTo(26.4, 17.4, 22.4, 21.6); ctx.lineTo(-10.8, 21.6); ctx.quadraticCurveTo(-12.8, 16, -11.6, 9.4); ctx.closePath();
    finish(ctx, grad(ctx, 0, 8, 0, 22, ['#4a4a56', '#16161c', '#060608']), INK, 1.3);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-8, 11.6); ctx.quadraticCurveTo(2, 12.8, 9, 10.4); ctx.stroke();
    ell(ctx, 18, 15, 2.4, 1.2, 'rgba(255,255,255,0.45)', null);
    ctx.restore();
  }

  function goodsBoots(ctx) {
    shadowUnder(ctx, 2, 26, 28, 4);
    boot(ctx, -8, -2, true);
    boot(ctx, 4, 3, false);
  }

  function goodsPchak(ctx) {
    shadowUnder(ctx, 0, 24, 26, 4);
    ctx.save(); ctx.translate(4, 10); ctx.rotate(-0.62);
    ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(26, -6.6); ctx.quadraticCurveTo(36, -6, 40, -1); ctx.quadraticCurveTo(33, 7.4, 14, 7); ctx.lineTo(-6, 6.4); ctx.closePath();
    finish(ctx, grad(ctx, 0, -7, 0, 7, ['#b0703a', '#8a4e22', '#5a2e10']), INK, 1.3);
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,220,160,0.5)'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(2 + i * 6, 0, 2.4, 0, TAU); ctx.stroke(); }
    ctx.restore();
    rrect(ctx, -8, -6.8, 4, 13.6, 1, grad(ctx, 0, -7, 0, 7, ['#fff2b0', '#d8a838', '#8a6414']), INK, 1);
    ctx.restore();
    ctx.save(); ctx.translate(-6, 2); ctx.rotate(-0.62);
    pchakKnife(ctx);
    ctx.restore();
  }

  function goodsKazan(ctx) {
    shadowUnder(ctx, 0, 25, 30, 5);
    ctx.save(); ctx.translate(12, -14); ctx.rotate(0.55);
    limb(ctx, [[0, 8], [0, -22]], 3, '#a8763e');
    ell(ctx, 0, -22.6, 2, 2.2, '#c8a060', INK, 0.9);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-27, -4); ctx.bezierCurveTo(-26, 16, -13, 24, 0, 24); ctx.bezierCurveTo(13, 24, 26, 16, 27, -4); ctx.closePath();
    finish(ctx, grad(ctx, -27, 0, 27, 0, ['#18181c', '#50505a', '#2c2c32', '#101014']), INK, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(-15, 8, 3, 9, 0.35, 0, TAU); ctx.fill();
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 29, -6); rrect(ctx, -4, -3, 8, 6, 2.4, '#34343c', INK, 1); ell(ctx, 0, 0, 1.6, 1.2, '#16161a', null); ctx.restore(); }
    ell(ctx, 0, -4, 28, 7.6, '#1e1e24', INK, 1.5);
    ell(ctx, 0, -3.6, 24.4, 5.8, '#0c0c10', null);
    plovHeap(ctx, 0, -2.6, 21, 15, 91, true);
    ctx.strokeStyle = '#1e1e24'; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.ellipse(0, -4, 26.4, 6.6, 0, 0.12, Math.PI - 0.12); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, -4, 28, 7.6, 0, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, -4, 27, 7, 0, Math.PI * 0.62, Math.PI * 0.9); ctx.stroke();
  }

  function log(ctx, x0, y0, x1, y1, w, sd) {
    const r = P.rng(sd);
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const n = 12, ph = r() * 6, top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, bx = x0 + dx * t, by = y0 + dy * t;
      const wob = Math.sin(t * 9 + ph) * w * 0.18, wa = w / 2 * (1 + Math.sin(t * 13 + ph * 2) * 0.16);
      top.push([bx + px * (wa + wob), by + py * (wa + wob)]);
      bot.push([bx - px * (wa - wob), by - py * (wa - wob)]);
    }
    const path = () => { ctx.beginPath(); top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath(); };
    path();
    finish(ctx, grad(ctx, x0 + px * w, y0 + py * w, x0 - px * w, y0 - py * w, ['#b8a68c', '#8a7862', '#5a4a3a']), INK, 1.2);
    ctx.save(); path(); ctx.clip();
    ctx.strokeStyle = 'rgba(50,36,24,0.55)'; ctx.lineWidth = 0.8;
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); for (let i = 0; i <= n; i++) { const t = i / n, bx = x0 + dx * t + px * k * w * 0.22 + px * Math.sin(t * 11 + k + ph) * w * 0.12, by = y0 + dy * t + py * k * w * 0.22 + py * Math.sin(t * 11 + k + ph) * w * 0.12; if (i) ctx.lineTo(bx, by); else ctx.moveTo(bx, by); } ctx.stroke(); }
    for (let i = 0; i < 3; i++) { const t = 0.2 + r() * 0.6; ell(ctx, x0 + dx * t, y0 + dy * t, w * 0.16, w * 0.12, '#4a3a2a', null); ell(ctx, x0 + dx * t + px * w * 0.18, y0 + dy * t + py * w * 0.18, w * 0.28, w * 0.1, 'rgba(230,218,196,0.45)', null); }
    ctx.restore();
    ell(ctx, x0, y0, w * 0.34, w * 0.5, '#d8c09a', INK, 1);
    ctx.strokeStyle = 'rgba(120,90,60,0.7)'; ctx.lineWidth = 0.6;
    for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x0, y0, w * 0.34 * i / 3, w * 0.5 * i / 3, 0, 0, TAU); ctx.stroke(); }
  }

  function flame(ctx, x, y, h) {
    ctx.beginPath(); ctx.moveTo(x - h * 0.4, y); ctx.quadraticCurveTo(x - h * 0.55, y - h * 0.55, x - h * 0.05, y - h); ctx.quadraticCurveTo(x + h * 0.15, y - h * 0.55, x + h * 0.22, y - h * 0.62); ctx.quadraticCurveTo(x + h * 0.55, y - h * 0.35, x + h * 0.4, y); ctx.closePath();
    finish(ctx, grad(ctx, x, y - h, x, y, ['#ffe27a', '#ffa22a', '#e8521a']), '#8a2a08', 0.9);
    ctx.beginPath(); ctx.moveTo(x - h * 0.18, y); ctx.quadraticCurveTo(x - h * 0.2, y - h * 0.35, x, y - h * 0.55); ctx.quadraticCurveTo(x + h * 0.2, y - h * 0.3, x + h * 0.18, y); ctx.closePath();
    ctx.fillStyle = '#fff6c0'; ctx.fill();
  }

  function goodsSaxaul(ctx) {
    shadowUnder(ctx, 0, 24, 30, 5);
    flame(ctx, 16, 22, 14);
    flame(ctx, 8, 23, 9);
    log(ctx, -24, 14, 24, 8, 10, 3);
    log(ctx, -26, 4, 22, -4, 9, 7);
    log(ctx, -20, -6, 26, -14, 9, 11);
    log(ctx, -16, 16, 28, 18, 8, 5);
    for (const x of [-3, 9]) {
      ctx.save(); ctx.translate(x, 2); ctx.rotate(0.08);
      rrect(ctx, -2, -22, 4, 44, 1.6, '#caa25a', INK, 1);
      ctx.strokeStyle = 'rgba(110,80,30,0.7)'; ctx.lineWidth = 0.6;
      for (let i = -20; i < 20; i += 2.4) { ctx.beginPath(); ctx.moveTo(-2, i); ctx.lineTo(2, i + 1.6); ctx.stroke(); }
      ctx.restore();
    }
  }

  function goodsSamovar(ctx) {
    shadowUnder(ctx, 0, 27, 24, 4.4);
    const gold = grad(ctx, -20, 0, 20, 0, ['#7a4210', '#c88a30', '#f8dc86', '#d49a3a', '#8a5016', '#5a300a']);
    for (const s of [-1, 1]) poly(ctx, [[s * 12, 20], [s * 16, 27], [s * 11, 27], [s * 8, 21]], gold, INK, 1);
    rrect(ctx, -13, 17, 26, 5, 2, gold, INK, 1.1);
    poly(ctx, [[-8, 17], [-10, 11], [10, 11], [8, 17]], gold, INK, 1.1);
    ctx.beginPath(); ctx.moveTo(-15, 11); ctx.bezierCurveTo(-21, -3, -19, -15, -12, -19); ctx.lineTo(12, -19); ctx.bezierCurveTo(19, -15, 21, -3, 15, 11); ctx.closePath();
    finish(ctx, gold, INK, 1.4);
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(120,70,10,0.55)'; ctx.lineWidth = 0.9;
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 3.6, 12); ctx.quadraticCurveTo(i * 4.6, -4, i * 2.8, -19); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,230,0.55)'; ctx.fillRect(-9, -16, 2.6, 26);
    ctx.restore();
    for (let i = 0; i < 3; i++) coinDisc(ctx, -7 + i * 7, -7, 2.8);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 17, -12); ctx.quadraticCurveTo(s * 25, -12, s * 24, -5); ctx.quadraticCurveTo(s * 24, 0, s * 18, 0); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = '#3a2214'; ctx.lineWidth = 1.8; ctx.stroke(); }
    ctx.save(); ctx.translate(-1, 5);
    rrect(ctx, -3, -2, 6, 4, 1.4, gold, INK, 1);
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-11, 2.4); ctx.lineTo(-12, 5.6); ctx.lineTo(-9.4, 5.4); ctx.lineTo(-8.8, 3.4); ctx.lineTo(-1, 2.6); ctx.closePath();
    finish(ctx, gold, INK, 1);
    rrect(ctx, -7.6, -3.4, 5.4, 2.4, 1, '#3a2214', INK, 0.8);
    ell(ctx, -11.2, 7.6, 0.9, 1.3, '#9ad0ff', '#2a5a9a', 0.5);
    ctx.restore();
    rrect(ctx, -11, -23, 22, 4.6, 1.6, gold, INK, 1.1);
    ctx.fillStyle = '#2a1206';
    for (let i = 0; i < 5; i++) ctx.fillRect(-9 + i * 4.2, -21.8, 1.8, 2.2);
    ctx.save(); ctx.translate(0, -27.5); ctx.scale(0.62, 0.62); choynak(ctx, true); ctx.restore();
  }

  function goodsRadio(ctx) {
    shadowUnder(ctx, 0, 21, 32, 4);
    ctx.strokeStyle = '#8a8e98'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(22, -16); ctx.lineTo(30, -32); ctx.stroke();
    dot(ctx, 30, -32, 1.4, '#c8ccd4');
    rrect(ctx, -20, -24, 40, 10, 4, null, INK, 3.6);
    rrect(ctx, -20, -24, 40, 10, 4, null, '#b8bcc6', 1.8);
    rrect(ctx, -31, -17, 62, 36, 5, grad(ctx, 0, -17, 0, 19, ['#5a5a66', '#34343c', '#1e1e24']), INK, 1.4);
    rrect(ctx, -29, -15.4, 58, 7, 2, grad(ctx, 0, -15, 0, -8, ['#eceef2', '#b8bcc6']), INK, 0.8);
    for (let i = 0; i < 6; i++) rrect(ctx, -25 + i * 5, -14.4, 4, 4.6, 0.8, i === 0 ? '#d8282e' : '#2a2a32', INK, 0.5);
    rrect(ctx, 6, -14.2, 20, 4.2, 1, '#2a1a08', INK, 0.6);
    ctx.fillStyle = '#f0a030'; ctx.fillRect(8, -12.8, 11, 1.4);
    ctx.fillStyle = '#e83a2a'; ctx.fillRect(15, -13.4, 1, 2.6);
    for (const s of [-1, 1]) {
      const cx = s * 18.5, cy = 4;
      ell(ctx, cx, cy, 11, 11, grad(ctx, cx - 11, cy - 11, cx + 11, cy + 11, ['#d8dce4', '#8a8e98']), INK, 1.2);
      ell(ctx, cx, cy, 8.6, 8.6, '#141418', INK, 0.8);
      ctx.fillStyle = '#3a3a44';
      for (let a = 0; a < 3; a++) for (let k = 0; k < 10; k++) { const ang = k / 10 * TAU + a * 0.3, d = 2.8 + a * 2; dot(ctx, cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, 0.55, '#4a4a56'); }
      ell(ctx, cx, cy, 2.6, 2.6, grad(ctx, cx - 2, cy - 2, cx + 2, cy + 2, ['#8a8e98', '#2a2a32']), INK, 0.6);
      ell(ctx, cx - 3.4, cy - 4, 2, 1.2, 'rgba(255,255,255,0.25)', null);
    }
    rrect(ctx, -7, -6, 14, 21, 1.6, '#0e0e14', INK, 1);
    rrect(ctx, -5.6, -2.6, 11.2, 7.4, 1, '#f0e0b0', INK, 0.6);
    ctx.fillStyle = '#d8282e'; ctx.fillRect(-5.6, 3, 11.2, 1.2);
    ctx.fillStyle = '#1f4f9f'; ctx.fillRect(-5.6, 4.2, 11.2, 0.6);
    for (const x of [-2.6, 2.6]) { ell(ctx, x, 0.6, 1.8, 1.8, '#2a2a32', INK, 0.4); ell(ctx, x, 0.6, 0.7, 0.7, '#f0e0b0', null); }
    ctx.fillStyle = 'rgba(140,180,220,0.18)'; ctx.fillRect(-6.4, -5.4, 12.8, 6);
    for (let i = 0; i < 4; i++) rrect(ctx, -6 + i * 3.1, 8.4, 2.4, 4.4, 0.6, '#9a9ea8', INK, 0.4);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-29, -16, 58, 1.2);
  }

  const KURPACHA = [
    [['#b3262e', '#e8b64a', '#1f4f8f', '#f3e6c8', '#2a6a3a'], 'comb', 61],
    [['#7a2a6e', '#e8c860', '#2e8f7a', '#f4ecd8', '#233a8c'], 'amulet', 62],
    [['#e0306a', '#ffd23f', '#2f9e5a', '#f7f0e0', '#2b3d9a'], 'flame', 63]
  ];

  function mattress(ctx, x, y, w, h, spec) {
    const [pal, kind, sd] = spec;
    const path = () => { const r = h * 0.45; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w + 1, y, x + w, y + h / 2); ctx.quadraticCurveTo(x + w + 1, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x - 1, y + h, x, y + h / 2); ctx.quadraticCurveTo(x - 1, y, x + r, y); ctx.closePath(); };
    path();
    ctx.fillStyle = pal[0]; ctx.fill();
    ctx.save(); path(); ctx.clip();
    const ik = O.ikat(sd, 48, 24, pal, { kind, tileW: 16, tileH: 24, feather: 0.1 });
    const pat = O.patternOf(ctx, ik);
    if (pat && pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().translate(x, y).scale(0.5, h / 24));
    ctx.fillStyle = pat; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = grad(ctx, 0, y, 0, y + h, ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)', 'rgba(20,0,20,0.35)']);
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.setLineDash([1.4, 1.6]); ctx.strokeStyle = 'rgba(255,250,235,0.75)'; ctx.lineWidth = 0.7;
    for (const k of [0.33, 0.66]) { ctx.beginPath(); ctx.moveTo(x + 3, y + h * k); ctx.lineTo(x + w - 3, y + h * k); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.restore();
    path(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
  }

  function goodsKurpacha(ctx) {
    shadowUnder(ctx, 0, 25, 32, 4.4);
    mattress(ctx, -30, 10, 60, 13, KURPACHA[0]);
    mattress(ctx, -28, -1, 56, 12, KURPACHA[1]);
    mattress(ctx, -26, -11.5, 52, 11, KURPACHA[2]);
    ctx.save(); ctx.translate(2, -17);
    ctx.beginPath(); ctx.moveTo(-18, -5); ctx.lineTo(18, -5); ctx.quadraticCurveTo(22, 0, 18, 5); ctx.lineTo(-18, 5); ctx.quadraticCurveTo(-22, 0, -18, -5); ctx.closePath();
    finish(ctx, grad(ctx, 0, -5, 0, 5, ['#f4d270', '#e0a030', '#a8661a']), INK, 1.2);
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#b3262e'; for (let i = -16; i < 18; i += 6) ctx.fillRect(i, -6, 2.2, 12);
    ctx.fillStyle = '#1f4f8f'; for (let i = -13; i < 18; i += 6) ctx.fillRect(i, -6, 0.9, 12);
    ctx.restore();
    ell(ctx, -18.6, 0, 2.4, 5, '#c8801e', INK, 1);
    ell(ctx, 18.6, 0, 2.4, 5, '#c8801e', INK, 1);
    ctx.restore();
  }

  function goodsTandoor(ctx) {
    shadowUnder(ctx, 0, 27, 30, 4.4);
    rrect(ctx, -27, 16, 54, 10, 2, '#a8502e', INK, 1.3);
    ctx.save(); ctx.beginPath(); ctx.rect(-26, 17, 52, 8); ctx.clip();
    for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) rrect(ctx, -27 + i * 8.4 + (r ? 4 : 0), 17 + r * 4, 7.6, 3.4, 0.6, O.shade('#b8603a', ((i * 7 + r * 3) % 5 - 2) * 0.05), null);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-23, 16.5); ctx.bezierCurveTo(-27, -8, -16, -27, 0, -28); ctx.bezierCurveTo(16, -27, 27, -8, 23, 16.5); ctx.closePath();
    finish(ctx, radial(ctx, -8, -12, 44, ['#fae0b8', '#e2ac74', '#c07a44', '#8a4e24']), INK, 1.5);
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(120,70,30,0.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(0, -8 + i * 6.4, 26, 3.4, 0, 0, Math.PI); ctx.stroke(); }
    ctx.fillStyle = '#f6f0e0';
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.12 + i * 0.095); dot(ctx, Math.cos(a) * -21, 2 + Math.sin(a) * 3.2 - 3, 1.1, i % 2 ? '#1f4f9f' : '#f6f0e0'); }
    ctx.restore();
    ell(ctx, 0, -23.4, 10.4, 3.6, '#2a1206', INK, 1.2);
    ell(ctx, 0, -23.2, 8, 2.4, radial(ctx, 0, -23.2, 8, ['#fff2a0', '#ffae3a', '#c8401a']), null);
    flame(ctx, -3, -24, 8);
    flame(ctx, 3.4, -24.4, 10);
    ctx.beginPath(); ctx.ellipse(0, 9, 8, 6.6, 0, Math.PI, TAU); ctx.lineTo(8, 16.5); ctx.lineTo(-8, 16.5); ctx.closePath();
    finish(ctx, '#3a1a0a', INK, 1.1);
    flame(ctx, 0, 16.5, 9);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-12, -8, 3.4, 10, 0.3, 0, TAU); ctx.fill();
  }

  function goodsSign(ctx) {
    ctx.strokeStyle = '#6a6a74'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-20, -17); ctx.lineTo(-14, -30); ctx.lineTo(14, -30); ctx.lineTo(20, -17); ctx.stroke();
    ell(ctx, 0, -30.4, 2, 2, '#8a8e98', INK, 0.8);
    rrect(ctx, -31, -17, 62, 34, 4, '#6a3a1a', INK, 1.4);
    rrect(ctx, -27.6, -13.6, 55.2, 27.2, 2.4, grad(ctx, 0, -14, 0, 14, ['#3a78d0', '#1f4f9f', '#123670']), INK, 1);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 0.9; rrect(ctx, -25, -11, 50, 22, 1.6, null, GOLD, 0.9);
    ctx.font = 'bold 19px ' + (P.SERIF || 'Georgia, serif'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = '#3a1a08'; ctx.lineWidth = 3.6; ctx.strokeText('ОШ', 0, 1);
    ctx.fillStyle = grad(ctx, 0, -8, 0, 9, ['#fff6c0', '#ffd23a', '#e88a10']); ctx.fillText('ОШ', 0, 1);
    ctx.textBaseline = 'alphabetic';
    const cols = ['#ff5a4a', '#ffd23a', '#6ae06a', '#6ab8ff'];
    const bulb = (x, y, i) => {
      const c = cols[i % 4];
      ctx.fillStyle = radial(ctx, x, y, 5, [c, 'rgba(255,255,255,0)']); ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
      ell(ctx, x, y, 1.9, 1.9, c, INK, 0.6);
      dot(ctx, x - 0.6, y - 0.6, 0.6, 'rgba(255,255,255,0.9)');
    };
    let k = 0;
    for (let i = 0; i < 9; i++) { bulb(-28 + i * 7, -15.2, k++); bulb(28 - i * 7, 15.2, k++); }
    for (let i = 1; i < 4; i++) { bulb(29.4, -15.2 + i * 7.6, k++); bulb(-29.4, 15.2 - i * 7.6, k++); }
  }

  const GOODS_DRAW = { boots: goodsBoots, pchak: goodsPchak, kazan: goodsKazan, saxaul: goodsSaxaul, samovar: goodsSamovar, radio: goodsRadio, kurpacha: goodsKurpacha, tandoor: goodsTandoor, sign: goodsSign };

  function good(ctx, id, x, y, px) {
    const d = GOODS_DRAW[id];
    if (!d) return;
    put(ctx, sprite('u:' + id, Math.round(px), d, 64), x, y);
  }

  P.Icons = { food, foodAt, leftoverAt, glyph, good, FOOD_DRAW, FOOD_BASE, GLYPH_DRAW, GOODS_DRAW, LEFTOVER_DRAW, plovHeap, choynak, pialaCup, tomatoSlice, meatChunk };
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(globalThis.Plov = globalThis.Plov || {});
