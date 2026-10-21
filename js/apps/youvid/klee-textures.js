(function () {
  const { rand } = window.P3D;
  const PI = Math.PI;

  function cloud(ctx, g, cx, cy, sc, alpha, tint) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc * 0.55);
    const puffs = [];
    for (let i = 0; i < 9; i++) puffs.push([(i - 4) * 20 + (g() - 0.5) * 14, -(4 - Math.abs(i - 4)) * 7 + (g() - 0.5) * 10, 30 - Math.abs(i - 4) * 3 + g() * 12]);
    ctx.fillStyle = `rgba(${tint.shade},${alpha * 0.85})`;
    puffs.forEach(([x, y, rr]) => { ctx.beginPath(); ctx.arc(x + 4, y + 12, rr, 0, PI * 2); ctx.fill(); });
    ctx.fillStyle = `rgba(${tint.main},${alpha})`;
    puffs.forEach(([x, y, rr]) => { ctx.beginPath(); ctx.arc(x, y, rr * 0.92, 0, PI * 2); ctx.fill(); });
    ctx.restore();
  }

  const SKIES = {
    day: { stops: ['#2f7de8', '#6ab4f4', '#cdeaff'], cloud: { main: '255,255,255', shade: '176,208,238' }, clouds: 34, sun: null },
    sunset: { stops: ['#5a52b8', '#e88aa0', '#ffc878'], cloud: { main: '255,214,190', shade: '222,128,150' }, clouds: 30, sun: [0.25, 0.745] },
    night: { stops: ['#10124a', '#2c3a92', '#5a6ac0'], cloud: { main: '120,130,200', shade: '60,70,140' }, clouds: 22, sun: null },
    purple: { stops: ['#2a1670', '#6a3cc0', '#c88ae8'], cloud: { main: '230,190,255', shade: '140,90,200' }, clouds: 26, sun: null }
  };

  function skyTex(kind, seed) {
    const S = SKIES[kind];
    return (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, S.stops[0]);
      gr.addColorStop(0.62, S.stops[1]);
      gr.addColorStop(1, S.stops[2]);
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      const g = rand(seed);
      if (S.sun) {
        const sx = w * S.sun[0], sy = h * S.sun[1];
        const rad = w * 0.09;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(1, (2 * Math.PI * h) / (1.69 * w));
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
        glow.addColorStop(0, 'rgba(255,255,240,1)');
        glow.addColorStop(0.1, 'rgba(255,252,210,1)');
        glow.addColorStop(0.12, 'rgba(255,236,160,0.9)');
        glow.addColorStop(0.3, 'rgba(255,208,140,0.55)');
        glow.addColorStop(1, 'rgba(255,160,120,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(-rad, -rad, rad * 2, rad * 2);
        ctx.restore();
      }
      for (let i = 0; i < S.clouds; i++) {
        const y = h * (0.18 + g() * 0.66);
        const sc = (0.2 + g() * 0.34) * (0.6 + y / h);
        const x = g() * w;
        cloud(ctx, g, x, y, sc, 0.78 + g() * 0.22, S.cloud);
        if (x < 160) cloud(ctx, rand(seed + i), x + w, y, sc, 0.9, S.cloud);
        if (x > w - 160) cloud(ctx, rand(seed + i), x - w, y, sc, 0.9, S.cloud);
      }
      if (kind === 'night') {
        for (let i = 0; i < 90; i++) {
          ctx.fillStyle = `rgba(255,255,230,${0.4 + g() * 0.6})`;
          ctx.fillRect(g() * w, g() * h * 0.55, 1.6, 1.6);
        }
      }
    };
  }

  function grassTex(kind) {
    const base = kind === 'dry' ? '#9a9a3c' : '#5aa838';
    const lights = kind === 'dry' ? ['rgba(200,190,90,0.4)', 'rgba(110,100,40,0.35)'] : ['rgba(190,236,90,0.4)', 'rgba(50,128,38,0.32)'];
    return (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      const g = rand(kind === 'dry' ? 91 : 71);
      for (let i = 0; i < 240; i++) {
        const x = g() * w, y = g() * h, rr = 12 + g() * 42;
        ctx.fillStyle = lights[i % 2];
        ctx.beginPath();
        ctx.ellipse(x, y, rr, rr * 0.55, g() * PI, 0, PI * 2);
        ctx.fill();
      }
      ctx.lineCap = 'round';
      for (let i = 0; i < 1800; i++) {
        const x = g() * w, y = g() * h, bh = 4 + g() * 9, tilt = (g() - 0.5) * 6;
        ctx.strokeStyle = i % 3 === 0 ? 'rgba(220,250,130,0.55)' : 'rgba(50,120,36,0.5)';
        ctx.lineWidth = 1 + g();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + tilt * 0.4, y - bh * 0.6, x + tilt, y - bh);
        ctx.stroke();
      }
    };
  }

  function dirtTex(ctx, w, h) {
    ctx.fillStyle = '#d2aa68';
    ctx.fillRect(0, 0, w, h);
    const g = rand(131);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(150,108,56,0.35)' : 'rgba(240,214,150,0.4)';
      ctx.fillRect(g() * w, g() * h, 2 + g() * 5, 1 + g() * 2);
    }
  }

  function plazaTex(ctx, w, h) {
    ctx.fillStyle = '#5a6a86';
    ctx.fillRect(0, 0, w, h);
    const g = rand(151);
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const v = 118 + Math.floor(g() * 34);
        ctx.fillStyle = `rgb(${v - 22},${v - 6},${v + 22})`;
        ctx.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(i * s + 3, j * s + 3, s - 6, 5);
      }
    }
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(40,60,80,0.18)' : 'rgba(255,255,255,0.14)';
      ctx.fillRect(g() * w, g() * h, 2 + g() * 3, 1 + g() * 2);
    }
  }

  function hexTex(ctx, w, h) {
    ctx.fillStyle = '#6a6a62';
    ctx.fillRect(0, 0, w, h);
    const g = rand(171);
    const r = w / 4;
    for (let row = -1; row < 7; row++) {
      for (let col = -1; col < 6; col++) {
        const cx = col * r * 1.5 * 0.9 + (row % 2) * r * 0.78;
        const cy = row * r * 0.78;
        const v = 140 + Math.floor(g() * 40);
        ctx.fillStyle = `rgb(${v},${v - 2},${v - 14})`;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * PI * 2 + PI / 6;
          const x = cx + Math.cos(a) * r * 0.5, y = cy + Math.sin(a) * r * 0.5;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(60,60,52,0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }

  function checkerTex(ctx, w, h) {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#8a8e98' : '#eceae4';
        ctx.fillRect(i * s, j * s, s, s);
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(i * s, j * s, s, 3);
      }
    }
  }

  function waterTex(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#3a9ad8');
    gr.addColorStop(1, '#5ac0e8');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    const g = rand(191);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(g() * w, g() * h, 3 + g() * 14, 1);
    }
  }

  function mountainsTex(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(211);
    const layers = [['#7a96c0', 0.5, 0.34], ['#5a8a78', 0.7, 0.22]];
    layers.forEach(([col, top, amp], li) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, h);
      let y = h * top;
      for (let x = 0; x <= w; x += 16) {
        y = h * top - Math.abs(Math.sin(x * 0.011 + li * 2) * 0.6 + Math.sin(x * 0.027 + li) * 0.3 + (g() - 0.5) * 0.1) * h * amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(0, h * 0.92, w, h * 0.08);
  }

  function latticeTex(ctx, w, h) {
    ctx.fillStyle = '#58667a';
    ctx.fillRect(0, 0, w, h);
    const n = 4, sx = w / n, sy = h / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const cx = (i + 0.5) * sx, cy = (j + 0.5) * sy;
        ctx.fillStyle = '#34425a';
        ctx.beginPath();
        ctx.moveTo(cx, cy - sy * 0.42);
        ctx.lineTo(cx + sx * 0.4, cy);
        ctx.lineTo(cx, cy + sy * 0.42);
        ctx.lineTo(cx - sx * 0.4, cy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#6a86b8';
        ctx.beginPath();
        ctx.moveTo(cx, cy - sy * 0.25);
        ctx.lineTo(cx + sx * 0.23, cy);
        ctx.lineTo(cx, cy + sy * 0.25);
        ctx.lineTo(cx - sx * 0.23, cy);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function paintingTex(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#9ac0e0');
    gr.addColorStop(1, '#e8f0f8');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#6e8cb0';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w * 0.25, h * 0.35);
    ctx.lineTo(w * 0.42, h * 0.65);
    ctx.lineTo(w * 0.68, h * 0.25);
    ctx.lineTo(w, h * 0.7);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4f8ff';
    ctx.beginPath();
    ctx.moveTo(w * 0.25, h * 0.35);
    ctx.lineTo(w * 0.3, h * 0.5);
    ctx.lineTo(w * 0.2, h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.68, h * 0.25);
    ctx.lineTo(w * 0.75, h * 0.45);
    ctx.lineTo(w * 0.6, h * 0.45);
    ctx.closePath();
    ctx.fill();
  }

  window.KleeTextures = { SKIES, skyTex, grassTex, dirtTex, plazaTex, hexTex, checkerTex, waterTex, mountainsTex, latticeTex, paintingTex };
})();
