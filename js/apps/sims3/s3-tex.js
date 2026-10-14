(function (S) {
  'use strict';
  const CELL = 64, SIZE = 1024, PAD = 1;

  function rnd(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function rgb(c, k) { k = k === undefined ? 1 : k; return 'rgb(' + Math.round(Math.min(255, c[0] * k)) + ',' + Math.round(Math.min(255, c[1] * k)) + ',' + Math.round(Math.min(255, c[2] * k)) + ')'; }
  function shade(h, k) { return rgb(hex(h), k); }

  class Atlas {
    constructor() {
      this.cells = {};
      this.col = 0; this.row = 0; this.rowH = 1;
      this.canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
      if (this.canvas) { this.canvas.width = SIZE; this.canvas.height = SIZE; this.ctx = this.canvas.getContext('2d'); }
      this.version = 1;
    }
    alloc(w, h) {
      if (this.col + w > SIZE / CELL) { this.col = 0; this.row += this.rowH; this.rowH = 1; }
      const c = { x: this.col, y: this.row, w, h };
      this.col += w;
      this.rowH = Math.max(this.rowH, h);
      return c;
    }
    add(name, draw, w, h) {
      w = w || 1; h = h || 1;
      const c = this.alloc(w, h);
      const px = c.x * CELL, py = c.y * CELL, pw = w * CELL, ph = h * CELL;
      const u0 = (px + PAD) / SIZE, v0 = (py + PAD) / SIZE, u1 = (px + pw - PAD) / SIZE, v1 = (py + ph - PAD) / SIZE;
      this.cells[name] = { u0, v0, u1, v1, px, py, pw, ph };
      if (this.ctx && draw) {
        const g = this.ctx;
        g.save();
        g.beginPath(); g.rect(px, py, pw, ph); g.clip();
        g.translate(px, py);
        draw(g, pw, ph);
        g.restore();
      }
      return this.cells[name];
    }
    get(name) { return this.cells[name] || this.cells.white; }
  }

  function noise(g, w, h, base, amp, seed, size) {
    const r = rnd(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    size = size || 1;
    for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size) {
      const v = (r() - 0.5) * amp;
      if (Math.abs(v) < amp * 0.15) continue;
      g.fillStyle = v > 0 ? 'rgba(255,255,255,' + v.toFixed(3) + ')' : 'rgba(0,0,0,' + (-v).toFixed(3) + ')';
      g.fillRect(x, y, size, size);
    }
  }

  function grass(g, w, h, seed, c1, c2) {
    const r = rnd(seed);
    g.fillStyle = c1; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const x = r() * w, y = r() * h, rr = 4 + r() * 10;
      const grd = g.createRadialGradient(x, y, 0, x, y, rr);
      grd.addColorStop(0, r() < 0.5 ? 'rgba(20,50,10,0.18)' : 'rgba(170,220,90,0.14)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { g.save(); g.translate(ox, oy); g.fillRect(x - rr, y - rr, rr * 2, rr * 2); g.restore(); }
    }
    for (let i = 0; i < 260; i++) {
      const x = r() * w, y = r() * h;
      g.fillStyle = r() < 0.5 ? c2 : 'rgba(210,240,140,0.35)';
      g.fillRect(x, y, 1, 1 + (r() * 2 | 0));
    }
  }

  function planks(g, w, h, c1, c2, vertical, seed, n) {
    const r = rnd(seed);
    n = n || 4;
    const s = (vertical ? w : h) / n;
    for (let i = 0; i < n; i++) {
      const k = 0.9 + r() * 0.2;
      g.fillStyle = shade(c1, k);
      if (vertical) g.fillRect(i * s, 0, s, h); else g.fillRect(0, i * s, w, s);
      g.strokeStyle = 'rgba(0,0,0,0.12)';
      for (let j = 0; j < 7; j++) {
        g.beginPath();
        const o = r() * s;
        if (vertical) { g.moveTo(i * s + o, 0); g.bezierCurveTo(i * s + o + 2, h * 0.3, i * s + o - 2, h * 0.7, i * s + o, h); }
        else { g.moveTo(0, i * s + o); g.bezierCurveTo(w * 0.3, i * s + o + 2, w * 0.7, i * s + o - 2, w, i * s + o); }
        g.stroke();
      }
      g.fillStyle = c2;
      if (vertical) { g.fillRect(i * s, 0, 1, h); const cut = r() * h; g.fillRect(i * s, cut, s, 1); }
      else { g.fillRect(0, i * s, w, 1); const cut = r() * w; g.fillRect(cut, i * s, 1, s); }
    }
  }

  function build(atlas) {
    const A = atlas;
    A.add('white', (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); });
    for (let i = 0; i < 4; i++) A.add('grass' + i, (g, w, h) => grass(g, w, h, 11 + i * 7, '#56902e', 'rgba(40,90,20,0.6)'));
    for (let i = 0; i < 2; i++) A.add('grass2_' + i, (g, w, h) => grass(g, w, h, 91 + i * 5, '#467e26', 'rgba(30,70,15,0.7)'));
    A.add('dirt', (g, w, h) => { noise(g, w, h, '#7a5a38', 0.22, 5, 2); });
    A.add('flowers', (g, w, h) => {
      grass(g, w, h, 33, '#4e8a2a', 'rgba(40,90,20,0.6)');
      const r = rnd(8);
      const cols = ['#e84a6a', '#f0d040', '#f0f0f0', '#9a5ad8', '#f08a3a'];
      for (let i = 0; i < 40; i++) { g.fillStyle = cols[i % cols.length]; const x = r() * w, y = r() * h; g.beginPath(); g.arc(x, y, 1.6 + r(), 0, 7); g.fill(); g.fillStyle = '#fff6a0'; g.fillRect(x - 0.5, y - 0.5, 1, 1); }
    });
    A.add('gravel', (g, w, h) => { noise(g, w, h, '#9a9488', 0.3, 7, 2); const r = rnd(3); for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? '#b8b2a6' : '#6e6a62'; g.beginPath(); g.ellipse(r() * w, r() * h, 1.5 + r() * 2, 1 + r() * 1.5, r() * 3, 0, 7); g.fill(); } });
    A.add('sand', (g, w, h) => { noise(g, w, h, '#dcc48e', 0.12, 13, 1); g.strokeStyle = 'rgba(160,130,80,0.18)'; for (let i = 0; i < 6; i++) { g.beginPath(); const y = i * 11 + 4; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 3, w * 0.6, y - 3, w, y); g.stroke(); } });
    A.add('rock', (g, w, h) => { noise(g, w, h, '#7a766e', 0.35, 21, 3); });
    const asph = (g, w, h) => { noise(g, w, h, '#4c4e54', 0.16, 17, 1); const r = rnd(4); for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(r() * w, r() * h, 3, 2); } };
    A.add('road', asph);
    const dashed = (g, w, h, horiz, pos, color, dash) => {
      g.fillStyle = color;
      if (horiz) { for (let x = 0; x < w; x += dash ? 32 : w) g.fillRect(x + (dash ? 6 : 0), pos, dash ? 18 : w, 3); }
      else { for (let y = 0; y < h; y += dash ? 32 : h) g.fillRect(pos, y + (dash ? 6 : 0), 3, dash ? 18 : h); }
    };
    A.add('road_h0', (g, w, h) => { asph(g, w, h); dashed(g, w, h, true, 3, '#e8e8e0', false); });
    A.add('road_h1', (g, w, h) => { asph(g, w, h); dashed(g, w, h, true, h - 3, '#e8c030', false); dashed(g, w, h, true, h - 7, '#e8c030', false); });
    A.add('road_h2', (g, w, h) => { asph(g, w, h); dashed(g, w, h, true, 0, '#e8c030', false); dashed(g, w, h, true, 4, '#e8c030', false); });
    A.add('road_h3', (g, w, h) => { asph(g, w, h); dashed(g, w, h, true, h - 6, '#e8e8e0', false); });
    A.add('road_v0', (g, w, h) => { asph(g, w, h); dashed(g, w, h, false, 3, '#e8e8e0', false); });
    A.add('road_v1', (g, w, h) => { asph(g, w, h); dashed(g, w, h, false, w - 3, '#e8c030', false); dashed(g, w, h, false, w - 7, '#e8c030', false); });
    A.add('road_v2', (g, w, h) => { asph(g, w, h); dashed(g, w, h, false, 0, '#e8c030', false); dashed(g, w, h, false, 4, '#e8c030', false); });
    A.add('road_v3', (g, w, h) => { asph(g, w, h); dashed(g, w, h, false, w - 6, '#e8e8e0', false); });
    A.add('cross_h', (g, w, h) => { asph(g, w, h); g.fillStyle = '#e4e4dc'; for (let x = 4; x < w; x += 16) g.fillRect(x, 0, 8, h); });
    A.add('cross_v', (g, w, h) => { asph(g, w, h); g.fillStyle = '#e4e4dc'; for (let y = 4; y < h; y += 16) g.fillRect(0, y, w, 8); });
    A.add('walk', (g, w, h) => { noise(g, w, h, '#b4b0a8', 0.1, 27, 1); g.fillStyle = 'rgba(60,60,60,0.35)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillRect(0, h / 2, w, 1); g.fillRect(w / 2, 0, 1, h); });
    A.add('plaza', (g, w, h) => { noise(g, w, h, '#c4b8a0', 0.12, 31, 1); g.fillStyle = 'rgba(80,70,50,0.3)'; for (let i = 0; i <= 4; i++) { g.fillRect(0, i * 16, w, 1); g.fillRect(i * 16 + ((i % 2) * 8), 0, 1, h); } });
    A.add('path', (g, w, h) => { grass(g, w, h, 55, '#52882a', 'rgba(40,90,20,0.6)'); const r = rnd(9); for (let i = 0; i < 5; i++) { g.fillStyle = shade('#a89c88', 0.85 + r() * 0.3); g.beginPath(); g.ellipse(8 + (i % 2) * 30 + r() * 16, 8 + i * 12, 10 + r() * 4, 6 + r() * 2, r(), 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.stroke(); } });
    A.add('bridge', (g, w, h) => planks(g, w, h, '#8a6a4a', 'rgba(0,0,0,0.35)', false, 5, 6));
    A.add('shore', (g, w, h) => { noise(g, w, h, '#7a6040', 0.25, 44, 2); });

    for (const [k, f] of Object.entries(S.FLOORS)) {
      A.add('fl_' + k, (g, w, h) => {
        const c = f.c, c2 = f.c2;
        if (f.tex === 'fl_wood') planks(g, w, h, c, shade(c2, 0.7), false, S.hashStr(k), 4);
        else if (f.tex === 'fl_herring') {
          g.fillStyle = c; g.fillRect(0, 0, w, h);
          for (let y = -16; y < h + 16; y += 16) for (let x = -16; x < w + 16; x += 32) {
            g.fillStyle = shade(c, 0.9 + ((x + y) % 3) * 0.06); g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillRect(0, 0, 22, 7); g.strokeStyle = shade(c2, 0.8); g.strokeRect(0, 0, 22, 7); g.restore();
            g.fillStyle = shade(c, 1.05); g.save(); g.translate(x + 16, y); g.rotate(-Math.PI / 4); g.fillRect(-22, 0, 22, 7); g.strokeStyle = shade(c2, 0.8); g.strokeRect(-22, 0, 22, 7); g.restore();
          }
        } else if (f.tex === 'fl_checker') { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? c2 : c; g.fillRect(x * w / 2, y * h / 2, w / 2, h / 2); } g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, w, 2); }
        else if (f.tex === 'fl_tile') { noise(g, w, h, c, 0.06, 3, 1); g.fillStyle = c2; for (let i = 0; i < 2; i++) { g.fillRect(0, i * h / 2, w, 1.5); g.fillRect(i * w / 2, 0, 1.5, h); } }
        else if (f.tex === 'fl_carpet') { noise(g, w, h, c, 0.14, S.hashStr(k), 1); }
        else if (f.tex === 'fl_lino') { noise(g, w, h, c, 0.05, 2, 1); g.fillStyle = shade(c2, 1); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) g.fillRect(i * 16 + 6, j * 16 + 6, 4, 4); }
        else if (f.tex === 'fl_marble') { noise(g, w, h, c, 0.05, 6, 1); g.strokeStyle = shade(c2, 0.9); g.globalAlpha = 0.5; const r = rnd(12); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(r() * w, 0); g.bezierCurveTo(r() * w, h * 0.3, r() * w, h * 0.6, r() * w, h); g.stroke(); } g.globalAlpha = 1; g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); }
        else if (f.tex === 'fl_stone') { noise(g, w, h, c, 0.16, 8, 2); g.strokeStyle = shade(c2, 0.7); g.lineWidth = 1.5; g.strokeRect(1, 1, w / 2 - 1, h / 2 - 1); g.strokeRect(w / 2, 1, w / 2 - 1, h - 2); g.strokeRect(1, h / 2, w / 2 - 1, h / 2 - 1); }
        else if (f.tex === 'fl_brick') { g.fillStyle = shade(c2, 0.8); g.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = -1; i < 3; i++) { g.fillStyle = shade(c, 0.9 + ((i * 7 + j * 3) % 5) * 0.05); g.fillRect(i * 32 + (j % 2) * 16 + 1, j * 8 + 1, 30, 6); } }
        else if (f.tex === 'fl_deck') planks(g, w, h, c, shade(c2, 0.5), true, 77, 5);
        else noise(g, w, h, c, 0.1, 1, 1);
      });
    }
    for (const [k, p] of Object.entries(S.WALLPAPERS)) {
      const draw = (g, w, h, lower) => {
        const c = p.c, c2 = p.c2 || p.c;
        if (p.tex === 'wp_paint') noise(g, w, h, c, 0.04, 3, 1);
        else if (p.tex === 'wp_stripes') { g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = c2; for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 6, h); }
        else if (p.tex === 'wp_floral') { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const cx = x * 16 + (y % 2) * 8 + 4, cy = y * 16 + 6; g.fillStyle = c2; for (let a = 0; a < 5; a++) { g.beginPath(); g.arc(cx + Math.cos(a * 1.26) * 2.5, cy + Math.sin(a * 1.26) * 2.5, 1.8, 0, 7); g.fill(); } g.fillStyle = '#e8d060'; g.fillRect(cx - 1, cy - 1, 2, 2); } }
        else if (p.tex === 'wp_damask') { g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = c2; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.save(); g.translate(x * 32 + (y % 2) * 16 + 16, y * 32 + 16); g.beginPath(); g.moveTo(0, -12); g.bezierCurveTo(9, -6, 9, 6, 0, 12); g.bezierCurveTo(-9, 6, -9, -6, 0, -12); g.fill(); g.restore(); } }
        else if (p.tex === 'wp_wood') planks(g, w, h, c, shade(c2, 0.6), true, 5, 4);
        else if (p.tex === 'wp_wainscot') { if (lower) { planks(g, w, h, c2, 'rgba(0,0,0,0.3)', true, 5, 4); g.fillStyle = shade(c2, 0.7); g.fillRect(0, 0, w, 5); } else noise(g, w, h, c, 0.04, 9, 1); }
        else if (p.tex === 'wp_tile') { g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = c2; for (let i = 0; i <= 4; i++) { g.fillRect(0, i * 16, w, 1); g.fillRect(i * 16, 0, 1, h); } g.fillStyle = 'rgba(255,255,255,0.3)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.fillRect(i * 16 + 2, j * 16 + 2, 4, 1); }
        else if (p.tex === 'wp_brick') { g.fillStyle = shade(c2, 0.9); g.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = -1; i < 3; i++) { g.fillStyle = shade(c, 0.85 + ((i * 5 + j * 3) % 5) * 0.06); g.fillRect(i * 32 + (j % 2) * 16 + 1, j * 8 + 1, 30, 6); } }
        else if (p.tex === 'wp_stone') { g.fillStyle = shade(c2, 0.8); g.fillRect(0, 0, w, h); const r = rnd(4); for (let j = 0; j < 4; j++) for (let i = -1; i < 3; i++) { g.fillStyle = shade(c, 0.85 + r() * 0.3); g.fillRect(i * 28 + (j % 2) * 14 + 1, j * 16 + 1, 26, 14); } }
        else if (p.tex === 'wp_siding') { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let j = 0; j < 6; j++) { const gr = g.createLinearGradient(0, j * 10.67, 0, (j + 1) * 10.67); gr.addColorStop(0, shade(c, 1.05)); gr.addColorStop(1, shade(c2, 0.85)); g.fillStyle = gr; g.fillRect(0, j * 10.67, w, 10.67); } }
        else if (p.tex === 'wp_stucco') noise(g, w, h, c, 0.1, 17, 2);
        else noise(g, w, h, c, 0.05, 1, 1);
      };
      A.add('wp_' + k, (g, w, h) => draw(g, w, h, false));
      if (p.tex === 'wp_wainscot') A.add('wp_' + k + '_low', (g, w, h) => draw(g, w, h, true));
    }
    A.add('wood', (g, w, h) => planks(g, w, h, '#c8c8c8', 'rgba(0,0,0,0.25)', true, 3, 2));
    A.add('wood_h', (g, w, h) => planks(g, w, h, '#c8c8c8', 'rgba(0,0,0,0.25)', false, 4, 2));
    A.add('fabric', (g, w, h) => { g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < w; i += 2) { g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); } });
    A.add('metal', (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f4f4f4'); gr.addColorStop(0.5, '#c8c8c8'); gr.addColorStop(1, '#e8e8e8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    A.add('marble', (g, w, h) => { noise(g, w, h, '#e8e8e8', 0.06, 9, 1); g.strokeStyle = 'rgba(0,0,0,0.18)'; const r = rnd(2); for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(r() * w, 0); g.bezierCurveTo(r() * w, h / 3, r() * w, h / 2, r() * w, h); g.stroke(); } });
    A.add('books', (g, w, h) => {
      g.fillStyle = '#2a1a10'; g.fillRect(0, 0, w, h);
      const r = rnd(6); const cols = ['#8a2a2a', '#2a4a8a', '#2a6a3a', '#c8a040', '#6a3a7a', '#e0d8c0', '#1a1a1a', '#b8582a'];
      for (let row = 0; row < 4; row++) { let x = 2; while (x < w - 2) { const bw = 3 + (r() * 4 | 0), bh = 10 + (r() * 4 | 0); g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(x, row * 16 + 15 - bh, bw, bh); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x, row * 16 + 15 - bh + 2, bw, 1); x += bw + 0.5; } g.fillStyle = '#5a3a22'; g.fillRect(0, row * 16 + 15, w, 1); }
    });
    A.add('screen_off', (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#34383e'); gr.addColorStop(0.6, '#15171a'); gr.addColorStop(1, '#22262a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.6, 0); g.lineTo(0, h * 0.5); g.fill(); });
    for (let i = 0; i < 4; i++) A.add('screen_' + i, (g, w, h) => {
      const P = [['#3a7ad8', '#e8e070', '#3aa848'], ['#e85a3a', '#f0c050', '#6a3aa8'], ['#48c8e8', '#f0f0f0', '#2a4a8a'], ['#2a8a4a', '#d8e840', '#c83a3a']][i];
      g.fillStyle = P[0]; g.fillRect(0, 0, w, h); g.fillStyle = P[1]; g.fillRect(0, h * 0.55, w, h * 0.45); g.fillStyle = P[2]; g.beginPath(); g.arc(w * 0.35, h * 0.5, h * 0.22, 0, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
    });
    A.add('pc_screen', (g, w, h) => { g.fillStyle = '#1c3a8a'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8c8c8'; g.fillRect(0, h - 8, w, 8); g.fillStyle = '#e8e8e8'; g.fillRect(6, 8, w * 0.45, h * 0.4); g.fillStyle = '#1c50a8'; g.fillRect(6, 8, w * 0.45, 5); g.fillStyle = '#3a8a4a'; g.fillRect(2, h - 7, 10, 6); });
    const paint = (g, w, h, kind, seed) => {
      const r = rnd(seed);
      if (kind === 0) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f0a050'); gr.addColorStop(0.5, '#e86a4a'); gr.addColorStop(0.55, '#3a4a6a'); gr.addColorStop(1, '#2a3050'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#f8e070'; g.beginPath(); g.arc(w * 0.5, h * 0.5, w * 0.16, Math.PI, 0); g.fill(); g.fillStyle = '#1a2030'; g.fillRect(0, h * 0.72, w, h * 0.28); }
      else if (kind === 1) { g.fillStyle = '#3a2a24'; g.fillRect(0, 0, w, h); g.fillStyle = '#6a4a2a'; g.fillRect(0, h * 0.7, w, h * 0.3); const cols = ['#c83a2a', '#e8b030', '#6a9a3a', '#8a3a7a']; for (let i = 0; i < 6; i++) { g.fillStyle = cols[i % 4]; g.beginPath(); g.arc(w * (0.25 + r() * 0.5), h * (0.55 + r() * 0.15), 5 + r() * 5, 0, 7); g.fill(); } g.fillStyle = '#c8d8e8'; g.fillRect(w * 0.15, h * 0.3, w * 0.12, h * 0.4); }
      else if (kind === 2) { const cols = ['#e83a3a', '#3a6ae8', '#f0d030', '#f0f0f0', '#1a1a1a']; g.fillStyle = '#f0ece0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 7; i++) { g.fillStyle = cols[(r() * 5) | 0]; g.fillRect(r() * w * 0.8, r() * h * 0.8, 6 + r() * w * 0.4, 6 + r() * h * 0.3); } g.fillStyle = '#1a1a1a'; g.fillRect(0, h * 0.4, w, 2); g.fillRect(w * 0.6, 0, 2, h); }
      else { g.fillStyle = '#4a5a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8c8a8'; g.beginPath(); g.ellipse(w / 2, h * 0.4, w * 0.16, h * 0.2, 0, 0, 7); g.fill(); g.fillStyle = '#3a2418'; g.beginPath(); g.ellipse(w / 2, h * 0.3, w * 0.18, h * 0.14, 0, Math.PI, 0); g.fill(); g.fillStyle = '#8a2a2a'; g.beginPath(); g.ellipse(w / 2, h * 0.95, w * 0.34, h * 0.35, 0, Math.PI, 0); g.fill(); }
    };
    for (let i = 0; i < 4; i++) for (let v = 0; v < 2; v++) A.add('art' + i + '_' + v, (g, w, h) => paint(g, w, h, i, 7 + v * 13 + i));
    A.add('rug_persian', (g, w, h) => { g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#707070'; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8); g.lineWidth = 1; g.strokeRect(9, 9, w - 18, h - 18); g.fillStyle = '#909090'; g.beginPath(); g.moveTo(w / 2, 14); g.lineTo(w - 14, h / 2); g.lineTo(w / 2, h - 14); g.lineTo(14, h / 2); g.fill(); g.fillStyle = '#f0f0f0'; g.beginPath(); g.arc(w / 2, h / 2, 6, 0, 7); g.fill(); });
    A.add('rug_plain', (g, w, h) => { noise(g, w, h, '#d0d0d0', 0.1, 4, 1); g.strokeStyle = '#8a8a8a'; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6); });
    A.add('chess', (g, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#3a2418' : '#e8d8b0'; g.fillRect(x * 8, y * 8, 8, 8); } });
    A.add('clock', (g, w, h) => { g.fillStyle = '#f0e8d0'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, 7); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillStyle = '#3a2a1a'; g.fillRect(w / 2 + Math.cos(a) * 24 - 1, h / 2 + Math.sin(a) * 24 - 1, 2, 2); } g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2, 14); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + 12, h / 2 + 4); g.stroke(); });
    A.add('leaves', (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const r = rnd(3);
      for (let i = 0; i < 180; i++) {
        const x = r() * w, y = r() * h;
        g.fillStyle = 'rgb(' + (170 + r() * 60 | 0) + ',' + (200 + r() * 55 | 0) + ',' + (150 + r() * 60 | 0) + ')';
        g.beginPath(); g.ellipse(x, y, 3 + r() * 3, 2 + r() * 2, r() * 3, 0, 7); g.fill();
      }
    });
    A.add('foliage', (g, w, h) => { noise(g, w, h, '#d8e8c8', 0.35, 9, 2); const r = rnd(5); for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(0,40,0,0.25)'; g.beginPath(); g.ellipse(r() * w, r() * h, 3, 2, r() * 3, 0, 7); g.fill(); } });
    A.add('bark', (g, w, h) => { noise(g, w, h, '#c8c0b8', 0.3, 11, 1); g.strokeStyle = 'rgba(0,0,0,0.3)'; for (let x = 3; x < w; x += 7) { g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 3, h / 3, x - 3, h * 0.66, x + 1, h); g.stroke(); } });
    A.add('shingles', (g, w, h) => { g.fillStyle = '#b0b0b0'; g.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = -1; i < 5; i++) { g.fillStyle = 'rgb(' + (190 + ((i * 3 + j * 5) % 4) * 14) + ',' + (190 + ((i * 3 + j * 5) % 4) * 14) + ',' + (190 + ((i * 3 + j * 5) % 4) * 14) + ')'; g.fillRect(i * 16 + (j % 2) * 8 + 1, j * 8 + 1, 14, 7); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(i * 16 + (j % 2) * 8 + 1, j * 8 + 7, 14, 1); } });
    A.add('glass_office', (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#8ab8d8'); gr.addColorStop(1, '#3a5a7a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#2a3440'; for (let i = 0; i <= 4; i++) { g.fillRect(i * 16, 0, 2, h); g.fillRect(0, i * 16, w, 2); } g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(3, 3, 10, 5); g.fillRect(35, 19, 10, 5); });
    const facade = (g, w, h, wall, win, frame) => { g.fillStyle = wall; g.fillRect(0, 0, w, h); for (let i = 0; i < 2; i++) { g.fillStyle = frame; g.fillRect(i * 32 + 6, 10, 20, 34); g.fillStyle = win; g.fillRect(i * 32 + 8, 12, 16, 30); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(i * 32 + 9, 13, 6, 12); g.fillStyle = frame; g.fillRect(i * 32 + 15, 12, 2, 30); } };
    A.add('facade_brick', (g, w, h) => { g.fillStyle = '#9a4a32'; g.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = -1; i < 3; i++) { g.fillStyle = shade('#a8583a', 0.85 + ((i * 5 + j * 3) % 5) * 0.06); g.fillRect(i * 32 + (j % 2) * 16 + 1, j * 8 + 1, 30, 6); } for (let i = 0; i < 2; i++) { g.fillStyle = '#e8e0d0'; g.fillRect(i * 32 + 6, 10, 20, 34); g.fillStyle = '#3a4a5a'; g.fillRect(i * 32 + 8, 12, 16, 30); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(i * 32 + 9, 13, 6, 12); } });
    A.add('facade_stone', (g, w, h) => facade(g, w, h, '#d8d0c0', '#3a4a5a', '#8a8070'));
    A.add('facade_white', (g, w, h) => facade(g, w, h, '#f0ece4', '#4a5a6a', '#c8c0b0'));
    A.add('facade_concrete', (g, w, h) => { noise(g, w, h, '#a8a8a8', 0.08, 5, 2); g.fillStyle = '#3a4a5a'; g.fillRect(4, 18, w - 8, 18); g.fillStyle = '#2a2a2a'; for (let i = 0; i < 4; i++) g.fillRect(4 + i * 14, 18, 2, 18); });
    A.add('facade_metal', (g, w, h) => { g.fillStyle = '#9aa0a8'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 6) { g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(x, 0, 2, h); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x + 2, 0, 1, h); } });
    A.add('seats', (g, w, h) => { g.fillStyle = '#6a6a70'; g.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = 0; i < 16; i++) { g.fillStyle = (i + j) % 7 === 0 ? '#e8e8e8' : j % 2 ? '#c83a2a' : '#2a4a9a'; g.fillRect(i * 4, j * 8 + 2, 3, 5); } });
    A.add('blob', (g, w, h) => { g.clearRect(0, 0, w, h); const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    A.add('flame', (g, w, h) => { g.clearRect(0, 0, w, h); const gr = g.createRadialGradient(w / 2, h * 0.7, 2, w / 2, h * 0.6, w / 2); gr.addColorStop(0, 'rgba(255,250,200,1)'); gr.addColorStop(0.35, 'rgba(255,190,40,0.95)'); gr.addColorStop(0.7, 'rgba(230,70,20,0.8)'); gr.addColorStop(1, 'rgba(120,20,0,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(w / 2, 0); g.bezierCurveTo(w, h * 0.5, w * 0.9, h, w / 2, h); g.bezierCurveTo(w * 0.1, h, 0, h * 0.5, w / 2, 0); g.fill(); });
    A.add('newspaper', (g, w, h) => { g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2a'; g.fillRect(4, 4, w - 8, 8); g.fillStyle = '#8a8a8a'; for (let i = 0; i < 9; i++) { g.fillRect(4, 16 + i * 5, w / 2 - 6, 2); g.fillRect(w / 2 + 2, 16 + i * 5, w / 2 - 6, 2); } });
    A.add('water_tex', (g, w, h) => { noise(g, w, h, '#3a7ab0', 0.12, 3, 2); });
    A.add('lh_stripes', (g, w, h) => { for (let j = 0; j < 4; j++) { g.fillStyle = j % 2 ? '#c8302a' : '#f4f0e8'; g.fillRect(0, j * 16, w, 16); } });
    A.add('grill_top', (g, w, h) => { g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#8a8a8a'; for (let x = 4; x < w; x += 6) g.fillRect(x, 0, 2, h); });
    A.add('stove_top', (g, w, h) => { g.fillStyle = '#e0e0e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2a'; for (const [x, y] of [[16, 16], [48, 16], [16, 48], [48, 48]]) { g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); g.strokeStyle = '#5a5a5a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 7, 0, 7); g.stroke(); } });
    A.add('sink_top', (g, w, h) => { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.4); gr.addColorStop(0, '#9aa0a8'); gr.addColorStop(1, '#c8ccd0'); g.fillStyle = gr; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.36, h * 0.3, 0, 0, 7); g.fill(); g.fillStyle = '#5a5a5a'; g.beginPath(); g.arc(w / 2, h / 2, 3, 0, 7); g.fill(); });
    A.add('keyboard', (g, w, h) => { g.fillStyle = '#d8d0c0'; g.fillRect(0, 0, w, h); g.fillStyle = '#8a8478'; for (let j = 0; j < 4; j++) for (let i = 0; i < 12; i++) g.fillRect(2 + i * 5, 4 + j * 14, 4, 10); });
    A.add('dirt_plot', (g, w, h) => { noise(g, w, h, '#5a3a22', 0.25, 12, 2); g.fillStyle = 'rgba(0,0,0,0.2)'; for (let j = 0; j < 4; j++) g.fillRect(0, j * 16 + 8, w, 3); });
    A.add('mailbox_flag', (g, w, h) => { g.fillStyle = '#c83a2a'; g.fillRect(0, 0, w, h); });
    for (const [key, rh] of Object.entries(S.RH || {})) {
      A.add('sign_' + key, (g, w, h) => {
        const col = { cityhall: '#2a3a6a', business: '#1c2a3a', police: '#1c2c6a', hospital: '#f0f0f0', science: '#2a5a4a', military: '#3a4a2a', stadium: '#8a1c1c', theater: '#5a1a3a', bistro: '#2a5a2a', grocery: '#c8481c', bookstore: '#5a3a1a', spa: '#6a8a9a', newspaper: '#1c1c1c', school: '#8a5a1a', warehouse: '#5a5a5a' }[key] || '#2a2a2a';
        g.fillStyle = col; g.fillRect(0, 0, w, h);
        g.strokeStyle = key === 'hospital' ? '#c8201a' : '#e8d8a0'; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6);
        g.fillStyle = key === 'hospital' ? '#c8201a' : '#f4ecd0';
        g.font = 'bold 26px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
        const text = rh.name.replace(/«|»/g, '').toUpperCase();
        let size = 26;
        while (size > 10) { g.font = 'bold ' + size + 'px Arial'; if (g.measureText(text).width < w - 16) break; size--; }
        g.fillText(text, w / 2, h / 2 + 1);
      }, 4, 1);
    }
    return A;
  }

  Object.assign(S, { Atlas, buildAtlas: build, ATLAS_CELL: CELL, ATLAS_SIZE: SIZE });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
