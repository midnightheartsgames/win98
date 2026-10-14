/**
 * S.T.A.L.K.E.R. 98 — procedural textures drawn on canvases at start-up (late-90s look: 128 px, gritty, dirty).
 */
(function (S) {
  'use strict';
  const R = S.RNG(4242);
  function cv(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  const rr = (a, b) => a + (b - a) * R();
  const col = (r, g, b, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
  // per-pixel noise tint over existing content
  function grain(ctx, w, h, amt, scale = 1) {
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = (S.fbm(x / (8 * scale), y / (8 * scale), 7, 3) - 0.5) * amt * 2 + (R() - 0.5) * amt;
      const k = (y * w + x) * 4; d[k] = Math.max(0, Math.min(255, d[k] + n)); d[k + 1] = Math.max(0, Math.min(255, d[k + 1] + n)); d[k + 2] = Math.max(0, Math.min(255, d[k + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
  }
  function stains(ctx, w, h, n, c, r0 = 4, r1 = 18) { for (let i = 0; i < n; i++) { const x = R() * w, y = R() * h, r = rr(r0, r1), g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); } }
  // tileable: draw at wrapped offsets
  function wrapDraw(w, h, fn) { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) fn(ox, oy); }
  function fill(ctx, w, h, c) { ctx.fillStyle = c; ctx.fillRect(0, 0, w, h); }

  const MAKERS = {
    terrain(c, x) { fill(x, 128, 128, '#8c8c7c'); grain(x, 128, 128, 26, 1.4); for (let i = 0; i < 500; i++) { x.strokeStyle = col(rr(90, 160), rr(100, 160), rr(70, 110), 0.5); x.beginPath(); const px = R() * 128, py = R() * 128; x.moveTo(px, py); x.lineTo(px + rr(-2, 2), py - rr(2, 6)); x.stroke(); } },
    grass(c, x) { fill(x, 128, 128, '#6a7a44'); grain(x, 128, 128, 22); for (let i = 0; i < 700; i++) { x.strokeStyle = col(rr(70, 130), rr(90, 150), rr(40, 70), 0.6); x.beginPath(); const px = R() * 128, py = R() * 128; x.moveTo(px, py); x.lineTo(px + rr(-2, 2), py - rr(3, 7)); x.stroke(); } },
    soil(c, x) { fill(x, 128, 128, '#6a5a44'); grain(x, 128, 128, 30, 0.8); stains(x, 128, 128, 20, 'rgba(40,30,20,0.3)'); },
    asphalt(c, x) { fill(x, 128, 128, '#58585a'); grain(x, 128, 128, 18, 0.4); for (let i = 0; i < 6; i++) { x.strokeStyle = 'rgba(20,20,20,0.6)'; x.lineWidth = 1; x.beginPath(); let px = R() * 128, py = R() * 128; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += rr(-12, 12); py += rr(-12, 12); x.lineTo(px, py); } x.stroke(); } stains(x, 128, 128, 10, 'rgba(30,30,30,0.35)'); for (let i = 0; i < 8; i++) { x.fillStyle = 'rgba(90,110,60,0.35)'; x.fillRect(R() * 128, R() * 128, rr(2, 6), rr(1, 3)); } },
    dirtroad(c, x) { fill(x, 128, 128, '#7a6a52'); grain(x, 128, 128, 26, 0.7); x.fillStyle = 'rgba(60,50,38,0.5)'; x.fillRect(22, 0, 16, 128); x.fillRect(90, 0, 16, 128); for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(110,130,70,0.4)'; x.fillRect(rr(48, 80), R() * 128, rr(2, 5), rr(2, 6)); } stains(x, 128, 128, 12, 'rgba(50,40,30,0.4)'); },
    gravel(c, x) { fill(x, 128, 128, '#6e6a62'); for (let i = 0; i < 900; i++) { const g = rr(70, 150); x.fillStyle = col(g, g * 0.97, g * 0.92); x.beginPath(); x.arc(R() * 128, R() * 128, rr(0.8, 2.4), 0, 7); x.fill(); } grain(x, 128, 128, 10); },
    concrete(c, x) { fill(x, 128, 128, '#9a9890'); grain(x, 128, 128, 16, 1.2); stains(x, 128, 128, 14, 'rgba(60,55,45,0.25)', 6, 26); for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(60,60,55,0.5)'; x.fillRect(R() * 128, R() * 128, 1.5, 1.5); } x.fillStyle = 'rgba(40,35,30,0.25)'; x.fillRect(0, 118, 128, 10); },
    fence(c, x) {
      fill(x, 128, 128, '#a09e94'); grain(x, 128, 128, 12, 1);
      x.strokeStyle = 'rgba(70,68,60,0.55)'; x.lineWidth = 2;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const cx = 16 + i * 32, cy = 22 + j * 40; x.beginPath(); x.moveTo(cx, cy - 12); x.lineTo(cx + 12, cy); x.lineTo(cx, cy + 12); x.lineTo(cx - 12, cy); x.closePath(); x.stroke(); }
      x.fillStyle = 'rgba(50,45,40,0.5)'; x.fillRect(0, 0, 3, 128); x.fillRect(0, 0, 128, 3); stains(x, 128, 128, 10, 'rgba(70,60,40,0.3)', 5, 20);
      x.fillStyle = 'rgba(40,40,40,0.3)'; x.fillRect(0, 110, 128, 18);
    },
    brick(c, x) { fill(x, 128, 128, '#7a4a3a'); for (let r = 0; r < 16; r++) for (let k = 0; k < 5; k++) { const bx = k * 32 - (r % 2) * 16, by = r * 8; x.fillStyle = col(rr(110, 150), rr(50, 70), rr(40, 55)); x.fillRect(bx + 1, by + 1, 30, 6); } grain(x, 128, 128, 14); stains(x, 128, 128, 8, 'rgba(30,20,15,0.3)'); },
    silicate(c, x) { fill(x, 128, 128, '#9a968a'); for (let r = 0; r < 16; r++) for (let k = 0; k < 5; k++) { const bx = k * 32 - (r % 2) * 16, by = r * 8; const g = rr(175, 205); x.fillStyle = col(g, g * 0.98, g * 0.9); x.fillRect(bx + 1, by + 1, 30, 6); } grain(x, 128, 128, 12); stains(x, 128, 128, 14, 'rgba(60,55,40,0.3)', 6, 22); x.fillStyle = 'rgba(40,40,30,0.3)'; x.fillRect(0, 100, 128, 28); },
    plaster(c, x) { fill(x, 128, 128, '#b8a47a'); grain(x, 128, 128, 14, 1.5); for (let i = 0; i < 7; i++) { const px = R() * 110, py = R() * 110, w = rr(10, 30), h = rr(8, 20); x.fillStyle = '#8a5a44'; x.fillRect(px, py, w, h); for (let r = 0; r < h / 5; r++) { x.fillStyle = 'rgba(60,30,20,0.5)'; x.fillRect(px, py + r * 5, w, 1); } } stains(x, 128, 128, 12, 'rgba(70,60,40,0.3)'); },
    logs(c, x) { fill(x, 128, 128, '#5a4430'); for (let r = 0; r < 8; r++) { const g = x.createLinearGradient(0, r * 16, 0, r * 16 + 16); g.addColorStop(0, '#3a2a1c'); g.addColorStop(0.3, col(rr(110, 130), rr(84, 96), rr(56, 66))); g.addColorStop(0.8, '#5a4430'); g.addColorStop(1, '#2a1e14'); x.fillStyle = g; x.fillRect(0, r * 16, 128, 16); } grain(x, 128, 128, 16, 0.6); },
    planks(c, x) { fill(x, 128, 128, '#6a5a44'); for (let k = 0; k < 8; k++) { const g = rr(90, 130); x.fillStyle = col(g, g * 0.82, g * 0.62); x.fillRect(k * 16 + 1, 0, 14, 128); x.fillStyle = 'rgba(30,20,10,0.5)'; x.fillRect(k * 16, 0, 1.5, 128); } for (let i = 0; i < 40; i++) { x.strokeStyle = 'rgba(40,30,20,0.3)'; const px = R() * 128; x.beginPath(); x.moveTo(px, R() * 128); x.lineTo(px + rr(-1, 1), R() * 128); x.stroke(); } grain(x, 128, 128, 14, 0.5); stains(x, 128, 128, 8, 'rgba(20,20,20,0.35)'); },
    metalwall(c, x) { fill(x, 128, 128, '#6a6e64'); for (let k = 0; k < 16; k++) { const g = x.createLinearGradient(k * 8, 0, k * 8 + 8, 0); g.addColorStop(0, '#50544c'); g.addColorStop(0.5, '#8a8e82'); g.addColorStop(1, '#4a4e46'); x.fillStyle = g; x.fillRect(k * 8, 0, 8, 128); } stains(x, 128, 128, 18, 'rgba(120,60,30,0.45)', 4, 16); grain(x, 128, 128, 10); },
    tin(c, x) { fill(x, 128, 128, '#6a6a66'); for (let k = 0; k < 16; k++) { const g = x.createLinearGradient(0, k * 8, 0, k * 8 + 8); g.addColorStop(0, '#4a4a46'); g.addColorStop(0.5, '#8a8a84'); g.addColorStop(1, '#4a4a46'); x.fillStyle = g; x.fillRect(0, k * 8, 128, 8); } stains(x, 128, 128, 26, 'rgba(130,60,25,0.5)', 5, 20); grain(x, 128, 128, 10); },
    slate(c, x) { fill(x, 128, 128, '#8a8a84'); for (let k = 0; k < 10; k++) { const g = x.createLinearGradient(0, k * 12.8, 0, k * 12.8 + 12.8); g.addColorStop(0, '#6a6a64'); g.addColorStop(0.5, '#a4a49c'); g.addColorStop(1, '#6a6a64'); x.fillStyle = g; x.fillRect(0, k * 12.8, 128, 12.8); } x.fillStyle = 'rgba(40,40,36,0.5)'; for (let r = 0; r < 4; r++) x.fillRect(0, r * 32, 128, 1.5); stains(x, 128, 128, 18, 'rgba(60,70,40,0.35)'); grain(x, 128, 128, 10); },
    tar(c, x) { fill(x, 128, 128, '#3a3834'); grain(x, 128, 128, 14); stains(x, 128, 128, 10, 'rgba(90,90,80,0.2)'); },
    metal(c, x) { fill(x, 128, 128, '#5a6454'); grain(x, 128, 128, 10, 0.6); stains(x, 128, 128, 22, 'rgba(120,70,40,0.45)', 3, 14); x.fillStyle = 'rgba(20,20,20,0.3)'; for (let i = 0; i < 6; i++) x.fillRect(R() * 128, 0, 1, 128); },
    rust(c, x) { fill(x, 128, 128, '#6a4a34'); grain(x, 128, 128, 24, 0.7); stains(x, 128, 128, 26, 'rgba(150,80,40,0.45)', 3, 16); stains(x, 128, 128, 14, 'rgba(60,70,60,0.4)', 8, 30); },
    tiles(c, x) { fill(x, 128, 128, '#6a6a64'); for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) { const g = rr(130, 170); x.fillStyle = col(g, g * 0.96, g * 0.88); x.fillRect(k * 16 + 1, r * 16 + 1, 14, 14); } grain(x, 128, 128, 10); stains(x, 128, 128, 12, 'rgba(50,40,30,0.3)'); },
    bark(c, x) { fill(x, 128, 128, '#4a3a2c'); for (let i = 0; i < 60; i++) { x.fillStyle = col(rr(40, 90), rr(30, 70), rr(20, 50), 0.8); x.fillRect(R() * 128, 0, rr(2, 6), 128); } grain(x, 128, 128, 16, 0.5); },
    birch(c, x) { fill(x, 128, 128, '#d8d6cc'); grain(x, 128, 128, 10); for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(30,30,30,0.85)'; x.fillRect(R() * 128, R() * 128, rr(6, 20), rr(1.5, 4)); } },
    cloth(c, x) { fill(x, 128, 128, '#d0d0d0'); grain(x, 128, 128, 22, 0.35); for (let i = 0; i < 128; i += 2) { x.fillStyle = 'rgba(0,0,0,0.04)'; x.fillRect(0, i, 128, 1); } },
    garbage(c, x) { fill(x, 128, 128, '#6a6050'); for (let i = 0; i < 90; i++) { x.fillStyle = col(rr(50, 150), rr(50, 130), rr(40, 110)); x.save(); x.translate(R() * 128, R() * 128); x.rotate(R() * 6); x.fillRect(-rr(2, 8), -rr(1, 4), rr(4, 16), rr(2, 8)); x.restore(); } grain(x, 128, 128, 16); },
    water(c, x) { fill(x, 128, 128, '#3a4a44'); grain(x, 128, 128, 14, 2); for (let i = 0; i < 30; i++) { x.strokeStyle = 'rgba(160,180,170,0.25)'; x.beginPath(); const px = R() * 128, py = R() * 128; x.moveTo(px, py); x.quadraticCurveTo(px + 8, py - 2, px + 16, py); x.stroke(); } },
    sign(c, x) { fill(x, 128, 128, '#d8d0b8'); x.strokeStyle = '#303030'; x.lineWidth = 4; x.strokeRect(6, 6, 116, 116); x.fillStyle = '#c02020'; x.font = 'bold 22px Arial'; x.textAlign = 'center'; x.fillText('ЗОНА', 64, 50); x.fillStyle = '#202020'; x.font = 'bold 13px Arial'; x.fillText('ОПАСНО', 64, 76); x.beginPath(); x.arc(64, 100, 12, 0, 7); x.fillStyle = '#e0c020'; x.fill(); grain(x, 128, 128, 12); },
    // alpha textures
    leaves(c, x) { x.clearRect(0, 0, 128, 128); for (let i = 0; i < 520; i++) { const px = 64 + (R() - 0.5) * 118 * Math.sqrt(R()), py = 60 + (R() - 0.5) * 112 * Math.sqrt(R()); x.fillStyle = col(rr(60, 120), rr(90, 150), rr(30, 60), 1); x.beginPath(); x.ellipse(px, py, rr(2, 4.5), rr(1.2, 2.5), R() * 3, 0, 7); x.fill(); } x.strokeStyle = 'rgba(60,45,30,1)'; x.lineWidth = 2; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(64, 128); x.lineTo(64 + rr(-50, 50), rr(20, 90)); x.stroke(); } },
    pine(c, x) { x.clearRect(0, 0, 128, 128); for (let row = 0; row < 16; row++) { const y = 10 + row * 7, w = 8 + row * 3.6; for (let i = 0; i < w * 1.6; i++) { x.strokeStyle = col(rr(30, 60), rr(55, 90), rr(30, 50), 1); x.beginPath(); const px = 64 + (R() - 0.5) * w * 2; x.moveTo(64, y); x.lineTo(px, y + rr(4, 10)); x.stroke(); } } },
    bush(c, x) { x.clearRect(0, 0, 128, 128); for (let i = 0; i < 480; i++) { const px = 64 + (R() - 0.5) * 120 * Math.sqrt(R()), py = 80 + (R() - 0.7) * 100 * R(); x.fillStyle = col(rr(60, 110), rr(80, 130), rr(30, 60), 1); x.beginPath(); x.ellipse(px, py, rr(2, 4), rr(1.2, 2.4), R() * 3, 0, 7); x.fill(); } },
    deadbush(c, x) { x.clearRect(0, 0, 128, 128); x.lineWidth = 1.5; for (let i = 0; i < 26; i++) { x.strokeStyle = col(rr(70, 110), rr(60, 90), rr(40, 60), 1); x.beginPath(); let px = 64 + rr(-20, 20), py = 128; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += rr(-14, 14); py -= rr(12, 28); x.lineTo(px, py); } x.stroke(); } },
    grasstuft(c, x) { x.clearRect(0, 0, 128, 128); for (let i = 0; i < 90; i++) { x.strokeStyle = col(rr(90, 150), rr(110, 160), rr(50, 80), 1); x.lineWidth = rr(1, 2.2); x.beginPath(); const bx = rr(4, 124); x.moveTo(bx, 128); x.quadraticCurveTo(bx + rr(-8, 8), rr(60, 100), bx + rr(-16, 16), rr(10, 70)); x.stroke(); } },
    wire(c, x) { x.clearRect(0, 0, 128, 128); x.strokeStyle = 'rgba(150,150,140,1)'; x.lineWidth = 1.3; for (let i = -128; i < 256; i += 12) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 128); x.stroke(); x.beginPath(); x.moveTo(i + 128, 0); x.lineTo(i, 128); x.stroke(); } x.fillStyle = 'rgba(80,80,76,1)'; x.fillRect(0, 0, 128, 3); x.fillRect(62, 0, 4, 128); },
    particle(c, x) { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); },
    cloud(c, x) { const img = x.createImageData(128, 128), d = img.data; for (let yy = 0; yy < 128; yy++) for (let xx = 0; xx < 128; xx++) { let v = 0; for (const [s, a] of [[16, 0.5], [8, 0.3], [4, 0.2]]) { const u = xx / 128 * (128 / s), w = yy / 128 * (128 / s), n = 128 / s; v += a * tileNoise(u, w, n); } const k = (yy * 128 + xx) * 4; d[k] = d[k + 1] = d[k + 2] = 255; d[k + 3] = Math.max(0, Math.min(255, (v - 0.42) * 600)); } x.putImageData(img, 0, 0); }
  };
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
  S.ALPHA_TEX = { leaves: 1, pine: 1, bush: 1, deadbush: 1, grasstuft: 1, wire: 1 };
  // a sign with text (world billboard)
  S.signTexture = function (text) {
    const c = cv(256, 64), x = c.getContext('2d');
    x.fillStyle = '#d8cfb0'; x.fillRect(0, 0, 256, 64); x.strokeStyle = '#402a1a'; x.lineWidth = 5; x.strokeRect(3, 3, 250, 58);
    x.fillStyle = /ОПАСНО|DANGER|ЗАПРЕЩ|NO ENTRY|СТОЙ|STOP/.test(text) ? '#b01818' : '#202020';
    let size = 26; x.font = `bold ${size}px Arial`; while (x.measureText(text).width > 236 && size > 10) { size--; x.font = `bold ${size}px Arial`; }
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 33);
    grain(x, 256, 64, 16);
    return c;
  };
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Stalker98 = globalThis.Stalker98 || {});
