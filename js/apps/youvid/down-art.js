(function () {
  const { rand } = window.P3D;

  function speckle(ctx, w, h, g, amount, density, size) {
    const count = Math.floor(w * h * (density || 0.25));
    for (let i = 0; i < count; i++) {
      const a = amount * g();
      ctx.fillStyle = g() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 0.7})`;
      const s = size || 2;
      ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1 + Math.floor(g() * s), 1 + Math.floor(g() * s));
    }
  }

  function stains(ctx, w, h, g, n, cols, r0, r1, alpha) {
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

  function streaks(ctx, w, h, g, n, col, alpha) {
    for (let i = 0; i < n; i++) {
      const x = g() * w, y = g() * h * 0.6, len = h * (0.1 + g() * 0.5), wd = 1 + g() * 4;
      const gr = ctx.createLinearGradient(0, y, 0, y + len);
      gr.addColorStop(0, `rgba(${col},${alpha})`);
      gr.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(x, y, wd, len);
    }
  }

  function solid(base, seed, cols, amount) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      stains(ctx, w, h, g, 30, cols, 8, 40, 0.4);
      speckle(ctx, w, h, g, amount || 0.12, 0.3, 2);
    };
  }

  function cloud(ctx, x, y, rw, rh, col, alpha, w) {
    for (const ox of [-w, 0, w]) {
      const gr = ctx.createRadialGradient(x + ox, y, 0, x + ox, y, rw);
      gr.addColorStop(0, `rgba(${col},${alpha})`);
      gr.addColorStop(1, `rgba(${col},0)`);
      ctx.save();
      ctx.translate(x + ox, y);
      ctx.scale(1, rh / rw);
      ctx.translate(-(x + ox), -y);
      ctx.fillStyle = gr;
      ctx.fillRect(x + ox - rw, y - rw, rw * 2, rw * 2);
      ctx.restore();
    }
  }

  function sky(stops, dark, light, seed, n) {
    return (ctx, w, h) => {
      const g = rand(seed);
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      stops.forEach(([k, c]) => gr.addColorStop(k, c));
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < (n || 70); i++) {
        const x = g() * w, y = h * (0.04 + Math.pow(g(), 0.75) * 0.82), rw = 40 + g() * 170, rh = 10 + g() * 44;
        const d = g() < 0.6;
        cloud(ctx, x, y, rw, rh, d ? dark : light, d ? 0.5 : 0.38, w);
      }
      for (let i = 0; i < 24; i++) cloud(ctx, g() * w, h * (0.6 + g() * 0.28), 30 + g() * 90, 9 + g() * 14, light, 0.4, w);
    };
  }

  function bricks(mortar, cols, seed, rows) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = mortar;
      ctx.fillRect(0, 0, w, h);
      const n = rows || 16, bh = h / n, bw = bh * 2.6;
      for (let j = 0; j < n; j++) {
        const off = (j % 2) * bw / 2;
        for (let x = -bw; x < w + bw; x += bw) {
          ctx.fillStyle = cols[Math.floor(g() * cols.length)];
          ctx.fillRect(x + off + 1, j * bh + 1, bw - 2, bh - 2);
        }
      }
      stains(ctx, w, h, g, 18, ['60,40,30', '200,180,160', '40,40,40'], 10, 50, 0.3);
      speckle(ctx, w, h, g, 0.15, 0.3, 2);
    };
  }

  function planks(base, seed, n, gap, vertical) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = `rgb(${base.join(',')})`;
      ctx.fillRect(0, 0, w, h);
      const k = n || 8, s = (vertical ? w : h) / k;
      for (let i = 0; i < k; i++) {
        const v = 0.8 + g() * 0.35;
        ctx.fillStyle = `rgb(${base.map(c => Math.min(255, Math.round(c * v))).join(',')})`;
        if (vertical) ctx.fillRect(i * s + 1, 0, s - 2, h); else ctx.fillRect(0, i * s + 1, w, s - 2);
        ctx.fillStyle = `rgba(0,0,0,${gap || 0.6})`;
        if (vertical) ctx.fillRect(i * s, 0, 2, h); else ctx.fillRect(0, i * s, w, 2);
        for (let q = 0; q < 14; q++) {
          ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,255,255'},${0.08 + g() * 0.1})`;
          if (vertical) ctx.fillRect(i * s + g() * s, g() * h, 1, 20 + g() * 60); else ctx.fillRect(g() * w, i * s + g() * s, 20 + g() * 60, 1);
        }
      }
      stains(ctx, w, h, g, 16, ['40,34,28', '160,150,130'], 10, 40, 0.3);
      speckle(ctx, w, h, g, 0.12, 0.25, 2);
    };
  }

  function tiles(ctx, w, h) {
    const g = rand(301);
    ctx.fillStyle = '#1c2523';
    ctx.fillRect(0, 0, w, h);
    const n = 6, s = w / n;
    for (let j = 0; j < n * 2; j++) {
      for (let i = 0; i < n; i++) {
        const v = 40 + g() * 26;
        const x = i * s + s / 2, y = j * s / 2 + s / 4;
        const gr = ctx.createRadialGradient(x - s * 0.12, y - s * 0.1, s * 0.05, x, y, s * 0.46);
        gr.addColorStop(0, `rgb(${v + 22},${v + 32},${v + 28})`);
        gr.addColorStop(1, `rgb(${v - 18},${v - 8},${v - 10})`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.ellipse(x, y, s * 0.46, s * 0.23, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    stains(ctx, w, h, g, 26, ['10,12,10', '70,60,40', '30,40,36'], 10, 60, 0.45);
    streaks(ctx, w, h, g, 40, '20,16,10', 0.35);
    speckle(ctx, w, h, g, 0.15, 0.3, 2);
  }

  function cloth(ctx, w, h) {
    const g = rand(302);
    const gr = ctx.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#6a6c62');
    gr.addColorStop(0.5, '#9a9a8c');
    gr.addColorStop(1, '#6e6e64');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const x = g() * w, wd = 4 + g() * 16;
      const gg = ctx.createLinearGradient(x, 0, x + wd, 0);
      gg.addColorStop(0, 'rgba(30,30,26,0)');
      gg.addColorStop(0.5, `rgba(30,30,26,${0.25 + g() * 0.3})`);
      gg.addColorStop(1, 'rgba(30,30,26,0)');
      ctx.fillStyle = gg;
      ctx.fillRect(x, 0, wd, h);
    }
    stains(ctx, w, h, g, 30, ['60,56,40', '120,110,80', '40,40,36'], 10, 60, 0.35);
    ctx.save();
    ctx.translate(w * 0.5, h * 0.3);
    ctx.strokeStyle = 'rgba(236,236,226,0.85)';
    ctx.fillStyle = 'rgba(236,236,226,0.85)';
    ctx.lineWidth = w * 0.012;
    ctx.strokeRect(-w * 0.16, -h * 0.07, w * 0.32, h * 0.14);
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.005, w * 0.05, h * 0.045, 0, 0, Math.PI * 2);
    ctx.stroke();
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.arc(s * w * 0.02, -h * 0.01, w * 0.012, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillRect(-w * 0.012, h * 0.018, w * 0.024, h * 0.02);
    ctx.font = `bold ${Math.round(h * 0.022)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('ZONE  WORKS', 0, h * 0.06);
    ctx.restore();
    speckle(ctx, w, h, g, 0.12, 0.3, 2);
  }

  function rustMetal(base, seed, rust) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      stains(ctx, w, h, g, 34, rust || ['120,70,40', '80,50,30', '150,100,60'], 6, 36, 0.45);
      streaks(ctx, w, h, g, 30, '90,50,30', 0.3);
      speckle(ctx, w, h, g, 0.15, 0.3, 2);
    };
  }

  function corrugated(base, seed, rust) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      const n = 24, s = w / n;
      for (let i = 0; i < n; i++) {
        const gr = ctx.createLinearGradient(i * s, 0, (i + 1) * s, 0);
        gr.addColorStop(0, 'rgba(0,0,0,0.35)');
        gr.addColorStop(0.45, 'rgba(255,255,255,0.12)');
        gr.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = gr;
        ctx.fillRect(i * s, 0, s, h);
      }
      stains(ctx, w, h, g, 30, rust, 8, 50, 0.4);
      streaks(ctx, w, h, g, 40, rust[0], 0.35);
      speckle(ctx, w, h, g, 0.1, 0.25, 2);
    };
  }

  function concrete(base, seed, seams) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      stains(ctx, w, h, g, 36, ['70,70,66', '140,140,134', '90,80,66', '50,54,50'], 10, 56, 0.35);
      streaks(ctx, w, h, g, 30, '40,40,36', 0.3);
      if (seams) {
        ctx.fillStyle = 'rgba(20,20,18,0.55)';
        ctx.fillRect(0, 0, w, 3);
        ctx.fillRect(0, 0, 3, h);
        ctx.fillRect(0, h / 2, w, 2);
      }
      speckle(ctx, w, h, g, 0.14, 0.35, 2);
    };
  }

  function cracked(base, seed, lines) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      stains(ctx, w, h, g, 40, ['60,58,56', '110,108,104', '80,70,60'], 8, 46, 0.35);
      ctx.strokeStyle = 'rgba(30,28,26,0.6)';
      for (let i = 0; i < (lines || 18); i++) {
        ctx.lineWidth = 1 + g();
        let x = g() * w, y = g() * h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 6; k++) { x += (g() - 0.5) * 50; y += (g() - 0.5) * 50; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      speckle(ctx, w, h, g, 0.16, 0.4, 2);
    };
  }

  function field(cols, seed, blades) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = cols[0];
      ctx.fillRect(0, 0, w, h);
      stains(ctx, w, h, g, 50, cols.slice(1).map(c => c), 8, 40, 0.5);
      for (let i = 0; i < (blades || 900); i++) {
        const x = g() * w, y = g() * h, l = 4 + g() * 10;
        ctx.strokeStyle = `rgba(${g() < 0.5 ? '30,24,10' : '200,170,110'},${0.2 + g() * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (g() - 0.5) * 4, y - l);
        ctx.stroke();
      }
      speckle(ctx, w, h, g, 0.12, 0.3, 2);
    };
  }

  function fabric(base, seed, cols, seams) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      stains(ctx, w, h, g, 26, cols, 6, 26, 0.45);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(0,0,0,${0.05 + g() * 0.12})`;
        ctx.fillRect(g() * w, g() * h, 1 + g() * 3, 6 + g() * 30);
      }
      if (seams) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        seams.forEach(([x0, y0, x1, y1]) => ctx.fillRect(x0 * w, y0 * h, Math.max(2, (x1 - x0) * w), Math.max(2, (y1 - y0) * h)));
      }
      speckle(ctx, w, h, g, 0.14, 0.35, 2);
    };
  }

  function exo(ctx, w, h) {
    const g = rand(311);
    ctx.fillStyle = '#2e3032';
    ctx.fillRect(0, 0, w, h);
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        const v = 52 + g() * 24;
        ctx.fillStyle = `rgb(${v},${v + 2},${v + 4})`;
        ctx.fillRect(i * w / 4 + 3, j * h / 4 + 3, w / 4 - 6, h / 4 - 6);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(i * w / 4 + 3, j * h / 4 + 3, w / 4 - 6, 3);
      }
    }
    stains(ctx, w, h, g, 20, ['20,20,20', '90,90,86'], 6, 26, 0.4);
    speckle(ctx, w, h, g, 0.15, 0.3, 2);
  }

  function gasmask(ctx, w, h) {
    const g = rand(312);
    ctx.fillStyle = '#26282a';
    ctx.fillRect(0, 0, w, h);
    stains(ctx, w, h, g, 14, ['50,52,54', '14,14,14'], 6, 26, 0.5);
    [0.36, 0.64].forEach(x => {
      ctx.fillStyle = '#8a8e88';
      ctx.beginPath();
      ctx.arc(w * x, h * 0.42, w * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a2422';
      ctx.beginPath();
      ctx.arc(w * x, h * 0.42, w * 0.075, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(200,220,210,0.35)';
      ctx.beginPath();
      ctx.arc(w * x - w * 0.02, h * 0.4, w * 0.025, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#3a3c3e';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.7, w * 0.09, 0, Math.PI * 2);
    ctx.fill();
    speckle(ctx, w, h, g, 0.12, 0.3, 2);
  }

  function faceSkin(base, seed, opts) {
    return (ctx, w, h) => {
      const o = opts || {};
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      stains(ctx, w, h, g, 10, ['200,150,120', '150,104,84'], 10, 30, 0.35);
      const cx = w / 2;
      if (o.stubble) {
        ctx.fillStyle = 'rgba(40,30,24,0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, h * 0.72, w * 0.2, h * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(60,40,30,0.85)';
      [-1, 1].forEach(s => ctx.fillRect(cx + s * w * 0.1 - w * 0.06, h * 0.38, w * 0.12, h * 0.025));
      ctx.fillStyle = '#efe6dc';
      [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(cx + s * w * 0.1, h * 0.45, w * 0.045, h * 0.02, 0, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = '#3a2a20';
      [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(cx + s * w * 0.1, h * 0.45, w * 0.018, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = 'rgba(120,70,50,0.5)';
      ctx.fillRect(cx - w * 0.02, h * 0.48, w * 0.04, h * 0.12);
      ctx.fillStyle = o.mouthOpen ? '#2a1410' : 'rgba(110,50,40,0.85)';
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.68, w * 0.07, o.mouthOpen ? h * 0.04 : h * 0.012, 0, 0, Math.PI * 2);
      ctx.fill();
      speckle(ctx, w, h, g, 0.06, 0.2, 2);
    };
  }

  function ogreFace(ctx, w, h) {
    const g = rand(321);
    ctx.fillStyle = '#9cb43c';
    ctx.fillRect(0, 0, w, h);
    stains(ctx, w, h, g, 24, ['170,196,80', '110,140,40', '140,170,60'], 8, 30, 0.45);
    const cx = w / 2;
    ctx.fillStyle = 'rgba(80,100,30,0.9)';
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(cx + s * w * 0.12, h * 0.36, w * 0.09, h * 0.022, s * -0.25, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#f2ecd8';
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(cx + s * w * 0.11, h * 0.43, w * 0.05, h * 0.03, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#5a3a1c';
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(cx + s * w * 0.105, h * 0.43, w * 0.022, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = 'rgba(90,110,40,0.7)';
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.55, w * 0.07, h * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a1a10';
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.72, w * 0.16, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(cx - w * 0.12, h * 0.655, w * 0.24, h * 0.02);
    ctx.fillStyle = '#b04a3a';
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.76, w * 0.08, h * 0.025, 0, 0, Math.PI * 2);
    ctx.fill();
    speckle(ctx, w, h, g, 0.06, 0.2, 2);
  }

  function chrome(ctx, w, h) {
    const g = rand(371);
    const gr = ctx.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#e4e6ea');
    gr.addColorStop(0.45, '#9aa0a8');
    gr.addColorStop(0.55, '#d0d4d8');
    gr.addColorStop(1, '#7a8088');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      ctx.strokeStyle = `rgba(${g() < 0.5 ? '40,40,44' : '255,255,255'},${0.1 + g() * 0.2})`;
      ctx.beginPath();
      const x = g() * w, y = g() * h;
      ctx.moveTo(x, y);
      ctx.lineTo(x + (g() - 0.5) * 30, y + (g() - 0.5) * 6);
      ctx.stroke();
    }
  }

  function lattice(col, seed, cells, bar) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = col;
      ctx.lineCap = 'square';
      const n = cells || 4, s = h / n, b = bar || 0.06;
      ctx.lineWidth = w * b;
      ctx.beginPath();
      ctx.moveTo(w * b / 2, 0); ctx.lineTo(w * b / 2, h);
      ctx.moveTo(w - w * b / 2, 0); ctx.lineTo(w - w * b / 2, h);
      ctx.stroke();
      ctx.lineWidth = w * b * 0.55;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        ctx.moveTo(0, i * s); ctx.lineTo(w, i * s);
        ctx.moveTo(0, i * s); ctx.lineTo(w, (i + 1) * s);
      }
      ctx.stroke();
      const g = rand(seed);
      ctx.globalCompositeOperation = 'source-atop';
      stains(ctx, w, h, g, 20, ['60,30,20', '20,20,20', '140,90,60'], 6, 30, 0.5);
      ctx.globalCompositeOperation = 'source-over';
    };
  }

  function wheelRim(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = w * 0.48;
    ctx.strokeStyle = '#5a3a2c';
    ctx.lineWidth = w * 0.012;
    [R, R * 0.93].forEach(rr => { ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke(); });
    ctx.lineWidth = w * 0.006;
    for (let i = 0; i < 64; i++) {
      const a0 = i / 64 * Math.PI * 2, a1 = (i + 1) / 64 * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
      ctx.lineTo(cx + Math.cos(a1) * R * 0.93, cy + Math.sin(a1) * R * 0.93);
      ctx.stroke();
    }
    ctx.lineWidth = w * 0.005;
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2;
      [-0.018, 0.018].forEach(d => {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a + d * 3) * w * 0.04, cy + Math.sin(a + d * 3) * w * 0.04);
        ctx.lineTo(cx + Math.cos(a + d) * R * 0.93, cy + Math.sin(a + d) * R * 0.93);
        ctx.stroke();
      });
    }
    ctx.fillStyle = '#4a3226';
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }

  function cabin(ctx, w, h) {
    const g = rand(331);
    ctx.fillStyle = '#c8a628';
    ctx.fillRect(0, 0, w, h);
    stains(ctx, w, h, g, 30, ['140,96,30', '200,170,60', '90,70,40'], 6, 26, 0.5);
    ctx.fillStyle = 'rgba(40,30,20,0.75)';
    for (let i = 0; i < 4; i++) ctx.fillRect(w * (0.06 + i * 0.235), h * 0.2, w * 0.18, h * 0.34);
    ctx.fillStyle = 'rgba(90,60,30,0.6)';
    ctx.fillRect(0, h * 0.6, w, h * 0.05);
    streaks(ctx, w, h, g, 30, '110,60,30', 0.45);
    speckle(ctx, w, h, g, 0.15, 0.3, 2);
  }

  function letters(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `bold ${Math.round(h * 0.95)}px "Arial Black", Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#d8dadc');
    gr.addColorStop(1, '#8e9294');
    ctx.fillStyle = gr;
    ctx.fillText('ЧАЭС', w / 2, h * 0.54);
  }

  function signBoard(ctx, w, h) {
    const g = rand(341);
    ctx.fillStyle = '#c8cac6';
    ctx.fillRect(0, 0, w, h);
    stains(ctx, w, h, g, 16, ['120,120,114', '200,200,196', '90,84,76'], 6, 30, 0.35);
    ctx.fillStyle = '#2c3a5a';
    ctx.font = `bold ${Math.round(h * 0.42)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('имени  В.И. Ленина', w / 2, h * 0.52);
    speckle(ctx, w, h, g, 0.1, 0.3, 2);
  }

  function stack(ctx, w, h) {
    const g = rand(342);
    const n = 8;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? '#b4b6b4' : '#a45a4a';
      ctx.fillRect(0, i * h / n, w, h / n);
    }
    ctx.fillStyle = 'rgba(40,40,40,0.35)';
    for (let i = 0; i < 40; i++) ctx.fillRect(g() * w, g() * h, w * 0.02, h * 0.01);
    stains(ctx, w, h, g, 20, ['80,70,60', '150,150,150'], 6, 30, 0.35);
  }

  function sarcophagus(ctx, w, h) {
    const g = rand(343);
    ctx.fillStyle = '#8e9496';
    ctx.fillRect(0, 0, w, h);
    const n = 10;
    for (let i = 0; i < n; i++) {
      const x = i * w / n;
      const gr = ctx.createLinearGradient(x, 0, x + w / n, 0);
      gr.addColorStop(0, 'rgba(60,64,66,0.6)');
      gr.addColorStop(0.2, 'rgba(180,186,188,0.25)');
      gr.addColorStop(0.8, 'rgba(120,126,128,0.1)');
      gr.addColorStop(1, 'rgba(50,54,56,0.55)');
      ctx.fillStyle = gr;
      ctx.fillRect(x, 0, w / n, h);
    }
    streaks(ctx, w, h, g, 60, '80,60,44', 0.35);
    stains(ctx, w, h, g, 26, ['70,74,76', '150,154,156'], 10, 50, 0.3);
    speckle(ctx, w, h, g, 0.12, 0.3, 2);
  }

  function titleBox(lines, size) {
    return (ctx, w, h) => {
      const g = rand(lines.join('').length * 7 + 3);
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, w, h);
      const fs = Math.round(h * (size || (lines.length > 1 ? 0.4 : 0.74)));
      ctx.font = `${fs}px Impact, "Arial Black", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f2f2ee';
      lines.forEach((l, i) => {
        const y = h * (lines.length > 1 ? 0.28 + i * 0.46 : 0.53);
        const tw = ctx.measureText(l).width;
        const sx = Math.min(1, (w * 0.94) / tw);
        ctx.save();
        ctx.translate(w / 2, y);
        ctx.scale(sx, 1);
        ctx.fillText(l, 0, 0);
        ctx.restore();
      });
      ctx.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < w * h * 0.03; i++) {
        ctx.fillStyle = `rgba(5,5,5,${0.4 + g() * 0.6})`;
        const s = 1 + g() * 2.5;
        ctx.fillRect(g() * w, g() * h, s, s);
      }
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = 'rgba(5,5,5,0.85)';
        ctx.fillRect(g() * w, g() * h, 2 + g() * 14, 1 + g() * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
    };
  }

  const TITLES = {
    classic: { lines: ['THE CLASSIC ZONE,', 'OUTMODED AND DOWNGRADED'], w: 517, h: 109 },
    downgrade: { lines: ['DOWNGRADE EDITION'], w: 365, h: 60 },
    original640: { lines: ['ORIGINAL', '640X320'], w: 173, h: 106 },
    downgrade8k: { lines: ['DOWNGRADE EDITION 8K'], w: 415, h: 58 },
    controller: { lines: ['CONTROLLER SUPPORT'], w: 402, h: 60 },
    voice: { lines: ['RUSSIAN VOICE ACTING CUT'], w: 472, h: 60 },
    original: { lines: ['ORIGINAL'], w: 164, h: 58 },
    bugs: { lines: ['OLD AND NEW BUGS AND GLITCHES'], w: 592, h: 61 },
    decom: { lines: ['DECOMMUNIZATION'], w: 330, h: 60 },
    deind: { lines: ['DEINDUSTRIALIZATION'], w: 380, h: 59 }
  };

  function hudText(ctx, x, y, text, size, col, opts) {
    const o = opts || {};
    ctx.font = `${o.bold ? 'bold ' : ''}${size}px ${o.font || 'Arial, sans-serif'}`;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'middle';
    if (o.stroke !== false) {
      ctx.lineWidth = Math.max(2, size * 0.16);
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = col;
    ctx.fillText(text, x, y);
  }

  function frameEdge(ctx, x, y, w, h, lw) {
    ctx.strokeStyle = 'rgba(150,132,104,0.95)';
    ctx.lineWidth = lw || 3;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(40,34,26,0.9)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    ctx.fillStyle = 'rgba(176,150,110,1)';
    [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, (lw || 3) * 1.6, 0, Math.PI * 2); ctx.fill(); });
  }

  function minimap(label, seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.clearRect(0, 0, w, h);
      const x0 = w * 0.06, y0 = h * 0.04, mw = w * 0.88, mh = h * 0.88;
      ctx.fillStyle = 'rgba(58,60,58,0.62)';
      ctx.fillRect(x0, y0, mw, mh);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, mw, mh);
      ctx.clip();
      for (let i = 0; i < 26; i++) {
        const v = 70 + g() * 40;
        ctx.fillStyle = `rgba(${v},${v + 4},${v},0.22)`;
        ctx.save();
        ctx.translate(x0 + g() * mw, y0 + g() * mh);
        ctx.rotate(g() * 3);
        ctx.fillRect(-10, -6, 8 + g() * 30, 5 + g() * 16);
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(150,150,140,0.35)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x0 + g() * mw, y0);
      ctx.bezierCurveTo(x0 + g() * mw, y0 + mh * 0.4, x0 + g() * mw, y0 + mh * 0.6, x0 + g() * mw, y0 + mh);
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = ['#e8d040', '#e8d040', '#d83030', '#60d040', '#e8d040'][i];
        ctx.beginPath();
        ctx.arc(x0 + mw * (0.25 + g() * 0.5), y0 + mh * (0.25 + g() * 0.5), w * 0.012, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#e8e8e0';
      ctx.beginPath();
      ctx.moveTo(x0 + mw * 0.5, y0 + mh * 0.45);
      ctx.lineTo(x0 + mw * 0.53, y0 + mh * 0.53);
      ctx.lineTo(x0 + mw * 0.47, y0 + mh * 0.53);
      ctx.fill();
      frameEdge(ctx, x0, y0, mw, mh, 3);
      ctx.fillStyle = 'rgba(30,28,24,0.9)';
      ctx.fillRect(x0 + mw * 0.04, y0 - h * 0.035, mw * 0.55, h * 0.07);
      ctx.strokeStyle = 'rgba(150,132,104,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x0 + mw * 0.04, y0 - h * 0.035, mw * 0.55, h * 0.07);
      if (label) hudText(ctx, x0 + mw * 0.1, y0, label, h * 0.06, '#e8e8e0', { stroke: false });
      ctx.fillStyle = 'rgba(30,28,24,0.95)';
      ctx.fillRect(x0 + mw * 0.84, y0 + mh * 0.95, mw * 0.14, h * 0.1);
      ctx.strokeStyle = 'rgba(150,132,104,0.9)';
      ctx.strokeRect(x0 + mw * 0.84, y0 + mh * 0.95, mw * 0.14, h * 0.1);
      hudText(ctx, x0 + mw * 0.91, y0 + mh * 0.95 + h * 0.05, '7', h * 0.07, '#e8c040', { align: 'center', stroke: false });
      ctx.fillStyle = '#c83030';
      ctx.beginPath();
      ctx.moveTo(x0 + mw * 0.9, y0 + mh * 0.82);
      ctx.lineTo(x0 + mw * 0.97, y0 + mh * 0.86);
      ctx.lineTo(x0 + mw * 0.91, y0 + mh * 0.9);
      ctx.fill();
      ctx.fillStyle = '#3050d0';
      ctx.beginPath();
      ctx.moveTo(x0 + mw * 0.9, y0 + mh * 0.82);
      ctx.lineTo(x0 + mw * 0.86, y0 + mh * 0.92);
      ctx.lineTo(x0 + mw * 0.91, y0 + mh * 0.9);
      ctx.fill();
    };
  }

  function battery(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(80,220,200,0.85)';
    ctx.lineWidth = h * 0.12;
    ctx.beginPath();
    ctx.roundRect(w * 0.06, h * 0.15, w * 0.82, h * 0.7, h * 0.18);
    ctx.stroke();
    ctx.fillStyle = 'rgba(80,220,200,0.35)';
    ctx.fillRect(w * 0.12, h * 0.3, w * 0.7, h * 0.4);
    ctx.fillStyle = 'rgba(80,220,200,0.85)';
    ctx.fillRect(w * 0.9, h * 0.35, w * 0.06, h * 0.3);
  }

  function silhouette(ctx, cx, by, s, pose) {
    ctx.fillStyle = '#3ee0d0';
    ctx.save();
    ctx.translate(cx, by);
    ctx.scale(s, s);
    ctx.beginPath();
    if (pose === 'stand') {
      ctx.arc(0, -92, 9, 0, Math.PI * 2);
      ctx.moveTo(-12, -80); ctx.lineTo(12, -80); ctx.lineTo(14, -40); ctx.lineTo(10, 0); ctx.lineTo(3, 0); ctx.lineTo(1, -36);
      ctx.lineTo(-2, 0); ctx.lineTo(-9, 0); ctx.lineTo(-12, -40); ctx.closePath();
    } else {
      ctx.arc(-6, -84, 9, 0, Math.PI * 2);
      ctx.moveTo(-18, -74); ctx.lineTo(4, -74); ctx.lineTo(36, -70); ctx.lineTo(36, -64); ctx.lineTo(8, -62); ctx.lineTo(6, -40);
      ctx.lineTo(18, -24); ctx.lineTo(16, 0); ctx.lineTo(8, 0); ctx.lineTo(8, -20); ctx.lineTo(-4, -32);
      ctx.lineTo(-14, -12); ctx.lineTo(-20, 0); ctx.lineTo(-28, 0); ctx.lineTo(-22, -16); ctx.lineTo(-16, -40); ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
  }

  function stance(pose) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(30,34,36,0.78)';
      ctx.fillRect(w * 0.22, h * 0.08, w * 0.56, h * 0.86);
      ctx.strokeStyle = 'rgba(70,110,110,0.5)';
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(w * 0.24, h * (0.12 + i * 0.09)); ctx.lineTo(w * 0.76, h * (0.12 + i * 0.09)); ctx.stroke(); }
      frameEdge(ctx, w * 0.22, h * 0.08, w * 0.56, h * 0.86, 2.5);
      silhouette(ctx, w * 0.5, h * 0.84, h / 175, pose);
      ctx.fillStyle = '#3ee0d0';
      for (let i = 0; i < 12; i++) ctx.fillRect(w * (0.27 + i * 0.04), h * 0.86, w * 0.025, h * 0.03);
      [[0.02, 0.11], [0.84, 0.11]].forEach(([x], i) => {
        ctx.fillStyle = 'rgba(60,60,56,0.9)';
        ctx.fillRect(w * x, h * 0.1, w * 0.15, h * 0.16);
        ctx.strokeStyle = 'rgba(160,150,130,0.9)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(w * x, h * 0.1, w * 0.15, h * 0.16);
        ctx.fillStyle = '#d8d8d0';
        ctx.beginPath();
        if (i === 0) { ctx.moveTo(w * (x + 0.03), h * 0.16); ctx.lineTo(w * (x + 0.07), h * 0.13); ctx.lineTo(w * (x + 0.07), h * 0.23); ctx.lineTo(w * (x + 0.03), h * 0.2); }
        else ctx.arc(w * (x + 0.075), h * 0.18, w * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(40,40,40,0.9)';
        ctx.fillRect(w * (x + 0.05), h * 0.3, w * 0.05, h * 0.62);
      });
      ctx.fillStyle = '#b050e0';
      ctx.fillRect(w * 0.075, h * 0.8, w * 0.05, h * 0.12);
      ctx.fillStyle = '#e8e8e0';
      ctx.fillRect(w * 0.885, h * 0.7, w * 0.05, h * 0.22);
    };
  }

  function bars(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    [[0.18, '#4048e8', '#8a90ff'], [0.62, '#e02020', '#ff7a6a']].forEach(([y, c0, c1], i) => {
      ctx.fillStyle = 'rgba(60,58,54,0.95)';
      ctx.fillRect(0, h * (y - 0.14), w * 0.16, h * 0.32);
      ctx.strokeStyle = 'rgba(170,160,140,0.9)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, h * (y - 0.14), w * 0.16, h * 0.32);
      ctx.fillStyle = '#d8d8d0';
      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(w * 0.05, h * (y - 0.08)); ctx.lineTo(w * 0.11, h * (y - 0.08)); ctx.lineTo(w * 0.11, h * (y + 0.04)); ctx.lineTo(w * 0.08, h * (y + 0.12)); ctx.lineTo(w * 0.05, h * (y + 0.04));
        ctx.fill();
      } else {
        ctx.fillRect(w * 0.072, h * (y - 0.08), w * 0.016, h * 0.18);
        ctx.fillRect(w * 0.05, h * (y - 0.002), w * 0.06, h * 0.03);
      }
      ctx.fillStyle = 'rgba(40,40,40,0.9)';
      ctx.fillRect(w * 0.2, h * (y - 0.06), w * 0.76, h * 0.12);
      const gr = ctx.createLinearGradient(0, h * (y - 0.06), 0, h * (y + 0.06));
      gr.addColorStop(0, c1);
      gr.addColorStop(0.5, c0);
      gr.addColorStop(1, c0);
      ctx.fillStyle = gr;
      ctx.fillRect(w * 0.21, h * (y - 0.05), w * 0.72, h * 0.1);
      ctx.fillStyle = 'rgba(150,140,120,0.95)';
      ctx.fillRect(w * 0.93, h * (y - 0.09), w * 0.04, h * 0.18);
    });
  }

  function ammo(text) {
    const [cal, count] = text.split('|');
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(40,42,44,0.85)';
      ctx.fillRect(w * 0.02, h * 0.22, w * 0.96, h * 0.74);
      frameEdge(ctx, w * 0.02, h * 0.22, w * 0.96, h * 0.74, 2);
      ctx.fillStyle = 'rgba(70,68,64,0.95)';
      ctx.fillRect(w * 0.18, h * 0.02, w * 0.66, h * 0.2);
      ctx.strokeStyle = 'rgba(150,132,104,0.9)';
      ctx.strokeRect(w * 0.18, h * 0.02, w * 0.66, h * 0.2);
      if (cal) hudText(ctx, w * 0.51, h * 0.12, cal, h * 0.15, '#d8d8d0', { align: 'center', stroke: false });
      if (count) {
        ctx.fillStyle = '#5a6a4a';
        ctx.fillRect(w * 0.12, h * 0.42, w * 0.3, h * 0.32);
        ctx.fillStyle = '#8a9a70';
        ctx.fillRect(w * 0.12, h * 0.42, w * 0.3, h * 0.07);
        ctx.fillStyle = '#c86a30';
        ctx.fillRect(w * 0.37, h * 0.5, w * 0.04, h * 0.18);
        hudText(ctx, w * 0.72, h * 0.6, count, h * 0.2, '#f0b020', { align: 'center', bold: true, stroke: false });
      }
    };
  }

  function belt(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    [[0.08, 0.5], [0.3, 0.85], [0.52, 0.85], [0.74, 0.5]].forEach(([x, s]) => {
      const gr = ctx.createRadialGradient(w * x, h * 0.5, 0, w * x, h * 0.5, h * 0.42 * s);
      gr.addColorStop(0, 'rgba(240,250,255,1)');
      gr.addColorStop(0.4, 'rgba(140,190,240,1)');
      gr.addColorStop(1, 'rgba(60,110,200,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(w * x, h * 0.5, h * 0.42 * s, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function crossDot(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(220,220,210,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(220,220,210,0.9)';
    ctx.fillRect(w / 2 - 1, h / 2 - 1, 2, 2);
  }

  function crossTicks(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(230,230,220,0.8)';
    const c = w / 2, a = w * 0.18, b = w * 0.42;
    ctx.fillRect(c - 1, c - b, 2, b - a);
    ctx.fillRect(c - 1, c + a, 2, b - a);
    ctx.fillRect(c - b, c - 1, b - a, 2);
    ctx.fillRect(c + a, c - 1, b - a, 2);
  }

  function rating(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const s = h * 0.78, x0 = (w - s) / 2, y0 = h * 0.015;
    ctx.fillStyle = '#c6f212';
    ctx.fillRect(x0, y0, s, s);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(s * 0.92)}px "Arial Black", Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(w / 2, y0 + s * 0.53);
    ctx.scale(0.82, 1);
    ctx.fillText('3', 0, 0);
    ctx.restore();
    ctx.font = `bold ${Math.round(s * 0.07)}px Arial`;
    ctx.fillStyle = '#000';
    ctx.fillText('TM', x0 + s * 0.92, y0 + s * 0.06);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.round(h * 0.11)}px Arial`;
    ctx.fillText('www.ratings3.info', w / 2, h * 0.9);
  }

  function caption(text, size, col) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      hudText(ctx, w * 0.01, h * 0.52, text, h * size, col, { stroke: false, font: 'Calibri, Arial, sans-serif' });
    };
  }

  function outDoor(ctx, w, h) {
    planks([128, 116, 96], 361, 6, 0.6, true)(ctx, w, h);
    const g = rand(362);
    ctx.fillStyle = 'rgba(90,74,56,0.95)';
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.72);
    ctx.fillRect(-w * 0.7, -h * 0.03, w * 1.4, h * 0.06);
    ctx.restore();
    ctx.fillRect(0, h * 0.12, w, h * 0.07);
    ctx.fillRect(0, h * 0.8, w, h * 0.07);
    ctx.fillStyle = '#120c08';
    ctx.beginPath();
    ctx.arc(w * 0.58, h * 0.24, w * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgb(128,116,96)';
    ctx.beginPath();
    ctx.arc(w * 0.63, h * 0.23, w * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2420';
    ctx.fillRect(w * 0.08, h * 0.5, w * 0.06, h * 0.1);
    stains(ctx, w, h, g, 10, ['60,50,40', '160,150,130'], 10, 40, 0.3);
  }

  function booth(ctx, w, h) {
    rustMetal('#c8a838', 363, ['150,110,40', '110,90,40', '200,180,80'])(ctx, w, h);
    ctx.fillStyle = 'rgba(70,40,30,0.85)';
    ctx.font = `bold ${Math.round(h * 0.2)}px "Arial Narrow", Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('СТОП-ПОВ.', w * 0.5, h * 0.42);
    ctx.fillText('НЕТ', w * 0.5, h * 0.66);
    ctx.fillStyle = 'rgba(30,30,30,0.9)';
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(w * 0.86, h * (0.2 + i * 0.18));
      ctx.rotate(-0.6);
      ctx.fillRect(-w * 0.04, -h * 0.02, w * 0.08, h * 0.04);
      ctx.restore();
    }
  }

  function rail(ctx, w, h) {
    ctx.fillStyle = '#e8e8e2';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a1a18';
    for (let i = -2; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w / 6, h);
      ctx.lineTo(i * w / 6 + w / 12, h);
      ctx.lineTo(i * w / 6 + w / 12 + h, 0);
      ctx.lineTo(i * w / 6 + h, 0);
      ctx.fill();
    }
  }

  function drop(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(40,170,60,0.85)';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.05);
    ctx.bezierCurveTo(w * 0.95, h * 0.55, w * 0.9, h * 0.95, w / 2, h * 0.95);
    ctx.bezierCurveTo(w * 0.1, h * 0.95, w * 0.05, h * 0.55, w / 2, h * 0.05);
    ctx.fill();
    ctx.fillStyle = 'rgba(10,60,20,0.9)';
    [[0.5, 0.45], [0.38, 0.65], [0.62, 0.65]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(w * x, h * y, w * 0.08, 0, Math.PI * 2); ctx.fill(); });
  }

  function redArc(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(220,30,40,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.02, h * 0.98);
    ctx.quadraticCurveTo(w * 0.55, -h * 0.2, w * 0.98, h * 0.35);
    ctx.stroke();
    ctx.fillStyle = 'rgba(220,30,40,0.9)';
    ctx.beginPath();
    ctx.moveTo(w * 0.32, h * 0.32); ctx.lineTo(w * 0.38, h * 0.22); ctx.lineTo(w * 0.36, h * 0.38);
    ctx.fill();
  }

  function invFrame(ctx, w, h) {
    const g = rand(364);
    ctx.clearRect(0, 0, w, h);
    const gr = ctx.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#3a3026');
    gr.addColorStop(0.5, '#8a7a62');
    gr.addColorStop(1, '#3a3026');
    ctx.fillStyle = gr;
    ctx.fillRect(w * 0.3, 0, w * 0.4, h);
    stains(ctx, w, h, g, 30, ['60,40,24', '150,120,80'], 4, 20, 0.5);
  }

  function gamepad(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const s = w / 220;
    ctx.save();
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(214,218,220,0.62)';
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(40, 30);
    ctx.bezierCurveTo(70, 18, 150, 18, 180, 30);
    ctx.bezierCurveTo(205, 40, 222, 110, 214, 128);
    ctx.bezierCurveTo(204, 146, 182, 134, 166, 112);
    ctx.bezierCurveTo(150, 100, 70, 100, 54, 112);
    ctx.bezierCurveTo(38, 134, 16, 146, 6, 128);
    ctx.bezierCurveTo(-2, 110, 15, 40, 40, 30);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(70,200,80,0.95)';
    ctx.beginPath();
    ctx.moveTo(36, 26); ctx.lineTo(50, 6); ctx.lineTo(62, 22); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath(); ctx.moveTo(160, 22); ctx.lineTo(172, 6); ctx.lineTo(186, 26); ctx.stroke();
    const ring = (x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.stroke(); };
    ring(58, 58, 16, 'rgba(190,192,194,0.8)');
    ring(58, 58, 10, 'rgba(70,70,72,0.85)');
    ring(138, 88, 16, 'rgba(190,192,194,0.8)');
    ring(138, 88, 10, 'rgba(70,70,72,0.85)');
    ring(110, 40, 9, 'rgba(255,255,255,0.95)');
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(86, 88, 14, 0, Math.PI * 2);
    ctx.moveTo(72, 88); ctx.lineTo(100, 88); ctx.moveTo(86, 74); ctx.lineTo(86, 102);
    ctx.stroke();
    [['Y', 172, 42], ['X', 158, 56], ['B', 186, 56], ['A', 172, 70]].forEach(([l, x, y]) => {
      ring(x, y, 8, 'rgba(255,255,255,0.95)');
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(l, x, y + 0.5);
    });
    [[94, 56], [126, 56]].forEach(([x, y]) => ring(x, y, 5, 'rgba(255,255,255,0.95)'));
    ctx.restore();
  }

  function raysCounter(n) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#040404';
      ctx.fillRect(0, 0, w, h * 0.26);
      ctx.fillRect(w * 0.3, h * 0.26, w * 0.4, h * 0.74);
      ctx.font = `bold ${Math.round(h * 0.24)}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#76d02a';
      ctx.fillText('RAYS', w * 0.03, h * 0.14);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('OFF', w * 0.6, h * 0.14);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#76d02a';
      ctx.font = `${Math.round(h * 0.15)}px Arial`;
      ctx.fillText('FPS', w * 0.5, h * 0.38);
      ctx.font = `${Math.round(h * 0.3)}px Arial`;
      ctx.fillText(String(n), w * 0.5, h * 0.72);
    };
  }

  function npcLabel(name, group, col) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      hudText(ctx, w / 2, h * 0.3, name, h * 0.3, col, { align: 'center', stroke: false });
      if (group) hudText(ctx, w / 2, h * 0.72, group, h * 0.3, col, { align: 'center', stroke: false });
    };
  }

  function alert(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.02); ctx.lineTo(w * 0.99, h * 0.95); ctx.lineTo(w * 0.01, h * 0.95); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8141c';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.1); ctx.lineTo(w * 0.92, h * 0.9); ctx.lineTo(w * 0.08, h * 0.9); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(h * 0.42)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', w / 2, h * 0.48);
    ctx.font = `bold ${Math.round(h * 0.16)}px Arial`;
    ctx.fillText('ALERT', w / 2, h * 0.78);
  }

  function arrow(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ee1010';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.36); ctx.lineTo(w * 0.62, h * 0.4); ctx.lineTo(w * 0.6, h * 0.12); ctx.lineTo(w, h * 0.55);
    ctx.lineTo(w * 0.56, h * 0.92); ctx.lineTo(w * 0.6, h * 0.64); ctx.lineTo(0, h * 0.6); ctx.closePath();
    ctx.fill();
  }

  function rustPanel(ctx, x, y, w, h, g) {
    ctx.fillStyle = 'rgba(22,26,30,0.88)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(80,90,100,0.35)';
    ctx.lineWidth = 1;
    const cs = 22;
    for (let gx = x; gx < x + w; gx += cs) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); }
    for (let gy = y; gy < y + h; gy += cs) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(120,96,70,0.95)';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(60,46,34,0.9)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = 'rgba(150,110,70,0.6)';
      ctx.fillRect(x + g() * w, y - 2, 6 + g() * 20, 4);
    }
  }

  function inventory(ctx, w, h) {
    const g = rand(351);
    ctx.clearRect(0, 0, w, h);
    const S = w / 960;
    ctx.save();
    ctx.scale(S, S);
    [[70, 36, 128, 82], [206, 36, 243, 82], [460, 36, 323, 82]].forEach(([x, y, bw, bh]) => rustPanel(ctx, x, y, bw, bh, g));
    ctx.fillStyle = '#c8c8c4';
    ctx.fillRect(84, 52, 46, 8);
    ctx.fillRect(98, 48, 20, 4);
    ctx.fillStyle = '#6a6a66';
    ctx.fillRect(110, 58, 6, 14);
    rustPanel(ctx, 12, 178, 310, 330, g);
    rustPanel(ctx, 352, 178, 300, 330, g);
    rustPanel(ctx, 684, 178, 260, 290, g);
    hudText(ctx, 20, 178, 'Вес 10.5 / 50.0', 10, '#d0c080', { stroke: false });
    hudText(ctx, 362, 182, 'Описание', 10, '#d0c080', { stroke: false });
    hudText(ctx, 694, 182, 'Костюм', 10, '#d0c080', { stroke: false });
    ctx.fillStyle = '#4a4e40';
    ctx.fillRect(24, 226, 36, 46);
    ctx.fillStyle = '#d8c040';
    ctx.beginPath();
    ctx.arc(42, 254, 7, 0, Math.PI * 2);
    ctx.fill();
    hudText(ctx, 72, 214, '40', 10, '#e0e0d8', { stroke: false });
    ctx.fillStyle = 'rgba(60,64,62,0.9)';
    ctx.fillRect(360, 336, 284, 22);
    ctx.fillRect(360, 360, 284, 140);
    ctx.fillStyle = '#c02020';
    ctx.fillRect(704, 246, 6, 110);
    ctx.fillStyle = '#3050e0';
    ctx.fillRect(714, 246, 6, 110);
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(782, 204, 34, 54);
    ctx.fillStyle = '#c09a7a';
    ctx.beginPath();
    ctx.arc(799, 196, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e3a4e';
    ctx.fillRect(786, 258, 12, 60);
    ctx.fillRect(802, 258, 12, 60);
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(772, 206, 10, 44);
    ctx.fillRect(816, 206, 10, 44);
    rustPanel(ctx, 690, 382, 250, 22, g);
    hudText(ctx, 712, 393, '40 SR', 11, '#e0e0d8', { stroke: false });
    hudText(ctx, 826, 410, 'Параметры', 10, '#d0c080', { stroke: false });
    ['Ожог', 'Электрошок', 'Удар', 'Разрыв', 'Хим. ожог', 'Взрыв', 'Пулестойкость'].forEach((s, i) => {
      hudText(ctx, 700, 426 + i * 11, s, 9, '#e0e0d8', { stroke: false });
      hudText(ctx, 700 + ctx.measureText(s).width + 3, 426 + i * 11, '+10%', 9, '#40e040', { stroke: false });
    });
    rustPanel(ctx, 8, 512, 120, 22, g);
    hudText(ctx, 16, 523, 'Время', 10, '#d0c080', { stroke: false });
    hudText(ctx, 92, 523, '06:11', 10, '#e0e0d8', { stroke: false });
    rustPanel(ctx, 806, 512, 138, 22, g);
    hudText(ctx, 836, 523, 'Выход (Esc)', 10, '#e0e0d8', { stroke: false });
    ctx.restore();
  }

  function invBars(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const gr = ctx.createLinearGradient(0, 0, 0, h * 0.08);
    gr.addColorStop(0, '#7a6a5a');
    gr.addColorStop(1, '#4a3a2e');
    ctx.fillStyle = gr;
    ctx.fillRect(w * 0.02, 0, w * 0.96, h * 0.07);
    [['#e01818', '#ff9a8a', 0.1], ['#3a6ae0', '#a8c0ff', 0.4], ['#2a2a30', '#4a4a54', 0.7]].forEach(([c0, c1, x]) => {
      const g2 = ctx.createLinearGradient(w * x, 0, w * (x + 0.2), 0);
      g2.addColorStop(0, c0);
      g2.addColorStop(0.45, c1);
      g2.addColorStop(1, c0);
      ctx.fillStyle = g2;
      ctx.fillRect(w * x, h * 0.07, w * 0.2, h * 0.93);
    });
  }

  const DRAW = {
    skySunset: [1024, 512, sky([[0, '#5d5a72'], [0.4, '#8a7f99'], [0.7, '#c29aa8'], [0.86, '#e2c0bc'], [0.92, '#e8cfc4'], [1, '#b8a8a4']], '96,86,110', '236,208,212', 11)],
    skyVillage: [1024, 512, sky([[0, '#6a6684'], [0.4, '#9a8aa6'], [0.7, '#d4a6b0'], [0.86, '#ecc6be'], [0.92, '#f0d4c6'], [1, '#c4aea6']], '120,100,128', '246,214,214', 12)],
    skyGrey: [1024, 512, sky([[0, '#5c6268'], [0.45, '#7c8288'], [0.75, '#9ea2a6'], [0.9, '#b4b6b6'], [1, '#9a9c9a']], '70,74,80', '190,192,194', 13)],
    skyWheel: [1024, 512, sky([[0, '#4a4660'], [0.45, '#6e6a86'], [0.75, '#948ea6'], [0.9, '#aaa4b6'], [1, '#8e8a96']], '60,56,80', '176,170,190', 14)],
    skyHaze: [1024, 512, sky([[0, '#9aa0a6'], [0.5, '#c0c4c6'], [0.85, '#dcdcda'], [0.92, '#e2e0dc'], [1, '#c6c2ba']], '150,154,158', '236,236,234', 15, 40)],
    skyStorm: [1024, 512, sky([[0, '#36383e'], [0.45, '#50535a'], [0.75, '#73767c'], [0.9, '#8e9094'], [1, '#76787a']], '34,36,40', '140,142,148', 16, 90)],
    skyPlant: [1024, 512, sky([[0, '#70767c'], [0.45, '#8e9398'], [0.75, '#aeb2b6'], [0.9, '#c4c6c8'], [1, '#a8aaaa']], '84,88,94', '206,208,210', 17)],
    skyBright: [1024, 512, sky([[0, '#8aa0b2'], [0.45, '#a8b8c4'], [0.75, '#c6d0d6'], [0.9, '#d8dcdc'], [1, '#b8bcb8']], '130,140,150', '230,234,236', 18)],
    tiles: [256, 512, tiles],
    cloth: [512, 512, cloth],
    bunkerMetal: [256, 256, rustMetal('#2a302e', 303, ['60,50,36', '20,24,22', '80,70,50'])],
    pipe: [128, 128, rustMetal('#4a4a40', 304, ['110,90,40', '60,56,40'])],
    plankOld: [256, 256, planks([118, 106, 88], 305, 7, 0.55, true)],
    plankGate: [256, 256, planks([150, 146, 134], 306, 9, 0.6, true)],
    moss: [128, 128, solid('#4a5a2a', 307, ['70,90,40', '30,40,20', '100,110,50'])],
    shirtLinen: [128, 128, fabric('#d4ccb0', 308, ['190,180,150', '230,224,200', '160,150,120'])],
    vestLeather: [128, 128, fabric('#5a3c22', 309, ['80,56,34', '40,26,16', '100,70,44'])],
    trousers: [128, 128, fabric('#6a4a2a', 310, ['90,64,38', '50,34,20'])],
    beltLeather: [64, 64, solid('#2e2014', 313, ['50,36,24', '20,14,8'])],
    exo: [256, 256, exo],
    gasmask: [128, 128, gasmask],
    jacketLoner: [256, 256, fabric('#8a8a72', 314, ['110,108,90', '70,70,58', '150,146,124'], [[0.48, 0, 0.52, 1], [0, 0.55, 1, 0.57]])],
    jacketBandit: [256, 256, fabric('#3a3430', 315, ['60,52,46', '24,22,20', '80,70,60'], [[0.48, 0, 0.52, 1]])],
    uniformBlack: [256, 256, fabric('#26282a', 316, ['40,42,44', '14,14,16', '60,60,62'])],
    vestGreen: [256, 256, fabric('#5a6448', 317, ['70,80,56', '40,46,32', '90,96,70'], [[0.1, 0.3, 0.9, 0.32], [0.1, 0.6, 0.9, 0.62]])],
    jeans: [128, 128, fabric('#3e4656', 318, ['56,64,78', '30,34,44'])],
    camoPants: [128, 128, fabric('#5e5a44', 319, ['80,76,56', '44,42,30', '100,90,64'])],
    boots: [64, 64, solid('#1e1a16', 320, ['40,34,28', '10,8,6'])],
    faceA: [256, 256, faceSkin('#c8987c', 322, { stubble: true })],
    faceB: [256, 256, faceSkin('#b88a70', 323, { stubble: true, mouthOpen: true })],
    faceBurn: [256, 256, faceSkin('#8a5a48', 324, { mouthOpen: true })],
    ogreFace: [256, 256, ogreFace],
    ogreSkin: [128, 128, solid('#9cb43c', 325, ['170,196,80', '110,140,40', '140,170,60'], 0.06)],
    corrRust: [256, 256, corrugated('#6e4a34', 326, ['110,70,44', '60,40,30', '150,110,80'])],
    corrBlue: [256, 256, corrugated('#56606a', 327, ['80,90,100', '40,46,52', '120,130,140'])],
    corrDark: [256, 256, corrugated('#2e3238', 328, ['50,56,62', '20,22,26', '70,76,84'])],
    concrete: [256, 256, concrete('#8a8a84', 329, true)],
    concreteDark: [256, 256, concrete('#66665e', 330, false)],
    asphalt: [256, 256, cracked('#5a5856', 332, 22)],
    gravel: [256, 256, field(['#6a5650', '120,96,88', '84,70,64', '146,120,108', '60,48,44'], 333, 300)],
    grassAutumn: [256, 256, field(['#8a5a34', '150,96,52', '120,80,40', '170,120,64', '96,70,40'], 334, 1400)],
    grassGreen: [256, 256, field(['#4e5a2e', '70,84,40', '50,60,30', '100,104,54', '40,48,26'], 335, 1200)],
    grassGrey: [256, 256, field(['#5a5e40', '80,86,56', '60,64,44', '110,110,80', '50,52,36'], 336, 1200)],
    cellar: [256, 256, bricks('#6a5034', ['#a07a4a', '#8a6a40', '#b08a56', '#7a5a36'], 337, 12)],
    cellarDirt: [256, 256, solid('#5a4630', 338, ['90,70,46', '40,30,20', '120,96,64'])],
    stair: [256, 256, planks([110, 90, 66], 339, 6, 0.5, false)],
    cabin: [256, 128, cabin],
    chrome: [128, 128, chrome],
    rustFrame: [128, 128, rustMetal('#5a3a2c', 340, ['120,70,40', '40,30,24', '150,100,60'])],
    wheelRim: [1024, 1024, wheelRim],
    lattice: [128, 512, lattice('#9a7a5c', 344, 8, 0.07)],
    latticeDark: [128, 512, lattice('#3a3a38', 345, 8, 0.07)],
    letters: [512, 128, letters],
    signBoard: [512, 64, signBoard],
    stack: [128, 512, stack],
    sarcophagus: [512, 256, sarcophagus],
    cab: [256, 256, rustMetal('#6e8696', 346, ['110,100,84', '60,70,76', '150,160,166'])],
    cabTarp: [256, 256, solid('#5a6a4a', 347, ['70,84,56', '40,50,34', '90,100,70'])],
    vanWhite: [256, 256, rustMetal('#c8ccc4', 348, ['150,140,120', '110,110,100', '200,200,190'])],
    carYellow: [256, 256, rustMetal('#d2b030', 349, ['150,110,40', '200,170,60', '120,90,40'])],
    excavator: [256, 256, rustMetal('#c8b03a', 350, ['140,110,40', '90,80,40', '200,180,80'])],
    stone: [256, 256, concrete('#4a4e52', 352, false)],
    plasterGrey: [256, 256, concrete('#a6a49a', 353, false)],
    hudBattery: [128, 32, battery],
    hudBars: [256, 64, bars],
    hudBelt: [256, 64, belt],
    crossDot: [32, 32, crossDot],
    crossTicks: [64, 64, crossTicks],
    rating: [512, 384, rating],
    madeIn: [512, 64, caption('Made in Czech Republic', 0.62, '#e6e6e2')],
    outsource: [512, 64, caption('by russian outsource', 0.62, '#d0d0cc')],
    talkHint: [256, 32, caption('Говорить (F)', 0.6, '#e8e8e0')],
    outDoor: [256, 512, outDoor],
    booth: [256, 256, booth],
    rail: [256, 32, rail],
    drop: [32, 48, drop],
    redArc: [256, 128, redArc],
    invFrame: [64, 512, invFrame],
    gamepad: [512, 320, gamepad],
    alert: [128, 112, alert],
    arrow: [128, 64, arrow],
    inventory: [1920, 1080, inventory],
    invBars: [256, 512, invBars],
    labelShustry: [256, 64, npcLabel('Шустрый', 'Одиночка', '#e8e070')],
    labelBandit: [256, 64, npcLabel('Тебе п****.', '', '#e8221c')]
  };

  const CLAMP = { rating: true, madeIn: true, outsource: true, talkHint: true, drop: true, redArc: true, invFrame: true,gamepad: true, alert: true, arrow: true, inventory: true, invBars: true, labelShustry: true, labelBandit: true, crossDot: true, crossTicks: true, hudBattery: true, hudBars: true, hudBelt: true, letters: true, signBoard: true, wheelRim: true };

  function dynamic(key) {
    const i = key.indexOf(':');
    const kind = key.slice(0, i), arg = key.slice(i + 1);
    if (kind === 'title') { const T0 = TITLES[arg]; return [T0.w * 2, T0.h * 2, titleBox(T0.lines)]; }
    if (kind === 'map') { const [label, seed] = arg.split('|'); return [256, 256, minimap(label, +seed || 5)]; }
    if (kind === 'ammo') return [256, 128, ammo(arg)];
    if (kind === 'stance') return [128, 128, stance(arg)];
    if (kind === 'fps') return [256, 192, raysCounter(arg)];
    return null;
  }

  function textures(r) {
    const cache = {};
    const PA = window.ParadArt.DRAW;
    return new Proxy({}, {
      get(_, key) {
        if (typeof key !== 'string') return undefined;
        if (cache[key]) return cache[key];
        let d = DRAW[key], clamp = !!CLAMP[key];
        if (!d && key.includes(':')) { d = dynamic(key); clamp = true; }
        if (!d && PA[key]) d = PA[key];
        if (!d) return null;
        cache[key] = r.texture(d[0], d[2], { height: d[1], clamp });
        return cache[key];
      }
    });
  }

  window.DownArt = { DRAW, TITLES, textures };
})();
