(function (F) {
  'use strict';

  const C = F.col;
  const MAT = F.MAT;
  const shade = F.Models.shade;
  const SZ = 1024, PAD = 2;
  const REGIONS = [
    ['k_prese', 160, 128], ['k_kafija', 160, 128], ['k_ziedi', 160, 128], ['k_loto', 160, 128], ['k_valuta', 160, 128], ['k_saldejums', 160, 128], ['k_hotdog', 160, 128], ['k_tabaka', 160, 128], ['k_biletes', 160, 128], ['k_seklas', 160, 128],
    ['ltvvan', 256, 40], ['railing', 64, 32], ['parkgate', 256, 48], ['picket', 64, 32],
    ['totem', 256, 128], ['sign_bus', 64, 96], ['sign_tram', 64, 96],
    ['g_fruit', 128, 64], ['g_veg', 128, 64], ['g_flowers', 128, 64], ['g_clothes', 128, 64], ['g_honey', 128, 64], ['g_fish', 128, 64], ['g_amber', 128, 64],
    ['sign_main', 64, 64], ['sign_yield', 64, 64], ['sign_stop', 64, 64], ['sign_crossing', 64, 64], ['sign_v50', 64, 64], ['sign_v70', 64, 64], ['sign_p', 64, 64], ['sign_air', 64, 64],
    ['garage', 64, 64], ['chain', 64, 64], ['tail0', 64, 64], ['tail1', 64, 64], ['tail2', 64, 64],
    ['hangar1', 256, 48], ['hangar2', 256, 48], ['liv0', 256, 40], ['liv1', 256, 40], ['liv2', 256, 40],
    ['phone', 128, 32], ['taxi', 128, 32], ['flag_lv', 64, 32], ['flag_air', 64, 32], ['flag_hz', 64, 32], ['feather', 48, 192], ['white', 8, 8]
  ];
  const A = (() => {
    const out = {}, list = REGIONS.slice().sort((a, b) => b[2] - a[2] || b[1] - a[1]);
    let x = 0, y = 0, row = 0;
    for (const [id, w, h] of list) {
      if (x + w + PAD * 2 > SZ) { x = 0; y += row + PAD * 2; row = 0; }
      out[id] = [x + PAD, y + PAD, w, h];
      x += w + PAD * 2;
      row = Math.max(row, h);
    }
    if (y + row + PAD * 2 > SZ) throw new Error('street atlas overflow');
    return out;
  })();

  function uv(id, u0 = 0, v0 = 0, u1 = 1, v1 = 1) {
    const r = A[id];
    const U = u => (r[0] + 0.5 + (r[2] - 1) * u) / SZ, V = v => (r[1] + 0.5 + (r[3] - 1) * v) / SZ;
    return [U(u0), V(v1), U(u1), V(v1), U(u1), V(v0), U(u0), V(v0)];
  }
  const WHITE_UV = (() => { const r = A.white; return [(r[0] + r[2] / 2) / SZ, (r[1] + r[3] / 2) / SZ]; })();

  function txt(x, s, cx, cy, size, col, o = {}) {
    x.save();
    x.font = `${o.style || ''} ${o.weight || 700} ${size}px ${o.font || 'Arial'}`;
    x.textAlign = o.align || 'center';
    x.textBaseline = 'middle';
    const w = x.measureText(s).width;
    if (o.maxW && w > o.maxW) { x.translate(cx, cy); x.scale(o.maxW / w, 1); x.translate(-cx, -cy); }
    if (o.stroke) { x.lineWidth = o.sw || 3; x.strokeStyle = o.stroke; x.strokeText(s, cx, cy); }
    x.fillStyle = col;
    x.fillText(s, cx, cy);
    x.restore();
  }

  function speck(x, w, h, amt, seed) {
    const img = x.getImageData(0, 0, w, h), d = img.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = (j * w + i) * 4;
      if (!d[k + 3]) continue;
      const n = (F.hash2(i, j, seed) - 0.5) * amt;
      d[k] = F.clamp(d[k] + n, 0, 255); d[k + 1] = F.clamp(d[k + 1] + n, 0, 255); d[k + 2] = F.clamp(d[k + 2] + n, 0, 255);
    }
    x.putImageData(img, 0, 0);
  }

  function pedestrian(x, cx, cy, s, col) {
    x.save();
    x.translate(cx, cy); x.scale(s, s);
    x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'; x.lineWidth = 2.6;
    x.beginPath(); x.arc(1, -11, 2.6, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(0, -7); x.lineTo(-1, 2); x.stroke();
    x.beginPath(); x.moveTo(-1, 2); x.lineTo(-5, 10); x.moveTo(-1, 2); x.lineTo(4, 10); x.stroke();
    x.beginPath(); x.moveTo(0, -5); x.lineTo(-5, 0); x.moveTo(0, -5); x.lineTo(5, -1); x.stroke();
    x.restore();
  }

  function busIcon(x, cx, cy, w, col) {
    const h = w * 0.62;
    x.fillStyle = col;
    x.fillRect(cx - w / 2, cy - h / 2, w, h * 0.82);
    x.fillStyle = '#1a4a9a';
    for (let i = 0; i < 4; i++) x.fillRect(cx - w / 2 + 3 + i * (w - 6) / 4, cy - h / 2 + 3, (w - 6) / 4 - 2, h * 0.3);
    x.fillStyle = col;
    x.beginPath(); x.arc(cx - w * 0.28, cy + h * 0.32, w * 0.09, 0, Math.PI * 2); x.arc(cx + w * 0.28, cy + h * 0.32, w * 0.09, 0, Math.PI * 2); x.fill();
  }

  function planeIcon(x, cx, cy, s, col) {
    x.save();
    x.translate(cx, cy); x.scale(s, s); x.rotate(-0.6);
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(0, -14); x.quadraticCurveTo(2, -12, 2, -6); x.lineTo(13, 1); x.lineTo(13, 4); x.lineTo(2, 1); x.lineTo(1.6, 9); x.lineTo(5, 12); x.lineTo(5, 14);
    x.lineTo(0, 12.5); x.lineTo(-5, 14); x.lineTo(-5, 12); x.lineTo(-1.6, 9); x.lineTo(-2, 1); x.lineTo(-13, 4); x.lineTo(-13, 1); x.lineTo(-2, -6); x.quadraticCurveTo(-2, -12, 0, -14);
    x.fill();
    x.restore();
  }

  const KIOSK = {
    prese: { body: '#e8b020', band: '#1a4a9a', text: 'PRESE', ink: '#ffffff' },
    kafija: { body: '#6a3a24', band: '#f0e6d0', text: 'KAFIJA', ink: '#5a2a14' },
    ziedi: { body: '#3a8a4a', band: '#ffffff', text: 'ZIEDI', ink: '#c81e5a' },
    loto: { body: '#c8202e', band: '#ffd23a', text: 'LATLOTO', ink: '#c8202e' },
    valuta: { body: '#e8e4da', band: '#1e5a3a', text: 'VALŪTAS MAIŅA', ink: '#ffffff' },
    saldejums: { body: '#4aa0e0', band: '#ffffff', text: 'SALDĒJUMS', ink: '#e6146e' },
    hotdog: { body: '#e86a1a', band: '#ffd23a', text: 'HOT-DOG', ink: '#c8202e' },
    tabaka: { body: '#3a3a44', band: '#c8a050', text: 'TABAKA', ink: '#1a1a1a' },
    biletes: { body: '#1a4a9a', band: '#f4f4f0', text: 'BIĻETES', ink: '#1a4a9a' },
    seklas: { body: '#5a8a3a', band: '#ffe27a', text: 'SĒKLAS', ink: '#3a5a1a' }
  };

  const P = {};
  P.sign_main = x => {
    x.save(); x.translate(32, 32); x.rotate(Math.PI / 4);
    x.fillStyle = '#ffffff'; x.fillRect(-21, -21, 42, 42);
    x.strokeStyle = '#222'; x.lineWidth = 1.2; x.strokeRect(-21, -21, 42, 42);
    x.fillStyle = '#ffc81e'; x.fillRect(-14, -14, 28, 28);
    x.restore();
  };
  P.sign_yield = x => {
    x.fillStyle = '#d01818'; x.beginPath(); x.moveTo(3, 8); x.lineTo(61, 8); x.lineTo(32, 58); x.closePath(); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(14, 14); x.lineTo(50, 14); x.lineTo(32, 45); x.closePath(); x.fill();
  };
  P.sign_stop = x => {
    x.fillStyle = '#ffffff'; x.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; x.lineTo(32 + Math.cos(a) * 31, 32 + Math.sin(a) * 31); } x.fill();
    x.fillStyle = '#d01818'; x.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; x.lineTo(32 + Math.cos(a) * 28, 32 + Math.sin(a) * 28); } x.fill();
    txt(x, 'STOP', 32, 33, 17, '#ffffff', { weight: 900 });
  };
  P.sign_crossing = x => {
    x.fillStyle = '#ffffff'; x.fillRect(2, 2, 60, 60);
    x.fillStyle = '#1a5ab8'; x.fillRect(5, 5, 54, 54);
    x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(32, 9); x.lineTo(56, 53); x.lineTo(8, 53); x.closePath(); x.fill();
    x.fillStyle = '#111'; for (let i = 0; i < 4; i++) x.fillRect(18 + i * 8, 47, 5, 4);
    pedestrian(x, 33, 36, 0.85, '#111');
  };
  const speed = n => x => {
    x.fillStyle = '#d01818'; x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(32, 32, 23, 0, Math.PI * 2); x.fill();
    txt(x, String(n), 32, 33, 24, '#111', { weight: 900 });
  };
  P.sign_v50 = speed(50);
  P.sign_v70 = speed(70);
  P.sign_p = x => {
    x.fillStyle = '#ffffff'; x.fillRect(2, 2, 60, 60);
    x.fillStyle = '#1a5ab8'; x.fillRect(5, 5, 54, 54);
    txt(x, 'P', 32, 34, 44, '#ffffff', { weight: 900 });
  };
  P.sign_air = x => {
    x.fillStyle = '#ffffff'; x.fillRect(2, 2, 60, 60);
    x.fillStyle = '#1a5ab8'; x.fillRect(5, 5, 54, 54);
    planeIcon(x, 32, 32, 1.45, '#ffffff');
  };
  P.sign_bus = (x, w, h) => {
    x.fillStyle = '#f4f2ea'; x.fillRect(1, 1, w - 2, h - 2);
    x.strokeStyle = '#333'; x.lineWidth = 2; x.strokeRect(2, 2, w - 4, h - 4);
    x.fillStyle = '#ffc81e'; x.fillRect(6, 6, w - 12, 40);
    txt(x, 'A', 20, 27, 26, '#111', { weight: 900 });
    busIcon(x, 44, 26, 22, '#111');
    x.fillStyle = '#1a4a9a'; x.fillRect(6, 50, w - 12, 18);
    txt(x, 'PIETURA', w / 2, 60, 10, '#ffffff', { weight: 900, maxW: w - 16 });
    txt(x, '3  11  15', w / 2, 80, 12, '#111', { weight: 900 });
  };
  P.sign_tram = (x, w, h) => {
    x.fillStyle = '#f4f2ea'; x.fillRect(1, 1, w - 2, h - 2);
    x.strokeStyle = '#333'; x.lineWidth = 2; x.strokeRect(2, 2, w - 4, h - 4);
    x.fillStyle = '#ffc81e'; x.fillRect(6, 6, w - 12, 40);
    txt(x, 'T', 19, 27, 26, '#111', { weight: 900 });
    busIcon(x, 44, 28, 22, '#111');
    x.strokeStyle = '#111'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(40, 21); x.lineTo(51, 13); x.stroke();
    x.fillStyle = '#1a4a9a'; x.fillRect(6, 50, w - 12, 18);
    txt(x, 'PIETURA', w / 2, 60, 10, '#ffffff', { weight: 900, maxW: w - 16 });
    txt(x, '10', w / 2, 80, 14, '#111', { weight: 900 });
  };

  for (const [id, k] of Object.entries(KIOSK)) {
    P['k_' + id] = (x, w, h) => {
      x.fillStyle = k.body; x.fillRect(0, 0, w, h);
      x.fillStyle = k.band; x.fillRect(0, 0, w, 30);
      txt(x, k.text, w / 2, 16, 20, k.ink, { weight: 900, maxW: w - 12 });
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, 30, w, 3);
      x.fillStyle = '#2c3a44'; x.fillRect(10, 40, w - 20, 62);
      x.fillStyle = 'rgba(170,200,220,0.22)'; x.fillRect(10, 40, (w - 20) * 0.45, 62);
      goods(x, id, 12, 42, w - 24, 58);
      x.fillStyle = '#d8d4c8'; x.fillRect(0, 102, w, 4);
      x.fillStyle = shade3(k.body, 0.8); x.fillRect(0, 106, w, 22);
      x.fillStyle = '#2c3a44'; x.fillRect(w / 2 - 18, 86, 36, 16);
      x.strokeStyle = '#d8d4c8'; x.lineWidth = 2; x.strokeRect(w / 2 - 18, 86, 36, 16);
    };
  }

  function shade3(hex, k) {
    const c = C(hex);
    return `rgb(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)})`;
  }

  function goods(x, id, x0, y0, w, h) {
    const r = F.rng(id.length * 31 + 7);
    if (id === 'prese') {
      const cols = ['#e8e4d8', '#c8202e', '#ffd23a', '#2a62b8', '#f4f4f0', '#3a8a4a', '#e6146e'];
      for (let i = 0; i < 9; i++) {
        const px = x0 + (i % 5) * (w / 5) + 2, py = y0 + (i < 5 ? 2 : h / 2 + 2);
        x.fillStyle = cols[i % cols.length]; x.fillRect(px, py, w / 5 - 4, h / 2 - 6);
        x.fillStyle = '#111'; x.fillRect(px + 2, py + 3, w / 5 - 8, 3); x.fillRect(px + 2, py + 9, (w / 5 - 8) * 0.6, 2);
      }
    } else if (id === 'kafija') {
      for (let i = 0; i < 6; i++) {
        const px = x0 + 6 + i * (w - 12) / 6;
        x.fillStyle = '#f4f0e6'; x.fillRect(px, y0 + h - 22, 12, 16);
        x.fillStyle = '#6a3a24'; x.fillRect(px, y0 + h - 22, 12, 4);
      }
      txt(x, '0.25 Ls', x0 + w / 2, y0 + 14, 14, '#ffd23a', { weight: 900 });
    } else if (id === 'ziedi') {
      for (let i = 0; i < 14; i++) {
        const px = x0 + 6 + r() * (w - 12), py = y0 + 8 + r() * (h - 22);
        x.fillStyle = '#3a7a3a'; x.fillRect(px, py + 4, 2, h - (py - y0) - 4);
        x.fillStyle = ['#e6146e', '#ffc81e', '#f4f4f0', '#c81e2a', '#b040c0'][i % 5]; x.beginPath(); x.arc(px + 1, py + 3, 4, 0, Math.PI * 2); x.fill();
      }
    } else if (id === 'loto') {
      for (let i = 0; i < 6; i++) {
        const px = x0 + 4 + (i % 3) * (w / 3), py = y0 + 4 + (i < 3 ? 0 : h / 2);
        x.fillStyle = '#ffd23a'; x.fillRect(px, py, w / 3 - 8, h / 2 - 8);
        txt(x, String(5 + i * 7), px + (w / 3 - 8) / 2, py + (h / 2 - 8) / 2, 12, '#c8202e', { weight: 900 });
      }
    } else if (id === 'valuta') {
      const rows = [['USD', '0.61'], ['DEM', '0.29'], ['EUR', '0.56'], ['RUB', '0.02']];
      x.fillStyle = '#101820'; x.fillRect(x0, y0, w, h);
      rows.forEach(([c, v], i) => {
        txt(x, c, x0 + w * 0.28, y0 + 8 + i * 13, 11, '#ffd23a', { weight: 900 });
        txt(x, v, x0 + w * 0.72, y0 + 8 + i * 13, 11, '#8aff8a', { weight: 900 });
      });
    } else if (id === 'saldejums') {
      for (let i = 0; i < 5; i++) {
        const px = x0 + 10 + i * (w - 20) / 5;
        x.fillStyle = '#d8a060'; x.beginPath(); x.moveTo(px, y0 + 26); x.lineTo(px + 12, y0 + 26); x.lineTo(px + 6, y0 + h - 4); x.fill();
        x.fillStyle = ['#f4f0e6', '#e6146e', '#8a5a3a', '#ffd23a', '#9ad0ff'][i]; x.beginPath(); x.arc(px + 6, y0 + 22, 7, 0, Math.PI * 2); x.fill();
      }
    } else if (id === 'biletes') {
      x.fillStyle = '#101820'; x.fillRect(x0, y0, w, h);
      txt(x, 'TELETORNIS', x0 + w / 2, y0 + 10, 12, '#ffd23a', { weight: 900, maxW: w - 8 });
      txt(x, 'Pieaugušie  Ls 1.50', x0 + w / 2, y0 + 27, 10, '#f4f4f0', { weight: 700, maxW: w - 8 });
      txt(x, 'Bērni  Ls 0.75', x0 + w / 2, y0 + 41, 10, '#f4f4f0', { weight: 700, maxW: w - 8 });
      txt(x, '10:00 - 22:00', x0 + w / 2, y0 + 53, 9, '#8aff8a', { weight: 700, maxW: w - 8 });
    } else if (id === 'seklas') {
      const cols = ['#e84a2a', '#ff9a1a', '#6aa83a', '#c8202e', '#ffd23a', '#8a3a8a', '#3a8a4a', '#e6146e'];
      for (let i = 0; i < 12; i++) {
        const px = x0 + 3 + (i % 6) * (w / 6), py = y0 + 3 + (i < 6 ? 0 : h / 2);
        x.fillStyle = '#f4f0e0'; x.fillRect(px, py, w / 6 - 5, h / 2 - 7);
        x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(px + (w / 6 - 5) / 2, py + 9, 5, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#3a7a3a'; x.fillRect(px + 2, py + h / 2 - 12, w / 6 - 9, 3);
      }
    } else if (id === 'hotdog') {
      x.fillStyle = '#e8b878'; x.fillRect(x0 + w * 0.15, y0 + h * 0.35, w * 0.7, h * 0.3);
      x.fillStyle = '#b8402a'; x.fillRect(x0 + w * 0.1, y0 + h * 0.42, w * 0.8, h * 0.14);
      x.fillStyle = '#ffd23a'; for (let i = 0; i < 6; i++) x.fillRect(x0 + w * 0.15 + i * w * 0.12, y0 + h * 0.44, w * 0.06, 3);
      txt(x, '0.40 Ls', x0 + w / 2, y0 + 10, 12, '#ffd23a', { weight: 900 });
    } else {
      const cols = ['#e8e4d8', '#c8202e', '#1a1a1a', '#2a62b8', '#ffd23a'];
      for (let i = 0; i < 16; i++) {
        const px = x0 + 2 + (i % 8) * (w / 8), py = y0 + 4 + (i < 8 ? 0 : h / 2);
        x.fillStyle = cols[(i * 3) % cols.length]; x.fillRect(px, py, w / 8 - 3, h / 2 - 10);
        x.fillStyle = '#fff'; x.fillRect(px + 1, py + 2, w / 8 - 5, 3);
      }
    }
  }

  const GOODS = {
    fruit: [['#c8202e', '#e84a2a', '#8ac83a', '#ff9a1a', '#ffd23a'], 'ball'],
    veg: [['#c8a060', '#6aa83a', '#ff7a1a', '#8a3a5a', '#e8e0c0'], 'ball'],
    flowers: [['#e6146e', '#ffc81e', '#f4f4f0', '#c81e2a', '#b040c0', '#ff7a1a'], 'flower'],
    clothes: [['#2a62b8', '#c8202e', '#3a3a3a', '#e8e4d8', '#6a8a3a'], 'cloth'],
    honey: [['#e8a020', '#d08a10', '#f0b830'], 'jar'],
    fish: [['#b88a4a', '#c8a060', '#8a6a3a'], 'fish'],
    amber: [['#e8a020', '#c86a10', '#f0c040', '#a84a10'], 'bead']
  };
  for (const [id, [cols, kind]] of Object.entries(GOODS)) {
    P['g_' + id] = (x, w, h) => {
      const r = F.rng(id.length * 97 + 3);
      x.fillStyle = kind === 'bead' ? '#2a1a3a' : kind === 'cloth' ? 'rgba(0,0,0,0)' : '#9a7a52';
      x.fillRect(0, 0, w, h);
      if (kind === 'ball') {
        for (let c = 0; c < 4; c++) {
          x.fillStyle = '#7a5a3a'; x.fillRect(c * w / 4 + 2, 2, w / 4 - 4, h - 4);
          const col = cols[c % cols.length];
          for (let i = 0; i < 26; i++) { x.fillStyle = i % 5 ? col : shade3(col, 0.75); x.beginPath(); x.arc(c * w / 4 + 6 + r() * (w / 4 - 12), 6 + r() * (h - 12), 4 + r() * 2, 0, Math.PI * 2); x.fill(); }
        }
      } else if (kind === 'flower') {
        for (let i = 0; i < 40; i++) { x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(4 + r() * (w - 8), 4 + r() * (h - 8), 3.5, 0, Math.PI * 2); x.fill(); x.fillStyle = '#3a7a3a'; x.fillRect(4 + r() * (w - 8), 4 + r() * (h - 8), 2, 5); }
      } else if (kind === 'cloth') {
        x.fillStyle = '#6a6a6a'; x.fillRect(0, 2, w, 3);
        for (let i = 0; i < 7; i++) { x.fillStyle = cols[i % cols.length]; x.fillRect(4 + i * (w - 8) / 7, 5, (w - 8) / 7 - 3, h - 8); x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(4 + i * (w - 8) / 7, h * 0.5, (w - 8) / 7 - 3, 2); }
      } else if (kind === 'jar') {
        for (let i = 0; i < 12; i++) { const px = 6 + (i % 6) * (w - 12) / 6, py = i < 6 ? 6 : h / 2 + 2; x.fillStyle = cols[i % cols.length]; x.fillRect(px, py + 5, (w - 12) / 6 - 5, h / 2 - 12); x.fillStyle = '#f4f0e6'; x.fillRect(px, py + 2, (w - 12) / 6 - 5, 4); }
      } else if (kind === 'fish') {
        for (let i = 0; i < 10; i++) { const px = 6 + (i % 5) * (w - 12) / 5, py = i < 5 ? 8 : h / 2 + 4; x.fillStyle = cols[i % cols.length]; x.beginPath(); x.ellipse(px + 9, py + 8, 11, 5, 0.2, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(px - 2, py + 8); x.lineTo(px - 7, py + 3); x.lineTo(px - 7, py + 13); x.fill(); }
      } else {
        for (let k = 0; k < 5; k++) {
          x.strokeStyle = '#d8d0c0'; x.lineWidth = 1; x.beginPath(); x.arc(w / 2, -10 + k * 3, 24 + k * 9, 0.4, Math.PI - 0.4); x.stroke();
          for (let i = 0; i < 14; i++) { const a = 0.45 + i / 13 * (Math.PI - 0.9); x.fillStyle = cols[(i + k) % cols.length]; x.beginPath(); x.arc(w / 2 + Math.cos(a) * (24 + k * 9), -10 + k * 3 + Math.sin(a) * (24 + k * 9), 3, 0, Math.PI * 2); x.fill(); }
        }
      }
      speck(x, w, h, 18, id.length);
    };
  }

  P.garage = (x, w, h) => {
    x.fillStyle = '#d8d8d4'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 4) { x.fillStyle = 'rgba(0,0,0,0.16)'; x.fillRect(i, 0, 1, h); x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(i + 2, 0, 1, h); }
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(w / 2 - 1, 0, 2, h);
    x.fillStyle = '#555'; x.fillRect(w / 2 + 4, h * 0.55, 6, 3);
    x.fillStyle = 'rgba(120,70,30,0.35)'; x.fillRect(0, h - 10, w, 10);
    speck(x, w, h, 26, 5);
  };
  P.chain = (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = '#8e969c';
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j) % 5 === 0 || (i - j + 500) % 5 === 0) x.fillRect(i, j, 1, 1);
  };
  P.phone = (x, w, h) => {
    x.fillStyle = '#1a4a9a'; x.fillRect(0, 0, w, h);
    txt(x, 'TELEFONS', w / 2, h / 2 + 1, 18, '#ffffff', { weight: 900, maxW: w - 8 });
  };
  P.taxi = (x, w, h) => {
    x.fillStyle = '#ffd23a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 8) { x.fillStyle = (i / 8) % 2 ? '#111' : '#ffd23a'; x.fillRect(i, 0, 8, 6); x.fillStyle = (i / 8) % 2 ? '#ffd23a' : '#111'; x.fillRect(i, h - 6, 8, 6); }
    txt(x, 'TAKSOMETRI', w / 2, h / 2, 15, '#111', { weight: 900, maxW: w - 8 });
  };
  P.flag_lv = (x, w, h) => {
    x.fillStyle = '#9e3039'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#ffffff'; x.fillRect(0, h * 0.4, w, h * 0.2);
  };
  P.flag_air = (x, w, h) => {
    x.fillStyle = '#1a4a9a'; x.fillRect(0, 0, w, h);
    planeIcon(x, w * 0.28, h / 2, 0.8, '#ffffff');
    txt(x, 'RIX', w * 0.68, h / 2 + 1, 13, '#ffffff', { weight: 900 });
  };
  P.flag_hz = (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#e6146e'); g.addColorStop(0.55, '#ff7a1a'); g.addColorStop(1, '#ffc81e');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    txt(x, 'HORIZON', w / 2, h / 2 + 1, 12, '#ffffff', { weight: 900, style: 'italic', maxW: w - 6 });
  };
  P.feather = (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffc81e'); g.addColorStop(0.45, '#ff7a1a'); g.addColorStop(1, '#e6146e');
    x.fillStyle = g;
    x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(w * 1.05, 2, w, h * 0.22); x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillRect(0, h - 10, w, 3);
    x.save(); x.translate(w / 2 + 2, h * 0.58); x.rotate(-Math.PI / 2);
    txt(x, 'HORIZON', 0, 0, 22, '#ffffff', { weight: 900, style: 'italic', maxW: h * 0.7 });
    x.restore();
    txt(x, '2001', w / 2, h * 0.14, 11, '#1a0a14', { weight: 900 });
  };
  P.totem = (x, w, h) => {
    x.fillStyle = '#16305e'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#ffffff'; x.fillRect(0, h - 10, w, 4);
    planeIcon(x, 34, 44, 1.7, '#ffffff');
    txt(x, 'LIDOSTA', 150, 34, 34, '#ffffff', { weight: 900, maxW: 180 });
    txt(x, 'RĪGA', 150, 70, 30, '#ffc81e', { weight: 900 });
    txt(x, 'RIGA AIRPORT', 150, 100, 14, '#c8d8f0', { weight: 700 });
  };
  for (const n of [1, 2]) P['hangar' + n] = (x, w, h) => {
    x.fillStyle = '#1a4a9a'; x.fillRect(0, 0, w, h);
    txt(x, 'HANGĀRS ' + n, w / 2, h / 2 + 1, 30, '#ffffff', { weight: 900, maxW: w - 16 });
  };
  const LIV = [
    { name: 'BALTIC WINGS', ink: '#1a4a9a', tail: '#1a4a9a', mark: '#ffc81e' },
    { name: 'RĪGA AVIA', ink: '#1e3a8a', tail: '#f4f4f0', mark: '#c8202e' },
    { name: 'NORDLINE', ink: '#c8202e', tail: '#c8202e', mark: '#ffffff' }
  ];
  LIV.forEach((l, i) => {
    P['liv' + i] = (x, w, h) => { x.clearRect(0, 0, w, h); txt(x, l.name, w / 2, h / 2 + 1, 30, l.ink, { weight: 900, style: i === 1 ? '' : 'italic', maxW: w - 8 }); };
    P['tail' + i] = (x, w, h) => {
      x.fillStyle = l.tail; x.fillRect(0, 0, w, h);
      x.fillStyle = l.mark;
      if (i === 0) { x.beginPath(); x.moveTo(8, 50); x.quadraticCurveTo(30, 10, 58, 8); x.quadraticCurveTo(36, 24, 20, 54); x.fill(); }
      else if (i === 1) txt(x, 'RA', w / 2, h / 2 + 2, 30, l.mark, { weight: 900 });
      else { x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 10 : 24; x.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } x.fill(); }
    };
  });
  P.ltvvan = (x, w, h) => {
    x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1a4a9a'; x.fillRect(0, h - 9, w, 5);
    txt(x, 'LATVIJAS TELEVĪZIJA', w / 2, h / 2 - 3, 20, '#1a4a9a', { weight: 900, maxW: w - 10 });
  };
  P.railing = (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = '#26302c';
    x.fillRect(0, 0, w, 3); x.fillRect(0, h - 4, w, 3); x.fillRect(0, h * 0.62, w, 2);
    for (let i = 2; i < w; i += 6) x.fillRect(i, 0, 2, h);
  };
  P.picket = (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = '#ffffff';
    for (let i = 0; i < w; i += 8) { x.fillRect(i + 1, 5, 5, h - 5); x.beginPath(); x.moveTo(i + 1, 5); x.lineTo(i + 3.5, 0); x.lineTo(i + 6, 5); x.fill(); }
    x.fillStyle = '#d2cec4'; x.fillRect(0, 9, w, 3); x.fillRect(0, h - 9, w, 3);
    x.fillStyle = 'rgba(0,0,0,0.2)';
    for (let i = 0; i < w; i += 8) x.fillRect(i + 5, 5, 1, h - 5);
  };
  P.parkgate = (x, w, h) => {
    x.fillStyle = '#2a5a44'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#e8e0c0'; x.lineWidth = 1.5; x.strokeRect(2.5, 2.5, w - 5, h - 5);
    txt(x, 'LUCAVSALA', w / 2, 18, 25, '#f4ecd0', { weight: 900, maxW: w - 20 });
    txt(x, 'ATPŪTAS PARKS', w / 2, 37, 13, '#f0d890', { weight: 900, maxW: w - 20 });
  };
  P.white = (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); };

  F.Tex.register('street', () => {
    const c = F.Tex.canvas(SZ, SZ), x = c.getContext('2d', { willReadFrequently: true });
    x.clearRect(0, 0, SZ, SZ);
    for (const [id] of REGIONS) {
      const [rx, ry, w, h] = A[id];
      const t = F.Tex.canvas(w, h), tx = t.getContext('2d', { willReadFrequently: true });
      P[id](tx, w, h);
      for (const [dx, dy] of [[-PAD, 0], [PAD, 0], [0, -PAD], [0, PAD]]) x.drawImage(t, rx + dx, ry + dy);
      x.clearRect(rx, ry, w, h);
      x.drawImage(t, rx, ry);
    }
    return c;
  }, { clamp: true });

  F.Tex.register('tiles', () => {
    const c = F.Tex.canvas(256, 256), x = c.getContext('2d', { willReadFrequently: true });
    F.Tex.tileNoise(x, 256, 256, [168, 162, 152], 16, 71, 32);
    const r = F.rng(71);
    for (let row = 0; row < 16; row++) {
      const off = row % 2 ? 16 : 0;
      for (let col = -1; col < 9; col++) {
        const px = col * 32 + off, py = row * 16, v = r();
        x.fillStyle = v < 0.12 ? 'rgba(120,70,60,0.28)' : v < 0.3 ? 'rgba(70,66,62,0.18)' : v > 0.85 ? 'rgba(255,250,240,0.14)' : 'rgba(0,0,0,0)';
        x.fillRect(px + 1, py + 1, 30, 14);
        x.fillStyle = 'rgba(60,56,50,0.55)'; x.fillRect(px, py, 32, 1); x.fillRect(px, py, 1, 16);
      }
    }
    x.fillStyle = 'rgba(90,84,78,0.35)';
    x.fillRect(0, 0, 256, 3); x.fillRect(0, 0, 3, 256); x.fillRect(0, 128, 256, 2); x.fillRect(128, 0, 2, 256);
    return c;
  });
  F.Tex.register('parkpath', () => {
    const c = F.Tex.canvas(128, 128), x = c.getContext('2d', { willReadFrequently: true });
    F.Tex.tileNoise(x, 128, 128, [176, 160, 128], 34, 73, 8);
    const r = F.rng(73);
    for (let i = 0; i < 420; i++) { const v = r(); x.fillStyle = v < 0.5 ? 'rgba(90,76,56,0.45)' : 'rgba(236,226,204,0.5)'; x.fillRect(r() * 128, r() * 128, 1 + r() * 1.6, 1 + r() * 1.6); }
    return c;
  });
  F.Tex.register('apron', () => {
    const c = F.Tex.canvas(256, 256), x = c.getContext('2d', { willReadFrequently: true });
    F.Tex.tileNoise(x, 256, 256, [132, 131, 126], 12, 75, 32);
    const r = F.rng(75);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const v = r() - 0.5;
      x.fillStyle = v > 0 ? `rgba(255,255,250,${(v * 0.12).toFixed(3)})` : `rgba(60,58,52,${(-v * 0.16).toFixed(3)})`;
      x.fillRect(i * 64 + 1, j * 64 + 1, 62, 62);
    }
    x.fillStyle = 'rgba(40,38,34,0.6)';
    for (let i = 0; i <= 256; i += 64) { x.fillRect(i, 0, 1, 256); x.fillRect(0, i, 256, 1); }
    for (let i = 0; i < 9; i++) { x.fillStyle = 'rgba(40,36,30,0.12)'; x.beginPath(); x.ellipse(r() * 256, r() * 256, 6 + r() * 20, 3 + r() * 8, r() * 3, 0, Math.PI * 2); x.fill(); }
    return c;
  });

  const BOARD = { w: 256, h: 128, cols: 8, rows: 16 };
  F.Tex.register('dirboards', () => {
    const c = F.Tex.canvas(BOARD.w * BOARD.cols, BOARD.h * BOARD.rows), x = c.getContext('2d');
    x.fillStyle = '#1a4a9a'; x.fillRect(0, 0, c.width, c.height);
    for (const sp of Street.posts) {
      const ox = (sp.id % BOARD.cols) * BOARD.w, oy = Math.floor(sp.id / BOARD.cols) * BOARD.h;
      x.save(); x.translate(ox, oy);
      x.fillStyle = '#1a4a9a'; x.fillRect(0, 0, BOARD.w, BOARD.h);
      x.strokeStyle = '#ffffff'; x.lineWidth = 4; x.strokeRect(5, 5, BOARD.w - 10, BOARD.h - 10);
      const n = sp.lines.length, lh = (BOARD.h - 20) / n;
      sp.lines.forEach(([dir, name], i) => {
        const cy = 10 + lh * (i + 0.5);
        x.save(); x.translate(26, cy); x.rotate(dir === 'left' ? -Math.PI / 2 : dir === 'right' ? Math.PI / 2 : 0);
        x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(0, -13); x.lineTo(10, -2); x.lineTo(4, -2); x.lineTo(4, 12); x.lineTo(-4, 12); x.lineTo(-4, -2); x.lineTo(-10, -2); x.closePath(); x.fill();
        x.restore();
        txt(x, name, 48, cy + 1, Math.min(26, lh * 0.62), '#ffffff', { weight: 700, align: 'left', maxW: BOARD.w - 64 });
        if (name === 'Lidosta') planeIcon(x, BOARD.w - 24, cy, 0.7, '#ffffff');
      });
      x.restore();
    }
    return c;
  }, { clamp: true });

  function boardUv(id) {
    const W = BOARD.w * BOARD.cols, H = BOARD.h * BOARD.rows, ox = (id % BOARD.cols) * BOARD.w, oy = Math.floor(id / BOARD.cols) * BOARD.h;
    const u0 = (ox + 2) / W, u1 = (ox + BOARD.w - 2) / W, v0 = (oy + 2) / H, v1 = (oy + BOARD.h - 2) / H;
    return [u0, v1, u1, v1, u1, v0, u0, v0];
  }

  function vq(b, L, R, y0, y1, n, col, mat, uvs) {
    const rx = n[2], rz = -n[0];
    if ((R[0] - L[0]) * rx + (R[1] - L[1]) * rz < 0) { const t = L; L = R; R = t; }
    b.quad([L[0], y0, L[1]], [R[0], y0, R[1]], [R[0], y1, R[1]], [L[0], y1, L[1]], col, mat || 0, uvs || null, n);
  }

  function hq(b, q, y, col, mat, uvs) {
    const ux = q[1][0] - q[0][0], uz = q[1][1] - q[0][1], vx = q[3][0] - q[0][0], vz = q[3][1] - q[0][1];
    const r = uz * vx - ux * vz > 0 ? q : [q[0], q[3], q[2], q[1]];
    b.quad([r[0][0], y, r[0][1]], [r[1][0], y, r[1][1]], [r[2][0], y, r[2][1]], [r[3][0], y, r[3][1]], col, mat || 0, uvs || null, [0, 1, 0]);
  }

  function earcut(poly) {
    let pts = poly.map(p => [p[0], p[1]]);
    let area = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) area += (pts[j][0] - pts[i][0]) * (pts[j][1] + pts[i][1]);
    if (area < 0) pts = pts.reverse();
    const idx = pts.map((_, i) => i), tris = [];
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const inside = (p, a, b, c) => cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0;
    let guard = 0;
    while (idx.length > 3 && guard++ < 5000) {
      let cut = false;
      for (let k = 0; k < idx.length; k++) {
        const ia = idx[(k + idx.length - 1) % idx.length], ib = idx[k], ic = idx[(k + 1) % idx.length];
        const a = pts[ia], b = pts[ib], c = pts[ic];
        if (cross(a, b, c) <= 1e-9) continue;
        let ear = true;
        for (const j of idx) if (j !== ia && j !== ib && j !== ic && inside(pts[j], a, b, c)) { ear = false; break; }
        if (!ear) continue;
        tris.push([a, b, c]);
        idx.splice(k, 1);
        cut = true;
        break;
      }
      if (!cut) break;
    }
    if (idx.length === 3) tris.push(idx.map(i => pts[i]));
    else if (idx.length > 3) for (let k = 1; k + 1 < idx.length; k++) tris.push([pts[idx[0]], pts[idx[k]], pts[idx[k + 1]]]);
    return tris;
  }

  function split(tri, max, out) {
    const [a, b, c] = tri;
    const l0 = Math.hypot(b[0] - a[0], b[1] - a[1]), l1 = Math.hypot(c[0] - b[0], c[1] - b[1]), l2 = Math.hypot(a[0] - c[0], a[1] - c[1]);
    const m = Math.max(l0, l1, l2);
    if (m <= max) { out.push(tri); return; }
    if (m === l0) { const p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; split([a, p, c], max, out); split([p, b, c], max, out); }
    else if (m === l1) { const p = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2]; split([a, b, p], max, out); split([a, p, c], max, out); }
    else { const p = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2]; split([a, b, p], max, out); split([p, b, c], max, out); }
  }

  const PATCH = {
    tiles: { key: 'tiles', lift: 0.03, s: 1 / 4, col: '#ffffff' },
    lot: { key: 'asph', lift: 0.035, s: 1 / 8, col: '#ffffff' },
    walk: { key: 'pave', lift: 0.045, s: 1 / 4, col: '#ffffff' },
    path: { key: 'parkpath', lift: 0.03, s: 1 / 4, col: '#ffffff' },
    court: { key: 'parkpath', lift: 0.03, s: 1 / 4, col: '#c8c6c6' },
    sand: { key: 'parkpath', lift: 0.04, s: 1 / 3, col: '#ffe8b0' },
    beach: { key: 'sandtrack', lift: 0.04, s: 1 / 11, col: '#fff8e8' },
    apron: { key: 'apron', lift: 0.03, s: 1 / 24, col: '#ffffff' }
  };

  function polyMesh(scene, pt, def, hgt) {
    const tris = [];
    for (const t of earcut(pt.poly)) split(t, 7, tris);
    const col = C(def.col);
    for (const t of tris) {
      const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cz = (t[0][1] + t[1][1] + t[2][1]) / 3, ch = scene.chunkAt(cx, cz), b = scene.g(ch, def.key);
      b.need(3, 3);
      const ids = t.map(p => { const y = hgt(p[0], p[1]) + def.lift; scene.grow(ch, y - 1, y + 1); return b.v(p[0], y, p[1], p[0] * def.s, p[1] * def.s, 0, 1, 0, col, 0); });
      b.tri(ids[0], ids[2], ids[1]);
    }
  }

  function stripMesh(scene, pt, def, hgt) {
    const pts = [];
    for (let i = 0; i + 1 < pt.pts.length; i++) {
      const a = pt.pts[i], c = pt.pts[i + 1], L = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.max(1, Math.ceil(L / 3));
      for (let k = i ? 1 : 0; k <= n; k++) pts.push([a[0] + (c[0] - a[0]) * k / n, a[1] + (c[1] - a[1]) * k / n]);
    }
    const hw = pt.w / 2, col = C(def.col);
    let s = 0;
    const rows = pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], c = pts[Math.min(pts.length - 1, i + 1)];
      let tx = c[0] - a[0], tz = c[1] - a[1];
      const l = Math.hypot(tx, tz) || 1;
      tx /= l; tz /= l;
      if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      return { x: p[0], z: p[1], rx: -tz, rz: tx, s };
    });
    for (let i = 0; i + 1 < rows.length; i++) {
      const r0 = rows[i], r1 = rows[i + 1], ch = scene.chunkAt((r0.x + r1.x) / 2, (r0.z + r1.z) / 2), b = scene.g(ch, def.key);
      b.need(4, 6);
      const v = (r, k) => { const x = r.x + r.rx * hw * k, z = r.z + r.rz * hw * k, y = hgt(x, z) + def.lift; scene.grow(ch, y - 1, y + 1); return b.v(x, y, z, (k + 1) * hw * def.s, r.s * def.s, 0, 1, 0, col, 0); };
      const a0 = v(r0, -1), a1 = v(r0, 1), b0 = v(r1, -1), b1 = v(r1, 1);
      b.tri(a0, a1, b1); b.tri(a0, b1, b0);
    }
  }

  function patches(scene) {
    const w = scene.w, hgt = (x, z) => w.terrainH(x, z);
    for (const pt of w.patches || []) {
      const def = PATCH[pt.kind];
      if (!def) continue;
      if (pt.poly) polyMesh(scene, pt, def, hgt); else stripMesh(scene, pt, def, hgt);
    }
    const cols = { w: C('#f2f2ec'), y: C('#f0c020') };
    for (const pn of w.paint || []) {
      const dx = pn.b[0] - pn.a[0], dz = pn.b[1] - pn.a[1], L = Math.hypot(dx, dz);
      if (L < 0.05) continue;
      const rx = -dz / L * pn.w / 2, rz = dx / L * pn.w / 2, n = Math.max(1, Math.ceil(L / 6));
      const ch = scene.chunkAt((pn.a[0] + pn.b[0]) / 2, (pn.a[1] + pn.b[1]) / 2), b = scene.g(ch, 'paint');
      for (let k = 0; k < n; k++) {
        const p0 = [pn.a[0] + dx * k / n, pn.a[1] + dz * k / n], p1 = [pn.a[0] + dx * (k + 1) / n, pn.a[1] + dz * (k + 1) / n];
        const y0 = pn.y !== undefined ? pn.y : hgt(p0[0], p0[1]) + 0.05, y1 = pn.y !== undefined ? pn.y : hgt(p1[0], p1[1]) + 0.05;
        b.need(4, 6);
        const q = [[p0[0] - rx, y0, p0[1] - rz], [p0[0] + rx, y0, p0[1] + rz], [p1[0] + rx, y1, p1[1] + rz], [p1[0] - rx, y1, p1[1] - rz]];
        const ids = q.map(v => b.v(v[0], v[1] + 0.012, v[2], WHITE_UV[0], WHITE_UV[1], 0, 1, 0, cols[pn.col] || cols.w, 0));
        if ((q[1][0] - q[0][0]) * (q[3][2] - q[0][2]) - (q[1][2] - q[0][2]) * (q[3][0] - q[0][0]) < 0) { b.tri(ids[0], ids[1], ids[2]); b.tri(ids[0], ids[2], ids[3]); }
        else { b.tri(ids[0], ids[2], ids[1]); b.tri(ids[0], ids[3], ids[2]); }
        scene.grow(ch, Math.min(y0, y1) - 1, Math.max(y0, y1) + 1);
      }
    }
  }

  function garages(scene, g) {
    const ch = scene.chunkAt(g.x, g.z), wb = scene.g(ch, 'white'), sb = scene.g(ch, 'street');
    const tx = g.tx, tz = g.tz, nx = -tz, nz = tx, len = g.n * 3.4, y = g.y, H = 2.6, D = 3.1;
    const P2 = (u, v) => [g.x + tx * u + nx * v, g.z + tz * u + nz * v];
    const wall = C('#bcb4a4'), roof = C('#3a3836'), r = F.rng(g.seed);
    const doors = ['#5a7a5a', '#4a6a8a', '#8a5a3a', '#7a7a7a', '#9a3a2a', '#c8b060', '#3a5a3a'];
    vq(wb, P2(-len / 2, -D), P2(len / 2, -D), y, y + H, [-nx, 0, -nz], shade(wall, 0.8));
    vq(wb, P2(-len / 2, -D), P2(-len / 2, D), y, y + H, [-tx, 0, -tz], wall);
    vq(wb, P2(len / 2, -D), P2(len / 2, D), y, y + H, [tx, 0, tz], wall);
    hq(wb, [P2(-len / 2 - 0.2, -D - 0.2), P2(len / 2 + 0.2, -D - 0.2), P2(len / 2 + 0.2, D + 0.3), P2(-len / 2 - 0.2, D + 0.3)], y + H + 0.05, roof);
    vq(wb, P2(-len / 2 - 0.2, D + 0.3), P2(len / 2 + 0.2, D + 0.3), y + H - 0.25, y + H + 0.05, [nx, 0, nz], shade(roof, 1.3));
    for (let i = 0; i < g.n; i++) {
      const u0 = -len / 2 + i * 3.4;
      vq(wb, P2(u0, D), P2(u0 + 0.3, D), y, y + H, [nx, 0, nz], wall);
      vq(wb, P2(u0 + 3.1, D), P2(u0 + 3.4, D), y, y + H, [nx, 0, nz], wall);
      vq(wb, P2(u0 + 0.3, D), P2(u0 + 3.1, D), y + 2.25, y + H, [nx, 0, nz], wall);
      vq(sb, P2(u0 + 0.3, D - 0.05), P2(u0 + 3.1, D - 0.05), y, y + 2.25, [nx, 0, nz], C(doors[Math.floor(r() * doors.length)]), 0, uv('garage'));
    }
    scene.grow(ch, y - 1, y + H + 1);
  }

  function fountain(scene, f) {
    const ch = scene.chunkAt(f.x, f.z), wb = scene.g(ch, 'white'), wt = scene.g(ch, 'water'), y = f.y + 0.03;
    const stone = C('#c8c0b0'), seg = 20;
    wb.cyl(f.x, y, f.z, f.r, 0.55, seg, stone, 0, { top: false });
    wb.cyl(f.x, y, f.z, f.r * 0.25, 1.4, 8, shade(stone, 0.9));
    wb.cyl(f.x, y + 1.4, f.z, f.r * 0.55, 0.15, 12, stone);
    wb.cyl(f.x, y + 1.55, f.z, f.r * 0.1, 0.8, 6, shade(stone, 0.9));
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, ri = f.r - 0.3;
      hq(wb, [[f.x + Math.cos(a0) * ri, f.z + Math.sin(a0) * ri], [f.x + Math.cos(a1) * ri, f.z + Math.sin(a1) * ri], [f.x + Math.cos(a1) * f.r, f.z + Math.sin(a1) * f.r], [f.x + Math.cos(a0) * f.r, f.z + Math.sin(a0) * f.r]], y + 0.56, shade(stone, 1.08));
    }
    wt.disc(f.x, y + 0.42, f.z, f.r - 0.3, seg, C('#ffffff'), MAT.WATER, (x, z) => [x / 6, z / 6]);
    const jet = C('#e8f2f8', 0.9);
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2;
      wb.beam([f.x, y + 2.3, f.z], [f.x + Math.cos(a) * f.r * 0.5, y + 1.6, f.z + Math.sin(a) * f.r * 0.5], 0.05, jet);
    }
    scene.grow(ch, y - 1, y + 3);
  }

  function signpost(scene, sp) {
    const ch = scene.chunkAt(sp.x, sp.z), wb = scene.g(ch, 'white'), db = scene.g(ch, 'dirboards'), y = sp.y;
    const c = Math.cos(sp.yaw), s = Math.sin(sp.yaw), bx = -Math.sin(sp.yaw), bz = Math.cos(sp.yaw);
    const W2 = 2.3, y0 = y + 2.6, y1 = y + 4.9, pole = C('#8a9094');
    for (const k of [-1.7, 1.7]) wb.cyl(sp.x + c * k, y, sp.z + s * k, 0.08, 5, 6, pole);
    const L = [sp.x - c * W2 + bx * 0.1, sp.z - s * W2 + bz * 0.1], R = [sp.x + c * W2 + bx * 0.1, sp.z + s * W2 + bz * 0.1];
    vq(db, L, R, y0, y1, [bx, 0, bz], C('#ffffff'), 0, boardUv(sp.id));
    vq(wb, [L[0] - bx * 0.06, L[1] - bz * 0.06], [R[0] - bx * 0.06, R[1] - bz * 0.06], y0, y1, [-bx, 0, -bz], C('#9aa0a4'));
    scene.grow(ch, y - 1, y + 6);
  }

  function decorate(scene) {
    const w = scene.w;
    Street.posts = (w.signposts || []).filter(sp => sp.id < BOARD.cols * BOARD.rows);
    patches(scene);
    for (const g of w.structs || []) if (g.type === 'garages') garages(scene, g);
    for (const f of w.fountains || []) fountain(scene, f);
    for (const sp of Street.posts) signpost(scene, sp);
    const grid = new Map();
    for (const p of w.parked || []) {
      const ch = scene.chunkAt(p.x, p.z);
      if (!grid.has(ch)) grid.set(ch, []);
      grid.get(ch).push(p);
      p.rgb = F.hexRgb(p.col);
    }
    scene.parkedBy = grid;
  }

  const PROPS = F.Models.PROPS;
  const SIGN_ID = { main: 'sign_main', yield: 'sign_yield', stop: 'sign_stop', crossing: 'sign_crossing', v50: 'sign_v50', v70: 'sign_v70', p: 'sign_p', air: 'sign_air' };
  const pole = C('#8a9094'), WHITE = C('#ffffff');

  function oq(b, q0, q1, q2, q3, col, mat, uvs, n) {
    const ax = q2[0] - q0[0], ay = q2[1] - q0[1], az = q2[2] - q0[2], bx = q3[0] - q1[0], by = q3[1] - q1[1], bz = q3[2] - q1[2];
    const d = (ay * bz - az * by) * n[0] + (az * bx - ax * bz) * n[1] + (ax * by - ay * bx) * n[2];
    if (d >= 0) b.quad(q0, q1, q2, q3, col, mat || 0, uvs || null, n);
    else b.quad(q0, q3, q2, q1, col, mat || 0, uvs ? [uvs[0], uvs[1], uvs[6], uvs[7], uvs[4], uvs[5], uvs[2], uvs[3]] : null, n);
  }

  PROPS.sign = (b, p, rng, t) => {
    if (p.sign === 'bus' || p.sign === 'tram') {
      b.cyl(0, 0, 0, 0.05, 2.9, 5, pole);
      b.box(0, 2.5, -0.02, 0.24, 0.36, 0.015, C('#9a9ea2'));
      vq(t, [-0.22, 0.001], [0.22, 0.001], 2.16, 2.84, [0, 0, 1], WHITE, 0, uv('sign_' + p.sign));
      vq(t, [-0.22, -0.041], [0.22, -0.041], 2.16, 2.84, [0, 0, -1], WHITE, 0, uv('sign_' + p.sign));
      return;
    }
    const id = SIGN_ID[p.sign] || 'sign_v50', s = p.sign === 'main' ? 0.42 : 0.36, cy = 2.45;
    b.cyl(0, 0, 0, 0.045, cy + s * 0.2, 5, pole);
    vq(b, [-s * 0.9, 0.005], [s * 0.9, 0.005], cy - s, cy + s, [0, 0, -1], C('#8c9094'));
    vq(t, [-s, 0.02], [s, 0.02], cy - s, cy + s, [0, 0, 1], WHITE, 0, uv(id));
  };

  PROPS.tlight = (b, p) => {
    const dark = C('#2a2c2e'), go = p.go === 'g';
    b.cyl(0, 0, 0, 0.07, 3.1, 6, C('#5a5e62'));
    b.box(0, 3.55, -0.02, 0.17, 0.52, 0.13, dark);
    b.box(0, 3.55, -0.17, 0.24, 0.58, 0.02, C('#1a1a1a'));
    const lens = (y, col, on) => {
      b.box(0, y, 0.12, 0.1, 0.1, 0.02, on ? C(col) : shade(C(col), 0.25), on ? MAT.LAMP : 0);
      b.box(0, y + 0.12, 0.16, 0.12, 0.015, 0.06, dark);
    };
    lens(3.88, '#ff2a1a', !go);
    lens(3.55, '#ffb020', false);
    lens(3.22, '#30e070', go);
  };

  PROPS.kiosk = (b, p, rng, t) => {
    const kind = KIOSK[p.kind] ? p.kind : Object.keys(KIOSK)[Math.floor(F.hash2(p.x | 0, p.z | 0, 7) * 8)], k = KIOSK[kind], body = C(k.body);
    b.box(0, 1.3, 0.05, 1.3, 1.3, 1.05, body);
    b.box(0, 2.66, 0, 1.5, 0.08, 1.25, C('#e8e8e4'));
    b.box(0, 2.52, -1.24, 1.5, 0.06, 0.02, shade(body, 0.8));
    vq(t, [-1.3, -1.02], [1.3, -1.02], 0.05, 2.6, [0, 0, -1], WHITE, 0, uv('k_' + kind));
    b.box(0, 1.08, -1.2, 1.2, 0.03, 0.18, C('#d8d4c8'));
  };

  PROPS.stall = (b, p, rng, t) => {
    const goods = GOODS[p.goods] ? p.goods : 'fruit', stripe = ['#c8202e', '#2a62b8', '#3a8a4a', '#e8a020', '#8a3ab0'][Math.floor(F.hash2(p.x | 0, p.z | 0, 11) * 5)];
    const pc = C('#d8d8d4'), sc = C(stripe), wc = C('#f4f4f0');
    for (const [x, z] of [[-1.4, -1.1], [1.4, -1.1], [-1.4, 1.1], [1.4, 1.1]]) b.cyl(x, 0, z, 0.035, z < 0 ? 2.2 : 2.5, 4, pc);
    for (let i = 0; i < 6; i++) {
      const x0 = -1.5 + i * 0.5, col = i % 2 ? wc : sc;
      const q = [[x0, 2.2, -1.3], [x0 + 0.5, 2.2, -1.3], [x0 + 0.5, 2.62, 1.25], [x0, 2.62, 1.25]];
      oq(b, q[0], q[1], q[2], q[3], col, 0, null, [0, 0.99, -0.16]);
      oq(b, q[0], q[1], q[2], q[3], shade(col, 0.75), 0, null, [0, -0.99, 0.16]);
      oq(b, [x0, 2.2, -1.3], [x0 + 0.5, 2.2, -1.3], [x0 + 0.5, 1.95, -1.36], [x0, 1.95, -1.36], col, 0, null, [0, 0, -1]);
    }
    b.box(0, 0.45, -0.5, 1.35, 0.45, 0.55, C('#8a6a44'));
    t.quad([-1.32, 0.905, 0.02], [1.32, 0.905, 0.02], [1.32, 0.905, -1.02], [-1.32, 0.905, -1.02], WHITE, 0, uv('g_' + goods), [0, 1, 0]);
    b.box(0, 0.35, 0.8, 0.45, 0.35, 0.3, C('#7a5a3a'));
  };

  PROPS.table = (b, p, rng) => {
    const cols = ['#e6146e', '#ffc81e', '#30b4ff', '#f4f4f0', '#3aa84a', '#c8202e'], col = C(cols[Math.floor(rng() * cols.length)]);
    b.cyl(0, 0, 0, 0.05, 0.74, 5, C('#2a2a2a'));
    b.cyl(0, 0.74, 0, 0.4, 0.03, 10, C('#f0ece4'));
    for (const a of [0, Math.PI]) {
      const x = Math.cos(a) * 0.7, z = Math.sin(a) * 0.7;
      b.box(x, 0.45, z, 0.2, 0.03, 0.2, C('#3a3a3a'));
      b.box(x + Math.cos(a) * 0.18, 0.7, z, 0.02, 0.25, 0.2, C('#3a3a3a'));
      for (const [dx, dz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) b.box(x + dx, 0.22, z + dz, 0.015, 0.22, 0.015, C('#2a2a2a'));
    }
    b.cyl(0, 0.77, 0, 0.025, 1.6, 4, C('#e8e8e8'));
    b.cone(0, 2.05, 0, 1.3, 0.45, 8, col);
    b.cone(0, 2.05, 0, 1.3, -0.1, 8, shade(col, 0.7));
  };

  PROPS.phone = (b, p, rng, t) => {
    const frame = C('#3a4a5a'), glass = C('#8ab0c8', 0.5);
    b.box(0, 0.05, 0, 0.55, 0.05, 0.55, C('#8a8a8a'));
    for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) b.box(x, 1.2, z, 0.04, 1.15, 0.04, frame);
    b.box(0, 2.38, 0, 0.58, 0.08, 0.58, frame);
    b.box(0, 1.25, 0.49, 0.46, 1.1, 0.01, glass, MAT.WINDOWS);
    b.box(-0.49, 1.25, 0, 0.01, 1.1, 0.46, glass, MAT.WINDOWS);
    b.box(0.49, 1.25, 0, 0.01, 1.1, 0.46, glass, MAT.WINDOWS);
    b.box(0, 1.35, 0.4, 0.14, 0.2, 0.06, C('#c8c8c0'));
    vq(t, [-0.5, -0.525], [0.5, -0.525], 2.18, 2.36, [0, 0, -1], WHITE, 0, uv('phone'));
    vq(t, [-0.5, 0.525], [0.5, 0.525], 2.18, 2.36, [0, 0, 1], WHITE, 0, uv('phone'));
  };

  PROPS.fflag = (b, p, rng, t) => {
    b.cyl(0, 0, 0, 0.035, 4.4, 5, C('#d8d8d8'));
    b.box(0, 0.05, 0, 0.28, 0.05, 0.28, C('#3a3a3a'));
    for (const s of [-1, 1]) vq(t, [0.04, s * 0.008], [0.92, s * 0.008], 1.0, 4.35, [0, 0, s], WHITE, 0, uv('feather'));
  };

  PROPS.qrail = (b, p, rng, t) => {
    const l = (p.len || 2.6) / 2, iron = C('#26302c');
    b.box(0, 0.55, -l, 0.05, 0.55, 0.05, iron);
    b.box(0, 1.08, 0, 0.045, 0.03, l, iron);
    for (const s of [-1, 1]) vq(t, [s * 0.012, -l], [s * 0.012, l], 0.06, 1.05, [s, 0, 0], WHITE, 0, uv('railing'));
  };

  PROPS.obvan = (b, p, rng, t) => {
    const white = C('#f0f0ea'), dark = C('#23303a'), grey = C('#8a8e92'), blue = C('#1a4a9a');
    b.box(0, 1.55, 0.7, 1.1, 1.05, 2.5, white);
    b.box(0, 1.15, -2.3, 1.05, 0.65, 0.55, white);
    b.box(0, 1.6, -2.28, 1.0, 0.36, 0.5, dark, MAT.GLASS);
    b.box(0, 0.62, 0, 1.1, 0.12, 3.05, blue);
    for (const s of [-1, 1]) vq(t, [s * 1.105, 2.9], [s * 1.105, -1.1], 1.3, 2.18, [s, 0, 0], WHITE, 0, uv('ltvvan'));
    for (const [x, z] of [[-0.95, -2.2], [0.95, -2.2], [-0.95, 2.1], [0.95, 2.1]]) b.box(x, 0.36, z, 0.14, 0.36, 0.36, C('#1a1a1a'));
    b.cyl(0.3, 2.6, 1.6, 0.06, 1.1, 4, grey);
    b.box(0.3, 3.7, 1.6, 0.06, 0.06, 0.06, grey);
    const dx = 0.3, dy = 3.6, dz = 1.6;
    for (let i = 0; i < 10; i++) {
      const a0 = i / 10 * Math.PI * 2, a1 = (i + 1) / 10 * Math.PI * 2, r = 0.85;
      const P0 = [dx + Math.cos(a0) * r, dy + Math.sin(a0) * r * 0.7, dz - Math.sin(a0) * r * 0.5], P1 = [dx + Math.cos(a1) * r, dy + Math.sin(a1) * r * 0.7, dz - Math.sin(a1) * r * 0.5];
      b.triangle([dx, dy, dz - 0.25], P1, P0, C('#e8e8e2'));
      b.triangle([dx, dy, dz + 0.1], P0, P1, grey);
    }
    b.box(-0.5, 3.15, -0.2, 0.12, 0.1, 0.12, C('#ffb020'), MAT.LAMP);
  };

  PROPS.plamp = b => {
    const iron = C('#2a3230');
    b.cyl(0, 0, 0, 0.12, 0.5, 6, iron);
    b.cyl(0, 0.5, 0, 0.055, 3.2, 5, iron);
    b.cyl(0, 3.7, 0, 0.1, 0.1, 6, iron);
    b.box(0, 4.0, 0, 0.2, 0.22, 0.2, C('#fff4d8'), MAT.LAMP);
    b.cone(0, 4.22, 0, 0.24, 0.22, 6, iron);
  };

  PROPS.swing = b => {
    const steel = C('#3a6ab8'), seat = C('#e8a020');
    for (const s of [-1, 1]) { b.beam([s * 1.6, 0, -0.7], [s * 1.6, 2.3, 0], 0.05, steel); b.beam([s * 1.6, 0, 0.7], [s * 1.6, 2.3, 0], 0.05, steel); }
    b.beam([-1.65, 2.3, 0], [1.65, 2.3, 0], 0.06, steel);
    for (const x of [-0.7, 0.7]) {
      for (const d of [-0.2, 0.2]) b.beam([x + d, 2.28, 0], [x + d, 0.5, 0], 0.012, C('#8a8a8a'));
      b.box(x, 0.48, 0, 0.24, 0.03, 0.14, seat);
    }
  };

  PROPS.slide = b => {
    const red = C('#c8302a'), steel = C('#9aa0a4');
    for (const [x, z] of [[-0.35, 0.6], [0.35, 0.6], [-0.35, 1.3], [0.35, 1.3]]) b.box(x, 0.8, z, 0.04, 0.8, 0.04, steel);
    b.box(0, 1.6, 0.95, 0.4, 0.04, 0.4, C('#e8a020'));
    oq(b, [-0.3, 1.6, 0.55], [0.3, 1.6, 0.55], [0.3, 0.25, -1.4], [-0.3, 0.25, -1.4], red, 0, null, [0, 0.83, -0.56]);
    oq(b, [-0.3, 1.6, 0.55], [0.3, 1.6, 0.55], [0.3, 0.25, -1.4], [-0.3, 0.25, -1.4], shade(red, 0.6), 0, null, [0, -0.83, 0.56]);
    for (const x of [-0.32, 0.32]) {
      oq(b, [x, 1.78, 0.55], [x, 1.6, 0.55], [x, 0.25, -1.4], [x, 0.43, -1.4], red, 0, null, [x > 0 ? 1 : -1, 0, 0]);
      oq(b, [x, 1.78, 0.55], [x, 1.6, 0.55], [x, 0.25, -1.4], [x, 0.43, -1.4], red, 0, null, [x > 0 ? -1 : 1, 0, 0]);
    }
    for (let k = 0; k < 5; k++) b.box(0, 0.3 + k * 0.3, 1.62, 0.34, 0.02, 0.05, steel);
    for (const x of [-0.35, 0.35]) b.beam([x, 0, 1.7], [x, 1.6, 1.35], 0.03, steel);
  };

  PROPS.sandbox = b => {
    const wood = C('#b88a58');
    b.box(0, 0.15, -1.2, 1.25, 0.15, 0.06, wood); b.box(0, 0.15, 1.2, 1.25, 0.15, 0.06, wood);
    b.box(-1.2, 0.15, 0, 0.06, 0.15, 1.2, wood); b.box(1.2, 0.15, 0, 0.06, 0.15, 1.2, wood);
    b.box(0, 0.08, 0, 1.15, 0.05, 1.15, C('#e0c890'));
    b.cyl(0, 0.1, 0, 0.05, 1.7, 4, C('#3a6ab8'));
    b.cone(0, 1.8, 0, 1.05, 0.45, 6, C('#3aa84a'));
  };

  const near = p => [Math.round(p.x), Math.round(p.z)];

  PROPS.picket = (b, p, rng, t) => {
    const l = (p.len || 3.2) / 2, col = C(p.col || '#e8e4d8');
    b.box(0, 0.55, -l, 0.05, 0.55, 0.05, shade(col, 0.7));
    for (const s of [-1, 1]) vq(t, [s * 0.015, -l], [s * 0.015, l], 0.06, 1.0, [s, 0, 0], col, 0, uv('picket'));
  };

  PROPS.beds = (b, p) => {
    const soil = C('#4a3828'), greens = ['#4a8a3a', '#6aa84a', '#3a7a4a', '#8ab04a', '#5a9a5a'], [hx, hz] = near(p);
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 1.45, g = C(greens[Math.floor(F.hash2(hx, hz + i, 33) * greens.length)]);
      b.box(x, 0.08, 0, 0.55, 0.08, 2.5, soil);
      for (const d of [-0.24, 0.24]) b.box(x + d, 0.25, 0, 0.11, 0.1, 2.3, g);
    }
  };

  PROPS.ghouse = b => {
    const film = C('#dfe9e6'), rib = C('#8a8e86'), prof = [[-1.3, 0], [-1.22, 1], [-0.75, 1.75], [0, 2], [0.75, 1.75], [1.22, 1], [1.3, 0]], L = 2.5;
    for (let i = 0; i + 1 < prof.length; i++) {
      const [x0, y0] = prof[i], [x1, y1] = prof[i + 1], d = Math.hypot(x1 - x0, y1 - y0);
      oq(b, [x0, y0, -L], [x1, y1, -L], [x1, y1, L], [x0, y0, L], film, 0, null, [-(y1 - y0) / d, (x1 - x0) / d, 0]);
    }
    for (const s of [-1, 1]) {
      for (const [a, c] of [[0, 1], [1, 2], [2, 3]]) oq(b, [prof[a][0], prof[a][1], s * L], [prof[6 - a][0], prof[6 - a][1], s * L], [prof[6 - c][0], prof[6 - c][1], s * L], [prof[c][0], prof[c][1], s * L], shade(film, 0.92), 0, null, [0, 0, s]);
      b.box(s * 1.24, 1, 0, 0.03, 0.03, L, rib);
    }
    b.box(0, 2.02, 0, 0.04, 0.03, L, rib);
    b.box(0, 0.85, -L - 0.02, 0.4, 0.85, 0.02, rib);
  };

  PROPS.shed = (b, p) => {
    const cols = ['#8a6a48', '#6a7a5a', '#9a8a6a', '#5a6a7a'], [hx, hz] = near(p), col = C(cols[Math.floor(F.hash2(hx, hz, 35) * cols.length)]);
    b.box(0, 1.05, 0, 0.7, 1.05, 0.7, col);
    b.box(0, 2.16, 0, 0.84, 0.06, 0.84, C('#4a4642'));
    b.box(0, 0.95, -0.71, 0.32, 0.9, 0.015, shade(col, 0.62));
    b.box(0.2, 1, -0.735, 0.03, 0.03, 0.01, C('#c8c8c0'));
  };

  PROPS.barrel = (b, p) => {
    const [hx, hz] = near(p);
    b.cyl(0, 0, 0, 0.3, 0.88, 8, C(F.hash2(hx, hz, 37) < 0.6 ? '#2a5a8a' : '#7a4a32'));
  };

  PROPS.pump = b => {
    const iron = C('#2a5a7a');
    b.box(0, 0.06, 0, 0.45, 0.06, 0.45, C('#9a9890'));
    b.cyl(0, 0.12, 0, 0.09, 1, 6, iron);
    b.cyl(0, 1.12, 0, 0.12, 0.12, 6, iron);
    b.beam([0, 0.95, 0], [0, 0.85, -0.38], 0.05, iron);
    b.beam([0, 1.2, 0], [0, 1.45, 0.5], 0.035, C('#3a3a3a'));
  };

  PROPS.picnic = b => {
    const wood = C('#a87a4a'), dark = shade(wood, 0.75);
    b.box(0, 0.75, 0, 0.95, 0.03, 0.4, wood);
    for (const s of [-1, 1]) {
      b.box(0, 0.45, s * 0.72, 0.95, 0.025, 0.14, wood);
      for (const x of [-0.7, 0.7]) b.beam([x, 0, s * 0.85], [x, 0.74, s * 0.18], 0.05, dark);
    }
    for (const x of [-0.7, 0.7]) b.box(x, 0.43, 0, 0.04, 0.025, 0.8, dark);
  };

  PROPS.goal = (b, p, rng, t) => {
    const w = 2.5, h = 2, d = 1.1;
    for (const s of [-1, 1]) { b.cyl(s * w, 0, 0, 0.06, h, 6, WHITE); b.beam([s * w, h, 0], [s * w, 0, d], 0.03, WHITE); }
    b.beam([-w, h, 0], [w, h, 0], 0.06, WHITE);
    for (const n of [-1, 1]) {
      oq(t, [-w, 0, d], [w, 0, d], [w, h, 0], [-w, h, 0], WHITE, 0, uv('chain'), [0, 0.48 * n, 0.88 * n]);
      for (const s of [-1, 1]) oq(t, [s * w, 0, 0], [s * w, 0, d], [s * w, h, 0], [s * w, h, 0], WHITE, 0, uv('chain'), [s * n, 0, 0]);
    }
  };

  PROPS.hoop = b => {
    const steel = C('#5a5e62'), rim = C('#e85a1a');
    b.cyl(0, 0, 0.75, 0.07, 3.1, 6, steel);
    b.beam([0, 3.05, 0.75], [0, 3.05, 0.05], 0.05, steel);
    b.box(0, 3.1, 0, 0.9, 0.55, 0.025, C('#f0f0ea'));
    b.box(0, 2.95, -0.03, 0.3, 0.22, 0.006, C('#c8202e'));
    b.box(0, 2.95, -0.034, 0.25, 0.17, 0.006, C('#f0f0ea'));
    for (let k = 0; k < 8; k++) {
      const a0 = k / 8 * Math.PI * 2, a1 = (k + 1) / 8 * Math.PI * 2;
      b.beam([Math.cos(a0) * 0.23, 2.75, -0.28 + Math.sin(a0) * 0.23], [Math.cos(a1) * 0.23, 2.75, -0.28 + Math.sin(a1) * 0.23], 0.02, rim);
    }
  };

  PROPS.vnet = (b, p, rng, t) => {
    const l = (p.len || 9.5) / 2;
    for (const s of [-1, 1]) b.cyl(0, 0, s * l, 0.05, 2.55, 6, C('#d8d8d4'));
    b.box(0, 2.43, 0, 0.012, 0.03, l, WHITE);
    for (const s of [-1, 1]) vq(t, [s * 0.01, -l], [s * 0.01, l], 1.45, 2.4, [s, 0, 0], WHITE, 0, uv('chain'));
  };

  PROPS.boat = (b, p) => {
    const cols = ['#2a62a8', '#3a8a4a', '#c8302a', '#e8e4d8'], [hx, hz] = near(p), hull = C(cols[Math.floor(F.hash2(hx, hz, 39) * cols.length)]), wood = C('#b08a5a');
    const prof = [[0.66, 1.9], [0.72, 0.4], [0.6, -1], [0.02, -2.2]];
    for (let i = 0; i + 1 < prof.length; i++) {
      const [w0, z0] = prof[i], [w1, z1] = prof[i + 1];
      for (const s of [-1, 1]) {
        const q = [[s * w0 * 0.6, 0.05, z0], [s * w1 * 0.6, 0.05, z1], [s * w1, 0.55, z1], [s * w0, 0.55, z0]];
        oq(b, q[0], q[1], q[2], q[3], hull, 0, null, [s, 0, 0]);
        oq(b, q[0], q[1], q[2], q[3], shade(wood, 0.8), 0, null, [-s, 0, 0]);
      }
      hq(b, [[-w0 * 0.6, z0], [w0 * 0.6, z0], [w1 * 0.6, z1], [-w1 * 0.6, z1]], 0.06, shade(wood, 0.7));
    }
    for (const n of [-1, 1]) oq(b, [-0.4, 0.05, 1.9], [0.4, 0.05, 1.9], [0.66, 0.55, 1.9], [-0.66, 0.55, 1.9], n > 0 ? hull : shade(wood, 0.8), 0, null, [0, 0, n]);
    b.box(0, 0.4, 0.9, 0.64, 0.02, 0.13, wood);
    b.box(0, 0.4, -0.4, 0.62, 0.02, 0.13, wood);
  };

  PROPS.rotunda = b => {
    const white = C('#ecebe4'), roof = C('#3a6a5c'), R = 3.2, T2 = Math.PI * 2;
    b.cyl(0, 0, 0, R + 0.3, 0.3, 12, C('#c8c4ba'));
    for (let k = 0; k < 8; k++) {
      const a = (k + 0.5) / 8 * T2, a1 = (k + 1.5) / 8 * T2, x = Math.cos(a) * R, z = Math.sin(a) * R, x1 = Math.cos(a1) * R, z1 = Math.sin(a1) * R;
      b.cyl(x, 0.3, z, 0.13, 2.9, 6, white);
      if (k === 5) continue;
      b.beam([x, 1.15, z], [x1, 1.15, z1], 0.05, white);
      b.beam([x, 0.72, z], [x1, 0.72, z1], 0.035, white);
    }
    b.cyl(0, 3.2, 0, R + 0.35, 0.25, 12, white);
    b.cone(0, 3.45, 0, R + 0.7, 1.6, 12, roof);
    b.cone(0, 3.45, 0, R + 0.7, -0.12, 12, shade(roof, 0.6));
    b.cyl(0, 5, 0, 0.06, 0.7, 5, white);
  };

  PROPS.pgate = (b, p, rng, t) => {
    const green = C('#2a5a44'), dark = shade(green, 0.7);
    for (const s of [-1, 1]) {
      b.box(s * 3.4, 2.8, 0, 0.18, 2.8, 0.18, green);
      b.box(s * 3.4, 5.67, 0, 0.25, 0.07, 0.25, dark);
      b.box(s * 3.4, 0.2, 0, 0.24, 0.2, 0.24, dark);
      vq(t, [-3.3, s * 0.07], [3.3, s * 0.07], 4.23, 5.47, [0, 0, s], WHITE, 0, uv('parkgate'));
    }
    b.box(0, 4.85, 0, 3.4, 0.68, 0.06, green);
  };

  F.Street = { A, REGIONS, uv, boardUv, decorate, patches, earcut, split, PATCH, KIOSK, GOODS, LIV, posts: [], vq, hq, oq, WHITE_UV };
  const Street = F.Street;
})(globalThis.Forza = globalThis.Forza || {});
