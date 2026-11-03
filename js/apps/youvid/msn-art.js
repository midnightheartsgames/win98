(function () {
  const { rand } = window.P3D;
  const Meet = window.MeetArt;
  const Mts = window.MtsArt;
  const Eng = window.EngArt;
  const Msc = window.MscArt;
  const PI = Math.PI;

  const CREAM = '#f1ebe1';
  const CARD = '#c7bcb1';
  const BAND = '#3c3b39';
  const SANS = '"Arial Black", "Arial Bold", Arial, sans-serif';
  const COND = 'Impact, "Arial Narrow", "Arial Black", sans-serif';
  const SLAB = '"Rockwell Extra Bold", "Rockwell", "Clarendon", "Courier New", serif';

  function polyGlyph(g) {
    return {
      w: g.w,
      draw(ctx) {
        g.polys.forEach(poly => {
          ctx.beginPath();
          poly.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
          ctx.closePath();
          ctx.fill();
        });
      }
    };
  }

  const GLYPHS = {
    S: Mts.GLYPHS.S,
    N: polyGlyph(Eng.SLAB.N),
    I: Mts.GLYPHS.I,
    E: Mts.GLYPHS.E,
    R: Mts.GLYPHS.R,
    P: {
      w: 108,
      draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(68, 0);
        ctx.ellipse(68, 30, 38, 30, 0, -PI / 2, PI / 2);
        ctx.lineTo(42, 60);
        ctx.lineTo(42, 85);
        ctx.lineTo(60, 85);
        ctx.lineTo(60, 100);
        ctx.lineTo(0, 100);
        ctx.lineTo(0, 85);
        ctx.lineTo(14, 85);
        ctx.lineTo(14, 15);
        ctx.lineTo(0, 15);
        ctx.closePath();
        ctx.moveTo(42, 15);
        ctx.lineTo(64, 15);
        ctx.ellipse(64, 30, 17, 15, 0, -PI / 2, PI / 2);
        ctx.lineTo(42, 45);
        ctx.closePath();
        ctx.fill('evenodd');
      }
    }
  };

  function slabWord(ctx, word, x, y, h, gap, color, stretch) {
    const k = h / 100;
    const kx = k * (stretch || 1);
    let cx = x;
    for (const ch of word) {
      const g = GLYPHS[ch];
      ctx.save();
      ctx.translate(cx, y);
      ctx.scale(kx, k);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      g.draw(ctx);
      ctx.restore();
      cx += (g.w + gap) * kx;
    }
    return cx - x;
  }

  function tf2Words(ctx, x, y, h, fill) {
    ctx.font = `${Math.round(h)}px ${COND}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = fill;
    const wa = ctx.measureText('TEAM').width;
    ctx.fillText('TEAM', x, y);
    ctx.fillText('FORTRESS 2', x + wa + h * 0.22, y);
  }

  function smallLogo(ctx, x, y, h) {
    for (let i = 8; i >= 1; i--) tf2Words(ctx, x - i * h * 0.025, y + i * h * 0.035, h, i > 4 ? '#5a5650' : '#8a847c');
    tf2Words(ctx, x, y, h, '#d8d2c8');
  }

  function speckle(ctx, W, H, seed, n, light, dark, size) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = g() < 0.5 ? `rgba(${dark},${g() * 0.12})` : `rgba(${light},${g() * 0.1})`;
      const s = (size || 2) * (0.5 + g());
      ctx.fillRect(g() * W, g() * H, s, s);
    }
  }

  function quadPath(ctx, pts) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }

  function cylinderShade(ctx, x0, y0, x1, y1, r, light, mid, dark) {
    const a = Math.atan2(y1 - y0, x1 - x0);
    const len = Math.hypot(x1 - x0, y1 - y0);
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, light);
    g.addColorStop(0.45, mid);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.fillRect(0, -r, len, r * 2);
    ctx.restore();
  }

  function jar(ctx, x, y, w, h, level) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(250,236,170,0.9)');
    g.addColorStop(0.3, '#f0d26a');
    g.addColorStop(0.7, '#d9b23e');
    g.addColorStop(1, '#a8862a');
    ctx.fillStyle = 'rgba(232,230,214,0.55)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = g;
    ctx.fillRect(x + w * 0.05, y + h * (1 - level), w * 0.9, h * level);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(x + w * 0.14, y + h * 0.12, w * 0.12, h * 0.75);
    ctx.fillStyle = '#e8e2d6';
    ctx.fillRect(x - w * 0.04, y - h * 0.14, w * 1.08, h * 0.16);
    ctx.fillStyle = '#b8b2a6';
    ctx.fillRect(x - w * 0.04, y + h * -0.02, w * 1.08, h * 0.03);
  }

  function casing(ctx, x, y, a, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, -5 * s, 0, 5 * s);
    g.addColorStop(0, '#f2d696');
    g.addColorStop(0.5, '#c8963c');
    g.addColorStop(1, '#7a5420');
    ctx.fillStyle = g;
    ctx.fillRect(-11 * s, -4 * s, 22 * s, 8 * s);
    ctx.fillStyle = '#6a4818';
    ctx.fillRect(-12 * s, -4.5 * s, 3 * s, 9 * s);
    ctx.restore();
  }

  function titleRifle(ctx) {
    ctx.save();
    ctx.translate(250, 400);
    ctx.rotate(-0.24);
    const wood = ctx.createLinearGradient(-30, 0, 30, 0);
    wood.addColorStop(0, '#8a4a2c');
    wood.addColorStop(0.5, '#6a3420');
    wood.addColorStop(1, '#3e1e12');
    ctx.fillStyle = wood;
    quadPath(ctx, [[-14, -40], [16, -40], [22, 120], [44, 190], [8, 205], [-26, 120]]);
    ctx.fill();
    quadPath(ctx, [[-10, -250], [12, -250], [16, -40], [-14, -40]]);
    ctx.fill();
    ctx.fillStyle = '#2e2c2a';
    ctx.fillRect(-9, -70, 20, 60);
    ctx.fillStyle = '#3a3836';
    ctx.fillRect(-6, -390, 9, 150);
    ctx.fillStyle = '#4a4744';
    ctx.fillRect(-7, -410, 11, 24);
    ctx.fillStyle = '#2a2826';
    ctx.beginPath();
    ctx.arc(14, -30, 10, 0, PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2a2826';
    ctx.stroke();
    ctx.save();
    ctx.translate(46, -150);
    ctx.rotate(0.02);
    const sc = ctx.createLinearGradient(-22, 0, 22, 0);
    sc.addColorStop(0, '#a8a688');
    sc.addColorStop(0.45, '#8a8866');
    sc.addColorStop(1, '#4e4c38');
    ctx.fillStyle = sc;
    ctx.fillRect(-20, -70, 40, 210);
    ctx.fillRect(-25, -80, 50, 30);
    ctx.fillRect(-23, 125, 46, 26);
    ctx.fillStyle = '#5e5c46';
    for (let i = 0; i < 6; i++) ctx.fillRect(-20, -40 + i * 26, 40, 3);
    ctx.fillStyle = '#2a2a24';
    ctx.fillRect(-30, -10, 10, 40);
    ctx.fillRect(-30, 70, 10, 30);
    ctx.restore();
    ctx.restore();
  }

  function crosshair(ctx, x, y, R, col) {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, R * 0.55, 0, PI * 2);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 3;
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x + dx * R * 0.18, y + dy * R * 0.18);
      ctx.lineTo(x + dx * R * 1.25, y + dy * R * 1.25);
      ctx.stroke();
    });
    ctx.restore();
  }

  function portrait(ctx, W, H, paint, crossed) {
    ctx.fillStyle = '#e9e6df';
    ctx.fillRect(0, 0, W, H);
    const m = W * 0.07;
    ctx.save();
    ctx.beginPath();
    ctx.rect(m, m, W - m * 2, H - m * 3.2);
    ctx.clip();
    const bg = ctx.createLinearGradient(0, m, 0, H);
    bg.addColorStop(0, '#5e6266');
    bg.addColorStop(1, '#2a2c30');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    paint(ctx, W, H);
    ctx.restore();
    if (crossed) {
      ctx.strokeStyle = 'rgba(176,28,30,0.88)';
      ctx.lineWidth = W * 0.06;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(W * 0.18, H * 0.2);
      ctx.lineTo(W * 0.84, H * 0.74);
      ctx.moveTo(W * 0.82, H * 0.18);
      ctx.lineTo(W * 0.2, H * 0.76);
      ctx.stroke();
    }
    speckle(ctx, W, H, 33, W * H * 0.02, '255,255,255', '0,0,0', 2);
  }

  function bluShoulders(ctx, W, H) {
    ctx.fillStyle = '#5c7f9e';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.95, W * 0.48, H * 0.25, 0, PI, 0);
    ctx.fill();
  }

  function faceBlob(ctx, cx, cy, rx, ry) {
    const g = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, rx * 0.1, cx, cy, rx * 1.1);
    g.addColorStop(0, '#e8b48e');
    g.addColorStop(1, '#a26a4c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
    ctx.fill();
  }

  function paintEngie(ctx, W, H) {
    bluShoulders(ctx, W, H);
    faceBlob(ctx, W * 0.5, H * 0.5, W * 0.22, H * 0.2);
    ctx.fillStyle = '#d9a63a';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.36, W * 0.26, H * 0.15, 0, PI, 0);
    ctx.fill();
    ctx.fillRect(W * 0.2, H * 0.34, W * 0.6, H * 0.04);
    ctx.fillStyle = '#26221e';
    ctx.fillRect(W * 0.27, H * 0.42, W * 0.46, H * 0.07);
    ctx.fillStyle = '#4a4a4a';
    [0.38, 0.62].forEach(x => { ctx.beginPath(); ctx.arc(W * x, H * 0.455, W * 0.07, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = '#7a3a2a';
    ctx.fillRect(W * 0.42, H * 0.6, W * 0.16, H * 0.02);
  }

  function paintScout(ctx, W, H) {
    bluShoulders(ctx, W, H);
    faceBlob(ctx, W * 0.5, H * 0.5, W * 0.2, H * 0.21);
    ctx.fillStyle = '#4a5f78';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.38, W * 0.22, H * 0.12, 0, PI, 0);
    ctx.fill();
    ctx.fillRect(W * 0.46, H * 0.36, W * 0.36, H * 0.04);
    ctx.fillStyle = '#d27a36';
    ctx.beginPath();
    ctx.ellipse(W * 0.72, H * 0.5, W * 0.05, H * 0.07, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2a1e';
    [0.43, 0.57].forEach(x => { ctx.beginPath(); ctx.arc(W * x, H * 0.47, W * 0.02, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = '#7a3a2a';
    ctx.fillRect(W * 0.43, H * 0.6, W * 0.14, H * 0.02);
  }

  function paintSoldier(ctx, W, H) {
    bluShoulders(ctx, W, H);
    faceBlob(ctx, W * 0.5, H * 0.56, W * 0.21, H * 0.19);
    ctx.fillStyle = '#5a5639';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.48, W * 0.3, H * 0.2, 0, PI, 0);
    ctx.fill();
    ctx.fillRect(W * 0.18, H * 0.46, W * 0.64, H * 0.04);
    ctx.fillStyle = '#7a3a2a';
    ctx.fillRect(W * 0.4, H * 0.66, W * 0.2, H * 0.025);
  }

  function strata(ctx, W, H, base, seed, light) {
    const g = rand(seed);
    ctx.fillStyle = base[0];
    ctx.fillRect(0, 0, W, H);
    let y = 0;
    while (y < H) {
      const h = H * (0.03 + g() * 0.09);
      ctx.fillStyle = base[Math.floor(g() * base.length)];
      ctx.globalAlpha = 0.55 + g() * 0.45;
      ctx.fillRect(0, y, W, h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(70,30,20,0.25)';
      ctx.fillRect(0, y + h - 2, W, 2);
      y += h;
    }
    for (let i = 0; i < 30; i++) {
      const x = g() * W;
      ctx.fillStyle = `rgba(60,24,16,${0.08 + g() * 0.12})`;
      ctx.fillRect(x, 0, 1 + g() * 3, H);
    }
    const lg = ctx.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, `rgba(255,230,200,${light || 0.12})`);
    lg.addColorStop(1, 'rgba(80,30,20,0.12)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, seed + 3, W * H * 0.06, '255,230,210', '60,20,10', 2);
  }

  function planks(ctx, W, H, cols, seed, vertical, gap) {
    const g = rand(seed);
    const n = cols.length > 2 ? 8 : 6;
    for (let i = 0; i < n; i++) {
      const c = cols[Math.floor(g() * cols.length)];
      ctx.fillStyle = c;
      if (vertical) ctx.fillRect(i * W / n, 0, W / n, H); else ctx.fillRect(0, i * H / n, W, H / n);
      ctx.fillStyle = gap;
      if (vertical) ctx.fillRect(i * W / n, 0, 2, H); else ctx.fillRect(0, i * H / n, W, 2);
      for (let k = 0; k < 14; k++) {
        ctx.fillStyle = `rgba(40,30,20,${0.04 + g() * 0.08})`;
        if (vertical) ctx.fillRect(i * W / n + g() * W / n, 0, 1, H); else ctx.fillRect(0, i * H / n + g() * H / n, W, 1);
      }
      ctx.fillStyle = 'rgba(30,20,14,0.35)';
      const nx = vertical ? i * W / n + g() * W / n : g() * W, ny = vertical ? g() * H : i * H / n + g() * H / n;
      ctx.beginPath();
      ctx.ellipse(nx, ny, 3, 2, 0, 0, PI * 2);
      ctx.fill();
    }
    speckle(ctx, W, H, seed + 5, W * H * 0.05, '255,255,255', '0,0,0', 2);
  }

  const DRAW = {
    title(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = '#f5f2ed';
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = CARD;
      quadPath(ctx, [[80, 40], [1208, 47], [1202, 676], [86, 668]]);
      ctx.fill();
      ctx.save();
      quadPath(ctx, [[80, 40], [1208, 47], [1202, 676], [86, 668]]);
      ctx.clip();
      ctx.fillStyle = '#e8e1d8';
      quadPath(ctx, [[196, 40], [512, 40], [560, 676], [244, 676]]);
      ctx.fill();
      ctx.fillStyle = '#b8ada2';
      quadPath(ctx, [[352, 40], [372, 40], [420, 676], [400, 676]]);
      ctx.fill();
      quadPath(ctx, [[196, 228], [526, 222], [528, 238], [198, 244]]);
      ctx.fill();
      ctx.fillStyle = '#d8d0c6';
      quadPath(ctx, [[86, 560], [1202, 600], [1202, 676], [86, 668]]);
      ctx.globalAlpha = 0.45;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
      const band = () => quadPath(ctx, [[180, 157], [1280, 155], [1280, 548], [402, 506]]);
      ctx.fillStyle = BAND;
      band();
      ctx.fill();
      ctx.save();
      band();
      ctx.clip();
      Meet.emblem(ctx, 760, 345, 300, '#4a4846', BAND);
      ctx.restore();
      crosshair(ctx, 968, 128, 50, '#e2dbd2');
      titleRifle(ctx);
      jar(ctx, 312, 548, 50, 78, 0.8);
      jar(ctx, 346, 590, 46, 66, 0.86);
      [[150, 610, 0.4], [215, 640, -0.6], [400, 570, 1.2], [442, 628, 0.2], [282, 655, 2.1], [470, 600, -1.0], [128, 570, 2.6]].forEach(([x, y, a]) => casing(ctx, x, y, a, 1));
      ctx.fillStyle = CREAM;
      ctx.font = `bold 46px ${SANS}`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Meet', 308, 252);
      ctx.font = `bold 22px ${SANS}`;
      ctx.fillText('THE', 330, 278);
      slabWord(ctx, 'SNIPER', 306, 284, 92, 10, CREAM, 1.32);
      smallLogo(ctx, 532, 622, 30);
      ctx.fillStyle = '#e4dcd2';
      ctx.font = `bold 12px ${SANS}`;
      ctx.fillText('COPYRIGHT LOLOLOL', 760, 603);
      ctx.font = 'bold 17px Arial, sans-serif';
      ctx.fillStyle = '#ece6dc';
      ctx.fillText('A Valve Picture', 760, 626);
      ctx.restore();
    },

    photoEngie(ctx, W, H) {
      portrait(ctx, W, H, paintEngie, true);
    },

    photoScout(ctx, W, H) {
      portrait(ctx, W, H, paintScout, true);
    },

    photoSoldier(ctx, W, H) {
      portrait(ctx, W, H, paintSoldier, false);
    },

    photoFrame(ctx, W, H) {
      ctx.fillStyle = '#e9e6df';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 35, W * H * 0.03, '255,255,255', '0,0,0', 2);
    },

    mug(ctx, W, H) {
      ctx.fillStyle = '#ece9e2';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c8c4bb';
      ctx.fillRect(0, 0, W, H * 0.06);
      const x = W * 0.38;
      ctx.fillStyle = '#7e1f1c';
      ctx.font = `bold ${Math.round(H * 0.5)}px ${SLAB}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('#1', x, H * 0.62);
      ctx.font = `bold ${Math.round(H * 0.15)}px Arial, sans-serif`;
      ctx.fillText('SNIPER', x, H * 0.84);
      ctx.textAlign = 'left';
      const g = rand(71);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(110,90,70,${g() * 0.18})`;
        ctx.fillRect(g() * W, g() * H, 2 + g() * 4, 1 + g() * 2);
      }
    },

    sign(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(PI / 4);
      ctx.fillStyle = '#1e1a16';
      ctx.fillRect(-W * 0.34, -H * 0.34, W * 0.68, H * 0.68);
      ctx.fillStyle = '#e2b42e';
      ctx.fillRect(-W * 0.31, -H * 0.31, W * 0.62, H * 0.62);
      ctx.restore();
      ctx.fillStyle = '#1e1a16';
      ctx.save();
      ctx.translate(W * 0.5, H * 0.52);
      ctx.beginPath();
      ctx.arc(-W * 0.02, -H * 0.17, W * 0.045, 0, PI * 2);
      ctx.fill();
      ctx.lineWidth = W * 0.05;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#1e1a16';
      ctx.beginPath();
      ctx.moveTo(-W * 0.02, -H * 0.11);
      ctx.lineTo(W * 0.02, H * 0.04);
      ctx.lineTo(W * 0.12, H * 0.16);
      ctx.moveTo(W * 0.02, H * 0.04);
      ctx.lineTo(-W * 0.1, H * 0.13);
      ctx.lineTo(-W * 0.14, H * 0.2);
      ctx.moveTo(-W * 0.01, -H * 0.07);
      ctx.lineTo(W * 0.13, -H * 0.04);
      ctx.moveTo(-W * 0.01, -H * 0.07);
      ctx.lineTo(-W * 0.14, -H * 0.02);
      ctx.stroke();
      ctx.restore();
      speckle(ctx, W, H, 13, W * H * 0.04, '255,255,255', '0,0,0', 2);
    },

    billboard(ctx, W, H) {
      ctx.fillStyle = '#e6dccb';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#4b6d9c';
      ctx.fillRect(W * 0.02, H * 0.04, W * 0.96, H * 0.92);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, 'rgba(255,255,255,0.18)');
      sky.addColorStop(1, 'rgba(0,0,0,0.1)');
      ctx.fillStyle = sky;
      ctx.fillRect(W * 0.02, H * 0.04, W * 0.96, H * 0.92);
      ctx.font = `bold ${Math.round(H * 0.42)}px ${SLAB}`;
      ctx.textBaseline = 'alphabetic';
      for (let i = 6; i >= 1; i--) {
        ctx.fillStyle = i > 3 ? '#4a2a14' : '#7a4a22';
        ctx.fillText('FOOD', W * 0.07 + i * 2, H * 0.48 + i * 2.4);
      }
      ctx.fillStyle = '#e8a446';
      ctx.fillText('FOOD', W * 0.07, H * 0.48);
      ctx.fillStyle = '#f2ece0';
      ctx.font = `bold ${Math.round(H * 0.13)}px Arial, sans-serif`;
      ctx.fillText('CAMPING FUN', W * 0.32, H * 0.68);
      ctx.fillText('ALL YEAR ROUND', W * 0.28, H * 0.86);
      speckle(ctx, W, H, 17, W * H * 0.05, '255,255,255', '30,20,10', 3);
      const g = rand(19);
      for (let i = 0; i < 12; i++) {
        const x = g() * W;
        const gr = ctx.createLinearGradient(0, H * 0.1, 0, H);
        gr.addColorStop(0, 'rgba(90,60,40,0)');
        gr.addColorStop(1, `rgba(90,60,40,${0.1 + g() * 0.15})`);
        ctx.fillStyle = gr;
        ctx.fillRect(x, H * 0.1, 4 + g() * 10, H);
      }
    },

    rock(ctx, W, H) {
      strata(ctx, W, H, ['#b8644c', '#c8785a', '#a65a46', '#d48c6c', '#bd6e52'], 41, 0.14);
    },

    rockPale(ctx, W, H) {
      strata(ctx, W, H, ['#c88c76', '#d49e86', '#b87c6a', '#dcac94'], 43, 0.2);
    },

    road(ctx, W, H) {
      ctx.fillStyle = '#8a8884';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 51, W * H * 0.12, '255,255,255', '0,0,0', 1);

      ctx.fillStyle = '#d8b032';
      ctx.fillRect(W * 0.485 - W * 0.022, 0, W * 0.016, H);
      ctx.fillRect(W * 0.515 + W * 0.006, 0, W * 0.016, H);
      ctx.fillStyle = 'rgba(232,226,214,0.8)';
      ctx.fillRect(W * 0.02, 0, W * 0.012, H);
      ctx.fillRect(W * 0.966, 0, W * 0.012, H);
    },

    sand(ctx, W, H) {
      ctx.fillStyle = '#c99a72';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 61, W * H * 0.4, '255,236,210', '90,50,30', 2);
      const g = rand(63);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '110,70,50' : '230,190,150'},${0.15 + g() * 0.2})`;
        ctx.beginPath();
        ctx.ellipse(g() * W, g() * H, 2 + g() * 5, 1 + g() * 3, 0, 0, PI * 2);
        ctx.fill();
      }
    },

    sky(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#9fa8b2');
      g.addColorStop(0.35, '#c6c4be');
      g.addColorStop(0.62, '#e6d8bc');
      g.addColorStop(0.72, '#f1dfb8');
      g.addColorStop(1, '#e8cfa4');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const r = rand(67);
      for (let i = 0; i < 26; i++) {
        const x = r() * W, y = H * (0.25 + r() * 0.3), w = W * (0.03 + r() * 0.06), h = H * (0.015 + r() * 0.03);
        for (let k = 0; k < 6; k++) {
          const cg = ctx.createRadialGradient(x + k * w * 0.4, y, 0, x + k * w * 0.4, y, w * 0.6);
          cg.addColorStop(0, `rgba(250,246,240,${0.35 + r() * 0.2})`);
          cg.addColorStop(1, 'rgba(250,246,240,0)');
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.ellipse(x + k * w * 0.4, y - r() * h, w * 0.6, h * (1 + r()), 0, 0, PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(150,140,150,0.12)';
        ctx.beginPath();
        ctx.ellipse(x + w, y + h * 0.6, w * 1.6, h * 0.5, 0, 0, PI * 2);
        ctx.fill();
      }
    },

    skyNoon(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#9fb2c0');
      g.addColorStop(0.6, '#c4ccd0');
      g.addColorStop(1, '#e8e2d2');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    planksCream(ctx, W, H) {
      planks(ctx, W, H, ['#d9d3c2', '#cfc8b6', '#e0dacb', '#d4ccba'], 71, false, 'rgba(90,80,64,0.55)');
    },

    planksGrey(ctx, W, H) {
      planks(ctx, W, H, ['#b2b2ac', '#a4a5a0', '#bcbab2', '#9c9e9a'], 73, true, 'rgba(50,48,46,0.6)');
    },

    planksDark(ctx, W, H) {
      planks(ctx, W, H, ['#5e4636', '#54402f', '#664c3a'], 79, false, 'rgba(20,14,10,0.7)');
    },

    planksWarmH(ctx, W, H) {
      planks(ctx, W, H, ['#a8906e', '#9c8464', '#b29a78', '#94805e'], 85, false, 'rgba(50,34,20,0.5)');
    },

    planksWarm(ctx, W, H) {
      planks(ctx, W, H, ['#a8784e', '#9a6c44', '#b28256', '#8e6440'], 83, true, 'rgba(40,24,14,0.6)');
    },

    crate(ctx, W, H) {
      ctx.fillStyle = '#8c6c4a';
      ctx.fillRect(0, 0, W, H);
      planks(ctx, W, H, ['#8c6c4a', '#826446', '#967450'], 87, false, 'rgba(40,26,16,0.6)');
      ctx.fillStyle = '#6e5236';
      ctx.fillRect(0, 0, W, H * 0.1);
      ctx.fillRect(0, H * 0.9, W, H * 0.1);
      ctx.fillRect(0, 0, W * 0.1, H);
      ctx.fillRect(W * 0.9, 0, W * 0.1, H);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-0.78);
      ctx.fillRect(-W * 0.62, -H * 0.05, W * 1.24, H * 0.1);
      ctx.restore();
      ctx.fillStyle = 'rgba(30,20,12,0.5)';
      [[0.05, 0.05], [0.95, 0.05], [0.05, 0.95], [0.95, 0.95]].forEach(([x, y]) => ctx.fillRect(W * x - 2, H * y - 2, 4, 4));
    },

    phoneBox(ctx, W, H) {
      planks(ctx, W, H, ['#d6d0c2', '#ccc6b6', '#dcd6c8'], 91, true, 'rgba(80,74,64,0.55)');
      ctx.fillStyle = '#56524c';
      ctx.font = `bold ${Math.round(H * 0.22)}px ${SLAB}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PHONE', W / 2, H * 0.17);
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(70,64,56,0.6)';
      ctx.fillRect(0, H * 0.3, W, 3);
      speckle(ctx, W, H, 93, W * H * 0.05, '255,255,255', '40,30,20', 3);
    },

    clock(ctx, W, H) {
      ctx.fillStyle = '#d9c8c6';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ece0dc';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.42, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6a5a58';
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 + Math.cos(a) * W * 0.32, H / 2 + Math.sin(a) * H * 0.32);
        ctx.lineTo(W / 2 + Math.cos(a) * W * 0.4, H / 2 + Math.sin(a) * H * 0.4);
        ctx.stroke();
      }
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(W / 2, H / 2);
      ctx.lineTo(W / 2 + W * 0.18, H / 2 - H * 0.12);
      ctx.moveTo(W / 2, H / 2);
      ctx.lineTo(W / 2 - W * 0.04, H / 2 - H * 0.3);
      ctx.stroke();
    },

    bobbleFace(ctx, W, H) {
      ctx.fillStyle = '#e2ab88';
      ctx.fillRect(0, 0, W, H);
      const P = (a, p) => [(a / (2 * PI) + 0.5) * W, (0.5 - p / PI) * H];
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(255,220,190,0.3)');
      g.addColorStop(0.6, 'rgba(255,220,190,0)');
      g.addColorStop(1, 'rgba(120,60,40,0.3)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3a3330';
      [-1, 1].forEach(s => {
        ctx.beginPath();
        const [x0, y0] = P(s * 1.05, 0.55);
        const [x1, y1] = P(s * 2.6, -0.4);
        ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, 0, 0, PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#4a403a';
      const [bx, by] = P(PI * 0.999, 0);
      ctx.fillRect(bx - W * 0.2, by - H * 0.25, W * 0.2, H * 0.5);
      const [cx0] = P(-PI, 0);
      ctx.fillRect(cx0, by - H * 0.25, W * 0.2, H * 0.5);
      [-1, 1].forEach(s => {
        const [ex, ey] = P(s * 0.34, 0.14);
        ctx.fillStyle = '#f4f0e8';
        ctx.beginPath();
        ctx.ellipse(ex, ey, W * 0.034, H * 0.07, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a2420';
        ctx.beginPath();
        ctx.arc(ex, ey + H * 0.005, W * 0.014, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2a2420';
        ctx.lineWidth = H * 0.025;
        ctx.beginPath();
        const [b0x, b0y] = P(s * 0.16, 0.36);
        const [b1x, b1y] = P(s * 0.52, 0.31);
        ctx.moveTo(b0x, b0y);
        ctx.quadraticCurveTo((b0x + b1x) / 2, b0y - H * 0.04, b1x, b1y);
        ctx.stroke();
      });
      ctx.fillStyle = '#2a2420';
      const [mx, my] = P(0, -0.32);
      ctx.fillRect(mx - W * 0.045, my - H * 0.03, W * 0.09, H * 0.035);
      ctx.fillStyle = '#5a2a22';
      ctx.beginPath();
      ctx.ellipse(mx, my + H * 0.06, W * 0.03, H * 0.025, 0, 0, PI * 2);
      ctx.fill();

    },

    bobbleBase(ctx, W, H) {
      ctx.fillStyle = '#1e1c1a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e2b42a';
      ctx.save();
      ctx.translate(W / 2, H / 2);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, W * 0.4, i * PI * 2 / 3 - 0.45, i * PI * 2 / 3 + 0.45);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#1e1c1a';
      ctx.beginPath();
      ctx.arc(0, 0, W * 0.1, 0, PI * 2);
      ctx.fill();
      ctx.restore();
    },

    van(ctx, W, H) {
      ctx.fillStyle = '#c9b08a';
      ctx.fillRect(0, 0, W, H);
      const g = rand(97);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = 'rgba(80,60,40,0.35)';
        ctx.fillRect(0, H * (0.24 * i + 0.1), W, 2);
      }
      for (let i = 0; i < 20; i++) {
        const x = g() * W;
        const gr = ctx.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, 'rgba(120,80,50,0)');
        gr.addColorStop(1, `rgba(120,80,50,${0.12 + g() * 0.2})`);
        ctx.fillStyle = gr;
        ctx.fillRect(x, 0, 3 + g() * 12, H);
      }
      speckle(ctx, W, H, 99, W * H * 0.08, '255,255,240', '60,40,20', 3);
    },

    siding(ctx, W, H) {
      ctx.fillStyle = '#8fa2b0';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = 'rgba(40,56,70,0.35)';
        ctx.fillRect(0, i * H / 16, W, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(0, i * H / 16 + 2, W, 3);
      }
      speckle(ctx, W, H, 101, W * H * 0.05, '255,255,255', '20,30,40', 2);
    },

    rust(ctx, W, H) {
      ctx.fillStyle = '#ad6a42';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(60,24,10,0.25)' : 'rgba(255,200,160,0.1)';
        ctx.fillRect(i * W / 24, 0, W / 48, H);
      }
      speckle(ctx, W, H, 103, W * H * 0.1, '255,210,170', '60,24,10', 3);
    },

    adobe(ctx, W, H) {
      ctx.fillStyle = '#d6bc8e';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 107, W * H * 0.2, '255,240,210', '100,70,40', 3);
      ctx.strokeStyle = 'rgba(110,80,50,0.4)';
      ctx.lineWidth = 1.5;
      const g = rand(109);
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        let x = g() * W, y = g() * H;
        ctx.moveTo(x, y);
        for (let k = 0; k < 5; k++) {
          x += (g() - 0.5) * 30;
          y += g() * 20;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },

    steel(ctx, W, H) {
      ctx.fillStyle = '#3c3a38';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 113, W * H * 0.1, '160,150,140', '10,8,6', 2);
    },

    tank(ctx, W, H) {
      ctx.fillStyle = '#8e9090';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 32; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(30,30,30,0.18)' : 'rgba(255,255,255,0.1)';
        ctx.fillRect(i * W / 32, 0, W / 64, H);
      }
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = 'rgba(40,40,40,0.4)';
        ctx.fillRect(0, i * H / 4, W, 3);
      }
      speckle(ctx, W, H, 117, W * H * 0.06, '255,255,255', '60,40,30', 3);
    },

    barrel(ctx, W, H) {
      ctx.fillStyle = '#d8b030';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2a2622';
      ctx.fillRect(0, H * 0.22, W, H * 0.06);
      ctx.fillRect(0, H * 0.72, W, H * 0.06);
      ctx.fillStyle = '#222';
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(W * (0.4 + i * 0.02), H * 0.4);
        ctx.lineTo(W * (0.43 + i * 0.02), H * 0.4);
        ctx.lineTo(W * (0.4 + i * 0.02), H * 0.6);
        ctx.fill();
      }
      speckle(ctx, W, H, 119, W * H * 0.08, '255,255,200', '60,40,10', 2);
    },

    mesas(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const layer = (col, base, amp, seed) => {
        const r = rand(seed);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, H);
        let x = 0;
        let y = base;
        while (x < W) {
          const tall = r() < 0.35;
          const w = W * (0.02 + r() * 0.07);
          const ny = tall ? base - amp * (0.5 + r() * 0.5) : base - r() * amp * 0.25;
          ctx.lineTo(x + w * 0.08, ny + amp * 0.04);
          ctx.quadraticCurveTo(x + w * 0.12, ny, x + w * 0.3, ny);
          ctx.lineTo(x + w * 0.7, ny);
          ctx.quadraticCurveTo(x + w * 0.88, ny, x + w * 0.92, ny + amp * 0.04);
          y = ny;
          x += w;
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
      };
      layer('#b49aa8', H * 0.62, H * 0.5, 151);
      layer('#a88486', H * 0.82, H * 0.32, 157);
      layer('#9c726a', H * 0.95, H * 0.16, 163);
    },

    grass(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = rand(171);
      for (let i = 0; i < 40; i++) {
        const x = W * (0.3 + g() * 0.4);
        ctx.strokeStyle = g() < 0.5 ? '#d8bc7a' : '#b89a5a';
        ctx.lineWidth = 2 + g() * 2;
        ctx.beginPath();
        ctx.moveTo(x, H);
        ctx.quadraticCurveTo(x + (g() - 0.5) * W * 0.2, H * 0.5, x + (g() - 0.5) * W * 0.5, H * (0.05 + g() * 0.3));
        ctx.stroke();
      }
    },

    patch(ctx, W, H) {
      ctx.fillStyle = '#b8393b';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e8a446';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.46, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a8302c';
      ctx.lineWidth = W * 0.07;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.28, 0, PI * 2);
      ctx.stroke();
      ctx.lineWidth = W * 0.06;
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(W / 2 + dx * W * 0.06, H / 2 + dy * H * 0.06);
        ctx.lineTo(W / 2 + dx * W * 0.4, H / 2 + dy * H * 0.4);
        ctx.stroke();
      });
    },

    scope(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, R = H * 0.485;
      const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
      g.addColorStop(0, '#fffaf2');
      g.addColorStop(0.7, '#f8e8d0');
      g.addColorStop(0.88, '#d8a070');
      g.addColorStop(0.96, '#5a2e16');
      g.addColorStop(1, '#000000');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(30,22,16,0.85)';
      ctx.lineWidth = Math.max(1, H * 0.0035);
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.stroke();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = H * 0.008;
      ctx.beginPath();
      ctx.moveTo(cx + R * 0.05, cy - R * 0.98);
      ctx.bezierCurveTo(cx + R * 0.45, cy - R * 0.72, cx + R * 0.82, cy - R * 0.32, cx + R * 0.93, cy + R * 0.02);
      ctx.stroke();
    },

    sun(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.5);
      g.addColorStop(0, 'rgb(255,255,240)');
      g.addColorStop(0.18, 'rgb(255,246,214)');
      g.addColorStop(0.4, 'rgb(150,120,80)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    mirror(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, 'rgb(40,44,46)');
      g.addColorStop(0.4, 'rgb(10,12,12)');
      g.addColorStop(0.55, 'rgb(34,36,38)');
      g.addColorStop(1, 'rgb(6,6,6)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    retail(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1280, 720);
      Msc.retailBox(ctx, 251, 131, 268, 440);
      ctx.fillStyle = '#2e2e2e';
      ctx.font = '25px Arial, sans-serif';
      ctx.fillText('Available Now for PC.', 703, 357);
      ctx.restore();
    },

    boxes(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1280, 720);
      Msc.orangeBox(ctx, 137, 160, 245, 380, null);
      Msc.orangeBox(ctx, 240, 190, 236, 362, '#5ab03a');
      Msc.orangeBox(ctx, 327, 240, 232, 320, '#f4f4f4');
      ctx.fillStyle = '#2e2e2e';
      ctx.font = '25px Arial, sans-serif';
      ctx.fillText('Also Available in The Orange Box.', 653, 357);
      ctx.restore();
    }
  };

  const SIZES = {
    title: [1024, 576], photoEngie: [128, 160], photoScout: [128, 160], photoSoldier: [128, 160], photoFrame: [32, 32], mug: [256, 128], sign: [128, 128],
    billboard: [512, 256], rock: [256, 256], rockPale: [256, 256], road: [256, 512], sand: [256, 256], sky: [1024, 256], skyNoon: [64, 256],
    planksCream: [256, 256], planksGrey: [256, 256], planksDark: [256, 256], planksWarm: [256, 256], planksWarmH: [256, 256], crate: [256, 256], phoneBox: [256, 256], clock: [128, 128],
    bobbleFace: [256, 128], bobbleBase: [128, 128], van: [256, 256], siding: [256, 256], rust: [256, 256], adobe: [256, 256], steel: [64, 64], tank: [256, 256],
    barrel: [128, 128], patch: [64, 64], scope: [1024, 576], sun: [128, 128], mirror: [64, 64], retail: [1024, 576], boxes: [1024, 576], mesas: [1024, 256], grass: [128, 128]
  };

  const CLAMP = { title: true, photoEngie: true, photoScout: true, photoSoldier: true, mug: false, sign: true, billboard: true, clock: true, bobbleBase: true, patch: true, scope: true, sun: true, retail: true, boxes: true, sky: false, grass: true };

  function tex(r, cache, key) {
    if (!cache[key]) {
      if (!DRAW[key]) return Msc.tex(r, cache, key);
      const [w, h] = SIZES[key];
      cache[key] = r.texture(w, DRAW[key], { height: h, clamp: !!CLAMP[key] });
    }
    return cache[key];
  }

  window.MsnArt = { DRAW, SIZES, GLYPHS, tex, slabWord };
})();
