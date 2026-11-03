(function () {
  const { rand } = window.P3D;
  const PI = Math.PI;

  const CREAM = '#f3e3d3';
  const RED = '#c9513c';
  const BAND = '#3c3a38';
  const LOGO = { gap: 0.37 };
  const SANS = '"Arial Black", "Arial Bold", Arial, sans-serif';
  const COND = 'Impact, "Arial Narrow", "Arial Black", sans-serif';

  const SLAB = {
    H: { w: 120, polys: [[[14, 0], [42, 0], [42, 100], [14, 100]], [[78, 0], [106, 0], [106, 100], [78, 100]], [[42, 41], [78, 41], [78, 59], [42, 59]], [[0, 0], [56, 0], [56, 14], [0, 14]], [[0, 86], [56, 86], [56, 100], [0, 100]], [[64, 0], [120, 0], [120, 14], [64, 14]], [[64, 86], [120, 86], [120, 100], [64, 100]]] },
    E: { w: 106, polys: [[[14, 0], [42, 0], [42, 100], [14, 100]], [[0, 0], [100, 0], [100, 16], [0, 16]], [[86, 0], [100, 0], [100, 34], [86, 34]], [[42, 42], [80, 42], [80, 58], [42, 58]], [[70, 32], [82, 32], [82, 68], [70, 68]], [[0, 84], [106, 84], [106, 100], [0, 100]], [[92, 64], [106, 64], [106, 100], [92, 100]]] },
    A: { w: 132, polys: [[[44, 0], [74, 0], [44, 86], [14, 86]], [[58, 0], [88, 0], [118, 86], [88, 86]], [[34, 52], [98, 52], [98, 66], [34, 66]], [[40, 0], [92, 0], [92, 12], [40, 12]], [[0, 86], [58, 86], [58, 100], [0, 100]], [[74, 86], [132, 86], [132, 100], [74, 100]]] },
    V: { w: 128, polys: [[[14, 14], [44, 14], [76, 100], [52, 100]], [[84, 14], [114, 14], [76, 100], [52, 100]], [[0, 0], [58, 0], [58, 14], [0, 14]], [[70, 0], [128, 0], [128, 14], [70, 14]]] },
    Y: { w: 124, polys: [[[16, 14], [46, 14], [78, 58], [48, 58]], [[78, 14], [108, 14], [76, 58], [46, 58]], [[48, 50], [76, 50], [76, 88], [48, 88]], [[28, 86], [96, 86], [96, 100], [28, 100]], [[0, 0], [58, 0], [58, 14], [0, 14]], [[66, 0], [124, 0], [124, 14], [66, 14]]] }
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

  function emblem(ctx, x, y, R, col, bg) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.36, 0, PI * 2);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate(i * PI / 2 + PI / 4);
      ctx.fillRect(-R * 0.09, R * 0.36, R * 0.18, R * 0.7);
      ctx.restore();
    }
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.2, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function bulletSide(ctx, x, y, len, rad, ang) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    const cg = ctx.createLinearGradient(0, -rad, 0, rad);
    cg.addColorStop(0, '#6b6763');
    cg.addColorStop(0.35, '#3d3a37');
    cg.addColorStop(1, '#151413');
    ctx.fillStyle = cg;
    ctx.fillRect(0, -rad, len * 0.62, rad * 2);
    const ng = ctx.createLinearGradient(0, -rad, 0, rad);
    ng.addColorStop(0, '#b5ada2');
    ng.addColorStop(1, '#4e4944');
    ctx.fillStyle = ng;
    ctx.fillRect(len * 0.62, -rad * 0.92, len * 0.08, rad * 1.84);
    const tg = ctx.createLinearGradient(0, -rad, 0, rad);
    tg.addColorStop(0, '#f6b679');
    tg.addColorStop(0.45, '#d9823f');
    tg.addColorStop(1, '#7c3f18');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(len * 0.7, -rad * 0.9);
    ctx.quadraticCurveTo(len * 0.95, -rad * 0.6, len, 0);
    ctx.quadraticCurveTo(len * 0.95, rad * 0.6, len * 0.7, rad * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-rad * 0.3, -rad * 1.05, rad * 0.8, rad * 2.1);
    ctx.restore();
  }

  function minigunIcon(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    ctx.fillRect(-60, -14, 50, 30);
    ctx.beginPath();
    ctx.ellipse(-60, 1, 10, 16, 0, 0, PI * 2);
    ctx.fill();
    for (let i = 0; i < 4; i++) ctx.fillRect(-8 + i * 22, -10, 16, 24);
    ctx.fillRect(-10, -6, 100, 4);
    ctx.fillRect(-10, 4, 100, 4);
    ctx.fillRect(84, -12, 20, 28);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(-58, -22, 14, PI * 0.9, PI * 2.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-50, -38);
    ctx.lineTo(-44, -30);
    ctx.lineTo(-56, -30);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(108, 2);
    ctx.lineTo(132, -26);
    ctx.lineTo(128, -6);
    ctx.lineTo(176, -2);
    ctx.lineTo(126, 6);
    ctx.lineTo(132, 28);
    ctx.lineTo(110, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function rough(ctx, x, y, w, h, seed, n, size) {
    const g = rand(seed);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < n; i++) {
      const edge = g();
      const px = x + g() * w, py = edge < 0.5 ? y + g() * h * 0.12 : y + h - g() * h * 0.12;
      ctx.beginPath();
      ctx.arc(px, py, size * (0.4 + g()), 0, PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function tf2Words(ctx, x, y, h, fill, gapForEmblem) {
    ctx.font = `${Math.round(h)}px ${COND}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = fill;
    const a = 'TEAM', b = 'FORTRESS 2';
    const wa = ctx.measureText(a).width;
    const gap = gapForEmblem ? h * 0.66 : h * 0.22;
    ctx.fillText(a, x, y);
    ctx.fillText(b, x + wa + gap, y);
    return { wa, gap, total: wa + gap + ctx.measureText(b).width };
  }

  function smallLogo(ctx, x, y, h) {
    ctx.save();
    for (let i = 8; i >= 1; i--) tf2Words(ctx, x - i * h * 0.03, y + i * h * 0.04, h, i > 4 ? '#7a3a1c' : '#b8662c', false);
    tf2Words(ctx, x, y, h, '#e08a3c', false);
    ctx.restore();
  }

  const DRAW = {
    title(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.moveTo(82, 30);
      ctx.lineTo(1205, 44);
      ctx.lineTo(1190, 672);
      ctx.lineTo(87, 660);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = BAND;
      ctx.beginPath();
      ctx.moveTo(330, 160);
      ctx.lineTo(1280, 162);
      ctx.lineTo(1280, 550);
      ctx.lineTo(330, 462);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(330, 160);
      ctx.lineTo(1280, 162);
      ctx.lineTo(1280, 550);
      ctx.lineTo(330, 462);
      ctx.closePath();
      ctx.clip();
      emblem(ctx, 780, 330, 330, '#474543', BAND);
      ctx.restore();
      minigunIcon(ctx, 760, 100, 1.35, '#f0b29a');
      ctx.fillStyle = CREAM;
      ctx.font = `66px ${SANS}`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Meet', 340, 258);
      ctx.font = `44px ${SANS}`;
      ctx.fillText('THE', 390, 292);
      slabWord(ctx, 'HEAVY', 388, 300, 86, 10, CREAM, 1.42);
      ctx.save();
      ctx.filter = 'blur(10px)';
      ctx.fillStyle = 'rgba(70,20,10,0.45)';
      ctx.beginPath();
      ctx.moveTo(260, 150);
      ctx.quadraticCurveTo(250, 420, 330, 640);
      ctx.lineTo(440, 600);
      ctx.quadraticCurveTo(360, 420, 380, 150);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      for (let i = 0; i < 19; i++) {
        const f = i / 18;
        const by = 140 + f * 470;
        const bx = 160 + f * f * 70 - Math.sin(f * PI) * 10;
        const ang = f > 0.78 ? (f - 0.78) * 1.1 : 0;
        bulletSide(ctx, bx, by, 190, 15, ang);
        if (f > 0.78) {
          ctx.globalAlpha = 0.25;
          bulletSide(ctx, bx + 18, by + 10, 190, 15, ang + 0.2);
          ctx.globalAlpha = 1;
        }
      }
      smallLogo(ctx, 530, 625, 34);
      ctx.fillStyle = '#f0c8a0';
      ctx.font = `bold 13px ${SANS}`;
      ctx.fillText('COPYRIGHT LOLOLOL', 762, 606);
      ctx.font = `bold 17px Arial, sans-serif`;
      ctx.fillText('A Valve Picture', 762, 628);
      ctx.restore();
    },

    orange(ctx, W, H) {
      const k = W / 1280;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 1280, 720);
      const og = ctx.createLinearGradient(0, 215, 0, 350);
      og.addColorStop(0, '#ff8a2e');
      og.addColorStop(1, '#d9662a');
      ctx.fillStyle = og;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(260, 215, 104, 133, 6); else ctx.rect(260, 215, 104, 133);
      ctx.fill();
      ctx.font = '82px "Trebuchet MS", Verdana, Arial, sans-serif';
      ctx.textBaseline = 'alphabetic';
      const tg = ctx.createLinearGradient(0, 270, 0, 370);
      tg.addColorStop(0, '#ff8a3a');
      tg.addColorStop(1, '#c95e2a');
      ctx.fillStyle = tg;
      ctx.fillText('The Orange Box', 393, 346);
      ctx.strokeStyle = '#f07a34';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(1022, 266, 27, 0, PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f07a34';
      ctx.font = 'bold 38px "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.fillText('λ', 1022, 280);
      ctx.textAlign = 'left';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.strokeRect(300, 550, 138, 36);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('V A L V E', 369, 580);
      ctx.font = '9px Arial, sans-serif';
      ctx.fillText('®', 448, 554);
      ctx.textAlign = 'left';
      ctx.save();
      ctx.translate(568, 570);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(20, -6, 11, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(20, -6, 6, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(20, -6, 3.5, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(14, -2);
      ctx.lineTo(-18, 8);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-22, 10, 7, 0, PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 25px Arial, sans-serif';
      ctx.fillText('http://ORANGE.HALF-LIFE2.COM', 610, 580);
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('© 1999 Valve Corporation. Valve, the Valve logo, Half-Life, the Half-Life logo and the Lambda logo, Team Fortress and the Team Fortress logo,', 640, 627);
      ctx.fillText('Portal and the Portal logo are trademarks and/or registered trademarks of Valve Corporation.', 640, 658);
      ctx.restore();
    },

    tf2(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const h = H * 0.84;
      ctx.font = `${Math.round(h)}px ${COND}`;
      const m = tf2Words(ctx, 0, 0, h, '#fff', true);
      const scale = (W * 0.98) / m.total;
      LOGO.gap = (W * 0.01 + scale * (m.wa + m.gap / 2)) / W;
      ctx.save();
      ctx.translate(W * 0.01, H * 0.9);
      ctx.scale(scale, 1);
      tf2Words(ctx, 0, 0, h, '#fff', true);
      ctx.restore();
      rough(ctx, 0, H * 0.06, W, H * 0.86, 11, 220, H * 0.018);
    },

    tf2emblem(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      emblem(ctx, W / 2, H / 2, W * 0.48, '#141212', 'rgba(0,0,0,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.48 * 0.36, 0, PI * 2);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(i * PI / 2 + PI / 4);
        ctx.fillRect(-W * 0.48 * 0.09, W * 0.48 * 0.36, W * 0.48 * 0.18, W * 0.48 * 0.7);
        ctx.restore();
      }
      ctx.restore();
      ctx.fillStyle = '#141212';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.48 * 0.2, 0, PI * 2);
      ctx.fill();
    },

    boxFront(ctx, W, H) {
      ctx.fillStyle = '#c4a47a';
      ctx.fillRect(0, 0, W, H);
      const g = rand(31);
      for (let i = 0; i < 1400; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '90,60,30' : '255,240,210'},${g() * 0.08})`;
        ctx.fillRect(g() * W, g() * H, 2 + g() * 4, 1);
      }
      ctx.fillStyle = 'rgba(80,55,30,0.18)';
      ctx.fillRect(0, 0, W, H * 0.06);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(PI);
      ctx.translate(-W / 2, -H / 2);
      ctx.fillStyle = '#5a2e1c';
      ctx.font = `bold ${Math.round(H * 0.2)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText('FRAGILE', W / 2, H * 0.24);
      ctx.font = `bold ${Math.round(H * 0.18)}px ${SANS}`;
      ctx.fillText('UP', W * 0.1, H * 0.22);
      ctx.fillText('UP', W * 0.9, H * 0.22);
      [W * 0.1, W * 0.9].forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x - W * 0.045, H * 0.6);
        ctx.lineTo(x + W * 0.045, H * 0.6);
        ctx.lineTo(x + W * 0.045, H * 0.45);
        ctx.lineTo(x + W * 0.09, H * 0.45);
        ctx.lineTo(x, H * 0.3);
        ctx.lineTo(x - W * 0.09, H * 0.45);
        ctx.lineTo(x - W * 0.045, H * 0.45);
        ctx.closePath();
        ctx.fill();
      });
      ctx.fillStyle = '#ebe5d6';
      ctx.fillRect(W * 0.25, H * 0.38, W * 0.5, H * 0.4);
      ctx.strokeStyle = 'rgba(70,60,50,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(W * 0.25, H * 0.38, W * 0.5, H * 0.4);
      ctx.fillStyle = '#3a3028';
      ctx.font = `italic bold ${Math.round(H * 0.085)}px Georgia, serif`;
      ctx.fillText('SUPER CALIBER', W * 0.5, H * 0.5);
      ctx.font = `bold ${Math.round(H * 0.035)}px Arial, sans-serif`;
      ctx.fillText('CUSTOM TOOLED CARTRIDGES', W * 0.5, H * 0.56);
      ctx.strokeStyle = '#3a3028';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(W * 0.3, H * 0.66);
      ctx.lineTo(W * 0.43, H * 0.64);
      ctx.quadraticCurveTo(W * 0.5, H * 0.67, W * 0.43, H * 0.71);
      ctx.lineTo(W * 0.3, H * 0.69);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeRect(W * 0.53, H * 0.62, W * 0.18, H * 0.1);
      for (let i = 0; i < 4; i++) ctx.fillRect(W * 0.545, H * (0.638 + i * 0.02), W * 0.15, 1.5);
      ctx.restore();
    },

    cardboard(ctx, W, H) {
      ctx.fillStyle = '#bd9d74';
      ctx.fillRect(0, 0, W, H);
      const g = rand(32);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '90,60,30' : '255,240,210'},${g() * 0.08})`;
        ctx.fillRect(g() * W, g() * H, 2 + g() * 4, 1);
      }
    },

    map(ctx, W, H) {
      ctx.fillStyle = '#e4dcc0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(190,60,40,0.85)';
      ctx.lineWidth = W * 0.008;
      ctx.lineJoin = 'round';
      ctx.strokeRect(W * 0.32, H * 0.08, W * 0.45, H * 0.16);
      ctx.beginPath();
      ctx.ellipse(W * 0.2, H * 0.5, W * 0.17, H * 0.2, 0, 0, PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W * 0.85, H * 0.6);
      ctx.lineTo(W * 0.3, H * 0.42);
      ctx.moveTo(W * 0.3, H * 0.42);
      ctx.lineTo(W * 0.36, H * 0.36);
      ctx.moveTo(W * 0.3, H * 0.42);
      ctx.lineTo(W * 0.37, H * 0.47);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W * 0.05, H * 0.82);
      ctx.lineTo(W * 0.2, H * 0.78);
      ctx.lineTo(W * 0.3, H * 0.9);
      ctx.lineTo(W * 0.5, H * 0.86);
      ctx.stroke();
      [[0.15, 0.82], [0.24, 0.84], [0.42, 0.88]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(W * x, H * y, W * 0.025, 0, PI * 2);
        ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(60,60,70,0.35)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, H * i / 6);
        ctx.lineTo(W, H * i / 6);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(80,60,40,0.12)';
      ctx.fillRect(0, 0, W, H * 0.03);
    },

    fan(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#1b1a1d';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.48, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#545058';
      ctx.lineWidth = W * 0.03;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.45, 0, PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#b8b4bc';
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(i * PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(W * 0.3, -W * 0.08, W * 0.4, W * 0.04);
        ctx.quadraticCurveTo(W * 0.25, W * 0.16, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#2a282c';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.07, 0, PI * 2);
      ctx.fill();
    },

    planks(ctx, W, H) {
      ctx.fillStyle = '#4a3a33';
      ctx.fillRect(0, 0, W, H);
      const g = rand(14);
      const n = 8;
      for (let i = 0; i < n; i++) {
        const x = (i / n) * W;
        ctx.fillStyle = `rgba(${g() < 0.5 ? '20,12,10' : '120,95,80'},${0.08 + g() * 0.1})`;
        ctx.fillRect(x, 0, W / n, H);
        ctx.fillStyle = 'rgba(15,10,8,0.6)';
        ctx.fillRect(x, 0, 2, H);
      }
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = `rgba(20,14,12,${g() * 0.15})`;
        ctx.fillRect(g() * W, g() * H, 1, 6 + g() * 20);
      }
    },

    wall(ctx, W, H) {
      ctx.fillStyle = '#34282c';
      ctx.fillRect(0, 0, W, H);
      const g = rand(19);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '10,8,12' : '90,70,80'},${0.1 + g() * 0.08})`;
        ctx.fillRect((i / 12) * W, 0, W / 12, H);
        ctx.fillStyle = 'rgba(8,6,8,0.45)';
        ctx.fillRect((i / 12) * W, 0, 3, H);
      }
      for (let i = 0; i < 600; i++) {
        ctx.fillStyle = `rgba(0,0,0,${g() * 0.12})`;
        ctx.fillRect(g() * W, g() * H, 2, 2 + g() * 10);
      }
    },

    wood(ctx, W, H) {
      ctx.fillStyle = '#7a5a4a';
      ctx.fillRect(0, 0, W, H);
      const g = rand(23);
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '40,25,20' : '150,120,100'},${0.06 + g() * 0.1})`;
        ctx.fillRect((i / 16) * W, 0, W / 16, H);
        ctx.fillStyle = 'rgba(40,26,20,0.5)';
        ctx.fillRect((i / 16) * W, 0, 2, H);
      }
      for (let i = 0; i < 500; i++) {
        ctx.fillStyle = `rgba(50,32,24,${g() * 0.12})`;
        ctx.fillRect(g() * W, g() * H, 1, 4 + g() * 16);
      }
    },

    sand(ctx, W, H) {
      ctx.fillStyle = '#a98a68';
      ctx.fillRect(0, 0, W, H);
      const g = rand(27);
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '110,80,60' : '210,180,150'},${g() * 0.12})`;
        ctx.fillRect(g() * W, g() * H, 2 + g() * 3, 2 + g() * 3);
      }
    },

    rock(ctx, W, H) {
      ctx.fillStyle = '#c29a74';
      ctx.fillRect(0, 0, W, H);
      const g = rand(29);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '140,100,75' : '225,195,160'},${0.08 + g() * 0.1})`;
        ctx.fillRect(0, g() * H, W, 2 + g() * 6);
      }
    },

    sign(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(236,228,214,0.92)';
      ctx.font = `bold ${Math.round(H * 0.42)}px "Arial Black", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('REDSTONE', W / 2, H * 0.46);
      ctx.font = `bold ${Math.round(H * 0.3)}px Arial, sans-serif`;
      ctx.fillText('MINING CO.', W / 2, H * 0.86);
    },

    lineupWall(ctx, W, H) {
      ctx.fillStyle = '#a19c94';
      ctx.fillRect(0, 0, W, H);
      const g = rand(41);
      for (let i = 0; i < 90; i++) {
        const x = g() * W, y = g() * H * 0.7, r = W * (0.03 + g() * 0.08);
        const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
        const light = g() < 0.4;
        gr.addColorStop(0, light ? 'rgba(235,232,226,0.5)' : 'rgba(70,66,62,0.22)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.fillStyle = 'rgba(60,58,56,0.5)';
      ctx.fillRect(0, H * 0.82, W, H * 0.18);
    },

    sleeve(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      emblem(ctx, W / 2, H / 2, W * 0.46, '#d9793e', 'rgba(0,0,0,0)');
    },

    shaft(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.5, 'rgba(255,240,215,1)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const v = ctx.createLinearGradient(0, 0, 0, H);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    },

    flash(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      const n = 9;
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const r = (i % 2 ? 0.22 : 0.48) * W;
        const a = (i / (n * 2)) * PI * 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgb(255,214,70)';
      ctx.fill();
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.3);
      g.addColorStop(0, 'rgb(255,255,240)');
      g.addColorStop(1, 'rgba(255,230,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, W * 0.3, 0, PI * 2);
      ctx.fill();
      ctx.restore();
    },

    puff(ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.5);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.85)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    glow(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.5);
      g.addColorStop(0, 'rgb(255,255,255)');
      g.addColorStop(0.35, 'rgb(150,150,150)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    flame(ctx, W, H) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H * 0.58, 0, W / 2, H * 0.52, W * 0.5);
      g.addColorStop(0, 'rgb(255,246,200)');
      g.addColorStop(0.25, 'rgb(255,190,70)');
      g.addColorStop(0.55, 'rgb(210,80,20)');
      g.addColorStop(1, 'rgb(0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  };

  const SIZES = {
    title: [1024, 576], orange: [1024, 576], tf2: [1024, 160], tf2emblem: [256, 256], boxFront: [512, 256], cardboard: [128, 128], map: [256, 256],
    fan: [128, 128], planks: [256, 256], wall: [256, 256], wood: [256, 256], sand: [256, 256], rock: [128, 128], sign: [256, 64],
    lineupWall: [512, 256], sleeve: [64, 64], shaft: [64, 64], flash: [128, 128], puff: [64, 64], glow: [64, 64], flame: [64, 64]
  };

  function tex(r, cache, key) {
    if (!cache[key]) {
      const [w, h] = SIZES[key] || [256, 256];
      const opts = { height: h, clamp: !['planks', 'wall', 'wood', 'sand', 'rock', 'cardboard'].includes(key) };
      cache[key] = r.texture(w, DRAW[key], opts);
    }
    return cache[key];
  }

  window.MeetArt = { DRAW, SIZES, LOGO, tex, slabWord, emblem };
})();
