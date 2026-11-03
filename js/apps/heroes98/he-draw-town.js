(function (H) {
  'use strict';
  const A = H.Art, W = 800, HT = 432, INK = '#1a120a';

  const LOOK = {
    league: { sky: ['#5a78a8', '#c0d2e2'], far: '#5e7e8c', ground: ['#6c8c44', '#55743a'], path: '#a08a5e', wall: '#a8603e', roof: '#4a3440', shed: '#8a6a44', trim: '#e8d8a8', stone: '#a49c8e', wood: '#7a5a32', water: '#3a6a9a', banner: '#d8b040', glow: '#f0d890' },
    barrows: { sky: ['#6e6480', '#e8c8a0'], far: '#8a7a5a', ground: ['#b0a068', '#968650'], path: '#d8d0b8', wall: '#ece2cc', roof: '#c0a87e', shed: '#7a5a3a', trim: '#8a3a2a', stone: '#8c96a2', wood: '#6a4a2a', water: '#5a7a8a', banner: '#3a8a8a', glow: '#f0b060' },
    thicket: { sky: ['#4a6a5a', '#b8ccb0'], far: '#2e4a34', ground: ['#4a6e36', '#34522a'], path: '#7a6a44', wall: '#6a4e2e', roof: '#3e4a26', shed: '#5a4428', trim: '#c0b080', stone: '#6e7a68', wood: '#4e3820', water: '#2e5a58', banner: '#c8a030', glow: '#e8e080' },
    forge: { sky: ['#3a2a2a', '#c8784a'], far: '#2a1c1a', ground: ['#3a3230', '#2a2422'], path: '#6a5a4a', wall: '#4a4240', roof: '#2a2220', shed: '#5a4a3a', trim: '#8a7a6a', stone: '#5a5452', wood: '#4a3a2a', water: '#e0601a', banner: '#d8a030', glow: '#ff9a30' },
    throne: { sky: ['#5a6a98', '#dce4f2'], far: '#8a92aa', ground: ['#c4c8bc', '#a6aa9e'], path: '#ece8e0', wall: '#ece8e2', roof: '#6a8ab8', shed: '#b8bec8', trim: '#d8c890', stone: '#cfd0d8', wood: '#7a6a5a', water: '#5a7ab0', banner: '#c8d4e8', glow: '#dce8ff' },
    tide: { sky: ['#4a88a8', '#d8e8e0'], far: '#3a6a88', ground: ['#c8b888', '#a8986a'], path: '#e0d4a8', wall: '#d8c8b0', roof: '#c88a78', shed: '#8a7a60', trim: '#f0e8d8', stone: '#7a8a90', wood: '#6a5a44', water: '#2a7a98', banner: '#3ab0b0', glow: '#a0e8f0' }
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
    ],
    thicket: [
      ['dwell6', 'pines', 10, 96, 150, 124], ['dwell6u', 'pines', 4, 80, 164, 140],
      ['special2', 'birch', 372, 30, 84, 190],
      ['dwell7', 'lake', 170, 150, 180, 70], ['dwell7u', 'lake', 164, 142, 192, 78],
      ...guilds('totem', 470, 150, 52),
      ['dwell5', 'nest', 540, 70, 90, 150], ['dwell5u', 'nest', 536, 58, 98, 162],
      ['dwell4', 'bog', 644, 170, 148, 50], ['dwell4u', 'bog', 640, 162, 154, 58],
      ['dwell1', 'tussock', 10, 256, 110, 44], ['dwell1u', 'tussock', 8, 250, 116, 50],
      ['dwell2', 'den', 130, 244, 110, 56], ['dwell2u', 'den', 128, 238, 116, 62],
      ['hall1', 'izba', 268, 226, 110, 74], ['hall2', 'izba', 258, 210, 130, 90], ['hall3', 'izba', 248, 188, 150, 112], ['hall4', 'izba', 238, 164, 170, 136],
      ['tavern', 'izba', 418, 240, 92, 60],
      ['market', 'stall', 520, 254, 104, 46],
      ['smith', 'forge', 634, 244, 70, 56],
      ['store', 'izba', 714, 242, 78, 58],
      ['dwell3', 'spring', 14, 318, 124, 56], ['dwell3u', 'spring', 10, 310, 132, 64],
      ['special1', 'fairy', 150, 328, 86, 46],
      ['altar', 'altar', 246, 322, 72, 54],
      ['special3', 'hive', 330, 322, 110, 52],
      ['special4', 'totem', 460, 304, 56, 70],
      ['caravan', 'shed', 530, 324, 112, 50],
      ['shipyard', 'dock', 660, 336, 124, 38],
      ...forts
    ],
    forge: [
      ['dwell7', 'crater', 10, 150, 170, 70], ['dwell7u', 'crater', 4, 142, 182, 78],
      ['special1', 'anvil', 200, 136, 90, 84],
      ['dwell5', 'vent', 300, 150, 110, 70], ['dwell5u', 'vent', 296, 142, 118, 78],
      ...guilds('chimney', 430, 150, 52),
      ['dwell6', 'slagheap', 496, 150, 150, 70], ['dwell6u', 'slagheap', 490, 142, 162, 78],
      ['dwell4', 'forge', 664, 146, 126, 74], ['dwell4u', 'forge', 660, 136, 134, 84],
      ['dwell1', 'house', 10, 244, 98, 56], ['dwell1u', 'house', 8, 238, 104, 62],
      ['dwell2', 'pit', 118, 240, 90, 60], ['dwell2u', 'pit', 116, 234, 96, 66],
      ['hall1', 'hall', 270, 228, 110, 72], ['hall2', 'hall', 260, 212, 130, 88], ['hall3', 'hall', 250, 190, 150, 110], ['hall4', 'hall', 240, 166, 170, 134],
      ['tavern', 'house', 416, 240, 92, 60],
      ['market', 'stall', 518, 254, 104, 46],
      ['smith', 'forge', 632, 244, 70, 56],
      ['store', 'shed', 714, 242, 78, 58],
      ['dwell3', 'glasscave', 14, 318, 124, 56], ['dwell3u', 'glasscave', 10, 310, 132, 64],
      ['special2', 'spikes', 152, 310, 66, 64],
      ['altar', 'altar', 236, 322, 72, 54],
      ['special4', 'brazier', 322, 330, 120, 44],
      ['special3', 'forge', 456, 326, 110, 48],
      ['caravan', 'shed', 590, 324, 100, 50],
      ['shipyard', 'dock', 700, 336, 96, 38],
      ...forts
    ],
    tide: [
      ['dwell7', 'trench', 10, 150, 170, 70], ['dwell7u', 'trench', 4, 142, 182, 78],
      ['special3', 'lighthouse', 200, 16, 70, 204],
      ['dwell5', 'raypen', 284, 150, 130, 70], ['dwell5u', 'raypen', 280, 142, 138, 78],
      ...guilds('coral', 430, 150, 52),
      ['dwell6', 'turtle', 496, 150, 150, 70], ['dwell6u', 'turtle', 490, 142, 162, 78],
      ['dwell4', 'grotto', 664, 146, 126, 74], ['dwell4u', 'grotto', 660, 136, 134, 84],
      ['dwell1', 'shell', 10, 244, 98, 56], ['dwell1u', 'shell', 8, 238, 104, 62],
      ['dwell2', 'shell', 118, 240, 90, 60], ['dwell2u', 'shell', 116, 234, 96, 66],
      ['hall1', 'shell', 270, 226, 108, 74], ['hall2', 'shell', 260, 210, 128, 90], ['hall3', 'shell', 250, 188, 148, 112], ['hall4', 'shell', 240, 164, 168, 136],
      ['tavern', 'shell', 416, 240, 92, 60],
      ['market', 'stall', 518, 254, 104, 46],
      ['smith', 'forge', 632, 244, 70, 56],
      ['store', 'shell', 714, 242, 78, 58],
      ['dwell3', 'lagoon', 14, 318, 124, 56], ['dwell3u', 'lagoon', 10, 310, 132, 64],
      ['special2', 'coral', 152, 310, 66, 64],
      ['altar', 'altar', 236, 322, 72, 54],
      ['special4', 'salina', 322, 330, 120, 44],
      ['special1', 'dock', 456, 336, 120, 38],
      ['caravan', 'shed', 590, 324, 100, 50],
      ['shipyard', 'dock', 700, 336, 96, 38],
      ...forts
    ],
    throne: [
      ['dwell7', 'dome', 10, 150, 170, 70], ['dwell7u', 'dome', 4, 136, 182, 84],
      ['special1', 'throneseat', 196, 100, 92, 120],
      ['dwell5', 'deerpark', 300, 150, 116, 70], ['dwell5u', 'deerpark', 296, 142, 124, 78],
      ...guilds('spire', 430, 150, 52),
      ['dwell6', 'knighthall', 496, 146, 150, 74], ['dwell6u', 'knighthall', 490, 136, 162, 84],
      ['dwell4', 'cloister', 664, 146, 126, 74], ['dwell4u', 'cloister', 660, 136, 134, 84],
      ['dwell1', 'house', 10, 244, 98, 56], ['dwell1u', 'house', 8, 238, 104, 62],
      ['dwell2', 'range', 118, 240, 90, 60], ['dwell2u', 'range', 116, 234, 96, 66],
      ['hall1', 'colonnade', 270, 228, 110, 72], ['hall2', 'colonnade', 260, 212, 130, 88], ['hall3', 'colonnade', 250, 190, 150, 110], ['hall4', 'colonnade', 240, 166, 170, 134],
      ['tavern', 'house', 416, 240, 92, 60],
      ['market', 'stall', 518, 254, 104, 46],
      ['smith', 'forge', 632, 244, 70, 56],
      ['store', 'house', 714, 242, 78, 58],
      ['dwell3', 'mirrorshop', 14, 318, 124, 56], ['dwell3u', 'mirrorshop', 10, 310, 132, 64],
      ['special2', 'mirrorarch', 152, 300, 66, 74],
      ['altar', 'altar', 236, 322, 72, 54],
      ['special3', 'pen', 322, 322, 120, 52],
      ['special4', 'temple', 456, 300, 110, 74],
      ['caravan', 'shed', 590, 324, 100, 50],
      ['shipyard', 'dock', 700, 336, 96, 38],
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
    izba(g, L, x, y, w, h, o) {
      const lv = o.level || 0, lift = h * 0.18;
      for (const px of [x + 6, x + w / 2 - 2, x + w - 10]) rect(g, px, y + h - lift, 4, lift, L.wood, INK);
      KINDS.house(g, L, x, y, w, h - lift, {});
      for (let i = 0; i < lv; i++) flag(g, x + 8 + i * 14, y - 12 - i * 3, L.banner, o.t);
    },
    pines(g, L, x, y, w, h, o) {
      const n = o.up ? 5 : 4;
      for (let i = 0; i < n; i++) {
        const px = x + i * (w - 30) / (n - 1), ph = h - (i % 2) * 24;
        rect(g, px + 12, y + h - 22, 6, 22, L.wood, INK);
        poly(g, [[px, y + h - 18], [px + 15, y + h - ph], [px + 30, y + h - 18]], shade(L.far, 1 + (i % 2) * 0.2), INK);
      }
    },
    birch(g, L, x, y, w, h, o) {
      rect(g, x + w / 2 - 7, y + h * 0.3, 14, h * 0.7, '#e8e4d8', INK);
      for (let i = 0; i < 6; i++) rect(g, x + w / 2 - 7, y + h * 0.36 + i * h * 0.1, 8, 3, '#2a2a22');
      oval(g, x + w / 2, y + h * 0.26, w / 2, h * 0.26, '#6a9a3a', INK);
      oval(g, x + w / 2 - 12, y + h * 0.18, w / 4, h * 0.12, '#8ab04a');
      for (let i = 0; i < 3; i++) rect(g, x + w / 2 - 20 + i * 18, y + h * 0.42, 4, 16 + Math.sin(o.t * 2 + i) * 2, ['#c83a2a', '#e8d8a8', '#3a6a9a'][i]);
    },
    lake(g, L, x, y, w, h, o) {
      oval(g, x + w / 2, y + h * 0.6, w / 2, h * 0.4, L.water, INK);
      oval(g, x + w / 2, y + h * 0.58, w / 2 - 12, h * 0.26, shade(L.water, 1.3));
      const lift = Math.sin(o.t * 1.2) * 3;
      for (let i = 0; i < (o.up ? 3 : 1); i++) {
        const nx = x + w / 2 + (i - (o.up ? 1 : 0)) * 26;
        rect(g, nx - 3, y + h * 0.2 + lift, 6, h * 0.36, '#3a7a3a', INK);
        oval(g, nx + 4, y + h * 0.18 + lift, 9, 6, '#4a8a4a', INK);
      }
    },
    nest(g, L, x, y, w, h, o) {
      rect(g, x + w / 2 - 6, y + h * 0.3, 12, h * 0.7, L.wood, INK);
      oval(g, x + w / 2, y + h * 0.28, w / 2, h * 0.14, L.shed, INK);
      oval(g, x + w / 2, y + h * 0.22, w / 3, h * 0.1, '#2a3a6a', INK);
      oval(g, x + w / 2, y + h * 0.14, 9, 9, '#e8c8a0', INK);
      if (o.up) for (const dx of [-0.42, 0.42]) poly(g, [[x + w / 2 + dx * w, y + h * 0.1], [x + w / 2, y + h * 0.18], [x + w / 2 + dx * w, y + h * 0.26]], '#e0b040', INK);
    },
    bog(g, L, x, y, w, h, o) {
      oval(g, x + w / 2, y + h * 0.65, w / 2, h * 0.35, '#3a4a2a', INK);
      for (let i = 0; i < 5; i++) rect(g, x + 10 + i * (w - 20) / 4, y + h * 0.3, 2, h * 0.34, '#6a7a3a');
      g.fillStyle = 'rgba(190,220,190,' + (0.2 + Math.sin(o.t) * 0.08).toFixed(2) + ')';
      g.beginPath();
      g.ellipse(x + w / 2 + Math.sin(o.t * 0.6) * 12, y + h * 0.5, w / 2 - 10, 8, 0, 0, Math.PI * 2);
      g.fill();
      if (o.up) KINDS.izba(g, L, x + w - 50, y - 10, 44, 40, {});
    },
    tussock(g, L, x, y, w, h, o) {
      for (let i = 0; i < 5; i++) oval(g, x + 12 + i * (w - 24) / 4, y + h - 6 - (i % 2) * 10, 16, 12, shade(L.ground[0], 1.2), INK, true);
      if (o.up) for (let i = 0; i < 3; i++) rect(g, x + 24 + i * 28, y + h - 20 + Math.sin(o.t * 3 + i) * 2, 4, 4, L.glow, INK);
    },
    den(g, L, x, y, w, h, o) {
      oval(g, x + w / 2, y + h, w / 2, h * 0.9, L.stone, INK, true);
      oval(g, x + w / 2, y + h, w / 4, h * 0.5, '#1a1410', INK, true);
      if (o.up) for (const dx of [14, w - 22]) rect(g, x + dx, y + h - 16, 8, 16, L.wood, INK);
    },
    spring(g, L, x, y, w, h, o) {
      oval(g, x + w / 2, y + h * 0.65, w / 2, h * 0.34, L.stone, INK);
      oval(g, x + w / 2, y + h * 0.62, w / 2 - 10, h * 0.22, L.water);
      const up = (o.t * 0.8) % 1;
      g.fillStyle = 'rgba(220,240,255,' + (0.7 * (1 - up)).toFixed(2) + ')';
      g.fillRect(Math.round(x + w / 2 - 2), Math.round(y + h * 0.6 - up * 20), 4, 8);
      if (o.up) for (const dx of [10, w - 16]) rect(g, x + dx, y, 6, h * 0.6, '#e8e4d8', INK);
    },
    fairy(g, L, x, y, w, h, o) {
      for (let k = 0; k < 9; k++) {
        const a = k / 9 * Math.PI * 2, gx = x + w / 2 + Math.cos(a) * (w / 2 - 6), gy = y + h / 2 + Math.sin(a) * (h / 2 - 6);
        rect(g, gx - 1, gy, 2, 4, '#e8e4d8');
        rect(g, gx - 4, gy - 3, 8, 3, '#c04a3a', INK);
      }
      g.fillStyle = 'rgba(200,255,160,' + (0.3 + Math.sin(o.t * 3) * 0.15).toFixed(2) + ')';
      g.beginPath();
      g.ellipse(x + w / 2, y + h / 2, w / 4, h / 4, 0, 0, Math.PI * 2);
      g.fill();
    },
    hive(g, L, x, y, w, h, o) {
      for (let i = 0; i < 3; i++) {
        const px = x + 8 + i * (w - 16) / 3;
        rect(g, px + 4, y + h * 0.3, 18, h * 0.7, L.shed, INK);
        oval(g, px + 13, y + h * 0.32, 12, 10, '#d8a030', INK);
      }
      for (let i = 0; i < 4; i++) rect(g, x + w / 2 + Math.sin(o.t * 2 + i * 2) * (w / 2 - 6), y + 8 + Math.cos(o.t * 3 + i) * 6, 2, 2, '#f0d040');
    },
    crater(g, L, x, y, w, h, o) {
      poly(g, [[x, y + h], [x + w * 0.3, y + h * 0.2], [x + w * 0.7, y + h * 0.2], [x + w, y + h]], L.stone, INK);
      oval(g, x + w / 2, y + h * 0.22, w * 0.2, 6, '#ff6a1a', INK);
      g.fillStyle = 'rgba(255,120,30,' + (0.5 + Math.sin(o.t * 3) * 0.2).toFixed(2) + ')';
      for (let i = 0; i < (o.up ? 3 : 2); i++) g.fillRect(Math.round(x + w * (0.38 + i * 0.1)), Math.round(y + h * 0.25), 4, Math.round(h * 0.7));
      smoke(g, x + w / 2, y + h * 0.15, o.t);
    },
    anvil(g, L, x, y, w, h, o) {
      rect(g, x + w * 0.2, y + h * 0.55, w * 0.6, h * 0.12, '#3a3634', INK);
      rect(g, x + w * 0.38, y + h * 0.67, w * 0.24, h * 0.2, '#3a3634', INK);
      rect(g, x + w * 0.25, y + h * 0.87, w * 0.5, h * 0.13, '#2a2624', INK);
      g.fillStyle = 'rgba(255,150,40,' + (0.6 + Math.sin(o.t * 6) * 0.3).toFixed(2) + ')';
      g.fillRect(Math.round(x + w * 0.3), Math.round(y + h * 0.5), Math.round(w * 0.4), 4);
      rect(g, x + w * 0.6, y + h * 0.1, 8, h * 0.45, L.wood, INK);
      rect(g, x + w * 0.52, y + h * 0.06, 24, 10, '#5a5452', INK);
    },
    vent(g, L, x, y, w, h, o) {
      oval(g, x + w / 2, y + h * 0.8, w / 2 - 4, h * 0.2, L.stone, INK);
      for (let i = 0; i < (o.up ? 4 : 3); i++) {
        const vx = x + w * (0.25 + i * 0.17), puff = Math.sin(o.t * 3 + i) * 4;
        rect(g, vx - 3, y + h * 0.5, 6, h * 0.3, '#6a6460', INK);
        oval(g, vx, y + h * 0.35 + puff, 10, 8, 'rgba(230,230,230,0.6)');
      }
    },
    slagheap(g, L, x, y, w, h, o) {
      poly(g, [[x, y + h], [x + w * 0.2, y + h * 0.35], [x + w * 0.45, y + h * 0.2], [x + w * 0.75, y + h * 0.4], [x + w, y + h]], '#4a4442', INK);
      for (let i = 0; i < 5; i++) rect(g, x + w * (0.15 + i * 0.15), y + h * (0.6 + (i % 2) * 0.12), 8, 6, i % 2 ? '#2a2422' : '#6a5a50');
      g.fillStyle = 'rgba(255,110,30,0.6)';
      g.fillRect(Math.round(x + w * 0.4), Math.round(y + h * 0.5), 6, Math.round(h * 0.5));
      if (o.up) flag(g, x + w * 0.45, y + h * 0.1, L.banner, o.t);
    },
    pit(g, L, x, y, w, h, o) {
      oval(g, x + w / 2, y + h * 0.65, w / 2, h * 0.34, L.stone, INK);
      oval(g, x + w / 2, y + h * 0.65, w / 2 - 8, h * 0.22, '#ff6a1a');
      g.fillStyle = 'rgba(255,220,80,' + (0.4 + Math.sin(o.t * 4) * 0.2).toFixed(2) + ')';
      g.fillRect(Math.round(x + w * 0.3), Math.round(y + h * 0.6), Math.round(w * 0.4), 3);
      if (o.up) flag(g, x + 8, y, L.banner, o.t);
    },
    glasscave(g, L, x, y, w, h, o) {
      poly(g, [[x, y + h], [x + w * 0.15, y + h * 0.3], [x + w * 0.5, y + 4], [x + w * 0.85, y + h * 0.3], [x + w, y + h]], '#1a1618', INK);
      for (let i = 0; i < 6; i++) poly(g, [[x + w * (0.2 + i * 0.11), y + h * 0.5], [x + w * (0.24 + i * 0.11), y + h * 0.2], [x + w * (0.28 + i * 0.11), y + h * 0.5]], i % 2 ? '#3a2a3a' : '#5a3a4a', INK);
      oval(g, x + w / 2, y + h, w * 0.2, h * 0.4, '#0a0808', INK, true);
      g.strokeStyle = 'rgba(220,220,230,0.4)';
      g.beginPath();
      g.moveTo(x + w * 0.3, y + h * 0.6);
      g.lineTo(x + w * 0.7, y + h * 0.8);
      g.moveTo(x + w * 0.7, y + h * 0.6);
      g.lineTo(x + w * 0.3, y + h * 0.8);
      g.stroke();
    },
    spikes(g, L, x, y, w, h, o) {
      for (let i = 0; i < 5; i++) poly(g, [[x + i * w / 5, y + h], [x + i * w / 5 + w / 10, y + h * (0.1 + (i % 2) * 0.2)], [x + (i + 1) * w / 5, y + h]], '#1a1618', INK);
      g.fillStyle = 'rgba(160,90,220,0.4)';
      g.fillRect(Math.round(x + w * 0.45), Math.round(y + h * 0.3), 3, Math.round(h * 0.6));
    },
    brazier(g, L, x, y, w, h, o) {
      rect(g, x + 6, y + h * 0.5, w - 12, h * 0.5, '#4a4442', INK);
      for (let i = 0; i < 3; i++) {
        const bx = x + w * (0.2 + i * 0.3);
        rect(g, bx - 8, y + h * 0.35, 16, h * 0.15, '#2a2422', INK);
        g.fillStyle = 'rgba(255,' + (100 + i * 30) + ',30,' + (0.6 + Math.sin(o.t * 5 + i) * 0.25).toFixed(2) + ')';
        g.fillRect(Math.round(bx - 5), Math.round(y + h * 0.1), 10, Math.round(h * 0.25));
      }
    },
    chimney(g, L, x, y, w, h, o) {
      const lv = o.level || 1;
      rect(g, x + w * 0.25, y + h * 0.2, w * 0.5, h * 0.8, L.wall, INK);
      for (let i = 0; i < lv; i++) rect(g, x + w * 0.25, y + h * (0.3 + i * 0.14), w * 0.5, 3, '#ff8a2a');
      rect(g, x + w * 0.35, y, w * 0.3, h * 0.22, '#2a2220', INK);
      smoke(g, x + w / 2, y - 2, o.t);
    },
    shell(g, L, x, y, w, h, o) {
      const lv = o.level || 0, lift = h * 0.16;
      for (const px of [x + 6, x + w / 2 - 2, x + w - 10]) rect(g, px, y + h - lift, 4, lift, L.wood, INK);
      oval(g, x + w / 2, y + h - lift, w / 2 - 2, h * 0.76, L.wall, INK, true);
      for (let i = 1; i < 5; i++) {
        g.strokeStyle = shade(L.wall, 0.8);
        g.beginPath();
        g.moveTo(x + w / 2, y + h - lift);
        g.lineTo(x + w * i / 5, y + h * 0.2);
        g.stroke();
      }
      rect(g, x + w / 2 - 6, y + h - lift - 16, 12, 16, shade(L.wood, 0.7), INK);
      for (let i = 0; i < lv; i++) flag(g, x + 8 + i * 14, y - 10 - i * 3, L.banner, o.t);
    },
    lighthouse(g, L, x, y, w, h, o) {
      poly(g, [[x, y + h], [x + w * 0.15, y + h * 0.82], [x + w * 0.85, y + h * 0.82], [x + w, y + h]], L.stone, INK);
      poly(g, [[x + w * 0.3, y + h * 0.84], [x + w * 0.38, y + h * 0.2], [x + w * 0.62, y + h * 0.2], [x + w * 0.7, y + h * 0.84]], L.trim, INK);
      for (let i = 0; i < 3; i++) rect(g, x + w * 0.34, y + h * (0.32 + i * 0.18), w * 0.32, 8, L.roof);
      rect(g, x + w * 0.34, y + h * 0.1, w * 0.32, h * 0.1, '#2a3a4a', INK);
      g.fillStyle = 'rgba(255,240,170,' + (0.6 + Math.sin(o.t * 2) * 0.3).toFixed(2) + ')';
      g.fillRect(Math.round(x + w * 0.36), Math.round(y + h * 0.115), Math.round(w * 0.28), Math.round(h * 0.07));
      poly(g, [[x + w * 0.3, y + h * 0.1], [x + w / 2, y], [x + w * 0.7, y + h * 0.1]], L.roof, INK);
    },
    trench(g, L, x, y, w, h, o) {
      oval(g, x + w / 2, y + h * 0.6, w / 2, h * 0.4, '#123a4a', INK);
      oval(g, x + w / 2, y + h * 0.6, w / 2 - 14, h * 0.26, '#0a2230');
      for (let i = 0; i < (o.up ? 5 : 3); i++) {
        const wx = x + w * (0.2 + i * 0.16), sway = Math.sin(o.t * 1.5 + i) * 4;
        poly(g, [[wx - 4, y + h * 0.6], [wx + sway, y + h * 0.08], [wx + 4, y + h * 0.6]], '#5a4a7a', INK);
      }
    },
    raypen(g, L, x, y, w, h, o) {
      for (const px of [x + 4, x + w / 2 - 2, x + w - 8]) rect(g, px, y + h * 0.3, 4, h * 0.7, L.wood, INK);
      rect(g, x, y + h * 0.3, w, 4, L.wood, INK);
      const bob = Math.sin(o.t * 2) * 3;
      poly(g, [[x + w / 2 - 34, y + h * 0.5 + bob], [x + w / 2, y + h * 0.1 + bob], [x + w / 2 + 34, y + h * 0.5 + bob], [x + w / 2, y + h * 0.42 + bob]], o.up ? '#6a7ac8' : '#5a7a8a', INK);
    },
    turtle(g, L, x, y, w, h, o) {
      rect(g, x + 12, y + h - 10, 14, 10, '#4a6a4a', INK);
      rect(g, x + w - 26, y + h - 10, 14, 10, '#4a6a4a', INK);
      oval(g, x + w - 8, y + h * 0.66, 10, 8, '#5a7a5a', INK);
      oval(g, x + w / 2, y + h - 6, w / 2 - 10, h * 0.62, '#4a7a5a', INK, true);
      for (let i = 0; i < 3; i++) oval(g, x + w * (0.28 + i * 0.22), y + h * 0.62, 12, 8, '#3a6248', INK);
      rect(g, x + w / 2 - 10, y + h * 0.05, 20, h * 0.3, L.wood, INK);
      if (o.up) flag(g, x + w / 2, y - 12, L.banner, o.t);
    },
    grotto(g, L, x, y, w, h, o) {
      poly(g, [[x, y + h], [x + w * 0.1, y + h * 0.4], [x + w * 0.4, y + 6], [x + w * 0.75, y + h * 0.2], [x + w, y + h]], L.stone, INK);
      oval(g, x + w / 2, y + h, w * 0.26, h * 0.5, '#0a2230', INK, true);
      g.fillStyle = 'rgba(160,232,240,' + (0.25 + Math.sin(o.t * 2) * 0.15).toFixed(2) + ')';
      g.beginPath();
      g.ellipse(x + w / 2, y + h - 12, w * 0.14, 8, 0, 0, Math.PI * 2);
      g.fill();
      if (o.up) for (const dx of [0.2, 0.8]) rect(g, x + w * dx - 3, y + h - 22, 6, 22, L.roof, INK);
    },
    lagoon(g, L, x, y, w, h, o) {
      oval(g, x + w / 2, y + h * 0.65, w / 2, h * 0.34, L.stone, INK);
      oval(g, x + w / 2, y + h * 0.62, w / 2 - 8, h * 0.24, L.water);
      for (let i = 0; i < (o.up ? 4 : 3); i++) {
        const jx = x + w * (0.25 + i * 0.18), jy = y + h * 0.5 + Math.sin(o.t * 2 + i) * 3;
        oval(g, jx, jy, 7, 6, 'rgba(240,220,255,0.75)', INK, true);
        rect(g, jx - 3, jy, 2, 6, 'rgba(240,220,255,0.6)');
        rect(g, jx + 2, jy, 2, 6, 'rgba(240,220,255,0.6)');
      }
    },
    coral(g, L, x, y, w, h, o) {
      const lv = o.level || 2;
      rect(g, x + w / 2 - 5, y + h * 0.25, 10, h * 0.75, '#d86a5a', INK);
      for (let i = 0; i < Math.min(5, lv + 1); i++) {
        const dy = y + h * (0.28 + i * 0.13), dir = i % 2 ? 1 : -1;
        rect(g, x + w / 2 + (dir > 0 ? 3 : -w * 0.38), dy, w * 0.36, 7, '#d86a5a', INK);
        oval(g, x + w / 2 + dir * w * 0.36, dy + 2, 7, 7, i % 2 ? '#e88a78' : '#f0a890', INK);
      }
      oval(g, x + w / 2, y + h * 0.2, 9, 8, '#f0a890', INK);
    },
    salina(g, L, x, y, w, h, o) {
      const n = 3;
      for (let i = 0; i < n; i++) {
        rect(g, x + i * w / n + 3, y + h * 0.4, w / n - 6, h * 0.55, '#e8e4d8', INK);
        rect(g, x + i * w / n + 6, y + h * 0.5, w / n - 12, h * 0.35, L.water);
      }
      for (let i = 0; i < 3; i++) oval(g, x + 10 + i * (w - 20) / 2, y + h * 0.34, 8, 8, '#f4f4ec', INK, true);
    },
    colonnade(g, L, x, y, w, h, o) {
      const lv = o.level || 1, beam = y + h * 0.38, n = 2 + lv;
      if (lv >= 4) for (const tx of [x - 8, x + w - 8]) {
        rect(g, tx, y + h * 0.12, 16, h * 0.88, L.wall, INK);
        oval(g, tx + 8, y + h * 0.12, 8, 7, L.roof, INK, true);
      }
      rect(g, x, y + h - 8, w, 8, L.stone, INK);
      if (lv >= 2) rect(g, x + 6, beam + 8, w - 12, y + h - beam - 16, shade(L.wall, 0.8), INK);
      for (let i = 0; i < n; i++) rect(g, x + 6 + i * (w - 18) / (n - 1), beam + 8, 6, y + h - beam - 16, L.wall, INK);
      rect(g, x, beam, w, 8, L.wall, INK);
      poly(g, [[x - 2, beam], [x + w / 2, y + h * 0.2], [x + w + 2, beam]], L.wall, INK);
      if (lv >= 3) oval(g, x + w / 2, y + h * 0.21, w * 0.16, h * 0.18, L.roof, INK, true);
      flag(g, x + w / 2 - 1, y + h * 0.02 - 14, L.banner, o.t);
    },
    dome(g, L, x, y, w, h, o) {
      rect(g, x + w * 0.15, y + h * 0.5, w * 0.7, h * 0.5, L.wall, INK);
      for (let i = 0; i < 5; i++) rect(g, x + w * (0.2 + i * 0.14), y + h * 0.56, 5, h * 0.4, shade(L.wall, 0.82));
      oval(g, x + w / 2, y + h * 0.52, w * 0.35, h * 0.4, '#c8d8f0', INK, true);
      g.fillStyle = 'rgba(235,242,255,' + (0.45 + Math.sin(o.t * 2) * 0.2).toFixed(2) + ')';
      g.beginPath();
      g.moveTo(x + w / 2, y + h * 0.1 - (o.up ? 14 : 0));
      g.lineTo(x + w / 2 + 12, y + h * 0.34);
      g.lineTo(x + w / 2, y + h * 0.46);
      g.lineTo(x + w / 2 - 12, y + h * 0.34);
      g.closePath();
      g.fill();
      if (o.up) flag(g, x + w * 0.15, y + h * 0.3, L.banner, o.t);
    },
    throneseat(g, L, x, y, w, h, o) {
      for (let i = 0; i < 3; i++) rect(g, x + i * 8, y + h - 10 - i * 10, w - i * 16, 10, shade(L.stone, 1 - i * 0.05), INK);
      rect(g, x + w / 2 - 14, y + h * 0.22, 28, h * 0.48, L.wall, INK);
      oval(g, x + w / 2, y + h * 0.22, 14, 12, L.wall, INK, true);
      rect(g, x + w / 2 - 20, y + h * 0.56, 40, 10, L.wall, INK);
      rect(g, x + w / 2 - 20, y + h * 0.42, 6, 18, L.wall, INK);
      rect(g, x + w / 2 + 14, y + h * 0.42, 6, 18, L.wall, INK);
      g.fillStyle = 'rgba(225,235,255,' + (0.3 + Math.sin(o.t * 1.5) * 0.15).toFixed(2) + ')';
      g.beginPath();
      g.arc(x + w / 2, y + h * 0.08, 10, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = L.trim;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x + w / 2, y + h * 0.22, 7, Math.PI * 0.7, Math.PI * 2.3);
      g.stroke();
      g.lineWidth = 1;
    },
    deerpark(g, L, x, y, w, h, o) {
      KINDS.pen(g, L, x, y, w, h, o);
      for (let i = 0; i < (o.up ? 3 : 2); i++) {
        const dx = x + 20 + i * 30, dy = y + h * 0.62 + Math.sin(o.t * 1.2 + i) * 1.5;
        oval(g, dx, dy, 10, 5, '#f0f0f4', INK);
        rect(g, dx - 7, dy + 3, 2, 8, '#f0f0f4');
        rect(g, dx + 5, dy + 3, 2, 8, '#f0f0f4');
        rect(g, dx + 8, dy - 9, 3, 8, '#f0f0f4', INK);
        g.strokeStyle = '#c8d0e0';
        g.beginPath();
        g.moveTo(dx + 10, dy - 9);
        g.lineTo(dx + 6, dy - 17);
        g.moveTo(dx + 10, dy - 9);
        g.lineTo(dx + 14, dy - 17);
        g.stroke();
      }
    },
    spire(g, L, x, y, w, h, o) {
      const lv = o.level || 1;
      rect(g, x + w * 0.28, y + h * 0.22, w * 0.44, h * 0.78, L.wall, INK);
      for (let i = 0; i < lv; i++) rect(g, x + w * 0.28, y + h * (0.32 + i * 0.13), w * 0.44, 3, '#a8c0e8');
      poly(g, [[x + w * 0.24, y + h * 0.24], [x + w / 2, y + 2], [x + w * 0.76, y + h * 0.24]], L.roof, INK);
      g.strokeStyle = '#f0f0e0';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x + w / 2, y - 2, 4, Math.PI * 0.7, Math.PI * 2.3);
      g.stroke();
      g.lineWidth = 1;
    },
    knighthall(g, L, x, y, w, h, o) {
      KINDS.house(g, Object.assign({}, L, { roof: shade(L.roof, 0.9) }), x, y + h * 0.1, w, h * 0.9, {});
      for (let i = 0; i < 3; i++) rect(g, x + w * (0.2 + i * 0.3) - 3, y + h * 0.48, 6, 16, '#b8d0f0', INK);
      if (o.up) for (const fx of [x + 6, x + w - 18]) flag(g, fx, y - 4, L.banner, o.t);
    },
    cloister(g, L, x, y, w, h, o) {
      const n = o.up ? 5 : 4, step = (w - 16) / n;
      rect(g, x, y + h * 0.3, w, h * 0.7, L.wall, INK);
      for (let i = 0; i < n; i++) {
        const ax = x + 8 + i * step;
        rect(g, ax + 3, y + h * 0.62, step - 6, h * 0.38, '#2a3448');
        oval(g, ax + step / 2, y + h * 0.62, step / 2 - 3, h * 0.16, '#2a3448', null, true);
      }
      poly(g, [[x - 2, y + h * 0.32], [x + 8, y + h * 0.08], [x + w - 8, y + h * 0.08], [x + w + 2, y + h * 0.32]], L.roof, INK);
      g.fillStyle = 'rgba(220,232,255,' + (0.35 + Math.sin(o.t * 2) * 0.2).toFixed(2) + ')';
      g.fillRect(Math.round(x + 8 + step + 4), Math.round(y + h * 0.66), Math.round(step - 8), Math.round(h * 0.3));
    },
    range(g, L, x, y, w, h, o) {
      rect(g, x, y + h - 10, w, 10, L.path, INK);
      for (let i = 0; i < (o.up ? 3 : 2); i++) {
        const tx = x + 14 + i * (w - 28) / 2;
        rect(g, tx - 1, y + h * 0.42, 3, h * 0.48, L.wood, INK);
        oval(g, tx, y + h * 0.36, 10, 10, '#e8e4dc', INK);
        oval(g, tx, y + h * 0.36, 6, 6, '#6a8ab8');
        oval(g, tx, y + h * 0.36, 2, 2, '#c8a030');
      }
      rect(g, x + w - 14, y + h * 0.14, 4, h * 0.76, L.wood, INK);
    },
    mirrorshop(g, L, x, y, w, h, o) {
      KINDS.shed(g, L, x, y, w, h, {});
      for (let i = 0; i < (o.up ? 3 : 2); i++) {
        const mx = x + 14 + i * 34;
        rect(g, mx, y + h * 0.3, 16, 22, '#c8d8f0', INK);
        g.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.sin(o.t * 3 + i) * 0.3).toFixed(2) + ')';
        g.fillRect(Math.round(mx + 3), Math.round(y + h * 0.3 + 3), 3, 16);
      }
      if (o.up) flag(g, x + w - 12, y - 14, L.banner, o.t);
    },
    mirrorarch(g, L, x, y, w, h, o) {
      rect(g, x + 10, y + h * 0.32, w - 20, h * 0.68, '#b8c8e8', INK);
      oval(g, x + w / 2, y + h * 0.33, w / 2 - 10, h * 0.2, '#b8c8e8', null, true);
      rect(g, x, y + h * 0.25, 10, h * 0.75, L.wall, INK);
      rect(g, x + w - 10, y + h * 0.25, 10, h * 0.75, L.wall, INK);
      g.strokeStyle = INK;
      g.lineWidth = 6;
      g.beginPath();
      g.ellipse(x + w / 2, y + h * 0.33, w / 2 - 5, h * 0.22, 0, Math.PI, Math.PI * 2);
      g.stroke();
      g.strokeStyle = L.wall;
      g.lineWidth = 4;
      g.stroke();
      g.lineWidth = 1;
      g.fillStyle = 'rgba(255,255,255,0.6)';
      g.fillRect(Math.round(x + 12 + ((o.t * 20) % (w - 26))), Math.round(y + h * 0.36), 3, Math.round(h * 0.6));
    },
    temple(g, L, x, y, w, h, o) {
      rect(g, x, y + h - 8, w, 8, L.stone, INK);
      rect(g, x + 4, y + h - 14, w - 8, 6, L.stone, INK);
      for (let i = 0; i < 5; i++) rect(g, x + 8 + i * (w - 22) / 4, y + h * 0.4, 6, h * 0.6 - 14, L.wall, INK);
      rect(g, x + 2, y + h * 0.33, w - 4, 8, L.wall, INK);
      poly(g, [[x, y + h * 0.33], [x + w / 2, y + h * 0.08], [x + w, y + h * 0.33]], L.wall, INK);
      g.fillStyle = 'rgba(220,230,255,' + (0.5 + Math.sin(o.t * 2) * 0.25).toFixed(2) + ')';
      g.beginPath();
      g.arc(x + w / 2, y + h * 0.23, 5, 0, Math.PI * 2);
      g.fill();
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
    const R = H.rng(faction === 'league' ? 7 : faction === 'barrows' ? 11 : faction === 'thicket' ? 13 : faction === 'tide' ? 17 : faction === 'throne' ? 23 : 19);
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
    } else if (faction === 'forge') {
      poly(g, [[480, 150], [600, 40], [650, 40], [790, 150]], '#2a1c1a', INK);
      oval(g, 625, 42, 26, 6, '#ff6a1a');
      smoke(g, 620, 36, 0);
      smoke(g, 632, 30, 1);
      for (let i = 0; i < 4; i++) {
        g.fillStyle = 'rgba(255,100,20,0.55)';
        g.fillRect(560 + i * 22, 60 + i * 20, 4, 90 - i * 20);
      }
      rect(g, 0, 300, W, 12, '#ff6a1a');
      rect(g, 0, 300, W, 2, '#ffd060');
      for (const bx of [226, 560]) oval(g, bx, 312, 34, 12, L.stone, INK, true);
      rect(g, 0, 312, W, 4, L.path);
    } else if (faction === 'tide') {
      rect(g, 0, 150, W, 26, L.water);
      rect(g, 0, 150, W, 2, shade(L.water, 1.4));
      for (let i = 0; i < 8; i++) oval(g, 50 + i * 100, 158 + (i % 3) * 4, 30, 3, shade(L.water, 1.25));
      rect(g, 0, 300, W, 16, L.water);
      rect(g, 0, 300, W, 2, shade(L.water, 1.4));
      for (const ax of [120, 620]) oval(g, ax, 316, 32, 14, '#d86a5a', INK, true);
      rect(g, 0, 316, W, 4, L.path);
    } else if (faction === 'throne') {
      g.fillStyle = 'rgba(232,238,255,0.25)';
      g.beginPath();
      g.arc(640, 62, 40, 0, Math.PI * 2);
      g.fill();
      oval(g, 640, 62, 24, 24, '#eef0f8');
      rect(g, 0, 152, W, 24, '#4a6a98');
      rect(g, 0, 152, W, 2, '#9ab8e0');
      for (let i = 0; i < 7; i++) oval(g, 60 + i * 115, 162 + (i % 2) * 5, 26, 2, '#6a8ab8');
      for (const cx of [40, 92, 708, 760]) {
        rect(g, cx, 108, 8, 44, '#d8dce4', INK);
        rect(g, cx - 3, 104, 14, 5, '#d8dce4', INK);
      }
      rect(g, 36, 98, 72, 6, '#d8dce4', INK);
      poly(g, [[300, 432], [384, 318], [416, 318], [500, 432]], 'rgba(200,215,255,0.22)');
      rect(g, 0, 314, W, 4, L.path);
    } else if (faction === 'thicket') {
      for (let i = 0; i < 26; i++) {
        const px = i * 32 - 10, ph = 34 + (i * 17) % 40;
        poly(g, [[px, 176], [px + 16, 176 - ph], [px + 32, 176]], shade(L.far, 0.82 + (i % 3) * 0.09));
      }
      g.fillStyle = 'rgba(210,225,210,0.22)';
      g.fillRect(0, 150, W, 26);
      for (let i = 0; i < 5; i++) oval(g, 80 + i * 170, 300 + (i % 2) * 8, 46, 7, shade(L.water, 1.1));
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
