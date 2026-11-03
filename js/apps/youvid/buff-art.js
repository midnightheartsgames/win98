(function () {
  const { rand } = window.P3D;
  const { PI, S, C } = window.YouVidKit;

  function hex(c) {
    return '#' + c.toString(16).padStart(6, '0');
  }

  function rgba(c, a) {
    return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
  }

  function soft(ctx, x, y, rx, ry, c, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, rgba(c, a));
    gr.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function cloth(base, seed, amount) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = hex(base);
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < w * h * 0.25; i++) {
        ctx.fillStyle = g() < 0.5 ? `rgba(0,0,0,${amount * g()})` : `rgba(255,255,255,${amount * 0.6 * g()})`;
        ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1 + Math.floor(g() * 3), 1);
      }
    };
  }

  function mail(seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = '#8a8a90';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0, row = 0; y < h; y += 2, row++) {
        const off = row % 2;
        for (let x = 0; x < w; x += 2) {
          const v = g();
          const c = Math.round(150 + 100 * v * v + 5 * g());
          ctx.fillStyle = `rgb(${c},${c},${Math.min(255, c + 5)})`;
          ctx.fillRect((x + off) % w, y, 1, 1);
          ctx.fillStyle = `rgb(${Math.round(c * 0.7)},${Math.round(c * 0.7)},${Math.round(c * 0.72)})`;
          ctx.fillRect((x + off + 1) % w, y, 1, 1);
          ctx.fillStyle = 'rgba(50,50,56,0.4)';
          ctx.fillRect((x + off) % w, y + 1, 2, 1);
        }
      }
      for (let i = 0; i < w * h * 0.03; i++) {
        ctx.fillStyle = `rgba(255,255,250,${0.7 + 0.3 * g()})`;
        ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1, 1);
      }
    };
  }

  function wyvern(ctx, flip) {
    ctx.save();
    ctx.scale(flip, 1);
    const body = '#a83a4e', wing = '#8a3044', hi = '#d88aa0', dk = '#4a1420';
    ctx.fillStyle = wing;
    ctx.beginPath();
    ctx.moveTo(0.082, -0.055);
    ctx.bezierCurveTo(0.09, -0.09, 0.11, -0.13, 0.135, -0.155);
    ctx.lineTo(0.13, -0.125);
    ctx.lineTo(0.146, -0.128);
    ctx.lineTo(0.134, -0.1);
    ctx.lineTo(0.15, -0.098);
    ctx.lineTo(0.132, -0.072);
    ctx.lineTo(0.144, -0.066);
    ctx.bezierCurveTo(0.12, -0.05, 0.1, -0.035, 0.088, -0.03);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(0.062, -0.06);
    ctx.bezierCurveTo(0.058, -0.085, 0.05, -0.1, 0.05, -0.112);
    ctx.lineTo(0.032, -0.118);
    ctx.lineTo(0.03, -0.11);
    ctx.lineTo(0.048, -0.104);
    ctx.lineTo(0.044, -0.097);
    ctx.bezierCurveTo(0.05, -0.09, 0.056, -0.07, 0.056, -0.055);
    ctx.bezierCurveTo(0.05, -0.05, 0.05, -0.04, 0.052, -0.036);
    ctx.lineTo(0.06, -0.04);
    ctx.bezierCurveTo(0.058, 0.0, 0.062, 0.03, 0.07, 0.045);
    ctx.lineTo(0.058, 0.09);
    ctx.lineTo(0.07, 0.092);
    ctx.lineTo(0.08, 0.055);
    ctx.lineTo(0.09, 0.092);
    ctx.lineTo(0.102, 0.09);
    ctx.lineTo(0.092, 0.045);
    ctx.bezierCurveTo(0.11, 0.05, 0.13, 0.07, 0.126, 0.09);
    ctx.bezierCurveTo(0.122, 0.1, 0.11, 0.098, 0.112, 0.088);
    ctx.bezierCurveTo(0.114, 0.075, 0.1, 0.06, 0.09, 0.035);
    ctx.bezierCurveTo(0.098, 0.0, 0.094, -0.04, 0.078, -0.062);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hi;
    ctx.lineWidth = 0.0032;
    ctx.beginPath();
    ctx.moveTo(0.066, -0.03);
    ctx.bezierCurveTo(0.068, 0.0, 0.072, 0.02, 0.08, 0.035);
    ctx.moveTo(0.09, -0.06);
    ctx.lineTo(0.13, -0.13);
    ctx.moveTo(0.094, -0.05);
    ctx.lineTo(0.135, -0.095);
    ctx.stroke();
    ctx.strokeStyle = dk;
    ctx.lineWidth = 0.0025;
    ctx.beginPath();
    ctx.moveTo(0.052, -0.04);
    ctx.lineTo(0.045, -0.045);
    ctx.moveTo(0.08, 0.0);
    ctx.lineTo(0.088, 0.02);
    ctx.stroke();
    ctx.fillStyle = '#f4e8e8';
    ctx.beginPath();
    ctx.arc(0.046, -0.108, 0.0025, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function emblem(ctx) {
    wyvern(ctx, -1);
    wyvern(ctx, 1);
    ctx.fillStyle = '#a8a8ae';
    ctx.beginPath();
    ctx.moveTo(-0.022, -0.115);
    ctx.bezierCurveTo(-0.02, -0.13, -0.01, -0.14, 0, -0.142);
    ctx.bezierCurveTo(0.01, -0.14, 0.02, -0.13, 0.022, -0.115);
    ctx.lineTo(0.018, -0.088);
    ctx.lineTo(-0.018, -0.088);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#26262a';
    ctx.fillRect(-0.014, -0.112, 0.028, 0.004);
    ctx.fillStyle = '#c8c8cc';
    [-1, 0, 1].forEach(k => {
      ctx.beginPath();
      ctx.moveTo(k * 0.012, -0.142);
      ctx.bezierCurveTo(k * 0.03 - 0.006, -0.16, k * 0.022, -0.18, k * 0.01, -0.19);
      ctx.bezierCurveTo(k * 0.028 + 0.004, -0.175, k * 0.03 + 0.008, -0.155, k * 0.018 + 0.006, -0.14);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = '#9a9aa0';
    ctx.beginPath();
    ctx.moveTo(-0.05, -0.088);
    ctx.lineTo(0.05, -0.088);
    ctx.lineTo(0.05, -0.02);
    ctx.bezierCurveTo(0.05, 0.03, 0.025, 0.05, 0, 0.062);
    ctx.bezierCurveTo(-0.025, 0.05, -0.05, 0.03, -0.05, -0.02);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5a5a60';
    ctx.lineWidth = 0.004;
    ctx.stroke();
    ctx.fillStyle = '#d0d0d4';
    ctx.beginPath();
    ctx.moveTo(-0.046, -0.084);
    ctx.lineTo(-0.004, -0.084);
    ctx.lineTo(-0.004, 0.05);
    ctx.bezierCurveTo(-0.03, 0.04, -0.046, 0.02, -0.046, -0.02);
    ctx.closePath();
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#121214';
    ctx.fillRect(-0.0085, -0.088, 0.017, 0.146);
    ctx.fillRect(-0.05, -0.044, 0.1, 0.017);
    ctx.fillStyle = '#b8b8bc';
    ctx.beginPath();
    ctx.moveTo(-0.13, 0.085);
    ctx.bezierCurveTo(-0.09, 0.11, -0.05, 0.1, 0, 0.098);
    ctx.bezierCurveTo(0.05, 0.1, 0.09, 0.11, 0.13, 0.085);
    ctx.lineTo(0.14, 0.11);
    ctx.lineTo(0.125, 0.115);
    ctx.bezierCurveTo(0.09, 0.135, 0.05, 0.125, 0, 0.124);
    ctx.bezierCurveTo(-0.05, 0.125, -0.09, 0.135, -0.125, 0.115);
    ctx.lineTo(-0.14, 0.11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a3a40';
    ctx.font = 'bold 0.016px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SINE  TIMORE', 0, 0.112);
  }

  function tabard(withEmblem) {
    return (ctx, w, h) => {
      cloth(0x161618, 41, 0.08)(ctx, w, h);
      const fold = ctx.createLinearGradient(0, 0, w, 0);
      fold.addColorStop(0, 'rgba(0,0,0,0.35)');
      fold.addColorStop(0.18, 'rgba(0,0,0,0)');
      fold.addColorStop(0.82, 'rgba(0,0,0,0)');
      fold.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = fold;
      ctx.fillRect(0, 0, w, h);
      const g = rand(7);
      for (let i = 0; i < 5; i++) {
        const x = (0.15 + 0.7 * g()) * w;
        const gr = ctx.createLinearGradient(x - 10, 0, x + 10, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.5, `rgba(255,255,255,${0.012 + 0.012 * g()})`);
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(x - 10, h * 0.55, 20, h * 0.45);
      }
      if (!withEmblem) return;
      ctx.save();
      ctx.translate(w / 2, h * 0.255);
      ctx.scale(w / 0.46 * 0.66, h / 0.93 * 0.66);
      ctx.globalAlpha = 0.86;
      emblem(ctx);
      ctx.restore();
    };
  }

  function leather(ctx, w, h) {
    ctx.fillStyle = '#5a2e1a';
    ctx.fillRect(0, 0, w, h);
    const g = rand(5);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(20,8,4,0.25)' : 'rgba(150,90,60,0.2)';
      ctx.fillRect(g() * w, g() * h, 2, 1);
    }
    ctx.fillStyle = 'rgba(30,14,8,0.6)';
    ctx.fillRect(0, 2, w, 1);
    ctx.fillRect(0, h - 3, w, 1);
    ctx.fillStyle = 'rgba(160,100,70,0.35)';
    ctx.fillRect(0, h * 0.35, w, 1);
  }

  function steel(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#fbfbfc');
    gr.addColorStop(0.12, '#d8d9dd');
    gr.addColorStop(0.3, '#7c7e86');
    gr.addColorStop(0.42, '#e6e6ea');
    gr.addColorStop(0.55, '#9a9ca2');
    gr.addColorStop(0.72, '#5c5e66');
    gr.addColorStop(0.86, '#c8c9ce');
    gr.addColorStop(1, '#6a6c72');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    const g = rand(9);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.1 * g()})`;
      ctx.fillRect(g() * w, g() * h, 3 + g() * 6, 1);
    }
  }

  function glass(ctx, w, h) {
    ctx.fillStyle = '#8a6a50';
    ctx.fillRect(0, 0, w, h);
    const g = rand(17);
    const cols = 3, rows = 10;
    const pw = w / cols, ph = h / rows;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const v = 0.93 + 0.07 * g();
        const warm = g();
        ctx.fillStyle = `rgb(${Math.round(242 * v)},${Math.round((206 + 8 * warm) * v)},${Math.round((152 + 16 * warm) * v)})`;
        ctx.fillRect(i * pw + 0.8, j * ph + 0.8, pw - 1.6, ph - 1.6);
        soft(ctx, i * pw + pw * 0.5, j * ph + ph * 0.5, pw * 0.45, ph * 0.45, 0xfff6e0, 0.35);
      }
    }
  }

  function panels(base, seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = hex(base);
      ctx.fillRect(0, 0, w, h);
      const n = 8;
      for (let i = 0; i < n; i++) {
        const x = (i / n) * w;
        const k = 0.8 + 0.4 * g();
        ctx.fillStyle = `rgba(${Math.round(60 * k)},${Math.round(14 * k)},${Math.round(22 * k)},0.55)`;
        ctx.fillRect(x + 2, 0, w / n - 4, h);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(x, 0, 2, h);
        ctx.fillStyle = 'rgba(120,50,60,0.12)';
        ctx.fillRect(x + 2, 0, 1, h);
      }
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = g() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(110,40,50,0.06)';
        ctx.fillRect(g() * w, g() * h, 1, 3 + g() * 8);
      }
    };
  }

  function stone(ctx, w, h) {
    const g = rand(23);
    ctx.fillStyle = '#1e0a10';
    ctx.fillRect(0, 0, w, h);
    const rowsN = 8, bw = w / 4;
    for (let j = 0; j < rowsN; j++) {
      const y = (j / rowsN) * h;
      const off = (j % 2) * bw / 2;
      for (let x = -bw; x < w + bw; x += bw) {
        const k = 0.75 + 0.5 * g();
        ctx.fillStyle = `rgb(${Math.round(36 * k)},${Math.round(13 * k)},${Math.round(20 * k)})`;
        ctx.fillRect(x + off + 1.5, y + 1.5, bw - 3, h / rowsN - 3);
      }
    }
    for (let i = 0; i < 1500; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(90,40,50,0.1)';
      ctx.fillRect(g() * w, g() * h, 2, 2);
    }
  }

  function planks(ctx, w, h) {
    const g = rand(31);
    const n = 6;
    for (let i = 0; i < n; i++) {
      const k = 0.8 + 0.35 * g();
      ctx.fillStyle = `rgb(${Math.round(104 * k)},${Math.round(58 * k)},${Math.round(50 * k)})`;
      ctx.fillRect((i / n) * w, 0, w / n, h);
      for (let j = 0; j < 40; j++) {
        ctx.fillStyle = g() < 0.5 ? 'rgba(40,14,10,0.25)' : 'rgba(170,110,90,0.12)';
        ctx.fillRect((i / n) * w + g() * (w / n), 0, 1, h);
      }
      ctx.fillStyle = 'rgba(14,4,2,0.85)';
      ctx.fillRect((i / n) * w, 0, 1.5, h);
      const cut = g() * h;
      ctx.fillRect((i / n) * w, cut, w / n, 1.5);
    }
  }

  function velvet(ctx, w, h) {
    ctx.fillStyle = '#141214';
    ctx.fillRect(0, 0, w, h);
    const g = rand(51);
    for (let i = 0; i < 30; i++) {
      const x = g() * w, y = g() * h;
      soft(ctx, x, y, 8 + g() * 22, 4 + g() * 12, 0x625a60, 0.4 + 0.35 * g());
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const x = g() * w, y = g() * h;
      ctx.strokeStyle = `rgba(120,112,118,${0.25 + 0.25 * g()})`;
      ctx.lineWidth = 2 + g() * 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (g() - 0.5) * 40, y + 10 + g() * 20, x + (g() - 0.5) * 50, y + 30 + g() * 30);
      ctx.stroke();
    }
    for (let i = 0; i < 14; i++) {
      const x = g() * w, y = g() * h;
      soft(ctx, x, y, 8 + g() * 20, 4 + g() * 10, 0x000000, 0.6);
    }
  }

  function curls(ctx, w, h) {
    ctx.fillStyle = '#2c2018';
    ctx.fillRect(0, 0, w, h);
    const g = rand(61);
    for (let i = 0; i < 240; i++) {
      const x = g() * w, y = g() * h, rr = 3 + g() * 6;
      ctx.strokeStyle = g() < 0.6 ? `rgba(110,80,56,${0.35 + 0.4 * g()})` : `rgba(14,8,6,${0.5 + 0.3 * g()})`;
      ctx.lineWidth = 1 + g() * 1.4;
      ctx.beginPath();
      ctx.arc(x, y, rr, g() * PI * 2, g() * PI * 2 + PI * (1 + g()));
      ctx.stroke();
    }
  }

  function linen(ctx, w, h) {
    ctx.fillStyle = '#f6f4ee';
    ctx.fillRect(0, 0, w, h);
    const g = rand(71);
    for (let i = 0; i < 9; i++) {
      const x = g() * w;
      const gr = ctx.createLinearGradient(x - 8, 0, x + 8, 0);
      gr.addColorStop(0, 'rgba(150,140,130,0)');
      gr.addColorStop(0.5, `rgba(150,140,130,${0.05 + 0.07 * g()})`);
      gr.addColorStop(1, 'rgba(150,140,130,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(x - 8, 0, 16, h);
    }
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = 'rgba(170,160,150,0.06)';
      ctx.fillRect(g() * w, g() * h, 2, 1);
    }
  }

  function vneck(skin) {
    return (ctx, w, h) => {
      linen(ctx, w, h);
      ctx.fillStyle = hex(skin);
      ctx.beginPath();
      ctx.moveTo(w * 0.3, 0);
      ctx.lineTo(w * 0.7, 0);
      ctx.lineTo(w * 0.53, h * 0.86);
      ctx.lineTo(w * 0.47, h * 0.86);
      ctx.closePath();
      ctx.fill();
      const sh = ctx.createLinearGradient(0, 0, 0, h * 0.86);
      sh.addColorStop(0, 'rgba(90,50,40,0.05)');
      sh.addColorStop(1, 'rgba(90,50,40,0.45)');
      ctx.fillStyle = sh;
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,110,100,0.5)';
      ctx.lineWidth = w * 0.012;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, 0);
      ctx.lineTo(w * 0.47, h * 0.86);
      ctx.moveTo(w * 0.7, 0);
      ctx.lineTo(w * 0.53, h * 0.86);
      ctx.stroke();
      ctx.strokeStyle = '#120c0c';
      ctx.lineCap = 'round';
      ctx.lineWidth = w * 0.03;
      for (let i = 0; i < 4; i++) {
        const y0 = h * (0.08 + i * 0.2), y1 = y0 + h * 0.17;
        const k0 = 1 - y0 / (h * 0.86), k1 = 1 - y1 / (h * 0.86);
        const a0 = w * (0.03 + 0.2 * k0), a1 = w * (0.03 + 0.2 * Math.max(0, k1));
        ctx.beginPath();
        ctx.moveTo(w / 2 - a0, y0);
        ctx.lineTo(w / 2 + a1, y1);
        ctx.moveTo(w / 2 + a0, y0);
        ctx.lineTo(w / 2 - a1, y1);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(w * 0.49, h * 0.84);
      ctx.quadraticCurveTo(w * 0.42, h * 0.92, w * 0.44, h * 1.0);
      ctx.moveTo(w * 0.51, h * 0.84);
      ctx.quadraticCurveTo(w * 0.58, h * 0.92, w * 0.55, h * 1.0);
      ctx.stroke();
    };
  }

  function ukeTop(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const sx = w / 0.56, sy = h / 0.18;
    ctx.save();
    ctx.scale(sx, sy);
    ctx.translate(0, 0.09);
    const body = (x0) => {
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.bezierCurveTo(x0, -0.055, 0.03, -0.075, 0.075, -0.07);
      ctx.bezierCurveTo(0.11, -0.065, 0.115, -0.045, 0.14, -0.05);
      ctx.bezierCurveTo(0.175, -0.058, 0.205, -0.055, 0.215, -0.03);
      ctx.bezierCurveTo(0.222, -0.012, 0.222, 0.012, 0.215, 0.03);
      ctx.bezierCurveTo(0.205, 0.055, 0.175, 0.058, 0.14, 0.05);
      ctx.bezierCurveTo(0.115, 0.045, 0.11, 0.065, 0.075, 0.07);
      ctx.bezierCurveTo(0.03, 0.075, x0, 0.055, x0, 0);
      ctx.closePath();
    };
    body(0.0);
    const gr = ctx.createLinearGradient(0, -0.07, 0, 0.07);
    gr.addColorStop(0, '#9a5a30');
    gr.addColorStop(0.5, '#b8743e');
    gr.addColorStop(1, '#8a4c28');
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.lineWidth = 0.004;
    ctx.strokeStyle = '#4a2410';
    ctx.stroke();
    ctx.fillStyle = '#120a06';
    ctx.beginPath();
    ctx.arc(0.135, 0, 0.022, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8dcc0';
    ctx.lineWidth = 0.002;
    ctx.beginPath();
    ctx.arc(0.135, 0, 0.026, 0, PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#2a160c';
    ctx.fillRect(0.045, -0.022, 0.012, 0.044);
    ctx.fillStyle = '#e8e0cc';
    ctx.fillRect(0.051, -0.02, 0.002, 0.04);
    ctx.fillStyle = '#2a1a12';
    ctx.fillRect(0.11, -0.014, 0.35, 0.028);
    ctx.fillStyle = '#c8c4bc';
    for (let i = 0; i < 12; i++) {
      const x = 0.46 - 0.3 * (1 - Math.pow(0.86, i)) / (1 - Math.pow(0.86, 12));
      ctx.fillRect(x, -0.014, 0.0018, 0.028);
    }
    ctx.fillStyle = '#e8e4da';
    [0.31, 0.37, 0.41].forEach(x => {
      ctx.beginPath();
      ctx.arc(x, 0, 0.0028, 0, PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#3a2416';
    ctx.beginPath();
    ctx.moveTo(0.46, -0.016);
    ctx.lineTo(0.54, -0.024);
    ctx.lineTo(0.545, 0.024);
    ctx.lineTo(0.46, 0.016);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f0ece0';
    [[0.49, -0.03], [0.52, -0.032], [0.49, 0.03], [0.52, 0.032]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, 0.006, 0.008, 0, 0, PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#e8e4da';
    ctx.font = '0.012px Arial';
    ctx.strokeStyle = 'rgba(245,240,230,0.9)';
    ctx.lineWidth = 0.0012;
    [-0.009, -0.003, 0.003, 0.009].forEach(y => {
      ctx.beginPath();
      ctx.moveTo(0.05, y * 1.3);
      ctx.lineTo(0.465, y);
      ctx.lineTo(0.505, y * 2.6);
      ctx.stroke();
    });
    ctx.restore();
  }

  function strands(base, hi, dk, seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = hex(base);
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 420; i++) {
        const x = g() * w, y = g() * h;
        const len = 6 + g() * 14;
        const lean = (x / w - 0.5) * 10;
        ctx.strokeStyle = g() < 0.55 ? rgba(hi, 0.3 + 0.4 * g()) : rgba(dk, 0.35 + 0.4 * g());
        ctx.lineWidth = 0.8 + g() * 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + lean * 0.5, y + len * 0.5, x + lean, y + len);
        ctx.stroke();
      }
    };
  }

  function wood(ctx, w, h) {
    ctx.fillStyle = '#7a4022';
    ctx.fillRect(0, 0, w, h);
    const g = rand(81);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(40,16,6,0.25)' : 'rgba(190,120,70,0.18)';
      ctx.fillRect(0, g() * h, w, 1);
    }
  }

  function gold(ctx, w, h) {
    const g = rand(91);
    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, '#9a7040');
    base.addColorStop(0.5, '#c4965a');
    base.addColorStop(1, '#8a6234');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      soft(ctx, g() * w, g() * h, 8 + g() * 22, 6 + g() * 16, g() < 0.5 ? 0xf0cc88 : 0x4a3014, 0.18 + 0.22 * g());
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      let x = g() * w, y = g() * h, a = g() * PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        a += (g() - 0.5) * 1.6;
        const nx = x + C(a) * 7, ny = y + S(a) * 7;
        ctx.quadraticCurveTo(x + C(a + 0.8) * 5, y + S(a + 0.8) * 5, nx, ny);
        x = nx;
        y = ny;
      }
      ctx.strokeStyle = 'rgba(40,24,8,0.7)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,232,170,0.55)';
      ctx.lineWidth = 0.8;
      ctx.translate(-0.8, -0.8);
      ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    for (let i = 0; i < 18; i++) {
      const x = g() * w, y = g() * h;
      ctx.fillStyle = 'rgba(255,236,180,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(40,24,8,0.6)';
      ctx.beginPath();
      ctx.arc(x + 0.8, y + 0.8, 1.2, 0, PI * 2);
      ctx.fill();
    }
  }

  function dust(seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      const N = 16;
      const grid = [];
      for (let i = 0; i < (N + 1) * (N + 1); i++) grid.push(g());
      const val = (x, y) => {
        const fx = ((x % N) + N) % N, fy = ((y % N) + N) % N;
        const ix = Math.floor(fx), iy = Math.floor(fy);
        const ax = fx - ix, ay = fy - iy;
        const sx = ax * ax * (3 - 2 * ax), sy = ay * ay * (3 - 2 * ay);
        const at = (i, j) => grid[(((j % N) + N) % N) * (N + 1) + (((i % N) + N) % N)];
        const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
        const bot = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
        return top + (bot - top) * sy;
      };
      const img = ctx.createImageData(w, h);
      const ox = g() * 8, oy = g() * 8;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const u = x / w, v = y / h;
          let n = 0, amp = 0.5, f = 3;
          for (let o = 0; o < 4; o++) {
            n += val(u * f + ox, v * f + oy) * amp;
            amp *= 0.5;
            f *= 2;
          }
          const d = Math.hypot(u - 0.5, v - 0.5) * 2;
          const fall = Math.max(0, 1 - d * d);
          const a = Math.max(0, Math.min(1, (n - 0.32) * 2.2)) * fall;
          const k = 0.82 + 0.3 * n;
          const i = (y * w + x) * 4;
          img.data[i] = Math.min(255, 168 * k);
          img.data[i + 1] = Math.min(255, 156 * k);
          img.data[i + 2] = Math.min(255, 124 * k);
          img.data[i + 3] = Math.round(a * 235);
        }
      }
      ctx.putImageData(img, 0, 0);
    };
  }

  const FONT = '"Segoe UI", Tahoma, Arial, sans-serif';

  function captionDrawer(lines, px, lead) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.font = `700 ${px}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.lineJoin = 'round';
      lines.forEach((s, i) => {
        const y = px * 1.02 + i * lead;
        ctx.lineWidth = Math.max(2, px * 0.24);
        ctx.strokeStyle = '#000000';
        ctx.strokeText(s, w / 2, y);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(s, w / 2, y);
      });
    };
  }

  window.BuffArt = {
    hex, rgba, soft, cloth, mail, tabard, leather, steel, glass, panels, stone, planks, velvet, curls, linen, vneck, ukeTop, strands, wood, gold, dust, captionDrawer, emblem, FONT
  };
})();
