(function () {
  const { rand } = window.P3D;

  function noise(ctx, w, h, g, amount, n, size) {
    const count = Math.floor(w * h * (n || 0.25));
    for (let i = 0; i < count; i++) {
      const v = g();
      const a = amount * g();
      ctx.fillStyle = v < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 0.7})`;
      const s = size || 2;
      ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1 + Math.floor(g() * s), 1 + Math.floor(g() * s));
    }
  }

  function blobs(ctx, w, h, g, n, cols, r0, r1, alpha) {
    for (let i = 0; i < n; i++) {
      const x = g() * w, y = g() * h, r = r0 + g() * (r1 - r0);
      const c = cols[Math.floor(g() * cols.length)];
      for (const ox of [-w, 0, w]) {
        for (const oy of [-h, 0, h]) {
          const gr = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
          gr.addColorStop(0, `rgba(${c},${alpha})`);
          gr.addColorStop(1, `rgba(${c},0)`);
          ctx.fillStyle = gr;
          ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
        }
      }
    }
  }

  function sky(ctx, w, h) {
    const g = rand(71);
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#3b3846');
    gr.addColorStop(0.35, '#5a5363');
    gr.addColorStop(0.62, '#8c7f8c');
    gr.addColorStop(0.8, '#b9a3a2');
    gr.addColorStop(0.92, '#cdb4a4');
    gr.addColorStop(1, '#bfa596');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = g() * w, y = h * (0.05 + Math.pow(g(), 0.8) * 0.75), rw = 40 + g() * 160, rh = 10 + g() * 40;
      const dark = g() < 0.6;
      for (const ox of [-w, 0, w]) {
        const gr2 = ctx.createRadialGradient(x + ox, y, 0, x + ox, y, rw);
        const c = dark ? '52,48,60' : '214,196,200';
        gr2.addColorStop(0, `rgba(${c},${dark ? 0.55 : 0.4})`);
        gr2.addColorStop(1, `rgba(${c},0)`);
        ctx.save();
        ctx.translate(x + ox, y);
        ctx.scale(1, rh / rw);
        ctx.translate(-(x + ox), -y);
        ctx.fillStyle = gr2;
        ctx.fillRect(x + ox - rw, y - rw, rw * 2, rw * 2);
        ctx.restore();
      }
    }
    for (let i = 0; i < 26; i++) {
      const x = g() * w, y = h * (0.45 + g() * 0.35), rw = 30 + g() * 90;
      for (const ox of [-w, 0, w]) {
        const gr3 = ctx.createRadialGradient(x + ox, y, 0, x + ox, y, rw);
        gr3.addColorStop(0, 'rgba(236,214,206,0.45)');
        gr3.addColorStop(1, 'rgba(236,214,206,0)');
        ctx.save();
        ctx.translate(x + ox, y);
        ctx.scale(1, 0.28);
        ctx.translate(-(x + ox), -y);
        ctx.fillStyle = gr3;
        ctx.fillRect(x + ox - rw, y - rw, rw * 2, rw * 2);
        ctx.restore();
      }
    }
  }

  function grass(ctx, w, h) {
    const g = rand(11);
    ctx.fillStyle = '#6e5a34';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, g, 40, ['92,74,40', '112,92,48', '84,72,44', '120,84,44', '70,66,40'], 10, 40, 0.5);
    for (let i = 0; i < 2600; i++) {
      const x = g() * w, y = g() * h, l = 3 + g() * 7;
      const c = g();
      ctx.strokeStyle = c < 0.3 ? 'rgba(150,118,62,0.7)' : c < 0.55 ? 'rgba(124,98,52,0.7)' : c < 0.8 ? 'rgba(78,62,34,0.6)' : 'rgba(104,96,56,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (g() - 0.5) * 3, y - l);
      ctx.stroke();
    }
    noise(ctx, w, h, g, 0.12, 0.3, 2);
  }

  function dirt(ctx, w, h) {
    const g = rand(12);
    ctx.fillStyle = '#5a4130';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, g, 50, ['76,56,40', '66,48,34', '98,72,50', '58,44,34'], 8, 34, 0.5);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(40,30,22,0.5)' : 'rgba(130,104,80,0.45)';
      ctx.beginPath();
      ctx.arc(g() * w, g() * h, 0.6 + g() * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 260; i++) {
      const x = g() * w, y = g() * h;
      ctx.strokeStyle = 'rgba(150,118,64,0.35)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (g() - 0.5) * 4, y - 3 - g() * 4);
      ctx.stroke();
    }
    noise(ctx, w, h, g, 0.12, 0.3, 2);
  }

  function planks(base, seed, gaps, light) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.clearRect(0, 0, w, h);
      const n = 8;
      const bw = w / n;
      for (let i = 0; i < n; i++) {
        const x0 = i * bw;
        const k = 0.82 + g() * 0.3;
        const c = base.map(v => Math.round(Math.min(255, v * k)));
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        const top = gaps ? g() * h * 0.05 : 0;
        ctx.fillRect(x0 + (gaps ? 2 : 0.5), top, bw - (gaps ? 4 : 1), h - top);
        for (let j = 0; j < 30; j++) {
          ctx.strokeStyle = g() < 0.5 ? 'rgba(0,0,0,0.18)' : `rgba(255,255,255,${0.08 * (light || 1)})`;
          ctx.beginPath();
          const xx = x0 + 3 + g() * (bw - 6);
          ctx.moveTo(xx, g() * h);
          ctx.lineTo(xx + (g() - 0.5) * 2, g() * h);
          ctx.stroke();
        }
        if (g() < 0.5) {
          ctx.fillStyle = 'rgba(30,24,18,0.6)';
          ctx.beginPath();
          ctx.arc(x0 + bw / 2, h * (0.15 + g() * 0.7), 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x0 + (gaps ? 2 : 0), 0, 1.5, h);
      }
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(0.8, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(30,22,10,0.45)');
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      noise(ctx, w, h, g, 0.1, 0.2, 2);
    };
  }

  function bricks(mortar, cols, seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = mortar;
      ctx.fillRect(0, 0, w, h);
      const bh = h / 16, bw = w / 6;
      for (let r = 0; r < 16; r++) {
        const off = (r % 2) * bw / 2;
        for (let c = -1; c < 7; c++) {
          const col = cols[Math.floor(g() * cols.length)];
          ctx.fillStyle = col;
          ctx.fillRect(c * bw + off + 1, r * bh + 1, bw - 2, bh - 2);
          if (g() < 0.3) {
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(c * bw + off + 1, r * bh + 1, bw - 2, bh - 2);
          }
        }
      }
      blobs(ctx, w, h, g, 10, ['40,30,26', '210,200,190'], 8, 30, 0.25);
      noise(ctx, w, h, g, 0.15, 0.3, 2);
    };
  }

  function plaster(ctx, w, h) {
    const g = rand(14);
    ctx.fillStyle = '#c9c4b8';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, g, 30, ['150,140,124', '214,210,200', '120,110,96', '170,150,120'], 10, 46, 0.4);
    for (let i = 0; i < 18; i++) {
      const x = g() * w, y = g() * h, rw = 10 + g() * 30, rh = 6 + g() * 20;
      ctx.fillStyle = 'rgba(150,96,70,0.5)';
      ctx.beginPath();
      ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,104,74,0.6)';
      for (let k = 0; k < 6; k++) ctx.fillRect(x - rw * 0.6 + k * rw * 0.2, y - 3, rw * 0.16, 4);
    }
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(60,50,40,0.1)');
    gr.addColorStop(1, 'rgba(60,46,30,0.45)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, g, 0.12, 0.3, 2);
  }

  function slate(ctx, w, h) {
    const g = rand(15);
    ctx.fillStyle = '#7d8084';
    ctx.fillRect(0, 0, w, h);
    const n = 16;
    for (let i = 0; i < n; i++) {
      const x = (i / n) * w;
      const gr = ctx.createLinearGradient(x, 0, x + w / n, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0.18)');
      gr.addColorStop(0.5, 'rgba(0,0,0,0.0)');
      gr.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = gr;
      ctx.fillRect(x, 0, w / n, h);
    }
    for (let r = 1; r < 4; r++) {
      ctx.fillStyle = 'rgba(30,30,30,0.35)';
      ctx.fillRect(0, (r / 4) * h, w, 2);
    }
    blobs(ctx, w, h, g, 24, ['80,90,60', '60,58,50', '150,150,140'], 8, 30, 0.35);
    noise(ctx, w, h, g, 0.12, 0.3, 2);
  }

  function rust(base, seed, moss) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      blobs(ctx, w, h, g, 40, ['150,70,30', '190,110,60', '110,50,26', '200,140,90', '90,60,40'], 6, 34, 0.5);
      if (moss) blobs(ctx, w, h, g, 18, ['96,110,52', '120,128,60', '70,84,40'], 6, 26, 0.55);
      noise(ctx, w, h, g, 0.18, 0.4, 2);
    };
  }

  function metal(base, seed, dirt2) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      blobs(ctx, w, h, g, 30, dirt2 || ['80,70,50', '150,140,120', '60,54,44'], 6, 30, 0.35);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = 'rgba(120,60,30,0.4)';
        ctx.fillRect(g() * w, g() * h, 1 + g() * 3, 2 + g() * 10);
      }
      noise(ctx, w, h, g, 0.15, 0.35, 2);
    };
  }

  function camo(ctx, w, h) {
    const g = rand(18);
    ctx.fillStyle = '#6d7a3e';
    ctx.fillRect(0, 0, w, h);
    const cols = ['#b8a85a', '#4a5a2a', '#8a6a3a', '#a8b060'];
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath();
      const x = g() * w, y = g() * h, r = 8 + g() * 22;
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2, rr = r * (0.6 + g() * 0.6);
        if (k === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.fill();
    }
    noise(ctx, w, h, g, 0.15, 0.3, 2);
  }

  function leaves(cols, seed, dense) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.clearRect(0, 0, w, h);
      const n = dense || 900;
      for (let i = 0; i < n; i++) {
        const a = g() * Math.PI * 2, rr = Math.sqrt(g()) * 0.48;
        const x = w * (0.5 + Math.cos(a) * rr), y = h * (0.5 + Math.sin(a) * rr * 0.96);
        ctx.fillStyle = cols[Math.floor(g() * cols.length)];
        ctx.beginPath();
        ctx.ellipse(x, y, 2 + g() * 4, 1.5 + g() * 3, g() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };
  }

  function poplar(ctx, w, h) {
    const g = rand(21);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#3a3026';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2, h);
    ctx.lineTo(w / 2, h * 0.1);
    ctx.stroke();
    for (let i = 0; i < 26; i++) {
      const y = h * (0.15 + g() * 0.7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, y);
      ctx.lineTo(w / 2 + (g() - 0.5) * w * 0.7, y - g() * h * 0.12);
      ctx.stroke();
    }
    const cols = ['#6e5a36', '#80683e', '#5a4a30', '#8e7448', '#4a3e2a', '#66603a', '#3e3a2c'];
    for (let i = 0; i < 1300; i++) {
      const y = h * (0.04 + Math.pow(g(), 0.9) * 0.82);
      const k = Math.sin((y / h) * Math.PI * 0.95 + 0.1);
      const x = w / 2 + (g() - 0.5) * w * 0.86 * k;
      ctx.fillStyle = cols[Math.floor(g() * cols.length)];
      ctx.beginPath();
      ctx.ellipse(x, y, 1.5 + g() * 3, 1 + g() * 2.5, g() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function branches(ctx, w, h) {
    const g = rand(22);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#4a4038';
    ctx.lineCap = 'round';
    const limb = (x, y, a, l, wd, d) => {
      if (d > 6 || l < 4) return;
      const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l;
      ctx.lineWidth = wd;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(a + 0.4) * l * 0.5, y + Math.sin(a + 0.4) * l * 0.5, x2, y2);
      ctx.stroke();
      const k = 2 + (g() < 0.4 ? 1 : 0);
      for (let i = 0; i < k; i++) limb(x2, y2, a + (g() - 0.5) * 1.4, l * (0.6 + g() * 0.2), Math.max(1, wd * 0.62), d + 1);
    };
    limb(w / 2, h, -Math.PI / 2, h * 0.32, 10, 0);
  }

  function tuft(ctx, w, h) {
    const g = rand(23);
    ctx.clearRect(0, 0, w, h);
    const cols = ['#7a6438', '#8a7040', '#5e4e2e', '#94784a', '#5a5232'];
    for (let i = 0; i < 70; i++) {
      const x = w * (0.1 + g() * 0.8), l = h * (0.4 + g() * 0.6);
      ctx.strokeStyle = cols[Math.floor(g() * cols.length)];
      ctx.lineWidth = 1 + g() * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.quadraticCurveTo(x + (g() - 0.5) * 10, h - l * 0.6, x + (g() - 0.5) * 26, h - l);
      ctx.stroke();
    }
  }

  function bush(ctx, w, h) {
    const g = rand(24);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#3c3024';
    for (let i = 0; i < 40; i++) {
      ctx.lineWidth = 1 + g() * 2;
      ctx.beginPath();
      const x = w * (0.3 + g() * 0.4);
      ctx.moveTo(x, h);
      ctx.lineTo(x + (g() - 0.5) * w * 0.9, h * (0.1 + g() * 0.5));
      ctx.stroke();
    }
    const cols = ['#7a5430', '#8e6236', '#5e4428', '#9a7040', '#6a5a30'];
    for (let i = 0; i < 1100; i++) {
      const a = g() * Math.PI, rr = Math.sqrt(g());
      const x = w / 2 + Math.cos(a) * rr * w * 0.48, y = h - Math.sin(a) * rr * h * 0.92;
      ctx.fillStyle = cols[Math.floor(g() * cols.length)];
      ctx.fillRect(x, y, 2 + g() * 2, 2 + g() * 2);
    }
  }

  function wireFence(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(70,64,58,1)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      const y = (i / 6) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (i % 2 ? 2 : -2));
      ctx.stroke();
      for (let x = 6; x < w; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 3);
        ctx.lineTo(x + 3, y + 3);
        ctx.moveTo(x + 3, y - 3);
        ctx.lineTo(x - 3, y + 3);
        ctx.stroke();
      }
    }
  }

  function bark(ctx, w, h) {
    const g = rand(25);
    ctx.fillStyle = '#4a4036';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      ctx.strokeStyle = g() < 0.5 ? 'rgba(20,16,12,0.6)' : 'rgba(120,110,96,0.4)';
      ctx.lineWidth = 1 + g() * 2;
      const x = g() * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + (g() - 0.5) * 8, h * 0.3, x + (g() - 0.5) * 8, h * 0.6, x + (g() - 0.5) * 6, h);
      ctx.stroke();
    }
    noise(ctx, w, h, g, 0.2, 0.3, 2);
  }

  function washer(ctx, w, h) {
    ctx.fillStyle = '#f2f2f4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d8d8dc';
    ctx.fillRect(0, 0, w, h * 0.16);
    ctx.fillStyle = '#9a9aa2';
    ctx.fillRect(w * 0.08, h * 0.05, w * 0.3, h * 0.06);
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.08, h * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c4c4ca';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.56, w * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a6068';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.56, w * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,210,220,0.5)';
    ctx.beginPath();
    ctx.arc(w * 0.44, h * 0.5, w * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  function canLid(ctx, w, h) {
    ctx.fillStyle = '#9a9c96';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    for (let i = 10; i > 0; i--) {
      ctx.fillStyle = i % 2 ? '#8a8c86' : '#b4b6ae';
      ctx.beginPath();
      ctx.arc(cx, cy, (i / 10) * w * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#7a7c74';
    ctx.font = `bold ${Math.round(w * 0.07)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('ГОСТ 5284', cx, cy - w * 0.02);
    ctx.fillText('1999', cx, cy + w * 0.07);
  }

  function canSide(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    for (let i = 0; i <= 12; i++) gr.addColorStop(i / 12, i % 2 ? '#c8cac4' : '#8e908a');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    const g = rand(31);
    noise(ctx, w, h, g, 0.12, 0.2, 2);
  }

  function skinGreen(ctx, w, h) {
    const g = rand(41);
    ctx.fillStyle = '#5fb431';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, g, 26, ['150,220,70', '40,120,30', '120,200,50', '60,140,30'], 8, 30, 0.45);
    noise(ctx, w, h, g, 0.08, 0.2, 2);
  }

  function ogreFace(ctx, w, h) {
    skinGreen(ctx, w, h);
    const cx = w / 2;
    ctx.fillStyle = 'rgba(30,80,20,0.55)';
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.38, w * 0.3, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    [-1, 1].forEach(s => {
      ctx.fillStyle = '#f0e6a0';
      ctx.beginPath();
      ctx.ellipse(cx + s * w * 0.12, h * 0.44, w * 0.07, h * 0.04, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a10';
      ctx.beginPath();
      ctx.arc(cx + s * w * 0.12, h * 0.445, w * 0.022, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2a4a14';
      ctx.lineWidth = w * 0.03;
      ctx.beginPath();
      ctx.moveTo(cx + s * w * 0.03, h * 0.38);
      ctx.lineTo(cx + s * w * 0.22, h * 0.35);
      ctx.stroke();
    });
    ctx.fillStyle = 'rgba(40,90,20,0.6)';
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.56, w * 0.07, h * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a1a14';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.17, h * 0.69);
    ctx.quadraticCurveTo(cx, h * 0.64, cx + w * 0.17, h * 0.69);
    ctx.quadraticCurveTo(cx, h * 0.75, cx - w * 0.17, h * 0.69);
    ctx.fill();
    ctx.fillStyle = '#f2ecd0';
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(cx + s * w * 0.12, h * 0.69);
      ctx.lineTo(cx + s * w * 0.15, h * 0.6);
      ctx.lineTo(cx + s * w * 0.09, h * 0.68);
      ctx.fill();
    });
  }

  function loin(ctx, w, h) {
    const g = rand(42);
    ctx.fillStyle = '#b4401c';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, g, 20, ['220,90,40', '120,30,14', '240,130,60'], 6, 24, 0.45);
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(0, 0, w, h * 0.14);
    noise(ctx, w, h, g, 0.12, 0.3, 2);
  }

  function suit(ctx, w, h) {
    const g = rand(43);
    ctx.fillStyle = '#4a5f8a';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, g, 20, ['90,110,150', '40,54,84', '70,90,130'], 6, 26, 0.35);
    noise(ctx, w, h, g, 0.08, 0.3, 1);
  }

  function manFace(ctx, w, h) {
    const g = rand(44);
    ctx.fillStyle = '#c99a7c';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, g, 10, ['210,160,130', '170,120,96'], 10, 30, 0.35);
    const cx = w / 2;
    ctx.fillStyle = '#2a1e18';
    ctx.fillRect(0, 0, w, h * 0.3);
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.3, w * 0.36, h * 0.07, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = 'rgba(40,28,22,0.75)';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.3, h * 0.55);
    ctx.quadraticCurveTo(cx - w * 0.28, h * 0.92, cx, h * 0.95);
    ctx.quadraticCurveTo(cx + w * 0.28, h * 0.92, cx + w * 0.3, h * 0.55);
    ctx.quadraticCurveTo(cx + w * 0.16, h * 0.74, cx, h * 0.72);
    ctx.quadraticCurveTo(cx - w * 0.16, h * 0.74, cx - w * 0.3, h * 0.55);
    ctx.fill();
    [-1, 1].forEach(s => {
      ctx.fillStyle = '#2a1e18';
      ctx.fillRect(cx + s * w * 0.13 - w * 0.08, h * 0.38, w * 0.16, h * 0.025);
      ctx.fillStyle = '#f4ece4';
      ctx.beginPath();
      ctx.ellipse(cx + s * w * 0.13, h * 0.445, w * 0.055, h * 0.022, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2618';
      ctx.beginPath();
      ctx.arc(cx + s * w * 0.13, h * 0.447, w * 0.02, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(120,80,60,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, h * 0.47);
    ctx.lineTo(cx - w * 0.03, h * 0.6);
    ctx.lineTo(cx + w * 0.02, h * 0.61);
    ctx.stroke();
    ctx.fillStyle = '#7a4a40';
    ctx.fillRect(cx - w * 0.08, h * 0.68, w * 0.16, h * 0.022);
  }

  function shirt(ctx, w, h) {
    ctx.fillStyle = '#ecebf0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7a3a86';
    ctx.beginPath();
    ctx.moveTo(w * 0.44, 0);
    ctx.lineTo(w * 0.56, 0);
    ctx.lineTo(w * 0.53, h * 0.1);
    ctx.lineTo(w * 0.58, h * 0.85);
    ctx.lineTo(w * 0.5, h);
    ctx.lineTo(w * 0.42, h * 0.85);
    ctx.lineTo(w * 0.47, h * 0.1);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(w * 0.49, h * 0.12, w * 0.02, h * 0.7);
  }

  function glove(ctx, w, h) {
    const g = rand(45);
    ctx.fillStyle = '#26282c';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, g, 16, ['60,64,70', '20,20,24', '80,84,92'], 4, 18, 0.45);
    ctx.strokeStyle = 'rgba(90,94,100,0.6)';
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(g() * w, g() * h);
      ctx.lineTo(g() * w, g() * h);
      ctx.stroke();
    }
    noise(ctx, w, h, g, 0.15, 0.3, 2);
  }

  function sleeve(ctx, w, h) {
    const g = rand(46);
    ctx.fillStyle = '#4a4a32';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, g, 40, ['70,72,48', '40,38,28', '90,84,58', '58,62,40'], 4, 14, 0.6);
    noise(ctx, w, h, g, 0.2, 0.4, 2);
  }

  function wood(ctx, w, h) {
    const g = rand(47);
    ctx.fillStyle = '#9a5a26';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      ctx.strokeStyle = g() < 0.5 ? 'rgba(70,34,12,0.5)' : 'rgba(200,130,70,0.35)';
      ctx.lineWidth = 1 + g() * 2;
      const y = g() * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + (g() - 0.5) * 8, w * 0.7, y + (g() - 0.5) * 8, w, y + (g() - 0.5) * 6);
      ctx.stroke();
    }
    noise(ctx, w, h, g, 0.1, 0.2, 2);
  }

  function gunMetal(ctx, w, h) {
    const g = rand(48);
    ctx.fillStyle = '#25272a';
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, g, 18, ['60,64,70', '14,14,16', '80,80,84'], 4, 20, 0.4);
    noise(ctx, w, h, g, 0.12, 0.3, 2);
  }

  function shroud(ctx, w, h) {
    gunMetal(ctx, w, h);
    ctx.fillStyle = '#070708';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.ellipse(w * (0.1 + i * 0.13), h * 0.5, w * 0.045, h * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function flash(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
    gr.addColorStop(0, 'rgba(255,250,220,1)');
    gr.addColorStop(0.25, 'rgba(255,200,90,1)');
    gr.addColorStop(0.5, 'rgba(255,140,40,0.75)');
    gr.addColorStop(1, 'rgba(255,90,10,0)');
    ctx.fillStyle = gr;
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - 0.22) * w * 0.2, cy + Math.sin(a - 0.22) * h * 0.2);
      ctx.lineTo(cx + Math.cos(a) * w * 0.5, cy + Math.sin(a) * h * 0.5);
      ctx.lineTo(cx + Math.cos(a + 0.22) * w * 0.2, cy + Math.sin(a + 0.22) * h * 0.2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  function fire(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(51);
    const fw = w / 4;
    const tongue = (x, base, width, height, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x - width / 2, base);
      ctx.bezierCurveTo(x - width * 0.55, base - height * 0.45, x + (g() - 0.5) * width * 0.6, base - height * 0.7, x + (g() - 0.5) * width * 0.5, base - height);
      ctx.bezierCurveTo(x + width * 0.2, base - height * 0.65, x + width * 0.6, base - height * 0.35, x + width / 2, base);
      ctx.closePath();
      ctx.fill();
    };
    for (let f = 0; f < 4; f++) {
      const x0 = f * fw;
      for (let i = 0; i < 7; i++) tongue(x0 + fw * (0.2 + g() * 0.6), h * 0.98, fw * (0.18 + g() * 0.14), h * (0.45 + g() * 0.5), 'rgb(210,70,10)');
      for (let i = 0; i < 6; i++) tongue(x0 + fw * (0.28 + g() * 0.44), h * 0.98, fw * (0.14 + g() * 0.12), h * (0.35 + g() * 0.35), 'rgb(250,140,30)');
      for (let i = 0; i < 4; i++) tongue(x0 + fw * (0.36 + g() * 0.28), h * 0.98, fw * (0.1 + g() * 0.1), h * (0.2 + g() * 0.25), 'rgb(255,220,120)');
    }
  }

  function smoke(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(52);
    for (let i = 0; i < 18; i++) {
      const x = w * (0.3 + g() * 0.4), y = h * (0.3 + g() * 0.4), r = w * (0.12 + g() * 0.2);
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(200,196,190,0.9)');
      gr.addColorStop(1, 'rgba(200,196,190,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  function hudText(ctx, x, y, text, size, col, bold) {
    ctx.font = `${bold ? 'bold ' : ''}${size}px "Courier New", monospace`;
    ctx.lineWidth = Math.max(2, size * 0.18);
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = col;
    ctx.fillText(text, x, y);
  }

  function hint(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.textBaseline = 'top';
    hudText(ctx, 6, 4, 'Некоторые сталкеры не захотят говорить, если Вы будете тыкать им оружием в лицо. Чтобы спрятать оружие, достаточно', 21, '#eeeee6', true);
    hudText(ctx, 6, 32, 'выбрать болт (6).', 21, '#eeeee6', true);
  }

  function label(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    hudText(ctx, w - 6, 4, 'Флинт', 26, '#e8e070', true);
    hudText(ctx, w - 6, 36, 'Одиночка', 26, '#e8e070', true);
  }

  function pda(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(40,40,36,0.9)';
    ctx.fillRect(4, 8, 118, 56);
    ctx.strokeStyle = '#a8a89c';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 8, 118, 56);
    ctx.fillStyle = '#6a6a60';
    ctx.beginPath();
    ctx.arc(63, 30, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9a9a90';
    ctx.fillRect(42, 40, 42, 22);
    ctx.fillStyle = '#c8c8be';
    ctx.beginPath();
    ctx.ellipse(56, 34, 6, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(70, 34, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.textBaseline = 'top';
    hudText(ctx, 140, 8, '05:45', 20, '#d8d8cc', false);
    hudText(ctx, 214, 8, 'Сообщение', 20, '#9a9a8e', false);
    hudText(ctx, 140, 34, 'Осторожней! Ты рядом с аномалиями. Используй болты, чтобы определить их границы.', 20, '#e4e4d8', false);
  }

  function crosshair(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(220,220,210,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(220,220,210,0.9)';
    ctx.fillRect(w / 2 - 1, h / 2 - 1, 2, 2);
  }

  function hit(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const gr = ctx.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, 'rgba(200,20,20,0)');
    gr.addColorStop(0.5, 'rgba(230,30,30,1)');
    gr.addColorStop(1, 'rgba(200,20,20,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.quadraticCurveTo(w / 2, -h * 0.2, w, h * 0.7);
    ctx.quadraticCurveTo(w / 2, h * 0.3, 0, h * 0.7);
    ctx.fill();
  }

  function busSide(ctx, w, h) {
    ctx.fillStyle = '#e8e4da';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3e6aa0';
    ctx.fillRect(0, h * 0.55, w, h * 0.45);
    ctx.fillStyle = '#2a3440';
    for (let i = 0; i < 6; i++) ctx.fillRect(w * (0.04 + i * 0.16), h * 0.12, w * 0.13, h * 0.34);
  }

  function carWhite(ctx, w, h) {
    metal('#c8c6bc', 61, ['120,90,60', '160,150,130', '90,70,50'])(ctx, w, h);
  }

  const DRAW = {
    sky: [1024, 512, sky],
    grass: [256, 256, grass],
    dirt: [256, 256, dirt],
    plankGrey: [256, 256, planks([128, 124, 116], 3, true)],
    plankGreySolid: [256, 256, planks([122, 118, 110], 4, false)],
    plankBlue: [256, 256, planks([92, 112, 132], 5, false, 1.4)],
    plankTeal: [256, 256, planks([62, 108, 104], 6, false)],
    plankBrown: [256, 256, planks([128, 104, 76], 7, false)],
    brickRed: [256, 256, bricks('#8a6e60', ['#a85a46', '#b8664e', '#9a4e3c', '#c27a62'], 8)],
    brickYellow: [256, 256, bricks('#a89a80', ['#c8b07a', '#b89e6a', '#d0bc8a', '#a88e5e'], 9)],
    brickPink: [256, 256, bricks('#a0827a', ['#c08070', '#b07466', '#ca9284', '#a46a5e'], 10)],
    plaster: [256, 256, plaster],
    slate: [256, 256, slate],
    tin: [256, 256, rust('#8a5034', 16, false)],
    rustHorn: [256, 256, rust('#b06a34', 17, true)],
    khaki: [256, 256, metal('#9a9258', 19, ['80,76,44', '150,140,96', '110,90,56'])],
    yellowMetal: [256, 256, metal('#c09a3a', 20, ['120,90,40', '200,170,90', '90,70,30'])],
    camo: [256, 256, camo],
    carWhite: [256, 256, carWhite],
    cistern: [256, 256, rust('#a8807a', 26, false)],
    bus: [256, 128, busSide],
    bark: [128, 256, bark],
    leavesAutumn: [256, 256, leaves(['#8a6a34', '#a07a3a', '#6e5a30', '#b08848', '#5a4a2a'], 27)],
    leavesGreen: [256, 256, leaves(['#3e5a2a', '#4a6a30', '#2e4620', '#5a7438', '#38502a'], 28, 1200)],
    leavesDark: [256, 256, leaves(['#2e3e24', '#3a4a2a', '#24321c', '#46562e'], 29, 1200)],
    poplar: [128, 512, poplar],
    branches: [256, 256, branches],
    tuft: [128, 128, tuft],
    bush: [256, 256, bush],
    wire: [256, 128, wireFence],
    washer: [128, 128, washer],
    canLid: [256, 256, canLid],
    canSide: [256, 64, canSide],
    skinGreen: [128, 128, skinGreen],
    ogreFace: [256, 256, ogreFace],
    loin: [128, 128, loin],
    suit: [128, 128, suit],
    manFace: [256, 256, manFace],
    shirt: [128, 128, shirt],
    glove: [128, 128, glove],
    sleeve: [128, 128, sleeve],
    wood: [256, 128, wood],
    gunMetal: [128, 128, gunMetal],
    shroud: [256, 64, shroud],
    flash: [128, 128, flash],
    fire: [512, 128, fire],
    smoke: [128, 128, smoke],
    hint: [1536, 64, hint],
    label: [256, 72, label],
    pda: [1024, 72, pda],
    crosshair: [32, 32, crosshair],
    hit: [128, 32, hit]
  };

  const CLAMP = { sky: false, hint: true, label: true, pda: true, crosshair: true, hit: true, flash: true, smoke: true, washer: true, canLid: true, ogreFace: true, manFace: true, shirt: true };

  function textures(r) {
    const cache = {};
    return new Proxy({}, {
      get(_, key) {
        if (!cache[key]) {
          const d = DRAW[key];
          if (!d) return null;
          cache[key] = r.texture(d[0], d[2], { height: d[1], clamp: !!CLAMP[key] });
        }
        return cache[key];
      }
    });
  }

  window.ParadArt = { DRAW, textures };
})();
