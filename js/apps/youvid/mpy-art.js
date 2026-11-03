(function () {
  const { rand } = window.P3D;
  const Meet = window.MeetArt;
  const Mts = window.MtsArt;
  const Demo = window.DemoArt;
  const PI = Math.PI;

  const CREAM = '#f1e5d9';
  const PANEL = '#a65c2d';
  const BAND = '#2f2d2b';
  const SANS = '"Arial Black", "Arial Bold", Arial, sans-serif';

  const GLYPHS = {
    P: {
      w: 112,
      draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(66, 0);
        ctx.ellipse(66, 31, 42, 31, 0, -PI / 2, PI / 2);
        ctx.lineTo(42, 62);
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
        ctx.lineTo(62, 15);
        ctx.ellipse(62, 31, 18, 16, 0, -PI / 2, PI / 2);
        ctx.lineTo(42, 47);
        ctx.closePath();
        ctx.fill('evenodd');
      }
    },
    Y: {
      w: 124,
      draw(ctx) {
        Meet.slabWord(ctx, 'Y', 0, 0, 100, 0, ctx.fillStyle, 1);
      }
    },
    R: Mts.GLYPHS.R,
    O: Mts.GLYPHS.O
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

  function poly(ctx, pts) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }

  function tf2Words(ctx, x, y, h, fill) {
    ctx.font = `${Math.round(h)}px Impact, "Arial Narrow", "Arial Black", sans-serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = fill;
    const wa = ctx.measureText('TEAM').width;
    ctx.fillText('TEAM', x, y);
    ctx.fillText('FORTRESS 2', x + wa + h * 0.22, y);
  }

  function smallLogo(ctx, x, y, h) {
    for (let i = 8; i >= 1; i--) tf2Words(ctx, x - i * h * 0.025, y + i * h * 0.035, h, i > 4 ? '#3a2a20' : '#5a3a26');
    tf2Words(ctx, x, y, h, '#c87a3a');
  }

  function speckle(ctx, W, H, seed, n, light, dark, size) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = g() < 0.5 ? `rgba(${dark},${g() * 0.12})` : `rgba(${light},${g() * 0.1})`;
      ctx.fillRect(g() * W, g() * H, size || 2, size || 2);
    }
  }

  function strokes(ctx, W, H, seed, n, cols, wMin, wMax, len, ang, alpha) {
    const g = rand(seed);
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = g() * W, y = g() * H;
      const a = ang + (g() - 0.5) * 0.9;
      const l = len * (0.4 + g());
      ctx.strokeStyle = cols[Math.floor(g() * cols.length)];
      ctx.globalAlpha = alpha * (0.4 + g() * 0.6);
      ctx.lineWidth = wMin + g() * (wMax - wMin);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (g() - 0.5) * l * 0.3, y + Math.sin(a) * l * 0.5 + (g() - 0.5) * l * 0.3, x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function flamerIcon(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = col;
    poly(ctx, [[0, 8], [26, 8], [26, 0], [42, 0], [42, 10], [60, 10], [60, 80], [44, 80], [44, 94], [26, 94], [26, 62], [6, 62], [6, 48], [0, 48]]);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(110, 46, 52, 30, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillRect(60, 22, 60, 50);
    poly(ctx, [[150, 18], [218, 8], [228, 18], [232, 30], [232, 46], [160, 54]]);
    ctx.fill();
    ctx.fillRect(228, 2, 28, 40);
    ctx.beginPath();
    ctx.ellipse(276, 22, 20, 26, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillRect(256, 0, 22, 46);
    ctx.lineWidth = 7;
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(170, 56);
    ctx.lineTo(200, 76);
    ctx.lineTo(268, 64);
    ctx.lineTo(284, 52);
    ctx.stroke();
    ctx.fillStyle = PANEL;
    [[90, 40], [112, 36], [134, 40], [100, 58], [122, 58]].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 6.5, 0, PI * 2);
      ctx.fill();
    });
    ctx.fillRect(10, 22, 12, 6);
    ctx.fillRect(10, 34, 12, 6);
    ctx.restore();
  }

  function flameIcon(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = '#f2782a';
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.bezierCurveTo(20, 40, 52, 46, 62, 20);
    ctx.bezierCurveTo(66, 40, 80, 42, 92, 0);
    ctx.bezierCurveTo(100, 30, 96, 58, 70, 74);
    ctx.bezierCurveTo(52, 86, 20, 84, 0, 60);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffb066';
    ctx.beginPath();
    ctx.moveTo(24, 66);
    ctx.bezierCurveTo(40, 58, 58, 60, 66, 44);
    ctx.bezierCurveTo(70, 58, 60, 70, 46, 74);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function balloonicornSketch(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 10, 22, 16, 0, 0, PI * 2);
    ctx.moveTo(16, -2);
    ctx.ellipse(22, -12, 12, 11, 0, 0, PI * 2);
    ctx.moveTo(26, -24);
    ctx.lineTo(30, -40);
    ctx.lineTo(32, -23);
    [-14, -4, 8, 16].forEach(lx => { ctx.moveTo(lx, 22); ctx.lineTo(lx, 34); });
    ctx.moveTo(-20, 6);
    ctx.quadraticCurveTo(-34, 0, -30, 14);
    ctx.stroke();
    ctx.restore();
  }

  function matchbook(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(60,30,14,0.35)';
    ctx.beginPath();
    ctx.ellipse(262, 598, 132, 30, -0.12, 0, PI * 2);
    ctx.fill();
    poly(ctx, [[150, 548], [356, 574], [384, 596], [384, 612], [178, 588], [150, 566]]);
    ctx.fillStyle = '#e6b24a';
    ctx.fill();
    poly(ctx, [[150, 548], [356, 574], [384, 596], [178, 570]]);
    ctx.fillStyle = '#f2c862';
    ctx.fill();
    poly(ctx, [[176, 572], [380, 598], [380, 606], [176, 582]]);
    ctx.fillStyle = '#6a4a30';
    ctx.fill();
    for (let i = 0; i < 9; i++) {
      const bx = 160 + i * 18, by = 520 + i * 2.6;
      ctx.fillStyle = '#d8c8a0';
      poly(ctx, [[bx, by], [bx + 13, by + 1], [bx + 34, by + 52], [bx + 21, by + 51]]);
      ctx.fill();
      ctx.fillStyle = '#c0483a';
      ctx.beginPath();
      ctx.ellipse(bx + 6, by + 2, 8, 6, 0.2, 0, PI * 2);
      ctx.fill();
    }
    poly(ctx, [[136, 428], [296, 410], [300, 528], [148, 548]]);
    const cg = ctx.createLinearGradient(136, 420, 300, 540);
    cg.addColorStop(0, '#f6eedc');
    cg.addColorStop(1, '#d8ccb2');
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.strokeStyle = '#8a7a62';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(222, 470, 42, 46, -0.06, 0, PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(222, 470, 36, 40, -0.06, 0, PI * 2);
    ctx.stroke();
    balloonicornSketch(ctx, 214, 478, 0.82, '#8a7a62');
    ctx.fillStyle = '#8a7a62';
    ctx.font = 'italic 13px Georgia, serif';
    ctx.fillText('Est.', 158, 492);
    ctx.fillText('1936', 252, 482);
    ctx.save();
    ctx.translate(424, 618);
    ctx.rotate(-0.08);
    ctx.fillStyle = '#d8c8a0';
    ctx.fillRect(-36, -3, 64, 6);
    ctx.fillStyle = '#2a2420';
    ctx.beginPath();
    ctx.ellipse(32, 0, 9, 5, 0, 0, PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(240,236,230,0.75)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(456, 610);
    ctx.bezierCurveTo(470, 590, 440, 572, 456, 552);
    ctx.bezierCurveTo(470, 536, 452, 526, 460, 512);
    ctx.stroke();
    ctx.restore();
  }

  function paintedSky(ctx, W, H, top, mid, low, seed) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top);
    g.addColorStop(0.55, mid);
    g.addColorStop(1, low);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    strokes(ctx, W, H * 0.9, seed, 140, ['#ffffff', '#d8f0ff', '#a8d8f8'], 2, 7, W * 0.12, -0.05, 0.35);
  }

  const SWIRLS = {
    swirl: ['#f06aa8', '#fff4f8'], swirlY: ['#f2b030', '#fff6dc'], swirlR: ['#e8483c', '#fff4ee'], swirlG: ['#7ccc5a', '#fbfff0'], swirlP: ['#a878e0', '#fbf4ff'], swirlB: ['#58a8ec', '#f4fbff']
  };

  function swirl(ctx, W, H, a, b) {
    ctx.fillStyle = b;
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = W * 0.5;
    ctx.fillStyle = a;
    for (let arm = 0; arm < 2; arm++) {
      ctx.beginPath();
      const steps = 120;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const ang = t * PI * 5 + arm * PI;
        const r = t * R;
        const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const ang = t * PI * 5 + arm * PI + 0.9;
        const r = t * R;
        ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
      }
      ctx.closePath();
      ctx.fill();
    }
    const hl = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, 0, cx - R * 0.35, cy - R * 0.35, R * 0.6);
    hl.addColorStop(0, 'rgba(255,255,255,0.55)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.fillRect(0, 0, W, H);
  }

  function frameEdge(ctx, W, H, depth, seed, col) {
    ctx.clearRect(0, 0, W, H);
    const g = rand(seed);
    ctx.fillStyle = col;
    const n = 90;
    const edge = (k) => depth * (0.75 + g() * 0.5);
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    const pts = [];
    for (let i = 0; i < n; i++) pts.push([(i / n) * W, edge()]);
    for (let i = 0; i < n * 9 / 16; i++) pts.push([W - edge() * 0.9, (i / (n * 9 / 16)) * H]);
    for (let i = 0; i < n; i++) pts.push([W - (i / n) * W, H - edge()]);
    for (let i = 0; i < n * 9 / 16; i++) pts.push([edge() * 0.9, H - (i / (n * 9 / 16)) * H]);
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill('evenodd');
    for (let i = 0; i < 600; i++) {
      const side = g();
      const t = g();
      const d = depth * (0.9 + g() * 0.7);
      let x, y;
      if (side < 0.3) { x = t * W; y = g() * d; } else if (side < 0.6) { x = t * W; y = H - g() * d; } else if (side < 0.8) { x = g() * d; y = t * H; } else { x = W - g() * d; y = t * H; }
      ctx.beginPath();
      ctx.ellipse(x, y, 3 + g() * 9, 2 + g() * 5, g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function cracked(ctx, W, H, base, line, seed) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, seed, W * H * 0.2, '255,240,220', '40,20,10', 2);
    const g = rand(seed + 1);
    ctx.strokeStyle = line;
    for (let i = 0; i < 46; i++) {
      let x = g() * W, y = g() * H;
      ctx.lineWidth = 0.6 + g() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (g() - 0.5) * 60;
        y += (g() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function planks(ctx, W, H, base, seam, seed, burnt) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    const g = rand(seed);
    const n = 6;
    for (let i = 0; i < n; i++) {
      const x = (i / n) * W;
      ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,230,200'},${0.05 + g() * 0.08})`;
      ctx.fillRect(x, 0, W / n, H);
      ctx.fillStyle = seam;
      ctx.fillRect(x, 0, 3, H);
      for (let k = 0; k < 14; k++) {
        ctx.strokeStyle = `rgba(40,20,10,${0.08 + g() * 0.12})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const yy = g() * H;
        ctx.moveTo(x + 4, yy);
        ctx.bezierCurveTo(x + W / n * 0.3, yy + 6, x + W / n * 0.6, yy - 6, x + W / n - 2, yy + 2);
        ctx.stroke();
      }
    }
    if (burnt) {
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(14,8,4,${0.15 + g() * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(g() * W, g() * H, 10 + g() * 40, 8 + g() * 30, g() * PI, 0, PI * 2);
        ctx.fill();
      }
    }
  }

  const DRAW = {
    title(ctx, W) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = PANEL;
      poly(ctx, [[80, 30], [1206, 42], [1192, 668], [86, 662]]);
      ctx.fill();
      ctx.fillStyle = BAND;
      poly(ctx, [[178, 158], [1280, 160], [1280, 552], [246, 414]]);
      ctx.fill();
      ctx.save();
      poly(ctx, [[178, 158], [1280, 160], [1280, 552], [246, 414]]);
      ctx.clip();
      Mts.emblem(ctx, 780, 328, 335, '#3b3836', BAND);
      ctx.restore();
      flamerIcon(ctx, 722, 88, 1.12, '#f1e0c6');
      flameIcon(ctx, 1052, 60, 0.98);
      ctx.save();
      ctx.shadowColor = 'rgba(255,240,220,0.4)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = CREAM;
      ctx.font = `60px ${SANS}`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Meet', 279, 256);
      ctx.font = `38px ${SANS}`;
      ctx.fillText('THE', 330, 291);
      slabWord(ctx, 'PYRO', 330, 300, 98, 12, CREAM, 1.68);
      ctx.restore();
      matchbook(ctx);
      smallLogo(ctx, 530, 622, 30);
      ctx.fillStyle = CREAM;
      ctx.font = `bold 13px ${SANS}`;
      ctx.fillText('COPYRIGHT LOLOLOL', 762, 606);
      ctx.font = 'bold 17px Arial, sans-serif';
      ctx.fillStyle = '#2c2420';
      ctx.fillText('A Valve Picture', 762, 626);
      ctx.restore();
    },

    sfm(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = '#0b0d10';
      ctx.fillRect(0, 0, 1280, 720);
      const g = ctx.createRadialGradient(640, 330, 20, 640, 360, 560);
      g.addColorStop(0, '#2a3038');
      g.addColorStop(0.5, '#161a20');
      g.addColorStop(1, '#07080a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.save();
      ctx.translate(640, 380);
      ctx.scale(1.55, 1.55);
      ctx.translate(-640, -380);
      ctx.save();
      ctx.translate(486, 360);
      ctx.fillStyle = '#c9a466';
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#14171b';
      ctx.beginPath();
      ctx.arc(0, 0, 33, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9a466';
      for (let i = 0; i < 6; i++) {
        const a = i * PI / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 19, Math.sin(a) * 19, 8.5, 0, PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a466';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(28, 30);
      ctx.quadraticCurveTo(46, 44, 66, 40);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#9aa0a8';
      ctx.font = '9px Arial, sans-serif';
      ctx.fillText('CREATED WITH', 550, 318);
      ctx.fillStyle = '#eef0f2';
      ctx.font = 'bold 44px "Trebuchet MS", Verdana, Arial, sans-serif';
      ctx.fillText('source', 548, 356);
      ctx.fillText('filmmaker', 548, 400);
      ctx.fillStyle = '#6c7884';
      ctx.font = '11px Arial, sans-serif';
      ctx.fillText('www.sourcefilmmaker.com', 610, 452);
      ctx.restore();
      ctx.restore();
    },

    flare(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.5);
      g.addColorStop(0, 'rgb(235,245,255)');
      g.addColorStop(0.2, 'rgb(150,175,205)');
      g.addColorStop(0.55, 'rgb(40,54,72)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    frameA(ctx, W, H) { frameEdge(ctx, W, H, H * 0.03, 11, '#f3ddd3'); },
    frameB(ctx, W, H) { frameEdge(ctx, W, H, H * 0.058, 12, '#f0d6cc'); },
    frameC(ctx, W, H) { frameEdge(ctx, W, H, H * 0.095, 13, '#edd2c8'); },

    landSky(ctx, W, H) {
      paintedSky(ctx, W, H, '#4ea6e4', '#8ccdf2', '#e9f5f2', 21);
    },

    vistaSky(ctx, W, H) {
      paintedSky(ctx, W, H, '#5a64b8', '#b494d8', '#f4d4e4', 22);
      strokes(ctx, W, H * 0.8, 23, 90, ['#f4c8e8', '#ffffff', '#9a8ae0'], 4, 14, W * 0.2, 0.15, 0.4);
    },

    landCloud(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = rand(31);
      const blobs = [];
      for (let i = 0; i < 9; i++) blobs.push([W * (0.16 + i * 0.085 + (g() - 0.5) * 0.04), H * (0.62 - Math.sin((i / 8) * PI) * 0.26 + (g() - 0.5) * 0.06), H * (0.16 + Math.sin((i / 8) * PI) * 0.18 + g() * 0.06)]);
      ctx.fillStyle = '#c4d8ee';
      blobs.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y + r * 0.18, r, 0, PI * 2); ctx.fill(); });
      ctx.fillRect(W * 0.12, H * 0.62, W * 0.76, H * 0.16);
      ctx.fillStyle = '#ffffff';
      blobs.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y - r * 0.08, r * 0.92, 0, PI * 2); ctx.fill(); });
      ctx.globalCompositeOperation = 'source-atop';
      strokes(ctx, W, H, 32, 50, ['#e4f0fc', '#ffffff', '#b8cde6'], 2, 6, W * 0.12, 0.1, 0.5);
      ctx.globalCompositeOperation = 'source-over';
    },

    landGrass(ctx, W, H) {
      ctx.fillStyle = '#7fc65a';
      ctx.fillRect(0, 0, W, H);
      strokes(ctx, W, H, 41, 260, ['#6ab448', '#94d468', '#a8dc74', '#5aa040', '#c4e48a'], 3, 9, 40, -1.2, 0.55);
      const g = rand(42);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = ['#ffffff', '#ffe46a', '#f6a8d0', '#a8c8ff'][Math.floor(g() * 4)];
        ctx.beginPath();
        ctx.arc(g() * W, g() * H, 1.5 + g() * 2.5, 0, PI * 2);
        ctx.fill();
      }
    },

    landHill(ctx, W, H) {
      ctx.fillStyle = '#9ad46e';
      ctx.fillRect(0, 0, W, H);
      const bands = ['#b8e07a', '#8acb60', '#d8ec98', '#78bc58'];
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = bands[i % bands.length];
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        const y = (i / 9) * H;
        ctx.moveTo(0, y);
        for (let x = 0; x <= W; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.03 + i) * 8);
        ctx.lineTo(W, y + H / 18);
        ctx.lineTo(0, y + H / 18);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      strokes(ctx, W, H, 43, 120, ['#ffffff', '#c8e890'], 2, 5, 30, 0, 0.3);
    },

    candyHill(ctx, W, H) {
      const cols = ['#f8b4cc', '#fff0f4', '#c8b0f0', '#fff6d8', '#a8dcf4', '#ffffff'];
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(0, (i / 12) * H, W, H / 12 + 1);
      }
      strokes(ctx, W, H, 44, 80, ['#ffffff', '#f4d0e0'], 2, 6, 40, 0, 0.35);
    },

    cookie(ctx, W, H) {
      ctx.fillStyle = '#efd28e';
      ctx.fillRect(0, 0, W, H);
      const g = rand(51);
      for (let i = 0; i < 46; i++) {
        const x = g() * W, y = g() * H, rx = 10 + g() * 12, ry = 7 + g() * 8, a = g() * PI;
        ctx.fillStyle = 'rgba(120,70,30,0.35)';
        ctx.beginPath();
        ctx.ellipse(x + 1.5, y + 2.5, rx, ry, a, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = ['#cf9a5e', '#d8a868', '#c08a52', '#e0b476'][Math.floor(g() * 4)];
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, a, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,240,200,0.4)';
        ctx.beginPath();
        ctx.ellipse(x - rx * 0.25, y - ry * 0.3, rx * 0.45, ry * 0.35, a, 0, PI * 2);
        ctx.fill();
        for (let k = 0; k < 3; k++) {
          ctx.fillStyle = 'rgba(90,50,20,0.45)';
          ctx.beginPath();
          ctx.arc(x + (g() - 0.5) * rx, y + (g() - 0.5) * ry, 1.3, 0, PI * 2);
          ctx.fill();
        }
      }
    },

    petals(ctx, W, H) {
      ctx.fillStyle = '#f4d6c8';
      ctx.fillRect(0, 0, W, H);
      const g = rand(52);
      for (let i = 0; i < 420; i++) {
        ctx.fillStyle = ['#f49ab0', '#f6b48a', '#fbd0d8', '#e8788e', '#ffe0a0', '#f4c0e0'][Math.floor(g() * 6)];
        ctx.beginPath();
        ctx.ellipse(g() * W, g() * H, 3 + g() * 6, 2 + g() * 3, g() * PI, 0, PI * 2);
        ctx.fill();
      }
    },

    sparkle(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2 - PI / 2;
        const r = i % 2 ? W * 0.09 : W * 0.48;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.22);
      g.addColorStop(0, 'rgb(255,255,255)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    bubble(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const g = ctx.createRadialGradient(cx, cy, W * 0.3, cx, cy, W * 0.48);
      g.addColorStop(0, 'rgb(0,0,0)');
      g.addColorStop(0.7, 'rgb(120,140,170)');
      g.addColorStop(0.9, 'rgb(220,230,255)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgb(255,255,255)';
      ctx.beginPath();
      ctx.ellipse(cx - W * 0.16, cy - H * 0.18, W * 0.1, H * 0.05, -0.7, 0, PI * 2);
      ctx.fill();
    },

    flowerPink(ctx, W, H) { DRAW.flower(ctx, W, H, '#f7a8cc', '#ffe066'); },
    flowerBlue(ctx, W, H) { DRAW.flower(ctx, W, H, '#8ea8f0', '#fff2a0'); },
    flowerWhite(ctx, W, H) { DRAW.flower(ctx, W, H, '#fffaf4', '#ffc840'); },

    flower(ctx, W, H, petal, mid) {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      ctx.fillStyle = petal;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * PI * 2;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * W * 0.24, cy + Math.sin(a) * H * 0.24, W * 0.22, H * 0.15, a, 0, PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * PI * 2;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * W * 0.26, cy + Math.sin(a) * H * 0.22, W * 0.1, H * 0.05, a, 0, PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = mid;
      ctx.beginPath();
      ctx.arc(cx, cy, W * 0.1, 0, PI * 2);
      ctx.fill();
    },

    giftBlue(ctx, W, H) { DRAW.gift(ctx, W, H, '#5ea0dc', '#f2c84a'); },
    giftPurple(ctx, W, H) { DRAW.gift(ctx, W, H, '#7a6ccc', '#9ad8f4'); },
    giftPink(ctx, W, H) { DRAW.gift(ctx, W, H, '#f0a0c0', '#ffffff'); },

    gift(ctx, W, H, base, stripe) {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = stripe;
      [0.18, 0.5, 0.82].forEach(x => ctx.fillRect(W * x - W * 0.06, 0, W * 0.12, H));
      strokes(ctx, W, H, 61, 50, ['rgba(255,255,255,1)'], 2, 5, 30, 0.3, 0.12);
    },

    landWall(ctx, W, H) {
      ctx.fillStyle = '#f6e4c4';
      ctx.fillRect(0, 0, W, H);
      strokes(ctx, W, H, 71, 110, ['#fff4dc', '#ecd2ac', '#f8dcc0'], 4, 12, 50, 0.1, 0.5);
    },

    landWallPink(ctx, W, H) {
      ctx.fillStyle = '#f6c4cc';
      ctx.fillRect(0, 0, W, H);
      strokes(ctx, W, H, 72, 110, ['#ffe0e4', '#eaa8b4', '#fcd4dc'], 4, 12, 50, 0.1, 0.5);
    },

    landWallYellow(ctx, W, H) {
      ctx.fillStyle = '#f8e08c';
      ctx.fillRect(0, 0, W, H);
      strokes(ctx, W, H, 73, 110, ['#fff0b4', '#eccc70', '#fae8a0'], 4, 12, 50, 0.1, 0.5);
    },

    landRoof(ctx, W, H) {
      ctx.fillStyle = '#5c8ed8';
      ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 16) {
        for (let x = (y / 16) % 2 ? 8 : 0; x < W; x += 16) {
          ctx.fillStyle = 'rgba(30,60,130,0.35)';
          ctx.beginPath();
          ctx.arc(x + 8, y + 12, 8, 0, PI);
          ctx.fill();
        }
      }
      strokes(ctx, W, H, 74, 40, ['#a8c8f4'], 2, 4, 30, 0, 0.3);
    },

    landWindow(ctx, W, H) {
      ctx.fillStyle = '#7aa0c8';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#cfe6f8';
      ctx.fillRect(W * 0.12, H * 0.1, W * 0.32, H * 0.36);
      ctx.fillRect(W * 0.56, H * 0.1, W * 0.32, H * 0.36);
      ctx.fillRect(W * 0.12, H * 0.54, W * 0.32, H * 0.36);
      ctx.fillRect(W * 0.56, H * 0.54, W * 0.32, H * 0.36);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(W * 0.16, H * 0.14, W * 0.1, H * 0.08);
    },

    awning(ctx, W, H) {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? '#ffffff' : '#f08aa8';
        ctx.fillRect((i / 8) * W, 0, W / 8 + 1, H);
      }
    },

    bread(ctx, W, H) {
      ctx.fillStyle = '#f2dcae';
      ctx.fillRect(0, 0, W, H);
      const g = rand(81);
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = `rgba(190,150,90,${0.3 + g() * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(g() * W, g() * H, 2 + g() * 5, 1.5 + g() * 3, g() * PI, 0, PI * 2);
        ctx.fill();
      }
      strokes(ctx, W, H, 82, 50, ['#fff4d8'], 2, 5, 20, 0, 0.4);
    },

    shell(ctx, W, H) {
      ctx.fillStyle = '#8ec4ec';
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      ctx.lineWidth = W * 0.07;
      ctx.strokeStyle = '#f08a4a';
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const t = i / 160;
        const a = t * PI * 4.2;
        const r = W * 0.06 + t * W * 0.38;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineWidth = W * 0.025;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    },

    blinds(ctx, W, H) {
      ctx.fillStyle = '#c8ccd0';
      ctx.fillRect(0, 0, W, H);
      const n = 10;
      for (let i = 0; i < n; i++) {
        const x = (i / n) * W;
        const g = ctx.createLinearGradient(x, 0, x + W / n, 0);
        g.addColorStop(0, '#9ca2a8');
        g.addColorStop(0.3, '#eef0f2');
        g.addColorStop(0.75, '#d8dce0');
        g.addColorStop(1, '#8a9096');
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, W / n, H);
      }
    },

    spyBlinds(ctx, W, H) {
      ctx.fillStyle = '#4a5054';
      ctx.fillRect(0, 0, W, H);
      const n = 6;
      for (let i = 0; i < n; i++) {
        const x = (i / n) * W;
        const g = ctx.createLinearGradient(x, 0, x + W / n, 0);
        g.addColorStop(0, '#3a3f44');
        g.addColorStop(0.45, '#9aa2a8');
        g.addColorStop(0.6, '#8a9298');
        g.addColorStop(1, '#3a3f44');
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, W / n, H);
      }
    },

    leaf(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(W * 0.5, H * 0.98);
      ctx.bezierCurveTo(W * 0.02, H * 0.6, W * 0.12, H * 0.12, W * 0.5, H * 0.02);
      ctx.bezierCurveTo(W * 0.88, H * 0.12, W * 0.98, H * 0.6, W * 0.5, H * 0.98);
      ctx.fill();
    },

    duskSky(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#6a4a3c');
      g.addColorStop(0.45, '#c87a48');
      g.addColorStop(0.75, '#f0b070');
      g.addColorStop(1, '#f6d6a0');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      strokes(ctx, W, H * 0.7, 91, 60, ['#a8644a', '#e8a070', '#7a5446'], 4, 14, W * 0.2, 0, 0.25);
    },

    smokeSky(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2a2226');
      g.addColorStop(0.5, '#5a4038');
      g.addColorStop(0.8, '#b06a3a');
      g.addColorStop(1, '#e0904a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      strokes(ctx, W, H * 0.8, 92, 80, ['#3a3034', '#6a5048', '#2a2428'], 6, 20, W * 0.2, 0.05, 0.35);
    },

    cracked(ctx, W, H) { cracked(ctx, W, H, '#8a6448', 'rgba(40,22,12,0.7)', 101); },
    dirt(ctx, W, H) { cracked(ctx, W, H, '#6e5240', 'rgba(30,18,10,0.55)', 102); },
    wood(ctx, W, H) { planks(ctx, W, H, '#8a5e3c', '#3a2416', 111, false); },
    woodDark(ctx, W, H) { planks(ctx, W, H, '#5a3c28', '#24160e', 112, false); },
    woodBurnt(ctx, W, H) { planks(ctx, W, H, '#4a3022', '#140c08', 113, true); },
    shedWood(ctx, W, H) { planks(ctx, W, H, '#a0643c', '#4a2a16', 114, false); },

    flameTongue(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H * 0.72, 0, W / 2, H * 0.6, H * 0.5);
      g.addColorStop(0, 'rgb(255,250,214)');
      g.addColorStop(0.2, 'rgb(255,206,90)');
      g.addColorStop(0.5, 'rgb(236,110,26)');
      g.addColorStop(0.8, 'rgb(90,20,4)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.bezierCurveTo(W * 0.62, H * 0.3, W * 0.98, H * 0.55, W * 0.82, H * 0.86);
      ctx.bezierCurveTo(W * 0.7, H * 1.0, W * 0.3, H * 1.0, W * 0.18, H * 0.86);
      ctx.bezierCurveTo(W * 0.02, H * 0.55, W * 0.38, H * 0.3, W / 2, 0);
      ctx.fill();
    },

    flameCrisp(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = rand(131);
      const grad = ctx.createLinearGradient(0, H, 0, 0);
      grad.addColorStop(0, '#fff4c0');
      grad.addColorStop(0.25, '#ffc848');
      grad.addColorStop(0.55, '#f27a1e');
      grad.addColorStop(0.85, '#c43c10');
      grad.addColorStop(1, '#8a1e08');
      ctx.fillStyle = grad;
      const tongues = [[0.5, 0.0, 0.26], [0.3, 0.18, 0.18], [0.7, 0.14, 0.18], [0.18, 0.4, 0.12], [0.82, 0.36, 0.12]];
      tongues.forEach(([x, top, w]) => {
        ctx.beginPath();
        ctx.moveTo(W * x, H * top);
        ctx.bezierCurveTo(W * (x + w * 0.6), H * (top + 0.25), W * (x + w * 1.2), H * 0.62, W * (x + w * 0.9), H * 0.86);
        ctx.bezierCurveTo(W * (x + w * 0.5), H * 1.0, W * (x - w * 0.5), H * 1.0, W * (x - w * 0.9), H * 0.86);
        ctx.bezierCurveTo(W * (x - w * 1.2), H * 0.62, W * (x - w * 0.5), H * (top + 0.25), W * x, H * top);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.8, W * 0.42, H * 0.2, 0, 0, PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-atop';
      const core = ctx.createRadialGradient(W * 0.5, H * 0.82, 0, W * 0.5, H * 0.75, H * 0.35);
      core.addColorStop(0, 'rgba(255,255,236,0.95)');
      core.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = `rgba(255,${120 + g() * 100},40,0.35)`;
        ctx.beginPath();
        ctx.ellipse(g() * W, H * (0.3 + g() * 0.6), W * 0.06, H * 0.08, 0, 0, PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    },

    pilot(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H * 0.75, 0, W / 2, H * 0.6, H * 0.5);
      g.addColorStop(0, 'rgb(230,245,255)');
      g.addColorStop(0.25, 'rgb(80,140,255)');
      g.addColorStop(0.6, 'rgb(20,40,180)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.bezierCurveTo(W * 0.7, H * 0.4, W * 0.9, H * 0.7, W * 0.7, H * 0.95);
      ctx.lineTo(W * 0.3, H * 0.95);
      ctx.bezierCurveTo(W * 0.1, H * 0.7, W * 0.3, H * 0.4, W / 2, 0);
      ctx.fill();
    },

    ember(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.5);
      g.addColorStop(0, 'rgb(255,240,180)');
      g.addColorStop(0.3, 'rgb(255,150,40)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    smokeLump(ctx, W, H) {
      if (Demo && Demo.DRAW && Demo.DRAW.lumps) Demo.DRAW.lumps(ctx, W, H, 443, ['rgba(90,80,76,1)', 'rgba(64,56,54,1)', 'rgba(44,38,36,1)']);
    },

    fireLump(ctx, W, H) {
      if (Demo && Demo.DRAW && Demo.DRAW.lumps) Demo.DRAW.lumps(ctx, W, H, 444, ['rgba(255,236,160,1)', 'rgba(255,164,50,1)', 'rgba(222,84,20,1)']);
    },

    helmetRing(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const g = ctx.createRadialGradient(cx, cy, W * 0.2, cx, cy, W * 0.5);
      g.addColorStop(0, '#5a5230');
      g.addColorStop(0.5, '#3e3a22');
      g.addColorStop(1, '#2a2616');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, W * 0.5, 0, PI * 2);
      ctx.arc(cx, cy, W * 0.2, 0, PI * 2, true);
      ctx.fill('evenodd');
    },

    lensMask(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'destination-out';
      [[236 / 960, 0.5], [724 / 960, 0.5]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x * W, y * H, (228 / 960) * W, 0, PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    },

    lensShade(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#000';
      [[236 / 960, 0.5], [724 / 960, 0.5]].forEach(([x, y]) => {
        const R = (228 / 960) * W;
        ctx.beginPath();
        ctx.arc(x * W, y * H, R, 0, PI * 2);
        ctx.arc(x * W, y * H, R * 0.84, 0, PI * 2, true);
        ctx.fill();
      });
    },

    lensRim(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, W * 0.36, W / 2, H / 2, W * 0.5);
      g.addColorStop(0, 'rgb(0,0,0)');
      g.addColorStop(0.55, 'rgb(150,170,190)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    burnHole(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = rand(121);
      const blob = (scale, col) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        const n = 28;
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * PI * 2;
          const r = W * 0.4 * scale * (0.78 + 0.22 * Math.sin(a * 3 + 1) * 0.5 + g() * 0.22);
          const x = W / 2 + Math.cos(a) * r, y = H / 2 + Math.sin(a) * r * (H / W);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      };
      blob(1, '#3a1c0c');
      blob(0.9, '#1c0c06');
      blob(0.78, '#8a2a08');
      blob(0.7, '#e0661c');
      blob(0.58, '#ffb04a');
    },

    poster(ctx, W, H) {
      ctx.fillStyle = '#e8dcc4';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#7a2a20';
      ctx.font = `bold ${Math.round(H * 0.16)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText('WANTED', W / 2, H * 0.2);
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(W * 0.2, H * 0.28, W * 0.6, H * 0.45);
      ctx.font = `bold ${Math.round(H * 0.08)}px Georgia, serif`;
      ctx.fillStyle = '#7a2a20';
      ctx.fillText('$ 500', W / 2, H * 0.88);
    }
  };

  Object.keys(SWIRLS).forEach(k => { DRAW[k] = (ctx, W, H) => swirl(ctx, W, H, SWIRLS[k][0], SWIRLS[k][1]); });

  const SIZES = {
    title: [1024, 576], sfm: [1024, 576], flare: [128, 128], frameA: [1024, 576], frameB: [1024, 576], frameC: [1024, 576],
    landSky: [512, 256], vistaSky: [512, 256], landCloud: [256, 128], landGrass: [256, 256], landHill: [256, 256], candyHill: [128, 256], cookie: [256, 256], petals: [256, 256],
    sparkle: [64, 64], bubble: [64, 64], flowerPink: [64, 64], flowerBlue: [64, 64], flowerWhite: [64, 64], giftBlue: [128, 128], giftPurple: [128, 128], giftPink: [128, 128],
    landWall: [256, 256], landWallPink: [256, 256], landWallYellow: [256, 256], landRoof: [128, 128], landWindow: [64, 64], awning: [128, 32], bread: [256, 256], shell: [128, 128],
    blinds: [256, 128], spyBlinds: [256, 128], leaf: [64, 128], duskSky: [512, 256], smokeSky: [512, 256], cracked: [256, 256], dirt: [256, 256], wood: [256, 256], woodDark: [256, 256],
    woodBurnt: [256, 256], shedWood: [256, 256], flameTongue: [64, 128], flameCrisp: [128, 256], pilot: [32, 64], ember: [32, 32], smokeLump: [256, 256], fireLump: [256, 256], poster: [128, 160],
    lensMask: [1024, 576], lensShade: [1024, 576], lensRim: [256, 256], burnHole: [256, 256], helmetRing: [512, 512],
    swirl: [256, 256], swirlY: [256, 256], swirlR: [256, 256], swirlG: [256, 256], swirlP: [256, 256], swirlB: [256, 256]
  };

  const REPEAT = ['landGrass', 'landHill', 'candyHill', 'cookie', 'petals', 'landWall', 'landWallPink', 'landWallYellow', 'landRoof', 'awning', 'bread', 'blinds', 'spyBlinds', 'cracked', 'dirt', 'wood', 'woodDark', 'woodBurnt', 'shedWood', 'giftBlue', 'giftPurple', 'giftPink'];

  function tex(r, cache, key) {
    if (!cache[key]) {
      if (DRAW[key]) {
        const [w, h] = SIZES[key] || [256, 256];
        cache[key] = r.texture(w, DRAW[key], { height: h, clamp: !REPEAT.includes(key) });
      } else if (Demo && Demo.DRAW[key]) {
        cache[key] = Demo.tex(r, cache, key);
      } else {
        cache[key] = Meet.tex(r, cache, key);
      }
    }
    return cache[key];
  }

  window.MpyArt = { DRAW, SIZES, GLYPHS, tex, slabWord };
})();
