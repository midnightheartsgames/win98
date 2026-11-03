(function () {
  const { rand } = window.P3D;
  const PI = Math.PI;

  function speckle(ctx, w, h, seed, amount, density) {
    const g = rand(seed);
    const n = Math.floor(w * h * (density || 0.25));
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = g() < 0.5 ? `rgba(0,0,0,${amount * g()})` : `rgba(255,255,255,${amount * g()})`;
      ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1 + Math.floor(g() * 2), 1 + Math.floor(g() * 2));
    }
  }

  function mottle(ctx, w, h, seed, col, count, size, alpha) {
    const g = rand(seed);
    for (let i = 0; i < count; i++) {
      const x = g() * w, y = g() * h, r = size * (0.4 + g());
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${col},${alpha * (0.4 + 0.6 * g())})`);
      gr.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  function flat(base, seed, amount, blotch) {
    return (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      if (blotch) {
        mottle(ctx, w, h, seed + 1, blotch[0], blotch[1], w * 0.12, blotch[2]);
      }
      speckle(ctx, w, h, seed, amount, 0.2);
    };
  }

  function streamWall(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#a8a254');
    gr.addColorStop(0.6, '#c4bc64');
    gr.addColorStop(1, '#b4ac5a');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    mottle(ctx, w, h, 4, '90,84,40', 30, w * 0.1, 0.18);
    speckle(ctx, w, h, 5, 0.08, 0.2);
  }

  function satin(ctx, w, h) {
    ctx.fillStyle = '#1c4a4c';
    ctx.fillRect(0, 0, w, h);
    const g = rand(8);
    for (let i = 0; i < 26; i++) {
      const x = g() * w, y = g() * h;
      ctx.strokeStyle = g() < 0.5 ? 'rgba(140, 210, 205, 0.35)' : 'rgba(6, 26, 28, 0.5)';
      ctx.lineWidth = 3 + g() * 10;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + (g() - 0.5) * w * 0.6, y + g() * h * 0.3, x + (g() - 0.5) * w * 0.6, y + g() * h * 0.5, x + (g() - 0.5) * w * 0.4, y + h * 0.4);
      ctx.stroke();
    }
  }

  function asphalt(ctx, w, h) {
    ctx.fillStyle = '#5c5e60';
    ctx.fillRect(0, 0, w, h);
    mottle(ctx, w, h, 11, '40,40,42', 24, w * 0.15, 0.25);
    speckle(ctx, w, h, 12, 0.22, 0.5);
  }

  function carSide(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#2a2c30');
    gr.addColorStop(0.45, '#121316');
    gr.addColorStop(0.5, '#3a3c42');
    gr.addColorStop(0.56, '#141518');
    gr.addColorStop(1, '#0c0c0e');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c8202a';
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h);
    ctx.lineTo(w * 0.62, h * 0.2);
    ctx.lineTo(w * 0.78, h * 0.2);
    ctx.lineTo(w * 0.58, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8e8ec';
    ctx.beginPath();
    ctx.moveTo(w * 0.6, h);
    ctx.lineTo(w * 0.8, h * 0.2);
    ctx.lineTo(w * 0.86, h * 0.2);
    ctx.lineTo(w * 0.66, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.36, h * 0.12);
    ctx.lineTo(w * 0.36, h * 0.95);
    ctx.stroke();
    ctx.fillStyle = '#8a8a90';
    ctx.fillRect(w * 0.3, h * 0.36, w * 0.05, h * 0.04);
  }

  function floral(base, petal, seed) {
    return (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      const g = rand(seed);
      for (let i = 0; i < 24; i++) {
        const x = g() * w, y = g() * h, r = w * (0.04 + g() * 0.05);
        ctx.fillStyle = petal;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * PI * 2 + g();
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, r * 0.5, a, 0, PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(90, 30, 20, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.35, 0, PI * 2);
        ctx.fill();
      }
      speckle(ctx, w, h, seed + 3, 0.08, 0.15);
    };
  }

  function stickers(ctx, w, h) {
    ctx.fillStyle = '#16120e';
    ctx.fillRect(0, 0, w, h);
    const g = rand(21);
    const cols = ['#e8e4dc', '#c83030', '#3a7ac8', '#e8c040', '#f0f0f0'];
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.save();
      ctx.translate(w * (0.1 + g() * 0.7), h * (0.1 + g() * 0.6));
      ctx.rotate((g() - 0.5) * 0.4);
      ctx.fillRect(0, 0, w * (0.08 + g() * 0.15), h * (0.04 + g() * 0.06));
      ctx.restore();
    }
    ctx.fillStyle = '#e8e4dc';
    ctx.font = `bold ${Math.round(h * 0.07)}px Arial, sans-serif`;
    ctx.save();
    ctx.translate(w * 0.12, h * 0.42);
    ctx.rotate(-0.12);
    ctx.fillText('ЖМИ!', 0, 0);
    ctx.restore();
  }

  function callScreen(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#5a5e66');
    gr.addColorStop(1, '#3a3e46');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#6a7078';
    ctx.fillRect(0, 0, w * 0.3, h);
    ctx.fillStyle = '#8a9098';
    ctx.fillRect(w * 0.05, h * 0.1, w * 0.04, h * 0.7);
    ctx.fillStyle = '#d8dce4';
    ctx.fillRect(w * 0.08, h * 0.08, w * 0.18, h * 0.06);
    ctx.fillStyle = '#6e9cb0';
    ctx.beginPath();
    ctx.moveTo(w * 0.32, h);
    ctx.quadraticCurveTo(w * 0.36, h * 0.48, w * 0.6, h * 0.46);
    ctx.quadraticCurveTo(w * 0.84, h * 0.48, w * 0.88, h);
    ctx.fill();
    ctx.fillStyle = '#d8a890';
    ctx.beginPath();
    ctx.ellipse(w * 0.58, h * 0.32, w * 0.075, h * 0.16, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3a30';
    ctx.beginPath();
    ctx.ellipse(w * 0.58, h * 0.2, w * 0.07, h * 0.06, 0, PI, 0);
    ctx.fill();
    ctx.fillStyle = '#3a2a24';
    ctx.fillRect(w * 0.545, h * 0.3, w * 0.02, h * 0.02);
    ctx.fillRect(w * 0.6, h * 0.3, w * 0.02, h * 0.02);
    ctx.fillStyle = '#8a3a34';
    ctx.fillRect(w * 0.56, h * 0.4, w * 0.04, h * 0.025);
  }

  function vent(ctx, w, h) {
    ctx.fillStyle = '#0e0e10';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1e1e22';
    for (let y = 4; y < h; y += 6) for (let x = (y / 6) % 2 ? 3 : 0; x < w; x += 6) ctx.fillRect(x, y, 3, 3);
  }

  function limoCeiling(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#1a2ad8');
    gr.addColorStop(0.35, '#8a2ad0');
    gr.addColorStop(0.65, '#d0287a');
    gr.addColorStop(1, '#2a3ae0');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    mottle(ctx, w, h, 31, '255,200,240', 10, w * 0.15, 0.3);
    const g = rand(32);
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = g() * w, y = g() * h;
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(160, 255, 220, 0.95)' : 'rgba(240, 240, 255, 0.9)';
      ctx.lineWidth = 3 + g() * 3;
      ctx.beginPath();
      ctx.ellipse(x, y, w * (0.04 + g() * 0.06), h * (0.03 + g() * 0.05), g() * PI, 0, PI * (1.1 + g() * 0.6));
      ctx.stroke();
    }
  }

  function snow(ctx, w, h) {
    ctx.fillStyle = '#dfe4ea';
    ctx.fillRect(0, 0, w, h);
    mottle(ctx, w, h, 41, '160,170,182', 40, w * 0.08, 0.35);
    const g = rand(42);
    ctx.strokeStyle = 'rgba(120, 130, 142, 0.45)';
    for (let i = 0; i < 26; i++) {
      ctx.lineWidth = 2 + g() * 5;
      ctx.beginPath();
      const y = g() * h;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + (g() - 0.5) * h * 0.3, w * 0.6, y + (g() - 0.5) * h * 0.3, w, y + (g() - 0.5) * h * 0.2);
      ctx.stroke();
    }
    speckle(ctx, w, h, 43, 0.06, 0.15);
  }

  function terminal(ctx, w, h) {
    ctx.fillStyle = '#7a8088';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4a5058';
    for (let x = 0; x < w; x += w / 24) ctx.fillRect(x, h * 0.35, w / 30, h * 0.4);
    ctx.fillStyle = '#9aa0a8';
    ctx.fillRect(0, 0, w, h * 0.12);
  }

  function livery(ctx, w, h) {
    ctx.fillStyle = '#eef0f4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a3a8a';
    ctx.fillRect(0, h * 0.82, w, h * 0.18);
    ctx.fillStyle = '#d83a2a';
    ctx.fillRect(0, h * 0.78, w, h * 0.04);
    ctx.fillStyle = '#3a4250';
    for (let x = w * 0.14; x < w * 0.86; x += w * 0.022) ctx.fillRect(x, h * 0.42, w * 0.009, h * 0.1);
    ctx.fillStyle = '#2a3a8a';
    ctx.font = `bold ${Math.round(h * 0.16)}px Arial, sans-serif`;
    ctx.fillText('АЭРО 98', w * 0.4, h * 0.34);
  }

  function sand(ctx, w, h) {
    ctx.fillStyle = '#c2aa84';
    ctx.fillRect(0, 0, w, h);
    mottle(ctx, w, h, 51, '120,96,64', 30, w * 0.06, 0.4);
    const g = rand(52);
    ctx.fillStyle = 'rgba(70, 56, 40, 0.55)';
    for (let i = 0; i < 600; i++) {
      ctx.save();
      ctx.translate(g() * w, g() * h);
      ctx.rotate(g() * PI);
      ctx.fillRect(0, 0, 2 + g() * 9, 1 + g() * 1.5);
      ctx.restore();
    }
    speckle(ctx, w, h, 53, 0.15, 0.4);
  }

  function sea(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#5c8aa8');
    gr.addColorStop(1, '#7aaab8');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    const g = rand(61);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = g() < 0.6 ? 'rgba(220, 240, 250, 0.35)' : 'rgba(40, 80, 110, 0.35)';
      ctx.fillRect(g() * w, g() * h, 4 + g() * 16, 1 + g() * 2);
    }
  }

  function skyClouds(top, low) {
    return (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, top);
      gr.addColorStop(1, low);
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h * 0.6, 71, '255,255,255', 24, w * 0.06, 0.5);
    };
  }

  function headland(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#8a7a5a';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.35);
    ctx.quadraticCurveTo(w * 0.15, h * 0.1, w * 0.4, h * 0.3);
    ctx.quadraticCurveTo(w * 0.7, h * 0.5, w, h * 0.85);
    ctx.lineTo(w, h);
    ctx.fill();
    ctx.fillStyle = '#5a6a3a';
    ctx.fillRect(0, h * 0.25, w * 0.5, h * 0.1);
  }

  function renWall(ctx, w, h) {
    ctx.fillStyle = '#c8c4b0';
    ctx.fillRect(0, 0, w, h);
    mottle(ctx, w, h, 81, '120,118,96', 60, w * 0.05, 0.35);
    mottle(ctx, w, h, 82, '240,236,220', 40, w * 0.05, 0.4);
    speckle(ctx, w, h, 83, 0.12, 0.4);
  }

  function foliage(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(91);
    for (let i = 0; i < 900; i++) {
      const x = g() * w, y = g() * h;
      const dx = x / w - 0.5, dy = y / h - 0.5;
      if (dx * dx + dy * dy > 0.22) continue;
      const k = g();
      ctx.fillStyle = k < 0.3 ? '#2c4a1e' : k < 0.7 ? '#4a7a2a' : '#7aa83e';
      ctx.beginPath();
      ctx.ellipse(x, y, 4 + g() * 6, 3 + g() * 4, g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function facade(ctx, w, h) {
    ctx.fillStyle = '#e4dccc';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9aa8b4';
    for (let y = h * 0.1; y < h * 0.9; y += h * 0.22) for (let x = w * 0.06; x < w; x += w * 0.16) ctx.fillRect(x, y, w * 0.08, h * 0.12);
  }

  function juiceWall(ctx, w, h) {
    ctx.fillStyle = '#9a8c5c';
    ctx.fillRect(0, 0, w, h);
    const g = rand(101);
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(70, 60, 30, 0.25)' : 'rgba(200, 186, 130, 0.22)';
      ctx.save();
      ctx.translate(g() * w, g() * h);
      ctx.rotate(g() * PI);
      ctx.fillRect(0, 0, 3 + g() * 6, 2);
      ctx.restore();
    }
  }

  function juicePack(ctx, w, h) {
    ctx.fillStyle = '#4a2a5a';
    ctx.fillRect(0, 0, w, h);
    const g = rand(111);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = g() < 0.5 ? '#6a3a82' : '#2a1438';
      ctx.beginPath();
      ctx.arc(w * (0.35 + g() * 0.6), h * (0.3 + g() * 0.6), w * 0.05, 0, PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f0eef0';
    ctx.fillRect(0, 0, w, h * 0.2);
    ctx.fillStyle = '#c81e3a';
    ctx.fillRect(w * 0.08, h * 0.18, w * 0.08, h * 0.75);
    ctx.fillStyle = '#e8e8ec';
    ctx.fillRect(w * 0.2, h * 0.42, w * 0.3, h * 0.12);
    ctx.fillStyle = '#4a2a5a';
    ctx.font = `bold ${Math.round(h * 0.07)}px Arial, sans-serif`;
    ctx.fillText('ВИНОГРАД', w * 0.21, h * 0.51);
  }

  function gravel(ctx, w, h) {
    ctx.fillStyle = '#a8a49a';
    ctx.fillRect(0, 0, w, h);
    mottle(ctx, w, h, 121, '90,86,78', 30, w * 0.08, 0.3);
    speckle(ctx, w, h, 122, 0.25, 0.6);
  }

  function stucco(ctx, w, h) {
    ctx.fillStyle = '#e8e6e0';
    ctx.fillRect(0, 0, w, h);
    mottle(ctx, w, h, 131, '170,166,156', 16, w * 0.1, 0.25);
    speckle(ctx, w, h, 132, 0.06, 0.2);
  }

  function roofTiles(ctx, w, h) {
    ctx.fillStyle = '#b4523a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(80, 30, 20, 0.5)';
    for (let y = 0; y < h; y += h / 8) ctx.fillRect(0, y, w, 2);
    for (let x = 0; x < w; x += w / 16) ctx.fillRect(x, 0, 2, h);
  }

  function hill(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#b4a690');
    gr.addColorStop(0.6, '#9a8e76');
    gr.addColorStop(1, '#6a6a4a');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    const g = rand(141);
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(220, 210, 190, 0.35)' : 'rgba(90, 80, 60, 0.35)';
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 10 + g() * 40, 4 + g() * 14, (g() - 0.5) * 0.8, 0, PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 170; i++) {
      const y = h * (0.35 + g() * 0.65);
      ctx.fillStyle = g() < 0.5 ? 'rgba(62, 74, 44, 0.75)' : 'rgba(96, 104, 66, 0.6)';
      ctx.beginPath();
      ctx.arc(g() * w, y, 2 + g() * 7 * (y / h), 0, PI * 2);
      ctx.fill();
    }
  }

  function balustrade(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f2f0ec';
    ctx.fillRect(0, 0, w, h * 0.16);
    ctx.fillRect(0, h * 0.84, w, h * 0.16);
    for (let x = w * 0.03; x < w; x += w / 12) {
      ctx.beginPath();
      ctx.ellipse(x + w / 48, h * 0.5, w / 60, h * 0.34, 0, 0, PI * 2);
      ctx.fill();
    }
  }

  function ripple(ctx, w, h) {
    ctx.fillStyle = '#9ad0d8';
    ctx.fillRect(0, 0, w, h);
    const g = rand(151);
    for (let i = 0; i < 70; i++) {
      ctx.strokeStyle = g() < 0.6 ? 'rgba(255,255,255,0.7)' : 'rgba(30, 90, 100, 0.5)';
      ctx.lineWidth = 2 + g() * 6;
      ctx.beginPath();
      const x = g() * w, y = g() * h;
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 20, y - 15, x + 40, y + 15, x + 60 + g() * 40, y);
      ctx.stroke();
    }
  }

  function towelWall(ctx, w, h) {
    ctx.fillStyle = '#ddd6c8';
    ctx.fillRect(0, 0, w, h);
    const g = rand(161);
    ctx.strokeStyle = 'rgba(150, 140, 120, 0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      const x = g() * w, y = g() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 8, y - 10, x + 16, y);
      ctx.quadraticCurveTo(x + 8, y + 10, x, y);
      ctx.stroke();
    }
    speckle(ctx, w, h, 162, 0.08, 0.3);
  }

  function door(col, panel) {
    return (ctx, w, h) => {
      ctx.fillStyle = col;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = panel;
      ctx.lineWidth = w * 0.03;
      ctx.strokeRect(w * 0.15, h * 0.06, w * 0.7, h * 0.4);
      ctx.strokeRect(w * 0.15, h * 0.52, w * 0.7, h * 0.42);
      ctx.fillStyle = '#c8b890';
      ctx.fillRect(w * 0.8, h * 0.5, w * 0.08, h * 0.02);
    };
  }

  function studioWall(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#c8d0dc');
    gr.addColorStop(0.5, '#e0e6ee');
    gr.addColorStop(1, '#d4dae4');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 171, 0.04, 0.2);
  }

  function sign(ctx, w, h) {
    ctx.fillStyle = '#f4f4f0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b02a2a';
    ctx.font = `bold ${Math.round(h * 0.14)}px Arial, sans-serif`;
    ctx.fillText('ΕΙΣΟΔΟΣ', w * 0.1, h * 0.3);
    ctx.fillStyle = '#4a4a50';
    for (let i = 0; i < 4; i++) ctx.fillRect(w * 0.1, h * (0.45 + i * 0.12), w * (0.5 + (i % 2) * 0.25), h * 0.05);
  }

  function poster(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#c87a9a');
    gr.addColorStop(0.5, '#e8b4c4');
    gr.addColorStop(1, '#a86a8a');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    mottle(ctx, w, h, 181, '90,40,70', 14, w * 0.08, 0.5);
    mottle(ctx, w, h, 182, '255,240,250', 10, w * 0.06, 0.4);
  }

  function paisley(ctx, w, h) {
    ctx.fillStyle = '#7a6a52';
    ctx.fillRect(0, 0, w, h);
    const g = rand(191);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = g() < 0.5 ? '#b4a07a' : '#3a2e22';
      ctx.save();
      ctx.translate(g() * w, g() * h);
      ctx.rotate(g() * PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.06, w * 0.03, 0, 0, PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function quilt(ctx, w, h) {
    const cols = ['#c8743a', '#e0a860', '#8a4a2a', '#f0d0a0', '#b45a30', '#d89a54'];
    const n = 6;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      ctx.fillStyle = cols[(x * 7 + y * 3) % cols.length];
      ctx.fillRect((x * w) / n, (y * h) / n, w / n + 1, h / n + 1);
    }
    speckle(ctx, w, h, 201, 0.1, 0.2);
  }

  const RULES = [
    ['музыка через донат-пейджер 50р включается автоматически', 18, 15, '#ffffff', 16],
    ['ЧЕЛЛЕНДЖИ ТОЛЬКО ПО СОГЛАСОВАНИЮ', 22, 43, '#e01818', 14],
    ['включить вручную', -5, 105, '#ffffff', 15],
    ['музыка 100р', -5, 125, '#ffffff', 15],
    ['клип/видео 200р', -5, 144, '#ffffff', 15],
    ['(с крупных ютвид каналов)', -5, 164, '#ffffff', 15],
    ['ссылка на донат в описании', -5, 183, '#ffffff', 15],
    ['ТАТУИРОВКА НА МНЕ', -5, 213, '#ffffff', 14],
    ['НАДПИСЬ ОБЯЗАТЕЛЬНО ОБГОВОРИТЬ 1 млн', -5, 231, '#ffffff', 14],
    ['Я ОСУЖДАЮ ВСЕ ПЛОХОЕ', 158, 122, '#ffffff', 15]
  ];

  const RULES_LIST = [
    '4) одеть парик и накрасить губы 5 мин 700р',
    '5) постоять в углу 5 мин 300р',
    '6) намазать все лицо красной помадой 10 мин 5к',
    '7) намазать нос и щеки 5 мин 300р',
    '8) стримить лежа в ванной 10 мин 1500р',
    '9) говорить "женским" голосом 5 мин 300р',
    '10) намазать лицо в желтый цвет на 30 мин 2к',
    '11) сбрить бровь 15к',
    '12) надеть лифчик на 5 мин 900р',
    '13) написать\\нарисовать на лице маркером на 5 мин 700р (обсудить)',
    '14) намазать майонезом лицо 5 мин 900р',
    '15) побриться с пеной 2к',
    '16) крутить педали мини велотренажере 5 мин 250р (с перерывом 30 мин)',
    '17) ПОСМЕЯТЬСЯ СИСЬ-СИСЬ 20секунд 100р',
    '18) встать на одну ногу и говорить 5 раз курлык-курлык 300р',
    '19) 5 МИНУТ СМЕЯТЬСЯ ИСКУСТВЕННО 500Р (С ПЕРЕРЫВОМ МЕЖДУ ДОНАТАМИ)',
    '20) 5 МИНУТ ПЛАКАТЬ ИСКУСТВЕННО 500Р (С ПЕРЕРЫВОМ МЕЖДУ ДОНАТАМИ)',
    '21) КАСТРЮЛЮ НА ГОЛОВУ НА 15 мин 300р'
  ];

  function outlined(ctx, text, x, y, fill, lw) {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = lw || 3;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }

  function rules(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(w / 960, h / 540);
    ctx.textBaseline = 'middle';
    RULES.forEach(([text, x, y, col, size]) => {
      ctx.font = `${size}px Arial, sans-serif`;
      outlined(ctx, text, x, y, col, 2.4);
    });
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = '#7a2ad8';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('Я АКТЁР И ЭТО ПОСТАНОВКА', 14, 66);
    ctx.globalAlpha = 1;
    ctx.font = '11px Arial, sans-serif';
    RULES_LIST.forEach((text, i) => outlined(ctx, text, text.indexOf(')') === 1 ? -5 : -11, 292 + i * 14.5, '#ffffff', 2));
    ctx.restore();
  }

  function renPlate(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(w / 960, h / 540);
    ctx.fillStyle = '#9a1418';
    ctx.beginPath();
    ctx.moveTo(84, 84);
    ctx.lineTo(318, 78);
    ctx.lineTo(328, 90);
    ctx.lineTo(340, 92);
    ctx.lineTo(322, 102);
    ctx.lineTo(332, 112);
    ctx.lineTo(300, 120);
    ctx.lineTo(92, 124);
    ctx.lineTo(98, 104);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 200, 200, 0.25)';
    for (let i = 0; i < 6; i++) ctx.fillRect(300 + i * 7, 86 + i * 5, 30, 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 19px Arial Narrow, Arial, sans-serif';
    ctx.fillText('НЕУДАЧНИКОВ ГОДА', 116, 109);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#f2f2f2';
    ctx.font = 'italic bold 30px Arial, sans-serif';
    ctx.fillText('Р98', 778, 108);
    ctx.restore();
  }

  function donate(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(w / 960, h / 540);
    ctx.font = '22px Arial, sans-serif';
    ctx.fillStyle = '#e8281e';
    ctx.fillText('донат 25р, ссылка в описании', 510, 30);
    ctx.strokeStyle = '#b4b4b0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(764, 493, 10, 0, PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#b4b4b0';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText('стрим-касса', 780, 498);
    ctx.restore();
  }

  function chatMark(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(w / 960, h / 540);
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#f4f4f4';
    ctx.font = '19px Arial, sans-serif';
    ctx.fillText('ВидеоЧат 98', 14, 34);
    ctx.restore();
  }

  function cube(ctx, x, y, s) {
    ctx.fillStyle = '#d81e24';
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#a8141a';
    ctx.beginPath();
    ctx.moveTo(x + s, y);
    ctx.lineTo(x + s * 1.18, y + s * 0.14);
    ctx.lineTo(x + s * 1.18, y + s * 1.12);
    ctx.lineTo(x + s, y + s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(s * 0.3)}px Arial, sans-serif`;
    ctx.fillText('Tlife', x + s * 0.08, y + s * 0.42);
  }

  function greekTv(kind) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 960, h / 540);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#f4f4f4';
      ctx.font = 'bold 17px Arial, sans-serif';
      ctx.fillText('HD', 118, 56);
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText('#Tlife', 790, 54);
      ctx.fillRect(842, 40, 2, 18);
      ctx.beginPath();
      ctx.arc(878, 49, 11, 0, PI * 2);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#f4f4f4';
      ctx.stroke();
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText('8', 874, 54);
      ctx.globalAlpha = 1;
      if (kind !== 'bug') {
        ctx.fillStyle = '#d81e24';
        ctx.beginPath();
        ctx.moveTo(86, 425);
        ctx.lineTo(896, 425);
        ctx.arcTo(912, 425, 912, 441, 16);
        ctx.lineTo(912, 474);
        ctx.arcTo(912, 492, 894, 492, 16);
        ctx.lineTo(86, 492);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 21px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Εγώ ποτέ! Ορκίζομαι ότι ποτέ', 502, 452);
        ctx.fillText('δεν έκανα κάτι τέτοιο.', 502, 478);
        ctx.textAlign = 'left';
        cube(ctx, 56, 454, 58);
      }
      ctx.restore();
    };
  }

  function grecii(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(w / 960, h / 540);
    ctx.fillStyle = '#101010';
    ctx.font = 'bold 44px "Times New Roman", Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('*Греции', 936, 384);
    ctx.restore();
  }

  function pinkBand(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(w / 960, h / 540);
    ctx.fillStyle = '#e8404e';
    ctx.beginPath();
    ctx.moveTo(352, 92);
    ctx.quadraticCurveTo(364, 74, 388, 76);
    ctx.lineTo(420, 76);
    ctx.lineTo(600, 330);
    ctx.lineTo(560, 400);
    ctx.lineTo(330, 400);
    ctx.lineTo(330, 120);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f8b4bc';
    ctx.beginPath();
    ctx.moveTo(430, 76);
    ctx.lineTo(500, 76);
    ctx.lineTo(668, 320);
    ctx.lineTo(600, 330);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a1622';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(460, 400, 118, Math.PI * 1.08, Math.PI * 1.9);
    ctx.stroke();
    ctx.restore();
  }

  window.StsArt = {
    flat, streamWall, satin, asphalt, carSide, floral, stickers, callScreen, vent, limoCeiling, snow, terminal, livery,
    sand, sea, skyClouds, headland, renWall, foliage, facade, juiceWall, juicePack, gravel, stucco, roofTiles, hill,
    balustrade, ripple, towelWall, door, studioWall, sign, poster, paisley, quilt,
    rules, renPlate, donate, chatMark, greekTv, grecii, pinkBand, RULES_LIST
  };
})();
