(function (H) {
  'use strict';
  const BT = H.BATTLE;
  const G = { w: 48, h: 40, row: 30, x0: 52, y0: 170, field: 496 };
  const SIDE = [H.PLAYER_COLORS[0], H.PLAYER_COLORS[1]];

  const center = (c, r) => [G.x0 + c * G.w + (r & 1 ? G.w / 2 : 0) + G.w / 2, G.y0 + r * G.row + G.h / 2];
  const hexPath = (ctx, c, r, inset) => {
    const [x, y] = center(c, r), a = G.w / 2 - (inset || 0), b = G.h / 2 - (inset || 0), q = b / 2;
    ctx.beginPath();
    ctx.moveTo(x, y - b);
    ctx.lineTo(x + a, y - q);
    ctx.lineTo(x + a, y + q);
    ctx.lineTo(x, y + b);
    ctx.lineTo(x - a, y + q);
    ctx.lineTo(x - a, y - q);
    ctx.closePath();
  };
  const pick = (x, y) => {
    for (let r = 0; r < BT.rows; r++) {
      for (let c = 0; c < BT.cols; c++) {
        const [cx, cy] = center(c, r), dx = Math.abs(x - cx), dy = Math.abs(y - cy), a = G.w / 2, b = G.h / 2;
        if (dx <= a && dy <= b - (b / 2) * (dx / a)) return [c, r];
      }
    }
    return null;
  };
  const stackPos = s => {
    const cells = H.Battle.cells(s);
    const pts = cells.map(p => center(p[0], p[1]));
    return [pts.reduce((t, p) => t + p[0], 0) / pts.length, pts[0][1]];
  };

  const field = (g, B) => {
    const c = g.ctx;
    const sky = c.createLinearGradient(0, 0, 0, 150);
    sky.addColorStop(0, '#5a7aa8');
    sky.addColorStop(1, '#b8c8c8');
    c.fillStyle = sky;
    c.fillRect(0, 0, H.W, 150);
    c.fillStyle = '#6a7a62';
    c.beginPath();
    c.moveTo(0, 150);
    for (let x = 0; x <= H.W; x += 40) c.lineTo(x, 128 + Math.sin(x * 0.013 + B.seed) * 10 + Math.sin(x * 0.041) * 5);
    c.lineTo(H.W, 150);
    c.fill();
    const ground = c.createLinearGradient(0, 140, 0, G.field);
    ground.addColorStop(0, '#5c7040');
    ground.addColorStop(1, '#3e5228');
    c.fillStyle = ground;
    c.fillRect(0, 148, H.W, G.field - 148);
    c.strokeStyle = 'rgba(20,30,10,0.35)';
    c.lineWidth = 1;
    for (let r = 0; r < BT.rows; r++) for (let col = 0; col < BT.cols; col++) {
      hexPath(c, col, r, 0.5);
      c.stroke();
    }
    for (const z of B.zones) {
      for (const [zc, zr] of z.cells) {
        hexPath(c, zc, zr, 2);
        c.fillStyle = 'rgba(240,110,30,0.45)';
        c.fill();
      }
    }
    for (const [oc, or] of B.obstacles) obstacle(c, oc, or, B.temp.some(t => t.c === oc && t.r === or) ? 1 : (oc * 7 + or * 3 + B.seed) % 3);
  };

  const obstacle = (c, col, r, kind) => {
    const [x, y] = center(col, r);
    if (kind === 0) {
      c.fillStyle = '#6e6a62';
      c.beginPath();
      c.moveTo(x - 18, y + 8);
      c.lineTo(x - 12, y - 10);
      c.lineTo(x + 2, y - 16);
      c.lineTo(x + 16, y - 6);
      c.lineTo(x + 18, y + 8);
      c.closePath();
      c.fill();
      c.fillStyle = '#8e8a80';
      c.fillRect(x - 8, y - 12, 10, 4);
    } else {
      c.fillStyle = kind === 1 ? '#2e4a22' : '#3a5a28';
      for (const [dx, dy, rr] of [[-8, 0, 11], [8, 2, 10], [0, -10, 12]]) {
        c.beginPath();
        c.arc(x + dx, y + dy, rr, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#4a2e1a';
      c.fillRect(x - 2, y + 6, 4, 6);
    }
  };

  const unit = (g, B, s, v, active) => {
    const c = g.ctx, u = H.UNITS[s.unit], x = v.x, y = v.y;
    if (v.alpha <= 0) return;
    c.save();
    c.globalAlpha = v.alpha;
    c.fillStyle = SIDE[s.side];
    c.globalAlpha = v.alpha * (active ? 0.95 : 0.6);
    c.beginPath();
    c.ellipse(x, y + 6, u.big ? 34 : 16, 6, 0, 0, Math.PI * 2);
    c.fill();
    if (active) {
      c.strokeStyle = '#fff6c8';
      c.lineWidth = 2;
      c.stroke();
    }
    c.restore();
    H.Art.drawUnit(c, s.unit, x + (v.dx || 0), y + 6, { flip: s.side === 1, alpha: v.alpha, flash: v.flash });
    if (v.count > 0) {
      const label = String(v.count), w = Math.max(18, label.length * 6 + 6), px = s.side ? x - 22 - w : x + 14;
      c.globalAlpha = v.alpha;
      c.fillStyle = '#1a1208';
      c.fillRect(px, y + 2, w, 13);
      c.fillStyle = SIDE[s.side];
      c.fillRect(px + 1, y + 3, w - 2, 11);
      g.text(label, px + w / 2, y + 9, { align: 'center', size: 10, bold: true, color: '#ffffff', shadow: false });
      if (s.stars) {
        c.fillStyle = '#ffe060';
        for (let i = 0; i < s.stars; i++) c.fillRect(px + 1 + i * 5, y - 3, 4, 4);
      }
      s.fx.slice(0, 5).forEach((e, i) => {
        c.fillStyle = e.bad ? '#e05040' : '#50c8e0';
        c.fillRect(px + 1 + i * 5, y + 16, 4, 4);
      });
      c.globalAlpha = 1;
    }
  };

  H.BattleDraw = { G, SIDE, center, hexPath, pick, stackPos, field, unit };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
