(function (D) {
  'use strict';
  const { el, esc, clamp } = D;
  const U = D.UI.prototype;
  const rnd = (s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; });

  const ridge = (x, W, H, base, amp, seed, oct) => {
    let v = 0, a = amp, f = 1;
    for (let i = 0; i < (oct || 4); i++) { v += Math.sin(x / W * Math.PI * (2 + i * 3.1) * f + seed * (i + 1) * 1.7) * a + Math.sin(x / W * Math.PI * (5 + i * 7.3) * f + seed * 3 + i) * a * 0.5; a *= 0.5; f *= 1.9; }
    return base + v;
  };
  const sky = (g, W, H, stops) => { const gr = g.createLinearGradient(0, 0, 0, H); stops.forEach(([t, c]) => gr.addColorStop(t, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const clouds = (g, W, H, col, n, seed, yMax) => {
    const r = rnd(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = r() * H * (yMax || 0.5), w = 60 + r() * 240, h = 12 + r() * 40;
      const gr = g.createRadialGradient(x, y, 0, x, y, w);
      gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.save(); g.translate(x, y); g.scale(1, h / w); g.beginPath(); g.arc(0, 0, w, 0, 7); g.restore(); g.fill();
    }
  };
  const mountains = (g, W, H, base, amp, col, seed, oct) => {
    g.fillStyle = col;
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, ridge(x, W, H, base, amp, seed, oct));
    g.lineTo(W, H); g.closePath(); g.fill();
  };
  const sword = (g, x, y, len, ang, w, col, dark) => {
    g.save(); g.translate(x, y); g.rotate(ang);
    const gr = g.createLinearGradient(-w, 0, w, 0);
    gr.addColorStop(0, dark); gr.addColorStop(0.5, col); gr.addColorStop(1, dark);
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-w, 0); g.lineTo(w, 0); g.lineTo(w * 0.7, len * 0.92); g.lineTo(0, len); g.lineTo(-w * 0.7, len * 0.92); g.closePath(); g.fill();
    g.fillStyle = dark; g.fillRect(-w * 0.15, 4, w * 0.3, len * 0.8);
    for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-w * 0.1, 20 + i * len * 0.08, w * 0.2, len * 0.03); }
    g.fillStyle = dark;
    g.beginPath(); g.moveTo(-w * 3.4, -6); g.quadraticCurveTo(-w * 2, 10, -w * 4.2, 18); g.lineTo(-w * 3, 8); g.lineTo(w * 3, 8); g.lineTo(w * 4.2, 18); g.quadraticCurveTo(w * 2, 10, w * 3.4, -6); g.closePath(); g.fill();
    g.fillRect(-w * 0.45, -len * 0.3, w * 0.9, len * 0.3);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#1a1410' : '#3a3028'; g.fillRect(-w * 0.5, -len * 0.3 + i * len * 0.05, w, len * 0.03); }
    g.beginPath(); g.arc(0, -len * 0.32, w * 0.8, 0, 7); g.fill();
    g.restore();
  };

  const scenes = {
    menu(g, W, H, t) {
      sky(g, W, H, [[0, '#3a200e'], [0.3, '#8a4a18'], [0.5, '#c8782a'], [0.62, '#d8903a'], [1, '#2a1408']]);
      clouds(g, W, H, 'rgba(60,30,10,0.55)', 14, 7, 0.45);
      clouds(g, W, H, 'rgba(240,180,90,0.25)', 10, 11, 0.55);
      mountains(g, W, H, H * 0.58, H * 0.07, 'rgba(110,60,30,0.7)', 1.3, 5);
      mountains(g, W, H, H * 0.64, H * 0.08, 'rgba(80,40,20,0.85)', 2.7, 5);
      g.fillStyle = '#2a1608';
      g.beginPath(); g.moveTo(W * 0.62, H); g.lineTo(W * 0.66, H * 0.5); g.lineTo(W * 0.74, H * 0.36); g.lineTo(W * 0.82, H * 0.22); g.lineTo(W * 0.9, H * 0.12); g.lineTo(W, H * 0.08); g.lineTo(W, H); g.closePath(); g.fill();
      g.fillStyle = '#3a200e';
      for (let i = 0; i < 18; i++) { const y = H * 0.25 + i * H * 0.04; g.fillRect(W * 0.7 + Math.sin(i) * 30 + i * 6, y, 60, 3); }
      g.fillStyle = '#1e1008';
      g.beginPath(); g.moveTo(0, H); g.lineTo(0, H * 0.34); g.lineTo(W * 0.06, H * 0.36); g.lineTo(W * 0.14, H * 0.5); g.lineTo(W * 0.2, H * 0.62); g.lineTo(W * 0.3, H * 0.74); g.lineTo(W * 0.5, H * 0.86); g.lineTo(W * 0.66, H * 0.92); g.lineTo(W, H * 0.9); g.lineTo(W, H); g.closePath(); g.fill();
      sword(g, W * 0.31, H * 0.12, H * 0.8, 0.26, W * 0.022, '#6a6258', '#2a241e');
      sword(g, W * 0.42, H * 0.55, H * 0.42, -0.38, W * 0.01, '#5a524a', '#221c16');
      g.fillStyle = 'rgba(20,10,4,0.85)';
      for (let i = 0; i < 40; i++) { const x = W * 0.12 + i * W * 0.012, h = 10 + Math.abs(Math.sin(i * 3.7)) * 40; g.fillRect(x, H * 0.78 - h + Math.sin(i) * 10, 3, h); }
      const fog = g.createLinearGradient(0, H * 0.6, 0, H);
      fog.addColorStop(0, 'rgba(200,120,50,0)'); fog.addColorStop(1, 'rgba(60,30,10,0.6)');
      g.fillStyle = fog; g.fillRect(0, H * 0.6, W, H * 0.4);
      if (t !== undefined) for (let i = 0; i < 30; i++) { const x = (i * 97 + t * 12 * (1 + i % 3)) % W, y = H - ((i * 53 + t * 20) % H); g.fillStyle = `rgba(255,160,60,${0.3 + (i % 4) * 0.15})`; g.fillRect(x, y, 2, 2); }
    },
    castle_night(g, W, H) {
      sky(g, W, H, [[0, '#05060e'], [0.6, '#1a1428'], [1, '#0a0608']]);
      for (let i = 0; i < 80; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.2 + Math.random() * 0.6) + ')'; g.fillRect(Math.random() * W, Math.random() * H * 0.5, 1.5, 1.5); }
      g.fillStyle = '#e8e0c0'; g.beginPath(); g.arc(W * 0.8, H * 0.18, 26, 0, 7); g.fill();
      mountains(g, W, H, H * 0.72, H * 0.03, '#0c0a10', 4, 3);
      castle(g, W * 0.3, H * 0.75, W * 0.5, H * 0.4, '#141018', false);
    },
    castle_fire(g, W, H) {
      sky(g, W, H, [[0, '#0a0404'], [0.55, '#5a1a08'], [1, '#1a0602']]);
      clouds(g, W, H, 'rgba(40,20,10,0.8)', 16, 3, 0.6);
      castle(g, W * 0.25, H * 0.8, W * 0.55, H * 0.45, '#100808', true);
      for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,${120 + Math.random() * 100},40,${Math.random()})`; g.fillRect(W * 0.25 + Math.random() * W * 0.55, H * 0.4 + Math.random() * H * 0.4, 2, 2); }
    },
    escape(g, W, H) {
      sky(g, W, H, [[0, '#08060a'], [0.7, '#2a1010'], [1, '#0a0404']]);
      castle(g, W * 0.55, H * 0.62, W * 0.35, H * 0.3, '#120808', true);
      mountains(g, W, H, H * 0.78, H * 0.04, '#060404', 8, 4);
      rider(g, W * 0.22, H * 0.86, 1); rider(g, W * 0.3, H * 0.87, 0.95);
    },
    road_south(g, W, H) {
      sky(g, W, H, [[0, '#4a3a5a'], [0.5, '#d8905a'], [1, '#3a2a1a']]);
      mountains(g, W, H, H * 0.6, H * 0.08, '#5a3a3a', 5, 4);
      mountains(g, W, H, H * 0.72, H * 0.05, '#2a1a14', 9, 4);
      g.fillStyle = '#6a5038'; g.beginPath(); g.moveTo(W * 0.45, H); g.quadraticCurveTo(W * 0.5, H * 0.8, W * 0.52, H * 0.72); g.lineTo(W * 0.54, H * 0.72); g.quadraticCurveTo(W * 0.62, H * 0.85, W * 0.7, H); g.fill();
      rider(g, W * 0.55, H * 0.8, 0.6); rider(g, W * 0.6, H * 0.82, 0.62);
    },
    ostagar(g, W, H) {
      sky(g, W, H, [[0, '#3a4a6a'], [0.5, '#c89868'], [1, '#2a2018']]);
      mountains(g, W, H, H * 0.5, H * 0.1, '#5a5058', 2, 4);
      ruins(g, W, H, '#3a3028');
      g.fillStyle = '#4a3a2a'; g.fillRect(W * 0.38, H * 0.55, W * 0.26, 10);
      for (let i = 0; i < 6; i++) g.fillRect(W * 0.38 + i * W * 0.05, H * 0.55, 6, H * 0.3);
    },
    battle(g, W, H) {
      sky(g, W, H, [[0, '#040406'], [0.6, '#20181a'], [1, '#0a0606']]);
      for (let i = 0; i < 200; i++) { g.strokeStyle = 'rgba(150,160,180,0.25)'; g.beginPath(); const x = Math.random() * W, y = Math.random() * H; g.moveTo(x, y); g.lineTo(x - 4, y + 16); g.stroke(); }
      mountains(g, W, H, H * 0.7, H * 0.03, '#0a0808', 3, 3);
      for (let i = 0; i < 120; i++) { const x = Math.random() * W, y = H * 0.72 + Math.random() * H * 0.25; g.fillStyle = Math.random() < 0.5 ? '#1a1010' : '#2a1a18'; g.fillRect(x, y - 16, 5, 16); g.fillStyle = 'rgba(255,120,40,0.7)'; if (Math.random() < 0.05) g.fillRect(x, y - 22, 3, 5); }
      g.fillStyle = 'rgba(255,90,30,0.25)'; g.fillRect(0, H * 0.7, W, H * 0.3);
    },
    tower(g, W, H) {
      sky(g, W, H, [[0, '#06080e'], [0.7, '#281a20'], [1, '#0a0606']]);
      g.fillStyle = '#16121a'; g.fillRect(W * 0.45, H * 0.1, W * 0.1, H * 0.8);
      for (let i = 0; i < 6; i++) g.fillRect(W * 0.44 + i * W * 0.02, H * 0.08, W * 0.012, 14);
      g.fillStyle = '#ff9a3a'; g.beginPath(); g.arc(W * 0.5, H * 0.06, 12, 0, 7); g.fill();
      const gr = g.createRadialGradient(W * 0.5, H * 0.06, 0, W * 0.5, H * 0.06, 120); gr.addColorStop(0, 'rgba(255,150,50,0.6)'); gr.addColorStop(1, 'rgba(255,150,50,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H * 0.4);
      mountains(g, W, H, H * 0.85, H * 0.03, '#080606', 6, 3);
    },
    joining(g, W, H) {
      sky(g, W, H, [[0, '#050308'], [0.5, '#1a0a14'], [1, '#050305']]);
      g.fillStyle = '#9a9aa8'; g.beginPath(); g.moveTo(W * 0.45, H * 0.35); g.lineTo(W * 0.55, H * 0.35); g.lineTo(W * 0.52, H * 0.5); g.lineTo(W * 0.52, H * 0.62); g.lineTo(W * 0.56, H * 0.66); g.lineTo(W * 0.44, H * 0.66); g.lineTo(W * 0.48, H * 0.62); g.lineTo(W * 0.48, H * 0.5); g.closePath(); g.fill();
      g.fillStyle = '#300'; g.beginPath(); g.ellipse(W * 0.5, H * 0.36, W * 0.05, 5, 0, 0, 7); g.fill();
      const gr = g.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, W * 0.4); gr.addColorStop(0, 'rgba(120,20,40,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    },
    archdemon(g, W, H) {
      sky(g, W, H, [[0, '#0a0206'], [0.6, '#3a0a14'], [1, '#0a0206']]);
      g.fillStyle = '#060204';
      g.beginPath(); g.moveTo(W * 0.5, H * 0.3);
      g.quadraticCurveTo(W * 0.2, H * 0.1, W * 0.02, H * 0.35); g.lineTo(W * 0.25, H * 0.35); g.lineTo(W * 0.1, H * 0.5); g.lineTo(W * 0.4, H * 0.45);
      g.lineTo(W * 0.46, H * 0.62); g.lineTo(W * 0.5, H * 0.52); g.lineTo(W * 0.54, H * 0.62); g.lineTo(W * 0.6, H * 0.45);
      g.lineTo(W * 0.9, H * 0.5); g.lineTo(W * 0.75, H * 0.35); g.lineTo(W * 0.98, H * 0.35); g.quadraticCurveTo(W * 0.8, H * 0.1, W * 0.5, H * 0.3); g.fill();
      g.fillStyle = '#c33'; g.fillRect(W * 0.48, H * 0.36, 6, 3); g.fillRect(W * 0.515, H * 0.36, 6, 3);
    },
    flemeth(g, W, H) {
      sky(g, W, H, [[0, '#2a2a3a'], [0.6, '#8a6a58'], [1, '#1a1612']]);
      for (let i = 0; i < 12; i++) { const x = Math.random() * W; g.fillStyle = '#141210'; g.fillRect(x, H * 0.3 + Math.random() * 60, 8, H); }
      g.fillStyle = '#2a2018'; g.beginPath(); g.moveTo(W * 0.4, H * 0.75); g.lineTo(W * 0.5, H * 0.45); g.lineTo(W * 0.62, H * 0.75); g.fill();
      g.fillStyle = '#ffb060'; g.fillRect(W * 0.49, H * 0.62, 14, 18);
      g.fillStyle = 'rgba(40,50,40,0.5)'; g.fillRect(0, H * 0.75, W, H * 0.25);
    },
    lothering(g, W, H) {
      sky(g, W, H, [[0, '#6a7a8a'], [0.6, '#c8c0b0'], [1, '#4a4a3a']]);
      mountains(g, W, H, H * 0.62, H * 0.03, '#6a7a5a', 2, 3);
      g.fillStyle = '#5a6a3a'; g.fillRect(0, H * 0.66, W, H);
      for (let i = 0; i < 7; i++) { const x = W * 0.1 + i * W * 0.12, y = H * 0.66; g.fillStyle = '#8a7a5a'; g.fillRect(x, y - 30, 50, 30); g.fillStyle = '#6a5030'; g.beginPath(); g.moveTo(x - 6, y - 30); g.lineTo(x + 25, y - 55); g.lineTo(x + 56, y - 30); g.fill(); }
      g.fillStyle = '#a8a090'; g.fillRect(W * 0.62, H * 0.4, 40, H * 0.26); g.beginPath(); g.moveTo(W * 0.62 - 4, H * 0.4); g.lineTo(W * 0.62 + 20, H * 0.3); g.lineTo(W * 0.62 + 44, H * 0.4); g.fill();
    },
    alienage(g, W, H) {
      sky(g, W, H, [[0, '#6a7a98'], [0.6, '#c8b8a0'], [1, '#3a3028']]);
      for (let i = 0; i < 9; i++) { const x = i * W / 8 - 20; g.fillStyle = i % 2 ? '#5a4a3a' : '#6a5a48'; g.fillRect(x, H * 0.35 + (i % 3) * 20, W / 8 + 10, H); }
      g.fillStyle = '#8a8a7a'; g.beginPath(); g.moveTo(W * 0.5, H * 0.2); g.lineTo(W * 0.43, H * 0.9); g.lineTo(W * 0.57, H * 0.9); g.fill();
      g.fillStyle = '#4a6a2a'; g.beginPath(); g.arc(W * 0.5, H * 0.3, 60, 0, 7); g.fill();
    },
    wedding(g, W, H) { scenes.alienage(g, W, H); for (let i = 0; i < 40; i++) { g.fillStyle = `hsl(${Math.random() * 360},60%,60%)`; g.fillRect(Math.random() * W, Math.random() * H * 0.6, 4, 6); } },
    forest(g, W, H) {
      sky(g, W, H, [[0, '#4a6a8a'], [0.5, '#a8b890'], [1, '#1a2a14']]);
      for (let l = 0; l < 3; l++) for (let i = 0; i < 18; i++) { const x = Math.random() * W, w = 10 + l * 8; g.fillStyle = ['#3a4a30', '#2a3820', '#18220e'][l]; g.fillRect(x, H * (0.2 + l * 0.1), w, H); g.beginPath(); g.arc(x + w / 2, H * (0.2 + l * 0.1), 40 + l * 20, 0, 7); g.fill(); }
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,240,180,0.25)'); gr.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    },
    mirror(g, W, H) {
      sky(g, W, H, [[0, '#050808'], [1, '#0a1210']]);
      g.fillStyle = '#6a6a5a'; g.fillRect(W * 0.4, H * 0.15, W * 0.2, H * 0.7);
      const gr = g.createLinearGradient(0, H * 0.2, 0, H * 0.8); gr.addColorStop(0, '#3a8a7a'); gr.addColorStop(0.5, '#8af0d8'); gr.addColorStop(1, '#2a5a50');
      g.fillStyle = gr; g.fillRect(W * 0.42, H * 0.2, W * 0.16, H * 0.62);
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(160,255,230,0.5)'; g.fillRect(W * 0.35 + Math.random() * W * 0.3, H * 0.1 + Math.random() * H * 0.8, 2, 2); }
    },
    orzammar(g, W, H) {
      sky(g, W, H, [[0, '#0a0604'], [0.6, '#3a1a0a'], [1, '#0a0604']]);
      for (let i = 0; i < 5; i++) { g.fillStyle = '#1a100a'; g.fillRect(W * 0.1 + i * W * 0.2, 0, W * 0.06, H); g.fillStyle = '#6a4a1a'; g.fillRect(W * 0.1 + i * W * 0.2, H * 0.3, W * 0.06, 8); }
      g.fillStyle = '#ff7a20'; g.fillRect(0, H * 0.85, W, H * 0.15);
      const gr = g.createLinearGradient(0, H * 0.5, 0, H); gr.addColorStop(0, 'rgba(255,100,20,0)'); gr.addColorStop(1, 'rgba(255,100,20,0.5)'); g.fillStyle = gr; g.fillRect(0, H * 0.5, W, H * 0.5);
      g.fillStyle = '#2a1a10'; g.fillRect(W * 0.4, H * 0.3, W * 0.2, H * 0.55);
    },
    deeproads(g, W, H) {
      sky(g, W, H, [[0, '#050403'], [1, '#141008']]);
      g.fillStyle = '#1a1510'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.35, H * 0.3); g.lineTo(W * 0.65, H * 0.3); g.lineTo(W, 0); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      g.fillStyle = '#0a0806'; g.fillRect(W * 0.35, H * 0.3, W * 0.3, H * 0.45);
      for (let i = 0; i < 20; i++) { g.fillStyle = '#c44'; g.fillRect(W * 0.38 + Math.random() * W * 0.24, H * 0.5 + Math.random() * H * 0.2, 2, 2); }
    },
    circle(g, W, H) {
      sky(g, W, H, [[0, '#1a2030'], [0.6, '#6a7a8a'], [1, '#2a3a4a']]);
      g.fillStyle = '#3a4050'; g.fillRect(0, H * 0.7, W, H);
      g.fillStyle = '#5a6070'; g.fillRect(W * 0.46, H * 0.08, W * 0.08, H * 0.62);
      g.fillStyle = '#4a5060'; g.beginPath(); g.moveTo(W * 0.44, H * 0.1); g.lineTo(W * 0.5, 0); g.lineTo(W * 0.56, H * 0.1); g.fill();
      g.fillStyle = 'rgba(200,210,230,0.3)'; g.fillRect(0, H * 0.72, W, 3);
    },
    fade(g, W, H) {
      sky(g, W, H, [[0, '#1a0a2a'], [0.5, '#3a5a4a'], [1, '#101818']]);
      for (let i = 0; i < 8; i++) { const x = Math.random() * W, y = Math.random() * H * 0.6; g.fillStyle = '#20282a'; g.beginPath(); g.ellipse(x, y, 40 + Math.random() * 60, 14, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - 30, y); g.lineTo(x, y + 50); g.lineTo(x + 30, y); g.fill(); }
      g.fillStyle = '#0a0e10'; g.beginPath(); g.moveTo(W * 0.48, 0); g.lineTo(W * 0.52, 0); g.lineTo(W * 0.56, H); g.lineTo(W * 0.44, H); g.fill();
    },
    dusttown(g, W, H) {
      sky(g, W, H, [[0, '#050403'], [1, '#1a140c']]);
      for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#2a2014' : '#1e170e'; g.fillRect(i * W / 9, H * 0.4 + (i % 3) * 30, W / 10, H); }
      g.fillStyle = 'rgba(200,150,60,0.4)'; g.fillRect(W * 0.2, H * 0.55, 6, 8); g.fillRect(W * 0.7, H * 0.6, 6, 8);
    },
    proving(g, W, H) {
      sky(g, W, H, [[0, '#0a0604'], [0.7, '#3a2010'], [1, '#1a0e06']]);
      g.fillStyle = '#2a1a10'; g.beginPath(); g.ellipse(W / 2, H * 0.8, W * 0.45, H * 0.18, 0, 0, 7); g.fill();
      g.fillStyle = '#4a3020'; g.beginPath(); g.ellipse(W / 2, H * 0.8, W * 0.35, H * 0.12, 0, 0, 7); g.fill();
      for (let i = 0; i < 60; i++) { g.fillStyle = '#140c06'; g.fillRect(W * 0.05 + Math.random() * W * 0.9, H * 0.45 + Math.random() * H * 0.15, 5, 10); }
    },
    loading_out(g, W, H) { scenes.road_south(g, W, H); },
    loading_in(g, W, H) { scenes.castle_night(g, W, H); },
    end(g, W, H) { scenes.lothering(g, W, H); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, W, H); }
  };
  function castle(g, x, y, w, h, col, fire) {
    g.fillStyle = col;
    g.fillRect(x, y - h * 0.45, w, h * 0.45);
    g.fillRect(x - w * 0.05, y - h * 0.8, w * 0.16, h * 0.8);
    g.fillRect(x + w * 0.4, y - h, w * 0.2, h);
    g.fillRect(x + w * 0.88, y - h * 0.75, w * 0.16, h * 0.75);
    for (let i = 0; i < 14; i++) g.fillRect(x + i * w / 14, y - h * 0.5, w / 28, h * 0.06);
    if (fire) {
      for (let i = 0; i < 8; i++) { const fx = x + Math.random() * w, fy = y - Math.random() * h * 0.6; const gr = g.createRadialGradient(fx, fy, 0, fx, fy, 40); gr.addColorStop(0, 'rgba(255,160,40,0.9)'); gr.addColorStop(1, 'rgba(255,60,10,0)'); g.fillStyle = gr; g.fillRect(fx - 40, fy - 40, 80, 80); }
    } else { g.fillStyle = '#e8b040'; for (let i = 0; i < 6; i++) g.fillRect(x + w * 0.1 + i * w * 0.14, y - h * 0.3, 4, 6); }
  }
  function rider(g, x, y, s) {
    g.fillStyle = '#080506';
    g.save(); g.translate(x, y); g.scale(s, s);
    g.beginPath(); g.ellipse(0, -30, 34, 14, 0, 0, 7); g.fill();
    g.fillRect(-26, -30, 5, 30); g.fillRect(20, -30, 5, 30); g.fillRect(-12, -30, 5, 28); g.fillRect(8, -30, 5, 28);
    g.beginPath(); g.moveTo(26, -38); g.lineTo(46, -58); g.lineTo(52, -52); g.lineTo(34, -30); g.fill();
    g.fillRect(-6, -66, 12, 30); g.beginPath(); g.arc(0, -72, 7, 0, 7); g.fill();
    g.restore();
  }
  function ruins(g, W, H, col) {
    g.fillStyle = col;
    for (let i = 0; i < 7; i++) { const x = W * 0.05 + i * W * 0.14, h = H * (0.2 + (i % 3) * 0.1); g.fillRect(x, H * 0.75 - h, W * 0.05, h); if (i % 2) g.fillRect(x, H * 0.75 - h, W * 0.14, H * 0.03); }
    g.fillRect(0, H * 0.75, W, H * 0.25);
  }
  D.paintScene = (g, W, H, id, t) => { (scenes[id] || scenes.loading_out)(g, W, H, t); g.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); };
  D.TIPS = [
    'Пробел ставит игру на паузу. На паузе можно отдавать приказы всему отряду.',
    'Спутники действуют по тактике. Настройте её в окне «Тактика» (T).',
    'Разбойник, ударивший врага сзади, всегда наносит критический удар.',
    'После боя павшие спутники встают, но получают травмы. Их лечат наборы от травм.',
    'Удерживайте Tab, чтобы подсветить предметы и людей рядом.',
    'Колёсиком мыши камера отдаляется до тактического вида сверху.',
    'Огненный шар и огненная вспышка задевают и ваших спутников.',
    'Убеждение зависит от Хитрости, запугивание — от Силы.',
    'Порождения тьмы-эмиссары владеют магией. Убивайте их первыми.',
    'Подарки повышают отношение спутников. Не все подарки нравятся всем.',
    'Щит даёт защиту и от стрел. Воин со щитом — лучший страж отряда.',
    'Утомление от тяжёлой брони делает способности дороже.'
  ];

  U.showMenu = function () {
    this.screen = 'menu';
    this.g = null;
    this.closePanel && this.closePanel(true);
    this.clearLayer();
    this.hud.innerHTML = '';
    this.hud.style.display = 'none';
    this.hideDialog();
    if (this.slidesEl) { this.slidesEl.remove(); this.slidesEl = null; }
    if (this.loadingEl) { this.loadingEl.remove(); this.loadingEl = null; }
    this.octx.clearRect(0, 0, this.ov.width, this.ov.height);
    this.menuEl && this.menuEl.remove();
    const m = el('div', 'da-menu', `<canvas class="da-menubg"></canvas><div class="da-logo"><div class="t1">DRAGON AGE</div><div class="t2">ORIGINS</div><div class="t3">98</div></div><div class="da-mlist"></div><div class="da-conn">Подключено</div><div class="da-copy">Фанатский ремейк · Win 98 Edition</div>`, this.box);
    this.menuEl = m;
    const cv = m.querySelector('canvas');
    this.menuT = 0;
    const list = m.querySelector('.da-mlist');
    const saves = this.listSaves();
    const item = (t, fn, dis) => { const d = el('div', 'da-mitem' + (dis ? ' dis' : ''), esc(t), list); if (!dis) d.onclick = () => { this.audio.init(); this.audio.resume(); this.sfx('click'); fn(); }; return d; };
    if (this.glError) el('div', 'da-glerr', 'Не удалось запустить 3D: ' + esc(this.glError) + '. Нужен браузер с WebGL.', m);
    item('Продолжить', () => this.loadLatest(), !saves.length);
    item('Новая игра', () => this.showCreate());
    item('Загрузить игру', () => this.showSaveList(false), !saves.length);
    item('Другие кампании', () => this.menuNote('Другие кампании', 'Официальные кампании появятся в дополнениях. Следите за новостями на сайте BioWare.'));
    item('Загружаемый контент', () => this.menuNote('Загружаемый контент', '«Каменный пленник» и «Страж-командор»: для загрузки требуется подключение к Интернету со скоростью не ниже 56 кбит/с. Модем не отвечает.'));
    item('Профиль игрока', () => this.showProfile());
    item('Настройки', () => this.showOptions());
    item('Авторы', () => this.showCredits());
    if (this.opts.onExit) item('Выход', () => this.opts.onExit());
    this.drawMenuBg = dt => {
      this.menuT += dt;
      const W = this.box.clientWidth, H = this.box.clientHeight;
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; this.menuStatic = null; }
      if (!this.menuStatic) { this.menuStatic = document.createElement('canvas'); this.menuStatic.width = W; this.menuStatic.height = H; D.paintScene(this.menuStatic.getContext('2d'), W, H, 'menu'); }
      const g = cv.getContext('2d');
      g.drawImage(this.menuStatic, 0, 0);
      for (let i = 0; i < 30; i++) { const x = (i * 97 + this.menuT * 14 * (1 + i % 3)) % W, y = H - ((i * 53 + this.menuT * 22) % H); g.fillStyle = `rgba(255,170,70,${0.25 + (i % 4) * 0.15})`; g.fillRect(x, y, 2, 2); }
    };
    this.onFrontKey = null;
    this.audio.music('menu');
  };
  U.menuNote = function (t, text) {
    const d = el('div', 'da-saves', `<div class="da-gmenu-t">${esc(t)}</div><p>${esc(text)}</p><div class="da-btnrow"><button class="da-btn">OK</button></div>`, this.layer);
    d.querySelector('button').onclick = () => d.remove();
  };
  U.showProfile = function () {
    let p;
    try { p = JSON.parse(localStorage.getItem('dao98_profile') || '{}'); } catch (e) { p = {}; }
    const ach = p.ach || {};
    const d = el('div', 'da-saves wide', `<div class="da-gmenu-t">Профиль игрока</div><div class="ach">${Object.entries(D.ACHIEVEMENTS || {}).map(([k, a]) => `<div class="${ach[k] ? 'on' : ''}"><b>${esc(a.name)}</b><span>${esc(a.desc)}</span></div>`).join('')}</div><div class="da-btnrow"><button class="da-btn">Назад</button></div>`, this.layer);
    d.querySelector('button').onclick = () => d.remove();
  };
  U.showCredits = function () {
    const d = el('div', 'da-credits', `<div class="roll"><h2>Dragon Age: Origins 98</h2><p>Фанатский ремейк для Win 98</p><h3>По мотивам</h3><p>Dragon Age: Origins, BioWare, 2009</p><h3>Движок</h3><p>WebGL, процедурные текстуры, вершинное освещение, синтезированный звук</p><h3>Главы</h3><p>Шесть предысторий · Остагар · Дебри Коркари · Башня Ишала · Лотеринг</p><h3>Благодарности</h3><p>Всем, кто до сих пор помнит, как огр поднимает короля</p><p class="dim">Щелчок — закрыть</p></div>`, this.layer);
    d.onclick = () => d.remove();
  };

  const PRESETS = {
    human: { m: [{ skin: '#e8c4a0', hair: '#3a2414', hairStyle: 'short', beard: 'stubble', eyes: '#3a5a8a' }, { skin: '#d8b090', hair: '#6a4020', hairStyle: 'tail', beard: 'full', eyes: '#5a3a1a' }, { skin: '#a87858', hair: '#1a1410', hairStyle: 'crop', beard: 'goatee', eyes: '#5a3a1a' }, { skin: '#f0d0b4', hair: '#c8a060', hairStyle: 'long', beard: 'none', eyes: '#4a6a3a' }], f: [{ skin: '#f0d0b4', hair: '#6a4020', hairStyle: 'tail', eyes: '#3a5a8a' }, { skin: '#e8c4a0', hair: '#1a1410', hairStyle: 'long', eyes: '#5a3a1a' }, { skin: '#c89a74', hair: '#8a3a1a', hairStyle: 'short', eyes: '#4a6a3a' }, { skin: '#f4dcc4', hair: '#c8a060', hairStyle: 'braids', eyes: '#3a5a8a' }] },
    elf: { m: [{ skin: '#f0d6bc', hair: '#c8a060', hairStyle: 'long', eyes: '#4a6a3a' }, { skin: '#e8c4a0', hair: '#3a2414', hairStyle: 'short', eyes: '#3a5a8a' }, { skin: '#d0a07c', hair: '#1a1410', hairStyle: 'tail', eyes: '#5a3a1a' }], f: [{ skin: '#f4dcc4', hair: '#c8a060', hairStyle: 'short', eyes: '#3a5a8a' }, { skin: '#f0d0b4', hair: '#1a1410', hairStyle: 'tail', eyes: '#4a6a3a' }, { skin: '#d8b090', hair: '#6a4020', hairStyle: 'braids', eyes: '#5a3a1a' }] },
    dwarf: { m: [{ skin: '#e0b896', hair: '#3a2414', hairStyle: 'short', beard: 'braided', eyes: '#5a3a1a' }, { skin: '#d0a07c', hair: '#8a3a1a', hairStyle: 'crop', beard: 'full', eyes: '#3a5a8a' }, { skin: '#c89a74', hair: '#1a1410', hairStyle: 'bald', beard: 'braided', eyes: '#5a3a1a' }], f: [{ skin: '#e8c4a0', hair: '#6a4020', hairStyle: 'braids', eyes: '#5a3a1a' }, { skin: '#d8b090', hair: '#1a1410', hairStyle: 'tail', eyes: '#3a5a8a' }, { skin: '#f0d0b4', hair: '#8a3a1a', hairStyle: 'short', eyes: '#4a6a3a' }] }
  };
  const STARTER_ABIL = { warrior: ['shield_bash', 'pommel_strike', 'powerful', 'precise_striking', 'dual_training', 'pinning_shot'], rogue: ['dirty_fighting', 'stealth', 'dual_training', 'pinning_shot', 'evasion'], mage: ['heal', 'winters_grasp', 'flame_blast', 'rock_armor', 'drain_life', 'disorient', 'heroic_offense', 'mind_blast'] };

  U.showCreate = function () {
    this.menuEl && this.menuEl.remove();
    this.menuEl = null;
    this.screen = 'create';
    this.clearLayer();
    const cr = this.cr = { step: 0, sex: 'm', race: 'human', cls: 'warrior', origin: 'hn', preset: 0, look: null, name: '', alloc: { str: 0, dex: 0, wil: 0, mag: 0, cun: 0, con: 0 }, skills: {}, abilities: [], difficulty: this.settings.difficulty || 'normal' };
    const d = el('div', 'da-create', `<canvas class="da-crbg"></canvas><div class="da-crsteps"></div><div class="da-crview"></div><div class="da-crpanel"><div class="da-crbody"></div><div class="da-btnrow"><button class="da-btn back">Назад</button><button class="da-btn next glow">Далее</button></div></div>`, this.box);
    this.menuEl = d;
    const bg = d.querySelector('canvas');
    const W = this.box.clientWidth, H = this.box.clientHeight;
    bg.width = W; bg.height = H;
    const g = bg.getContext('2d');
    D.paintScene(g, W, H, 'menu');
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, W, H);
    const view = d.querySelector('.da-crview');
    if (!this.CR) {
      this.ccv = document.createElement('canvas');
      this.ccv.width = 360; this.ccv.height = 480;
      try { this.CR = new D.Renderer(this.ccv); } catch (e) { this.CR = null; }
    }
    if (this.CR) view.appendChild(this.ccv);
    this.crYaw = 0;
    let drag = null;
    view.onmousedown = e => { drag = e.clientX; };
    view.onmouseup = () => { drag = null; };
    view.onmousemove = e => { if (drag !== null) { this.crYaw += (e.clientX - drag) * 0.02; drag = e.clientX; } };
    d.querySelector('.back').onclick = () => { if (cr.step === 0) this.showMenu(); else { cr.step--; this.renderCreate(); } };
    d.querySelector('.next').onclick = () => this.createNext();
    this.drawCreate = dt => {
      if (!this.CR || !this.crEnt) return;
      this.crYaw += dt * 0.25;
      try { this.CR.renderPreview(this.crEnt, { yaw: this.crYaw, armed: cr.step >= 2, head: cr.step === 4, bg: [0.03, 0.02, 0.02] }); } catch (e) { }
    };
    this.onFrontKey = e => { if (e.code === 'Escape') this.showMenu(); };
    this.renderCreate();
  };
  U.crLook = function () {
    const cr = this.cr;
    const pre = PRESETS[cr.race][cr.sex][cr.preset % PRESETS[cr.race][cr.sex].length];
    cr.look = Object.assign({ kind: 'humanoid', race: cr.race, sex: cr.sex }, pre, cr.custom || {});
    if (cr.origin === 'de' && !(cr.custom && cr.custom.tattoo)) cr.look.tattoo = 'vallaslin';
    if (cr.origin === 'dc' && !(cr.custom && cr.custom.tattoo)) cr.look.tattoo = 'brand';
    if (cr.sex === 'f') delete cr.look.beard;
    const equip = cr.cls === 'mage' ? { main: 'staff1', chest: 'apprentice_robe' } : cr.cls === 'rogue' ? { main: 'dagger_iron', off: 'dagger_iron', chest: 'leather_chest', boots: 'leather_boots' } : { main: 'longsword_iron', off: 'buckler_iron', chest: 'chain_chest', boots: 'chain_boots' };
    this.crEnt = { uid: 1, look: cr.look, equip, effects: [], x: 0, z: 0, y: 0 };
  };
  U.renderCreate = function () {
    const cr = this.cr, d = this.menuEl;
    const steps = ['Пол и раса', 'Класс', 'Предыстория', 'Внешность', 'Имя', 'Характеристики', 'Навыки и таланты', 'Итог'];
    d.querySelector('.da-crsteps').innerHTML = steps.map((s, i) => `<span class="${i === cr.step ? 'on' : i < cr.step ? 'done' : ''}">${s}</span>`).join('');
    const body = d.querySelector('.da-crbody');
    body.innerHTML = '';
    this.crLook();
    const choice = (host, list, cur, fn, desc) => {
      const box = el('div', 'da-choices', null, host);
      for (const [k, name, dis] of list) {
        const b = el('button', 'da-choice' + (k === cur ? ' on' : '') + (dis ? ' dis' : ''), esc(name), box);
        b.onclick = () => { if (dis) return; fn(k); this.renderCreate(); };
      }
      if (desc) el('div', 'da-crdesc', esc(desc), host);
    };
    const validOrigins = () => Object.entries(D.ORIGINS).filter(([, o]) => o.races.includes(cr.race) && o.classes.includes(cr.cls)).map(([k]) => k);
    const fixOrigin = () => { const v = validOrigins(); if (!v.includes(cr.origin)) cr.origin = v[0]; };
    switch (cr.step) {
      case 0:
        el('h3', null, 'Пол', body);
        choice(body, [['m', 'Мужчина'], ['f', 'Женщина']], cr.sex, v => { cr.sex = v; cr.preset = 0; });
        el('h3', null, 'Раса', body);
        choice(body, Object.entries(D.RACES).map(([k, r]) => [k, r.name]), cr.race, v => { cr.race = v; cr.preset = 0; if (v === 'dwarf' && cr.cls === 'mage') cr.cls = 'warrior'; fixOrigin(); }, D.RACES[cr.race].desc);
        break;
      case 1:
        el('h3', null, 'Класс', body);
        choice(body, Object.entries(D.CLASSES).map(([k, c]) => [k, c.name, cr.race === 'dwarf' && k === 'mage']), cr.cls, v => { cr.cls = v; cr.abilities = []; fixOrigin(); }, D.CLASSES[cr.cls].desc + (cr.race === 'dwarf' ? ' Гномы не могут быть магами.' : ''));
        break;
      case 2: {
        fixOrigin();
        el('h3', null, 'Предыстория', body);
        choice(body, Object.entries(D.ORIGINS).map(([k, o]) => [k, o.name, !(o.races.includes(cr.race) && o.classes.includes(cr.cls))]), cr.origin, v => { cr.origin = v; }, D.ORIGINS[cr.origin].desc);
        el('div', 'da-dim', 'Недоступные предыстории зависят от расы и класса. Маги-люди и маги-эльфы начинают в Круге магов.', body);
        break;
      }
      case 3: {
        el('h3', null, 'Внешность', body);
        const n = PRESETS[cr.race][cr.sex].length;
        choice(body, Array.from({ length: n }, (_, i) => [i, 'Облик ' + (i + 1)]), cr.preset, v => { cr.preset = v; cr.custom = {}; });
        cr.custom = cr.custom || {};
        const sw = (label, key, list) => {
          const r = el('div', 'da-swatches', `<span>${label}</span>`, body);
          for (const c of list) { const s = el('i', (cr.look[key] === c ? 'on' : ''), null, r); s.style.background = c; s.onclick = () => { cr.custom[key] = c; this.renderCreate(); }; }
        };
        sw('Кожа', 'skin', D.SKIN);
        sw('Волосы', 'hair', D.HAIR);
        sw('Глаза', 'eyes', D.EYES);
        el('h3', null, 'Причёска', body);
        choice(body, D.HAIR_STYLES, cr.look.hairStyle, v => { cr.custom.hairStyle = v; });
        if (cr.sex === 'm') { el('h3', null, 'Борода', body); choice(body, D.BEARDS, cr.look.beard || 'none', v => { cr.custom.beard = v; }); }
        el('h3', null, 'Отметины', body);
        choice(body, D.TATTOO, cr.look.tattoo || 'none', v => { cr.custom.tattoo = v; });
        break;
      }
      case 4: {
        el('h3', null, 'Имя', body);
        const defaults = { hn: cr.sex === 'm' ? 'Эдан' : 'Элисса', mage: cr.sex === 'm' ? 'Дайлан' : 'Нерия', ce: cr.sex === 'm' ? 'Тейн' : 'Кали', de: cr.sex === 'm' ? 'Лорен' : 'Линдар', dn: cr.sex === 'm' ? 'Эйнар' : 'Натия', dc: cr.sex === 'm' ? 'Дурин' : 'Хельга' };
        if (!cr.name) cr.name = defaults[cr.origin] || 'Страж';
        const inp = el('input', 'da-input', null, body);
        inp.value = cr.name; inp.maxLength = 18;
        inp.oninput = () => { cr.name = inp.value.trim(); };
        setTimeout(() => inp.focus(), 50);
        const fam = cr.origin === 'mage' ? (cr.race === 'elf' ? 'Сурана' : 'Амелл') : D.ORIGINS[cr.origin].family;
        el('div', 'da-crdesc', 'Фамилия: ' + fam + '. Вас будут звать по имени, а ваши враги — по фамилии.', body);
        el('h3', null, 'Сложность', body);
        choice(body, Object.entries(D.DIFFICULTY).map(([k, v]) => [k, v.name]), cr.difficulty, v => { cr.difficulty = v; });
        break;
      }
      case 5: {
        const base = this.crBase();
        const spent = Object.values(cr.alloc).reduce((a, b) => a + b, 0);
        el('h3', null, 'Характеристики — осталось очков: ' + (5 - spent), body);
        for (const [k, name, desc] of D.ATTRS) {
          const r = el('div', 'da-attr', `<span class="an">${name}</span><button class="da-plus minus">−</button><span class="av">${base[k] + cr.alloc[k]}</span><button class="da-plus">+</button>`, body);
          r.title = desc;
          r.querySelector('.minus').onclick = () => { if (cr.alloc[k] > 0) { cr.alloc[k]--; this.renderCreate(); } };
          r.querySelectorAll('.da-plus')[1].onclick = () => { if (spent < 5) { cr.alloc[k]++; this.renderCreate(); } };
        }
        el('div', 'da-crdesc', { warrior: 'Воину нужны Сила (урон и тяжёлая броня), Ловкость и Телосложение.', rogue: 'Разбойнику нужны Ловкость (точность и урон кинжалов) и Хитрость (навыки и пробивание брони).', mage: 'Магу нужна Магия (сила заклинаний) и Сила воли (запас маны).' }[cr.cls], body);
        break;
      }
      case 6: {
        const nSk = D.CLASSES[cr.cls].skills;
        const nAb = cr.cls === 'mage' ? 2 : 1;
        el('h3', null, `Навыки — выберите ${nSk}`, body);
        const sb = el('div', 'da-choices', null, body);
        for (const [k, s] of Object.entries(D.SKILLS)) {
          const on = !!cr.skills[k];
          const b = el('button', 'da-choice' + (on ? ' on' : ''), esc(s.name), sb);
          b.title = s.desc;
          b.onclick = () => { if (on) delete cr.skills[k]; else if (Object.keys(cr.skills).length < nSk) cr.skills[k] = 1; this.renderCreate(); };
        }
        el('h3', null, cr.cls === 'mage' ? `Заклинания — выберите ${nAb}` : `Таланты — выберите ${nAb}`, body);
        const ab = el('div', 'da-abchoices', null, body);
        for (const id of STARTER_ABIL[cr.cls]) {
          const a = D.AB[id];
          const on = cr.abilities.includes(id);
          const b = el('div', 'da-abch' + (on ? ' on' : ''), `<img src="${D.ICONS.ability(id, 36)}"><span>${esc(a.name)}</span>`, ab);
          b.title = a.desc + (a.need ? ' (нужно: ' + { shield: 'щит', '2h': 'двуручное оружие', dual: 'два клинка', bow: 'лук' }[a.need] + ')' : '');
          b.onclick = () => { if (on) cr.abilities = cr.abilities.filter(x => x !== id); else if (cr.abilities.length < nAb) cr.abilities.push(id); this.renderCreate(); };
        }
        if (cr.cls === 'rogue') el('div', 'da-crdesc', 'Все разбойники умеют вскрывать простые замки.', body);
        break;
      }
      case 7: {
        const o = D.ORIGINS[cr.origin];
        el('h3', null, esc(cr.name) + ' — ' + o.name, body);
        const base = this.crBase();
        el('div', 'da-crdesc', `${D.RACES[cr.race].name}, ${D.CLASSES[cr.cls].name.toLowerCase()}. ${D.ATTRS.map(([k, n]) => n + ' ' + (base[k] + cr.alloc[k])).join(', ')}.`, body);
        el('div', 'da-crdesc', 'Навыки: ' + (Object.keys(cr.skills).map(k => D.SKILLS[k].name).join(', ') || '—') + '. ' + (cr.cls === 'mage' ? 'Заклинания' : 'Таланты') + ': ' + (cr.abilities.map(k => D.AB[k].name).join(', ') || '—') + '.', body);
        el('div', 'da-crdesc story', esc(o.desc), body);
        d.querySelector('.next').textContent = 'Начать';
        return;
      }
    }
    d.querySelector('.next').textContent = 'Далее';
  };
  U.crBase = function () {
    const cr = this.cr;
    const b = { str: 10, dex: 10, wil: 10, mag: 10, cun: 10, con: 10 };
    for (const [k, v] of Object.entries(D.RACES[cr.race].attr)) b[k] += v;
    for (const [k, v] of Object.entries(D.CLASSES[cr.cls].attr)) b[k] += v;
    return b;
  };
  U.createNext = function () {
    const cr = this.cr;
    const spent = Object.values(cr.alloc).reduce((a, b) => a + b, 0);
    if (cr.step === 4 && !cr.name) { this.flashMsg('Введите имя'); return; }
    if (cr.step === 5 && spent < 5) { this.flashMsg('Распределите все очки'); return; }
    if (cr.step === 6) {
      if (Object.keys(cr.skills).length < D.CLASSES[cr.cls].skills) { this.flashMsg('Выберите навыки'); return; }
      if (cr.abilities.length < (cr.cls === 'mage' ? 2 : 1)) { this.flashMsg('Выберите способности'); return; }
    }
    if (cr.step < 7) { cr.step++; this.sfx('page'); this.renderCreate(); return; }
    this.crLook();
    const g = new D.Game({ difficulty: cr.difficulty });
    this.settings.difficulty = cr.difficulty;
    this.saveSettings();
    g.newGame({ origin: cr.origin, race: cr.race, cls: cr.cls, sex: cr.sex, name: cr.name, look: cr.look, alloc: cr.alloc, skills: cr.skills, abilities: cr.abilities });
    this.menuEl.remove();
    this.menuEl = null;
    this.drawCreate = null;
    this.startGame(g);
    const intro = D.ORIGIN_INTRO && D.ORIGIN_INTRO[cr.origin];
    if (intro) { g.showSlides(intro); this.showSlides(); }
  };
  U.flashMsg = function (t) {
    const m = el('div', 'da-flash', esc(t), this.menuEl || this.box);
    setTimeout(() => m.remove(), 1500);
  };

  U.showWorldMap = function () {
    const g = this.g;
    if (!g.travel) return;
    this.mapEl && this.mapEl.remove();
    const d = el('div', 'da-world', `<canvas width="900" height="620"></canvas><div class="da-world-t">Ферелден</div><div class="da-world-info">Выберите место назначения</div><button class="da-btn close">Остаться</button>`, this.layer);
    this.mapEl = d;
    const cv = d.querySelector('canvas'), x = cv.getContext('2d');
    const W = 900, H = 620;
    this.paintFerelden(x, W, H);
    const dests = g.travel.dests;
    const from = D.WORLD[g.travel.from] || D.WORLD.wilds;
    for (const ds of dests) {
      const px = ds.x * W, py = ds.y * H;
      const pin = el('div', 'da-pin' + (ds.open ? ' open' : '') + (ds.here ? ' here' : ''), `<i></i><span>${esc(ds.name)}</span>`, d);
      pin.style.left = (px / W * 100) + '%'; pin.style.top = (py / H * 100) + '%';
      pin.title = ds.open ? 'Отправиться: ' + ds.name : ds.here ? 'Вы здесь' : ds.note;
      pin.onclick = () => {
        if (!ds.open) { d.querySelector('.da-world-info').textContent = ds.note || 'Туда пока не добраться.'; return; }
        this.travelAnim(x, W, H, from, ds, () => { d.remove(); this.mapEl = null; g.travelTo(ds.id); this.handleEvents(); });
      };
    }
    this.mapCancel = () => { d.remove(); this.mapEl = null; g.closeMap(); };
    d.querySelector('.close').onclick = this.mapCancel;
  };
  U.travelAnim = function (x, W, H, from, to, done) {
    const fx = from.x * W, fy = from.y * H, tx = to.x * W, ty = to.y * H;
    let t = 0;
    const base = x.getImageData(0, 0, W, H);
    const step = () => {
      t += 0.02;
      x.putImageData(base, 0, 0);
      x.fillStyle = '#7a0a0a';
      const n = Math.floor(t * 30);
      for (let i = 0; i <= n; i++) {
        const k = i / 30;
        const px = fx + (tx - fx) * k + Math.sin(k * Math.PI) * 30, py = fy + (ty - fy) * k;
        x.beginPath(); x.arc(px, py, 4, 0, 7); x.fill();
      }
      if (t < 1) requestAnimationFrame(step); else setTimeout(done, 300);
    };
    step();
  };
  U.paintFerelden = function (x, W, H) {
    const r = rnd(42);
    const gr = x.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7);
    gr.addColorStop(0, '#e8d8b0'); gr.addColorStop(1, '#a88a58');
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(90,60,30,${r() * 0.08})`; x.fillRect(r() * W, r() * H, 2, 2); }
    x.fillStyle = 'rgba(80,110,130,0.55)';
    x.beginPath(); x.moveTo(W, 0); x.lineTo(W * 0.72, 0); x.quadraticCurveTo(W * 0.66, H * 0.1, W * 0.74, H * 0.22); x.quadraticCurveTo(W * 0.86, H * 0.3, W * 0.8, H * 0.46); x.quadraticCurveTo(W * 0.9, H * 0.6, W, H * 0.62); x.fill();
    x.beginPath(); x.ellipse(W * 0.38, H * 0.36, W * 0.06, H * 0.08, 0.3, 0, 7); x.fill();
    x.fillStyle = 'rgba(90,70,50,0.6)';
    for (let i = 0; i < 40; i++) { const px = W * 0.05 + r() * W * 0.2, py = H * 0.15 + r() * H * 0.6; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 10, py - 18); x.lineTo(px + 20, py); x.fill(); }
    x.fillStyle = 'rgba(50,80,40,0.45)';
    for (let i = 0; i < 90; i++) { const cx = r() < 0.5 ? W * 0.55 + r() * W * 0.18 : W * 0.3 + r() * W * 0.2, cy = r() < 0.5 ? H * 0.55 + r() * H * 0.15 : H * 0.8 + r() * H * 0.15; x.beginPath(); x.arc(cx, cy, 4 + r() * 4, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(70,100,120,0.6)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(W * 0.38, H * 0.44); x.quadraticCurveTo(W * 0.45, H * 0.6, W * 0.5, H * 0.95); x.stroke();
    x.strokeStyle = 'rgba(90,50,20,0.5)'; x.setLineDash([6, 5]);
    x.beginPath(); x.moveTo(W * 0.46, H * 0.9); x.lineTo(W * 0.5, H * 0.62); x.lineTo(W * 0.3, H * 0.46); x.moveTo(W * 0.5, H * 0.62); x.lineTo(W * 0.74, H * 0.36); x.stroke();
    x.setLineDash([]);
    x.strokeStyle = '#5a3a1a'; x.lineWidth = 8; x.strokeRect(4, 4, W - 8, H - 8);
    x.strokeStyle = '#c8a050'; x.lineWidth = 2; x.strokeRect(12, 12, W - 24, H - 24);
    x.fillStyle = 'rgba(60,30,10,0.7)'; x.font = 'italic 16px Georgia'; x.fillText('Недремлющее море', W * 0.8, H * 0.12); x.fillText('Морозные горы', W * 0.04, H * 0.1);
  };

  U.showEnding = function (ev) {
    const g = this.g;
    const d = el('div', 'da-ending', `<canvas width="900" height="500"></canvas><div class="da-end-box"><h2>Конец первой главы</h2><div class="txt"></div><div class="stats"></div><div class="da-btnrow"><button class="da-btn save">Сохранить</button><button class="da-btn menu">Главное меню</button></div></div>`, this.layer);
    D.paintScene(d.querySelector('canvas').getContext('2d'), 900, 500, 'end');
    d.querySelector('.txt').innerHTML = (ev.lines || []).map(l => `<p>${esc(g.subst(l))}</p>`).join('');
    d.querySelector('.stats').innerHTML = `${esc(g.pc.name)} ${esc(g.familyName())}, уровень ${g.pc.lvl}. Врагов повержено: ${g.stats.kills}. Время в пути: ${Math.floor(g.playTime / 60)} мин.`;
    d.querySelector('.save').onclick = () => { this.writeSave('end' + Date.now(), 'Конец главы'); };
    d.querySelector('.menu').onclick = () => { d.remove(); this.showMenu(); };
    this.audio.music('menu');
  };
})(globalThis.Dao98 = globalThis.Dao98 || {});
