(function (S) {
  'use strict';
  const R = S.RNG(2000);
  const N = 64;
  function cv(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  const rr = (a, b) => a + (b - a) * R();
  const col = (r, g, b, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
  function fill(x, c) { x.fillStyle = c; x.fillRect(0, 0, N, N); }
  function grain(x, amt, sc = 1) {
    const img = x.getImageData(0, 0, N, N), d = img.data;
    for (let y = 0; y < N; y++) for (let i = 0; i < N; i++) {
      const n = (S.fbm(i / (5 * sc), y / (5 * sc), 3, 3) - 0.5) * amt * 2 + (R() - 0.5) * amt;
      const k = (y * N + i) * 4; d[k] = Math.max(0, Math.min(255, d[k] + n)); d[k + 1] = Math.max(0, Math.min(255, d[k + 1] + n)); d[k + 2] = Math.max(0, Math.min(255, d[k + 2] + n));
    }
    x.putImageData(img, 0, 0);
  }
  function stains(x, n, c, r0 = 3, r1 = 10) { for (let i = 0; i < n; i++) { const px = R() * N, py = R() * N, r = rr(r0, r1), g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2); } }
  function blocks(x, rows, per, base, jit, mortar) {
    fill(x, mortar); const bh = N / rows;
    for (let r = 0; r < rows; r++) for (let k = -1; k <= per; k++) { const bw = N / per, bx = k * bw + (r % 2) * bw / 2, v = rr(-jit, jit); x.fillStyle = col(base[0] + v, base[1] + v, base[2] + v); x.fillRect(bx + 1, r * bh + 1, bw - 2, bh - 2); }
  }
  function planks(x, base, n, vert) { for (let k = 0; k < n; k++) { const v = rr(-16, 16); x.fillStyle = col(base[0] + v, base[1] + v * 0.8, base[2] + v * 0.6); if (vert) x.fillRect(k * N / n, 0, N / n - 1, N); else x.fillRect(0, k * N / n, N, N / n - 1); } }
  function panels(x, base, line) { fill(x, base); x.strokeStyle = line; x.lineWidth = 2; x.strokeRect(4, 4, 56, 56); x.strokeRect(10, 10, 44, 44); }

  const MAKERS = {
    plain(x) { fill(x, '#ffffff'); },
    glow(x) { fill(x, '#ffffff'); },
    stone(x) { blocks(x, 4, 2, [120, 116, 108], 14, '#4a4640'); grain(x, 14); stains(x, 6, 'rgba(40,40,30,0.3)'); },
    castlestone(x) { blocks(x, 4, 2, [128, 122, 112], 16, '#3e3a34'); grain(x, 16); stains(x, 8, 'rgba(30,30,24,0.35)'); },
    castlewall(x) { blocks(x, 5, 2, [104, 100, 96], 12, '#2e2c2a'); grain(x, 14); stains(x, 8, 'rgba(20,30,20,0.3)', 4, 14); },
    stonewall(x) { blocks(x, 6, 3, [110, 104, 96], 14, '#3a3630'); grain(x, 12); },
    marble(x) { fill(x, '#d8d4cc'); grain(x, 10, 2); x.strokeStyle = 'rgba(120,110,100,0.35)'; for (let i = 0; i < 6; i++) { x.beginPath(); let px = R() * N, py = R() * N; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += rr(-12, 12); py += rr(-12, 12); x.lineTo(px, py); } x.stroke(); } x.strokeStyle = 'rgba(80,70,60,0.35)'; x.strokeRect(0.5, 0.5, 63, 63); },
    woodfloor(x) { planks(x, [120, 76, 44], 6, false); grain(x, 12, 0.5); x.fillStyle = 'rgba(20,10,4,0.35)'; for (let k = 0; k < 6; k++) x.fillRect(((k * 23) % 64), k * 10.6, 1, 10); },
    planks(x) { planks(x, [112, 88, 60], 5, true); grain(x, 14, 0.5); },
    carpet(x) { fill(x, '#7a1418'); grain(x, 10, 0.6); x.fillStyle = '#c8a040'; x.fillRect(0, 0, 4, N); x.fillRect(60, 0, 4, N); x.fillStyle = 'rgba(40,0,0,0.3)'; for (let i = 8; i < 56; i += 8) x.fillRect(i, 0, 1, N); },
    stage(x) { fill(x, '#3a1410'); x.fillStyle = '#6a2418'; for (let i = 0; i < 4; i++) x.fillRect(i * 16 + 2, 4, 12, 56); x.fillStyle = '#c8a040'; x.fillRect(0, 0, N, 3); grain(x, 8); },
    operawall(x) { fill(x, '#5a1a1c'); x.fillStyle = '#7a2a28'; x.fillRect(8, 8, 48, 48); x.strokeStyle = '#c8a050'; x.lineWidth = 2; x.strokeRect(8, 8, 48, 48); x.fillStyle = '#2a0c0c'; x.fillRect(0, 58, N, 6); grain(x, 8); },
    ceiling(x) { fill(x, '#3a302a'); x.strokeStyle = '#8a7040'; x.lineWidth = 2; x.strokeRect(2, 2, 60, 60); x.beginPath(); x.arc(32, 32, 14, 0, 7); x.stroke(); grain(x, 10); },
    balcony(x) { fill(x, '#6a4020'); x.fillStyle = '#c8a040'; x.fillRect(0, 0, N, 5); x.fillRect(0, 58, N, 6); for (let i = 4; i < N; i += 10) x.fillRect(i, 8, 3, 48); grain(x, 8); },
    cobble(x) { fill(x, '#403c38'); for (let r = 0; r < 6; r++) for (let k = 0; k < 6; k++) { const g = rr(80, 120); x.fillStyle = col(g, g * 0.97, g * 0.92); x.beginPath(); x.ellipse(k * 10.7 + (r % 2) * 5 + 5, r * 10.7 + 5.3, rr(4, 5.2), rr(3.5, 4.6), R(), 0, 7); x.fill(); } grain(x, 10); },
    facade(x) { fill(x, '#8a7a64'); grain(x, 12, 1.5); x.fillStyle = '#2a2a38'; x.fillRect(12, 10, 14, 20); x.fillRect(38, 10, 14, 20); x.fillStyle = 'rgba(255,200,110,0.55)'; if (R() < 0.7) x.fillRect(14, 12, 10, 16); x.fillStyle = '#5a4a3a'; x.fillRect(0, 40, N, 3); x.fillRect(10, 30, 18, 2); x.fillRect(36, 30, 18, 2); stains(x, 6, 'rgba(40,40,40,0.3)'); },
    operafacade(x) { fill(x, '#c8bca4'); grain(x, 10, 1.5); x.fillStyle = '#a89878'; for (let i = 4; i < N; i += 16) x.fillRect(i, 0, 6, N); x.fillStyle = '#8a7a60'; x.fillRect(0, 0, N, 4); x.fillRect(0, 30, N, 3); },
    brick(x) { blocks(x, 8, 2, [130, 60, 44], 16, '#4a3a30'); grain(x, 10); stains(x, 6, 'rgba(20,10,5,0.3)'); },
    cratebig(x) { fill(x, '#7a6040'); x.fillStyle = '#5a4428'; x.fillRect(0, 0, N, 5); x.fillRect(0, 59, N, 5); x.fillRect(0, 0, 5, N); x.fillRect(59, 0, 5, N); x.save(); x.translate(32, 32); x.rotate(0.78); x.fillRect(-46, -3, 92, 6); x.restore(); grain(x, 12, 0.5); },
    crate(x) { MAKERS.cratebig(x); },
    shelf(x) { planks(x, [90, 66, 44], 4, false); grain(x, 10); },
    cathwall(x) { blocks(x, 4, 2, [150, 140, 126], 10, '#6a6254'); grain(x, 10); x.fillStyle = 'rgba(200,170,90,0.4)'; x.fillRect(0, 30, N, 2); },
    railing(x) { fill(x, '#3a3a40'); x.fillStyle = '#6a6a72'; for (let i = 2; i < N; i += 8) x.fillRect(i, 0, 3, N); x.fillRect(0, 0, N, 5); grain(x, 8); },
    concrete(x) { fill(x, '#6e6c68'); grain(x, 14, 1.2); stains(x, 8, 'rgba(40,40,36,0.3)', 4, 14); x.fillStyle = 'rgba(30,30,30,0.3)'; x.fillRect(0, 31, N, 1); x.fillRect(31, 0, 1, N); },
    containerR(x) { fill(x, '#8a2a20'); x.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < N; i += 6) x.fillRect(i, 0, 2, N); stains(x, 8, 'rgba(120,70,30,0.4)'); grain(x, 8); },
    containerB(x) { fill(x, '#2a4a7a'); x.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < N; i += 6) x.fillRect(i, 0, 2, N); stains(x, 8, 'rgba(120,70,30,0.4)'); grain(x, 8); },
    containerG(x) { fill(x, '#3a6a3a'); x.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < N; i += 6) x.fillRect(i, 0, 2, N); stains(x, 8, 'rgba(120,70,30,0.4)'); grain(x, 8); },
    rockfloor(x) { fill(x, '#4a3a30'); grain(x, 22, 1.5); stains(x, 10, 'rgba(20,10,5,0.4)'); x.strokeStyle = 'rgba(20,12,8,0.6)'; for (let i = 0; i < 6; i++) { x.beginPath(); let px = R() * N, py = R() * N; x.moveTo(px, py); for (let k = 0; k < 3; k++) { px += rr(-10, 10); py += rr(-10, 10); x.lineTo(px, py); } x.stroke(); } },
    rockwall(x) { fill(x, '#4e443c'); grain(x, 24, 1.8); stains(x, 10, 'rgba(15,10,8,0.45)', 4, 16); },
    rock(x) { fill(x, '#5a524a'); grain(x, 22, 1.4); stains(x, 8, 'rgba(20,20,20,0.4)'); },
    rubble(x) { MAKERS.rock(x); },
    lava(x) { fill(x, '#ff6a10'); grain(x, 40, 1.2); x.fillStyle = 'rgba(80,10,0,0.5)'; for (let i = 0; i < 12; i++) { x.beginPath(); x.ellipse(R() * N, R() * N, rr(4, 10), rr(2, 6), R() * 3, 0, 7); x.fill(); } },
    bookwall(x) { fill(x, '#2a1a10'); for (let r = 0; r < 4; r++) { let bx = 1; while (bx < 62) { const w = rr(2, 5), h = rr(10, 14); x.fillStyle = col(rr(40, 140), rr(20, 70), rr(15, 60)); x.fillRect(bx, r * 16 + 16 - h, w, h); bx += w + 0.5; } x.fillStyle = '#4a2e18'; x.fillRect(0, r * 16 + 15, N, 2); } },
    bookshelf(x) { MAKERS.bookwall(x); },
    table(x) { planks(x, [100, 62, 34], 3, true); grain(x, 8); },
    tabletop(x) { fill(x, '#6a3e20'); grain(x, 10, 0.6); x.fillStyle = '#e8dcc0'; x.fillRect(20, 16, 18, 24); x.fillStyle = 'rgba(60,40,20,0.6)'; for (let i = 0; i < 6; i++) x.fillRect(22, 19 + i * 3.5, 14, 1); },
    snow(x) { fill(x, '#d4dae2'); grain(x, 10, 1.6); stains(x, 6, 'rgba(160,170,190,0.4)', 6, 16); },
    snowtex(x) { MAKERS.snow(x); },
    ice(x) { fill(x, '#9ac0d8'); grain(x, 10, 2); x.strokeStyle = 'rgba(240,250,255,0.6)'; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(R() * N, R() * N); x.lineTo(R() * N, R() * N); x.stroke(); } },
    labtile(x) { fill(x, '#a8b0b4'); x.strokeStyle = '#6a7478'; x.lineWidth = 1; for (let i = 0; i <= N; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, N); x.moveTo(0, i); x.lineTo(N, i); x.stroke(); } grain(x, 8); stains(x, 4, 'rgba(60,80,70,0.25)'); },
    elecfloor(x) { fill(x, '#50585e'); x.strokeStyle = '#2a3034'; x.lineWidth = 2; x.strokeRect(1, 1, 62, 62); x.strokeStyle = '#6aa8d8'; x.lineWidth = 1; x.strokeRect(8, 8, 48, 48); x.beginPath(); x.moveTo(8, 32); x.lineTo(56, 32); x.moveTo(32, 8); x.lineTo(32, 56); x.stroke(); grain(x, 8); },
    labwall(x) { panels(x, '#6a7278', '#40484c'); x.fillStyle = '#3a8a6a'; x.fillRect(0, 50, N, 3); grain(x, 8); },
    labceil(x) { panels(x, '#4a5054', '#2a2e30'); x.fillStyle = '#d8f0e8'; x.fillRect(24, 28, 16, 8); },
    labmetal(x) { fill(x, '#5a6268'); grain(x, 10, 0.6); x.fillStyle = 'rgba(20,20,20,0.35)'; for (let i = 0; i < N; i += 16) x.fillRect(0, i, N, 1); for (const [a, b] of [[4, 4], [60, 4], [4, 60], [60, 60]]) { x.fillStyle = '#2a2e30'; x.fillRect(a - 1, b - 1, 3, 3); } },
    checker(x) { for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { x.fillStyle = (r + k) % 2 ? '#e0d8c8' : '#2a2224'; x.fillRect(k * 16, r * 16, 16, 16); } grain(x, 8); },
    gamewall(x) { fill(x, '#3a1e3a'); x.fillStyle = '#d8b040'; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(i * 16 + 8, 8); x.lineTo(i * 16 + 14, 16); x.lineTo(i * 16 + 8, 24); x.lineTo(i * 16 + 2, 16); x.fill(); } x.fillStyle = '#5a2a5a'; x.fillRect(0, 40, N, 24); grain(x, 8); },
    bridge(x) { blocks(x, 4, 1, [122, 118, 110], 10, '#4a4640'); grain(x, 12); stains(x, 8, 'rgba(40,50,30,0.3)'); },
    grass(x) { fill(x, '#2e3e24'); grain(x, 18, 0.8); for (let i = 0; i < 120; i++) { x.strokeStyle = col(rr(40, 80), rr(70, 110), rr(30, 50), 0.8); x.beginPath(); const px = R() * N, py = R() * N; x.moveTo(px, py); x.lineTo(px + rr(-2, 2), py - rr(2, 5)); x.stroke(); } },
    ruinfloor(x) { blocks(x, 4, 2, [106, 104, 96], 14, '#2e3a26'); grain(x, 14); stains(x, 10, 'rgba(40,70,30,0.4)'); },
    ruinwall(x) { blocks(x, 5, 2, [100, 98, 92], 14, '#34402c'); grain(x, 14); stains(x, 10, 'rgba(40,70,30,0.45)', 4, 14); },
    gold(x) { fill(x, '#c8a040'); grain(x, 20, 0.5); x.fillStyle = 'rgba(255,240,180,0.4)'; x.fillRect(0, 10, N, 4); },
    iron(x) { fill(x, '#2e2e32'); grain(x, 10); },
    metal(x) { fill(x, '#7a7a7e'); grain(x, 12, 0.6); stains(x, 8, 'rgba(120,70,40,0.35)'); },
    wood(x) { planks(x, [96, 60, 34], 4, true); grain(x, 10); },
    door(x) { fill(x, '#3a2414'); planks(x, [80, 50, 28], 4, true); x.strokeStyle = 'rgba(15,8,4,0.8)'; x.lineWidth = 3; x.strokeRect(6, 6, 22, 52); x.strokeRect(36, 6, 22, 52); x.fillStyle = '#b89040'; x.fillRect(28, 30, 8, 4); },
    curtain(x) { fill(x, '#6a0c10'); for (let i = 0; i < N; i += 8) { const g = x.createLinearGradient(i, 0, i + 8, 0); g.addColorStop(0, 'rgba(0,0,0,0.4)'); g.addColorStop(0.5, 'rgba(255,120,120,0.15)'); g.addColorStop(1, 'rgba(0,0,0,0.4)'); x.fillStyle = g; x.fillRect(i, 0, 8, N); } },
    banner(x) { fill(x, '#e8e4d8'); x.fillStyle = '#2a3a7a'; x.fillRect(0, 0, N, 10); x.fillRect(0, 54, N, 10); x.fillStyle = '#c8a040'; x.beginPath(); x.moveTo(32, 16); x.lineTo(40, 36); x.lineTo(32, 48); x.lineTo(24, 36); x.fill(); x.fillRect(30, 12, 4, 40); x.fillRect(20, 22, 24, 3); },
    stained(x) { const cs = ['#c81818', '#1848c8', '#18a848', '#d8b818', '#8818a8']; for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { x.fillStyle = cs[Math.floor(R() * cs.length)]; x.fillRect(k * 16, r * 8, 16, 8); } x.strokeStyle = '#141010'; x.lineWidth = 2; for (let i = 0; i <= N; i += 8) { x.beginPath(); x.moveTo(0, i); x.lineTo(N, i); x.stroke(); } for (let i = 0; i <= N; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, N); x.stroke(); } x.fillStyle = '#f0e0a0'; x.beginPath(); x.arc(32, 22, 9, 0, 7); x.fill(); },
    water(x) { fill(x, '#3a5a70'); grain(x, 16, 2); for (let i = 0; i < 20; i++) { x.strokeStyle = 'rgba(200,230,255,0.35)'; x.beginPath(); const px = R() * N, py = R() * N; x.moveTo(px, py); x.lineTo(px + rr(4, 10), py); x.stroke(); } },
    tankglass(x) { fill(x, '#ffffff'); x.fillStyle = 'rgba(255,255,255,0.3)'; for (let i = 0; i < 12; i++) x.fillRect(R() * N, R() * N, 2, 2); },
    glass(x) { fill(x, '#b8d8e8'); x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(6, 0, 3, N); x.fillRect(14, 0, 1, N); },
    bark(x) { fill(x, '#3a2c20'); for (let i = 0; i < 40; i++) { x.fillStyle = col(rr(30, 70), rr(24, 54), rr(16, 40), 0.9); x.fillRect(R() * N, 0, rr(1, 3), N); } grain(x, 10); },
    leaves(x) { x.clearRect(0, 0, N, N); for (let i = 0; i < 380; i++) { const px = R() * N, py = R() * N; x.fillStyle = col(rr(20, 50), rr(50, 90), rr(24, 44), 1); x.beginPath(); x.ellipse(px, py, rr(1.5, 3.2), rr(1, 2), R() * 3, 0, 7); x.fill(); } },
    vase(x) { fill(x, '#2a3a6a'); x.fillStyle = '#d8c890'; x.fillRect(0, 20, N, 4); x.fillRect(0, 40, N, 4); for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(i * 16 + 8, 32, 4, 0, 7); x.fill(); } grain(x, 8); },
    barrel(x) { planks(x, [110, 70, 40], 6, true); x.fillStyle = '#2a2a2e'; x.fillRect(0, 8, N, 4); x.fillRect(0, 52, N, 4); grain(x, 10); },
    seal(x) { x.clearRect(0, 0, N, N); x.strokeStyle = 'rgba(255,40,30,1)'; x.lineWidth = 2; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(32, 32, 6 + i * 6, R() * 3, R() * 3 + 4); x.stroke(); } x.font = 'bold 12px serif'; x.fillStyle = 'rgba(255,120,80,1)'; for (let i = 0; i < 8; i++) x.fillText('ᛟᚱᛞᛗᛉᚦ'[i % 6], R() * 56, R() * 60 + 4); },
    bars(x) { x.clearRect(0, 0, N, N); x.fillStyle = '#26262a'; for (let i = 0; i < 6; i++) x.fillRect(3 + i * 11, 0, 3, N); x.fillRect(0, 0, N, 4); x.fillRect(0, 30, N, 3); x.fillRect(0, 60, N, 4); },
    particle(x) { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, N, N); },
    spark(x) { x.clearRect(0, 0, N, N); const g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.15, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = i % 2 ? 8 : 30; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } x.fill(); },
    swoosh(x) { x.clearRect(0, 0, N, N); for (let y = 0; y < N; y++) { const v = y / N, a = Math.pow(v, 2.2) * (1 - Math.pow(v, 12)); x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect(0, y, N, 1); } }
  };

  S.textures = function () { const out = {}; for (const k in MAKERS) { const c = cv(N); MAKERS[k](c.getContext('2d')); out[k] = c; } return out; };
  S.TEX_NAMES = Object.keys(MAKERS);
  S.ALPHA_TEX = { leaves: 1, bars: 1 };
  S.BLEND_TEX = { glass: 1, tankglass: 1, water: 1 };
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
