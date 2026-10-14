(function (O) {
  'use strict';
  const S = 128;

  function cv(w, h) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = w; c.height = h || w;
    return c;
  }

  function noiseFill(ctx, w, h, rnd, base, amp, px) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const p = px || 1;
    for (let y = 0; y < h; y += p) {
      for (let x = 0; x < w; x += p) {
        const n = (rnd() - 0.5) * amp;
        for (let yy = 0; yy < p; yy++) for (let xx = 0; xx < p; xx++) {
          const i = ((y + yy) * w + (x + xx)) * 4;
          d[i] = Math.max(0, Math.min(255, base[0] + n)); d[i + 1] = Math.max(0, Math.min(255, base[1] + n)); d[i + 2] = Math.max(0, Math.min(255, base[2] + n)); d[i + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function grain(ctx, w, h, rnd, amp, px) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const p = px || 1;
    for (let y = 0; y < h; y += p) for (let x = 0; x < w; x += p) {
      const n = (rnd() - 0.5) * amp;
      for (let yy = 0; yy < p && y + yy < h; yy++) for (let xx = 0; xx < p && x + xx < w; xx++) {
        const i = ((y + yy) * w + (x + xx)) * 4;
        d[i] = Math.max(0, Math.min(255, d[i] + n)); d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n)); d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function rgb(r, g, b, a) { return a === undefined ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`; }
  function shade(base, k) { return rgb(base[0] * k, base[1] * k, base[2] * k); }

  const GEN = {
    paving(ctx, r) {
      noiseFill(ctx, S, S, r, [196, 190, 176], 18, 2);
      ctx.strokeStyle = 'rgba(70,64,56,0.55)'; ctx.lineWidth = 2;
      for (let row = 0; row < 4; row++) {
        const y = row * 32;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke();
        const off = row % 2 ? 16 : 0;
        for (let x = off; x < S + 32; x += 48) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 32); ctx.stroke(); }
      }
      for (let i = 0; i < 40; i++) { ctx.fillStyle = rgb(120 + r() * 60, 115 + r() * 50, 100 + r() * 40, 0.25); ctx.fillRect(r() * S | 0, r() * S | 0, 4, 2); }
    },
    cobble(ctx, r) {
      ctx.fillStyle = '#5c5850'; ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 16) for (let x = (y / 16) % 2 ? -8 : 0; x < S; x += 16) {
        const k = 0.8 + r() * 0.35;
        ctx.fillStyle = shade([150, 145, 138], k);
        ctx.beginPath(); ctx.ellipse(x + 8, y + 8, 7, 6.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 4, y + 4, 5, 2);
      }
      grain(ctx, S, S, r, 14, 2);
    },
    asphalt(ctx, r) { noiseFill(ctx, S, S, r, [72, 72, 76], 26, 2); for (let i = 0; i < 30; i++) { ctx.fillStyle = 'rgba(30,30,30,0.3)'; ctx.fillRect(r() * S, r() * S, 3 + r() * 6, 1); } },
    road(ctx, r) { GEN.asphalt(ctx, r); ctx.fillStyle = '#d8c060'; ctx.fillRect(S / 2 - 2, 0, 4, S / 2); },
    concrete(ctx, r) { noiseFill(ctx, S, S, r, [170, 168, 162], 16, 2); ctx.strokeStyle = 'rgba(60,60,60,0.35)'; ctx.strokeRect(1, 1, S - 2, S - 2); for (let i = 0; i < 12; i++) { ctx.fillStyle = 'rgba(90,90,85,0.15)'; ctx.fillRect(r() * S, r() * S, 8 + r() * 14, 3 + r() * 5); } },
    tiles(ctx, r) {
      noiseFill(ctx, S, S, r, [210, 212, 216], 10, 2);
      ctx.strokeStyle = 'rgba(80,84,92,0.45)'; ctx.lineWidth = 2;
      for (let i = 0; i <= S; i += 32) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke(); }
    },
    marble(ctx, r) {
      noiseFill(ctx, S, S, r, [228, 226, 220], 10, 2);
      ctx.strokeStyle = 'rgba(150,150,160,0.35)'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); let x = r() * S, y = 0; ctx.moveTo(x, y); while (y < S) { x += (r() - 0.5) * 20; y += 10; ctx.lineTo(x, y); } ctx.stroke(); }
      ctx.strokeStyle = 'rgba(120,120,120,0.3)'; ctx.strokeRect(0, 0, S, S);
    },
    wood(ctx, r) {
      for (let y = 0; y < S; y += 16) {
        const k = 0.85 + r() * 0.25;
        ctx.fillStyle = shade([176, 132, 88], k); ctx.fillRect(0, y, S, 16);
        ctx.fillStyle = 'rgba(60,36,20,0.6)'; ctx.fillRect(0, y, S, 1);
        const x = r() * S; ctx.fillRect(x, y, 1, 16);
        for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(90,56,30,0.25)'; ctx.fillRect(r() * S, y + 2 + r() * 12, 10 + r() * 30, 1); }
      }
    },
    woodDark(ctx, r) { GEN.wood(ctx, r); ctx.fillStyle = 'rgba(40,24,14,0.55)'; ctx.fillRect(0, 0, S, S); },
    plaster(ctx, r) { noiseFill(ctx, S, S, r, [236, 232, 222], 12, 2); for (let i = 0; i < 16; i++) { ctx.fillStyle = 'rgba(120,110,100,0.07)'; ctx.fillRect(r() * S, r() * S, 10 + r() * 30, 6 + r() * 16); } },
    brick(ctx, r) {
      ctx.fillStyle = '#6a5a52'; ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 8) for (let x = (y / 8) % 2 ? -8 : 0; x < S; x += 16) {
        ctx.fillStyle = shade([172, 82, 60], 0.78 + r() * 0.35);
        ctx.fillRect(x + 1, y + 1, 14, 6);
      }
      grain(ctx, S, S, r, 12, 1);
    },
    stone(ctx, r) {
      ctx.fillStyle = '#5a564e'; ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 32) for (let x = (y / 32) % 2 ? -24 : 0; x < S; x += 48) {
        ctx.fillStyle = shade([176, 170, 156], 0.8 + r() * 0.3);
        ctx.fillRect(x + 2, y + 2, 44, 28);
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 2, y + 2, 44, 3);
      }
      grain(ctx, S, S, r, 16, 2);
    },
    roofJp(ctx, r) {
      ctx.fillStyle = '#4a5060'; ctx.fillRect(0, 0, S, S);
      for (let x = 0; x < S; x += 16) {
        const g = ctx.createLinearGradient(x, 0, x + 16, 0);
        g.addColorStop(0, '#5c6474'); g.addColorStop(0.5, '#9aa2b2'); g.addColorStop(1, '#4a5262');
        ctx.fillStyle = g; ctx.fillRect(x + 1, 0, 14, S);
      }
      for (let y = 0; y < S; y += 16) { ctx.fillStyle = 'rgba(20,24,32,0.45)'; ctx.fillRect(0, y, S, 2); }
      grain(ctx, S, S, r, 10, 2);
    },
    roofTerra(ctx, r) {
      ctx.fillStyle = '#8a3a22'; ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 16) for (let x = (y / 16) % 2 ? -8 : 0; x < S; x += 16) {
        const g = ctx.createLinearGradient(x, 0, x + 16, 0);
        g.addColorStop(0, shade([150, 60, 36], 0.9 + r() * 0.2)); g.addColorStop(0.5, shade([214, 110, 70], 0.9 + r() * 0.2)); g.addColorStop(1, shade([140, 56, 32], 1));
        ctx.fillStyle = g; ctx.fillRect(x + 1, y, 14, 15);
      }
    },
    roof(ctx, r) {
      ctx.fillStyle = '#3c3a40'; ctx.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 12) for (let x = (y / 12) % 2 ? -10 : 0; x < S; x += 20) { ctx.fillStyle = shade([96, 92, 100], 0.8 + r() * 0.35); ctx.fillRect(x + 1, y + 1, 18, 10); }
    },
    roofBlue(ctx, r) { noiseFill(ctx, S, S, r, [60, 110, 190], 14, 2); for (let y = 0; y < S; y += 12) { ctx.fillStyle = 'rgba(20,40,90,0.4)'; ctx.fillRect(0, y, S, 2); } },
    metal(ctx, r) {
      noiseFill(ctx, S, S, r, [150, 156, 164], 12, 2);
      ctx.strokeStyle = 'rgba(40,44,52,0.6)'; ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 126); ctx.strokeRect(65, 1, 62, 126);
      ctx.fillStyle = 'rgba(30,30,36,0.7)';
      for (const [x, y] of [[6, 6], [58, 6], [6, 122], [58, 122], [70, 6], [122, 6], [70, 122], [122, 122]]) ctx.fillRect(x - 1, y - 1, 3, 3);
      const g = ctx.createLinearGradient(0, 0, S, S); g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.1)'); ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    },
    metalDark(ctx, r) { GEN.metal(ctx, r); ctx.fillStyle = 'rgba(20,24,34,0.55)'; ctx.fillRect(0, 0, S, S); },
    grate(ctx, r) {
      ctx.fillStyle = '#2a2c30'; ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#7a7e86';
      for (let i = 0; i < S; i += 8) { ctx.fillRect(i, 0, 2, S); ctx.fillRect(0, i, S, 2); }
      grain(ctx, S, S, r, 10, 2);
    },
    hazard(ctx) {
      ctx.fillStyle = '#e0b020'; ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#222';
      for (let i = -S; i < S * 2; i += 32) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 16, 0); ctx.lineTo(i + 16 - S, S); ctx.lineTo(i - S, S); ctx.fill(); }
    },
    snow(ctx, r) { noiseFill(ctx, S, S, r, [236, 238, 246], 10, 2); for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(180,190,220,0.25)'; ctx.fillRect(r() * S, r() * S, 4 + r() * 10, 2); } },
    grass(ctx, r) { noiseFill(ctx, S, S, r, [96, 140, 64], 34, 2); for (let i = 0; i < 90; i++) { ctx.fillStyle = r() < 0.5 ? 'rgba(150,190,90,0.5)' : 'rgba(50,90,40,0.5)'; ctx.fillRect(r() * S, r() * S, 1, 3); } },
    dirt(ctx, r) { noiseFill(ctx, S, S, r, [140, 112, 80], 28, 2); for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(90,70,50,0.35)'; ctx.fillRect(r() * S, r() * S, 3, 3); } },
    sand(ctx, r) { noiseFill(ctx, S, S, r, [222, 200, 150], 18, 2); },
    rock(ctx, r) {
      noiseFill(ctx, S, S, r, [138, 128, 116], 30, 4);
      ctx.strokeStyle = 'rgba(50,44,40,0.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) { ctx.beginPath(); let x = r() * S, y = r() * S; ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 30; ctx.lineTo(x, y); } ctx.stroke(); }
    },
    water(ctx, r) {
      noiseFill(ctx, S, S, r, [40, 110, 160], 12, 4);
      ctx.strokeStyle = 'rgba(200,240,255,0.35)';
      for (let i = 0; i < 24; i++) { const x = r() * S, y = r() * S; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - 3, x + 12, y); ctx.stroke(); }
    },
    glass(ctx) {
      const g = ctx.createLinearGradient(0, 0, S, S); g.addColorStop(0, '#9cc8e8'); g.addColorStop(0.5, '#406890'); g.addColorStop(1, '#88b4d8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
      ctx.strokeStyle = 'rgba(30,40,50,0.8)'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, S, S); ctx.beginPath(); ctx.moveTo(S / 2, 0); ctx.lineTo(S / 2, S); ctx.stroke();
    },
    window(ctx) {
      ctx.fillStyle = '#3a2a1e'; ctx.fillRect(0, 0, S, S);
      const g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#8ab0d0'); g.addColorStop(1, '#2c4058');
      ctx.fillStyle = g; ctx.fillRect(10, 10, S - 20, S - 20);
      ctx.fillStyle = '#3a2a1e'; ctx.fillRect(S / 2 - 4, 10, 8, S - 20); ctx.fillRect(10, S / 2 - 4, S - 20, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(16, 16, 20, 40);
    },
    windowLit(ctx) {
      ctx.fillStyle = '#2a1c12'; ctx.fillRect(0, 0, S, S);
      const g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#ffe7a0'); g.addColorStop(1, '#e89a40');
      ctx.fillStyle = g; ctx.fillRect(10, 10, S - 20, S - 20);
      ctx.fillStyle = '#2a1c12'; ctx.fillRect(S / 2 - 4, 10, 8, S - 20); ctx.fillRect(10, S / 2 - 4, S - 20, 8);
    },
    shoji(ctx) {
      ctx.fillStyle = '#4a2e1c'; ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#f4ead4'; ctx.fillRect(8, 8, S - 16, S - 16);
      ctx.fillStyle = '#5a3a22';
      for (let i = 1; i < 4; i++) { ctx.fillRect(8 + i * (S - 16) / 4 - 2, 8, 4, S - 16); ctx.fillRect(8, 8 + i * (S - 16) / 4 - 2, S - 16, 4); }
    },
    shojiLit(ctx) { GEN.shoji(ctx); ctx.fillStyle = 'rgba(255,190,90,0.45)'; ctx.fillRect(8, 8, S - 16, S - 16); },
    door(ctx, r) {
      ctx.fillStyle = '#3a2618'; ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#7a5030'; ctx.fillRect(8, 6, S - 16, S - 6);
      ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 3; ctx.strokeRect(20, 18, S - 40, 40); ctx.strokeRect(20, 70, S - 40, 46);
      ctx.fillStyle = '#d0b060'; ctx.fillRect(S - 28, 64, 6, 6);
      grain(ctx, S, S, r, 10, 2);
    },
    shutter(ctx) { ctx.fillStyle = '#2c6a8a'; ctx.fillRect(0, 0, S, S); ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let y = 6; y < S; y += 10) ctx.fillRect(4, y, S - 8, 3); ctx.strokeStyle = '#1a3a4a'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, S - 4, S - 4); ctx.beginPath(); ctx.moveTo(S / 2, 0); ctx.lineTo(S / 2, S); ctx.stroke(); },
    spawnfield(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, S); g.addColorStop(0, 'rgba(120,200,255,0.02)'); g.addColorStop(1, 'rgba(120,200,255,0.3)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = 'rgba(200,240,255,0.35)';
      for (let y = 0; y < S; y += 32) ctx.fillRect(0, y, S, 2);
      ctx.fillStyle = 'rgba(220,245,255,0.7)'; ctx.fillRect(0, S - 4, S, 4); ctx.fillRect(0, 0, 3, S); ctx.fillRect(S - 3, 0, 3, S);
    },
    fabric(ctx) { for (let x = 0; x < S; x += 32) { ctx.fillStyle = '#e8e2d0'; ctx.fillRect(x, 0, 16, S); ctx.fillStyle = '#c83a2a'; ctx.fillRect(x + 16, 0, 16, S); } },
    fabricBlue(ctx) { for (let x = 0; x < S; x += 32) { ctx.fillStyle = '#f0f0e8'; ctx.fillRect(x, 0, 16, S); ctx.fillStyle = '#2a6ac8'; ctx.fillRect(x + 16, 0, 16, S); } },
    carpet(ctx, r) { noiseFill(ctx, S, S, r, [140, 40, 40], 18, 2); ctx.strokeStyle = '#d8b040'; ctx.lineWidth = 4; ctx.strokeRect(8, 8, S - 16, S - 16); },
    leaves(ctx, r) {
      ctx.clearRect(0, 0, S, S);
      for (let i = 0; i < 260; i++) { const k = 0.6 + r() * 0.6; ctx.fillStyle = rgb(255 * k, 255 * k, 255 * k); ctx.beginPath(); ctx.arc(r() * S, r() * S, 2 + r() * 4, 0, Math.PI * 2); ctx.fill(); }
    },
    panel(ctx, r) { noiseFill(ctx, S, S, r, [226, 228, 232], 8, 2); ctx.strokeStyle = 'rgba(80,90,110,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(2, 2, S - 4, S / 2 - 4); ctx.strokeRect(2, S / 2 + 2, S - 4, S / 2 - 4); ctx.fillStyle = 'rgba(240,140,40,0.9)'; ctx.fillRect(0, S / 2 - 3, S, 6); },
    tech(ctx, r) { noiseFill(ctx, S, S, r, [60, 66, 80], 10, 2); ctx.strokeStyle = 'rgba(90,200,255,0.8)'; ctx.lineWidth = 2; ctx.strokeRect(10, 10, S - 20, S - 20); ctx.fillStyle = 'rgba(90,200,255,0.5)'; ctx.fillRect(20, S - 30, S - 40, 6); },
    lantern(ctx) { const g = ctx.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2); g.addColorStop(0, '#fff2c0'); g.addColorStop(1, '#e03a20'); ctx.fillStyle = g; ctx.fillRect(0, 0, S, S); ctx.fillStyle = 'rgba(60,20,10,0.5)'; for (let y = 8; y < S; y += 16) ctx.fillRect(0, y, S, 2); },
    clay(ctx, r) { noiseFill(ctx, S, S, r, [200, 150, 110], 16, 2); },
    dome(ctx, r) { noiseFill(ctx, S, S, r, [210, 190, 90], 20, 2); for (let x = 0; x < S; x += 16) { ctx.fillStyle = 'rgba(80,60,20,0.3)'; ctx.fillRect(x, 0, 2, S); } },
    rust(ctx, r) { noiseFill(ctx, S, S, r, [140, 80, 50], 36, 4); },
    crate(ctx, r) {
      GEN.wood(ctx, r);
      ctx.strokeStyle = '#4a2e18'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, S - 10, S - 10);
      ctx.beginPath(); ctx.moveTo(8, 8); ctx.lineTo(S - 8, S - 8); ctx.stroke();
    },
    papel(ctx) {
      ctx.clearRect(0, 0, S, S);
      const cols = ['#e83a5a', '#f0c030', '#30b0e0', '#50c050', '#e070d0', '#f07030'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = cols[i % cols.length];
        const x = i * 32;
        ctx.fillRect(x + 2, 0, 28, 44);
        ctx.clearRect(x + 8, 10, 6, 6); ctx.clearRect(x + 18, 10, 6, 6); ctx.clearRect(x + 12, 22, 8, 8);
        ctx.beginPath(); ctx.moveTo(x + 2, 44); ctx.lineTo(x + 8, 52); ctx.lineTo(x + 16, 44); ctx.lineTo(x + 24, 52); ctx.lineTo(x + 30, 44); ctx.fill();
      }
    },
    neonSign(ctx) { ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, S, S); },
    poster(ctx, r) {
      const hue = r() * 360;
      const g = ctx.createLinearGradient(0, 0, 0, S);
      g.addColorStop(0, `hsl(${hue},60%,55%)`); g.addColorStop(1, `hsl(${(hue + 60) % 360},70%,25%)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(S / 2, S * 0.45, S * 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff4c0'; ctx.font = 'bold 18px Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('COMING SOON', S / 2, 20);
      ctx.strokeStyle = '#e8c060'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, S - 4, S - 4);
    }
  };

  const SCALE = {
    paving: 2, cobble: 1.6, asphalt: 5, road: 4, concrete: 3, tiles: 1.6, marble: 2.4, wood: 2, woodDark: 2, plaster: 3, brick: 1.4, stone: 2,
    roofJp: 2, roofTerra: 2, roof: 2, roofBlue: 2, metal: 2.5, metalDark: 2.5, grate: 1.2, hazard: 1, snow: 3, grass: 3, dirt: 3, sand: 3, rock: 4,
    water: 5, glass: 2, fabric: 2, fabricBlue: 2, carpet: 2, leaves: 1.5, panel: 3, tech: 2, clay: 3, dome: 2, rust: 3, crate: 1.2, lantern: 1
  };
  const ALPHA = { leaves: true, papel: true, spawnfield: true };

  const cache = new Map();
  O.Tex = {
    S, SCALE, ALPHA, GEN,
    canvas: cv,
    get(name) {
      if (cache.has(name)) return cache.get(name);
      const c = cv(S, S);
      if (!c) return null;
      const ctx = c.getContext('2d');
      const gen = GEN[name] || GEN.concrete;
      gen(ctx, O.rng(O.hash(name)));
      cache.set(name, c);
      return c;
    },
    scale(name) { return SCALE[name] || 2; },
    sign(text, o = {}) {
      const key = 'sign:' + text + ':' + (o.bg || '') + (o.fg || '') + (o.font || '') + (o.w || 4) + 'x' + (o.h || 1);
      if (cache.has(key)) return cache.get(key);
      const ratio = Math.max(1, Math.min(8, (o.w || 4) / (o.h || 1)));
      const h = 64, w = Math.min(512, Math.pow(2, Math.ceil(Math.log2(h * ratio))));
      const c = cv(w, h);
      if (!c) return null;
      const ctx = c.getContext('2d');
      ctx.fillStyle = o.bg || '#1a1a1a'; ctx.fillRect(0, 0, w, h);
      if (o.border !== false) { ctx.strokeStyle = o.border || o.fg || '#e0c060'; ctx.lineWidth = 3; ctx.strokeRect(3, 3, w - 6, h - 6); }
      ctx.fillStyle = o.fg || '#f0d070';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      let size = 44;
      ctx.font = (o.font || 'bold 44px Impact, "Arial Black", sans-serif').replace(/\d+px/, size + 'px');
      while (ctx.measureText(text).width > w - 16 && size > 10) { size -= 2; ctx.font = (o.font || 'bold 44px Impact, sans-serif').replace(/\d+px/, size + 'px'); }
      if (o.glow) { ctx.shadowColor = o.fg || '#fff'; ctx.shadowBlur = 10; }
      ctx.fillText(text, w / 2, h / 2 + 2);
      cache.set(key, c);
      return c;
    },
    fx() {
      if (cache.has('fx')) return cache.get('fx');
      const c = cv(256, 256);
      if (!c) return null;
      const ctx = c.getContext('2d');
      const cell = (i, draw) => { ctx.save(); ctx.translate((i % 4) * 64, Math.floor(i / 4) * 64); draw(); ctx.restore(); };
      cell(0, () => { const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); });
      cell(1, () => { const r = O.rng(7); for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = r() * 20; ctx.fillStyle = `rgba(255,255,255,${0.12 + r() * 0.2})`; ctx.beginPath(); ctx.arc(32 + Math.cos(a) * d, 32 + Math.sin(a) * d, 6 + r() * 10, 0, 6.28); ctx.fill(); } });
      cell(2, () => { ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(32, 32, 26, 0, 6.28); ctx.stroke(); });
      cell(3, () => { ctx.fillStyle = '#fff'; ctx.fillRect(26, 8, 12, 48); ctx.fillRect(8, 26, 48, 12); });
      cell(4, () => { ctx.fillStyle = '#fff'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, rr = i % 2 ? 10 : 30; ctx.lineTo(32 + Math.cos(a) * rr, 32 + Math.sin(a) * rr); } ctx.fill(); });
      cell(5, () => { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) { const cx = 10 + x * 22 + (y % 2) * 11, cy = 10 + y * 20; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.lineTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10); } ctx.closePath(); ctx.stroke(); } });
      cell(6, () => { const g = ctx.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); });
      cell(7, () => { const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); });
      cell(8, () => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(32, 2); ctx.lineTo(36, 28); ctx.lineTo(62, 32); ctx.lineTo(36, 36); ctx.lineTo(32, 62); ctx.lineTo(28, 36); ctx.lineTo(2, 32); ctx.lineTo(28, 28); ctx.fill(); });
      cell(9, () => { const g = ctx.createRadialGradient(32, 32, 16, 32, 32, 31); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); });
      cell(10, () => { const r = O.rng(11); for (let i = 0; i < 40; i++) { ctx.fillStyle = ['#e83a5a', '#f0c030', '#30b0e0', '#50c050', '#e070d0'][i % 5]; ctx.fillRect(r() * 60, r() * 60, 4, 3); } });
      cell(11, () => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(32, 4); ctx.bezierCurveTo(60, 20, 50, 56, 32, 60); ctx.bezierCurveTo(14, 56, 4, 20, 32, 4); ctx.fill(); });
      const pix = (i, fn) => {
        const img = ctx.createImageData(64, 64);
        for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
          const v = fn((x + 0.5) / 64, (y + 0.5) / 64);
          const k = (y * 64 + x) * 4;
          img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.round(Math.max(0, Math.min(1, v[0])) * 255);
          img.data[k + 3] = Math.round(Math.max(0, Math.min(1, v[1])) * 255);
        }
        ctx.putImageData(img, (i % 4) * 64, Math.floor(i / 4) * 64);
      };
      const across = v => { const d = (v - 0.5) * 2; return Math.exp(-d * d * 7) * 0.75 + Math.max(0, 1 - Math.abs(d) * 5) * 0.6; };
      pix(12, (u, v) => [1, across(v) * Math.min(1, u * 7, (1 - u) * 7)]);
      const sr = O.rng(23), blobs = Array.from({ length: 9 }, () => [0.5 + (sr() - 0.5) * 0.4, 0.5 + (sr() - 0.5) * 0.4, 0.12 + sr() * 0.14]);
      pix(13, (u, v) => {
        const d = Math.hypot(u - 0.5, v - 0.5);
        let a = Math.max(0, 1 - d / 0.26) * 0.9;
        for (const [bx, by, br] of blobs) a = Math.max(a, Math.max(0, 1 - Math.hypot(u - bx, v - by) / br) * 0.55);
        return [d < 0.07 ? 0 : 0.25, Math.min(1, a * 1.4)];
      });
      pix(14, (u, v) => [1, across(v) * Math.pow(u, 1.6) * Math.min(1, (1 - u) * 10)]);
      pix(15, (u, v) => {
        const x = u - 0.5, y = v - 0.5, d = Math.hypot(x, y), a = Math.atan2(y, x);
        const core = Math.max(0, 1 - d / 0.14);
        const rays = Math.pow(Math.abs(Math.cos(a * 3)), 24) * Math.max(0, 1 - d / 0.5) + Math.pow(Math.abs(Math.cos(a * 3 + 0.52)), 40) * Math.max(0, 1 - d / 0.34) * 0.6;
        const halo = Math.max(0, 1 - d / 0.5) * 0.35;
        return [1, Math.min(1, core * 1.3 + rays + halo * halo * 2)];
      });
      cache.set('fx', c);
      return c;
    }
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
