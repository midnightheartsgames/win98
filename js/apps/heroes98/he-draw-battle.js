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

  const deck = (c, B) => {
    c.fillStyle = '#26527e';
    c.fillRect(0, 148, H.W, G.field - 148);
    const left = center(BT.deckGap[0], 0)[0] - G.w / 2, right = center(BT.deckGap[1], 0)[0] + G.w;
    c.fillStyle = '#8a6a44';
    c.fillRect(0, 160, left, G.field - 170);
    c.fillRect(right, 160, H.W - right, G.field - 170);
    c.strokeStyle = 'rgba(40,24,10,0.5)';
    for (let y = 168; y < G.field - 12; y += 16) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(left, y);
      c.moveTo(right, y);
      c.lineTo(H.W, y);
      c.stroke();
    }
    if (B.round >= BT.deckPlanks) {
      c.fillStyle = '#7a5a34';
      const [, y0] = center(0, BT.plankRows[0]), [, y1] = center(0, BT.plankRows[1]);
      c.fillRect(left, y0 - 8, right - left, y1 - y0 + 24);
    }
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
    if (B.deck) deck(c, B);
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
    if (B.shallow) {
      for (const [zc, zr] of B.shallow.cells) {
        hexPath(c, zc, zr, 2);
        c.fillStyle = 'rgba(70,150,210,0.4)';
        c.fill();
      }
    }
    for (const [oc, or] of B.obstacles) if (!B.deck || !BT.deckGap.includes(oc)) obstacle(c, oc, or, B.temp.some(t => t.c === oc && t.r === or) ? 1 : (oc * 7 + or * 3 + B.seed) % 3);
    if (B.siege) walls(c, B.siege);
  };

  const pieceAt = (B, col, r) => (B.siege && col === B.siege.col ? B.siege.pieces.findIndex(p => p.rows.includes(r)) : -1);

  const towerShape = (c, x, y, w, h, stone) => {
    c.fillStyle = stone[0];
    c.fillRect(x - w / 2, y - h, w, h);
    c.fillStyle = stone[1];
    c.fillRect(x - w / 2 + w - 4, y - h, 4, h);
    c.fillStyle = stone[0];
    for (let i = 0; i < 3; i++) c.fillRect(x - w / 2 + i * (w / 2.5), y - h - 6, w / 4, 6);
    c.fillStyle = '#1a1208';
    c.fillRect(x - 2, y - h + 8, 4, 10);
    c.strokeStyle = '#0c0a08';
    c.lineWidth = 1;
    c.strokeRect(x - w / 2 + 0.5, y - h + 0.5, w - 1, h - 1);
  };

  const walls = (c, sg) => {
    const wood = sg.fort === 1, stone = wood ? ['#7a5a32', '#4e381e'] : ['#8e8a7e', '#5e5a50'];
    if (sg.moat) {
      for (let r = 0; r < BT.rows; r++) {
        hexPath(c, sg.col - 1, r, 1);
        c.fillStyle = '#2c5a7a';
        c.fill();
        c.strokeStyle = '#1c3c54';
        c.stroke();
      }
    }
    for (const p of sg.pieces) {
      for (const r of p.rows) {
        const [x, y] = center(sg.col, r), part = p.hp / p.max;
        if (p.hp <= 0) {
          c.fillStyle = wood ? '#4e381e' : '#6a665c';
          for (const [dx, dy, w, h] of [[-14, 4, 12, 6], [0, -2, 14, 8], [10, 6, 10, 5], [-4, 10, 12, 4]]) c.fillRect(x + dx, y + dy, w, h);
          continue;
        }
        if (p.gate) {
          c.fillStyle = '#3a2412';
          c.fillRect(x - 16, y - 26, 32, 40);
          c.fillStyle = '#6a4a22';
          for (let k = 0; k < 4; k++) c.fillRect(x - 14 + k * 7, y - 24, 5, 36);
          c.fillStyle = '#26262a';
          c.fillRect(x - 16, y - 16, 32, 3);
          c.fillRect(x - 16, y + 2, 32, 3);
        } else {
          c.fillStyle = stone[0];
          c.fillRect(x - 18, y - 28, 36, 42);
          c.fillStyle = stone[1];
          c.fillRect(x + 12, y - 28, 6, 42);
          for (let k = 0; k < 4; k++) c.fillRect(x - 18 + k * 10, y - 34, 6, 6);
          if (wood) for (let k = 1; k < 4; k++) c.fillRect(x - 18 + k * 9, y - 28, 1, 42);
        }
        if (part < 1) {
          c.strokeStyle = '#141008';
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(x - 10, y - 24);
          c.lineTo(x - 2, y - 8);
          c.lineTo(x - 8, y + 6);
          c.moveTo(x - 2, y - 8);
          c.lineTo(x + 8, y - 2);
          c.stroke();
          c.lineWidth = 1;
        }
      }
    }
    if (sg.towers) {
      for (const r of [0, BT.rows - 1]) {
        const [x, y] = center(sg.col, r);
        towerShape(c, x, y + 14, 44, 62, stone);
      }
    }
    if (sg.towers >= 3) towerShape(c, H.W - 40, 168, 56, 78, stone);
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
    H.Art.drawUnit(c, s.unit, x + (v.dx || 0), y + 6, { flip: s.side === 1, alpha: v.alpha * (s.phantom ? 0.55 : 1), flash: v.flash });
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
      for (let i = 0; i < (s.heat || 0); i++) {
        c.fillStyle = i + 1 >= H.Battle.heatCap(B, s) ? '#ff3010' : '#ff9a20';
        c.fillRect(px + w + 2, y + 11 - i * 5, 4, 4);
      }
      c.globalAlpha = 1;
    }
  };

  H.BattleDraw = { G, SIDE, center, hexPath, pick, pieceAt, stackPos, field, unit };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
