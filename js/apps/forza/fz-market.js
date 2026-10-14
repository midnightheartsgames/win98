(function (F) {
  'use strict';

  const C = F.col;
  const MAT = F.MAT;
  const shade = F.Models.shade;
  const Street = F.Street;
  const { vq, hq, oq } = Street;
  const TAU = Math.PI * 2;
  const AW = 1024, AH = 512, PAD = 2;
  const WHITE = C('#ffffff');
  const SIGNS = { fish: 'ZIVIS', veg: 'DĀRZEŅI', fruit: 'AUGĻI', clothes: 'APĢĒRBI', honey: 'MEDUS', bread: 'MAIZE', flowers: 'ZIEDI', meat: 'GAĻA', dairy: 'PIENS' };
  const SIGN_COL = { fish: '#1f5a8a', veg: '#3a7a3a', fruit: '#c86a1a', clothes: '#6a3a8a', honey: '#b8860b', bread: '#8a5a2a', flowers: '#b8286a', meat: '#a8242a', dairy: '#2a6aa8' };
  const LINES = [
    { name: 'BALTIC LINES', body: '#f2f0e8', band: '#1a4a9a', ink: '#1a4a9a' },
    { name: 'DAUGAVA TŪRE', body: '#e8e2d0', band: '#c8202e', ink: '#c8202e' },
    { name: 'JŪRMALAS EKSPRESIS', body: '#f4f4f0', band: '#3a8a4a', ink: '#2a6a3a' }
  ];
  const REGIONS = [
    ['arch', 512, 64], ['autoosta', 256, 48], ['bus0', 256, 64], ['bus1', 256, 64], ['bus2', 256, 64], ['bus0r', 256, 64], ['bus1r', 256, 64], ['bus2r', 256, 64], ['busf', 64, 64],
    ['zil', 128, 64], ['van', 128, 48], ['vanr', 128, 48], ['kvass', 128, 48], ['g_meat', 128, 64], ['g_dairy', 128, 64], ['g_bread', 128, 64],
    ['counter', 64, 32], ['panel', 64, 64], ['times', 64, 64], ['nums', 192, 32], ['white', 8, 8]
  ].concat(Object.keys(SIGNS).map(k => ['sg_' + k, 128, 24]));

  const A = (() => {
    const out = {}, list = REGIONS.slice().sort((a, b) => b[2] - a[2] || b[1] - a[1]);
    let x = 0, y = 0, row = 0;
    for (const [id, w, h] of list) {
      if (x + w + PAD * 2 > AW) { x = 0; y += row + PAD * 2; row = 0; }
      out[id] = [x + PAD, y + PAD, w, h];
      x += w + PAD * 2;
      row = Math.max(row, h);
    }
    if (y + row + PAD * 2 > AH) throw new Error('market atlas overflow');
    return out;
  })();

  function uv(id, u0 = 0, v0 = 0, u1 = 1, v1 = 1) {
    const r = A[id];
    const U = u => (r[0] + 0.5 + (r[2] - 1) * u) / AW, V = v => (r[1] + 0.5 + (r[3] - 1) * v) / AH;
    return [U(u0), V(v1), U(u1), V(v1), U(u1), V(v0), U(u0), V(v0)];
  }
  const WHITE_UV = [(A.white[0] + 4) / AW, (A.white[1] + 4) / AH];

  function label(x, s, cx, cy, size, col, maxW, style = '') {
    x.save();
    x.font = `${style} 900 ${size}px Arial`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const w = x.measureText(s).width;
    if (maxW && w > maxW) { x.translate(cx, cy); x.scale(maxW / w, 1); x.translate(-cx, -cy); }
    x.fillStyle = col;
    x.fillText(s, cx, cy);
    x.restore();
  }

  function grain(x, w, h, amt, seed) {
    const img = x.getImageData(0, 0, w, h), d = img.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = (j * w + i) * 4, n = (F.hash2(i, j, seed) - 0.5) * amt;
      d[k] = F.clamp(d[k] + n, 0, 255); d[k + 1] = F.clamp(d[k + 1] + n, 0, 255); d[k + 2] = F.clamp(d[k + 2] + n, 0, 255);
    }
    x.putImageData(img, 0, 0);
  }

  const PAINT = {
    white(x, w, h) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); },
    arch(x, w, h) {
      x.fillStyle = '#1d4a33'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#e8dcb8'; x.lineWidth = 3; x.strokeRect(5, 5, w - 10, h - 10);
      label(x, 'RĪGAS CENTRĀLTIRGUS', w / 2, h / 2 + 2, 40, '#f2e8c8', w - 96);
      for (const cx of [30, w - 30]) {
        x.fillStyle = '#e8dcb8'; x.beginPath(); x.arc(cx, h / 2, 15, 0, TAU); x.fill();
        label(x, '1930', cx, h / 2 + 1, 11, '#1d4a33');
      }
    },
    autoosta(x, w, h) {
      x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#1a4a9a'; x.fillRect(0, h - 8, w, 4);
      label(x, 'AUTOOSTA', w / 2, h / 2 - 2, 40, '#1a4a9a', w - 16);
    },
    busf(x, w, h) {
      x.fillStyle = '#f0eee6'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#16202a'; x.fillRect(4, 12, w - 8, 26);
      x.fillStyle = 'rgba(170,200,225,0.25)'; x.fillRect(4, 12, (w - 8) * 0.45, 26);
      x.fillStyle = '#f0eee6'; x.fillRect(w / 2 - 1, 12, 2, 26);
      x.fillStyle = '#101418'; x.fillRect(14, 2, w - 28, 9);
      label(x, 'RĪGA', w / 2, 7, 8, '#ffd23a');
      x.fillStyle = '#2a2e32'; x.fillRect(0, h - 10, w, 10);
      x.fillStyle = '#fff4d0'; x.fillRect(6, h - 22, 10, 7); x.fillRect(w - 16, h - 22, 10, 7);
      x.fillStyle = '#8a8e92'; x.fillRect(20, h - 21, w - 40, 5);
    },
    zil(x, w, h) {
      x.fillStyle = '#5a7088'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < w; i += 16) { x.fillStyle = 'rgba(0,0,0,0.14)'; x.fillRect(i, 0, 2, h); x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(i + 3, 0, 2, h); }
      x.fillStyle = 'rgba(30,40,50,0.35)'; x.fillRect(0, h - 8, w, 8);
      label(x, 'PĀRTIKA', w / 2, h / 2 - 2, 22, '#f0f0e8', w - 20);
      grain(x, w, h, 14, 21);
    },
    van(x, w, h, rear) {
      const X = px => (rear ? w - px : px);
      x.fillStyle = '#eeeee6'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#3a8a4a'; x.fillRect(0, h - 16, w, 5);
      x.fillStyle = '#1a232c'; x.fillRect(Math.min(X(6), X(34)), 6, 28, 16);
      label(x, 'MAIZE', X(w * 0.6), h * 0.42, 18, '#3a8a4a', w * 0.6);
      x.fillStyle = '#1e1e1e';
      for (const cx of [26, w - 24]) { x.beginPath(); x.arc(X(cx), h, 11, Math.PI, 0); x.fill(); }
    },
    vanr(x, w, h) { PAINT.van(x, w, h, true); },
    kvass(x, w, h) {
      x.fillStyle = '#e8b81e'; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(0, 4, w, 6);
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, h - 10, w, 10);
      label(x, 'KVASS', w / 2, h / 2 + 1, 30, '#b01e1e', w - 16);
    },
    g_meat(x, w, h) {
      const r = F.rng(31);
      x.fillStyle = '#d8d8d2'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 12; i++) {
        const px = 6 + (i % 6) * (w - 12) / 6, py = i < 6 ? 5 : h / 2 + 3;
        x.fillStyle = ['#a8302c', '#c0443a', '#8e2a2a', '#d0766a'][i % 4]; x.beginPath(); x.ellipse(px + 8, py + 11, 9, 8 + r() * 3, r(), 0, TAU); x.fill();
        x.fillStyle = 'rgba(255,232,220,0.75)'; x.fillRect(px + 3, py + 8 + r() * 5, 11, 2);
      }
      grain(x, w, h, 12, 33);
    },
    g_dairy(x, w, h) {
      x.fillStyle = '#cfd6da'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) { x.fillStyle = i % 2 ? '#f2d270' : '#e8c050'; x.beginPath(); x.arc(14 + i * 25, 18, 10, 0, TAU); x.fill(); x.fillStyle = 'rgba(120,80,10,0.35)'; x.beginPath(); x.arc(14 + i * 25, 18, 3, 0, TAU); x.fill(); }
      for (let i = 0; i < 9; i++) { x.fillStyle = '#f6f6f2'; x.fillRect(6 + i * 13.5, 38, 9, 20); x.fillStyle = i % 3 ? '#2a6aa8' : '#c8202e'; x.fillRect(6 + i * 13.5, 38, 9, 5); }
      grain(x, w, h, 10, 35);
    },
    g_bread(x, w, h) {
      const r = F.rng(37);
      x.fillStyle = '#8a6a44'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) {
        const px = 4 + (i % 7) * (w - 8) / 7, py = i < 7 ? 6 : h / 2 + 4;
        x.fillStyle = ['#c88a3a', '#a86a2a', '#d8a860', '#70482a'][i % 4]; x.beginPath(); x.ellipse(px + 8, py + 10, 8, 10, r() * 0.4, 0, TAU); x.fill();
        x.strokeStyle = 'rgba(60,30,10,0.45)'; x.lineWidth = 1; x.beginPath(); x.moveTo(px + 4, py + 6); x.lineTo(px + 12, py + 14); x.stroke();
      }
      grain(x, w, h, 14, 39);
    },
    counter(x, w, h) {
      x.fillStyle = '#eef0ee'; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(90,110,120,0.35)';
      for (let i = 0; i <= w; i += 8) x.fillRect(i, 0, 1, h);
      for (let j = 0; j <= h; j += 8) x.fillRect(0, j, w, 1);
      x.fillStyle = '#2a62a8'; x.fillRect(0, 8, w, 5);
    },
    panel(x, w, h) {
      x.fillStyle = '#b8b4aa'; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(0, 0, 3, h); x.fillRect(w - 3, 0, 3, h); x.fillRect(0, h - 8, w, 8);
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        const cx = 12 + i * 20, cy = 10 + j * 17;
        x.fillStyle = 'rgba(255,255,255,0.2)'; x.beginPath(); x.moveTo(cx, cy - 7); x.lineTo(cx + 8, cy); x.lineTo(cx, cy + 7); x.lineTo(cx - 8, cy); x.fill();
        x.fillStyle = 'rgba(0,0,0,0.18)'; x.beginPath(); x.moveTo(cx, cy + 7); x.lineTo(cx + 8, cy); x.lineTo(cx + 8, cy + 2); x.lineTo(cx, cy + 9); x.fill();
      }
      grain(x, w, h, 22, 41);
    },
    times(x, w, h) {
      x.fillStyle = '#f2f0e6'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#1a4a9a'; x.fillRect(0, 0, w, 13);
      label(x, 'ATIEŠANA', w / 2, 7, 9, '#ffffff', w - 6);
      const rows = [['JŪRMALA', '07:10'], ['JELGAVA', '07:40'], ['SIGULDA', '08:05'], ['LIEPĀJA', '08:30'], ['TALLINA', '09:00'], ['VIĻŅA', '09:45']];
      rows.forEach(([to, t], i) => {
        x.fillStyle = i % 2 ? '#e4e2d8' : '#f2f0e6'; x.fillRect(0, 14 + i * 8.2, w, 8.2);
        x.font = '700 7px Arial'; x.textBaseline = 'middle'; x.fillStyle = '#1a1a1a';
        x.textAlign = 'left'; x.fillText(to, 3, 18.5 + i * 8.2);
        x.textAlign = 'right'; x.fillText(t, w - 3, 18.5 + i * 8.2);
      });
    },
    nums(x, w, h) {
      for (let i = 0; i < 6; i++) {
        x.fillStyle = '#1a4a9a'; x.fillRect(i * 32, 0, 32, h);
        x.fillStyle = '#f4f4f0'; x.fillRect(i * 32 + 3, 3, 26, h - 6);
        label(x, String(i + 1), i * 32 + 16, h / 2 + 1, 24, '#1a4a9a');
      }
    }
  };
  LINES.forEach((ln, i) => {
    const side = rear => (x, w, h) => {
      x.fillStyle = ln.body; x.fillRect(0, 0, w, h);
      x.fillStyle = '#18222c'; x.fillRect(6, 8, w - 12, 20);
      x.fillStyle = 'rgba(170,200,225,0.22)'; x.fillRect(6, 8, w - 12, 8);
      x.fillStyle = ln.body; for (let k = 1; k < 9; k++) x.fillRect(6 + k * (w - 12) / 9 - 1.5, 8, 3, 20);
      x.fillStyle = ln.band; x.fillRect(0, 31, w, 7);
      label(x, ln.name, w / 2, 47, 12, ln.ink, w - 90, 'italic');
      x.fillStyle = '#2a2e32'; x.fillRect(0, h - 5, w, 5);
      x.fillStyle = '#1a1a1a';
      for (const cx of [48, w - 58, w - 36]) { x.beginPath(); x.arc(rear ? w - cx : cx, h - 1, 11, Math.PI, 0); x.fill(); }
    };
    PAINT['bus' + i] = side(false);
    PAINT['bus' + i + 'r'] = side(true);
  });
  for (const [k, word] of Object.entries(SIGNS)) {
    PAINT['sg_' + k] = (x, w, h) => {
      x.fillStyle = SIGN_COL[k]; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 1.5; x.strokeRect(2, 2, w - 4, h - 4);
      label(x, word, w / 2, h / 2 + 1, 17, '#ffffff', w - 12);
    };
  }

  F.Tex.register('mkt', () => {
    const cv = F.Tex.canvas(AW, AH), x = cv.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#8a8478'; x.fillRect(0, 0, AW, AH);
    for (const [id] of REGIONS) {
      const [rx, ry, w, h] = A[id];
      const t = F.Tex.canvas(w, h), tx = t.getContext('2d', { willReadFrequently: true });
      PAINT[id](tx, w, h);
      for (const [dx, dy] of [[-PAD, 0], [PAD, 0], [0, -PAD], [0, PAD]]) x.drawImage(t, rx + dx, ry + dy);
      x.drawImage(t, rx, ry);
    }
    return cv;
  }, { clamp: true });

  function goodsQuad(mb, sb, kind, q, y) {
    if (A['g_' + kind]) hq(mb, q, y, WHITE, 0, uv('g_' + kind));
    else hq(sb, q, y, WHITE, 0, Street.uv('g_' + (Street.GOODS[kind] ? kind : 'fruit')));
  }

  function counterRun(wb, mb, sb, x0, x1, z, face, kinds, y0) {
    const tile = C('#e6e8e4'), steel = C('#b4babe');
    let k = 0;
    for (let a = x0; a + 2 <= x1 + 0.01; a += 6.6, k++) {
      const b = Math.min(x1, a + 5.8), cx = (a + b) / 2, hl = (b - a) / 2;
      wb.box(cx, y0 + 0.47, z, hl, 0.47, 0.45, tile, 0, { top: steel });
      vq(mb, [a, z + face * 0.455], [b, z + face * 0.455], y0 + 0.02, y0 + 0.92, [0, 0, face], WHITE, 0, uv('counter', 0, 0, Math.min(1, hl / 1.5), 1));
      goodsQuad(mb, sb, kinds[k % kinds.length], [[a + 0.1, z - 0.38], [b - 0.1, z - 0.38], [b - 0.1, z + 0.38], [a + 0.1, z + 0.38]], y0 + 0.955);
    }
  }

  function signBoard(wb, mb, kind, x0, x1, z, y0, y1) {
    for (const s of [-1, 1]) vq(mb, [x0, z + s * 0.03], [x1, z + s * 0.03], y0, y1, [0, 0, s], WHITE, 0, uv('sg_' + kind));
    wb.box((x0 + x1) / 2, y1 + 0.03, z, (x1 - x0) / 2, 0.03, 0.05, C('#3a3e42'));
  }

  function shed(wb, mb, sb, sh) {
    const hl = sh.len / 2, conc = C('#b4afa2'), post = C('#4e5a54'), roofA = C('#5a8a6a'), roofB = C('#d8dccc'), under = C('#aeb6aa');
    wb.box(0, 0.11, 0, hl, 0.11, 4.2, conc, 0, { top: C('#c4bfb2') });
    for (const x of [-hl + 0.5, -hl / 3, hl / 3, hl - 0.5]) for (const z of [-2.85, 2.85]) wb.box(x, 1.78, z, 0.07, 1.56, 0.07, post);
    const n = 7, x0 = -hl - 0.7, step = (sh.len + 1.4) / n;
    for (let i = 0; i < n; i++) {
      const a = x0 + i * step, b = a + step, col = i % 2 ? roofB : roofA;
      for (const s of [-1, 1]) {
        oq(wb, [a, 3.3, s * 4.75], [b, 3.3, s * 4.75], [b, 4.05, 0], [a, 4.05, 0], col, 0, null, [0, 0.988, s * 0.156]);
        oq(wb, [a, 3.26, s * 4.75], [b, 3.26, s * 4.75], [b, 4.01, 0], [a, 4.01, 0], under, 0, null, [0, -0.988, -s * 0.156]);
      }
    }
    for (const s of [-1, 1]) {
      wb.triangle([s * (hl + 0.7), 3.3, -s * 4.75], [s * (hl + 0.7), 3.3, s * 4.75], [s * (hl + 0.7), 4.05, 0], shade(roofA, 0.8));
      wb.box(0, 3.4, s * 2.85, hl + 0.2, 0.06, 0.06, post);
      counterRun(wb, mb, sb, -hl + 0.6, hl - 0.6, s * 1.9, s, [sh.goods], 0.22);
      signBoard(wb, mb, SIGNS[sh.goods] ? sh.goods : 'fruit', -1.6, 1.6, s * 4.4, 2.62, 3.22);
    }
    return 4.2;
  }

  function coach(wb, mb, livery) {
    const ln = LINES[livery % LINES.length], body = C(ln.body), dark = C('#1c2228'), tyre = C('#16181a'), hw = 1.27, z0 = -5.75, z1 = 5.75, y0 = 0.5, y1 = 3.15;
    for (const s of [-1, 1]) vq(mb, [s * hw, z0], [s * hw, z1], y0, y1, [s, 0, 0], WHITE, 0, uv('bus' + livery % LINES.length + (s > 0 ? 'r' : '')));
    vq(mb, [-hw, z0], [hw, z0], y0, y1, [0, 0, -1], WHITE, 0, uv('busf'));
    vq(wb, [-hw, z1], [hw, z1], y0, y1, [0, 0, 1], shade(body, 0.86));
    vq(wb, [-hw + 0.18, z1 + 0.012], [hw - 0.18, z1 + 0.012], 1.75, 2.85, [0, 0, 1], dark);
    for (const s of [-1, 1]) wb.box(s * (hw - 0.35), 1.12, z1 + 0.02, 0.2, 0.1, 0.02, C('#d02a20'));
    hq(wb, [[-hw, z0], [hw, z0], [hw, z1], [-hw, z1]], y1, shade(body, 1.04));
    wb.box(0, 3.27, 1.5, 0.7, 0.12, 1.4, shade(body, 0.9));
    wb.box(0, 0.42, 0, hw - 0.06, 0.1, 5.6, dark);
    for (const z of [z0 + 2.15, z1 - 2.6, z1 - 1.55]) for (const s of [-1, 1]) wb.box(s * (hw - 0.13), 0.5, z, 0.14, 0.5, 0.5, tyre);
    return 3.5;
  }

  function lorry(wb, mb, kind, seed) {
    const dark = C('#22262a'), tyre = C('#16181a'), glass = C('#1a2630');
    if (kind === 'kvass') {
      const tank = C('#e8b81e');
      wb.box(0, 1.12, 0.1, 0.62, 0.52, 1.15, tank, 0, { top: shade(tank, 1.08) });
      for (const s of [-1, 1]) vq(mb, [s * 0.625, -1.0], [s * 0.625, 1.2], 0.66, 1.58, [s, 0, 0], WHITE, 0, uv('kvass'));
      wb.box(0, 0.52, 0.1, 0.5, 0.08, 1.2, dark);
      for (const s of [-1, 1]) wb.box(s * 0.62, 0.34, 0.3, 0.1, 0.34, 0.34, tyre);
      wb.beam([0, 0.5, -1.1], [0, 0.35, -2.0], 0.04, dark);
      wb.box(0.15, 1.72, 1.1, 0.2, 0.08, 0.16, C('#c8c8c0'));
      return 1.9;
    }
    if (kind === 'van') {
      const body = C('#eeeee6');
      for (const s of [-1, 1]) vq(mb, [s * 1.0, -2.7], [s * 1.0, 2.7], 0.45, 2.35, [s, 0, 0], WHITE, 0, uv(s > 0 ? 'vanr' : 'van'));
      vq(wb, [-1, -2.7], [1, -2.7], 0.45, 2.35, [0, 0, -1], body);
      vq(wb, [-0.86, -2.712], [0.86, -2.712], 1.35, 2.15, [0, 0, -1], glass, MAT.GLASS);
      vq(wb, [-1, 2.7], [1, 2.7], 0.45, 2.35, [0, 0, 1], shade(body, 0.86));
      hq(wb, [[-1, -2.7], [1, -2.7], [1, 2.7], [-1, 2.7]], 2.35, shade(body, 1.04));
      wb.box(0, 0.4, 0, 0.94, 0.1, 2.6, dark);
      for (const z of [-1.75, 1.8]) for (const s of [-1, 1]) wb.box(s * 0.88, 0.36, z, 0.13, 0.36, 0.36, tyre);
      return 2.6;
    }
    const cab = C(['#3f6f9f', '#4f7f5f', '#9a6a3a'][seed % 3]), tarp = C('#5a7088');
    wb.box(0, 1.2, -2.95, 1.0, 0.42, 0.65, cab);
    wb.box(0, 1.72, -1.78, 1.15, 0.94, 0.55, cab, 0, { top: shade(cab, 1.1) });
    vq(wb, [-0.95, -2.34], [0.95, -2.34], 1.78, 2.5, [0, 0, -1], glass, MAT.GLASS);
    for (const s of [-1, 1]) {
      vq(wb, [s * 1.156, -2.1], [s * 1.156, -1.5], 1.8, 2.45, [s, 0, 0], glass, MAT.GLASS);
      vq(mb, [s * 1.25, -1.1], [s * 1.25, 3.6], 1.08, 3.28, [s, 0, 0], WHITE, 0, uv('zil'));
      wb.box(s * 0.5, 1.12, -3.62, 0.16, 0.12, 0.02, C('#f4f0d8'));
    }
    vq(wb, [-1.25, -1.1], [1.25, -1.1], 1.08, 3.28, [0, 0, -1], shade(tarp, 0.9));
    vq(wb, [-1.25, 3.6], [1.25, 3.6], 1.08, 3.28, [0, 0, 1], shade(tarp, 0.82));
    hq(wb, [[-1.25, -1.1], [1.25, -1.1], [1.25, 3.6], [-1.25, 3.6]], 3.28, shade(tarp, 1.12));
    wb.box(0, 0.92, 1.25, 1.22, 0.16, 2.4, C('#5a4a36'));
    wb.box(0, 0.7, 0.2, 0.45, 0.14, 3.3, dark);
    for (const z of [-2.85, 1.7, 2.75]) for (const s of [-1, 1]) wb.box(s * 1.05, 0.48, z, 0.16, 0.48, 0.48, tyre);
    return 3.4;
  }

  function arch(wb, mb, span) {
    const iron = C('#2a4838'), stone = C('#8e887a'), cream = C('#e8dcb8');
    for (const s of [-1, 1]) {
      wb.box(s * span, 0.55, 0, 0.6, 0.55, 0.6, stone);
      wb.box(s * span, 3.95, 0, 0.3, 2.85, 0.3, iron);
      wb.box(s * span, 6.95, 0, 0.42, 0.18, 0.42, cream);
      wb.box(s * span, 7.38, 0, 0.2, 0.25, 0.2, C('#fff4d8'), MAT.LAMP);
      wb.cone(s * span, 7.63, 0, 0.3, 0.3, 6, iron);
    }
    wb.box(0, 6.45, 0, span - 0.3, 0.74, 0.1, iron);
    for (const s of [-1, 1]) vq(mb, [-span + 0.5, s * 0.105], [span - 0.5, s * 0.105], 5.8, 7.1, [0, 0, s], WHITE, 0, uv('arch'));
    wb.box(0, 7.28, 0, span - 0.2, 0.09, 0.16, cream);
    return 8;
  }

  function fence(scene, pts, y) {
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], c = pts[i + 1], len = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.max(1, Math.round(len / 2.5));
      const nx = -(c[1] - a[1]) / len, nz = (c[0] - a[0]) / len;
      for (let k = 0; k < n; k++) {
        const p = [F.lerp(a[0], c[0], k / n), F.lerp(a[1], c[1], k / n)], q = [F.lerp(a[0], c[0], (k + 1) / n), F.lerp(a[1], c[1], (k + 1) / n)];
        const ch = scene.chunkAt((p[0] + q[0]) / 2, (p[1] + q[1]) / 2), mb = scene.g(ch, 'mkt');
        for (const s of [-1, 1]) vq(mb, [p[0] + nx * s * 0.08, p[1] + nz * s * 0.08], [q[0] + nx * s * 0.08, q[1] + nz * s * 0.08], y, y + 2, [nx * s, 0, nz * s], WHITE, 0, uv('panel'));
        scene.grow(ch, y - 1, y + 3);
      }
    }
  }

  function busDeck(wb, mb, B) {
    const hl = (B.deck[1] - B.deck[0]) / 2, hd = (B.deck[3] - B.deck[2]) / 2, conc = C('#b8b4a8'), steel = C('#7a8288'), blue = C('#1a4a9a'), roof = C('#dcdcd4');
    wb.box(0, 0.15, 0, hl, 0.15, hd, conc, 0, { top: C('#cac6ba') });
    for (let x = -hl + 4; x <= hl - 4 + 0.01; x += 8) wb.box(x, 2.25, -1.6, 0.16, 1.95, 0.16, steel);
    wb.box(0, 4.32, -1.9, hl + 0.8, 0.12, 4.8, roof, 0, { bottom: true });
    wb.box(0, 4.32, -6.72, hl + 0.8, 0.2, 0.04, blue);
    const mid = (B.deck[0] + B.deck[1]) / 2;
    B.bays.forEach((u, i) => {
      const x = u - mid;
      wb.box(x, 3.98, -6.4, 0.02, 0.22, 0.02, steel);
      for (const s of [-1, 1]) vq(mb, [x - 0.4, -6.4 + s * 0.03], [x + 0.4, -6.4 + s * 0.03], 3.0, 3.8, [0, 0, s], WHITE, 0, uv('nums', i / 6, 0, (i + 1) / 6, 1));
    });
    for (let x = -hl + 8; x <= hl - 8 + 0.01; x += 16) {
      wb.box(x, 0.75, 0.6, 1.3, 0.04, 0.22, C('#8a5a30'));
      wb.box(x, 0.52, 0.6, 1.2, 0.2, 0.16, C('#3a3a3a'));
    }
    for (const x of [-hl + 3, hl - 3]) {
      wb.box(x, 1.2, -4.6, 0.05, 0.9, 0.05, steel);
      for (const s of [-1, 1]) vq(mb, [x - 0.7, -4.6 + s * 0.06], [x + 0.7, -4.6 + s * 0.06], 1.3, 2.7, [0, 0, s], WHITE, 0, uv('times'));
    }
    return 4.6;
  }

  function roofSign(wb, mb, w) {
    const steel = C('#6a7278');
    for (const x of [-w / 2 + 0.6, 0, w / 2 - 0.6]) wb.box(x, 0.45, 0.25, 0.06, 0.45, 0.06, steel);
    for (const s of [-1, 1]) vq(mb, [-w / 2, s * 0.06], [w / 2, s * 0.06], 0.5, 0.5 + w * 48 / 256, [0, 0, s], WHITE, 0, uv('autoosta'));
    return 0.5 + w * 48 / 256;
  }

  function deck(wb, mb, sb, x0, x1, z0, z1, face, kinds, h) {
    const tile = C('#d6d4c8'), front = C('#eceee8'), blue = C('#2a62a8'), wood = C('#7a6248');
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, edge = face > 0 ? x0 : x1, back = face > 0 ? x1 : x0;
    wb.box(cx, h / 2, cz, (x1 - x0) / 2, h / 2, (z1 - z0) / 2, front, 0, { top: tile });
    vq(wb, [edge - face * 0.012, z0], [edge - face * 0.012, z1], h * 0.55, h * 0.8, [-face, 0, 0], blue);
    const cxr = edge + face * 3.1, tileC = C('#e6e8e4'), steel = C('#b4babe');
    let k = 0;
    for (let a = z0 + 1.2; a + 2 <= z1 - 1.2 + 0.01; a += 6.6, k++) {
      const b = Math.min(z1 - 1.2, a + 5.8), hl = (b - a) / 2;
      wb.box(cxr, h + 0.47, (a + b) / 2, 0.45, 0.47, hl, tileC, 0, { top: steel });
      vq(mb, [cxr - face * 0.455, a], [cxr - face * 0.455, b], h + 0.02, h + 0.92, [-face, 0, 0], WHITE, 0, uv('counter', 0, 0, Math.min(1, hl / 1.5), 1));
      goodsQuad(mb, sb, kinds[k % kinds.length], [[cxr - 0.38, a + 0.1], [cxr + 0.38, a + 0.1], [cxr + 0.38, b - 0.1], [cxr - 0.38, b - 0.1]], h + 0.955);
    }
    wb.box(back - face * 0.55, h + 1.05, cz, 0.45, 1.05, (z1 - z0) / 2 - 0.6, wood, 0, { top: shade(wood, 1.2) });
    const sz = cz, a = edge + face * 1.4, b = edge + face * 4.6;
    signBoard(wb, mb, kinds[0], Math.min(a, b), Math.max(a, b), sz, h + 3.0, h + 3.62);
    for (const x of [a, b]) wb.box(x, h + 5.2, sz, 0.015, 1.55, 0.015, C('#3a3e42'));
  }

  const SHIRTS = ['#c8302a', '#2a62b8', '#e8e4d8', '#3a8a4a', '#1a1a1e', '#e8a020', '#8a3ab0', '#6a8a9a', '#d8a8b8', '#5a4a3a'].map(h => C(h));
  const SKINS = ['#e8c0a0', '#d8a882', '#f0d0b8', '#c89a78'].map(h => C(h));
  const PANTS = ['#2a3a5a', '#1e1e22', '#5a4a3a', '#3a4a5a', '#6a6a6a'].map(h => C(h));
  const HAIR = ['#2a1a10', '#c8a060', '#6a3a1a', '#1a1a1a', '#b8b8b8', '#c8302a'].map(h => C(h));

  function figure(b, rng, vendor) {
    const sh = vendor ? C('#f0f0ea') : SHIRTS[Math.floor(rng() * SHIRTS.length)], sk = SKINS[Math.floor(rng() * SKINS.length)];
    b.box(0, 0.42, 0, 0.15, 0.42, 0.1, PANTS[Math.floor(rng() * PANTS.length)]);
    b.box(0, 1.14, 0, 0.23, 0.3, 0.13, sh);
    b.box(0, 1.58, 0, 0.1, 0.12, 0.1, sk);
    b.box(0, 1.72, 0.02, 0.11, 0.04, 0.11, HAIR[Math.floor(rng() * HAIR.length)]);
    if (vendor) b.box(0, 0.95, -0.135, 0.17, 0.3, 0.01, C('#d8dce0'));
    else if (rng() < 0.6) b.box(rng() < 0.5 ? 0.3 : -0.3, 0.62, 0, 0.05, 0.16, 0.13, SHIRTS[Math.floor(rng() * SHIRTS.length)]);
  }

  function people(world) {
    const t = world.trg, groups = [];
    if (!t) return groups;
    let seed = 0;
    for (const z of t.crowds) {
      const [u0, v0, u1, v1] = z.box, [cx, cz] = t.L((u0 + u1) / 2, (v0 + v1) / 2);
      let g = groups.find(q => Math.hypot(q.x - cx, q.z - cz) < 45);
      if (!g) { g = { x: cx, z: cz, y: t.y, batch: new F.Batch(2048), phase: groups.length * 1.7, n: 0 }; groups.push(g); }
      const rng = F.rng(900 + seed++), long = u1 - u0 > v1 - v0;
      for (let i = 0; i < z.n; i++) {
        const k = (i + 0.15 + rng() * 0.7) / z.n, u = long ? F.lerp(u0, u1, k) : F.lerp(u0, u1, rng()), v = long ? F.lerp(v0, v1, rng()) : F.lerp(v0, v1, k);
        const [x, zz] = t.L(u, v), face = z.face ? t.D(z.face[0], z.face[1]) : t.D(Math.cos(rng() * TAU), Math.sin(rng() * TAU));
        g.batch.setM(x, t.y + z.y, zz, F.yawOf(face[0], face[1]) + (rng() - 0.5) * 0.7, 0.93 + rng() * 0.14);
        figure(g.batch, rng, !!z.vendor);
        g.batch.clearM();
        g.n++;
      }
    }
    return groups;
  }

  function decorate(scene) {
    const w = scene.w, t = w.trg, T = w.map.TIRGUS;
    if (!t) return;
    const place = (x, z, yaw, fn) => {
      const ch = scene.chunkAt(x, z), wb = scene.g(ch, 'white'), mb = scene.g(ch, 'mkt'), sb = scene.g(ch, 'street');
      mb.uvw = WHITE_UV;
      for (const b of [wb, mb, sb]) b.setM(x, t.y, z, yaw);
      const h = fn(wb, mb, sb);
      for (const b of [wb, mb, sb]) b.clearM();
      scene.grow(ch, t.y - 1, t.y + (h || 5));
    };
    for (const sh of t.sheds) place(sh.x, sh.z, sh.yaw, (wb, mb, sb) => shed(wb, mb, sb, sh));
    for (const v of t.trucks) place(v.x, v.z, v.yaw, (wb, mb) => lorry(wb, mb, v.kind, v.seed));
    for (const b of t.buses) place(b.x, b.z, b.yaw, (wb, mb) => coach(wb, mb, b.livery));
    place(t.arch.x, t.arch.z, t.arch.yaw, (wb, mb) => arch(wb, mb, t.arch.span));
    fence(scene, t.fence, t.y);
    const B = T.bus, [dx, dz] = t.L((B.deck[0] + B.deck[1]) / 2, (B.deck[2] + B.deck[3]) / 2);
    place(dx, dz, t.yaw, (wb, mb) => busDeck(wb, mb, B));
    const [hx, hz] = t.L((B.hall[0] + B.hall[1]) / 2, B.hall[2] + 0.6), hall = w.buildings[t.terminal];
    place(hx, hz, t.yaw, (wb, mb) => { for (const b of [wb, mb]) b.setM(hx, hall.y + hall.h, hz, t.yaw); return hall.h + roofSign(wb, mb, 15); });
    const M = T.meat, mid = (M.u[0] + M.u[1]) / 2, [mx, mz] = t.L(mid, 0);
    place(mx, mz, t.yaw, (wb, mb, sb) => {
      M.decks.forEach(([z0, z1], i) => {
        deck(wb, mb, sb, M.u[0] - mid + 1, -M.aisle, z0, z1, -1, i ? ['meat', 'dairy', 'bread'] : ['fish', 'meat', 'dairy'], M.deck);
        deck(wb, mb, sb, M.aisle, M.u[1] - mid - 1, z0, z1, 1, i ? ['dairy', 'meat', 'honey'] : ['meat', 'bread', 'veg'], M.deck);
      });
      return 6;
    });
  }

  const PROPS = F.Models.PROPS;

  PROPS.hlamp = b => {
    const dark = C('#2e3632');
    b.box(0, 9.6, 0, 0.015, 2.05, 0.015, dark);
    b.cone(0, 7.32, 0, 0.5, 0.3, 8, dark);
    b.box(0, 7.27, 0, 0.13, 0.07, 0.13, C('#fff4d8'), MAT.LAMP);
  };

  PROPS.slamp = b => {
    const dark = C('#2e3632');
    b.box(0, 3.5, 0, 0.012, 0.38, 0.012, dark);
    b.cone(0, 2.98, 0, 0.3, 0.18, 6, dark);
    b.box(0, 2.94, 0, 0.09, 0.05, 0.09, C('#fff4d8'), MAT.LAMP);
  };

  PROPS.crates = (b, p, rng, t) => {
    const wood = C(p.box ? '#c8a878' : '#a07c4c'), k = F.hash2(p.x | 0, p.z | 0, 3), goods = Street.GOODS[p.goods] ? p.goods : 'fruit';
    b.box(-0.42, 0.2, 0, 0.4, 0.2, 0.3, wood);
    b.box(0.42, 0.2, 0.04, 0.4, 0.2, 0.3, shade(wood, 0.9));
    if (k > 0.3) b.box(0.05, 0.6, 0, 0.4, 0.2, 0.3, shade(wood, 1.08));
    if (k > 0.7) b.box(-0.1, 1.0, 0.02, 0.4, 0.2, 0.3, wood);
    const top = k > 0.7 ? 1.205 : k > 0.3 ? 0.805 : 0.405, cx = k > 0.7 ? -0.1 : k > 0.3 ? 0.05 : -0.42;
    t.quad([cx - 0.36, top, 0.27], [cx + 0.36, top, 0.27], [cx + 0.36, top, -0.27], [cx - 0.36, top, -0.27], WHITE, 0, Street.uv('g_' + goods, 0, 0, 0.5, 1), [0, 1, 0]);
  };

  PROPS.cart = b => {
    const steel = C('#6a7278'), sack = C('#c8b890');
    b.box(0, 0.32, 0, 0.45, 0.03, 0.7, C('#7a5a3a'));
    for (const s of [-1, 1]) b.box(s * 0.5, 0.2, 0.35, 0.04, 0.2, 0.2, C('#1a1a1a'));
    b.beam([-0.4, 0.34, -0.7], [-0.4, 1.05, -0.95], 0.025, steel);
    b.beam([0.4, 0.34, -0.7], [0.4, 1.05, -0.95], 0.025, steel);
    b.beam([-0.4, 1.05, -0.95], [0.4, 1.05, -0.95], 0.025, steel);
    b.box(0, 0.5, 0.1, 0.36, 0.15, 0.5, sack);
    b.box(0.04, 0.78, 0.15, 0.3, 0.13, 0.42, shade(sack, 0.9));
  };

  F.Market = { A, REGIONS, SIGNS, LINES, uv, WHITE_UV, shed, coach, lorry, arch, busDeck, roofSign, deck, figure, people, decorate };
})(globalThis.Forza = globalThis.Forza || {});
