(function () {
  const { M4, V3, rgb, rand, shade } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;

  const COL = {
    asphalt: 0x5f5f63,
    asphaltDark: 0x4a4a4f,
    walk: 0x77767a,
    kerbW: 0xe6e4de,
    kerbB: 0x202022,
    grass: 0x8c8458,
    trunk: 0x4a3a30,
    fence: 0x1c1c1f,
    roof: 0x5b5a5e,
    lamp: 0x6d6f74,
    glass: 0x262a31,
    tyre: 0x18181a,
    rim: 0x9a9ca2,
    plate: 0xe8e8e2
  };

  const LEAVES = [0xd8782c, 0xe8a23a, 0xc8562a, 0xb83a2a, 0xe4c24a, 0xa8642e];

  const ROAD = { z0: -6, z1: 6 };
  const PATH = { z0: 9.4, z1: 11.2 };
  const FENCE_Z = -9.6;

  const PARKED = [
    ['sedan', -146, 4.9, 0, 0xe8e8ea],
    ['hatch', -139, 4.9, 0, 0xf2f2f2],
    ['suv', -131, -4.9, PI, 0x26282c],
    ['sedan', -124, -4.9, PI, 0xdcdcdc],
    ['hatch', -112, -4.9, PI, 0xeeeeee],
    ['sedan', -97, 4.9, 0, 0x1d1f24],
    ['lada', -80, 4.9, 0, 0xa8231e],
    ['sedan', -73, 4.9, 0, 0xb4b6ba, { badge: 'teana' }],
    ['hatch', -60, 4.9, 0, 0xb0201c],
    ['suv', -53, 4.9, 0, 0x121315],
    ['suv', -38, 4.9, 0, 0x34373c, { plate: 'КХ 150' }],
    ['sedan', -27, 4.9, 0, 0x1f2126, { badge: 'opel' }],
    ['truck', -18, 4.8, 0, 0xeeeeea],
    ['sedan', -9, 4.9, 0, 0x22242a],
    ['hatch', 2, 4.9, 0, 0x2c4a7a],
    ['sedan', 18, 4.9, 0, 0x8a8c90],
    ['suv', 40, -4.9, PI, 0xd8d8da],
    ['sedan', 62, 4.9, 0, 0x2a2c30],
    ['hatch', 88, 4.9, 0, 0xc8c8cc]
  ];

  const LOT = [
    ['sedan', -70, -13, PI / 2, 0x1c1e22],
    ['suv', -66, -13, PI / 2, 0x2a2c30],
    ['sedan', -62, -13, PI / 2, 0xe2e2e4],
    ['sedan', -57, -13, PI / 2, 0x8e1e1a],
    ['suv', -52, -13, PI / 2, 0xeeeeee],
    ['minibus', -47, -14, PI / 2, 0xf0f0ee],
    ['sedan', -6, -13, PI / 2, 0x1a1c20],
    ['hatch', -2, -13, PI / 2, 0xd6d6d8],
    ['sedan', 3, -13, PI / 2, 0x606368],
    ['sedan', 8, -13, PI / 2, 0xe8e8e8]
  ];

  const TREES = (() => {
    const g = rand(41);
    const out = [];
    for (let x = -170; x < 140; x += 6.5 + g() * 3) if (Math.abs(x + 33.5) > 3 && Math.abs(x + 46) > 2.5) out.push([x, 7.7 + g() * 0.6, 3.2 + g() * 1.8, g()]);
    out.push([-33.5, 7.7, 4.6, 0.31]);
    for (let x = -170; x < 140; x += 8 + g() * 6) out.push([x, 14 + g() * 9, 3.5 + g() * 2.5, g()]);
    for (let x = -150; x < 140; x += 11 + g() * 8) if (Math.abs(x + 37) > 9) out.push([x, -10.8 - g() * 1.2, 4 + g() * 3, g()]);
    return out;
  })();

  const BLOCKS = [
    { kind: 'panel5', x0: -150, x1: -104, z0: 27, z1: 39, floors: 5 },
    { kind: 'panel9', x0: -100, x1: -82, z0: 24, z1: 36, floors: 9 },
    { kind: 'panel5', x0: -64, x1: -14, z0: 28, z1: 40, floors: 5 },
    { kind: 'panel9', x0: -8, x1: 42, z0: 29, z1: 41, floors: 9 },
    { kind: 'panel9', x0: 66, x1: 112, z0: 29, z1: 41, floors: 9 },
    { kind: 'shop', x0: -158, x1: -126, z0: -26, z1: -12, floors: 1 },
    { kind: 'shop', x0: -122, x1: -98, z0: -24, z1: -13, floors: 1 },
    { kind: 'wood', x0: -84, x1: -74, z0: -27, z1: -19, floors: 2 },
    { kind: 'cream', x0: -44, x1: -30, z0: -27, z1: -17, floors: 2 },
    { kind: 'two', x0: -96, x1: -88, z0: -29, z1: -20, floors: 2 },
    { kind: 'shed', x0: -27, x1: -19, z0: -20, z1: -15, floors: 1 },
    { kind: 'shed', x0: -17, x1: -9, z0: -21, z1: -16, floors: 1 },
    { kind: 'brick', x0: 34, x1: 78, z0: -40, z1: -28, floors: 9 },
    { kind: 'brick', x0: 96, x1: 112, z0: -34, z1: -20, floors: 12 },
    { kind: 'tower', x0: 150, x1: 172, z0: -30, z1: -12, floors: 22 },
    { kind: 'tower', x0: 182, x1: 206, z0: -6, z1: 14, floors: 25 },
    { kind: 'tower', x0: 214, x1: 236, z0: -44, z1: -24, floors: 22 },
    { kind: 'tower', x0: 168, x1: 190, z0: 28, z1: 48, floors: 17 },
    { kind: 'tower', x0: 246, x1: 270, z0: 6, z1: 26, floors: 25 },
    { kind: 'panel9', x0: -250, x1: -205, z0: -40, z1: -28, floors: 9 },
    { kind: 'tower', x0: -60, x1: -40, z0: 120, z1: 140, floors: 17 },
    { kind: 'tower', x0: 20, x1: 42, z0: 130, z1: 150, floors: 22 }
  ];

  const LAMPS = (() => {
    const out = [];
    for (let x = -165; x < 140; x += 32) out.push([x, 6.6, -1]);
    for (let x = -150; x < 140; x += 36) out.push([x, -6.6, 1]);
    return out;
  })();

  const BILLBOARDS = [
    { x: -101, z: 7.3, ry: PI / 2 + 0.25, tex: 'bill309', h: 4.2 },
    { x: -46, z: 7.4, ry: -PI / 2 - 0.25, tex: 'billAd', h: 4.6 }
  ];

  function noise(ctx, w, h, seed, amount, count) {
    const g = rand(seed);
    for (let i = 0; i < count; i++) {
      const v = g();
      ctx.fillStyle = v < 0.5 ? `rgba(0,0,0,${amount * g()})` : `rgba(255,255,255,${amount * g()})`;
      ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1 + Math.floor(g() * 3), 1 + Math.floor(g() * 2));
    }
  }

  function texAsphalt(ctx, w, h) {
    ctx.fillStyle = '#727277';
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 3, 0.12, w * h * 0.4);
    const g = rand(9);
    ctx.strokeStyle = 'rgba(30,30,34,0.5)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      let x = g() * w, y = g() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (g() - 0.5) * 40; y += (g() - 0.3) * 30; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `rgba(40,40,46,${0.12 + g() * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 10 + g() * 30, 6 + g() * 20, g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function texGrass(ctx, w, h) {
    ctx.fillStyle = '#8a8256';
    ctx.fillRect(0, 0, w, h);
    const g = rand(17);
    for (let i = 0; i < w * h * 0.08; i++) {
      const v = g();
      ctx.fillStyle = v < 0.4 ? 'rgba(104,98,58,0.7)' : v < 0.7 ? 'rgba(150,140,92,0.6)' : 'rgba(80,74,46,0.6)';
      ctx.fillRect(g() * w, g() * h, 1, 2 + g() * 3);
    }
    for (let i = 0; i < 90; i++) {
      const c = ['rgba(196,128,62,0.7)', 'rgba(200,160,84,0.7)', 'rgba(170,96,56,0.7)'][Math.floor(g() * 3)];
      ctx.fillStyle = c;
      ctx.save();
      ctx.translate(g() * w, g() * h);
      ctx.rotate(g() * PI);
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.5 + g() * 2, 1 + g() * 1.2, 0, 0, PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function texWalk(ctx, w, h) {
    ctx.fillStyle = '#76757a';
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 23, 0.12, w * h * 0.3);
    const g = rand(31);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = ['rgba(180,120,60,0.6)', 'rgba(190,150,80,0.6)'][Math.floor(g() * 2)];
      ctx.fillRect(g() * w, g() * h, 2 + g() * 2, 1 + g() * 2);
    }
  }

  function winPane(ctx, x, y, w, h, frame, lit) {
    ctx.fillStyle = frame;
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    const gr = ctx.createLinearGradient(x, y, x + w, y + h);
    gr.addColorStop(0, lit ? '#6a6e78' : '#3c4048');
    gr.addColorStop(1, '#22252c');
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = frame;
    ctx.fillRect(x + w * 0.48, y, 3, h);
    ctx.fillRect(x, y + h * 0.3, w * 0.48, 3);
  }

  function texPanel(ctx, w, h, opts) {
    ctx.fillStyle = opts.wall;
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, opts.seed, 0.08, w * h * 0.2);
    ctx.strokeStyle = 'rgba(70,70,70,0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    winPane(ctx, w * 0.24, h * 0.22, w * 0.52, h * 0.5, '#e8e6e0', opts.lit);
    if (opts.balcony) {
      ctx.fillStyle = opts.balcony;
      ctx.fillRect(w * 0.08, h * 0.66, w * 0.84, h * 0.3);
      ctx.strokeStyle = 'rgba(40,40,40,0.4)';
      for (let x = w * 0.1; x < w * 0.9; x += 8) { ctx.beginPath(); ctx.moveTo(x, h * 0.66); ctx.lineTo(x, h * 0.96); ctx.stroke(); }
    }
  }

  function texTower(ctx, w, h) {
    ctx.fillStyle = '#e4e2dc';
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 61, 0.06, w * h * 0.2);
    winPane(ctx, w * 0.12, h * 0.2, w * 0.32, h * 0.5, '#f0eee8', false);
    winPane(ctx, w * 0.56, h * 0.2, w * 0.32, h * 0.5, '#f0eee8', true);
    ctx.fillStyle = '#9fb0c8';
    ctx.fillRect(0, h * 0.82, w, h * 0.1);
  }

  function texBrick(ctx, w, h) {
    ctx.fillStyle = '#9a4a36';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(60,30,24,0.35)';
    for (let y = 0; y < h; y += 6) {
      ctx.fillRect(0, y, w, 1);
      for (let x = (y / 6) % 2 ? 0 : 7; x < w; x += 14) ctx.fillRect(x, y, 1, 6);
    }
    noise(ctx, w, h, 71, 0.1, w * h * 0.2);
    winPane(ctx, w * 0.26, h * 0.2, w * 0.48, h * 0.52, '#e8e2d8', false);
    ctx.fillStyle = '#c8b8a8';
    ctx.fillRect(w * 0.22, h * 0.72, w * 0.56, 5);
  }

  function texShop(ctx, w, h) {
    ctx.fillStyle = '#ecebe6';
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 81, 0.06, w * h * 0.2);
    ctx.fillStyle = '#2c3038';
    ctx.fillRect(w * 0.08, h * 0.36, w * 0.84, h * 0.5);
    ctx.fillStyle = '#e88a2a';
    ctx.fillRect(0, h * 0.08, w, h * 0.16);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(h * 0.11)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('ПРОДУКТЫ 24', w / 2, h * 0.205);
  }

  function texWood(ctx, w, h) {
    ctx.fillStyle = '#7a5236';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(40,24,14,0.5)';
    for (let y = 0; y < h; y += 8) ctx.fillRect(0, y, w, 1.5);
    noise(ctx, w, h, 91, 0.1, w * h * 0.2);
    winPane(ctx, w * 0.3, h * 0.25, w * 0.4, h * 0.45, '#e8dcc8', false);
  }

  function texCream(ctx, w, h) {
    ctx.fillStyle = '#e6d6b0';
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 101, 0.06, w * h * 0.2);
    winPane(ctx, w * 0.25, h * 0.22, w * 0.5, h * 0.5, '#f4f0e8', false);
  }

  function texTwo(ctx, w, h) {
    ctx.fillStyle = '#d8d2c8';
    ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, 111, 0.07, w * h * 0.2);
    winPane(ctx, w * 0.25, h * 0.22, w * 0.5, h * 0.5, '#f4f0e8', false);
  }

  function texShed(ctx, w, h) {
    ctx.fillStyle = '#b8b2a8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(60,60,60,0.3)';
    for (let x = 0; x < w; x += 10) ctx.fillRect(x, 0, 2, h);
    noise(ctx, w, h, 121, 0.1, w * h * 0.2);
  }

  function texSky(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#a8acbc');
    gr.addColorStop(0.5, '#cfd0d8');
    gr.addColorStop(1, '#ecebee');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    const g = rand(131);
    for (let i = 0; i < 70; i++) {
      const x = g() * w, y = g() * h * 0.85, r = 20 + g() * 60;
      const light = g() < 0.55;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, light ? 'rgba(246,244,250,0.35)' : 'rgba(110,112,130,0.22)');
      rg.addColorStop(1, light ? 'rgba(246,244,250,0)' : 'rgba(110,112,130,0)');
      ctx.fillStyle = rg;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1.8, 0.7);
      ctx.translate(-x, -y);
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
    }
  }

  function texFence(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#18181a';
    for (let x = 2; x < w; x += 10) ctx.fillRect(x, 6, 3, h - 8);
    ctx.fillRect(0, 4, w, 5);
    ctx.fillRect(0, h * 0.82, w, 5);
    for (let x = 2; x < w; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x - 2, 6);
      ctx.lineTo(x + 1.5, 0);
      ctx.lineTo(x + 5, 6);
      ctx.fill();
    }
  }

  function texBill309(ctx, w, h) {
    ctx.fillStyle = '#f4f0e6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a4c9a';
    ctx.fillRect(0, 0, w, h * 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(h * 0.2)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('НОВОСТРОЙКИ', w / 2, h * 0.23);
    ctx.fillStyle = '#d42c22';
    ctx.font = `bold ${Math.round(h * 0.5)}px Arial`;
    ctx.fillText('309', w * 0.36, h * 0.82);
    ctx.fillStyle = '#20242c';
    ctx.font = `bold ${Math.round(h * 0.12)}px Arial`;
    ctx.fillText('ТЫС. РУБ', w * 0.76, h * 0.56);
    ctx.fillText('ЗА МЕТР', w * 0.76, h * 0.72);
    ctx.fillText('309-00-99', w * 0.76, h * 0.9);
  }

  function texBillAd(ctx, w, h) {
    ctx.fillStyle = '#1f3c78';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2c21a';
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(h * 0.24)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('ШИНЫ  ДИСКИ', w / 2, h * 0.4);
    ctx.fillStyle = '#1f3c78';
    ctx.font = `bold ${Math.round(h * 0.2)}px Arial`;
    ctx.fillText('ШИНОМОНТАЖ 24 ЧАСА', w / 2, h * 0.88);
  }

  function texSign(ctx, w, h) {
    ctx.fillStyle = '#2a58b8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(h * 0.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('АВТОЗАПЧАСТИ', w / 2, h * 0.68);
  }

  function texPlate(text) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#ecece6';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, w - 4, h - 4);
      ctx.fillStyle = '#111';
      ctx.font = `bold ${Math.round(h * 0.62)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(text, w * 0.44, h * 0.74);
      ctx.fillRect(w * 0.82, 4, 2, h - 8);
      ctx.font = `bold ${Math.round(h * 0.34)}px Arial`;
      ctx.fillText('77', w * 0.91, h * 0.5);
    };
  }

  function slab(b, x0, y0, z0, x1, y1, z1, col, faces) {
    b.at((x0 + x1) / 2, y0, (z0 + z1) / 2, h => h.box(x1 - x0, y1 - y0, z1 - z0, col, { base: true, faces: faces || {} }));
  }

  function groundQuad(b, x0, z0, x1, z1, y, col, tile) {
    const t = tile || 4;
    const n = [0, 1, 0];
    const step = 16;
    for (let xa = x0; xa < x1; xa += step) {
      const xb = Math.min(x1, xa + step);
      for (let za = z0; za < z1; za += step) {
        const zb = Math.min(z1, za + step);
        b.quad([xa, y, zb], [xb, y, zb], [xb, y, za], [xa, y, za], col, [[xa / t, zb / t], [xb / t, zb / t], [xb / t, za / t], [xa / t, za / t]], [n, n, n, n]);
      }
    }
  }

  function facade(b, x0, z0, x1, z1, y0, y1, bayW, floorH) {
    const walls = [[[x0, z1], [x1, z1]], [[x1, z1], [x1, z0]], [[x1, z0], [x0, z0]], [[x0, z0], [x0, z1]]];
    walls.forEach(([a, c]) => {
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
      const u = Math.max(1, Math.round(len / bayW));
      const v = (y1 - y0) / floorH;
      b.quad([a[0], y0, a[1]], [c[0], y0, c[1]], [c[0], y1, c[1]], [a[0], y1, a[1]], 0xffffff, [[0, 0], [u, 0], [u, v], [0, v]]);
    });
  }

  function wheel(b, x, z, r, w, side) {
    b.push(M4.translate(x, r, z), M4.rotX(PI / 2));
    b.prism(10, r, r, -w / 2, r, r, w / 2, COL.tyre, { capBottom: true });
    b.at(0, -side * (w / 2 + 0.003), 0, q => q.disc(r * 0.62, 10, COL.rim));
    b.pop();
  }

  const CAR_DIMS = {
    lada: { L: 4.13, W: 1.62, Hb: 0.86, Hr: 1.42, cab: [-1.15, 0.72], slope: [0.22, 0.12], round: 0.04, r: 0.3 },
    sedan: { L: 4.8, W: 1.8, Hb: 0.86, Hr: 1.46, cab: [-1.35, 0.95], slope: [0.42, 0.55], round: 0.12, r: 0.33 },
    hatch: { L: 3.85, W: 1.7, Hb: 0.84, Hr: 1.5, cab: [-1.6, 0.75], slope: [0.12, 0.6], round: 0.12, r: 0.3 },
    suv: { L: 4.7, W: 1.88, Hb: 1.0, Hr: 1.72, cab: [-2.0, 0.85], slope: [0.12, 0.45], round: 0.1, r: 0.37 },
    minibus: { L: 5.5, W: 2.0, Hb: 1.1, Hr: 2.3, cab: [-2.6, 1.9], slope: [0.05, 0.5], round: 0.06, r: 0.36 },
    truck: { L: 6.2, W: 2.1, Hb: 1.15, Hr: 2.2, cab: [1.6, 2.9], slope: [0.05, 0.35], round: 0.05, r: 0.4 }
  };

  function buildCar(b, kind, color, opts) {
    const o = opts || {};
    const d = CAR_DIMS[kind];
    const { L, W, Hb, Hr } = d;
    const body = color;
    const dark = shade(color, 0.55);
    const lower = 0.3;
    if (kind === 'truck') {
      slab(b, -L / 2, lower, -W / 2, 1.4, 3.0, W / 2, 0xf2f2ee, { bottom: dark });
      slab(b, 1.45, lower, -W / 2 + 0.05, L / 2, Hb, W / 2 - 0.05, body);
      const g = COL.glass, iw = W / 2 - 0.08;
      b.quad([1.6, Hb, iw], [L / 2 - 0.35, Hb, iw], [L / 2 - 0.65, Hr, iw - 0.05], [1.6, Hr, iw - 0.05], g);
      b.quad([L / 2 - 0.35, Hb, -iw], [1.6, Hb, -iw], [1.6, Hr, -iw + 0.05], [L / 2 - 0.65, Hr, -iw + 0.05], g);
      b.quad([L / 2 - 0.35, Hb, iw], [L / 2 - 0.35, Hb, -iw], [L / 2 - 0.65, Hr, -iw + 0.05], [L / 2 - 0.65, Hr, iw - 0.05], g);
      b.quad([1.6, Hr, iw - 0.05], [L / 2 - 0.65, Hr, iw - 0.05], [L / 2 - 0.65, Hr, -iw + 0.05], [1.6, Hr, -iw + 0.05], body);
      slab(b, 1.45, Hb, -W / 2 + 0.05, 1.6, Hr, W / 2 - 0.05, body);
      [L / 2 - 0.9, -L / 2 + 1.1, -L / 2 + 1.9].forEach(x => { wheel(b, x, W / 2 - 0.15, d.r, 0.28, 1); wheel(b, x, -W / 2 + 0.15, d.r, 0.28, -1); });
    } else {
      const fr = L / 2, re = -L / 2;
      const prof = [[re, lower], [fr, lower], [fr, Hb - 0.12], [fr - 0.25, Hb], [re + 0.15, Hb], [re, Hb - 0.1]];
      const zs = W / 2;
      for (let i = 0; i < prof.length; i++) {
        const a = prof[i], c = prof[(i + 1) % prof.length];
        b.quad([a[0], a[1], zs], [a[0], a[1], -zs], [c[0], c[1], -zs], [c[0], c[1], zs], i === 0 ? dark : body);
      }
      const side = (z, flip) => {
        const pts = prof.map(p => [p[0], p[1], z]);
        const c0 = [(re + fr) / 2, (lower + Hb) / 2, z];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], c = pts[(i + 1) % pts.length];
          if (flip) b.tri(c0, c, a, body); else b.tri(c0, a, c, body);
        }
      };
      side(zs, false);
      side(-zs, true);
      const [c0, c1] = d.cab;
      const [sr, sf] = d.slope;
      const iw = zs - 0.1, tw = zs - 0.22;
      const g = COL.glass;
      b.quad([c0, Hb, iw], [c1, Hb, iw], [c1 - sf, Hr, tw], [c0 + sr, Hr, tw], g);
      b.quad([c1, Hb, -iw], [c0, Hb, -iw], [c0 + sr, Hr, -tw], [c1 - sf, Hr, -tw], g);
      b.quad([c1, Hb, iw], [c1, Hb, -iw], [c1 - sf, Hr, -tw], [c1 - sf, Hr, tw], g);
      b.quad([c0, Hb, -iw], [c0, Hb, iw], [c0 + sr, Hr, tw], [c0 + sr, Hr, -tw], g);
      b.quad([c0 + sr, Hr, tw], [c1 - sf, Hr, tw], [c1 - sf, Hr, -tw], [c0 + sr, Hr, -tw], body);
      const pillar = (x0, x1, s) => b.quad([x0, Hb + 0.01, s * (iw + 0.004)], [x0 + 0.08, Hb + 0.01, s * (iw + 0.004)], [x1 + 0.06, Hr - 0.01, s * (tw + 0.004)], [x1, Hr - 0.01, s * (tw + 0.004)], body);
      const mid = (c0 + c1) / 2 - 0.1;
      [1, -1].forEach(s => { pillar(mid, mid + (sr - sf) * 0.2, s); pillar(c1 - 0.08, c1 - sf - 0.06, s); pillar(c0, c0 + sr, s); });
      const wx = [fr - (kind === 'hatch' ? 0.65 : 0.85), re + (kind === 'hatch' ? 0.6 : 0.8)];
      wx.forEach(x => { wheel(b, x, zs - 0.12, d.r, 0.22, 1); wheel(b, x, -zs + 0.12, d.r, 0.22, -1); });
      wx.forEach(x => [1, -1].forEach(s => {
        const n = 8;
        for (let i = 0; i < n; i++) {
          const a0 = PI * i / n, a1 = PI * (i + 1) / n;
          const R = d.r + 0.06;
          b.quad([x + C(a0) * R, d.r + S(a0) * R, s * (zs + 0.003)], [x + C(a1) * R, d.r + S(a1) * R, s * (zs + 0.003)], [x + C(a1) * (R + 0.04), d.r + S(a1) * (R + 0.04), s * (zs + 0.003)], [x + C(a0) * (R + 0.04), d.r + S(a0) * (R + 0.04), s * (zs + 0.003)], 0x141416);
        }
      }));
    }
    const headY = kind === 'truck' ? 0.75 : Hb - 0.2;
    const front = L / 2 + 0.004, rear = -L / 2 - 0.004;
    [1, -1].forEach(s => {
      const z0 = s * (W / 2 - 0.12), z1 = s * (W / 2 - 0.42);
      b.quad([front, headY, Math.min(z0, z1)], [front, headY, Math.max(z0, z1)], [front, headY + 0.13, Math.max(z0, z1)], [front, headY + 0.13, Math.min(z0, z1)], [0.95, 0.94, 0.88, 0.6]);
      b.quad([rear, headY, Math.max(z0, z1)], [rear, headY, Math.min(z0, z1)], [rear, headY + 0.14, Math.min(z0, z1)], [rear, headY + 0.14, Math.max(z0, z1)], [0.72, 0.08, 0.08, 0.45]);
    });
    b.quad([front, lower + 0.08, -0.26], [front, lower + 0.08, 0.26], [front, lower + 0.2, 0.26], [front, lower + 0.2, -0.26], COL.plate);
    b.quad([rear, lower + 0.2, 0.26], [rear, lower + 0.2, -0.26], [rear, lower + 0.32, -0.26], [rear, lower + 0.32, 0.26], COL.plate);
    if (kind !== 'truck') b.quad([front + 0.001, headY - 0.02, -0.4], [front + 0.001, headY - 0.02, 0.4], [front + 0.001, headY + 0.1, 0.4], [front + 0.001, headY + 0.1, -0.4], kind === 'lada' ? 0x9a9ca0 : 0x1a1a1c);
    if (o.badge) b.at(front + 0.006, headY + 0.04, 0, q => { q.push(M4.rotY(PI / 2)); K.discXY(q, 0, 0, 0, 0.05, 8, 0xb8b8bc); q.pop(); });
    return d;
  }

  function buildTree(b, x, z, h, seed) {
    const g = rand(Math.floor(seed * 1e6) + 7);
    const trunkH = h * 0.42;
    b.at(x, 0, z, q => q.prism(6, 0.09 + h * 0.012, 0.09 + h * 0.012, 0, 0.05, 0.05, trunkH + 0.4, COL.trunk));
    const bare = g() < 0.18;
    const n = bare ? 0 : 4 + Math.floor(g() * 3);
    for (let i = 0; i < 4; i++) {
      const a = g() * PI * 2;
      const len = h * (0.25 + g() * 0.2);
      const y0 = trunkH * (0.7 + g() * 0.3);
      const tip = [x + C(a) * len * 0.6, y0 + len * 0.8, z + S(a) * len * 0.6];
      K.tube(b, [[x, y0, z], tip], [0.04, 0.015], 4, COL.trunk);
    }
    const col = LEAVES[Math.floor(g() * LEAVES.length)];
    const crownY = trunkH + h * 0.3, crownR = h * 0.3;
    for (let i = 0; i < n * 3.5; i++) {
      const a = g() * PI * 2, rr = Math.sqrt(g()) * crownR;
      const cy = crownY + (g() - 0.4) * crownR * 1.4;
      const rad = h * (0.09 + g() * 0.07);
      const c = g() < 0.55 ? col : LEAVES[Math.floor(g() * LEAVES.length)];
      b.push(M4.translate(x + C(a) * rr, cy, z + S(a) * rr), M4.rotY(g() * PI), M4.rotZ((g() - 0.5) * 0.8));
      b.ellipsoid(rad * (1 + g() * 0.5), rad * (0.7 + g() * 0.3), rad * (0.9 + g() * 0.4), 7, 4, shade(c, 0.85 + g() * 0.3));
      b.pop();
    }
  }

  function buildLamp(b, x, z, side) {
    b.at(x, 0, z, q => q.prism(6, 0.09, 0.09, 0, 0.06, 0.06, 8.5, COL.lamp));
    K.tube(b, [[x, 8.4, z], [x, 8.9, z + side * 0.6], [x, 8.95, z + side * 1.6]], [0.05, 0.045, 0.04], 5, COL.lamp);
    b.at(x, 8.85, z + side * 1.75, q => q.box(0.32, 0.14, 0.6, 0x4e5056));
  }

  function buildBillboard(b, bb) {
    b.push(M4.translate(bb.x, 0, bb.z), M4.rotY(bb.ry));
    b.at(-1.6, 0, 0, q => q.prism(6, 0.12, 0.12, 0, 0.12, 0.12, bb.h, 0x4a4c50));
    b.at(1.6, 0, 0, q => q.prism(6, 0.12, 0.12, 0, 0.12, 0.12, bb.h, 0x4a4c50));
    b.at(0, bb.h + 1.1, -0.08, q => q.box(6.2, 3.2, 0.14, 0x3a3c40));
    b.pop();
  }

  function billFace(b, bb) {
    b.push(M4.translate(bb.x, 0, bb.z), M4.rotY(bb.ry));
    b.quad([-3, bb.h - 0.4, 0.002], [3, bb.h - 0.4, 0.002], [3, bb.h + 2.6, 0.002], [-3, bb.h + 2.6, 0.002], [1, 1, 1, 0.15], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    b.pop();
  }

  function buildBlockShell(b, bl, h) {
    const roofC = bl.kind === 'wood' || bl.kind === 'cream' || bl.kind === 'two' ? 0x6a3a30 : bl.kind === 'shed' ? 0x8a3226 : COL.roof;
    if (bl.kind === 'wood' || bl.kind === 'cream' || bl.kind === 'two' || bl.kind === 'shed') {
      const mx = (bl.x0 + bl.x1) / 2, rise = bl.kind === 'shed' ? 0.8 : 2.4;
      const e = 0.4;
      b.quad([bl.x0 - e, h, bl.z1 + e], [bl.x1 + e, h, bl.z1 + e], [bl.x1 + e, h + rise, (bl.z0 + bl.z1) / 2], [bl.x0 - e, h + rise, (bl.z0 + bl.z1) / 2], roofC);
      b.quad([bl.x1 + e, h, bl.z0 - e], [bl.x0 - e, h, bl.z0 - e], [bl.x0 - e, h + rise, (bl.z0 + bl.z1) / 2], [bl.x1 + e, h + rise, (bl.z0 + bl.z1) / 2], shade(roofC, 0.85));
      const wall = bl.kind === 'wood' ? 0x7a5236 : bl.kind === 'cream' ? 0xe6d6b0 : bl.kind === 'shed' ? 0xb8b2a8 : 0xd8d2c8;
      b.tri([bl.x0, h, bl.z1], [bl.x0, h + rise, (bl.z0 + bl.z1) / 2], [bl.x0, h, bl.z0], wall);
      b.tri([bl.x1, h, bl.z0], [bl.x1, h + rise, (bl.z0 + bl.z1) / 2], [bl.x1, h, bl.z1], wall);
      if (bl.kind === 'cream') {
        b.at(mx, h + 0.2, bl.z1 + 0.6, q => q.box(0.12, 1.2, 0.12, 0x333333));
      }
    } else {
      slab(b, bl.x0, h, bl.z0, bl.x1, h + 0.6, bl.z1, roofC);
      if (bl.kind === 'panel9' || bl.kind === 'tower') {
        const g = rand(Math.round(bl.x0 * 7 + bl.z0));
        for (let i = 0; i < 3; i++) slab(b, lerp(bl.x0, bl.x1, 0.15 + g() * 0.7) - 1.5, h + 0.6, bl.z0 + 2, lerp(bl.x0, bl.x1, 0.15 + g() * 0.7) + 1.5, h + 2.4, bl.z0 + 5, 0xb8b6b0);
      }
      if (bl.kind === 'panel5' || bl.kind === 'panel9') {
        const frontZ = bl.z0 < 0 ? bl.z1 : bl.z0;
        const dir = bl.z0 < 0 ? 1 : -1;
        for (let x = bl.x0 + 8; x < bl.x1 - 4; x += 16) {
          slab(b, x - 1.2, 0, Math.min(frontZ, frontZ + dir * 1.6), x + 1.2, 2.6, Math.max(frontZ, frontZ + dir * 1.6), 0xa8a6a0);
          b.at(x, 2.7, frontZ + dir * 1.0, q => q.box(3.2, 0.15, 2.2, 0x8a8884));
        }
      }
    }
  }

  const FLOOR = { panel5: 2.8, panel9: 2.8, tower: 3.0, brick: 3.0, shop: 4.2, wood: 2.9, cream: 3.0, two: 3.0, shed: 2.6 };
  const BAY = { panel5: 3.2, panel9: 3.2, tower: 3.6, brick: 3.4, shop: 6, wood: 3.5, cream: 3.5, two: 3.4, shed: 4 };

  function build(r) {
    const T = {
      asphalt: r.texture(256, texAsphalt),
      grass: r.texture(256, texGrass),
      walk: r.texture(128, texWalk),
      sky: r.texture(512, texSky),
      fence: r.texture(256, texFence, { height: 64 }),
      bill309: r.texture(256, texBill309, { height: 128, clamp: true }),
      billAd: r.texture(256, texBillAd, { height: 128, clamp: true }),
      sign: r.texture(256, texSign, { height: 48, clamp: true }),
      plate: r.texture(128, texPlate('К 150 Х'), { height: 32, clamp: true }),
      panel5: r.texture(64, (c, w, h) => texPanel(c, w, h, { wall: '#e6e4de', seed: 5, lit: false })),
      panel9: r.texture(64, (c, w, h) => texPanel(c, w, h, { wall: '#dcdad4', seed: 6, balcony: '#c8c4bc', lit: true })),
      tower: r.texture(64, texTower),
      brick: r.texture(64, texBrick),
      shop: r.texture(128, texShop),
      wood: r.texture(64, texWood),
      cream: r.texture(64, texCream),
      two: r.texture(64, texTwo),
      shed: r.texture(64, texShed)
    };

    const ground = mesh(r, b => {
      groundQuad(b, -400, ROAD.z0, 400, ROAD.z1, 0, 0xffffff, 6);
    });
    const lawn = mesh(r, b => {
      groundQuad(b, -400, 6.3, 400, PATH.z0, 0.1, 0xffffff, 5);
      groundQuad(b, -400, PATH.z1, 400, 160, 0.1, 0xffffff, 5);
      groundQuad(b, -400, -160, 400, -8.6, 0.12, 0xffffff, 5);
    });
    const walks = mesh(r, b => {
      groundQuad(b, -400, PATH.z0, 400, PATH.z1, 0.11, 0xffffff, 3);
      groundQuad(b, -400, -8.6, 400, ROAD.z0, 0.12, 0xffffff, 3);
      groundQuad(b, -86, -18, 12, -8.6, 0.125, 0xd8d8d8, 6);
      for (let x = -140; x < 120; x += 16) groundQuad(b, x - 0.9, PATH.z1, x + 0.9, 26, 0.105, 0xffffff, 3);
    });
    const fixed = mesh(r, b => {
      for (let x = -400; x < 400; x += 1) {
        const c = Math.floor(x) % 2 === 0 ? COL.kerbW : COL.kerbB;
        slab(b, x, 0, ROAD.z1, x + 1, 0.16, ROAD.z1 + 0.3, Math.abs(x) < 180 ? c : 0x8a8a8a);
      }
      slab(b, -400, 0, ROAD.z0 - 0.3, 400, 0.16, ROAD.z0, 0x8a8a8a);
      for (let x = -400; x < 400; x += 6) b.quad([x, 0.01, -0.07], [x + 3, 0.01, -0.07], [x + 3, 0.01, 0.07], [x, 0.01, 0.07], 0xe8e8e8);
      [ROAD.z0 + 0.25, ROAD.z1 - 0.25].forEach(z => b.quad([-400, 0.01, z - 0.06], [400, 0.01, z - 0.06], [400, 0.01, z + 0.06], [-400, 0.01, z + 0.06], 0xdedede));
      slab(b, -92, 0, FENCE_Z - 0.06, 140, 0.3, FENCE_Z + 0.06, 0x2a2a2c);
      for (let x = -92; x <= 140; x += 2.5) slab(b, x - 0.05, 0, FENCE_Z - 0.05, x + 0.05, 1.75, FENCE_Z + 0.05, COL.fence);
      LAMPS.forEach(([x, z, s]) => buildLamp(b, x, z, s));
      BILLBOARDS.forEach(bb => buildBillboard(b, bb));
      TREES.forEach(([x, z, h, s]) => buildTree(b, x, z, h, s));
      BLOCKS.forEach(bl => buildBlockShell(b, bl, bl.floors * FLOOR[bl.kind]));
      for (let i = 0; i < 4; i++) slab(b, -51 + i * 2.2, 0, 17.2, -49.2 + i * 2.2, 1.3, 18.6, [0x3e5a3a, 0x3e5a3a, 0x4a4a4e, 0x3e5a3a][i]);
      for (let i = 0; i < 6; i++) slab(b, -42 + i * 3.4, 0, 17, -38.8 + i * 3.4, 2.4, 23, 0x7a7c80, { back: 0x6a6c70 });
      K.tube(b, [[30, 0, -32], [30, 34, -32]], [1.6, 0.25], 4, 0x8a8e94);
      for (let y = 2; y < 34; y += 3) K.tube(b, [[28.6, y, -32], [31.4, y + 1.5, -32]], [0.05, 0.05], 3, 0x8a8e94);
      slab(b, -41, 6.6, -17.6, -33, 7.6, -17.4, 0x2a58b8);
      for (let x = -58; x < -40; x += 3.2) slab(b, x, 0, 13.8, x + 2.6, 0.45, 14.2, 0xb0aeaa);
      slab(b, -12, 0, 22.5, -8, 1.0, 26.5, 0xa8a6a0, {});
      slab(b, -31, 0, 11.4, -27, 0.35, 13.2, 0xa8a6a0);
      b.quad([-31, 0.35, 13.2], [-27, 0.35, 13.2], [-27, 0.1, 15.2], [-31, 0.1, 15.2], 0x9a9894);
    });
    const fence = mesh(r, b => {
      b.quad([-92, 0.2, FENCE_Z], [140, 0.2, FENCE_Z], [140, 1.7, FENCE_Z], [-92, 1.7, FENCE_Z], 0xffffff, [[0, 0], [232 / 2.4, 0], [232 / 2.4, 1], [0, 1]]);
      b.quad([-54, 0.12, 15.7], [-20, 0.12, 15.7], [-20, 1.5, 15.7], [-54, 1.5, 15.7], 0xffffff, [[0, 0], [34 / 2.4, 0], [34 / 2.4, 1], [0, 1]]);
    });
    const walls = {};
    Object.keys(FLOOR).forEach(kind => {
      const list = BLOCKS.filter(bl => bl.kind === kind);
      if (list.length) walls[kind] = mesh(r, b => list.forEach(bl => facade(b, bl.x0, bl.z0, bl.x1, bl.z1, 0, bl.floors * FLOOR[kind], BAY[kind], FLOOR[kind])));
    });
    const bills = {};
    BILLBOARDS.forEach(bb => { bills[bb.tex] = mesh(r, b => billFace(b, bb)); });
    const sign = mesh(r, b => b.quad([-41, 6.6, -17.38], [-33, 6.6, -17.38], [-33, 7.6, -17.38], [-41, 7.6, -17.38], [1, 1, 1, 0.2]));
    const sky = mesh(r, b => {
      const n = 24, R = 600;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        for (let j = 0; j < 6; j++) {
          const p0 = -0.08 + (j / 6) * (PI / 2), p1 = -0.08 + ((j + 1) / 6) * (PI / 2);
          const pt = (a, p) => [C(a) * C(p) * R, S(p) * R * 0.5, S(a) * C(p) * R];
          const v0 = 0.02 + j / 6.3, v1 = 0.02 + (j + 1) / 6.3;
          b.quad(pt(a0, p0), pt(a1, p0), pt(a1, p1), pt(a0, p1), [1, 1, 1, 1], [[i / n * 4, v0], [(i + 1) / n * 4, v0], [(i + 1) / n * 4, v1], [i / n * 4, v1]]);
        }
      }
    });
    const cars = mesh(r, b => {
      PARKED.concat(LOT).forEach(([kind, x, z, ry, col, o]) => {
        b.push(M4.translate(x, 0, z), M4.rotY(ry));
        buildCar(b, kind, col, o);
        b.pop();
      });
    });
    const hyundai = PARKED.find(p => p[5] && p[5].plate);
    const plates = mesh(r, b => {
      const d = CAR_DIMS[hyundai[0]];
      b.push(M4.translate(hyundai[1], 0, hyundai[2]), M4.rotY(hyundai[3]));
      b.quad([d.L / 2 + 0.01, 0.38, -0.26], [d.L / 2 + 0.01, 0.38, 0.26], [d.L / 2 + 0.01, 0.5, 0.26], [d.L / 2 + 0.01, 0.5, -0.26], [1, 1, 1, 0.2]);
      b.quad([-d.L / 2 - 0.01, 0.5, 0.26], [-d.L / 2 - 0.01, 0.5, -0.26], [-d.L / 2 - 0.01, 0.62, -0.26], [-d.L / 2 - 0.01, 0.62, 0.26], [1, 1, 1, 0.2]);
      b.pop();
    });
    const traffic = {};
    function carMesh(kind, col) {
      const key = kind + ':' + col;
      if (!traffic[key]) traffic[key] = mesh(r, b => buildCar(b, kind, col));
      return traffic[key];
    }
    const shadowBlob = mesh(r, b => {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        b.tri([0, 0, 0], [C(a1), 0, S(a1)], [C(a0), 0, S(a0)], [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      }
    });
    return { T, ground, lawn, walks, fixed, fence, walls, bills, sign, sky, cars, plates, carMesh, shadowBlob };
  }

  function draw(r, W, eye) {
    r.draw(W.sky, M4.translate(eye[0], -20, eye[2]), { texture: W.T.sky, noFog: true });
    r.draw(W.ground, null, { texture: W.T.asphalt });
    r.draw(W.lawn, null, { texture: W.T.grass });
    r.draw(W.walks, null, { texture: W.T.walk });
    r.draw(W.fixed);
    Object.keys(W.walls).forEach(kind => r.draw(W.walls[kind], null, { texture: W.T[kind] }));
    Object.keys(W.bills).forEach(k => r.draw(W.bills[k], null, { texture: W.T[k] }));
    r.draw(W.sign, null, { texture: W.T.sign });
    r.draw(W.cars);
    r.draw(W.plates, null, { texture: W.T.plate });
    r.draw(W.fence, null, { texture: W.T.fence });
  }

  function drawCar(r, W, kind, col, x, z, ry, lights) {
    r.draw(W.carMesh(kind, col), M4.chain(M4.translate(x, 0, z), M4.rotY(ry)), lights ? { tint: [1.08, 1.06, 1.04] } : undefined);
  }

  function carAt(name) {
    const map = { lada: 6, teana: 7, redHatch: 8, blackSuv: 9, hyundai: 10, opel: 11, truck: 12, darkSedan: 13 };
    const p = PARKED[map[name]];
    return { x: p[1], z: p[2], L: CAR_DIMS[p[0]].L, W: CAR_DIMS[p[0]].W, H: CAR_DIMS[p[0]].Hr };
  }

  window.OtpuskWorld = { build, draw, drawCar, carAt, buildCar, CAR_DIMS, PARKED, LOT, TREES, BLOCKS, ROAD, PATH, FENCE_Z, COL };
})();
