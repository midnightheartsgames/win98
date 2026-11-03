(function () {
  const { rand } = window.P3D;
  const PI = Math.PI;

  function hex(c) {
    return '#' + c.toString(16).padStart(6, '0');
  }

  function shadeHex(c, k) {
    const r = Math.min(255, Math.round(((c >> 16) & 255) * k)), g = Math.min(255, Math.round(((c >> 8) & 255) * k)), b = Math.min(255, Math.round((c & 255) * k));
    return `rgb(${r},${g},${b})`;
  }

  function soft(ctx, x, y, rx, ry, col, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, col.replace('A', a));
    g.addColorStop(1, col.replace('A', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function cloth(kind, O) {
    return (ctx, w, h) => {
      const g = rand(kind.length * 131 + 7);
      if (kind === 'plaid' || kind === 'plaidNavy') {
        const base = kind === 'plaid' ? '#4a4a4c' : '#24305a';
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, w, h);
        const bands = kind === 'plaid' ? ['rgba(20,20,22,0.7)', 'rgba(130,130,135,0.5)'] : ['rgba(10,14,40,0.6)', 'rgba(90,110,170,0.35)'];
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = bands[i % 2];
          ctx.fillRect(i * w / 8, 0, w / 16, h);
          ctx.fillRect(0, i * h / 8, w, h / 16);
        }
        return;
      }
      if (kind === 'camo' || kind === 'camoPants') {
        ctx.fillStyle = '#6a6a4a';
        ctx.fillRect(0, 0, w, h);
        const cols = ['#4a4a32', '#8a845e', '#3a3424', '#a09a7a'];
        for (let i = 0; i < 70; i++) {
          ctx.fillStyle = cols[i % 4];
          ctx.beginPath();
          const x = g() * w, y = g() * h;
          ctx.ellipse(x, y, 6 + g() * 18, 4 + g() * 10, g() * PI, 0, PI * 2);
          ctx.fill();
        }
        return;
      }
      if (kind === 'paisley') {
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#141414';
        ctx.lineWidth = 3;
        for (let i = 0; i < 60; i++) {
          ctx.beginPath();
          const x = g() * w, y = g() * h;
          ctx.ellipse(x, y, 6 + g() * 10, 4 + g() * 6, g() * PI, 0, PI * 1.6);
          ctx.stroke();
        }
        ctx.fillStyle = '#141414';
        for (let i = 0; i < 90; i++) ctx.fillRect(g() * w, g() * h, 4, 4);
        return;
      }
      if (kind === 'check') {
        ctx.fillStyle = '#ececf0';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(120,140,190,0.45)';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 8) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, h);
          ctx.moveTo(0, i);
          ctx.lineTo(w, i);
          ctx.stroke();
        }
        return;
      }
      if (kind === 'leather') {
        ctx.fillStyle = '#1e1e20';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 40; i++) {
          ctx.strokeStyle = `rgba(90,90,95,${0.1 + g() * 0.2})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const y = g() * h;
          ctx.moveTo(0, y);
          ctx.quadraticCurveTo(w / 2, y + (g() - 0.5) * 30, w, y + (g() - 0.5) * 20);
          ctx.stroke();
        }
        return;
      }
      if (kind === 'polo') {
        ctx.fillStyle = '#5e4a30';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 400; i++) {
          ctx.fillStyle = g() < 0.5 ? 'rgba(40,28,14,0.25)' : 'rgba(120,100,70,0.2)';
          ctx.fillRect(g() * w, g() * h, 2, 2);
        }
        return;
      }
      if (kind === 'pajama') {
        ctx.fillStyle = '#f2f2f4';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(30,30,40,0.6)';
        ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, w - 8, h - 8);
        return;
      }
      if (kind === 'gusSuit') {
        ctx.fillStyle = '#2a3456';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(120,140,190,0.25)';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 16) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, h);
          ctx.moveTo(0, i);
          ctx.lineTo(w, i);
          ctx.stroke();
        }
        return;
      }
      if (kind === 'stripe') {
        ctx.fillStyle = O.tie ? hex(O.tie) : '#3a4250';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(200,205,215,0.55)';
        ctx.lineWidth = w * 0.09;
        for (let i = -6; i < 10; i++) {
          ctx.beginPath();
          ctx.moveTo(i * w * 0.32, 0);
          ctx.lineTo(i * w * 0.32 + w, h * 0.5);
          ctx.stroke();
        }
        return;
      }
      if (kind === 'paisleyTie') {
        ctx.fillStyle = O.tie ? hex(O.tie) : '#a88a2a';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 26; i++) {
          ctx.fillStyle = i % 2 ? 'rgba(90,50,20,0.55)' : 'rgba(250,230,150,0.45)';
          ctx.beginPath();
          ctx.ellipse(g() * w, g() * h, 4 + g() * 5, 3 + g() * 3, g() * PI, 0, PI * 2);
          ctx.fill();
        }
        return;
      }
      ctx.fillStyle = '#888';
      ctx.fillRect(0, 0, w, h);
    };
  }

  function vgrad(ctx, w, h, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    stops.forEach(([k, c]) => g.addColorStop(k, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function blobs(ctx, g, n, x0, y0, x1, y1, r0, r1, cols, a) {
    for (let i = 0; i < n; i++) {
      const x = x0 + g() * (x1 - x0), y = y0 + g() * (y1 - y0), r = r0 + g() * (r1 - r0);
      soft(ctx, x, y, r, r * (0.8 + g() * 0.4), cols[Math.floor(g() * cols.length)], a);
    }
  }

  function noise(ctx, g, w, h, n, a, size) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = g() < 0.5 ? `rgba(0,0,0,${a * g()})` : `rgba(255,255,255,${a * g()})`;
      ctx.fillRect(g() * w, g() * h, size || 2, size || 2);
    }
  }

  function text(ctx, str, x, y, size, col, opts) {
    const o = opts || {};
    ctx.save();
    ctx.translate(x, y);
    if (o.mirror) ctx.scale(-1, 1);
    ctx.font = `${o.weight || 'bold'} ${size}px ${o.font || 'Arial, sans-serif'}`;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = col;
    if (o.spacing) {
      const chars = [...str];
      const widths = chars.map(c => ctx.measureText(c).width + o.spacing);
      let cx = -widths.reduce((a, b) => a + b, 0) / 2;
      chars.forEach((c, i) => { ctx.fillText(c, cx + widths[i] / 2, 0); cx += widths[i]; });
    } else ctx.fillText(str, 0, 0);
    ctx.restore();
  }

  const BG = {
    skyGrey: (ctx, w, h) => vgrad(ctx, w, h, [[0, '#6d7f92'], [0.6, '#8496a6'], [1, '#97a4ac']]),
    skyBlue: (ctx, w, h) => vgrad(ctx, w, h, [[0, '#2a3e8a'], [0.55, '#3c56a8'], [1, '#5a72b8']]),
    skyWhite: (ctx, w, h) => vgrad(ctx, w, h, [[0, '#d8d0d2'], [0.6, '#e8e2e2'], [1, '#d0c8c4']]),
    desert: (ctx, w, h) => {
      const g = rand(5);
      vgrad(ctx, w, h, [[0, '#b8b4aa'], [0.38, '#d8cdb4'], [0.46, '#d2b48a'], [1, '#c89a64']]);
      ctx.fillStyle = 'rgba(150,140,130,0.55)';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.44);
      for (let i = 0; i <= 20; i++) ctx.lineTo(i / 20 * w, h * (0.42 - 0.03 * Math.sin(i * 1.3) - 0.02 * g()));
      ctx.lineTo(w, h * 0.46);
      ctx.lineTo(0, h * 0.46);
      ctx.fill();
      blobs(ctx, g, 160, 0, h * 0.47, w, h, 4, 16, ['rgba(120,90,60,A)', 'rgba(230,200,150,A)'], 0.35);
      blobs(ctx, g, 40, 0, h * 0.45, w, h * 0.52, 3, 8, ['rgba(90,90,60,A)'], 0.5);
    },
    sandWall: (ctx, w, h) => {
      const g = rand(9);
      vgrad(ctx, w, h, [[0, '#b88a5a'], [0.5, '#c8966a'], [1, '#a87a50']]);
      blobs(ctx, g, 120, 0, 0, w, h, 6, 30, ['rgba(220,170,120,A)', 'rgba(120,80,50,A)'], 0.3);
    },
    wallBeige: (ctx, w, h) => {
      vgrad(ctx, w, h, [[0, '#8a7a66'], [0.45, '#b8a68c'], [1, '#9a8a74']]);
      soft(ctx, w * 0.35, h * 0.4, w * 0.5, h * 0.5, 'rgba(240,220,190,A)', 0.35);
    },
    wallBrown: (ctx, w, h) => {
      vgrad(ctx, w, h, [[0, '#7a5a3e'], [0.5, '#9a7050'], [1, '#6a4a32']]);
      soft(ctx, w * 0.5, h * 0.3, w * 0.4, h * 0.4, 'rgba(200,150,100,A)', 0.3);
    },
    gusWall: (ctx, w, h) => {
      vgrad(ctx, w, h, [[0, '#4a3226'], [0.5, '#6a4a38'], [1, '#3a281e']]);
      soft(ctx, w * 0.6, h * 0.35, w * 0.4, h * 0.35, 'rgba(160,110,80,A)', 0.35);
    },
    darkBokeh: (ctx, w, h) => {
      const g = rand(13);
      vgrad(ctx, w, h, [[0, '#1a1814'], [1, '#2a241c']]);
      blobs(ctx, g, 18, 0, 0, w, h, w * 0.04, w * 0.1, ['rgba(140,120,80,A)', 'rgba(90,80,60,A)'], 0.45);
      soft(ctx, w * 0.25, h * 0.4, w * 0.08, h * 0.35, 'rgba(200,190,160,A)', 0.4);
      soft(ctx, w * 0.82, h * 0.55, w * 0.08, h * 0.25, 'rgba(200,190,160,A)', 0.35);
    },
    nightBlue: (ctx, w, h) => {
      const g = rand(17);
      vgrad(ctx, w, h, [[0, '#060a18'], [0.5, '#0e1838'], [1, '#081028']]);
      blobs(ctx, g, 10, 0, h * 0.5, w, h, w * 0.05, w * 0.12, ['rgba(40,60,120,A)'], 0.4);
    },
    treesRoad: (ctx, w, h) => {
      const g = rand(21);
      vgrad(ctx, w, h, [[0, '#c8c6b8'], [0.35, '#a8ae98'], [0.62, '#7a8a5a'], [0.7, '#9a9890'], [1, '#8a8478']]);
      blobs(ctx, g, 90, 0, h * 0.05, w, h * 0.62, w * 0.03, w * 0.08, ['rgba(60,80,40,A)', 'rgba(90,110,60,A)', 'rgba(40,55,30,A)'], 0.7);
      for (let i = 0; i < 14; i++) {
        const x = g() * w;
        ctx.fillStyle = 'rgba(60,50,40,0.5)';
        ctx.fillRect(x, h * (0.35 + g() * 0.15), w * 0.006, h * 0.3);
      }
      ctx.fillStyle = 'rgba(110,108,104,0.9)';
      ctx.fillRect(0, h * 0.7, w, h * 0.3);
    },
    officeWall: (ctx, w, h) => {
      const g = rand(29);
      vgrad(ctx, w, h, [[0, '#3a2c20'], [0.5, '#4a3828'], [1, '#2a2018']]);
      [[0.12, 0.3], [0.32, 0.26], [0.86, 0.3]].forEach(([x, y]) => {
        ctx.fillStyle = '#1a1410';
        ctx.fillRect(x * w - 30, y * h - 22, 60, 44);
        ctx.fillStyle = '#d8ccb0';
        ctx.fillRect(x * w - 24, y * h - 16, 48, 32);
        ctx.fillStyle = 'rgba(80,60,40,0.6)';
        for (let i = 0; i < 4; i++) ctx.fillRect(x * w - 18, y * h - 10 + i * 6, 36, 2);
      });
      noise(ctx, g, w, h, 1500, 0.08, 2);
    },
    blindsBright: (ctx, w, h) => {
      vgrad(ctx, w, h, [[0, '#f4f0e0'], [1, '#e8dcc0']]);
      for (let y = 0; y < h; y += h / 24) {
        ctx.fillStyle = 'rgba(150,130,100,0.45)';
        ctx.fillRect(0, y, w, h / 70);
      }
    },
    parchment: (ctx, w, h) => {
      const g = rand(31);
      vgrad(ctx, w, h, [[0, '#a8783a'], [0.5, '#c89a52'], [1, '#9a6a30']]);
      blobs(ctx, g, 50, 0, 0, w, h, 20, 60, ['rgba(120,70,20,A)', 'rgba(230,190,120,A)'], 0.25);
      text(ctx, 'We the People', w * 0.62, h * 0.4, h * 0.1, 'rgba(60,30,10,0.85)', { font: 'Georgia, serif', weight: 'italic bold' });
      ctx.fillStyle = 'rgba(70,40,15,0.45)';
      for (let i = 0; i < 22; i++) {
        const y = h * 0.5 + i * h * 0.022;
        for (let x = w * 0.08; x < w * 0.92; x += 6 + g() * 14) ctx.fillRect(x, y, 3 + g() * 9, 2);
      }
    },
    labFloor: (ctx, w, h) => {
      const g = rand(37);
      ctx.fillStyle = '#8a2a2a';
      ctx.fillRect(0, 0, w, h);
      blobs(ctx, g, 60, 0, 0, w, h, 10, 50, ['rgba(160,60,60,A)', 'rgba(90,20,20,A)'], 0.35);
      ctx.strokeStyle = 'rgba(60,10,10,0.6)';
      ctx.lineWidth = 2;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * w / 4, 0);
        ctx.lineTo(i * w / 4, h);
        ctx.moveTo(0, i * h / 4);
        ctx.lineTo(w, i * h / 4);
        ctx.stroke();
      }
    },
    gravel: (ctx, w, h) => {
      const g = rand(41);
      ctx.fillStyle = '#9a948a';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) {
        const c = 90 + g() * 120;
        ctx.fillStyle = `rgb(${c},${c - 6},${c - 14})`;
        ctx.beginPath();
        ctx.ellipse(g() * w, g() * h, 1 + g() * 3, 1 + g() * 2, g() * PI, 0, PI * 2);
        ctx.fill();
      }
    },
    bushes: (ctx, w, h) => {
      const g = rand(43);
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) {
        const x = g() * w, y = h * 0.25 + g() * h * 0.75;
        ctx.fillStyle = ['#3a5a2a', '#4e7038', '#2a4420', '#6a8a48'][Math.floor(g() * 4)];
        ctx.beginPath();
        ctx.ellipse(x, y, 6 + g() * 14, 5 + g() * 10, g() * PI, 0, PI * 2);
        ctx.fill();
      }
    },
    houseWall: (ctx, w, h) => {
      const g = rand(47);
      vgrad(ctx, w, h, [[0, '#d8c8a8'], [1, '#c4b292']]);
      noise(ctx, g, w, h, 4000, 0.12, 2);
      ctx.fillStyle = 'rgba(90,70,50,0.35)';
      ctx.fillRect(0, h * 0.86, w, h * 0.14);
    },
    suburb: (ctx, w, h) => {
      const g = rand(53);
      vgrad(ctx, w, h, [[0, '#d8e6ee'], [0.5, '#c8d4d0'], [1, '#a8a088']]);
      for (let i = 0; i < 6; i++) {
        const x = g() * w;
        ctx.fillStyle = ['#d8c8b0', '#e8dcc8', '#c8b8a0'][i % 3];
        ctx.fillRect(x, h * 0.45, w * 0.18, h * 0.3);
        ctx.fillStyle = 'rgba(120,90,70,0.8)';
        ctx.fillRect(x - 6, h * 0.42, w * 0.18 + 12, h * 0.05);
      }
      blobs(ctx, g, 40, 0, h * 0.2, w, h * 0.6, 10, 30, ['rgba(70,100,50,A)', 'rgba(110,130,70,A)'], 0.6);
    },
    hills: (ctx, w, h) => {
      const g = rand(59);
      vgrad(ctx, w, h, [[0, '#c8d8e0'], [0.4, '#a8b8b0'], [1, '#6a7850']]);
      ctx.fillStyle = '#7a8a5e';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      for (let i = 0; i <= 24; i++) ctx.lineTo(i / 24 * w, h * (0.42 + 0.08 * Math.sin(i * 0.7) + 0.04 * g()));
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();
      blobs(ctx, g, 160, 0, h * 0.45, w, h, 6, 22, ['rgba(60,80,40,A)', 'rgba(110,120,70,A)', 'rgba(140,140,100,A)'], 0.55);
    },
    bookshelf: (ctx, w, h) => {
      const g = rand(61);
      ctx.fillStyle = '#3a2a1e';
      ctx.fillRect(0, 0, w, h);
      for (let row = 0; row < 5; row++) {
        const y0 = row * h / 5 + 8, y1 = (row + 1) * h / 5 - 6;
        let x = 4;
        while (x < w - 4) {
          const bw = 6 + g() * 14;
          const c = ['#6a3a2a', '#2a4a6a', '#8a7a5a', '#4a5a3a', '#a89a7a', '#2a2a3a', '#d8d0c0'][Math.floor(g() * 7)];
          ctx.fillStyle = c;
          ctx.fillRect(x, y0 + g() * 10, bw - 1, y1 - y0 - g() * 10);
          x += bw;
        }
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(0, y1, w, 6);
      }
    },
    redBokeh: (ctx, w, h) => {
      const g = rand(67);
      ctx.fillStyle = '#1a0806';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) {
        const r = 6 + g() * 22;
        ctx.fillStyle = ['rgba(230,80,40,0.55)', 'rgba(250,150,90,0.5)', 'rgba(180,40,30,0.5)', 'rgba(255,200,150,0.4)'][Math.floor(g() * 4)];
        ctx.beginPath();
        ctx.arc(g() * w, g() * h * 0.8, r, 0, PI * 2);
        ctx.fill();
      }
    },
    yellowDark: (ctx, w, h) => {
      const g = rand(71);
      vgrad(ctx, w, h, [[0, '#2a2208'], [1, '#141004']]);
      blobs(ctx, g, 12, 0, 0, w, h, 30, 80, ['rgba(160,140,40,A)', 'rgba(110,90,20,A)'], 0.35);
    },
    hospital: (ctx, w, h) => {
      vgrad(ctx, w, h, [[0, '#c8c4b8'], [1, '#b0aca0']]);
      ctx.fillStyle = '#e8e4da';
      ctx.fillRect(w * 0.55, h * 0.12, w * 0.08, h * 0.12);
      ctx.fillRect(w * 0.7, h * 0.12, w * 0.06, h * 0.12);
      ctx.fillStyle = '#7a7a72';
      ctx.fillRect(w * 0.58, h * 0.15, w * 0.02, h * 0.06);
      ctx.fillRect(w * 0.72, h * 0.15, w * 0.02, h * 0.06);
      ctx.fillStyle = '#a8a498';
      ctx.fillRect(w * 0.1, h * 0.05, w * 0.3, h * 0.08);
    },
    warehouse: (ctx, w, h) => {
      const g = rand(73);
      ctx.fillStyle = '#1a1c20';
      ctx.fillRect(0, 0, w, h);
      for (let row = 0; row < 6; row++) {
        const y = row * h / 6;
        ctx.fillStyle = '#c86a1a';
        ctx.fillRect(0, y + h / 6 - 5, w, 5);
        for (let x = 4; x < w; x += 22) {
          if (g() < 0.25) continue;
          ctx.fillStyle = g() < 0.6 ? '#2a5aa8' : '#d8d4c8';
          ctx.fillRect(x, y + 10, 18, h / 6 - 18);
        }
      }
      ctx.fillStyle = '#2a3a2a';
      for (let x = 0; x < w; x += w / 5) ctx.fillRect(x, 0, 8, h);
    },
    granite: (ctx, w, h) => {
      const g = rand(79);
      ctx.fillStyle = '#16181c';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const c = 30 + g() * 90;
        ctx.fillStyle = `rgba(${c},${c},${c + 8},${0.4 + g() * 0.5})`;
        ctx.fillRect(g() * w, g() * h, 1 + g() * 3, 1 + g() * 3);
      }
    },
    basket: (ctx, w, h) => {
      vgrad(ctx, w, h, [[0, '#0a1a3a'], [0.3, '#2a5ab8'], [1, '#1a3a8a']]);
      ctx.fillStyle = '#071230';
      for (let i = 0; i < 7; i++) {
        ctx.save();
        ctx.translate(w * (0.08 + i * 0.145), h * 0.62);
        ctx.rotate(-0.12);
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.028, h * 0.24, 0, 0, PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    whiteRoom: (ctx, w, h) => vgrad(ctx, w, h, [[0, '#f6f6f4'], [1, '#e8e8e6']]),
    oldRoom: (ctx, w, h) => {
      vgrad(ctx, w, h, [[0, '#d8d8d4'], [1, '#c8c6c0']]);
      [[0.12, 0.3], [0.2, 0.55], [0.3, 0.35]].forEach(([x, y]) => {
        ctx.fillStyle = '#f4f4f0';
        ctx.fillRect(x * w, y * h, w * 0.06, h * 0.18);
        ctx.fillStyle = '#4a6ab8';
        ctx.fillRect(x * w + w * 0.02, y * h + 4, 6, 6);
      });
      ctx.fillStyle = '#b8b6b0';
      ctx.fillRect(w * 0.45, 0, 4, h);
    },
    arch: (ctx, w, h) => {
      vgrad(ctx, w, h, [[0, '#fff8e0'], [1, '#f0d8a0']]);
      ctx.strokeStyle = 'rgba(160,120,70,0.5)';
      ctx.lineWidth = 3;
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(i * w / 6, h * 0.2);
        ctx.lineTo(i * w / 6, h);
        ctx.stroke();
      }
    },
    labWall: (ctx, w, h) => {
      const g = rand(83);
      vgrad(ctx, w, h, [[0, '#1a1c1e'], [1, '#2a2826']]);
      for (let i = 0; i < 8; i++) soft(ctx, (i + 0.5) * w / 8, h * 0.2, 14, 8, 'rgba(255,240,200,A)', 0.8);
      noise(ctx, g, w, h, 800, 0.1, 3);
    },
    rvWall: (ctx, w, h) => {
      const g = rand(89);
      vgrad(ctx, w, h, [[0, '#4a3018'], [1, '#2a1a0e']]);
      for (let x = 0; x < w; x += 18) {
        ctx.fillStyle = `rgba(120,80,40,${0.2 + g() * 0.2})`;
        ctx.fillRect(x, 0, 2, h);
      }
      soft(ctx, w * 0.7, h * 0.4, w * 0.2, h * 0.3, 'rgba(220,180,120,A)', 0.4);
    },
    roundRoom: (ctx, w, h) => {
      vgrad(ctx, w, h, [[0, '#3a2e1e'], [1, '#2a2014']]);
      [[0.3, 0.25], [0.55, 0.3], [0.8, 0.22]].forEach(([x, y]) => {
        soft(ctx, x * w, y * h, w * 0.09, w * 0.09, 'rgba(255,240,200,A)', 0.95);
        ctx.fillStyle = 'rgba(255,250,235,0.95)';
        ctx.beginPath();
        ctx.arc(x * w, y * h, w * 0.04, 0, PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = 'rgba(120,90,60,0.6)';
      ctx.fillRect(w * 0.66, 0, w * 0.05, h);
    },
    tentLab: (ctx, w, h) => {
      const g = rand(97);
      vgrad(ctx, w, h, [[0, '#2a2620'], [1, '#1a1814']]);
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = ['#c86a2a', '#e8a050', '#b84a1a'][i % 3];
        ctx.fillRect(w * (0.42 + i * 0.04), h * 0.36, w * 0.025, h * 0.12);
      }
      soft(ctx, w * 0.6, h * 0.35, w * 0.2, h * 0.08, 'rgba(255,210,150,A)', 0.6);
      noise(ctx, g, w, h, 600, 0.1, 3);
    },
    junkSky: (ctx, w, h) => {
      vgrad(ctx, w, h, [[0, '#c8bcc0'], [0.7, '#e2d8d6'], [1, '#d0c4c0']]);
    }
  };

  function bg(name) {
    return BG[name];
  }

  function paper(ctx, w, h) {
    const g = rand(101);
    ctx.fillStyle = '#f2f0ea';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(40,50,90,0.65)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 14; i++) {
      const y = 18 + i * (h - 30) / 14;
      ctx.beginPath();
      let x = 14 + g() * 10;
      ctx.moveTo(x, y);
      while (x < w * (0.6 + g() * 0.3)) {
        x += 4 + g() * 6;
        ctx.lineTo(x, y + (g() - 0.5) * 4);
      }
      ctx.stroke();
    }
  }

  function decal(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    text(ctx, 'SAUL GOODMAN', w / 2, h * 0.3, h * 0.2, '#101012', { mirror: true, spacing: h * 0.02, font: 'Arial Black, Arial, sans-serif' });
    text(ctx, 'ATTORNEY AT LAW', w / 2, h * 0.58, h * 0.13, '#101012', { mirror: true, spacing: h * 0.015 });
    text(ctx, '(505) 555-0149', w / 2, h * 0.82, h * 0.11, '#101012', { mirror: true });
  }

  function plate(ctx, w, h) {
    ctx.fillStyle = '#e8d040';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#7a1a1a';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    text(ctx, '3NL 019', w / 2, h * 0.58, h * 0.5, '#7a1a1a');
    text(ctx, 'NEW MEXICO', w / 2, h * 0.17, h * 0.17, '#7a1a1a');
  }

  function mug(ctx, w, h) {
    ctx.fillStyle = '#f2f2f0';
    ctx.fillRect(0, 0, w, h);
    text(ctx, 'DEA', w * 0.3, h * 0.5, h * 0.42, '#141414', { font: 'Arial Black, Arial, sans-serif' });
  }

  function cards(ctx, w, h) {
    ctx.fillStyle = '#f6f4ee';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(1, 1, w - 2, h - 2);
    text(ctx, '7', w * 0.2, h * 0.15, h * 0.18, '#b81a1a');
    text(ctx, '♥', w * 0.5, h * 0.5, h * 0.3, '#b81a1a');
  }

  function digits(ctx, w, h) {
    BG.granite(ctx, w, h);
    const g = rand(103);
    ['0', '0', '9'].forEach((d, i) => {
      const x = w * (0.4 + i * 0.07), y = h * 0.5;
      ctx.fillStyle = '#5a4a24';
      ctx.fillRect(x - w * 0.026, y - h * 0.11, w * 0.052, h * 0.22);
      ctx.fillStyle = '#c8a850';
      ctx.fillRect(x - w * 0.022, y - h * 0.095, w * 0.044, h * 0.19);
      text(ctx, d, x, y + h * 0.005, h * 0.16, '#3a2a10', { font: 'Georgia, serif' });
    });
    noise(ctx, g, w, h, 600, 0.15, 2);
  }

  function chest(ctx, w, h) {
    ctx.fillStyle = '#1c1e1c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#4ac83a';
    ctx.lineWidth = w * 0.03;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.52, w * 0.16, 0, PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#4ac83a';
    ctx.beginPath();
    ctx.moveTo(w * 0.54, h * 0.38);
    ctx.lineTo(w * 0.45, h * 0.54);
    ctx.lineTo(w * 0.51, h * 0.54);
    ctx.lineTo(w * 0.46, h * 0.67);
    ctx.lineTo(w * 0.57, h * 0.49);
    ctx.lineTo(w * 0.51, h * 0.49);
    ctx.closePath();
    ctx.fill();
  }

  window.BreakArt = { hex, shadeHex, soft, cloth, bg, BG, paper, decal, plate, mug, cards, digits, chest, text, vgrad, blobs, noise };
})();
