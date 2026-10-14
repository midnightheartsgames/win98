(function (H) {
  'use strict';

  const painters = {};
  const worldSize = {};
  const flags = {};

  function reg(name, size, meters, fn, f = {}) {
    painters[name] = { size, fn };
    worldSize[name] = meters;
    flags[name] = f;
  }

  function rgb(r, g, b, a = 1) { return `rgba(${r | 0},${g | 0},${b | 0},${a})`; }

  function noise(ctx, s, base, amp, seed = 1, grain = 1) {
    const img = ctx.createImageData(s, s);
    const r = H.rng(seed);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const lo = (H.hash2(Math.floor(x / 4) + seed * 7, Math.floor(y / 4)) - 0.5) * amp * 0.8;
        const n = (r() - 0.5) * amp * grain + lo;
        const i = (y * s + x) * 4;
        img.data[i] = base[0] + n; img.data[i + 1] = base[1] + n; img.data[i + 2] = base[2] + n; img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function stains(ctx, s, n, col, seed, maxR = 0.25) {
    const r = H.rng(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * s, y = r() * s, rr = r() * s * maxR;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }
  }

  function drips(ctx, s, n, col, seed) {
    const r = H.rng(seed);
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const x = r() * s, len = r() * s * 0.5;
      ctx.fillRect(x, 0, 1 + r() * 2, len);
    }
  }

  function bricks(ctx, s, rows, cols, brick, mortar, seed, jitter = 18) {
    const r = H.rng(seed);
    ctx.fillStyle = mortar;
    ctx.fillRect(0, 0, s, s);
    const bh = s / rows, bw = s / cols;
    for (let j = 0; j < rows; j++) {
      const off = j % 2 ? bw / 2 : 0;
      for (let i = -1; i <= cols; i++) {
        const k = (r() - 0.5) * jitter;
        ctx.fillStyle = rgb(brick[0] + k, brick[1] + k * 0.8, brick[2] + k * 0.6);
        ctx.fillRect(i * bw + off + 1, j * bh + 1, bw - 2, bh - 2);
      }
    }
    const img = ctx.getImageData(0, 0, s, s);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (r() - 0.5) * 16;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }

  function panels(ctx, s, n, base, line, seed) {
    noise(ctx, s, base, 14, seed);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    const step = s / n;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath(); ctx.moveTo(i * step + 0.5, 0); ctx.lineTo(i * step + 0.5, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * step + 0.5); ctx.lineTo(s, i * step + 0.5); ctx.stroke();
    }
  }

  function rivets(ctx, s, n, col) {
    ctx.fillStyle = col;
    const step = s / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      ctx.fillRect(i * step + 3, j * step + 3, 2, 2);
      ctx.fillRect(i * step + step - 5, j * step + step - 5, 2, 2);
    }
  }

  reg('concrete', 64, 2, (c, s) => { noise(c, s, [128, 128, 122], 26, 3); stains(c, s, 5, 'rgba(60,60,50,0.18)', 4); });
  reg('concrete_dark', 64, 2, (c, s) => { noise(c, s, [84, 86, 84], 22, 5); stains(c, s, 5, 'rgba(20,30,20,0.2)', 6); });
  reg('sidewalk', 64, 2, (c, s) => { noise(c, s, [138, 136, 128], 20, 7); c.strokeStyle = 'rgba(50,50,45,0.6)'; c.strokeRect(0.5, 0.5, s - 1, s - 1); c.beginPath(); c.moveTo(s / 2, 0); c.lineTo(s / 2, s); c.stroke(); stains(c, s, 3, 'rgba(40,40,30,0.15)', 8); });
  reg('asphalt', 64, 4, (c, s) => { noise(c, s, [70, 72, 74], 26, 9, 1.4); stains(c, s, 4, 'rgba(20,20,20,0.25)', 10); });
  reg('road', 64, 4, (c, s) => { noise(c, s, [70, 72, 74], 26, 11, 1.4); c.fillStyle = 'rgba(210,200,150,0.75)'; c.fillRect(s / 2 - 1, 0, 3, s / 2); });
  reg('cobble', 64, 2, (c, s) => {
    noise(c, s, [70, 68, 64], 12, 12);
    const r = H.rng(13);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      const k = (r() - 0.5) * 30;
      c.fillStyle = rgb(112 + k, 108 + k, 100 + k);
      c.beginPath(); c.ellipse(i * 8 + 4 + (j % 2) * 2, j * 8 + 4, 3.5, 3.3, 0, 0, 7); c.fill();
    }
  });
  reg('brick', 64, 2, (c, s) => { bricks(c, s, 8, 4, [130, 64, 48], '#6d665c', 14); stains(c, s, 3, 'rgba(20,20,10,0.2)', 15); });
  reg('brick_yellow', 64, 2, (c, s) => { bricks(c, s, 8, 4, [176, 150, 104], '#77705e', 16); stains(c, s, 3, 'rgba(40,40,20,0.2)', 17); });
  reg('brick_dark', 64, 2, (c, s) => { bricks(c, s, 8, 4, [82, 50, 42], '#4a4640', 18); });
  reg('plaster', 64, 2, (c, s) => { noise(c, s, [150, 158, 132], 16, 19); stains(c, s, 6, 'rgba(70,70,40,0.18)', 20); drips(c, s, 5, 'rgba(60,60,40,0.12)', 21); });
  reg('plaster_blue', 64, 2, (c, s) => { noise(c, s, [104, 128, 136], 16, 22); stains(c, s, 6, 'rgba(30,40,40,0.2)', 23); drips(c, s, 5, 'rgba(30,40,40,0.15)', 24); });
  reg('plaster_white', 64, 2, (c, s) => { noise(c, s, [190, 188, 176], 12, 25); stains(c, s, 4, 'rgba(90,80,60,0.12)', 26); });
  reg('wallpaper', 64, 2, (c, s) => {
    noise(c, s, [140, 118, 88], 10, 27);
    c.fillStyle = 'rgba(90,60,40,0.35)';
    for (let i = 0; i < 4; i++) c.fillRect(i * 16 + 6, 0, 4, s);
    stains(c, s, 4, 'rgba(50,40,20,0.2)', 28);
  });
  reg('facade', 128, 6, (c, s) => {
    noise(c, s, [150, 146, 128], 16, 29);
    stains(c, s, 6, 'rgba(60,60,40,0.18)', 30);
    const r = H.rng(31);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const x = i * 64 + 16, y = j * 64 + 14;
      c.fillStyle = '#5a5850'; c.fillRect(x - 3, y - 3, 38, 40);
      const lit = r() < 0.25;
      c.fillStyle = lit ? '#d8c890' : '#28303a'; c.fillRect(x, y, 32, 34);
      c.fillStyle = lit ? '#b8a870' : '#3a4450'; c.fillRect(x + 15, y, 2, 34); c.fillRect(x, y + 12, 32, 2);
      c.fillStyle = '#6a665a'; c.fillRect(x - 5, y + 36, 42, 4);
    }
    drips(c, s, 8, 'rgba(50,50,30,0.12)', 32);
  });
  reg('facade2', 128, 6, (c, s) => {
    bricks(c, s, 16, 6, [120, 70, 55], '#6a6258', 33);
    const r = H.rng(34);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const x = i * 64 + 18, y = j * 64 + 12;
      c.fillStyle = '#c8c0a8'; c.fillRect(x - 4, y - 4, 36, 44);
      const lit = r() < 0.2;
      c.fillStyle = lit ? '#e0cf98' : '#223038'; c.fillRect(x, y, 28, 36);
      c.fillStyle = '#c8c0a8'; c.fillRect(x + 13, y, 2, 36);
    }
  });
  reg('facade3', 128, 6, (c, s) => {
    noise(c, s, [118, 132, 128], 14, 35);
    stains(c, s, 6, 'rgba(30,40,40,0.2)', 36);
    const r = H.rng(37);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) {
      const x = i * 42 + 8, y = j * 64 + 16;
      const lit = r() < 0.2;
      c.fillStyle = '#50585a'; c.fillRect(x - 2, y - 2, 30, 34);
      c.fillStyle = lit ? '#d8c890' : '#1e2830'; c.fillRect(x, y, 26, 30);
      if (!lit && r() < 0.4) { c.fillStyle = '#6e7a70'; c.fillRect(x, y, 26, 30); c.fillStyle = '#4a544c'; for (let k = 0; k < 6; k++) c.fillRect(x, y + k * 5, 26, 1); }
    }
  });
  reg('shopfront', 128, 6, (c, s) => {
    noise(c, s, [110, 104, 94], 14, 38);
    c.fillStyle = '#2a3440'; c.fillRect(8, 40, 112, 80);
    c.fillStyle = '#48525e'; for (let i = 0; i < 4; i++) c.fillRect(8 + i * 28, 40, 3, 80);
    c.fillStyle = '#6a4a30'; c.fillRect(4, 18, 120, 18);
    c.fillStyle = '#d8c8a0'; c.font = 'bold 12px Arial'; c.fillText('ПРОДУКТЫ', 30, 32);
  });
  reg('roof', 64, 2, (c, s) => { noise(c, s, [72, 70, 66], 30, 39, 1.5); stains(c, s, 4, 'rgba(20,20,20,0.3)', 40); });
  reg('roof_tin', 64, 2, (c, s) => { noise(c, s, [110, 96, 80], 14, 41); c.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 8; i++) c.fillRect(i * 8, 0, 2, s); stains(c, s, 5, 'rgba(120,60,20,0.3)', 42); });
  reg('tile', 64, 2, (c, s) => { noise(c, s, [150, 140, 120], 10, 43); c.strokeStyle = 'rgba(60,50,40,0.6)'; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 16 + 0.5, 0); c.lineTo(i * 16 + 0.5, s); c.stroke(); c.beginPath(); c.moveTo(0, i * 16 + 0.5); c.lineTo(s, i * 16 + 0.5); c.stroke(); } stains(c, s, 4, 'rgba(60,50,30,0.2)', 44); });
  reg('tile_lab', 64, 1, (c, s) => { noise(c, s, [196, 200, 196], 8, 45); c.strokeStyle = 'rgba(120,130,130,0.8)'; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 16 + 0.5, 0); c.lineTo(i * 16 + 0.5, s); c.stroke(); c.beginPath(); c.moveTo(0, i * 16 + 0.5); c.lineTo(s, i * 16 + 0.5); c.stroke(); } });
  reg('tile_green', 64, 1, (c, s) => { noise(c, s, [110, 150, 130], 10, 46); c.strokeStyle = 'rgba(40,60,50,0.7)'; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 16 + 0.5, 0); c.lineTo(i * 16 + 0.5, s); c.stroke(); c.beginPath(); c.moveTo(0, i * 16 + 0.5); c.lineTo(s, i * 16 + 0.5); c.stroke(); } stains(c, s, 4, 'rgba(40,40,20,0.2)', 47); });
  reg('linoleum', 64, 2, (c, s) => { noise(c, s, [120, 104, 86], 10, 48); c.strokeStyle = 'rgba(60,40,30,0.3)'; for (let i = 0; i <= 2; i++) { c.beginPath(); c.moveTo(i * 32 + 0.5, 0); c.lineTo(i * 32 + 0.5, s); c.stroke(); } });
  reg('rock', 64, 4, (c, s) => { noise(c, s, [104, 100, 92], 40, 49, 1.3); stains(c, s, 8, 'rgba(40,40,30,0.3)', 50, 0.3); c.strokeStyle = 'rgba(40,36,30,0.5)'; const r = H.rng(51); for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(r() * s, r() * s); c.lineTo(r() * s, r() * s); c.stroke(); } });
  reg('cliff', 64, 6, (c, s) => { noise(c, s, [120, 112, 98], 44, 52, 1.3); stains(c, s, 8, 'rgba(60,50,30,0.3)', 53, 0.3); });
  reg('dirt', 64, 3, (c, s) => { noise(c, s, [102, 86, 64], 30, 54, 1.4); stains(c, s, 6, 'rgba(50,40,20,0.3)', 55); });
  reg('mud', 64, 3, (c, s) => { noise(c, s, [74, 64, 48], 24, 56, 1.3); stains(c, s, 6, 'rgba(30,20,10,0.3)', 57); });
  reg('grass', 64, 3, (c, s) => {
    noise(c, s, [84, 96, 52], 34, 58, 1.5);
    const r = H.rng(59);
    for (let i = 0; i < 300; i++) { c.fillStyle = r() < 0.5 ? 'rgba(120,130,70,0.6)' : 'rgba(50,60,30,0.6)'; c.fillRect(r() * s, r() * s, 1, 2); }
  });
  reg('sand', 64, 3, (c, s) => { noise(c, s, [184, 170, 132], 22, 60, 1.2); stains(c, s, 5, 'rgba(120,100,60,0.2)', 61); });
  reg('metal', 64, 2, (c, s) => { panels(c, s, 2, [106, 110, 112], 'rgba(40,40,40,0.8)', 62); rivets(c, s, 2, 'rgba(50,50,50,0.8)'); stains(c, s, 4, 'rgba(40,30,20,0.2)', 63); });
  reg('metal_rust', 64, 2, (c, s) => { noise(c, s, [110, 80, 58], 30, 64, 1.2); stains(c, s, 8, 'rgba(150,70,20,0.35)', 65); stains(c, s, 4, 'rgba(60,60,60,0.3)', 66); });
  reg('metal_green', 64, 2, (c, s) => { panels(c, s, 2, [76, 98, 82], 'rgba(30,40,30,0.8)', 67); stains(c, s, 6, 'rgba(120,70,20,0.3)', 68); });
  reg('corrugated', 64, 2, (c, s) => { noise(c, s, [120, 120, 116], 12, 69); for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)'; c.fillRect(i * 4, 0, 2, s); } stains(c, s, 5, 'rgba(140,70,20,0.3)', 70); });
  reg('container', 64, 3, (c, s) => { noise(c, s, [140, 66, 40], 14, 71); for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.08)'; c.fillRect(i * 4, 0, 2, s); } stains(c, s, 5, 'rgba(60,40,20,0.3)', 72); });
  reg('combine', 64, 2, (c, s) => {
    noise(c, s, [52, 58, 66], 10, 73);
    c.fillStyle = '#3a4048'; c.fillRect(0, 0, s, 4); c.fillRect(0, s - 4, s, 4);
    c.fillStyle = '#6a7482'; c.fillRect(4, 8, s - 8, 2); c.fillRect(4, s - 12, s - 8, 2);
    c.fillStyle = '#2a3038'; c.fillRect(s / 2 - 1, 10, 2, s - 22);
    c.fillStyle = 'rgba(90,180,230,0.9)'; c.fillRect(8, s / 2 - 1, 8, 2); c.fillRect(s - 16, s / 2 - 1, 8, 2);
  });
  reg('combine_floor', 64, 2, (c, s) => { noise(c, s, [58, 62, 68], 10, 74); c.strokeStyle = '#2c3036'; c.lineWidth = 2; c.strokeRect(1, 1, s - 2, s - 2); c.fillStyle = '#42484e'; for (let i = 0; i < 4; i++) c.fillRect(8 + i * 14, 8, 8, s - 16); });
  reg('combine_wall', 128, 4, (c, s) => {
    noise(c, s, [46, 52, 60], 8, 75);
    for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#3a4048' : '#4a525c'; c.fillRect(i * 32, 0, 30, s); }
    c.fillStyle = 'rgba(100,190,240,0.8)'; for (let j = 0; j < 4; j++) c.fillRect(0, j * 32 + 14, s, 2);
    c.fillStyle = '#20262c'; for (let i = 0; i < 4; i++) c.fillRect(i * 32 + 30, 0, 2, s);
  });
  reg('citadel', 128, 8, (c, s) => {
    noise(c, s, [70, 76, 84], 10, 76);
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#4a525c' : '#5c646e'; c.fillRect(i * 16, 0, 14, s); }
    c.fillStyle = '#2c3238'; for (let j = 0; j < 8; j++) c.fillRect(0, j * 16, s, 2);
  });
  reg('grate', 64, 1, (c, s) => {
    c.clearRect(0, 0, s, s);
    c.fillStyle = '#5a5e60';
    for (let i = 0; i < 8; i++) { c.fillRect(i * 8, 0, 2, s); c.fillRect(0, i * 8, s, 2); }
  }, { alpha: true });
  reg('chainlink', 64, 1, (c, s) => {
    c.clearRect(0, 0, s, s);
    c.strokeStyle = '#8a8e8a'; c.lineWidth = 1.2;
    for (let i = -8; i < 16; i++) { c.beginPath(); c.moveTo(i * 8, 0); c.lineTo(i * 8 + s, s); c.stroke(); c.beginPath(); c.moveTo(i * 8 + s, 0); c.lineTo(i * 8, s); c.stroke(); }
  }, { alpha: true });
  reg('ladder', 64, 1, (c, s) => {
    c.clearRect(0, 0, s, s);
    c.fillStyle = '#6a6a64'; c.fillRect(4, 0, 6, s); c.fillRect(s - 10, 0, 6, s);
    for (let j = 0; j < 3; j++) c.fillRect(4, j * 21 + 8, s - 8, 4);
  }, { alpha: true });
  reg('train', 128, 6, (c, s) => {
    noise(c, s, [70, 92, 80], 12, 77);
    c.fillStyle = '#2a3a34'; c.fillRect(0, 96, s, 32);
    for (let i = 0; i < 3; i++) { c.fillStyle = '#1c2426'; c.fillRect(8 + i * 40, 30, 30, 34); c.fillStyle = '#4a6a60'; c.fillRect(8 + i * 40, 28, 30, 2); }
    stains(c, s, 6, 'rgba(90,60,30,0.3)', 78);
  });
  reg('wood', 64, 2, (c, s) => { noise(c, s, [120, 88, 56], 14, 79); c.fillStyle = 'rgba(60,40,20,0.3)'; for (let i = 0; i < 40; i++) c.fillRect(0, (i * 7.3) % s, s, 1); });
  reg('wood_floor', 64, 2, (c, s) => { noise(c, s, [128, 92, 60], 14, 80); c.fillStyle = 'rgba(50,30,15,0.6)'; for (let i = 0; i < 8; i++) c.fillRect(i * 8, 0, 1, s); stains(c, s, 4, 'rgba(40,30,10,0.25)', 81); });
  reg('planks', 64, 2, (c, s) => { noise(c, s, [106, 84, 60], 22, 82); c.fillStyle = 'rgba(30,20,10,0.7)'; for (let i = 0; i < 5; i++) c.fillRect(0, i * 13, s, 2); c.fillStyle = 'rgba(40,40,40,0.8)'; for (let i = 0; i < 5; i++) { c.fillRect(4, i * 13 + 5, 2, 2); c.fillRect(s - 6, i * 13 + 5, 2, 2); } });
  reg('crate', 64, 1, (c, s) => {
    noise(c, s, [150, 118, 72], 16, 83);
    c.strokeStyle = '#5c4020'; c.lineWidth = 5; c.strokeRect(2.5, 2.5, s - 5, s - 5);
    c.beginPath(); c.moveTo(4, 4); c.lineTo(s - 4, s - 4); c.stroke();
    c.fillStyle = 'rgba(60,40,20,0.35)'; for (let i = 0; i < 6; i++) c.fillRect(0, i * 11 + 4, s, 1);
  });
  reg('door_metal', 64, 2, (c, s) => { noise(c, s, [96, 104, 100], 10, 84); c.strokeStyle = '#3a403c'; c.lineWidth = 2; c.strokeRect(6, 4, s - 12, s - 8); c.fillStyle = '#c0b060'; c.fillRect(s - 14, s / 2, 4, 6); });
  reg('door_wood', 64, 2, (c, s) => { noise(c, s, [110, 72, 44], 12, 85); c.strokeStyle = '#4a2e18'; c.lineWidth = 2; c.strokeRect(8, 6, s - 16, s / 2 - 8); c.strokeRect(8, s / 2 + 2, s - 16, s / 2 - 8); c.fillStyle = '#c0a050'; c.fillRect(s - 14, s / 2, 4, 4); });
  reg('gate', 64, 2, (c, s) => { c.clearRect(0, 0, s, s); c.fillStyle = '#3c4248'; for (let i = 0; i < 8; i++) c.fillRect(i * 8 + 2, 0, 3, s); c.fillRect(0, 2, s, 4); c.fillRect(0, s - 6, s, 4); }, { alpha: true });
  reg('field', 64, 2, (c, s) => {
    c.fillStyle = 'rgba(80,160,255,0.35)'; c.fillRect(0, 0, s, s);
    c.strokeStyle = 'rgba(160,220,255,0.7)';
    for (let i = 0; i < 10; i++) { c.beginPath(); c.moveTo(0, i * 7); c.lineTo(s, i * 7 + 3); c.stroke(); }
  }, { alpha: true, trans: true });
  reg('glass', 64, 2, (c, s) => { c.fillStyle = 'rgba(120,150,160,0.35)'; c.fillRect(0, 0, s, s); c.strokeStyle = 'rgba(220,240,240,0.35)'; c.beginPath(); c.moveTo(10, 50); c.lineTo(40, 10); c.stroke(); }, { alpha: true, trans: true });
  reg('water', 64, 4, (c, s) => {
    noise(c, s, [44, 70, 72], 14, 86);
    c.strokeStyle = 'rgba(160,190,190,0.25)';
    const r = H.rng(87);
    for (let i = 0; i < 14; i++) { const x = r() * s, y = r() * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 6, y - 3, x + 12, y); c.stroke(); }
  }, { trans: true });
  reg('sludge', 64, 4, (c, s) => { noise(c, s, [70, 110, 30], 24, 88); stains(c, s, 6, 'rgba(160,200,40,0.4)', 89); }, { trans: true });
  reg('lambda', 64, 1, (c, s) => {
    c.clearRect(0, 0, s, s);
    c.strokeStyle = 'rgba(230,120,20,0.9)'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.arc(32, 32, 24, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(20, 48); c.lineTo(32, 26); c.moveTo(24, 16); c.lineTo(44, 48); c.stroke();
  }, { alpha: true });
  reg('poster', 64, 1, (c, s) => {
    noise(c, s, [200, 196, 180], 10, 90);
    c.fillStyle = '#3a4a58'; c.fillRect(8, 8, 48, 36);
    c.fillStyle = '#c8b8a0'; c.beginPath(); c.ellipse(32, 26, 10, 13, 0, 0, 7); c.fill();
    c.fillStyle = '#8a8a8a'; c.fillRect(22, 13, 20, 5);
    c.fillStyle = '#202020'; c.font = 'bold 8px Arial'; c.fillText('СВОБОДА', 14, 54); c.fillText('ЕСТЬ ПОРЯДОК', 6, 62);
  });
  reg('screen', 64, 1, (c, s) => {
    c.fillStyle = '#10181c'; c.fillRect(0, 0, s, s);
    c.fillStyle = '#4a7090'; c.fillRect(4, 4, s - 8, s - 8);
    c.fillStyle = '#c8b8a0'; c.beginPath(); c.ellipse(32, 30, 12, 16, 0, 0, 7); c.fill();
    c.fillStyle = '#9a9a9a'; c.fillRect(20, 14, 24, 6); c.fillRect(22, 40, 20, 5);
    c.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < s; i += 2) c.fillRect(0, i, s, 1);
  });
  reg('vent', 64, 1, (c, s) => { noise(c, s, [90, 92, 90], 8, 91); c.fillStyle = '#2a2c2c'; for (let i = 0; i < 7; i++) c.fillRect(6, 6 + i * 8, s - 12, 4); });
  reg('pipe', 64, 1, (c, s) => { const g = c.createLinearGradient(0, 0, s, 0); g.addColorStop(0, '#3a3e40'); g.addColorStop(0.5, '#8a8e90'); g.addColorStop(1, '#3a3e40'); c.fillStyle = g; c.fillRect(0, 0, s, s); stains(c, s, 3, 'rgba(120,70,20,0.3)', 92); });
  reg('trim', 64, 1, (c, s) => { noise(c, s, [100, 96, 88], 10, 93); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(0, s - 6, s, 6); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(0, 0, s, 4); });
  reg('hazard', 64, 1, (c, s) => { c.fillStyle = '#d8b020'; c.fillRect(0, 0, s, s); c.fillStyle = '#1a1a1a'; for (let i = -4; i < 8; i++) { c.beginPath(); c.moveTo(i * 16, 0); c.lineTo(i * 16 + 8, 0); c.lineTo(i * 16 + 8 + s, s); c.lineTo(i * 16 + s, s); c.fill(); } });
  reg('lab_wall', 64, 2, (c, s) => { noise(c, s, [176, 180, 172], 8, 94); c.fillStyle = '#6a8a8a'; c.fillRect(0, s - 14, s, 14); c.fillStyle = '#4a6a6a'; c.fillRect(0, s - 16, s, 2); });
  reg('carpet', 64, 2, (c, s) => { noise(c, s, [90, 40, 36], 16, 95, 1.5); c.strokeStyle = 'rgba(200,160,60,0.3)'; c.strokeRect(6, 6, s - 12, s - 12); });
  reg('marble', 64, 2, (c, s) => { noise(c, s, [170, 166, 160], 10, 96); c.strokeStyle = 'rgba(90,90,90,0.25)'; const r = H.rng(97); for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(r() * s, 0); c.bezierCurveTo(r() * s, r() * s, r() * s, r() * s, r() * s, s); c.stroke(); } });
  reg('hedge', 64, 2, (c, s) => { noise(c, s, [52, 70, 40], 36, 98, 1.6); });
  reg('bark', 64, 2, (c, s) => { noise(c, s, [74, 60, 46], 20, 99); c.fillStyle = 'rgba(30,20,10,0.5)'; for (let i = 0; i < 12; i++) c.fillRect(i * 5 + 1, 0, 1, s); });
  reg('leaves', 64, 2, (c, s) => {
    c.clearRect(0, 0, s, s);
    const r = H.rng(100);
    for (let i = 0; i < 220; i++) { const k = r() * 40; c.fillStyle = rgb(60 + k, 80 + k, 36 + k * 0.5); c.beginPath(); c.ellipse(r() * s, r() * s, 3, 2, r() * 3, 0, 7); c.fill(); }
  }, { alpha: true });
  reg('leaves_dead', 64, 2, (c, s) => {
    c.clearRect(0, 0, s, s);
    const r = H.rng(101);
    for (let i = 0; i < 180; i++) { const k = r() * 40; c.fillStyle = rgb(70 + k, 60 + k, 40 + k * 0.5); c.beginPath(); c.ellipse(r() * s, r() * s, 3, 2, r() * 3, 0, 7); c.fill(); }
  }, { alpha: true });
  reg('black', 8, 1, (c, s) => { c.fillStyle = '#050505'; c.fillRect(0, 0, s, s); });
  reg('white', 8, 1, (c, s) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, s, s); });
  reg('light', 16, 1, (c, s) => { c.fillStyle = '#fff8e0'; c.fillRect(0, 0, s, s); }, { bright: true });
  reg('light_blue', 16, 1, (c, s) => { c.fillStyle = '#a8e0ff'; c.fillRect(0, 0, s, s); }, { bright: true });
  reg('light_red', 16, 1, (c, s) => { c.fillStyle = '#ff6040'; c.fillRect(0, 0, s, s); }, { bright: true });
  reg('light_green', 16, 1, (c, s) => { c.fillStyle = '#60ff80'; c.fillRect(0, 0, s, s); }, { bright: true });
  reg('light_orange', 16, 1, (c, s) => { c.fillStyle = '#ffb050'; c.fillRect(0, 0, s, s); }, { bright: true });
  reg('rubble', 64, 2, (c, s) => {
    noise(c, s, [96, 92, 86], 20, 102);
    const r = H.rng(103);
    for (let i = 0; i < 40; i++) { const k = (r() - 0.5) * 50; c.fillStyle = rgb(120 + k, 116 + k, 108 + k); c.fillRect(r() * s, r() * s, 3 + r() * 6, 2 + r() * 5); }
  });
  reg('rail', 64, 2, (c, s) => {
    noise(c, s, [88, 80, 70], 26, 104, 1.4);
    c.fillStyle = '#5a4430'; for (let i = 0; i < 4; i++) c.fillRect(0, i * 16 + 4, s, 7);
    c.fillStyle = '#9a9a9c'; c.fillRect(14, 0, 4, s); c.fillRect(s - 18, 0, 4, s);
  });

  reg('skin', 32, 1, (c, s) => { noise(c, s, [196, 150, 120], 10, 110); });
  reg('skin_dark', 32, 1, (c, s) => { noise(c, s, [120, 84, 60], 10, 111); });
  reg('skin_pale', 32, 1, (c, s) => { noise(c, s, [170, 160, 140], 12, 112); stains(c, s, 3, 'rgba(120,20,20,0.4)', 113); });
  reg('hair_dark', 32, 1, (c, s) => { noise(c, s, [34, 26, 22], 12, 114); });
  reg('hair_grey', 32, 1, (c, s) => { noise(c, s, [150, 150, 146], 14, 115); });
  reg('hair_brown', 32, 1, (c, s) => { noise(c, s, [90, 64, 40], 14, 116); });
  reg('cloth_blue', 32, 1, (c, s) => { noise(c, s, [70, 96, 120], 14, 117); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(s / 2, 0, 1, s); });
  reg('cloth_denim', 32, 1, (c, s) => { noise(c, s, [60, 76, 104], 16, 118); });
  reg('cloth_green', 32, 1, (c, s) => { noise(c, s, [84, 96, 64], 16, 119); });
  reg('cloth_brown', 32, 1, (c, s) => { noise(c, s, [104, 80, 56], 14, 120); });
  reg('cloth_white', 32, 1, (c, s) => { noise(c, s, [210, 210, 204], 8, 121); c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(s / 2, 0, 1, s); });
  reg('cloth_black', 32, 1, (c, s) => { noise(c, s, [34, 34, 38], 8, 122); });
  reg('cloth_grey', 32, 1, (c, s) => { noise(c, s, [110, 112, 112], 10, 123); });
  reg('cloth_red', 32, 1, (c, s) => { noise(c, s, [150, 50, 40], 12, 124); });
  reg('cop', 32, 1, (c, s) => { noise(c, s, [58, 70, 84], 10, 125); c.fillStyle = '#c8c8c8'; c.fillRect(2, 6, 6, 4); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(0, s - 6, s, 2); });
  reg('soldier', 32, 1, (c, s) => { noise(c, s, [64, 76, 86], 10, 126); c.fillStyle = '#2a3038'; c.fillRect(0, 10, s, 4); c.fillStyle = '#8a9296'; c.fillRect(4, 4, 8, 4); });
  reg('elite', 32, 1, (c, s) => { noise(c, s, [196, 200, 204], 8, 127); c.fillStyle = '#6a7078'; c.fillRect(0, 10, s, 4); });
  reg('prisonguard', 32, 1, (c, s) => { noise(c, s, [84, 92, 76], 10, 128); c.fillStyle = '#c0a040'; c.fillRect(4, 4, 6, 4); });
  reg('boots', 32, 1, (c, s) => { noise(c, s, [30, 30, 32], 8, 129); });
  reg('hev', 32, 1, (c, s) => { noise(c, s, [210, 110, 30], 12, 130); c.fillStyle = '#3a3a3a'; c.fillRect(0, 12, s, 6); c.fillStyle = '#ffd040'; c.fillRect(6, 4, 4, 4); });
  reg('zombie_body', 32, 1, (c, s) => { noise(c, s, [180, 176, 160], 12, 131); stains(c, s, 6, 'rgba(130,10,10,0.6)', 132, 0.4); });
  reg('crab', 32, 1, (c, s) => { noise(c, s, [170, 140, 96], 16, 133); stains(c, s, 3, 'rgba(120,60,40,0.5)', 134); });
  reg('crab_dark', 32, 1, (c, s) => { noise(c, s, [50, 40, 36], 12, 135); stains(c, s, 3, 'rgba(160,120,40,0.5)', 136); });
  reg('antlion', 32, 1, (c, s) => { noise(c, s, [120, 130, 70], 18, 137); c.fillStyle = 'rgba(60,50,20,0.5)'; for (let i = 0; i < 4; i++) c.fillRect(0, i * 8, s, 2); });
  reg('guard', 32, 1, (c, s) => { noise(c, s, [140, 130, 90], 18, 138); stains(c, s, 5, 'rgba(90,80,40,0.5)', 139); });
  reg('vort', 32, 1, (c, s) => { noise(c, s, [120, 130, 90], 14, 140); stains(c, s, 4, 'rgba(60,80,40,0.4)', 141); });
  reg('synth', 32, 1, (c, s) => { noise(c, s, [90, 100, 110], 12, 142); c.fillStyle = 'rgba(40,40,50,0.5)'; c.fillRect(0, s / 2, s, 2); });
  reg('synth_dark', 32, 1, (c, s) => { noise(c, s, [44, 50, 58], 10, 143); c.fillStyle = 'rgba(120,200,240,0.6)'; c.fillRect(0, s / 2, s, 1); });
  reg('dog', 32, 1, (c, s) => { noise(c, s, [120, 116, 100], 12, 144); c.fillStyle = '#d8b020'; c.fillRect(0, 0, s, 3); stains(c, s, 3, 'rgba(120,60,20,0.4)', 145); });
  reg('gun', 32, 1, (c, s) => { noise(c, s, [44, 46, 48], 8, 146); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, 2, s, 2); });
  reg('gun_light', 32, 1, (c, s) => { noise(c, s, [110, 114, 116], 8, 147); });
  reg('gg', 32, 1, (c, s) => { noise(c, s, [190, 110, 30], 12, 148); c.fillStyle = '#303030'; c.fillRect(0, 12, s, 6); });
  reg('gg_blue', 32, 1, (c, s) => { noise(c, s, [150, 180, 220], 12, 149); c.fillStyle = '#304060'; c.fillRect(0, 12, s, 6); });
  reg('barrel', 32, 1, (c, s) => { noise(c, s, [80, 96, 90], 14, 150); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(0, 8, s, 2); c.fillRect(0, 22, s, 2); stains(c, s, 3, 'rgba(120,60,20,0.4)', 151); });
  reg('barrel_red', 32, 1, (c, s) => { noise(c, s, [170, 40, 30], 12, 152); c.fillStyle = '#e8d040'; c.fillRect(0, 12, s, 6); c.fillStyle = '#101010'; c.fillRect(12, 13, 8, 4); });
  reg('barrel_blue', 32, 1, (c, s) => { noise(c, s, [50, 90, 150], 12, 153); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(0, 8, s, 2); c.fillRect(0, 22, s, 2); });
  reg('car_paint', 32, 1, (c, s) => { noise(c, s, [110, 120, 110], 12, 154); stains(c, s, 4, 'rgba(120,60,20,0.4)', 155); });
  reg('car_glass', 32, 1, (c, s) => { noise(c, s, [40, 50, 56], 8, 156); c.fillStyle = 'rgba(200,220,220,0.3)'; c.fillRect(4, 4, 10, 2); });
  reg('tire', 32, 1, (c, s) => { noise(c, s, [30, 30, 30], 10, 157); });
  reg('melon', 32, 1, (c, s) => { noise(c, s, [60, 110, 40], 14, 158); c.fillStyle = 'rgba(20,50,10,0.6)'; for (let i = 0; i < 6; i++) c.fillRect(i * 6, 0, 2, s); });
  reg('saw', 32, 1, (c, s) => { noise(c, s, [150, 154, 156], 10, 159); c.strokeStyle = '#606060'; c.beginPath(); c.arc(16, 16, 6, 0, 7); c.stroke(); });
  reg('puff', 32, 1, (c, s) => { const g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.clearRect(0, 0, s, s); c.fillStyle = g; c.fillRect(0, 0, s, s); }, { alpha: true, clamp: true });
  reg('flare', 32, 1, (c, s) => { const g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.clearRect(0, 0, s, s); c.fillStyle = g; c.fillRect(0, 0, s, s); }, { alpha: true, clamp: true });
  reg('beam', 32, 1, (c, s) => { const g = c.createLinearGradient(0, 0, 0, s); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.clearRect(0, 0, s, s); c.fillStyle = g; c.fillRect(0, 0, s, s); }, { alpha: true, clamp: true });
  reg('decal_bullet', 16, 1, (c, s) => { c.clearRect(0, 0, s, s); const g = c.createRadialGradient(8, 8, 0, 8, 8, 8); g.addColorStop(0, 'rgba(10,10,10,1)'); g.addColorStop(0.4, 'rgba(30,30,30,0.9)'); g.addColorStop(1, 'rgba(40,40,40,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); }, { alpha: true, clamp: true });
  reg('decal_blood', 32, 1, (c, s) => { c.clearRect(0, 0, s, s); const r = H.rng(160); c.fillStyle = 'rgba(90,5,5,0.85)'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(16 + (r() - 0.5) * 16, 16 + (r() - 0.5) * 16, 2 + r() * 6, 0, 7); c.fill(); } }, { alpha: true, clamp: true });
  reg('decal_alienblood', 32, 1, (c, s) => { c.clearRect(0, 0, s, s); const r = H.rng(161); c.fillStyle = 'rgba(170,160,20,0.85)'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(16 + (r() - 0.5) * 16, 16 + (r() - 0.5) * 16, 2 + r() * 6, 0, 7); c.fill(); } }, { alpha: true, clamp: true });
  reg('decal_scorch', 32, 1, (c, s) => { c.clearRect(0, 0, s, s); const g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(0.6, 'rgba(10,10,10,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); }, { alpha: true, clamp: true });

  function faceTex(name, o) {
    reg(name, 32, 1, (c, s) => {
      noise(c, s, o.skin, 10, o.seed || 170);
      if (o.hair) { c.fillStyle = o.hair; c.fillRect(0, 0, s, o.hairH || 7); if (o.long) { c.fillRect(0, 0, 4, 24); c.fillRect(s - 4, 0, 4, 24); } }
      if (o.mask) {
        c.fillStyle = o.mask; c.fillRect(0, 4, s, 26);
        c.fillStyle = o.eyes || '#d0e8ff';
        c.beginPath(); c.arc(10, 13, 4, 0, 7); c.arc(22, 13, 4, 0, 7); c.fill();
        c.fillStyle = '#202020'; c.fillRect(12, 22, 8, 6);
        return;
      }
      if (o.visor) { c.fillStyle = o.visor; c.fillRect(0, 0, s, s); c.fillStyle = o.eyes; c.fillRect(8, 12, 16, 4); c.fillStyle = '#1a1e22'; c.fillRect(10, 22, 12, 6); return; }
      c.fillStyle = '#f0f0f0'; c.fillRect(8, 13, 5, 3); c.fillRect(19, 13, 5, 3);
      c.fillStyle = o.eyeCol || '#30405a'; c.fillRect(10, 13, 2, 3); c.fillRect(21, 13, 2, 3);
      c.fillStyle = o.brow || 'rgba(40,30,20,0.8)'; c.fillRect(7, 11, 7, 1); c.fillRect(18, 11, 7, 1);
      c.fillStyle = 'rgba(120,70,50,0.5)'; c.fillRect(15, 15, 2, 6);
      c.fillStyle = '#7a3a30'; c.fillRect(12, 24, 8, 2);
      if (o.glasses) { c.strokeStyle = '#303030'; c.lineWidth = 1; c.strokeRect(7.5, 11.5, 7, 6); c.strokeRect(17.5, 11.5, 7, 6); c.beginPath(); c.moveTo(14.5, 14); c.lineTo(17.5, 14); c.stroke(); }
      if (o.beard) { c.fillStyle = o.beard; c.fillRect(6, 21, 20, 11); c.fillStyle = '#6a3028'; c.fillRect(12, 24, 8, 2); }
      if (o.stubble) { c.fillStyle = 'rgba(60,50,40,0.35)'; c.fillRect(7, 20, 18, 10); }
      if (o.blood) stains(c, s, 3, 'rgba(140,10,10,0.6)', 171);
    });
  }
  faceTex('face_alyx', { skin: [168, 124, 96], hair: '#1c1612', hairH: 8, long: true, eyeCol: '#3a2a1a', seed: 172 });
  faceTex('face_barney', { skin: [196, 150, 120], hair: '#4a3420', hairH: 5, seed: 173 });
  faceTex('face_kleiner', { skin: [200, 168, 140], hair: '#a8a8a0', hairH: 3, glasses: true, seed: 174 });
  faceTex('face_eli', { skin: [110, 76, 56], hair: '#c8c8c0', hairH: 4, beard: '#d0d0c8', seed: 175 });
  faceTex('face_mossman', { skin: [200, 160, 130], hair: '#3a2a1c', hairH: 8, long: true, seed: 176 });
  faceTex('face_breen', { skin: [196, 164, 140], hair: '#c0c0bc', hairH: 6, beard: '#b8b8b0', seed: 177 });
  faceTex('face_gman', { skin: [188, 160, 140], hair: '#2a2420', hairH: 6, stubble: true, eyeCol: '#2a6a40', seed: 178 });
  faceTex('face_grigori', { skin: [190, 150, 120], hair: '#3a2c20', hairH: 6, beard: '#4a3828', seed: 179 });
  faceTex('face_rebel', { skin: [190, 146, 112], hair: '#5a4028', hairH: 5, stubble: true, seed: 180 });
  faceTex('face_rebel2', { skin: [140, 100, 76], hair: '#1a1a1a', hairH: 4, seed: 181 });
  faceTex('face_citizen', { skin: [200, 156, 124], hair: '#6a4a30', hairH: 5, seed: 182 });
  faceTex('face_zombie', { skin: [150, 120, 100], hair: '#3a2a20', hairH: 3, blood: true, seed: 183 });
  faceTex('face_cop', { skin: [60, 70, 80], mask: '#8a969e', eyes: '#c8e4ff', seed: 184 });
  faceTex('face_soldier', { skin: [60, 70, 80], visor: '#4a5660', eyes: '#80c8ff', seed: 185 });
  faceTex('face_elite', { skin: [200, 200, 200], visor: '#c8ccd0', eyes: '#ff4020', seed: 186 });
  faceTex('face_guard', { skin: [60, 70, 80], visor: '#5a6450', eyes: '#ffb040', seed: 187 });
  faceTex('face_vort', { skin: [120, 130, 90], hair: null, eyeCol: '#c02020', seed: 188 });

  function paint(name) {
    const p = painters[name];
    if (!p || typeof document === 'undefined') return null;
    const cv = document.createElement('canvas');
    cv.width = cv.height = p.size;
    const ctx = cv.getContext('2d');
    p.fn(ctx, p.size);
    return cv;
  }

  function signCanvas(text, bg, fg) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    const c = cv.getContext('2d');
    c.fillStyle = bg; c.fillRect(0, 0, 256, 64);
    c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 3; c.strokeRect(3, 3, 250, 58);
    c.fillStyle = fg;
    let size = 30;
    c.font = `bold ${size}px Arial`;
    while (c.measureText(text).width > 236 && size > 10) { size -= 2; c.font = `bold ${size}px Arial`; }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, 128, 33);
    const img = c.getImageData(0, 0, 256, 64);
    const r = H.rng(text.length * 31 + 7);
    for (let i = 0; i < img.data.length; i += 4) { const n = (r() - 0.5) * 18; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
    c.putImageData(img, 0, 0);
    return cv;
  }

  function skyCanvas(kind, face) {
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const c = cv.getContext('2d');
    const K = {
      city: { top: '#6e7c86', mid: '#9ca8ac', hor: '#b4bab4', city: '#4a5258' },
      dusk: { top: '#3a4658', mid: '#a88a78', hor: '#d0a070', city: '#2a2c34' },
      night: { top: '#0a0e18', mid: '#1c2432', hor: '#2c3440', city: '#0c0e14' },
      coast: { top: '#5c88b4', mid: '#9cc0d8', hor: '#d0dcd8', city: '#6a7878' },
      storm: { top: '#3c4046', mid: '#6a7076', hor: '#8a9090', city: '#303438' },
      citadel: { top: '#1a2028', mid: '#3a4450', hor: '#5a6874', city: '#20262e' },
      void: { top: '#000000', mid: '#000000', hor: '#000000', city: '#000000' }
    }[kind] || { top: '#6e7c86', mid: '#9ca8ac', hor: '#b4bab4', city: '#4a5258' };
    if (face === 'top') {
      c.fillStyle = K.top; c.fillRect(0, 0, S, S);
    } else if (face === 'bottom') {
      c.fillStyle = K.hor; c.fillRect(0, 0, S, S);
    } else {
      const g = c.createLinearGradient(0, 0, 0, S);
      g.addColorStop(0, K.top); g.addColorStop(0.45, K.mid); g.addColorStop(0.5, K.hor); g.addColorStop(1, K.hor);
      c.fillStyle = g; c.fillRect(0, 0, S, S);
    }
    if (face !== 'bottom' && kind !== 'void') {
      const r = H.rng(kind.length * 13 + face.length * 7);
      for (let i = 0; i < 18; i++) {
        const x = r() * S, y = face === 'top' ? r() * S : r() * S * 0.4, w = 40 + r() * 90;
        const gg = c.createRadialGradient(x, y, 0, x, y, w);
        gg.addColorStop(0, kind === 'night' ? 'rgba(60,70,90,0.25)' : 'rgba(230,232,236,0.28)');
        gg.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = gg; c.fillRect(0, 0, S, S);
      }
      if (kind === 'night') { c.fillStyle = '#c8d0e0'; for (let i = 0; i < 60; i++) c.fillRect(r() * S, r() * S * (face === 'top' ? 1 : 0.45), 1, 1); }
    }
    if (face !== 'top' && face !== 'bottom' && ['city', 'dusk', 'night', 'storm', 'citadel'].includes(kind)) {
      const r = H.rng(face.length * 97 + 3);
      c.fillStyle = K.city;
      let x = 0;
      while (x < S) {
        const w = 8 + r() * 26, h = 10 + r() * 34;
        c.fillRect(x, S / 2 - h, w, h + S / 2);
        if (kind === 'night' || kind === 'dusk') { c.fillStyle = 'rgba(230,200,120,0.6)'; for (let k = 0; k < 4; k++) c.fillRect(x + 2 + r() * (w - 4), S / 2 - h + 3 + r() * (h - 4), 1, 1); c.fillStyle = K.city; }
        x += w + r() * 3;
      }
    }
    if (face === 'north' && ['city', 'dusk', 'night', 'storm', 'citadel'].includes(kind)) {
      c.fillStyle = kind === 'night' ? '#141a22' : '#3a444c';
      c.beginPath(); c.moveTo(116, S / 2 + 2); c.lineTo(122, 12); c.lineTo(128, 0); c.lineTo(134, 14); c.lineTo(140, S / 2 + 2); c.fill();
      c.fillStyle = 'rgba(120,200,255,0.8)'; c.fillRect(127, 4, 2, 2);
      c.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 20; y < S / 2; y += 8) c.fillRect(120, y, 20, 1);
    }
    if (face !== 'top' && face !== 'bottom' && kind === 'coast') {
      c.fillStyle = '#7a8a86';
      c.beginPath(); c.moveTo(0, S / 2 + 2);
      const r = H.rng(face.length * 5);
      for (let x = 0; x <= S; x += 16) c.lineTo(x, S / 2 - 4 - r() * 18);
      c.lineTo(S, S / 2 + 2); c.fill();
    }
    return cv;
  }

  H.Tex = { painters, worldSize, flags, paint, signCanvas, skyCanvas };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
