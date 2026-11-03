(function () {
  const { rand } = window.P3D;
  const PI = Math.PI;

  const SPEC = {
    walt: { iris: '#5e6a54', brow: '#9a7a5c', browW: 3.0, browArch: 1.4, lip: '#a8645a', lipLow: '#b8786a', beard: { col: '#8c5e3c', grey: '#c8b8a0', kind: 'goatee' }, age: 0.85, shine: 0.32, scalp: 'bald', fringe: { col: 'rgba(120,95,75,0.18)', top: 34, dense: 0.6 }, eyeH: 3.0 },
    hank: { iris: '#6a6048', brow: '#7a5a40', browW: 3.8, browArch: 1.6, lip: '#b0685c', lipLow: '#c07a6c', age: 0.55, shine: 0.36, scalp: 'bald', heavy: true },
    jesse: { iris: '#6a86a0', brow: '#7a5a40', browW: 3.2, browArch: 1.2, lip: '#b8766a', lipLow: '#c88a7c', age: 0.15, shine: 0, scalp: 'crew', hair: '#7a5c40', stubble: 'rgba(110,80,60,0.16)', stubbleZone: 'light' },
    saul: { iris: '#5a4a38', brow: '#5a3e2a', browW: 3.4, browArch: 2.4, lip: '#a86458', lipLow: '#b8786a', age: 0.45, shine: 0.08, scalp: 'comb', hair: '#6a4a30' },
    mike: { iris: '#6a7a88', brow: '#d0ccc4', browW: 3.4, browArch: 1.0, lip: '#a46a5e', lipLow: '#b47a6c', age: 1.0, shine: 0.28, scalp: 'bald', fringe: { col: 'rgba(225,222,215,0.85)', top: 26 }, stubble: 'rgba(230,228,222,0.42)', stubbleDense: 0.9, bags: 1 },
    gus: { iris: '#2a1a12', brow: '#1a1210', browW: 3.2, browArch: 1.8, lip: '#5a3226', lipLow: '#6a3a2c', age: 0.4, shine: 0.1, scalp: 'buzz', hair: '#1a1614', dark: true },
    gomez: { iris: '#2a1a12', brow: '#1e1612', browW: 3.6, browArch: 1.6, lip: '#8a5040', lipLow: '#9a5a4a', age: 0.4, shine: 0.05, scalp: 'short', hair: '#1a1410', beard: { col: '#2a2018', grey: '#3a3028', kind: 'goatee' } },
    eladio: { iris: '#3a2a1a', brow: '#4a3420', browW: 3.4, browArch: 2.0, lip: '#9a5a48', lipLow: '#aa6a58', age: 0.5, shine: 0.1, scalp: 'swept', hair: '#5a4030' },
    doctor: { iris: '#3a2a1a', brow: '#1e1612', browW: 4.0, browArch: 1.8, lip: '#a46050', lipLow: '#b46e5e', age: 0.35, shine: 0.05, scalp: 'short', hair: '#1c1612', beard: { col: '#2a221c', grey: '#4a4038', kind: 'full' } },
    pete: { iris: '#4a5a6a', brow: '#5a4030', browW: 3.0, browArch: 1.4, lip: '#b07468', lipLow: '#c08478', age: 0.1, shine: 0, scalp: 'beanie', hair: '#1a1a1c', stubble: 'rgba(100,70,50,0.3)' },
    badger: { iris: '#5a6a5a', brow: '#8a6a40', browW: 3.0, browArch: 1.4, lip: '#b8786a', lipLow: '#c88a7c', age: 0.1, shine: 0, scalp: 'beanie', hair: '#2a2a2c', stubble: 'rgba(150,110,70,0.3)' },
    lady: { iris: '#4a5a6a', brow: '#8a7050', browW: 2.6, browArch: 2.4, lip: '#b85a5a', lipLow: '#c86a6a', age: 0.2, shine: 0, scalp: 'long', hair: '#d8c08a' },
    old: { iris: '#5a5a5a', brow: '#c8c4bc', browW: 3.0, browArch: 1.2, lip: '#a46a5e', lipLow: '#b47a6c', age: 1.0, shine: 0.2, scalp: 'bald', fringe: { col: 'rgba(200,198,190,0.8)', top: 30 }, bags: 1 }
  };

  function hex(c) {
    return '#' + c.toString(16).padStart(6, '0');
  }

  function rgbOf(c) {
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  }

  function mix(c, k, t) {
    const a = rgbOf(c), b = rgbOf(k);
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
  }

  function rgba(c, a) {
    const v = rgbOf(c);
    return `rgba(${v[0]},${v[1]},${v[2]},${a})`;
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

  function line(ctx, pts, w, col) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 3) ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
    else if (pts.length === 4) ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
    else pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.stroke();
  }

  function frame(H, w, h) {
    const ppr = w / (2 * PI);
    const M = {
      ppr,
      sx: ppr / (1000 * H.rx),
      sy: ppr / (1000 * H.ry),
      X: (yaw) => yaw * H.rx * 1000,
      Y: (pit) => -pit * H.ry * 1000,
      eyeX: H.eyeX * H.rx * 1000,
      eyeY: -H.eyeY * H.ry * 1000,
      mouthY: -H.mouth * H.ry * 1000,
      cornerX: H.corner * H.rx * 1000,
      tipY: -H.nose.tip * H.ry * 1000,
      baseY: -H.nose.base * H.ry * 1000,
      noseW: H.nose.w * H.rx * 1000,
      chinY: 0.98 * H.ry * 1000,
      backX: PI * H.rx * 1000,
      topY: -PI / 2 * H.ry * 1000
    };
    M.apply = (ctx, shift) => ctx.setTransform(M.sx, 0, 0, M.sy, PI * ppr + (shift || 0), (PI / 2) * ppr);
    return M;
  }

  function stubble(ctx, g, M, inside, n, col, len, dense) {
    ctx.fillStyle = col;
    const k = dense || 1;
    for (let i = 0; i < n * k; i++) {
      const x = (g() * 2 - 1) * 95, y = g() * 140 - 40;
      if (!inside(x, y)) continue;
      ctx.fillRect(x, y, len * (0.6 + g() * 0.6), len * (0.8 + g() * 0.8));
    }
  }

  function eye(ctx, M, P, s, opts) {
    const cx = s * M.eyeX, cy = M.eyeY;
    const w = opts.w || 13.2, hh = opts.h || P.eyeH || 3.5;
    const inner = cx - s * w, outer = cx + s * w;
    soft(ctx, cx - s * 1, cy - 4, w * 1.55, 13, 'rgba(60,25,20,A)', P.dark ? 0.45 : 0.42);
    soft(ctx, cx - s * 3, cy - 2, w * 0.7, 7, 'rgba(50,20,15,A)', 0.3);
    soft(ctx, cx + s * 2, cy + 7, w * 1.1, 5.5, 'rgba(90,40,40,A)', 0.22 + 0.2 * (P.bags || 0));
    ctx.fillStyle = '#efe6dc';
    ctx.beginPath();
    ctx.moveTo(inner, cy + 0.6);
    ctx.bezierCurveTo(inner + s * w * 0.45, cy - hh * 1.35, outer - s * w * 0.4, cy - hh * 1.25, outer, cy - 0.4);
    ctx.bezierCurveTo(outer - s * w * 0.45, cy + hh * 1.05, inner + s * w * 0.45, cy + hh * 1.1, inner, cy + 0.6);
    ctx.fill();
    ctx.save();
    ctx.clip();
    soft(ctx, inner, cy, 5, 4, 'rgba(200,110,100,A)', 0.55);
    soft(ctx, outer, cy, 4, 4, 'rgba(190,120,110,A)', 0.35);
    const ix = cx + s * (opts.look || 0) - s * 0.6, iy = cy + 0.2;
    ctx.fillStyle = P.iris;
    ctx.beginPath();
    ctx.ellipse(ix, iy, 5.6, 5.8, 0, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,14,10,0.6)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.fillStyle = '#0a0806';
    ctx.beginPath();
    ctx.ellipse(ix, iy, 2.3, 2.4, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.ellipse(ix + 1.6, iy - 1.8, 1.1, 1.1, 0, 0, PI * 2);
    ctx.fill();
    soft(ctx, cx, cy - hh * 1.4, w * 1.1, hh * 1.1, 'rgba(60,30,20,A)', 0.55);
    ctx.restore();
    const lidCol = P.dark ? '#20140e' : '#3a2018';
    line(ctx, [[inner + s * 0.5, cy + 0.2], [inner + s * w * 0.45, cy - hh * 1.4], [outer - s * w * 0.4, cy - hh * 1.3], [outer + s * 1.2, cy - 0.2]], 1.9, lidCol);
    line(ctx, [[inner + s * 1.5, cy + 1.0], [cx, cy + hh * 1.15], [outer - s * 1, cy + 0.2]], 0.8, 'rgba(90,40,30,0.55)');
    line(ctx, [[inner - s * 1, cy - 3.2], [inner + s * w * 0.5, cy - hh * 2.6], [outer - s * w * 0.3, cy - hh * 2.4], [outer + s * 2, cy - 2.2]], 1.0, 'rgba(90,45,35,0.45)');
    if (P.age > 0.4) {
      for (let i = 0; i < 3; i++) line(ctx, [[outer + s * 3, cy + 1 - i * 2.6], [outer + s * 7, cy + 1.5 - i * 3.4], [outer + s * 11, cy + 2 - i * 4.4]], 0.7, `rgba(110,60,45,${0.25 * P.age})`);
      line(ctx, [[inner + s * 2, cy + hh * 1.9], [cx, cy + hh * 2.9], [outer, cy + hh * 1.9]], 0.9, `rgba(110,60,45,${0.3 * P.age})`);
    }
    if (P.bags) {
      line(ctx, [[inner + s * 3, cy + hh * 2.2], [cx, cy + hh * 3.8], [outer + s * 2, cy + hh * 2.2]], 1.4, 'rgba(100,55,45,0.35)');
      line(ctx, [[inner + s * 5, cy + hh * 3.6], [cx + s * 2, cy + hh * 5.2], [outer + s * 3, cy + hh * 3.2]], 1.0, 'rgba(100,55,45,0.25)');
    }
  }

  function brow(ctx, M, P, s) {
    const cx = s * M.eyeX, cy = M.eyeY - 13;
    const g = rand(s > 0 ? 11 : 17);
    ctx.lineCap = 'round';
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = cx - s * 16 + s * 34 * t;
      const y = cy - P.browArch * Math.sin(t * PI * 0.85) + (t > 0.85 ? (t - 0.85) * 18 : 0);
      pts.push([x, y, P.browW * (1.15 - 0.6 * t)]);
    }
    pts.forEach(([x, y, wd], i) => {
      for (let k = 0; k < 9; k++) {
        ctx.strokeStyle = P.brow;
        ctx.globalAlpha = 0.5 + g() * 0.4;
        ctx.lineWidth = 0.7;
        const ox = (g() - 0.5) * 3, oy = (g() - 0.5) * wd;
        ctx.beginPath();
        ctx.moveTo(x + ox, y + oy);
        ctx.lineTo(x + ox + s * 2.6, y + oy - 0.8);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }

  function structure(ctx, M, P) {
    const dk = P.dark ? 'rgba(40,18,10,A)' : 'rgba(95,45,35,A)';
    [-1, 1].forEach(s => {
      soft(ctx, s * M.noseW * 1.1, M.tipY - 6, M.noseW * 0.5, (M.tipY - M.eyeY) * 0.35, dk, 0.1);
      soft(ctx, s * 44, M.baseY + 4, 16, 20, dk, 0.16);
      soft(ctx, s * 52, M.eyeY + 20, 22, 9, 'rgba(255,225,205,A)', P.dark ? 0.06 : 0.14);
      soft(ctx, s * 66, M.mouthY + 26, 14, 34, dk, 0.2);
      soft(ctx, s * (M.eyeX + 10), M.eyeY - 22, 20, 8, 'rgba(255,230,210,A)', P.dark ? 0.05 : 0.1);
    });
    soft(ctx, 0, M.eyeY - 30, 34, 12, 'rgba(255,235,220,A)', P.dark ? 0.06 : 0.14);
    soft(ctx, 0, M.tipY - 3, M.noseW * 0.45, 5, 'rgba(255,235,220,A)', P.dark ? 0.1 : 0.22);
    soft(ctx, 0, M.chinY - 10, 26, 12, 'rgba(255,225,205,A)', P.dark ? 0.04 : 0.1);
    soft(ctx, 0, M.chinY + 18, 70, 18, dk, 0.35);
  }

  function nose(ctx, M, P) {
    const by = M.baseY, w = M.noseW;
    soft(ctx, 0, M.tipY - 2, w * 0.9, 9, P.dark ? 'rgba(120,60,40,A)' : 'rgba(200,90,80,A)', 0.18);
    [-1, 1].forEach(s => {
      ctx.fillStyle = P.dark ? '#24140c' : '#4a2018';
      ctx.beginPath();
      ctx.ellipse(s * w * 0.42, by - 1.5, w * 0.24, 1.8, s * 0.35, 0, PI * 2);
      ctx.fill();
      line(ctx, [[s * w * 0.95, by - 7], [s * w * 1.18, by - 3], [s * w * 0.9, by + 0.5]], 1.1, P.dark ? 'rgba(40,20,12,0.6)' : 'rgba(110,50,40,0.5)');
    });
    soft(ctx, 0, by + 1.5, w * 0.7, 2.5, 'rgba(90,40,30,A)', 0.25);
  }

  function folds(ctx, M, P, k) {
    [-1, 1].forEach(s => {
      line(ctx, [[s * M.noseW * 1.15, M.baseY - 4], [s * (M.cornerX + 8), M.baseY + 6], [s * (M.cornerX + 5), M.mouthY + 4]], 1.6 + k, `rgba(100,50,40,${0.3 + 0.25 * k})`);
      soft(ctx, s * (M.cornerX + 9), M.baseY + 8, 7, 12, 'rgba(110,55,45,A)', 0.12 + 0.1 * k);
    });
  }

  function lips(ctx, M, P) {
    const my = M.mouthY, cx = M.cornerX;
    ctx.fillStyle = P.lip;
    ctx.beginPath();
    ctx.moveTo(-cx - 1, my);
    ctx.bezierCurveTo(-cx * 0.6, my - 2.8, -cx * 0.3, my - 4.4, -2.5, my - 3.4);
    ctx.quadraticCurveTo(0, my - 2.6, 2.5, my - 3.4);
    ctx.bezierCurveTo(cx * 0.3, my - 4.4, cx * 0.6, my - 2.8, cx + 1, my);
    ctx.quadraticCurveTo(0, my + 0.6, -cx - 1, my);
    ctx.fill();
    ctx.fillStyle = P.lipLow;
    ctx.beginPath();
    ctx.moveTo(-cx + 1, my + 0.2);
    ctx.quadraticCurveTo(-cx * 0.5, my + 4.6, 0, my + 4.8);
    ctx.quadraticCurveTo(cx * 0.5, my + 4.6, cx - 1, my + 0.2);
    ctx.quadraticCurveTo(0, my + 0.8, -cx + 1, my + 0.2);
    ctx.fill();
    soft(ctx, 0, my + 2.6, cx * 0.45, 1.4, 'rgba(255,220,210,A)', 0.25);
    line(ctx, [[-cx - 1.5, my + 0.2], [-cx * 0.4, my + 0.9], [0, my + 0.4], [cx * 0.4, my + 0.9], [cx + 1.5, my + 0.2]], 1.1, P.dark ? '#1a0c08' : '#5a2420');
    soft(ctx, 0, my + 8.5, cx * 0.6, 3, 'rgba(90,40,30,A)', 0.2);
    line(ctx, [[-2.2, M.baseY + 2], [-2.6, my - 4]], 0.9, 'rgba(110,55,45,0.28)');
    line(ctx, [[2.2, M.baseY + 2], [2.6, my - 4]], 0.9, 'rgba(110,55,45,0.28)');
  }

  function goatee(ctx, g, M, B, H, dense) {
    const my = M.mouthY, cx = M.cornerX;
    const hair = (x, y, len, ang) => {
      ctx.strokeStyle = g() < 0.28 ? B.grey : B.col;
      ctx.globalAlpha = 0.55 + g() * 0.4;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(ang) * len, y + Math.cos(ang) * len);
      ctx.stroke();
    };
    ctx.fillStyle = B.col;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(-cx - 3, my + 1);
    ctx.quadraticCurveTo(-cx - 1, my - 8, -6, my - 9.5);
    ctx.quadraticCurveTo(0, my - 8.5, 6, my - 9.5);
    ctx.quadraticCurveTo(cx + 1, my - 8, cx + 3, my + 1);
    ctx.lineTo(cx + 6, my + 6);
    ctx.quadraticCurveTo(cx + 17, my + 20, cx + 10, my + 36);
    ctx.quadraticCurveTo(cx + 2, my + 50, 0, my + 51);
    ctx.quadraticCurveTo(-cx - 2, my + 50, -cx - 10, my + 36);
    ctx.quadraticCurveTo(-cx - 17, my + 20, -cx - 6, my + 6);
    ctx.closePath();
    ctx.moveTo(-cx + 1, my + 0.5);
    ctx.quadraticCurveTo(0, my + 5.5, cx - 1, my + 0.5);
    ctx.quadraticCurveTo(0, my - 4.2, -cx + 1, my + 0.5);
    ctx.fill('evenodd');
    ctx.globalAlpha = 1;
    for (let i = 0; i < 4200 * dense; i++) {
      const x = (g() * 2 - 1) * (cx + 15);
      const y = my - 10 + g() * 62;
      const inMouth = Math.abs(x) < cx && y > my - 4 && y < my + 5.5;
      const stache = y < my + 1 && y > my - 10 && Math.abs(x) < cx + 4 && !inMouth;
      const width = y < my + 6 ? cx + 5 : (cx + 13) * Math.sqrt(Math.max(0, 1 - Math.pow((y - my - 20) / 31, 2)));
      const chin = y >= my + 5 && Math.abs(x) < width;
      if (!(stache || chin)) continue;
      hair(x, y, 2 + g() * 2.5, stache ? (x < 0 ? -0.9 : 0.9) : (g() - 0.5) * 0.5);
    }
    ctx.globalAlpha = 1;
  }

  function fullBeard(ctx, g, M, B) {
    const my = M.mouthY, cx = M.cornerX;
    ctx.fillStyle = B.col;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(-95, -5);
    ctx.quadraticCurveTo(-88, 40, -62, 70);
    ctx.quadraticCurveTo(-30, 102, 0, 104);
    ctx.quadraticCurveTo(30, 102, 62, 70);
    ctx.quadraticCurveTo(88, 40, 95, -5);
    ctx.lineTo(75, -5);
    ctx.quadraticCurveTo(70, 26, 44, 34);
    ctx.quadraticCurveTo(20, my - 12, 0, my - 9);
    ctx.quadraticCurveTo(-20, my - 12, -44, 34);
    ctx.quadraticCurveTo(-70, 26, -75, -5);
    ctx.closePath();
    ctx.moveTo(-cx + 1, my + 0.5);
    ctx.quadraticCurveTo(0, my + 5.5, cx - 1, my + 0.5);
    ctx.quadraticCurveTo(0, my - 4.2, -cx + 1, my + 0.5);
    ctx.fill('evenodd');
    ctx.globalAlpha = 1;
    for (let i = 0; i < 5000; i++) {
      const x = (g() * 2 - 1) * 92, y = g() * 110 - 5;
      if (Math.abs(x) < cx && y > my - 4 && y < my + 5.5) continue;
      const r = Math.hypot(x / 92, (y - 40) / 66);
      const inner = Math.hypot(x / 70, (y - 10) / 40);
      if (r > 1 || (inner < 1 && y < my - 9)) continue;
      ctx.strokeStyle = g() < 0.15 ? B.grey : B.col;
      ctx.globalAlpha = 0.5 + g() * 0.4;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (g() - 0.5) * 2, y + 2 + g() * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function scalpHair(ctx, g, M, P, H) {
    const col = P.hair;
    if (P.scalp === 'crew' || P.scalp === 'buzz' || P.scalp === 'short' || P.scalp === 'swept' || P.scalp === 'comb' || P.scalp === 'long') {
      const front = P.scalp === 'crew' ? -66 : P.scalp === 'buzz' ? -78 : P.scalp === 'comb' ? -70 : P.scalp === 'long' ? -72 : -74;
      ctx.fillStyle = col;
      ctx.globalAlpha = P.scalp === 'buzz' ? 0.85 : 0.95;
      ctx.beginPath();
      ctx.moveTo(-260, -200);
      ctx.lineTo(260, -200);
      ctx.lineTo(260, P.scalp === 'long' ? 60 : 10);
      ctx.lineTo(M.backX * 0.62, P.scalp === 'long' ? 60 : 12);
      ctx.quadraticCurveTo(M.backX * 0.5, -6, M.backX * 0.44, -16);
      ctx.lineTo(M.backX * 0.4, 6);
      ctx.quadraticCurveTo(M.backX * 0.36, -30, 52, front + 8);
      ctx.quadraticCurveTo(26, front - 4, 0, front);
      ctx.quadraticCurveTo(-26, front - 4, -52, front + 8);
      ctx.quadraticCurveTo(-M.backX * 0.36, -30, -M.backX * 0.4, 6);
      ctx.lineTo(-M.backX * 0.44, -16);
      ctx.quadraticCurveTo(-M.backX * 0.5, -6, -M.backX * 0.62, P.scalp === 'long' ? 60 : 12);
      ctx.lineTo(-260, P.scalp === 'long' ? 60 : 10);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      const n = P.scalp === 'buzz' ? 9000 : 7000;
      for (let i = 0; i < n; i++) {
        const x = (g() * 2 - 1) * 240, y = -180 + g() * 200;
        const edge = Math.abs(x) < 52 ? front : Math.abs(x) < M.backX * 0.4 ? front + 8 + (Math.abs(x) - 52) / (M.backX * 0.4 - 52) * 0 : -16;
        if (y > edge + 2 && Math.abs(x) < M.backX * 0.4) continue;
        if (y > 14 && Math.abs(x) >= M.backX * 0.4) continue;
        ctx.strokeStyle = g() < 0.5 ? mix(parseInt(col.slice(1), 16), 0x000000, 0.35) : mix(parseInt(col.slice(1), 16), 0xffffff, 0.18);
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = P.scalp === 'buzz' ? 0.5 : 0.8;
        const len = P.scalp === 'buzz' ? 1.2 : P.scalp === 'crew' ? 2.4 : 4.5;
        const ang = P.scalp === 'comb' || P.scalp === 'swept' ? (P.scalp === 'comb' ? 1.4 : 2.9) + (g() - 0.5) * 0.4 : g() * PI * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (P.scalp === 'comb') {
        line(ctx, [[-36, -200], [-34, -120], [-30, front - 6]], 1.4, 'rgba(30,18,10,0.6)');
        for (let i = 0; i < 26; i++) line(ctx, [[-30 + i * 3, front + 2], [-10 + i * 4, front - 40], [10 + i * 5, -150]], 0.9, 'rgba(40,24,14,0.35)');
      }
    }
    if (P.fringe) {
      const fr = P.fringe;
      for (let i = 0; i < 16000 * (fr.dense || 1); i++) {
        const s = g() < 0.5 ? -1 : 1;
        const u = g();
        const x = s * (M.backX * 0.4 + u * M.backX * 0.62);
        const top = -fr.top - 12 * Math.sin(u * PI * 0.5);
        const y = top + g() * (fr.top + 34 + 10 * u);
        const fade = Math.min(1, (y - top) / 8) * Math.min(1, (Math.abs(x) - M.backX * 0.4) / 10) * Math.min(1, (40 - y) / 10);
        if (fade <= 0) continue;
        ctx.strokeStyle = fr.col;
        ctx.globalAlpha = fade;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (g() - 0.5) * 2, y + 1.6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  function bruise(ctx, M) {
    soft(ctx, -M.eyeX - 4, M.eyeY + 4, 16, 13, 'rgba(110,50,90,A)', 0.45);
    soft(ctx, -M.eyeX - 8, M.eyeY + 12, 14, 10, 'rgba(150,140,60,A)', 0.3);
    soft(ctx, M.eyeX + 22, M.eyeY + 30, 12, 10, 'rgba(120,50,70,A)', 0.3);
    line(ctx, [[-M.eyeX - 14, M.eyeY - 22], [-M.eyeX - 8, M.eyeY - 25], [-M.eyeX - 2, M.eyeY - 24]], 1.2, 'rgba(140,30,30,0.7)');
    line(ctx, [[8, M.mouthY + 3], [11, M.mouthY + 6]], 1.4, 'rgba(130,30,30,0.6)');
  }

  function paint(who, H, variant, skin) {
    const P = SPEC[who];
    return (ctx, w, h) => {
      const M = frame(H, w, h);
      const g = rand(who.length * 977 + w);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = hex(skin);
      ctx.fillRect(0, 0, w, h);
      M.apply(ctx);
      soft(ctx, 0, 30, 70, 50, P.dark ? 'rgba(130,70,50,A)' : 'rgba(205,110,95,A)', 0.16);
      [-1, 1].forEach(s => soft(ctx, s * 50, 18, 26, 22, P.dark ? 'rgba(120,60,45,A)' : 'rgba(210,105,90,A)', 0.14));
      soft(ctx, 0, M.chinY + 30, 90, 30, 'rgba(70,35,25,A)', 0.25);
      if (P.shine) {
        soft(ctx, -14, -95, 46, 40, 'rgba(255,240,225,A)', P.shine);
        soft(ctx, -10, -60, 22, 14, 'rgba(255,245,235,A)', P.shine * 0.7);
      }
      if (P.age > 0.3) {
        for (let i = 0; i < 4; i++) {
          const y = M.eyeY - 34 - i * 7.5;
          line(ctx, [[-34 + i * 2, y + 2], [-12, y - 1.5], [12, y - 1.5], [34 - i * 2, y + 2]], 0.9, `rgba(120,65,50,${0.2 * P.age})`);
        }
        line(ctx, [[-4, M.eyeY - 14], [-3, M.eyeY - 24]], 1, `rgba(120,60,45,${0.3 * P.age})`);
        line(ctx, [[4, M.eyeY - 14], [3, M.eyeY - 24]], 1, `rgba(120,60,45,${0.3 * P.age})`);
      }
      if (P.heavy) {
        [-1, 1].forEach(s => {
          line(ctx, [[s * (M.cornerX + 4), M.mouthY + 6], [s * (M.cornerX + 12), M.mouthY + 22], [s * (M.cornerX + 8), M.mouthY + 36]], 1.4, 'rgba(110,55,45,0.25)');
          soft(ctx, s * 58, M.mouthY + 18, 22, 24, 'rgba(120,60,50,A)', 0.12);
        });
        line(ctx, [[-28, M.chinY + 6], [0, M.chinY + 12], [28, M.chinY + 6]], 1.6, 'rgba(110,55,45,0.3)');
      }
      scalpHair(ctx, g, M, P, H);
      if (P.stubble) {
        const light = P.stubbleZone === 'light';
        const inside = (x, y) => {
          const jaw = y > (light ? M.mouthY - 10 : M.baseY - 2) && Math.abs(x) < 88 - Math.max(0, y - 60) * 0.6;
          const cheek = !light && y > M.eyeY + 22 && Math.abs(x) > 38 && Math.abs(x) < 96;
          const lipsZ = Math.abs(x) < M.cornerX + 1 && y > M.mouthY - 4 && y < M.mouthY + 5;
          return (jaw || cheek) && !lipsZ && y < 118;
        };
        stubble(ctx, g, M, inside, 26000, P.stubble, 0.9, P.stubbleDense);
      }
      structure(ctx, M, P);
      [-1, 1].forEach(s => brow(ctx, M, P, s));
      [-1, 1].forEach(s => eye(ctx, M, P, s, {}));
      nose(ctx, M, P);
      folds(ctx, M, P, P.age);
      lips(ctx, M, P);
      if (P.beard && P.beard.kind === 'goatee') goatee(ctx, g, M, P.beard, H, 1);
      if (P.beard && P.beard.kind === 'full') fullBeard(ctx, g, M, P.beard);
      if (variant === 'bruise') bruise(ctx, M);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    };
  }

  window.BreakFaces = { SPEC, paint, frame };
})();
