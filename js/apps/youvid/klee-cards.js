(function () {
  const PI = Math.PI;
  const INK = '#1e1e2a';
  const RED = '#9c1424';
  const FONT = '"Georgia", "Times New Roman", serif';

  const BAND = [0.14, 0.865];

  const D = (text) => [text, INK];
  const R = (text) => [text, RED];

  const CARDS = [
    { t0: 4.57, t1: 5.13, lines: [{ runs: [D('ЛЕГЕНДАРНАЯ ДЕВОЧКА В '), R('КРАСНОМ')], w: 0.7, y: 0.5 }] },
    { t0: 5.13, t1: 5.8, lines: [{ runs: [D('В ГОРАХ БУРЕВЕСТНИКА')], w: 0.6, y: 0.5 }] },
    { t0: 5.8, t1: 6.43, lines: [{ runs: [D('ПРЫГ-СКОК ✤ ВЗРЫВНОЕ ВЕСЕЛЬЕ')], w: 0.66, y: 0.5 }] },
    { t0: 6.43, t1: 7.13, lines: [{ runs: [D('НЕУДЕРЖИМАЯ')], w: 0.48, y: 0.5 }] },
    { t0: 7.13, t1: 7.5, lines: [{ runs: [R('СОЛНЫШКО')], w: 0.64, y: 0.5, big: true }] },
    { t0: 7.5, t1: 7.83, lines: [{ runs: [D('ТЫ ЗНАЕШЬ')], w: 0.36, y: 0.5 }] },
    { t0: 7.83, t1: 8.5, lines: [{ runs: [D('ОГНЕННАЯ ДЕВОЧКА В '), R('КРАСНОМ')], w: 0.66, y: 0.5 }] },
    { t0: 8.5, t1: 9.2, lines: [{ runs: [D('ОДИНОЧНАЯ КАМЕРА')], w: 0.5, y: 0.5 }] },
    { t0: 9.2, t1: 9.9, lines: [{ runs: [D('ЭТО ТОГО СТОИТ ✤ РЫБКА ТАКААА ВКУСНАЯ!')], w: 0.86, y: 0.5 }] },
    { t0: 9.9, t1: 10.5, lines: [{ runs: [R('САМЫЙ СИЛЬНЫЙ'), D(' ВОИН МОНДШТАДТА')], w: 0.92, y: 0.5 }] },
    {
      t0: 10.5,
      t1: 11.1,
      lines: [
        { runs: [D('ТОРНАДО')], w: 0.1, y: 0.4, x: 0.3 },
        { runs: [D('НУ НАВЕРНОЕ')], w: 0.1, y: 0.43, x: 0.32 },
        { runs: [R('САМЫЙ СИЛЬНЫЙ'), D(' ВОИН МОНДШТАДТА')], w: 0.86, y: 0.5 },
        { runs: [D('А Я БЫ ВЫБРАЛ '), R('МАСТЕР'), D(' БЛАГОСЛОВЕННАЯ ПРИНЦЕССА')], w: 0.6, y: 0.545 }
      ]
    },
    {
      t0: 11.1,
      t1: 11.8,
      lines: [
        { runs: [D('ТОРНАДО')], w: 0.1, y: 0.39, x: 0.3 },
        { runs: [D('НУ НАВЕРНОЕ')], w: 0.1, y: 0.42, x: 0.32 },
        { runs: [D('НОЭЛЛЬ')], w: 0.1, y: 0.455, x: 0.26 },
        { runs: [D('ОДИНОЧНАЯ КАМЕРА')], w: 0.38, y: 0.455, x: 0.52 },
        { runs: [R('САМЫЙ СИЛЬНЫЙ'), D(' ВОИН МОНДШТАДТА')], w: 0.86, y: 0.5 },
        { runs: [D('А Я БЫ ВЫБРАЛ '), R('МАСТЕР'), D(' БЛАГОСЛОВЕННАЯ ПРИНЦЕССА')], w: 0.6, y: 0.545 },
        { runs: [D('ДИЛЮК')], w: 0.08, y: 0.575, x: 0.3 },
        { runs: [D('ПОТОК')], w: 0.1, y: 0.585, x: 0.58 },
        { runs: [D('ОСУЖДЕНИЯ')], w: 0.14, y: 0.62, x: 0.6 }
      ]
    },
    {
      t0: 11.8,
      t1: 12.6,
      lines: [
        { runs: [D('「Лупикал」')], w: 0.1, y: 0.26, x: 0.26 },
        { runs: [D('ЭТО')], w: 0.26, y: 0.52, huge: true }
      ]
    },
    {
      t0: 12.6,
      t1: 13.3,
      lines: [
        { runs: [D('ДОЛЖНО')], w: 0.62, y: 0.4, huge: true, split: true },
        { runs: [D('БЫТЬ')], w: 0.3, y: 0.66, huge: true, split: true }
      ]
    },
    { t0: 13.3, t1: 14.23, lines: [{ runs: [D('ВЫБОР СУДЬБЫ')], w: 0.88, y: 0.5, heavy: true }] }
  ];

  function measure(ctx, runs, size, spacing) {
    ctx.font = `700 ${size}px ${FONT}`;
    ctx.letterSpacing = `${spacing}px`;
    return runs.reduce((sum, [text]) => sum + ctx.measureText(text).width, 0);
  }

  function drawLine(ctx, W, H, line) {
    const target = line.w * W;
    let size = 40;
    const spacing = line.huge ? 0 : 0.06;
    let width = measure(ctx, line.runs, size, size * spacing);
    size = size * target / width;
    width = measure(ctx, line.runs, size, size * spacing);
    const cx = line.x !== undefined ? line.x * W : W / 2;
    let x = line.x !== undefined ? cx : cx - width / 2;
    const y = H * line.y;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const passes = line.split ? [['rgba(220,40,60,0.55)', -2], ['rgba(40,140,230,0.55)', 2]] : [];
    passes.forEach(([col, dx]) => {
      let px = x + dx;
      line.runs.forEach(([text]) => {
        ctx.fillStyle = col;
        ctx.fillText(text, px, y);
        px += ctx.measureText(text).width;
      });
    });
    line.runs.forEach(([text, col]) => {
      ctx.fillStyle = col;
      ctx.fillText(text, x, y);
      x += ctx.measureText(text).width;
    });
  }

  function drawCard(card) {
    return (ctx, W, H) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);
      const y0 = H * BAND[0], y1 = H * BAND[1];
      const gr = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, W * 0.62);
      gr.addColorStop(0, '#fdfdfd');
      gr.addColorStop(0.7, '#f4f4f6');
      gr.addColorStop(1, '#e2e2e8');
      ctx.fillStyle = gr;
      ctx.fillRect(0, y0, W, y1 - y0);
      card.lines.forEach(line => drawLine(ctx, W, H, line));
    };
  }

  function cardAt(t) {
    for (let i = 0; i < CARDS.length; i++) if (t >= CARDS[i].t0 && t < CARDS[i].t1) return i;
    return -1;
  }

  function rays(ctx, W, H) {
    ctx.fillStyle = '#fdf8f4';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120,110,110,0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * PI * 2;
      const r0 = H * (0.26 + (i % 2) * 0.12), r1 = H * 1.2;
      ctx.moveTo(W / 2 + Math.cos(a) * r0 * 1.6, H / 2 + Math.sin(a) * r0);
      ctx.lineTo(W / 2 + Math.cos(a) * r1 * 1.6, H / 2 + Math.sin(a) * r1);
    }
    ctx.stroke();
  }

  function drawComic(ctx, W, H) {
    rays(ctx, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.fillStyle = '#f4a21c';
    ctx.strokeStyle = '#fff0c0';
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * PI * 2;
      const r = (i % 2 ? 0.26 : 0.82) * H * (i % 4 === 0 ? 1.0 : 0.88);
      const x = Math.cos(a) * r * 1.15, y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2a1008';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2 + 0.3;
      const r = (i % 2 ? 0.07 : 0.2) * H;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    const rg = ctx.createRadialGradient(-H * 0.05, -H * 0.05, 0, 0, 0, H * 0.26);
    rg.addColorStop(0, '#ff6a4a');
    rg.addColorStop(1, '#b01c18');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.ellipse(0, H * 0.02, H * 0.2, H * 0.24, -0.4, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function disc(color) {
    return (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W / 2 - 1, 0, PI * 2);
      ctx.fill();
    };
  }

  function seal(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2);
    const R0 = Math.min(W, H) * 0.47;
    ctx.fillStyle = '#c4452c';
    ctx.beginPath();
    for (let i = 0; i < 44; i++) {
      const a = (i / 44) * PI * 2;
      const r = i % 2 ? R0 * 0.92 : R0;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fdf9f6';
    ctx.beginPath();
    ctx.arc(0, 0, R0 * 0.84, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c4452c';
    ctx.lineWidth = Math.max(2, R0 * 0.014);
    ctx.beginPath();
    ctx.arc(0, 0, R0 * 0.78, 0, PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#c4452c';
    ctx.font = `700 ${R0 * 0.62}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Кли', 0, R0 * 0.04);
  }

  function nameText(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#c4452c';
    ctx.font = `700 ${H * 0.27}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Кли', W / 2, H * 0.52);
  }

  function labels(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    const bar = (x, w, text) => {
      ctx.fillStyle = '#b8323a';
      ctx.fillRect(x, H * 0.3, w, H * 0.4);
      ctx.fillStyle = '#fdf6f2';
      ctx.font = `700 ${H * 0.2}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + w / 2, H * 0.52);
    };
    bar(0, W * 0.64, 'Ускользающее');
    bar(W * 0.68, W * 0.32, 'Солнце');
  }

  function frameTex(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#c4452c';
    const m = W * 0.02;
    ctx.lineWidth = W * 0.0035;
    ctx.strokeRect(m, m * 1.7, W - m * 2, H - m * 3.4);
    ctx.lineWidth = W * 0.0025;
    ctx.strokeRect(m * 2.6, m * 3.2, W - m * 5.2, H - m * 6.4);
    ctx.fillStyle = '#c4452c';
    [[m, m * 1.7], [W - m, m * 1.7], [m, H - m * 1.7], [W - m, H - m * 1.7]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y - m * 0.8);
      ctx.lineTo(x + m * 0.2, y - m * 0.2);
      ctx.lineTo(x + m * 0.8, y);
      ctx.lineTo(x + m * 0.2, y + m * 0.2);
      ctx.lineTo(x, y + m * 0.8);
      ctx.lineTo(x - m * 0.2, y + m * 0.2);
      ctx.lineTo(x - m * 0.8, y);
      ctx.lineTo(x - m * 0.2, y - m * 0.2);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = '#fdf9f6';
    ctx.fillRect(W * 0.36, H - m * 3.4 - 2, W * 0.28, m * 3.6);
    for (let i = 0; i < 7; i++) {
      const x = W * (0.385 + i * 0.038), y = H - m * 1.6;
      ctx.fillStyle = '#c4452c';
      ctx.beginPath();
      ctx.ellipse(x, y, W * 0.009, W * 0.012, 0, 0, PI * 2);
      ctx.fill();
    }
  }

  function sigil(variant) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(30,30,34,0.85)';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.46, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d6c8a0';
      ctx.lineWidth = w * 0.035;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.44, 0, PI * 2);
      ctx.stroke();
      ctx.lineWidth = w * 0.022;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.3, 0.4 + variant, PI * 1.7 + variant);
      ctx.stroke();
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(variant * 0.9 - 0.4);
      ctx.fillStyle = '#efe6c8';
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, w * 0.2);
      ctx.lineTo(0, -w * 0.2);
      ctx.lineTo(w * 0.06, -w * 0.08);
      ctx.lineTo(w * 0.22, -w * 0.16);
      ctx.lineTo(w * 0.12, w * 0.02);
      ctx.lineTo(w * 0.24, w * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
  }

  function comicDumpty(ctx, x, y, R) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#6a1a10';
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.ellipse(s * R * 0.78, -R * 0.62, R * 0.26, R * 0.4, s * 0.7, 0, PI * 2);
      ctx.fill();
    });
    const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R * 1.05);
    g.addColorStop(0, '#ff7a52');
    g.addColorStop(0.6, '#c8321e');
    g.addColorStop(1, '#7a1408');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 1.05, R * 0.92, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6e6c8';
    ctx.beginPath();
    ctx.ellipse(0, R * 0.18, R * 0.62, R * 0.42, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a0c06';
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.ellipse(s * R * 0.24, R * 0.08, R * 0.08, R * 0.12, 0, 0, PI * 2);
      ctx.fill();
    });
    ctx.lineWidth = R * 0.06;
    ctx.strokeStyle = '#2a0c06';
    ctx.beginPath();
    ctx.arc(0, R * 0.26, R * 0.14, 0.2, PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function comicWord(ctx, text, x, y, size, skew) {
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, 0, skew, 1, 0, 0);
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = '#fdf2e6';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = '#c4452c';
    ctx.fillText(text, 0, 0);
    ctx.lineWidth = size * 0.03;
    ctx.strokeStyle = '#7a1c12';
    ctx.strokeText(text, 0, 0);
    ctx.restore();
  }

  function drawComicText(ctx, W, H) {
    rays(ctx, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.fillStyle = '#ffe23a';
    [[-0.95, -0.3, 0.5], [0.9, 0.2, -0.45], [-0.6, 0.55, 0.3], [0.7, -0.6, -0.2]].forEach(([x, y, a]) => {
      ctx.save();
      ctx.translate(x * W * 0.5, y * H * 0.5);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(-W * 0.32, -H * 0.03);
      ctx.quadraticCurveTo(0, -H * 0.16, W * 0.32, -H * 0.02);
      ctx.quadraticCurveTo(0, H * 0.06, -W * 0.32, -H * 0.03);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
    comicWord(ctx, 'ПРЫГ', W * 0.5, H * 0.17, H * 0.36, -0.12);
    comicWord(ctx, 'СКОК', W * 0.5, H * 0.84, H * 0.38, 0.1);
    comicDumpty(ctx, W * 0.5, H * 0.5, H * 0.17);
  }

  function iris(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#c4452c';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * 0.48, 0, PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#fdf2e6';
    ctx.lineWidth = W * 0.008;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * 0.465, 0, PI * 2);
    ctx.stroke();
  }

  function hsrLogo(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    const serif = 'Georgia, "Times New Roman", serif';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    const layered = (text, x, y, fill) => {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillText(text, x + H * 0.018, y + H * 0.018);
      ctx.fillStyle = '#4a3410';
      ctx.fillText(text, x + H * 0.008, y + H * 0.008);
      ctx.fillStyle = fill;
      ctx.fillText(text, x, y);
    };
    ctx.font = `bold ${H * 0.3}px ${serif}`;
    const honkaiW = ctx.measureText('HONKAI').width;
    const gold = ctx.createLinearGradient(0, H * 0.12, 0, H * 0.42);
    gold.addColorStop(0, '#fff4c8');
    gold.addColorStop(0.55, '#e8d098');
    gold.addColorStop(1, '#b8904a');
    layered('HONKAI', (W - honkaiW) / 2, H * 0.4, gold);
    ctx.font = `bold ${H * 0.2}px ${serif}`;
    const starW = ctx.measureText('STAR RAIL').width;
    ctx.font = `bold ${H * 0.26}px ${serif}`;
    const nineW = ctx.measureText('98').width;
    const gap = H * 0.05;
    const x0 = (W - starW - gap - nineW) / 2;
    ctx.font = `bold ${H * 0.2}px ${serif}`;
    layered('STAR RAIL', x0, H * 0.68, '#ffffff');
    ctx.font = `bold ${H * 0.26}px ${serif}`;
    const orange = ctx.createLinearGradient(0, H * 0.46, 0, H * 0.7);
    orange.addColorStop(0, '#ffd890');
    orange.addColorStop(1, '#ff9a20');
    layered('98', x0 + starW + gap, H * 0.7, orange);
    ctx.font = `${H * 0.075}px Tahoma, Verdana, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#b8c4ea';
    ctx.fillText('Издание «Ярило-VI» · PC CD-ROM', W / 2, H * 0.9);
  }

  window.KleeCards = { BAND, CARDS, cardAt, drawCard, drawComic, drawComicText, disc, seal, nameText, labels, frameTex, sigil, iris, hsrLogo };
})();
