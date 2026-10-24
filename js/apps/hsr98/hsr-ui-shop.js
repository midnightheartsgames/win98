(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C, GLOW_NAME } = H.UI_CONST;

  const SECTIONS = [
    { id: 'pass', label: 'Снабжение экспресса', icon: 'pass' }, { id: 'shop', label: 'Магазин', icon: 'shop' }, { id: 'fashion', label: 'Магазин обликов', icon: 'outfit' },
    { id: 'contracts', label: 'Контракты', icon: 'contract' }, { id: 'pets', label: 'Питомцы', icon: 'pet' }
  ];
  const TABS = [['starlight', 'Неугасаемый звёздный свет'], ['embers', 'Неугасаемый пепел']];
  const GRID = { x: 170, y: 70, cols: 5, w: 86, h: 134, gap: 5, row: 6 };
  const CUR_NAME = { starlight: 'неугасаемого звёздного света', embers: 'неугасаемого пепла', jade: 'звёздного нефрита' };
  const TAG = { ok: '#e8a030', none: '#c83434', dark: 'rgba(10,12,30,0.78)' };
  const SHOW = { x: 166, y: 40, w: 304, h: 412 };
  const WARDROBE = { x: 40, y: 42, w: 560, h: 414, cols: 4, rows: 2, cw: 120, ch: 162, gap: 10 };
  const fmt = H.fmt;
  const CUT_FOES = ['reaver', 'eliminator', 'flamespawn'];
  const cl = v => Math.max(0, Math.min(1, v));
  const leftText = ms => { const m = Math.ceil(ms / 60000); return m >= 60 ? '1 ч.' : m + ' мин.'; };
  const clock = ms => { const t = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(t / 60), s = t % 60; return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); };
  const showCache = {};

  const SCENES = {
    snow(g, w, h) {
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#7aa0e0'); sky.addColorStop(0.45, '#c8c4ec'); sky.addColorStop(0.75, '#f4cce0'); sky.addColorStop(1, '#fbe6ee');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      const sun = g.createRadialGradient(w * 0.7, h * 0.36, 2, w * 0.7, h * 0.36, 60);
      sun.addColorStop(0, 'rgba(255,248,236,0.9)'); sun.addColorStop(1, 'rgba(255,248,236,0)');
      g.fillStyle = sun; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(G.hash(i, 3, 9) * w, 30 + G.hash(i, 4, 9) * 60, 18 + G.hash(i, 5, 9) * 16, 4, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#8a9cd8'; g.beginPath(); g.moveTo(0, h * 0.7);
      for (let x = 0; x <= w; x += 8) g.lineTo(x, h * 0.66 - Math.sin(x * 0.05) * 8 - G.hash(x, 1, 3) * 6);
      g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = '#b4c0ea'; g.beginPath(); g.moveTo(0, h * 0.78);
      for (let x = 0; x <= w; x += 6) g.lineTo(x, h * 0.75 - Math.sin(x * 0.08 + 1) * 5);
      g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = '#6a78b8'; g.fillRect(w * 0.14, h * 0.38, 7, h * 0.3); g.fillRect(w * 0.14 - 4, h * 0.36, 15, 4);
      g.beginPath(); g.moveTo(w * 0.14 - 2, h * 0.36); g.lineTo(w * 0.14 + 3.5, h * 0.27); g.lineTo(w * 0.14 + 9, h * 0.36); g.fill();
      const crystal = (x, y, s, tilt) => {
        g.save(); g.translate(x, y); g.rotate(tilt);
        g.fillStyle = '#7ab4ec'; g.beginPath(); g.moveTo(-s * 0.35, 0); g.lineTo(-s * 0.3, -s * 0.8); g.lineTo(0, -s); g.lineTo(s * 0.3, -s * 0.8); g.lineTo(s * 0.35, 0); g.fill();
        g.fillStyle = '#c4e4ff'; g.beginPath(); g.moveTo(-s * 0.35, 0); g.lineTo(-s * 0.3, -s * 0.8); g.lineTo(0, -s); g.lineTo(0, 0); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(-s * 0.2, -s * 0.75, 1, s * 0.6);
        g.restore();
      };
      [[18, h - 30, 46, -0.12], [34, h - 22, 30, 0.18], [8, h - 16, 26, -0.3], [w - 16, h - 26, 34, 0.2], [w - 30, h - 16, 22, -0.15]].forEach(a => crystal(...a));
      const flake = (x, y, r, a) => {
        g.strokeStyle = 'rgba(240,248,255,' + a + ')'; g.lineWidth = 1;
        for (let i = 0; i < 3; i++) { const t = i * Math.PI / 3; g.beginPath(); g.moveTo(x - Math.cos(t) * r, y - Math.sin(t) * r); g.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r); g.stroke(); }
      };
      flake(w * 0.78, h * 0.14, 14, 0.9); flake(w * 0.2, h * 0.2, 7, 0.8);
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.5 + G.hash(i, 8, 2) * 0.5) + ')'; g.fillRect(Math.floor(G.hash(i, 9, 2) * w), Math.floor(G.hash(9, i, 2) * h * 0.9), 1, 1); }
    },
    plum(g, w, h) {
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#102a3e'); sky.addColorStop(0.5, '#2e5e70'); sky.addColorStop(1, '#a8c8cc');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(230,245,255,' + (0.4 + G.hash(i, 4, 6) * 0.6) + ')'; g.fillRect(Math.floor(G.hash(i, 5, 6) * w), Math.floor(G.hash(5, i, 6) * h * 0.4), 1, 1); }
      const moon = g.createRadialGradient(w * 0.72, h * 0.2, 2, w * 0.72, h * 0.2, 40);
      moon.addColorStop(0, 'rgba(250,250,236,0.95)'); moon.addColorStop(0.3, 'rgba(240,244,230,0.5)'); moon.addColorStop(1, 'rgba(240,244,230,0)');
      g.fillStyle = moon; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f6f4e8'; g.beginPath(); g.arc(w * 0.72, h * 0.2, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#d8dcd4'; g.fillRect(0, h * 0.5, w, h * 0.3);
      g.fillStyle = '#5a6a6e'; g.fillRect(0, h * 0.5 - 4, w, 4);
      for (let x = 0; x < w; x += 8) { g.fillStyle = x % 16 ? '#3e4c52' : '#4a5a60'; g.fillRect(x, h * 0.5 - 7, 8, 3); }
      const gx = w * 0.5, gy = h * 0.66;
      g.fillStyle = '#244a58'; g.beginPath(); g.arc(gx, gy, 30, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3a6a78'; g.beginPath(); g.arc(gx, gy, 26, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#8a9a9a'; g.lineWidth = 2; g.beginPath(); g.arc(gx, gy, 30, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#e8ece6'; g.fillRect(0, h * 0.8, w, h * 0.2);
      g.fillStyle = '#cfd8d4'; for (let x = 0; x < w; x += 10) g.fillRect(x, h * 0.8, 6, 1);
      const branch = pts => { g.strokeStyle = '#2a1e22'; g.lineWidth = 2; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); };
      branch([0, 18, 22, 26, 40, 22, 58, 34, 70, 30]);
      branch([22, 26, 30, 44, 26, 58]);
      branch([w, 150, w - 18, 140, w - 30, 148, w - 44, 138]);
      const flower = (x, y, r) => {
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; g.fillStyle = i % 2 ? '#f6eef0' : '#fff8f8'; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.55, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#e8a0b0'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
      };
      [[14, 22, 4], [32, 24, 5], [46, 26, 4], [60, 32, 4], [68, 28, 3], [28, 40, 4], [26, 54, 3], [w - 14, 144, 4], [w - 34, 146, 5], [w - 44, 136, 3]].forEach(f => flower(...f));
      for (let i = 0; i < 22; i++) { g.fillStyle = i % 2 ? 'rgba(255,240,244,0.9)' : 'rgba(240,200,214,0.85)'; g.fillRect(Math.floor(G.hash(i, 8, 9) * w), Math.floor(40 + G.hash(i, 9, 9) * h * 0.7), 2, 1); }
    },
    stage(g, w, h) {
      const bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#1a1030'); bg.addColorStop(0.5, '#4a2a6a'); bg.addColorStop(1, '#2a1a3a');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 6; i++) {
        const y = 40 + i * 16;
        g.fillStyle = i % 2 ? 'rgba(240,150,220,0.28)' : 'rgba(255,190,240,0.18)';
        g.beginPath(); g.moveTo(14, y); g.lineTo(w / 2, y + 18); g.lineTo(w - 14, y); g.lineTo(w - 14, y + 8); g.lineTo(w / 2, y + 26); g.lineTo(14, y + 8); g.fill();
      }
      g.strokeStyle = '#6a6a8a'; g.lineWidth = 1;
      for (const y of [8, 14]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      for (let x = 0; x < w; x += 6) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 6, 14); g.stroke(); }
      for (const x of [6, w - 7]) { g.fillStyle = '#5a5a7a'; g.fillRect(x - 1, 8, 3, h * 0.72); for (let y = 14; y < h * 0.72; y += 6) { g.fillStyle = '#3a3a52'; g.fillRect(x - 1, y, 3, 1); } }
      const spot = (x, col) => {
        const beam = g.createLinearGradient(0, 16, 0, h * 0.8);
        beam.addColorStop(0, col.replace('A', '0.55')); beam.addColorStop(1, col.replace('A', '0'));
        g.fillStyle = beam; g.beginPath(); g.moveTo(x - 3, 16); g.lineTo(x + 3, 16); g.lineTo(x + 30, h * 0.8); g.lineTo(x - 30, h * 0.8); g.fill();
        g.fillStyle = '#20202c'; g.fillRect(x - 4, 11, 8, 6);
        g.fillStyle = col.replace('A', '1'); g.fillRect(x - 3, 15, 6, 2);
      };
      spot(w * 0.22, 'rgba(255,120,220,A)'); spot(w * 0.5, 'rgba(160,220,255,A)'); spot(w * 0.78, 'rgba(160,255,140,A)');
      g.fillStyle = '#2a1a3a'; g.fillRect(0, h * 0.8, w, h * 0.2);
      g.fillStyle = '#5a3a7a'; g.fillRect(0, h * 0.8, w, 2);
      for (let x = 4; x < w; x += 10) { g.fillStyle = (x / 10) % 2 < 1 ? '#ffd8f0' : '#c8f0ff'; g.fillRect(x, h * 0.8 + 4, 3, 2); }
      for (let i = 0; i < 30; i++) { g.fillStyle = ['rgba(255,240,140,0.9)', 'rgba(255,170,230,0.9)', 'rgba(170,230,255,0.9)'][i % 3]; g.fillRect(Math.floor(G.hash(i, 3, 8) * w), Math.floor(20 + G.hash(i, 4, 8) * h * 0.6), 1, 2); }
    },
    chapel(g, w, h) {
      g.fillStyle = '#d8d2c8'; g.fillRect(0, 0, w, h);
      const cols = ['#3a6ad8', '#58b8e8', '#8a5ad0', '#e8c058', '#5ac0a0', '#d86a8a'];
      const pane = (x0, y0, ww, hh) => {
        g.fillStyle = '#2a2a3a'; g.fillRect(x0 - 2, y0 - 2, ww + 4, hh + 4);
        for (let y = 0; y < hh; y += 6) for (let x = 0; x < ww; x += 6) { g.fillStyle = cols[Math.floor(G.hash(x0 + x, y0 + y, 3) * cols.length)]; g.fillRect(x0 + x, y0 + y, 5, 5); }
        g.fillStyle = '#2a2a3a'; g.beginPath(); g.moveTo(x0 - 2, y0 - 2); g.lineTo(x0 + ww / 2, y0 - 16); g.lineTo(x0 + ww + 2, y0 - 2); g.fill();
        g.fillStyle = cols[2]; g.beginPath(); g.moveTo(x0 + 2, y0); g.lineTo(x0 + ww / 2, y0 - 12); g.lineTo(x0 + ww - 2, y0); g.fill();
      };
      pane(16, 28, 30, 84); pane(w / 2 - 18, 22, 36, 92); pane(w - 46, 28, 30, 84);
      const glow = g.createLinearGradient(0, 0, 0, h);
      glow.addColorStop(0, 'rgba(255,250,240,0.25)'); glow.addColorStop(1, 'rgba(255,250,240,0)');
      g.fillStyle = glow; g.fillRect(0, 0, w, h);
      for (const [x, d] of [[0, 1], [w, -1]]) {
        g.fillStyle = '#f2eee6'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + d * 26, 0); g.quadraticCurveTo(x + d * 12, 60, x + d * 18, h * 0.75); g.lineTo(x, h * 0.75); g.fill();
        g.fillStyle = '#d8d0c4'; g.fillRect(x + (d > 0 ? 6 : -10), 0, 4, h * 0.75);
      }
      g.fillStyle = '#b8b0a8'; g.fillRect(0, h * 0.7, w, h * 0.3);
      g.fillStyle = '#c84858'; g.beginPath(); g.moveTo(w * 0.4, h * 0.7); g.lineTo(w * 0.6, h * 0.7); g.lineTo(w * 0.78, h); g.lineTo(w * 0.22, h); g.fill();
      g.fillStyle = '#e8d8a0'; g.fillRect(w * 0.22, h - 1, w * 0.56, 1);
      for (let i = 0; i < 26; i++) { g.fillStyle = i % 2 ? 'rgba(255,214,230,0.95)' : 'rgba(255,240,246,0.95)'; g.fillRect(Math.floor(G.hash(i, 2, 4) * w), Math.floor(G.hash(i, 3, 4) * h * 0.9), 2, 1); }
    },
    beach(g, w, h) {
      const sky = g.createLinearGradient(0, 0, 0, h * 0.5);
      sky.addColorStop(0, '#3a8ae0'); sky.addColorStop(0.7, '#8ac8f4'); sky.addColorStop(1, '#e4f4fc');
      g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.5);
      const sun = g.createRadialGradient(w * 0.8, h * 0.12, 3, w * 0.8, h * 0.12, 50);
      sun.addColorStop(0, 'rgba(255,252,230,1)'); sun.addColorStop(0.25, 'rgba(255,248,210,0.7)'); sun.addColorStop(1, 'rgba(255,248,210,0)');
      g.fillStyle = sun; g.fillRect(0, 0, w, h * 0.5);
      for (const [x, y, r] of [[w * 0.18, h * 0.14, 14], [w * 0.3, h * 0.12, 10], [w * 0.5, h * 0.3, 12], [w * 0.62, h * 0.29, 8]]) { g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(x, y, r * 1.6, r * 0.5, 0, 0, Math.PI * 2); g.fill(); }
      const sea = g.createLinearGradient(0, h * 0.5, 0, h * 0.68);
      sea.addColorStop(0, '#1e5ab8'); sea.addColorStop(1, '#3ac0d8');
      g.fillStyle = sea; g.fillRect(0, h * 0.5, w, h * 0.18);
      for (let i = 0; i < 22; i++) { g.fillStyle = 'rgba(230,248,255,' + (0.4 + G.hash(i, 1, 6) * 0.5) + ')'; g.fillRect(Math.floor(G.hash(i, 2, 6) * w), Math.floor(h * 0.51 + G.hash(i, 3, 6) * h * 0.15), 3 + Math.floor(G.hash(i, 4, 6) * 5), 1); }
      g.fillStyle = '#f0e2b8'; g.fillRect(0, h * 0.68, w, h * 0.32);
      g.fillStyle = '#d8c08a'; g.beginPath(); g.moveTo(0, h * 0.68);
      for (let x = 0; x <= w; x += 6) g.lineTo(x, h * 0.7 + Math.sin(x * 0.07) * 2.5);
      g.lineTo(w, h * 0.68); g.fill();
      g.fillStyle = '#f8fcff'; g.beginPath(); g.moveTo(0, h * 0.67);
      for (let x = 0; x <= w; x += 4) g.lineTo(x, h * 0.685 + Math.sin(x * 0.11 + 1) * 1.8);
      g.lineTo(w, h * 0.67); g.fill();
      for (let i = 0; i < 40; i++) { g.fillStyle = G.hash(i, 5, 6) > 0.5 ? '#e0cc98' : '#fff4d4'; g.fillRect(Math.floor(G.hash(i, 6, 6) * w), Math.floor(h * 0.74 + G.hash(i, 7, 6) * h * 0.25), 1, 1); }
      const px = 24, py = h * 0.5;
      g.fillStyle = '#e8e8ee'; g.fillRect(px - 1, py, 2, h * 0.36);
      for (let i = 0; i < 6; i++) {
        const a0 = Math.PI + i * Math.PI / 6, a1 = a0 + Math.PI / 6;
        g.fillStyle = i % 2 ? '#f6f6fa' : '#2c5ad8'; g.beginPath(); g.moveTo(px, py - 14);
        g.lineTo(px + Math.cos(a0) * 30, py + Math.sin(a0) * 6 - 2); g.lineTo(px + Math.cos(a1) * 30, py + Math.sin(a1) * 6 - 2); g.fill();
      }
      g.fillStyle = 'rgba(60,40,20,0.18)'; g.beginPath(); g.ellipse(px + 8, h * 0.86, 30, 4, 0, 0, Math.PI * 2); g.fill();
      const bx = w - 26, by = h * 0.88;
      for (const [c, a0] of [['#f6f6fa', 0], ['#e84a4a', 1], ['#f6f6fa', 2], ['#2c5ad8', 3]]) { g.fillStyle = c; g.beginPath(); g.moveTo(bx, by); g.arc(bx, by, 9, a0 * Math.PI / 2, (a0 + 1) * Math.PI / 2); g.fill(); }
      g.fillStyle = '#f0c040'; g.beginPath(); g.arc(bx, by, 2, 0, Math.PI * 2); g.fill();
      const star = (x, y, r) => { g.fillStyle = '#f0905a'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); };
      star(w * 0.42, h * 0.94, 5); star(w * 0.62, h * 0.8, 3.5);
      for (let i = 0; i < 18; i++) { const a = G.hash(i, 8, 6) * Math.PI, d = 10 + G.hash(i, 9, 6) * 26; g.fillStyle = 'rgba(200,240,255,0.9)'; g.beginPath(); g.arc(w * 0.5 + Math.cos(a) * d * 1.6, h * 0.66 - Math.sin(a) * d, 1 + G.hash(i, 10, 6) * 1.4, 0, Math.PI * 2); g.fill(); }
    },
    netcafe(g, w, h) {
      const wall = g.createLinearGradient(0, 0, 0, h * 0.62);
      wall.addColorStop(0, '#1a1430'); wall.addColorStop(1, '#3a2458');
      g.fillStyle = wall; g.fillRect(0, 0, w, h * 0.62);
      g.fillStyle = '#e0508a'; g.fillRect(0, 10, w, 2);
      g.fillStyle = 'rgba(224,80,138,0.25)'; g.fillRect(0, 7, w, 8);
      g.fillStyle = '#5ae8f8'; g.font = 'bold 9px sans-serif'; g.fillText('NET CLUB 24', 8, 30);
      const screen = (x, y, sw, sh, kind) => {
        g.fillStyle = '#16121e'; g.fillRect(x - 2, y - 2, sw + 4, sh + 4);
        const sc = g.createLinearGradient(x, y, x + sw, y + sh);
        sc.addColorStop(0, '#e83a7a'); sc.addColorStop(1, '#f08a4a');
        g.fillStyle = sc; g.fillRect(x, y, sw, sh);
        if (kind) {
          const cols = ['#7ad84a', '#a86ae8', '#f04a4a', '#f0d04a'];
          for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) { g.fillStyle = cols[Math.floor(G.hash(x + c, y + r, 4) * 4)]; g.fillRect(x + 3 + c * ((sw - 6) / 6), y + 3 + r * ((sh - 6) / 5), (sw - 6) / 6 - 1, (sh - 6) / 5 - 1); }
        } else { g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x + 4, y + 4, sw * 0.4, 2); g.fillRect(x + 4, y + 8, sw * 0.6, 2); }
        g.fillStyle = '#16121e'; g.fillRect(x + sw / 2 - 2, y + sh + 2, 4, 5); g.fillRect(x + sw / 2 - 7, y + sh + 6, 14, 2);
      };
      screen(8, h * 0.24, 54, 38, true); screen(w - 50, h * 0.27, 44, 30, false);
      const glow = g.createRadialGradient(35, h * 0.34, 4, 35, h * 0.34, 60);
      glow.addColorStop(0, 'rgba(240,90,140,0.35)'); glow.addColorStop(1, 'rgba(240,90,140,0)');
      g.fillStyle = glow; g.fillRect(0, 0, w, h);
      g.fillStyle = '#d8d4e4'; g.fillRect(0, h * 0.5, w, 5);
      g.fillStyle = '#9a96ac'; g.fillRect(0, h * 0.5 + 5, w, 2);
      g.fillStyle = '#2a2236'; g.fillRect(12, h * 0.5 - 4, 40, 4); g.fillRect(w - 46, h * 0.5 - 4, 36, 4);
      g.fillStyle = '#c83040'; g.fillRect(58, h * 0.5 - 12, 7, 12);
      g.fillStyle = '#f0d8a0'; for (const dx of [1, 3, 5]) g.fillRect(58 + dx, h * 0.5 - 15, 1, 4);
      g.fillStyle = '#241c30'; g.fillRect(0, h * 0.62, w, h * 0.38);
      for (let x = 0; x < w; x += 18) { g.fillStyle = 'rgba(90,232,248,0.08)'; g.fillRect(x, h * 0.62, 1, h * 0.38); }
      g.fillStyle = '#16121e'; g.fillRect(w - 40, h * 0.66, 26, 30); g.fillRect(w - 30, h * 0.66 + 30, 6, 14); g.fillRect(w - 40, h * 0.66 + 44, 26, 3);
      g.fillStyle = '#3a3248'; g.fillRect(w - 38, h * 0.66 + 2, 22, 2);
      for (let i = 0; i < 18; i++) { g.fillStyle = G.hash(i, 1, 7) > 0.5 ? 'rgba(90,232,248,0.8)' : 'rgba(240,120,170,0.8)'; g.fillRect(Math.floor(G.hash(i, 2, 7) * w), Math.floor(G.hash(i, 3, 7) * h * 0.2), 1, 1); }
    },
    ginkgo(g, w, h) {
      const sky = g.createLinearGradient(0, 0, 0, h * 0.7);
      sky.addColorStop(0, '#4a6aa8'); sky.addColorStop(0.55, '#d8a8a0'); sky.addColorStop(1, '#f4d49a');
      g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.7);
      g.fillStyle = '#6a5a7a'; g.beginPath(); g.moveTo(0, h * 0.56);
      for (let x = 0; x <= w; x += 8) g.lineTo(x, h * 0.5 - Math.sin(x * 0.04 + 1) * 10 - G.hash(x, 2, 9) * 4);
      g.lineTo(w, h * 0.7); g.lineTo(0, h * 0.7); g.fill();
      const leafAt = (x, y, r, a, col) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, -Math.PI * 0.85, -Math.PI * 0.15); g.closePath(); g.fill(); g.fillRect(-0.5, 0, 1, r * 0.5); g.restore(); };
      g.fillStyle = '#4a3a30'; g.fillRect(w - 34, h * 0.2, 9, h * 0.52); g.fillRect(w - 44, h * 0.3, 12, 3); g.fillRect(w - 28, h * 0.26, 14, 3);
      for (let i = 0; i < 70; i++) { const x = w - 30 + (G.hash(i, 1, 9) - 0.5) * 70, y = h * 0.08 + G.hash(i, 2, 9) * h * 0.3; leafAt(x, y, 4 + G.hash(i, 3, 9) * 3, G.hash(i, 4, 9) * 6, G.hash(i, 5, 9) > 0.4 ? '#f0c02a' : '#d89a1a'); }
      g.fillStyle = '#b8b0a4'; g.fillRect(0, h * 0.7, w, h * 0.3);
      for (let y = h * 0.72; y < h; y += 9) for (let x = (y / 9) % 2 ? 0 : 10; x < w; x += 20) { g.fillStyle = '#a49a8e'; g.fillRect(x, y, 18, 7); }
      g.fillStyle = '#8a8478'; g.fillRect(14, h * 0.5, 14, 4); g.fillRect(17, h * 0.54, 8, 10); g.fillRect(12, h * 0.6, 18, 4); g.fillRect(18, h * 0.64, 6, 16); g.fillRect(14, h * 0.78, 14, 4);
      g.fillStyle = '#f8d878'; g.fillRect(19, h * 0.555, 4, 6);
      const lamp = g.createRadialGradient(21, h * 0.58, 1, 21, h * 0.58, 18);
      lamp.addColorStop(0, 'rgba(255,220,140,0.6)'); lamp.addColorStop(1, 'rgba(255,220,140,0)');
      g.fillStyle = lamp; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 30; i++) leafAt(G.hash(i, 6, 9) * w, h * 0.74 + G.hash(i, 7, 9) * h * 0.25, 3, G.hash(i, 8, 9) * 6, G.hash(i, 9, 9) > 0.5 ? '#f0c02a' : '#e0a822');
      for (let i = 0; i < 14; i++) leafAt(G.hash(i, 10, 9) * w, G.hash(i, 11, 9) * h * 0.66, 3.4, G.hash(i, 12, 9) * 6, '#f6cc3a');
    },
    boutique(g, w, h) {
      g.fillStyle = '#f6d4e2'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 12) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, 0, 5, h * 0.7); }
      const wx = w * 0.56, wy = 14, ww = w * 0.38, wh = h * 0.36;
      const night = g.createLinearGradient(0, wy, 0, wy + wh);
      night.addColorStop(0, '#1c2048'); night.addColorStop(1, '#5a3a78');
      g.fillStyle = '#e8e8f0'; g.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
      g.fillStyle = night; g.fillRect(wx, wy, ww, wh);
      for (let i = 0; i < 5; i++) { const bh = 16 + G.hash(i, 1, 8) * 30, bx = wx + i * ww / 5; g.fillStyle = '#2a2a4a'; g.fillRect(bx, wy + wh - bh, ww / 5 - 2, bh); for (let y = wy + wh - bh + 3; y < wy + wh - 3; y += 5) { g.fillStyle = G.hash(bx, y, 2) > 0.5 ? '#f08ac0' : '#7ae0f0'; g.fillRect(bx + 2, y, 2, 2); } }
      g.fillStyle = '#e8e8f0'; g.fillRect(wx + ww / 2 - 1, wy, 2, wh);
      g.fillStyle = '#e8306a'; g.fillRect(8, 46, 54, 22);
      g.fillStyle = '#fff4f8'; g.font = 'bold 11px sans-serif'; g.fillText('SALE', 12, 58); g.font = 'bold 8px sans-serif'; g.fillText('-50%', 42, 65);
      g.fillStyle = '#c8a0b0'; g.fillRect(4, h * 0.42, w * 0.5, 2);
      const cols = ['#6cc2d6', '#ee8eb2', '#f2c42e', '#b8e040', '#86b2da', '#f6f4f0'];
      for (let i = 0; i < 6; i++) {
        const x = 10 + i * 12, y = h * 0.42 + 2;
        g.strokeStyle = '#8a7a84'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 4, y - 2); g.lineTo(x + 4, y + 2); g.stroke();
        g.fillStyle = cols[i]; g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + 8, y + 4); g.lineTo(x + 9, y + 26); g.lineTo(x - 1, y + 26); g.fill();
        g.fillStyle = '#fff8e0'; g.fillRect(x + 6, y + 8, 3, 4);
      }
      g.fillStyle = '#e8c8d4'; g.fillRect(0, h * 0.7, w, h * 0.3);
      for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x, h * 0.7, 1, h * 0.3); }
      for (const [x, c] of [[10, '#ee8eb2'], [24, '#6cc2d6'], [w - 30, '#f2c42e']]) {
        const y = h * 0.84;
        g.fillStyle = c; g.fillRect(x, y, 14, 16);
        g.fillStyle = 'rgba(40,20,40,0.2)'; g.fillRect(x + 10, y, 4, 16);
        g.strokeStyle = '#3a2a34'; g.beginPath(); g.arc(x + 7, y, 4, Math.PI, 0); g.stroke();
      }
      for (let i = 0; i < 16; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.5 + G.hash(i, 3, 8) * 0.5) + ')'; const x = Math.floor(G.hash(i, 4, 8) * w), y = Math.floor(G.hash(i, 5, 8) * h * 0.7); g.fillRect(x, y - 1, 1, 3); g.fillRect(x - 1, y, 3, 1); }
    },
    street(g, w, h) {
      const sky = g.createLinearGradient(0, 0, 0, h * 0.6);
      sky.addColorStop(0, '#1c2448'); sky.addColorStop(0.6, '#5a4a7a'); sky.addColorStop(1, '#e8906a');
      g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.6);
      for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(240,240,255,0.8)'; g.fillRect(Math.floor(G.hash(i, 1, 2) * w), Math.floor(G.hash(i, 2, 2) * h * 0.25), 1, 1); }
      for (let i = 0; i < 7; i++) {
        const bw = 18 + G.hash(i, 3, 3) * 14, bh = 50 + G.hash(i, 4, 3) * 60, bx = i * 24 - 6;
        g.fillStyle = i % 2 ? '#2a2a44' : '#323252'; g.fillRect(bx, h * 0.6 - bh, bw, bh);
        for (let y = h * 0.6 - bh + 6; y < h * 0.6 - 6; y += 8) for (let x = bx + 3; x < bx + bw - 4; x += 6) if (G.hash(x, y, 5) > 0.45) { g.fillStyle = '#f0d890'; g.fillRect(x, y, 3, 3); }
      }
      const sx = w * 0.52, sy = h * 0.42, sw = 66, sh = h * 0.18;
      g.fillStyle = '#e8ecf0'; g.fillRect(sx, sy, sw, sh);
      g.fillStyle = '#3a9a5a'; g.fillRect(sx, sy, sw, 5); g.fillStyle = '#e86a2a'; g.fillRect(sx, sy + 5, sw, 3); g.fillStyle = '#3a6ad0'; g.fillRect(sx, sy + 8, sw, 2);
      const glass = g.createLinearGradient(0, sy + 12, 0, sy + sh);
      glass.addColorStop(0, '#fffbe0'); glass.addColorStop(1, '#f0e8b0');
      g.fillStyle = glass; g.fillRect(sx + 4, sy + 13, sw - 8, sh - 13);
      g.fillStyle = '#c8c8b8'; for (let x = sx + 16; x < sx + sw - 4; x += 16) g.fillRect(x, sy + 13, 1, sh - 13);
      const halo = g.createRadialGradient(sx + sw / 2, sy + sh, 4, sx + sw / 2, sy + sh, 70);
      halo.addColorStop(0, 'rgba(255,248,210,0.5)'); halo.addColorStop(1, 'rgba(255,248,210,0)');
      g.fillStyle = halo; g.fillRect(0, 0, w, h);
      g.fillStyle = '#3a3a48'; g.fillRect(0, h * 0.6, w, h * 0.4);
      g.fillStyle = '#5a5a68'; g.fillRect(0, h * 0.6, w, 3);
      for (let x = 4; x < w; x += 14) { g.fillStyle = '#e8e8ec'; g.fillRect(x, h * 0.82, 9, 4); }
      g.fillStyle = '#26262e'; g.fillRect(18, h * 0.3, 2, h * 0.32);
      g.fillStyle = '#26262e'; g.fillRect(18, h * 0.3, 12, 2);
      g.fillStyle = '#fff4c8'; g.fillRect(26, h * 0.3 + 2, 5, 2);
      const lamp = g.createRadialGradient(28, h * 0.3 + 4, 2, 28, h * 0.3 + 4, 34);
      lamp.addColorStop(0, 'rgba(255,240,190,0.55)'); lamp.addColorStop(1, 'rgba(255,240,190,0)');
      g.fillStyle = lamp; g.fillRect(0, 0, w, h);
    },
    blast(g, w, h) {
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#1c1236'); sky.addColorStop(0.4, '#5a2a5a'); sky.addColorStop(0.7, '#c8583a'); sky.addColorStop(1, '#f0a050');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(255,240,220,' + (0.4 + G.hash(i, 2, 5) * 0.6) + ')'; g.fillRect(Math.floor(G.hash(i, 3, 5) * w), Math.floor(G.hash(3, i, 5) * h * 0.35), 1, 1); }
      const bx = w * 0.3, by = h * 0.44;
      const glow = g.createRadialGradient(bx, by, 4, bx, by, 80);
      glow.addColorStop(0, 'rgba(255,250,220,0.95)'); glow.addColorStop(0.3, 'rgba(255,190,90,0.7)'); glow.addColorStop(1, 'rgba(255,90,40,0)');
      g.fillStyle = glow; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e88a4a'; g.beginPath(); g.moveTo(bx - 8, h * 0.72); g.lineTo(bx - 5, by + 4); g.lineTo(bx + 5, by + 4); g.lineTo(bx + 8, h * 0.72); g.fill();
      for (const [dx, dy, r, col] of [[-22, -6, 16, '#a85a5a'], [20, -8, 17, '#a85a5a'], [0, -18, 20, '#c87a5a'], [-12, -24, 14, '#e8a070'], [12, -26, 13, '#e8a070'], [0, -10, 12, '#ffd8a0']]) { g.fillStyle = col; g.beginPath(); g.ellipse(bx + dx, by + dy, r, r * 0.7, 0, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = 'rgba(255,240,200,0.8)'; g.lineWidth = 1; g.beginPath(); g.ellipse(bx, by + 6, 30, 5, 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#3a2232'; g.beginPath(); g.moveTo(0, h * 0.72);
      for (let x = 0; x <= w; x += 8) g.lineTo(x, h * 0.7 - Math.sin(x * 0.06) * 6 - G.hash(x, 4, 3) * 5);
      g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = '#24141e'; g.beginPath(); g.moveTo(0, h * 0.84);
      for (let x = 0; x <= w; x += 6) g.lineTo(x, h * 0.82 - Math.sin(x * 0.09 + 2) * 4);
      g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.strokeStyle = 'rgba(240,70,60,0.85)'; g.lineWidth = 1;
      const mx = w * 0.62, my = h * 0.93;
      for (const r of [34, 27]) { g.beginPath(); g.ellipse(mx, my, r, r * 0.24, 0, 0, Math.PI * 2); g.stroke(); }
      g.beginPath();
      for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 4 / 5, x = mx + Math.cos(a) * 27, y = my + Math.sin(a) * 27 * 0.24; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
      for (let i = 0; i < 24; i++) { g.fillStyle = i % 3 ? 'rgba(255,170,70,0.9)' : 'rgba(255,240,180,0.9)'; g.fillRect(Math.floor(G.hash(i, 6, 7) * w), Math.floor(h * 0.3 + G.hash(i, 7, 7) * h * 0.55), 1, 1); }
    },
    trashking(g, w, h) {
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#f0d890'); sky.addColorStop(0.45, '#f0a85a'); sky.addColorStop(1, '#c8603a');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      const sx = w * 0.5, sy = h * 0.2;
      for (let i = 0; i < 16; i++) {
        const a0 = i * Math.PI / 8, a1 = a0 + Math.PI / 16;
        g.fillStyle = i % 2 ? 'rgba(255,250,220,0.35)' : 'rgba(230,110,60,0.25)';
        g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a0) * 260, sy + Math.sin(a0) * 260); g.lineTo(sx + Math.cos(a1) * 260, sy + Math.sin(a1) * 260); g.fill();
      }
      const sun = g.createRadialGradient(sx, sy, 2, sx, sy, 22);
      sun.addColorStop(0, '#fffbe8'); sun.addColorStop(0.5, '#ffe8a0'); sun.addColorStop(1, 'rgba(255,232,160,0)');
      g.fillStyle = sun; g.fillRect(0, 0, w, h);
      for (const [x, y, r] of [[18, 70, 18], [40, 82, 14], [w - 20, 66, 20], [w - 44, 84, 12], [w * 0.5, 96, 16]]) { g.fillStyle = 'rgba(255,244,230,0.85)'; g.beginPath(); g.ellipse(x, y, r * 1.6, r * 0.6, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(240,190,150,0.6)'; g.beginPath(); g.ellipse(x + 4, y + 3, r * 1.2, r * 0.3, 0, 0, Math.PI * 2); g.fill(); }
      const can = (x, y, s, gold) => {
        const c0 = gold ? '#e8b830' : '#9aa2b0', c1 = gold ? '#b88a20' : '#6e7684', c2 = gold ? '#fff0a0' : '#d8dde6';
        g.fillStyle = c1; g.fillRect(x - 5 * s, y - 12 * s, 10 * s, 12 * s);
        g.fillStyle = c0; g.fillRect(x - 5 * s, y - 12 * s, 7 * s, 12 * s);
        g.fillStyle = c1; for (const d of [-3, -1, 1]) g.fillRect(x + d * s, y - 10 * s, Math.max(1, 0.6 * s), 9 * s);
        g.fillStyle = c2; g.fillRect(x - 4 * s, y - 10 * s, Math.max(1, 0.6 * s), 9 * s);
        g.fillStyle = c0; g.beginPath(); g.ellipse(x, y - 12.6 * s, 6 * s, 2 * s, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = c1; g.fillRect(x - 1.4 * s, y - 15 * s, 2.8 * s, 1.4 * s);
        g.fillStyle = c1; g.fillRect(x - 3 * s, y, 2 * s, 4 * s); g.fillRect(x + 1 * s, y, 2 * s, 4 * s);
      };
      g.fillStyle = '#8a4a34'; g.fillRect(0, h * 0.74, w, h * 0.26);
      g.fillStyle = '#a85a3e'; g.fillRect(0, h * 0.74, w, 2);
      for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) { const x = 8 + i * 17 + r * 8, y = h * 0.73 + r * 12; if (x < w - 4) can(x, y, 0.9 + r * 0.15, false); }
      can(w * 0.5 + 34, h * 0.73 + 12, 1.05, true);
      g.fillStyle = 'rgba(255,240,160,0.9)'; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.fillRect(Math.round(w * 0.5 + 34 + Math.cos(a) * 12), Math.round(h * 0.73 - 2 + Math.sin(a) * 12), 1, 1); }
    },
    eclipse(g, w, h) {
      const sky = g.createLinearGradient(0, 0, 0, h * 0.7);
      sky.addColorStop(0, '#120810'); sky.addColorStop(0.5, '#4a1018'); sky.addColorStop(1, '#c8401e');
      g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.7);
      const sx = w * 0.64, sy = h * 0.22;
      const corona = g.createRadialGradient(sx, sy, 14, sx, sy, 52);
      corona.addColorStop(0, 'rgba(255,200,110,0.95)'); corona.addColorStop(0.3, 'rgba(255,120,40,0.55)'); corona.addColorStop(1, 'rgba(255,80,30,0)');
      g.fillStyle = corona; g.fillRect(0, 0, w, h);
      g.fillStyle = '#0c0608'; g.beginPath(); g.arc(sx, sy, 15, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,230,170,0.9)'; g.lineWidth = 1; g.beginPath(); g.arc(sx, sy, 15.5, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#2a0c12'; g.beginPath(); g.moveTo(0, h * 0.6);
      for (let i = 0; i <= 12; i++) { const x = i * w / 12, ht = 18 + G.hash(i, 3, 14) * 40; g.lineTo(x, h * 0.6 - ht); g.lineTo(x + w / 24, h * 0.6 - ht - (G.hash(i, 4, 14) > 0.6 ? 10 : 0)); }
      g.lineTo(w, h * 0.7); g.lineTo(0, h * 0.7); g.fill();
      g.fillStyle = '#ff8a3a'; for (let i = 0; i < 14; i++) if (G.hash(i, 5, 14) > 0.45) g.fillRect(Math.floor(G.hash(i, 6, 14) * w), Math.floor(h * 0.5 + G.hash(i, 7, 14) * h * 0.12), 2, 2);
      g.fillStyle = '#1a0a0c'; g.fillRect(0, h * 0.7, w, h * 0.3);
      g.fillStyle = '#2e1216'; g.beginPath(); g.moveTo(0, h * 0.7);
      for (let x = 0; x <= w; x += 8) g.lineTo(x, h * 0.69 - G.hash(x, 8, 14) * 3);
      g.lineTo(w, h * 0.74); g.lineTo(0, h * 0.74); g.fill();
      g.strokeStyle = '#ff8a2a'; g.lineWidth = 1;
      for (const pts of [[10, h * 0.8, 26, h * 0.84, 22, h * 0.92, 36, h * 0.98], [w - 12, h * 0.78, w - 26, h * 0.86, w - 20, h * 0.95], [w * 0.5, h * 0.76, w * 0.42, h * 0.82]]) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); }
      const bx = 26, by = h * 0.8;
      g.fillStyle = '#2e1418'; g.beginPath(); g.moveTo(bx - 9, by); g.lineTo(bx - 8, by - 70); g.lineTo(bx - 2, by - 78); g.lineTo(bx + 3, by - 70); g.lineTo(bx + 9, by - 74); g.lineTo(bx + 9, by); g.fill();
      g.fillStyle = '#44202a'; for (const y of [12, 30, 48, 66]) g.fillRect(bx - 9, by - y, 18, 2);
      g.fillStyle = '#1a0a0e'; g.fillRect(bx + 4, by - 70, 5, 70);
      g.fillStyle = '#ff8a2a'; g.fillRect(bx - 3, by - 40, 1, 14); g.fillRect(bx - 2, by - 27, 1, 8);
      const glow = g.createRadialGradient(bx, by, 2, bx, by, 26);
      glow.addColorStop(0, 'rgba(255,150,60,0.6)'); glow.addColorStop(1, 'rgba(255,150,60,0)');
      g.fillStyle = glow; g.fillRect(0, by - 26, 60, 52);
      for (let i = 0; i < 40; i++) { g.fillStyle = i % 3 ? 'rgba(255,150,60,0.9)' : 'rgba(255,230,160,0.95)'; g.fillRect(Math.floor(G.hash(i, 9, 14) * w), Math.floor(G.hash(i, 10, 14) * h * 0.95), 1, i % 4 ? 1 : 2); }
    },
    walk(g, w, h) {
      const wall = g.createLinearGradient(0, 0, 0, h * 0.62);
      wall.addColorStop(0, '#1c2438'); wall.addColorStop(1, '#2e3a56');
      g.fillStyle = wall; g.fillRect(0, 0, w, h * 0.62);
      const wx = 30, wy = 22, ww = w - 60, wh = 66;
      g.fillStyle = '#0a0e1e'; g.fillRect(wx, wy, ww, wh);
      for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(230,240,255,' + (0.4 + G.hash(i, 1, 13) * 0.6) + ')'; g.fillRect(wx + Math.floor(G.hash(i, 2, 13) * ww), wy + Math.floor(G.hash(i, 3, 13) * wh), 1, 1); }
      const pl = g.createRadialGradient(wx + ww * 0.75, wy + wh + 30, 8, wx + ww * 0.75, wy + wh + 30, 60);
      pl.addColorStop(0, '#5a8ad8'); pl.addColorStop(0.8, '#2a4a8a'); pl.addColorStop(1, 'rgba(42,74,138,0)');
      g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip(); g.fillStyle = pl; g.beginPath(); g.arc(wx + ww * 0.75, wy + wh + 30, 52, 0, Math.PI * 2); g.fill(); g.restore();
      g.strokeStyle = '#8a96b0'; g.lineWidth = 2; g.strokeRect(wx, wy, ww, wh);
      g.fillStyle = '#8a96b0'; g.fillRect(wx + ww / 2 - 1, wy, 2, wh);
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(wx + 8, wy); g.lineTo(wx + 22, wy); g.lineTo(wx + 6, wy + wh); g.lineTo(wx - 8, wy + wh); g.fill();
      for (const x of [0, w - 22]) { g.fillStyle = '#232c44'; g.fillRect(x, 10, 22, h * 0.52); g.fillStyle = '#3a4866'; g.fillRect(x + 3, 14, 16, 2); g.fillRect(x + 3, h * 0.3, 16, 1); g.fillStyle = '#d8c070'; g.fillRect(x + 9, 20, 4, 2); }
      g.fillStyle = '#e8e8ee'; g.fillRect(0, 4, w, 3); g.fillStyle = '#9aa4ba'; g.fillRect(0, 7, w, 1);
      g.fillStyle = '#9a6a42'; g.fillRect(0, h * 0.62, w, 5); g.fillStyle = '#b8824e'; g.fillRect(0, h * 0.62, w, 1);
      g.fillStyle = '#585c66'; g.fillRect(0, h * 0.62 + 5, w, h * 0.38);
      g.fillStyle = '#4c5058'; for (let y = h * 0.62 + 9; y < h; y += 6) for (let x = (y / 6) % 2 ? 0 : 3; x < w; x += 6) g.fillRect(x, y, 3, 2);
      const px = w - 20, py = h - 40, fur = '#f2e6cc', fsh = '#d8c8a8', pink = '#eaa8a6';
      g.fillStyle = 'rgba(20,20,30,0.3)'; g.beginPath(); g.ellipse(px, py + 14, 16, 3, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = fsh; g.beginPath(); g.ellipse(px + 12, py + 4, 6, 8, 0.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = fur; g.beginPath(); g.ellipse(px + 11, py + 2, 4.6, 6.6, 0.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = fsh; g.beginPath(); g.ellipse(px, py + 6, 10, 9, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = fur; g.beginPath(); g.ellipse(px - 0.6, py + 5, 9, 8.4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fbf6ea'; g.beginPath(); g.moveTo(px - 6, py - 3); g.lineTo(px + 6, py - 3); g.lineTo(px + 4, py + 6); g.lineTo(px + 1, py + 3); g.lineTo(px - 1, py + 7); g.lineTo(px - 3, py + 3); g.lineTo(px - 5, py + 6); g.fill();
      for (const dx of [-4, 3]) { g.fillStyle = fur; g.fillRect(px + dx, py + 10, 4, 5); g.fillStyle = fsh; g.fillRect(px + dx, py + 14, 4, 1); }
      for (const s of [-1, 1]) {
        g.fillStyle = fsh; g.beginPath(); g.moveTo(px + s * 2, py - 14); g.lineTo(px + s * 7, py - 26); g.lineTo(px + s * 9, py - 11); g.fill();
        g.fillStyle = fur; g.beginPath(); g.moveTo(px + s * 2.6, py - 14); g.lineTo(px + s * 6.8, py - 24.6); g.lineTo(px + s * 8.2, py - 12); g.fill();
        g.fillStyle = pink; g.beginPath(); g.moveTo(px + s * 4, py - 14.6); g.lineTo(px + s * 6.6, py - 21.6); g.lineTo(px + s * 7.4, py - 13.6); g.fill();
      }
      g.fillStyle = fsh; g.beginPath(); g.ellipse(px, py - 8, 9, 8, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = fur; g.beginPath(); g.ellipse(px - 0.4, py - 8.6, 8.4, 7.4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1a1418'; g.fillRect(px - 5, py - 10, 2, 2); g.fillRect(px + 3, py - 10, 2, 2);
      g.fillStyle = '#ffffff'; g.fillRect(px - 5, py - 10, 1, 1); g.fillRect(px + 3, py - 10, 1, 1);
      g.fillStyle = '#3a2a28'; g.fillRect(px - 1, py - 7, 2, 1);
      g.fillStyle = '#e8b0a8'; g.fillRect(px - 6, py - 7, 2, 1); g.fillRect(px + 4, py - 7, 2, 1);
      g.strokeStyle = '#3a6ad8'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(px - 2, py - 4.6); g.quadraticCurveTo(px - 14, py + 2, px - 12, py + 10); g.quadraticCurveTo(px - 10, py + 16, px - 22, py + 14); g.stroke();
      g.fillStyle = '#2a4aa8'; g.fillRect(px - 3, py - 5.4, 6, 1.6);
      g.fillStyle = '#c8ccd4'; g.fillRect(px - 24, py + 13, 3, 2);
      g.strokeStyle = '#3a6ad8'; g.lineWidth = 1; g.beginPath(); g.moveTo(px - 5, py - 2); g.lineTo(px, py + 3); g.lineTo(px + 5, py - 2); g.stroke();
      g.fillStyle = '#e0c088'; g.fillRect(px - 1, py + 2, 2, 1);
      g.fillStyle = '#f6f6fa'; g.fillRect(px - 2, py + 3, 5, 6); g.fillStyle = '#3a6ad8'; g.fillRect(px - 2, py + 3, 5, 1); g.fillStyle = '#c8b090'; g.fillRect(px - 1, py + 5, 2, 2);
    },
    mine(g, w, h) {
      const dark = g.createLinearGradient(0, 0, 0, h);
      dark.addColorStop(0, '#0c1226'); dark.addColorStop(0.55, '#1a2440'); dark.addColorStop(1, '#2a2a34');
      g.fillStyle = dark; g.fillRect(0, 0, w, h);
      const cx = w * 0.3, cy = h * 0.34;
      const halo = g.createRadialGradient(cx, cy, 4, cx, cy, 90);
      halo.addColorStop(0, 'rgba(255,200,90,0.55)'); halo.addColorStop(0.4, 'rgba(240,150,50,0.22)'); halo.addColorStop(1, 'rgba(240,150,50,0)');
      g.fillStyle = halo; g.fillRect(0, 0, w, h);
      const shard = (x, y, len, ang, wd) => {
        const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy * wd, ny = dx * wd;
        g.fillStyle = '#e89a2a'; g.beginPath(); g.moveTo(x + nx, y + ny); g.lineTo(x + dx * len, y + dy * len); g.lineTo(x - nx, y - ny); g.fill();
        g.fillStyle = '#ffd870'; g.beginPath(); g.moveTo(x + nx * 0.4, y + ny * 0.4); g.lineTo(x + dx * len * 0.92, y + dy * len * 0.92); g.lineTo(x, y); g.fill();
      };
      g.fillStyle = '#141a2c'; g.fillRect(cx - 9, cy - 10, 18, h * 0.6);
      for (const [a, l, wd] of [[-1.75, 52, 5], [-1.3, 40, 4], [-2.2, 38, 4], [-0.7, 30, 3.4], [-2.6, 28, 3.2], [-1.0, 46, 4], [0.2, 24, 3], [3.0, 22, 3], [-1.55, 30, 6]]) shard(cx, cy, l, a, wd);
      for (const [x, y, l, a] of [[cx - 6, cy + 30, 18, 2.6], [cx + 6, cy + 26, 20, 0.4], [cx + 2, cy + 44, 14, 0.1]]) shard(x, y, l, a, 2.4);
      for (let i = 0; i < 6; i++) {
        const x = i < 3 ? i * 16 - 6 : w - (i - 3) * 18 - 12, top = 36 + G.hash(i, 2, 11) * 40, bw = 16 + G.hash(i, 3, 11) * 8;
        g.fillStyle = i % 2 ? '#1e2638' : '#232c42'; g.fillRect(x, top, bw, h * 0.66 - top);
        g.fillStyle = '#161c2c'; for (let y = top + 4; y < h * 0.66; y += 7) g.fillRect(x + 2 + (y % 3), y, 1, 5);
        g.fillStyle = '#d8e0ee'; g.fillRect(x - 1, top - 2, bw + 2, 3);
        g.fillStyle = '#aab4c8'; g.fillRect(x + 2, top + 1, bw - 5, 1);
      }
      const truss = y => {
        g.fillStyle = '#5a3424'; g.fillRect(0, y, w, 2); g.fillRect(0, y + 8, w, 2);
        g.strokeStyle = '#6e4430'; g.lineWidth = 1;
        for (let x = 0; x < w; x += 10) { g.beginPath(); g.moveTo(x, y + 2); g.lineTo(x + 10, y + 8); g.moveTo(x + 10, y + 2); g.lineTo(x, y + 8); g.stroke(); }
      };
      truss(h * 0.14);
      g.fillStyle = '#4a2c20'; g.fillRect(w * 0.7, h * 0.14, 4, h * 0.52); g.fillRect(w * 0.7 + 12, h * 0.14, 4, h * 0.52);
      g.strokeStyle = '#5e3a2a';
      for (let y = h * 0.14 + 10; y < h * 0.66; y += 14) { g.beginPath(); g.moveTo(w * 0.7 + 4, y); g.lineTo(w * 0.7 + 12, y + 14); g.moveTo(w * 0.7 + 12, y); g.lineTo(w * 0.7 + 4, y + 14); g.stroke(); }
      const lamp = (x, y) => {
        g.fillStyle = '#2a2020'; g.fillRect(x, h * 0.14 + 10, 1, y - h * 0.14 - 10);
        const lg = g.createRadialGradient(x, y + 5, 1, x, y + 5, 22);
        lg.addColorStop(0, 'rgba(255,220,140,0.6)'); lg.addColorStop(1, 'rgba(255,220,140,0)');
        g.fillStyle = lg; g.fillRect(x - 24, y - 18, 48, 48);
        g.fillStyle = '#3a2c24'; g.fillRect(x - 3, y, 7, 2); g.fillRect(x - 3, y + 9, 7, 2);
        g.fillStyle = '#ffd880'; g.fillRect(x - 2, y + 2, 5, 7);
        g.fillStyle = '#fff6d0'; g.fillRect(x - 1, y + 3, 2, 4);
      };
      lamp(w * 0.56, h * 0.3); lamp(w * 0.9, h * 0.26);
      g.fillStyle = '#3a3238'; g.fillRect(0, h * 0.66, w, h * 0.34);
      g.fillStyle = '#4a4048'; for (let i = 0; i < 30; i++) g.fillRect(Math.floor(G.hash(i, 5, 12) * w), Math.floor(h * 0.68 + G.hash(i, 6, 12) * h * 0.3), 2, 1);
      const vx = w * 0.5, rail = (x0, x1) => { g.strokeStyle = '#8a8e9a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, h); g.lineTo(x1, h * 0.66); g.stroke(); };
      g.fillStyle = '#4a3428';
      for (let k = 0; k < 7; k++) { const t = k / 6, y = h * 0.66 + (h * 0.34) * t * t, half = 6 + t * 30; g.fillRect(vx - half - 4, y, half * 2 + 8, 1 + t * 3); }
      rail(vx - 36, vx - 6); rail(vx + 36, vx + 6);
      const kx = w * 0.82, ky = h * 0.74;
      g.fillStyle = '#4a4a54'; g.beginPath(); g.moveTo(kx - 20, ky); g.lineTo(kx + 20, ky); g.lineTo(kx + 15, ky + 18); g.lineTo(kx - 15, ky + 18); g.fill();
      g.fillStyle = '#5e5e6a'; g.fillRect(kx - 20, ky, 40, 3);
      for (const [dx, dy, r] of [[-10, -1, 6], [0, -4, 7], [10, -1, 6], [-4, 2, 4], [6, 1, 4]]) { g.fillStyle = '#e8a030'; g.beginPath(); g.moveTo(kx + dx - r, ky + dy + 2); g.lineTo(kx + dx, ky + dy - r); g.lineTo(kx + dx + r, ky + dy + 2); g.fill(); g.fillStyle = '#ffe08a'; g.fillRect(kx + dx - 1, ky + dy - r + 3, 2, r - 2); }
      g.fillStyle = '#1c1c22'; for (const dx of [-11, 11]) { g.beginPath(); g.arc(kx + dx, ky + 19, 3.4, 0, Math.PI * 2); g.fill(); }
      for (let i = 0; i < 26; i++) { g.fillStyle = i % 3 ? 'rgba(255,200,90,0.9)' : 'rgba(255,248,210,0.9)'; g.fillRect(Math.floor(G.hash(i, 8, 12) * w), Math.floor(G.hash(i, 9, 12) * h * 0.6), 1, 1); }
    }
  };

  function showcase(id) {
    if (showCache[id]) return showCache[id];
    const w = SHOW.w / 2, h = SHOW.h / 2, cv = G.mkCanvas(w, h);
    (SCENES[(H.OUTFITS[id] || {}).scene] || SCENES.snow)(cv.getContext('2d'), w, h);
    showCache[id] = cv;
    return cv;
  }

  function archPath(c, x, y, w, h) {
    const r = w / 2;
    c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + r); c.arc(x + r, y + r, r, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath();
  }

  Object.assign(H.UI.prototype, {
    supplyTag(x, y, label, col, dark) {
      const w = Math.round(this.measure(label, 9, true) + 8);
      this.ctx.fillStyle = col; this.ctx.fillRect(x, y, w, 12);
      this.text(label, x + 4, y + 1, { size: 9, bold: true, col: dark ? '#20140c' : '#fff6ec', shadow: !dark });
      return w;
    },

    supplyPill(x, y, kind, value) {
      const c = this.ctx, w = 110;
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(x, y, w, 22);
      c.strokeStyle = 'rgba(242,220,154,0.45)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, 21);
      G.itemIcon(c, kind, x + 3, y + 1, 20);
      this.text(fmt(value), x + w - 8, y + 5, { size: 12, bold: true, align: 'right' });
      return w;
    },

    supplyArt(c, it, cx, y) {
      if (it.kind === 'cone') G.drawConeCard(c, it.ref, cx - 20, y, 40, 56, { info: false });
      else if (it.kind === 'char') G.drawPortrait(c, G.lookOf(it.ref, null), cx - 29, y - 2, 58);
      else G.itemIcon(c, it.ref, cx - 24, y + 4, 48);
    },

    supplyCard(c, it, x, y, on, have) {
      const { w, h } = GRID, foot = 26, can = have >= it.price && !it.block;
      if (on) { c.fillStyle = C.brassHi; c.fillRect(x - 2, y - 2, w + 4, h + 4); }
      c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
      G.rarityCell(c, x, y, w, h - foot, it.rar);
      const gl = c.createRadialGradient(x + w / 2, y + 44, 4, x + w / 2, y + 44, 44);
      gl.addColorStop(0, 'rgba(255,255,255,0.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gl; c.fillRect(x, y, w, h - foot);
      this.supplyArt(c, it, x + w / 2, y + 16);
      const name = it.per > 1 ? it.name + ' ×' + fmt(it.per) : it.name, lines = this.wrap(name, w - 8, 9).slice(0, 2);
      c.fillStyle = 'rgba(8,8,24,0.35)'; c.fillRect(x, y + 75, w, h - foot - 75);
      lines.forEach((l, i) => this.text(l, x + w / 2, y + (lines.length > 1 ? 77 : 82) + i * 10, { size: 9, bold: true, align: 'center' }));
      this.text('★'.repeat(it.rar), x + w / 2, y + 97, { size: 8, align: 'center', col: G.RARITY[it.rar] });
      c.fillStyle = '#f2ead6'; c.fillRect(x, y + h - foot, w, foot);
      c.fillStyle = '#c8b890'; c.fillRect(x, y + h - foot, w, 1);
      const label = fmt(it.price), lw = this.measure(label, 13, true) + 18, wasW = it.was ? this.measure(String(it.was), 9) + 4 : 0, lx = x + (w - lw - wasW) / 2;
      G.itemIcon(c, it.cur, lx, y + h - foot + 5, 16);
      this.text(label, lx + 18, y + h - foot + 6, { size: 13, bold: true, col: can || it.block ? '#c84a1a' : '#a8a098', shadow: false });
      if (it.was) {
        const wx = lx + lw + 2;
        this.text(String(it.was), wx, y + h - foot + 10, { size: 9, col: '#8a8478', shadow: false });
        c.fillStyle = '#8a8478'; c.fillRect(wx, y + h - foot + 15, wasW - 4, 1);
        this.supplyTag(x + w - this.measure('Выгода', 9, true) - 11, y + 30, 'Выгода', '#d83a3a');
      }
      if (it.limit) {
        const ty = y + 3;
        if (it.block === 'max') this.supplyTag(x + 3, ty, 'Эйдолоны VI', TAG.none);
        else if (it.left) this.supplyTag(x + 3, ty, 'Доступно: ' + it.left + '/' + it.limit, TAG.ok, true);
        else this.supplyTag(x + 3, ty, 'Достигнут лимит', TAG.none);
        this.supplyTag(x + 3, ty + 13, '⟳ ' + leftText(this.game.supplyRefresh() - this.game.now()), TAG.dark);
      }
      if (it.block) { c.fillStyle = 'rgba(4,6,20,0.45)'; c.fillRect(x, y + 28, w, h - 28); }
    },

    openSupply(sec, pick) {
      const ui = this, g = this.game;
      const scr = this.push({
        full: true, sec: Math.max(0, SECTIONS.findIndex(x => x.id === (sec || 'shop'))), tab: 0, sel: 0, fsel: 0, fsc: { top: 0 }, psel: 0, csel: 0,
        list() { return g.supplyList(TABS[this.tab][0]); },
        outfits() { return Object.keys(H.OUTFITS); },
        setSec(i) { if (i === this.sec) return; this.sec = i; ui.sfx('select'); },
        setTab(i) { if (i === this.tab) return; this.tab = i; this.sel = 0; ui.sfx('select'); },
        draw(c) {
          const s = g.state, secId = SECTIONS[this.sec].id;
          ui.fullBg(c, false);
          const side = c.createLinearGradient(0, 0, 160, 0);
          side.addColorStop(0, 'rgba(2,3,14,0.85)'); side.addColorStop(1, 'rgba(2,3,14,0.35)');
          c.fillStyle = side; c.fillRect(0, 0, 160, HGT);
          ui.plate(12, 10, 'Снабжение');
          ui.closeBtn(W - 32, 10, () => this.key('back'));
          SECTIONS.forEach((sc, i) => {
            const y = 70 + i * 52, on = i === this.sec;
            if (on) { const gr = c.createLinearGradient(8, 0, 158, 0); gr.addColorStop(0, 'rgba(242,220,154,0.3)'); gr.addColorStop(1, 'rgba(242,220,154,0)'); c.fillStyle = gr; c.fillRect(8, y - 6, 150, 40); c.fillStyle = C.brassHi; c.fillRect(8, y - 6, 2, 40); }
            c.fillStyle = on ? 'rgba(242,220,154,0.25)' : 'rgba(10,12,40,0.6)'; c.beginPath(); c.arc(32, y + 14, 16, 0, Math.PI * 2); c.fill();
            c.strokeStyle = on ? C.brassHi : 'rgba(154,166,208,0.5)'; c.lineWidth = 1; c.stroke();
            G.menuIcon(c, sc.icon, 21, y + 3, 22, on ? '#fff0c0' : '#c8cce4');
            const ls = [11, 10, 9].find(sz => ui.measure(sc.label, sz, on) <= 102) || 9;
            ui.text(sc.label, 54, y + 8 + (11 - ls) / 2, { size: ls, bold: on, col: on ? C.gold : C.cream });
            ui.hit(8, y - 6, 150, 40, () => this.setSec(i));
          });
          for (let y = 70 + SECTIONS.length * 52 - 10; y < HGT - 40; y += 7) { c.fillStyle = 'rgba(106,83,40,0.3)'; c.fillRect(30, y, 4, 2); }
          if (secId === 'shop') this.drawShop(c, s);
          else if (secId === 'fashion') this.drawFashion(c, s);
          else if (secId === 'pass') ui.drawPassSupply(c, this);
          else if (secId === 'contracts') ui.drawContracts(c, this);
          else ui.drawPetSupply(c, this);
        },
        drawShop(c, s) {
          const cur = TABS[this.tab][0], list = this.list();
          ui.supplyPill(W - 154, 10, cur, s[cur]);
          let tx = 170;
          TABS.forEach(([id, label], i) => {
            const on = i === this.tab, w = Math.round(ui.measure(label, 10, on) + 26);
            c.fillStyle = '#000'; c.fillRect(tx - 1, 39, w + 2, 24);
            c.fillStyle = on ? '#efe6cc' : 'rgba(16,20,52,0.9)'; c.fillRect(tx, 40, w, 22);
            if (!on) { c.fillStyle = 'rgba(170,190,255,0.25)'; c.fillRect(tx, 40, w, 1); }
            G.itemIcon(c, id, tx + 3, 43, 16);
            ui.text(label, tx + 21, 46, { size: 10, bold: on, col: on ? '#20140c' : C.cream, shadow: !on });
            ui.hit(tx, 40, w, 22, () => this.setTab(i));
            tx += w + 4;
          });
          ui.keycap(tx + 4, 45, 'Q/E');
          if (this.sel >= list.length) this.sel = list.length - 1;
          list.forEach((it, i) => {
            const x = GRID.x + (i % GRID.cols) * (GRID.w + GRID.gap), y = GRID.y + Math.floor(i / GRID.cols) * (GRID.h + GRID.row);
            ui.supplyCard(c, it, x, y, i === this.sel, s[cur]);
            ui.hit(x, y, GRID.w, GRID.h, () => { if (this.sel === i) this.buy(); else { this.sel = i; ui.sfx('select'); } });
          });
          const it = list[this.sel];
          if (it) this.drawInfo(c, s, it);
          ui.hints([['←↑↓→', 'Товар'], ['Q/E', 'Валюта'], ['Tab', 'Раздел'], ['Enter', 'Купить'], ['Esc', 'Назад']], 170, HGT - 18);
        },
        drawInfo(c, s, it) {
          const x = 166, y = 352, w = 458, h = 102;
          ui.win(x, y, w, h, { alpha: 0.88 });
          ui.text(it.per > 1 ? it.name + ' ×' + fmt(it.per) : it.name, x + 14, y + 10, { size: 13, bold: true, serif: true, col: C.gold });
          ui.text('★'.repeat(it.rar), x + 14, y + 28, { size: 10, col: G.RARITY[it.rar] });
          const own = it.kind === 'item' ? 'В инвентаре: ' + fmt(s.inv.items[it.ref] || 0)
            : it.kind === 'credits' ? 'Кредитов: ' + fmt(s.credits)
            : it.kind === 'cone' ? 'В инвентаре: ' + s.inv.cones.filter(x2 => x2.id === it.ref).length
            : s.roster[it.ref] ? 'Эйдолон ' + s.roster[it.ref].eid + ' из 6' : 'Ещё нет в экипаже';
          ui.text(own, x + 80, y + 29, { size: 10, col: C.sub });
          ui.wrap(it.text, 280, 10).slice(0, 4).forEach((l, i) => ui.text(l, x + 14, y + 46 + i * 12, { size: 10, col: '#c8d0f0' }));
          const rx = x + w - 14, left = g.supplyRefresh() - g.now();
          ui.text(it.limit ? (it.left ? 'Можно купить: ' + it.left + ' из ' + it.limit : 'Лимит исчерпан') : 'Без ограничений', rx, y + 12, { size: 11, bold: true, align: 'right', col: it.limit && !it.left ? C.bad : C.cream });
          if (it.limit) ui.text('Обновление через ' + clock(left), rx, y + 28, { size: 10, align: 'right', col: C.sub });
          if (it.kind === 'char') ui.text('Персонажи меняются каждый час', rx, y + 42, { size: 9, align: 'right', col: C.dim });
          const can = g.supplyMax(it) > 0;
          ui.button(rx - 118, y + h - 34, 118, 24, it.block === 'max' ? 'Все эйдолоны' : it.block ? 'Распродано' : 'Купить', () => this.buy(), { size: 11, active: can, disabled: !can });
        },
        buy() {
          const it = this.list()[this.sel];
          if (!it) return;
          if (it.block === 'max') { ui.sfx('deny'); ui.toast(it.name + ': все эйдолоны уже открыты.'); return; }
          if (it.block) { ui.sfx('deny'); ui.toast('Лимит исчерпан. Обновление через ' + leftText(g.supplyRefresh() - g.now()) + '.'); return; }
          if (g.state[it.cur] < it.price) { ui.sfx('deny'); ui.toast('Не хватает ' + CUR_NAME[it.cur] + '.'); return; }
          ui.openSupplyBuy(it.id);
        },
        drawFashion(c, s) {
          const ids = this.outfits();
          if (this.fsel >= ids.length) this.fsel = ids.length - 1;
          ui.supplyPill(W - 154, 10, 'jade', s.jade);
          const tabW = Math.round(ui.measure('Витрина моды', 11, true) + 28);
          c.fillStyle = '#000'; c.fillRect(169, 39, tabW + 2, 24);
          c.fillStyle = '#efe6cc'; c.fillRect(170, 40, tabW, 22);
          ui.text('Витрина моды', 170 + tabW / 2, 45, { size: 11, bold: true, align: 'center', col: '#20140c', shadow: false });
          const allX = 170 + tabW + 8, allW = Math.round(ui.measure('Все наряды', 11) + 34);
          ui.button(allX, 40, allW, 22, 'Все наряды', () => ui.openOutfitGrid(this), { size: 11, icon: 'outfit' });
          ui.keycap(allX + allW + 4, 45, 'F');
          const id = ids[this.fsel], o = H.OUTFITS[id], look = H.outfitLook(id, g.state.gender), ch = H.CHARS[o.char];
          if (o.cuts) {
            const cutX = allX + allW + 26, cutW = Math.round(ui.measure('Катсцены', 11) + 34);
            ui.button(cutX, 40, cutW, 22, 'Катсцены', () => ui.openOutfitCuts(id), { size: 11, icon: 'warp' });
            ui.keycap(cutX + cutW + 4, 45, 'V');
          }
          const { x, y, w, h } = { x: SHOW.x, y: 70, w: SHOW.w, h: 384 };
          c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, w + 4, h + 4);
          c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
          c.imageSmoothingEnabled = false;
          c.drawImage(showcase(id), x, y - 14, SHOW.w, SHOW.h);
          ui.platform(c, x + w / 2 + 34, y + h - 24, 80);
          G.drawFigure(c, look, x + w / 2 + 34, y + h - 20, 3);
          c.restore();
          c.strokeStyle = C.brass; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2); c.lineWidth = 1;
          const tag = ch.name + ': ' + H.PATHS[ch.path].name;
          c.fillStyle = 'rgba(30,20,40,0.72)'; c.fillRect(x + 8, y + 10, ui.measure(tag, 10, true) + 12, 15);
          ui.text(tag, x + 14, y + 12, { size: 10, bold: true, col: '#ffcf80' });
          const ts = [18, 16, 14].find(sz => ui.measure(o.name, sz, true, true) <= SHOW.w - 32) || 14;
          c.fillStyle = 'rgba(30,20,40,0.72)'; c.fillRect(x + 8, y + 27, ui.measure(o.name, ts, true, true) + 16, 26);
          ui.text(o.name, x + 16, y + 31 + (18 - ts) / 2, { size: ts, bold: true, serif: true, col: '#fff8f0' });
          c.fillStyle = 'rgba(30,20,40,0.72)'; c.fillRect(x + 8, y + 55, ui.measure(o.kind + ' · ' + '★'.repeat(o.rarity), 10) + 12, 15);
          ui.text(o.kind + ' · ' + '★'.repeat(o.rarity), x + 14, y + 57, { size: 10, col: G.RARITY[o.rarity] });
          const perk = H.OUTFIT_TIER[o.rarity].perk;
          c.fillStyle = 'rgba(30,20,40,0.72)'; c.fillRect(x + 8, y + 72, ui.measure(perk, 9) + 12, 14);
          ui.text(perk, x + 14, y + 74, { size: 9, col: '#e8dcc0' });
          const rx = 480, rw = 144, cardH = 102, vis = 2, bar = ids.length > vis, first = ui.listTop(this.fsc, this.fsel, ids.length, vis);
          const cw = bar ? rw - 14 : rw;
          ui.wheelZone(rx, 70, rw, vis * (cardH + 6), d => { this.fsc.top += d; });
          ids.slice(first, first + vis).forEach((oid, j) => {
            const i = first + j, cy = 70 + j * (cardH + 6), on = i === this.fsel, O = H.OUTFITS[oid], own = g.ownsOutfit(oid);
            if (on) { c.fillStyle = C.brassHi; archPath(c, rx - 2, cy - 2, cw + 4, cardH + 4); c.fill(); }
            c.save(); archPath(c, rx, cy, cw, cardH); c.clip();
            const gr = c.createLinearGradient(0, cy, 0, cy + cardH), [g0, g1] = G.RARITY_BG[O.rarity];
            gr.addColorStop(0, g0); gr.addColorStop(1, g1);
            c.fillStyle = gr; c.fillRect(rx, cy, cw, cardH);
            G.drawPortrait(c, H.outfitLook(oid, g.state.gender), rx + (cw - 76) / 2, cy + 4, 76);
            c.fillStyle = 'rgba(20,12,4,0.6)'; c.fillRect(rx, cy + cardH - 46, cw, 20);
            const ns = [11, 10, 9].find(sz => ui.measure(O.name, sz, true) <= cw - 6) || 9;
            ui.text(O.name, rx + cw / 2, cy + cardH - 43 + (11 - ns) / 2, { size: ns, bold: true, align: 'center' });
            c.fillStyle = '#f2ead6'; c.fillRect(rx, cy + cardH - 26, cw, 26);
            if (own) ui.text('В коллекции', rx + cw / 2, cy + cardH - 20, { size: 12, bold: true, align: 'center', col: '#3a7a3a', shadow: false });
            else { const pw = ui.measure(fmt(O.price), 13, true) + 20; G.itemIcon(c, 'jade', rx + (cw - pw) / 2, cy + cardH - 21, 16); ui.text(fmt(O.price), rx + (cw - pw) / 2 + 20, cy + cardH - 20, { size: 13, bold: true, col: '#c84a1a', shadow: false }); }
            c.restore();
            ui.hit(rx, cy, cw, cardH, () => { if (this.fsel === i) this.fashionAct(); else { this.fsel = i; ui.sfx('select'); } });
          });
          if (bar) {
            ui.scrollBar(rx + rw - 10, 70, vis * (cardH + 6) - 6, this.fsc, ids.length, vis);
            ui.text((this.fsel + 1) + ' / ' + ids.length, rx + cw / 2, 70 + vis * (cardH + 6) - 2, { size: 9, align: 'center', col: C.sub });
          }
          const own = g.ownsOutfit(id), worn = g.outfitOf(o.char) === id;
          ui.win(rx - 4, 294, rw + 8, 120, { alpha: 0.88 });
          ui.wrap(g.fill(o.text), rw - 12, 10).slice(0, 9).forEach((l, i) => ui.text(l, rx + 4, 302 + i * 12, { size: 10, col: '#c8d0f0' }));
          const label = !own ? 'Купить' : worn ? 'Надето' : !s.roster[o.char] ? 'В коллекции' : 'Надеть';
          ui.button(rx - 4, 420, rw + 8, 28, label, () => this.fashionAct(), { size: 12, bold: true, active: !own || (!worn && !!s.roster[o.char]), disabled: own && (worn || !s.roster[o.char]) });
          ui.hints([['↑↓', 'Наряд'], ['F', 'Все']].concat(o.cuts ? [['V', 'Катсцены']] : [], [['Tab', 'Раздел'], ['Enter', !own ? 'Купить' : 'Надеть'], ['Esc', 'Назад']]), 170, HGT - 18);
        },
        fashionAct() {
          const id = this.outfits()[this.fsel], o = H.OUTFITS[id];
          if (!g.ownsOutfit(id)) { if (g.state.jade < o.price) { ui.sfx('deny'); ui.toast('Не хватает звёздного нефрита: нужно ' + fmt(o.price) + '.'); return; } ui.openOutfitBuy(id); return; }
          if (!g.state.roster[o.char]) { ui.sfx('deny'); ui.toast('Наряд в коллекции. Наденьте его, когда ' + H.CHARS[o.char].name + ' будет в экипаже.'); return; }
          if (g.outfitOf(o.char) === id) { ui.sfx('deny'); ui.toast('Этот наряд уже надет.'); return; }
          g.wearOutfit(o.char, id); ui.sfx('confirm'); ui.toast(H.CHARS[o.char].name + ': надет наряд «' + o.name + '».');
        },
        key(k, code) {
          if (code === 'Tab') { this.setSec((this.sec + 1) % SECTIONS.length); return; }
          if (k === 'back') { ui.pop(); return; }
          if (SECTIONS[this.sec].id === 'pets') { ui.petSupplyKey(this, k, code); return; }
          if (SECTIONS[this.sec].id === 'pass') { ui.passSupplyKey(this, k, code); return; }
          if (SECTIONS[this.sec].id === 'contracts') { ui.contractsKey(this, k, code); return; }
          if (SECTIONS[this.sec].id === 'fashion') {
            const n = this.outfits().length;
            if (k === 'up' || k === 'down') { this.fsel = (this.fsel + (k === 'up' ? n - 1 : 1)) % n; ui.sfx('select'); }
            if (code === 'KeyF') ui.openOutfitGrid(this);
            if (code === 'KeyV') { const oid = this.outfits()[this.fsel]; if (H.OUTFITS[oid].cuts) ui.openOutfitCuts(oid); else ui.sfx('deny'); }
            if (k === 'ok') this.fashionAct();
            return;
          }
          if (code === 'KeyQ' || code === 'KeyE') { this.setTab((this.tab + 1) % TABS.length); return; }
          const n = this.list().length, cols = GRID.cols;
          if (k === 'left' && this.sel > 0) { this.sel--; ui.sfx('select'); }
          if (k === 'right' && this.sel < n - 1) { this.sel++; ui.sfx('select'); }
          if (k === 'up' && this.sel >= cols) { this.sel -= cols; ui.sfx('select'); }
          if (k === 'down' && this.sel + cols < n) { this.sel += cols; ui.sfx('select'); }
          if (k === 'down' && this.sel + cols >= n && Math.floor(this.sel / cols) < Math.floor((n - 1) / cols)) { this.sel = n - 1; ui.sfx('select'); }
          if (k === 'ok') this.buy();
        }
      });
      if (pick && H.OUTFITS[pick]) scr.fsel = Math.max(0, Object.keys(H.OUTFITS).indexOf(pick));
      if (!g.state.shop.intro) this.openSupplyIntro();
      else this.outfitBackNotice();
      return scr;
    },

    outfitCutSteps(id) {
      const set = H.OUTFIT_CUTS[id] || {}, steps = [];
      if (set.ult) steps.push(['ult', null, 'Абсолютная техника']);
      if (set.skill) steps.push(['skill', null, 'Навык']);
      for (const f of Object.keys(set.fusions || {})) steps.push(['fus', f, 'Слияние']);
      if (set.warp) steps.push(['warp', null, 'Прыжок']);
      if (set.eidolon && H.Eidolons) steps.push(['eid', null, 'Картина эйдолонов']);
      return steps;
    },

    outfitCutShow(id, step) {
      const ui = this, g = this.game, o = H.OUTFITS[id], kit = H.CHARS[o.char], [kind, sub] = step;
      const unit = k => ({ side: 'ally', id: k, charId: k, kit: H.CHARS[k], name: k.startsWith('trail') ? g.state.name : H.CHARS[k].name, elem: H.CHARS[k].elem, path: H.CHARS[k].path });
      const foes = target => {
        if (target === 'allies' || target === 'self') return [];
        const list = CUT_FOES.map((e, i) => ({ u: { data: H.ENEMIES[e] }, x: 135 + i * 42, y: 145, s: 52 }));
        return target === 'single' ? list.slice(1, 2) : list;
      };
      const me = unit(o.char);
      if (kind === 'eid') {
        const E = H.Eidolons, sc = E.sceneOf(id);
        return {
          t: 0, done: false, fading: false,
          tick(dt) { this.t += dt; if (this.t >= 4.5) this.done = true; },
          skip() { this.done = true; },
          draw(c) {
            E.scene(ui, c, o.char, 6, null, id);
            const cap = kit.name + ' · ' + sc.title, w = Math.max(250, Math.round(ui.measure(cap, 13, true, true) + 40)), x = Math.round(W / 2 - w / 2), y = HGT - 74;
            ui.win(x, y, w, 40, { alpha: 0.82 });
            ui.text(cap, W / 2, y + 7, { align: 'center', size: 13, bold: true, serif: true, col: C.gold });
            ui.text('Эйдолоны 6 / 6 · ' + E.stageName(6), W / 2, y + 24, { align: 'center', size: 10, col: C.sub });
            ui.hints([['Esc', 'Дальше']], W - 12, 12, { align: 'right' });
            ui.hit(0, 0, W, HGT, () => this.skip());
          }
        };
      }
      if (kind === 'ult') return new H.Ults.Show(ui, me, { foes: foes(kit.ult.target), allies: [me], bg: 'station', outfit: id });
      if (kind === 'skill') return new H.SkillShow(ui, me, { foes: foes(kit.skill.target), bg: 'station', outfit: id });
      if (kind === 'fus') { const mem = H.FUSIONS[sub].members.map(unit); return new H.Fusions.Show(ui, mem, { id: sub, foes: foes(H.FUSIONS[sub].target), allies: mem, bg: 'station', outfit: id }); }
      const r = { id: o.char, rar: kit.rarity, kind: 'char', outfit: id }, WI = H.WarpIntro, cues = WI.cues(r, g), len = WI.length(o.char, g, id);
      return {
        t: 0, cue: 0, done: false, fading: false,
        tick(dt) { this.t += dt; while (this.cue < cues.length && cues[this.cue][0] <= this.t) ui.sfx(cues[this.cue++][1]); if (this.t >= len + 0.4) this.done = true; },
        skip() { this.done = true; },
        draw(c) {
          c.save(); c.imageSmoothingEnabled = false;
          c.drawImage(WI.render(g, r, Math.min(this.t, len), false), 0, 0, W, HGT);
          c.restore();
          WI.overlay(ui, c, r, this.t, g);
          const said = WI.line(o.char, g, id), a = cl((this.t - WI.SIGN - 0.6) / 0.3);
          if (said && a > 0) { c.save(); c.globalAlpha = a; ui.text('«' + said + '»', W / 2, HGT - 40, { align: 'center', size: 13, col: C.cream }); c.restore(); }
          ui.hints([['Esc', 'Пропустить']], W - 12, 20, { align: 'right' });
          ui.hit(0, 0, W, HGT, () => this.skip());
        }
      };
    },

    openOutfitCuts(id) {
      const ui = this, o = H.OUTFITS[id], steps = this.outfitCutSteps(id);
      if (!steps.length) { this.sfx('deny'); return null; }
      const scr = {
        full: true, i: 0, show: null,
        begin(i) { this.i = i; this.show = ui.outfitCutShow(id, steps[i]); },
        next() { if (this.i < steps.length - 1) this.begin(this.i + 1); else { ui.pop(); ui.sfx('confirm'); } },
        tick(dt) { if (!this.show) return; this.show.tick(dt); if (this.show.done) this.next(); },
        draw(c) {
          if (!this.show) return;
          this.show.draw(c);
          const label = 'Катсцены «' + o.name + '» · ' + steps[this.i][2] + ' · ' + (this.i + 1) + ' / ' + steps.length;
          c.fillStyle = 'rgba(8,6,12,0.7)'; c.fillRect(W / 2 - ui.measure(label, 10) / 2 - 8, HGT - 16, ui.measure(label, 10) + 16, 14);
          ui.text(label, W / 2, HGT - 15, { align: 'center', size: 10, col: C.sub });
        },
        key(k, code) {
          if (!this.show) return;
          if (code === 'Backspace') { ui.pop(); ui.sfx('cancel'); return; }
          if (k === 'ok' || k === 'back') this.next();
        }
      };
      scr.begin(0);
      this.push(scr);
      return scr;
    },

    outfitBackNotice() {
      const ui = this, sh = this.game.state.shop, back = sh.outfitBack;
      if (!back) return false;
      sh.outfitBack = null;
      this.push({
        draw(c) {
          const lines = ui.wrap('Класс облика теперь зависит от того, что облик меняет. Облик 4★ меняет только героя: в бою, в мире и в меню, и стоит ' + fmt(H.OUTFIT_TIER[4].price) + ' нефрита. Облик 5★ ещё и показывает свои катсцены абсолютной техники, Навыка, Слияний и прыжка и свою картину эйдолонов. Ваши облики подешевели, поэтому разница возвращена: ' + fmt(back) + ' звёздного нефрита.', 400, 11);
          const h = 80 + lines.length * 15, x = W / 2 - 220, y = HGT / 2 - h / 2;
          c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, W, HGT);
          ui.win(x, y, 440, h, { title: 'Патч 1.6: Облики 4★ и 5★' });
          G.itemIcon(c, 'jade', x + 16, y + 24, 24);
          lines.forEach((l, i) => ui.text(l, x + 50, y + 24 + i * 15, { size: 11 }));
          ui.hints([['Enter', 'Понятно']], W / 2, y + h - 22, { align: 'center' });
          ui.hit(0, 0, W, HGT, () => this.key('ok'));
        },
        key(kk) { if (kk === 'ok' || kk === 'back') { ui.screens.pop(); ui.sfx('confirm'); } }
      });
      return true;
    },

    openSupplyIntro() {
      const ui = this, g = this.game, back = g.supplyBack();
      g.state.shop.intro = true;
      const lines = [
        'Звёздный свет и пепел остаются после прыжков. Повторный персонаж и световой конус 4★ или 5★ дают неугасаемый звёздный свет, конус 3★ даёт 20 неугасаемого пепла.',
        'Ассортимент с лимитом обновляется каждый час. Каждый час меняется и пара персонажей 4★ за звёздный свет.'
      ];
      this.push({
        draw(c) {
          const x = W / 2 - 200, y = 120, w = 400, h = back ? 240 : 196;
          ui.win(x, y, w, h, { title: 'Снабжение' });
          G.itemIcon(c, 'starlight', x + 16, y + 20, 32); G.itemIcon(c, 'embers', x + 52, y + 20, 32);
          ui.text('Неугасаемый звёздный свет', x + 94, y + 20, { size: 12, bold: true, col: C.gold });
          ui.text('Неугасаемый пепел', x + 94, y + 36, { size: 12, bold: true, col: '#c8c8e8' });
          let ty = y + 64;
          for (const p of lines) { for (const l of ui.wrap(p, w - 32, 11)) { ui.text(l, x + 16, ty, { size: 11 }); ty += 14; } ty += 6; }
          if (back) {
            ui.text('За прошлые прыжки начислено:', x + 16, ty, { size: 11, bold: true, col: C.ok });
            let mx = x + 16;
            if (back.starlight) mx += ui.money(mx, ty + 18, 'starlight', back.starlight) + 14;
            if (back.embers) ui.money(mx, ty + 18, 'embers', back.embers);
          }
          ui.button(W / 2 - 60, y + h - 34, 120, 24, 'Понятно', () => ui.pop(), { active: true, size: 11 });
        },
        key(k) { if (k === 'ok' || k === 'back') ui.pop(); }
      });
    },

    openSupplyBuy(id) {
      const ui = this, g = this.game;
      this.push({
        n: 1,
        item() { return g.supplyFind(id); },
        setN(v) { const max = Math.max(1, g.supplyMax(this.item())); const to = Math.max(1, Math.min(max, v)); if (to !== this.n) { this.n = to; ui.sfx('select'); } },
        draw(c) {
          const it = this.item(), max = g.supplyMax(it), x = W / 2 - 170, y = 110, w = 340, h = max > 1 ? 236 : 202;
          if (this.n > Math.max(1, max)) this.n = Math.max(1, max);
          ui.win(x, y, w, h, { title: 'Покупка' });
          G.rarityCell(c, x + 16, y + 20, 72, 80, it.rar);
          ui.supplyArt(c, it, x + 52, y + 26);
          const name = it.per > 1 ? it.name + ' ×' + fmt(it.per) : it.name;
          ui.wrap(name, w - 120, 13).slice(0, 2).forEach((l, i) => ui.text(l, x + 100, y + 22 + i * 16, { size: 13, bold: true, serif: true, col: C.gold }));
          ui.text('★'.repeat(it.rar), x + 100, y + 58, { size: 10, col: G.RARITY[it.rar] });
          ui.wrap(it.text, w - 120, 10).slice(0, 3).forEach((l, i) => ui.text(l, x + 100, y + 74 + i * 12, { size: 10, col: C.sub }));
          let ry = y + 116;
          if (max > 1) {
            ui.text('Количество', x + 16, ry + 4, { size: 11, col: C.sub });
            ui.button(x + 110, ry, 26, 22, '◄', () => this.setN(this.n - 1), { size: 10, disabled: this.n <= 1 });
            c.fillStyle = '#05060e'; c.fillRect(x + 140, ry, 60, 22); c.strokeStyle = C.brassDk; c.strokeRect(x + 140.5, ry + 0.5, 59, 21);
            ui.text(String(this.n), x + 170, ry + 4, { size: 13, bold: true, align: 'center' });
            ui.button(x + 204, ry, 26, 22, '►', () => this.setN(this.n + 1), { size: 10, disabled: this.n >= max });
            ui.button(x + 236, ry, 52, 22, 'Макс.', () => this.setN(max), { size: 10, disabled: this.n >= max });
            ry += 34;
          }
          const cost = it.price * this.n, left = g.state[it.cur] - cost;
          c.fillStyle = 'rgba(242,220,154,0.3)'; c.fillRect(x + 14, ry - 6, w - 28, 1);
          ui.text('Итого', x + 16, ry + 4, { size: 11, col: C.sub });
          ui.money(x + 110, ry + 4, it.cur, cost, { col: C.gold });
          ui.text('После покупки останется ' + fmt(left), x + w - 16, ry + 6, { size: 10, align: 'right', col: C.dim });
          ui.button(x + 40, y + h - 58, 120, 26, 'Купить', () => { this.sel = 0; this.key('ok'); }, { active: this.sel === 0, size: 12 });
          ui.button(x + w - 160, y + h - 58, 120, 26, 'Отмена', () => { this.sel = 1; this.key('ok'); }, { active: this.sel === 1, size: 12 });
          ui.hints(max > 1 ? [['←→', '±1'], ['↑↓', '±10'], ['Enter', 'Купить'], ['Esc', 'Отмена']] : [['Enter', 'Купить'], ['Esc', 'Отмена']], W / 2, y + h - 22, { align: 'center' });
        },
        key(k, code) {
          if (k === 'back') { ui.pop(); return; }
          if (k === 'left') { this.setN(this.n - 1); return; }
          if (k === 'right') { this.setN(this.n + 1); return; }
          if (k === 'up') { this.setN(this.n + 10); return; }
          if (k === 'down') { this.setN(this.n - 10); return; }
          if (code === 'Tab') { this.sel = 1 - this.sel; ui.sfx('select'); return; }
          if (k !== 'ok') return;
          if (this.sel === 1) { ui.pop(); return; }
          const r = g.supplyBuy(id, this.n);
          if (!r) { ui.sfx('deny'); ui.toast('Покупка не прошла.'); return; }
          ui.screens.pop();
          ui.sfx('chest');
          ui.toast(ui.supplyDone(r));
        }
      });
    },

    supplyDone(r) {
      const it = r.x;
      if (it.kind === 'item') return 'Получено: ' + it.name + ' ×' + fmt(r.n * it.per) + '.';
      if (it.kind === 'credits') return 'Получено: ' + fmt(r.n * it.per) + ' кредитов.';
      if (it.kind === 'cone') return 'Получен световой конус «' + it.name + '»' + (r.sup > 1 ? ', наложение S' + r.sup : '') + '.';
      if (r.res === 'new') return it.name + ' присоединяется к экипажу!';
      return it.name + ': эйдолон +1' + (r.glow ? ', +' + r.glow + ' ' + GLOW_NAME.starlight[1] : '') + '.';
    },

    openOutfitGrid(sup) {
      const ui = this, g = this.game, ids = Object.keys(H.OUTFITS);
      const { x, y, w, h, cols, rows, cw, ch, gap } = WARDROBE;
      this.push({
        sel: sup.fsel, sc: { top: 0 },
        pick(i) { sup.fsel = i; ui.pop(); },
        draw(c) {
          ui.win(x, y, w, h, { title: 'Все наряды', alpha: 0.96 });
          ui.closeBtn(x + w - 30, y + 8, () => ui.pop());
          const owned = ids.filter(id => g.ownsOutfit(id)).length;
          ui.text('В коллекции: ' + owned + ' из ' + ids.length, x + 18, y + 16, { size: 11, bold: true, col: C.gold });
          const n = Math.ceil(ids.length / cols), bar = n > rows, top = ui.listTop(this.sc, Math.floor(this.sel / cols), n, rows);
          const gx = x + 18, gy = y + 40;
          ui.wheelZone(gx, gy, cols * (cw + gap), rows * (ch + gap), d => { this.sc.top += d; });
          ids.slice(top * cols, (top + rows) * cols).forEach((id, j) => {
            const i = top * cols + j, cx = gx + (j % cols) * (cw + gap), cy = gy + Math.floor(j / cols) * (ch + gap);
            ui.wardrobeCard(c, id, cx, cy, i === this.sel, i === sup.fsel);
            ui.hit(cx, cy, cw, ch, () => { if (this.sel === i) this.pick(i); else { this.sel = i; ui.sfx('select'); } });
          });
          if (bar) ui.scrollBar(x + w - 24, gy, rows * (ch + gap) - gap, this.sc, n, rows);
          ui.hints([['←↑↓→', 'Наряд'], ['Enter', 'Выбрать'], ['Esc', 'Назад']], x + w / 2, y + h - 22, { align: 'center' });
        },
        key(k, code) {
          const n = ids.length;
          if (k === 'back' || code === 'KeyF') { ui.pop(); return; }
          if (k === 'ok') { this.pick(this.sel); return; }
          const to = k === 'left' ? this.sel - 1 : k === 'right' ? this.sel + 1 : k === 'up' ? this.sel - cols : k === 'down' ? Math.min(n - 1, this.sel + cols) : this.sel;
          if (to !== this.sel && to >= 0 && to < n && !(k === 'down' && Math.floor(to / cols) === Math.floor(this.sel / cols))) { this.sel = to; ui.sfx('select'); }
        }
      });
    },

    wardrobeCard(c, id, x, y, on, shown) {
      const { cw: w, ch: h } = WARDROBE, o = H.OUTFITS[id], g = this.game, own = g.ownsOutfit(id), foot = 24, strip = 26;
      if (on) { c.fillStyle = C.brassHi; c.fillRect(x - 2, y - 2, w + 4, h + 4); }
      c.fillStyle = '#000'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
      G.rarityCell(c, x, y, w, h - foot - strip, o.rarity);
      G.drawPortrait(c, H.outfitLook(id, this.game.state.gender), x + (w - 84) / 2, y + 6, 84);
      this.supplyTag(x + 3, y + 3, H.CHARS[o.char].name, TAG.dark);
      if (shown) this.supplyTag(x + w - this.measure('В витрине', 9, true) - 11, y + h - foot - strip - 15, 'В витрине', TAG.ok, true);
      c.fillStyle = 'rgba(14,10,30,0.92)'; c.fillRect(x, y + h - foot - strip, w, strip);
      const lines = this.wrap(o.name, w - 8, 9).slice(0, 2);
      lines.forEach((l, i) => this.text(l, x + w / 2, y + h - foot - strip + (lines.length > 1 ? 2 : 7) + i * 11, { size: 9, bold: true, align: 'center' }));
      c.fillStyle = '#f2ead6'; c.fillRect(x, y + h - foot, w, foot);
      if (own) this.text(g.outfitOf(o.char) === id ? 'Надето' : 'В коллекции', x + w / 2, y + h - foot + 6, { size: 11, bold: true, align: 'center', col: '#3a7a3a', shadow: false });
      else { const pw = this.measure(fmt(o.price), 12, true) + 20; G.itemIcon(c, 'jade', x + (w - pw) / 2, y + h - foot + 4, 16); this.text(fmt(o.price), x + (w - pw) / 2 + 20, y + h - foot + 5, { size: 12, bold: true, col: '#c84a1a', shadow: false }); }
    },

    openOutfitBuy(id) {
      const ui = this, g = this.game, o = H.OUTFITS[id];
      this.push({
        done: false,
        draw(c) {
          const x = W / 2 - 180, y = 150, w = 360, h = 150;
          ui.win(x, y, w, h, { title: this.done ? 'Наряд в коллекции' : 'Покупка наряда' });
          G.drawPortrait(c, H.outfitLook(id, g.state.gender), x + 16, y + 20, 64);
          if (this.done) {
            ui.text('«' + o.name + '» теперь в коллекции.', x + 92, y + 26, { size: 12, bold: true, col: C.gold });
            ui.wrap(g.state.roster[o.char] ? 'Надеть сейчас? Сменить наряд можно в любой момент: Персонажи → Наряды.' : 'Наряд можно надеть, когда ' + H.CHARS[o.char].name + ' будет в экипаже.', w - 108, 11).forEach((l, i) => ui.text(l, x + 92, y + 48 + i * 14, { size: 11, col: C.sub }));
          } else {
            ui.text('Купить «' + o.name + '»?', x + 92, y + 26, { size: 12, bold: true, col: C.gold });
            ui.text('Цена:', x + 92, y + 50, { size: 11, col: C.sub });
            ui.money(x + 130, y + 49, 'jade', o.price, { col: C.gold });
            ui.text('Останется ' + fmt(g.state.jade - o.price) + ' нефрита', x + 92, y + 70, { size: 10, col: C.dim });
            ui.wrap('★'.repeat(o.rarity) + ' ' + H.OUTFIT_TIER[o.rarity].perk + '.', w - 108, 10).slice(0, 2).forEach((l, i) => ui.text(l, x + 92, y + 86 + i * 12, { size: 10, col: G.RARITY[o.rarity] }));
          }
          const two = !this.done || !!g.state.roster[o.char];
          const a = this.done ? 'Надеть' : 'Купить', b = this.done ? (two ? 'Позже' : 'Хорошо') : 'Отмена';
          if (two) ui.button(x + 30, y + h - 38, 130, 26, a, () => { this.sel = 0; this.key('ok'); }, { active: this.sel === 0, size: 12 });
          ui.button(two ? x + w - 160 : x + (w - 130) / 2, y + h - 38, 130, 26, b, () => { this.sel = 1; this.key('ok'); }, { active: this.sel === 1 || !two, size: 12 });
        },
        key(k) {
          const two = !this.done || !!g.state.roster[o.char];
          if ((k === 'left' || k === 'right') && two) { this.sel = 1 - this.sel; ui.sfx('select'); return; }
          if (k === 'back') { ui.pop(); return; }
          if (k !== 'ok') return;
          if (this.sel === 1 || !two) { ui.pop(); return; }
          if (!this.done) {
            if (!g.buyOutfit(id)) { ui.sfx('deny'); ui.toast('Не хватает звёздного нефрита.'); return; }
            ui.sfx('chest'); this.done = true; this.sel = 0; return;
          }
          g.wearOutfit(o.char, id); ui.sfx('confirm'); ui.toast(H.CHARS[o.char].name + ': надет наряд «' + o.name + '».');
          ui.screens.pop();
        }
      });
    },

    outfitList(k) { return [null].concat(this.game.outfitsOf(k)); },

    outfitSync(s, k) {
      if (s.outfitFor === k) return;
      s.outfitFor = k;
      s.outfitPick = Math.max(0, this.outfitList(k).indexOf(this.game.outfitOf(k)));
    },

    outfitPreview(s, k) {
      this.outfitSync(s, k);
      const id = this.outfitList(k)[s.outfitPick], kit = this.game.kitOf(k);
      return id ? H.outfitLook(id, this.game.state.gender) : k === 'trail' ? G.trailLook(this.game.state.gender) : H.CHARS[kit].look;
    },

    outfitState(k, id) {
      const g = this.game, worn = g.outfitOf(k);
      if (id ? worn === id : !worn) return 'worn';
      return !id || g.ownsOutfit(id) ? 'owned' : 'locked';
    },

    panelOutfits(s, c, px, py, pw, ph, k) {
      const g = this.game, list = this.outfitList(k);
      this.outfitSync(s, k);
      const id = list[s.outfitPick], o = id ? H.OUTFITS[id] : null, st = this.outfitState(k, id), kit = H.CHARS[g.kitOf(k)];
      const name = k === 'trail' ? g.state.name : kit.name;
      c.fillStyle = 'rgba(210,220,255,0.18)'; c.fillRect(px + 14, py + 10, pw - 28, 20);
      this.text('Костюмы', px + pw / 2, py + 13, { size: 12, bold: true, align: 'center' });
      const cw = 112, ch = 150, cx = px + (pw - cw) / 2, cy = py + 40;
      if (s.outfitFocus) { c.fillStyle = C.brassHi; archPath(c, cx - 2, cy - 2, cw + 4, ch + 4); c.fill(); }
      c.save(); archPath(c, cx, cy, cw, ch); c.clip();
      const gr = c.createLinearGradient(0, cy, 0, cy + ch);
      if (o) { gr.addColorStop(0, G.RARITY_BG[o.rarity][0]); gr.addColorStop(1, G.RARITY_BG[o.rarity][1]); } else { gr.addColorStop(0, '#2a3468'); gr.addColorStop(1, '#5a6aa8'); }
      c.fillStyle = gr; c.fillRect(cx, cy, cw, ch);
      G.drawPortrait(c, this.outfitPreview(s, k), cx + 4, cy + 22, 104);
      c.restore();
      c.strokeStyle = 'rgba(242,220,154,0.7)'; archPath(c, cx + 0.5, cy + 0.5, cw - 1, ch - 1); c.stroke();
      const tag = st === 'worn' ? ['Надето', C.brass, true] : st === 'owned' ? ['В коллекции', '#3a9a4a'] : ['Не получен', '#5a5a70'];
      const tw = this.measure(tag[0], 9, true) + 8;
      this.supplyTag(cx + (cw - tw) / 2, cy + ch - 18, tag[0], tag[1], tag[2]);
      if (list.length > 1) {
        for (const d of [-1, 1]) {
          const ax = d < 0 ? cx - 16 : cx + cw + 6, ay = cy + ch / 2;
          c.fillStyle = C.brassHi; c.beginPath(); c.moveTo(ax + (d < 0 ? 8 : 0), ay - 8); c.lineTo(ax + (d < 0 ? 0 : 8), ay); c.lineTo(ax + (d < 0 ? 8 : 0), ay + 8); c.fill();
          this.hit(ax - 4, ay - 12, 18, 24, () => this.outfitStep(s, k, d));
        }
        list.forEach((x, i) => { c.fillStyle = i === s.outfitPick ? C.brassHi : 'rgba(154,166,208,0.5)'; c.beginPath(); c.arc(px + pw / 2 + (i - (list.length - 1) / 2) * 10, cy + ch + 10, 2.5, 0, Math.PI * 2); c.fill(); });
      }
      this.hit(cx, cy, cw, ch, () => { s.outfitFocus = true; });
      let y = cy + ch + 22;
      this.wrap(o ? o.name : H.OUTFIT_BASE, pw - 20, 15).slice(0, 2).forEach(l => { this.text(l, px + pw / 2, y, { size: 15, bold: true, serif: true, align: 'center', col: C.gold }); y += 18; });
      c.fillStyle = 'rgba(242,220,154,0.5)'; c.fillRect(px + 16, y + 2, pw - 32, 1); this.diamond(px + pw / 2, y + 2.5, 3, C.brassHi, '#1a1208');
      this.text(name, px + pw / 2, y + 9, { size: 11, align: 'center', col: C.sub });
      y += 26;
      this.wrap(o ? '★'.repeat(o.rarity) + ' ' + o.kind + ' · ' + name + ' (' + H.PATHS[kit.path].name + ')' : 'Наряд по умолчанию', pw - 20, 10).slice(0, 2).forEach(l => { this.text(l, px + pw / 2, y, { size: 10, align: 'center', col: o ? G.RARITY[o.rarity] : C.dim }); y += 12; });
      y += 4;
      const note = o ? (st === 'locked' ? 'Продаётся в Снабжении, раздел «Магазин обликов», за ' + fmt(o.price) + ' звёздного нефрита.' + (o.giftNote ? ' Бесплатно ' + o.giftNote + '.' : '') : H.OUTFIT_TIER[o.rarity].perk + '. На характеристики не влияет.') : list.length > 1 ? 'Обычная одежда персонажа.' : 'Других нарядов у персонажа пока нет.';
      this.wrap(note, pw - 24, 10).slice(0, 4).forEach(l => { this.text(l, px + 12, y, { size: 10, col: '#c8d0f0' }); y += 12; });
      const label = st === 'worn' ? 'Надето' : st === 'owned' ? 'Надеть' : 'В Снабжение';
      this.button(px + 12, py + ph - 38, pw - 24, 24, label, () => this.outfitAct(s, k), { size: 11, icon: st === 'locked' ? 'shop' : 'outfit', active: st === 'worn' && list.length > 1, disabled: list.length < 2 });
    },

    outfitHints(s, k) {
      if (!s.outfitFocus) return [['Enter', 'К нарядам']];
      const st = this.outfitState(k, this.outfitList(k)[s.outfitPick]);
      return [['←→', 'Наряд'], ['Enter', st === 'locked' ? 'В Снабжение' : 'Надеть'], ['Esc', 'Назад']];
    },

    outfitStep(s, k, d) {
      const n = this.outfitList(k).length;
      if (n < 2) return;
      s.outfitPick = (s.outfitPick + d + n) % n;
      this.sfx('select');
    },

    outfitAct(s, k) {
      const g = this.game, id = this.outfitList(k)[s.outfitPick], st = this.outfitState(k, id);
      if (st === 'worn') { this.sfx('deny'); return; }
      if (st === 'locked') { this.openSupply('fashion', id); return; }
      g.wearOutfit(k, id);
      this.sfx('confirm');
      this.toast(this.shortName(k) + ': ' + (id ? 'надет наряд «' + H.OUTFITS[id].name + '»' : 'обычный наряд') + '.');
    },

    outfitKey(s, kk, code) {
      const k = s.k;
      if (code === 'KeyQ') { s.switchChar(-1); return; }
      if (code === 'KeyE') { s.switchChar(1); return; }
      if (kk === 'left' || kk === 'right') { this.outfitStep(s, k, kk === 'left' ? -1 : 1); return; }
      if (kk === 'ok') { this.outfitAct(s, k); return; }
      if (kk === 'back') { s.outfitFocus = false; this.sfx('cancel'); }
    }
  });

  Object.assign(H, { outfitShowcase: showcase, SUPPLY_SECTIONS: SECTIONS.map(x => x.id) });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
