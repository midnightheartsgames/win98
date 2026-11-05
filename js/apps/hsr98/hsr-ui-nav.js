(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, TS, C } = H.UI_CONST;
  const MINIMAP = { w: 116, h: 84, near: 40, far: 88, fade: 0.14, slide: 18 };

  const P = {
    paper: '#b8bcc5', speck: '#c5c9d1', speck2: '#aaaeb8', grid: '#aeb2bb', rim: '#d8dbe1', rimHi: '#f2f4f7', rimLine: '#8a8f9a',
    floor: '#2b2f38', floor2: '#323743', floor3: '#393f4b', road: '#444a57', ink: '#2c3039', prop: '#5b616e', propHi: '#7a8190',
    block: '#9ba0ab', blockHi: '#b6bac3', blockLine: '#6a6f7b', chasm: '#a3a8b2', hatch: '#80858f', rail: '#98a0ae', tie: '#565d6b', accent: '#5cc6ea'
  };
  const ZOOMS = [4, 6, 8, 10, 12, 16];
  const VIEW = { x: 12, y: 54, w: 428, h: 358 };
  const PANEL = { x: 450, y: 52, w: 180, h: 362 };
  const LIST = { top: 48, bottom: 8, bar: 14 };
  const WALK = new Set(['floor', 'floor2', 'floor3', 'floor4', 'floor5', 'road', 'rail', 'bridge', 'door', 'stairs']);
  const PROPS = new Set(['tree', 'crate', 'pipe', 'console', 'lamp', 'fence', 'statue', 'table', 'crystal', 'shelf', 'block']);
  const BLOCKS = new Set(['house', 'window', 'housedoor', 'gate']);
  const KIND_LABEL = { anchor: 'Якорь пространства', landing: 'Точка высадки', exit: 'Проход', shop: 'Лавка', rumor: 'Торговец слухами', warp: 'Терминал', calyx: 'Терминал', nav: 'Терминал', goal: 'Миссия Освоения', quest: 'Миссия' };
  const WORLD_POS = { herta: [150, 292], jarilo: [322, 166], belzerg: [492, 120], luofu: [500, 312] };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const DIR_ANGLE = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };

  const iconOf = p => (p.kind === 'anchor' ? (p.on ? 'anchor' : 'anchorOff') : p.kind === 'exit' ? (p.locked ? 'exitLocked' : 'exit') : p.kind);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const charts = new Map();
  const art = new Map();

  function tileKind(L, x, y) {
    if (x < 0 || y < 0 || x >= L.w || y >= L.h) return 'wall';
    return (H.TILES[L.tiles[y][x]] || { kind: 'floor' }).kind;
  }

  function chartCanvas(id, cell) {
    const key = id + '|' + cell;
    let cv = charts.get(key);
    if (cv) return cv;
    const L = H.mapLayout(id), c = cell;
    cv = G.mkCanvas(L.w * c, L.h * c);
    const g = cv.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const kind = (x, y) => tileKind(L, x, y);
    const open = k => WALK.has(k) || PROPS.has(k) || k === 'chasm';
    const solidRim = (x, y) => {
      const k = kind(x, y);
      if (open(k) || BLOCKS.has(k)) return false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const n = kind(x + dx, y + dy); if (open(n) || BLOCKS.has(n)) return true; }
      return false;
    };
    const rim = [];
    for (let y = 0; y < L.h; y++) { rim.push([]); for (let x = 0; x < L.w; x++) rim[y].push(solidRim(x, y)); }
    const isRim = (x, y) => x >= 0 && y >= 0 && x < L.w && y < L.h && rim[y][x];
    const t = Math.max(1, Math.round(c / 8));
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      const k = kind(x, y), px = x * c, py = y * c;
      if (rim[y][x]) R(px, py, c, c, P.rim);
      else if (k === 'chasm') {
        R(px, py, c, c, P.chasm);
        for (let j = 0; j < c; j++) for (let i = 0; i < c; i++) if ((px + i + py + j) % 4 === 0) R(px + i, py + j, 1, 1, P.hatch);
      } else if (BLOCKS.has(k)) R(px, py, c, c, k === 'gate' ? '#7a808b' : P.block);
      else if (open(k)) R(px, py, c, c, k === 'floor2' ? P.floor2 : k === 'floor3' ? P.floor3 : k === 'road' || k === 'bridge' ? P.road : P.floor);
    }
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      const k = kind(x, y), px = x * c, py = y * c;
      const sides = [[0, -1, px, py, c, t], [0, 1, px, py + c - t, c, t], [-1, 0, px, py, t, c], [1, 0, px + c - t, py, t, c]];
      if (rim[y][x]) {
        for (const [dx, dy, sx, sy, sw, sh] of sides) {
          const n = kind(x + dx, y + dy);
          if (open(n)) R(sx, sy, sw, sh, P.rimHi);
          else if (!isRim(x + dx, y + dy) && !BLOCKS.has(n)) R(sx, sy, sw, sh, P.rimLine);
        }
      } else if (BLOCKS.has(k)) {
        for (const [dx, dy, sx, sy, sw, sh] of sides) if (!BLOCKS.has(kind(x + dx, y + dy))) R(sx, sy, sw, sh, P.blockLine);
        if (!BLOCKS.has(kind(x, y - 1))) R(px, py + t, c, t, P.blockHi);
        if (k === 'window' && c >= 6) { R(px + Math.round(c * 0.25), py + Math.round(c * 0.3), Math.max(1, Math.round(c * 0.5)), Math.max(1, Math.round(c * 0.35)), P.blockLine); }
        if (k === 'housedoor') R(px + Math.round(c * 0.3), py + Math.round(c * 0.45), Math.max(1, Math.round(c * 0.4)), c - Math.round(c * 0.45), '#3c414c');
        if (k === 'gate') for (let i = 1; i < c; i += Math.max(2, Math.round(c / 4))) R(px + i, py + t, 1, c - 2 * t, '#565c67');
      }
    }
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      const k = kind(x, y), px = x * c, py = y * c, cx = px + c / 2, cy = py + c / 2;
      const ins = f => Math.round(c * f);
      switch (k) {
        case 'tree': g.fillStyle = P.prop; g.beginPath(); g.arc(cx, cy, c * 0.42, 0, Math.PI * 2); g.fill(); g.fillStyle = P.propHi; g.beginPath(); g.arc(cx - c * 0.12, cy - c * 0.12, c * 0.16, 0, Math.PI * 2); g.fill(); break;
        case 'crate': R(px + ins(0.15), py + ins(0.15), c - ins(0.3), c - ins(0.3), '#5d6370'); R(px + ins(0.15), py + ins(0.15), c - ins(0.3), t, P.propHi); break;
        case 'pipe': R(px, py + ins(0.2), c, c - ins(0.4), '#4c525e'); R(px, py + ins(0.2), c, t, '#6a7180'); break;
        case 'console': R(px + ins(0.1), py + ins(0.15), c - ins(0.2), c - ins(0.3), '#474e5c'); R(px + ins(0.1), py + ins(0.15) + t, c - ins(0.2), t, P.accent); break;
        case 'lamp': R(px + ins(0.35), py + ins(0.35), Math.max(1, c - ins(0.7)), Math.max(1, c - ins(0.7)), '#a2a9b6'); break;
        case 'fence': {
          const h = kind(x - 1, y) === 'fence' || kind(x + 1, y) === 'fence';
          if (h) R(px, py + ins(0.45), c, t, '#8d94a2'); else R(px + ins(0.45), py, t, c, '#8d94a2');
          break;
        }
        case 'table': R(px + ins(0.18), py + ins(0.18), c - ins(0.36), c - ins(0.36), '#555b68'); break;
        case 'shelf': R(px + ins(0.08), py, c - ins(0.16), c, '#6a5a50'); R(px + ins(0.08), py + ins(0.45), c - ins(0.16), t, '#9a8a7a'); break;
        case 'statue':
        case 'crystal': {
          const col = k === 'statue' ? ['#a9afba', '#cfd3da'] : ['#7a9cc2', '#c0d8ee'];
          g.fillStyle = col[0]; g.beginPath(); g.moveTo(cx, py + ins(0.1)); g.lineTo(px + c - ins(0.15), cy); g.lineTo(cx, py + c - ins(0.1)); g.lineTo(px + ins(0.15), cy); g.closePath(); g.fill();
          g.fillStyle = col[1]; g.beginPath(); g.moveTo(cx, py + ins(0.1)); g.lineTo(cx, py + c - ins(0.1)); g.lineTo(px + ins(0.15), cy); g.closePath(); g.fill();
          break;
        }
        case 'rail': {
          if (c < 6) { R(px + ins(0.3), py + ins(0.3), c - ins(0.6), c - ins(0.6), P.tie); break; }
          const vert = (kind(x, y - 1) === 'rail' || kind(x, y + 1) === 'rail') && !(kind(x - 1, y) === 'rail' || kind(x + 1, y) === 'rail');
          for (let i = 1; i < c; i += 4) { if (vert) R(px + ins(0.15), py + i, c - ins(0.3), 2, P.tie); else R(px + i, py + ins(0.15), 2, c - ins(0.3), P.tie); }
          if (vert) { R(px + ins(0.3), py, 1, c, P.rail); R(px + c - ins(0.3) - 1, py, 1, c, P.rail); }
          else { R(px, py + ins(0.3), c, 1, P.rail); R(px, py + c - ins(0.3) - 1, c, 1, P.rail); }
          break;
        }
        case 'bridge': {
          const along = kind(x, y - 1) !== 'chasm' && kind(x, y + 1) !== 'chasm', step = Math.max(2, Math.round(c / 4));
          for (let i = step - 1; i < c; i += step) { if (along) R(px, py + i, c, 1, P.tie); else R(px + i, py, 1, c, P.tie); }
          if (along) { if (kind(x - 1, y) !== 'bridge') R(px, py, t, c, P.ink); if (kind(x + 1, y) !== 'bridge') R(px + c - t, py, t, c, P.ink); }
          else { if (kind(x, y - 1) !== 'bridge') R(px, py, c, t, P.ink); if (kind(x, y + 1) !== 'bridge') R(px, py + c - t, c, t, P.ink); }
          break;
        }
        case 'stairs': for (let i = 1; i < c; i += 3) R(px + 1, py + i, c - 2, 1, '#565c6a'); break;
      }
    }
    charts.set(key, cv);
    return cv;
  }

  function paperTexture() {
    let cv = art.get('paper');
    if (cv) return cv;
    cv = G.mkCanvas(64, 64);
    const g = cv.getContext('2d');
    g.fillStyle = P.paper; g.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const h = G.hash(x, y, 91);
      if (h < 0.06) { g.fillStyle = P.speck; g.fillRect(x, y, 1, 1); } else if (h > 0.955) { g.fillStyle = P.speck2; g.fillRect(x, y, 1, 1); }
    }
    art.set('paper', cv);
    return cv;
  }

  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
    const h = (a, b) => G.hash(a, b, s);
    const top = h(xi, yi) + (h(xi + 1, yi) - h(xi, yi)) * sx, bot = h(xi, yi + 1) + (h(xi + 1, yi + 1) - h(xi, yi + 1)) * sx;
    return top + (bot - top) * sy;
  }
  const fbm = (x, y, s) => vnoise(x, y, s) * 0.6 + vnoise(x * 2.1, y * 2.1, s + 1) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 2) * 0.1;

  function jariloCanvas() {
    const S = 76, R = 35, cv = G.mkCanvas(S, S), g = cv.getContext('2d');
    const ice = ['#1a2a52', '#3a5890', '#86a4cc', '#d8e2f0', '#ffffff'], sea = ['#0c2046', '#1a4686', '#3674bc', '#62a2e2', '#a4d0ff'];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const nx = (x + 0.5 - S / 2) / R, ny = (y + 0.5 - S / 2) / R, d = nx * nx + ny * ny;
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d), lit = Math.max(0, -0.55 * nx - 0.5 * ny + 0.67 * nz);
      const n = fbm(Math.atan2(nx, nz) * 3.4 + 2, Math.asin(ny) * 3.8 + 5, 17);
      const blue = Math.abs(n - 0.5) < 0.045 || n > 0.66;
      const lev = clamp(Math.floor(lit * 4.4 + 0.45 + (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 0.9), 0, 4);
      g.fillStyle = (blue ? sea : ice)[lev]; g.fillRect(x, y, 1, 1);
    }
    for (let a = 0; a < 64; a++) {
      const an = a / 64 * Math.PI * 2, lx = Math.cos(an), ly = Math.sin(an);
      if (-0.55 * lx - 0.5 * ly < 0.1) continue;
      g.fillStyle = 'rgba(168,216,255,0.8)'; g.fillRect(Math.round(S / 2 + lx * (R + 0.6)), Math.round(S / 2 + ly * (R + 0.6)), 1, 1);
    }
    return cv;
  }

  function belzergCanvas() {
    const S = 76, R = 35, cv = G.mkCanvas(S, S), g = cv.getContext('2d');
    const land = ['#1e3a1a', '#2e6a2a', '#4e9a3a', '#7ec24e', '#b8e07a'], sea = ['#0c2046', '#1a4686', '#3674bc', '#62a2e2', '#a4d0ff'], cloud = ['#4a5a7a', '#8a9ab8', '#c8d4e6', '#eef4fb', '#ffffff'];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const nx = (x + 0.5 - S / 2) / R, ny = (y + 0.5 - S / 2) / R, d = nx * nx + ny * ny;
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d), lit = Math.max(0, -0.55 * nx - 0.5 * ny + 0.67 * nz);
      const n = fbm(Math.atan2(nx, nz) * 2.6 + 7, Math.asin(ny) * 3.2 + 1, 23), c = fbm(Math.atan2(nx, nz) * 5 + 3, Math.asin(ny) * 7, 29);
      const pal = c > 0.64 ? cloud : n > 0.52 ? land : sea;
      const lev = clamp(Math.floor(lit * 4.4 + 0.45 + (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 0.9), 0, 4);
      g.fillStyle = pal[lev]; g.fillRect(x, y, 1, 1);
    }
    for (let a = 0; a < 64; a++) {
      const an = a / 64 * Math.PI * 2, lx = Math.cos(an), ly = Math.sin(an);
      if (-0.55 * lx - 0.5 * ly < 0.1) continue;
      g.fillStyle = 'rgba(168,236,200,0.8)'; g.fillRect(Math.round(S / 2 + lx * (R + 0.6)), Math.round(S / 2 + ly * (R + 0.6)), 1, 1);
    }
    return cv;
  }

  function vectorArt(key, S, draw) {
    return G.pixelArt(key, S, S, (p, g) => { const k = g.canvas.width / S; g.save(); g.scale(k, k); draw(g); g.restore(); });
  }

  function hertaCanvas() {
    return vectorArt('nav|herta', 84, g => {
      const ring = (a0, a1, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.ellipse(42, 46, 34, 11, -0.38, a0, a1); g.stroke(); };
      ring(Math.PI, Math.PI * 2, '#8a96ac', 4);
      g.fillStyle = '#5a667c'; g.beginPath(); g.moveTo(12, 76); g.lineTo(66, 10); g.lineTo(71, 14); g.lineTo(18, 80); g.closePath(); g.fill();
      g.fillStyle = '#e2e8f0'; g.beginPath(); g.moveTo(12, 76); g.lineTo(66, 10); g.lineTo(68, 12); g.lineTo(15, 78); g.closePath(); g.fill();
      g.fillStyle = '#f8fbff'; g.beginPath(); g.moveTo(66, 10); g.lineTo(76, 2); g.lineTo(71, 14); g.closePath(); g.fill();
      g.fillStyle = '#7a8498'; g.beginPath(); g.arc(42, 46, 14, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c8d0dc'; g.beginPath(); g.arc(40, 44, 12, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f2f6fb'; g.beginPath(); g.ellipse(36, 40, 6, 4, -0.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2a4a9a'; g.fillRect(4, 50, 12, 6); g.fillRect(68, 30, 12, 6);
      g.fillStyle = '#5a88d8'; g.fillRect(5, 51, 10, 2); g.fillRect(69, 31, 10, 2);
      ring(0, Math.PI, '#e8eef6', 4);
      g.fillStyle = '#60d0ff'; for (const [x, y] of [[44, 50], [48, 44], [38, 52], [30, 58], [55, 30]]) g.fillRect(x, y, 2, 2);
    });
  }

  function luofuCanvas() {
    return vectorArt('nav|luofu', 84, g => {
      g.fillStyle = '#1e4a3a'; g.beginPath(); g.moveTo(6, 54); g.quadraticCurveTo(40, 80, 80, 36); g.lineTo(70, 38); g.quadraticCurveTo(40, 62, 12, 50); g.closePath(); g.fill();
      g.fillStyle = '#2e6a52'; g.beginPath(); g.moveTo(12, 50); g.quadraticCurveTo(40, 62, 70, 38); g.lineTo(62, 36); g.quadraticCurveTo(40, 52, 16, 46); g.closePath(); g.fill();
      g.fillStyle = '#3a7a60'; g.beginPath(); g.moveTo(40, 50); g.lineTo(48, 14); g.lineTo(56, 44); g.closePath(); g.fill();
      g.fillStyle = '#4e9474'; g.beginPath(); g.moveTo(48, 14); g.lineTo(52, 30); g.lineTo(46, 32); g.closePath(); g.fill();
      g.fillStyle = '#24584a'; g.beginPath(); g.moveTo(24, 48); g.lineTo(30, 30); g.lineTo(36, 50); g.closePath(); g.fill();
    });
  }

  function expressSprite() {
    let cv = art.get('express');
    if (cv) return cv;
    cv = G.mkCanvas(26, 11);
    const g = cv.getContext('2d'), R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    R(2, 1, 19, 8, '#1a0a0a'); R(3, 2, 17, 6, '#7a1c22'); R(4, 1, 15, 1, '#3a1010'); R(3, 6, 17, 1, '#d8b060');
    for (let i = 0; i < 4; i++) R(5 + i * 4, 3, 2, 2, '#ffe8a0');
    R(20, 3, 3, 6, '#1a1a22'); R(20, 4, 3, 4, '#a8acb8'); R(23, 6, 2, 3, '#6a6e7a');
    for (const x of [5, 10, 15]) R(x, 9, 3, 2, '#20202a');
    art.set('express', cv);
    return cv;
  }

  function planet(id) {
    let cv = art.get('planet|' + id);
    if (cv) return cv;
    cv = id === 'jarilo' ? jariloCanvas() : id === 'belzerg' ? belzergCanvas() : id === 'herta' ? hertaCanvas() : luofuCanvas();
    art.set('planet|' + id, cv);
    return cv;
  }

  function spaceCanvas(vw) {
    const w = vw || W, ox = (w - W) / 2, key = 'space|' + w;
    let cv = art.get(key);
    if (cv) return cv;
    cv = G.mkCanvas(w, HGT);
    const g = cv.getContext('2d'), R = (x, y, rw, rh, col) => { g.fillStyle = col; g.fillRect(x, y, rw, rh); };
    const gr = g.createLinearGradient(0, 0, w, HGT);
    gr.addColorStop(0, '#03050f'); gr.addColorStop(0.55, '#081030'); gr.addColorStop(1, '#0c1a40');
    g.fillStyle = gr; g.fillRect(0, 0, w, HGT);
    for (let y = 0; y < HGT; y += 2) for (let x = 0; x < w; x += 2) {
      const band = 1 - Math.abs(((x - ox) * 0.62 + y) - 470) / 170;
      if (band <= 0) continue;
      const v = fbm(x / 70, y / 70, 5) * band + (BAYER[((y >> 1) & 3) * 4 + ((x >> 1) & 3)] / 16 - 0.5) * 0.18;
      if (v > 0.5) R(x, y, 2, 2, v > 0.66 ? '#243468' : v > 0.58 ? '#1a2854' : '#121c44');
    }
    for (let i = 0; i < 220; i++) {
      const x = Math.floor(G.hash(i, 1, 7) * w), y = Math.floor(G.hash(i, 2, 7) * HGT), h = G.hash(i, 3, 7);
      R(x, y, 1, 1, h < 0.7 ? '#8a94c0' : h < 0.9 ? '#e8ecff' : '#ffe0a0');
      if (h > 0.97) { R(x - 1, y, 3, 1, '#c8d0ff'); R(x, y - 1, 1, 3, '#c8d0ff'); }
    }
    const dots = (cx, cy, rx, ry, rot, step, col) => {
      const n = Math.round(Math.PI * (rx + ry) / step);
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
        const x = cx + ex * Math.cos(rot) - ey * Math.sin(rot), y = cy + ex * Math.sin(rot) + ey * Math.cos(rot);
        R(Math.round(x), Math.round(y), 2, 2, col);
      }
    };
    dots(322 + ox, 250, 300, 190, -0.12, 7, '#4a3e26');
    dots(322 + ox, 190, 180, 120, 0.2, 6, '#3e3420');
    dots(150 + ox, 292, 96, 96, 0, 8, '#2e2818');
    g.strokeStyle = '#6a5328'; g.lineWidth = 1; g.strokeRect(8.5, 8.5, w - 17, HGT - 17);
    g.strokeStyle = '#2a2214'; g.strokeRect(11.5, 11.5, w - 23, HGT - 23);
    for (const [x, y] of [[8, 8], [w - 8, 8], [8, HGT - 8], [w - 8, HGT - 8]]) {
      g.strokeStyle = '#8a6c34'; g.beginPath(); g.arc(x, y, 14, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = '#4a3a1c'; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke();
    }
    art.set(key, cv);
    return cv;
  }

  function drawRail(c, pts, col, dark) {
    const off = (i, s) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [pts[i][0] - dy / l * s, pts[i][1] + dx / l * s, -dy / l, dx / l];
    };
    for (let i = 0; i < pts.length; i += 2) {
      const [x, y, nx, ny] = off(i, 0);
      c.strokeStyle = dark; c.lineWidth = 2; c.beginPath(); c.moveTo(x - nx * 5, y - ny * 5); c.lineTo(x + nx * 5, y + ny * 5); c.stroke();
    }
    for (const s of [-3, 3]) {
      c.strokeStyle = col; c.lineWidth = 1; c.beginPath();
      pts.forEach((_, i) => { const [x, y] = off(i, s); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
      c.stroke();
    }
  }

  function bezier(a, b, bend, n) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
    const cx = mx - dy * bend, cy = my + dx * bend, out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * cx + t * t * b[0], u * u * a[1] + 2 * u * t * cy + t * t * b[1]]);
    }
    return out;
  }

  Object.assign(H.UI.prototype, {
    navFit(id) {
      const L = H.mapLayout(id);
      let best = 0;
      ZOOMS.forEach((z, i) => { if (L.w * z <= VIEW.w - 20 && L.h * z <= VIEW.h - 20) best = i; });
      return best;
    },

    navRows(world) {
      const g = this.game, rows = [];
      const cars = H.EXPRESS_AREAS.filter(a => !a.hidden && g.areaOpen(a));
      if (cars.length) rows.push({ head: 'Звёздный экспресс' }, ...cars.map(area => ({ area })));
      for (const gr of world.groups) {
        if (world.groups.length > 1 || cars.length) rows.push({ head: gr.name });
        for (const a of gr.areas) rows.push({ area: a });
      }
      return rows;
    },

    navArea(id) { return H.expressArea(id) || (this.game.areaOf(id) || {}).area; },

    navTravel(dest) {
      const g = this.game;
      this.screens = [];
      if (g.pending && g.pending.type === 'ui') g.pending = null;
      g.travel(dest);
      this.sfx('warp');
      if (g.script) g.advanceScript();
    },

    paperRect(c, x, y, w, h) {
      const tex = paperTexture();
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      for (let yy = y; yy < y + h; yy += 64) for (let xx = x; xx < x + w; xx += 64) c.drawImage(tex, xx, yy);
      c.restore();
    },

    navFrame(c, x, y, w, h) {
      c.fillStyle = '#010208'; c.fillRect(x - 4, y - 4, w + 8, h + 8);
      c.fillStyle = C.brassDk; c.fillRect(x - 3, y - 3, w + 6, h + 6);
      c.fillStyle = C.brass; c.fillRect(x - 2, y - 2, w + 4, h + 4);
      c.fillStyle = '#1a1208'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
      for (const [cx, cy] of [[x - 2, y - 2], [x + w + 1, y - 2], [x - 2, y + h + 1], [x + w + 1, y + h + 1]]) this.diamond(cx, cy, 4, C.brassHi, '#1a1208');
    },

    navBackdrop(c) {
      const gr = c.createLinearGradient(0, 0, 0, HGT);
      gr.addColorStop(0, '#10153c'); gr.addColorStop(1, '#05071a');
      c.fillStyle = gr; c.fillRect(0, 0, W, HGT);
      c.fillStyle = this.dither(); c.fillRect(0, 0, W, HGT);
    },

    navHeader(c, sub, title) {
      G.menuIcon(c, 'nav', 12, 9, 28, C.brassHi);
      this.text(sub, 46, 9, { size: 10, col: C.sub });
      this.text(title, 46, 21, { size: 17, bold: true, serif: true, col: C.gold });
      const x0 = 46 + this.measure(title, 17, true, true) + 14;
      if (x0 < 420) { c.fillStyle = 'rgba(201,164,92,0.55)'; c.fillRect(x0, 33, 440 - x0, 1); this.diamond(440, 33.5, 3, C.brass); }
    },

    compass(c, x, y) {
      c.strokeStyle = 'rgba(44,48,57,0.7)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.stroke();
      c.fillStyle = P.ink; c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x + 3, y); c.lineTo(x - 3, y); c.closePath(); c.fill();
      c.fillStyle = '#eef0f3'; c.beginPath(); c.moveTo(x, y + 12); c.lineTo(x + 3, y); c.lineTo(x - 3, y); c.closePath(); c.fill();
      c.strokeStyle = P.ink; c.beginPath(); c.moveTo(x, y + 12); c.lineTo(x + 3, y); c.lineTo(x - 3, y); c.closePath(); c.stroke();
      this.text('С', x, y - 24, { size: 10, bold: true, serif: true, col: P.ink, align: 'center', shadow: false });
    },

    playerMark(c, x, y, dir, size, cone) {
      const a = DIR_ANGLE[dir] || 0;
      if (cone) {
        const gr = c.createRadialGradient(x, y, 2, x, y, cone);
        gr.addColorStop(0, 'rgba(128,224,255,0.55)'); gr.addColorStop(1, 'rgba(128,224,255,0)');
        c.fillStyle = gr; c.beginPath(); c.moveTo(x, y); c.arc(x, y, cone, a - Math.PI / 2 - 0.55, a - Math.PI / 2 + 0.55); c.closePath(); c.fill();
      }
      c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(a);
      G.mapIcon(c, 'player', -size / 2, -size / 2, size);
      c.restore();
    },

    navPointTitle(p) {
      if (p.kind === 'exit') { const a = this.navArea(p.to); return 'Проход: ' + (a && this.game.areaOpen(a) ? a.name : '???'); }
      if (p.kind === 'shop' || p.kind === 'rumor') return p.kind === 'rumor' ? p.who : p.name;
      return p.name;
    },

    drawChart(c, s, pts) {
      const g = this.game, v = VIEW, area = this.navArea(s.area), open = area && g.areaOpen(area);
      this.navFrame(c, v.x, v.y, v.w, v.h);
      this.paperRect(c, v.x, v.y, v.w, v.h);
      c.save(); c.beginPath(); c.rect(v.x, v.y, v.w, v.h); c.clip();
      if (!open) {
        this.text('?', v.x + v.w / 2, v.y + v.h / 2 - 70, { size: 72, bold: true, serif: true, col: '#a2a7b1', align: 'center', shadow: false });
        this.text('Нет данных навигации', v.x + v.w / 2, v.y + v.h / 2 + 16, { size: 14, bold: true, serif: true, col: P.ink, align: 'center', shadow: false });
        this.text('Зона откроется по ходу сюжета.', v.x + v.w / 2, v.y + v.h / 2 + 38, { size: 11, col: '#4a505c', align: 'center', shadow: false });
        c.restore();
        return;
      }
      const base = ZOOMS[s.zoom], cell = s.scale || base, L = H.mapLayout(s.area), ox = Math.round(v.x + s.px), oy = Math.round(v.y + s.py);
      c.fillStyle = P.grid;
      for (let x = 0; x <= L.w; x += 4) c.fillRect(Math.round(ox + x * cell), v.y, 1, v.h);
      for (let y = 0; y <= L.h; y += 4) c.fillRect(v.x, Math.round(oy + y * cell), v.w, 1);
      if (cell === base) c.drawImage(chartCanvas(s.area, base), ox, oy);
      else {
        const smooth = c.imageSmoothingEnabled;
        c.imageSmoothingEnabled = true;
        c.drawImage(chartCanvas(s.area, ZOOMS.find(z => z >= cell) || ZOOMS[ZOOMS.length - 1]), ox, oy, Math.round(L.w * cell), Math.round(L.h * cell));
        c.imageSmoothingEnabled = smooth;
      }
      for (const [ch, mk] of Object.entries(L.def.marks)) {
        if (mk.type !== 'gate' || g.state.flags[mk.flag] || !L.marks[ch]) continue;
        for (const [x, y] of L.marks[ch]) { c.fillStyle = '#d84848'; c.fillRect(Math.round(ox + x * cell), Math.round(oy + y * cell + cell * 0.35), Math.round(cell), Math.max(2, Math.round(cell * 0.3))); }
      }
      const pos = p => [Math.round(ox + (p.x + 0.5) * cell), Math.round(oy + (p.y + 0.5) * cell)];
      pts.forEach(p => {
        if (!p.goal) return;
        const [x, y] = pos(p), r = 11 + 2 * Math.sin(this.t * 4);
        c.strokeStyle = 'rgba(122,84,16,0.8)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = '#f2c040'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
      });
      if (s.area === g.map.id) {
        const pl = g.player;
        this.playerMark(c, ox + (pl.fx + 0.5) * cell, oy + (pl.fy + 0.5) * cell, pl.dir, 16, Math.max(30, cell * 3.2));
      }
      pts.forEach((p, i) => {
        const [x, y] = pos(p);
        G.mapIcon(c, p.kind === 'quest' ? this.questIcon(p.quest) : iconOf(p), x - 8, y - 8, 16);
        if ((p.goal && p.kind !== 'goal') || p.route) G.mapIcon(c, 'goal', x + 3, y - 13, 10);
        if ((p.quest && p.kind !== 'quest') || p.questRoute) G.mapIcon(c, this.questIcon(p.quest || p.questRoute), x - 13, y - 13, 10);
        this.hit(x - 10, y - 10, 20, 20, () => { if (s.sel === i && s.detail) s.act(); else { s.sel = i; s.detail = true; this.sfx('select'); } });
      });
      const sp = pts[s.sel];
      if (sp) {
        const [x, y] = pos(sp), b = 13 + Math.round(Math.sin(this.t * 6));
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const cx = Math.round(x + sx * b), cy = Math.round(y + sy * b);
          c.fillStyle = '#1a1208'; c.fillRect(cx - (sx > 0 ? 5 : 0), cy - 1, 6, 3); c.fillRect(cx - 1, cy - (sy > 0 ? 5 : 0), 3, 6);
          c.fillStyle = C.brassHi; c.fillRect(cx - (sx > 0 ? 4 : 0), cy, 5, 1); c.fillRect(cx, cy - (sy > 0 ? 4 : 0), 1, 5);
        }
        const label = this.navPointTitle(sp), lw = Math.round(this.measure(label, 10, true) + 12);
        const lx = Math.round(clamp(x - lw / 2, v.x + 4, v.x + v.w - lw - 4)), ly = Math.round(y - b - 20 < v.y + 4 ? y + b + 6 : y - b - 20);
        c.fillStyle = 'rgba(6,8,24,0.88)'; c.fillRect(lx, ly, lw, 14);
        c.fillStyle = C.brass; c.fillRect(lx, ly + 13, lw, 1);
        this.text(label, lx + lw / 2, ly + 1, { size: 10, bold: true, align: 'center', col: sp.goal ? C.gold : C.cream });
      }
      c.restore();
      this.compass(c, v.x + v.w - 22, v.y + 40);
    },

    navCounters(c, id) {
      const g = this.game, area = this.navArea(id);
      if (!area || !g.areaOpen(area)) return;
      const ch = g.chestCount(id), anchors = H.mapLayout(id).anchors, on = anchors.filter(a => g.state.anchors.includes(a.key)).length;
      const pill = (x, icon, text, done) => {
        c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(x, 12, 70, 22);
        c.fillStyle = done ? C.ok : C.brass; c.fillRect(x, 33, 70, 1);
        G.mapIcon(c, icon, x + 4, 15, 16);
        this.text(text, x + 24, 16, { size: 11, bold: true, col: done ? C.ok : C.cream });
      };
      pill(452, 'chest', ch.total ? ch.got + ' / ' + ch.total : '—', ch.total > 0 && ch.got === ch.total);
      pill(528, on ? 'anchor' : 'anchorOff', anchors.length ? on + ' / ' + anchors.length : '—', anchors.length > 0 && on === anchors.length);
    },

    navListLayout(s) {
      const g = this.game, p = PANEL, rows = this.navRows(s.world), goal = g.objTarget(), qt = g.questTarget();
      const tight = rows.length > 10, y0 = p.y + LIST.top, view = p.h - LIST.top - LIST.bottom;
      const measure = inset => rows.map(r => {
        if (r.head) return { head: r.head, h: tight ? 18 : 22 };
        const a = r.area, open = g.areaOpen(a), here = a.map === g.map.id, aim = !!(goal && goal.map === a.map), qaim = !!(qt && qt.map === a.map);
        const label = open ? a.name : '???', avail = p.w - 42 - inset - ((here ? 1 : 0) + (aim ? 1 : 0) + (qaim ? 1 : 0) + (open ? 0 : 1)) * 16;
        const lines = this.measure(label, 12, true) <= avail ? [label] : this.wrap(label, avail - 4, 11).slice(0, 2);
        const rh = lines.length > 1 ? (tight ? 30 : 34) : (tight ? 20 : 24);
        return { area: a, open, here, aim, qaim, lines, rh, h: rh + (tight ? 1 : 2) };
      });
      const total = list => list.reduce((sum, r) => sum + r.h, 0);
      let items = measure(0), inset = 0, maxTop = 0;
      if (total(items) > view) {
        inset = LIST.bar;
        items = measure(inset);
        maxTop = items.length;
        for (let used = 0; maxTop > 0 && used + items[maxTop - 1].h <= view; maxTop--) used += items[maxTop - 1].h;
      }
      const sc = s.sc;
      sc.top = clamp(Math.round(sc.top), 0, maxTop);
      if (sc.sel !== s.area) {
        sc.sel = s.area;
        const i = items.findIndex(r => r.area && r.area.map === s.area);
        if (i >= 0) {
          const first = i > 0 && items[i - 1].head ? i - 1 : i;
          if (first < sc.top) sc.top = first;
          for (let used = total(items.slice(sc.top, i + 1)); used > view; sc.top++) used -= items[sc.top].h;
        }
      }
      const shown = [];
      let y = y0;
      for (let i = sc.top; i < items.length && y + items[i].h <= y0 + view; i++) { shown.push(Object.assign({ y }, items[i])); y += items[i].h; }
      return { items, shown, tight, inset, maxTop, y: y0, view };
    },

    navList(c, s) {
      const g = this.game, p = PANEL, qt = g.questTarget(), L = this.navListLayout(s), tight = L.tight, w = p.w - L.inset;
      this.button(p.x + 10, p.y + 12, p.w - 20, 26, 'Звёздный путь', () => s.key(null, 'Tab'), { icon: 'warp' });
      for (const r of L.shown) {
        const y = r.y;
        if (r.head) {
          const hy = y - (tight ? 2 : 0);
          c.fillStyle = 'rgba(242,220,154,0.08)'; c.fillRect(p.x + 6, hy + 2, w - 12, 18);
          this.diamond(p.x + 14, hy + 11, 3, C.brass);
          this.text(r.head, p.x + 22, hy + 5, { size: 10, col: C.sub });
          c.fillStyle = 'rgba(201,164,92,0.35)'; c.fillRect(p.x + 28 + this.measure(r.head, 10), hy + 11, w - 40 - this.measure(r.head, 10), 1);
          continue;
        }
        const a = r.area, on = a.map === s.area, { open, here, aim, qaim, lines, rh } = r, mid = y + rh / 2;
        if (on) {
          const gr = c.createLinearGradient(p.x + 6, 0, p.x + w - 6, 0);
          gr.addColorStop(0, 'rgba(242,220,154,0.32)'); gr.addColorStop(1, 'rgba(242,220,154,0.04)');
          c.fillStyle = gr; c.fillRect(p.x + 6, y, w - 12, rh);
          c.fillStyle = C.brassHi; c.fillRect(p.x + 6, y, 2, rh);
          this.cursor(p.x + 10, mid);
        }
        let rx = p.x + w - 14;
        if (here) {
          c.fillStyle = '#08202a'; c.beginPath(); c.moveTo(rx - 6, mid - 6); c.lineTo(rx + 6, mid - 6); c.lineTo(rx, mid + 6); c.closePath(); c.fill();
          c.fillStyle = C.cyan; c.beginPath(); c.moveTo(rx - 4, mid - 5); c.lineTo(rx + 4, mid - 5); c.lineTo(rx, mid + 3); c.closePath(); c.fill();
          rx -= 16;
        }
        if (aim) { G.mapIcon(c, 'goal', rx - 6, mid - 6, 12); rx -= 16; }
        if (qaim) { G.mapIcon(c, this.questIcon(qt.quest), rx - 6, mid - 6, 12); rx -= 16; }
        if (!open) G.mapIcon(c, 'padlock', rx - 6, mid - 7, 14);
        const size = lines.length > 1 ? 11 : 12;
        lines.forEach((l, i) => this.text(l, p.x + 22, mid - lines.length * (size + 2) / 2 + i * (size + 2), { size, bold: on, col: open ? (on ? C.gold : C.cream) : C.dim }));
        this.hit(p.x + 6, y, w - 12, rh, () => { if (s.area !== a.map) { s.setArea(a.map); this.sfx('select'); } });
      }
      if (L.maxTop) {
        this.wheelZone(p.x, L.y, p.w, L.view, d => { s.sc.top += d; });
        this.scrollBar(p.x + p.w - 17, L.y, L.view, s.sc, L.items.length, L.items.length - L.maxTop);
      }
    },

    navDetail(c, s, pt) {
      const g = this.game, p = PANEL, area = this.navArea(pt.map);
      c.fillStyle = '#04061a'; c.fillRect(p.x + 6, p.y + 8, p.w - 12, 44);
      c.fillStyle = C.brass; c.fillRect(p.x + 6, p.y + 51, p.w - 12, 1);
      G.mapIcon(c, pt.kind === 'quest' ? this.questIcon(pt.quest) : iconOf(pt), p.x + 12, p.y + 22, 16);
      const title = this.wrap(this.navPointTitle(pt), p.w - 50, 13);
      title.slice(0, 2).forEach((l, i) => this.text(l, p.x + 34, p.y + (title.length > 1 ? 13 : 22) + i * 15, { size: 13, bold: true, serif: true, col: C.gold }));
      this.text(KIND_LABEL[pt.kind] || '', p.x + 12, p.y + 58, { size: 10, col: C.sub });
      let y = p.y + 76;
      const para = (text, col, size) => { for (const l of this.wrap(text, p.w - 24, size || 11)) { this.text(l, p.x + 12, y, { size: size || 11, col: col || C.cream }); y += 14; } y += 6; };
      const status = (ok, text) => {
        this.diamond(p.x + 16, y + 6, 4, ok ? C.ok : ok === null ? C.brass : '#5a3040', '#08101a');
        for (const l of this.wrap(text, p.w - 40, 11)) { this.text(l, p.x + 26, y, { size: 11, col: ok ? C.ok : ok === null ? C.cream : C.bad }); y += 14; }
        y += 4;
      };
      const tp = g.teleportFor(pt);
      let action = null;
      if (pt.kind === 'anchor' || pt.kind === 'landing') {
        para(pt.kind === 'anchor' ? area.text : 'Здесь Экспресс высаживает команду.');
        if (pt.kind === 'anchor') status(pt.on, pt.on ? 'Якорь активирован' : 'Якорь не активирован');
        if (pt.map === g.map.id && Math.abs(pt.x - g.player.x) + Math.abs(pt.y - g.player.y) <= 3) status(true, 'Вы рядом');
        const here = this.canSaveHere();
        action = { label: 'Телепорт', glyph: 'anchor', ok: tp.ok && here, why: !tp.ok ? tp.why : here ? '' : 'Телепорт работает у якоря пространства или в безопасной зоне. Смотреть карту можно где угодно.', fn: () => this.navTravel(tp.dest) };
      } else if (pt.kind === 'exit') {
        const to = this.navArea(pt.to), known = to && g.areaOpen(to);
        if (pt.locked) status(false, pt.lockText || 'Проход закрыт.');
        else para(known ? 'Проход в зону «' + to.name + '».' : 'Проход в неизведанную зону.');
        if (pt.route) status(true, 'По этому пути лежит цель задания');
        if (pt.questRoute) status(true, 'По этому пути лежит цель поручения');
        action = { label: 'Показать зону', glyph: 'exit', ok: !!known, why: known ? '' : 'Зона ещё не исследована.', fn: () => { const from = s.area; s.setArea(pt.to); const back = s.points().findIndex(q => q.kind === 'exit' && q.to === from); if (back >= 0) { s.sel = back; s.detail = true; } this.sfx('select'); } };
      } else if (pt.kind === 'shop') {
        const names = [];
        for (const it of H.SHOPS[pt.shop].items) {
          const [a, b] = it.split(':'), n = a === 'cone' ? (H.CONES[b] || {}).name : (H.ITEMS[a] || {}).name;
          if (n && !names.includes(n)) names.push(n);
        }
        para('Продавец: ' + pt.who + '.', C.sub);
        para('В продаже: ' + names.slice(0, 4).join(', ') + (names.length > 4 ? ' и другое.' : '.'));
      } else if (pt.kind === 'rumor') {
        const all = H.RUMORS.filter(r => r.who === pt.rumor), got = all.filter(r => g.state.flags[r.id]).length;
        para('Продаёт слухи. Купленный слух расходится по городу и сбывается.');
        status(got === all.length || null, 'Куплено слухов: ' + got + ' из ' + all.length);
      } else if (pt.kind === 'warp') para('Терминал прыжков. Здесь тратят звёздные пропуски и нефрит.');
      else if (pt.kind === 'calyx') para('Симулятор Экспресса: Чашелисты, Пещера коррозии и Эхо войны.');
      else if (pt.kind === 'nav') {
        para('Навигационный пульт Экспресса. Отсюда видно весь Звёздный путь.');
        action = { label: 'Звёздный путь', glyph: 'warp', ok: true, why: '', fn: () => s.key(null, 'Tab') };
      }
      const q = pt.quest && g.questList().find(x => x.id === pt.quest);
      if (q) {
        const lines = this.wrap(q.text, p.w - 44, 11), head = this.wrap(q.name, p.w - 44, 10);
        c.fillStyle = 'rgba(176,122,240,0.14)'; c.fillRect(p.x + 8, y - 2, p.w - 16, 8 + (lines.length + head.length) * 14);
        G.mapIcon(c, this.questIcon(q.id), p.x + 12, y, 12);
        for (const l of head) { this.text(l, p.x + 30, y, { size: 10, bold: true, col: H.MISSION_TYPES[q.type].col }); y += 14; }
        for (const l of lines) { this.text(l, p.x + 30, y, { size: 11, col: C.cream }); y += 14; }
        y += 8;
      }
      if (pt.goal) {
        c.fillStyle = 'rgba(242,192,64,0.12)'; c.fillRect(p.x + 8, y - 2, p.w - 16, 4 + this.wrap(g.state.obj, p.w - 44, 11).length * 14);
        G.mapIcon(c, 'goal', p.x + 12, y, 12);
        for (const l of this.wrap(g.state.obj, p.w - 44, 11)) { this.text(l, p.x + 30, y, { size: 11, bold: true, col: C.gold }); y += 14; }
      }
      s.action = action;
      if (!action) return;
      const by = p.y + p.h - 42;
      if (action.why) {
        const lines = this.wrap(action.why, p.w - 24, 10);
        lines.forEach((l, i) => this.text(l, p.x + 12, by - 6 - (lines.length - i) * 13, { size: 10, col: action.ok ? C.sub : '#ffb0a0' }));
      }
      this.button(p.x + 10, by, p.w - 20, 30, action.label, () => s.act(), { active: action.ok, disabled: !action.ok, bold: true });
      if (action.ok) G.mapIcon(c, action.glyph, p.x + 18, by + 7, 16);
    },

    navBottom(c, s) {
      const y = 424;
      this.button(12, y, 20, 20, '−', () => s.zoomBy(-1), { size: 13, bold: true });
      this.rail(40, y + 10, 104, s.zoom / (ZOOMS.length - 1));
      this.button(152, y, 20, 20, '+', () => s.zoomBy(1), { size: 13, bold: true });
      let x = 190;
      for (const [icon, label] of [['anchor', 'Якорь'], ['landing', 'Высадка'], ['exit', 'Проход'], ['goal', 'Цель'], ['quest', 'Миссия'], ['player', 'Вы']]) {
        G.mapIcon(this.ctx, icon, x, y + 4, 12);
        this.text(label, x + 15, y + 4, { size: 10, col: C.sub });
        x += 22 + this.measure(label, 10);
      }
    },

    openNav(close, opts = {}) {
      const ui = this, g = this.game;
      const here = g.areaOf(g.map.id), target = opts.area && g.areaOf(opts.area);
      const s = {
        full: true, close, detail: false, sel: -1, zoom: 0, px: 0, py: 0, scale: 0, snap: true, action: null, sc: { top: 0 },
        world: opts.world || (target ? target.world : here ? here.world : g.currentWorld()),
        area: g.map.id,
        points() { const a = ui.navArea(this.area); return a && g.areaOpen(a) ? g.navPoints(this.area) : []; },
        setArea(id) {
          this.area = id; this.zoom = ui.navFit(id); this.detail = false; this.snap = true;
          const pts = this.points();
          if (id === g.map.id) this.sel = -1;
          else { const gi = pts.findIndex(p => p.goal), ai = pts.findIndex(p => p.kind === 'anchor'); this.sel = gi >= 0 ? gi : ai >= 0 ? ai : pts.length ? 0 : -1; }
        },
        setWorld(w) {
          this.world = w;
          this.sc = { top: 0 };
          const rows = ui.navRows(w).filter(r => r.area && g.areaOpen(r.area));
          const cur = here && here.world === w ? rows.find(r => r.area.map === g.map.id) : null, first = rows.find(r => !H.expressArea(r.area.map)) || rows[0];
          const land = rows.find(r => !H.expressArea(r.area.map) && H.DESTINATIONS.some(d => d.map === r.area.map && g.cond(d.need)));
          this.setArea((cur || land || first || { area: H.EXPRESS_AREA }).area.map);
        },
        zoomBy(d) {
          const z = clamp(this.zoom + d, 0, ZOOMS.length - 1);
          if (z === this.zoom) { ui.sfx('deny'); return; }
          this.zoom = z; ui.sfx('select');
        },
        focus() {
          const pts = this.points(), p = pts[this.sel];
          if (p) return [p.x + 0.5, p.y + 0.5];
          if (this.area === g.map.id) return [g.player.fx + 0.5, g.player.fy + 0.5];
          const L = H.mapLayout(this.area);
          return [L.w / 2, L.h / 2];
        },
        tick(dt) {
          const L = H.mapLayout(this.area), cell = ZOOMS[this.zoom], cw = L.w * cell, ch = L.h * cell, [fx, fy] = this.focus();
          const tx = cw <= VIEW.w ? (VIEW.w - cw) / 2 : clamp(VIEW.w / 2 - fx * cell, VIEW.w - cw, 0);
          const ty = ch <= VIEW.h ? (VIEW.h - ch) / 2 : clamp(VIEW.h / 2 - fy * cell, VIEW.h - ch, 0);
          if (this.snap || !this.scale) { this.px = tx; this.py = ty; this.scale = cell; this.snap = false; return; }
          const k = Math.min(1, dt * 12), was = this.scale;
          const scale = Math.abs(cell - was) < 0.01 ? cell : Math.exp(Math.log(was) + (Math.log(cell) - Math.log(was)) * k);
          const mid = (off, view, t) => (view / 2 - off) / t;
          const mx = mid(this.px, VIEW.w, was), my = mid(this.py, VIEW.h, was);
          const nx = mx + (mid(tx, VIEW.w, cell) - mx) * k, ny = my + (mid(ty, VIEW.h, cell) - my) * k;
          this.scale = scale;
          this.px = VIEW.w / 2 - nx * scale; this.py = VIEW.h / 2 - ny * scale;
        },
        cycle(d) {
          const pts = this.points();
          if (!pts.length) { ui.sfx('deny'); return; }
          if (this.sel < 0 || this.sel >= pts.length) {
            const px = this.area === g.map.id ? g.player.x : -1;
            let i = -1;
            if (d > 0) i = pts.findIndex(p => p.x >= px);
            else for (let j = pts.length - 1; j >= 0; j--) if (pts[j].x <= px) { i = j; break; }
            this.sel = i < 0 ? (d > 0 ? 0 : pts.length - 1) : i;
          } else this.sel = (this.sel + d + pts.length) % pts.length;
          ui.sfx('select');
        },
        stepArea(d) {
          const rows = ui.navRows(this.world).filter(r => r.area);
          let i = rows.findIndex(r => r.area.map === this.area);
          i = (i + d + rows.length) % rows.length;
          this.setArea(rows[i].area.map);
          ui.sfx('select');
        },
        act() {
          const a = this.action;
          if (!a || !a.ok) { ui.sfx('deny'); if (a && a.why) ui.toast(a.why); return; }
          a.fn();
        },
        exit() { ui.screens.pop(); ui.sfx('cancel'); if (this.close) this.close(); },
        draw(c) {
          const pts = this.points();
          if (this.sel >= pts.length) { this.sel = -1; this.detail = false; }
          ui.navBackdrop(c);
          ui.navHeader(c, 'Навигация', this.world.name);
          ui.navCounters(c, this.area);
          ui.closeBtn(W - 32, 12, () => this.exit());
          ui.drawChart(c, this, pts);
          ui.win(PANEL.x, PANEL.y, PANEL.w, PANEL.h, { top: '#161c4a', bottom: '#080b24' });
          this.action = null;
          if (this.detail && pts[this.sel]) ui.navDetail(c, this, pts[this.sel]);
          else { this.detail = false; ui.navList(c, this); }
          ui.navBottom(c, this);
          if (this.detail) ui.hints([['←→', 'метка']].concat(this.action ? [['Enter', this.action.label]] : [], [['Esc', 'к списку']]), 12, HGT - 20);
          else ui.hints([['↑↓', 'зона'], ['←→', 'метка'], ['Enter', 'подробно'], ['Q E', 'масштаб'], ['Tab', 'Звёздный путь'], ['Esc', 'закрыть']], 12, HGT - 20);
        },
        key(k, code) {
          if (code === 'KeyQ' || code === 'Minus' || code === 'NumpadSubtract') return this.zoomBy(-1);
          if (code === 'KeyE' || code === 'Equal' || code === 'NumpadAdd') return this.zoomBy(1);
          if (code === 'Tab') {
            ui.openStarMap(null, w => { ui.screens.pop(); ui.sfx('confirm'); this.setWorld(w); }, this.world);
            return;
          }
          if (code === 'KeyM') return this.exit();
          if (k === 'up') return this.stepArea(-1);
          if (k === 'down') return this.stepArea(1);
          if (k === 'left') return this.cycle(-1);
          if (k === 'right') return this.cycle(1);
          if (k === 'ok') {
            if (this.detail) return this.act();
            if (this.points()[this.sel]) { this.detail = true; ui.sfx('confirm'); return; }
            ui.sfx('deny');
            return;
          }
          if (k === 'back') { if (this.detail) { this.detail = false; ui.sfx('cancel'); } else this.exit(); }
        }
      };
      if (opts.world && !(here && here.world === opts.world)) s.setWorld(opts.world);
      else s.setArea(opts.area || g.map.id);
      if (opts.goal) { const gi = s.points().findIndex(p => p.goal || p.route); if (gi >= 0) s.sel = gi; }
      if (opts.quest) { const qi = s.points().findIndex(p => p.quest === opts.quest || p.questRoute === opts.quest); if (qi >= 0) { s.sel = qi; s.detail = true; } }
      s.tick(0);
      return this.push(s);
    },

    openStarMap(close, pick, from) {
      const ui = this, g = this.game;
      const worlds = H.WORLDS;
      const cur = from || g.currentWorld();
      const s = {
        full: true, close, sel: Math.max(0, worlds.indexOf(cur)),
        exit() { ui.screens.pop(); ui.sfx('cancel'); if (this.close) this.close(); },
        choose(i) {
          const w = worlds[i];
          if (!g.worldOpen(w)) { ui.sfx('deny'); ui.toast('Путь в «' + w.name + '» ещё не проложен.'); return; }
          if (pick) pick(w); else ui.openNav(null, { world: w });
        },
        draw(c) {
          c.drawImage(spaceCanvas(ui.vw), ui.left, 0);
          const here = g.currentWorld(), park = g.expressWorld(), goal = g.objTarget(), goalWorld = goal && (g.areaOf(goal.map) || {}).world;
          const pos = w => WORLD_POS[w.id];
          for (let i = 0; i + 1 < worlds.length; i++) {
            const a = worlds[i], b = worlds[i + 1], pts = bezier(pos(a), pos(b), 0.22, 32).slice(5, 28);
            if (g.worldOpen(b)) drawRail(c, pts, C.brass, '#4a3a1c');
            else pts.forEach((p, j) => { if (j % 2 === 0) { c.fillStyle = 'rgba(120,110,160,0.5)'; c.fillRect(Math.round(p[0]), Math.round(p[1]), 2, 2); } });
          }
          worlds.forEach((w, i) => {
            const [x, y] = pos(w), open = g.worldOpen(w), on = i === this.sel, R = 46;
            if (on) {
              const n = 36;
              for (let j = 0; j < n; j++) {
                const a = j / n * Math.PI * 2 + ui.t * 0.4;
                c.fillStyle = j % 3 ? 'rgba(242,220,154,0.55)' : C.brassHi; c.fillRect(Math.round(x + Math.cos(a) * (R + 10)), Math.round(y + Math.sin(a) * (R + 10)), 2, 2);
              }
            }
            c.fillStyle = '#060a20'; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#1a1208'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.stroke();
            c.strokeStyle = on ? C.brassHi : open ? C.brass : '#4a4030'; c.lineWidth = 2; c.stroke();
            for (let j = 0; j < 8; j++) {
              const a = j / 8 * Math.PI * 2 + Math.PI / 8, r0 = R + 2, r1 = R + (j % 2 ? 5 : 8);
              c.strokeStyle = open ? C.brass : '#4a4030'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.stroke();
            }
            for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) ui.diamond(x + Math.cos(a) * R, y + Math.sin(a) * R, 4, open ? C.brassHi : '#5a5040', '#1a1208');
            const pc = planet(w.id);
            c.save();
            if (!open) c.globalAlpha = 0.4;
            c.imageSmoothingEnabled = false;
            c.drawImage(pc, Math.round(x - pc.width / 2), Math.round(y - pc.height / 2));
            c.restore();
            if (!open) ui.text('?', x, y - 16, { size: 28, bold: true, serif: true, col: '#c8c0e0', align: 'center' });
            const name = w.name, nw = ui.measure(name, 14, true, true);
            const ly = y + R + 14;
            const rw = Math.max(160, Math.round(nw + 36));
            c.fillStyle = open ? 'rgba(201,164,92,0.6)' : 'rgba(90,80,64,0.6)'; c.fillRect(x - rw / 2, ly - 3, rw, 1); c.fillRect(x - rw / 2, ly + 21, rw, 1);
            ui.diamond(x, ly - 3, 3, open ? C.brass : '#5a5040');
            ui.text(name, x, ly + 2, { size: 14, bold: true, serif: true, align: 'center', col: open ? (on ? C.gold : C.cream) : C.dim });
            if (w === here) {
              const vx = Math.round(x + nw / 2 + 12), vy = ly + 4;
              c.fillStyle = '#08202a'; c.beginPath(); c.moveTo(vx - 6, vy); c.lineTo(vx + 6, vy); c.lineTo(vx, vy + 12); c.closePath(); c.fill();
              c.fillStyle = C.cyan; c.beginPath(); c.moveTo(vx - 4, vy + 1); c.lineTo(vx + 4, vy + 1); c.lineTo(vx, vy + 9); c.closePath(); c.fill();
            }
            if (w === goalWorld) G.mapIcon(c, 'goal', Math.round(x - nw / 2 - 26), ly + 2, 14);
            if (w === park && g.state.flags.doom) {
              const e = expressSprite(), bob = Math.round(Math.sin(ui.t * 2) * 1.5);
              c.save(); c.imageSmoothingEnabled = false;
              c.drawImage(e, Math.round(x + R - 6), Math.round(y - R - 4 + bob), 52, 22);
              c.restore();
            }
            ui.hit(x - R - 8, y - R - 8, (R + 8) * 2, (R + 8) * 2 + 40, () => { if (this.sel === i) this.choose(i); else { this.sel = i; ui.sfx('select'); } });
          });
          G.menuIcon(c, 'nav', 22, 20, 28, C.brassHi);
          ui.text('Навигация', 56, 20, { size: 10, col: C.sub });
          ui.text('Звёздный путь', 56, 32, { size: 17, bold: true, serif: true, col: C.gold });
          ui.closeBtn(W - 42, 22, () => this.exit());
          const w = worlds[this.sel], open = g.worldOpen(w), bx = W / 2 - 170, by = HGT - 92;
          ui.win(bx, by, 340, 50, { alpha: 0.9 });
          if (open) {
            const areas = w.groups.flatMap(gr => gr.areas), known = areas.filter(a => g.areaOpen(a));
            let got = 0, total = 0, an = 0, anT = 0;
            for (const a of known) { const cc = g.chestCount(a.map); got += cc.got; total += cc.total; const L = H.mapLayout(a.map); anT += L.anchors.length; an += L.anchors.filter(x => g.state.anchors.includes(x.key)).length; }
            ui.text(w.name, bx + 14, by + 9, { size: 13, bold: true, serif: true, col: C.gold });
            ui.text(w === here ? 'Вы здесь' : w === park ? 'Здесь стоит Экспресс' : '', bx + 326, by + 11, { size: 10, col: C.cyan, align: 'right' });
            let x = bx + 14;
            ui.text('Зоны ' + known.length + '/' + areas.length, x, by + 30, { size: 11, col: C.cream }); x += 76;
            G.mapIcon(c, 'anchor', x, by + 28, 14); ui.text(an + '/' + anT, x + 17, by + 30, { size: 11, col: C.cream }); x += 56;
            G.mapIcon(c, 'chest', x, by + 28, 14); ui.text(got + '/' + total, x + 17, by + 30, { size: 11, col: C.cream });
          } else {
            ui.text(w.name, bx + 14, by + 9, { size: 13, bold: true, serif: true, col: C.dim });
            ui.text('Путь сюда ещё не проложен.', bx + 14, by + 30, { size: 11, col: C.sub });
          }
          ui.hints([['←→', 'мир'], ['Enter', open ? 'карта мира' : 'недоступно'], ['Esc', 'назад']], W / 2, HGT - 30, { align: 'center' });
        },
        key(k, code) {
          const n = worlds.length;
          if (k === 'left' || k === 'up') { this.sel = (this.sel + n - 1) % n; ui.sfx('select'); return; }
          if (k === 'right' || k === 'down') { this.sel = (this.sel + 1) % n; ui.sfx('select'); return; }
          if (k === 'ok') return this.choose(this.sel);
          if (k === 'back' || code === 'Tab') this.exit();
        }
      };
      return this.push(s);
    },

    minimapDocks() {
      const w = MINIMAP.w, h = MINIMAP.h;
      return [{ x: this.left + 10, y: HGT - h - 14, w, h, from: -1 }, { x: this.right - w - 10, y: HGT - 52 - h - 14, w, h, from: 1 }];
    },

    playerScreenBox() {
      const [cx, cy] = this.camera(), p = this.game.player;
      return { x: p.fx * TS - cx, y: p.fy * TS - cy - 20, w: TS, h: 54 };
    },

    minimapCrowded(dock, pad) {
      const b = this.playerScreenBox();
      return b.x < dock.x + dock.w + pad && b.x + b.w > dock.x - pad && b.y < dock.y + dock.h + pad && b.y + b.h > dock.y - pad;
    },

    updateMinimap(dt) {
      const id = this.game.map.id, [home] = this.minimapDocks();
      if (!this.minimap || this.minimap.map !== id) {
        const side = this.minimapCrowded(home, MINIMAP.near) ? 1 : 0;
        this.minimap = { map: id, side, want: side, a: 1 };
      }
      const m = this.minimap;
      if (m.want === 0 && this.minimapCrowded(home, MINIMAP.near)) m.want = 1;
      else if (m.want === 1 && !this.minimapCrowded(home, MINIMAP.far)) m.want = 0;
      if (m.want !== m.side) {
        m.a = Math.max(0, m.a - dt / MINIMAP.fade);
        if (m.a === 0) m.side = m.want;
      } else m.a = Math.min(1, m.a + dt / MINIMAP.fade);
    },

    drawMinimap(c) {
      const g = this.game, id = g.map.id, L = H.mapLayout(id), cell = 4, pl = g.player;
      if (!this.minimap || this.minimap.map !== id) this.updateMinimap(0);
      const m = this.minimap, dock = this.minimapDocks()[m.side], ease = 1 - (1 - m.a) * (1 - m.a);
      if (m.a <= 0) return;
      const mw = dock.w, mh = dock.h, x = dock.x + Math.round(dock.from * (1 - ease) * MINIMAP.slide), y = dock.y;
      c.save(); c.globalAlpha = ease;
      this.navFrame(c, x, y, mw, mh);
      this.paperRect(c, x, y, mw, mh);
      const cw = L.w * cell, ch = L.h * cell;
      const ox = Math.round(x + (cw <= mw ? (mw - cw) / 2 : clamp(mw / 2 - (pl.fx + 0.5) * cell, mw - cw, 0)));
      const oy = Math.round(y + (ch <= mh ? (mh - ch) / 2 : clamp(mh / 2 - (pl.fy + 0.5) * cell, mh - ch, 0)));
      c.save(); c.beginPath(); c.rect(x, y, mw, mh); c.clip();
      c.drawImage(chartCanvas(id, cell), ox, oy);
      const pts = g.navPoints(id);
      const tm = g.missionTracked(), tq = tm && tm.id !== 'main' ? tm.id : null, tcol = tm ? H.MISSION_TYPES[tm.type].col : '#f2c040';
      let goalAt = null;
      for (const p of pts) {
        const px = ox + (p.x + 0.5) * cell, py = oy + (p.y + 0.5) * cell;
        if (p.kind === 'anchor') this.diamond(px, py, 3.5, p.on ? C.cyan : '#9aa2b8', '#08101a');
        else if (p.kind === 'exit') { c.fillStyle = '#1a1208'; c.fillRect(Math.round(px) - 2, Math.round(py) - 2, 5, 5); c.fillStyle = p.locked ? '#ff6a6a' : C.brassHi; c.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3); }
        else if (p.kind !== 'goal') { c.fillStyle = '#1a1208'; c.fillRect(Math.round(px) - 2, Math.round(py) - 2, 4, 4); c.fillStyle = '#e8d8a8'; c.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2); }
        if (tq ? p.quest === tq || p.questRoute === tq : tm && (p.goal || p.route)) goalAt = [px, py];
      }
      const pxl = ox + (pl.fx + 0.5) * cell, pyl = oy + (pl.fy + 0.5) * cell;
      this.playerMark(c, pxl, pyl, pl.dir, 10, 18);
      if (goalAt) {
        const inside = goalAt[0] > x + 4 && goalAt[0] < x + mw - 4 && goalAt[1] > y + 4 && goalAt[1] < y + mh - 4;
        if (inside) this.diamond(goalAt[0], goalAt[1], 4 + Math.sin(this.t * 5), tcol, '#3a2808');
        else {
          const a = Math.atan2(goalAt[1] - pyl, goalAt[0] - pxl), ex = clamp(pxl + Math.cos(a) * 80, x + 7, x + mw - 7), ey = clamp(pyl + Math.sin(a) * 80, y + 7, y + mh - 7);
          c.save(); c.translate(ex, ey); c.rotate(a);
          c.fillStyle = '#3a2808'; c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -5); c.lineTo(-4, 5); c.closePath(); c.fill();
          c.fillStyle = tcol; c.beginPath(); c.moveTo(4, 0); c.lineTo(-3, -3); c.lineTo(-3, 3); c.closePath(); c.fill();
          c.restore();
        }
      }
      c.restore();
      this.keycap(x + mw - 12, y + mh - 8, 'M');
      c.restore();
    }
  });

  Object.assign(H.Gfx, { navChart: chartCanvas, navPlanet: planet });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
