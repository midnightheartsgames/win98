(function () {
  const { M4, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, mesh } = K;

  function flatY(b, x0, z0, x1, z1, y, col, uv) {
    const u = uv || [1, 1];
    const nx = Math.max(1, Math.ceil((x1 - x0) / 4)), nz = Math.max(1, Math.ceil((z1 - z0) / 4));
    const up = [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]];
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const a = i / nx, c = (i + 1) / nx, d = j / nz, e = (j + 1) / nz;
        const xa = lerp(x0, x1, a), xc = lerp(x0, x1, c), zd = lerp(z1, z0, d), ze = lerp(z1, z0, e);
        b.quad([xa, y, zd], [xc, y, zd], [xc, y, ze], [xa, y, ze], col, [[u[0] * a, u[1] * d], [u[0] * c, u[1] * d], [u[0] * c, u[1] * e], [u[0] * a, u[1] * e]], up);
      }
    }
  }

  function wallZ(b, x0, x1, y0, y1, z, col, uv) {
    const u = uv || [1, 1];
    b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, [[0, 0], [u[0], 0], [u[0], u[1]], [0, u[1]]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
  }

  function skyCard(b, w, y0, y1, z, top, bottom) {
    b.quad([-w, y0, z], [w, y0, z], [w, y1, z], [-w, y1, z], [bottom, bottom, top, top].map(c => c.concat([1])));
  }

  function grassTex(ctx, w, h) {
    ctx.fillStyle = '#3e5420';
    ctx.fillRect(0, 0, w, h);
    const g = rand(31);
    for (let i = 0; i < 2600; i++) {
      const x = g() * w, y = g() * h, l = 2 + g() * 7;
      const k = g();
      ctx.strokeStyle = k < 0.3 ? '#34481c' : k < 0.7 ? '#5e7630' : k < 0.95 ? '#7a8e3a' : '#c8c8a8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (g() - 0.5) * 2, y - l);
      ctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = g() < 0.6 ? '#e8e6d8' : '#d8c860';
      ctx.fillRect(g() * w, g() * h, 2, 2);
    }
  }

  function tuftTex(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(77);
    for (let i = 0; i < 90; i++) {
      const x = g() * w, l = h * (0.35 + g() * 0.6);
      ctx.strokeStyle = g() < 0.5 ? '#4e6c30' : g() < 0.8 ? '#6c8a40' : '#8aa456';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.quadraticCurveTo(x + (g() - 0.5) * 10, h - l * 0.5, x + (g() - 0.5) * 18, h - l);
      ctx.stroke();
    }
  }

  function plankTex(ctx, w, h) {
    const g = rand(12);
    for (let x = 0; x < w; x += 8) {
      const v = 70 + Math.floor(g() * 30);
      ctx.fillStyle = `rgb(${v},${v - 8},${v - 14})`;
      ctx.fillRect(x, 0, 7, h);
      ctx.fillStyle = '#2a2622';
      ctx.fillRect(x + 7, 0, 1, h);
    }
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(g() * w, g() * h, 1, 3 + g() * 8);
    }
  }

  function slateTex(ctx, w, h) {
    ctx.fillStyle = '#8a8c90';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#6a6c70';
    for (let x = 0; x < w; x += 6) ctx.fillRect(x, 0, 2, h);
    ctx.fillStyle = 'rgba(40,40,44,0.5)';
    for (let y = 0; y < h; y += 16) ctx.fillRect(0, y, w, 1);
  }

  function metalTex(ctx, w, h) {
    ctx.fillStyle = '#a8acb0';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 4) {
      ctx.fillStyle = 'rgba(70,74,80,0.35)';
      ctx.fillRect(x, 0, 1, h);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + 2, 0, 1, h);
    }
  }

  function wallpaperTex(ctx, w, h) {
    ctx.fillStyle = '#d6cdbf';
    ctx.fillRect(0, 0, w, h);
    const g = rand(44);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(160,146,128,0.35)' : 'rgba(255,250,240,0.5)';
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 1 + g() * 3, 1 + g() * 2, g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function posterTex(ctx, w, h) {
    ctx.fillStyle = '#c8461e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8eef2';
    ctx.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84);
    ctx.fillStyle = '#aab8c4';
    ctx.fillRect(w * 0.08, h * 0.7, w * 0.84, h * 0.22);
    const vase = (cx, col, rw) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(cx - rw * 0.4, h * 0.72);
      ctx.quadraticCurveTo(cx - rw, h * 0.5, cx - rw * 0.3, h * 0.2);
      ctx.lineTo(cx + rw * 0.3, h * 0.2);
      ctx.quadraticCurveTo(cx + rw, h * 0.5, cx + rw * 0.4, h * 0.72);
      ctx.fill();
    };
    vase(w * 0.32, '#3c9a3a', w * 0.2);
    vase(w * 0.5, '#2a3c8a', w * 0.17);
    ctx.fillStyle = '#e8a020';
    ctx.beginPath();
    ctx.ellipse(w * 0.62, h * 0.18, w * 0.12, h * 0.1, 0.3, 0, PI * 2);
    ctx.fill();
  }

  function asphaltTex(ctx, w, h) {
    ctx.fillStyle = '#4c4c4e';
    ctx.fillRect(0, 0, w, h);
    const g = rand(51);
    for (let i = 0; i < w * h * 0.5; i++) {
      const v = g();
      ctx.fillStyle = v < 0.5 ? `rgba(20,20,22,${0.3 * g()})` : `rgba(160,158,154,${0.3 * g()})`;
      ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1, 1);
    }
  }

  function graffitiTex(ctx, w, h) {
    ctx.fillStyle = '#b4bcc4';
    ctx.fillRect(0, 0, w, h);
    const g = rand(62);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(90,96,104,0.18)' : 'rgba(230,234,238,0.25)';
      ctx.fillRect(g() * w, g() * h, 2, 2);
    }
    ctx.strokeStyle = '#3a4250';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    const tag = (x, y, s) => {
      ctx.beginPath();
      ctx.moveTo(x, y + 60 * s);
      ctx.lineTo(x + 6 * s, y);
      ctx.quadraticCurveTo(x + 40 * s, y + 10 * s, x + 10 * s, y + 30 * s);
      ctx.lineTo(x + 30 * s, y + 60 * s);
      ctx.moveTo(x + 46 * s, y + 8 * s);
      ctx.quadraticCurveTo(x + 76 * s, y + 6 * s, x + 50 * s, y + 30 * s);
      ctx.quadraticCurveTo(x + 80 * s, y + 40 * s, x + 46 * s, y + 60 * s);
      ctx.moveTo(x + 96 * s, y + 4 * s);
      ctx.quadraticCurveTo(x + 76 * s, y + 30 * s, x + 96 * s, y + 60 * s);
      ctx.stroke();
    };
    tag(w * 0.2, h * 0.25, 1.4);
    tag(w * 0.62, h * 0.2, 1.5);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(w * 0.9, h * 0.5, 22, 34, 0, 0, PI * 2);
    ctx.stroke();
  }

  function blockTex(ctx, w, h) {
    ctx.fillStyle = '#d8d8dc';
    ctx.fillRect(0, 0, w, h);
    for (let y = 4; y < h; y += 12) for (let x = 4; x < w; x += 10) {
      ctx.fillStyle = (x * 7 + y * 3) % 5 === 0 ? '#c8b896' : '#6a7480';
      ctx.fillRect(x, y, 5, 7);
    }
  }

  function snowTex(ctx, w, h) {
    ctx.fillStyle = '#dfe2e6';
    ctx.fillRect(0, 0, w, h);
    const g = rand(71);
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = g() < 0.6 ? 'rgba(150,156,166,0.35)' : 'rgba(255,255,255,0.6)';
      ctx.fillRect(g() * w, g() * h, 1 + g() * 3, 1);
    }
    ctx.strokeStyle = 'rgba(120,124,134,0.4)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(g() * w, 0);
      ctx.bezierCurveTo(g() * w, h * 0.3, g() * w, h * 0.6, g() * w, h);
      ctx.stroke();
    }
  }

  function glassTex(ctx, w, h) {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#5a6470');
    gr.addColorStop(1, '#14161a');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    const g = rand(83);
    ctx.strokeStyle = 'rgba(10,10,12,0.9)';
    for (let i = 0; i < 14; i++) {
      let x = g() * w, y = h;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 6; j++) {
        x += (g() - 0.5) * 30;
        y -= h * 0.15;
        ctx.lineTo(x, y);
        ctx.lineWidth = Math.max(1, 3 - j * 0.4);
      }
      ctx.stroke();
    }
  }

  function hoodTex(ctx, w, h) {
    const base = ctx.createLinearGradient(0, h, 0, 0);
    base.addColorStop(0, '#5a6678');
    base.addColorStop(0.35, '#262c36');
    base.addColorStop(1, '#08090c');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const g = rand(91);
    ctx.fillStyle = 'rgba(150,160,176,0.55)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.75);
    ctx.lineTo(w * 0.45, h * 0.55);
    ctx.lineTo(w * 0.5, h * 0.62);
    ctx.lineTo(0, h * 0.9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,12,16,0.55)';
    for (let i = 0; i < 12; i++) {
      let x = w * (0.35 + g() * 0.65), y = h;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 6; j++) {
        x += (g() - 0.5) * 40;
        y -= h * (0.05 + g() * 0.08);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(120,128,140,0.5)';
    for (let i = 0; i < 10; i++) {
      let x = w * (0.3 + g() * 0.7), y = h * (0.2 + g() * 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 5; j++) {
        x += (g() - 0.3) * 40;
        y += (g() - 0.2) * 30;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const sh = ctx.createRadialGradient(w * 0.25, h * 0.15, 4, w * 0.25, h * 0.15, w * 0.5);
    sh.addColorStop(0, 'rgba(120,130,150,0.55)');
    sh.addColorStop(1, 'rgba(120,130,150,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(0, 0, w, h);
  }

  function badgeTex(ctx, w, h) {
    ctx.fillStyle = '#101012';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c8ccd2';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.46, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1e';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.4, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8eaee';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.27, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a78c8';
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2 - w * 0.27);
    ctx.lineTo(w / 2 + w * 0.1, h / 2);
    ctx.lineTo(w / 2, h / 2 + w * 0.27);
    ctx.lineTo(w / 2 - w * 0.1, h / 2);
    ctx.fill();
  }

  function buildCow(b, coat, patch, scale) {
    const s = scale;
    b.push(M4.scale(s, s, s));
    b.at(0, 0.95, 0, h => h.ellipsoid(0.86, 0.42, 0.38, 14, 8, coat));
    b.at(-0.05, 0.78, 0.0, h => h.ellipsoid(0.52, 0.2, 0.3, 10, 5, patch));
    b.at(-0.55, 0.72, 0, h => h.ellipsoid(0.16, 0.12, 0.16, 8, 4, 0xe0b0a8));
    [[-0.6, 0.15], [-0.6, -0.15], [0.55, 0.15], [0.55, -0.15]].forEach(([x, z]) => {
      K.tube(b, [[x, 0.8, z * 1.2], [x + 0.02, 0.42, z * 1.2], [x, 0.05, z * 1.2]], [0.1, 0.07, 0.055], 6, coat);
      b.at(x, 0.03, z, h => h.box(0.09, 0.06, 0.1, 0x2a2420));
    });
    K.tube(b, [[0.6, 1.02, 0], [0.86, 0.75, 0], [0.98, 0.45, 0]], [0.26, 0.2, 0.15], 10, coat);
    b.push(M4.translate(1.02, 0.28, 0), M4.rotZ(-0.35));
    b.ellipsoid(0.13, 0.26, 0.12, 10, 6, coat);
    b.at(0, -0.22, 0.0, h => h.ellipsoid(0.09, 0.08, 0.08, 7, 4, 0x3a2e2a));
    [-1, 1].forEach(z => b.at(0.02, 0.16, z * 0.12, h => h.ellipsoid(0.04, 0.09, 0.025, 6, 3, coat)));
    [-1, 1].forEach(z => b.at(-0.04, 0.2, z * 0.07, h => h.prism(5, 0.015, 0.015, 0, 0.005, 0.005, 0.07, 0xd8ccb0)));
    b.pop();
    K.tube(b, [[-0.78, 0.95, 0], [-0.86, 0.6, 0.02], [-0.85, 0.35, 0.04]], [0.03, 0.025, 0.04], 5, coat);
    b.pop();
  }

  function buildTree(b, x, z, rad, hgt, col) {
    b.at(x, 0, z, h => h.prism(6, 0.15, 0.15, 0, 0.1, 0.1, hgt * 0.5, 0x4a3a2a));
    const g = rand(Math.floor(x * 13 + z * 7 + 99));
    for (let i = 0; i < 5; i++) b.at(x + (g() - 0.5) * rad, hgt * (0.55 + g() * 0.35), z + (g() - 0.5) * rad * 0.6, h => h.ellipsoid(rad * (0.5 + g() * 0.4), rad * (0.45 + g() * 0.3), rad * 0.5, 8, 5, shade(col, 0.85 + g() * 0.3)));
  }

  function buildHouse(b, x, z, w, d, wallH, roofH, wallCol, slate) {
    b.at(x, 0, z, h => h.box(w, wallH, d, wallCol, { base: true }));
    const y0 = wallH, y1 = wallH + roofH;
    const L = [x - w / 2 - 0.3, y0, z + d / 2 + 0.3], R = [x + w / 2 + 0.3, y0, z + d / 2 + 0.3];
    const Lb = [x - w / 2 - 0.3, y0, z - d / 2 - 0.3], Rb = [x + w / 2 + 0.3, y0, z - d / 2 - 0.3];
    const T = [x - w / 2 - 0.3, y1, z], Tr = [x + w / 2 + 0.3, y1, z];
    b.quad(L, R, Tr, T, slate ? 0xffffff : 0x6a6c70, [[0, 0], [w / 2, 0], [w / 2, 1.5], [0, 1.5]]);
    b.quad(Rb, Lb, T, Tr, slate ? 0xffffff : 0x6a6c70, [[0, 0], [w / 2, 0], [w / 2, 1.5], [0, 1.5]]);
    b.tri([x - w / 2, y0, z + d / 2], [x - w / 2, y1 - 0.2, z], [x - w / 2, y0, z - d / 2], wallCol);
    b.tri([x + w / 2, y0, z - d / 2], [x + w / 2, y1 - 0.2, z], [x + w / 2, y0, z + d / 2], wallCol);
  }

  function wire(b, a, c, sag, wd) {
    const N = 12;
    for (let i = 0; i < N; i++) {
      const p = (k) => [lerp(a[0], c[0], k), lerp(a[1], c[1], k) - sag * 4 * k * (1 - k), lerp(a[2], c[2], k)];
      const p0 = p(i / N), p1 = p((i + 1) / N);
      b.quad([p0[0], p0[1], p0[2]], [p1[0], p1[1], p1[2]], [p1[0], p1[1] + wd, p1[2]], [p0[0], p0[1] + wd, p0[2]], [0.18, 0.18, 0.2, 1]);
    }
  }

  function buildVillage(r) {
    const tex = {
      grass: r.texture(256, grassTex),
      tuft: r.texture(128, tuftTex, { height: 64 }),
      plank: r.texture(128, plankTex),
      slate: r.texture(64, slateTex),
      metal: r.texture(64, metalTex)
    };
    const ground = mesh(r, b => flatY(b, -60, -80, 60, 6, 0, 0xffffff, [40, 30]));
    const fence = mesh(r, b => {
      wallZ(b, -40, 8.5, 0, 2.1, -25, 0xffffff, [24, 1]);
      for (let x = -38; x < 8; x += 2.6) b.at(x, 1.05, -24.9, h => h.box(0.12, 2.2, 0.12, 0x3a3430));
    });
    const metal = mesh(r, b => {
      wallZ(b, 8.5, 26, 0, 2.5, -24.5, 0xffffff, [6, 1]);
    });
    const houses = mesh(r, b => {
      buildHouse(b, 1.5, -33, 7, 7, 2.8, 2.6, 0x8a8478, true);
      buildHouse(b, -4.5, -37, 6, 6, 2.6, 1.8, 0x7a6e60, true);
      buildHouse(b, -17, -36, 8, 6, 2.6, 1.6, 0x6a5c50, true);
    });
    const plain = mesh(r, b => {
      b.at(15.5, 0, -29, h => h.box(3.4, 7.2, 3.4, 0x5a5650, { base: true }));
      b.at(15.5, 0, -27.25, h => h.box(3.2, 3.4, 0.08, 0xd8d6d0, { base: true }));
      b.push(M4.translate(15.5, 7.2, -29));
      b.prism(4, 2.6, 2.6, 0, 0.1, 0.1, 1.4, 0x6a6c70, { phase: PI / 4 });
      b.pop();
      b.at(-1.3, 0, -27, h => h.prism(6, 0.09, 0.09, 0, 0.07, 0.07, 9.5, 0x6a645c));
      b.at(13.2, 0, -26, h => h.prism(6, 0.09, 0.09, 0, 0.07, 0.07, 9, 0x6a645c));
      buildTree(b, -18, -32, 3.4, 6, 0x4e6a32);
      buildTree(b, -9.5, -30, 2.6, 5.5, 0x52703a);
      buildTree(b, 6.5, -31, 3.0, 6.4, 0x4a6a30);
      buildTree(b, 10.5, -33, 3.6, 7.2, 0x52743a);
      buildTree(b, -26, -34, 3.2, 5.5, 0x4a6232);
      wire(b, [-30, 10.2, -12], [30, 8.2, -30], 0.6, 0.035);
      wire(b, [-30, 9.0, -14], [30, 7.6, -30], 0.5, 0.035);
      wire(b, [-30, 12.5, -8], [30, 10.4, -26], 0.7, 0.03);
      skyCard(b, 120, -2, 50, -70, [0.86, 0.87, 0.88], [0.92, 0.92, 0.9]);
    });
    const cows = mesh(r, b => {
      b.push(M4.translate(-0.95, 0, -2.6), M4.rotY(0.25));
      buildCow(b, 0x3a2620, 0xe8e2d8, 0.62);
      b.pop();
      b.push(M4.translate(-3.6, 0, -15), M4.rotY(-0.05));
      buildCow(b, 0x1a1816, 0xe8e6e0, 0.85);
      b.pop();
    });
    const tufts = mesh(r, b => {
      const g = rand(5);
      for (let i = 0; i < 70; i++) {
        const x = -4 + g() * 8, z = -0.6 - g() * 9;
        const w = 0.5 + g() * 0.6, hh = 0.18 + g() * 0.16;
        const a = g() * PI;
        b.quad([x - C(a) * w / 2, 0, z - S(a) * w / 2], [x + C(a) * w / 2, 0, z + S(a) * w / 2], [x + C(a) * w / 2, hh, z + S(a) * w / 2], [x - C(a) * w / 2, hh, z - S(a) * w / 2], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      }
    });
    return {
      env: {
        sunDir: [0.2, -0.8, -0.4],
        sunColor: [0.18, 0.18, 0.17],
        ambTop: [0.92, 0.93, 0.95],
        ambBottom: [0.58, 0.6, 0.56],
        fogColor: [0.84, 0.85, 0.86],
        fogNear: 20,
        fogFar: 120
      },
      camera: { eye: [0, 1.5, 0], at: [0, 1.5 - 5 * Math.tan(8 * PI / 180), -5], fov: 46 },
      grade: [1.0, 1.0, 0.98, 0.06],
      vlad: { outfit: 'sweater', face: 'smile', p: [0.35, 1.0, -1.7], fwd: [-0.15, 0, 1], gL: 'pocket', gR: 'pocket', hL: [0.3, -0.22, 0.14], hR: [-0.3, -0.22, 0.14], eL: [1, 0.2, -0.5], eR: [-1, 0.2, -0.5], fL: [0.15, -0.95, 0.02], fR: [-0.15, -0.95, 0.02] },
      draw(r2) {
        r2.draw(ground, null, { texture: tex.grass });
        r2.draw(fence, null, { texture: tex.plank });
        r2.draw(metal, null, { texture: tex.metal });
        r2.draw(houses, null, { texture: tex.slate });
        r2.draw(plain);
        r2.draw(cows);
        r2.draw(tufts, null, { texture: tex.tuft });
      }
    };
  }

  function buildWall(r) {
    const tex = { paper: r.texture(256, wallpaperTex), poster: r.texture(128, posterTex, { height: 160, clamp: true }) };
    const wall = mesh(r, b => {
      wallZ(b, -4, 4, 0, 3, -0.42, 0xffffff, [5, 2]);
      flatY(b, -4, -0.42, 4, 3, 0, 0x7a6a58);
    });
    const poster = mesh(r, b => {
      b.quad([-1.46, 1.66, -0.405], [-0.91, 1.66, -0.405], [-0.91, 2.36, -0.405], [-1.46, 2.36, -0.405], 0xffffff);
    });
    return {
      env: {
        sunDir: [0.15, -0.2, -1],
        sunColor: [0.55, 0.53, 0.5],
        ambTop: [0.62, 0.6, 0.58],
        ambBottom: [0.5, 0.48, 0.46],
        fogColor: [0.5, 0.48, 0.46],
        fogNear: 30,
        fogFar: 60,
        points: [{ pos: [-0.1, 1.3, 1.2], color: [0.5, 0.48, 0.45] }]
      },
      camera: { eye: [-0.27, 1.2, 1.12], at: [-0.27, 1.372, 0.12], fov: 40 },
      grade: [1.02, 1.0, 0.97, 0.04],
      vlad: { outfit: 'hoodie', face: 'plain', glasses: true, p: [0, 1.0, 0.0], fwd: [-0.05, 0, 1], nk: [-0.12, 0, 0], gL: 'open', gR: 'open', hL: [0.33, -0.5, 0.0], hR: [-0.33, -0.5, 0.0], eL: [1, 0, -0.5], eR: [-1, 0, -0.5] },
      draw(r2) {
        r2.draw(wall, null, { texture: tex.paper });
        r2.draw(poster, null, { texture: tex.poster });
      }
    };
  }

  function buildRoad(r) {
    const tex = {
      asphalt: r.texture(128, asphaltTex),
      graffiti: r.texture(256, graffitiTex, { height: 128 }),
      block: r.texture(64, blockTex),
      grass: r.texture(256, grassTex)
    };
    const road = mesh(r, b => {
      flatY(b, -4.2, -70, 6, 8, 0, 0xffffff, [10, 78]);
      for (let z = -60; z < -6; z += 4) b.quad([0.55, 0.005, z], [0.65, 0.005, z], [0.75, 0.005, z - 1.6], [0.65, 0.005, z - 1.6], 0xd8d8d0);
    });
    const wallM = mesh(r, b => {
      const pts = [[3.6, 6], [3.6, -10], [3.4, -30], [2.6, -60]];
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
        const h0 = 1.6 + Math.max(0, z0) * 0.25, h1 = 1.6 + Math.max(0, z1) * 0.25;
        b.quad([x0, 0, z0], [x1, 0, z1], [x1, h1, z1], [x0, h0, z0], 0xffffff, [[0, 0], [(z0 - z1) / 6, 0], [(z0 - z1) / 6, 1], [0, 1]]);
      }
    });
    const rail = mesh(r, b => {
      const pts = [[3.62, 6], [3.62, -10], [3.42, -30], [2.62, -60]];
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
        const h0 = 1.6 + Math.max(0, z0) * 0.25 + 0.75, h1 = 1.6 + Math.max(0, z1) * 0.25 + 0.75;
        b.quad([x0, h0, z0], [x1, h1, z1], [x1, h1 + 0.05, z1], [x0, h0 + 0.05, z0], 0x6a6e74);
      }
    });
    const side = mesh(r, b => {
      b.quad([-4.2, 0, 8], [-4.2, 0, -70], [-9, 1.6, -70], [-9, 1.6, 8], 0xffffff, [[0, 0], [30, 0], [30, 2], [0, 2]]);
      flatY(b, -40, -90, -9, 8, 1.6, 0xffffff, [12, 30]);
    });
    const plain = mesh(r, b => {
      b.at(-4.25, 0.07, -30, h => h.box(0.16, 0.14, 76, 0x8a8a88));
      b.at(-6.8, 1.0, -26, h => h.box(3.5, 1.2, 40, 0x2e4a24));
      [[-30, -75, 18, 26], [-10, -80, 14, 22], [8, -85, 10, 40], [-48, -70, 14, 14]].forEach(([x, z, w, hh]) => b.at(x, 0, z, h => h.box(w, hh, 8, 0xffffff, { base: true, uvScale: 0.25 })));
      b.at(-14, 1.6, -42, h => h.box(26, 1.6, 0.3, 0xa84a2a, { base: true }));
      b.at(-20, 1.6, -48, h => h.box(10, 5, 6, 0xa0583a, { base: true }));
      [[-4.6, -22], [-4.6, -40], [-4.6, -58]].forEach(([x, z]) => {
        b.at(x, 0, z, h => h.prism(6, 0.07, 0.07, 0, 0.05, 0.05, 8, 0x5a5c60));
        b.at(x + 0.6, 8, z, h => h.box(1.2, 0.08, 0.2, 0x5a5c60));
      });
      b.at(2.4, 0, -34, h => h.prism(6, 0.05, 0.05, 0, 0.05, 0.05, 3.2, 0x5a5c60));
      b.at(2.4, 3.2, -34, h => h.box(0.6, 0.7, 0.05, 0x3a3e46));
      b.at(2.4, 2.4, -34, h => h.disc(0.3, 12, 0x3a3e46, 0));
      b.at(2.6, 0, -16, h => h.box(0.3, 1.2, 0.3, 0xd8d8d8, { base: true }));
    });
    const sky = mesh(r, b => skyCard(b, 160, -2, 70, -95, [0.74, 0.74, 0.8], [0.86, 0.82, 0.82]));
    return {
      env: {
        sunDir: [-0.3, -0.5, -0.8],
        sunColor: [0.16, 0.15, 0.16],
        ambTop: [0.66, 0.66, 0.72],
        ambBottom: [0.42, 0.42, 0.44],
        fogColor: [0.66, 0.65, 0.7],
        fogNear: 25,
        fogFar: 140
      },
      camera: { eye: [0.1, 1.6, 1.42], at: [0.1, 1.6 - 4 * Math.tan(20 * PI / 180), -2.58], fov: 55 },
      grade: [1.0, 1.0, 1.04, 0.1],
      vlad: { outfit: 'leather', face: 'plain', p: [0, 1.0, 0], fwd: [0, 0, 1], gL: 'pocket', gR: 'fist', hL: [0.28, -0.42, 0.12], hR: [-0.3, -0.52, 0.05], eL: [1, 0, -0.4], eR: [-1, 0, -0.3], fL: [0.13, -0.95, 0.12], fR: [-0.16, -0.95, -0.1] },
      draw(r2) {
        r2.draw(road, null, { texture: tex.asphalt });
        r2.draw(wallM, null, { texture: tex.graffiti });
        r2.draw(rail);
        r2.draw(side, null, { texture: tex.grass });
        r2.draw(plain, null, { texture: tex.block });
        r2.draw(sky);
      }
    };
  }

  function buildCar(b, part) {
    const paint = 0x0a0b0e;
    const W = 1.84;
    const prof = [[-2.4, 0.3, 0.92], [-2.3, 0.3, 0.98], [-1.6, 0.3, 1.0], [-1.0, 0.3, 1.0], [1.3, 0.3, 0.9], [2.3, 0.3, 0.72], [2.42, 0.32, 0.55]];
    const glassY0 = 0.9, glassY1 = 1.44;
    if (part === 'top') {
      for (let i = 0; i < prof.length - 1; i++) {
        const [z0, , y01] = prof[i], [z1, , y11] = prof[i + 1];
        const v0 = Math.max(0, (z0 - 1.3) / 1.12), v1 = Math.max(0, (z1 - 1.3) / 1.12);
        b.quad([-W / 2, y01, z0], [W / 2, y01, z0], [W / 2, y11, z1], [-W / 2, y11, z1], 0xffffff, [[0, v0], [1, v0], [1, v1], [0, v1]]);
      }
      return;
    }
    if (part === 'glass') {
      b.quad([-W / 2 + 0.08, glassY0, 1.3], [W / 2 - 0.08, glassY0, 1.3], [W / 2 - 0.16, glassY1, 0.35], [-W / 2 + 0.16, glassY1, 0.35], [0.7, 0.72, 0.76, 0.3]);
      b.push(M4.translate(-W / 2, 0.3, 1.0), M4.rotY(1.25));
      b.quad([0, 0.62, -0.05], [0, 0.62, -1.1], [0, 1.1, -0.82], [0, 1.1, -0.15], [0.9, 0.95, 0.95, 0.35]);
      b.pop();
      return;
    }
    for (let i = 0; i < prof.length - 1; i++) {
      const [z0, y00, y01] = prof[i], [z1, y10, y11] = prof[i + 1];
      [-1, 1].forEach(s => {
        const x = s * W / 2;
        const q = [[x, y00, z0], [x, y10, z1], [x, y11, z1], [x, y01, z0]];
        if (s > 0) b.quad(q[0], q[1], q[2], q[3], paint); else b.quad(q[1], q[0], q[3], q[2], paint);
      });
    }
    b.quad([-W / 2, 0.3, 2.42], [W / 2, 0.3, 2.42], [W / 2, 0.55, 2.42], [-W / 2, 0.55, 2.42], paint);
    b.quad([-W / 2 + 0.16, glassY1, 0.35], [W / 2 - 0.16, glassY1, 0.35], [W / 2 - 0.16, glassY1, -1.2], [-W / 2 + 0.16, glassY1, -1.2], paint);
    b.quad([-W / 2 + 0.16, glassY1, -1.2], [W / 2 - 0.16, glassY1, -1.2], [W / 2 - 0.08, 1.0, -1.9], [-W / 2 + 0.08, 1.0, -1.9], [0.1, 0.1, 0.12, 0.2]);
    [-1, 1].forEach(s => {
      const x = s * (W / 2 - 0.02);
      const q = [[x, glassY0, 1.3], [x, glassY0, -1.9], [x, 1.0, -1.9], [s * (W / 2 - 0.16), glassY1, -1.2], [s * (W / 2 - 0.16), glassY1, 0.35]];
      b.tri(q[0], q[1], q[4], [0.12, 0.13, 0.15, 0.2]);
      b.tri(q[1], q[3], q[4], [0.12, 0.13, 0.15, 0.2]);
      b.tri(q[1], q[2], q[3], [0.12, 0.13, 0.15, 0.2]);
    });
    [-1.55, 1.5].forEach(z => [-1, 1].forEach(s => b.push(M4.translate(s * 0.86, 0.34, z), M4.rotZ(PI / 2)).prism(14, 0.34, 0.34, -0.12, 0.34, 0.34, 0.12, 0x101012, { capBottom: true }).pop()));
    b.at(0, 0.33, 2.43, h => h.box(1.5, 0.2, 0.04, 0x16161a));
    b.push(M4.translate(-W / 2, 0.3, 1.0), M4.rotY(1.25));
    b.quad([0, 0, 0], [0, 0, -1.15], [0, 0.62, -1.15], [0, 0.62, 0], paint);
    b.quad([0, 0, -1.15], [0, 0, 0], [0, 0.62, 0], [0, 0.62, -1.15], 0x1a1a1e);
    b.quad([0.002, 0.62, -0.05], [0.002, 1.1, -0.15], [0.002, 1.12, -0.13], [0.002, 0.62, -0.03], 0x8a8c90);
    b.quad([0.002, 1.1, -0.15], [0.002, 1.1, -0.82], [0.002, 1.12, -0.84], [0.002, 1.12, -0.13], 0x8a8c90);
    b.pop();
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.64, 0.56, 2.34), M4.rotY(s * 0.4), M4.rotX(-0.3));
      b.box(0.5, 0.17, 0.05, [0.2, 0.21, 0.24, 0.2]);
      [-0.11, 0.11].forEach(x => {
        const N = 16;
        for (let i = 0; i < N; i++) {
          const a0 = (i / N) * PI * 2, a1 = ((i + 1) / N) * PI * 2;
          const p = (a, r) => [x + S(a) * r, C(a) * r, 0.03];
          b.quad(p(a0, 0.065), p(a1, 0.065), p(a1, 0.085), p(a0, 0.085), [1.0, 0.94, 0.7, 1]);
        }
      });
      b.pop();
    });
    [-1, 1].forEach(s => {
      const N = 10;
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * PI * 2, a1 = ((i + 1) / N) * PI * 2;
        const p = (a, r) => [s * 0.17 + S(a) * r * 1.1, 0.48 + C(a) * r * 0.55, 2.45];
        b.quad(p(a0, 0.12), p(a1, 0.12), p(a1, 0.14), p(a0, 0.14), [0.78, 0.8, 0.84, 0.4]);
        b.tri([s * 0.17, 0.48, 2.44], p(a0, 0.12), p(a1, 0.12), 0x060608);
      }
    });
  }

  function buildLot(r) {
    const tex = {
      snow: r.texture(256, snowTex),
      glass: r.texture(128, glassTex),
      hood: r.texture(128, hoodTex),
      badge: r.texture(64, badgeTex),
      block: r.texture(64, blockTex)
    };
    const ground = mesh(r, b => flatY(b, -30, -60, 30, 10, 0, 0xffffff, [12, 28]));
    const body = mesh(r, b => buildCar(b, 'body'));
    const top = mesh(r, b => buildCar(b, 'top'));
    const glass = mesh(r, b => buildCar(b, 'glass'));
    const badge = mesh(r, b => b.quad([-0.06, 0.57, 2.425], [0.06, 0.57, 2.425], [0.06, 0.68, 2.39], [-0.06, 0.68, 2.39], 0xffffff));
    const plain = mesh(r, b => {
      [[-4.5, -9, 0x2a2c30], [-1.0, -12, 0x8a8e94], [3.2, -11, 0x3a3e46], [6.5, -9.5, 0x7a7e84]].forEach(([x, z, col]) => {
        b.at(x, 0.6, z, h => h.box(1.8, 0.8, 4.4, col));
        b.at(x, 1.25, z - 0.3, h => h.box(1.6, 0.6, 2.2, shade(col, 0.6)));
      });
      b.at(1.5, 0, -16, h => h.box(2.2, 2.6, 5.6, 0xe8e8ea, { base: true }));
      b.at(1.5, 1.7, -13.15, h => h.box(1.2, 0.5, 0.05, 0xb04a2a));
      b.at(-2, 0, -26, h => h.box(22, 9, 6, 0xffffff, { base: true, uvScale: 0.25 }));
      [[-9, -20], [9, -22], [12, -18]].forEach(([x, z]) => {
        K.tube(b, [[x, 0, z], [x, 3, z], [x + 0.5, 6, z]], [0.15, 0.1, 0.05], 5, 0x3a322c);
        K.tube(b, [[x, 3, z], [x - 1.5, 5, z]], [0.06, 0.03], 4, 0x3a322c);
        K.tube(b, [[x, 4, z], [x + 1.6, 6.5, z]], [0.05, 0.02], 4, 0x3a322c);
      });
      skyCard(b, 100, -2, 50, -60, [0.82, 0.86, 0.9], [0.9, 0.9, 0.9]);
    });
    return {
      env: {
        sunDir: [0.3, -0.6, -0.5],
        sunColor: [0.2, 0.2, 0.22],
        ambTop: [0.86, 0.88, 0.92],
        ambBottom: [0.6, 0.62, 0.66],
        fogColor: [0.84, 0.86, 0.9],
        fogNear: 14,
        fogFar: 70
      },
      camera: { eye: [0.15, 1.25, 3.63], at: [-0.17, 1.06, 2.7], fov: 42 },
      grade: [0.98, 1.0, 1.04, 0.12],
      vlad: { outfit: 'winter', face: 'beard', beanie: true, scale: 1.04, p: [-1.3, 1.0, 0.5], fwd: [0.5, 0, 1], gL: 'grab', gR: 'grab', hLw: [-0.86, 1.3, 0.4], hRw: [-1.62, 1.3, 0.8], eL: [1, -0.6, -0.2], eR: [-1, -0.6, 0.2] },
      draw(r2) {
        r2.draw(ground, null, { texture: tex.snow });
        r2.draw(plain, null, { texture: tex.block });
        r2.draw(body);
        r2.draw(top, null, { texture: tex.hood });
        r2.draw(glass, null, { texture: tex.glass });
        r2.draw(badge, null, { texture: tex.badge });
      }
    };
  }

  function build(r) {
    return { village: buildVillage(r), wall: buildWall(r), road: buildRoad(r), car: buildLot(r) };
  }

  window.KartSets = { build };
})();
