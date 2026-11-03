(function (H) {
  'use strict';
  const T = 32, CH = 16, MD = H.MapData;
  const COLORS = {
    meadow: ['#4f7d3a', '#578742', '#477236'], steppe: ['#9a9a5a', '#a6a262', '#8e8c52'], palegrass: ['#b0b89a', '#bcc4a6', '#a4ac8e'],
    forest: ['#2f5a2a', '#376430', '#294f24'], swamp: ['#4a5a3a', '#3e4c34', '#566648'], sand: ['#d8c890', '#e2d49e', '#ccbc84'],
    saltflat: ['#e0e0d8', '#eaeae4', '#d2d2ca'], highland: ['#c8ccd2', '#d6dae0', '#b8bcc4'], ash: ['#5a5452', '#645e5c', '#4e4846'],
    lava: ['#c0401a', '#d8601a', '#a83012'], water: ['#2a5a8a', '#2f6294', '#26527e'], cave: ['#4a4038', '#54483e', '#3e362e'],
    fungal: ['#5a4a6a', '#665478', '#4e405e'], rock: ['#6a6460', '#5e5854', '#78726c'], thicket: ['#1e3a1c', '#244420', '#183018']
  };
  const ROAD = [null, '#8a6a40', '#9a9488', '#e8e8f0'];
  const RES = { gold: '#f0c040', wood: '#8a5a2a', ore: '#8a8a92', salt: '#f4f4f0', amber: '#e09020', sulfur: '#e0e040', moonsilver: '#b8c8e8' };
  const hash = (c, r, k) => (((c * 73856093) ^ (r * 19349663) ^ ((k + 1) * 83492791)) >>> 0) % 1000 / 1000;

  const tile = (g, M, l, c, r, x, y) => {
    const t = MD.terrainAt(M, l, c, r), col = COLORS[t.id];
    g.fillStyle = col[Math.floor(hash(c, r, 0) * 3)];
    g.fillRect(x, y, T, T);
    for (let k = 0; k < 7; k++) {
      g.fillStyle = col[1 + (k % 2)];
      g.fillRect(x + Math.floor(hash(c, r, k + 3) * 30), y + Math.floor(hash(c, r, k + 11) * 30), 2, 2);
    }
    if (t.id === 'forest' || t.id === 'swamp' || t.id === 'thicket') {
      g.fillStyle = t.id === 'thicket' ? 'rgba(4,16,6,0.6)' : t.id === 'forest' ? 'rgba(10,30,10,0.35)' : 'rgba(20,40,40,0.45)';
      for (let k = 0; k < (t.id === 'thicket' ? 6 : 3); k++) {
        g.beginPath();
        g.ellipse(x + 6 + hash(c, r, k + 20) * 20, y + 6 + hash(c, r, k + 30) * 20, 5, 3, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    const place = H.FIELDS[M.over[l][MD.idx(M, c, r)]];
    if (place) {
      g.fillStyle = place.color;
      g.fillRect(x, y, T, T);
    }
    for (const [dc, dr, ex, ey, ew, eh] of [[0, -1, 0, 0, T, 2], [0, 1, 0, T - 2, T, 2], [-1, 0, 0, 0, 2, T], [1, 0, T - 2, 0, 2, T]]) {
      const nc = c + dc, nr = r + dr;
      if (!MD.inside(M, nc, nr)) continue;
      const n = MD.terrainAt(M, l, nc, nr);
      if (n.id === t.id) continue;
      if (t.id === 'water' || n.id === 'water') g.fillStyle = t.id === 'water' ? 'rgba(200,230,255,0.45)' : 'rgba(20,40,60,0.35)';
      else if (n.id === 'rock' || t.id === 'rock') g.fillStyle = 'rgba(0,0,0,0.35)';
      else g.fillStyle = 'rgba(0,0,0,0.12)';
      g.fillRect(x + ex, y + ey, ew, eh);
    }
  };

  const RIVER = [null, '#4a86b8', '#6a7a58'];
  const riverTile = (g, M, l, c, r, x, y) => {
    const kind = MD.riverAt(M, l, c, r);
    if (!kind) return;
    g.strokeStyle = RIVER[kind];
    g.lineWidth = 8;
    g.lineCap = 'round';
    let links = 0;
    for (const [dc, dr] of H.Path.DIRS) {
      const nc = c + dc, nr = r + dr;
      if (!MD.inside(M, nc, nr) || !MD.riverAt(M, l, nc, nr)) continue;
      if (dc && dr && (MD.riverAt(M, l, c + dc, r) || MD.riverAt(M, l, c, r + dr))) continue;
      links++;
      g.beginPath();
      g.moveTo(x + 16, y + 16);
      g.lineTo(x + 16 + dc * 16, y + 16 + dr * 16);
      g.stroke();
    }
    if (!links) {
      g.fillStyle = RIVER[kind];
      g.fillRect(x + 12, y + 12, 8, 8);
    }
  };

  const roadTile = (g, M, l, c, r, x, y) => {
    const kind = MD.roadAt(M, l, c, r);
    if (!kind) return;
    g.strokeStyle = ROAD[kind];
    g.lineWidth = 10;
    g.lineCap = 'round';
    let links = 0;
    for (const [dc, dr] of H.Path.DIRS) {
      const nc = c + dc, nr = r + dr;
      if (!MD.inside(M, nc, nr) || !MD.roadAt(M, l, nc, nr)) continue;
      if (dc && dr && (MD.roadAt(M, l, c + dc, r) || MD.roadAt(M, l, c, r + dr))) continue;
      links++;
      g.beginPath();
      g.moveTo(x + 16, y + 16);
      g.lineTo(x + 16 + dc * 16, y + 16 + dr * 16);
      g.stroke();
    }
    if (!links) {
      g.fillStyle = ROAD[kind];
      g.fillRect(x + 11, y + 11, 10, 10);
    }
  };

  const chunk = (cache, M, l, cx, cy) => {
    const key = l + ':' + cx + ':' + cy;
    if (cache.has(key)) return cache.get(key);
    const cv = document.createElement('canvas');
    cv.width = CH * T;
    cv.height = CH * T;
    const g = cv.getContext('2d');
    for (let r = cy * CH; r < Math.min(M.h, cy * CH + CH); r++) for (let c = cx * CH; c < Math.min(M.w, cx * CH + CH); c++) tile(g, M, l, c, r, (c - cx * CH) * T, (r - cy * CH) * T);
    for (let r = cy * CH; r < Math.min(M.h, cy * CH + CH); r++) for (let c = cx * CH; c < Math.min(M.w, cx * CH + CH); c++) riverTile(g, M, l, c, r, (c - cx * CH) * T, (r - cy * CH) * T);
    for (let r = cy * CH; r < Math.min(M.h, cy * CH + CH); r++) for (let c = cx * CH; c < Math.min(M.w, cx * CH + CH); c++) roadTile(g, M, l, c, r, (c - cx * CH) * T, (r - cy * CH) * T);
    cache.set(key, cv);
    return cv;
  };

  const terrain = (g, cache, M, l, cam, view) => {
    const c0 = Math.floor(cam.x / (CH * T)), r0 = Math.floor(cam.y / (CH * T)), c1 = Math.floor((cam.x + view.w - 1) / (CH * T)), r1 = Math.floor((cam.y + view.h - 1) / (CH * T));
    for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
      if (cx < 0 || cy < 0 || cx * CH >= M.w || cy * CH >= M.h) continue;
      g.drawImage(chunk(cache, M, l, cx, cy), view.x + cx * CH * T - cam.x, view.y + cy * CH * T - cam.y);
    }
  };

  const flag = (g, x, y, color, t) => {
    g.fillStyle = '#4a3018';
    g.fillRect(x, y, 2, 22);
    g.fillStyle = color;
    const wave = Math.sin(t * 6 + x) * 1.5;
    g.beginPath();
    g.moveTo(x + 2, y);
    g.lineTo(x + 14, y + 3 + wave);
    g.lineTo(x + 2, y + 9);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)';
    g.lineWidth = 1;
    g.stroke();
  };

  const fortOf = o => [3, 2, 1].find(n => o.built.includes('fort' + n)) || 0;

  const town = (g, o, x, y, t, color) => {
    const pic = H.Art.image('townmap/' + o.faction + '-' + Math.max(1, fortOf(o)));
    if (pic) {
      g.drawImage(pic.img, x + 80 - pic.f.w / 2, y + 96 - pic.f.h, pic.f.w, pic.f.h);
      flag(g, x + 128, y - 40, color || '#e8e8e8', t);
      return;
    }
    const K = H.TownDraw.KINDS, L = H.TownDraw.LOOK[o.faction], lv = fortOf(o), o2 = { t };
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath();
    g.ellipse(x + 80, y + 90, 84, 10, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = o.faction === 'league' ? '#8a7a5a' : '#c8bc94';
    g.fillRect(x + 6, y + 40, 148, 52);
    if (o.faction === 'league') {
      K.tower(g, L, x + 98, y - 30, 24, 84, o2);
      K.house(g, L, x + 12, y + 18, 40, 40, o2);
      K.hall(g, L, x + 50, y + 4, 52, 60, { t, level: o.built.includes('hall3') ? 3 : o.built.includes('hall2') ? 2 : 1 });
      K.house(g, L, x + 116, y + 26, 34, 34, o2);
    } else {
      K.mound(g, L, x + 92, y + 6, 58, 40, o2);
      K.yurt(g, L, x + 14, y + 22, 36, 34, o2);
      K.yurt(g, L, x + 54, y + 12, 44, 46, { t, level: o.built.includes('hall3') ? 3 : o.built.includes('hall2') ? 2 : 1 });
      K.idol(g, L, x + 128, y + 34, 16, 26, o2);
    }
    if (lv) {
      const wall = lv === 1 ? L.wood : L.stone, top = y + (lv === 3 ? 56 : 62);
      g.fillStyle = wall;
      g.strokeStyle = '#1a120a';
      for (const [wx, ww] of [[x + 4, 64], [x + 96, 60]]) {
        g.fillRect(wx, top, ww, y + 92 - top);
        g.strokeRect(wx + 0.5, top + 0.5, ww - 1, y + 92 - top - 1);
        if (lv === 1) for (let px = wx + 2; px < wx + ww - 2; px += 6) g.fillRect(px, top - 4, 3, 4);
        else for (let px = wx; px < wx + ww - 4; px += 10) g.fillRect(px, top - 5, 6, 5);
      }
      if (lv === 3) for (const tx of [x + 2, x + 146]) K.tower(g, L, tx, top - 22, 14, y + 92 - top + 22, o2);
    }
    g.fillStyle = '#1a1208';
    g.beginPath();
    g.moveTo(x + 68, y + 92);
    g.lineTo(x + 68, y + 72);
    g.arc(x + 80, y + 72, 12, Math.PI, 0);
    g.lineTo(x + 92, y + 92);
    g.closePath();
    g.fill();
    flag(g, x + 128, y - 40, color || '#e8e8e8', t);
  };

  const SITE_LOOK = {
    wagon: ['cart', '#7a5a34'], wreck: ['cart', '#5a5a5a'], traveler: ['sack', '#a08a60'], barrel: ['sack', '#7a5a34'],
    windmill: ['mill', '#c8b89a'], watermill: ['mill', '#7a8aa0'], apiary: ['hut', '#d8a030'], well: ['ring', '#7a7a82'], stable: ['hall', '#8a5a34'], crystalgrotto: ['cave', '#8ac8e8'],
    atkstone: ['stone', '#b84a3a'], ancestorshield: ['stone', '#4a7ab8'], charmspring: ['ring', '#60c0e0'], sagescroll: ['stone', '#d8ccb0'], knowledgetree: ['tree', '#3a8a3a'], witchhut: ['hut', '#5a7a3a'], camp: ['tent', '#a08a60'], arena: ['ring', '#b89a6a'],
    weekaltar: ['stone', '#c090e0'], library: ['hall', '#6a5a8a'], chapel: ['hut', '#e0dcc8'], luckspring: ['ring', '#50d080'], idol: ['stone', '#8a7a5a'], graveyard: ['stone', '#5a5a62'],
    portal1: ['arch', '#a060e0'], portal2: ['arch', '#60a0e0'], moongate: ['arch', '#e8e8f8'], ferry: ['cart', '#5a7a9a'], stairsdown: ['cave', '#3a3028'], stairsup: ['cave', '#8a7a5a'], shipyard: ['hall', '#6a7a9a'], watchtower: ['tower', '#8a8a92'], observatory: ['tower', '#5060a0'], cartographer: ['hut', '#c8b080'],
    market: ['tent', '#c8603a'], fair: ['tent', '#d8b040'], blackmarket: ['tent', '#3a3048'], inn: ['hall', '#a0603a'], mercenarycamp: ['tent', '#7a7a5a'], changeforge: ['hut', '#d0602a'],
    outpost: ['gate', '#8a7a62'], prison: ['hall', '#4a4a52'], sealer: ['tent', '#a060c0'], sealgate: ['gate', '#a060c0'], petitioner: ['hut', '#a08a60'], questgate: ['gate', '#c0a040'], signstone: ['stone', '#9a9288'], hamlet: ['hut', '#b09868'], boundstone: ['stone', '#8a9a7a'],
    whiteruin: ['stone', '#e8e8f0'], menhir: ['stone', '#a0a8b8'], digspot: ['pit', '#3a2a18'], heartstone: ['ring', '#f0d0ff'], fungalring: ['ring', '#a0e0a0'], witchring: ['ring', '#5a8a3a'], kurganstone: ['stone', '#c8bc94']
  };
  const VAULT_LOOK = { wagonruin: '#7a5a34', wolfden: '#6a6a62', eaglenest: '#b0a080', wildhive: '#d8a030', sunkentemple: '#3a7a8a', khancrypt: '#c8bc94', piratecove: '#5a3a2a', trollcave: '#4a6a4a', giantforge: '#d0602a', moonmine: '#b8c8e8', ruinedobservatory: '#6a70a0', thronetreasury: '#ece8e0' };
  const SITE_DRAW = { vault: true, dwelling: true, boat: true, whirlpool: true };
  const shapes = {
    hut(g, x, y, w, h, col) {
      g.fillStyle = col;
      g.fillRect(x + 6, y + h * 0.4, w - 12, h * 0.55);
      g.strokeRect(x + 6.5, y + h * 0.4 + 0.5, w - 13, h * 0.55 - 1);
      g.fillStyle = '#6a3a2a';
      g.beginPath();
      g.moveTo(x + 2, y + h * 0.42);
      g.lineTo(x + w / 2, y + 2);
      g.lineTo(x + w - 2, y + h * 0.42);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#1a1208';
      g.fillRect(x + w / 2 - 5, y + h - 16, 10, 14);
    },
    hall(g, x, y, w, h, col) {
      g.fillStyle = col;
      g.fillRect(x + 4, y + h * 0.3, w - 8, h * 0.65);
      g.strokeRect(x + 4.5, y + h * 0.3 + 0.5, w - 9, h * 0.65 - 1);
      g.fillStyle = '#3a2a1a';
      g.fillRect(x + 2, y + h * 0.2, w - 4, h * 0.14);
      g.fillStyle = '#1a1208';
      g.fillRect(x + w / 2 - 7, y + h - 18, 14, 16);
    },
    tent(g, x, y, w, h, col) {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(x + 4, y + h - 2);
      g.lineTo(x + w / 2, y + 2);
      g.lineTo(x + w - 4, y + h - 2);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#1a1208';
      g.beginPath();
      g.moveTo(x + w / 2 - 6, y + h - 2);
      g.lineTo(x + w / 2, y + h - 18);
      g.lineTo(x + w / 2 + 6, y + h - 2);
      g.closePath();
      g.fill();
    },
    stone(g, x, y, w, h, col) {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(x + w * 0.25, y + h - 3);
      g.lineTo(x + w * 0.32, y + 3);
      g.lineTo(x + w * 0.68, y + 7);
      g.lineTo(x + w * 0.76, y + h - 3);
      g.closePath();
      g.fill();
      g.stroke();
    },
    ring(g, x, y, w, h, col, t) {
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.beginPath();
      g.ellipse(x + w / 2, y + h - 12, w / 2 - 2, 9, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = col;
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(x + w / 2, y + h - 12, w / 2 - 5, 7, 0, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = col;
      g.globalAlpha = 0.4 + Math.sin(t * 3) * 0.2;
      g.beginPath();
      g.ellipse(x + w / 2, y + h - 12, w / 4, 4, 0, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
    },
    arch(g, x, y, w, h, col, t) {
      g.strokeStyle = '#3a3640';
      g.lineWidth = 5;
      g.beginPath();
      g.arc(x + w / 2, y + h * 0.6, w * 0.36, Math.PI, 0);
      g.lineTo(x + w / 2 + w * 0.36, y + h - 2);
      g.moveTo(x + w / 2 - w * 0.36, y + h - 2);
      g.lineTo(x + w / 2 - w * 0.36, y + h * 0.6);
      g.stroke();
      g.fillStyle = col;
      g.globalAlpha = 0.55 + Math.sin(t * 4) * 0.2;
      g.beginPath();
      g.arc(x + w / 2, y + h * 0.6, w * 0.28, Math.PI, 0);
      g.lineTo(x + w / 2 + w * 0.28, y + h - 3);
      g.lineTo(x + w / 2 - w * 0.28, y + h - 3);
      g.closePath();
      g.fill();
      g.globalAlpha = 1;
    },
    cave(g, x, y, w, h, col) {
      g.fillStyle = '#5a544c';
      g.beginPath();
      g.moveTo(x + 2, y + h - 2);
      g.lineTo(x + w * 0.2, y + 6);
      g.lineTo(x + w * 0.8, y + 4);
      g.lineTo(x + w - 2, y + h - 2);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(x + w / 2, y + h - 12, w * 0.24, h * 0.28, 0, 0, Math.PI * 2);
      g.fill();
    },
    tower(g, x, y, w, h, col) {
      g.fillStyle = col;
      g.fillRect(x + w * 0.3, y - 10, w * 0.4, h + 6);
      g.strokeRect(x + w * 0.3 + 0.5, y - 9.5, w * 0.4 - 1, h + 5);
      g.fillStyle = '#3a2a1a';
      g.fillRect(x + w * 0.24, y - 16, w * 0.52, 7);
      g.fillStyle = '#1a1208';
      g.fillRect(x + w / 2 - 4, y + h - 14, 8, 12);
    },
    gate(g, x, y, w, h, col) {
      g.fillStyle = '#6a6460';
      g.fillRect(x + 1, y - 8, 7, h + 6);
      g.fillRect(x + w - 8, y - 8, 7, h + 6);
      g.fillStyle = col;
      g.fillRect(x + 8, y + 2, w - 16, 6);
      g.strokeRect(x + 8.5, y + 2.5, w - 17, 5);
    },
    cart(g, x, y, w, h, col) {
      g.fillStyle = col;
      g.fillRect(x + 6, y + h - 16, w - 12, 9);
      g.strokeRect(x + 6.5, y + h - 15.5, w - 13, 8);
      g.fillStyle = '#2a1a0a';
      for (const q of [x + 11, x + w - 11]) {
        g.beginPath();
        g.arc(q, y + h - 6, 4, 0, Math.PI * 2);
        g.fill();
      }
    },
    sack(g, x, y, w, h, col) {
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(x + w / 2, y + h - 12, 9, 10, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    },
    mill(g, x, y, w, h, col, t) {
      shapes.hut(g, x + w * 0.15, y + h * 0.3, w * 0.7, h * 0.7, col);
      const cx = x + w / 2, cy = y + h * 0.3, a = t * 1.5;
      g.strokeStyle = '#2a1a0a';
      g.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx + Math.cos(a + i * Math.PI / 2) * h * 0.3, cy + Math.sin(a + i * Math.PI / 2) * h * 0.3);
        g.stroke();
      }
    },
    tree(g, x, y, w, h, col) {
      g.fillStyle = '#4a2e1a';
      g.fillRect(x + w / 2 - 5, y + h * 0.5, 10, h * 0.48);
      g.fillStyle = col;
      for (const [dx, dy, rr] of [[0.3, 0.32, 0.26], [0.7, 0.34, 0.26], [0.5, 0.14, 0.3]]) {
        g.beginPath();
        g.arc(x + w * dx, y + h * dy, w * rr, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#e8d060';
      for (const [dx, dy] of [[0.3, 0.3], [0.62, 0.2], [0.72, 0.42]]) g.fillRect(x + w * dx, y + h * dy, 3, 3);
    },
    pit(g, x, y, w, h, col) {
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(x + w / 2, y + h / 2 + 4, 10, 6, 0, 0, Math.PI * 2);
      g.fill();
    }
  };
  const site = (g, o, def, x, y, w, h, t, ownerColor) => {
    g.strokeStyle = '#1a120a';
    if (def.kind === 'dwelling') {
      shapes.hut(g, x, y, w, h, '#9a8a6a');
      H.Art.drawUnit(g, def.unit, x + w / 2, y + h * 0.42, { scale: 0.42, tier: false });
    } else if (def.kind === 'vault') {
      shapes[o.looted ? 'stone' : 'cave'](g, x, y, w, h, o.looted ? '#5a544c' : VAULT_LOOK[o.t]);
      g.fillStyle = '#e8d060';
      for (let k = 0; !o.looted && k <= (o.tier || 0); k++) g.fillRect(x + 6 + k * 6, y + 2, 4, 4);
    } else if (def.kind === 'boat') {
      g.fillStyle = '#7a5230';
      g.beginPath();
      g.moveTo(x + 3, y + 18);
      g.lineTo(x + 29, y + 18);
      g.lineTo(x + 24, y + 27);
      g.lineTo(x + 8, y + 27);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#e8e0c8';
      g.beginPath();
      g.moveTo(x + 15, y + 2);
      g.lineTo(x + 25, y + 16);
      g.lineTo(x + 15, y + 16);
      g.closePath();
      g.fill();
      g.stroke();
    } else if (def.kind === 'whirlpool') {
      g.strokeStyle = 'rgba(220,240,255,0.8)';
      g.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        g.ellipse(x + w / 2, y + h / 2, 6 + k * 8, 3 + k * 5, 0, t * 2 + k, t * 2 + k + 4.5);
        g.stroke();
      }
    } else {
      const [shape, col] = SITE_LOOK[o.t];
      const tint = (def.kind === 'sealer' || def.kind === 'sealgate') && o.color != null ? H.SEAL_COLORS[o.color][1] : col;
      shapes[shape](g, x, y, w, h, tint, t);
    }
    if (def.flag) flag(g, x + w - 14, y - 8, ownerColor || '#e8e8e8', t);
  };

  const object = (g, o, x, y, t, ownerColor) => {
    const def = H.OBJ[o.t], w = def.foot[0] * T, h = def.foot[1] * T;
    g.save();
    g.lineWidth = 1;
    const pic = def.kind === 'town' ? null : H.Art.image(def.kind === 'dwelling' && def.flag ? 'dwelling/' + def.unit : 'object/' + o.t);
    if (pic) {
      g.drawImage(pic.img, x + (w - pic.f.w) / 2, y + h - pic.f.h, pic.f.w, pic.f.h);
      if (def.flag) flag(g, x + w - 14, y - 8, ownerColor || '#e8e8e8', t);
    } else if (SITE_DRAW[def.kind] || SITE_LOOK[o.t]) site(g, o, def, x, y, w, h, t, ownerColor);
    else if (def.kind === 'town') town(g, o, x, y, t, ownerColor);
    else if (def.kind === 'shrine') {
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.beginPath();
      g.ellipse(x + 32, y + 58, 30, 7, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#8a8a9a';
      g.strokeStyle = '#2a2a34';
      for (const px of [8, 46]) {
        g.fillRect(x + px, y + 14, 10, 44);
        g.strokeRect(x + px + 0.5, y + 14.5, 9, 43);
      }
      g.fillRect(x + 4, y + 8, 56, 8);
      g.strokeRect(x + 4.5, y + 8.5, 55, 7);
      const pulse = 0.35 + Math.sin(t * 3) * 0.15;
      g.fillStyle = 'rgba(150,190,255,' + pulse.toFixed(2) + ')';
      g.beginPath();
      g.arc(x + 32, y + 36, 11, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e8ecff';
      for (let k = 0; k < def.circle; k++) g.fillRect(x + 26 + k * 5, y + 11, 3, 3);
    } else if (def.kind === 'scroll') {
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.beginPath();
      g.ellipse(x + 16, y + 27, 11, 3, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e8dcb8';
      g.strokeStyle = '#4a3a20';
      g.fillRect(x + 7, y + 12, 18, 12);
      g.strokeRect(x + 7.5, y + 12.5, 17, 11);
      g.fillStyle = o.spell ? H.SPELL_COLORS[H.SPELLS[o.spell].school] : '#a08a50';
      g.fillRect(x + 13, y + 15, 6, 6);
    } else if (def.kind === 'artifact') {
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.beginPath();
      g.ellipse(x + 16, y + 27, 12, 4, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255,240,170,' + (0.2 + Math.sin(t * 3) * 0.1).toFixed(2) + ')';
      g.beginPath();
      g.arc(x + 16, y + 15, 15, 0, Math.PI * 2);
      g.fill();
      H.Art.drawArtifact(g, o.art, x + 4, y + 3, 24);
    }
    else if (def.kind === 'mine') {
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.beginPath();
      g.ellipse(x + w / 2, y + h - 4, w / 2, 7, 0, 0, Math.PI * 2);
      g.fill();
      if (o.t === 'sulfurspring') {
        g.fillStyle = '#8a7a30';
        g.beginPath();
        g.ellipse(x + w / 2, y + h - 18, 26, 14, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = RES.sulfur;
        g.beginPath();
        g.ellipse(x + w / 2, y + h - 18, 18, 9, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(240,240,180,0.5)';
        for (let k = 0; k < 3; k++) g.fillRect(x + 22 + k * 8, y + h - 40 - ((t * 20 + k * 9) % 18), 3, 6);
      } else {
        g.fillStyle = '#6a5038';
        g.fillRect(x + 10, y + 18, w - 20, h - 22);
        g.strokeStyle = '#2a1a0a';
        g.strokeRect(x + 10.5, y + 18.5, w - 21, h - 23);
        g.fillStyle = '#8a3a2a';
        g.beginPath();
        g.moveTo(x + 4, y + 20);
        g.lineTo(x + w / 2, y + 2);
        g.lineTo(x + w - 4, y + 20);
        g.closePath();
        g.fill();
        g.stroke();
        g.fillStyle = '#1a1208';
        g.fillRect(x + w / 2 - 8, y + h - 18, 16, 14);
        g.fillStyle = RES[def.res];
        g.beginPath();
        g.arc(x + w / 2, y + 30, 6, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
      flag(g, x + w - 14, y - 8, ownerColor || '#e8e8e8', t);
    } else if (def.kind === 'pile') {
      for (const [dx, dy, rr] of [[10, 22, 7], [20, 23, 6], [15, 17, 6]]) {
        g.fillStyle = RES[def.res];
        g.beginPath();
        g.arc(x + dx, y + dy, rr, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.55)';
        g.stroke();
      }
    } else if (def.kind === 'chest') {
      g.fillStyle = '#7a4a1a';
      g.fillRect(x + 6, y + 12, 20, 14);
      g.strokeStyle = '#2a1a0a';
      g.strokeRect(x + 6.5, y + 12.5, 19, 13);
      g.fillStyle = '#e0b040';
      g.fillRect(x + 6, y + 16, 20, 2);
      g.fillRect(x + 15, y + 15, 3, 5);
    } else if (def.kind === 'campfire') {
      g.fillStyle = '#5a3a1a';
      g.fillRect(x + 7, y + 22, 18, 4);
      for (let k = 0; k < 3; k++) {
        g.fillStyle = ['#ff8020', '#ffc040', '#e04010'][k];
        const f = Math.sin(t * 10 + k * 2) * 2;
        g.beginPath();
        g.moveTo(x + 10 + k * 6, y + 22);
        g.lineTo(x + 13 + k * 6, y + 10 + f);
        g.lineTo(x + 16 + k * 6, y + 22);
        g.fill();
      }
    } else if (def.kind === 'monster') {
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.beginPath();
      g.ellipse(x + 16, y + 28, 12, 4, 0, 0, Math.PI * 2);
      g.fill();
      H.Art.drawUnit(g, o.unit, x + 16, y + 28, { scale: 0.62, tier: false, flip: true });
    } else if (o.t === 'tree' || o.t === 'pine') {
      g.fillStyle = '#4a2e1a';
      g.fillRect(x + 14, y + 18, 4, 12);
      g.fillStyle = o.t === 'pine' ? '#1f4a24' : '#3a7030';
      if (o.t === 'pine') {
        g.beginPath();
        g.moveTo(x + 16, y - 10);
        g.lineTo(x + 28, y + 22);
        g.lineTo(x + 4, y + 22);
        g.closePath();
        g.fill();
      } else {
        for (const [dx, dy, rr] of [[10, 10, 9], [22, 11, 9], [16, 2, 10]]) {
          g.beginPath();
          g.arc(x + dx, y + dy, rr, 0, Math.PI * 2);
          g.fill();
        }
      }
    } else if (o.t === 'rock') {
      g.fillStyle = '#7a746e';
      g.beginPath();
      g.moveTo(x + 4, y + 28);
      g.lineTo(x + 8, y + 12);
      g.lineTo(x + 20, y + 8);
      g.lineTo(x + 28, y + 28);
      g.closePath();
      g.fill();
      g.strokeStyle = '#3a3632';
      g.stroke();
    } else if (o.t === 'mountain') {
      g.fillStyle = '#6a6460';
      g.beginPath();
      g.moveTo(x, y + h);
      g.lineTo(x + w * 0.45, y - 24);
      g.lineTo(x + w, y + h);
      g.closePath();
      g.fill();
      g.strokeStyle = '#2a2622';
      g.stroke();
      g.fillStyle = '#eef0f4';
      g.beginPath();
      g.moveTo(x + w * 0.45, y - 24);
      g.lineTo(x + w * 0.58, y - 2);
      g.lineTo(x + w * 0.32, y - 2);
      g.closePath();
      g.fill();
    }
    g.restore();
  };

  const fighter = (g, B, side, t) => {
    const h = B.sides[side].hero;
    if (!h) return;
    const x = side ? H.W - 6 : 6;
    g.save();
    g.translate(x, 112);
    g.scale(side ? -1.3 : 1.3, 1.3);
    hero(g, { dir: 1 }, 0, 0, H.BattleDraw.SIDE[side], t);
    g.restore();
  };

  const hero = (g, h, x, y, color, t) => {
    g.save();
    g.translate(x + 16, y + 28);
    g.scale(h.dir < 0 ? -1 : 1, 1);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath();
    g.ellipse(0, 0, 14, 4, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#6a4a2a';
    g.strokeStyle = '#2a1a0a';
    g.lineWidth = 1;
    if (h.boat) {
      g.beginPath();
      g.moveTo(-15, -8);
      g.lineTo(15, -8);
      g.lineTo(10, 0);
      g.lineTo(-10, 0);
      g.closePath();
      g.fill();
      g.stroke();
    } else {
      g.beginPath();
      g.ellipse(0, -10, 12, 6, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      for (const lx of [-9, -5, 5, 9]) g.fillRect(lx - 1, -6, 2, 6);
      g.fillRect(10, -20, 4, 9);
    }
    g.fillStyle = '#b89a6a';
    g.fillRect(-3, -24, 6, 12);
    g.fillStyle = '#e8c8a0';
    g.beginPath();
    g.arc(0, -27, 3.5, 0, Math.PI * 2);
    g.fill();
    g.restore();
    flag(g, x + (h.dir < 0 ? 22 : 6), y - 10, color, t);
  };

  const steps = (g, plan, cam, view, font) => {
    if (!plan || !plan.steps.length) return;
    plan.steps.forEach((s, i) => {
      const x = view.x + s.c * T - cam.x + 16, y = view.y + s.r * T - cam.y + 16, last = i === plan.steps.length - 1;
      g.fillStyle = s.day === 0 ? '#50e050' : '#e8d040';
      g.strokeStyle = '#000';
      if (last) {
        g.beginPath();
        g.arc(x, y, 6, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      } else {
        g.fillRect(x - 3, y - 2, 4, 5);
        g.fillRect(x + 1, y - 4, 4, 5);
      }
      const dayEnd = last || plan.steps[i + 1].day !== s.day;
      if (dayEnd && (s.day > 0 || plan.steps.some(q => q.day > 0))) font(String(s.day + 1), x + 6, y - 14);
    });
  };

  const fog = (g, M, seen, vis, cam, view, pattern) => {
    const c0 = Math.max(0, Math.floor(cam.x / T)), r0 = Math.max(0, Math.floor(cam.y / T));
    const c1 = Math.min(M.w - 1, Math.floor((cam.x + view.w) / T)), r1 = Math.min(M.h - 1, Math.floor((cam.y + view.h) / T));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * M.w + c, x = view.x + c * T - cam.x, y = view.y + r * T - cam.y;
        if (!seen[i]) {
          g.fillStyle = '#000';
          g.fillRect(x, y, T, T);
        } else if (!vis[i]) {
          g.fillStyle = pattern;
          g.fillRect(x, y, T, T);
        }
      }
    }
    g.fillStyle = '#000';
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * M.w + c;
        if (!seen[i]) continue;
        const x = view.x + c * T - cam.x, y = view.y + r * T - cam.y;
        for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const nc = c + dc, nr = r + dr;
          if (!MD.inside(M, nc, nr) || seen[nr * M.w + nc]) continue;
          for (let k = 0; k < T; k += 4) {
            const off = Math.floor(hash(c, r, k) * 6);
            if (dr) g.fillRect(x + k, dr < 0 ? y : y + T - off, 4, off);
            else g.fillRect(dc < 0 ? x : x + T - off, y + k, off, 4);
          }
        }
      }
    }
  };

  const minimap = (S, l, pid, vis) => {
    const M = S.map, cv = document.createElement('canvas');
    cv.width = M.w;
    cv.height = M.h;
    const g = cv.getContext('2d'), img = g.createImageData(M.w, M.h), seen = S.players[pid].seen[l];
    for (let i = 0; i < M.w * M.h; i++) {
      const c = i % M.w, r = (i / M.w) | 0;
      let col = '#000000';
      if (seen[i]) col = MD.roadAt(M, l, c, r) ? ROAD[MD.roadAt(M, l, c, r)] : COLORS[MD.terrainAt(M, l, c, r).id][0];
      const n = parseInt(col.slice(1), 16), dim = seen[i] && !vis[i] ? 0.65 : 1;
      img.data[i * 4] = (n >> 16) * dim;
      img.data[i * 4 + 1] = ((n >> 8) & 255) * dim;
      img.data[i * 4 + 2] = (n & 255) * dim;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    for (const o of M.objs) {
      if (o.gone || o.l !== l) continue;
      const def = H.OBJ[o.t];
      if (def.kind === 'decor' || !seen[o.r * M.w + o.c]) continue;
      if (def.kind === 'monster' && !o.route && !vis[o.r * M.w + o.c]) continue;
      g.fillStyle = def.flag ? (o.owner >= 0 ? H.PLAYER_COLORS[S.players[o.owner].color] : '#e8e8e8') : def.kind === 'monster' ? '#ff4030' : '#f0e0a0';
      g.fillRect(o.c, o.r, Math.max(1, def.foot[0] - 1), Math.max(1, def.foot[1] - 1));
    }
    for (const h of S.heroes) {
      if (!h.alive || h.l !== l || (h.owner !== pid && !vis[h.r * M.w + h.c])) continue;
      g.fillStyle = H.PLAYER_COLORS[S.players[h.owner].color];
      g.fillRect(h.c - 1, h.r - 1, 3, 3);
    }
    for (const v of S.caravans) {
      if (v.l !== l) continue;
      g.fillStyle = H.PLAYER_COLORS[S.players[v.owner].color];
      g.fillRect(v.c, v.r, 2, 2);
    }
    return cv;
  };

  const caravan = (g, v, x, y, color, t) => {
    g.save();
    g.translate(x + 16, y + 26);
    g.scale(v.dir < 0 ? -1 : 1, 1);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath();
    g.ellipse(0, 2, 15, 4, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#6a4a26';
    g.fillRect(-13, -8, 22, 6);
    g.fillStyle = '#d8ccb0';
    g.beginPath();
    g.moveTo(-13, -8);
    g.quadraticCurveTo(-2, -22, 9, -8);
    g.closePath();
    g.fill();
    g.strokeStyle = '#3a2412';
    g.lineWidth = 1;
    g.stroke();
    g.fillStyle = '#2a1a0a';
    for (const wx of [-9, 5]) {
      g.beginPath();
      g.arc(wx, -1, 3.5, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#7a5a34';
    g.fillRect(9, -9, 9, 5);
    g.fillRect(16, -12, 3, 4);
    g.restore();
    flag(g, x + 4, y - 2, color, t);
  };

  H.MapDraw = { CH, T, COLORS, RES, terrain, object, town, fortOf, hero, fighter, steps, fog, minimap, flag, caravan };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
