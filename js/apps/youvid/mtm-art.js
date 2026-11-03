(function () {
  const { rand } = window.P3D;
  const Meet = window.MeetArt;
  const Demo = window.DemoArt;
  const Eng = window.EngArt;
  const Msc = window.MscArt;
  const PI = Math.PI;

  const CREAM = '#f2e6de';
  const CARD = '#7c4541';
  const BAND = '#2e2d2b';
  const INK = '#ecdcd2';
  const SANS = '"Arial Black", "Arial Bold", Arial, sans-serif';
  const COND = 'Impact, "Arial Narrow", "Arial Black", sans-serif';
  const THIN = '"Century Gothic", "Trebuchet MS", Verdana, Arial, sans-serif';

  const GLYPHS = { M: Demo.SLAB.M, E: Demo.SLAB.E, D: Demo.SLAB.D, I: Eng.SLAB.I, C: Msc.GLYPHS.C };

  function slabWord(ctx, word, x, y, h, gap, color, stretch) {
    const k = h / 100;
    const kx = k * (stretch || 1);
    let cx = x;
    ctx.fillStyle = color;
    for (const ch of word) {
      const g = GLYPHS[ch];
      if (g.polys) {
        g.polys.forEach(poly => {
          ctx.beginPath();
          poly.forEach(([px, py], i) => (i ? ctx.lineTo(cx + px * kx, y + py * k) : ctx.moveTo(cx + px * kx, y + py * k)));
          ctx.closePath();
          ctx.fill();
        });
      } else {
        ctx.save();
        ctx.translate(cx, y);
        ctx.scale(kx, k);
        g.draw(ctx);
        ctx.restore();
      }
      cx += (g.w + gap) * kx;
    }
    return cx - x;
  }

  function speckle(ctx, W, H, seed, n, light, dark, size) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? light : dark},${g() * 0.12})`;
      ctx.fillRect(g() * W, g() * H, size || 2, size || 2);
    }
  }

  function smallLogo(ctx, x, y, h, top, side) {
    ctx.save();
    ctx.font = `${Math.round(h)}px ${COND}`;
    ctx.textBaseline = 'alphabetic';
    const word = (fill, dx, dy) => {
      ctx.fillStyle = fill;
      const wa = ctx.measureText('TEAM').width;
      ctx.fillText('TEAM', x + dx, y + dy);
      ctx.fillText('FORTRESS 2', x + dx + wa + h * 0.22, y + dy);
    };
    for (let i = 6; i >= 1; i--) word(side, -i * h * 0.025, i * h * 0.035);
    word(top, 0, 0);
    ctx.restore();
  }

  function syringe(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.06);
    ctx.scale(s, s);
    ctx.fillStyle = col;
    ctx.fillRect(-150, -2, 60, 4);
    ctx.fillRect(-84, -14, 8, 28);
    ctx.fillRect(-76, -8, 26, 16);
    ctx.fillRect(-50, -12, 100, 24);
    ctx.fillStyle = CARD;
    ctx.fillRect(-40, -6, 80, 12);
    ctx.fillStyle = col;
    ctx.fillRect(-20, -6, 4, 12);
    ctx.fillRect(10, -6, 4, 12);
    ctx.fillRect(50, -8, 14, 16);
    ctx.beginPath();
    ctx.moveTo(64, -2);
    ctx.lineTo(150, 0);
    ctx.lineTo(64, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function pot(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,20,18,0.35)';
    ctx.beginPath();
    ctx.ellipse(20, 118, 130, 26, 0, 0, PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(-40, -70);
    ctx.rotate(-0.55);
    const tube = ctx.createLinearGradient(-26, 0, 26, 0);
    tube.addColorStop(0, '#8e9294');
    tube.addColorStop(0.45, '#e6e8e6');
    tube.addColorStop(1, '#7e8284');
    ctx.fillStyle = tube;
    ctx.fillRect(-26, -40, 52, 150);
    ctx.fillStyle = '#e4e2dc';
    ctx.fillRect(-34, -78, 68, 42);
    ctx.fillStyle = '#c8c6c0';
    ctx.fillRect(-34, -44, 68, 6);
    ctx.fillStyle = '#e2c22a';
    ctx.beginPath();
    ctx.arc(0, 70, 16, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1a18';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 70);
      ctx.arc(0, 70, 14, i * PI * 2 / 3 - 0.5, i * PI * 2 / 3 + 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const heart = (hx, hy, s, base, hi) => {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(s, s);
      const g = ctx.createRadialGradient(-14, -20, 6, 0, 0, 70);
      g.addColorStop(0, hi);
      g.addColorStop(1, base);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 60);
      ctx.bezierCurveTo(-60, 20, -56, -40, -12, -34);
      ctx.bezierCurveTo(0, -50, 40, -46, 44, -10);
      ctx.bezierCurveTo(48, 20, 20, 44, 0, 60);
      ctx.fill();
      ctx.strokeStyle = base;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, -36);
      ctx.quadraticCurveTo(-4, -70, 18, -76);
      ctx.moveTo(14, -40);
      ctx.quadraticCurveTo(28, -66, 46, -60);
      ctx.stroke();
      ctx.restore();
    };
    heart(10, -40, 1.0, '#8a2a30', '#c46068');
    heart(66, -46, 1.15, '#b22c2c', '#e8686a');
    ctx.fillStyle = '#d8d6d0';
    ctx.beginPath();
    ctx.moveTo(-100, 0);
    ctx.lineTo(132, 0);
    ctx.lineTo(118, 108);
    ctx.quadraticCurveTo(16, 128, -86, 108);
    ctx.closePath();
    ctx.fill();
    const sh = ctx.createLinearGradient(-100, 0, 132, 0);
    sh.addColorStop(0, 'rgba(80,80,80,0.35)');
    sh.addColorStop(0.4, 'rgba(255,255,255,0)');
    sh.addColorStop(1, 'rgba(60,60,60,0.4)');
    ctx.fillStyle = sh;
    ctx.fill();
    ctx.fillStyle = '#5a1416';
    [[-60, 0, 10, 40], [-20, 0, 8, 60], [30, 0, 9, 34], [84, 0, 7, 50]].forEach(([dx, dy, w, h]) => {
      ctx.fillRect(dx, dy, w, h);
      ctx.beginPath();
      ctx.arc(dx + w / 2, dy + h, w / 2, 0, PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = '#2a2826';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(16, 0, 118, 16, 0, 0, PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function feather(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.55);
    ctx.fillStyle = '#ece6dc';
    ctx.beginPath();
    ctx.ellipse(0, 0, 44, 13, 0, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8b0a4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-60, 2);
    ctx.lineTo(42, 0);
    ctx.stroke();
    ctx.restore();
  }

  function centered(ctx, text, x, y, font, col) {
    ctx.font = font;
    ctx.fillStyle = col;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
  }

  function quoteCard(ctx, W, H, step) {
    const k = W / 1280;
    ctx.save();
    ctx.scale(k, k);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 1280, 720);
    centered(ctx, '"The most fun you can have online..."', 640, 286, `30px ${THIN}`, '#d8d8d8');
    ctx.font = `14px ${THIN}`;
    ctx.fillStyle = '#7a7a7a';
    ctx.fillText('- PC Gamer', 900, 308);
    if (step >= 2) centered(ctx, 'is now free.', 640, 336, `38px ${THIN}`, '#d0d0d0');
    if (step >= 3) centered(ctx, 'Forever.', 640, 412, `82px ${THIN}`, '#ffffff');
    ctx.restore();
  }

  function f2pLogo(ctx, cx, cy, s) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.fillStyle = '#b0521e';
    ctx.beginPath();
    ctx.moveTo(-190, -26);
    ctx.lineTo(-96, -30);
    ctx.lineTo(-92, -52);
    ctx.lineTo(96, -52);
    ctx.lineTo(100, -32);
    ctx.lineTo(192, -36);
    ctx.lineTo(186, 46);
    ctx.lineTo(-186, 52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(70,24,8,0.45)';
    ctx.fillRect(-186, 40, 372, 10);
    ctx.font = `30px ${COND}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4a1e0a';
    ctx.fillText('TEAM FORTRESS 2', 2, -20);
    ctx.fillStyle = '#f4ece0';
    ctx.fillText('TEAM FORTRESS 2', 0, -22);
    ctx.font = `bold 46px ${SANS}`;
    const wa = ctx.measureText('FREE').width, wb = ctx.measureText('PLAY!').width;
    const gap = 30;
    const x0 = -(wa + gap + wb) / 2;
    ctx.textAlign = 'left';
    [['#4a1e0a', 3, 31], ['#ece4d8', 0, 28]].forEach(([col, dx, dy]) => {
      ctx.fillStyle = col;
      ctx.fillText('FREE', x0 + dx, dy);
      ctx.fillText('PLAY!', x0 + wa + gap + dx, dy);
    });
    ctx.font = `bold 13px ${SANS}`;
    ctx.fillStyle = '#ece4d8';
    ctx.textAlign = 'center';
    ctx.fillText('TO', x0 + wa + gap / 2, 20);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  function tiles(ctx, W, H, n, base, grout, seed, vary) {
    ctx.fillStyle = grout;
    ctx.fillRect(0, 0, W, H);
    const g = rand(seed);
    const s = W / n;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const v = (g() - 0.5) * vary;
        ctx.fillStyle = base(v, i, j);
        ctx.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
        const hi = ctx.createLinearGradient(i * s, j * s, i * s + s, j * s + s);
        hi.addColorStop(0, 'rgba(255,255,255,0.08)');
        hi.addColorStop(1, 'rgba(0,0,0,0.08)');
        ctx.fillStyle = hi;
        ctx.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      }
    }
  }

  function bones(ctx, W, H, kind) {
    ctx.strokeStyle = 'rgba(235,252,255,0.85)';
    ctx.fillStyle = 'rgba(235,252,255,0.85)';
    ctx.lineCap = 'round';
    if (kind === 'ribs') {
      ctx.lineWidth = W * 0.035;
      ctx.beginPath();
      ctx.moveTo(W * 0.5, H * 0.12);
      ctx.lineTo(W * 0.5, H * 0.9);
      ctx.stroke();
      ctx.lineWidth = W * 0.028;
      for (let i = 0; i < 8; i++) {
        const y = H * (0.2 + i * 0.085);
        const w = W * (0.18 + 0.14 * Math.sin(PI * (i + 1) / 10));
        [-1, 1].forEach(s => {
          ctx.beginPath();
          ctx.moveTo(W * 0.5, y);
          ctx.quadraticCurveTo(W * 0.5 + s * w * 1.1, y - H * 0.02, W * 0.5 + s * w, y + H * 0.08);
          ctx.stroke();
        });
      }
      ctx.lineWidth = W * 0.03;
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.moveTo(W * 0.5 + s * W * 0.06, H * 0.13);
        ctx.lineTo(W * 0.5 + s * W * 0.3, H * 0.1);
        ctx.stroke();
      });
    } else {
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.3, W * 0.2, H * 0.17, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(10,40,52,0.9)';
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.ellipse(W * 0.5 + s * W * 0.075, H * 0.29, W * 0.05, H * 0.045, 0, 0, PI * 2);
        ctx.fill();
      });
      ctx.fillRect(W * 0.43, H * 0.4, W * 0.14, H * 0.025);
      ctx.lineWidth = W * 0.05;
      ctx.beginPath();
      ctx.moveTo(W * 0.5, H * 0.47);
      ctx.lineTo(W * 0.5, H * 0.92);
      ctx.stroke();
      ctx.lineWidth = W * 0.022;
      for (let i = 0; i < 6; i++) {
        const y = H * (0.52 + i * 0.07);
        ctx.beginPath();
        ctx.moveTo(W * 0.44, y);
        ctx.lineTo(W * 0.56, y);
        ctx.stroke();
      }
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
        ctx.moveTo(178, 158);
        ctx.lineTo(1280, 162);
        ctx.lineTo(1280, 552);
        ctx.lineTo(262, 470);
        ctx.closePath();
      };
      ctx.fillStyle = BAND;
      band();
      ctx.fill();
      ctx.save();
      band();
      ctx.clip();
      Meet.emblem(ctx, 780, 330, 340, '#393634', BAND);
      ctx.restore();
      ctx.fillStyle = '#ecdcc4';
      [[805, 64, 0.62], [733, 101, 0.78], [800, 146, 0.62]].forEach(([x, y]) => {
        ctx.fillRect(x, y - 2, 48, 4);
      });
      syringe(ctx, 965, 72, 0.62, '#ecdcc4');
      syringe(ctx, 945, 101, 0.82, '#ecdcc4');
      syringe(ctx, 970, 132, 0.62, '#ecdcc4');
      ctx.fillStyle = INK;
      ctx.font = `50px ${SANS}`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Meet', 280, 255);
      ctx.font = `38px ${SANS}`;
      ctx.fillText('THE', 330, 290);
      slabWord(ctx, 'MEDIC', 334, 300, 90, 10, INK, 1.38);
      pot(ctx, 255, 500);
      feather(ctx, 432, 584);
      smallLogo(ctx, 530, 626, 30, '#4a2a26', '#2a1614');
      ctx.fillStyle = '#e8dcd4';
      ctx.font = `bold 12px ${SANS}`;
      ctx.fillText('COPYRIGHT LOLOLOL', 761, 605);
      ctx.font = 'bold 17px Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('A Valve Picture', 761, 627);
      ctx.restore();
    },

    quote1(ctx, W, H) { quoteCard(ctx, W, H, 1); },
    quote2(ctx, W, H) { quoteCard(ctx, W, H, 2); },
    quote3(ctx, W, H) { quoteCard(ctx, W, H, 3); },

    f2p(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 1280, 720);
      f2pLogo(ctx, 640, 300, 1.95);
      ctx.restore();
    },

    f2pUrl(ctx, W, H) {
      DRAW.f2p(ctx, W, H);
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.font = `22px ${THIN}`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('www.', 520, 498);
      ctx.font = `38px ${THIN}`;
      ctx.fillText('teamfortress', 650, 498);
      ctx.font = `22px ${THIN}`;
      ctx.fillText('.com', 784, 498);
      ctx.restore();
    },

    labWall(ctx, W, H) {
      tiles(ctx, W, H, 4, (v) => `rgb(${196 + v * 30},${200 + v * 30},${196 + v * 28})`, '#8e928e', 501, 0.25);
      speckle(ctx, W, H, 502, 700, '255,255,255', '60,64,60', 2);
    },

    labLow(ctx, W, H) {
      tiles(ctx, W, H, 4, (v) => `rgb(${70 + v * 20},${98 + v * 24},${88 + v * 20})`, '#3a4a44', 503, 0.3);
      speckle(ctx, W, H, 504, 600, '200,230,220', '20,30,26', 2);
    },

    labFloor(ctx, W, H) {
      tiles(ctx, W, H, 4, (v, i, j) => ((i + j) % 2 ? `rgb(${78 + v * 20},${84 + v * 20},${80 + v * 18})` : `rgb(${104 + v * 20},${110 + v * 20},${104 + v * 18})`), '#3a3e3a', 505, 0.25);
      speckle(ctx, W, H, 506, 900, '220,230,220', '20,24,20', 2);
    },

    labPaint(ctx, W, H) {
      ctx.fillStyle = '#7d8a82';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 507, 2400, '200,214,204', '30,40,34', 3);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0.12)');
      g.addColorStop(1, 'rgba(255,255,255,0.06)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    xray1(ctx, W, H) {
      ctx.fillStyle = '#2a2e30';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.7);
      g.addColorStop(0, '#5fd2e2');
      g.addColorStop(1, '#2a8aa0');
      ctx.fillStyle = g;
      ctx.fillRect(W * 0.07, H * 0.06, W * 0.86, H * 0.88);
      ctx.save();
      ctx.beginPath();
      ctx.rect(W * 0.07, H * 0.06, W * 0.86, H * 0.88);
      ctx.clip();
      bones(ctx, W, H, 'ribs');
      ctx.restore();
    },

    xray2(ctx, W, H) {
      ctx.fillStyle = '#2a2e30';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.7);
      g.addColorStop(0, '#62d6e4');
      g.addColorStop(1, '#2a8aa0');
      ctx.fillStyle = g;
      ctx.fillRect(W * 0.07, H * 0.06, W * 0.86, H * 0.88);
      ctx.save();
      ctx.beginPath();
      ctx.rect(W * 0.07, H * 0.06, W * 0.86, H * 0.88);
      ctx.clip();
      bones(ctx, W, H, 'skull');
      ctx.restore();
    },

    monitor(ctx, W, H) {
      ctx.fillStyle = '#16301e';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(90,180,110,0.35)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += W / 8) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += H / 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.strokeStyle = '#f2c43a';
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const mid = H * 0.58;
      ctx.moveTo(0, mid);
      ctx.lineTo(W * 0.3, mid);
      ctx.lineTo(W * 0.36, mid - H * 0.08);
      ctx.lineTo(W * 0.42, mid + H * 0.06);
      ctx.lineTo(W * 0.48, mid - H * 0.42);
      ctx.lineTo(W * 0.55, mid + H * 0.22);
      ctx.lineTo(W * 0.6, mid);
      ctx.lineTo(W, mid);
      ctx.stroke();
      const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.7);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    },

    console(ctx, W, H) {
      ctx.fillStyle = '#6e7a72';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 511, 1200, '200,210,200', '30,36,32', 2);
      ctx.strokeStyle = 'rgba(30,36,32,0.6)';
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, W - 12, H - 12);
      const dial = (x, y, r, needle) => {
        ctx.fillStyle = '#2a2c2a';
        ctx.beginPath();
        ctx.arc(x, y, r + 5, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8e2cc';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2a2826';
        ctx.lineWidth = 2;
        for (let i = 0; i <= 10; i++) {
          const a = PI * 0.8 + (i / 10) * PI * 1.4;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75);
          ctx.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92);
          ctx.stroke();
        }
        ctx.strokeStyle = '#a02020';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(needle) * r * 0.8, y + Math.sin(needle) * r * 0.8);
        ctx.stroke();
      };
      dial(W * 0.18, H * 0.32, H * 0.17, -1.2);
      dial(W * 0.42, H * 0.32, H * 0.17, -0.4);
      dial(W * 0.82, H * 0.36, H * 0.22, -2.0);
      const g = rand(512);
      for (let i = 0; i < 7; i++) {
        const x = W * (0.12 + i * 0.1), y = H * 0.74;
        ctx.fillStyle = '#1e201e';
        ctx.beginPath();
        ctx.arc(x, y, H * 0.06, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a8c88';
        ctx.fillRect(x - 2, y - H * 0.06, 4, H * 0.05);
        ctx.fillStyle = g() < 0.5 ? '#d84a2a' : '#e8c040';
        ctx.beginPath();
        ctx.arc(x, H * 0.58, H * 0.025, 0, PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#1e301e';
      ctx.fillRect(W * 0.56, H * 0.14, W * 0.12, H * 0.34);
      ctx.strokeStyle = '#e8c040';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W * 0.56, H * 0.34);
      ctx.lineTo(W * 0.6, H * 0.34);
      ctx.lineTo(W * 0.62, H * 0.2);
      ctx.lineTo(W * 0.64, H * 0.42);
      ctx.lineTo(W * 0.68, H * 0.34);
      ctx.stroke();
    },

    cabinet(ctx, W, H) {
      ctx.fillStyle = '#8a948e';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#26302c';
      ctx.fillRect(W * 0.08, H * 0.06, W * 0.38, H * 0.6);
      ctx.fillRect(W * 0.54, H * 0.06, W * 0.38, H * 0.6);
      const g = rand(521);
      [0.2, 0.42, 0.62].forEach(y => {
        ctx.fillStyle = '#4a5450';
        ctx.fillRect(W * 0.08, H * y, W * 0.84, 3);
        for (let i = 0; i < 9; i++) {
          const x = W * (0.1 + g() * 0.8);
          if (x > W * 0.45 && x < W * 0.55) continue;
          const h = H * (0.06 + g() * 0.08);
          ctx.fillStyle = ['#8a5a30', '#6a7a40', '#9a9a8a', '#5a3a2a'][Math.floor(g() * 4)];
          ctx.fillRect(x, H * y - h, W * 0.04, h);
        }
      });
      const gl = ctx.createLinearGradient(0, 0, W, H);
      gl.addColorStop(0, 'rgba(255,255,255,0.18)');
      gl.addColorStop(0.3, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(W * 0.08, H * 0.06, W * 0.84, H * 0.6);
      ctx.fillStyle = '#6e7872';
      ctx.fillRect(W * 0.08, H * 0.72, W * 0.84, H * 0.24);
      ctx.fillStyle = '#c8c8c0';
      ctx.fillRect(W * 0.46, H * 0.3, W * 0.02, H * 0.08);
      ctx.fillRect(W * 0.48, H * 0.8, W * 0.06, H * 0.02);
    },

    megaBaboon(ctx, W, H) {
      ctx.fillStyle = '#f2ece2';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#b8242a';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, W - 8, H - 8);
      centered(ctx, 'MEGA BABOON', W / 2, H * 0.66, `bold ${Math.round(H * 0.42)}px ${SANS}`, '#b8242a');
    },

    spareLabel(ctx, W, H) {
      ctx.fillStyle = '#f2ece2';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, W - 8, H - 8);
      centered(ctx, 'SPARE PARTS', W / 2, H * 0.64, `bold ${Math.round(H * 0.36)}px ${SANS}`, '#3a3a3a');
    },

    beerLabel(ctx, W, H) {
      ctx.fillStyle = '#5a2a12';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#efe6d2';
      ctx.fillRect(0, H * 0.25, W, H * 0.5);
      ctx.fillStyle = '#b8242a';
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.5, H * 0.18, 0, PI * 2);
      ctx.fill();
      centered(ctx, 'BEER', W / 2, H * 0.56, `bold ${Math.round(H * 0.14)}px ${SANS}`, '#efe6d2');
    },

    canLabel(ctx, W, H) {
      ctx.fillStyle = '#e8c430';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c42a1e';
      ctx.beginPath();
      ctx.moveTo(W * 0.56, H * 0.1);
      ctx.lineTo(W * 0.34, H * 0.55);
      ctx.lineTo(W * 0.5, H * 0.55);
      ctx.lineTo(W * 0.42, H * 0.92);
      ctx.lineTo(W * 0.68, H * 0.42);
      ctx.lineTo(W * 0.52, H * 0.42);
      ctx.closePath();
      ctx.fill();
    },

    gauge(ctx, W, H) {
      ctx.fillStyle = '#2a2624';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ece4cc';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.44, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e1c1a';
      ctx.lineWidth = 3;
      for (let i = 0; i <= 12; i++) {
        const a = PI * 0.75 + (i / 12) * PI * 1.5;
        ctx.beginPath();
        ctx.moveTo(W / 2 + Math.cos(a) * W * 0.3, H / 2 + Math.sin(a) * W * 0.3);
        ctx.lineTo(W / 2 + Math.cos(a) * W * 0.4, H / 2 + Math.sin(a) * W * 0.4);
        ctx.stroke();
      }
      ctx.strokeStyle = '#b82a22';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.36, PI * 1.95, PI * 2.25);
      ctx.stroke();
      ctx.save();
      ctx.translate(W * 0.5, H * 0.72);
      ctx.rotate(-0.5);
      centered(ctx, 'UBER', 0, 0, `bold ${Math.round(W * 0.1)}px ${SANS}`, '#2a2624');
      ctx.restore();
    },

    meterFace(ctx, W, H) {
      ctx.fillStyle = '#1a1816';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e6e0cc';
      ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.9);
      ctx.arc(W / 2, H * 0.9, W * 0.44, PI, PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2a2622';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 20; i++) {
        const a = PI + (i / 20) * PI;
        const l = i % 5 === 0 ? 0.3 : 0.36;
        ctx.beginPath();
        ctx.moveTo(W / 2 + Math.cos(a) * W * l, H * 0.9 + Math.sin(a) * W * l);
        ctx.lineTo(W / 2 + Math.cos(a) * W * 0.41, H * 0.9 + Math.sin(a) * W * 0.41);
        ctx.stroke();
      }
      ctx.strokeStyle = '#b82a22';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.9, W * 0.38, PI * 1.78, PI * 2);
      ctx.stroke();
    },

    lampOff(ctx, W, H) {
      ctx.fillStyle = '#3a1e10';
      ctx.fillRect(0, 0, W, H);
      centered(ctx, 'ÜBERCHARGE', W / 2, H * 0.48, `bold ${Math.round(H * 0.3)}px ${SANS}`, '#5a3018');
      centered(ctx, 'READY', W / 2, H * 0.86, `bold ${Math.round(H * 0.3)}px ${SANS}`, '#5a3018');
    },

    lampOn(ctx, W, H) {
      const g = ctx.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, W * 0.6);
      g.addColorStop(0, '#ffb060');
      g.addColorStop(1, '#e05a18');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      centered(ctx, 'ÜBERCHARGE', W / 2, H * 0.48, `bold ${Math.round(H * 0.3)}px ${SANS}`, '#fff2dc');
      centered(ctx, 'READY', W / 2, H * 0.86, `bold ${Math.round(H * 0.3)}px ${SANS}`, '#fff2dc');
    },

    redCross(ctx, W, H) {
      ctx.fillStyle = '#26221f';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f0f2f2';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.46, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b8282a';
      ctx.fillRect(W * 0.36, H * 0.14, W * 0.28, H * 0.72);
      ctx.fillRect(W * 0.14, H * 0.36, W * 0.72, H * 0.28);
      ctx.strokeStyle = 'rgba(40,36,32,0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2, H * 0.04);
      ctx.lineTo(W / 2, H * 0.96);
      ctx.stroke();
      speckle(ctx, W, H, 531, 500, '255,255,255', '60,50,40', 3);
    },

    doorMetal(ctx, W, H) {
      ctx.fillStyle = '#3e3a36';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 533, 2000, '120,110,100', '10,10,10', 3);
      ctx.fillStyle = '#56504a';
      for (let x = 12; x < W; x += 32) {
        [10, H - 14].forEach(y => {
          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, PI * 2);
          ctx.fill();
        });
      }
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, H / 2 - 2, W, 4);
    },

    stripes(ctx, W, H) {
      ctx.fillStyle = '#e6e0d6';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#a8302a';
      for (let i = -2; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * W / 2, H);
        ctx.lineTo(i * W / 2 + W / 4, H);
        ctx.lineTo(i * W / 2 + W / 4 + W / 2, 0);
        ctx.lineTo(i * W / 2 + W / 2, 0);
        ctx.closePath();
        ctx.fill();
      }
      speckle(ctx, W, H, 535, 900, '255,255,255', '40,20,20', 2);
    },

    baseWall(ctx, W, H) {
      ctx.fillStyle = '#8e6a52';
      ctx.fillRect(0, 0, W, H);
      const g = rand(537);
      for (let j = 0; j < 16; j++) {
        for (let i = 0; i < 8; i++) {
          const x = i * 32 + (j % 2) * 16, y = j * 16;
          const v = (g() - 0.5) * 30;
          ctx.fillStyle = `rgb(${150 + v},${96 + v * 0.7},${76 + v * 0.6})`;
          ctx.fillRect(x + 1, y + 1, 30, 14);
        }
      }
      speckle(ctx, W, H, 538, 700, '230,200,180', '40,24,18', 2);
    },

    concrete(ctx, W, H) {
      ctx.fillStyle = '#8a8680';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 539, 3000, '200,196,190', '40,38,36', 3);
      ctx.strokeStyle = 'rgba(40,38,36,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, W - 2, H - 2);
    },

    puff(ctx, W, H) {
      Demo.DRAW.lumps(ctx, W, H, 701, ['rgba(250,250,250,1)', 'rgba(208,208,208,1)', 'rgba(156,156,156,1)']);
    },

    dusk(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#262a32');
      g.addColorStop(0.5, '#3c3e44');
      g.addColorStop(0.78, '#7a7058');
      g.addColorStop(0.9, '#d6be7c');
      g.addColorStop(1, '#e8d49a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const r = rand(541);
      for (let i = 0; i < 26; i++) {
        const x = r() * W, y = H * (0.25 + r() * 0.4), w = W * (0.05 + r() * 0.12), h = H * (0.02 + r() * 0.04);
        ctx.fillStyle = `rgba(${r() < 0.5 ? '220,190,130' : '70,66,62'},${0.2 + r() * 0.25})`;
        ctx.beginPath();
        ctx.ellipse(x, y, w, h, 0, 0, PI * 2);
        ctx.fill();
      }
    },

    dirt(ctx, W, H) {
      ctx.fillStyle = '#7a6a56';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 543, 5000, '200,180,150', '40,32,24', 3);
      const g = rand(544);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '60,50,40' : '150,130,104'},0.25)`;
        ctx.beginPath();
        ctx.ellipse(g() * W, g() * H, 6 + g() * 20, 3 + g() * 8, g() * PI, 0, PI * 2);
        ctx.fill();
      }
    },

    stone(ctx, W, H) {
      ctx.fillStyle = '#6a6460';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 545, 2600, '170,164,156', '30,28,26', 3);
      const g = rand(546);
      ctx.strokeStyle = 'rgba(30,28,26,0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(g() * W, g() * H);
        ctx.lineTo(g() * W, g() * H);
        ctx.stroke();
      }
    },

    ticket(ctx, W, H) {
      ctx.fillStyle = '#c4c2b4';
      ctx.fillRect(0, 0, W, H);
      speckle(ctx, W, H, 551, 2000, '230,230,220', '80,80,70', 2);
      ctx.fillStyle = '#7a3a36';
      ctx.beginPath();
      ctx.moveTo(W * 0.04, H);
      ctx.lineTo(W * 0.04, H * 0.3);
      ctx.quadraticCurveTo(W * 0.04, H * 0.04, W * 0.3, H * 0.04);
      ctx.lineTo(W * 0.74, H * 0.04);
      ctx.quadraticCurveTo(W * 0.96, H * 0.04, W * 0.96, H * 0.3);
      ctx.lineTo(W * 0.96, H);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#cfc6bc';
      ctx.font = `bold ${Math.round(H * 0.07)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText('PLEASE', W * 0.5, H * 0.2);
      ctx.fillText('TAKE A', W * 0.5, H * 0.29);
      ctx.fillText('TICKET', W * 0.5, H * 0.38);
      ctx.textAlign = 'left';
    },

    serving1(ctx, W, H) { DRAW.servingN(ctx, W, H, '1'); },
    serving2(ctx, W, H) { DRAW.servingN(ctx, W, H, '2'); },

    servingN(ctx, W, H, n) {
      ctx.fillStyle = '#2e2a28';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#d8d0c4';
      ctx.fillRect(W * 0.04, H * 0.1, W * 0.6, H * 0.8);
      ctx.fillStyle = '#2e2a28';
      ctx.font = `bold ${Math.round(H * 0.26)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText('NOW', W * 0.34, H * 0.44);
      ctx.fillText('SERVING', W * 0.34, H * 0.76);
      ctx.fillStyle = '#e8e0d4';
      ctx.font = `bold ${Math.round(H * 0.7)}px ${SANS}`;
      ctx.fillText(n, W * 0.82, H * 0.8);
      ctx.textAlign = 'left';
    },

    nextSign(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#e05a3a');
      g.addColorStop(1, '#9a2a1a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      centered(ctx, 'NEXT', W / 2, H * 0.68, `bold ${Math.round(H * 0.5)}px ${SANS}`, '#ffe8d8');
    },

    ciggy(ctx, W, H) {
      ctx.fillStyle = '#d6d0c2';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#efe8dc';
      ctx.fillRect(W * 0.08, H * 0.03, W * 0.84, H * 0.1);
      ctx.save();
      ctx.translate(W * 0.18, H * 0.105);
      ctx.font = `italic bold ${Math.round(H * 0.07)}px Georgia, serif`;
      ctx.fillStyle = '#b8242a';
      ctx.fillText('Ciggy', 0, 0);
      ctx.restore();
      const g = rand(555);
      [0.2, 0.44, 0.68].forEach(y => {
        ctx.fillStyle = '#eee6d6';
        ctx.fillRect(W * 0.08, H * y, W * 0.84, H * 0.2);
        for (let i = 0; i < 6; i++) {
          const x = W * (0.12 + i * 0.13);
          ctx.fillStyle = ['#b8242a', '#2a3a6a', '#e8e0d0', '#3a6a3a'][Math.floor(g() * 4)];
          ctx.fillRect(x, H * (y + 0.04), W * 0.08, H * 0.12);
          ctx.fillStyle = '#b8242a';
          ctx.beginPath();
          ctx.arc(x + W * 0.04, H * (y + 0.1), W * 0.015, 0, PI * 2);
          ctx.fill();
        }
      });
    },

    magazine(ctx, W, H) {
      ctx.fillStyle = '#e8e2d2';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2a2622';
      ctx.font = `bold ${Math.round(H * 0.12)}px ${SANS}`;
      ctx.fillText('HEALTH', W * 0.06, H * 0.16);
      ctx.fillStyle = '#7a6a5a';
      ctx.fillRect(W * 0.06, H * 0.24, W * 0.4, H * 0.36);
      const g = rand(557);
      ctx.fillStyle = 'rgba(40,36,32,0.7)';
      for (let i = 0; i < 18; i++) {
        const col = i < 9 ? 0 : 1;
        const y = H * (0.66 + (i % 9) * 0.035);
        ctx.fillRect(W * (0.06 + col * 0.48), y, W * (0.3 + g() * 0.1), 2);
      }
      for (let i = 0; i < 12; i++) ctx.fillRect(W * 0.54, H * (0.24 + i * 0.03), W * (0.3 + g() * 0.1), 2);
    },

    crack(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const cx = W * 0.44, cy = H * 0.42;
      const g = rand(561);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineCap = 'round';
      for (let i = 0; i < 11; i++) {
        let x = cx, y = cy;
        let a = (i / 11) * PI * 2 + (g() - 0.5) * 0.4;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        const len = W * (0.35 + g() * 0.45);
        for (let s = 0; s < 6; s++) {
          a += (g() - 0.5) * 0.35;
          x += Math.cos(a) * len / 6;
          y += Math.sin(a) * len / 6;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      [0.05, 0.11, 0.2].forEach(rr => {
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i <= 16; i++) {
          const a = (i / 16) * PI * 2;
          const r = W * rr * (0.8 + g() * 0.4);
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(cx, cy, W * 0.02, 0, PI * 2);
      ctx.fill();
    },

    heartSkin(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#d0444a');
      g.addColorStop(1, '#9a1e26');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const r = rand(563);
      ctx.strokeStyle = 'rgba(110,20,40,0.6)';
      ctx.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        let x = r() * W, y = r() * H;
        ctx.lineWidth = 2 + r() * 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let s = 0; s < 5; s++) {
          x += (r() - 0.5) * W * 0.25;
          y += r() * H * 0.15;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      speckle(ctx, W, H, 564, 600, '255,190,190', '90,10,20', 2);
    },

    beam(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.3, 'rgba(255,255,255,0.75)');
      g.addColorStop(0.5, 'rgba(255,255,255,1)');
      g.addColorStop(0.7, 'rgba(255,255,255,0.75)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    organs(ctx, W, H) {
      ctx.fillStyle = '#5a1a26';
      ctx.fillRect(0, 0, W, H);
      const r = rand(565);
      for (let i = 0; i < 70; i++) {
        const x = r() * W, y = r() * H, rr = 8 + r() * 22;
        const g = ctx.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 2, x, y, rr);
        const hue = r();
        g.addColorStop(0, hue < 0.5 ? '#c86a8a' : '#d06a5a');
        g.addColorStop(1, hue < 0.5 ? '#5a2a4a' : '#6a1a1e');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x, y, rr, rr * (0.5 + r() * 0.4), r() * PI, 0, PI * 2);
        ctx.fill();
      }
    }
  };

  const SIZES = {
    title: [1024, 576], quote1: [1024, 576], quote2: [1024, 576], quote3: [1024, 576], f2p: [1024, 576], f2pUrl: [1024, 576],
    labWall: [256, 256], labLow: [256, 256], labFloor: [256, 256], labPaint: [256, 256], xray1: [256, 320], xray2: [256, 320], monitor: [256, 192],
    console: [512, 256], cabinet: [256, 256], megaBaboon: [256, 64], spareLabel: [256, 64], beerLabel: [128, 128], canLabel: [128, 128],
    gauge: [256, 256], meterFace: [256, 160], lampOff: [256, 96], lampOn: [256, 96], redCross: [256, 256], doorMetal: [256, 256], stripes: [256, 256],
    baseWall: [256, 256], concrete: [256, 256], dusk: [512, 256], dirt: [256, 256], stone: [128, 128], ticket: [256, 512], serving1: [256, 128],
    serving2: [256, 128], nextSign: [256, 96], ciggy: [256, 512], magazine: [256, 192], crack: [1024, 576], heartSkin: [256, 256], organs: [256, 256], beam: [64, 16], puff: [256, 256]
  };

  const REPEAT = ['labWall', 'labLow', 'labFloor', 'labPaint', 'doorMetal', 'stripes', 'baseWall', 'concrete', 'dirt', 'stone', 'heartSkin', 'organs'];

  function tex(r, cache, key) {
    if (!cache[key]) {
      if (!DRAW[key] || key === 'servingN') return Meet.tex(r, cache, key);
      const [w, h] = SIZES[key] || [256, 256];
      cache[key] = r.texture(w, DRAW[key], { height: h, clamp: !REPEAT.includes(key) });
    }
    return cache[key];
  }

  window.MedArt = { DRAW, SIZES, GLYPHS, tex, slabWord };
})();
