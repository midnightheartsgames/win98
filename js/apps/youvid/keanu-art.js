(function () {
  const W = 640;
  const H = 360;

  const FACES = {
    closeA: { x: 330, y: 168, s: 176, mouth: [330, 168 + 0.4 * 176, 0.2 * 176], mood: 'stern' },
    closeB: { x: 340, y: 178, s: 196, mouth: [340, 178 + 0.4 * 196, 0.2 * 196], mood: 'stern' },
    closeC: { x: 320, y: 172, s: 184, mouth: [320, 172 + 0.4 * 184, 0.2 * 184], mood: 'sly', tilt: -0.04 },
    desk: { x: 420, y: 168, s: 150, mouth: [420, 168 + 0.4 * 150, 0.22 * 150], mood: 'smile', tilt: 0.03 }
  };

  function blob(ctx, x, y, rx, ry, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function gradient(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([p, c]) => g.addColorStop(p, c));
    return g;
  }

  function bokeh(ctx, spots, color) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    spots.forEach(([x, y, rx, ry, a]) => blob(ctx, x, y, rx, ry, `rgba(255,248,225,${a})`));
    ctx.restore();
  }

  function face(ctx, o) {
    const { x, y, s, mood } = o;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(o.tilt || 0);
    const fw = s * 0.5;
    const fh = s * 0.64;
    ctx.fillStyle = '#17141a';
    ctx.beginPath();
    ctx.moveTo(-fw * 1.9, fh * 2.2);
    ctx.quadraticCurveTo(-fw * 1.6, fh * 1.05, -fw * 0.55, fh * 0.9);
    ctx.lineTo(fw * 0.55, fh * 0.9);
    ctx.quadraticCurveTo(fw * 1.6, fh * 1.05, fw * 1.9, fh * 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2b2018';
    ctx.beginPath();
    ctx.moveTo(-fw * 1.18, fh * 0.2);
    ctx.quadraticCurveTo(-fw * 1.55, -fh * 1.05, 0, -fh * 1.18);
    ctx.quadraticCurveTo(fw * 1.55, -fh * 1.05, fw * 1.18, fh * 0.2);
    ctx.quadraticCurveTo(fw * 1.3, fh * 1.0, fw * 0.95, fh * 1.25);
    ctx.lineTo(-fw * 0.95, fh * 1.25);
    ctx.quadraticCurveTo(-fw * 1.3, fh * 1.0, -fw * 1.18, fh * 0.2);
    ctx.fill();
    ctx.fillStyle = '#b08462';
    ctx.fillRect(-fw * 0.34, fh * 0.55, fw * 0.68, fh * 0.55);
    ctx.fillStyle = 'rgba(40,22,14,0.35)';
    ctx.fillRect(-fw * 0.34, fh * 0.55, fw * 0.68, fh * 0.16);
    const skin = gradient(ctx, -fw, -fh, fw, fh, [[0, '#d9a883'], [0.55, '#c4916c'], [1, '#a77654']]);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(0, 0, fw, fh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, fw, fh, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = gradient(ctx, 0, fh * 0.02, 0, fh * 1.0, [[0, 'rgba(48,38,34,0)'], [0.45, 'rgba(48,38,34,0.38)'], [1, 'rgba(36,28,26,0.88)']]);
    ctx.fillRect(-fw, fh * 0.02, fw * 2, fh);
    ctx.fillStyle = 'rgba(48,38,34,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, fh * 0.1, fw * 0.36, fh * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#2b2018';
    ctx.beginPath();
    ctx.moveTo(-fw * 1.05, fh * 0.1);
    ctx.quadraticCurveTo(-fw * 1.2, -fh * 0.95, 0, -fh * 1.02);
    ctx.quadraticCurveTo(fw * 1.2, -fh * 0.95, fw * 1.05, fh * 0.1);
    ctx.quadraticCurveTo(fw * 0.82, -fh * 0.5, fw * 0.1, -fh * 0.58);
    ctx.quadraticCurveTo(-fw * 0.6, -fh * 0.52, -fw * 0.82, fh * 0.1);
    ctx.fill();
    const eyeY = -fh * 0.14;
    const squint = mood === 'smile' ? 0.55 : mood === 'sly' ? 0.7 : 1;
    [-1, 1].forEach(side => {
      const ex = side * fw * 0.4;
      ctx.fillStyle = 'rgba(40,24,18,0.5)';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY + fh * 0.02, fw * 0.24, fh * 0.07 * squint + 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e9e1d6';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, fw * 0.17, fh * 0.045 * squint + 1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a1a12';
      ctx.beginPath();
      ctx.ellipse(ex + side * fw * 0.01, eyeY, fw * 0.075, fh * 0.045 * squint + 1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1f1612';
      ctx.lineWidth = Math.max(2, s * 0.022);
      ctx.beginPath();
      const lift = mood === 'sly' && side > 0 ? -fh * 0.05 : 0;
      ctx.moveTo(ex - side * fw * 0.22, eyeY - fh * 0.12 + lift);
      ctx.quadraticCurveTo(ex, eyeY - fh * 0.17 + lift, ex + side * fw * 0.24, eyeY - fh * 0.1 + lift + (mood === 'stern' ? fh * 0.03 : 0));
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(70,40,26,0.55)';
    ctx.lineWidth = Math.max(1.5, s * 0.016);
    ctx.beginPath();
    ctx.moveTo(-fw * 0.06, eyeY + fh * 0.05);
    ctx.quadraticCurveTo(-fw * 0.14, fh * 0.12, -fw * 0.16, fh * 0.2);
    ctx.quadraticCurveTo(0, fh * 0.26, fw * 0.14, fh * 0.2);
    ctx.stroke();
    const my = fh * 0.4;
    ctx.fillStyle = '#4a2a24';
    if (mood === 'smile') {
      ctx.beginPath();
      ctx.moveTo(-fw * 0.3, my - fh * 0.03);
      ctx.quadraticCurveTo(0, my + fh * 0.12, fw * 0.3, my - fh * 0.03);
      ctx.quadraticCurveTo(0, my + fh * 0.03, -fw * 0.3, my - fh * 0.03);
      ctx.fill();
      ctx.fillStyle = '#e8dfd2';
      ctx.fillRect(-fw * 0.2, my + fh * 0.005, fw * 0.4, fh * 0.025);
    } else {
      ctx.strokeStyle = '#3a2220';
      ctx.lineWidth = Math.max(2, s * 0.022);
      ctx.beginPath();
      ctx.moveTo(-fw * 0.22, my);
      ctx.quadraticCurveTo(0, my + (mood === 'sly' ? -fh * 0.01 : fh * 0.02), fw * 0.22, my + (mood === 'sly' ? -fh * 0.04 : 0));
      ctx.stroke();
    }
    ctx.restore();
  }

  function clothes(ctx, o) {
    ctx.fillStyle = o.fill;
    ctx.beginPath();
    ctx.moveTo(o.x - o.w, H + 10);
    ctx.quadraticCurveTo(o.x - o.w * 0.8, o.y + 20, o.x - o.w * 0.2, o.y);
    ctx.lineTo(o.x + o.w * 0.2, o.y);
    ctx.quadraticCurveTo(o.x + o.w * 0.8, o.y + 20, o.x + o.w, H + 10);
    ctx.closePath();
    ctx.fill();
  }

  function paintClose(ctx, key, palette) {
    ctx.fillStyle = gradient(ctx, 0, 0, W, H, palette.bg);
    ctx.fillRect(0, 0, W, H);
    bokeh(ctx, palette.lights, palette.glow);
    ctx.fillStyle = 'rgba(8,10,18,0.28)';
    ctx.fillRect(0, 0, W, H);
    const f = FACES[key];
    clothes(ctx, { x: f.x, y: f.y + f.s * 0.62, w: f.s * 1.9, fill: '#10131c' });
    face(ctx, f);
  }

  function paintCloseA(ctx) {
    paintClose(ctx, 'closeA', {
      bg: [[0, '#41567a'], [0.5, '#27344e'], [1, '#141b2a']],
      glow: 'rgba(255,240,200,0.9)',
      lights: [[96, 100, 9, 22, 0.92], [168, 60, 6, 16, 0.55], [500, 90, 12, 26, 0.5], [566, 150, 8, 18, 0.7], [610, 60, 14, 30, 0.35], [40, 190, 7, 15, 0.45]]
    });
  }

  function paintCloseB(ctx) {
    paintClose(ctx, 'closeB', {
      bg: [[0, '#4a6486'], [0.5, '#2c3d5c'], [1, '#161e2e']],
      glow: 'rgba(255,240,200,0.9)',
      lights: [[70, 70, 10, 24, 0.9], [150, 120, 7, 18, 0.55], [520, 70, 9, 22, 0.8], [596, 120, 14, 30, 0.45], [120, 220, 8, 16, 0.4], [560, 210, 6, 14, 0.5]]
    });
  }

  function paintCloseC(ctx) {
    paintClose(ctx, 'closeC', {
      bg: [[0, '#364868'], [0.5, '#222e46'], [1, '#111724']],
      glow: 'rgba(255,230,190,0.8)',
      lights: [[60, 80, 8, 20, 0.7], [140, 150, 12, 26, 0.45], [520, 60, 7, 18, 0.8], [590, 110, 10, 24, 0.55], [30, 230, 6, 13, 0.4]]
    });
  }

  function paintDesk(ctx) {
    ctx.fillStyle = '#7a7a82';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = gradient(ctx, 0, 0, W, 0, [[0, '#6c3a38'], [0.45, '#a8433c'], [1, '#6a3a3a']]);
    ctx.fillRect(0, 0, W, 215);
    ctx.fillStyle = '#d8d8dc';
    ctx.fillRect(110, 190, 150, 6);
    ctx.fillStyle = '#4b4e58';
    ctx.fillRect(150, 150, 8, 44);
    blob(ctx, 160, 138, 26, 14, '#e5e7ea');
    ctx.fillStyle = '#5a5e6a';
    ctx.fillRect(0, 190, 40, 90);
    ctx.fillStyle = '#10161f';
    ctx.fillRect(0, 252, 340, 108);
    ctx.fillStyle = gradient(ctx, 0, 0, 0, 1, [[0, '#2e5f9a'], [1, '#1e4274']]);
    ctx.fillStyle = '#2a5a98';
    ctx.fillRect(10, 245, 330, 115);
    ctx.fillStyle = 'rgba(210,230,250,0.9)';
    ctx.font = 'bold 66px Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('SIDE', 40, 270);
    ctx.fillStyle = '#1b1f2a';
    ctx.fillRect(340, 240, 300, 120);
    const f = FACES.desk;
    clothes(ctx, { x: f.x, y: f.y + f.s * 0.66, w: f.s * 1.7, fill: '#141418' });
    ctx.fillStyle = '#b08462';
    ctx.beginPath();
    ctx.moveTo(f.x - 40, f.y + f.s * 0.66);
    ctx.lineTo(f.x, f.y + f.s * 0.9);
    ctx.lineTo(f.x + 40, f.y + f.s * 0.66);
    ctx.closePath();
    ctx.fill();
    face(ctx, f);
  }

  function paintWindow(ctx) {
    ctx.fillStyle = gradient(ctx, 0, 0, 0, H, [[0, '#2f343c'], [1, '#14171c']]);
    ctx.fillRect(0, 0, W, H);
    const panes = [
      ['#c9d6e4', 20], ['#e4e8ee', 20], ['#b9c4d4', 20], ['#d5b4d8', 20], ['#d9d1ea', 20], ['#f1f0f3', 20], ['#e6a8e6', 20], ['#d7e1ee', 20]
    ];
    panes.forEach(([c], i) => {
      const x = 30 + i * 74;
      ctx.fillStyle = '#1e2126';
      ctx.fillRect(x - 6, 40, 70, 210);
      ctx.fillStyle = c;
      ctx.fillRect(x, 48, 58, 92);
      ctx.fillStyle = i % 3 === 1 ? '#ece8f3' : c;
      ctx.fillRect(x, 148, 58, 92);
      ctx.strokeStyle = 'rgba(90,60,140,0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 8, 60);
      ctx.lineTo(x + 40, 110);
      ctx.moveTo(x + 48, 60);
      ctx.lineTo(x + 14, 100);
      ctx.moveTo(x + 10, 170);
      ctx.quadraticCurveTo(x + 30, 150, x + 50, 200);
      ctx.stroke();
    });
    ctx.fillStyle = '#d65aa8';
    ctx.fillRect(500, 48, 58, 92);
    ctx.strokeStyle = '#3a1840';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(512, 60);
    ctx.lineTo(540, 100);
    ctx.moveTo(542, 60);
    ctx.lineTo(512, 112);
    ctx.stroke();
    ctx.fillStyle = '#2a2b30';
    ctx.fillRect(0, 262, W, 98);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(${60 + (i * 37) % 40},${58 + (i * 17) % 30},${56 + (i * 11) % 30},0.55)`;
      ctx.fillRect((i * 83) % W, 262 + ((i * 29) % 98), 26 + (i % 5) * 8, 10);
    }
    const x = 478;
    ctx.fillStyle = '#12151e';
    ctx.beginPath();
    ctx.moveTo(x - 38, 360);
    ctx.lineTo(x - 30, 150);
    ctx.quadraticCurveTo(x, 128, x + 30, 150);
    ctx.lineTo(x + 38, 360);
    ctx.fill();
    ctx.fillStyle = '#2b2018';
    ctx.beginPath();
    ctx.ellipse(x, 120, 17, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c4916c';
    ctx.beginPath();
    ctx.ellipse(x, 124, 11, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(48,38,34,0.8)';
    ctx.beginPath();
    ctx.ellipse(x, 133, 10, 8, 0, 0, Math.PI);
    ctx.fill();
  }

  function paintNeon(ctx) {
    ctx.fillStyle = gradient(ctx, 0, 0, 0, H, [[0, '#0d0a22'], [0.6, '#2a1740'], [1, '#4a1c58']]);
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 7; i++) {
      const x0 = 20 + i * 52;
      const y0 = 40 + i * 22;
      ctx.fillStyle = '#16151c';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + 70, y0 + 40);
      ctx.lineTo(x0 + 70, H);
      ctx.lineTo(x0 - 20, H);
      ctx.closePath();
      ctx.fill();
      for (let j = 0; j < 5; j++) {
        ctx.fillStyle = j % 2 ? '#2a2630' : 'rgba(210,70,160,0.85)';
        ctx.fillRect(x0 - 6 + j * 3, y0 + 60 + j * 38, 66, 6);
      }
    }
    ctx.save();
    ctx.shadowColor = '#ff5aa0';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#f6e6ee';
    ctx.beginPath();
    ctx.moveTo(340, 70);
    ctx.lineTo(420, 130);
    ctx.lineTo(405, 190);
    ctx.lineTo(330, 140);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff6ab0';
    ctx.fillRect(362, 80, 10, 40);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,150,60,0.9)';
    ctx.fillRect(230, 130, 40, 24);
    ctx.fillStyle = '#34303c';
    ctx.beginPath();
    ctx.moveTo(300, 250);
    ctx.lineTo(640, 215);
    ctx.lineTo(640, 245);
    ctx.lineTo(300, 275);
    ctx.fill();
    ctx.save();
    ctx.shadowColor = '#40e0ff';
    ctx.shadowBlur = 12;
    blob(ctx, 500, 190, 20, 14, '#e8f4ff');
    ctx.restore();
    ctx.fillStyle = '#ff4aa0';
    ctx.fillRect(560, 300, 50, 30);
    ctx.fillStyle = '#0c0a14';
    ctx.fillRect(430, 310, 120, 50);
  }

  function paintJohnny(ctx) {
    ctx.fillStyle = gradient(ctx, 0, 0, W, H, [[0, '#2c1a3a'], [0.5, '#4a1a3c'], [1, '#1a1030']]);
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(220,40,70,0.35)';
    ctx.fillRect(280, 0, 360, H);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `rgba(80,${120 + i * 15},200,0.25)`;
      ctx.fillRect(10 + i * 30, 20, 8, 320);
    }
    ctx.fillStyle = '#c8d6e6';
    ctx.beginPath();
    ctx.ellipse(70, 190, 30, 14, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8eef6';
    ctx.beginPath();
    ctx.moveTo(40, 190);
    ctx.lineTo(0, 170);
    ctx.lineTo(0, 215);
    ctx.fill();
    const x = 330;
    ctx.fillStyle = '#28808a';
    ctx.beginPath();
    ctx.moveTo(x - 90, 360);
    ctx.lineTo(x - 70, 200);
    ctx.quadraticCurveTo(x, 150, x + 80, 205);
    ctx.lineTo(x + 100, 360);
    ctx.fill();
    ctx.fillStyle = '#d83a50';
    ctx.beginPath();
    ctx.ellipse(x + 10, 120, 38, 48, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b1810';
    ctx.beginPath();
    ctx.ellipse(x + 6, 100, 44, 40, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 38, 100, 14, 70);
    ctx.fillRect(x + 28, 100, 16, 66);
    ctx.fillStyle = '#e8544a';
    ctx.beginPath();
    ctx.moveTo(x - 80, 232);
    ctx.lineTo(x - 168, 214);
    ctx.lineTo(x - 176, 238);
    ctx.lineTo(x - 70, 264);
    ctx.fill();
    ctx.fillStyle = '#e8b896';
    ctx.beginPath();
    ctx.moveTo(x - 168, 214);
    ctx.lineTo(x - 220, 190);
    ctx.lineTo(x - 232, 214);
    ctx.lineTo(x - 176, 238);
    ctx.fill();
    ctx.fillStyle = '#e8b896';
    ctx.fillRect(x - 232, 196, 20, 8);
  }

  function paintGuy(ctx) {
    ctx.fillStyle = gradient(ctx, 0, 0, W, H, [[0, '#6e7a8e'], [0.6, '#3e4658'], [1, '#262c3a']]);
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#4a5468';
    ctx.beginPath();
    ctx.moveTo(0, 150);
    ctx.lineTo(640, 70);
    ctx.lineTo(640, 130);
    ctx.lineTo(0, 210);
    ctx.fill();
    ctx.fillStyle = 'rgba(80,220,255,0.55)';
    ctx.fillRect(40, 170, 160, 8);
    ctx.fillStyle = 'rgba(255,90,170,0.5)';
    ctx.fillRect(300, 120, 10, 60);
    const x = 470;
    ctx.fillStyle = '#d5442e';
    ctx.beginPath();
    ctx.moveTo(x - 120, 360);
    ctx.quadraticCurveTo(x - 110, 200, x - 20, 190);
    ctx.lineTo(x + 100, 190);
    ctx.quadraticCurveTo(x + 150, 230, x + 160, 360);
    ctx.fill();
    ctx.fillStyle = '#1c1c22';
    ctx.beginPath();
    ctx.moveTo(x - 60, 360);
    ctx.quadraticCurveTo(x - 50, 260, x + 10, 250);
    ctx.lineTo(x + 90, 255);
    ctx.lineTo(x + 100, 360);
    ctx.fill();
    ctx.fillStyle = '#c99872';
    ctx.fillRect(x - 12, 150, 56, 60);
    ctx.fillStyle = gradient(ctx, x - 50, 60, x + 60, 190, [[0, '#d4a67c'], [1, '#b98a62']]);
    ctx.beginPath();
    ctx.ellipse(x + 16, 112, 46, 58, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1c14';
    ctx.beginPath();
    ctx.ellipse(x + 16, 62, 36, 14, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a1c14';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 14, 106);
    ctx.lineTo(x + 8, 102);
    ctx.moveTo(x + 28, 102);
    ctx.lineTo(x + 52, 106);
    ctx.stroke();
    ctx.fillStyle = '#e8e0d4';
    ctx.fillRect(x + 4, 126, 28, 5);
    ctx.strokeStyle = '#6a3a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 144);
    ctx.quadraticCurveTo(x + 18, 154, x + 40, 140);
    ctx.stroke();
  }

  function paintStreet(ctx, back) {
    ctx.fillStyle = gradient(ctx, 0, 0, 0, H, [[0, '#7cc7e6'], [0.55, '#bde6ee'], [1, '#d9eee8']]);
    ctx.fillRect(0, 0, W, H);
    [[0, 0, 70, 220, '#8794a6'], [76, 30, 56, 180, '#6e7d92'], [136, 90, 46, 120, '#9aa8b8'], [380, 70, 40, 140, '#8190a2'], [430, 40, 36, 170, '#6a7a8e'], [520, 80, 60, 140, '#a3b0c0']].forEach(([x, y, w, h, c]) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = 'rgba(210,235,250,0.45)';
        ctx.fillRect(x + 4 + (i % 4) * 12, y + 8 + Math.floor(i / 4) * 24, 7, 14);
      }
    });
    ctx.fillStyle = '#d6dce0';
    ctx.fillRect(0, 205, W, 40);
    ctx.fillStyle = '#6d7782';
    ctx.fillRect(0, 245, W, 115);
    ctx.fillStyle = '#9aa2a8';
    ctx.fillRect(0, 305, W, 55);
    [[560, 190], [600, 205], [30, 195]].forEach(([x, y]) => {
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(x, y, 5, 60);
      ctx.fillStyle = '#3d8a46';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.ellipse(x + 2 + Math.cos(i) * 18, y + Math.sin(i * 1.7) * 8, 18, 6, i * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.fillStyle = '#18a9b3';
    ctx.fillRect(130, 236, 510, 8);
    for (let i = 0; i < 26; i++) ctx.fillRect(138 + i * 20, 236, 4, 34);
    ctx.fillStyle = '#d9a43a';
    for (let i = 0; i < 9; i++) ctx.fillRect(330 + i * 34, 262, 24, 22);
    ctx.fillStyle = '#e9c63a';
    ctx.beginPath();
    ctx.roundRect(70, 36, 130, 250, 14);
    ctx.fill();
    ctx.fillStyle = '#f2ead2';
    ctx.fillRect(82, 62, 106, 190);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(86, 44, 98, 12);
    ctx.fillStyle = 'rgba(40,40,40,0.85)';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('REAL', 94, 70);
    ctx.fillText('WATER', 94, 92);
    ctx.fillStyle = '#c98c66';
    ctx.beginPath();
    ctx.ellipse(135, 160, 24, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1c14';
    ctx.beginPath();
    ctx.ellipse(135, 138, 25, 14, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a20';
    ctx.fillRect(95, 196, 80, 56);
    ctx.fillStyle = '#d9e8ee';
    ctx.fillRect(100, 168, 18, 30);
    ctx.fillStyle = '#2b9aa4';
    ctx.fillRect(100, 252, 90, 34);

    const x = back ? 430 : 470;
    ctx.fillStyle = '#2a2020';
    ctx.fillRect(x - 38, 270, 30, 90);
    ctx.fillRect(x + 6, 270, 30, 90);
    ctx.fillStyle = '#3a2e2a';
    ctx.fillRect(x - 38, 236, 76, 50);
    ctx.fillStyle = '#15181c';
    ctx.beginPath();
    ctx.moveTo(x - 38, 240);
    ctx.lineTo(x - 28, 140);
    ctx.lineTo(x + 28, 140);
    ctx.lineTo(x + 38, 240);
    ctx.fill();
    ctx.fillStyle = '#c28a62';
    ctx.fillRect(x - 6, 120, 12, 24);
    ctx.fillStyle = '#c28a62';
    if (back) {
      ctx.beginPath();
      ctx.ellipse(x, 100, 22, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a1c14';
      ctx.beginPath();
      ctx.ellipse(x, 98, 26, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 24, 96, 48, 54);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(x - 12, 176, 24, 20);
      ctx.fillStyle = '#c28a62';
      ctx.beginPath();
      ctx.moveTo(x + 34, 150);
      ctx.lineTo(x + 130, 128);
      ctx.lineTo(x + 134, 142);
      ctx.lineTo(x + 36, 176);
      ctx.fill();
      ctx.fillRect(x - 80, 150, 46, 14);
    } else {
      ctx.beginPath();
      ctx.ellipse(x, 100, 22, 28, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a1c14';
      ctx.beginPath();
      ctx.ellipse(x, 84, 30, 22, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 28, 84, 10, 62);
      ctx.fillRect(x + 20, 84, 10, 62);
      ctx.fillStyle = '#10141a';
      ctx.fillRect(x - 18, 98, 36, 8);
      ctx.fillStyle = '#c28a62';
      ctx.beginPath();
      ctx.moveTo(x - 32, 150);
      ctx.lineTo(x - 70, 80);
      ctx.lineTo(x - 56, 72);
      ctx.lineTo(x - 18, 140);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 30, 150);
      ctx.lineTo(x + 78, 90);
      ctx.lineTo(x + 92, 98);
      ctx.lineTo(x + 40, 168);
      ctx.fill();
    }
  }

  const PAINTERS = {
    streetFront: ctx => paintStreet(ctx, false),
    streetBack: ctx => paintStreet(ctx, true),
    closeA: paintCloseA,
    closeB: paintCloseB,
    closeC: paintCloseC,
    desk: paintDesk,
    window: paintWindow,
    neon: paintNeon,
    johnny: paintJohnny,
    guy: paintGuy
  };

  function sceneDrawer(name) {
    return (ctx) => PAINTERS[name](ctx);
  }

  function mouthDrawer(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#2a0f10';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.46, h * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a2a2c';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.78, w * 0.3, h * 0.2, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8d0c4';
    ctx.fillRect(w * 0.22, h * 0.1, w * 0.56, h * 0.14);
  }

  function ratingDrawer(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#111';
    ctx.fillRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(5, 5, w - 10, 12);
    ctx.fillStyle = '#111';
    ctx.font = 'bold 8px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MATURE 17+', w / 2, 11);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.fillText('M', w / 2, h * 0.55);
    ctx.fillStyle = '#fff';
    ctx.fillRect(5, h - 15, w - 10, 11);
    ctx.fillStyle = '#111';
    ctx.font = 'bold 8px Arial, sans-serif';
    ctx.fillText('ESRB', w / 2, h - 9.5);
  }

  function logoDrawer(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = '#f4e43a';
    ctx.font = 'italic bold 17px Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('CYBERPUNK', 4, 2);
    ctx.font = 'bold 7px Arial, sans-serif';
    ctx.fillText('2 0 7 7', 62, 22);
    ctx.restore();
  }

  function captionDrawer(text) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f6f6f6';
      ctx.font = '30px "Times New Roman", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, w / 2, h / 2);
    };
  }

  window.KeanuArt = { W, H, FACES, sceneDrawer, mouthDrawer, ratingDrawer, logoDrawer, captionDrawer };
})();
