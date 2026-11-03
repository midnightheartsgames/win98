(function () {
  const { rand } = window.P3D;
  const PI = Math.PI;

  function speck(ctx, w, h, g, n, cols, size) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = cols[Math.floor(g() * cols.length)];
      const s = (size || 1) * (0.6 + g() * 1.4);
      ctx.fillRect(g() * w, g() * h, s, s);
    }
  }

  function blob(ctx, x, y, r, g, k) {
    const n = 10;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * PI * 2;
      const rr = r * (1 - (k || 0.35) / 2 + g() * (k || 0.35));
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function granite(ctx, w, h) {
    const g = rand(11);
    ctx.fillStyle = '#18191c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${40 + g() * 20}, ${40 + g() * 20}, ${44 + g() * 20}, 0.35)`;
      blob(ctx, g() * w, g() * h, 10 + g() * 30, g, 0.6);
    }
    speck(ctx, w, h, g, w * h * 0.022, ['#b8b8bc', '#8a8a90', '#5c5c62', '#e0e0e4', '#6a6a70'], w / 512);
  }

  function graniteInner(ctx, w, h) {
    const g = rand(12);
    ctx.fillStyle = '#202125';
    ctx.fillRect(0, 0, w, h);
    speck(ctx, w, h, g, w * h * 0.045, ['#c4c4c8', '#9a9aa0', '#6a6a70', '#e4e4e6', '#808086', '#4a4a50'], w / 512);
  }

  const GLASS = { x0: -0.2, x1: 0.46, z0: -0.42, z1: 0.26 };
  const ZONES = [
    { x: 0.0, z: 0.0, r: [0.085, 0.112] },
    { x: -0.045, z: -0.26, r: [0.07, 0.095] },
    { x: 0.3, z: -0.23, r: [0.08, 0.108] },
    { x: 0.32, z: 0.014, r: [0.07, 0.095] }
  ];

  function glass(ctx, w, h) {
    const g = rand(21);
    ctx.fillStyle = '#0c0c0e';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(150, 150, 160, ${0.02 + g() * 0.04})`;
      blob(ctx, g() * w, g() * h, 6 + g() * 28, g, 0.8);
    }
    ctx.strokeStyle = 'rgba(200, 200, 210, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const x = g() * w, y = g() * h, a = g() * PI;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 40 * g(), y + Math.sin(a) * 40 * g());
      ctx.stroke();
    }
    const u = (x) => (x - GLASS.x0) / (GLASS.x1 - GLASS.x0) * w;
    const v = (z) => (z - GLASS.z0) / (GLASS.z1 - GLASS.z0) * h;
    ctx.strokeStyle = 'rgba(214, 214, 220, 0.75)';
    ctx.lineWidth = Math.max(1.5, w / 600);
    ZONES.forEach(zn => zn.r.forEach(r => {
      ctx.beginPath();
      ctx.ellipse(u(zn.x), v(zn.z), r / (GLASS.x1 - GLASS.x0) * w, r / (GLASS.z1 - GLASS.z0) * h, 0, 0, PI * 2);
      ctx.stroke();
    }));
    ctx.fillStyle = 'rgba(214, 60, 60, 0.85)';
    ctx.fillRect(u(0.18), v(0.06), w * 0.006, h * 0.006);
    ctx.fillRect(u(0.42), v(-0.07), w * 0.006, h * 0.006);
    ctx.strokeStyle = 'rgba(200, 200, 210, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(u(0.16), v(0.12), w * 0.03, h * 0.05);
  }

  function reflection(ctx, w, h) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    ctx.filter = `blur(${Math.round(w * 0.02)}px)`;
    for (let i = 0; i < 14; i++) {
      const k = i / 13;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + 0.85 * Math.sin(k * PI)})`;
      ctx.lineWidth = w * 0.018;
      ctx.beginPath();
      ctx.arc(cx, cy, w * (0.28 + k * 0.1), PI * 0.05, PI * 0.95);
      ctx.stroke();
    }
    ctx.filter = 'none';
  }

  function wood(base, grain, seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        ctx.strokeStyle = grain.replace('A', (0.05 + g() * 0.12).toFixed(3));
        ctx.lineWidth = 1 + g() * 2.5;
        const y = g() * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += w / 16) ctx.lineTo(x, y + Math.sin(x / w * 6 + i) * h * 0.012 + (g() - 0.5) * 2);
        ctx.stroke();
      }
    };
  }

  function felt(base, light, dark, seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < w * h * 0.06; i++) {
        const x = g() * w, y = g() * h, a = g() * PI, l = 1 + g() * 3;
        ctx.strokeStyle = g() < 0.5 ? light : dark;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
        ctx.stroke();
      }
    };
  }

  function foodBase(base, seed, layers) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      layers.forEach(([n, r0, r1, cols, k]) => {
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = cols[Math.floor(g() * cols.length)];
          blob(ctx, g() * w, g() * h, (r0 + g() * (r1 - r0)) * w / 256, g, k);
        }
      });
    };
  }

  const sauce = foodBase('#b4461c', 31, [
    [120, 4, 14, ['rgba(160, 56, 20, 0.55)', 'rgba(204, 96, 40, 0.5)'], 0.7],
    [90, 3, 9, ['#7a5a48', '#6a4e3e', '#8e6a54'], 0.8],
    [70, 2, 6, ['#d6a47a', '#e2b892', '#c8946a'], 0.8],
    [40, 1, 3, ['rgba(255, 210, 150, 0.6)'], 0.3]
  ]);
  const mash = foodBase('#b1501c', 32, [
    [160, 3, 10, ['rgba(160, 60, 20, 0.6)', 'rgba(214, 110, 50, 0.5)'], 0.7],
    [260, 1.5, 4, ['#d39a64', '#c08050', '#8a5a3c', '#6e4a34'], 0.9],
    [60, 1, 2.5, ['rgba(255, 220, 170, 0.7)'], 0.3]
  ]);
  const broth = foodBase('#9a6436', 33, [
    [90, 6, 18, ['rgba(120, 76, 40, 0.5)', 'rgba(176, 116, 60, 0.45)'], 0.8],
    [120, 2, 6, ['#c08a56', '#7a5434', '#d8a876'], 0.9],
    [70, 1.5, 4, ['rgba(255, 200, 120, 0.55)'], 0.4]
  ]);
  const soup = foodBase('#cc5a26', 34, [
    [60, 14, 34, ['rgba(214, 104, 44, 0.45)', 'rgba(186, 74, 30, 0.4)', 'rgba(222, 120, 60, 0.35)'], 0.9],
    [70, 2, 6, ['rgba(236, 170, 120, 0.75)', 'rgba(220, 150, 100, 0.7)', 'rgba(150, 70, 40, 0.6)'], 0.9],
    [18, 1, 2, ['#4a6a30', '#5a7a3a'], 0.4],
    [40, 1, 2.2, ['rgba(255, 220, 180, 0.55)'], 0.3]
  ]);
  const potatoSoup = foodBase('#c2702e', 35, [
    [90, 8, 22, ['rgba(214, 124, 54, 0.5)', 'rgba(170, 86, 36, 0.45)'], 0.9],
    [260, 1.5, 5, ['rgba(222, 160, 104, 0.8)', 'rgba(168, 104, 60, 0.75)', 'rgba(236, 184, 128, 0.7)', 'rgba(122, 80, 50, 0.7)'], 0.95],
    [14, 1, 2, ['#4a6a30'], 0.4]
  ]);
  const creamy = foodBase('#ecd4a0', 36, [
    [80, 10, 30, ['rgba(250, 240, 214, 0.6)', 'rgba(226, 170, 96, 0.4)', 'rgba(244, 228, 190, 0.55)'], 0.9],
    [90, 2, 6, ['rgba(214, 150, 84, 0.6)', 'rgba(230, 176, 110, 0.6)'], 0.9],
    [8, 1.5, 2.5, ['#3a2a1e'], 0.5]
  ]);
  const redPaste = foodBase('#c62c18', 37, [
    [70, 10, 30, ['rgba(150, 26, 14, 0.45)', 'rgba(222, 62, 34, 0.5)'], 0.9],
    [60, 3, 9, ['rgba(240, 96, 62, 0.6)', 'rgba(255, 136, 100, 0.45)'], 0.6],
    [30, 2, 4, ['rgba(255, 196, 176, 0.75)'], 0.3]
  ]);
  const oil = foodBase('#7a5a2c', 38, [
    [80, 6, 20, ['rgba(150, 112, 56, 0.6)', 'rgba(96, 70, 34, 0.6)'], 0.9],
    [50, 1.5, 4, ['rgba(255, 230, 170, 0.6)'], 0.3]
  ]);
  const water = foodBase('#1e2023', 39, [
    [60, 10, 30, ['rgba(70, 72, 80, 0.35)', 'rgba(30, 32, 36, 0.4)'], 0.9],
    [120, 2, 7, ['rgba(220, 224, 230, 0.5)', 'rgba(255, 255, 255, 0.35)'], 0.2]
  ]);

  function bubbles(ctx, w, h) {
    const g = rand(40);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) {
      const x = g() * w, y = g() * h, r = (0.6 + g() * 2.2) * w / 256;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + g() * 0.5})`;
      ctx.lineWidth = Math.max(1, r * 0.4);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, PI * 2);
      ctx.stroke();
    }
  }

  function lumps(ctx, w, h) {
    const g = rand(41);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = g() * w, y = g() * h, r = (6 + g() * 16) * w / 256;
      ctx.fillStyle = ['#8c1a10', '#a2241a', '#7a140c'][Math.floor(g() * 3)];
      blob(ctx, x, y, r, g, 0.5);
      ctx.fillStyle = 'rgba(255, 110, 80, 0.8)';
      blob(ctx, x - r * 0.25, y - r * 0.3, r * 0.28, g, 0.4);
    }
  }

  function noodles(ctx, w, h) {
    const g = rand(42);
    ctx.fillStyle = '#d8b276';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 220; i++) {
      ctx.strokeStyle = ['#b88e56', '#e8c890', '#c8a066', '#f0d6a0'][Math.floor(g() * 4)];
      ctx.lineWidth = 1.5 + g() * 1.5;
      const y = g() * h, x0 = g() * w;
      ctx.beginPath();
      for (let k = 0; k < 9; k++) {
        const x = x0 + k * 6, yy = y + Math.sin(k * 1.6 + i) * 4;
        if (k === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }

  function seasoning(ctx, w, h) {
    const g = rand(43);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = ['#6a1a10', '#3a5a20', '#8a2a14', '#2a2a1a', '#5a7a2a'][Math.floor(g() * 5)];
      const r = (1 + g() * 2.5) * w / 256;
      const a = g() * PI * 2, d = Math.sqrt(g()) * w * 0.42;
      ctx.fillRect(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d * 0.8, r, r);
    }
  }

  function onion(ctx, w, h) {
    const g = rand(44);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 420; i++) {
      const a = g() * PI * 2, d = Math.sqrt(g()) * w * 0.44;
      const x = w / 2 + Math.cos(a) * d, y = h / 2 + Math.sin(a) * d;
      ctx.fillStyle = ['#efe8d4', '#e4dcc0', '#f8f4e8', '#d8ceb0'][Math.floor(g() * 4)];
      const s = (3 + g() * 4) * w / 256;
      ctx.fillRect(x - s / 2, y - s / 2, s, s * (0.6 + g() * 0.6));
    }
  }

  function spill(ctx, w, h) {
    const g = rand(45);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(70, 40, 24, 1)';
    blob(ctx, w * 0.45, h * 0.5, w * 0.24, g, 0.5);
    blob(ctx, w * 0.62, h * 0.42, w * 0.14, g, 0.6);
    for (let i = 0; i < 30; i++) blob(ctx, w * (0.2 + g() * 0.6), h * (0.2 + g() * 0.6), w * (0.01 + g() * 0.03), g, 0.5);
    ctx.fillStyle = '#c8621e';
    for (let i = 0; i < 12; i++) blob(ctx, w * (0.35 + g() * 0.3), h * (0.38 + g() * 0.24), w * (0.008 + g() * 0.02), g, 0.5);
  }

  function splatter(ctx, w, h) {
    const g = rand(46);
    ctx.fillStyle = '#eeeeea';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = ['#b8281a', '#c84a2a', '#8a1a10', '#d8704a'][Math.floor(g() * 4)];
      blob(ctx, g() * w, g() * h, (0.8 + g() * g() * 7) * w / 256, g, 0.6);
    }
  }

  function text(ctx, str, x, y, font, fill, align, stroke) {
    ctx.font = font;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    if (stroke) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke[0];
      ctx.lineWidth = stroke[1];
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = fill;
    ctx.fillText(str, x, y);
  }

  function scaled(W, H, draw) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / W, h / H);
      draw(ctx, W, H);
      ctx.restore();
    };
  }

  const canNatural = scaled(1024, 256, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#f0c040');
    gr.addColorStop(0.55, '#f4cc52');
    gr.addColorStop(1, '#e0aa30');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a6ec8';
    ctx.fillRect(0, h * 0.74, w, h * 0.2);
    for (let k = 0; k < 2; k++) {
      const x = 120 + k * 512;
      text(ctx, '7', x - 70, h * 0.24, 'bold 80px Georgia, serif', '#d42a2a', 'center');
      text(ctx, 'Заливов', x + 40, h * 0.27, 'italic bold 70px Georgia, serif', '#4a3a98', 'center');
      text(ctx, 'САЙРА', x + 10, h * 0.55, 'bold 104px Arial, sans-serif', '#d42a26', 'center');
      text(ctx, 'НАТУРАЛЬНАЯ', x + 10, h * 0.84, 'bold 40px Arial, sans-serif', '#ffffff', 'center');
    }
    ctx.fillStyle = 'rgba(180, 190, 210, 0.9)';
    ctx.fillRect(w * 0.42, h * 0.3, 80, 100);
  });

  const canTomato = scaled(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e8b83a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a64b8';
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
    for (let k = 0; k < 2; k++) {
      const x = 60 + k * 512;
      ctx.fillStyle = '#d42a26';
      ctx.fillRect(x - 40, h * 0.12, 300, h * 0.42);
      text(ctx, 'САЙРА', x + 110, h * 0.33, 'bold 92px Arial, sans-serif', '#ffffff', 'center');
      text(ctx, 'в томатном', x + 60, h * 0.64, 'italic 38px Georgia, serif', '#1a3a7a', 'center');
      text(ctx, 'соусе', x + 60, h * 0.76, 'italic 38px Georgia, serif', '#1a3a7a', 'center');
      ctx.fillStyle = '#d02818';
      ctx.beginPath();
      ctx.arc(x + 330, h * 0.6, 46, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a8a2a';
      ctx.fillRect(x + 318, h * 0.38, 24, 14);
    }
  });

  const canVlad = scaled(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e8eef6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2858b4';
    ctx.fillRect(0, h * 0.08, w, h * 0.5);
    ctx.fillStyle = '#d0201c';
    ctx.fillRect(0, h * 0.66, w, h * 0.28);
    for (let k = 0; k < 2; k++) {
      const x = 260 + k * 512;
      text(ctx, 'тихоокеанская', x, h * 0.18, 'bold 32px Arial, sans-serif', '#ffffff', 'center');
      text(ctx, 'Сайра', x, h * 0.4, 'italic bold 96px Georgia, serif', '#ffffff', 'center');
      text(ctx, 'в томатном соусе', x, h * 0.8, 'bold 40px Arial, sans-serif', '#ffffff', 'center');
    }
  });

  const lidTex = (ctx, w, h) => {
    const gr = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, '#d8dade');
    gr.addColorStop(0.7, '#b8bcc2');
    gr.addColorStop(0.86, '#e4e6ea');
    gr.addColorStop(0.94, '#9a9ea4');
    gr.addColorStop(1, '#c8ccd2');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(120, 124, 130, 0.6)';
    ctx.lineWidth = w * 0.01;
    [0.3, 0.38].forEach(r => { ctx.beginPath(); ctx.arc(w / 2, h / 2, w * r, 0, PI * 2); ctx.stroke(); });
  };

  const jarSauce = scaled(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b8241a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2e2b4';
    ctx.fillRect(0, h * 0.2, w, h * 0.6);
    for (let k = 0; k < 2; k++) {
      const x = 128 + k * 256;
      text(ctx, 'ТОМАТНЫЙ', x, h * 0.36, 'bold 34px Arial, sans-serif', '#b8241a', 'center');
      text(ctx, 'соус', x, h * 0.58, 'italic bold 40px Georgia, serif', '#3a6a1a', 'center');
      ctx.fillStyle = '#d43020';
      ctx.beginPath();
      ctx.arc(x, h * 0.74, 16, 0, PI * 2);
      ctx.fill();
    }
  });

  const jarPaste = scaled(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2a1614';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8e4dc';
    ctx.fillRect(w * 0.08, h * 0.18, w * 0.2, h * 0.5);
    const g = rand(47);
    ctx.fillStyle = '#1a1a1a';
    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if (g() < 0.5) ctx.fillRect(w * 0.1 + x * 9, h * 0.24 + y * 12, 9, 12);
    text(ctx, 'ТОМАТНАЯ ПАСТА', w * 0.62, h * 0.4, 'bold 30px Arial, sans-serif', '#e8d8c8', 'center');
    text(ctx, '25%', w * 0.62, h * 0.62, 'bold 44px Arial, sans-serif', '#d8402a', 'center');
  });

  const mayo = scaled(512, 768, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#2e8a3a');
    gr.addColorStop(1, '#1e6a2a');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e83a2a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(130, 0);
    ctx.lineTo(0, 130);
    ctx.fill();
    text(ctx, 'ВЫБОР', 42, 34, 'bold 22px Arial, sans-serif', '#ffffff', 'center');
    text(ctx, 'ХОЗЯЙКИ', 40, 58, 'bold 18px Arial, sans-serif', '#ffffff', 'center');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(70, 170, 372, 84);
    text(ctx, 'РАЗДОЛЬЕ', 256, 212, 'bold 62px Georgia, serif', '#1e6a2a', 'center');
    text(ctx, 'МАЙОНЕЗ 67%', 256, 296, 'bold 34px Arial, sans-serif', '#f4f0d0', 'center');
    text(ctx, 'ОЛИВКОВЫЙ', 256, 384, 'bold 76px Arial, sans-serif', '#ffffff', 'center');
    text(ctx, 'НАТУРАЛЬНЫЙ ПРОДУКТ', 256, 450, 'bold 28px Arial, sans-serif', '#e8f0c8', 'center');
    ctx.strokeStyle = '#8ab83a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(120, 640);
    ctx.quadraticCurveTo(260, 520, 420, 560);
    ctx.stroke();
    ctx.fillStyle = '#5a7a1a';
    [[180, 600], [250, 560], [330, 548], [400, 556]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 26, 12, -0.5, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = '#3a4a18';
    [[300, 600], [370, 610]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 18, 22, 0, 0, PI * 2); ctx.fill(); });
  });

  const noodleLid = scaled(512, 384, (ctx, w, h) => {
    ctx.fillStyle = '#f4f2e8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3aa24a';
    ctx.fillRect(0, 0, w, 70);
    ctx.fillRect(0, h - 60, w, 60);
    text(ctx, 'ЛАПШАК', w / 2, 36, 'bold 54px Arial, sans-serif', '#f8e83a', 'center', ['#c82a1a', 8]);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.52, 150, 90, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0a050';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.5, 126, 70, 0, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f4d8a0';
    ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(w / 2 - 60 + i * 15, h * 0.5, 30, 0.2, 2.6);
      ctx.stroke();
    }
    ctx.fillStyle = '#c8401a';
    ctx.fillRect(40, h * 0.3, 70, 46);
    text(ctx, 'со вкусом говядины', w / 2, h - 30, 'bold 26px Arial, sans-serif', '#ffffff', 'center');
  });

  const soda = scaled(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2a7a2a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9ad832';
    ctx.fillRect(0, h * 0.15, w, h * 0.12);
    text(ctx, 'ЛАЙМ', w * 0.3, h * 0.52, 'italic bold 74px Arial, sans-serif', '#f4e83a', 'center', ['#c82a1a', 6]);
    text(ctx, 'тонус', w * 0.3, h * 0.78, 'italic bold 44px Arial, sans-serif', '#ffffff', 'center');
    text(ctx, 'ЛАЙМ', w * 0.8, h * 0.52, 'italic bold 74px Arial, sans-serif', '#f4e83a', 'center', ['#c82a1a', 6]);
  });

  const tub = scaled(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#efe6c4';
    ctx.fillRect(0, 0, w, h);
    const x = 512;
    ctx.fillStyle = '#e8dca8';
    ctx.fillRect(x - 140, h * 0.06, 300, h * 0.9);
    text(ctx, 'Nefeli', x - 60, h * 0.18, 'italic bold 38px Georgia, serif', '#2a4a9a', 'center');
    text(ctx, 'Vanilla', x - 60, h * 0.36, 'bold 26px Arial, sans-serif', '#6a4a2a', 'center');
    text(ctx, 'Crema', x - 60, h * 0.48, '24px Arial, sans-serif', '#6a4a2a', 'center');
    ctx.fillStyle = '#fbf6ea';
    ctx.beginPath();
    ctx.arc(x + 70, h * 0.34, 46, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2a1e';
    ctx.fillRect(x + 64, h * 0.12, 6, 26);
    ctx.fillStyle = '#f4c81a';
    ctx.beginPath();
    ctx.moveTo(x - 140, h * 0.62);
    ctx.lineTo(x + 160, h * 0.56);
    ctx.lineTo(x + 160, h * 0.96);
    ctx.lineTo(x - 140, h * 0.96);
    ctx.fill();
    text(ctx, '2L+1L', x - 80, h * 0.8, 'bold 34px Arial, sans-serif', '#1a1a1a', 'center');
    text(ctx, 'ΔΩΡΕΑΝ', x + 70, h * 0.72, 'bold 30px Arial, sans-serif', '#c81a1a', 'center');
    text(ctx, 'ΠΑΓΩΤΟ', x + 70, h * 0.86, 'bold 30px Arial, sans-serif', '#c81a1a', 'center');
  });

  const shirtFront = scaled(256, 256, (ctx, w, h) => {
    text(ctx, 'SEA DOG', w / 2, h * 0.2, 'bold 40px Impact, Arial, sans-serif', '#d8d8d4', 'center');
    text(ctx, 'BLACKJACK', w * 0.44, h * 0.48, 'bold 44px Impact, Arial, sans-serif', '#e4e0dc', 'center');
    text(ctx, '19', w * 0.82, h * 0.72, 'bold 56px Georgia, serif', '#e4e0dc', 'center');
    text(ctx, '32-24-8-21', w * 0.34, h * 0.9, '20px Arial, sans-serif', '#c8c4c0', 'center');
    const g = rand(48);
    ctx.fillStyle = '#18181c';
    for (let i = 0; i < 260; i++) ctx.fillRect(g() * w, h * 0.1 + g() * h * 0.66, 2 + g() * 4, 1 + g() * 2);
  });

  const STORE = [
    { y: 0, h: 98, x: 0, w: 466, title: 'Сайра «Румпель» в томатном соусе,185 г', can: 'rumpel', rows: [['btn', 'Нет в наличии', '#9a9a9a'], ['btn2', 'Купить в 1 клик']] },
    { y: 112, h: 152, x: 0, w: 476, title: 'Сайра В Томатном Соусе 240г (7 Заливов)', brand: 'Бренд: 7 заливов', can: 'red', price: '0.00₽/шт', note: 'В упаковке: 24 шт.', note2: 'Срок годности: 730', tag: 'закончивается' },
    { y: 280, h: 122, x: 0, w: 434, title: 'Сайра 7 ЗАЛИВОВ в томатном соусе, 230г', can: 'red', rows: [['line', 'Товар закончился'], ['line', 'Консервация'], ['line', '7 ЗАЛИВОВ']] },
    { y: 404, h: 120, x: 26, w: 384, title: 'Сайра 7 Заливов в томатном соусе 250 г', can: 'pale', price: '145,09 ₽', note: '145,09 ₽ за 250 г', green: 'Смотреть похожее' }
  ];

  function storeCan(ctx, kind, x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = '#d8dadc';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.2, w * 0.48, h * 0.2, 0, 0, PI * 2);
    ctx.fill();
    const body = kind === 'rumpel' ? '#2a4aa8' : kind === 'pale' ? '#f0ece4' : '#e8b83a';
    ctx.fillStyle = body;
    ctx.fillRect(x + w * 0.02, y + h * 0.22, w * 0.96, h * 0.9);
    if (kind === 'rumpel') {
      ctx.fillStyle = '#f4c81a';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.5, y + h * 0.2, w * 0.4, h * 0.16, 0, 0, PI * 2);
      ctx.fill();
      text(ctx, 'РУМПЕЛЬ', x + w * 0.42, y + h * 0.22, 'bold 22px Arial, sans-serif', '#1a3a8a', 'center');
      text(ctx, 'САЙРА', x + w * 0.66, y + h * 0.62, 'bold 30px Arial, sans-serif', '#ffffff', 'center');
    } else {
      text(ctx, 'САЙРА', x + w * 0.42, y + h * 0.55, `bold ${Math.round(w * 0.24)}px Arial, sans-serif`, '#d42a26', 'center', ['#ffffff', 3]);
      text(ctx, 'в томатном', x + w * 0.3, y + h * 0.74, `italic ${Math.round(w * 0.08)}px Georgia, serif`, '#1a3a7a', 'center');
      ctx.fillStyle = '#d02818';
      ctx.beginPath();
      ctx.arc(x + w * 0.6, y + h * 0.88, w * 0.08, 0, PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const store = scaled(960, 540, (ctx, w, h) => {
    STORE.forEach(c => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      storeCan(ctx, c.can, c.x + 4, c.y + 4, 230, c.h - 8);
      const tx = c.x + 260;
      if (c.brand) text(ctx, c.brand, tx, c.y + 30, '13px Arial, sans-serif', '#3a3a3a');
      text(ctx, c.title, tx + (c.brand ? 0 : -6), c.y + (c.brand ? 54 : 18), c.brand ? '17px Arial, sans-serif' : 'bold 14px Arial, sans-serif', '#2a2a2a');
      if (c.tag) {
        ctx.fillStyle = '#e8201a';
        ctx.fillRect(tx, c.y + 72, 50, 10);
        text(ctx, c.tag, tx + 25, c.y + 77, 'bold 7px Arial, sans-serif', '#ffffff', 'center');
      }
      if (c.price && c.brand) {
        text(ctx, c.price, tx, c.y + 98, 'bold 26px Arial, sans-serif', '#3aa83a');
        text(ctx, c.note, tx, c.y + 122, '12px Arial, sans-serif', '#7a7a7a');
        text(ctx, c.note2, tx, c.y + 140, '12px Arial, sans-serif', '#7a7a7a');
      }
      if (c.green) {
        text(ctx, c.note, tx - 26, c.y + 36, '11px Arial, sans-serif', '#3a3a3a');
        text(ctx, c.price, tx - 26, c.y + 68, 'bold 14px Arial, sans-serif', '#2a2a2a');
        ctx.fillStyle = '#4ad84a';
        ctx.fillRect(tx - 26, c.y + 84, 110, 22);
        text(ctx, c.green, tx + 29, c.y + 95, '10px Arial, sans-serif', '#1a1a1a', 'center');
      }
      (c.rows || []).forEach((r, i) => {
        if (r[0] === 'btn') {
          ctx.fillStyle = r[2];
          ctx.fillRect(tx + 14, c.y + 40, 94, 14);
          text(ctx, r[1], tx + 61, c.y + 47, '7px Arial, sans-serif', '#ffffff', 'center');
        } else if (r[0] === 'btn2') {
          ctx.strokeStyle = '#9a9a9a';
          ctx.strokeRect(tx + 116, c.y + 40, 92, 14);
          text(ctx, r[1], tx + 162, c.y + 47, '7px Arial, sans-serif', '#4a4a4a', 'center');
        } else {
          ctx.fillStyle = '#f2f2f2';
          ctx.fillRect(tx - 60, c.y + 30 + i * 28, 220, 22);
          text(ctx, r[1], tx - 50, c.y + 41 + i * 28, '9px Arial, sans-serif', '#3a3a3a');
        }
      });
    });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(522, 436, 404, 98);
    text(ctx, 'Сайра тихоокеанская «Морской', 526, 456, 'bold 21px Arial, sans-serif', '#1a1a1a');
    text(ctx, 'узел» в томатном соусе', 526, 484, 'bold 21px Arial, sans-serif', '#1a1a1a');
    text(ctx, '175 г', 790, 484, 'bold 21px Arial, sans-serif', '#a8a8a8');
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(528, 500, 226, 32);
    ctx.fillRect(772, 500, 70, 28);
    text(ctx, 'Раскупили', 807, 514, '10px Arial, sans-serif', '#5a5a5a', 'center');
  });

  const STREAM_LIST = [
    'включить вручную', 'музыка 100р', 'клип/видео 200р', '(с крупных ютвид каналов)', 'ссылка на донат в описании',
    '', 'надеть лифчик на 30 мин 2к', 'написать/нарисовать на лице на 30 мин 5к (обсуд', 'намазать майонезом лицо 10 мин 2к', 'одеть парик и накрасить губы 30 мин 1000р',
    'постоять в углу 15 мин 1000р', 'выпить полтора литра лимонада 10к (согласовать)', 'намазать все лицо красной помадой 60 мин 10к', 'не выключать стрим сутки 7к', 'стримить лежа в ванной 30 мин 5к',
    'говорить "женским" голосом 15 мин 500р', 'намазать лицо в желтый цвет на 30 мин 2к'
  ];

  const stream = scaled(960, 540, (ctx, w, h) => {
    const out = ['rgba(0,0,0,0.9)', 3];
    text(ctx, 'Я ОСУЖДАЮ ВСЕ ПЛОХОЕ', 0, 4, '15px Arial, sans-serif', '#ffffff', 'left', out);
    text(ctx, 'музыка через донат-пейджер 50р и автоматически включается', 424, 11, 'italic 15px Arial, sans-serif', '#8a3ae8', 'left', ['rgba(255,255,255,0.65)', 2]);
    text(ctx, 'старт 25р', -2, 52, '15px Arial, sans-serif', '#ffffff', 'left', out);
    STREAM_LIST.forEach((s, i) => {
      if (!s) return;
      const y = i < 5 ? 92 + i * 19 : 218 + (i - 6) * 16.5;
      text(ctx, s, i < 5 ? -4 : -10, y, (i < 5 ? 15 : 12.5) + 'px Arial, sans-serif', '#ffffff', 'left', out);
    });
    text(ctx, 'ПРОДАЮ ОСНОВНОЙ', -6, 437, 'bold 17px Arial, sans-serif', '#ffffff', 'left', out);
    text(ctx, 'КАНАЛ ЗА 2 млн р', -6, 459, 'bold 17px Arial, sans-serif', '#ffffff', 'left', out);
    text(ctx, 'ПРЕДЛОЖИ СВОЙ ВАРИАНТ ЧЕЛЛЕНДЖА', -4, 512, 'bold 13px Arial, sans-serif', '#ffffff', 'left', out);
    text(ctx, '(ОБЯЗАТЕЛЬНО СОГЛАСОВАТЬ)', -4, 529, 'bold 13px Arial, sans-serif', '#ffffff', 'left', out);
    text(ctx, 'ССЫЛКА НА ДОНАТ В ОПИСАНИИ СТРИМА', 516, 532, 'bold 15px Arial, sans-serif', '#3ae83a', 'left', ['rgba(0,0,0,0.7)', 3]);
  });

  function floral(ctx, w, h) {
    const g = rand(49);
    ctx.fillStyle = '#d8b8c8';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const x = g() * w, y = g() * h;
      ctx.fillStyle = ['#a86a9a', '#c88ab4', '#8a5a8a', '#e8c8d8'][Math.floor(g() * 4)];
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 8, 5, a, 0, PI * 2);
        ctx.fill();
      }
    }
  }

  function needles(ctx, w, h) {
    const g = rand(50);
    ctx.fillStyle = '#16241a';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      const x = g() * w, y = g() * h, a = PI * (0.3 + g() * 0.4);
      ctx.strokeStyle = ['#1e3424', '#2a4a30', '#0e1a12', '#365a3c'][Math.floor(g() * 4)];
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7);
      ctx.stroke();
    }
  }

  function tabby(ctx, w, h) {
    ctx.fillStyle = '#dc8e48';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(176, 98, 44, 0.7)';
    for (let i = 0; i < 10; i++) {
      const y = h * (0.06 + i * 0.095);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(w * 0.25, y + h * 0.03, w * 0.36, y + h * 0.012);
      ctx.lineTo(w * 0.36, y + h * 0.04);
      ctx.quadraticCurveTo(w * 0.25, y + h * 0.06, 0, y + h * 0.035);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w, y);
      ctx.quadraticCurveTo(w * 0.75, y + h * 0.03, w * 0.64, y + h * 0.012);
      ctx.lineTo(w * 0.64, y + h * 0.04);
      ctx.quadraticCurveTo(w * 0.75, y + h * 0.06, w, y + h * 0.035);
      ctx.fill();
    }
    const gr = ctx.createLinearGradient(w * 0.3, 0, w * 0.7, 0);
    gr.addColorStop(0, 'rgba(244, 236, 228, 0)');
    gr.addColorStop(0.25, 'rgba(244, 236, 228, 1)');
    gr.addColorStop(0.75, 'rgba(244, 236, 228, 1)');
    gr.addColorStop(1, 'rgba(244, 236, 228, 0)');
    ctx.fillStyle = gr;
    ctx.fillRect(w * 0.3, h * 0.45, w * 0.4, h * 0.55);
  }

  function glow(ctx, w, h) {
    const gr = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0.6)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  }

  function steam(ctx, w, h) {
    const g = rand(51);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const x = g() * w, y = g() * h, r = (20 + g() * 50) * w / 256;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.35)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  function wall(base, seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,255,255'}, ${0.02 + g() * 0.03})`;
        blob(ctx, g() * w, g() * h, 4 + g() * 20, g, 0.8);
      }
    };
  }

  function tiles(ctx, w, h) {
    ctx.fillStyle = '#e8e6e0';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c8c4bc';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * h / 4); ctx.lineTo(w, i * h / 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i * w / 4, 0); ctx.lineTo(i * w / 4, h); ctx.stroke();
    }
  }

  function tattoo(ctx, w, h) {
    ctx.fillStyle = '#edbca8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(30, 34, 44, 0.85)';
    for (let k = 0; k < 2; k++) {
      const y0 = h * (0.25 + k * 0.4);
      ctx.beginPath();
      ctx.moveTo(0, y0);
      for (let i = 0; i <= 8; i++) {
        const x = (i / 8) * w;
        ctx.quadraticCurveTo(x - w / 16, y0 - h * 0.14 * (i % 2 ? 1 : -0.4), x, y0 + (i % 2 ? h * 0.05 : -h * 0.02));
      }
      ctx.lineTo(w, y0 + h * 0.12);
      for (let i = 8; i >= 0; i--) {
        const x = (i / 8) * w;
        ctx.quadraticCurveTo(x + w / 16, y0 + h * 0.2 * (i % 2 ? 1 : 0.4), x, y0 + h * 0.1);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  const DRAW = {
    granite, graniteInner, glass, reflection, wood: wood('#c8a478', 'rgba(130, 90, 50, A)', 61), board: wood('#d8b07c', 'rgba(150, 100, 56, A)', 62),
    felt: felt('#3c3d40', 'rgba(110, 112, 118, 0.55)', 'rgba(20, 20, 22, 0.55)', 63), feltSun: felt('#6c6e70', 'rgba(160, 162, 166, 0.5)', 'rgba(60, 60, 64, 0.55)', 64),
    sauce, mash, broth, soup, potatoSoup, creamy, redPaste, oil, water, bubbles, lumps, noodles, seasoning, onion, spill, splatter,
    canNatural, canTomato, canVlad, lid: lidTex, jarSauce, jarPaste, mayo, noodleLid, soda, tub, shirtFront,
    store, stream, floral, needles, tabby, glow, steam, wallWhite: wall('#e8e4dc', 65), wallYellow: wall('#dec762', 66), tiles,
    blanketGreen: felt('#a8b890', 'rgba(220, 230, 200, 0.5)', 'rgba(80, 100, 70, 0.5)', 67), tattoo
  };

  window.SairaArt = { DRAW, GLASS, ZONES, STORE };
})();
