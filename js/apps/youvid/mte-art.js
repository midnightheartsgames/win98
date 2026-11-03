(function () {
  const { rand } = window.P3D;
  const Meet = window.MeetArt;
  const PI = Math.PI;

  const CREAM = '#f3e6dd';
  const CARD = '#e99d51';
  const BAND = '#3d3c39';
  const SANS = '"Arial Black", "Arial Bold", Arial, sans-serif';
  const COND = 'Impact, "Arial Narrow", "Arial Black", sans-serif';

  function arcBand(cx, cy, rxo, ryo, rxi, ryi, a0, a1, n) {
    const pts = [];
    const k = n || 28;
    for (let i = 0; i <= k; i++) {
      const a = a0 + (a1 - a0) * (i / k);
      pts.push([cx + Math.cos(a) * rxo, cy + Math.sin(a) * ryo]);
    }
    for (let i = k; i >= 0; i--) {
      const a = a0 + (a1 - a0) * (i / k);
      pts.push([cx + Math.cos(a) * rxi, cy + Math.sin(a) * ryi]);
    }
    return pts;
  }

  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  const SLAB = {
    E: { w: 106, polys: [rect(14, 0, 42, 100), rect(0, 0, 100, 16), rect(86, 0, 100, 34), rect(42, 42, 80, 58), rect(70, 32, 82, 68), rect(0, 84, 106, 100), rect(92, 64, 106, 100)] },
    N: { w: 128, polys: [rect(16, 0, 34, 100), [[16, 0], [48, 0], [112, 100], [80, 100]], rect(94, 0, 112, 100), rect(0, 0, 48, 14), rect(0, 86, 50, 100), rect(80, 0, 128, 14)] },
    G: { w: 122, polys: [arcBand(62, 50, 60, 50, 32, 35, -0.62, PI * 2 - 0.05, 36), rect(66, 50, 120, 64), rect(94, 50, 120, 100), rect(98, 6, 118, 40)] },
    I: { w: 60, polys: [rect(16, 0, 44, 100), rect(0, 0, 60, 14), rect(0, 86, 60, 100)] },
    R: { w: 126, polys: [rect(14, 0, 42, 100), rect(0, 0, 76, 14), rect(42, 44, 78, 58), arcBand(74, 29, 38, 29, 16, 15, -PI / 2, PI / 2, 24), [[62, 52], [92, 52], [118, 100], [86, 100]], rect(80, 86, 126, 100), rect(0, 86, 58, 100)] }
  };

  function slabWord(ctx, word, x, y, h, gap, color, stretch) {
    const k = h / 100;
    const kx = k * (stretch || 1);
    let cx = x;
    ctx.fillStyle = color;
    for (const ch of word) {
      const g = SLAB[ch];
      g.polys.forEach(poly => {
        ctx.beginPath();
        poly.forEach(([px, py], i) => (i ? ctx.lineTo(cx + px * kx, y + py * k) : ctx.moveTo(cx + px * kx, y + py * k)));
        ctx.closePath();
        ctx.fill();
      });
      cx += (g.w + gap) * kx;
    }
    return cx - x;
  }

  function smallLogo(ctx, x, y, h) {
    ctx.save();
    ctx.font = `${Math.round(h)}px ${COND}`;
    ctx.textBaseline = 'alphabetic';
    const word = (fill, dx, dy) => {
      ctx.fillStyle = fill;
      const wa = ctx.measureText('TEAM').width;
      ctx.fillText('TEAM', x + dx, y + dy);
      ctx.fillText('FORTRESS 2', x + dx + wa + h * 0.22, y + dy);
    };
    for (let i = 8; i >= 1; i--) word(i > 4 ? '#6e3618' : '#b0602a', -i * h * 0.03, i * h * 0.04);
    word('#e8933e', 0, 0);
    ctx.restore();
  }

  function sentryIcon(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    ctx.fillRect(-46, -30, 64, 34);
    ctx.fillRect(18, -22, 30, 16);
    ctx.fillRect(48, -26, 12, 24);
    ctx.fillRect(-36, -42, 26, 12);
    ctx.fillRect(-10, 4, 14, 26);
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3, 28);
    ctx.lineTo(-36, 62);
    ctx.lineTo(-52, 62);
    ctx.moveTo(-3, 28);
    ctx.lineTo(10, 64);
    ctx.moveTo(-3, 28);
    ctx.lineTo(30, 52);
    ctx.lineTo(40, 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-3, 26, 10, 0, PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(64, -14);
    ctx.lineTo(84, -32);
    ctx.lineTo(80, -18);
    ctx.lineTo(110, -16);
    ctx.lineTo(80, -10);
    ctx.lineTo(86, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function speckle(ctx, W, H, seed, n, light, dark, size) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = g() < 0.5 ? `rgba(${dark},${g() * 0.12})` : `rgba(${light},${g() * 0.1})`;
      const s = (size || 2) * (0.5 + g());
      ctx.fillRect(g() * W, g() * H, s, s);
    }
  }

  function digitStrip(ctx, W, H) {
    ctx.fillStyle = '#141210';
    ctx.fillRect(0, 0, W, H);
    const cell = H / 11;
    ctx.font = `bold ${Math.round(cell * 0.78)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 10; i++) {
      const d = (10 - i) % 10;
      const cy = i * cell + cell / 2;
      const g = ctx.createLinearGradient(0, i * cell, 0, (i + 1) * cell);
      g.addColorStop(0, '#2a2622');
      g.addColorStop(0.5, '#3c3732');
      g.addColorStop(1, '#2a2622');
      ctx.fillStyle = g;
      ctx.fillRect(0, i * cell, W, cell);
      ctx.fillStyle = '#efe6d2';
      ctx.fillText(String(d), W / 2, cy + cell * 0.04);
    }
  }

  const DRAW = {
    title(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = CARD;
      ctx.beginPath();
      ctx.moveTo(82, 30);
      ctx.lineTo(1205, 44);
      ctx.lineTo(1190, 672);
      ctx.lineTo(87, 660);
      ctx.closePath();
      ctx.fill();
      const band = () => {
        ctx.beginPath();
        ctx.moveTo(232, 158);
        ctx.lineTo(1280, 162);
        ctx.lineTo(1280, 552);
        ctx.lineTo(262, 462);
        ctx.lineTo(196, 228);
        ctx.closePath();
      };
      ctx.fillStyle = BAND;
      band();
      ctx.fill();
      ctx.save();
      band();
      ctx.clip();
      Meet.emblem(ctx, 780, 330, 330, '#4a4845', BAND);
      ctx.restore();
      sentryIcon(ctx, 940, 104, 0.98, '#f6caa2');
      ctx.fillStyle = CREAM;
      ctx.font = `62px ${SANS}`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Meet', 280, 255);
      ctx.font = `40px ${SANS}`;
      ctx.fillText('THE', 330, 290);
      slabWord(ctx, 'ENGINEER', 326, 300, 65, 12, CREAM, 1.39);
      smallLogo(ctx, 614, 624, 30);
      ctx.fillStyle = '#f2c79c';
      ctx.font = `bold 12px ${SANS}`;
      ctx.fillText('COPYRIGHT LOLOLOL', 846, 605);
      ctx.font = 'bold 17px Arial, sans-serif';
      ctx.fillStyle = '#3a2a1e';
      ctx.fillText('A Valve Picture', 846, 627);
      ctx.restore();
    },

    guitarTop(ctx, W, H) {
      const g = ctx.createRadialGradient(W * 0.46, H * 0.5, W * 0.05, W * 0.46, H * 0.5, W * 0.6);
      g.addColorStop(0, '#b47838');
      g.addColorStop(0.42, '#8e5424');
      g.addColorStop(0.78, '#4a2410');
      g.addColorStop(1, '#22100a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const gr = rand(61);
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = gr() < 0.5 ? '#3a1a0a' : '#f0c080';
        ctx.fillRect(0, gr() * H, W, 1 + gr() * 2);
      }
      ctx.globalAlpha = 1;
      const hx = W * 0.676, hy = H * 0.5, hr = W * 0.09;
      [[hr * 1.5, '#e6d2a8'], [hr * 1.38, '#3a2414'], [hr * 1.3, '#d8c49a'], [hr * 1.22, '#4a2a18']].forEach(([rr, c]) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(hx, hy, rr, 0, PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#0c0806';
      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(30,14,8,0.9)';
      ctx.beginPath();
      ctx.moveTo(hx - hr * 0.7, hy + hr * 1.25);
      ctx.quadraticCurveTo(hx - hr * 2.6, hy + hr * 2.2, hx - hr * 2.0, hy + hr * 3.4);
      ctx.quadraticCurveTo(hx - hr * 0.2, hy + hr * 3.6, hx + hr * 0.6, hy + hr * 1.5);
      ctx.closePath();
      ctx.fill();
      const bx = W * 0.27;
      ctx.fillStyle = '#1e100a';
      ctx.fillRect(bx - W * 0.03, H * 0.33, W * 0.06, H * 0.34);
      ctx.fillStyle = '#efe6cf';
      ctx.fillRect(bx - W * 0.006, H * 0.36, W * 0.012, H * 0.28);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = '#e8e0cc';
        ctx.beginPath();
        ctx.arc(bx + W * 0.018, H * (0.38 + i * 0.048), W * 0.006, 0, PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#ead9b0';
      ctx.lineWidth = W * 0.008;
      ctx.strokeRect(1, 1, W - 2, H - 2);
    },

    fretboard(ctx, W, H) {
      ctx.fillStyle = '#21140e';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 71, 600, '90,60,40', '0,0,0', 2);
      for (let i = 0; i < 16; i++) {
        const x = W * (1 - Math.pow(0.944, i + 1) * 1.0) * 1.35;
        if (x > W) break;
        ctx.fillStyle = '#b8b4aa';
        ctx.fillRect(x, 0, Math.max(2, W * 0.006), H);
      }
      [3, 5, 7, 9].forEach(f => {
        const x0 = W * (1 - Math.pow(0.944, f)) * 1.35, x1 = W * (1 - Math.pow(0.944, f + 1)) * 1.35;
        ctx.fillStyle = '#e6e0d2';
        ctx.beginPath();
        ctx.arc((x0 + x1) / 2, H / 2, H * 0.12, 0, PI * 2);
        ctx.fill();
      });
    },

    toolFront(ctx, W, H) {
      ctx.fillStyle = '#c23a2c';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(255,190,160,0.18)');
      g.addColorStop(1, 'rgba(60,8,4,0.25)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 81, 900, '255,220,200', '40,8,4', 2);
      const gr = rand(82);
      ctx.strokeStyle = 'rgba(210,200,190,0.45)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 26; i++) {
        const x = gr() * W, y = gr() * H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (gr() - 0.5) * 30, y + (gr() - 0.5) * 8);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(232,150,96,0.85)';
      ctx.font = `bold ${Math.round(H * 0.52)}px ${COND}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('24', W * 0.78, H * 0.6);
      ctx.fillStyle = 'rgba(194,58,44,1)';
      [[0.72, 0.38], [0.84, 0.46], [0.77, 0.74]].forEach(([x, y]) => ctx.fillRect(W * x, H * y, W * 0.015, H * 0.08));
      ctx.fillStyle = 'rgba(30,6,4,0.35)';
      ctx.fillRect(0, 0, W, H * 0.04);
      ctx.fillRect(0, H * 0.96, W, H * 0.04);
    },

    toolPaint(ctx, W, H) {
      ctx.fillStyle = '#c23a2c';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 83, 500, '255,220,200', '40,8,4', 2);
    },

    crate(ctx, W, H) {
      ctx.fillStyle = '#a88a6c';
      ctx.fillRect(0, 0, W, H);
      const g = rand(91);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '90,64,44' : '220,196,170'},${0.08 + g() * 0.08})`;
        ctx.fillRect(0, (i / 5) * H, W, H / 5);
        ctx.fillStyle = 'rgba(60,40,28,0.55)';
        ctx.fillRect(0, (i / 5) * H, W, 2);
      }
      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = `rgba(70,48,32,${g() * 0.18})`;
        ctx.fillRect(g() * W, g() * H, 8 + g() * 30, 1);
      }
      const fr = W * 0.1;
      ctx.fillStyle = '#b8987a';
      ctx.fillRect(0, 0, W, fr);
      ctx.fillRect(0, H - fr, W, fr);
      ctx.fillRect(0, 0, fr, H);
      ctx.fillRect(W - fr, 0, fr, H);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.atan2(H - fr * 2, W - fr * 2));
      ctx.fillRect(-W * 0.62, -fr / 2, W * 1.24, fr);
      ctx.restore();
      ctx.strokeStyle = 'rgba(60,40,28,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(fr, fr, W - fr * 2, H - fr * 2);
      ctx.strokeRect(1, 1, W - 2, H - 2);
      ['#5a5650'].forEach(c => {
        ctx.fillStyle = c;
        [[fr / 2, fr / 2], [W - fr / 2, fr / 2], [fr / 2, H - fr / 2], [W - fr / 2, H - fr / 2]].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, W * 0.012, 0, PI * 2);
          ctx.fill();
        });
      });
    },

    digits: digitStrip,

    plate(ctx, W, H) {
      ctx.fillStyle = '#56524c';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 95, 300, '200,200,190', '0,0,0', 2);
      ctx.fillStyle = '#d8d2c4';
      const cx = W * 0.42, cy = H * 0.5, r = H * 0.22;
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.2, r, 0, PI * 2);
      ctx.fill();
      ctx.fillRect(cx - r * 0.55, cy + r * 0.5, r * 1.1, r * 0.5);
      ctx.fillStyle = '#56524c';
      [[-0.4, -0.25], [0.4, -0.25]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(cx + dx * r, cy + dy * r, r * 0.28, 0, PI * 2);
        ctx.fill();
      });
      ctx.strokeStyle = '#d8d2c4';
      ctx.lineWidth = H * 0.07;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.6, cy - r * 0.6);
      ctx.lineTo(cx + r * 1.6, cy + r * 1.4);
      ctx.moveTo(cx + r * 1.6, cy - r * 0.6);
      ctx.lineTo(cx - r * 1.6, cy + r * 1.4);
      ctx.stroke();
      ctx.fillStyle = '#2a2826';
      [[0.86, 0.36], [0.86, 0.68]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(W * x, H * y, H * 0.11, 0, PI * 2);
        ctx.fill();
      });
    },

    label(ctx, W, H) {
      ctx.fillStyle = '#ece4cc';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3a5a9a';
      ctx.fillRect(0, 0, W, H * 0.1);
      ctx.fillRect(0, H * 0.9, W, H * 0.1);
      const cx = W * 0.5, cy = H * 0.34, r = H * 0.16;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -PI / 2 + i * PI / 5;
        const rr = i % 2 ? r * 0.42 : r;
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.font = `italic bold ${Math.round(H * 0.17)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Blu', W * 0.5, H * 0.66);
      ctx.fillText('Streak', W * 0.5, H * 0.83);
    },

    truck(ctx, W, H) {
      ctx.fillStyle = '#4a5662';
      ctx.fillRect(0, 0, W, H);
      const g = rand(101);
      for (let i = 0; i < 40; i++) {
        const x = g() * W, y = g() * H, r = W * (0.04 + g() * 0.12);
        const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
        const light = g() < 0.4;
        gr.addColorStop(0, light ? 'rgba(150,160,170,0.18)' : 'rgba(30,26,24,0.28)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      speckle(ctx, W, H, 102, 1400, '200,205,210', '20,18,16', 2);
      ctx.strokeStyle = 'rgba(190,195,200,0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 30; i++) {
        const x = g() * W, y = g() * H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (g() - 0.5) * 24, y + (g() - 0.5) * 6);
        ctx.stroke();
      }
    },

    rust(ctx, W, H) {
      ctx.fillStyle = '#5a6670';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 103, 2000, '170,180,190', '60,40,30', 3);
    },

    lockers(ctx, W, H) {
      ctx.fillStyle = '#4e8a90';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 104, 800, '200,230,230', '20,40,40', 2);
      ctx.fillStyle = 'rgba(20,40,44,0.6)';
      ctx.fillRect(0, H * 0.46, W, H * 0.08);
      ctx.fillStyle = '#c8ccc4';
      ctx.fillRect(W * 0.2, H * 0.42, W * 0.08, H * 0.16);
      ctx.fillRect(W * 0.72, H * 0.42, W * 0.08, H * 0.16);
    },

    dirt(ctx, W, H) {
      ctx.fillStyle = '#4e2e24';
      ctx.fillRect(0, 0, W, H);
      const g = rand(111);
      for (let i = 0; i < 260; i++) {
        const x = g() * W, y = g() * H, r = 3 + g() * 14;
        ctx.fillStyle = `rgba(${g() < 0.5 ? '60,34,24' : '150,100,74'},${0.18 + g() * 0.25})`;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * (0.5 + g() * 0.5), g() * PI, 0, PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 160; i++) {
        const x = g() * W, y = g() * H, r = 1.5 + g() * 4;
        ctx.fillStyle = `rgba(${g() < 0.5 ? '180,140,110' : '40,24,18'},0.6)`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, PI * 2);
        ctx.fill();
      }
      speckle(ctx, W, H, 112, 3000, '200,150,120', '30,16,10', 2);
    },

    cliff(ctx, W, H) {
      ctx.fillStyle = '#7a4834';
      ctx.fillRect(0, 0, W, H);
      const g = rand(121);
      for (let i = 0; i < 40; i++) {
        const y = g() * H;
        ctx.fillStyle = `rgba(${g() < 0.5 ? '60,32,22' : '160,104,80'},${0.12 + g() * 0.14})`;
        ctx.fillRect(0, y, W, 3 + g() * 14);
      }
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = `rgba(40,22,16,${0.1 + g() * 0.2})`;
        const x = g() * W, y = g() * H;
        ctx.fillRect(x, y, 2 + g() * 4, 10 + g() * 40);
      }
      speckle(ctx, W, H, 122, 1600, '200,140,110', '30,16,10', 2);
    },

    road(ctx, W, H) {
      ctx.fillStyle = '#4a4442';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 131, 3000, '140,130,124', '10,8,8', 2);
      ctx.fillStyle = 'rgba(210,190,120,0.55)';
      for (let i = 0; i < 4; i++) ctx.fillRect(W * 0.49, i * H / 4, W * 0.02, H / 8);
    },

    sky(ctx, W, H) {
      const v = ctx.createLinearGradient(0, 0, 0, H);
      v.addColorStop(0, '#262a4e');
      v.addColorStop(0.3, '#3e4676');
      v.addColorStop(0.45, '#6e6e98');
      v.addColorStop(0.5, '#a08ea8');
      v.addColorStop(1, '#a08ea8');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
      const glow = (cx, r, a) => {
        const gr = ctx.createRadialGradient(cx, H * 0.5, 0, cx, H * 0.5, r);
        gr.addColorStop(0, `rgba(250,170,150,${a})`);
        gr.addColorStop(0.5, `rgba(220,140,150,${a * 0.5})`);
        gr.addColorStop(1, 'rgba(220,140,150,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(cx - r, 0, r * 2, H);
      };
      glow(W * 0.5, W * 0.26, 0.6);
      glow(W * 0.5 - W, W * 0.26, 0.6);
      glow(W * 0.5 + W, W * 0.26, 0.6);
      const g = rand(141);
      for (let i = 0; i < 220; i++) {
        const x = g() * W, y = g() * H * 0.36;
        ctx.fillStyle = `rgba(255,255,240,${0.3 + g() * 0.6})`;
        ctx.fillRect(x, y, 1 + (g() < 0.1 ? 1 : 0), 1);
      }
      for (let i = 0; i < 26; i++) {
        const cx = W * (0.32 + g() * 0.36), cy = H * (0.3 + g() * 0.16), w = W * (0.05 + g() * 0.12), h = H * (0.006 + g() * 0.014);
        const near = 1 - Math.abs(cx / W - 0.5) * 2.4;
        ctx.fillStyle = `rgba(${Math.round(220 + g() * 20)},${Math.round(140 + g() * 40)},${Math.round(156 + g() * 30)},${Math.max(0.06, 0.12 + near * 0.42)})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, w, h, (g() - 0.5) * 0.12, 0, PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(70,72,110,0.35)';
      for (let i = 0; i < 12; i++) {
        const cx = W * (0.3 + g() * 0.4), cy = H * (0.36 + g() * 0.08);
        ctx.beginPath();
        ctx.ellipse(cx, cy, W * (0.04 + g() * 0.08), H * 0.006, 0, 0, PI * 2);
        ctx.fill();
      }
      const mx = W * 0.83, my = H * 0.22, mr = H * 0.09;
      const mg = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 1.4);
      mg.addColorStop(0, 'rgba(236,200,214,0.85)');
      mg.addColorStop(0.7, 'rgba(236,200,214,0.75)');
      mg.addColorStop(1, 'rgba(236,200,214,0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mx, my, mr * 1.4, 0, PI * 2);
      ctx.fill();
    },

    mesas(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = rand(151);
      const layer = (col, base, amp, seed) => {
        const r = rand(seed);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, H);
        let x = 0;
        let y = base;
        while (x < W) {
          const flat = r() < 0.55;
          const w = W * (0.02 + r() * 0.06);
          const ny = flat ? y : base - r() * amp;
          ctx.lineTo(x, ny);
          ctx.lineTo(x + w * 0.15, ny);
          ctx.lineTo(x + w, ny);
          y = ny;
          x += w;
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
      };
      layer('rgba(150,120,150,0.9)', H * 0.55, H * 0.45, 152);
      layer('rgba(112,90,120,0.95)', H * 0.75, H * 0.35, 153);
      g();
    },

    skullSign(ctx, W, H) {
      ctx.fillStyle = '#d6cfc4';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 161, 500, '255,255,255', '60,50,40', 2);
      ctx.fillStyle = 'rgba(80,70,60,0.5)';
      ctx.fillRect(0, H * 0.48, W, H * 0.04);
      ctx.fillStyle = '#2a2420';
      const cx = W * 0.5, cy = H * 0.4, r = H * 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, PI * 2);
      ctx.fill();
      ctx.fillRect(cx - r * 0.55, cy + r * 0.6, r * 1.1, r * 0.55);
      ctx.fillStyle = '#d6cfc4';
      [[-0.4, 0], [0.4, 0]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(cx + dx * r, cy + dy * r, r * 0.27, 0, PI * 2);
        ctx.fill();
      });
      ctx.strokeStyle = '#2a2420';
      ctx.lineWidth = H * 0.06;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.9, cy + r * 0.9);
      ctx.lineTo(cx + r * 1.9, cy + r * 2.0);
      ctx.moveTo(cx + r * 1.9, cy + r * 0.9);
      ctx.lineTo(cx - r * 1.9, cy + r * 2.0);
      ctx.stroke();
    },

    metal(ctx, W, H) {
      ctx.fillStyle = '#7a7c78';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 171, 900, '220,220,214', '20,20,20', 2);
    },

    yucca(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = '#1c1416';
      ctx.lineCap = 'round';
      const g = rand(181);
      for (let i = 0; i < 26; i++) {
        const a = -PI / 2 + (g() - 0.5) * 2.6;
        const len = H * (0.3 + g() * 0.45);
        ctx.lineWidth = W * 0.022;
        ctx.beginPath();
        ctx.moveTo(W / 2, H * 0.98);
        ctx.lineTo(W / 2 + Math.cos(a) * len, H * 0.98 + Math.sin(a) * len);
        ctx.stroke();
      }
    }
  };

  const SIZES = {
    title: [1024, 576], guitarTop: [512, 512], fretboard: [512, 32], toolFront: [256, 128], toolPaint: [64, 64], crate: [256, 256], digits: [32, 352],
    plate: [128, 64], label: [128, 128], truck: [256, 256], rust: [128, 128], lockers: [128, 128], dirt: [512, 512], cliff: [256, 256], road: [128, 256],
    sky: [1024, 512], mesas: [1024, 128], skullSign: [256, 128], metal: [128, 128], yucca: [128, 128]
  };

  const REPEAT = ['truck', 'rust', 'dirt', 'cliff', 'road', 'metal', 'toolPaint', 'lockers', 'sky'];

  function tex(r, cache, key) {
    if (!cache[key]) {
      if (!DRAW[key]) return Meet.tex(r, cache, key);
      const [w, h] = SIZES[key] || [256, 256];
      cache[key] = r.texture(w, DRAW[key], { height: h, clamp: !REPEAT.includes(key) });
    }
    return cache[key];
  }

  window.EngArt = { DRAW, SIZES, SLAB, tex, slabWord };
})();
