(function (S) {
  'use strict';
  const R = S.RNG(1944);
  function cv(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  const rr = (a, b) => a + (b - a) * R();
  const col = (r, g, b, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
  function grain(ctx, w, h, amt, scale = 1) {
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = (S.fbm(x / (8 * scale), y / (8 * scale), 7, 3) - 0.5) * amt * 2 + (R() - 0.5) * amt;
      const k = (y * w + x) * 4; d[k] = Math.max(0, Math.min(255, d[k] + n)); d[k + 1] = Math.max(0, Math.min(255, d[k + 1] + n)); d[k + 2] = Math.max(0, Math.min(255, d[k + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
  }
  function stains(ctx, w, h, n, c, r0 = 4, r1 = 18) { for (let i = 0; i < n; i++) { const x = R() * w, y = R() * h, r = rr(r0, r1), g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); } }
  function fill(ctx, w, h, c) { ctx.fillStyle = c; ctx.fillRect(0, 0, w, h); }
  function blocks(x, rows, perRow, base, jitter, mortar, h = 128) {
    fill(x, 128, h, mortar);
    const bh = h / rows;
    for (let r = 0; r < rows; r++) for (let k = -1; k <= perRow; k++) {
      const bw = 128 / perRow, bx = k * bw + (r % 2) * bw / 2, by = r * bh, v = rr(-jitter, jitter);
      x.fillStyle = col(base[0] + v, base[1] + v, base[2] + v); x.fillRect(bx + 1.5, by + 1.5, bw - 3, bh - 3);
    }
  }
  function cross(x, cx, cy, s, colr) { x.fillStyle = '#fff'; x.fillRect(cx - s * 0.62, cy - s * 0.18, s * 1.24, s * 0.36); x.fillRect(cx - s * 0.18, cy - s * 0.62, s * 0.36, s * 1.24); x.fillStyle = colr; x.fillRect(cx - s * 0.5, cy - s * 0.1, s, s * 0.2); x.fillRect(cx - s * 0.1, cy - s * 0.5, s * 0.2, s); }

  const MAKERS = {
    terrain(c, x) { fill(x, 128, 128, '#8c8c7c'); grain(x, 128, 128, 26, 1.4); for (let i = 0; i < 500; i++) { x.strokeStyle = col(rr(90, 160), rr(100, 160), rr(70, 110), 0.5); x.beginPath(); const px = R() * 128, py = R() * 128; x.moveTo(px, py); x.lineTo(px + rr(-2, 2), py - rr(2, 6)); x.stroke(); } },
    cobble(c, x) { fill(x, 128, 128, '#4a4640'); for (let r = 0; r < 10; r++) for (let k = 0; k < 9; k++) { const g = rr(95, 140); x.fillStyle = col(g, g * 0.96, g * 0.9); x.beginPath(); x.ellipse(k * 14.2 + (r % 2) * 7 + 7, r * 12.8 + 6.4, rr(5.5, 6.8), rr(4.5, 5.6), R(), 0, 7); x.fill(); } grain(x, 128, 128, 14); stains(x, 128, 128, 10, 'rgba(30,26,20,0.3)'); },
    dirtroad(c, x) { fill(x, 128, 128, '#7a6a52'); grain(x, 128, 128, 26, 0.7); x.fillStyle = 'rgba(60,50,38,0.5)'; x.fillRect(22, 0, 16, 128); x.fillRect(90, 0, 16, 128); stains(x, 128, 128, 12, 'rgba(50,40,30,0.4)'); },
    snowroad(c, x) { fill(x, 128, 128, '#c8c8cc'); grain(x, 128, 128, 12, 0.8); x.fillStyle = 'rgba(120,110,100,0.45)'; x.fillRect(24, 0, 14, 128); x.fillRect(90, 0, 14, 128); for (let i = 0; i < 60; i++) { x.fillStyle = 'rgba(90,80,70,0.3)'; x.fillRect(rr(24, 38), R() * 128, rr(2, 6), 1); x.fillRect(rr(90, 104), R() * 128, rr(2, 6), 1); } },
    stone(c, x) { fill(x, 128, 128, '#5a5650'); for (let r = 0; r < 6; r++) { let bx = -rr(0, 20); while (bx < 128) { const bw = rr(18, 34), v = rr(-18, 18); x.fillStyle = col(150 + v, 144 + v, 130 + v); x.fillRect(bx + 1.5, r * 21.3 + 1.5, bw - 3, 18.3); bx += bw; } } grain(x, 128, 128, 16); stains(x, 128, 128, 10, 'rgba(60,70,40,0.25)'); },
    castle(c, x) { fill(x, 128, 128, '#6a645a'); for (let r = 0; r < 5; r++) { let bx = -rr(0, 20); while (bx < 128) { const bw = rr(22, 40), v = rr(-14, 14); x.fillStyle = col(140 + v, 134 + v, 120 + v); x.fillRect(bx + 2, r * 25.6 + 2, bw - 4, 21.6); bx += bw; } } grain(x, 128, 128, 18); stains(x, 128, 128, 16, 'rgba(40,40,30,0.3)', 8, 26); },
    rock(c, x) { fill(x, 128, 128, '#6a665e'); grain(x, 128, 128, 30, 1.6); for (let i = 0; i < 18; i++) { x.strokeStyle = 'rgba(40,38,34,0.55)'; x.lineWidth = rr(1, 2); x.beginPath(); let px = R() * 128, py = R() * 128; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += rr(-14, 14); py += rr(-14, 14); x.lineTo(px, py); } x.stroke(); } },
    plaster(c, x) { fill(x, 128, 128, '#c8b89a'); grain(x, 128, 128, 14, 1.5); for (let i = 0; i < 5; i++) { const px = R() * 110, py = R() * 110, w = rr(10, 26), h = rr(8, 18); blocksPatch(x, px, py, w, h); } stains(x, 128, 128, 12, 'rgba(90,70,50,0.25)'); x.fillStyle = 'rgba(60,50,40,0.25)'; x.fillRect(0, 112, 128, 16); },
    brick(c, x) { blocks(x, 16, 4, [140, 64, 48], 18, '#6a5a50'); grain(x, 128, 128, 12); stains(x, 128, 128, 8, 'rgba(30,20,15,0.3)'); },
    concrete(c, x) { fill(x, 128, 128, '#8e8c86'); grain(x, 128, 128, 16, 1.2); stains(x, 128, 128, 14, 'rgba(60,55,45,0.25)', 6, 26); x.fillStyle = 'rgba(50,48,44,0.35)'; x.fillRect(0, 63, 128, 1.5); x.fillRect(63, 0, 1.5, 128); },
    quay(c, x) { fill(x, 128, 128, '#6e6c66'); grain(x, 128, 128, 18, 0.8); stains(x, 128, 128, 18, 'rgba(40,50,40,0.35)'); },
    planks(c, x) { fill(x, 128, 128, '#6a5a44'); for (let k = 0; k < 8; k++) { const g = rr(90, 130); x.fillStyle = col(g, g * 0.8, g * 0.6); x.fillRect(k * 16 + 1, 0, 14, 128); x.fillStyle = 'rgba(30,20,10,0.5)'; x.fillRect(k * 16, 0, 1.5, 128); } grain(x, 128, 128, 14, 0.5); },
    logs(c, x) { fill(x, 128, 128, '#5a4430'); for (let r = 0; r < 8; r++) { const g = x.createLinearGradient(0, r * 16, 0, r * 16 + 16); g.addColorStop(0, '#3a2a1c'); g.addColorStop(0.3, col(rr(110, 130), rr(84, 96), rr(56, 66))); g.addColorStop(0.8, '#5a4430'); g.addColorStop(1, '#2a1e14'); x.fillStyle = g; x.fillRect(0, r * 16, 128, 16); } grain(x, 128, 128, 16, 0.6); },
    rooftile(c, x) { fill(x, 128, 128, '#5a2a1c'); for (let r = 0; r < 10; r++) for (let k = 0; k < 8; k++) { const g = x.createLinearGradient(0, r * 12.8, 0, r * 12.8 + 12.8), v = rr(-14, 14); g.addColorStop(0, col(150 + v, 70 + v, 48 + v)); g.addColorStop(1, col(100 + v, 44 + v, 30 + v)); x.fillStyle = g; x.fillRect(k * 16 + (r % 2) * 8 + 0.5, r * 12.8, 15, 12.3); } grain(x, 128, 128, 10); stains(x, 128, 128, 10, 'rgba(40,50,30,0.3)'); },
    slate(c, x) { fill(x, 128, 128, '#3a3c40'); for (let r = 0; r < 10; r++) for (let k = 0; k < 8; k++) { const v = rr(-10, 10); x.fillStyle = col(84 + v, 86 + v, 92 + v); x.fillRect(k * 16 + (r % 2) * 8 + 0.8, r * 12.8 + 0.8, 14.4, 11.4); } grain(x, 128, 128, 8); },
    snowroof(c, x) { fill(x, 128, 128, '#d8dade'); grain(x, 128, 128, 10, 1.2); for (let i = 0; i < 20; i++) { x.fillStyle = 'rgba(120,120,130,0.25)'; x.fillRect(R() * 128, R() * 128, rr(4, 18), 1); } },
    tar(c, x) { fill(x, 128, 128, '#3a3834'); grain(x, 128, 128, 14); stains(x, 128, 128, 10, 'rgba(90,90,80,0.2)'); },
    tiles(c, x) { fill(x, 128, 128, '#3a3a36'); for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) { const dark = (r + k) % 2 === 0, g = dark ? rr(70, 90) : rr(160, 185); x.fillStyle = col(g, g * 0.96, g * 0.88); x.fillRect(k * 16 + 0.5, r * 16 + 0.5, 15, 15); } grain(x, 128, 128, 10); stains(x, 128, 128, 8, 'rgba(50,40,30,0.3)'); },
    metal(c, x) { fill(x, 128, 128, '#5a5e58'); grain(x, 128, 128, 10, 0.6); stains(x, 128, 128, 18, 'rgba(120,70,40,0.4)', 3, 14); x.fillStyle = 'rgba(20,20,20,0.3)'; for (let i = 0; i < 6; i++) x.fillRect(R() * 128, 0, 1, 128); },
    rust(c, x) { fill(x, 128, 128, '#6a4a34'); grain(x, 128, 128, 24, 0.7); stains(x, 128, 128, 26, 'rgba(150,80,40,0.45)', 3, 16); stains(x, 128, 128, 14, 'rgba(60,70,60,0.4)', 8, 30); },
    crate(c, x) { fill(x, 128, 128, '#8a7448'); for (let k = 0; k < 6; k++) { x.fillStyle = col(rr(130, 160), rr(104, 124), rr(64, 80)); x.fillRect(4, 4 + k * 20, 120, 18); } x.fillStyle = '#5a4428'; x.fillRect(0, 0, 128, 6); x.fillRect(0, 122, 128, 6); x.fillRect(0, 0, 6, 128); x.fillRect(122, 0, 6, 128); x.save(); x.translate(64, 64); x.rotate(0.78); x.fillRect(-90, -4, 180, 8); x.restore(); x.fillStyle = 'rgba(20,20,20,0.75)'; x.font = 'bold 14px Arial'; x.textAlign = 'center'; x.fillText('WH 1943', 64, 44); grain(x, 128, 128, 12, 0.5); },
    door(c, x) { fill(x, 128, 128, '#4a3220'); for (let k = 0; k < 6; k++) { x.fillStyle = col(rr(90, 110), rr(60, 72), rr(36, 46)); x.fillRect(k * 21.3 + 1, 0, 19.3, 128); } x.strokeStyle = 'rgba(20,12,6,0.8)'; x.lineWidth = 4; x.strokeRect(10, 10, 108, 50); x.strokeRect(10, 68, 108, 50); x.fillStyle = '#b09040'; x.fillRect(100, 62, 10, 6); grain(x, 128, 128, 12, 0.5); },
    metaldoor(c, x) { fill(x, 128, 128, '#4e5448'); grain(x, 128, 128, 10, 0.6); x.strokeStyle = 'rgba(20,24,18,0.8)'; x.lineWidth = 3; x.strokeRect(6, 6, 116, 116); for (const y of [20, 64, 108]) for (const xx of [14, 114]) { x.fillStyle = '#2a2e26'; x.beginPath(); x.arc(xx, y, 3, 0, 7); x.fill(); } stains(x, 128, 128, 14, 'rgba(120,70,40,0.35)', 3, 12); x.fillStyle = '#1a1a1a'; x.fillRect(96, 58, 18, 8); },
    gate(c, x) { fill(x, 128, 128, '#3a2a1a'); for (let k = 0; k < 8; k++) { x.fillStyle = col(rr(70, 90), rr(48, 60), rr(30, 38)); x.fillRect(k * 16 + 1, 0, 14, 128); } x.fillStyle = '#202020'; x.fillRect(0, 20, 128, 10); x.fillRect(0, 96, 128, 10); for (let k = 0; k < 8; k++) { x.beginPath(); x.arc(k * 16 + 8, 25, 2.5, 0, 7); x.arc(k * 16 + 8, 101, 2.5, 0, 7); x.fillStyle = '#5a5a5a'; x.fill(); } grain(x, 128, 128, 12, 0.5); },
    sandbag(c, x) { fill(x, 128, 128, '#6a5e44'); for (let r = 0; r < 5; r++) for (let k = -1; k < 4; k++) { const bx = k * 40 + (r % 2) * 20, by = r * 25.6, g = x.createRadialGradient(bx + 20, by + 10, 2, bx + 20, by + 12, 24); const v = rr(-12, 12); g.addColorStop(0, col(168 + v, 150 + v, 110 + v)); g.addColorStop(1, col(92 + v, 80 + v, 56 + v)); x.fillStyle = g; x.beginPath(); x.ellipse(bx + 20, by + 12.8, 19, 11.5, 0, 0, 7); x.fill(); } grain(x, 128, 128, 12, 0.5); },
    hay(c, x) { fill(x, 128, 128, '#a89048'); for (let i = 0; i < 700; i++) { x.strokeStyle = col(rr(150, 210), rr(130, 180), rr(60, 90), 0.7); x.beginPath(); const px = R() * 128, py = R() * 128; x.moveTo(px, py); x.lineTo(px + rr(-6, 6), py + rr(-6, 6)); x.stroke(); } },
    canvas(c, x) { fill(x, 128, 128, '#6a6a4a'); grain(x, 128, 128, 16, 0.4); for (let i = 0; i < 128; i += 3) { x.fillStyle = 'rgba(0,0,0,0.05)'; x.fillRect(0, i, 128, 1); x.fillRect(i, 0, 1, 128); } stains(x, 128, 128, 10, 'rgba(40,36,24,0.35)'); },
    banner(c, x) { fill(x, 128, 128, '#a01818'); grain(x, 128, 128, 12, 0.6); x.fillStyle = '#e8e0d0'; x.beginPath(); x.arc(64, 44, 30, 0, 7); x.fill(); cross(x, 64, 44, 40, '#141414'); x.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 128; i += 12) x.fillRect(i, 0, 2, 128); x.fillStyle = '#d8c060'; x.fillRect(0, 118, 128, 10); },
    poster(c, x) { fill(x, 128, 128, '#d8c898'); x.fillStyle = '#1a1a1a'; x.beginPath(); x.moveTo(40, 110); x.lineTo(64, 38); x.lineTo(88, 110); x.fill(); x.beginPath(); x.arc(64, 36, 14, 0, 7); x.fill(); x.fillStyle = '#b02020'; x.font = 'bold 15px Arial'; x.textAlign = 'center'; x.fillText('FEIND', 64, 18); x.fillStyle = '#e8e0c8'; x.font = 'bold 12px Arial'; x.fillText('HÖRT MIT!', 64, 124); grain(x, 128, 128, 16); },
    mapboard(c, x) { fill(x, 128, 128, '#cfc6a4'); x.strokeStyle = 'rgba(80,110,160,0.8)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 90); x.bezierCurveTo(40, 70, 70, 110, 128, 80); x.stroke(); x.strokeStyle = 'rgba(60,60,60,0.6)'; x.lineWidth = 1; for (let i = 0; i < 128; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); } x.fillStyle = '#b02020'; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(rr(10, 118), rr(10, 70)); x.lineTo(rr(10, 118), rr(10, 70)); x.lineWidth = 2; x.strokeStyle = '#b02020'; x.stroke(); } x.fillStyle = '#2a4a8a'; for (let i = 0; i < 5; i++) x.fillRect(rr(10, 110), rr(10, 110), 6, 6); grain(x, 128, 128, 10); },
    bark(c, x) { fill(x, 128, 128, '#4a3a2c'); for (let i = 0; i < 60; i++) { x.fillStyle = col(rr(40, 90), rr(30, 70), rr(20, 50), 0.8); x.fillRect(R() * 128, 0, rr(2, 6), 128); } grain(x, 128, 128, 16, 0.5); },
    birch(c, x) { fill(x, 128, 128, '#d8d6cc'); grain(x, 128, 128, 10); for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(30,30,30,0.85)'; x.fillRect(R() * 128, R() * 128, rr(6, 20), rr(1.5, 4)); } },
    cloth(c, x) { fill(x, 128, 128, '#d0d0d0'); grain(x, 128, 128, 22, 0.35); for (let i = 0; i < 128; i += 2) { x.fillStyle = 'rgba(0,0,0,0.04)'; x.fillRect(0, i, 128, 1); } },
    water(c, x) { fill(x, 128, 128, '#2a3a40'); grain(x, 128, 128, 14, 2); for (let i = 0; i < 30; i++) { x.strokeStyle = 'rgba(150,170,170,0.25)'; x.beginPath(); const px = R() * 128, py = R() * 128; x.moveTo(px, py); x.quadraticCurveTo(px + 8, py - 2, px + 16, py); x.stroke(); } },
    leaves(c, x) { x.clearRect(0, 0, 128, 128); for (let i = 0; i < 560; i++) { const px = 64 + (R() - 0.5) * 118 * Math.sqrt(R()), py = 60 + (R() - 0.5) * 112 * Math.sqrt(R()); x.fillStyle = col(rr(60, 120), rr(90, 145), rr(30, 60), 1); x.beginPath(); x.ellipse(px, py, rr(2, 4.5), rr(1.2, 2.5), R() * 3, 0, 7); x.fill(); } x.strokeStyle = 'rgba(60,45,30,1)'; x.lineWidth = 2; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(64, 128); x.lineTo(64 + rr(-50, 50), rr(20, 90)); x.stroke(); } },
    pine(c, x) { x.clearRect(0, 0, 128, 128); for (let row = 0; row < 16; row++) { const y = 10 + row * 7, w = 8 + row * 3.6; for (let i = 0; i < w * 1.6; i++) { x.strokeStyle = col(rr(30, 60), rr(55, 90), rr(30, 50), 1); x.beginPath(); const px = 64 + (R() - 0.5) * w * 2; x.moveTo(64, y); x.lineTo(px, y + rr(4, 10)); x.stroke(); } } },
    snowpine(c, x) { x.clearRect(0, 0, 128, 128); for (let row = 0; row < 16; row++) { const y = 10 + row * 7, w = 8 + row * 3.6; for (let i = 0; i < w * 1.6; i++) { const snow = R() < 0.45; x.strokeStyle = snow ? col(rr(210, 240), rr(215, 242), rr(225, 250), 1) : col(rr(30, 60), rr(50, 80), rr(35, 55), 1); x.beginPath(); const px = 64 + (R() - 0.5) * w * 2; x.moveTo(64, y); x.lineTo(px, y + rr(3, 8)); x.stroke(); } } },
    bush(c, x) { x.clearRect(0, 0, 128, 128); for (let i = 0; i < 480; i++) { const px = 64 + (R() - 0.5) * 120 * Math.sqrt(R()), py = 80 + (R() - 0.7) * 100 * R(); x.fillStyle = col(rr(60, 110), rr(80, 130), rr(30, 60), 1); x.beginPath(); x.ellipse(px, py, rr(2, 4), rr(1.2, 2.4), R() * 3, 0, 7); x.fill(); } },
    grasstuft(c, x) { x.clearRect(0, 0, 128, 128); for (let i = 0; i < 90; i++) { x.strokeStyle = col(rr(90, 150), rr(110, 160), rr(50, 80), 1); x.lineWidth = rr(1, 2.2); x.beginPath(); const bx = rr(4, 124); x.moveTo(bx, 128); x.quadraticCurveTo(bx + rr(-8, 8), rr(60, 100), bx + rr(-16, 16), rr(10, 70)); x.stroke(); } },
    wire(c, x) { x.clearRect(0, 0, 128, 128); x.strokeStyle = 'rgba(110,105,100,1)'; x.lineWidth = 1.3; for (let k = 0; k < 6; k++) { x.beginPath(); for (let i = 0; i <= 128; i += 4) x.lineTo(i, 20 + k * 18 + Math.sin(i * 0.4 + k) * 6); x.stroke(); } for (let i = 0; i < 60; i++) { const px = R() * 128, py = 14 + Math.floor(R() * 6) * 18; x.beginPath(); x.moveTo(px - 3, py - 3); x.lineTo(px + 3, py + 3); x.moveTo(px + 3, py - 3); x.lineTo(px - 3, py + 3); x.stroke(); } x.fillStyle = 'rgba(70,56,40,1)'; x.fillRect(0, 0, 5, 128); x.fillRect(123, 0, 5, 128); },
    bars(c, x) { x.clearRect(0, 0, 128, 128); x.fillStyle = '#2a2a2c'; for (let i = 0; i < 7; i++) x.fillRect(4 + i * 20, 0, 5, 128); x.fillRect(0, 0, 128, 8); x.fillRect(0, 60, 128, 7); x.fillRect(0, 120, 128, 8); x.fillStyle = 'rgba(160,160,170,0.6)'; for (let i = 0; i < 7; i++) x.fillRect(5 + i * 20, 0, 1.5, 128); },
    glass(c, x) { x.clearRect(0, 0, 128, 128); x.fillStyle = '#3a3226'; x.fillRect(0, 0, 128, 8); x.fillRect(0, 120, 128, 8); x.fillRect(0, 0, 8, 128); x.fillRect(120, 0, 8, 128); x.fillRect(60, 0, 8, 128); x.fillRect(0, 60, 128, 7); },
    particle(c, x) { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); },
    cloud(c, x) { const img = x.createImageData(128, 128), d = img.data; for (let yy = 0; yy < 128; yy++) for (let xx = 0; xx < 128; xx++) { let v = 0; for (const [s, a] of [[16, 0.5], [8, 0.3], [4, 0.2]]) { const n = 128 / s; v += a * tileNoise(xx / 128 * n, yy / 128 * n, n); } const k = (yy * 128 + xx) * 4; d[k] = d[k + 1] = d[k + 2] = 255; d[k + 3] = Math.max(0, Math.min(255, (v - 0.42) * 600)); } x.putImageData(img, 0, 0); }
  };
  function blocksPatch(x, px, py, w, h) { x.fillStyle = '#8a5a44'; x.fillRect(px, py, w, h); for (let r = 0; r < h / 5; r++) { x.fillStyle = 'rgba(60,30,20,0.5)'; x.fillRect(px, py + r * 5, w, 1); } }
  const SIZE = { particle: 64 };
  function tileNoise(u, v, n) {
    const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, s = t => t * t * (3 - 2 * t);
    const h = (a, b) => S.hash2(((a % n) + n) % n, ((b % n) + n) % n, 77);
    return S.lerp(S.lerp(h(i, j), h(i + 1, j), s(fu)), S.lerp(h(i, j + 1), h(i + 1, j + 1), s(fu)), s(fv));
  }
  S.textures = function () {
    const out = {};
    for (const k in MAKERS) { const n = SIZE[k] || 128, c = cv(n); MAKERS[k](c, c.getContext('2d')); out[k] = c; }
    return out;
  };
  S.TEX_NAMES = Object.keys(MAKERS);
  S.ALPHA_TEX = { leaves: 1, pine: 1, snowpine: 1, bush: 1, grasstuft: 1, wire: 1, bars: 1, glass: 1 };
  S.signTexture = function (text) {
    const c = cv(256, 64), x = c.getContext('2d');
    x.fillStyle = '#e8e0c8'; x.fillRect(0, 0, 256, 64); x.strokeStyle = '#1a1a1a'; x.lineWidth = 5; x.strokeRect(3, 3, 250, 58);
    x.fillStyle = '#141414';
    let size = 28; x.font = `bold ${size}px "Times New Roman", serif`; while (x.measureText(text).width > 236 && size > 10) { size--; x.font = `bold ${size}px "Times New Roman", serif`; }
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 33);
    grain(x, 256, 64, 14);
    return c;
  };
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Moh98 = globalThis.Moh98 || {});
