(function () {
  const { rand } = window.P3D;
  const Meet = window.MeetArt;
  const Mts = window.MtsArt;
  const PI = Math.PI;

  const CREAM = '#f2ebe2';
  const POSTER = '#4b6f95';
  const BAND = '#3b3a39';
  const SANS = '"Arial Black", "Arial Bold", Arial, sans-serif';
  const COND = 'Impact, "Arial Narrow", "Arial Black", sans-serif';

  function rects(ctx, list) {
    list.forEach(([x0, y0, x1, y1]) => ctx.rect(x0, y0, x1 - x0, y1 - y0));
  }

  const GLYPHS = {
    S: Mts.GLYPHS.S,
    O: Mts.GLYPHS.O,
    C: {
      w: 110,
      draw(ctx) {
        ctx.beginPath();
        ctx.ellipse(56, 50, 56, 50, 0, 0.2, PI * 2 - 0.2);
        ctx.lineTo(56 + Math.cos(-0.62) * 27, 50 + Math.sin(-0.62) * 31);
        ctx.ellipse(56, 50, 27, 31, 0, -0.62, 0.62, true);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        rects(ctx, [[86, 4, 104, 38], [86, 62, 104, 96]]);
        ctx.fill();
      }
    },
    U: {
      w: 124,
      draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(14, 15);
        ctx.lineTo(14, 58);
        ctx.ellipse(62, 58, 48, 42, 0, PI, 0, true);
        ctx.lineTo(110, 15);
        ctx.lineTo(84, 15);
        ctx.lineTo(84, 58);
        ctx.ellipse(62, 58, 22, 22, 0, 0, PI);
        ctx.lineTo(40, 15);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        rects(ctx, [[0, 0, 56, 15], [68, 0, 124, 15]]);
        ctx.fill();
      }
    },
    T: {
      w: 112,
      draw(ctx) {
        ctx.beginPath();
        rects(ctx, [[0, 0, 112, 17], [0, 0, 14, 38], [98, 0, 112, 38], [42, 0, 70, 100], [26, 85, 86, 100]]);
        ctx.fill();
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

  function smallLogo(ctx, x, y, h, top, mid, low) {
    for (let i = 8; i >= 1; i--) tf2Words(ctx, x - i * h * 0.025, y + i * h * 0.035, h, i > 4 ? low : mid);
    tf2Words(ctx, x, y, h, top);
  }

  function speckle(ctx, W, H, seed, n, light, dark, size) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = g() < 0.5 ? `rgba(${dark},${g() * 0.12})` : `rgba(${light},${g() * 0.1})`;
      ctx.fillRect(g() * W, g() * H, size || 2, size || 2);
    }
  }

  function bat(ctx, x0, y0, x1, y1, w0, w1, col) {
    const a = Math.atan2(y1 - y0, x1 - x0);
    const len = Math.hypot(x1 - x0, y1 - y0);
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(a);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, w0 * 1.1, PI / 2, PI * 1.5);
    ctx.lineTo(len * 0.12, -w0 * 0.55);
    ctx.bezierCurveTo(len * 0.45, -w0 * 0.6, len * 0.62, -w1, len * 0.86, -w1);
    ctx.arc(len * 0.86, 0, w1, -PI / 2, PI / 2);
    ctx.bezierCurveTo(len * 0.62, w1, len * 0.45, w0 * 0.6, len * 0.12, w0 * 0.55);
    ctx.lineTo(0, w0 * 1.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = POSTER;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const bx = len * (0.05 + i * 0.035);
      ctx.moveTo(bx, -w0 * 0.6);
      ctx.lineTo(bx + len * 0.02, w0 * 0.6);
      ctx.lineTo(bx + len * 0.03, w0 * 0.6);
      ctx.lineTo(bx + len * 0.01, -w0 * 0.6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function burst(ctx, x, y, R, n, col, seed) {
    const g = rand(seed);
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i <= n * 2; i++) {
      const a = (i / (n * 2)) * PI * 2 - 0.4;
      const r = i % 2 ? R * (0.32 + g() * 0.15) : R * (0.7 + g() * 0.5);
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function brickWall(ctx, W, H, base, mortar, seed, rows, cols, stain) {
    const g = rand(seed);
    ctx.fillStyle = mortar;
    ctx.fillRect(0, 0, W, H);
    const bh = H / rows, bw = W / cols;
    for (let j = 0; j < rows; j++) {
      const off = (j % 2) * bw * 0.5;
      for (let i = -1; i <= cols; i++) {
        const x = i * bw + off;
        const v = 0.86 + g() * 0.24;
        const red = g() < 0.06 ? 1 : 0;
        const c = base.map((ch, k) => Math.round(Math.min(255, ch * v + (red && k === 0 ? 22 : 0) - (red && k === 2 ? 10 : 0))));
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        ctx.fillRect(x + 1.5, j * bh + 1.5, bw - 3, bh - 3);
      }
    }
    speckle(ctx, W, H, seed + 1, W * H * 0.05, '255,255,255', '0,0,0', 2);
    if (stain) {
      for (let i = 0; i < 6; i++) {
        const x = g() * W, w = 10 + g() * 30;
        const gr = ctx.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, 'rgba(60,50,50,0)');
        gr.addColorStop(1, `rgba(60,50,50,${0.08 + g() * 0.12})`);
        ctx.fillStyle = gr;
        ctx.fillRect(x, 0, w, H);
      }
    }
  }

  function textSign(ctx, W, H, bg, fg, lines, font, border) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = H * 0.06;
      ctx.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1);
    }
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => {
      ctx.font = font;
      ctx.fillText(l, W / 2, H * (i + 1) / (lines.length + 1));
    });
    ctx.textAlign = 'left';
  }

  function redEmblem(ctx, cx, cy, R) {
    ctx.save();
    ctx.translate(cx, cy);
    const g = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
    g.addColorStop(0, '#d8463a');
    g.addColorStop(1, '#8e2a22');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f2c8a8';
    ctx.lineWidth = R * 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.92, 0, PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f2d0b4';
    ctx.font = `bold ${Math.round(R * 0.11)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const word = 'RELIABLE · EXCAVATION · DEMOLITION · ';
    for (let i = 0; i < word.length; i++) {
      const a = -PI / 2 + (i / word.length) * PI * 2;
      ctx.save();
      ctx.rotate(a + PI / 2);
      ctx.fillText(word[i], 0, -R * 0.78);
      ctx.restore();
    }
    ctx.font = `bold ${Math.round(R * 0.62)}px "Times New Roman", serif`;
    ctx.fillText('R', 0, R * 0.04);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  function retailBox(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#c9c4bc';
    ctx.beginPath();
    ctx.moveTo(x + w, y + h * 0.02);
    ctx.lineTo(x + w + w * 0.12, y + h * 0.05);
    ctx.lineTo(x + w + w * 0.12, y + h * 0.97);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4f0ea';
    ctx.fillRect(x, y, w, h);
    const sky = ctx.createLinearGradient(0, y, 0, y + h * 0.7);
    sky.addColorStop(0, '#e8d2b8');
    sky.addColorStop(1, '#c86a3c');
    ctx.fillStyle = sky;
    ctx.fillRect(x + w * 0.04, y + h * 0.05, w * 0.92, h * 0.68);
    const g = rand(77);
    const team = [['#b8382e', 0.18, 0.32], ['#3a3a3a', 0.42, 0.24], ['#b8382e', 0.66, 0.3], ['#8a5a3a', 0.86, 0.26], ['#b8382e', 0.3, 0.22]];
    team.forEach(([c, fx, fw]) => {
      ctx.fillStyle = c;
      const bx = x + w * fx, by = y + h * (0.22 + g() * 0.08);
      ctx.beginPath();
      ctx.ellipse(bx, by, w * fw * 0.22, h * 0.06, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillRect(bx - w * fw * 0.3, by + h * 0.04, w * fw * 0.6, h * 0.3);
    });
    ctx.fillStyle = '#2c2a28';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.4, w * 0.2, h * 0.1, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3a30';
    ctx.fillRect(x + w * 0.22, y + h * 0.45, w * 0.56, h * 0.22);
    ctx.save();
    ctx.translate(x + w * 0.5, y + h * 0.8);
    ctx.rotate(-0.08);
    ctx.font = `${Math.round(h * 0.11)}px ${COND}`;
    ctx.textAlign = 'center';
    for (let i = 5; i >= 1; i--) {
      ctx.fillStyle = i > 2 ? '#6a2e14' : '#a8501e';
      ctx.fillText('TEAM FORTRESS 2', -i * 1.2, i * 1.6);
    }
    ctx.fillStyle = '#f08a2c';
    ctx.fillText('TEAM FORTRESS 2', 0, 0);
    ctx.restore();
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(x + w * 0.06, y + h * 0.87, w * 0.12, h * 0.1);
    ctx.fillStyle = '#c0302a';
    ctx.fillRect(x + w * 0.2, y + h * 0.89, w * 0.1, h * 0.08);
    ctx.fillStyle = '#e8e4dc';
    ctx.fillRect(x + w * 0.08, y + h * 0.885, w * 0.08, h * 0.07);
    ctx.restore();
  }

  function orangeBox(ctx, x, y, w, h, band) {
    ctx.fillStyle = '#c45a1a';
    ctx.beginPath();
    ctx.moveTo(x + w, y + h * 0.02);
    ctx.lineTo(x + w + w * 0.1, y + h * 0.05);
    ctx.lineTo(x + w + w * 0.1, y + h * 0.97);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    const og = ctx.createLinearGradient(x, y, x + w, y + h);
    og.addColorStop(0, '#f8902e');
    og.addColorStop(1, '#e06a1c');
    ctx.fillStyle = og;
    ctx.fillRect(x, y, w, h);
    if (band) {
      ctx.fillStyle = band;
      ctx.fillRect(x, y, w, h * 0.09);
    }
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(h * 0.06)}px Arial, sans-serif`;
    ctx.fillText('The Orange Box', x + w * 0.1, y + h * 0.19);
    ctx.fillStyle = '#e8d8c8';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.48, w * 0.24, h * 0.2, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3230';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.42, w * 0.13, h * 0.09, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8c8b0';
    ctx.fillRect(x + w * 0.38, y + h * 0.46, w * 0.24, h * 0.025);
    ctx.fillStyle = '#2a2a2a';
    ctx.font = `bold ${Math.round(h * 0.035)}px Arial, sans-serif`;
    ['Half-Life 2', 'Episode One · Episode Two', 'Team Fortress 2 · Portal'].forEach((s, i) => ctx.fillText(s, x + w * 0.1, y + h * (0.75 + i * 0.05)));
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(x + w * 0.06, y + h * 0.9, w * 0.12, h * 0.08);
  }

  const DRAW = {
    poster(ctx, W, H) {
      const k = W / 1280;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = POSTER;
      ctx.beginPath();
      ctx.moveTo(80, 28);
      ctx.lineTo(1232, 30);
      ctx.lineTo(1230, 693);
      ctx.lineTo(72, 672);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = BAND;
      ctx.beginPath();
      ctx.moveTo(175, 157);
      ctx.lineTo(1280, 151);
      ctx.lineTo(1280, 560);
      ctx.lineTo(247, 463);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.clip();
      Mts.emblem(ctx, 790, 340, 345, '#4c4846', BAND);
      ctx.restore();
      ctx.save();
      ctx.shadowColor = 'rgba(255,240,220,0.55)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = CREAM;
      ctx.font = `60px ${SANS}`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Meet', 272, 253);
      ctx.font = `38px ${SANS}`;
      ctx.fillText('THE', 324, 290);
      slabWord(ctx, 'SCOUT', 322, 300, 88, 12, CREAM, 1.36);
      ctx.restore();
      bat(ctx, 160, 608, 430, 478, 9, 21, CREAM);
      burst(ctx, 436, 462, 58, 9, CREAM, 5);
      burst(ctx, 438, 462, 20, 7, BAND, 6);
      smallLogo(ctx, 606, 638, 30, '#3a3836', '#2c2a28', '#222020');
      ctx.fillStyle = CREAM;
      ctx.font = `bold 13px ${SANS}`;
      ctx.fillText('COPYRIGHT LOLOLOL', 850, 621);
      ctx.font = 'bold 17px Arial, sans-serif';
      ctx.fillStyle = '#2c2a28';
      ctx.fillText('A Valve Picture', 850, 643);
      ctx.restore();
    },

    wallCream(ctx, W, H) {
      ctx.fillStyle = '#ece6de';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 12, W * H * 0.04, '255,255,255', '90,80,70', 2);
      const g = rand(13);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `rgba(150,130,110,${0.03 + g() * 0.04})`;
        ctx.fillRect(g() * W, g() * H, 20 + g() * 60, 20 + g() * 60);
      }
    },

    brick(ctx, W, H) {
      brickWall(ctx, W, H, [160, 156, 170], '#aaa4b0', 21, 16, 4, true);
    },

    brickWarm(ctx, W, H) {
      brickWall(ctx, W, H, [196, 182, 160], '#b4a690', 23, 16, 4, true);
    },

    concrete(ctx, W, H) {
      ctx.fillStyle = '#8f8c88';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 31, W * H * 0.3, '255,255,255', '0,0,0', 2);
      const g = rand(32);
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = `rgba(60,56,52,${0.04 + g() * 0.06})`;
        ctx.beginPath();
        ctx.ellipse(g() * W, g() * H, 10 + g() * 40, 6 + g() * 20, g() * PI, 0, PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(50,46,44,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - 1);
      ctx.lineTo(W, H - 1);
      ctx.moveTo(W - 1, 0);
      ctx.lineTo(W - 1, H);
      ctx.stroke();
    },

    plaster(ctx, W, H) {
      ctx.fillStyle = '#cdc2ae';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 41, W * H * 0.08, '255,255,255', '80,64,48', 2);
      const g = rand(42);
      for (let i = 0; i < 8; i++) {
        const gr = ctx.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, 'rgba(90,70,50,0)');
        gr.addColorStop(1, `rgba(90,70,50,${0.05 + g() * 0.08})`);
        ctx.fillStyle = gr;
        ctx.fillRect(g() * W, 0, 12 + g() * 30, H);
      }
      ctx.fillStyle = 'rgba(60,50,40,0.5)';
      ctx.fillRect(0, H * 0.94, W, H * 0.06);
    },

    shutter(ctx, W, H) {
      ctx.fillStyle = '#6a6e74';
      ctx.fillRect(0, 0, W, H);
      const n = 16;
      for (let i = 0; i < n; i++) {
        const y = (i / n) * H;
        const gr = ctx.createLinearGradient(0, y, 0, y + H / n);
        gr.addColorStop(0, '#8a8e94');
        gr.addColorStop(0.5, '#6c7076');
        gr.addColorStop(1, '#45484c');
        ctx.fillStyle = gr;
        ctx.fillRect(0, y, W, H / n);
      }
      speckle(ctx, W, H, 51, W * H * 0.06, '255,255,255', '0,0,0', 2);
      ctx.fillStyle = '#3c3f44';
      ctx.fillRect(0, H - 10, W, 10);
    },

    corrugated(ctx, W, H) {
      ctx.fillStyle = '#7d8a96';
      ctx.fillRect(0, 0, W, H);
      const n = 16;
      for (let i = 0; i < n; i++) {
        const x = (i / n) * W;
        const gr = ctx.createLinearGradient(x, 0, x + W / n, 0);
        gr.addColorStop(0, '#93a0ac');
        gr.addColorStop(0.5, '#6f7c88');
        gr.addColorStop(1, '#55606a');
        ctx.fillStyle = gr;
        ctx.fillRect(x, 0, W / n, H);
      }
      speckle(ctx, W, H, 61, W * H * 0.08, '255,255,255', '20,20,30', 2);
      const g = rand(62);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `rgba(110,80,60,${0.06 + g() * 0.08})`;
        ctx.fillRect(g() * W, H * (0.7 + g() * 0.3), 10 + g() * 30, H);
      }
    },

    container(ctx, W, H) {
      DRAW.corrugated(ctx, W, H);
      ctx.fillStyle = 'rgba(40,60,90,0.35)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(230,236,244,0.75)';
      ctx.font = `bold ${Math.round(H * 0.16)}px ${SANS}`;
      ctx.textAlign = 'center';
      ['B', 'L', 'U'].forEach((c, i) => ctx.fillText(c, W * 0.78, H * (0.28 + i * 0.2)));
      ctx.textAlign = 'left';
    },

    fence(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(150,154,156,1)';
      ctx.lineWidth = 2.4;
      const n = 8;
      for (let i = -n; i <= n * 2; i++) {
        ctx.beginPath();
        ctx.moveTo((i / n) * W, 0);
        ctx.lineTo((i / n) * W + W, H);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((i / n) * W, 0);
        ctx.lineTo((i / n) * W - W, H);
        ctx.stroke();
      }
    },

    ties(ctx, W, H) {
      ctx.fillStyle = '#7a746c';
      ctx.fillRect(0, 0, W, H);
      const g = rand(71);
      for (let i = 0; i < W * H * 0.35; i++) {
        const v = 70 + g() * 90;
        ctx.fillStyle = `rgb(${v},${v * 0.96},${v * 0.9})`;
        ctx.fillRect(g() * W, g() * H, 2 + g() * 2, 2 + g() * 2);
      }
      const n = 4;
      for (let i = 0; i < n; i++) {
        const y = (i + 0.2) * H / n;
        ctx.fillStyle = '#4a3a2c';
        ctx.fillRect(0, y, W, H / n * 0.42);
        ctx.fillStyle = 'rgba(30,22,16,0.4)';
        ctx.fillRect(0, y + H / n * 0.36, W, H / n * 0.06);
      }
    },

    lockers(ctx, W, H) {
      ctx.fillStyle = '#b8bab6';
      ctx.fillRect(0, 0, W, H);
      const n = 4;
      for (let i = 0; i < n; i++) {
        const x = (i / n) * W;
        ctx.fillStyle = '#c8cac4';
        ctx.fillRect(x + 3, 3, W / n - 6, H - 6);
        ctx.strokeStyle = '#7e807c';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 3, 3, W / n - 6, H - 6);
        ctx.fillStyle = '#6e706c';
        for (let j = 0; j < 5; j++) ctx.fillRect(x + W / n * 0.25, H * (0.08 + j * 0.025), W / n * 0.5, 3);
        for (let j = 0; j < 5; j++) ctx.fillRect(x + W / n * 0.25, H * (0.82 + j * 0.025), W / n * 0.5, 3);
        ctx.fillStyle = '#5a5c58';
        ctx.fillRect(x + W / n * 0.78, H * 0.45, 6, H * 0.08);
      }
      speckle(ctx, W, H, 81, W * H * 0.04, '255,255,255', '0,0,0', 2);
    },

    watchStep(ctx, W, H) {
      textSign(ctx, W, H, '#e2b832', '#2a2420', ['WATCH YOUR STEP'], `bold ${Math.round(H * 0.42)}px ${SANS}`, '#2a2420');
    },

    controlPoint(ctx, W, H) {
      ctx.fillStyle = '#5a86b0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e8eef4';
      ctx.font = `bold ${Math.round(H * 0.42)}px ${SANS}`;
      ctx.textBaseline = 'middle';
      ctx.fillText('CONTROL POINT', W * 0.22, H * 0.54);
      ctx.beginPath();
      ctx.moveTo(W * 0.04, H * 0.5);
      ctx.lineTo(W * 0.12, H * 0.2);
      ctx.lineTo(W * 0.12, H * 0.38);
      ctx.lineTo(W * 0.18, H * 0.38);
      ctx.lineTo(W * 0.18, H * 0.62);
      ctx.lineTo(W * 0.12, H * 0.62);
      ctx.lineTo(W * 0.12, H * 0.8);
      ctx.closePath();
      ctx.fill();
    },

    warning(ctx, W, H) {
      textSign(ctx, W, H, '#d8c040', '#2a2420', ['WARNING', 'KEEP CLEAR'], `bold ${Math.round(H * 0.24)}px ${SANS}`, '#2a2420');
    },

    redLogo(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      redEmblem(ctx, W / 2, H / 2, W * 0.48);
    },

    respawn(ctx, W, H) {
      ctx.fillStyle = '#6e2a24';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e8dcd0';
      ctx.font = `bold ${Math.round(H * 0.7)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2', W / 2, H * 0.55);
      ctx.textAlign = 'left';
    },

    retail(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = '#efefef';
      ctx.fillRect(0, 0, 1280, 720);
      retailBox(ctx, 175, 182, 236, 366);
      ctx.fillStyle = '#3a3a3a';
      ctx.font = '19px Arial, sans-serif';
      ctx.fillText('April 9 in North America.', 578, 352);
      ctx.fillText('April 11 in Europe.', 578, 378);
      ctx.restore();
    },

    boxes(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = '#efefef';
      ctx.fillRect(0, 0, 1280, 720);
      orangeBox(ctx, 84, 214, 170, 238, null);
      orangeBox(ctx, 150, 238, 172, 242, '#5ab03a');
      orangeBox(ctx, 218, 264, 178, 248, '#2a2a2a');
      ctx.fillStyle = '#3a3a3a';
      ctx.font = '19px Arial, sans-serif';
      ctx.fillText('Available now in The Orange Box.', 615, 362);
      ctx.restore();
    },

    valve(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(0, 0, 1280, 720);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 3;
      ctx.strokeRect(300, 422, 150, 38);
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('V A L V E', 375, 452);
      ctx.font = '10px Arial, sans-serif';
      ctx.fillText('®', 460, 428);
      ctx.save();
      ctx.translate(560, 442);
      ctx.beginPath();
      ctx.arc(16, -4, 9, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2f2f2';
      ctx.beginPath();
      ctx.arc(16, -4, 4.5, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(16, -4, 2.6, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(11, -1);
      ctx.lineTo(-14, 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-17, 8, 6, 0, PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.textAlign = 'left';
      ctx.font = 'bold 23px Arial, sans-serif';
      ctx.fillText('http://ORANGE.HALF-LIFE2.COM', 594, 452);
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('© 1999 Valve Corporation. Valve, the Valve logo, Half-Life, the Half-Life logo and the Lambda logo, Team Fortress and the Team Fortress logo,', 640, 500);
      ctx.fillText('Portal and the Portal logo are trademarks and/or registered trademarks of Valve Corporation.', 640, 524);
      ctx.restore();
    },

    sleeveBlu(ctx, W, H) {
      ctx.fillStyle = '#5a85ac';
      ctx.fillRect(0, 0, W, H);
    },

    bread(ctx, W, H) {
      ctx.fillStyle = '#e8d2a4';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 91, W * H * 0.2, '255,250,230', '150,100,50', 2);
    },

    sky(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#c9ccd2');
      g.addColorStop(0.6, '#e4e2dc');
      g.addColorStop(1, '#efe8dc');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    windowGlow(ctx, W, H) {
      const g = ctx.createRadialGradient(W / 2, H * 0.2, 4, W / 2, H * 0.4, W * 0.7);
      g.addColorStop(0, '#f2e2b8');
      g.addColorStop(1, '#6a5c48');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    vent(ctx, W, H) {
      ctx.fillStyle = '#56565c';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = '#2a2a30';
        ctx.fillRect(W * 0.06, H * (0.06 + i * 0.09), W * 0.88, H * 0.05);
      }
    }
  };

  const SIZES = {
    poster: [1024, 576], wallCream: [256, 256], brick: [256, 256], brickWarm: [256, 256], concrete: [256, 256], plaster: [256, 256], shutter: [128, 256],
    corrugated: [256, 256], container: [256, 256], fence: [128, 128], ties: [256, 256], lockers: [256, 256], watchStep: [256, 64], controlPoint: [256, 64],
    warning: [128, 96], redLogo: [256, 256], respawn: [64, 64], retail: [1024, 576], boxes: [1024, 576], valve: [1024, 576], sleeveBlu: [32, 32],
    bread: [64, 64], sky: [64, 256], windowGlow: [64, 64], vent: [64, 64]
  };

  const CLAMP = { poster: true, redLogo: true, retail: true, boxes: true, valve: true, watchStep: true, controlPoint: true, warning: true, respawn: true, sky: true };

  function tex(r, cache, key) {
    if (!cache[key]) {
      if (!DRAW[key]) return Meet.tex(r, cache, key);
      const [w, h] = SIZES[key];
      cache[key] = r.texture(w, DRAW[key], { height: h, clamp: !!CLAMP[key] });
    }
    return cache[key];
  }

  window.MscArt = { DRAW, SIZES, GLYPHS, tex, slabWord, retailBox, orangeBox };
})();
