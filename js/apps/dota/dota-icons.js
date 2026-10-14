(function (D) {
  'use strict';
  const IW = 88, IH = 64;
  const hx = (h) => { const n = parseInt(h.slice(1), 16); return h.length === 4 ? [((n >> 8) & 15) * 17, ((n >> 4) & 15) * 17, (n & 15) * 17] : [n >> 16, (n >> 8) & 255, n & 255]; };
  const tn = (h, k = 1, add = 0, a = 1) => { const c = hx(h), f = (v) => Math.max(0, Math.min(255, v * k + add)) | 0; return a < 1 ? `rgba(${f(c[0])},${f(c[1])},${f(c[2])},${a})` : `rgb(${f(c[0])},${f(c[1])},${f(c[2])})`; };
  const INK = 'rgba(12,8,4,0.9)';

  function path(c, pts) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }
  function fillPoly(c, pts, fill, lw = 1.4) { path(c, pts); c.fillStyle = fill; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }
  const lg = (c, x0, y0, x1, y1, ...cols) => { const g = c.createLinearGradient(x0, y0, x1, y1); cols.forEach((s, i) => g.addColorStop(i / (cols.length - 1), s)); return g; };
  function glow(c, x, y, r, col, a = 0.7) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, tn(col, 1, 40, a)); g.addColorStop(0.4, tn(col, 1, 0, a * 0.45)); g.addColorStop(1, tn(col, 1, 0, 0)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore(); }
  function spark(c, x, y, r, col = '#ffffff') { c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); }
  function blade(c, x0, y0, x1, y1, w, col, o = {}) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, hw = w / 2, tl = o.tip || w * 1.1;
    const bL = [x0 + nx * hw, y0 + ny * hw], bR = [x0 - nx * hw, y0 - ny * hw], tL = [x1 - ux * tl + nx * hw * (o.taper || 0.9), y1 - uy * tl + ny * hw * (o.taper || 0.9)], tR = [x1 - ux * tl - nx * hw * (o.taper || 0.9), y1 - uy * tl - ny * hw * (o.taper || 0.9)];
    const mid0 = [x0, y0], mid1 = [x1, y1];
    path(c, [bL, tL, mid1, tR, bR]); c.fillStyle = tn(col, 0.62); c.fill();
    path(c, [bL, tL, mid1, mid0]); c.fillStyle = lg(c, x0, y0, x1, y1, tn(col, 1.25, 20), tn(col, 1.05)); c.fill();
    c.strokeStyle = tn(col, 1.5, 60, 0.8); c.lineWidth = 1; c.beginPath(); c.moveTo(bL[0], bL[1]); c.lineTo(tL[0], tL[1]); c.lineTo(mid1[0], mid1[1]); c.stroke();
    if (o.fuller !== false) { c.strokeStyle = tn(col, 0.5, 0, 0.7); c.lineWidth = Math.max(1, w * 0.12); c.beginPath(); c.moveTo(x0 + ux * 3, y0 + uy * 3); c.lineTo(x1 - ux * tl * 1.4, y1 - uy * tl * 1.4); c.stroke(); }
    path(c, [bL, tL, mid1, tR, bR]); c.strokeStyle = INK; c.lineWidth = 1.4; c.lineJoin = 'round'; c.stroke();
  }
  function stick(c, x0, y0, x1, y1, w, col) {
    c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = w + 2.4; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = tn(col, 0.8); c.lineWidth = w; c.stroke();
    const L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / L * w * 0.22, ny = (x1 - x0) / L * w * 0.22;
    c.strokeStyle = tn(col, 1.35, 30); c.lineWidth = Math.max(1, w * 0.35); c.beginPath(); c.moveTo(x0 + nx, y0 + ny); c.lineTo(x1 + nx, y1 + ny); c.stroke();
  }
  function wrap(c, x0, y0, x1, y1, w, col, n = 5) { for (let i = 1; i < n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / L * w, ny = (x1 - x0) / L * w; c.strokeStyle = col; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - nx * 0.6, y - ny * 0.6); c.lineTo(x + nx * 0.6 + (x1 - x0) / L * 2, y + ny * 0.6 + (y1 - y0) / L * 2); c.stroke(); } }
  function sword(c, x0, y0, x1, y1, o) {
    const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux, gl = o.grip || 12, gw = o.guard || 16;
    const gx = x0 - ux * gl, gy = y0 - uy * gl;
    stick(c, gx, gy, x0, y0, o.gripW || 4, o.gripCol || '#4a2a14'); wrap(c, gx, gy, x0, y0, 2.4, tn(o.gripCol || '#4a2a14', 0.5), 4);
    blade(c, x0 + ux * 1.5, y0 + uy * 1.5, x1, y1, o.w || 7, o.col, o);
    stick(c, x0 - nx * gw / 2, y0 - ny * gw / 2, x0 + nx * gw / 2, y0 + ny * gw / 2, o.guardW || 3.6, o.guardCol || '#b08a3a');
    orb(c, gx - ux * 2, gy - uy * 2, o.pommel || 3, o.pommelCol || o.guardCol || '#b08a3a');
    if (o.gem) gem(c, x0, y0, 2.8, o.gem);
  }
  function orb(c, x, y, r, col, o = {}) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, tn(col, 1.4, 70)); g.addColorStop(0.45, tn(col, 1)); g.addColorStop(1, tn(col, 0.35));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); if (o.line !== false) { c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.45, r * 0.28, r * 0.16, -0.6, 0, 7); c.fill();
  }
  function gem(c, x, y, r, col, tall = 1) {
    const top = [x, y - r * tall], rt = [x + r, y - r * 0.2 * tall], rb = [x + r * 0.55, y + r * 0.7 * tall], bot = [x, y + r * tall], lb = [x - r * 0.55, y + r * 0.7 * tall], lt = [x - r, y - r * 0.2 * tall];
    fillPoly(c, [top, rt, rb, bot, lb, lt], tn(col, 0.9), 1.2);
    path(c, [top, rt, [x, y]]); c.fillStyle = tn(col, 1.3, 40); c.fill(); path(c, [top, lt, [x, y]]); c.fillStyle = tn(col, 1.6, 90); c.fill();
    path(c, [rb, bot, lb, [x, y]]); c.fillStyle = tn(col, 0.55); c.fill();
    path(c, [top, rt, rb, bot, lb, lt]); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
    spark(c, x - r * 0.35, y - r * 0.45 * tall, r * 0.45);
  }
  function ringShape(c, x, y, rx, ry, w, col, o = {}) {
    c.lineWidth = w + 2.4; c.strokeStyle = INK; c.beginPath(); c.ellipse(x, y, rx, ry, o.rot || 0, 0, 7); c.stroke();
    c.lineWidth = w; c.strokeStyle = lg(c, x - rx, y - ry, x + rx, y + ry, tn(col, 1.5, 50), tn(col, 1), tn(col, 0.5)); c.stroke();
    c.lineWidth = Math.max(1, w * 0.3); c.strokeStyle = tn(col, 1.6, 90, 0.8); c.beginPath(); c.ellipse(x, y, rx, ry, o.rot || 0, Math.PI * 1.05, Math.PI * 1.6); c.stroke();
  }
  function flask(c, x, y, r, liq, o = {}) {
    const nw = r * 0.42, nh = r * 0.7;
    fillPoly(c, [[x - nw, y - r * 0.8], [x - nw, y - r * 0.8 - nh], [x + nw, y - r * 0.8 - nh], [x + nw, y - r * 0.8]], 'rgba(200,230,240,0.55)', 1.2);
    fillPoly(c, [[x - nw * 1.15, y - r * 0.8 - nh - r * 0.35], [x - nw * 1.15, y - r * 0.8 - nh + 1], [x + nw * 1.15, y - r * 0.8 - nh + 1], [x + nw * 1.15, y - r * 0.8 - nh - r * 0.35]], o.cork || '#9a6a3a', 1.1);
    c.fillStyle = 'rgba(200,230,240,0.35)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.save(); c.beginPath(); c.arc(x, y, r - 1, 0, 7); c.clip(); const g = lg(c, x, y - r, x, y + r, tn(liq, 1.5, 50), tn(liq, 1), tn(liq, 0.5)); c.fillStyle = g; c.fillRect(x - r, y - r * (o.level || 0.25), r * 2, r * 2); c.fillStyle = tn(liq, 1.7, 90, 0.8); c.fillRect(x - r, y - r * (o.level || 0.25), r * 2, 1.5); c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(x - r * 0.45, y - r * 0.35, r * 0.18, r * 0.35, 0.4, 0, 7); c.fill();
  }
  function boot(c, x, y, s, col, o = {}) {
    const P = (px, py) => [x + px * s, y + py * s];
    const body = [P(-9, -18), P(4, -18), P(5, 2), P(16, 6), P(19, 12), P(18, 16), P(-10, 16), P(-11, 4)];
    fillPoly(c, body, lg(c, x - 10 * s, y - 18 * s, x + 18 * s, y + 16 * s, tn(col, 1.3, 20), tn(col, 0.9), tn(col, 0.55)));
    fillPoly(c, [P(-10.5, -21), P(5.5, -21), P(5, -14), P(-10, -14)], o.cuff || tn(col, 0.6), 1.2);
    fillPoly(c, [P(-10.4, 12), P(18.5, 12), P(18, 16), P(-10, 16)], o.sole || '#2a1a10', 1);
    if (o.wing) { fillPoly(c, [P(-9, -10), P(-22, -22), P(-19, -12), P(-24, -8), P(-15, -4)], o.wing, 1.1); }
    if (o.gem) gem(c, x - 2 * s, y - 17.5 * s, 3 * s, o.gem);
    c.strokeStyle = tn(col, 1.5, 50, 0.55); c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 7 * s, y - 12 * s); c.lineTo(x - 8 * s, y + 8 * s); c.stroke();
  }
  function shield(c, x, y, w, h, col, rim, o = {}) {
    c.beginPath(); c.moveTo(x - w / 2, y - h / 2); c.lineTo(x + w / 2, y - h / 2); c.lineTo(x + w / 2, y - h * 0.05); c.quadraticCurveTo(x + w / 2, y + h * 0.3, x, y + h / 2); c.quadraticCurveTo(x - w / 2, y + h * 0.3, x - w / 2, y - h * 0.05); c.closePath();
    c.fillStyle = lg(c, x - w / 2, y - h / 2, x + w / 2, y + h / 2, tn(col, 1.35, 25), tn(col, 0.95), tn(col, 0.5)); c.fill(); c.strokeStyle = rim || '#c8a040'; c.lineWidth = 3; c.stroke(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    if (o.boss) orb(c, x, y - h * 0.08, o.boss, rim || '#c8a040');
  }
  function cloth(c, pts, col) { fillPoly(c, pts, lg(c, pts[0][0], pts[0][1], pts[2][0], pts[2][1], tn(col, 1.35, 20), tn(col, 0.95), tn(col, 0.55))); }
  function flame(c, x, y, s, col, core) {
    c.beginPath(); c.moveTo(x, y - 20 * s); c.bezierCurveTo(x + 14 * s, y - 6 * s, x + 12 * s, y + 10 * s, x, y + 12 * s); c.bezierCurveTo(x - 12 * s, y + 10 * s, x - 14 * s, y - 4 * s, x - 4 * s, y - 10 * s); c.quadraticCurveTo(x - 2 * s, y - 4 * s, x, y - 20 * s);
    c.fillStyle = lg(c, x, y - 20 * s, x, y + 12 * s, tn(col, 1.3, 40), tn(col, 1), tn(col, 0.7)); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.moveTo(x, y - 6 * s); c.bezierCurveTo(x + 7 * s, y + 1 * s, x + 6 * s, y + 9 * s, x, y + 10 * s); c.bezierCurveTo(x - 6 * s, y + 9 * s, x - 7 * s, y + 1 * s, x, y - 6 * s); c.fillStyle = core || '#fff4b0'; c.fill();
  }
  function axeHead(c, x, y, s, col, flip = 1) {
    c.beginPath(); c.moveTo(x, y - 8 * s); c.quadraticCurveTo(x + 14 * s * flip, y - 20 * s, x + 20 * s * flip, y - 16 * s); c.quadraticCurveTo(x + 13 * s * flip, y, x + 20 * s * flip, y + 16 * s); c.quadraticCurveTo(x + 14 * s * flip, y + 20 * s, x, y + 8 * s); c.closePath();
    c.fillStyle = lg(c, x, y - 20 * s, x + 20 * s * flip, y + 20 * s, tn(col, 1.4, 30), tn(col, 0.95), tn(col, 0.55)); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    c.strokeStyle = tn(col, 1.7, 90, 0.9); c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + 20 * s * flip, y - 15 * s); c.quadraticCurveTo(x + 14 * s * flip, y, x + 20 * s * flip, y + 15 * s); c.stroke();
  }
  function hammerHead(c, x, y, ang, w, h, col) { c.save(); c.translate(x, y); c.rotate(ang); fillPoly(c, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], lg(c, -w / 2, -h / 2, w / 2, h / 2, tn(col, 1.4, 30), tn(col, 0.95), tn(col, 0.5))); c.strokeStyle = tn(col, 0.5); c.lineWidth = 1.4; c.beginPath(); c.moveTo(-w / 2 + 3, -h / 2); c.lineTo(-w / 2 + 3, h / 2); c.moveTo(w / 2 - 3, -h / 2); c.lineTo(w / 2 - 3, h / 2); c.stroke(); c.restore(); }
  function bolt(c, pts, col) { fillPoly(c, pts, lg(c, pts[0][0], pts[0][1], pts[pts.length - 1][0], pts[pts.length - 1][1], '#ffffff', tn(col, 1.2, 30), tn(col, 0.8)), 1.2); }
  function wingShape(c, x, y, s, col, flip = 1) {
    const P = (px, py) => [x + px * s * flip, y + py * s];
    fillPoly(c, [P(0, 0), P(10, -16), P(26, -22), P(22, -12), P(28, -10), P(20, -2), P(24, 2), P(12, 4)], lg(c, x, y - 22 * s, x + 26 * s * flip, y + 4 * s, tn(col, 1.4, 40), tn(col, 1), tn(col, 0.6)));
    c.strokeStyle = tn(col, 0.5, 0, 0.8); c.lineWidth = 1; c.beginPath(); c.moveTo(...P(3, -2)); c.lineTo(...P(22, -12)); c.moveTo(...P(4, 1)); c.lineTo(...P(20, -2)); c.stroke();
  }
  function mask(c, x, y, s, col, o = {}) {
    c.beginPath(); c.moveTo(x - 14 * s, y - 12 * s); c.quadraticCurveTo(x, y - 20 * s, x + 14 * s, y - 12 * s); c.quadraticCurveTo(x + 16 * s, y + 6 * s, x, y + 18 * s); c.quadraticCurveTo(x - 16 * s, y + 6 * s, x - 14 * s, y - 12 * s);
    c.fillStyle = lg(c, x - 14 * s, y - 18 * s, x + 14 * s, y + 18 * s, tn(col, 1.4, 30), tn(col, 0.95), tn(col, 0.55)); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    c.fillStyle = o.eye || '#0a0604'; for (const k of [-1, 1]) { c.beginPath(); c.ellipse(x + k * 6 * s, y - 3 * s, 4 * s, 2.4 * s, k * 0.3, 0, 7); c.fill(); }
    if (o.glow) for (const k of [-1, 1]) glow(c, x + k * 6 * s, y - 3 * s, 6 * s, o.glow);
    if (o.fangs) { c.fillStyle = '#f4f0e0'; for (const k of [-1, 1]) { c.beginPath(); c.moveTo(x + k * 4 * s, y + 8 * s); c.lineTo(x + k * 2 * s, y + 15 * s); c.lineTo(x + k * 1 * s, y + 8 * s); c.fill(); } }
  }
  function glove(c, x, y, s, col, o = {}) {
    const P = (px, py) => [x + px * s, y + py * s];
    fillPoly(c, [P(-10, 18), P(-11, -2), P(-14, -8), P(-11, -11), P(-7, -4), P(-8, -18), P(-4, -20), P(-2, -8), P(-1, -22), P(3, -22), P(4, -8), P(6, -19), P(10, -18), P(9, -4), P(11, -14), P(14, -12), P(11, 4), P(10, 18)], lg(c, x - 14 * s, y - 22 * s, x + 14 * s, y + 18 * s, tn(col, 1.4, 30), tn(col, 0.95), tn(col, 0.55)));
    fillPoly(c, [P(-11, 12), P(11, 12), P(11, 20), P(-11, 20)], o.cuff || tn(col, 0.55), 1.2);
  }
  function crown(c, x, y, w, h, col, g) { fillPoly(c, [[x - w / 2, y + h / 2], [x - w / 2, y - h / 2], [x - w / 4, y], [x, y - h * 0.7], [x + w / 4, y], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2]], lg(c, x, y - h, x, y + h / 2, tn(col, 1.5, 40), tn(col, 1), tn(col, 0.6))); if (g) gem(c, x, y + h * 0.15, h * 0.22, g); }
  function scrollShape(c, x, y, w, h, col) { fillPoly(c, [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], lg(c, x, y - h / 2, x, y + h / 2, tn(col, 1.2, 20), tn(col, 0.85))); for (const yy of [y - h / 2, y + h / 2]) { stick(c, x - w / 2 - 3, yy, x + w / 2 + 3, yy, 5, '#8a5a2a'); } c.strokeStyle = tn(col, 0.45, 0, 0.8); c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - w * 0.35, y - h * 0.22 + i * h * 0.22); c.lineTo(x + w * 0.35, y - h * 0.22 + i * h * 0.22); c.stroke(); } }
  function eye(c, x, y, r, col, iris) { c.beginPath(); c.moveTo(x - r * 1.6, y); c.quadraticCurveTo(x, y - r * 1.4, x + r * 1.6, y); c.quadraticCurveTo(x, y + r * 1.4, x - r * 1.6, y); c.fillStyle = tn(col, 1.2, 20); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); orb(c, x, y, r * 0.62, iris); c.fillStyle = '#050302'; c.beginPath(); c.arc(x, y, r * 0.25, 0, 7); c.fill(); }
  function leaf(c, x, y, ang, len, col) { c.save(); c.translate(x, y); c.rotate(ang); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.3, len, 0); c.quadraticCurveTo(len * 0.5, len * 0.3, 0, 0); c.fillStyle = lg(c, 0, -len * 0.3, 0, len * 0.3, tn(col, 1.4, 30), tn(col, 0.7)); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); c.strokeStyle = tn(col, 0.5); c.beginPath(); c.moveTo(1, 0); c.lineTo(len * 0.85, 0); c.stroke(); c.restore(); }
  function swirl(c, x, y, r, col, turns = 2.2, w = 3) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); for (let t = 0; t <= 1.001; t += 0.02) { const a = t * Math.PI * 2 * turns, rr = r * (0.15 + t * 0.85), px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.8; t ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
  function skull(c, x, y, s, col) { c.fillStyle = tn(col, 1.1, 10); c.beginPath(); c.arc(x, y - 3 * s, 11 * s, 0, 7); c.fill(); fillPoly(c, [[x - 7 * s, y + 4 * s], [x + 7 * s, y + 4 * s], [x + 6 * s, y + 12 * s], [x - 6 * s, y + 12 * s]], tn(col, 1), 1.2); c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.arc(x, y - 3 * s, 11 * s, Math.PI * 0.8, Math.PI * 2.2); c.stroke(); c.fillStyle = '#0a0604'; for (const k of [-1, 1]) { c.beginPath(); c.arc(x + k * 4.5 * s, y - 2 * s, 3.2 * s, 0, 7); c.fill(); } c.beginPath(); c.moveTo(x, y + 1 * s); c.lineTo(x - 1.6 * s, y + 4 * s); c.lineTo(x + 1.6 * s, y + 4 * s); c.fill(); }
  function cog(c, x, y, r, col) { c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = i % 2 ? r : r * 1.25; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = lg(c, x - r, y - r, x + r, y + r, tn(col, 1.4, 30), tn(col, 0.9), tn(col, 0.5)); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); }
  function chest(c, x, y, s, col) { fillPoly(c, [[x - 14 * s, y - 16 * s], [x + 14 * s, y - 16 * s], [x + 17 * s, y - 6 * s], [x + 14 * s, y + 16 * s], [x - 14 * s, y + 16 * s], [x - 17 * s, y - 6 * s]], lg(c, x - 17 * s, y - 16 * s, x + 17 * s, y + 16 * s, tn(col, 1.4, 30), tn(col, 0.95), tn(col, 0.5))); c.strokeStyle = tn(col, 0.45); c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y - 16 * s); c.lineTo(x, y + 16 * s); c.moveTo(x - 12 * s, y - 2 * s); c.quadraticCurveTo(x - 6 * s, y + 2 * s, x - 1 * s, y - 1 * s); c.moveTo(x + 12 * s, y - 2 * s); c.quadraticCurveTo(x + 6 * s, y + 2 * s, x + 1 * s, y - 1 * s); c.stroke(); }

  const BG = { consumables: '#5a4020', attributes: '#4a3a2a', equipment: '#3a3e48', misc: '#4a3e2a', secret: '#3a2458', accessories: '#2e4a2a', support: '#4a4a22', magical: '#1e3464', armor: '#4a2e1e', weapons: '#5a2020', artifacts: '#3a2458', drop: '#6a5018' };
  const BG_OVERRIDE = { gauntlets: '#6a2a1a', slippers: '#2a5a2a', mantle: '#23407a', belt: '#6a2a1a', band: '#2a5a2a', robe: '#23407a', ogre_axe: '#6a2a1a', blade_alacrity: '#2a5a2a', staff_wizardry: '#23407a', bracer: '#6a2a1a', wraith_band: '#2a5a2a', null_talisman: '#23407a', reaver: '#6a2a1a', eaglesong: '#2a5a2a', mystic_staff: '#23407a' };

  const ART = {
    tango(c) { stick(c, 30, 54, 50, 20, 3, '#6a4a2a'); for (const [x, y, a, l] of [[36, 44, -2.2, 20], [42, 34, -0.6, 22], [46, 28, -2.0, 18], [50, 20, -1.1, 20], [34, 48, -0.3, 16]]) leaf(c, x, y, a, l, '#4aa83a'); },
    salve(c) { flask(c, 44, 38, 17, '#3ac85a', { level: 0.1 }); leaf(c, 36, 40, -0.4, 14, '#2a8a2a'); },
    clarity(c) { flask(c, 44, 38, 17, '#3a78e8', { level: 0.2 }); spark(c, 50, 36, 4); },
    faerie_fire(c) { glow(c, 44, 34, 30, '#e070ff', 0.8); flame(c, 44, 36, 1.1, '#e060e0', '#ffe0ff'); for (const [x, y] of [[26, 18], [62, 22], [58, 48], [28, 46]]) spark(c, x, y, 3, '#ffd0ff'); },
    mango(c) { c.fillStyle = lg(c, 30, 18, 60, 54, '#ffe060', '#f09020', '#b04a10'); c.beginPath(); c.ellipse(44, 38, 18, 15, -0.5, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); leaf(c, 52, 22, -0.8, 16, '#3a9a2a'); stick(c, 50, 25, 54, 18, 2, '#5a3a1a'); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(36, 32, 5, 3, -0.6, 0, 7); c.fill(); },
    tp(c) { scrollShape(c, 44, 32, 38, 26, '#e8d8a8'); glow(c, 44, 32, 14, '#60a0ff'); c.strokeStyle = '#2a60c0'; c.lineWidth = 2; c.beginPath(); c.arc(44, 32, 7, 0, 7); c.stroke(); spark(c, 44, 32, 4, '#c0e0ff'); },
    ward_obs(c) { stick(c, 44, 60, 44, 36, 4, '#6a4a2a'); glow(c, 44, 24, 22, '#ffd040', 0.6); eye(c, 44, 24, 11, '#f8f0c0', '#e0a020'); },
    ward_sentry(c) { stick(c, 44, 60, 44, 36, 4, '#4a4a5a'); glow(c, 44, 24, 22, '#60a0ff', 0.6); eye(c, 44, 24, 11, '#e0f0ff', '#3a70e0'); },
    dust(c) { for (const [x, y, r] of [[30, 22, 9], [44, 16, 11], [58, 24, 9], [52, 14, 6]]) { c.fillStyle = 'rgba(230,220,190,0.75)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } fillPoly(c, [[32, 34], [56, 34], [62, 56], [26, 56]], lg(c, 26, 34, 62, 56, '#b08858', '#7a5a34', '#4a3218')); stick(c, 32, 34, 56, 34, 3, '#c8a060'); for (const [x, y] of [[36, 18], [50, 20], [44, 10]]) spark(c, x, y, 2.6, '#fff8e0'); },
    bottle(c) { c.fillStyle = 'rgba(160,220,255,0.3)'; c.beginPath(); c.moveTo(38, 8); c.lineTo(50, 8); c.lineTo(50, 20); c.quadraticCurveTo(62, 26, 62, 42); c.quadraticCurveTo(62, 58, 44, 58); c.quadraticCurveTo(26, 58, 26, 42); c.quadraticCurveTo(26, 26, 38, 20); c.closePath(); c.fill(); c.save(); c.clip(); c.fillStyle = lg(c, 0, 30, 0, 58, '#80e8ff', '#2a8ad0', '#10407a'); c.fillRect(20, 32, 50, 30); c.restore(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); fillPoly(c, [[37, 3], [51, 3], [51, 9], [37, 9]], '#9a6a3a', 1.1); c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(33, 38, 2.5, 7, 0.3, 0, 7); c.fill(); spark(c, 48, 44, 4, '#e0faff'); },
    branch(c) { stick(c, 22, 52, 64, 14, 5, '#7a6a5a'); stick(c, 40, 36, 56, 40, 3, '#7a6a5a'); stick(c, 32, 44, 28, 26, 3, '#7a6a5a'); leaf(c, 56, 40, 0.4, 12, '#5a9a3a'); leaf(c, 28, 26, -1.8, 11, '#5a9a3a'); leaf(c, 64, 14, -0.6, 12, '#5a9a3a'); },
    gauntlets(c) { glove(c, 44, 33, 1.3, '#c04030', { cuff: '#8a8a92' }); },
    slippers(c) { boot(c, 38, 35, 1.35, '#3aa860', { cuff: '#1e6a3a', sole: '#1a3a1a' }); },
    mantle(c) { cloth(c, [[26, 12], [62, 12], [68, 56], [44, 50], [20, 56]], '#3a78e0'); fillPoly(c, [[26, 12], [62, 12], [58, 20], [30, 20]], '#e8e0c0', 1.1); gem(c, 44, 18, 4, '#80c0ff'); },
    circlet(c) { ringShape(c, 44, 36, 24, 12, 5, '#e0c050'); gem(c, 44, 26, 6, '#ff4050'); },
    belt(c) { fillPoly(c, [[8, 26], [80, 22], [80, 38], [8, 42]], lg(c, 0, 22, 0, 42, '#d05a3a', '#8a2a18', '#5a1a10')); fillPoly(c, [[36, 20], [52, 19], [52, 44], [36, 45]], '#d8b050', 1.3); fillPoly(c, [[40, 25], [48, 25], [48, 39], [40, 39]], '#5a1a10', 1); },
    band(c) { fillPoly(c, [[14, 40], [26, 22], [74, 20], [62, 38]], lg(c, 14, 20, 74, 40, '#80e090', '#2a9a4a', '#1a5a2a')); c.strokeStyle = '#d0f0a0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(22, 34); c.lineTo(68, 30); c.stroke(); leaf(c, 60, 38, 0.6, 14, '#3aa84a'); },
    robe(c) { cloth(c, [[30, 8], [58, 8], [70, 58], [44, 54], [18, 58]], '#3a60d0'); fillPoly(c, [[36, 8], [52, 8], [48, 30], [40, 30]], '#1a2a6a', 1.1); for (const [x, y] of [[32, 40], [54, 36], [44, 46], [58, 50]]) spark(c, x, y, 3.2, '#ffe080'); },
    ogre_axe(c) { stick(c, 22, 60, 54, 8, 5, '#5a3a1a'); axeHead(c, 48, 18, 1.15, '#9a9aa2'); wrap(c, 22, 60, 32, 44, 3, '#2a1a0a', 4); },
    blade_alacrity(c) { c.beginPath(); c.moveTo(22, 54); c.quadraticCurveTo(36, 18, 70, 8); c.quadraticCurveTo(46, 30, 30, 58); c.closePath(); c.fillStyle = lg(c, 22, 54, 70, 8, '#b0ffc8', '#40c070', '#1a6a3a'); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); stick(c, 18, 60, 26, 52, 4, '#2a4a2a'); stick(c, 18, 48, 32, 58, 3, '#c8a040'); },
    staff_wizardry(c) { stick(c, 26, 60, 58, 14, 4, '#6a4a2a'); glow(c, 60, 12, 16, '#60a0ff'); orb(c, 60, 12, 8, '#4a80ff'); for (const [a, b] of [[52, 18], [66, 20]]) stick(c, 58, 16, a, b, 1.8, '#c8a040'); },
    quelling_blade(c) { stick(c, 24, 58, 50, 18, 4, '#6a4a2a'); axeHead(c, 46, 22, 0.8, '#b0b0b8'); },
    ring_protection(c) { ringShape(c, 44, 36, 18, 13, 6, '#c8ccd8'); gem(c, 44, 22, 6, '#4080ff'); },
    blades_attack(c) { sword(c, 24, 50, 64, 12, { col: '#c8ccd8', w: 5, grip: 10, guard: 12, gripCol: '#5a2a1a' }); sword(c, 64, 50, 26, 14, { col: '#b0b4c0', w: 5, grip: 10, guard: 12, gripCol: '#5a2a1a' }); },
    chainmail(c) { cloth(c, [[26, 10], [62, 10], [66, 54], [22, 54]], '#8a8e9a'); c.strokeStyle = 'rgba(40,40,50,0.55)'; c.lineWidth = 1; for (let y = 14; y < 54; y += 4) for (let x = 26 + (y % 8 ? 2 : 0); x < 64; x += 4) { c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.stroke(); } fillPoly(c, [[34, 10], [54, 10], [50, 18], [38, 18]], '#4a4e5a', 1.1); },
    quarterstaff(c) { stick(c, 12, 56, 76, 8, 5, '#9a6a3a'); for (const t of [0.15, 0.5, 0.85]) { const x = 12 + 64 * t, y = 56 - 48 * t; c.fillStyle = '#c8a040'; c.beginPath(); c.arc(x, y, 3.5, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); } },
    helm_iron(c) { c.beginPath(); c.moveTo(22, 46); c.quadraticCurveTo(22, 10, 44, 10); c.quadraticCurveTo(66, 10, 66, 46); c.lineTo(56, 52); c.lineTo(56, 34); c.lineTo(32, 34); c.lineTo(32, 52); c.closePath(); c.fillStyle = lg(c, 22, 10, 66, 52, '#d0d4dc', '#7a7e8a', '#3a3e48'); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); stick(c, 44, 12, 44, 30, 3, '#9aa0aa'); fillPoly(c, [[32, 34], [56, 34], [56, 38], [32, 38]], '#2a2a30', 1); },
    javelin(c) { stick(c, 12, 58, 64, 14, 3.2, '#8a6a3a'); blade(c, 62, 16, 78, 4, 7, '#d0d4e0', { tip: 8 }); for (const [dx, dy] of [[-2, 6], [4, 4]]) leaf(c, 16 + dx, 54 + dy, 2.4, 10, '#e0e0d0'); },
    broadsword(c) { sword(c, 28, 44, 70, 8, { col: '#c8d0dc', w: 10, grip: 12, guard: 20, gripCol: '#4a2a14' }); },
    claymore(c) { sword(c, 30, 46, 74, 6, { col: '#d8dce4', w: 9, grip: 16, guard: 24, gripCol: '#7a1a14', guardCol: '#7a7e88' }); },
    mithril(c) { stick(c, 26, 60, 50, 22, 4, '#6a4a2a'); hammerHead(c, 52, 18, 0.55, 28, 16, '#c0d0e8'); },
    blight_stone(c) { fillPoly(c, [[28, 20], [50, 12], [64, 26], [60, 50], [36, 54], [24, 40]], lg(c, 24, 12, 64, 54, '#5a5064', '#2e2838', '#18141e')); c.strokeStyle = '#b060ff'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(34, 24); c.lineTo(44, 34); c.lineTo(40, 46); c.moveTo(44, 34); c.lineTo(56, 30); c.stroke(); glow(c, 44, 34, 14, '#9040e0', 0.5); },
    magic_stick(c) { stick(c, 22, 58, 58, 16, 4, '#7a5a3a'); glow(c, 60, 14, 16, '#c080ff'); spark(c, 60, 14, 7, '#f0d8ff'); },
    ring_regen(c) { ringShape(c, 44, 36, 18, 13, 6, '#50b050'); gem(c, 44, 22, 6, '#ff3040'); },
    sages_mask(c) { mask(c, 44, 32, 1.25, '#6a8ad8'); for (const k of [-1, 1]) stick(c, 44 + k * 18, 22, 44 + k * 26, 16, 2, '#e0c060'); },
    boots(c) { boot(c, 38, 35, 1.35, '#9a6a3a', { cuff: '#6a4020' }); },
    gloves(c) { glove(c, 44, 33, 1.3, '#e0b830', { cuff: '#8a6a20' }); for (const [x, y] of [[24, 16], [66, 14]]) spark(c, x, y, 3, '#fff0a0'); },
    cloak(c) { cloth(c, [[30, 8], [58, 8], [72, 58], [44, 52], [16, 58]], '#c03a2a'); fillPoly(c, [[30, 8], [58, 8], [54, 16], [34, 16]], '#e0c060', 1.1); },
    ring_health(c) { ringShape(c, 44, 36, 18, 13, 6, '#e0b840'); gem(c, 44, 22, 7, '#e82030'); },
    void_stone(c) { glow(c, 44, 34, 26, '#4040ff', 0.5); orb(c, 44, 34, 17, '#2a2a8a'); c.strokeStyle = 'rgba(160,160,255,0.8)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(44, 34, 24, 7, -0.3, 0, 7); c.stroke(); },
    gem(c) { glow(c, 44, 32, 28, '#40ffa0', 0.55); gem(c, 44, 32, 17, '#30d080', 1.2); },
    morbid_mask(c) { mask(c, 44, 32, 1.25, '#b03030', { eye: '#1a0000', fangs: true }); },
    shadow_amulet(c) { c.strokeStyle = '#8a8a9a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(24, 8); c.quadraticCurveTo(44, 30, 64, 8); c.stroke(); glow(c, 44, 38, 20, '#6060a0', 0.5); gem(c, 44, 38, 13, '#3a3a58', 1.3); },
    blink(c) { glow(c, 44, 32, 30, '#b060ff', 0.55); swirl(c, 44, 32, 22, 'rgba(200,150,255,0.8)', 1.6, 2.4); sword(c, 30, 44, 60, 14, { col: '#d8c0ff', w: 6, grip: 10, guard: 12, gripCol: '#3a1a5a', guardCol: '#8a60c0' }); },
    energy_booster(c) { glow(c, 44, 32, 28, '#3a7aff', 0.6); orb(c, 44, 32, 16, '#3a70e0'); spark(c, 44, 32, 6, '#d0e8ff'); },
    vitality_booster(c) { glow(c, 44, 32, 28, '#ff3a3a', 0.6); orb(c, 44, 32, 16, '#d03030'); spark(c, 44, 32, 6, '#ffd8d8'); },
    point_booster(c) { glow(c, 44, 32, 28, '#b040ff', 0.6); orb(c, 44, 32, 16, '#9030d0'); spark(c, 44, 32, 6, '#f0d8ff'); },
    platemail(c) { cloth(c, [[22, 12], [66, 12], [62, 56], [26, 56]], '#b8bcc8'); fillPoly(c, [[22, 12], [34, 8], [36, 18], [22, 22]], '#8a8e9a', 1.1); fillPoly(c, [[66, 12], [54, 8], [52, 18], [66, 22]], '#8a8e9a', 1.1); c.strokeStyle = 'rgba(40,40,50,0.6)'; c.lineWidth = 1.3; for (const y of [30, 40, 50]) { c.beginPath(); c.moveTo(27, y); c.quadraticCurveTo(44, y + 4, 61, y); c.stroke(); } },
    talisman(c) { c.strokeStyle = '#c8a040'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(26, 6); c.quadraticCurveTo(44, 24, 62, 6); c.stroke(); glow(c, 44, 36, 20, '#50e0c0', 0.5); c.beginPath(); c.moveTo(44, 18); c.quadraticCurveTo(58, 34, 44, 54); c.quadraticCurveTo(30, 34, 44, 18); c.fillStyle = lg(c, 34, 18, 54, 54, '#b0fff0', '#30b8a0', '#10584a'); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); spark(c, 41, 30, 3); },
    hyperstone(c) { glow(c, 44, 32, 28, '#ffe040', 0.6); fillPoly(c, [[44, 6], [54, 22], [66, 26], [56, 38], [58, 56], [44, 48], [30, 56], [32, 38], [22, 26], [34, 22]], lg(c, 22, 6, 66, 56, '#fff8a0', '#e8c020', '#8a6a10')); spark(c, 44, 30, 6); },
    ultimate_orb(c) { glow(c, 44, 32, 30, '#ffffff', 0.5); orb(c, 44, 32, 15, '#e8e8f0'); for (const r of [0.4, -0.4, 1.4]) { c.strokeStyle = 'rgba(200,210,255,0.85)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(44, 32, 25, 8, r, 0, 7); c.stroke(); } },
    demon_edge(c) { glow(c, 50, 24, 22, '#ff3020', 0.4); sword(c, 26, 48, 74, 8, { col: '#3a3a44', w: 11, grip: 12, guard: 20, gripCol: '#2a0a0a', guardCol: '#8a1a10', edge: true }); c.strokeStyle = '#ff4020'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(30, 42); c.lineTo(68, 12); c.stroke(); },
    mystic_staff(c) { stick(c, 24, 62, 54, 16, 4, '#5a4a7a'); glow(c, 56, 14, 22, '#7080ff', 0.7); for (const [x, y, r] of [[56, 12, 7], [50, 18, 5], [62, 18, 5]]) gem(c, x, y, r, '#90a0ff', 1.3); },
    reaver(c) { stick(c, 20, 60, 50, 16, 5, '#4a2a14'); c.beginPath(); c.moveTo(42, 10); c.lineTo(76, 12); c.lineTo(72, 36); c.lineTo(52, 30); c.lineTo(46, 22); c.closePath(); c.fillStyle = lg(c, 42, 10, 76, 36, '#e06050', '#8a2a20', '#4a1010'); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); for (const x of [56, 64, 72]) { c.fillStyle = '#e8e0d0'; c.beginPath(); c.moveTo(x, 11); c.lineTo(x + 3, 4); c.lineTo(x + 5, 12); c.fill(); } },
    eaglesong(c) { for (const [a, col] of [[-0.5, '#40b050'], [-0.2, '#60d070'], [0.15, '#30903a']]) { c.save(); c.translate(26, 56); c.rotate(a - 0.8); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(16, -10, 48, -4); c.quadraticCurveTo(18, 4, 0, 0); c.fillStyle = lg(c, 0, -10, 48, 4, tn(col, 1.4, 30), col, tn(col, 0.6)); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(); c.strokeStyle = tn(col, 0.5); c.beginPath(); c.moveTo(2, 0); c.lineTo(44, -3); c.stroke(); c.restore(); } },
    sacred_relic(c) { glow(c, 44, 30, 28, '#ffd040', 0.6); c.beginPath(); c.moveTo(34, 12); c.lineTo(54, 12); c.quadraticCurveTo(56, 34, 46, 38); c.lineTo(48, 50); c.lineTo(56, 54); c.lineTo(32, 54); c.lineTo(40, 50); c.lineTo(42, 38); c.quadraticCurveTo(32, 34, 34, 12); c.closePath(); c.fillStyle = lg(c, 32, 12, 56, 54, '#fff4b0', '#e0b030', '#8a6010'); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); gem(c, 44, 24, 5, '#ff4050'); },
    wraith_band(c) { ringShape(c, 44, 38, 22, 11, 7, '#3a9a5a'); skull(c, 44, 24, 0.7, '#e8e4d0'); },
    bracer(c) { fillPoly(c, [[24, 18], [64, 14], [66, 46], [22, 50]], lg(c, 22, 14, 66, 50, '#e05a40', '#a02a1a', '#5a1410')); for (const y of [22, 44]) stick(c, 24, y, 64, y - 3, 3, '#d8b050'); gem(c, 44, 32, 6, '#ffb040'); },
    null_talisman(c) { c.strokeStyle = '#c8a040'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(26, 6); c.quadraticCurveTo(44, 24, 62, 6); c.stroke(); ringShape(c, 44, 36, 14, 14, 4, '#d8b050'); orb(c, 44, 36, 10, '#3a70e0'); },
    magic_wand(c) { stick(c, 22, 58, 52, 20, 4.5, '#8a6a4a'); wrap(c, 22, 58, 34, 43, 3, '#c8a040', 4); glow(c, 56, 16, 18, '#c070ff'); gem(c, 56, 16, 8, '#b060f0', 1.3); },
    soul_ring(c) { ringShape(c, 44, 40, 18, 12, 6, '#7a4a8a'); glow(c, 44, 24, 18, '#ff3050', 0.7); flame(c, 44, 24, 0.7, '#d02050', '#ffa0c0'); },
    phase_boots(c) { for (const k of [16, 10]) { c.globalAlpha = 0.3; boot(c, 40 - k, 35, 1.3, '#ff5030'); c.globalAlpha = 1; } boot(c, 40, 35, 1.3, '#c83020', { cuff: '#6a1a10', gem: '#ffb040' }); },
    power_treads(c) { boot(c, 38, 35, 1.35, '#8a6a3a', { cuff: '#c8a040', sole: '#3a2a14' }); for (const [x, col] of [[66, '#ff5030'], [72, '#40d040'], [78, '#4080ff']]) orb(c, x, 12 + (x - 66), 3.4, col); },
    arcane_boots(c) { glow(c, 40, 36, 26, '#4080ff', 0.45); boot(c, 38, 35, 1.35, '#3a60c0', { cuff: '#c8a040', gem: '#80c0ff' }); },
    tranquil_boots(c) { boot(c, 38, 35, 1.35, '#4a9a4a', { cuff: '#2a5a2a' }); leaf(c, 56, 18, -0.6, 14, '#70d060'); leaf(c, 22, 22, -2.4, 12, '#70d060'); },
    hand_midas(c) { glow(c, 44, 30, 28, '#ffd040', 0.5); glove(c, 40, 30, 1.1, '#e8c040', { cuff: '#8a6a10' }); orb(c, 62, 46, 8, '#f0c030'); c.fillStyle = '#8a5a10'; c.font = 'bold 10px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', 62, 47); },
    mekansm(c) { cog(c, 44, 32, 18, '#b8a060'); c.fillStyle = '#40d060'; c.fillRect(40, 20, 8, 24); c.fillRect(32, 28, 24, 8); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(40, 20, 8, 24); c.strokeRect(32, 28, 24, 8); },
    glimmer(c) { glow(c, 44, 32, 30, '#a0c0ff', 0.5); cloth(c, [[30, 8], [58, 8], [70, 58], [44, 52], [18, 58]], '#6a80e0'); for (const [x, y] of [[32, 30], [54, 22], [46, 44], [60, 46]]) spark(c, x, y, 3.4); },
    force_staff(c) { stick(c, 22, 60, 56, 14, 4, '#3a6a4a'); fillPoly(c, [[54, 6], [70, 10], [64, 14], [72, 24], [66, 28], [58, 18], [54, 24]], lg(c, 54, 6, 72, 28, '#b0ffd0', '#40d080', '#1a6a3a')); glow(c, 58, 14, 14, '#60ffa0', 0.5); },
    vanguard(c) { c.fillStyle = lg(c, 20, 8, 68, 56, '#e0a860', '#9a6a30', '#4a2e10'); c.beginPath(); c.arc(44, 32, 24, 0, 7); c.fill(); c.strokeStyle = '#6a4a20'; c.lineWidth = 4; c.stroke(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); orb(c, 44, 32, 7, '#c8c8d0'); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.fillStyle = '#e8e0c0'; c.beginPath(); c.arc(44 + Math.cos(a) * 19, 32 + Math.sin(a) * 19, 1.6, 0, 7); c.fill(); } },
    blade_mail(c) { cloth(c, [[24, 12], [64, 12], [60, 56], [28, 56]], '#9a3030'); for (const [x0, y0, x1, y1] of [[24, 14, 12, 4], [64, 14, 76, 4], [30, 40, 16, 50], [58, 40, 72, 50], [44, 12, 44, 2]]) blade(c, x0, y0, x1, y1, 5, '#d8dce4', { fuller: false }); },
    perseverance(c) { ringShape(c, 44, 36, 20, 14, 6, '#c8a040'); gem(c, 34, 26, 7, '#4a80ff'); gem(c, 54, 26, 7, '#40d060'); },
    euls(c) { swirl(c, 48, 30, 22, 'rgba(180,240,255,0.85)', 2, 3); stick(c, 24, 60, 50, 18, 4, '#80a0c0'); gem(c, 52, 14, 8, '#60e0ff', 1.3); },
    dagon(c) { glow(c, 50, 22, 24, '#ff4020', 0.6); stick(c, 26, 60, 46, 28, 5, '#6a2a1a'); orb(c, 50, 22, 11, '#d03020'); bolt(c, [[58, 14], [70, 8], [64, 18], [78, 20], [62, 26]], '#ffa040'); },
    aghs(c) { glow(c, 50, 18, 24, '#60a0ff', 0.6); stick(c, 24, 60, 50, 22, 4.5, '#d0a040'); for (let k = 0; k < 3; k++) stick(c, 50, 22, 44 + k * 8, 8, 2, '#d0a040'); orb(c, 52, 14, 8, '#4a90ff'); },
    aghs_shard(c) { glow(c, 44, 32, 28, '#60b0ff', 0.6); fillPoly(c, [[44, 6], [58, 30], [48, 58], [34, 40], [36, 22]], lg(c, 34, 6, 58, 58, '#e0f4ff', '#60a8ff', '#1a4aa0')); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(44, 8); c.lineTo(46, 40); c.lineTo(48, 56); c.stroke(); },
    scythe(c) { stick(c, 22, 60, 54, 10, 4, '#3a4a2a'); c.beginPath(); c.moveTo(52, 12); c.quadraticCurveTo(80, 12, 80, 40); c.quadraticCurveTo(72, 22, 50, 22); c.closePath(); c.fillStyle = lg(c, 50, 10, 80, 40, '#c0ff90', '#60c040', '#2a6a1a'); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); glow(c, 64, 20, 14, '#80ff60', 0.5); },
    refresher(c) { glow(c, 44, 32, 28, '#40ffa0', 0.5); orb(c, 44, 32, 15, '#30b070'); c.strokeStyle = '#e0fff0'; c.lineWidth = 2.6; c.beginPath(); c.arc(44, 32, 9, 0.4, Math.PI * 1.7); c.stroke(); fillPoly(c, [[50, 20], [56, 26], [48, 28]], '#e0fff0', 1); },
    bkb(c) { stick(c, 18, 58, 70, 8, 6, '#1a1a1e'); for (const t of [0.12, 0.5, 0.88]) { const x = 18 + 52 * t, y = 58 - 50 * t; hammerHead(c, x, y, -0.76, 12, 8, '#e0b030'); } orb(c, 44, 33, 4, '#ffe080'); },
    heart(c) { c.beginPath(); c.moveTo(44, 56); c.bezierCurveTo(14, 36, 18, 8, 40, 16); c.bezierCurveTo(44, 12, 48, 12, 50, 16); c.bezierCurveTo(72, 8, 74, 36, 44, 56); c.fillStyle = lg(c, 20, 10, 68, 56, '#ff7070', '#c02020', '#5a0a0a'); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); stick(c, 46, 16, 52, 4, 4, '#a02030'); stick(c, 38, 16, 34, 6, 3, '#6a3aa0'); c.strokeStyle = 'rgba(90,10,20,0.7)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(34, 26); c.quadraticCurveTo(44, 34, 40, 46); c.stroke(); },
    assault(c) { wingShape(c, 32, 30, 0.9, '#e0c050', -1); wingShape(c, 56, 30, 0.9, '#e0c050', 1); cloth(c, [[30, 14], [58, 14], [56, 54], [32, 54]], '#d0a838'); gem(c, 44, 28, 6, '#ff4040'); },
    manta(c) { for (const [dx, a] of [[-12, 0.35], [12, 0.35]]) { c.globalAlpha = a; mask(c, 44 + dx, 32, 1, '#5a90e0'); } c.globalAlpha = 1; mask(c, 44, 32, 1.1, '#6aa0f0', { eye: '#0a1a3a' }); gem(c, 44, 20, 4, '#e0f0ff'); },
    crystalys(c) { sword(c, 28, 46, 72, 8, { col: '#ff80c0', w: 9, grip: 12, guard: 18, gripCol: '#4a1a3a', guardCol: '#c060a0' }); gem(c, 60, 18, 4, '#ffd0f0'); },
    daedalus(c) { glow(c, 52, 24, 22, '#ff4030', 0.45); sword(c, 26, 48, 74, 6, { col: '#e04030', w: 11, grip: 13, guard: 24, gripCol: '#3a1010', guardCol: '#e0b040', gem: '#ffe060' }); },
    mkb(c) { stick(c, 14, 58, 74, 8, 5, '#d0a040'); for (const t of [0.2, 0.8]) { const x = 14 + 60 * t, y = 58 - 50 * t; orb(c, x, y, 4, '#c02020'); } c.strokeStyle = '#e02020'; c.lineWidth = 3; c.beginPath(); c.moveTo(44, 33); c.quadraticCurveTo(38, 46, 46, 56); c.moveTo(44, 33); c.quadraticCurveTo(54, 44, 50, 56); c.stroke(); },
    battle_fury(c) { stick(c, 44, 60, 44, 6, 4, '#4a3a2a'); axeHead(c, 46, 22, 1.05, '#d8dce0', 1); axeHead(c, 42, 22, 1.05, '#d8dce0', -1); glow(c, 44, 22, 16, '#60ff60', 0.35); },
    desolator(c) { glow(c, 50, 24, 24, '#ff2010', 0.5); sword(c, 26, 48, 72, 8, { col: '#2a2426', w: 10, grip: 12, guard: 20, gripCol: '#5a1010', guardCol: '#4a4448' }); for (const [x, y] of [[40, 34], [50, 26], [60, 18]]) { c.fillStyle = '#ff3020'; c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.fill(); } },
    rapier(c) { glow(c, 50, 26, 30, '#ffe080', 0.6); sword(c, 24, 52, 78, 4, { col: '#fff8e0', w: 5, grip: 12, guard: 14, gripCol: '#8a6a20', guardCol: '#f0c040', gem: '#80c0ff', tip: 10 }); c.strokeStyle = '#f0c040'; c.lineWidth = 2; c.beginPath(); c.arc(24, 52, 9, -0.6, 2.4); c.stroke(); },
    radiance(c) { glow(c, 44, 30, 34, '#ffb020', 0.8); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.strokeStyle = 'rgba(255,220,120,0.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(44 + Math.cos(a) * 12, 30 + Math.sin(a) * 12); c.lineTo(44 + Math.cos(a) * 24, 30 + Math.sin(a) * 24); c.stroke(); } orb(c, 44, 30, 11, '#ffc030'); },
    basher(c) { stick(c, 22, 60, 48, 22, 4.5, '#5a3a1a'); hammerHead(c, 52, 18, 0.6, 26, 18, '#8a8a90'); skull(c, 52, 18, 0.42, '#e8e0c8'); },
    abyssal(c) { glow(c, 50, 24, 26, '#b030ff', 0.5); sword(c, 26, 48, 72, 8, { col: '#6a2a8a', w: 11, grip: 12, guard: 20, gripCol: '#1a0a2a', guardCol: '#3a1a4a', gem: '#e060ff' }); },
    maelstrom(c) { stick(c, 22, 60, 48, 22, 4, '#4a4a5a'); hammerHead(c, 52, 18, 0.6, 24, 16, '#6a8ab0'); bolt(c, [[60, 26], [70, 30], [64, 36], [76, 46], [58, 38], [64, 32]], '#a0d0ff'); },
    mjollnir(c) { glow(c, 52, 22, 26, '#80c0ff', 0.6); stick(c, 22, 60, 48, 22, 4, '#8a6a3a'); hammerHead(c, 52, 18, 0.6, 28, 18, '#e0c050'); bolt(c, [[24, 18], [36, 14], [30, 24], [42, 26], [22, 32], [28, 24]], '#a0d0ff'); bolt(c, [[62, 32], [74, 36], [66, 40], [78, 52], [60, 42], [66, 38]], '#a0d0ff'); },
    mask_madness(c) { glow(c, 44, 32, 26, '#ff3020', 0.4); mask(c, 44, 32, 1.25, '#d03a2a', { eye: '#ffe040', fangs: true }); },
    dragon_lance(c) { stick(c, 10, 60, 64, 14, 3.4, '#3a6a3a'); blade(c, 62, 16, 80, 2, 9, '#80d090', { tip: 9 }); for (const k of [-1, 1]) leaf(c, 62, 16, -0.7 + k * 1.3, 10, '#40a050'); },
    butterfly(c) { for (const k of [-1, 1]) { c.save(); c.translate(44, 32); c.scale(k, 1); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(8, -26, 34, -24, 30, -6); c.bezierCurveTo(28, 2, 12, 2, 0, 0); c.moveTo(0, 2); c.bezierCurveTo(10, 4, 26, 10, 18, 22); c.bezierCurveTo(12, 28, 4, 16, 0, 2); c.fillStyle = lg(c, 0, -24, 30, 24, '#c0ffb0', '#40c040', '#1a6a2a'); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(18, -10, 3, 0, 7); c.fill(); c.restore(); } stick(c, 44, 20, 44, 44, 3, '#2a2a1a'); },
    sange(c) { c.beginPath(); c.moveTo(26, 50); c.quadraticCurveTo(40, 14, 74, 8); c.quadraticCurveTo(50, 26, 34, 56); c.closePath(); c.fillStyle = lg(c, 26, 50, 74, 8, '#ffa0a0', '#d03030', '#6a1010'); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); stick(c, 20, 58, 30, 50, 4, '#3a1a10'); stick(c, 22, 46, 36, 56, 3, '#c8a040'); },
    yasha(c) { c.beginPath(); c.moveTo(26, 50); c.quadraticCurveTo(40, 14, 74, 8); c.quadraticCurveTo(50, 26, 34, 56); c.closePath(); c.fillStyle = lg(c, 26, 50, 74, 8, '#b0ffb0', '#30b040', '#105a1a'); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); stick(c, 20, 58, 30, 50, 4, '#1a3a1a'); stick(c, 22, 46, 36, 56, 3, '#c8a040'); },
    sange_yasha(c) { for (const [flip, col] of [[1, '#d03030'], [-1, '#30b040']]) { c.save(); c.translate(44, 0); c.scale(flip, 1); c.translate(-44, 0); c.beginPath(); c.moveTo(26, 54); c.quadraticCurveTo(40, 20, 70, 6); c.quadraticCurveTo(50, 28, 32, 58); c.closePath(); c.fillStyle = lg(c, 26, 54, 70, 6, tn(col, 1.6, 60), col, tn(col, 0.45)); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); stick(c, 20, 60, 28, 54, 4, '#3a2a10'); c.restore(); } gem(c, 44, 34, 4, '#ffe060'); },
    shadow_blade(c) { for (const [x, y, r] of [[30, 40, 12], [40, 30, 14], [54, 22, 12]]) { c.fillStyle = 'rgba(90,60,140,0.45)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } sword(c, 28, 46, 70, 10, { col: '#4a4a5a', w: 7, grip: 12, guard: 14, gripCol: '#1a1a24', guardCol: '#6a6a7a' }); },
    aegis(c) { glow(c, 44, 30, 32, '#ffe080', 0.7); wingShape(c, 32, 26, 0.8, '#fff0c0', -1); wingShape(c, 56, 26, 0.8, '#fff0c0', 1); shield(c, 44, 32, 26, 34, '#e8c050', '#fff0b0', { boss: 5 }); },
    cheese(c) { c.beginPath(); c.moveTo(14, 46); c.lineTo(70, 22); c.lineTo(74, 46); c.lineTo(18, 56); c.closePath(); c.fillStyle = lg(c, 14, 22, 74, 56, '#fff080', '#f0c030', '#b08010'); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); fillPoly(c, [[14, 46], [70, 22], [74, 26], [18, 48]], '#fff4a0', 1); c.fillStyle = '#c89010'; for (const [x, y, r] of [[34, 48, 3.5], [52, 42, 4.5], [64, 44, 2.6], [44, 50, 2]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } }
  };

  function paintBackground(c, id) {
    const d = D.DATA.ITEMS[id], base = BG_OVERRIDE[id] || (d ? BG[d.cat] : null) || '#3a3024';
    c.fillStyle = lg(c, 0, 0, IW * 0.4, IH, tn(base, 1.35, 12), tn(base, 0.8), tn(base, 0.42)); c.fillRect(0, 0, IW, IH);
    const r = c.createRadialGradient(IW * 0.45, IH * 0.4, 2, IW * 0.45, IH * 0.4, IW * 0.6); r.addColorStop(0, tn(base, 1.8, 40, 0.55)); r.addColorStop(1, tn(base, 1, 0, 0)); c.fillStyle = r; c.fillRect(0, 0, IW, IH);
    for (let i = 0; i < 70; i++) { const h = D.hash2 ? D.hash2(i, id.length * 7) : Math.random(), h2 = D.hash2 ? D.hash2(id.length, i * 3) : Math.random(); c.fillStyle = h > 0.5 ? 'rgba(255,240,200,0.05)' : 'rgba(0,0,0,0.08)'; c.fillRect(h * IW, h2 * IH, 2, 1); }
  }
  function frame(c, w, h) {
    const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)'); c.fillStyle = vg; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,236,190,0.28)'; c.fillRect(1, 1, w - 2, 1); c.fillRect(1, 1, 1, h - 2);
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(1, h - 2, w - 2, 1); c.fillRect(w - 2, 1, 1, h - 2);
    c.strokeStyle = 'rgba(0,0,0,0.9)'; c.lineWidth = 1; c.strokeRect(0.5, 0.5, w - 1, h - 1);
  }
  function drawItem(id) {
    const cv = D.GFX.mk(IW, IH), c = cv.getContext('2d');
    paintBackground(c, id);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowOffsetX = 1.5; c.shadowOffsetY = 2; c.shadowBlur = 2;
    const fn = ART[id]; if (fn) fn(c); else { c.fillStyle = '#e8d8b0'; c.font = 'bold 30px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText((id || '?')[0].toUpperCase(), IW / 2, IH / 2 + 2); }
    c.restore();
    frame(c, IW, IH);
    return cv;
  }
  function drawChest(w, h, o = {}) {
    const cv = D.GFX.mk(w, h), c = cv.getContext('2d'), k = Math.min(w / 88, h / 64), lid = o.lid || 0, tone = o.tone || '#c89030';
    c.save(); c.translate(w / 2, h / 2 + 6 * k); c.scale(k, k);
    if (o.glow) glow(c, 0, -8, 46, o.glow, o.glowA == null ? 0.8 : o.glowA);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(0, 22, 34, 6, 0, 0, 7); c.fill();
    fillPoly(c, [[-30, -4], [30, -4], [28, 20], [-28, 20]], lg(c, 0, -4, 0, 20, '#8a5a2a', '#5a3818', '#3a2410'), 1.6);
    for (const x of [-22, 22]) fillPoly(c, [[x - 4, -4], [x + 4, -4], [x + 4, 20], [x - 4, 20]], lg(c, x - 4, 0, x + 4, 0, tn(tone, 1.3, 20), tn(tone, 0.7)), 1.2);
    c.save(); c.translate(0, -4); c.rotate(-lid * 0.9);
    fillPoly(c, [[-30, 0], [-30, -10], [-22, -18], [22, -18], [30, -10], [30, 0]], lg(c, 0, -18, 0, 0, '#9a6a34', '#6a4420'), 1.6);
    for (const x of [-22, 22]) fillPoly(c, [[x - 4, 0], [x - 4, -17], [x + 4, -17], [x + 4, 0]], lg(c, x - 4, 0, x + 4, 0, tn(tone, 1.3, 20), tn(tone, 0.7)), 1.2);
    c.restore();
    fillPoly(c, [[-6, -8], [6, -8], [6, 4], [-6, 4]], lg(c, 0, -8, 0, 4, tn(tone, 1.4, 30), tn(tone, 0.7)), 1.2);
    gem(c, 0, -2, 4, o.gem || '#ff4040');
    c.restore();
    return cv;
  }

  D.ItemArt = { W: IW, H: IH, ids: () => Object.keys(ART), has: (id) => !!ART[id], draw: drawItem, chest: drawChest, frame };
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Dota98 = globalThis.Dota98 || {});
