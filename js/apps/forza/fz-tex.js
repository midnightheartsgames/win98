(function (F) {
  'use strict';

  const cache = new Map();
  const flags = {};

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function noiseFill(ctx, w, h, base, amp, seed, scale = 1) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const [r, g, b] = base;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = (F.hash2(x, y, seed) - 0.5) * amp + (F.noise2(x / (6 * scale), y / (6 * scale), seed + 3) - 0.5) * amp * 1.4;
        const i = (y * w + x) * 4;
        d[i] = F.clamp(r + n, 0, 255); d[i + 1] = F.clamp(g + n, 0, 255); d[i + 2] = F.clamp(b + n, 0, 255); d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function tileNoise(ctx, w, h, base, amp, seed, cell) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const fx = x / cell, fy = y / cell;
        const n = periodicNoise(fx, fy, w / cell, h / cell, seed) - 0.5;
        const g = (F.hash2(x, y, seed + 9) - 0.5) * amp * 0.5;
        const i = (y * w + x) * 4;
        for (let k = 0; k < 3; k++) d[i + k] = F.clamp(base[k] + n * amp + g, 0, 255);
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function periodicNoise(x, y, px, py, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const h = (a, b) => F.hash2(((a % px) + px) % px, ((b % py) + py) % py, seed);
    return F.lerp(F.lerp(h(xi, yi), h(xi + 1, yi), u), F.lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
  }

  const P = {};

  P.white = () => { const c = canvas(4, 4); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 4, 4); return c; };

  P.ground = () => {
    const c = canvas(128, 128), x = c.getContext('2d');
    tileNoise(x, 128, 128, [200, 200, 200], 70, 5, 16);
    const img = x.getImageData(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      const px = Math.floor(F.hash2(i, 1, 77) * 128), py = Math.floor(F.hash2(i, 2, 77) * 128);
      const k = (py * 128 + px) * 4;
      const v = F.hash2(i, 3, 77) < 0.5 ? 150 : 235;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = v;
    }
    x.putImageData(img, 0, 0);
    return c;
  };

  function asphaltBase(x, w, h, seed, base = [92, 92, 96]) {
    tileNoise(x, w, h, base, 26, seed, 8);
    const img = x.getImageData(0, 0, w, h);
    for (let i = 0; i < w * h / 12; i++) {
      const px = Math.floor(F.hash2(i, 5, seed) * w), py = Math.floor(F.hash2(i, 6, seed) * h);
      const k = (py * w + px) * 4, v = F.hash2(i, 7, seed) < 0.5 ? -22 : 20;
      for (let j = 0; j < 3; j++) img.data[k + j] = F.clamp(img.data[k + j] + v, 0, 255);
    }
    x.putImageData(img, 0, 0);
  }

  function dashes(x, cx, w, h, col, len, gap, lw) {
    x.fillStyle = col;
    for (let y = 0; y < h; y += len + gap) x.fillRect(cx - lw / 2, y, lw, len);
  }

  P.road2 = () => {
    const c = canvas(64, 256), x = c.getContext('2d');
    asphaltBase(x, 64, 256, 11);
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(22, 0, 7, 256); x.fillRect(38, 0, 7, 256);
    dashes(x, 32, 64, 256, '#e8e8e0', 72, 56, 2);
    x.fillStyle = '#d8d8d0'; x.fillRect(2, 0, 2, 256); x.fillRect(60, 0, 2, 256);
    return c;
  };
  P.road4 = () => {
    const c = canvas(128, 256), x = c.getContext('2d');
    asphaltBase(x, 128, 256, 12);
    x.fillStyle = 'rgba(0,0,0,0.12)';
    for (const cx0 of [16, 48, 80, 112]) x.fillRect(cx0 - 12, 0, 7, 256), x.fillRect(cx0 + 5, 0, 7, 256);
    x.fillStyle = '#e8e8e0'; x.fillRect(61, 0, 2, 256); x.fillRect(65, 0, 2, 256);
    dashes(x, 32, 128, 256, '#dcdcd4', 60, 68, 2);
    dashes(x, 96, 128, 256, '#dcdcd4', 60, 68, 2);
    x.fillStyle = '#d0d0c8'; x.fillRect(2, 0, 2, 256); x.fillRect(124, 0, 2, 256);
    return c;
  };
  P.lane = () => {
    const c = canvas(64, 128), x = c.getContext('2d');
    asphaltBase(x, 64, 128, 13, [100, 98, 96]);
    x.fillStyle = 'rgba(40,36,30,0.25)';
    for (let i = 0; i < 12; i++) x.fillRect(Math.floor(F.hash2(i, 1, 4) * 60), Math.floor(F.hash2(i, 2, 4) * 120), 3 + Math.floor(F.hash2(i, 3, 4) * 6), 2);
    x.fillStyle = 'rgba(120,130,80,0.5)'; x.fillRect(0, 0, 2, 128); x.fillRect(62, 0, 2, 128);
    return c;
  };
  P.asph = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    asphaltBase(x, 64, 64, 14);
    return c;
  };
  P.cobble = () => {
    const c = canvas(128, 128), x = c.getContext('2d');
    x.fillStyle = '#5a5650'; x.fillRect(0, 0, 128, 128);
    for (let row = 0; row < 16; row++) {
      const off = (row % 2) * 4;
      for (let col = -1; col < 17; col++) {
        const v = 110 + Math.floor(F.hash2(col, row, 3) * 50);
        const tint = F.hash2(col, row, 8) * 20;
        x.fillStyle = `rgb(${v + tint},${v},${v - tint * 0.5})`;
        x.fillRect(col * 8 + off + 1, row * 8 + 1, 6, 6);
        x.fillStyle = 'rgba(255,255,255,0.12)';
        x.fillRect(col * 8 + off + 1, row * 8 + 1, 6, 1);
      }
    }
    return c;
  };
  P.pave = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    tileNoise(x, 64, 64, [150, 146, 140], 22, 21, 8);
    x.strokeStyle = 'rgba(60,56,50,0.5)';
    for (let i = 0; i <= 64; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 64); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(64, i); x.stroke(); }
    return c;
  };
  P.curb = () => {
    const c = canvas(16, 16), x = c.getContext('2d');
    tileNoise(x, 16, 16, [176, 172, 164], 16, 22, 4);
    return c;
  };
  P.gravel = () => {
    const c = canvas(64, 128), x = c.getContext('2d');
    tileNoise(x, 64, 128, [138, 124, 100], 40, 31, 4);
    x.fillStyle = 'rgba(80,66,48,0.35)'; x.fillRect(14, 0, 10, 128); x.fillRect(40, 0, 10, 128);
    return c;
  };
  P.dirt = () => {
    const c = canvas(64, 128), x = c.getContext('2d');
    tileNoise(x, 64, 128, [112, 88, 60], 36, 32, 6);
    x.fillStyle = 'rgba(60,44,28,0.4)'; x.fillRect(14, 0, 9, 128); x.fillRect(41, 0, 9, 128);
    x.fillStyle = 'rgba(80,110,50,0.45)'; x.fillRect(0, 0, 5, 128); x.fillRect(59, 0, 5, 128); x.fillRect(28, 0, 8, 128);
    return c;
  };
  P.sandtrack = () => {
    const c = canvas(64, 128), x = c.getContext('2d');
    tileNoise(x, 64, 128, [214, 198, 156], 26, 33, 6);
    x.fillStyle = 'rgba(150,130,90,0.35)'; x.fillRect(12, 0, 10, 128); x.fillRect(42, 0, 10, 128);
    return c;
  };
  P.grasstrack = () => {
    const c = canvas(64, 128), x = c.getContext('2d');
    tileNoise(x, 64, 128, [98, 132, 60], 36, 34, 5);
    x.fillStyle = 'rgba(90,70,40,0.45)'; x.fillRect(12, 0, 10, 128); x.fillRect(42, 0, 10, 128);
    return c;
  };
  P.track = () => {
    const c = canvas(128, 128), x = c.getContext('2d');
    asphaltBase(x, 128, 128, 15, [70, 70, 74]);
    for (let y = 0; y < 128; y += 16) {
      x.fillStyle = (y / 16) % 2 ? '#d02020' : '#f0f0f0';
      x.fillRect(0, y, 8, 16); x.fillRect(120, y, 8, 16);
    }
    x.fillStyle = '#f0f0f0'; x.fillRect(9, 0, 2, 128); x.fillRect(117, 0, 2, 128);
    return c;
  };
  P.runway = () => {
    const c = canvas(128, 256), x = c.getContext('2d');
    asphaltBase(x, 128, 256, 16, [96, 96, 100]);
    dashes(x, 64, 128, 256, '#f0f0f0', 90, 38, 3);
    x.fillStyle = '#f0f0f0'; x.fillRect(3, 0, 3, 256); x.fillRect(122, 0, 3, 256);
    x.fillStyle = 'rgba(20,20,20,0.35)'; x.fillRect(40, 0, 14, 256); x.fillRect(74, 0, 14, 256);
    return c;
  };
  P.rail = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    tileNoise(x, 64, 64, [110, 100, 90], 36, 41, 3);
    for (let y = 2; y < 64; y += 10) { x.fillStyle = '#4a3a2a'; x.fillRect(6, y, 52, 5); }
    x.fillStyle = '#8a8c90'; x.fillRect(18, 0, 3, 64); x.fillRect(43, 0, 3, 64);
    x.fillStyle = '#c8ccd0'; x.fillRect(18, 0, 1, 64); x.fillRect(43, 0, 1, 64);
    return c;
  };
  P.concrete = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    tileNoise(x, 64, 64, [168, 164, 156], 24, 42, 8);
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 31, 64, 2);
    return c;
  };
  P.water = () => {
    const c = canvas(128, 128), x = c.getContext('2d');
    tileNoise(x, 128, 128, [60, 96, 120], 30, 43, 16);
    const img = x.getImageData(0, 0, 128, 128);
    for (let y = 0; y < 128; y++) {
      for (let px = 0; px < 128; px++) {
        const w = Math.sin((px + Math.sin(y * 0.2) * 6) * 0.3) * 0.5 + Math.sin(y * 0.49 + px * 0.1) * 0.5;
        const k = (y * 128 + px) * 4;
        for (let j = 0; j < 3; j++) img.data[k + j] = F.clamp(img.data[k + j] + w * 18, 0, 255);
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  };

  const FAC = {
    hansa1: { bay: 3.4, v2: 'rect' }, hansa2: { bay: 3.6, v2: 'arch' }, hansa3: { bay: 3.2, v2: 'pair' }, hansa4: { bay: 3.6, v2: 'pediment' },
    jugend1: { bay: 3.9, v2: 'mask' }, jugend2: { bay: 3.9, v2: 'balcony' }, jugend3: { bay: 3.7, v2: 'national' }, jugend4: { bay: 4, v2: 'majolica' },
    back: { bay: 3.4, v2: 'back' }, side: { bay: 4, v2: 'side' },
    wood1: { bay: 3.4, v2: 'wood' }, wood2: { bay: 3.2, v2: 'wood2' },
    villa1: { bay: 4, v2: 'villa' }, villa2: { bay: 4, v2: 'veranda' },
    brick5: { bay: 3.2, v2: 'brick' }, panel5: { bay: 3.2, v2: 'panel5' },
    panel9: { bay: 3, v2: 'loggia' }, panel9b: { bay: 3, v2: 'panel' }, panel16: { bay: 3, v2: 'tower' },
    factory1: { bay: 6, win: 'strip', wall: [150, 152, 150], frame: [176, 178, 176], glass: [70, 84, 92], ribs: true },
    factory2: { bay: 5, win: 'high', wall: [176, 164, 146], frame: [196, 190, 176], glass: [70, 84, 92] },
    stalin: { bay: 3.4, win: 'rect', wall: [226, 214, 186], frame: [244, 236, 214], glass: [48, 56, 66], orn: [200, 186, 150] },
    glass: { bay: 3, win: 'curtain', wall: [70, 96, 120], frame: [180, 190, 200], glass: [60, 90, 120] }
  };
  F.FAC = FAC;

  function facade2(key) {
    const kind = FAC[key].v2;
    const W = 128, H = 128;
    const c = canvas(W, H), x = c.getContext('2d');
    const plain = kind === 'side' || kind === 'back';
    tileNoise(x, W, H, kind === 'side' ? [214, 208, 198] : [236, 232, 224], kind === 'side' ? 26 : 12, key.length * 13 + 5, 16);
    const glassRects = [];
    const rgba = (r, g, b, a = 1) => `rgba(${r},${g},${b},${a})`;
    const trim = rgba(252, 250, 244), shade = rgba(0, 0, 0, 0.16), deep = rgba(0, 0, 0, 0.28);
    const pane = (wx, wy, ww, wh, arch) => {
      const g = x.createLinearGradient(wx, wy, wx + ww, wy + wh);
      g.addColorStop(0, '#5a6e80'); g.addColorStop(0.45, '#2c3a48'); g.addColorStop(1, '#1e2834');
      x.fillStyle = g;
      x.beginPath();
      if (arch) { x.moveTo(wx, wy + wh); x.lineTo(wx, wy + ww / 2); x.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); x.lineTo(wx + ww, wy + wh); }
      else x.rect(wx, wy, ww, wh);
      x.closePath(); x.fill();
      x.fillStyle = rgba(190, 215, 235, 0.28); x.fillRect(wx + 2, wy + (arch ? ww / 2 : 2), ww * 0.35, wh * 0.3);
      x.fillStyle = trim;
      x.fillRect(wx + ww / 2 - 1.5, wy + (arch ? 2 : 0), 3, wh - (arch ? 2 : 0));
      x.fillRect(wx, wy + wh * (arch ? 0.52 : 0.38), ww, 3);
      glassRects.push([wx, wy, ww, wh]);
    };
    const surround = (wx, wy, ww, wh, pad, arch) => {
      x.fillStyle = shade;
      x.fillRect(wx - pad + 2, wy - pad + 2, ww + pad * 2, wh + pad * 2);
      x.fillStyle = trim;
      x.beginPath();
      if (arch) { x.moveTo(wx - pad, wy + wh + pad); x.lineTo(wx - pad, wy + ww / 2); x.arc(wx + ww / 2, wy + ww / 2, ww / 2 + pad, Math.PI, 0); x.lineTo(wx + ww + pad, wy + wh + pad); }
      else x.rect(wx - pad, wy - pad, ww + pad * 2, wh + pad * 2);
      x.closePath(); x.fill();
      x.fillStyle = deep; x.fillRect(wx - 1, wy + (arch ? ww / 2 : -1), ww + 2, 3);
    };
    const sill = (wx, wy, ww) => { x.fillStyle = trim; x.fillRect(wx - 6, wy, ww + 12, 5); x.fillStyle = shade; x.fillRect(wx - 6, wy + 5, ww + 12, 3); };
    const band = (y, h, col) => { x.fillStyle = col || trim; x.fillRect(0, y, W, h); x.fillStyle = shade; x.fillRect(0, y + h, W, 2); };
    switch (kind) {
      case 'rect':
        band(116, 6);
        surround(40, 26, 48, 70, 6, false); pane(40, 26, 48, 70, false); sill(40, 102, 48);
        x.fillStyle = trim; x.fillRect(30, 12, 68, 6); x.fillStyle = shade; x.fillRect(30, 18, 68, 3);
        break;
      case 'arch':
        band(118, 5);
        surround(42, 22, 44, 74, 6, true); pane(42, 22, 44, 74, true); sill(42, 102, 44);
        x.fillStyle = trim; x.beginPath(); x.moveTo(58, 14); x.lineTo(70, 14); x.lineTo(67, 26); x.lineTo(61, 26); x.fill();
        x.fillStyle = shade; x.fillRect(0, 0, 8, H); x.fillRect(W - 8, 0, 8, H);
        break;
      case 'pair':
        band(114, 8, rgba(240, 236, 226));
        for (const ox of [18, 70]) { surround(ox, 34, 40, 60, 4, false); pane(ox, 34, 40, 60, false); sill(ox, 98, 40); }
        break;
      case 'pediment':
        band(116, 6);
        surround(42, 36, 44, 62, 5, false); pane(42, 36, 44, 62, false); sill(42, 102, 44);
        x.fillStyle = trim; x.beginPath(); x.moveTo(32, 28); x.lineTo(64, 10); x.lineTo(96, 28); x.closePath(); x.fill();
        x.fillStyle = shade; x.beginPath(); x.moveTo(40, 26); x.lineTo(64, 14); x.lineTo(88, 26); x.closePath(); x.fill();
        x.fillStyle = trim; x.fillRect(4, 0, 10, H); x.fillRect(W - 14, 0, 10, H);
        break;
      case 'mask':
        band(112, 10, rgba(232, 226, 212));
        for (const ox of [4, W - 16]) { x.fillStyle = trim; x.fillRect(ox, 0, 12, H); x.fillStyle = shade; x.fillRect(ox + 10, 0, 2, H); }
        surround(38, 30, 52, 72, 5, false); pane(38, 30, 52, 72, false); sill(38, 104, 52);
        x.fillStyle = trim; x.beginPath(); x.ellipse(64, 16, 16, 11, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = shade; x.beginPath(); x.arc(58, 14, 2.4, 0, Math.PI * 2); x.arc(70, 14, 2.4, 0, Math.PI * 2); x.fill();
        x.fillRect(60, 20, 8, 2);
        x.strokeStyle = trim; x.lineWidth = 3;
        x.beginPath(); x.moveTo(30, 22); x.bezierCurveTo(38, 4, 46, 18, 48, 16); x.moveTo(98, 22); x.bezierCurveTo(90, 4, 82, 18, 80, 16); x.stroke();
        break;
      case 'balcony':
        band(116, 6);
        surround(40, 22, 48, 80, 5, true); pane(40, 22, 48, 80, true);
        x.fillStyle = rgba(40, 40, 42); x.fillRect(30, 90, 68, 3); x.fillRect(30, 108, 68, 4);
        for (let k = 32; k < 98; k += 6) x.fillRect(k, 92, 2, 16);
        x.strokeStyle = rgba(40, 40, 42); x.lineWidth = 1.5;
        for (let k = 38; k < 94; k += 12) { x.beginPath(); x.arc(k + 3, 100, 4, 0, Math.PI * 2); x.stroke(); }
        break;
      case 'national':
        x.fillStyle = rgba(150, 130, 110, 0.35); x.fillRect(0, 104, W, 24);
        for (let k = 0; k < W; k += 16) { x.fillStyle = shade; x.fillRect(k, 104, 1, 24); }
        for (const ox of [20, 72]) { surround(ox, 26, 36, 72, 3, false); pane(ox, 26, 36, 72, false); }
        x.fillStyle = trim; x.fillRect(58, 18, 12, 88);
        x.fillStyle = rgba(150, 120, 96, 0.3); x.beginPath(); x.moveTo(64, 6); x.lineTo(74, 16); x.lineTo(64, 26); x.lineTo(54, 16); x.closePath(); x.fill();
        break;
      case 'majolica':
        band(114, 8);
        surround(40, 34, 48, 66, 5, true); pane(40, 34, 48, 66, true); sill(40, 102, 48);
        for (let k = 0; k < W; k += 16) {
          x.fillStyle = (k / 16) % 2 ? '#3a7aa8' : '#e8c04a'; x.fillRect(k, 6, 16, 14);
          x.fillStyle = '#f4f0e0'; x.beginPath(); x.arc(k + 8, 13, 3.5, 0, Math.PI * 2); x.fill();
        }
        break;
      case 'wood':
      case 'wood2': {
        const step = kind === 'wood' ? 8 : 10;
        for (let yy = 0; yy < H; yy += step) { x.fillStyle = rgba(0, 0, 0, 0.18); x.fillRect(0, yy + step - 2, W, 2); x.fillStyle = rgba(255, 255, 255, 0.08); x.fillRect(0, yy, W, 1); }
        x.fillStyle = trim; x.fillRect(0, 0, 5, H); x.fillRect(W - 5, 0, 5, H);
        x.fillStyle = trim; x.fillRect(34, 22, 60, 80);
        x.beginPath(); x.moveTo(28, 24); x.lineTo(64, kind === 'wood' ? 4 : 10); x.lineTo(100, 24); x.closePath(); x.fill();
        x.fillStyle = shade; x.fillRect(38, 26, 52, 70);
        pane(40, 28, 48, 66, false);
        x.fillStyle = trim; x.fillRect(30, 100, 68, 6);
        if (kind === 'wood2') { x.fillStyle = rgba(70, 90, 60, 0.9); x.fillRect(20, 28, 14, 66); x.fillRect(94, 28, 14, 66); x.fillStyle = shade; for (let yy = 32; yy < 92; yy += 6) { x.fillRect(22, yy, 10, 2); x.fillRect(96, yy, 10, 2); } }
        break;
      }
      case 'villa':
        band(116, 5);
        x.fillStyle = rgba(0, 0, 0, 0.05); for (let yy = 0; yy < 116; yy += 12) x.fillRect(0, yy, W, 1);
        surround(34, 28, 60, 70, 5, false); pane(34, 28, 60, 70, false);
        x.fillStyle = trim; for (const ox of [48, 64, 78]) x.fillRect(ox, 28, 2, 70);
        sill(34, 100, 60);
        x.fillStyle = trim; x.fillRect(26, 14, 76, 6);
        break;
      case 'veranda':
        x.fillStyle = trim; x.fillRect(0, 0, W, H);
        for (let k = 0; k < 4; k++) for (let r = 0; r < 3; r++) pane(6 + k * 30, 10 + r * 30, 26, 26, false);
        x.fillStyle = rgba(200, 190, 170); x.fillRect(0, 100, W, 28);
        x.fillStyle = shade; for (let k = 0; k < W; k += 10) x.fillRect(k, 100, 2, 28);
        break;
      case 'brick':
        x.fillStyle = rgba(170, 80, 60, 0.55); x.fillRect(0, 0, W, H);
        for (let yy = 0; yy < H; yy += 6) { x.fillStyle = rgba(230, 220, 205, 0.5); x.fillRect(0, yy, W, 1); for (let k = (yy / 6) % 2 ? 0 : 8; k < W; k += 16) x.fillRect(k, yy, 1, 6); }
        x.fillStyle = rgba(236, 230, 220); x.fillRect(22, 28, 84, 64);
        pane(26, 32, 76, 56, false);
        x.fillStyle = rgba(210, 204, 194); x.fillRect(20, 92, 88, 6);
        break;
      case 'panel5':
        x.fillStyle = rgba(0, 0, 0, 0.14); x.fillRect(0, H - 3, W, 3); x.fillRect(W - 3, 0, 3, H);
        x.fillStyle = shade; x.fillRect(24, 30, 80, 60);
        pane(26, 32, 76, 56, false);
        x.fillStyle = rgba(200, 196, 188); x.fillRect(22, 90, 84, 5);
        break;
      case 'panel':
        x.fillStyle = rgba(0, 0, 0, 0.16); x.fillRect(0, H - 3, W, 3); x.fillRect(W - 3, 0, 3, H); x.fillRect(W / 2 - 1, 0, 2, H);
        x.fillStyle = shade; x.fillRect(12, 30, 44, 58); x.fillRect(72, 30, 44, 58);
        pane(14, 32, 40, 54, false); pane(74, 32, 40, 54, false);
        break;
      case 'loggia':
        x.fillStyle = rgba(0, 0, 0, 0.14); x.fillRect(0, H - 3, W, 3); x.fillRect(W - 3, 0, 3, H);
        x.fillStyle = rgba(40, 40, 44, 0.55); x.fillRect(6, 18, 60, 96);
        pane(10, 22, 26, 60, false); pane(40, 22, 22, 44, false);
        x.fillStyle = rgba(214, 210, 200); x.fillRect(4, 76, 64, 38);
        x.fillStyle = rgba(0, 0, 0, 0.1); for (let k = 8; k < 66; k += 7) x.fillRect(k, 78, 2, 34);
        x.fillStyle = shade; x.fillRect(80, 32, 38, 52); pane(82, 34, 34, 48, false);
        break;
      case 'tower':
        x.fillStyle = rgba(0, 0, 0, 0.14); x.fillRect(0, H - 3, W, 3); x.fillRect(W - 3, 0, 3, H);
        for (const ox of [10, 70]) { x.fillStyle = shade; x.fillRect(ox, 26, 48, 64); pane(ox + 2, 28, 44, 58, false); }
        x.fillStyle = rgba(180, 60, 50, 0.35); x.fillRect(0, 96, W, 10);
        break;
      case 'back':
        band(120, 3, rgba(0, 0, 0, 0.08));
        x.fillStyle = shade; x.fillRect(44, 34, 42, 60);
        pane(46, 36, 38, 56, false);
        x.fillStyle = rgba(120, 110, 96, 0.18); x.fillRect(0, 70, W, 58);
        break;
      case 'side':
        for (let i = 0; i < 4; i++) {
          const px = F.hash2(i, 1, 71) * W, py = F.hash2(i, 2, 71) * H, s = 20 + F.hash2(i, 3, 71) * 30;
          x.fillStyle = F.hash2(i, 4, 71) < 0.4 ? rgba(150, 100, 80, 0.12) : rgba(90, 84, 76, 0.07);
          x.fillRect(px, py, s * 2.2, s * 1.4);
        }
        x.fillStyle = rgba(60, 56, 50, 0.1); x.fillRect(0, 0, W, 4);
        break;
    }
    const img = x.getImageData(0, 0, W, H);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
    if (!plain || kind === 'back') {
      for (const [mx, my, mw, mh] of glassRects) {
        for (let y = Math.max(0, Math.floor(my)); y < Math.min(H, my + mh); y++) {
          for (let k = Math.max(0, Math.floor(mx)); k < Math.min(W, mx + mw); k++) img.data[(y * W + k) * 4 + 3] = 254;
        }
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  const GFLOOR = (() => {
    const U = (x, y, w, o = {}) => Object.assign({ x, y, w }, o);
    const SIGNS = [
      ['KAFEJNĪCA', '#6a3018', '#f2d8a0', 1], ['APTIEKA', '#1a6a3a', '#ffffff'], ['SUVENĪRI', '#20306a', '#ffd84a'], ['PĀRTIKA', '#b81e1e', '#ffffff'],
      ['GRĀMATAS', '#1e3a78', '#f4f0e0'], ['BANKA', '#e6e2d4', '#12305a'], ['OPTIKA', '#101010', '#e8e8e8'], ['MAIZNĪCA', '#c89a3a', '#3a2010'],
      ['FRIZĒTAVA', '#7a1e5a', '#ffffff'], ['ZIEDI', '#2a7a3a', '#fff4d0'], ['APAVI', '#3a2a20', '#e8c88a'], ['PULKSTEŅI', '#1a1a1a', '#d8b860'],
      ['ANTIKVARIĀTS', '#4a3a2a', '#e8dcc0'], ['VALŪTAS MAIŅA', '#f2c81e', '#1a1a1a'], ['FOTO', '#d8261e', '#ffe060'], ['VĪNI', '#5a1020', '#f0d8a0'],
      ['DZINTARS', '#8a5a10', '#ffe8a0'], ['RESTORĀNS', '#2a2a2a', '#e8c070', 1], ['BĀRS', '#1e2a4a', '#ffcf40', 1], ['KROGS', '#4a2a14', '#f0d090', 1],
      ['PICĒRIJA', '#1e6a2a', '#ffffff', 1], ['KONDITOREJA', '#e8c8d0', '#7a2040', 1], ['SALDĒJUMS', '#3a8ac8', '#ffffff', 1], ['INTERNETA KAFEJNĪCA', '#101830', '#40e0ff', 1],
      ['LOMBARDS', '#2a2a2a', '#ffd040'], ['DĀVANAS', '#a01e2a', '#ffffff'], ['MODE', '#101010', '#f0f0f0'], ['AUDIO VIDEO', '#1a3a8a', '#ffffff'],
      ['MĒBELES', '#5a4030', '#f4e8d0'], ['SALONS', '#6a2a6a', '#f8e0f8'], ['PRESE', '#1e5a8a', '#ffffff'], ['ROTASLIETAS', '#20304a', '#e8d080'],
      ['TĒJA UN KAFIJA', '#3a2414', '#e8d0a0', 1], ['ALUS', '#d8a020', '#3a1a08', 1], ['SAIMNIECĪBAS PRECES', '#3a6a8a', '#ffffff'], ['TABAKA', '#5a1a14', '#f0e0c0']
    ];
    return {
      W: 1024, H: 512, M: 32, ROW: 128, SW: 160, SH: 32,
      hansa: {
        shop: U(0, 0, 112, { sign: [3.44, 3.86] }), shop2: U(112, 0, 112, { sign: [3.12, 3.54] }), cafe: U(224, 0, 112, { sign: [3.46, 3.88], awn: 3.22 }),
        door: U(336, 0, 72), win: U(408, 0, 64), gate: U(472, 0, 104), pier: U(576, 0, 32)
      },
      jugend: {
        shop: U(0, 128, 128, { sign: [3.3, 3.74] }), shop2: U(128, 128, 128, { sign: [3.36, 3.8] }), cafe: U(256, 128, 128, { sign: [3.46, 3.88], awn: 3.2 }),
        door: U(384, 128, 88), win: U(472, 128, 72), gate: U(544, 128, 120), pier: U(664, 128, 32)
      },
      awn: [[704, 128], [768, 128], [832, 128], [896, 128]],
      stone: [960, 128, 64, 64],
      dark: [976, 208, 16, 16],
      signs: SIGNS.map(([text, bg, fg, cafe], k) => ({ text, bg, fg, cafe: !!cafe, x: (k % 6) * 160, y: 256 + Math.floor(k / 6) * 32 }))
    };
  })();
  F.GFLOOR = GFLOOR;

  P.gfloor = () => {
    const G = GFLOOR, M = G.M, c = canvas(G.W, G.H), x = c.getContext('2d'), mc = canvas(G.W, G.H), m = mc.getContext('2d');
    tileNoise(x, G.W, G.H, [236, 232, 224], 12, 141, 16);
    m.fillStyle = '#000'; m.fillRect(0, 0, G.W, G.H);
    const trim = '#fbf9f2', shade = 'rgba(0,0,0,0.18)', stone = '#a49e94', iron = '#1c1e20';
    const unit = (style, u, paint) => {
      const X = v => u.x + v * M, Y = v => u.y + G.ROW - v * M, W = u.w / M;
      const path = (ctx, fn) => { ctx.beginPath(); fn(ctx); ctx.closePath(); };
      const box = (x0, y0, x1, y1) => ctx => ctx.rect(X(x0), Y(y1), (x1 - x0) * M, (y1 - y0) * M);
      const arch = (x0, x1, y0, ys, rise) => ctx => {
        ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x0), Y(ys));
        ctx.quadraticCurveTo(X((x0 + x1) / 2), Y(ys + rise * 2), X(x1), Y(ys));
        ctx.lineTo(X(x1), Y(y0));
      };
      const round = (x0, x1, y0, y1, r) => ctx => {
        ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x0), Y(y1 - r)); ctx.quadraticCurveTo(X(x0), Y(y1), X(x0 + r), Y(y1));
        ctx.lineTo(X(x1 - r), Y(y1)); ctx.quadraticCurveTo(X(x1), Y(y1), X(x1), Y(y1 - r)); ctx.lineTo(X(x1), Y(y0));
      };
      const fill = (fn, style2) => { path(x, fn); x.fillStyle = style2; x.fill(); path(m, fn); m.fillStyle = '#000'; m.fill(); };
      const framed = (fn, col) => { x.save(); x.translate(2, 2); fill(fn, shade); x.restore(); fill(fn, col); };
      const glassIn = fn => {
        path(x, fn);
        const b = { x0: u.x, y0: u.y, x1: u.x + u.w, y1: u.y + G.ROW };
        const g = x.createLinearGradient(b.x0, b.y0, b.x1, b.y1);
        g.addColorStop(0, '#5a6e80'); g.addColorStop(0.5, '#2c3a48'); g.addColorStop(1, '#1c2630');
        x.fillStyle = g; x.fill();
        path(m, fn); m.fillStyle = '#fff'; m.fill();
      };
      const pane = (x0, y0, x1, y1, col, cols = 1, rows = 1) => {
        glassIn(box(x0, y0, x1, y1));
        x.fillStyle = 'rgba(190,215,235,0.26)'; x.fillRect(X(x0) + 2, Y(y1) + 2, (x1 - x0) * M * 0.32, (y1 - y0) * M * 0.3);
        for (let k = 1; k < cols; k++) { const v = x0 + (x1 - x0) * k / cols; rect(v - 1 / M, y0, v + 1 / M, y1, col); }
        for (let k = 1; k < rows; k++) { const v = y0 + (y1 - y0) * k / rows; rect(x0, v - 1 / M, x1, v + 1 / M, col); }
      };
      const rect = (x0, y0, x1, y1, col) => {
        x.fillStyle = col; x.fillRect(X(x0), Y(y1), (x1 - x0) * M, (y1 - y0) * M);
        m.fillStyle = '#000'; m.fillRect(X(x0), Y(y1), (x1 - x0) * M, (y1 - y0) * M);
      };
      const panel = (x0, y0, x1, y1) => { rect(x0, y0, x1, y1, 'rgba(0,0,0,0.22)'); rect(x0, y1 - 0.04, x1, y1, 'rgba(255,255,255,0.12)'); };
      const door = (x0, y0, x1, y1, col, leaves, glassFrom) => {
        rect(x0, y0, x1, y1, col);
        const lw = (x1 - x0) / leaves;
        for (let k = 0; k < leaves; k++) {
          const a = x0 + k * lw + 0.08, b = x0 + (k + 1) * lw - 0.08;
          panel(a, y0 + 0.15, b, Math.min(y0 + 1.05, (glassFrom || y1) - 0.12));
          if (glassFrom) pane(a, glassFrom, b, y1 - 0.12, col);
          else panel(a, y0 + 1.25, b, y1 - 0.15);
          if (k) rect(x0 + k * lw - 0.02, y0, x0 + k * lw + 0.02, y1, 'rgba(0,0,0,0.45)');
        }
        rect(x0 - 0.03, y0, x0, y1, 'rgba(0,0,0,0.35)');
      };
      const plinth = (x0, x1) => {
        rect(x0, 0, x1, 0.45, stone); rect(x0, 0.42, x1, 0.48, '#c8c2b6');
        for (let v = x0 + 0.38; v < x1 - 0.1; v += 0.76) rect(v, 0, v + 0.03, 0.42, 'rgba(0,0,0,0.2)');
      };
      const keystone = (cx, y) => fill(ctx => { ctx.moveTo(X(cx - 0.14), Y(y + 0.02)); ctx.lineTo(X(cx + 0.14), Y(y + 0.02)); ctx.lineTo(X(cx + 0.09), Y(y - 0.3)); ctx.lineTo(X(cx - 0.09), Y(y - 0.3)); }, trim);
      x.save(); x.beginPath(); x.rect(u.x, u.y, u.w, G.ROW); x.clip();
      m.save(); m.beginPath(); m.rect(u.x, u.y, u.w, G.ROW); m.clip();
      if (style === 'jugend') for (let v = 0.9; v < 4; v += 0.45) { rect(0, v - 0.035, W, v, 'rgba(0,0,0,0.14)'); rect(0, v, W, v + 0.03, 'rgba(255,255,255,0.16)'); }
      else rect(0, 3.94, W, 4, 'rgba(0,0,0,0.06)');
      paint({ X, Y, W, fill, framed, glassIn, pane, rect, panel, door, plinth, keystone, box, arch, round });
      x.restore(); m.restore();
    };

    const H = GFLOOR.hansa, J = GFLOOR.jugend;
    unit('hansa', H.shop, p => {
      const wood = '#2e4636';
      p.plinth(0, p.W);
      p.framed(p.arch(0.15, 3.35, 0, 3.0, 0.38), trim);
      p.fill(p.arch(0.3, 3.2, 0, 2.9, 0.33), wood);
      p.glassIn(p.arch(0.45, 3.05, 2.82, 2.86, 0.26));
      p.rect(0.3, 2.76, 3.2, 2.84, wood);
      for (const v of [1.1, 1.75, 2.4]) p.rect(v - 0.025, 2.84, v + 0.025, 3.2, wood);
      p.rect(0.45, 0.1, 2.0, 0.55, '#24382a'); p.panel(0.55, 0.16, 1.9, 0.48);
      p.pane(0.45, 0.6, 2.0, 2.7, wood, 2, 1);
      p.rect(0.45, 2.2, 2.0, 2.25, wood);
      p.door(2.15, 0.02, 3.05, 2.36, wood, 1, 1.3);
      p.pane(2.15, 2.44, 3.05, 2.72, wood, 2, 1);
      p.rect(2.1, 0, 3.1, 0.06, '#8a8478');
      p.keystone(1.75, 3.38);
    });
    unit('hansa', H.shop2, p => {
      const wood = '#5a3622';
      p.plinth(0, p.W);
      for (const [a, b] of [[0.3, 1.12], [2.38, 3.2]]) {
        p.framed(p.box(a - 0.13, 0.62, b + 0.13, 2.92), trim);
        p.pane(a, 0.74, b, 2.8, wood, 2, 2);
        p.rect(a - 0.18, 0.6, b + 0.18, 0.7, trim);
      }
      p.framed(p.box(1.16, 0, 2.34, 2.96), trim);
      p.door(1.3, 0.02, 2.2, 2.4, wood, 2, 0);
      p.pane(1.3, 2.5, 2.2, 2.84, wood, 3, 1);
      p.rect(1.06, 2.96, 2.44, 3.05, trim);
      p.rect(1.25, 0, 2.25, 0.06, '#8a8478');
    });
    unit('hansa', H.cafe, p => {
      const wood = '#6a2418';
      p.plinth(0, p.W);
      p.framed(p.box(0.18, 0, 3.32, 2.96), trim);
      p.rect(0.28, 0.02, 3.22, 2.86, wood);
      p.rect(0.4, 0.1, 2.25, 0.5, '#4a180e'); p.panel(0.5, 0.16, 2.15, 0.44);
      p.pane(0.4, 0.56, 2.25, 2.74, wood, 3, 2);
      p.door(2.42, 0.02, 3.1, 2.42, wood, 1, 0.9);
      p.pane(2.42, 2.5, 3.1, 2.74, wood);
    });
    unit('hansa', H.door, p => {
      const wood = '#4a2c1a';
      p.plinth(0, 0.3); p.plinth(1.95, p.W);
      p.framed(ctx => { p.box(0.22, 0, 2.03, 2.7)(ctx); ctx.moveTo(p.X(2.03), p.Y(2.7)); ctx.arc(p.X(1.125), p.Y(2.7), 0.905 * 32, 0, Math.PI, true); }, trim);
      p.fill(ctx => { p.box(0.4, 0, 1.85, 2.7)(ctx); ctx.moveTo(p.X(1.85), p.Y(2.7)); ctx.arc(p.X(1.125), p.Y(2.7), 0.725 * 32, 0, Math.PI, true); }, '#2a2420');
      p.door(0.45, 0.04, 1.8, 2.62, wood, 2, 0);
      p.glassIn(ctx => { ctx.moveTo(p.X(1.805), p.Y(2.7)); ctx.arc(p.X(1.125), p.Y(2.7), 0.68 * 32, 0, Math.PI, true); });
      x.strokeStyle = wood; x.lineWidth = 2;
      for (let k = 1; k < 6; k++) { const t = Math.PI * k / 6; x.beginPath(); x.moveTo(p.X(1.125), p.Y(2.7)); x.lineTo(p.X(1.125 + Math.cos(t) * 0.68), p.Y(2.7 + Math.sin(t) * 0.68)); x.stroke(); }
      x.beginPath(); x.arc(p.X(1.125), p.Y(2.7), 0.3 * 32, Math.PI, 0); x.stroke();
      p.rect(0.4, 2.66, 1.85, 2.74, wood);
      p.keystone(1.125, 3.62);
      p.rect(0.3, 0, 1.95, 0.1, '#8a8478');
    });
    unit('hansa', H.win, p => {
      p.plinth(0, p.W);
      p.framed(p.box(0.42, 0.98, 1.58, 2.98), trim);
      p.pane(0.52, 1.08, 1.48, 2.88, '#f4f2ea', 2, 2);
      for (let v = 0.6; v < 1.45; v += 0.15) p.rect(v, 1.08, v + 0.03, 2.1, iron);
      p.rect(0.52, 2.06, 1.48, 2.1, iron);
      p.rect(0.34, 0.92, 1.66, 1.0, trim);
      p.rect(0.36, 2.98, 1.64, 3.1, trim); p.rect(0.36, 2.96, 1.64, 2.98, shade);
    });
    unit('hansa', H.gate, p => {
      const wood = '#5a3a22';
      p.plinth(0, 0.25); p.plinth(3.0, p.W);
      p.framed(p.arch(0.2, 3.05, 0, 2.7, 0.6), trim);
      p.fill(p.arch(0.38, 2.87, 0, 2.62, 0.52), wood);
      x.save(); x.beginPath(); p.arch(0.38, 2.87, 0, 2.62, 0.52)(x); x.clip();
      for (let v = 0.38; v < 2.87; v += 0.18) p.rect(v, 0, v + 0.025, 3.8, 'rgba(0,0,0,0.25)');
      for (const v of [0.5, 1.5, 2.35]) p.rect(0.38, v, 2.87, v + 0.07, '#2a1c12');
      x.restore();
      p.rect(1.6, 0, 1.65, 3.2, 'rgba(0,0,0,0.5)');
      x.strokeStyle = 'rgba(0,0,0,0.55)'; x.lineWidth = 2; x.strokeRect(p.X(0.62), p.Y(2.0), 0.82 * 32, 1.95 * 32);
      p.rect(0.38, 0, 0.52, 0.55, stone); p.rect(2.73, 0, 2.87, 0.55, stone);
      p.keystone(1.625, 3.32);
    });
    unit('hansa', H.pier, p => p.plinth(0, p.W));

    unit('jugend', J.shop, p => {
      const wood = '#2a2c2a';
      p.plinth(0, p.W);
      p.framed(p.round(0.15, 3.85, 0, 3.16, 0.45), trim);
      p.fill(p.round(0.28, 3.72, 0, 3.04, 0.36), wood);
      p.rect(0.42, 0.1, 2.55, 0.5, '#3a3c38');
      for (let v = 0.5; v < 2.5; v += 0.25) p.rect(v, 0.18, v + 0.18, 0.42, '#5a7a8a');
      p.pane(0.42, 0.56, 2.55, 2.6, wood, 2, 1);
      p.pane(0.42, 2.68, 2.55, 2.94, wood, 8, 1);
      p.door(2.72, 0.02, 3.58, 2.6, wood, 1, 1.2);
      p.pane(2.72, 2.68, 3.58, 2.94, wood, 3, 1);
      x.fillStyle = trim; x.beginPath(); x.arc(p.X(2.0), p.Y(3.06), 0.1 * 32, 0, Math.PI * 2); x.fill();
    });
    unit('jugend', J.shop2, p => {
      const wood = '#3a2a1e';
      p.plinth(0, p.W);
      p.framed(p.round(0.15, 3.85, 0, 3.24, 0.4), trim);
      p.fill(p.round(0.28, 3.72, 0, 3.12, 0.32), wood);
      for (const [a, b] of [[0.4, 1.5], [2.5, 3.6]]) { p.rect(a, 0.1, b, 0.48, '#2a1e14'); p.panel(a + 0.08, 0.16, b - 0.08, 0.42); p.pane(a, 0.54, b, 2.76, wood, 2, 1); }
      p.rect(1.55, 0, 2.45, 2.8, 'rgba(0,0,0,0.45)');
      p.door(1.66, 0.02, 2.34, 2.56, '#2e2016', 1, 1.1);
      p.pane(0.4, 2.86, 3.6, 3.04, wood, 12, 1);
    });
    unit('jugend', J.cafe, p => {
      const wood = '#1e3a32';
      p.plinth(0, p.W);
      p.framed(p.round(0.15, 3.85, 0, 3.04, 0.5), trim);
      p.fill(p.round(0.28, 3.72, 0, 2.94, 0.42), wood);
      p.rect(0.4, 0.1, 2.6, 0.5, '#14281f'); p.panel(0.5, 0.16, 2.5, 0.44);
      p.pane(0.4, 0.56, 2.6, 2.76, wood, 4, 3);
      p.door(2.8, 0.02, 3.6, 2.5, wood, 1, 0.9);
      p.pane(2.8, 2.58, 3.6, 2.8, wood, 2, 1);
    });
    unit('jugend', J.door, p => {
      const wood = '#3e2a1c';
      p.plinth(0, 0.3); p.plinth(2.45, p.W);
      const portal = (a, b, y, apex) => ctx => { ctx.moveTo(p.X(a), p.Y(0)); ctx.lineTo(p.X(a), p.Y(y)); ctx.quadraticCurveTo(p.X((a + b) / 2), p.Y(apex * 2 - y), p.X(b), p.Y(y)); ctx.lineTo(p.X(b), p.Y(0)); };
      const fan = (a, b, y0, y, apex) => ctx => { ctx.moveTo(p.X(a), p.Y(y0)); ctx.lineTo(p.X(a), p.Y(y)); ctx.quadraticCurveTo(p.X((a + b) / 2), p.Y(apex * 2 - y), p.X(b), p.Y(y)); ctx.lineTo(p.X(b), p.Y(y0)); };
      p.framed(portal(0.25, 2.5, 2.95, 3.6), trim);
      p.fill(portal(0.48, 2.27, 2.95, 3.38), '#241a14');
      p.door(0.52, 0.04, 2.23, 2.86, wood, 2, 1.6);
      x.strokeStyle = iron; x.lineWidth = 1.5;
      for (const a of [0.65, 1.47]) for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(p.X(a + 0.1 + k * 0.2), p.Y(1.62)); x.bezierCurveTo(p.X(a + 0.2 + k * 0.2), p.Y(2.0), p.X(a + k * 0.2), p.Y(2.3), p.X(a + 0.1 + k * 0.2), p.Y(2.7)); x.stroke(); }
      p.glassIn(fan(0.58, 2.17, 2.9, 2.92, 3.3));
      x.strokeStyle = wood; x.lineWidth = 2;
      for (let k = 1; k < 8; k++) { const t = Math.PI * k / 8; x.beginPath(); x.moveTo(p.X(1.375), p.Y(2.9)); x.lineTo(p.X(1.375 + Math.cos(t) * 0.8), p.Y(2.9 + Math.sin(t) * 0.42)); x.stroke(); }
      p.rect(0.48, 2.86, 2.27, 2.94, wood);
      x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 2;
      for (const a of [0.34, 2.41]) { x.beginPath(); x.moveTo(p.X(a), p.Y(0.6)); x.bezierCurveTo(p.X(a + 0.08), p.Y(1.6), p.X(a - 0.06), p.Y(2.3), p.X(a), p.Y(2.95)); x.stroke(); }
      x.fillStyle = trim; x.beginPath(); x.ellipse(p.X(1.375), p.Y(3.66), 0.2 * 32, 0.16 * 32, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = shade; x.beginPath(); x.arc(p.X(1.31), p.Y(3.68), 1.6, 0, Math.PI * 2); x.arc(p.X(1.44), p.Y(3.68), 1.6, 0, Math.PI * 2); x.fill();
      p.rect(0.35, 0, 2.4, 0.1, '#8a8478');
    });
    unit('jugend', J.win, p => {
      p.plinth(0, p.W);
      p.framed(p.box(0.45, 0.98, 1.8, 3.26), trim);
      p.rect(0.38, 3.0, 0.52, 3.26, trim); p.rect(1.73, 3.0, 1.87, 3.26, trim);
      p.pane(0.58, 1.1, 1.67, 3.12, '#f4f2ea', 2, 1);
      p.rect(0.58, 2.5, 1.67, 2.54, '#f4f2ea');
      for (const v of [0.94, 1.31]) p.rect(v - 0.015, 2.54, v + 0.015, 3.12, '#f4f2ea');
      for (let v = 0.68; v < 1.62; v += 0.16) p.rect(v, 1.1, v + 0.03, 2.2, iron);
      p.rect(0.36, 0.92, 1.89, 1.0, trim);
      p.keystone(1.125, 3.34);
    });
    unit('jugend', J.gate, p => {
      p.framed(p.arch(0.2, 3.55, 0, 2.95, 0.65), trim);
      x.save(); x.beginPath(); p.arch(0.4, 3.35, 0, 2.85, 0.55)(x); x.clip();
      const g = x.createLinearGradient(0, p.Y(3.4), 0, p.Y(0));
      g.addColorStop(0, '#121416'); g.addColorStop(0.7, '#2a2c2a'); g.addColorStop(1, '#4a4a44');
      x.fillStyle = g; x.fillRect(p.X(0.4), p.Y(4), 3 * 32, 4 * 32);
      p.rect(1.3, 0, 2.45, 2.0, 'rgba(170,180,150,0.32)');
      for (let v = 0.46; v < 3.35; v += 0.13) p.rect(v, 0, v + 0.04, 4, iron);
      for (const v of [0.25, 1.1, 2.3]) p.rect(0.4, v, 3.35, v + 0.06, iron);
      x.strokeStyle = iron; x.lineWidth = 2;
      for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(p.X(0.65 + k * 0.49), p.Y(2.36), 0.22 * 32, Math.PI, 0); x.stroke(); }
      x.restore();
      p.rect(1.86, 0, 1.89, 3.4, iron);
      p.keystone(1.875, 3.6);
    });
    unit('jugend', J.pier, p => p.plinth(0, p.W));

    const AWN = [['#b8282a', '#f2ece0'], ['#1e5a32', '#f2ece0'], ['#20407a', '#f2ece0'], ['#c8781e', '#f6eed8']];
    GFLOOR.awn.forEach(([ax, ay], k) => {
      for (let i = 0; i < 8; i++) { x.fillStyle = AWN[k][i % 2]; x.fillRect(ax + i * 8, ay, 8, 96); }
      const g = x.createLinearGradient(0, ay, 0, ay + 64);
      g.addColorStop(0, 'rgba(0,0,0,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0.08)');
      x.fillStyle = g; x.fillRect(ax, ay, 64, 64);
      x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(ax, ay + 64, 64, 2); x.fillRect(ax, ay + 93, 64, 3);
      x.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(ax + i * 8 + 4, ay + 93, 4, 0, Math.PI); x.fill(); }
    });
    {
      const [sx, sy, sw, sh] = GFLOOR.stone;
      x.fillStyle = stone; x.fillRect(sx, sy, sw, sh);
      for (let yy = 0; yy < sh; yy += 16) {
        x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(sx, sy + yy, sw, 1);
        for (let xx = (yy / 16) % 2 ? 0 : 16; xx < sw; xx += 32) x.fillRect(sx + xx, sy + yy, 1, 16);
      }
      const [dx, dy, dw, dh] = GFLOOR.dark;
      x.fillStyle = '#262422'; x.fillRect(dx - 8, dy - 8, dw + 16, dh + 16);
    }
    x.textAlign = 'center'; x.textBaseline = 'middle';
    GFLOOR.signs.forEach((s, k) => {
      const W = G.SW, Hs = G.SH;
      x.fillStyle = s.bg; x.fillRect(s.x, s.y, W, Hs);
      x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(s.x, s.y, W, 2);
      x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(s.x, s.y + Hs - 2, W, 2);
      x.strokeStyle = s.fg; x.globalAlpha = 0.45; x.lineWidth = 1; x.strokeRect(s.x + 3.5, s.y + 4.5, W - 7, Hs - 9); x.globalAlpha = 1;
      x.fillStyle = s.fg; x.font = (k % 3 === 1 ? 'bold 19px Georgia, serif' : 'bold 19px Arial, sans-serif');
      x.fillText(s.text, s.x + W / 2, s.y + Hs / 2 + 1, W - 16);
    });
    const img = x.getImageData(0, 0, G.W, G.H), mk = m.getImageData(0, 0, G.W, G.H).data;
    for (let i = 0; i < img.data.length; i += 4) img.data[i + 3] = mk[i] > 127 ? 254 : 255;
    x.putImageData(img, 0, 0);
    return c;
  };

  function facade(key) {
    const f = FAC[key];
    const W = 64, H = 64;
    const c = canvas(W, H), x = c.getContext('2d');
    tileNoise(x, W, H, f.wall, 14, key.length * 7 + 3, 8);
    const rgb = a => `rgb(${a[0]},${a[1]},${a[2]})`;
    if (f.brick) {
      x.fillStyle = 'rgba(80,40,30,0.35)';
      for (let y = 0; y < H; y += 4) { x.fillRect(0, y, W, 1); for (let k = (y / 4) % 2 ? 0 : 4; k < W; k += 8) x.fillRect(k, y, 1, 4); }
    }
    if (f.planks) { x.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < H; y += 5) x.fillRect(0, y, W, 1); }
    if (f.panel) { x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 63, W, 1); x.fillRect(63, 0, 1, H); x.fillRect(31, 0, 1, H); }
    if (f.ribs) { x.fillStyle = 'rgba(0,0,0,0.14)'; for (let k = 0; k < W; k += 4) x.fillRect(k, 0, 1, H); }
    const mask = [];
    const win = (wx, wy, ww, wh, arch) => {
      x.fillStyle = rgb(f.frame);
      x.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
      if (arch) { x.beginPath(); x.arc(wx + ww / 2, wy, ww / 2 + 2, Math.PI, 0); x.fill(); }
      x.fillStyle = rgb(f.glass);
      x.fillRect(wx, wy, ww, wh);
      if (arch) { x.beginPath(); x.arc(wx + ww / 2, wy, ww / 2, Math.PI, 0); x.fill(); }
      x.fillStyle = 'rgba(160,190,210,0.35)';
      x.fillRect(wx + 1, wy + 1, ww / 2 - 1, wh / 3);
      x.fillStyle = rgb(f.frame);
      x.fillRect(wx + ww / 2 - 0.5, wy, 1, wh);
      x.fillRect(wx, wy + wh * 0.4, ww, 1);
      mask.push([wx, wy - (arch ? ww / 2 : 0), ww, wh + (arch ? ww / 2 : 0)]);
    };
    switch (f.win) {
      case 'arch': win(22, 22, 20, 30, true); break;
      case 'rect': win(20, 16, 24, 34); break;
      case 'small': win(24, 20, 16, 26); break;
      case 'jug':
        win(18, 16, 28, 36);
        x.fillStyle = rgb(f.orn); x.fillRect(14, 6, 36, 5); x.fillRect(16, 54, 32, 3);
        x.beginPath(); x.arc(32, 10, 5, 0, Math.PI * 2); x.fill();
        break;
      case 'jug2':
        win(20, 18, 24, 34, true);
        x.fillStyle = rgb(f.orn); x.fillRect(0, 58, 64, 4); x.fillRect(10, 2, 44, 4);
        break;
      case 'wood': win(22, 20, 20, 24); x.fillStyle = '#e8e0d0'; x.fillRect(18, 18, 3, 28); x.fillRect(43, 18, 3, 28); break;
      case 'soviet': win(12, 22, 40, 24); break;
      case 'balc':
        win(8, 18, 22, 28); win(38, 18, 18, 22);
        x.fillStyle = 'rgba(120,120,116,0.9)'; x.fillRect(4, 44, 30, 14);
        x.fillStyle = 'rgba(80,80,80,0.5)'; x.fillRect(4, 44, 30, 2);
        break;
      case 'strip': x.fillStyle = rgb(f.glass); x.fillRect(0, 12, 64, 14); mask.push([0, 12, 64, 14]); x.fillStyle = rgb(f.frame); for (let k = 0; k < 64; k += 8) x.fillRect(k, 12, 1, 14); break;
      case 'high': win(12, 8, 40, 16); break;
      case 'curtain': x.fillStyle = rgb(f.glass); x.fillRect(0, 0, 64, 64); mask.push([2, 2, 60, 58]); x.fillStyle = rgb(f.frame); x.fillRect(0, 0, 64, 2); x.fillRect(0, 62, 64, 2); x.fillRect(31, 0, 2, 64); break;
    }
    const img = x.getImageData(0, 0, W, H);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
    for (const [mx, my, mw, mh] of mask) {
      for (let y = Math.max(0, Math.floor(my)); y < Math.min(H, my + mh); y++) {
        for (let k = Math.max(0, Math.floor(mx)); k < Math.min(W, mx + mw); k++) img.data[(y * W + k) * 4 + 3] = 254;
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  P.shop = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    tileNoise(x, 64, 64, [120, 110, 100], 14, 51, 8);
    x.fillStyle = '#2a2420'; x.fillRect(0, 0, 64, 10);
    const cols = ['#b83a2a', '#2a6ab8', '#e0b030', '#3a8a4a', '#8a3ab0'];
    x.fillStyle = cols[2]; x.fillRect(4, 2, 56, 6);
    x.fillStyle = '#334450'; x.fillRect(6, 16, 34, 40);
    x.fillStyle = 'rgba(200,220,230,0.35)'; x.fillRect(8, 18, 14, 16);
    x.fillStyle = '#4a3a2a'; x.fillRect(46, 20, 14, 44);
    const img = x.getImageData(0, 0, 64, 64);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
    for (let y = 16; y < 56; y++) for (let k = 6; k < 40; k++) img.data[(y * 64 + k) * 4 + 3] = 254;
    x.putImageData(img, 0, 0);
    return c;
  };

  P.roof_tile = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    tileNoise(x, 64, 64, [156, 72, 48], 30, 61, 8);
    for (let y = 0; y < 64; y += 8) {
      x.fillStyle = 'rgba(60,20,10,0.4)'; x.fillRect(0, y + 6, 64, 2);
      for (let k = (y / 8) % 2 ? 0 : 4; k < 64; k += 8) x.fillRect(k, y, 1, 8);
    }
    return c;
  };
  P.roof_tin = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    tileNoise(x, 64, 64, [118, 124, 128], 18, 62, 8);
    x.fillStyle = 'rgba(255,255,255,0.12)'; for (let k = 0; k < 64; k += 8) x.fillRect(k, 0, 2, 64);
    x.fillStyle = 'rgba(0,0,0,0.15)'; for (let k = 4; k < 64; k += 8) x.fillRect(k, 0, 1, 64);
    return c;
  };
  P.roof_flat = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    tileNoise(x, 64, 64, [96, 96, 94], 30, 63, 5);
    return c;
  };
  P.roof_slate = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    tileNoise(x, 64, 64, [70, 80, 90], 20, 64, 8);
    x.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < 64; y += 6) x.fillRect(0, y, 64, 1);
    return c;
  };
  P.copper = () => {
    const c = canvas(32, 32), x = c.getContext('2d');
    tileNoise(x, 32, 32, [96, 150, 124], 26, 65, 6);
    return c;
  };

  P.props = () => {
    const c = canvas(128, 128), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 128);
    const g = x.createRadialGradient(96, 32, 0, 96, 32, 30);
    g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(1, 'rgba(255,255,240,0)');
    x.fillStyle = g; x.fillRect(64, 0, 64, 64);
    return c;
  };

  P.smoke = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 31);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const img = x.getImageData(0, 0, 64, 64);
    for (let i = 0; i < 64 * 64; i++) img.data[i * 4 + 3] *= 0.7 + F.noise2((i % 64) / 8, Math.floor(i / 64) / 8, 3) * 0.6;
    x.putImageData(img, 0, 0);
    return c;
  };
  P.glow = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return c;
  };
  P.flare = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 3;
    x.beginPath(); x.arc(32, 32, 26, 0, Math.PI * 2); x.stroke();
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 24);
    g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return c;
  };
  P.clouds = () => {
    const W = 256, img = new ImageData(W, W), d = img.data;
    const pn = (k, y, cx, cy, seed) => periodicNoise(k / cx, y / cy, W / cx, W / cy, seed);
    for (let y = 0; y < W; y++) {
      for (let k = 0; k < W; k++) {
        let base = 0, amp = 1, norm = 0;
        for (let o = 0; o < 5; o++) { base += pn(k, y, 64 >> o, 64 >> o, 90 + o) * amp; norm += amp; amp *= 0.5; }
        base /= norm;
        let puff = 0;
        for (let o = 0; o < 3; o++) puff += (1 - Math.abs(pn(k, y, 32 >> o, 32 >> o, 120 + o) * 2 - 1)) * [0.5, 0.3, 0.2][o];
        const warp = pn(k, y, 128, 128, 140) * 0.7 + pn(k, y, 64, 64, 141) * 0.3;
        const streak = pn(k, y, 64, 8, 150) * 0.55 + pn(k, y, 32, 4, 151) * 0.3 + pn(k, y, 16, 4, 152) * 0.15;
        const i = (y * W + k) * 4;
        d[i] = F.clamp((base - 0.2) / 0.6, 0, 1) * 255;
        d[i + 1] = F.clamp((puff - 0.35) / 0.55, 0, 1) * 255;
        d[i + 2] = warp * 255;
        d[i + 3] = F.clamp((streak - 0.25) / 0.5, 0, 1) * 255;
      }
    }
    return img;
  };
  P.chevron = () => {
    const c = canvas(64, 64), x = c.getContext('2d');
    x.clearRect(0, 0, 64, 64);
    x.fillStyle = 'rgba(255,255,255,0.95)';
    x.beginPath(); x.moveTo(4, 50); x.lineTo(32, 18); x.lineTo(60, 50); x.lineTo(48, 50); x.lineTo(32, 32); x.lineTo(16, 50); x.closePath(); x.fill();
    return c;
  };
  P.beacon = () => {
    const c = canvas(16, 64), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0.8)');
    x.fillStyle = g; x.fillRect(0, 0, 16, 64);
    const h = x.createLinearGradient(0, 0, 16, 0);
    h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, 16, 64);
    return c;
  };
  flags.beacon = { clamp: true };
  P.rain = () => {
    const c = canvas(8, 64), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(200,210,230,0)'); g.addColorStop(0.7, 'rgba(215,225,240,0.75)'); g.addColorStop(1, 'rgba(230,238,250,0.95)');
    x.fillStyle = g; x.fillRect(2, 0, 4, 64);
    return c;
  };
  flags.rain = { clamp: true };
  P.rainsheet = () => {
    const W = 64, H = 256, img = new ImageData(W, H), d = img.data;
    for (let k = 0; k < 150; k++) {
      const x0 = Math.floor(F.hash2(k, 1, 61) * W), y0 = Math.floor(F.hash2(k, 2, 61) * H), len = 12 + Math.floor(F.hash2(k, 3, 61) * 34), a = 0.25 + F.hash2(k, 4, 61) * 0.55;
      for (let j = 0; j < len; j++) {
        const i = (((y0 + j) % H) * W + x0) * 4;
        d[i] = d[i + 1] = d[i + 2] = 255;
        d[i + 3] = Math.max(d[i + 3], Math.round(255 * a * (1 - j / len)));
      }
    }
    return img;
  };
  P.splash = () => {
    const c = canvas(32, 32), x = c.getContext('2d');
    const g = x.createRadialGradient(16, 16, 8, 16, 16, 15);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return c;
  };
  flags.splash = { clamp: true };
  P.bolt = () => {
    const c = canvas(32, 8), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 32, 0);
    g.addColorStop(0, 'rgba(160,170,255,0)'); g.addColorStop(0.35, 'rgba(190,200,255,0.45)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(0.65, 'rgba(190,200,255,0.45)'); g.addColorStop(1, 'rgba(160,170,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 8);
    return c;
  };
  flags.bolt = { clamp: true };

  function textCanvas(w, h, draw) {
    const c = canvas(w, h), x = c.getContext('2d');
    draw(x, w, h);
    return c;
  }

  P.board_xp = () => textCanvas(128, 64, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#ffcf20'); g.addColorStop(1, '#ff7a10');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1a1a1a'; x.font = 'bold italic 24px Arial'; x.textAlign = 'center'; x.fillText('HORIZON', w / 2, 30);
    x.font = 'bold 18px Arial'; x.fillText('+XP', w / 2, 54);
  });
  P.board_ft = () => textCanvas(128, 64, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#30b4ff'); g.addColorStop(1, '#6a3ae0');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#fff'; x.font = 'bold italic 22px Arial'; x.textAlign = 'center'; x.fillText('HORIZON', w / 2, 28);
    x.font = 'bold 14px Arial'; x.fillText('БЫСТРЫЙ ПУТЬ', w / 2, 52);
  });
  P.banner = () => textCanvas(256, 64, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#e6146e'); g.addColorStop(0.5, '#ff6a1a'); g.addColorStop(1, '#ffc81e');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#fff'; x.font = 'bold italic 34px Arial'; x.textAlign = 'center'; x.fillText('HORIZON  RĪGA', w / 2, 44);
  });
  P.finish = () => textCanvas(256, 64, (x, w, h) => {
    for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(i * 16, j * 16, 16, 16); }
    x.fillStyle = 'rgba(230,20,110,0.9)'; x.fillRect(40, 12, 176, 40);
    x.fillStyle = '#fff'; x.font = 'bold italic 28px Arial'; x.textAlign = 'center'; x.fillText('ФИНИШ', w / 2, 43);
  });
  P.gate = () => textCanvas(128, 32, (x, w, h) => {
    x.fillStyle = 'rgba(40,150,255,0.85)'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#fff'; x.font = 'bold italic 18px Arial'; x.textAlign = 'center'; x.fillText('HORIZON', w / 2, 23);
  });
  P.stunts = () => textCanvas(256, 64, (x) => {
    const card = (ox, bg, t1, t2) => {
      x.fillStyle = bg; x.fillRect(ox, 0, 64, 64);
      x.fillStyle = '#fff'; x.font = 'bold 13px Arial'; x.textAlign = 'center'; x.fillText(t1, ox + 32, 26); x.font = 'bold 10px Arial'; x.fillText(t2, ox + 32, 44);
    };
    card(0, '#e6146e', 'РАДАР', 'SPEED TRAP');
    card(64, '#e8a010', 'ПРЫЖОК', 'DANGER');
    card(128, '#7a2ad8', 'ДРИФТ', 'DRIFT ZONE');
    card(192, '#1a9ae0', 'ЗОНА', 'SPEED ZONE');
  });
  const stuntCard = (bg, t1, t2) => () => textCanvas(128, 96, (x) => {
    x.fillStyle = bg; x.fillRect(0, 0, 128, 96);
    x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(4, 4, 120, 4); x.fillRect(4, 88, 120, 4);
    x.fillStyle = '#fff'; x.textAlign = 'center';
    x.font = 'bold italic 20px Arial'; x.fillText('HORIZON', 64, 32);
    x.font = 'bold 18px Arial'; x.fillText(t1, 64, 58);
    x.font = 'bold 11px Arial'; x.fillText(t2, 64, 78);
  });
  P.stunt_trap = stuntCard('#e6146e', 'РАДАР', 'СКОРОСТНАЯ ЛОВУШКА');
  P.stunt_zone = stuntCard('#1a9ae0', 'ЗОНА', 'ЗОНА СКОРОСТИ');
  P.stunt_drift = stuntCard('#7a2ad8', 'ДРИФТ', 'ЗОНА ДРИФТА');
  P.stunt_jump = stuntCard('#e8a010', 'ПРЫЖОК', 'ОПАСНЫЙ ЗНАК');
  P.plate = () => textCanvas(64, 16, (x) => {
    x.fillStyle = '#f4f4ee'; x.fillRect(0, 0, 64, 16);
    x.fillStyle = '#2a4ab0'; x.fillRect(0, 0, 9, 16);
    x.fillStyle = '#fff'; x.font = 'bold 6px Arial'; x.fillText('LV', 1, 12);
    x.fillStyle = '#111'; x.font = 'bold 11px Arial'; x.fillText('HZ-2001', 11, 12);
    x.strokeStyle = '#111'; x.strokeRect(0.5, 0.5, 63, 15);
  });
  function treadCell(x, ox, oy, kind) {
    x.save();
    x.translate(ox, oy);
    x.beginPath();
    x.rect(0, 0, 32, 32);
    x.clip();
    x.fillStyle = kind === 'offroad' ? '#343434' : '#ffffff';
    x.fillRect(0, 0, 32, 32);
    x.fillStyle = kind === 'offroad' ? '#ffffff' : '#383838';
    if (kind === 'road') {
      for (const y of [7, 15, 23]) x.fillRect(0, y, 32, 2);
      for (let i = 0; i < 4; i++) { x.fillRect(i * 8 + 3, 1, 1, 5); x.fillRect(i * 8 + 7, 10, 1, 4); x.fillRect(i * 8 + 3, 18, 1, 4); x.fillRect(i * 8 + 7, 26, 1, 5); }
    } else if (kind === 'sport') {
      for (const y of [10, 20]) x.fillRect(0, y, 32, 3);
      for (let i = 0; i < 4; i++) for (let k = 0; k < 8; k++) { x.fillRect(i * 8 + k, 7 - k, 1, 1); x.fillRect(i * 8 + 7 - k, 24 + k, 1, 1); }
    } else if (kind === 'rally') {
      for (let row = 0; row < 3; row++) for (let i = 0; i < 5; i++) x.fillRect(i * 8 + (row % 2) * 4 - 4, row * 11, 2, 10);
      for (const y of [9, 20]) x.fillRect(0, y, 32, 2);
    } else {
      for (let i = 0; i < 4; i++) { x.fillRect(i * 8, 0, 5, 13); x.fillRect(i * 8 + 4, 19, 5, 13); }
      x.fillRect(0, 14, 32, 4);
    }
    x.restore();
  }
  P.caratlas = () => {
    const c = canvas(128, 128), x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 128, 128);
    treadCell(x, 64, 0, 'road');
    treadCell(x, 96, 0, 'sport');
    treadCell(x, 64, 32, 'rally');
    treadCell(x, 96, 32, 'offroad');
    x.drawImage(P.plate(), 0, 64);
    return c;
  };
  P.carshadow = () => {
    const S = 64, c = canvas(S, S), x = c.getContext('2d'), img = x.createImageData(S, S);
    for (let j = 0; j < S; j++) {
      for (let i = 0; i < S; i++) {
        const u = Math.abs((i + 0.5) / S * 2 - 1) - 0.52, v = Math.abs((j + 0.5) / S * 2 - 1) - 0.62;
        const d = Math.hypot(Math.max(u, 0), Math.max(v, 0)) + Math.min(Math.max(u, v), 0) - 0.18;
        const a = F.clamp(0.5 - d / 0.44, 0, 1), k = (j * S + i) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
        img.data[k + 3] = Math.round(a * a * (3 - 2 * a) * 255);
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  };
  P.brand = () => textCanvas(256, 256, (x) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256);
  });

  const SKIN = { size: 512, left: [0, 0, 512, 144], right: [0, 144, 512, 144], top: [0, 288, 512, 104], front: [0, 392, 256, 88], rear: [256, 392, 256, 88], plate: [0, 480, 128, 32], tail: [128, 480, 64, 32], head: [192, 480, 64, 32], grille: [256, 480, 64, 32], white: [320, 480, 64, 32], tread: [384, 480, 128, 32] };
  const SPONSORS = { cola: ['#d0141e', '#ffffff', 'BALTIC', 'COLA'], fm: ['#12305a', '#ffd23a', 'RĪGA FM', '101.5'], mobile: ['#1a7a3a', '#ffffff', 'DZINTARS', 'MOBILE'], kafija: ['#f4e6c8', '#6a2a14', 'Sprīdītis', 'Kafija'] };
  const LIVERIES = ['none', 'stripes', 'side', 'twotone', 'tail', 'number', 'horizon', 'cola', 'fm', 'mobile', 'kafija', 'rally', 'raf', 'route', 'ambulance', 'taxi'];
  const OWN = { raf: ['raf2203'], route: ['raf2203'], ambulance: ['raf2203'], taxi: ['w123'] };
  const INK = 'rgba(16,16,18,0.85)', PINK = '#e6146e', LIME = '#d7ff1e';

  function fasciaFill(x, kind, x0, y0, x1, y1, grid) {
    const w = x1 - x0, h = y1 - y0;
    if (kind === 'clear' || kind === 'fresnel') {
      const g = x.createRadialGradient((x0 + x1) / 2, (y0 + y1) / 2, 1, (x0 + x1) / 2, (y0 + y1) / 2, Math.max(w, h) / 2);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c8ccd2');
      x.fillStyle = g; x.fillRect(x0, y0, w, h);
      if (kind === 'clear') return;
      x.fillStyle = 'rgba(110,118,126,0.35)';
      for (let i = x0 + 2; i < x1; i += 3) x.fillRect(i, y0, 1, h);
      for (let j = y0 + 2; j < y1; j += 4) x.fillRect(x0, j, w, 1);
      return;
    }
    if (kind === 'ribs' || kind === 'cells' || kind === 'dots') {
      x.fillStyle = '#b8b8b8'; x.fillRect(x0, y0, w, h);
      x.fillStyle = '#ffffff';
      if (kind === 'ribs') for (let j = y0 + 1; j < y1; j += 3) x.fillRect(x0, j, w, 2);
      else if (kind === 'cells') for (let j = y0 + 1; j < y1; j += 4) for (let i = x0 + 1; i < x1; i += 4) x.fillRect(i, j, 3, 3);
      else for (let j = y0 + 2; j < y1; j += 4) for (let i = x0 + 2; i < x1; i += 4) { x.beginPath(); x.arc(i, j, 1.2, 0, Math.PI * 2); x.fill(); }
      return;
    }
    x.fillStyle = '#404040'; x.fillRect(x0, y0, w, h);
    x.fillStyle = '#ffffff'; x.strokeStyle = '#ffffff'; x.lineWidth = 1;
    if (kind === 'vbars') for (let i = x0 + 1; i < x1; i += 4) x.fillRect(i, y0, 2, h);
    else if (kind === 'grid' && grid) { for (let i = 0; i < grid[0]; i++) x.fillRect(x0 + (i + 0.5) * w / grid[0] - 0.75, y0, 1.5, h); for (let j = 0; j < grid[1]; j++) x.fillRect(x0, y0 + (j + 0.5) * h / grid[1] - 0.7, w, 1.4); }
    else if (kind === 'grid') { for (let i = x0 + 1; i < x1; i += 4) x.fillRect(i, y0, 1, h); for (let j = y0 + 1; j < y1; j += 4) x.fillRect(x0, j, w, 1); }
    else if (kind === 'mesh') for (let i = x0 - h; i < x1 + h; i += 4) { x.beginPath(); x.moveTo(i, y0); x.lineTo(i + h, y1); x.moveTo(i + h, y0); x.lineTo(i, y1); x.stroke(); }
    else for (let j = y0 + 1; j < y1; j += 3) x.fillRect(x0, j, w, 2);
  }

  function carSkin(d, livery) {
    const own = OWN[livery];
    if (own && !own.includes(d.car)) livery = 'none';
    const N = SKIN.size;
    const A = canvas(N, N), M = canvas(N, N);
    const a = A.getContext('2d', { willReadFrequently: true }), m = M.getContext('2d', { willReadFrequently: true });
    a.fillStyle = '#ffffff'; a.fillRect(0, 0, N, N);
    m.fillStyle = '#ff0000'; m.fillRect(0, 0, N, N);
    const sides = ['L', 'R'];
    const path = (x, where, pts, close) => {
      x.beginPath();
      pts.forEach((p, i) => { const q = d.px(where, p[0], p[1]); if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); });
      if (close) x.closePath();
    };
    const stroke = (x, w, col) => { x.lineWidth = w; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(); };
    const decal = fn => {
      a.save(); fn(a, c => c); a.restore();
      m.save(); m.globalCompositeOperation = 'multiply'; fn(m, () => '#00ffff'); m.restore();
    };
    const second = fn => { m.save(); m.globalCompositeOperation = 'lighter'; m.fillStyle = '#00ff00'; fn(m); m.restore(); };
    const frame = (x, where, p, q) => { const t = d.frame(where, p, q); x.setTransform(t[0], t[1], t[2], t[3], t[4], t[5]); };
    const flat = x => x.setTransform(1, 0, 0, 1, 0, 0);
    const label = (x, s, cx, cy, size, style, fill, maxW, edge) => {
      x.font = style + ' ' + size + 'px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = fill;
      if (edge) { x.lineWidth = size * 0.16; x.lineJoin = 'round'; x.strokeStyle = edge; x.strokeText(s, cx, cy, maxW); }
      x.fillText(s, cx, cy, maxW);
    };
    const box = (x, w, h, r) => {
      const x0 = -w / 2, y0 = -h / 2;
      x.beginPath(); x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r); x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath();
    };
    const cell = (r, fn) => { a.save(); a.beginPath(); a.rect(r[0], r[1], r[2], r[3]); a.clip(); a.translate(r[0], r[1]); fn(a, r[2], r[3]); a.restore(); };
    const sponsor = (x, c, key, w, h) => {
      const s = SPONSORS[key];
      box(x, w, h, Math.min(w, h) * 0.2); x.fillStyle = c(s[0]); x.fill();
      box(x, w - 3, h - 3, Math.min(w, h) * 0.16); x.lineWidth = Math.max(0.6, h * 0.04); x.strokeStyle = c(s[1]); x.stroke();
      label(x, s[2], 0, -h * 0.17, h * 0.34, 'bold italic', c(s[1]), w * 0.86);
      label(x, s[3], 0, h * 0.24, h * 0.27, 'bold', c(s[1]), w * 0.8);
    };
    const disc = (x, c, r, n) => {
      x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fillStyle = c('#ffffff'); x.fill();
      x.lineWidth = r * 0.07; x.strokeStyle = c('#111111'); x.stroke();
      label(x, String(n), 0, r * 0.06, r * 1.15, 'bold', c('#111111'), r * 1.6);
    };
    const sideBand = (lo, hi, f0 = 0.015, f1 = 0.985) => {
      const pts = [];
      for (let f = f0; f < f1; f += 0.02) pts.push([f, hi(f)]);
      pts.push([f1, hi(f1)], [f1, lo(f1)]);
      for (let f = f1; f > f0; f -= 0.02) pts.push([f, lo(f)]);
      pts.push([f0, lo(f0)]);
      return pts;
    };

    for (const s of sides) {
      const r = s === 'L' ? SKIN.left : SKIN.right, y0 = d.px(s, 0, d.yb + 0.24)[1], y1 = r[1] + r[3];
      const g = a.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.34)');
      a.fillStyle = g; a.fillRect(r[0], y0, r[2], y1 - y0);
      for (const pl of d.gaps) { path(a, s, pl); stroke(a, 1.5, INK); }
    }
    if (d.fuel && d.fuelRound) {
      const c0 = d.px(d.fuelSide || 'R', (d.fuel[0][0] + d.fuel[1][0]) / 2, (d.fuel[0][1] + d.fuel[2][1]) / 2), c1 = d.px(d.fuelSide || 'R', d.fuel[1][0], d.fuel[2][1]);
      a.beginPath(); a.ellipse(c0[0], c0[1], Math.abs(c1[0] - c0[0]), Math.abs(c1[1] - c0[1]), 0, 0, Math.PI * 2); stroke(a, 0.9, 'rgba(16,16,18,0.55)');
    } else if (d.fuel) { path(a, d.fuelSide || 'R', d.fuel, true); stroke(a, 0.9, 'rgba(16,16,18,0.55)'); }
    for (const pl of d.seams) { path(a, 'T', pl); stroke(a, 1.4, INK); }
    for (const ln of d.lines || []) { path(a, ln.where, ln.pts); stroke(a, 1.5, INK); }
    for (const t of d.texts || []) decal((x, c) => { frame(x, t.where, t.p, t.q); label(x, t.text, 0, 0, t.size, t.style || 'bold italic', c(t.col), t.maxW || 300, t.edge && c(t.edge)); });
    for (const mo of d.molding ? [d.molding].concat(d.trims || []) : []) decal((x, c) => {
      const y0 = mo.y0 === undefined ? mo.y : mo.y0, y1 = mo.y1 === undefined ? mo.y : mo.y1;
      for (const s of sides) {
        path(x, s, [[mo.f0, y0], [mo.f1, y1]]); stroke(x, mo.w || 2.6, c(mo.col));
        if (mo.edge) { path(x, s, [[mo.f0, y0 + mo.edgeY], [mo.f1, y1 + mo.edgeY]]); stroke(x, 1.2, c(mo.edge)); }
      }
    });
    for (const v of d.vents || []) for (const w of v.where === 'S' ? sides : ['T']) decal((x, c) => {
      frame(x, w, v.p, v.q);
      if (v.bg) { x.fillStyle = c(v.bg); x.fillRect(-v.h / 2, -v.w / 2, v.h, v.w); }
      x.fillStyle = c(v.col || '#161618');
      if (v.across) for (let i = 0; i < v.n; i++) x.fillRect(-v.h / 2, (i + 0.2 - v.n / 2) * v.w / v.n, v.h, v.w / v.n * 0.6);
      else for (let i = 0; i < v.n; i++) x.fillRect((i + 0.2 - v.n / 2) * v.h / v.n, -v.w / 2, v.h / v.n * 0.6, v.w);
    });
    decal((x, c) => {
      frame(x, 'B', d.badgeX[0], d.badgeY); label(x, d.badge[0], 0, 0, d.badgeSize || 7, d.badgeStyle || 'bold', c('#d4d7db'), d.badgeW || 36, c('#3a3c40'));
      if (d.badgeX[1] !== null) { frame(x, 'B', d.badgeX[1], d.badgeY); label(x, d.badge[1], 0, 0, d.badgeSize2 || 7, d.badgeStyle2 || 'bold italic', c('#d4d7db'), d.badgeW2 || 36, c('#3a3c40')); }
    });
    cell(SKIN.plate, (x, w, h) => {
      x.fillStyle = '#f4f4ee'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#2a4ab0'; x.fillRect(0, 0, 18, h);
      label(x, 'LV', 9, h / 2 + 1, 10, 'bold', '#ffffff');
      label(x, d.plate, 18 + (w - 18) / 2, h / 2 + 1, 21, 'bold', '#111111', w - 24);
      x.strokeStyle = '#111111'; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2);
    });
    cell(SKIN.tail, (x, w, h) => {
      x.fillStyle = '#c4c4c4'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#ffffff';
      for (let y = 3; y < h - 3; y += 5) x.fillRect(2, y, w - 4, 3);
      x.fillStyle = '#666666';
      x.fillRect(0, 0, w, 2); x.fillRect(0, h - 2, w, 2); x.fillRect(0, 0, 2, h); x.fillRect(w - 2, 0, 2, h); x.fillRect(w / 2 - 1, 0, 2, h);
    });
    cell(SKIN.head, (x, w, h) => {
      const g = x.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cdd2d8');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(110,118,126,0.35)';
      for (let i = 3; i < w; i += 5) x.fillRect(i, 0, 1, h);
      for (let j = 4; j < h; j += 8) x.fillRect(0, j, w, 1);
      x.fillStyle = '#8a8e94'; x.fillRect(0, 0, w, 2); x.fillRect(0, h - 2, w, 2);
    });
    ['road', 'sport', 'rally', 'offroad'].forEach((k, i) => treadCell(a, SKIN.tread[0] + i * 32, SKIN.tread[1], k));
    cell(SKIN.grille, (x, w, h) => {
      x.fillStyle = '#404040'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#ffffff'; x.strokeStyle = '#ffffff'; x.lineWidth = 1.3;
      if (d.grille === 'bars' || d.grille === 'kidney' || d.grille === 'shark') for (let i = 2; i < w; i += 6) x.fillRect(i, 0, 2, h);
      else if (d.grille === 'evo' || d.grille === 'gti') for (let i = -h; i < w + h; i += 6) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.moveTo(i + h, 0); x.lineTo(i, h); x.stroke(); }
      else for (let j = 2; j < h; j += 5) x.fillRect(0, j, w, 2);
    });

    const P = d.panel, H = d.hood;
    switch (livery) {
      case 'stripes':
        second(x => {
          for (const sg of [-1, 1]) {
            path(x, 'T', [[0, sg * 0.08], [1, sg * 0.08], [1, sg * 0.26], [0, sg * 0.26]], true); x.fill();
            for (const w of ['F', 'B']) { path(x, w, [[sg * 0.08, d.yLo], [sg * 0.26, d.yLo], [sg * 0.26, d.yHiE], [sg * 0.08, d.yHiE]], true); x.fill(); }
          }
        });
        break;
      case 'side':
        second(x => { for (const s of sides) { path(x, s, sideBand(f => d.belt(f) - 0.21, f => d.belt(f) - 0.1), true); x.fill(); } });
        break;
      case 'twotone': {
        const low = f => d.yb + (d.belt(f) - d.yb) * 0.42;
        second(x => {
          for (const s of sides) { path(x, s, sideBand(() => d.yLo, low, 0, 1), true); x.fill(); }
          for (const [w, f] of [['F', 0], ['B', 1]]) { path(x, w, [[-1.5, d.yLo], [1.5, d.yLo], [1.5, low(f)], [-1.5, low(f)]], true); x.fill(); }
        });
        const edge = [];
        for (let f = 0; f < 1.001; f += 0.02) edge.push([f, low(f)]);
        decal((x, c) => { for (const s of sides) { path(x, s, edge); stroke(x, 1.2, c('#f2f2f2')); } });
        break;
      }
      case 'tail':
        second(x => {
          for (const s of sides) { path(x, s, [[0.86, d.yLo], [1, d.yLo], [1, d.hgt + 0.1], [0.86, d.hgt + 0.1]], true); x.fill(); }
          path(x, 'T', [[0.86, -1.5], [1, -1.5], [1, 1.5], [0.86, 1.5]], true); x.fill();
          path(x, 'B', [[-1.5, d.yLo], [1.5, d.yLo], [1.5, d.yHiE], [-1.5, d.yHiE]], true); x.fill();
        });
        break;
      case 'number':
        decal((x, c) => {
          for (const s of sides) { frame(x, s, P.f, P.y); disc(x, c, Math.min(24, P.h * 0.44, P.w * 0.44), d.number); }
          if (H) { frame(x, 'T', H.f, 0); disc(x, c, Math.min(22, H.len * 0.3, H.w * 0.3), d.number); }
        });
        break;
      case 'horizon':
        decal((x, c) => {
          for (const s of sides) {
            flat(x); path(x, s, d.swoosh, true); x.fillStyle = c(PINK); x.fill();
            frame(x, s, P.f, P.y + 0.03);
            label(x, 'HORIZON', 0, -3, Math.min(17, P.h * 0.4), 'bold italic', c('#ffffff'), P.w * 0.92, c(PINK));
            label(x, 'RĪGA 2001', 0, 11, 7.5, 'bold', c(LIME), P.w * 0.6);
          }
          if (H) { frame(x, 'T', H.f, 0); label(x, 'HORIZON', 0, 0, Math.min(20, H.len * 0.28), 'bold italic', c(PINK), H.w * 0.8); }
        });
        break;
      case 'cola': case 'fm': case 'mobile': case 'kafija':
        decal((x, c) => {
          for (const s of sides) { frame(x, s, P.f, P.y); sponsor(x, c, livery, Math.min(92, P.w * 0.9), Math.min(38, P.h * 0.8)); }
          if (H) { frame(x, 'T', H.f, 0); sponsor(x, c, livery, Math.min(80, H.w * 0.7), Math.min(34, H.len * 0.45)); }
        });
        break;
      case 'raf': case 'route': case 'ambulance': {
        const B = d.band;
        if (!B) break;
        const band = x => {
          for (const s of sides) { path(x, s, sideBand(() => B.lo, f => d.belt(f), 0, 1), true); x.fill(); }
          path(x, 'F', [[-1.5, B.nose], [1.5, B.nose], [1.5, d.yHiE + 1], [-1.5, d.yHiE + 1]], true); x.fill();
          path(x, 'T', [[0, -1.5], [B.ws, -1.5], [B.ws, 1.5], [0, 1.5]], true); x.fill();
          path(x, 'B', [[-1.5, B.lo], [1.5, B.lo], [1.5, B.hi], [-1.5, B.hi]], true); x.fill();
        };
        const sideText = (x, text, size, col) => {
          for (const s of sides) { frame(x, s, B.text, (B.lo + d.belt(B.text)) / 2); label(x, text, 0, 1, size, 'bold', col, B.textW); }
        };
        if (livery === 'ambulance') {
          decal((x, c) => {
            x.fillStyle = c('#c81e1e'); band(x);
            flat(x); sideText(x, 'ĀTRĀ PALĪDZĪBA', 16, c('#ffffff'));
            frame(x, 'T', B.cross, 0); x.fillStyle = c('#d01e1e'); x.fillRect(-7, -22, 14, 44); x.fillRect(-22, -7, 44, 14);
            for (const s of sides) { frame(x, s, B.door, B.lo - 0.2); label(x, '03', 0, 0, 22, 'bold', c('#c81e1e'), 60); }
          });
        } else {
          second(band);
          if (livery === 'route') { m.save(); sideText(m, 'MARŠRUTA TAKSOMETRS', 15, '#ff0000'); m.restore(); }
        }
        break;
      }
      case 'taxi': {
        const T = d.taxi;
        if (!T) break;
        decal((x, c) => {
          const n = Math.round((T.f1 - T.f0) * d.L / T.sq), df = (T.f1 - T.f0) / n;
          for (const s of sides) {
            flat(x);
            for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) {
              const f0 = T.f0 + i * df, y0 = T.y0 + j * T.sq;
              path(x, s, [[f0, y0], [f0 + df, y0], [f0 + df, y0 + T.sq], [f0, y0 + T.sq]], true);
              x.fillStyle = c((i + j) % 2 ? '#141414' : '#f2c21a'); x.fill();
            }
            frame(x, s, T.text, T.textY); label(x, 'TAKSOMETRS', 0, 0, 11, 'bold', c('#f2c21a'), 150, c('#141414'));
          }
        });
        break;
      }
      case 'rally':
        second(x => {
          for (const q of [H, d.roof]) if (q) { path(x, 'T', [[q.f0, -q.hw], [q.f1, -q.hw], [q.f1, q.hw], [q.f0, q.hw]], true); x.fill(); }
        });
        decal((x, c) => {
          for (const s of sides) {
            frame(x, s, P.f, P.y);
            x.fillStyle = c('#ffffff'); x.fillRect(-24, -16, 48, 32);
            x.lineWidth = 1.2; x.strokeStyle = c('#111111'); x.strokeRect(-22, -14, 44, 28);
            label(x, String(d.number), 0, 1, 23, 'bold', c('#111111'), 40);
            if (!d.panel2) continue;
            ['cola', 'fm', 'mobile', 'kafija'].forEach((k, i) => {
              frame(x, s, d.panel2.f, d.panel2.y);
              x.translate(((i % 2) - 0.5) * 31, (Math.floor(i / 2) - 0.5) * 12);
              sponsor(x, c, k, 29, 10.5);
            });
          }
          frame(x, 'TS', d.roof.f, 0);
          x.fillStyle = c('#ffffff'); x.fillRect(-27, -19, 54, 38);
          label(x, String(d.number), 0, 1, 30, 'bold', c('#111111'), 48);
        });
        break;
      default: break;
    }
    for (const e of d.fascia || []) {
      const q = e.pts.map(p => d.px(e.where, p[0], p[1])), xs = q.map(p => p[0]), ys = q.map(p => p[1]);
      a.save();
      path(a, e.where, e.pts, true);
      a.clip();
      fasciaFill(a, e.fill, Math.min(...xs) - 1, Math.min(...ys) - 1, Math.max(...xs) + 1, Math.max(...ys) + 1, e.grid);
      a.restore();
    }

    const pa = a.getImageData(0, 0, N, N).data, pm = m.getImageData(0, 0, N, N).data;
    const rgba = new Uint8Array(N * N * 4), mask = new Uint8Array(N * N);
    let two = false;
    for (let i = 0, j = 0; i < N * N; i++, j += 4) {
      rgba[j] = pa[j]; rgba[j + 1] = pa[j + 1]; rgba[j + 2] = pa[j + 2]; rgba[j + 3] = pm[j];
      const g = pm[j + 1];
      mask[i] = g;
      if (g) two = true;
    }
    return { size: N, rgba, mask: two ? mask : null };
  }

  function paint(name) {
    if (cache.has(name)) return cache.get(name);
    let cv = null;
    if (FAC[name]) cv = FAC[name].v2 ? facade2(name) : facade(name);
    else if (P[name]) cv = P[name]();
    if (cv) cache.set(name, cv);
    return cv;
  }

  function register(name, fn, flag) {
    P[name] = fn;
    if (flag) flags[name] = flag;
  }

  F.Tex = { paint, flags, canvas, carSkin, register, tileNoise, SKIN, LIVERIES, OWN, list: () => Object.keys(P).concat(Object.keys(FAC)) };
})(globalThis.Forza = globalThis.Forza || {});
