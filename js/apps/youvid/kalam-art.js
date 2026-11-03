(function () {
  const K = window.YouVidKit;
  const { PI } = K;
  const { rand } = window.P3D;

  const SERIF = '"Times New Roman", Times, serif';
  const SANS = 'Arial, Helvetica, sans-serif';
  const SCRIPT = '"Segoe Script", Gabriola, cursive';
  const PRINT = '"Segoe Print", "Comic Sans MS", cursive';
  const TW = 640;
  const TH = 480;

  function adekGlyphs(ctx, x, y, s, mode) {
    const L = [
      (c) => { c.moveTo(0, 1); c.lineTo(0.36, 0); c.lineTo(0.72, 1); c.moveTo(0.2, 0.64); c.lineTo(0.52, 0.64); },
      (c) => { c.moveTo(0, 0); c.lineTo(0.38, 0); c.quadraticCurveTo(0.76, 0, 0.76, 0.5); c.quadraticCurveTo(0.76, 1, 0.38, 1); c.lineTo(0, 1); c.closePath(); },
      (c) => { c.moveTo(0.74, 0); c.lineTo(0, 0); c.lineTo(0, 1); c.lineTo(0.74, 1); c.moveTo(0, 0.5); c.lineTo(0.56, 0.5); },
      (c) => { c.moveTo(0, 0); c.lineTo(0, 1); c.moveTo(0.72, 0); c.lineTo(0.08, 0.52); c.lineTo(0.74, 1); }
    ];
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, 0, -0.22, 1, 0, 0);
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'butt';
    L.forEach((g, i) => {
      ctx.save();
      ctx.translate(i * s * 1.02, 0);
      ctx.scale(s, s);
      ctx.beginPath();
      g(ctx);
      if (mode === 'outline') {
        ctx.lineWidth = 0.2;
        ctx.stroke();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 0.1;
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.lineWidth = 0.19;
        ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();
  }

  function spaced(ctx, text, x, y, gap) {
    const widths = [...text].map(ch => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
    let cx = x - total / 2;
    const align = ctx.textAlign;
    ctx.textAlign = 'left';
    [...text].forEach((ch, i) => {
      ctx.fillText(ch, cx, y);
      cx += widths[i] + gap;
    });
    ctx.textAlign = align;
  }

  function bug(mirror) {
    return K.textCanvas(160, 80, (ctx) => {
      if (mirror) {
        ctx.translate(160, 0);
        ctx.scale(-1, 1);
      }
      ctx.strokeStyle = '#9cc4e8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(80, 40, 72, 36, 0, 0, PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#2c4c86';
      ctx.beginPath();
      ctx.moveTo(14, 22);
      ctx.lineTo(146, 22);
      ctx.quadraticCurveTo(156, 40, 146, 58);
      ctx.lineTo(14, 58);
      ctx.quadraticCurveTo(4, 40, 14, 22);
      ctx.fill();
      ctx.font = `bold 36px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1a2a50';
      ctx.strokeText('ДТБ', 80, 42);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('ДТБ', 80, 42);
    });
  }

  function watermark(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(w / 200, h / 60);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    adekGlyphs(ctx, 24, 12, 36, 'outline');
    ctx.restore();
  }

  function black(ctx, w, h) {
    ctx.fillStyle = '#060406';
    ctx.fillRect(0, 0, w, h);
    const g = rand(7);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? '90,20,40' : '20,10,30'},${0.06 * g()})`;
      ctx.fillRect(g() * w, g() * h, 2, 1);
    }
  }

  const TITLES = {
    adek(ctx) {
      ctx.fillStyle = '#ececec';
      ctx.font = `26px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      spaced(ctx, 'TELECOMPANY', TW / 2, 138, 3);
      ctx.strokeStyle = '#f4f4f4';
      adekGlyphs(ctx, 205, 210, 58, 'solid');
    },
    amp(ctx) {
      ctx.fillStyle = '#e8e2c8';
      ctx.font = `62px ${SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('&', TW / 2, 214);
    },
    amp2(ctx) {
      ctx.fillStyle = '#e8e2c8';
      ctx.font = `italic 70px Gabriola, ${SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('&', TW / 2, 214);
    },
    or(ctx) {
      ctx.fillStyle = '#e6e0c4';
      ctx.font = `52px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('or', TW / 2, 214);
    },
    chizh(ctx) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold 26px ${SANS}`;
      ctx.fillStyle = '#c8c4c0';
      ctx.fillText('Production', TW / 2, 112);
      ctx.save();
      ctx.translate(TW / 2, 200);
      ctx.fillStyle = '#e01c1c';
      ctx.font = `900 76px Impact, ${SANS}`;
      ctx.transform(1, 0, -0.18, 1, 0, 0);
      ctx.fillText('ЧИЖ', 0, 0);
      ctx.fillStyle = '#060406';
      for (let i = 0; i < 5; i++) ctx.fillRect(-90, -26 + i * 13, 180, 2);
      ctx.restore();
      ctx.font = `bold 24px ${SANS}`;
      ctx.fillStyle = '#c8c4c0';
      spaced(ctx, 'Center', TW / 2, 292, 9);
    },
    calamburg(ctx) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ebe8e0';
      ctx.font = `30px ${SERIF}`;
      spaced(ctx, 'CALAMBURG  PICTURES', TW / 2, 204, 2);
      ctx.font = `25px ${SERIF}`;
      ctx.fillText('presents', TW / 2, 234);
    },
    privet(ctx) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ececec';
      ctx.font = `15px ${SANS}`;
      spaced(ctx, 'TELECOMPANY', TW / 2, 124, 2.5);
      ctx.font = `bold 15px ${SANS}`;
      spaced(ctx, 'PRIVET TV', TW / 2, 294, 7);
    },
    news(ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(118, 150, 404, 100);
      ctx.fillStyle = '#141414';
      ctx.font = `bold 21px ${SANS}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Россия начнёт поставлять', 134, 174);
      ctx.fillText('топинамбур в Китай', 134, 200);
      ctx.font = `11px ${SANS}`;
      ctx.fillStyle = '#3a3a3a';
      ctx.fillText('Сотрудничество открывает новые торговые возможности', 134, 234);
    },
    cal(ctx) {
      ctx.fillStyle = '#ebe8e0';
      ctx.font = `44px ${SERIF}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      spaced(ctx, 'CAL', 112, 214, 2);
    },
    cum(ctx) {
      ctx.fillStyle = '#ebe8e0';
      ctx.font = `44px ${SERIF}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      spaced(ctx, 'CUM', 112, 214, 2);
    },
    cumBig(ctx) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.75)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#f6f4ee';
      ctx.font = `bold 210px ${SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CUM', TW / 2, 236);
      ctx.restore();
    },
    vas(ctx) {
      ctx.save();
      ctx.translate(TW * 0.38, 330);
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(-62, 0);
      ctx.quadraticCurveTo(0, -52, 62, 0);
      ctx.quadraticCurveTo(0, 52, -62, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `40px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.scale(0.8, 1);
      ctx.fillText('ВАС ЗАМЕТИЛИ', 0, 82);
      ctx.restore();
      ctx.restore();
    },
    caption(ctx) {
      ctx.fillStyle = '#e8b830';
      ctx.fillRect(272, 50, 206, 58);
      ctx.fillStyle = '#5a1810';
      ctx.font = `bold 21px Impact, ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('«МЫ НЕ СИДИМ,', 375, 67);
      ctx.fillText('СЛОЖА РУКИ»', 375, 92);
    },
    rzhu(ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, TW, TH);
      ctx.fillStyle = '#0c0c0c';
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.font = `bold 118px ${SANS}`;
      ctx.save();
      ctx.translate(96, 152);
      ctx.scale(1, 1.1);
      ctx.fillText('РЖУ', 0, 0);
      ctx.restore();
      ctx.font = `bold 170px Impact, ${SANS}`;
      ctx.fillText('6', 506, 176);
      ctx.fillStyle = '#e01010';
      ctx.font = `bold 66px ${PRINT}`;
      ctx.fillText('шоу', 300, 236);
    },
    krutoe(ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, TW, 58);
      ctx.fillStyle = '#141414';
      ctx.font = `26px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('krutoe pike music', TW / 2, 31);
    },
    kras(ctx) {
      const word = (text, y, size, rot) => {
        ctx.font = `bold ${size}px ${PRINT}`;
        const widths = [...text].map(ch => ctx.measureText(ch).width);
        let x = TW / 2 - widths.reduce((a, b) => a + b, 0) / 2;
        [...text].forEach((ch, i) => {
          ctx.save();
          ctx.translate(x + widths[i] / 2, y + (i % 2 ? -size * 0.06 : size * 0.04));
          ctx.rotate(rot * (i % 2 ? 1 : -1));
          const g = ctx.createLinearGradient(0, -size * 0.45, 0, size * 0.4);
          g.addColorStop(0, '#fff26a');
          g.addColorStop(0.45, '#ffb21e');
          g.addColorStop(1, '#e83a12');
          ctx.lineWidth = size * 0.16;
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#1c0a06';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeText(ch, 0, 0);
          ctx.fillStyle = g;
          ctx.fillText(ch, 0, 0);
          ctx.restore();
          x += widths[i] * 0.98;
        });
      };
      word('комик группа', 150, 52, 0.06);
      word('КрАС', 262, 104, 0.08);
    },
    blank() {},
    bobs(ctx) {
      TITLES.bobsCard(ctx, 'БОБС');
    },
    bobsOld(ctx) {
      TITLES.bobsCard(ctx, 'БОНС');
    },
    dtbBig(ctx) {
      const g = ctx.createRadialGradient(TW / 2, TH / 2, 40, TW / 2, TH / 2, TW * 0.6);
      g.addColorStop(0, '#7a1020');
      g.addColorStop(1, '#2a0408');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, TW, TH);
      ctx.save();
      ctx.shadowColor = '#ff4060';
      ctx.shadowBlur = 40;
      ctx.strokeStyle = '#ff5a78';
      ctx.lineWidth = 46;
      ctx.beginPath();
      ctx.ellipse(TW / 2, TH / 2, 420, 220, 0, 0, PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = 'rgba(255, 210, 220, 0.25)';
      ctx.fillRect(0, TH / 2 - 120, TW, 240);
      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#fff8fa';
      ctx.font = `bold 230px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ДТБ', TW / 2, TH / 2 + 10);
      ctx.restore();
    },
    bobsCard(ctx, last) {
      ctx.fillStyle = '#f2f0ea';
      ctx.fillRect(0, 0, TW, TH);
      ctx.fillStyle = '#141414';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.font = `900 54px Impact, ${SANS}`;
      ctx.save();
      ctx.scale(0.86, 1);
      ctx.fillText('БИЛЛИ', 470 / 0.86, 100);
      ctx.fillText(last, 470 / 0.86, 160);
      ctx.restore();
      ctx.textAlign = 'left';
      ctx.font = `bold 30px ${SANS}`;
      const lines = ['ОН ЖЕ „КАПИТАН“.', 'ОБЛАДАТЕЛЬ КАРТЫ ОСТРОВА', 'СОКРОВИЩ. МНОГО ПЬЁТ И', 'ВСЕГДА ПРОСТУЖЕН.', 'ХАРАКТЕР СКВЕРНЫЙ.', 'НЕ ЖЕНАТ.'];
      lines.forEach((l, i) => {
        ctx.save();
        ctx.translate(64, 264 + i * 38);
        ctx.scale(0.78, 1);
        ctx.fillText(l, 0, 0);
        ctx.restore();
      });
    },
    gum(ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, TW, TH);
      ctx.save();
      ctx.scale(TW / 300, TH / 196);
      const pack = (x, y, w, h, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = '#9aa6b8';
        ctx.fillRect(-w / 2 + 3, -h / 2 + 3, w, h);
        ctx.fillStyle = '#f4f6fa';
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = '#6a7890';
        ctx.lineWidth = 1;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = '#2a4c9a';
        ctx.fillRect(-w / 2 + 2, -h * 0.18, w - 4, h * 0.36);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(h * 0.28)}px ${SANS}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('БОБС', 0, 1);
        ctx.restore();
      };
      for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) pack(26 + col * 30 + row * 4, 30 + row * 30, 34, 26, -0.15);
      for (let row = 0; row < 6; row++) pack(178, 22 + row * 28, 54, 24, 0.02);
      ctx.restore();
    },
    actorBg(ctx) {
      ctx.fillStyle = '#d6d6d4';
      ctx.fillRect(0, 0, TW, TH);
      const g = rand(31);
      ctx.lineCap = 'round';
      for (let i = 0; i < 520; i++) {
        const x = g() * TW, y = g() * TH, r = 6 + g() * 18, a = g() * PI * 2;
        ctx.strokeStyle = `rgba(${g() < 0.5 ? '255,255,255' : '96,96,100'},${0.35 + g() * 0.4})`;
        ctx.lineWidth = 1 + g() * 1.6;
        ctx.beginPath();
        ctx.arc(x, y, r, a, a + 1.4 + g() * 2.2);
        ctx.stroke();
      }
      const fx = 184, fy = 50, fw = 356, fh = 388;
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(fx + 8, fy + 10, fw, fh);
      ctx.fillStyle = '#f4f4f2';
      ctx.beginPath();
      const steps = 28;
      for (let i = 0; i <= steps; i++) ctx.lineTo(fx + (fw * i) / steps, fy + (i % 2 ? 6 : 0));
      for (let i = 0; i <= steps; i++) ctx.lineTo(fx + fw - (i % 2 ? 6 : 0), fy + (fh * i) / steps);
      for (let i = 0; i <= steps; i++) ctx.lineTo(fx + fw - (fw * i) / steps, fy + fh - (i % 2 ? 6 : 0));
      for (let i = 0; i <= steps; i++) ctx.lineTo(fx + (i % 2 ? 6 : 0), fy + fh - (fh * i) / steps);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8a8a88';
      ctx.lineWidth = 2;
      ctx.strokeRect(fx + 22, fy + 22, fw - 44, fh - 44);
      [[fx + 26, fy + 26], [fx + fw - 26, fy + 26], [fx + 26, fy + fh - 26], [fx + fw - 26, fy + fh - 26]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, PI * 2);
        ctx.stroke();
      });
      ctx.fillStyle = '#121214';
      ctx.fillRect(fx + 30, fy + 30, fw - 60, fh - 60);
      ctx.fillStyle = '#26262a';
      ctx.font = `bold 33px ${SCRIPT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Юрий', 64, 370);
      ctx.fillText('Стояк', 76, 414);
    },
    confetti(ctx) {
      ctx.fillStyle = '#b9cfe6';
      ctx.fillRect(0, 0, TW, TH);
      const g = rand(55);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const words = ['комиксы', 'журнал', 'видео', 'юмор'];
      for (let i = 0; i < 26; i++) {
        ctx.save();
        ctx.translate(g() * TW, g() * TH);
        ctx.rotate((g() - 0.5) * 0.8);
        ctx.fillStyle = `rgba(255,255,255,${0.35 + g() * 0.3})`;
        ctx.font = `italic bold ${16 + Math.round(g() * 18)}px ${SERIF}`;
        ctx.fillText(words[i % words.length], 0, 0);
        ctx.restore();
      }
      const cols = ['#ff4a6a', '#ffd23a', '#4ad06a', '#4a8aff', '#ff8a2a', '#c05aff', '#ffffff'];
      for (let i = 0; i < 260; i++) {
        ctx.save();
        ctx.translate(g() * TW, g() * TH);
        ctx.rotate(g() * PI);
        ctx.fillStyle = cols[Math.floor(g() * cols.length)];
        ctx.fillRect(-6, -2, 12, 4);
        ctx.restore();
      }
    }
  };

  function title(kind, bg) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      if (bg) black(ctx, w, h);
      ctx.save();
      ctx.scale(w / TW, h / TH);
      TITLES[kind](ctx);
      ctx.restore();
    };
  }

  function rims(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#141210';
    ctx.lineCap = 'round';
    ctx.lineWidth = w * 0.05;
    ctx.beginPath();
    ctx.ellipse(-w * 0.1, h * 0.55, w * 0.42, h * 0.75, 0.15, -1.2, 1.25);
    ctx.stroke();
    ctx.lineWidth = w * 0.02;
    ctx.beginPath();
    ctx.ellipse(-w * 0.02, h * 0.52, w * 0.42, h * 0.72, 0.15, -1.1, 1.1);
    ctx.stroke();
  }

  function cracks(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(121);
    ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < 22; i++) {
      const a = g() * PI * 2;
      let x = w * 0.5, y = h * 0.5;
      ctx.lineWidth = 1 + g() * 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += Math.cos(a + (g() - 0.5) * 0.8) * w * 0.09;
        y += Math.sin(a + (g() - 0.5) * 0.8) * h * 0.09;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, w * (0.08 + i * 0.09), 0, PI * 2);
      ctx.stroke();
    }
  }

  const TEX = {
    blinds(ctx, w, h) {
      const slat = h / 16;
      for (let i = 0; i < 16; i++) {
        const y = i * slat;
        const g = ctx.createLinearGradient(0, y, 0, y + slat);
        g.addColorStop(0, '#fbf1ea');
        g.addColorStop(0.55, '#efdcd2');
        g.addColorStop(0.86, '#d4b8ac');
        g.addColorStop(1, '#9a7c72');
        ctx.fillStyle = g;
        ctx.fillRect(0, y, w, slat);
      }
      ctx.fillStyle = 'rgba(120, 96, 88, 0.5)';
      [0.2, 0.8].forEach(x => ctx.fillRect(x * w - 1, 0, 2, h));
    },
    wall: K.noiseTex('#e7cfc2', 101, 0.05, 0.25),
    wallBlue: K.noiseTex('#c9cfe0', 103, 0.05, 0.25),
    painting(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#1c2c4a');
      g.addColorStop(0.55, '#4a6a92');
      g.addColorStop(0.62, '#1a2a40');
      g.addColorStop(1, '#0c1626');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 9; i++) {
        const a = 2.0 + i * 0.12;
        ctx.fillStyle = 'rgba(200, 220, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(w * 0.62, h * 0.18);
        ctx.lineTo(w * 0.62 + Math.cos(a) * w, h * 0.18 + Math.sin(a) * w);
        ctx.lineTo(w * 0.62 + Math.cos(a + 0.05) * w, h * 0.18 + Math.sin(a + 0.05) * w);
        ctx.fill();
      }
      const rg = ctx.createRadialGradient(w * 0.62, h * 0.18, 2, w * 0.62, h * 0.18, w * 0.3);
      rg.addColorStop(0, 'rgba(255,255,240,0.95)');
      rg.addColorStop(1, 'rgba(160,190,255,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      ctx.fillStyle = '#cfd8e8';
      const gg = rand(9);
      for (let i = 0; i < 60; i++) ctx.fillRect(gg() * w, h * (0.62 + gg() * 0.36), 3 + gg() * 10, 1.5);
      ctx.fillStyle = '#0a0e16';
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.66);
      ctx.lineTo(w * 0.5, h * 0.66);
      ctx.lineTo(w * 0.46, h * 0.74);
      ctx.lineTo(w * 0.26, h * 0.74);
      ctx.fill();
      ctx.fillRect(w * 0.34, h * 0.36, 2, h * 0.3);
      ctx.fillStyle = 'rgba(220,230,240,0.7)';
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.38);
      ctx.lineTo(w * 0.46, h * 0.6);
      ctx.lineTo(w * 0.35, h * 0.62);
      ctx.fill();
    },
    crt(ctx, w, h) {
      ctx.fillStyle = '#1830a8';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#d8e4ff';
      for (let i = 0; i < 9; i++) ctx.fillRect(w * 0.08, h * (0.1 + i * 0.09), w * (0.2 + ((i * 37) % 30) / 100), h * 0.035);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w * 0.55, h * 0.05, w * 0.03, h * 0.9);
      ctx.fillStyle = '#6a8aff';
      ctx.fillRect(w * 0.62, h * 0.2, w * 0.3, h * 0.04);
    },
    tvGreen(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#9ac8a0');
      g.addColorStop(1, '#2a6a3a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const gg = rand(13);
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = `rgba(${20 + gg() * 40},${90 + gg() * 80},${30 + gg() * 30},0.8)`;
        ctx.beginPath();
        ctx.arc(gg() * w, h * (0.3 + gg() * 0.7), 3 + gg() * 9, 0, PI * 2);
        ctx.fill();
      }
    },
    newspaper(ctx, w, h) {
      ctx.fillStyle = '#e4e2dc';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(w * 0.06, h * 0.06, w * 0.6, h * 0.08);
      ctx.fillStyle = '#7a7a78';
      for (let c = 0; c < 4; c++) for (let i = 0; i < 22; i++) ctx.fillRect(w * (0.06 + c * 0.235), h * (0.2 + i * 0.035), w * 0.2, h * 0.012);
      ctx.fillStyle = '#5a5a58';
      ctx.fillRect(w * 0.55, h * 0.22, w * 0.38, h * 0.26);
    },
    vhs(ctx, w, h) {
      ctx.fillStyle = '#1c1c1e';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ecebe6';
      ctx.fillRect(w * 0.06, h * 0.22, w * 0.88, h * 0.56);
      ctx.strokeStyle = '#2a3a8a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.5);
      for (let x = 0.12; x < 0.8; x += 0.04) ctx.lineTo(w * x, h * (0.46 + ((x * 97) % 1) * 0.1));
      ctx.stroke();
    },
    pizza(ctx, w, h) {
      ctx.fillStyle = '#c84a26';
      ctx.fillRect(0, 0, w, h);
      const g = rand(17);
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = ['#f0c060', '#8a2a1a', '#e8d090', '#6a8a3a'][Math.floor(g() * 4)];
        ctx.beginPath();
        ctx.arc(g() * w, g() * h, 2 + g() * 5, 0, PI * 2);
        ctx.fill();
      }
    },
    tie(ctx, w, h) {
      ctx.fillStyle = '#f0dce8';
      ctx.fillRect(0, 0, w, h);
      const g = rand(23);
      const cols = ['#d83a7a', '#7a3ab8', '#3a6ad0', '#f08ab0', '#4a1a5a', '#e8c040', '#38a0c8'];
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = cols[Math.floor(g() * cols.length)];
        ctx.strokeStyle = '#2a1030';
        ctx.lineWidth = 1;
        ctx.save();
        ctx.translate(g() * w, g() * h);
        ctx.rotate(g() * PI);
        ctx.beginPath();
        const rx = 3 + g() * 8, ry = 2 + g() * 5;
        ctx.ellipse(0, 0, rx, ry, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    },
    tartan(ctx, w, h) {
      ctx.fillStyle = '#24402e';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(10, 20, 14, 0.7)';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(i * w / 8, 0, w / 24, h);
        ctx.fillRect(0, i * h / 8, w, h / 24);
      }
      ctx.fillStyle = 'rgba(160, 200, 170, 0.35)';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(i * w / 8 + w / 16, 0, 1.5, h);
        ctx.fillRect(0, i * h / 8 + h / 16, w, 1.5);
      }
    },
    planks(ctx, w, h) {
      const g = rand(41);
      const n = 6;
      for (let i = 0; i < n; i++) {
        const y = (i * h) / n;
        ctx.fillStyle = ['#c49a64', '#cfa46c', '#b88c58', '#c89c62'][i % 4];
        ctx.fillRect(0, y, w, h / n);
        ctx.strokeStyle = 'rgba(110, 70, 34, 0.35)';
        ctx.lineWidth = 1.2;
        for (let k = 0; k < 7; k++) {
          ctx.beginPath();
          const yy = y + g() * (h / n);
          ctx.moveTo(0, yy);
          for (let x = 0; x <= w; x += 16) ctx.lineTo(x, yy + Math.sin(x * 0.03 + k) * 3);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(90, 54, 24, 0.85)';
        ctx.fillRect(0, y, w, 2.5);
        ctx.fillStyle = 'rgba(255, 230, 190, 0.35)';
        ctx.fillRect(0, y + 2.5, w, 1.5);
      }
    },
    rushnik(ctx, w, h) {
      ctx.fillStyle = '#f2efe8';
      ctx.fillRect(0, 0, w, h);
      const band = (y0) => {
        for (let x = 6; x < w - 6; x += 12) {
          ctx.fillStyle = (x / 12) % 2 < 1 ? '#a8261c' : '#1c1414';
          ctx.fillRect(x, y0, 6, 6);
          ctx.fillRect(x + 3, y0 + 6, 6, 6);
          ctx.fillStyle = '#a8261c';
          ctx.fillRect(x + 6, y0 + 12, 4, 4);
        }
      };
      band(h * 0.62);
      band(h * 0.8);
      ctx.fillStyle = '#7a2a1c';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(w * (0.2 + i * 0.15), h * 0.72, 5, 0, PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      for (let x = 0; x < w; x += 10) {
        ctx.beginPath();
        ctx.arc(x + 5, h - 6, 5, 0, PI);
        ctx.fill();
      }
    },
    calendar4(ctx, w, h) {
      ctx.fillStyle = '#f4f2ee';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(h * 0.42)}px ${SERIF}`;
      ctx.fillText('4', w / 2, h * 0.4);
      ctx.font = `bold ${Math.round(h * 0.15)}px ${SANS}`;
      ctx.fillText('июля', w / 2, h * 0.75);
    },
    calendar84(ctx, w, h) {
      ctx.fillStyle = '#c8ccd0';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w * 0.06, h * 0.08, w * 0.88, h * 0.4);
      ctx.fillStyle = '#121212';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(h * 0.2)}px ${SANS}`;
      ctx.fillText('1984', w / 2, h * 0.3);
    },
    pillow(ctx, w, h) {
      ctx.fillStyle = '#f0f0ee';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(120,130,150,0.45)';
      for (let y = 6; y < h; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < w; x += 12) ctx.fillRect(x, y, 3, 3);
    },
    map(ctx, w, h) {
      ctx.fillStyle = '#e8e2c8';
      ctx.fillRect(0, 0, w, h);
      const g = rand(61);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = ['#d6c89a', '#b8cfa0', '#c8b0a0', '#d0d0c0'][Math.floor(g() * 4)];
        ctx.fillRect(g() * w, g() * h, 8 + g() * 30, 6 + g() * 20);
      }
      ctx.strokeStyle = '#d06a3a';
      ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        ctx.moveTo(g() * w, g() * h);
        ctx.lineTo(g() * w, g() * h);
        ctx.stroke();
      }
      ctx.strokeStyle = '#6a8ac8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.7);
      ctx.bezierCurveTo(w * 0.3, h * 0.5, w * 0.6, h * 0.9, w, h * 0.6);
      ctx.stroke();
    },
    perf(ctx, w, h) {
      ctx.fillStyle = '#e4e2dc';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#4a4844';
      for (let y = 10; y < h; y += 20) for (let x = 10; x < w; x += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, PI * 2);
        ctx.fill();
      }
    },
    panel(ctx, w, h) {
      ctx.fillStyle = '#d8d6ce';
      ctx.fillRect(0, 0, w, h);
      const g = rand(71);
      for (let i = 0; i < 40; i++) {
        const x = 10 + g() * (w - 20), y = 10 + g() * (h - 20);
        ctx.fillStyle = ['#1a1a1a', '#c82020', '#2a2a2a', '#e8e8e0', '#3a6a3a'][Math.floor(g() * 5)];
        ctx.beginPath();
        ctx.arc(x, y, 3 + g() * 4, 0, PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#8a8880';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, w - 8, h - 8);
    },
    instruments(ctx, w, h) {
      ctx.fillStyle = '#b8bcbc';
      ctx.fillRect(0, 0, w, h);
      const cols = 4;
      for (let i = 0; i < cols; i++) {
        const x = (w / cols) * (i + 0.5);
        ctx.fillStyle = '#20262a';
        ctx.fillRect(x - w / cols * 0.38, h * 0.14, w / cols * 0.76, h * 0.34);
        ctx.fillStyle = '#e8402a';
        ctx.fillRect(x - 6, h * 0.24, 12, 10);
        ctx.fillStyle = '#d0d4d4';
        ctx.fillRect(x - w / cols * 0.3, h * 0.6, w / cols * 0.6, h * 0.08);
      }
    },
    dash(ctx, w, h) {
      ctx.fillStyle = '#5a5e5a';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) {
        const x = w * (0.12 + i * 0.19), y = h * 0.5, r = h * 0.3;
        ctx.fillStyle = '#16181a';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d8dcd8';
        ctx.lineWidth = 2;
        for (let k = 0; k < 9; k++) {
          const a = PI * 0.8 + (k / 8) * PI * 1.4;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7);
          ctx.lineTo(x + Math.cos(a) * r * 0.88, y + Math.sin(a) * r * 0.88);
          ctx.stroke();
        }
        ctx.strokeStyle = '#f0f0e8';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(PI * (1.1 + i * 0.13)) * r * 0.75, y + Math.sin(PI * (1.1 + i * 0.13)) * r * 0.75);
        ctx.stroke();
      }
    },
    radar(ctx, w, h) {
      const cx = w / 2, cy = h / 2, R = w * 0.5;
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, R);
      g.addColorStop(0, '#9ef0f4');
      g.addColorStop(0.7, '#3ac0d0');
      g.addColorStop(1, '#147a8c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(20, 70, 90, 0.75)';
      ctx.lineWidth = 2;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (R * i) / 5, 0, PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(230, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      const gg = rand(81);
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + (gg() - 0.5) * R * 1.4, cy + (gg() - 0.5) * R * 1.4);
        ctx.lineTo(cx + (gg() - 0.5) * R * 1.4, cy + (gg() - 0.5) * R * 1.4);
        ctx.stroke();
      }
    },
    sweep(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      for (let i = 0; i < 24; i++) {
        const a0 = -i * 0.03;
        ctx.fillStyle = `rgba(230, 255, 255, ${0.5 * (1 - i / 24)})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, w / 2, a0 - 0.03, a0);
        ctx.fill();
      }
    },
    sky(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#2aa0e8');
      g.addColorStop(0.6, '#8ad0f4');
      g.addColorStop(1, '#d8f0fc');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const gg = rand(91);
      for (let i = 0; i < 26; i++) {
        const x = gg() * w, y = h * (0.25 + gg() * 0.75), r = 20 + gg() * 50;
        const rg = ctx.createRadialGradient(x, y, 2, x, y, r);
        rg.addColorStop(0, 'rgba(255,255,255,0.95)');
        rg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.8, r, 0, 0, PI * 2);
        ctx.fill();
      }
    },
    cloud(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 4;
      const blobs = [[0.3, 0.6, 0.2], [0.5, 0.45, 0.26], [0.7, 0.6, 0.2], [0.42, 0.7, 0.18], [0.6, 0.72, 0.16]];
      ctx.beginPath();
      blobs.forEach(([x, y, r]) => {
        ctx.moveTo(x * w + r * w, y * h);
        ctx.arc(x * w, y * h, r * w, 0, PI * 2);
      });
      ctx.stroke();
      blobs.forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x * w, y * h, r * w - 2, 0, PI * 2);
        ctx.fill();
      });
    },
    tiles(ctx, w, h) {
      const n = 8;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#c8b89a' : '#8a6a4a';
        ctx.fillRect((x * w) / n, (y * h) / n, w / n, h / n);
      }
    },
    label(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#ffb81a');
      g.addColorStop(1, '#f06a10');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const cx = w * 0.5, cy = h * 0.42;
      ctx.fillStyle = '#ff8a18';
      ctx.strokeStyle = '#c84a08';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.2, 0, PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3a8a2a';
      ctx.beginPath();
      ctx.ellipse(cx + h * 0.05, cy - h * 0.22, h * 0.07, h * 0.03, -0.5, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.arc(cx + s * h * 0.06, cy - h * 0.03, h * 0.035, 0, PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#1a1a1a';
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.arc(cx + s * h * 0.06, cy - h * 0.025, h * 0.018, 0, PI * 2);
        ctx.fill();
      });
      ctx.strokeStyle = '#7a1a08';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy + h * 0.04, h * 0.08, 0.2, PI - 0.2);
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, h * 0.78);
      ctx.rotate(-0.12);
      ctx.font = `bold ${Math.round(h * 0.14)}px ${PRINT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#2a6a1a';
      ctx.strokeText('Живунчик', 0, 0);
      ctx.fillStyle = '#ffe84a';
      ctx.fillText('Живунчик', 0, 0);
      ctx.restore();
      ctx.fillStyle = '#2a6a1a';
      ctx.font = `bold ${Math.round(h * 0.05)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText('с соком апельсина', cx, h * 0.92);
    },
    eye(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.48, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0c0c0c';
      ctx.beginPath();
      ctx.ellipse(w * 0.55, h * 0.5, w * 0.16, h * 0.22, 0, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w * 0.6, h * 0.42, w * 0.05, 0, PI * 2);
      ctx.fill();
    },
    studio(ctx, w, h) {
      ctx.fillStyle = '#5a5248';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#2a2622';
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo((i * w) / 12, 0);
        ctx.lineTo((i * w) / 12, h);
        ctx.stroke();
      }
    },
    dirt(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#f8fbfc');
      g.addColorStop(1, '#d8e4e8');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      const gg = rand(111);
      for (let i = 0; i < 30; i++) {
        ctx.lineWidth = 1 + gg() * 3;
        ctx.beginPath();
        ctx.moveTo(gg() * w, gg() * h);
        ctx.lineTo(gg() * w, gg() * h);
        ctx.stroke();
      }
    }
  };

  window.KalamArt = { TW, TH, TITLES, TEX, title, bug, watermark, black, rims, cracks, SERIF, SANS, SCRIPT, PRINT };
})();
