(function (H) {
  'use strict';
  const A = H.Art, W = 800, HT = 432, INK = '#1a120a';

  const LOOK = {
    league: { sky: ['#5a78a8', '#c0d2e2'], far: '#5e7e8c', ground: ['#6c8c44', '#55743a'], path: '#a08a5e', wall: '#a8603e', roof: '#4a3440', shed: '#8a6a44', trim: '#e8d8a8', stone: '#a49c8e', wood: '#7a5a32', water: '#3a6a9a', banner: '#d8b040', glow: '#f0d890' },
    barrows: { sky: ['#6e6480', '#e8c8a0'], far: '#8a7a5a', ground: ['#b0a068', '#968650'], path: '#d8d0b8', wall: '#ece2cc', roof: '#c0a87e', shed: '#7a5a3a', trim: '#8a3a2a', stone: '#8c96a2', wood: '#6a4a2a', water: '#5a7a8a', banner: '#3a8a8a', glow: '#f0b060' }
  };

  const guilds = (kind, x, y0, w) => [1, 2, 3, 4, 5].map(n => ['guild' + n, kind, x, y0 - (n - 1) * 20, w, 70 + (n - 1) * 20]);
  const forts = [['fort1', 'fort', 0, 384, 800, 48], ['fort2', 'fort', 0, 370, 800, 62], ['fort3', 'fort', 0, 348, 800, 84]];

  const LAYOUT = {
    league: [
      ['dwell6', 'shed', 10, 168, 124, 52], ['dwell6u', 'shed', 8, 160, 128, 60],
      ['dwell5', 'mast', 146, 36, 62, 184], ['dwell5u', 'mast', 140, 26, 74, 194],
      ['dwell3', 'tower', 218, 96, 50, 124], ['dwell3u', 'tower', 214, 80, 58, 140],
      ['special2', 'belfry', 384, 14, 58, 206],
      ...guilds('guild', 470, 150, 64),
      ['dwell7', 'forge', 556, 150, 112, 70], ['dwell7u', 'forge', 552, 140, 120, 80],
      ['dwell4', 'house', 680, 146, 112, 74], ['dwell4u', 'house', 676, 136, 120, 84],
      ['dwell1', 'house', 10, 236, 100, 64], ['dwell1u', 'house', 8, 228, 106, 72],
      ['dwell2', 'shed', 120, 250, 104, 50], ['dwell2u', 'shed', 118, 244, 110, 56],
      ['hall1', 'hall', 270, 228, 110, 72], ['hall2', 'hall', 260, 212, 130, 88], ['hall3', 'hall', 250, 190, 150, 110], ['hall4', 'hall', 238, 164, 174, 136],
      ['tavern', 'house', 422, 238, 92, 62],
      ['market', 'stall', 524, 252, 108, 48],
      ['smith', 'forge', 642, 244, 70, 56],
      ['store', 'house', 720, 240, 72, 60],
      ['special1', 'house', 16, 314, 104, 62],
      ['special3', 'forge', 132, 326, 84, 48],
      ['altar', 'altar', 246, 322, 72, 54],
      ['special4', 'house', 336, 308, 104, 68],
      ['caravan', 'shed', 470, 324, 112, 52],
      ['shipyard', 'dock', 604, 334, 124, 40],
      ...forts
    ],
    barrows: [
      ['dwell7', 'mound', 14, 120, 170, 100], ['dwell7u', 'mound', 8, 106, 182, 114],
      ['special1', 'mound', 196, 150, 140, 70],
      ['dwell5', 'crypt', 348, 140, 112, 80], ['dwell5u', 'crypt', 344, 130, 120, 90],
      ...guilds('totem', 478, 150, 52),
      ['dwell4', 'rock', 548, 56, 84, 164], ['dwell4u', 'rock', 544, 44, 92, 176],
      ['dwell6', 'pen', 646, 160, 146, 60], ['dwell6u', 'pen', 642, 152, 152, 68],
      ['dwell1', 'graves', 10, 250, 110, 50], ['dwell1u', 'graves', 8, 244, 116, 56],
      ['dwell2', 'pen', 130, 240, 112, 60], ['dwell2u', 'pen', 128, 234, 118, 66],
      ['hall1', 'yurt', 270, 228, 104, 72], ['hall2', 'yurt', 260, 212, 124, 88], ['hall3', 'yurt', 250, 190, 144, 110], ['hall4', 'yurt', 240, 166, 164, 134],
      ['tavern', 'yurt', 414, 240, 92, 60],
      ['market', 'stall', 514, 254, 108, 46],
      ['smith', 'forge', 632, 244, 72, 56],
      ['store', 'yurt', 714, 240, 78, 60],
      ['dwell3', 'idols', 14, 306, 124, 68], ['dwell3u', 'idols', 10, 300, 132, 74],
      ['special2', 'idol', 160, 310, 54, 64],
      ['altar', 'altar', 236, 322, 72, 54],
      ['special3', 'pen', 326, 322, 134, 52],
      ['special4', 'yurt', 478, 304, 92, 70],
      ['caravan', 'shed', 590, 324, 112, 50],
      ['shipyard', 'dock', 712, 336, 84, 38],
      ...forts
    ]
  };

  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k)));
    return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')';
  };
  const rect = (g, x, y, w, h, fill, line) => {
    g.fillStyle = fill;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    if (line) {
      g.strokeStyle = line;
      g.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
    }
  };
  const poly = (g, pts, fill, line) => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    if (line) {
      g.strokeStyle = line;
      g.stroke();
    }
  };
  const oval = (g, cx, cy, rx, ry, fill, line, half) => {
    g.beginPath();
    g.ellipse(cx, cy, rx, ry, 0, Math.PI, half ? Math.PI * 2 : Math.PI * 3);
    if (half) g.closePath();
    g.fillStyle = fill;
    g.fill();
    if (line) {
      g.strokeStyle = line;
      g.stroke();
    }
  };
  const flag = (g, x, y, color, t) => {
    rect(g, x, y, 2, 16, '#3a2a18');
    const wave = Math.sin(t * 5 + x * 0.3) * 2;
    poly(g, [[x + 2, y], [x + 14, y + 3 + wave], [x + 2, y + 8]], color, INK);
  };
  const lit = (g, x, y, w, n, col) => {
    for (let i = 0; i < n; i++) rect(g, x + (i + 0.5) * w / n - 3, y, 6, 8, col, INK);
  };
  const smoke = (g, x, y, t) => {
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.6 + k / 4) % 1;
      g.fillStyle = 'rgba(200,200,200,' + (0.5 * (1 - p)).toFixed(2) + ')';
      g.beginPath();
      g.arc(x + Math.sin(p * 6 + k) * 4, y - p * 34, 3 + p * 6, 0, Math.PI * 2);
      g.fill();
    }
  };

  const KINDS = {
    house(g, L, x, y, w, h, o) {
      const roof = h * 0.42;
      rect(g, x + 2, y + roof, w - 4, h - roof, L.wall, INK);
      poly(g, [[x - 2, y + roof + 2], [x + w / 2, y], [x + w + 2, y + roof + 2]], L.roof, INK);
      rect(g, x + w / 2 - 6, y + h - 16, 12, 16, shade(L.wood, 0.7), INK);
      lit(g, x + 4, y + roof + 8, w - 8, Math.max(2, Math.floor(w / 26)), L.glow);
      if (o.up) flag(g, x + w / 2 - 1, y - 14, L.banner, o.t);
    },
    shed(g, L, x, y, w, h, o) {
      const top = y + h * 0.35, n = Math.max(2, Math.floor(w / 34));
      rect(g, x, top, w, h - (top - y), L.shed, INK);
      poly(g, [[x - 3, top + 2], [x + 8, y], [x + w - 8, y], [x + w + 3, top + 2]], L.roof, INK);
      for (let i = 0; i < n; i++) rect(g, x + (i + 0.5) * w / n - 7, y + h - 18, 14, 18, '#2a1c10', INK);
      if (o.up) flag(g, x + w - 12, y - 14, L.banner, o.t);
    },
    tower(g, L, x, y, w, h, o) {
      const roof = Math.min(h * 0.3, w * 1.1);
      rect(g, x + 3, y + roof, w - 6, h - roof, L.stone, INK);
      poly(g, [[x, y + roof + 2], [x + w / 2, y], [x + w, y + roof + 2]], L.roof, INK);
      lit(g, x + 6, y + roof + 10, w - 12, 1, L.glow);
      rect(g, x + w / 2 - 5, y + h - 14, 10, 14, '#2a1c10', INK);
      if (o.up) flag(g, x + w / 2 - 1, y - 14, L.banner, o.t);
    },
    belfry(g, L, x, y, w, h, o) {
      KINDS.tower(g, L, x, y, w, h, {});
      const by = y + h * 0.36;
      rect(g, x + w / 2 - 12, by, 24, 26, '#1a1410', INK);
      const swing = Math.sin(o.t * 2) * 3;
      poly(g, [[x + w / 2 - 7 + swing, by + 20], [x + w / 2 + swing, by + 4], [x + w / 2 + 7 + swing, by + 20]], '#e0b040', INK);
    },
    guild(g, L, x, y, w, h, o) {
      const lv = o.level || 1, floor = (h - 26) / lv;
      for (let i = 0; i < lv; i++) {
        const k = i * 4, fy = y + h - (i + 1) * floor;
        rect(g, x + 4 + k, fy, w - 8 - k * 2, floor, i % 2 ? '#3a4a8a' : '#4a5aa0', INK);
        lit(g, x + 8 + k, fy + floor / 2 - 4, w - 16 - k * 2, 2, '#a0c8ff');
      }
      const top = y + h - lv * floor;
      poly(g, [[x + 8 + lv * 4, top], [x + w / 2, y + 4], [x + w - 8 - lv * 4, top]], '#2a3060', INK);
      g.fillStyle = '#f0e8a0';
      g.beginPath();
      g.arc(x + w / 2, y + 4, 4, 0, Math.PI * 2);
      g.fill();
    },
    mast(g, L, x, y, w, h, o) {
      rect(g, x + w / 2 - 2, y + h * 0.45, 4, h * 0.55, L.wood, INK);
      const bob = Math.sin(o.t * 1.5) * 2, cy = y + h * 0.24 + bob;
      oval(g, x + w / 2, cy, w / 2 - 2, h * 0.22, o.up ? '#c84a3a' : '#b89a5a', INK);
      if (o.up) for (let i = -1; i <= 1; i++) rect(g, x + w / 2 + i * 10 - 2, cy - h * 0.2, 4, h * 0.4, '#e8d8a8');
      g.strokeStyle = INK;
      g.beginPath();
      g.moveTo(x + 8, cy + 6);
      g.lineTo(x + w / 2 - 6, cy + h * 0.24);
      g.moveTo(x + w - 8, cy + 6);
      g.lineTo(x + w / 2 + 6, cy + h * 0.24);
      g.stroke();
      rect(g, x + w / 2 - 8, cy + h * 0.22, 16, 10, L.shed, INK);
    },
    forge(g, L, x, y, w, h, o) {
      KINDS.house(g, Object.assign({}, L, { wall: shade(L.stone, 0.7), roof: shade(L.roof, 0.8) }), x, y + h * 0.15, w, h * 0.85, {});
      rect(g, x + w * 0.72, y, 10, h * 0.4, L.stone, INK);
      smoke(g, x + w * 0.72 + 5, y - 2, o.t);
      g.fillStyle = 'rgba(255,140,40,' + (0.6 + Math.sin(o.t * 7) * 0.2).toFixed(2) + ')';
      g.fillRect(Math.round(x + w / 2 - 5), Math.round(y + h - 15), 10, 14);
      if (o.up) flag(g, x + 6, y - 6, L.banner, o.t);
    },
    stall(g, L, x, y, w, h) {
      for (const px of [x + 4, x + w - 8]) rect(g, px, y + 14, 4, h - 14, L.wood, INK);
      for (let i = 0; i < 6; i++) poly(g, [[x + i * w / 6, y + 18], [x + i * w / 6 + 4, y + 4], [x + (i + 1) * w / 6 + 4, y + 4], [x + (i + 1) * w / 6, y + 18]], i % 2 ? '#e8dcc0' : '#b83a2a', INK);
      rect(g, x + 8, y + h - 16, w - 16, 10, L.shed, INK);
      for (let i = 0; i < 5; i++) rect(g, x + 14 + i * (w - 28) / 5, y + h - 22, 8, 6, ['#e0b040', '#4a8a3a', '#c86a2a', '#8a8aa0', '#f0f0e8'][i], INK);
    },
    dock(g, L, x, y, w, h, o) {
      rect(g, x, y + h * 0.45, w, h * 0.55, L.water);
      for (let i = 0; i < 4; i++) rect(g, x + 6 + i * (w - 12) / 3, y + h * 0.35, 4, h * 0.65, L.wood, INK);
      rect(g, x, y + h * 0.3, w, 7, L.shed, INK);
      rect(g, x + w - 26, y - 20, 4, h * 0.5 + 20, L.wood, INK);
      rect(g, x + w - 46, y - 20, 24, 4, L.wood, INK);
      g.strokeStyle = 'rgba(220,240,255,0.6)';
      g.beginPath();
      for (let i = 0; i < 3; i++) {
        const wx = x + 10 + ((o.t * 12 + i * 40) % (w - 20));
        g.moveTo(wx, y + h - 6);
        g.lineTo(wx + 8, y + h - 6);
      }
      g.stroke();
    },
    altar(g, L, x, y, w, h, o) {
      rect(g, x, y + h - 12, w, 12, L.stone, INK);
      rect(g, x + 8, y + h - 22, w - 16, 10, shade(L.stone, 1.1), INK);
      const pulse = 0.35 + Math.sin(o.t * 2) * 0.15;
      g.fillStyle = 'rgba(220,230,255,' + pulse.toFixed(2) + ')';
      g.beginPath();
      g.arc(x + w / 2, y + h * 0.35, h * 0.32, 0, Math.PI * 2);
      g.fill();
      oval(g, x + w / 2, y + h * 0.35, h * 0.18, h * 0.18, '#e8ecf8', INK);
    },
    fort(g, L, x, y, w, h, o) {
      const lv = o.level || 1, gate = [x + w / 2 - 34, x + w / 2 + 34];
      if (lv === 1) {
        for (let px = x; px < x + w; px += 9) {
          if (px > gate[0] && px < gate[1]) continue;
          poly(g, [[px, y + h], [px, y + 8], [px + 4, y], [px + 8, y + 8], [px + 8, y + h]], L.wood, INK);
        }
      } else {
        const top = y + (lv === 3 ? 22 : 10);
        rect(g, x, top, gate[0] - x, y + h - top, L.stone, INK);
        rect(g, gate[1], top, x + w - gate[1], y + h - top, L.stone, INK);
        for (let px = x; px < x + w; px += 16) if (px + 10 < gate[0] || px > gate[1]) rect(g, px, top - 8, 10, 8, L.stone, INK);
        if (lv === 3) {
          for (const tx of [x + 40, x + 250, x + w - 290, x + w - 80]) KINDS.tower(g, Object.assign({}, L, { roof: shade(L.roof, 0.9) }), tx, y - 30, 40, h + 30, {});
        }
      }
      rect(g, gate[0] - 6, y + 4, 12, h - 4, shade(L.wood, 0.8), INK);
      rect(g, gate[1] - 6, y + 4, 12, h - 4, shade(L.wood, 0.8), INK);
      flag(g, gate[0] - 2, y - 12, L.banner, o.t);
      flag(g, gate[1] - 2, y - 12, L.banner, o.t);
    },
    hall(g, L, x, y, w, h, o) {
      const lv = o.level || 1, tw = w * 0.2;
      if (lv >= 4) {
        KINDS.tower(g, L, x, y + h * 0.18, tw, h * 0.82, {});
        KINDS.tower(g, L, x + w - tw, y + h * 0.18, tw, h * 0.82, {});
      }
      const bx = lv >= 4 ? x + tw - 4 : x, bw = lv >= 4 ? w - tw * 2 + 8 : w;
      if (lv >= 2) KINDS.tower(g, Object.assign({}, L, { stone: L.wall }), bx + bw / 2 - 14, y + (lv >= 3 ? 0 : h * 0.1), 28, h * 0.6, {});
      KINDS.house(g, L, bx, y + h * 0.36, bw, h * 0.64, {});
      if (lv >= 3) {
        g.fillStyle = '#f0e8c8';
        g.beginPath();
        g.arc(bx + bw / 2, y + h * 0.24, 6, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = INK;
        g.stroke();
      }
      flag(g, bx + bw / 2 - 1, y - 14, L.banner, o.t);
    },
    yurt(g, L, x, y, w, h, o) {
      const lv = o.level || 0, base = y + h * 0.55;
      rect(g, x + 2, base, w - 4, h - (base - y), L.wall, INK);
      oval(g, x + w / 2, base + 1, w / 2 - 2, h * 0.5, L.wall, INK, true);
      rect(g, x + 2, base + 4, w - 4, 4, L.trim);
      rect(g, x + w / 2 - 7, y + h - 18, 14, 18, L.trim, INK);
      oval(g, x + w / 2, y + 3, 7, 3, L.roof, INK);
      for (let i = 0; i < lv; i++) {
        const px = x + 8 + i * 12;
        rect(g, px, y - 18 - i * 4, 2, 24 + i * 4, '#3a2a18');
        poly(g, [[px + 2, y - 18 - i * 4], [px + 10, y - 12 - i * 4 + Math.sin(o.t * 4 + i) * 2], [px + 2, y - 8 - i * 4]], i % 2 ? L.trim : L.banner, INK);
      }
    },
    mound(g, L, x, y, w, h, o) {
      oval(g, x + w / 2, y + h, w / 2, h * 0.9, shade(L.ground[1], 0.95), INK, true);
      oval(g, x + w / 2, y + h, w / 2 - 6, h * 0.82, L.ground[0], null, true);
      rect(g, x + w / 2 - 6, y + h * 0.1 - 18, 12, 30, L.stone, INK);
      oval(g, x + w / 2, y + h * 0.1 - 22, 7, 7, shade(L.stone, 1.1), INK);
      if (o.up) for (const dx of [-0.3, 0.3]) rect(g, x + w / 2 + dx * w - 4, y + h * 0.4, 8, 18, L.stone, INK);
      for (let i = 0; i < 4; i++) rect(g, x + w * (0.2 + i * 0.2), y + h - 6, 6, 5, L.stone, INK);
    },
    crypt(g, L, x, y, w, h, o) {
      rect(g, x, y + h * 0.3, w, h * 0.7, L.stone, INK);
      rect(g, x - 4, y + h * 0.2, w + 8, h * 0.12, shade(L.stone, 1.15), INK);
      for (let i = 0; i < 3; i++) rect(g, x + 12 + i * (w - 24) / 2 - 7, y + h - 26, 14, 26, '#1a1820', INK);
      rect(g, x, y + h * 0.3, w, 4, '#f4f4ec');
      if (o.up) for (const dx of [8, w - 16]) rect(g, x + dx, y + h * 0.05, 8, 14, '#e0c060', INK);
    },
    totem(g, L, x, y, w, h, o) {
      const lv = o.level || 1;
      rect(g, x + w / 2 - 4, y + 10, 8, h - 10, L.wood, INK);
      for (let i = 0; i < lv; i++) rect(g, x + w / 2 - 10, y + h - 20 - i * ((h - 34) / 5), 20, 6, i % 2 ? L.trim : L.banner, INK);
      oval(g, x + w / 2, y + 8, 9, 8, '#e8e4d8', INK);
      for (let i = 0; i < 3; i++) poly(g, [[x + w / 2 + 4, y + 18 + i * 8], [x + w / 2 + 18, y + 22 + i * 8 + Math.sin(o.t * 4 + i) * 3], [x + w / 2 + 4, y + 24 + i * 8]], ['#c83a2a', '#3a8a8a', '#e8e0c0'][i]);
    },
    rock(g, L, x, y, w, h, o) {
      poly(g, [[x, y + h], [x + w * 0.15, y + h * 0.3], [x + w * 0.4, y + 6], [x + w * 0.7, y + h * 0.15], [x + w * 0.9, y + h * 0.5], [x + w, y + h]], L.stone, INK);
      poly(g, [[x + w * 0.4, y + 6], [x + w * 0.55, y + h * 0.5], [x + w * 0.7, y + h * 0.15]], shade(L.stone, 0.8));
      oval(g, x + w * 0.42, y + 8, 16, 6, '#6a4a2a', INK);
      if (o.up) oval(g, x + w * 0.8, y + h * 0.42, 12, 5, '#6a4a2a', INK);
      const wing = Math.sin(o.t * 3) * 4;
      poly(g, [[x + w * 0.42 - 12, y - 6 - wing], [x + w * 0.42, y - 2], [x + w * 0.42 + 12, y - 6 - wing], [x + w * 0.42, y - 10]], '#3a2a1a');
    },
    pen(g, L, x, y, w, h, o) {
      const posts = Math.floor(w / 14), col = L.wall === '#ece2cc' ? '#e8e0cc' : L.wood;
      rect(g, x, y + h * 0.45, w, 3, col, INK);
      rect(g, x, y + h * 0.7, w, 3, col, INK);
      for (let i = 0; i <= posts; i++) rect(g, x + i * (w - 4) / posts, y + h * 0.3, 4, h * 0.7, col, INK);
      poly(g, [[x + w - 44, y + h * 0.35], [x + w - 34, y], [x + w - 4, y], [x + w + 4, y + h * 0.35]], L.roof, INK);
      if (o.up) flag(g, x + 4, y - 6, L.banner, o.t);
    },
    graves(g, L, x, y, w, h, o) {
      for (let i = 0; i < 6; i++) {
        const gx = x + 8 + (i % 3) * (w - 16) / 3 + (i > 2 ? 12 : 0), gy = y + h - 18 - (i > 2 ? 0 : 14);
        rect(g, gx, gy, 12, 18, L.stone, INK);
        rect(g, gx + 4, gy - 4, 4, 4, shade(L.stone, 1.1));
      }
      g.fillStyle = 'rgba(220,230,240,' + (0.22 + Math.sin(o.t) * 0.08).toFixed(2) + ')';
      g.beginPath();
      g.ellipse(x + w / 2 + Math.sin(o.t * 0.7) * 8, y + h - 8, w / 2, 8, 0, 0, Math.PI * 2);
      g.fill();
      if (o.up) KINDS.idol(g, L, x + w - 26, y - 8, 22, 34, {});
    },
    idols(g, L, x, y, w, h, o) {
      const n = o.up ? 4 : 3;
      for (let i = 0; i < n; i++) KINDS.idol(g, L, x + 6 + i * (w - 12) / n, y + (i % 2) * 6, (w - 12) / n - 6, h - (i % 2) * 6, {});
    },
    idol(g, L, x, y, w, h) {
      rect(g, x + w * 0.15, y + h * 0.28, w * 0.7, h * 0.72, L.stone, INK);
      oval(g, x + w / 2, y + h * 0.18, w * 0.3, h * 0.16, shade(L.stone, 1.08), INK);
      rect(g, x + w * 0.25, y + h * 0.5, w * 0.5, 4, shade(L.stone, 0.7));
    }
  };

  const level = id => +(/^(hall|fort|guild)(\d)$/.exec(id) || [0, 0, 0])[2];

  const backgrounds = new Map();
  const background = faction => {
    if (backgrounds.has(faction)) return backgrounds.get(faction);
    const L = LOOK[faction], c = document.createElement('canvas');
    c.width = W;
    c.height = HT;
    const g = c.getContext('2d'), sky = g.createLinearGradient(0, 0, 0, 180);
    sky.addColorStop(0, L.sky[0]);
    sky.addColorStop(1, L.sky[1]);
    g.fillStyle = sky;
    g.fillRect(0, 0, W, 180);
    const pts = [[0, 180]];
    for (let x = 0; x <= W; x += 40) pts.push([x, 150 + Math.sin(x * 0.013) * 14 + Math.sin(x * 0.041) * 5]);
    pts.push([W, 180]);
    poly(g, pts, L.far);
    const ground = g.createLinearGradient(0, 160, 0, HT);
    ground.addColorStop(0, L.ground[0]);
    ground.addColorStop(1, L.ground[1]);
    g.fillStyle = ground;
    g.fillRect(0, 170, W, HT - 170);
    const R = H.rng(faction === 'league' ? 7 : 11);
    for (let i = 0; i < 260; i++) rect(g, R() * W, 175 + R() * (HT - 175), 2, 2, i % 2 ? shade(L.ground[0], 1.12) : shade(L.ground[1], 0.88));
    if (faction === 'league') {
      for (const mx of [90, 640]) {
        rect(g, mx, 134, 8, 24, '#4a5a6a');
        g.strokeStyle = '#4a5a6a';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(mx - 10, 126);
        g.lineTo(mx + 18, 146);
        g.moveTo(mx + 18, 126);
        g.lineTo(mx - 10, 146);
        g.stroke();
        g.lineWidth = 1;
      }
      rect(g, 0, 300, W, 14, L.water);
      rect(g, 0, 300, W, 2, shade(L.water, 1.4));
      for (const bx of [226, 560]) oval(g, bx, 314, 34, 12, L.stone, INK, true);
      rect(g, 0, 314, W, 4, L.path);
    } else {
      for (const [mx, mw] of [[60, 70], [300, 110], [560, 80], [720, 60]]) oval(g, mx, 168, mw / 2, 16, shade(L.far, 0.9), null, true);
      for (const px of [120, 380, 690]) {
        rect(g, px, 130, 2, 40, '#3a2a18');
        poly(g, [[px + 2, 130], [px + 12, 134], [px + 2, 138]], '#c83a2a');
      }
      for (let i = 0; i < 6; i++) oval(g, 60 + i * 130, 296 + (i % 2) * 8, 40, 6, '#e8e4d8');
      rect(g, 0, 314, W, 4, L.path);
    }
    backgrounds.set(faction, c);
    return c;
  };

  const shown = o => {
    const best = prefix => {
      let id = null;
      for (let n = 1; n <= 5; n++) if (o.built.includes(prefix + n)) id = prefix + n;
      return id;
    };
    const ids = new Set();
    for (const id of o.built) {
      if (/^(hall|fort|guild)\d$/.test(id)) continue;
      if (/^dwell\d$/.test(id) && o.built.includes(id + 'u')) continue;
      ids.add(id);
    }
    for (const p of ['hall', 'fort', 'guild']) if (best(p)) ids.add(best(p));
    return LAYOUT[o.faction].filter(e => ids.has(e[0])).sort((a, b) => a[3] + a[5] - (b[3] + b[5]) || a[2] - b[2]);
  };

  const scene = faction => A.FILES['town/' + faction] || null;
  const frameOf = (layer, t) => Math.floor(t * 8) % Math.max(1, layer.frames || 1);
  const drawLayer = (g, layer, t, x) => {
    const img = A.load(layer.src);
    if (img) g.drawImage(img, frameOf(layer, t) * W, 0, W, HT, x || 0, 0, W, HT);
  };

  const hits = new Map();
  const solid = (layer, x, y) => {
    let c = hits.get(layer.src);
    if (!c) {
      const img = A.load(layer.src);
      if (!img) return false;
      c = document.createElement('canvas');
      c.width = W;
      c.height = HT;
      c.getContext('2d').drawImage(img, 0, 0, W, HT, 0, 0, W, HT);
      hits.set(layer.src, c);
    }
    return c.getContext('2d').getImageData(Math.floor(x), Math.floor(y), 1, 1).data[3] > 40;
  };

  const pick = (o, x, y) => {
    const list = shown(o), art = scene(o.faction);
    for (let i = list.length - 1; i >= 0; i--) {
      const [id, , bx, by, bw, bh] = list[i];
      const layer = art && art.layers[id];
      if (layer ? solid(layer, x, y) : x >= bx && y >= by && x < bx + bw && y < by + bh) return id;
    }
    return null;
  };

  const drawEntry = (g, faction, e, t) => {
    const [id, kind, x, y, w, h] = e;
    g.save();
    g.lineWidth = 1;
    KINDS[kind](g, LOOK[faction], x, y, w, h, { up: /u$/.test(id), level: level(id), t });
    g.restore();
  };

  let off = null, tint = null;
  const glow = (g, paint) => {
    if (!off) {
      off = document.createElement('canvas');
      tint = document.createElement('canvas');
      off.width = tint.width = W;
      off.height = tint.height = HT;
    }
    const og = off.getContext('2d'), tg = tint.getContext('2d');
    og.clearRect(0, 0, W, HT);
    paint(og);
    tg.globalCompositeOperation = 'source-over';
    tg.clearRect(0, 0, W, HT);
    tg.drawImage(off, 0, 0);
    tg.globalCompositeOperation = 'source-in';
    tg.fillStyle = '#ffe890';
    tg.fillRect(0, 0, W, HT);
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1], [-1, 1], [1, -1]]) g.drawImage(tint, dx, dy);
    g.drawImage(off, 0, 0);
  };

  const paint = (g, o, t, hover) => {
    const art = scene(o.faction), list = shown(o);
    if (art && A.load(art.layers.background.src)) drawLayer(g, art.layers.background, t);
    else g.drawImage(background(o.faction), 0, 0);
    for (const e of list) {
      const layer = art && art.layers[e[0]];
      const draw = c => (layer ? drawLayer(c, layer, t) : drawEntry(c, o.faction, e, t));
      if (e[0] === hover) glow(g, draw);
      else draw(g);
    }
  };

  const building = (g, faction, id, x, y, w, h, t) => {
    const e = LAYOUT[faction].find(v => v[0] === id);
    if (!e) return;
    const k = Math.min(w / (e[4] + 24), h / (e[5] + 24), 1.6);
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.translate(x + w / 2 - (e[2] + e[4] / 2) * k, y + h - 8 - (e[3] + e[5]) * k);
    g.scale(k, k);
    drawEntry(g, faction, e, t);
    g.restore();
  };

  H.TownDraw = { LAYOUT, LOOK, KINDS, shown, pick, paint, building, background };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
