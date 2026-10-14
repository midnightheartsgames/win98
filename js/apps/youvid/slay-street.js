(function () {
  const { M4, V3, rgb, rand, Builder } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S } = K;

  const CURB = 3.4;
  const FAR_CURB = 9.6;
  const FAR = 12.4;
  const ROAD_Y = -0.12;
  const DOOR = { x0: 0.7, x1: 1.62, top: 2.3 };
  const WIN_L = { x0: -0.95, x1: 0.55, y0: 0.22, y1: 2.68 };
  const EDGE = -1.75;
  const STEP = 1.15;
  const WIN_R = { x0: 1.8, x1: 3.1, y0: 0.55, y1: 2.68 };

  const COL = {
    navy: 0x26324a,
    navyDark: 0x1b2436,
    red: 0xd2121e,
    cream: 0xeee6d6,
    chrome: 0xc9ccd2,
    steel: 0xa9adb3,
    black: 0x15161a,
    tyre: 0x1c1c1e,
    white: 0xf2f2f0
  };

  function px(ctx, w, mw) {
    return w / mw;
  }

  function noise(ctx, w, h, seed, amount, count) {
    const g = rand(seed);
    for (let i = 0; i < count; i++) {
      const v = g();
      ctx.fillStyle = v < 0.5 ? `rgba(0,0,0,${amount * g()})` : `rgba(255,255,255,${amount * g()})`;
      ctx.fillRect(g() * w, g() * h, 1 + g() * 3, 1 + g() * 2);
    }
  }

  function texPaving(ctx, w, h) {
    ctx.fillStyle = '#cfc9bf';
    ctx.fillRect(0, 0, w, h);
    const g = rand(11);
    const n = 4;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const k = 0.94 + g() * 0.1;
        ctx.fillStyle = `rgb(${Math.round(207 * k)},${Math.round(201 * k)},${Math.round(191 * k)})`;
        ctx.fillRect(i * w / n + 1, j * h / n + 1, w / n - 2, h / n - 2);
      }
    }
    ctx.strokeStyle = 'rgba(120,112,100,0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath(); ctx.moveTo(i * w / n, 0); ctx.lineTo(i * w / n, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * h / n); ctx.lineTo(w, i * h / n); ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `rgba(90,80,70,${0.05 + g() * 0.06})`;
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 6 + g() * 16, 4 + g() * 10, g() * PI, 0, PI * 2);
      ctx.fill();
    }
    noise(ctx, w, h, 12, 0.12, w * h * 0.08);
  }

  function texAsphalt(ctx, w, h) {
    ctx.fillStyle = '#56575b';
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 21, 0.22, w * h * 0.3);
    const g = rand(22);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(30,30,32,${0.08 + g() * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 20 + g() * 40, 8 + g() * 20, g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function bricks(ctx, x0, y0, x1, y1, scale, seed, base) {
    const g = rand(seed);
    const bh = 0.075 * scale, bw = 0.225 * scale;
    ctx.fillStyle = '#9c8a78';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    const tones = base || [[150, 74, 52], [138, 66, 46], [164, 86, 60], [126, 62, 46], [172, 98, 70]];
    let row = 0;
    for (let y = y0; y < y1; y += bh, row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let x = x0 - off; x < x1; x += bw) {
        const t = tones[Math.floor(g() * tones.length)];
        const k = 0.9 + g() * 0.2;
        ctx.fillStyle = `rgb(${Math.round(t[0] * k)},${Math.round(t[1] * k)},${Math.round(t[2] * k)})`;
        ctx.fillRect(Math.max(x0, x + 0.6), y + 0.6, Math.min(bw - 1.2, x1 - x - 0.6), bh - 1.2);
      }
    }
  }

  function glassGrad(ctx, x, y, w, h, top, bottom) {
    const gr = ctx.createLinearGradient(x, y, x, y + h);
    gr.addColorStop(0, top || '#8ea3b8');
    gr.addColorStop(0.55, bottom || '#3a4656');
    gr.addColorStop(1, '#202833');
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h);
  }

  function sash(ctx, x, y, w, h, opts) {
    const o = opts || {};
    const f = Math.max(2, w * 0.07);
    ctx.fillStyle = o.frame || '#f4f2ec';
    ctx.fillRect(x - f, y - f, w + f * 2, h + f * 2);
    glassGrad(ctx, x, y, w, h, o.sky, o.dark);
    if (o.curtain) {
      ctx.fillStyle = o.curtain;
      ctx.fillRect(x, y, w * 0.22, h);
      ctx.fillRect(x + w * 0.78, y, w * 0.22, h);
    }
    ctx.fillStyle = o.frame || '#f4f2ec';
    ctx.fillRect(x, y + h * 0.5 - f * 0.5, w, f);
    const bars = o.bars === undefined ? 2 : o.bars;
    ctx.lineWidth = Math.max(1, f * 0.35);
    ctx.strokeStyle = o.frame || '#f4f2ec';
    for (let i = 1; i <= bars; i++) {
      const bx = x + (w * i) / (bars + 1);
      ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx, y + h); ctx.stroke();
    }
    if (o.rows) {
      [0.25, 0.75].forEach(k => { ctx.beginPath(); ctx.moveTo(x, y + h * k); ctx.lineTo(x + w, y + h * k); ctx.stroke(); });
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y);
    ctx.lineTo(x + w * 0.35, y);
    ctx.lineTo(x + w * 0.05, y + h * 0.45);
    ctx.lineTo(x, y + h * 0.3);
    ctx.fill();
    ctx.fillStyle = o.sill || '#e2ded6';
    ctx.fillRect(x - f * 1.6, y + h + f, w + f * 3.2, f * 1.2);
  }

  function signText(ctx, text, x, y, size, color, weight, align) {
    ctx.fillStyle = color;
    ctx.font = `${weight || 'bold'} ${size}px Georgia, 'Times New Roman', serif`;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function sansText(ctx, text, x, y, size, color, weight, align) {
    ctx.fillStyle = color;
    ctx.font = `${weight || 'bold'} ${size}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function shopfront(ctx, w, h, mw, mh, o) {
    const k = px(ctx, w, mw);
    const Y = (m) => h - m * k;
    ctx.fillStyle = o.pier || '#2a3346';
    ctx.fillRect(0, Y(3.6), w, 3.6 * k);
    ctx.fillStyle = o.fascia || '#1f2a3c';
    ctx.fillRect(0, Y(3.6), w, 0.62 * k);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, Y(3.6), w, 0.05 * k);
    const pier = 0.35 * k;
    const gx = pier, gw = w - pier * 2;
    glassGrad(ctx, gx, Y(2.9), gw, 2.4 * k, o.glassTop || '#7d8fa3', o.glassBottom || '#2c3542');
    if (o.inside) o.inside(ctx, gx, Y(2.9), gw, 2.4 * k, k);
    ctx.fillStyle = o.pier || '#2a3346';
    const doorX = gx + gw * (o.door === undefined ? 0.72 : o.door);
    ctx.fillRect(doorX - 0.06 * k, Y(2.9), 0.12 * k, 2.4 * k);
    ctx.fillRect(doorX + 0.95 * k, Y(2.9), 0.12 * k, 2.4 * k);
    ctx.fillRect(gx, Y(0.5), doorX - gx - 0.06 * k, 0.5 * k);
    ctx.fillRect(doorX + 1.07 * k, Y(0.5), w - doorX - 1.07 * k, 0.5 * k);
    ctx.fillRect(gx, Y(2.95), gw, 0.08 * k);
    if (o.sign) o.sign(ctx, w / 2, Y(3.29), k);
  }

  function facadeTex(spec) {
    return (ctx, w, h) => {
      const k = w / spec.w;
      const Y = (m) => h - m * k;
      if (spec.brick) bricks(ctx, 0, 0, w, h, k, spec.seed || 5, spec.brick === true ? null : spec.brick);
      else {
        ctx.fillStyle = spec.wall;
        ctx.fillRect(0, 0, w, h);
        noise(ctx, w, h, spec.seed || 7, 0.05, w * h * 0.05);
      }
      if (spec.bands) {
        ctx.fillStyle = spec.bandColor || 'rgba(255,255,255,0.75)';
        spec.bands.forEach(y => ctx.fillRect(0, Y(y) - 0.08 * k, w, 0.16 * k));
      }
      if (spec.cornice) {
        ctx.fillStyle = spec.cornice;
        ctx.fillRect(0, 0, w, 0.45 * k);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, 0.45 * k, w, 0.08 * k);
      }
      (spec.floors || []).forEach(fl => {
        (spec.cols || []).forEach(cx => {
          sash(ctx, (cx - spec.winW / 2) * k, Y(fl + spec.winH), spec.winW * k, spec.winH * k, spec.sash);
        });
      });
      if (spec.shop) shopfront(ctx, w, h, spec.w, spec.h, spec.shop);
      if (spec.extra) spec.extra(ctx, w, h, k, Y);
    };
  }

  function insideShelves(colA, colB) {
    return (ctx, x, y, w, h, k) => {
      const g = rand(31);
      ctx.fillStyle = 'rgba(240,236,226,0.35)';
      ctx.fillRect(x, y + h * 0.05, w, h * 0.5);
      for (let i = 0; i < 4; i++) {
        const sy = y + h * (0.2 + i * 0.16);
        ctx.fillStyle = 'rgba(30,30,34,0.55)';
        ctx.fillRect(x + w * 0.05, sy, w * 0.9, 2);
        for (let j = 0; j < 14; j++) {
          ctx.fillStyle = g() < 0.5 ? colA : colB;
          ctx.globalAlpha = 0.6;
          ctx.fillRect(x + w * (0.06 + j * 0.064), sy - h * 0.07, w * 0.04, h * 0.07);
          ctx.globalAlpha = 1;
        }
      }
    };
  }

  const OPP = [
    {
      key: 'pub', x0: -6.5, x1: 3, h: 12.0, brick: [[118, 58, 44], [132, 66, 48], [104, 52, 40], [142, 74, 54]], seed: 41,
      floors: [], cols: [], winW: 0, winH: 0, cornice: '#e9e5dc', bands: [3.75, 7.2],
      shop: {
        fascia: '#141518', pier: '#18191c', door: 0.45, glassTop: '#56606c', glassBottom: '#1a1c21',
        sign: (ctx, cx, cy, k) => {
          sansText(ctx, 'THE HOPDOG', cx - 1.4 * k, cy, Math.round(0.36 * k), '#f4f4f0', '900');
          ctx.strokeStyle = '#f4f4f0';
          ctx.lineWidth = 0.05 * k;
          [cx + 2.2 * k, cx - 4.6 * k].forEach(x => { ctx.beginPath(); ctx.arc(x, cy, 0.22 * k, 0, PI * 2); ctx.stroke(); });
        },
        inside: (ctx, x, y, w, h, k) => {
          ctx.fillStyle = 'rgba(210,150,90,0.35)';
          for (let i = 0; i < 5; i++) ctx.fillRect(x + w * (0.08 + i * 0.18), y + h * 0.1, w * 0.06, h * 0.04);
        }
      }
    },
    {
      key: 'elk', x0: -14.5, x1: -6.5, h: 13.2, wall: '#98a5b5', seed: 42,
      floors: [4.25, 7.65, 11.05], cols: [-2.6, 0, 2.6], winW: 1.15, winH: 1.95,
      sash: { bars: 1, rows: true }, cornice: '#f1efe8', bands: [3.85],
      shop: {
        fascia: '#1d2738', pier: '#253045', door: 0.55,
        sign: (ctx, cx, cy, k) => {
          signText(ctx, 'The Dapper Elk', cx + 0.35 * k, cy - 0.06 * k, Math.round(0.34 * k), '#d8b46a', 'bold');
          sansText(ctx, '— BARBERSHOP —', cx + 0.35 * k, cy + 0.2 * k, Math.round(0.11 * k), '#d8b46a', 'bold');
          ctx.strokeStyle = '#d8b46a';
          ctx.lineWidth = 0.035 * k;
          const ex = cx - 3.0 * k;
          ctx.beginPath();
          ctx.arc(ex, cy + 0.05 * k, 0.14 * k, 0, PI * 2);
          ctx.moveTo(ex - 0.08 * k, cy - 0.08 * k); ctx.lineTo(ex - 0.25 * k, cy - 0.3 * k); ctx.lineTo(ex - 0.32 * k, cy - 0.2 * k);
          ctx.moveTo(ex + 0.08 * k, cy - 0.08 * k); ctx.lineTo(ex + 0.25 * k, cy - 0.3 * k); ctx.lineTo(ex + 0.32 * k, cy - 0.2 * k);
          ctx.stroke();
        },
        inside: insideShelves('#d9cdb4', '#6e4a3a')
      },
      extra: (ctx, w, h, k, Y) => {
        const x = w - 0.25 * k, y = Y(3.55);
        ctx.fillStyle = '#f2f2f2';
        ctx.fillRect(x - 0.08 * k, y, 0.16 * k, 0.45 * k);
        ctx.fillStyle = '#c61a24';
        for (let i = 0; i < 4; i++) ctx.fillRect(x - 0.08 * k, y + (i * 0.11 + 0.02) * k, 0.16 * k, 0.04 * k);
        ctx.fillStyle = '#2b5fb0';
        for (let i = 0; i < 4; i++) ctx.fillRect(x - 0.08 * k, y + (i * 0.11 + 0.07) * k, 0.16 * k, 0.03 * k);
        ctx.fillStyle = '#e8e4da';
        ctx.fillRect(0.4 * k, Y(5.9), 1.1 * k, 0.55 * k);
        sansText(ctx, 'TO LET', 0.95 * k, Y(5.62), Math.round(0.16 * k), '#c0252c', 'bold');
      }
    },
    {
      key: 'hearing', x0: -30, x1: -22, h: 13.0, brick: [[150, 80, 58], [138, 72, 52], [160, 92, 66], [128, 66, 50]], seed: 43,
      floors: [], cols: [], winW: 0, winH: 0, cornice: '#ecebe6', bands: [3.8],
      shop: {
        fascia: '#f3f4f6', pier: '#d9dde3', door: 0.12, glassTop: '#8a9db2', glassBottom: '#3b4757',
        sign: (ctx, cx, cy, k) => {
          ctx.fillStyle = '#2f7fd0';
          ctx.beginPath();
          ctx.arc(cx - 1.75 * k, cy, 0.17 * k, 0, PI * 2);
          ctx.fill();
          sansText(ctx, 'Clear Sound', cx + 0.2 * k, cy - 0.06 * k, Math.round(0.3 * k), '#244f86', 'bold');
          sansText(ctx, 'Hearing Centre', cx + 0.2 * k, cy + 0.2 * k, Math.round(0.11 * k), '#3a4f6a', 'normal');
        },
        inside: (ctx, x, y, w, h) => {
          ctx.fillStyle = 'rgba(235,240,246,0.45)';
          ctx.fillRect(x + w * 0.3, y + h * 0.15, w * 0.35, h * 0.55);
        }
      }
    },
    {
      key: 'noodle', x0: -22, x1: -14.5, h: 12.4, wall: '#ecebe4', seed: 44,
      floors: [4.2, 7.4, 10.6], cols: [-1.9, 0, 1.9], winW: 1.0, winH: 1.8,
      sash: { bars: 1 }, cornice: '#d8d6cf', bands: [3.8],
      shop: {
        fascia: '#8e1d22', pier: '#5a1418', door: 0.3,
        sign: (ctx, cx, cy, k) => sansText(ctx, 'NOODLE HOUSE', cx, cy, Math.round(0.3 * k), '#f6e7c2', 'bold'),
        inside: insideShelves('#e2b24c', '#9c2a22')
      }
    },
    {
      key: 'market', x0: -39, x1: -30, h: 13.5, brick: true, seed: 45,
      floors: [4.4, 7.8, 11.2], cols: [-3.4, -1.1, 1.2, 3.5], winW: 1.05, winH: 1.9,
      sash: { bars: 1, frame: '#f0ede4' }, cornice: '#e7e2d6', bands: [4.0],
      shop: {
        fascia: '#2f6b3a', pier: '#264f2f', door: 0.5,
        sign: (ctx, cx, cy, k) => sansText(ctx, 'MINI MARKET', cx, cy, Math.round(0.32 * k), '#f8f4e2', 'bold'),
        inside: insideShelves('#e86b3c', '#3ca0d8')
      }
    },
    {
      key: 'grey', x0: -66, x1: -39, h: 14.0, wall: '#b9b4aa', seed: 46,
      floors: [4.3, 7.6, 10.9], cols: [-6.5, -4.0, -1.5, 1.0, 3.5, 6.0], winW: 1.05, winH: 1.85,
      sash: { bars: 1 }, cornice: '#dcd8ce', bands: [3.9],
      shop: { fascia: '#3c3c44', pier: '#2c2c32', door: 0.4, sign: (ctx, cx, cy, k) => sansText(ctx, 'FLOWERS  ·  GIFTS', cx, cy, Math.round(0.3 * k), '#f2e6c8', 'bold') }
    },
    {
      key: 'far1', x0: -96, x1: -66, h: 15.0, brick: true, seed: 48,
      floors: [4.4, 7.8, 11.2], cols: [-12, -8, -4, 0, 4, 8, 12], winW: 1.1, winH: 1.9,
      sash: { bars: 1 }, cornice: '#ddd6c8', bands: [4.0],
      shop: { fascia: '#5a2a2a', pier: '#3a1c1c', door: 0.5, sign: (ctx, cx, cy, k) => sansText(ctx, 'THE OLD BANK  ·  CAFE  ·  SHOES  ·  NEWS', cx, cy, Math.round(0.3 * k), '#f4e6c4', 'bold') }
    },
    {
      key: 'far2', x0: -130, x1: -96, h: 15.0, wall: '#d8d2c4', seed: 49,
      floors: [4.2, 7.4, 10.6], cols: [-14, -9, -4, 1, 6, 11], winW: 1.0, winH: 1.8,
      sash: { bars: 1 }, cornice: '#c8c0ae', bands: [3.9],
      shop: { fascia: '#2a4a3a', pier: '#1c3428', door: 0.5, sign: (ctx, cx, cy, k) => sansText(ctx, 'HIGH STREET', cx, cy, Math.round(0.3 * k), '#f4efe0', 'bold') }
    },
    {
      key: 'white', x0: 3, x1: 16, h: 10.8, wall: '#f0eee8', seed: 47,
      floors: [4.2, 7.4], cols: [-4.6, -1.6, 1.4, 4.4], winW: 1.1, winH: 1.85,
      sash: { bars: 1 }, cornice: '#dad6cc', bands: [3.85],
      shop: { fascia: '#284f7a', pier: '#22405f', door: 0.6, sign: (ctx, cx, cy, k) => sansText(ctx, 'BOOKS & MAPS', cx, cy, Math.round(0.3 * k), '#f5f1e4', 'bold') }
    }
  ];

  const NEAR = [
    {
      key: 'eyecare', x0: -8.5, x1: EDGE, h: 13.0, wall: '#ecebe5', seed: 51,
      floors: [4.4, 7.4, 10.4], cols: [-2.2, 0, 2.2], winW: 1.0, winH: 1.8, sash: { bars: 1 }, cornice: '#d6d2c8', bands: [3.9],
      shop: {
        fascia: '#232a3a', pier: '#242c3c', door: 0.82, glassTop: '#c6d6e6', glassBottom: '#5d6f84',
        sign: (ctx, cx, cy, k) => signText(ctx, 'J. THORN EYECARE', cx, cy, Math.round(0.3 * k), '#f1efe9', 'bold'),
        inside: (ctx, x, y, w, h, k) => {
          ctx.fillStyle = 'rgba(245,245,245,0.35)';
          ctx.fillRect(x + w * 0.08, y + h * 0.2, w * 0.2, h * 0.45);
          ctx.fillRect(x + w * 0.4, y + h * 0.25, w * 0.16, h * 0.4);
          sansText(ctx, 'EYE TESTS', x + w * 0.18, y + h * 0.35, Math.round(0.12 * k), 'rgba(30,40,60,0.8)', 'bold');
        }
      }
    },
    {
      key: 'books', x0: -15.5, x1: -8.5, h: 13.5, brick: true, seed: 52,
      floors: [4.4, 7.6, 10.8], cols: [-2.3, 0, 2.3], winW: 1.0, winH: 1.85, sash: { bars: 1 }, cornice: '#e4dfd4', bands: [4.0],
      shop: { fascia: '#4b2d4f', pier: '#3a2340', door: 0.2, sign: (ctx, cx, cy, k) => sansText(ctx, 'LAVENDER TEA ROOM', cx, cy, Math.round(0.28 * k), '#f4e9f2', 'bold'), inside: insideShelves('#efd9a0', '#9b6b8f') }
    },
    {
      key: 'bank', x0: -26.5, x1: -15.5, h: 14.0, wall: '#d9d2c2', seed: 53,
      floors: [4.6, 8.0, 11.4], cols: [-4, -1.3, 1.3, 4], winW: 1.1, winH: 2.0, sash: { bars: 1 }, cornice: '#c9c1af', bands: [4.1],
      shop: { fascia: '#1c3d5e', pier: '#1a3048', door: 0.5, sign: (ctx, cx, cy, k) => sansText(ctx, 'HIGH STREET POST OFFICE', cx, cy, Math.round(0.26 * k), '#f5d74a', 'bold') }
    },
    {
      key: 'nearFar', x0: -60, x1: -26.5, h: 14.5, wall: '#e2dccd', seed: 56,
      floors: [4.4, 7.6, 10.8], cols: [-13, -8, -3, 2, 7, 12], winW: 1.05, winH: 1.85, sash: { bars: 1 }, cornice: '#cfc6b2', bands: [4.0],
      shop: { fascia: '#33334a', pier: '#262636', door: 0.4, sign: (ctx, cx, cy, k) => sansText(ctx, 'SHOES  ·  BOOTS  ·  BAGS', cx, cy, Math.round(0.3 * k), '#efe9d6', 'bold') }
    },
    {
      key: 'nearFar2', x0: -130, x1: -60, h: 15.0, brick: true, seed: 57,
      floors: [4.4, 7.8, 11.2], cols: [-28, -20, -12, -4, 4, 12, 20, 28], winW: 1.1, winH: 1.9, sash: { bars: 1 }, cornice: '#d9d2c2', bands: [4.0],
      shop: { fascia: '#4a3a2a', pier: '#33281c', door: 0.5, sign: (ctx, cx, cy, k) => sansText(ctx, 'MARKET  ARCADE', cx, cy, Math.round(0.3 * k), '#f3e7cc', 'bold') }
    },
    {
      key: 'bakery', x0: 3.45, x1: 10, h: 10.4, wall: '#efe2c8', seed: 54,
      floors: [4.4, 7.4], cols: [-2, 0, 2], winW: 1.0, winH: 1.8, sash: { bars: 1 }, cornice: '#d9c9a8', bands: [3.9],
      shop: { fascia: '#6a3f1e', pier: '#4f2f17', door: 0.3, sign: (ctx, cx, cy, k) => signText(ctx, 'Crumb & Co. Bakery', cx, cy, Math.round(0.3 * k), '#f6e3b8', 'bold'), inside: insideShelves('#e7b36a', '#c9874a') }
    }
  ];

  const BARBER_UPPER = {
    w: 5.2, h: 10.4, wall: '#efe9dc', seed: 55, floors: [4.35, 7.3], cols: [0.9, 2.6, 4.3], winW: 1.05, winH: 1.85,
    sash: { bars: 1, rows: true }, cornice: '#ddd5c4', bands: [3.95]
  };

  function texFlag(ctx, w, h) {
    ctx.fillStyle = '#f4f4f2';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w * 0.42, h);
    ctx.clip();
    for (let i = -10; i < 30; i++) {
      ctx.fillStyle = i % 2 ? '#c8202c' : '#2a4fa8';
      ctx.beginPath();
      ctx.moveTo(0, i * 40);
      ctx.lineTo(w * 0.42, i * 40 - 60);
      ctx.lineTo(w * 0.42, i * 40 - 40);
      ctx.lineTo(0, i * 40 + 20);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#c8202c';
    ctx.fillRect(w * 0.42, 0, w * 0.03, h);
    ctx.font = `900 ${Math.round(w * 0.36)}px Georgia, 'Times New Roman', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const letters = 'BARBER';
    letters.split('').forEach((ch, i) => {
      ctx.fillStyle = '#2c2c34';
      ctx.fillText(ch, w * 0.72, h * (0.08 + i * 0.1));
    });
    ctx.fillStyle = '#c8202c';
    ctx.fillRect(w * 0.47, h * 0.66, w * 0.5, h * 0.2);
    ctx.font = `900 ${Math.round(w * 0.2)}px Georgia, serif`;
    ctx.fillStyle = '#ffffff';
    ['SH', 'OP'].forEach((s, i) => ctx.fillText(s, w * 0.72, h * (0.71 + i * 0.1)));
  }

  function texPole(ctx, w, h) {
    ctx.fillStyle = '#f6f6f4';
    ctx.fillRect(0, 0, w, h);
    const band = h / 4;
    for (let i = -4; i < 12; i++) {
      [['#c41e2a', 0], ['#2650a8', 0.5]].forEach(([col, off]) => {
        ctx.fillStyle = col;
        const y = (i + off) * band;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + band * 1.2);
        ctx.lineTo(w, y + band * 1.2 + band * 0.26);
        ctx.lineTo(0, y + band * 0.26);
        ctx.fill();
      });
    }
  }

  function texPriceList(ctx, w, h) {
    ctx.fillStyle = '#1d4a3c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d7c27a';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    sansText(ctx, 'STUDIO 98', w / 2, h * 0.08, Math.round(w * 0.13), '#f2e8c6', '900');
    sansText(ctx, 'PRICE LIST', w / 2, h * 0.15, Math.round(w * 0.07), '#d7c27a', 'bold');
    const rows = [['Skin Fade', '£15'], ['Scissor Cut', '£14'], ['Clipper Cut', '£12'], ['Beard Trim', '£8'], ['Hot Towel', '£10'], ['Kids Cut', '£10'], ['Wash & Style', '£6']];
    rows.forEach(([a, b], i) => {
      const y = h * (0.26 + i * 0.1);
      sansText(ctx, a, w * 0.1, y, Math.round(w * 0.06), '#f4f0e2', 'bold', 'left');
      sansText(ctx, b, w * 0.9, y, Math.round(w * 0.06), '#f4f0e2', 'bold', 'right');
    });
  }

  function texDiscount(ctx, w, h) {
    ctx.fillStyle = '#16302a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c8202c';
    ctx.fillRect(0, 0, w, h * 0.17);
    sansText(ctx, 'DISCOUNT DAYS', w / 2, h * 0.085, Math.round(w * 0.1), '#ffffff', '900');
    [['MON – TUE', '#f0e6c8'], ["OAP'S", '#e8414c'], ['STUDENTS', '#e8414c'], ['CHILDREN', '#e8414c'], ['CHILDREN', '#e8414c']].forEach(([s, c], i) => {
      sansText(ctx, s, w / 2, h * (0.28 + i * 0.15), Math.round(w * (i ? 0.11 : 0.07)), c, '900');
    });
  }

  function texOpen(ctx, w, h) {
    ctx.fillStyle = '#1c1d22';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e6e6e6';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    sansText(ctx, 'STUDIO', w * 0.24, h * 0.5, Math.round(h * 0.18), '#f0f0f0', 'bold');
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(w * 0.42, h * 0.2, 3, h * 0.6);
    sansText(ctx, 'OPEN', w * 0.7, h * 0.52, Math.round(h * 0.42), '#ffffff', 'bold');
  }

  function texTimes(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    sansText(ctx, 'Studio 98', w / 2, h * 0.06, Math.round(w * 0.14), '#22262e', 'bold');
    ctx.fillStyle = '#22262e';
    ctx.fillRect(w * 0.1, h * 0.11, w * 0.8, h * 0.07);
    sansText(ctx, 'Opening Times', w / 2, h * 0.145, Math.round(w * 0.09), '#f0f0f0', 'bold');
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((d, i) => {
      sansText(ctx, d, w * 0.14, h * (0.25 + i * 0.09), Math.round(w * 0.075), '#22262e', 'bold', 'left');
      sansText(ctx, i === 6 ? '10 – 4' : '9 – 6', w * 0.86, h * (0.25 + i * 0.09), Math.round(w * 0.075), '#22262e', 'bold', 'right');
    });
  }

  function texStickers(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#e8eef4';
    ctx.fillRect(0, 0, w * 0.46, h);
    ctx.fillStyle = '#e3742a';
    ctx.fillRect(w * 0.03, h * 0.35, w * 0.4, h * 0.6);
    sansText(ctx, 'CARDS', w * 0.23, h * 0.55, Math.round(h * 0.15), '#ffffff', '900');
    sansText(ctx, 'ACCEPTED', w * 0.23, h * 0.75, Math.round(h * 0.11), '#ffffff', 'bold');
    sansText(ctx, 'HIGH ST', w * 0.23, h * 0.16, Math.round(h * 0.12), '#c8202c', '900');
    ctx.fillStyle = '#ee7b30';
    ctx.beginPath();
    ctx.arc(w * 0.76, h * 0.55, h * 0.36, 0, PI * 2);
    ctx.fill();
    sansText(ctx, 'trusted', w * 0.76, h * 0.55, Math.round(h * 0.14), '#ffffff', 'bold');
  }

  function texPay(ctx, w, h) {
    ctx.fillStyle = '#2f68c8';
    ctx.fillRect(0, 0, w, h);
    sansText(ctx, 'Pay', w * 0.38, h * 0.52, Math.round(h * 0.5), '#ffffff', 'bold');
    ctx.fillStyle = '#ffffff';
    [0.66, 0.76, 0.86].forEach((x, i) => ctx.fillRect(w * x, h * (0.62 - i * 0.12), w * 0.06, h * (0.2 + i * 0.12)));
  }

  function texTwo(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    sansText(ctx, '2', w / 2, h / 2, Math.round(h * 0.9), '#e6e6e6', 'normal');
  }

  function texFascia(ctx, w, h) {
    ctx.fillStyle = '#26324a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 0, w, h * 0.08);
    signText(ctx, 'STUDIO 98', w * 0.42, h * 0.46, Math.round(h * 0.52), '#e2c27c', 'bold');
    sansText(ctx, 'GENTLEMEN’S BARBERS', w * 0.42, h * 0.84, Math.round(h * 0.15), '#e2c27c', 'bold');
    [0.12, 0.72].forEach(x => {
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(w * x, h * 0.18, w * 0.03, h * 0.64);
      ctx.fillStyle = '#c41e2a';
      for (let i = 0; i < 4; i++) ctx.fillRect(w * x, h * (0.22 + i * 0.15), w * 0.03, h * 0.05);
    });
  }

  function texPortrait(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#5f7488');
    gr.addColorStop(1, '#283442');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c9b2a0';
    ctx.beginPath();
    ctx.ellipse(w * 0.55, h * 0.45, w * 0.17, h * 0.2, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8d8dc';
    ctx.beginPath();
    ctx.ellipse(w * 0.55, h * 0.3, w * 0.19, h * 0.1, 0, PI, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f2630';
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h);
    ctx.quadraticCurveTo(w * 0.55, h * 0.6, w * 0.95, h);
    ctx.fill();
    ctx.fillStyle = '#8a2a20';
    ctx.fillRect(0, h * 0.86, w, h * 0.14);
    sansText(ctx, 'FADE & CO', w / 2, h * 0.93, Math.round(h * 0.08), '#f6efe2', '900');
  }

  function texProducts(ctx, w, h) {
    ctx.fillStyle = '#2e2420';
    ctx.fillRect(0, 0, w, h);
    const g = rand(61);
    const cols = ['#f2f2f2', '#1e1e22', '#c9a24a', '#3d7fc4', '#b8342e', '#5aa15a', '#e8e0d0'];
    for (let r0 = 0; r0 < 4; r0++) {
      const y = h * (0.22 + r0 * 0.24);
      ctx.fillStyle = '#6b4b34';
      ctx.fillRect(0, y, w, h * 0.03);
      let x = w * 0.04;
      while (x < w * 0.94) {
        const bw = w * (0.05 + g() * 0.06);
        const bh = h * (0.08 + g() * 0.1);
        ctx.fillStyle = cols[Math.floor(g() * cols.length)];
        ctx.fillRect(x, y - bh, bw, bh);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x + bw * 0.15, y - bh, bw * 0.15, bh);
        x += bw + w * 0.015;
      }
    }
    ctx.fillStyle = '#8a2a20';
    ctx.fillRect(w * 0.1, h * 0.02, w * 0.8, h * 0.12);
    sansText(ctx, 'FADE & CO', w / 2, h * 0.08, Math.round(h * 0.07), '#f4ead6', '900');
  }

  function texFrames(ctx, w, h) {
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2f0ea';
    ctx.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84);
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#6a6a6a');
    gr.addColorStop(1, '#1e1e1e');
    ctx.fillStyle = gr;
    ctx.fillRect(w * 0.2, h * 0.18, w * 0.6, h * 0.64);
    ctx.fillStyle = '#cfcfcf';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.4, w * 0.12, h * 0.12, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.32, h * 0.52, w * 0.36, h * 0.3);
  }

  function texHeater(ctx, w, h) {
    ctx.fillStyle = '#ecebe6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c9c7c0';
    ctx.fillRect(w * 0.12, h * 0.1, w * 0.76, h * 0.55);
    ctx.strokeStyle = '#8c8a84';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(w * (0.15 + i * 0.052), h * 0.12);
      ctx.lineTo(w * (0.15 + i * 0.052), h * 0.63);
      ctx.stroke();
    }
  }

  function texBarrier(ctx, w, h) {
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w * 0.24, h * 0.5);
    ctx.rotate(-PI / 2);
    sansText(ctx, 'HOPDOG', 0, 0, Math.round(w * 0.2), '#f6f6f2', '900');
    ctx.restore();
    ctx.fillStyle = '#f6f6f2';
    ctx.beginPath();
    ctx.arc(w * 0.68, h * 0.5, w * 0.18, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#121214';
    ctx.beginPath();
    ctx.moveTo(w * 0.6, h * 0.58);
    ctx.lineTo(w * 0.68, h * 0.4);
    ctx.lineTo(w * 0.76, h * 0.58);
    ctx.fill();
  }

  function texTaxiSide(ctx, w, h) {
    ctx.fillStyle = '#0f1013';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2d21c';
    ctx.fillRect(w * 0.18, h * 0.42, w * 0.64, h * 0.38);
    ctx.fillStyle = '#2a7fd4';
    ctx.fillRect(w * 0.18, h * 0.72, w * 0.64, h * 0.08);
    sansText(ctx, 'CITY TOURS', w * 0.5, h * 0.55, Math.round(h * 0.13), '#14161a', '900');
    sansText(ctx, 'see the town from the top deck', w * 0.5, h * 0.66, Math.round(h * 0.06), '#14161a', 'bold');
  }

  function texSky(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#5f9fe6');
    gr.addColorStop(1, '#bcd8f2');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  }

  function quadFace(b, x0, y0, x1, y1, z, col, flip, uv) {
    const u = uv || [[0, 0], [1, 0], [1, 1], [0, 1]];
    if (flip) b.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], col, u);
    else b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, u);
  }

  function slab(b, x0, y0, z0, x1, y1, z1, col, faces) {
    b.at((x0 + x1) / 2, y0, (z0 + z1) / 2, h => h.box(x1 - x0, y1 - y0, z1 - z0, col, { base: true, faces: faces || {} }));
  }

  function cylinderY(b, x, y0, z, r, h, sides, col, top) {
    b.at(x, 0, z, q => q.prism(sides, r, r, y0, r, r, y0 + h, col, { capTop: top !== false }));
  }

  function wheel(b, x, z, r, w, side) {
    b.push(M4.translate(x, r, z), M4.rotX(PI / 2));
    b.prism(12, r, r, -w / 2, r, r, w / 2, COL.tyre, { capBottom: true });
    b.at(0, side * w / 2 + side * 0.002, 0, q => q.disc(r * 0.6, 10, 0x9a9ca2));
    b.pop();
  }

  function buildCar(b, kind) {
    const L = kind === 'taxi' ? 4.5 : kind === 'suv' ? 4.7 : 4.6;
    const W = kind === 'suv' ? 1.95 : 1.8;
    const Hb = kind === 'taxi' ? 0.95 : kind === 'suv' ? 1.0 : 0.82;
    const Hr = kind === 'taxi' ? 1.75 : kind === 'suv' ? 1.72 : 1.45;
    const body = kind === 'sedan' ? 0x1b1d22 : 0x111215;
    const glass = 0x2a323c;
    slab(b, -L / 2, 0.28, -W / 2, L / 2, Hb, W / 2, body);
    const cab0 = kind === 'taxi' ? -1.2 : -1.5, cab1 = kind === 'taxi' ? 1.0 : kind === 'suv' ? 1.6 : 0.9;
    const inset = 0.08;
    b.quad([cab0, Hb, W / 2 - inset], [cab1, Hb, W / 2 - inset], [cab1 - 0.25, Hr, W / 2 - inset - 0.1], [cab0 + 0.3, Hr, W / 2 - inset - 0.1], glass);
    b.quad([cab1, Hb, -W / 2 + inset], [cab0, Hb, -W / 2 + inset], [cab0 + 0.3, Hr, -W / 2 + inset + 0.1], [cab1 - 0.25, Hr, -W / 2 + inset + 0.1], glass);
    b.quad([cab1, Hb, W / 2 - inset], [cab1, Hb, -W / 2 + inset], [cab1 - 0.25, Hr, -W / 2 + inset + 0.1], [cab1 - 0.25, Hr, W / 2 - inset - 0.1], glass);
    b.quad([cab0, Hb, -W / 2 + inset], [cab0, Hb, W / 2 - inset], [cab0 + 0.3, Hr, W / 2 - inset - 0.1], [cab0 + 0.3, Hr, -W / 2 + inset + 0.1], glass);
    b.quad([cab0 + 0.3, Hr, W / 2 - inset - 0.1], [cab1 - 0.25, Hr, W / 2 - inset - 0.1], [cab1 - 0.25, Hr, -W / 2 + inset + 0.1], [cab0 + 0.3, Hr, -W / 2 + inset + 0.1], body);
    [-0.6, 0.15].forEach(x => b.quad([x, Hb + 0.02, W / 2 - inset + 0.004], [x + 0.06, Hb + 0.02, W / 2 - inset + 0.004], [x + 0.03, Hr - 0.02, W / 2 - inset - 0.09], [x - 0.03, Hr - 0.02, W / 2 - inset - 0.09], body));
    if (kind === 'taxi') {
      slab(b, -0.2, Hr, -0.18, 0.2, Hr + 0.13, 0.18, [0.98, 0.8, 0.22, 0.8]);
    }
    [[L / 2 - 0.85, 1], [-L / 2 + 0.8, 1]].forEach(([x]) => { wheel(b, x, W / 2 - 0.12, 0.33, 0.24, 1); wheel(b, x, -W / 2 + 0.12, 0.33, 0.24, -1); });
    b.quad([L / 2 + 0.002, 0.55, -W / 2 + 0.15], [L / 2 + 0.002, 0.55, -W / 2 + 0.45], [L / 2 + 0.002, 0.7, -W / 2 + 0.45], [L / 2 + 0.002, 0.7, -W / 2 + 0.15], [1, 0.95, 0.85, 0.7]);
    b.quad([L / 2 + 0.002, 0.55, W / 2 - 0.45], [L / 2 + 0.002, 0.55, W / 2 - 0.15], [L / 2 + 0.002, 0.7, W / 2 - 0.15], [L / 2 + 0.002, 0.7, W / 2 - 0.45], [1, 0.95, 0.85, 0.7]);
    b.quad([-L / 2 - 0.002, 0.6, W / 2 - 0.4], [-L / 2 - 0.002, 0.6, W / 2 - 0.12], [-L / 2 - 0.002, 0.75, W / 2 - 0.12], [-L / 2 - 0.002, 0.75, W / 2 - 0.4], [0.8, 0.1, 0.1, 0.6]);
    b.quad([-L / 2 - 0.002, 0.6, -W / 2 + 0.12], [-L / 2 - 0.002, 0.6, -W / 2 + 0.4], [-L / 2 - 0.002, 0.75, -W / 2 + 0.4], [-L / 2 - 0.002, 0.75, -W / 2 + 0.12], [0.8, 0.1, 0.1, 0.6]);
    return { L, W };
  }

  function bunting(b, from, to, sag, n, seed) {
    const g = rand(seed);
    const cols = [0xd8232f, 0xf2c21a, 0x2fa24a, 0x2a6fd2, 0xf4f4f2, 0x8a3fb8, 0xf07a1c];
    const at = (k) => {
      const p = V3.lerp(from, to, k);
      return [p[0], p[1] - sag * 4 * k * (1 - k), p[2]];
    };
    const dir = V3.norm(V3.sub(to, from));
    for (let i = 0; i < n; i++) {
      const k0 = (i + 0.15) / n, k1 = (i + 0.85) / n;
      const a = at(k0), c = at(k1);
      const mid = V3.lerp(a, c, 0.5);
      const tip = [mid[0] + (g() - 0.5) * 0.02, mid[1] - 0.3, mid[2] + (g() - 0.5) * 0.04];
      b.tri(a, c, tip, cols[(i + Math.floor(seed)) % cols.length]);
    }
    for (let i = 0; i < 24; i++) {
      const a = at(i / 24), c = at((i + 1) / 24);
      b.quad(a, c, [c[0], c[1] - 0.012, c[2]], [a[0], a[1] - 0.012, a[2]], 0xeeeeee);
    }
    return dir;
  }

  function build(r) {
    const pot = (n) => (n & (n - 1)) === 0;
    const tex = (w, h, fn, o) => r.texture(w, fn, Object.assign({ height: h, clamp: !(pot(w) && pot(h)) }, o || {}));
    const T = {
      paving: tex(256, 256, texPaving),
      asphalt: tex(256, 256, texAsphalt),
      flag: tex(128, 512, texFlag),
      pole: tex(64, 256, texPole),
      price: tex(256, 320, texPriceList),
      discount: tex(256, 320, texDiscount),
      open: tex(256, 128, texOpen),
      times: tex(128, 192, texTimes),
      stickers: tex(256, 96, texStickers),
      pay: tex(64, 32, texPay),
      two: tex(64, 64, texTwo),
      fascia: tex(1024, 128, texFascia),
      portrait: tex(256, 320, texPortrait),
      products: tex(256, 256, texProducts),
      frames: tex(128, 160, texFrames),
      heater: tex(128, 128, texHeater),
      barrier: tex(128, 96, texBarrier),
      taxiSide: tex(256, 128, texTaxiSide),
      sky: tex(16, 128, texSky)
    };
    const facades = {};
    OPP.concat(NEAR).forEach(f => {
      const w = f.x1 - f.x0;
      const spec = Object.assign({}, f, { w, cols: f.cols.map(c => c + w / 2) });
      const tw = 512, th = Math.round(512 * f.h / w / 4) * 4;
      facades[f.key] = tex(tw, Math.min(1024, th), facadeTex(spec));
    });
    facades.barber = tex(512, 800, facadeTex(Object.assign({}, BARBER_UPPER)));

    const M = {};
    const add = (key, fn) => {
      const b = new Builder();
      fn(b);
      M[key] = r.mesh(b);
    };

    add('pavement', b => {
      const tile = 1.2;
      [[-140, 40, 0, CURB], [-140, 40, FAR_CURB, FAR]].forEach(([x0, x1, z0, z1]) => {
        b.quad([x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], [1, 1, 1, 0], [[x0 / tile, z1 / tile], [x1 / tile, z1 / tile], [x1 / tile, z0 / tile], [x0 / tile, z0 / tile]]);
      });
    });
    add('road', b => {
      const tile = 4;
      b.quad([-140, ROAD_Y, FAR_CURB], [40, ROAD_Y, FAR_CURB], [40, ROAD_Y, CURB], [-140, ROAD_Y, CURB], [1, 1, 1, 0], [[-35, FAR_CURB / tile], [10, FAR_CURB / tile], [10, CURB / tile], [-35, CURB / tile]]);
    });
    add('kerbs', b => {
      b.quad([-140, ROAD_Y, CURB], [40, ROAD_Y, CURB], [40, 0, CURB], [-140, 0, CURB], 0xb9b5ad);
      b.quad([40, ROAD_Y, FAR_CURB], [-140, ROAD_Y, FAR_CURB], [-140, 0, FAR_CURB], [40, 0, FAR_CURB], 0xb9b5ad);
      const line = (z, w, col) => b.quad([-140, ROAD_Y + 0.004, z + w], [40, ROAD_Y + 0.004, z + w], [40, ROAD_Y + 0.004, z], [-140, ROAD_Y + 0.004, z], col);
      line(CURB + 0.25, 0.1, 0xe8c63a);
      line(CURB + 0.42, 0.1, 0xe8c63a);
      line(FAR_CURB - 0.35, 0.1, 0xe8c63a);
      line(FAR_CURB - 0.52, 0.1, 0xe8c63a);
      for (let x = -140; x < 40; x += 6) b.quad([x, ROAD_Y + 0.004, 6.56], [x + 3, ROAD_Y + 0.004, 6.56], [x + 3, ROAD_Y + 0.004, 6.44], [x, ROAD_Y + 0.004, 6.44], 0xe9e9e4);
    });

    OPP.forEach(f => add('opp_' + f.key, b => quadFace(b, f.x0, 0, f.x1, f.h, FAR, [1, 1, 1, 0], true)));
    const nz = (f) => (f.x1 <= EDGE + 1e-6 ? STEP : 0) - 0.02;
    NEAR.forEach(f => add('near_' + f.key, b => quadFace(b, f.x0, 0, f.x1, f.h, nz(f), [1, 1, 1, 0], false)));
    add('barberUpper', b => quadFace(b, EDGE, 3.35, 3.45, 10.4, 0, [1, 1, 1, 0], false, [[0, 0], [1, 0], [1, 1], [0, 1]]));

    add('oppDetail', b => {
      const bay = (x, y, w, h, col) => {
        const d = 0.5;
        slab(b, x - w / 2, y - 0.25, FAR - d, x + w / 2, y, FAR, col);
        slab(b, x - w / 2, y + h, FAR - d, x + w / 2, y + h + 0.22, FAR, col);
        [-1, -0.33, 0.33, 1].forEach(k => slab(b, x + k * w / 2 - 0.06, y, FAR - d, x + k * w / 2 + 0.06, y + h, FAR - d + 0.12, col));
        b.quad([x + w / 2, y, FAR - d + 0.05], [x - w / 2, y, FAR - d + 0.05], [x - w / 2, y + h, FAR - d + 0.05], [x + w / 2, y + h, FAR - d + 0.05], [[0.36, 0.44, 0.54, 0], [0.36, 0.44, 0.54, 0], [0.62, 0.72, 0.84, 0], [0.62, 0.72, 0.84, 0]]);
        slab(b, x + w / 2 - 0.02, y, FAR - d, x + w / 2 + 0.02, y + h, FAR, col);
        slab(b, x - w / 2 - 0.02, y, FAR - d, x - w / 2 + 0.02, y + h, FAR, col);
        b.quad([x + w / 2, y + h * 0.5, FAR - d + 0.06], [x - w / 2, y + h * 0.5, FAR - d + 0.06], [x - w / 2, y + h * 0.5 + 0.07, FAR - d + 0.06], [x + w / 2, y + h * 0.5 + 0.07, FAR - d + 0.06], col);
      };
      [[-4.6, 0xf3f3f0], [-1.4, 0xf3f3f0], [1.6, 0xf3f3f0]].forEach(([x, col]) => { bay(x, 4.35, 2.0, 1.9, col); bay(x, 7.75, 2.0, 1.9, col); });
      [-27.9, -24.1].forEach(x => { bay(x, 4.3, 2.3, 2.0, 0xf6f6f2); bay(x, 7.6, 2.3, 2.0, 0xf6f6f2); });
      OPP.forEach(f => slab(b, f.x0, 3.0, FAR - 0.18, f.x1, 3.62, FAR, f.shop && f.shop.fascia ? rgb(parseInt(f.shop.fascia.slice(1), 16)) : 0x222222, { front: false, back: false }));
    });

    add('nearDetail', b => {
      NEAR.forEach(f => slab(b, f.x0, 3.0, nz(f), f.x1, 3.62, nz(f) + 0.18, f.shop && f.shop.fascia ? rgb(parseInt(f.shop.fascia.slice(1), 16)) : 0x222222, { front: false, back: false }));
      slab(b, -8.4, 3.62, STEP, EDGE - 0.1, 3.72, STEP + 0.2, 0x1b2232);
      slab(b, -3.1, 3.75, STEP + 0.05, -2.4, 4.45, STEP + 0.12, 0x2f6fd0);
      const ret = (z0, z1, y0, y1, col) => b.quad([EDGE, y0, z0], [EDGE, y0, z1], [EDGE, y1, z1], [EDGE, y1, z0], col);
      ret(0, STEP - 0.58, 0, 3.35, COL.navy);
      ret(STEP - 0.58, STEP, 0, 3.35, [0.82, 0.07, 0.11, 0]);
      ret(0, STEP, 3.35, 10.4, 0xe7e1d3);
      b.quad([EDGE, 0.001, STEP], [EDGE + 0.004, 0.001, STEP], [EDGE + 0.004, 0.001, 0], [EDGE, 0.001, 0], 0x7a0c12);
    });

    add('barberFront', b => {
      const navy = COL.navy;
      slab(b, EDGE, 0, 0, WIN_L.x0, 3.35, 0.06, navy);
      slab(b, WIN_L.x0, 0, 0, WIN_L.x1, WIN_L.y0 - 0.02, 0.07, navy);
      slab(b, WIN_L.x0 - 0.02, WIN_L.y0 - 0.06, -0.02, WIN_L.x1 + 0.02, WIN_L.y0, 0.14, COL.navyDark);
      slab(b, WIN_L.x0, WIN_L.y1, 0, WIN_R.x1, 2.78, 0.07, navy);
      slab(b, WIN_L.x1, 0, 0, DOOR.x0, WIN_L.y1, 0.08, navy);
      slab(b, DOOR.x1, 0, 0, WIN_R.x0, WIN_L.y1, 0.08, navy);
      slab(b, DOOR.x0, DOOR.top, 0, DOOR.x1, DOOR.top + 0.1, 0.08, navy);
      slab(b, WIN_R.x0, 0, 0, WIN_R.x1, WIN_R.y0 - 0.02, 0.07, navy);
      slab(b, WIN_R.x0 - 0.02, WIN_R.y0 - 0.06, -0.02, WIN_R.x1 + 0.02, WIN_R.y0, 0.14, COL.navyDark);
      slab(b, WIN_R.x1, 0, 0, 3.15, 3.35, 0.08, navy);
      slab(b, 3.15, 0, 0, 3.45, 3.35, 0.1, 0x8a4a34);
      slab(b, EDGE - 0.05, 2.78, 0, 3.45, 3.35, 0.16, navy, { front: false });
      slab(b, EDGE - 0.1, 3.35, -0.02, 3.5, 3.45, 0.24, COL.navyDark);
      slab(b, WIN_L.x0 - 0.2, 1.62, 0.04, WIN_L.x0 - 0.12, 1.7, 0.2, COL.chrome);
      slab(b, WIN_L.x0 - 0.2, 1.08, 0.04, WIN_L.x0 - 0.12, 1.16, 0.2, COL.chrome);
      slab(b, DOOR.x0 - 0.04, -0.02, -0.4, DOOR.x1 + 0.04, 0.02, 0.02, 0x8e8e8a);
    });
    add('fasciaFace', b => quadFace(b, EDGE - 0.05, 2.78, 3.45, 3.35, 0.161, [1, 1, 1, 0], false));

    const DW = DOOR.x1 - DOOR.x0, DH = DOOR.top;
    add('doorFrame', b => {
      const navy = COL.navy;
      const st = 0.1;
      slab(b, -DW, 0, -0.025, -DW + st, DH, 0.025, navy);
      slab(b, -st, 0, -0.025, 0, DH, 0.025, navy);
      slab(b, -DW, DH - 0.12, -0.025, 0, DH, 0.025, navy);
      slab(b, -DW, 0, -0.025, 0, 0.2, 0.025, navy);
      slab(b, -DW, 0.6, -0.025, 0, 0.82, 0.025, navy);
      slab(b, -DW + 0.28, 0.67, 0.026, -DW + 0.64, 0.74, 0.034, 0x1c2433);
      b.quad([-DW + 0.3, 0.695, 0.035], [-DW + 0.62, 0.695, 0.035], [-DW + 0.62, 0.71, 0.035], [-DW + 0.3, 0.71, 0.035], 0x090b10);
      b.at(-DW + 0.06, 1.26, 0.05, q => q.ellipsoid(0.035, 0.035, 0.03, 8, 5, [0.85, 0.86, 0.88, 0.25]));
      b.at(-DW + 0.06, 1.26, -0.05, q => q.ellipsoid(0.035, 0.035, 0.03, 8, 5, [0.85, 0.86, 0.88, 0.25]));
      slab(b, -DW + 0.04, 1.24, 0.025, -DW + 0.08, 1.28, 0.05, COL.chrome);
      b.quad([-DW + 0.12, 0.6, 0.03], [-DW + 0.12, 0.72, 0.03], [-DW + 0.12, 0.72, -0.03], [-DW + 0.12, 0.6, -0.03], COL.chrome);
    });
    add('doorGlass', b => {
      quadFace(b, -DW + 0.1, 0.82, -0.1, DH - 0.12, 0, 0xffffff, false);
      quadFace(b, -DW + 0.1, 0.2, -0.1, 0.6, 0, 0xffffff, false);
    });
    add('doorOpen', b => quadFace(b, -DW + 0.28, 1.27, -0.16, 1.49, 0.004, [1, 1, 1, 0.5], false));
    add('doorTimes', b => quadFace(b, -DW + 0.34, 1.56, -0.3, 1.9, 0.004, [1, 1, 1, 0.5], false));
    add('doorPay', b => quadFace(b, -DW + 0.12, 1.17, -DW + 0.24, 1.24, 0.028, [1, 1, 1, 0.4], false));
    add('two', b => quadFace(b, DOOR.x0 + 0.38, DOOR.top + 0.11, DOOR.x0 + 0.54, DOOR.top + 0.32, 0.005, [1, 1, 1, 0.4], false));

    add('windowGlass', b => {
      quadFace(b, WIN_L.x0, WIN_L.y0, WIN_L.x1, WIN_L.y1, 0.001, 0xffffff, false);
      quadFace(b, WIN_R.x0, WIN_R.y0, WIN_R.x1, WIN_R.y1, 0.001, 0xffffff, false);
      quadFace(b, DOOR.x0, DOOR.top + 0.1, DOOR.x1, WIN_L.y1, 0.001, 0xffffff, false);
    });
    add('stickers', b => quadFace(b, -0.12, WIN_L.y0 + 0.02, 0.32, WIN_L.y0 + 0.18, 0.003, [1, 1, 1, 0.35], false));

    add('interiorShell', b => {
      const x0 = WIN_L.x0, x1 = WIN_R.x1, z0 = -6.5, hY = 2.9;
      const wall = [0.95, 0.94, 0.92, 0.55];
      b.quad([x0, 0, 0], [x1, 0, 0], [x1, 0, z0], [x0, 0, z0], [0.64, 0.6, 0.56, 0.35]);
      b.quad([x0, hY, z0], [x1, hY, z0], [x1, hY, 0], [x0, hY, 0], [0.96, 0.96, 0.95, 0.75]);
      b.quad([x0, 0, z0], [x1, 0, z0], [x1, hY, z0], [x0, hY, z0], wall);
      b.quad([x0, 0, 0], [x0, 0, z0], [x0, hY, z0], [x0, hY, 0], wall);
      b.quad([x1, 0, z0], [x1, 0, 0], [x1, hY, 0], [x1, hY, z0], wall);
      for (let i = 0; i < 6; i++) {
        const lx = -1.8 + (i % 3) * 1.6, lz = -1.2 - Math.floor(i / 3) * 2.4;
        b.at(lx, hY - 0.005, lz, q => q.disc(0.09, 12, [1, 1, 0.97, 1], 0));
      }
      slab(b, -2.4, 0, -5.9, 0.4, 1.0, -5.3, [0.32, 0.22, 0.17, 0.4]);
      slab(b, -2.4, 1.0, -5.95, 0.4, 1.05, -5.25, [0.9, 0.9, 0.9, 0.5]);
      slab(b, -2.42, 0.85, -4.6, -2.3, 2.1, -1.4, [0.82, 0.86, 0.88, 0.7]);
      slab(b, -2.42, 0.8, -4.7, -2.15, 0.88, -1.3, [0.18, 0.14, 0.12, 0.3]);
      slab(b, 1.75, 0, -0.62, WIN_R.x1, 2.7, -0.56, [0.2, 0.15, 0.12, 0.3]);
      slab(b, 0.62, 0, -0.55, 0.7, 2.7, 0, [0.95, 0.94, 0.92, 0.5]);
      slab(b, 1.62, 0, -6.5, 1.75, 2.9, 0, [0.95, 0.94, 0.92, 0.55]);
      slab(b, 0.7, 0, -6.4, 1.62, 2.9, -6.3, [0.93, 0.92, 0.9, 0.5]);
      slab(b, 0.85, 0, -3.8, 1.55, 0.95, -3.3, [0.25, 0.2, 0.17, 0.35]);
      slab(b, 0.85, 0.95, -3.8, 1.55, 0.99, -3.3, [0.8, 0.8, 0.8, 0.5]);
      slab(b, 0.8, 1.35, -6.29, 1.15, 1.75, -6.27, [0.1, 0.1, 0.12, 0.3]);
      slab(b, 0.85, 1.4, -6.27, 1.1, 1.7, -6.26, [0.8, 0.8, 0.78, 0.5]);
    });
    add('chairs', b => {
      const chair = (x, z, ry) => {
        b.push(M4.translate(x, 0, z), M4.rotY(ry));
        b.at(0, 0, 0, q => q.prism(14, 0.3, 0.3, 0, 0.3, 0.3, 0.04, COL.chrome));
        b.at(0, 0, 0, q => q.prism(8, 0.05, 0.05, 0.04, 0.05, 0.05, 0.42, COL.chrome));
        slab(b, -0.3, 0.42, -0.28, 0.3, 0.6, 0.28, 0xa4545e);
        slab(b, -0.3, 0.55, -0.32, 0.3, 1.25, -0.2, 0xa4545e);
        slab(b, -0.12, 1.28, -0.3, 0.12, 1.42, -0.2, 0x6a1a26);
        slab(b, -0.36, 0.6, -0.25, -0.28, 0.82, 0.25, 0x5e1622);
        slab(b, 0.28, 0.6, -0.25, 0.36, 0.82, 0.25, 0x5e1622);
        slab(b, -0.2, 0.12, 0.35, 0.2, 0.16, 0.55, COL.chrome);
        b.pop();
      };
      chair(-0.45, -2.2, -PI / 2);
      chair(-0.45, -3.8, -PI / 2);
      chair(0.15, -1.25, PI * 0.15);
    });
    add('frames', b => {
      [[-2.44, 1.45, -1.3], [-2.44, 1.45, -0.7], [-2.44, 2.1, -1.0]].forEach(([x, y, z]) => {
        b.quad([x, y, z + 0.22], [x, y, z - 0.22], [x, y + 0.55, z - 0.22], [x, y + 0.55, z + 0.22], [1, 1, 1, 0.5]);
      });
      b.quad([-1.2, 1.4, -6.49], [-0.6, 1.4, -6.49], [-0.6, 2.15, -6.49], [-1.2, 2.15, -6.49], [1, 1, 1, 0.5]);
    });
    add('price', b => quadFace(b, -0.05, 1.38, 0.3, 2.05, -0.03, [1, 1, 1, 0.45], false));
    add('discount', b => quadFace(b, -0.05, 0.92, 0.3, 1.36, -0.03, [1, 1, 1, 0.45], false));
    add('heater', b => {
      b.at(0.03, 0.26, -0.2, q => q.box(0.36, 0.55, 0.18, [1, 1, 1, 0.45], { base: true }));
    });
    add('display', b => {
      quadFace(b, 1.85, 0.6, 3.05, 1.75, -0.5, [1, 1, 1, 0.45], false);
      quadFace(b, 2.1, 1.8, 2.85, 2.6, -0.48, [1, 1, 1, 0.45], false);
    });
    add('topiary', b => {
      b.at(2.15, 0.78, -0.3, q => q.ellipsoid(0.2, 0.2, 0.2, 10, 7, [0.16, 0.42, 0.18, 0.1]));
      b.at(2.15, 0.56, -0.3, q => q.box(0.16, 0.06, 0.16, 0x3b2a20));
    });

    add('flag', b => {
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const k = i / 10;
        const y = 0.7 + k * 1.95;
        const w = 0.55 + 0.04 * S(k * PI);
        const bend = k > 0.85 ? (k - 0.85) * 1.6 : 0;
        pts.push({ y, w, bend });
      }
      for (let i = 0; i < 10; i++) {
        const a = pts[i], c = pts[i + 1];
        b.quad([0, a.y, 0], [a.w - a.bend * 0.3, a.y, 0.02], [c.w - c.bend * 0.3, c.y - c.bend * 0.1, 0.02], [0, c.y, 0], [1, 1, 1, 0.15], [[0, i / 10], [1, i / 10], [1, (i + 1) / 10], [0, (i + 1) / 10]]);
      }
    });
    add('flagPole', b => {
      cylinderY(b, 0, 0, 0, 0.014, 2.8, 6, 0x55585e);
      b.at(0, 0, 0, q => q.prism(10, 0.24, 0.24, 0, 0.18, 0.18, 0.06, 0x1e2024));
    });
    add('poleStripes', b => {
      cylinderY(b, 0, 0, 0, 0.075, 0.62, 14, [1, 1, 1, 0.25], false);
    });
    add('poleCaps', b => {
      b.at(0, 0.66, 0, q => q.ellipsoid(0.085, 0.06, 0.085, 10, 5, [0.88, 0.88, 0.9, 0.3]));
      b.at(0, -0.03, 0, q => q.prism(10, 0.09, 0.09, -0.04, 0.085, 0.085, 0.0, COL.chrome));
      b.at(0, 0.6, 0, q => q.prism(10, 0.09, 0.09, 0, 0.085, 0.085, 0.04, COL.chrome));
    });

    add('bollards', b => {
      [-4.6, -6.6, -8.6, -10.6, 4.4, 6.4].forEach((x, i) => {
        cylinderY(b, x, 0, 3.1, 0.075, 0.92, 10, [0.78, 0.8, 0.83, 0.15]);
        cylinderY(b, x, 0.92, 3.1, 0.08, 0.1, 10, 0x18191c);
        cylinderY(b, x, 0.62, 3.1, 0.077, 0.06, 10, 0x18191c);
        if (i === 1) cylinderY(b, x, 0, 3.1, 0.09, 0.08, 10, 0x18191c);
      });
      cylinderY(b, -5.6, 0, 3.2, 0.055, 3.7, 8, 0x8a8e94);
      slab(b, -5.95, 2.95, 3.15, -5.25, 3.68, 3.25, 0x8f949a);
      slab(b, -5.82, 2.5, 3.15, -5.38, 2.9, 3.23, 0xeceae4);
      cylinderY(b, -12.8, 0, 9.9, 0.08, 7.5, 8, 0x2a2c30);
      slab(b, -12.85, 7.3, 9.9, -12.75, 7.38, 10.8, 0x2a2c30);
      slab(b, -12.95, 7.18, 10.5, -12.65, 7.3, 10.9, 0x2a2c30);
    });

    add('barriers', b => {
      [-6.6, -4.8, -3.0, -1.2, 0.6].forEach(x => {
        quadFace(b, x - 0.85, 0.08, x + 0.85, 1.12, 10.2, [1, 1, 1, 0.1], true);
      });
    });
    add('barrierPosts', b => {
      [-7.5, -5.7, -3.9, -2.1, -0.3, 1.5].forEach(x => cylinderY(b, x, 0, 10.2, 0.02, 1.15, 6, 0x232428));
      for (let i = 0; i < 6; i++) {
        const x = -7.0 + i * 1.6;
        slab(b, x - 0.3, 0.72, 10.7, x + 0.3, 0.76, 11.3, 0x2c2c30);
        cylinderY(b, x, 0, 11.0, 0.03, 0.72, 6, 0x2c2c30);
        [[-0.45, 0xd88aa0], [0.45, 0xd88aa0]].forEach(([dx, col]) => {
          slab(b, x + dx - 0.18, 0.44, 10.8, x + dx + 0.18, 0.48, 11.2, col);
          slab(b, x + dx - 0.18, 0.48, 11.18, x + dx + 0.18, 0.9, 11.22, col);
        });
      }
    });

    add('bunting', b => {
      bunting(b, [-8.5, 4.75, 12.0], [3.5, 4.75, 12.0], 0.45, 26, 1);
      bunting(b, [-7.5, 3.95, 11.3], [3.0, 3.95, 11.3], 0.35, 22, 3);
      bunting(b, [-6, 5.6, 1.0], [4, 5.4, 11.6], 0.6, 30, 5);
    });

    const cars = {};
    add('taxi', b => { cars.taxi = buildCar(b, 'taxi'); });
    add('suv', b => { cars.suv = buildCar(b, 'suv'); });
    add('sedan', b => { cars.sedan = buildCar(b, 'sedan'); });
    add('taxiAd', b => {
      const L = cars.taxi.L, W = cars.taxi.W;
      b.quad([-L / 2 + 0.2, 0.3, W / 2 + 0.003], [L / 2 - 0.2, 0.3, W / 2 + 0.003], [L / 2 - 0.2, 0.93, W / 2 + 0.003], [-L / 2 + 0.2, 0.93, W / 2 + 0.003], [1, 1, 1, 0]);
    });
    add('skyWall', b => {
      b.quad([-200, -5, 120], [200, -5, 120], [200, 90, 120], [-200, 90, 120], [1, 1, 1, 1]);
      b.quad([200, -5, -120], [-200, -5, -120], [-200, 90, -120], [200, 90, -120], [1, 1, 1, 1]);
      b.quad([-200, -5, -120], [-200, -5, 120], [-200, 90, 120], [-200, 90, -120], [1, 1, 1, 1]);
      b.quad([200, -5, 120], [200, -5, -120], [200, 90, -120], [200, 90, 120], [1, 1, 1, 1]);
    });
    add('ground', b => b.quad([-200, -0.2, 120], [200, -0.2, 120], [200, -0.2, -120], [-200, -0.2, -120], 0x8a8a86));
    add('streetEnd', b => {
      b.quad([-52, 0, 3.0], [-52, 0, FAR + 2], [-52, 16, FAR + 2], [-52, 16, 3.0], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    });
    add('doorway', b => quadFace(b, DOOR.x0, 0, DOOR.x1, DOOR.top, 0.0, [0.3, 0.29, 0.28, 1], false));
    add('apertures', b => {
      quadFace(b, WIN_L.x0, WIN_L.y0, WIN_L.x1, WIN_L.y1, 0.0, 0xffffff, false);
      quadFace(b, WIN_R.x0, WIN_R.y0, WIN_R.x1, WIN_R.y1, 0.0, 0xffffff, false);
      quadFace(b, DOOR.x0, 0, DOOR.x1, WIN_L.y1, 0.0, 0xffffff, false);
    });

    return { T, F: facades, M, cars, DOOR, WIN_L, WIN_R };
  }

  const CARS = [
    { key: 'taxi', p: [-15.5, ROAD_Y, 7.9], ry: 0, ad: true },
    { key: 'suv', p: [-19.5, ROAD_Y, 5.0], ry: 0 },
    { key: 'sedan', p: [-10.5, ROAD_Y, 8.6], ry: PI },
    { key: 'sedan', p: [8.5, ROAD_Y, 8.7], ry: PI }
  ];

  function drawBackdrop(r, set, base, pass) {
    const M = set.M;
    const at = base || null;
    r.draw(M.skyWall, at, Object.assign({ texture: set.T.sky, noFog: true }, pass || {}));
    r.draw(M.ground, at, Object.assign({}, pass || {}));
  }

  function markGlass(r, set, st) {
    r.draw(set.M.apertures, null, { shadow: true, blend: true, alpha: 0, flat: [0, 0, 0, 1], noFog: true });
  }

  function drawOutdoor(r, set, base, st) {
    const M = set.M;
    const at = (m) => base ? M4.mul(base, m || M4.ident()) : (m || null);
    const o = st.noFog ? { noFog: true } : {};
    r.draw(M.pavement, at(), Object.assign({ texture: set.T.paving }, o));
    r.draw(M.road, at(), Object.assign({ texture: set.T.asphalt }, o));
    r.draw(M.kerbs, at(), o);
    OPP.forEach(f => r.draw(M['opp_' + f.key], at(), Object.assign({ texture: set.F[f.key] }, o)));
    r.draw(M.streetEnd, at(), Object.assign({ texture: set.F.market }, o));
    r.draw(M.oppDetail, at(), o);
    r.draw(M.bollards, at(), o);
    r.draw(M.barriers, at(), Object.assign({ texture: set.T.barrier }, o));
    r.draw(M.barrierPosts, at(), o);
    r.draw(M.bunting, at(), o);
    CARS.forEach(c => {
      const m = M4.chain(M4.translate(c.p[0], c.p[1], c.p[2]), M4.rotY(c.ry));
      r.draw(M[c.key], at(m), o);
      if (c.ad) r.draw(M.taxiAd, at(m), Object.assign({ texture: set.T.taxiSide }, o));
    });
    if (st.flag && st.flag[1] > 0) drawFlag(r, set, base, st, o);
  }

  function drawFlag(r, set, base, st, pass) {
    const M = set.M;
    const f = st.flag;
    const m = M4.chain(M4.translate(f[0], 0, f[1]), M4.rotY(f[2] + 0.05 * S(st.t * 1.7)));
    const at = base ? M4.mul(base, m) : m;
    r.draw(M.flagPole, at, pass);
    r.draw(M.flag, at, Object.assign({ texture: set.T.flag }, pass));
  }

  function drawPole(r, set, st) {
    const M = set.M;
    const headM = M4.translate(WIN_L.x0 - 0.16, 1.08, 0.15);
    r.draw(M.poleStripes, headM, { texture: set.T.pole, uvScroll: [0, -st.t * 0.35] });
    r.draw(M.poleCaps, headM);
  }

  function drawNear(r, set, st) {
    const M = set.M;
    NEAR.forEach(f => r.draw(M['near_' + f.key], null, { texture: set.F[f.key] }));
    r.draw(M.nearDetail);
    r.draw(M.barberUpper, null, { texture: set.F.barber });
    r.draw(M.barberFront);
    r.draw(M.fasciaFace, null, { texture: set.T.fascia });
    r.draw(M.stickers, null, { texture: set.T.stickers });
    r.draw(M.two, null, { texture: set.T.two });
    const dm = doorM(st.door);
    r.draw(M.doorFrame, dm);
    r.draw(M.doorOpen, dm, { texture: set.T.open });
    r.draw(M.doorTimes, dm, { texture: set.T.times });
    r.draw(M.doorPay, dm, { texture: set.T.pay });
    drawPole(r, set, st);
  }

  function drawDoorway(r, set) {
    r.draw(set.M.doorway, null, { noFog: true });
  }

  function doorM(open) {
    return M4.chain(M4.translate(DOOR.x1, 0, 0.0), M4.rotY(-open));
  }

  function drawInterior(r, set, alpha, st) {
    const M = set.M;
    const o = { blend: true, alpha, noFog: true };
    if (st && st.flag && st.flag[1] <= 0) drawFlag(r, set, null, st, o);
    r.draw(M.interiorShell, null, o);
    r.draw(M.frames, null, Object.assign({ texture: set.T.frames }, o));
    r.draw(M.chairs, null, o);
    r.draw(M.display, null, Object.assign({ texture: set.T.products }, o));
    r.draw(M.topiary, null, o);
    r.draw(M.heater, null, Object.assign({ texture: set.T.heater }, o));
    r.draw(M.price, null, Object.assign({ texture: set.T.price }, o));
    r.draw(M.discount, null, Object.assign({ texture: set.T.discount }, o));
  }

  function drawGlass(r, set, st) {
    const M = set.M;
    r.draw(M.windowGlass, null, { blend: true, alpha: 0.07, flat: [0.85, 0.92, 1.0, 1], noFog: true });
    r.draw(M.doorGlass, doorM(st.door), { blend: true, alpha: st.doorAlpha === undefined ? 0.22 : st.doorAlpha, flat: [0.5, 0.58, 0.68, 1], noFog: true });
  }

  const MIRROR = M4.scale(1, 1, -1);

  window.SlayStreet = { build, drawBackdrop, drawOutdoor, drawNear, drawInterior, drawGlass, drawDoorway, markGlass, doorM, MIRROR, DOOR, WIN_L, WIN_R, CURB, FAR, COL };
})();
