(function () {
  const { rand } = window.P3D;
  const { PI, S, C } = window.YouVidKit;

  function tiled(w, h, x, y, fn) {
    [-w, 0, w].forEach(dx => [-h, 0, h].forEach(dy => fn(x + dx, y + dy)));
  }

  function blob(ctx, x, y, rx, ry, a, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), a, 0, PI * 2);
    ctx.fill();
  }

  function sprig(ctx, x, y, ang, s, stem, leaf, flower) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.strokeStyle = stem;
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 0.35, -s * 0.5, s * 0.2, -s * 1.1);
    ctx.stroke();
    for (let k = 0; k < 5; k++) {
      const u = 0.15 + k * 0.17;
      const px = s * 0.35 * 2 * u * (1 - u) + s * 0.2 * u * u, py = -s * 1.1 * u;
      const side = k % 2 ? 1 : -1;
      blob(ctx, px + side * s * 0.13, py, s * 0.16, s * 0.065, side * 0.7, leaf);
    }
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * PI * 2;
      blob(ctx, s * 0.2 + C(a) * s * 0.09, -s * 1.15 + S(a) * s * 0.09, s * 0.075, s * 0.075, 0, flower);
    }
    blob(ctx, s * 0.2, -s * 1.15, s * 0.04, s * 0.04, 0, 'rgba(250, 236, 200, 0.9)');
    ctx.restore();
  }

  function wallpaper(base, stem, leaf, flower, seed, count, size) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        blob(ctx, g() * w, g() * h, 6 + g() * 18, 4 + g() * 10, g() * PI, g() < 0.5 ? 'rgba(120, 100, 80, 0.035)' : 'rgba(255, 255, 255, 0.05)');
      }
      for (let i = 0; i < count; i++) {
        const x = g() * w, y = g() * h, a = (g() - 0.5) * 1.8, s = size * (0.75 + g() * 0.5);
        tiled(w, h, x, y, (px, py) => sprig(ctx, px, py, a, s, stem, leaf, flower));
      }
    };
  }

  const lilacPaper = wallpaper('#ebe5dc', 'rgba(96, 104, 96, 0.8)', 'rgba(118, 128, 116, 0.82)', 'rgba(132, 108, 170, 0.88)', 31, 14, 40);
  const beigePaper = wallpaper('#d6ccb8', 'rgba(130, 124, 104, 0.6)', 'rgba(150, 146, 124, 0.62)', 'rgba(176, 164, 140, 0.7)', 47, 12, 42);
  const camPaper = wallpaper('#e6dfd2', 'rgba(110, 116, 110, 0.6)', 'rgba(140, 146, 136, 0.66)', 'rgba(150, 132, 176, 0.7)', 53, 12, 38);

  function planks(base, seed, rows, cols, dark) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      const bw = w / cols, bh = h / rows;
      for (let j = 0; j < rows; j++) {
        const shift = (j % 2) * bw * 0.5;
        for (let i = -1; i < cols; i++) {
          const tone = 0.84 + g() * 0.3;
          const c = base.match(/\w\w/g).map(v => Math.round(parseInt(v, 16) * tone));
          ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
          ctx.fillRect(i * bw + shift + 1, j * bh + 1, bw - 1, bh - 1);
          ctx.strokeStyle = dark;
          ctx.lineWidth = 1;
          for (let k = 0; k < 3; k++) {
            const yy = j * bh + 2 + g() * (bh - 4);
            ctx.beginPath();
            ctx.moveTo(i * bw + shift + 2, yy);
            ctx.lineTo(i * bw + shift + bw - 2, yy + (g() - 0.5) * 3);
            ctx.stroke();
          }
        }
      }
    };
  }

  const parquet = planks('#c9a06a', 61, 8, 2, 'rgba(120, 80, 40, 0.18)');
  const laminate = planks('#a86a36', 67, 6, 2, 'rgba(70, 36, 10, 0.22)');

  function lace(ctx, w, h) {
    const g = rand(71);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(250, 248, 242, 1)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    const step = w / 16;
    for (let j = 0; j < 32; j++) {
      for (let i = 0; i < 16; i++) {
        if (g() < 0.42) continue;
        const r = step * (0.18 + g() * 0.16);
        ctx.beginPath();
        ctx.arc((i + 0.5 + (j % 2) * 0.5) * step, (j + 0.5) * (h / 32), r, 0, PI * 2);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(214, 206, 190, 1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const x = g() * w, y = g() * h;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + C(a) * 7, y + S(a) * 7, 5, 2.6, a, 0, PI * 2);
        ctx.stroke();
      }
    }
    for (let x = 0; x < w; x += 4) {
      ctx.fillStyle = `rgba(190, 180, 160, ${0.25 + 0.25 * S((x / w) * PI * 10)})`;
      ctx.fillRect(x, 0, 1, h);
    }
  }

  function laceSoft(ctx, w, h) {
    const g = rand(73);
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x++) {
      const k = Math.pow(0.5 + 0.5 * S((x / w) * PI * 6), 2);
      ctx.fillStyle = `rgba(150, 140, 120, ${0.04 + k * 0.16})`;
      ctx.fillRect(x, 0, 1, h);
    }
    ctx.strokeStyle = 'rgba(190, 180, 160, 0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const x = g() * w, y = g() * h, s = 6 + g() * 8;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + C(a) * s, y + S(a) * s, s * 0.7, s * 0.35, a, 0, PI * 2);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(200, 190, 170, 0.6)';
    for (let x = 0; x < w; x += 16) {
      ctx.beginPath();
      ctx.arc(x + 8, h - 10, 7, 0, PI);
      ctx.fill();
    }
  }

  function tulle(ctx, w, h) {
    ctx.fillStyle = '#f2f0ea';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x++) {
      const k = Math.pow(0.5 + 0.5 * S((x / w) * PI * 12), 2);
      ctx.fillStyle = `rgba(150, 146, 136, ${0.05 + k * 0.22})`;
      ctx.fillRect(x, 0, 1, h);
    }
    ctx.fillStyle = 'rgba(160, 150, 130, 0.35)';
    for (let y = h * 0.62; y < h * 0.7; y += 6) ctx.fillRect(0, y, w, 2);
  }

  function poppies(base, seed, n) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) blob(ctx, g() * w, g() * h, 10 + g() * 30, 4 + g() * 10, g() * PI, 'rgba(110, 100, 90, 0.07)');
      for (let i = 0; i < n; i++) {
        const x = g() * w, y = g() * h, s = w * (0.05 + g() * 0.04), a = g() * PI;
        tiled(w, h, x, y, (px, py) => {
          blob(ctx, px + s * 0.9, py + s * 0.5, s * 0.9, s * 0.18, a + 0.6, 'rgba(96, 136, 86, 0.75)');
          for (let k = 0; k < 4; k++) {
            const b = a + (k / 4) * PI * 2;
            blob(ctx, px + C(b) * s * 0.35, py + S(b) * s * 0.35, s * 0.55, s * 0.4, b, k % 2 ? '#c8242c' : '#d83a3a');
          }
          blob(ctx, px, py, s * 0.18, s * 0.18, 0, '#3a1a1c');
        });
      }
    };
  }

  const poppySheet = poppies('#efe8da', 83, 9);

  function leafSheet(ctx, w, h) {
    const g = rand(89);
    ctx.fillStyle = '#eef0e6';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const x = g() * w, y = g() * h, a = g() * PI, s = 10 + g() * 14;
      tiled(w, h, x, y, (px, py) => {
        blob(ctx, px, py, s, s * 0.32, a, 'rgba(150, 186, 120, 0.7)');
        blob(ctx, px + C(a) * s * 0.9, py + S(a) * s * 0.9, s * 0.6, s * 0.2, a + 0.5, 'rgba(176, 200, 140, 0.6)');
      });
    }
    for (let i = 0; i < 60; i++) blob(ctx, g() * w, g() * h, 8 + g() * 22, 2 + g() * 4, g() * PI, 'rgba(120, 120, 110, 0.12)');
  }

  function carpet(base, ink, seed) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = ink;
      ctx.lineWidth = w * 0.04;
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const x = g() * w, y = g() * h, r = w * (0.08 + g() * 0.08), a0 = g() * PI * 2;
        tiled(w, h, x, y, (px, py) => {
          ctx.beginPath();
          ctx.arc(px, py, r, a0, a0 + PI * 1.4);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(px + C(a0) * r * 1.6, py + S(a0) * r * 1.6, r * 0.5, a0 + PI, a0 + PI * 2.3);
          ctx.stroke();
          blob(ctx, px - C(a0) * r * 0.9, py - S(a0) * r * 0.9, r * 0.45, r * 0.22, a0, ink);
        });
      }
      ctx.strokeStyle = ink;
      ctx.lineWidth = w * 0.02;
      ctx.strokeRect(w * 0.03, h * 0.03, w * 0.94, h * 0.94);
    };
  }

  const carpetBlue = carpet('#1c2a4a', 'rgba(214, 200, 168, 0.9)', 97);
  const carpetBlack = carpet('#16120e', 'rgba(204, 168, 120, 0.9)', 101);
  const carpetRed = carpet('#7a2a22', 'rgba(220, 196, 150, 0.85)', 103);

  function canyon(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#e8742a');
    sky.addColorStop(0.6, '#d4501e');
    sky.addColorStop(1, '#9a2416');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 196, 96, 0.55)';
    ctx.beginPath();
    ctx.arc(w * 0.42, h * 0.3, w * 0.36, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1210';
    ctx.beginPath();
    ctx.ellipse(w * 0.44, h * 0.15, w * 0.3, h * 0.03, -0.1, 0, PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.31, h * 0.07, w * 0.26, h * 0.08);
    ctx.fillStyle = '#d29a74';
    ctx.beginPath();
    ctx.ellipse(w * 0.44, h * 0.24, w * 0.12, h * 0.08, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1a12';
    ctx.beginPath();
    ctx.ellipse(w * 0.44, h * 0.29, w * 0.1, h * 0.04, 0, 0, PI);
    ctx.fill();
    ctx.fillStyle = '#7a1c14';
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h);
    ctx.lineTo(w * 0.2, h * 0.38);
    ctx.lineTo(w * 0.44, h * 0.33);
    ctx.lineTo(w * 0.7, h * 0.4);
    ctx.lineTo(w * 0.78, h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#141010';
    ctx.lineWidth = w * 0.04;
    ctx.beginPath();
    ctx.moveTo(w * 0.24, h * 0.42);
    ctx.lineTo(w * 0.62, h * 0.66);
    ctx.stroke();
    ctx.fillStyle = '#4e4e54';
    ctx.fillRect(w * 0.02, h * 0.33, w * 0.24, h * 0.035);
    ctx.fillStyle = '#d29a74';
    ctx.beginPath();
    ctx.arc(w * 0.24, h * 0.35, w * 0.055, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16100e';
    ctx.fillRect(w * 0.84, 0, w * 0.16, h);
    ctx.save();
    ctx.translate(w * 0.95, h * 0.03);
    ctx.rotate(PI / 2);
    ctx.fillStyle = '#f0e6d4';
    ctx.font = `bold ${Math.round(w * 0.09)}px Georgia, serif`;
    ctx.fillText('ДИКИЙ КАНЬОН', 0, 0);
    ctx.restore();
  }

  function banner(ctx, w, h) {
    ctx.fillStyle = '#8e1a14';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    g.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a0e0c';
    ctx.beginPath();
    ctx.ellipse(w * 0.55, h * 0.12, w * 0.32, h * 0.02, -0.2, 0, PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.42, h * 0.06, w * 0.24, h * 0.06);
    ctx.fillStyle = '#c47a5a';
    ctx.beginPath();
    ctx.ellipse(w * 0.54, h * 0.18, w * 0.13, h * 0.05, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c8a8';
    ctx.fillRect(w * 0.08, h * 0.22, w * 0.5, h * 0.03);
    ctx.fillStyle = '#1a0e0c';
    for (let i = 0; i < 6; i++) {
      const x = w * (0.1 + i * 0.15), y = h * 0.72;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.05, y - h * 0.08);
      ctx.lineTo(x + w * 0.1, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(x + w * 0.03, y - h * 0.12, w * 0.04, h * 0.05);
    }
    ctx.fillStyle = '#f0e2cc';
    ctx.font = `bold ${Math.round(w * 0.2)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ДИКИЙ', w / 2, h * 0.86);
    ctx.fillText('КАНЬОН', w / 2, h * 0.94);
  }

  function fanArt(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.96, R = w * 0.48;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, PI, PI * 2);
    ctx.closePath();
    ctx.clip();
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#2a3e72');
    sky.addColorStop(0.6, '#d8a050');
    sky.addColorStop(1, '#7a4a24');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a2a1e';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.lineTo(w * 0.3, h * 0.42);
    ctx.lineTo(w * 0.48, h * 0.6);
    ctx.lineTo(w * 0.7, h * 0.36);
    ctx.lineTo(w, h * 0.66);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.fillStyle = '#f2ecd8';
    for (let i = 0; i < 3; i++) blob(ctx, w * (0.3 + i * 0.15), h * (0.3 + i * 0.05), w * 0.05, h * 0.015, -0.3, '#f2ecd8');
    ctx.strokeStyle = 'rgba(80, 50, 20, 0.7)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 14; i++) {
      const a = PI + (i / 14) * PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + C(a) * R, cy + S(a) * R);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#e4c060';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.3, PI, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c89a38';
    ctx.lineWidth = w * 0.02;
    ctx.beginPath();
    ctx.arc(cx, cy, R, PI, PI * 2);
    ctx.stroke();
  }

  function text(ctx, str, x, y, font, fill, align) {
    ctx.font = font;
    ctx.fillStyle = fill;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(str, x, y);
  }

  function ljFront(ctx, w, h) {
    ctx.fillStyle = '#f2f1ec';
    ctx.fillRect(0, 0, w, h);
    const x0 = w * 0.04, y0 = h * 0.06, x1 = w * 0.96, y1 = h * 0.8;
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#7e3428');
    g.addColorStop(1, '#5c2018');
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    text(ctx, 'LJ UHD TV', w * 0.08, h * 0.25, `bold ${Math.round(h * 0.13)}px Arial, sans-serif`, '#f6f2ee');
    ctx.fillStyle = '#d8d4d0';
    ctx.fillRect(w * 0.43, h * 0.13, w * 0.055, h * 0.1);
    text(ctx, 'AI', w * 0.457, h * 0.205, `bold ${Math.round(h * 0.06)}px Arial, sans-serif`, '#5c2018', 'center');
    text(ctx, 'ThinkQ', w * 0.5, h * 0.17, `bold italic ${Math.round(h * 0.05)}px Arial, sans-serif`, '#f6f2ee');
    text(ctx, '49UJ63', w * 0.08, h * 0.33, `bold ${Math.round(h * 0.04)}px Arial, sans-serif`, '#eadcd4');
    ['AI TV', 'IPS Display', '4K Active HDR', 'Ultra Surround'].forEach((s, i) => text(ctx, '· ' + s, w * 0.09, h * (0.42 + i * 0.05), `${Math.round(h * 0.03)}px Arial, sans-serif`, '#eadcd4'));
    text(ctx, '49', w * 0.89, h * 0.3, `italic 300 ${Math.round(h * 0.2)}px Arial, sans-serif`, '#f6f2ee', 'right');
    text(ctx, '123 см / 49', w * 0.9, h * 0.37, `bold italic ${Math.round(h * 0.04)}px Arial, sans-serif`, '#f6f2ee', 'right');
    ctx.fillStyle = '#2a2622';
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.72);
    ctx.quadraticCurveTo(w * 0.5, h * 0.69, w * 0.72, h * 0.72);
    ctx.lineTo(w * 0.72, h * 0.735);
    ctx.quadraticCurveTo(w * 0.5, h * 0.71, w * 0.3, h * 0.735);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(w * 0.48, 0, w * 0.035, h * 0.78);
    ctx.fillStyle = 'rgba(120, 110, 100, 0.5)';
    ctx.fillRect(w * 0.06, h * 0.86, w * 0.12, h * 0.03);
    ctx.fillRect(w * 0.82, h * 0.86, w * 0.1, h * 0.03);
  }

  function cardboard(ctx, w, h) {
    const g = rand(113);
    ctx.fillStyle = '#c8a878';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) blob(ctx, g() * w, g() * h, 1 + g() * 3, 1, 0, g() < 0.5 ? 'rgba(90, 60, 30, 0.12)' : 'rgba(255, 240, 210, 0.12)');
    ctx.fillStyle = 'rgba(80, 50, 20, 0.1)';
    for (let x = 0; x < w; x += 6) ctx.fillRect(x, 0, 2, h);
  }

  function samsongFace(ctx, w, h) {
    ctx.fillStyle = '#eceae4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1d2a6e';
    ctx.fillRect(0, 0, w, h * 0.12);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    g.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h * 0.12);
    ctx.save();
    ctx.scale(1.25, 1);
    text(ctx, 'SAMSONG', w * 0.1 / 1.25, h * 0.095, `bold ${Math.round(h * 0.07)}px Arial, sans-serif`, '#f4f4f4');
    text(ctx, 'SAMSONG', w * 0.62 / 1.25, h * 0.095, `bold ${Math.round(h * 0.07)}px Arial, sans-serif`, '#f4f4f4');
    ctx.restore();
    ctx.fillStyle = '#1e2236';
    ctx.fillRect(0, h * 0.14, w, h * 0.66);
    ctx.save();
    ctx.scale(1.2, 1);
    text(ctx, 'SAMSONG', w * 0.05 / 1.2, h * 0.24, `bold ${Math.round(h * 0.05)}px Arial, sans-serif`, '#d8dae4');
    ctx.restore();
    const feats = [['BEZELESS', 'DESIGN'], ['One Remote', 'FUNCTION'], ['4K ULTRA HD', 'CONNECTED']];
    feats.forEach(([a, b], i) => {
      const x = w * (0.32 + i * 0.2);
      text(ctx, a, x, h * 0.25, `bold ${Math.round(h * 0.03)}px Arial, sans-serif`, '#e4e4ea', 'center');
      text(ctx, b, x, h * 0.29, `bold ${Math.round(h * 0.026)}px Arial, sans-serif`, '#c8c8d2', 'center');
      ctx.fillStyle = 'rgba(220, 220, 230, 0.4)';
      for (let k = 0; k < 4; k++) ctx.fillRect(x - w * 0.06, h * (0.33 + k * 0.025), w * 0.12 * (0.7 + 0.3 * ((k + i) % 2)), h * 0.008);
      if (i < 2) ctx.fillRect(x + w * 0.1, h * 0.22, 2, h * 0.08);
    });
    ctx.strokeStyle = 'rgba(220, 220, 230, 0.75)';
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.12, h * 0.42, w * 0.11, h * 0.06);
    text(ctx, 'HDMI', w * 0.84, h * 0.27, `bold ${Math.round(h * 0.035)}px Arial, sans-serif`, '#e4e4ea', 'center');
    text(ctx, 'Crystal UHD', w * 0.04, h * 0.72, `bold ${Math.round(h * 0.2)}px Arial, sans-serif`, '#f2f0ea');
    text(ctx, 'Smart TV', w * 0.74, h * 0.6, `bold italic ${Math.round(h * 0.04)}px Arial, sans-serif`, '#f2f0ea');
    text(ctx, 'powered by TIZER', w * 0.74, h * 0.64, `bold ${Math.round(h * 0.022)}px Arial, sans-serif`, '#d8d8e0');
    ctx.fillStyle = 'rgba(220, 220, 230, 0.35)';
    for (let k = 0; k < 3; k++) ctx.fillRect(w * 0.74, h * (0.67 + k * 0.02), w * 0.2, h * 0.007);
    for (let k = 0; k < 9; k++) {
      ctx.fillStyle = k % 2 ? '#d6d2c8' : '#f2f0ea';
      ctx.fillRect(0, h * (0.8 + k * 0.016), w, h * 0.016);
    }
    text(ctx, '7 SERIES   TV7090 CLASS', w * 0.06, h * 0.97, `${Math.round(h * 0.035)}px Arial, sans-serif`, '#5a5a62');
    text(ctx, '65', w * 0.62, h * 0.97, `${Math.round(h * 0.035)}px Arial, sans-serif`, '#5a5a62');
  }

  function samsongEnd(ctx, w, h) {
    ctx.fillStyle = '#1e2236';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1d2a6e';
    ctx.fillRect(0, 0, w, h * 0.2);
    ctx.save();
    ctx.translate(w * 0.5, h * 0.6);
    ctx.rotate(-PI / 2);
    text(ctx, 'Crystal UHD', 0, w * 0.12, `bold ${Math.round(w * 0.34)}px Arial, sans-serif`, '#f2f0ea', 'center');
    ctx.restore();
  }

  function screenOff(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#2a2a30');
    g.addColorStop(0.45, '#0c0c10');
    g.addColorStop(1, '#16161c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.moveTo(w * 0.1, 0);
    ctx.lineTo(w * 0.35, 0);
    ctx.lineTo(w * 0.15, h);
    ctx.lineTo(0, h);
    ctx.fill();
  }

  function screenGame(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    sky.addColorStop(0, '#4aa8e8');
    sky.addColorStop(1, '#bfe6f8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8a9aa8';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.55);
    ctx.lineTo(w * 0.3, h * 0.4);
    ctx.lineTo(w * 0.55, h * 0.5);
    ctx.lineTo(w * 0.8, h * 0.38);
    ctx.lineTo(w, h * 0.5);
    ctx.lineTo(w, h * 0.6);
    ctx.lineTo(0, h * 0.6);
    ctx.fill();
    ctx.fillStyle = '#d2d6da';
    ctx.fillRect(0, h * 0.58, w, h * 0.42);
    ctx.fillStyle = '#5a5e66';
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h * 0.58);
    ctx.lineTo(w * 0.58, h * 0.58);
    ctx.lineTo(w * 1.1, h);
    ctx.lineTo(-w * 0.1, h);
    ctx.fill();
    ctx.fillStyle = '#e2408a';
    ctx.fillRect(w * 0.55, h * 0.72, w * 0.3, h * 0.06);
    ctx.fillStyle = '#2a6a3a';
    ctx.fillRect(w * 0.22, h * 0.42, w * 0.3, h * 0.24);
    ctx.fillStyle = '#e8e8ea';
    ctx.fillRect(w * 0.3, h * 0.36, w * 0.18, h * 0.12);
    ctx.fillStyle = '#16181c';
    ctx.fillRect(w * 0.24, h * 0.64, w * 0.07, h * 0.06);
    ctx.fillRect(w * 0.43, h * 0.64, w * 0.07, h * 0.06);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(w * 0.04, h * 0.05, w * 0.18, h * 0.04);
    ctx.fillRect(w * 0.78, h * 0.05, w * 0.16, h * 0.06);
  }

  function screenBlue(ctx, w, h) {
    const g = ctx.createRadialGradient(w * 0.45, h * 0.5, 0, w * 0.45, h * 0.5, w * 0.7);
    g.addColorStop(0, '#9ee6ff');
    g.addColorStop(0.4, '#2a8ad8');
    g.addColorStop(1, '#0a2a6a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(220, 250, 255, 0.7)';
    ctx.lineWidth = w * 0.01;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(w * 0.45, h * 0.55, w * (0.1 + i * 0.07), -1.2 + i * 0.2, 0.4 + i * 0.3);
      ctx.stroke();
    }
  }

  function screenStream(ctx, w, h) {
    ctx.fillStyle = '#1c1e24';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4a5464';
    ctx.fillRect(w * 0.04, h * 0.08, w * 0.56, h * 0.5);
    ctx.fillStyle = '#8a7a62';
    ctx.fillRect(w * 0.06, h * 0.1, w * 0.52, h * 0.46);
    ctx.fillStyle = '#c2482e';
    ctx.fillRect(w * 0.1, h * 0.3, w * 0.12, h * 0.24);
    ctx.fillStyle = '#2e3644';
    ctx.fillRect(w * 0.64, h * 0.08, w * 0.32, h * 0.84);
    ctx.fillStyle = '#7ab0e8';
    for (let i = 0; i < 9; i++) ctx.fillRect(w * 0.66, h * (0.12 + i * 0.08), w * (0.12 + (i % 3) * 0.05), h * 0.03);
    ctx.fillStyle = '#3a3e48';
    ctx.fillRect(w * 0.04, h * 0.64, w * 0.56, h * 0.28);
    ctx.fillStyle = '#58c060';
    ctx.fillRect(w * 0.06, h * 0.7, w * 0.3, h * 0.04);
  }

  function board(ctx, w, h) {
    ctx.fillStyle = '#f4f4f2';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(120, 130, 150, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.3);
    ctx.quadraticCurveTo(w * 0.3, h * 0.2, w * 0.5, h * 0.35);
    ctx.stroke();
    ctx.strokeStyle = '#9aa0a8';
    ctx.lineWidth = w * 0.03;
    ctx.strokeRect(0, 0, w, h);
  }

  function smiley(ctx, w, h) {
    ctx.fillStyle = '#f2e23a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a2414';
    blob(ctx, w * 0.36, h * 0.38, w * 0.05, h * 0.1, 0, '#2a2414');
    blob(ctx, w * 0.64, h * 0.38, w * 0.05, h * 0.1, 0, '#2a2414');
    ctx.strokeStyle = '#2a2414';
    ctx.lineWidth = w * 0.04;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.48, w * 0.24, 0.3, PI - 0.3);
    ctx.stroke();
  }

  function treeNeedles(ctx, w, h) {
    const g = rand(127);
    ctx.fillStyle = '#16301e';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      ctx.strokeStyle = g() < 0.5 ? 'rgba(40, 90, 60, 0.9)' : 'rgba(24, 60, 40, 0.9)';
      ctx.lineWidth = 1;
      const x = g() * w, y = g() * h, a = PI * 0.5 + (g() - 0.5) * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + C(a) * 6, y + S(a) * 6);
      ctx.stroke();
    }
  }

  function gameCase(ctx, w, h) {
    ctx.fillStyle = '#1a4ec0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(0, 0, w, h * 0.12);
    ctx.fillStyle = '#2a2a30';
    ctx.fillRect(w * 0.08, h * 0.2, w * 0.84, h * 0.6);
    ctx.fillStyle = '#d8b040';
    ctx.fillRect(w * 0.2, h * 0.3, w * 0.6, h * 0.12);
  }

  function chrome(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f0f2f4');
    g.addColorStop(0.5, '#9aa0a8');
    g.addColorStop(1, '#d8dce0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a2c30';
    [0.22, 0.78].forEach(x => {
      ctx.beginPath();
      ctx.arc(w * x, h * 0.55, h * 0.3, 0, PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#5a5e66';
    ctx.fillRect(w * 0.4, h * 0.3, w * 0.2, h * 0.3);
  }

  function shelfToys(ctx, w, h) {
    ctx.fillStyle = '#3a2418';
    ctx.fillRect(0, 0, w, h);
    const g = rand(131);
    for (let i = 0; i < 9; i++) {
      const x = w * (0.04 + i * 0.105), hh = h * (0.4 + g() * 0.5);
      ctx.fillStyle = ['#e8e4dc', '#2a3a6a', '#c8a040', '#a02a24', '#1c1c20'][i % 5];
      ctx.fillRect(x, h - hh, w * 0.08, hh);
      blob(ctx, x + w * 0.04, h - hh - h * 0.06, w * 0.035, h * 0.06, 0, '#e2c4a8');
    }
  }

  window.OzonArt = {
    lilacPaper, beigePaper, camPaper, parquet, laminate, lace, laceSoft, tulle, poppySheet, leafSheet,
    carpetBlue, carpetBlack, carpetRed, canyon, banner, fanArt, ljFront, cardboard, samsongFace, samsongEnd,
    screenOff, screenGame, screenBlue, screenStream, board, smiley, treeNeedles, gameCase, chrome, shelfToys
  };
})();
