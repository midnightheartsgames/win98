(function (M) {
  'use strict';

  function noiseGen(seed, period) {
    const P = period;
    const h = (x, y) => M.hash(((x % P) + P) % P + seed * 131, ((y % P) + P) % P + seed * 71);
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }

  function fbm(S, seed, base, oct, persist) {
    const out = new Float32Array(S * S);
    const ns = [];
    for (let o = 0; o < oct; o++) ns.push(noiseGen(seed + o * 17, base << o));
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let v = 0, amp = 1, tot = 0;
      for (let o = 0; o < oct; o++) {
        const f = (base << o) / S;
        v += ns[o](x * f, y * f) * amp;
        tot += amp;
        amp *= persist || 0.5;
      }
      out[y * S + x] = v / tot;
    }
    return out;
  }

  function rgb(hex) {
    let hx = hex.slice(1);
    if (hx.length === 3) hx = hx[0] + hx[0] + hx[1] + hx[1] + hx[2] + hx[2];
    const n = parseInt(hx, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function shade(ctx, S, seed, amt, base, oct) {
    const img = ctx.getImageData(0, 0, S, S);
    const n = fbm(S, seed, base || 4, oct || 4, 0.55);
    const d = img.data;
    for (let i = 0; i < S * S; i++) {
      const k = 1 + (n[i] - 0.5) * amt;
      d[i * 4] = Math.min(255, d[i * 4] * k);
      d[i * 4 + 1] = Math.min(255, d[i * 4 + 1] * k);
      d[i * 4 + 2] = Math.min(255, d[i * 4 + 2] * k);
    }
    ctx.putImageData(img, 0, 0);
  }

  function speckle(ctx, S, seed, count, col, size, alpha) {
    const r = new M.RNG(seed);
    ctx.fillStyle = col;
    for (let i = 0; i < count; i++) {
      ctx.globalAlpha = (alpha || 0.3) * r.next();
      const s = (size || 1) * (0.5 + r.next());
      ctx.fillRect(r.next() * S, r.next() * S, s, s);
    }
    ctx.globalAlpha = 1;
  }

  function stains(ctx, S, seed, count, col, alpha) {
    const r = new M.RNG(seed);
    for (let i = 0; i < count; i++) {
      const x = r.next() * S, y = r.next() * S, rad = S * (0.05 + r.next() * 0.18);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = (alpha || 0.3) * (0.4 + r.next() * 0.6);
      ctx.fillStyle = g;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        ctx.save(); ctx.translate(ox, oy); ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2); ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drips(ctx, S, seed, count, col, alpha) {
    const r = new M.RNG(seed);
    ctx.strokeStyle = col;
    for (let i = 0; i < count; i++) {
      ctx.globalAlpha = (alpha || 0.25) * r.next();
      ctx.lineWidth = 1 + r.next() * 3;
      const x = r.next() * S, y = r.next() * S * 0.5, L = S * (0.1 + r.next() * 0.5);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r.range(-2, 2), y + L); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function bricks(ctx, S, o) {
    const rows = o.rows || 8, cols = o.cols || 4;
    const bh = S / rows, bw = S / cols;
    const r = new M.RNG(o.seed || 3);
    ctx.fillStyle = o.mortar || '#6d6a62';
    ctx.fillRect(0, 0, S, S);
    const base = rgb(o.color);
    for (let y = 0; y < rows; y++) {
      const off = (y % 2) * bw / 2;
      for (let x = -1; x <= cols; x++) {
        const k = 0.78 + r.next() * 0.36;
        const t = r.next() * 18 - 9;
        ctx.fillStyle = `rgb(${Math.min(255, base[0] * k + t) | 0},${Math.min(255, base[1] * k + t * 0.6) | 0},${Math.min(255, base[2] * k) | 0})`;
        const g = o.gap || 2;
        ctx.fillRect(x * bw + off + g / 2, y * bh + g / 2, bw - g, bh - g);
      }
    }
  }

  function tiles(ctx, S, o) {
    const n = o.n || 8, gap = o.gap || 2;
    const r = new M.RNG(o.seed || 5);
    ctx.fillStyle = o.grout || '#8a8a84';
    ctx.fillRect(0, 0, S, S);
    const base = rgb(o.color);
    const nw = o.nx || n, nh = o.ny || n;
    const tw = S / nw, th = S / nh;
    for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
      let c = base;
      if (o.alt && (x + y) % 2) c = rgb(o.alt);
      if (o.bands && o.bands.includes(y)) c = rgb(o.bandColor);
      const k = 0.9 + r.next() * 0.14;
      ctx.fillStyle = `rgb(${c[0] * k | 0},${c[1] * k | 0},${c[2] * k | 0})`;
      const off = o.stagger && y % 2 ? tw / 2 : 0;
      for (const ox of [0, -S]) ctx.fillRect(x * tw + off + gap / 2 + ox, y * th + gap / 2, tw - gap, th - gap);
      if (o.shine) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x * tw + off + gap, y * th + gap, tw - gap * 2, (th - gap) * 0.3);
      }
    }
  }

  function planks(ctx, S, o) {
    const n = o.n || 6;
    const r = new M.RNG(o.seed || 9);
    const base = rgb(o.color);
    const pw = S / n;
    for (let i = 0; i < n; i++) {
      const k = 0.8 + r.next() * 0.35;
      ctx.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`;
      ctx.fillRect(i * pw, 0, pw, S);
      ctx.strokeStyle = 'rgba(40,20,5,0.25)';
      for (let j = 0; j < 7; j++) {
        ctx.lineWidth = 0.5 + r.next();
        ctx.beginPath();
        const x = i * pw + r.next() * pw;
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + r.range(-4, 4), S * 0.3, x + r.range(-4, 4), S * 0.7, x, S);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(i * pw, 0, 1.5, S);
      const cut = r.next() * S;
      ctx.fillRect(i * pw, cut, pw, 1.5);
    }
  }

  function text(ctx, S, W, H, str, o) {
    ctx.fillStyle = o.bg || '#1a3a2a';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = o.border || '#d8d8c8';
    ctx.lineWidth = H * 0.05;
    ctx.strokeRect(H * 0.06, H * 0.06, W - H * 0.12, H - H * 0.12);
    ctx.fillStyle = o.fg || '#f0f0e0';
    let fs = H * 0.5;
    ctx.font = `bold ${fs}px ${o.font || 'Arial, Helvetica, sans-serif'}`;
    while (ctx.measureText(str).width > W * 0.88 && fs > 8) { fs -= 2; ctx.font = `bold ${fs}px ${o.font || 'Arial, sans-serif'}`; }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, W / 2, H / 2 + fs * 0.05);
  }

  const MATS = {
    clip: { s: 16, m: 1, draw: (c, S) => { c.fillStyle = '#f0f'; c.fillRect(0, 0, S, S); } },
    trim: { s: 64, m: 1, draw: (c, S) => { c.fillStyle = '#4a4744'; c.fillRect(0, 0, S, S); shade(c, S, 2, 0.4, 4, 3); } },
    concrete: { s: 256, m: 3, draw: (c, S) => { c.fillStyle = '#7d7b76'; c.fillRect(0, 0, S, S); shade(c, S, 11, 0.55, 3, 5); speckle(c, S, 4, 900, '#2a2826', 1.4, 0.35); stains(c, S, 7, 6, 'rgba(40,36,30,1)', 0.3); } },
    concrete_dark: { s: 256, m: 3, draw: (c, S) => { c.fillStyle = '#4c4a47'; c.fillRect(0, 0, S, S); shade(c, S, 12, 0.6, 3, 5); speckle(c, S, 5, 700, '#151413', 1.5, 0.4); stains(c, S, 8, 8, 'rgba(20,18,15,1)', 0.35); } },
    concrete_block: { s: 256, m: 2.4, draw: (c, S) => { bricks(c, S, { rows: 6, cols: 3, color: '#8a8780', mortar: '#5d5b56', gap: 3, seed: 21 }); shade(c, S, 13, 0.45, 4, 4); speckle(c, S, 6, 600, '#333', 1.2, 0.3); } },
    plaster: { s: 256, m: 3, draw: (c, S) => { c.fillStyle = '#b8b2a4'; c.fillRect(0, 0, S, S); shade(c, S, 14, 0.25, 3, 5); stains(c, S, 9, 5, 'rgba(90,80,60,1)', 0.18); } },
    plaster_dirty: { s: 256, m: 3, draw: (c, S) => { c.fillStyle = '#958c78'; c.fillRect(0, 0, S, S); shade(c, S, 15, 0.45, 3, 5); stains(c, S, 10, 10, 'rgba(60,50,30,1)', 0.35); drips(c, S, 3, 30, '#3a3020', 0.3); } },
    plaster_green: { s: 256, m: 3, draw: (c, S) => { c.fillStyle = '#6f8270'; c.fillRect(0, 0, S, S); shade(c, S, 16, 0.4, 3, 5); c.fillStyle = 'rgba(40,50,40,0.7)'; c.fillRect(0, S * 0.62, S, S * 0.38); c.fillStyle = 'rgba(20,20,15,0.8)'; c.fillRect(0, S * 0.62, S, 3); stains(c, S, 11, 8, 'rgba(50,45,25,1)', 0.3); } },
    brick: { s: 256, m: 2.2, draw: (c, S) => { bricks(c, S, { color: '#8e4a36', mortar: '#6c6258', seed: 1 }); shade(c, S, 17, 0.4, 4, 4); stains(c, S, 12, 6, 'rgba(20,15,10,1)', 0.3); } },
    brick_red: { s: 256, m: 2.2, draw: (c, S) => { bricks(c, S, { color: '#a24a32', mortar: '#7a6c5e', seed: 2 }); shade(c, S, 18, 0.35, 4, 4); } },
    brick_dark: { s: 256, m: 2.2, draw: (c, S) => { bricks(c, S, { color: '#4e2e26', mortar: '#3a3430', seed: 3 }); shade(c, S, 19, 0.5, 4, 4); stains(c, S, 13, 8, 'rgba(0,0,0,1)', 0.4); drips(c, S, 5, 25, '#101010', 0.35); } },
    brick_painted: { s: 256, m: 2.2, draw: (c, S) => { bricks(c, S, { color: '#b6b0a0', mortar: '#9a9486', seed: 4, gap: 3 }); shade(c, S, 20, 0.25, 4, 4); c.fillStyle = 'rgba(60,70,80,0.55)'; c.fillRect(0, S * 0.66, S, S * 0.34); } },
    tile_white: { s: 256, m: 1.2, draw: (c, S) => { tiles(c, S, { color: '#dcdcd2', grout: '#8c8c84', nx: 4, ny: 8, stagger: true, shine: true, seed: 3 }); shade(c, S, 21, 0.2, 4, 3); stains(c, S, 14, 6, 'rgba(90,80,40,1)', 0.2); drips(c, S, 7, 18, '#6a5a30', 0.2); } },
    tile_green: { s: 256, m: 1.2, draw: (c, S) => { tiles(c, S, { color: '#3f6e56', grout: '#2a3a30', nx: 4, ny: 8, stagger: true, shine: true, seed: 4 }); shade(c, S, 22, 0.25, 4, 3); } },
    tile_station: { s: 256, m: 1.8, draw: (c, S) => { tiles(c, S, { color: '#d8d6c8', grout: '#8a887c', nx: 4, ny: 8, stagger: true, shine: true, seed: 6, bands: [6], bandColor: '#2e5a48' }); shade(c, S, 23, 0.22, 4, 3); stains(c, S, 15, 8, 'rgba(80,70,40,1)', 0.25); drips(c, S, 9, 22, '#5a4a25', 0.22); } },
    tile_old: { s: 256, m: 1.8, draw: (c, S) => { tiles(c, S, { color: '#b9ae8c', grout: '#6a6250', nx: 4, ny: 8, stagger: true, seed: 8, bands: [5, 6], bandColor: '#7a3a2a' }); shade(c, S, 24, 0.5, 4, 4); stains(c, S, 16, 14, 'rgba(40,30,15,1)', 0.45); drips(c, S, 11, 40, '#2a2010', 0.35); } },
    tile_floor: { s: 256, m: 1.6, draw: (c, S) => { tiles(c, S, { color: '#bdb8aa', alt: '#6a6660', grout: '#555', n: 8, seed: 7 }); shade(c, S, 25, 0.3, 4, 3); } },
    kitchen_tile: { s: 256, m: 1.2, draw: (c, S) => { tiles(c, S, { color: '#e2dcc8', alt: '#8a2a22', grout: '#777', n: 6, seed: 9 }); shade(c, S, 26, 0.25, 4, 3); } },
    bath_tile: { s: 256, m: 1, draw: (c, S) => { tiles(c, S, { color: '#9cc2c6', grout: '#7a8c8c', n: 8, shine: true, seed: 10 }); shade(c, S, 27, 0.2, 4, 3); } },
    linoleum: { s: 256, m: 2, draw: (c, S) => { c.fillStyle = '#7a7466'; c.fillRect(0, 0, S, S); shade(c, S, 28, 0.35, 6, 5); speckle(c, S, 11, 1400, '#e8e0d0', 1, 0.3); speckle(c, S, 12, 900, '#302a20', 1, 0.3); } },
    wood_floor: { s: 256, m: 2, draw: (c, S) => { planks(c, S, { color: '#7a4f2e', n: 6, seed: 12 }); shade(c, S, 29, 0.3, 4, 4); } },
    parquet: { s: 256, m: 1.2, draw: (c, S) => { const h = S / 4; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.save(); c.translate(i * h, j * h); c.beginPath(); c.rect(0, 0, h, h); c.clip(); if ((i + j) % 2) { c.translate(h, 0); c.rotate(Math.PI / 2); } planks(c, h, { color: '#8a5a32', n: 4, seed: 13 + i * 4 + j }); c.restore(); } shade(c, S, 30, 0.25, 4, 4); } },
    wood_panel: { s: 256, m: 2, draw: (c, S) => { planks(c, S, { color: '#5a3820', n: 4, seed: 14 }); c.fillStyle = 'rgba(0,0,0,0.3)'; for (let i = 0; i < 4; i++) c.fillRect(i * S / 4 + S / 8 - 1, 0, 2, S); shade(c, S, 31, 0.3, 4, 4); } },
    carpet_red: { s: 256, m: 1.5, draw: (c, S) => { c.fillStyle = '#6e1a1c'; c.fillRect(0, 0, S, S); shade(c, S, 32, 0.4, 16, 3); c.strokeStyle = 'rgba(200,150,60,0.35)'; c.lineWidth = 3; c.strokeRect(12, 12, S - 24, S - 24); speckle(c, S, 13, 2000, '#000', 1, 0.25); stains(c, S, 17, 5, 'rgba(20,5,5,1)', 0.35); } },
    carpet_hotel: { s: 256, m: 1.6, draw: (c, S) => { c.fillStyle = '#4a2a3a'; c.fillRect(0, 0, S, S); c.fillStyle = 'rgba(160,110,50,0.4)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.save(); c.translate(i * S / 4 + S / 8, j * S / 4 + S / 8); c.rotate(Math.PI / 4); c.fillRect(-10, -10, 20, 20); c.restore(); } shade(c, S, 33, 0.45, 16, 3); speckle(c, S, 14, 2500, '#000', 1, 0.3); stains(c, S, 18, 10, 'rgba(10,5,0,1)', 0.45); } },
    carpet_blue: { s: 256, m: 1.6, draw: (c, S) => { c.fillStyle = '#28345a'; c.fillRect(0, 0, S, S); shade(c, S, 34, 0.35, 16, 3); speckle(c, S, 15, 2000, '#000', 1, 0.25); } },
    wallpaper_home: { s: 256, m: 1.4, draw: (c, S) => { c.fillStyle = '#c9b98e'; c.fillRect(0, 0, S, S); c.fillStyle = 'rgba(120,90,50,0.35)'; for (let i = 0; i < 8; i++) c.fillRect(i * S / 8, 0, 3, S); c.fillStyle = 'rgba(150,60,50,0.3)'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.beginPath(); c.arc(i * S / 8 + S / 16, j * S / 8 + (i % 2) * S / 16, 4, 0, 6.3); c.fill(); } shade(c, S, 35, 0.2, 4, 3); } },
    wallpaper_nursery: { s: 256, m: 1.4, draw: (c, S) => { c.fillStyle = '#c8d4de'; c.fillRect(0, 0, S, S); c.fillStyle = 'rgba(250,240,200,0.8)'; const r = new M.RNG(3); for (let i = 0; i < 18; i++) { const x = r.next() * S, y = r.next() * S; c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, rr = k % 2 ? 4 : 9; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); } shade(c, S, 36, 0.15, 4, 3); } },
    wallpaper_hotel: { s: 256, m: 1.6, draw: (c, S) => { c.fillStyle = '#7a6a3e'; c.fillRect(0, 0, S, S); c.strokeStyle = 'rgba(40,30,10,0.45)'; c.lineWidth = 2; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * S / 4 + S / 8, y = j * S / 4 + S / 8; c.beginPath(); c.ellipse(x, y, 14, 22, 0, 0, 6.3); c.stroke(); c.beginPath(); c.moveTo(x, y - 22); c.lineTo(x, y + 22); c.stroke(); } shade(c, S, 37, 0.35, 4, 4); stains(c, S, 19, 12, 'rgba(40,30,10,1)', 0.4); drips(c, S, 13, 30, '#2a2010', 0.3); } },
    wallpaper_green: { s: 256, m: 1.6, draw: (c, S) => { c.fillStyle = '#3e5a44'; c.fillRect(0, 0, S, S); c.fillStyle = 'rgba(200,190,120,0.18)'; for (let i = 0; i < 16; i++) c.fillRect(i * S / 16, 0, 4, S); shade(c, S, 38, 0.35, 4, 4); stains(c, S, 20, 10, 'rgba(20,20,10,1)', 0.4); } },
    wallpaper_red: { s: 256, m: 1.6, draw: (c, S) => { c.fillStyle = '#5a1a1c'; c.fillRect(0, 0, S, S); c.fillStyle = 'rgba(0,0,0,0.3)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(i * S / 4 + S / 8, j * S / 4 + S / 8, 16, 0, 6.3); c.fill(); } shade(c, S, 39, 0.35, 4, 4); } },
    ceiling_panel: { s: 256, m: 1.2, draw: (c, S) => { tiles(c, S, { color: '#c8c4b8', grout: '#5a5850', n: 2, gap: 4, seed: 15 }); speckle(c, S, 16, 3000, '#6a665c', 1, 0.4); stains(c, S, 21, 3, 'rgba(120,90,40,1)', 0.35); } },
    ceiling_dark: { s: 256, m: 3, draw: (c, S) => { c.fillStyle = '#35332f'; c.fillRect(0, 0, S, S); shade(c, S, 40, 0.5, 4, 4); } },
    metal: { s: 128, m: 1, draw: (c, S) => { c.fillStyle = '#6a6e70'; c.fillRect(0, 0, S, S); c.globalAlpha = 0.15; for (let y = 0; y < S; y += 2) { c.fillStyle = y % 4 ? '#fff' : '#000'; c.fillRect(0, y, S, 1); } c.globalAlpha = 1; shade(c, S, 41, 0.3, 4, 3); } },
    metal_plate: { s: 256, m: 1.2, draw: (c, S) => { c.fillStyle = '#5a5e5c'; c.fillRect(0, 0, S, S); c.strokeStyle = '#2a2c2a'; c.lineWidth = 2; for (let i = 0; i <= 2; i++) { c.beginPath(); c.moveTo(0, i * S / 2); c.lineTo(S, i * S / 2); c.stroke(); c.beginPath(); c.moveTo(i * S / 2, 0); c.lineTo(i * S / 2, S); c.stroke(); } c.fillStyle = '#9a9e9a'; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (const [dx, dy] of [[8, 8], [S / 2 - 8, 8], [8, S / 2 - 8], [S / 2 - 8, S / 2 - 8]]) { c.beginPath(); c.arc(i * S / 2 + dx, j * S / 2 + dy, 2.5, 0, 6.3); c.fill(); } shade(c, S, 42, 0.4, 4, 4); stains(c, S, 22, 6, 'rgba(90,50,20,1)', 0.3); } },
    diamond_plate: { s: 128, m: 0.8, draw: (c, S) => { c.fillStyle = '#707472'; c.fillRect(0, 0, S, S); c.fillStyle = '#9a9e9c'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.save(); c.translate(i * S / 8 + (j % 2) * S / 16, j * S / 8); c.rotate(((i + j) % 2 ? 1 : -1) * 0.7); c.fillRect(-5, -1.5, 10, 3); c.restore(); } shade(c, S, 43, 0.35, 4, 3); } },
    rust: { s: 256, m: 1.5, draw: (c, S) => { c.fillStyle = '#6a3a1e'; c.fillRect(0, 0, S, S); shade(c, S, 44, 0.8, 4, 5); speckle(c, S, 17, 1500, '#a05a28', 2, 0.4); stains(c, S, 23, 10, 'rgba(30,15,5,1)', 0.45); } },
    grate: { s: 128, m: 1, alpha: true, draw: (c, S) => { c.clearRect(0, 0, S, S); c.fillStyle = '#3a3c3a'; for (let i = 0; i < 8; i++) { c.fillRect(i * S / 8, 0, 3, S); c.fillRect(0, i * S / 8, S, 3); } } },
    chainlink: { s: 128, m: 0.8, alpha: true, draw: (c, S) => { c.clearRect(0, 0, S, S); c.strokeStyle = '#8a8c88'; c.lineWidth = 1.6; for (let i = -8; i < 16; i++) { c.beginPath(); c.moveTo(i * S / 8, 0); c.lineTo(i * S / 8 + S, S); c.stroke(); c.beginPath(); c.moveTo(i * S / 8 + S, 0); c.lineTo(i * S / 8, S); c.stroke(); } } },
    bars: { s: 128, m: 1, alpha: true, draw: (c, S) => { c.clearRect(0, 0, S, S); c.fillStyle = '#2c2e2c'; for (let i = 0; i < 6; i++) c.fillRect(i * S / 6 + 6, 0, 6, S); c.fillRect(0, S * 0.1, S, 5); c.fillRect(0, S * 0.9, S, 5); } },
    rubber: { s: 128, m: 1, draw: (c, S) => { c.fillStyle = '#26241f'; c.fillRect(0, 0, S, S); shade(c, S, 45, 0.5, 6, 4); for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(0, i * S / 8, S, 2); } } },
    crate: { s: 128, m: 1, fit: true, draw: (c, S) => { planks(c, S, { color: '#8a6a3e', n: 5, seed: 16 }); c.strokeStyle = '#4a321a'; c.lineWidth = 10; c.strokeRect(5, 5, S - 10, S - 10); c.beginPath(); c.moveTo(8, 8); c.lineTo(S - 8, S - 8); c.stroke(); shade(c, S, 46, 0.3, 4, 3); } },
    roof: { s: 256, m: 3, draw: (c, S) => { c.fillStyle = '#3a3836'; c.fillRect(0, 0, S, S); shade(c, S, 47, 0.5, 4, 4); } },
    roof_tar: { s: 256, m: 3, draw: (c, S) => { c.fillStyle = '#2a2826'; c.fillRect(0, 0, S, S); shade(c, S, 48, 0.55, 8, 4); speckle(c, S, 18, 2000, '#555', 1.2, 0.35); c.fillStyle = 'rgba(230,235,245,0.55)'; const n = fbm(S, 49, 3, 4, 0.5); const img = c.getImageData(0, 0, S, S); for (let i = 0; i < S * S; i++) { if (n[i] > 0.56) { const k = Math.min(1, (n[i] - 0.56) * 6); img.data[i * 4] += (230 - img.data[i * 4]) * k; img.data[i * 4 + 1] += (235 - img.data[i * 4 + 1]) * k; img.data[i * 4 + 2] += (245 - img.data[i * 4 + 2]) * k; } } c.putImageData(img, 0, 0); } },
    asphalt: { s: 256, m: 4, draw: (c, S) => { c.fillStyle = '#34322f'; c.fillRect(0, 0, S, S); shade(c, S, 50, 0.4, 8, 5); speckle(c, S, 19, 3000, '#6a6660', 1, 0.35); c.strokeStyle = 'rgba(10,10,10,0.6)'; c.lineWidth = 1.2; const r = new M.RNG(5); for (let i = 0; i < 6; i++) { c.beginPath(); let x = r.next() * S, y = r.next() * S; c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r.range(-14, 14); y += r.range(-14, 14); c.lineTo(x, y); } c.stroke(); } } },
    asphalt_snow: { s: 256, m: 4, draw: (c, S) => { MATS.asphalt.draw(c, S); const n = fbm(S, 51, 3, 5, 0.55); const img = c.getImageData(0, 0, S, S); for (let i = 0; i < S * S; i++) { const k = M.clamp((n[i] - 0.42) * 4, 0, 0.92); img.data[i * 4] += (220 - img.data[i * 4]) * k; img.data[i * 4 + 1] += (226 - img.data[i * 4 + 1]) * k; img.data[i * 4 + 2] += (238 - img.data[i * 4 + 2]) * k; } c.putImageData(img, 0, 0); } },
    snow: { s: 256, m: 4, draw: (c, S) => { c.fillStyle = '#d4dae6'; c.fillRect(0, 0, S, S); shade(c, S, 52, 0.2, 4, 5); speckle(c, S, 20, 1500, '#ffffff', 1, 0.6); speckle(c, S, 21, 500, '#8a96b0', 1, 0.3); } },
    sidewalk: { s: 256, m: 2, draw: (c, S) => { tiles(c, S, { color: '#8a8680', grout: '#4a4844', n: 2, gap: 3, seed: 17 }); shade(c, S, 53, 0.45, 4, 5); const n = fbm(S, 54, 3, 4, 0.55); const img = c.getImageData(0, 0, S, S); for (let i = 0; i < S * S; i++) { const k = M.clamp((n[i] - 0.5) * 3, 0, 0.85); img.data[i * 4] += (215 - img.data[i * 4]) * k; img.data[i * 4 + 1] += (220 - img.data[i * 4 + 1]) * k; img.data[i * 4 + 2] += (232 - img.data[i * 4 + 2]) * k; } c.putImageData(img, 0, 0); } },
    rail: { s: 256, m: 2, draw: (c, S) => { c.fillStyle = '#3c342c'; c.fillRect(0, 0, S, S); shade(c, S, 55, 0.5, 8, 4); speckle(c, S, 22, 3000, '#1a1612', 2, 0.5); for (let i = 0; i < 4; i++) { c.fillStyle = '#4a3624'; c.fillRect(0, i * S / 4 + 10, S, S / 10); c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(0, i * S / 4 + 10 + S / 10, S, 3); } c.fillStyle = '#8a8a84'; c.fillRect(S * 0.28, 0, 8, S); c.fillRect(S * 0.66, 0, 8, S); c.fillStyle = '#c0c0b8'; c.fillRect(S * 0.28 + 2, 0, 3, S); c.fillRect(S * 0.66 + 2, 0, 3, S); } },
    tunnel: { s: 256, m: 3, draw: (c, S) => { c.fillStyle = '#3a3630'; c.fillRect(0, 0, S, S); shade(c, S, 56, 0.6, 4, 5); stains(c, S, 24, 10, 'rgba(10,8,5,1)', 0.5); drips(c, S, 15, 50, '#0a0805', 0.4); c.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 4; i++) c.fillRect(0, i * S / 4, S, 2); } },
    platform_edge: { s: 128, m: 1, draw: (c, S) => { c.fillStyle = '#6a665e'; c.fillRect(0, 0, S, S); shade(c, S, 57, 0.4, 4, 3); c.fillStyle = '#c8a82a'; c.fillRect(0, S * 0.1, S, S * 0.35); speckle(c, S, 23, 400, '#222', 2, 0.5); } },
    vault: { s: 256, m: 2, draw: (c, S) => { c.fillStyle = '#8a8c88'; c.fillRect(0, 0, S, S); c.globalAlpha = 0.12; for (let y = 0; y < S; y += 2) { c.fillStyle = y % 4 ? '#fff' : '#000'; c.fillRect(0, y, S, 1); } c.globalAlpha = 1; c.strokeStyle = '#4a4c48'; c.lineWidth = 3; c.strokeRect(10, 10, S - 20, S - 20); shade(c, S, 58, 0.2, 4, 3); } },
    deposit: { s: 256, m: 1.2, draw: (c, S) => { tiles(c, S, { color: '#9a9480', grout: '#3a3830', nx: 4, ny: 4, gap: 4, seed: 18 }); c.fillStyle = '#2a2820'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(i * S / 4 + S / 8, j * S / 4 + S / 8, 5, 0, 6.3); c.fill(); } shade(c, S, 59, 0.25, 4, 3); } },
    marble: { s: 256, m: 2, draw: (c, S) => { c.fillStyle = '#d8d2c4'; c.fillRect(0, 0, S, S); const n = fbm(S, 60, 2, 6, 0.6); const img = c.getImageData(0, 0, S, S); for (let i = 0; i < S * S; i++) { const v = Math.abs(Math.sin(n[i] * 22)); const k = v < 0.12 ? 0.6 : 1; img.data[i * 4] *= k; img.data[i * 4 + 1] *= k; img.data[i * 4 + 2] *= k; } c.putImageData(img, 0, 0); } },
    marble_dark: { s: 256, m: 2, draw: (c, S) => { c.fillStyle = '#2a2622'; c.fillRect(0, 0, S, S); const n = fbm(S, 61, 2, 6, 0.6); const img = c.getImageData(0, 0, S, S); for (let i = 0; i < S * S; i++) { const v = Math.abs(Math.sin(n[i] * 20)); if (v < 0.1) { img.data[i * 4] = 150; img.data[i * 4 + 1] = 120; img.data[i * 4 + 2] = 90; } } c.putImageData(img, 0, 0); } },
    stone_gothic: { s: 256, m: 3, draw: (c, S) => { bricks(c, S, { rows: 4, cols: 2, color: '#6a645a', mortar: '#3a3630', gap: 4, seed: 30 }); shade(c, S, 62, 0.55, 4, 5); stains(c, S, 25, 10, 'rgba(10,10,5,1)', 0.45); } },
    club_black: { s: 256, m: 2, draw: (c, S) => { c.fillStyle = '#16141a'; c.fillRect(0, 0, S, S); shade(c, S, 63, 0.6, 4, 4); c.fillStyle = 'rgba(120,20,30,0.25)'; for (let i = 0; i < 8; i++) c.fillRect(0, i * S / 8, S, 1); } },
    club_red: { s: 256, m: 2, draw: (c, S) => { c.fillStyle = '#4a0c14'; c.fillRect(0, 0, S, S); shade(c, S, 64, 0.5, 8, 4); c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.beginPath(); c.moveTo(i * S / 4 + S / 8, j * S / 4); c.lineTo(i * S / 4 + S / 4, j * S / 4 + S / 8); c.lineTo(i * S / 4 + S / 8, j * S / 4 + S / 4); c.lineTo(i * S / 4, j * S / 4 + S / 8); c.closePath(); c.stroke(); } } },
    club_floor: { s: 256, m: 2, draw: (c, S) => { tiles(c, S, { color: '#1a1a1e', alt: '#3a0a18', grout: '#050505', n: 4, gap: 3, seed: 19, shine: true }); shade(c, S, 65, 0.3, 4, 3); } },
    curtain_red: { s: 256, m: 1.5, draw: (c, S) => { const g = c.createLinearGradient(0, 0, S, 0); for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, i % 2 ? '#3a0508' : '#8a1a20'); c.fillStyle = g; c.fillRect(0, 0, S, S); shade(c, S, 66, 0.2, 4, 3); } },
    water: { s: 256, m: 3, draw: (c, S) => { c.fillStyle = '#1e2a26'; c.fillRect(0, 0, S, S); shade(c, S, 67, 0.6, 4, 4); } },
    dirt: { s: 256, m: 3, draw: (c, S) => { c.fillStyle = '#4a3e30'; c.fillRect(0, 0, S, S); shade(c, S, 68, 0.6, 6, 5); speckle(c, S, 24, 2000, '#1a140e', 2, 0.5); } },
    sheetmetal: { s: 128, m: 1.2, draw: (c, S) => { const g = c.createLinearGradient(0, 0, S, 0); for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, i % 2 ? '#8a8e8a' : '#4a4e4a'); c.fillStyle = g; c.fillRect(0, 0, S, S); shade(c, S, 69, 0.4, 4, 3); stains(c, S, 26, 6, 'rgba(90,50,20,1)', 0.4); } },
    fabric: { s: 128, m: 0.8, draw: (c, S) => { c.fillStyle = '#5a4a3a'; c.fillRect(0, 0, S, S); shade(c, S, 70, 0.3, 16, 3); } },
    paper: { s: 128, m: 1, fit: true, draw: (c, S) => { c.fillStyle = '#e8e2d0'; c.fillRect(0, 0, S, S); shade(c, S, 71, 0.1, 4, 3); } },
    window_lit: { s: 128, m: 1, fit: true, emissive: 0.8, draw: (c, S) => { c.fillStyle = '#e8c070'; c.fillRect(0, 0, S, S); c.fillStyle = 'rgba(120,70,20,0.5)'; c.fillRect(0, 0, S, S * 0.2); c.fillStyle = '#2a2018'; c.fillRect(S / 2 - 3, 0, 6, S); c.fillRect(0, S / 2 - 3, S, 6); } },
    window_dark: { s: 128, m: 1, fit: true, draw: (c, S) => { c.fillStyle = '#10141c'; c.fillRect(0, 0, S, S); c.fillStyle = 'rgba(120,140,170,0.2)'; c.fillRect(S * 0.1, S * 0.1, S * 0.3, S * 0.8); c.fillStyle = '#2a2018'; c.fillRect(S / 2 - 3, 0, 6, S); c.fillRect(0, S / 2 - 3, S, 6); } },
    neon_red: { s: 32, m: 1, emissive: 1, draw: (c, S) => { c.fillStyle = '#ff3a3a'; c.fillRect(0, 0, S, S); } },
    neon_blue: { s: 32, m: 1, emissive: 1, draw: (c, S) => { c.fillStyle = '#5a9aff'; c.fillRect(0, 0, S, S); } },
    lamp: { s: 32, m: 1, emissive: 1, draw: (c, S) => { c.fillStyle = '#fff4d8'; c.fillRect(0, 0, S, S); } },
    fluor: { s: 32, m: 1, emissive: 1, draw: (c, S) => { c.fillStyle = '#e8f4ff'; c.fillRect(0, 0, S, S); } },
    black: { s: 16, m: 1, draw: (c, S) => { c.fillStyle = '#050505'; c.fillRect(0, 0, S, S); } },
    siding: { s: 256, m: 2, draw: (c, S) => { for (let i = 0; i < 8; i++) { const g = c.createLinearGradient(0, i * S / 8, 0, (i + 1) * S / 8); g.addColorStop(0, '#d8d4c8'); g.addColorStop(0.85, '#b8b4a8'); g.addColorStop(1, '#6a6660'); c.fillStyle = g; c.fillRect(0, i * S / 8, S, S / 8); } shade(c, S, 90, 0.2, 4, 4); stains(c, S, 91, 5, 'rgba(60,70,50,1)', 0.25); } },
    grass: { s: 256, m: 3, draw: (c, S) => { c.fillStyle = '#2e3a22'; c.fillRect(0, 0, S, S); shade(c, S, 92, 0.6, 8, 5); speckle(c, S, 93, 3000, '#4a5a30', 2, 0.5); speckle(c, S, 94, 1500, '#1a2210', 2, 0.5); } },
    shingle: { s: 256, m: 2, draw: (c, S) => { bricks(c, S, { rows: 10, cols: 6, color: '#3a3430', mortar: '#1a1614', gap: 2, seed: 95 }); shade(c, S, 96, 0.4, 4, 4); } },
    wood_trim: { s: 128, m: 1, draw: (c, S) => { planks(c, S, { color: '#e8e0d0', n: 2, seed: 97 }); shade(c, S, 98, 0.15, 4, 3); } },
    lawn_wet: { s: 256, m: 3, draw: (c, S) => { MATS.grass.draw(c, S); c.fillStyle = 'rgba(120,140,170,0.12)'; c.fillRect(0, 0, S, S); } },
    tile_wet: { s: 256, m: 2, draw: (c, S) => { tiles(c, S, { color: '#6a6660', grout: '#3a3834', n: 2, gap: 3, seed: 99 }); shade(c, S, 100, 0.35, 4, 4); c.fillStyle = 'rgba(140,160,190,0.12)'; c.fillRect(0, 0, S, S); } },
    column_green: { s: 128, m: 1.5, draw: (c, S) => { c.fillStyle = '#2e4a3a'; c.fillRect(0, 0, S, S); shade(c, S, 101, 0.35, 4, 4); c.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 4; i++) c.fillRect(0, i * S / 4, S, 3); c.fillStyle = 'rgba(200,210,190,0.5)'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(8 + (i % 4) * 36, 10 + Math.floor(i / 4) * 64, 3, 0, 6.3); c.fill(); } stains(c, S, 102, 5, 'rgba(90,50,20,1)', 0.35); } },
    plank: { s: 256, m: 2, draw: (c, S) => { planks(c, S, { color: '#5a4a38', n: 5, seed: 103 }); shade(c, S, 104, 0.5, 4, 4); stains(c, S, 105, 8, 'rgba(0,0,0,1)', 0.4); } },
    rubble_c: { s: 256, m: 2, draw: (c, S) => { c.fillStyle = '#6a665e'; c.fillRect(0, 0, S, S); shade(c, S, 106, 0.8, 6, 5); speckle(c, S, 107, 1200, '#222', 3, 0.5); speckle(c, S, 108, 600, '#aaa', 2, 0.4); } },
    fire: { s: 64, m: 1, emissive: 1, draw: (c, S) => { const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#ffea80'); g.addColorStop(1, '#ff5010'); c.fillStyle = g; c.fillRect(0, 0, S, S); } }
  };

  const FACADES = {
    facade_brick: { base: '#5a3428', win: 3, seed: 1 },
    facade_brown: { base: '#4a3a30', win: 3, seed: 2 },
    facade_grey: { base: '#56585a', win: 4, seed: 3 },
    facade_stone: { base: '#6a645a', win: 3, seed: 4 },
    facade_dark: { base: '#26282c', win: 4, seed: 5 }
  };
  for (const [k, f] of Object.entries(FACADES)) {
    MATS[k] = {
      s: 256, m: 6, lit: true, draw: (c, S, o) => {
        if (k === 'facade_brick' || k === 'facade_brown') bricks(c, S, { rows: 32, cols: 12, color: f.base, mortar: '#3a3028', gap: 1, seed: f.seed });
        else { c.fillStyle = f.base; c.fillRect(0, 0, S, S); }
        shade(c, S, 80 + f.seed, 0.5, 4, 4);
        const r = new M.RNG(f.seed * 7);
        const n = 2;
        const cw = S / n, ch = S / n;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          const x = i * cw + cw * 0.25, y = j * ch + ch * 0.2, w = cw * 0.5, h = ch * 0.55;
          c.fillStyle = 'rgba(0,0,0,0.6)';
          c.fillRect(x - 3, y - 3, w + 6, h + 8);
          const lit = r.next() < 0.3;
          if (o && o.emit) c.fillStyle = lit ? (r.next() < 0.5 ? '#f0c878' : '#c8d8f0') : '#000';
          else c.fillStyle = lit ? '#d8b070' : '#141820';
          c.fillRect(x, y, w, h);
          if (!(o && o.emit)) { c.fillStyle = 'rgba(160,180,210,0.15)'; c.fillRect(x, y, w * 0.3, h); }
          c.fillStyle = o && o.emit ? '#000' : '#1a1410';
          c.fillRect(x + w / 2 - 1.5, y, 3, h);
          c.fillRect(x, y + h / 2 - 1.5, w, 3);
          if (!(o && o.emit)) { c.fillStyle = 'rgba(210,215,225,0.8)'; c.fillRect(x - 4, y + h + 3, w + 8, 4); }
        }
      }
    };
  }

  const DECALS = {
    graffiti_v: (c, W, H) => { c.clearRect(0, 0, W, H); c.strokeStyle = '#b0101a'; c.lineCap = 'round'; c.lineWidth = W * 0.07; c.beginPath(); c.moveTo(W * 0.2, H * 0.12); c.lineTo(W * 0.5, H * 0.85); c.lineTo(W * 0.8, H * 0.12); c.stroke(); c.lineWidth = W * 0.035; c.beginPath(); c.moveTo(W * 0.12, H * 0.62); c.lineTo(W * 0.88, H * 0.38); c.stroke(); c.lineWidth = W * 0.06; c.beginPath(); c.moveTo(W * 0.72, H * 0.42); c.lineTo(W * 0.86, H * 0.37); c.stroke(); c.lineWidth = W * 0.012; c.beginPath(); c.moveTo(W * 0.88, H * 0.37); c.lineTo(W * 0.96, H * 0.34); c.stroke(); c.fillStyle = '#b0101a'; for (let i = 0; i < 9; i++) { c.fillRect(W * (0.25 + i * 0.07), H * (0.5 + (i % 3) * 0.1), 3, H * 0.2 * ((i * 7) % 5) / 5); } },
    graffiti1: (c, W, H) => { c.clearRect(0, 0, W, H); c.font = `bold ${H * 0.55}px Impact, sans-serif`; c.lineWidth = H * 0.06; c.strokeStyle = '#101010'; c.fillStyle = '#3aa0d8'; c.save(); c.translate(W / 2, H / 2); c.rotate(-0.08); c.textAlign = 'center'; c.textBaseline = 'middle'; c.strokeText('RAT KINGS', 0, 0); c.fillText('RAT KINGS', 0, 0); c.restore(); },
    graffiti2: (c, W, H) => { c.clearRect(0, 0, W, H); c.font = `italic bold ${H * 0.5}px "Comic Sans MS", cursive`; c.fillStyle = '#e0d020'; c.save(); c.translate(W / 2, H / 2); c.rotate(0.05); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('LUPINO RULES', 0, 0); c.restore(); },
    graffiti3: (c, W, H) => { c.clearRect(0, 0, W, H); c.strokeStyle = '#d02a8a'; c.lineWidth = H * 0.08; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i < 8; i++) c.lineTo(W * (0.1 + i * 0.11), H * (0.5 + Math.sin(i * 1.7) * 0.3)); c.stroke(); },
    blood1: (c, W, H) => { c.clearRect(0, 0, W, H); const r = new M.RNG(7); c.fillStyle = 'rgba(90,5,5,0.9)'; c.beginPath(); c.ellipse(W / 2, H / 2, W * 0.28, H * 0.22, 0.3, 0, 6.3); c.fill(); for (let i = 0; i < 26; i++) { const a = r.next() * 6.3, d = W * (0.2 + r.next() * 0.3); c.beginPath(); c.arc(W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d, W * 0.01 + r.next() * W * 0.03, 0, 6.3); c.fill(); } },
    blood_wall: (c, W, H) => { c.clearRect(0, 0, W, H); const r = new M.RNG(9); c.fillStyle = 'rgba(100,6,6,0.9)'; c.beginPath(); c.ellipse(W * 0.5, H * 0.3, W * 0.3, H * 0.16, 0, 0, 6.3); c.fill(); for (let i = 0; i < 12; i++) { const x = W * (0.25 + r.next() * 0.5); c.fillRect(x, H * 0.3, W * 0.02, H * (0.2 + r.next() * 0.6)); } },
    blood_trail: (c, W, H) => { c.clearRect(0, 0, W, H); const r = new M.RNG(11); c.fillStyle = 'rgba(80,4,4,0.85)'; for (let i = 0; i < 40; i++) { const t = i / 40; c.beginPath(); c.ellipse(W * t, H * (0.5 + Math.sin(t * 9) * 0.15), W * 0.03, H * 0.12 * (0.5 + r.next()), 0, 0, 6.3); c.fill(); } },
    scorch: (c, W, H) => { c.clearRect(0, 0, W, H); const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); g.addColorStop(0, 'rgba(0,0,0,0.95)'); g.addColorStop(0.6, 'rgba(10,8,5,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); },
    bullet: (c, W, H) => { c.clearRect(0, 0, W, H); const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.3, 'rgba(20,18,15,0.9)'); g.addColorStop(0.55, 'rgba(60,55,50,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); },
    poster_bat: (c, W, H) => { c.fillStyle = '#e8d8a0'; c.fillRect(0, 0, W, H); c.fillStyle = '#b0201a'; c.font = `bold ${H * 0.09}px Impact, sans-serif`; c.textAlign = 'center'; c.fillText('КАПИТАН', W / 2, H * 0.12); c.fillText('БЕЙСБОЛЬНАЯ БИТА', W / 2, H * 0.22); c.fillStyle = '#1a2a6a'; c.beginPath(); c.arc(W / 2, H * 0.48, W * 0.2, 0, 6.3); c.fill(); c.fillStyle = '#e8c8a0'; c.beginPath(); c.arc(W / 2, H * 0.45, W * 0.12, 0, 6.3); c.fill(); c.strokeStyle = '#6a3a1a'; c.lineWidth = W * 0.05; c.beginPath(); c.moveTo(W * 0.62, H * 0.75); c.lineTo(W * 0.85, H * 0.35); c.stroke(); c.fillStyle = '#1a1a1a'; c.font = `${H * 0.05}px Arial`; c.fillText('КАЖДУЮ СУББОТУ НА 9 КАНАЛЕ', W / 2, H * 0.92); },
    poster_address: (c, W, H) => { c.fillStyle = '#101418'; c.fillRect(0, 0, W, H); c.fillStyle = '#c8c0a8'; c.font = `italic ${H * 0.085}px Georgia, serif`; c.textAlign = 'center'; c.fillText('Адрес неизвестен', W / 2, H * 0.14); c.strokeStyle = '#c8c0a8'; c.lineWidth = 2; c.strokeRect(W * 0.2, H * 0.25, W * 0.6, H * 0.5); c.fillStyle = '#6a0a0a'; c.beginPath(); c.arc(W / 2, H * 0.5, W * 0.12, 0, 6.3); c.fill(); c.fillStyle = '#c8c0a8'; c.font = `${H * 0.045}px Georgia, serif`; c.fillText('Новый сезон. Понедельник, полночь.', W / 2, H * 0.88); },
    poster_lords: (c, W, H) => { c.fillStyle = '#5a1a3a'; c.fillRect(0, 0, W, H); c.fillStyle = '#f0d890'; c.font = `bold italic ${H * 0.08}px Georgia, serif`; c.textAlign = 'center'; c.fillText('Лорды и леди', W / 2, H * 0.14); c.fillStyle = '#e8c8b0'; c.beginPath(); c.ellipse(W * 0.38, H * 0.48, W * 0.12, H * 0.16, 0, 0, 6.3); c.fill(); c.beginPath(); c.ellipse(W * 0.62, H * 0.5, W * 0.12, H * 0.16, 0, 0, 6.3); c.fill(); c.font = `${H * 0.045}px Georgia, serif`; c.fillText('Страсть. Интриги. Парики.', W / 2, H * 0.88); },
    poster_subway: (c, W, H) => { c.fillStyle = '#f0ece0'; c.fillRect(0, 0, W, H); c.strokeStyle = '#111'; c.lineWidth = 3; c.strokeRect(4, 4, W - 8, H - 8); const cols = ['#d02a1a', '#1a5ab0', '#1a9a3a', '#e0a010']; cols.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 6; c.beginPath(); c.moveTo(W * 0.1, H * (0.2 + i * 0.18)); c.bezierCurveTo(W * 0.4, H * (0.1 + i * 0.2), W * 0.6, H * (0.4 + i * 0.1), W * 0.9, H * (0.3 + i * 0.15)); c.stroke(); }); c.fillStyle = '#111'; c.font = `bold ${H * 0.06}px Arial`; c.fillText('СХЕМА ЛИНИЙ', W * 0.08, H * 0.1); },
    poster_valkyr: (c, W, H) => { c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, W, H); c.fillStyle = '#d8d8d8'; c.font = `bold ${H * 0.12}px Georgia, serif`; c.textAlign = 'center'; c.fillText('RAGNA ROCK', W / 2, H * 0.2); c.fillStyle = '#8a0a0a'; c.beginPath(); c.moveTo(W / 2, H * 0.3); c.lineTo(W * 0.3, H * 0.75); c.lineTo(W * 0.7, H * 0.75); c.closePath(); c.fill(); c.fillStyle = '#d8d8d8'; c.font = `${H * 0.05}px Georgia`; c.fillText('КАЖДУЮ НОЧЬ ДО РАССВЕТА', W / 2, H * 0.9); },
    pentagram: (c, W, H) => { c.clearRect(0, 0, W, H); c.strokeStyle = 'rgba(150,10,10,0.9)'; c.lineWidth = W * 0.012; c.beginPath(); c.arc(W / 2, H / 2, W * 0.46, 0, 6.3); c.stroke(); c.beginPath(); c.arc(W / 2, H / 2, W * 0.4, 0, 6.3); c.stroke(); c.beginPath(); for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; c.lineTo(W / 2 + Math.cos(a) * W * 0.4, H / 2 + Math.sin(a) * H * 0.4); } c.stroke(); c.fillStyle = 'rgba(150,10,10,0.9)'; c.font = `${W * 0.05}px serif`; c.textAlign = 'center'; const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ'; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.fillText(runes[i], W / 2 + Math.cos(a) * W * 0.43, H / 2 + Math.sin(a) * H * 0.43 + W * 0.018); } },
    runes: (c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(160,20,20,0.85)'; c.font = `${H * 0.7}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ᚠᛖᚾᚱᛁᚱ', W / 2, H / 2); },
    exit: (c, W, H) => { c.fillStyle = '#0a4a1a'; c.fillRect(0, 0, W, H); c.fillStyle = '#6aff8a'; c.font = `bold ${H * 0.6}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ВЫХОД', W / 2, H / 2); },
    clock: (c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = '#e8e4d8'; c.beginPath(); c.arc(W / 2, H / 2, W * 0.45, 0, 6.3); c.fill(); c.strokeStyle = '#222'; c.lineWidth = W * 0.05; c.stroke(); c.lineWidth = W * 0.04; c.beginPath(); c.moveTo(W / 2, H / 2); c.lineTo(W / 2, H * 0.2); c.stroke(); c.beginPath(); c.moveTo(W / 2, H / 2); c.lineTo(W * 0.72, H * 0.55); c.stroke(); },
    painting: (c, W, H) => { c.fillStyle = '#6a4a1a'; c.fillRect(0, 0, W, H); c.fillStyle = '#2a3a4a'; c.fillRect(W * 0.08, H * 0.08, W * 0.84, H * 0.84); const g = c.createLinearGradient(0, H * 0.08, 0, H * 0.92); g.addColorStop(0, '#6a7a8a'); g.addColorStop(1, '#2a3020'); c.fillStyle = g; c.fillRect(W * 0.08, H * 0.08, W * 0.84, H * 0.84); c.fillStyle = '#1a2010'; c.beginPath(); c.moveTo(W * 0.08, H * 0.7); c.lineTo(W * 0.4, H * 0.5); c.lineTo(W * 0.7, H * 0.65); c.lineTo(W * 0.92, H * 0.55); c.lineTo(W * 0.92, H * 0.92); c.lineTo(W * 0.08, H * 0.92); c.fill(); },
    photo: (c, W, H) => { c.fillStyle = '#f0ece0'; c.fillRect(0, 0, W, H); c.fillStyle = '#8a7a6a'; c.fillRect(W * 0.08, H * 0.08, W * 0.84, H * 0.7); c.fillStyle = '#d8b898'; c.beginPath(); c.arc(W * 0.4, H * 0.38, W * 0.12, 0, 6.3); c.fill(); c.beginPath(); c.arc(W * 0.62, H * 0.42, W * 0.1, 0, 6.3); c.fill(); },
    window_night: (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a1020'); g.addColorStop(1, '#2a3444'); c.fillStyle = g; c.fillRect(0, 0, W, H); const r = new M.RNG(4); c.fillStyle = '#05070c'; for (let i = 0; i < 6; i++) { const x = r.next() * W, w = W * (0.1 + r.next() * 0.2), h = H * (0.3 + r.next() * 0.6); c.fillRect(x, H - h, w, h); } c.fillStyle = '#d8b070'; for (let i = 0; i < 30; i++) c.fillRect(r.next() * W, H * (0.4 + r.next() * 0.55), 2, 3); c.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 60; i++) c.fillRect(r.next() * W, r.next() * H, 1.5, 1.5); c.strokeStyle = '#2a2018'; c.lineWidth = W * 0.04; c.strokeRect(0, 0, W, H); c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke(); },
    roscoe: (c, W, H) => { c.fillStyle = '#1a3a2a'; c.fillRect(0, 0, W, H); c.strokeStyle = '#d8d4c0'; c.lineWidth = H * 0.06; c.strokeRect(H * 0.08, H * 0.08, W - H * 0.16, H - H * 0.16); c.fillStyle = '#e8e4d0'; c.font = `bold ${H * 0.42}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('РОСКО-СТРИТ', W / 2, H * 0.52); },
    neon_hotel: (c, W, H) => { c.clearRect(0, 0, W, H); c.font = `bold ${H * 0.75}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#ff4a4a'; c.shadowBlur = H * 0.2; c.fillStyle = '#ff7a6a'; c.fillText('HOTEL', W / 2, H / 2); c.fillStyle = 'rgba(40,10,10,0.8)'; c.fillText('    E  ', W / 2, H / 2); },
    neon_ragna: (c, W, H) => { c.clearRect(0, 0, W, H); c.font = `bold ${H * 0.6}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#6a8aff'; c.shadowBlur = H * 0.25; c.fillStyle = '#b8c8ff'; c.fillText('RAGNA ROCK', W / 2, H / 2); },
    neon_bar: (c, W, H) => { c.clearRect(0, 0, W, H); c.font = `italic bold ${H * 0.6}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#ff40c0'; c.shadowBlur = H * 0.25; c.fillStyle = '#ffa0e0'; c.fillText('Cocktails', W / 2, H / 2); },
    neon_shop: (c, W, H) => { c.clearRect(0, 0, W, H); c.font = `bold ${H * 0.55}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#40ff80'; c.shadowBlur = H * 0.25; c.fillStyle = '#a0ffb0'; c.fillText('OPEN 24 HRS', W / 2, H / 2); },
    newspaper: (c, W, H) => { c.fillStyle = '#d8d4c4'; c.fillRect(0, 0, W, H); c.fillStyle = '#222'; c.font = `bold ${H * 0.12}px Georgia`; c.fillText('NY DAILY', W * 0.08, H * 0.16); for (let i = 0; i < 10; i++) c.fillRect(W * 0.08, H * (0.28 + i * 0.065), W * (0.5 + (i % 3) * 0.12), H * 0.02); },
    cardboard: (c, W, H) => { c.fillStyle = '#9a7a4a'; c.fillRect(0, 0, W, H); c.fillStyle = '#6a4a2a'; c.fillRect(0, H * 0.45, W, H * 0.1); },
    stripes_warn: (c, W, H) => { for (let i = -2; i < 12; i++) { c.fillStyle = i % 2 ? '#e0b020' : '#111'; c.beginPath(); c.moveTo(i * W / 8, 0); c.lineTo(i * W / 8 + W / 8, 0); c.lineTo(i * W / 8 + W / 8 - H, H); c.lineTo(i * W / 8 - H, H); c.fill(); } },
    vent: (c, W, H) => { c.fillStyle = '#4a4c4a'; c.fillRect(0, 0, W, H); c.fillStyle = '#111'; for (let i = 0; i < 6; i++) c.fillRect(W * 0.1, H * (0.12 + i * 0.13), W * 0.8, H * 0.07); },
    keypad: (c, W, H) => { c.fillStyle = '#3a3c3a'; c.fillRect(0, 0, W, H); c.fillStyle = '#1a2a1a'; c.fillRect(W * 0.12, H * 0.08, W * 0.76, H * 0.18); c.fillStyle = '#3aff6a'; c.font = `${H * 0.12}px monospace`; c.fillText('----', W * 0.2, H * 0.22); c.fillStyle = '#c8c8c0'; for (let i = 0; i < 12; i++) c.fillRect(W * (0.15 + (i % 3) * 0.25), H * (0.34 + Math.floor(i / 3) * 0.16), W * 0.2, H * 0.12); },
    sigil: (c, W, H) => { DECALS.pentagram(c, W, H); },
    note: (c, W, H) => { c.fillStyle = '#ece6d4'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(40,40,90,0.8)'; c.lineWidth = 3; const r = new M.RNG(4); for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(W * 0.1, H * (0.12 + i * 0.09)); for (let x = 0.1; x < 0.9; x += 0.05) c.lineTo(W * x, H * (0.12 + i * 0.09) + r.range(-3, 3)); c.stroke(); } },
    paper: (c, W, H) => { c.fillStyle = '#e4dcc8'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(30,30,30,0.7)'; for (let i = 0; i < 12; i++) c.fillRect(W * 0.1, H * (0.1 + i * 0.07), W * (0.5 + (i * 37 % 30) / 100), H * 0.015); }
  };

  class Textures {
    constructor(gl) {
      this.gl = gl;
      this.cache = new Map();
      this.info = new Map();
      this.missing = new Set();
    }
    canvas(W, H) {
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H || W;
      return cv;
    }
    upload(cv, o) {
      const gl = this.gl;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      const wrap = o && o.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, o && o.clampT ? gl.CLAMP_TO_EDGE : wrap);
      if (o && o.nearest) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      } else {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        const ext = gl.getExtension('EXT_texture_filter_anisotropic');
        if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      }
      return t;
    }
    matInfo(name) {
      if (this.info.has(name)) return this.info.get(name);
      const def = MATS[name] || (name && name.startsWith('facade_emit') ? null : null);
      const info = def ? { m: def.m, fit: !!def.fit, alpha: !!def.alpha, emissive: def.emissive || 0 } : { m: 2, fit: false, alpha: false, emissive: 0 };
      this.info.set(name, info);
      return info;
    }
    get(name) {
      if (this.cache.has(name)) return this.cache.get(name);
      let def = MATS[name];
      if (!def) {
        this.missing.add(name);
        def = { s: 64, m: 1, draw: (c, S) => { c.fillStyle = '#8a4a8a'; c.fillRect(0, 0, S, S); c.fillStyle = '#4a2a4a'; c.fillRect(0, 0, S / 2, S / 2); c.fillRect(S / 2, S / 2, S / 2, S / 2); } };
      }
      const cv = this.canvas(def.s);
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      def.draw(ctx, def.s, {});
      const t = this.upload(cv);
      this.cache.set(name, t);
      return t;
    }
    emitMap(name) {
      const key = name + '#emit';
      if (this.cache.has(key)) return this.cache.get(key);
      const def = MATS[name];
      if (!def || !def.lit) return null;
      const cv = this.canvas(def.s);
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      def.draw(ctx, def.s, { emit: true });
      const t = this.upload(cv);
      this.cache.set(key, t);
      return t;
    }
    decal(name) {
      if (this.cache.has('d:' + name)) return this.cache.get('d:' + name);
      let W = 256, H = 256;
      let cv;
      if (name.startsWith('sign:')) {
        const s = name.slice(5);
        W = 512; H = 128;
        cv = this.canvas(W, H);
        text(cv.getContext('2d'), 0, W, H, s, {});
      } else if (name.startsWith('signr:')) {
        const s = name.slice(6);
        W = 512; H = 128;
        cv = this.canvas(W, H);
        text(cv.getContext('2d'), 0, W, H, s, { bg: '#6a1010', border: '#e8d8c8' });
      } else if (name.startsWith('signw:')) {
        const s = name.slice(6);
        W = 512; H = 128;
        cv = this.canvas(W, H);
        text(cv.getContext('2d'), 0, W, H, s, { bg: '#e8e4d8', border: '#222', fg: '#1a1a1a' });
      } else if (name.startsWith('neon:')) {
        const s = name.slice(5);
        W = 512; H = 128;
        cv = this.canvas(W, H);
        const c = cv.getContext('2d');
        c.font = `bold ${H * 0.55}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#ff5a8a'; c.shadowBlur = H * 0.25; c.fillStyle = '#ffc0d0'; c.fillText(s, W / 2, H / 2);
      } else {
        const f = DECALS[name];
        if (/^(neon_|exit)/.test(name) || name === 'roscoe') { W = 512; H = 128; }
        if (name.startsWith('poster') || name === 'newspaper' || name === 'photo' || name === 'painting') { W = 256; H = 360; }
        cv = this.canvas(W, H);
        const c = cv.getContext('2d');
        if (f) f(c, W, H);
        else { c.fillStyle = '#f0f'; c.fillRect(0, 0, W, H); this.missing.add('decal:' + name); }
      }
      const t = this.upload(cv, { clamp: true });
      this.cache.set('d:' + name, t);
      return t;
    }
    dispose() {
      for (const t of this.cache.values()) if (t) this.gl.deleteTexture(t);
      this.cache.clear();
    }
  }
  M.Textures = Textures;
  M.MATS = MATS;
  M.DECALS = DECALS;
  M.texUtil = { fbm, shade, speckle, stains, bricks, tiles, planks, noiseGen };
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
